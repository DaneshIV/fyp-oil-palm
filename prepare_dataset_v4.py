import os, json, shutil
from pathlib import Path

GANODERMA = r"C:/Users/danes/Downloads/Dataset V4/Ganoderma Detection Dataset for Oil Palm Crop Disease Classification"
ROOT = r"C:/Users/danes/fyp-oil-palm"
V2   = ROOT + "/ai_model/datasets/balanced_v2"
OUT  = ROOT + "/ai_model/datasets/balanced_v4"
TMP  = ROOT + "/ai_model/datasets/ganoderma_yolo"
MAP  = {"Ganoderma": 1}

def convert(coco_path, img_dir, lbl_out, img_out):
    os.makedirs(lbl_out, exist_ok=True)
    os.makedirs(img_out, exist_ok=True)
    d = json.load(open(coco_path))
    imgs = {i["id"]: i for i in d["images"]}
    anns = {}
    for a in d["annotations"]:
        anns.setdefault(a["image_id"], []).append(a)
    cats = {c["id"]: c["name"] for c in d["categories"]}
    n = 0
    for iid, img in imgs.items():
        src = os.path.join(img_dir, img["file_name"])
        if not os.path.exists(src): continue
        W, H = img["width"], img["height"]
        rows = []
        for a in anns.get(iid, []):
            cls = MAP.get(cats.get(a["category_id"], ""), None)
            if cls is None: continue
            x, y, w, h = a["bbox"]
            xc = max(0, min(1, (x + w/2)/W))
            yc = max(0, min(1, (y + h/2)/H))
            wn = max(0, min(1, w/W))
            hn = max(0, min(1, h/H))
            rows.append(f"{cls} {xc:.6f} {yc:.6f} {wn:.6f} {hn:.6f}")
        stem = Path(img["file_name"]).stem
        open(os.path.join(lbl_out, stem+".txt"), "w").write("\n".join(rows))
        shutil.copy2(src, os.path.join(img_out, img["file_name"]))
        n += 1
    return n

def merge(si, sl, di, dl, px):
    os.makedirs(di, exist_ok=True)
    os.makedirs(dl, exist_ok=True)
    if not os.path.exists(si): return 0
    n = 0
    for f in os.listdir(si):
        if not f.lower().endswith((".jpg",".png",".jpeg")): continue
        stem = Path(f).stem
        shutil.copy2(os.path.join(si,f), os.path.join(di, px+f))
        lbl = os.path.join(sl, stem+".txt")
        dst = os.path.join(dl, px+stem+".txt")
        shutil.copy2(lbl, dst) if os.path.exists(lbl) else open(dst,"w").close()
        n += 1
    return n

print("Step 1: Converting COCO to YOLO...")
if os.path.exists(TMP): shutil.rmtree(TMP)
for sp in ["train","valid","test"]:
    cj = os.path.join(GANODERMA, sp, "_annotations.coco.json")
    if not os.path.exists(cj): continue
    n = convert(cj, os.path.join(GANODERMA,sp), os.path.join(TMP,sp,"labels"), os.path.join(TMP,sp,"images"))
    print(f"  {sp}: {n} images")

print("Step 2: Merging datasets...")
if os.path.exists(OUT): shutil.rmtree(OUT)
tots = {}
for sp, gsp in [("train","train"),("val","valid"),("test","test")]:
    di = os.path.join(OUT,sp,"images")
    dl = os.path.join(OUT,sp,"labels")
    n1 = merge(os.path.join(V2,sp,"images"), os.path.join(V2,sp,"labels"), di, dl, "v2_")
    n2 = merge(os.path.join(TMP,gsp,"images"), os.path.join(TMP,gsp,"labels"), di, dl, "gano_")
    tots[sp] = n1+n2
    print(f"  {sp}: {n1} v2 + {n2} gano = {n1+n2}")

print("Step 3: Writing data_v4.yaml...")
yaml = "path: " + OUT.replace("\\","/") + "\ntrain: train/images\nval:   val/images\ntest:  test/images\nnc: 4\nnames:\n  0: healthy\n  1: ganoderma\n  2: unhealthy\n  3: immature\n"
open(ROOT+"/ai_model/data_v4.yaml","w").write(yaml)
print("Done! Total:", sum(tots.values()), "images")
