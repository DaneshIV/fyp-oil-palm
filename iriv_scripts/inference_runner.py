import cv2
import numpy as np
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR   = Path(__file__).parent.parent
MODEL_PATH = BASE_DIR / "ai_model" / "models" / "best.onnx"
ON_IRIV    = sys.platform == 'linux'

CLASSES      = ["healthy", "ganoderma", "unhealthy", "immature"]
SEVERITY_MAP = {
    "healthy":   "None",
    "ganoderma": "High",
    "unhealthy": "Medium",
    "immature":  "Low",
}
CONF_THRES = 0.5
IOU_THRES  = 0.45
IMG_SIZE   = 640

def load_model():
    try:
        import onnxruntime as ort
        providers = ['CPUExecutionProvider']
        session   = ort.InferenceSession(str(MODEL_PATH), providers=providers)
        logger.info(f"ONNX model loaded: {MODEL_PATH}")
        return session
    except Exception as e:
        logger.error(f"Model load failed: {e}")
        return None

def preprocess(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None, None
    orig_shape  = img.shape[:2]
    img_resized = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    img_rgb     = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    img_norm    = img_rgb.astype(np.float32) / 255.0
    img_input   = np.transpose(img_norm, (2, 0, 1))[np.newaxis, :]
    return img_input, orig_shape

def postprocess(outputs):
    output     = outputs[0][0]
    detections = []
    for i in range(output.shape[1]):
        scores = output[4:, i]
        cls_id = int(np.argmax(scores))
        conf   = float(scores[cls_id])
        if conf >= CONF_THRES:
            detections.append({
                "class_id":   cls_id,
                "class_name": CLASSES[cls_id],
                "confidence": round(conf * 100, 1),
                "severity":   SEVERITY_MAP.get(CLASSES[cls_id], "Unknown")
            })
    return detections

def run_inference(image_path, session):
    img_input, _ = preprocess(image_path)
    if img_input is None:
        return None

    input_name = session.get_inputs()[0].name
    outputs    = session.run(None, {input_name: img_input})
    detections = postprocess(outputs)

    if not detections:
        return {
            "disease_label": "healthy",
            "confidence":    0.0,
            "severity":      "None",
            "detections":    [],
            "image_path":    image_path,
            "timestamp":     datetime.now().isoformat()
        }

    best = max(detections, key=lambda x: x["confidence"])
    return {
        "disease_label": best["class_name"],
        "confidence":    best["confidence"],
        "severity":      best["severity"],
        "detections":    detections,
        "image_path":    image_path,
        "timestamp":     datetime.now().isoformat()
    }

def save_to_mysql(result, tree_id="auto", block_id="auto"):
    try:
        import pymysql
        from dotenv import load_dotenv
        load_dotenv()

        conn   = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "fyp1234"),
            database=os.getenv("DB_NAME", "fyp_oil_palm")
        )
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO disease_detections
            (image_path, disease_label, confidence, severity, tree_id, block_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            result["image_path"],
            result["disease_label"],
            result["confidence"],
            result["severity"],
            tree_id,
            block_id
        ))
        conn.commit()
        conn.close()
        logger.info(f"Result saved: {result['disease_label']} ({result['confidence']}%)")
        return True
    except Exception as e:
        logger.error(f"MySQL save failed: {e}")
        return False

def send_alert(result):
    if result["disease_label"] == "healthy":
        return
    try:
        import asyncio
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from telegram_bot import alert_disease_detected
        asyncio.run(alert_disease_detected(
            disease_label=result["disease_label"],
            confidence=result["confidence"],
            severity=result["severity"],
            tree_id="auto",
            block_id="auto",
        ))
    except Exception as e:
        logger.error(f"Telegram alert failed: {e}")

def main():
    session = load_model()
    if not session:
        logger.error("Cannot load model — exiting")
        return

    # Get image
    if ON_IRIV:
        from camera_capture import capture_image
        image_path = capture_image()
    else:
        from camera_capture import get_test_image
        image_path = get_test_image()

    if not image_path:
        logger.error("No image available")
        return

    logger.info(f"Running inference on: {Path(image_path).name}")
    result = run_inference(image_path, session)

    if result:
        logger.info(f"Detection: {result['disease_label']} — {result['confidence']}% confidence — {result['severity']} severity")
        save_to_mysql(result)
        send_alert(result)
        return result

if __name__ == "__main__":
    main()