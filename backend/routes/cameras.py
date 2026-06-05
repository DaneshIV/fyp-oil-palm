# backend/routes/cameras.py

import cv2
import threading
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from backend.database.connection import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text

router = APIRouter()

import os
MODEL_PATH = "ai_model/models/best_v4.pt"
_model = None

def get_model():
    global _model
    if _model is None and os.path.exists(MODEL_PATH):
        try:
            from ultralytics import YOLO
            _model = YOLO(MODEL_PATH)
        except Exception as e:
            print(f"Model load error: {e}")
    return _model

class CameraCreate(BaseModel):
    name:     str
    block_id: str
    rtsp_url: str
    location: Optional[str] = ""

class CameraUpdate(BaseModel):
    name:      Optional[str]  = None
    rtsp_url:  Optional[str]  = None
    location:  Optional[str]  = None
    is_active: Optional[bool] = None

def capture_frame_threaded(rtsp_url: str, timeout: int = 5):
    """Capture frame in separate thread with timeout to avoid blocking FastAPI"""
    result = {"frame": None, "error": None}

    def _capture():
        try:
            source = int(rtsp_url.strip()) if rtsp_url.strip().isdigit() else rtsp_url
            # Try multiple backends
            for backend in [cv2.CAP_ANY, cv2.CAP_DSHOW, cv2.CAP_MSMF]:
                try:
                    cap = cv2.VideoCapture(source, backend)
                    if cap.isOpened():
                        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                        # Skip frames to get latest
                        for _ in range(2):
                            cap.grab()
                        ret, frame = cap.read()
                        cap.release()
                        if ret and frame is not None:
                            result["frame"] = frame
                            return
                except Exception:
                    continue
            result["error"] = "All backends failed"
        except Exception as e:
            result["error"] = str(e)

    t = threading.Thread(target=_capture, daemon=True)
    t.start()
    t.join(timeout=timeout)

    if t.is_alive():
        result["error"] = "Camera timeout"

    return result["frame"], result.get("error")

def frame_to_jpeg(frame) -> bytes:
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return buf.tobytes()

