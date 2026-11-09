# Builder Workbook (v7.4.0.1) → Joyful-Fermi V2: Gap Audit Report

**Date:** 2026-11-09 · **Brief:** the original audit brief · **Status:** Read-only audit. No repo code or `database/*.json` was changed.

**Terminology:** "the workbook" / **WB** = the source character-builder spreadsheet (`.xlsm`, v7.4.0.1) and its companion CSVs; **JF** = this project's `database/*.json`.

**Method:** Python 3.12 streaming parser (`zipfile` + `ElementTree.iterparse`) over all 65 worksheets plus `sharedStrings.xml`, cross-joined with every `database/*.json` chunk and 14 FoundryVTT `.db` files. Node.js is not on PATH on this machine, so `node tools/verify_and_sync.js` was **not run**. Nothing changed that it would check.

Name matching uses a stronger key than `SrdCompendium.normalizeNameKey`: lowercase, strip `[...]`/`(...)` and non-alphanumerics, and invert `"Axe, Throwing"` → `"throwing axe"`. Aliases are included. Counts are therefore **upper bounds for "already in JF"** and **lower bounds for "net-new"**: a few spelling variants may still slip through.

---

> **Update 2026-11-09:** the conflicts in §3.1–3.2 and §3.4 were checked against the rulebooks. See `SRD_IMPORT_VERIFICATION_TABLE.md`. Three findings below were corrected there: *Absolute Steel* is the correct name, `--Improved Grapple--` is an WB artifact, and War Mage ≠ Warmage.

## 0. Corrections to the Brief (Read First)

| Brief assumption | Actual finding |
| :--- | :--- |
| Big sheets (`Prestige Classes I–III` 11 MB, `Attacks`, `Enhancements`, `Buffs`, `Spell Info`, `Template Info`) hold catalog data | **Wrong.** These are character-builder **UI/calculation sheets**. The XML size is formatting and formulas. For example, `Prestige Classes I` has 26 non-empty rows, all picklists. The real catalogs are `Class Info`, `Feats`, `Interfaces`, `Domains`, `Deities`, `Maneuvers & Stances`, `Variants`, `Class Abilities`, plus `data/WeaponInfo.csv` and `data/CreatureInfo.csv`. |
| The workbook has a spell catalog (`Spell Info`, `Spells Known`) to diff against `srd_spells.json` | **No individual spell records exist.** `Spell Info` holds 70 *caster classes* (type, casting stat, TLA). The only spell data is **domain spell lists** (`Domains` sheet), which reference 670 distinct spell names. |
| `char_progression.js` contains `PRESTIGE_CLASSES_35E` / `BASE_CLASSES_35E` | **These constants do not exist** anywhere in the repo. Class data lives only in `database/srd_classes_races.json` (42 Base + 33 Prestige `Class` records). |
| `D:\Downloads\DND DB\*.db` gives full text for the workbook splatbook content | **No.** Those Foundry D35E packs are SRD-only, and JF has **already ingested them** (records carry `foundryId`; counts match). **0** The workbook net-new entries have a Foundry full-text counterpart in any category. |
| Database baseline counts | `srd_index.json` chunk counts lag the files: feats 452 in index vs 467 in file, classes_races 256 vs 281, spells 1,114 vs 1,139. `srd_companions.json` is a single progression document, not 69 records. `verify_and_sync.js` should be checked for why the index is stale. |
| Feat column `AY` = feat type, `BD` = modifier hooks | `AX`/`AY`/`BA`–`BH` are **picklist helper columns** (metamagic / item-creation dropdown sources), not per-feat metadata. Feat type comes from the **section header row** above each block (`General Feats`, `Tactical Feats`, …). |

---

## 1. Worksheet Inventory (Valid Entries)

