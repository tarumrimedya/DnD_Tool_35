// Sheet V3 consolidated skill groups in the forked engine (docs/V3_DATA_SCHEMA.md section 11.3).
// Run: node tools/test_sheet_v3_skills.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const sandbox = { window: {}, console, Math, Number, String, Array, Object, Set, Map, JSON, RegExp };
vm.createContext(sandbox);
vm.runInContext(`${read('sheet/engine/srd_compendium.js')}\n${read('sheet/engine/rule_engine.js')}\nwindow.RuleEngine = RuleEngine;`, sandbox);
const RE = sandbox.window.RuleEngine;

const REAL = JSON.parse(read('tools/fixtures/real/character_2026-11-08.json'));
const plain = v => JSON.parse(JSON.stringify(v));

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}

/** Minimal character: the real skill list and house rules, plus the given feats only. */
function makeChar(feats, settings = {}) {
  return {
    level: 10,
    skills: plain(REAL.skills),
    settings: { ...plain(REAL.settings), ...settings },
    feats: feats.map((f, i) => ({ id: `probe_${i}`, name: f.name || `Probe ${i}`, type: 'Feat', modifiers: f.mods }))
  };
}
const mod = (target, value, type) => (type ? { target, value, type } : { target, value });
const evalSkill = (c, key, name) => plain(RE.evaluateSkillBonus(c, key, name, 'str'));

// ================================================================ single source
test('groups: character settings are the source', () => {
  const groups = plain(RE.getConsolidatedSkillGroups(REAL));
  assert.deepEqual(groups.map(g => g.key), REAL.settings.consolidatedSkillGroups.map(g => g.key));
  assert.deepEqual(groups.find(g => g.key === 'diplomacy_merged').components, ['diplomacy', 'gather_information']);
});
test('groups: house rule off returns none', () => {
  assert.deepEqual(plain(RE.getConsolidatedSkillGroups(makeChar([], { mergeSkills: false }))), []);
});
test('groups: missing definition falls back to the single default', () => {
  const c = makeChar([]);
  delete c.settings.consolidatedSkillGroups;
  assert.deepEqual(plain(RE.getConsolidatedSkillGroups(c)), plain(RE.DEFAULT_CONSOLIDATED_SKILL_GROUPS));
});
test('groups: the default differs from this character (Search in Perception, Thievery ACP)', () => {
  const own = REAL.settings.consolidatedSkillGroups.find(g => g.key === 'perception').components;
  const dflt = RE.DEFAULT_CONSOLIDATED_SKILL_GROUPS.find(g => g.key === 'perception').components;
  assert.deepEqual([own.includes('search'), dflt.includes('search')], [true, false]);
  const c = makeChar([{ mods: [mod('skill.search', 2, 'competence')] }]);
  assert.equal(evalSkill(c, 'perception', 'Perception').total, 2);
  delete c.settings.consolidatedSkillGroups;
  assert.equal(evalSkill(c, 'perception', 'Perception').total, 0);
});
test('groups: engine default equals the classic sheet default (char_progression.js)', () => {
  const src = read('char_progression.js');
  const m = src.match(/const DEFAULT_CONSOLIDATED_SKILL_GROUPS = (\[[\s\S]*?\n {4}\]);/);
  assert.ok(m, 'DEFAULT_CONSOLIDATED_SKILL_GROUPS literal found in char_progression.js');
  const classic = vm.runInNewContext(`(${m[1]})`);
  assert.deepEqual(plain(RE.DEFAULT_CONSOLIDATED_SKILL_GROUPS), plain(classic));
});

// ================================================================ component bonus -> group total
test('component: racial Climb +4 enters Athletics with its component in the breakdown', () => {
  const r = evalSkill(makeChar([{ name: 'Racial Probe', mods: [mod('skill.climb', 4, 'racial')] }]), 'athletics', 'Athletics');
  assert.equal(r.total, 4);
  assert.deepEqual(r.breakdown, ['Racial Probe (Climb): +4 (racial)']);
});
test('stacking: same type takes the highest (Climb +2 competence, Jump +3 competence => +3)', () => {
  const c = makeChar([
    { name: 'A', mods: [mod('skill.climb', 2, 'competence')] },
    { name: 'B', mods: [mod('skill.jump', 3, 'competence')] }
  ]);
  const r = evalSkill(c, 'athletics', 'Athletics');
  assert.equal(r.total, 3);
  assert.deepEqual(r.breakdown, ['B (Jump): +3 (competence)']);
});
test('stacking: different types stack (racial +4 Climb, competence +2 Jump => +6)', () => {
  const c = makeChar([
    { name: 'A', mods: [mod('skill.climb', 4, 'racial')] },
    { name: 'B', mods: [mod('skill.jump', 2, 'competence')] }
  ]);
  assert.equal(evalSkill(c, 'athletics', 'Athletics').total, 6);
});
test('stacking: untyped bonuses from different sources stack', () => {
  const c = makeChar([
    { name: 'A', mods: [mod('skill.climb', 2)] },
    { name: 'B', mods: [mod('skill.swim', 2)] }
  ]);
  assert.equal(evalSkill(c, 'athletics', 'Athletics').total, 4);
});
test('stacking: one source reaching two components counts once', () => {
  const c = makeChar([{ name: 'Athletic', mods: [mod('skill.climb', 2), mod('skill.swim', 2)] }]);
  const r = evalSkill(c, 'athletics', 'Athletics');
  assert.equal(r.total, 2);
  assert.equal(r.breakdown.length, 1);
});
test('stacking: one source on group and component counts once', () => {
  const c = makeChar([{ name: 'Keen Senses', mods: [mod('skill.perception', 2), mod('skill.spot', 2)] }]);
  assert.equal(evalSkill(c, 'perception', 'Perception').total, 2);
});
test('stacking: penalties from different sources add up', () => {
  const c = makeChar([
    { name: 'A', mods: [mod('skill.climb', -2, 'penalty')] },
    { name: 'B', mods: [mod('skill.swim', -1, 'penalty')] }
  ]);
  assert.equal(evalSkill(c, 'athletics', 'Athletics').total, -3);
});

