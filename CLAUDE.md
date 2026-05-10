# CLAUDE.md — FYP Oil Palm IoT & Disease Detection System

> This file is read automatically by Claude Code at the start of every session.
> Do NOT delete or rename this file. Keep it updated as the project evolves.

---

## 🌴 Project Overview

**Project Title:** AN INTEGRATED IOT BASED SMART MONITORING, AUTOMATION & SECURITY SYSTEM FOR OIL PALM TREE
**Developer:** Danesh Muthu Krisnan
**Type:** Final Year Project (FYP)
**Hardware:** IRIV PiControl Industry 4.0 AgriBox v2 (Raspberry Pi CM4-based industrial controller by Cytron Malaysia)
**GitHub:** https://github.com/DaneshIV/fyp-oil-palm
**Demo Deadline:** 25 May 2026
**IRIV Arrives:** ~12-13 May 2026 (Mon/Tue)

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
- [x] Next.js 16 dashboard — 10 pages complete
  - [x] Login — JWT authentication page
  - [x] Overview — live sensors, alerts, disease feed, WS Live indicator
  - [x] Sensors — real-time charts, safe zones, danger/warning banner
  - [x] Disease AI — detection history, bar/pie charts, confidence bars
  - [x] AI Test — upload image OR webcam → YOLOv8 inference live
  - [x] Security Monitor — Triple Layer Security with live camera
  - [x] Security Snapshots — gallery grid + lightbox + download ✅
  - [x] Automation — relay controls, rule management
  - [x] Reports — historical charts, CSV export
  - [x] Block Map — plantation tree health visual map ✅
- [x] Telegram bot — all alert types including security alerts with photo
- [x] Daily Telegram summary at midnight ✅ (iriv_scripts/daily_summary.py)
- [x] JWT Authentication ✅
  - [x] Login page at /login
  - [x] proxy.ts middleware — protects all routes
  - [x] Cookies: auth_token (24h) + username
  - [x] Logout button in sidebar with username display
- [x] API JWT Protection ✅
  - [x] HTTP middleware in main.py (not global Depends)
  - [x] Public routes: /health, /, /auth/login, /docs, /favicon.ico
  - [x] WebSocket skips JWT via scope type check
- [x] PWA — Progressive Web App ✅
  - [x] Installable on Android + iOS
  - [x] manifest.json + icons generated
  - [x] @ducanh2912/next-pwa package
- [x] WebSocket real-time updates ✅
  - [x] /sensors/ws/sensors — pushes data every 3s
  - [x] /sensors/ws/alerts — pushes alert count every 5s
  - [x] WS Live badge on Overview page
  - [x] Works via Cloudflare tunnel
- [x] Disease Detection History Charts ✅
  - [x] Bar chart — last 7 days stacked healthy/diseased
  - [x] Pie chart — class breakdown
- [x] Sensor Safe Zone Alerts ✅
  - [x] Red danger banner when any sensor exceeds danger threshold
  - [x] Yellow warning banner when sensor in warning zone
- [x] Block/Tree Map View ✅
  - [x] Visual grid of trees per block, color coded by severity
  - [x] Click tree for details panel
  - [x] Block-A, Block-B, Block-C + Other/Test section
- [x] AI Model v1 — YOLOv8n (mAP50 59.1% standardised)
- [x] AI Model v2 — YOLOv8s comparison (mAP50 52.3% standardised)
- [x] AI Model v3 — YOLOv8n (mAP50 71.5% standardised)
- [x] AI Model v4m — YOLOv8m (mAP50 74.8% at epoch 23, crashed)
- [x] AI Model v4n — YOLOv8n FINAL (mAP50 74.6%) ✅ PRODUCTION
  - [x] Dataset: balanced_v2 + Ganoderma COCO = 8,881 images
  - [x] Training time: 2.9 hours on RTX 3060
  - [x] Exported to ONNX (best_v4.onnx, ~6MB)
  - [x] Deployed to backend — /disease/detect using v4
