from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import get_db
from datetime import datetime
from pathlib import Path
import asyncio
import os

router = APIRouter(
    prefix="/security",
    tags=["Security"],
)


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

        # Human-friendly messages
        if threat_type == "person":
            title   = "🚨 Intruder Alert"
            action  = "An unrecognised person has been spotted near your plantation. Please inspect the area immediately or contact local authorities if needed."
        elif threat_type == "animal":
            title   = "⚠️ Animal Activity Detected"
            action  = "An animal has been detected near your crops. Check the area for any damage to your oil palm trees."
        else:
            title   = "📋 Motion Detected"
            action  = "Unexpected motion was detected near your plantation. Please verify the area when possible."

        caption = (
            f"{title}\n\n"
            f"{action}\n\n"
            f"📍 Location: Oil Palm Plantation — BLK_A\n"
            f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}\n"
            f"📸 Snapshot attached for your reference"
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
                        f"Intruder spotted near the plantation. Immediate inspection recommended." if threat_type == "person" else f"Animal activity detected near the plantation. Check for crop damage.",
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
        "msg":    "Intruder spotted near the plantation — take immediate action.",
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
# ── Security Events Snapshots──────────────────────────────────────────
@router.get("/snapshots")
def get_snapshots():
    """List all security snapshots"""
    if not SNAPSHOT_DIR.exists():
        return []
    
    files = []
    for f in sorted(SNAPSHOT_DIR.glob("*.jpg"), 
                   key=os.path.getmtime, reverse=True)[:50]:
        files.append({
            "filename": f.name,
            "created":  datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
            "size":     f.stat().st_size,
            "url":      f"/security/snapshot/{f.name}"
        })
    return files

@router.get("/snapshot/{filename}")
def get_snapshot(filename: str):
    """Serve a single snapshot image"""
    filepath = SNAPSHOT_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return FileResponse(str(filepath), media_type="image/jpeg")

# ── NEW: Security Live Frame with YOLOv8n COCO bounding boxes ──
from fastapi.responses import Response as FastAPIResponse
import cv2
import threading

