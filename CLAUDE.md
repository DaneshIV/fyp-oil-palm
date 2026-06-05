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
**Supervisor:** Dr. Mohd Kufaisal Bin Mohd Sidik

---

## 📅 Current Project Status

### ✅ Completed
- [x] Project folder structure + GitHub repo
- [x] Virtual environment (fyp_env) — Python 3.12
- [x] PyTorch + CUDA 12.1 (RTX 3060 Laptop confirmed working)
- [x] MySQL database (fyp_oil_palm) — 5 tables (sensors, disease, alerts, automation, cameras)
- [x] FastAPI backend — all endpoints working on port 8000
- [x] MySQL → Supabase auto sync every 60 seconds
- [x] Supabase RLS security enabled on all 4 tables
- [x] Next.js 16 dashboard — 10 pages complete with REAL API integration
  - [x] Login — real JWT auth with boot sequence animation
  - [x] Overview — live sensors, relay status, zone map, terminal log
  - [x] Sensors — real RS485 charts + danger/warning banners
  - [x] Disease AI — real detections + bar/pie charts
  - [x] AI Test — real YOLOv8 inference + annotated image with bboxes
  - [x] Security Monitor — YOLOv8n COCO live feed (NOT disease model) + event log
  - [x] Security Snapshots — annotated snapshots + BBOX filter + lightbox
  - [x] Automation — all 5 relays + real rules CRUD
  - [x] Reports — real sensor history + CSV export
  - [x] Block Map — isometric grid + camera-driven plant count + live feed
- [x] Sidebar redesigned — industrial style, grouped nav (MONITORING/ANALYSIS/SECURITY/FIELD/CONTROL/DATA)
- [x] Telegram bot — all alert types including security alerts with photo
- [x] Daily Telegram summary at midnight ✅
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
- [x] WebSocket real-time updates ✅
- [x] Disease Detection History Charts ✅ (bar + pie)
- [x] Sensor Safe Zone Alerts ✅ (danger/warning banners)
- [x] Camera System ✅
  - [x] cameras table in MySQL
  - [x] /cameras/ CRUD endpoints
  - [x] /cameras/{id}/frame — disease model (best_v4.pt) with bboxes
  - [x] /security/live-frame — COCO model (yolov8n.pt) with bboxes
  - [x] RTSP + webcam index both supported
  - [x] Isometric block map with click → live feed
- [x] Disease detect fixed — returns image_base64 with bboxes drawn ✅
- [x] Security live feed fixed — uses YOLOv8n COCO not disease model ✅
- [x] AI Model v1 — YOLOv8n (mAP50 59.1%)
- [x] AI Model v2 — YOLOv8s (mAP50 52.3%)
- [x] AI Model v3 — YOLOv8n (mAP50 71.5%)
- [x] AI Model v4m — YOLOv8m (mAP50 74.8%, crashed ep26)
- [x] AI Model v4n — YOLOv8n FINAL (mAP50 74.6%) ✅ PRODUCTION
- [x] V4n ONNX exported (best_v4.onnx ~6MB for IRIV)
- [x] Triple Layer Security System ✅
- [x] Full system test — 34/34 tests passed ✅
- [x] Git LFS for model weights
- [x] 3x backups — GitHub, D drive, Google Drive
- [x] Cloudflared tunnel — FULLY WORKING ✅
- [x] IRIV hardware RECEIVED ✅ (19 May 2026)
  - [x] RS485 sensors confirmed working (Air=Slave1, Soil=Slave5)
  - [x] All 5 relays confirmed working (GPIO + IOC Modbus TCP)
  - [x] sensor_collector.py running on IRIV → data → API → dashboard
  - [x] automation_controller.py running on IRIV
  - [x] IOC Modbus TCP confirmed working (10.0.0.10:502 slave=255)
- [x] PSM2 FYP Report — ALL 6 CHAPTERS COMPLETE ✅

