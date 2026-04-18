from ultralytics import YOLO
from pathlib import Path
import torch
import yaml

# ── CONFIG ──────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
DATA_YAML = BASE_DIR / "data_v2.yaml"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

# Training config
CONFIG = {
    "model":      "yolov8n.pt",   # nano — fastest, good for edge deployment
    "data":       str(DATA_YAML),
    "epochs":     50,
    "imgsz":      640,
    "batch":      16,
    "device":     0,              # RTX 3060 GPU
    "workers":    4,
    "patience":   15,             # Early stopping
    "optimizer":  "AdamW",
    "lr0":        0.001,
    "lrf":        0.01,
    "momentum":   0.937,
    "weight_decay": 0.0005,
    "warmup_epochs": 3,
    "augment":    True,
    "hsv_h":      0.015,          # Hue augmentation
    "hsv_s":      0.7,            # Saturation augmentation
    "hsv_v":      0.4,            # Value augmentation
    "degrees":    10,             # Rotation
    "translate":  0.1,
    "scale":      0.5,
    "flipud":     0.1,
    "fliplr":     0.5,
    "mosaic":     1.0,
    "project":    str(BASE_DIR / "runs"),
    "name":       "oil_palm_v3",
    "exist_ok":   True,
    "pretrained": True,
    "verbose":    True,
}

def check_gpu():
    print("=" * 60)
    print("GPU Check")
    print("=" * 60)
    if torch.cuda.is_available():
        gpu = torch.cuda.get_device_name(0)
        vram = round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 1)
        print(f"✅ GPU: {gpu}")
        print(f"✅ VRAM: {vram} GB")
        print(f"✅ CUDA: {torch.version.cuda}")
    else:
        print("❌ No GPU found — training on CPU (slow!)")
    print()

def check_dataset():
    print("=" * 60)
    print("Dataset Check")
    print("=" * 60)
    with open(DATA_YAML) as f:
        data = yaml.safe_load(f)

    dataset_path = Path(data["path"])
    classes = data["names"]
    print(f"📁 Dataset: {dataset_path}")
    print(f"🏷️  Classes: {classes}")

    for split in ["train", "val", "test"]:
        img_dir = dataset_path / split / "images"
        if img_dir.exists():
            count = len(list(img_dir.glob("*")))
            print(f"  {split:6}: {count} images")
        else:
            print(f"  {split:6}: NOT FOUND ❌")
    print()

def train():
    check_gpu()
    check_dataset()

    print("=" * 60)
    print("Starting YOLOv8 Training")
    print("=" * 60)
    print(f"Model:   {CONFIG['model']}")
    print(f"Epochs:  {CONFIG['epochs']}")
    print(f"Batch:   {CONFIG['batch']}")
    print(f"Image:   {CONFIG['imgsz']}x{CONFIG['imgsz']}")
    print(f"Device:  GPU {CONFIG['device']}")
    print()

    # Load model
    model = YOLO(CONFIG["model"])

    # Train
    results = model.train(**CONFIG)

    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)

    # Save best model to models folder
    best_model_src = Path(CONFIG["project"]) / CONFIG["name"] / "weights" / "best.pt"
    best_model_dst = MODELS_DIR / "best_v3.pt"  # ← save separately!

    if best_model_src.exists():
        import shutil
        shutil.copy2(best_model_src, best_model_dst)
        print(f"✅ Best model saved to: {best_model_dst}")
    else:
        print(f"⚠️ Could not find best.pt at {best_model_src}")

    # Print results summary
    print(f"\n📊 Results saved to: {Path(CONFIG['project']) / CONFIG['name']}")
    print(f"📈 Check runs/oil_palm_v1/ for training charts")

    return results

if __name__ == "__main__":
    train()