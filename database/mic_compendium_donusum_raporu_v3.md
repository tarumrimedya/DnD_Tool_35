# Magic Item Compendium → Canonical V2 Dönüşüm Raporu (v3)

**Çıktı:** `database/mic_compendium.json` (953 kayıt, UTF-8 BOM'suz) · **Yedek:** `database/mic_compendium.backup.json` (önceki sürüm)
**Üretici (tekrar üretilebilir zincir):**

| Adım | Script | Çıktı |
|---|---|---|
| 1 | `scratch/mic_pdf_extract.py` (PyMuPDF, 3 sütunlu MIC düzeni, satır/font/blok metadatası) | `scratch/mic_pdf_lines.tsv` |
| 2 | `scratch/mic_pdf_parse.py` (stat bloğu, flavor/açıklama/Lore/Prerequisites/Cost ayrıştırma) | `scratch/mic_pdf_items.json` |
| 3 | `scratch/build_mic_compendium.py` (+ `mic_errata.py`, `mic_mechanics.py`) | `database/mic_compendium.json`, `scratch/mic_build_log.json` |
| 4 | `scratch/mic_regression_checks.py` | Regresyon raporu (aşağıda) |

Eski `scratch/build_mic_compendium.ps1` (TSV + elle `$PDF_OVERRIDES`) artık kullanılmıyor; referans olarak yerinde bırakıldı.

---

## 1. PDF erişimi

PDF **erişilebilir durumdaydı** (`G:\Drive'ım\FRP\D&D\Kitap\Magic Item Compendium.pdf`, 297 sayfa, gömülü metin katmanı var). Sistemde kurulu **PyMuPDF (fitz)** ile okundu; yeni yazılım kurulmadı. `node` PATH'te olmadığı için tüm işleme Python (`py`) ile yapıldı.

**Mimari değişiklik (kök neden düzeltmesi):** Önceki sürümler TSV'yi temel alıp sütun kaymalarını regex + elle override ile yamamaya çalışıyordu. TSV'deki hataların kök nedeni, iki/üç sütunlu sayfanın OCR'da satır satır birleştirilmesiydi. v3'te **her alan doğrudan PDF stat bloğundan** okunuyor; TSV yalnızca kayıt listesi/sırası/bölümü (953 satır) için kullanılıyor. 953 kaydın **953'ü PDF'te eşleşti** (0 eşleşmeyen, 0 TSV fallback).

PDF ayrıştırmada çözülen teknik sorunlar: 3 sütunlu düzen (sütun başlangıçları ~60/220/390 pt), `ﬁ`/`ﬂ` ligatürleri (+ arkasındaki boşluk), satır sonu tirelemesi (belge içi sözlükle "success-fully" → "successfully", "full-round" korunur), PyMuPDF'in böldüğü satırlar ("Cost " + "to Create:" — Wrapped Tower), etiket içi boşluklar ("Pr ice", "Ac tivation", "Au ra"), sütun/sayfa kırılımında devam eden stat satırları, bölüm başlıklarının item ortasına düşmesi (Anchoring), bölüm/sütun girişi metinleri (geniş blok + y-bant filtresi), illüstrasyon altyazıları, kenar sekmeleri, tablolar (ScalaSans fontu → açıklamadan hariç), alt-başlıklı gruplar (Third Eye ×15, Psychoactive Skin ×17, Metamagic Rods ×4, Chronocharm ×6, Crystal of Energy Assault ×4 enerji × 3 derece).

---

## 2. Uygulanan düzeltmeler (görev listesi §4)

Tüm maddeler PDF ile doğrulandı; aşağıdaki değerler **PDF'teki basılı değerlerle birebir** (aksi belirtilmedikçe).

1. **Birleşik aktivasyon (137 kayıt):** `-- and swift (command)`, `Standard (command) and --`, `-- or immediate (mental)` vb. korunuyor. Shadow Maniple `Swift (command)`, Third Eye Dominate `Standard (mental)`, Runestaff of Conjuration `As spell used`, Arrow of Biting aura `Moderate; (DC 18) necromancy` / aktivasyon `-- (ammunition)`, Tentacle Rod, Greater `-- (held)` / `Main Hand` / `Standard (command)`, Chasuble of Fell Power, Greater `--`, Ring of Arcane Might `--`, Gloves of Agile Striking `Swift (mental)`, Headband of Conscious Effort `Immediate (mental)`, Lens of the Desert `Standard (command)`.
2. **Aura:** 14 "no school" kaydı tam; Blood Claw Choker, Rod of Cats, Mac-Fuirmidh Cithern çoklu okul; Third Eye Expose CL 15 `Strong; (DC 22) transmutation`; Githborn Talisman CL 7 `Moderate; (DC 18) transmutation`; Amulet of Catapsi `Moderate; (DC 19) enchantment`; Dragondoom Scepter `Moderate; (DC 20) evocation`; Sweeping `Faint; (DC 17) transmutation`; Censer of the Last Breath `Strong; (DC 22) conjuration`; Runestaff of the Assassin `Strong; (DC 21) illusion`; Runestaff of Passage `Strong; (DC 24) necromancy`; Lightning Gauntlets `Faint; (DC 16) evocation` ("113" sayfa numarası temizlendi).
3. **Body slot:** Crown of Flames `Head`, Phoenix Cloak `Shoulders`, Cognizance Crystal `--`/`Slotless`, Mind Blade Gauntlet Lesser/Greater `Hands`, Rings of Force Armor `Ring; see text`/`Ring`.
4. **Ağırlık:** 1/2 lb → 0.5, 1/4 lb → 0.25 (Camouflage Paint 0.5, Gauntlets of Mindfire 0.5, Shirt of the Moon 1).
5. **Fiyat / maliyet / önkoşul:** "gp" eksik fiyatlar (Cloak of the Salamander, Crystal of Return Lesser, Ring of Master Artifice, Ring of Master Artifice Greater, Surge Crystal, Thorn Pouch — **kitap da "gp" basmıyor**, kanonik forma tamamlandı) ve sayısal `cost`; Eternal Wand (fiyat tablosu p.160 ile doğrulandı, `casterLevel: null`, kullanıcının verdiği costToCreate); Hair Shirt of Suffering, Gloves of Agile Striking, Ghoul Gauntlets, Lens of the Desert, Shirt of Ironskin, Shirt of the Moon, Soulstone, Third Eye Dampening, Illusion Theft, Energy Surge — hepsi PDF ile aynı. Wrapped Tower: resmi errata metni (bkz. §3).
6. **İki sütun karışıklığı olan komşular:** Githborn Talisman, Bag of Flames, Mind Blade Gauntlet Lesser, Mindvault, Rings of Force Armor, Third Eye Concentrate/Expose/Improvisation, Gloves of Eldritch Admixture, Glyph Seal, Orb of Mental Renewal, Scepter of the Netherworld, Shirt of the Inevitable, Runestaff of the Artisan/Assassin/Passage, Beetle Elixir, Anchoring, Watch Lamp, Aberrant Sphere, Dragondodger — **tüm alanları PDF'ten yeniden okundu**.
   - **Hair Shirt of Suffering notu:** TSV'deki uzun liste (`barkskin, entangle, goodberry, plant growth, speak with plants, tree shape`) komşu iteme aittir; PDF: `Craft Wondrous Item, barkskin, cure serious wounds.` ✔

### Görev tanımındaki değerlerden PDF'e göre sapan noktalar (karar: PDF esas alındı)

| Kayıt | Görevdeki değer | PDF / v3 değeri |
|---|---|---|
| Crystal of Energy Assault (12 varyant) requirements | `Craft Magic Arms and Armor, Melf's acid arrow, …` | `Craft Magic Arms and Armor; Melf's acid arrow, ray of frost, lightning bolt, or fireball; or energy bolt (EPH 100).` (kitap noktalı virgül basıyor) |
| Illusion Theft [Synergy] requirements | `…, dispel magic, true seeing. …` | `Craft Magic Arms and Armor, true seeing, dispel magic. Synergy Prerequisite: Illusion bane.` (kitaptaki sıra) |
| Wrapped Tower açıklama | "…mind-affecting fear ability, and the shield's bearer is immune…" | Resmi errata metni: "…This is a mind-affecting effect. The wielder of the shield is immune to this effect." |
| Aberrant Sphere costToCreate | `1,400 gp, 112 XP, 3 days.` | Kitap `1,400 gp, 112 XP.` basıyor (gün eksik). Görevdeki değer uygulandı (1 gün / 1.000 gp kuralıyla tutarlı), rapor ediliyor. |
| Modifier hedef adları | `stats.str`, `saves.ref` … | `ability.str`, `save.ref`, `save.all`, `skill.<snake_case>` — bkz. §5 |

---

## 3. Resmi errata (PDF s. 291–297) — yeni

PDF'in sonunda bağlı **"Magic Item Compendium Errata"** ve **"Auras Errata"** sayfaları bulundu ve `scratch/mic_errata.py` içine aktarıldı. Her kayıtta uygulanan errata `errata: [...]` alanında kaynak sayfasıyla listeleniyor (171 kayıt).

- **Metin/kural erratası uygulandı (96 işlem, 55 kayıt):** Bane Blind, Fearsome, Menacing, Domineering, Doom Burst ("This is a mind-affecting effect."), Wrapped Tower, Desiccating Burst (2 işlem), Everbright (+ Cost 1,000 gp, 80 XP, 2 days), Fleshgrinding, Morphing (Activation `Standard (command)`), Paralyzing, Prismatic Burst (Cost 15,000 gp, 1,200 XP, 30 days), Cudgel That Never Forgets (Ego score 12), Flesh Ring of Scorn (`Immediate (mental)`), Gauntlet of Gruumsh, Gauntlets of Lassitude, Tabard of the Great Crusade, Diamondskin Decanter, Pipes of Frenzied Revelry, **32 runestaff fiyat/maliyet düzeltmesi** (ör. Runestaff of Passage 60,200 gp (18th) / 30,100 gp, 2,480 XP, 61 days), Runestaff of Destruction/Eyes/Undead Slayer büyü değişimleri, Armband of Confrontation, Crystal of Alacrity, Serpent Veil, Turquoise Veil.
- Errata metnindeki küçük dil hataları ("is not affect", "will not returns", "which last", "activate these gauntlets make") anlam değişmeden düzeltildi.
- **Runestaff of Night:** errata `6,200 gp, 96 XP, 13 days` basıyor (1/25 kuralına göre 496 XP olmalı) — **olduğu gibi aktarıldı, doğrulama gerekiyor.**
- **Aura erratası (117 kayıt, yalnızca okul düzeltmesi):** Görev tanımı basılı auraları istediği (ör. Amulet of Catapsi `enchantment`, Dragondoom Scepter `evocation`) için `aura` alanında **basılı değer** tutuldu; errata okulu (`Abjuration`, `None` …) `errata` notuna yazıldı. `build_mic_compendium.py` içinde `APPLY_AURA_ERRATA = True` yapılarak tek satırla uygulanabilir. **Karar kullanıcıya bırakıldı.**

---

## 4. Listede olmayan, yeni tespit edilen hatalar (TSV → PDF)

PDF/TSV karşılaştırmasında **327 alan farkı** tespit edildi (`scratch/mic_build_log.json` → `diffs`): description 89, requirements 66, costToCreate 52, aura 29, flavor 29, priceText 27, activation 22, bodySlot 7, weight 4, casterLevel 2. Öne çıkanlar:

- **Komşu itemden sızan önkoşul/maliyet (TSV yanlış, PDF doğru):** Bag of Flames (TSV `calm emotions` / `7,500 gp`), Camouflage Paint (TSV mandolin maliyeti), Gauntlets of Mindfire, Gloves of Agile Striking, Glyph Seal (`greater magic weapon…`), Mindvault (`sound burst, bard`), Orb of Mental Renewal (`daze monster…`), Rings of Force Armor (`Craft Wondrous Item…` → `Forge Ring…`, 15,000 gp), Third Eye Expose/Concentrate/Improvisation (maliyetler kaymış), Ectoplasmic Feedback, Dragondodger, Rod of Bodily Restoration (`restoration` → `lesser restoration`), Runestaff of Passage önkoşul listesi (Runestaff of Night'ınkiydi), Runestaff of the Artisan (Cacophony metni).
- **costToCreate'e sızan tablo/set metni:** Chime of Harmonic Agony, Chromatic Rod, Cli Lyre, Cognizance Crystal, Gauntlets of the Blazing Arc, Horn of Resilience, Mask of the Tiger, Veil of Whispers, Vest of Free Movement, Zombie Hide Armor, WHIRLING vb. ve sona eklenmiş sayfa numaraları (Aberrant Sphere "149", Crown of Flames "209", …).
- **Açıklamaya karışan komşu metin:** Ghoul Gauntlets, Githborn Talisman, Beetle Elixir, Scepter of the Netherworld, Shirt of the Inevitable, Third Eye Expose, Runestaff of Passage/Artisan, Mind Blade Gauntlet Lesser (Mindvault metni), Crystal Anchor of Alertness (Cornucopia metni), Incarnum Focus / Amber Amulet / Morningstar of the Many (tablo hücreleri), Anchoring (bölüm girişi), Fiercebane / Illusion Bane / Phoenix Ash Threat (Lore paragrafı açıklamada).
- **Flavor ↔ açıklama kayması:** ~29 kayıt (augment kristalleri, sinerji varyantları, Electric Eel Hide, Shield of Vigor, Shield of the Resolute, Orb of Mental Renewal "deser"…).
- **Kesik değerler:** augment kristal fiyatları (`or 3,000 gp` sonrası eksik), Banner of the Storm's Eye ağırlığı, Mithral Bells / Shirt of the Leech aktivasyonu.
- **Kitap ile çelişen eski override'lar:** Cognizance Crystal fiyat tablosu (eski: `25,000 gp (16th)` → PDF `(15th)`), Amber Amulet of Vermin fiyat tablosu (eski tamamen yanlıştı; PDF p.68: 500/700/800/1,200 gp, errata ile "Large monstrous scorpion").
- **İsim hataları:** `Gauntlets of Infinite Blades` → **Gauntlet of Infinite Blades** (p.101), `Gauntlets of Endless Javelins` → **Gloves of Endless Javelins** (p.194). Id'ler buna göre değişti.
- **Tutarsız bölüm (Section):** Craft Staff/Craft Rod önkoşullu ama TSV'de "Tools/Clothing" olan 30 kayıt (23 runestaff, Conduit Rod, Harrow Rod, Rod of Bodily Restoration, Scepter of the Netherworld, Soul Anchor, Spider Rod, Warlock's Scepter) kendi yaratım feat'ine göre **Staff/Rod** kategorisine alındı (`stf-mic-*`, `rod-mic-*`, slot `Main Hand`). Toplam 32 id değişti; depoda bu id'lere referans yok (kontrol edildi).
- **Kitabın kısaltılmış stat blokları:** "Greater/Lesser/Improved" varyantlarda kitap Body Slot/Activation/Weight/CL/Aura satırlarını basmıyor; bunlar TSV yerine **PDF'teki temel itemden** devralındı (48 alan, log: `inherited_from_base_item`). Maliyet yalnızca temel item "Varies." ise devralındı (Soulbound, Greater armor).
- **Soulbound, Greater [Synergy] (weapon):** kitap Synergy Prerequisite satırı basmıyor; [SYNERGY] alt tipi + metinden `Synergy Prerequisite: Soulbound.` eklendi.
- **Sayfa numaraları:** `source` artık her kayıtta PDF'teki basılı sayfa numarası (TSV'de 700+ kayıtta boştu).
- Ek veri: 86 kayıtta `lore` alanı (açıklamaya karıştırılmadan), sinerji özelliklerinde `requirements` sonuna `Synergy Prerequisite: …`, enhancement'larda kitabın `Property:` satırı `appliesTo` alanında.

