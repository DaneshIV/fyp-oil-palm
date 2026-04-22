import cv2
import sys
import os
import time
import logging
import asyncio
import numpy as np
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# ── Config ───────────────────────────────────────────────────
ON_IRIV          = sys.platform == 'linux'
PIR_GPIO_PIN     = 24           # GPIO pin for PIR sensor on IRIV
CAMERA_INDEX     = 0            # USB camera index
SNAPSHOT_DIR     = Path(__file__).parent.parent / "captured_images" / "security"
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

# Detection config
MOTION_THRESHOLD = 5000         # Pixel difference for software motion detection
PERSON_CONF      = 0.45         # Confidence threshold for person detection
ANIMAL_CONF      = 0.45         # Confidence threshold for animal detection
COOLDOWN_SECS    = 30           # Seconds between alerts (avoid spam)

# COCO classes we care about
PERSON_CLASSES   = [0]          # person
ANIMAL_CLASSES   = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23]  # bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe

# Threat level mapping
THREAT_MAP = {
    'person':  {'level': 'HIGH',   'emoji': '🚨', 'color': (0, 0, 255)},
    'animal':  {'level': 'MEDIUM', 'emoji': '⚠️',  'color': (0, 165, 255)},
    'unknown': {'level': 'LOW',    'emoji': '📋', 'color': (0, 255, 0)},
}

# ── GPIO Setup (IRIV only) ───────────────────────────────────
def setup_pir():
    """Initialize PIR sensor on IRIV GPIO"""
    if not ON_IRIV:
        logger.info("[SIM] PIR sensor simulation mode")
        return None
    try:
        import RPi.GPIO as GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(PIR_GPIO_PIN, GPIO.IN)
        logger.info(f"PIR sensor initialized on GPIO {PIR_GPIO_PIN}")
        return GPIO
    except ImportError:
        logger.warning("RPi.GPIO not available")
        return None

def pir_triggered(gpio):
    """Check if PIR sensor detected motion"""
    if not ON_IRIV or gpio is None:
        return False
    try:
        import RPi.GPIO as GPIO
        return GPIO.input(PIR_GPIO_PIN) == GPIO.HIGH
    except Exception:
        return False

# ── Camera Setup ─────────────────────────────────────────────
def setup_camera():
    """Initialize camera"""
    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 15)
    if cap.isOpened():
        logger.info("Camera initialized")
    else:
        logger.error("Cannot open camera")
    return cap

def capture_snapshot(cap, threat_level="unknown"):
    """Capture a snapshot from camera"""
    # Warm up
    for _ in range(3):
        cap.read()

    ret, frame = cap.read()
    if not ret:
        logger.error("Failed to capture frame")
        return None, None

    timestamp  = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename   = f"security_{threat_level}_{timestamp}.jpg"
    filepath   = SNAPSHOT_DIR / filename

    # Add timestamp overlay to image
    cv2.putText(
        frame,
        f"SECURITY CAM | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7, (0, 255, 0), 2
    )

    cv2.imwrite(str(filepath), frame)
    logger.info(f"Snapshot saved: {filepath}")
    return str(filepath), frame

