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
     - Sıfır tavla zarı (`🎲`) kuralı korundu.

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
     - `hub.html` ve `webapp/hub.html` kopyaları %100 SHA-256 eşitliğinde tutuldu; sıfır tavla zarı (`🎲`) kuralı korundu.

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
     - Sıfır tavla zarı (`🎲` / `U+1F3B2`) kuralı tavizsiz korundu.

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
     - Sıfır tavla zarı (`🎲`) kuralı tavizsiz korundu.

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
     - Sıfır tavla zarı (`🎲`) kuralı korundu.

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
     - Sıfır tavla zarı (`🎲`) kuralı tavizsiz korundu.

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
     - Sıfır tavla zarı (`🎲`) kuralı korundu.

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
     - Sıfır tavla zarı (`🎲`) kuralı korundu.








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
     - Kesinlikle hiçbir tavla zarı emoji (`🎲`) kullanılmadı.

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
     - Kesinlikle hiçbir tavla zarı emoji (`🎲`) kullanılmadı.

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
     - Sıfır `🎲` kuralı tavizsiz uygulandı.

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
     - Sıfır 🎲 tavla zarı emojisi kuralı tavizsiz korundu.


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
     - Sıfır 🎲 tavla zarı emojisi kuralı tavizsiz korundu.


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
     - Sıfır 🎲 tavla zarı kuralı korundu.


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
     - Sıfır 🎲 tavla zarı kuralı korundu.


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
     - Sıfır 🎲 tavla zarı kuralı korundu.


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
     - Sıfır 🎲 tavla zarı kuralı korundu.


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
  - Sıfır 🎲 tavla zarı kuralı korundu.


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
     - Standart tavla zarı emoji yasağı (Rule #3: NO `🎲`) ve dummy data yasağı (Rule #5) eksiksiz uygulandı.


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
     - Standart tavla zarı emoji yasağı (Rule #3: NO `🎲`) ve dummy data yasağı (Rule #5) eksiksiz uygulandı.


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
     - Standart tavla zarı emoji yasağı (Rule #3: NO `🎲`) ve dummy data yasağı (Rule #5) eksiksiz uygulandı.


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
     - Standart tavla zarı emoji yasağı (Rule #3: NO `🎲`) ve dummy data yasağı (Rule #5) eksiksiz uygulandı.


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
     - Proje kuralı gereğince tavla zarı emojisi `🎲` KESİNLİKLE kullanılmadı.


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
     - Standart tavla zarı emoji yasağı (Rule #3: NO `🎲`) ve dummy data yasağı (Rule #5) eksiksiz uygulandı.


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
     - Tavla zarı emojisi `🎲` kesinlikle kullanılmadı.


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
     - Standart tavla zarı emoji yasağına (Rule #3: NO `🎲`) ve HUB izolasyonuna (Rule #6 & Rule #7) titizlikle uyuldu.


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
     - Standart tavla zarı emoji yasağına (Rule #3: NO `🎲`) ve dummy data yasağına (Rule #5) eksiksiz uyuldu.


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
     - Tavla zarı emojisi `🎲` kesinlikle kullanılmadı.


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
     - Tavla zarı emojisi `🎲` kesinlikle kullanılmadı.


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
     - Tavla zarı emojisi (`🎲`) yasağı ve dummy data yasağına titizlikle uyuldu.


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
     - Tavla zarı emojisi (`🎲`) kesinlikle kullanılmadı.

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
     - Proje genelinde hiçbir standart tavla zarı emojisi (`🎲` / `U+1F3B2`) kullanılmadı.


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
     - Tavla zarı emojisi (`🎲`) kesinlikle kullanılmadı.

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
     - Standart tavla zarı emojisi yasağı (`🎲` / `U+1F3B2`) tavizsiz korundu.


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
     - Tavla zarı emojisi (`🎲`) kesinlikle kullanılmadı.

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
     - Standart tavla zarı emojisi yasağı (`🎲` / `U+1F3B2`) tavizsiz korundu.


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
     - Standart tavla zarı emojisi yasağı (`🎲` / `U+1F3B2`) tavizsiz korundu.


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
     - Sıfır tavla zarı emojisi (`🎲` / `U+1F3B2`) kuralı tavizsiz uygulandı.


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
     - Sıfır tavla zarı emojisi (`🎲` / `U+1F3B2`) kuralı tavizsiz korundu.



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

## 70. SEVÄ°YE ATLAMA SÄ°HÄ°RBAZI: ESKÄ° GÃ–MÃœLÃœ KAMPANYA DM BOON VE FLAW DÄ°ZÄ°LERÄ°NÄ°N TEMÄ°ZLENMESÄ° (SAF RAW TEMÄ°ZLÄ°ÄÄ°) (2026-10-26)
* **Ä°stek & Problem:**
  - VeritabanÄ± (master_db.json) tamamen sÄ±fÄ±rlanmasÄ±na raÄŸmen yeni bir karakter seviye atlatÄ±lÄ±rken Seviye 1 Feat yuvasÄ±nda Ability Boost (+1 Dex, +1 Cha), Ability Boost (+1 Str, +1 Cha) gibi 20 adet eski kampanya DM lÃ¼tfu ve 5 adet Flaw en baÅŸta Ã§Ä±kmaktaydÄ±.
  - Bu Ã¶ÄŸelerin kaynaÄŸÄ± masterDb deÄŸil; character.html / index.html iÃ§inde statik olarak bulunan DND35_DM_BOONS_CATALOG ve DND35_FLAWS_CATALOG dizileriydi.
  - Bu durum Kural 5 (No Dummy Data) ve saf D&D 3.5e RAW seviye atlama deneyimi ile Ã§eliÅŸmekteydi.
* **Uygulanan DeÄŸiÅŸiklikler:**
  1. **Statik KataloglarÄ±n SÄ±fÄ±rlanmasÄ±:**
     - DND35_DM_BOONS_CATALOG = []; olarak boÅŸ diziye dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼.
     - DND35_FLAWS_CATALOG = []; olarak boÅŸ diziye dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼.
  2. **Dinamik Veri AkÄ±ÅŸÄ± ve SÄ±fÄ±r Hata DoÄŸrulamasÄ±:**
     - getCombinedFeatCatalog(), showFeatDetail() ve Seviye Atlama SihirbazÄ± enderLevelUpFeatSearchResults() fonksiyonlarÄ±nÄ±n diziler boÅŸken sÄ±fÄ±r hatayla Ã§alÄ±ÅŸtÄ±ÄŸÄ± teyit edildi.
     - DM Boon ve Flaw kategorileri artÄ±k tamamen dinamiktir; yalnÄ±zca DM veya oyuncu tarafÄ±ndan masterDb'ye resmi bir kayÄ±t eklendiÄŸinde katalogda listelenir.
  3. **Parite ve Kural StandartlarÄ±:**
     - 4 karakter kaÄŸÄ±dÄ± dosyasÄ± (character.html, index.html, webapp/character.html, webapp/index.html) arasÄ±nda %100 SHA-256 hash paritesi korundu.
     - Standart tavla zarÄ± emojisi (ğŸ² / U+1F3B2) yasaÄŸÄ± tavizsiz uygulandÄ±.
