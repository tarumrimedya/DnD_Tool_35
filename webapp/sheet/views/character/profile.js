// @ts-check
import { html } from '../../ui/html.js';

/**
 * Character Profile card (plan section 7, step 2). Same look and the same values as the classic
 * card (`index.html` "Character Identity & Profile Overview Card", filled by char_hud.js
 * `renderCharacterProfile`). Read-only: the edit flows arrive in step 6.
 *
 * `profileModel` is pure (no DOM, no engine) so its values are unit-tested against the classic
 * rules; the view only lays them out.
 */

/**
 * Display emoji used when there is no portrait. Same rules as char_hud.js
 * `getDynamicCharacterEmoji` (cosmetic only, never used for rules); Turkish fallbacks kept so
 * legacy saved characters keep their icon.
 * @param {string} race @param {string} gender @param {string} classes
 */
export function characterEmoji(race = '', gender = '', classes = '') {
  const r = race.toLowerCase().trim();
  const g = gender.toLowerCase().trim();
  const c = classes.toLowerCase().trim();
  const isFemale = g.includes('kad') || g.includes('kız') || g.includes('kiz') || g.includes('fem') || g.includes('woman') || g === 'f';

  const isElf = r.includes('elf');
  const isDwarf = r.includes('dwarf') || r.includes('cüce') || r.includes('cuce');
  const isOrc = r.includes('orc') || r.includes('ork');
  const isHalfling = r.includes('halfling') || r.includes('buçuk') || r.includes('bucuk') || r.includes('gnome') || r.includes('gnom');
  const isDragon = r.includes('dragon') || r.includes('ejder') || r.includes('kobold');
  const isTiefling = r.includes('tiefling') || r.includes('fiend') || r.includes('demon');
  const isAasimar = r.includes('aasimar') || r.includes('celestial') || r.includes('angel') || r.includes('melek');

  const isArcane = ['sorcerer', 'wizard', 'mage', 'büyü', 'buyu', 'warmage', 'warlock'].some(k => c.includes(k));
  const isMartial = ['warblade', 'fighter', 'barbarian', 'crusader', 'swordsage', 'knight', 'savaş'].some(k => c.includes(k));
  const isDivine = ['cleric', 'paladin', 'druid', 'rahip', 'favored'].some(k => c.includes(k));
  const isRogue = ['rogue', 'scout', 'ninja', 'assassin', 'hırsız', 'hirsiz', 'thief'].some(k => c.includes(k));
  const isRanger = ['ranger', 'avcı', 'avci'].some(k => c.includes(k));
  const isBard = c.includes('bard') || c.includes('ozan');
  const isMonk = ['monk', 'keşiş', 'kesis'].some(k => c.includes(k));

  const wizard = isFemale ? '🧙‍♀️' : '🧙‍♂️';
  const elf = isFemale ? '🧝‍♀️' : '🧝‍♂️';
  if (isDragon) return '🐲';
  if (isTiefling) return '😈';
  if (isOrc) return isArcane ? wizard : '👹';
  if (isAasimar) return '👼';
  if (isArcane) return isElf ? elf : isDwarf ? '🧔' : wizard;
  if (isBard) return '🪕';
  if (isMonk) return isFemale ? '🧘‍♀️' : '🧘‍♂️';
  if (isRanger) return isElf ? elf : '🏹';
  if (isRogue) return '🥷';
  if (isDivine) {
    if (c.includes('druid')) return '🌿';
    if (c.includes('paladin')) return '🛡️';
    return isFemale ? '🧝‍♀️' : '☀️';
  }
  if (isMartial) {
    if (c.includes('barbarian')) return '🪓';
    if (isDwarf) return '🧔';
    if (isElf) return elf;
    return isFemale ? '🤺' : '⚔️';
  }
  if (isDwarf) return '🧔';
  if (isElf) return elf;
  if (isHalfling) return isFemale ? '🧑‍🌾' : '🧒';
  return wizard;
}

/** Legacy Turkish gender values display in English (classic `renderCharacterProfile`). */
const displayGender = (/** @type {unknown} */ raw) => {
  const v = String(raw ?? 'Male').trim();
  if (/^erkek$/i.test(v)) return 'Male';
  if (/^kad[ıi]n$/i.test(v)) return 'Female';
  return String(raw ?? 'Male');
};

/** CSS values copied into a style attribute must be plain position/size tokens. */
const safeCss = (/** @type {unknown} */ v, /** @type {string} */ fallback) =>
  typeof v === 'string' && /^[\w\s.%-]{1,40}$/.test(v) ? v : fallback;

/**
 * @typedef {{ id: string, name: string, levelAdjustment: number }} ProfileTemplate
 * @typedef {{ text: string, tone: 'cr'|'npc'|'pc' }} LevelBadge
 */