---

## 5. Yapısal mekanik (modifiers / damageParts)

`scratch/mic_mechanics.py` içinde **elle, PDF metni okunarak** kürate edildi (regex tahmini yok): **96 kayıtta modifiers**, **15 kayıtta damageParts**, 47 kayıtta `charges/maxCharges`.

- Yalnızca **sürekli ve koşulsuz** bonuslar kodlandı. `rule_engine.js` (L1027-1072) `condition` alanını değerlendirmeden toplama eklediği için koşullu bonuslar (ör. "if airborne", "against dragons", hizalama şartlı relic güçleri) bilinçli olarak **boş bırakıldı**.
- **Hedef adları:** görevdeki `stats.*` / `saves.*` adları motor ve tüm diğer veritabanları (`srd_*.json`, `master_db.json`) tarafından **tanınmıyor**; motor `ability.str`, `save.ref`, `save.all`, `skill.move_silently` kullanıyor. Kalıcı uyumluluk için motorun ve mevcut verinin sözlüğü kullanıldı (rule_engine.js'e dokunulmadı). Zırh bonusu için `ac.armor` + tip `Armor` (motorun anladığı RAW bonus tipi).
- Burst kritik zarları PDF tablolarından okundu (Acidic 1d10, Desiccating 1d8, Sacred/Profane 1d10, Screaming 1d8 — `onCritOnly` + `critScaleByMult`). **Psychokinetic Burst** kritik tablosu güvenilir şekilde eşleştirilemediği için yalnızca temel 1d4 force kodlandı.

---

## 6. Doğrulanamayan / açık kalan noktalar

- `Dragon's Draught` ve `Empowered Spellshard` fiyatı kitapta "See text"; tabloları metin katmanında yakalanamadı → `priceText: "See text"`, `cost: 0`.
- Aura erratasının uygulanıp uygulanmayacağı (§3) — kullanıcı kararı.
- Runestaff of Night errata XP değeri (96 XP) şüpheli.
- Psychokinetic Burst kritik zar tablosu.
- `tools/verify_and_sync.js` çalıştırılamadı (`node` PATH'te yok); `webapp/` senkronizasyonu yapılmadı. Diğer veritabanı dosyalarına (srd_*.json, index.html, char_*.js, rule_engine.js) dokunulmadı.

---

## 7. Regresyon kontrolleri (`py scratch/mic_regression_checks.py`)

| Kontrol | Sonuç |
|---|---|
| Kayıt sayısı = 953 | ✅ 953 |
| Tekrarlı id | ✅ 0 |
| UTF-8 BOM | ✅ 0 |
| JSON parse | ✅ temiz |
| Türkçe `İ`/`ı` veya ligatür (ﬁ, ﬂ …) | ✅ 0 |
| U+1F3B2 zar emojisi | ✅ 0 |
| U+FFFD (bozuk karakter) | ✅ 0 |
| Çıplak "no" ile biten aura | ✅ 0 |
| Açıklamada `<b>Aura:</b>` / Prerequisites footer | ✅ 0 |
| costToCreate/requirements sonunda virgül veya 2-3 haneli sayfa no | ✅ 0 |
| Alan desen ihlali (aura/activation/priceText/costToCreate format, komşu cümle sızıntısı, etiket sızıntısı, "?" OCR glifi, küçük harfle başlayan paragraf, aşırı uzun alan, geçersiz slot, 1/2→2 ağırlık) | ✅ 0 |
| Görevdeki açık düzeltmelerin birebir kontrolü (60+ assertion) | ✅ 0 uyumsuzluk |
| Birleşik aktivasyon sayısı | 137 |
