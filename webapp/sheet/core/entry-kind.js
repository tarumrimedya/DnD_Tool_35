// @ts-check
/**
 * Single authority for an entry's `kind` (docs/V3_DATA_SCHEMA.md section 2).
 *
 * Inference order (first match wins):
 *   1. an explicit, valid `kind` field
 *   2. SRD index lookup by id / baseItemId / sourceId
 *   3. `type` field, only when it names an entry type (never damage or bonus types)
 *   4. id prefix (SRD prefixes and custom prefixes)
 *   5. list membership, for lists that hold a single kind, when 2-4 gave no signal
 * An explicit signal that conflicts with the list the entry sits in is a conflict
 * (the entry belongs in quarantine). Names are never used.
 */

export const KINDS = Object.freeze([
  'weapon', 'armor', 'shield', 'ammo', 'magic-item', 'consumable', 'gear', 'crystal',
  'enhancement', 'material',
  'feat', 'flaw', 'ability', 'spell', 'power', 'maneuver', 'stance',
  'template', 'race', 'class', 'domain', 'deity', 'buff', 'condition', 'synergy', 'creature'
]);
const KIND_SET = new Set(KINDS);

export const GEAR_KINDS = Object.freeze(['weapon', 'armor', 'shield', 'ammo', 'magic-item', 'consumable', 'gear', 'crystal']);

/** Entry lists on the character and the kinds each may hold. `null` = any kind (multi-kind list). */
export const LIST_KINDS = Object.freeze({
  feats: ['feat', 'flaw'],
  specialAbilities: ['ability'],
  spells: ['spell', 'power'],
  maneuvers: ['maneuver', 'stance'],
  gearPool: GEAR_KINDS,
  consumables: ['consumable'],
  customClasses: ['class'],
  customDb: null
});

/** Default kind of a single-kind list (rule 2b). */
const LIST_DEFAULT_KIND = Object.freeze({
  feats: 'feat',
  specialAbilities: 'ability',
  spells: 'spell',
  customClasses: 'class',
  consumables: 'consumable'
});

/** SRD index `t` values (database/srd_index.json) -> kind. `DamageType` is not an entry. */
const SRD_TYPE_TO_KIND = Object.freeze({
  Weapon: 'weapon', Armor: 'armor', Shield: 'shield', Ammo: 'ammo', MagicItem: 'magic-item',
  Consumable: 'consumable', Gear: 'gear', Tool: 'gear', AugmentationCrystal: 'crystal',
  Enhancement: 'enhancement', Material: 'material',
  Feat: 'feat', SpecialAbility: 'ability', ClassAbility: 'ability', RacialTrait: 'ability',
  Spell: 'spell', Power: 'power', Maneuver: 'maneuver', Stance: 'stance',
  Race: 'race', Class: 'class', Domain: 'domain', Buff: 'buff', Condition: 'condition', Monster: 'creature'
});
/** Chunks whose index rows carry no `t`. */
const SRD_CHUNK_TO_KIND = Object.freeze({ 'srd_templates.json': 'template' });

/** Unambiguous id prefixes. `tob-` is excluded: it covers both maneuvers and stances. */
const ID_PREFIX_TO_KIND = Object.freeze({
  'feat-': 'feat', 'spl-': 'spell', 'pwr-': 'power', 'wpn-': 'weapon', 'arm-': 'armor', 'shd-': 'shield',
  'ammo-': 'ammo', 'mi-': 'magic-item', 'rod-': 'magic-item', 'stf-': 'magic-item', 'pot-': 'consumable',
  'oil-': 'consumable', 'psn-': 'consumable', 'gear-': 'gear', 'tool-': 'gear', 'crys-': 'crystal',
  'enh-': 'enhancement', 'mat-': 'material', 'tmpl-': 'template', 'race-': 'race', 'cls-': 'class',
  'cab-': 'ability', 'rab-': 'ability', 'dom-': 'domain', 'buf-': 'buff', 'cnd-': 'condition', 'mst-': 'creature',
  // custom prefixes. `boon_` is deliberately absent: it marks DM origin, not a kind
  // (real data has `boon_*` feats and `boon_*` abilities).
  'ability_': 'ability', 'feat_': 'feat', 'class_': 'class'
});