### 🔲 Todo
- [ ] RTSP camera testing with real IP camera
- [ ] IRIV systemd auto-start for all scripts
- [ ] PSM2 report Chapter 5 update — real IRIV hardware results + screenshots
- [ ] Demo rehearsal

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
├── demo_data.py
├── live_sensors.py
├── add_alerts.py
├── add_diseases.py
├── add_block_data.py
├── test_sensors.py
├── test_system.py                 ← 34/34 pass
├── prepare_dataset_v4.py
├── export_v4n.py
│
├── ai_model/
│   ├── data_v4.yaml               ← balanced_v4 dataset ✅
│   ├── datasets/
│   │   └── balanced_v4/           ← 8,881 images (train/val/test)
│   ├── models/
│   │   ├── best_v3.pt             ← V3 71.5% mAP50
│   │   ├── best_v4.pt             ← V4n 74.6% ✅ PRODUCTION
│   │   └── best_v4.onnx           ← V4n ONNX ~6MB ✅ FOR IRIV
│   └── runs/oil_palm_v4n/         ← V4n training results
│
├── backend/
│   ├── main.py                    ← FastAPI port 8000 + HTTP auth middleware
│   ├── routes/
│   │   ├── sensors.py             ✅ + WebSocket /ws/sensors + /ws/alerts
│   │   ├── disease.py             ✅ /detect returns image_base64 + bboxes
│   │   ├── alerts.py              ✅
│   │   ├── automation.py          ✅
│   │   ├── security.py            ✅ + /live-frame (COCO model)
│   │   ├── auth.py                ✅
│   │   └── cameras.py             ✅ RTSP/webcam + disease model bboxes
│   └── database/
│       ├── connection.py          ✅
│       ├── init.sql               ✅ includes cameras table
│       └── supabase_sync.py       ✅
│
├── dashboard/                     ← Next.js 16 port 3000
│   ├── proxy.ts                   ← Route protection middleware
│   ├── next.config.ts             ← PWA + outputFileTracingRoot
│   ├── .env.local                 ← NEXT_PUBLIC_API_URL
│   ├── hooks/useWebSocket.ts      ← WebSocket hooks
│   ├── lib/api.ts                 ← axios + JWT + auto URL detection
│   ├── app/
│   │   ├── login/page.tsx         ✅ real JWT + boot animation
│   │   ├── page.tsx               ✅ real sensors + relays + zones + terminal
│   │   ├── sensors/page.tsx       ✅ real RS485 + charts + banners
│   │   ├── disease/page.tsx       ✅ real detections + bar/pie charts
│   │   ├── disease/detect/page.tsx ✅ real YOLOv8 + bbox image from backend
│   │   ├── security/page.tsx      ✅ COCO live feed (yolov8n.pt)
│   │   ├── security/snapshots/    ✅ real snapshots + BBOX filter
│   │   ├── automation/page.tsx    ✅ 5 relays + real rules CRUD
│   │   ├── reports/page.tsx       ✅ real history + CSV export
│   │   └── map/page.tsx           ✅ isometric + camera-driven + live feed
│   ├── public/manifest.json       ← PWA
│   └── components/ui/
│       └── Sidebar.tsx            ✅ industrial grouped nav
│
├── iriv_scripts/
│   ├── sensor_collector.py        ✅ RS485 Slave1+5 → API
│   ├── automation_controller.py   ✅ GPIO + IOC Modbus TCP
│   ├── security_monitor.py        ✅ Triple Layer Security
│   ├── telegram_bot.py            ✅
│   ├── daily_summary.py           ✅
│   └── inference_runner.py        ✅
│
└── docs/architecture_diagram.html ✅
```

---

## 🔧 IRIV Hardware — CONFIRMED Configuration

### Device IPs
```
IPC (PiControl) eth0:  10.0.0.3
IPC (PiControl) wlan0: 172.20.10.2 (hotspot) ← use this for SSH
IOC:                   10.0.0.10 (ethernet static)
SSH:                   ssh pi@172.20.10.2 (password: raspberry)
```

### RS485 Sensors — CONFIRMED BY PHYSICAL TEST
```
Port:     /dev/ttyACM0  ← NOT /dev/ttyS0
Baudrate: 9600, 8N1
Protocol: Modbus RTU

Slave 1 = AIR sensor (temperature + humidity):
  Register 0 → Humidity    ÷10 = %
  Register 1 → Temperature ÷10 = °C

