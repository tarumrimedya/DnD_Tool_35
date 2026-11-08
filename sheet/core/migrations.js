// @ts-check
/**
 * Sheet V3 migrations (docs/V3_DATA_SCHEMA.md section 6).
 *
 * Rules:
 *  - Each migration runs once; applied ids are recorded in `character.v3Migrations`.
 *  - Migrations never delete data. An entry that cannot stay where it is moves to
 *    `character.quarantine` with a reason and a suggested kind; the user decides.
 *  - Only additive changes to the classic data contract (new fields, string ids).
 *  - `runMigrations` never mutates its input.
 */
import { inferKind, LIST_KINDS } from './entry-kind.js';

/**
 * @typedef {import('./entry-kind.js').KindContext} KindContext
 * @typedef {{ entry: any, from: string, reason: 'kind-unknown'|'kind-conflict', suggested: string|null, note?: string, at: string, migration: string }} QuarantineRecord
 * @typedef {{ id: string, changed: number, notes: string[] }} MigrationReport
 * @typedef {{ id: string, run: (c: Record<string, any>, env: { ctx?: KindContext, now: string }) => MigrationReport }} Migration
 */

/** Lists V3 tags and checks. `weapons` is legacy read-only (schema decision 4) and is not touched. */
export const ENTRY_LIST_KEYS = Object.freeze(Object.keys(LIST_KINDS));

/** @param {any} entry */
const isEntryObject = entry => entry !== null && typeof entry === 'object' && !Array.isArray(entry);

/** @type {Migration} */
const idsToString = {
  id: '2026-11-ids-to-string',
  run(c) {
    let changed = 0;
    for (const key of ENTRY_LIST_KEYS) {
      const list = c[key];
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        if (isEntryObject(entry) && typeof entry.id === 'number' && Number.isFinite(entry.id)) {
          entry.id = String(entry.id);
          changed++;
        }
      }
    }
    return { id: this.id, changed, notes: changed ? [`${changed} numeric id(s) converted to string.`] : [] };
  }
};

/** @type {Migration} */
const progressionAlias = {
  id: '2026-11-progression-alias',
  run(c) {
    const hasNew = Array.isArray(c.levelProgression) && c.levelProgression.length > 0;
    const hasOld = Array.isArray(c.progression) && c.progression.length > 0;
    if (!hasNew && hasOld) {
      c.levelProgression = structuredClone(c.progression);
      return { id: this.id, changed: 1, notes: ['levelProgression filled from legacy `progression` (legacy field kept).'] };
    }
    return { id: this.id, changed: 0, notes: [] };
  }
};

/**
 * Tag `kind` (and `source: 'dm'`, `pack`) on every entry whose kind can be inferred and that
 * fits its list. Entries with no inferable kind go to quarantine.
 * Entries whose kind conflicts with their list are left for `misplaced-entries`.
 * @type {Migration}
 */
const kindTagging = {
  id: '2026-11-kind-tagging',
  run(c, { ctx, now }) {
    let changed = 0;
    const notes = [];
    for (const key of ENTRY_LIST_KEYS) {
      const list = c[key];
      if (!Array.isArray(list)) continue;
      /** @type {any[]} */
      const kept = [];
      for (const entry of list) {
        if (!isEntryObject(entry)) {
          kept.push(entry); // strings/nulls stay exactly as the classic sheet left them
          continue;
        }
        const r = inferKind(entry, { list: key, ctx });
        if (!r.kind) {
          pushQuarantine(c, { entry, from: key, reason: 'kind-unknown', suggested: null, at: now, migration: this.id });
          notes.push(`Quarantined "${entry.name ?? entry.id ?? '?'}" from ${key}: kind could not be determined.`);
          changed++;
          continue;
        }
        if (!r.conflict) {
          if (entry.kind !== r.kind) { entry.kind = r.kind; changed++; }
          // `origin`, not `source`: legacy `source` already holds text such as "Warblade Level 1".
          if (r.source === 'dm' && entry.origin !== 'dm') { entry.origin = 'dm'; changed++; }
          if (r.pack && entry.pack !== r.pack) { entry.pack = r.pack; changed++; }
        }
        kept.push(entry);
      }
      c[key] = kept;
    }
    return { id: this.id, changed, notes };
  }
};