/** `type` values that name an entry type (lowercased). Damage/bonus types are deliberately absent. */
const ENTRY_TYPE_TO_KIND = Object.freeze({
  'feat': 'feat', 'flaw': 'flaw', 'spell': 'spell', 'power': 'power',
  'weapon': 'weapon', 'armor': 'armor', 'shield': 'shield', 'ammo': 'ammo',
  'magicitem': 'magic-item', 'magic item': 'magic-item', 'wondrous item': 'magic-item', 'ring': 'magic-item',
  'rod': 'magic-item', 'staff': 'magic-item', 'slotless item': 'magic-item',
  'consumable': 'consumable', 'potion': 'consumable', 'scroll': 'consumable', 'wand': 'consumable',
  'oil': 'consumable', 'poison': 'consumable',
  'gear': 'gear', 'tool': 'gear', 'augmentationcrystal': 'crystal', 'enhancement': 'enhancement', 'material': 'material',
  'special ability': 'ability', 'specialability': 'ability', 'class feature': 'ability', 'classability': 'ability',
  'racial trait': 'ability', 'racialtrait': 'ability',
  'dm boon': 'ability', 'dm grant': 'ability', 'boon': 'ability',
  'maneuver': 'maneuver', 'stance': 'stance', 'template': 'template', 'race': 'race',
  'class': 'class', 'base class': 'class', 'prestige class': 'class',
  'domain': 'domain', 'cleric domain': 'domain', 'deity': 'deity',
  'buff': 'buff', 'condition': 'condition', 'synergy': 'synergy', 'monster': 'creature'
});
const DM_TYPES = new Set(['dm boon', 'dm grant', 'boon']);

/**
 * @typedef {{ srdLookup?: (id: string) => ({ t?: string, f?: string } | undefined) }} KindContext
 * @typedef {{
 *   kind: string|null,
 *   via: 'kind-field'|'srd-index'|'id-prefix'|'type'|'list'|'none',
 *   source: 'dm'|null,
 *   pack: string|null,
 *   localId: string,
 *   conflict: boolean,
 *   listKind: string|null
 * }} KindResult
 */

/**
 * Split a pack-namespaced id: "pack_dm_draconic_boons:boon_x" -> { pack, localId }.
 * SRD and custom ids never contain ':'.
 * @param {unknown} id
 */
export function splitPackId(id) {
  const s = id === null || id === undefined ? '' : String(id);
  const i = s.indexOf(':');
  return i > 0 ? { pack: s.slice(0, i), localId: s.slice(i + 1) } : { pack: null, localId: s };
}

/** @param {string} localId */
function kindFromPrefix(localId) {
  const lower = localId.toLowerCase();
  for (const [prefix, kind] of Object.entries(ID_PREFIX_TO_KIND)) {
    if (lower.startsWith(prefix)) return kind;
  }
  return null;
}

/** @param {Record<string, any>} entry */
function isDmSourced(entry) {
  const type = String(entry.type ?? '').trim().toLowerCase();
  const category = String(entry.category ?? '').trim().toLowerCase();
  const { localId } = splitPackId(entry.id);
  return DM_TYPES.has(type) || DM_TYPES.has(category) || localId.toLowerCase().startsWith('boon_') || entry.origin === 'dm';
}

/**
 * @param {unknown} entry
 * @param {{ list?: string, ctx?: KindContext }} [options]
 * @returns {KindResult}
 */
