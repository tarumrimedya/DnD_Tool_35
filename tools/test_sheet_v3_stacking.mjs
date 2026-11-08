// Sheet V3 bonus stacking (3.5e RAW) in the forked engine: stackBonuses and every path that uses it.
// Run: node tools/test_sheet_v3_stacking.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const sandbox = { window: {}, console: quiet, Math, Number, String, Array, Object, Set, Map, JSON, RegExp };
vm.createContext(sandbox);
vm.runInContext(`${read('sheet/engine/srd_compendium.js')}\n${read('sheet/engine/rule_engine.js')}\nwindow.RuleEngine = RuleEngine;`, sandbox);
const RE = sandbox.window.RuleEngine;

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}
const total = list => RE.stackBonuses(list).total;
const b = (val, type, source) => ({ val, type, source });

// ================================================================ named types: highest only
for (const type of ['enhancement', 'luck', 'insight', 'morale', 'competence', 'sacred', 'profane', 'deflection', 'resistance', 'armor', 'shield', 'natural_armor', 'size', 'alchemical', 'inherent', 'racial']) {
  test(`named type ${type}: highest only`, () => {
    assert.equal(total([b(1, type, 'A'), b(3, type, 'B'), b(2, type, 'C')]), 3);
  });
}
test('type names are case-insensitive (Luck = luck = " LUCK ")', () => {
  assert.equal(total([b(1, 'Luck', 'A'), b(2, 'luck', 'B'), b(2, ' LUCK ', 'C')]), 2);
});
test('Natural Armor, natural_armor and natural are one type', () => {
  assert.equal(total([b(2, 'Natural Armor', 'A'), b(3, 'natural_armor', 'B'), b(1, 'natural', 'C')]), 3);
});
test('RacialTrait is racial', () => {
  assert.equal(total([b(2, 'RacialTrait', 'A'), b(4, 'racial', 'B')]), 4);
});
test('different named types stack (luck + competence + enhancement)', () => {
  assert.equal(total([b(1, 'luck', 'A'), b(2, 'competence', 'B'), b(3, 'enhancement', 'C')]), 6);
});
test('luck stacks with untyped, not with luck', () => {
  assert.equal(total([b(1, 'luck', 'A'), b(2, 'luck', 'B'), b(1, undefined, 'C')]), 3);
});

// ================================================================ self-stacking types
test('dodge stacks with dodge', () => {
  assert.equal(total([b(1, 'dodge', 'Dodge'), b(1, 'dodge', 'Haste'), b(4, 'dodge', 'Expertise')]), 6);
});
test('circumstance from different sources stacks', () => {
  assert.equal(total([b(2, 'circumstance', 'Flanking'), b(1, 'circumstance', 'Higher Ground')]), 3);
});
test('circumstance from the same source counts once', () => {
  assert.equal(total([b(2, 'circumstance', 'Masterwork Tool'), b(2, 'circumstance', 'Masterwork Tool')]), 2);
});
test('untyped from different sources stacks', () => {
  assert.equal(total([b(1, undefined, 'A'), b(1, 'untyped', 'B'), b(2, 'Untyped', 'C')]), 4);
});
test('untyped from the same source counts once (strongest kept)', () => {
  assert.equal(total([b(1, 'untyped', 'Feat X'), b(3, 'untyped', 'Feat X')]), 3);
});
test('entries without a source are distinct sources', () => {
  assert.equal(total([b(1, 'untyped'), b(1, 'untyped')]), 2);
});
test('synergy and template behave like untyped', () => {
  assert.equal(total([b(2, 'synergy', 'Tumble'), b(2, 'synergy', 'Jump'), b(2, 'synergy', 'Jump')]), 4);
  assert.equal(total([b(2, 'template', 'Half-Dragon'), b(3, 'template', 'Lich')]), 5);
});

// ================================================================ penalties
test('penalties from different sources stack, whatever their type', () => {
  assert.equal(total([b(-2, 'penalty', 'A'), b(-1, 'competence', 'B'), b(-4, 'untyped', 'C')]), -7);
});
test('penalties from the same source count once (worst kept)', () => {
  assert.equal(total([b(-2, 'penalty', 'Shaken'), b(-1, 'penalty', 'Shaken')]), -2);
});
test('a penalty does not cancel a same-type bonus slot', () => {
  assert.equal(total([b(2, 'morale', 'Bless'), b(-1, 'morale', 'Crushing Despair')]), 1);
});

// ================================================================ resolver output
test('applied lists the kept entries only', () => {
  const r = RE.stackBonuses([b(1, 'luck', 'A'), b(2, 'luck', 'B'), b(1, 'dodge', 'C')]);
  assert.deepEqual(JSON.parse(JSON.stringify(r.applied.map(a => [a.source, a.val, a.type]))).sort(),[['B', 2, 'luck'], ['C', 1, 'dodge']]);
});
test('zero values and null entries are ignored; input is not mutated', () => {
  const list = [b(0, 'luck', 'A'), null, b(2, 'Luck', 'B')];
  const before = JSON.stringify(list);
  assert.equal(total(list), 2);
  assert.equal(JSON.stringify(list), before);
});
test('resolveBonusStacking delegates to stackBonuses', () => {
  assert.equal(RE.resolveBonusStacking([b(2, 'racial', 'A'), b(4, 'racial', 'B'), b(1, 'untyped', 'C'), b(1, 'untyped', 'C')]), 5);
});

// ================================================================ Lego pipeline (was case-sensitive)
const legoChar = feats => ({
  schemaVersion: 2, level: 5, name: 'Probe',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  baseSaves: { fort: 0, ref: 0, will: 0 },
  skills: [], settings: {}, feats, specialAbilities: [], gearPool: [], buffs: []
});
const feat = (id, mods) => ({ id, name: id, type: 'Feat', kind: 'feat', active: true, modifiers: mods });
const lego = feats => RE.evaluateLegoCharacter(legoChar(feats), feats);

test('lego: lowercase luck on Will takes the highest', () => {
  const feats = [feat('Luck A', [{ target: 'save.will', value: 1, type: 'luck' }]), feat('Luck B', [{ target: 'save.will', value: 2, type: 'luck' }])];
  assert.equal(lego(feats).saves.will, 2);
});
test('lego: lowercase enhancement on STR takes the highest', () => {
  const feats = [feat('Belt A', [{ target: 'ability.str', value: 2, type: 'enhancement' }]), feat('Belt B', [{ target: 'ability.str', value: 4, type: 'enhancement' }])];
  assert.equal(lego(feats).abilities.str.score, 14);
});
test('lego: different types still stack (luck + competence on Will)', () => {
  const feats = [feat('Luck A', [{ target: 'save.will', value: 1, type: 'luck' }]), feat('Comp B', [{ target: 'save.will', value: 2, type: 'competence' }])];
  assert.equal(lego(feats).saves.will, 3);
});
test('lego: the same source twice untyped counts once', () => {
  const feats = [feat('Twice', [{ target: 'save.will', value: 1 }, { target: 'save.will', value: 1 }])];
  assert.equal(lego(feats).saves.will, 1);
});
test('lego: save.all luck does not stack with save.will luck', () => {
  const feats = [feat('Stone', [{ target: 'save.all', value: 1, type: 'luck' }]), feat('Charm', [{ target: 'save.will', value: 2, type: 'Luck' }])];
  const ev = lego(feats);
  assert.deepEqual([ev.saves.fort, ev.saves.ref, ev.saves.will], [1, 1, 2]);
});

console.log(`Sheet V3 stacking tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
