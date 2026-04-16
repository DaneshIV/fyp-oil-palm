from ultralytics import YOLO
import os

model = YOLO('ai_model/models/best.pt')
test_dir = 'ai_model/datasets/balanced/test/images'
images = [f for f in os.listdir(test_dir)][:5]
names = ['healthy', 'ganoderma', 'unhealthy', 'immature']

for img in images:
    results = model(os.path.join(test_dir, img), verbose=False, conf=0.5)
    for r in results:
        if len(r.boxes) > 0:
            from collections import Counter
            classes = Counter([names[int(b.cls[0])] for b in r.boxes])
            print(f'Image: {img[:40]}...')
            for cls, count in classes.items():
                print(f'  → {cls}: {count} detections')