Slave 5 = SOIL sensor (3-in-1):
  Register 0 → Moisture    ÷10 = %
  Register 1 → Temperature ÷10 = °C
  Register 2 → EC          raw uS/cm → ÷1000 = mS/cm
```

### GPIO Pins — CONFIRMED BY PHYSICAL TEST
```
GPIO 24 → Relay 1 → AC Socket 1 → Water Pump (AC)
GPIO 25 → Relay 2 → AC Socket 2 → Mist Pump (AC)
GPIO 13 → Button INPUT (Normally Open)
GPIO 23 → Button LED OUTPUT

NOT: 17, 27, 22, 23 (old incorrect values)
```

### IOC Modbus TCP — CONFIRMED WORKING
```
IP:    10.0.0.10
Port:  502
Slave: 255 (0xFF)

Coil addresses:
  DO0 = 0x0100 (256) → Relay 3 → DC HE21 → NPK-A Pump
  DO1 = 0x0101 (257) → Relay 4 → DC HE21 → NPK-B Pump
  DO2 = 0x0102 (258) → Relay 5 → DC HE21 → NPK-C Pump

Python:
  from pymodbus.client import ModbusTcpClient
  client = ModbusTcpClient('10.0.0.10', port=502, timeout=5)
  client.connect()
  client.write_coil(0x0100, True, slave=255)  # Relay 3 ON
  client.write_coil(0x0100, False, slave=255) # Relay 3 OFF
```

### IOC Firmware — CircuitPython
```
USB-C mounts as /dev/sda1 (CIRCUITPY filesystem)
Mount: sudo mount /dev/sda1 /mnt/ioc
Config: /mnt/ioc/settings.toml

settings.toml must contain:
  MODBUS_MODE = "TCP"
  DHCP = ""
  IP_ADDRESS = "10.0.0.10"
  SUBNET_MASK = "255.255.255.0"
  GATEWAY_ADDRESS = "10.0.0.3"
  DNS_SERVER = "10.0.0.3"

Main firmware: /mnt/ioc/lib/iriv_ioc_modbus.py (Cytron official)
HAL:           /mnt/ioc/lib/iriv_ioc_hal.py
Entry point:   /mnt/ioc/code.py (imports iriv_ioc_modbus)
```

### All 5 Relays — CONFIRMED WORKING
```
Relay 1 (GPIO 24)  → AC Socket 1  → Water Pump (AC 240V)
Relay 2 (GPIO 25)  → AC Socket 2  → Mist Pump (AC 240V)
Relay 3 (0x0100)   → DC HE21 Port → Peristaltic Pump A (24V DC)
Relay 4 (0x0101)   → DC HE21 Port → Peristaltic Pump B (24V DC)
Relay 5 (0x0102)   → DC HE21 Port → Peristaltic Pump C (24V DC)
```

### Architecture Decision
```
Windows Laptop: FastAPI + MySQL + Next.js + Cloudflared
IRIV (field):   iriv_scripts only → POST data to tunnel API
  sensor_collector.py  → POST https://api.project2030.me/sensors/
  automation_controller.py → reads rules from API, controls relays
  security_monitor.py  → camera + motion → POST to API
```

---

## 🌐 Cloudflared Tunnel — LIVE ✅

```
Tunnel:    fyp-oil-palm
ID:        26d38b6a-5222-40a0-a0a4-489fcbbfd610
Dashboard: https://app.project2030.me
API:       https://api.project2030.me
Protocol:  http2 (university WiFi fix)
Config:    C:\Users\danes\.cloudflared\config.yml
Run:       cloudflared tunnel run fyp-oil-palm
Note:      Use npm run build && npm start (NOT npm run dev)
```

---

## 🔐 JWT Authentication

```
Login:      /login
Users:      admin/fyp2024  |  danesh/oilpalm2024
Token:      Cookie auth_token (24h)
Middleware: dashboard/proxy.ts — export function proxy()
Logout:     Sidebar button → clears cookies → /login
Fix:        window.location.href = '/' (NOT router.push)
Public:     /health, /, /auth/login, /docs, /openapi.json, /redoc
WebSocket:  skips JWT via scope type check in main.py
```

---

## 📷 Camera System

```
cameras MySQL table:
  id, name, block_id, rtsp_url, location,
  is_active, plant_count, last_frame, created_at