| Category | Location | WB entries | In JF | **Net-new** | Content level |
| :--- | :--- | ---: | ---: | ---: | :--- |
| **Feats** | `Feats` (sheet35) | 2,612 rows / **2,532 unique** | 410 rows | **2,202 rows / 2,132 unique** | Name, prereq text, 1-line summary, book + page, bonus-feat class tags |
| Flaws | `Flaws` (sheet33) | 13 | 12 | 1 (*Weak Will*) | Summary + UA page |
| Traits | `Traits` (sheet32) | 35 | 2 | **33** | Summary + UA page |
| Skill Tricks | `Skill Tricks` (sheet29) | 42 | 0 | **42** | Prereq, summary, category, CS page |
| Base classes | `Class Info` (sheet16) | 78 real (incl. 6 NPC, 12 UA racial paragons, 2 `NOT IMPLEMENTED`) | 37 | **≈41** | Chassis only (see §2.3) |
| Prestige classes | `Class Info` (sheet16) | ≈621 | 30 | **≈591** | Chassis + prereq bullet text |
| ACFs / Variants | `Variants` (sheet21) | 277 (34 classes) | 23 | **254** | Name, prereq, source book; **no rules text** |
| Class ability text | `Class Abilities` (sheet49) | 5,163 text rows / 4,156 `× Name (Ex/Su/Sp): …` heads | n/a | n/a | Prose. The class↔ability link is formula-driven and **not recoverable** from cached values. |
| Domains | `Domains` (sheet54) | 158 (156 unique) | 40 | **118** | Granted-power summary + 9 domain spells |
| Domain-referenced spells | `Domains` | 670 distinct | 420 | **250** | Name only |
| Deities | `Deities` (sheet53) | 719 | ≈2 | **717** | Alignment, domains CSV, favored weapon (528 have one) |
| Maneuvers & Stances | `Maneuvers & Stances` (sheet34) | 208 | 207 | **1** (*Boulder Roll*) | Discipline, level, type, page, summary. JF names *Absolute Steel* where ToB says **Absolute Steel Stance**. |
| Weapons | `data/WeaponInfo.csv` (+ `Interfaces!X`) | 277 (S 53 / M 56 / E 168) | 70 | **207** | **Full stats** |
| Armor & shields | `Armor` (sheet36) | 64 | 17 | **47** | **Full stats** |
| Magic equipment | `Magic Equipment` (sheet39) | 602 (11 body slots) | 467 | 135 | Picklist name + market value + slot. Mostly generic SRD names (*Amulet of health*) that JF stores as scaled variants. |
| Races / creatures | `Interfaces!D:E` + `data/CreatureInfo.csv` (521 rows) | 519 (198 MM) | 169 | **350** | Size, type, HD, speeds, NA, attacks, SLAs, senses, stats, LA |
| Templates | `Template Info` (sheet12) | 53 | 11 | **42** | Name + calc columns |
| Companion / familiar creatures | `Creature Info` (sheet13) | 138 | 97 | 41 | Stat rows |
| Buff spells | `Buffs` (sheet40) | 69 | 40 | 29 | UI toggles only |
| Conditional penalties | `Buffs!V` | 17 | 13 | 4 | UI toggles |
| Marshal auras | `Marshal Auras` (sheet27) | 32 | 4 | 28 | Names only |
| Binder vestiges | `Binder Vestiges` (sheet26) | 57 | 0 | 57 | Name, DC, level |
| Soulmelds | `SoulmeldsInfo` (sheet18) | 105 | 3 | 102 | Names, chakras, classes |
| Grafts | `Grafts` (sheet31) | 114 | 1 | 113 | Name, price, ability adjustments |
| Sourcebook legend | `Sources` (sheet7) | 60+ codes | n/a | n/a | Code → title map |

### 1.1 Feats by Source Code (`AW`)

Top sources: EL 154 · PH 109 · PH2 105 · CP 102 · CW 88 · XPH 78 · PGtF 73 · OA 72 · RoF 69 · CAr 66 · RoS 66 · TM 65 · CM 64 · CAd 63 · ECS 63 · RE 63 · SV 62 · Dmag 60 · MoI 57 · CS 55 · LM 55 · Dr 53 · PGtE 50 · BE 49 · CD 48 · CC 40 · ChR 39 · ToB 38 · DrM 36 · RoD 33 · RotD 33 · MoE 32 · CoD 31 · RotW 30 · FB 30 · HH 29 · ChV 29 · … (59 codes total; full table in `gap_report.json`).