- [x] All models evaluated on same standardised test set
- [x] V4n ONNX exported (best_v4.onnx)
- [x] Triple Layer Security System ✅
  - [x] Layer 1 — PIR sensor / software motion detection
  - [x] Layer 2 — Camera snapshot capture
  - [x] Layer 3 — YOLOv8n COCO AI threat classification
  - [x] Telegram alerts with photo + 30s cooldown
  - [x] Security event log in dashboard
  - [x] Security snapshots gallery page ✅
- [x] Full system test — 34/34 tests passed (100%) ✅
- [x] Git LFS for model weights
- [x] 3x backups — GitHub, D drive, Google Drive
- [x] Cloudflared tunnel — FULLY WORKING ✅
  - [x] Named tunnel: fyp-oil-palm
  - [x] Dashboard: https://app.project2030.me
  - [x] API: https://api.project2030.me
  - [x] Domain: project2030.me (Namecheap → Cloudflare)
  - [x] protocol: http2 in config (university WiFi fix)
- [x] IRIV hardware scripts — all 6 complete + tested in simulation
- [x] PSM2 FYP Report — ALL 6 CHAPTERS COMPLETE ✅

### 🔲 Todo
- [ ] IRIV hardware arrives → deploy + test (ETA Mon/Tue 12-13 May)
- [ ] Connect real RS485 sensors on IRIV
- [ ] Connect PIR + USB camera on IRIV
- [ ] Set up systemd auto-start on IRIV
- [ ] Full end-to-end field test
- [ ] Demo rehearsal (May 21-22)
- [ ] PSM2 report update — add V4 model results + IRIV deployment

---

## 🗂️ Project Structure

