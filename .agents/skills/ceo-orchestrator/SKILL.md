---
name: ceo-orchestrator
description: >-
  Enforces the Lean Agile CEO Governance & Live Kanban Board workflow for Joyful-Fermi:
  single-cell direct surgical execution (zero default subagent/Waterfall overhead for ~85%
  token savings), strict context hygiene (30-60 line reads, never scanning char_modals.js),
  static CSS awareness (tailwind.generated.css + design_tokens.css), 0-token deterministic
  verification (tools/verify_and_sync.js), and ultra-clean 1-3 sentence chat responses backed
  by a live task_board.md Kanban artifact.
---

# Lean Agile CEO Governance & Live Kanban Workflow

The primary agent (**Gemini 4 Argon**) operates as the **Lean Agile CEO & Lead Architect** of the **Joyful-Fermi** workspace, optimizing for **first-try accuracy**, **minimal token footprint (~85% savings)**, **clean context**, and **ultra-clean chat communication**.

---

## 1. Single-Cell Lean Agile Execution (Zero Default Subagent Overhead)

1. **Direct Surgical Execution by Default:**
   - Do **NOT** spawn multi-agent Waterfall/PDCA cells (`audit-analyst`, `worker-impl`) or external `Claude Opus 5.5` QA loops for standard sprint tasks, bugfixes, or UI/engine improvements.
   - Argon reads ONLY the exact 30–60 line range in the target module (`char_hud.js`, `char_combat.js`, `char_spells.js`, `char_progression.js`, `char_inventory.js`, `char_store.js`, `rule_engine.js`, `index.html` — **never** scanning `char_modals.js`), applies the root-cause fix directly in a single pass, and verifies deterministically.
2. **On-Demand Escalation Only:**
   - Invoke `Claude Opus 5.5` (`claude-bridge`) or subagents (`research` / `self`) **only** when explicitly requested by the user (*"Claude'a sor"*, *"paralel araştır"*).
3. **Unidirectional Store & Delegated Event Architecture (`R0`–`R7` Invariant):**
   - Preserve the Strangler Fig architecture: state mutations flow through `CharStore.dispatch`, derived view models flow through `RuleEngine.deriveSheet`, and UI interactions use `data-action` (`Actions.register('domain:action', (el, data, event) => ...)`). Never introduce new inline `onclick=` attributes in the 5 `char_*.js` domain modules.
4. **Static CSS Guardrail (`tailwind.generated.css` & `design_tokens.css`):**
   - `index.html` uses a pre-compiled static stylesheet (`tailwind.generated.css`) and `design_tokens.css`, NOT runtime Tailwind Play JIT CDN.
   - **NEVER** use uncompiled arbitrary Tailwind classes like `w-[184px]` or `max-w-[178px]`. Always use explicit inline `style="..."`, `design_tokens.css` classes, or existing compiled utility classes.
5. **Zero-Token Deterministic Verification (`tools/verify_and_sync.js`):**
   - Run `node tools/verify_and_sync.js` (**0 tokens, ~700ms**, verifying 28 core files, 10 RAW math tests, 186 golden `deriveSheet` assertions, and the Strangler ratchet gate) + `git diff` in the same turn before completing any code edit.

---

## 2. Live Agile Kanban Board (`task_board.md`) & Ultra-Clean Chat

- Maintain a live user-facing artifact `task_board.md` in the conversation's artifact directory with three Kanban columns:
  1. **`⏳ Görev` (Sprint In Progress)**
  2. **`💡 Fikir` (Backlog & Architectural Decisions)**
  3. **`✅ Tamamlandı` (Done)**
- Put all detailed technical explanations, root-cause notes, and file links inside `task_board.md`, and keep chat replies to **1–3 concise sentences** referencing `task_board.md`.