// ================================================================ exact matching (no substring leaks)
test('exact: Sense Motive bonus does not reach Persuasion & Social', () => {
  const c = makeChar([{ mods: [mod('skill.sense_motive', 5, 'insight')] }]);
  assert.equal(evalSkill(c, 'diplomacy_merged', 'Persuasion & Social').total, 0);
  assert.equal(evalSkill(c, 'sense_motive', 'Sense Motive').total, 5);
});
test('exact: Knowledge (Nature) bonus does not reach Knowledge (Arcana)', () => {
  const c = makeChar([{ mods: [mod('skill.knowledge_nature', 3, 'competence')] }]);
  assert.equal(evalSkill(c, 'k_arcana', 'Knowledge (Arcana)').total, 0);
  assert.equal(evalSkill(c, 'k_nature', 'Knowledge (Nature)').total, 3);
});
test('family: skill.knowledge reaches every Knowledge skill', () => {
  const c = makeChar([{ mods: [mod('skill.knowledge', 2, 'insight')] }]);
  assert.equal(evalSkill(c, 'k_arcana', 'Knowledge (Arcana)').total, 2);
  assert.equal(evalSkill(c, 'k_planes', 'Knowledge (The Planes)').total, 2);
  assert.equal(evalSkill(c, 'spellcraft', 'Spellcraft').total, 0);
});
test('family: skill.craft reaches Craft sub-skills; a named craft only its own', () => {
  const c = makeChar([
    { name: 'A', mods: [mod('skill.craft', 1, 'insight')] },
    { name: 'B', mods: [mod('skill.craft_armorsmithing', 2, 'competence')] }
  ]);
  assert.equal(evalSkill(c, 'craft_armor', 'Craft (Armorsmithing)').total, 3);
  assert.equal(evalSkill(c, 'craft_weapon', 'Craft (Weaponsmithing)').total, 1);
});
test('family: an undivided Perform skill accepts instrument targets', () => {
  const c = makeChar([{ mods: [mod('skill.perform_string_instruments', 2, 'competence')] }]);
  assert.equal(evalSkill(c, 'perform', 'Perform').total, 2);
});
test('identity: display name matches when the key differs (umd = Use Magic Device)', () => {
  const c = makeChar([{ mods: [mod('skill.use_magic_device', 2, 'competence')] }]);
  assert.equal(evalSkill(c, 'umd', 'Use Magic Device').total, 2);
});
test('identity: camelCase target matches (senseMotive)', () => {
  const c = makeChar([{ mods: [mod('skill.senseMotive', 2, 'competence')] }]);
  assert.equal(evalSkill(c, 'sense_motive', 'Sense Motive').total, 2);
});
test('legacy: Turkish target name still applies (skill.gizlenme -> Hide -> Stealth)', () => {
  const c = makeChar([{ mods: [mod('skill.gizlenme', 2, 'competence')] }]);
  assert.equal(evalSkill(c, 'stealth', 'Stealth').total, 2);
});
test('group target reaches a component check with the group in the breakdown', () => {
  const c = makeChar([{ name: 'Alertness Probe', mods: [mod('skill.perception', 2, 'insight')] }]);
  assert.deepEqual(evalSkill(c, 'spot', 'Spot').breakdown, ['Alertness Probe (Perception): +2 (insight)']);
});
test('skill.all reaches groups and plain skills', () => {
  const c = makeChar([{ mods: [mod('skill.all', 1, 'luck')] }]);
  assert.equal(evalSkill(c, 'athletics', 'Athletics').total, 1);
  assert.equal(evalSkill(c, 'ride', 'Ride').total, 1);
});
test('house rule off: Climb bonus stays on Climb', () => {
  const c = makeChar([{ mods: [mod('skill.climb', 4, 'racial')] }], { mergeSkills: false });
  assert.equal(evalSkill(c, 'athletics', 'Athletics').total, 0);
  assert.equal(evalSkill(c, 'climb', 'Climb').total, 4);
});
test('custom groups: a character group with Sense Motive includes it', () => {
  const groups = plain(REAL.settings.consolidatedSkillGroups);
  groups.find(g => g.key === 'diplomacy_merged').components.push('sense_motive');
  const c = makeChar([{ mods: [mod('skill.sense_motive', 5, 'insight')] }], { consolidatedSkillGroups: groups });
  assert.equal(evalSkill(c, 'diplomacy_merged', 'Persuasion & Social').total, 5);
});

// ================================================================ real character
test('real: DM boon Ride +4 unchanged; groups carry no bonus', () => {
  const c = plain(REAL);
  assert.equal(evalSkill(c, 'ride', 'Ride').total, 4);
  REAL.settings.consolidatedSkillGroups.forEach(g => assert.equal(evalSkill(c, g.key, g.name).total, 0, g.key));
});
test('real: evaluation does not mutate the character', () => {
  const c = plain(REAL);
  const before = JSON.stringify(c);
  REAL.settings.consolidatedSkillGroups.forEach(g => RE.evaluateSkillBonus(c, g.key, g.name, g.stat));
  REAL.skills.forEach(s => RE.evaluateSkillBonus(c, s.key, s.name, s.stat));
  assert.equal(JSON.stringify(c), before);
});

console.log(`Sheet V3 skill group tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
