import requests

API_URL = "http://localhost:8000"

# Login
token = requests.post(f"{API_URL}/auth/login", json={
    "username": "admin", "password": "fyp2024"
}).json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Block A trees
block_a = [
    {"tree_id": "A-01", "block_id": "Block-A", "disease_label": "healthy",   "confidence": 91.2, "severity": "None",   "image_path": "demo/a01.jpg"},
    {"tree_id": "A-02", "block_id": "Block-A", "disease_label": "healthy",   "confidence": 88.5, "severity": "None",   "image_path": "demo/a02.jpg"},
    {"tree_id": "A-03", "block_id": "Block-A", "disease_label": "ganoderma", "confidence": 76.8, "severity": "High",   "image_path": "demo/a03.jpg"},
    {"tree_id": "A-04", "block_id": "Block-A", "disease_label": "healthy",   "confidence": 93.1, "severity": "None",   "image_path": "demo/a04.jpg"},
    {"tree_id": "A-05", "block_id": "Block-A", "disease_label": "unhealthy", "confidence": 67.3, "severity": "Medium", "image_path": "demo/a05.jpg"},
    {"tree_id": "A-06", "block_id": "Block-A", "disease_label": "healthy",   "confidence": 89.4, "severity": "None",   "image_path": "demo/a06.jpg"},
    {"tree_id": "A-07", "block_id": "Block-A", "disease_label": "immature",  "confidence": 82.1, "severity": "Low",    "image_path": "demo/a07.jpg"},
    {"tree_id": "A-08", "block_id": "Block-A", "disease_label": "healthy",   "confidence": 95.2, "severity": "None",   "image_path": "demo/a08.jpg"},
]

# Block B trees
block_b = [
    {"tree_id": "B-01", "block_id": "Block-B", "disease_label": "healthy",   "confidence": 90.1, "severity": "None",   "image_path": "demo/b01.jpg"},
    {"tree_id": "B-02", "block_id": "Block-B", "disease_label": "ganoderma", "confidence": 83.4, "severity": "High",   "image_path": "demo/b02.jpg"},
    {"tree_id": "B-03", "block_id": "Block-B", "disease_label": "healthy",   "confidence": 87.6, "severity": "None",   "image_path": "demo/b03.jpg"},
    {"tree_id": "B-04", "block_id": "Block-B", "disease_label": "unhealthy", "confidence": 71.2, "severity": "Medium", "image_path": "demo/b04.jpg"},
    {"tree_id": "B-05", "block_id": "Block-B", "disease_label": "healthy",   "confidence": 92.8, "severity": "None",   "image_path": "demo/b05.jpg"},
    {"tree_id": "B-06", "block_id": "Block-B", "disease_label": "healthy",   "confidence": 88.9, "severity": "None",   "image_path": "demo/b06.jpg"},
]

# Block C trees
block_c = [
    {"tree_id": "C-01", "block_id": "Block-C", "disease_label": "healthy",   "confidence": 94.3, "severity": "None",   "image_path": "demo/c01.jpg"},
    {"tree_id": "C-02", "block_id": "Block-C", "disease_label": "healthy",   "confidence": 91.7, "severity": "None",   "image_path": "demo/c02.jpg"},
    {"tree_id": "C-03", "block_id": "Block-C", "disease_label": "ganoderma", "confidence": 79.5, "severity": "High",   "image_path": "demo/c03.jpg"},
    {"tree_id": "C-04", "block_id": "Block-C", "disease_label": "immature",  "confidence": 85.2, "severity": "Low",    "image_path": "demo/c04.jpg"},
    {"tree_id": "C-05", "block_id": "Block-C", "disease_label": "healthy",   "confidence": 96.1, "severity": "None",   "image_path": "demo/c05.jpg"},
]

all_trees = block_a + block_b + block_c

print(f"Inserting {len(all_trees)} tree detections...")
for tree in all_trees:
    res = requests.post(f"{API_URL}/disease/", json=tree, headers=headers)
    status = "✅" if res.status_code == 200 else "❌"
    print(f"  {status} {tree['block_id']} / {tree['tree_id']} — {tree['disease_label']}")

print()
print("Done! Open http://localhost:3000/map to see the block map!")