```
fyp-oil-palm/
├── CLAUDE.md
├── README.md
├── pyrightconfig.json
├── .gitignore                     ← captured_images/, yolov8*.pt excluded
├── .env                           ← Never commit!
├── start_fyp.ps1                  ← Start all services + Cloudflared
├── demo_data.py                   ← Insert demo sensor data
├── live_sensors.py                ← Continuous live sensor updates
├── add_alerts.py                  ← Insert demo alerts
├── add_diseases.py                ← Insert demo disease detections
├── add_block_data.py              ← Insert Block-A/B/C demo tree data
├── test_sensors.py                ← Test sensor danger/warning values
├── test_system.py                 ← Full system test (34/34 pass)
├── prepare_dataset_v4.py          ← COCO→YOLO convert + merge datasets
├── export_v4n.py                  ← Export v4n ONNX
│
├── ai_model/
│   ├── data.yaml                  ← Points to balanced (v1 datasets)
│   ├── data_v2.yaml               ← Points to balanced_v2 (v2 datasets)
│   ├── data_v4.yaml               ← Points to balanced_v4 (v4 dataset) ✅
│   ├── datasets/
│   │   ├── roboflow/              ← Original 3 datasets (v1)
│   │   ├── roboflow_v2/           ← New 10 datasets (v2)
│   │   ├── combined_v2/           ← Merged v2 (6,612 images)
│   │   ├── balanced_v2/           ← Balanced v2 — used for v3 training
│   │   ├── ganoderma_yolo/        ← Converted Mendeley COCO→YOLO
│   │   └── balanced_v4/           ← v4 dataset (8,881 images) ✅
│   │       ├── train/ — 6,770 images
│   │       ├── val/   — 1,399 images
│   │       └── test/  — 712 images
│   ├── models/
│   │   ├── best.pt                ← YOLOv8n v1
│   │   ├── best_v2_yolov8s.pt     ← YOLOv8s v2
│   │   ├── best_v3.pt             ← YOLOv8n v3 71.5% mAP50
│   │   ├── best_v3.onnx           ← V3 ONNX
│   │   ├── best_v4m.pt            ← YOLOv8m v4m 74.8% (crashed ep26)
│   │   ├── best_v4m.onnx          ← V4m ONNX (98.8MB — too big for IRIV)
│   │   ├── best_v4.pt             ← YOLOv8n v4n 74.6% ✅ PRODUCTION
│   │   └── best_v4.onnx           ← V4n ONNX (~6MB) ✅ FOR IRIV
│   ├── runs/
│   │   ├── oil_palm_v1/           ← V1 training results
│   │   ├── oil_palm_v2/           ← V2 training results
│   │   ├── oil_palm_v3/           ← V3 training results
│   │   ├── oil_palm_v4/           ← V4m training results (crashed ep26)
│   │   ├── oil_palm_v4n/          ← V4n training results ✅
│   │   └── evaluation/            ← Confusion matrix + charts
│   └── training/
│       ├── train.py               ← V1/V2/V3 training script
│       ├── prepare_dataset.py     ← Dataset merger v2
│       ├── balance_dataset_v2.py  ← Dataset balancer v2
│       ├── download_datasets.py   ← Roboflow bulk downloader
│       ├── evaluate.py            ← Evaluate all models
│       ├── train_v4.py            ← YOLOv8m v4 training (crashed OOM)
│       ├── train_v4n.py           ← YOLOv8n v4 training ✅
│       └── check_progress.py      ← Check training progress from CSV
│
├── backend/
│   ├── main.py                    ← FastAPI port 8000 + HTTP auth middleware
│   ├── routes/
│   │   ├── sensors.py             ✅ + WebSocket /ws/sensors + /ws/alerts
│   │   ├── disease.py             ✅ uses best_v4.pt
│   │   ├── alerts.py              ✅
│   │   ├── automation.py          ✅
│   │   ├── security.py            ✅ Triple Layer + snapshots
│   │   └── auth.py                ✅ JWT login/verify/logout
│   ├── schemas/schemas.py         ✅
│   └── database/
│       ├── connection.py          ✅
│       ├── init.sql               ✅
│       └── supabase_sync.py       ✅
│
├── dashboard/                     ← Next.js 16 port 3000
│   ├── proxy.ts                   ← Route protection middleware
│   ├── next.config.ts             ← PWA + outputFileTracingRoot
│   ├── .env.local                 ← NEXT_PUBLIC_API_URL
│   ├── hooks/
│   │   └── useWebSocket.ts        ← WebSocket hooks
│   ├── lib/
│   │   └── api.ts                 ← axios + JWT + auto URL detection
│   ├── app/
│   │   ├── login/page.tsx         ✅
│   │   ├── page.tsx               ✅ Overview + WS Live badge
│   │   ├── sensors/page.tsx       ✅ + danger/warning banner
│   │   ├── disease/page.tsx       ✅ + bar/pie charts
│   │   ├── disease/detect/page.tsx ✅ api.post() with JWT
│   │   ├── security/page.tsx      ✅
│   │   ├── security/snapshots/page.tsx ✅ blob auth
│   │   ├── automation/page.tsx    ✅
│   │   ├── reports/page.tsx       ✅
│   │   └── map/page.tsx           ✅ Plantation Block Map
│   ├── public/
│   │   ├── manifest.json          ← PWA manifest
│   │   └── icons/                 ← PWA icons 72-512px
│   └── components/ui/
│       ├── Sidebar.tsx            ✅ 10 nav items + logout
│       ├── SensorCard.tsx         ✅
│       ├── Skeleton.tsx           ✅
│       ├── LiveIndicator.tsx      ✅
│       └── ThemeToggle.tsx        ✅
│
├── iriv_scripts/
│   ├── sensor_collector.py        ✅ RS485 + simulation mode
│   ├── camera_capture.py          ✅ USB/CSI + simulation mode
│   ├── inference_runner.py        ✅ ONNX inference + simulation
│   ├── telegram_bot.py            ✅ All alert types + security alerts
│   ├── automation_controller.py   ✅ Relay control + simulation
│   ├── security_monitor.py        ✅ Triple Layer Security script
│   └── daily_summary.py           ✅ Midnight Telegram summary
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

## 🌐 Cloudflared Tunnel — LIVE ✅

| Detail | Value |
|---|---|
| Tunnel Name | fyp-oil-palm |
| Tunnel ID | 26d38b6a-5222-40a0-a0a4-489fcbbfd610 |
| Dashboard URL | https://app.project2030.me |
| API URL | https://api.project2030.me |
| Domain | project2030.me (Namecheap → Cloudflare) |
| Config | C:\Users\danes\.cloudflared\config.yml |

**Config file:**
```yaml
tunnel: 26d38b6a-5222-40a0-a0a4-489fcbbfd610
credentials-file: C:\Users\danes\.cloudflared\26d38b6a-5222-40a0-a0a4-489fcbbfd610.json

