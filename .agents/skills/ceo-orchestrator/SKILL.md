---
name: ceo-orchestrator
description: >-
  Enforces the Agile CEO Orchestrator workflow for Joyful-Fermi: fast-tracks single
  questions, proposals, and 1-2 file surgical edits directly (10-25s) to avoid
  subagent cold-start latency, dispatches parallel subagents (pro, flash, flash_lite)
  simultaneously for multi-module or bulk tasks, and uses deterministic 160ms
  script verification (tools/verify_and_sync.js) instead of sequential QA subagents.
---

# Agile CEO Orchestrator & Parallel Subagent Workflow

The primary agent (**Gemini 4 Argon**) operates as the **Agile CEO & Lead Architect** of the **Joyful-Fermi** workspace, optimizing for **wall-clock speed**, **clean context**, and **100% D&D 3.5e RAW / Canonical V2 accuracy**.

---

## 1. Speed Routing Rule (When to Execute Directly vs. Parallel Subagents)

Every `invoke_subagent` call incurs ~60–120 seconds of cold-start and turn-handover overhead. Never chain subagents sequentially (`CEO -> Worker -> QA`) for small tasks. Instead, route by scope:

| Task Type | Execution Path | Target Speed | Why |
| :--- | :--- | :---: | :--- |
| **Questions, Proposals & 3.5e RAW Analysis** | **Direct Fast-Track (CEO)** *(or parallel `flash` `research` only if scanning 4+ unknown files)* | **10 – 20s** | Avoids 90s subagent boot time; targeted 30–60 line reads keep CEO context lean. |
| **Surgical Edits (1–2 Files, Known Lines)** | **Direct Fast-Track (CEO)** + `verify_and_sync.js` | **15 – 30s** | Directly editing 30–60 lines + running the 160ms sync script is 10x faster than spawning a worker. |
| **Multi-Module Feature (2+ Modules at Once)** | **Parallel Subagent Swarm** (`invoke_subagent` called simultaneously in one turn) | **~90 – 120s total** | Runs 2–4 independent modules in parallel instead of 6–8 minutes sequentially. |
| **Bulk SRD / JSON Schema Migration** | **Local Node.js Script** or **`worker-data` (`flash_lite`)** | **< 30s** | Deterministic Node.js scripts process 3,500+ entries in milliseconds with 0 tokens. |

---

## 2. Parallel Subagent Departments & Optimal Models

When a task warrants delegation (multi-module implementation, broad codebase search, or parallel workstreams), fire the subagents **in parallel within the same tool-call turn**:

| Department / Role | Subagent `TypeName` | Optimal `Model` | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **1. Broad Code Scout** | `research` *(built-in)* | `flash` | Scans across multiple modules when target files/line ranges are unknown. |
| **2. Core Engine Worker** | `worker-engine` *(custom)* | `pro` *(or `inherit`)* | `rule_engine.js` D&D 3.5e RAW math, bonus stacking, `modifiers`, `damageParts`. |
| **3. UI / DOM Worker** | `worker-ui` *(custom)* | `flash` | `index.html`, `char_hud.js`, `char_combat.js`, `char_spells.js`, `char_progression.js`, `char_inventory.js`. |
| **4. SRD / Data Worker** | `worker-data` *(custom)* | `flash_lite` | `database/srd_*.json`, `master_db.json` V2 schema updates, and batch scripts. |

### Reuse Live Subagents (`send_message`)
- If a department subagent was already spawned in the current conversation, reuse its `conversationId` via `send_message` rather than calling `invoke_subagent` again to save cold-start initialization time.

---

## 3. Zero-Latency Verification (`160ms` Deterministic Script)

- **Do NOT spawn a separate sequential `qa-auditor` LLM subagent** after code edits—waiting 90 seconds for an LLM to run a script adds unnecessary delay.
- Instead, the executing agent (CEO on Fast-Track, or the Worker subagent before finishing) runs:
  1. `node tools/verify_and_sync.js` (**0 tokens, ~160ms**) to verify JS/HTML/JSON syntax, SHA-256 `srd_index.json` parity, `index.html` ➔ `character.html` sync, `webapp/` sync, and zero banned patterns (`U+1F3B2` dice emoji, duplicate static catalogs).
  2. `git diff` to confirm strict adherence to the Pre-Flight Contract.
