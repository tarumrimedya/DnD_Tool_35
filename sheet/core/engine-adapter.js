// @ts-check
/**
 * The only place Sheet V3 touches the legacy engine globals (`RuleEngine`, `SrdCompendium`,
 * `SchemaMigrator`). Those files stay classic <script>s shared with the classic sheet and Hub;
 * V3 views never call `window.*` directly, they go through this adapter.
 */

/** @returns {any} */
const g = () => (typeof window !== 'undefined' ? window : globalThis);

export function getEngineAvailability() {
  const w = g();
  return {
    ruleEngine: Boolean(w.RuleEngine),
    compendium: Boolean(w.SrdCompendium && typeof w.SrdCompendium.init === 'function'),
    migrator: Boolean(w.SchemaMigrator && typeof w.SchemaMigrator.upgradeCharacterToV2 === 'function')
  };
}

/**
 * Start loading the SRD compendium (IndexedDB-first, network fallback). Never throws.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function initCompendium() {
  const w = g();
  if (!w.SrdCompendium || typeof w.SrdCompendium.init !== 'function') {
    return { ok: false, error: 'SrdCompendium script not loaded.' };
  }
  try {
    const result = await w.SrdCompendium.init({ basePath: 'database' });
    return result === false ? { ok: false, error: 'srd_index.json unavailable.' } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Apply the legacy V2 upgrade to a private clone so V3 sees the same normalized shape as the
 * classic sheet. The input object is never mutated, and nothing is written back to storage.
 * @param {Record<string, any>} character
 * @returns {Record<string, any>}
 */
export function normalizeCharacterV2(character) {
  const w = g();
  const clone = structuredClone(character);
  if (w.SchemaMigrator && typeof w.SchemaMigrator.upgradeCharacterToV2 === 'function') {
    try {
      return w.SchemaMigrator.upgradeCharacterToV2(clone) || clone;
    } catch (e) {
      console.warn('[Sheet V3] upgradeCharacterToV2 failed; showing raw snapshot.', e);
    }
  }
  return clone;
}