/**
 * Every value the Profile card shows, computed the way the classic card computes it.
 * @param {Record<string, any>} c
 * @param {Array<Record<string, any>>} activeTemplates  From the engine (engine-adapter `getActiveTemplates`).
 */
export function profileModel(c, activeTemplates = []) {
  const race = c.race || 'Human';
  const gender = displayGender(c.gender);
  const templates = activeTemplates.map(t => ({ id: String(t.id ?? t.name ?? ''), name: String(t.name ?? t.id ?? ''), levelAdjustment: Number(t.levelAdjustment) || 0 }));
  const totalLa = Number(c.levelAdjustment) || templates.reduce((sum, t) => sum + t.levelAdjustment, 0);
  const level = (Array.isArray(c.levelProgression) ? c.levelProgression.filter(p => p && p.active !== false).length : 0) || Number(c.level) || 1;
  const ecl = level + totalLa;

  /** @type {LevelBadge} */
  const levelBadge = c.isNpc && c.cr ? { text: `CR ${c.cr}`, tone: 'cr' }
    : c.isNpc ? { text: `NPC • Lvl ${level}${totalLa > 0 ? ` (ECL ${ecl})` : ''}`, tone: 'npc' }
    : { text: totalLa > 0 ? `Level ${level} • ECL ${ecl}` : `Level ${level}`, tone: 'pc' };

  const s = c.templateSummary || {};
  /** @type {Array<{ tone: string, text: string }>} */
  const pills = [];
  if (templates.length > 0) {
    if (s.creatureType) pills.push({ tone: 'indigo', text: `Type: ${s.creatureType}` });
    if (Array.isArray(s.dr) && s.dr.length > 0) pills.push({ tone: 'amber', text: `🛡️ DR ${s.dr.join(' • ')}` });
    if (Number(s.sr) > 0) pills.push({ tone: 'purple', text: `🔮 SR ${s.sr}` });
    if (Number(s.fastHealing) > 0) pills.push({ tone: 'emerald', text: `💚 Fast Healing ${s.fastHealing}` });
    if (Number(s.turnResistance) > 0) pills.push({ tone: 'slate', text: `☀️ Turn Res +${s.turnResistance}` });
    if (Array.isArray(s.immunities) && s.immunities.length > 0) {
      pills.push({ tone: 'sky', text: `Immunities: ${s.immunities.slice(0, 5).join(', ')}${s.immunities.length > 5 ? ` (+${s.immunities.length - 5})` : ''}` });
    }
    if (Array.isArray(s.resistances) && s.resistances.length > 0) pills.push({ tone: 'teal', text: `Resist: ${s.resistances.join(', ')}` });
    if (Array.isArray(s.damageParts)) {
      for (const dp of s.damageParts) pills.push({ tone: 'rose', text: `🔥 ${dp.source || 'Attack'}: ${dp.dice}${dp.bonus ? `+${dp.bonus}` : ''} ${dp.type || ''}` });
    }
  }

  return {
    name: c.name || 'Unnamed Character',
    race,
    raceLabel: c.race || 'Unspecified',
    classes: c.classes || 'Unspecified',
    hitDie: c.hitDie || '-',
    alignment: c.alignment || '-',
    deity: c.deity || '-',
    size: String(c.size || 'Medium').replace(/\s*\(Orta\)\s*/i, '').trim() || 'Medium',
    genderAge: `${gender || 'Unspecified'}, ${c.age ? `Age ${c.age}` : '-'}`,
    heightWeight: `${c.height || '-'}, ${c.weight || '-'}`,
    emoji: characterEmoji(race, gender, c.classes || ''),
    portrait: c.portrait ? { url: String(c.portrait), position: safeCss(c.portraitPosition, '50% 20%'), fit: safeCss(c.portraitFit, 'cover') } : null,
    levelBadge,
    templates,
    templateBadge: templates.length > 0 ? `🧬 ${templates.map(t => t.name).join(' + ')}${totalLa > 0 ? ` (LA +${totalLa})` : ''}` : null,
    totalLa,
    ecl,
    pills
  };
}

/** Badge classes per level badge tone (classic `renderCharacterProfile`). */
const LEVEL_BADGE_CLASS = {
  cr: 'badge bg-rose-950 text-rose-300 border border-rose-700/70 text-[10px] font-bold',
  npc: 'badge bg-amber-950 text-amber-300 border border-amber-700/70 text-[10px] font-bold',
  pc: 'badge bg-emerald-950 text-emerald-300 border border-emerald-700/70 text-[10px] font-bold'
};

/** Template summary pill classes per tone (classic `renderCharacterProfile`). */
const PILL_CLASS = /** @type {Record<string, string>} */ ({
  indigo: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60',
  amber: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
  purple: 'bg-purple-950/80 text-purple-200 border-purple-700/60',
  emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
  slate: 'bg-slate-900 text-slate-200 border-slate-700',
  sky: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
  teal: 'bg-teal-950/80 text-teal-300 border-teal-700/60',
  rose: 'bg-rose-950/80 text-rose-300 border-rose-700/60'
});

