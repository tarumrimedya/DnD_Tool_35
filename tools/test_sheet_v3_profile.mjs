// Sheet V3 Character Profile card: values follow the classic char_hud.js renderCharacterProfile.
// Run: node tools/test_sheet_v3_profile.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { profileModel, characterEmoji, ProfileCard } from '../sheet/views/character/profile.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/fixtures/real/character_2026-11-08.json'), 'utf8'));

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}

// ================================================================ real character
test('real: identity values', () => {
  const m = profileModel(REAL);
  assert.deepEqual(
    [m.name, m.race, m.classes, m.hitDie, m.alignment, m.deity, m.size, m.genderAge, m.heightWeight],
    ['Magnus Disciple of Khazmil', 'Human', 'Warblade 5 / Rogue (Adventurer Variant) 2 / Bloodstorm Blade 10', '-', 'Lawful Evil', 'Khazmil', 'Medium', 'Male, -', '-, -']
  );
});
test('real: level badge counts active progression rows', () => {
  assert.deepEqual(profileModel(REAL).levelBadge, { text: 'Level 17', tone: 'pc' });
});
test('real: no templates, no template badge or summary', () => {
  const m = profileModel(REAL);
  assert.deepEqual([m.templates, m.templateBadge, m.totalLa, m.ecl, m.pills], [[], null, 0, 17, []]);
});
test('real: portrait settings are kept', () => {
  assert.deepEqual(profileModel(REAL).portrait, { url: REAL.portrait, position: '36% 24%', fit: 'cover' });
});
test('real: the model does not mutate the character', () => {
  const c = structuredClone(REAL);
  profileModel({ ...c, size: 'Medium (Orta)', gender: 'Erkek' });
  assert.deepEqual(c, REAL);
});

// ================================================================ classic rules
test('size strips the legacy "(Orta)" suffix', () => {
  assert.equal(profileModel({ size: 'Medium (Orta)' }).size, 'Medium');
  assert.equal(profileModel({}).size, 'Medium');
});
test('legacy Turkish gender displays in English', () => {
  assert.equal(profileModel({ gender: 'Erkek', age: 24 }).genderAge, 'Male, Age 24');
  assert.equal(profileModel({ gender: 'Kadın' }).genderAge, 'Female, -');
});
test('defaults match the classic card', () => {
  const m = profileModel({});
  assert.deepEqual([m.name, m.race, m.raceLabel, m.classes, m.levelBadge.text], ['Unnamed Character', 'Human', 'Unspecified', 'Unspecified', 'Level 1']);
});
test('level falls back to character.level when there are no active rows', () => {
  assert.equal(profileModel({ level: 6, levelProgression: [{ active: false }] }).levelBadge.text, 'Level 6');
});
test('NPC badges: CR wins, else NPC level with ECL', () => {
  assert.deepEqual(profileModel({ isNpc: true, cr: 7, level: 5 }).levelBadge, { text: 'CR 7', tone: 'cr' });
  assert.deepEqual(profileModel({ isNpc: true, level: 5 }, [{ id: 't', name: 'Half-Dragon', levelAdjustment: 3 }]).levelBadge, { text: 'NPC • Lvl 5 (ECL 8)', tone: 'npc' });
});
test('templates: badge, LA and ECL (Half-Dragon LA +3 on level 5)', () => {
  const m = profileModel({ level: 5 }, [{ id: 'tmpl-half-dragon', name: 'Half-Dragon', levelAdjustment: 3 }]);
  assert.equal(m.templateBadge, '🧬 Half-Dragon (LA +3)');
  assert.equal(m.levelBadge.text, 'Level 5 • ECL 8');
});
test('templates: character.levelAdjustment overrides the template sum', () => {
  assert.equal(profileModel({ level: 5, levelAdjustment: 2 }, [{ name: 'A', levelAdjustment: 3 }]).ecl, 7);
});
test('templates: summary pills in classic order, immunities capped at 5', () => {
  const m = profileModel({ level: 5, templateSummary: {
    creatureType: 'Dragon', dr: ['5/magic'], sr: 15, fastHealing: 0, turnResistance: 2,
    immunities: ['sleep', 'paralysis', 'fire', 'cold', 'acid', 'poison'], resistances: ['fire 10'],
    damageParts: [{ source: 'Breath Weapon', dice: '6d8', type: 'fire' }]
  } }, [{ name: 'Half-Dragon', levelAdjustment: 3 }]);
  assert.deepEqual(m.pills.map(p => p.text), [
    'Type: Dragon', '🛡️ DR 5/magic', '🔮 SR 15', '☀️ Turn Res +2',
    'Immunities: sleep, paralysis, fire, cold, acid (+1)', 'Resist: fire 10', '🔥 Breath Weapon: 6d8 fire'
  ]);
});
test('templates: summary pills only show while a template is active', () => {
  assert.deepEqual(profileModel({ templateSummary: { creatureType: 'Undead' } }).pills, []);
});

// ================================================================ emoji (cosmetic, classic rules)
test('emoji: classic choices', () => {
  assert.equal(characterEmoji('Human', 'Male', 'Warblade 5 / Rogue 2'), '🥷', 'rogue outranks martial');
  assert.equal(characterEmoji('Elf', 'Female', 'Wizard 3'), '🧝‍♀️');
  assert.equal(characterEmoji('Half-Orc', 'Male', 'Fighter 1'), '👹');
  assert.equal(characterEmoji('Dwarf', 'Male', 'Fighter 1'), '🧔');
  assert.equal(characterEmoji('Human', 'Kadın', 'Fighter 1'), '🤺');
  assert.equal(characterEmoji('', '', ''), '🧙‍♂️');
});

// ================================================================ view safety
test('view: names and portrait URLs are escaped', () => {
  const out = ProfileCard({ name: '<img src=x onerror=alert(1)>', portrait: `x'); background: red; url('y` , portraitPosition: '0;}body{display:none' }, []).value;
  assert.ok(!out.includes('<img src=x'), 'name escaped');
  assert.ok(out.includes('background-position: 50% 20%'), 'unsafe position replaced by the default');
  assert.ok(!/url\('x'\)/.test(out), 'portrait URL cannot close the url() early');
});
test('view: real character renders the six identity cells', () => {
  const out = ProfileCard(REAL, []).value;
  for (const v of ['Lawful Evil', 'Khazmil', 'Medium', 'Male, -', '-, -', 'Level 17']) assert.ok(out.includes(v), v);
});

console.log(`Sheet V3 profile tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
