# 🗺️ Joyful-Fermi: Kanonik V2 Şeması ve 8 Fazlı Master Proje Planı

> **Yönetim & Mimari:** `Gemini 4 Argon` (Proje Yöneticisi & Baş Mimar) | **Denetim:** `Gemini 3.8 / Flash` | **Veri İşleme:** Yerel Deterministik ETL (Sıfır Token)
> **Senkronize Obsidian Kaydı:** `D:\Obsidian\dndtools35\04-DevLogs\2026-10-27-Moduler-SRD-Compendium-ve-Veritabani-Yol-Haritasi.md`

---

## 🔒 1. Kesin Koruma Kararları ve Kırmızı Çizgiler (Strict Constraints)
1. **3D Zar Motoru ve Zar Alanı %100 Korunacak:**
   * `dice3d.js`, `hub_dice.js` ve `index.html` içindeki zar tepsisi, çokyüzlü 3D fiziksel zar animasyonları ve zar sonuç kutuları **olduğu gibi kalacaktır**.
   * V2 `damageParts` dizisi, zar atma anında mevcut zar motorunun beklediği formül ve parça kırılımını üretecek bir veri besleyicisi olarak çalışacaktır.
2. **Combat (Çatışma) Sayfası Görsel Tasarımı %100 Korunacak:**
   * Üzerinde yoğun emek harcanan Combat sekmesinin kart düzeni, BAB / Full Attack kırılımları, AC / HP / İnisiyatif blokları, Power Attack / Combat Expertise kaydırıcıları ve zar butonları **yeniden tasarlanmayacaktır**.
   * Yalnızca kaputun altındaki veri kancaları (`dice`/`extraDmg` -> `damageParts`, ayrı `isChild` satırları -> kart içi ufak `modes` hapları) V2 motoruna bağlanacak ve ufak ergonomik rozet dokunuşları yapılacaktır.
3. **`isChild` / `parent` Satırları Yerine Gömülü `modes` Dizisi:**
   * Veritabanında ayrı satır olarak duran `"↳ Two-Handed"`, `"↳ Thrown"` gibi alt aksiyonlar ana tablodan kaldırılıp ebeveyn eşyanın/büyünün içindeki `modes: [{ id, label, actionType, damageParts, modifiers, save }]` dizisine gömülecektir.
4. **`HubNotes` (`hub_notes.js`) Ortak Akıllı Not Modülü Olarak `index.html`'e Entegre Edilecek:**
   * HUB sayfasındaki `#etiket` tamamlamalı (typeahead), ilişkisel **SVG Zihin Haritası (Mindmap)** ve **AI Vakanüvis (Chronicler)** özellikli `window.HubNotes` nesnesi bağımsız modül olarak korunacak ve Karakter Kâğıdının (`index.html`) Notlar bölümüne doğrudan bağlanacaktır.

---

## 🚀 2. Sekiz Fazlı Master Proje Planı (Uygulama Takip Listesi)

### [x] Faz 1: DB & Sıfır-Token ETL Boru Hattı (`database/srd_*.json`) [TAMAMLANDI]
* **Görevli:** `Gemini 4 Argon` (Mimari) + Yerel Node.js/Python ETL Scripti (Sıfır Token) + `Flash Lite` (Şema Denetimi)
* **Teslimatlar:**
  * [x] `tools/build_srd_compendium.py` deterministik dönüştürücü scriptinin yazılması.
  * [x] Foundry `.db` (34 dosya) + mevcut `srd_core_catalog.json` özel kayıtlarının (32 Warlock Invocation, 11 Tome of Battle, Fighter Bonus Feat bayrakları) Kanonik V2 şemasına dönüştürülmesi.
  * [x] Modüler V2 JSON paketlerinin üretilmesi (`database/` ve `webapp/database/` — Toplam **3.522** kayıt, `compendiumHash=a6c44058e4b2c8fe`):
    * `srd_index.json` (412.5 KB arama fihristi + `compendiumHash`)
    * `srd_equipment.json` (981 kayıt: Silahlar, Zırhlar, Materyaller, Enhancements, Büyülü Eşyalar)
    * `srd_feats.json` (452 kayıt: Featler, Tome of Battle, Warlock Invocations, yapısal önkoşullar ve `modifiers`)
    * `srd_classes_races.json` (235 kayıt: 33 Sınıf, 32 Irk, 129 Sınıf Yeteneği, 41 Irksal Yetenek, `spellsPerDay` matrisleri)
    * `srd_combat_rules.json` (96 kayıt: 38 Condition, 37 Buff, 21 Hasar Tipi)
    * `srd_spells.json` (1.113 kayıt: 673 Büyü + 440 Psionic Power, `@cl` ölçekli `damageParts`/`modifiers`)
    * `srd_monsters.json` (645 kayıt: 645 Canavar — HUB Encounter & Bestiary için)
  * [x] Obsidian `02-Data-Contracts/` altındaki şema dokümanlarının V2'ye güncellenmesi ve `flash_lite` ile %100 şema/parite denetiminden geçmesi.

