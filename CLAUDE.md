# CLAUDE.md — FYP Oil Palm IoT & Disease Detection System

> This file is read automatically by Claude Code at the start of every session.
> Do NOT delete or rename this file. Keep it updated as the project evolves.

---

## 🌴 Project Overview

**Project Title:** IoT-Based Oil Palm Tree Monitoring and Fruit Disease Detection System
**Developer:** Danesh
**Type:** Final Year Project (FYP)
**Supervisor:** Dr. Mohd Kufaisal Bin Mohd Sidik
**University:** Universiti Teknologi Malaysia (UTM)
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
- [x] Next.js 16 dashboard — 7 pages complete
  - [x] Overview — live sensors, alerts, disease feed, offline indicator
  - [x] Sensors — real-time charts, safe zones, time range selector
  - [x] Disease AI — detection history, confidence bars, disease info
  - [x] AI Test — upload image OR webcam → YOLOv8 inference live
  - [x] Security Monitor — Triple Layer Security with live camera
  - [x] Automation — relay controls, rule management
  - [x] Reports — historical charts, CSV export
- [x] Telegram bot — all alert types working including security alerts
- [x] AI Model v1 — YOLOv8n (mAP50 59.1% standardised)
- [x] AI Model v2 — YOLOv8s comparison (mAP50 52.3% standardised)
- [x] AI Model v3 — YOLOv8n FINAL (mAP50 71.5% standardised) ✅
- [x] All 3 models evaluated on same test set
- [x] Evaluation charts + confusion matrix generated
- [x] V3 ONNX exported (best_v3.onnx)
- [x] Triple Layer Security System ← NEW
  - [x] Layer 1 — PIR sensor / software motion detection
  - [x] Layer 2 — Camera snapshot capture
  - [x] Layer 3 — YOLOv8n COCO AI threat classification
  - [x] Telegram alerts with photo
  - [x] Security event log in dashboard
  - [x] 30 second cooldown anti-spam
- [x] Git LFS for model weights
- [x] 3x backups — GitHub, D drive, Google Drive
- [x] Cloudflared installed
- [x] IRIV hardware scripts — all 5 complete + tested in simulation

### 🔲 Todo
- [ ] Annotate Kaggle images in Label Studio → retrain v4
- [ ] Cloudflared tunnel test — need home WiFi
- [ ] IRIV hardware arrives → deploy + test
- [ ] FYP report writing (PSM2)

---

## 🗂️ Project Structure

