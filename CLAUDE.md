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

This system combines real-time IoT sensor monitoring with AI-powered disease detection for oil palm trees. It runs on an industrial edge controller (IRIV PiControl) deployed in the field, with a remote Next.js dashboard accessible from anywhere via Cloudflared tunnel.

---

## 📅 Current Project Status

### ✅ Completed
- [x] Project folder structure + GitHub repo
- [x] Virtual environment (fyp_env) — Python 3.12
- [x] PyTorch + CUDA 12.1 (RTX 3060 Laptop confirmed working)
- [x] MySQL database (fyp_oil_palm) — 4 tables created
- [x] FastAPI backend — all endpoints working on port 8000
- [x] MySQL → Supabase auto sync every 60 seconds
- [x] Next.js 16 dashboard — all 5 pages complete
  - [x] Overview page — live sensor cards, alerts, disease feed
  - [x] Sensors page — real-time charts, safe zone indicators
  - [x] Disease AI page — detection results, confidence bars
  - [x] Automation page — relay controls, rule management
  - [x] Reports page — historical charts, CSV export
- [x] Dashboard improvements — live indicators, skeletons, alert ack, theme toggle
- [x] Telegram bot — all alert types working
- [x] AI Model — YOLOv8n trained and ONNX exported
  - [x] Dataset: 3 Roboflow datasets merged (5,725 images total)
  - [x] Classes: healthy, ganoderma, unhealthy, immature
  - [x] Training: 50 epochs, RTX 3060, mAP50 = 76.3%
  - [x] Ganoderma mAP50 = 92.6% (most critical class)
  - [x] Exported: best.pt (6MB) + best.onnx (11.7MB)

### 🔲 Todo
- [ ] Cloudflared tunnel setup
- [ ] Write IRIV hardware integration scripts
- [ ] Deploy to IRIV when hardware arrives
- [ ] Connect RS485 sensors
- [ ] Full system end-to-end testing
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
│   ├── data.yaml                      ← YOLOv8 dataset config (points to balanced)
│   ├── datasets/
│   │   ├── roboflow/                  ← Downloaded Roboflow datasets
│   │   │   ├── palm_leaf_ganoderma/   ← 440 images, 3 classes
│   │   │   ├── oil_palm_health/       ← 2,073 images, 2 classes
│   │   │   └── tree_health_detection/ ← 2,651 images, 6 classes
│   │   ├── combined/                  ← Merged dataset (5,725 images)
│   │   └── balanced/                  ← Balanced dataset (used for training)
│   │       ├── train/images + labels
│   │       ├── val/images + labels
│   │       └── test/images + labels
│   ├── models/
│   │   ├── best.pt                    ← PyTorch weights (6MB)
│   │   └── best.onnx                  ← ONNX for IRIV deployment (11.7MB)
│   ├── runs/
│   │   └── oil_palm_v1/               ← Training results, charts, metrics
│   ├── training/
│   │   ├── train.py                   ← YOLOv8 training script ✅
│   │   ├── prepare_dataset.py         ← Dataset merger script ✅
│   │   ├── balance_dataset.py         ← Dataset balancer script ✅
│   │   ├── detect.py                  ← Run inference on image
│   │   └── evaluate.py                ← Metrics + confusion matrix
│   └── notebooks/
│       └── oil_palm_train.ipynb
│
├── backend/
│   ├── main.py                        ← FastAPI entry point (port 8000) ✅
│   ├── routes/
│   │   ├── sensors.py                 ✅
│   │   ├── disease.py                 ✅
│   │   ├── alerts.py                  ✅
│   │   └── automation.py              ✅
│   ├── schemas/
│   │   └── schemas.py                 ✅
│   ├── database/
│   │   ├── connection.py              ✅
│   │   ├── init.sql                   ✅
│   │   └── supabase_sync.py           ✅
│   └── requirements.txt
│
├── dashboard/                         ← Next.js 16 (port 3000)
│   ├── app/
│   │   ├── page.tsx                   ← Overview ✅
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
│   ├── lib/
│   │   ├── api.ts                     ✅
│   │   └── supabase.ts                ✅
│   └── .env.local                     ← Never commit!
│
├── iriv_scripts/
│   ├── sensor_collector.py            ← RS485 + analog sensor polling
│   ├── camera_capture.py              ← USB/CSI camera capture
│   ├── inference_runner.py            ← YOLOv8 ONNX inference
│   ├── telegram_bot.py                ← Telegram alerts ✅
│   └── automation_controller.py       ← Relay control
│
└── docs/
    └── architecture_diagram.html      ✅
