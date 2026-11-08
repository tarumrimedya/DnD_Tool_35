// Sheet V3 data layer tests: entry-kind, migrations, write gate.
// Run: node tools/test_sheet_v3_data.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inferKind, createKindContext, splitPackId } from '../sheet/core/entry-kind.js';
import { runMigrations, collectEntries, MIGRATIONS } from '../sheet/core/migrations.js';
import { addEntry, updateEntry, removeEntry, defineHomebrew, resolveQuarantine, newEntryId, findEntry } from '../sheet/core/actions.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const ctx = createKindContext(readJson('database/srd_index.json'));
const REAL = readJson('tools/fixtures/real/character_2026-11-08.json');
const NOW = '2026-11-08T12:00:00.000Z';

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}
let seq = 0;
const random = () => `r${(seq++).toString(36).padStart(3, '0')}`;

/** Stable identity of an entry for lossless checks: id if present, else name (added V3 fields ignored). */
const identity = e => (e && typeof e === 'object') ? `${e.id ?? ''}|${e.name ?? ''}` : JSON.stringify(e);

// ============================================================== entry-kind
test('kind: SRD index lookup by baseItemId', () => {
  assert.equal(inferKind({ id: '1794058576167', baseItemId: 'wpn-longsword' }, { list: 'gearPool', ctx }).kind, 'weapon');
});
test('kind: SRD template (index rows carry no t) by tmpl- prefix', () => {
  const tmpl = readJson('database/srd_index.json').index.find(r => String(r.id).startsWith('tmpl-'));
  assert.ok(tmpl, 'srd_index has template rows');
  assert.equal(inferKind({ id: tmpl.id }, { ctx }).kind, 'template');
});
test('kind: real DM-granted feat with boon_ id stays a feat (type outranks prefix)', () => {
  const r = inferKind({ id: 'boon_skill_ride_4', type: 'Feat', category: 'DM Boon' }, { list: 'feats', ctx });
  assert.deepEqual([r.kind, r.source, r.conflict], ['feat', 'dm', false]);
});
test('kind: pack-namespaced DM boon -> ability, origin dm, pack kept', () => {
  const r = inferKind({ id: 'pack_dm_draconic_boons:boon_draconic_counter', type: 'DM Boon' }, { list: 'customDb', ctx });
  assert.deepEqual([r.kind, r.source, r.pack, r.localId], ['ability', 'dm', 'pack_dm_draconic_boons', 'boon_draconic_counter']);
});
test('kind: DM-granted feat stays a feat with origin dm', () => {
  const r = inferKind({ id: 'feat_dm_boon_ride_4', type: 'Feat', category: 'DM Boon' }, { list: 'customDb', ctx });
  assert.deepEqual([r.kind, r.source], ['feat', 'dm']);
});
test('kind: damage and bonus types never classify an entry', () => {
  for (const type of ['Piercing', 'Slashing', 'competence', 'Untyped', 'Ex', 'Su']) {
    assert.equal(inferKind({ name: 'X', type }, { ctx }).kind, null, type);
  }
});
test('kind: names are never used', () => {
  assert.equal(inferKind({ name: 'Longsword' }, { ctx }).kind, null);
  assert.equal(inferKind({ name: 'Cone of Cold' }, { ctx }).kind, null);
});
test('kind: list membership for cus- class features (rule 2b)', () => {
  const r = inferKind({ id: 'cus-battle-clarity-ex', category: 'Class Feature' }, { list: 'specialAbilities', ctx });
  assert.deepEqual([r.kind, r.via, r.conflict], ['ability', 'list', false]);
});
test('kind: explicit signal conflicting with list is a conflict', () => {
  const r = inferKind({ id: 'ability_dragon_breath_damage_deals_deals' }, { list: 'gearPool', ctx });
  assert.deepEqual([r.kind, r.conflict], ['ability', true]);
});
test('kind: tob- maneuver vs stance decided by type, not prefix', () => {
  assert.equal(inferKind({ id: 'tob-x', type: 'Stance' }, { ctx }).kind, 'stance');
  assert.equal(inferKind({ id: 'tob-y', type: 'Maneuver' }, { ctx }).kind, 'maneuver');
});
test('kind: psionic power by prefix', () => {
  assert.equal(inferKind({ id: 'pwr-anything' }, { list: 'spells', ctx }).kind, 'power');
});
test('splitPackId: plain ids untouched', () => {
  assert.deepEqual(splitPackId('feat-power-attack'), { pack: null, localId: 'feat-power-attack' });
});

