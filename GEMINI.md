# Joyful-Fermi Project Rules (STRICT)

## 1. Lean Agile CEO Governance, Zero-Bloat Read/Edit Protocol & Smart Model Economy
- **Lean Agile CEO (`.agents/skills/ceo-orchestrator/SKILL.md`):** Operate in a **Single-Cell Lean Agile** model combining **100% first-try engineering precision**, **minimal token burn**, and **ultra-clean chat**:
  1. **3-Step Zero-Bloat Read/Edit Protocol (No Sequential `30–60` Line Hunting Loops):** **NEVER** explore large modules (`rule_engine.js`, `char_*.js`, `index.html`, `hub.html`) via dozens of sequential `read_file` turns (which replays full conversation context `O(N²)` times). Always execute:
     - **Step 1 (`0-Token` Line Indexer):** Run **one** fast `node -e` script to locate exact line numbers of all target functions/symbols at once (strictly excluding `char_modals.js` and `webapp/*`).
     - **Step 2 (Single Parallel `read_file` Batch):** Read all 4–8 target regions in **one parallel turn** using complete function windows (`60–120` lines each) so zero follow-up search turns are needed.
     - **Step 3 (Single Parallel `edit_file` Batch + `0-Token` Verify):** Apply surgical edits in one parallel batch and run deterministic verification immediately.
  2. **Direct Execution & Smart Swarm / Model Tiering:**
     - Do **NOT** spawn multi-agent Waterfall/PDCA cells, `monitor` workers, or external `Claude Opus 5.5` QA loops by default (invoke `Claude` or research subagents only when explicitly asked: *"Claude'a sor"*, *"paralel araştır"*).
     - Spawn a Swarm (`monitor`-free) **only** when 2+ heavy disjoint subsystems genuinely benefit from parallel authoring; **never** spawn a separate worker for small (`<100` line) UI tweaks.
     - Always pin explicit `model` on workers (`gemini-4-hydrogen-high` or `gemini-4-argon-medium` default for defined specs; reserve `gemini-4-argon-high` strictly for unsolved hard core architecture; `gemini-4-hydrogen-medium` / `3.8-flash` for lightweight scans) **and pre-supply exact line numbers in the brief** so workers never burn turns searching.
  3. **Static Pre-Compiled CSS (`tailwind.generated.css` & `design_tokens.css`) & 3-Format Viewport Gate:** Never invent arbitrary Tailwind JIT classes (`w-[184px]`, `max-w-[178px]`); use inline `style="..."`, `design_tokens.css`, or existing compiled classes (`node tools/css_class_gate.js`). Any UI layout change MUST pass `node tools/ui_smoke/run_smoke.js` (`0px` overflow + `.bg-dndCard` boundary check across **Desktop `1440×900`**, **Tablet Portrait `768×1024` & `720×960`**, and **Mobile `375×812`**).
  4. **Zero-Token Deterministic Verification (`tools/verify_and_sync.js` + `git diff`):** Every code change MUST run `node tools/verify_and_sync.js` (**0 tokens**, syncing 30 core files + RAW math + `326+` golden `deriveSheet` assertions + Strangler ratchet gate) + `git diff` before completion.
  5. **Live Agile Kanban Board (`task_board.md` Artifact) & Ultra-Clean Chat:** Put detailed technical notes, telemetry, and file links inside `task_board.md` (`⏳ Görev`, `💡 Fikir`, `✅ Tamamlandı`), keeping chat replies to **1–3 concise sentences**.
- **Modular Workspace & Context Hygiene:**
  - Edit only root module files (`index.html`, `char_hud.js`, `char_combat.js`, `char_spells.js`, `char_progression.js`, `char_inventory.js`, `char_store.js`, `ui_components.js`, `forge_sandbox.js`, `srd_compendium.js`, `rule_engine.js`); never edit `character.html` or `webapp/*` copies directly, never scan `char_modals.js` (350 KB minified bundle), and never read frozen `HANDOVER_TO_CHARACTER_SHEET.md`.

## 2. Root-Cause Engineering, Inquiry Guardrail & Strict UI Preservation
- **No Band-Aids:** Never use temporary workarounds. Always identify the root cause, anticipate cascading impacts, and implement the permanent architectural fix.
- **Strict Visual & Design Preservation (Zero Unrequested UI Changes):** **NEVER** alter existing visual designs, badge/button dimensions, column widths, colors, or layout structures on your own initiative. Only modify the exact UI element explicitly requested by the user, preserving all surrounding component dimensions and styles 100% intact.
- **No Unsolicited Edits on Questions:** When the user asks a conceptual/design question (*"mantıklı mı?"*, *"nasıl olmalı?"*, *"var mı?"*) or makes a proposal, analyze pros/cons, 3.5e RAW mechanics, and UX directly without modifying code files until explicitly instructed to implement.

