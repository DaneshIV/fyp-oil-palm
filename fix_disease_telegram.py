# Run: python fix_disease_telegram2.py
import re

content = open('iriv_scripts/telegram_bot.py', 'r', encoding='utf-8').read()

# Use regex to match regardless of whitespace differences
pattern = r"    severity_emoji = \{.*?\}\.get\(severity, '⚪'\)\s+caption = \(.*?f\"🕐 \{datetime\.now\(\)\.strftime\('%Y-%m-%d %H:%M:%S'\)\}\"\s+\)"

replacement = '''    disease_info = {
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
        f"{info['title']}\\n\\n"
        f"{info['desc']}\\n\\n"
        f"📍 Tree {tree_id} — Block {block_id}\\n"
        f"🕐 {datetime.now().strftime('%d %b %Y, %I:%M %p')}\\n\\n"
        f"💡 {info['action']}"
    )'''

match = re.search(pattern, content, re.DOTALL)
if match:
    content = content[:match.start()] + replacement + content[match.end():]
    open('iriv_scripts/telegram_bot.py', 'w', encoding='utf-8').write(content)
    print("SUCCESS — Disease Telegram message updated!")
else:
    print("ERROR — Regex pattern not found")
    # Show what we have
    idx = content.find("severity_emoji")
    print("Raw content around severity_emoji:")
    print(repr(content[idx:idx+400]))