```

---

## 🔧 Hardware — IRIV PiControl AgriBox v2

**Never assume generic Raspberry Pi behaviour. This is an industrial controller.**

| Component | Detail |
|---|---|
| SoM | Raspberry Pi Compute Module 4 (CM4) |
| CPU | Broadcom BCM2711 Quad-core Cortex-A72 @ 1.5GHz |
| RAM | 4GB LPDDR4 |
| Storage | 32GB eMMC |
| Connectivity | WiFi (802.11ac), Bluetooth 5.0, Gigabit Ethernet |
| Serial | RS232 + RS485 (Modbus RTU) via terminal blocks |
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
| Architecture | YOLOv8n (nano) |
| Task | Object Detection — whole plant disease |
| Parameters | 3,006,428 |
| Model Size | 6MB (.pt) / 11.7MB (.onnx) |
| Input Shape | 640×640 |
| Inference Speed | 6ms per image |
| Overall mAP50 | 76.3% |
| Ganoderma mAP50 | 92.6% ← most critical |
| Healthy mAP50 | 97.3% |
| Unhealthy mAP50 | 75.1% |
| Immature mAP50 | 40.1% |

**Classes (4 total):**
```
0: healthy     → Normal healthy palm
1: ganoderma   → Bracket fungus, yellowing fronds
2: unhealthy   → General disease symptoms
3: immature    → Immature/young palm
```

**Datasets used:**
```
palm_leaf_ganoderma    → 440 images  (Healthy, Infected, Initial Infection)
oil_palm_health        → 2,073 images (Healthy, Unhealthy)
tree_health_detection  → 2,651 images (healthy, stressed, unhealthy, immature)
Total combined         → 5,725 images
After balancing        → ~4,859 images (train:3000+, val:2000+, test:1000+)
```

**Training command:**
```bash
python ai_model/training/train.py
```

**Run inference:**
```python
from ultralytics import YOLO
model = YOLO('ai_model/models/best.pt')
results = model('image.jpg', conf=0.5, iou=0.45)
```

**Export to ONNX (already done):**
```bash
yolo export model=ai_model/models/best.pt format=onnx
```

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

**MySQL credentials (local dev):**
```
DB_USER=root
DB_PASSWORD=fyp1234
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fyp_oil_palm
```

**MySQL path on Windows:**
```
C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
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
| Tables | sensor_readings, disease_detections, alerts, automation_rules |
| Sync | Auto every 60s via supabase_sync.py |

---

## 📲 Telegram Bot ✅

| Detail | Value |
|---|---|
| Script | `iriv_scripts/telegram_bot.py` |
| Library | `python-telegram-bot` |
| Alerts | Soil moisture, temperature, EC, disease detection, relay status, daily summary |
| Test | `python iriv_scripts/telegram_bot.py` |

---

## 🔐 Cloudflared Tunnel (TODO)

| Detail | Value |
|---|---|
| Tool | Cloudflared (free) |
| Purpose | Expose IRIV FastAPI to internet securely |
| Run | `cloudflared tunnel run` |
| Config | `~/.cloudflared/config.yml` on IRIV |

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

**Start both servers:**
```powershell
# Terminal 1 — Backend
cd C:\Users\danes\fyp-oil-palm
fyp_env\Scripts\activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Dashboard
cd C:\Users\danes\fyp-oil-palm\dashboard
npm run dev
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
15. YOLOv8 model inference: use conf=0.5, iou=0.45
16. Model classes order: [healthy, ganoderma, unhealthy, immature]