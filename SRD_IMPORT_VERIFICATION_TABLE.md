# Builder Workbook ↔ Joyful-Fermi: Book-Verified Conflict Table

**Date:** 2026-11-09 · **Companion to:** `SRD_IMPORT_GAP_AUDIT_REPORT.md` §3.1–3.2

**Terminology:** "the workbook" / **WB** = the source character-builder spreadsheet (`.xlsm`, v7.4.0.1) and its companion CSVs; **JF** = this project's `database/*.json`.

**Source:** user's rulebook PDFs (`G:\Drive'ım\FRP\D&D\Kitap\`), read directly. Text-layer PDFs were searched with PyMuPDF. Scanned PDFs (CW, CAd, CAr, DMG, ELH) were rendered to images and read visually. Page numbers are **printed book pages**. Nothing in `database/` has been changed yet; this table is the input for Phase P1.

**Confidence:** **High** = read directly in the book. **Low** = book not available, decision is from recall only.

---

## A. Class Base Saves (Phase P1: Edit `database/srd_classes_races.json`)

| Class | Field | JF now | Book | Fix JF? | Source | Conf. |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| Knight | `savingThrows.fort` | high | **low** (+0 at 1st; good Will only) | ✅ | PHB2 Table 1–4: The Knight | High |
| Spellthief | `savingThrows.ref` | high | **low** (+0 at 1st; good Will only) | ✅ | CAd p.18, Table 1–3 | High |
| Dervish | `savingThrows.fort` | high | **low** | ✅ | CW p.26, Table 2–7 | High |
| Dervish | `savingThrows.will` | low | **high** (Ref and Will good) | ✅ | CW p.26, Table 2–7 | High |
| Ur-Priest | `savingThrows.fort` | high | **low** (good Will only) | ✅ | CD p.70, Table 2–23 | High |
| Jade Phoenix Mage | `savingThrows.will` | high | **low** (good Fort only) | ✅ | ToB Table 5–5 | High |
| Warmage | n/a | n/a | **No conflict.** WB "War Mage" is a different class: an *Age of Mortals* (Dragonlance) prestige class. | ❌ | Name-match false positive | High |
| Factotum | `savingThrows.ref` | low | **high** (good Ref only; Fort and Will poor) | ✅ | Dungeonscape class table via srd.dndtools.org `baseDungeon/factotum` (user-supplied, 2026-11-10) | High |

**Result: The workbook was right in all 7 save conflicts; JF was wrong.**

---

## B. Fighter Bonus Feat Flags (Phase P1: Edit `database/srd_feats.json`)

### B1. JF Wrongly Marks as Fighter Bonus Feat → Set `false`

| Feat | Evidence | Conf. |
| :--- | :--- | :---: |
| Tower Shield Proficiency | PHB p.101: fighters get it *automatically*; no fighter marker in Table 5–1 | High |
| Monkey Grip | CW p.103: no "A fighter may select…" Special line | High |
| Evasive Reflexes | ToB p.30 Table 2–1: only Blade Meditation, Martial Stance, Martial Study carry the fighter footnote | High |
| Snap Kick | same | High |
| Stone Power | same | High |

### B2. JF Wrongly Misses a Heroic Fighter Bonus Feat → Set `true`

| Feat | Evidence | Conf. |
| :--- | :--- | :---: |
| Sharp-Shooting | CW p.105: "A fighter may select Sharp-Shooting as one of his fighter bonus feats." | High |

### B3. Epic Fighter Bonus Feat List → New Tier Field, Not the Heroic Boolean

ELH p.11–12 (Epic Fighter Bonus Feat List), confirmed by DMG p.208 ("selected from the list of epic fighter feats"). All **31** WB-flagged epic feats are on the list:

Armor Skin, Combat Archery, Damage Reduction, Devastating Critical, Dire Charge, Distant Shot, Epic Endurance, Epic Leadership, Epic Prowess, Epic Toughness, Epic Weapon Focus, Epic Weapon Specialization, Exceptional Deflection, Improved Combat Reflexes, Improved Manyshot, Improved Stunning Fist, Improved Whirlwind Attack, Infinite Deflection, Instant Reload, Legendary Commander, Legendary Rider, Legendary Wrestler, Overwhelming Critical, Penetrate Damage Reduction, Perfect Two-Weapon Fighting, Reflect Arrows, Spellcasting Harrier, Storm of Throws, Superior Initiative, Swarm of Arrows, Two-Weapon Rend (epic).

ELH also says any feat designated a fighter bonus feat counts as being on the epic list.

**Proposal:** keep `isFighterBonusFeat` meaning *heroic list* (backward compatible with saved characters). Add `fighterBonusFeatTier: "epic"` to these 31 records. The progression UI then offers them only for fighter level 21 and up.

### B4. Name Collision: Two Different "Two-Weapon Rend" Feats

| Record | Prereqs | Fighter | Status |
| :--- | :--- | :--- | :--- |
| `feat-two-weapon-rend` (JF) | Dex 15, BAB +9, Improved Two-Weapon Fighting, Two-Weapon Fighting | **Epic list** (B3) | Correct record; add page `ELH` |
| PHB2 *Two-Weapon Rend* | Dex 15, Two-Weapon Fighting, BAB +11 | **Heroic fighter bonus feat** (PHB2 p.84) | **Missing in JF.** Add as a separate record with `id: feat-two-weapon-rend-phb2` and alias `"Two-Weapon Rend (PHB2)"`. |

The name-based matcher must not merge these two. P3 needs a source-aware ID rule for same-name feats; this case is one of the 60 WB duplicate names.

### B5. No Action Needed

| Item | Finding |
| :--- | :--- |
| Improved Grapple | JF `true` is correct (PHB p.95: "A fighter may select Improved Grapple…"). The mismatch came from an WB artifact row `--Improved Grapple--` (OA 63), not from JF. |

---

## C. Maneuvers

| Item | Finding | Action |
| :--- | :--- | :--- |
| Absolute Steel | ToB p.66 entry header is **ABSOLUTE STEEL** (Iron Heart, Stance, Warblade 3). The chapter summary calls it "Absolute Steel Stance". | **JF name is correct.** Add alias `"Absolute Steel Stance"` only. |
| Boulder Roll | ToB p.81: Stone Dragon (Boost), Crusader/Swordsage/Warblade 4, 1 full-round action, personal | **Missing.** Add in P2. |

---

## D. Corrections to `SRD_IMPORT_GAP_AUDIT_REPORT.md`

1. §3.4: "Fix *Absolute Steel* → Absolute Steel Stance" is **wrong**. Keep the name and add an alias.
2. §3.1: `--Improved Grapple--` is an **WB artifact**, not a JF record. Exclude it in the extractor.
3. §3.2: the War Mage ↔ Warmage row is a false match, not a data conflict.

---

## F. P1 Enrichment (Pages and Requirements)

| Item | Result | Source |
| :--- | :--- | :--- |
| Class source pages | **60/60** classes now carry a book page (was 15/75 with a page) | Book contents pages: PHB p.3, DMG p.4, XPH p.3, ToB, PHB2, Complete Mage, CW p.4, CAr p.4 |
| SRD-renamed psionic PrCs | Psionic Fist = *Fist of Zuoken* (XPH p.144); Slayer = *Illithid Slayer* (XPH p.146) | XPH contents |
| PrC requirements | Frenzied Berserker, Invisible Blade, Ur-Priest now have structured requirements (alignment / BAB / feats / skills / special) | CW p.34, CW p.45, CD p.70 |
| Feat source pages | **20** of 290 page-less feats filled. A page is applied only when the builder workbook and the 3.5 feat index agree on book + page. A record labelled SRD and matched to a non-SRD book also needs matching prerequisites. | `tools/srd_import/p1_feat_pages.py` |
| Not applied (13) | Same-name feats with different prerequisites, e.g. epic/psionic SRD *Two-Weapon Rend*, *Mind Over Body*, *Dragon Wild Shape*, *Fleet of Foot*, *Disguise Spell*, vs their splatbook namesakes. They stay "SRD 3.5e". | — |
| No second source (257) | Mostly XPH / ELH / DMG epic feats. Those books are scanned, and the feat index does not cover them; left unchanged. | — |
| `prereqStruct` for 54 feats | Skipped. Feat prerequisites are evaluated from the text (`char_progression.js`); `prereqStruct` only drives the "ability to cast spells" / psionic defaults, so adding it changes nothing. | — |

## G. P3 Splatbook Feats

| Item | Result |
| :--- | :--- |
| 3.5 WotC heroic feats | **1,642** in `srd_feats_splat.json` (lazy; loaded when a feat list first opens) |
| 3.5 epic feats | **23** in `srd_feats_epic.json` (lazy; loaded from character level 21) |
| 3.0 + licensed non-WotC 3.5 feats | **357** (223 + 134) in `srd_feats_legacy.json`. The chunk is opt-in: loaded only while the "📜 3.0 & Licensed" filter is on, and never by `preloadAll`. |
| Excluded | 70 Dragon Magazine feats (not verifiable from the library); 125 placeholder/header/"x2" rows |
| Verification | 672 feats are **cross-checked**: the workbook and the 3.5 feat index agree on book + page. The rest are **unverified** (single source). All are `contentLevel: "summary"`; the benefit text is the workbook's one-line summary. |
| Same-name different feats (10) | Listed under a book-qualified alias, e.g. *Two-Weapon Rend (Player's Handbook II)* next to the epic *Two-Weapon Rend* |
| Same feat, conflicting prerequisites (checked in the books) | *Somatic Weaponry*: CM p.47 says Concentration 5 ranks, Spellcraft 5 ranks. JF had 4; **fixed**. *Oversized Two-Weapon Fighting*: CAd p.111 says Str 13, Two-Weapon Fighting. JF had Dex 13 + BAB +1; **fixed**. *Master Staff*: ELH p.62 (the SRD source) says Spellcraft 15 ranks; the CAr p.192 reprint says 30. JF follows the SRD, so it is **unchanged**. |
| Epic fighter bonus feat list (B3) | The 31 ELH p.11–12 feats now carry `fighterBonusFeatTier: "epic"` in `srd_feats.json` (the heroic `isFighterBonusFeat` flag stays false). The Class Bonus Feat pickers offer them only for a slot at character level 21 or higher. |
| Traits and skill tricks on the character | The quick feat picker has **Character Trait** and **Skill Trick** categories. Picks are stored as `🧬 [Trait] Name` / `💪 [Skill Trick] Name` and never use a feat slot. **Traits** (UA p.86): at most two; a trait added after 1st level asks for DM approval; the benefit and drawback modifiers apply. **Skill tricks** (CSc p.83): one per level; the total cannot exceed half the character level, rounded up; prerequisites are checked; each costs 2 skill points in both budgets. Picked records are snapshotted into customDb by type. |
| `tier` → `levelBand` | The P0/P2 field `tier` collided with the Warlock invocation grade (`tier`), so the feat picker would have shown "heroic Invocation". It is renamed to `levelBand` everywhere, including on Weak Will. |

## H. P4 Base and Prestige Class Chassis

| Item | Result |
| :--- | :--- |
| 3.5 WotC classes | **400** in `srd_classes_splat.json` (lazy; loaded the first time a class picker is used: Level Up or Change Class). Nothing loads at page open. |
| 3.0 + licensed non-WotC 3.5 classes | **75** in `srd_classes_legacy.json`. The chunk is opt-in: loaded and listed only while the "📜 3.0 & Licensed" setting is on (the feat filter setting is reused). A class the character already has stays listed. |
| Content | Chassis only (`contentLevel: "stub"`): Hit Die, BAB, good/poor saves, skill points, class skills, max level, structured requirements. `features` is empty. |
| Verification | 272 prestige classes are **verified** from the class table in the book (page, HD, skill points, BAB, saves and max level read from the table; citation in `provenance.book`): 243 that the index did not list, 24 workbook / index conflicts, and the 5 settled earlier (Evangelist CD Table 2-10, Rainbow Servant CD p.54, Void Disciple CD p.72, Moonspeaker RoE Table 7-3, Reforged RoE Table 7-7). 160 prestige classes are **cross-checked** (workbook and the crystalkeep 3.5 class index agree; the index gives max level and page). Of the 43 base classes, *Samurai* (CW p.8) is cross-checked; 42 are **unverified** (single source; max level 20, racial paragons 3). |
| Book check results | Of the 24 conflicts the workbook was right in 23; *Maiden of Pain* (PGtF Table A-6) has Reflex, not Will, as its good save (workbook wrong, index right). Of the 243 classes read from the book, the workbook was wrong in 3: *Ectopic Adept* (BAB low, not medium), *Hoardstealer* (only Reflex good), *Divine Agent* (medium BAB, only Will good). The book values are used. |
| Not imported | 146 prestige classes whose book is not in the Kitap folder (Faiths and Pantheons, Dragonlance Campaign Setting, Heroes of Light, Champions of Darkness, Age of Mortals, Van Richten's Arsenal, Miniatures Handbook, Underdark and 15 more) or that no book lists (*Soul Manifester*), plus *Elven High Mage* (table has no BAB / save columns), and 5 open conflicts (*Marshal*, *Alchemist Savant*, *Cave Lord*, *Shadowcrafter*, *Yathchol Webrider*; their books are missing). **Decision (2026-11-10): these stay out.** Without the book there is no second source and no max level, so they are not added as unverified records. |
| Same-name classes (2) | The 3.5 WotC class keeps the plain name; the other is renamed with its book: *Samurai (Oriental Adventures)*, *Exemplar (Player's Companion)*. Characters store classes by name, so names must be unique. |
| Requirement parsing fix | "Must be female" (Yathrinshee PGtF p.187 and two others) was parsed as a race requirement; it is now a special requirement. |
| Snapshots | A class from a lazy chunk on the character (`levelProgression[].className`, or `doc.classes`) is copied into customDb as an `srd-snapshot`. `RuleEngine.getClassDef` and `getAvailableClassDefs` resolve it from there without the chunk, typed as an official prestige/base class. |
| Skill requirement fix | Class skill requirements read 0 ranks for everyone (`character.skills` is an array, it was indexed by key). Ranks are now looked up by `key`; the older `knowledge_<field>` keys map to `k_<field>`, and a Perform / Profession requirement accepts any subtype. |
| Lower-case duplicate fix | A class resolved by `getClassDef` before the picker hydrated (e.g. from a snapshot) showed up twice in the pickers ("Alienist" and "alienist"). The lower-case lookup aliases are no longer listed. |

## I. Psionic Powers Chunk

| Item | Result |
| :--- | :--- |
| Split | The 440 XPH SRD powers moved from the eager `srd_spells.json` (now 699 spells) into the lazy `srd_powers.json` (about 0.7 MB less loaded at page open). No record changed. |
| Loading | Spotlight finds powers through the index and loads the chunk when one is picked (`fetchEntry`). The autocomplete pick called `getSpellById` / `getMonsterById`, which do not exist; it now uses `fetchEntry` for every lazy record. |
| Snapshots | Powers named in the character's spell lists or buffs are snapshotted into customDb, so an active psionic buff (e.g. *Force Screen*) keeps its modifiers without the chunk. |

## E. Open Item for the User

- **Factotum Reflex save:** settled (2026-11-10). The class table on srd.dndtools.org (`baseDungeon/factotum`, supplied by the user) gives good Reflex only (+2 at 1st, +12 at 20th), poor Fort and Will; `srd_classes_races.json` now has `ref: good` / `savingThrows.ref: high`.
- **Factotum Hit Die:** settled (2026-11-10). The same page says **d6**; the record had d8. The user confirmed d6, so `srd_classes_races.json` now has `hd: 6` / `hitDie: "d6"`.
