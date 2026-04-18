# CLAUDE.md — FYP Oil Palm IoT & Disease Detection System

> This file is read automatically by Claude Code at the start of every session.
> Do NOT delete or rename this file. Keep it updated as the project evolves.

---

## 🌴 Project Overview

**Project Title:** IoT-Based Oil Palm Tree Monitoring and Fruit Disease Detection System
**Developer:** Danesh
**Type:** Final Year Project (FYP)
**Hardware:** IRIV PiControl Industry 4.0 AgriBox v2 (Raspberry Pi CM4-based industrial controller by Cytron Malaysia)
**GitHub:** https://github.com/DaneshIV/fyp-oil-palm

---

## 📅 Current Project Status

### ✅ Completed
- [x] Project folder structure + GitHub repo
- [x] Virtual environment (fyp_env) — Python 3.12
- [x] PyTorch + CUDA 12.1 (RTX 3060 Laptop confirmed working)
- [x] MySQL database (fyp_oil_palm) — 4 tables
- [x] FastAPI backend — all endpoints working on port 8000
- [x] MySQL → Supabase auto sync every 60 seconds
- [x] Supabase RLS security enabled on all 4 tables
- [x] Next.js 16 dashboard — all 5 pages complete
- [x] Telegram bot — all alert types working
- [x] AI Model v1 — YOLOv8n (mAP50 59.1% standardised)
- [x] AI Model v2 — YOLOv8s comparison (mAP50 52.3% standardised)
- [x] AI Model v3 — YOLOv8n FINAL (mAP50 71.5% standardised) ✅
- [x] All 3 models evaluated on same test set
- [x] Evaluation charts + confusion matrix generated
- [x] V3 ONNX exported (best_v3.onnx)
- [x] Git LFS for model weights
- [x] 3x backups — GitHub, D drive, Google Drive
- [x] Cloudflared installed
- [x] IRIV hardware scripts — all 4 complete + tested in simulation
- [x] Disease detection test page (webcam + upload)

### 🔲 Todo
- [ ] Annotate Kaggle images in Label Studio → retrain v4
- [ ] Fix webcam detection page
- [ ] Cloudflared tunnel test — need home WiFi
- [ ] IRIV hardware arrives → deploy + test
- [ ] FYP report writing

---

## 🤖 AI Model — FINAL RESULTS

### ⚠️ Production Model = V3

```
File:      ai_model/models/best_v3.pt   (PyTorch)
ONNX:      ai_model/models/best_v3.onnx (deployment)
```

### Why 4 Classes (Not 5)
Originally planned 5 classes: healthy, ganoderma, bud_rot, crown_disease, fruit_bunch_rot.
Changed to 4 because insufficient labelled images existed for bud_rot, crown_disease,
and fruit_bunch_rot as separate classes. These were merged into 'unhealthy'.
'immature' was added to prevent false positives on young palms.
Future work: annotate Kaggle images to split unhealthy into specific classes.

### Class Definitions
```
0: healthy    → Normal healthy palm — no disease symptoms       (severity: None)
1: ganoderma  → Ganoderma Basal Stem Rot — bracket fungus       (severity: High)
2: unhealthy  → General disease — Bud Rot, Crown Disease etc    (severity: Medium)
3: immature   → Young/immature palm tree                        (severity: Low)
```

### 3-Model Comparison (Standardised Test Set — 670 images)

| Model | Architecture | Datasets | Images | mAP50 | mAP50-95 | Status |
|---|---|---|---|---|---|---|
| V1 | YOLOv8n | 3 | 5,725 | 59.1% | 52.1% | Baseline |
| V2 | YOLOv8s | 3 | 5,725 | 52.3% | 46.1% | Architecture test |
| V3 | YOLOv8n | 10 | 7,748 | **71.5%** | **65.0%** | ✅ PRODUCTION |

### V3 Per-Class Results
```
Class        Precision  Recall   mAP50   mAP50-95
healthy      0.979      0.891    0.944   0.908
ganoderma    0.812      0.143    0.478   0.328
unhealthy    0.978      0.993    0.994   0.952
immature     0.542      0.617    0.444   0.411
Overall      0.828      0.661    0.715   0.650
```

