// @ts-check
import { html } from '../../ui/html.js';

/**
 * Feats & Special Abilities showcase (plan section 7, step 4). Same layout and classes as the
 * classic accordion (char_progression.js `renderCoreFeatsAndSpecialAbilities`). Read-only.
 *
 * Differences from the classic showcase (docs/V3_DATA_SCHEMA.md section 11.6):
 *  - Nothing is deleted while rendering. The classic card first runs
 *    `pruneOrphanedLevelAbilitiesAndFeats`, which removes entries by name and source-text rules
 *    and saves the character.
 *  - Ability score increases written into level rows ("+1 Stat: INT") are not listed as feats.
 *    The classic sheet already skips them everywhere else with the same check.
 *  - Entries are listed by id; the same name twice with two ids shows twice. Name matching is
 *    kept only for legacy string entries and level-row strings (reader fallback).
 *  - Clicking a pill opens nothing yet (rule detail modal arrives later); the tooltip shows the
 *    entry's own text.
 */

/** Leading emoji and an optional "[Tag]" written by the classic level-up flow. */
const LEVEL_TAG = /^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/u;
const stripLevelTag = (/** @type {string} */ s) => s.replace(LEVEL_TAG, '').trim();

/** Same check the classic level table uses to keep ability increases out of the feat lists. */
const isAbilityIncrease = (/** @type {string} */ s) => s.includes('+1 Stat') || s.includes('Stat:');

/** Classic companion check (char_progression.js `isCharacterCompanionEligible`), by name. */
const COMPANION_NAMES = /animal companion|summon familiar|familiar|special mount|wild cohort|obtain familiar|improved familiar|draconic familiar|celestial familiar|dragonfamiliar|bonded mount/i;

/**
 * @typedef {{ key: string, name: string, category: string, type: string, tooltip: string, source: string, fromLevel: boolean }} ShowcaseEntry
 */

/** @param {any} e @param {string} name */
function tooltipOf(e, name) {
  if (!e || typeof e !== 'object') return 'View rule details';
  const cat = e.category || e.type || '';
  const desc = e.benefit || e.desc || '';
  if (desc) return `${name}${cat ? ` [${cat}]` : ''}\n${desc}`;
  return e.source || 'View rule details';
}

/**
 * @param {any[]} list @param {'feat'|'ability'} which
 * @returns {ShowcaseEntry[]}
 */
function fromList(list, which) {
  /** @type {ShowcaseEntry[]} */
  const out = [];
  const seenIds = new Set();
  const seenNames = new Set();
  for (const e of Array.isArray(list) ? list : []) {
    if (!e) continue;
    const name = String(typeof e === 'string' ? e : (e.name || '')).trim();
    if (!name) continue;
    if (typeof e === 'object' && e.id !== undefined && e.id !== null && e.id !== '') {
      if (seenIds.has(String(e.id))) continue;
      seenIds.add(String(e.id));
    } else {
      if (seenNames.has(name.toLowerCase())) continue; // legacy string entry
      seenNames.add(name.toLowerCase());
    }
    out.push({
      key: typeof e === 'object' && e.id !== undefined ? String(e.id) : `name:${name}`,
      name,
      category: which === 'feat' ? (typeof e === 'object' ? (e.category || 'Feat') : 'Feat') : '',
      type: which === 'ability' && typeof e === 'object' ? (e.type || '') : '',
      tooltip: tooltipOf(e, name),
      source: typeof e === 'object' ? (e.source || '') : '',
      fromLevel: false
    });
  }
  return out;
}

/**
 * Level-row strings not already on the character (classic reader fallback, by name).
 * @param {Record<string, any>} c @param {'feats'|'classFeatures'} field @param {ShowcaseEntry[]} existing
 * @returns {ShowcaseEntry[]}
 */
