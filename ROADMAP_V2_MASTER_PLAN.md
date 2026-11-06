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

### [x] Faz 9.A (Seçenek A): Eksik Core DMG & Psionic Prestige Class'lar (`database/srd_classes_races.json`) [TAMAMLANDI]
* **Kapsam & Teslimatlar:**
  * [x] **16 Core DMG PrC:** *Arcane Archer, Arcane Trickster, Archmage, Assassin, Blackguard, Dragon Disciple, Duelist, Dwarven Defender, Eldritch Knight, Hierophant, Horizon Walker, Loremaster, Mystic Theurge, Red Wizard, Shadowdancer, Thaumaturgist* (BAB, Fort/Ref/Will Save dizileri, Hit Die, Skill Points, Class Skills, yapısal Prerequisites ve seviye 1..10 Class Features tablolarıyla).
  * [x] **9 Psionic PrC (XPH):** *Cerebremancer, Elocator, Metamind, Psion Uncarnate, Psionic Fist, Pyrokineticist, Slayer, Thrallherd, War Mind*.
* **Mimari Kontrat:** `char_spells.js` ve `rule_engine.js` içindeki statik Core DMG Prestige Class kopyaları silinerek doğrudan `database/srd_classes_races.json` (`SrdCompendium.getAllClasses()` / `SrdCompendium.getClass()`) tekil kaynağına bağlandı; `Level-Up Wizard` (`char_progression.js`) tüm önkoşul (`bab`, `feat`, `arcane`, `divine`, `spells`, `alignment`, `skill`, `race`) ve seviye yeteneklerini doğrudan `SrdCompendium` üzerinden okuyor.

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

### [x] Faz 9.E (Seçenek E): Karakter Şablonları — Templates (`database/srd_templates.json`) [TAMAMLANDI]
* [x] **39 Resmi D&D 3.5e Şablonu (`database/srd_templates.json`):** *Half-Dragon (Red, Gold, Silver, Blue, Black, Green, White, Brass, Bronze, Copper), Half-Celestial, Half-Fiend, Celestial, Fiendish, Lich, Vampire, Ghost, Demilich, Skeleton, Zombie, Lycanthrope (Werewolf, Werebear, Wererat, Weretiger, Wereboar, Dire Werewolf, Dire Wereboar + Hybrid/Animal Form), Phrenic, Psionic, Shadow Creature, Paragon, Pseudonatural, Worm that Walks, Petitioner, Divine Rank 0/1* kayıtlarının %100 Kanonik V2 (`schemaVersion: 2`, `modifiers[]`, `damageParts[]`, `levelAdjustment`, `crIncrease`, `dr`, `sr`, `immunities`, `resistances`, `specialAttacks`, `specialQualities`) formatında oluşturulması ve `srd_index.json` + `SrdCompendium.getAllTemplates()` / `getTemplate()` içine bağlanması.
* [x] **`RuleEngine` & Simetrik UI/UX Entegrasyonu:** Karakter kurgusunda **Level Adjustment (LA)** ve **Effective Character Level (ECL)**, yaratık tipi değişimi, doğal zırh iyileştirmesi (`type: 'template'`), yetenek skoru/beceri/saldırı artışları (`modifiers`), DR/SR/Fast Healing/Turn Resistance ve özel saldırıların (`damageParts`) `RuleEngine.recalculateCharacter` + `evaluateSkillBonus` + `calculateAttackStats` üzerinden otomatik uygulanması; Üst HUD, Karakter Profil Kartı ve Karakter Profil Modalı (`panel-stat-dist-identity`) içine Spotlight Şablon Seçicisinin eklenmesi.

### [-] Faz 9.F (Seçenek F): Epic Level Handbook & Psionics Genişletmeleri [KAPSAM DIŞI — PLANDAN ÇIKARILDI]
* **Karar (2026-11-06):** Sistem odağının **Seviye 1–20 Core + Splatbook (MIC / Spell Compendium / Tome of Battle / Complete Serisi)** standartlarında sade ve tutarlı tutulması amacıyla **Epic Level (21+)** ve **Psionics** içerikleri (`~180 Epic/Psionic Feat`, `48 Epic Spell`, `Psionic/Epic Equipment`, `+6..+10 Epic Item Forge`) resmi proje planından çıkarılmıştır.

