import requests
import json

API_URL = "https://api.project2030.me"

# Login first to get token
login_res = requests.post(f"{API_URL}/auth/login", json={
    "username": "admin",
    "password": "fyp2024"
})
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("✅ Logged in successfully")
print()

# Test 1 — Insert DANGER values
print("🔴 Inserting DANGER sensor values...")
danger_data = {
    "temperature":   38.5,   # danger > 35
    "humidity":      45.0,   # danger < 50
    "soil_moisture": 25.0,   # danger < 30
    "ec_level":      0.8     # danger < 1.0
}
res = requests.post(f"{API_URL}/sensors/", json=danger_data, headers=headers)
print(f"   Status: {res.status_code}")
print(f"   Data:   {json.dumps(danger_data, indent=2)}")
print()

# Test 2 — Check latest
print("📊 Checking latest sensor values...")
res = requests.get(f"{API_URL}/sensors/latest", headers=headers)
data = res.json()
print(f"   Temperature:   {data.get('temperature')}°C")
print(f"   Humidity:      {data.get('humidity')}%")
print(f"   Soil Moisture: {data.get('soil_moisture')}%")
print(f"   EC Level:      {data.get('ec_level')} mS/cm")
print()

# Test 3 — Insert WARNING values
print("🟡 Inserting WARNING sensor values...")
warning_data = {
    "temperature":   33.0,   # warning > 32
    "humidity":      55.0,   # warning < 60
    "soil_moisture": 35.0,   # warning < 40
    "ec_level":      1.1     # warning < 1.2
}
res = requests.post(f"{API_URL}/sensors/", json=warning_data, headers=headers)
print(f"   Status: {res.status_code}")
print(f"   Data:   {json.dumps(warning_data, indent=2)}")
print()

# Test 4 — Insert NORMAL values
print("🟢 Inserting NORMAL sensor values...")
normal_data = {
    "temperature":   28.0,   # normal
    "humidity":      72.0,   # normal
    "soil_moisture": 55.0,   # normal
    "ec_level":      1.6     # normal
}
res = requests.post(f"{API_URL}/sensors/", json=normal_data, headers=headers)
print(f"   Status: {res.status_code}")
print(f"   Data:   {json.dumps(normal_data, indent=2)}")
print()

print("✅ Done! Check your dashboard at http://localhost:3000/sensors")
print("   🔴 Run danger   → sensors show DANGER banner")
print("   🟡 Run warning  → sensors show WARNING banner")
print("   🟢 Run normal   → sensors show no banner")