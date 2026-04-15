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
  - [x] Overview — live sensor cards, alerts, disease feed
  - [x] Sensors — real-time charts, safe zone indicators
  - [x] Disease AI — detection results, confidence bars
  - [x] Automation — relay controls, rule management
  - [x] Reports — historical charts, CSV export
- [x] Dashboard improvements — live indicators, skeletons, alert ack, theme toggle
- [x] Telegram bot — all alert types working
- [x] AI Model — YOLOv8n trained and ONNX exported
  - [x] 3 Roboflow datasets merged (5,725 images)
  - [x] Classes: healthy, ganoderma, unhealthy, immature
  - [x] YOLOv8n: 50 epochs, mAP50 = 76.3% (FINAL MODEL)
  - [x] YOLOv8s: 50 epochs, mAP50 = 67.1% (comparison)
  - [x] Exported: best.pt (6MB) + best.onnx (11.7MB)
  - [x] Confusion matrix + evaluation charts generated
- [x] Git LFS for model weights
- [x] 3x backups — GitHub, D drive, Google Drive
- [x] Cloudflared installed (C:\Program Files (x86)\cloudflared)
- [x] IRIV hardware scripts — all 4 complete + tested in simulation

### 🔲 Todo
- [ ] Cloudflared tunnel test — need home WiFi
- [ ] IRIV hardware arrives → deploy + test
- [ ] Connect RS485 sensors on IRIV
- [ ] Full end-to-end system test
- [ ] FYP report writing

---

## 🗂️ Project Structure

```
fyp-oil-palm/
├── CLAUDE.md
├── README.md
├── .gitignore
├── .env                               ← Never commit!
│
├── ai_model/
│   ├── data.yaml                      ← Points to balanced dataset
│   ├── datasets/
│   │   ├── roboflow/
│   │   │   ├── palm_leaf_ganoderma/   ← 440 images
│   │   │   ├── oil_palm_health/       ← 2,073 images
│   │   │   └── tree_health_detection/ ← 2,651 images
│   │   ├── combined/                  ← Merged (5,725 images)
│   │   └── balanced/                  ← Balanced (used for training)
│   ├── models/
│   │   ├── best.pt                    ← YOLOv8n weights (6MB) ✅ FINAL
│   │   ├── best.onnx                  ← ONNX for IRIV (11.7MB) ✅
│   │   └── best_v2_yolov8s.pt         ← YOLOv8s comparison
│   ├── runs/
│   │   ├── oil_palm_v1/               ← YOLOv8n training results
│   │   ├── oil_palm_v2/               ← YOLOv8s training results
│   │   └── evaluation/                ← Confusion matrix + charts ✅
│   └── training/
│       ├── train.py                   ← YOLOv8 training script ✅
│       ├── prepare_dataset.py         ← Dataset merger ✅
│       ├── balance_dataset.py         ← Dataset balancer ✅
│       ├── evaluate.py                ← Evaluation + charts ✅
│       └── detect.py                  ← Single image inference
│
├── backend/
│   ├── main.py                        ← FastAPI (port 8000) ✅
│   ├── routes/
│   │   ├── sensors.py                 ✅
│   │   ├── disease.py                 ✅
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
│   │   ├── page.tsx                   ✅ Overview
│   │   ├── sensors/page.tsx           ✅
│   │   ├── disease/page.tsx           ✅
│   │   ├── automation/page.tsx        ✅
│   │   └── reports/page.tsx           ✅
│   ├── components/ui/
│   │   ├── Sidebar.tsx                ✅
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

## 🌡️ Sensors

| Sensor | Interface | Library |
|---|---|---|
| Temperature + Humidity | RS485 Modbus RTU | `pymodbus` |
| Soil Moisture | RS485 Modbus RTU | `pymodbus` |
| EC Level | Analog 4–20mA → ADS1115 | `adafruit-ads1x15` |
| Camera | USB / CSI | `opencv-python` |

---

## 🤖 AI Model — COMPLETE ✅

| Detail | Value |
|---|---|
| Architecture | YOLOv8n (nano) — FINAL |
| Parameters | 3,006,428 |
| Size | 6MB (.pt) / 11.7MB (.onnx) |
| Inference Speed | 6ms per image |
| Overall mAP50 | 76.3% |
| Ganoderma mAP50 | 92.6% |
| Healthy mAP50 | 97.3% |
| Unhealthy mAP50 | 75.1% |
| Immature mAP50 | 40.1% |

**Classes:**
```
0: healthy     → Normal healthy palm
1: ganoderma   → Bracket fungus, yellowing fronds (HIGH severity)
2: unhealthy   → General disease symptoms (MEDIUM severity)
3: immature    → Immature/young palm (LOW severity)
```

**Datasets:**
```
palm_leaf_ganoderma    → 440 images
oil_palm_health        → 2,073 images
tree_health_detection  → 2,651 images
Total                  → 5,725 images
```

**Run inference:**
```python
from ultralytics import YOLO
model = YOLO('ai_model/models/best.pt')
results = model('image.jpg', conf=0.5, iou=0.45)
```

**Why YOLOv8n over YOLOv8s:**
YOLOv8n (76.3%) outperformed YOLOv8s (67.1%) on our dataset.
Smaller datasets favour lighter architectures. Also faster inference
on IRIV CM4 (6ms vs 11ms).

---

## ⚡ Backend — FastAPI

| Detail | Value |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | MySQL 8.0 — `fyp_oil_palm` |
| ORM | SQLAlchemy |
| Cloud Sync | Supabase every 60s |
| Port | 8000 |
| Docs | http://localhost:8000/docs |

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
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| HTTP | Axios |
| Icons | Lucide React |
| Dates | date-fns |
| Port | 3000 |
| Run | `npm run dev` (inside dashboard folder) |

---

## ☁️ Supabase

| Detail | Value |
|---|---|
| URL | https://zltdegjlrgdrustyqcro.supabase.co |
| Region | Singapore (SEA) |
| RLS | Enabled on all 4 tables ✅ |
| Sync | Auto every 60s via supabase_sync.py |

---

## 📲 Telegram Bot ✅

| Detail | Value |
|---|---|
| Script | `iriv_scripts/telegram_bot.py` |
| Alerts | Soil moisture, temperature, EC, disease, relay, daily summary |
| Test | `python iriv_scripts/telegram_bot.py` |

---

## 🔐 Cloudflared

| Detail | Value |
|---|---|
| Status | Installed ✅ |
| Path | `C:\Program Files (x86)\cloudflared\cloudflared.exe` |
| VS Code PATH | Added via settings.json |
| Quick test | `cloudflared tunnel --url http://localhost:8000` |