protocol: http2

ingress:
  - hostname: api.project2030.me
    service: http://localhost:8000
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      tcpKeepAlive: 30s
      keepAliveConnections: 100
      keepAliveTimeout: 90s
  - hostname: app.project2030.me
    service: http://localhost:3000
  - service: http_status:404
```

**Run:** `cloudflared tunnel run fyp-oil-palm`
**Note:** University WiFi blocks UDP 7844 → shows "degraded" but still works. Use hotspot for "healthy" status.
**Note:** Use `npm run build && npm start` NOT `npm run dev` with Cloudflared

---

## 🔐 JWT Authentication

```
Login page:     /login
Credentials:    admin/fyp2024  OR  danesh/oilpalm2024
Token storage:  Cookie (auth_token, 24h expiry)
Middleware:     dashboard/proxy.ts — export function proxy()
Logout:         Sidebar logout button clears cookies → redirects /login
Fix:            window.location.href = '/' after login (NOT router.push)
Backend:        backend/routes/auth.py + HTTP middleware in main.py
Public routes:  /health, /, /auth/login, /docs, /openapi.json, /redoc, /favicon.ico
WebSocket:      Skips JWT via scope type check in main.py
```

---

## 📅 Daily Telegram Summary

```
Script:   iriv_scripts/daily_summary.py
Schedule: Every day at midnight (00:00)
Test:     python iriv_scripts/daily_summary.py --now
```

---

## 🛡️ Triple Layer Security System

```
Layer 1 → PIR Sensor (GPIO 24)   → Hardware motion detection
Layer 2 → USB/CSI Camera         → Timestamped snapshot capture
Layer 3 → YOLOv8n COCO model     → AI threat classification
    ↓
Person  → HIGH ALERT   → DB + Telegram photo alert
Animal  → MEDIUM ALERT → DB + Telegram photo alert
Clear   → No action

Cooldown:  30 seconds
Snapshots: captured_images/security/ (gitignored)
Gallery:   /security/snapshots — blob auth image loading
```

---

## 🗺️ Block/Tree Map

```
Page:       /map
Data:       disease_detections table (block_id + tree_id fields)
Colors:     Green=None, Blue=Low, Yellow=Medium, Red=High severity
Blocks:     Block-A, Block-B, Block-C (auto/test → Other section)
Click:      Tree square → details panel on right
RTSP:       Camera 1 → Block-A, Camera 2 → Block-B
Demo data:  python add_block_data.py
```

---

## 📊 Disease Charts

```
Bar chart:  Last 7 days — stacked healthy vs diseased
Pie chart:  Class breakdown — healthy/ganoderma/unhealthy/immature
Location:   /disease page
Library:    Recharts
```

---

## ⚡ Sensor Safe Zone Alerts

```
Location:   /sensors page — between header and sensor cards
Danger:     Red banner
Warning:    Yellow banner
Thresholds:
  Temperature:   warning >32°C, danger >35°C
  Humidity:      warning <60%, danger <50%
  Soil Moisture: warning <40%, danger <30%
  EC Level:      warning <1.2, danger <1.0
