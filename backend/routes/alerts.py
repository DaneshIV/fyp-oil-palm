from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import get_db
from backend.schemas.schemas import Alert, AlertCreate
from typing import List

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/", response_model=List[Alert])
def get_alerts(
    unacknowledged_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    if unacknowledged_only:
        result = db.execute(
            text("SELECT * FROM alerts WHERE acknowledged = FALSE ORDER BY triggered_at DESC")
        ).fetchall()
    else:
        result = db.execute(
            text("SELECT * FROM alerts ORDER BY triggered_at DESC LIMIT 50")
        ).fetchall()
    return result

@router.get("/count")
def get_unacknowledged_count(db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT COUNT(*) as count FROM alerts WHERE acknowledged = FALSE")
    ).fetchone()
    return {"unacknowledged_count": result.count}

@router.post("/", response_model=Alert)
def create_alert(data: AlertCreate, db: Session = Depends(get_db)):
    db.execute(
        text("""INSERT INTO alerts (alert_type, message, sensor_value, threshold)
            VALUES (:alert_type, :message, :sensor_value, :threshold)"""),
        data.dict()
    )
    db.commit()
    result = db.execute(
        text("SELECT * FROM alerts ORDER BY id DESC LIMIT 1")
    ).fetchone()
    return result

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE alerts SET acknowledged = TRUE WHERE id = :id"),
        {"id": alert_id}
    )
    db.commit()
    return {"message": f"Alert {alert_id} acknowledged"}

@router.post("/acknowledge-all")
def acknowledge_all_alerts(db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE alerts SET acknowledged = TRUE WHERE acknowledged = FALSE")
    )
    db.commit()
    return {"message": "All alerts acknowledged"}