/** @param {NonNullable<ReturnType<typeof profileModel>['portrait']>} p */
const portraitStyle = p => `background-image: url(${JSON.stringify(p.url)}); background-position: ${p.position}; background-size: ${p.fit};`;

/** @param {ReturnType<typeof profileModel>} m */
function TemplateSummary(m) {
  if (m.templates.length === 0) return html``;
  return html`
    <div class="mt-2.5 bg-gradient-to-r from-purple-950/50 via-slate-950 to-slate-950 border border-purple-500/50 rounded-xl p-2.5 text-xs space-y-1.5 shadow-inner">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1">
            <span>🧬</span>
            <span>Active Templates:</span>
          </span>
          ${m.templates.map(t => html`
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-900/60 text-white border border-purple-500/70 font-bold text-[11px] shadow-sm">
              <span>${t.name}</span>
              <span class="text-[9px] font-mono text-purple-200 bg-purple-950/80 px-1 rounded">LA +${t.levelAdjustment}</span>
            </span>`)}
        </div>
        <div class="flex items-center gap-2 text-[10px] font-mono">
          <span class="px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-500/40 font-bold">Total LA: +${m.totalLa} • ECL: ${m.ecl}</span>
        </div>
      </div>
      ${m.pills.length > 0 ? html`
        <div class="flex flex-wrap items-center gap-1.5 text-[10px] pt-1 border-t border-purple-900/40">
          ${m.pills.map(p => html`<span class="px-1.5 py-0.5 rounded ${PILL_CLASS[p.tone]} border font-semibold">${p.text}</span>`)}
        </div>` : ''}
    </div>`;
}

/**
 * @param {Record<string, any>} c
 * @param {Array<Record<string, any>>} activeTemplates
 */
export function ProfileCard(c, activeTemplates) {
  const m = profileModel(c, activeTemplates);
  const cell = 'bg-slate-950/60 p-2 rounded-lg border border-slate-800';
  const label = 'text-[10px] text-slate-400 uppercase font-bold block';
  return html`
    <section class="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/60 border border-slate-700/80 rounded-xl p-4 shadow-md space-y-3" data-section="profile" aria-labelledby="v3-profile-name">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-2xl shadow-inner border border-indigo-400/40 overflow-hidden shrink-0">
            ${m.portrait
              ? html`<div class="w-full h-full rounded-xl bg-no-repeat shadow" style="${portraitStyle(m.portrait)}" role="img" aria-label="Portrait of ${m.name}"></div>`
              : html`<span class="text-2xl" aria-hidden="true">${m.emoji}</span>`}
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 id="v3-profile-name" class="text-base font-extrabold text-white tracking-wide">${m.name}</h2>
              <span class="badge bg-indigo-950 text-indigo-300 border border-indigo-700/70 text-[10px] font-bold">${m.race}</span>
              ${m.templateBadge ? html`<span class="badge bg-purple-950 text-purple-200 border border-purple-500/70 text-[10px] font-bold" title="Active Character Template(s) &amp; Effective Character Level (ECL)">${m.templateBadge}</span>` : ''}
              <span class="${LEVEL_BADGE_CLASS[m.levelBadge.tone]}">${m.levelBadge.text}</span>
            </div>
            <div class="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
              <span class="text-purple-300 font-semibold">${m.classes}</span>
              <span aria-hidden="true">•</span>
              <span class="text-slate-400 font-mono" title="Hit Die">${m.hitDie}</span>
            </div>
          </div>
        </div>
        <button type="button" disabled class="w-40 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs px-3 rounded-lg shadow inline-flex items-center justify-center gap-1.5 whitespace-nowrap opacity-50" title="Profile editing arrives in a later step. Use the classic sheet for now.">
          <span aria-hidden="true">📜</span>
          <span>Character Profile</span>
        </button>
      </div>

      <dl class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
        <div class="${cell}"><dt class="${label}">Race</dt><dd class="text-indigo-300 font-bold">${m.raceLabel}</dd></div>
        <div class="${cell}"><dt class="${label}">Alignment</dt><dd class="text-amber-300 font-semibold">${m.alignment}</dd></div>
        <div class="${cell}"><dt class="${label}">Deity</dt><dd class="text-sky-300 font-semibold">${m.deity}</dd></div>
        <div class="${cell}"><dt class="${label}">Size</dt><dd class="text-emerald-300 font-semibold">${m.size}</dd></div>
        <div class="${cell}"><dt class="${label}">Gender &amp; Age</dt><dd class="text-slate-200 font-semibold">${m.genderAge}</dd></div>
        <div class="${cell}"><dt class="${label}">Height &amp; Weight</dt><dd class="text-slate-200 font-semibold">${m.heightWeight}</dd></div>
      </dl>

      ${TemplateSummary(m)}
    </section>`;
}
