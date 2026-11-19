#!/usr/bin/env node
'use strict';

/**
 * Deterministic unit + corpus smoke test suite for tools/lib/v3_block_generator.js (0 tokens).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RuleEngine = require(path.join(ROOT, 'rule_engine.js'));
const gen = require(path.join(__dirname, 'lib', 'v3_block_generator.js'));

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    console.error(`  FAIL  ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('=== tools/test_v3_block_generator.js ===');

const probes = gen.makeProbes();

test('1. Save bonus with situational qualifier wraps in closed-vocab situational when', () => {
  const entry = {
    id: 'feat-test-poison-ward',
    type: 'Feat',
    name: 'Poison Ward',
    schemaVersion: 3,
    benefit: 'You gain a +4 racial bonus on Fortitude saves against poison.',
    effects: []
  };
  const res = gen.generateBlocksForEntry(RuleEngine, entry, { probes });
  assert.strictEqual(res.accepted.length, 1);
  const blk = res.accepted[0].block;
  assert.strictEqual(blk.type, 'when');
  assert.strictEqual(blk.branches[0].condKind, 'situational');
  assert.strictEqual(blk.branches[0].condText, 'vs. poison');
  assert.deepStrictEqual(blk.branches[0].effects[0], {
    type: 'stat', targets: ['save.fort'], mode: 'flat', value: 4, btype: 'Racial'
  });
});

test('2. Tactical qualifier (charging / flanking / vs. evil) maps to closed-vocab state atom', () => {
  const entry = {
    id: 'feat-test-charge-strike',
    type: 'Feat',
    name: 'Charge Strike',
    schemaVersion: 3,
    benefit: 'You gain a +2 morale bonus on attack rolls when charging and a +2 sacred bonus to AC against evil creatures.',
    effects: []
  };
  const res = gen.generateBlocksForEntry(RuleEngine, entry, { probes });
  assert.strictEqual(res.accepted.length, 2);
  assert.strictEqual(res.accepted[0].block.branches[0].condKind, 'state');
  assert.strictEqual(res.accepted[0].block.branches[0].condText, 'charging');
  assert.strictEqual(res.accepted[1].block.branches[0].condKind, 'state');
  assert.strictEqual(res.accepted[1].block.branches[0].condText, 'alignment:evil');
});

test('3. Multi-skill flat bonus emits single stat block with multiple skill targets', () => {
  const entry = {
    id: 'feat-test-keen-senses',
    type: 'Feat',
    name: 'Keen Senses',
    schemaVersion: 3,
    benefit: 'You gain a +2 competence bonus on Listen, Search, and Spot checks.',
    effects: []
  };
  const res = gen.generateBlocksForEntry(RuleEngine, entry, { probes });
  assert.strictEqual(res.accepted.length, 1);
  assert.deepStrictEqual(res.accepted[0].block, {
    type: 'stat',
    targets: ['skill.listen', 'skill.search', 'skill.spot'],
    mode: 'flat',
    value: 2,
    btype: 'Competence'
  });
});

test('4. Defenses & Senses (DR, SR, Energy Resistance, Immunity, Darkvision 60 ft.)', () => {
  const entry = {
    id: 'mi-test-celestial-mantle',
    type: 'MagicItem',
    name: 'Celestial Mantle',
    schemaVersion: 3,
    text: 'Grants darkvision 60 feet, damage reduction 10/magic, spell resistance 25, resistance to acid 10, and immunity to disease.',
    effects: []
  };
  const res = gen.generateBlocksForEntry(RuleEngine, entry, { probes });
  const families = res.accepted.map((a) => a.claim.family).sort();
  assert.deepStrictEqual(families, ['dr', 'immunity', 'resist', 'sense', 'sr']);
});

test('5. False-positive guard rejects negated/concealing senses ("hide from blindsense/tremorsense")', () => {
  const entry = {
    id: 'spl-test-hide-undead',
    type: 'Spell',
    name: 'Hide from Undead',
    schemaVersion: 3,
    text: 'Subjects are undetectable and hidden from blindsense, blindsight, and tremorsense.',
    effects: []
  };
  const res = gen.generateBlocksForEntry(RuleEngine, entry, { probes });
  assert.strictEqual(res.accepted.length, 0);
  assert.ok(res.rejected.length >= 1);
  assert.ok(res.rejected.every((r) => r.reason.startsWith('guard:')));
});

test('6. False-positive guard rejects ambiguous multi-tier perDay counts ("once per day ... three times per day")', () => {
  const entry = {
    id: 'cab-test-wild-shape',
    type: 'ClassAbility',
    name: 'Wild Shape',
    schemaVersion: 3,
    text: 'At 5th level, a druid can use wild shape once per day, twice per day at 6th level, and three times per day at 7th level.',
    effects: []
  };
  const res = gen.generateBlocksForEntry(RuleEngine, entry, { probes });
  assert.strictEqual(res.accepted.length, 0);
  assert.ok(res.rejected.some((r) => r.reason === 'guard:perDay-multi-tier-ambiguous'));
});

test('7. Single unambiguous perDay count emits canonical resource block', () => {
  const entry = {
    id: 'mi-test-boots-leap',
    type: 'MagicItem',
    name: 'Boots of Leaping',
    schemaVersion: 3,
    text: 'You can activate these boots three times per day as a swift action to leap 30 feet.',
    effects: []
  };
  const res = gen.generateBlocksForEntry(RuleEngine, entry, { probes });
  assert.strictEqual(res.accepted.length, 1);
  assert.strictEqual(res.accepted[0].block.type, 'resource');
  assert.strictEqual(res.accepted[0].block.max, 3);
  assert.strictEqual(res.accepted[0].block.reset, 'perDay');
});

test('8. Pre-write validator rejects unrecognized when condition (silent-failure gate)', () => {
  const entry = { id: 'feat-test-bad-cond', type: 'Feat', name: 'Bad Cond', schemaVersion: 3, effects: [] };
  const badBlock = {
    type: 'when',
    flow: 'while',
    branches: [{ condKind: 'state', condText: 'nonexistentRandomConditionXYZ', effects: [{ type: 'stat', targets: ['save.fort'], mode: 'flat', value: 2, btype: 'Untyped' }] }]
  };
  const err = gen.checkSilentFailureConditions(RuleEngine, badBlock);
  assert.ok(err && err.startsWith('unrecognized-condition:'), 'Expected silent-failure rejection, got: ' + err);
});

test('9. Pre-write validator rejects dead block (unknown target produces 0 engine atoms)', () => {
  const entry = { id: 'feat-test-dead', type: 'Feat', name: 'Dead Block', schemaVersion: 3, effects: [] };
  const deadBlock = { type: 'effect', effectKind: 'nonexistentEffectKindXYZ', value: 1 };
  assert.strictEqual(gen.isDeadBlock(RuleEngine, entry, deadBlock, probes), true);
});

test('10. Live corpus dry-run smoke on srd_feats.json: 0 silent-failure errors, 0 dead blocks', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'database', 'srd_feats.json'), 'utf8'));
  const entries = Array.isArray(raw) ? raw : raw.entries;
  let acceptedCount = 0;
  for (const e of entries) {
    const res = gen.generateBlocksForEntry(RuleEngine, e, { families: ['save', 'skill'], probes });
    for (const a of res.accepted) {
      acceptedCount++;
      assert.strictEqual(gen.checkSilentFailureConditions(RuleEngine, a.block), null);
      assert.strictEqual(gen.isDeadBlock(RuleEngine, e, a.block, probes), false);
    }
  }
  console.log(`    (smoke: ${entries.length} feats scanned, ${acceptedCount} gate-verified save/skill blocks generated)`);
  assert.ok(acceptedCount >= 1, 'Expected at least 1 accepted save/skill block from srd_feats.json');
});

console.log(`\nResult: ${passed} passed.`);
if (process.exitCode) process.exit(process.exitCode);