```
fyp-oil-palm/
├── CLAUDE.md
├── README.md
├── pyrightconfig.json             ← Suppress Pylance RPi/hardware warnings
├── .gitignore
├── .env                           ← Never commit!
├── start_fyp.ps1                  ← Start all services
├── demo_data.py                   ← Insert demo sensor data
├── live_sensors.py                ← Continuous live sensor updates
├── add_alerts.py                  ← Insert demo alerts
├── add_diseases.py                ← Insert demo disease detections
├── check_versions.py              ← Check Roboflow dataset versions
├── generate_versions.py           ← Generate Roboflow dataset versions
│
├── ai_model/
│   ├── data.yaml                  ← Points to balanced (v1 datasets)
│   ├── data_v2.yaml               ← Points to balanced_v2 (v2 datasets) ✅
│   ├── datasets/
│   │   ├── roboflow/              ← Original 3 datasets (v1)
│   │   ├── roboflow_v2/           ← New 10 datasets (v2)
│   │   │   ├── palm_leaf_disease/
│   │   │   ├── indikasi_ganoderma/
│   │   │   ├── binus_ganoderma_1/
│   │   │   ├── binus_ganoderma_2/
│   │   │   ├── tree_health_detection/
│   │   │   ├── palm_oil_onmsi/
│   │   │   ├── palm_leaf_ganoderma/
│   │   │   └── oil_palm_health/
│   │   ├── combined_v2/           ← Merged v2 (6,612 images)
│   │   └── balanced_v2/           ← Balanced v2 — used for v3 training
│   │       ├── train/ — healthy:4337, ganoderma:1803, unhealthy:2180, immature:1918
│   │       ├── val/   — healthy:1031, ganoderma:306, unhealthy:464, immature:430
│   │       └── test/  — healthy:535, ganoderma:167, unhealthy:239, immature:240
│   ├── models/
│   │   ├── best.pt                ← YOLOv8n v1 (disease detection)
│   │   ├── best.onnx              ← YOLOv8n v1 ONNX
│   │   ├── best_v2_yolov8s.pt     ← YOLOv8s comparison
│   │   ├── best_v3.pt             ← YOLOv8n v3 FINAL ✅
│   │   └── best_v3.onnx           ← YOLOv8n v3 ONNX for IRIV ✅
│   ├── runs/
│   │   ├── oil_palm_v1/           ← YOLOv8n v1 training results
│   │   ├── oil_palm_v2/           ← YOLOv8s v2 training results
│   │   ├── oil_palm_v3/           ← YOLOv8n v3 training results
│   │   └── evaluation/            ← Confusion matrix + charts ✅
│   └── training/
│       ├── train.py               ← YOLOv8 training script
│       ├── prepare_dataset.py     ← Dataset merger v2
│       ├── balance_dataset_v2.py  ← Dataset balancer v2
│       ├── download_datasets.py   ← Roboflow bulk downloader
│       └── evaluate.py            ← Evaluate all 3 models
│
├── backend/
│   ├── main.py                    ← FastAPI (port 8000) ✅
│   ├── routes/
│   │   ├── sensors.py             ✅
│   │   ├── disease.py             ✅ includes /detect endpoint
│   │   ├── alerts.py              ✅
│   │   ├── automation.py          ✅
│   │   └── security.py            ✅ NEW — Triple Layer Security
│   ├── schemas/
│   │   └── schemas.py             ✅
│   └── database/
│       ├── connection.py          ✅
│       ├── init.sql               ✅
│       └── supabase_sync.py       ✅
│
├── dashboard/                     ← Next.js 16 (port 3000)
│   ├── app/
│   │   ├── page.tsx               ✅ Overview (offline/online indicator)
│   │   ├── sensors/page.tsx       ✅
│   │   ├── disease/page.tsx       ✅
│   │   ├── disease/detect/page.tsx ✅ Upload + webcam + live detection
│   │   ├── security/page.tsx      ✅ NEW — Triple Layer Security Monitor
│   │   ├── automation/page.tsx    ✅
│   │   └── reports/page.tsx       ✅
│   └── components/ui/
│       ├── Sidebar.tsx            ✅ 7 nav items including Security
│       ├── SensorCard.tsx         ✅
│       ├── Skeleton.tsx           ✅
│       ├── LiveIndicator.tsx      ✅
│       └── ThemeToggle.tsx        ✅
│
├── iriv_scripts/                  ← All tested in simulation ✅
│   ├── sensor_collector.py        ✅ RS485 + simulation mode
│   ├── camera_capture.py          ✅ USB/CSI + simulation mode
│   ├── inference_runner.py        ✅ ONNX inference + simulation
│   ├── telegram_bot.py            ✅ All alert types + security alerts
│   ├── automation_controller.py   ✅ Relay control + simulation
│   └── security_monitor.py        ✅ NEW — Triple Layer Security script
│
└── docs/
    └── architecture_diagram.html  ✅
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
**Relay GPIO:** Pin1→17, Pin2→27, Pin3→22, Pin4→23
**PIR GPIO:** Pin→24

---

## 🛡️ Triple Layer Security System — NEW

### How It Works
```
Layer 1 → PIR Sensor (GPIO 24)     → Hardware motion detection trigger
Layer 2 → USB/CSI Camera           → Captures timestamped snapshot
Layer 3 → YOLOv8n COCO model       → AI classifies person/animal/clear
    ↓
