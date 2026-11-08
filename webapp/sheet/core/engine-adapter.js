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
 * Fetch the SRD index used for `kind` inference. Never throws; returns null when unavailable.
 * @returns {Promise<any|null>}
 */
export async function loadSrdIndex() {
  try {
    const res = await fetch('database/srd_index.json');
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * Active consolidated skill groups for a character, from the forked engine (the single source the
 * engine itself uses for skill bonuses). Returns [] when the engine is missing or the rule is off.
 * @param {Record<string, any>|null} character
 * @returns {Array<Record<string, any>>}
 */
export function getConsolidatedSkillGroups(character) {
  const w = g();
  if (!character || !w.RuleEngine || typeof w.RuleEngine.getConsolidatedSkillGroups !== 'function') return [];
  return w.RuleEngine.getConsolidatedSkillGroups(character);
}

/**
 * Apply the legacy V1 -> V2 upgrade to a private clone, only for characters still below
 * `schemaVersion: 2`. V2 characters are passed through untouched (as a clone) because the legacy
 * normalizer also drops null entries and folds child rows, which V3 must not do silently.
 * The input object is never mutated, and nothing is written back to storage.
 * @param {Record<string, any>} character
 * @returns {Record<string, any>}
 */
export function normalizeCharacterV2(character) {
  const w = g();
  const clone = structuredClone(character);
  if (Number(clone.schemaVersion) >= 2) return clone;
  if (w.SchemaMigrator && typeof w.SchemaMigrator.upgradeCharacterToV2 === 'function') {
    try {
      return w.SchemaMigrator.upgradeCharacterToV2(clone) || clone;
    } catch (e) {
      console.warn('[Sheet V3] upgradeCharacterToV2 failed; showing raw snapshot.', e);
    }
  }
  return clone;
}

/**
 * Active character templates resolved by the forked engine (SRD compendium first, then the
 * character's own library). Empty until the compendium is loaded or when the engine is missing.
 * @param {Record<string, any>|null} character
 * @returns {Array<Record<string, any>>}
 */
export function getActiveTemplates(character) {
  const w = g();
  if (!character || !w.RuleEngine || typeof w.RuleEngine.getCharacterActiveTemplateEntries !== 'function') return [];
  try {
    return w.RuleEngine.getCharacterActiveTemplateEntries(character) || [];
  } catch (e) {
    console.warn('[Sheet V3] Template lookup failed.', e);
    return [];
  }
}
