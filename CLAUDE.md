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
  - [x] Disease AI — detection history, charts, confidence bars, disease info
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
  - [x] HTTP middleware in main.py
  - [x] Public routes: /health, /, /auth/login, /docs
  - [x] All other endpoints require Bearer token
  - [x] WebSocket connections skip JWT check
- [x] PWA — Progressive Web App ✅
  - [x] Installable on Android + iOS
  - [x] manifest.json + icons generated
  - [x] @ducanh2912/next-pwa package
- [x] WebSocket real-time updates ✅
  - [x] /sensors/ws/sensors — pushes data every 3s
  - [x] /sensors/ws/alerts — pushes alert count every 5s
  - [x] WS Live badge on Overview page
  - [x] Works via Cloudflare tunnel with originRequest config
  - [x] Falls back to polling when WS unavailable
- [x] AI Model v1 — YOLOv8n (mAP50 59.1% standardised)
- [x] AI Model v2 — YOLOv8s comparison (mAP50 52.3% standardised)
- [x] AI Model v3 — YOLOv8n FINAL (mAP50 71.5% standardised) ✅
- [x] All 3 models evaluated on same test set
- [x] Evaluation charts + confusion matrix generated
- [x] V3 ONNX exported (best_v3.onnx)
- [x] Triple Layer Security System ✅
  - [x] Layer 1 — PIR sensor / software motion detection
  - [x] Layer 2 — Camera snapshot capture
  - [x] Layer 3 — YOLOv8n COCO AI threat classification
  - [x] Telegram alerts with photo + 30s cooldown
  - [x] Security event log in dashboard
  - [x] Security snapshots gallery page ✅
- [x] Disease Detection History Chart ✅
  - [x] Bar chart — last 7 days stacked healthy/diseased
  - [x] Pie chart — class breakdown
- [x] Sensor Safe Zone Alerts ✅
  - [x] Red danger banner when sensor in danger zone
  - [x] Yellow warning banner when sensor in warning zone
- [x] Block/Tree Map View ✅
  - [x] Visual grid of trees per block
  - [x] Color coded by severity
  - [x] Click tree for details panel
  - [x] Block-A, Block-B, Block-C support
- [x] Git LFS for model weights
- [x] 3x backups — GitHub, D drive, Google Drive
- [x] Cloudflared tunnel — FULLY WORKING ✅
  - [x] Named tunnel: fyp-oil-palm
  - [x] Dashboard: https://app.project2030.me
  - [x] API: https://api.project2030.me
  - [x] Domain: project2030.me (Namecheap → Cloudflare)
  - [x] WebSocket via tunnel — originRequest config
- [x] IRIV hardware scripts — all 6 complete + tested in simulation
- [x] PSM2 FYP Report — ALL 6 CHAPTERS COMPLETE ✅
  - [x] Chapter 1 — Introduction
  - [x] Chapter 2 — Literature Review
  - [x] Chapter 3 — Methodology
  - [x] Chapter 4 — Requirement Analysis & Design
  - [x] Chapter 5 — Implementation & Testing
  - [x] Chapter 6 — Conclusion
  - [x] All diagrams — Use Case, Sequence, Activity, Architecture, Class, ERD
  - [x] Abstract, TOC, List of Figures, List of Tables, References
  - [x] MySQL + Supabase screenshots for Section 4.4

### 🔲 Todo
- [ ] Annotate Kaggle images in Label Studio → retrain v4
- [ ] IRIV hardware arrives → deploy + test
- [ ] Full end-to-end field test

---

## 🗂️ Project Structure