// ============================================================== migrations: real character
const realRun = runMigrations(REAL, { ctx, now: NOW });
const migrated = realRun.character;

test('real: all migrations applied once and recorded', () => {
  assert.deepEqual(realRun.applied, MIGRATIONS.map(m => m.id));
  assert.deepEqual(migrated.v3Migrations, MIGRATIONS.map(m => m.id));
});
test('real: input fixture not mutated', () => {
  assert.equal(REAL.v3Migrations, undefined);
  assert.equal(typeof REAL.gearPool[0].id, 'number');
});
test('real: lossless (every entry is in a list or in quarantine)', () => {
  const before = collectEntries(REAL).map(identity).sort();
  const after = collectEntries(migrated).map(identity).sort();
  assert.deepEqual(after, before);
});
test('real: only "Dragon Breath" from gearPool is quarantined, suggested ability', () => {
  const q = migrated.quarantine || [];
  assert.equal(q.length, 1, JSON.stringify(q.map(r => r.entry.name)));
  assert.deepEqual([q[0].entry.name, q[0].from, q[0].reason, q[0].suggested], ['Dragon Breath', 'gearPool', 'kind-conflict', 'ability']);
  assert.match(q[0].note || '', /Dragon Breath Weapon \(Acid\)/);
});
test('real: DM boon feats in feats list stay feats with origin dm', () => {
  const dmFeats = migrated.feats.filter(f => f && f.category === 'DM Boon');
  assert.ok(dmFeats.length >= 3);
  assert.ok(dmFeats.every(f => f.kind === 'feat' && f.origin === 'dm'));
});
test('real: gearPool ids are strings, shield and longsword stay', () => {
  assert.deepEqual(migrated.gearPool.map(g => [typeof g.id, g.kind]), [['string', 'shield'], ['string', 'weapon']]);
});
test('real: every remaining list entry has a kind', () => {
  for (const key of ['feats', 'specialAbilities', 'gearPool', 'customDb', 'customClasses']) {
    const missing = (migrated[key] || []).filter(e => e && typeof e === 'object' && !e.kind);
    assert.equal(missing.length, 0, `${key}: ${missing.map(e => e.name).join(', ')}`);
  }
});
test('real: 106 pack DM boons are abilities with origin dm', () => {
  const boons = migrated.customDb.filter(e => e.type === 'DM Boon');
  assert.equal(boons.length, 106);
  assert.ok(boons.every(e => e.kind === 'ability' && e.origin === 'dm'));
  assert.ok(boons.filter(e => String(e.id).includes(':')).every(e => e.pack === 'pack_dm_draconic_boons'));
});
test('real: legacy `source` text is never overwritten', () => {
  const before = Object.fromEntries(REAL.specialAbilities.map(a => [a.id, a.source]));
  for (const a of migrated.specialAbilities) assert.equal(a.source, before[a.id]);
});
test('real: idempotent (second run changes nothing)', () => {
  const again = runMigrations(migrated, { ctx, now: '2030-01-01T00:00:00.000Z' });
  assert.deepEqual(again.applied, []);
  assert.deepEqual(again.character, migrated);
});
test('real: skills and levelProgression untouched', () => {
  assert.deepEqual(migrated.skills, REAL.skills);
  assert.deepEqual(migrated.levelProgression, REAL.levelProgression);
});