Person detected  → HIGH ALERT   → DB log + Telegram photo alert
Animal detected  → MEDIUM ALERT → DB log + Telegram photo alert
False alarm      → LOG ONLY     → No notification (saves battery/bandwidth)
```

### Threat Levels
```
HIGH   → Person detected  → 🚨 Immediate Telegram alert with photo
MEDIUM → Animal detected  → ⚠️ Telegram alert with photo
LOW    → Unknown          → Logged only
NONE   → Area clear       → No action
```

### Key Features
```
✅ Eliminates false alarms from wind/shadows
✅ Telegram photo alert with bounding box overlay
✅ 30 second cooldown — prevents alert spam
✅ Saves snapshots to captured_images/security/
✅ Security event log in dashboard
✅ Works in simulation on Windows
✅ Uses pretrained YOLOv8n COCO — no training needed
```

### Security API Endpoints
```
POST /security/detect      ← Upload frame → AI classify → log if threat
GET  /security/events      ← Get recent security events
GET  /security/events/count ← Get threat counts by type
POST /security/test-alert  ← Insert test event + send Telegram
```

### Camera Indices (Windows Dev)
```
Camera 0 → EOS Webcam (Canon)
Camera 1 → OBS Virtual Camera ← Use this for testing
Camera 2 → Another virtual camera
```

---

## 🤖 AI Model — FINAL RESULTS

### Production Model = V3
```
Disease Detection: ai_model/models/best_v3.pt / best_v3.onnx
Security:          yolov8n.pt (pretrained COCO — auto downloaded)
```

### Why 4 Classes (Not 5)
Originally planned: healthy, ganoderma, bud_rot, crown_disease, fruit_bunch_rot.
Changed to 4 because insufficient labelled data for bud_rot, crown_disease,
fruit_bunch_rot. Merged into 'unhealthy'. 'immature' added to prevent false positives.

### Class Definitions
```
0: healthy    → Normal healthy palm                          (severity: None)
1: ganoderma  → Ganoderma Basal Stem Rot — bracket fungus   (severity: High)
2: unhealthy  → General disease — Bud Rot, Crown Disease     (severity: Medium)
3: immature   → Young/immature palm tree                     (severity: Low)
```

### 3-Model Comparison (Standardised Test Set)
| Model | Architecture | Datasets | Images | mAP50 | Status |
|---|---|---|---|---|---|
| V1 | YOLOv8n | 3 | 5,725 | 59.1% | Baseline |
| V2 | YOLOv8s | 3 | 5,725 | 52.3% | Architecture test |
| V3 | YOLOv8n | 10 | 7,748 | **71.5%** | ✅ PRODUCTION |

### V3 Per-Class Results
```
Class        Precision  Recall   mAP50   mAP50-95
healthy      0.979      0.891    0.944   0.908
ganoderma    0.812      0.143    0.478   0.328
unhealthy    0.978      0.993    0.994   0.952
immature     0.542      0.617    0.444   0.411
Overall      0.828      0.661    0.715   0.650
```

### Inference
```python
# Disease detection
from ultralytics import YOLO
model = YOLO('ai_model/models/best_v3.pt')
results = model('image.jpg', conf=0.5, iou=0.45)

# Security detection (person/animal)
model = YOLO('yolov8n.pt')  # pretrained COCO
results = model('frame.jpg', conf=0.25)
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

