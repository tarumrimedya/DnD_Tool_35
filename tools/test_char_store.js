#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function makeSandbox() {
  let saveCalls = 0;
  let lastCloudSync = null;
  const ctx = {
    window: null,
    globalThis: null,
    console,
    Date, Math, JSON, RegExp, Object, Array, String, Number, Boolean, Set, Map, Promise, Error,
    setTimeout, clearTimeout,
    saveStateToStorage(cloudSync) {
      saveCalls++;
      lastCloudSync = cloudSync;
    },
    getSaveCount: () => saveCalls,
    resetSaveCount: () => { saveCalls = 0; lastCloudSync = null; },
    getLastCloudSync: () => lastCloudSync
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;

  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'rulesets', 'dnd35.js'), 'utf8'), ctx);
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'rule_engine.js'), 'utf8'), ctx);
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'char_store.js'), 'utf8'), ctx);
  return ctx;
}

function makeTestChar() {
  return {
    id: 'char-store-test-1',
    name: 'Store Test Hero',
    race: 'Human',
    size: 'Medium',
    level: 5,
    bab: 5,
    baseAbilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 10 },
    abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 10 },
    hp: { current: 40, max: 50, temp: 5 },
    tactical: {
      powerAttack: 0,
      combatExpertise: 0,
      fightingDefensively: false,
      totalDefense: false,
      charge: false,
      flanking: false
    },
    buffs: [
      { id: 'buff-haste', name: 'Haste', active: false, duration: 5, effects: [{ type: 'stat', mode: 'flat', targets: ['ac.dodge'], value: 1, btype: 'Dodge' }] }
    ],
    customDb: [{ id: 'custom-sentinel', name: 'Sentinel Entry', schemaVersion: 3, effects: [] }],
    activeWeapon: 'Longsword',
    weapons: [
      {
        id: 'wep-longsword-1',
        name: 'Longsword',
        damage: '1d8',
        damageDice: '1d8',
        handedness: 'One-Handed',
        modes: [{ id: 'mode-flaming', name: 'Flaming', effects: [{ type: 'roll', kind: 'Damage', dice: '1d6', dmgType: 'Fire' }] }]
      }
    ],
    inventory: [],
    feats: [
      { id: 'feat-power-attack', name: 'Power Attack' },
      { id: 'feat-combat-expertise', name: 'Combat Expertise' }
    ],
    levels: [{ className: 'Fighter' }, { className: 'Fighter' }, { className: 'Fighter' }, { className: 'Fighter' }, { className: 'Fighter' }]
  };
}

