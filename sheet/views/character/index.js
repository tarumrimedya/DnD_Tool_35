// @ts-check
import { html } from '../../ui/html.js';

/**
 * Character & Logs tab (plan section 7). Step 1 renders the section frame and a load
 * diagnostics card; each section is filled in by its own step (2 to 5).
 */

const SECTIONS = Object.freeze([
  { id: 'profile', title: 'Character Profile', step: 2 },
  { id: 'abilities-skills', title: 'Ability Scores & Skills', step: 3 },
  { id: 'feats-abilities', title: 'Feats & Special Abilities', step: 4 },
  { id: 'progression', title: 'Level Progression & Planning', step: 5 }
]);

/** @param {unknown} v */
const count = v => (Array.isArray(v) ? v.length : 0);

/**
 * @param {Record<string, any>} c
 * @param {import('../../core/store.js').SheetState} state
 */
function LoadDiagnostics(c, state) {
  const rows = [
    ['Source', state.load.source],
    ['Character ID', c._hubId || c.id || '-'],
    ['Schema Version', c.schemaVersion ?? '-'],
    ['Last Modified', c.lastModified || '-'],
    ['Level Rows', count(c.levelProgression)],
    ['Feats', count(c.feats)],
    ['Special Abilities', count(c.specialAbilities)],
    ['Gear Pool', count(c.gearPool)],
    ['Spells', count(c.spells)],
    ['Custom DB', count(c.customDb)],
    ['SRD Compendium', state.engine.compendium],
    ['Rule Engine', state.engine.ruleEngine ? 'loaded' : 'missing'],
    ['V3 Migrations', state.migration.status === 'done' ? `${state.migration.applied.length} applied (in memory)` : state.migration.status],
    ['Needs Review', count(c.quarantine)]
  ];
  return html`
    <section class="v3-card space-y-3" aria-labelledby="v3-diag-title">
      <h2 id="v3-diag-title" class="text-xs font-bold text-slate-300 uppercase tracking-wider">Load Diagnostics</h2>
      <dl class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        ${rows.map(([k, v]) => html`<div class="v3-kv"><dt>${k}</dt><dd>${v}</dd></div>`)}
      </dl>
      ${state.load.notes.length > 0
        ? html`<ul class="text-[11px] text-amber-300 space-y-0.5">${state.load.notes.map(n => html`<li>${n}</li>`)}</ul>`
        : ''}
      ${state.engine.error ? html`<p class="text-[11px] text-rose-300">${state.engine.error}</p>` : ''}
      ${state.migration.error ? html`<p class="text-[11px] text-rose-300">Migration error: ${state.migration.error}</p>` : ''}
    </section>`;
}

/**
 * Quarantined entries (docs/V3_DATA_SCHEMA.md section 6). Read-only in Phase A:
 * resolving them needs the write lock (Phase B).
 * @param {Record<string, any>} c
 */
function NeedsReview(c) {
  const q = Array.isArray(c.quarantine) ? c.quarantine : [];
  if (q.length === 0) return html``;
  return html`
    <section class="v3-card space-y-2" aria-labelledby="v3-review-title">
      <div class="flex items-center gap-2">
        <h2 id="v3-review-title" class="text-xs font-bold text-amber-300 uppercase tracking-wider">Needs Review</h2>
        <span class="badge bg-amber-950 text-amber-300 border border-amber-700/70">${q.length}</span>
      </div>
      <p class="text-[11px] text-slate-400">These entries could not stay where they are. Nothing was deleted. Resolving them will be available once editing is enabled.</p>
      <ul class="space-y-1.5">
        ${q.map(r => html`
          <li class="v3-kv">
            <div class="text-xs font-bold text-white">${r.entry?.name ?? r.entry?.id ?? 'Unnamed entry'}</div>
            <div class="text-[11px] text-slate-400">
              From <strong class="text-slate-200">${r.from}</strong> •
              ${r.reason === 'kind-conflict' ? html`Suggested Type: <strong class="text-amber-300">${r.suggested}</strong>` : 'Type could not be determined'}
            </div>
            ${r.note ? html`<div class="text-[11px] text-slate-500">${r.note}</div>` : ''}
          </li>`)}
      </ul>
    </section>`;
}

/** @param {import('../../core/store.js').SheetState} state */
export function CharacterTab(state) {
  const c = state.character;
  if (!c) return html``;
  return html`
    <div class="space-y-4">
      ${NeedsReview(c)}
      ${SECTIONS.map(s => html`
        <section class="v3-section" data-section="${s.id}" aria-label="${s.title}">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-xs font-bold text-slate-200 uppercase tracking-wider">${s.title}</h2>
            <span class="badge bg-slate-800 text-slate-400 border border-slate-700">Step ${s.step}</span>
          </div>
        </section>`)}
      ${LoadDiagnostics(c, state)}
    </div>`;
}
