// @ts-check
/**
 * Sheet V3 persistence.
 *
 * Reads and writes the same localStorage keys as the classic sheet (char_hud.js `loadInitialData`
 * and `_commitLocalStorageSave`) so both pages show the same character.
 *
 * Writing (Phase B, docs/V3_DATA_SCHEMA.md section 7):
 *  - Only the tab holding the writer lock saves (writer-lock.js).
 *  - Before every write, the stored copies are compared with the ones this tab last loaded or
 *    wrote. If one changed (the classic sheet, the Hub or another tab wrote), nothing is written.
 *  - What is written is the classic shape (storage-codec.js), with a new `lastModified`.
 *  - Cloud upload is left to the classic sheet: on its next load it keeps a local copy that is
 *    newer than the cloud and pushes it (char_hud.js loader, `localModTs > cloudTs`).
 *
 * Everything except `readStoredSnapshots` and `writePlannedSave` is pure and unit-tested in Node.
 */

export const STORAGE_KEYS = Object.freeze({
  character: 'dnd35_character',
  activeId: 'dnd35_active_character_id',
  hubDb: 'dnd35_hub_db'
});

/** @param {any} c */
function snapshotTs(c) {
  if (!c || typeof c !== 'object') return 0;
  const a = c.lastModified ? new Date(c.lastModified).getTime() : 0;
  const b = c._cloudUpdatedAt ? new Date(c._cloudUpdatedAt).getTime() : 0;
  return Math.max(Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0);
}

/** @param {any} v */
const nonEmptyArray = v => Array.isArray(v) && v.length > 0;

/**
 * Decide which stored snapshot is the active character, mirroring the precedence of the
 * classic loader without any of its side effects (no storage writes, no input mutation).
 *
 * Precedence:
 *  1. Hub entry for `requestedId` with `fullData`: use the newer of hub `fullData` and the
 *     standalone `dnd35_character` snapshot (if that snapshot belongs to the same id).
 *     Hub-level fields the DM owns are then overlaid (name, NPC flags, campaign, CR, DM HP).
 *  2. Otherwise the standalone `dnd35_character` snapshot, if it matches the request (or no id was requested).
 *
 * @param {{ hubDb: any, saved: any, requestedId: string|null }} input
 * @returns {{ character: Record<string, any>|null, source: 'hub'|'hub+newer-local'|'local'|'hub-stub'|'none', notes: string[] }}
 */
export function resolveCharacter({ hubDb, saved, requestedId }) {
  /** @type {string[]} */
  const notes = [];
  const savedMatches = Boolean(saved && requestedId && (saved.id === requestedId || saved._hubId === requestedId));

  const hubChars = hubDb && Array.isArray(hubDb.characters) ? hubDb.characters : [];
  const found = requestedId ? hubChars.find(/** @param {any} c */ c => c && c.id === requestedId) : null;

  if (found && found.fullData) {
    const useLocal = savedMatches && snapshotTs(saved) > snapshotTs(found.fullData);
    const base = structuredClone(useLocal ? saved : found.fullData);
    base._hubId = requestedId;

    // A real (non-default) roster name in the Hub wins over the sheet's own name.
    const isFoundDefaultName = !found.name || found.name === 'New Character';
    if (!isFoundDefaultName && base.name !== found.name) {
      notes.push(`Name taken from Hub roster ("${found.name}").`);
      base.name = found.name;
    }
    if (found.isNpc !== undefined && base.isNpc === undefined) base.isNpc = found.isNpc;
    if (found.campaignId !== undefined) base.campaignId = found.campaignId;
    if (found.cr && !base.cr) base.cr = found.cr;

    if (!nonEmptyArray(base.levelProgression)) {
      const fallback = [found.levelProgression, base.progression, found.progression].find(nonEmptyArray);
      if (fallback) {
        base.levelProgression = structuredClone(fallback);
        notes.push('Level progression filled from a legacy field.');
      }
    }
    if (!nonEmptyArray(base.feats) && Array.isArray(found.feats)) base.feats = structuredClone(found.feats);
    if (!nonEmptyArray(base.specialAbilities) && Array.isArray(found.specialAbilities)) base.specialAbilities = structuredClone(found.specialAbilities);

    // ADR-005: DM vitals authority. Hub HP wins when its timestamp is at least as new as the player's.
    if (found.currentHp !== undefined) {
      const hubHpTs = Number(found.lastHpUpdateTs) || 0;
      const playerHpTs = Number(base.hp?._lastPlayerChangeTs) || 0;
      if (hubHpTs >= playerHpTs) {
        base.hp = Object.assign({}, base.hp, {
          current: found.currentHp,
          max: found.maxHp || base.hp?.max || 10,
          temp: found.tempHp || 0
        });
        notes.push('HP taken from DM (Hub) vitals.');
      }
    }
    return { character: base, source: useLocal ? 'hub+newer-local' : 'hub', notes };
  }

  if (found && !found.fullData) {
    notes.push('Hub entry has no full sheet yet. Open it once in the classic sheet to create one.');
    return { character: null, source: 'hub-stub', notes };
  }

  if (saved && (!requestedId || savedMatches)) {
    return { character: structuredClone(saved), source: 'local', notes };
  }

  if (requestedId) notes.push(`No stored character matches id "${requestedId}".`);
  return { character: null, source: 'none', notes };
}

