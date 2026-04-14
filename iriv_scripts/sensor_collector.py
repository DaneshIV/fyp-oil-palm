import time
import logging
import os
import sys
import random
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# ── Config ───────────────────────────────────────────────────
RS485_PORT    = '/dev/ttyS0'
RS485_BAUD    = 9600
SENSOR_ADDR   = 1
POLL_INTERVAL = 30  # seconds

# Detect if running on IRIV or local Windows
ON_IRIV = sys.platform == 'linux'

# ── Simulation ───────────────────────────────────────────────
_sim_temp = 31.0
_sim_hum  = 74.0
_sim_soil = 52.0
_sim_ec   = 1.6

def simulate_sensors():
    """Generate realistic drifting sensor values for local testing"""
    global _sim_temp, _sim_hum, _sim_soil, _sim_ec
    _sim_temp  = round(_sim_temp  + random.uniform(-0.3, 0.3), 1)
    _sim_hum   = round(_sim_hum   + random.uniform(-0.5, 0.5), 1)
    _sim_soil  = round(_sim_soil  + random.uniform(-0.4, 0.4), 1)
    _sim_ec    = round(_sim_ec    + random.uniform(-0.02, 0.02), 2)

    # Keep within realistic bounds
    _sim_temp  = max(20.0, min(40.0, _sim_temp))
    _sim_hum   = max(40.0, min(95.0, _sim_hum))
    _sim_soil  = max(20.0, min(80.0, _sim_soil))
    _sim_ec    = max(0.5,  min(3.0,  _sim_ec))

    return {
        "temperature":   _sim_temp,
        "humidity":      _sim_hum,
        "soil_moisture": _sim_soil,
        "ec_level":      _sim_ec,
    }

# ── Real Sensors (IRIV only) ─────────────────────────────────
def read_rs485_sensors():
    """Read temperature, humidity, soil moisture via RS485 Modbus RTU"""
    try:
        from pymodbus.client import ModbusSerialClient
        client = ModbusSerialClient(
            port=RS485_PORT,
            baudrate=RS485_BAUD,
            method='rtu',
            timeout=1
        )
        client.connect()
        result = client.read_holding_registers(address=0, count=3, slave=SENSOR_ADDR)
        client.close()

        if result.isError():
            logger.error("Modbus read error")
            return None

        return {
            "temperature":   result.registers[0] / 10.0,
            "humidity":      result.registers[1] / 10.0,
            "soil_moisture": result.registers[2] / 10.0,
        }
    except Exception as e:
        logger.error(f"RS485 read failed: {e}")
        return None

def read_ec_sensor():
    """Read EC level via ADS1115 analog input (I2C 0x48)"""
    try:
        import board
        import busio
        import adafruit_ads1x15.ads1115 as ADS
        from adafruit_ads1x15.analog_in import AnalogIn

        i2c     = busio.I2C(board.SCL, board.SDA)
        ads     = ADS.ADS1115(i2c, address=0x48)
        ads.gain = 1
        chan    = AnalogIn(ads, ADS.P0)
        voltage = chan.voltage
        ec      = round(voltage * 2.0, 2)  # calibrate per sensor datasheet
        return ec
    except Exception as e:
        logger.error(f"EC sensor read failed: {e}")
        return 1.5

# ── Database ─────────────────────────────────────────────────
def save_to_mysql(data):
    try:
        import pymysql
        conn = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "fyp1234"),
            database=os.getenv("DB_NAME", "fyp_oil_palm")
        )
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sensor_readings
            (temperature, humidity, soil_moisture, ec_level)
            VALUES (%s, %s, %s, %s)
        """, (data["temperature"], data["humidity"],
              data["soil_moisture"], data["ec_level"]))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"MySQL save failed: {e}")
        return False

# ── Alerts ───────────────────────────────────────────────────
def check_thresholds(data):
    try:
        import asyncio
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from telegram_bot import (
            alert_soil_moisture,
            alert_temperature,
            alert_ec_level
        )
        if data["soil_moisture"] < 40:
            asyncio.run(alert_soil_moisture(data["soil_moisture"]))
            logger.warning(f"ALERT: Soil moisture low: {data['soil_moisture']}%")

        if data["temperature"] > 35:
            asyncio.run(alert_temperature(data["temperature"]))
            logger.warning(f"ALERT: Temperature high: {data['temperature']}°C")

        if data["ec_level"] < 1.2:
            asyncio.run(alert_ec_level(data["ec_level"]))
            logger.warning(f"ALERT: EC level low: {data['ec_level']} mS/cm")

    except Exception as e:
        logger.error(f"Alert check failed: {e}")

# ── Main Loop ────────────────────────────────────────────────
def main():
    mode = "IRIV Hardware" if ON_IRIV else "Simulation (Windows)"
    logger.info("=" * 50)
    logger.info(f"Sensor Collector Started — {mode}")
    logger.info(f"Poll interval: {POLL_INTERVAL}s")
    logger.info("=" * 50)

    while True:
        try:
            if ON_IRIV:
                rs485 = read_rs485_sensors()
                ec    = read_ec_sensor()
                if rs485:
                    data = {**rs485, "ec_level": ec}
                else:
                    logger.warning("Sensor read failed — skipping")
                    time.sleep(POLL_INTERVAL)
                    continue
            else:
                data = simulate_sensors()
                logger.info(f"[SIM] temp={data['temperature']}°C "
                           f"hum={data['humidity']}% "
                           f"soil={data['soil_moisture']}% "
                           f"ec={data['ec_level']} mS/cm")

            save_to_mysql(data)
            check_thresholds(data)

        except Exception as e:
            logger.error(f"Main loop error: {e}")

        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()