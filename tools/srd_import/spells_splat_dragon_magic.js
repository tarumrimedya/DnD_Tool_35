/**
 * Imports the Dragon Magic spell pack (exports/dragon_magic_spells_pack.json, 42 spells) as the lazy chunk
 * database/srd_spells_splat.json. Idempotent.
 *
 * - Every spell was checked against the srd.dndtools.org Spell Index (school, subschool, descriptors, class
 *   levels: 42/42 match, 2026-11-10), so the records are `verification: "cross-checked"`.
 * - The four primal spells that srd_spells.json already had (Primal Hunter, Instinct, Senses, Speed) are taken
 *   from the pack and removed from srd_spells.json (user decision): the old copies had wrong class levels
 *   (e.g. Primal Speed Druid 4 / Wizard 4; the book is Druid 6, ranger 4, sorcerer 6) and the wrong bonus type
 *   on Primal Speed (competence; the book says resistance).
 * - Index rows are added or re-pointed at the new chunk; tools/verify_and_sync.js refreshes counts and hashes.
 *
 * Usage: node tools/srd_import/spells_splat_dragon_magic.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DB = path.join(ROOT, 'database');
const PACK = path.join(ROOT, 'exports', 'dragon_magic_spells_pack.json');
const SPELLS = 'srd_spells.json';
const SPLAT = 'srd_spells_splat.json';

const load = (name) => JSON.parse(fs.readFileSync(path.join(DB, name), 'utf8'));
function save(name, data) {
  const p = path.join(DB, name);
  // Keep the file's own trailing-newline convention so the diff shows only the changed records.
  const nl = !fs.existsSync(p) || fs.readFileSync(p, 'utf8').endsWith('\n') ? '\n' : '';
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + nl, 'utf8');
}

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'));
const entries = pack.entries.map((e) => Object.assign({}, e, {
  edition: '3.5',
  contentLevel: 'summary',
  verification: 'cross-checked',
  provenance: {
    origin: 'pack',
    pack: pack.pack.id,
    book: 'Dragon Magic',
    crossCheck: 'srd.dndtools.org Spell Index (school, subschool, descriptors, class levels)'
  }
}));
const ids = entries.map((e) => e.id);
if (new Set(ids).size !== ids.length) throw new Error('duplicate spell ids in the pack');

const idSet = new Set(ids);
const spells = load(SPELLS);
const keep = spells.filter((e) => !(e && idSet.has(e.id)));
const removed = spells.length - keep.length;
if (removed) save(SPELLS, keep);
save(SPLAT, entries);

const idx = load('srd_index.json');
let added = 0, repointed = 0;
entries.forEach((e) => {
  const row = { id: e.id, n: e.name, t: 'Spell', c: e.school || e.category || '', s: e.save || 'None', f: SPLAT, l: e.level };
  const i = idx.index.findIndex((r) => r.id === e.id);
  if (i < 0) { idx.index.push(row); added++; }
  else if (idx.index[i].f !== SPLAT || JSON.stringify(idx.index[i]) !== JSON.stringify(row)) { idx.index[i] = row; repointed++; }
});
const meta = idx.chunks[SPLAT] || { count: 0, hash: '' };
idx.chunks[SPLAT] = Object.assign(meta, { count: entries.length, bytes: fs.statSync(path.join(DB, SPLAT)).size, eagerLoad: false });
idx.chunks[SPELLS].count = keep.length;
idx.chunks[SPELLS].bytes = fs.statSync(path.join(DB, SPELLS)).size;
idx.totalEntries = idx.index.length;
save('srd_index.json', idx);
console.log(JSON.stringify({ splat: entries.length, removedFromSrdSpells: removed, indexAdded: added, indexRepointed: repointed, srdSpellsLeft: keep.length }));
