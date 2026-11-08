// Sheet V3 Phase B tests: storage codec, save planning (conflict check), writer lock.
// Run: node tools/test_sheet_v3_persistence.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeStored, encodeForStorage, REVIEW_MARKER } from '../sheet/core/storage-codec.js';
import { planSave, storedFingerprint, characterIdOf } from '../sheet/core/persistence.js';
import { createWriterLock, lockName } from '../sheet/core/writer-lock.js';
import { runMigrations } from '../sheet/core/migrations.js';
import { createKindContext } from '../sheet/core/entry-kind.js';
import { resolveQuarantine } from '../sheet/core/actions.js';
import { isReadOnly } from '../sheet/core/store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const REAL = readJson('tools/fixtures/real/character_2026-11-08.json');
const ctx = createKindContext(readJson('database/srd_index.json'));
const NOW = '2026-11-09T10:00:00.000Z';

let passed = 0;
let failed = 0;
/** @type {Array<[string, () => any]>} */
const queue = [];
const test = (name, fn) => queue.push([name, fn]);

/** Load the real character the way main.js does (decode, then V3 migrations). */
const loadReal = () => {
  const { character, memo } = decodeStored(REAL);
  return { character: runMigrations(character, { ctx, now: NOW }).character, memo };
};
const byName = (list, name) => (list || []).find(e => e && e.name === name);

// ================================================================ storage codec
test('codec: decode turns numeric ids into strings and remembers them', () => {
  const { character, memo } = decodeStored(REAL);
  assert.deepEqual(memo.numericIds, ['1794058567076', '1794058576167']);
  assert.ok(character.gearPool.every(e => typeof e.id === 'string'));
  assert.equal(typeof REAL.gearPool[0].id, 'number', 'input not mutated');
});
test('codec: encode(decode(x)) gives back x exactly', () => {
  const { character, memo } = decodeStored(REAL);
  assert.deepEqual(encodeForStorage(character, memo), REAL);
});
test('codec: a quarantined entry is stored in its original list with a review marker', () => {
  const { character, memo } = loadReal();
  assert.equal(character.quarantine.length, 1);
  assert.equal(character.gearPool.length, 2);
  const stored = encodeForStorage(character, memo);
  assert.equal(stored.quarantine, undefined);
  assert.equal(stored.gearPool.length, 3, 'the classic sheet still sees all 3 gear entries');
  const breath = byName(stored.gearPool, 'Dragon Breath');
  assert.equal(breath[REVIEW_MARKER].reason, 'kind-conflict');
  assert.equal(breath[REVIEW_MARKER].suggested, 'ability');
  assert.deepEqual(stored.gearPool.filter(e => e !== breath).map(e => e.id), [1794058567076, 1794058576167], 'numeric ids restored');
});
test('codec: the stored shape loads back into the same V3 shape and is stable', () => {
  const { character, memo } = loadReal();
  const stored = encodeForStorage(character, memo);
  const again = decodeStored(stored);
  assert.deepEqual(again.character.quarantine.map(q => [q.from, q.entry.name, q.reason]), [['gearPool', 'Dragon Breath', 'kind-conflict']]);
  assert.equal(again.character.gearPool.length, 2);
  // Migrations are recorded, so a reload does not run them again.
  assert.deepEqual(runMigrations(again.character, { ctx, now: NOW }).applied, []);
  assert.deepEqual(encodeForStorage(again.character, again.memo), stored);
});
test('codec: no entry is lost or duplicated in the stored shape', () => {
  const { character, memo } = loadReal();
  const stored = encodeForStorage(character, memo);
  for (const key of ['gearPool', 'feats', 'specialAbilities', 'customDb', 'spells', 'weapons']) {
    assert.deepEqual((stored[key] || []).map(e => String(e?.id)).sort(), (REAL[key] || []).map(e => String(e?.id)).sort(), key);
  }
});
test('codec: does not mutate the V3 character', () => {
  const { character, memo } = loadReal();
  const before = JSON.stringify(character);
  encodeForStorage(character, memo);
  assert.equal(JSON.stringify(character), before);
});