### [x] Faz 2: Frontend Veri Katmanı (`srd_compendium.js`) & Otomatik Göç (`SchemaMigrator`) [TAMAMLANDI]
* **Görevli:** `Gemini 4 Argon` + `Flash Lite` (Denetim)
* **Teslimatlar:**
  * [x] `window.SrdCompendium`: Senkron `O(1)` `Map<id, Entry>` çekirdek indeks + `IndexedDB` versiyonlu (`compendiumHash`) lazy-loader (`srd_spells.json`, `srd_monsters.json`) + birleşik `search(query, filters)` motoru.
  * [x] `window.ItemAssembler`: `baseItemId` + `material` + `enhancementBonus` + `enhancements[]` parçalarından çalışma anında V2 eşya nesnesi üreten Lego birleştirici (RAW Mithral, Adamantine DR, Keen, Flaming Burst, market price hesaplaması dahil).
  * [x] `window.SchemaMigrator.upgradeCharacterToV2(data)`: V1 karakter ve `master_db` kayıtlarını yükleme kapısında tek seferde V2 şemasına (`modifiers`, `damageParts`, `modes`, `smartNotes`, `schemaVersion: 2`) yükselten deterministik dönüştürücü.

### [x] Faz 3: Çekirdek Kural Motoru (`rule_engine.js`) V2 Refactoring [TAMAMLANDI]
* **Görevli:** `Gemini 4 Argon` + `Flash Lite` (Denetim)
* **Teslimatlar:**
  * [x] 16 sabit bonus alanının, sezgisel regex tahminlerinin (`slot === 'neck'` vb.) ve `isChild` döngülerinin tamamen temizlenmesi (`0` eski alan referansı).
  * [x] Evrensel V2 `modifiers` toplayıcısı (D&D 3.5e RAW çakışma kuralları: *Dodge*, *Circumstance*, *Racial* ve *Untyped* toplanır; diğerleri en yüksek değeri alır) ve dinamik formül çözücünün (`evaluateFormula`: `floor(@cl / 3)`, `@level`, `@strMod`..`@chaMod`) devreye alınması.
  * [x] Yapısal `damageParts` kritik çarpan motorunun ve gömülü `modes` seçicisinin mevcut **3D Zar Motorunu (`dice3d.js`)** besleyecek şekilde (`diceFormula`, `critDiceFormula`, `normalDamageParts`, `extraDamageParts`, `critOnlyDamageParts`) bağlanması.
  * [x] Sınıf `spellsPerDay` matrislerinin (`getClassSpellSlots`), 8-Saat Dinlenme motorunun (`performLongRest`) ve Condition/Buff `ruleFlags` etkilerinin (`loseDexToAC`, `effectiveDexZero`, `halfSpeed`, `actionRestriction` uyarıları) hesaplama motoruna bağlanması.

### [x] Faz 4: Rule Master & AI Şema Senkronizasyonu (`rule_master.js`) [TAMAMLANDI]
* **Görevli:** `Gemini 4 Argon` + `Flash Lite` (Denetim)
* **Teslimatlar:**
  * [x] `rule_master_ai_schema.json` ve `normalizeEntry` fonksiyonlarının Kanonik V2 şemasına (`modifiers`, `damageParts`, `modes`, `weaponStats`, `armorStats`, `spellStats`, `ruleFlags`, `tacticalBadges`) yükseltilmesi.
  * [x] Eski `equipItemWithChildren` ve ayrı `"↳"` satır yamalarının kaldırılıp gömülü `modes` yapısına (`addChildPower` -> ebeveyne gömülü mod ekleme, `renderHierarchyTree` -> gömülü mod ağacı) geçilmesi.
  * [x] Doğal dille girilen bileşik eşyaların (*"+2 Keen Mithral Scimitar"*) ve SRD aramalarının `resolveLocalZeroTokenQuery` (`window.SrdCompendium` + `window.ItemAssembler`) ile **0 ms ve sıfır token** tüketimiyle çözümlenmesi.

