# ⚔️ D&D 3.5e Tactical Cockpit & Universal Character Hub

Çevrimdışı (offline-first) çalışabilen, **3D fizik simülasyonlu zar atıcılı**, **Vercel Kişisel Bulut & Upstash KV veritabanı senkronizasyonlu**, **`APP_PIN` şifre korumalı** ve **29 sütunlu bildirimsel kural motorlu** bağımsız modern D&D 3.5e web uygulaması.

---

## ⚡ Kendi Özel (Private) Vercel Uygulamanızı & Veritabanınızı Kurma (1 Dakika)

Bu uygulama herkese açık ortak bir sunucu yerine **her kullanıcının kendi ücretsiz Vercel hesabına kurabileceği kişiye özel (private)** bir mimariyle tasarlanmıştır:

1. **Projeyi Vercel'e Aktarın:**
   - Bu GitHub deposunu kendi hesabınıza **Fork**'layın (veya indirin) ve [Vercel Dashboard](https://vercel.com/new) üzerinden **Import** edin.
2. **Ücretsiz Veritabanı (Upstash KV / Redis) Bağlayın:**
   - Vercel proje panelinizde üst menüden **Storage ➔ Create Database ➔ Upstash (Serverless Redis / KV)** seçeneğine tıklayın ve oluşturduğunuz veritabanını projenize bağlayın (**Connect Project**).
   - *Not:* Vercel, `KV_REST_API_URL` ve `KV_REST_API_TOKEN` ortam değişkenlerini otomatik olarak ekleyecektir.
3. **Uygulamayı Şifreleyin (`APP_PIN`):**
   - Uygulamanıza sizden başkasının erişememesi için Vercel'de **Settings ➔ Environment Variables** menüsüne gidin:
     - **Key:** `APP_PIN`
     - **Value:** `KendiGizliŞifreniz` (Örn: `1453` veya güçlü bir parola)
   - Kaydedip **Deployments ➔ Redeploy** yapın.
4. **PC, Telefon ve Tabletten Kullanın:**
   - Kendi Vercel linkinize girdiğinizde uygulama **🔒 Kişisel Kasa Koruması** ekranıyla açılır. Şifrenizi bir kez girdiğinizde hem **Karakteriniz** hem de **Master DB (29 Sütun Kütüphane)** verileriniz tüm cihazlarınız arasında otomatik eşitlenir!

---

## 🌟 Öne Çıkan Özellikler

1. **⚡ Vercel Serverless + Upstash KV Tam Veritabanı Senkronizasyonu (`api/storage.js` & `gdrive_sync.js`):**
   - Yalnızca karakter kağıdını değil, **Master DB (29 sütunlu eşya, büyü, manevra, feat kütüphanesi)** üzerinde yaptığınız tüm ekleme ve düzenlemeleri de tek atomik pakette buluta kaydeder.
   - İnternet kesilse bile *Local-First* mimarisi sayesinde yerel tarayıcı belleğinde (`localStorage`) kesintisiz çalışmaya devam eder.
   - Ayrıca tek tıkla **📦 Tam Paket İndir (Karakter + Master DB)**, **Sadece Karakter İndir** ve **JSON Yükle** butonlarıyla manuel yedekleme yapılabilir.

2. **🤖 Güncel Gemini 2.5 & 3.x AI Kural Asistanı (`rule_master.js`):**
   - `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`, `gemini-2.5-flash-lite` ve `gemini-2.5-flash` modelleriyle serbest metin veya kural açıklamalarını tek tıkla 29 sütunlu D&D 3.5e Master DB formatına ayrıştırır.
   - Parent-Child (ebeveyn eşya ve alt güçleri) ilişkili karmaşık büyülü eşyaları tek seferde ayrıştırıp envantere ve kuşanılan yuvalara ekler.

3. **🎲 3D Fizik Simülasyonlu Animasyonlu Zar Atıcı (`dice3d.js`):**
   - Saldırı zarı (d20), hasar zarları (d6, d8), kayıt zarları (saves) ve beceri zarlarında (skills) ekranda gerçekçi dönme, sekme ve çarpışma fizikli 3D zarlar yuvarlanır.

4. **⚙️ Bildirimsel Kural ve Modifiye Motoru (`rule_engine.js`):**
   - **14 Vücut Yuvası (Body Slots) & Dinamik Ekipman:** Kuşanılan zırh, kalkan ve tılsımların bonuslarını otomatik hesaplar.
   - **RAW Bonus İstifleme (Stacking Rules):** *Enhancement, Morale, Luck, Insight, Competence, Armor, Shield, Natural Armor, Deflection, Resistance* türündeki bonuslarda çakışmaları önleyip yalnızca en yükseğini (`Math.max`) alır; *Dodge* ve *Untyped* bonusları toplar.

---

## 📂 Dosya Mimarisi

- `api/storage.js`: Vercel Serverless veritabanı (Upstash KV) ve `APP_PIN` güvenlik doğrulaması uç noktası.
- `webapp/index.html`: Responsive, sekmeli komuta merkezi arayüzü ve Kişisel Kasa Kilit ekranı.
- `webapp/rule_engine.js`: D&D 3.5e RAW mekaniklerini ve bonus istifleme kurallarını işleten kural motoru.
- `webapp/rule_master.js`: 29 sütunlu Master DB yöneticisi ve Gemini 2.5/3.x AI ayrıştırıcı.
- `webapp/gdrive_sync.js`: Vercel CloudSync (Upstash KV + `APP_PIN` + yerel yedek) senkronizasyon modülü.
- `webapp/dice3d.js`: Three.js ile çalışan 3D fizik simülasyonlu zar atıcı katmanı.
- `webapp/character_data.json` & `webapp/master_db.json`: Varsayılan karakter ve 29 sütunlu Master DB veri tabanı.
