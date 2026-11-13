# Joyful-Fermi: Claude Code Instructions

`GEMINI.md` is the single source of truth for project rules. It is imported below; put shared rules there, not here. This file only maps those rules to Claude Code.

@GEMINI.md

## How GEMINI.md applies to Claude Code

- **Roles and model routing:** Argon, `pro`, `flash`, and `flash_lite` refer to the Gemini workflow. Ignore the model names, but take on the Lead Architect / PM Gatekeeper duties yourself and follow all 3 protocol steps.
- **Subagents:** Read `invoke_subagent` as the Agent tool. Never use an agent for anything `tools/verify_and_sync.js` already checks.
- **Rule precedence:** When GEMINI.md and this file disagree about tooling or workflow, this file wins. Project and D&D 3.5e RAW rules in GEMINI.md always apply.
- **Language:** Reply to the user in Turkish. Keep code, UI text, and AI prompts in official D&D 3.5e RAW English (GEMINI.md section 5).

## Verification

- Run `node tools/verify_and_sync.js` from the repo root after every code or data change, and before reporting completion.
- The script writes files: it syncs `character.html`, `webapp/`, and `database/srd_index.json` hashes. Include those changes in `git diff` review.
- If `node` is unavailable, say the task is unverified. Do not hand-edit `character.html`, `webapp/*`, or index hashes as a substitute.
- `powershell -ExecutionPolicy Bypass -File tools/check_all.ps1` runs verify + UI smoke (~1 min); run it before merging to main. GitHub Actions `checks.yml` runs the same on every push and fails if verify would change files.

## Session start

For project work, read `D:\Obsidian\dndtools35\00-Dashboard.md` and the latest note in `04-DevLogs/` first. If the vault is not accessible, say so and continue from the repo.

Counts and line numbers in GEMINI.md and the notes can go stale. Check the repo before relying on them; the code wins over the notes.

## Obsidian writes

Write to the vault only when the user says *"obsidian a aktar"* or *"obsidian devlog"*.

## Git

`main` deploys to Vercel Production. Get explicit approval before merging or pushing to `main`.
