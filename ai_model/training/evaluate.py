from ultralytics import YOLO
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import yaml
import json

BASE_DIR    = Path(__file__).parent.parent
DATA_YAML   = BASE_DIR / "data.yaml"
RESULTS_DIR = BASE_DIR / "runs" / "evaluation"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

CLASSES = ["healthy", "ganoderma", "unhealthy", "immature"]
COLORS  = ["#4ade80", "#f87171", "#facc15", "#c084fc"]

def evaluate_model(model_path):
    print("=" * 60)
    print(f"Evaluating: {model_path.name}")
    print("=" * 60)

    model = YOLO(str(model_path))

    metrics = model.val(
        data=str(DATA_YAML),
        split="test",
        conf=0.5,
        iou=0.45,
        plots=True,
        project=str(RESULTS_DIR),
        name=model_path.stem,
        exist_ok=True,
        verbose=False,
    )
    return metrics

def plot_class_metrics(metrics_v1, metrics_v2=None):
    """Plot per-class mAP50 comparison bar chart"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    fig.suptitle("Oil Palm Disease Detection — Model Evaluation", fontsize=14, fontweight="bold")

    # mAP50 per class
    ax1 = axes[0]
    x = np.arange(len(CLASSES))
    width = 0.35

    map50_v1 = [float(metrics_v1.box.ap50[i]) * 100 for i in range(len(CLASSES))]

    if metrics_v2:
        map50_v2 = [float(metrics_v2.box.ap50[i]) * 100 for i in range(len(CLASSES))]
        bars1 = ax1.bar(x - width/2, map50_v1, width, label="YOLOv8n", color="#60a5fa", alpha=0.8)
        bars2 = ax1.bar(x + width/2, map50_v2, width, label="YOLOv8s", color="#4ade80", alpha=0.8)
        ax1.legend()
    else:
        bars1 = ax1.bar(x, map50_v1, width=0.5, color=COLORS, alpha=0.85)

    ax1.set_xlabel("Class")
    ax1.set_ylabel("mAP@0.5 (%)")
    ax1.set_title("mAP@0.5 Per Class")
    ax1.set_xticks(x)
    ax1.set_xticklabels(CLASSES, rotation=15)
    ax1.set_ylim(0, 110)
    ax1.axhline(y=75, color="red", linestyle="--", alpha=0.4, label="75% baseline")
    ax1.grid(axis="y", alpha=0.3)

    # Add value labels on bars
    for bar in bars1:
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                f"{bar.get_height():.1f}%", ha="center", va="bottom", fontsize=9)

    # Precision vs Recall
    ax2 = axes[1]
    precision = [float(metrics_v1.box.p[i]) * 100 for i in range(len(CLASSES))]
    recall    = [float(metrics_v1.box.r[i]) * 100 for i in range(len(CLASSES))]

    ax2.scatter(recall, precision, c=COLORS, s=200, zorder=5)
    for i, cls in enumerate(CLASSES):
        ax2.annotate(cls, (recall[i], precision[i]),
                    textcoords="offset points", xytext=(8, 4), fontsize=9)

    ax2.set_xlabel("Recall (%)")
    ax2.set_ylabel("Precision (%)")
    ax2.set_title("Precision vs Recall Per Class")
    ax2.set_xlim(0, 110)
    ax2.set_ylim(0, 110)
    ax2.grid(alpha=0.3)
    ax2.axhline(y=50, color="gray", linestyle="--", alpha=0.3)
    ax2.axvline(x=50, color="gray", linestyle="--", alpha=0.3)

    plt.tight_layout()
    out = RESULTS_DIR / "class_metrics_comparison.png"
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"✅ Chart saved: {out}")

def plot_overall_comparison(metrics_v1, metrics_v2=None):
    """Plot overall metrics comparison"""
    fig, ax = plt.subplots(figsize=(10, 5))

    metric_names = ["Precision", "Recall", "mAP@0.5", "mAP@0.5:0.95"]
    v1_vals = [
        float(metrics_v1.box.mp) * 100,
        float(metrics_v1.box.mr) * 100,
        float(metrics_v1.box.map50) * 100,
        float(metrics_v1.box.map) * 100,
    ]

    x = np.arange(len(metric_names))
    width = 0.35

    if metrics_v2:
        v2_vals = [
            float(metrics_v2.box.mp) * 100,
            float(metrics_v2.box.mr) * 100,
            float(metrics_v2.box.map50) * 100,
            float(metrics_v2.box.map) * 100,
        ]
        ax.bar(x - width/2, v1_vals, width, label="YOLOv8n", color="#60a5fa", alpha=0.85)
        ax.bar(x + width/2, v2_vals, width, label="YOLOv8s", color="#4ade80", alpha=0.85)
        ax.legend(fontsize=11)

        # Add value labels
        for i, (v1, v2) in enumerate(zip(v1_vals, v2_vals)):
            ax.text(i - width/2, v1 + 0.5, f"{v1:.1f}%", ha="center", fontsize=8)
            ax.text(i + width/2, v2 + 0.5, f"{v2:.1f}%", ha="center", fontsize=8)
    else:
        bars = ax.bar(x, v1_vals, width=0.5, color="#60a5fa", alpha=0.85)
        for bar in bars:
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                   f"{bar.get_height():.1f}%", ha="center", fontsize=9)

    ax.set_xlabel("Metric")
    ax.set_ylabel("Score (%)")
    ax.set_title("Overall Model Performance — Oil Palm Disease Detection")
    ax.set_xticks(x)
    ax.set_xticklabels(metric_names)
    ax.set_ylim(0, 110)
    ax.axhline(y=75, color="red", linestyle="--", alpha=0.4, label="75% target")
    ax.grid(axis="y", alpha=0.3)

    plt.tight_layout()
    out = RESULTS_DIR / "overall_comparison.png"
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"✅ Chart saved: {out}")

def print_report_table(metrics, model_name):
    """Print FYP-ready results table"""
    print(f"\n{'=' * 65}")
    print(f"📋 {model_name} — Results Table (for FYP Report)")
    print(f"{'=' * 65}")
    print(f"{'Class':<15} {'Precision':>11} {'Recall':>8} {'mAP@0.5':>9} {'mAP@0.5:0.95':>13}")
    print(f"{'-' * 65}")

    for i, cls in enumerate(CLASSES):
        p     = float(metrics.box.p[i])
        r     = float(metrics.box.r[i])
        ap50  = float(metrics.box.ap50[i])
        ap    = float(metrics.box.ap[i])
        print(f"{cls:<15} {p:>11.3f} {r:>8.3f} {ap50:>9.3f} {ap:>13.3f}")

    print(f"{'-' * 65}")
    print(f"{'Overall':<15} {float(metrics.box.mp):>11.3f} {float(metrics.box.mr):>8.3f} {float(metrics.box.map50):>9.3f} {float(metrics.box.map):>13.3f}")
    print(f"{'=' * 65}\n")

def save_results_json(metrics_v1, metrics_v2=None):
    """Save results to JSON for dashboard/report use"""
    results = {
        "yolov8n": {
            "overall": {
                "precision": round(float(metrics_v1.box.mp), 4),
                "recall":    round(float(metrics_v1.box.mr), 4),
                "map50":     round(float(metrics_v1.box.map50), 4),
                "map5095":   round(float(metrics_v1.box.map), 4),
            },
            "per_class": {}
        }
    }

    for i, cls in enumerate(CLASSES):
        results["yolov8n"]["per_class"][cls] = {
            "precision": round(float(metrics_v1.box.p[i]), 4),
            "recall":    round(float(metrics_v1.box.r[i]), 4),
            "map50":     round(float(metrics_v1.box.ap50[i]), 4),
            "map5095":   round(float(metrics_v1.box.ap[i]), 4),
        }

    if metrics_v2:
        results["yolov8s"] = {
            "overall": {
                "precision": round(float(metrics_v2.box.mp), 4),
                "recall":    round(float(metrics_v2.box.mr), 4),
                "map50":     round(float(metrics_v2.box.map50), 4),
                "map5095":   round(float(metrics_v2.box.map), 4),
            },
            "per_class": {}
        }
        for i, cls in enumerate(CLASSES):
            results["yolov8s"]["per_class"][cls] = {
                "precision": round(float(metrics_v2.box.p[i]), 4),
                "recall":    round(float(metrics_v2.box.r[i]), 4),
                "map50":     round(float(metrics_v2.box.ap50[i]), 4),
                "map5095":   round(float(metrics_v2.box.ap[i]), 4),
            }

    out = RESULTS_DIR / "evaluation_results.json"
    with open(out, "w") as f:
        json.dump(results, f, indent=2)
    print(f"✅ Results JSON saved: {out}")

def main():
    models_dir = BASE_DIR / "models"
    model_v1 = models_dir / "best.pt"

    # Check if v2 exists (after retraining)
    model_v2_path = BASE_DIR / "runs" / "oil_palm_v2" / "weights" / "best.pt"
    model_v2 = model_v2_path if model_v2_path.exists() else None

    print("\n🔬 Running evaluation...\n")

    # Evaluate v1
    metrics_v1 = evaluate_model(model_v1)
    print_report_table(metrics_v1, "YOLOv8n (oil_palm_v1)")

    # Evaluate v2 if exists
    metrics_v2 = None
    if model_v2:
        print("\n📦 YOLOv8s model found — evaluating v2...")
        metrics_v2 = evaluate_model(model_v2)
        print_report_table(metrics_v2, "YOLOv8s (oil_palm_v2)")

    # Generate charts
    print("\n📊 Generating charts...")
    plot_class_metrics(metrics_v1, metrics_v2)
    plot_overall_comparison(metrics_v1, metrics_v2)
    save_results_json(metrics_v1, metrics_v2)

    print(f"\n{'=' * 60}")
    print("✅ Evaluation complete!")
    print(f"📁 All charts saved to: {RESULTS_DIR}")
    print("\nFiles generated:")
    print("  📊 class_metrics_comparison.png")
    print("  📊 overall_comparison.png")
    print("  📊 confusion_matrix.png (from YOLOv8 auto)")
    print("  📊 PR_curve.png (from YOLOv8 auto)")
    print("  📊 F1_curve.png (from YOLOv8 auto)")
    print("  📄 evaluation_results.json")

if __name__ == "__main__":
    main()