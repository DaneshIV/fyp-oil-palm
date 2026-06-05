import os
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.error import TelegramError

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

bot = Bot(token=BOT_TOKEN)

# ── Core send functions ──────────────────────────────────────

async def send_message(text: str, reply_markup=None):
    """Send a plain text message"""
    try:
        await bot.send_message(
            chat_id=CHAT_ID,
            text=text,
            parse_mode="HTML",
            reply_markup=reply_markup
        )
        logger.info(f"Message sent: {text[:50]}...")
    except TelegramError as e:
        logger.error(f"Failed to send message: {e}")

async def send_photo(image_path: str, caption: str):
    """Send a photo with caption"""
    try:
        with open(image_path, 'rb') as photo:
            await bot.send_photo(
                chat_id=CHAT_ID,
                photo=photo,
                caption=caption,
                parse_mode="HTML"
            )
        logger.info(f"Photo sent: {image_path}")
    except FileNotFoundError:
        await send_message(f"📸 {caption}\n\n<i>Image not available</i>")
    except TelegramError as e:
        logger.error(f"Failed to send photo: {e}")

# ── Alert Functions ──────────────────────────────────────────

async def alert_soil_moisture(value: float, threshold: float = 40.0):
    """Alert when soil moisture is critically low"""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("💧 Activate Irrigation", callback_data="relay_1_on")],
        [InlineKeyboardButton("✅ Acknowledge", callback_data="ack_soil")],
    ])
    message = (
        f"💧 Your soil is running dry!\n\n"
        f"Soil moisture has dropped to {value:.1f}%, which is below the safe minimum of {threshold}%. "
        f"Your oil palm trees may be experiencing water stress. "
        f"The drip irrigation system should be activated as soon as possible.\n\n"
        f"📍 Oil Palm Plantation — BLK_A\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
    )
    await send_message(message, reply_markup=keyboard)

async def alert_temperature(value: float, threshold: float = 35.0):
    """Alert when temperature is too high"""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🌫️ Activate Mist Cooling", callback_data="relay_2_on")],
        [InlineKeyboardButton("✅ Acknowledge", callback_data="ack_temp")],
    ])
    message = (
        f"🌡️ Temperature is getting too hot!\n\n"
        f"The temperature has risen to {value:.1f}°C, exceeding the safe limit of {threshold}°C. "
        f"Prolonged heat stress can reduce oil palm yield and damage young fronds. "
        f"Consider activating the mist cooling system.\n\n"
        f"📍 Oil Palm Plantation — BLK_A\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
    )
    await send_message(message, reply_markup=keyboard)

async def alert_humidity(value: float, threshold: float = 50.0):
    """Alert when humidity is too low"""
    message = (
        f"💨 <b>HUMIDITY ALERT</b>\n\n"
        f"💧 Current Value: <b>{value:.1f}%</b>\n"
        f"⚠️ Threshold: {threshold}%\n"
        f"📉 Status: <b>TOO LOW</b>\n\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    await send_message(message)

async def alert_ec_level(value: float, threshold: float = 1.2):
    """Alert when EC level is too low"""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🌱 Activate Fertilizer Pump", callback_data="relay_3_on")],
        [InlineKeyboardButton("✅ Acknowledge", callback_data="ack_ec")],
    ])
    message = (
        f"🌱 Your soil needs nutrients!\n\n"
        f"The soil electrical conductivity has dropped to {value:.2f} mS/cm, below the recommended minimum of {threshold} mS/cm. "
        f"This indicates low nutrient levels in the soil which can reduce oil palm growth and fruit production. "
        f"Activate the fertilizer pump to restore soil health.\n\n"
        f"📍 Oil Palm Plantation — BLK_A\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
    )
    await send_message(message, reply_markup=keyboard)