export function inferKind(entry, { list, ctx } = {}) {
  const listAllowed = list && Object.prototype.hasOwnProperty.call(LIST_KINDS, list) ? LIST_KINDS[/** @type {keyof typeof LIST_KINDS} */ (list)] : null;
  const listKind = list ? (LIST_DEFAULT_KIND[/** @type {keyof typeof LIST_DEFAULT_KIND} */ (list)] ?? null) : null;
  const base = { source: null, pack: null, localId: '', conflict: false, listKind };

  if (!entry || typeof entry !== 'object') {
    return { ...base, kind: null, via: 'none' };
  }
  const e = /** @type {Record<string, any>} */ (entry);
  const { pack, localId } = splitPackId(e.id);
  const source = isDmSourced(e) ? 'dm' : null;
  const common = { ...base, source, pack, localId };

  /** @param {string|null} kind @param {KindResult['via']} via @returns {KindResult} */
  const finish = (kind, via) => {
    const conflict = Boolean(kind && listAllowed && !listAllowed.includes(kind));
    return { ...common, kind, via, conflict };
  };

  // 1. explicit kind
  if (typeof e.kind === 'string' && KIND_SET.has(e.kind)) return finish(e.kind, 'kind-field');

  // 2. SRD index
  if (ctx?.srdLookup) {
    for (const key of ['id', 'baseItemId', 'sourceId']) {
      const raw = e[key];
      if (raw === null || raw === undefined || typeof raw === 'object') continue;
      const row = ctx.srdLookup(splitPackId(raw).localId);
      if (!row) continue;
      const kind = (row.t && SRD_TYPE_TO_KIND[/** @type {keyof typeof SRD_TYPE_TO_KIND} */ (row.t)]) || (row.f && SRD_CHUNK_TO_KIND[/** @type {keyof typeof SRD_CHUNK_TO_KIND} */ (row.f)]) || null;
      if (kind) return finish(kind, 'srd-index');
    }
  }

  // 3. entry-type value of `type` (the field the user sets in the Master DB editor).
  //    It outranks id prefixes: real data has DM-granted feats with `type: 'Feat'` and ids like
  //    `boon_skill_ride_4` or `ability_*` that were minted by older code paths.
  const type = String(e.type ?? '').trim().toLowerCase();
  const byType = ENTRY_TYPE_TO_KIND[/** @type {keyof typeof ENTRY_TYPE_TO_KIND} */ (type)];
  if (byType) return finish(byType, 'type');

  // 4. id prefix
  const byPrefix = kindFromPrefix(localId);
  if (byPrefix) return finish(byPrefix, 'id-prefix');

  // 2b. list membership
  if (listKind) return finish(listKind, 'list');

  return { ...common, kind: null, via: 'none' };
}

/**
 * Build a KindContext from the parsed srd_index.json (`{ index: [{ id, t, f }] }`).
 * @param {{ index?: Array<{ id: string, t?: string, f?: string }> } | null | undefined} srdIndex
 * @returns {KindContext}
 */
export function createKindContext(srdIndex) {
  /** @type {Map<string, { t?: string, f?: string }>} */
  const byId = new Map();
  for (const row of srdIndex?.index ?? []) {
    if (row && row.id) byId.set(row.id, { t: row.t, f: row.f });
  }
  return { srdLookup: id => byId.get(id) };
}

/** List an entry of `kind` belongs in when added to the character, or null if it is not a list entry. */
export function listForKind(/** @type {string} */ kind) {
  if (kind === 'feat' || kind === 'flaw') return 'feats';
  if (kind === 'ability') return 'specialAbilities';
  if (kind === 'spell' || kind === 'power') return 'spells';
  if (kind === 'maneuver' || kind === 'stance') return 'maneuvers';
  if (GEAR_KINDS.includes(kind)) return 'gearPool';
  if (kind === 'buff' || kind === 'condition') return 'buffs';
  if (kind === 'template') return 'templates';
  return null; // race, class, deity, domain, creature: set via profile/level actions; enhancement, material, synergy: never standalone
}
