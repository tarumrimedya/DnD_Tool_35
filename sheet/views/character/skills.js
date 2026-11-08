// @ts-check
import { html } from '../../ui/html.js';
import { filterSkillRows } from '../../core/derive-skills.js';

/**
 * Skills table (plan section 7, step 3). Same layout and classes as the classic
 * "Skills Table with 3D Roll" (index.html, char_inventory.js `renderSkills`). Read-only:
 * rank buttons, the class toggle, Sync Class Skills, Add Custom Skill and pins arrive with the
 * edit flows (step 6); Roll arrives with the Dice tab.
 */

const D20_ICON = html`<svg class="w-4 h-4 inline-block text-amber-400 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
  <polygon points="28,33 72,33 50,73" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/>
  <line x1="28" y1="33" x2="50" y2="4" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <line x1="72" y1="33" x2="50" y2="4" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <line x1="28" y1="33" x2="10" y2="27" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <line x1="72" y1="33" x2="90" y2="27" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <line x1="28" y1="33" x2="10" y2="73" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <line x1="72" y1="33" x2="90" y2="73" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <line x1="50" y1="73" x2="10" y2="73" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <line x1="50" y1="73" x2="90" y2="73" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <line x1="50" y1="73" x2="50" y2="96" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <text x="50" y="58" text-anchor="middle" fill="currentColor" font-size="22" font-weight="900" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.5">20</text>
</svg>`;

