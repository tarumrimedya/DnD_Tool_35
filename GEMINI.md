# Joyful-Fermi Project Rules (STRICT)

## 1. Lean Agile CEO Governance, Token Discipline & Live Kanban Board
- **Lean Agile CEO (`Gemini 4 Argon` — `.agents/skills/ceo-orchestrator/SKILL.md`):** Argon operates in a **Single-Cell Lean Agile** model combining **100% first-try engineering precision**, **minimal token footprint (~85% lower token burn)**, and **ultra-clean chat**:
  1. **Direct Single-Cell Agile Execution (Zero Default Subagent / Waterfall Overhead):** Do **NOT** spawn multi-agent Waterfall/PDCA cells (`audit-analyst`, `worker-impl`, or external `Claude Opus 5.5` QA loops) by default. Argon reads the exact 30–60 line range in the target module, implements the surgical fix/feature directly in a single pass, and verifies deterministically. Only invoke `Claude Opus 5.5` or subagents when explicitly requested by the user (*"Claude'a sor"*, *"paralel araştır"*).
  2. **Context Hygiene (Never Scan Minified Bundles):** Never run broad regex searches across `*.js` that hit `char_modals.js` (350 KB minified bundle). Target only specific module files (`char_progression.js`, `char_combat.js`, `char_spells.js`, `char_inventory.js`, `char_hud.js`, `char_store.js`, `rule_engine.js`, `index.html`) and read exact 30–60 line ranges.
  3. **Static Pre-Compiled CSS Invariant (`tailwind.generated.css` & `design_tokens.css`):** The project uses a pre-compiled static stylesheet (`tailwind.generated.css`) + `design_tokens.css`, NOT runtime Tailwind JIT. Never invent new arbitrary Tailwind classes (`w-[184px]`, `max-w-[178px]`); always use explicit inline `style="..."`, `design_tokens.css` classes, or existing compiled utility classes.
  4. **Zero-Token Deterministic Verification (`tools/verify_and_sync.js` + `git diff`):** Every code change MUST run `node tools/verify_and_sync.js` (**0 tokens, ~700ms**, running RAW math + 186 golden `deriveSheet` assertions + Strangler ratchet gate) + `git diff` in the same turn before completion.
  5. **Live Agile Kanban Board (`task_board.md` Artifact) & Ultra-Clean Chat:** Maintain a live user-facing artifact `task_board.md` categorized by **`⏳ Görev` (Sprint In Progress)**, **`💡 Fikir` (Backlog / Decisions)**, and **`✅ Tamamlandı` (Done)** with detailed technical notes inside the artifact, keeping chat responses to **1–3 concise sentences**.
- **Modular Character Sheet & Context Discipline:**
  - `index.html` (7,698 lines pure HTML/DOM) + 5 domain JS modules (`char_hud.js`, `char_combat.js`, `char_spells.js`, `char_progression.js`, `char_inventory.js`). Never scan `char_modals.js` (minified bundle) with broad regexes.
  - Workers read only the target module and exact 30–60 line range needed. Edit only root files; never read `character.html` or `webapp/*` copies directly.
  - `HANDOVER_TO_CHARACTER_SHEET.md` is frozen archive — never read or update it.

## 2. Root-Cause Engineering, Inquiry Guardrail & Strict UI Preservation
- **No Band-Aids:** Never use temporary workarounds. Always identify the root cause, anticipate cascading impacts, and implement the permanent architectural fix.
- **Strict Visual & Design Preservation (Zero Unrequested UI Changes):** **NEVER** alter existing visual designs, badge/button dimensions, column widths, colors, or layout structures on your own initiative. Only modify the exact UI element explicitly requested by the user, preserving all surrounding component dimensions and styles 100% intact.
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
- **Structure:** `00-Dashboard.md`, `01-Architecture/UI-UX Design System and Do-Dont Master Guide.md` (mandatory reference for UI/UX & Do/Don't rules), `02-Data-Contracts/`, `03-Decisions/`, `04-DevLogs/`.
- **Token Discipline:** Export to Obsidian (`04-DevLogs/YYYY-MM-DD-[Topic].md` + relevant ADR/Architecture cards with `[[00-Dashboard]]` wikilinks) **only at major phase completions or right before starting a New Chat** when triggered by *"obsidian a aktar"* / *"obsidian devlog"*. In new chats or design/history inquiries, read `00-Dashboard.md`, `01-Architecture/UI-UX Design System and Do-Dont Master Guide.md`, and the latest DevLog for instant low-token context.
