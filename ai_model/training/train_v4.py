import multiprocessing
multiprocessing.set_start_method("spawn", force=True)
from ultralytics import YOLO

def main():
    ROOT      = r"C:/Users/danes/fyp-oil-palm"
    DATA_YAML = ROOT + "/ai_model/data_v4.yaml"
    RUNS_DIR  = ROOT + "/ai_model/runs"
    NAME      = "oil_palm_v4"

    print("YOLOv8m v4 Training")

    model = YOLO("yolov8m.pt")

    results = model.train(
        data         = DATA_YAML,
        epochs       = 100,
        patience     = 20,
        imgsz        = 640,
        batch        = 16,
        workers      = 4,
        device       = 0,
        project      = RUNS_DIR,
        name         = NAME,
        exist_ok     = True,
        optimizer    = "AdamW",
        lr0          = 0.001,
        lrf          = 0.01,
        momentum     = 0.937,
        weight_decay = 0.0005,
        warmup_epochs= 3,
        hsv_h        = 0.02,
        hsv_s        = 0.7,
        hsv_v        = 0.4,
        degrees      = 15.0,
        translate    = 0.1,
        scale        = 0.5,
        shear        = 2.0,
        flipud       = 0.1,
        fliplr       = 0.5,
        mosaic       = 1.0,
        mixup        = 0.1,
        copy_paste   = 0.1,
        save         = True,
        save_period  = 10,
        plots        = True,
        verbose      = True,
        cls          = 0.5,
        cache        = True,
    )

    print("Training complete!")
    try:
        map50 = results.results_dict.get("metrics/mAP50(B)", "N/A")
        print(f"mAP50: {map50:.3f}")
    except:
        pass

    print("Exporting to ONNX...")
    best = YOLO(f"{RUNS_DIR}/{NAME}/weights/best.pt")
    best.export(format="onnx", imgsz=640, simplify=True)
    print("Done! Check ai_model/runs/oil_palm_v4/weights/best.pt")

if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
