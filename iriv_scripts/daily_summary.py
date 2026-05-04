import os
import sys
import asyncio
import logging
import schedule
import time
from datetime import datetime, date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def get_daily_stats():
    try:
        import pymysql
        conn = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "fyp1234"),
            database=os.getenv("DB_NAME", "fyp_oil_palm")
        )
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        today  = date.today().isoformat()

        cursor.execute(
            "SELECT "
            "ROUND(AVG(temperature), 1) AS avg_temp, "
            "ROUND(AVG(humidity), 1) AS avg_humidity, "
            "ROUND(AVG(soil_moisture), 1) AS avg_soil, "
            "ROUND(AVG(ec_level), 2) AS avg_ec, "
            "COUNT(*) AS total_readings, "
            "ROUND(MAX(temperature), 1) AS max_temp, "
            "ROUND(MIN(soil_moisture), 1) AS min_soil "
            "FROM sensor_readings WHERE DATE(timestamp) = %s",
            (today,)
        )
        sensors = cursor.fetchone()

        cursor.execute(
            "SELECT COUNT(*) AS total, "
            "SUM(CASE WHEN disease_label = %s THEN 1 ELSE 0 END) AS ganoderma, "
            "SUM(CASE WHEN disease_label = %s THEN 1 ELSE 0 END) AS unhealthy, "
            "SUM(CASE WHEN disease_label = %s THEN 1 ELSE 0 END) AS healthy, "
            "SUM(CASE WHEN disease_label = %s THEN 1 ELSE 0 END) AS immature "
            "FROM disease_detections WHERE DATE(timestamp) = %s",
            ("ganoderma", "unhealthy", "healthy", "immature", today)
        )
        diseases = cursor.fetchone()

        cursor.execute(
            "SELECT COUNT(*) AS total, "
            "SUM(CASE WHEN acknowledged = FALSE THEN 1 ELSE 0 END) AS unacknowledged, "
            "SUM(CASE WHEN alert_type LIKE %s THEN 1 ELSE 0 END) AS security "
            "FROM alerts WHERE DATE(triggered_at) = %s",
            ("security_%", today)
        )
        alerts = cursor.fetchone()

        cursor.execute(
            "SELECT COUNT(*) AS total FROM alerts "
            "WHERE DATE(triggered_at) = %s AND alert_type = %s",
            (today, "relay_activated")
        )
        relays = cursor.fetchone()

        conn.close()
        return {
            "sensors":  sensors  or {},
            "diseases": diseases or {},
            "alerts":   alerts   or {},
            "relays":   relays   or {},
            "date":     today
        }

    except Exception as e:
        logger.error(f"Failed to get daily stats: {e}")
        return None


def build_summary_message(stats):
    if not stats:
        return "Daily summary failed - could not retrieve data."

    s  = stats["sensors"]
    d  = stats["diseases"]
    a  = stats["alerts"]
    r  = stats["relays"]
    dt = stats["date"]

    ganoderma_count = d.get("ganoderma") or 0
    unack_alerts    = a.get("unacknowledged") or 0
    security_alerts = a.get("security") or 0

    if ganoderma_count > 0:
        status       = "NEEDS ATTENTION"
        status_emoji = "🔴"
    elif unack_alerts > 3:
        status       = "MONITOR CLOSELY"
        status_emoji = "🟡"
    else:
        status       = "ALL GOOD"
        status_emoji = "🟢"

    avg_temp = s.get("avg_temp") or 0
    min_soil = s.get("min_soil") or 0
    temp_icon = "🔥" if avg_temp > 35 else "🌡"
    soil_icon = "⚠" if min_soil < 40 else "🌱"

    message = (
        "📊 <b>DAILY PLANTATION SUMMARY</b>\n"
        f"📅 {dt}\n"
        f"{status_emoji} Status: <b>{status}</b>\n\n"
        "🌡 <b>Environmental Data</b>\n"
        f"{temp_icon} Avg Temperature:   <b>{s.get(chr(39)+'avg_temp'+chr(39), 'N/A')}C</b>\n"
        f"💧 Avg Humidity:     <b>{s.get(chr(39)+'avg_humidity'+chr(39), 'N/A')}%</b>\n"
        f"{soil_icon} Avg Soil Moisture: <b>{s.get(chr(39)+'avg_soil'+chr(39), 'N/A')}%</b>\n"
        f"⚡ Avg EC Level:    <b>{s.get(chr(39)+'avg_ec'+chr(39), 'N/A')} mS/cm</b>\n"
        f"📈 Total Readings:  <b>{s.get(chr(39)+'total_readings'+chr(39), 0)}</b>\n\n"
        "🔬 <b>Disease Detections</b>\n"
        f"📊 Total Scans:  <b>{d.get(chr(39)+'total'+chr(39), 0)}</b>\n"
        f"✅ Healthy:      <b>{d.get(chr(39)+'healthy'+chr(39), 0)}</b>\n"
        f"🔴 Ganoderma:    <b>{ganoderma_count}</b>\n"
        f"🟡 Unhealthy:    <b>{d.get(chr(39)+'unhealthy'+chr(39), 0)}</b>\n"
        f"🔵 Immature:     <b>{d.get(chr(39)+'immature'+chr(39), 0)}</b>\n\n"
        "🚨 <b>Alerts and Automation</b>\n"
        f"⚡ Total Alerts:      <b>{a.get(chr(39)+'total'+chr(39), 0)}</b>\n"
        f"📋 Unacknowledged:    <b>{unack_alerts}</b>\n"
        f"🛡 Security Events:   <b>{security_alerts}</b>\n"
        f"🔌 Relay Activations: <b>{r.get(chr(39)+'total'+chr(39), 0)}</b>\n\n"
        "🌴 <b>Oil Palm IoT System</b>\n"
        "🌐 Dashboard: app.project2030.me\n"
        f"🕐 Generated: {datetime.now().strftime(chr(39)+'%H:%M:%S'+chr(39))}"
    )
    return message


async def send_daily_summary_task():
    logger.info("Sending daily summary...")
    from telegram_bot import send_message
    stats   = get_daily_stats()
    message = build_summary_message(stats)
    await send_message(message)
    logger.info("Daily summary sent!")


def run_summary():
    asyncio.run(send_daily_summary_task())


def main():
    logger.info("=" * 50)
    logger.info("Daily Summary Scheduler Started")
    logger.info("Scheduled: midnight (00:00) every day")
    logger.info("=" * 50)

    schedule.every().day.at("00:00").do(run_summary)

    if len(sys.argv) > 1 and sys.argv[1] == "--now":
        logger.info("Manual trigger - sending now...")
        run_summary()
        return

    logger.info("Waiting for midnight... (use --now to test immediately)")
    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == "__main__":
    main()