### [x] Faz 5: Ortak UI Modülü (`ui_shared.js`) ve `HubNotes` Bulut Köprüsü (`hub_notes.js`) [TAMAMLANDI]
* **Görevli:** `Gemini 4 Argon` + `Flash Lite` (Denetim)
* **Teslimatlar:**
  * [x] `ui_shared.js` (`window.DnDUI`): Ortak V2 kart rozetleri (`renderDamagePartsBadges`, `renderModifiersBadges`, `renderTacticalBadges`), gömülü `modes` alt-aksiyon hapları (`renderModesPills`), Taktiksel Durum Uyarı Bandı (`renderConditionWarningBanner`), birleşik Spotlight Combobox (`attachSpotlightCombobox`) ve sağdan açılır SRD Kütüphane + Demirhane Çekmecesi (`openCompendiumDrawer`).
  * [x] `hub_notes.js` (`window.HubNotes`): Karakter kâğıdı (`index.html`) için bağımsız mod algılaması (`getStandaloneCharacterInstance`), çift yönlü V2 depolama köprüsü (`character.smartNotes` + `character.notesList` + `dnd35_hub_db` + `saveStateToStorage`), eski düz metin notların otomatik göçü (`ensureSmartNotesArray`) ve tek satırla tam ekran modal + widget bağlama (`mountCharacterNotesWidget`, `ensureModalDom`).

### [x] Faz 6: Karakter Kâğıdı Entegrasyonu (`index.html`) — *Combat & Zar Alanı Korunarak* [TAMAMLANDI]
* **Görevli:** `Gemini 4 Argon` + `Flash Lite` (Denetim)
* **Teslimatlar:**
  * [x] **Kısıt:** Zar Alanı (`dice3d.js` / `#tab-dice`) ve Combat sayfasının (`#tab-combat`) mevcut görsel düzeni %100 korundu; kartların arkasındaki veri kancaları V2 `damageParts` ve `modes` dizilerine (`#combat-weapon-modes-strip`, `selectActiveWeaponMode`) bağlandı.
  * [x] Karakter Kâğıdı (`#tab-core`) içerisine `window.HubNotes` (`#char-smart-notes-container` -> Etiketli Akıllı Notlar + İlişkisel SVG Mindmap + AI Vakanüvis + çift yönlü `smartNotes`/`notesList`/`dnd35_hub_db` bulut senkronizasyonu) entegre edildi.
  * [x] Envanter sekmesine (`#tab-inventory`) **⚒️ Demirhane (Lego Eşya Montaj UI)** (`openCharacterForgeDrawer`) ve **📚 SRD Kütüphane** (`openCharacterCompendiumDrawer` + `addV2ItemToCharacterGearPool`) eklendi; eski 29 sütunlu `canonicalKeysToSync` ve `extraDmg` referansları kaldırıldı.
  * [x] Savaş Kokpitine **Taktiksel Durum Uyarı Bandı** (`#combat-condition-warning-banner` -> `DnDUI.renderConditionWarningBanner`) ve Yükleme Kapısı (Load-Gate) V2 Göçü (`SchemaMigrator.upgradeCharacterToV2` + `SrdCompendium.init()`) bağlandı.

### [x] Faz 7: DM HUB & Bestiary Entegrasyonu (`hub.html`) [TAMAMLANDI]
* **Görevli:** `Gemini 4 Argon` + `Flash Lite` (Denetim)
* **Teslimatlar:**
  * [x] `hub.html`'in `srd_compendium.js`, `rule_engine.js`, `rule_master.js`, `ui_shared.js` ve `hub_notes.js` ortak V2 modüllerine bağlanması; üst bara **👹 Bestiary & SRD V2 (645)** ve **⚒️ Demirhane (Lego)** çekmece butonlarının (`openHubCompendiumDrawer`) eklenmesi.
  * [x] 645 SRD canavarının (`database/srd_monsters.json`) `hydrateV2BestiaryFromCompendium()`, `normalizeMonsterData()`, `convertMonsterToCharacter()` ve `syncMonsterToMasterDb()` üzerinden Encounter Builder ve Parti/NPC oluşturucuya tam V2 stat bloklarıyla (`schemaVersion: 2`, `damageParts`, `weaponMeta`, `modifiers`, `modes`, `smartNotes`) bağlanması.
  * [x] `HANDOVER_TO_CHARACTER_SHEET.md` devir teslim dokümanının Bölüm 123 ile Kanonik V2 Veri Kontratına güncellenmesi.

