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
