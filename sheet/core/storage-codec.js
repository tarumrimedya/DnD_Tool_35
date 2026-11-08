// @ts-check
/**
 * Sheet V3 storage codec (docs/V3_DATA_SCHEMA.md section 7.1).
 *
 * V3 works on an in-memory shape that differs from what the classic sheet reads:
 *  - quarantined entries live in `character.quarantine`, outside their list
 *  - every list entry id is a string
 *
 * The classic sheet must keep seeing every entry exactly where it was. So the stored shape is
 * always the classic shape plus additive fields only:
 *  - a quarantined entry is written back into its `from` list with a `v3Review` marker
 *  - an id that was a number when loaded is written back as that number
 *
 * `decodeStored` and `encodeForStorage` are pure and inverse: encode(decode(x)) keeps every entry.
 */
import { ENTRY_LIST_KEYS } from './migrations.js';

/**
 * @typedef {Record<string, any>} Character
 * @typedef {{ numericIds: string[] }} CodecMemo  Ids that were numbers in storage, per load.
 */

/** Marker field on a stored entry that V3 shows under Needs Review. */
export const REVIEW_MARKER = 'v3Review';

/** @param {any} e */
const isEntryObject = e => e !== null && typeof e === 'object' && !Array.isArray(e);

/**
 * Stored shape to V3 in-memory shape. Does not mutate `stored`.
 * Entries carrying `v3Review` move back into `quarantine`; numeric ids become strings.
 * @param {Character} stored
 * @returns {{ character: Character, memo: CodecMemo }}
 */
export function decodeStored(stored) {
  const c = structuredClone(stored);
  /** @type {Set<string>} */
  const numericIds = new Set();
  /** @type {any[]} */
  const lifted = [];
  for (const key of ENTRY_LIST_KEYS) {
    const list = c[key];
    if (!Array.isArray(list)) continue;
    /** @type {any[]} */
    const kept = [];
    for (const entry of list) {
      if (isEntryObject(entry) && typeof entry.id === 'number' && Number.isFinite(entry.id)) {
        numericIds.add(String(entry.id));
        entry.id = String(entry.id);
      }
      if (isEntryObject(entry) && isEntryObject(entry[REVIEW_MARKER])) {
        const { [REVIEW_MARKER]: review, ...rest } = entry;
        lifted.push({ ...review, entry: rest, from: key });
        continue;
      }
      kept.push(entry);
    }
    c[key] = kept;
  }
  if (lifted.length > 0) c.quarantine = [...(Array.isArray(c.quarantine) ? c.quarantine : []), ...lifted];
  return { character: c, memo: { numericIds: [...numericIds].sort() } };
}

/**
 * V3 in-memory shape to stored shape. Does not mutate `character`.
 * @param {Character} character
 * @param {CodecMemo} [memo]
 * @returns {Character}
 */
export function encodeForStorage(character, memo = { numericIds: [] }) {
  const c = structuredClone(character);
  const numeric = new Set(memo.numericIds);
  const records = Array.isArray(c.quarantine) ? c.quarantine : [];
  delete c.quarantine;
  for (const record of records) {
    if (!record || !isEntryObject(record.entry)) continue;
    const { entry, from, ...review } = record;
    const key = ENTRY_LIST_KEYS.includes(from) ? from : 'gearPool';
    c[key] = [...(Array.isArray(c[key]) ? c[key] : []), { ...entry, [REVIEW_MARKER]: review }];
  }
  if (numeric.size > 0) {
    for (const key of ENTRY_LIST_KEYS) {
      const list = c[key];
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        if (isEntryObject(entry) && typeof entry.id === 'string' && numeric.has(entry.id)) entry.id = Number(entry.id);
      }
    }
  }
  return c;
}
