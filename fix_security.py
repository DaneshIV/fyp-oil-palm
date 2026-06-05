# Run: python fix_security2.py
import os, re

filepath = "backend/routes/security.py"
content  = open(filepath, "r", encoding="utf-8").read()

# Use regex to find and replace regardless of line endings
pattern = r'    except Exception as e:\s+print\(f"Security inference error: \{e\}"\)\s+_, buf = cv2\.imencode\("\.jpg", frame, \[cv2\.IMWRITE_JPEG_QUALITY, 85\]\)\s+return FastAPIResponse\(\s+content=buf\.tobytes\(\), media_type="image/jpeg",\s+headers=\{"X-Threat-Type": threat_type, "X-Detection-Count": str\(len\(detections\)\), "Cache-Control": "no-cache"\}\s+\)'

replacement = '''    except Exception as e:
        print(f"Security inference error: {e}")

    # Save snapshot + DB + Telegram if threat detected
    if threat_type in ["person", "animal"]:
        try:
            import pymysql
            now_ts    = datetime.now()
            now_epoch = now_ts.timestamp()
            last      = _last_alert_time.get(threat_type, 0)
            if now_epoch - last >= COOLDOWN_SECONDS:
                _last_alert_time[threat_type] = now_epoch
                snap_name = "security_{}_{}_annotated.jpg".format(
                    threat_type, now_ts.strftime("%Y%m%d_%H%M%S"))
                snap_path = SNAPSHOT_DIR / snap_name
                _, snap_buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                with open(snap_path, "wb") as sf:
                    sf.write(snap_buf.tobytes())
                print("Snapshot saved: {}".format(snap_name))
                try:
                    best_conf = max([d["confidence"] for d in detections], default=0)
                    det_list  = ", ".join(["{} ({}%)".format(d["label"], d["confidence"]) for d in detections[:3]])
                    conn = pymysql.connect(
                        host=os.getenv("DB_HOST", "localhost"),
                        user=os.getenv("DB_USER", "root"),
                        password=os.getenv("DB_PASSWORD", "fyp1234"),
                        database=os.getenv("DB_NAME", "fyp_oil_palm")
                    )
                    cursor = conn.cursor()
                    cursor.execute(
                        "INSERT INTO alerts (alert_type, message, sensor_value, threshold, acknowledged) VALUES (%s, %s, %s, %s, %s)",
                        ("security_{}".format(threat_type),
                         "Security Alert: {} detected ({:.1f}% confidence) — {}".format(threat_type.upper(), best_conf, det_list),
                         best_conf, 25.0, False)
                    )
                    conn.commit()
                    conn.close()
                    print("DB saved: {}".format(threat_type))
                except Exception as db_err:
                    print("DB error: {}".format(db_err))
                try:
                    tg_dets = [{"class_name": d["label"], "confidence": d["confidence"]} for d in detections]
                    await send_security_telegram(threat_type, best_conf, tg_dets, str(snap_path))
                    print("Telegram sent: {}".format(threat_type))
                except Exception as tg_err:
                    print("Telegram error: {}".format(tg_err))
            else:
                remaining = int(COOLDOWN_SECONDS - (now_epoch - last))
                print("Cooldown: {}s remaining".format(remaining))
        except Exception as e:
            print("Alert error: {}".format(e))

    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return FastAPIResponse(
        content=buf.tobytes(), media_type="image/jpeg",
        headers={"X-Threat-Type": threat_type, "X-Detection-Count": str(len(detections)), "Cache-Control": "no-cache"}
    )'''

match = re.search(pattern, content, re.DOTALL)
if match:
    content = content[:match.start()] + replacement + content[match.end():]
    open(filepath, "w", encoding="utf-8").write(content)
    print("SUCCESS — Telegram + snapshot code added!")
else:
    print("ERROR — Regex pattern not found")
    # Try simpler search
    idx = content.find('print(f"Security inference error: {e}")')
    print(f"Found at index: {idx}")
    print("Nearby content:")
    print(repr(content[idx:idx+300]))