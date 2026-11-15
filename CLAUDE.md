# Joyful-Fermi: Claude Code Instructions

`GEMINI.md` is the single source of truth for project rules. It is imported below; put shared rules there, not here. This file only maps those rules to Claude Code.

@GEMINI.md

## How GEMINI.md applies to Claude Code

- **Roles and model routing:** Gemini model IDs (`gemini-4-carbon-*`, `gemini-4-argon-*`, `gemini-4-hydrogen-*`, `gemini-3.8-flash-*`) and `swarm` refer to the Antigravity workflow. Ignore those model IDs in Claude Code, act as the Single-Cell Lean Agile CEO yourself, and follow the 3-Step Zero-Bloat Read/Edit Protocol.
- **Subagents:** Read `invoke_subagent` as the Claude Agent tool. Never spawn an agent for anything `tools/verify_and_sync.js` or `tools/verify_v3_corpus.js` already checks deterministically.
- **Rule precedence:** When `GEMINI.md` and this file disagree about CLI tooling, this file wins. Project, UI/UX, V3 data, and D&D 3.5e RAW rules in `GEMINI.md` always apply.
- **Language:** Reply to the user in Turkish. Keep all code, UI labels, modals, breakdowns, and AI prompts in official D&D 3.5e RAW English (`GEMINI.md` section 5).

## Verification (Windows Paths & Docker)

- Bare `node` may not be on the default Windows `PATH`; use `C:\Users\tarum\AppData\Local\ms-playwright-go\1.57.0\node.exe` (or `docker run --rm -v "${PWD}:/work" -w /work node:lts-slim node ...`) if `node` is not found.
- Run `tools/verify_and_sync.js` from the active repo/worktree root after every code or data change, and before reporting completion.
- The script writes files: it updates `?v=` asset hashes and syncs `character.html` and `webapp/`. Include those changes in `git diff` review.
- If neither local `node.exe` nor Docker is available, state explicitly that the task is unverified. Never hand-edit `character.html`, `webapp/*`, or index hashes as a substitute.
- `powershell -ExecutionPolicy Bypass -File tools/check_all.ps1` runs `verify_and_sync.js` + Playwright `run_smoke.js` in Docker (~1 min); run it before merging to `main`. GitHub Actions `checks.yml` enforces the same gates on every push.

## Session start

For project work, check `git branch` / `git worktree list`, then read `D:\Obsidian\dndtools35\00-Dashboard.md`, `01-Architecture/UI-UX Design System and Do-Dont Master Guide.md`, and the latest note in `04-DevLogs/` first. If the vault is not accessible, say so and continue from the repo.

Counts and line numbers in notes can go stale. Check the repo before relying on them; the code wins over the notes.

## Obsidian writes

Write to the vault only when the user says *"obsidian a aktar"* or *"obsidian devlog"*.

## Git

`main` deploys to Vercel Production. Get explicit approval before merging or pushing to `main`.