// ============================================================== migrations: synthetic
const synthetic = {
  schemaVersion: 2,
  progression: [{ className: 'Fighter', level: 1 }],
  levelProgression: [],
  feats: ['Power Attack', null, { id: 'feat-power-attack', name: 'Power Attack' }],
  gearPool: [
    { id: 7, name: 'Longsword', baseItemId: 'wpn-longsword' },
    { id: 'feat_misplaced_dodge', name: 'Dodge', type: 'Feat' },
    { id: 'mystery-1', name: 'Mystery Thing', type: 'Piercing' }
  ],
  spells: [{ id: 'pwr-mind-thrust', name: 'Mind Thrust' }],
  customDb: [{ id: 'x1', name: 'Unknown', type: 'competence' }]
};
const synRun = runMigrations(synthetic, { ctx, now: NOW });
const syn = synRun.character;

test('synthetic: progression alias fills levelProgression, keeps legacy field', () => {
  assert.deepEqual(syn.levelProgression, synthetic.progression);
  assert.deepEqual(syn.progression, synthetic.progression);
});
test('synthetic: string and null feats left exactly as they were', () => {
  assert.deepEqual(syn.feats.slice(0, 2), ['Power Attack', null]);
});
test('synthetic: numeric id -> string', () => {
  assert.equal(syn.gearPool[0].id, '7');
});
test('synthetic: feat in gearPool quarantined as kind-conflict, suggested feat', () => {
  const r = syn.quarantine.find(q => q.entry.name === 'Dodge');
  assert.deepEqual([r.reason, r.suggested, r.from], ['kind-conflict', 'feat', 'gearPool']);
});
test('synthetic: unknown kinds quarantined as kind-unknown (gearPool and customDb)', () => {
  const unknown = syn.quarantine.filter(q => q.reason === 'kind-unknown').map(q => [q.entry.name, q.from]);
  assert.deepEqual(unknown.sort(), [['Mystery Thing', 'gearPool'], ['Unknown', 'customDb']]);
});
test('synthetic: psionic power tagged in spells', () => {
  assert.equal(syn.spells[0].kind, 'power');
});
test('synthetic: lossless', () => {
  assert.deepEqual(collectEntries(syn).map(identity).sort(), collectEntries(synthetic).map(identity).sort());
});
test('edge: empty character migrates without error', () => {
  const r = runMigrations({}, { ctx, now: NOW });
  assert.equal(r.character.quarantine, undefined);
  assert.equal(r.applied.length, MIGRATIONS.length);
});

// ============================================================== actions (write gate)
const base = migrated;
// An SRD feat the real character does not have yet.
const ownedFeatIds = new Set(base.feats.map(f => f && f.id));
const freshFeat = readJson('database/srd_index.json').index.find(r => r.t === 'Feat' && !ownedFeatIds.has(r.id));

