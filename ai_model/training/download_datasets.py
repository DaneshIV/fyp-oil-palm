import os
import yaml
from pathlib import Path
from roboflow import Roboflow

BASE_DIR     = Path(__file__).parent.parent
ROBOFLOW_DIR = BASE_DIR / "datasets" / "roboflow_v2"
ROBOFLOW_DIR.mkdir(parents=True, exist_ok=True)

API_KEY = "SQcyUNYF6slikKXGS40d"  # ← Replace this!

DATASETS = [
    {"workspace": "daneshs-workspace-6ywsm", "project": "palm-oil-leaf-disease-revision-rfwqb",       "version": 1, "folder": "palm_leaf_disease"},
    {"workspace": "daneshs-workspace-6ywsm", "project": "indikasi-ganoderma-fp2wq-nsgtb",             "version": 1, "folder": "indikasi_ganoderma"},
    {"workspace": "daneshs-workspace-6ywsm", "project": "oil-palm-ganoderma-detection-2-zqotq",       "version": 1, "folder": "binus_ganoderma_2"},
    {"workspace": "daneshs-workspace-6ywsm", "project": "oil-palm-ganoderma-detection-zq8ow",         "version": 1, "folder": "binus_ganoderma_1"},
    {"workspace": "daneshs-workspace-6ywsm", "project": "oil-palm-tree-zyvyi-5kqzw",                  "version": 1, "folder": "oil_palm_tree"},
    {"workspace": "daneshs-workspace-6ywsm", "project": "palm-leaves-disease-detection-56cqr",        "version": 1, "folder": "palm_leaves_disease"},
    {"workspace": "daneshs-workspace-6ywsm", "project": "oil-palm-tree-health-detection-5ms7n",       "version": 1, "folder": "tree_health_detection"},
    {"workspace": "daneshs-workspace-6ywsm", "project": "palm-oil-onmsi-dbkzu",                       "version": 1, "folder": "palm_oil_onmsi"},
    {"workspace": "daneshs-workspace-6ywsm", "project": "palm-oil-leaf-ganoderma-yqnaa",              "version": 1, "folder": "palm_leaf_ganoderma"},
    {"workspace": "daneshs-workspace-6ywsm", "project": "oil-palm-health-detection-7akmp",            "version": 1, "folder": "oil_palm_health"},
]

def download_all():
    rf = Roboflow(api_key=API_KEY)

    print("=" * 60)
    print("Downloading Roboflow Datasets v2")
    print("=" * 60)

    summary = []

    for ds in DATASETS:
        print(f"\n📦 {ds['project']}")
        try:
            project = rf.workspace(ds["workspace"]).project(ds["project"])
            version = project.version(ds["version"])
            dst     = str(ROBOFLOW_DIR / ds["folder"])
            version.download("yolov8", location=dst)

            # Read data.yaml
            yaml_path = Path(dst) / "data.yaml"
            if yaml_path.exists():
                with open(yaml_path) as f:
                    data = yaml.safe_load(f)
                classes = data.get("names", [])
                nc      = data.get("nc", 0)

                # Count images
                train_count = len(list((Path(dst) / "train" / "images").glob("*"))) if (Path(dst) / "train" / "images").exists() else 0
                val_count   = len(list((Path(dst) / "valid" / "images").glob("*"))) if (Path(dst) / "valid" / "images").exists() else 0

                print(f"  ✅ Classes ({nc}): {classes}")
                print(f"  📸 Train: {train_count} | Val: {val_count}")

                summary.append({
                    "folder":  ds["folder"],
                    "classes": classes,
                    "train":   train_count,
                    "val":     val_count,
                })
            else:
                print(f"  ⚠️ No data.yaml found")

        except Exception as e:
            print(f"  ❌ Failed: {e}")
            summary.append({"folder": ds["folder"], "error": str(e)})

    # Print summary table
    print("\n" + "=" * 60)
    print("📊 DOWNLOAD SUMMARY")
    print("=" * 60)
    print(f"{'Dataset':<30} {'Train':>7} {'Val':>7} {'Classes'}")
    print("-" * 60)
    for s in summary:
        if "error" not in s:
            print(f"{s['folder']:<30} {s['train']:>7} {s['val']:>7}  {s['classes']}")
        else:
            print(f"{s['folder']:<30} {'ERROR':>7}  {s['error'][:30]}")

    print("\n🎉 Done!")

if __name__ == "__main__":
    download_all()