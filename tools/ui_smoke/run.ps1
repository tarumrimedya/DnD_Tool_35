# Runs the UI smoke suite in Docker. Usage (from anywhere): powershell -File tools/ui_smoke/run.ps1
# The image tag must match the playwright version in package.json (1.49.1).
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
docker run --rm --ipc=host `
  -v "${repo}:/work" `
  -v "ui_smoke_node_modules:/work/tools/ui_smoke/node_modules" `
  -w /work `
  mcr.microsoft.com/playwright:v1.49.1-noble `
  bash -c "cd tools/ui_smoke && npm install --no-audit --no-fund --loglevel=error && cd /work && node tools/ui_smoke/run_smoke.js"
exit $LASTEXITCODE