Endpoints:
  GET  /cameras/              → list cameras
  POST /cameras/              → add camera (creates block)
  PATCH /cameras/{id}         → update (rtsp_url etc)
  DELETE /cameras/{id}        → remove camera + block
  GET  /cameras/{id}/frame    → disease model frame (best_v4.pt)
  GET  /cameras/{id}/detections → JSON detections
  GET  /cameras/blocks/summary  → block map data

  GET  /security/live-frame?camera_index=N
    → COCO model (yolov8n.pt) — person/animal detection
    → Supports: "0","1","2" (webcam) OR "rtsp://..." URL
    → Returns: JPEG + X-Threat-Type + X-Detection-Count headers

RTSP support: pass full URL as camera_index string
  e.g. rtsp://admin:pass@192.168.1.100:554/stream
```

---

## 🤖 AI Models

| Model | Arch | Dataset | Images | mAP50 | Status |
|---|---|---|---|---|---|
| V1 | YOLOv8n | 3 datasets | 5,725 | 59.1% | Baseline |
| V2 | YOLOv8s | 3 datasets | 5,725 | 52.3% | Test |
| V3 | YOLOv8n | 10 datasets | 7,748 | 71.5% | Previous |
| V4m | YOLOv8m | 11 datasets | 8,881 | 74.8% | Crashed OOM |
| V4n | YOLOv8n | 11 datasets | 8,881 | **74.6%** | ✅ PRODUCTION |

```
Disease model:  best_v4.pt / best_v4.onnx (~6MB)
  conf=0.5, iou=0.45
  classes: [healthy, ganoderma, unhealthy, immature]
  /disease/detect returns image_base64 with bboxes drawn

Security model: yolov8n.pt (COCO pretrained, auto-downloaded)
  conf=0.25
  detects: person (HIGH) + animals (MEDIUM) only
  /security/live-frame returns JPEG with COCO bboxes
```

---

## ⚡ Backend — FastAPI

```
Port:  8000
URL:   https://api.project2030.me
DB:    MySQL 8.0 — fyp_oil_palm (root/fyp1234/localhost:3306)
Docs:  https://api.project2030.me/docs

Key updated endpoints:
  POST /disease/detect    → returns {detections, image_base64, best_detection}
  GET  /security/live-frame?camera_index=N → COCO annotated JPEG
  GET  /cameras/blocks/summary → isometric map data
  POST /cameras/          → add camera → creates block
```

---

## 🖥️ Dashboard — Next.js 16

```
Port:   3000
URL:    https://app.project2030.me
Pages:  10 (all real API, no mock data)

lib/api.ts:
  localhost:3000 → http://localhost:8000
  app.project2030.me → https://api.project2030.me

Sidebar groups:
  MONITORING: Overview, Sensor Matrix
  ANALYSIS:   Disease AI, AI Detection
  SECURITY:   Security Monitor, Snapshots
  FIELD:      Block Map
  CONTROL:    Relay Control
  DATA:       Reports
```

---

## 🛡️ Triple Layer Security

```
Layer 1: Software-based motion detection via dashboard ARM control, replacing the planned PIR sensor due to hardware availability
Layer 2: Camera snapshot
Layer 3: YOLOv8n COCO — person/animal classification

Security page uses: /security/live-frame (COCO model)
Block map uses:     /cameras/{id}/frame (disease model)
These are DIFFERENT endpoints with DIFFERENT models!

Snapshots saved: captured_images/security/ (gitignored)
Annotated files: security_*_annotated.jpg (with bboxes)
```

---

## 📅 Daily Telegram Summary

```
Test: python iriv_scripts/daily_summary.py --now
Auto: midnight (schedule library)
```

---

## 🛠️ Local Dev

```powershell
cd C:\Users\danes\fyp-oil-palm
fyp_env\Scripts\activate
.\start_fyp.ps1

