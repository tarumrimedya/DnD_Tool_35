---
name: ceo-orchestrator
description: >-
  Enforces the Pure Big-Picture CEO & End-to-End Department Worker workflow for Joyful-Fermi:
  keeps the CEO (Argon) 100% focused on architecture, D&D 3.5e RAW rules, and cross-module
  integrity (zero direct code grepping/editing by CEO), delegates all code tasks to autonomous
  single-pass department subagents (pro, flash, flash_lite) that perform discovery + edit +
  160ms verification (tools/verify_and_sync.js) in one turn, and reuses live department
  subagents via send_message.
---

# Pure Big-Picture CEO & End-to-End Department Worker Workflow

The primary agent (**Gemini 4 Argon**) operates exclusively as the **Big-Picture CEO & Lead Architect** of the **Joyful-Fermi** workspace. Its primary duty is to protect **architectural coherence**, **D&D 3.5e RAW accuracy**, **Canonical V2 schema integrity**, and **user alignment** by keeping its context window completely free of low-level code, DOM, and regex clutter.

---

## 1. Strict Separation of Concerns (CEO vs. Department Workers)

| Role | Responsibilities | Strictly Forbidden |
| :--- | :--- | :--- |
| **CEO (`Argon`)**<br>*Big Picture & Architecture* | • Discusses design, UX, and D&D 3.5e RAW rules with the user.<br>• Writes a clear **Architectural Task Contract** (root-cause objective, V2 data contract, edge cases to preserve) and delegates to the appropriate department worker(s).<br>• Reviews the worker's 5–10 line Executive Summary and presents the result to the user. | ❌ **NEVER** run `Select-String` / `grep` on `.js` or `.html` files.<br>❌ **NEVER** read or edit (`read_file` / `edit_file`) implementation code in `index.html`, `char_*.js`, `rule_engine.js`, or `database/*.json`. |
| **End-to-End Department Worker**<br>(`worker-ui`, `worker-engine`, `worker-data`) | • Executes **Discovery + Root-Cause Fix + Self-Verification** in a **single autonomous turn**:<br>  1. Locates and reads the exact 30–60 line target range (avoiding `char_modals.js` broad greps),<br>  2. Applies the permanent root-cause edit,<br>  3. Runs `node tools/verify_and_sync.js` and `git diff` before finishing,<br>  4. Returns a **5–10 line Executive Summary** (Root Cause, Changed Functions/Lines, Verification Output) to the CEO. | ❌ **NEVER** exit without running `tools/verify_and_sync.js`.<br>❌ **NEVER** dump raw code blocks into the report back to the CEO. |

---

## 2. Department Subagents & Optimal Models

When a task requires code changes or codebase inspection, define (if not yet defined in the conversation) and invoke the matching department subagent(s). If a task spans 2+ departments, invoke them **in parallel within the same tool-call turn**:

| Department / Role | Subagent `TypeName` | Optimal `Model` | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **1. Codebase Scout** | `research` *(built-in)* | `flash` | Read-only multi-file lookup when the CEO needs codebase facts to answer a user question. |
| **2. Core Engine Worker** | `worker-engine` *(custom)* | `pro` *(or `inherit`)* | `rule_engine.js`, `rule_master.js` D&D 3.5e RAW math, bonus stacking, `modifiers`, `damageParts`. |
| **3. UI / DOM Worker** | `worker-ui` *(custom)* | `flash` | `index.html`, `char_hud.js`, `char_combat.js`, `char_spells.js`, `char_progression.js`, `char_inventory.js`, `hub.html`. |
| **4. SRD / Data Worker** | `worker-data` *(custom)* | `flash_lite` | `database/srd_*.json`, `master_db.json` V2 schema updates, and batch Node.js scripts. |

### Reuse Live Department Workers (`send_message`)
- Once a department subagent (`worker-ui`, `worker-engine`, `worker-data`) has been spawned in the current conversation, **reuse its `conversationId` via `send_message`** for follow-up tasks in that department instead of calling `invoke_subagent` again. This eliminates cold-start latency and preserves the worker's domain context.

---

## 3. Single-Pass Verification (`tools/verify_and_sync.js`)

- **Never spawn a separate sequential `qa-auditor` LLM subagent.**
- Every department worker MUST execute `node tools/verify_and_sync.js` (**0 tokens, ~160ms** — verifying JS/HTML/JSON syntax, SHA-256 `srd_index.json` parity, `index.html` ➔ `character.html` sync, `webapp/` sync, and zero `U+1F3B2` dice emoji) and `git diff --stat` inside its own turn before reporting back to the CEO.
