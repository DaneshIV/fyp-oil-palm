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
- [x] AI Model v1 — YOLOv8n trained (mAP50 76.3%) — original 3 datasets
- [x] AI Model v2 — YOLOv8s trained (mAP50 67.1%) — comparison only
- [x] Dataset v2 — 10 Roboflow datasets + Kaggle merged (7,748 images)
- [x] Git LFS for model weights
- [x] 3x backups — GitHub, D drive, Google Drive
- [x] Cloudflared installed
- [x] IRIV hardware scripts — all 4 complete + tested in simulation
- [x] Disease detection test page (webcam + upload)

### 🔲 In Progress
- [ ] AI Model v3 — YOLOv8n retraining with v2 dataset (TRAINING NOW)

### 🔲 Todo
- [ ] Evaluate v3 model results
- [ ] Export v3 to ONNX
- [ ] Fix webcam detection page
- [ ] Cloudflared tunnel test — need home WiFi
- [ ] IRIV hardware arrives → deploy + test
- [ ] FYP report writing

---

## 🗂️ Project Structure

```
fyp-oil-palm/
├── CLAUDE.md
├── README.md
├── .gitignore
├── .env                               ← Never commit!
├── start_fyp.ps1                      ← Start all services
├── demo_data.py                       ← Insert demo sensor data
├── live_sensors.py                    ← Continuous live sensor updates
├── add_alerts.py                      ← Insert demo alerts
├── add_diseases.py                    ← Insert demo disease detections
├── check_versions.py                  ← Check Roboflow dataset versions
├── generate_versions.py               ← Generate Roboflow dataset versions
│
├── ai_model/
│   ├── data.yaml                      ← Points to balanced (v1 datasets)
│   ├── data_v2.yaml                   ← Points to balanced_v2 (v2 datasets)
│   ├── datasets/
│   │   ├── roboflow/                  ← Original 3 datasets (v1)
│   │   │   ├── palm_leaf_ganoderma/   ← 440 images
│   │   │   ├── oil_palm_health/       ← 2,073 images
│   │   │   └── tree_health_detection/ ← 2,651 images
│   │   ├── roboflow_v2/               ← New 10 datasets (v2)
│   │   │   ├── palm_leaf_disease/     ← 50 images — Bercak_Daun, Defisiensi_Kalium, Karat_Daun
│   │   │   ├── indikasi_ganoderma/    ← 730 images — Gejala Awal, Sehat
│   │   │   ├── binus_ganoderma_1/     ← 425 images — Ganoderma, Ganoderma Fungus
│   │   │   ├── binus_ganoderma_2/     ← 425 images — Ganoderma, Ganoderma Fungus
│   │   │   ├── oil_palm_tree/         ← SKIPPED — only palmTree class
│   │   │   ├── palm_leaves_disease/   ← SKIPPED — classification format
│   │   │   ├── tree_health_detection/ ← 2,651 images — Healthy, Yellow, Dead, Small
│   │   │   ├── palm_oil_onmsi/        ← 73 images — Disease-Spot, Initial, healthy
│   │   │   ├── palm_leaf_ganoderma/   ← 74 images — Healthy, Infected, Initial Infection
│   │   │   └── oil_palm_health/       ← 2,073 images — Healthy, Unhealthy
│   │   ├── combined/                  ← Merged v1 (5,725 images)
│   │   ├── combined_v2/               ← Merged v2 (6,612 images)
│   │   ├── balanced/                  ← Balanced v1 (used for v1/v2 training)
│   │   └── balanced_v2/               ← Balanced v2 (used for v3 training)
│   │       ├── train/ — healthy:4337, ganoderma:1803, unhealthy:2180, immature:1918
│   │       ├── val/   — healthy:1031, ganoderma:306, unhealthy:464, immature:430
│   │       └── test/  — healthy:535, ganoderma:167, unhealthy:239, immature:240
│   ├── models/
│   │   ├── best.pt                    ← YOLOv8n v1 weights (6MB) — mAP50 76.3%
│   │   ├── best.onnx                  ← YOLOv8n v1 ONNX (11.7MB)
│   │   ├── best_v2_yolov8s.pt         ← YOLOv8s comparison (mAP50 67.1%)
│   │   └── best_v3.pt                 ← YOLOv8n v3 (TRAINING NOW)
│   ├── runs/
│   │   ├── oil_palm_v1/               ← YOLOv8n v1 training results
│   │   ├── oil_palm_v2/               ← YOLOv8s v2 training results
│   │   ├── oil_palm_v3/               ← YOLOv8n v3 training results (IN PROGRESS)
│   │   └── evaluation/                ← Confusion matrix + charts ✅
│   └── training/
│       ├── train.py                   ← YOLOv8 training script ✅
│       ├── prepare_dataset.py         ← Dataset merger v1 ✅
│       ├── balance_dataset.py         ← Dataset balancer v1 ✅
│       ├── prepare_dataset.py         ← Dataset merger v2 ✅
│       ├── balance_dataset_v2.py      ← Dataset balancer v2 ✅
│       ├── download_datasets.py       ← Roboflow bulk downloader ✅
│       ├── evaluate.py                ← Evaluation + charts ✅
│       └── detect.py                  ← Single image inference
│
├── backend/
│   ├── main.py                        ← FastAPI (port 8000) ✅
│   ├── routes/
│   │   ├── sensors.py                 ✅
│   │   ├── disease.py                 ✅ includes /detect endpoint
│   │   ├── alerts.py                  ✅
│   │   └── automation.py              ✅
│   ├── schemas/
│   │   └── schemas.py                 ✅
│   └── database/
│       ├── connection.py              ✅
│       ├── init.sql                   ✅
│       └── supabase_sync.py           ✅
│
├── dashboard/                         ← Next.js 16 (port 3000)
│   ├── app/
│   │   ├── page.tsx                   ✅ Overview (offline/online indicator)
│   │   ├── sensors/page.tsx           ✅
│   │   ├── disease/page.tsx           ✅
│   │   ├── disease/detect/page.tsx    ✅ Upload + webcam detection
│   │   ├── automation/page.tsx        ✅
│   │   └── reports/page.tsx           ✅
│   ├── components/ui/
│   │   ├── Sidebar.tsx                ✅ includes AI Test link
│   │   ├── SensorCard.tsx             ✅
│   │   ├── Skeleton.tsx               ✅
│   │   ├── LiveIndicator.tsx          ✅
│   │   └── ThemeToggle.tsx            ✅
│   └── lib/
│       ├── api.ts                     ✅
│       └── supabase.ts                ✅
│
├── iriv_scripts/                      ← All tested in simulation ✅
│   ├── sensor_collector.py            ✅ RS485 + simulation mode
│   ├── camera_capture.py              ✅ USB/CSI + simulation mode
│   ├── inference_runner.py            ✅ ONNX inference + simulation
│   ├── telegram_bot.py                ✅ All alert types working
│   └── automation_controller.py       ✅ Relay control + simulation
│
└── docs/
    └── architecture_diagram.html      ✅
```

