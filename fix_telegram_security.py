# Run: python fix_telegram_security.py
content = open('backend/routes/security.py', 'r', encoding='utf-8').read()

old = '''        caption = (
            f"{emoji} <b>SECURITY ALERT — {level}</b>\\n\\n"
            f"🎯 Threat: <b>{threat_type.upper()}</b>\\n"
            f"📊 Confidence: <b>{confidence:.1f}%</b>\\n"
            f"🔍 Detected:\\n{det_summary}\\n\\n"
            f"📸 Snapshot attached\\n"
            f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\\n\\n"
            f"⚡ Triple Layer Security — YOLOv8n"
        )'''

new = '''        # Human-friendly messages
        if threat_type == "person":
            title   = "🚨 Intruder Alert"
            action  = "An unrecognised person has been spotted near your plantation. Please inspect the area immediately or contact local authorities if needed."
        elif threat_type == "animal":
            title   = "⚠️ Animal Activity Detected"
            action  = "An animal has been detected near your crops. Check the area for any damage to your oil palm trees."
        else:
            title   = "📋 Motion Detected"
            action  = "Unexpected motion was detected near your plantation. Please verify the area when possible."

        caption = (
            f"{title}\\n\\n"
            f"{action}\\n\\n"
            f"📍 Location: Oil Palm Plantation — BLK_A\\n"
            f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}\\n"
            f"📸 Snapshot attached for your reference"
        )'''

if old in content:
    content = content.replace(old, new)
    open('backend/routes/security.py', 'w', encoding='utf-8').write(content)
    print("SUCCESS — Telegram security message updated!")
else:
    print("ERROR — Pattern not found")
    idx = content.find("caption = (")
    print(f"Found 'caption = (' at index: {idx}")
    print("Context:", repr(content[idx:idx+300]))