### [x] Faz 9.G (Seçenek G): `database/` Klasöründeki Bağsız JSON Paketlerinin Temizliği ve Eksik 1–20 Kayıtların V2 Konsolidasyonu [TAMAMLANDI]
* **Mevcut Durum:** `database/srd_index.json` **11 ana V2 chunk dosyasını** (`srd_equipment`, `srd_feats`, `srd_classes_races`, `srd_combat_rules`, `srd_spells`, `srd_monsters`, `srd_maneuvers`, `mic_compendium`, `srd_domains`, `srd_companions`, `srd_templates` — toplam **4.995 kayıt**) indeksliyor.
* **Kapsam & Teslimatlar:**
  * [x] **Epic & Psionic Yan Dosyalarının Silinmesi:** Plandan çıkarılan 3 Epic/Psionic yan dosyasının (`srd_epic_psionic_feats.json`, `srd_epic_spells.json`, `srd_psionic_epic_equipment.json`) hem `database/` hem `webapp/database/` altından tamamen temizlenmesi.
  * [x] **Kalan 4 Yan Dosyadaki Eksik Non-Psionic (Seviye 1–20) Kayıtların V2 Dizi Göçü & Birleştirilmesi (`ADR-022` In-Place Merge):**
    * `srd_alchemical_and_tools.json` içindeki eksik 54 zanaat aleti, müzik enstrümanı ve laboratuvar kaydının obje tabanlı `modifiers` alanlarının Kanonik V2 `modifiers: [{ target, value, formula, type, condition }]` dizi yapısına dönüştürülerek `srd_equipment.json`'a (`1.142` kayıt) eklenmesi ve 22 kıvrık kesme işaretinin (`’` ➔ `'`) normalize edilmesi.
    * `srd_cleric_domains.json`, `srd_prestige_classes_ext.json` (psionik olmayanlar) ve `srd_templates_and_companions.json` dosyalarının ana paketlerle (`srd_domains.json`, `srd_classes_races.json`, `srd_templates.json`, `srd_companions.json`) karşılaştırılıp eksik veri kalmadığının doğrulanması ve bu 4 mükerrer yan dosyanın da temizlenmesi.
  * [x] **`srd_index.json` & `verify_and_sync.js` SHA-256 Parite Güncellemesi:** Konsolide edilen kayıtların `srd_index.json` arama indeksine ve SHA-256 hash doğrulamasına dahil edilmesi.

### [x] Faz 9.H (Seçenek H): `ADR-013` Tamamlaması — JS Statik Veri Temizliği & Genişletilmiş RAW Matematik Test Süiti [TAMAMLANDI]
* **Kapsam & Teslimatlar:**
  * [x] **`hub.html` `bundled_monsters.js` Birleştirme & Emeklilik (`ADR-013` & `ADR-022`):** `bundled_monsters.js` içindeki 4 benzersiz yaratık kaydının (*Kobold*, *Goblin*, *Orc (Warrior 1)*, *Mind Flayer (Illithid)*) ve 26 ortak yaratıktaki yapısal dizilerin (`specialAbilities`, `spells`, `skills`, `grapple`, `aliases`) `srd_monsters.json` (`649` kayıt) içine eksiksiz birleştirilmesi, `hub.html` başlığındaki `<script src="bundled_monsters.js"></script>` bağımlılığının kaldırılması ve `bundled_monsters.js` dosyasının emekliye ayrılması.
  * [x] **`rule_engine.js`, `char_spells.js` & `char_progression.js` Statik Yedek Tablolarının JSON'a Taşınması:** `SPLATBOOK_BUFF_SPELLS` (25 büyü), `BUILTIN_DOMAINS`, `BUILTIN_BUFFS` (107 büyü), `DND35_CLASS_DEFS`, `DND35_BASE_CLASS_DEFS` ve `DND35_EXTRA_CLASSES` (25 splatbook/prestige sınıfı + 24 SRD sınıf zenginleştirmesi) tablolarının `srd_spells.json` (`1.139` kayıt) ve `srd_classes_races.json` (`281` kayıt) içine aktarılıp JS dosyalarından ~777 satırlık mükerrer statik verinin temizlenmesi.
  * [x] **`tools/test_rule_engine.js` Genişletmesi:** Mevcut 5 temel RAW testine ek olarak Faz 9 mekaniklerini (*Double Weapon TWF, Augmentation Crystals, Cleric Domain CL, Situational AC ayrımı, Karakter Şablonu LA/ECL, Armbands of Might + Power Attack, Kanonik V2 Compendium Sınıf/Büyü çözümlemesi*) doğrulayan 5 yeni sıfır-token birim testinin eklenmesi (**10/10 RAW testi ~15ms**).

### [x] Faz 9.I (Seçenek I): UI/UX Ergonomisi & Obsidian Mimari Doküman Senkronizasyonu [TAMAMLANDI]
* **Kapsam & Teslimatlar:**
  * [x] **Ortak Modal Klavye (`Escape`) & Erişilebilirlik (`role="dialog"`) Kabuğu:** Açık modalların ve Compendium çekmecesinin `Escape` tuşuyla güvenli kapatılması (`#vault-lock-modal` hariç) ve tüm modal kapsayıcılarına `role="dialog"` + `aria-modal="true"` niteliklerinin otomatik atanması (`ui_shared.js` & `char_modals.js`).
  * [x] **Obsidian Mimari Kartlarının Güncellenmesi:** `01-Architecture/Core Engine (Rule Engine & Rule Master).md` ve `02-Data-Contracts/srd_core_catalog Schema.md` belgelerinin güncel 11 modüllü (`4.995` kayıt) Kanonik V2 mimarisine eşitlenmesi.
