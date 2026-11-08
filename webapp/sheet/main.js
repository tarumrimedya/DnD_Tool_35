// @ts-check
import { createInitialState, createStore } from './core/store.js';
import { readStoredSnapshots, resolveCharacter } from './core/persistence.js';
import { getEngineAvailability, initCompendium, normalizeCharacterV2, loadSrdIndex } from './core/engine-adapter.js';
import { createKindContext } from './core/entry-kind.js';
import { runMigrations } from './core/migrations.js';
import { html, mount } from './ui/html.js';
import { delegateActions } from './ui/delegate.js';
import { Header, TabBar, TABS, classicSheetHref } from './views/shell.js';
import { CharacterTab } from './views/character/index.js';

const store = createStore(createInitialState());

/** @param {import('./core/store.js').SheetState} s */
function EmptyState(s) {
  return html`
    <div class="v3-card text-center space-y-3">
      <h2 class="text-sm font-bold text-white">No Character Loaded</h2>
      <p class="text-xs text-slate-400">Open a character from the Hub first, or pass <code>?id=</code> in the URL.</p>
      ${s.load.notes.map(n => html`<p class="text-[11px] text-amber-300">${n}</p>`)}
      <a class="ui-btn-md bg-indigo-600 hover:bg-indigo-500 text-white" href="hub.html">Go to Hub</a>
    </div>`;
}

/** @param {import('./core/store.js').SheetState} s */
function App(s) {
  if (s.status === 'loading') {
    return html`<div class="v3-card text-xs text-slate-400" role="status">Loading character...</div>`;
  }
  const c = s.character;
  const characterId = c ? (c._hubId || c.id || null) : s.load.requestedId;
  const tab = TABS.find(t => t.id === s.ui.activeTab);
  return html`
    <div class="space-y-4">
      ${Header({ name: c?.name || 'Sheet V3', characterId, readOnly: s.readOnly })}
      ${TabBar({ activeTab: s.ui.activeTab, characterId })}
      <main id="v3-tab-panel" role="tabpanel">
        ${!c ? EmptyState(s)
          : s.ui.activeTab === 'character' ? CharacterTab(s)
          : html`<div class="v3-card text-xs text-slate-300">${tab?.label || 'This tab'} is not migrated yet.
              <a class="text-indigo-300 underline" href="${classicSheetHref(characterId)}">Open the classic sheet</a>.</div>`}
      </main>
    </div>`;
}

function boot() {
  const root = document.getElementById('v3-root');
  if (!root) return;

  delegateActions(root, {
    'select-tab': data => {
      const next = data.tab || 'character';
      store.setState(s => (s.ui.activeTab === next ? s : { ...s, ui: { ...s.ui, activeTab: next } }));
    }
  });

  // Phase A renders the whole app on any change; per-section subscriptions arrive with real sections.
  store.select(s => s, s => mount(root, App(s)));

  const availability = getEngineAvailability();
  const snapshots = readStoredSnapshots(window.localStorage, new URLSearchParams(window.location.search));
  const resolved = resolveCharacter(snapshots);

  store.setState(s => ({
    ...s,
    status: resolved.character ? 'ready' : 'empty',
    character: resolved.character ? Object.freeze(normalizeCharacterV2(resolved.character)) : null,
    load: { source: resolved.source, requestedId: snapshots.requestedId, notes: resolved.notes },
    engine: { ...s.engine, ruleEngine: availability.ruleEngine, migrator: availability.migrator, compendium: 'loading' }
  }));

  // V3 migrations run in memory on the loaded clone (Phase A: never written back).
  if (resolved.character) {
    loadSrdIndex().then(srdIndex => {
      store.setState(s => {
        if (!s.character) return s;
        try {
          const res = runMigrations(s.character, { ctx: createKindContext(srdIndex) });
          const notes = res.reports.flatMap(r => r.notes);
          if (!srdIndex) notes.unshift('SRD index unavailable: kinds were inferred without it.');
          return { ...s, character: Object.freeze(res.character), migration: { status: 'done', applied: res.applied, notes } };
        } catch (e) {
          return { ...s, migration: { status: 'error', applied: [], notes: [], error: e instanceof Error ? e.message : String(e) } };
        }
      });
    });
  }

  initCompendium().then(result => {
    store.setState(s => ({
      ...s,
      engine: { ...s.engine, compendium: result.ok ? 'ready' : 'error', error: result.error }
    }));
  });
}

boot();
