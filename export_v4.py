from ultralytics import YOLO
model = YOLO("ai_model/runs/oil_palm_v4/weights/best.pt")
model.export(format="onnx", imgsz=640, simplify=True)
print("Done! ONNX saved.")