---

## 💾 Backups

| Location | Status | Contents |
|---|---|---|
| GitHub | ✅ | Code + model weights (Git LFS) |
| D: drive | ✅ | Full project (robocopy) |
| Google Drive | ✅ | Full project backup |

---

## 🛠️ Local Dev Environment

| Detail | Value |
|---|---|
| OS | Windows |
| GPU | RTX 3060 Laptop — CUDA 12.1 ✅ |
| Python | 3.12 |
| Venv | `fyp_env\Scripts\activate` |
| MySQL | 8.0.45 |
| Node | 18+ |

**Start dev servers:**
```powershell
# Terminal 1 — Backend
cd C:\Users\danes\fyp-oil-palm
fyp_env\Scripts\activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Dashboard
cd C:\Users\danes\fyp-oil-palm\dashboard
npm run dev

# Terminal 3 — Sensor simulation (optional)
cd C:\Users\danes\fyp-oil-palm
fyp_env\Scripts\activate
python iriv_scripts/sensor_collector.py
```

---

## 🚀 IRIV Deployment Checklist (When Hardware Arrives)

```
1. Flash Raspberry Pi OS to IRIV eMMC
2. Configure WiFi on IRIV
3. Install Python dependencies:
   pip install fastapi uvicorn sqlalchemy pymysql
   pip install pymodbus adafruit-ads1x15
   pip install python-telegram-bot opencv-python
   pip install onnxruntime python-dotenv
4. Copy project files via SCP:
   scp -r fyp-oil-palm/ pi@IRIV_IP:~/
5. Set up MySQL on IRIV
6. Run init.sql to create tables
7. Copy .env file with credentials
8. Copy best.onnx to ai_model/models/
9. Set up Cloudflared tunnel
10. Start services:
    uvicorn backend.main:app --host 0.0.0.0 --port 8000
    python iriv_scripts/sensor_collector.py
    python iriv_scripts/automation_controller.py
11. Set up systemd services for auto-start
12. Test full end-to-end system
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
18. Final model is YOLOv8n (best.pt) NOT YOLOv8s
19. Supabase RLS is enabled — use service role key for backend
20. Git push on uni WiFi: git config --global http.sslVerify false, then re-enable after