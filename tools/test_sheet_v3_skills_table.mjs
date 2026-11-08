// Sheet V3 Skills table (step 3): derive-skills.js against the classic table and 3.5e RAW.
// Run: node tools/test_sheet_v3_skills_table.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { deriveSkills, filterSkillRows, totalSkillPoints } from '../sheet/core/derive-skills.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const sandbox = { window: {}, console: quiet, Math, Number, String, Array, Object, Set, Map, JSON, RegExp, Date };
vm.createContext(sandbox);
vm.runInContext(`${read('sheet/engine/srd_compendium.js')}\n${read('sheet/engine/rule_engine.js')}\nwindow.RuleEngine = RuleEngine;`, sandbox);
const RE = sandbox.window.RuleEngine;
const REAL = JSON.parse(read('tools/fixtures/real/character_2026-11-08.json'));

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}
const plain = v => JSON.parse(JSON.stringify(v));

/** Same path as the page: engine recalculation on a clone, then derive. */
function derive(character) {
  const clone = structuredClone(character);
  RE.recalculateCharacter(clone, clone.customDb || []);
  const engine = {
    abilityMod: s => RE.getAbilityMod(s),
    skillBonus: (k, n, st) => plain(RE.evaluateSkillBonus(clone, k, n, st)),
    classDef: n => RE.getClassDef(n)
  };
  return deriveSkills(clone, { groups: plain(RE.getConsolidatedSkillGroups(clone)), engine });
}
const byName = (d, name) => d.rows.find(r => r.name === name);

// Classic table for the real character, captured in the browser on 2026-11-08 (filter "All"):
// [name, stat, classic total, ranks, mod, buff]. ACP rows are checked separately below.
const CLASSIC = [
  ['Appraise', 'int', 2, 0, 2, 0], ['Autohypnosis', 'wis', -1, 0, -1, 0], ['Bluff', 'cha', 4, 0, 4, 0],
  ['Concentration', 'con', 3, 0, 3, 0], ['Craft (Alchemy)', 'int', 2, 0, 2, 0], ['Disguise', 'cha', 4, 0, 4, 0],
  ['Handle Animal', 'cha', 4, 0, 4, 0], ['Heal', 'wis', -1, 0, -1, 0], ['Intimidate', 'cha', 4, 0, 4, 0],
  ['Knowledge (Arcana)', 'int', 2, 0, 2, 0], ['Knowledge (The Planes)', 'int', 2, 0, 2, 0],
  ['Linguistics', 'int', 2, 0, 2, 0], ['Martial Lore', 'int', 2, 0, 2, 0], ['Perception', 'wis', -1, 0, -1, 0],
  ['Perform', 'cha', 4, 0, 4, 0], ['Persuasion & Social', 'cha', 4, 0, 4, 0], ['Profession', 'wis', -1, 0, -1, 0],
  ['Ride', 'dex', 7, 1, 2, 4], ['Sense Motive', 'wis', -1, 0, -1, 0], ['Spellcraft', 'int', 2, 0, 2, 0],
  ['Survival', 'wis', -1, 0, -1, 0], ['Use Magic Device', 'cha', 4, 0, 4, 0], ['Use Rope', 'dex', 2, 0, 2, 0]
];

const D = derive(REAL);