Net-new is concentrated in CP 102, PH2 101, CW 70, PGtF 70, OA 70, RoF 69, RoS 66, TM 65, CM 63, ECS 63, RE 63. Core PH/DMG/EL is mostly already in JF: only 47 Epic feats are missing.

The workbook source codes **do not match the brief's vocabulary**: `PH` not `PHB`, `PH2` not `PHB2`, `CAd` not `CAdv`, `CAr` not `CArc`, `Dr` = Draconomicon, `DrM` = Dragon Magic, `Dmag` / `DMag` (two spellings), `MM4`, `FB` = Frostburn. A canonical source-code map is a Phase 0 prerequisite.

### 1.2 Feats by Section (Type Header)

General 1,289 · Psionic 116 · Metamagic 90 · Epic 73 · General & Racial 71 · Regional 70 · Recitation 69 · Monstrous 66 · Divine 49 · Tactical 49 · Exalted 43 · Racial 42 · Item Creation 41 · Initiate 34 · Wild 31 · Reserve 31 · Heritage 30 · Psionic Racial 29 · Draconic 29 · Pact Magic 29 · Aberrant 27 · Shifter 23 · Domain 22 · Vile 21 · Metapsionic 20 · Luck 20 · Weapon Style 19 · … (53 sections). There are 60 feat names in more than one section, e.g. *Improved Grapple*, *Two-Weapon Rend*, *Divine Justice*. These must be merged into one record with a `featTypes[]` array.

---

## 2. Column Schema Maps

### 2.1 `Feats` (sheet35), Data From Row 11

| Col | Meaning | Notes |
| :--- | :--- | :--- |
| `D` | **name** | A row with `D` but no `AW` is a header. A header ending in "Feats" is the type; otherwise it is a book group. |
| `E` | **prerequisites** (text) | 2,313 feats have one |
| `F` | **summary** (` : …`, avg 66 chars, `×` bullets) | 81 empty |
| `H` | **bonus-feat class TLAs** (`Ftr,BsB,KES,…`) | 238 matched feats have tags. TLAs resolve via `Class Info!C/D`. |
| `Q`–`X` | prereq-check booleans (Stats/BAB/Level/Skill/Feats/Other) | Formula outputs. Ignore. |
| `Y`/`Z`/`AA`/`AB` | S&C / source / campaign availability / LG status (`O` open, `C` closed…) | |
| `AS` | **page** | 69 missing |
| `AT` | **citation** `(CW 110)` | |
| `AW` | **sourcebook code** | |
| `AX`–`BH`, `BJ`–`BN` | dropdown helper lists (metamagic, item creation, class TLA table) | Not per-feat data |

### 2.2 Flaws / Traits / Skill Tricks

