from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import get_db, SessionLocal
from backend.schemas.schemas import DiseaseDetection, DiseaseDetectionCreate
from typing import List
from datetime import datetime
import shutil
from pathlib import Path

router = APIRouter(prefix="/disease", tags=["Disease"])

UPLOAD_DIR = Path("captured_images")
UPLOAD_DIR.mkdir(exist_ok=True)

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
    """Accept image upload and run YOLOv8 inference"""
    try:
        # Save uploaded image
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"upload_{timestamp}_{file.filename}"
        filepath  = UPLOAD_DIR / filename

        with open(filepath, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Run inference
        from ultralytics import YOLO
        model   = YOLO("ai_model/models/best_v3.pt")
        results = model(str(filepath), conf=0.5, iou=0.45, verbose=False)

        CLASSES  = ["healthy", "ganoderma", "unhealthy", "immature"]
        SEVERITY = {
            "healthy":   "None",
            "ganoderma": "High",
            "unhealthy": "Medium",
            "immature":  "Low"
        }

        detections = []
        for r in results:
            for box in r.boxes:
                cls_name = CLASSES[int(box.cls[0])]
                conf     = float(box.conf[0])
                detections.append({
                    "class_name": cls_name,
                    "confidence": round(conf * 100, 1),
                    "severity":   SEVERITY[cls_name]
                })

        # Get best detection
        if detections:
            best = max(detections, key=lambda x: x["confidence"])
        else:
            best = {"class_name": "healthy", "confidence": 0.0, "severity": "None"}

        # Save to database
        db = SessionLocal()
        db.execute(
            text("""INSERT INTO disease_detections
                (image_path, disease_label, confidence, severity, tree_id, block_id)
                VALUES (:image_path, :disease_label, :confidence, :severity, :tree_id, :block_id)"""),
            {
                "image_path":    str(filepath),
                "disease_label": best["class_name"],
                "confidence":    best["confidence"],
                "severity":      best["severity"],
                "tree_id":       "manual",
                "block_id":      "test"
            }
        )
        db.commit()
        db.close()

        return {
            "success":         True,
            "image_path":      str(filepath),
            "best_detection":  best,
            "all_detections":  detections[:10],
            "total_detections": len(detections)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}