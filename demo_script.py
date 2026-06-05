"""
demo_script.py — FYP Oil Palm IoT Demo Script
Run this on laptop during demo to simulate field conditions

Usage:
  python demo_script.py --scenario all        # Run full demo
  python demo_script.py --scenario sensors    # Sensor alerts only
  python demo_script.py --scenario disease    # Disease detection
  python demo_script.py --scenario relay      # Automation rules
  python demo_script.py --scenario security   # Security alerts
  python demo_script.py --scenario normal     # Reset to normal values
"""

import requests
import time
import argparse
import sys

API_URL    = "https://api.project2030.me"
TOKEN_USER = "admin"
TOKEN_PASS = "fyp2024"

def get_token():
    r = requests.post(f"{API_URL}/auth/login",
        json={"username": TOKEN_USER, "password": TOKEN_PASS}, timeout=10)
    return r.json().get("access_token")

def post_sensor(token, temp, humidity, soil, soil_temp, ec):
    r = requests.post(f"{API_URL}/sensors/",
        json={"temperature": temp, "humidity": humidity,
              "soil_moisture": soil, "soil_temperature": soil_temp,
              "ec_level": ec},
        headers={"Authorization": f"Bearer {token}"}, timeout=10)
    print(f"  [SENSOR] temp={temp}°C hum={humidity}% soil={soil}% soil_temp={soil_temp}°C ec={ec} → {r.status_code}")

def post_alert(token, alert_type, message, value, threshold):
    r = requests.post(f"{API_URL}/alerts/",
        json={"alert_type": alert_type, "message": message,
              "sensor_value": value, "threshold": threshold},
        headers={"Authorization": f"Bearer {token}"}, timeout=10)
    print(f"  [ALERT] {alert_type} → {r.status_code}")

def post_disease(token, label, confidence, severity, tree_id, block_id):
    r = requests.post(f"{API_URL}/disease/",
        json={"image_path": f"demo/{label}_{tree_id}.jpg",
              "disease_label": label, "confidence": confidence,
              "severity": severity, "tree_id": tree_id,
              "block_id": block_id},
        headers={"Authorization": f"Bearer {token}"}, timeout=10)
    print(f"  [DISEASE] {label} {confidence}% on {tree_id} → {r.status_code}")

