---
name: ceo-orchestrator
description: >-
  Operational command & checklist reference for Joyful-Fermi's Single-Cell Lean Agile CEO workflow
  (governed by GEMINI.md): Windows local Node path, fast verify_and_sync iteration vs. pre-main
  Docker release gates (check_all / ui_smoke), 3-step zero-bloat indexing, and Neon / Carbon /
  Hydrogen / Sonnet 5.5 model pinning.
---

# Lean Agile CEO Operational Checklist

`GEMINI.md` is the **single source of truth** for all Joyful-Fermi rules, Pure V3 contracts, model routing, and verification policies. Do not duplicate rule prose here; use this file solely for exact Windows execution commands.

## 1. Fast Daily / `preview` Verification (`0` Tokens, `<1s`)

Bare `node` is not in Windows `PATH`. Run after every code/data edit:

```powershell
$node = "C:\Users\tarum\AppData\Local\ms-playwright-go\1.57.0\node.exe"
& $node tools/verify_and_sync.js
git diff --stat
```

## 2. Pre-`main` Merge / `main push` Release Gates (Mandatory Before `main`)

Do **not** spin up Docker smoke gates on routine `preview` tweaks. Run the full suite once before merging or pushing to `main` (requires explicit user approval to merge/push `main`):

```powershell
$node = "C:\Users\tarum\AppData\Local\ms-playwright-go\1.57.0\node.exe"
powershell -ExecutionPolicy Bypass -File tools/check_all.ps1
& $node tools/verify_v3_corpus.js
& $node tools/audit_v3_full.js
```

*(Standalone 3-format viewport check if needed: `powershell -File tools/ui_smoke/run.ps1`)*

## 3. Quick Pinning Reference (Full Policy in `GEMINI.md` §1.3)

- **Main Seat (Everyday Isolated):** `gemini-4-neon-medium` *(quota-balance alternate: `claude-sonnet-5-5-medium`)*
- **Main Seat (Sheet-Wide / Engine / User-Flagged):** `gemini-4-carbon-medium` / `gemini-4-carbon-high` *(deep algorithmic edge: `gemini-4-neon-xhigh`)*
- **Swarm Workers (`2+` Heavy Disjoint Slices Only, Line Numbers in `brief`):**
  - Routine specified slice: `gemini-4-hydrogen-high` or `gemini-4-hydrogen-medium`
  - Complex logic/module slice: `gemini-4-neon-medium` or `claude-sonnet-5-5-medium`
  - Read-only scan / browser: `gemini-4-hydrogen-medium`, `gemini-3.8-flash-medium`/`low`, `gpt-oss-120b-medium`; `browser` on `flash`