async def alert_disease_detected(
    disease_label: str,
    confidence: float,
    severity: str,
    tree_id: str,
    block_id: str,
    image_path: str = None
):
    """Alert when disease is detected"""
    disease_info = {
        "ganoderma": {
            "title":  "🔴 Ganoderma Basal Stem Rot Detected",
            "desc":   "Ganoderma boninense fungal infection has been identified on one of your oil palm trees. This is the most destructive disease in Malaysian oil palm plantations and can spread to neighbouring trees if left untreated.",
            "action": "Isolate the affected tree immediately. Apply fungicide treatment and consult an agronomist. Do not delay — early intervention can save surrounding trees."
        },
        "unhealthy": {
            "title":  "🟡 Unhealthy Palm Tree Detected",
            "desc":   "Signs of disease or stress have been detected on one of your oil palm trees. This could indicate early-stage Bud Rot, Crown Disease, or nutrient deficiency.",
            "action": "Inspect the tree physically for visible symptoms. Check soil nutrient levels and irrigation. Consider consulting an agricultural officer."
        },
        "immature": {
            "title":  "🟢 Young Palm Tree Identified",
            "desc":   "An immature oil palm tree has been detected in this area. Young palms require special care and are more vulnerable to disease and pests.",
            "action": "Ensure adequate fertilization and irrigation for young trees. Monitor closely over the next few weeks."
        },
        "healthy": {
            "title":  "✅ Healthy Palm Tree Confirmed",
            "desc":   "The scanned oil palm tree appears to be in good health with no visible signs of disease.",
            "action": "No action required. Continue regular monitoring and maintenance."
        }
    }
    info = disease_info.get(disease_label.lower(), {
        "title":  "⚠️ Abnormality Detected",
        "desc":   "An abnormality has been detected on one of your oil palm trees.",
        "action": "Physically inspect the tree and consult an agricultural officer."
    })
    caption = (
        f"{info['title']}\n\n"
        f"{info['desc']}\n\n"
        f"📍 Tree {tree_id} — Block {block_id}\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}\n\n"
        f"💡 {info['action']}"
    )

    if image_path and os.path.exists(image_path):
        await send_photo(image_path, caption)
    else:
        await send_message(caption)

async def notify_relay_activated(relay_name: str, relay_pin: int, reason: str):
    """Notify when a relay is automatically activated"""
    # Human-friendly relay messages
    relay_actions = {
        "Drip Irrigation":  ("💧 Irrigation Started", "Soil moisture has dropped below the safe threshold. The drip irrigation system has been automatically activated to water your oil palm trees."),
        "Mist Pump":        ("🌫️ Mist Cooling Activated", "Temperature has exceeded the safe limit. The mist cooling system has been turned on to protect your crops from heat stress."),
        "NPK-A Pump":       ("🌱 Fertilizer Pump A Activated", "Soil EC level has dropped below the recommended range. Fertilizer Pump A has been activated to replenish soil nutrients."),
        "NPK-B Pump":       ("🌱 Fertilizer Pump B Activated", "Soil EC level has dropped below the recommended range. Fertilizer Pump B has been activated to replenish soil nutrients."),
        "NPK-C Pump":       ("🌱 Fertilizer Pump C Activated", "Soil EC level has dropped below the recommended range. Fertilizer Pump C has been activated to replenish soil nutrients."),
    }
    title, desc = relay_actions.get(relay_name, (f"⚙️ {relay_name} Activated", f"{relay_name} has been automatically activated by the system."))
    message = (
        f"{title}\n\n"
        f"{desc}\n\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}\n"
        f"🤖 Triggered automatically by sensor threshold rule"
    )
    await send_message(message)

async def notify_relay_deactivated(relay_name: str, relay_pin: int):
    """Notify when a relay is deactivated"""
    relay_names = {
        "Drip Irrigation": "💧 Irrigation Stopped",
        "Mist Pump":       "🌫️ Mist Cooling Stopped",
        "NPK-A Pump":      "🌱 Fertilizer Pump A Stopped",
        "NPK-B Pump":      "🌱 Fertilizer Pump B Stopped",
        "NPK-C Pump":      "🌱 Fertilizer Pump C Stopped",
    }
    title = relay_names.get(relay_name, f"⚙️ {relay_name} Stopped")
    message = (
        f"{title}\n\n"
        f"Sensor readings have returned to normal levels. {relay_name} has been automatically turned off.\n\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
    )
    await send_message(message)

