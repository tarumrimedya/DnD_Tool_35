---
name: claude-bridge
description: >-
  Communicates directly with the local Claude Code CLI (claude.exe via Claude Desktop on
  Windows). Trigger ONLY when the user explicitly names "Claude Code" (e.g. "Claude Code'a sor",
  "Claude Code ile konuş"). For general "Claude'a sor" / cross-audit requests without "Claude Code",
  use Antigravity's native separate-quota Swarm models (claude-opus-5-5-high / claude-sonnet-5-5-medium).
---

# Claude Bridge Skill (`claude-bridge`)

Enables direct CLI communication between **Antigravity** and the local **Claude Code CLI (`claude.exe`)** when the user explicitly says **"Claude Code"**. *(If the user asks for "Claude" generically without saying "Claude Code", prefer Antigravity's built-in `claude-opus-5-5-high` / `claude-sonnet-5-5-medium` via `swarm` instead of spawning `claude.exe`.)*

## 1. Executable Resolution (Update-Resilient)

Claude Desktop stores its bundled `claude.exe` binary under `$env:LOCALAPPDATA\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\<version>\<hash>\claude.exe`.
Always resolve the latest installed binary dynamically in PowerShell so version updates never break the path:

```powershell
$claudeExe = (Get-ChildItem "$env:LOCALAPPDATA\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\*\*\claude.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
```

## 2. Standard Invocation Patterns (PowerShell)

Always pipe `$null |` into `claude.exe` so it does not wait 3 seconds for stdin, and set `WaitMsBeforeAsync: 10000` (or allow background completion for deep reviews):

### A. Single-Turn Query / Architecture & Rule Consultation (`-p`)
Runs in the current workspace directory (`C:\Users\tarum\Documents\antigravity\joyful-fermi`), where Claude automatically loads `CLAUDE.md` (which imports `@GEMINI.md` and references `D:\Obsidian\dndtools35`):

```powershell
$claudeExe = (Get-ChildItem "$env:LOCALAPPDATA\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\*\*\claude.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
$null | & $claudeExe -p "<PROMPT>"
```

### B. Continuing the Most Recent Conversation (`-c -p`)
When conducting a multi-turn discussion with Claude on the same topic:

```powershell
$claudeExe = (Get-ChildItem "$env:LOCALAPPDATA\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\*\*\claude.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
$null | & $claudeExe -c -p "<FOLLOW_UP_PROMPT>"
```

### C. Resuming a Specific Session (`-r <session-id> -p`)
To resume a specific session ID:

```powershell
$claudeExe = (Get-ChildItem "$env:LOCALAPPDATA\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\*\*\claude.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
$null | & $claudeExe -r "<SESSION_ID>" -p "<PROMPT>"
```

## 3. Collaboration & Safety Rules

1. **Read-Only Consultation by Default:** When asking Claude for second opinions, code reviews, or D&D 3.5e RAW cross-checks, instruct Claude in the prompt not to modify files unless explicitly requested.
2. **Shared Source of Truth:** Both agents share `CLAUDE.md` ➔ `GEMINI.md` and `D:\Obsidian\dndtools35\`. No extra project specification is needed when invoked from the repo root.
3. **Authentication Recovery:** If `claude.exe` ever returns `Not logged in · Please run /login`, ask the user to run `& $claudeExe auth login` once in their terminal.
