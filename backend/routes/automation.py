from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import get_db
from backend.schemas.schemas import AutomationRule, AutomationRuleCreate
from typing import List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/automation", tags=["Automation"])

class RelayControl(BaseModel):
    relay_pin: int
    state: bool

@router.get("/rules", response_model=List[AutomationRule])
def get_rules(db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM automation_rules ORDER BY id ASC")
    ).fetchall()
    return result

@router.get("/rules/{rule_id}", response_model=AutomationRule)
def get_rule(rule_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM automation_rules WHERE id = :id"),
        {"id": rule_id}
    ).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Rule not found")
    return result

@router.post("/rules", response_model=AutomationRule)
def create_rule(data: AutomationRuleCreate, db: Session = Depends(get_db)):
    db.execute(
        text("""INSERT INTO automation_rules 
            (rule_name, trigger_type, sensor_field, threshold_value, operator, relay_pin, is_active)
            VALUES (:rule_name, :trigger_type, :sensor_field, :threshold_value, :operator, :relay_pin, :is_active)"""),
        data.dict()
    )
    db.commit()
    result = db.execute(
        text("SELECT * FROM automation_rules ORDER BY id DESC LIMIT 1")
    ).fetchone()
    return result

@router.patch("/rules/{rule_id}/toggle")
def toggle_rule(rule_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM automation_rules WHERE id = :id"),
        {"id": rule_id}
    ).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.execute(
        text("UPDATE automation_rules SET is_active = NOT is_active WHERE id = :id"),
        {"id": rule_id}
    )
    db.commit()
    return {"message": f"Rule {rule_id} toggled", "is_active": not result.is_active}

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM automation_rules WHERE id = :id"),
        {"id": rule_id}
    ).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.execute(
        text("DELETE FROM automation_rules WHERE id = :id"),
        {"id": rule_id}
    )
    db.commit()
    return {"message": f"Rule {rule_id} deleted"}

@router.post("/relay")
def control_relay(data: RelayControl):
    # On real IRIV this triggers GPIO relay
    # Mock response for local development
    return {
        "relay_pin": data.relay_pin,
        "state": "ON" if data.state else "OFF",
        "message": f"Relay {data.relay_pin} turned {'ON' if data.state else 'OFF'}",
        "timestamp": datetime.now().isoformat()
    }