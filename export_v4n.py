from ultralytics import YOLO
model = YOLO("ai_model/models/best_v4.pt")
model.export(format="onnx", imgsz=640, simplify=True)
print("Done!")