### Key Findings
```
1. Architecture size < Dataset diversity
   V2 (YOLOv8s bigger) scored LOWER than V1 (YOLOv8n smaller)
   → Bigger model needs more data to outperform

2. Dataset diversity = best improvement
   V3 same architecture as V1 but 10 datasets → +12.4% mAP50

3. V3 is production model
   71.5% mAP50 on standardised test — best overall performance
```

### Dataset Sources (V3 — 10 datasets)
| Dataset | Images | Maps To |
|---|---|---|
| indikasi_ganoderma | 730 | Gejala Awal→ganoderma, Sehat→healthy |
| binus_ganoderma_1 | 425 | Ganoderma→ganoderma |
| binus_ganoderma_2 | 425 | Ganoderma→ganoderma |
| tree_health_detection | 2,651 | Healthy→healthy, Yellow/Dead→unhealthy, Small→immature |
| palm_oil_onmsi | 73 | Disease-Spot/Initial→ganoderma, healthy→healthy |
| palm_leaf_ganoderma | 74 | Healthy→healthy, Infected/Initial→ganoderma |
| oil_palm_health | 2,073 | Healthy→healthy, Unhealthy→unhealthy |
| palm_leaf_disease | 50 | All→unhealthy |

### Inference
```python
from ultralytics import YOLO
model = YOLO('ai_model/models/best_v3.pt')
results = model('image.jpg', conf=0.5, iou=0.45)
```

### Training Scripts
```
prepare_dataset.py      → merge 10 Roboflow datasets
balance_dataset_v2.py   → balance classes (target 2000/class)
train.py                → YOLOv8 training (edit model + name + data yaml)
evaluate.py             → evaluate all 3 models on same test set
download_datasets.py    → bulk download from Roboflow
```

---

## ⚡ Backend — FastAPI

| Detail | Value |
|---|---|
| Port | 8000 |
| Docs | http://localhost:8000/docs |
| Database | MySQL 8.0 — fyp_oil_palm |
| Cloud Sync | Supabase every 60s |

**MySQL credentials:**
```
DB_USER=root
DB_PASSWORD=fyp1234
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fyp_oil_palm
MySQL path: C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
```

**Key endpoints:**
```
GET  /sensors/latest
GET  /sensors/history?hours=24
POST /sensors/
GET  /disease/history?limit=20
GET  /disease/latest
POST /disease/
POST /disease/detect     ← image upload + YOLOv8 inference
GET  /alerts/
GET  /alerts/count
POST /alerts/{id}/acknowledge
POST /alerts/acknowledge-all
GET  /automation/rules
POST /automation/rules
PATCH /automation/rules/{id}/toggle
DELETE /automation/rules/{id}
POST /automation/relay
POST /sync
GET  /health
```

---

## 🗄️ Database Schema

```sql
sensor_readings:    id, temperature, humidity, soil_moisture, ec_level, timestamp
disease_detections: id, image_path, disease_label, confidence, severity, tree_id, block_id, timestamp
alerts:             id, alert_type, message, sensor_value, threshold, acknowledged, triggered_at
automation_rules:   id, rule_name, trigger_type, sensor_field, threshold_value, operator, relay_pin, is_active, last_triggered, created_at
```

**Default rules:**
```
Drip Irrigation  → soil_moisture < 40  → Relay 1
Mist Cooling     → temperature > 35    → Relay 2
Fertilizer Pump  → ec_level < 1.2      → Relay 3
```

---

## 🖥️ Dashboard — Next.js 16

| Detail | Value |
|---|---|
| Port | 3000 |
| Run | npm run dev (inside dashboard folder) |

**Pages:**
```
/                → Overview — live sensors, alerts, disease feed, offline indicator
/sensors         → Real-time charts, safe zones, time range selector
/disease         → Detection history, confidence bars, disease info
/disease/detect  → Upload image OR webcam → YOLOv8 inference live
/automation      → Relay controls, rule management
/reports         → Historical charts, CSV export
```

---

## ☁️ Supabase

