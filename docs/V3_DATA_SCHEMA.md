# Sheet V3 Veri Şeması (TASLAK v0.1)

Durum: **onay bekliyor**. Kodlama bu doküman onaylandıktan sonra başlar.
İlgili: `docs/REDESIGN_V3_PLAN.md`, `sheet/engine/FORK.md`, ADR-011 (karaktere özel `customDb`).

Bu taslak kod okunarak çıkarıldı (alan kullanım sayıları `char_*.js`, `rule_master.js`, `rule_engine.js`, `hub.html` üzerinden). Gerçek karakter export'ları gelince her alan fixture'larla doğrulanacak.

## 0. Temel kararlar

1. **Homebrew karaktere özeldir.** Kullanıcı tanımlı her kayıt `character.customDb` içinde yaşar. Ortak ya da kampanya kütüphanesi yok. Karakter Hub'a veya başka cihaza taşındığında kendi homebrew'unu eksiksiz taşır.
2. **Geçiş boyunca format yalnızca genişler.** V3 yeni alan ekleyebilir (`kind`, `quarantine`, `v3Migrations`…). Klasik sayfanın ve Hub'ın okuduğu hiçbir alanı silmez, yeniden adlandırmaz, tipini değiştirmez.
3. **Tür, isimden tahmin edilmez.** Her kaydın türü açık bir `kind` alanıyla belirlenir (GEMINI §3.3).
4. **Hiçbir migration veri silmez.** Anlaşılamayan kayıt karantinaya alınır, kullanıcı karar verir.

## 1. Karakter alanlarının dört sınıfı

Bugünkü en büyük karışıklık şu: **hesaplanan değerler kaynak veriyle aynı nesnede saklanıyor ve sonra tekrar girdi olarak okunuyor.** V3 her alanı dört sınıftan birine koyar.

| Sınıf | Anlamı | V3 kuralı |
| :--- | :--- | :--- |
| **Kaynak** | Kullanıcının girdiği, tek doğru veri | Yalnızca yazma kapısıyla değişir, kaydedilir |
| **Türetilmiş** | Motorun kaynaktan hesapladığı değer | `deriveSheet()` hesaplar. Girdi olarak **asla okunmaz**. Hub uyumu için kayıtta bir "snapshot" olarak yazılmaya devam eder |
| **Arayüz durumu** | Panel açık/kapalı, seçili sekme | Karakterde kalabilir ama kural hesabına girmez |
| **Oturum / iç** | `_` önekli, geçici ya da senkron meta verisi | Hesaba girmez, aynen korunur |

### 1.1 Kaynak alanlar (taslak)