test('addEntry: SRD feat goes to feats with kind', () => {
  const r = addEntry(base, { id: freshFeat.id, name: freshFeat.n }, { ctx, random });
  assert.ok(r.ok, r.error);
  assert.equal(r.character.feats.at(-1).kind, 'feat');
  assert.equal(base.feats.length + 1, r.character.feats.length);
  assert.notEqual(r.character, base);
  assert.equal(r.character.gearPool, base.gearPool, 'untouched lists are shared, not copied');
});
test('addEntry: duplicate non-gear is rejected (Power Attack already owned)', () => {
  const r = addEntry(base, { id: 'feat-power-attack', name: 'Power Attack' }, { ctx, random });
  assert.equal(r.ok, false);
});
test('addEntry: second longsword becomes a new instance', () => {
  const r = addEntry(base, { id: base.gearPool[1].id, name: 'Longsword', baseItemId: 'wpn-longsword' }, { ctx, random });
  assert.ok(r.ok);
  assert.equal(r.character.gearPool.length, 3);
  assert.notEqual(r.character.gearPool[2].id, base.gearPool[1].id);
});
test('addEntry: enhancement and synergy refused', () => {
  assert.equal(addEntry(base, { kind: 'enhancement', name: 'Keen' }, { ctx }).ok, false);
  assert.equal(addEntry(base, { kind: 'synergy', name: 'Twin Fang' }, { ctx }).ok, false);
});
test('addEntry: unknown kind refused, not guessed from name', () => {
  assert.equal(addEntry(base, { name: 'Longsword' }, { ctx }).ok, false);
});
test('updateEntry: patches by string id, refuses id/kind change', () => {
  const id = base.gearPool[0].id;
  const r = updateEntry(base, Number(id), { qty: 2 });
  assert.ok(r.ok);
  assert.equal(r.character.gearPool[0].qty, 2);
  assert.equal(updateEntry(base, id, { kind: 'armor' }).ok, false);
});
test('removeEntry: removes from character list, never from customDb', () => {
  const featId = base.feats[0].id;
  const r = removeEntry(base, featId);
  assert.ok(r.ok);
  assert.equal(findEntry(r.character, featId), null);
  const dbId = base.customDb[0].id;
  assert.equal(removeEntry(base, dbId).ok, false);
});
test('defineHomebrew: id is <kind>_<slug>_<random>, origin dm kept', () => {
  const r = defineHomebrew(base, { name: 'DM Boon: Ride +4', type: 'DM Boon' }, { ctx, random: () => 'abcd' });
  assert.ok(r.ok);
  assert.equal(r.id, 'ability_dm_boon_ride_4_abcd');
  assert.equal(r.character.customDb.at(-1).origin, 'dm');
});
test('defineHomebrew: Change & Add of an SRD entry gets a new id with overrides', () => {
  const r = defineHomebrew(base, { id: 'feat-power-attack', overrides: 'feat-power-attack', name: 'Power Attack (House)', kind: 'feat' }, { ctx, random: () => 'h001' });
  assert.ok(r.ok);
  assert.equal(r.id, 'feat_power_attack_house_h001');
  assert.equal(r.character.customDb.at(-1).overrides, 'feat-power-attack');
});
test('newEntryId: same name twice never collides', () => {
  assert.notEqual(newEntryId('ability', 'Dragon Breath', random), newEntryId('ability', 'Dragon Breath', random));
});
test('resolveQuarantine: move Dragon Breath into specialAbilities', () => {
  const r = resolveQuarantine(base, 0, { action: 'move', kind: 'ability' }, { ctx, random });
  assert.ok(r.ok);
  assert.equal(r.character.quarantine.length, 0);
  assert.ok(r.character.specialAbilities.some(a => a.name === 'Dragon Breath' && a.kind === 'ability'));
});
test('resolveQuarantine: delete requires confirmation', () => {
  assert.equal(resolveQuarantine(base, 0, { action: 'delete', confirmed: false }).ok, false);
  const r = resolveQuarantine(base, 0, { action: 'delete', confirmed: true });
  assert.ok(r.ok);
  assert.equal(r.character.quarantine.length, 0);
});
test('actions never mutate their input', () => {
  const snapshot = JSON.stringify(base);
  addEntry(base, { id: 'feat-dodge', name: 'Dodge' }, { ctx, random });
  updateEntry(base, base.gearPool[0].id, { qty: 9 });
  removeEntry(base, base.feats[0].id);
  defineHomebrew(base, { name: 'X', kind: 'feat' }, { ctx, random });
  resolveQuarantine(base, 0, { action: 'move', kind: 'ability' }, { ctx, random });
  assert.equal(JSON.stringify(base), snapshot);
});

console.log(`${failed ? '❌' : '✅'} SHEET V3 DATA: ${passed}/${passed + failed} tests passed.`);
if (failed > 0) process.exit(1);
