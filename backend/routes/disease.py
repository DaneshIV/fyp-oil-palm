from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import get_db
from backend.schemas.schemas import DiseaseDetection, DiseaseDetectionCreate
from typing import List

router = APIRouter(prefix="/disease", tags=["Disease"])

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