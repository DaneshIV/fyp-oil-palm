from roboflow import Roboflow

API_KEY = "SQcyUNYF6slikKXGS40d"  # ← replace

rf = Roboflow(api_key=API_KEY)

projects = [
    "palm-oil-leaf-disease-revision-rfwqb",
    "indikasi-ganoderma-fp2wq-nsgtb",
    "oil-palm-ganoderma-detection-2-zqotq",
    "oil-palm-ganoderma-detection-zq8ow",
    "oil-palm-tree-zyvyi-5kqzw",
    "palm-leaves-disease-detection-56cqr",
    "oil-palm-tree-health-detection-5ms7n",
    "palm-oil-onmsi-dbkzu",
    "palm-oil-leaf-ganoderma-yqnaa",
    "oil-palm-health-detection-7akmp",
]

ws = rf.workspace("daneshs-workspace-6ywsm")

for proj_name in projects:
    try:
        print(f"\n📦 {proj_name}")
        project = ws.project(proj_name)
        version = project.generate_version(settings={
            "preprocessing": {
                "auto-orient": True,
                "resize": {"enabled": True, "width": 640, "height": 640, "format": "Stretch to"},
            },
            "augmentation": {}
        })
        print(f"  ✅ Version generated: {version}")
    except Exception as e:
        print(f"  ❌ Failed: {e}")