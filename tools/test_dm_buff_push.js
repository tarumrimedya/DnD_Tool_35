#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

// Load rulesets/dnd35.js, rule_engine.js, and campaign_db.js in a clean VM sandbox
const sandbox = { console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Set, Map, Error, parseInt, parseFloat, isNaN, isFinite };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;

vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'rulesets/dnd35.js'), 'utf8'), sandbox, { filename: 'rulesets/dnd35.js' });
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'rule_engine.js'), 'utf8'), sandbox, { filename: 'rule_engine.js' });
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'campaign_db.js'), 'utf8'), sandbox, { filename: 'campaign_db.js' });

const RuleEngine = sandbox.RuleEngine;
const CampaignDb = sandbox.CampaignDb;
assert(RuleEngine && typeof RuleEngine.buildDmEffectPayload === 'function', 'RuleEngine.buildDmEffectPayload must exist');
assert(CampaignDb && typeof CampaignDb.resolveCampaignScope === 'function', 'CampaignDb.resolveCampaignScope must exist');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
}

// 1. All 38 Conditions in database/srd_combat_rules.json
const combatRules = JSON.parse(fs.readFileSync(path.join(ROOT, 'database/srd_combat_rules.json'), 'utf8'));
const condEntries = Array.isArray(combatRules) ? combatRules : (combatRules.entries || []);

test('38 Conditions: 31 mechanical pass buildDmEffectPayload + sanitizeIncomingBuffOffer, 7 narrative return null', () => {
  assert.strictEqual(condEntries.length, 38, `Expected 38 conditions, got ${condEntries.length}`);
  let mechCount = 0;
  let narrativeCount = 0;
  for (const c of condEntries) {
    const offer = RuleEngine.buildDmEffectPayload(c, {
      cl: 1,
      rounds: 5,
      targetCharIds: ['char_pc_1'],
      fromCharId: 'dm:uid-1234',
      fromCharName: 'DM',
      campaignId: 'camp_cloud_1'
    });
    const hasMech = (Array.isArray(c.effects) && c.effects.length > 0) || (c.ruleFlags && Object.keys(c.ruleFlags).length > 0);
    if (!hasMech) {
      assert.strictEqual(offer, null, `Narrative condition ${c.name} should return null`);
      narrativeCount++;
    } else {
      assert(offer && offer.buff, `Mechanical condition ${c.name} should produce an offer`);
      const res = RuleEngine.sanitizeIncomingBuffOffer(offer, { campaignId: 'camp_cloud_1', myCharId: 'char_pc_1' });
      assert.strictEqual(res.ok, true, `Condition ${c.name} failed sanitizer: ${res.reason}`);
      assert.strictEqual(res.offer.buff.source, 'Condition', `Condition ${c.name} must preserve source=Condition`);
      mechCount++;
    }
  }
  assert.strictEqual(mechCount, 31, `Expected 31 mechanical conditions, got ${mechCount}`);
  assert.strictEqual(narrativeCount, 7, `Expected 7 narrative conditions, got ${narrativeCount}`);
});

test('4 Condition ruleFlags (loseDexToAC, effectiveDexZero, halfSpeed, actionRestriction) survive sanitization', () => {
  const byName = (nm) => condEntries.find(c => String(c.name || '').toLowerCase() === nm.toLowerCase());
  const checks = [
    ['Blinded', 'loseDexToAC'],
    ['Paralyzed', 'effectiveDexZero'],
    ['Entangled', 'halfSpeed'],
    ['Stunned', 'actionRestriction']
  ];
  for (const [nm, flag] of checks) {
    const c = byName(nm);
    assert(c, `Condition ${nm} must exist`);
    const offer = RuleEngine.buildDmEffectPayload(c, { targetCharIds: ['pc1'], fromCharId: 'dm:local', campaignId: 'hub:c1' });
    assert(offer, `${nm} must build offer`);
    const res = RuleEngine.sanitizeIncomingBuffOffer(offer, { campaignId: 'hub:c1', myCharId: 'pc1' });
    assert.strictEqual(res.ok, true, `${nm} sanitize failed: ${res.reason}`);
    assert(res.offer.buff.ruleFlags && res.offer.buff.ruleFlags[flag], `${nm} lost ruleFlag ${flag}`);
  }
});