/**
 * Entries whose explicit kind does not belong to the list they sit in (for example an ability
 * inside gearPool) are moved to quarantine with the suggested kind. They are not auto-moved.
 * @type {Migration}
 */
const misplacedEntries = {
  id: '2026-11-misplaced-entries',
  run(c, { ctx, now }) {
    let changed = 0;
    const notes = [];
    for (const key of ENTRY_LIST_KEYS) {
      const list = c[key];
      if (!Array.isArray(list)) continue;
      /** @type {any[]} */
      const kept = [];
      for (const entry of list) {
        if (!isEntryObject(entry)) { kept.push(entry); continue; }
        const r = inferKind(entry, { list: key, ctx });
        if (r.kind && r.conflict) {
          const note = possibleDuplicateNote(c, entry);
          pushQuarantine(c, { entry, from: key, reason: 'kind-conflict', suggested: r.kind, ...(note ? { note } : {}), at: now, migration: this.id });
          notes.push(`Quarantined "${entry.name ?? entry.id}" from ${key}: it is a ${r.kind}, not a ${key} entry.`);
          changed++;
          continue;
        }
        kept.push(entry);
      }
      c[key] = kept;
    }
    return { id: this.id, changed, notes };
  }
};

/** Ordered list. Never reorder or remove shipped ids; add new ones at the end. */
export const MIGRATIONS = Object.freeze([idsToString, progressionAlias, kindTagging, misplacedEntries]);

/**
 * @param {Record<string, any>} c
 * @param {QuarantineRecord} record
 */
function pushQuarantine(c, record) {
  if (!Array.isArray(c.quarantine)) c.quarantine = [];
  c.quarantine.push(record);
}

/**
 * Same-name entry already present in the list the quarantined entry is suggested for.
 * Informational only: nothing is merged or removed.
 * @param {Record<string, any>} c
 * @param {Record<string, any>} entry
 */
function possibleDuplicateNote(c, entry) {
  const stem = String(entry.name ?? '').trim().toLowerCase();
  if (!stem) return '';
  /** @type {string[]} */
  const hits = [];
  for (const key of ENTRY_LIST_KEYS) {
    const list = c[key];
    if (!Array.isArray(list)) continue;
    for (const e of list) {
      if (isEntryObject(e) && e !== entry && String(e.name ?? '').trim().toLowerCase().startsWith(stem)) {
        hits.push(`"${e.name}" (${e.id ?? 'no id'}) in ${key}`);
      }
    }
  }
  return hits.length ? `Possible duplicate of ${hits.slice(0, 3).join('; ')}.` : '';
}

/**
 * Apply pending migrations to a clone of `character`.
 * @param {Record<string, any>} character
 * @param {{ ctx?: KindContext, now?: string }} [options]
 * @returns {{ character: Record<string, any>, reports: MigrationReport[], applied: string[] }}
 */
export function runMigrations(character, { ctx, now = new Date().toISOString() } = {}) {
  const c = structuredClone(character);
  const done = new Set(Array.isArray(c.v3Migrations) ? c.v3Migrations : []);
  /** @type {MigrationReport[]} */
  const reports = [];
  /** @type {string[]} */
  const applied = [];
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    reports.push(m.run(c, { ctx, now }));
    applied.push(m.id);
  }
  if (applied.length > 0) c.v3Migrations = [...done, ...applied];
  return { character: c, reports, applied };
}

/**
 * Every entry object reachable in entry lists or quarantine. Used by lossless tests and diagnostics.
 * @param {Record<string, any>} c
 */
export function collectEntries(c) {
  /** @type {any[]} */
  const out = [];
  for (const key of ENTRY_LIST_KEYS) {
    if (Array.isArray(c[key])) out.push(...c[key]);
  }
  if (Array.isArray(c.quarantine)) out.push(...c.quarantine.map(q => q.entry));
  return out;
}
