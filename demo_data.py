import time
import requests

data = [
    {"temperature": 31.4, "humidity": 74.2, "soil_moisture": 52.1, "ec_level": 1.6},
    {"temperature": 32.1, "humidity": 73.8, "soil_moisture": 48.5, "ec_level": 1.5},
    {"temperature": 33.5, "humidity": 72.1, "soil_moisture": 42.0, "ec_level": 1.3},
    {"temperature": 35.2, "humidity": 70.5, "soil_moisture": 38.0, "ec_level": 1.1},
    {"temperature": 36.1, "humidity": 69.2, "soil_moisture": 32.0, "ec_level": 0.9},
]

for d in data:
    r = requests.post("http://localhost:8000/sensors/", json=d)
    print(f"Inserted: temp={d['temperature']}°C soil={d['soil_moisture']}%")
    time.sleep(1)

print("Done! Check dashboard for live updates")