def draw_boxes(frame, results):
    detections = []
    CLASS_COLORS = {
        "healthy":   (52, 211, 153),
        "ganoderma": (244, 63, 94),
        "unhealthy": (245, 158, 11),
        "immature":  (99, 102, 241),
    }
    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf   = float(box.conf[0])
            label  = result.names[cls_id]
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            color = CLASS_COLORS.get(label, (200, 200, 200))
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            text_label = f"{label} {conf:.0%}"
            (tw, th), _ = cv2.getTextSize(text_label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(frame, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
            cv2.putText(frame, text_label, (x1 + 2, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
            detections.append({
                "label":      label,
                "confidence": round(conf * 100, 1),
                "bbox":       [x1, y1, x2, y2],
            })
    return frame, detections

# ── Routes ────────────────────────────────────────────────────

@router.get("/blocks/summary")
def get_blocks_summary(db: Session = Depends(get_db)):
    cameras = db.execute(text(
        "SELECT * FROM cameras WHERE is_active = TRUE ORDER BY created_at ASC"
    )).fetchall()

    blocks = []
    for cam in cameras:
        cam = dict(cam._mapping)

        disease_rows = db.execute(text(
            """SELECT disease_label, confidence, severity, timestamp
               FROM disease_detections
               WHERE block_id = :block_id
               ORDER BY timestamp DESC LIMIT 10"""
        ), {"block_id": cam["block_id"]}).fetchall()

        disease_list = [dict(d._mapping) for d in disease_rows]
        diseased = [d for d in disease_list if d["disease_label"] not in ("healthy", "immature")]
        status = "optimal"
        if diseased:
            status = "infected" if any(d["disease_label"] == "ganoderma" for d in diseased) else "warning"

        sensor = db.execute(text(
            "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1"
        )).fetchone()
        sensor = dict(sensor._mapping) if sensor else {}

        blocks.append({
            "block_id":      cam["block_id"],
            "name":          cam["name"],
            "camera_id":     cam["id"],
            "rtsp_url":      cam["rtsp_url"],
            "location":      cam["location"] or "",
            "plant_count":   cam["plant_count"] or 0,
            "last_frame":    cam["last_frame"].isoformat() if cam["last_frame"] else None,
            "status":        status,
            "detections":    len(diseased),
            "disease_list":  disease_list[:5],
            "temperature":   sensor.get("temperature", 0),
            "humidity":      sensor.get("humidity", 0),
            "soil_moisture": sensor.get("soil_moisture", 0),
            "ec_level":      sensor.get("ec_level", 0),
        })

    return blocks

@router.get("/")
def list_cameras(db: Session = Depends(get_db)):
    cameras = db.execute(text(
        "SELECT * FROM cameras ORDER BY created_at DESC"
    )).fetchall()
    return [dict(c._mapping) for c in cameras]

@router.post("/")
def add_camera(cam: CameraCreate, db: Session = Depends(get_db)):
    existing = db.execute(text(
        "SELECT id FROM cameras WHERE block_id = :block_id"
    ), {"block_id": cam.block_id}).fetchone()

    if existing:
        raise HTTPException(400, f"Block {cam.block_id} already has a camera")

    db.execute(text(
        """INSERT INTO cameras (name, block_id, rtsp_url, location)
           VALUES (:name, :block_id, :rtsp_url, :location)"""
    ), {"name": cam.name, "block_id": cam.block_id,
        "rtsp_url": cam.rtsp_url, "location": cam.location or ""})
    db.commit()

    result = db.execute(text(
        "SELECT id FROM cameras WHERE block_id = :b"
    ), {"b": cam.block_id}).fetchone()
    cam_id = result[0] if result else 0
    return {"id": cam_id, "message": f"Camera added for {cam.block_id}"}

@router.patch("/{camera_id}")
def update_camera(camera_id: int, update: CameraUpdate, db: Session = Depends(get_db)):
    fields = {k: v for k, v in update.dict().items() if v is not None}
    if not fields:
        raise HTTPException(400, "No fields to update")
    set_clause = ", ".join(f"{k} = :{k}" for k in fields)
    fields["camera_id"] = camera_id
    db.execute(text(f"UPDATE cameras SET {set_clause} WHERE id = :camera_id"), fields)
    db.commit()
    return {"message": "Camera updated"}

@router.delete("/{camera_id}")
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM cameras WHERE id = :id"), {"id": camera_id})
    db.commit()
    return {"message": "Camera deleted"}

@router.get("/{camera_id}/frame")
def get_frame(camera_id: int, show_boxes: bool = True, db: Session = Depends(get_db)):
    cam = db.execute(text(
        "SELECT * FROM cameras WHERE id = :id"
    ), {"id": camera_id}).fetchone()

    if not cam:
        raise HTTPException(404, "Camera not found")

    cam = dict(cam._mapping)

    # Capture frame in thread with timeout
    frame, error = capture_frame_threaded(cam["rtsp_url"], timeout=5)

    if frame is None:
        raise HTTPException(503, f"Camera offline: {error or 'unknown error'}")

    model = get_model()
    plant_count = 0
    detections  = []

    if model:
        try:
            results = model(frame, conf=0.5, iou=0.45, verbose=False)
            frame, detections = draw_boxes(frame, results) if show_boxes else (frame, draw_boxes(frame.copy(), results)[1])
            plant_count = len(detections)
            db.execute(text(
                "UPDATE cameras SET plant_count = :count, last_frame = NOW() WHERE id = :id"
            ), {"count": plant_count, "id": camera_id})
            db.commit()
        except Exception as e:
            print(f"Inference error: {e}")

    jpeg = frame_to_jpeg(frame)
    return Response(
        content=jpeg,
        media_type="image/jpeg",
        headers={
            "X-Plant-Count":  str(plant_count),
            "X-Detections":   str(len(detections)),
            "X-Camera-Block": cam["block_id"],
            "Cache-Control":  "no-cache",
        }
    )

@router.get("/{camera_id}/detections")
def get_detections(camera_id: int, db: Session = Depends(get_db)):
    cam = db.execute(text(
        "SELECT * FROM cameras WHERE id = :id"
    ), {"id": camera_id}).fetchone()

    if not cam:
        raise HTTPException(404, "Camera not found")

    cam = dict(cam._mapping)
    frame, error = capture_frame_threaded(cam["rtsp_url"], timeout=5)

    if frame is None:
        return {"plant_count": cam["plant_count"], "detections": [], "error": error}

    model = get_model()
    detections  = []
    plant_count = 0

    if model:
        try:
            results = model(frame, conf=0.5, iou=0.45, verbose=False)
            _, detections = draw_boxes(frame.copy(), results)
            plant_count = len(detections)
            db.execute(text(
                "UPDATE cameras SET plant_count = :count, last_frame = NOW() WHERE id = :id"
            ), {"count": plant_count, "id": camera_id})
            db.commit()
        except Exception as e:
            print(f"Inference error: {e}")

    return {
        "camera_id":   camera_id,
        "block_id":    cam["block_id"],
        "plant_count": plant_count,
        "detections":  detections,
        "timestamp":   datetime.now().isoformat(),
    }


