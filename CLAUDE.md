# CLAUDE.md — FYP Oil Palm IoT & Disease Detection System
 
> This file is read automatically by Claude Code at the start of every session.
> Do NOT delete or rename this file. Keep it updated as the project evolves.
 
---
 
## 🌴 Project Overview
 
**Project Title:** IoT-Based Oil Palm Tree Monitoring and Fruit Disease Detection System
**Developer:** Danesh
**Type:** Final Year Project (FYP)
**Hardware:** IRIV PiControl Industry 4.0 AgriBox v2 (Raspberry Pi CM4-based industrial controller by Cytron Malaysia)
 
This system combines real-time IoT sensor monitoring with AI-powered disease detection for oil palm trees. It runs on an industrial edge controller (IRIV PiControl) deployed in the field, with a remote Next.js dashboard accessible from anywhere via Cloudflared tunnel.
 
---
 
## 🗂️ Project Structure
 
```
fyp-oil-palm/
├── CLAUDE.md                          ← YOU ARE HERE
├── README.md
├── .gitignore
│
├── ai_model/                          ← AI disease detection
│   ├── datasets/
│   │   ├── roboflow/                  ← Roboflow Ganoderma dataset (YOLOv8 format)
│   │   └── mendeley/                  ← Mendeley oil palm anomaly dataset
│   ├── training/
│   │   ├── train.py                   ← YOLOv8 training script
│   │   ├── detect.py                  ← Run inference on a single image
│   │   └── evaluate.py                ← Confusion matrix, accuracy metrics
│   ├── models/
│   │   ├── best.pt                    ← Best trained YOLOv8 weights
│   │   └── best.onnx                  ← ONNX export for IRIV deployment
│   └── notebooks/
│       └── oil_palm_train.ipynb       ← Main Jupyter training notebook
│
├── backend/                           ← FastAPI server (runs ON the IRIV)
│   ├── main.py                        ← FastAPI app entry point
│   ├── routes/
│   │   ├── sensors.py                 ← GET /sensors/latest, /sensors/history
│   │   ├── disease.py                 ← POST /disease/detect, GET /disease/history
│   │   ├── alerts.py                  ← GET /alerts, POST /alerts/acknowledge
│   │   └── automation.py              ← GET/POST /automation/rules, /automation/relay
│   ├── models/
│   │   └── schemas.py                 ← Pydantic request/response schemas
│   ├── database/
│   │   ├── connection.py              ← MySQL connection (SQLAlchemy)
│   │   └── init.sql                   ← SQL to create all tables
│   └── requirements.txt
│
├── dashboard/                         ← Next.js 14 frontend
│   ├── app/
│   │   ├── page.tsx                   ← Overview / home dashboard
│   │   ├── sensors/page.tsx           ← Real-time sensor monitoring
│   │   ├── disease/page.tsx           ← Disease detection results + images
│   │   ├── automation/page.tsx        ← Relay controls + automation rules
│   │   └── reports/page.tsx           ← Historical charts + CSV export
│   ├── components/
│   │   ├── SensorCard.tsx
│   │   ├── DiseaseResult.tsx
│   │   ├── AlertFeed.tsx
│   │   └── Charts/
│   ├── lib/
│   │   └── api.ts                     ← All FastAPI call functions
│   └── package.json
│
├── iriv_scripts/                      ← Scripts deployed ON the IRIV hardware
│   ├── sensor_collector.py            ← Polls RS485 + analog sensors → MySQL
│   ├── camera_capture.py              ← Captures images via USB/CSI camera
│   ├── inference_runner.py            ← Runs YOLOv8 ONNX on captured image
│   ├── telegram_bot.py                ← Sends Telegram alerts
│   └── automation_controller.py       ← Controls relay outputs (pumps, lights)
│
└── docs/
    ├── architecture_diagram.html
    ├── api_documentation.md
    ├── setup_guide.md
    └── dataset_sources.md
```
 
