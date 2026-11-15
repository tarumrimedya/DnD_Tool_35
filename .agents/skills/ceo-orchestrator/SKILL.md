---
name: ceo-orchestrator
description: >-
  Enforces the Lean Agile CEO Governance & Live Kanban Board workflow for Joyful-Fermi:
  3-step zero-bloat read/edit protocol (1x 0-token node -e line indexer -> 1x parallel 60-120
  line read_file batch -> 1x parallel edit_file batch, never scanning char_modals.js), smart
  model tiering (Hydrogen High / Argon Medium default, zero monitor), Pure Canonical V3 +
  RuleEngine.rulesets.dnd35 discipline, static CSS + 3-format viewport gates, 0-token
  deterministic verification (tools/verify_and_sync.js), and ultra-clean 1-3 sentence chat
  responses backed by a live task_board.md Kanban artifact.
---

# Lean Agile CEO Governance & Zero-Bloat Execution Workflow

The primary agent operates as the **Lean Agile CEO & Lead Architect** of **Joyful-Fermi**, optimizing for **first-try accuracy**, **minimal token footprint (zero `O(N²)` read loops)**, **Pure Canonical V3 integrity**, and **ultra-clean chat communication**.

---

## 1. 3-Step Zero-Bloat Read/Edit Protocol (Eliminating `O(N²)` Token Burn)

Never hunt through large modules (`rule_engine.js`, `char_*.js`, `index.html`, `hub.html`) via dozens of sequential `30–60` line exploratory `read_file` turns. Every sequential turn replays the entire conversation context (`O(N²)` input token multiplier). Instead:

1. **Step 1 — Single `0-Token` `node -e` Line Indexer:**
   - Run **one** fast `node -e` script to print exact line numbers of all target functions, anchors, or symbols across the relevant root modules (**strictly excluding** `char_modals.js` and `webapp/*`).
2. **Step 2 — Single Parallel `read_file` Batch (`60–120` Line Complete Function Slices):**
   - Read all 4–8 indexed regions in **one parallel tool-call turn** using complete function windows (`60–120` lines each) so zero follow-up search turns are required.
3. **Step 3 — Single Parallel `edit_file` Batch + `0-Token` Deterministic Gates:**
   - Apply all surgical edits in one parallel batch and immediately verify via `node tools/verify_and_sync.js` + `git diff`.

---

## 2. Single-Cell Execution & Smart Swarm / Model Economy

1. **Direct Single-Cell Execution by Default:**
   - Do **NOT** spawn Waterfall/PDCA subagents, `monitor` workers, or LLM QA loops for standard tasks, bugfixes, or small (`<100` line) UI updates.
   - Invoke `Claude Opus 5.5` (`claude-bridge`) or research subagents **only** when explicitly requested (*"Claude'a sor"*, *"paralel araştır"*).
2. **Disciplined Swarm Spawning (Only for Heavy Disjoint Parallel Work):**
   - Spawn a `monitor`-free Swarm **only** when 2+ heavy, zero-overlap subsystems genuinely run faster in parallel.
   - **Always pin explicit `model`** so workers never inherit an expensive orchestrator tier by accident:
     - **Default Implementation Worker:** `gemini-4-hydrogen-high` or `gemini-4-argon-medium`.
     - **Lightweight Scan / Audit Helper:** `gemini-4-hydrogen-medium` or `3.8-flash`.
     - **Novel Hard Core Architecture Only:** `gemini-4-argon-high`.
   - **Pre-supply exact line numbers** in every worker `brief` (obtained via Step 1's `node -e` indexer) and `kill` workers immediately once their slice is verified.

---

## 3. Architectural, CSS & Deterministic Verification Gates

1. **Pure Canonical V3 (`schemaVersion: 3`) & `RuleEngine.rulesets.dnd35`:**
   - All `8,007` compendium entries use pure V3 `effects[]` (`stat`, `roll`, `attack`, `defense`, `effect`, `resource`, `when`, `table`, `carrier`) + `choices[]` (`@Choice`). Keep narrative spells/features metadata-only (`effects: []`), keep mechanical entries in V3 blocks (zero duplicate shadow `if` math in `rule_engine.js`), and isolate system-level physics in `RuleEngine.rulesets.dnd35` (`node tools/verify_v3_corpus.js`).
2. **Unidirectional Store & Delegated Event Architecture (`R0`–`R7` Invariant):**
   - State mutations flow through `CharStore.dispatch`, derived state through `RuleEngine.deriveSheet`, and UI events through `Actions.register('domain:action', ...)` (`0` inline event handlers in `char_*.js`).
3. **Static CSS & Mandatory 3-Format Viewport Gate:**
   - Never use uncompiled arbitrary Tailwind JIT classes (`w-[184px]`); verify via `node tools/css_class_gate.js`.
   - Every UI layout/component change must pass `node tools/ui_smoke/run_smoke.js` (`0px` page overflow + `.bg-dndCard` inner boundary check across **Desktop `1440×900`**, **Tablet Portrait `768×1024` & `720×960`**, and **Mobile `375×812`**).
4. **Mandatory Pre-Completion Check:**
   - Run `node tools/verify_and_sync.js` (**0 tokens**, syncing 30 core files, RAW math, `326+` golden `deriveSheet` assertions, `0` `U+1F3B2`, Strangler ratchet gate) + `git diff`.

---

## 4. Live Agile Kanban Board (`task_board.md`) & Ultra-Clean Chat

- Maintain `task_board.md` in the conversation artifact directory with three columns: **`⏳ Görev`**, **`💡 Fikir`**, and **`✅ Tamamlandı`**.
- Record detailed technical breakdowns, telemetry, and clickable `file://` links inside `task_board.md`, keeping chat responses to **1–3 concise sentences**.