/**
 * Browser-only: read raw snapshots from localStorage. Every access is guarded because storage
 * can be blocked (private mode, disabled site data) or hold malformed JSON.
 * @param {Storage|undefined} storage
 * @param {URLSearchParams} params
 */
export function readStoredSnapshots(storage, params) {
  /** @param {string} key */
  const readJson = key => {
    try {
      const raw = storage?.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  let activeId = null;
  try {
    activeId = storage?.getItem(STORAGE_KEYS.activeId) || null;
  } catch {
    activeId = null;
  }
  return {
    hubDb: readJson(STORAGE_KEYS.hubDb),
    saved: readJson(STORAGE_KEYS.character),
    requestedId: params.get('id') || activeId
  };
}

// ================================================================ Phase B: saving

/**
 * @typedef {{ saved: string|null, hub: string|null }} StoredFingerprint
 *   JSON of the stored copies of one character: `saved` is `dnd35_character` when it holds this
 *   character (null when it is empty or holds another one), `hub` is the Hub entry's `fullData`.
 */

/**
 * The id a character is stored under (same precedence as the classic save).
 * @param {Record<string, any>|null} c @param {string|null} [requestedId]
 * @returns {string|null}
 */
export function characterIdOf(c, requestedId = null) {
  return (c && (c._hubId || c.id)) || requestedId || null;
}

/** @param {any} saved @param {string} id */
const savedBelongsTo = (saved, id) => Boolean(saved && typeof saved === 'object' && (saved._hubId === id || saved.id === id));

/** @param {any} hubDb @param {string} id */
function hubEntryOf(hubDb, id) {
  const list = hubDb && Array.isArray(hubDb.characters) ? hubDb.characters : [];
  return list.find(/** @param {any} c */ c => c && c.id === id) || null;
}

/**
 * @param {{ hubDb: any, saved: any }} snapshots @param {string} id
 * @returns {StoredFingerprint}
 */
export function storedFingerprint({ hubDb, saved }, id) {
  const hub = hubEntryOf(hubDb, id);
  return {
    saved: savedBelongsTo(saved, id) ? JSON.stringify(saved) : null,
    hub: hub && hub.fullData ? JSON.stringify(hub.fullData) : null
  };
}

/**
 * Decide what to write. Pure: returns new JSON strings, never touches storage or its inputs.
 *
 * A stored copy counts as changed by someone else when it now holds this character and differs
 * from `baseline`. `dnd35_character` now holding another character is not a conflict (the classic
 * sheet opened someone else); that key is then left alone and only the Hub entry is written.
 *
 * @param {{ hubDb: any, saved: any, id: string, baseline: StoredFingerprint, stored: Record<string, any>, now: string }} input
 *   `stored` is the character in classic shape (storage-codec.js `encodeForStorage`).
 * @returns {{ ok: true, writes: { character?: string, hubDb?: string }, stored: Record<string, any>, baseline: StoredFingerprint }
 *          | { ok: false, reason: 'conflict'|'no-target', changed: string[] }}
 */
export function planSave({ hubDb, saved, id, baseline, stored, now }) {
  const current = storedFingerprint({ hubDb, saved }, id);
  const changed = [];
  if (current.saved !== null && current.saved !== baseline.saved) changed.push(STORAGE_KEYS.character);
  if (current.hub !== null && current.hub !== baseline.hub) changed.push(`${STORAGE_KEYS.hubDb} (fullData)`);
  if (changed.length > 0) return { ok: false, reason: 'conflict', changed };

  const next = { ...structuredClone(stored), lastModified: now };
  const json = JSON.stringify(next);
  /** @type {{ character?: string, hubDb?: string }} */
  const writes = {};
  if (!saved || savedBelongsTo(saved, id)) writes.character = json;

  const hubEntry = hubEntryOf(hubDb, id);
  if (hubEntry) {
    const db = structuredClone(hubDb);
    const entry = hubEntryOf(db, id);
    // Same summary fields the classic save mirrors without the engine; derived numbers (AC,
    // saves, attack) are refreshed by the classic sheet. DM-owned HP fields are never touched.
    entry.name = next.name || entry.name;
    entry.race = next.race || entry.race;
    entry.classes = next.classes || (next.class ? `${next.class} ${next.level || 1}` : entry.classes);
    entry.level = Number(next.level) || entry.level;
    entry.maxHp = next.hp?.max ?? entry.maxHp;
    entry.fullData = next;
    writes.hubDb = JSON.stringify(db);
  }
  if (!writes.character && !writes.hubDb) return { ok: false, reason: 'no-target', changed: [] };
  return {
    ok: true,
    writes,
    stored: next,
    baseline: { saved: writes.character ? json : null, hub: writes.hubDb ? json : current.hub }
  };
}

/**
 * Browser-only: apply a plan from `planSave`. `dnd35_character` first, then the Hub, the same
 * order as the classic save.
 * @param {Storage|undefined} storage
 * @param {{ character?: string, hubDb?: string }} writes
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function writePlannedSave(storage, writes) {
  if (!storage) return { ok: false, error: 'Browser storage is not available.' };
  try {
    if (writes.character !== undefined) storage.setItem(STORAGE_KEYS.character, writes.character);
    if (writes.hubDb !== undefined) storage.setItem(STORAGE_KEYS.hubDb, writes.hubDb);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