---
 
## 🔧 Hardware — IRIV PiControl AgriBox v2
 
**Never assume generic Raspberry Pi behaviour. This is an industrial controller with specific interfaces.**
 
| Component | Detail |
|---|---|
| SoM | Raspberry Pi Compute Module 4 (CM4) |
| CPU | Broadcom BCM2711 Quad-core Cortex-A72 @ 1.5GHz |
| RAM | 4GB LPDDR4 |
| Storage | 32GB eMMC |
| Connectivity | WiFi (802.11ac), Bluetooth 5.0, Gigabit Ethernet |
| Serial | RS232 + RS485 (Modbus RTU) via terminal blocks |
| Analog Inputs | 4× isolated (0–5V / 0–10V / 4–20mA) via ADS1115 ADC (I²C 0x48) |
| Digital I/O | Isolated DI + DO up to 50V |
| Camera | USB or CSI (Pi Camera) |
| OS | Raspberry Pi OS (Debian-based) |
| Mounting | DIN Rail |
| Power | 24V DC industrial PSU |
 
**RS485 port on IRIV:** `/dev/ttyS0` (baud 9600, Modbus RTU)
**ADS1115 I²C address:** `0x48`
 
---
 
## 🌡️ Sensors
 
| Sensor | Interface | Python Library | Notes |
|---|---|---|---|
| Temperature + Humidity (industrial) | RS485 Modbus RTU | `pymodbus` | Register addresses in sensor datasheet |
| Soil Moisture | RS485 Modbus RTU | `pymodbus` | |
| EC (Electrical Conductivity) | Analog 4–20mA → ADS1115 | `adafruit-ads1x15` | Enable internal shunt resistor |
| Camera | USB or CSI | `opencv-python` | For disease detection images |
 
---
 
## 🤖 AI Model
 
| Detail | Value |
|---|---|
| Architecture | YOLOv8 (Ultralytics) |
| Task | Object Detection (disease location on tree/fruit) |
| Dataset 1 | Roboflow — Palm Oil Leaf Ganoderma (YOLOv8 format) |
| Dataset 2 | Mendeley — Oil Palm Tree Anomaly Detection |
| Target Classes | healthy, ganoderma, bud_rot, crown_disease |
| Training Hardware | NVIDIA RTX 3060 Laptop GPU (local) |
| Deployment Format | ONNX (`best.onnx`) on IRIV |
| Inference Script | `iriv_scripts/inference_runner.py` |
| Target Inference Time | < 3 seconds on CM4 |
 
**Training command:**
```bash
yolo detect train data=datasets/data.yaml model=yolov8n.pt epochs=50 imgsz=640 device=0
```
 
**Export to ONNX:**
```bash
yolo export model=models/best.pt format=onnx
```
 
---
 
## ⚡ Backend — FastAPI
 
| Detail | Value |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | MySQL 8.0 (local on IRIV) |
| ORM | SQLAlchemy |
| Auth | JWT tokens |
| Real-time | WebSocket for live sensor push |
| Port | 8000 |
| Run command | `uvicorn backend.main:app --host 0.0.0.0 --port 8000` |
 
**Key API endpoints:**
```
GET  /sensors/latest           → Latest sensor readings
GET  /sensors/history?hours=24 → Historical data
POST /disease/detect           → Trigger camera capture + AI inference
GET  /disease/history          → Past detection results
GET  /alerts                   → All alerts
POST /alerts/{id}/acknowledge  → Acknowledge an alert
GET  /automation/rules         → List automation rules
POST /automation/relay         → Manually toggle a relay
```
 
---
 
## 🗄️ Database Schema (MySQL)
 
```sql
-- sensor_readings
id, temperature, humidity, soil_moisture, ec_level, timestamp
 
-- disease_detections
id, image_path, disease_label, confidence, severity, tree_id, block_id, timestamp
 
-- alerts
id, alert_type, message, sensor_value, threshold, acknowledged, triggered_at
 
-- automation_rules
id, rule_name, trigger_type (threshold/schedule), sensor_field,
threshold_value, operator, relay_pin, is_active, last_triggered
```
 