function fromLevelRows(c, field, existing) {
  const names = new Set(existing.map(e => e.name.toLowerCase()));
  /** @type {ShowcaseEntry[]} */
  const out = [];
  for (const row of Array.isArray(c.levelProgression) ? c.levelProgression : []) {
    for (const raw of Array.isArray(row?.[field]) ? row[field] : []) {
      if (typeof raw !== 'string' || !raw.trim() || isAbilityIncrease(raw)) continue;
      const name = stripLevelTag(raw);
      if (!name || names.has(name.toLowerCase())) continue;
      names.add(name.toLowerCase());
      const source = field === 'feats' ? `Level ${row.level || '?'}` : `${row.className || 'Class'} Level ${row.level || '?'}`;
      out.push({
        key: `level:${row.level}:${name}`, name,
        category: field === 'feats' ? 'Level Feat' : '', type: field === 'feats' ? '' : 'Ex',
        tooltip: source, source, fromLevel: true
      });
    }
  }
  return out;
}

/** @param {Record<string, any>} c */
export function isCompanionEligible(c) {
  if (c.companion && c.companion.baseMonsterId) return true;
  const nameOf = (/** @type {any} */ e) => (typeof e === 'string' ? e : (e?.name || ''));
  if ([...(c.feats || []), ...(c.specialAbilities || [])].some(e => COMPANION_NAMES.test(nameOf(e)))) return true;
  return (c.levelProgression || []).some((/** @type {any} */ p) =>
    [...(p?.feats || []), ...(p?.classFeatures || [])].some(s => typeof s === 'string' && COMPANION_NAMES.test(s)));
}

/** @param {Record<string, any>} c */
export function featsModel(c) {
  const ownFeats = fromList(c.feats, 'feat');
  const ownAbilities = fromList(c.specialAbilities, 'ability');
  return {
    feats: [...ownFeats, ...fromLevelRows(c, 'feats', ownFeats)],
    abilities: [...ownAbilities, ...fromLevelRows(c, 'classFeatures', ownAbilities)],
    companion: c.companion && c.companion.baseMonsterId ? 'bound' : isCompanionEligible(c) ? 'eligible' : 'locked'
  };
}

// ---------------------------------------------------------------- view

/** Pill classes per ability type (classic showcase). */
function abilityStyle(/** @type {string} */ type) {
  const t = type.toUpperCase();
  if (t === 'EX') return { pill: 'border-amber-600/50 text-amber-200 bg-amber-950/60', badge: 'bg-amber-900/80 text-amber-300 border border-amber-600/50', label: 'Ex' };
  if (t === 'SU') return { pill: 'border-purple-600/50 text-purple-200 bg-purple-950/70', badge: 'bg-purple-900/80 text-purple-300 border border-purple-600/50', label: 'Su' };
  if (t === 'SP') return { pill: 'border-sky-600/50 text-sky-200 bg-sky-950/70', badge: 'bg-sky-900/80 text-sky-300 border border-sky-600/50', label: 'Sp' };
  if (type) return { pill: 'border-purple-600/60 text-purple-200 bg-purple-950/80', badge: 'bg-emerald-900/80 text-emerald-300 border border-emerald-600/50', label: type };
  return { pill: 'border-purple-600/60 text-purple-200 bg-purple-950/80', badge: '', label: '' };
}

/** @param {ShowcaseEntry} f */
const FeatPill = f => html`
  <span title="${f.tooltip}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-950/80 text-indigo-200 border border-indigo-600/60 shadow-sm text-left" data-entry="${f.key}">
    <span class="text-amber-400 shrink-0" aria-hidden="true">🎖️</span>
    <span class="truncate" style="max-width: 170px;">${f.name}</span>
    ${f.category && f.category !== 'Feat' ? html`<span class="text-[9px] opacity-75 font-normal">(${f.category})</span>` : ''}
  </span>`;

/** @param {ShowcaseEntry} a */
const AbilityPill = a => {
  const s = abilityStyle(a.type);
  return html`
    <span title="${a.tooltip}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm text-left ${s.pill}" data-entry="${a.key}">
      <span class="shrink-0" aria-hidden="true">⚡</span>
      <span class="truncate" style="max-width: 170px;">${a.name}</span>
      ${s.label ? html`<span class="text-[9px] px-1 rounded font-mono font-bold ${s.badge}">${s.label}</span>` : ''}
    </span>`;
};