---

## 🔧 Hardware — IRIV PiControl AgriBox v2

| Component | Detail |
|---|---|
| SoM | Raspberry Pi Compute Module 4 (CM4) |
| CPU | Quad-core Cortex-A72 @ 1.5GHz |
| RAM | 4GB LPDDR4 |
| Storage | 32GB eMMC |
| Connectivity | WiFi, Bluetooth 5.0, Gigabit Ethernet |
| Serial | RS232 + RS485 (Modbus RTU) |
| Analog Inputs | 4× isolated via ADS1115 ADC (I²C 0x48) |
| Digital I/O | Isolated DI + DO up to 50V |
| Camera | USB or CSI |
| OS | Raspberry Pi OS |
| Power | 24V DC |

**RS485 port:** `/dev/ttyS0` (baud 9600, Modbus RTU)
**ADS1115 I²C address:** `0x48`

---

## 🤖 AI Model History

### Why 4 Classes (Not 5)
Originally planned 5 classes: healthy, ganoderma, bud_rot, crown_disease, fruit_bunch_rot.
Changed to 4 classes because insufficient labelled images existed for bud_rot, crown_disease,
and fruit_bunch_rot as separate classes. These were merged into 'unhealthy'. 'immature' was
added to prevent false positives on young palms.

### Class Definitions
```
0: healthy    → Normal healthy palm — no disease symptoms
1: ganoderma  → Ganoderma Basal Stem Rot — bracket fungus at trunk base (HIGH severity)
2: unhealthy  → General disease — Bud Rot, Crown Disease, leaf yellowing (MEDIUM severity)
3: immature   → Young/immature palm tree (LOW severity)
```