Test:       python test_sensors.py
```

---

## 📱 PWA

```
Package:    @ducanh2912/next-pwa
Manifest:   dashboard/public/manifest.json
Icons:      dashboard/public/icons/
Theme:      #22c55e (green)
```

---

## 🔌 WebSocket

```
Endpoints:
  ws://localhost:8000/sensors/ws/sensors  ← every 3s
  ws://localhost:8000/sensors/ws/alerts   ← every 5s
Hook:       dashboard/hooks/useWebSocket.ts
Tunnel:     wss://api.project2030.me
Auth:       WebSocket skips JWT (scope type check)
```

---

## 🤖 AI Model — ALL VERSIONS

| Model | Architecture | Dataset | Images | mAP50 | Status |
|---|---|---|---|---|---|
| V1 | YOLOv8n | 3 Roboflow | 5,725 | 59.1% | Baseline |
| V2 | YOLOv8s | 3 Roboflow | 5,725 | 52.3% | Architecture test |
| V3 | YOLOv8n | 10 Roboflow | 7,748 | 71.5% | Previous production |
| V4m | YOLOv8m | 11 datasets | 8,881 | 74.8% | Crashed ep26, saved |
| V4n | YOLOv8n | 11 datasets | 8,881 | **74.6%** | ✅ PRODUCTION |

**Key findings:**
```
1. Dataset diversity > model size (V2 bigger but worse than V1)
2. More diverse data = best improvement (V3 +12.4% over V1)
3. V4n same arch as V3 but +1,133 ganoderma images = +3.1%
4. YOLOv8m not worth it on RTX 3060 Laptop (OOM + too slow)
```

**V4n Class Breakdown:**
```
healthy:   98.6%  ✅ Excellent
unhealthy: 99.5%  ✅ Excellent
immature:  52.2%  ⚠️ Weak (not enough labeled data)
ganoderma: 48.3%  ⚠️ Needs more close-up bracket fungus images
```

**Production model:** `best_v4.pt` / `best_v4.onnx` (~6MB, perfect for IRIV)
**Security model:** `yolov8n.pt` (pretrained COCO, auto downloaded)
**Inference:** conf=0.5, iou=0.45 (disease) | conf=0.25 (security)
**Classes:** [healthy, ganoderma, unhealthy, immature]

---

## 🗄️ Dataset v4

```
Source:    balanced_v2 (7,748) + Mendeley Ganoderma COCO (1,133)
Total:     8,881 images
Train:     6,770 (5,783 v2 + 987 ganoderma)
Val:       1,399 (1,295 v2 + 104 ganoderma)
Test:        712 (  670 v2 +  42 ganoderma)
YAML:      ai_model/data_v4.yaml
Converter: prepare_dataset_v4.py (COCO→YOLO)
```

**Training on Windows:**
```python
# MUST use if __name__ == '__main__' for multiprocessing on Windows
# workers=4 works with multiprocessing.set_start_method("spawn")
# workers=0 always safe but slow
# batch=16 for YOLOv8n on RTX 3060 6GB
# cache=True needs 11.6GB RAM — may fall back to no cache if RAM low
```

---

## ⚡ Backend — FastAPI

| Detail | Value |
|---|---|
| Port (local) | 8000 |
| URL (remote) | https://api.project2030.me |
| Docs | https://api.project2030.me/docs |
| Database | MySQL 8.0 — fyp_oil_palm |
| Sync | Supabase every 60s |

**MySQL:** root / fyp1234 / localhost:3306 / fyp_oil_palm

**All endpoints:**
```
GET  /sensors/latest
GET  /sensors/history?hours=24
POST /sensors/
WS   /sensors/ws/sensors
WS   /sensors/ws/alerts
GET  /disease/history?limit=20
GET  /disease/latest
POST /disease/
POST /disease/detect              ← YOLOv8n v4 inference
GET  /alerts/
GET  /alerts/count
POST /alerts/{id}/acknowledge
POST /alerts/acknowledge-all
GET  /automation/rules
POST /automation/rules
PATCH /automation/rules/{id}/toggle
DELETE /automation/rules/{id}
POST /automation/relay
POST /security/detect
GET  /security/events
GET  /security/events/count
GET  /security/snapshots
GET  /security/snapshot/{filename}
POST /security/test-alert
POST /auth/login                  ← PUBLIC
GET  /auth/verify
POST /auth/logout
POST /sync
GET  /health                      ← PUBLIC
```

---

## 🗄️ Database Schema

```sql
sensor_readings:    id, temperature, humidity, soil_moisture, ec_level, timestamp
disease_detections: id, image_path, disease_label, confidence, severity, tree_id, block_id, timestamp
alerts:             id, alert_type, message, sensor_value, threshold, acknowledged, triggered_at
automation_rules:   id, rule_name, trigger_type, sensor_field, threshold_value, operator, relay_pin, is_active, last_triggered, created_at
```

---

## 🖥️ Dashboard — Next.js 16

| Detail | Value |
|---|---|
| Port (local) | 3000 |
| URL (remote) | https://app.project2030.me |
| Production | npm run build then npm start |
| .env.local | NEXT_PUBLIC_API_URL=https://api.project2030.me |
| Pages | 10 total |

**lib/api.ts auto-detects URL:**
```
localhost:3000  → calls http://localhost:8000
app.project2030.me → calls https://api.project2030.me
```

**All 10 pages:**
```
/login               → JWT login
/                    → Overview + WS Live badge
/sensors             → Charts + danger/warning banner
/disease             → Detection history + bar/pie charts
/disease/detect      → Live webcam + upload (JWT via api.post)
/security            → Triple Layer Security monitor
/security/snapshots  → Gallery + blob auth + download
/automation          → Relay controls + rules
/reports             → Historical charts + CSV export
/map                 → Plantation Block/Tree Map
```

---

## 📲 Telegram Bot

```
Test:     python iriv_scripts/telegram_bot.py
Daily:    python iriv_scripts/daily_summary.py --now
```

---

## ☁️ Supabase

```
URL:    https://zltdegjlrgdrustyqcro.supabase.co
Region: Singapore
RLS:    Enabled on all 4 tables
Sync:   Auto every 60s
```

---

## 🛠️ Local Dev

```powershell
cd C:\Users\danes\fyp-oil-palm
fyp_env\Scripts\activate
.\start_fyp.ps1