```
fyp-oil-palm/
├── CLAUDE.md
├── README.md
├── pyrightconfig.json             ← Suppress Pylance RPi/hardware warnings
├── .gitignore                     ← captured_images/ excluded
├── .env                           ← Never commit!
├── start_fyp.ps1                  ← Start all services + Cloudflared
├── demo_data.py                   ← Insert demo sensor data
├── live_sensors.py                ← Continuous live sensor updates
├── add_alerts.py                  ← Insert demo alerts
├── add_diseases.py                ← Insert demo disease detections
├── add_block_data.py              ← Insert Block-A/B/C demo tree data
├── test_sensors.py                ← Test sensor danger/warning values
│
├── ai_model/
│   ├── data.yaml                  ← Points to balanced (v1 datasets)
│   ├── data_v2.yaml               ← Points to balanced_v2 (v2 datasets) ✅
│   ├── datasets/
│   │   ├── roboflow/              ← Original 3 datasets (v1)
│   │   ├── roboflow_v2/           ← New 10 datasets (v2)
│   │   ├── combined_v2/           ← Merged v2 (6,612 images)
│   │   └── balanced_v2/           ← Balanced v2 — used for v3 training
│   │       ├── train/ — healthy:4337, ganoderma:1803, unhealthy:2180, immature:1918
│   │       ├── val/   — healthy:1031, ganoderma:306, unhealthy:464, immature:430
│   │       └── test/  — healthy:535, ganoderma:167, unhealthy:239, immature:240
│   ├── models/
│   │   ├── best.pt                ← YOLOv8n v1
│   │   ├── best_v2_yolov8s.pt     ← YOLOv8s comparison
│   │   ├── best_v3.pt             ← YOLOv8n v3 FINAL ✅ PRODUCTION
│   │   └── best_v3.onnx           ← ONNX for IRIV ✅
│   ├── runs/
│   │   └── evaluation/            ← Confusion matrix + charts ✅
│   └── training/
│       ├── train.py
│       ├── prepare_dataset.py
│       ├── balance_dataset_v2.py
│       ├── download_datasets.py
│       └── evaluate.py            ← Evaluates all 3 models
│
├── backend/
│   ├── main.py                    ← FastAPI port 8000 + HTTP auth middleware
│   ├── routes/
│   │   ├── sensors.py             ✅ + WebSocket /ws/sensors + /ws/alerts
│   │   ├── disease.py             ✅ /detect endpoint
│   │   ├── alerts.py              ✅
│   │   ├── automation.py          ✅
│   │   ├── security.py            ✅ Triple Layer + snapshots endpoints
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
│   │   └── useWebSocket.ts        ← WebSocket hooks for sensors + alerts
│   ├── lib/
│   │   └── api.ts                 ← axios instance with JWT interceptors
│   ├── app/
│   │   ├── login/page.tsx         ✅ JWT login page
│   │   ├── page.tsx               ✅ Overview + WS Live badge
│   │   ├── sensors/page.tsx       ✅ + danger/warning banner
│   │   ├── disease/page.tsx       ✅ + history chart + pie chart
│   │   ├── disease/detect/page.tsx ✅ Live webcam detection
│   │   ├── security/page.tsx      ✅ Triple Layer Security Monitor
│   │   ├── security/snapshots/page.tsx ✅ Blob auth image loading
│   │   ├── automation/page.tsx    ✅
│   │   ├── reports/page.tsx       ✅
│   │   └── map/page.tsx           ✅ Plantation Block Map
│   ├── public/
│   │   ├── manifest.json          ← PWA manifest
│   │   └── icons/                 ← PWA icons 72-512px
│   └── components/ui/
│       ├── Sidebar.tsx            ✅ 10 nav items + logout button
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
| Credentials | C:\Users\danes\.cloudflared\26d38b6a-5222-40a0-a0a4-489fcbbfd610.json |

**Config file:**
```yaml
tunnel: 26d38b6a-5222-40a0-a0a4-489fcbbfd610
credentials-file: C:\Users\danes\.cloudflared\26d38b6a-5222-40a0-a0a4-489fcbbfd610.json

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

**Run tunnel:** `cloudflared tunnel run fyp-oil-palm`
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
Backend:        backend/routes/auth.py
API Auth:       HTTP middleware in main.py (not global dependency)
Public routes:  /health, /, /auth/login, /docs, /openapi.json, /redoc
WebSocket:      Skips JWT check automatically (scope type check)
```

---

## 📅 Daily Telegram Summary

```
Script:   iriv_scripts/daily_summary.py
Schedule: Every day at midnight (00:00)
Test:     python iriv_scripts/daily_summary.py --now
Contents: Sensor averages, disease counts, alerts, relay activations
Status:   ALL GOOD / MONITOR CLOSELY / NEEDS ATTENTION
Library:  pip install schedule
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
Download:  Blob approach with JWT token
```

---

## 🗺️ Block/Tree Map

```
Page:       /map
Data:       disease_detections table (block_id + tree_id fields)
Colors:     Green=None, Blue=Low, Yellow=Medium, Red=High severity
Blocks:     Block-A, Block-B, Block-C (auto/test go to Other section)
Click:      Tree square → shows details panel on right
RTSP use:   Camera 1 → Block-A, Camera 2 → Block-B
Demo data:  python add_block_data.py
```

---

## 📊 Disease Charts

```
Bar chart:  Last 7 days — stacked healthy vs diseased per day
Pie chart:  Class breakdown — healthy/ganoderma/unhealthy/immature
Location:   /disease page — above detection list
Updates:    Every 10 seconds
Library:    Recharts (BarChart + PieChart)
```

---

## ⚡ Sensor Safe Zone Alerts

```
Location:   /sensors page — between header and sensor cards
Danger:     Red banner — any sensor exceeds danger threshold
Warning:    Yellow banner — any sensor exceeds warning threshold
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
Icons:      dashboard/public/icons/ (72px to 512px)
Install:    Android — Chrome menu → Add to Home Screen
            iOS — Safari Share → Add to Home Screen
Theme:      #22c55e (green)
Background: #030712 (dark)
```

---

## 🔌 WebSocket

```
Endpoints:
  ws://localhost:8000/sensors/ws/sensors  ← sensor data every 3s
  ws://localhost:8000/sensors/ws/alerts   ← alert count every 5s

