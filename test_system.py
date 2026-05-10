import requests
import json
import time
import websocket
import threading

LOCAL_API  = "http://localhost:8000"
TUNNEL_API = "https://api.project2030.me"

results = []

def check(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"  {status} — {name}")
    if detail: print(f"           {detail}")
    results.append((name, passed))

def test_api(base_url, label):
    print(f"\n{'='*50}")
    print(f"  Testing {label}")
    print(f"  URL: {base_url}")
    print(f"{'='*50}")

    # 1 — Health check
    try:
        r = requests.get(f"{base_url}/health", timeout=10)
        check("Health endpoint", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        check("Health endpoint", False, str(e))
        return

    # 2 — Login
    try:
        r = requests.post(f"{base_url}/auth/login",
            json={"username": "admin", "password": "fyp2024"}, timeout=10)
        token = r.json().get("access_token")
        check("JWT Login", r.status_code == 200 and token, f"Token: {token[:20]}..." if token else "No token")
    except Exception as e:
        check("JWT Login", False, str(e))
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 3 — Wrong password
    try:
        r = requests.post(f"{base_url}/auth/login",
            json={"username": "admin", "password": "wrongpass"}, timeout=10)
        check("Wrong password rejected", r.status_code == 401, f"Status: {r.status_code}")
    except Exception as e:
        check("Wrong password rejected", False, str(e))

    # 4 — Protected route without token
    try:
        r = requests.get(f"{base_url}/sensors/latest", timeout=10)
        check("Protected route blocks without token", r.status_code == 401, f"Status: {r.status_code}")
    except Exception as e:
        check("Protected route blocks without token", False, str(e))

    # 5 — Sensors latest
    try:
        r = requests.get(f"{base_url}/sensors/latest", headers=headers, timeout=10)
        check("Sensors latest", r.status_code == 200, f"Data: {r.json()}")
    except Exception as e:
        check("Sensors latest", False, str(e))

    # 6 — Sensor history
    try:
        r = requests.get(f"{base_url}/sensors/history?hours=24", headers=headers, timeout=10)
        data = r.json()
        check("Sensor history", r.status_code == 200, f"Records: {len(data)}")
    except Exception as e:
        check("Sensor history", False, str(e))

    # 7 — Post sensor data
    try:
        r = requests.post(f"{base_url}/sensors/", headers=headers,
            json={"temperature": 29.5, "humidity": 72.0, "soil_moisture": 55.0, "ec_level": 1.6},
            timeout=10)
        check("Post sensor data", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        check("Post sensor data", False, str(e))

    # 8 — Disease history
    try:
        r = requests.get(f"{base_url}/disease/history?limit=10", headers=headers, timeout=10)
        data = r.json()
        check("Disease history", r.status_code == 200, f"Records: {len(data)}")
    except Exception as e:
        check("Disease history", False, str(e))

    # 9 — Alerts
    try:
        r = requests.get(f"{base_url}/alerts/", headers=headers, timeout=10)
        check("Alerts endpoint", r.status_code == 200, f"Alerts: {len(r.json())}")
    except Exception as e:
        check("Alerts endpoint", False, str(e))

    # 10 — Automation rules
    try:
        r = requests.get(f"{base_url}/automation/rules", headers=headers, timeout=10)
        check("Automation rules", r.status_code == 200, f"Rules: {len(r.json())}")
    except Exception as e:
        check("Automation rules", False, str(e))

    # 11 — Security events
    try:
        r = requests.get(f"{base_url}/security/events", headers=headers, timeout=10)
        check("Security events", r.status_code == 200, f"Events: {len(r.json())}")
    except Exception as e:
        check("Security events", False, str(e))

    # 12 — Security snapshots
    try:
        r = requests.get(f"{base_url}/security/snapshots", headers=headers, timeout=10)
        check("Security snapshots", r.status_code == 200, f"Snapshots: {len(r.json())}")
    except Exception as e:
        check("Security snapshots", False, str(e))

    # 13 — Supabase sync
    try:
        r = requests.post(f"{base_url}/sync", headers=headers, timeout=30)
        check("Supabase sync", r.status_code == 200, f"Response: {r.json()}")
    except Exception as e:
        check("Supabase sync", False, str(e))

    # 14 — Auth verify
    try:
        r = requests.get(f"{base_url}/auth/verify", headers=headers, timeout=10)
        check("Auth verify token", r.status_code == 200, f"User: {r.json()}")
    except Exception as e:
        check("Auth verify token", False, str(e))

def test_websocket(base_url, label):
    print(f"\n{'='*50}")
    print(f"  Testing WebSocket — {label}")
    print(f"{'='*50}")

    ws_url = base_url.replace("https://", "wss://").replace("http://", "ws://")
    received = []

    def on_message(ws, message):
        received.append(message)
        ws.close()

    def on_error(ws, error):
        pass

    try:
        ws = websocket.WebSocketApp(
            f"{ws_url}/sensors/ws/sensors",
            on_message=on_message,
            on_error=on_error
        )
        t = threading.Thread(target=ws.run_forever, kwargs={"ping_timeout": 5})
        t.daemon = True
        t.start()
        t.join(timeout=8)
        check("WebSocket sensor push", len(received) > 0,
              f"Received: {received[0][:80]}..." if received else "No data received")
    except Exception as e:
        check("WebSocket sensor push", False, str(e))

def test_dashboard(url, label):
    print(f"\n{'='*50}")
    print(f"  Testing Dashboard — {label}")
    print(f"{'='*50}")
    try:
        r = requests.get(url, timeout=15, allow_redirects=True)
        check("Dashboard loads", r.status_code == 200, f"Status: {r.status_code}")
        check("Dashboard has content", len(r.text) > 100, f"Size: {len(r.text)} bytes")
    except Exception as e:
        check("Dashboard loads", False, str(e))

# ── Run All Tests ────────────────────────────────────────
print("\n🌴 FYP OIL PALM SYSTEM — FULL SYSTEM TEST")
print("=" * 50)

# Local tests
test_api(LOCAL_API, "LOCAL API (localhost:8000)")
test_websocket(LOCAL_API, "LOCAL WebSocket")
test_dashboard("http://localhost:3000", "LOCAL Dashboard")

# Tunnel tests
print("\n⏳ Testing tunnel (may take a moment)...")
test_api(TUNNEL_API, "TUNNEL API (api.project2030.me)")
test_websocket(TUNNEL_API, "TUNNEL WebSocket")
test_dashboard("https://app.project2030.me", "TUNNEL Dashboard")

# ── Summary ──────────────────────────────────────────────
print(f"\n{'='*50}")
print("  FINAL RESULTS")
print(f"{'='*50}")
passed = sum(1 for _, p in results if p)
total  = len(results)
print(f"\n  Total:  {total} tests")
print(f"  Passed: {passed} ✅")
print(f"  Failed: {total - passed} ❌")
print(f"  Score:  {passed/total*100:.1f}%\n")

if total - passed > 0:
    print("  Failed tests:")
    for name, p in results:
        if not p:
            print(f"    ❌ {name}")