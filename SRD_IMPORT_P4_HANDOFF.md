# SRD Import P4 — Handoff (base & prestige class chassis)

Branch: `feat/srd-import-p4-classes` (last commit `fd77b56`). P0–P3 are done and committed on the branch chain
(`feat/srd-import-p3-splat-feats` → this branch). Nothing is pushed; never push or touch `main` without the user's explicit OK.

Read first: `CLAUDE.md` / `GEMINI.md` (rules), `SRD_IMPORT_VERIFICATION_TABLE.md` (sections A–G), `tools/srd_import/README.md`.

## Where P4 stands

Data builder (committed, not yet applied to `database/`):
- `tools/srd_import/p4_classidx.py` — parses the crystalkeep Prestige/Base class index PDFs (word positions) → `clsidx.json`.
- `tools/srd_import/p4_classes.py` — builds chassis records from the workbook extract. Current output: **208 classes**
  (190 → `p4_splat.json` 3.5 WotC, 13 → `p4_legacy.json` 3.0 + licensed; numbers may shift by a few after reruns):
  160 prestige cross-checked with the index, 5 prestige verified from the book (`BOOK_SETTLED`), 42–43 base classes unverified
  (maxLevel 20, racial paragons 3). Records follow the JF class shape (`hd`, `hitDie`, `bab` 1/0.75/0.5, `babProgression`,
  `fort/ref/will` good/poor + `savingThrows`, `skills`, `skillPointsPerLevel`, `classSkills` with canonical skill keys such as `k_arcana`,
  `maxLevel`, structured `prerequisites`, `features: {}`, `contentLevel: "stub"`, `verification`, `edition`, `provenance`).
- Inputs (outside the repo, persistent): `C:\Users\tarum\Documents\antigravity\srd_import_inputs\` (`hf_extracted.json`, `clsidx.json`,
  `p4_conflicts.json`, `p4_report.json`).
- Rerun:
  `py -I tools/srd_import/p4_classes.py <inputs>\hf_extracted.json <inputs>\clsidx.json database <out dir>`

Excluded on purpose: 389 prestige classes the index does not list (no second source, unknown max level) and 29 open conflicts.
**A separate session is book-verifying them** per `SRD_IMPORT_P4_PRC_AGENT_BRIEF.md`; its result will be
`tools/srd_import/p4_book_verified.json` on branch `feat/srd-import-p4-prc-verify`. Do not wait for it; merging it is a later step
(spot-check ~10% against the books before using it).

## Remaining work (in order)

1. **Assemble chunks** — new `tools/srd_import/p4_assemble.py` (pattern: `p3_assemble.py`): write `database/srd_classes_splat.json`
   and `database/srd_classes_legacy.json` (index meta `optIn: true`), register both in `srd_index.json` (`eagerLoad: false`),
   assert no id collisions with existing records. `verify_and_sync.js` fills index rows / counts / hashes and syncs `webapp/`.
2. **Load on demand** — class lists come from `getAvailableClassDefs()` (`char_spells.js` ~8471; uses `SrdCompendium.getAllClasses()`;
   its cache key already includes the loaded class count). Load the class chunk(s) only when a class picker is used:
   `populateLevelUpClassSelect` (`char_spells.js` ~8702), `populateChangeClassSelect` (`char_progression.js` ~7077),
   `filterLevelUpClassSearch` (~5632), `filterChangeClassSearch` (~7268). After the chunk arrives, redraw the open list
   (same idea as `ensureFeatSplatChunks` + `_featListRefresher` in `char_progression.js`). Legacy chunk only when
   `character.settings.includeLegacyFeats` is on (reuse the existing "3.0 & Licensed" setting). Do NOT load anything at page open.
3. **Snapshots** — a character whose `levelProgression[].className` is a lazy class must resolve without the chunk:
   extend `char_store.js` (`FEAT_REF_TYPES` / `collectFeatRefNames` / `reconcileSrdSnapshots` / `recompute`) with class refs
   (type `'Class'`, names from `levelProgression[].className` and `doc.classes`). `getAvailableClassDefs` already reads
   `masterDb` (= `customDb`) entries with `type: 'Class'`; check that snapshot fields map correctly there (bab numeric,
   fort/ref/will good/poor, maxLevel, `isPrestige`; note it sets `type` from `c.type`, so prestige snapshots may need
   `isPrestige` honoured) and in `RuleEngine.getClassDef` (`rule_engine.js` ~7037).
4. **Fix the class prerequisite skill bug** — `char_progression.js` ~5375: `character.skills[req.skill]` indexes an array, so every
   skill prerequisite reads 0 ranks. Look the skill up by `key` in the array, and accept the older `knowledge_arcana` style keys
   used by P1 records (map to `k_arcana` etc.). Also handle `key: 'race'` with `val` (already supported) — new records use it.
5. **Tests** — add "SRD Import P4" checks in `tools/test_derive_sheet.js` (chunk registration + optIn, sample chassis values incl.
   the 5 book-settled classes, no page-open load, snapshot of a lazy class, skill-prerequisite fix).
6. **Verify** — `docker run --rm -v "C:\Users\tarum\Documents\antigravity\joyful-fermi:/app" -w /app node:lts-slim node tools/verify_and_sync.js`
   (run from PowerShell; never pipe it through `Select-Object -First`, it can kill the copy step). Must pass; ratchet caps:
   inline events 548, `window.*` globals 342 (char_progression windowAssigns cap 46 — use module-local state, not `window.*`).
   Delegated action handlers must declare `(el, data, event)`.
7. **Browser e2e** — `py -I -m http.server 8765 --bind 127.0.0.1` in the repo, open `http://127.0.0.1:8765/index.html`
   (local mode is already enabled on that origin). Scripts load with `?v=...`; bypass cache with
   `for (const u of [...document.scripts].map(s=>s.src).filter(Boolean)) await fetch(u,{cache:'reload'}); location.reload()`.
   Back up `character` first and restore it afterwards; stop the server when done.
8. **Docs & commit** — add a P4 section to `SRD_IMPORT_VERIFICATION_TABLE.md`, a P4 row to `tools/srd_import/README.md`; commit only
   when the user asks (message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).

## Gotchas learned so far

- The Bash tool turns `\\` into `\` inside heredocs: edit files with the Edit tool (or a script file), not inline Python with escapes.
- Python on this machine: `py -I -X utf8`; set `PYTHONIOENCODING=utf-8` when printing non-ASCII.
- `char_modals.js` is a minified bundle: never broad-regex it; make exact single-string replacements via a script file.
- Static CSS only (`tailwind_compiled.css`): use classes that already exist there, or inline styles.
- No U+1F3B2 die emoji anywhere. UI text in D&D 3.5e RAW English; reply to the user in Turkish.