| Sheet | name | prereq | summary | source | page | other |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Flaws` | `C` | n/a | `I` | `G` (`(UA`) | `H` (`Pg 91)`) | |
| `Traits` | `C` | n/a | `L` | `I` | `J` | |
| `Skill Tricks` | `C` | `D` | `E` | CS (implicit) | `M` | `F` category (Movement 17 / Manipulation 12 / Mental 7 / Interaction 6), `N` campaign status |

### 2.3 `Class Info` (sheet16), Header Row 2, Data From Row 5

| Col | Meaning | V2 target |
| :--- | :--- | :--- |
| `B` | name. A row starting with `–` is a section header (`– Prestige Classes Complete Warrior`). | `name`, `category` (Base/Prestige/NPC/Paragon) |
| `C` / `D` | short abbreviation / TLA | `aliases`, bonus-feat tag resolution |
| `K` | **skill points per level** | `skillPointsPerLevel` |
| `L` | **hit die** (`12`) | `hitDie` |
| `M`–`T` | turn, armor (light/medium/heavy/shield/tower), simple/martial proficiency flags | `proficiencies` |
| `U` | other weapon proficiencies (`Club;Dagger;…`) | `proficiencies.weapons[]` |
| `V` | **BAB** fraction (1 / 0.75 / 0.5) | `babProgression` high/medium/low |
| `W`/`X`/`Y` | **Fort/Ref/Will** (0.5 = good, 0.34 = poor) | `savingThrows` |
| `G`–`J` | bonus caster / 2nd caster / manifester / meldshaper progression flags | `spellcasting.advancesCasterOf` |
| `AI`–`DJ` | **class-skill matrix**: `2` = class skill, `1` = cross-class, `0` = n/a. 82 skills including Martial Lore, Autohypnosis, Psicraft, Iaijutsu Focus. | `classSkills[]` (collapse `Craft ()` / `Knowledge ()` placeholders) |
| `DK` | **source code** | `source` |
| `DL` | LG status (Open / Closed / Limited / NPC Only) | drop |
| `EC` | **prerequisite bullets** (`• BAB +6\n• Dodge feat…`) | `prerequisites` + parsed `prereqStruct` |
| `EB` | Do / Might qualify (calc) | ignore |

**Not in the workbook in recoverable form:** per-level class-feature tables, and level-by-level special abilities. `Class Abilities` text exists, but its class↔level linkage is computed by formulas. `Spells per Day` (sheet56, 397 rows) holds slot tables for the 70 caster classes and **can** be extracted as a follow-up.

### 2.4 Other Key Sheets

| Sheet / file | Columns |
| :--- | :--- |
| `Domains` | `A` name (`xx-Chaos-xx` = alignment domain), `B` granted power summary, `C`–`K` spell levels 1–9 |
| `Deities` (from row 5) | `A` name, `B` alignment, `D`/`E` race/alignment flags, `I` domains CSV, `J` favored weapon, `M`–`AA` per-sourcebook domain lists |
| `Maneuvers & Stances` | `D` name (row without `I` = discipline header), `I` level, `K` type (Strike/Boost/Counter/Stance), `AG` school, `AJ` page, `AK` summary |
| `Variants` | `C` name (row without `D`/`E` = class header), `D` prereq, `E` source book title |
| `data/WeaponInfo.csv` | `Cat` S/M/E · `Size` L light / O one-handed / T two-handed / R ranged / U unarmed · `Dmg1(M)`/`Dmg2(M)` = **die-step code** · `Threat` (19 = 19–20) · `Crit1`/`Crit2` · `Range` · `Wgt` · `Type` (P/S/B, `S/P`, `B&P`) · `Reach` · `Special` (`T` thrown, `F`/`M` flags to verify) |
| `Armor` (from row 5) | `H` name, `I` source, `J` material, `K` type, `M` AC, `N` max Dex, `O` ACP, `P` ASF %, `Q` weight |
| `data/CreatureInfo.csv` / `Creature Info` | `Race`, `Category`, `Size`, `Type`, `Subtype`, `HD`, speeds (Land/Burrow/Climb/Fly+Maneuver/Swim), `Natural Armor`, `Natural Attacks`, SLAs, psionics, LowLight/Darkvision, immunities/vulnerabilities/ER/SR/DR/Fast Healing, Str–Cha, racial skill mods, bonus feats, languages, CR/LA adj., `Src`/`Pg` |

**Weapon damage die-step code**, verified against PHB weapons: `3`=1d3 (Gauntlet, Whip) · `4`=1d4 (Dagger) · `5`=1d6 (Club, Shortspear) · `6`=1d8 (Longsword) · `7`=1d10 (Halberd) · `8`=1d12 (Greataxe) · `9`=2d4 (Falchion) · `10`=2d6 (Greatsword). Medium-size base only. Feed it into `damageParts[0].dice`.

---

## 3. Diff / Enrichment Against Existing JF Records

### 3.1 Feats (410 Matched)

| Enrichment opportunity | Count |
| :--- | ---: |
| `source` has no page number (WB gives book + page) | **286** |
| WB prereq exists but JF has no `prereqStruct` | 51 |
| `isFighterBonusFeat` disagrees with WB `Ftr` tag | **41** (sample below) |
| Matched feats with multi-class bonus-feat tags (Psychic Warrior, Hexblade, Swashbuckler…) | 238 |

**Fighter flag disagreements:** most are Epic feats that WB tags `Ftr` because of the ELH epic fighter bonus-feat list: *Epic Prowess*, *Epic Toughness*, *Epic Weapon Focus*, *Devastating Critical*, *Dire Charge*, *Distant Shot*, … Also *Two-Weapon Rend*, *Sharp-Shooting*, *Combat Archery*. JF says `Ftr` where WB does not for *Tower Shield Proficiency*, *Monkey Grip*, *Evasive Reflexes*, *Snap Kick*, *Stone Power*, *--Improved Grapple--*.

**Recommendation:** replace the boolean with `bonusFeatFor: ["Fighter", "Psychic Warrior", …]` plus a `bonusFeatTier: "heroic" | "epic"` note, so epic-list membership does not leak into heroic Fighter bonus feats. Decide each of the 41 against the books. Do not auto-overwrite.

**JF data hygiene found during the diff:** `srd_feats.json` contains Foundry picker artifacts as records: `Weapon Focus (No Weapon Selected)`, `Skill Focus (Not Set)`, `Rapid Reload (None)`, `Armor Proficiency (Light)`, and `--Improved Grapple--`. These are not RAW feat names and should be normalized to the base feat plus a `choice` field.

### 3.2 Classes (67 Matched)

After normalizing format (`d12`↔`12`, `med`↔`medium`), HP/BAB/skill points agree. These **9 save/HD conflicts** need a book check. Whichever source is wrong gets fixed:

| Class | JF | The workbook |
| :--- | :--- | :--- |
| Knight (PH2) | Fort high | Fort low |
| Spellthief (CAd) | Ref high | Ref low |
| Factotum (DgS) | Ref low | Ref high |
| Dervish (CW) | Fort high, Will low | Fort low, Will high |
| Ur-Priest (CD) | Fort high | Fort low |
| Jade Phoenix Mage (ToB) | Will high | Will low |
| War Mage ↔ Warmage | HD 6 / Fort low | HD 4 / Fort high. **Likely a false name match**: WB's "War Mage" may be a different entry than CAr *Warmage*. |

Also: 31 matched classes lack a page in `source`, and 3 JF prestige classes have no prerequisite data at all.

### 3.3 Domains / Spells

- 118 net-new domains (Spell Compendium, Races of *, Frostburn, Sandstorm, Stormwrack, BoVD/BoED, Eberron, Dragonlance…).
- These domains reference **250 spells that do not exist in `srd_spells.json`** (e.g. *Aerial Alacrity*, *Bigby's Clenched Fist*, *Blizzard*, *Castigate*, *Demonflesh*). Bigby's and Drawmij's are SRD spells under renamed titles (*Clenched Fist*, *Instant Summons*), so an **alias table** is needed before counting them as missing. Typos in the WB source also exist (*Analyxe Dweomer*, *Dicern Lies*).
- Importing domains without those spells breaks the immutable-`id` rule. A domain spell slot would point at nothing.

### 3.4 Maneuvers

The JF catalog is essentially complete. Fix the name *Absolute Steel* → **Absolute Steel Stance** and add *Boulder Roll* (Stone Dragon). WB has no level or discipline conflicts with JF.

---

## 4. Cross-Join With `D:\Downloads\DND DB\`

| Foundry pack | Records | Overlap with JF | Overlap with WB net-new |
| :--- | ---: | :--- | ---: |
| `feats.db` | 388 | already ingested (`foundryId`) | **0** |
| `spells.db` / `powers.db` | 673 / 441 | already ingested (699 Spell + 440 Power in JF) | **0** of the 250 missing domain spells |
| `magic-items.db` | 636 | already ingested | 0 |
| `classes.db` / `class-abilities.db` | 33 / 129 | already ingested (42 Base / 129 ClassAbility) | 0 |
| `enhancements.db`, `materials.db`, `weapons-and-ammo.db`, `armors-and-shields.db` | 89 / 17 / 85 / 18 | already ingested | 0 |
| `commonbuffs.db`, `conditions.db` | 37 / 38 | already ingested (37 Buff / 38 Condition) | 0 |

**Conclusion:** the Foundry packs have nothing more to give for this migration. The proposed "the workbook index + Foundry full text" join yields zero new full-text records. Splatbook content will be **summary-level only**, unless the user supplies rules text from their own books through the existing Rule Master AI / Manual Rule flow.

Licensing note: WB summaries are short paraphrases. Full verbatim WotC non-OGL book text (CW, PH2, ToB…) is not something to bulk-scrape into the repo.

---

## 5. Data-Quality Flags That Must Be Filtered (Zero-Dummy Policy)

| Marker | Occurrences | Action |
| :--- | ---: | :--- |
| `(not verified)` in prereq/summary | 255 feats, 234 classes | Keep the text but strip the marker. Set `verification: "unverified"`. |
| `DNT TBD` (data not transcribed) | 36 feats | **Exclude.** This is placeholder data. |
| `-See Complete Warrior-` style pointers | 16 feats | Exclude, or keep with an empty summary and `contentLevel: "stub"` |
| `(NOT IMPLEMENTED)` classes | 2 (Shadowcaster, Truenamer) | Exclude |
| `<custom-defined class>`, `N/A` (Lycanthrope HD), `Template*`, `Custom Template`, `You do not have this ability`, `Select …`, `#N/A` | various | Exclude (parser already filters these) |
| `×` (U+00D7) bullets in summaries | most class-ability and multi-line feat text | Normalize to `•` |
| Duplicate feat names across sections | 60 | Merge into one record with `featTypes[]` |
| Excel mojibake (`â€`, `Ã`, PUA glyphs) | **0** found | n/a |