// ================================================================ quarantine decisions, as stored
test('keep: the entry goes back to its list, unmarked', () => {
  const { character, memo } = loadReal();
  const r = resolveQuarantine(character, 0, { action: 'keep' });
  assert.ok(r.ok);
  assert.equal(r.character.quarantine.length, 0);
  const stored = encodeForStorage(r.character, memo);
  assert.equal(stored.gearPool.length, 3);
  assert.equal(byName(stored.gearPool, 'Dragon Breath')[REVIEW_MARKER], undefined);
  assert.equal(decodeStored(stored).character.quarantine, undefined, 'not quarantined again on reload');
});
test('move: the entry is stored in its new list only', () => {
  const { character, memo } = loadReal();
  const r = resolveQuarantine(character, 0, { action: 'move', kind: 'ability' }, { ctx });
  assert.ok(r.ok, r.error);
  const stored = encodeForStorage(r.character, memo);
  assert.equal(byName(stored.gearPool, 'Dragon Breath'), undefined);
  assert.equal(byName(stored.specialAbilities, 'Dragon Breath').kind, 'ability');
});
test('delete: needs confirmation, then the entry is gone from the stored shape', () => {
  const { character, memo } = loadReal();
  assert.equal(resolveQuarantine(character, 0, { action: 'delete', confirmed: false }).ok, false);
  const r = resolveQuarantine(character, 0, { action: 'delete', confirmed: true });
  assert.equal(byName(encodeForStorage(r.character, memo).gearPool, 'Dragon Breath'), undefined);
});

// ================================================================ save planning
const ID = 'char_1793983203096';
const hubWith = fullData => ({
  characters: [
    { id: 'other', name: 'Someone Else', fullData: { id: 'other', name: 'Someone Else' } },
    { id: ID, name: REAL.name, currentHp: 7, maxHp: 99, tempHp: 0, lastHpUpdateTs: 5, ac: 31, fullData }
  ]
});
const stamp = obj => JSON.parse(JSON.stringify(obj));

test('save: the id comes from _hubId, then id, then the requested id', () => {
  assert.equal(characterIdOf({ _hubId: 'a', id: 'b' }), 'a');
  assert.equal(characterIdOf({ id: 'b' }), 'b');
  assert.equal(characterIdOf({}, 'c'), 'c');
});
test('save: writes dnd35_character and the Hub entry when nothing changed elsewhere', () => {
  const hubDb = hubWith(stamp(REAL));
  const saved = stamp(REAL);
  const baseline = storedFingerprint({ hubDb, saved }, ID);
  const stored = { ...stamp(REAL), name: 'Renamed' };
  const plan = planSave({ hubDb, saved, id: ID, baseline, stored, now: NOW });
  assert.ok(plan.ok);
  const written = JSON.parse(plan.writes.character);
  assert.equal(written.name, 'Renamed');
  assert.equal(written.lastModified, NOW);
  const hub = JSON.parse(plan.writes.hubDb);
  const entry = hub.characters.find(c => c.id === ID);
  assert.equal(entry.fullData.name, 'Renamed');
  assert.equal(entry.name, 'Renamed');
  assert.deepEqual([entry.currentHp, entry.tempHp, entry.lastHpUpdateTs, entry.ac], [7, 0, 5, 31], 'DM HP and derived numbers untouched');
  assert.deepEqual(hub.characters[0], hubDb.characters[0], 'other Hub entries untouched');
});
test('save: refuses when dnd35_character changed since load', () => {
  const hubDb = hubWith(stamp(REAL));
  const saved = stamp(REAL);
  const baseline = storedFingerprint({ hubDb, saved }, ID);
  const plan = planSave({ hubDb, saved: { ...saved, notes: 'typed in the classic sheet' }, id: ID, baseline, stored: stamp(REAL), now: NOW });
  assert.deepEqual([plan.ok, plan.reason, plan.changed], [false, 'conflict', ['dnd35_character']]);
});
test('save: refuses when the Hub fullData changed since load (even without a new lastModified)', () => {
  const saved = stamp(REAL);
  const baseline = storedFingerprint({ hubDb: hubWith(stamp(REAL)), saved }, ID);
  const plan = planSave({ hubDb: hubWith({ ...stamp(REAL), level: 18 }), saved, id: ID, baseline, stored: stamp(REAL), now: NOW });
  assert.equal(plan.ok, false);
  assert.equal(plan.reason, 'conflict');
});
test('save: dnd35_character now holding another character is left alone, the Hub is still written', () => {
  const hubDb = hubWith(stamp(REAL));
  const baseline = storedFingerprint({ hubDb, saved: stamp(REAL) }, ID);
  const plan = planSave({ hubDb, saved: { id: 'other', name: 'Someone Else' }, id: ID, baseline, stored: stamp(REAL), now: NOW });
  assert.ok(plan.ok);
  assert.equal(plan.writes.character, undefined);
  assert.ok(plan.writes.hubDb);
});
test('save: nowhere to write is refused', () => {
  const plan = planSave({ hubDb: null, saved: { id: 'other' }, id: ID, baseline: { saved: null, hub: null }, stored: stamp(REAL), now: NOW });
  assert.deepEqual([plan.ok, plan.reason], [false, 'no-target']);
});
test('save: a second save right after the first is not a false conflict', () => {
  let hubDb = hubWith(stamp(REAL));
  let saved = stamp(REAL);
  const first = planSave({ hubDb, saved, id: ID, baseline: storedFingerprint({ hubDb, saved }, ID), stored: stamp(REAL), now: NOW });
  hubDb = JSON.parse(first.writes.hubDb);
  saved = JSON.parse(first.writes.character);
  const second = planSave({ hubDb, saved, id: ID, baseline: first.baseline, stored: stamp(REAL), now: '2026-11-09T10:01:00.000Z' });
  assert.ok(second.ok, JSON.stringify(second));
});
test('save: inputs are not mutated', () => {
  const hubDb = hubWith(stamp(REAL));
  const saved = stamp(REAL);
  const stored = stamp(REAL);
  const before = JSON.stringify([hubDb, saved, stored]);
  planSave({ hubDb, saved, id: ID, baseline: storedFingerprint({ hubDb, saved }, ID), stored, now: NOW });
  assert.equal(JSON.stringify([hubDb, saved, stored]), before);
});
test('save: the full load-edit-save path keeps the classic shape', () => {
  const hubDb = hubWith(stamp(REAL));
  const saved = stamp(REAL);
  const baseline = storedFingerprint({ hubDb, saved }, ID);
  const { character, memo } = loadReal();
  const plan = planSave({ hubDb, saved, id: ID, baseline, stored: encodeForStorage(character, memo), now: NOW });
  assert.ok(plan.ok);
  const written = JSON.parse(plan.writes.character);
  assert.equal(written.gearPool.length, 3);
  assert.equal(typeof written.gearPool[0].id, 'number');
  assert.equal(written.quarantine, undefined);
  assert.equal(written.v3Migrations.length, 4);
});

