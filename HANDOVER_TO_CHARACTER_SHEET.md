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

## 8. HAZIR DEVİR TESLİM PROMPTU (DİĞER KONUŞMAYA YAPIŞTIRILACAK)
```markdown
Supabase Google OAuth kimlik doğrulama sistemi (`login.html`, `supabase_auth.js`), sayfa koruma kalkanları (`requireAuth`) ve sağ üst kullanıcı profil rozeti Hub ile Karakter Kâğıdı'na entegre edildi. Giriş yapmayan kullanıcılar doğrudan `/login` sayfasına yönlendirilmektedir.
Lütfen `HANDOVER_TO_CHARACTER_SHEET.md` dosyasındaki son güncellemeleri kontrol ederek geliştirmelere devam et.
```

