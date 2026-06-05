# Run: python fix_bold_titles.py
content = open('iriv_scripts/telegram_bot.py', 'r', encoding='utf-8').read()
changes = 0

fixes = [
    # Soil moisture
    ('f"💧 Your soil is running dry!\n\n"',
     'f"💧 <b>Your soil is running dry!</b>\n\n"'),
    # Temperature
    ('f"🌡️ Temperature is getting too hot!\n\n"',
     'f"🌡️ <b>Temperature is getting too hot!</b>\n\n"'),
    # EC level
    ('f"🌱 Your soil needs nutrients!\n\n"',
     'f"🌱 <b>Your soil needs nutrients!</b>\n\n"'),
    # Relay activated
    ('f"{title}\n\n"',
     'f"<b>{title}</b>\n\n"'),
    # Relay deactivated
    ('f"{title}\n\n"',
     'f"<b>{title}</b>\n\n"'),
    # Disease
    ('f"{info[\'title\']}\n\n"',
     'f"<b>{info[\'title\']}</b>\n\n"'),
    # Security
    ('f"{title}\n\n"',
     'f"<b>{title}</b>\n\n"'),
]

for old, new in fixes:
    if old in content:
        content = content.replace(old, new, 1)
        changes += 1
        print(f"Fixed: {old[:40]}")

open('iriv_scripts/telegram_bot.py', 'w', encoding='utf-8').write(content)
print(f"\nDone! {changes} fixes applied")