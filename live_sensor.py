import requests
import time
import random

print("Live sensor simulation started — Ctrl+C to stop")
print("Refresh dashboard to see updates!\n")

temp = 31.0
humidity = 74.0
soil = 52.0
ec = 1.6

while True:
    # Drift values realistically
    temp     = round(temp     + random.uniform(-0.3, 0.5), 1)
    humidity = round(humidity + random.uniform(-0.5, 0.3), 1)
    soil     = round(soil     + random.uniform(-0.8, 0.2), 1)
    ec       = round(ec       + random.uniform(-0.03, 0.03), 2)

    # Keep in bounds
    temp     = max(28.0, min(38.0, temp))
    humidity = max(55.0, min(85.0, humidity))
    soil     = max(25.0, min(70.0, soil))
    ec       = max(0.8,  min(2.5,  ec))

    data = {
        "temperature":   temp,
        "humidity":      humidity,
        "soil_moisture": soil,
        "ec_level":      ec
    }

    r = requests.post("http://localhost:8000/sensors/", json=data)
    print(f"temp={temp}°C  hum={humidity}%  soil={soil}%  ec={ec} mS/cm")

    time.sleep(5)