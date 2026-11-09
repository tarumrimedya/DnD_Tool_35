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
| Factotum | `savingThrows.ref` | low | WB says high | ⏸ | *Dungeonscape* is not in the library | **Low.** User to confirm. |

**Result: The workbook was right in all 6 verifiable save conflicts; JF was wrong.**

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
| Same feat, conflicting prerequisites (to check in the books) | *Somatic Weaponry* (Concentration/Spellcraft 4 vs 5 ranks), *Master Staff* (Spellcraft 15 vs 30), *Oversized Two-Weapon Fighting* (Str 13 vs Dex 13 + BAB +1) |
| `tier` → `levelBand` | The P0/P2 field `tier` collided with the Warlock invocation grade (`tier`), so the feat picker would have shown "heroic Invocation". It is renamed to `levelBand` everywhere, including on Weak Will. |

## E. Open Item for the User

- **Factotum Reflex save:** *Dungeonscape* is not in `FRP\D&D\Kitap`. If you can check the book or add the PDF, I will settle it. Until then I leave it unchanged.
