# backend/schemas/schemas.py — updated with soil_temperature

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# ── Sensor Schemas ──────────────────────────────
class SensorReadingBase(BaseModel):
    temperature:      float          # Air temperature (°C) from Slave 1
    humidity:         float          # Air humidity (%) from Slave 1
    soil_moisture:    float          # Soil moisture (%) from Slave 5
    soil_temperature: float = 0.0   # Soil temperature (°C) from Slave 5
    ec_level:         float          # EC (mS/cm) from Slave 5

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReading(SensorReadingBase):
    id:        int
    timestamp: datetime
    class Config:
        from_attributes = True

# ── Disease Schemas ──────────────────────────────
class DiseaseDetectionBase(BaseModel):
    image_path:    str
    disease_label: str
    confidence:    float
    severity:      str
    tree_id:       Optional[str] = None
    block_id:      Optional[str] = None

class DiseaseDetectionCreate(DiseaseDetectionBase):
    pass

class DiseaseDetection(DiseaseDetectionBase):
    id:        int
    timestamp: datetime
    class Config:
        from_attributes = True

# ── Alert Schemas ────────────────────────────────
class AlertBase(BaseModel):
    alert_type:   str
    message:      str
    sensor_value: Optional[float] = None
    threshold:    Optional[float] = None

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id:           int
    acknowledged: bool
    triggered_at: datetime
    class Config:
        from_attributes = True

# ── Automation Rule Schemas ──────────────────────
class AutomationRuleBase(BaseModel):
    rule_name:       str
    trigger_type:    str = "threshold"
    sensor_field:    str
    threshold_value: float
    operator:        str
    relay_pin:       int
    is_active:       bool = True

class AutomationRuleCreate(AutomationRuleBase):
    pass

class AutomationRule(AutomationRuleBase):
    id:           int
    last_triggered: Optional[datetime] = None
    created_at:   Optional[datetime] = None
    class Config:
        from_attributes = True