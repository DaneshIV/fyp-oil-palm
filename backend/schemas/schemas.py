from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# ── Sensor Schemas ──────────────────────────────
class SensorReadingBase(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float
    ec_level: float

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReading(SensorReadingBase):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

# ── Disease Schemas ──────────────────────────────
class DiseaseDetectionBase(BaseModel):
    image_path: str
    disease_label: str
    confidence: float
    severity: str
    tree_id: Optional[str] = None
    block_id: Optional[str] = None

class DiseaseDetectionCreate(DiseaseDetectionBase):
    pass

class DiseaseDetection(DiseaseDetectionBase):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

# ── Alert Schemas ────────────────────────────────
class AlertBase(BaseModel):
    alert_type: str
    message: str
    sensor_value: Optional[float] = None
    threshold: Optional[float] = None

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: int
    acknowledged: bool
    triggered_at: datetime
    class Config:
        from_attributes = True

# ── Automation Schemas ───────────────────────────
class AutomationRuleBase(BaseModel):
    rule_name: str
    trigger_type: str
    sensor_field: Optional[str] = None
    threshold_value: Optional[float] = None
    operator: Optional[str] = None
    relay_pin: int
    is_active: bool = True

class AutomationRuleCreate(AutomationRuleBase):
    pass

class AutomationRule(AutomationRuleBase):
    id: int
    last_triggered: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True