# Local:  http://localhost:3000 / http://localhost:8000/docs
# Remote: https://app.project2030.me / https://api.project2030.me

# Demo scripts
python demo_data.py
python live_sensors.py
python add_alerts.py
python add_diseases.py
python add_block_data.py     # Block-A/B/C tree data
python test_sensors.py       # Test danger/warning banners
python test_system.py        # Full system test (34 tests)
python iriv_scripts/daily_summary.py --now

# Git push on uni WiFi
git config --global http.sslVerify false
git push origin main
git config --global http.sslVerify true
```

---

## 📝 PSM2 Report — 100% COMPLETE ✅

All 6 chapters + diagrams + abstract + TOC + references + screenshots
**TODO:** Update Chapter 5 with V4 model results + IRIV deployment after hardware arrives

---

## 🚀 IRIV Deployment Checklist

```
1.  Flash Raspberry Pi OS
2.  Configure WiFi
3.  pip install fastapi uvicorn sqlalchemy pymysql pymodbus
        adafruit-ads1x15 python-telegram-bot opencv-python
        onnxruntime python-dotenv ultralytics schedule
4.  Copy project files via SCP
5.  Set up MySQL + run init.sql
6.  Copy .env with credentials
7.  Copy best_v4.onnx → ai_model/models/best.onnx  ← V4 not V3!
8.  Connect PIR sensor to GPIO 24
9.  Install cloudflared on IRIV (Linux)
10. Copy ~/.cloudflared/ credentials to IRIV
11. Start services:
    uvicorn backend.main:app --host 0.0.0.0 --port 8000
    cd dashboard && npm run build && npm start
    python iriv_scripts/sensor_collector.py
    python iriv_scripts/automation_controller.py
    python iriv_scripts/security_monitor.py
    python iriv_scripts/daily_summary.py
    cloudflared tunnel run fyp-oil-palm
