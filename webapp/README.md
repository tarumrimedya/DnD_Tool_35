# ⚔️ D&D 3.5e Tactical Cockpit & Universal Character Hub

Google Sheets tabanlı prototipin yerini alan; çevrimdışı (offline-first) çalışabilen, **3D fizik simülasyonlu zar atıcılı**, **Google Drive çift yönlü senkronizasyonlu** ve **bildirimsel kural motorlu** bağımsız modern D&D 3.5e web uygulaması.

---

## 🌟 Öne Çıkan Özellikler

1. **🎲 3D Fizik Simülasyonlu Animasyonlu Zar Atıcı (Three.js & Web Audio API):**
   - Saldırı zarı (d20), hasar zarları (d6, d8), kayıt zarları (saves) ve beceri zarlarında (skills) ekranda gerçekçi dönme, sekme ve çarpışma fizikli 3D zarlar yuvarlanır.
   - Doğal zar takırtı sesleri (Web Audio API ile harici mp3 dosyası gerektirmeden) sentezlenir.
   - Doğrudan taktik savaş paneline dökümü yansıtır ve kritik vuruşları (Threat / Auto-Crit) otomatik tespit eder.

2. **☁️ Google Drive Platformlar Arası Canlı Senkronizasyon (PC, Tablet, Telefon):**
   - Karakter verisi (`dnd35_character.json`) doğrudan kendi Google Drive'ınızda barındırılır.
   - Masaüstünden, tabletten veya cep telefonunuzdan aynı dosyaya bağlanabilir, değişiklikleri anında senkronize edebilirsiniz.
   - İnternet kesilse bile *Local-First* mimarisi sayesinde yerel tarayıcı belleğinde kesintisiz çalışmaya devam eder; bağlantı geldiğinde otomatik Drive'a aktarır.
   - Ayrıca tek tıkla **JSON İndir** ve **JSON Yükle** butonlarıyla manuel dosya transferi yapılabilir.

3. **⚙️ Bildirimsel Kural ve Modifiye Motoru (`rule_engine.js`):**
   - **Weapon Finesse:** Hafif veya finessable silahlarda (Rapier, Spiked Chain, Dagger vb.) DEX > STR ise saldırı zarında otomatik olarak Çeviklik (DEX) modifiyesini devreye sokar.
   - **Shadow Blade:** Shadow Hand duruşundayken ve Shadow Hand disiplini silahlar kuşanıldığında hasara DEX modifiyesini ekler.
   - **Power Attack:** Tutuş şekline göre (1-Hand için x1, 2-Hand için x2, Off-Hand için x0) hasarı orantılı ölçeklendirir.
   - **Bonus İstifleme (Stacking Rules):** *Enhancement, Morale, Luck, Insight, Competence, Armor, Shield, Natural Armor* türündeki bonuslarda çakışmaları önleyip yalnızca en yükseğini (`Math.max`) alır; *Dodge* ve *Untyped* bonusları toplar.

4. **🔮 Büyü & Tome of Battle Manevra Havuzu:**
   - **Sorcerer Slot Göstergesi:** `0 (Cantrip) 6/6`, `1st 4/8`, `2nd 2/6` formatında günlük harcanan ve kalan slot takibi.
   - **Readied Maneuvers:** Kuşanılan manevraları harcama (expended) ve tek tıkla **"Recover All"** ile yenileme.
   - **Aktif Duruş (Stance):** Punishing Stance (+1d6 Hasar, -2 AC), Island of Blades (Otomatik Flanking) gibi duruşları yönetir.

5. **🗑️ Test Verilerini Sıfırlama:**
   - Test aşaması bittiğinde **"Eşitle & Yedekle"** sekmesinden tek tıkla test karakterini sıfırlayıp temiz bir sayfa açabilirsiniz.

---

## 🚀 Nasıl Çalıştırılır?

1. **Bilgisayarda (PC / Mac / Linux):**
   - `webapp/index.html` dosyasına çift tıklayarak Chrome, Edge, Firefox veya Brave tarayıcısında açmanız yeterlidir. Herhangi bir sunucu kurulumu gerektirmez!

2. **Mobil / Tablette (Android / iOS):**
   - Dosyayı telefonunuza aktarabilir veya yerel ağınızda açıp tarayıcı menüsünden **"Ana Ekrana Ekle"** diyerek tam ekran bir mobil uygulama gibi kullanabilirsiniz.

---

## 📂 Dosya Mimarisi

- `index.html`: Responsive, sekmeli komuta merkezi arayüzü (Tailwind CSS).
- `rule_engine.js`: D&D 3.5e mekaniklerini ve stat grafiklerini işleten saf kural motoru.
- `dice3d.js`: Three.js ile çalışan 3D fizik simülasyonlu zar atıcı canvas katmanı.
- `gdrive_sync.js`: Google Identity Services & Google Drive REST API senkronizasyon modülü.
- `character_data.json`: Güncel 5. Seviye Sorcerer / Tome of Battle karakter şablonu.
- `master_db.json`: Silahlar, zırhlar, büyüler, manevralar ve featlerden oluşan kapsamlı kütüphane.
