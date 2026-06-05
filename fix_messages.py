# Run: python fix_messages.py
# Fixes security + disease messages to be human-friendly

content = open('backend/routes/security.py', 'r', encoding='utf-8').read()

# Track changes
changes = 0

# Fix 1 — /detect endpoint message (two-line f-string)
old1 = 'f"Security Alert: {threat_type.upper()} detected "\n                        f"({best_conf*100:.1f}% confidence) — {det_summary}"'
new1 = '"Intruder spotted near the plantation — take immediate action." if threat_type == "person" else ("Animal detected near crops — check for potential damage." if threat_type == "animal" else "Unexpected motion detected — please verify the area.")'
if old1 in content:
    content = content.replace(old1, new1)
    changes += 1
    print("Fix 1 applied: /detect message")
else:
    print("Fix 1 not found — skipping")

# Fix 2 — /live-frame endpoint message
old2 = '"Security Alert: {} detected ({:.1f}% confidence) — {}".format(threat_type.upper(), best_conf, det_list)'
new2 = '("Intruder spotted near the plantation — take immediate action." if threat_type == "person" else ("Animal detected near crops — check for potential damage." if threat_type == "animal" else "Unexpected motion detected — please verify the area."))'
if old2 in content:
    content = content.replace(old2, new2)
    changes += 1
    print("Fix 2 applied: /live-frame message")
else:
    print("Fix 2 not found — skipping")

# Fix 3 — test alert message
old3 = '"msg":    "Security Alert: PERSON detected (87.5% confidence) — person (87.5%)"'
new3 = '"msg":    "Intruder spotted near the plantation — take immediate action."'
if old3 in content:
    content = content.replace(old3, new3)
    changes += 1
    print("Fix 3 applied: test alert message")
else:
    print("Fix 3 not found — skipping")

# Fix 4 — overlay text on camera frame
old4 = 'overlay = {"person":"!! PERSON DETECTED !!","animal":"ANIMAL DETECTED","clear":"CLEAR"}'
new4 = 'overlay = {"person":"INTRUDER DETECTED","animal":"ANIMAL NEARBY","clear":"AREA CLEAR"}'
if old4 in content:
    content = content.replace(old4, new4)
    changes += 1
    print("Fix 4 applied: camera overlay text")
else:
    print("Fix 4 not found — skipping")

open('backend/routes/security.py', 'w', encoding='utf-8').write(content)
print(f"\nDone! {changes}/4 fixes applied to security.py")

# Fix disease messages
content2 = open('backend/routes/alerts.py', 'r', encoding='utf-8').read() if __import__('os').path.exists('backend/routes/alerts.py') else ""

print("\nSecurity messages updated!")
print("Restart FastAPI to apply changes.")