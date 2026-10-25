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
* Proje kuralı gereğince standart zar emojisi `🎲` kesinlikle kullanılmamalı, SVG zar ikonları kullanılmalıdır.

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
   - Tüm dosyalarda sıfır tavla zarı (`🎲`) doğrulaması yapıldı.

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
     * Standart tavla zarı (`🎲`) kesinlikle kullanılmadı.

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
     * Standart tavla zarı (`🎲`) kesinlikle kullanılmamıştır.

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
     * Proje kuralı gereği standart tavla zarı (`🎲`) kesinlikle kullanılmamış, tematik SVG ve ikonlar (`🛡️`, `⚡`, `🔮`, `👁️`, `👂`) tercih edilmiştir.
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
     * Proje kuralı gereğince standart tavla zarı (`🎲`) kesinlikle kullanılmamış, özel SVG çokyüzlü zar ikonları kullanılmıştır.
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
  4. DM HP otoritesi ve oyuncu stat ayrımının korunması; kök ve `webapp/` dosyalarının %100 paritede tutulması; standart tavla zarı (`🎲`) yasağının tavizsiz uygulanması.

---

## 12. HAZIR DEVİR TESLİM PROMPTU (DİĞER KONUŞMAYA YAPIŞTIRILACAK)
```markdown
DM Kampanya Davet Kodu Modeli (Supabase Auth + PostgreSQL + Realtime WebSocket) mimarisi belirlendi. Görev: `HANDOVER_TO_CHARACTER_SHEET.md` dosyasındaki Bölüm 11 spesifikasyonuna uygun olarak, `supabase_auth.js`, `hub.html`, `index.html` ve `character.html` sayfalarında çok kullanıcılı davet kodu ve kampanya katılım sistemini uçtan uca uygula. Kök ve webapp/ dosyalarında %100 pariteyi koru ve hiçbir yerde standart tavla zarı (`🎲`) kullanma.
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
     * Tüm dosyalarda (`hub.html`, `character.html`, `index.html`, `supabase_auth.js`) sıfır tavla zarı (`🎲`) doğrulaması yapıldı.
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
     * Dosyalarda sıfır tavla zarı (`🎲`) kuralı tavizsiz korundu.
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
     * Sıfır tavla zarı (`🎲`) kuralı tavizsiz korundu.

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
   - Projenin hiçbir yerinde tavla zarı emojisi (`🎲` / `U+1F3B2`) kullanılmayacak; SVG zar ikonları veya tematik aksiyon sembolleri (`⚔️`, `🛡️`, `⚡`, `🔮`, `🩸`) kullanılacaktır.
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
     * Standart tavla zarı (`🎲`) yasağı ve sıfır dummy data kuralı tavizsiz korundu.





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
     * Sıfır tavla zarı (`🎲`) ve Kural #5 (No Dummy Data) kuralları tavizsiz korundu.

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
     * Sıfır tavla zarı (`🎲`) kuralı tavizsiz korundu.

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
     * `hub.html`, `supabase_auth.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde tutuldu; sıfır tavla zarı (`🎲`) kuralı korundu.

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
     * Sıfır tavla zarı (`🎲`) kuralı tavizsiz korundu; çokyüzlü vektörel SVG zarlar kullanıldı.

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
     * `hub.html`, `character.html`, `index.html`, `supabase_auth.js` ve `webapp/` kopyaları %100 SHA-256 eşitliğinde tutuldu; sıfır tavla zarı (`🎲`) kuralı tavizsiz korundu.

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
     - Sıfır tavla zarı (`🎲`) kuralı tavizsiz korundu.
