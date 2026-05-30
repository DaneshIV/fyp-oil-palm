# backend/routes/automation.py — V2 with relay state tracking
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
    state:     bool
    source:    str = "manual"

class RelayState(BaseModel):
    relay_pin: int
    state:     bool
    source:    str = "auto"

# ── Rules ────────────────────────────────────────────────────

@router.get("/rules", response_model=List[AutomationRule])
def get_rules(db: Session = Depends(get_db)):
    return db.execute(text("SELECT * FROM automation_rules ORDER BY id ASC")).fetchall()

@router.post("/rules", response_model=AutomationRule)
def create_rule(data: AutomationRuleCreate, db: Session = Depends(get_db)):
    db.execute(text("""INSERT INTO automation_rules
        (rule_name, trigger_type, sensor_field, threshold_value, operator, relay_pin, is_active)
        VALUES (:rule_name, :trigger_type, :sensor_field, :threshold_value, :operator, :relay_pin, :is_active)"""),
        data.dict())
    db.commit()
    return db.execute(text("SELECT * FROM automation_rules ORDER BY id DESC LIMIT 1")).fetchone()

@router.patch("/rules/{rule_id}/toggle")
def toggle_rule(rule_id: int, db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM automation_rules WHERE id = :id"), {"id": rule_id}).fetchone()
    if not result: raise HTTPException(404, "Rule not found")
    db.execute(text("UPDATE automation_rules SET is_active = NOT is_active WHERE id = :id"), {"id": rule_id})
    db.commit()
    return {"message": f"Rule {rule_id} toggled", "is_active": not result.is_active}

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM automation_rules WHERE id = :id"), {"id": rule_id}).fetchone()
    if not result: raise HTTPException(404, "Rule not found")
    db.execute(text("DELETE FROM automation_rules WHERE id = :id"), {"id": rule_id})
    db.commit()
    return {"message": f"Rule {rule_id} deleted"}

# ── Manual Relay Control ──────────────────────────────────────

@router.post("/relay")
def control_relay(data: RelayControl, db: Session = Depends(get_db)):
    """Queue manual relay command — IRIV polls and executes"""
    # Clear old pending commands for this relay
    db.execute(text("DELETE FROM relay_commands WHERE relay_pin = :pin AND executed = FALSE"),
               {"pin": data.relay_pin})
    # Queue new command
    db.execute(text("INSERT INTO relay_commands (relay_pin, state, source) VALUES (:pin, :state, :source)"),
               {"pin": data.relay_pin, "state": data.state, "source": data.source})
    db.commit()
    return {
        "relay_pin": data.relay_pin,
        "state":     "ON" if data.state else "OFF",
        "message":   f"Relay {data.relay_pin} command queued → IRIV executes within 5s",
        "timestamp": datetime.now().isoformat(),
    }

@router.get("/relay/pending")
def get_pending(db: Session = Depends(get_db)):
    """IRIV polls this every 5s for manual commands"""
    rows = db.execute(text(
        "SELECT id, relay_pin, state, source, created_at FROM relay_commands WHERE executed = FALSE ORDER BY created_at ASC"
    )).fetchall()
    return [dict(r._mapping) for r in rows]

@router.post("/relay/executed")
def mark_executed(command_ids: List[int], db: Session = Depends(get_db)):
    """IRIV calls this after executing commands"""
    for cid in command_ids:
        db.execute(text("UPDATE relay_commands SET executed = TRUE, executed_at = NOW() WHERE id = :id"),
                   {"id": cid})
    db.commit()
    return {"message": f"{len(command_ids)} command(s) marked executed"}

@router.post("/relay/state")
def update_relay_state(data: RelayState, db: Session = Depends(get_db)):
    """IRIV reports current relay state after firing — dashboard reads this"""
    db.execute(text("""
        INSERT INTO relay_states (relay_pin, state, source, updated_at)
        VALUES (:pin, :state, :source, NOW())
        ON DUPLICATE KEY UPDATE state = :state, source = :source, updated_at = NOW()
    """), {"pin": data.relay_pin, "state": data.state, "source": data.source})
    db.commit()
    return {"relay_pin": data.relay_pin, "state": data.state}

@router.get("/relay/states")
def get_relay_states(db: Session = Depends(get_db)):
    """Dashboard reads this to show correct ON/OFF state for all relays"""
    rows = db.execute(text(
        "SELECT relay_pin, state, source, updated_at FROM relay_states ORDER BY relay_pin ASC"
    )).fetchall()
    result = {}
    for r in rows:
        r = dict(r._mapping)
        result[r["relay_pin"]] = {
            "state":      r["state"],
            "source":     r["source"],
            "updated_at": r["updated_at"].isoformat() if r["updated_at"] else None,
        }
    # Fill in any missing relays as OFF
    for pin in [1, 2, 3, 4, 5]:
        if pin not in result:
            result[pin] = {"state": False, "source": "unknown", "updated_at": None}
    return result

# ── Master AC Switch ──────────────────────────────────────────

class MasterACCommand(BaseModel):
    state: bool

@router.post("/master-ac")
def set_master_ac(data: MasterACCommand, db: Session = Depends(get_db)):
    """Dashboard or IRIV sets master AC switch state"""
    db.execute(text("""
        INSERT INTO relay_states (relay_pin, state, source, updated_at)
        VALUES (0, :state, 'MASTER_AC', NOW())
        ON DUPLICATE KEY UPDATE state = :state, source = 'MASTER_AC', updated_at = NOW()
    """), {"state": data.state})
    db.commit()
    return {"state": data.state, "message": f"Master AC {'ON' if data.state else 'OFF'}"}

@router.get("/master-ac")
def get_master_ac(db: Session = Depends(get_db)):
    """IRIV polls this to check if dashboard toggled master AC"""
    row = db.execute(text(
        "SELECT state, source, updated_at FROM relay_states WHERE relay_pin = 0"
    )).fetchone()
    if not row:
        return {"state": False, "source": "unknown"}
    r = dict(row._mapping)
    return {
        "state":      r["state"],
        "source":     r["source"],
        "updated_at": r["updated_at"].isoformat() if r["updated_at"] else None,
    }