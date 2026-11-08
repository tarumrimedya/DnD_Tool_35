# Sheet V3 Engine Fork

The files in this folder are Sheet V3's own copy of the legacy engine. V3 rewrites them freely
(entry `kind`, single write gate, non-destructive migrations). The classic sheet, Hub and any
other session keep using the root copies, so the two never mix.

## Fork point

Forked at commit `628d56c` (branch `redesign/page-from-scratch`, based on
`feat/v25-lego-engine-spotlight-terminal` @ `ba0a63b`).

| File | Source | Git blob at fork | Lines |
| :--- | :--- | :--- | ---: |
| `rule_engine.js` | `/rule_engine.js` | `31a388c1fe00659cb63adb35235e046ada59f396` | 7,253 |
| `srd_compendium.js` | `/srd_compendium.js` | `cc8efc3544335666da2425437edece6696e969bf` | 2,460 |

To see what changed in the legacy engine since the fork:

```bash
git diff 628d56c -- rule_engine.js srd_compendium.js
```

## Rules

1. These are **classic scripts** (not ES modules). `sheet.html` loads them with `<script src>`,
   and V3 modules reach them only through `sheet/core/engine-adapter.js`.
2. Legacy files (`index.html`, `hub.html`, `char_*.js`, root engine files) must never reference
   `sheet/`. `tools/verify_and_sync.js` enforces this.
3. The **data contract is shared and unchanged**: same character JSON, same `database/` SRD chunks,
   same localStorage keys. V3 may only **add** fields (for example `kind`, `quarantine`), never remove
   or rename ones the classic sheet reads.
4. The fork shares the SRD IndexedDB cache with the classic sheet (same `IDB_NAME`). If V3 ever
   changes the cached record format, it must use its own `IDB_NAME` first.
5. A critical RAW rule fix made in the root engine during the transition must also be applied
   here. Record it below.

## Legacy fixes ported since the fork

| Date | Root commit | Ported in | Note |
| :--- | :--- | :--- | :--- |
| | | | |
