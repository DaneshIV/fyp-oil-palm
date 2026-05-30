from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import get_db
from backend.schemas.schemas import SensorReading, SensorReadingCreate
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
from datetime import datetime, timedelta
import asyncio
import json

router = APIRouter(
    prefix="/sensors",
    tags=["Sensors"],
)

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
        text("""INSERT INTO sensor_readings (temperature, humidity, soil_moisture, soil_temperature, ec_level) VALUES (:temperature, :humidity, :soil_moisture, :soil_temperature, :ec_level)"""),
        data.dict()
    )
    db.commit()
    result = db.execute(
        text("SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1")
    ).fetchone()
    return result

# ── WebSocket Manager ────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.active_connections.remove(conn)

manager = ConnectionManager()

@router.websocket("/ws/sensors")
async def websocket_sensors(websocket: WebSocket, db: Session = Depends(get_db)):
    await manager.connect(websocket)
    try:
        while True:
            # Fetch latest sensor data
            result = db.execute(text("""
                SELECT temperature, humidity, soil_moisture, soil_temperature, ec_level, timestamp
                FROM sensor_readings
                ORDER BY timestamp DESC
                LIMIT 1
            """)).fetchone()

            if result:
                await websocket.send_json({
                    "type":          "sensor_update",
                    "temperature":   result.temperature,
                    "humidity":      result.humidity,
                    "soil_moisture": result.soil_moisture,
                    "soil_temperature": result.soil_temperature,
                    "ec_level":      result.ec_level,
                    "timestamp":     str(result.timestamp)
                })

            await asyncio.sleep(3)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)

@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket, db: Session = Depends(get_db)):
    await manager.connect(websocket)
    try:
        while True:
            # Fetch unacknowledged alerts count
            result = db.execute(text("""
                SELECT COUNT(*) as count FROM alerts
                WHERE acknowledged = FALSE
            """)).fetchone()

            await websocket.send_json({
                "type":              "alert_update",
                "unacknowledged":    result.count if result else 0
            })

            await asyncio.sleep(5)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)




