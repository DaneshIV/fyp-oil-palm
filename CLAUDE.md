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
- [x] Project folder structure created
- [x] GitHub repo initialized
- [x] Virtual environment (fyp_env) set up
- [x] PyTorch + CUDA 12.1 installed (RTX 3060 confirmed working)
- [x] MySQL database (fyp_oil_palm) with 4 tables
- [x] FastAPI backend — all endpoints working on port 8000
- [x] MySQL → Supabase auto sync every 60 seconds
- [x] Next.js 14 dashboard — all 5 pages complete
  - [x] Overview page
  - [x] Sensors page — real-time charts
  - [x] Disease AI page — detection results
  - [x] Automation page — relay controls + rules
  - [x] Reports page — charts + CSV export
 
### 🔲 Todo
- [ ] Mendeley dataset — downloaded, not reviewed
- [ ] Roboflow dataset — forked, needs YOLOv8 export
- [ ] YOLOv8 training on RTX 3060
- [ ] ONNX export for IRIV
- [ ] Telegram bot
- [ ] Cloudflared tunnel
- [ ] IRIV hardware integration
- [ ] Full system testing
- [ ] FYP report
 
---
 
## 🗂️ Project Structure
 
```
fyp-oil-palm/
├── CLAUDE.md
├── README.md
├── .gitignore
├── .env                               ← Never commit!
├── ai_model/
│   ├── datasets/
│   │   ├── roboflow/
│   │   └── mendeley/
│   ├── training/
│   │   ├── train.py
│   │   ├── detect.py
│   │   └── evaluate.py
│   ├── models/
│   │   ├── best.pt
│   │   └── best.onnx
│   └── notebooks/
│       └── oil_palm_train.ipynb
├── backend/
│   ├── main.py                        ← FastAPI entry point (port 8000)
│   ├── routes/
│   │   ├── sensors.py
│   │   ├── disease.py
│   │   ├── alerts.py
│   │   └── automation.py
│   ├── schemas/
│   │   └── schemas.py
│   ├── database/
│   │   ├── connection.py
│   │   ├── init.sql
│   │   └── supabase_sync.py
│   └── requirements.txt
├── dashboard/                         ← Next.js 16 (port 3000)
│   ├── app/
│   │   ├── page.tsx                   ← Overview ✅
│   │   ├── sensors/page.tsx           ✅
│   │   ├── disease/page.tsx           ✅
│   │   ├── automation/page.tsx        ✅
│   │   └── reports/page.tsx           ✅
│   ├── components/
│   │   └── ui/
│   │       ├── Sidebar.tsx            ✅
│   │       └── SensorCard.tsx         ✅
│   ├── lib/
│   │   ├── api.ts                     ✅
│   │   └── supabase.ts                ✅
│   └── .env.local                     ← Never commit!
├── iriv_scripts/
│   ├── sensor_collector.py
│   ├── camera_capture.py
│   ├── inference_runner.py
│   ├── telegram_bot.py
│   └── automation_controller.py
└── docs/
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
 
## 🤖 AI Model
 
| Detail | Value |
|---|---|
| Architecture | YOLOv8 (Ultralytics) |
| Task | Object Detection |
| Dataset 1 | Roboflow — Palm Oil Leaf Ganoderma |
| Dataset 2 | Mendeley — Oil Palm Anomaly Detection |
| Classes | healthy, ganoderma, bud_rot, crown_disease |
| Training GPU | RTX 3060 Laptop (6GB VRAM) |
| Deploy Format | ONNX on IRIV |
 
```bash
# Train
yolo detect train data=datasets/data.yaml model=yolov8n.pt epochs=50 imgsz=640 device=0
 
# Export
yolo export model=models/best.pt format=onnx
```
 
---
 
## ⚡ Backend — FastAPI
 
| Detail | Value |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | MySQL 8.0 — `fyp_oil_palm` |
| ORM | SQLAlchemy |
| Cloud | Supabase sync every 60s |
| Port | 8000 |
| Docs | http://localhost:8000/docs |
 
**MySQL (local dev):**
```
DB_USER=root
DB_PASSWORD=fyp1234
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fyp_oil_palm
```
 
**Endpoints:**
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
 
## 🖥️ Dashboard — Next.js
 
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
 
---
 
## ☁️ Supabase
 
| Detail | Value |
|---|---|
| URL | https://zltdegjlrgdrustyqcro.supabase.co |
| Region | Singapore (SEA) |
| Tables | sensor_readings, disease_detections, alerts, automation_rules |
| Realtime | Enabled on sensor_readings, disease_detections, alerts |
 
---
 
## 🛠️ Local Dev Environment
 
| Detail | Value |
|---|---|
| OS | Windows |
| GPU | RTX 3060 Laptop — CUDA 12.1 ✅ |
| Python | 3.12 |
| Venv | `fyp_env\Scripts\activate` |
| MySQL | 8.0.45 — `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe` |
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
```
 
---
 
## ⚠️ Rules for Claude Code
 
1. Never use Node-RED — custom Next.js only
2. Never use Grafana — charts are in Next.js
3. Backend is FastAPI — lightweight only
4. IRIV uses ONNX model — NOT .pt
5. Database is MySQL — NOT SQLite/PostgreSQL
6. RS485 port is `/dev/ttyS0` on IRIV
7. ADS1115 I²C is `0x48`
8. Sensor polling in `iriv_scripts/sensor_collector.py`
9. Dashboard fetches from FastAPI only — never direct MySQL
10. Import paths use `backend.` prefix — e.g. `from backend.schemas.schemas import ...`
11. All `__init__.py` files are empty
12. MySQL local password is `fyp1234`
13. Dashboard has its own `.env.local`
14. Supabase URL is https://zltdegjlrgdrustyqcro.supabase.co
