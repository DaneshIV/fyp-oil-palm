import os
import sys
import logging
import time
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

ON_IRIV = sys.platform == 'linux'

# ── Relay Mapping ────────────────────────────────────────────
RELAYS = {
    1: {"name": "Drip Irrigation",  "gpio": 17},
    2: {"name": "Mist Cooling",     "gpio": 27},
    3: {"name": "Fertilizer Pump",  "gpio": 22},
    4: {"name": "Grow Lighting",    "gpio": 23},
}

# Track relay states for simulation
_relay_states = {1: False, 2: False, 3: False, 4: False}

def setup_gpio():
    if not ON_IRIV:
        logger.info("[SIM] GPIO simulation mode — no real relays")
        return None
    try:
        import RPi.GPIO as GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        for relay_id, config in RELAYS.items():
            GPIO.setup(config["gpio"], GPIO.OUT)
            GPIO.output(config["gpio"], GPIO.LOW)
        logger.info("GPIO initialized")
        return GPIO
    except ImportError:
        logger.warning("RPi.GPIO not available")
        return None

def set_relay(relay_pin, state, gpio=None):
    if relay_pin not in RELAYS:
        logger.error(f"Unknown relay pin: {relay_pin}")
        return False

    relay_name = RELAYS[relay_pin]["name"]
    state_str  = "ON" if state else "OFF"
    _relay_states[relay_pin] = state

    if ON_IRIV and gpio:
        import RPi.GPIO as GPIO
        gpio.output(RELAYS[relay_pin]["gpio"], GPIO.HIGH if state else GPIO.LOW)
        logger.info(f"Relay {relay_pin} ({relay_name}) → {state_str}")
    else:
        logger.info(f"[SIM] Relay {relay_pin} ({relay_name}) → {state_str}")

    return True

def get_relay_states():
    return {
        relay_id: {
            "name":  RELAYS[relay_id]["name"],
            "state": _relay_states[relay_id]
        }
        for relay_id in RELAYS
    }

def check_automation_rules(gpio=None):
    try:
        import pymysql
        conn   = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "fyp1234"),
            database=os.getenv("DB_NAME", "fyp_oil_palm")
        )
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        # Get latest sensor reading
        cursor.execute("SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1")
        sensor = cursor.fetchone()

        if not sensor:
            logger.warning("No sensor data available")
            conn.close()
            return

        # Get active threshold rules
        cursor.execute("""
            SELECT * FROM automation_rules
            WHERE is_active = TRUE AND trigger_type = 'threshold'
        """)
        rules = cursor.fetchall()

        for rule in rules:
            field     = rule["sensor_field"]
            threshold = float(rule["threshold_value"])
            operator  = rule["operator"]
            relay_pin = rule["relay_pin"]

            if field not in sensor:
                continue

            value     = float(sensor[field])
            triggered = (
                (operator == "<" and value < threshold) or
                (operator == ">" and value > threshold)
            )

            if triggered:
                logger.info(f"Rule '{rule['rule_name']}' triggered: "
                           f"{field}={value} {operator} {threshold}")
                set_relay(relay_pin, True, gpio)

                # Update last triggered
                cursor.execute(
                    "UPDATE automation_rules SET last_triggered = NOW() WHERE id = %s",
                    (rule["id"],)
                )

                # Send Telegram notification
                try:
                    import asyncio
                    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
                    from telegram_bot import notify_relay_activated
                    asyncio.run(notify_relay_activated(
                        RELAYS[relay_pin]["name"],
                        relay_pin,
                        f"{field} {operator} {threshold}"
                    ))
                except Exception as e:
                    logger.error(f"Telegram notify failed: {e}")

        conn.commit()
        conn.close()

    except Exception as e:
        logger.error(f"Automation check failed: {e}")

def main():
    mode = "IRIV Hardware" if ON_IRIV else "Simulation (Windows)"
    logger.info("=" * 50)
    logger.info(f"Automation Controller Started — {mode}")
    logger.info("=" * 50)

    gpio = setup_gpio()

    while True:
        check_automation_rules(gpio)
        time.sleep(30)

if __name__ == "__main__":
    main()