12. Set up systemd for auto-start
13. Full end-to-end test
14. Verify https://app.project2030.me loads from phone
```

---

## ⚠️ Rules for Claude Code

1. Never use Node-RED — custom Next.js only
2. Never use Grafana — charts in Next.js
3. Backend is FastAPI only
4. IRIV uses ONNX — best_v4.onnx NOT best_v3.onnx NOT .pt
5. Database is MySQL NOT SQLite/PostgreSQL
6. RS485 port is /dev/ttyS0 on IRIV
7. ADS1115 I2C is 0x48
8. Import paths use backend. prefix
9. All __init__.py files are empty
10. MySQL password is fyp1234
11. Dashboard has its own .env.local
12. Supabase URL: https://zltdegjlrgdrustyqcro.supabase.co
13. Disease inference: conf=0.5, iou=0.45
14. Security inference: conf=0.25 (COCO model)
15. Disease classes: [healthy, ganoderma, unhealthy, immature]
16. IRIV scripts use ON_IRIV = sys.platform == 'linux'
17. PRODUCTION model is V4n — best_v4.pt / best_v4.onnx
18. Supabase RLS enabled — use service role key
19. Git push on uni WiFi: disable sslVerify, push, re-enable
20. npm run dev conflicts with Cloudflared — use build+start
21. Cloudflared: protocol: http2 in config.yml
22. Cloudflared tunnel: cloudflared tunnel run fyp-oil-palm
23. Domain: project2030.me — app.project2030.me / api.project2030.me
24. Tunnel ID: 26d38b6a-5222-40a0-a0a4-489fcbbfd610
25. NEXT_PUBLIC_API_URL=https://api.project2030.me in .env.local
26. proxy.ts export must be named proxy not middleware
27. Login fix: window.location.href = '/' not router.push
28. JWT users: admin/fyp2024, danesh/oilpalm2024
29. Security cooldown: 30 seconds
30. PIR GPIO pin: 24
31. OBS Virtual Camera: index 1 on dev laptop
32. Daily summary test: python iriv_scripts/daily_summary.py --now
33. captured_images/ is gitignored — do not commit images
34. yolov8m.pt and yolov8n.pt are gitignored — auto downloaded
35. Dashboard has 10 pages including login, snapshots, map
36. Snapshots use blob loading with JWT — not direct img src
37. WebSocket skips JWT via scope type check in main.py
38. API auth uses HTTP middleware not global Depends
39. PWA uses @ducanh2912/next-pwa package
40. Block map at /map — block_id format: Block-A, Block-B, Block-C
41. lib/api.ts auto-detects URL: localhost→8000, else→api.project2030.me
42. detect/page.tsx uses api.post() not fetch() for JWT auth
43. System test: python test_system.py → 34/34 tests
44. V4n training: workers=4 + if __name__==__main__ + batch=16
45. Windows training: multiprocessing.set_start_method("spawn") needed
46. Dataset v4: balanced_v2 + Mendeley Ganoderma COCO = 8,881 images
47. data_v4.yaml points to balanced_v4 dataset
48. best_v4.onnx is ~6MB — correct size for IRIV deployment
49. Demo deadline: 25 May 2026
50. IRIV arrives: ~12-13 May 2026