// @ts-check
import { html } from '../ui/html.js';

/**
 * Tab registry. `v3: true` tabs are rendered by Sheet V3; the rest still live in the classic
 * sheet and are offered as links until they are migrated (plan section 8).
 */
export const TABS = Object.freeze([
  { id: 'combat', icon: '⚔️', label: 'Combat Cockpit', legacyTab: 'tab-combat', v3: false },
  { id: 'spells', icon: '🔮', label: 'Spells & Maneuvers', legacyTab: 'tab-spells', v3: false },
  { id: 'defense', icon: '🛡️', label: 'Defense & Buffs', legacyTab: 'tab-defense', v3: false },
  { id: 'inventory', icon: '🎒', label: 'Inventory & Gear', legacyTab: 'tab-inventory', v3: false },
  { id: 'character', icon: '👤', label: 'Character & Logs', legacyTab: 'tab-core', v3: true }
]);

/**
 * @param {string|null} characterId
 */
export function classicSheetHref(characterId) {
  return characterId ? `index.html?id=${encodeURIComponent(characterId)}` : 'index.html';
}

/**
 * @param {{ activeTab: string, characterId: string|null }} props
 */
export function TabBar({ activeTab, characterId }) {
  return html`
    <nav class="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Character sheet sections">
      ${TABS.map(tab => tab.v3
        ? html`<button type="button" class="v3-tab" role="tab" aria-selected="${String(tab.id === activeTab)}"
              data-action="select-tab" data-tab="${tab.id}">
              <span aria-hidden="true">${tab.icon}</span><span>${tab.label}</span>
            </button>`
        : html`<a class="v3-tab" data-legacy="true" href="${classicSheetHref(characterId)}"
              title="Not migrated yet. Opens the classic sheet.">
              <span aria-hidden="true">${tab.icon}</span><span>${tab.label}</span>
            </a>`)}
    </nav>`;
}

/**
 * @param {{ name: string, characterId: string|null, readOnly: boolean }} props
 */
export function Header({ name, characterId, readOnly }) {
  return html`
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Sheet V3 Preview</div>
        <h1 class="text-lg font-extrabold text-white truncate">${name}</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        ${readOnly ? html`<span class="v3-readonly-banner" role="status">Read-Only Preview: changes are made in the classic sheet</span>` : ''}
        <a class="ui-btn-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" href="${classicSheetHref(characterId)}">Open Classic Sheet</a>
        <a class="ui-btn-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" href="hub.html">Hub</a>
      </div>
    </header>`;
}
