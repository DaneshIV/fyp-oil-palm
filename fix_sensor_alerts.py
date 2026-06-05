# Run: python fix_sensor_alerts.py
content = open('iriv_scripts/telegram_bot.py', 'r', encoding='utf-8').read()
changes = 0

# Fix soil moisture alert
old1 = """    message = (
        f"🚨 <b>SOIL MOISTURE ALERT</b>\\n\\n"
        f"📍 Current Value: <b>{value:.1f}%</b>\\n"
        f"⚠️ Threshold: {threshold}%\\n"
        f"💧 Status: <b>CRITICALLY LOW</b>\\n\\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    await send_message(message, reply_markup=keyboard)"""

new1 = """    message = (
        f"💧 Your soil is running dry!\\n\\n"
        f"Soil moisture has dropped to {value:.1f}%, which is below the safe minimum of {threshold}%. "
        f"Your oil palm trees may be experiencing water stress. "
        f"The drip irrigation system should be activated as soon as possible.\\n\\n"
        f"📍 Oil Palm Plantation — BLK_A\\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
    )
    await send_message(message, reply_markup=keyboard)"""

if old1 in content:
    content = content.replace(old1, new1)
    changes += 1
    print("Fix 1: soil moisture alert")
else:
    print("Fix 1 not found")

# Fix temperature alert
old2 = """    message = (
        f"🌡️ <b>TEMPERATURE ALERT</b>\\n\\n"
        f"🌡️ Current Value: <b>{value:.1f}°C</b>\\n"
        f"⚠️ Threshold: {threshold}°C\\n"
        f"🔥 Status: <b>TOO HIGH</b>\\n\\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    await send_message(message, reply_markup=keyboard)"""

new2 = """    message = (
        f"🌡️ Temperature is getting too hot!\\n\\n"
        f"The temperature has risen to {value:.1f}°C, exceeding the safe limit of {threshold}°C. "
        f"Prolonged heat stress can reduce oil palm yield and damage young fronds. "
        f"Consider activating the mist cooling system.\\n\\n"
        f"📍 Oil Palm Plantation — BLK_A\\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
    )
    await send_message(message, reply_markup=keyboard)"""

if old2 in content:
    content = content.replace(old2, new2)
    changes += 1
    print("Fix 2: temperature alert")
else:
    print("Fix 2 not found")

# Fix EC alert
old3 = """    message = (
        f"⚡ <b>EC LEVEL ALERT</b>\\n\\n"
        f"⚡ Current Value: <b>{value:.2f} mS/cm</b>\\n"
        f"⚠️ Threshold: {threshold} mS/cm\\n"
        f"📉 Status: <b>TOO LOW</b>\\n\\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    await send_message(message, reply_markup=keyboard)"""

new3 = """    message = (
        f"🌱 Your soil needs nutrients!\\n\\n"
        f"The soil electrical conductivity has dropped to {value:.2f} mS/cm, below the recommended minimum of {threshold} mS/cm. "
        f"This indicates low nutrient levels in the soil which can reduce oil palm growth and fruit production. "
        f"Activate the fertilizer pump to restore soil health.\\n\\n"
        f"📍 Oil Palm Plantation — BLK_A\\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
    )
    await send_message(message, reply_markup=keyboard)"""

if old3 in content:
    content = content.replace(old3, new3)
    changes += 1
    print("Fix 3: EC level alert")
else:
    print("Fix 3 not found")

# Fix humidity alert if exists
old4 = """    message = (
        f"💦 <b>HUMIDITY ALERT</b>\\n\\n"
        f"💦 Current Value: <b>{value:.1f}%</b>\\n"
        f"⚠️ Threshold: {threshold}%\\n"
        f"📉 Status: <b>TOO LOW</b>\\n\\n"
        f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    await send_message(message, reply_markup=keyboard)"""

new4 = """    message = (
        f"💦 Humidity levels are too low!\\n\\n"
        f"Air humidity has dropped to {value:.1f}%, below the safe minimum of {threshold}%. "
        f"Low humidity can increase water loss in oil palm leaves and stress the crop. "
        f"Consider activating mist cooling or irrigation.\\n\\n"
        f"📍 Oil Palm Plantation — BLK_A\\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
    )
    await send_message(message, reply_markup=keyboard)"""

if old4 in content:
    content = content.replace(old4, new4)
    changes += 1
    print("Fix 4: humidity alert")
else:
    print("Fix 4 not found (skipping)")

open('iriv_scripts/telegram_bot.py', 'w', encoding='utf-8').write(content)
print(f"\nDone! {changes} fixes applied")