---
 
## 🖥️ Frontend — Next.js Dashboard
 
| Detail | Value |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Data Fetching | SWR or React Query |
| Real-time | WebSocket (live sensor updates) |
| Auth | JWT stored in httpOnly cookies |
 
**Pages:**
- `/` — Overview with key metrics, latest alerts, system status
- `/sensors` — Real-time charts for temp, humidity, soil moisture, EC
- `/disease` — Disease detection results, captured images, confidence scores
- `/automation` — Toggle relays, manage rules, view pump/irrigation status
- `/reports` — Historical charts, date range filter, CSV export
 
---
 
## 🔐 Remote Access
 
| Detail | Value |
|---|---|
| Tool | Cloudflared Tunnel (free) |
| Purpose | Expose IRIV's FastAPI to the internet securely |
| No port forwarding | ✅ Works behind any firewall/university network |
| Run command | `cloudflared tunnel run` |
| Config file | `~/.cloudflared/config.yml` on IRIV |
 
---
 
## 📲 Telegram Bot
 
| Detail | Value |
|---|---|
| Library | `python-telegram-bot` |
| Script | `iriv_scripts/telegram_bot.py` |
| Triggers | Soil moisture < 40%, Temp > 35°C, Disease detected, Pump ON/OFF |
| Features | Photo messages (disease image + label), inline acknowledge buttons |
 
---
 
## 🛠️ Local Development Environment
 
| Detail | Value |
|---|---|
| OS | Windows |
| GPU | NVIDIA RTX 3060 Laptop (6GB VRAM) |
| CUDA | 12.1 |
| Python | 3.10+ |
| Virtual env | `fyp_env` (activate: `fyp_env\Scripts\activate`) |
| Node.js | 18+ (for Next.js dashboard) |
| IDE | VS Code |
 
**Python dependencies (key ones):**
```
torch, torchvision (cu121)
ultralytics          ← YOLOv8
fastapi, uvicorn
sqlalchemy, pymysql
pymodbus             ← RS485 Modbus RTU
adafruit-ads1x15     ← Analog EC sensor
opencv-python
python-telegram-bot
roboflow
```
 
---
 
## ⚠️ Important Rules for Claude Code
 
1. **Never use Node-RED** — we are building a custom Next.js dashboard, not Node-RED
2. **Never use Grafana** — all visualisation is in the custom Next.js frontend
3. **Backend runs on IRIV** — FastAPI must be lightweight, no heavy dependencies
4. **Model format is ONNX** on IRIV — NOT `.pt` (PyTorch not installed on IRIV)
5. **Database is MySQL** — NOT SQLite, NOT PostgreSQL
6. **RS485 port is `/dev/ttyS0`** on IRIV — do not assume `/dev/ttyUSB0`
7. **ADS1115 I²C address is `0x48`** — hardcoded in IRIV hardware
8. **All sensor polling is in `iriv_scripts/sensor_collector.py`** — not in FastAPI
9. **Dashboard fetches from FastAPI** — never reads MySQL directly from Next.js
10. **Git ignore datasets and model weights** — too large for GitHub
 
---
 
## 📅 Project Status
 
- [x] System architecture designed
- [x] Project folder structure created
- [x] GitHub repo initialised
- [ ] Dataset collection (Roboflow + Mendeley) — IN PROGRESS
- [ ] YOLOv8 training
- [ ] ONNX export + IRIV deployment
- [ ] FastAPI backend
- [ ] MySQL schema
- [ ] Next.js dashboard
- [ ] Telegram bot
- [ ] Cloudflared tunnel setup
- [ ] Hardware integration (after IRIV arrives)
- [ ] Full system testing
- [ ] FYP report writing