def sep(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")

# ── Scenarios ─────────────────────────────────────────────────

def scenario_normal(token):
    sep("NORMAL — Reset to healthy field conditions")
    print("Posting normal sensor readings...")
    for i in range(3):
        post_sensor(token, 29.5, 72.0, 55.0, 28.0, 1.4)
        time.sleep(1)
    post_disease(token, "healthy", 95.2, "None", "T-001", "BLK_A")
    post_disease(token, "healthy", 91.0, "None", "T-002", "BLK_A")
    print("✅ Normal conditions set!")

def scenario_sensors(token):
    sep("SENSOR ALERTS DEMO")

    print("\n[Step 1] Normal readings first...")
    post_sensor(token, 29.5, 72.0, 55.0, 28.0, 1.4)
    time.sleep(2)

    print("\n[Step 2] Soil moisture dropping (irrigation needed)...")
    for soil in [50, 42, 35, 28, 22]:
        post_sensor(token, 29.5, 72.0, soil, 28.0, 1.4)
        print(f"  Soil: {soil}% {'⚠️ WARNING' if soil < 40 else '✅'}")
        time.sleep(1)

    print("\n[Step 3] Temperature rising (cooling needed)...")
    for temp in [30, 32, 34, 36, 38]:
        post_sensor(token, temp, 68.0, 28.0, temp-1, 1.4)
        print(f"  Temp: {temp}°C {'🚨 CRITICAL' if temp > 35 else '⚠️ WARNING' if temp > 32 else '✅'}")
        time.sleep(1)

    print("\n[Step 4] EC dropping (fertilizer needed)...")
    for ec in [1.4, 1.1, 0.8, 0.5, 0.17]:
        post_sensor(token, 30.0, 70.0, 28.0, 28.0, ec)
        print(f"  EC: {ec} mS/cm {'🚨 CRITICAL' if ec < 1.0 else '⚠️ WARNING' if ec < 1.2 else '✅'}")
        time.sleep(1)

    print("\n✅ Sensor alert demo complete!")

def scenario_relay(token):
    sep("AUTOMATION RELAY DEMO")
    print("This shows how rules automatically trigger relays")
    print("\n[Step 1] Soil moisture = 25% (below 40% threshold)")
    print("  → Should trigger Drip Irrigation (Relay 1)")
    post_sensor(token, 30.0, 72.0, 25.0, 28.0, 1.4)
    time.sleep(2)

    print("\n[Step 2] Temperature = 37°C (above 35° threshold)")
    print("  → Should trigger Mist Cooling (Relay 2)")
    post_sensor(token, 37.0, 65.0, 25.0, 32.0, 1.4)
    time.sleep(2)

    print("\n[Step 3] EC = 0.17 mS/cm (below 1.2 threshold)")
    print("  → Should trigger Fertilizer Pump (Relay 3)")
    post_sensor(token, 37.0, 65.0, 25.0, 32.0, 0.17)
    time.sleep(2)

    print("\n✅ All 3 rules should have fired on IRIV!")
    print("   Check Relay Control page — Relay 1, 2, 3 should show ENGAGED")

def scenario_disease(token):
    sep("DISEASE DETECTION DEMO")

    print("\n[Step 1] Healthy trees...")
    post_disease(token, "healthy",   94.5, "None",   "T-001", "BLK_A")
    post_disease(token, "healthy",   91.2, "None",   "T-002", "BLK_A")
    post_disease(token, "immature",  88.0, "Low",    "T-003", "BLK_A")
    time.sleep(1)

    print("\n[Step 2] Early disease signs...")
    post_disease(token, "unhealthy", 76.3, "Medium", "T-004", "BLK_A")
    post_disease(token, "unhealthy", 82.1, "Medium", "T-005", "BLK_A")
    time.sleep(1)

    print("\n[Step 3] Ganoderma detected!")
    post_disease(token, "ganoderma", 91.7, "High",   "T-006", "BLK_A")
    post_disease(token, "ganoderma", 87.5, "High",   "T-007", "BLK_A")
    time.sleep(1)

    print("\n✅ Disease detection demo complete!")
    print("   Check Disease AI page — should show Ganoderma HIGH severity")

def scenario_security(token):
    sep("SECURITY ALERT DEMO")

    print("\n[Step 1] Unknown motion detected...")
    r = requests.post(f"{API_URL}/alerts/",
        json={"alert_type": "security_unknown",
              "message": "Security Alert: UNKNOWN detected (45.2% confidence)",
              "sensor_value": 45.2, "threshold": 25.0},
        headers={"Authorization": f"Bearer {token}"}, timeout=10)
    print(f"  Unknown alert → {r.status_code}")
    time.sleep(2)

    print("\n[Step 2] Animal detected...")
    r = requests.post(f"{API_URL}/alerts/",
        json={"alert_type": "security_animal",
              "message": "Security Alert: ANIMAL detected (78.3% confidence) — dog",
              "sensor_value": 78.3, "threshold": 25.0},
        headers={"Authorization": f"Bearer {token}"}, timeout=10)
    print(f"  Animal alert → {r.status_code}")
    time.sleep(2)

    print("\n[Step 3] PERSON detected — HIGH ALERT!")
    r = requests.post(f"{API_URL}/alerts/",
        json={"alert_type": "security_person",
              "message": "Security Alert: PERSON detected (92.1% confidence) — INTRUDER",
              "sensor_value": 92.1, "threshold": 25.0},
        headers={"Authorization": f"Bearer {token}"}, timeout=10)
    print(f"  PERSON alert → {r.status_code}")

    print("\n✅ Security demo complete!")
    print("   Check Security Monitor page — events should show in log")

def scenario_all(token):
    sep("FULL DEMO SEQUENCE")
    print("Running complete demo in order...\n")

    scenario_normal(token)
    time.sleep(3)

    scenario_sensors(token)
    time.sleep(3)

    scenario_disease(token)
    time.sleep(3)

    scenario_relay(token)
    time.sleep(3)

    scenario_security(token)

    sep("DEMO COMPLETE")
    print("✅ All scenarios demonstrated!")
    print("\nWhat to show on dashboard:")
    print("  1. Overview    — sensor values + alerts feed")
    print("  2. Sensors     — charts showing value changes")
    print("  3. Disease AI  — Ganoderma detections")
    print("  4. Relay Ctrl  — relays ENGAGED by rules")
    print("  5. Security    — event log with alerts")
    print("  6. Reports     — CSV export")

# ── Main ──────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FYP Demo Script")
    parser.add_argument("--scenario", default="all",
        choices=["all", "normal", "sensors", "disease", "relay", "security"])
    args = parser.parse_args()

    print("FYP Oil Palm IoT — Demo Script")
    print(f"API: {API_URL}")
    print("Getting token...")

    token = get_token()
    if not token:
        print("ERROR: Cannot get token!")
        sys.exit(1)
    print(f"Token OK\n")

    scenarios = {
        "all":      scenario_all,
        "normal":   scenario_normal,
        "sensors":  scenario_sensors,
        "disease":  scenario_disease,
        "relay":    scenario_relay,
        "security": scenario_security,
    }

    scenarios[args.scenario](token)