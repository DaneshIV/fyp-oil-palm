from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import get_db
from backend.schemas.schemas import SensorReading, SensorReadingCreate
from typing import List
from datetime import datetime, timedelta

router = APIRouter(prefix="/sensors", tags=["Sensors"])

@router.get("/latest", response_model=SensorReading)
def get_latest_sensor(db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1")
    ).fetchone()
    return result

@router.get("/history", response_model=List[SensorReading])
def get_sensor_history(hours: int = Query(24), db: Session = Depends(get_db)):
    since = datetime.now() - timedelta(hours=hours)
    result = db.execute(
        text("SELECT * FROM sensor_readings WHERE timestamp >= :since ORDER BY timestamp ASC"),
        {"since": since}
    ).fetchall()
    return result

@router.post("/", response_model=SensorReading)
def create_sensor_reading(data: SensorReadingCreate, db: Session = Depends(get_db)):
    db.execute(
        text("""INSERT INTO sensor_readings 
            (temperature, humidity, soil_moisture, ec_level) 
            VALUES (:temperature, :humidity, :soil_moisture, :ec_level)"""),
        data.dict()
    )
    db.commit()
    result = db.execute(
        text("SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1")
    ).fetchone()
    return result