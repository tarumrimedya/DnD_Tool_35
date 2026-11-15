---
name: ceo-orchestrator
description: >-
  Operational playbook for Joyful-Fermi's Single-Cell Lean Agile CEO workflow (governed by GEMINI.md):
  local Playwright Node / Docker gate execution, 3-step zero-bloat read/edit protocol, exact Swarm model
  pinning (Hydrogen / Carbon / Argon / 3.8-Flash), tailwind_compiled.css + 3-format UI smoke gates,
  0-token verify_and_sync.js, and live task_board.md Kanban tracking.
---

# Lean Agile CEO Operational Playbook

`GEMINI.md` is the single source of truth for all Joyful-Fermi architectural, V3 data, and RAW rules. This skill provides the concise execution checklist so rules are applied on the first try without duplicating `GEMINI.md`.

## 1. Execution & Verification Commands (Windows)

- **Local Node (`0` Tokens, `<3s`):** Bare `node` is not in Windows `PATH`. Always invoke:
  ```powershell
  $node = "C:\Users\tarum\AppData\Local\ms-playwright-go\1.57.0\node.exe"
  & $node tools/verify_and_sync.js
  & $node tools/verify_v3_corpus.js
  ```
- **UI Smoke & Full CI Gate (Docker):**
  ```powershell
  powershell -File tools/ui_smoke/run.ps1
  powershell -ExecutionPolicy Bypass -File tools/check_all.ps1
  ```

## 2. 3-Step Zero-Bloat Read/Edit Sequence

1. **Index (`1×` `& $node -e`):** Print exact function/symbol line numbers across target root files (never scan `char_modals.js`, `hero_silhouette_data.js`, or `webapp/*`). Check `git branch` / `git worktree list` first if branches/worktrees differ.
2. **Read (`1×` Parallel `read_file` Batch):** Read all 4–8 target slices (`60–120` lines each) in one parallel turn.
3. **Edit & Gate (`1×` Parallel `edit_file` Batch + Verify):** Apply surgical edits in parallel, then run `& $node tools/verify_and_sync.js` (plus `tools/ui_smoke/run.ps1` for layout/UI changes) + `git diff`.

## 3. Swarm Model Pinning Matrix (Only for `2+` Heavy Disjoint Slices)

Never spawn `monitor` workers, Waterfall/PDCA loops, or workers for `<100`-line edits. When parallel Swarm workers are justified, pre-supply exact line numbers in the `brief`, `kill` workers immediately upon slice verification, and pin exact model IDs:

- **Default Spec Implementation:** `gemini-4-hydrogen-high`, `gemini-4-carbon-medium`, or `gemini-4-argon-medium`
- **Lightweight Audit / Scan:** `gemini-4-hydrogen-medium` or `gemini-3.8-flash-medium` (`gemini-3.8-flash-low` for trivial scans)
- **Novel Hard Core Architecture Only:** `gemini-4-carbon-high` or `gemini-4-argon-high`

## 4. Live Kanban (`task_board.md`) & Chat Discipline

- Maintain `task_board.md` in the conversation artifact directory (`⏳ Görev`, `💡 Fikir`, `✅ Tamamlandı`) for detailed technical logs, gate outputs, and `file://` links.
- Keep user-facing chat responses to **1–3 concise sentences**.