const STAT_LABELS = /** @type {Record<string, string>} */ ({ str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' });
const signed = (/** @type {number} */ n) => `${n >= 0 ? '+' : ''}${n}`;

const FILTER_ON = 'ui-btn-sm h-7 px-2.5 rounded-md text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer';
const FILTER_OFF = 'ui-btn-sm h-7 px-2.5 rounded-md text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer';

/** @param {{ total: number, spent: number, remaining: number }} p */
function remainingBadge(p) {
  if (p.remaining > 0) return html`<span class="badge bg-slate-900 text-sky-300 border border-slate-700 text-xs font-mono font-bold px-2 py-0.5">Remaining: ${p.remaining} Pts</span>`;
  if (p.remaining === 0) return html`<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-mono font-bold px-2 py-0.5">All Points Spent (0)</span>`;
  return html`<span class="badge bg-rose-950 text-rose-300 border border-rose-600 text-xs font-mono font-bold px-2 py-0.5 animate-pulse">Over Budget: +${Math.abs(p.remaining)} Pts!</span>`;
}

/** @param {import('../../core/derive-skills.js').SkillRow} r */
function SkillRowView(r) {
  const statLabel = STAT_LABELS[String(r.stat || '').toLowerCase()] || String(r.stat || '').toUpperCase();
  const bonusTitle = r.bonusBreakdown.length > 0 ? r.bonusBreakdown.join(' • ') : (r.bonus !== 0 ? `Bonus: ${r.bonus}` : 'No active item or spell bonus');
  return html`
    <tr class="hover:bg-slate-900/60 transition ${r.isConsolidated ? 'bg-emerald-950/15' : ''}" data-skill="${r.key}">
      <td class="py-2 px-2 text-center align-middle">
        <span class="w-6 h-6 rounded inline-flex items-center justify-center ${r.isClass ? 'text-amber-400 font-black' : 'text-slate-600 font-normal'}"
          title="${r.isClass ? 'Class Skill' : 'Cross-Class Skill'}">${r.isClass ? '⭐' : '⚪'}</span>
      </td>
      <td class="py-2 px-3 align-middle">
        <div class="font-bold ${r.isClass ? 'text-amber-300' : 'text-white'} flex items-center gap-2 flex-wrap">
          <span>${r.name}</span>
          ${r.isConsolidated ? html`<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px]">Consolidated</span>` : ''}
          ${r.isClass ? html`<span class="badge bg-amber-950 text-amber-300 border border-amber-700 text-[8px] font-mono">Class</span>` : ''}
        </div>
        ${r.subtitle ? html`<div class="text-[10px] text-emerald-400/80 font-mono mt-0.5">↳ ${r.subtitle}</div>` : ''}
      </td>
      <td class="py-2 px-2 text-center align-middle">
        <span lang="en" class="badge bg-slate-950 text-slate-300 border border-slate-700 font-mono text-[10px] font-bold px-1.5 py-0.5">${statLabel}</span>
      </td>
      <td class="py-2 px-2 text-center align-middle font-black font-mono text-base ${r.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}" title="Total Skill Modifier: ${signed(r.total)}">${signed(r.total)}</td>
      <td class="py-2 px-3 text-center align-middle">
        <button type="button" disabled class="bg-slate-800 text-amber-400 px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-mono inline-flex items-center gap-1.5 justify-center shadow-sm opacity-50" title="Rolling arrives with the Dice tab. Use the classic sheet for now.">
          ${D20_ICON}<span>Roll</span>
        </button>
      </td>
      <td class="py-2 px-2 text-center align-middle font-mono">
        <span class="w-6 inline-block text-center font-bold ${r.overRank ? 'text-rose-400 animate-pulse' : (r.ranks > 0 ? 'text-sky-300' : 'text-slate-500')}"
          title="${r.overRank ? `Over the maximum of ${r.maxRank} ranks` : 'Ranks'}">${r.ranks}</span>
        <div class="text-[9px] text-slate-500 font-mono">/ ${r.maxRank}</div>
      </td>
      <td class="py-2 px-2 text-center align-middle text-slate-400 font-mono">${signed(r.statMod)}</td>
      <td class="py-2 px-2 text-center align-middle font-mono ${r.acp ? (r.acpPenalty < 0 ? 'text-amber-400 font-bold' : 'text-slate-500') : 'text-slate-700'}"
        title="${r.acp ? 'Armor Check Penalty' : 'No Armor Check Penalty'}">${r.acp ? (r.acpPenalty < 0 ? String(r.acpPenalty) : '0') : '-'}</td>
      <td class="py-2 px-2 text-center align-middle font-mono ${r.bonus !== 0 ? (r.bonus > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold') : 'text-slate-600'}" title="${bonusTitle}">
        ${r.bonus !== 0 ? signed(r.bonus) : '-'}
      </td>
    </tr>`;
}

/**
 * @param {ReturnType<typeof import('../../core/derive-skills.js').deriveSkills>} d
 * @param {import('../../core/derive-skills.js').SkillView} view
 */
export function SkillsTable(d, view) {
  const rows = filterSkillRows(d.rows, view);
  return html`
    <section class="border border-slate-800 rounded-xl overflow-hidden" data-section="skills" aria-label="Skills">
      <div class="bg-slate-900 px-3 py-2 text-xs font-bold text-sky-400 flex justify-between items-center">
        <span class="flex items-center gap-1.5">${D20_ICON}<span>SKILLS & 3D DICE ROLLER</span></span>
        <div class="flex items-center gap-2">
          <span class="ui-btn-xs h-6 text-[10px] px-2.5 rounded-md font-bold ${d.merged ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-300 border border-slate-700'} inline-flex items-center">
            ${d.merged ? `🔗 Consolidated Skills (${d.groupCount} Groups)` : 'D&D 3.5e RAW (46 Skills)'}
          </span>
        </div>
      </div>

      <div class="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 p-2.5 rounded-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-2 text-xs shadow-inner">
        <div class="flex items-center gap-2">
          <span class="text-base" aria-hidden="true">📊</span>
          <div>
            <span class="font-extrabold text-white text-xs">Skill Point Pool:</span>
            <span class="text-[11px] text-slate-300 ml-1.5 font-mono">
              Spent: <strong class="text-emerald-400 font-bold">${d.points.spent}</strong> / Total: <strong class="text-amber-400 font-bold">${d.points.total}</strong>
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${remainingBadge(d.points)}
          <span class="text-[10px] text-indigo-300 hidden md:inline">(Class: 1 Pt • Cross-Class: 2 Pts)</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-xs">
        <div class="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Skill filter">
          <span class="text-[10px] font-bold text-slate-400 uppercase mr-1">Filter:</span>
          <button type="button" data-action="skill-filter" data-filter="all" aria-pressed="${String(view.filter === 'all')}" class="${view.filter === 'all' ? FILTER_ON : FILTER_OFF}">All</button>
          <button type="button" data-action="skill-filter" data-filter="class" aria-pressed="${String(view.filter === 'class')}" class="${view.filter === 'class' ? FILTER_ON : FILTER_OFF}">⭐ Class Skills</button>
          <button type="button" data-action="skill-filter" data-filter="trained" aria-pressed="${String(view.filter === 'trained')}" class="${view.filter === 'trained' ? FILTER_ON : FILTER_OFF}">🎯 Trained (Rank > 0)</button>
          <select id="v3-skill-stat-filter" data-input="skill-stat" class="ui-input-sm h-7 bg-slate-900 border border-slate-700 rounded-md px-2 text-[11px] text-slate-300 font-bold focus:border-amber-400 cursor-pointer" title="Key Ability Filter" aria-label="Key Ability Filter">
            ${[['all', 'All Abilities'], ['str', 'STR (Strength)'], ['dex', 'DEX (Dexterity)'], ['con', 'CON (Constitution)'], ['int', 'INT (Intelligence)'], ['wis', 'WIS (Wisdom)'], ['cha', 'CHA (Charisma)']]
              .map(([v, label]) => html`<option value="${v}" ${view.stat === v ? html`selected` : ''}>${label}</option>`)}
          </select>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[10px] text-slate-400 font-mono">
            Max Ranks: Class <strong class="text-amber-400">${d.maxClassRank}</strong> • Cross <strong class="text-slate-300">${d.maxCrossRank}</strong>
          </span>
        </div>
      </div>

      <div class="relative">
        <input type="text" id="v3-skill-search" data-input="skill-search" value="${view.search}" aria-label="Search skills"
          placeholder="🔍 Search skills (e.g., Stealth, Spot, Listen, Climb...)"
          class="ui-input-md h-8 w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium">
        ${view.search ? html`<button type="button" data-action="skill-search-clear" class="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer" title="Clear Search" aria-label="Clear Search">✕</button>` : ''}
      </div>

      ${d.unkeyedSkills > 0 ? html`<p class="text-[11px] text-amber-300 px-3 py-1.5">${d.unkeyedSkills} skill(s) have no key yet. Open the character once in the classic sheet to normalize them.</p>` : ''}

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
            <tr>
              <th class="py-2 px-2 text-center w-12" title="Class Skill?">Class</th>
              <th class="py-2 px-3">Skill Name</th>
              <th class="py-2 px-2 text-center">Stat</th>
              <th class="py-2 px-2 text-center text-emerald-400 font-black">Total</th>
              <th class="py-2 px-3 text-center text-amber-400">Roll</th>
              <th class="py-2 px-2 text-center">Rank</th>
              <th class="py-2 px-2 text-center">Mod</th>
              <th class="py-2 px-2 text-center">ACP</th>
              <th class="py-2 px-2 text-center">Buff</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 font-medium">
            ${rows.length > 0 ? rows.map(SkillRowView) : html`<tr><td colspan="9" class="py-6 text-center text-slate-500 italic">No matching skills found.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;
}
