'use strict';

/**
 * Headless Node Test Suite for `sheet_shell.js` (Phase 0 Infrastructure)
 * Verifies:
 *   1. Shell mode & 3-theme validation + defaults
 *   2. Single-owner Region Registry (`claim`, `owns`, `release`)
 *   3. Coalesced Change Bus selective slice delivery & `'*'` broadcast
 *   4. Resource-aware 4-tier Warm-Up tier gating (`getMaxTier`)
 */
const assert = require('assert');
const path = require('path');

function runSheetShellTests() {
  const Sheet = require(path.join(__dirname, '..', 'sheet_shell.js'));
  let passed = 0;

  // 1. Defaults & Theme/Shell validation
  assert.strictEqual(Sheet.shell.getMode(), 'classic', 'Default shell mode must be classic');
  assert.strictEqual(Sheet.shell.isCalm(), false);
  assert.strictEqual(Sheet.theme.get(), 'slate', 'Default theme must be slate');
  assert.deepStrictEqual(Sheet.theme.list(), ['slate', 'obsidian', 'midnight']);

  assert.strictEqual(Sheet.shell.setMode('CALM', { persist: false }), 'calm');
  assert.strictEqual(Sheet.shell.isCalm(), true);
  assert.strictEqual(Sheet.shell.setMode('invalid', { persist: false }), 'classic');

  assert.strictEqual(Sheet.theme.set('obsidian', { persist: false }), 'obsidian');
  assert.strictEqual(Sheet.theme.set('midnight', { persist: false }), 'midnight');
  assert.strictEqual(Sheet.theme.set('neon-trash', { persist: false }), 'slate');
  passed += 1;

  // 2. Region Ownership Registry
  Sheet.regions.clearAll();
  assert.strictEqual(Sheet.regions.owns('hud'), false);
  Sheet.regions.claim('hud', 'sheet_spine');
  assert.strictEqual(Sheet.regions.owns('hud'), true);
  assert.strictEqual(Sheet.regions.getOwner('hud'), 'sheet_spine');
  assert.strictEqual(Sheet.regions.release('hud', 'wrong_owner'), false);
  assert.strictEqual(Sheet.regions.owns('hud'), true);
  assert.strictEqual(Sheet.regions.release('hud', 'sheet_spine'), true);
  assert.strictEqual(Sheet.regions.owns('hud'), false);
  passed += 1;

  // 3. Selective Slice Bus & Broadcast
  let hpCalls = 0;
  let offenseCalls = 0;
  let lastRev = 0;
  Sheet.regions.register('spine.hp', {
    slices: ['hp'],
    render: (ev) => { hpCalls++; lastRev = ev.rev; }
  });
  Sheet.regions.register('play.offense', {
    slices: ['offense'],
    render: (ev) => { offenseCalls++; lastRev = ev.rev; }
  });

  Sheet.bus.emit(['hp'], { sync: true });
  assert.strictEqual(hpCalls, 1, 'hp subscriber should run once');
  assert.strictEqual(offenseCalls, 0, 'offense subscriber should NOT run on hp slice');

  Sheet.bus.emit(['*'], { sync: true });
  assert.strictEqual(hpCalls, 2, 'wildcard should trigger hp subscriber');
  assert.strictEqual(offenseCalls, 1, 'wildcard should trigger offense subscriber');
  assert.ok(lastRev >= 2, 'rev must increment monotonically');

  Sheet.regions.unregister('spine.hp');
  Sheet.bus.emit(['hp'], { sync: true });
  assert.strictEqual(hpCalls, 2, 'unregistered subscriber must not run');
  Sheet.regions.clearAll();
  passed += 1;

  // 4. Warm-Up Resource Gating
  assert.strictEqual(Sheet.warmup.getMaxTier({ navigator: { deviceMemory: 8 }, window: { innerWidth: 1440 } }), 3);
  assert.strictEqual(Sheet.warmup.getMaxTier({ navigator: { connection: { saveData: true }, deviceMemory: 8 }, window: { innerWidth: 1440 } }), 1);
  assert.strictEqual(Sheet.warmup.getMaxTier({ navigator: { connection: { effectiveType: '3g' }, deviceMemory: 8 }, window: { innerWidth: 1440 } }), 1);
  assert.strictEqual(Sheet.warmup.getMaxTier({ navigator: { deviceMemory: 4 }, window: { innerWidth: 1440 } }), 1);
  assert.strictEqual(Sheet.warmup.getMaxTier({ navigator: { deviceMemory: 8 }, window: { innerWidth: 768 } }), 1);
  passed += 1;

  return { passed, total: 4 };
}

if (require.main === module) {
  const res = runSheetShellTests();
  console.log(`[OK] sheet_shell tests: ${res.passed}/${res.total} suites passed.`);
}

module.exports = { runSheetShellTests };
