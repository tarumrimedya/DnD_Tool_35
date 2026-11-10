# ⚔️ D&D 3.5e Tactical Cockpit & Universal Character Hub

Çevrimdışı (offline-first) çalışabilen, **3D fizik simülasyonlu zar atıcılı**, **Supabase (Google girişi) bulut senkronizasyonlu ve çok oyunculu kampanyalı** ve **bildirimsel kural motorlu** bağımsız modern D&D 3.5e web uygulaması.

---

## ⚡ Kurulum

1. **Projeyi Vercel'e aktarın:** depoyu fork'layın ve [Vercel Dashboard](https://vercel.com/new) üzerinden **Import** edin. `main` dalı Production'a çıkar.
2. **Supabase:** projenin URL ve anon anahtarı `supabase_auth.js` içindedir; Google girişi Supabase Auth ile çalışır (preview adresleri Supabase'in izinli yönlendirme listesinde olmalıdır).
3. **Tabloları kurun:** Supabase **SQL Editor**'da birer kez çalıştırın (tekrar çalıştırmak zararsızdır):
   - `tools/supabase/campaign_packs.sql`: kampanyanın ortak kural DB'si (Campaign DB).
   - `tools/supabase/user_hub_state.sql`: kullanıcının kampanyaları ve notları (yalnızca sahibi okur/yazar).
4. **Kullanım:** Google ile giriş yapan her cihazda karakterler, kampanyalar ve kampanya notları otomatik eşitlenir. Giriş yapmadan "Run Locally (Offline Mode)" ile yalnızca tarayıcıda çalışır.

---

## 🌟 Öne Çıkan Özellikler

1. **⚡ Supabase Bulut Senkronizasyonu (`supabase_auth.js`):**
   - Karakterler (kendi `customDb`'leriyle) `characters`, DM'in kampanyaları ve oyuncu üyelikleri `campaigns` / `campaign_members`, kampanyanın ortak kural paketleri `campaign_packs`, kullanıcının kampanyaları ve notları `user_hub_state` tablosunda tutulur; Realtime ile canlı güncellenir.
   - İnternet kesilse bile *Local-First* mimarisi sayesinde yerel tarayıcı belleğinde (`localStorage`) çalışmaya devam eder.
   - Elle yedek: karakter kâğıdında karakter / DB dışa aktarma, Hub'da **🏰 Campaign** dışa/içe aktarma (paketler, notlar, alt kampanyalar, karakterler).

2. **🤖 Güncel Gemini 2.5 & 3.x AI Kural Asistanı (`rule_master.js`):**
   - `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`, `gemini-2.5-flash-lite` ve `gemini-2.5-flash` modelleriyle serbest metin veya kural açıklamalarını tek tıkla 29 sütunlu D&D 3.5e Master DB formatına ayrıştırır.
   - Parent-Child (ebeveyn eşya ve alt güçleri) ilişkili karmaşık büyülü eşyaları tek seferde ayrıştırıp envantere ve kuşanılan yuvalara ekler.

3. **⚡ 3D Fizik Simülasyonlu Animasyonlu Zar Atıcı (`dice3d.js`):**
   - Saldırı zarı (d20), hasar zarları (d6, d8), kayıt zarları (saves) ve beceri zarlarında (skills) ekranda gerçekçi dönme, sekme ve çarpışma fizikli 3D zarlar yuvarlanır.

4. **⚙️ Bildirimsel Kural ve Modifiye Motoru (`rule_engine.js`):**
   - **14 Vücut Yuvası (Body Slots) & Dinamik Ekipman:** Kuşanılan zırh, kalkan ve tılsımların bonuslarını otomatik hesaplar.
   - **RAW Bonus İstifleme (Stacking Rules):** *Enhancement, Morale, Luck, Insight, Competence, Armor, Shield, Natural Armor, Deflection, Resistance* türündeki bonuslarda çakışmaları önleyip yalnızca en yükseğini (`Math.max`) alır; *Dodge* ve *Untyped* bonusları toplar.

---

## 📂 Dosya Mimarisi

- `webapp/index.html`: Responsive, sekmeli karakter kâğıdı; `webapp/hub.html`: kampanya ve karakter merkezi (Hub).
- `webapp/supabase_auth.js`: Google girişi, bulut tabloları ve Realtime abonelikleri.
- `webapp/campaign_db.js`: Campaign DB paketleri, kampanya bundle'ı ve Hub state birleştirmesi (saf fonksiyonlar).
- `webapp/rule_engine.js`: D&D 3.5e RAW mekaniklerini ve bonus istifleme kurallarını işleten kural motoru.
- `webapp/rule_master.js`: 29 sütunlu Master DB yöneticisi ve Gemini 2.5/3.x AI ayrıştırıcı.
- `webapp/dice3d.js`: Three.js ile çalışan 3D fizik simülasyonlu zar atıcı katmanı.
- `webapp/character_data.json` & `webapp/master_db.json`: Varsayılan karakter ve 29 sütunlu Master DB veri tabanı.