async def send_daily_summary(
    avg_temp: float,
    avg_humidity: float,
    avg_soil: float,
    avg_ec: float,
    disease_count: int,
    alert_count: int
):
    """Send daily crop health summary"""
    status = "✅ HEALTHY" if disease_count == 0 and alert_count == 0 else "⚠️ NEEDS ATTENTION"
    message = (
        f"📊 <b>DAILY SUMMARY</b>\n"
        f"📅 {datetime.now().strftime('%Y-%m-%d')}\n\n"
        f"🌡️ Avg Temperature: <b>{avg_temp:.1f}°C</b>\n"
        f"💧 Avg Humidity: <b>{avg_humidity:.1f}%</b>\n"
        f"🌱 Avg Soil Moisture: <b>{avg_soil:.1f}%</b>\n"
        f"⚡ Avg EC Level: <b>{avg_ec:.2f} mS/cm</b>\n\n"
        f"🔬 Disease Detections: <b>{disease_count}</b>\n"
        f"🚨 Alerts Triggered: <b>{alert_count}</b>\n\n"
        f"Overall Status: <b>{status}</b>"
    )
    await send_message(message)

async def send_system_startup():
    """Notify when system starts up"""
    message = (
        f"🚀 <b>SYSTEM ONLINE</b>\n\n"
        f"✅ IRIV PiControl started\n"
        f"✅ Sensors connected\n"
        f"✅ Database connected\n"
        f"✅ AI model loaded\n\n"
        f"🌴 Oil Palm IoT FYP System is running\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    await send_message(message)

# ── Test Function ────────────────────────────────────────────

async def run_all_tests():
    """Test all alert types with REAL sensor values from API"""
    import httpx

    API_URL    = os.getenv("API_URL",  "https://api.project2030.me")
    TOKEN_USER = os.getenv("API_USER", "admin")
    TOKEN_PASS = os.getenv("API_PASS", "fyp2024")

    print("Testing Telegram bot with REAL sensor values...")

    real = {}
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{API_URL}/auth/login",
                json={"username": TOKEN_USER, "password": TOKEN_PASS}, timeout=10)
            token = r.json().get("access_token")
            r = await client.get(f"{API_URL}/sensors/latest",
                headers={"Authorization": f"Bearer {token}"}, timeout=10)
            real = r.json()
            print(f"Real: temp={real.get('temperature')}C hum={real.get('humidity')}% soil={real.get('soil_moisture')}% soil_temp={real.get('soil_temperature')}C ec={real.get('ec_level')}mS/cm")
    except Exception as e:
        print(f"Could not fetch real data: {e} -- using demo values")
        real = {"temperature": 30.0, "humidity": 75.0, "soil_moisture": 100.0, "soil_temperature": 28.7, "ec_level": 0.169}

    print("1. Sending startup message...")
    await send_system_startup()
    await asyncio.sleep(1)

    print(f"2. Soil moisture alert (real: {real.get('soil_moisture')}%)...")
    await alert_soil_moisture(real.get("soil_moisture", 0))
    await asyncio.sleep(1)

    print(f"3. Temperature alert (real: {real.get('temperature')}C)...")
    await alert_temperature(real.get("temperature", 0))
    await asyncio.sleep(1)

    print(f"4. EC level alert (real: {real.get('ec_level')} mS/cm)...")
    await alert_ec_level(real.get("ec_level", 0))
    await asyncio.sleep(1)

    print("5. Disease detection alert...")
    await alert_disease_detected("ganoderma", 87.5, "High", "A-14", "BLK_A")
    await asyncio.sleep(1)

    print("6. Relay activated notification...")
    await notify_relay_activated("Drip Irrigation", 1, "soil_moisture below 40%")
    await asyncio.sleep(1)

    print(f"7. Daily summary (real values)...")
    await send_daily_summary(
        real.get("temperature", 0), real.get("humidity", 0),
        real.get("soil_moisture", 0), real.get("ec_level", 0), 1, 2)

    print("\n All tests complete! Check your Telegram.")
if __name__ == "__main__":
    asyncio.run(run_all_tests())