// 2. Real SRD Spells (Buff + Energy Choice + Debuff)
const spellsRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'database/srd_spells.json'), 'utf8'));
const spellEntries = Array.isArray(spellsRaw) ? spellsRaw : (spellsRaw.entries || []);
const findSpell = (nm) => spellEntries.find(s => String(s.name || '').toLowerCase() === nm.toLowerCase());

test('SRD Spells (Haste, Bless, Resist Energy, Slow, Bane) build and sanitize cleanly', () => {
  for (const [nm, extra] of [
    ['Haste', { cl: 10, rounds: 10 }],
    ['Bless', { cl: 5 }],
    ['Resist Energy', { cl: 7, chosenEnergy: 'Fire' }],
    ['Slow', { cl: 9, rounds: 9 }],
    ['Bane', { cl: 3 }]
  ]) {
    const sp = findSpell(nm);
    assert(sp, `Spell ${nm} must exist in srd_spells.json`);
    const offer = RuleEngine.buildDmEffectPayload(sp, Object.assign({
      targetCharIds: ['pc1', 'pc2'],
      fromCharId: 'dm:uid-99',
      fromCharName: 'DM (Wizard)',
      campaignId: 'cloud_99'
    }, extra));
    assert(offer && offer.buff, `Spell ${nm} should produce offer`);
    const res = RuleEngine.sanitizeIncomingBuffOffer(offer, { campaignId: 'cloud_99', myCharId: 'pc2' });
    assert.strictEqual(res.ok, true, `Spell ${nm} failed sanitizer: ${res.reason}`);
  }
});

test('Campaign Pack custom V3 buff + >12 targets collapse to ALL', () => {
  const customBuff = {
    id: 'pack_dragon_aura',
    name: 'Dragon Aura',
    blueprint: 'buff',
    schemaVersion: 3,
    effects: [{ type: 'stat', targets: ['save.all', 'atk.all'], mode: 'flat', value: -2, btype: 'Morale' }]
  };
  const thirteenTargets = Array.from({ length: 13 }, (_, i) => `pc_${i + 1}`);
  const offer = RuleEngine.buildDmEffectPayload(customBuff, {
    cl: 12,
    rounds: 8,
    grantedTempHp: 15,
    targetCharIds: thirteenTargets,
    fromCharId: 'dm:local',
    campaignId: 'hub:root1'
  });
  assert(offer, 'Custom buff should build offer');
  assert.deepStrictEqual(Array.from(offer.targetCharIds), ['ALL'], '>12 targets must collapse to ["ALL"]');
  assert.strictEqual(offer.buff.rounds, 8);
  assert.strictEqual(offer.buff.grantedTempHp, 15);
  const res = RuleEngine.sanitizeIncomingBuffOffer(offer, { campaignId: 'hub:root1', myCharId: 'pc_9' });
  assert.strictEqual(res.ok, true, `Custom buff sanitize failed: ${res.reason}`);
});

test('Shared CampaignDb.resolveCampaignScope matches cloud, sub-campaign, local root, and standalone', () => {
  const camps = [
    { id: 'c_cloud_root', cloudCampaignId: 'uuid-cloud-1', parentId: null },
    { id: 'c_cloud_sub', cloudCampaignId: null, parentId: 'c_cloud_root' },
    { id: 'c_local_root', cloudCampaignId: null, parentId: null },
    { id: 'c_local_sub', cloudCampaignId: null, parentId: 'c_local_root' }
  ];
  assert.strictEqual(CampaignDb.resolveCampaignScope('c_cloud_sub', null, camps).scopeId, 'uuid-cloud-1');
  assert.strictEqual(CampaignDb.resolveCampaignScope('c_local_sub', null, camps).scopeId, 'hub:c_local_root');
  assert.strictEqual(CampaignDb.resolveCampaignScope('c_local_root', null, camps).scopeId, 'hub:c_local_root');
  assert.strictEqual(CampaignDb.resolveCampaignScope(null, null, camps).scopeId, 'local');
  assert.strictEqual(CampaignDb.resolveCampaignScope(null, 'uuid-fallback', camps).scopeId, 'uuid-fallback');
});

console.log(`PASS: ${passed}/${passed} Sprint E2.3/E2.4 DM Buff Push tests passed.`);