/**
 * @param {'bound'|'eligible'|'locked'} state
 * @param {any} stats  From the engine (engine-adapter `companionStats`), when bound.
 */
function CompanionCard(state, stats) {
  if (state === 'bound' && stats) {
    const typeLabel = stats.type === 'familiar' ? 'Familiar' : stats.type === 'special_mount' ? 'Special Mount' : 'Animal Companion';
    const icon = stats.type === 'familiar' ? '🦉' : stats.type === 'special_mount' ? '🐎' : '🐺';
    const traits = [...(stats.specialAbilities || []), ...(stats.monsterFeats || []), stats.bonusTricks ? `${stats.bonusTricks} Bonus Tricks` : null, stats.masterBonusText].filter(Boolean);
    const cell = 'bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80';
    const label = 'text-[9px] uppercase font-bold text-slate-400 block';
    return html`
      <div class="mt-3.5 border border-amber-500/40 rounded-xl bg-slate-900/90 p-3 shadow-md space-y-2">
        <div class="flex items-center gap-2 border-b border-slate-800 pb-2 min-w-0">
          <span class="text-base shrink-0" aria-hidden="true">${icon}</span>
          <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="text-xs font-black text-amber-300 truncate">${stats.customName}</span>
            <span class="text-[10px] text-slate-400 font-mono truncate">(${stats.baseName} • ${typeLabel})</span>
            <span class="text-[9px] font-mono font-bold px-1.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60">${stats.totalHd} HD</span>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div class="${cell}"><span class="${label}">Hit Points</span><span class="font-bold text-emerald-400">${stats.hp.current} / ${stats.hp.max}</span></div>
          <div class="${cell}"><span class="${label}">Armor Class</span><span class="font-bold text-amber-300">${stats.ac.total}</span> <span class="text-[8px] text-slate-500 font-normal">T ${stats.ac.touch} • FF ${stats.ac.flatFooted}</span></div>
          <div class="${cell}"><span class="${label}">Speed &amp; BAB</span><span class="font-bold text-sky-300">${stats.speed.land} ft</span> <span class="text-[8px] text-slate-500 font-normal">BAB +${stats.bab}</span></div>
          <div class="${cell}"><span class="${label}">Saves (F / R / W)</span><span class="font-bold text-purple-300">+${stats.saves.fort} / +${stats.saves.ref} / +${stats.saves.will}</span></div>
        </div>
        <div class="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-[11px] font-mono flex-wrap gap-2">
          ${['str', 'dex', 'con', 'int', 'wis', 'cha'].map(k => html`<div><strong class="text-slate-400">${k.toUpperCase()}</strong> <span class="text-white font-bold">${stats.abilities[k]}</span>${['int', 'cha'].includes(k) ? '' : html` <span class="text-amber-400 font-semibold">(+${stats.abilityMods[k]})</span>`}</div>`)}
        </div>
        <div class="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center gap-1.5 flex-wrap text-xs">
          <span class="text-[10px] font-bold text-amber-400 uppercase">Natural Attacks:</span>
          ${(stats.attacks || []).map((/** @type {any} */ atk) => html`<span class="font-mono text-white font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">${atk.name} ${atk.formattedAttack} (${atk.formattedDamage})</span>`)}
        </div>
        <div class="flex items-center gap-1.5 text-[10px] text-slate-300 flex-wrap pt-0.5">
          <span class="text-[9px] font-bold text-purple-400 uppercase">Traits &amp; Tricks:</span>
          ${traits.map(t => html`<span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-medium">${t}</span>`)}
        </div>
      </div>`;
  }
  if (state === 'eligible' || state === 'bound') {
    return html`
      <div class="mt-3.5 border border-dashed border-amber-600/50 rounded-xl bg-slate-950/40 p-2.5 flex items-center gap-2">
        <span class="text-lg" aria-hidden="true">🐾</span>
        <div>
          <span class="text-xs font-bold text-amber-300 block">Animal Companion / Familiar / Mount Available</span>
          <span class="text-[10px] text-slate-400">Character is eligible to bind an animal companion, summon a familiar, or call a paladin war mount.</span>
        </div>
      </div>`;
  }
  return html`
    <div class="mt-3.5 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 p-2.5 flex items-center gap-2">
      <span class="text-base" aria-hidden="true">🔒</span>
      <div>
        <span class="text-xs font-bold text-slate-400 block">Companion &amp; Mount Locked (Prerequisites Not Met)</span>
        <span class="text-[10px] text-slate-500">Add a required feat or class feature (<strong class="text-amber-400/90">Animal Companion</strong>, <strong class="text-purple-400/90">Summon Familiar</strong>, <strong class="text-sky-400/90">Special Mount</strong>, <strong class="text-amber-300/90">Obtain Familiar</strong>, or <strong class="text-emerald-400/90">Wild Cohort</strong>) first to bind a companion.</span>
      </div>
    </div>`;
}

/**
 * @param {Record<string, any>} c
 * @param {{ open: boolean, companionStats: any }} props
 */
export function FeatsShowcase(c, { open, companionStats }) {
  const m = featsModel(c);
  return html`
    <section class="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow" data-section="feats-abilities" aria-label="Feats and Special Abilities">
      <button type="button" data-action="toggle-feats" aria-expanded="${String(open)}" aria-controls="v3-feats-body"
        class="w-full bg-slate-900 hover:bg-slate-800/80 px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition select-none text-left">
        <span class="flex items-center gap-2.5 flex-wrap">
          <span class="text-base" aria-hidden="true">🎖️</span>
          <span class="text-xs font-black text-amber-400 uppercase tracking-wide">FEATS &amp; SPECIAL ABILITIES SHOWCASE</span>
          <span class="flex items-center gap-1.5">
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60">${m.feats.length} Feats</span>
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/60">${m.abilities.length} Abilities</span>
          </span>
        </span>
        <span class="text-xs text-slate-400 font-mono transition-transform duration-200 ${open ? 'rotate-180' : ''}" aria-hidden="true">▼</span>
      </button>
      <div id="v3-feats-body" class="${open ? 'block' : 'hidden'} p-3.5 border-t border-slate-800/80 bg-slate-950/60">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
              <div class="flex items-center gap-1.5">
                <span class="text-sm" aria-hidden="true">🎖️</span>
                <h3 class="text-xs font-bold text-amber-300 uppercase tracking-wide">Acquired Feats</h3>
              </div>
              <span class="text-[10px] text-slate-400 font-normal">From levels and race</span>
            </div>
            <div class="flex flex-wrap gap-1.5 items-start" style="min-height: 40px;">
              ${m.feats.length > 0 ? m.feats.map(FeatPill) : html`<div class="py-3 text-center text-slate-500 text-xs italic w-full">No feats recorded.</div>`}
            </div>
          </div>
          <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
              <div class="flex items-center gap-1.5">
                <span class="text-sm" aria-hidden="true">⚡</span>
                <h3 class="text-xs font-bold text-purple-300 uppercase tracking-wide">Special Abilities &amp; Racial Traits</h3>
              </div>
              <span class="text-[10px] text-slate-400 font-normal">Ex, Su, Sp &amp; Racial</span>
            </div>
            <div class="flex flex-wrap gap-1.5 items-start" style="min-height: 40px;">
              ${m.abilities.length > 0 ? m.abilities.map(AbilityPill) : html`<div class="py-3 text-center text-slate-500 text-xs italic w-full">No special abilities recorded.</div>`}
            </div>
          </div>
        </div>
        ${CompanionCard(m.companion, companionStats)}
      </div>
    </section>`;
}
