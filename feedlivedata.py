import asyncio
import sys
sys.path.insert(0, 'iriv_scripts')
from telegram_bot import alert_soil_moisture, alert_temperature, alert_disease_detected

async def demo():
    await alert_soil_moisture(32.0)
    await alert_temperature(36.1)
    await alert_disease_detected('ganoderma', 87.5, 'High', 'A-14', 'Block-A')

asyncio.run(demo())
print('Alerts sent! Check Telegram')