function runCharStoreTests() {
  const startMs = Date.now();
  let passed = 0;
  const failures = [];
  const check = (cond, msg) => { if (cond) passed++; else failures.push(msg); };

  const ctx = makeSandbox();
  const Store = ctx.CharStore;

  // 1. Setup & hud/adjustHp Temp HP non-stacking + damage order
  Store.replaceDoc(makeTestChar(), { skipHistory: true, persist: false });
  Store.clearHistory();
  ctx.resetSaveCount();

  Store.dispatch({ type: 'hud/adjustHp', payload: { mode: 'temp', amount: 12 } });
  check(Store.getDoc().hp.temp === 12, 'hud/adjustHp temp 5 -> 12 must raise temp HP to 12');

  Store.dispatch({ type: 'hud/adjustHp', payload: { mode: 'temp', amount: 5 } });
  check(Store.getDoc().hp.temp === 12, 'hud/adjustHp temp 12 -> 5 must keep higher 12 (3.5e non-stacking RAW)');

  Store.dispatch({ type: 'hud/adjustHp', payload: { mode: 'damage', amount: 15 } });
  check(Store.getDoc().hp.temp === 0 && Store.getDoc().hp.current === 37,
    'hud/adjustHp damage 15 with 12 temp must absorb 12 temp and deduct 3 from current (40 -> 37)');

  // 2. Transactions: 3 dispatches -> 1 undo frame, nested keeps outer label, single deferred save, undo blocked in tx
  Store.replaceDoc(makeTestChar(), { skipHistory: true, persist: false });
  Store.clearHistory();
  ctx.resetSaveCount();

  const verBefore = Store.getDocVersion();
  Store.beginTransaction('Outer Turn');
  check(Store.isInTransaction() === true, 'isInTransaction must be true inside beginTransaction');
  Store.dispatch({ type: 'combat/toggleTacticalMod', payload: { key: 'charge' } });
  Store.beginTransaction('Inner Step');
  Store.dispatch({ type: 'combat/adjustPowerAttack', payload: { value: 3 } });
  Store.dispatch({ type: 'hud/adjustHp', payload: { mode: 'damage', amount: 7 } });
  // Undo inside transaction must be ignored
  Store.dispatch({ type: 'history/undo' });
  Store.endTransaction();
  const txOut = Store.endTransaction();

  check(txOut.committed === true && txOut.changed === true && txOut.label === 'Outer Turn',
    'nested transaction must commit with outer label');
  check(Store.isInTransaction() === false, 'isInTransaction must be false after outermost endTransaction');
  check(Store.getHistoryCounts().undo === 1, `3 dispatches in transaction must create exactly 1 undo frame (got ${Store.getHistoryCounts().undo})`);
  check(ctx.getSaveCount() === 1, `transaction must defer saveStateToStorage and flush once at end (got ${ctx.getSaveCount()})`);
  check(Store.getDocVersion() > verBefore, 'docVersion must increment on mutations');
  check(Store.getDoc().tactical.charge === true && Store.getDoc().tactical.powerAttack === 3 && Store.getDoc().hp.current === 38,
    'all 3 mutations must be applied after transaction commit');

  // Single undo must revert all 3 mutations at once
  Store.undo();
  check(Store.getDoc().tactical.charge === false && Store.getDoc().tactical.powerAttack === 0 && Store.getDoc().hp.current === 40 && Store.getDoc().hp.temp === 5,
    'single undo() must revert entire 3-dispatch transaction atomically');

  // 3. Transaction rollback on error (atomic, no undo entry pushed)
  Store.clearHistory();
  ctx.resetSaveCount();
  let caughtErr = false;
  try {
    Store.beginTransaction('Failing Chain');
    Store.dispatch({ type: 'combat/toggleTacticalMod', payload: { key: 'flanking' } });
    throw new Error('simulated_boom');
  } catch (e) {
    caughtErr = true;
    Store.endTransaction({ rollback: true });
  }
  check(caughtErr && Store.getDoc().tactical.flanking === false, 'rollback must restore pre-transaction state');
  check(Store.getHistoryCounts().undo === 0, 'rollback must not push an undo entry');
  check(ctx.getSaveCount() === 0, 'rollback must not trigger saveStateToStorage');

  // 4. previewDispatch purity & diffs across whitelisted actions
  Store.replaceDoc(makeTestChar(), { skipHistory: true, persist: false });
  Store.clearHistory();
  ctx.resetSaveCount();
  Store.dispatch({ type: 'hud/adjustHp', payload: { mode: 'heal', amount: 2 }, meta: { skipHistory: true, persist: false } });
  const sentinelOutcome = Store.getLastOutcome();
  const docBeforeJson = JSON.stringify(Store.getDoc());
  const customDbBeforeJson = JSON.stringify(Store.getDoc().customDb);
  const undoBefore = Store.getHistoryCounts().undo;

  const previewCases = [
    { type: 'hud/adjustHp', payload: { mode: 'damage', amount: 10 } },
    { type: 'combat/toggleTacticalMod', payload: { key: 'charge' } },
    { type: 'combat/adjustPowerAttack', payload: { value: 9 } }, // should warn capped at BAB +5
    { type: 'combat/toggleBuff', payload: { index: 0 } },
    { type: 'combat/addBuff', payload: { id: 'buff-aid', name: 'Aid', active: true, tempHp: 10, effects: [] } },
    { type: 'progression/adjustAbility', payload: { statKey: 'str', delta: 2 } },
    [
      { type: 'combat/toggleTacticalMod', payload: { key: 'charge' } },
      { type: 'combat/adjustPowerAttack', payload: { value: 3 } }
    ]
  ];

  for (const act of previewCases) {
    const pv = Store.previewDispatch(act);
    check(pv.ok === true && Array.isArray(pv.diffs) && pv.diffs.length > 0,
      `previewDispatch must return ok:true with non-empty diffs for ${Array.isArray(act) ? 'chain' : act.type}`);
  }
  const paCapPv = Store.previewDispatch({ type: 'combat/adjustPowerAttack', payload: { value: 9 } });
  check(paCapPv.warnings.some((w) => /Capped at BAB/i.test(w)), 'previewDispatch must warn when Power Attack exceeds BAB');

  const abortPv = Store.previewDispatch({ type: 'combat/toggleBuff', payload: { index: 99 } });
  check(abortPv.ok === false && abortPv.aborted === 'not_found', 'previewDispatch must report aborted status cleanly');

  check(JSON.stringify(Store.getDoc()) === docBeforeJson, 'previewDispatch must NEVER mutate _state.doc');
  check(JSON.stringify(Store.getDoc().customDb) === customDbBeforeJson, 'previewDispatch must NEVER mutate customDb');
  check(Store.getHistoryCounts().undo === undoBefore, 'previewDispatch must NEVER mutate undo stack');
  check(ctx.getSaveCount() === 0, 'previewDispatch must NEVER call saveStateToStorage');
  check(deepEqual(Store.getLastOutcome(), sentinelOutcome), 'previewDispatch must preserve getLastOutcome()');

  // 5. S2-pre/S2: getTacticalLimits (PA/CE feat gating), weaponId selectWeaponMode, offense projector
  const noFeatChar = makeTestChar();
  noFeatChar.feats = [];
  Store.replaceDoc(noFeatChar, { skipHistory: true, persist: false });
  const limitsNoFeat = ctx.DnD35Ruleset.getTacticalLimits(Store.getDoc());
  check(limitsNoFeat.powerAttackMax === 0 && limitsNoFeat.combatExpertiseMax === 0,
    'getTacticalLimits must lock PA & CE to 0 when character lacks the feats');
  Store.dispatch({ type: 'combat/adjustPowerAttack', payload: { value: 3 } });
  check(Store.getDoc().tactical.powerAttack === 0 && Store.getLastOutcome().featRequired === 'Power Attack',
    'combat/adjustPowerAttack must clamp to 0 and report featRequired when Power Attack feat is absent');
  const pvNoFeat = Store.previewDispatch({ type: 'combat/adjustCombatExpertise', payload: { value: 2 } });
  check(pvNoFeat.warnings.some((w) => /Combat Expertise feat required/i.test(w)),
    'previewDispatch must warn when Combat Expertise feat is absent');

  // weaponId match on combat/selectWeaponMode
  Store.dispatch({ type: 'combat/selectWeaponMode', payload: { weaponId: 'wep-longsword-1', weaponName: 'WrongName', modeId: 'mode-flaming' } });
  check(Store.getDoc().weapons[0].activeModeId === 'mode-flaming' && Store.getDoc().activeModes['wep-longsword-1'] === 'mode-flaming',
    'combat/selectWeaponMode must resolve weapon by immutable weaponId before weaponName');

  // 6. P0 Subsystems (S1-S5): spells/subsysAction atomic 1-step Undo/Redo + hud/longRest reset
  const subsysChar = makeTestChar();
  subsysChar.psionics = {
    currentPP: 35,
    maxPP: 35,
    powers: [{ id: 'pwr-inertial-armor', name: 'Inertial Armor', level: 1, ppCost: 1, augmentPP: 0, active: false }]
  };
  subsysChar.incarnum = {
    soulmelds: [{ id: 'sm-bluesteel-bracers', name: 'Bluesteel Bracers', investedEssentia: 0, essentia: 0, boundChakra: 'None' }]
  };
  subsysChar.pactMagic = {
    vestiges: [{ id: 'vst-naberius', name: 'Naberius', vestigeLevel: 1, bindingDc: 15, pactQuality: 'good', cooldownRounds: 5 }]
  };
  subsysChar.shadowMagic = {
    mysteries: [{ id: 'mys-carpet-of-shadow', name: 'Carpet of Shadow', tier: 'Apprentice', level: 1, dailyMax: 1, usesLeft: 1, active: false }]
  };
  subsysChar.truenaming = {
    utterances: [{ id: 'utt-knights-puissance', name: "Knight's Puissance", lexicon: 'Evolving Mind', level: 1, targetCR: 3, castsToday: 0, active: false }]
  };
  Store.replaceDoc(subsysChar, { skipHistory: true, persist: false });
  Store.clearHistory();

  // S3 & S5: Manifest power with activate:true + 1-step Undo/Redo
  Store.dispatch({ type: 'spells/subsysAction', payload: { discipline: 'psionics', op: 'manifestPower', idx: 0, totalCost: 5, maxPP: 35, currentPP: 35, activate: true } });
  check(Store.getDoc().psionics.currentPP === 30 && Store.getDoc().psionics.powers[0].active === true,
    'S3/S5: manifestPower must spend PP and activate buff power atomically');
  Store.undo();
  check(Store.getDoc().psionics.currentPP === 35 && Store.getDoc().psionics.powers[0].active === false,
    'S5: Ctrl+Z Undo after manifestPower must restore PP and active:false in 1 step');
  Store.redo();
  check(Store.getDoc().psionics.currentPP === 30 && Store.getDoc().psionics.powers[0].active === true,
    'S5: Ctrl+Y Redo after manifestPower must re-apply PP spend and active:true');

  // S1 & S5: essentiaDelta syncs both investedEssentia & essentia + Undo
  Store.dispatch({ type: 'spells/subsysAction', payload: { discipline: 'incarnum', op: 'essentiaDelta', idx: 0, delta: 2, cap: 2 } });
  check(Store.getDoc().incarnum.soulmelds[0].investedEssentia === 2 && Store.getDoc().incarnum.soulmelds[0].essentia === 2,
    'S1/S5: essentiaDelta must keep investedEssentia and essentia in sync');
  Store.undo();
  check(Store.getDoc().incarnum.soulmelds[0].investedEssentia === 0 && Store.getDoc().incarnum.soulmelds[0].essentia === 0,
    'S5: Ctrl+Z Undo after essentiaDelta must restore 0');

  // Cast mystery & speak utterance -> S2 Long Rest resets all 5 subsystems
  Store.dispatch({ type: 'spells/subsysAction', payload: { discipline: 'shadow', op: 'castMystery', idx: 0, activate: true } });
  Store.dispatch({ type: 'spells/subsysAction', payload: { discipline: 'truenaming', op: 'speakUtterance', idx: 0, success: true, activate: true } });
  check(Store.getDoc().shadowMagic.mysteries[0].usesLeft === 0 && Store.getDoc().shadowMagic.mysteries[0].active === true,
    'S3: castMystery must decrement usesLeft and set active:true');
  check(Store.getDoc().truenaming.utterances[0].castsToday === 1 && Store.getDoc().truenaming.utterances[0].active === true,
    'S3: speakUtterance on success must increment castsToday and set active:true');

  Store.dispatch({ type: 'hud/longRest', payload: {} });
  const afterRest = Store.getDoc();
  check(
    afterRest.psionics.currentPP === 35 &&
    afterRest.psionics.powers[0].active === false &&
    afterRest.shadowMagic.mysteries[0].usesLeft === 1 &&
    afterRest.shadowMagic.mysteries[0].active === false &&
    afterRest.truenaming.utterances[0].castsToday === 0 &&
    afterRest.truenaming.utterances[0].active === false &&
    afterRest.pactMagic.vestiges[0].cooldownRounds === 0,
    'S2: hud/longRest must restore PP, mystery usesLeft, truenaming castsToday, vestige cooldownRounds, and clear temporary active flags'
  );

  // 7. P1 Subsystems (S7, S8, S11): caps, legal chakra slots, occupancy, remove+Undo, resolveEntity nested buckets
  // S7: maxSoulmelds cap & duplicate guard
  Store.dispatch({
    type: 'spells/subsysAction',
    payload: { discipline: 'incarnum', op: 'add', maxSoulmelds: 1, entry: { id: 'sm-wormtail-belt', name: 'Wormtail Belt', chakraSlots: 'Waist, Totem' } }
  });
  check(Store.getLastOutcome().status === 'cap_exceeded' && Store.getLastOutcome().reason === 'maxSoulmelds' && Store.getDoc().incarnum.soulmelds.length === 1,
    'S7: add must enforce maxSoulmelds cap');
  Store.dispatch({
    type: 'spells/subsysAction',
    payload: { discipline: 'incarnum', op: 'add', maxSoulmelds: 4, entry: { id: 'sm-bluesteel-bracers', name: 'Bluesteel Bracers', chakraSlots: 'Arms' } }
  });
  check(Store.getLastOutcome().status === 'duplicate_entry' && Store.getDoc().incarnum.soulmelds.length === 1,
    'S7: add must block duplicate soulmeld');
  // S7: Pact maxVestiges & maxVestigeLevel caps
  Store.dispatch({
    type: 'spells/subsysAction',
    payload: { discipline: 'pact', op: 'add', maxVestiges: 2, maxVestigeLevel: 3, entry: { id: 'vst-agares', name: 'Agares', vestigeLevel: 4, bindingDc: 22 } }
  });
  check(Store.getLastOutcome().status === 'cap_exceeded' && Store.getLastOutcome().reason === 'maxVestigeLevel',
    'S7: add must block vestige above maxVestigeLevel');

  // S8: legal chakra slot, maxChakraBinds, and single-meld-per-chakra occupancy
  Store.getDoc().incarnum.soulmelds[0].chakraSlots = 'Arms';
  Store.dispatch({
    type: 'spells/subsysAction',
    payload: { discipline: 'incarnum', op: 'chakraBind', idx: 0, slot: 'Crown', maxChakraBinds: 2 }
  });
  check(Store.getLastOutcome().status === 'illegal_chakra_slot' && Store.getDoc().incarnum.soulmelds[0].boundChakra === 'None',
    'S8: chakraBind must reject illegal chakra slot');
  Store.dispatch({
    type: 'spells/subsysAction',
    payload: { discipline: 'incarnum', op: 'chakraBind', idx: 0, slot: 'Arms', maxChakraBinds: 2 }
  });
  check(Store.getLastOutcome().status === 'chakra_bound' && Store.getDoc().incarnum.soulmelds[0].boundChakra === 'Arms',
    'S8: chakraBind must allow legal chakra slot');
  Store.dispatch({
    type: 'spells/subsysAction',
    payload: { discipline: 'incarnum', op: 'add', maxSoulmelds: 4, entry: { id: 'sm-lammasu-mantle', name: 'Lammasu Mantle', chakraSlots: 'Arms, Shoulders' } }
  });
  Store.dispatch({
    type: 'spells/subsysAction',
    payload: { discipline: 'incarnum', op: 'chakraBind', idx: 1, slot: 'Arms', maxChakraBinds: 2 }
  });
  check(Store.getLastOutcome().status === 'chakra_slot_occupied',
    'S8: chakraBind must block two soulmelds on the same chakra');

  // S11: StudioBridge.resolveEntity must find instances inside nested subsystem buckets
  const resPower = Store.StudioBridge.resolveEntity({ kind: 'power', id: 'pwr-inertial-armor', index: 0 });
  const resMeld = Store.StudioBridge.resolveEntity({ kind: 'soulmeld', id: 'sm-bluesteel-bracers', index: 0 });
  check(Boolean(resPower && resPower.entry && resPower.entry.id === 'pwr-inertial-armor' && resPower.sourceLocation === 'psionics'),
    'S11: StudioBridge.resolveEntity must resolve character instance inside doc.psionics.powers');
  check(Boolean(resMeld && resMeld.entry && resMeld.entry.boundChakra === 'Arms' && resMeld.sourceLocation === 'incarnum'),
    'S11: StudioBridge.resolveEntity must resolve character instance inside doc.incarnum.soulmelds');

  // Remove + 1-step Undo
  Store.dispatch({ type: 'spells/subsysAction', payload: { discipline: 'pact', op: 'remove', idx: 0 } });
  check(Store.getDoc().pactMagic.vestiges.length === 0, 'S7: op=remove must expel vestige');
  Store.undo();
  check(Store.getDoc().pactMagic.vestiges.length === 1, 'S7: Ctrl+Z Undo after op=remove must restore vestige');

  const elapsedMs = Date.now() - startMs;
  if (failures.length > 0) {
    throw new Error(`CharStore Test Gate failed (${failures.length} failure(s)):\n  - ${failures.join('\n  - ')}`);
  }
  return { passed, elapsedMs };
}

module.exports = { runCharStoreTests };

if (require.main === module) {
  try {
    const res = runCharStoreTests();
    console.log(`✅ CharStore Test Gate: ${res.passed}/${res.passed} checks passed in ${res.elapsedMs}ms.`);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}