# Demo scripts
python demo_data.py
python live_sensors.py
python add_block_data.py
python test_system.py        # 34/34 tests

# Git push on uni WiFi
git config --global http.sslVerify false
git push origin main
git config --global http.sslVerify true
```

---

## 🚀 IRIV Setup (Already Done)

```
✅ SSH: pi@172.20.10.2 (password: raspberry)
✅ RS485 sensors reading via /dev/ttyACM0
✅ All 5 relays working
✅ IOC Modbus TCP at 10.0.0.10:502
✅ sensor_collector.py → /home/pi/sensor_collector.py
✅ automation_controller.py → /home/pi/automation_controller.py
✅ pip3 install pymodbus requests

Pending:
⬜ systemd auto-start
⬜ RTSP camera connection
⬜ security_monitor.py on IRIV
```

---

## ⚠️ Rules for Claude Code

1. Never use Node-RED — custom Next.js only
2. Never use Grafana — charts in Next.js
3. Backend is FastAPI only
4. IRIV uses ONNX — best_v4.onnx NOT .pt
5. Database is MySQL NOT SQLite/PostgreSQL
6. RS485 port on IRIV: /dev/ttyACM0 (NOT /dev/ttyS0)
7. ADS1115 I2C is 0x48
8. Import paths use backend. prefix
9. All __init__.py files are empty
10. MySQL password is fyp1234
11. Dashboard has its own .env.local
12. Supabase URL: https://zltdegjlrgdrustyqcro.supabase.co
13. Disease inference: conf=0.5, iou=0.45
14. Security inference: conf=0.25 (COCO yolov8n.pt)
15. Disease classes: [healthy, ganoderma, unhealthy, immature]
16. IRIV scripts use ON_IRIV = sys.platform == 'linux'
17. PRODUCTION model: best_v4.pt / best_v4.onnx
18. Supabase RLS enabled — use service role key
19. Git push on uni WiFi: disable sslVerify, push, re-enable
20. npm run dev conflicts with Cloudflared — use build+start
21. Cloudflared: protocol: http2 in config.yml
22. Domain: project2030.me — app.project2030.me / api.project2030.me
23. Tunnel ID: 26d38b6a-5222-40a0-a0a4-489fcbbfd610
24. NEXT_PUBLIC_API_URL=https://api.project2030.me in .env.local
25. proxy.ts export must be named proxy not middleware
26. Login fix: window.location.href = '/' not router.push
27. JWT users: admin/fyp2024, danesh/oilpalm2024
28. Security cooldown: 30 seconds
29. PIR GPIO: 24 (confirmed) — NOT 17/27/22/23
30. Relay GPIO: 24=Relay1, 25=Relay2 (confirmed)
31. IOC Modbus: slave=255, coils 0x0100/0x0101/0x0102
32. Air sensor: Slave 1, reg0=humidity, reg1=temp
33. Soil sensor: Slave 5, reg0=moisture, reg1=temp, reg2=EC
34. captured_images/ gitignored — never commit images
35. yolov8m.pt and yolov8n.pt gitignored — auto downloaded
36. /security/live-frame uses COCO model (person/animal)
37. /cameras/{id}/frame uses disease model (best_v4.pt)
38. /disease/detect returns image_base64 with bboxes drawn
39. camera rtsp_url supports int string ("0") OR "rtsp://..."
40. IOC settings.toml must have MODBUS_MODE=TCP + static IP
41. IOC USB-C mounts as /dev/sda1 on IPC
42. Mount IOC: sudo mount /dev/sda1 /mnt/ioc
43. All 10 dashboard pages have real API (no mock data)
44. Sidebar nav groups: MONITORING/ANALYSIS/SECURITY/FIELD/CONTROL/DATA
45. cameras table: id, name, block_id, rtsp_url, location, is_active, plant_count
46. Block map: add camera → creates block → click block → live feed
47. OBS Virtual Camera index changes — scan with cv2 to find current index
48. Windows camera exclusive access — only one process at a time
49. Security page camera ≠ block map camera (use different indices)
50. Demo: laptop runs API, IRIV runs scripts → POSTs to tunnel