import cv2
import os
import sys
import logging
from datetime import datetime
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Config ───────────────────────────────────────────────────
IMAGES_DIR   = Path(__file__).parent.parent / "captured_images"
IMAGES_DIR.mkdir(exist_ok=True)
ON_IRIV      = sys.platform == 'linux'
CAMERA_INDEX = 0
IMG_WIDTH    = 1280
IMG_HEIGHT   = 720

def capture_image():
    """Capture image from USB/CSI camera"""
    try:
        cap = cv2.VideoCapture(CAMERA_INDEX)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH,  IMG_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, IMG_HEIGHT)

        if not cap.isOpened():
            logger.error(f"Cannot open camera {CAMERA_INDEX}")
            return None

        # Warm up camera
        for _ in range(3):
            cap.read()

        ret, frame = cap.read()
        cap.release()

        if not ret:
            logger.error("Failed to capture frame")
            return None

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"capture_{timestamp}.jpg"
        filepath  = IMAGES_DIR / filename
        cv2.imwrite(str(filepath), frame)
        logger.info(f"Image saved: {filepath}")
        return str(filepath)

    except Exception as e:
        logger.error(f"Camera capture failed: {e}")
        return None

def get_test_image():
    """Get a test image from dataset for simulation"""
    test_dir = Path(__file__).parent.parent / "ai_model" / "datasets" / "balanced" / "test" / "images"
    if test_dir.exists():
        images = list(test_dir.glob("*.jpg"))
        if images:
            import random
            img = random.choice(images)
            logger.info(f"[SIM] Using test image: {img.name}")
            return str(img)
    logger.warning("No test images found for simulation")
    return None

def get_latest_image():
    """Get the most recently captured image"""
    images = sorted(IMAGES_DIR.glob("*.jpg"), key=os.path.getmtime, reverse=True)
    return str(images[0]) if images else None

if __name__ == "__main__":
    if ON_IRIV:
        path = capture_image()
    else:
        logger.info("[SIM] Running in simulation mode — using test image")
        path = get_test_image()

    if path:
        print(f"Image ready: {path}")
    else:
        print("No image available")