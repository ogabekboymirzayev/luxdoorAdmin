content = open('/var/www/luxdoorsBot/scraper.py').read()

old = '''        try:
            data = ai_parse(post["text"])
            print(f"📦 {data['nameUz']} | {data['price']} | {data.get('categoryUz')}")
            send_to_site(data, post["image"])
            processed_ids.add(post["id"])
            save_state(processed_ids)
            time.sleep(0.5)
        except Exception as e:
            print(f"❌ Xato: {e}")
if not data:
                print(f"⏭️ Skip #{post['id']}")
                processed_ids.add(post["id"])
                save_state(processed_ids)
                continue'''

new = '''        try:
            data = ai_parse(post["text"])
            if not data:
                print(f"⏭️ Skip #{post['id']}")
                processed_ids.add(post["id"])
                save_state(processed_ids)
                continue
            print(f"📦 {data['nameUz']} | {data['price']} | {data.get('categoryUz')}")
            send_to_site(data, post["image"])
            processed_ids.add(post["id"])
            save_state(processed_ids)
            time.sleep(0.5)
        except Exception as e:
            print(f"❌ Xato: {e}")'''

if old in content:
    open('/var/www/luxdoorsBot/scraper.py', 'w').write(content.replace(old, new))
    print("✅ Tuzatildi!")
else:
    print("❌ Topilmadi")
