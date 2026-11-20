# Joyful-Fermi: Claude Code Instructions

`GEMINI.md` is the single source of truth for project rules. It is imported below; put shared rules there, not here. This file only maps those rules to Claude Code.

@GEMINI.md

## How GEMINI.md applies to Claude Code

- **Roles and model routing:** Gemini/Swarm model IDs (`gemini-4-carbon-*`, `gemini-4-neon-*`, `gemini-4-argon-*`, `gemini-4-hydrogen-*`, `gemini-3.8-flash-*`, `gpt-oss-*`) and `swarm` refer to the Antigravity workflow. Ignore those model IDs in Claude Code, act as the Single-Cell Lean Agile CEO yourself, and follow the 3-Step Zero-Bloat Read/Edit Protocol.
- **Subagents:** Read `invoke_subagent` as the Claude Agent tool. Never spawn an agent for anything `tools/verify_and_sync.js` or `tools/verify_v3_corpus.js` already checks deterministically.
- **Rule precedence:** When `GEMINI.md` and this file disagree about CLI tooling, this file wins. Project, UI/UX, V3 data, and D&D 3.5e RAW rules in `GEMINI.md` always apply.
- **Language:** Reply to the user in Turkish. Keep all code, UI labels, modals, breakdowns, and AI prompts in official D&D 3.5e RAW English (`GEMINI.md` section 5).

## Verification (Windows Paths & Docker)

- Bare `node` may not be on the default Windows `PATH`; use `C:\Users\tarum\AppData\Local\ms-playwright-go\1.57.0\node.exe` (or `docker run --rm -v "${PWD}:/work" -w /work node:lts-slim node ...`) if `node` is not found.
- Run `tools/verify_and_sync.js` from the active repo/worktree root after every code or data change, and before reporting completion.
- The script writes files: it updates `?v=` asset hashes and syncs `character.html` and `webapp/`. Include those changes in `git diff` review.
- If neither local `node.exe` nor Docker is available, state explicitly that the task is unverified. Never hand-edit `character.html`, `webapp/*`, or index hashes as a substitute.
- `powershell -ExecutionPolicy Bypass -File tools/check_all.ps1` runs `verify_and_sync.js` + Playwright `run_smoke.js` in Docker (~1 min); run it before merging to `main`. GitHub Actions `checks.yml` enforces the same gates on every push.

## Session flow (one topic per session)

- **Opening:** The user opens with `Konu`, `Tür` (`motor` | `ui` | `veri` | `soru`), and `Bitti sayılır` (definition of done). If any of these is missing, infer it and state it in one line; do not ask.
- **Session start reads:** Check `git branch` / `git worktree list`, then read `D:\Obsidian\dndtools35\00-Dashboard.md` and the latest note in `04-DevLogs/`. Read `01-Architecture/UI-UX Design System and Do-Dont Master Guide.md` only for `ui` work. If the vault is not accessible, say so and continue from the repo. Counts and line numbers in notes can go stale; the code wins over the notes.
- **Model per type:** `motor` (rule engine, V3 contract, architecture) and `soru` (design questions, no file edits) use Opus. `ui` (labels, layout, copy) and `veri` (corpus edits) use Sonnet; bulk data cleanup can go to a Haiku subagent. When an Opus session turns up routine `ui`/`veri` work, propose it as a separate Sonnet session instead of doing it here.
- **During work:** Prefer batched, numbered feedback and close each item explicitly. Ask for a screenshot or a one-line pointer instead of pasted HTML/JSON, and read the file yourself. If an unrelated request arrives mid-topic, offer to hand it off to a new session.
- **Verification ladder:** Iterative/preview edits → `tools/verify_and_sync.js` + `git diff` only (add one screenshot if requested for visual review). Before merging or pushing to `main` → `tools/check_all.ps1` (`verify_and_sync` + `ui_smoke/run.ps1`) + corpus audits as applicable. No long browser tours unless the user asks or a smoke test fails.
- **Closing:** When the definition of done is met, say so, commit and push the branch, and remind the user to say *"obsidian devlog"* and start a new session for the next topic. If the conversation grows long (roughly 80k+ tokens), propose closing even if the topic is unfinished.

## Obsidian writes

Write to the vault only when the user says *"obsidian a aktar"* or *"obsidian devlog"*.

## Git

`main` deploys to Vercel Production. Get explicit approval before merging or pushing to `main`.