@router.get("/live-frame")
async def get_security_frame(camera_index: str = "0"):
    """Capture frame, run YOLOv8n COCO, return annotated JPEG"""
    frame_result = {"frame": None, "error": None}

    def _capture():
        try:
            source = int(camera_index) if camera_index.strip().isdigit() else camera_index
            cap = cv2.VideoCapture(source)
            if not cap.isOpened():
                frame_result["error"] = f"Cannot open camera {camera_index}"
                return
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            for _ in range(2): cap.grab()
            ret, frame = cap.read()
            cap.release()
            if ret and frame is not None:
                frame_result["frame"] = frame
            else:
                frame_result["error"] = "No frame"
        except Exception as e:
            frame_result["error"] = str(e)

    t = threading.Thread(target=_capture, daemon=True)
    t.start()
    t.join(timeout=5)

    if frame_result["frame"] is None:
        raise HTTPException(503, f"Camera offline: {frame_result.get('error','timeout')}")

    frame = frame_result["frame"]
    threat_type = "clear"
    detections  = []

    try:
        from ultralytics import YOLO
        model = YOLO("yolov8n.pt")
        results = model(frame, conf=0.25, verbose=False)

        PERSON_CLASSES = [0]
        ANIMAL_CLASSES = [14,15,16,17,18,19,20,21,22,23]
        COLOR_PERSON   = (94, 63, 244)
        COLOR_ANIMAL   = (11, 158, 245)

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf   = float(box.conf[0])
                x1,y1,x2,y2 = map(int, box.xyxy[0])
                if cls_id in PERSON_CLASSES:
                    label = "person"; color = COLOR_PERSON
                    threat_type = "person"
                elif cls_id in ANIMAL_CLASSES:
                    label = r.names[cls_id]; color = COLOR_ANIMAL
                    if threat_type != "person": threat_type = "animal"
                else:
                    continue
                cv2.rectangle(frame,(x1,y1),(x2,y2),color,2)
                txt = f"{label} {conf:.0%}"
                (tw,th),_ = cv2.getTextSize(txt,cv2.FONT_HERSHEY_SIMPLEX,0.55,1)
                cv2.rectangle(frame,(x1,y1-th-10),(x1+tw+6,y1),color,-1)
                cv2.putText(frame,txt,(x1+3,y1-5),cv2.FONT_HERSHEY_SIMPLEX,0.55,(0,0,0),1)
                detections.append({"label":label,"confidence":round(conf*100,1)})

        overlay = {"person":"INTRUDER DETECTED","animal":"ANIMAL NEARBY","clear":"AREA CLEAR"}
        colors  = {"person":COLOR_PERSON,"animal":COLOR_ANIMAL,"clear":(52,211,153)}
        cv2.putText(frame,overlay.get(threat_type,"CLEAR"),(10,30),cv2.FONT_HERSHEY_SIMPLEX,0.8,colors.get(threat_type,(200,200,200)),2)

    except Exception as e:
        print(f"Security inference error: {e}")

    # Save snapshot + DB + Telegram if threat detected
    if threat_type in ["person", "animal"]:
        try:
            import pymysql
            now_ts    = datetime.now()
            now_epoch = now_ts.timestamp()
            last      = _last_alert_time.get(threat_type, 0)
            if now_epoch - last >= COOLDOWN_SECONDS:
                _last_alert_time[threat_type] = now_epoch
                snap_name = "security_{}_{}_annotated.jpg".format(
                    threat_type, now_ts.strftime("%Y%m%d_%H%M%S"))
                snap_path = SNAPSHOT_DIR / snap_name
                _, snap_buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                with open(snap_path, "wb") as sf:
                    sf.write(snap_buf.tobytes())
                print("Snapshot saved: {}".format(snap_name))
                try:
                    best_conf = max([d["confidence"] for d in detections], default=0)
                    det_list  = ", ".join(["{} ({}%)".format(d["label"], d["confidence"]) for d in detections[:3]])
                    conn = pymysql.connect(
                        host=os.getenv("DB_HOST", "localhost"),
                        user=os.getenv("DB_USER", "root"),
                        password=os.getenv("DB_PASSWORD", "fyp1234"),
                        database=os.getenv("DB_NAME", "fyp_oil_palm")
                    )
                    cursor = conn.cursor()
                    cursor.execute(
                        "INSERT INTO alerts (alert_type, message, sensor_value, threshold, acknowledged) VALUES (%s, %s, %s, %s, %s)",
                        ("security_{}".format(threat_type),
                         ("Intruder spotted near the plantation — take immediate action." if threat_type == "person" else ("Animal detected near crops — check for potential damage." if threat_type == "animal" else "Unexpected motion detected — please verify the area.")),
                         best_conf, 25.0, False)
                    )
                    conn.commit()
                    conn.close()
                    print("DB saved: {}".format(threat_type))
                except Exception as db_err:
                    print("DB error: {}".format(db_err))
                try:
                    tg_dets = [{"class_name": d["label"], "confidence": d["confidence"]} for d in detections]
                    await send_security_telegram(threat_type, best_conf, tg_dets, str(snap_path))
                    print("Telegram sent: {}".format(threat_type))
                except Exception as tg_err:
                    print("Telegram error: {}".format(tg_err))
            else:
                remaining = int(COOLDOWN_SECONDS - (now_epoch - last))
                print("Cooldown: {}s remaining".format(remaining))
        except Exception as e:
            print("Alert error: {}".format(e))

    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return FastAPIResponse(
        content=buf.tobytes(), media_type="image/jpeg",
        headers={"X-Threat-Type": threat_type, "X-Detection-Count": str(len(detections)), "Cache-Control": "no-cache"}
    )





