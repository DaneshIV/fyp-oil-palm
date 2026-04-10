import os
from supabase import create_client, Client
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def sync_sensor_readings(db: Session, last_sync: datetime):
    """Sync new sensor readings from MySQL to Supabase"""
    try:
        # Get records added since last sync
        rows = db.execute(
            text("SELECT * FROM sensor_readings WHERE timestamp > :last_sync ORDER BY timestamp ASC"),
            {"last_sync": last_sync}
        ).fetchall()

        if not rows:
            logger.info("No new sensor readings to sync")
            return 0

        # Convert to list of dicts
        data = [
            {
                "temperature": row.temperature,
                "humidity": row.humidity,
                "soil_moisture": row.soil_moisture,
                "ec_level": row.ec_level,
                "timestamp": row.timestamp.isoformat()
            }
            for row in rows
        ]

        # Push to Supabase
        supabase.table("sensor_readings").insert(data).execute()
        logger.info(f"Synced {len(data)} sensor readings to Supabase")
        return len(data)

    except Exception as e:
        logger.error(f"Sensor sync failed: {e}")
        return 0

def sync_disease_detections(db: Session, last_sync: datetime):
    """Sync new disease detections from MySQL to Supabase"""
    try:
        rows = db.execute(
            text("SELECT * FROM disease_detections WHERE timestamp > :last_sync ORDER BY timestamp ASC"),
            {"last_sync": last_sync}
        ).fetchall()

        if not rows:
            return 0

        data = [
            {
                "image_path": row.image_path,
                "disease_label": row.disease_label,
                "confidence": row.confidence,
                "severity": row.severity,
                "tree_id": row.tree_id,
                "block_id": row.block_id,
                "timestamp": row.timestamp.isoformat()
            }
            for row in rows
        ]

        supabase.table("disease_detections").insert(data).execute()
        logger.info(f"Synced {len(data)} disease detections to Supabase")
        return len(data)

    except Exception as e:
        logger.error(f"Disease sync failed: {e}")
        return 0

def sync_alerts(db: Session, last_sync: datetime):
    """Sync new alerts from MySQL to Supabase"""
    try:
        rows = db.execute(
            text("SELECT * FROM alerts WHERE triggered_at > :last_sync ORDER BY triggered_at ASC"),
            {"last_sync": last_sync}
        ).fetchall()

        if not rows:
            return 0

        data = [
            {
                "alert_type": row.alert_type,
                "message": row.message,
                "sensor_value": row.sensor_value,
                "threshold": row.threshold,
                "acknowledged": row.acknowledged,
                "triggered_at": row.triggered_at.isoformat()
            }
            for row in rows
        ]

        supabase.table("alerts").insert(data).execute()
        logger.info(f"Synced {len(data)} alerts to Supabase")
        return len(data)

    except Exception as e:
        logger.error(f"Alerts sync failed: {e}")
        return 0


def run_full_sync(db: Session, last_sync: datetime = None):
    """Run full sync of all tables"""
    if last_sync is None:
        # Default — sync last 24 hours if no last_sync provided
        last_sync = datetime.now() - timedelta(hours=24)

    logger.info(f"Starting sync from {last_sync}")

    sensors_synced = sync_sensor_readings(db, last_sync)
    disease_synced = sync_disease_detections(db, last_sync)
    alerts_synced = sync_alerts(db, last_sync)

    total = sensors_synced + disease_synced + alerts_synced
    logger.info(f"Sync complete — {total} total records synced")

    return {
        "sensors_synced": sensors_synced,
        "disease_synced": disease_synced,
        "alerts_synced": alerts_synced,
        "total": total,
        "synced_at": datetime.now().isoformat()
    }