| Detail | Value |
|---|---|
| URL | https://zltdegjlrgdrustyqcro.supabase.co |
| Region | Singapore (SEA) |
| RLS | Enabled on all 4 tables ✅ |
| Sync | Auto every 60s |

---

## 📲 Telegram Bot ✅

```
Script:  iriv_scripts/telegram_bot.py
Test:    python iriv_scripts/telegram_bot.py
Alerts:  soil_moisture, temperature, EC, disease_detected, relay_activated, relay_deactivated, daily_summary
```

---

## 🔐 Cloudflared

```
Status:  Installed ✅
Path:    C:\Program Files (x86)\cloudflared\cloudflared.exe
Test:    cloudflared tunnel --url http://localhost:8000
```

---

## 💾 Backups

| Location | Status | Contents |
|---|---|---|
| GitHub | ✅ | Code + model weights (Git LFS) |
| D: drive | ✅ | Full project (robocopy) |
| Google Drive | ✅ | Full project backup |

---

## 🛠️ Local Dev

```powershell
# Start everything
cd C:\Users\danes\fyp-oil-palm
fyp_env\Scripts\activate
.\start_fyp.ps1

# Dashboard: http://localhost:3000
# API Docs:  http://localhost:8000/docs

# Git push on uni WiFi
git config --global http.sslVerify false
git push origin main
git config --global http.sslVerify true
```

---

## 🔧 Hardware — IRIV PiControl AgriBox v2

| Component | Detail |
|---|---|
| SoM | Raspberry Pi Compute Module 4 (CM4) |
| CPU | Quad-core Cortex-A72 @ 1.5GHz |
| RAM | 4GB LPDDR4 |
| Storage | 32GB eMMC |
| RS485 port | /dev/ttyS0 (baud 9600, Modbus RTU) |
| ADS1115 | I²C address 0x48 |
| Relay GPIO | Pin1→17, Pin2→27, Pin3→22, Pin4→23 |

---

## 🚀 IRIV Deployment Checklist

```
1.  Flash Raspberry Pi OS
2.  Configure WiFi
3.  pip install fastapi uvicorn sqlalchemy pymysql pymodbus adafruit-ads1x15 python-telegram-bot opencv-python onnxruntime python-dotenv
4.  Copy project files via SCP
5.  Set up MySQL + run init.sql
6.  Copy .env with credentials
7.  Copy best_v3.onnx → ai_model/models/best.onnx
8.  Set up Cloudflared tunnel
9.  Start: uvicorn backend.main:app --host 0.0.0.0 --port 8000
10. Start: python iriv_scripts/sensor_collector.py
11. Start: python iriv_scripts/automation_controller.py
12. Set up systemd for auto-start
13. Test full end-to-end
```

---

## ⚠️ Rules for Claude Code

1. Never use Node-RED — custom Next.js only
2. Never use Grafana — charts in Next.js
3. Backend is FastAPI — lightweight only
4. IRIV uses ONNX — use best_v3.onnx NOT .pt
5. Database is MySQL — NOT SQLite/PostgreSQL
6. RS485 port is `/dev/ttyS0` on IRIV
7. ADS1115 I²C is `0x48`
8. Sensor polling in `iriv_scripts/sensor_collector.py`
9. Dashboard fetches from FastAPI only
10. Import paths use `backend.` prefix
11. All `__init__.py` files are empty
12. MySQL local password is `fyp1234`
13. Dashboard has its own `.env.local`
14. Supabase URL: https://zltdegjlrgdrustyqcro.supabase.co
15. YOLOv8 inference: conf=0.5, iou=0.45
16. Model classes: [healthy, ganoderma, unhealthy, immature]
17. IRIV scripts have simulation mode — ON_IRIV = sys.platform == 'linux'
18. PRODUCTION model is V3 — best_v3.pt / best_v3.onnx
19. Supabase RLS enabled — use service role key for backend
20. Git push on uni WiFi: disable sslVerify, push, re-enable
21. Dataset v2 has 7,748 images from 10 Roboflow datasets
22. data_v2.yaml points to balanced_v2 dataset
23. /disease/detect endpoint accepts image upload → runs YOLOv8 → saves to DB
24. evaluate.py evaluates all 3 models on same test set for fair comparison