### [x] Faz 8: Parite, Bulut Testi ve Regresyon Denetimi [TAMAMLANDI]
* **Görevli:** `Gemini 4 Argon` + `Flash` (Doğrulama & Test)
* **Teslimatlar:**
  * [x] Kök dizin ile `webapp/` altındaki tüm dosyaların (19 kök dosya + 7 `database/srd_*.json` paket dosyası) %100 birebir SHA-256 pariteyle eşitlenmesi.
  * [x] `gdrive_sync.js` bulut senkronizasyon köprüsünün (`foundInCloudHub.fullData`, `remoteChar`, `mergedDb`) Kanonik V2 şema yükselticilerine (`SchemaMigrator.upgradeCharacterToV2`, `RuleMaster.normalizeDatabaseList`) bağlanması ve disk üzerindeki `character_data.json` ile `master_db.json` dosyalarının `schemaVersion: 2`'ye yükseltilmesi.
  * [x] `Flash` modeli ile uçtan uca V2 şema, sıfır-token Lego montaj (`ItemAssembler`), kural motoru (`RuleEngine`) ve regresyon doğrulaması.

---

## 🌟 3. Faz 9: Genişletilmiş V2 Veri Havuzu & Sistem Entegrasyonu (Öneri Havuzu ve Karar Matrisi)

> **PM Gatekeeper Kuralı (`Gemini 4 Argon`):** Her alt paket (`Seçenek A–F`) devreye alınırken **Pre-Flight Mimari Kontrat** (tekil `SrdCompendium` V2 kaynağı, sıfır duplikasyon, mevcut `RuleEngine` kancası) ➔ **Kapsamlı Uygulama** ➔ **Post-Flight `git diff` & `tools/verify_and_sync.js` Denetimi** protokolü işletilir.

