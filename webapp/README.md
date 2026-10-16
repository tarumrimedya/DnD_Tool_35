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