- **Kimlik:** `id`, `name`, `race`, `alignment`, `deity`, `size`, `gender`, `age`, `height`, `weight`, `portrait*`, `wallpaper`, `isNpc`, `cr`, `campaignId`
- **Yapı:** `baseAbilities`, `levelProgression` (eski: `progression`), `templates`, `levelAdjustment`, `customClasses`, `baseSpeed`, `houseRules`, `hitDie`
- **Sahip olunanlar (listeler):** `feats`, `specialAbilities`, `spells`, `maneuvers`, `gearPool`, `consumables`, `weapons`, `bodySlots`, `companion`, `currency`, `skills` (rank'ler), `spellcasting` (hazırlanan/bilinen büyüler)
- **Anlık oyun durumu:** `hp.current/temp/nonlethal`, `buffs`, `activeStance`, `dailyCharges` (kayıt içinde), `encounterRound`, `specialAttackCooldowns`, `combatPins`
- **Homebrew:** `customDb`
- **Notlar:** `smartNotes`, `notesList`, `notes`

### 1.2 Türetilmiş alanlar (bugün kaydediliyor, V3'te hesaplanacak)

`abilities`, `abilitySources`, `ac`, `acBreakdown`, `bab`, `baseAttackBonus`, `saves`, `baseSaves`, `evaluatedSaves`, `savingThrows`, `effectiveSpeed`, `speed`, `initiativeBreakdown`, `grappleBonus`, `spellSlots`, `dailySpellSlots`, `casterLevel`, `cl`, `templateSummary`, `evaluatedModes`, `evaluatedDefenses`, `evaluatedResources`, `legoEvaluation`, `legoEntries`, `twoHandedConflict`, `armorTacticalBadges`, `shieldTacticalBadges`, `stats`, `level`, `classes` (metin), `class`

> **Hub uyumu:** Hub `fullData` üzerinden `hp`, `abilities`, `stats`, `level`, `class`, `classes`, `name` gibi alanları okuyor. V3 bunları kaydederken `deriveSheet()` çıktısından yazmaya devam eder. Hub hiçbir şey fark etmez.

### 1.3 Arayüz durumu

`tactical.*` (`weaponSets` hariç, o kaynaktır; netleşecek), `settings`, `cockpitCollapsed`, `_preferredMagicDiscipline`, `customSilhouette*`

### 1.4 Oturum ve iç alanlar

`_hubId`, `_cloudUpdatedAt`, `_notesUpdatedAt`, `lastModified`, `_terminalUndoStack`, `_classSkillsInitialized`, `schemaVersion`

## 2. Kayıt (entry) modeli ve `kind`

### 2.1 Sorun

`type` ve `category` alanları bugün birkaç farklı anlam taşıyor. SRD verisindeki sayımlar:

- `type`: kayıt türü (`Feat` 423, `Spell` 699), hasar türü (`Piercing`, `Slashing`), bonus türü (`competence`, `enhancement`, `Untyped` 1.596), yetenek türü (`Ex` 639, `Su` 222).
- `category`: büyü okulu (`Transmutation` 151), canavar türü (`Dragon` 148), feat grubu (`General` 326), eşya grubu (`Wondrous` 1.121).

Bu yüzden `type`/`category` ve isim regex'i ile yapılan her sınıflandırma kırılgan.

### 2.2 `kind` değerleri

`kind`, SRD indeksindeki (`database/srd_index.json`, alan `t`) tutarlı tür sözlüğünden türetilir.

| `kind` | SRD `t` | Karakterde nerede durur | Not |
| :--- | :--- | :--- | :--- |
| `weapon` | Weapon | `gearPool`, `bodySlots`, `weapons` | |
| `armor` | Armor | `gearPool`, `bodySlots` | |
| `shield` | Shield | `gearPool`, `bodySlots` | |
| `ammo` | Ammo | `gearPool` | |
| `magic-item` | MagicItem | `gearPool`, `bodySlots` | Wondrous, ring, rod, staff… |
| `consumable` | Consumable | `gearPool`, `consumables` | Potion, oil, scroll, wand, poison |
| `gear` | Gear, Tool | `gearPool` | |
| `crystal` | AugmentationCrystal | `gearPool` ya da eşyaya soketli | |
| `enhancement` | Enhancement | **Tek başına durmaz**, eşyanın `enhancements` alanında | ADR-024 |
| `material` | Material | **Tek başına durmaz**, eşyanın `material` alanında | ADR-024 |
| `feat` | Feat | `feats` | |
| `flaw` | (custom) | `feats` | UA Flaw |
| `ability` | SpecialAbility, ClassAbility, RacialTrait | `specialAbilities` | Ex/Su/Sp ayrımı `abilityType` alanında |
| `boon` | (custom) | `specialAbilities` | DM Boon / DM Grant |
| `spell` | Spell | `spells` / `spellcasting` | |
| `power` | Power | — | Psionics kapsam dışı (ADR-025), sadece okunur |
| `maneuver` | Maneuver | `maneuvers` / `tomeOfBattle` | |
| `stance` | Stance | `maneuvers` / `tomeOfBattle` | |
| `template` | (srd_templates) | `templates` | |
| `race` | Race | `race` (tek değer) | |
| `class` | Class | `levelProgression` | |
| `domain` | Domain | Cleric seçimleri | |
| `deity` | (custom) | `deity` (tek değer) | |
| `buff` | Buff | `buffs` | |
| `condition` | Condition | `buffs` / durumlar | |
| `synergy` | (lego) | — | Motor otomatik açar, karakterde saklanmaz |
| `creature` | Monster | `companion` | |

### 2.3 Eski kayıtlar için `kind` çıkarımı (tek otorite: `entry-kind.js`)

Sıra kesindir, ilk eşleşen kazanır:

1. Kayıtta zaten geçerli bir `kind` varsa o kullanılır.
2. `id` (ya da `baseItemId` / `sourceId`) SRD indeksinde varsa indeksteki `t` kullanılır.
3. `id` öneki: `feat-`, `spl-`, `wpn-`, `arm-`, `shd-`, `mi-`, `pot-`, `tob-`… (indeksteki önek tablosu) ve custom önekleri `ability_`, `boon_`, `feat_`.
4. `type` alanı yalnızca **kayıt türü değerlerinden** biriyse (`Feat`, `Spell`, `Weapon`, `Armor`, `Shield`, `Special Ability`, `DM Boon`, `Maneuver`, `Stance`, `Flaw`…). Hasar ve bonus türleri (`Piercing`, `competence`…) asla eşleşmez.
5. Hiçbiri tutmazsa: **karantina**. İsim regex'i kullanılmaz.

## 3. Kimlik (id) kuralları

1. `id` her zaman **string**'dir. Sayı id'ler migration'da string'e çevrilir (`7` → `"7"`). P11'deki `String(a) === String(b)` yamalarının kökü budur.
2. SRD id'leri değişmez (`feat-hold-the-line`).
3. Yeni homebrew id'si: `<kind>_<slug>_<kısa-rastgele>`. Örnek: `ability_dragon_breath_k3f9`. Rastgele ek sayesinde aynı isimli iki farklı kayıt çakışmaz. P11'de `ability_${slug}` aynı isimde çakışıyordu.
4. Karakterdeki bir eşya **örneği** ile o eşyanın **tanımı** ayrıdır. `gearPool[i].id` örneğin kendi id'sidir. Tanım `baseItemId` (SRD) ya da `sourceId` (`customDb`) ile referanslanır. Aynı kılıçtan iki tane taşımak böylece mümkün olur.

## 4. `customDb` (karaktere özel kütüphane)

- Karakterin bütün homebrew **tanımları** buradadır: feat, ability, boon, eşya, büyü, sınıf, ırk, deity, domain.
- SRD kaydını "Change & Add" ile değiştirmek SRD'yi asla değiştirmez. Yeni bir `customDb` kaydı oluşur: yeni `id` ve `overrides: "<srd-id>"`. Çözümleme sırası: `customDb` → SRD.
- Karakter listelerindeki bir kayıt (örneğin `feats[i]`) geçiş boyunca bugünkü gibi tam nesne olarak durur (eski sayfa öyle okuyor). V3 bunlara `kind` ve gerekiyorsa `sourceId` ekler.
- **Klasik sayfa emekli olduktan sonra (Aşama 2):** listeler sadeleşir. Her kayıt `{ id, kind, sourceId, state }` olur ve tanım `customDb`/SRD'den çözülür. Bu, ayrı bir onayla yapılacak ayrı bir migration'dır.

## 5. Yazma kapısı (actions)

Karakteri değiştirmenin tek yolu şu aksiyonlardır. Hiçbir görünüm dizilere doğrudan `push` yapamaz.

| Aksiyon | Ne yapar |
| :--- | :--- |
| `addEntry(entry, { to? })` | `kind`'a göre doğru listeye koyar. `kind` yoksa önce çıkarım yapar, çıkarılamazsa reddeder |
| `updateEntry(id, patch)` | Kayıt bulunur (string id), yalnızca izin verilen alanlar değişir |
| `removeEntry(id)` | Kaldırır. Bir listeden çıkarmak tanımı (`customDb`) silmez |
| `defineHomebrew(entry)` | `customDb`'ye ekler, id kuralı 3'ü uygular |
| `equip(itemId, slot)` / `unequip(slot)` | `gearPool` ↔ `bodySlots` |
| `setAbility`, `setSkillRanks`, `setProfile`… | Kaynak alan setter'ları |
| `resolveQuarantine(id, kind \| 'delete')` | Kullanıcının karantina kararı. Silme yalnızca burada, onayla |

Her aksiyon saf bir fonksiyondur: `(character, payload) → yeni character`. Undo yığını ve senkron diff'i bunun üzerine kurulur.

## 6. Migration'lar

- `character.v3Migrations: string[]` alanı uygulanmış migration'ları tutar. Her biri bir kez çalışır.
- Her migration saf, test edilmiş ve **veri silmeyen** bir fonksiyondur.

| Id | Ne yapar |
| :--- | :--- |
| `2026-11-ids-to-string` | Liste kayıtlarındaki sayı id'leri string'e çevirir |
| `2026-11-kind-tagging` | Bölüm 2.3'e göre `kind` ekler. Çıkarılamayanları karantinaya alır |
| `2026-11-misplaced-entries` | Yanlış listede duran kaydı (örneğin `gearPool` içindeki feat) **taşımaz, karantinaya koyar** ve önerilen hedefi yazar |
| `2026-11-progression-alias` | `progression` → `levelProgression`. Eski alan silinmez |

**V3 motor kopyasındaki P11 temizliği** (`sanitizeCharacterAbilitiesAndPool`) yüklemede sessizce siliyor (synergy kayıtları, `customDb` filtresi). Bu fonksiyon V3 kopyasında yukarıdaki karantina migration'larıyla değiştirilecek. Kök dosyaya dokunulmaz.

### Karantina

```json
"quarantine": [
  { "entry": { }, "from": "gearPool", "reason": "kind-unknown", "suggested": "feat", "at": "2026-11-08T12:00:00Z" }
]
```

Arayüzde "Needs Review" rozeti olarak görünür: "Taşı" / "Olduğu gibi bırak" / "Sil (onaylı)".

## 7. Kayıt ve senkron

- Aynı localStorage anahtarları (`dnd35_character`, `dnd35_active_character_id`, `dnd35_hub_db`) ve aynı Supabase `full_data`.
- Yazma kilidi: `BroadcastChannel('dnd35-writer')`. Aynı karakter iki sekmede yazılmaz.
- Çakışma: Yazmadan önce `lastModified` kontrol edilir. Diskteki kayıt daha yeniyse V3 üzerine yazmaz, birleştirme ister.
- ADR-005 (DM HP otoritesi) değişmez.

## 8. Açık sorular (senin kararın)

1. **Gerçek karakter export'ları.** 2–4 karakter, fixture olarak. Bölüm 1 ve 6 bunlarla doğrulanacak.
2. **DM Boon ayrı bir `kind` mı?** Önerim: `boon` ayrı olsun (kaynağı DM, kuralları farklı, Hub'dan gelebilir). Alternatif: `ability` + `source: 'dm'`.
3. **"Change & Add"**: Bölüm 4'teki `overrides` modeli senin kullanımına uyuyor mu? Değiştirilen SRD kaydı karakterde hem orijinal hem değiştirilmiş olarak görünmemeli.
4. **`weapons` dizisi**: Bugün `gearPool` ve `bodySlots` ile birlikte üçüncü bir silah listesi var. Aşama 2'de `bodySlots` + `tactical.weaponSets` içinde birleştirilmesini öneriyorum. Bugün için sadece okunur.
5. **Psionics (`power`, 440 kayıt)**: SRD'de duruyor ama ADR-025'e göre kapsam dışı. V3'te yalnızca okunur bırakılsın mı?