**Prereq parse coverage** (`prereqStruct` feasibility). Of 2,313 feats with prerequisites, **1,164 (50%) parse fully** with deterministic rules: feat name 1,054 tokens · ability score 599 · skill ranks 404 · class feature 290 · BAB 216 · race 194 · caster level 154 · class level 142 · alignment 62 · manifester level 44. The 1,503 unparsed tokens are dominated by `Meet Regional Requirement` (129), subtypes/types (*dragonblood*, *undead type*), *Any metamagic feat*, OA clan names, HD minimums, and size. These need a small, explicit `prereqStruct.other[]` vocabulary rather than regex guessing.

---

## 6. Recommended Phased Import Architecture

### 6.1 Principles

- **Staging, not direct writes.** the import scripts (now in `tools/srd_import/`) write only to a staging folder. A separate, reviewed promote step moves accepted records into `database/` chunks. `srd_*.json` core chunks stay untouched. New content goes into **new lazy chunks** (`eagerLoad: false`) registered in `srd_index.json`.
- **Provenance on every record:**
  ```json
  "provenance": { "origin": "builder-workbook-7.4.0.1", "sheet": "Feats", "row": 385 },
  "contentLevel": "summary",
  "verification": "unverified"
  ```
  The UI can then badge summary-only entries, and later enrichment can replace them in place by `id`.
