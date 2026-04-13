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
        f"🚨 <b>SOIL MOISTURE ALERT</b>\n\n"
        f"📍 Current Value: <b>{value:.1f}%</b>\n"
        f"⚠️ Threshold: {threshold}%\n"
        f"💧 Status: <b>CRITICALLY LOW</b>\n\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    await send_message(message, reply_markup=keyboard)

async def alert_temperature(value: float, threshold: float = 35.0):
    """Alert when temperature is too high"""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🌫️ Activate Mist Cooling", callback_data="relay_2_on")],
        [InlineKeyboardButton("✅ Acknowledge", callback_data="ack_temp")],
    ])
    message = (
        f"🌡️ <b>TEMPERATURE ALERT</b>\n\n"
        f"🌡️ Current Value: <b>{value:.1f}°C</b>\n"
        f"⚠️ Threshold: {threshold}°C\n"
        f"🔥 Status: <b>TOO HIGH</b>\n\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
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
        f"⚡ <b>EC LEVEL ALERT</b>\n\n"
        f"⚡ Current Value: <b>{value:.2f} mS/cm</b>\n"
        f"⚠️ Threshold: {threshold} mS/cm\n"
        f"📉 Status: <b>TOO LOW</b>\n\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
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
    severity_emoji = {
        'High': '🔴',
        'Medium': '🟡',
        'Low': '🟢',
        'None': '✅'
    }.get(severity, '⚪')

    caption = (
        f"🔬 <b>DISEASE DETECTED</b>\n\n"
        f"🌴 Disease: <b>{disease_label.replace('_', ' ').title()}</b>\n"
        f"📊 Confidence: <b>{confidence:.1f}%</b>\n"
        f"{severity_emoji} Severity: <b>{severity}</b>\n"
        f"🌳 Tree ID: {tree_id}\n"
        f"📍 Block: {block_id}\n\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

    if image_path and os.path.exists(image_path):
        await send_photo(image_path, caption)
    else:
        await send_message(caption)

async def notify_relay_activated(relay_name: str, relay_pin: int, reason: str):
    """Notify when a relay is automatically activated"""
    message = (
        f"⚙️ <b>RELAY ACTIVATED</b>\n\n"
        f"🔌 Device: <b>{relay_name}</b>\n"
        f"📍 Pin: {relay_pin}\n"
        f"📋 Reason: {reason}\n"
        f"✅ Status: <b>ON</b>\n\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    await send_message(message)

async def notify_relay_deactivated(relay_name: str, relay_pin: int):
    """Notify when a relay is deactivated"""
    message = (
        f"⚙️ <b>RELAY DEACTIVATED</b>\n\n"
        f"🔌 Device: <b>{relay_name}</b>\n"
        f"📍 Pin: {relay_pin}\n"
        f"⏹️ Status: <b>OFF</b>\n\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
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
    """Test all alert types"""
    print("Testing Telegram bot...")

    print("1. Sending startup message...")
    await send_system_startup()
    await asyncio.sleep(1)

    print("2. Sending soil moisture alert...")
    await alert_soil_moisture(28.5)
    await asyncio.sleep(1)

    print("3. Sending temperature alert...")
    await alert_temperature(37.2)
    await asyncio.sleep(1)

    print("4. Sending EC level alert...")
    await alert_ec_level(0.9)
    await asyncio.sleep(1)

    print("5. Sending disease detection alert...")
    await alert_disease_detected(
        disease_label="ganoderma",
        confidence=87.5,
        severity="High",
        tree_id="A-14",
        block_id="Block-A"
    )
    await asyncio.sleep(1)

    print("6. Sending relay activated notification...")
    await notify_relay_activated("Drip Irrigation", 1, "Soil moisture < 40%")
    await asyncio.sleep(1)

    print("7. Sending daily summary...")
    await send_daily_summary(31.4, 74.2, 52.1, 1.6, 1, 2)

    print("\n✅ All tests complete! Check your Telegram.")

if __name__ == "__main__":
    asyncio.run(run_all_tests())