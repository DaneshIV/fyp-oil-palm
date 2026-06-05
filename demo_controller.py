"""
demo_controller.py — Interactive FYP Demo Controller
Run: python demo_controller.py

Controls:
  Menu-driven — pick any scenario anytime
  Sensor data posted from laptop (IRIV sensor_collector NOT running)
  Automation controller running on IRIV (fires real relays)
"""

import requests
import time
import sys
import os

API_URL    = "https://api.project2030.me"
TOKEN_USER = "admin"
TOKEN_PASS = "fyp2024"

# ── Helpers ───────────────────────────────────────────────────

def get_token():
    try:
        r = requests.post(f"{API_URL}/auth/login",
            json={"username": TOKEN_USER, "password": TOKEN_PASS}, timeout=10)
        return r.json().get("access_token")
    except Exception as e:
        print(f"Token error: {e}")
        return None

def post_sensor(token, temp, humidity, soil, soil_temp, ec, silent=False):
    try:
        r = requests.post(f"{API_URL}/sensors/",
            json={"temperature": temp, "humidity": humidity,
                  "soil_moisture": soil, "soil_temperature": soil_temp,
                  "ec_level": ec},
            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        if not silent:
            print(f"  📡 Sensor → temp={temp}°C  hum={humidity}%  soil={soil}%  ec={ec}mS/cm  [{r.status_code}]")
        return r.status_code == 200
    except Exception as e:
        print(f"  Error: {e}")
        return False

def post_disease(token, label, confidence, severity, tree_id, block_id):
    try:
        r = requests.post(f"{API_URL}/disease/",
            json={"image_path": f"demo/{label}_{tree_id}.jpg",
                  "disease_label": label, "confidence": confidence,
                  "severity": severity, "tree_id": tree_id,
                  "block_id": block_id},
            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        sev_icon = "🔴" if severity == "High" else "🟡" if severity == "Medium" else "🟢"
        print(f"  {sev_icon} Disease → {label} {confidence}% {severity} on {tree_id} [{r.status_code}]")
    except Exception as e:
        print(f"  Error: {e}")

def post_security_alert(token, alert_type, message, value):
    try:
        r = requests.post(f"{API_URL}/alerts/",
            json={"alert_type": alert_type, "message": message,
                  "sensor_value": value, "threshold": 25.0},
            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        print(f"  🛡️  Security → {alert_type} [{r.status_code}]")
    except Exception as e:
        print(f"  Error: {e}")

def clear():
    os.system('cls' if os.name == 'nt' else 'clear')

def header():
    print("=" * 60)
    print("  🌴 FYP OIL PALM IoT — DEMO CONTROLLER")
    print("  IRIV AgriBox v2 // YOLOv8n v4 74.6% mAP50")
    print("=" * 60)

def divider(title):
    print(f"\n── {title} {'─' * (50 - len(title))}")

def wait(msg="Press Enter to continue..."):
    input(f"\n  {msg}")

# ── Scenarios ─────────────────────────────────────────────────

def run_normal(token):
    divider("RESET → Normal Healthy Conditions")
    print("  Posting normal sensor readings...")
    post_sensor(token, 29.5, 72.0, 55.0, 28.0, 1.4)
    post_sensor(token, 29.5, 72.0, 55.0, 28.0, 1.4)
    post_sensor(token, 29.5, 72.0, 55.0, 28.0, 1.4)
    post_disease(token, "healthy", 95.2, "None", "T-001", "BLK_A")
    post_disease(token, "healthy", 91.0, "None", "T-002", "BLK_A")
    print("\n  ✅ Dashboard should show: all NOMINAL, no alerts")

def run_soil_alert(token):
    divider("SOIL MOISTURE ALERT — Irrigation Needed")
    steps = [
        (55.0, "✅ Normal"),
        (50.0, "✅ Normal"),
        (42.0, "✅ Normal"),
        (35.0, "⚠️  WARNING"),
        (28.0, "⚠️  WARNING"),
        (22.0, "🚨 CRITICAL"),
    ]
    print("  Soil moisture dropping... watch dashboard!\n")
    for soil, status in steps:
        post_sensor(token, 29.5, 72.0, soil, 28.0, 1.4)
        print(f"         Soil: {soil}%  {status}")
        time.sleep(1.5)
    print("\n  ✅ Drip Irrigation rule should trigger on IRIV!")

def run_temp_alert(token):
    divider("TEMPERATURE ALERT — Mist Cooling Needed")
    steps = [
        (29.5, "✅ Normal"),
        (31.0, "✅ Normal"),
        (33.0, "⚠️  WARNING"),
        (35.5, "🚨 CRITICAL"),
        (37.0, "🚨 CRITICAL"),
        (38.5, "🚨 CRITICAL"),
    ]
    print("  Temperature rising... watch dashboard!\n")
    for temp, status in steps:
        post_sensor(token, temp, 68.0, 45.0, temp-1, 1.4)
        print(f"         Temp: {temp}°C  {status}")
        time.sleep(1.5)
    print("\n  ✅ Mist Cooling rule should trigger on IRIV!")

def run_ec_alert(token):
    divider("EC LEVEL ALERT — Fertilizer Needed")
    steps = [
        (1.6, "✅ Normal"),
        (1.3, "✅ Normal"),
        (1.1, "⚠️  WARNING"),
        (0.8, "🚨 CRITICAL"),
        (0.5, "🚨 CRITICAL"),
        (0.17,"🚨 CRITICAL"),
    ]
    print("  EC level dropping... watch dashboard!\n")
    for ec, status in steps:
        post_sensor(token, 30.0, 70.0, 45.0, 28.0, ec)
        print(f"         EC: {ec} mS/cm  {status}")
        time.sleep(1.5)
    print("\n  ✅ Fertilizer Pump rule should trigger on IRIV!")

def run_all_sensors(token):
    divider("ALL SENSOR ALERTS — Full Demo")
    run_soil_alert(token)
    time.sleep(2)
    run_temp_alert(token)
    time.sleep(2)
    run_ec_alert(token)

def run_relay_demo(token):
    divider("RELAY AUTOMATION — All 3 Rules Trigger")
    print("  Posting values that breach ALL thresholds...")
    print("  → soil=22% (< 40) → Relay 1 ON")
    print("  → temp=37°C (> 35) → Relay 2 ON")
    print("  → ec=0.17 (< 1.2) → Relay 3 ON\n")
    post_sensor(token, 37.0, 65.0, 22.0, 35.0, 0.17)
    time.sleep(2)
    post_sensor(token, 37.0, 65.0, 22.0, 35.0, 0.17)
    time.sleep(2)
    post_sensor(token, 37.0, 65.0, 22.0, 35.0, 0.17)
    print("\n  ✅ Check Relay Control page:")
    print("     Relay 1 → ENGAGED (Water Pump)")
    print("     Relay 2 → ENGAGED (Mist Pump)")
    print("     Relay 3 → ENGAGED (NPK-A Pump)")

def run_disease_healthy(token):
    divider("DISEASE DETECTION — All Healthy")
    trees = [
        ("healthy",  94.5, "None",   "T-001"),
        ("healthy",  91.2, "None",   "T-002"),
        ("healthy",  88.7, "None",   "T-003"),
        ("immature", 85.0, "Low",    "T-004"),
    ]
    print("  Posting healthy detections...\n")
    for label, conf, sev, tree in trees:
        post_disease(token, label, conf, sev, tree, "BLK_A")
        time.sleep(0.5)
    print("\n  ✅ Disease AI page should show mostly healthy")

def run_disease_warning(token):
    divider("DISEASE DETECTION — Early Warning")
    trees = [
        ("unhealthy", 76.3, "Medium", "T-005"),
        ("unhealthy", 82.1, "Medium", "T-006"),
        ("unhealthy", 79.5, "Medium", "T-007"),
    ]
    print("  Posting unhealthy detections...\n")
    for label, conf, sev, tree in trees:
        post_disease(token, label, conf, sev, tree, "BLK_A")
        time.sleep(0.5)
    print("\n  ⚠️  Disease AI page should show MEDIUM severity warnings")

def run_disease_critical(token):
    divider("DISEASE DETECTION — GANODERMA DETECTED!")
    trees = [
        ("ganoderma", 91.7, "High", "T-008"),
        ("ganoderma", 87.5, "High", "T-009"),
        ("ganoderma", 94.2, "High", "T-010"),
    ]
    print("  Posting Ganoderma detections...\n")
    for label, conf, sev, tree in trees:
        post_disease(token, label, conf, sev, tree, "BLK_A")
        time.sleep(0.5)
    print("\n  🔴 Disease AI page should show HIGH severity GANODERMA")
    print("     Telegram alert should fire!")

def run_security_demo(token):
    divider("SECURITY ALERTS — Triple Layer Security")
    print("  [1] Unknown motion...")
    post_security_alert(token, "security_unknown",
        "Security Alert: UNKNOWN detected (45.2% confidence)", 45.2)
    time.sleep(2)
    print("  [2] Animal detected...")
    post_security_alert(token, "security_animal",
        "Security Alert: ANIMAL detected (78.3% confidence) — dog", 78.3)
    time.sleep(2)
    print("  [3] PERSON DETECTED — HIGH ALERT!")
    post_security_alert(token, "security_person",
        "Security Alert: PERSON detected (92.1% confidence) — INTRUDER", 92.1)
    print("\n  🚨 Security Monitor page should show events in log")

def run_live_normal(token):
    divider("LIVE NORMAL — Continuous Normal Readings")
    print("  Sending normal readings every 5s (Press Ctrl+C to stop)\n")
    try:
        i = 0
        while True:
            i += 1
            temp = 29.5 + (i % 3) * 0.1
            hum  = 72.0 + (i % 5) * 0.2
            post_sensor(token, round(temp,1), round(hum,1), 55.0, 28.0, 1.4, silent=True)
            print(f"  📡 [{i}] temp={temp:.1f}°C  hum={hum:.1f}%  soil=55%  ec=1.4  ✅")
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n  Stopped.")

# ── Main Menu ─────────────────────────────────────────────────

MENU = [
    ("──── RESET ────────────────────────────", None),
    ("1",  "Reset to Normal (healthy conditions)",      run_normal),
    ("──── SENSOR ALERTS ────────────────────", None),
    ("2",  "Soil Moisture dropping → Relay 1",          run_soil_alert),
    ("3",  "Temperature rising → Relay 2",              run_temp_alert),
    ("4",  "EC Level dropping → Relay 3",               run_ec_alert),
    ("5",  "ALL sensor alerts (2+3+4 combined)",        run_all_sensors),
    ("──── RELAY DEMO ───────────────────────", None),
    ("6",  "Trigger ALL 3 automation rules at once",    run_relay_demo),
    ("──── DISEASE DETECTION ────────────────", None),
    ("7",  "All healthy trees",                         run_disease_healthy),
    ("8",  "Early warning (unhealthy)",                 run_disease_warning),
    ("9",  "GANODERMA CRITICAL 🔴",                     run_disease_critical),
    ("──── SECURITY ─────────────────────────", None),
    ("10", "Security alerts (unknown/animal/person)",   run_security_demo),
    ("──── LIVE ─────────────────────────────", None),
    ("11", "Live normal readings (continuous 5s)",      run_live_normal),
    ("──── EXIT ─────────────────────────────", None),
    ("0",  "Exit",                                      None),
]

def show_menu():
    clear()
    header()
    print(f"\n  API: {API_URL}\n")
    for item in MENU:
        if len(item) == 2:
            print(f"\n  {item[0]}")
        else:
            key, label, _ = item
            print(f"  [{key:>2}] {label}")
    print()

def main():
    print("Connecting to API...")
    token = get_token()
    if not token:
        print("ERROR: Cannot connect to API!")
        sys.exit(1)
    print(f"✅ Connected to {API_URL}\n")
    time.sleep(1)

    while True:
        show_menu()
        choice = input("  Select option: ").strip()

        # Find matching menu item
        action = None
        for item in MENU:
            if len(item) == 3 and item[0] == choice:
                action = item[2]
                break

        if choice == "0":
            print("\n  Goodbye! Good luck with your demo! 🌴")
            break
        elif action:
            print()
            action(token)
            # Refresh token after each scenario
            new_token = get_token()
            if new_token:
                token = new_token
            wait()
        else:
            print("  Invalid option!")
            time.sleep(1)

if __name__ == "__main__":
    main()