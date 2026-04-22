from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import get_db
from datetime import datetime
from pathlib import Path
import asyncio
import os

router = APIRouter(prefix="/security", tags=["Security"])

SNAPSHOT_DIR = Path("captured_images/security")
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

# COCO class mappings
PERSON_CLASSES = [0]
ANIMAL_CLASSES = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
ANIMAL_NAMES   = {
    14: 'bird',  15: 'cat',      16: 'dog',     17: 'horse',
    18: 'sheep', 19: 'cow',      20: 'elephant', 21: 'bear',
    22: 'zebra', 23: 'giraffe'
}

THREAT_LEVELS = {
    "person":  "HIGH",
    "animal":  "MEDIUM",
    "unknown": "LOW",
    "clear":   "NONE",
}

# Cooldown tracker — prevent Telegram spam
_last_alert_time: dict = {}
COOLDOWN_SECONDS = 30

# ── Telegram Alert ───────────────────────────────────────────
async def send_security_telegram(
    threat_type: str,
    confidence: float,
    detections: list,
    snapshot_path: str = None
):
    """Send Telegram security alert with photo"""
    try:
        import sys
        sys.path.insert(0, "iriv_scripts")
        from telegram_bot import send_photo, send_message

        THREAT_EMOJI = {"person": "🚨", "animal": "⚠️"}
        THREAT_LEVEL = {"person": "HIGH", "animal": "MEDIUM"}

        emoji = THREAT_EMOJI.get(threat_type, "📋")
        level = THREAT_LEVEL.get(threat_type, "LOW")

        det_summary = "\n".join([
            f"  • {d['class_name']} ({d['confidence']}%)"
            for d in detections[:5]
        ]) or "  • Unknown subject"

        caption = (
            f"{emoji} <b>SECURITY ALERT — {level}</b>\n\n"
            f"🎯 Threat: <b>{threat_type.upper()}</b>\n"
            f"📊 Confidence: <b>{confidence:.1f}%</b>\n"
            f"🔍 Detected:\n{det_summary}\n\n"
            f"📸 Snapshot attached\n"
            f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            f"⚡ Triple Layer Security — YOLOv8n"
        )

        if snapshot_path and os.path.exists(snapshot_path):
            await send_photo(snapshot_path, caption)
        else:
            await send_message(caption)

    except Exception as e:
        print(f"Telegram alert failed: {e}")

# ── Security Detection ───────────────────────────────────────
@router.post("/detect")
async def security_detect(file: UploadFile = File(...)):
    """Run YOLOv8n COCO model for person/animal detection"""
    try:
        from ultralytics import YOLO

        # Save uploaded image
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"security_{timestamp}.jpg"
        filepath  = SNAPSHOT_DIR / filename

        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)

        # Load COCO pretrained model
        model   = YOLO("yolov8n.pt")
        results = model(str(filepath), conf=0.25, verbose=False)

        detections  = []
        threat_type = "clear"
        best_conf   = 0.0

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf   = float(box.conf[0])

                if cls_id in PERSON_CLASSES:
                    label = "person"
                    if conf > best_conf:
                        threat_type = "person"
                        best_conf   = conf

                elif cls_id in ANIMAL_CLASSES:
                    label = ANIMAL_NAMES.get(cls_id, "animal")
                    if conf > best_conf and threat_type != "person":
                        threat_type = "animal"
                        best_conf   = conf
                else:
                    continue

                detections.append({
                    "class_name": label,
                    "confidence": round(conf * 100, 1),
                })

        best = detections[0] if detections else {
            "class_name": "clear",
            "confidence": 0.0
        }

        # ── Save to DB + Send Telegram if threat detected ──
        if threat_type in ["person", "animal"] and best_conf > 0:
            now  = datetime.now().timestamp()
            last = _last_alert_time.get(threat_type, 0)

            if now - last >= COOLDOWN_SECONDS:
                _last_alert_time[threat_type] = now

                # Save to MySQL
                try:
                    import pymysql
                    conn = pymysql.connect(
                        host=os.getenv("DB_HOST", "localhost"),
                        user=os.getenv("DB_USER", "root"),
                        password=os.getenv("DB_PASSWORD", "fyp1234"),
                        database=os.getenv("DB_NAME", "fyp_oil_palm")
                    )
                    cursor = conn.cursor()
                    det_summary = ", ".join([
                        f"{d['class_name']} ({d['confidence']}%)"
                        for d in detections[:3]
                    ])
                    cursor.execute("""
                        INSERT INTO alerts
                        (alert_type, message, sensor_value, threshold, acknowledged)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        f"security_{threat_type}",
                        f"Security Alert: {threat_type.upper()} detected "
                        f"({best_conf*100:.1f}% confidence) — {det_summary}",
                        round(best_conf * 100, 1),
                        45.0,
                        False
                    ))
                    conn.commit()
                    conn.close()
                    print(f"Security event saved: {threat_type} ({best_conf*100:.1f}%)")
                except Exception as db_err:
                    print(f"DB save failed: {db_err}")

                # Send Telegram alert
                try:
                    await send_security_telegram(
                        threat_type,
                        best_conf * 100,
                        detections,
                        str(filepath)
                    )
                except Exception as tg_err:
                    print(f"Telegram failed: {tg_err}")

            else:
                remaining = int(COOLDOWN_SECONDS - (now - last))
                print(f"Cooldown active for {threat_type}: {remaining}s remaining")

        return {
            "success":          True,
            "threat_type":      threat_type,
            "threat_level":     THREAT_LEVELS.get(threat_type, "NONE"),
            "best_detection":   best,
            "all_detections":   detections[:10],
            "total_detections": len(detections),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

# ── Security Events ──────────────────────────────────────────
@router.get("/events")
def get_security_events(limit: int = 20, db: Session = Depends(get_db)):
    """Get recent security events"""
    result = db.execute(
        text("""
            SELECT * FROM alerts
            WHERE alert_type LIKE 'security_%'
            ORDER BY triggered_at DESC
            LIMIT :limit
        """),
        {"limit": limit}
    ).fetchall()
    return [dict(r._mapping) for r in result]

@router.get("/events/count")
def get_security_count(db: Session = Depends(get_db)):
    """Get security event counts by threat type"""
    result = db.execute(text("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN alert_type = 'security_person'  THEN 1 ELSE 0 END) as person,
            SUM(CASE WHEN alert_type = 'security_animal'  THEN 1 ELSE 0 END) as animal,
            SUM(CASE WHEN alert_type = 'security_unknown' THEN 1 ELSE 0 END) as unknown,
            SUM(CASE WHEN acknowledged = FALSE THEN 1 ELSE 0 END) as unacknowledged
        FROM alerts
        WHERE alert_type LIKE 'security_%'
    """)).fetchone()
    return dict(result._mapping)

@router.post("/test-alert")
async def test_security_alert(db: Session = Depends(get_db)):
    """Insert a test security event for demo purposes"""
    db.execute(text("""
        INSERT INTO alerts
        (alert_type, message, sensor_value, threshold, acknowledged)
        VALUES (:type, :msg, :val, :thresh, :ack)
    """), {
        "type":   "security_person",
        "msg":    "Security Alert: PERSON detected (87.5% confidence) — person (87.5%)",
        "val":    87.5,
        "thresh": 45.0,
        "ack":    False
    })
    db.commit()

    # Also send Telegram for test
    try:
        await send_security_telegram("person", 87.5, [
            {"class_name": "person", "confidence": 87.5}
        ])
    except Exception as e:
        print(f"Test Telegram failed: {e}")

    return {"success": True, "message": "Test security alert inserted"}