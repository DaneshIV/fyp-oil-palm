# backend/routes/disease.py — FULL FIXED VERSION
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import get_db, SessionLocal
from backend.schemas.schemas import DiseaseDetection, DiseaseDetectionCreate
from typing import List
from datetime import datetime
import shutil
import base64
import cv2
import numpy as np
from pathlib import Path

router = APIRouter(
    prefix="/disease",
    tags=["Disease"],
)

UPLOAD_DIR = Path("captured_images")
UPLOAD_DIR.mkdir(exist_ok=True)

CLASSES  = ["healthy", "ganoderma", "unhealthy", "immature"]
SEVERITY = {
    "healthy":   "None",
    "ganoderma": "High",
    "unhealthy": "Medium",
    "immature":  "Low",
}
CLASS_COLORS_BGR = {
    "healthy":   (52, 211, 153),
    "ganoderma": (94,  63, 244),
    "unhealthy": (11, 158, 245),
    "immature":  (241, 102, 99),
}

# Load model once at startup
_disease_model = None

def get_disease_model():
    global _disease_model
    if _disease_model is None:
        from ultralytics import YOLO
        _disease_model = YOLO("ai_model/models/best_v4.pt")
        print("Disease model loaded: best_v4.pt")
    return _disease_model

@router.get("/history", response_model=List[DiseaseDetection])
def get_disease_history(limit: int = Query(20), db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM disease_detections ORDER BY timestamp DESC LIMIT :limit"),
        {"limit": limit}
    ).fetchall()
    return result

@router.get("/latest", response_model=DiseaseDetection)
def get_latest_disease(db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM disease_detections ORDER BY timestamp DESC LIMIT 1")
    ).fetchone()
    return result

@router.post("/", response_model=DiseaseDetection)
def log_disease_detection(data: DiseaseDetectionCreate, db: Session = Depends(get_db)):
    db.execute(
        text("""INSERT INTO disease_detections
            (image_path, disease_label, confidence, severity, tree_id, block_id)
            VALUES (:image_path, :disease_label, :confidence, :severity, :tree_id, :block_id)"""),
        data.dict()
    )
    db.commit()
    result = db.execute(
        text("SELECT * FROM disease_detections ORDER BY id DESC LIMIT 1")
    ).fetchone()
    return result

@router.post("/detect")
async def detect_disease(file: UploadFile = File(...)):
    """
    Accept image upload, run YOLOv8n v4 inference,
    return detections with bounding boxes drawn on image.
    Returns:
        - detections: list of {label, confidence, bbox}
        - image_base64: annotated image as base64 JPEG
        - best_detection: highest confidence detection
    """
    try:
        # Save uploaded image
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"upload_{timestamp}_{file.filename}"
        filepath  = UPLOAD_DIR / filename

        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)

        # Load image with OpenCV for annotation
        img_array = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            return {"success": False, "error": "Cannot decode image"}

        # Run YOLOv8n v4 inference
        model   = get_disease_model()
        results = model(str(filepath), conf=0.5, iou=0.45, verbose=False)

        detections = []

        for r in results:
            for box in r.boxes:
                cls_id   = int(box.cls[0])
                conf     = float(box.conf[0])
                cls_name = CLASSES[cls_id] if cls_id < len(CLASSES) else "unknown"
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # Draw bounding box on frame
                color = CLASS_COLORS_BGR.get(cls_name, (200, 200, 200))
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                # Draw label background
                label_text = f"{cls_name} {conf:.0%}"
                (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
                cv2.rectangle(frame, (x1, y1 - th - 10), (x1 + tw + 6, y1), color, -1)
                cv2.putText(frame, label_text, (x1 + 3, y1 - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 1)

                detections.append({
                    "label":      cls_name,
                    "confidence": round(conf * 100, 1),
                    "severity":   SEVERITY.get(cls_name, "None"),
                    "bbox":       [x1, y1, x2, y2],
                })

        # Sort by confidence
        detections.sort(key=lambda x: x["confidence"], reverse=True)

        # Encode annotated frame to base64
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        image_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

        # Best detection
        best = detections[0] if detections else {
            "label": "healthy", "confidence": 0.0, "severity": "None", "bbox": []
        }

        # Save to database (best detection)
        try:
            db = SessionLocal()
            db.execute(text("""INSERT INTO disease_detections
                (image_path, disease_label, confidence, severity, tree_id, block_id)
                VALUES (:image_path, :disease_label, :confidence, :severity, :tree_id, :block_id)"""),
                {
                    "image_path":    str(filepath),
                    "disease_label": best["label"],
                    "confidence":    best["confidence"],
                    "severity":      best["severity"],
                    "tree_id":       "manual",
                    "block_id":      "test",
                }
            )
            db.commit()
            db.close()
        except Exception as db_err:
            print(f"DB save error: {db_err}")

        return {
            "success":          True,
            "image_path":       str(filepath),
            "image_base64":     image_b64,
            "detections":       detections,
            "best_detection":   best,
            "total_detections": len(detections),
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "detections": [], "image_base64": None}