### [x] Faz 9.0: Magic Item Compendium (MIC) & Augmentation Crystals V2 Entegrasyonu [TAMAMLANDI]
* [x] **953 resmi MIC 3.5e sihirli eşyasının** (Silahlar, Zırhlar, Giysiler, Harikalar, Relic'ler, Set Eşyaları ve Eklenti Kristalleri) Kanonik V2 (`schemaVersion: 2`, `modifiers`, `damageParts`, `ruleFlags`) formatında `database/srd_equipment.json` (toplam **1.945** ekipman) içine entegre edilmesi.
* [x] Silah ve zırhlara **Augmentation Crystal** (Least / Lesser / Greater kristal yuvası ve +1/+3 efsun önkoşulu) soketleme sisteminin kurulması.
* [x] **The Forge (Demirhane)** ve kod tabanındaki ~1.300+ satırlık statik eşya/efsun yedek dizilerinin silinerek %100 dinamik `SrdCompendium` V2 mimarisine geçilmesi.

### [ ] Faz 9.A (Seçenek A): Eksik Core DMG & Psionic Prestige Class'lar (`database/srd_classes_races.json`) [SIRADA]
* **Mevcut Durum:** Sistemde sınırlı sayıda Prestige Class mevcut.
* **Kapsam & Teslimatlar:**
  * [ ] **7 Core DMG PrC:** *Dragon Disciple, Duelist, Hierophant, Horizon Walker, Loremaster, Shadowdancer, Thaumaturgist* (BAB, Fort/Ref/Will Save dizileri, Hit Die, Skill Points, Class Skills, yapısal Prerequisites ve seviye bazlı Class Features tablolarıyla).
  * [ ] **9 Psionic PrC (XPH):** *Cerebremancer, Elocator, Metamind, Psionic Fist, Pyrokineticist, Slayer, Thrallherd, War Mind, Wilder/Psion PrC bağlantıları*.
* **Mimari Kontrat:** Ayrı kopya dizi oluşturulmadan doğrudan `database/srd_classes_races.json` içine `category: "Class", subCategory: "Prestige"` V2 şemasıyla eklenecek; `Level-Up Wizard` (`char_progression.js`) doğrudan `SrdCompendium` üzerinden okuyacak.

### [x] Faz 9.B (Seçenek B): 36 Cleric Domain & Alan Yetenekleri (`database/srd_domains.json`) [TAMAMLANDI]
* [x] *Air, Animal, Chaos, Death, Destruction, Earth, Evil, Fire, Good, Healing, Knowledge, Law, Luck, Magic, Plant, Protection, Strength, Sun, Travel, Trickery, War, Water* dahil **36 resmi Domain**'in Granted Power, V2 `modifiers` ve 1–9 seviye büyü/ID (`spellIds`) zincirleriyle `database/srd_domains.json` içine işlenmesi.
* [x] `char_spells.js` içindeki 145 satırlık statik `DND35_CLERIC_DOMAINS` kopyasının tamamen silinip `SrdCompendium.getAllDomains()` ve `SrdCompendium.getDomain()` tekil kaynağına bağlanması.

### [x] Faz 9.C (Seçenek C): Kural/Mekanik Etkili Simyasal Eşyalar, Alet Kitleri & 28 RAW Zehir (`database/srd_equipment.json`) [TAMAMLANDI]
* [x] **Alchemical Weapons/Items:** *Alchemist's Fire (1d6 fire), Acid Flask (1d6 acid), Tanglefoot Bag, Thunderstone, Smokestick, Sunrod, Antitoxin (+5 Fort poison)* V2 `damageParts` ve `modifiers` zenginleştirmesi.
* [x] **Tools & Skill Kits (+2 Circumstance Bonus):** *Masterwork Thieves' Tools, Healer's Kit, Climber's Kit, Disguise Kit, Masterwork Artisans/Musical Tools* V2 `modifiers` entegrasyonu.
* [x] **28 Resmi DMG Zehiri:** Injury, Contact, Ingested ve Inhaled türlerinde Fortitude DC ve Initial/Secondary hasarlarıyla `srd_equipment.json`'a eklenmesi.

### [x] Faz 9.D (Seçenek D): Animal Companion, Familiar & Special Mount Sistemi (`database/srd_companions.json`) [TAMAMLANDI]
* [x] Seviyeye göre Bonus HD, Natural Armor, Str/Dex artışı, Bonus Tricks, Special Abilities ve Familiar'ın efendiye sağladığı pasif V2 `modifiers` (*Alertness, +2 Fortitude, +3 Bluff* vb.) tablolarının `database/srd_companions.json` olarak oluşturulması.
* [x] `srd_monsters.json` (645 yaratık) ile sıfır veri kopyası üreten dinamik şablon hesaplayıcısının (`SrdCompendium.calculateCompanionStats`) kurulması.
* [x] **3 Arayüz Entegrasyonu:** `Char` sekmesinde 3-4 satırlık özet kartı, `Combat` sekmesinde `🐾 Companion & Mount Attacks` çekmecesi, `Inventory` sekmesinde `🐾 Companion` 5 yuvalı ekipman görünümü.

### [ ] Faz 9.E (Seçenek E): Karakter Şablonları — Templates (`database/srd_classes_races.json` veya `database/srd_templates.json`) [PLANLANDI]
* **Mevcut Durum:** Sadece temel ırklar (Base Races) seçilebiliyor; şablon (Template) katmanı yok.
* **Kapsam & Teslimatlar:**
  * [ ] **7 Resmi SRD Şablonu:** *Half-Dragon (+8 Str, +2 Con, +2 Int, +2 Cha, +4 Nat AC, Breath Weapon, Immunity), Half-Celestial, Half-Fiend, Lich, Vampire, Lycanthrope (Werewolf / Werebear / Wererat / Weretiger / Wereboar), Ghost*.
  * [ ] Karakter kurgusunda **Level Adjustment (LA)**, tip değişimi, doğal zırh, yetenek skoru artışları (`modifiers`), DR/SR ve özel saldırıların (`damageParts`) `RuleEngine` üzerinden otomatik karaktere giydirilmesi.

### [ ] Faz 9.F (Seçenek F): Epic Level Handbook — Epic Feats, Epic Spells & +6..+10 Efsunlar [PLANLANDI]
* **Mevcut Durum:** Sistem 1–20 seviye SRD ve MIC kurallarını kapsıyor.
* **Kapsam & Teslimatlar:**
  * [ ] **Epic Feats (`database/srd_feats.json`):** ~180 resmi Epic Feat (*Armor Skin, Epic Weapon Focus/Specialization, Devastating Critical, Overwhelming Critical, Dire Charge, Automatic Quicken/Silent/Still Spell, Great Strength..Charisma* vb.) V2 `prerequisites` (`minLevel: 21`) ve `modifiers` ile.
  * [ ] **Epic Spells (`database/srd_spells.json`):** 48 resmi Epic Büyü (*Hellball, Greater Ruin, Mom's/Mummy Dust, Soul Dominion, Epic Mage Armor* vb.).
  * [ ] **Epic Item Forge & Enhancements (`database/srd_equipment.json` & `ItemAssembler`):** 21+ seviye veya Epic toggle açıkken +6..+10 silah/zırh efsun bonusu, toplam +20 efsun bütçesi ve Epic maliyet çarpanı (`bonus² × 10.000 gp`).
