import multiprocessing
from ultralytics import YOLO

def main():
    ROOT      = r"C:/Users/danes/fyp-oil-palm"
    DATA_YAML = ROOT + "/ai_model/data_v4.yaml"
    RUNS_DIR  = ROOT + "/ai_model/runs"

    print("YOLOv8n v4 Training - Fast Version")
    model = YOLO("yolov8n.pt")

    model.train(
        data         = DATA_YAML,
        epochs       = 100,
        patience     = 20,
        imgsz        = 640,
        batch        = 16,
        workers      = 4,
        device       = 0,
        project      = RUNS_DIR,
        name         = "oil_palm_v4n",
        exist_ok     = True,
        optimizer    = "AdamW",
        lr0          = 0.001,
        lrf          = 0.01,
        warmup_epochs= 3,
        hsv_h        = 0.02,
        hsv_s        = 0.7,
        hsv_v        = 0.4,
        degrees      = 15.0,
        translate    = 0.1,
        scale        = 0.5,
        flipud       = 0.1,
        fliplr       = 0.5,
        mosaic       = 1.0,
        mixup        = 0.1,
        copy_paste   = 0.1,
        cache        = True,
        save         = True,
        save_period  = 10,
        plots        = True,
        cls          = 0.5,
    )
    print("Training complete!")

if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()