Hook:       dashboard/hooks/useWebSocket.ts
Badge:      WS Live (green pulsing) on Overview page
Tunnel:     wss://api.project2030.me (works via Cloudflare)
Fallback:   Polling every 5s when WS unavailable
Auth:       WebSocket skips JWT (scope type check in main.py)
```

---

## 🤖 AI Model — FINAL RESULTS

```
Production:  best_v3.pt / best_v3.onnx (YOLOv8n, 71.5% mAP50)
Security:    yolov8n.pt (pretrained COCO, auto downloaded)
Classes:     [healthy, ganoderma, unhealthy, immature]
Inference:   conf=0.5, iou=0.45 (disease) | conf=0.25 (security)
```

| Model | Architecture | Images | mAP50 | Status |
|---|---|---|---|---|
| V1 | YOLOv8n | 5,725 | 59.1% | Baseline |
| V2 | YOLOv8s | 5,725 | 52.3% | Architecture test |
| V3 | YOLOv8n | 7,748 | **71.5%** | ✅ PRODUCTION |

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
WS   /sensors/ws/sensors          ← WebSocket live sensor push
WS   /sensors/ws/alerts           ← WebSocket live alert count
GET  /disease/history?limit=20
GET  /disease/latest
POST /disease/
POST /disease/detect              ← YOLOv8 disease inference
GET  /alerts/
GET  /alerts/count
POST /alerts/{id}/acknowledge
POST /alerts/acknowledge-all
GET  /automation/rules
POST /automation/rules
PATCH /automation/rules/{id}/toggle
DELETE /automation/rules/{id}
POST /automation/relay
POST /security/detect             ← YOLOv8n COCO security inference
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
GET  /                            ← PUBLIC
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

**All 10 pages:**
```
/login               → JWT login
/                    → Overview + WS Live badge
/sensors             → Charts + danger/warning banner
/disease             → Detection history + bar/pie charts
/disease/detect      → Live webcam + upload detection
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
Alerts:   sensor, disease, relay, security + photo
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

## 💾 Backups

| Location | Status |
|---|---|
| GitHub | ✅ Code + model weights (Git LFS) |
| D: drive | ✅ Full project |
| Google Drive | ✅ Full project |

---

## 🛠️ Local Dev

```powershell
cd C:\Users\danes\fyp-oil-palm
fyp_env\Scripts\activate
.\start_fyp.ps1

# Local:  http://localhost:3000
# Remote: https://app.project2030.me
# Docs:   https://api.project2030.me/docs

# Demo scripts
python demo_data.py          # sensor data
python live_sensors.py       # continuous live sensors
python add_alerts.py         # demo alerts
python add_diseases.py       # demo disease detections
python add_block_data.py     # Block-A/B/C tree data
python test_sensors.py       # test danger/warning banners
python iriv_scripts/daily_summary.py --now  # test Telegram summary

# Git push on uni WiFi
git config --global http.sslVerify false
git push origin main
git config --global http.sslVerify true
```

---

## 📝 PSM2 Report — 100% COMPLETE ✅

All 6 chapters + diagrams + abstract + TOC + references + MySQL/Supabase screenshots

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
7.  Copy best_v3.onnx → ai_model/models/best.onnx
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
4. IRIV uses ONNX — best_v3.onnx NOT .pt
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
17. PRODUCTION model is V3 — best_v3.pt / best_v3.onnx
18. Supabase RLS enabled — use service role key
19. Git push on uni WiFi: disable sslVerify, push, re-enable
20. npm run dev conflicts with Cloudflared — use build+start
21. Cloudflared tunnel: cloudflared tunnel run fyp-oil-palm
22. Domain: project2030.me — app.project2030.me / api.project2030.me
23. Tunnel ID: 26d38b6a-5222-40a0-a0a4-489fcbbfd610
24. NEXT_PUBLIC_API_URL=https://api.project2030.me for production
25. proxy.ts export must be named proxy not middleware
26. Login fix: window.location.href = '/' not router.push
27. JWT users: admin/fyp2024, danesh/oilpalm2024
28. Security cooldown: 30 seconds
29. PIR GPIO pin: 24
30. OBS Virtual Camera: index 1 on dev laptop
31. Daily summary test: python iriv_scripts/daily_summary.py --now
32. captured_images/ is gitignored — do not commit images
33. Dashboard has 10 pages including login, snapshots, map
34. Snapshots use blob loading with JWT — not direct img src
35. WebSocket skips JWT via scope type check in main.py
36. API auth uses HTTP middleware not global Depends
37. PWA uses @ducanh2912/next-pwa package
38. Block map at /map — block_id format: Block-A, Block-B, Block-C
39. RTSP Camera 1 = Block-A, Camera 2 = Block-B convention
40. lib/api.ts exports api (axios with JWT interceptors)
41. Security snapshots images need blob fetch — use api.get(url, {responseType: blob})
42. PSM2 report 100% complete