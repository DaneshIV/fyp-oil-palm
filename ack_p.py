import requests

alerts = [
    {"alert_type": "danger", "message": "Soil moisture critically low in Zone 3 (28%)", "sensor_value": 28.0, "threshold": 40.0},
    {"alert_type": "danger", "message": "Temperature spike detected: 36.1C in Block A", "sensor_value": 36.1, "threshold": 35.0},
    {"alert_type": "warning", "message": "EC level dropping below threshold in Zone 2", "sensor_value": 1.1, "threshold": 1.2},
    {"alert_type": "danger", "message": "Ganoderma detected: Block A Tree 14 (87.5% confidence)", "sensor_value": 87.5, "threshold": 0.0},
    {"alert_type": "warning", "message": "Humidity dropping below safe range (58%)", "sensor_value": 58.0, "threshold": 60.0},
]

for a in alerts:
    r = requests.post("http://localhost:8000/alerts/", json=a)
    print(f"Added: {a['message'][:50]}")

print("Done! Refresh dashboard")