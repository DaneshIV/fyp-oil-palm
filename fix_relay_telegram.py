# Run: python fix_relay_telegram.py
content = open('iriv_scripts/telegram_bot.py', 'r', encoding='utf-8').read()
changes = 0

# Fix relay activated
old1 = """    message = (
        f\"⚙️ <b>RELAY ACTIVATED</b>\\n\\n\"
        f\"🔌 Device: <b>{relay_name}</b>\\n\"
        f\"📍 Pin: {relay_pin}\\n\"
        f\"📋 Reason: {str(reason).replace(chr(60), chr(40)).replace(chr(62), chr(41))}\\n\"
        f\"✅ Status: <b>ON</b>\\n\\n\"
        f\"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\"
    )
    await send_message(message)"""

new1 = """    # Human-friendly relay messages
    relay_actions = {
        "Drip Irrigation":  ("💧 Irrigation Started", "Soil moisture has dropped below the safe threshold. The drip irrigation system has been automatically activated to water your oil palm trees."),
        "Mist Pump":        ("🌫️ Mist Cooling Activated", "Temperature has exceeded the safe limit. The mist cooling system has been turned on to protect your crops from heat stress."),
        "NPK-A Pump":       ("🌱 Fertilizer Pump A Activated", "Soil EC level has dropped below the recommended range. Fertilizer Pump A has been activated to replenish soil nutrients."),
        "NPK-B Pump":       ("🌱 Fertilizer Pump B Activated", "Soil EC level has dropped below the recommended range. Fertilizer Pump B has been activated to replenish soil nutrients."),
        "NPK-C Pump":       ("🌱 Fertilizer Pump C Activated", "Soil EC level has dropped below the recommended range. Fertilizer Pump C has been activated to replenish soil nutrients."),
    }
    title, desc = relay_actions.get(relay_name, (f"⚙️ {relay_name} Activated", f"{relay_name} has been automatically activated by the system."))
    message = (
        f"{title}\\n\\n"
        f"{desc}\\n\\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}\\n"
        f"🤖 Triggered automatically by sensor threshold rule"
    )
    await send_message(message)"""

if old1 in content:
    content = content.replace(old1, new1)
    changes += 1
    print("Fix 1 applied: relay activated message")
else:
    print("Fix 1 not found")

# Fix relay deactivated
old2 = """    message = (
        f\"⚙️ <b>RELAY DEACTIVATED</b>\\n\\n\"
        f\"🔌 Device: <b>{relay_name}</b>\\n\"
        f\"📍 Pin: {relay_pin}\\n\"
        f\"⏹️ Status: <b>OFF</b>\\n\\n\"
        f\"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\"
    )
    await send_message(message)"""

new2 = """    relay_names = {
        "Drip Irrigation": "💧 Irrigation Stopped",
        "Mist Pump":       "🌫️ Mist Cooling Stopped",
        "NPK-A Pump":      "🌱 Fertilizer Pump A Stopped",
        "NPK-B Pump":      "🌱 Fertilizer Pump B Stopped",
        "NPK-C Pump":      "🌱 Fertilizer Pump C Stopped",
    }
    title = relay_names.get(relay_name, f"⚙️ {relay_name} Stopped")
    message = (
        f"{title}\\n\\n"
        f"Sensor readings have returned to normal levels. {relay_name} has been automatically turned off.\\n\\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
    )
    await send_message(message)"""

if old2 in content:
    content = content.replace(old2, new2)
    changes += 1
    print("Fix 2 applied: relay deactivated message")
else:
    print("Fix 2 not found")

open('iriv_scripts/telegram_bot.py', 'w', encoding='utf-8').write(content)
print(f"\nDone! {changes}/2 fixes applied")