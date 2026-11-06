# Joyful-Fermi Project Rules (STRICT)

## 1. Agile CEO Governance, Parallel Subagents & 160ms Script Audit
- **Agile CEO Orchestrator (`Gemini 4 Argon` — `.agents/skills/ceo-orchestrator/SKILL.md`):** Argon acts as the **Agile CEO & Lead Architect**, choosing the fastest execution path based on task scope to avoid subagent cold-start latency (~90s/agent):
  1. **Fast-Track Direct Execution (`10–25s` — Questions, Proposals & 1–2 File Surgical Edits):** For conceptual/RAW questions, proposal evaluations, and targeted 1–2 file changes (30–60 line reads), Argon executes directly without spawning subagents.
  2. **Parallel Subagent Swarm (`Multi-Module / Broad Discovery / Bulk Data`):** When a task spans 2+ independent modules or requires broad multi-file scanning, Argon dispatches multiple subagents **in parallel in the same turn**:
     - **Discovery (`research`):** `Model: flash` for broad multi-file scanning.
     - **Engine & 3.5e RAW Math (`worker-engine`):** `Model: pro` (or `inherit`) for `rule_engine.js`.
     - **UI / DOM Modules (`worker-ui`):** `Model: flash` for `index.html` and `char_*.js`.
     - **Database / V2 Schema (`worker-data`):** `Model: flash_lite` (plus local Node.js scripts) for `database/srd_*.json`.
  3. **Zero-Token 160ms Audit (`tools/verify_and_sync.js` + `git diff`):** Never spawn a separate sequential QA subagent just to run checks. The executing agent runs `git diff` and `tools/verify_and_sync.js` (**0 tokens, ~160ms** — auto-syncing `index.html` ➔ `character.html`, `database/*.json` SHA-256 hashes ➔ `srd_index.json`, and core files ➔ `webapp/`) in the same turn before completion.
- **Modular Character Sheet & Context Discipline:**
  - `index.html` (7,698 lines pure HTML/DOM) + 5 domain JS modules (`char_hud.js`, `char_combat.js`, `char_spells.js`, `char_progression.js`, `char_inventory.js`).
  - Read only the target module and exact 30–60 line range needed. Edit only root files; never read `character.html` or `webapp/*` copies directly.
  - `HANDOVER_TO_CHARACTER_SHEET.md` is frozen archive — never read or update it.

## 2. Root-Cause Engineering & Inquiry Guardrail
- **No Band-Aids:** Never use temporary workarounds. Always identify the root cause, anticipate cascading impacts, and implement the permanent architectural fix.
- **No Unsolicited Edits on Questions:** When the user asks a conceptual/design question (*"mantıklı mı?"*, *"nasıl olmalı?"*, *"var mı?"*) or makes a proposal, analyze pros/cons, 3.5e RAW mechanics, and UX directly (using targeted 30–60 line reads or parallel `flash` research only if multi-file lookup is needed); never modify code files until explicitly instructed to implement.

## 3. Canonical V2 Data Architecture & Zero-Dummy-Data Policy
- **No Dummy Data:** Never use placeholder/unverified data. Query local Modular SRD Compendium (`srd_index.json` + `srd_*.json`, 3,522 entries) first; do not scrape `d20srd.org` unless requested.
- **Lego Assembly (`ItemAssembler`):** Composite items (*"+2 Keen Mithral Scimitar"*) are assembled from `baseItemId`, `material`, `enhancementBonus`, and `enhancements` — never duplicated in base catalogs.
- **Splatbook / Homebrew Flow:** Validate against 3.5e RAW & V2 schema ➔ store in user `master_db.json` (never pollute `srd_*.json`) ➔ link to `character_data.json` by immutable `id`.
- **Zero-Patchwork V2 Contract (`schemaVersion: 2`):**
  1. **Universal `modifiers` Array:** Use `modifiers: [{ target, value|formula, type, condition }]` (no flat `strBonus`/`acBonus` columns).
  2. **Structured `damageParts` Array:** Use `damageParts: [{ dice, bonus, type, multiplyOnCrit, onCritOnly, source }]` (no `extraDmg` strings).
  3. **No Heuristic Regex Guessing:** `rule_engine.js` evaluates explicit schema fields (`modifiers`, `damageParts`, `ruleFlags`), never regex-scraping descriptions.
  4. **Immutable `id` References:** Match items/feats/spells by `id`/`baseItemId`, not `name.toLowerCase()`.
  5. **Active Math vs. Passive Badges:** Direct math (`Enhancement`, `Keen`, `Mithral`, `Haste`) runs in `rule_engine.js`; reactive table rules (`Fortification`, `Vorpal`) render as `tacticalBadges`.
  6. **Engine Sync:** Any V2 schema addition must immediately update `rule_master_ai_schema.json`, `normalizeEntry`, and `rule_engine.js`.

## 4. HUB & Character Sheet Isolation
- Before applying any `hub.html` change that could affect `index.html`, `char_*.js`, `rule_engine.js`, `character_data.json`, or `gdrive_sync.js`, **warn the user of cross-impacts and get approval**. `hub.html` `fullData` and `index.html` must strictly share the Canonical V2 data contract.

## 5. Official D&D 3.5e RAW English Standard & Bilingual Reader Shield
- **100% English Output:** All UI labels, modals, toasts, breakdowns, and AI prompts must use official D&D 3.5e RAW English terminology (*Base Attack Bonus*, *Fortitude/Reflex/Will*, *Touch/Flat-Footed AC*, *Armor Check Penalty*, *Arcane Spell Failure*, *Full Attack*, *Two-Weapon Fighting*, *Caster Level*, *Prerequisites Not Met*).
- **Bilingual Reader Predicates:** Preserve bilingual fallbacks in reader/filter conditions (`includes('Off-Hand') || includes('İkinci El')`, `#quest || #gorev`) so legacy saved characters never break.

## 6. Dice Symbol & Icon Rule (STRICT: NO U+1F3B2 EMOJI)
- **NEVER** use the standard 6-sided die emoji (`U+1F3B2` / `\uD83C\uDFB2`) anywhere in code, UI, logs, or docs. Use polyhedral SVG helpers (`getDiceIconSvg`, `getFormulaDiceIconSvg`) or thematic icons (`⚔️`, `🔮`, `✨`, `⚡`, `🩸`, `💚`, `🛡️`).

## 7. Obsidian Knowledge Base (`D:\Obsidian\dndtools35\`)
- **Structure:** `00-Dashboard.md`, `01-Architecture/`, `02-Data-Contracts/`, `03-Decisions/`, `04-DevLogs/`.
- **Token Discipline:** Export to Obsidian (`04-DevLogs/YYYY-MM-DD-[Topic].md` + relevant ADR/Architecture cards with `[[00-Dashboard]]` wikilinks) **only at major phase completions or right before starting a New Chat** when triggered by *"obsidian a aktar"* / *"obsidian devlog"*. In new chats, read `00-Dashboard.md` and the latest DevLog for instant low-token context.
