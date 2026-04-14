import os
import shutil
import yaml
import random
from pathlib import Path

# ── CONFIG ──────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
ROBOFLOW_DIR = BASE_DIR / "datasets" / "roboflow"
COMBINED_DIR = BASE_DIR / "datasets" / "combined"

# Our unified classes
CLASSES = ["healthy", "ganoderma", "unhealthy", "immature"]
CLASS_TO_ID = {c: i for i, c in enumerate(CLASSES)}

# Class mapping from each dataset to our unified classes
# Format: {dataset_name: {original_class_id: our_class_id or None to skip}}
CLASS_MAPPING = {
    "palm_leaf_ganoderma": {
        0: 0,  # Healthy    → healthy
        1: 1,  # Infected   → ganoderma
        2: 1,  # Initial Infection → ganoderma
    },
    "oil_palm_health": {
        0: 0,  # Healthy   → healthy
        1: 2,  # Unhealthy → unhealthy
    },
    "tree_health_detection": {
        0: None,  # '5'      → skip
        1: None,  # Grass    → skip
        2: 0,     # healthy  → healthy
        3: 3,     # immature → immature
        4: 2,     # stressed → unhealthy
        5: 2,     # unhealthy → unhealthy
    },
}

def remap_label_file(src_path, dst_path, mapping):
    """Read a YOLO label file, remap class IDs, write to destination"""
    lines_out = []
    try:
        with open(src_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split()
                orig_class = int(parts[0])
                new_class = mapping.get(orig_class, None)
                if new_class is None:
                    continue  # Skip this class
                parts[0] = str(new_class)
                lines_out.append(' '.join(parts))
    except Exception as e:
        print(f"Error reading {src_path}: {e}")
        return 0

    if lines_out:
        with open(dst_path, 'w') as f:
            f.write('\n'.join(lines_out))
        return len(lines_out)
    return 0

def copy_dataset(dataset_name, split):
    """Copy images and remapped labels from one dataset split"""
    mapping = CLASS_MAPPING[dataset_name]
    src_images = ROBOFLOW_DIR / dataset_name / split / "images"
    src_labels = ROBOFLOW_DIR / dataset_name / split / "labels"

    # Map Roboflow 'valid' → our 'val'
    dst_split = "val" if split == "valid" else split
    dst_images = COMBINED_DIR / dst_split / "images"
    dst_labels = COMBINED_DIR / dst_split / "labels"

    dst_images.mkdir(parents=True, exist_ok=True)
    dst_labels.mkdir(parents=True, exist_ok=True)

    if not src_images.exists():
        print(f"  Skipping {dataset_name}/{split} — folder not found")
        return 0, 0

    images_copied = 0
    labels_copied = 0

    for img_path in src_images.glob("*"):
        if img_path.suffix.lower() not in ['.jpg', '.jpeg', '.png']:
            continue

        # Unique filename to avoid conflicts between datasets
        new_name = f"{dataset_name}_{img_path.name}"
        dst_img = dst_images / new_name

        # Check corresponding label file
        label_path = src_labels / (img_path.stem + ".txt")
        dst_label = dst_labels / (Path(new_name).stem + ".txt")

        if label_path.exists():
            n = remap_label_file(label_path, dst_label, mapping)
            if n == 0:
                continue  # All classes were skipped
            labels_copied += 1

        shutil.copy2(img_path, dst_img)
        images_copied += 1

    return images_copied, labels_copied

def build_data_yaml():
    """Write the unified data.yaml for YOLOv8 training"""
    yaml_path = BASE_DIR / "data.yaml"
    data = {
        "path": str(COMBINED_DIR),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": len(CLASSES),
        "names": CLASSES,
    }
    with open(yaml_path, 'w') as f:
        yaml.dump(data, f, default_flow_style=False)
    print(f"\n✅ data.yaml written to: {yaml_path}")

def count_class_distribution():
    """Count how many labels per class in combined dataset"""
    counts = {c: 0 for c in CLASSES}
    labels_dir = COMBINED_DIR / "train" / "labels"
    for lbl in labels_dir.glob("*.txt"):
        with open(lbl) as f:
            for line in f:
                if line.strip():
                    cls = int(line.split()[0])
                    if cls < len(CLASSES):
                        counts[CLASSES[cls]] += 1
    return counts

def main():
    print("=" * 60)
    print("Oil Palm Dataset Merger")
    print("=" * 60)

    # Clean combined dir
    if COMBINED_DIR.exists():
        print(f"Cleaning existing combined dataset...")
        shutil.rmtree(COMBINED_DIR)

    total_images = 0
    total_labels = 0

    for dataset_name in CLASS_MAPPING.keys():
        print(f"\n📦 Processing: {dataset_name}")
        for split in ["train", "valid", "test"]:
            imgs, lbls = copy_dataset(dataset_name, split)
            dst_split = "val" if split == "valid" else split
            print(f"  {dst_split}: {imgs} images, {lbls} labels")
            total_images += imgs
            total_labels += lbls

    print(f"\n{'=' * 60}")
    print(f"✅ Total images copied: {total_images}")
    print(f"✅ Total labels copied: {total_labels}")

    # Build data.yaml
    build_data_yaml()

    # Show class distribution
    print("\n📊 Class Distribution (train set):")
    dist = count_class_distribution()
    for cls, count in dist.items():
        bar = "█" * (count // 50)
        print(f"  {cls:12} {count:5} {bar}")

    print("\n🎉 Dataset preparation complete!")
    print(f"📁 Combined dataset: {COMBINED_DIR}")

if __name__ == "__main__":
    main()