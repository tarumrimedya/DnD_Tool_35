# One local command for all checks: verify_and_sync (Docker, node) + UI smoke (Docker, Playwright).
# Usage: powershell -ExecutionPolicy Bypass -File tools/check_all.ps1 [-SkipSmoke]
param([switch]$SkipSmoke)
$ErrorActionPreference = 'Continue'   # docker writes Node warnings to stderr; judge by exit code only
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sw = [Diagnostics.Stopwatch]::StartNew()

Write-Host '== [1/2] verify_and_sync.js (node:lts-slim) =='
docker run --rm -v "${repo}:/work" -w /work node:lts-slim node tools/verify_and_sync.js
$verifyCode = $LASTEXITCODE
if ($verifyCode -ne 0) {
  Write-Host ("CHECK_ALL: FAIL - verify exited with {0} ({1:n0}s)" -f $verifyCode, $sw.Elapsed.TotalSeconds)
  exit $verifyCode
}

if ($SkipSmoke) {
  Write-Host ("CHECK_ALL: PASS - verify OK, UI smoke skipped ({0:n0}s)" -f $sw.Elapsed.TotalSeconds)
  exit 0
}

Write-Host '== [2/2] UI smoke (Playwright) =='
& (Join-Path $PSScriptRoot 'ui_smoke\run.ps1')
$smokeCode = $LASTEXITCODE
if ($smokeCode -ne 0) {
  Write-Host ("CHECK_ALL: FAIL - UI smoke exited with {0} ({1:n0}s)" -f $smokeCode, $sw.Elapsed.TotalSeconds)
  exit $smokeCode
}
Write-Host ("CHECK_ALL: PASS - verify + UI smoke OK ({0:n0}s)" -f $sw.Elapsed.TotalSeconds)
exit 0
