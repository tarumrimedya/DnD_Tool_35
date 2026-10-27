# HUB & KARAKTER KÂĞIDI ENTEGRASYON DOKÜMANI (HANDOVER SPECIFICATION)

**Tarih:** 2026-10-23  
**Gönderen:** Hub Geliştirme Oturumu  
**Alıcı:** Ana Karakter Sayfası (`index.html`) Geliştirme Oturumu  

---

## 1. MİMARİ VİZYON VE ROL DAĞILIMI
* **HUB (`hub.html`):** 
  - Yalnızca Bestiary canavarları için değil; **DM'in ve oyuncunun tüm karakterlerini (PC & NPC), partilerini, zindan/encounter gruplarını ve kampanyalarını yönettiği ana kontrol merkezidir.**
  - Karakterlerin anlık can (HP), geçici HP, AC, inisiyatif, kurtarma atışları ve durumlarını DM masası olarak topluca izler.
  - Bir karaktere tıklandığında tam statblock'u (`fullData`) ile birlikte ana karakter kâğıdına (`index.html/?id=...`) aktarır.
* **KARAKTER KÂĞIDI (`index.html`):**
  - Seçilen tekil karakterin (ister oyuncu, ister canavar, ister müttefik NPC olsun) D&D 3.5e RAW kural motoru, savaş kokpiti, büyü/manevra yönetim alanı ve ayrıntılı profilidir.

---

## 2. ORTAK VERİ KONTRATI (DATA CONTRACT)
Hub, karakter kâğıdına veri gönderirken veya `localStorage` (`dnd35_character`, `dnd35_hub_db`) üzerine yazarken şu standart şemayı garanti eder:

```json
{
  "id": "char_1234567890",
  "_hubId": "char_1234567890",
  "isNpc": true,
  "name": "Red Dragon (Wyrm)",
  "race": "Dragon (Fire)",
  "classes": "Dragon 31 HD",
  "level": 23,
  "cr": "23",
  "hp": { "current": 449, "max": 449, "baseMax": 449, "temp": 0 },
  "ac": { "total": 41, "touch": 6, "flatFooted": 41 },
  "abilities": { "str": 39, "dex": 10, "con": 27, "int": 22, "wis": 23, "cha": 22 },
  "saves": { "fort": { "total": 25 }, "ref": { "total": 17 }, "will": { "total": 23 } },
  "weapons": [
    { "name": "Bite", "bonus": 41, "dice": "4d6+14", "category": "Natural" },
    { "name": "Claw", "bonus": 39, "dice": "2d8+7", "category": "Natural" }
  ],
  "feats": [
    { "name": "Power Attack", "category": "Feat", "benefit": "Trade BAB for damage." },
    { "name": "Multiattack", "category": "Feat", "benefit": "Secondary natural attacks at -2." }
  ],
  "specialAbilities": [
    { "name": "Breath Weapon", "type": "Su", "benefit": "60-ft. cone of fire, Reflex half." },
    { "name": "Damage Reduction 15/Magic", "type": "Su", "benefit": "Takes 15 less damage unless magic." },
    { "name": "Spell Resistance 28", "type": "Ex", "benefit": "SR 28." },
    { "name": "Fire Subtype (Immunity)", "type": "Ex", "benefit": "Immune to fire, vulnerability to cold." }
  ],
  "spellcasting": {
    "cl": 13,
    "ability": "cha",
    "statName": "CHA",
    "primaryClass": "Sorcerer",
    "slots": [
      { "level": 0, "daily": 6, "used": 0 },
      { "level": 1, "daily": 8, "used": 0 }
    ],
    "knownSpells": [
      { "name": "Shield", "level": 1, "school": "Abjuration", "description": "+4 shield bonus to AC." },
      { "name": "Fireball", "level": 3, "school": "Evocation", "description": "1d6 fire/level." }
    ]
  }
}
```

---

## 3. `index.html` ÜZERİNDE YAPILMASI GEREKEN GÜNCELLEMELER

### GÖREV 1: `tab-core` (Karakter & Beceriler) - Hünerler & Özel Yetenekler Vitrini
* **Sorun:** Karakter sayfasında feat'ler yalnızca `character.levelProgression` tablosunda seviye seviye çizilmektedir. Canavarlarda (ve seviye tablosu olmayan NPC'lerde) bu alan boş kaldığı için `character.feats` ve `character.specialAbilities` dizilerindeki veriler ekranda hiç görünmemektedir.
* **Gereksinim:**
  - `tab-core` içerisine, Seviye Tablosunun hemen üzerine (veya `character.isNpc === true` ise tablonun yerine geçecek ergonomik bir düzende):
    1. **Hünerler (Feats) Kartı:** `character.feats` içindeki tüm hünerleri rozet/çip olarak listeleyen, tıklandığında kural detay modalını açan bir kart.
    2. **Özel Yetenekler & Irksal Nitelikler Kartı:** `character.specialAbilities` içindeki Ex/Su/Sp yetenekleri tür rozetleriyle listeleyen bir kart.

### GÖREV 2: `tab-combat` (Savaş Kokpiti) - Savunma & Eylemler
* **Gereksinim:**
  - Canavarın Hasar Azaltımı (DR: ör. *15/Magic*), Büyü Direnci (SR: ör. *28*) ve Bağışıklıkları (Fire Immunity), Savaş Kokpitindeki Savunma sütununda canlı bir özet kartı olarak gösterilmelidir.
  - Canavarın nefes saldırısı veya aktif yetenekleri `combatPins.defense` / `combatPins.offense_melee` pinleri arasına otomatik taşınmalıdır.

### GÖREV 3: `tab-spells` (Büyü Sekmesi) - Caster Level (CL) Koruması
* **Gereksinim:**
  - `getCasterInfo()` ve `calculateSorcererSlots()` fonksiyonları, `character.isNpc === true` olduğunda `spellcasting.cl` değerini ve slotlarını (1-20 sınıf tablosu boş diye) sıfırlamamalı; canavarın statblock'undaki orijinal CL değerini korumalıdır.

### GÖREV 4: Veri Yükleme ve Güvenlik (`loadInitialData`)
* **Gereksinim:**
  - Hub'dan `/?id=char_xxx` ile açılan karakterin `feats`, `specialAbilities` ve `spells` dizileri boş şablonlarla ezilmemeli; tam nesne olarak korunmalıdır.

### GÖREV 5: Senkronizasyon ve Kural Bütünlüğü (STRICT)
* Kök dizindeki `index.html` üzerinde yapılan her değişiklik eksiksiz olarak `webapp/index.html` dosyasına kopyalanmalı ve doğrulanmalıdır.
* Proje kuralı gereğince standart zar emojisi `U+1F3B2` kesinlikle kullanılmamalı, SVG zar ikonları kullanılmalıdır.

---

## 4. TAMAMLANAN UYGULAMA DURUMU (IMPLEMENTATION REPORT)
*Tüm maddeler başarıyla tamamlanmış ve canlı testlerden geçirilmiştir.*

1. **`tab-core` Hünerler ve Özel Yetenekler Vitrini:** 
   - `renderCoreFeatsAndSpecialAbilities()` fonksiyonu eklendi. Hem PC hem de NPC karakterlerde `character.feats` ve `character.specialAbilities` dizileri zengin çip/rozet kartları olarak sergileniyor.
2. **`tab-combat` Savunma Sütunu DR, SR & Bağışıklıklar:**
   - `renderSpecialDefenses()` kartı ile `character.dr`, `character.sr` ve `character.immunities` canlı olarak gösterilmektedir.
3. **`tab-spells` CL ve Slot Koruması:**
   - `getCasterInfo()` ve `calculateSorcererSlots()` fonksiyonlarına `character.isNpc` koruma bariyerleri eklendi. Canavarın Caster Level'ı ve slotları (0-9) sınıf tablosu boş olsa bile tam korunmaktadır.
4. **`loadInitialData` Veri Bütünlüğü:**
   - Hub'dan gelen tüm statblock dizileri (`feats`, `specialAbilities`, `spells`) eksiksiz şekilde `character` nesnesine aktarılmakta ve `saveStateToStorage()` ile senkronize edilmektedir.
5. **DM Statblock & Ability Studio (`#npc-statblock-modal`):**
   - Karakter sayfası tasarımını bozmadan, NPC karakterlerde üst başlıktaki `[⬆️ Level Up]` butonu yerine `[⚡ Statblock Düzenle]` butonu getirildi.
   - Açılan 3 sekmeli stüdyo modali üzerinden Vitals (HP, AC, Saves, 6 Stat, BAB, CR), Hünerler & Özel Yetenekler (Ex/Su/Sp) ve Büyüler/Manevralar serbestçe eklenip düzenlenebilmektedir.
6. **Dosya Paritesi & Zar Kuralı:**
   - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`, `rule_engine.js` ve `webapp/rule_engine.js` dosyaları %100 senkronize edildi.
   - Tüm dosyalarda sıfır tavla zarı (`U+1F3B2`) doğrulaması yapıldı.

---

## 5. DİNAMİK STAT SENKRONİZASYONU VE HUB KART ENTEGRASYONU (2026-10-24)
* **Kapsam:** Hub (`hub.html`) üzerindeki karakter kartlarında ve DM tablosunda gösterilen AC, Touch, Flat-Footed, Ana Saldırı/Silah, Hasar & Tehdit Aralığı, İnisiyatif, Kurtarma Atışları (Fort/Ref/Will) ve Pasifler (Spot/Listen) değerlerinin statik varsayılanlardan (10 AC, +0 Save vb.) kurtarılarak karakterin tam veri nesnesinden (`fullData` & `RuleEngine`) beslenmesi sağlandı.
* **Hub Geliştirmeleri:**
  1. `hub.html` `<head>` etiketine `rule_engine.js` eklendi; böylece karakter sayfasındaki hesaplama motoru Hub'da da tam yetkili hale geldi.
  2. `syncCharacterSummaryStats(c)` fonksiyonu ile `RuleEngine.recalculateCharacter`, `evaluateWeaponAttack`, `evaluateAC`, `getCharacterInitiativeBonus` ve `getCharacterSpotListen` çağrılarak tüm kart ve DM tablosu verileri canlı olarak hesaplanmaktadır.
  3. `adjustHp` fonksiyonu hem kart özetini hem de `c.fullData.hp.current` değerini güncelleyecek şekilde bağlandı.
* **Karakter Kâğıdı Uyumluluğu:**
  - `character.html` / `index.html` içerisindeki `saveStateToStorage` metodunda `dnd35_hub_db` kaydı yapılırken `character.acBreakdown?.total` önceliklendirildi ve `initBonus` senkronizasyonu eklendi.

---

## 6. CANLI DM HASAR/ŞİFA SENKRONİZASYONU VE GERÇEK ZAMANLI EFEKTLER (2026-10-25)
* **Kapsam:** Oyun masasında DM Hub (`hub.html`) üzerinden bir karaktere hasar verdiğinde veya şifa uyguladığında, bu eylemin anında oyuncunun açık olan karakter kâğıdına (`index.html` / `character.html`) sayfa yenilenmesine gerek kalmadan canlı olarak yansıması sağlandı.
* **Teknik Uygulama:**
  1. **DM Modu Koruması:** Canlı sinyal fırlatma mekanizması yalnızca `isDmMode === true` olan kampanyalarda aktifleşir.
  2. **Çift Kanallı İletim:**
     * **Aynı Cihaz / Çift Monitör (0ms):** `BroadcastChannel('dnd35_live_sync')` ve `window.addEventListener('storage')` ile anında iletim.
     * **Farklı Cihazlar (DM PC vs Oyuncu Telefonu):** `CloudSync.startLiveSyncPolling(3000)` ve `pushToCloud` (300ms ultra hızlı DM dispatch) ile Vercel KV üzerinden canlı çekme.
  3. **Görsel Geri Bildirimler:**
     * **Fullscreen Vignette Flash:** Hasarda ekranın kenarları kırmızı (`🩸`), şifada yeşil (`💚`) nabız gibi parlar.
     * **Toast Bildirimi:** `showDiceTopToast` ile `🩸 DM Hasar Uyguladı (-14 HP)` veya `💚 DM İyileşme Uyguladı (+8 HP)` bildirimi belirir.
  4. **Parite ve Kural Bütünlüğü:**
     * Kök ve `webapp/` dizinindeki tüm dosyalar (`hub.html`, `index.html`, `character.html`, `gdrive_sync.js`) %100 paritede eşitlendi.
     * Standart tavla zarı (`U+1F3B2`) kesinlikle kullanılmadı.

---

## 7. SUPABASE GOOGLE OAUTH KİMLİK DOĞRULAMA & GİRİŞ KALKANI (2026-10-25)
* **Kapsam:** Hub (`hub.html`) ve Karakter Kâğıdı (`index.html` / `character.html`) sayfalarına yetkisiz erişimi engellemek, kullanıcıların Google hesapları ile tek tıkla giriş yapmasını sağlamak ve çoklu kullanıcı kampanya mimarisine zemin hazırlamak amacıyla Supabase Auth entegrasyonu tamamlandı.
* **Teknik Bileşenler:**
  1. **Giriş Sayfası (`login.html` & `webapp/login.html`):**
     * Dark fantasy temalı, Google OAuth giriş butonu barındıran landing sayfası.
     * Kullanıcı zaten giriş yapmışsa otomatik olarak `/hub` veya url parametresindeki `redirect` hedefine yönlendirir.
  2. **Supabase Auth İstemcisi (`supabase_auth.js` & `webapp/supabase_auth.js`):**
     * Supabase v2 JS CDN istemcisi üzerinden Google OAuth `signInWithOAuth`, `signOut`, `getSession`, `requireAuth` koruma kalkanı ve `mountUserProfileUI` rozeti sağlar.
  3. **Sayfa Kalkanı (Auth Guard):**
     * `hub.html`, `index.html` ve `character.html` sayfaları `DOMContentLoaded` anında `await SupabaseAuth.requireAuth()` çalıştırır; geçerli oturum yoksa kullanıcı anında `/login?redirect=...` sayfasına yönlendirilir.
     * Oturumu olan kullanıcının avatarı, ismi ve `[🚪 Çıkış]` butonu sağ üst kontrol barına `#user-profile-slot` içine otomatik yerleştirilir.
  4. **Yönlendirme Kuralları (`vercel.json`):**
     * `/login` isteği `/webapp/login.html` dosyasına yönlendirilmiştir.
  5. **Parite ve Kural Bütünlüğü:**
     * Kök ve `webapp/` altındaki tüm kopyalar (`login.html`, `supabase_auth.js`, `hub.html`, `index.html`, `character.html`) %100 paritede tutulmuştur.
     * Standart tavla zarı (`U+1F3B2`) kesinlikle kullanılmamıştır.

---

## 8. BULUT DÖNGÜSÜ (INFINITE SYNC LOOP) & DM HP OTORİTE KORUMASI DÜZELTMESİ (2026-10-25)
* **Kapsam:** Karakter sayfasının sürekli bulut ile senkron olmaya çalışması (sonsuz pull-push ping-pong döngüsü ve buton yanıp sönmesi) ile DM tarafından Hub üzerinden uygulanan HP değişikliklerinin Karakter Kâğıdı'nın otomatik kayıt (`saveStateToStorage`) mekanizması tarafından ezilmesi sorunları kökten çözüldü.
* **Teknik Çözümler:**
  1. **Sonsuz Bulut Eşitleme Döngüsünün Ortadan Kaldırılması:**
     * `gdrive_sync.js` içerisindeki `applyRemotePayload` fonksiyonunda yer alan Master DB yükseltme tetikleyicisine (`needsUpgrade`) tek seferlik oturum koruma kilidi (`this._cloudDbUpgraded`) eklendi ve sessiz arka plan sorgulamalarında (`silent === true`) otomatik `pushToCloud` tetiklemesi tamamen engellendi.
     * Sessiz arka plan çekimlerinde (`pullFromCloud(true)`), üst gezinti çubuğundaki durum butonunun gereksiz yere `'syncing'` ("Eşitleniyor...") durumuna geçerek kullanıcıyı rahatsız etmesi ve UI titremesi önlendi.
     * Canlı DM sorgulama frekansı 3000ms'den 8000ms'e çıkarıldı.
  2. **DM HP Otoritesi & Zaman Damgalı Çakışma Çözümü (Conflict Resolution):**
     * **Hub Yetkisi:** Hub üzerinden DM bir karakterin canını değiştirdiğinde (`adjustHp`), `lastHpUpdateTs = Date.now()` damgası atanır ve aynı zamanda `localStorage('dnd35_character')` doğrudan güncellenir.
     * **Karakter Kâğıdı Koruması:** `character.html` içerisindeki `saveStateToStorage()` fonksiyonunda, Hub'ın HP zaman damgası (`hubHpTs`) ile oyuncunun son manuel HP düzenleme zaman damgası (`playerHpTs`) kıyaslanır. Eğer DM değişikliği daha yeniyse, karakter kâğıdı Hub'daki HP'yi kesinlikle ezmez; aksine yerel `character.hp.current` değerini Hub ile hizalar.
     * **Oyuncu İnisiyatifi:** Oyuncu karakter sayfasından bilerek hasar aldığında (`applyDamage`) veya şifa aldığında (`applyHeal`), `_lastPlayerChangeTs = Date.now()` atanır ve bu değişiklik Hub'a doğru şekilde yazılır.
     * **Sayfa Açılış Senkronizasyonu (`loadInitialData`):** Karakter kâğıdı doğrudan açıldığında dahi `dnd35_hub_db` ile otomatik HP mutabakatı yapar.
  3. **`file://` Ortamı ve Test Uyumluluğu:**
     * `supabase_auth.js` içerisine yerel dosya protokolü (`file://`) için bypass eklenerek yerel testlerin ve headless tarayıcı otomasyonlarının login sayfasına yönlenmesi önlendi.
  4. **Doğrulama ve Canlı Testler:**
     * `scratch/test_sync_loop_and_hp_overwrite.py` ve `scratch/test_dm_live_sync.py` testleri Edge headless ortamında çalıştırılarak %100 başarıyla doğrulandı.
     * Proje genelinde `verify_no_dice.ps1` ve `sync_files.ps1` çalıştırılarak %100 dosya paritesi ve sıfır zar emojisi kuralı garanti altına alındı.

---

## 9. HUB ANLIK ZAR ATMA MEKANİZMASI (SAVES, SPOT, LISTEN, İNİSİYATİF) (2026-10-25)
* **Kapsam:** Hub (`hub.html`) üzerindeki karakter kartlarında ve DM tablosunda bulunan Kurtarma Atışları (Fortitude, Reflex, Will), Pasif Beceriler (Spot, Listen) ve İnisiyatif değerleri doğrudan tıklanarak zar atılabilir hale getirildi.
* **Teknik Bileşenler:**
  1. **İnteraktif Butonlar:**
     * Kart ve tablo görünümlerindeki `F`, `R`, `W` ve `Spot`, `Listen` değerleri şık, aktif basma efektine (`active:scale-95`) sahip butonlara dönüştürüldü.
     * Karakter açma butonunu yanlışlıkla tetiklememesi için `event.stopPropagation()` eklendi.
  2. **Zar Atış Mantığı (`rollHubCheck`):**
     * Standart D&D 3.5e d20 zarı atılarak ilgili bonus eklenir (`1d20 + bonus = total`).
     * Doğal 20 (`isNat20`) ve Doğal 1 (`isNat1`) kritik durumları özel olarak tespit edilir.
  3. **Görsel Bildirim Toast Sistemi (`showHubDiceToast`):**
     * Ekranın üst-orta kısmında animasyonlu, dark fantasy temalı toast bildirimi açılır.
     * Doğal 20'de altın parıltılı (`⚡ DOĞAL 20!`), Doğal 1'de kırmızı parıltılı (`💀 DOĞAL 1!`) rozet ve kenarlık gösterilir.
     * Aynı anda en fazla 3 toast istiflenir, 4.5 saniye sonra otomatik veya tıklamayla anında kapanır.
  4. **Kural ve Parite:**
     * Proje kuralı gereği standart tavla zarı (`U+1F3B2`) kesinlikle kullanılmamış, tematik SVG ve ikonlar (`🛡️`, `⚡`, `🔮`, `👁️`, `👂`) tercih edilmiştir.
     * `hub.html` ile `webapp/hub.html` arasında %100 parite sağlanmıştır.

---

## 10. HUB 3D ZAR ANİMASYONU & SAĞ ÇEKMECE ZAR MASASI ENTEGRASYONU (2026-10-25)
* **Kapsam:** Hub (`hub.html`) sayfasına `Three.js` ve `dice3d.js` fizik simülasyonlu 3D zar animasyon motoru entegre edildi. Ayrıca üst gezinti çubuğuna d20 vektör ikonlu "Zar At" butonu eklenerek sayfanın sağından kayarak açılan (slide-over drawer) tam teşekküllü zar masası modülü (`hub_dice.js`) Hub'a kazandırıldı.
* **Teknik Bileşenler:**
  1. **3D Fiziksel Zar Simülasyonu (`dice3d.js` & Three.js):**
     * Hem karakter kartlarındaki kurtarma atışlarına (Saves), algı (Spot/Listen) ve inisiyatife tıklandığında, hem de serbest zar masası ve formül atışlarında ekranda gerçekçi 3D zar yuvarlanma animasyonu ve ses efekti çalışır.
  2. **Sağ Kayar Çekmece (Slide-Over Drawer - `#hub-dice-drawer`):**
     * Üst bardaki "Zar At" butonuna veya ESC tuşuna duyarlı, karartmalı arka plan (`#hub-dice-backdrop`) eşliğinde sağdan yumuşakça kayarak açılan responsive kontrol paneli.
  3. **Serbest Zar Masası & Havuz Modu:**
     * d4, d6, d8, d10, d12, d20 ve d100 vektör butonları.
     * "Tıkla Hemen At" veya "Havuzda Topla ve At" modu, bonus ekleme ve sıfırlama.
  4. **Zar Rengi ve Palet Seçici:**
     * Yakut, Safir, Zümrüt, Ametist, Kehribar, Buzul, Obsidyen, Fildişi ve özel renk seçici. 3D zar malzemesi ve butonlar bu renkle anında uyumlanır.
  5. **Serbest Formül & Hedefli Zar Motoru:**
     * `Hedef:21 Bonus:4 Zar:1d6+3 19-20x2` gibi akıllı hedefli saldırı ve kritik teyit formülleri veya `8d6`, `3d6+5` gibi serbest formüller.
     * Hızlı şablonlar (kaydet, tıkla-doldur, sil).
  6. **Canlı Son Zar Kartı ve Geçmiş Logu:**
     * Yapılan tüm atışlar (kart saves/spot/listen atışları dahil) `addDiceHistoryEntry` ile kalıcı olarak kaydedilir ve yeniden eskiye doğru listelenir.
  7. **Kural ve Parite:**
     * Proje kuralı gereğince standart tavla zarı (`U+1F3B2`) kesinlikle kullanılmamış, özel SVG çokyüzlü zar ikonları kullanılmıştır.
     * Kök dizindeki `hub.html` ve `hub_dice.js` ile `webapp/` altındaki kopyalar %100 birebir senkronize edilmiştir.

---

## 11. ÇOK KULLANICILI SUPABASE KAMPANYA DAVETİYE SİSTEMİ MİMARİSİ (SPECIFICATION)
* **Kapsam:** Farklı kullanıcıların Google hesaplarıyla giriş yaparak karakterlerini DM masasıyla (Hub) paylaşması ve DM'in tek bir davet kodu/linki ile tüm partiyi oturuma toplayabilmesi için Supabase tabanlı "DM Kampanya Davet Kodu" mimarisi kararlaştırıldı.
* **Seçilen Model:** **Yaklaşım B: DM Davetiye Kodu / Linki Modeli (D&D Beyond / VTT Standardı)**
* **Veritabanı Şeması:**
  1. `public.campaigns`:
     - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
     - `dm_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
     - `name TEXT NOT NULL`, `description TEXT`
     - `invite_code TEXT UNIQUE NOT NULL` (Örn: `RAVEN-7841`)
     - `is_dm_mode BOOLEAN DEFAULT true`
     - `created_at TIMESTAMPTZ DEFAULT now()`
  2. `public.characters`:
     - `id TEXT PRIMARY KEY` (örn: `char_...` veya UUID)
     - `owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
     - `campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL`
     - `name TEXT NOT NULL`, `is_npc BOOLEAN DEFAULT false`
     - `full_data JSONB NOT NULL`
     - `current_hp INT`, `temp_hp INT DEFAULT 0`
     - `last_dm_hp_update_ts BIGINT DEFAULT 0`
     - `last_player_update_ts BIGINT DEFAULT 0`
     - `updated_at TIMESTAMPTZ DEFAULT now()`
  3. **Realtime Yayını:** `ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns, public.characters;`
* **Geliştirme Görevleri:**
  1. `supabase_auth.js` / Supabase servis katmanına `createCampaign`, `getCampaignByCode`, `joinCampaignWithCharacter`, `leaveCampaign`, `subscribeToCampaignRealtime` metodlarının eklenmesi.
  2. `hub.html` kampanyalar sekmesine `[🎟️ Davet Kodu]` modalı eklenmesi (kod kopyalama, link paylaşımı, katılan oyuncu listesi ve çıkarma).
  3. `index.html` ve `character.html` sayfalarına `[🎟️ Kampanyaya Katıl]` modalı ve URL'den (`?code=...`) otomatik algılama desteği getirilmesi.
  4. DM HP otoritesi ve oyuncu stat ayrımının korunması; kök ve `webapp/` dosyalarının %100 paritede tutulması; standart tavla zarı (`U+1F3B2`) yasağının tavizsiz uygulanması.

---

## 12. HAZIR DEVİR TESLİM PROMPTU (DİĞER KONUŞMAYA YAPIŞTIRILACAK)
```markdown
DM Kampanya Davet Kodu Modeli (Supabase Auth + PostgreSQL + Realtime WebSocket) mimarisi belirlendi. Görev: `HANDOVER_TO_CHARACTER_SHEET.md` dosyasındaki Bölüm 11 spesifikasyonuna uygun olarak, `supabase_auth.js`, `hub.html`, `index.html` ve `character.html` sayfalarında çok kullanıcılı davet kodu ve kampanya katılım sistemini uçtan uca uygula. Kök ve webapp/ dosyalarında %100 pariteyi koru ve hiçbir yerde standart tavla zarı (`U+1F3B2`) kullanma.
```

---

## 13. ÇOK KULLANICILI SUPABASE KAMPANYA DAVETİYE VE KARAKTER PAYLAŞIM SİSTEMİ UYGULAMA RAPORU (2026-10-25)
* **Kapsam:** Supabase Auth, PostgreSQL RLS, Realtime WebSocket yayını ve "DM Kampanya Davet Kodu" mimarisi (`supabase_auth.js`, `hub.html`, `index.html`, `character.html`) uçtan uca tamamlandı.
* **Tamamlanan Bileşenler:**
  1. **İstemci Servis Katmanı (`supabase_auth.js` & `webapp/`):**
     * `generateInviteCode()` (örn. `RAVEN-7841`, `DRAGON-3194`), `createCloudCampaign()`, `getCampaignByInviteCode()`.
     * `joinCampaignWithCharacter()`: 1 Oyuncu = 1 Aktif Karakter kuralını garantiye alarak karakteri buluta bağlar.
     * `leaveCampaign()`: Karakteri silmeden (`campaign_id = null`) masadan çıkarır; oyuncunun karakter özerkliğini korur.
     * `migrateLocalCampaignToCloud()`: DM'in yerel kampanyalarını ve içindeki yaratıkları tek tıkla Supabase'e taşır.
     * `updateCharacterHpAsDm()` & `saveCharacterDataAsPlayer()`: Rol bazlı yetkilendirme ile anlık bulut güncellemesi.
     * `subscribeCampaignRealtime()`: PostgreSQL WebSocket dinleyicisi.
  2. **Hub DM Cockpit Davetiye ve Masa Yönetimi (`hub.html` & `webapp/`):**
     * Kampanya başlığına `[🎟️ Davet Kodu]` veya `[☁️ Buluta Taşı & Davet Kodu Al]` butonları eklendi.
     * `#campaign-invite-modal`: Büyük monospace davet kodu, doğrudan katılım linki (`?code=...`) ve masadaki oyuncuların canlı HP/durum listesi + `[🚪 Masadan Çıkar]` butonu.
     * `adjustHp` eylemi doğrudan `SupabaseAuth.updateCharacterHpAsDm` ile buluta fırlatılarak bağlı oyunculara anında iletilir.
     * Aktif kampanya seçildiğinde `syncActiveCloudCampaignRealtime` ile yeni katılan oyuncuların karakterleri Hub'a anında düşer.
  3. **Karakter Kâğıdı Katılım ve Realtime Dinleyicisi (`character.html`, `index.html` & `webapp/`):**
     * Üst nav bara şık ve simetrik `[🎟️ Kampanya]` butonu eklendi (bağlıysa `[🎟️ KOD]` yazar).
     * `#join-campaign-modal`: Kod girişi, mevcut kampanya rozeti ve `[Ayrıl]` butonu.
     * Sayfa `?code=...` parametresi ile açıldığında otomatik katılım penceresi açılır.
     * Supabase Realtime üzerinden gelen HP değişimleri doğrudan `handleIncomingDmHpEvent` ile Fullscreen Vignette Flash (`🩸` / `💚`), ses ve toast bildirimlerini anında tetikler.
  4. **Parite ve Kural Bütünlüğü:**
     * Tüm dosyalarda (`hub.html`, `character.html`, `index.html`, `supabase_auth.js`) sıfır tavla zarı (`U+1F3B2`) doğrulaması yapıldı.
     * Kök ve `webapp/` dosyaları %100 hash paritesinde eşitlendi.

---

## 14. MODÜLER D&D 3.5E RAW SRD CORE KATALOĞU (GHOST CORE) & PROGRESSIVE DISCLOSURE SİLAH SİSTEMİ RAPORU (FAZ 4 - 2026-10-25)
* **Kapsam:** D&D 3.5e RAW SRD Çekirdek Kataloğu (134 Silah, Kalkan, Zırh ve Feat) Ghost Core mimarisi, Spotlight Typeahead Hızlı Ekleme Çubuğu ve Silah Setleri Kademeli İlerleme (Progressive Disclosure) Büyüleme Stepper'ı & Element Çipleri tamamlandı.
* **Tamamlanan Bileşenler:**
  1. **Ghost Core İzolasyonu (`bundled_data.js` & `webapp/`):**
     * `window.BUNDLED_SRD_CORE_CATALOG` arka plan referansı olarak entegre edildi.
     * `findWeaponEverywhere` fonksiyonu, parametrik ve yerel aramalarda SRD Core Ghost referansını otomatik fallback olarak kullanır.
     * Master DB tablosu şişirilmez; yalnızca kullanıcı yapımı ve özel kurallar listelenir.
  2. **Spotlight Typeahead Hızlı Ekleme Çubuğu (`character.html`, `index.html` & `webapp/`):**
     * Dövüş kokpitindeki "HIZLI SİLAH SETLERİ" başlığına `[⚡ SRD Silah Ekle]` butonu eklendi.
     * `#srd-spotlight-container`: Gerçek zamanlı arama, popüler SRD silahları (Longsword, Greatsword, Dagger, Spiked Chain, Heavy Shield vb.) hızlı erişimi, hasar zarı, kritik, silah türü ve ağırlık dökümü.
     * Tek tıkla `[➕ Karaktere Ekle]` butonu: Eşyayı hem `character.gearPool` havuzuna hem de `character.weapons` dizisine tam RAW parametreleriyle kopyalar ve boşsa doğrudan aktif silah yapar.
  3. **Kademeli İlerleme (Progressive Disclosure) Büyüleme & Element Çipleri:**
     * Silah Setleri Düzenleyicisinde hem Ana El hem İkinci El için:
       * **Büyüleme Stepper'ı:** `[ - ] +N [ + ]` (0'dan +5'e kadar `attBonus` ve `dmgBonus` dinamik ayarı, anında `recalculateOffense` senkronizasyonu).
       * **Element & Özel Nitelik Çipleri:**
         - `[ 🔥 Flaming (+1d6 Ateş) ]`
         - `[ ❄️ Frost (+1d6 Soğuk) ]`
         - `[ ⚡ Shock (+1d6 Şok) ]`
         - `[ ✨ Holy (+2d6 Kutsal) ]`
         - `[ 💀 Unholy (+2d6 Karanlık) ]`
         - `[ 🩸 Keen (Kritik Tehditi 2x) ]` (RAW kuralına uygun tehdit aralığı genişletme: örn. 19-20 -> 17-20).
     * Silah kartları üzerinde güncel büyüleme düzeyi (`+2 Büyülü`), `🩸 Keen` rozeti ve aktif element çipleri anında parlar.
     * Saldırı zarları atıldığında (`rollAttackChainItemByIndex`), bu element zarları formüle otomatik eklenir ve hasar dökümünde tek tek hesaplanır.
  4. **Parite ve Kural Bütünlüğü:**
     * Dosyalarda sıfır tavla zarı (`U+1F3B2`) kuralı tavizsiz korundu.
     * Kök ve `webapp/` dosyaları (`character.html`, `index.html`, `bundled_data.js`) %100 SHA-256 hash paritesinde eşitlendi.

---

## 15. STANDART 7 D&D 3.5E RAW IRK ENTEGRASYONU (GHOST CORE & PROFIL SİSTEMİ - 2026-10-25)
* **Kapsam:** D&D 3.5e Player's Handbook standart 7 ırkı (`Human`, `Dwarf`, `Elf`, `Gnome`, `Half-Elf`, `Half-Orc`, `Halfling`) resmi RAW nitelikleriyle Ghost Core kataloğuna ve Karakter Profil Arayüzüne entegre edildi.
* **Tamamlanan Bileşenler:**
  1. **Ghost Core Katalog Genişlemesi (`srd_core_catalog.json` & `bundled_data.js`):**
     * Toplam kayıt sayısı 134'ten 141'e çıkarıldı.
     * Her ırk; Boyut (`size`), Taban Hız (`baseSpeed`), Yetenek Puanı Modifiyerleri (`strBonus`, `dexBonus`, `conBonus`, `intBonus`, `wisBonus`, `chaBonus`), Otomatik Diller (`languages`), Tercih Edilen Sınıf (`favoredClass`) ve tüm ırksal nitelikleri (`traits`) ile tam şemada tanımlandı.
  2. **Karakter Profil Modalı Önizleme ve Uygulama Kartı (`character.html`, `index.html` & `webapp/`):**
     * `#profile-edit-race` alanında ırk seçildiğinde canlı `#profile-race-traits-card` devreye girer.
     * Seçili ırkın stat değişimleri rozetleri (örn. Elf: `+2 DEX / -2 CON`, Cüce: `+2 CON / -2 CHA`), boyutu, hızı ve ırksal nitelikleri döküm olarak sunulur.
     * `[ 🧬 Irk Niteliklerini Uygula ]` butonu: Irkın tüm niteliklerini (Stonecunning, Darkvision, Low-Light Vision, Sleep Immunity vb.) mükerrerlik korumasıyla `character.specialAbilities` dizisine aktarır; karakter boyutunu ve hızını günceller.
     * `[ ] Stat bonuslarını yetenek puanlarına ekle` onay kutusu: Double-dip (mükerrer puan ekleme) riskini sıfıra indiren opsiyonel stat kontrolü sunar.
  3. **Parite ve Kalite Güvencesi:**
     * `srd_core_catalog.json`, `bundled_data.js`, `character.html`, `index.html` ve `webapp/` kopyaları %100 SHA-256 paritesinde eşitlendi.
     * Sıfır tavla zarı (`U+1F3B2`) kuralı tavizsiz korundu.

---

## 16. VERCEL CANLI YAYINI, LOGIN EKRANI ROUTING VE MASTER PRODUCTION SÜRÜMÜ (2026-10-25)
* **Canlı Adres:** [https://dndtool35.vercel.app/](https://dndtool35.vercel.app/)
* **Git Durumu:** `feat/supabase-campaign-sharing` branch'indeki tüm geliştirmeler GitHub `main` branch'ine başarıyla merge edilip push edilmiştir.
* **Yönlendirme Mimarisi (`vercel.json`):**
  * `/` (Kök URL) $\rightarrow$ `/webapp/login.html` (Ejderha temalı giriş ekranı: Google ile Giriş veya Yerelde Çalıştır/Çevrimdışı Mod).
  * `/login` $\rightarrow$ `/webapp/login.html`
  * `/hub` $\rightarrow$ `/webapp/hub.html` (DM Sefer & Masa Kontrol Merkezi).
  * `/character` $\rightarrow$ `/webapp/character.html` (Karakter Kâğıdı & Dövüş Kokpiti).
  * `/index` $\rightarrow$ `/webapp/index.html`
* **Akıllı Session Geçişi:** Daha önce giriş yapmış olan veya "Yerelde Çalıştır" modunu seçen kullanıcılar, root URL açıldığında bekletilmeden otomatik olarak `/hub` sayfasına yönlendirilir.

---

## 17. HAZIR DEVİR TESLİM PROMPTU (DİĞER KONUŞMAYA DOĞRUDAN YAPIŞTIRILACAK)
```markdown
Selam! Ben projenin diğer sekmesinden geliyorum. Şu ana kadar tamamlanan büyük sistem güncellemeleri GitHub `main` branch'ine aktarılmış ve Vercel'de [https://dndtool35.vercel.app/](https://dndtool35.vercel.app/) adresinde canlıya alınmıştır.

Lütfen kök dizindeki `HANDOVER_TO_CHARACTER_SHEET.md` dosyasını ve aşağıdaki mimari özeti dikkate alarak çalışmaya devam et:

1. 🏰 Supabase Çoklu Kullanıcı & Davet Kodu:
   - `supabase_auth.js` üzerinde DM kampanya davet kodları (`DRAGON-XXXX`), 1 oyuncu = 1 karakter bulut kaydı ve WebSocket Realtime can senkronizasyonu tam çalışır durumdadır.
   - Eski Vercel KV PIN modalı emekliye ayrıldı; Google ile giriş yapıldığında veya yerel misafir modunda karakterler otomatik bulut/yerel senkronizasyonla açılır.

2. 👻 Modüler SRD Ghost Core & Spotlight Quick-Add:
   - `srd_core_catalog.json` (ve `bundled_data.js` -> `window.BUNDLED_SRD_CORE_CATALOG`) içinde 141 adet RAW SRD kaydı mevcuttur (79 Silah, 12 Zırh, 6 Kalkan, 37 Dövüş Feat'i, 7 Standart PHB Irkı).
   - Silah Setleri üzerinde Spotlight Typeahead arama (`[⚡ SRD Silah Ekle]`), Kademeli Büyüleme Stepper'ı (`[ - ] +N [ + ]`) ve Element Çipleri (`🔥`, `❄️`, `⚡`, `✨`, `💀`, `🩸 Keen`) aktiftir.
   - Profil Düzenleme modalında ırk seçildiğinde canlı Irksal Nitelik Kartı açılır ve tek tıkla nitelikleri `character.specialAbilities` dizisine aktarır.

3. 🌐 Yönlendirme ve Canlı Ortam:
   - Root URL (`/`) doğrudan `login.html` sayfasına yönlendirir.
   - Oturum açıkken veya yerel moddayken otomatik `/hub` sayfasına geçilir.
   - Karakter kâğıdına `/character` veya `/index` üzerinden erişilir.

4. 🛡️ Değişmez Kurallar:
   - Kök dizindeki dosyalar (`hub.html`, `character.html`, `index.html`, `supabase_auth.js`, `bundled_data.js`, `srd_core_catalog.json`) ile `webapp/` altındaki kopyalar %100 birebir SHA-256 eşitliğinde tutulmalıdır.
   - Projenin hiçbir yerinde tavla zarı emojisi (`U+1F3B2` / `U+1F3B2`) kullanılmayacak; SVG zar ikonları veya tematik aksiyon sembolleri (`⚔️`, `🛡️`, `⚡`, `🔮`, `🩸`) kullanılacaktır.
   - Kesinlikle uydurma/dummy data kullanılmayacak; tüm kurallar D&D 3.5e RAW SRD standartlarına sadık kalacaktır.
```

---

## 18. FABRİKA AYARLARINA SIFIRLAMA, TEMİZ BAŞLANGIÇ VE GHOST CORE KORUMASI RAPORU (2026-10-25)
* **Kapsam:** Önceki aşamalardan kalan tüm mock/test karakterleri ve şişkin `master_db.json` verileri sıfırlandı; sistem tertemiz fabrika şablonuna çekildi.
* **Alınan Güvenlik Önlemleri:**
  1. Eski tüm veriler `backups/pre_wipe_backup_2026-10-25/` dizinine arşivlenerek güvenceye alındı.
  2. `master_db.json` ve `bundled_data.js` -> `window.BUNDLED_MASTER_DB = []` boşaltıldı.
  3. **Ghost Core Koruması:** `window.BUNDLED_SRD_CORE_CATALOG` içindeki 141 RAW SRD kaydı silinmedi; Spotlight aramasında ve ırk seçiminde anında kullanılabilir durumda.
  4. `character_data.json` temiz 1. seviye Human Fighter şablonuna çekildi.
  5. Hem Karakter Kâğıdına (`character.html` / `index.html`) hem de Hub'a (`hub.html`) tek tıkla tarayıcı hafızasını sıfırlayan `[ 🧹 Fabrika Ayarlarına Dön ]` butonları entegre edildi.

---

## 19. AYARLAR MODALINDAN ESKİ VERCEL KV KALDIRILMASI & KAMPANYA BUTONU YENİDEN YERLEŞİMİ (2026-10-25)
* **Kapsam:** Emekliye ayrılan eski Vercel KV (Upstash) şifre/bağlantı paneli Ayarlar modalından kaldırıldı ve üst gezinme çubuğundaki (navbar) Kampanya butonu ergonomik olarak Ayarlar butonunun hemen altına taşındı.
* **Uygulanan Değişiklikler:**
  1. **Eski Vercel KV / Upstash Kartının Kaldırılması (`#settings-modal`):**
     * Ayarlar modalı gövdesindeki gereksiz Vercel Storage & APP_PIN ayar alanı temizlendi.
     * Yerine temiz, minimalist bir "🎟️ DM Kampanyası & Masa Bağlantısı" yönetim kartı eklendi.
  2. **Kampanya Butonunun Ayarlar Altına Konumlandırılması (`navbar`):**
     * Sağ üst kontrol bloğu simetrik 2x2 grid olarak yeniden düzenlendi:
       * **1. Sıra:** `[ 🏰 Hub ]` (Sol) & `[ ⚙️ Ayarlar ]` (Sağ)
       * **2. Sıra:** `[ 🟢 Bulut ]` (Sol) & `[ 🎟️ Kampanya ]` (Sağ - Ayarlar'ın tam dikey altında)
     * `updateCampaignNavButton()` fonksiyonu her iki alandaki rozet ve kod metinlerini senkronize tutacak şekilde güncellendi.
  3. **Parite ve Kural Bütünlüğü:**
     * `character.html`, `index.html`, `webapp/character.html` ve `webapp/index.html` dosyaları %100 birebir SHA-256 eşitliğinde tutuldu.
     * Standart tavla zarı (`U+1F3B2`) yasağı ve sıfır dummy data kuralı tavizsiz korundu.





---

## 20. LOGIN VE ROOT YÖNLENDİRMESİNİN /HUB OLARAK KESİNLEŞTİRİLMESİ (2026-10-25)
* **Sorun:** Google OAuth ve Supabase girişinden sonra kullanıcıların `https://dndtool35.vercel.app/#` adresine yönlendirilmesi neticesinde Vercel'in statik dosya önceliği sebebiyle doğrudan `index.html` (Karakter Kâğıdı / Tactical Cockpit) sayfasını açması, DM Hub masasının açılmasını engelliyordu.
* **Uygulanan Çözümler:**
  1. **Vercel Sunucu Yönlendirmesi (`vercel.json`):**
     * Kök adres (`/`) için `permanent: false` HTTP 307 yönlendirmesi (`redirects`) eklendi: `{ "source": "/", "destination": "/hub" }`. Bu sayede Google OAuth geri dönüş hash'i (`#access_token=...`) tarayıcı tarafından korunarak doğrudan `/hub` sayfasına taşınır.
  2. **İstemci Tarafı Kök Kalkanı (`index.html` / `character.html`):**
     * Sayfa açılışında `pathname === '/'` ve URL'de `?id=` karakter parametresi yoksa, sayfa yüklemesi anında kesilerek `window.location.replace('/hub' + window.location.hash)` ile kullanıcı derhal Hub sayfasına aktarılır.
  3. **Hub'dan Karakter Açma İyileştirmesi (`hub.html`):**
     * Karakter açıldığında `/?id=...` yerine doğrudan `/character?id=...` rotasına yönlendirilmesi sağlandı.
  4. **Parite ve Doğrulama:**
     * `vercel.json`, `hub.html`, `webapp/hub.html`, `index.html`, `character.html`, `webapp/index.html` ve `webapp/character.html` dosyaları %100 SHA-256 paritesinde eşitlenip GitHub `main` branch'ine push edildi.

---

## 21. HUB & SUPABASE HAYALET KARAKTER DÖNGÜSÜNÜN ÇÖZÜMÜ VE BULUT SİLME ENTEGRASYONU (2026-10-25)
* **Sorun:** Hub sayfasında kullanıcının oluşturmadığı veya sildiği karakterlerin (`char_test_khazmil`, `char_179293...` zaman damgalı mükerrer Fighter 1 ve Ranger 1 kopyaları) kendiliğinden listeye eklenmesi ve sayfayı yenileyince tekrar hortlaması.
* **Kök Nedenler:**
  1. `initHubStorage` içindeki eski prototip dummy aşılamasının (`characters.length === 0` iken zorla `char_test_khazmil` oluşturması) Kural #5 (No Dummy Data) kuralını çiğnemesi.
  2. `syncCloudUserHub` içindeki senkronizasyon döngüsünde `lc.fullData` nesnesinin `id` taşımaması sebebiyle `upsertUserCharacter` fonksiyonunun her oturumda yeni bir `char_${Date.now()}` üretip buluta ayrı bir karakter olarak kaydetmesi.
  3. Hub'daki çöp kutusu (`deleteCharacter`) eyleminin sadece yerel `localStorage`'dan silmesi, Supabase bulutundan silmemesi neticesinde silinen karakterlerin her sayfa yenilemesinde buluttan tekrar geri yüklenmesi.
* **Uygulanan Kesin Çözümler:**
  1. **Bulut Silme Entegrasyonu (`supabase_auth.js` & `webapp/`):**
     * `deleteCharacter(characterId)` metodu eklendi. Kullanıcının `characters` tablosundaki ilgili kaydını `owner_user_id` güvenliğiyle kalıcı olarak siler.
  2. **Hub Çöp Kutusu Kalıcı Silme (`hub.html` & `webapp/`):**
     * `deleteCharacter(charId)` asenkron hale getirildi; hem yerel hafızadan hem de Supabase bulutundan aynı anda silinmesi sağlandı.
  3. **Dummy Aşılamasının Kaldırılması (`hub.html` & `webapp/`):**
     * `initHubStorage` içindeki `char_test_khazmil` otomatik oluşturma kodu tamamen kaldırıldı. Boş durumda temiz "➕ Yeni Karakter Ekle" kartı gösterilir.
     * `dummyIds` filtresine `char_test_khazmil` eklendi.
  4. **Otomatik Mükerrer Ayıklama (Deduplication):**
     * `syncCloudUserHub` içine imza ve zaman damgası kontrolü eklendi; aynı isim ve sınıfa sahip mükerrer hayalet kopyalar tespit edilip en günceli korunarak eski kopyalar Supabase bulutundan otomatik temizlendi.
     * `charPayload.id = lc.id; charPayload._hubId = lc.id;` garantisi ile bulut kaydının yerel ID ile %100 birebir eşleşmesi güvenceye alındı.
  5. **Karakter Kâğıdı ID Bütünlüğü (`character.html` / `index.html`):**
     * `loadInitialData` ve `saveStateToStorage` içerisinde ID atanmamış karakterlere sabit ID bağlanması garanti altına alındı.
  6. **Parite ve Kural Bütünlüğü:**
     * `hub.html`, `character.html`, `index.html`, `supabase_auth.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde tutuldu.
     * Sıfır tavla zarı (`U+1F3B2`) ve Kural #5 (No Dummy Data) kuralları tavizsiz korundu.

---

## 22. SENKRONİZASYON HAPI (SYNC-STATUS-PILL) SUPABASE & YEREL MOD GÖRSEL GERİBİLDİRİMİ (2026-10-25)
* **İstek:** `#sync-status-pill` butonunun Supabase'e bağlı ve yedekleme yapıyorken **Yeşil** (`🟢 Bulut Senkron`), yerel (çevrimdışı/misafir) modda çalışıyorken ise **Sarı** (`🟡 Yerel Kayıtlı`) olması.
* **Uygulanan Değişiklikler:**
  1. **Dinamik Durum Motoru (`supabase_auth.js` & `webapp/`):**
     * `updateSyncStatusPill(status)` fonksiyonu eklendi:
       - **Supabase Oturumu Açık:** Yeşil arka plan (`bg-emerald-950/80`), yeşil kenarlık (`border-emerald-600`), parıldayan yeşil nokta (`bg-emerald-400 animate-pulse`) ve `🟢 Bulut Senkron` metni.
       - **Yerel / Misafir Mod:** Sarı arka plan (`bg-amber-950/60`), sarı kenarlık (`border-amber-600/70`), sabit sarı nokta (`bg-amber-400`) ve `🟡 Yerel Kayıtlı` metni.
       - **Senkronizasyon Sırasında (Upsert):** Mavi/İndigo arka plan (`bg-indigo-950/80`), mavi ping noktası (`bg-cyan-400 animate-ping`) ve `🔄 Bulut Eşitleniyor...` metni.
  2. **Eski Vercel KV Çakışmasının Önlenmesi (`gdrive_sync.js` & `webapp/`):**
     * `gdrive_sync.js:updateStatusUI` metoduna Supabase Auth delegasyonu eklendi. Supabase oturumu varken eski Upstash/KV PIN kontrolünün butonu sarıya düşürmesi kesin olarak engellendi.
  3. **Etkileşim ve Tıklama Yönetimi (`handlePillClick`):**
     * `#sync-status-pill` tıklandığında:
       - Yeşil modda: Supabase bulut senkronizasyonunun aktif olduğunu doğrulayan bilgilendirme bildirimi gösterilir.
       - Sarı modda: Kullanıcıya Google ile giriş yaparak bulut yedeklemesini açmak isteyip istemediği sorularak `login.html` sayfasına yönlendirme sunulur.
  4. **Parite ve Kural Bütünlüğü:**
     * `hub.html`, `character.html`, `index.html`, `supabase_auth.js`, `gdrive_sync.js` ve `webapp/` altındaki kopyaları %100 birebir SHA-256 eşitliğinde tutuldu.
     * Sıfır tavla zarı (`U+1F3B2`) kuralı tavizsiz korundu.

---

## 23. KAMPANYALARIN SİLİNMESİNE RAĞMEN GERİ GELMESİ (HORTLAMA) VE ÇİFT SEFER SORUNUNUN ÇÖZÜMÜ (2026-10-25)
* **Sorun:** Hub sekmesinde `camp_001` ve Supabase bulut seferinin (`fd74cec9-...`) çiftelenmesi; kullanıcı kampanyayı düzenleme modalından sildikten sonra dahi sayfa yenilenince kampanyanın tekrar hortlaması.
* **Kök Nedenler:**
  1. `initHubStorage` içindeki `if (!campaigns.some(cp => cp.id === 'camp_001')) campaigns.unshift(...)` kodunun, kullanıcı `camp_001`'i silmiş olsa dahi her sayfa açılışında zorla yeniden üretmesi.
  2. `deleteCampaignFromModal` fonksiyonunun kampanyayı yalnızca yerel `localStorage`'dan filtrelemesi; Supabase bulutundaki `campaigns` tablosundan silmemesi neticesinde `syncCloudUserHub` tarafından her oturumda geri yüklenmesi.
  3. Yerel `camp_001` ile buluttaki "Ana Sefer (Main Campaign)" kaydının birbirini tanımayarak iki ayrı sekme açması.
* **Uygulanan Kesin Çözümler:**
  1. **Bulut Kampanya Silme Entegrasyonu (`supabase_auth.js` & `webapp/`):**
     * `deleteCampaign(campaignId)` metodu eklendi. `dm_user_id` güvenliği ile ilgili kampanyayı ve WebSocket Realtime kanalını kalıcı olarak siler.
  2. **Hub Modal Silme Güncellemesi (`hub.html` & `webapp/`):**
     * `deleteCampaignFromModal` asenkron yapılarak hem yerel listeden hem de Supabase bulutundan aynı anda silmesi sağlandı.
  3. **Forced `camp_001` Aşılamasının Kaldırılması (`hub.html` & `webapp/`):**
     * `initHubStorage` içindeki zorla unshift etme mantığı kaldırıldı; kullanıcı sildiyse veya bulut seferi varsa tekrar hortlaması engellendi.
  4. **Otomatik Kampanya Birleştirme & Mükerrer Önleme:**
     * `syncCloudUserHub` fonksiyonunda `camp_001` ile bulut seferi eşleşirse tek bir sekmede birleştirilir, çift sekme oluşması engellenir.
  5. **Parite ve Kural Bütünlüğü:**
     * `hub.html`, `supabase_auth.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde tutuldu; sıfır tavla zarı (`U+1F3B2`) kuralı korundu.

---

## 24. HUB İÇİ SABİT SAĞ ZAR PANELİ VE 3 KOLONLU KART DÜZENİ ENTEGRASYONU (2026-10-25)
* **İstek:** 
  1. Hub üst başlığındaki "Zar At" butonunun ve açılır drawer modunun kaldırılması.
  2. Karakter kâğıdındaki `tab-dice` zar masasının kompakt bir varyantının Hub sayfasının sağ tarafında kalıcı/açık bir panel (`#hub-inline-dice-panel`) olarak konumlandırılması.
  3. Sol tarafta kalan karakter kartı alanının masaüstünde yan yana **tam 3 karakter sığacak** şekilde (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`) ayarlanması.
* **Uygulanan Değişiklikler:**
  1. **Üst Başlık Sadeleştirmesi (`hub.html` & `webapp/`):**
     * `#btn-open-hub-dice` kaldırıldı.
     * Üst eylem alanı tekil `[ 🏰 Kampanya ]` butonu ve kullanıcı profili ile simetrik, dengeli bir yerleşime kavuşturuldu.
  2. **Kalıcı Sağ Zar Masası (`#hub-inline-dice-panel`):**
     * Masaüstünde sticky (`sticky top-4`), 330px-380px genişliğinde zar paneli entegre edildi.
     * Çokyüzlü d20, d12, d10, d8, d6, d4, d100 butonları, anlık mod toggle'ı, havuz sayacı/değiştiricisi, serbest formül çubuğu, son atış kartı ve geçmiş listesi eksiksiz çalışır hale getirildi.
     * Eski `hub-dice-drawer` ve `hub-dice-backdrop` elementleri temizlendi.
  3. **3 Kartlı Grid Mimarisi (`renderCardsView`):**
     * Alt kampanya çekmeceleri, genel sefer karakterleri ve bağımsız karakter listelerinde `xl:grid-cols-4` yapısı `xl:grid-cols-3` olarak güncellendi.
     * Böylece sağdaki zar paneli açıkken sol alanda her satıra tam 3 kart oturması sağlandı.
  4. **Sayfa Açılış Otomasyonu (`hub_dice.js` & `webapp/`):**
     * Panel artık kalıcı olduğu için `DOMContentLoaded` olayında `initDiceColor`, `updateDicePoolDisplay`, `renderDiceHistory` ve `renderCustomTemplates` otomatik olarak tetiklenerek hazır hale getirildi.
  5. **Parite ve Kural Bütünlüğü:**
     * `hub.html`, `hub_dice.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde tutuldu.
     * Sıfır tavla zarı (`U+1F3B2`) kuralı tavizsiz korundu; çokyüzlü vektörel SVG zarlar kullanıldı.

---

## 25. ÜST BAŞLIK KONTROL BLOĞU TAM SİMETRİ VE KULLANICI PROFİL KARTI STANDARDI (2026-10-25)
* **İstek:** Hub üst başlığındaki sağ kontrol kolonunda kullanıcı profil hapının diğer 3 aksiyon butonuna göre daha kısa ve dar kalması nedeniyle oluşan asimetrinin giderilmesi.
* **Uygulanan Değişiklikler:**
  1. **Kullanıcı Profil Kartı Ebat Standardı (`supabase_auth.js` & `webapp/`):**
     * `mountUserProfileUI` içinde profil hapı `w-full h-9 rounded-xl` boyutlarına getirilerek altındaki `[ 🏰 Yeni Kampanya Ekle ]`, `[ 💾 Yedekle | 📂 İçe Aktar | 🧹 ]` ve `[ 🟢 Bulut Senkron ]` satırlarıyla birebir eşitlendi.
     * Sol tarafta avatar ve kullanıcı adı (`truncate`), sağ tarafta `[ 🚪 Çıkış ]` butonu (`shrink-0`) ile `justify-between` yerleşimi sağlandı.
  2. **Konteyner Hizalama Temizliği (`hub.html`, `character.html`, `index.html` & `webapp/`):**
     * `#user-profile-slot` elementinden `flex items-center justify-end` sınıfları kaldırılarak tam genişlikli (`w-full`) kart yerleşimine uyarlandı.
  3. **Parite ve Kural Bütünlüğü:**
     * `hub.html`, `character.html`, `index.html`, `supabase_auth.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde tutuldu; sıfır tavla zarı (`U+1F3B2`) kuralı tavizsiz korundu.

---

## 26. ZAR HAVUZU TEMİZLEME BUTONU VE FONKSİYON İSİMLENDİRME DÜZELTMESİ (2026-10-25)
* **Sorun:** Hub zar panelinde havuz temizleme çöp kutusu butonunun (`🗑️`) tetiklediği `clearDicePool()` fonksiyonunun script içinde tanımlı olmaması nedeniyle butonun tepki vermemesi.
* **Uygulanan Çözüm:**
  1. `hub_dice.js` içerisindeki `resetDicePool()` fonksiyonuna global `window.clearDicePool = resetDicePool;` alias'ı eklendi.
  2. `hub.html` içerisindeki buton doğrudan `onclick="resetDicePool()"` olarak güncellendi.
  3. Butona tıklandığında seçili tüm çokyüzlü zar sayaçları sıfırlanır, bonus girdi alanı 0 yapılır ve havuz metni anında temizlenir.
  4. `hub.html`, `hub_dice.js` ve `webapp/` kopyaları %100 eşitlendi.

---

## 27. HUB ÜST BAŞLIK SAĞ KOLON 3 KATMANLI DÜŞEY HİZALAMA VE SİMETRİ (2026-10-25)
* **İstek:** Hub üst başlığındaki 3 sağ kontrol grubunun (Üst 4 Buton, Görünüm Modu Değiştirici ve Tür Filtresi) farklı genişliklerde kalarak asimetri oluşturması; altlarındaki açık zar masası paneli ile sol hizada dikey olarak buluşamaması sorununun çözülmesi.
* **Uygulanan Değişiklikler:**
  1. **Standart Kolon Genişliği (`hub.html` & `webapp/`):**
     - Her 3 grubun genişliği responsive olarak eşitlendi: `w-full sm:w-[280px] lg:w-[310px] xl:w-[330px] 2xl:w-[360px]`.
     - Bu genişlik, başlığın 20px (`sm:p-5`) sağ iç boşluğu ile birlikte alttaki `#hub-inline-dice-panel` (`330px / 350px / 380px`) sol kenarı ile tek bir düşey çizgide kusursuz hizalanır.
  2. **1. Sıra (Üst 4 Buton):** Profil, Yeni Kampanya, Yedekle/İçe Aktar/Sıfırla ve Bulut Senkron satırları bu genişliğe tam oturacak şekilde `w-full` çalışır.
  3. **2. Sıra (Görünüm Modu):** Kart Görünümü ve DM Tablosu butonları `flex-1 justify-center` yapılarak kolonu %50-%50 tam doldurur.
  4. **3. Sıra (Tür Filtresi):** Gereksiz dış etiket kaldırılarak Tümü, PC (Oyuncular) ve NPC (Canavarlar) butonları `flex-1` yapılarak kolonu %33-%33-%33 tam doldurur. `setTypeFilter` fonksiyonu bu oranları koruyacak şekilde güncellendi.
  5. **Parite ve Kural Bütünlüğü:**
     - `hub.html` ve `webapp/hub.html` kopyaları %100 SHA-256 eşitliğinde tutuldu.
     - Sıfır tavla zarı (U+1F3B2) kuralı tavizsiz korundu.

---

## 28. ZAR HAVUZU ÖZET KUTUSU SABİT EBAT VE DÜZEN KORUMASI (2026-10-25)
* **İstek:** Hub açık zar panelindeki "Aktif Havuz" kutusunun boş durumdayken ("Zar seçilmedi") farklı punto ve satır yüksekliğinde olması sebebiyle zar seçilince kutu yüksekliğinin zıplaması / kaymasının önlenmesi.
* **Uygulanan Değişiklikler:**
  1. **Sabit Konteyner Yüksekliği (`hub.html` & `webapp/`):**
     - Aktif havuz kutusuna sabit `h-14` (56px) yüksekliği verilerek içeriğin durumuna bakılmaksızın kutu boyutlarının sabit kalması sağlandı.
  2. **Yazı Tipi ve Satır Eşitlemesi (`hub_dice.js` & `webapp/`):**
     - Boş durumdaki `summaryEl` için `text-sm md:text-base font-semibold text-slate-500 font-mono truncate h-6 flex items-center` stili tanımlandı.
     - Zar seçildiğinde ise `text-sm md:text-base font-extrabold text-amber-300 font-mono truncate h-6 flex items-center` stili uygulandı.
     - Her iki durumda da satır yüksekliği `h-6` (24px) ve yazı boyutu `text-sm md:text-base` olarak eşitlendi; `truncate` sayesinde metin taşmaları ve kutu sıçramaları tamamen engellendi.
  3. **Parite ve Kural Bütünlüğü:**
     - `hub.html`, `hub_dice.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde tutuldu.
     - Sıfır tavla zarı (`U+1F3B2`) kuralı korundu.

---

## 31. YENİ KARAKTER EKLEME MODALI IRK (RACE) SEÇİMİ ENTEGRASYONU (2026-10-25)
* **İstek:** Hub üzerindeki "Yeni Karakter / NPC Ekle" (`#new-character-modal-card`) modalında, sıfır manuel şablon oluştururken ırk (race) seçilebilmesi.
* **Uygulanan Değişiklikler:**
  1. **Irk Seçim Kontrolü (`hub.html` & `webapp/`):**
     - `#pane-char-mode-manual` içine D&D 3.5e RAW standart 7 PHB ırkını (Human, Dwarf, Elf, Gnome, Half-Elf, Half-Orc, Halfling) içeren ve "✨ Diğer / Özel Irk..." seçeneği sunan `#new-char-race` açılır menüsü eklendi.
     - "Diğer / Özel Irk..." seçildiğinde açılan `#new-char-race-custom` metin kutusu ile her türlü canavar ırkı, alt-ırk veya ev yapımı ırk adı (Aasimar, Tiefling, Goliath vb.) yazılabilir.
  2. **Veri Modeli ve Şema Entegrasyonu:**
     - `saveNewCharacter()` fonksiyonu seçilen ırkı alır, `createCleanDnd35Character()` fonksiyonuna aktarır ve hem yerel Hub state'ine hem de `character_data.json` / `dnd35_character` tam şemasına resmi `race` değeri olarak yazar.
     - Hub kartında karakter doğrudan `[Irk] • [Sınıf] [Seviye]` olarak listelenir.
  3. **Parite ve Kural Bütünlüğü:**
     - `hub.html` ve `webapp/hub.html` kopyaları %100 SHA-256 eşitliğinde tutuldu; sıfır tavla zarı (`U+1F3B2`) kuralı korundu.

---

## 32. HUB ZAR PANELİ DARALTILABİLİR GELİŞMİŞ ALAN (FORMÜL, SON ATIŞ & GEÇMİŞ) (2026-10-25)
* **İstek:** Hub açık zar paneli (`#hub-inline-dice-panel`) içindeki formül ile atış, şablon çipleri, canlı son atış kartı ve zar geçmişinin varsayılan olarak gizlenmesi; panelin havuz atış butonları satırında ("⚡ ZARLARI AT" & "🗑️") sonlanması ve altındaki alanların isteğe bağlı akordeon çekmecesi ile açılıp kapanabilmesi.
* **Uygulanan Değişiklikler:**
  1. **Akordeon Başlık Butonu ve Gizlenebilir Konteyner (`hub.html` & `webapp/`):**
     - Havuz atış butonlarının hemen altına `toggleDiceAdvancedDrawer()` butonlu kompakt bir akordeon başlığı yerleştirildi: `[ 📜 Formül, Son Atış & Geçmiş    Göster ▼ ]`.
     - Formül girişi, hızlı şablon çipleri, son atış kartı ve zar geçmişi listesi `#dice-advanced-content` konteyneri içerisine alındı (`hidden` sınıfı ile varsayılan olarak kapalı).
  2. **Durum Yönetimi ve Hafıza Motoru (`hub_dice.js` & `webapp/`):**
     - `toggleDiceAdvancedDrawer(forceOpen = null)` fonksiyonu eklendi:
       - Tıklandığında `#dice-advanced-content` görünürlüğünü yumuşakça değiştirir.
       - Ok simgesini (`rotate(180deg)` / `rotate(0deg)`) ve durum etiketini (`Göster` / `Gizle`) günceller.
       - Kullanıcının tercihini `localStorage.getItem('hub_dice_adv_open')` içinde saklayarak sayfa yenilendiğinde aynı açık/kapalı durumu korur.
  3. **Parite ve Kural Bütünlüğü:**
     - `hub.html`, `hub_dice.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde tutuldu.
     - Sıfır tavla zarı (U+1F3B2) kuralı tavizsiz korundu.

---

## 33. HUB & KARAKTER SENKRONİZE NOT DEFTERİ MOTORU VE 3 KOLONLU EŞİT YERLEŞİM (2026-10-25)
* **İstek:**
  - Sol bölüm (karakter kartları), Not Defteri ve Zar Masası panellerinin yüksekliklerinin eşit olması.
  - Not Defteri ve Zar Masası panellerinin genişliklerinin eşit olması.
  - Sol bölümde tam 2 karakter kartının yan yana sığması (`grid-cols-1 sm:grid-cols-2`).
  - Not defterinde **her zaman önce pinlenen notların (📌), ardından en son güncellenen notların** listelenmesi.
  - Not defterinin sağ üstünde kalem ve defter ikonlu buton (`📝`) yer alması ve tıklandığında geniş, 2 kolonlu bir modalın açılması.
  - DM modu seçilmemişse oyuncunun karakter notları ile kampanya notlarının senkron çalışması; DM notlarının ise oyuncularla paylaşılmayıp izole kalması.
* **Uygulanan Değişiklikler:**
  1. **Yerleşim ve Grid Ergonomisi (`hub.html` & `webapp/`):**
     - Ana konteyner `flex flex-col xl:flex-row items-stretch gap-4 sm:gap-5` yapılarak masaüstünde Sol Bölüm, Not Defteri ve Zar Masası panellerinin yükseklikleri otomatik eşitlendi.
     - Not Defteri (`#hub-inline-notes-panel`) ve Zar Masası (`#hub-inline-dice-panel`) genişlikleri `w-full xl:w-[320px] 2xl:w-[350px] shrink-0` olarak birebir eşitlendi.
     - Sol ana bölümdeki karakter grid'i `grid-cols-1 sm:grid-cols-2 gap-4` olarak düzenlenerek tam 2 karakter kartının sığması sağlandı.
  2. **Not Defteri Motoru (`hub_notes.js` & `webapp/`):**
     - `window.HubNotes` küresel motoru oluşturuldu.
     - **Veri Şeması (`notesList`):** Her not `{ id, text, pinned, completed, createdAt, updatedAt, tags }` nesnesi olarak saklanır; geriye dönük uyumluluk için eski düz metin `notes` alanı otomatik normalize edilir.
     - **Sıralama:** Başa sabitlenenler (`pinned: true`) daima en üstte, kalanlar ise `updatedAt` azalan sırada görüntülenir.
     - **Hashtag & Görev Desteği:** `#gorev`, `#npc`, `#yer`, `#loot` etiketleri otomatik renklendirilir; `- [ ]` görev kutuları tek tıkla tamamlanabilir.
     - **DM vs. Oyuncu İzolasyonu & Senkronizasyon (Kural #6):**
       - Aktif kampanya DM Modunda ise notlar doğrudan `campaign.notesList` içine yazılır, karakterlere sızmaz.
       - Aktif kampanya Oyuncu Modunda ise bu seferdeki aktif karakterin `character.notesList` verisi güncellenir ve `dnd35_character` yerel depolamasıyla anlık senkronize edilir.
  3. **Genişletilmiş Modal (`#hub-full-notes-modal`):**
     - Sağ üstteki `[ 📝 Genişlet ]` butonuna basıldığında açılan 2 kolonlu modal: sol tarafta arama çubuğu ve not listesi, sağ tarafta hızlı etiket çubuğu, pinleme, silme ve tam ekran serbest metin editörü sunar.
  4. **Parite ve Devir Teslim:**
     - `hub.html`, `hub_notes.js` ve `webapp/` altındaki kopyaları %100 eşitlendi; sıfır tavla zarı (U+1F3B2) kuralı tavizsiz korundu.
     - **Karakter Kâğıdına Yönlendirme:** Karakter sayfasında (`index.html`) notlar bölümü geliştirilirken doğrudan `hub_notes.js` dahil edilip `character.notesList` şeması kullanılarak 0 kod tekrarıyla çift yönlü senkronizasyon sağlanacaktır.

---

## 34. NOT DEFTERİ AŞAĞI KADAR GENİŞLEYEN YAZMA ALANI VE SEKME DÜZENİ (2026-10-25)
* **İstek:** Hub açık not panelindeki tek satırlık `#hub-quick-note-input` kutusunun aşağı kadar genişlemesi, kullanıcının gerçek bir not defteri gibi rahatça paragraf ve çok satırlı not alabilmesi.
* **Uygulanan Değişiklikler:**
  1. **Aşağı Kadar Genişleyen Textarea Alanı (`hub.html` & `webapp/`):**
     - Tek satırlık `<input>` kutusu, kartın kalan tüm düşey yüksekliğini dolduran esnek bir `<textarea id="hub-quick-note-input" class="w-full flex-1 min-h-[160px] ...">` çok satırlı serbest metin alanına dönüştürüldü.
     - Klavye kısayolu olarak `Ctrl+Enter` veya `Cmd+Enter` kombinasyonu ile notu anında kaydetme desteği eklendi.
     - Alt kısmına hızlı etiket çubuğu (`+ #gorev`, `+ #npc`, `+ #yer`, `+ #loot`, `+ [ ] Görev`) ve `[ ➕ Notu Kaydet ]` butonu konumlandırıldı.
  2. **İkili Sekme Modu (`hub_notes.js` & `webapp/`):**
     - Panel başlığının altına iki sekme eklendi:
       1. **[ ✏️ Not Defteri ]:** Genişletilmiş textarea yazma alanı. Üstünde varsa sabitlenmiş notlar şeridi (`📌 Sabitlenenler`) yer alır.
       2. **[ 📋 Kayıtlı Notlar (<sayı>) ]:** Arama çubuğu, etiket filtreleri ve geçmiş notların tam listesini gösterir.
     - `HubNotes.switchPanelTab(tab)` fonksiyonu ile sekmeler arası geçiş sağlanır ve son tercih `localStorage` üzerinde saklanır.
  3. **Parite ve Kural Bütünlüğü:**
     - `hub.html`, `hub_notes.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde tutuldu; sıfır tavla zarı (U+1F3B2) kuralı tavizsiz korundu.

---

## 35. KARAKTER KÂĞIDI ÜST BAŞLIK KAMPANYA BUTONUNUN KALDIRILMASI VE DÜZEN SADELEŞTİRMESİ (2026-10-25)
* **İstek:** Karakter kâğıdı (`character.html` / `index.html`) üst gezinti çubuğundaki (navbar) `[ 🎟️ Kampanya ]` (`#btn-join-campaign-nav`) butonunun kaldırılması; kampanya katılım ve yönetim işlemlerinin tamamen `⚙️ Ayarlar` modalı içindeki resmi bölümden yürütülmesi.
* **Uygulanan Değişiklikler:**
  1. **Navbar Sadeleştirmesi (`character.html`, `index.html` & `webapp/`):**
     - Üst sağ kontrol kümesinde 2. sıradaki 2 kolonlu grid yerine tam genişlikli (`w-full`) bir satır yapısına geçildi.
     - `#btn-join-campaign-nav` butonu navbardan tamamen kaldırıldı.
     - `#sync-status-pill` (Bulut Senkron Durumu) 2. satırda tek başına tam genişlikte yerleştirilerek başlık görsel dengesi ve estetiği mükemmelleştirildi.
  2. **Kod Güvenliği & Null-Safety:**
     - `updateCampaignNavButton()` fonksiyonu `#btn-join-campaign-text` elementini null-safe olarak kontrol eder; `#settings-campaign-badge` ve `#settings-modal` içindeki kampanya yönetimi ("BÖLÜM 1: DM KAMPANYASI & MASA BAĞLANTISI") kesintisiz çalışmaya devam eder.
  3. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` kopyaları %100 SHA-256 eşitliğinde tutuldu.
     - Sıfır tavla zarı (`U+1F3B2` / `U+1F3B2`) kuralı tavizsiz korundu.

---

## 36. SEKME SIRALAMASI: "KARAKTER & BECERİLER" SAĞDAN 3. SIRAYA ALINDI (2026-10-25)
* **İstek:** Karakter kâğıdında (`character.html` / `index.html`) `[ 👤 Karakter & Beceriler ]` sekmesinin sağdan 3. sıraya taşınması.
* **Uygulanan Değişiklikler:**
  1. **Masaüstü ve Mobil Sekme Düzeni Senkronizasyonu:**
     - Toplam 7 sekme içerisindeki sıralama soldan sağa şu şekilde düzenlendi:
       1. `[ ⚔️ Savaş Kokpiti ]`
       2. `[ 🔮 Büyü & Manevra ]`
       3. `[ 🛡️ Savunma & Bufflar ]`
       4. `[ 🎒 Çanta & Eşyalar ]`
       5. `[ 👤 Karakter & Beceriler ]` ➔ **Sağdan 3. Sıra**
       6. `[ 📚 Master DB ]` ➔ Sağdan 2. Sıra
       7. `[ ⚡ Zar At ]` ➔ Sağdan 1. Sıra (En Sağ)
     - Mobil alt navigasyon barı (`mobile-tab-btn-*`) da bu yeni ergonomik sıralamayla birebir eşitlendi.
  2. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` %100 SHA-256 paritesinde tutuldu.
     - Sıfır tavla zarı (`U+1F3B2`) kuralı tavizsiz korundu.

---

## 37. KURAL KAYNAKLARI: YEREL KATALOG & PARAMETRİK MOTOR 1. SIRAYA ALINDI (2026-10-25)
* **İstek:** `rule_master.js` ve Master DB kaynaklar kataloğunda atıl durumdaki harici Foundry VTT D35E (Rughalt) paketinin kaldırılması; ilk sıraya (Priority 1) projenin kendi dahili "Yerel Kural Kataloğu & Parametrik AI Motoru"nun yerleştirilmesi.
* **Uygulanan Değişiklikler:**
  1. **Kaynaklar Kataloğu Güncellemesi (`rule_master.js` & `webapp/`):**
     - **Priority 1 (Dahili & Yerel):** `Yerel Kural Kataloğu & Parametrik AI Motoru` (140+ hazır RAW SRD kaydı, parametrik hafıza, 0ms gecikme, çevrimdışı çalışma).
     - **Priority 2 (Core SRD):** `Core 3.5e SRD (d20srd & dndsrd)` (PHB, DMG, MM temiz HTML / web referansı).
     - **Priority 3 (Ek Kitaplar):** `Extended Splatbooks Index (srd.dndtools)` (Complete serisi, MIC, SpC genişletilmiş indeks).
  2. **Arayüz ve Görsel Düzen:**
     - `renderSourcesCatalog()` içerisinde dahili kaynaklar için `⚡ Dahili Motor` etiketi, harici web kaynakları için `Bağlantıyı Aç ↗` linki dinamik olarak render edildi.
     - `character.html` / `index.html` üzerindeki AI arama açıklama metinleri ve yükleme göstergesi ("Yerel Katalog -> Core SRD -> Splatbooks...") güncellendi.
  3. **Parite ve Kural Bütünlüğü:**
     - `rule_master.js`, `character.html`, `index.html` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde tutuldu.
     - Sıfır tavla zarı (`U+1F3B2`) kuralı korundu.

---

## 38. KAMPANYA KİTAPLARI KISALTMALARI: KOMPAKT ÇEKMECEYE DÖNÜŞTÜRÜLDÜ (2026-10-25)
* **İstek:** Ayarlar modalı Bölüm 4'teki 32 adet statik ek kitap kartının sayfada kapladığı düşey alanı temizlemek amacıyla kompakt bir çekmeceye dönüştürülmesi ve başlığının `2. Kampanya Kitapları Kısaltmaları` olarak güncellenmesi.
* **Uygulanan Değişiklikler:**
  1. **Kompakt Akordeon / Çekmece Mimarisi (`character.html`, `index.html` & `webapp/`):**
     - Bölüm `<details class="group bg-slate-950/60 border border-slate-800 rounded-xl ...">` konteyneri içerisine alındı.
     - Varsayılan olarak kapalı durur; başlık satırında `📚 2. Kampanya Kitapları Kısaltmaları (32 Kitap / Kısaltma)` ve dönebilen `▼` oku yer alır.
     - Tıklandığında yumuşakça açılarak Master DB ve kural metinlerinde kullanılan resmi D&D 3.5e kitap kodlarını ve açıklamalarını listeler.
  2. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` %100 SHA-256 eşitliğinde tutuldu.
     - Sıfır tavla zarı (`U+1F3B2`) kuralı tavizsiz korundu.

---

## 39. CL KURALI & CASTER TİPİ 2 KOLONLU SİMETRİK DÜZEN VE DM BOON VARSAYILANI (2026-10-25)
* **İstek:** Ayarlar modalı Bölüm 5'teki `🔮 CL Kuralı` ve `🎯 Caster Tipi` seçim alanlarının simetrik, dengeli bir ızgara düzenine kavuşturulması ve `Character Level (DM Boon)` modunun varsayılan yapılması.
* **Uygulanan Değişiklikler:**
  1. **2 Kolonlu Simetrik Izgara Mimarisi (`character.html`, `index.html` & `webapp/`):**
     - Üstte başlık ve masa kuralı açıklaması alt çizgi ile ayrıldı.
     - Kontroller `grid grid-cols-1 sm:grid-cols-2 gap-2` ile iki eşit karta bölündü:
       - **Sol Kolon:** `🔮 CL Kuralı (Caster Level)` kartı (`border-purple-900/40`),
       - **Sağ Kolon:** `🎯 Caster Tipi (Disiplin)` kartı (`border-indigo-900/40`).
     - Her iki kart da tam genişlikte (`w-full`), eşit iç boşluklu (`p-2.5 rounded-xl`) ve dengeli açılır menü boyutlarıyla tasarlandı.
  2. **Varsayılan CL Kuralı:**
     - Yeni oluşturulan karakterlerde ve arayüzde `clMode` değeri `Character Level (DM Boon)` olarak varsayılana çekildi.
     - Büyü slotları ve seviyeleri sınıf seviyesine göre ayrılırken, büyü gücü ve süresi karakter seviyesine göre hesaplanır.
  3. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` %100 SHA-256 eşitliğinde güncellendi.
     - Sıfır tavla zarı (`U+1F3B2`) kuralı korundu.

---

## 40. BAB & SAVE HESAPLAMA SİSTEMİ: STANDART RAW VARSAYILAN YAPILDI (2026-10-25)
* **İstek:** Ayarlar modalı Bölüm 5'teki `📐 BAB & Save Hesaplama Sistemi` seçiminde `Standard Core 3.5e (Standart RAW)` seçeneğinin varsayılan (`selected`) yapılması.
* **Uygulanan Değişiklikler:**
  1. **Arayüz ve Şema Varsayılanı:**
     - HTML `<select id="setting-bab-save-system">` elementinde `Standard Core 3.5e (Standart RAW)` ilk sıraya alınarak `selected` olarak işaretlendi.
     - Yeni karakter oluşturma motorunda (`createCleanDnd35Character`) `settings.babSaveSystem` varsayılan değeri `'standard'` yapıldı.
     - `character.html` / `index.html` içerisindeki tüm UI ilklendirmelerinde ve hesaplama fonksiyonlarında `character.settings?.babSaveSystem || 'standard'` kuralı uygulandı.
  2. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` %100 SHA-256 paritesinde tutuldu.
     - Sıfır tavla zarı (`U+1F3B2`) kuralı korundu.








---

## 39. ÇAPRAZ CİHAZ SENKRONİZASYONUNDA SİLİNEN KARAKTERLERİN HORTLAMASINI ÖNLEYEN "MEZAR TAŞI" (TOMBSTONE) MOTORU (2026-10-25)
* **Sorun:** Bir cihazda silinen karakterlerin (örneğin Tarrasque), günler sonra açılan başka bir cihazın yerel önbelleğinde (localStorage) kalması sebebiyle, o eski cihazın buluta bağlanırken "Bende bu karakter var ama bulutta yok, demek ki yeni açılmış" varsayımıyla silinmiş karakteri tekrar buluta yüklemesi ve karakterin tüm cihazlarda hortlaması (Zombie / Resurrected record sorunu).
* **Uygulanan Çözüm (Tombstone & Zaman Damgası Kalkanı):**
  1. **Mezar Taşı (Tombstone) Listesi (supabase_auth.js & gdrive_sync.js):**
     - Bir karakter silindiğinde (deleteCharacter), ID'si dnd35_tombstones yerel listesine ve Supabase user_metadata.deleted_character_ids bulut dizisine mezar taşı olarak kaydedilir.
     - Vercel KV / GDriveSync bulut payload'ına tombstones dizisi dahil edildi.
  2. **Eski Cihaz Açılış Kalkanı (hub.html & webapp/):**
     - İkinci bir cihaz açıldığında ilk iş olarak buluttaki ve yereldeki mezar taşları birleştirilir (tombstoneSet).
     - Yerel önbellekte mezar taşı listesinde olan bir karakter varsa derhal yerel hafızadan da temizlenir (changed = true).
     - Bulutta hortlamış herhangi bir kopya tespit edilirse derhal buluttan silinir.
     - **Zaman Damgası Kalkanı:** Yerelde olup bulutta bulunmayan bir karakterin ID/oluşturulma tarihi bu cihazın son bulut senkron zamanından (lastCloudSyncTs) daha eskiyse, başka bir cihazda silinmiş kabul edilir, mezar taşına eklenir ve asla buluta yüklenmez. Yalnızca son senkrondan sonra çevrimdışı gerçekten yeni oluşturulmuş karakterler buluta yüklenir.
  3. **Parite ve Kural Bütünlüğü:**
     - hub.html, supabase_auth.js, gdrive_sync.js ve webapp/ kopyaları %100 SHA-256 eşitliğinde tutuldu.
     - Sıfır tavla zarı kuralı tavizsiz korundu.


---

## 40. YENİ KAMPANYA EKLE BUTONU KAMPANYA SEKMELERİ ŞERİDİNE TAŞINDI VE SAĞA YASLANDI (2026-10-25)
* **İstek:** Hub üst başlığındaki 4 sıralı sağ blokta yer alan "Yeni Kampanya Ekle" butonunun oradan alınıp, `#campaign-tabs-container` (Kampanya Sekmeleri) satırına taşınması ve sağa yaslanması (`ml-auto`).
* **Uygulanan Değişiklikler:**
  1. **Üst Başlık Sadeleştirmesi (`hub.html` & `webapp/`):**
     - Üst sağ bloktaki `openNewCampaignModal()` butonu kaldırıldı; Profil Slotu, Yedekle/İçe Aktar/Sıfırla ve Bulut Senkron Durumu 3 eşit ve simetrik satır (36px / h-9) halinde kusursuz dengelendi.
  2. **Kampanya Sekmelerine Entegrasyon & Sağa Yaslama (`renderCampaignTabs`):**
     - `renderCampaignTabs()` içinde son kampanya hapından ("Bağımsız / Atanmamış") hemen sonra `[ 🏰 Yeni Kampanya Ekle ]` butonu eklendi.
     - `ml-auto` ve `shrink-0` sınıfları verilerek sekmeler satırının en sağına (Görünüm Modu Değiştirici'nin hemen soluna) yaslandı.
     - Buton yüksekliği ve iç dolgusu (`px-3.5 py-1.5 rounded-xl text-xs font-bold`) diğer kampanya hapları ile aynı hizada olacak şekilde estetik olarak uyarlandı.
  3. **Parite ve Kural Bütünlüğü:**
     - `hub.html` ve `webapp/hub.html` kopyaları %100 SHA-256 eşitliğinde tutuldu.
     - Sıfır tavla zarı kuralı tavizsiz korundu.


---

## 41. HUB ÜST BAŞLIK SÜPÜRGE (🧹) BUTONU KALDIRILDI, YERİNE AYARLAR (⚙️) MODALI VE GLOBAL STANDARTLAR EKLENDİ (2026-10-25)
* **İstek:** Hub üst başlık sağ eylem barındaki tüm verileri silen süpürge (🧹) butonunun kaldırılması, yerine karakter sayfasındaki [ ⚙️ Ayarlar ] butonunun ve modallarının getirilmesi; bu ayarların tüm yeni karakterler için global masa standardı olması ve karakter kağıdında istenirse özelleştirilebilmesi.
* **Uygulanan Değişiklikler:**
  1. **Arayüz Değişimi (hub.html & webapp/hub.html):**
     - Üst sağ blokta yer alan resetAllHubLocalData() süpürge butonu kaldırıldı. Yerine openSettingsModal() tetikleyicili [ ⚙️ Ayarlar ] butonu eklendi. Satır artık 3 dengeli buton halindedir: [ 💾 Yedekle ] | [ 📂 İçe Aktar ] | [ ⚙️ Ayarlar ].
     - Sıfırlama işlevi tamamen kaybolmaması için Settings modalı içerisindeki "Veri Yönetimi / Tehlikeli Bölge" alanına güvenli bir şekilde taşındı.
  2. **Ayarlar Modalı (#settings-modal):**
     - **Bölüm 1 - Rule Master (Gemini AI):** Google Gemini API anahtarı girişi, localStorage.getItem('gemini_api_key') senkronizasyonu, canlı bağlantı testi (ping) ve durum göstergesi. (Karakter kağıdı ile aynı depolama anahtarını paylaşır).
     - **Bölüm 2 - Masa & Kural Standartları:**
       - Beceri Konsolidasyonu (3.5e RAW vs Pathfinder / Konsolide Beceriler).
       - Feat İlerleme Sistemi (Core 1, 3, 6... vs Pathfinder / House Rule 1, 3, 5, 7...).
       - BAB & Save Hesaplama Sistemi (Standard RAW vs Fractional BAB/Saves).
       - Caster Level Hesaplama Modu ve Tipi.
       - ASF (Arcane Spell Failure) Yok Sayma.
       - Kritik Teyidi Yok Sayma (No Crit Confirm).
       - Manevra Kritiklerini Açma.
     - **Bölüm 3 - 32 Kampanya Kitabı Kısaltmaları (Splatbooks):** PHB, DMG, MM, SpC, MIC, ToB vb. tüm kaynak kitaplar ve kısaltma dizini.
     - **Bölüm 4 - Veri Yönetimi & Tehlikeli Bölge:** JSON Dışa/İçe Aktar ve HUB Verilerini Sıfırla.
  3. **Global Standart Veri Kontratı (dnd35_global_settings):**
     - Hub'da belirlenen kurallar dnd35_global_settings anahtarında saklanır.
     - createCleanDnd35Character() fonksiyonu artık oluşturulan her yeni karaktere settings ve houseRules nesnelerini bu global standarttan devralarak yazar.
     - Karakter kendi kağıdında açıldığında bu ayarları değiştirebilir; karakterin yerel ayarları önceliklidir (karakter bazlı override).
  4. **Parite ve Kural Bütünlüğü:**
     - hub.html ve webapp/hub.html %100 SHA-256 eşitliğinde tutuldu.
     - Kesinlikle hiçbir tavla zarı emoji kullanılmadı.


---

## 42. DİNLENME (SHORT & LONG REST) ETKİLEŞİMLİ TOAST SEÇİM VE TIKLAMA ONARIMI (2026-10-25)
* **İstek:** Karakter kâğıdı sol HUD alanındaki Dinlenme butonlarında (`performRest()` / Kısa Dinlenme ve `performLongRest()` / Uzun Dinlenme) açılan bildirim menüsünden seçeneklerin (Tam Can, RAW, 5 Dk, 1 Saat vb.) seçilememesi sorununun giderilmesi.
* **Tespit Edilen Kök Nedenler:**
  1. **Çakışan `toast.onclick` & `cursor-pointer`:** `showDiceTopToast()` içinde kartın geneline tıklandığında hemen kapatan `toast.onclick` dinleyicisi `hasActions` true olduğunda da bağlı kalıyordu. Buton kenarına veya metnine tıklandığında kart tıklaması tetiklenerek seçim işletilmeden toast kapanıyordu.
  2. **`onOutsideClick` Temizleme & Zamanlama:** Dışarı tıklama dinleyicisi aksiyon butonuna tıklandığında temizlenmiyor, sonraki tıklamalarda istenmeyen `onCancel` tetiklenmesine yol açıyordu.
  3. **Mobil Dokunmatik Gecikmesi & `touch-manipulation`:** Aksiyon butonlarında mobil cihazlarda 300ms tıklama gecikmesi ve dokunmatik hedef hassasiyeti eksikti.
  4. **`character.hp` Null Güvenliği:** Dinlenme çalıştırıcılarında (`executeLongRest` ve `executeShortRest`) eksik `character.hp` durumunda oluşabilecek `TypeError` riski önlendi.
* **Uygulanan Değişiklikler:**
  1. **`showDiceTopToast()` İzolasyonu (`character.html` & `index.html`):**
     - `hasActions` true olduğunda ana karta `toast.onclick` atanması engellendi; kart imleci `cursor-default` yapıldı ve `"Kapatmak için tıklayın"` başlığı kaldırıldı.
     - Aksiyon butonları tıklandığında `ev.stopPropagation()` ile birlikte `onOutsideClick` dinleyicisi anında temizlenmekte, karar toast'u yumuşakça kapatılmakta ve eylem (`executeLongRest` / `executeShortRest`) güvenli `try...catch` ile icra edilmektedir.
     - Butonlara `touch-manipulation` ve `active:scale-95` eklenerek dokunmatik ekranlarda sıfır gecikmeli tepki sağlandı.
  2. **Dinlenme Motoru Sağlamlaştırması:**
     - `executeLongRest` ve `executeShortRest` fonksiyonlarında `character.hp` için null-guard ve güvenli tamsayı kontrolleri eklendi.
     - Dinlenme tamamlandığında sonuç toast'u (iyileşen HP, tazelenen slot ve manevralar) sorunsuz ekrana yansıtılmaktadır.
  3. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html` ve `webapp/index.html` kopyaları %100 SHA-256 birebir eşitliğinde güncellendi.
     - Kesinlikle hiçbir tavla zarı emoji (`U+1F3B2`) kullanılmadı.

---

## 42. HUB AYARLAR MODALI KARAKTER SAYFASIYLA BİREBİR EŞİTLENDİ VE KAPSAM/KARAKTER ÖZELLEŞTİRMESİ EKLENDİ (2026-10-25)
* **İstek:** Hub üst başlığındaki [ ⚙️ Ayarlar ] butonunun altına karakter sayfasındaki 6 bölümlü ayar menüsünün (DM Kampanyası, Rule Master AI, JSON Yedekleme/İçe Aktarma, D&D 3.5e Kural Kaynakları & 32 Splatbooks, House Rules & Masa Tercihleri, Tehlikeli Bölge) birebir getirilmesi; Hub'da yapılan ayarların yeni oluşturulan karakterlere yansıması ve her karakterin kendi özel ayarını seçebilmesi.
* **Uygulanan Değişiklikler:**
  1. **Tam Pariteli Menü Yapısı (#settings-modal):**
     - **Bölüm 1 - DM Kampanyası & Masa Bağlantısı:** Canlı kampanya durumu rozeti ve [ 🏰 Yeni Kampanya Ekle ] butonu.
     - **Bölüm 2 - Rule Master (Gemini AI) Ayarları:** Google AI Studio anahtar girişi, tarayıcı yerel kaydı (`gemini_api_key`), canlı bağlantı ve model listeleme testi (ping) butonu.
     - **Bölüm 3 - Yedekleme & Geri Yükleme (JSON):** Tam Paket İndir/Yükle, Karakter Dosyası İndir/Yükle, Master DB İndir/Yükle ve otomatik içe aktarma motoru (`handleJsonFileUpload`).
     - **Bölüm 4 - Kural Kaynakları & Kampanya Kitapları:** 3 kademeli arama kaynağı ve akordiyon içinde 32 resmi D&D 3.5e ek kitap kısaltması kataloğu.
     - **Bölüm 5 - Masa & Kural Tercihleri (House Rules):** 
       - 1. Beceri Konsolidasyonu (Birleştirilmiş 7 Grup vs Standart 46 RAW Beceri)
       - 2. Feat Dağıtım Modu (Standard 3.5e, Every 2 Levels, Every 4 Levels, All Free)
       - 3. Caster Level Kuralı & Caster Tipi (Character Level Boon, Warlock Boon, Class Level, Custom)
       - 4. Ignore ASF / Boon
       - 5. BAB & Save Hesaplama Sistemi (Standard Core 3.5e vs Fractional Unearthed Arcana)
       - 6. No Crit Confirm (Otomatik Kritik)
       - 7. Tome of Battle Manevralarını Katla
       - 8. Kritik Tehdit Tavanı (Crit Range Cap: 15-20, 16-20, vb.)
       - 9. Keen & Improved Critical İstiflenmesi (Stack Diminishing, RAW None, Full 4x)
       - 10. Hassas Hasar Limiti (Sneak Attack: Turda İlk İsabet vs Her İsabet)
     - **Bölüm 6 - Tehlikeli Bölge (Danger Zone):** Seçili Karakteri Sıfırla ve Fabrika Ayarlarına Dön (Tümünü Sıfırla).
  2. **İki Katmanlı Kapsam & Karakter Özelleştirme Motoru (Scope Architecture):**
     - Ayarlar modalının en üstüne akıllı **Ayar Hedefi / Kapsam Seçici** (`#settings-scope-select`) eklendi:
       - **🌐 Tüm Masa Standartları:** Seçildiğinde yapılan ayarlar `dnd35_global_settings` anahtarına yazılır ve Hub üzerinden açılan tüm yeni karakterler (Bestiary veya Boş Şablon) bu ayarları doğrudan devralır.
       - **👤 [Karakter Adı] Özel Ayarları:** Hub'daki mevcut karakterler listeden seçilebilir. Seçilen karakterin `fullData.settings` ve `fullData.houseRules` alanları doğrudan düzenlenebilir.
       - **🔄 Masaya Eşitle Butonu:** Bir karaktere özel ayar yapıldığında istenirse tek tıklamayla global masa standartlarına geri döndürülebilir.
     - Ayrıca Hub Karakter Kartı Düzenleme Modalına (`#edit-character-modal`) "⚙️ Bu Karakterin Özel Ayarlarını & Kurallarını Aç" kısayol butonu entegre edildi.
  3. **Parite ve Kural Bütünlüğü:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 paritesindedir.
     - Kesinlikle hiçbir standart tavla zarı emoji kullanılmamıştır.

---

## 43. UZUN VE KISA DİNLENME ANLIK CAN YENİLENMESİ SENKRONİZASYON DÜZELTMESİ (2026-10-25)
* **Kullanıcı Bildirimi:**
  - Uzun dinlenmeye tıklanıp "Tam Can" seçildiğinde bulut senkron simgesi yanıp sönüyor ancak ekrandaki HP barı ve can değerleri artmıyor; yalnızca sayfa yenilendiğinde (F5) canın iyileştiği görülüyordu.
* **Kök Neden Analizi (Root Causes):**
  1. `executeLongRest()` ve `executeShortRest()` içinde `saveStateToStorage(true)` sonrasında `renderAll()` çağrılmadan önce korumasız çağrılan `renderSpellSlots()` ve `renderManeuvers()` yardımcı fonksiyonları:
     - `character.skills` alanı bir Obje (`{}`) olduğunda `(character.skills || []).find` çağrısı `TypeError` fırlatıyor ve script icrasını durduruyordu.
     - Büyü yuvaları kaynağında (`compact-slots-source-tabs`) `sources[0].key` kontrolü korumasız kaldığı için istisna durumunda `renderAll()` ve sonuç bildirimi toast'ına asla ulaşılamıyordu.
  2. HP değişikliği sonrasında `renderHUD()` doğrudan ve anlık olarak çağrılmadığı için ara hesaplamalarda oluşabilecek herhangi bir gecikme veya istisna ekrandaki HP sayacını dondurabiliyordu.
  3. `character.hp._lastPlayerChangeTs` zaman damgası DM zaman damgasının altında kalma riski taşıdığında Hub senkronizasyonu oyuncunun iyileşme aksiyonunu ezebiliyordu.
* **Uygulanan Düzeltmeler:**
  1. **Anlık ve Senkronize HUD Güncellemesi (0ms):**
     - Hem `executeLongRest()` hem de `executeShortRest()` fonksiyonlarında HP hesaplandığı anda ilk satırda doğrudan `renderHUD()` çağrıldı (`try...catch` korumalı). Ekrandaki `#hp-current-display`, `#hp-max-display` ve geçici/nonlethal etiketleri 0 milisaniyede anında yenilenir.
  2. **Savunmacı ve Hataya Dayanıklı İcra Zinciri:**
     - `updateRoundDisplays()`, `saveStateToStorage(true)`, `renderManeuvers()`, `renderSpellSlots()` ve `renderAll()` bağımsız `try...catch` bloklarına alındı; hiçbir alt modül hatası ana ekranın güncellenmesini veya dinlenmenin tamamlanmasını engelleyemez.
  3. **Beceriler & Kural Motoru Güvenliği:**
     - `rule_engine.js:1722` ve `character.html:20588`'de `character.skills`'in Dizi veya Obje olması durumları `Array.isArray(character.skills) ? character.skills : Object.values(character.skills || {})` ile korumaya alındı.
     - `renderSpellSlots()` grid kaynağı boş/tanımsız durumlarına karşı güvenli hale getirildi.
  4. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `rule_engine.js` ve bunların `webapp/` altındaki kopyaları %100 SHA-256 birebir eşitliğinde güncellendi.
     - Kesinlikle hiçbir tavla zarı emoji (`U+1F3B2`) kullanılmadı.

---

## 43. HUB KARAKTER KARTLARI YENİLENDİ: BÜYÜTÜLMÜŞ TİPOGRAFİ, GENİŞ TIKLANABİLİR ALANLAR VE NOT DEFTERİ İLE EŞİT BOYUT (2026-10-25)
* **İstek:** Hub sayfasındaki karakter kartlarının genel olarak yazılarının büyütülmesi, tıklanabilir buton ve alanların daha ergonomik hale getirilmesi, okunurluğun artırılması ve kartın dikeyde uzatılarak yanındaki Not Defteri Paneli (`#hub-inline-notes-panel`) ile aynı boyuta eşitlenmesi.
* **Uygulanan Değişiklikler:**
  1. **Yükseklik Eşitlemesi (Height Parity with Notes Panel):**
     - Karakter kartları ve boş kart şablonuna `h-full min-h-[580px] xl:min-h-[620px]` sınıfları uygulandı.
     - 2 kolonlu ızgara kapsayıcılarına `items-stretch` eklendi; böylece yan yana duran Sol Bölüm (Karakter Kartları), Orta Bölüm (Not Defteri) ve Sağ Bölüm (Zar Masası) panellerinin boyları %100 kusursuz eşitlendi.
  2. **Büyütülmüş Tipografi ve Ergonomik Tıklanabilir Kontroller:**
     - **Kart Başlığı ve Portre:** İsim `text-base sm:text-lg font-black`, ırk/sınıf `text-xs sm:text-sm text-slate-200`, portre `w-16 h-16` ve eylem butonları `w-8 h-8` boyutuna büyütüldü.
     - **Can (HP) Barı & Hızlı Hasar:** HP fontu `text-base sm:text-lg font-black font-mono`, bar kalınlığı `h-2.5`, hızlı +/- butonları ve özel miktar giriş kutusu (`w-14 sm:w-16 h-7`) genişletilerek dokunmatik ve fare ergonomisi maksimize edildi.
     - **AC & Saldırı Kutusu:** Zırh değeri `text-xl sm:text-2xl font-black`, Dokunuş/FF ve İnisiyatif atma butonu daha okunaklı ve net butonlarla donatıldı; taban hız (`30 ft`) eklendi.
     - **Kurtarma Atışları & Pasifler:** Fortitude, Reflex, Will ve Spot/Listen butonları `px-3 py-1.5` boyutunda, kalın harfli ve ferah tıklama hedefleri olarak yeniden tasarlandı.
     - **6 Temel Yetenek Skoru Şeridi (STR, DEX, CON, INT, WIS, CHA):** Kartın uzatılan dikey alanına 6 temel stat değeri ve anlık zar atılabilir modifiye butonları eklendi.
     - **Karakteri Aç & Yönet Butonu:** Kartın en altına `py-3 text-sm font-extrabold` boyutunda tam genişlikte buton olarak sabitlendi.
  3. **Parite ve Kural Bütünlüğü:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 eşitliğinde tutuldu.
     - Kesinlikle hiçbir tavla zarı emoji kullanılmadı.

---

## 44. BÜYÜ YUVALARI (SPELL SLOTS) ŞEMA NORMALİZASYONU VE GÜVENLİK KORUMASI (2026-10-25)
* **Kullanıcı Bildirimi & Hata Dökümü:**
  - `renderSpellSlotsStrip error: TypeError: s.slots.some is not a function`
  - `renderSpellSlots error: TypeError: (character.spellcasting.slots || []).filter is not a function`
  - `renderManeuvers error: TypeError: (character.spellcasting.slots || []).filter is not a function`
  - `renderKnownSpells error: TypeError: (character.spellcasting.slots || []).filter is not a function`
* **Kök Neden:**
  - Karakter veri tabanında (özellikle NPC/Bestiary yaratıklarında veya harici içe aktarmalarda) büyü yuvalarının `character.spellcasting.slots`, `preparedSlots` veya `divineSlots` alanları bir Dizi (`Array`) yerine Nesne (`Object: {"0": 6, "1": 4}` veya `{}`) olarak saklandığında, `({} || []).filter` ve `s.slots.some` çağrıları `TypeError` fırlatıyor ve savaş kokpiti, büyü yönetimi, manevralar ve bilinen büyüler panellerinin çizimini kilitliyordu.
* **Uygulanan Çözüm:**
  1. **Evrensel Normalizasyon Fonksiyonu (`normalizeCharacterSpellcasting`):**
     - Hem `renderAll()` hem de `loadInitialData()` aşamalarında `character.spellcasting.slots`, `preparedSlots` ve `divineSlots` alanlarının nesne veya dizi olup olmadığı kontrol edilerek anında standart `{ level, daily, used, dmBonus }` dizi formatına dönüştürülmesi sağlandı.
  2. **Defansif Fonksiyon Korumaları:**
     - `getAvailableSpellSlotSources()` içinde `toSlotsArray()` normalizasyonu eklenerek `all.filter(...)` içindeki `s.slots.some` çağrısı `Array.isArray(s.slots)` ile koruma altına alındı.
     - `getSpellSlotsArrayBySource(sourceKey)` fonksiyonunda dizi garantisi sağlandı.
     - `calculateWizardSlots`, `calculateDivineSlots` ve `calculateSorcererSlots` fonksiyonlarının girişinde `existingSlots` parametresi güvenli diziye normalize edildi.
     - `renderSpellsCockpit()` ve `renderSpellSlotsStrip()` içindeki slot ve sayaç döngüleri korumalı hale getirildi.
  3. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html` ve `webapp/index.html` %100 SHA-256 paritesinde eşitlendi (`f9445bc9ce`).
     - Sıfır `U+1F3B2` kuralı tavizsiz uygulandı.

---

## 44. HUB KARAKTER KARTLARI, NOT DEFTERİ VE ZAR MASASI PANELLERİ 0.66 ORANINDA KISALTILDI (2026-10-25)
* **İstek:** Karakter kartları, Not Defteri Paneli (`#hub-inline-notes-panel`) ve Zar Masası Paneli (`#hub-inline-dice-panel`) alanlarının dikey boylarının 0.66 ile çarpılarak (~410px) bu oranda kompaktlaştırılması ve kısaltılması.
* **Uygulanan Değişiklikler:**
  1. **0.66 Oranında Boyutlandırma (~410px):**
     - Karakter kartları ve boş şablon kartının yüksekliği `min-h-[580px] xl:min-h-[620px]` değerinden 0.66 ile çarpılarak `min-h-[390px] xl:min-h-[410px] xl:max-h-[430px]` değerine çekildi.
     - Not Defteri Paneli (`#hub-inline-notes-panel`) içindeki dikey alanlar ve textarea yüksekliği (`min-h-[160px]` -> `min-h-[105px]`) 0.66 oranında kompaktlaştırıldı.
     - Zar Masası Paneli (`#hub-inline-dice-panel`) içindeki dikey boşluklar ve havuz özet alanı 0.66 ölçeğinde dengelenerek `min-h-[390px] xl:min-h-[410px] xl:max-h-[430px]` yüksekliğine eşitlendi.
  2. **İç Düzen ve Ergonomi Korunumu:**
     - Yazı büyüklükleri ve butonların ferah tıklama hedefleri korunarak dikey boşluklar (`space-y`, `padding`) optimize edildi.
     - Masaüstü görünümünde (`xl:flex-row items-stretch`) Sol Bölüm (Karakter Kartları), Orta Bölüm (Not Defteri) ve Sağ Bölüm (Zar Masası) tamamen 410px seviyesinde simetrik ve hizalı duruma getirildi.
  3. **Parite ve Kural Bütünlüğü:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 eşitliğinde tutuldu.
     - Kesinlikle hiçbir tavla zarı emoji kullanılmadı.


---

## 45. ZAR MASASI PANELİNDEKİ KAYDIRMA ÇUBUĞU KALDIRILDI VE ZAR KONTROLLERİ KOMPAKTLAŞTIRILDI (2026-10-25)
* **İstek:** Hub sayfasındaki Zar Masası Paneli'nde (`#hub-inline-dice-panel`) dikey kaydırma çubuğunun (scrollbar) tamamen kaldırılması, gerekirse zar sembolleri ve kontrollerin daraltılarak panel içine taşma olmaksızın sığdırılması.
* **Uygulanan Değişiklikler:**
  1. **Kaydırma Çubuğu Kaldırıldı (Overflow Elimination):**
     - `#hub-inline-dice-panel` ana kart kapsayıcısındaki `overflow-y-auto custom-scroll` sınıfları kaldırılarak `overflow-hidden` yapıldı.
     - Kart padding değeri `p-3 sm:p-3.5` yerine `p-2.5 sm:p-3`, dikey boşluklar `space-y-2` yerine `space-y-1.5` olarak dengelendi.
  2. **Zar Butonları ve Kontrollerin Kompaktlaştırılması:**
     - 7 standart RPG zarı butonu (d4, d6, d8, d10, d12, d20, d100) `p-2 rounded-xl` yerine `p-1 sm:p-1.5 rounded-lg` formatına çekildi.
     - Zar vektör SVG ikonları `w-4 h-4` yerine `w-3.5 h-3.5`, fontlar `text-[10px]` ve sayaçlar `h-2.5 text-[9px]` olarak optimize edildi.
     - Atış Modu ve Renk seçici butonları dikeyde inceltildi.
     - Aktif Havuz Özeti ve Bonus barı `h-11` yerine `h-9` olarak revize edildi.
     - "Zarları At" ve temizleme butonları `py-1.5 px-3` seviyesinde daraltıldı.
     - Formül ve Son Atış çekmecesi (`#dice-advanced-content`) açıldığında dış kartın düzenini bozmaması için kendi içine `max-h-56 overflow-y-auto custom-scroll pr-1` kuralı uygulandı.
  3. **Parite ve Kural Bütünlüğü:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 eşitliğinde tutuldu.
     - Proje kuralı gereği kesinlikle hiçbir standart 6 yüzlü tavla zarı emojisi kullanılmadı.


---

## 46. ZAR MASASI ÇEKMECESİ AÇILDIĞINDA TÜM HÜCRENİN AŞAĞI GENİŞLEMESİ (2026-10-25)
* **İstek:** Zar Masası Paneli'nde "Formül, Son Atış & Geçmiş" çekmecesi açıldığında sadece çekmecenin içi değil, tüm Zar Masası hücresinin (kartının) aşağı doğru serbestçe genişlemesi, kesilen veya okunamayan alt alanların (Son Zar Sonucu kartı, Son Atışlar geçmiş listesi ve formül alanı) net ve eksiksiz okunabilir hale getirilmesi.
* **Uygulanan Değişiklikler:**
  1. **Tüm Hücrenin Aşağı Doğru Doğal Genişlemesi:**
     - `#hub-inline-dice-panel` içindeki ana karttan `xl:max-h-[430px]` ve `h-full` kısıtlamaları kaldırıldı; taban yükseklik `min-h-[390px] xl:min-h-[410px]` olarak korundu.
     - Kart açılıp kapandığında yüksekliğin akıcı şekilde oturması için `transition-all duration-200` eklendi.
     - Çekmece kapalıyken kart tam 410px boyutunda kalarak Not Defteri ve Karakter Kartları ile kusursuz simetrik durur; çekmece açıldığında ise tüm hücre aşağı doğru uzayarak altındaki tüm elemanları ferahça gösterir.
  2. **İç Kısıtlamaların Kaldırılması & Geçmiş Listesi Genişletmesi:**
     - `#dice-advanced-content` üzerindeki `max-h-56 overflow-y-auto` kaldırıldı. Çekmece içi sıkışma engellendi.
     - `#dice-history-list` alanı `max-h-36` yerine `max-h-64` yapılarak 5-6 atış kaydının hiçbir öğesi kesilmeden, rozetleri ve detaylarıyla eksiksiz görüntülenmesi sağlandı.
  3. **Kolon Hizalaması (`items-start`):**
     - Üç ana sütunun (Karakterler, Not Defteri, Zar Masası) yer aldığı üst kapsayıcı `xl:flex-row items-start` olarak ayarlandı. Böylece Zar Masası aşağı doğru uzadığında Not Defteri veya karakter kartlarının altında boşluk/esneme bozulması oluşması önlendi.
  4. **Parite ve Devir Teslim:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 paritesinde eşitlendi.
     - Proje kuralı gereğince hiçbir standart tavla zarı emoji kullanılmadı.


---

## 47. BÜTÜNLEŞİK KARAKTER PROFİLİ VE TEMEL STAT DAĞILIMI MODALI (2026-10-25)
* **İstek:** Karakter kimlik bilgileri (Ad, Irk, Irksal Nitelikler Kartı, Yönelim, Tanrı/İnanç, Boyut, Cinsiyet, Yaş, Boy, Kilo, Taban Hız, Portre ve Duvar Kağıdı ayarları) ile Temel Stat Dağılımı (Manuel Serbest Giriş, 28 Puan RAW Point Buy, 4d6 Drop Lowest Zar Havuzu) yapısının tek bir bütünleşik "Karakter Profili & Temel Statlar" modalında birleştirilmesi.
* **Uygulanan Değişiklikler:**
  1. **Bütünleşik Modal Mimarisi (`#stat-distribution-modal`):**
     - Modal başlığı "Karakter Profili & Temel Statlar (D&D 3.5e RAW)" olarak revize edildi, genişlik ferah çalışma için `max-w-2xl` yapıldı.
     - Üst sekmelere 4 seçenek eklendi:
       1. `[ 👤 Kimlik & Irk ]` (`#tab-stat-dist-identity` / `#panel-stat-dist-identity`)
       2. `[ ✏️ Manuel (Serbest) ]` (`#tab-stat-dist-manual` / `#panel-stat-dist-manual`)
       3. `[ ⚖️ Point Buy (3.5e RAW) ]` (`#tab-stat-dist-pointbuy` / `#panel-stat-dist-pointbuy`)
       4. `[ ⚡ 4d6 Drop Lowest (Zar) ]` (`#tab-stat-dist-roll` / `#panel-stat-dist-roll`)
  2. **Kimlik & Irk Paneli Entegrasyonu:**
     - Eski `#char-profile-modal` içindeki tüm etkileşimli alanlar (Mouse ile sürüklenebilir portre ve odak seçici, dosya yükleme/URL, hızlı portre odakları, sığdırma oranları, isim, ırk ve dinamik SRD ırk nitelikleri kartı, yönelim, tanrı, boyut, cinsiyet, yaş, boy, kilo, hız ve sayfa arka plan duvar kağıdı stüdyosu) eksiksiz olarak `#panel-stat-dist-identity` içine taşındı.
     - Eski modal ID'si geriye dönük sorgular için zararsız gizli bir DOM stub'ı olarak korundu (`<div id="char-profile-modal" class="hidden" style="display:none;"></div>`).
  3. **Açılış & Kayıt Davranışı:**
     - `openProfileEditModal()` ve üst sol portre tıklaması doğrudan birleşik modalı `identity` sekmesiyle açar.
     - `openStatDistributionModal()` butonu birleşik modalı `manual` (veya son aktif stat) sekmesiyle açar.
     - Modal altındaki "💾 Kaydet & Uygula" butonu (`saveStatDistribution()`), hem kimlik/ırk alanlarını hem de taban stat skorlarını tek seferde atomik olarak doğrular, kaydeder, `saveStateToStorage(true)` ve `renderAll()` tetikler.
  4. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html` ve `webapp/index.html` olmak üzere 4 dosya %100 SHA-256 paritesinde eşitlendi (`A752D15C...`).
     - Sıfır U+1F3B2 tavla zarı emojisi kuralı tavizsiz korundu.


---

## 48. BÜTÜNLEŞİK MODALIN 3 ANA SEKME VE ALT SEKMELERE AYRILMASI (2026-10-25)
* **İstek:** "Karakter Profili & Temel Statlar" modalının sekmelerinin 3 ana sekmeye dönüştürülmesi:
  1. `[ 👤 Kimlik & Irk ]`
  2. `[ 📊 Yetenek Skorları ]` (altında `Manuel (Serbest)`, `Point Buy (3.5e RAW)`, `4d6 Drop Lowest (Zar)` sekmeleri)
  3. `[ 🎨 Profil Resmi ]` (sadece portre ve arka plan duvar kağıdı düzenleme stüdyosu)
  - Kimlik & Irk sekmesinden resim düzenleme alanlarının kaldırılarak saf kimlik bilgilerine odaklanması.
* **Uygulanan Değişiklikler:**
  1. **Ana Sekme Düzeni (`#stat-distribution-modal`):**
     - Üst sekme çubuğu 3 ana butona dönüştürüldü: `#tab-stat-dist-identity`, `#tab-stat-dist-abilities`, `#tab-stat-dist-portrait`.
  2. **Yetenek Skorları Alt Sekmeleri (`#panel-stat-dist-abilities`):**
     - Panel içine zarif bir alt sekme grubu eklendi: `#subtab-ability-manual`, `#subtab-ability-pointbuy`, `#subtab-ability-roll`.
     - Manuel serbest giriş, D&D 3.5e RAW 28 Puan Point Buy ve 4d6 Drop Lowest zar havuzu ile canlı skor önizleme kartı bu alt panele taşındı.
  3. **Profil Resmi ve Duvar Kağıdı İzolasyonu (`#panel-stat-dist-portrait`):**
     - `#profile-portrait-panel` ve `#profile-wallpaper-panel` sadece bu sekmede konumlandırıldı.
     - Kimlik & Irk sekmesi tamamen temizlenerek sadece Ad, Irk, Irksal Nitelik Kartı, Yönelim, Tanrı, Boyut, Cinsiyet, Yaş, Boy, Kilo ve Taban Hız alanlarına tahsis edildi.
  4. **JavaScript Durum Yönetimi & Geriye Dönük Uyumluluk:**
     - `setStatDistMode(tabOrMode)` hem ana sekmeleri (`'identity'`, `'abilities'`, `'portrait'`) hem de doğrudan stat alt modlarını (`'manual'`, `'pointbuy'`, `'roll'`) akıllıca yönlendirecek şekilde güncellendi.
     - `setStatDistAbilityMode(subMode)` alt sekme geçişlerini ve DOM görünürlüğünü yönetir.
     - `scrollToPortraitPanel()` ve `scrollToWallpaperPanel()` fonksiyonları doğrudan `'portrait'` sekmesini etkinleştirir.
  5. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html` ve `webapp/index.html` dosyaları %100 SHA-256 eşitliğinde güncellendi (`2A557FFB...`).
     - Sıfır U+1F3B2 tavla zarı emojisi kuralı tavizsiz korundu.


---

## 47. HUB KARAKTER KARTLARINDA HIZLI EYLEMLER, CAN KONTROLLERİ, AC / SAVES VE BECERİLER ÇEKMECESİ YENİLENDİ (2026-10-25)
* **İstek:** 
  1. Hızlı Eylem Menüsü'nün (Düzenle, Klonla, Sil) 2 sütunlu düzene getirilmesi; Düzenle butonunun en üstte 2 sütunu birden kaplaması, altında Kopyala ve Sil butonlarının yan yana yer alması.
  2. Sayfa daraldığında (özellikle mobil ekranlarda) Özel Hasar/Şifa Giriş kutusunun (`applyCustomHp`) bir alt satıra inmesi (`order-last sm:order-none w-full sm:w-auto`).
  3. "Ana Saldırı" kutusunun kaldırılarak Zırh (AC) yanına 4 satır 1 sütun halinde Fortitude, Reflex, Will ve Initiative (İnisiyatif) zar atılabilir butonlarının yerleştirilmesi.
  4. Spot ve Listen butonlarının sabit kalarak yanına `rank > 0` olan tüm eğitilmiş becerilerin açılır çekmece içine yerleştirilmesi; çekmecenin varsayılan olarak kapalı olması, açıldığında hücrenin aşağı kaydırılabilmesi (`overflow-y-auto custom-scroll`) ve bu sırada hücrenin varsayılan boyutunun (`min-h-[390px] xl:min-h-[410px] xl:max-h-[430px]`) korunması.
* **Uygulanan Değişiklikler:**
  1. **Hızlı Eylem Menüsü:**
     - `grid grid-cols-2 gap-1 w-16` yapısına dönüştürüldü.
     - `✏️ Düzenle` butonu `col-span-2` olarak üst satırı kapladı, altında `📋 Kopyala` ve `🗑️ Sil` butonları eşit simetriyle yerleşti.
  2. **Duyarlı (Responsive) Can / Hasar Kontrolü:**
     - Kapsayıcı `flex flex-wrap items-center justify-between` yapıldı.
     - Özel miktar girişi `order-last sm:order-none w-full sm:w-auto flex justify-center` sınıflarıyla donatıldı; dar/mobil ekranda `-5, -1` ve `+1, +5` butonları üst satırda kalırken giriş kutusu otomatik alt satıra indi, masaüstünde tek satırda kaldı.
  3. **Zırh (AC) ve 4 Satır 1 Sütun Kurtarma / İnisiyatif Bloğu:**
     - Eski Ana Saldırı alanı kaldırıldı.
     - `grid grid-cols-2 gap-2` düzeninde sol kolonda Zırh (AC, Touch, FF, Taban Hız), sağ kolonda 4 satır 1 sütun halinde `🛡️ Fort`, `⚡ Ref`, `🔮 Will` ve `⚡ Init` butonları tam hizalı konumlandırıldı.
  4. **Spot, Listen & Eğitilmiş Beceriler (`rank > 0`) Çekmecesi:**
     - `👁️ Spot` ve `👂 Listen` sabit butonlar olarak korundu.
     - Karakterin `c.fullData.skills` listesinden `rank > 0` olan tüm beceriler filtrelenip alfabetik sıralandı; yanlarına açılır çekmece butonu (`📜 N ▼`) ve `toggleHubCardSkillsDrawer` fonksiyonu eklendi.
     - Çekmece açıldığında hücre içinde pürüzsüz kaydırma (`overflow-y-auto custom-scroll`) sağlandı; varsayılan kart yüksekliği (`min-h-[390px] xl:min-h-[410px] xl:max-h-[430px]`) bozulmadan korundu.
  5. **Parite ve Devir Teslim:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 paritesinde eşitlendi.
     - Standart 6 yüzlü tavla zarı emoji yasağı tavizsiz korundu.


---

## 49. PROFİL DÜZENLE VE MODAL BAŞLIĞININ "KARAKTER KÜNYESİ" OLARAK GÜNCELLENMESİ (2026-10-25)
* **İstek:**
  1. Karakter ana başlık alanında (core profile header) bulunan `<span>Profili Düzenle</span>` (`openProfileEditModal()`) butonunun `<span>Karakter Künyesi</span>` olarak yeniden adlandırılması.
  2. Bütünleşik `#stat-distribution-modal` başlığındaki `<span>Karakter Profili &amp; Temel Statlar</span>` metninin `<span>Karakter Künyesi</span>` olarak güncellenmesi.
* **Uygulanan Değişiklikler:**
  1. **Ana Başlık Butonları ve Yönlendirme:**
     - `character.html` ve kopyalarında profil butonunun ikonu `📜`, metni `Karakter Künyesi`, başlık ipucu `Karakter künyesini, kimliğini, ırkını ve profilini düzenle` yapıldı.
     - `[ Statları Düzenle ]` butonu `onclick="openStatDistributionModal('abilities')"` ile doğrudan Yetenek Skorları sekmesini açacak şekilde netleştirildi.
     - `[ Karakter Künyesi ]` butonu `openProfileEditModal()` üzerinden doğrudan Kimlik & Irk sekmesini açar.
     - Üst kahraman kartı portresi üzerine fare ile gelindiğinde görünen etiket `📜 Karakter Künyesi` olarak eşitlendi.
  2. **Modal Başlığı:**
     - `#stat-distribution-modal` üst başlığı `Karakter Künyesi` (D&D 3.5e RAW) olarak sadeleştirildi.
  3. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html` ve `webapp/index.html` dosyaları %100 SHA-256 eşitliğinde güncellendi.
     - Standart 6 yüzlü tavla zarı emoji yasağı tavizsiz korundu.


---

## 50. HUB KARAKTER KARTLARINDAN 6'LI YETENEK SKORLARI GRID'İNİN KALDIRILMASI VE YATAY KAYDIRMA BARININ ÖNLENMESİ (2026-10-25)
* **İstek:**
  1. Karakter kartlarındaki 6'lı temel yetenek skorları zar atma barının (`STR, DEX, CON, INT, WIS, CHA` grid) tamamen kaldırılması.
  2. Hücrede/kartta hiçbir şekilde yana kayma barı (`horizontal scrollbar`) oluşmaması; boyutların ve taşma kurallarının buna göre optimize edilmesi.
* **Uygulanan Değişiklikler:**
  1. **6'lı Yetenek Skorları Grid'inin Kaldırılması (`hub.html` & `webapp/hub.html`):**
     - Kartın alt kısmındaki `<div class="grid grid-cols-6 gap-1.5 text-center font-mono">...</div>` bloğu ve ilişkili `statsList` haritalaması tamamen kaldırıldı.
  2. **Yatay Kaydırma Barının Kesin Olarak Önlenmesi (`overflow-x-hidden`):**
     - Karakter kartı ana taşıyıcısına `overflow-x-hidden overflow-y-auto custom-scroll` uygulandı.
     - İç padding `p-3 sm:p-3.5` seviyesine çekilerek dar/mobil kolonlarda içerik için fazladan yatay alan kazanıldı.
     - HP miktar kontrol çubuğu ve butonları kompakt ölçülere (`w-11 sm:w-13 h-6`) getirilerek yatay taşma riski ortadan kaldırıldı.
     - AC / Saves ve Beceriler satırlarına `min-w-0` ve `truncate` kuralları eklenerek metinlerin taşması önlendi.
     - Eğitilmiş beceriler çekmecesi konteynerine `overflow-x-hidden` eklendi.
     - Kart ve boş kart yükseklikleri `min-h-[380px] xl:min-h-[400px] xl:max-h-[420px]` olarak dengelendi.
  3. **Parite ve Devir Teslim:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 paritesinde eşitlendi (`True`).
     - Sıfır U+1F3B2 tavla zarı kuralı korundu.


---

## 50. STATLARI DÜZENLE BUTONUNUN KALDIRILMASI VE KARAKTER KÜNYESİ BUTONUNA D20 SVG İKONU EKLENMESİ (2026-10-25)
* **İstek:**
  1. Karakter ana başlık alanındaki ayrı `[ Statları Düzenle ]` (`#btn-open-stat-dist`) butonunun silinmesi.
  2. Tek kalan `[ Karakter Künyesi ]` butonunun başına `📜` parşömen ikonunun hemen önüne çokyüzlü vektörel `d20` zar SVG ikonunun yerleştirilmesi.
* **Uygulanan Değişiklikler:**
  1. **Ana Başlık Buton Sadeleştirmesi:**
     - Eski `#btn-open-stat-dist` butonu ve JS içindeki kullanılmayan `statDistBtn` kontrol bloğu temizlendi.
     - `[ Karakter Künyesi ]` butonu içine altın sarısı (`text-amber-400`) vektörel d20 SVG ikonu `<span>📜</span>` ifadesinin hemen önüne entegre edildi:
       `<button onclick="openProfileEditModal()" ...><span class="inline-flex items-center"><svg ...>...</svg></span><span>📜</span><span>Karakter Künyesi</span></button>`
  2. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html` ve `webapp/index.html` dosyaları %100 SHA-256 eşitliğinde güncellendi (`03BBDD6D...`).
     - Standart tavla zarı emoji yasağı tavizsiz korundu.


---

## 51. HUB KARAKTER KARTLARINDA SABİT HP BUTONLARININ (-5,-1,+1,+5) KALDIRILMASI VE VARSAYILAN 5 HP DEĞERİ (2026-10-25)
* **İstek:**
  1. Can (HP) kontrol alanındaki `-5, -1, +1, +5` butonlarının tamamen kaldırılması.
  2. Kalan tekil miktar kontrol kutusunda varsayılan hasar/şifa değerinin `5` olarak gelmesi.
* **Uygulanan Değişiklikler:**
  1. **HP Kontrol Alanının Sadeleştirilmesi (`hub.html` & `webapp/hub.html`):**
     - `-5, -1` ve `+1, +5` butonları kaldırıldı.
     - Tekil özel HP kontrol alanı `[ ⚔️ - ] [ 5 ] [ + 💚 ]` olarak ortalandı (`flex items-center justify-center`).
     - Giriş kutusu `value="5"` ve `placeholder="5"` ile yüklenecek şekilde ayarlandı.
  2. **Fonksiyonel Varsayılan Güncellemesi (`applyCustomHp`):**
     - Kullanıcı kutuyu boşaltsa veya geçersiz bir değer girse dahi `applyCustomHp` fonksiyonundaki geri çekilme (fallback) değeri `1` yerine varsayılan `5` olarak ayarlandı.
  3. **Parite ve Devir Teslim:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 eşitliğinde tutuldu.
     - Sıfır U+1F3B2 tavla zarı kuralı korundu.


---

## 52. HUB KARTLARINDA BÜYÜTÜLMÜŞ PORTRE, 2 SATIRLI BİLGİ DÜZENİ VE TAM SİMETRİK GENİŞ CAN KONTROLÜ (2026-10-25)
* **İstek:**
  1. Portre resminin 2 satır ve 2 sütun yüksekliğinde büyütülmesi.
  2. Karakter bilgi alanının mobilde karakter ismi öncelikli ve belirgin olacak şekilde 2 satıra sığdırılması; diğer detayların (Irk, Sınıf, Kampanya) kısaltılarak tek satırda hizalanması.
  3. Tekil Hasar/Şifa miktar kontrol alanının hücre sınırlarına kadar tam genişletilmesi ve simetrisinin korunması.
* **Uygulanan Değişiklikler:**
  1. **Büyütülmüş Portre (`w-14 h-14 sm:w-16 sm:h-16`):**
     - Portre alanı 2 satır ve 2 buton satırı yüksekliğine tam uyumlu olarak büyütüldü (`text-3xl`).
     - Köşe kıvrımları ve PC/NPC rozeti büyütülmüş portreye göre optimize edildi.
  2. **2 Satırlı Karakter Bilgi Bloğu:**
     - **Satır 1:** Karakter Adı (`text-sm sm:text-base font-black truncate`) ve varsa CR rozeti. Mobilde ismin bastırılması veya sıkışması tamamen engellendi.
     - **Satır 2:** `Irk • Sınıf • Kampanya` bilgileri tek bir yatay satırda birleştirildi; `truncate` ve `max-w` ile taşma yapmadan zarifçe gösterildi.
  3. **Tam Simetrik ve Hücreyi Kaplayan HP Kontrolü (`w-full`):**
     - Hasar (`flex-1 h-8 bg-rose-950/90 text-rose-300`) ve Şifa (`flex-1 h-8 bg-emerald-950/90 text-emerald-300`) butonları kutunun iki yanına tam simetrik olarak yayıldı.
     - Merkezdeki sayı kutusu (`w-14 sm:w-16 h-8 text-center font-mono font-black`) ile aralarında mükemmel bir denge sağlandı.
  4. **Parite ve Devir Teslim:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 eşitliğinde tutuldu (`True`).
     - Sıfır U+1F3B2 tavla zarı kuralı korundu.


---

## 53. HUB KARAKTER KARTLARINDA CAN (HP) ALANI GENİŞLİĞİNİN 0.66 ORANINDA MERKEZİ HİZALANMASI VE ORANTILI YÜKSEKLİK (2026-10-25)
* **İstek:**
  - Can (HP) bloğunun (`bg-slate-900/90`) genişliğinin 0.66 ile çarpılması (yaklaşık 2/3 genişlik) ve bu yeni kompakt genişliğe göre dikey/iç eleman boyutlarının optimize edilmesi.
* **Uygulanan Değişiklikler:**
  1. **0.66 Genişlik ve Ortalanmış Yerleşim (`hub.html` & `webapp/hub.html`):**
     - Can (HP) kapsayıcısına `w-[66%] mx-auto` uygulandı.
     - İç padding ve dikey aralıklar `p-1.5 sm:p-2 space-y-1` olarak optimize edildi.
  2. **Orantılı İç Yükseklik ve Buton Ölçeklemesi:**
     - HP progress bar yüksekliği `h-2` yapıldı.
     - Simetrik miktar kontrol alanı butonları `h-7`, sayı giriş kutusu `w-11 sm:w-12 h-7` seviyesinde orantılı olarak yeniden boyutlandırıldı.
     - Başlık fontları `text-xs font-mono` ve sayılar `text-sm sm:text-base` ile dengelendi.
  3. **Parite ve Devir Teslim:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 eşitliğinde güncellendi (`True`).
     - Sıfır U+1F3B2 tavla zarı kuralı korundu.


---

## 51. IRK SEÇİMİ GENİŞLETMESİ, "DİĞER" SEÇENEĞİ VE RULE MASTER AI İLE ÖZEL IRK ARAMA ENTEGRASYONU (2026-10-25)
* **İstek:**
  1. Karakter kimlik düzenleme alanındaki Irk (Race) seçiminde diğer resmi D&D 3.5e ırklarının da gelmesi.
  2. "Diğer" seçeneğinin yer alması.
  3. Kullanıcı "Diğer"i seçtiğinde veya listede olmayan bir ırk yazdığında, Rule Master AI ile istediği resmi ırkı arayıp otomatik olarak karakterine ekleyebilmesi.
* **Uygulanan Değişiklikler:**
  1. **D&D 3.5e RAW SRD/Core Katalog Genişletmesi (`bundled_data.js` & `webapp/`):**
     - Standart 7 ırka ek olarak resmi D&D 3.5e RAW kural kitaplarından 7 yeni ırk eksiksiz şemasıyla (`size`, `baseSpeed`, stat modifiyerleri, `traits`, `source`, `languages`, `favoredClass`) eklendi:
       - **Aasimar** (+2 Wis, +2 Cha, Darkvision 60 ft, Daylight 1/day, Acid/Cold/Elec resistance 5, +2 Listen/Spot)
       - **Tiefling** (+2 Dex, +2 Int, -2 Cha, Darkvision 60 ft, Darkness 1/day, Cold/Fire/Elec resistance 5, +2 Bluff/Hide)
       - **Dragonborn** (+2 Con, -2 Dex, Draconic Aspect Heart/Mind/Wings, Dodge vs Dragons)
       - **Drow** (+2 Dex, -2 Con, +2 Int, +2 Cha, Darkvision 120 ft, Spell Resistance 11+lvl, Light Blindness, Spell-Like Abilities)
       - **Orc** (+4 Str, -2 Int, -2 Wis, -2 Cha, Darkvision 60 ft, Light Sensitivity)
       - **Goblin** (+2 Dex, -2 Str, -2 Cha, Small, 30 ft Hız, Darkvision 60 ft, +4 Move Silently & Ride)
       - **Kobold** (+2 Dex, -4 Str, -2 Con, Small, +1 Natural Armor, Darkvision 60 ft, Light Sensitivity)
  2. **Datalist (`#race-options`) & "Diğer" Seçeneği:**
     - Datalist güncellenerek yukarıdaki tüm ırklar, Goliath, Warforged ve sonuna `Diğer (Rule Master AI ile Ara...)` eklendi.
  3. **Rule Master AI ile Dinamik Irk Arama & Entegrasyon:**
     - `rule_master.js`: `fetchSingleAiRuleObjects` promptu ve `normalizeEntry` metodu D&D 3.5e RAW `Race` şemasıyla senkronize edildi (Kural #8 uyumu). `RuleMaster.fetchRaceViaAi(raceName)` metodu eklendi.
     - `character.html`:
       - Kullanıcı "Diğer" seçtiğinde kart alanında interaktif bir AI Irk Arama kutusu (`#race-ai-search-input` ve `Irkı Getir` butonu) açılır.
       - Kullanıcı listede olmayan herhangi bir ırk yazdığında kartta tek tıkla `[ 🔮 "${raceName}" Irkını Rule Master AI ile Getir ]` butonu sunulur.
       - Getirilen ırk yerel belleğe ve `localStorage.dnd35_custom_races` deposuna kaydedilir; `onProfileRaceChange` üzerinden tüm ırksal nitelikleriyle önizlenir ve `[ 🧬 Irk Niteliklerini Uygula ]` butonuyla karaktere doğrudan yansıtılır.
  4. **Parite ve Kural Bütünlüğü:**
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` (%100 SHA-256: `1EE727AF...`).
     - `bundled_data.js`, `webapp/bundled_data.js` (%100 SHA-256: `5D404B9E...`).
     - `rule_master.js`, `webapp/rule_master.js` (%100 SHA-256: `AC14C883...`).
     - Sıfır dummy data ve sıfır standart tavla zarı emoji kuralı tavizsiz korundu.


---

## 54. HUB KARTLARINDA CAN (HP) ALANININ GERİ ALINMASI (2026-10-25)
* **İstek:** 0.66 genişlik denemesinin geri alınması ("değişikliği geri al").
* **Uygulanan Değişiklikler:**
  - Can (HP) bloğu önceki tam genişlikli (`w-full`) ve simetrik yapısına geri getirildi.
  - `hub.html` ve `webapp/hub.html` dosyaları %100 SHA-256 eşitliğinde güncellendi.
  - Sıfır U+1F3B2 tavla zarı kuralı korundu.


---

## 55. HUB KARAKTER KARTLARINDA ZIRH & CAN YAN YANA VE 2x2 KURTARMA YERLEŞİMİ (2026-10-25)
* **İstek:**
  - Kullanıcının sunduğu görsel mockup yerleşimine geçilmesi:
    1. ZIRH (AC) [Sol Blok: ~38%] ile CAN (HP) [Sağ Blok: ~62%] yan yana (`flex items-stretch gap-2`) konumlandırılması.
    2. Altında 2 kolon x 2 satır Kurtarma & İnisiyatif bloğu: Sol kolonda `Fort` ve `Ref`, sağ kolonda `Will` ve `Init`.
    3. Altında 2 kolonluk Pasif / Beceri bloğu: Sol kolonda `Spot`, sağ kolonda `Listen` ve yanına eğitilmiş beceriler çekmecesi butonu (`📜 N ▼`).
    4. En altta tam genişlikte `⚡ Karakteri Aç & Yönet` butonu.
* **Uygulanan Değişiklikler:**
  1. **ZIRH & CAN Yan Yana Düzeni (`hub.html` & `webapp/hub.html`):**
     - ZIRH (AC, Touch, FF, Hız) sol kolona (`w-[36%] sm:w-[38%] shrink-0`) alındı.
     - CAN (HP) başlığı, ilerleme barı ve `[ ⚔️ - ] [ 5 ] [ + 💚 ]` miktar kontrolü sağ kolona (`flex-1 min-w-0`) alındı.
     - `flex items-stretch` ile her iki kutu kusursuz bir yükseklik eşitliği ve simetriye kavuştu.
  2. **2x2 Kurtarma & İnisiyatif Grid Düzeni:**
     - `grid grid-cols-2 gap-2` yapısında:
       - Sol sütun: `🛡️ Fort` ve `⚡ Ref`
       - Sağ sütun: `🔮 Will` ve `⚡ Init`
  3. **Spot, Listen & Beceriler Çekmecesi:**
     - Sol sütunda `👁️ Spot`, sağ sütunda `👂 Listen` ve akordeon çekmece butonu (`📜 N ▼`) yerleştirildi.
  4. **Parite ve Devir Teslim:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 eşitliğinde güncellendi (`True`).
     - Standart tavla zarı emoji yasağı tavizsiz korundu.


---

## 56. HUB KARTLARINDA SPOT & LISTEN ALTINDA KALICI EĞİTİLMİŞ BECERİLER (RANK > 0) ÇEKMECESİ VE SAĞLAM VERİ AYIKLAMA (2026-10-25)
* **İstek:**
  - Spot ve Listen butonlarının altındaki alanın kalıcı ve genişletilebilir bir çekmece (`accordion drawer`) olması.
  - Karakterin rütbe yatırdığı (`rank > 0` / `ranks > 0`) tüm becerilerin bu çekmecede 2 sütunlu interaktif zar butonlarıyla listelenmesi.
* **Uygulanan Değişiklikler:**
  1. **Sağlam Beceri Verisi Ayıklama (`extractSkills`):**
     - Becerilerin `character_data.json` veya `c.fullData` içinde dizi (`Array`) ya da anahtar-değer sözlüğü (`Object`) olarak saklanma durumlarının her ikisi de `extractSkills` yardımcısı ile normalize edildi.
     - `ranks > 0` veya `rank > 0` olan beceriler filtrelenip alfabetik olarak sıralandı.
  2. **Kalıcı Çekmece Başlığı / Butonu:**
     - Spot ve Listen'ın hemen altına tam genişlikte `[ 📜 Eğitilmiş Beceriler (Rank > 0)     N Beceri ▼ ]` akordeon barı eklendi.
     - Buton her zaman görünürdür; tıklandığında ok simgesi 180 derece döner ve çekmece pürüzsüzce açılır.
     - Eğitilmiş becerisi olmayan karakterlerde kullanıcı dostu `Karakterin eğitilmiş becerisi bulunmuyor (Rank > 0)` bilgilendirme kutusu gösterilir.
  3. **Parite ve Devir Teslim:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 eşitliğinde güncellendi (`True`).
     - Standart tavla zarı emoji yasağı tavizsiz korundu.

---

## 57. HUB NOT DEFTERİ (HUB NOTES) MODAL HEDEF ÇÖZÜMLEME VE YENİ NOT OLUŞTURMA HATASI DÜZELTMESİ (2026-10-25)
* **Problem:**
  - Hub sayfasında geniş not defteri modali açılıp "Yeni Not Oluştur" butonuna tıklandığında `Lütfen önce bir kampanya veya karakter seçin.` uyarısı veriyor ve sol listede `Aktif hedef bulunamadı.` yazıyordu.
* **Kök Neden:**
  - `hub_notes.js` dosyasının `getHubState()` fonksiyonu `window.state` nesnesini sorguluyordu. Ancak `hub.html` içinde state `let state = { ... }` olarak tanımlandığı için JavaScript lexical scope kuralları gereği `window` nesnesine bağlanmıyordu (`window.state === undefined`).
  - Ayrıca `state.activeCampaignId` değeri `'unassigned'` (Bağımsızlar) olduğunda veya karakter listesiyle eşleşmediğinde hedef `null` dönüyordu.
* **Uygulanan Çözüm:**
  1. **Global State Erişimi ve Senkronizasyonu (`hub.html`):**
     - `hub.html` içinde `let state = ...` tanımlandıktan hemen sonra `window.state = state;` ve `window.getHubState = () => state;` eklendi.
     - `saveHubStorage` ve JSON yükleme fonksiyonlarında `window.state = state;` güncelliği sağlandı.
  2. **Dört Katmanlı Güvenli Hedef Tespiti (`hub_notes.js`):**
     - `getHubState()` fonksiyonu `window.getHubState()`, `window.state`, `typeof state !== 'undefined'` ve `localStorage.getItem('dnd35_hub_db')` sırasıyla yedekli çalışacak biçimde güçlendirildi.
     - `getActiveNotesTarget()`; `'unassigned'` (bağımsız karakterler), DM kampanyası, oyuncu kampanyası, `'all'` (tüm karakterler) ve sıfır kampanya durumlarında dahi otomatik güvenli bir not hedefi bağlayacak şekilde revize edildi.
  3. **Modal İçi Hızlı Hedef Değiştirme Açılır Menüsü (`updateModalTargetSelector`):**
     - Not defteri modal başlığına tüm karakter ve kampanya defterleri arasında geçiş yapmayı sağlayan akıllı bir `<select>` açılır kutusu entegre edildi (`char:<id>` / `campaign:<id>`).
  4. **Parite ve Devir Teslim:**
     - `hub.html`, `hub_notes.js` ile `webapp/hub.html`, `webapp/hub_notes.js` %100 SHA-256 eşitliğinde senkronize edildi.
     - Kural #3 (Zar emojisi yasağı) tavizsiz korundu.

---

## 58. HUB KAMPANYA BİLGİ VE AKSİYON BANDININ 2 SATIRLI DÜZENE DÖNÜŞTÜRÜLMESİ (2026-10-25)
* **İstek:**
  - Kampanya seçildiğinde üstte beliren Ana Kampanya Bilgi Başlık Bandının 2 satır olacak şekilde düzenlenmesi.
* **Uygulanan Değişiklikler:**
  1. **1. Satır (Başlık, Rozetler & Aksiyon Butonları):**
     - Sol tarafta kampanya ikonu (`👑` / `🏰`), kampanya adı, DM Mode rozeti ve alt sefer / karakter sayısı rozeti yerleştirildi.
     - Sağ tarafta `[Buluta Taşı & Davet Kodu Al]` (veya Davet Kodu), `[Alt Kampanya Ekle]` ve `[Düzenle]` aksiyon butonları dikeyde başlıkla tam hizada olacak şekilde konumlandırıldı (`flex justify-between items-center`).
  2. **2. Satır (Sefer Notu / Açıklaması):**
     - Eğer kampanyanın notu/açıklaması varsa (`activeCamp.notes`), 1. satırın altına tam genişlikte (`w-full`) ferah bir açıklama kutusu olarak yerleştirildi.
  3. **Parite ve Devir Teslim:**
     - `hub.html` ve `webapp/hub.html` %100 SHA-256 eşitliğinde güncellendi.
     - Kural #3 (Zar emojisi yasağı) tavizsiz korundu.

---

## 59. HUB NOT DEFTERİ LİSTESİNDE KAMPANYA ADI VE ALT KAMPANYA HİYERARŞİSİNİN GÖSTERİLMESİ (2026-10-25)
* **İstek:**
  - Geniş Not Defteri modalının sol not listesinde yer alan kartların başlığında kampanya açıklaması (`note.text` / "Aktif macera seferi.") yerine doğrudan **kampanya adı** gösterilmesi.
  - Eğer seçili kampanya bir alt kampanya (`parentId` tanımlı) ise bağlı olduğu ana kampanyanın da hiyerarşik olarak (`Ana Kampanya › Alt Kampanya`) yer alması.
* **Uygulanan Değişiklikler:**
  1. **Hiyerarşik Kampanya Adı Çözümleyicileri (`getCampaignHierarchyName` & `getTargetDisplayName`):**
     - Bir kampanya alt kampanya ise ebeveyni bulunarak `${parentCamp.name} › ${camp.name}` formatında hiyerarşik adı üretildi.
     - Karakterler için bağlı oldukları sefer hiyerarşisi de eklenerek adlandırıldı.
  2. **Not Listesi Kart Başlığı:**
     - `renderFullNotesModalList` içinde her not kartının kalın başlığına kampanya hiyerarşik adı (`Ana Kampanya › Alt Kampanya`) bağlandı; alt satırdaki açıklama kutusunda ise notun kendi metni gösterildi.
  3. **Açılır Menü (`<select>`) ve Editör Bilgi Çubuğu:**
     - Modal başlığındaki defter seçici menüde alt kampanyalar ana seferleriyle birlikte listelendi.
     - Editörün sağ üstündeki bilgi rozetine (`dateBadge`) hedef hiyerarşisi eklendi.
  4. **Parite ve Devir Teslim:**
     - `hub_notes.js` ve `webapp/hub_notes.js` %100 SHA-256 eşitliğinde güncellendi.
     - Kural #3 (Zar emojisi yasağı) tavizsiz korundu.

---

## 62. HUB NOT DEFTERİ EDİTÖRÜNE AÇIK KAYDET BUTONU, CTRL+S/CTRL+ENTER KISAYOLLARI VE OTOMATİK VERİ TAAHHÜDÜ (2026-10-25)
* **Problem:**
  - Geniş Not Defteri modalında yeni bir not oluşturulduğunda veya mevcut bir not güncellenmek istendiğinde açık bir `[ 💾 Notu Kaydet ]` butonu bulunmuyordu.
  - Kullanıcı not yazıp çıktığında veya başka bir nota geçtiğinde değişikliklerin kaydedilip kaydedilmediği anlaşılamıyor ya da sekme geçişlerinde veri kaybı hissi oluşuyordu.
* **Uygulanan Çözüm:**
  1. **Açık `[ 💾 Notu Kaydet ]` Butonu ve Görsel Bildirim:**
     - Not editörünün sağ üst araç çubuğuna `[ 💾 Notu Kaydet ]` butonu eklendi.
     - Tıklandığında not veritabanına (`saveHubStorage` & `targetObj`) işlenir ve buton 1.5 saniyeliğine yeşil renkli `Kaydedildi! ✓` durumuna geçer.
     - Bilgi rozetinde son güncelleme anlık saat olarak tazelenir.
  2. **Klavye Kısayolları (Ctrl+S & Ctrl+Enter):**
     - Textarea içerisindeyken `Ctrl+S` veya `Ctrl+Enter` tuşlarına basıldığında not derhal kaydedilir ve onay bildirimi gösterilir.
  3. **Otomatik Kayıt ve Koruma Ağı:**
     - `onblur`: Editörden dışarı tıklandığında otomatik kayıt tetiklenir.
     - `selectNoteInModal`: Sol listeden başka bir nota geçilmeden önce mevcut açık nottaki tüm değişiklikler otomatik olarak kaydedilir.
     - `closeFullNotesModal`: Modal çarpıdan kapatılırken mevcut düzenleme kaydedilir.
     - `createNewModalNote`: Yeni nota geçmeden önce mevcut not otomatik kaydedilir.
     - Yazma esnasında 1000ms gecikmeli debounced arka plan otomatik kaydı devreye alınarak DOM kasılmaları engellendi.
  4. **Parite ve Devir Teslim:**
     - `hub.html`, `hub_notes.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde güncellendi.
     - Kural #3 (Zar emojisi yasağı) tavizsiz korundu.

---

## 61. HUB YENİ NOT OLUŞTURMA ŞABLONUNA OTOMATİK KARAKTER ADI, LVL VE TARİH ETİKETLERİ ENTEGRASYONU (2026-10-25)
* **İstek:**
  - "Yeni Not Oluştur" butonuna tıklandığında oluşturulan notun boş gelmek yerine standart olarak karakter adı (`#Karakter_Adi`), karakter seviyesi (`#lvlN`) ve o günün tarihi (`#GN_Ay_Yıl`) etiketleriyle (`#`) hazır gelmesi.
* **Uygulanan Değişiklikler:**
  1. **Dinamik Karakter ve Seviye Tespiti (`resolveCharacterForNote` & `toValidHashtag`):**
     - Not hedefi bir karakter ise doğrudan kendi adı ve seviyesi, kampanya ise o kampanyaya atanmış aktif karakter (veya Hub'daki mevcut karakter) çözümlendi.
     - Karakter adı boşluksuz, geçerli Türkçe karakter destekli standart etiket formatına dönüştürüldü (Örn: `Regdar Ironfist` -> `#Regdar_Ironfist`, `test1` -> `#test1`).
  2. **Standart Seviye ve Türkçe Tarih Etiketleri:**
     - Seviye: `#lvl1`, `#lvl5` vb. formatta üretildi.
     - Tarih: `#25_Ekim_2026` gibi Türkçe ay adını içeren okunabilir ve aranabilir formatta oluşturuldu.
  3. **Varsayılan Not Metni ve Odaklanma:**
     - Yeni notun gövdesi `${charTag} ${lvlTag} ${dateTag}\n\n` şablonuyla dolduruldu.
     - Editör açıldığında imleç otomatik olarak etiketlerin alt satırına konumlandırıldı.
     - `formatNoteTextHtml` fonksiyonunda `#lvl...` etiketleri indigo, tarih etiketleri teal (turkuaz) özel RPG rozeti olarak renklendirildi.
  4. **Parite ve Devir Teslim:**
     - `hub_notes.js` ve `webapp/hub_notes.js` %100 SHA-256 eşitliğinde güncellendi.
     - Kural #3 (Zar emojisi yasağı) tavizsiz korundu.

---

## 62. HUB NOT DEFTERİ EDİTÖRÜNE AÇIK KAYDET BUTONU, CTRL+S/CTRL+ENTER KISAYOLLARI VE OTOMATİK VERİ TAAHHÜDÜ (2026-10-25)
* **Problem:**
  - Geniş Not Defteri modalında yeni bir not oluşturulduğunda veya mevcut bir not güncellenmek istendiğinde açık bir `[ 💾 Notu Kaydet ]` butonu bulunmuyordu.
  - Kullanıcı not yazıp çıktığında veya başka bir nota geçtiğinde değişikliklerin kaydedilip kaydedilmediği anlaşılamıyor ya da sekme geçişlerinde veri kaybı hissi oluşuyordu.
* **Uygulanan Çözüm:**
  1. **Açık `[ 💾 Notu Kaydet ]` Butonu ve Görsel Bildirim:**
     - Not editörünün sağ üst araç çubuğuna `[ 💾 Notu Kaydet ]` butonu eklendi.
     - Tıklandığında not veritabanına (`saveHubStorage` & `targetObj`) işlenir ve buton 1.5 saniyeliğine yeşil renkli `Kaydedildi! ✓` durumuna geçer.
     - Bilgi rozetinde son güncelleme anlık saat olarak tazelenir.
  2. **Klavye Kısayolları (Ctrl+S & Ctrl+Enter):**
     - Textarea içerisindeyken `Ctrl+S` veya `Ctrl+Enter` tuşlarına basıldığında not derhal kaydedilir ve onay bildirimi gösterilir.
  3. **Otomatik Kayıt ve Koruma Ağı:**
     - `onblur`: Editörden dışarı tıklandığında otomatik kayıt tetiklenir.
     - `selectNoteInModal`: Sol listeden başka bir nota geçilmeden önce mevcut açık nottaki tüm değişiklikler otomatik olarak kaydedilir.
     - `closeFullNotesModal`: Modal çarpıdan kapatılırken mevcut düzenleme kaydedilir.
     - `createNewModalNote`: Yeni nota geçmeden önce mevcut not otomatik kaydedilir.
     - Yazma esnasında 1000ms gecikmeli debounced arka plan otomatik kaydı devreye alınarak DOM kasılmaları engellendi.
  4. **Parite ve Devir Teslim:**
     - `hub.html`, `hub_notes.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde güncellendi.
     - Kural #3 (Zar emojisi yasağı) tavizsiz korundu.

---

## 60. HUB NOT DEFTERİ SİLME (DELETE NOTE) BUTONU VE DİZİ SENKRONİZASYONU DÜZELTMESİ (2026-10-25)
* **Problem:**
  - Geniş Not Defteri modalında `[ 🗑️ Sil ]` butonuna tıklandığında onay verilmesine rağmen not silinmiyordu.
* **Kök Neden:**
  - `deleteNote()` fonksiyonu `target.notesList` transient sarmalayıcı nesnesini filtreliyordu ancak `target.targetObj.notesList` (yani `activeCamp.notesList` veya `targetChar.notesList`) kalıcı referansını güncellemiyordu.
  - Hemen ardından `saveNotesChanges` ve `renderFullNotesModalList` çağrıldığında `getActiveNotesTarget()` veritabanındaki güncellenmemiş eski diziyi okuduğu için silinmek istenen not ekranda kalmaya devam ediyordu.
* **Uygulanan Çözüm:**
  1. **Kesin Referans ve Metin Senkronizasyonu:**
     - `deleteNote` ve `saveNotesChanges` fonksiyonlarında `target.targetObj.notesList` ve `target.targetObj.notes` alanları kalıcı olarak filtrelenip senkronize edildi.
     - Silinen not aktif seçili not ise yeni aktif ID otomatik olarak listedeki bir sonraki nota (veya liste boşaldıysa `null`'a) devredildi.
  2. **Boş Liste ve Editör Koruması:**
     - Tüm notlar silindiğinde editörün devre dışı kalması (`disabled`), sil butonu ve sabitle butonunun opaklaşması pürüzsüzleştirildi.
  3. **Sol Listede Hızlı Silme Butonu (`✕`):**
     - Modal sol listesindeki her nota da tek tıkla silme imkânı sunan hızlı `✕` butonu eklendi.
  4. **Parite ve Devir Teslim:**
     - `hub_notes.js` ve `webapp/hub_notes.js` %100 SHA-256 eşitliğinde güncellendi.
     - Kural #3 (Zar emojisi yasağı) tavizsiz korundu.

---

## 62. HUB NOT DEFTERİ EDİTÖRÜNE AÇIK KAYDET BUTONU, CTRL+S/CTRL+ENTER KISAYOLLARI VE OTOMATİK VERİ TAAHHÜDÜ (2026-10-25)
* **Problem:**
  - Geniş Not Defteri modalında yeni bir not oluşturulduğunda veya mevcut bir not güncellenmek istendiğinde açık bir `[ 💾 Notu Kaydet ]` butonu bulunmuyordu.
  - Kullanıcı not yazıp çıktığında veya başka bir nota geçtiğinde değişikliklerin kaydedilip kaydedilmediği anlaşılamıyor ya da sekme geçişlerinde veri kaybı hissi oluşuyordu.
* **Uygulanan Çözüm:**
  1. **Açık `[ 💾 Notu Kaydet ]` Butonu ve Görsel Bildirim:**
     - Not editörünün sağ üst araç çubuğuna `[ 💾 Notu Kaydet ]` butonu eklendi.
     - Tıklandığında not veritabanına (`saveHubStorage` & `targetObj`) işlenir ve buton 1.5 saniyeliğine yeşil renkli `Kaydedildi! ✓` durumuna geçer.
     - Bilgi rozetinde son güncelleme anlık saat olarak tazelenir.
  2. **Klavye Kısayolları (Ctrl+S & Ctrl+Enter):**
     - Textarea içerisindeyken `Ctrl+S` veya `Ctrl+Enter` tuşlarına basıldığında not derhal kaydedilir ve onay bildirimi gösterilir.
  3. **Otomatik Kayıt ve Koruma Ağı:**
     - `onblur`: Editörden dışarı tıklandığında otomatik kayıt tetiklenir.
     - `selectNoteInModal`: Sol listeden başka bir nota geçilmeden önce mevcut açık nottaki tüm değişiklikler otomatik olarak kaydedilir.
     - `closeFullNotesModal`: Modal çarpıdan kapatılırken mevcut düzenleme kaydedilir.
     - `createNewModalNote`: Yeni nota geçmeden önce mevcut not otomatik kaydedilir.
     - Yazma esnasında 1000ms gecikmeli debounced arka plan otomatik kaydı devreye alınarak DOM kasılmaları engellendi.
  4. **Parite ve Devir Teslim:**
     - `hub.html`, `hub_notes.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde güncellendi.
     - Kural #3 (Zar emojisi yasağı) tavizsiz korundu.

---

## 61. HUB YENİ NOT OLUŞTURMA ŞABLONUNA OTOMATİK KARAKTER ADI, LVL VE TARİH ETİKETLERİ ENTEGRASYONU (2026-10-25)
* **İstek:**
  - "Yeni Not Oluştur" butonuna tıklandığında oluşturulan notun boş gelmek yerine standart olarak karakter adı (`#Karakter_Adi`), karakter seviyesi (`#lvlN`) ve o günün tarihi (`#GN_Ay_Yıl`) etiketleriyle (`#`) hazır gelmesi.
* **Uygulanan Değişiklikler:**
  1. **Dinamik Karakter ve Seviye Tespiti (`resolveCharacterForNote` & `toValidHashtag`):**
     - Not hedefi bir karakter ise doğrudan kendi adı ve seviyesi, kampanya ise o kampanyaya atanmış aktif karakter (veya Hub'daki mevcut karakter) çözümlendi.
     - Karakter adı boşluksuz, geçerli Türkçe karakter destekli standart etiket formatına dönüştürüldü (Örn: `Regdar Ironfist` -> `#Regdar_Ironfist`, `test1` -> `#test1`).
  2. **Standart Seviye ve Türkçe Tarih Etiketleri:**
     - Seviye: `#lvl1`, `#lvl5` vb. formatta üretildi.
     - Tarih: `#25_Ekim_2026` gibi Türkçe ay adını içeren okunabilir ve aranabilir formatta oluşturuldu.
  3. **Varsayılan Not Metni ve Odaklanma:**
     - Yeni notun gövdesi `${charTag} ${lvlTag} ${dateTag}\n\n` şablonuyla dolduruldu.
     - Editör açıldığında imleç otomatik olarak etiketlerin alt satırına konumlandırıldı.
     - `formatNoteTextHtml` fonksiyonunda `#lvl...` etiketleri indigo, tarih etiketleri teal (turkuaz) özel RPG rozeti olarak renklendirildi.
  4. **Parite ve Devir Teslim:**
     - `hub_notes.js` ve `webapp/hub_notes.js` %100 SHA-256 eşitliğinde güncellendi.
     - Kural #3 (Zar emojisi yasağı) tavizsiz korundu.

---

## 62. HUB NOT DEFTERİ EDİTÖRÜNE AÇIK KAYDET BUTONU, CTRL+S/CTRL+ENTER KISAYOLLARI VE OTOMATİK VERİ TAAHHÜDÜ (2026-10-25)
* **Problem:**
  - Geniş Not Defteri modalında yeni bir not oluşturulduğunda veya mevcut bir not güncellenmek istendiğinde açık bir `[ 💾 Notu Kaydet ]` butonu bulunmuyordu.
  - Kullanıcı not yazıp çıktığında veya başka bir nota geçtiğinde değişikliklerin kaydedilip kaydedilmediği anlaşılamıyor ya da sekme geçişlerinde veri kaybı hissi oluşuyordu.
* **Uygulanan Çözüm:**
  1. **Açık `[ 💾 Notu Kaydet ]` Butonu ve Görsel Bildirim:**
     - Not editörünün sağ üst araç çubuğuna `[ 💾 Notu Kaydet ]` butonu eklendi.
     - Tıklandığında not veritabanına (`saveHubStorage` & `targetObj`) işlenir ve buton 1.5 saniyeliğine yeşil renkli `Kaydedildi! ✓` durumuna geçer.
     - Bilgi rozetinde son güncelleme anlık saat olarak tazelenir.
  2. **Klavye Kısayolları (Ctrl+S & Ctrl+Enter):**
     - Textarea içerisindeyken `Ctrl+S` veya `Ctrl+Enter` tuşlarına basıldığında not derhal kaydedilir ve onay bildirimi gösterilir.
  3. **Otomatik Kayıt ve Koruma Ağı:**
     - `onblur`: Editörden dışarı tıklandığında otomatik kayıt tetiklenir.
     - `selectNoteInModal`: Sol listeden başka bir nota geçilmeden önce mevcut açık nottaki tüm değişiklikler otomatik olarak kaydedilir.
     - `closeFullNotesModal`: Modal çarpıdan kapatılırken mevcut düzenleme kaydedilir.
     - `createNewModalNote`: Yeni nota geçmeden önce mevcut not otomatik kaydedilir.
     - Yazma esnasında 1000ms gecikmeli debounced arka plan otomatik kaydı devreye alınarak DOM kasılmaları engellendi.
  4. **Parite ve Devir Teslim:**
     - `hub.html`, `hub_notes.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde güncellendi.
     - Kural #3 (Zar emojisi yasağı) tavizsiz korundu.


---

## 52. IRK NİTELİKLERİ UYGULA BUTONUNUN KALDIRILMASI & ANA KAYDETME AKIŞINA ATOMİK BAĞLANMASI (ÖNERİ A) (2026-10-25)
* **İstek:**
  1. Irk kartı içindeki mükerrer ve kafa karıştırıcı `[ 🧬 Irk Niteliklerini Uygula ]` butonunun kaldırılması (Öneri A).
  2. Varsayılan olarak gelen Human (İnsan) ırkının niteliklerinin uygulanmış olup olmadığının netleştirilmesi ve otomatikleştirilmesi.
* **Uygulanan Değişiklikler:**
  1. **Ayrı Butonun Kaldırılması & Önizleme Kartına Dönüşüm:**
     - Irk kartındaki ara buton kaldırıldı; kart artık seçilen ırkın boyut, hız, stat ve özelliklerini gösteren zarif bir canlı önizleme kartı olarak çalışır.
     - Irk değiştirildiğinde `profile-edit-size` ve `profile-edit-speed` alanları otomatik doldurulur.
  2. **Ana `[ 💾 Kaydet & Uygula ]` Butonuna Atomik Senkronizasyon:**
     - `saveStatDistribution()` fonksiyonu:
       - Yeni ırk seçildiğinde eski ırktan kalma nitelikleri (`source: "... Race"`) temizler.
       - Yeni ırkın resmi niteliklerini (`traits`) `character.specialAbilities` listesine eksiksiz ekler.
       - Boyut ve hız değerlerini günceller.
       - Checkbox işaretliyse ırksal stat değişimlerini uygular.
  3. **Varsayılan Human Niteliklerinin Otomatik Yüklenmesi:**
     - `character_data.json` dosyasına Human ırkının resmi RAW nitelikleri (`Bonus Feat (Human)`, `Skilled (Human)`) ve `size: "Medium"` eklendi.
     - `DOMContentLoaded` akışına, sıfırdan açılan karakterlerde ırk nitelikleri boşsa otomatik olarak ilgili ırkın (Human vb.) özelliklerini yükleyen koruma eklendi.
  4. **Parite ve İzolasyon:**
     - HUB dosyaları (`hub.html`, `webapp/hub.html`) kesinlikle değiştirilmedi.
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` (%100 SHA-256: `EB4FB7B7...`).
     - Standart tavla zarı emoji yasağı ve sıfır dummy data kuralı tavizsiz korundu.


---

## 53. SPOTLIGHT IRK ARAMA COMBOBOX'I VE MODERN AÇILIR MENÜ ENTEGRASYONU (2026-10-25)
* **İstek:**
  1. Karakter Künyesi modalındaki (`#stat-distribution-modal`) işletim sistemi kaynaklı ham/sönük native `<select>` menülerinin modern, temayla uyumlu Spotlight görünümüne kavuşturulması.
  2. Öneri A (Özel Tailwind koyu tema Popover, kategori rozetleri, mor/indigo vurgular, özel kaydırma çubuğu) ve Öneri B (Spotlight anlık arama çubuğu, klavye yön tuşları, canlı filtreleme ve 1 tıkla Rule Master AI entegrasyonu) mimarilerinin birleştirilmesi.
  3. `Yönelim` ve `Boyut` gibi diğer açılır menülerin koyu tema ve mor odaklama çizgileriyle modernize edilmesi.
  4. HUB sayfasının (`hub.html`, `webapp/hub.html`) kesinlikle değiştirilmemesi ve korunması.
* **Uygulanan Değişiklikler:**
  1. **Spotlight Race Combobox Bileşeni (`#race-custom-dropdown-container`):**
     - Native `<select>` yerine özel tetikleyici buton (`#race-dropdown-trigger`), açılır popover kartı (`#race-spotlight-dropdown`), canlı arama kutusu (`#race-spotlight-search`) ve kaydırılabilir sonuç listesi (`#race-spotlight-list`) entegre edildi.
     - Form serileştirme ve geriye dönük uyumluluk için `#profile-edit-race` gizli input (hidden input) olarak korundu.
  2. **Akıllı Canlı Arama ve Kategori Gruplama:**
     - Arama kutusuna yazıldıkça ırklar; Standart RAW (Human, Elf, Dwarf...), Genişletilmiş SRD/Ek Kitaplar (Aasimar, Tiefling, Dragonborn, Drow, Orc, Goblin, Kobold, Goliath, Warforged...) ve Özel/AI Irklar başlıkları altında anında filtrelenir.
     - Klavye desteği: `Escape` ile kapatma, `Enter` ile filtrelenen ilk sonucu seçme veya eşleşme yoksa doğrudan Rule Master AI aramasını tetikleme.
     - Dışarı tıklama (click outside) ile otomatik kapanma davranışı eklendi.
  3. **1 Tıkla Rule Master AI Fallback Entegrasyonu:**
     - Kullanıcı listede olmayan bir ırk yazdığında (örneğin Thri-Kreen, Catfolk vb.), sonuç listesinde *"Rule Master AI ile Getir"* butonu otomatik belirir ve tek tıkla resmi WotC D&D 3.5e kitaplarından ırkı getirir.
  4. **Yönelim ve Boyut Menülerinin Modernleştirilmesi:**
     - `#profile-edit-alignment` ve `#profile-edit-size` açılır menüleri `bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-purple-400 focus:outline-none rounded-lg font-semibold text-white cursor-pointer` sınıflarıyla modernize edildi.
  5. **Parite ve Güvenlik:**
     - HUB dosyaları (`hub.html`, `webapp/hub.html`) kesinlikle değiştirilmedi.
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` 4 dosyada %100 SHA-256 eşitliği (`98A75AC891BCF22A249633BA2C4C1C4CB059CE3BD160E002137A49F675C36AB6`).
     - Standart tavla zarı emoji yasağı (Rule #3: NO `U+1F3B2`) ve dummy data yasağı (Rule #5) eksiksiz uygulandı.


---

## 54. SPOTLIGHT & RULE MASTER TANRI / İNANÇ (DEITY) ARAMA ENTEGRASYONU (2026-10-25)
* **İstek:**
  - Karakter Künyesi modalındaki (`#stat-distribution-modal`) serbest metin kutusu olan Tanrı / İnanç (`#profile-edit-deity`) alanının "Spotlight & Rule Master Araması" standardına geçirilmesi (Seçenek A).
* **Uygulanan Değişiklikler:**
  1. **Spotlight & Rule Master Deity Combobox Bileşeni (`#deity-custom-dropdown-container`):**
     - Native input yerine seçili tanrının simgesi ve adını gösteren modern tetikleyici buton (`#deity-dropdown-trigger`), arama popover kartı (`#deity-spotlight-dropdown`), anlık arama kutusu (`#deity-spotlight-search`) ve kaydırılabilir sonuç listesi (`#deity-spotlight-list`) entegre edildi.
     - Form ve karakter verisi uyumluluğu için `#profile-edit-deity` gizli input (`type="hidden"`) olarak korundu.
  2. **D&D 3.5e RAW 22 Resmi Tanrı Kataloğu (`DND35_DEITY_DEFINITIONS` & `bundled_data.js`):**
     - *İyilik & Işık Panteonu:* Pelor, Heironeous, Kord, Corellon Larethian, Moradin, Ehlonna, Yondalla, Bahamut.
     - *Doğa, Bilgi & Denge Panteonu:* Boccob, Fharlanghn, Obad-Hai, St. Cuthbert, Wee Jas, Olidammara, Garl Glittergold.
     - *Karanlık, Savaş & Yıkım:* Hextor, Nerull, Vecna, Erythnul, Gruumsh, Tiamat.
     - *Panteon Dışı & Felsefe:* Yok / Felsefi İnanç.
     - Her tanrının yönelimi (Alignment), tercih ettiği silahı (Favored Weapon) ve etki alanları (Domains) kart üzerinde gösterilmektedir.
  3. **Rule Master AI Entegrasyonu (`searchDeityViaRuleMasterAi` & `fetchDeityViaAi`):**
     - Kullanıcı listede olmayan bir tanrıyı aradığında (örn. *Kelemvor, Mystra, Tempus, Bane, Lolth, Helm, Asmodeus*), 1 tıkla Rule Master AI resmi D&D 3.5e kütüphanelerinden (Forgotten Realms, Eberron vb.) tanrının yönelimini, silahını ve alanlarını çekerek karaktere işler ve yerel önbelleğe (`dnd35_custom_deities`) kaydeder.
     - `rule_master.js` promptu (`0.1 DEITY SCHEMA`) ve `normalizeEntry` veri alanları (`pantheon`, `alignment`, `favoredWeapon`, `domains`, `symbol`) güncellenerek Kural #8 eksiksiz sağlandı.
  4. **Parite ve Güvenlik:**
     - HUB dosyaları (`hub.html`, `webapp/hub.html`) kesinlikle değiştirilmedi.
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` (%100 SHA-256: `837A3BC96BC2BF882910BA65132DBACDC4B017CACCA19C5054BD7153BFC48FED`).
     - `rule_master.js`, `webapp/rule_master.js` (%100 SHA-256: `2790EA5022A9810B4FDBC393F38A4F2D33073F5F497BF92A139B9FDA00A8E906`).
     - `bundled_data.js`, `webapp/bundled_data.js` (%100 SHA-256: `492C2EA12D029F84D1C5D35685774078637BB7C70B2B138254069DD4865D821D`).
     - Standart tavla zarı emoji yasağı (Rule #3: NO `U+1F3B2`) ve dummy data yasağı (Rule #5) eksiksiz uygulandı.


---

## 55. YÖNELİM (ALIGNMENT) SEMBOL VE SPOTLIGHT AÇILIR MENÜ ENTEGRASYONU (2026-10-25)
* **İstek:**
  - Karakter Künyesi modalındaki (`#stat-distribution-modal`) işletim sistemi kaynaklı ham/gri native `<select>` Yönelim (Alignment) menüsünün, yanındaki Tanrı/İnanç ve Irk menüleriyle %100 görsel uyumlu olacak şekilde sembollü ve modern bir açılır menüye dönüştürülmesi.
* **Uygulanan Değişiklikler:**
  1. **Spotlight & Sembollü Yönelim Seçici (`#alignment-custom-dropdown-container`):**
     - Ham `<select>` yerine, seçili yönelimin ikonunu (`⚖️`, `🕊️`, `🏹`, `📜`, `☯️`, `🎭`, `⛓️`, `💀`, `🩸`) ve Türkçe/İngilizce adını gösteren tetikleyici buton (`#alignment-dropdown-trigger`), açılır popover kartı (`#alignment-custom-dropdown`), anlık filtre kutusu (`#alignment-spotlight-search`) ve seçenek listesi (`#alignment-options-list`) entegre edildi.
     - Form serileştirme ve sayfa uyumluluğu için `#profile-edit-alignment` gizli input (`type="hidden"`) olarak korundu.
  2. **D&D 3.5e RAW 9 Yönelim Ahlak & Düzen Kataloğu (`DND35_ALIGNMENT_DEFINITIONS`):**
     - *İyilik Ekseni (Good):*
       - `⚖️ Lawful Good (Yasal İyi)`: Onur, adalet, şeref ve başkalarını koruma erdemi (Paladin).
       - `🕊️ Neutral Good (Nötr İyi)`: Merhamet, fedakarlık ve karşılıksız yardımseverlik.
       - `🏹 Chaotic Good (Kaotik İyi)`: Vicdan, bireysel bağımsızlık ve cömertlik.
     - *Denge & Tarafsızlık Ekseni (Neutral):*
       - `📜 Lawful Neutral (Yasal Nötr)`: Yasa, gelenek, disiplin ve tarafsız otorite.
       - `☯️ True Neutral (Katıksız Nötr)`: Doğa dengesi, tarafsızlık ve sağduyu (Druid).
       - `🎭 Chaotic Neutral (Kaotik Nötr)`: Mutlak bireysellik ve kurallardan bağımsız heves (Bard).
     - *Kötülük Ekseni (Evil):*
       - `⛓️ Lawful Evil (Yasal Kötü)`: Tiranlık, hiyerarşi, disiplinli zulüm ve sömürü.
       - `💀 Neutral Evil (Nötr Kötü)`: Saf bencillik, açgözlülük, ihanet ve katıksız yıkım.
       - `🩸 Chaotic Evil (Kaotik Kötü)`: Vahşet, katliam, kontrolsüz öfke ve şiddet.
  3. **Parite ve Güvenlik:**
     - HUB dosyaları (`hub.html`, `webapp/hub.html`) kesinlikle değiştirilmedi.
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` (%100 SHA-256: `44074B0EE4311DC03F0A5258C0A6BCF1CE0A6F3D68475AE529B2D8B75B357CE8`).
     - Standart tavla zarı emoji yasağı (Rule #3: NO `U+1F3B2`) ve dummy data yasağı (Rule #5) eksiksiz uygulandı.


---

## 56. BOYUT (SIZE) SEMBOL VE SPOTLIGHT AÇILIR MENÜ ENTEGRASYONU (2026-10-25)
* **İstek:**
  - Karakter Künyesi modalındaki (`#stat-distribution-modal`) Boyut (`#profile-edit-size`) alanının, Yönelim, Tanrı/İnanç ve Irk menüleriyle %100 uyumlu olacak şekilde sembollü ve D&D 3.5e RAW dövüş modifikatörlerini gösteren modern bir açılır popover kartına dönüştürülmesi.
* **Uygulanan Değişiklikler:**
  1. **Spotlight & Sembollü Boyut Seçici (`#size-custom-dropdown-container`):**
     - Native `<select>` yerine, seçili boyutun simgesini (`🔬`, `🤏`, `🐾`, `🍄`, `👤`, `🦍`, `🐘`, `🌋`, `🪐`) ve adını gösteren tetikleyici buton (`#size-dropdown-trigger`), açılır popover penceresi (`#size-custom-dropdown`) ve seçenek listesi (`#size-options-list`) entegre edildi.
     - Form serileştirme ve sayfa senkronizasyonu için `#profile-edit-size` gizli input (`type="hidden"`) olarak korundu.
  2. **D&D 3.5e RAW 9 Boyut Kataloğu (`DND35_SIZE_DEFINITIONS`):**
     - `Fine (Mikro)`: +8 AC/Atak, +16 Gizlenme, Alan 0.5 ft (Böcek / mikroskobik).
     - `Diminutive (Minyatür)`: +4 AC/Atak, +12 Gizlenme, Alan 1 ft (Fare, kurbağa).
     - `Tiny (Çok Küçük)`: +2 AC/Atak, +8 Gizlenme, Alan 2.5 ft (Kedi, şahin, yılan).
     - `Small (Küçük)`: +1 AC/Atak, +4 Gizlenme, Alan 5 ft (Halfling, Gnome, Kobold, Goblin).
     - `Medium (Orta)`: 0 AC/Atak, 0 Gizlenme, Alan 5 ft (Human, Elf, Dwarf, Orc).
     - `Large (Büyük)`: -1 AC/Atak, -4 Gizlenme, Alan 10 ft (Ogre, Troll, At, Centaur).
     - `Huge (Devasa)`: -2 AC/Atak, -8 Gizlenme, Alan 15 ft (Devler, Treant, Fil).
     - `Gargantuan (Muazzam)`: -4 AC/Atak, -12 Gizlenme, Alan 20 ft (Kadim Ejderhalar, Kraken).
     - `Colossal (Heyula)`: -8 AC/Atak, -16 Gizlenme, Alan 30 ft (Tarrasque, En Yaşlı Ejderhalar).
  3. **Irk Değişiminde Otomatik Tetikleyici Senkronizasyonu:**
     - `onProfileRaceChange()` ve `applyRacialTraitsToCharacter()` fonksiyonları yeni bir ırk seçildiğinde boyutu güncellerken artık `updateSizeDropdownTrigger()` çağrısını da otomatik yaparak tetikleyici butonun simge ve etiketini anında günceller.
  4. **Parite ve Güvenlik:**
     - HUB dosyaları (`hub.html`, `webapp/hub.html`) kesinlikle değiştirilmedi.
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` (%100 SHA-256: `69569C862B67069E14C527F0E27B8102CA26BB69E29FE2C521EB2218F71AB47F`).
     - Standart tavla zarı emoji yasağı (Rule #3: NO `U+1F3B2`) ve dummy data yasağı (Rule #5) eksiksiz uygulandı.


---

## 57. KARAKTER KÜNYESİ MODALININ BOYUT VE YÜKSEKLİK OPTİMİZASYONU (2026-10-25)
* **İstek:**
  - Karakter Künyesi (`#stat-distribution-modal`) modalının dikey yüksekliğinin artırılması ve daha ferah bir görüntüleme alanına kavuşturulması.
* **Uygulanan Değişiklikler:**
  1. **Yükseklik (Height) ve Genişlik (Max-Width) Güncellemesi:**
     - Modal dış kartı `max-w-2xl` ve serbest yükseklikten; `max-w-2xl sm:max-w-3xl w-full h-[90vh] md:h-[94vh] max-h-[96vh]` sınıflarına yükseltildi.
     - Modal gövdesi (`<!-- Modal Body -->`) `flex-1 custom-scroll` ile donatılarak, tüm kullanılabilir dikey alanı doldurması ve açılır menülerin (Irk, Tanrı, Yönelim, Boyut) daha ferah bir alanda açılması sağlandı.
  2. **Parite ve Güvenlik:**
     - HUB dosyaları (`hub.html`, `webapp/hub.html`) kesinlikle değiştirilmedi.
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` (%100 SHA-256: `96DC5845F6CA2C5AA044944CF480A4A156C51AD94FF554FEAC9AB89AEB2CE5CB`).
     - Kural #3 (Zar emojisi yasağı) ve Kural #5 tavizsiz korundu.


---

## 58. AKILLI NOT DEFTERİ: HASHTAG OTOMATİK TAMAMLAMA, İLİŞKİSEL ETİKET AĞI (MINDMAP) VE AI KAMPANYA GÜNLÜKÇÜSÜ (2026-10-25)
* **İstek:**
  - Kullanıcının kısa kısa aldığı atomik notları yönetmek amacıyla 3 aşamalı akıllı sistemin kurulması:
    1. `#` işareti konulduğunda standart ve daha önce girilmiş `#` etiketlerinin önerilmesi, yazmaya devam ettikçe filtrelenip telefon klavyesi gibi tamamlanması.
    2. `#` etiketlerini ve birbiriyle ilişkili etiketleri görmek ve filtrelemek için ilişkisel etiket matrisi ve etkileşimli bir Mindmap görünümü sunulması.
    3. Kullanıcının kısa kısa aldığı bu mikro notların yapay zeka (Gemini AI) ile sentezlenerek derli toplu bir oturum hikayesi veya görev takip dosyası haline getirilmesi.
* **Uygulanan Değişiklikler:**
  1. **Aşama 1: `#` Etiket Otomatik Tamamlama (Typeahead Popover):**
     - Hem Geniş Not Defteri editöründe (`#hub-modal-note-editor`) hem de yan panel hızlı not alanında (`#hub-quick-note-input`) `#` yazıldığında anında tetiklenen dinamik açılır popover entegre edildi.
     - Standart sistem etiketleri (`#gorev`, `#npc`, `#yer`, `#loot`, `#ipucu`, `#savas`, `#bilgi`, `#anlasma`) ve veritabanındaki tüm notlardan taranan geçmiş dinamik etiketler kullanım sıklığına göre önerilir.
     - Klavye gezinimi (`ArrowUp`, `ArrowDown`, `Enter`, `Tab`, `Escape`) ve fare tıklaması ile tek tuşla kelimeyi tamamlar ve imleci boşluk bırakarak doğru konuma yerleştirir.
  2. **Aşama 2: İlişkisel Etiket Filtreleme & İnteraktif SVG Mindmap Ağ Görünümü:**
     - **Birlikte Geçen Etiketler Çubuğu:** Bir etiket seçildiğinde (örn. `#yer`), aynı notlarda onunla birlikte kullanılan diğer etiketler (`#neverwinter (3)`, `#npc (2)`) hesaplanarak ilişkisel gezinim hapları halinde listelenir.
     - **SVG Mindmap Grafiği:** `[ 🕸️ Etiket Haritası ]` sekmesinde, kampanya içindeki tüm etiketler düğümler (node), birlikte geçtikleri notlar ise bağlar (edge) olarak fiziksel yay kuvveti simülasyonu ile çizilir.
     - Düğüme tıklandığında ilişkili tüm bağlar ve komşu etiketler parlar; sağ çekmecede o etikete ait tüm mikro notlar listelenir. "📝 Düzenle" butonuyla doğrudan editörde ilgili not seçili olarak açılabilir.
  3. **Aşama 3: AI Kampanya Günlükçüsü (AI Chronicler):**
     - `[ ✨ AI Günlükçü ]` sekmesi ve hızlı sentezleme butonları eklendi.
     - 4 farklı sentezleme modu:
       - 📖 *Oturum Günlüğü & Hikaye:* Dağınık notları sürükleyici, edebi bir Türkçe D&D oturum hikayesi günlüğüne dönüştürür.
       - 🎯 *Görev & İpucu Takip Dosyası:* Açık/biten görevleri, şüphelileri ve ipuçlarını `[ ]` kutucukları ile raporlar.
       - 👥 *Karakterler & Mekanlar Rehberi:* Karşılaşılan NPC'leri, loncaları ve mekanları ansiklopedik döküm haline getirir.
       - 💎 *Hazine & Eşya Envanteri:* Kazanılan ganimet ve eşyaları derler.
     - Kullanıcının kayıtlı Gemini API anahtarı (`gemini-flash-lite-latest` ve fallback `gemini-flash-latest`) ile çalışır.
     - Sentezlenen günlük tek tıkla `[ 📌 Sabitlenmiş Not Olarak Kaydet ]` butonuyla kampanyanın başına `#kronik #ai_ozet` etiketleriyle eklenir.
  4. **Parite ve Güvenlik:**
     - `hub.html` ve `hub_notes.js` kök dizin dosyaları `webapp/hub.html` ve `webapp/hub_notes.js` ile %100 SHA-256 eşitliğinde güncellendi.
     - Proje kuralı gereğince tavla zarı emojisi `U+1F3B2` KESİNLİKLE kullanılmadı.


---

## 58. IRKSAL STAT MODİFİKATÖRLERİNİN OTOMATİK VE DİNAMİK KURAL MOTORUNA ENTEGRASYONU (2026-10-25)
* **İstek:**
  - Karakter Künyesi modalındaki kafa karıştırıcı ve mükerrer artış riski taşıyan `[ ] Irk stat bonuslarını/cezalarını yetenek skorlarına yansıt` manuel onay kutusunun kaldırılması.
  - Sistemin D&D 3.5e RAW kural mekaniğine uygun olarak; taban statları (Point Buy / 4d6 / Manuel) saf tutması, ırksal bonus ve cezaları (`type: "Racial"`) `RuleEngine.recalculateCharacter()` motoru üzerinden otomatik ve dinamik olarak nihai skora yansıtması.
* **Uygulanan Değişiklikler:**
  1. **Otomatik Kural Motoru Entegrasyonu (`rule_engine.js` & `webapp/rule_engine.js`):**
     - `resolveBonusStacking` fonksiyonuna D&D 3.5e RAW `racial` bonus türü eklendi.
     - `recalculateCharacter` fonksiyonuna `3.9. Collect Racial Ability Modifiers from canonical Race` adımı entegre edildi. Seçili ırkın (örn. Elf için `+2 DEX, -2 CON`, Dwarf için `+2 CON, -2 CHA`, Orc için `+4 STR, -2 INT, -2 WIS, -2 CHA`) tüm stat bonusları ve cezaları `abilityBuckets` havuzuna resmi `type: "Racial", source: "${race} (Irk)"` etiketiyle otomatik aktarılır.
     - Irk değiştirildiğinde eski ırkın bonusu/cezası kendiliğinden düşer, yeni ırkınki anında devreye girer.
  2. **Manuel Onay Kutusunun Kaldırılması & Önizleme Geliştirmesi:**
     - Modal içindeki manuel `checkbox` kaldırılarak yerine bilgilendirici ve güven veren otomatik rozet yerleştirildi.
     - `saveStatDistribution()` ve `applyRacialTraitsToCharacter()` içindeki statları kalıcı olarak bozan manuel eklemeler temizlendi.
     - Modalın *"Yetenek Skorları"* önizleme kartına (`renderStatDistPreviewRow`) gerçek zamanlı ırksal etki dökümü (`T:14 +2 -1` vb.) eklendi; böylece oyuncu taban puanını, ırk katkısını ve nihai puanını aynı anda şeffaf şekilde izleyebilmektedir.
  3. **Parite ve Güvenlik:**
     - HUB dosyaları (`hub.html`, `webapp/hub.html`) kesinlikle değiştirilmedi.
     - `character.html`, `index.html`, `webapp/character.html`, `webapp/index.html` (%100 SHA-256: `81424124BCF3C661B6B00BE72E4234241D1DD08266EBC0BB050EE89A96080E70`).
     - `rule_engine.js`, `webapp/rule_engine.js` (%100 SHA-256: `1511CB08E23A3872E0F23C02DC2F9463932A51B9B0F891CF092811DF1821379A`).
     - Standart tavla zarı emoji yasağı (Rule #3: NO `U+1F3B2`) ve dummy data yasağı (Rule #5) eksiksiz uygulandı.


---

## 59. NOT SİSTEMİ SADELEŞTİRMESİ: TEMİZ YENİ NOT VE TO-DO ETİKETİ DÜZENLEMESİ (2026-10-25)
* **İstek:**
  - "Yeni Not Oluştur" tıklandığında metin kutusunun otomatik `#Karakter #lvl1 #date` etiketleri olmadan tamamen boş ve temiz açılması.
  - Kavram karmaşasını önlemek için `+ [ ] Görev` butonunun adının `+ To-Do` olarak güncellenmesi.
* **Uygulanan Değişiklikler:**
  1. **Temiz Yeni Not Başlatma:**
     - `createNewModalNote()` fonksiyonu not metnini boş (`""`) ve etiket dizisini boş (`[]`) başlatacak şekilde sadeleştirildi. İmleç doğrudan ilk karaktere odaklanır.
     - Zaman damgası (`createdAt`/`updatedAt`) ve hedef karakter/kampanya bilgisi sistem tarafından arka planda tutulduğundan not metninde gereksiz veri tekrarı ve etiket haritası kirliliği önlendi.
  2. **Araç Çubuğu Buton Düzenlemesi:**
     - Hem Geniş Not Defteri hem de yan panel araç çubuğunda `+ [ ] Görev` butonu `+ To-Do` olarak güncellendi.
     - `#gorev` bir meta-kategori/etiket; `- [ ] ` ise markdown yapılacaklar kutucuğu olarak net bir biçimde ayrıştırıldı.
  3. **Parite ve Güvenlik:**
     - `hub.html` ve `hub_notes.js` dosyaları `webapp/` altındaki kopyalarıyla %100 SHA-256 eşitliğinde güncellendi.
     - Tavla zarı emojisi `U+1F3B2` kesinlikle kullanılmadı.


---

## 60. KARAKTER KÜNYESİ MODALI: IRK ÖNİZLEME KARTINDAN GEREKSİZ SENKRONİZASYON BİLGİ METNİNİN KALDIRILMASI (2026-10-25)
* **İstek:**
  - Karakter Künyesi (`#profile-modal`) Irk önizleme kartındaki (`#profile-race-traits-card`) yeşil *"Boyut, hız ve tüm ırksal nitelikler 'Kaydet & Uygula' ile senkronize edilir"* ibaresinin arayüzden kaldırılması.
* **Uygulanan Değişiklikler:**
  1. **UI Sadeleştirmesi:**
     - `onProfileRaceChange()` fonksiyonunda `#profile-race-traits-card` alt bilgi alanındaki gereksiz yeşil senkronizasyon mesajı kaldırıldı.
     - Kartın altında yalnızca kural motorunun yetenek bonus/cezalarını otomatik uyguladığını belirten rozet (`🧬 Irksal stat bonusları/cezaları kural motoru tarafından otomatik uygulanır`) bırakılarak görsel karmaşa giderildi.
  2. **Parite ve Bütünlük:**
     - Değişiklik `character.html`, `index.html`, `webapp/character.html` ve `webapp/index.html` dosyalarına uygulandı.
     - 4 dosya arasında %100 SHA-256 paritesi korundu (`24ba8bcfaad30f0128e63cddb76263fd21e09738058a64b5e0fbb81187007181`).
     - Standart tavla zarı emoji yasağına (Rule #3: NO `U+1F3B2`) ve HUB izolasyonuna (Rule #6 & Rule #7) titizlikle uyuldu.


---

## 61. KARAKTER KÜNYESİ: 4d6 DROP LOWEST STAT ZARLARI ÇİFT '1' YENİDEN ATMA KURALI (2026-10-25)
* **İstek:**
  - Karakter Künyesi modalı *"4d6 Drop Lowest (Zar)"* sekmesinde her bir stat için zar atıldığında en az 2 adet '1' gelmesi durumunda o stat için zarların otomatik olarak yeniden atılması.
* **Uygulanan Değişiklikler:**
  1. **Çift '1' Yeniden Atma Mekaniği (Double-One Reroll Rule):**
     - `rollSingle4d6StatObj(id, assignedTo)` fonksiyonu eklendi. Her stat için 4 adet d6 atılır; eğer zarlarda 2 veya daha fazla '1' tespit edilirse (`rolls.filter(r => r === 1).length >= 2`), zarlar kural gereği sıfırlanıp 1'lerin sayısı 2'nin altına düşene (0 veya 1 adet kalana) kadar otomatik olarak yeniden atılır.
     - `rollAll4d6Stats()` fonksiyonu bu yeni modüler fonksiyona bağlandı. Toplu zar atımında kaç adet çift '1' durumunun elenip yenilendiği hesaplanarak toast bildiriminde şeffafça kullanıcıya raporlanır (`showDiceTopToast`).
  2. **Tekil Stat Yeniden Atma Desteği:**
     - `rerollSingle4d6Stat(rollId)` fonksiyonu ve zar kartlarının başlığına kompakt `⚡` yeniden atma butonu eklendi. Böylece kullanıcı isterse sadece istediği tekil bir statın zarını aynı çift '1' koruma kuralıyla bağımsızca yeniden yuvarlayabilir.
  3. **Arayüz Açıklaması Güncellemesi:**
     - Panel üstündeki kural tanımı güncellendi: *"Her stat için 4 adet 6'lık zar atılır (2 veya daha fazla 1 gelirse zarlar yeniden atılır), en düşük zar elenerek kalan 3 zar toplanır."*
  4. **Parite ve Güvenlik:**
     - `character.html`, `index.html`, `webapp/character.html` ve `webapp/index.html` dosyalarına uygulandı (%100 SHA-256 eşitliği korundu).
     - HUB modülleri (`hub.html`, `webapp/hub.html`) dokunulmadan izole bırakıldı.
     - Standart tavla zarı emoji yasağına (Rule #3: NO `U+1F3B2`) ve dummy data yasağına (Rule #5) eksiksiz uyuldu.


---

## 60. NOT DEFTERİ: BİTİŞİK BAŞLIK + GÖVDE HİYERARŞİSİ VE DİNAMİK FİHRİST (2026-10-25)
* **İstek:**
  - Apple Notes ve Notion standartlarında, kullanıcıya başlık ve gövde ayrımını sezgisel olarak yaşatan bitişik görsel başlık alanının (`#hub-modal-note-title`) entegrasyonu.
  - Sol listedeki ve yan paneldeki kart başlıklarının `Not 1`, `Not 2` monotonluğundan kurtarılarak gerçek not başlıkları ile dinamik fihriste dönüştürülmesi.
* **Uygulanan Değişiklikler:**
  1. **Bitişik Görsel Başlık & Gövde Kartı:**
     - Editör alanı tek bir koyu parşömen kartı içerisinde iki hiyerarşik katmana ayrıldı:
       - **Başlık Satırı (`#hub-modal-note-title`):** Çerçevesiz, büyük ve kalın beyaz font (`text-base sm:text-lg font-bold text-white placeholder-slate-600`). Placeholder: `"Not Başlığı (İsteğe bağlı)..."`.
       - **Gövde Textarea (`#hub-modal-note-editor`):** Başlığın hemen altında, zarif bir ayırıcı çizgi ile kesintisiz devam eden not metni alanı.
     - **Akıcı Klavye Ergonomisi:** Başlık alanında `Enter` tuşuna basıldığında imleç otomatik olarak altındaki gövde metin kutusuna atlar; `Ctrl+S` veya `Ctrl+Enter` doğrudan notu kaydeder.
  2. **Dinamik Kart Başlıkları (Fihrist Görünümü):**
     - Hem Geniş Not Defteri sol listesinde hem de yan panel kayıtlı notlar listesinde, kart başlıkları artık notun başlığını (`note.title`) gösterir.
     - Başlık girilmemişse metnin ilk anlamlı satırı başlık olarak atanır. Boş notlarda güvenli hedef adı kullanılır.
     - Pinned notlar rozetinde de ilk olarak başlık adı gösterilir.
  3. **Hızlı Not Entegrasyonu:**
     - Yan panelden çok satırlı hızlı not girildiğinde ilk satır otomatik başlık, devamı gövde olarak yapılandırılır.
  4. **Parite ve Güvenlik:**
     - `hub.html` ve `hub_notes.js` dosyaları `webapp/` altındaki kopyalarıyla %100 SHA-256 eşitliğinde güncellendi.
     - Tavla zarı emojisi `U+1F3B2` kesinlikle kullanılmadı.


---

## 61. 3D ZAR YÜZEY DOKUSU: RAKAMLARIN ETRAFINDAKİ SİLİK HALKANIN KALDIRILMASI (2026-10-25)
* **İstek:**
  - 3D çokyüzlü zarların (d20, d12, d10, d8, d6, d4, d100) yüzeylerinde, rakamların etrafında yer alan silik kesikli halkanın (arcane ring / facet frame) kaldırılması ve yüzeyin pürüzsüz koyu obsidyen kristal görünümüne kavuşturulması.
* **Uygulanan Değişiklikler:**
  1. **Doku Tuvali Çizim Optimizasyonu (`dice3d.js`):**
     - `createNumberTexture()` fonksiyonu içinde yer alan ve `ctx.arc(cx, cy, 185, 0, Math.PI * 2)` ile `ctx.setLineDash([8, 8])` kesikli çember çizen kod bloğu tamamen kaldırıldı.
     - 6 ve 9 rakamlarını ayıran alt nokta (`hasDotUnderline`) hariç tüm yapay halkalar temizlendi.
     - Altın yaldızlı serif Roma rakamları (Cinzel style) koyu obsidyen yüzey üzerinde hiçbir daire izi olmadan pürüzsüz ve berrak hale getirildi.
  2. **Önbellek (Cache Busting) ve Evrensel Parite:**
     - `dice3d.js?v=20261025_2338` versiyon query parametresi `hub.html`, `index.html` ve `character.html` sayfalarında güncellendi.
     - `dice3d.js`, `hub.html`, `index.html`, `character.html` kök dosyaları `webapp/` altındaki kopyalarıyla %100 SHA-256 eşitliğinde güncellendi.
     - Tavla zarı emojisi `U+1F3B2` kesinlikle kullanılmadı.


---

## 62. SEVİYE ATLAMA SİHİRBAZI: RULE MASTER & SPOTLIGHT BİRLEŞİK SINIF SEÇİCİ (2026-10-25)
* **İstek:**
  - Seviye Atlama Sihirbazı (Level Up Wizard) penceresindeki üstte duran akordeon *"Rule Master: Sınıf & Prestij Arama Konsolu"* ile alttaki klasik HTML `<select id="lvlup-class-select">` kutusunun tek, modern bir **Spotlight & Rule Master AI Sınıf Seçici** altında birleştirilmesi.
* **Uygulanan Değişiklikler:**
  1. **Arayüz ve Mantık Sadeleştirmesi (Single Unified Component):**
     - Üstteki büyük akordeon kartı ve altındaki klasik HTML select kutusu kaldırılarak, Karakter Künyesi modalı Spotlight tasarım diliyle tam uyumlu modern bir tetikleyici kart (`#lvlup-class-dropdown-trigger`) ve açılır katman (`#lvlup-class-spotlight-dropdown`) oluşturuldu.
     - Tetikleyici kart seçili olan sınıfı ikonu (`🛡️`, `👑`, `⚙️`), sınıf türü rozeti, Hit Die (`d10 HD`), BAB ilerleme hızı (`Tam BAB +1.0`), iyi kurtarma zarları (`İyi: Fort`) ve beceri puanı oranıyla (`2+INT Beceri`) zengin biçimde gösterir.
  2. **Gömülü Spotlight ve Rule Master AI Araması:**
     - Açılır katmanda hızlı arama kutusu (`#lvlup-class-search-input`), filtre çipleri (`Tümü`, `🛡️ Temel`, `👑 Prestij`, `⚙️ Özel`), prestij önkoşul doğrulayıcı (`checkClassPrerequisites`: `✅ Karşılanıyor` / `⚠️ Eksik Koşul`), seviye gelişim tablosu inceleme butonu (`📜 Gelişimi Göster`) ve `fetchClassFromRuleMasterAi` AI arama motoru eksiksiz korundu.
     - Listede bulunmayan bir sınıf ismi yazılıp Enter'a basıldığında Rule Master AI devreye girerek D&D 3.5e RAW kural kitaplarından sınıf parametrelerini çekip seçer.
  3. **Geriye Dönük Tam Motor Uyumluluğu:**
     - `<select id="lvlup-class-select">` arka planda gizli (`hidden`) olarak korunarak `onLevelUpClassChange()`, HP can zarı atışları, BAB ve kurtarma zarı hesaplamaları ile kaydetme motorunun sıfır riskle çalışması sağlandı.
  4. **Parite ve Güvenlik:**
     - Değişiklik `character.html`, `index.html`, `webapp/character.html` ve `webapp/index.html` dosyalarına uygulandı (%100 SHA-256 eşitliği sağlandı: `de4ea7fd3db67f5836a4aa4966722792fac6e8a1c5a7bdbea965229fc5ada2cb`).
     - `hub.html` ve `dice3d.js` dosyaları güvenle izole tutuldu.
     - Tavla zarı emojisi (`U+1F3B2`) yasağı ve dummy data yasağına titizlikle uyuldu.


---

## 63. 3D D12 (ONİKİYÜZLÜ) ZAR RAKAM ORTALAMA VE APEX YÖNLENDİRME DÜZELTMESİ (2026-10-25)
* **İstek:**
  - 3D zar motorunda (`dice3d.js`) d12 (dodecahedron) zarının yüzeylerindeki rakamların pentagon (beşgen) yüzün tam ortasında olmaması, kenara/köşeye kayık durması sorununun çözülmesi.
* **Kök Neden Analizi (Root Cause Analysis):**
  - Three.js `DodecahedronGeometry` içinde her bir beşgen yüzey 3 adet üçgenden (`triangles`) meydana gelmektedir.
  - `extractFaces(geo)` metodu aynı düzlemdeki üçgenleri birleştirirken `f.center.add(center).multiplyScalar(0.5)` şeklinde ardışık ağırlık ortalaması almaktaydı.
  - 3 üçgenli bir beşgende bu işlem 1. üçgene %25, 2. üçgene %25, 3. üçgene %50 ağırlık vererek ve ortak fan merkez köşesini aşırı ağırlıklandırarak beşgen ağırlık merkezini gerçek geometrik merkezden yaklaşık %15-20 oranında saptırmaktaydı.
* **Uygulanan Değişiklikler:**
  1. **Geometrik Poligon Ağırlık Merkezi (Polygon Centroid) Hesabı (`dice3d.js`):**
     - `extractFaces(geo)` metodu coplanar yüzeyleri gruplarken o yüzeye ait benzersiz köşeleri (`group.vertices`) toplamaktadır.
     - Yüzey merkezi artık üçgenlerin dengesiz ortalaması yerine beşgenin 5 benzersiz köşesinin aritmetik ortalaması (`center = sum(vertices) / vertices.length`) olarak hesaplanmaktadır.
     - Dışa bakan birim normal vektör doğrudan merkezin yönünden (`center.clone().normalize()`) türetilerek sıfır sapma ve tam diklik garanti altına alınmıştır.
  2. **d12 Beşgen Apex & Taban Yönlendirmesi (`topVec`):**
     - Beşgen (d12, 5 köşe) yüzeylerde üst tepe noktası (`apex`), global yukarı projeksiyonuna (`projUp`) en yakın olan köşe seçilerek `topVec` belirlenmiştir.
     - Böylece d12 üzerindeki rakamlar klasik masaüstü RPG zarlarında olduğu gibi yatay düz taban üzerinde dik durmakta ve üst köşeye doğru simetrik biçimde tam merkezde yer almaktadır.
  3. **Parite ve Güvenlik:**
     - Değişiklik `dice3d.js` ve `webapp/dice3d.js` dosyalarına uygulandı (%100 SHA-256 eşitliği sağlandı: `3C7BC4143D7E15BE33911EFE6614A9CB4141A6AA56D87B0B93E601951F21A008`).
     - Tavla zarı emojisi (`U+1F3B2`) kesinlikle kullanılmadı.

---

## 63. SEVİYE ATLAMA SİHİRBAZI: SPOTLIGHT & RULE MASTER ARAMA KONSOLU İNLİNE KART ONARIMI & DOM DENGE DÜZELTMESİ (2026-10-25)
* **İstek & Problem:**
  - Kullanıcı ekran görüntüsü (`media_1792960872089_83bb22d6.png`) ile Seviye Atlama Sihirbazı (`#level-up-modal`) içinde "Alınacak Sınıf (Class) *" alanının altında sınıf seçim ve Spotlight & Rule Master arama konsolunun boş/görünmez kaldığını bildirdi.
  - Kök neden analizi:
    1. Gizli inputlar (`#lvlup-skill-input`) sonrasında fazladan kapanan bir `</div>` etiketi, modal gövdesini (`<div class="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">`) vaktinden önce kapatıyor ve modal DOM derinliği -1'e düşüyordu.
    2. Sınıf arama konsolu modal açılışında popover dropdown yerine doğrudan görünür ve anında kullanılabilir inline bir kart (`#lvlup-class-search-card`) olarak tasarlanmıştır.
* **Uygulanan Değişiklikler:**
  1. **Inline Spotlight & Rule Master Sınıf Arama Kartı (`#lvlup-class-search-card`):**
     - Sınıf seçici, Seviye Atlama Sihirbazı gövdesine entegre, her zaman görünür, modern koyu gradyanlı bir kart olarak konumlandırıldı.
     - Üst başlık: `Alınacak Sınıf (Class) *`, RAW rozeti, sınıf sayaç rozeti (`#lvlup-class-count-badge`) ve `Özel Sınıf Ekle` butonu.
     - Arama çubuğu (`#lvlup-class-search-input`) ve filtreleme sekmeleri (`class-filter-tab-*`: Tümü, Temel, Prestij, Özel).
     - AI arama / tarama durum kutusu (`#lvlup-class-ai-status`).
     - Dinamik arama ve sınıf listesi sonuçları (`#lvlup-class-search-results`).
     - Altta seçilen sınıfın istatistik ve özellik önizleme kartı (`#lvlup-class-preview-card`).
     - Arka planda kural motoru ve kayıt geriye dönük uyumluluğu için gizli `<select id="lvlup-class-select">` ve gizli inputlar korundu.
  2. **DOM Tag Denge Onarımı (HTML Div Balance):**
     - `#lvlup-skill-input` sonundaki fazladan `</div>` kaldırıldı.
     - `#level-up-modal` içerisindeki tüm `<div>` hiyerarşisi doğrulanarak modal sonundaki derinliğin tam olarak 0 olması sağlandı.
  3. **Açılış ve Seçim Entegrasyonu (JS):**
     - `initLevelUpClassSearch()` fonksiyonunun modal açılışında `filterLevelUpClassSearch()` çağırarak tüm sınıfları anında listelemesi sağlandı.
     - `selectClassFromSearch(className)` fonksiyonu arama sonuçlarını anında yenileyecek, sınıfı seçecek ve önizleme kartını vurgulayacak şekilde sadeleştirildi.
  4. **Parite ve Kural Uyumu:**
     - 4 dosyada (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) %100 birebir SHA-256 paritesi korundu.
     - Proje genelinde hiçbir standart tavla zarı emojisi (`U+1F3B2` / `U+1F3B2`) kullanılmadı.


---

## 64. 3D D10 (ONYÜZLÜ) ZAR ORANTI VE TABAN MANIFOLD ONARIMI (2026-10-25)
* **İstek:**
  - 3D zar motorunda (`dice3d.js`) d10 zarının diğer zarlardan çok daha büyük olması ve alt kısmının düzgün çıkmaması (taban köşesinin zemine batarak kesilmesi, dikiş hattında ekstra dikey çizgi çıkması) sorunlarının giderilmesi.
* **Kök Neden Analizi (Root Cause Analysis):**
  1. **Aşırı Boyut:** Eski d10 geometrisinde $H = 1.55 \times 1.5 = 2.325$ (toplam yükseklik 4.65) ve $R = 1.30 \times 1.5 = 1.95$ (toplam genişlik 3.90) kullanılıyordu. Bu ölçüler d20 (3.30) ve d12'den (3.10) yaklaşık %45-50 daha büyüktü.
  2. **Yönelim (Winding) ve Dikiş Çizgisi:** Alt uçurtma yüzeylerinin üçgenleri saat yönünde (CW) ters sarılmıştı; `EdgesGeometry(geo, 12)` bu terslik sebebiyle iç köşegeni kat yeri sanarak alt köşeye doğru fazladan dikey bir altın çizgi çekiyordu.
  3. **Zemin Kesilmesi (Floor Clipping):** Zar eğik açıyla durduğunda en alt köşe $y = 0$ zemin seviyesinin altına (-0.40 birim) iniyor ve gölge alıcı düzlem tarafından alt yüzeyleri yatay bir çizgiyle kesiliyordu.
* **Uygulanan Değişiklikler:**
  1. **Doğal ve Dengeli Boyutlandırma (`createD10Geometry`):**
     - d10 yarıçapı $1.40$, $H = \text{radius} \times 1.15 \approx 1.61$ ve $R = \text{radius} \times 0.98 \approx 1.37$ olarak yeniden oranlandı.
     - Toplam yükseklik $3.22$ ve genişlik $2.74$ seviyesine çekilerek d12 (3.10) ve d20 (3.30) ile %100 kusursuz görsel uyum sağlandı.
  2. **Kapalı 2-Manifold ve Düzgün CCW Yönelim:**
     - Üst ve alt uçurtma yüzeylerinin tüm üçgenleri dışarıdan bakıldığında saat yönünün tersine (CCW) yönlendirildi.
     - İç köşegen dikiş çizgisi tamamen kalktı; yalnızca dış 20 kenar altın çerçeve olarak çizildi.
  3. **Dinamik Zemin Temas Yüksekliği (`computeFloorY`):**
     - Zarların duruş açısına (`targetQuat`) göre en alt köşe noktasının konumu dinamik olarak hesaplandı (`computeFloorY`).
     - Zar merkezi zemin seviyesinin tam üzerine oturtularak zemin kesilmesi, siyah tırtıklı gölge izleri ve alt köşe kayıpları bütünüyle önlendi.
  4. **Parite ve Güvenlik:**
     - `dice3d.js` ve `webapp/dice3d.js` dosyalarında %100 SHA-256 eşitliği sağlandı (`1F283029CDF86E641157C1D5CD02C57A1C21F88CCAAF50D30C4D54DC220C148D`).
     - Tavla zarı emojisi (`U+1F3B2`) kesinlikle kullanılmadı.

---

## 64. TAB-CORE DÜZENİ YENİDEN SIRALAMA VE ÇEKMECE VARSAYILAN KAPALI AYARI (2026-10-25)
* **İstek:**
  - Ana Karakter Künyesi sekmesindeki (`#tab-core`) bileşenlerin kullanıcının belirlediği ergonomik akışa göre sıralanması:
    1. Sırada: Karakter Künyesi Kartı (`#core-profile-...`)
    2. Sırada: Çekmece kapalı şekilde Hünerler ve Özel Yetenekler Vitrini (`#core-feats-abilities-container`)
    3. Sırada: Seviye Gelişimi ve İlerleme Tablosu (`#level-progression-block`)
    4. Sırada: Beceriler Tablosu ve 3D Zar Atıcı (`#skills-tbody`)
* **Uygulanan Değişiklikler:**
  1. **Bileşen Sıralaması (DOM Order):**
     - `#tab-core` içindeki 4 ana kart hiyerarşik olarak 1) Profil Künyesi, 2) Hünerler & Özel Yetenekler Çekmecesi, 3) Seviye İlerleme Tablosu, 4) Beceriler Tablosu sırasına dizildi.
     - Tüm `<div>` kapanışları ve hiyerarşisi doğrulanarak tag derinliği sıfır (0) hata ile korundu.
  2. **Çekmece Kapalı Başlatma (Accordion Closed Default):**
     - `_coreFeatsAccordionOpen` değişkeni varsayılan olarak `false` yapıldı.
     - `renderCoreFeatsAndSpecialAbilities()` fonksiyonunda çekmecenin ilk açılışta kapalı (`hidden` ve `▼` ikonu) olması, tıklandığında sorunsuz açılıp kapanması sağlandı.
  3. **Parite ve Kural Standartları:**
     - 4 hedef dosya (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı.
     - Standart tavla zarı emojisi yasağı (`U+1F3B2` / `U+1F3B2`) tavizsiz korundu.


---

## 65. HUB HIZLI NOT DEFTERİ: BAŞLIK, GÖVDE VE TYPEAHEAD ENTEGRASYONU (2026-10-26)
* **İstek:**
  - Kampanya Hub'ı sağ panelindeki hızlı not defteri (`#hub-notes-write-view`) alanına da modalda uygulanan modern Notion/Apple Notes tarzı Başlık + Gövde ayrımı ve `#` typeahead otomatik etiket popover'ının entegre edilmesi.
* **Uygulanan Değişiklikler:**
  1. **Bitişik Başlık & Gövde Kartı (`hub.html`):**
     - Tek textarea yerine `#hub-quick-note-title` (Başlık) ve `#hub-quick-note-input` (Gövde) barındıran, `focus-within:border-indigo-400` çerçeve aydınlatmalı modern doküman kartı oluşturuldu.
     - Başlıkta Enter'a basıldığında gövde alanına odaklanma (`handleQuickTitleKeydown`) sağlandı.
  2. **Akıllı `#` Etiket Tamamlama (Typeahead Popover):**
     - Hem başlık hem gövde alanlarında `#` yazıldığında klavye destekli etiket popover'ı açılmakta ve seçilen etiketi doğrudan imlecin olduğu alana yerleştirmektedir.
  3. **Hızlı Not Kaydı (`addQuickNote`):**
     - Başlık ve gövdeyi bağımsız okuyup `title` ve `text` olarak kaydeden, etiketleri her iki alandan birden toplayan ve kayıttan sonra her iki alanı da temizleyen motor mantığı kuruldu.
  4. **Parite ve Güvenlik:**
     - `hub.html` ve `hub_notes.js` kök dosyaları `webapp/` altındaki kopyalarıyla %100 SHA-256 eşitliğinde güncellendi.
     - Tavla zarı emojisi (`U+1F3B2`) kesinlikle kullanılmadı.

---

## 65. SEVİYE ATLAMA SİHİRBAZI: SINIF LİSTESİ ÖNCELİKLİ SIRALAMA & KATEGORİ BAŞLIKLARI (2026-10-26)
* **İstek:**
  - Seviye Atlama Sihirbazı sınıf arama sonuçlarında (`#lvlup-class-search-results`):
    1. Önce Temel Sınıflar (Base Classes),
    2. Sonra Alınabilecek (şartları/önkoşulları eksiksiz sağlanan) Prestij Sınıfları,
    3. Sonra Diğerleri (şartları henüz eksik olan prestij sınıfları) gösterilsin.
* **Uygulanan Değişiklikler:**
  1. **Öncelik Tabanlı Sıralama Algoritması (`filterLevelUpClassSearch`):**
     - Sınıflar taranırken önkoşul kontrolünden geçirilerek 3 öncelik seviyesine (Priority 1, 2, 3) ayrıldı:
       - `Priority 1`: Temel Sınıflar (`!isPrestige`).
       - `Priority 2`: Alınabilir Prestij Sınıfları (`isPrestige && prereqResult.allMet`).
       - `Priority 3`: Şartları henüz eksik olan Prestij Sınıfları (`isPrestige && !prereqResult.allMet`).
     - Sıralama önce `priority` derecesine göre yapıldı; aynı öncelik grubu içinde seçili sınıf en üstte tutularak alfabetik sıralandı.
  2. **Dinamik Kategori Bölücü Başlıkları (Sticky Category Dividers):**
     - Sonuç listesinde her kategorinin başına yapışkan (sticky backdrop-blur) başlık şeridi eklendi:
       - `🛡️ Temel Sınıflar (Base Classes)`
       - `👑 Alınabilir Prestij Sınıfları (Önkoşulları Sağlanan)`
       - `🔒 Diğer Prestij Sınıfları (Önkoşulları Henüz Eksik)`
     - Her başlıkta o kategoride bulunan sınıf adedi rozetle gösterildi.
  3. **Parite ve Kural Standartları:**
     - 4 dosya (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi korundu.
     - Standart tavla zarı emojisi yasağı (`U+1F3B2` / `U+1F3B2`) tavizsiz korundu.


---

## 66. SEVİYE ATLAMA SİHİRBAZI: SINIF KART SEÇİM ERGONOMİSİ VE BUTON SADELEŞTİRMESİ (2026-10-26)
* **İstek:**
  - Sınıf arama kartlarındaki `[➕ Bu Sınıftan Seviye Ekle]` ve seçili sınıfta çıkan `[➕ Seviyeyi Yenile]` butonlarının kafa karışıklığı yaratması ve yapay bir "iki aşamalı seçim" hissi doğurması üzerine UX/UI revizyonu yapılması:
    1. Buton metninin eylemi net belirten `[🎯 Sınıfı Seç]` olarak değiştirilmesi.
    2. Seçili sınıfta redundant `[Seviyeyi Yenile]` butonunun kaldırılıp yerine sade ve statik bir `✓ Seçili Sınıf` durum rozetinin gösterilmesi.
    3. Tıklama alanı ergonomisi: Yalnızca butona değil, tüm sınıf kartının herhangi bir yerine tıklandığında da sınıfın akıcı şekilde seçilebilmesi.
* **Uygulanan Değişiklikler:**
  1. **Kart Geneli Tıklanabilirlik (`filterLevelUpClassSearch`):**
     - Sınıf kartı konteynerine `onclick="selectClassFromSearch('${safeName}')"`, `cursor-pointer`, `group` ve aktif durumda `bg-emerald-950/20` eklendi.
     - Kart üzerine gelindiğinde sınıf adı `group-hover:text-emerald-300 transition` ile vurgulanır hale getirildi.
  2. **Olay Yayılımı Korunumu (`stopPropagation`):**
     - Sağ taraftaki aksiyon paneline (`onclick="event.stopPropagation()"`) ve açılan Seviye Gelişim Tablosu konteynerine stopPropagation eklenerek tablo inceleme veya metin kopyalama sırasında istenmeyen kart tıklamalarının önüne geçildi.
  3. **Buton ve Rozet Sadeleştirmesi:**
     - Seçili olmayan sınıflarda: `[🎯 Sınıfı Seç]` butonu.
     - Seçili olan sınıfta: Kafa karıştırıcı `[Seviyeyi Yenile]` butonu tamamen kaldırıldı; yerine şık bir `✓ Seçili Sınıf` rozeti yerleştirildi.
  4. **Enter Tuşu ile Arama Uyumluluğu (`onClassSearchEnterKey`):**
     - Selector `button[onclick*="selectClassFromSearch"] || [onclick*="selectClassFromSearch"]` olarak genişletilerek klavye ile Enter'a basıldığında da ilk sonucun seçilmesi korundu.
  5. **Parite ve Kural Standartları:**
     - 4 dosya (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi korundu.
     - Standart tavla zarı emojisi yasağı (`U+1F3B2` / `U+1F3B2`) tavizsiz korundu.


---

## 67. MASA KURALLARI: CL MODU RAW SEÇİMİNDE CASTER TİPİ KİLİTLEME / PASİFLEŞTİRME (2026-10-26)
* **İstek:**
  - D&D 3.5e RAW kuralında `Class Level (Yalnızca Sınıf Seviyesi)` seçildiğinde, çoklu sınıflarda yalnızca o sınıfın kendi seviyesi kadar büyü yapılabileceğinin teyit edilmesi ve bu durumda alttaki `Caster Tipi (Disiplin)` seçiminin pasifleştirilmesi (Öneri 1).
* **Uygulanan Değişiklikler:**
  1. **UI Dinamik Kilit Fonksiyonu (`updateCasterTypeUIState`):**
     - `setting-cl-mode` seçimi `Class Level` veya `Custom` olduğunda (yani DM Boon kapalıyken):
       - `setting-caster-type` dropdown'ı `disabled = true` yapıldı.
       - Görsel olarak `opacity-50`, `cursor-not-allowed`, `bg-slate-900/60` sınıfları ve kart kapsayıcısına `opacity-60` eklendi.
       - Sağ üst rozet `Disiplin` yerine yeşil vurgulu `RAW: Sınıftan Otomatik` (`#setting-caster-type-hint`) durumuna geçirildi.
     - `Character Level (DM Boon)` veya `Warlock Boon` seçildiğinde:
       - Dropdown yeniden aktif (`disabled = false`) hale getirildi ve rozet eski haline döndürüldü.
  2. **Tetikleme Noktaları ve Senkronizasyon:**
     - `onSettingClModeChange()`, `onSettingCasterTypeChange()`, `updateSettingsUiFromCharacter()` ve `renderLevelProgression()` fonksiyonlarına entegre edildi.
     - Karakter kağıdı dosyaları ile birlikte HUB (`hub.html`, `webapp/hub.html`) masa kuralları modülüne de simetrik olarak eklendi.
  3. **Parite ve Kural Standartları:**
     - 4 karakter kağıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 paritesi korundu.
     - 2 HUB dosyası (`hub.html`, `webapp/hub.html`) arasında %100 SHA-256 paritesi korundu.
     - Sıfır tavla zarı emojisi (`U+1F3B2` / `U+1F3B2`) kuralı tavizsiz uygulandı.


---

## 68. SEVİYE ATLAMA SİHİRBAZI: BÜYÜCÜ İLERLEMESİ KARTININ BAĞLAMSAL GİZLENMESİ & HARDCODED DEĞERLERİN TEMİZLENMESİ (2026-10-26)
* **İstek:**
  - Seviye 1 bir karakterde (özellikle dövüşçü veya büyü yapmayan sınıflarda) Seviye Atlama Sihirbazı'nda "5. Büyücü İlerlemesi" kartının çıkması, rozette ve inputta "Sorcerer CL: 5" yazması sorununun giderilmesi.
  - CL kuralı `Class Level` (RAW) seçildiğinde ve temel sınıflar (Fighter, Rogue veya doğrudan Sorcerer vb.) alınırken bu kartın ekranda kafa karıştırmaması için dinamik olarak gizlenmesi.
* **Uygulanan Değişiklikler:**
  1. **Hardcoded Fallback "5" Temizliği:**
     - HTML şablonundaki `Sorcerer CL: 5` ve `value="5"` statik değerleri kaldırıldı (`CL: 0`, `value="0"` yapıldı).
     - JS'deki `|| 5` fallback'leri (`onLevelUpCasterProgChange`, `openLevelUpModal`, `undoLastLevel`) kaldırılarak `Number(character.spellcasting?.cl) || 0` ile dinamik hale getirildi.
  2. **Bağlamsal Görünürlük Fonksiyonu (`updateLevelUpCasterProgVisibility`):**
     - Sınıf seçildiğinde (`onLevelUpClassChange` ve `openLevelUpModal`) kartın görünürlüğü kontrol edilir:
       - **Gizli (`hidden`):** Büyü yapmayan temel sınıflar (Fighter, Barbarian, Rogue, Monk) VE Class Level (RAW) modunda alınan temel büyücüler (Sorcerer, Wizard, Cleric - çünkü motor seviye kaydedildiğinde CL ve slotları RAW gereği otomatik artırır).
       - **Görünür:** Yalnızca büyü ilerlemesi içeren bir **Prestij Sınıfı** (Eldritch Knight, Arcane Trickster vb.) seçildiğinde ve karakterin mevcut büyücülüğü varsa; VEYA ayarlarda **DM Boon / Multiclass CL** aktifken.
  3. **Parite ve Kural Standartları:**
     - 4 dosya (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi korundu.
     - Sıfır tavla zarı emojisi (`U+1F3B2` / `U+1F3B2`) kuralı tavizsiz korundu.



---

## 69. SEVİYE ATLAMA SİHİRBAZI: BİRLEŞİK SPOTLIGHT & RULE MASTER AI FEAT ARAMA KONSOLU VE RAW ÖNKOŞUL DOĞRULAYICI (2026-10-26)
* **İstek:**
  - Seviye Atlama Sihirbazı Bölüm 4'teki (🎖️ 4. FEAT, DM LÜTFU & KUSUR SEÇİMİ) ayrı "Kütüphaneden Seç" modal butonu ve "Katalogdan Hızlı Seçim" dropdown'ını birleştirerek her yuvaya entegre Spotlight & Rule Master AI arama konsolu haline getirmek.
  - Feat listesini karakterin aday seviye istatistiklerine (BAB, Seçilen +1 Stat artışı, mevcut ve o tur seçilmiş featler, caster level, beceri kademeleri) göre akıllı önkoşul motorundan (`checkFeatPrerequisites`) geçirip, önkoşulları karşılayanları (✅ Alınabilir) en başta listelemek; karşılanmayan gereksinimler için anlık uyarı rozetleri (⚠️ Önkoşul Uyarısı) üretmek.
  - Yerel veritabanında bulunmayan featler için doğrudan slot içinden tek tıkla ⚡ Rule Master AI ile Getir (Gemini 3.5e RAW kural motoru) entegrasyonu sağlamak.
* **Uygulanan Değişiklikler:**
  1. **RAW Feat Önkoşul Doğrulama Motoru (`checkFeatPrerequisites(feat, slotIdx)`):**
     - D&D 3.5e RAW kural yapısına göre aday seviye BAB (+1 BAB kazanımı dahil), aday Stat artışı (+1 stat seçimi dahil), mevcut bilinen featler (özel yetenekler ve o tur önceki yuvalara seçilen featler dahil), beceri kademeleri (ranks), caster level ve silah ustalığı (proficiency) dinamik olarak doğrulanır.
     - Çıktı: `{ hasPrereqs, allMet, checks: [{ type, label, met, info }], rawPrereq }`.
  2. **Yuva İçi Entegre Spotlight & AI Arama Konsolu:**
     - Eski modal açan buton ve statik dropdown kaldırılarak yerine doğrudan arama çubuğu ve açılır/kapanır `lvlup-feat-search-console-` entegre edildi.
     - Canlı filtre hapları ([📋 Tümü], [✅ Alınabilir], [⚔️ Savaşçı], [🌟 DM Boon], [⚠️ Kusur]) ve anlık arama desteği sağlandı.
     - Önkoşulu sağlayan featler yeşil rozetle (✅ Alınabilir) en üstte, sağlamayanlar ise uyarı rozetiyle (⚠️ Önkoşul Eksik) alt sırada listelenir.
  3. **Anlık Önkoşul Analiz ve Teşhis Barı:**
     - Yuvada bir feat seçildiğinde altına önkoşul analiz barı (`lvlup-feat-prereq-badge-`) eklenir:
       - Tüm şartlar tamamsa: Yeşil ✅ Önkoşullar Karşılanıyor: [BAB +1 ✓ (Mevcut: +1 ≥ +1), Str 13 ✓ (Mevcut: 16 ≥ 13)].
       - Şartlar eksikse: Kırmızı/Amber ⚠️ Önkoşul Uyarısı: [BAB +4 ✗ (Mevcut: +1, Gereken: +4), Dodge ✗ (Feat Eksik)].
       - Önkoşul yoksa: Nötr ℹ️ Önkoşulsuz: Herhangi bir gereksinim aranmaz, serbestçe alınabilir.
  4. **Rule Master AI ile Anında Getirme (`triggerRuleMasterForLevelUpSlot`):**
     - Yerel katalogda bulunmayan veya özel 3.5e kural kitaplarından istenen featler için doğrudan konsol altından ⚡ Rule Master AI ile Getir butonu tıklandığında Gemini AI API'si tetiklenir.
     - Dönen kural nesnesi hem `masterDb`'ye resmi ve kalıcı olarak kaydedilir hem de yuvaya atanır.
  5. **Veri Kontratı ve Geriye Dönük Uyumluluk Teyidi:**
     - `character_data.json` veya HUB tarafındaki veri şemasında geriye dönük uyumsuzluk yaratacak hiçbir alan adı değiştirilmemiştir (`slot.name`, `slot.category`, `slot.benefit`).
  6. **Parite ve Kural Standartları:**
     - 4 karakter kağıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı.
     - Standart tavla zarı emojisi yasağı (`U+1F3B2`) tavizsiz korundu.



---

## 70. SEVİYE ATLAMA SİHİRBAZI: ESKİ GÖMÜLÜ KAMPANYA DM BOON VE FLAW DİZİLERİNİN TEMİZLENMESİ (SAF RAW TEMİZLİĞİ) (2026-10-26)
* **İstek & Problem:**
  - Veritabanı (`master_db.json`) tamamen sıfırlanmasına rağmen yeni bir karakter seviye atlatılırken Seviye 1 Feat yuvasında *Ability Boost (+1 Dex, +1 Cha)*, *Ability Boost (+1 Str, +1 Cha)* gibi 20 adet eski kampanya DM lütfu ve 5 adet Flaw en başta çıkmaktaydı.
  - Bu öğelerin kaynağı `masterDb` değil; `character.html` / `index.html` içinde statik olarak bulunan `DND35_DM_BOONS_CATALOG` ve `DND35_FLAWS_CATALOG` dizileriydi.
  - Bu durum Kural 5 (No Dummy Data) ve saf D&D 3.5e RAW seviye atlama deneyimi ile çelişmekteydi.
* **Uygulanan Değişiklikler:**
  1. **Statik Katalogların Sıfırlanması:**
     - `DND35_DM_BOONS_CATALOG = [];` olarak boş diziye dönüştürüldü.
     - `DND35_FLAWS_CATALOG = [];` olarak boş diziye dönüştürüldü.
  2. **Dinamik Veri Akışı ve Sıfır Hata Doğrulaması:**
     - `getCombinedFeatCatalog()`, `showFeatDetail()` ve Seviye Atlama Sihirbazı `renderLevelUpFeatSearchResults()` fonksiyonlarının diziler boşken sıfır hatayla çalıştığı teyit edildi.
     - DM Boon ve Flaw kategorileri artık tamamen dinamiktir; yalnızca DM veya oyuncu tarafından `masterDb`'ye resmi bir kayıt eklendiğinde katalogda listelenir.
  3. **Parite ve Kural Standartları:**
     - 4 karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi korundu.
     - Standart tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz uygulandı.

---

## 71. D&D 3.5e RAW SRD CORE KATALOĞU (GHOST CORE) GÜNCELLEMESİ & SEVİYE ATLAMA ENTEGRASYONU (2026-10-26)
* **İstek & Yapılan Çekirdek Güncelleme:**
  - `srd_core_catalog.json` ve `bundled_data.js` üzerinde 134 öğelik bağımsız denetim raporundaki tüm bulgular (%100 RAW) uygulanmıştır. Katalog toplam 161 resmi D&D 3.5e RAW öğesine ulaşmıştır.
  - **Uygulanan Düzeltmeler:**
    1. **Whip:** Hasar zarı `1d3` olarak düzeltildi (Medium RAW). `reach: true`, 15 ft menzil, bitişik vurabilme, tehdit etmeme ve zırh kısıtı notları eklendi.
    2. **Buckler:** Shield bash yapılamayacağı için (`PHB s.125`) `dice: null` yapıldı.
    3. **Blowgun:** Kaynak `DMG p.145 / Exotic Ranged` olarak düzeltildi.
    4. **Throwing Axe:** Eksik olan Martial Light silahı (`8 gp, 1d6, ×2, 10 ft, 2 lb, Slashing, finessable`) eklendi.
    5. **Shield Spikes:** Light (`1d4`) ve Heavy (`1d6`) olarak iki ayrı öğeye ayrıldı (`PHB s.125`).
    6. **Flail:** 3.0 ismi olan "Light Flail" yerine 3.5e RAW ismi olan "Flail" yapıldı.
    7. **Light Silahlar Finessable:** `Gauntlet`, `Unarmed Strike`, `Spiked Gauntlet` ve `Armor Spikes` öğelerine `finessable: true` eklendi; `Spiked Gauntlet`'tan hatalı `unarmed` etiketi kaldırıldı (armed attack).
    8. **Dwarven Urgrosh:** `brace` yeteneği axe ana gövdesinden ikincil mızrak ucuna (`↳ Dwarven Urgrosh (Spear Off-Hand)`) taşındı.
    9. **Net:** Maksimum menzil `10 ft` olarak sınırlandırıldı.
    10. **Tower Shield:** `-2` atak cezası ve Total Cover standart aksiyon mekaniği `combatModifiers` içine işlendi.
    11. **Feat Metinleri:** `Far Shot` (menzil kademesi 1.5x / 2x uzar, ceza yarıya inmez), `Power Attack` (light silahlara bonus hasar vermez kısıtı), `Manyshot` (BAB +11 ve +16 eşikleri), `Spring Attack` ve `Shot on the Run` (Standard attack action + move), `Mounted Combat` (1/round reaksiyon) RAW standartlarına kavuşturuldu.
    12. **18 Yeni PHB Feat'i:** `Improved Unarmed Strike`, `Deflect Arrows`, `Snatch Arrows`, `Stunning Fist`, `Whirlwind Attack`, `Improved Shield Bash`, `Rapid Reload`, `Improved Precise Shot`, `Mounted Archery`, `Trample`, `Simple Weapon Proficiency`, `Martial Weapon Proficiency`, `Exotic Weapon Proficiency`, `Armor Proficiency (Light/Medium/Heavy)`, `Shield Proficiency`, `Tower Shield Proficiency` çekirdek Ghost Core kataloğuna eklendi.
* **Karakter Kâğıdı Oturumunda Tamamlanan Uygulamalar:**
  1. **DM Boon & Flaw Temizliği (Madde 70 / Saf RAW):**
     - `DND35_DM_BOONS_CATALOG = [];`
     - `DND35_FLAWS_CATALOG = [];`
     - Eski ev yapımı hardcoded veriler sıfırlandı; DM Boon ve Flaw listeleri tamamen dinamik hale getirildi.
  2. **Ghost Core Feat Entegrasyonu (`getCombinedFeatCatalog` & `showFeatDetail`):**
     - `getCombinedFeatCatalog()` içine `window.BUNDLED_SRD_CORE_CATALOG` (161 öğelik çekirdek Ghost Core) entegrasyonu sağlandı.
     - 55 resmi RAW Feat (özellikle Improved Unarmed Strike, Deflect Arrows, Stunning Fist, Whirlwind Attack ve Silah/Zırh Ustalıkları) seviye atlama konsolunda listelenir ve seçilebilir hale geldi.
  3. **Kokpit Spotlight Doğrulaması:**
     - Savaş kokpiti Spotlight aramasında `Throwing Axe`, `Shield Spikes (Light/Heavy)` ve `Flail` öğelerinin sorunsuz çalıştığı doğrulandı.
  4. **Parite ve Kural Standartları:**
     - 4 karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı.
     - Standart tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.

---

## 72. SEVİYE ATLAMA SİHİRBAZI: RAW ÖNKOŞUL & KONSOL MOTORUNDA PARAMETRİK DİNAMİKLEŞTİRME (2026-10-26)
* **İstek & Problem:**
  - `checkFeatPrerequisites` ve `renderLevelUpFeatSearchResults` fonksiyonlarında yer alan hardcoded sınıf isimleri (`['sorcerer', 'wizard'...]`), savaşçı sınıfları (`['fighter', 'barbarian'...]`) ve string tabanlı filtreleme mantıklarının incelenmesi ve veritabanı şemasını değiştirmeden tamamen parametrik hale getirilmesi.
* **Uygulanan Değişiklikler:**
  1. **Parametrik Büyücü (Caster) Tespiti:**
     - 8 elemanlı hardcoded sınıf string dizisi kaldırıldı.
     - Aday sınıfın `def.role` (örn: Arcane/Divine Caster), `def.spellProgression`, `def.description` alanları ve karakterin mevcut büyücülük durumu (`curCl > 0` veya `character.spellcasting.slots`) taranarak büyücülük kabiliyeti dinamik olarak tespit edildi.
  2. **Parametrik Silah/Zırh Ustalığı (Proficiency) Doğrulaması:**
     - Sabit dövüşçü sınıf listesi yerine D&D 3.5e RAW kuralı (`def.bab === 1.0` Full BAB sınıfları otomatik martial weapon proficiency verir) ve `knownFeats` içindeki ustalık featleri dinamik olarak kontrol edildi.
  3. **Parametrik Savaşçı Feat & Kategori Bayrakları:**
     - Savaşçı bonus feat filtreleri `isFighterBonusFeat === true` (tüm 55 resmi çekirdek featte tanımlı boolean bayrak) üzerinden doğrulanır hale getirildi.
     - Kusur (Flaw) ve DM Lütfu (Boon) filtreleri nesne `type` ve `category` bayraklarına bağlandı.
  4. **Parametrik Stat Anahtarları:**
     - Yetenek puanları `STAT_KEYS` global mimarisi ile dinamikleştirildi.
  5. **Veritabanı (DB) Güvenliği:**
     - `master_db.json` veya `character_data.json` üzerinde hiçbir şema değişikliği yapılmadı; mevcut yapılarla %100 geriye dönük uyumlu refactor tamamlandı.
  6. **Parite ve Kural Standartları:**
     - 4 karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı.
     - Standart tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.

---

## 73. SEVİYE GELİŞİM TABLOSU (LEVEL PROGRESSION): SPOTLIGHT & RULE MASTER AI FEAT ARAMA KONSOLU ENTEGRASYONU (2026-10-26)
* **İstek & Problem:**
  - Seviye Gelişim ve İlerleme Tablosu üzerindeki butonlardan (`[⚔️ + Bonus Feat Seç]`, `[🎖️ + Feat Seç]`, `[🧬 + Irk Feati Seç]` ve satır içi `➕` Feat ekleme) açılan Hızlı Feat Ekleme Modalı (`#quick-level-feat-modal`), eski statik dropdown ve ilkel manuel form düzenindeydi.
  - Seviye Atlama Sihirbazı'nda (Level Up Wizard) devreye alınan modern Spotlight arama, dinamik kategori filtre hapları (`[📋 Tümü]`, `[✅ Alınabilir]`, `[⚔️ Savaşçı]`, `[🌟 DM Boon]`, `[⚠️ Kusur]`, `[🔮 Invocation]`), RAW önkoşul analiz motoru (`checkFeatPrerequisites`) ve satır seviyesine özel Rule Master AI arama konsolu deneyiminin bu tabloya da kazandırılması talep edildi.
* **Uygulanan Değişiklikler:**
  1. **Seviye Tablosuna Özel RAW Önkoşul Motoru (`targetLevelIdx` Desteği):**
     - `checkFeatPrerequisites(feat, slotIdx = 0, targetLevelIdx = null)` fonksiyonuna satır bazlı seviye parametresi eklendi.
     - `targetLevelIdx !== null` olduğunda, önkoşullar o satırın seviyesine kadar olan ilerleme durumu (`prog.slice(0, targetLevelIdx + 1)`), o seviyedeki BAB artışı, stat puanı dağılımları ve o satıra kadar öğrenilmiş olan featler dikkate alınarak RAW kural doğrulaması yapılır.
  2. **Modern Spotlight & AI Feat Arama Konsolu Modalı:**
     - Eski `#quick-level-feat-modal` arayüzü modernize edildi; üst başlık, `[🗑️ Temizle]` butonu, kategori seçimi (`#quick-feat-category`), büyüteçli Spotlight arama çubuğu (`#quick-feat-name`), `[📜 Katalog ▼/▲]` açılır/kapanır konsol paneli ve dinamik önkoşul uyarı rozeti (`#quick-feat-prereq-badge`) entegre edildi.
     - Konsol içinde filtre hapları (`[📋 Tümü]`, `[✅ Alınabilir]`, `[⚔️ Savaşçı]`, `[🌟 DM Boon]`, `[⚠️ Kusur]`, `[🔮 Invocation]`) canlı sayaçlarla yerleştirildi.
     - Aday feat kartlarında RAW uygunluk rozetleri (`✅ Alınabilir` / `⚠️ Önkoşul Eksik`), önkoşul kırılım hapları (`Str 13 ✓`, `BAB +1 ✗`), kategori/kaynak etiketleri ve `[🎯 Seç]` / `[🎯 Yine de Seç]` butonları konumlandırıldı.
     - Alt kısımda doğrudan ilgili sorgu için `[⚡ Rule Master AI ile Getir: "${query}" (3.5e Kitaplığı)]` butonu ve anlık durum göstergesi eklendi.
  3. **Tablo Butonlarıyla Akıllı Entegrasyon:**
     - `[⚔️ + Bonus Feat Seç]` tıklandığında konsol doğrudan `'FIGHTER'` filtre hapı aktif olarak açılır.
     - `[🎖️ + Feat Seç]` tıklandığında `'ALL'` filtre hapı ile açılır.
     - `[🌟 DM Boon]` veya `[⚠️ Kusur]` seçildiğinde ilgili filtre otomatik senkronize edilir.
     - Warlock seviyesi veya DM Boon'u varsa `'INVOCATION'` filtresi ve Warlock Yakarışları listelenir.
  4. **Parite ve Kural Standartları:**
     - 4 karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı (`B41008FF440CBF22CAC77CF957D7537AE7EA0A1E33A409A2FCCBE3F73385D64C`).
     - Standart tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.
---

## 74. EGZOTÄ°K SÄ°LAH VE SÄ°LAH FEATLERÄ°NÄ°N PARAMETRÄ°K HALE GETÄ°RÄ°LMESÄ° & DÄ°NAMÄ°K HEDEF SEÃ‡Ä°CÄ° ENTEGRASYONU (2026-10-26)
* **Ä°stek & Problem:**
  - DND35_FEAT_CATALOG iÃ§inde egzotik silah ve silaha Ã¶zgÃ¼ featler (Exotic Weapon Proficiency (Spiked Chain), Exotic Weapon Proficiency (Jovar), Weapon Focus (Rapier), Weapon Focus (Spiked Chain), Improved Critical (Rapier)) hardcoded olarak yer almaktaydÄ±.
  - Bu durum hem RAW kural mantÄ±ÄŸÄ±na aykÄ±rÄ±ydÄ± (D&D 3.5e RAW'da bunlar tekil silah adlarÄ±yla deÄŸil, oyuncunun seÃ§eceÄŸi silaha baÄŸlanan genel featlerdir) hem de karakterin PHB/SRD iÃ§indeki diÄŸer tÃ¼m egzotik silahlarÄ± (Bastard Sword, Dwarven Waraxe, Orc Double Axe, Dire Flail, Gnome Hooked Hammer, Bolas, Shuriken, Whip, Repeating Heavy/Light Crossbow vb.) dinamik olarak seÃ§ebilmesini kÄ±sÄ±tlÄ±yordu.
  - Hem HÄ±zlÄ± Feat SeÃ§im konsolunda (#quick-level-feat-modal) hem de Seviye Atlama SihirbazÄ±'nda (#lvlup-feat-slots-container) silaha baÄŸlÄ± feat seÃ§ildiÄŸinde silah hedefinin dinamik olarak belirlenebilmesi ve kart Ã¼zerinde hedef deÄŸiÅŸtirici dropdown sunulmasÄ± gerekiyordu.
* **Uygulanan DeÄŸiÅŸiklikler:**
  1. **RAW Genel Feat DÃ¶nÃ¼ÅŸÃ¼mÃ¼ (DND35_FEAT_CATALOG TemizliÄŸi):**
     - Hardcoded 5 adet silaha Ã¶zel kayÄ±t katalogdan Ã§Ä±karÄ±ldÄ±.
     - Yerlerine kanonik RAW genel featleri eklendi:
       - Exotic Weapon Proficiency (prereq: "BAB +1", isFighterBonusFeat: true)
       - Weapon Focus (prereq: "Proficiency, BAB +1", isFighterBonusFeat: true)
       - Improved Critical (prereq: "Proficiency, BAB +8", isFighterBonusFeat: true)
  2. **Dinamik Hedef Silah SeÃ§ici (Target Selector) - HÄ±zlÄ± Feat ModalÄ±:**
     - #quick-level-feat-modal iÃ§ine #quick-feat-target-container ve #quick-feat-target-select eklendi.
     - Feat seÃ§ildiÄŸinde veya arama yapÄ±ldÄ±ÄŸÄ±nda silah hedefi gerektiren featler tespit edilerek (Exotic Weapon Proficiency, Weapon Focus, Greater Weapon Focus, Weapon Specialization, Greater Weapon Specialization, Improved Critical) otomatik olarak hedef seÃ§ici arayÃ¼zÃ¼ aÃ§Ä±lÄ±r.
     - Exotic Weapon Proficiency iÃ§in tÃ¼m RAW egzotik silahlar (Bastard Sword, Dwarven Waraxe, Whip, Spiked Chain, Dire Flail, Two-Bladed Sword, Orc Double Axe, Gnome Hooked Hammer, Bolas, Hand Crossbow, Repeating Heavy/Light Crossbow, Shuriken, Kama, Nunchaku, Sai, Siangham, Halfling Warsxe, Dwarven Urgrosh, Orc Shotput, Net, Kusari-gama, Jovar vb.) dinamik olarak listelenir; diÄŸer featler iÃ§inse karakterin envanterindeki tÃ¼m silahlar + temel silah listesi sunulur.
     - KullanÄ±cÄ± hedef silah seÃ§tiÄŸinde feat adÄ± otomatik olarak Exotic Weapon Proficiency (Spiked Chain) veya Weapon Focus (Rapier) olarak gÃ¼ncellenir.
  3. **Seviye Atlama SihirbazÄ± (Level Up Wizard) Dinamik Entegrasyonu:**
     - Sihirbazdaki feat kartlarÄ±nda (
enderLevelUpFeatSlots) silaha baÄŸlÄ± feat seÃ§ildiÄŸinde kart Ã¼zerinde anÄ±nda bir hedef silah seÃ§ici (<select onchange="onLevelUpFeatTargetChange(...)">) gÃ¶rÃ¼ntÃ¼lenir.
     - Oyuncu silahÄ± deÄŸiÅŸtirdiÄŸinde yuva adÄ±, aÃ§Ä±klamasÄ± ve hedefi anÄ±nda gÃ¼ncellenir.
  4. **AkÄ±llÄ± Arama Aday Sentezi:**
     - Arama kutusuna silah adÄ± yazÄ±ldÄ±ÄŸÄ±nda (Ã¶rneÄŸin "spiked chain", "jovar", "rapier"), arama motoru sentetik adaylar Ã¼retir: Exotic Weapon Proficiency (Spiked Chain), Weapon Focus (Spiked Chain) vb. doÄŸrudan listede Ã¶neri olarak belirir.
  5. **showFeatDetail Geriye DÃ¶nÃ¼k Uyumluluk (Fallback) Ä°yileÅŸtirmesi:**
     - Feat detay penceresinde (showFeatDetail) parantezli silaha baÄŸlÄ± featler (Exotic Weapon Proficiency (Jovar)) arandÄ±ÄŸÄ±nda temel feat adÄ± (aseFeatName = "Exotic Weapon Proficiency") Ã§Ä±kartÄ±larak yerel katalog, master_db ve bundled SRD kataloglarÄ±ndan aÃ§Ä±klamasÄ± ve kurallarÄ± eksiksiz getirilir.
  6. **Parite ve Kural StandartlarÄ±:**
     - 4 karakter kÃ¢ÄŸÄ±dÄ± dosyasÄ± (character.html, index.html, webapp/character.html, webapp/index.html) arasÄ±nda %100 SHA-256 hash paritesi saÄŸlandÄ± (B7A6928BE933CA6729101B1EA8A19E71BEA59A7E361362BB3D94A83966B7A437).
     - Standart tavla zarÄ± emojisi (U+1F3B2) yasaÄŸÄ± tavizsiz korundu.
---

## 75. KURAL 5 (NO DUMMY DATA) & HARDCODED VERÄ°LERÄ°N TEMÄ°ZLENMESÄ° - PARÄ°TE VE DÄ°NAMÄ°K MÄ°MARÄ° REFACTOR (2026-10-26)
* **Ä°stek & Problem:**
  - Kural 5 (Dummy Data YasaÄŸÄ±) ve parametrik mimari incelemesi sonucunda, kod tabanÄ±nda kural motoru ve veritabanÄ± ÅŸemasÄ±na uymayan hardcoded/dummy kalÄ±ntÄ±lar tespit edildi:
    1. ensureAmmunitionInventory: BoÅŸ karaktere otomatik olarak +1/+2 bÃ¼yÃ¼lÃ¼ ok ve arbalet oku (800+ gp deÄŸerinde) sahte mÃ¼himmat enjekte ediyordu.
    2. populateWeaponSetsEditorDropdowns: Karakterde olmasa bile Darkwood Buckler +1, +1 Buckler, Heavy Shield ve 7 adet TÃ¼rkÃ§e yay/arbalet string'ini dropdown'a zorla ekliyordu.
    3. getAllAvailableRangedWeapons: Karakterin menzilli silahÄ± olmadÄ±ÄŸÄ±nda 6 adet fallback sahte SRD silahÄ± enjekte ediyordu.
    4. DND35_WARLOCK_INVOCATIONS: 32 adet Warlock YakarÄ±ÅŸÄ± character.html iÃ§ine gÃ¶mÃ¼lÃ¼ statik dizi olarak yaÅŸÄ±yordu (master_db.json ve undled_data.js iÃ§inde yoktu).
    5. DND35_FEAT_CATALOG: Yan kitaplardan gelen 9 feat (Shadow Blade, Adaptive Style, Arcane Strike, Practiced Spellcaster, Shock Trooper, Leap Attack, Oversized Two-Weapon Fighting, Monkey Grip, Somatic Weaponry) kod iÃ§ine gÃ¶mÃ¼lÃ¼ydÃ¼ (master_db.json iÃ§inde yoktu).
    6. DND35_SRD_WEAPONS: 60 adet basit silah string'i statik dizi olarak tutuluyordu.
* **Uygulanan DeÄŸiÅŸiklikler:**
  1. **Sahte MÃ¼himmat Enjeksiyonunun KaldÄ±rÄ±lmasÄ± (ensureAmmunitionInventory):**
     - Otomatik standardAmmos yÃ¼klemesi kaldÄ±rÄ±ldÄ±. Karakter mÃ¼himmatÄ± boÅŸ ise boÅŸ kalÄ±r; yalnÄ±zca master_db.json veya envanterden eklenen gerÃ§ek mÃ¼himmatlar tutulur.
  2. **SavaÅŸ Setleri EditÃ¶rÃ¼nÃ¼n Temizlenmesi (populateWeaponSetsEditorDropdowns):**
     - standardShields ve standardRanged dizileri silindi.
     - Silah ve kalkan listesi tamamen karakterin gerÃ§ek envanterinden (character.inventory, character.gearPool, character.bodySlots) dinamik olarak beslenir.
     - YakÄ±n dÃ¶vÃ¼ÅŸ iÃ§in kanonik RAW kuralÄ± uyarÄ±nca Unarmed Strike (SilahsÄ±z SaldÄ±rÄ±) gÃ¼venli fallback olarak korundu.
  3. **Menzilli Silah Fallback'inin Temizlenmesi (getAllAvailableRangedWeapons):**
     - SilahsÄ±z karaktere 6 adet sahte yay/arbalet enjekte eden srdRanged fallback kaldÄ±rÄ±ldÄ±.
  4. **Ek Kitap Featlerinin ve Warlock YakarÄ±ÅŸlarÄ±nÄ±n VeritabanÄ±na TaÅŸÄ±nmasÄ±:**
     - 9 adet Complete Series & Tome of Battle feati ile 32 adet Warlock YakarÄ±ÅŸÄ± resmi ÅŸemaya uygun olarak undled_data.js (window.BUNDLED_SRD_CORE_CATALOG) ve master_db.json iÃ§ine eklendi (toplam katalog 161'den 202'ye Ã§Ä±karÄ±ldÄ±).
     - character.html iÃ§indeki gÃ¶mÃ¼lÃ¼ DND35_FEAT_CATALOG ve DND35_WARLOCK_INVOCATIONS dizileri boÅŸaltÄ±ldÄ± ([]).
     - YakarÄ±ÅŸlarÄ±n sÄ±nÄ±f seviyesi (Warlock) veya DM Boon alÄ±ndÄ±ÄŸÄ±nda filtrelenip dinamik seÃ§ilebilmesi iÃ§in getAllWarlockInvocations() mimarisi devreye alÄ±ndÄ±.
  5. **Dinamik Silah Arama Fonksiyonu (getSrdWeaponNames):**
     - Statik DND35_SRD_WEAPONS dizisi kaldÄ±rÄ±larak yerine window.BUNDLED_SRD_CORE_CATALOG ve masterDb iÃ§indeki 81 silahÄ± dinamik tarayan getSrdWeaponNames() fonksiyonu entegre edildi.
  6. **Parite ve Kural StandartlarÄ±:**
     - 4 karakter kÃ¢ÄŸÄ±dÄ± dosyasÄ± (character.html, index.html, webapp/character.html, webapp/index.html) arasÄ±nda %100 SHA-256 hash paritesi saÄŸlandÄ± (2A393ACD2723BF24E2402D2E368159BB307B863C7CF16F7831256C8F475A87FD).
     - undled_data.js ve webapp/bundled_data.js arasÄ±nda %100 SHA-256 hash paritesi saÄŸlandÄ± (16A03D0DA4274BE08E7C44D74FBA56D464A7629A108C71D7DB9AC67079B9DA50).
     - master_db.json ve webapp/master_db.json arasÄ±nda %100 SHA-256 hash paritesi saÄŸlandÄ± (E308B37D8A50923F9F438C88B8132CDB941468A97019BDCAC7C8A3192D25AFF9).
     - Standart tavla zarÄ± emojisi (U+1F3B2) yasaÄŸÄ± tavizsiz korundu.
---

## 76. TOME OF BATTLE & WARLOCK Ã–ZEL FEATLERÄ°NÄ°N KATALOÄA ENTEGRASYONU (2026-10-26)
* **Ä°stek & Problem:**
  - Karakter motorunda manevra takip sistemi ve Warlock yetenekleri bulunmasÄ±na raÄŸmen, *Tome of Battle* ve *Warlock* sÄ±nÄ±flarÄ±nÄ±n en kritik 16 adet resmi RAW feati katalogda eksikti.
  - Bu durum hem saf savaÅŸÃ§Ä±larÄ±n (Martial Study, Martial Stance) manevra Ã¶ÄŸrenmesini hem de Crusader/Warblade (Extra Granted Maneuver, Extra Readied Maneuver, Snap Kick, Stone Power) ve Warlock'larÄ±n (Extra Invocation, Empower/Quicken/Maximize Spell-Like Ability, Ability Focus, Mortal Bane) RAW kural kapasitesini kÄ±sÄ±tlÄ±yordu.
* **Uygulanan DeÄŸiÅŸiklikler:**
  1. **10 Adet Tome of Battle Featinin Eklenmesi:**
     - Martial Study (*ToB p.31*, isFighterBonusFeat: true)
     - Martial Stance (*ToB p.31*, isFighterBonusFeat: true)
     - Extra Granted Maneuver (*ToB p.30*, Crusader Ã¶zel deste desteÄŸi)
     - Extra Readied Maneuver (*ToB p.30*, Swordsage/Warblade)
     - Snap Kick (*ToB p.32*, isFighterBonusFeat: true)
     - Stone Power (*ToB p.32*, isFighterBonusFeat: true, Temp HP mekaniÄŸi)
     - Song of the White Raven (*ToB p.32*, Swift Inspire Courage & seviye yÄ±ÄŸma)
     - Sudden Recovery (*ToB p.33*, isFighterBonusFeat: true, Swift manevra yenileme)
     - Vital Recovery (*ToB p.33*, manevra yenilendiÄŸinde 3 + Level can iyileÅŸtirme)
     - Evasive Reflexes (*ToB p.30*, isFighterBonusFeat: true, AoO yerine 5-foot step)
  2. **6 Adet Warlock Ã–zel Featinin Eklenmesi:**
     - Extra Invocation (*Complete Arcane p.79*, ek yakarÄ±ÅŸ Ã¶ÄŸrenme)
     - Empower Spell-Like Ability (*Monster Manual p.303*, x1.5 deÄŸiÅŸken etki, 3/gÃ¼n)
     - Quicken Spell-Like Ability (*Monster Manual p.304*, Swift action SLA, 3/gÃ¼n)
     - Maximize Spell-Like Ability (*Complete Arcane p.81*, tavan hasar, 3/gÃ¼n)
     - Ability Focus (Eldritch Blast) (*Monster Manual p.303*, DC'ye +2 bonus)
     - Mortal Bane (*Book of Vile Darkness p.48 / Complete Arcane*, canlÄ± hedeflere +2d6 hasar, 5/gÃ¼n)
  3. **VeritabanÄ± Senkronizasyonu & BÃ¼yÃ¼me:**
     - 16 feat resmi ÅŸemaya uygun ÅŸekilde undled_data.js (window.BUNDLED_SRD_CORE_CATALOG) iÃ§ine eklenerek toplam Ã§ekirdek katalog **202'den 218 Ã¶ÄŸeye** Ã§Ä±karÄ±ldÄ±.
     - AynÄ± 16 feat kalÄ±cÄ± master_db.json veri tabanÄ±na iÅŸlenerek toplam kayÄ±t sayÄ±sÄ± **41'den 57 Ã¶ÄŸeye** Ã§Ä±karÄ±ldÄ±.
  4. **Parite ve Kural StandartlarÄ±:**
     - undled_data.js ve webapp/bundled_data.js arasÄ±nda %100 SHA-256 hash paritesi saÄŸlandÄ± (F944EB830A888EC03A447D06590E26FCD76F1E13CEDF40CC43EAAB9021D1474B).
     - master_db.json ve webapp/master_db.json arasÄ±nda %100 SHA-256 hash paritesi saÄŸlandÄ± (E210834A852CA3DCF5348858DEFB64F1D46581C218492DD5E89BBA5579B37222).
     - 4 HTML karakter kÃ¢ÄŸÄ±dÄ± dosyasÄ± deÄŸiÅŸime ihtiyaÃ§ duymadan yeni verileri dinamik olarak haritaladÄ± (2A393ACD2723BF24E2402D2E368159BB307B863C7CF16F7831256C8F475A87FD).
     - Standart tavla zarÄ± emojisi (U+1F3B2) yasaÄŸÄ± tavizsiz korundu.

---

## 77. D&D 3.5e RAW SINIF & FEAT USTALIKLARI (PROFICIENCIES) VE CEZA MOTORU (2026-10-26)
* **İstek & Problem:**
  - Fighter gibi zırh ve silah ustalıklarına zaten standart olarak sahip olan sınıflar, Level Up ve Feat arama ekranlarında "Heavy Armor Proficiency" veya "Martial Weapon Proficiency" gibi sınıfından gelen featleri gereksiz yere tekrar seçebiliyordu.
  - Rogue veya Wizard gibi sınıfların ise ilgili featleri almadan Greatsword (Martial) veya Full Plate (Heavy) kuşandıklarında D&D 3.5e RAW kuralları gereği almaları gereken cezalar (-4 saldırı cezası ve zırh ACP cezasının saldırılara yansıması) hesaplanmıyordu.
* **Uygulanan Değişiklikler:**
  1. **Kanoniik D&D 3.5e RAW Sınıf Ustalıkları Tablosu (CLASS_PROFICIENCIES):**
     - `rule_engine.js` içerisine tüm temel ve popüler prestij/ek sınıfların (Fighter, Barbarian, Paladin, Ranger, Cleric, Druid, Rogue, Bard, Monk, Sorcerer, Wizard, Warlock, Crusader, Swordsage, Warblade, Duskblade, Knight, Warmage, Beguiler, Scout, vb.) zırh (light, medium, heavy), kalkan (shield, tower) ve silah (simple, martial, specific) ustalıkları tanımlandı.
  2. **Dinamik Karakter Proficiencies Toplayıcısı (getCharacterProficiencies):**
     - Karakterin aldığı tüm çoklu sınıfları (multiclassing union per RAW), Level Up sihirbazında seçilen yeni sınıfı ve öğrenilmiş featleri (`Armor Proficiency Light/Medium/Heavy`, `Shield/Tower Shield Proficiency`, `Simple/Martial/Exotic Weapon Proficiency`, Warblade `Weapon Aptitude`) tarayarak güncel ustalık kümesini çıkaran modüler motor entegre edildi.
  3. **Akıllı Feat Önkoşul & Filtreleme Motoru (checkFeatPrerequisites):**
     - Zırh ve kalkan zincirleri kuralına uygun hale getirildi:
       - `Armor Proficiency (Medium)` için Hafif Zırh ustalığı, `Armor Proficiency (Heavy)` için Orta Zırh ustalığı zorunlu kılındı. Rogue Hafif Zırha sahip olduğu için Orta Zırh featini alabilirken; Orta Zırh featini almadan Ağır Zırh featini seçmesi `[⚠️ Önkoşul Eksik: Armor Proficiency (Medium)]` uyarısıyla engellendi.
       - Sınıfından ötürü bu ustalığa zaten sahip olan karakterler için (örn. Fighter) `isAlreadyKnownFromClass: true` bayrağı devreye sokuldu.
     - Feat arama ve Level Up konsollarında (`renderQuickFeatSearchResults`, `renderLevelUpFeatSearchResults`, `renderFeatPickerList`):
       - Zaten bilinen ustalıklar `🔒 Sınıf Ustalığı (Zaten Var)` rozeti aldı.
       - Seçim butonu `Zaten Sahipsiniz` olarak devre dışı bırakıldı (disabled).
       - `[✅ Alınabilir]` sekmesinden ve sayacından otomatik hariç tutularak kalabalık önlendi.
  4. **Saldırı Motoru RAW Ustalık Cezaları (evaluateWeaponAttack):**
     - Silah Ustalığı Cezası: Karakter yetkin olmadığı bir silahı (Basit, Askeri veya Egzotik) kullandığında otomatik olarak `-4 Non-Proficient Weapon Penalty (-4 Att)` saldırı cezası uygulanır (örn. Rogue'un Greatsword kullanması).
     - Zırh Ustalığı Cezası (PHB p.122): Karakter yetkin olmadığı bir zırhı giydiğinde zırhın Zırh Kontrol Cezası (ACP) doğrudan tüm saldırı zarlarına untyped ceza olarak eklenir (örn. Rogue'un Full Plate giymesi durumunda -6 ceza).
     - Kalkan Ustalığı Cezası (PHB p.122): Karakter yetkin olmadığı bir kalkanı taşıdığında kalkanın ACP'si saldırı zarlarına eklenir (örn. Heavy Shield için -2 ceza).
     - Cezalar kurala uygun şekilde yığılır (Full Plate -6, Heavy Shield -2, Greatsword -4 ile Rogue toplam -12 saldırı cezası alır; Fighter ise ustalıkları sayesinde 0 ceza alır).
  5. **Parite ve Kural Standartları:**
     - 4 HTML karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı (`35C42A69E16B1FC305736CB823E32B945A06E929B1055B36DBB1885A8F4CA041`).
     - `rule_engine.js` ve `webapp/rule_engine.js` arasında %100 SHA-256 hash paritesi sağlandı (`73EBBF688FEF94C09A832B12CAAE7DB7450992332A57A060098B6619AC30853A`).
     - `scratch/test_proficiencies.html` içindeki 22 test senaryosunun tamamı Edge headless ortamında başarıyla geçti (PASS).
     - Standart tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.

---

## 78. SEVİYE TABLOSU FEAT SEÇİMİNDE TEK TIKLA EKLEME (1-CLICK ADD) ERGONOMİSİ (2026-10-26)
* **İstek & Problem:**
  - Seviye tablosu hızlı feat ekleme modalında (`#quick-level-feat-modal`), listedeki bir feate basıldığında önce karttaki `🎯 Seç` butonuna, ardından da pencerenin en altına kaydırarak `✅ Bu Seviyeye Ekle` butonuna basılması gerekiyordu.
  - Bu iki aşamalı akış gereksiz bir sürtünme (friction) ve kafa karışıklığı yaratıyordu; kullanıcılar "Seç"e bastığında işlemin bittiğini sanabiliyordu.
* **Uygulanan Değişiklikler:**
  1. **Doğrudan Tek Tıkla Ekleme (`selectFeatForQuickLevel`):**
     - Özel hedef gerektirmeyen standart featlerde (örn. *Blind-Fight*, *Cleave*, *Power Attack*, *Toughness* vb.) karttaki butona tıklandığı anda feat doğrudan ilgili seviye satırına eklenir, tablo yenilenir, karakter verisi kaydedilir ve modal otomatik kapanır (1 tıkla tamamlama).
     - Buton etiketi ve sembolü `🎯 Seç ve Ekle` (önkoşulu eksikse `⚠️ Yine de Ekle`) olarak netleştirildi.
  2. **Akıllı Hedef Silah Denetimi:**
     - Yalnızca *Weapon Focus*, *Exotic Weapon Proficiency* gibi hedef silah belirlenmesi gereken parametrik featlerde (eğer parantez içinde silah henüz belirtilmemişse) modal açık tutulur, hedef silah seçtirici vurgulanır ve kullanıcı silahı seçip alttaki `✅ Bu Seviyeye Ekle` butonuna tıklar.
  3. **Özel / Manuel Feat Desteği:**
     - Alttaki `✅ Bu Seviyeye Ekle` butonu korunarak, kullanıcının listede olmayan tamamen özel (Homebrew) bir feat adını kutucuğa elle yazıp eklediği veya açıklamasını düzenlediği durumlar için işlevini sürdürmesi sağlandı.
  4. **Parite ve Kural Standartları:**
     - 4 HTML karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı (`454E70653D0A756F7792E54215D0959ECB24DECB4BF4F589549BC42BFEA309A1`).
     - Standart tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.


---

## 79. D&D 3.5e RAW UYUMLU İNSAN / IRKSAL BONUS FEAT KISITLAMASININ KALDIRILMASI (2026-10-26)
* **İstek & Problem:**
  - 1. seviyede İnsan (Human) karakter için seviye tablosundaki `+ Irk Feati Seç` butonuna tıklandığında açılan modalda kategori `🧬 Irksal Yetenek (Racial Trait)` olarak ayarlanıyordu.
  - Mevcut filtreleme mantığı (`renderQuickFeatSearchResults` ve `renderLevelUpFeatSearchResults`), `Racial Trait` kategorisini yalnızca `category === 'Racial Trait'` veya `category === 'General'` olanlarla kısıtlıyordu (katalogdaki 112 featten yalnızca 18'i listeleniyor ve Savaşçı/Fighter bonus featleri dahil pek çok feat görünmüyordu).
  - Oysa D&D 3.5e PHB (sf. 12-13) kurallarına göre İnsan bonus feati için hiçbir kategori/okul kısıtlaması yoktur (*"Humans may choose any feat for which they qualify"*).
* **Uygulanan Değişiklikler:**
  1. **Tam Kütüphane Erişimi (`baseList = combined`):**
     - Hem hızlı feat ekleme modalında (`renderQuickFeatSearchResults`) hem de Seviye Atlama Sihirbazı modalında (`renderLevelUpFeatSearchResults`), `Racial Trait` seçildiğinde katalog yapay olarak kısıtlanmak yerine tüm feat havuzunu (`combined`, 112+ feat) eksiksiz sunacak şekilde güncellendi.
     - Oyuncu önkoşulunu sağladığı tüm featleri (Savaşçı featleri, Genel featler, vb.) filtre sekmelerinden görebilir ve seçebilir.
  2. **Etiketleme ve Yuva Koruma:**
     - Feat seçildiğinde seviye ilerleme satırına `🧬 [Racial] ` ön eki ile kaydedilir.
     - Seviye tablosu bu feati bonus feat sütununda `🧬` rozetiyle gösterir ve seviye tablosundaki `+ Irk Feati Seç` uyarısı başarıyla tamamlanmış sayılır.
     - Feat seçilirken veya düzenlenirken slot kategorisinin yanlışlıkla `Class Bonus Feat`e kayması engellendi (`Racial Trait` bağlamı korundu).
  3. **Açılır Menü Metin İyileştirmesi:**
     - Kategori açılır menülerindeki etiket `🧬 Irksal Bonus Feat (Human vb.)` olarak netleştirildi.
  4. **Parite ve Kural Standartları:**
     - 4 HTML karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı (`BD021B9F7D1EB1A6F6B2C7FFB8EEDABF6BD28455FCD83728D55D8706C6841034`).
     - Standart tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.


---

## 80. D&D 3.5e RAW MÜKERRER FEAT ENGELLEME VE ALINMIŞ FEAT FİLTRESİ (2026-10-26)
* **İstek & Problem:**
  - Kullanıcı aynı seviyede veya daha önceki seviyelerde seçilmiş bir feati (örneğin *Power Attack*), ırk feati veya diğer seviye slotlarında tekrar seçebildiğini belirtti ve seçilen featlerin filtrelenmesini talep etti.
  - D&D 3.5e PHB (sf. 89) kurallarına göre aksi açıkça belirtilmedikçe (*"Unless noted otherwise, a feat can be taken only once"*) bir feat karakter hayatı boyunca yalnızca bir kez seçilebilir. Yalnızca *Toughness*, *Extra Turning* gibi özel featler limitsiz tekrar edebilir; *Weapon Focus*, *Spell Focus* gibi featler ise yalnızca farklı bir hedef için seçilebilir.
* **Uygulanan Değişiklikler:**
  1. **Evrensel Alınmış Feat Denetimi (`isFeatAlreadyTakenByCharacter`):**
     - Karakterin tüm aktif seviye satırlarındaki (`character.levelProgression[...].feats`), ana feat listesindeki (`character.feats`) ve Seviye Atlama Sihirbazı'ndaki diğer slotlardaki featler taranarak normalize edilmiş bir feat havuzu oluşturuldu.
     - Feat ön ekleri (`🎖️ `, `⚔️ [Bonus] `, `🧬 [Racial] `, `🌟 [DM Boon] `, `⚠️ [Flaw] ` vb.) regex ile güvenle temizlenip temel feat adı ve parantezli parametreleri ayrıştırıldı.
  2. **D&D 3.5e RAW İstisna Kural Tablosu:**
     - **Limitsiz Featler:** *Toughness*, *Extra Turning*, *Improved Natural Armor* vb. featler için mükerrerlik kısıtlaması uygulanmaz (birden fazla kez seçilebilir ve HP/turn etkileri yığılır).
     - **Hedefli Featler:** *Weapon Focus*, *Greater Weapon Focus*, *Weapon Specialization*, *Exotic Weapon Proficiency*, *Spell Focus*, *Skill Focus* vb. hedefli featlerde; aynı hedef (örn. *Weapon Focus (Greatsword)*) daha önce alınmışsa engellenir, farklı bir hedef seçiliyorsa (örn. *Weapon Focus (Longsword)*) izin verilir.
     - **Standart Featler:** *Power Attack, Cleave, Combat Reflexes, Dodge, Improved Initiative* vb. standart featlerin ikinci kez seçilmesi engellendi.
  3. **Arayüz (UI) ve Önkoşul Entegrasyonu (`checkFeatPrerequisites`):**
     - Alınmış bir feat listelendiğinde silinmek yerine kartı **`🔒 Zaten Alındı`** mavi rozetiyle işaretlenir, butonu **`🔒 Zaten Sahipsiniz`** (devre dışı / disabled) haline getirilir ve açıklamasında kural uyarısı gösterilir.
     - `countQualified` ve `✅ Alınabilir` filtresi zaten alınmış featleri eler.
     - Sıralamada zaten alınmış featler listenin en altına taşınır.
     - `selectFeatForQuickLevel`, `confirmQuickLevelFeat` ve `selectFeatForLevelUpSlot` fonksiyonlarına defansif kontrol eklenerek mükerrer feat eklenmesi kesin olarak engellendi.
  4. **Parite ve Kural Standartları:**
     - 4 HTML karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı (`E0C2B20B937984BB914C4704D1562F9C65AC6BF837FA34BF9D244E810253784D`).
     - Standart tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.
     - Headless Edge ortamında CDP otomatik testiyle mükerrer feat engellemesi ve Cleave/Toughness istisnaları %100 başarıyla doğrulandı.


---

## 81. D&D 3.5e RAW CON MODİFİKATÖRÜ VE CAN PUANI (HP) SENKRONİZASYONU (2026-10-26)
* **İstek & Problem:**
  - Seviye düzenleme/atlama modalında 1. Seviye Fighter için d10 zar (10) + CON modu (+3) = 13 Toplam HP gösterilirken, ana ekranda karakterin canı 10 / 10 olarak kalıyordu.
  - İncelemede; `character.html` içindeki Seviye Motoru `baseMax = 10` ve `conBonusHp = 3` ile Max HP'yi 13 hesaplamasına rağmen, `rule_engine.js` içindeki `RuleEngine.recalculateCharacter` fonksiyonunun `conBonusHp`'yi yalnızca geçici buff farkı (`effectiveConMod - baseConMod`) olarak hesapladığı, bu fark 0 çıktığında Seviye Motorunun eklediği +3 CON bonusunu ezerek `conBonusHp`'yi 0 yaptığı ve Max HP'yi 10'a düşürdüğü tespit edildi.
* **Uygulanan Değişiklikler:**
  1. **Kural Motoru HP Hesaplama Senkronizasyonu (`rule_engine.js`):**
     - `RuleEngine.recalculateCharacter` içindeki CON HP hesabı, D&D 3.5e RAW kuralına uygun şekilde toplam CON modifikasyonunu tam yansıtacak biçimde güncellendi:
       $$\text{newConBonusHp} = \text{effectiveConMod} \times \text{totalHD}$$
     - Karakterin 1. seviyedeki +3 CON bonusu (veya ilerleyen seviyelerdeki toplam CON bonusu) kural motoru tarafından silinmez; `character.hp.max = baseMax + newConBonusHp` (10 + 3 = 13 HP) olarak korunur.
     - CON değeri arttığında (örn. 16'dan 18'e) veya azaldığında can otomatik olarak senkronize edilir.
  2. **Tam Can Durumunda Senkronizasyon (`character.html`):**
     - Karakter tam canda iken (`oldCurrent === oldMax`) seviye düzenlemesi veya CON artışı yapıldığında, mevcut can da yeni maksimuma eşitlenir (`current = max`, 13/13).
  3. **Parite ve Kural Standartları:**
     - 4 HTML karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı (`B07B19E3893742213CA7E5715DBB7750E1E2DC7B83976FF99AE848023FF395D4`).
     - `rule_engine.js` ve `webapp/rule_engine.js` arasında %100 SHA-256 hash paritesi sağlandı (`14AA1FDF99E40AEC29F0C91126EDC2F9DE6B131F6E15C15BAACEC4EDB5E49BA4`).
     - Standart tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.
     - Headless Edge ortamında CDP otomatik testiyle 1. seviye Fighter CON 16 için 13 / 13 (+3 CON) ve CON 18 için 14 / 14 (+4 CON) değerleri %100 başarıyla doğrulandı.


---

## 82. SEVİYE İLERLEME TABLOSU BAB VE KURTARMA ATIŞLARI (SAVES) KÜMÜLATİF SENKRONİZASYONU (2026-10-26)
* **İstek & Problem:**
  - Kullanıcı bildiriminde: Seviye İlerleme Tablosu satırlarında BAB ve Kurtarma Atışlarının (Saves) çelişkili olduğu, Seviye 1'de BAB +1 / Fort +1 (D&D 3.5e RAW kuralına göre Fighter 1. Seviye güçlü Fort kurtarışı +2 olması gerekirken +1 gözüktüğü), Seviye 2'de BAB +2 / Fort +3, Seviye 3'e geçildiğinde ise BAB'ın tekrar +1'e ve Fort'un +1'e düştüğü tespit edildi.
  - İncelemede; üstteki HUD özet çubuğu ve ana karakter kâğıdı `RuleEngine.calculateProgression` kullandığı için doğru (BAB +3, Fort +3, Ref +1, Will +1) hesaplarken, tablo satırlarının (`#level-progression-tbody`) satır objesindeki eski ve tutarsız statik `lvl.bab` / `lvl.fort` alanlarını doğrudan ekrana bastığı; yeni seviye ekleme fonksiyonunun ise kümülatif toplam yerine tekil seviye artışını (`1 / 0`) bu alanlara yazdığı belirlendi.
* **Uygulanan Değişiklikler:**
  1. **Dinamik Kümülatif Satır Çizimi (`renderLevelProgression`):**
     - Tablo satırları çizilirken statik alanlara güvenmek yerine, o satıra kadarki seviye dilimi `RuleEngine.calculateProgression(prog.slice(0, idx + 1))` motorundan geçirilerek her satırın o seviyedeki kümülatif BAB ve Save (Fort, Ref, Will) değerleri dinamik olarak hesaplanıp tabloya yansıtıldı.
     - D&D 3.5e PHB resmi sınıf tabloları standardına tam uyum sağlandı:
       - Seviye 1 Fighter: BAB +1, Fort +2, Ref +0, Will +0
       - Seviye 2 Fighter: BAB +2, Fort +3, Ref +0, Will +0
       - Seviye 3 Fighter: BAB +3, Fort +3, Ref +1, Will +1
       - Seviye 4 Fighter: BAB +4, Fort +4, Ref +1, Will +1
  2. **Veri ve Durum Bütünlüğü (`recalculateCharacterClassSummary` & `addNewLevelRowToProgression`):**
     - `recalculateCharacterClassSummary()` fonksiyonu çağrıldığında, `character.levelProgression` içindeki tüm seviye satırlarının `lvl.bab`, `lvl.fort`, `lvl.ref`, `lvl.will` alanları da kural motoruyla senkronize edilerek veri nesnesi düzeyinde de tam tutarlılık sağlandı.
     - Yeni seviye satırı ekleme fonksiyonu (`addNewLevelRowToProgression`), ileriye dönük kümülatif projeksiyonu kural motorundan hesaplayarak eklenen satıra tam kümülatif değerleri yazacak şekilde güncellendi.
  3. **Global Pencere Nesnesi Entegrasyonu (`window.character`):**
     - Sayfa içi ve harici geliştirici/test araçlarının güvenli erişimi için `window.character` ve `window.masterDb` güvenli getter/setter ile `window` nesnesine bağlandı.
  4. **Parite ve Kural Standartları:**
     - 4 HTML karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı (`B26162F73CDC124741C784AFA5E7A6F0D69575FFBBC11FB76759068117EAE08D`).
     - Standart tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.


---

## 83. ÇOKLU CİHAZ (TELEFON - BİLGİSAYAR) BULUT SENKRONİZASYONU VE HUB GÜNCELLEME ONARIMI (2026-10-26)
* **İstek & Problem:**
  - Kullanıcı telefonda 3. seviye Fighter (Fighter 3, 20/31 HP, +9 CON, Fort +6, Ref +2, Will +1, 5 Feat, 2 Yetenek) olarak güncellediği karakterin bilgisayarda açıldığında Seviye 0 / Sınıfsız (Aktif Seviye 0, Toplam Plan 0, HP +0, BAB +0, Saves +0) olarak kaldığını ve HUB kartında da "Sınıf Seçilmedi" yazdığını bildirdi.
  - İncelemede iki kritik mimari açık tespit edildi:
    1. **HUB Sayfası (`hub.html` `syncCloudUserHub`):** Supabase'den güncel bulut karakteri çekildiğinde, yerelde aynı ID'ye sahip kayıt zaten varsa `else` bloğuna giriyordu. Bu blokta `classes`, `level`, `race`, `maxHp`, `saves` vb. kart özet alanları güncellenmiyor ve en kritiği `changed = true` bayrağı unutulduğu için `saveHubStorage()` ve `renderHub()` asla tetiklenmiyordu. HUB kartı eski boş haliyle donup kalıyordu.
    2. **Karakter Kâğıdı (`character.html` / `index.html` `loadInitialData`):** Sayfa açılışında Supabase bulutundan ASLA otomatik veri çekilmiyor (`fetchUserCharacters` çağrılmıyor); yalnızca yerel `localStorage`'a bakılıyordu. Bilgisayarın yerelinde eski boş şablon kaldığı için sayfa Seviye 0 olarak açılıyor ve hatta `saveStateToStorage` tetiklendiğinde buluttaki dolu karakteri ezme riski taşıyordu.
* **Uygulanan Değişiklikler:**
  1. **HUB Senkronizasyon Onarımı (`hub.html` & `webapp/hub.html`):**
     - `syncCloudUserHub` fonksiyonunda `else` bloğu baştan yapılandırıldı; buluttan gelen `full_data` ile yerel kartın `name`, `isNpc`, `classes`, `level`, `race`, `currentHp`, `maxHp`, `tempHp` ve `fullData` nesnesi güncellendi.
     - `syncCharacterSummaryStats(localChar)` çağrılarak kartın canlı AC, Saves, Spot, Listen, Silah ve Atak formülleri kural motorundan geçirildi.
     - `changed = true;` bayrağı eklenerek hem `dnd35_hub_db` yerel depolaması tazelendi hem de `renderHub()` ile ekrandaki kart anında Fighter 3 görünümüne geçirildi.
  2. **Karakter Kâğıdı Cloud-First Açılış Senkronizasyonu (`character.html` & `index.html`):**
     - `loadInitialData()` fonksiyonunun en başına `Cloud-First Senkronizasyon` adımı eklendi. Supabase oturumu açıkken `fetchUserCharacters()` ile kullanıcının bulut karakterleri çekilir.
     - Buluttaki karakter daha yüksek seviyedeyse, daha yeniyse veya yereldeki karakter henüz sınıfsız/boş ise; buluttaki tam karakter nesnesi (`cloudFd`) doğrudan yerel belleğe alınır (`character = cloudFd;`), `localStorage` ve `dnd35_hub_db` güncellenir.
  3. **Veri Ezilmesine Karşı Koruma Kalkanı (`saveStateToStorage`):**
     - Karakter seviyesi 0 olan ve henüz sınıfı/ırkı/feati atanmamış boş/uninitialized nesnelerin buluttaki dolu karakteri kazara ezmesini engelleyen güvenlik kilidi eklendi.
  4. **Parite ve Kural Standartları:**
     - `hub.html` ve `webapp/hub.html` arasında %100 SHA-256 hash paritesi sağlandı (`1094F9803C16950206ED5C0BA60B23F5262356F88EF1653B7095A2DA22706B32`).
     - 4 HTML karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı (`1AFF33B092961AAE4F3B9CE03401D8AB34613B2FAD14BE02FF64A08D19B69309`).
     - Standart tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.


---

## 84. CANLI WEBSOCKET EŞİTLEME, SEKME ODAĞI SENKRONİZASYONU VE HUB DEVİR TESLİMİ (2026-10-26)
* **İstek & Problem:**
  - Kullanıcı telefonda işlem yapıp bilgisayara geçtiğinde, tarayıcıyı tamamen kapatıp açmaya gerek kalmadan; sekme zaten açıkken bile değişikliklerin anında (veya en azından sekmeye dönüldüğünde) otomatik yansımasını talep etti.
* **Karakter Kâğıdında Uygulanan Geliştirmeler (`character.html` / `index.html` / `supabase_auth.js`):**
  1. **Evrensel Supabase Realtime Dinleyicisi (`subscribeUserCharactersRealtime`):**
     - `supabase_auth.js` içerisine kullanıcının kendi karakterlerini kampanya bağımlılığı olmadan PostgreSQL WebSocket üzerinden canlı dinleyen kanal eklendi.
  2. **Canlı Karakter Senkronizasyon Motoru (`initCharacterRealtimeSync`):**
     - Karakter sayfası açıkken başka bir cihazdan (örneğin telefon) seviye atlandığında, feat eklendiğinde veya stat değiştiğinde; gelen WebSocket güncellemesi 0.2 saniyede yakalanır, `character` nesnesi güncellenir, `renderAll()` çağrılır ve `showDiceTopToast` ile yeşil toast bildirimi gösterilir.
  3. **Sekme Odağı Senkronizasyonu (`initTabVisibilitySync`):**
     - Kullanıcı başka bir sekmeden veya telefondan bilgisayardaki karaktere döndüğünde (`visibilitychange` / `window.focus`), arka planda sessizce buluttaki en taze sürüm sorgulanır ve varsa DOM güncellenir.
  4. **Zorla Senkronizasyon Kontrolü (`handlePillClick`, `forceCloudSyncPull`, `forceCloudSyncPush`):**
     - Üst bardaki `[ 🟢 Bulut Senkron ]` hapına tıklandığında kullanıcıya tek tıkla buluttan zorla çekme veya buluta zorla gönderme seçeneği sunuldu.
  5. **Parite ve Kural Standartları:**
     - 4 HTML karakter kâğıdı dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında %100 SHA-256 hash paritesi sağlandı (`6E7A9C926A14A3643BF094200C31DFCDEF189E42CE377434CAE2B8E5E5036D91`).
     - `supabase_auth.js` ve `webapp/supabase_auth.js` arasında %100 SHA-256 hash paritesi sağlandı.
     - Standart tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.

---

## 85. HAZIR HUB DEVİR TESLİM PROMPTU (DİĞER KONUŞMAYA DOĞRUDAN YAPIŞTIRILACAK)
```markdown
Selam! Ben Karakter Kâğıdı geliştirme sekmesinden geliyorum. `HANDOVER_TO_CHARACTER_SHEET.md` dosyasındaki Bölüm 84 spesifikasyonuna uygun olarak, Karakter Kâğıdı ve `supabase_auth.js` üzerinde çoklu cihaz canlı senkronizasyon altyapısı (WebSocket Realtime + Sekme Odağı) tamamlandı.

Şimdi bu canlı mimariyi HUB sayfasına (`hub.html` ve `webapp/hub.html`) uygulaman gerekiyor:

1. ⚡ Canlı Kart Realtime Dinleyicisi (`initHubRealtimeSync`):
   - `window.SupabaseAuth.subscribeUserCharactersRealtime((payload) => { ... })` kanalına abone ol.
   - Başka bir cihazdan (telefon vb.) bir karakter güncellendiğinde (`payload.new`), `state.characters` içinde ilgili karakteri bul:
     - `localChar.fullData = payload.new.full_data;`
     - `localChar.name = payload.new.name;`
     - `localChar.classes = payload.new.full_data?.classes || localChar.classes;`
     - `localChar.level = Number(payload.new.full_data?.level) || localChar.level;`
     - `localChar.currentHp = payload.new.current_hp;`
     - `localChar.maxHp = payload.new.full_data?.hp?.max || localChar.maxHp;`
     - `syncCharacterSummaryStats(localChar);`
     - Tüm sayfayı baştan çizip arama/modal odağını bozmamak için, yalnızca ilgili kartın DOM'unu güncelle (veya `renderHub()` çağır) ve `saveHubStorage(false)` yap.
     - Ekranda şık bir toast göster: `showHubDiceToast({ title: '⚡ Canlı Senkron', text: `${localChar.name} başka bir cihazdan güncellendi!`, color: 'emerald' })`.

2. 👁️ Sekme Odağı Senkronizasyonu (`visibilitychange` / `window.focus`):
   - DM veya kullanıcı başka bir sekmeden/telefondan HUB ekranına döndüğünde (`document.visibilityState === 'visible'`), arka planda sessizce `syncCloudUserHub(window.SupabaseAuth.currentUser)` çalıştırarak kartları en güncel hale getir.

3. 🛡️ Değişmez Kurallar:
   - `hub.html` ve `webapp/hub.html` dosyaları arasında %100 SHA-256 hash eşitliğini sağla.
   - Projenin hiçbir yerinde standart tavla zarı emojisi (`U+1F3B2`) kullanma; tematik SVG ve ikonları koru.
   - Kesinlikle dummy data ekleme.
```


---

## 86. HUB ÇOKLU CİHAZ CANLI SENKRONİZASYON VE SEKME ODAĞI ENTEGRASYONU (2026-10-26)
* **İstek & Problem:**
  - Karakter Kâğıdı oturumunda tamamlanan PostgreSQL WebSocket Realtime altyapısının (`subscribeUserCharactersRealtime`) ve sekme odağı senkronizasyonunun (`visibilitychange` / `window.focus`) HUB sayfasına (`hub.html`) entegre edilmesi.
* **HUB Sayfasında Uygulanan Geliştirmeler (`hub.html` / `webapp/hub.html`):**
  1. **Canlı Kart Realtime Dinleyicisi (`initHubRealtimeSync`):**
     - `window.SupabaseAuth.subscribeUserCharactersRealtime` kanalına abone olundu.
     - Başka bir cihazdan karakter güncellendiğinde (`UPDATE`), `full_data`, `name`, `classes`, `level`, `currentHp`, `maxHp` alanları yerel state'e aktarılır, `syncCharacterSummaryStats` ile istatistikler yenilenir ve `saveHubStorage(false)` çalıştırılır.
     - Sayfanın arama kutusu ve modal odağını bozmamak için yalnızca ilgili kart DOM'u (`#hub-char-card-${id}`) veya DM tablosu satırı (`#hub-char-row-${id}`) yerinde yenilenir.
     - Yeni eklenen (`INSERT`) ve silinen (`DELETE`) karakterler de gerçek zamanlı yakalanarak Hub listesi güncellenir.
     - Ekranda şık toast bildirimi gösterilir: `showHubDiceToast({ title: '⚡ Canlı Senkron', text: '...', color: 'emerald' })`.
  2. **Sekme Odağı Senkronizasyonu (`initTabVisibilitySync`):**
     - DM veya kullanıcı başka bir sekmeden/telefondan HUB ekranına döndüğünde (`document.visibilityState === 'visible'`), 4 saniyelik debounce kalkanı ile `syncCloudUserHub(window.SupabaseAuth.currentUser)` sessizce tetiklenerek en güncel karakter ve kampanya verileri çekilir.
  3. **Toast Sistemi Genişletmesi (`showHubDiceToast`):**
     - `showHubDiceToast` fonksiyonu hem RPG zar atışları hem de genel sistem bildirimleri (`title`, `text`, `color`) ile uyumlu hale getirildi.
  4. **Parite ve Kural Standartları:**
     - `hub.html` ve `webapp/hub.html` arasında %100 SHA-256 hash paritesi sağlandı (`D38AA3222567679BE5008ED56DE7AD25F3A23AEBE29FBF225711F7D5BD2748C3`).
     - Sıfır standart tavla zarı emojisi (U+1F3B2) kuralı tavizsiz uygulandı.


---

## 87. Flash of Stale Content (FOUC) Giderilmesi & Hızlı Ön Render (Fast Pre-Render / Stale-While-Revalidate) Standardı

### Bağlam & Tespit Edilen Problem
Karakter kâğıdı (`character.html` / `index.html` ve `webapp/` ikizleri) yenilendiğinde (F5) veya açıldığında, Supabase bulut isteği (`await fetchUserCharacters()`) süresince (yaklaşık 200ms - 800ms) ekranda prototip döneminden kalma statik HTML verileri (**"Kazmil'in Çırağı"**, **"Sorcerer 5 / Warblade 1"**, **"38/38 HP"**, **"Magic Missile (5 Füze)"**, **"CL: 6"**) anlık olarak belirmekte, ardından bulut verisi (`test1` Fighter 3 vb.) yüklenince kaybolmaktaydı (FOUC).

### Uygulanan Mimari Çözüm

1. **Hızlı Ön Render (Fast Pre-Render - 0ms Stale-While-Revalidate):**
   * `DOMContentLoaded` olayının ilk satırında, `requireAuth()` veya `loadInitialData()` ağ beklemesi (network roundtrip) başlamadan önce yerel hafızadaki (`localStorage`) en son aktif karakter (`dnd35_character` veya ilgili ID'ye sahip `dnd35_hub_db` kaydı) senkron olarak okunur.
   * `character` nesnesine anında atanarak `renderHUD()`, `renderAbilities()`, `renderCharacterProfile()`, `renderCombatCockpit()` ve `renderWeapons()` tetiklenir.
   * Kullanıcı sayfayı yenilediği 0. milisaniyede doğrudan kendi karakterini ve doğru HP/stat/aksiyonlarını görür; hiçbir bekleme veya sıçrama hissetmez.

2. **Statik HTML Şablonu Temizliği (Neutral Skeleton Placeholders):**
   * Ham HTML dosyası içerisindeki prototip mock yazıları temizlendi:
     * Başlık İsim: `Yükleniyor...`
     * Sınıflar: `Yükleniyor...`
     * Irk: `--`
     * HP Göstergesi: `-- / --`
     * Büyü Komuta Merkezi Başlık: `Büyü Seçilmedi` / Hasar: `--` / CL: `--`
     * AoO Reaksiyon Bonusu: `+0`
     * Profil Modalı İsim/Sınıflar/HD: `Yükleniyor...` / `--`
   * Sıfır önbellekle açılan gizli pencerelerde dahi asla "Kazmil'in Çırağı" belirmeyecek, zarif nötr yer tutucular görünecektir.

3. **Parite ve Standart Güvencesi:**
   * 4 dosya arasında %100 SHA-256 hash paritesi (`f2943a766e4d08ffab18af42b091946cb59c50387dddd7b47c038a2426efe206`) sağlandı.
   * Tavla zarı emojisi yasağı (`U+1F3B2`) tavizsiz korundu.


---

## 88. BULUT SENKRON YÖNETİM MODALİ (TAMAM/İPTAL YERİNE BULUTTAN İNDİR / BULUTA YÜKLE) (2026-10-26)
* **İstek & Problem:**
  - `[ 🟢 Bulut Senkron ]` hapına tıklandığında açılan tarayıcının yerel `window.confirm()` kutusundaki sabit "Tamam" ve "İptal" butonları kullanıcıyı yanıltmaktaydı. "İptal"e basıldığında işlemin iptal olmak yerine buluta zorla göndermeyi (`forceCloudSyncPush`) tetiklemesi ciddi bir veri kaybı ve yanlış anlaşılma riski taşımaktaydı.
* **Uygulanan Mimari Çözüm (`supabase_auth.js` / `webapp/supabase_auth.js`):**
  1. **Özel Koyu Tema Bulut Senkron Modali (`#cloud-sync-management-modal`):**
     - Tarayıcının ilkel `confirm()` kutusu tamamen kaldırıldı; yerine projenin temasına (%100 Tailwind/Slate-900) uygun modern bir modal getirildi.
  2. **Net ve Güvenli Eylemler:**
     - ⬇️ **[Buluttan İndir (Çek)]**: Buluttaki en güncel karakter verisini indirir ve bu ekranı tazeler (Karakter kâğıdında `window.forceCloudSyncPull()`, HUB'da `window.syncCloudUserHub()`).
     - ⬆️ **[Buluta Yükle (Gönder)]**: Bu ekrandaki veriyi bulut veritabanına zorla gönderir (Karakter kâğıdında `window.forceCloudSyncPush()`, HUB'da `window.syncCloudUserHub()`).
     - ✕ **[Vazgeç / İptal (Değişiklik Yapma)]**: Modal güvenle kapatılır; hiçbir ağ isteği veya veri ezme gerçekleşmez.
  3. **Yerel Mod Koruması:**
     - Yerel moddayken tıklandığında durum açıkça izah edilir ve tek tıkla `/login.html` sayfasına yönlendirme veya güvenle vazgeçme imkânı sunulur.
  4. **Parite ve Kural Standartları:**
     - `supabase_auth.js` ve `webapp/supabase_auth.js` arasında %100 SHA-256 hash paritesi sağlandı (`8AC92FAD8124D075866EF3D3AC562BBF6356F8AECCCC3E0FD2BD94DEE725DD8E`).
     - Sıfır tavla zarı emojisi (U+1F3B2) kuralı tavizsiz korundu.


---

## 87. D&D 3.5e RAW Otomatik Sınıf Becerisi (Class Skills) Eşitleme ve Multiclass Standartlaşması

### Bağlam & Tespit Edilen Problem
Karakter oluşturulduğunda veya seviye atlandığında, D&D 3.5e resmi sınıf becerileri (örneğin Fighter için Athletics/Climb/Jump/Swim, Craft, Handle Animal, Intimidate, Ride) varsayılan olarak `isClass: false` kalmakta; tabloda tüm beceriler sınıf dışı (`⚪`) görünmekteydi. Bu durum oyuncunun becerilere rank verirken haksız yere 2 kat puan harcamasına (1 yerine 2 puan) ve maks rank sınırının `Seviye + 3` (örn: 6) yerine `(Seviye + 3) / 2` (örn: 3) olarak kısıtlanmasına yol açmaktaydı.

### Uygulanan Mimari Çözüm

1. **D&D 3.5e RAW Sınıf Becerileri Veri Tabanı (`DND35_BASE_CLASS_DEFS`):**
   * Tüm 27 temel ve prestij sınıfına (Warblade, Fighter, Barbarian, Rogue, Wizard, Sorcerer, Cleric, Paladin, Ranger, Monk, Bard, Druid, Crusader, Swordsage, Duskblade, Warlock, Abjurant Champion, Eldritch Knight, Assassin vb.) resmi D&D 3.5e SRD sınıf becerileri (`classSkills: [...]`) tanımlandı.
   * `DND35_CLASS_ALIASES` sözlüğü ile Türkçe/İngilizce sınıf isimleri ("savaşçı" -> "Fighter", "büyücü" -> "Wizard" vb.) canonical formatta eşleştirildi.

2. **D&D 3.5e RAW Çoklu Sınıf (Multiclass) Kuralı (`getCharacterClassSkillsSet`):**
   * *PHB 3.5e, s. 59* kuralı gereğince: Karakterin sahip olduğu veya planladığı sınıflardan herhangi birinin sınıf becerisi olan beceriler birleşir (union) ve karakter için resmi Sınıf Becerisi sayılır.
   * Birleştirilmiş Beceriler (Consolidated Skills) modunda; bileşenlerinden en az biri sınıf becerisi olan grup becerisi (örn: `Athletics` = Climb + Jump + Swim) otomatik olarak `⭐` (Sınıf Becerisi) statüsü kazanır.

3. **Otomatik Senkronizasyon & Kullanıcı Serbestliği:**
   * [`ensureAllSkills`](file:///C:/Users/tarum/Documents/antigravity/joyful-fermi/character.html#L37336): Karakter yüklendiğinde veya beceriler hazırlandığında, resmi sınıf becerilerini otomatik olarak `isClass: true` yapar.
   * [`recalculateCharacterClassSummary`](file:///C:/Users/tarum/Documents/antigravity/joyful-fermi/character.html#L30400): Seviye atlandığında (`confirmLevelUp`) veya sınıf değiştirildiğinde sınıf becerileri anında güncellenir.
   * Kullanıcının özel house rule / DM kararlarıyla manuel açtığı/kapattığı beceri geçişleri korunur.
   * Beceriler kartının üst çubuğuna **`[ ⭐ Sınıf Becerilerini Eşitle ]`** butonu eklenerek tek tıkla yeniden senkronizasyon imkânı sunuldu.

4. **Parite ve Kural Standartları:**
   * 4 dosya arasında (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) **%100 SHA-256 hash paritesi** (`fd7b898b...`) sağlandı.
   * Standart tavla zarı (`U+1F3B2`) yasağı tavizsiz korundu.

* **Filtre İyileştirmesi:** Beceriler tablosunda varsayılan görünüm modu oyuncu ergonomisini artırmak amacıyla doğrudan **`⭐ Sınıf (Class)`** filtresi olarak ayarlandı. Karakter açıldığında ilk olarak yalnızca kendi sınıfına ait beceriler listelenir; oyuncu dilerse tek tıkla "Tümü" diyerek tüm becerileri görebilir.


---

## 88. Seviye İlerleme Tablosu (Level Progression) Sütun Ergonomisi & Feat Alanı Genişletmesi

### Bağlam & Tespit Edilen Problem
Seviye İlerleme Tablosunda (`#level-progression-tbody`), sayısal sütunlar (HD, HP, BAB, Fort, Ref, Will, Puan) ve Sınıf sütunu yüzde bazlı (`w-[20%]`, `w-[7%]`) gereksiz geniş yer kaplamakta; tablonun %80'inden fazlasını doldurmaktaydı. Buna karşılık çok kelimeli başlıklar ve rozetler içeren 3 Feat sütunu (`Sınıf Özellikleri`, `Beceriler`, `Bonus`) sabit `max-w-[145px]` ile daraltıldığı için buton metinleri ezilmekte ve taşmaktaydı.

### Uygulanan Mimari Çözüm
1. **HD - Puan Sayısal Aralığının Sola Yaslanması & Kompaktlaştırılması:**
   * `Lvl`: `w-[32px] min-w-[32px]`
   * `Durum`: `w-[76px] min-w-[76px]`
   * `Sınıf`: `w-[110px] min-w-[100px]` (20%'lik genişlik yerine optimize sabit genişlik)
   * `HD`: `w-[36px] min-w-[36px]`
   * `HP`, `BAB`, `Fort`, `Ref`, `Will`: Her biri kompakt `w-[38px] min-w-[38px]`
   * `Puan`: `w-[44px] min-w-[44px]`
   * `İşlem`: `w-[58px] min-w-[58px] max-w-[58px]`

2. **Feat Sütunlarının Genişletilmesi (Fluid Expansion):**
   * `Sınıf Özellikleri`, `Beceriler` ve `Bonus` sütunlarındaki yapay `max-w-[145px]` sınırı kaldırıldı; `min-w-[170px]` ve esnek genişlik verildi.
   * Feat butonları ekrandaki tüm serbest alanı dolduracak şekilde ferahladı; `[Bonus] Improved Shield Bash` gibi uzun feat isimleri sıkışmadan okunur hale geldi.

3. **Parite ve Kural Standartları:**
   * 4 dosya arasında (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) **%100 SHA-256 hash paritesi** (`34da380a...`) sağlandı.
   * Tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.

* **Feat Sütun Genişlik Ayarı (Balancing):** Feat sütunlarının (`Sınıf Özellikleri`, `Beceriler`, `Bonus`) geniş ekranlarda aşırı açılmaması için akışkan sınırları `w-[160px] min-w-[145px] max-w-[175px]` olarak dengelendi. Böylece hem metinler ezilmez hem de tablo dengeli ve derli toplu kalır.


---

## 89. Hedefe Kilitli Feat Yuvası Bağlama (Targeted Slot Binding) & İnsan Bonus Feati Ayrıştırması

### Bağlam & Tespit Edilen Problem
1. Seviye ilerleme tablosunda (`#level-progression-tbody`), 1. seviyede veya bonus feat hakkı veren seviyelerde (örn: Fighter-1) birden fazla slot bulunuyordu:
   - Sınıf Özellikleri: `[+ Bonus Feat Seç]`
   - Beceriler: `[+ Feat Seç]`
   - Bonus: `[+ Irk Feati Seç]` (İnsan Bonusu)
2. Kullanıcı bu butonlardan birine tıkladığında modal açılıyor ancak kategori açılır menüsü (`#quick-feat-category`) serbest modda kalıyordu. Kullanıcı oradan bir feat seçtiğinde ya da genel satır `➕` butonuna bastığında rastgele/varsayılan olarak "Regular Feat" seçiliyor; bu da `[+ Bonus Feat Seç]` yuvasını boş bırakırken "Beceriler" sütununa ekstra bir feat ekleyerek mükerrer/fazladan slot yaratıyordu.
3. Ayrıca `+ Irk Feati Seç` etiketi, D&D 3.5e oyuncularında "belirli ırklara özel kısıtlı featler mi var?" kafa karışıklığı yaratıyordu (Oysa Core RAW kuralına göre İnsan 1. seviyede tamamen serbest herhangi bir ekstra feat alır).

### Uygulanan Çözüm & Mimari
1. **Hedefe Kilitli Yuva Sistemi (Targeted Slot Binding):**
   - `openQuickFeatPickerForLevel(levelIdx, preferredCategory, isTargetLocked)` imzası genişletildi.
   - Kolon 1'deki `[+ Bonus Feat Seç]` butonuna tıklandığında:
     - Kategori `Class Bonus Feat` olarak kilitlenir.
     - Arama filtresi ilgili sınıfa (`FIGHTER` vb.) kilitlenir.
     - Modal üstünde belirgin **`🎯 Hedef Yuva: [Sınıf] Sınıf Bonus Feati (Kilitli)`** bildirim bandı gösterilir.
     - Feat seçildiğinde otomatik `⚔️ [Bonus] ` öneki alır ve ilgili sınıf bonus yuvasına yerleşir; yan sütunda mükerrer slot açmaz.
   - Kolon 2'deki `[+ Feat Seç]` butonuna tıklandığında:
     - Kategori `Regular Feat` olarak kilitlenir (`🎖️ Hedef Yuva: Standart Feat`).
   - Kolon 3'teki `[+ İnsan Bonus Feati]` butonuna tıklandığında:
     - Kategori `Racial Trait` olarak kilitlenir (`🧬 Hedef Yuva: İnsan Irksal Bonus Feati`).
   - Satırdaki Genel `➕` Butonuna Tıklandığında:
     - O seviyedeki boş yuvaları otomatik tespit eder (Önce eksik Sınıf Bonusu, sonra eksik Standart Feat, sonra İnsan Bonusu).
     - Eğer tüm yasal seviye yuvaları doluysa kullanıcıyı serbest `DM Boon`, `Warlock Invocation` veya `Flaw` seçeneğine yönlendirerek illegal mükerrer feat eklenmesini engeller.
2. **Kategori Kilidi & Serbest Mod Geçişi:**
   - İhtiyaç halinde kullanıcının kategori değiştirebilmesi için bildirim bandına **`[🔓 Kilidi Aç (Serbest Kategori)]`** butonu eklendi.
3. **İnsan Bonus Feati Ayrıştırması & Temiz Gösterim:**
   - Prompt buton metni: `+ Irk Feati Seç` ➔ **`+ İnsan Bonus Feati`** olarak güncellendi.
   - Tablodaki rozet: `🧬 [İnsan Bonusu] FeatAdı` şeklinde şık ve net bir etiketle gösterildi.
4. **Parite ve Kural Standartları:**
   - 4 dosya arasında (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) **%100 SHA-256 hash paritesi** (`bdab28b1f4e70064bb0939ef7615563764e9053baf64bf22a3198adb457f93d5`) sağlandı.
   - Tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.


---

## 90. Sınıf Bonus Feat Yuva Kontratı (Slot Contract) Mimarisi & Monk / Wizard RAW Desteği

### Bağlam & Mimari Karar
Önceki yapıda sınıf bonus hüneri yuvası açıldığında tüm sınıflar için genel bir `Class Bonus Feat` filtresi çalıştırılıyordu. Bu durum, Fighter gibi ~45 savaşçı hüneri arasından seçim yapan sınıflar için mantıklı olsa da; Monk (1. seviyede sadece Improved Grapple / Stunning Fist, 2. seviyede Combat Reflexes / Deflect Arrows önkoşulsuz) ve Wizard (Metamagic / Item Creation / Spell Mastery) gibi sınıfların seviyeye özgü özel RAW bonus hüner mekaniklerini karşılayamıyordu. Ayrıca hünerlerin veri tabanı kayıtlarına `classes: ['Fighter']` gibi kaba kısıtlamalar yazmak D&D 3.5e RAW kurallarına aykırıydı.

### Uygulanan Çözüm & Mimari Yenilikler
1. **Rule Engine Slot Contract Entegrasyonu (`rule_engine.js` & `webapp/rule_engine.js`):**
   * `RuleEngine.getClassLevelFeatures(className, classLevel)` fonksiyonu genişletilerek `bonusFeatContract` nesnesi döndürmesi sağlandı:
     - **Fighter:** `{ mode: 'tag', tag: 'isFighterBonusFeat', filter: 'FIGHTER' }`
     - **Monk 1:** `{ mode: 'exact_choices', choices: ['Improved Grapple', 'Stunning Fist'], bypassPrereqs: true }`
     - **Monk 2:** `{ mode: 'exact_choices', choices: ['Combat Reflexes', 'Deflect Arrows'], bypassPrereqs: true }`
     - **Monk 6:** `{ mode: 'exact_choices', choices: ['Improved Trip', 'Snatch Arrows'], bypassPrereqs: true }`
     - **Wizard (5, 10, 15, 20):** `{ mode: 'category', categories: ['Metamagic', 'Item Creation'], allowFeats: ['Spell Mastery'] }`
2. **Karakter Sayfası Yuva Bağlama & Görselleştirme (`character.html`, `index.html`):**
   * `renderLevelProgression()`: Sınıf yuvası butonunun metni kontrata göre dinamikleşti:
     - Monk 1 için: `🥋 + Monk Feati (Improved Grapple / Stunning Fist)`
     - Wizard için: `🔮 + Wizard Bonus Feat`
     - Fighter için: `⚔️ + Bonus Feat Seç`
   * `checkFeatPrerequisites()`: Monk'un RAW kuralı gereğince (`bypassPrereqs: true`) kontrat kapsamındaki ikili hünerleri önkoşulsuz kazanması sağlandı (`✅ RAW Sınıf Muafiyeti`).
   * `renderQuickFeatSearchResults()`:
     - `exact_choices` modunda yalnızca ilgili seviyeye ait resmi seçenekler listelenir.
     - `category` modunda (Wizard) yalnızca Metamagic ve Item Creation hünerleri ile Spell Mastery listelenir.
3. **Parite ve Kural Standartları:**
   * 4 karakter dosyası (`character.html`, `index.html`, `webapp/character.html`, `webapp/index.html`) arasında **%100 SHA-256 hash paritesi** (`46910496...`) sağlandı.
   * 2 kural motoru dosyası (`rule_engine.js`, `webapp/rule_engine.js`) arasında **%100 SHA-256 hash paritesi** (`74de9861...`) sağlandı.
   * Tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.


---

## 91. SRD Core Veri Tabanında 45 PHB Fighter Bonus Feat Standardizasyonu & RuleEngine Slot Contract Senkronizasyonu

### Bağlam & Kök Neden
Karakter motorunda seviye ilerleme tablosunda yer alan **"Fighter Sınıf Bonus Feati"** hedef yuvası üzerinden arama yapıldığında, **Power Attack, Cleave, Combat Expertise, Dodge, Point Blank Shot** gibi en temel resmi D&D 3.5e savaşçı hünerleri listede çıkmıyordu. Kök neden olarak, `srd_core_catalog.json` ve `bundled_data.js` içindeki temel SRD kayıtlarında bu hünerlerin `"isFighterBonusFeat": true` ve `"category": "Fighter"` bayraklarının eksik olduğu tespit edilmişti.

### Yapılan Değişiklikler ve Mimari Uygulama
1. **SRD Core ve Bundled Veri Tabanı Güncellemesi (`srd_core_catalog.json` & `bundled_data.js`):**
   - Player's Handbook Tablo 5-1 (s. 98) uyarınca 45 resmi savaşçı hünerine kalıcı olarak `"isFighterBonusFeat": true` ve `"category": "Fighter"` eklendi:
     * **Güç / Yakın Dövüş Hattı:** *Power Attack, Cleave, Great Cleave, Improved Bull Rush, Improved Overrun, Improved Sunder*
     * **Taktik & Savunma Hattı:** *Combat Expertise, Improved Disarm, Improved Feint, Improved Trip, Whirlwind Attack, Combat Reflexes, Dodge, Mobility, Spring Attack, Improved Initiative*
     * **Silahsız / Grapple Hattı:** *Improved Unarmed Strike, Improved Grapple, Deflect Arrows, Snatch Arrows*
     * **Süvari Hattı:** *Mounted Combat, Mounted Archery, Ride-By Attack, Spirited Charge, Trample*
     * **Menzilli / Okçuluk Hattı:** *Point Blank Shot, Far Shot, Precise Shot, Rapid Shot, Manyshot, Shot on the Run, Improved Precise Shot*
     * **İki Silah Hattı:** *Two-Weapon Fighting, Two-Weapon Defense, Improved Two-Weapon Fighting, Greater Two-Weapon Fighting*
     * **Silah Uzmanlığı & Diğerleri:** *Weapon Focus, Weapon Specialization, Greater Weapon Focus, Greater Weapon Specialization, Improved Critical, Quick Draw, Rapid Reload, Blind-Fight, Exotic Weapon Proficiency, Tower Shield Proficiency*
   - `srd_core_catalog.json` top-level JSON array yapısı korundu (218 core nesne).
2. **Kural Motoru Yuva Kontratı Metodu (`rule_engine.js` & `webapp/rule_engine.js`):**
   - `DND35_CLASS_DEFS` içerisine Fighter, Monk, Wizard ve Warblade için katı bonus feat yuva kontratları işlendi.
   - `RuleEngine.getClassBonusFeatContract(className, classLevel)` yardımcı metodu eklendi.
   - `RuleEngine.getClassLevelFeatures(className, classLevel)` metodu bu kontratları döndürecek şekilde entegre edildi.
3. **Parite ve Kural Standartları:**
   - Kök dizindeki `srd_core_catalog.json`, `bundled_data.js`, `rule_engine.js` ile `webapp/` altındaki kopyaları arasında **%100 SHA-256 hash paritesi** sağlandı.
   - Tavla zarı emojisi (`U+1F3B2` / ) yasağı tavizsiz korundu.


---

## 92. %100 Kapalı PHB 1 Feat Kütüphanesinin Tamamlanması ve SRD Core Sınırının Çizilmesi (268 Kayıt)

### Bağlam & Mimari Karar
Temel karakter yaratımı ve seviye atlama süreçlerinde kullanıcıların en temel D&D 3.5e Player's Handbook (PHB 1) hünerlerini (Iron Will, Great Fortitude, Lightning Reflexes, Toughness, Extend Spell, Brew Potion vb.) arayıp bulamaması sistemde tutarsızlık ve asimetri hissi yaratıyordu. Veri tabanını splatbook'larla (PHB 2, Complete serisi) şişirmek yerine, **%100 Kapalı PHB 1 Çekirdeği (Zero-Splatbook Core)** stratejisi benimsendi.

### Yapılan Değişiklikler ve Veri Güncellemesi
1. **50 Yeni Temel PHB 1 Feati Eklendi (`srd_core_catalog.json` & `bundled_data.js`):**
   * **Kurtarma Zarları (Saves):** *Iron Will, Great Fortitude, Lightning Reflexes*
   * **Fiziksel & Hayatta Kalma:** *Toughness, Endurance, Diehard, Run*
   * **Büyücü & İlahi:** *Combat Casting, Spell Focus, Greater Spell Focus, Spell Penetration, Greater Spell Penetration, Spell Mastery, Natural Spell, Extra Turning, Augment Summoning*
   * **Metamagic:** *Empower Spell, Enlarge Spell, Extend Spell, Heighten Spell, Maximize Spell, Quicken Spell, Silent Spell, Still Spell, Widen Spell*
   * **Item Creation:** *Brew Potion, Craft Magic Arms and Armor, Craft Rod, Craft Staff, Craft Wand, Craft Wondrous Item, Forge Ring, Scribe Scroll*
   * **Beceri (+2/+2) Featleri:** *Acrobatic, Agile, Alertness, Athletic, Deceitful, Deft Hands, Diligent, Investigator, Magical Aptitude, Negotiator, Nimble Fingers, Persuasive, Self-Sufficient, Stealthy*
   * **Diğer Genel Featler:** *Track, Leadership, Skill Focus*
2. **Fighter Bonus Feat Düzeltmesi:**
   * `Weapon Finesse` hünerine PHB Tablo 5-1 uyarınca `"isFighterBonusFeat": true` ve `"category": "Fighter"` özellikleri uygulandı.
3. **Katalog Büyüklüğü & Parite:**
   * SRD Core kataloğu 218 öğeden **268 resmi D&D 3.5e RAW kaydına** (130 Feat, 80 Silah, 19 Zırh/Kalkan, 7 Temel Irk) ulaştı.
   * `srd_core_catalog.json` ve `bundled_data.js` dosyaları kök dizin ile `webapp/` arasında **%100 SHA-256 hash paritesiyle** eşitlendi.
   * Standart tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.


---

## 93. Gemini 3.1 Pro RAW Denetimi ve Katalog Arındırılması (267 Resmi Kayıt)

### Bağlam & Gerçekleştirilen RAW Düzeltmeleri
Gemini 3.1 Pro denetçisi tarafından gerçekleştirilen katı D&D 3.5e RAW denetimi sonucunda tespit edilen 6 madde başarıyla düzeltilmiş ve katalog arındırılmıştır:
1. **Sahte Feat Ayıklandı:** Resmi kurallarda yer almayan topluluk homebrew'u `Extra Readied Maneuver` katalogdan tamamen silindi (Kural #5: Sıfır Dummy/Uydurma Veri).
2. **Sudden Recovery:** Tome of Battle Tablo 2-1 uyarınca Fighter bonus feat olmadığı için `isFighterBonusFeat: false` yapıldı.
3. **Monkey Grip:** Complete Warrior s. 103 RAW kuralına göre çift elli silahların tek elle tutulamayacağı kuralı açıklama metnine işlendi.
4. **Shield Spikes Kalkan Çivisi Hafiflikleri:**
   * `Shield Spikes (Light Shield)`: `isLight: true`, `weaponType: "Martial Light"` olarak düzeltildi.
   * `Shield Spikes (Heavy Shield)`: `isLight: false`, `weaponType: "Martial One-Handed"` olarak düzeltildi.
5. **finessable: true Standardizasyonu:** `Rapier`, `Spiked Chain`, `Whip` ve tüm hafif yakın dövüş silahlarına açık boolean `finessable: true` özelliği eklendi.
6. **Karakter Kodlaması:** Çift başlı silah isimlerindeki `↳ ` ok işaretleri temiz UTF-8 olarak korundu.

### Parite ve Senkronizasyon
* Katalog **267 resmi D&D 3.5e RAW kaydına** (129 Feat, 80 Silah, 19 Zırh/Kalkan, 7 Temel Irk, 32 Invocations) donduruldu.
* `srd_core_catalog.json` ve `bundled_data.js` dosyaları kök dizin, `webapp/` ve `OneDrive/Mdk/` arasında **%100 SHA-256 hash paritesiyle** eşitlendi (`D022138DE0B676C3C8C6CD19B1390B667AB8C7473A1799DE2740A1379BDE9524`).
* Tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.


---

## 94. Gemini Smart Model Router (Flash/Pro Hibrit), Strict 3.5e RAW Guardrail ve DB Denetim Konsolu Entegrasyonu

### Bağlam & Mimari Tasarım
Projenin "hafif yerel DB + yapay zeka ile dinamik kütüphane" vizyonunda, canlı arayüz sorgularının hızını (0.5s) korurken kural otoritesini (RAW doğruluğu) güvenceye almak için 4 katmanlı akıllı yapay zeka yönlendirme mimarisi entegre edilmiştir.

### Yapılan Değişiklikler ve Yenilikler
1. **DND35_RAW_GUARDRAIL (Sistem Kalkanı Promptu - `rule_master.js`):**
   * Tüm AI sorgularının (`fetchSingleAiRuleObjects`, `queryAiFreeTextRows`, `callAiText`) başına resmi Wizards of the Coast 3.5e RAW zorunluluğu, sıfır 5e kuralı (Advantage, Bonus Action, Finesse Dex hasarı vb. yasağı) ve sıfır homebrew talimatı yerleştirildi.
2. **Göreve Dayalı Akıllı Model Yönlendiricisi (Smart Task Router):**
   * `RuleMaster.getModelsForTask(taskType)` ve `RuleMaster.getAvailableGeminiModels(apiKey, forceRefresh, taskType)`:
     - `QUICK_SEARCH` / `LEVEL_UP`: `gemini-1.5-flash-latest` (hızlı 0.5s yanıt).
     - `RULE_AUDIT` / `IMPORT_BATCH`: `gemini-1.5-pro-latest` (derin RAW muhakemesi).
     - Kullanıcı tercihi: `RuleMaster.getAiModelMode()` (`auto`, `flash`, `pro`).
3. **Kullanıcı Mod Seçimi ve Denetim Arayüzü (`index.html`, `character.html`):**
   * API Key durum çubuğuna şık bir **AI Modu Seçici** (`#ai-model-mode-select`: Akıllı Hibrit / Flash / Pro) eklendi.
   * **`[ 🛡️ DB Denetle (Pro) ]`** butonu ve `RuleMaster.auditLibraryWithProModal()` modalı devreye alındı. Kullanıcının `master_db` içindeki özel kayıtları tek tıkla Gemini Pro tarafından taranarak 3.5e RAW uygunluğu denetlenir.
4. **Parite ve Kural Standartları:**
   * 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`56ECCBA9...`) sağlandı.
   * 2 RuleMaster dosyası (`rule_master.js`, `webapp/rule_master.js`) arasında **%100 SHA-256 hash paritesi** (`4780DBD0...`) sağlandı.
   * Tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.



---

## 95. D&D 3.5e Sınıf Becerileri (Class Skills), Crusader Save & Bloodstorm Blade Stat RAW Standardizasyonu

### Bağlam & Kök Neden
Gemini 3.1 Pro RAW denetim motoru ile `index.html` içerisindeki `DND35_BASE_CLASS_DEFS` ve `rule_engine.js` içerisindeki `DND35_CLASS_DEFS` nesneleri taranmış; 27 sınıf arasında kurtarma zarı, seviye başı beceri puanı ve sınıf becerisi (`classSkills`) alanlarında resmi kural kitaplarına (PHB, DMG, Tome of Battle, PHB II, Complete serisi) aykırı sapmalar tespit edilmiştir.

### Yapılan Değişiklikler ve RAW Düzeltmeleri
1. **Kurtarma Zarı Düzeltmesi (Crusader):**
   * *Tome of Battle Tablo 1-1 (s. 9)* uyarınca Crusader sınıfının taban Will kurtarma zarı ilerlemesi "poor" (+0'dan başlar, 20. seviyede +6 olur). Kodda hatalı bulunan `will: "good"` ifadesi hem `index.html` hem de `rule_engine.js` üzerinde `will: "poor"` olarak düzeltildi. (2. seviyedeki *Indomitable Soul* yeteneği Cha modifikasyonunu ekler, ancak taban matris poor'dur).
2. **Beceri Puanı Düzeltmesi (Bloodstorm Blade):**
   * *Tome of Battle s. 100* uyarınca Bloodstorm Blade seviye başına **4 + Int** beceri puanı alır. Kodda 2 olarak yazılan `skills: 2` değeri `skills: 4` olarak güncellendi.
3. **11 Sınıfta Sınıf Becerileri (`classSkills`) Standardizasyonu:**
   * **Paladin:** RAW'da bulunan temel sosyal sezgi becerisi `sense_motive` eklendi (PHB s. 43).
   * **Cleric:** Sınıfın temelinde olmayan `k_nobility` kaldırıldı; resmi listede yer alan `k_arcana` eklendi (PHB s. 31).
   * **Crusader:** Stone Dragon disiplini sınıf becerisi olan `jump` eklendi (ToB s. 10).
   * **Swordsage:** Kitapta olmayan XPH kökenli `autohypnosis` kaldırıldı; resmi 4 Knowledge becerisinden eksik olan üçü (`k_history`, `k_nature`, `k_nobility`) eklendi (ToB s. 16).
   * **Duskblade:** Resmi listede yer alan `profession` eklendi (PHB II s. 19).
   * **Warlock:** Resmi listede yer alan `sense_motive` eklendi (Complete Arcane s. 8).
   * **Bloodstorm Blade:** Listeye fazladan girmiş olan `climb`, `survival`, `swim` kaldırıldı; ToB s. 100 RAW listesine tam eşitlendi (`balance`, `craft_alchemy`, `craft_armor`, `craft_weapon`, `intimidate`, `jump`, `martial_lore`, `tumble`).
   * **Assassin:** Yalnızca `craft_alchemy` eklenmişti; genel Craft (Int) gereği `craft_armor` ve `craft_weapon` eklendi (DMG s. 180).
   * **Dragon Disciple:** RAW'da olmayan `climb`, `jump`, `swim` kaldırıldı; resmi listede yer alan `spellcraft` ve tüm Knowledge dalları (`k_arch`, `k_dungeon`, `k_geo`, `k_history`, `k_local`, `k_nature`, `k_nobility`, `k_religion`, `k_planes`) eklendi (DMG s. 183).
   * **Spellsword:** RAW kuralında hiç yer almayan `craft` alt dalları ve `swim` kaldırıldı; resmi tüm Knowledge dalları eklendi (Complete Warrior s. 79).
   * **Jade Phoenix Mage:** Giriş önkoşulları sınıf becerisi sanılarak yanlış girilmişti; liste ToB s. 114 RAW kuralına göre tamamen düzeltildi: `["climb", "concentration", "diplomacy", "handle_animal", "intimidate", "jump", "martial_lore", "ride", "sense_motive", "tumble"]`.
4. **Craft (alchemy) Becerisi ve Büyücü Kısıtlaması:**
   * `DND35_CORE_SKILLS` içinde `craft_alchemy` becerisi PHB s. 70 RAW kuralına göre güncellendi: `untrained: false, note: "Simya eşyası üretmek için eğitimli (trained) ve spellcaster (CL 1+) olmak şarttır (PHB p.70)."`
5. **Parite ve Kural Standartları:**
   * 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`3292D6A1...`) sağlandı.
   * 2 RuleEngine dosyası (`rule_engine.js`, `webapp/rule_engine.js`) arasında **%100 SHA-256 hash paritesi** (`07CD40F0...`) sağlandı.
   * Tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.



---

## 96. 'Sınıf & Herkes' Filtre Genişlemesinin Geri Alınması (Sınıf Filtresinin Katı İzolasyonu)

### Bağlam & Kullanıcı Geri Bildirimi
Sınıf filtresine eğitimsiz atılabilen (untrained) becerilerin de dahil edilmesi ("⭐ Sınıf & Herkes"), 46 becerinin yaklaşık 35-40 tanesini aynı anda ekranda göstererek **"Tümü" filtresiyle olan farkı neredeyse tamamen ortadan kaldırmıştır.** Kullanıcının haklı tespiti ve talebi üzerine bu değişiklik derhal geri alınmıştır.

### Yapılan Değişiklikler ve İzolasyon
1. **Filtre Mantığının Katı RAW Moduna Dönüşü:**
   * `activeSkillFilter === 'class'` filtresi yeniden yalnızca `displayItems.filter(item => item.isClass)` şartını arayacak şekilde izole edildi (`untrained` veya `ranks > 0` olan diğer çapraz beceriler elendi).
2. **Buton Arayüzü:**
   * Buton etiketi yeniden sade ve standart **`⭐ Sınıf (Class)`** haline getirildi.
3. **Parite ve Kural Standartları:**
   * 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`3292D6A1...`) korundu.
   * Tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.


---

## 97. Bulut Senkronizasyonu Bütüncül Durum Koruması (LWW & Anında İtme Mimarisi)

### Bağlam & Hata Tespiti
Karakter 1 HP durumundayken Uzun Dinlenme (Long Rest) yapıldığında can D&D 3.5e RAW doğal iyileşme seçeneğiyle 5 HP (+4 Seviye HP) olmuş; ancak birkaç saniye sonra ekrandaki can kendiliğinden tekrar 1 HP'ye geri dönmüştür.

Yapılan kök neden analizinde (`gdrive_sync.js`):
1. **Canlı Yoklama Yarış Durumu (Race Condition):** Arka planda her 8 saniyede bir çalışan canlı yoklama (`CloudSync.startLiveSyncPolling(8000)`), oyuncunun dinlenme işleminden sonraki 2.5 saniyelik debounced kayıt aralığında tetiklenerek buluttaki henüz güncellenmemiş eski paketi (1 HP) çekmiştir.
2. **applyRemotePayload Zaman Damgası Körlüğü:** Buluttan gelen veri ile yerel veri karşılaştırılırken yalnızca `localDmTs > cloudDmTs` (DM canı) kontrol edilmiş; oyuncunun yaptığı değişiklikleri belirten `_lastPlayerChangeTs` ve `character.lastModified` damgaları yok sayılmıştır.
3. **Bütüncül Durum Tehlikesi (Büyü & Manevralar):** Bulut paketi yerel karakter nesnesini toptan sildiğinden (`Object.assign(character, foundInCloudHub.fullData)`), yalnızca can değil; dinlenmeyle tazelenen büyü yuvaları (`spellcasting`), Tome of Battle manevraları (`tomeOfBattle.readiedManeuvers`), günlük eşya şarjları ve debuff temizlikleri de eski (tüketilmiş) haline geri çekilmekteydi.

### Uygulanan Mimari Çözümler
1. **Bütüncül Zaman Damgası Koruması (LWW - Last-Write-Wins):**
   * `gdrive_sync.js` içindeki `applyRemotePayload` fonksiyonunda yerel karakter zaman damgası (`localEffectiveTs = Math.max(localModifiedTs, localPlayerHpTs, localDmTs)`) ile bulut verisi (`cloudEffectiveTs = Math.max(cloudCharModifiedTs, cloudCharPlayerHpTs, cloudCharSavedTs, cloudPayloadTs)`) karşılaştırılması getirildi.
   * Yerel durum buluttan daha güncelse (`localEffectiveTs > cloudEffectiveTs + 500`), buluttaki eski kayıt **karakter durumunu (HP, Büyüler, Manevralar, Bufflar) ASLA ezemez**.
   * Yalnızca DM tarafından gönderilmiş daha yeni bir uzaktan can müdahalesi (`cloudDmTs > localDmTs`) varsa can uzlaştırılır (reconciliation); yereldeki taze durum ise buluta geri itilir.
2. **Kritik Eylemlerde Anında Bulut İtme (pushImmediate - Zero Debounce):**
   * `CloudSync.pushImmediate()` metodu eklendi.
   * `executeLongRest()`, `executeShortRest()`, `restoreAllSpellSlots()` ve `recoverAllManeuvers()` fonksiyonlarında işlem tamamlandığı milisaniyede `pushImmediate()` tetiklenerek 2.5 saniyelik bekleme iptal edildi ve yarış durumu sıfırlandı.
3. **Büyü & Manevra Toptan Yenileme Entegrasyonu:**
   * `restoreAllSpellSlots()` fonksiyonu yalnızca spontane yuvaları değil, hazırlanan (`preparedSlots`) ve ilahi (`divineSlots`) yuvaları da sıfırlayacak şekilde güçlendirildi.
   * `recoverAllManeuvers()` fonksiyonuna `character.lastModified` ve anında bulut itme bağlandı.

### Parite ve Hash Durumu
* 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`C7F4198AE3937D8B3EB613D1F18C53EB3CBFE1C12904DA5BD7CD70BB62401A8A`) sağlandı.
* 2 CloudSync dosyası (`gdrive_sync.js`, `webapp/gdrive_sync.js`) arasında **%100 SHA-256 hash paritesi** (`807466BF94822F56CA2BA34DE162B02DCEAB9B959469EB6FB927E75DD2A04951`) sağlandı.
* Tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.


---

## 98. Seviye İlerleme HP Standardizasyonu (1. Seviye RAW Maksimum & Yeni Seviyelerde Dinamik Can Zarı)

### Bağlam & Kullanıcı Talebi
Karakter sayfasında Seviye Planlayıcı tablosunda her seviyenin HP sütununa sabit ortalama değer (+4) yazıldığı görülmüştür. Kullanıcı talebi doğrultusunda:
1. **1. Seviye RAW Maksimum Kuralı:** D&D 3.5e RAW (PHB s. 22) gereği karakterlerin 1. seviyede can zarını atmayarak Hit Die tam (maksimum) değerini alması kuralı kesinleştirildi.
2. **Yeni Seviyelerde Zar Yuvarlama:** 2. seviye ve üzerindeki her yeni seviye ekleme işleminde (`addNewLevelRowToProgression`, Level Up Modalı, Sınıf Değiştirme Modalı) otomatik ortalama yerine dinamik rastgele can zarı (`1d[HD]`) yuvarlama standardı tesis edildi.

### Yapılan Değişiklikler
1. **1. Seviye RAW Otomatik İyileştirme (`renderLevelProgression`):**
   * Tablo oluşturulurken `prog[0]` kontrol edilir; eğer 1. seviyenin `hpGain` değeri ilgili sınıfın Hit Die değerinden (`def.hd`) farklıysa, otomatik olarak sınıfın tam zarına (örn: Rogue için 6 HP) yükseltilir ve aradaki fark karakterin maksimum canına eklenir.
2. **Dinamik Can Zarı Atımı (`addNewLevelRowToProgression`):**
   * "+ Yeni Seviye Ekle" butonuna basıldığında:
     * `nextLvl === 1` ise tam zar (`def.hd`).
     * `nextLvl > 1` ise rastgele can zarı (`Math.floor(Math.random() * def.hd) + 1`).
   * Zarı atan oyuncuya görsel bilgi top toast bildirimi (`⚡ Can Zarı Atıldı: 1d[HD] ➔ X (+ CON)`) gösterilir.
3. **Seviye Atlama & Sınıf Düzenleme Modalları:**
   * `onLevelUpClassChange()` ve `onChangeClassSelectChange()` fonksiyonlarında 1. seviye her zaman `max`, 2. seviye ve sonrası varsayılan olarak `roll` modunda başlatılır.

### Parite ve Hash Durumu
* 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`C36CD4AAC7DBC8F5D9C3D7E00C55AF6453E54F6D0C58B978621A51A80F9396F6`) sağlandı.
* Tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu (`⚡` sembolü kullanıldı).


---

## 99. Feat Arama Motorunda Alaka Puanlaması (Search Relevance Ranking)

### Bağlam & Hata Tespiti
Karakter sayfasında Feat Arama Konsolunda (Spotlight) kullanıcı `"Dodg"` kelimesini aradığında, *Combat Expertise* feat'i kural açıklamasında *"dodge bonus"* kelimesi geçtiği ve alfabetik olarak C harfi D harfinden önce geldiği için, doğrudan adı *Dodge* olan feat'in üstünde listelenmekteydi.

### Yapılan Geliştirmeler
1. **getFeatSearchRelevance(item, query) Algoritması:**
   * Arama motoruna hiyerarşik alaka düzeyi (Relevance Scoring) puanlama mekanizması entegre edildi:
     * **Birebir İsim Eşleşmesi (`name === query`):** 10.000 Puan
     * **İsimle Başlama (`name.startsWith(query)`):** 5.000 Puan (örn: `"dodge"` kelimesi `"dodg"` ile başlar)
     * **İsimdeki Bir Kelimenin Başlaması (örn: `"Improved Dodge"`):** 3.000 Puan
     * **İsim İçinde Geçme (`name.includes(query)`):** 1.000 Puan
     * **Açıklama / Benefit İçinde Geçme (örn: *Combat Expertise*):** 100 Puan
     * **Önkoşul / Prereq İçinde Geçme:** 50 Puan
     * **Kaynak / Source İçinde Geçme:** 20 Puan
2. **Sıralama Entegrasyonu:**
   * Hem Seviye Atlama Modalı (`renderLevelUpFeatSearchResults`) hem de Hızlı Feat Seçici (`renderQuickFeatSearchResults`) sıralama algoritmalarında alaka puanı entegre edildi.
   * Aynı yeterlilik seviyesindeki (Qualified / Alınabilir) featler arasında daha yüksek arama skoruna sahip olan doğrudan ilk sıralara taşınır; skorlar eşitse alfabetik sıralamaya geçilir.
   * Böylece `"Dodg"` yazıldığında adı doğrudan *Dodge* olan feat her zaman 1. sırada yer alır.

### Parite ve Hash Durumu
* 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`208FFFA58ED77DD31AA678E3E6AF7927A787C64BA98F6AFFD872FF2618DB14DB`) sağlandı.
* Tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.


---

## 100. Seviye Gelişimi Tablosu HP Özetinde Dayanıklılık (CON) Bonusu Gösterimi

### Bağlam & Kullanıcı Talebi
Karakter sayfasındaki Seviye Gelişimi (Level Progression) tablosunun üst özet çubuğunda (`#level-progression-hud`) sadece taban can zarlarının toplamı (`HP: +16`) listelenmekte, karakterin Seviye Başına Dayanıklılık (Constitution) çarpanı ve bundan kaynaklanan toplam can katkısı açıkça gösterilmemekteydi.

### Yapılan Geliştirmeler
1. **HUD Özet Çubuğu (`#level-progression-hud`) Genişletmesi:**
   * `renderLevelProgression()` içinde `conVal` ve `conMod` dinamik olarak hesaplandı:
     * `totalConHp = summary.activeLevels * conMod`
     * `totalMaxHp = Math.max(summary.activeLevels, summary.baseHp + totalConHp)`
   * Özet etiketinde taban HP'nin hemen yanında net CON katkısı ve sonuç toplamı formatlandı:
     `HP: +${summary.baseHp} (+X Con = Y)` (Örn: `HP: +16 (+8 Con = 24)`).
   * Etiketin üzerine gelindiğinde (hover / title) detaylı formül açıklaması eklendi:
     `Taban Can Zarları: 16 + CON Bonusu: +8 (4 Seviye x +2) = Toplam 24 HP`
2. **Tablo Satırları Tooltip Zenginleştirmesi:**
   * Tablodaki her bir seviye satırının `HP` hücresine (`+4`), o seviyeye ait CON bonusunu ve seviyenin toplam net artışını gösteren açıklayıcı tooltip entegre edildi:
     `title="Seviye Can Zarı: +4 | Con: +2 (Bu Seviye: +6)"`

### Parite ve Hash Durumu
* 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`F41A56461361189299E4811F99A7DAC00AAC3E23291AD0DA1649C9D930A60EA2`) sağlandı.
* Tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.


---

## 101. Ana Can Göstergesindeki (+X CON) İfadesinin Temizlenmesi

### Bağlam & Kullanıcı Talebi
Ana karakter sayfası ve mobil kokpitteki CAN (HP) kartında yer alan `5 / 24 (+8 CON)` gösterimindeki `(+8 CON)` ibaresi, seviye gelişimi tablosunda zaten detaylı olarak gösterildiğinden ve ana can kartında gereksiz görsel kalabalık oluşturduğundan kaldırılması talep edildi.

### Yapılan Geliştirmeler
1. **Can Kartı (`#hp-bonus-tag`) Gizlendi:**
   * HTML şablonundaki `hp-bonus-tag` etiketine `hidden` sınıfı verildi.
   * `renderAttributes()` / can güncelleme fonksiyonunda `hpBonusTag` temizlendi ve gizlendi.
2. **Hover Tooltip Zenginleştirmesi:**
   * Görsel kalabalık tamamen giderilirken, ihtiyaç anında masaüstünde fareyle maksimum can (`#hp-max-display`) üzerine gelindiğinde taban can ve CON katkısı tooltip olarak okunabilir bırakıldı (`Maksimum Can: 24 (Taban: 16 +8 CON)`).

### Parite ve Hash Durumu
* 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`89A66C38FFB534D3A08FB3B3F208F24441AC0677B35144C49425A9B14E28AFBB`) sağlandı.
* Tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.


---

## 102. Irksal Stat Modifiyerlerinin Sayfa Senkronizasyonu Sonrası Sıfırlanması Sorununun Çözümü (Elf CON/DEX)

### Bağlam & Hata Tespiti
Kullanıcı Elf ırkını seçtiğinde taban CON 15 iken, sayfa yüklenme aşamasında (`🔄 Eşitleniyor...`) Elf'in resmi -2 CON cezası doğru şekilde uygulanarak panelde `CON 13 (+1)` ve `DEX 18 (+4)` gösterilmekteydi. Ancak Google Drive senkronizasyonu tamamlandığında veya `masterDb` veri tabanı hafızaya yüklendiğinde (`🟢 Senkron`), CON tekrar 15'e (+2) çıkıyor, DEX 16'ya (+3) düşüyor ve irksal modifiyer rozetleri (`Elf (Irk) -2`) kayboluyordu.

### Kök Neden (Root Cause)
`rule_engine.js` içindeki `RuleEngine.recalculateCharacter()` fonksiyonunda (satır 2145):
```javascript
const raceCatalog = (Array.isArray(masterDb) && masterDb.length) 
  ? masterDb 
  : ((typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) ? window.BUNDLED_SRD_CORE_CATALOG : []);
```
* Sayfa ilk açılırken `masterDb` henüz yüklenmemiş olduğundan (`masterDb = []`), `raceCatalog` olarak `BUNDLED_SRD_CORE_CATALOG` kullanılıyor ve "Elf" kaydı bulunup -2 CON / +2 DEX statlara işleniyordu.
* Senkronizasyon bitip `masterDb` yüklendiğinde (`masterDb.length > 1000`), `raceCatalog` doğrudan `masterDb` oluyordu. Ancak `master_db.json` verisi büyü, eşya, manevra ve featlerden oluştuğu, ırkların ise `BUNDLED_SRD_CORE_CATALOG` içinde tutulduğu için `masterDb` içinde "Elf" kaydı bulunamıyordu (`raceObj = undefined`).
* Sonuç olarak karakterin `abilityBuckets` havuzundaki irksal modifiyerler siliniyor, CON taban 15'e, DEX taban 16'ya geri dönüyor ve can hesabı da +2 Con bonusu üzerinden hatalı hesaplanıyordu.

### Yapılan Geliştirmeler
1. **Kademeli Irk Arama (Fallback Hierarchy):**
   * `rule_engine.js` içindeki ırk arama mantığı kademeli kontrol hiyerarşisine dönüştürüldü:
   ```javascript
   const raceObj = (Array.isArray(masterDb) ? masterDb.find(m => m && (m.type === 'Race' || String(m.type).toLowerCase() === 'race') && (m.name || '').toLowerCase().trim() === curRaceName) : null)
     || ((typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) ? window.BUNDLED_SRD_CORE_CATALOG.find(m => m && (m.type === 'Race' || String(m.type).toLowerCase() === 'race') && (m.name || '').toLowerCase().trim() === curRaceName) : null)
     || ((typeof globalThis !== 'undefined' && Array.isArray(globalThis.BUNDLED_SRD_CORE_CATALOG)) ? globalThis.BUNDLED_SRD_CORE_CATALOG.find(m => m && (m.type === 'Race' || String(m.type).toLowerCase() === 'race') && (m.name || '').toLowerCase().trim() === curRaceName) : null);
   ```
   * Böylece `masterDb` yüklense dahi, eğer ırk `masterDb` içinde yoksa anında `BUNDLED_SRD_CORE_CATALOG` kataloğuna bakılarak resmi ırk kaydı ve stat modifiyerleri (%100 kalıcı olarak) korunur.
2. **Karakter ve Can Hesaplama Bütünlüğü:**
   * Senkronizasyon sonrasında da CON 13 (+1 mod) ve DEX 18 (+4 mod) olarak sabit kalır; `Elf (Irk) (-2)` ve `Elf (Irk) (+2)` rozetleri kaybolmaz.
   * Can puanı, kurtarma zarları ve AC hesaplamaları bu resmi statlar üzerinden kesintisiz çalışır.

### Parite ve Hash Durumu
* `rule_engine.js` = `webapp/rule_engine.js` (**SHA-256:** `1DF6B41022B21756DE1F2A677958F4A0FC64FEA6ACDB608BC966FBAF7E57122F`)
* Tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.


---

## 103. Envanter Havuzunda Mobilde Eşya Ekleme Butonunun Alt Satıra Alınması

### Bağlam & Kullanıcı Talebi
Karakter sayfasının Çanta / Envanter sekmesindeki "Envanter ve Ekipman Havuzu (Gear Pool)" başlığında yer alan arama çubuğu ve kategori filtresi, mobil ekran genişliğini tamamen kapladığı için `➕ Yeni Eşya Ekle` butonu ekranın sağ dışına taşmakta ve mobilde görünmemekteydi.

### Yapılan Geliştirmeler
1. **Duyarlı (Responsive) Yerleşim İyileştirmesi:**
   * Envanter havuzu başlık alanı (`flex-col sm:flex-row`) esnek yapıya kavuşturuldu.
   * Mobilde (<640px):
     * 1. Satır: `🎒 ENVANTER VE EKİPMAN HAVUZU (GEAR POOL)` başlığı.
     * 2. Satır: `[ Havuzda ara... ]` arama kutusu ve `[ Tüm Kategoriler ]` filtre açılır menüsü satırı tam dolduracak şekilde yan yana.
     * 3. Satır: `➕ Yeni Eşya Ekle` butonu alt satıra taşındı, tam genişlik (`w-full`) ve parmakla dokunmaya uygun ferah bir buton haline getirildi.
   * Masaüstünde (>=640px):
     * Başlık solda, arama kutusu, kategori filtresi ve eşya ekleme butonu sağda tek satırda kompakt görünümünü korur (`sm:flex-row sm:w-auto`).

### Parite ve Hash Durumu
* 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`EB655E60311EDB9818A406782AC95852B571C9F37920EF5F44EDAC5752DD228D`) sağlandı.
* Tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.


---

## 104. Envanter Arama Havuzunda Feat ve Yeteneklerin Listelenmesi Sorununun Giderilmesi

### Bağlam & Hata Tespiti
Kullanıcı "Envantere Eşya Ekle" (Add Pool Item) modalında bir eşya arattığında (örneğin `"St"` yazdığında), *Dodge* ve *Mobility* gibi karakterin veya veritabanının Feat (Hüner) ve Yetenek kayıtları, kategori olarak `"Other"`, ağırlık ve bedel olarak `"0 lbs / 0 gp"` şeklinde eşya arama listesinde listelenmekteydi.

### Kök Neden (Root Cause)
1. Karakter seviye atladığında veya yeni bir feat seçildiğinde, bu featler genel referans havuzu olarak `masterDb`'ye `type: 'Feat'` olarak kaydedilmekteydi.
2. Ancak "Envantere Eşya Ekle" modalının arama motoru olan `executePoolMasterDbSearch(query)` fonksiyonu, `masterDb` içindeki kayıtları ararken eşya tipi filtresinden (`isEquipmentOrGear`) geçirmiyor; ismi veya açıklamasında aranan harfler geçen her şeyi (büyü, feat, manevra vb.) ham olarak döndürüyordu.
3. `isEquipmentOrGear` yardımcı fonksiyonu da `type: 'Feat'` veya `type: 'Special Ability'` gibi tipleri açıkça hariç tutacak katı bir tip eleme kuralına sahip değildi.

### Yapılan Geliştirmeler
1. **Katı Eşya Tipi İzolasyonu (`isEquipmentOrGear`):**
   * Fonksiyona resmi D&D 3.5e kural izolasyonu getirildi:
   * `feat`, `special ability`, `spell`, `maneuver`, `stance`, `warlock invocation`, `race`, `class`, `skill`, `domain` vb. eşya olmayan tüm kural nesneleri istisnasız `false` döndürülerek engellendi.
   * Yalnızca geçerli eşya tipleri (`weapon`, `armor`, `shield`, `potion`, `ring`, `wondrous`, `consumable`, `scroll`, `wand`, `rod` vb.) ve vücut yuvası/ağırlığı/fiyatı olan gerçek nesneler eşya olarak kabul edildi.
2. **Arama Motoruna Filtre Entegrasyonu (`executePoolMasterDbSearch`):**
   * Arama motorunda `allDb.filter(...)` aşamasında `isEquipmentOrGear(item)` şartı zorunlu kılındı.
   * Ayrıca `masterDb`'ye ek olarak yerel çekirdek SRD kataloğundaki (`BUNDLED_SRD_CORE_CATALOG`) eşyalar da (silahlar, zırhlar, kalkanlar) arama havuzuna dahil edildi.
   * Artık `"St"` veya herhangi bir kelime arandığında sadece Staff, Studded Leather vb. gerçek eşyalar listelenir; Featler kesinlikle envanter aramasına sızamaz.

### Parite ve Hash Durumu
* 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`51BE9EB0E55C22C92ACA2C6D861F9F55319B596E32B1C273630E25966ADA7CE5`) sağlandı.
* Tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.



---

## 97. Gemini Model Router: Jenerik Takma Adlar (Aliases) ve AbortController Zaman Aşımı Mimarisi

### Bağlam & Kök Neden
Kullanıcı aramalarında (`"Cloak of protection +1"` vb.) model sorgularının `gemini-flash-latest` aşamasında asılı kalması ve sonsuz spinner döngüsüne girmesi incelenmiştir. Kök neden olarak, hardcoded sürüm isimlerinin (`1.5-flash-latest`) API tarafında 404/kota hatası üretmesi ve ardından gelen isteklerde `AbortController` zaman aşımı bulunmadığı için arayüzün kilitlendiği tespit edilmiştir.

### Yapılan Değişiklikler ve Mimari İyileştirmeler
1. **Jenerik Model Takma Adları (Generic Aliases):**
   * Sürüm sabitlemeleri (`1.5-flash-8b`, `1.5-pro-latest` vb.) kaldırıldı. Google'ın daimi güncel kalan resmi jenerik alias'ları önceliklendirildi:
     * **Hızlı Arama Havuzu (`QUICK_SEARCH` / `flash`):** `['gemini-flash-latest', 'gemini-flash', 'gemini-1.5-flash']`
     * **Derin Denetim Havuzu (`RULE_AUDIT` / `pro`):** `['gemini-pro-latest', 'gemini-pro', 'gemini-1.5-pro']`
2. **Dinamik Canlı Keşif (Live Model Discovery):**
   * `RuleMaster.getAvailableGeminiModels(apiKey)` metodu Google'ın `/v1beta/models` endpoint'ini 3.5 saniyelik timeout ile tarayarak o API anahtarına açık olan modelleri dinamik keşfeder; jenerik alias'ları başa alarak optimize kuyruk oluşturur.
3. **AbortController Zaman Aşımı (Timeout) Koruması:**
   * `fetchSingleAiRuleObjects`: Model başına 7.5s AbortController timeout'u.
   * `queryAiFreeTextRows`: Model başına 10s AbortController timeout'u.
   * `callAiText`: Model başına 12s AbortController timeout'u.
   * Bir model yanıt vermez veya takılırsa, kullanıcı sonsuza kadar beklemez; sistem otomatik olarak o modeli kesip anında bir sonraki yedek modele geçer.
4. **Parite ve Kural Standartları:**
   * 2 RuleMaster dosyası (`rule_master.js`, `webapp/rule_master.js`) arasında **%100 SHA-256 hash paritesi** (`403ACCCDDD...`) sağlandı.
   * Tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.



---

## 98. 3 Temel Kullanım Alanı İçin 1 Asıl + 1 Yedek (6 Yuvalı Sürümden Bağımsız Model Matrisi)

### Bağlam & Mimari Karar
Google API model listesinde 16 farklı deneysel/önizleme modelinin kuyruğa girmesi ve gelecekte `1.5` sürümleri kapatıldığında kodun çökme riski ele alınmıştır. Yapay zekanın projedeki 3 temel kullanım alanı netleştirilmiş; her alan için **1 Asıl + 1 Yedek (Toplam 6 yuva)** kuralı getirilmiş ve tüm geçici sürüm numaraları koddan ayıklanarak daimi Google Rolling Aliases yapısına geçilmiştir.

### Yapılan Değişiklikler ve AI_TASK_ROUTING Matrisi
1. **3 Görev Bazlı 1 Asıl + 1 Yedek Çifti (`AI_TASK_ROUTING`):**
   * **1. Hızlı Arama & Seviye Atlama (`QUICK_SEARCH`):**
     * Asıl: `gemini-flash-latest` (Daimi güncel en hızlı motor)
     * Yedek: `gemini-flash` (Kararlı genel takma ad)
   * **2. Kütüphane & Kural Denetimi (`RULE_AUDIT`):**
     * Asıl: `gemini-pro-latest` (Daimi güncel derin akıl yürütme motoru)
     * Yedek: `gemini-pro` (Kararlı genel pro takma adı)
   * **3. Toplu İçe Aktarım & Serbest Metin Ayrıştırma (`IMPORT_BATCH`):**
     * Asıl: `gemini-flash-latest` (Hızlı yapısal JSON motoru)
     * Yedek: `gemini-pro-latest` (Karmaşık metinler için derin Pro yedeği)
2. **Kuyruk Şişmesinin Engellenmesi:**
   * Google'dan dönen 16 deneysel preview modeli ayıklanarak kuyruk tam **2 modele (1 Asıl + 1 Yedek)** sabitlendi.
   * Maksimum arama bekleme süresi en kötü senaryoda $2 \times 7.5 = 15$ saniyeye indirildi.
3. **Parite ve Kural Standartları:**
   * 2 RuleMaster dosyası (`rule_master.js`, `webapp/rule_master.js`) arasında **%100 SHA-256 hash paritesi** (`CFAD40EB...`) sağlandı.
   * Tavla zarı emojisi (U+1F3B2) yasağı tavizsiz korundu.

---

## 99. Google API 2.5 Emekliliği & Dinamik Semantik Sürüm Sıralayıcısı (Gemini 3.8 Geçişi)

### Bağlam & Karşılaşılan Sorun
Google Generative Language API'si, `gemini-2.5-flash` modelini yeni kullanıcılara kapatarak şu resmi yanıtı döndürmüştür:
> *"This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash for the latest features and improvements."*

Ayrıca `gemini-flash-latest` alias'ı REST API doğrudan çağrılarında 404 döndürmekte ve Google API `/v1beta/models` endpoint'i modelleri alfabetik/çıktı sırasıyla getirdiğinde eski modeller (2.5) listenin başında yer almaktaydı.

### Çözüm & Mimari Yenilik
1. **Dinamik Sürüm Ayrıştırıcısı (`parseVersion`):**
   * `RuleMaster.getAvailableGeminiModels` içerisine regex tabanlı `parseVersion(name)` eklendi (`gemini-(\d+(?:\.\d+)?)-`).
   * İlgili modeller (`flash` ve `pro`) sürüm numarasına göre **büyükten küçüğe (`b - a`)** dinamik olarak sıralandı:
     * `3.8 > 3.7 > 3.6 > 3.5 > 2.5`
2. **Aktif Model Eşleşmesi (1 Asıl + 1 Yedek):**
   * **Hızlı Arama (`QUICK_SEARCH`):**
     * Asıl: `gemini-3.8-flash` (En yüksek sürüm)
     * Yedek: `gemini-3.7-flash` (Kararlı ikinci sürüm)
   * **Derin Kural Denetimi (`RULE_AUDIT`):**
     * Asıl: `gemini-3.8-pro`
     * Yedek: `gemini-3.5-pro`
   * **Toplu İçe Aktarım (`IMPORT_BATCH`):**
     * Asıl: `gemini-3.8-flash`
     * Yedek: `gemini-3.8-pro`
3. **Geleceğe Hazırlık (Zero-Maintenance):**
   * Google yarın `gemini-3.9` veya `gemini-4.0` yayınladığında, kod tek bir satır değişmeden otomatik olarak en yüksek sürümü `primary` olarak seçecektir.
4. **Parite ve Kural Doğrulaması:**
   * `rule_master.js` ile `webapp/rule_master.js` arasında **%100 SHA-256 hash paritesi** (`F95BE535...`) sağlandı.
   * Tavla zarı emojisi yasağı (Rule 3) tavizsiz korundu.

---

## 100. 6 Yuvalı Mimari Tanı Modalı & Tam Matris Raporlaması

### Bağlam & Kullanıcı Geri Bildirimi
Kullanıcı, Ayarlar menüsündeki Tanı & Test butonuna bastığında yalnızca varsayılan Hızlı Arama modellerini (`gemini-3.8-flash` & `gemini-3.7-flash`) gördüğünü ve derin denetim için ayrılan Pro modellerinin ekranda yer almadığını belirtmiştir.

### Çözüm & Yapılan Geliştirmeler
1. **`RuleMaster.getAiArchitectureDiagnostics(apiKey)` Metodu:**
   * Google API'yi tek bir seferde sorgulayarak keşfedilen modelleri önbelleğe alan ve ardından sistemdeki 3 temel görevin (`QUICK_SEARCH`, `RULE_AUDIT`, `IMPORT_BATCH`) 1 Asıl + 1 Yedek (toplam 6 yuva) model dağılımını hesaplayan yapı eklendi.
2. **`RuleMaster.showDiagnosticsModal(apiKey)` Entegrasyonu:**
   * Tanı modalı tüm görevlerin ve modellerin net bir şekilde dökümünü yapacak şekilde yapılandırıldı:
     * ⚡ **1. Hızlı Arama & Seviye Atlama:** Asıl (`gemini-3.8-flash`) + Yedek (`gemini-3.7-flash`)
     * 🔮 **2. Kütüphane & RAW Kural Denetimi:** Asıl (`gemini-3.8-pro`) + Yedek (`gemini-3.5-pro`)
     * 📋 **3. Toplu İçe Aktarım & Tablo Ayrıştırma:** Asıl (`gemini-3.8-flash`) + Yedek (`gemini-3.8-pro`)
3. **Parite ve Eşitlik Doğrulaması:**
   * 4 HTML dosyası (`index.html`, `character.html`, `webapp/index.html`, `webapp/character.html`) arasında **%100 SHA-256 hash paritesi** (`73BBB2EB...`) sağlandı.
   * 2 Rule Master dosyası (`rule_master.js`, `webapp/rule_master.js`) arasında **%100 SHA-256 hash paritesi** (`A3810743...`) sağlandı.
   * Tavla zarı emojisi yasağı (Rule 3) tavizsiz korundu.

---

## 101. Flash-Lite Öncelikli Yüksek RPM Kota Mimarisi (Seçenek 1 Entegrasyonu)

### Bağlam & Kullanıcı Geri Bildirimi
Google Free Tier katmanında standart `gemini-3.8-flash` modelinin **5 RPM (dakikada 5 istek)** sınırına takılması ve hızlı eşya aramalarında `429 Quota Exceeded` hatası fırlatması üzerine kullanıcının tercihi doğrultusunda **Seçenek 1** uygulanmıştır.

### Çözüm & Yapılan Geliştirmeler
1. **Flash-Lite Modellerinin Filtreye Dahil Edilmesi:**
   * `apiModels` filtreleme mantığından `!lower.includes('lite')` istisnası kaldırılarak `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite` vb. hafif modeller keşfe açıldı.
2. **`QUICK_SEARCH` & `IMPORT_BATCH` Alanlarında Flash-Lite Önceliği:**
   * **1. Hızlı Arama & Seviye Atlama (`QUICK_SEARCH`):**
     * Asıl (Primary): `gemini-3.5-flash-lite` (Yüksek RPM kotası, 0ms'ye yakın ultra hızlı gecikme)
     * Yedek (Fallback): `gemini-3.8-flash` (Karmaşık aramalarda derin Flash motoru)
   * **2. Kütüphane & RAW Kural Denetimi (`RULE_AUDIT`):**
     * Asıl: `gemini-3.8-pro`
     * Yedek: `gemini-3.5-pro`
   * **3. Toplu İçe Aktarım (`IMPORT_BATCH`):**
     * Asıl: `gemini-3.5-flash-lite`
     * Yedek: `gemini-3.8-pro`
3. **Parite ve Eşitlik Doğrulaması:**
   * `rule_master.js` ile `webapp/rule_master.js` arasında **%100 SHA-256 hash paritesi** (`27AF5099...`) sağlandı.
   * Tavla zarı emojisi yasağı (Rule 3) tavizsiz korundu.

---

## 102. 3 Kademeli (Triple Fallback / 9 Yuvalı) Dayanıklılık Kalkanı

### Bağlam & Kullanıcı Geri Bildirimi
Google Generative AI sunucularındaki anlık küresel aşırı yüklenme (`HTTP 503: This model is currently experiencing high demand. Spikes in demand are usually temporary`) ve Free Tier 5 RPM kotası aynı anda tetiklendiğinde iki modelin de takılabilmesi riski bertaraf edilmiştir.

### Çözüm & Yapılan Geliştirmeler
1. **3 Kademeli Dayanıklılık Matrisi (Toplam 9 Yuva):**
   * **⚡ 1. Hızlı Arama & Seviye Atlama (`QUICK_SEARCH`):**
     * ⭐ 1. Asıl: `gemini-3.5-flash-lite` (Yüksek RPM, ultra hızlı 0ms gecikme)
     * 🔄 2. Yedek: `gemini-3.7-flash` (3.8'in 5 RPM kotasından bağımsız kararlı Flash)
     * 🛡️ 3. Kalkan: `gemini-3.8-flash` (En yüksek akıl yürütme kapasiteli derin motor)
   * **🔮 2. Kütüphane & RAW Kural Denetimi (`RULE_AUDIT`):**
     * ⭐ 1. Asıl: `gemini-3.8-pro`
     * 🔄 2. Yedek: `gemini-3.5-pro`
     * 🛡️ 3. Kalkan: `gemini-3.7-flash` (Pro modelleri meşgulse hızlı kalkan)
   * **📋 3. Toplu İçe Aktarım (`IMPORT_BATCH`):**
     * ⭐ 1. Asıl: `gemini-3.5-flash-lite`
     * 🔄 2. Yedek: `gemini-3.8-flash`
     * 🛡️ 3. Kalkan: `gemini-3.8-pro`
2. **Kusursuz Kesintisiz Çalışma (Fail-Safe Resilience):**
   * Bir model Google'dan 503 (yoğunluk) veya 429 (kota) aldığında, sistem kullanıcıya hiçbir hata hissettirmeden sırasıyla 2. ve 3. modellere geçiş yapar.
3. **Parite ve Güvenlik:**
   * `rule_master.js` ile `webapp/rule_master.js` arasında **%100 SHA-256 hash paritesi** (`7231CF41...`) sağlandı.
   * Tavla zarı emojisi (Rule 3) yasağı tavizsiz korundu.






---

## 105. Gemini Model Keşfinin Kalıcı Olarak Saklanması (0ms Latency) ve Kendi Kendini Onaran (Self-Healing) Mimari

### Bağlam & Kullanıcı Talebi
Kullanıcı AI sorgularında (seviye atlama, eşya/büyü arama) ilk denemede zaman aşımı / gecikme yaşandığını, 2. denemede ise anında yanıt geldiğini gözlemlemiştir. Bunun kök nedeni, model keşfinin (`_discoveredApiModels`) yalnızca tarayıcı RAM'inde tutulması ve her sayfa yenilemesinde ilk tıklamada 3.5s timeout ile Google API'ye canlı model listesi keşif isteği atılmasıdır. Kullanıcı, model keşfinin API anahtarı kaydedildiğinde bir kez yapılıp kalıcı olarak kaydedilmesini, normal kullanımda bu kaydın kullanılmasını ve yalnızca modeller tanınmadığında veya tanı istendiğinde güncellenmesini talep etmiştir.

### Yapılan Geliştirmeler
1. **Model Keşfinin Diske Yazılması (`localStorage` - `dnd35_gemini_discovered_models`):**
   * `RuleMaster.getAvailableGeminiModels()` fonksiyonu, `forceRefresh` olmadığı sürece modelleri doğrudan `localStorage`'dan **0ms gecikmeyle** okuyacak şekilde güncellendi.
   * Normal aramalarda ve seviye atlamada Google API'nin `models` uç noktasına kesinlikle ekstra keşif isteği atılmaz; doğrudan içerik üretimine (`generateContent`) geçilir.
2. **Ayarlar & Tanı Entegrasyonu:**
   * API anahtarı kaydedildiğinde (`verifySettingsGeminiApiKey(true)`) veya Ayarlar'daki *"Tanı & Model Kontrolü"* butonuna basıldığında `forceRefresh: true` ile keşif canlı tetiklenir, `5.0s` timeout ile Google'dan taranır ve `localStorage`'a kalıcı olarak kaydedilir.
   * API anahtarı silindiğinde veya değiştirildiğinde keşif önbelleği otomatik olarak temizlenir.
3. **Kendi Kendini Onaran Mimari (Self-Healing on 404):**
   * İleride Google kayıtlı modellerden birini emekliye ayırırsa (`HTTP 404 / Not Found`), sistem sessizce `dnd35_gemini_discovered_models` önbelleğini düşürür ve bir sonraki istekte modelleri otomatik olarak tazeleyip kendini onarır.
4. **Zaman Aşımı Optimizasyonu (Mobile Sweet-Spot):**
   * Model keşif süresi `3.5s` ➔ `5.0s` seviyesine çıkarılarak mobil ağlardaki el sıkışma payı güvenceye alındı.
   * Tekil model sorgu süresi `7.5s` ➔ `9.5s` seviyesine optimize edilerek mobil dalgalanmalarda gereksiz abort hataları engellendi.

### Parite ve Hash Durumu
* `rule_master.js` = `webapp/rule_master.js` (**SHA-256:** `321B0A331E63C2162BCE6BCEACBC3C50011EDBE0F2EBC451122DDC9BFF081273`)
* `character.html` = `index.html` = `webapp/character.html` = `webapp/index.html` (**SHA-256:** `C6A0FD171887FF34FD4E7E6390B26E5161A49BCE6F54D4DE4D13C1BD267D2840`)
* Tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korundu.


---

## 106. Sanal Flash Ailesi Çözümleyicisi (Virtual Generic Flash Resolver) & Yapay Zeka Canlı Model Optimizatörü

### Bağlam & Kullanıcı Talebi
Kullanıcı, gelecekte Google Gemini modelleri değiştikçe veya yeni sürümler çıktıkça, tanı (diagnostics) aracının canlı modelleri sorgulayıp D&D 3.5e web uygulaması için en uygun olanlarını otomatik seçecek bir yapay zeka promptu eklenmesini ve bu işlem için `gemini-flash` benzeri genel bir model ailesi yaklaşımının kullanılıp kullanılamayacağını sormuştur.

### Yapılan Geliştirmeler & Çözüm Mimarisi
1. **Resmi GA Varsayılanları (Official Baseline Routing):**
   * `AI_TASK_ROUTING` içerisindeki modeller, Google API'nin şu anki en kararlı ve resmi GA modellerine güncellendi:
     * `QUICK_SEARCH`: `gemini-2.0-flash-lite` (Asıl), `gemini-2.0-flash` (Yedek), `gemini-1.5-flash` (Kalkan)
     * `RULE_AUDIT`: `gemini-1.5-pro` (Asıl), `gemini-2.0-flash` (Yedek), `gemini-1.5-flash` (Kalkan)
     * `IMPORT_BATCH`: `gemini-2.0-flash-lite` (Asıl), `gemini-2.0-flash` (Yedek), `gemini-1.5-pro` (Kalkan)
2. **Sanal Flash Ailesi Çözümleyicisi (`findDynamicDiagnosticModel`):**
   * Google REST API'sinde doğrudan `gemini-flash` veya `gemini.flash` adında genel bir endpoint bulunmadığından (HTTP 404 döndürür), kullanıcının API anahtarından çekilen canlı modeller arasından en güncel, kararlı Flash modelini sürüm numarasına (`parseVersion`) göre otomatik yakalayan **sanal bir çözümleyici** entegre edildi. Gelecekte `gemini-2.5-flash` veya `gemini-3.0-flash` çıktığında kod değişikliği gerekmeden otomatik olarak en güncel Flash modeli seçilir.
3. **Yapay Zeka Canlı Model Optimizatörü (`optimizeModelsWithAi`):**
   * Tanı çalıştırıldığında, belirlenen dinamik Flash modeline kullanıcının aktif model listesi gönderilir. Model, D&D 3.5e web uygulamamız için 3 kritik alana (`QUICK_SEARCH`, `RULE_AUDIT`, `IMPORT_BATCH`) göre en uygun 3 kademeli (primary, fallback, tertiary) seçimleri JSON olarak üretir.
4. **Çift Kademeli Güvenlik Kalkanı & Whitelist Doğrulaması:**
   * AI tarafından önerilen her model adı kullanıcının `apiModels` beyaz listesine karşı doğrulanır (halüsinasyon koruması).
   * Eğer kullanıcının API kotası doluysa (429) veya ağ hatası varsa, deterministik `parseVersion` sürüm sıralayıcısı sessizce devreye girerek tanının veya sistemin kilitlenmesini engeller.
5. **Kalıcı 0ms Yönlendirme (`dnd35_gemini_routing_matrix`):**
   * Doğrulanan model matrisi `localStorage`'a kalıcı olarak kaydedilir. Normal kullanımda hiçbir ekstra keşif veya optimizasyon çağrısı yapılmaz; tüm sistem 0ms gecikme ve 0 ekstra token ile bu optimize matrisi kullanır.
   * API anahtarı değiştirildiğinde veya silindiğinde bu matris temizlenerek taze optimizasyonun önü açılır.
6. **HUB & Karakter Kâğıdı Entegrasyonu:**
   * `hub.html` içerisindeki Bestiary yaratık arama motoru da doğrudan `RuleMaster.getAvailableGeminiModels(apiKey, false, 'IMPORT_BATCH')` havuzuna bağlanarak eski hardcoded model referanslarından arındırıldı.
   * `character.html` ve `index.html` içerisindeki eski fallback string'leri de resmi GA modelleriyle senkronize edildi.

### Parite ve Hash Durumu
* `rule_master.js` = `webapp/rule_master.js` (**SHA-256:** `E73E61C0034F1267D049500C55F1501F9621F42C04F18AABEB5302DF8FB01ED0`)
* `character.html` = `index.html` = `webapp/character.html` = `webapp/index.html` (**SHA-256:** `6CB1CF75C681FAD2A15FFB173251DC73B01450D722F87C4CDF9736390B5BABD3`)
* `hub.html` = `webapp/hub.html` (**SHA-256:** `A20CF49D2971B3199C214258E225EBB097F993BE2C34BF16D7984C9DF0EFB38F`)
* Proje genelinde tavla zarı emojisi (`U+1F3B2`) yasağı tavizsiz korunmuştur.
