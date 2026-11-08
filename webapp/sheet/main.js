// @ts-check
import { createInitialState, createStore, isReadOnly } from './core/store.js';
import { readStoredSnapshots, resolveCharacter, characterIdOf, storedFingerprint, planSave, writePlannedSave, STORAGE_KEYS } from './core/persistence.js';
import { decodeStored, encodeForStorage } from './core/storage-codec.js';
import { createWriterLock } from './core/writer-lock.js';
import { getEngineAvailability, initCompendium, normalizeCharacterV2, loadSrdIndex } from './core/engine-adapter.js';
import { createKindContext } from './core/entry-kind.js';
import { runMigrations } from './core/migrations.js';
import { resolveQuarantine } from './core/actions.js';
import { html, mount } from './ui/html.js';
import { delegateActions } from './ui/delegate.js';
import { Header, TabBar, TABS, classicSheetHref } from './views/shell.js';
import { CharacterTab } from './views/character/index.js';

const store = createStore(createInitialState());

/**
 * Per-load write session: what this tab last loaded or wrote, kept outside the render state.
 * @type {{ id: string, baseline: import('./core/persistence.js').StoredFingerprint, memo: import('./core/storage-codec.js').CodecMemo, lock: ReturnType<typeof createWriterLock>, kindCtx: any } | null}
 */
let session = null;

/** @param {Partial<import('./core/store.js').WriteState>} patch */
function setWrite(patch) {
  store.setState(s => {
    const write = { ...s.write, ...patch };
    return { ...s, write, readOnly: isReadOnly(write) };
  });
}

const CHANGED_ELSEWHERE = 'Changed in another tab or the classic sheet. Nothing was saved. Reload to continue.';

/**
 * The only path from an action to storage: run it, save the result, and keep it only if the save
 * succeeded. A refused action, a conflict or a storage error leaves the character as it was.
 * @param {(c: Record<string, any>) => import('./core/actions.js').ActionResult} run
 */
function commit(run) {
  const s = store.getState();
  if (s.readOnly || !s.character || !session) return;
  const result = run(s.character);
  if (!result.ok) {
    setWrite({ message: result.error });
    return;
  }
  const fresh = readStoredSnapshots(window.localStorage, new URLSearchParams(window.location.search));
  const now = new Date().toISOString();
  const plan = planSave({
    hubDb: fresh.hubDb, saved: fresh.saved, id: session.id, baseline: session.baseline,
    stored: encodeForStorage(result.character, session.memo), now
  });
  if (!plan.ok) {
    setWrite({ save: 'conflict', message: plan.reason === 'conflict' ? CHANGED_ELSEWHERE : 'No stored copy of this character to save into.' });
    return;
  }
  const written = writePlannedSave(window.localStorage, plan.writes);
  if (!written.ok) {
    setWrite({ save: 'error', message: `Save failed: ${written.error}` });
    return;
  }
  session.baseline = plan.baseline;
  store.setState(prev => {
    const write = { ...prev.write, save: /** @type {const} */ ('saved'), savedAt: now, message: null };
    return { ...prev, character: Object.freeze({ ...result.character, lastModified: now }), write, readOnly: isReadOnly(write) };
  });
}

/** @param {import('./core/writer-lock.js').LockStatus|'requesting'} lock */
function lockMessage(lock) {
  if (lock === 'busy') return 'Being edited in another Sheet V3 tab.';
  if (lock === 'lost') return 'Editing was taken over by another tab.';
  if (lock === 'unsupported') return 'This browser cannot lock the character for editing.';
  return null;
}

/** @param {boolean} takeOver */
function requestEditing(takeOver) {
  const s = store.getState();
  if (!session || s.migration.status !== 'done' || s.write.save === 'conflict' || s.write.save === 'error') return;
  setWrite({ lock: 'requesting', message: null });
  session.lock.acquire({ takeOver }).then(lock => setWrite({ lock, message: lockMessage(lock) }));
}

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
      ${Header({ name: c?.name || 'Sheet V3', characterId, write: c && session ? s.write : null, canEdit: s.migration.status === 'done' })}
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

  /** @param {DOMStringMap} data */
  const reviewIndex = data => Number(data.index);

  delegateActions(root, {
    'select-tab': data => {
      const next = data.tab || 'character';
      store.setState(s => (s.ui.activeTab === next ? s : { ...s, ui: { ...s.ui, activeTab: next } }));
    },
    'enable-editing': () => requestEditing(false),
    'take-over-editing': () => requestEditing(true),
    'stop-editing': () => {
      session?.lock.release();
      setWrite({ lock: 'idle', message: null });
    },
    'reload-page': () => window.location.reload(),
    'review-move': data => commit(c => resolveQuarantine(c, reviewIndex(data), { action: 'move', kind: data.kind || '' }, { ctx: session?.kindCtx })),
    'review-keep': data => commit(c => resolveQuarantine(c, reviewIndex(data), { action: 'keep' })),
    'review-delete': data => {
      const record = store.getState().character?.quarantine?.[reviewIndex(data)];
      const name = record?.entry?.name ?? record?.entry?.id ?? 'this entry';
      if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
      commit(c => resolveQuarantine(c, reviewIndex(data), { action: 'delete', confirmed: true }));
    }
  });

  // Phase A renders the whole app on any change; per-section subscriptions arrive with real sections.
  store.select(s => s, s => mount(root, App(s)));

  const availability = getEngineAvailability();
  const snapshots = readStoredSnapshots(window.localStorage, new URLSearchParams(window.location.search));
  const resolved = resolveCharacter(snapshots);
  const decoded = resolved.character ? decodeStored(normalizeCharacterV2(resolved.character)) : null;
  const id = decoded ? characterIdOf(decoded.character, snapshots.requestedId) : null;

  if (decoded && id) {
    session = {
      id,
      baseline: storedFingerprint(snapshots, id),
      memo: decoded.memo,
      kindCtx: undefined,
      lock: createWriterLock({
        locks: /** @type {any} */ (navigator).locks,
        characterId: id,
        onChange: lock => {
          if (lock === 'lost') setWrite({ lock, message: lockMessage(lock) });
        }
      })
    };
    // Another tab (classic sheet, Hub, other V3 tab) wrote this character: stop saving over it.
    window.addEventListener('storage', e => {
      if (!session || (e.key !== STORAGE_KEYS.character && e.key !== STORAGE_KEYS.hubDb && e.key !== null)) return;
      const now = storedFingerprint(readStoredSnapshots(window.localStorage, new URLSearchParams(window.location.search)), session.id);
      const changed = (now.saved !== null && now.saved !== session.baseline.saved) || (now.hub !== null && now.hub !== session.baseline.hub);
      if (changed) setWrite({ save: 'conflict', message: CHANGED_ELSEWHERE });
    });
  }

  store.setState(s => ({
    ...s,
    status: decoded ? 'ready' : 'empty',
    character: decoded ? Object.freeze(decoded.character) : null,
    load: { source: resolved.source, requestedId: snapshots.requestedId, notes: resolved.notes },
    engine: { ...s.engine, ruleEngine: availability.ruleEngine, migrator: availability.migrator, compendium: 'loading' },
    write: { ...s.write, lock: session?.lock.status === 'unsupported' ? 'unsupported' : 'idle' }
  }));

  // V3 migrations run in memory on load; their result is saved with the first edit.
  if (decoded) {
    loadSrdIndex().then(srdIndex => {
      const kindCtx = createKindContext(srdIndex);
      if (session) session.kindCtx = kindCtx;
      store.setState(s => {
        if (!s.character) return s;
        try {
          const res = runMigrations(s.character, { ctx: kindCtx });
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
