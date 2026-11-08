// Sheet V3 Feats & Special Abilities showcase (step 4) against the classic showcase.
// Run: node tools/test_sheet_v3_feats.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { featsModel, isCompanionEligible, FeatsShowcase } from '../sheet/views/character/feats.js';
import { runMigrations } from '../sheet/core/migrations.js';
import { decodeStored } from '../sheet/core/storage-codec.js';
import { createKindContext } from '../sheet/core/entry-kind.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const REAL = readJson('tools/fixtures/real/character_2026-11-08.json');
const ctx = createKindContext(readJson('database/srd_index.json'));
/** The character as the page holds it (decoded, V3 migrations applied). */
const LOADED = runMigrations(decodeStored(REAL).character, { ctx, now: '2026-11-08T12:00:00.000Z' }).character;

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}

// Classic showcase for the real character, captured in the browser on 2026-11-08:
// "30 Feats 9 Abilities", in this order (pill text without the icon).
const CLASSIC_FEATS = [
  'Frail (Flaw)', 'Endurance (Flaw Bonus Feat)', 'Shaky (Flaw)', 'Power Attack (Flaw Bonus Feat)',
  'Improved Sunder (Racial Trait)', 'Improved Bull Rush (Regular Feat)', 'DM Boon: Ride +4 (DM Boon)',
  'DM Boon: HP +20 (DM Boon)', 'Weapon Focus (Longsword) (Regular Feat)', 'Exotic Weapon Proficiency (Jovar) (Regular Feat)',
  'Combat Expertise (Regular Feat)', 'Point Blank Shot (Regular Feat)', 'Improved Trip (Regular Feat)',
  'Knock-Down (Class Bonus Feat)', 'Steadfast Determination (Class Bonus Feat)', 'Combat Reflexes (Regular Feat)',
  'Combat Brute (Class Bonus Feat)', 'Improved Shield Bash (Regular Feat)', 'Shield Specialization (Class Bonus Feat)',
  'Shield Sling (Regular Feat)', 'Agile Shield Fighter (Class Bonus Feat)', 'Cleave (Regular Feat)',
  'DM Boon: Natural Armor AC (+1/4 Lvl) (DM Boon)', 'Dragon Breath (DM Boon)',
  'DM Boon: CL = Level 1 (Level Feat)', '+1 Stat: INT (Level Feat)', 'DM Boon: CL = Level 6 (Level Feat)',
  'DM Boon: CL = Level 8 (Level Feat)', '+1 Stat: STR (Level Feat)', '+1 Stat: CON (Level Feat)'
];
const CLASSIC_ABILITIES = [
  'Bonus Feat (Human)', 'Skilled (Human)', 'Battle Clarity (Ex)', 'Weapon Aptitude (Ex)', 'Fighter Bonus Feat',
  'Trapfinding (Ex)', 'Returning Attacks (Ex)', 'Warblade Bonus Feat', 'Dragon Breath Weapon (Acid) Special Ability'
];
const featText = f => `${f.name}${f.category && f.category !== 'Feat' ? ` (${f.category})` : ''}`;
const abilityText = a => `${a.name}${a.type ? ` ${a.type}` : ''}`;

const M = featsModel(LOADED);

test('real: feats match the classic showcase except the three ability increases', () => {
  assert.deepEqual(M.feats.map(featText), CLASSIC_FEATS.filter(t => !t.startsWith('+1 Stat')));
  assert.equal(M.feats.length, 27);
});
test('real: abilities match the classic showcase', () => {
  assert.deepEqual(M.abilities.map(abilityText), CLASSIC_ABILITIES);
});
test('real: companion locked, like the classic card', () => {
  assert.equal(M.companion, 'locked');
});
test('real: level-row DM boons keep their level as source', () => {
  assert.deepEqual(M.feats.filter(f => f.fromLevel).map(f => [f.name, f.source]),
    [['DM Boon: CL = Level 1', 'Level 1'], ['DM Boon: CL = Level 6', 'Level 6'], ['DM Boon: CL = Level 8', 'Level 8']]);
});
test('real: the model never mutates the character', () => {
  const c = structuredClone(LOADED);
  featsModel(c);
  assert.deepEqual(c, LOADED);
});

// ================================================================ rules
test('ability increases in level rows are never feats', () => {
  const m = featsModel({ levelProgression: [{ level: 4, feats: ['+1 Stat: STR', '💪 +1 Stat: DEX', 'Stat: WIS'] }] });
  assert.deepEqual(m.feats, []);
});
test('level-row strings lose their emoji and [Tag] and skip names already on the character', () => {
  const m = featsModel({
    feats: [{ id: 'feat-cleave', name: 'Cleave', category: 'Regular Feat' }],
    levelProgression: [{ level: 1, feats: ['🎖️ Cleave', '⚔️ [Bonus] Power Attack'] }]
  });
  assert.deepEqual(m.feats.map(f => [f.name, f.category]), [['Cleave', 'Regular Feat'], ['Power Attack', 'Level Feat']]);
});
test('class features from level rows show as Ex with class and level', () => {
  const m = featsModel({ levelProgression: [{ level: 2, className: 'Rogue', classFeatures: ['Evasion'] }] });
  assert.deepEqual(m.abilities.map(a => [a.name, a.type, a.source]), [['Evasion', 'Ex', 'Rogue Level 2']]);
});
test('entries are listed by id: two ids with one name both show', () => {
  const m = featsModel({ feats: [{ id: 'a', name: 'Toughness' }, { id: 'b', name: 'Toughness' }, { id: 'a', name: 'Toughness' }] });
  assert.equal(m.feats.length, 2);
});
test('legacy string feats are de-duplicated by name', () => {
  assert.equal(featsModel({ feats: ['Dodge', 'dodge', ' Dodge '] }).feats.length, 1);
});
test('tooltip uses the entry text, then source', () => {
  const m = featsModel({ feats: [{ id: 'x', name: 'Cleave', category: 'Regular Feat', benefit: 'Extra melee attack.' }, { id: 'y', name: 'Dodge', source: 'Level 3' }] });
  assert.deepEqual(m.feats.map(f => f.tooltip), ['Cleave [Regular Feat]\nExtra melee attack.', 'Level 3']);
});
test('companion: bound, eligible by feat or class feature, else locked', () => {
  assert.equal(featsModel({ companion: { baseMonsterId: 'mon-wolf' } }).companion, 'bound');
  assert.equal(isCompanionEligible({ specialAbilities: [{ name: 'Animal Companion (Ex)' }] }), true);
  assert.equal(isCompanionEligible({ levelProgression: [{ classFeatures: ['Summon Familiar'] }] }), true);
  assert.equal(featsModel({ feats: [{ name: 'Power Attack' }] }).companion, 'locked');
});

// ================================================================ view
test('view: closed by default renders the header counts and a hidden body', () => {
  const out = FeatsShowcase(LOADED, { open: false, companionStats: null }).value;
  assert.ok(out.includes('27 Feats') && out.includes('9 Abilities'));
  assert.ok(out.includes('aria-expanded="false"') && /id="v3-feats-body" class="hidden/.test(out));
});
test('view: names and tooltips are escaped', () => {
  const out = FeatsShowcase({ feats: [{ id: 'x', name: '<b>Bad</b>', benefit: '"quoted"' }] }, { open: true, companionStats: null }).value;
  assert.ok(!out.includes('<b>Bad</b>'));
  assert.ok(out.includes('&quot;quoted&quot;'));
});

console.log(`Sheet V3 feats tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