### Model Versions
| Version | Architecture | Dataset | mAP50 | Status |
|---|---|---|---|---|
| v1 | YOLOv8n | 3 datasets, 5,725 images | 76.3% | ✅ Final model |
| v2 | YOLOv8s | 3 datasets, 5,725 images | 67.1% | Comparison only |
| v3 | YOLOv8n | 10 datasets, 7,748 images | TBD | 🔄 Training now |

### Dataset Sources (v2 — Current)
| Dataset | Images | Classes Used |
|---|---|---|
| indikasi_ganoderma | 730 | Gejala Awal→ganoderma, Sehat→healthy |
| binus_ganoderma_1 | 425 | Ganoderma→ganoderma |
| binus_ganoderma_2 | 425 | Ganoderma→ganoderma |
| tree_health_detection | 2,651 | Healthy→healthy, Yellow/Dead→unhealthy, Small→immature |
| palm_oil_onmsi | 73 | Disease-Spot/Initial→ganoderma, healthy→healthy |
| palm_leaf_ganoderma | 74 | Healthy→healthy, Infected/Initial→ganoderma |
| oil_palm_health | 2,073 | Healthy→healthy, Unhealthy→unhealthy |
| palm_leaf_disease | 50 | All→unhealthy |
| Kaggle palm-disease | ~275 | Dryness/Fungal/Magnesium/Scale→unhealthy (needs annotation) |

### Inference
```python
from ultralytics import YOLO
model = YOLO('ai_model/models/best.pt')  # use v3 when ready
results = model('image.jpg', conf=0.5, iou=0.45)
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
POST /disease/detect           ← image upload + YOLOv8 inference
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

## 🚀 IRIV Deployment Checklist (When Hardware Arrives)

```
1.  Flash Raspberry Pi OS to IRIV eMMC
2.  Configure WiFi
3.  Install Python dependencies (pip install fastapi uvicorn sqlalchemy pymysql pymodbus adafruit-ads1x15 python-telegram-bot opencv-python onnxruntime python-dotenv)
4.  Copy project files via SCP
5.  Set up MySQL + run init.sql
6.  Copy .env with credentials
7.  Copy best_v3.onnx to ai_model/models/best.onnx
8.  Set up Cloudflared tunnel
9.  Start services (uvicorn, sensor_collector, automation_controller)
10. Set up systemd for auto-start
11. Test full end-to-end
```

---

## ⚠️ Rules for Claude Code

1. Never use Node-RED — custom Next.js only
2. Never use Grafana — charts in Next.js
3. Backend is FastAPI — lightweight only
4. IRIV uses ONNX model — NOT .pt
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
18. Final model is YOLOv8n — v3 (best_v3.pt) when training completes
19. Supabase RLS enabled — use service role key for backend
20. Git push on uni WiFi: disable sslVerify, push, re-enable
21. Dataset v2 has 7,748 images from 8 Roboflow datasets
22. data_v2.yaml points to balanced_v2 dataset
23. Kaggle dataset (palm-disease-dataset) needs annotation before use
24. /disease/detect endpoint accepts image upload → runs YOLOv8 → saves to DB