**All endpoints:**
```
GET  /sensors/latest
GET  /sensors/history?hours=24
POST /sensors/
GET  /disease/history?limit=20
GET  /disease/latest
POST /disease/
POST /disease/detect          ← image upload + YOLOv8 disease inference
GET  /alerts/
GET  /alerts/count
POST /alerts/{id}/acknowledge
POST /alerts/acknowledge-all
GET  /automation/rules
POST /automation/rules
PATCH /automation/rules/{id}/toggle
DELETE /automation/rules/{id}
POST /automation/relay
POST /security/detect         ← frame + YOLOv8n COCO security inference
GET  /security/events
GET  /security/events/count
POST /security/test-alert
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

**Alert types used:**
```
sensor alerts:   soil_moisture, temperature, ec_level, humidity
disease alerts:  disease_detected
relay alerts:    relay_activated, relay_deactivated
security alerts: security_person, security_animal, security_unknown
```

**Default automation rules:**
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
| Pages | 7 pages total |

**All pages:**
```
/                → Overview — live sensors, alerts, disease feed, offline indicator
/sensors         → Real-time charts, safe zones, time range selector
/disease         → Detection history, confidence bars, disease info
/disease/detect  → Upload image OR webcam → YOLOv8 disease inference
/security        → Triple Layer Security — live camera + event log ← NEW
/automation      → Relay controls, rule management
/reports         → Historical charts, CSV export
```

---

## 📲 Telegram Bot

**All alert types:**
```
alert_soil_moisture(value)                          → 🚨 Soil moisture low
alert_temperature(value)                            → 🌡️ Temperature high
alert_humidity(value)                               → 💨 Humidity low
alert_ec_level(value)                               → ⚡ EC level low
alert_disease_detected(label, conf, severity, ...)  → 🔬 Disease + photo
notify_relay_activated(name, pin, reason)           → ⚙️ Relay ON
notify_relay_deactivated(name, pin)                 → ⚙️ Relay OFF
send_daily_summary(...)                             → 📊 Daily report
send_system_startup()                               → 🚀 System online
send_security_telegram(type, conf, detections, img) → 🚨 Security + photo ← NEW
```

**Test:** `python iriv_scripts/telegram_bot.py`

---

## ☁️ Supabase

| Detail | Value |
|---|---|
| URL | https://zltdegjlrgdrustyqcro.supabase.co |
| Region | Singapore (SEA) |
| RLS | Enabled on all 4 tables ✅ |
| Sync | Auto every 60s |

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

# Demo scripts
python demo_data.py          # Insert escalating sensor data
python live_sensors.py       # Continuous live sensor updates
python add_alerts.py         # Insert demo alerts
python add_diseases.py       # Insert demo disease detections

# Git push on uni WiFi
git config --global http.sslVerify false
git push origin main
git config --global http.sslVerify true
```

---

## 🚀 IRIV Deployment Checklist

```
1.  Flash Raspberry Pi OS
2.  Configure WiFi
3.  pip install fastapi uvicorn sqlalchemy pymysql pymodbus
        adafruit-ads1x15 python-telegram-bot opencv-python
        onnxruntime python-dotenv ultralytics
4.  Copy project files via SCP
5.  Set up MySQL + run init.sql
6.  Copy .env with credentials
7.  Copy best_v3.onnx → ai_model/models/best.onnx
8.  Connect PIR sensor to GPIO 24
9.  Set up Cloudflared tunnel
10. Start services:
    uvicorn backend.main:app --host 0.0.0.0 --port 8000
    python iriv_scripts/sensor_collector.py
    python iriv_scripts/automation_controller.py
    python iriv_scripts/security_monitor.py
11. Set up systemd for auto-start
12. Test full end-to-end
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
15. YOLOv8 disease inference: conf=0.5, iou=0.45
16. Disease model classes: [healthy, ganoderma, unhealthy, immature]
17. IRIV scripts have simulation mode — ON_IRIV = sys.platform == 'linux'
18. PRODUCTION disease model is V3 — best_v3.pt / best_v3.onnx
19. Supabase RLS enabled — use service role key for backend
20. Git push on uni WiFi: disable sslVerify, push, re-enable
21. Dataset v2 has 7,748 images from 10 Roboflow datasets
22. data_v2.yaml points to balanced_v2 dataset
23. /disease/detect uses disease model (YOLOv8n v3)
24. /security/detect uses COCO model (yolov8n.pt pretrained)
25. Security cooldown is 30 seconds between alerts
26. PIR sensor GPIO pin is 24 on IRIV
27. OBS Virtual Camera is Camera index 1 on dev laptop
28. Dashboard has 7 pages — added Security Monitor page
29. security_monitor.py in iriv_scripts — full Triple Layer Security
30. evaluate.py evaluates all 3 models on same test set