- **No heuristic math.** `modifiers: []` and `damageParts` are filled only where the data is structured: weapons, armor, trait/flaw flat bonuses parsed with a closed vocabulary. All other mechanics stay as `benefit` text, honoring GEMINI.md §3 *No Heuristic Regex Guessing*.
- **IDs:** use `feat-<slug>` and so on. Before allocating an ID, check the existing `srd_index.json` `id`/`n` keys so a matched entry enriches the existing record and never duplicates it.

### 6.2 Pipeline (`tools/srd_import/`)

1. **Read the ZIP with zero dependencies.** Parse the end-of-central-directory record, then `zlib.inflateRawSync` the needed entries: `sharedStrings.xml`, the 10 data sheets, and the 2 CSVs from `master.zip`. Use a SAX-style tag scanner for `<row>`/`<c>`; no DOM over the 14 MB XML. About 120 lines.
2. **Run the per-sheet extractors** from the column maps in §2. The prototype logic exists as `analyze.py` in the session scratchpad.
3. **Normalize:** canonical source-code map (`PH`→`PHB`, `PH2`→`PHB2`, `CAd`→`CAdv`, `Dmag`/`DMag`→`DrM`, …), bullet cleanup, die-step decode, BAB/save fraction decode, class-skill matrix → `classSkills[]` ids matching the existing `climb`, `handle_animal` style.
4. **Match:** `id` → normalized name → alias table. Output three files per category: `*.enrich.json` (diffs against existing records), `*.new.json`, and `*.conflicts.json` (the §3.2 save table, Fighter flags).
5. **Validate against `rule_master_ai_schema.json`.** Any new field (`bonusFeatFor`, `featTypes`, `contentLevel`, `provenance`, `verification`) needs to be added there, in `normalizeEntry`, and in the `rule_engine.js` read path in the same change (GEMINI.md §3.6).
6. **Promote, then run `node tools/verify_and_sync.js`.** That command rehashes the index and runs the 186 golden `deriveSheet` assertions. New lazy chunks must not alter any golden output.

