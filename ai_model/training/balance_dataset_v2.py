import os
import shutil
import random
from pathlib import Path
from collections import defaultdict

BASE_DIR     = Path(__file__).parent.parent
COMBINED_DIR = BASE_DIR / "datasets" / "combined_v2"
BALANCED_DIR = BASE_DIR / "datasets" / "balanced_v2"

CLASSES          = ["healthy", "ganoderma", "unhealthy", "immature"]
TARGET_PER_CLASS = 2000  # Higher target since we have more data now

def get_class_files(labels_dir):
    counts = defaultdict(list)
    for lbl_file in Path(labels_dir).glob("*.txt"):
        with open(lbl_file) as f:
            classes_in_file = set()
            for line in f:
                if line.strip():
                    cls = int(line.split()[0])
                    classes_in_file.add(cls)
        for cls in classes_in_file:
            counts[cls].append(lbl_file.stem)
    return counts

def find_image(stem, src_img_dir):
    for ext in ['.jpg', '.jpeg', '.png']:
        p = Path(src_img_dir) / (stem + ext)
        if p.exists():
            return p
    return None

def copy_pair(stem, src_img_dir, src_lbl_dir, dst_img_dir, dst_lbl_dir, suffix=""):
    img = find_image(stem, src_img_dir)
    lbl = Path(src_lbl_dir) / (stem + ".txt")
    if img and lbl.exists():
        shutil.copy2(img,  Path(dst_img_dir) / (stem + suffix + img.suffix))
        shutil.copy2(lbl,  Path(dst_lbl_dir) / (stem + suffix + ".txt"))
        return True
    return False

def balance_train():
    src_img = COMBINED_DIR / "train" / "images"
    src_lbl = COMBINED_DIR / "train" / "labels"
    dst_img = BALANCED_DIR / "train" / "images"
    dst_lbl = BALANCED_DIR / "train" / "labels"
    dst_img.mkdir(parents=True, exist_ok=True)
    dst_lbl.mkdir(parents=True, exist_ok=True)

    class_files = get_class_files(src_lbl)

    print("\n  Train — Before:")
    for i, cls in enumerate(CLASSES):
        print(f"    {cls:12}: {len(class_files.get(i, []))} images")

    all_selected = {}

    for cls_id in range(len(CLASSES)):
        files = class_files.get(cls_id, [])
        if not files:
            print(f"  WARNING: No files for {CLASSES[cls_id]}")
            continue

        copies_needed = (TARGET_PER_CLASS // len(files)) + 1
        pool          = (files * copies_needed)[:TARGET_PER_CLASS]
        random.shuffle(pool)

        for i, stem in enumerate(pool):
            suffix = f"_dup{i}" if i >= len(files) else ""
            key    = stem + suffix
            if key not in all_selected:
                all_selected[key] = (stem, suffix)

    copied = 0
    for key, (stem, suffix) in all_selected.items():
        if copy_pair(stem, src_img, src_lbl, dst_img, dst_lbl, suffix):
            copied += 1

    final = get_class_files(dst_lbl)
    print("\n  Train — After:")
    for i, cls in enumerate(CLASSES):
        print(f"    {cls:12}: {len(final.get(i, []))} images")

    return copied

def copy_split(split):
    src_img = COMBINED_DIR / split / "images"
    src_lbl = COMBINED_DIR / split / "labels"
    dst_img = BALANCED_DIR / split / "images"
    dst_lbl = BALANCED_DIR / split / "labels"
    dst_img.mkdir(parents=True, exist_ok=True)
    dst_lbl.mkdir(parents=True, exist_ok=True)

    copied = 0
    for lbl in Path(src_lbl).glob("*.txt"):
        if copy_pair(lbl.stem, src_img, src_lbl, dst_img, dst_lbl):
            copied += 1

    counts = get_class_files(dst_lbl)
    print(f"\n  {split}:")
    for i, cls in enumerate(CLASSES):
        print(f"    {cls:12}: {len(counts.get(i, []))} images")
    return copied

def update_data_yaml():
    import yaml
    yaml_path = BASE_DIR / "data_v2.yaml"
    data = {
        "path":  str(BALANCED_DIR).replace("\\", "/"),
        "train": "train/images",
        "val":   "val/images",
        "test":  "test/images",
        "nc":    len(CLASSES),
        "names": CLASSES,
    }
    with open(yaml_path, 'w') as f:
        yaml.dump(data, f, default_flow_style=False)
    print(f"\n✅ data_v2.yaml updated → {yaml_path}")

def main():
    print("=" * 60)
    print("Dataset Balancer v2")
    print("=" * 60)

    random.seed(42)

    if BALANCED_DIR.exists():
        print("Cleaning existing balanced_v2...")
        shutil.rmtree(BALANCED_DIR)

    total  = 0
    total += balance_train()
    total += copy_split("val")
    total += copy_split("test")

    update_data_yaml()

    print(f"\n{'=' * 60}")
    print(f"✅ Total files: {total}")
    print(f"📁 Balanced: {BALANCED_DIR}")
    print("🎉 Ready to train!")

if __name__ == "__main__":
    main()