import requests

diseases = [
    {"image_path": "images/scan_001.jpg", "disease_label": "ganoderma", "confidence": 87.5, "severity": "High", "tree_id": "A-14", "block_id": "Block-A"},
    {"image_path": "images/scan_002.jpg", "disease_label": "healthy", "confidence": 95.2, "severity": "None", "tree_id": "A-15", "block_id": "Block-A"},
    {"image_path": "images/scan_003.jpg", "disease_label": "bud_rot", "confidence": 72.3, "severity": "Medium", "tree_id": "B-07", "block_id": "Block-B"},
    {"image_path": "images/scan_004.jpg", "disease_label": "unhealthy", "confidence": 65.8, "severity": "Medium", "tree_id": "C-22", "block_id": "Block-C"},
    {"image_path": "images/scan_005.jpg", "disease_label": "ganoderma", "confidence": 91.2, "severity": "High", "tree_id": "A-03", "block_id": "Block-A"},
    {"image_path": "images/scan_006.jpg", "disease_label": "healthy", "confidence": 93.4, "severity": "None", "tree_id": "B-08", "block_id": "Block-B"},
]

for d in diseases:
    r = requests.post("http://localhost:8000/disease/", json=d)
    print(f"Added: {d['disease_label']} — {d['confidence']}% — Tree {d['tree_id']}")

print("Done! Refresh dashboard")