### 6.3 Phase Order (Value ÷ Risk)

| Phase | Scope | Records | Why this order |
| :--- | :--- | ---: | :--- |
| **P0** | Source-code map, alias table, staging extractor, schema fields | n/a | Prerequisite for everything else |
| **P1** | **Enrich existing records only:** 286 feat page numbers, 31 class pages, 51 `prereqStruct`, 3 PrC prereqs, *Absolute Steel Stance* rename. Review the 41 Fighter flags and 9 save conflicts by hand. | ~370 edits | Zero new surface area; fixes correctness |
| **P2** | Fully structured net-new: **207 weapons** (complete stats → `damageParts`), **47 armor/shields**, **42 Skill Tricks** (new `type: "SkillTrick"`, CS), **33 Traits + 1 Flaw** (UA), *Boulder Roll* | ~330 | All fields are deterministic, so no summary-only problem |
| **P3** | **Feats net-new** (2,132 unique minus 36 `DNT TBD` minus 16 pointers ≈ **2,080**) in lazy chunk(s) `srd_feats_splat.json` (est. 0.9–1.2 MB), `contentLevel: "summary"`, `prereqStruct` for the 50% that parse, `bonusFeatFor[]` | ~2,080 | Biggest player-facing value. Needs the P0 schema. |
| **P4** | Classes: ≈41 base + ≈591 PrC **chassis** (HD, BAB, saves, skill points, class skills, proficiencies, prereq text/struct) in `srd_classes_splat.json`. Add `Spells per Day` tables for casters later. | ~630 | Chassis without class features is only partly usable. Gate the UI so these show as "progression not available". |
| **P5** | Domains (118) + deities (717) **after** the missing-spell alias pass. The 250 unresolved spell refs stored as `unresolvedSpellRefs[]`, never fake spell records. | ~835 | Depends on the spell gap; risk of dangling `id`s |
| **P6** | Races/creatures (350) from `CreatureInfo.csv`, reconciled against `srd_monsters.json` (649) and the 36 races | ~350 | Needs dedupe policy between Race and Monster records |
| **Defer** | Soulmelds 102, vestiges 57, grafts 113, marshal auras 28, ACF names 254 (no rules text), magic equipment picklist 135 (MIC already covers it better), `Buffs`/`Enhancements`/`Attacks` (UI-only) | n/a | Need new engine subsystems (Incarnum, Pact Magic), or WB adds no structured value |

### 6.4 Open Decisions for the User

1. Is **summary-level** splatbook content (≈66-character benefit lines) acceptable in the main compendium with a `contentLevel` badge, or should it live only as a searchable index until full text is provided?
2. Who settles the 41 Fighter-flag and 9 save conflicts? A book check is needed; WB is not authoritative.
3. Should P3/P4 chunks be lazy-loaded (recommended: `eagerLoad: false`, loaded by Spotlight on demand) to keep first paint unchanged?

---

## Appendix: Artifacts From This Audit

The audit and import scripts are in `tools/srd_import/` (see its README):
- `xlsm_dump.py`: xlsm → per-sheet JSON (all 65 sheets)
- `analyze.py`: extraction + gap analysis; outputs `gap_report.json` (all counts, samples, mismatch lists) and `source_extracted.json` (all parsed workbook records)