## 3. Pure Canonical V3 Data Architecture (`schemaVersion: 3`) & Pluggable Ruleset Contract
- **No Dummy Data:** Query the local Modular SRD Compendium (`srd_index.json` + `24` `srd_*.json` packs, `8,007` pure V3 entries including `649` Bestiary) first; do not scrape `d20srd.org` unless requested.
- **Lego Assembly (`ItemAssembler`) & Copy-on-Write (`customEntries`):** Composite items (*"+2 Keen Mithral Scimitar"*) assemble from `baseItemId`, `material`, `enhancementBonus`, and `enhancements`; custom/homebrew or `Rule Crafter` edits live in `master_db.json` or `char.customEntries` without polluting `database/srd_*.json`.
- **Pure Canonical V3 Contract (`schemaVersion: 3`, Zero Disk V2):**
  1. **Atomic `effects[]` Blocks:** Mechanical rules use `effects[]` (`stat`, `roll`, `attack`, `defense`, `effect` Rule Switches, `resource`, `when`, `table`, `carrier`) + `choices[]` (`@Choice`) across `12` blueprints (`spell`, `feat`, `classAbility`, `monster`, etc.). Legacy `modifiers[]` / `damageParts[]` are banned on disk (`migrateEntryToV3` exists solely at the external import boundary).
  2. **Narrative vs. Mechanical Boundary & Zero Shadow Logic:** Narrative/utility entries (*Teleport*, *Wish*) stay clean metadata + text (`effects: []`); mechanically active classes/variants (`replaces[]`), `cab-*` `ClassAbility` entries, feats, domains, items, and buffs own explicit V3 `effects[]`. Never hardcode duplicate per-feat/per-feature `if` math in `rule_engine.js` or regex-scrape descriptions.
  3. **Immutable `id` References:** Match classes, variants, `cab-*` features, feats, items, and spells by immutable `id` / `baseItemId`, not loose display strings.
  4. **Pluggable System Physics (`RuleEngine.rulesets.<id>`):** Keep the V3 block interpreter system-agnostic and isolate D&D 3.5e core laws (stacking matrix, skill rank cap/cost, iterative BAB, size/grapple math, save progressions) inside `RuleEngine.rulesets.dnd35` so future rulesets (`pf1`, `pf2`) plug in cleanly.
  5. **Engine & Corpus Sync:** Any V3 target/block addition must immediately synchronize `rule_engine.js`, `forge_sandbox.js`, `rule_master_ai_schema.json`, and `tools/verify_v3_corpus.js`.

## 4. HUB & Character Sheet Isolation
- Before applying any `hub.html` change that could affect `index.html`, `char_*.js`, `rule_engine.js`, `character_data.json`, `supabase_auth.js`, or `campaign_db.js`, **warn the user of cross-impacts and get approval**. `hub.html` `fullData` and `index.html` must strictly share the Pure Canonical V3 data contract.

## 5. Official D&D 3.5e RAW English Standard & English-Only Readers
- **100% English Output:** All UI labels, modals, toasts, breakdowns, and AI prompts must use official D&D 3.5e RAW English terminology (*Base Attack Bonus*, *Fortitude/Reflex/Will*, *Touch/Flat-Footed AC*, *Armor Check Penalty*, *Arcane Spell Failure*, *Full Attack*, *Two-Weapon Fighting*, *Caster Level*, *Prerequisites Not Met*).
- **English-Only Readers:** The app is English-only. Do not add bilingual (Turkish/English) fallbacks in reader or filter conditions. Old saved characters are not migrated during the test phase; recreate them instead.

## 6. Dice Symbol & Icon Rule (STRICT: NO U+1F3B2 EMOJI)
- **NEVER** use the standard 6-sided die emoji (`U+1F3B2` / `\uD83C\uDFB2`) anywhere in code, UI, logs, or docs. Use polyhedral SVG helpers (`getDiceIconSvg`, `getFormulaDiceIconSvg`) or thematic icons (`⚔️`, `🔮`, `✨`, `⚡`, `🩸`, `💚`, `🛡️`).

## 7. Obsidian Knowledge Base (`D:\Obsidian\dndtools35\`)
- **Structure:** `00-Dashboard.md`, `01-Architecture/UI-UX Design System and Do-Dont Master Guide.md` (mandatory reference for UI/UX & Do/Don't rules), `02-Data-Contracts/`, `03-Decisions/`, `04-DevLogs/`.
- **Token Discipline:** Export to Obsidian (`04-DevLogs/YYYY-MM-DD-[Topic].md` + relevant ADR/Architecture cards with `[[00-Dashboard]]` wikilinks) **only at major phase completions or right before starting a New Chat** when triggered by *"obsidian a aktar"* / *"obsidian devlog"*. In new chats or design/history inquiries, read `00-Dashboard.md`, `01-Architecture/UI-UX Design System and Do-Dont Master Guide.md`, and the latest DevLog for instant low-token context.