// ================================================================ writer lock (fake Web Locks)
function fakeLocks() {
  const held = new Map();
  return {
    held,
    request(name, options, cb) {
      const current = held.get(name);
      if (current && options.ifAvailable) return Promise.resolve(cb(null));
      if (current && options.steal) {
        held.delete(name);
        current.reject(Object.assign(new Error('Lock broken by another request'), { name: 'AbortError' }));
      }
      return new Promise((resolve, reject) => {
        const entry = { reject };
        held.set(name, entry);
        Promise.resolve(cb({ name })).then(v => {
          if (held.get(name) === entry) held.delete(name);
          resolve(v);
        }, reject);
      });
    }
  };
}
const tick = () => new Promise(r => setTimeout(r, 0));

test('lock: lock names are per character', () => {
  assert.equal(lockName('c1'), 'dnd35-writer:c1');
});
test('lock: unsupported without the Web Locks API', async () => {
  const lock = createWriterLock({ locks: undefined, characterId: 'c1' });
  assert.equal(await lock.acquire(), 'unsupported');
});
test('lock: one writer per character; a second tab is busy', async () => {
  const locks = fakeLocks();
  const a = createWriterLock({ locks, characterId: 'c1' });
  const b = createWriterLock({ locks, characterId: 'c1' });
  assert.equal(await a.acquire(), 'held');
  assert.equal(await b.acquire(), 'busy');
});
test('lock: two different characters can both be edited', async () => {
  const locks = fakeLocks();
  assert.equal(await createWriterLock({ locks, characterId: 'c1' }).acquire(), 'held');
  assert.equal(await createWriterLock({ locks, characterId: 'c2' }).acquire(), 'held');
});
test('lock: take over moves the lock and tells the old tab', async () => {
  const locks = fakeLocks();
  const seen = [];
  const a = createWriterLock({ locks, characterId: 'c1', onChange: s => seen.push(s) });
  const b = createWriterLock({ locks, characterId: 'c1' });
  await a.acquire();
  assert.equal(await b.acquire({ takeOver: true }), 'held');
  await tick();
  assert.equal(a.status, 'lost');
  assert.deepEqual(seen, ['held', 'lost']);
});
test('lock: release frees it for the next tab', async () => {
  const locks = fakeLocks();
  const a = createWriterLock({ locks, characterId: 'c1' });
  const b = createWriterLock({ locks, characterId: 'c1' });
  await a.acquire();
  a.release();
  await tick();
  assert.equal(a.status, 'idle');
  assert.equal(locks.held.size, 0);
  assert.equal(await b.acquire(), 'held');
});
test('lock: read-only unless the lock is held and the last save was fine', () => {
  assert.equal(isReadOnly({ lock: 'held', save: 'saved', savedAt: null, message: null }), false);
  assert.equal(isReadOnly({ lock: 'held', save: 'conflict', savedAt: null, message: null }), true);
  assert.equal(isReadOnly({ lock: 'held', save: 'error', savedAt: null, message: null }), true);
  for (const lock of ['idle', 'busy', 'lost', 'unsupported', 'requesting']) {
    assert.equal(isReadOnly({ lock, save: 'idle', savedAt: null, message: null }), true, lock);
  }
});

for (const [name, fn] of queue) {
  try { await fn(); passed++; } catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}
console.log(`Sheet V3 persistence tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
