// @ts-check
/**
 * Sheet V3 persistence (Phase A: READ-ONLY).
 *
 * Reads the same localStorage keys as the classic sheet (`index.html` / char_hud.js `loadInitialData`)
 * so both pages show the same character. This module never writes to storage in Phase A.
 *
 * `resolveCharacter` is a pure function (no DOM, no storage) so it can be unit-tested in Node.
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
