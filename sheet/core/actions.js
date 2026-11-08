// @ts-check
/**
 * Sheet V3 write gate (docs/V3_DATA_SCHEMA.md section 5).
 *
 * The only way to change entries on a character. Every action is a pure function
 * `(character, payload) => ActionResult`: the input is never mutated, only the touched list is
 * copied, and a rejected action returns the reason instead of throwing.
 */
import { inferKind, listForKind, GEAR_KINDS, KINDS } from './entry-kind.js';
import { ENTRY_LIST_KEYS } from './migrations.js';

/**
 * @typedef {Record<string, any>} Character
 * @typedef {import('./entry-kind.js').KindContext} KindContext
 * @typedef {{ ok: true, character: Character, id?: string } | { ok: false, error: string }} ActionResult
 * @typedef {{ ctx?: KindContext, random?: () => string }} ActionEnv
 */

/** @param {string} error @returns {ActionResult} */
const fail = error => ({ ok: false, error });

/** Default random suffix (4 base36 chars). Injectable for deterministic tests. */
const defaultRandom = () => Math.random().toString(36).slice(2, 6).padEnd(4, '0');

/** @param {unknown} name */
export function slugify(name) {
  return String(name ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'entry';
}

/**
 * New homebrew/instance id: `<kind>_<slug>_<random>` (schema section 3, rule 3).
 * @param {string} kind @param {unknown} name @param {() => string} [random]
 */
export function newEntryId(kind, name, random = defaultRandom) {
  return `${kind.replace(/-/g, '_')}_${slugify(name)}_${random()}`;
}

/**
 * Locate an entry by id (string compare) in the entry lists.
 * @param {Character} c @param {unknown} id
 * @returns {{ list: string, index: number } | null}
 */
export function findEntry(c, id) {
  const wanted = String(id);
  for (const key of ENTRY_LIST_KEYS) {
    const list = c[key];
    if (!Array.isArray(list)) continue;
    const index = list.findIndex(e => e && typeof e === 'object' && String(e.id) === wanted);
    if (index >= 0) return { list: key, index };
  }
  return null;
}

/**
 * Resolve the kind for an entry being written: explicit kind wins, otherwise inference.
 * @param {Record<string, any>} entry @param {ActionEnv} env @param {string} [list]
 */
function resolveKind(entry, env, list) {
  if (typeof entry.kind === 'string') {
    const r = inferKind(entry, { list, ctx: env.ctx });
    return r.via === 'kind-field' ? r : null; // unknown explicit kind -> reject
  }
  const r = inferKind(entry, { list, ctx: env.ctx });
  return r.kind ? r : null;
}

/**
 * Add an entry to the list its kind belongs in.
 * @param {Character} c @param {Record<string, any>} entry @param {ActionEnv} [env]
 * @returns {ActionResult}
 */
export function addEntry(c, entry, env = {}) {
  if (!entry || typeof entry !== 'object') return fail('Entry must be an object.');
  const r = resolveKind(entry, env);
  if (!r || !r.kind) return fail(`Cannot add "${entry.name ?? '?'}": its kind could not be determined.`);
  const kind = r.kind;
  const list = listForKind(kind);
  if (!list) {
    if (kind === 'enhancement' || kind === 'material') return fail(`${kind} is not a standalone entry; apply it to an item (ADR-024).`);
    if (kind === 'synergy') return fail('Synergies unlock automatically and are not stored on the character.');
    return fail(`A ${kind} is not added as a list entry; use the profile or level actions.`);
  }
  const random = env.random ?? defaultRandom;
  const existing = Array.isArray(c[list]) ? c[list] : [];
  let id = entry.id === undefined || entry.id === null || entry.id === '' ? newEntryId(kind, entry.name, random) : String(entry.id);
  if (existing.some(e => e && typeof e === 'object' && String(e.id) === id)) {
    if (!GEAR_KINDS.includes(kind)) return fail(`"${entry.name ?? id}" is already on the character.`);
    // Gear is instanced: a second longsword is a second item with its own id.
    if (!entry.baseItemId && !entry.sourceId) entry = { ...entry, sourceId: id };
    id = newEntryId(kind, entry.name, random);
  }
  const added = { ...entry, id, kind, ...(r.source === 'dm' ? { origin: 'dm' } : {}), ...(r.pack ? { pack: r.pack } : {}) };
  return { ok: true, id, character: { ...c, [list]: [...existing, added] } };
}

/** Fields an update may never change. */
const IMMUTABLE_FIELDS = new Set(['id', 'kind']);

/**
 * Patch an entry in place. `id` and `kind` cannot change (remove and add instead).
 * @param {Character} c @param {unknown} id @param {Record<string, any>} patch
 * @returns {ActionResult}
 */
export function updateEntry(c, id, patch) {
  if (!patch || typeof patch !== 'object') return fail('Patch must be an object.');
  const blocked = Object.keys(patch).filter(k => IMMUTABLE_FIELDS.has(k));
  if (blocked.length) return fail(`Cannot change ${blocked.join(', ')} with updateEntry.`);
  const at = findEntry(c, id);
  if (!at) return fail(`No entry with id "${String(id)}".`);
  const list = [...c[at.list]];
  list[at.index] = { ...list[at.index], ...patch };
  return { ok: true, id: String(id), character: { ...c, [at.list]: list } };
}

/**
 * Remove an entry from a character list. Homebrew definitions in `customDb` are not removed by
 * this action (use removeHomebrew), so taking a feat off a character never deletes its definition.
 * @param {Character} c @param {unknown} id
 * @returns {ActionResult}
 */
export function removeEntry(c, id) {
  const wanted = String(id);
  for (const key of ENTRY_LIST_KEYS) {
    if (key === 'customDb' || !Array.isArray(c[key])) continue;
    const index = c[key].findIndex(/** @param {any} e */ e => e && typeof e === 'object' && String(e.id) === wanted);
    if (index >= 0) {
      const list = c[key].filter(/** @param {any} _ @param {number} i */ (_, i) => i !== index);
      return { ok: true, id: wanted, character: { ...c, [key]: list } };
    }
  }
  return fail(`No character entry with id "${wanted}".`);
}

/**
 * Define a homebrew entry in the character's own library (`customDb`, ADR-011).
 * "Change & Add" of an SRD entry: pass `overrides: '<srd-id>'`; a new id is always issued.
 * @param {Character} c @param {Record<string, any>} entry @param {ActionEnv} [env]
 * @returns {ActionResult}
 */
export function defineHomebrew(c, entry, env = {}) {
  if (!entry || typeof entry !== 'object') return fail('Entry must be an object.');
  if (!entry.name || !String(entry.name).trim()) return fail('Homebrew entries need a name.');
  const r = resolveKind(entry, env, 'customDb');
  if (!r || !r.kind) return fail(`Set a kind for "${entry.name}"; it could not be determined.`);
  const random = env.random ?? defaultRandom;
  const db = Array.isArray(c.customDb) ? c.customDb : [];
  let id = entry.overrides || entry.id === undefined || entry.id === null || entry.id === '' ? newEntryId(r.kind, entry.name, random) : String(entry.id);
  while (db.some(e => e && typeof e === 'object' && String(e.id) === id)) id = newEntryId(r.kind, entry.name, random);
  const defined = { ...entry, id, kind: r.kind, ...(r.source === 'dm' ? { origin: 'dm' } : {}) };
  return { ok: true, id, character: { ...c, customDb: [...db, defined] } };
}

/**
 * Apply the user's decision on a quarantined entry.
 * - `{ action: 'move', kind }`: re-adds the entry with that kind through `addEntry`
 * - `{ action: 'delete', confirmed: true }`: permanently drops it (the only delete in V3)
 * @param {Character} c @param {number} index
 * @param {{ action: 'move', kind: string } | { action: 'delete', confirmed: boolean }} decision
 * @param {ActionEnv} [env]
 * @returns {ActionResult}
 */
export function resolveQuarantine(c, index, decision, env = {}) {
  const q = Array.isArray(c.quarantine) ? c.quarantine : [];
  const record = q[index];
  if (!record) return fail(`No quarantined entry at ${index}.`);
  const rest = q.filter((_, i) => i !== index);
  if (decision.action === 'delete') {
    if (decision.confirmed !== true) return fail('Deleting a quarantined entry needs explicit confirmation.');
    return { ok: true, character: { ...c, quarantine: rest } };
  }
  if (decision.action === 'move') {
    if (!KINDS.includes(decision.kind)) return fail(`Unknown target kind "${decision.kind}".`);
    // addEntry validates the target list and refuses non-list kinds.
    return addEntry({ ...c, quarantine: rest }, { ...record.entry, kind: decision.kind }, env);
  }
  return fail('Unknown quarantine decision.');
}