# ── Software Motion Detection ─────────────────────────────────
class MotionDetector:
    """Frame difference based motion detection"""
    def __init__(self):
        self.prev_frame = None

    def detect(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        if self.prev_frame is None:
            self.prev_frame = gray
            return False, 0

        diff          = cv2.absdiff(self.prev_frame, gray)
        _, thresh     = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
        dilated       = cv2.dilate(thresh, None, iterations=2)
        motion_pixels = cv2.countNonZero(dilated)

        self.prev_frame = gray
        return motion_pixels > MOTION_THRESHOLD, motion_pixels

# ── YOLOv8 Threat Classification ─────────────────────────────
def load_security_model():
    """Load YOLOv8n pretrained COCO model for person/animal detection"""
    try:
        from ultralytics import YOLO
        # Uses pretrained COCO weights — detects persons and animals
        model = YOLO("yolov8n.pt")
        logger.info("Security AI model loaded (YOLOv8n COCO)")
        return model
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None

def classify_threat(model, frame):
    """
    Layer 3 — AI classification of detected subject
    Returns: threat_type, confidence, annotated_frame, detections
    """
    if model is None:
        return "unknown", 0.0, frame, []

    try:
        results    = model(frame, conf=0.35, verbose=False)
        detections = []
        threat_type = "unknown"
        best_conf   = 0.0

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf   = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                if cls_id in PERSON_CLASSES and conf >= PERSON_CONF:
                    label = "person"
                    color = THREAT_MAP['person']['color']
                    if conf > best_conf:
                        threat_type = "person"
                        best_conf   = conf

                elif cls_id in ANIMAL_CLASSES and conf >= ANIMAL_CONF:
                    label = r.names[cls_id]
                    color = THREAT_MAP['animal']['color']
                    if conf > best_conf and threat_type != "person":
                        threat_type = "animal"
                        best_conf   = conf
                else:
                    continue

                # Draw bounding box on frame
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(
                    frame,
                    f"{label} {conf:.0%}",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6, color, 2
                )

                detections.append({
                    "label":      label,
                    "confidence": round(conf * 100, 1),
                    "bbox":       [x1, y1, x2, y2]
                })

        return threat_type, round(best_conf * 100, 1), frame, detections

    except Exception as e:
        logger.error(f"Classification error: {e}")
        return "unknown", 0.0, frame, []

# ── Database Logging ─────────────────────────────────────────
def save_security_event(threat_type, confidence, snapshot_path, detections):
    """Save security event to MySQL alerts table"""
    try:
        import pymysql
        conn = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "fyp1234"),
            database=os.getenv("DB_NAME", "fyp_oil_palm")
        )
        cursor = conn.cursor()

        threat_info = THREAT_MAP.get(threat_type, THREAT_MAP['unknown'])
        message     = (
            f"Security Alert: {threat_type.upper()} detected "
            f"({confidence:.1f}% confidence) — {len(detections)} object(s) found"
        )

        cursor.execute("""
            INSERT INTO alerts
            (alert_type, message, sensor_value, threshold, acknowledged)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            f"security_{threat_type}",
            message,
            confidence,
            PERSON_CONF * 100,
            False
        ))
        conn.commit()
        conn.close()
        logger.info(f"Security event saved to DB: {threat_type}")
        return True
    except Exception as e:
        logger.error(f"DB save failed: {e}")
        return False

# ── Telegram Alerts ──────────────────────────────────────────
async def send_security_alert(threat_type, confidence, snapshot_path, detections):
    """Send Telegram alert with snapshot photo"""
    from telegram_bot import send_photo, send_message

    threat_info = THREAT_MAP.get(threat_type, THREAT_MAP['unknown'])
    emoji       = threat_info['emoji']
    level       = threat_info['level']

    det_summary = "\n".join([
        f"  • {d['label']} ({d['confidence']}%)"
        for d in detections[:5]
    ]) or "  • Unknown subject"

    caption = (
        f"{emoji} <b>SECURITY ALERT — {level}</b>\n\n"
        f"🎯 Threat Type: <b>{threat_type.upper()}</b>\n"
        f"📊 Confidence: <b>{confidence:.1f}%</b>\n"
        f"🔍 Detected Objects:\n{det_summary}\n\n"
        f"📸 Snapshot captured\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        f"⚡ Powered by YOLOv8n Triple Layer Security"
    )

    if snapshot_path and os.path.exists(snapshot_path):
        await send_photo(snapshot_path, caption)
    else:
        await send_message(caption)

    logger.info(f"Telegram alert sent: {threat_type} ({level})")

# ── Simulation Mode ──────────────────────────────────────────
def simulate_pir_trigger(interval=15):
    """Simulate PIR trigger every N seconds in Windows mode"""
    return (int(time.time()) % interval) == 0

# ── Main Security Loop ────────────────────────────────────────
def main():
    mode = "IRIV Hardware" if ON_IRIV else "Simulation (Windows)"
    logger.info("=" * 60)
    logger.info(f"🛡️  Triple Layer Security System Started — {mode}")
    logger.info(f"Layer 1: PIR Motion Sensor (GPIO {PIR_GPIO_PIN})")
    logger.info(f"Layer 2: Camera Snapshot (Index {CAMERA_INDEX})")
    logger.info(f"Layer 3: YOLOv8n AI Classification")
    logger.info("=" * 60)

    # Initialize components
    gpio          = setup_pir()
    cap           = setup_camera()
    model         = load_security_model()
    motion_detect = MotionDetector()

    last_alert_time = 0

    logger.info("System armed — monitoring for intrusions...")

    try:
        while True:
            motion_detected = False

            if ON_IRIV:
                # ── LAYER 1: Hardware PIR ──────────────────
                if pir_triggered(gpio):
                    logger.info("🔴 Layer 1: PIR sensor triggered!")
                    motion_detected = True
            else:
                # ── LAYER 1 (SIM): Software Motion Detection
                ret, frame = cap.read()
                if ret:
                    sw_motion, pixels = motion_detect.detect(frame)
                    if sw_motion:
                        logger.info(f"[SIM] Layer 1: Software motion detected ({pixels} pixels changed)")
                        motion_detected = True
                elif simulate_pir_trigger(interval=20):
                    logger.info("[SIM] Layer 1: Simulated PIR trigger")
                    motion_detected = True

            # ── LAYER 2: Camera Capture ────────────────────
            if motion_detected:
                now = time.time()
                if now - last_alert_time < COOLDOWN_SECS:
                    logger.info(f"Cooldown active — {COOLDOWN_SECS - int(now - last_alert_time)}s remaining")
                    time.sleep(1)
                    continue

                logger.info("📸 Layer 2: Capturing snapshot...")
                snapshot_path, frame = capture_snapshot(cap, "detecting")

                if frame is None:
                    logger.warning("Snapshot failed — skipping")
                    time.sleep(2)
                    continue

                # ── LAYER 3: AI Classification ─────────────
                logger.info("🤖 Layer 3: AI classifying threat...")
                threat_type, confidence, annotated_frame, detections = classify_threat(model, frame)

                threat_info = THREAT_MAP.get(threat_type, THREAT_MAP['unknown'])
                logger.info(
                    f"Classification result: {threat_type.upper()} "
                    f"— {threat_info['level']} THREAT "
                    f"({confidence:.1f}% confidence)"
                )

                # Save annotated snapshot
                if annotated_frame is not None and snapshot_path:
                    annotated_path = snapshot_path.replace(".jpg", "_annotated.jpg")
                    cv2.imwrite(annotated_path, annotated_frame)
                    snapshot_path = annotated_path

                # ── Action Based on Threat Level ───────────
                if threat_info['level'] in ['HIGH', 'MEDIUM']:
                    logger.warning(
                        f"⚠️  {threat_info['level']} THREAT DETECTED: "
                        f"{threat_type} ({confidence:.1f}%)"
                    )

                    # Save to database
                    save_security_event(threat_type, confidence, snapshot_path, detections)

                    # Send Telegram alert with photo
                    asyncio.run(send_security_alert(
                        threat_type, confidence, snapshot_path, detections
                    ))

                    last_alert_time = time.time()

                elif threat_info['level'] == 'LOW':
                    logger.info(f"✅ False alarm — no significant threat detected")

            time.sleep(0.5)

    except KeyboardInterrupt:
        logger.info("\nSecurity system stopped")
    finally:
        cap.release()
        if ON_IRIV and gpio:
            try:
                import RPi.GPIO as GPIO
                GPIO.cleanup()
            except Exception:
                pass

if __name__ == "__main__":
    main()