test('real: 37 rows, 7 consolidated groups, same as the classic table', () => {
  assert.equal(D.rows.length, 37);
  assert.deepEqual([D.merged, D.groupCount], [true, 7]);
  assert.equal(D.rows.filter(r => r.isConsolidated).length, 7);
});
test('real: skill points 1 / 128, remaining 127; max ranks 20 / 10', () => {
  assert.deepEqual(D.points, { total: 128, spent: 1, remaining: 127 });
  assert.deepEqual([D.maxClassRank, D.maxCrossRank], [20, 10]);
});
test('real: rows sorted by name like the classic table', () => {
  const names = D.rows.map(r => r.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
});
for (const [name, stat, total, ranks, mod, buff] of CLASSIC) {
  test(`real parity: ${name}`, () => {
    const r = byName(D, name);
    assert.ok(r, 'row exists');
    assert.deepEqual([r.stat, r.total, r.ranks, r.statMod, r.bonus], [stat, total, ranks, mod, buff]);
  });
}
test('real: the Ride bonus comes from the DM boon feat', () => {
  assert.equal(byName(D, 'Ride').bonusBreakdown.length, 1);
});

// ================================================================ RAW corrections
test('RAW: the shield ACP (-2) lowers ACP skills instead of raising them', () => {
  // Classic showed Acrobatics +4, Athletics +5, Stealth +4, Thievery +4 with an ACP column of "0".
  for (const [name, classic] of [['Acrobatics', 4], ['Athletics', 5], ['Stealth', 4], ['Thievery', 4]]) {
    const r = byName(D, name);
    assert.equal(r.acpPenalty, -2, name);
    assert.equal(r.total, classic - 4, `${name}: classic ${classic} counted +2 instead of -2`);
  }
});
test('RAW: skills without ACP ignore it', () => {
  assert.equal(byName(D, 'Bluff').acpPenalty, 0);
});
test('RAW: half ranks do not count on the check', () => {
  const c = structuredClone(REAL);
  c.skills.find(s => s.key === 'heal').ranks = 2.5;
  const r = byName(derive(c), 'Heal');
  assert.deepEqual([r.ranks, r.total], [2.5, 1], 'shows 2.5 ranks, adds 2');
});

// ================================================================ classic rules kept
test('consolidated off: every stored skill is its own row', () => {
  const c = structuredClone(REAL);
  c.settings.mergeSkills = false;
  const d = derive(c);
  assert.deepEqual([d.merged, d.groupCount, d.rows.length], [false, 0, REAL.skills.length]);
});
test('groups: ranks and misc come from the highest component, class from any', () => {
  const c = structuredClone(REAL);
  for (const s of c.skills) {
    if (s.key === 'hide') Object.assign(s, { ranks: 3, misc: 1, isClass: false });
    if (s.key === 'move_silently') Object.assign(s, { ranks: 5, misc: 0, isClass: true });
  }
  const r = byName(derive(c), 'Stealth');
  assert.deepEqual([r.ranks, r.misc, r.isClass], [5, 1, true]);
});
test('spent points: class 1 per rank, cross-class 2', () => {
  const c = structuredClone(REAL);
  c.skills.find(s => s.key === 'heal').ranks = 3; // cross-class
  assert.equal(derive(c).points.spent, 1 + 6);
});
test('over the max rank is flagged', () => {
  const c = structuredClone(REAL);
  c.skills.find(s => s.key === 'heal').ranks = 11; // cross-class max 10
  assert.equal(byName(derive(c), 'Heal').overRank, true);
});
test('total points fall back to the class estimate without progression points', () => {
  const engine = { abilityMod: s => Math.floor((s - 10) / 2), skillBonus: () => ({ total: 0, breakdown: [] }), classDef: n => (n === 'Rogue' ? { skills: 8 } : null) };
  // Human Rogue 2, INT 14: (8+2+1)*4 + (8+2+1) = 55
  assert.equal(totalSkillPoints({ race: 'Human', classes: 'Rogue 2', abilities: { int: 14 } }, engine), 55);
});
test('derive does not mutate the character', () => {
  const c = structuredClone(REAL);
  const engine = { abilityMod: () => 0, skillBonus: () => ({ total: 0, breakdown: [] }) };
  deriveSkills(c, { groups: plain(RE.getConsolidatedSkillGroups(c)), engine });
  assert.deepEqual(c, REAL);
});

// ================================================================ filters
const view = (o = {}) => ({ filter: 'all', stat: 'all', search: '', ...o });
test('filter: class skills only (classic default)', () => {
  assert.ok(filterSkillRows(D.rows, view({ filter: 'class' })).every(r => r.isClass));
  assert.equal(filterSkillRows(D.rows, view({ filter: 'class' })).length, D.rows.filter(r => r.isClass).length);
});
test('filter: trained, stat and search', () => {
  assert.deepEqual(filterSkillRows(D.rows, view({ filter: 'trained' })).map(r => r.name), ['Ride']);
  assert.ok(filterSkillRows(D.rows, view({ stat: 'str' })).every(r => r.stat === 'str'));
  assert.deepEqual(filterSkillRows(D.rows, view({ search: 'spot' })).map(r => r.name), ['Perception'], 'search reaches group components');
});

console.log(`Sheet V3 skills table tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
