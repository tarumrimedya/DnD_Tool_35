/**
 * ============================================================================
 * JOYFUL-FERMI D&D 3.5e — CHARACTER STORE & UNDO/REDO ENGINE (Phase R1)
 * ============================================================================
 * Single-state container (`doc`, `session`, `ui`, `sheet`) with:
 *   1. Pure `RuleEngine.deriveSheet` memoization & Strangler Fig write-back
 *   2. Deterministic 20-step Undo/Redo ring buffer (`Ctrl+Z` / `Ctrl+Y`)
 *   3. Fine-grained Region Subscription (`mountRegion` / `notifyRegions`)
 *   4. Local-only combat session persistence (`dnd35_session_<charId>`)
 * ============================================================================
 */
(function (root) {
  'use strict';

  const MAX_HISTORY_STEPS = 20;

  // V2 type a feat-list reference resolves against: UA traits ("🧬 [Trait] Name") and Complete Scoundrel
  // skill tricks ("💪 [Skill Trick] Name") live in the feat lists but are their own record types.
  const FEAT_REF_TYPES = ['Feat', 'Trait', 'Skill Trick'];
  function featRefTypeOf(f) {
    if (f && typeof f === 'object' && (f.type === 'Trait' || f.type === 'Skill Trick')) return f.type;
    const s = String(typeof f === 'string' ? f : '');
    if (s.includes('[Trait]')) return 'Trait';
    if (s.includes('[Skill Trick]')) return 'Skill Trick';
    return 'Feat';
  }

  // Names of every feat the character references (doc.feats[] objects/strings + levelProgression[].feats),
  // limited to one V2 type ('Feat' by default; 'Trait' / 'Skill Trick' for those rows).
  function collectFeatRefNames(doc, refType = 'Feat') {
    const out = new Set();
    const add = (f) => {
      if (featRefTypeOf(f) !== refType) return;
      const raw = typeof f === 'string' ? f : (f && (f.name || f.featName));
      // levelProgression stores display strings such as "🎖️ Aberration Banemagic" / "🌟 [Homebrew] Name"
      // (same cleanup as char_progression cleanFeatNameString)
      const n = String(raw || '').replace(/^[^A-Za-z0-9(]+(\[.*?\])?\s*/, '').trim();
      if (n) out.add(n);
    };
    if (doc && Array.isArray(doc.feats)) doc.feats.forEach(add);
    if (doc && Array.isArray(doc.levelProgression)) {
      doc.levelProgression.forEach((row) => { if (row && Array.isArray(row.feats)) row.feats.forEach(add); });
    }
    return Array.from(out);
  }

  // Class names the character has levels in (levelProgression[].className; doc.classes "Fighter 3 / Alienist 2"
  // for characters without a progression). Classes from lazy chunks (SRD import P4) are snapshotted like feats.
  function collectClassRefNames(doc) {
    const out = new Set();
    if (doc && Array.isArray(doc.levelProgression)) {
      doc.levelProgression.forEach((row) => { const n = String((row && row.className) || '').trim(); if (n) out.add(n); });
    }
    if (out.size === 0 && doc && typeof doc.classes === 'string') {
      doc.classes.split('/').forEach((part) => { const n = part.replace(/\s+\d+\s*$/, '').trim(); if (n) out.add(n); });
    }
    return Array.from(out);
  }

  // Names in the character's spell lists and buffs. Psionic powers live in the lazy srd_powers.json, so a power
  // the character knows or has active is snapshotted like a feat; names that are not powers never match a Power row.
  function collectPowerRefNames(doc) {
    const out = new Set();
    const add = (e) => { const n = String(typeof e === 'string' ? e : ((e && e.name) || '')).trim(); if (n) out.add(n); };
    const sc = (doc && doc.spellcasting) || {};
    [doc && doc.spells, doc && doc.buffs, sc.knownSpells, sc.preparedSpells, sc.divineSpells].forEach((list) => {
      if (Array.isArray(list)) list.forEach(add);
    });
    return Array.from(out);
  }

  // Every lazy-chunk reference type the character can hold: feat-list rows, class levels, psionic powers and
  // spells from lazy chunks (srd_spells_splat.json, e.g. Dragon Magic). The same spell-list and buff names are
  // matched against Power rows and Spell rows; only rows that live in a lazy chunk are snapshotted.
  function collectSrdRefGroups(doc) {
    const spellListNames = collectPowerRefNames(doc);
    return FEAT_REF_TYPES.map(t => ({ t, names: collectFeatRefNames(doc, t) }))
      .concat([{ t: 'Class', names: collectClassRefNames(doc) }, { t: 'Power', names: spellListNames }, { t: 'Spell', names: spellListNames }]);
  }

  function resolveRuleEngine() {
    if (typeof root !== 'undefined' && root.RuleEngine) return root.RuleEngine;
    if (typeof RuleEngine !== 'undefined') return RuleEngine;
    if (typeof require === 'function') {
      try { return require('./rule_engine.js'); } catch (_) {}
    }
    return null;
  }

  function createDefaultSession() {
    return {
      round: 1,
      actionEconomy: {
        standard: false,
        move: false,
        swift: false,
        fullRound: false,
        immediate: false
      },
      cooldowns: {},
      lastOutcome: null
    };
  }

  function getSessionStorageKey(doc) {
    const id = (doc && (doc.id || doc.name)) ? String(doc.id || doc.name).toLowerCase().replace(/[^a-z0-9_-]+/g, '_') : 'default';
    return `dnd35_session_${id}`;
  }

  function loadSessionFromStorage(doc) {
    if (typeof localStorage === 'undefined' || !localStorage) return createDefaultSession();
    try {
      const raw = localStorage.getItem(getSessionStorageKey(doc));
      if (!raw) return createDefaultSession();
      const parsed = JSON.parse(raw);
      return Object.assign(createDefaultSession(), parsed || {});
    } catch (_) {
      return createDefaultSession();
    }
  }

  function saveSessionToStorage(doc, session) {
    if (typeof localStorage === 'undefined' || !localStorage || !doc) return;
    try {
      localStorage.setItem(getSessionStorageKey(doc), JSON.stringify(session || createDefaultSession()));
    } catch (_) {}
  }

  function applySheetModeToDom(rawMode) {
    const mode = ['both', 'play', 'build'].includes(String(rawMode || '').toLowerCase().trim())
      ? String(rawMode).toLowerCase().trim()
      : 'both';
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.sheetMode = mode;
      ['play', 'build', 'both'].forEach(function (m) {
        const btn = document.getElementById('btn-sheet-mode-' + m);
        if (!btn) return;
        if (m === mode) {
          btn.classList.add('bg-indigo-600', 'text-white', 'shadow');
          btn.classList.remove('text-slate-400', 'hover:text-white');
        } else {
          btn.classList.remove('bg-indigo-600', 'text-white', 'shadow');
          btn.classList.add('text-slate-400', 'hover:text-white');
        }
      });
    }
  }

  const _state = {
    doc: null,
    session: createDefaultSession(),
    ui: {
      activeTab: 'tab-combat',
      mode: 'both'
    },
    sheet: null
  };

  let _sheetDirty = true;
  let _isRestoringHistory = false;
  let _lastTacticalOptions = {};
  let _lastOutcome = null;
  const _undoStack = [];
  const _redoStack = [];
  const _regions = new Map();
  const _customReducers = new Map();

  const CharStore = {
    MAX_HISTORY_STEPS,

    getState() {
      return {
        doc: _state.doc,
        session: _state.session,
        ui: _state.ui,
        sheet: _state.sheet
      };
    },

    getDoc() {
      return _state.doc;
    },

    getCustomDb() {
      if (!_state.doc || typeof _state.doc !== 'object') return [];
      if (!Array.isArray(_state.doc.customDb)) _state.doc.customDb = [];
      return _state.doc.customDb;
    },

    replaceDoc(newDoc, meta = {}) {
      const out = this.dispatch({
        type: 'doc/replace',
        payload: newDoc,
        meta
      });
      if (typeof window !== 'undefined' && _state.doc) {
        if (!Array.isArray(_state.doc.customDb)) _state.doc.customDb = [];
        this.reconcileSrdSnapshots().then((res) => {
          if (res && ((res.migrated && res.migrated.length > 0) || res.changed)) {
            if (typeof root.renderAll === 'function') {
              try { root.renderAll(); } catch (err) {
                if (typeof root.reportError === 'function') root.reportError('CharStore.replaceDocRender', err);
              }
            }
          }
        });
      }
      return out;
    },

    getSession() {
      return _state.session;
    },

    getLastOutcome() {
      return _lastOutcome;
    },

    setLastOutcome(out) {
      _lastOutcome = out || null;
      return _lastOutcome;
    },

    getUi() {
      return _state.ui;
    },

    getMode() {
      return (_state.ui && _state.ui.mode) || (_state.doc && _state.doc.uiMode) || 'both';
    },

    getSheet() {
      if (_sheetDirty || !_state.sheet) {
        return this.recompute(_lastTacticalOptions);
      }
      return _state.sheet;
    },

    /**
     * Synchronizes `_state.doc` when the global character reference is updated by legacy code.
     */
    _syncExternalCharacterRef(newChar) {
      if (!newChar || typeof newChar !== 'object') {
        _state.doc = newChar;
        _state.sheet = null;
        _sheetDirty = true;
        return;
      }
      if (!Array.isArray(newChar.customDb)) {
        newChar.customDb = [];
      }
      if (typeof root !== 'undefined') {
        root.masterDb = newChar.customDb;
      }
      const prevId = _state.doc && (_state.doc.id || _state.doc.name);
      const nextId = newChar.id || newChar.name;
      _state.doc = newChar;
      const extMode = String(newChar.uiMode || (newChar.settings && newChar.settings.sheetViewMode) || (_state.ui && _state.ui.mode) || 'both').toLowerCase().trim();
      _state.ui = Object.assign({}, _state.ui, { mode: ['both', 'play', 'build'].includes(extMode) ? extMode : 'both' });
      applySheetModeToDom(_state.ui.mode);
      _sheetDirty = true;
      if (prevId !== nextId && !_isRestoringHistory) {
        _state.session = loadSessionFromStorage(newChar);
        this.reconcileSrdSnapshots();
      }
    },

    /**
     * Character-load check of tier-2 `srd-snapshot` entries in customDb (SrdCompendium.reconcileSnapshots).
     * Unmodified snapshots follow SRD fixes automatically; edited ones get an update flag.
     * No-op for characters without snapshots.
     */
    reconcileSrdSnapshots() {
      const doc = _state.doc;
      const comp = typeof root !== 'undefined' ? root.SrdCompendium : null;
      if (!doc || !Array.isArray(doc.customDb) || !comp || typeof comp.reconcileSnapshots !== 'function') {
        return Promise.resolve(null);
      }
      // Feats referenced by name that no longer resolve from memory (lazy chunk not loaded, no snapshot yet):
      // load their chunk once and snapshot them (migration path; also covers opt-in 3.0 / licensed feats).
      const canResolve = typeof comp.resolveMissingRefs === 'function' && typeof comp.getByName === 'function';
      const hasSnapshotNamed = (n, t) => doc.customDb.some(e => e && e._snapshot && e.type === t && String(e.name || '').toLowerCase().trim() === n.toLowerCase());
      const unresolvedByType = collectSrdRefGroups(doc).map(g => ({
        t: g.t,
        names: canResolve ? g.names.filter(n => !comp.getByName(n, g.t) && !comp.getByName(n) && !hasSnapshotNamed(n, g.t)) : []
      })).filter(g => g.names.length > 0);
      const hasSnapshots = doc.customDb.some(e => e && e._snapshot);
      if (!hasSnapshots && unresolvedByType.length === 0) return Promise.resolve(null);
      const migrate = unresolvedByType.reduce((p, g) => p.then(acc => comp.resolveMissingRefs(doc.customDb, g.names, g.t)
        .then(ids => acc.concat(ids || []))), Promise.resolve([]));
      return migrate.then((added) => comp.reconcileSnapshots(doc.customDb).then((res) => {
        const changed = (res && res.changed) || (Array.isArray(added) && added.length > 0);
        if (changed && _state.doc === doc) {
          _sheetDirty = true;
          this.recompute(_lastTacticalOptions);
          if (typeof root.saveStateToStorage === 'function') root.saveStateToStorage(false);
        }
        return Object.assign({}, res, { migrated: added || [] });
      })).catch(() => null);
    },

    /**
     * Recomputes `_state.sheet` via pure `RuleEngine.deriveSheet`, writes back legacy
     * fields onto `_state.doc` for `R1`–`R6` compatibility, and notifies region subscribers.
     */
    recompute(tacticalOptions) {
      if (tacticalOptions && typeof tacticalOptions === 'object') {
        _lastTacticalOptions = tacticalOptions;
      }
      if (!_state.doc || typeof _state.doc !== 'object') {
        _state.sheet = null;
        _sheetDirty = false;
        return null;
      }
      const engine = resolveRuleEngine();
      if (!engine || typeof engine.deriveSheet !== 'function') {
        return null;
      }
      if (!Array.isArray(_state.doc.customDb)) {
        _state.doc.customDb = [];
      }
      if (typeof root !== 'undefined') {
        root.masterDb = _state.doc.customDb;
      }
      const db = _state.doc.customDb;
      // Feats picked from lazy (tier-2) chunks this session get an srd-snapshot in customDb right away,
      // so export / cloud sync / the next page load resolve them without the chunk.
      const comp = typeof root !== 'undefined' ? root.SrdCompendium : null;
      if (comp && typeof comp.snapshotLazyRefs === 'function') {
        collectSrdRefGroups(_state.doc).forEach(g => comp.snapshotLazyRefs(db, g.names, g.t));
      }
      const sheetView = engine.deriveSheet(_state.doc, {
        masterDb: db,
        customDb: db,
        session: _state.session,
        tactical: _lastTacticalOptions
      }, _lastTacticalOptions);

      _state.sheet = sheetView;
      _sheetDirty = false;

      if (typeof engine.writeBackLegacyFields === 'function') {
        engine.writeBackLegacyFields(_state.doc, sheetView);
      }
      if (!Array.isArray(_state.doc.customDb)) {
        _state.doc.customDb = db;
      }
      if (typeof root !== 'undefined') {
        root.masterDb = _state.doc.customDb;
      }
      this.notifyRegions();
      return sheetView;
    },

    _fastCloneHistoryVal(val) {
      if (val === null || typeof val !== 'object') return val;
      if (Array.isArray(val)) {
        const out = new Array(val.length);
        for (let i = 0; i < val.length; i++) out[i] = this._fastCloneHistoryVal(val[i]);
        return out;
      }
      const out = {};
      const keys = Object.keys(val);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        out[k] = this._fastCloneHistoryVal(val[k]);
      }
      return out;
    },

    _deepEqualFast(a, b) {
      if (a === b) return true;
      if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
      const isArrA = Array.isArray(a);
      if (isArrA !== Array.isArray(b)) return false;
      if (isArrA) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!this._deepEqualFast(a[i], b[i])) return false;
        }
        return true;
      }
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (let i = 0; i < keysA.length; i++) {
        const k = keysA[i];
        if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
        if (!this._deepEqualFast(a[k], b[k])) return false;
      }
      return true;
    },

    _createHistoryEntry(label, doc, session) {
      const engine = resolveRuleEngine();
      const docSnap = (engine && typeof engine.stripDerivedFields === 'function')
        ? engine.stripDerivedFields(doc)
        : this._fastCloneHistoryVal(doc);
      const sessionSnap = this._fastCloneHistoryVal(session || createDefaultSession());
      let cachedDocJson = null;
      let cachedSessionJson = null;
      return {
        label: String(label || 'Sheet Edit'),
        _docSnap: docSnap,
        _sessionSnap: sessionSnap,
        get docJson() {
          if (cachedDocJson === null) cachedDocJson = JSON.stringify(docSnap);
          return cachedDocJson;
        },
        get sessionJson() {
          if (cachedSessionJson === null) cachedSessionJson = JSON.stringify(sessionSnap);
          return cachedSessionJson;
        },
        timestamp: Date.now()
      };
    },

    _isSameHistoryState(entryA, entryB) {
      if (!entryA || !entryB) return false;
      if (entryA._docSnap && entryB._docSnap) {
        return this._deepEqualFast(entryA._docSnap, entryB._docSnap) &&
          this._deepEqualFast(entryA._sessionSnap, entryB._sessionSnap);
      }
      return entryA.docJson === entryB.docJson && entryA.sessionJson === entryB.sessionJson;
    },

    /**
     * Records a snapshot of `{ doc, session }` onto the 20-step Undo stack (zero-stringify structural sharing).
     */
    recordHistory(label = 'Sheet Edit') {
      if (_isRestoringHistory || !_state.doc) return false;
      const entry = this._createHistoryEntry(label, _state.doc, _state.session);
      const top = _undoStack[_undoStack.length - 1];
      if (top && this._isSameHistoryState(top, entry)) {
        return false;
      }

      _undoStack.push(entry);
      if (_undoStack.length > MAX_HISTORY_STEPS) {
        _undoStack.shift();
      }
      _redoStack.length = 0;
      return true;
    },

    canUndo() {
      return _undoStack.length > 0;
    },

    canRedo() {
      return _redoStack.length > 0;
    },

    getHistoryCounts() {
      return {
        undo: _undoStack.length,
        redo: _redoStack.length
      };
    },

    clearHistory() {
      _undoStack.length = 0;
      _redoStack.length = 0;
    },

    undo() {
      if (_undoStack.length === 0 || !_state.doc) return null;
      _redoStack.push(this._createHistoryEntry(
        _undoStack[_undoStack.length - 1].label,
        _state.doc,
        _state.session
      ));
      if (_redoStack.length > MAX_HISTORY_STEPS) {
        _redoStack.shift();
      }

      const snap = _undoStack.pop();
      this._applyHistorySnapshot(snap, 'Undo');
      return snap;
    },

    redo() {
      if (_redoStack.length === 0 || !_state.doc) return null;
      _undoStack.push(this._createHistoryEntry(
        _redoStack[_redoStack.length - 1].label,
        _state.doc,
        _state.session
      ));
      if (_undoStack.length > MAX_HISTORY_STEPS) {
        _undoStack.shift();
      }

      const snap = _redoStack.pop();
      this._applyHistorySnapshot(snap, 'Redo');
      return snap;
    },

    _applyHistorySnapshot(snap, directionLabel) {
      if (!snap) return;
      _isRestoringHistory = true;
      try {
        const engine = resolveRuleEngine();
        const restoredDoc = snap._docSnap
          ? ((engine && typeof engine.stripDerivedFields === 'function')
            ? engine.stripDerivedFields(snap._docSnap)
            : this._fastCloneHistoryVal(snap._docSnap))
          : JSON.parse(snap.docJson);
        const restoredSession = snap._sessionSnap
          ? this._fastCloneHistoryVal(snap._sessionSnap)
          : JSON.parse(snap.sessionJson);
        if (restoredDoc && !Array.isArray(restoredDoc.customDb)) {
          restoredDoc.customDb = [];
        }
        _state.doc = restoredDoc;
        _state.session = restoredSession;
        if (restoredDoc) {
          const restoredMode = String(restoredDoc.uiMode || (restoredDoc.settings && restoredDoc.settings.sheetViewMode) || (_state.ui && _state.ui.mode) || 'both').toLowerCase().trim();
          _state.ui = Object.assign({}, _state.ui, { mode: ['both', 'play', 'build'].includes(restoredMode) ? restoredMode : 'both' });
        }
        applySheetModeToDom(_state.ui.mode);
        saveSessionToStorage(_state.doc, _state.session);

        if (typeof root !== 'undefined' && _state.doc) {
          root.masterDb = _state.doc.customDb;
          if (root.document) {
            root.character = _state.doc;
          }
        }
        this.recompute(_lastTacticalOptions);

        if (typeof root !== 'undefined') {
          if (typeof root.saveStateToStorage === 'function') {
            root.saveStateToStorage(true);
          }
          if (typeof root.renderAll === 'function') {
            root.renderAll({ allTabs: true, skipRecompute: true });
          }
          if (typeof root.showDiceTopToast === 'function') {
            const arrow = directionLabel === 'Undo' ? '↩' : '↪';
            root.showDiceTopToast({
              icon: arrow,
              title: `${arrow} ${directionLabel}: ${snap.label}`,
              breakdown: `History stack (${_undoStack.length} undo / ${_redoStack.length} redo available).`,
              total: directionLabel
            });
          }
        }
      } finally {
        _isRestoringHistory = false;
      }
    },

    registerReducer(type, reducerFn) {
      if (!type || typeof reducerFn !== 'function') return;
      _customReducers.set(String(type), reducerFn);
    },

    /**
     * Dispatches a structured action (`doc/replace`, `doc/mutate`, `session/patch`,
     * `ui/setMode`, `ui/setTab`, `history/undo`, `history/redo`, or custom reducer).
     */
    dispatch(action) {
      if (!action || typeof action !== 'object' || !action.type) return _state.sheet;
      const type = String(action.type);
      const payload = action.payload;
      const meta = action.meta || {};

      if (type === 'history/undo') {
        this.undo();
        return _state.sheet;
      }
      if (type === 'history/redo') {
        this.redo();
        return _state.sheet;
      }

      if (type === 'ui/setMode') {
        const rawMode = String((payload && payload.mode) || payload || 'both').toLowerCase().trim();
        const mode = ['both', 'play', 'build'].includes(rawMode) ? rawMode : 'both';
        if (!meta.skipHistory && _state.doc) {
          this.recordHistory(meta.label || action.label || 'Change Sheet View Mode');
        }
        _state.ui = Object.assign({}, _state.ui, { mode });
        if (_state.doc && typeof _state.doc === 'object') {
          _state.doc.uiMode = mode;
          if (!_state.doc.ui || typeof _state.doc.ui !== 'object') {
            _state.doc.ui = {};
          }
          _state.doc.ui.mode = mode;
          if (!_state.doc.settings || typeof _state.doc.settings !== 'object') {
            _state.doc.settings = {};
          }
          _state.doc.settings.sheetViewMode = mode;
        }
        if (typeof localStorage !== 'undefined' && localStorage) {
          try { localStorage.setItem('dnd_sheet_view_mode', mode); } catch (_) {}
        }
        applySheetModeToDom(mode);
        if (typeof root !== 'undefined' && typeof root.saveStateToStorage === 'function' && meta.persist !== false) {
          root.saveStateToStorage(false);
        }
        this.notifyRegions();
        return _state.sheet;
      }

      if (type === 'ui/setTab') {
        const activeTab = (payload && payload.activeTab) || payload || 'tab-combat';
        _state.ui = Object.assign({}, _state.ui, { activeTab: String(activeTab) });
        this.notifyRegions();
        return _state.sheet;
      }

      let docChanged = false;
      let sessionChanged = false;

      if (type === 'doc/replace') {
        if (!meta.skipHistory && _state.doc) {
          this.recordHistory(meta.label || action.label || 'Replace Character');
        }
        _state.doc = payload ? JSON.parse(JSON.stringify(payload)) : null;
        if (_state.doc && !Array.isArray(_state.doc.customDb)) {
          _state.doc.customDb = [];
        }
        if (_state.doc) {
          const initialMode = String(_state.doc.uiMode || (_state.doc.settings && _state.doc.settings.sheetViewMode) || (_state.ui && _state.ui.mode) || 'both').toLowerCase().trim();
          _state.ui = Object.assign({}, _state.ui, { mode: ['both', 'play', 'build'].includes(initialMode) ? initialMode : 'both' });
        }
        applySheetModeToDom(_state.ui.mode);
        _state.session = loadSessionFromStorage(_state.doc);
        if (typeof root !== 'undefined' && _state.doc) {
          root.masterDb = _state.doc.customDb;
          if (root.document) {
            root.character = _state.doc;
          }
        }
        docChanged = true;
      } else if (type === 'doc/mutate') {
        if (!_state.doc) return null;
        if (!meta.skipHistory) {
          this.recordHistory(meta.label || action.label || 'Update Character');
        }
        if (typeof payload === 'function') {
          payload(_state.doc, _state.session);
        } else if (payload && typeof payload === 'object') {
          Object.assign(_state.doc, payload);
        }
        docChanged = true;
      } else if (type === 'session/patch') {
        if (!meta.skipHistory && _state.doc) {
          this.recordHistory(meta.label || action.label || 'Session Update');
        }
        if (typeof payload === 'function') {
          payload(_state.session);
        } else if (payload && typeof payload === 'object') {
          _state.session = Object.assign({}, _state.session, payload);
        }
        saveSessionToStorage(_state.doc, _state.session);
        sessionChanged = true;
      } else if (_customReducers.has(type)) {
        if (!_state.doc) return null;
        const preEntry = (!meta.skipHistory && !_isRestoringHistory)
          ? this._createHistoryEntry(meta.label || action.label || type, _state.doc, _state.session)
          : null;
        _lastOutcome = null;
        const reducerFn = _customReducers.get(type);
        const nextDoc = reducerFn(_state.doc, action, _state);
        const outcome = _lastOutcome || null;
        const isAborted = Boolean(
          outcome && (
            outcome.status === 'not_found' ||
            outcome.status === 'exhausted_daily' ||
            outcome.status === 'exhausted_qty' ||
            outcome.status === 'exhausted_slot' ||
            outcome.status === 'exhausted_pool' ||
            outcome.status === 'invalid_payload' ||
            outcome.status === 'empty_slot' ||
            outcome.status === 'no_target_slot' ||
            outcome.status === 'no_daily_charges' ||
            outcome.status === 'charges_exhausted' ||
            outcome.status === 'no_slots_remaining' ||
            outcome.status === 'already_cast' ||
            outcome.status === 'already_exists' ||
            outcome.status === 'max_readied_reached' ||
            outcome.status === 'quota_full' ||
            outcome.status === 'locked_mode' ||
            outcome.status === 'max_rank_cap' ||
            outcome.status === 'min_level_reached' ||
            outcome.status === 'level_1_locked' ||
            outcome.status === 'sequential_activation_required' ||
            outcome.status === 'sequential_deactivation_required'
          )
        );
        if (!isAborted) {
          if (preEntry && !meta.skipHistory && !_isRestoringHistory) {
            const top = _undoStack[_undoStack.length - 1];
            if (!top || !this._isSameHistoryState(top, preEntry)) {
              _undoStack.push(preEntry);
              if (_undoStack.length > MAX_HISTORY_STEPS) {
                _undoStack.shift();
              }
              _redoStack.length = 0;
            }
          }
          if (nextDoc && typeof nextDoc === 'object' && nextDoc !== _state.doc && (nextDoc.abilities || nextDoc.hp || nextDoc.name)) {
            _state.doc = nextDoc;
            if (!Array.isArray(_state.doc.customDb)) _state.doc.customDb = [];
            if (typeof root !== 'undefined') {
              root.masterDb = _state.doc.customDb;
              if (root.document) root.character = _state.doc;
            }
          }
          docChanged = true;
        }
      }

      if (docChanged || sessionChanged) {
        this.recompute(meta.tactical);
        if (docChanged && typeof root !== 'undefined' && typeof root.saveStateToStorage === 'function' && meta.persist !== false) {
          root.saveStateToStorage(meta.cloudSync !== false);
        }
        if (type === 'doc/replace') this.reconcileSrdSnapshots();
      }

      return _state.sheet;
    },

    /**
     * Registers a fine-grained region subscriber that only re-renders when
     * the JSON serialization of `selectorFn(state)` changes.
     */
    mountRegion(key, selectorFn, renderFn) {
      if (!key || typeof selectorFn !== 'function' || typeof renderFn !== 'function') return;
      let initialSliceJson = null;
      try {
        const slice = selectorFn(this.getState());
        initialSliceJson = JSON.stringify(slice);
      } catch (_) { if (typeof reportError === 'function') reportError('Region selector evaluation', _); }
      _regions.set(String(key), {
        key: String(key),
        selectorFn,
        renderFn,
        lastJson: initialSliceJson
      });
    },

    unmountRegion(key) {
      _regions.delete(String(key));
    },

    notifyRegions() {
      if (_regions.size === 0) return 0;
      const stateSnap = this.getState();
      let notified = 0;
      _regions.forEach(reg => {
        try {
          const nextSlice = reg.selectorFn(stateSnap);
          const nextJson = JSON.stringify(nextSlice);
          if (nextJson !== reg.lastJson) {
            reg.lastJson = nextJson;
            reg.renderFn(nextSlice, stateSnap);
            notified++;
          }
        } catch (err) {
          console.error(`[CharStore] Region "${reg.key}" render error:`, err);
        }
      });
      return notified;
    }
  };

  // Built-in Domain Reducer: 'consumable/use' (Phase R2 Vertical Slice)
  function extractRollList(rollsPayload, fieldKey, count, sides) {
    let rawArr = null;
    if (Array.isArray(rollsPayload)) {
      rawArr = rollsPayload;
    } else if (rollsPayload && typeof rollsPayload === 'object' && Array.isArray(rollsPayload[fieldKey])) {
      rawArr = rollsPayload[fieldKey];
    }
    const resolved = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const entry = rawArr && rawArr[i] !== undefined ? rawArr[i] : null;
      const num = entry !== null
        ? (typeof entry === 'object' ? Number(entry.value) : Number(entry))
        : (Math.floor(Math.random() * sides) + 1);
      const val = Number.isFinite(num) && num > 0 ? num : 1;
      resolved.push(val);
      sum += val;
    }
    return { values: resolved, sum };
  }

  function applyConsumableUseReducer(doc, action, stateObj) {
    const setOutcome = (out) => {
      _lastOutcome = out || null;
      return _lastOutcome;
    };

    if (!doc || typeof doc !== 'object') {
      setOutcome({ status: 'invalid_payload' });
      return doc;
    }
    const payload = (action && action.payload) || {};
    const sourceType = payload.sourceType || (payload.slotKey ? 'slot' : (payload.poolId ? 'pool' : 'consumable'));
    const idOrIdx = payload.idOrIdx !== undefined
      ? payload.idOrIdx
      : (payload.id !== undefined ? payload.id : (payload.poolId !== undefined ? payload.poolId : (payload.slotKey !== undefined ? payload.slotKey : payload.idx)));

    const engine = resolveRuleEngine();
    const fold = (s) => (engine && typeof engine.foldTr === 'function')
      ? engine.foldTr(s)
      : String(s || '').toLowerCase();

    let item = null;
    if (sourceType === 'slot') {
      item = doc.bodySlots ? doc.bodySlots[idOrIdx] : null;
    } else if (sourceType === 'pool' || sourceType === true) {
      item = (doc.gearPool || []).find(p => p && (String(p.id) === String(idOrIdx) || fold(p.name).trim() === fold(idOrIdx).trim()));
    } else {
      const numIdx = Number(idOrIdx);
      item = Array.isArray(doc.consumables)
        ? (doc.consumables[Number.isFinite(numIdx) ? numIdx : idOrIdx] || doc.consumables.find(c => c && (String(c.id) === String(idOrIdx) || fold(c.name).trim() === fold(idOrIdx).trim())))
        : null;
    }

    if (!item) {
      setOutcome({ status: 'not_found' });
      return doc;
    }

    // Normalize dailyCharges if present or patterned as X/day
    const combinedDesc = fold(`${item.name || ''} ${item.desc || ''} ${item.effect || ''}`);
    if (typeof item.dailyCharges === 'number' && item.dailyCharges > 0) {
      item.dailyCharges = { current: item.dailyCharges, max: item.dailyCharges, unit: 'charges', recharge: 'long_rest' };
    } else if (!item.dailyCharges) {
      const m = combinedDesc.match(/(\d+)\s*\/\s*day/i);
      if (m) {
        const max = parseInt(m[1] || m[2], 10);
        if (max > 0) item.dailyCharges = { current: max, max, unit: 'charges', recharge: 'long_rest' };
      }
    }

    const isDaily = Boolean(item.dailyCharges && typeof item.dailyCharges.max === 'number');
    if (isDaily) {
      if (item.dailyCharges.current <= 0) {
        setOutcome({ status: sourceType === 'slot' ? 'exhausted_slot' : 'exhausted_daily', item, max: item.dailyCharges.max });
        return doc;
      }
      item.dailyCharges.current--;
    } else {
      const curQty = (item.qty !== undefined && item.qty !== null) ? Number(item.qty) : 1;
      if (curQty <= 0) {
        setOutcome({ status: sourceType === 'pool' ? 'exhausted_pool' : 'exhausted_qty', item });
        return doc;
      }
      item.qty = Math.max(0, curQty - 1);
    }

    const name = item.name || 'Magic Item';
    const cleanName = fold(name).trim();
    const targetPoolId = (sourceType === 'pool' ? idOrIdx : (item.id || item.poolId));

    if (Array.isArray(doc.consumables)) {
      const cMatch = doc.consumables.find(c => c && fold(c.name).trim() === cleanName);
      if (cMatch) {
        if (!isDaily) cMatch.qty = item.qty;
        if (isDaily && item.dailyCharges) cMatch.dailyCharges = JSON.parse(JSON.stringify(item.dailyCharges));
      }
    }
    if (Array.isArray(doc.gearPool)) {
      const pMatch = doc.gearPool.find(p => p && ((targetPoolId && String(p.id) === String(targetPoolId)) || fold(p.name).trim() === cleanName));
      if (pMatch) {
        if (!isDaily) pMatch.qty = item.qty;
        if (isDaily && item.dailyCharges) pMatch.dailyCharges = JSON.parse(JSON.stringify(item.dailyCharges));
      }
    }

    const remainingInfo = isDaily
      ? `Daily Remaining: ${item.dailyCharges.current}/${item.dailyCharges.max}`
      : `Remaining Charges/Qty: ${item.qty}`;

    const plan = (engine && typeof engine.parseConsumablePlan === 'function')
      ? engine.parseConsumablePlan(item, item.effect || item.desc)
      : null;

    // 1. Healing Items & Cure Potions
    if (plan && plan.isHealing) {
      if (!doc.hp || typeof doc.hp !== 'object') {
        doc.hp = { current: 10, max: 10, temp: 0, nonlethal: 0 };
      }

      if (plan.isCureMinor) {
        const prevHp = Number(doc.hp.current) || 0;
        const maxHp = Number(doc.hp.max) || (prevHp + 1);
        doc.hp.current = Math.min(maxHp, prevHp + 1);
        setOutcome({ status: 'healed_minor', name, prevHp, newHp: doc.hp.current, maxHp, remainingInfo });
        return doc;
      }

      if (plan.isHealSpell) {
        const healTotal = plan.bonus || 110;
        const prevHp = Number(doc.hp.current) || 0;
        const maxHp = Number(doc.hp.max) || (prevHp + healTotal);
        doc.hp.current = Math.min(maxHp, prevHp + healTotal);
        const healCured = [];
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('sick') || bName.includes('nauseat') || bName.includes('blind') || bName.includes('deaf') || bName.includes('disease') || bName.includes('poison') || bName.includes('fatigue') || bName.includes('exhaust') || bName.includes('daze') || bName.includes('stun') || bName.includes('confus')) {
              b.active = false;
              b.durationText = 'Cured (Heal)';
              healCured.push(b.name);
            }
          });
        }
        setOutcome({ status: 'healed_spell', name, healTotal, prevHp, newHp: doc.hp.current, maxHp, healCured, remainingInfo });
        return doc;
      }

      const diceCount = plan.count || 1;
      const diceSides = plan.sides || 8;
      const flatBonus = plan.bonus || 0;
      const rollRes = extractRollList(payload.rolls, 'healRoll', diceCount, diceSides);
      const resolvedRolls = rollRes.values.map(v => ({ type: `d${diceSides}`, value: v }));
      const healTotal = rollRes.sum + flatBonus;
      const prevHp = Number(doc.hp.current) || 0;
      const maxHp = Number(doc.hp.max) || (prevHp + healTotal);
      doc.hp.current = Math.min(maxHp, prevHp + healTotal);
      setOutcome({
        status: 'healed_dice',
        name,
        diceCount,
        diceSides,
        flatBonus,
        rolls: resolvedRolls,
        healTotal,
        prevHp,
        newHp: doc.hp.current,
        maxHp,
        remainingInfo
      });
      return doc;
    }

    // 2. Offensive / Damage Wand or Alchemical Item
    if (plan && plan.isDamage) {
      const diceCount = plan.count || 1;
      const diceSides = plan.sides || 6;
      const rollRes = extractRollList(payload.rolls, 'dmgRoll', diceCount, diceSides);
      const totalDamage = rollRes.sum + (plan.bonus || 0);
      setOutcome({
        status: 'damage_roll',
        name,
        damagePlan: plan,
        rolls: rollRes.values,
        totalDamage,
        remainingInfo
      });
      return doc;
    }

    // 3. Condition / Debuff Cure Items
    if (plan && plan.isCure) {
      const cf = plan.cureFlags || {};
      const curedDebuffs = [];
      let abilityHealed = 0;

      if (cf.lesserRestoration || cf.fullRestoration) {
        if (cf.lesserRestoration) {
          const abilRoll = extractRollList(payload.rolls, 'abilityHealRoll', 1, 4);
          abilityHealed = abilRoll.sum;
        }
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            const bNotes = fold(b.notes || b.summary || '');
            const requiresFullRestoration = bNotes.includes('restoration gerektirir') || bNotes.includes('requires restoration') || b.ruleFlags?.requiresRestoration === true;
            const isDrain = bName.includes('drain') || bName.includes('negative level') || bNotes.includes('negative level') || requiresFullRestoration;
            const isExhaust = bName.includes('exhaust');
            const isFatigue = bName.includes('fatigue');

            if (cf.lesserRestoration) {
              if (isDrain) return;
              if (isExhaust) {
                b.name = 'Fatigued';
                b.durationText = 'Reduced from Exhausted (Lesser Restoration)';
                b.summary = '-2 penalty to Strength and Dexterity; cannot run or charge.';
                b.schemaVersion = 3;
                b.effects = [
                  { type: 'stat', targets: ['ability.str', 'ability.dex'], mode: 'flat', value: -2, btype: 'Penalty' }
                ];
                if (b.ruleFlags && typeof b.ruleFlags === 'object') {
                  delete b.ruleFlags.exhausted;
                  b.ruleFlags.fatigued = true;
                }
                curedDebuffs.push('Exhausted -> Fatigued');
              } else if (isFatigue) {
                b.active = false;
                b.durationText = 'Cured (Lesser Restoration)';
                curedDebuffs.push(b.name);
              }
            } else if (cf.fullRestoration) {
              if (isDrain || isExhaust || isFatigue) {
                b.active = false;
                b.durationText = 'Cured (Restoration)';
                curedDebuffs.push(b.name);
              }
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          if (cf.lesserRestoration) {
            const nextDebuffs = [];
            doc.activeDebuffs.forEach(d => {
              const dFold = fold(d);
              if (dFold.includes('exhaust')) {
                nextDebuffs.push('Fatigued');
                if (!curedDebuffs.includes('Exhausted -> Fatigued')) curedDebuffs.push('Exhausted -> Fatigued');
              } else if (dFold.includes('fatigue')) {
                if (!curedDebuffs.includes('Fatigued')) curedDebuffs.push('Fatigued');
              } else {
                nextDebuffs.push(d);
              }
            });
            doc.activeDebuffs = nextDebuffs;
          } else if (cf.fullRestoration) {
            const beforeLen = doc.activeDebuffs.length;
            doc.activeDebuffs = doc.activeDebuffs.filter(d => !/drain|negative\s*level|exhaust|fatigue/i.test(fold(d)));
            if (doc.activeDebuffs.length < beforeLen && curedDebuffs.length === 0) curedDebuffs.push('Restored');
          }
        }
      }

      if (cf.curse) {
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('curse')) {
              b.active = false;
              b.durationText = 'Cured (Remove Curse)';
              curedDebuffs.push(b.name);
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          const beforeLen = doc.activeDebuffs.length;
          doc.activeDebuffs = doc.activeDebuffs.filter(d => !/curse/i.test(fold(d)));
          if (doc.activeDebuffs.length < beforeLen) curedDebuffs.push('Cursed');
        }
      }

      if (cf.disease) {
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('disease') || bName.includes('sickened') || bName.includes('nauseated')) {
              b.active = false;
              b.durationText = 'Cured (Remove Disease)';
              curedDebuffs.push(b.name);
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          const beforeLen = doc.activeDebuffs.length;
          doc.activeDebuffs = doc.activeDebuffs.filter(d => !/disease|sicken|nauseat/i.test(fold(d)));
          if (doc.activeDebuffs.length < beforeLen) curedDebuffs.push('Diseased');
        }
      }

      if (cf.blindDeaf) {
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('blind') || bName.includes('deaf')) {
              b.active = false;
              b.durationText = 'Cured (Remove Blindness/Deafness)';
              curedDebuffs.push(b.name);
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          const beforeLen = doc.activeDebuffs.length;
          doc.activeDebuffs = doc.activeDebuffs.filter(d => !/blind|deaf/i.test(fold(d)));
          if (doc.activeDebuffs.length < beforeLen) curedDebuffs.push('Blinded/Deafened');
        }
      }

      if (cf.paralysis) {
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('paraly') || bName.includes('slow')) {
              b.active = false;
              b.durationText = 'Cured (Remove Paralysis)';
              curedDebuffs.push(b.name);
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          const beforeLen = doc.activeDebuffs.length;
          doc.activeDebuffs = doc.activeDebuffs.filter(d => !/paraly|slow/i.test(fold(d)));
          if (doc.activeDebuffs.length < beforeLen) curedDebuffs.push('Paralyzed');
        }
      }

      if (cf.poison) {
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('poison')) {
              b.active = false;
              b.durationText = 'Cured (Neutralize Poison)';
              curedDebuffs.push(b.name);
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          const beforeLen = doc.activeDebuffs.length;
          doc.activeDebuffs = doc.activeDebuffs.filter(d => !/poison/i.test(fold(d)));
          if (doc.activeDebuffs.length < beforeLen) curedDebuffs.push('Poisoned');
        }
      }

      if (curedDebuffs.length > 0) {
        setOutcome({ status: 'cured_debuffs', name, curedDebuffs, abilityHealed, remainingInfo });
        return doc;
      } else if (cf.lesserRestoration || cf.fullRestoration) {
        setOutcome({ status: 'restoration_no_effect', name, abilityHealed, remainingInfo });
        return doc;
      }
    }

    // 4. Buff Potion or Daily / Generic Consumable
    let activatedBuff = null;
    let activatedRounds = 30;
    let activatedSummary = '';
    if (!Array.isArray(doc.buffs)) doc.buffs = [];

    const comp = (typeof root !== 'undefined' && root.SrdCompendium)
      || (typeof SrdCompendium !== 'undefined' ? SrdCompendium : null);
    const compendiumEntry = (comp && typeof comp.getByName === 'function')
      ? (comp.getByName(name) || null)
      : null;
    const defaultRounds = Number(compendiumEntry?.ruleFlags?.durationRounds || item?.ruleFlags?.durationRounds) || 30;

    const match = doc.buffs.find(b => {
      if (!b) return false;
      const bClean = fold(b.name);
      const strippedItem = cleanName.replace(/^(potion|oil|elixir)\s+(of\s+)?/i, '').replace(/'s/g, '').trim();
      return bClean && (cleanName.includes(bClean) || (strippedItem && bClean.includes(strippedItem)));
    });
    if (match) {
      match.active = true;
      match.rounds = defaultRounds;
      activatedBuff = match.name;
      activatedRounds = match.rounds;
      activatedSummary = match.summary || match.notes || '';
    } else if (compendiumEntry && ((Array.isArray(compendiumEntry.effects) && compendiumEntry.effects.length > 0) || (compendiumEntry.ruleFlags && Object.keys(compendiumEntry.ruleFlags).length > 0))) {
      const buffTitle = String(compendiumEntry.name || name).replace(/^(Potion|Oil|Elixir)\s+of\s+/i, '').trim();
      const v3Effects = Array.isArray(compendiumEntry.effects) ? JSON.parse(JSON.stringify(compendiumEntry.effects)) : [];
      const v3Flags = compendiumEntry.ruleFlags ? JSON.parse(JSON.stringify(compendiumEntry.ruleFlags)) : {};
      const durMin = Math.round(defaultRounds / 10);
      const durText = defaultRounds >= 600 ? `${Math.round(defaultRounds / 600)} hr.` : (defaultRounds >= 10 ? `${durMin} min. (${defaultRounds} rounds)` : `${defaultRounds} rounds`);
      const newBuff = {
        id: 'buff_pot_' + (payload.nowTs || Date.now()),
        schemaVersion: 3,
        name: buffTitle,
        source: (plan && plan.isPotion) ? 'Potion' : 'Magic Item',
        category: 'Buff',
        active: true,
        rounds: defaultRounds,
        duration: durText,
        durationText: durText,
        casterLevel: Number(compendiumEntry.casterLevel) || 3,
        summary: compendiumEntry.shortDescription || buffTitle,
        notes: `Activated via ${name}`,
        effects: v3Effects,
        ruleFlags: v3Flags
      };
      doc.buffs.push(newBuff);
      activatedBuff = newBuff.name;
      activatedRounds = defaultRounds;
      activatedSummary = newBuff.summary;
    }

    setOutcome({
      status: activatedBuff ? 'buff_activated' : (isDaily ? 'daily_used' : 'generic_used'),
      name,
      activatedBuff,
      activatedRounds,
      activatedSummary,
      isDaily,
      dailyCharges: item.dailyCharges,
      remainingInfo
    });
    return doc;
  }

  CharStore.registerReducer('consumable/use', applyConsumableUseReducer);
  CharStore.applyConsumableUseReducer = applyConsumableUseReducer;

  // ==========================================================================
  // Phase R3: Combat Tab Domain Reducers (Action Economy, Round Tick, Special
  // Attacks, Reactive Modes, Tactical Modifiers, Weapon Sets & Buffs)
  // ==========================================================================
  function setStoreOutcome(_stateObj, out) {
    _lastOutcome = out || null;
    return out;
  }

  function ensureCombatActionStructures(doc) {
    if (!doc.tactical || typeof doc.tactical !== 'object') {
      doc.tactical = {};
    }
    if (!doc.tactical.spentActions || typeof doc.tactical.spentActions !== 'object') {
      const ae = doc.actionEconomy || {};
      doc.tactical.spentActions = {
        standard: ae.standard === false || ae.standard === 'spent',
        move: ae.move === false || ae.move === 'spent',
        swift: ae.swift === false || ae.swift === 'spent',
        immediate: ae.immediate === false || ae.immediate === 'spent',
        swiftLockedNextTurn: false
      };
    }
    if (!doc.actionEconomy || typeof doc.actionEconomy !== 'object') {
      doc.actionEconomy = {
        standard: !doc.tactical.spentActions.standard,
        move: !doc.tactical.spentActions.move,
        swift: !doc.tactical.spentActions.swift,
        immediate: !doc.tactical.spentActions.immediate
      };
    }
  }

  function syncActionEconomyFromSpent(doc) {
    ensureCombatActionStructures(doc);
    const sp = doc.tactical.spentActions;
    doc.actionEconomy = {
      standard: !sp.standard,
      move: !sp.move,
      swift: !sp.swift,
      immediate: !sp.immediate
    };
  }

  function applyConsumeActionOnDoc(doc, actionTypeOrString, sourceLabel = '') {
    ensureCombatActionStructures(doc);
    const spent = doc.tactical.spentActions;
    const ae = doc.actionEconomy;
    // Sync spent from actionEconomy if actionEconomy was explicitly set false
    ['standard', 'move', 'swift', 'immediate'].forEach(k => {
      if (ae[k] === false || ae[k] === 'spent') spent[k] = true;
    });

    const raw = String(
      (actionTypeOrString && typeof actionTypeOrString === 'object')
        ? (actionTypeOrString.castingTime || actionTypeOrString.action || actionTypeOrString.initiationAction || 'standard')
        : (actionTypeOrString || 'standard')
    ).trim().toLowerCase();

    if (/free/i.test(raw)) {
      syncActionEconomyFromSpent(doc);
      return {
        consumed: false,
        alreadySpent: false,
        reason: 'Free Action',
        spentLabel: 'Free Action',
        usedType: 'free',
        round: Number(doc.encounterRound || doc.tactical?.round) || 1,
        sourceLabel
      };
    }

    let kind = 'standard';
    if (/full[-\s]*round|1\s*round|^full$/i.test(raw)) kind = 'full';
    else if (/swift/i.test(raw)) kind = 'swift';
    else if (/immediate|reaction/i.test(raw)) kind = 'immediate';
    else if (/move/i.test(raw)) kind = 'move';

    let alreadySpent = false;
    let spentLabel = 'Standard Action';

    if (kind === 'full') {
      alreadySpent = Boolean(spent.standard || spent.move);
      if (spent.standard && spent.move) {
        spentLabel = 'Full-Round Action (Standard + Move)';
      } else if (spent.standard) {
        spentLabel = 'Standard Action (required for Full-Round Action)';
      } else if (spent.move) {
        spentLabel = 'Move Action (required for Full-Round Action)';
      } else {
        spentLabel = 'Full-Round Action';
      }
      spent.standard = true;
      spent.move = true;
    } else if (kind === 'move' && spent.move && !spent.standard) {
      spent.standard = true;
      alreadySpent = false;
      spentLabel = 'Move Action (converted from Standard Action)';
    } else if (kind === 'immediate') {
      alreadySpent = Boolean(spent.immediate);
      spent.immediate = true;
      if (!spent.swift) {
        spent.swift = true;
      } else {
        spent.swiftLockedNextTurn = true;
      }
      spentLabel = 'Immediate Action';
    } else {
      alreadySpent = Boolean(spent[kind]);
      const cap = kind.charAt(0).toUpperCase() + kind.slice(1);
      spentLabel = `${cap} Action`;
      spent[kind] = true;
    }

    syncActionEconomyFromSpent(doc);
    return {
      consumed: !alreadySpent,
      alreadySpent,
      reason: spentLabel,
      spentLabel,
      usedType: kind,
      round: Number(doc.encounterRound || doc.tactical?.round) || 1,
      sourceLabel
    };
  }

  function syncCooldownOnDoc(doc, abilityKey, name, cooldownRounds, resourceId) {
    if (!doc.tactical || typeof doc.tactical !== 'object') doc.tactical = {};
    if (!doc.tactical.abilityCooldowns || typeof doc.tactical.abilityCooldowns !== 'object') {
      doc.tactical.abilityCooldowns = {};
    }
    if (!doc.specialAttackCooldowns || typeof doc.specialAttackCooldowns !== 'object') {
      doc.specialAttackCooldowns = {};
    }
    const curRound = Number(doc.tactical.round || doc.encounterRound) || 1;
    const waitRounds = Math.max(0, Number(cooldownRounds) || 0);
    if (waitRounds > 0) {
      const readyRound = curRound + waitRounds;
      doc.specialAttackCooldowns[abilityKey] = waitRounds;
      doc.tactical.abilityCooldowns[abilityKey] = {
        name: name || abilityKey,
        waitRounds,
        readyRound,
        rolledAtRound: curRound
      };
    } else {
      delete doc.specialAttackCooldowns[abilityKey];
      delete doc.tactical.abilityCooldowns[abilityKey];
    }

    const syncResList = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(entry => {
        if (!entry || !Array.isArray(entry.resources)) return;
        const entryMatch = entry.id === abilityKey || String(entry.id || '').replace(/[^a-z0-9_:]+/gi, '_') === abilityKey;
        entry.resources.forEach(r => {
          if (!r) return;
          if ((resourceId && r.id === resourceId) || entryMatch) {
            r.cooldownRemaining = waitRounds;
          }
        });
      });
    };
    syncResList(doc.legoEntries);
    syncResList(doc.specialAbilities);
  }

  // 1. 'combat/advanceRound'
  CharStore.registerReducer('combat/advanceRound', (doc, _action, stateObj) => {
    ensureCombatActionStructures(doc);
    doc.tactical.round = (Number(doc.tactical.round || doc.encounterRound) || 1) + 1;
    doc.encounterRound = doc.tactical.round;

    const lockSwift = Boolean(doc.tactical.spentActions && doc.tactical.spentActions.swiftLockedNextTurn);
    doc.tactical.spentActions = {
      standard: false,
      move: false,
      swift: lockSwift,
      immediate: false,
      swiftLockedNextTurn: false
    };
    syncActionEconomyFromSpent(doc);

    const notes = [];
    if (doc.tactical.shieldBlockActive) {
      doc.tactical.shieldBlockActive = false;
      notes.push('Shield Block reset');
    }
    if (doc.tactical.charge) {
      doc.tactical.charge = false;
      notes.push('Charge AC penalty cleared');
    }

    const engine = resolveRuleEngine();
    if (engine && typeof engine.tickRoundResources === 'function') {
      const tickRes = engine.tickRoundResources(doc);
      if (tickRes && Array.isArray(tickRes.notes)) {
        notes.push(...tickRes.notes);
      }
    }

    if (Array.isArray(doc.buffs)) {
      doc.buffs.forEach(b => {
        if (!b || b.active === false) return;
        const isPerm = /perm/i.test(String(b.duration || b.durationText || ''));
        if (isPerm) return;
        if (typeof b.durationRounds === 'number' && b.durationRounds > 0) {
          b.durationRounds = Math.max(0, b.durationRounds - 1);
          if (typeof b.rounds === 'number' && b.rounds > 0) {
            b.rounds = b.durationRounds;
          }
          if (b.durationRounds === 0) {
            b.active = false;
            b.durationText = 'Expired';
            notes.push(`⌛ ${b.name || 'Buff'} expired`);
          } else {
            b.durationText = `${b.durationRounds} ${b.durationRounds === 1 ? 'round' : 'rounds'}`;
          }
        } else if (Number.isFinite(Number(b.rounds)) && Number(b.rounds) > 0) {
          b.rounds = Math.max(0, Number(b.rounds) - 1);
          if (b.rounds === 0) {
            b.active = false;
            b.durationText = 'Expired';
            notes.push(`⌛ ${b.name || 'Buff'} expired`);
          } else {
            b.durationText = `${b.rounds} ${b.rounds === 1 ? 'round' : 'rounds'}`;
          }
        }
      });
    }

    setStoreOutcome(stateObj, {
      status: 'round_advanced',
      round: doc.tactical.round,
      notes
    });
    return doc;
  });

  // 2. 'combat/consumeAction'
  CharStore.registerReducer('combat/consumeAction', (doc, action, stateObj) => {
    const payload = (action && action.payload) || {};
    const out = applyConsumeActionOnDoc(doc, payload.actionType, payload.sourceLabel || '');
    setStoreOutcome(stateObj, out);
    return doc;
  });

  // 3. 'combat/toggleAction' & 'combat/resetActions'
  CharStore.registerReducer('combat/toggleAction', (doc, action, stateObj) => {
    ensureCombatActionStructures(doc);
    const type = action?.payload?.type;
    if (type && ['standard', 'move', 'swift', 'immediate'].includes(type)) {
      doc.tactical.spentActions[type] = !doc.tactical.spentActions[type];
      syncActionEconomyFromSpent(doc);
    }
    setStoreOutcome(stateObj, { status: 'action_toggled', type, actionEconomy: Object.assign({}, doc.actionEconomy) });
    return doc;
  });

  CharStore.registerReducer('combat/resetActions', (doc, _action, stateObj) => {
    ensureCombatActionStructures(doc);
    const lockSwift = Boolean(doc.tactical.spentActions && doc.tactical.spentActions.swiftLockedNextTurn);
    doc.tactical.spentActions = {
      standard: false,
      move: false,
      swift: lockSwift,
      immediate: false,
      swiftLockedNextTurn: false
    };
    syncActionEconomyFromSpent(doc);
    setStoreOutcome(stateObj, { status: 'actions_reset', actionEconomy: Object.assign({}, doc.actionEconomy) });
    return doc;
  });

  // 4. 'combat/specialAttackRoll', 'combat/specialAttackRecharge', & 'combat/specialAttackReady'
  // Rule Crafter sub-power use counters (`doc.powerUses[abilityKey] = { used, mode }`).
  function resetPowerUsesOnDoc(doc, modes) {
    if (!doc || !doc.powerUses || typeof doc.powerUses !== 'object') return;
    Object.keys(doc.powerUses).forEach(function (k) {
      const rec = doc.powerUses[k];
      const mode = rec && typeof rec === 'object' ? rec.mode : '';
      if (!mode || modes.indexOf(mode) >= 0) delete doc.powerUses[k];
    });
  }

  CharStore.registerReducer('combat/specialAttackRoll', (doc, action, stateObj) => {
    const payload = (action && action.payload) || {};
    const abilityKey = payload.abilityKey;
    if (!abilityKey) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    // A recharging ability (breath weapon, cooldown power) cannot be used before its ready round.
    const cdRec = doc.tactical && doc.tactical.abilityCooldowns && doc.tactical.abilityCooldowns[abilityKey];
    const readyAt = cdRec && typeof cdRec === 'object' ? (Number(cdRec.readyRound) || 0) : 0;
    const roundNow = Number((doc.tactical && doc.tactical.round) || doc.encounterRound) || 1;
    if (!payload.force && readyAt > roundNow) {
      setStoreOutcome(stateObj, { status: 'on_cooldown', abilityKey, readyRound: readyAt, roundsLeft: readyAt - roundNow });
      return doc;
    }
    const usesMax = Math.max(0, Number(payload.usesMax) || 0);
    const usageMode = String(payload.usageMode || '');
    if (usesMax && (usageMode === 'perDay' || usageMode === 'perEncounter' || usageMode === 'charges')) {
      if (!doc.powerUses || typeof doc.powerUses !== 'object' || Array.isArray(doc.powerUses)) doc.powerUses = {};
      const prev = doc.powerUses[abilityKey];
      const used = Math.max(0, Number(prev && typeof prev === 'object' ? prev.used : prev) || 0);
      if (used >= usesMax) {
        setStoreOutcome(stateObj, { status: 'uses_exhausted', abilityKey, usesMax });
        return doc;
      }
      doc.powerUses[abilityKey] = { used: used + 1, mode: usageMode };
    }
    const actOut = applyConsumeActionOnDoc(doc, payload.actionType || 'standard', payload.name || abilityKey);
    if (payload.cooldownRounds !== undefined && payload.cooldownRounds !== null && Number(payload.cooldownRounds) > 0) {
      syncCooldownOnDoc(doc, abilityKey, payload.name || abilityKey, Number(payload.cooldownRounds), payload.resourceId);
    }
    setStoreOutcome(stateObj, {
      status: 'special_attack_rolled',
      abilityKey,
      cooldownRounds: Number(payload.cooldownRounds) || 0,
      actionOutcome: actOut
    });
    return doc;
  });

  CharStore.registerReducer('combat/specialAttackRecharge', (doc, action, stateObj) => {
    const payload = (action && action.payload) || {};
    const abilityKey = payload.abilityKey;
    if (!abilityKey) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const waitRounds = Math.max(1, Number(payload.cooldownRounds) || 1);
    syncCooldownOnDoc(doc, abilityKey, payload.name || abilityKey, waitRounds, payload.resourceId);
    setStoreOutcome(stateObj, {
      status: 'special_attack_recharged',
      abilityKey,
      cooldownRounds: waitRounds
    });
    return doc;
  });

  CharStore.registerReducer('combat/specialAttackReady', (doc, action, stateObj) => {
    const payload = (action && action.payload) || {};
    const abilityKey = payload.abilityKey;
    if (!abilityKey) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    syncCooldownOnDoc(doc, abilityKey, payload.name || abilityKey, 0, payload.resourceId);
    setStoreOutcome(stateObj, {
      status: 'special_attack_ready',
      abilityKey
    });
    return doc;
  });

  // 5. 'combat/triggerReactiveMode'
  CharStore.registerReducer('combat/triggerReactiveMode', (doc, action, stateObj) => {
    const payload = (action && action.payload) || {};
    const engine = resolveRuleEngine();
    if (!engine || typeof engine.activateLegoMode !== 'function') {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const res = engine.activateLegoMode(doc, payload.entryId, payload.modeId, payload.inputValues || {});
    if (!res) {
      setStoreOutcome(stateObj, { status: 'not_found' });
      return doc;
    }
    const actOut = applyConsumeActionOnDoc(doc, payload.actionType || 'immediate', `${payload.entryId} (${payload.modeId})`);
    setStoreOutcome(stateObj, {
      status: 'reactive_mode_triggered',
      result: res,
      actionOutcome: actOut
    });
    return doc;
  });

  const DEFAULT_TACTICAL_MOD_KEYS = [
    'flanking', 'charge', 'higherGround',
    'fightingDefensively', 'totalDefense', 'shieldBlockActive',
    'powerAttackActive', 'combatExpertiseActive',
    'rapidShot', 'manyshot', 'pointBlankShot', 'deadlyAim',
    'targetInMelee', 'coverPenalty', 'defensiveCastingActive',
    'rangePenalty', 'enhanceArrow', 'trueStrike', 'sneakAttack', 'bootsHaste', 'witchlightSpeed'
  ];

  function isAllowedTacticalModKey(key) {
    if (!key || typeof key !== 'string') return false;
    const engine = resolveRuleEngine();
    const list = (engine && Array.isArray(engine.TACTICAL_MOD_KEYS))
      ? engine.TACTICAL_MOD_KEYS
      : DEFAULT_TACTICAL_MOD_KEYS;
    return list.includes(key);
  }

  // 6. 'combat/toggleTacticalMod', 'combat/adjustPowerAttack', 'combat/adjustCombatExpertise',
  //    'combat/switchWeaponSet', 'combat/toggleBuff', & 'combat/removeBuff'
  CharStore.registerReducer('combat/toggleTacticalMod', (doc, action, stateObj) => {
    ensureCombatActionStructures(doc);
    const payload = (action && action.payload) || {};
    if (payload.globalIdx !== undefined && payload.globalIdx !== null) {
      const idx = Number(payload.globalIdx);
      if (Array.isArray(doc.tacticalRiders) && doc.tacticalRiders[idx]) {
        const nextAct = payload.value !== undefined
          ? Boolean(payload.value)
          : !Boolean(doc.tacticalRiders[idx].active);
        doc.tacticalRiders[idx].active = nextAct;
      }
      setStoreOutcome(stateObj, { status: 'modifier_toggled', globalIdx: idx });
      return doc;
    }
    const rawKey = payload.key;
    const resolvedKey = rawKey === 'shieldBlock' ? 'shieldBlockActive' : rawKey;
    if (!resolvedKey || !isAllowedTacticalModKey(resolvedKey)) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const nextVal = payload.value !== undefined
      ? Boolean(payload.value)
      : !Boolean(doc.tactical[resolvedKey]);
    doc.tactical[resolvedKey] = nextVal;
    if (resolvedKey === 'fightingDefensively' && nextVal) {
      doc.tactical.totalDefense = false;
    } else if (resolvedKey === 'totalDefense' && nextVal) {
      // PHB p.142: Total Defense is a standard action and you can't attack, so the attack-only options
      // (Fighting Defensively, Combat Expertise PHB p.92, Power Attack PHB p.98) cannot apply alongside it.
      doc.tactical.fightingDefensively = false;
      doc.tactical.combatExpertise = 0;
      doc.tactical.powerAttack = 0;
    }
    setStoreOutcome(stateObj, { status: 'tactical_toggled', key: resolvedKey, value: doc.tactical[resolvedKey] });
    return doc;
  });

  // Select the active `modes[]` entry of a class feature / feat (Rage, Bardic Music ...): `doc.activeModes[entryId] = modeId`.
  // `modeId: null` switches the entry off (read by RuleEngine.evaluateV3Entry via `character.activeModes`).
  CharStore.registerReducer('combat/setActiveMode', (doc, action, stateObj) => {
    const payload = (action && action.payload) || {};
    const entryId = String(payload.entryId || '').trim();
    if (!entryId) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    if (!doc.activeModes || typeof doc.activeModes !== 'object') doc.activeModes = {};
    if (payload.modeId === null || payload.modeId === undefined || payload.modeId === '') {
      delete doc.activeModes[entryId];
    } else {
      doc.activeModes[entryId] = String(payload.modeId);
    }
    setStoreOutcome(stateObj, { status: 'mode_set', entryId, modeId: doc.activeModes[entryId] || null });
    return doc;
  });

  // Weapon mode selector (Flaming Burst, Energy Assault ...): picking the active mode again switches it off.
  // Writes the weapon's `activeModeId`, `doc.activeModes[weaponId|name]` and, when the mode adds damage dice, its tactical rider.
  CharStore.registerReducer('combat/selectWeaponMode', (doc, action, stateObj) => {
    const payload = (action && action.payload) || {};
    const wep = Array.isArray(doc.weapons) ? doc.weapons.find(w => w && w.name === payload.weaponName) : null;
    if (!wep) {
      setStoreOutcome(stateObj, { status: 'not_found' });
      return doc;
    }
    wep.activeModeId = (wep.activeModeId === payload.modeId) ? null : payload.modeId;
    if (!doc.activeModes || typeof doc.activeModes !== 'object') doc.activeModes = {};
    doc.activeModes[wep.id || wep.name] = wep.activeModeId;
    const r = payload.rider;
    if (wep.activeModeId && r && r.name && r.dice) {
      if (!Array.isArray(doc.tacticalRiders)) doc.tacticalRiders = [];
      const existing = doc.tacticalRiders.find(m => m && m.name === r.name);
      if (existing) existing.active = true;
      else {
        doc.tacticalRiders.push({
          schemaVersion: 3,
          id: r.id || ('rider_' + String(r.name).toLowerCase().replace(/[^a-z0-9]+/g, '_')),
          name: r.name,
          source: wep.name,
          active: true,
          effects: [{ type: 'roll', kind: 'Damage', dice: r.dice, dmgType: r.dmgType || 'Energy' }]
        });
      }
    }
    setStoreOutcome(stateObj, { status: 'weapon_mode_set', weapon: wep.name, modeId: wep.activeModeId });
    return doc;
  });

  CharStore.registerReducer('combat/adjustPowerAttack', (doc, action, stateObj) => {
    ensureCombatActionStructures(doc);
    const payload = (action && action.payload) || {};
    const bab = Math.max(0, Number(doc.bab) || 0);
    const cur = Number(doc.tactical.powerAttack) || 0;
    const next = payload.value !== undefined
      ? Number(payload.value)
      : (cur + (Number(payload.delta) || 0));
    doc.tactical.powerAttack = Math.max(0, Math.min(bab, next));
    // Power Attack is declared when attacking (PHB p.98); Total Defense forbids attacking (PHB p.142).
    if (doc.tactical.powerAttack > 0) doc.tactical.totalDefense = false;
    setStoreOutcome(stateObj, { status: 'power_attack_adjusted', value: doc.tactical.powerAttack });
    return doc;
  });

  CharStore.registerReducer('combat/adjustCombatExpertise', (doc, action, stateObj) => {
    ensureCombatActionStructures(doc);
    const payload = (action && action.payload) || {};
    const maxCap = Math.min(5, Math.max(0, Number(doc.bab) || 0));
    const cur = Number(doc.tactical.combatExpertise) || 0;
    const next = payload.value !== undefined
      ? Number(payload.value)
      : (cur + (Number(payload.delta) || 0));
    doc.tactical.combatExpertise = Math.max(0, Math.min(maxCap, next));
    // Combat Expertise applies only when attacking in melee (PHB p.92); Total Defense forbids attacking (PHB p.142).
    if (doc.tactical.combatExpertise > 0) doc.tactical.totalDefense = false;
    setStoreOutcome(stateObj, { status: 'combat_expertise_adjusted', value: doc.tactical.combatExpertise });
    return doc;
  });

  CharStore.registerReducer('combat/switchWeaponSet', (doc, action, stateObj) => {
    ensureCombatActionStructures(doc);
    const payload = (action && action.payload) || {};
    const setNum = Number(payload.setNum) || 1;
    doc.activeWeaponSet = setNum;
    if (Array.isArray(payload.activeSets) && doc.tactical.weaponSets) {
      doc.tactical.weaponSets.activeSets = payload.activeSets.slice();
      doc.tactical.weaponSets.activeSet = (payload.activeSets.includes(1) && payload.activeSets.includes(2))
        ? 'both'
        : (payload.activeSets.includes(2) ? 2 : 1);
    }
    setStoreOutcome(stateObj, { status: 'weapon_set_switched', setNum });
    return doc;
  });

  CharStore.registerReducer('combat/toggleBuff', (doc, action, stateObj) => {
    const payload = (action && action.payload) || {};
    const idx = Number(payload.index);
    if (!Array.isArray(doc.buffs) || !doc.buffs[idx]) {
      setStoreOutcome(stateObj, { status: 'not_found' });
      return doc;
    }
    const b = doc.buffs[idx];
    const wasActive = b.active !== false;
    const nextActive = !wasActive;
    b.active = nextActive;
    if (wasActive && !nextActive && doc.hp) {
      const tempHp = Math.max(
        Number(payload.grantedTempHp) || 0,
        Number(b.tempHp) || 0,
        Number(b.ruleFlags?.tempHp) || 0
      );
      if (tempHp > 0) {
        doc.hp.temp = Math.max(0, (Number(doc.hp.temp) || 0) - tempHp);
      }
      if (b._tempHpSynced) {
        delete b._tempHpSynced;
      }
    }
    setStoreOutcome(stateObj, { status: 'buff_toggled', index: idx, active: b.active });
    return doc;
  });

  CharStore.registerReducer('combat/removeBuff', (doc, action, stateObj) => {
    const payload = (action && action.payload) || {};
    const idx = Number(payload.index);
    if (!Array.isArray(doc.buffs) || !doc.buffs[idx]) {
      setStoreOutcome(stateObj, { status: 'not_found' });
      return doc;
    }
    const b = doc.buffs[idx];
    if (b && b.active !== false && doc.hp) {
      const tempHp = Math.max(
        Number(payload.grantedTempHp) || 0,
        Number(b.tempHp) || 0,
        Number(b.ruleFlags?.tempHp) || 0
      );
      if (tempHp > 0) {
        doc.hp.temp = Math.max(0, (Number(doc.hp.temp) || 0) - tempHp);
      }
    }
    doc.buffs.splice(idx, 1);
    setStoreOutcome(stateObj, { status: 'buff_removed', index: idx });
    return doc;
  });

  // =========================================================================
  // Phase R4: Pure Inventory & Gear Pool Reducers ('inventory/*')
  // =========================================================================
  function ensureInventoryDocStructures(doc) {
    if (!doc || typeof doc !== 'object') return;
    if (!doc.bodySlots || typeof doc.bodySlots !== 'object') doc.bodySlots = {};
    if (!Array.isArray(doc.gearPool)) doc.gearPool = [];
    if (!Array.isArray(doc.consumables)) doc.consumables = [];
    if (!Array.isArray(doc.weapons)) doc.weapons = [];
    if (!doc.tactical || typeof doc.tactical !== 'object') doc.tactical = {};
    if (!doc.tactical.weaponSets || typeof doc.tactical.weaponSets !== 'object') {
      doc.tactical.weaponSets = {
        activeSet: 1,
        activeSets: [1],
        set1: { mainWeapon: doc.activeWeapon || 'None', grip: doc.activeGrip || '1-Hand' },
        set2: { mainWeapon: doc.activeOffHand || 'None', grip: 'Off-Hand' }
      };
    }
  }

  // Resolves the gearPool row an equipped slot / weapon row was created from.
  // Immutable `poolItemId` link first; display-name match only for legacy rows saved before the link existed.
  function findLinkedPoolItem(doc, ref) {
    if (!doc || !Array.isArray(doc.gearPool) || !ref) return null;
    if (ref.poolItemId !== undefined && ref.poolItemId !== null && ref.poolItemId !== '') {
      const byId = doc.gearPool.find(p => p && String(p.id) === String(ref.poolItemId));
      if (byId) return byId;
    }
    const nameLower = String(ref.name || '').toLowerCase().trim();
    if (!nameLower || nameLower === '-') return null;
    return doc.gearPool.find(p => p && String(p.name || '').toLowerCase().trim() === nameLower) || null;
  }

  function unequipSlotOnDoc(doc, slotKey) {
    ensureInventoryDocStructures(doc);
    const slot = doc.bodySlots[slotKey];
    if (!slot || !slot.name || slot.name === '-') return null;
    const engine = resolveRuleEngine();
    const existingInPool = findLinkedPoolItem(doc, slot);
    if (existingInPool) {
      existingInPool.isEquipped = false;
    } else {
      const cat = slot.category || (engine && typeof engine.inferInventoryItemCategory === 'function' ? engine.inferInventoryItemCategory(slot) : 'Wondrous');
      doc.gearPool.push({
        id: slot.id || ('pool_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
        baseItemId: slot.baseItemId,
        name: slot.name,
        masterDbName: slot.masterDbName || slot.name,
        category: cat,
        slot: slotKey,
        qty: 1,
        weight: Number(slot.weight) || 0,
        cost: Number(slot.cost) || 0,
        desc: slot.desc || slot.description || '',
        benefit: slot.benefit || '',
        description: slot.description || slot.desc || '',
        material: slot.material,
        enhancementBonus: slot.enhancementBonus,
        enhancements: Array.isArray(slot.enhancements) ? slot.enhancements.slice() : undefined,
        schemaVersion: 3,
        weapon: slot.weapon ? JSON.parse(JSON.stringify(slot.weapon)) : undefined,
        armor: slot.armor ? JSON.parse(JSON.stringify(slot.armor)) : undefined,
        effects: Array.isArray(slot.effects) ? JSON.parse(JSON.stringify(slot.effects)) : undefined,
        dice: slot.weapon?.damageDice || slot.dice,
        critMin: slot.weapon?.baseCritRange || slot.critMin,
        critRange: slot.weapon?.baseCritRange || slot.critRange,
        critMult: slot.weapon?.critMultiplier || slot.critMult,
        handedness: slot.weapon?.handedness || slot.handedness,
        dmgType: slot.weapon?.dmgType || slot.weapon?.damageType || slot.dmgType,
        isLight: slot.isLight,
        bonusType: slot.bonusType,
        maxDex: slot.armor?.maxDex ?? slot.maxDex,
        checkPenalty: slot.armor?.armorCheckPenalty ?? slot.checkPenalty,
        spellFailure: slot.armor?.arcaneSpellFailure ?? slot.spellFailure,
        dailyCharges: slot.dailyCharges ? JSON.parse(JSON.stringify(slot.dailyCharges)) : undefined,
        ruleFlags: slot.ruleFlags ? JSON.parse(JSON.stringify(slot.ruleFlags)) : undefined,
        tacticalBadges: Array.isArray(slot.tacticalBadges) ? JSON.parse(JSON.stringify(slot.tacticalBadges)) : undefined,
        isBelt: false,
        isEquipped: false
      });
    }
    const unequippedName = slot.name;
    doc.bodySlots[slotKey] = { name: '-', active: false, weight: 0, cost: 0, desc: '' };
    if (slotKey === 'mainHand') {
      if (doc.tactical?.weaponSets?.set1) {
        doc.tactical.weaponSets.set1.mainWeapon = 'None';
      }
      doc.activeWeapon = 'None';
    } else if (slotKey === 'offHand') {
      if (doc.tactical?.weaponSets?.set2) {
        doc.tactical.weaponSets.set2.mainWeapon = 'None';
      }
      doc.activeOffHand = 'None';
    }
    return unequippedName;
  }

  function resolveTargetBodySlotKey(doc, item, forceSlotKey) {
    if (forceSlotKey) return forceSlotKey;
    const engine = resolveRuleEngine();
    const cat = item.category || (engine && typeof engine.inferInventoryItemCategory === 'function' ? engine.inferInventoryItemCategory(item) : 'Other');
    const slotText = String(item.slot || '').toLowerCase();
    const map = {
      Head: 'head',
      Eyes: 'eyes',
      Neck: 'neck',
      Shoulders: 'shoulders',
      Armor: 'armor',
      Torso: 'torso',
      Bracers: 'bracers',
      Gloves: 'gloves',
      Belt: 'belt',
      Boots: 'boots',
      Shield: 'offHand',
      Weapon: 'mainHand'
    };
    if (map[cat]) return map[cat];
    if (cat === 'Ring' || slotText.includes('ring')) {
      const r1 = doc.bodySlots?.ring1;
      const r2 = doc.bodySlots?.ring2;
      if (!r1 || !r1.name || r1.name === '-') return 'ring1';
      if (!r2 || !r2.name || r2.name === '-') return 'ring2';
      return 'ring1';
    }
    if (slotText.includes('head') || slotText.includes('helm')) return 'head';
    if (slotText.includes('eye') || slotText.includes('face') || slotText.includes('goggle')) return 'eyes';
    if (slotText.includes('neck') || slotText.includes('throat') || slotText.includes('amulet')) return 'neck';
    if (slotText.includes('shoulder') || slotText.includes('cloak') || slotText.includes('cape')) return 'shoulders';
    if (slotText.includes('armor') || slotText === 'body') return 'armor';
    if (slotText.includes('torso') || slotText.includes('vest') || slotText.includes('shirt')) return 'torso';
    if (slotText.includes('arm') || slotText.includes('bracer') || slotText.includes('wrist')) return 'bracers';
    if (slotText.includes('hand') || slotText.includes('glove') || slotText.includes('gauntlet')) return 'gloves';
    if (slotText.includes('belt') || slotText.includes('waist')) return 'belt';
    if (slotText.includes('feet') || slotText.includes('boot') || slotText.includes('shoe')) return 'boots';
    if (slotText.includes('off') || slotText.includes('shield')) return 'offHand';
    if (slotText.includes('main') || slotText.includes('weapon')) return 'mainHand';
    return null;
  }

  // 1. 'inventory/adjustPoolQty' ({ itemId, delta })
  CharStore.registerReducer('inventory/adjustPoolQty', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const item = doc.gearPool.find(p => p && String(p.id) === String(payload.itemId));
    if (!item) {
      setStoreOutcome(stateObj, { status: 'not_found' });
      return doc;
    }
    const curQty = (item.qty !== undefined && item.qty !== null) ? Number(item.qty) : 1;
    const nextQty = payload.value !== undefined
      ? Math.max(0, Number(payload.value) || 0)
      : Math.max(0, curQty + (Number(payload.delta) || 0));
    item.qty = nextQty;
    const cleanName = String(item.name || '').toLowerCase().trim();
    const cons = doc.consumables.find(c => c && String(c.name || '').toLowerCase().trim() === cleanName);
    if (cons) {
      cons.qty = item.qty;
    }
    setStoreOutcome(stateObj, { status: 'pool_qty_adjusted', itemId: item.id, qty: item.qty, name: item.name });
    return doc;
  });

  // 2. 'inventory/togglePoolBelt' ({ itemId })
  CharStore.registerReducer('inventory/togglePoolBelt', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const item = doc.gearPool.find(p => p && String(p.id) === String(payload.itemId));
    if (!item) {
      setStoreOutcome(stateObj, { status: 'not_found' });
      return doc;
    }
    item.isBelt = payload.value !== undefined ? Boolean(payload.value) : !Boolean(item.isBelt);
    item.inBelt = item.isBelt;
    const cleanName = String(item.name || '').toLowerCase().trim();
    if (item.isBelt) {
      const exists = doc.consumables.some(c => c && String(c.name || '').toLowerCase().trim() === cleanName);
      if (!exists) {
        doc.consumables.push({
          name: item.name,
          qty: (item.qty !== undefined && item.qty !== null) ? Number(item.qty) : 1,
          effect: item.desc || item.benefit || 'Quick-use belt item'
        });
      }
    } else if (item.category !== 'Consumable') {
      doc.consumables = doc.consumables.filter(c => !c || String(c.name || '').toLowerCase().trim() !== cleanName);
    }
    setStoreOutcome(stateObj, { status: 'pool_belt_toggled', itemId: item.id, isBelt: item.isBelt, name: item.name });
    return doc;
  });

  // 3. 'inventory/deletePoolItem' ({ itemId })
  CharStore.registerReducer('inventory/deletePoolItem', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const idx = doc.gearPool.findIndex(p => p && String(p.id) === String(payload.itemId));
    if (idx < 0) {
      setStoreOutcome(stateObj, { status: 'not_found' });
      return doc;
    }
    const item = doc.gearPool[idx];
    const cleanName = String(item.name || '').toLowerCase().trim();
    doc.gearPool.splice(idx, 1);
    doc.consumables = doc.consumables.filter(c => !c || String(c.name || '').toLowerCase().trim() !== cleanName);
    if (item.category === 'Weapon') {
      const mhName = String(doc.bodySlots?.mainHand?.name || '').toLowerCase().trim();
      const ohName = String(doc.bodySlots?.offHand?.name || '').toLowerCase().trim();
      if (mhName !== cleanName && ohName !== cleanName) {
        doc.weapons = doc.weapons.filter(w => !w || String(w.name || '').toLowerCase().trim() !== cleanName);
      }
    }
    setStoreOutcome(stateObj, { status: 'pool_item_deleted', itemId: payload.itemId, name: item.name });
    return doc;
  });

  // 4. 'inventory/equipPoolItem' ({ itemId, forceSlotKey })
  CharStore.registerReducer('inventory/equipPoolItem', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const engine = resolveRuleEngine();
    const item = doc.gearPool.find(p => p && (String(p.id) === String(payload.itemId) || (payload.itemName && String(p.name || '').toLowerCase().trim() === String(payload.itemName).toLowerCase().trim())));
    if (!item) {
      setStoreOutcome(stateObj, { status: 'not_found' });
      return doc;
    }
    if (!item.category || item.category === 'Other') {
      item.category = (engine && typeof engine.inferInventoryItemCategory === 'function')
        ? engine.inferInventoryItemCategory(item)
        : (item.type || 'Other');
    }
    const targetSlotKey = resolveTargetBodySlotKey(doc, item, payload.forceSlotKey || payload.targetSlot || null);
    if (!targetSlotKey) {
      setStoreOutcome(stateObj, { status: 'no_target_slot', itemId: item.id, name: item.name });
      return doc;
    }

    let twoHandWarningMsg = '';
    const isTwoHand = Boolean(engine && typeof engine.isTwoHandedWeapon === 'function' && engine.isTwoHandedWeapon(item));
    if (targetSlotKey === 'mainHand' && isTwoHand) {
      const offSlot = doc.bodySlots.offHand;
      if (offSlot && offSlot.name && offSlot.name !== '-') {
        const oldOffName = unequipSlotOnDoc(doc, 'offHand');
        twoHandWarningMsg = `2-Handed Weapon Rule: "${item.name}" requires two hands, so Off-Hand item "${oldOffName}" was automatically unequipped.`;
      }
    } else if (targetSlotKey === 'offHand') {
      const mainSlot = doc.bodySlots.mainHand;
      if (mainSlot && mainSlot.name && mainSlot.name !== '-' && engine && typeof engine.isTwoHandedWeapon === 'function' && engine.isTwoHandedWeapon(mainSlot)) {
        const oldMainName = unequipSlotOnDoc(doc, 'mainHand');
        twoHandWarningMsg = `2-Handed Conflict: Equipping "${item.name}" in Off-Hand automatically unequipped 2-handed weapon "${oldMainName}".`;
      }
    }

    const currentInSlot = doc.bodySlots[targetSlotKey];
    if (currentInSlot && currentInSlot.name && currentInSlot.name !== '-' && currentInSlot.name !== item.name) {
      unequipSlotOnDoc(doc, targetSlotKey);
    }

    const normDc = (engine && typeof engine.normalizeItemDailyCharges === 'function')
      ? engine.normalizeItemDailyCharges(item)
      : item.dailyCharges;

    doc.bodySlots[targetSlotKey] = {
      poolItemId: item.id,
      baseItemId: item.baseItemId,
      name: item.name,
      masterDbName: item.masterDbName || item.name,
      category: item.category,
      active: true,
      weight: Number(item.weight) || 0,
      cost: Number(item.cost) || 0,
      desc: item.desc || item.description || '',
      benefit: item.benefit || '',
      description: item.description || item.desc || '',
      scope: item.scope || '',
      targetSkill: item.targetSkill || '',
      schemaVersion: 3,
      material: item.material,
      enhancementBonus: item.enhancementBonus,
      enhancements: Array.isArray(item.enhancements) ? item.enhancements.slice() : undefined,
      weapon: item.weapon ? JSON.parse(JSON.stringify(item.weapon)) : undefined,
      armor: item.armor ? JSON.parse(JSON.stringify(item.armor)) : undefined,
      effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : undefined,
      dice: item.weapon?.damageDice || item.dice,
      critMin: item.weapon?.baseCritRange || item.critMin || item.critRange || item.weaponMeta?.critMin,
      critRange: item.weapon?.baseCritRange || item.critRange || item.critMin || item.weaponMeta?.critMin,
      critMult: item.weapon?.critMultiplier || item.critMult || item.weaponMeta?.critMult,
      handedness: item.weapon?.handedness || item.handedness || item.weaponMeta?.handedness,
      dmgType: item.weapon?.dmgType || item.weapon?.damageType || item.dmgType,
      isLight: item.isLight || Boolean(engine && typeof engine.isLightWeapon === 'function' && engine.isLightWeapon(item)),
      parent: item.parent,
      dailyCharges: normDc ? JSON.parse(JSON.stringify(normDc)) : undefined,
      bonusType: item.bonusType,
      strBonus: item.strBonus,
      dexBonus: item.dexBonus,
      conBonus: item.conBonus,
      intBonus: item.intBonus,
      wisBonus: item.wisBonus,
      chaBonus: item.chaBonus,
      skillBonus: item.skillBonus,
      skillBonuses: item.skillBonuses ? JSON.parse(JSON.stringify(item.skillBonuses)) : undefined,
      fortBonus: item.fortBonus,
      refBonus: item.refBonus,
      willBonus: item.willBonus,
      speedBonus: item.speedBonus,
      clBonus: item.clBonus,
      maxDex: item.armor?.maxDex ?? item.maxDex,
      checkPenalty: item.armor?.armorCheckPenalty ?? item.checkPenalty,
      spellFailure: item.armor?.arcaneSpellFailure ?? item.spellFailure,
      ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : undefined,
      tacticalBadges: Array.isArray(item.tacticalBadges) ? JSON.parse(JSON.stringify(item.tacticalBadges)) : undefined,
      combatModifiers: item.combatModifiers ? JSON.parse(JSON.stringify(item.combatModifiers)) : undefined
    };
    item.isEquipped = true;

    if (item.category === 'Weapon') {
      const wepDice = item.weapon?.damageDice || item.dice;
      const wepDmgType = item.weapon?.dmgType || item.weapon?.damageType || item.dmgType;
      const existingWep = doc.weapons.find(w => w && w.poolItemId !== undefined && w.poolItemId !== null && String(w.poolItemId) === String(item.id))
        || doc.weapons.find(w => w && String(w.name || '').toLowerCase() === String(item.name || '').toLowerCase());
      const targetGrip = isTwoHand ? '2-Hand' : (targetSlotKey === 'offHand' ? 'Off-Hand' : '1-Hand');
      if (existingWep) {
        existingWep.schemaVersion = 3;
        existingWep.poolItemId = item.id;
        existingWep.grip = targetGrip;
        if (item.weapon) existingWep.weapon = JSON.parse(JSON.stringify(item.weapon));
        if (Array.isArray(item.effects)) existingWep.effects = JSON.parse(JSON.stringify(item.effects));
        if (wepDice) existingWep.dice = wepDice;
        if (item.weapon?.baseCritRange || item.critMin || item.critRange) existingWep.critMin = item.weapon?.baseCritRange || item.critMin || item.critRange;
        if (item.weapon?.critMultiplier || item.critMult) existingWep.critMult = item.weapon?.critMultiplier || item.critMult;
        if (wepDmgType) existingWep.dmgType = wepDmgType;
        if (item.weapon?.handedness || item.handedness) existingWep.handedness = item.weapon?.handedness || item.handedness;
        if (item.enhancementBonus !== undefined) existingWep.enhancementBonus = item.enhancementBonus;
        if (item.isLight !== undefined) existingWep.isLight = item.isLight;
      } else {
        doc.weapons.push({
          schemaVersion: 3,
          poolItemId: item.id,
          baseItemId: item.baseItemId,
          name: item.name,
          grip: targetGrip,
          handedness: item.weapon?.handedness || item.handedness || item.weaponMeta?.handedness,
          weapon: item.weapon ? JSON.parse(JSON.stringify(item.weapon)) : undefined,
          effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : undefined,
          dice: wepDice || (isTwoHand ? '2d6' : '1d6'),
          critMin: item.weapon?.baseCritRange || item.critMin || item.critRange || item.weaponMeta?.critMin || 20,
          critMult: item.weapon?.critMultiplier || item.critMult || item.weaponMeta?.critMult || 2,
          enhancementBonus: item.enhancementBonus || 0,
          dmgType: wepDmgType || 'Slashing',
          bonusType: item.bonusType || 'Enhancement',
          isLight: item.isLight || Boolean(engine && typeof engine.isLightWeapon === 'function' && engine.isLightWeapon(item)),
          ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : undefined,
          tags: isTwoHand ? ['two-handed'] : (targetSlotKey === 'offHand' ? ['off-hand'] : [])
        });
      }
      if (targetSlotKey === 'mainHand') {
        doc.activeWeapon = item.name;
      }
    }

    if (targetSlotKey === 'mainHand') {
      const isDoubleWep = Boolean(engine && typeof engine.isDoubleWeapon === 'function' && engine.isDoubleWeapon(item));
      if (doc.tactical?.weaponSets?.set1) {
        doc.tactical.weaponSets.set1.mainWeapon = item.name;
        doc.tactical.weaponSets.set1.grip = (isDoubleWep || isTwoHand) ? '2-Hand' : '1-Hand';
      }
      if (isDoubleWep && doc.tactical?.weaponSets?.set2) {
        doc.tactical.weaponSets.set2.mainWeapon = item.name;
        doc.tactical.weaponSets.set2.grip = 'Off-Hand';
        doc.tactical.weaponSets.activeSets = [1];
        doc.tactical.weaponSets.activeSet = 1;
        doc.activeOffHand = 'None';
      } else if (!isTwoHand && doc.bodySlots?.offHand?.name && doc.bodySlots.offHand.name !== '-') {
        if (doc.tactical?.weaponSets) {
          doc.tactical.weaponSets.set2.mainWeapon = doc.bodySlots.offHand.name;
          doc.tactical.weaponSets.set2.grip = 'Off-Hand';
          doc.tactical.weaponSets.activeSets = [1, 2];
          doc.tactical.weaponSets.activeSet = 'both';
        }
        doc.activeOffHand = doc.bodySlots.offHand.name;
      }
      doc.activeWeapon = item.name;
    } else if (targetSlotKey === 'offHand') {
      if (doc.tactical?.weaponSets?.set1) {
        doc.tactical.weaponSets.set1.grip = '1-Hand';
      }
      if (doc.tactical?.weaponSets?.set2) {
        doc.tactical.weaponSets.set2.mainWeapon = item.name;
        doc.tactical.weaponSets.set2.grip = 'Off-Hand';
      }
      if (doc.tactical?.weaponSets) {
        if (!Array.isArray(doc.tactical.weaponSets.activeSets)) {
          doc.tactical.weaponSets.activeSets = [1];
        }
        if (!doc.tactical.weaponSets.activeSets.includes(1) && doc.bodySlots?.mainHand?.name && doc.bodySlots.mainHand.name !== '-') {
          doc.tactical.weaponSets.activeSets.unshift(1);
        }
        if (!doc.tactical.weaponSets.activeSets.includes(2)) {
          doc.tactical.weaponSets.activeSets.push(2);
        }
        doc.tactical.weaponSets.activeSet = (doc.tactical.weaponSets.activeSets.includes(1) && doc.tactical.weaponSets.activeSets.includes(2)) ? 'both' : 2;
      }
      doc.activeOffHand = item.name;
      if (item.category === 'Weapon') {
        if (!Array.isArray(doc.tacticalRiders)) doc.tacticalRiders = [];
        let twfMod = doc.tacticalRiders.find(m => m && m.name && (m.name.includes('TWF') || m.name.includes('Two-Weapon')));
        if (!twfMod) {
          doc.tacticalRiders.push({
            id: 'rider-twf',
            schemaVersion: 3,
            name: 'Two-Weapon Fighting (TWF)',
            source: 'Combat',
            combatScope: 'melee',
            riderType: 'TWF',
            active: true,
            notes: 'Extra Off-Hand Attack (RAW TWF)',
            effects: []
          });
        } else {
          twfMod.active = true;
        }
      }
    }

    setStoreOutcome(stateObj, {
      status: 'item_equipped',
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      slotKey: targetSlotKey,
      twoHandWarningMsg
    });
    return doc;
  });

  // 5. 'inventory/unequipSlot' ({ slotKey })
  CharStore.registerReducer('inventory/unequipSlot', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const slotKey = payload.slotKey;
    if (!slotKey) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const unequippedName = unequipSlotOnDoc(doc, slotKey);
    if (!unequippedName) {
      setStoreOutcome(stateObj, { status: 'empty_slot', slotKey });
      return doc;
    }
    setStoreOutcome(stateObj, { status: 'slot_unequipped', slotKey, itemName: unequippedName });
    return doc;
  });

  // 6. 'inventory/toggleSlotActive' ({ slotKey })
  CharStore.registerReducer('inventory/toggleSlotActive', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const slotKey = payload.slotKey;
    const slot = slotKey ? doc.bodySlots[slotKey] : null;
    if (!slot || !slot.name || slot.name === '-') {
      setStoreOutcome(stateObj, { status: 'empty_slot', slotKey });
      return doc;
    }
    slot.active = payload.value !== undefined ? Boolean(payload.value) : !Boolean(slot.active);
    setStoreOutcome(stateObj, { status: 'slot_active_toggled', slotKey, active: slot.active, itemName: slot.name });
    return doc;
  });

  // 7. 'inventory/adjustSlotCharge' ({ slotKey, delta })
  CharStore.registerReducer('inventory/adjustSlotCharge', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const slotKey = payload.slotKey;
    const delta = Number(payload.delta) || 0;
    const slot = slotKey ? doc.bodySlots[slotKey] : null;
    if (!slot || !slot.name || slot.name === '-') {
      setStoreOutcome(stateObj, { status: 'empty_slot', slotKey });
      return doc;
    }
    const engine = resolveRuleEngine();
    const normDc = (engine && typeof engine.normalizeItemDailyCharges === 'function')
      ? engine.normalizeItemDailyCharges(slot)
      : slot.dailyCharges;
    if (!normDc || typeof normDc.max !== 'number') {
      setStoreOutcome(stateObj, { status: 'no_daily_charges', slotKey, itemName: slot.name });
      return doc;
    }
    const prevCurrent = Number(normDc.current) || 0;
    if (delta < 0 && prevCurrent <= 0) {
      slot.dailyCharges = normDc;
      setStoreOutcome(stateObj, { status: 'charges_exhausted', slotKey, itemName: slot.name, dailyCharges: normDc });
      return doc;
    }
    normDc.current = Math.max(0, Math.min(normDc.max, prevCurrent + delta));
    slot.dailyCharges = normDc;
    const cleanName = String(slot.name || '').toLowerCase().trim();
    const poolMatch = doc.gearPool.find(p => p && String(p.name || '').toLowerCase().trim() === cleanName);
    if (poolMatch) {
      poolMatch.dailyCharges = JSON.parse(JSON.stringify(normDc));
    }
    const consMatch = doc.consumables.find(c => c && String(c.name || '').toLowerCase().trim() === cleanName);
    if (consMatch) {
      consMatch.dailyCharges = JSON.parse(JSON.stringify(normDc));
    }
    setStoreOutcome(stateObj, {
      status: 'slot_charge_adjusted',
      slotKey,
      itemName: slot.name,
      dailyCharges: normDc,
      delta
    });
    return doc;
  });

  // 8a. 'inventory/addPoolItem' ({ item })
  CharStore.registerReducer('inventory/addPoolItem', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const srcItem = payload.item || payload;
    if (!srcItem || !srcItem.name) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const engine = resolveRuleEngine();
    const cat = srcItem.category && srcItem.category !== 'Other'
      ? srcItem.category
      : (engine && typeof engine.inferInventoryItemCategory === 'function' ? engine.inferInventoryItemCategory(srcItem) : (srcItem.type || 'Other'));
    const isBeltItem = Boolean(srcItem.isBelt || srcItem.inBelt || String(srcItem.slot || '').toLowerCase().includes('belt') || cat === 'Consumable');
    const rollEffects = Array.isArray(srcItem.effects) ? srcItem.effects.filter(e => e && e.type === 'roll' && (!e.kind || e.kind === 'Damage')) : [];
    const primaryRoll = rollEffects[0] || null;
    const wepObj = (srcItem.weapon && typeof srcItem.weapon === 'object') ? srcItem.weapon : null;
    const armObj = (srcItem.armor && typeof srcItem.armor === 'object') ? srcItem.armor : null;
    const qtyVal = (srcItem.qty !== undefined && srcItem.qty !== null) ? Math.max(0, Number(srcItem.qty)) : 1;
    const newEntry = {
      id: srcItem.id || ('item_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
      baseItemId: srcItem.baseItemId || srcItem.id || null,
      customEntryId: srcItem.customEntryId || null,
      schemaVersion: 3,
      name: srcItem.name,
      masterDbName: srcItem.masterDbName || srcItem.name,
      category: cat,
      slot: srcItem.slot && srcItem.slot !== 'None' ? srcItem.slot : cat,
      qty: qtyVal,
      weight: Number(srcItem.weightLb ?? srcItem.weight) || 0,
      cost: Number(srcItem.priceGp ?? srcItem.cost) || 0,
      desc: srcItem.desc || srcItem.benefit || srcItem.description || '',
      shortDescription: srcItem.shortDescription || '',
      text: srcItem.text || '',
      bash: (srcItem.bash && typeof srcItem.bash === 'object') ? JSON.parse(JSON.stringify(srcItem.bash)) : undefined,
      material: srcItem.material || null,
      enhancementBonus: Number(srcItem.enhancementBonus) || 0,
      enhancements: Array.isArray(srcItem.enhancements) ? srcItem.enhancements.slice() : [],
      effects: Array.isArray(srcItem.effects) ? JSON.parse(JSON.stringify(srcItem.effects)) : [],
      weapon: wepObj ? JSON.parse(JSON.stringify(wepObj)) : undefined,
      armor: armObj ? JSON.parse(JSON.stringify(armObj)) : undefined,
      modes: Array.isArray(srcItem.modes) ? JSON.parse(JSON.stringify(srcItem.modes)) : [],
      weaponMeta: srcItem.weaponMeta ? JSON.parse(JSON.stringify(srcItem.weaponMeta)) : null,
      armorMeta: srcItem.armorMeta ? JSON.parse(JSON.stringify(srcItem.armorMeta)) : null,
      ruleFlags: srcItem.ruleFlags ? JSON.parse(JSON.stringify(srcItem.ruleFlags)) : {},
      tacticalBadges: Array.isArray(srcItem.tacticalBadges) ? JSON.parse(JSON.stringify(srcItem.tacticalBadges)) : [],
      dice: (wepObj && wepObj.damageDice) || (primaryRoll && primaryRoll.dice) || srcItem.dice,
      dmgType: (wepObj && (wepObj.dmgType || wepObj.damageType)) || (primaryRoll && primaryRoll.dmgType) || srcItem.dmgType,
      critMin: Number((wepObj && wepObj.baseCritRange) || srcItem.critRange || srcItem.critMin || srcItem.weaponMeta?.critMin) || undefined,
      critRange: Number((wepObj && wepObj.baseCritRange) || srcItem.critRange || srcItem.critMin || srcItem.weaponMeta?.critMin) || undefined,
      critMult: Number((wepObj && wepObj.critMultiplier) || srcItem.critMult || srcItem.weaponMeta?.critMult) || undefined,
      handedness: (wepObj && wepObj.handedness) || srcItem.handedness || srcItem.weaponMeta?.handedness,
      maxDex: (armObj && armObj.maxDex !== undefined) ? armObj.maxDex : (srcItem.maxDex !== undefined ? srcItem.maxDex : srcItem.armorMeta?.maxDex),
      checkPenalty: (armObj && armObj.armorCheckPenalty !== undefined) ? armObj.armorCheckPenalty : (srcItem.checkPenalty !== undefined ? srcItem.checkPenalty : srcItem.armorMeta?.acp),
      spellFailure: (armObj && armObj.arcaneSpellFailure !== undefined) ? armObj.arcaneSpellFailure : (srcItem.spellFailure !== undefined ? srcItem.spellFailure : srcItem.armorMeta?.asf),
      isBelt: isBeltItem,
      isEquipped: false
    };
    doc.gearPool.push(newEntry);

    if (cat === 'Weapon' || srcItem.type === 'Weapon') {
      const hasWep = doc.weapons.some(w => w && String(w.name || '').toLowerCase() === String(srcItem.name || '').toLowerCase());
      if (!hasWep) {
        const isTwoHand = Boolean(
          String(newEntry.handedness || '').toLowerCase().includes('two') ||
          (engine && typeof engine.isTwoHandedWeapon === 'function' && engine.isTwoHandedWeapon(srcItem))
        );
        doc.weapons.push({
          id: newEntry.id,
          baseItemId: newEntry.baseItemId,
          schemaVersion: 3,
          name: srcItem.name,
          grip: isTwoHand ? '2-Hand' : '1-Hand',
          handedness: newEntry.handedness,
          dice: newEntry.dice || '1d8',
          weapon: newEntry.weapon ? JSON.parse(JSON.stringify(newEntry.weapon)) : undefined,
          effects: JSON.parse(JSON.stringify(newEntry.effects)),
          modes: JSON.parse(JSON.stringify(newEntry.modes)),
          weaponMeta: newEntry.weaponMeta ? JSON.parse(JSON.stringify(newEntry.weaponMeta)) : null,
          ruleFlags: JSON.parse(JSON.stringify(newEntry.ruleFlags)),
          tacticalBadges: JSON.parse(JSON.stringify(newEntry.tacticalBadges)),
          critMin: Number(newEntry.critMin) || 20,
          rawCritMin: Number(newEntry.critMin) || 20,
          critMult: Number(newEntry.critMult) || 2,
          enhancementBonus: Number(srcItem.enhancementBonus) || 0,
          dmgType: newEntry.dmgType || 'Slashing',
          bonusType: 'enhancement',
          tags: srcItem.tags || [],
          elementalMods: rollEffects.filter((sp, idx) => idx > 0 || (wepObj && wepObj.damageDice && sp.dice !== wepObj.damageDice)).map(sp => ({ name: sp.source || sp.dmgType, dice: sp.dice, type: sp.dmgType, condition: sp.condition || '' })),
          keen: Boolean(srcItem.ruleFlags && srcItem.ruleFlags.keen)
        });
      }
    }

    if (cat === 'Consumable' || (isBeltItem && cat !== 'Weapon')) {
      const cleanName = String(srcItem.name || '').toLowerCase().trim();
      const hasCons = doc.consumables.some(c => c && String(c.name || '').toLowerCase().trim() === cleanName);
      if (!hasCons) {
        doc.consumables.push({
          name: srcItem.name,
          qty: qtyVal,
          effect: newEntry.desc || 'Consumable effect'
        });
      }
    }

    let attachedChildCount = 0;
    const itemModes = Array.isArray(srcItem.modes) ? srcItem.modes : [];
    if (itemModes.length > 0) {
      itemModes.forEach(mode => {
        if (!mode || mode.handedness || mode.id === 'primary-head' || mode.id === 'offhand-head' || mode.id === '2h-single' || mode.ruleFlags?.doubleWeapon || mode.ruleFlags?.doubleWeaponOffHand) {
          return;
        }
        const modeClean = String(mode.name || mode.label || '').replace(/^↳\s*/, '').trim();
        if (!modeClean) return;
        const modeRoll = Array.isArray(mode.effects) ? mode.effects.find(e => e && e.type === 'roll') : null;
        const modeDice = (modeRoll && modeRoll.dice) || mode.dice || '';
        if (String(mode.action || '').toLowerCase().includes('action') || (mode.duration && mode.duration !== 'Continuous')) {
          if (!Array.isArray(doc.specialAbilities)) doc.specialAbilities = [];
          if (!doc.specialAbilities.some(a => a && String(a.name || '').toLowerCase() === modeClean.toLowerCase())) {
            doc.specialAbilities.push({
              name: modeClean,
              source: srcItem.name,
              action: mode.action || 'Standard Action',
              duration: mode.duration || 'Special',
              benefit: mode.benefit || mode.description || '',
              dice: modeDice,
              active: false
            });
            attachedChildCount++;
          }
        }
        if (modeDice) {
          if (!Array.isArray(doc.tacticalRiders)) doc.tacticalRiders = [];
          if (!doc.tacticalRiders.some(m => m && String(m.name || '').toLowerCase() === modeClean.toLowerCase())) {
            doc.tacticalRiders.push({
              id: 'rider-' + modeClean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              schemaVersion: 3,
              name: modeClean,
              source: srcItem.name,
              combatScope: 'melee',
              riderType: 'Rider',
              active: true,
              notes: mode.benefit || mode.description || '',
              effects: [
                { type: 'roll', kind: 'Damage', dice: modeDice, dmgType: (modeRoll && modeRoll.dmgType) || 'Energy' }
              ]
            });
            attachedChildCount++;
          }
        }
      });
    }

    setStoreOutcome(stateObj, {
      status: 'pool_item_added',
      item: newEntry,
      attachedChildCount
    });
    return doc;
  });

  // 8b. 'inventory/reforgeItem' ({ targetContext, itemData })
  CharStore.registerReducer('inventory/reforgeItem', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const targetContext = payload.targetContext || {};
    const originalItem = targetContext.originalItem || payload.originalItem || {};
    const targetSlotKey = targetContext.targetSlotKey || payload.targetSlotKey || null;
    const forgedItem = payload.itemData || payload.forgedV2Item;
    if (!forgedItem) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const engine = resolveRuleEngine();
    const oldName = String(originalItem?.name || '').trim();
    const oldNameLower = oldName.toLowerCase();
    const newName = String(forgedItem.name || oldName || 'Forged Item').trim();
    // originalItem can be the live gearPool row this reducer mutates below: snapshot its category first.
    const originalCategory = String(originalItem?.category || '').trim();
    // Inventory category, not a weapon proficiency group (an assembled chassis reports "Simple"/"Martial"/"Exotic").
    const rawForgedCat = String(forgedItem.category || '').trim();
    const isProficiencyGroup = /^(simple|martial|exotic)$/i.test(rawForgedCat);
    const isWeaponChassis = Boolean(forgedItem.weapon) && !forgedItem.armor && rawForgedCat !== 'Shield' && rawForgedCat !== 'Armor';
    const cat = isWeaponChassis
      ? 'Weapon'
      : (rawForgedCat && rawForgedCat !== 'Other' && !isProficiencyGroup
        ? rawForgedCat
        : (engine && typeof engine.inferInventoryItemCategory === 'function'
          ? engine.inferInventoryItemCategory(Object.assign({}, forgedItem, { category: isProficiencyGroup ? 'Weapon' : '' }))
          : (forgedItem.type || originalCategory || 'Weapon')));
    const newWeight = Number(forgedItem.weightLb ?? forgedItem.weight) || 0;
    const newCost = Number(forgedItem.priceGp ?? forgedItem.cost) || 0;
    // desc holds only user-written notes; forged prose lives in shortDescription / text.
    const newDesc = forgedItem.desc || originalItem?.desc || '';
    const newShortDesc = forgedItem.shortDescription || '';
    const newText = forgedItem.text || '';
    const clonedBash = (forgedItem.bash && typeof forgedItem.bash === 'object') ? JSON.parse(JSON.stringify(forgedItem.bash)) : null;

    const clonedEffects = Array.isArray(forgedItem.effects) ? JSON.parse(JSON.stringify(forgedItem.effects)) : [];
    const hasForgedPowers = Array.isArray(forgedItem.powers);
    const clonedPowers = hasForgedPowers ? JSON.parse(JSON.stringify(forgedItem.powers)) : null;
    const rollEffects = clonedEffects.filter(e => e && e.type === 'roll' && (!e.kind || e.kind === 'Damage'));
    const primaryRoll = rollEffects[0] || null;
    const clonedWeapon = forgedItem.weapon ? JSON.parse(JSON.stringify(forgedItem.weapon)) : null;
    const clonedArmor = forgedItem.armor ? JSON.parse(JSON.stringify(forgedItem.armor)) : null;
    const clonedModes = Array.isArray(forgedItem.modes) ? JSON.parse(JSON.stringify(forgedItem.modes)) : [];
    const clonedWeaponMeta = forgedItem.weaponMeta ? JSON.parse(JSON.stringify(forgedItem.weaponMeta)) : null;
    const clonedArmorMeta = forgedItem.armorMeta ? JSON.parse(JSON.stringify(forgedItem.armorMeta)) : null;
    const clonedRuleFlags = forgedItem.ruleFlags ? JSON.parse(JSON.stringify(forgedItem.ruleFlags)) : {};
    const clonedTacticalBadges = Array.isArray(forgedItem.tacticalBadges) ? JSON.parse(JSON.stringify(forgedItem.tacticalBadges)) : [];

    // Resolve the edited gearPool row by immutable id (originalItem may be a pool row or an equipped slot
    // carrying `poolItemId`); the display name is only a fallback for legacy rows without ids.
    const hasLink = (v) => v !== undefined && v !== null && v !== '';
    const targetSlotRef = targetSlotKey ? doc.bodySlots[targetSlotKey] : null;
    const originalPoolId = hasLink(originalItem?.poolItemId)
      ? originalItem.poolItemId
      : (hasLink(targetSlotRef?.poolItemId) ? targetSlotRef.poolItemId : originalItem?.id);
    const poolItem = findLinkedPoolItem(doc, { poolItemId: originalPoolId, name: oldName });
    const poolItemId = poolItem ? poolItem.id : undefined;
    const isLinkedRef = (ref) => Boolean(ref && poolItemId !== undefined && ref.poolItemId !== undefined && ref.poolItemId !== null && String(ref.poolItemId) === String(poolItemId));
    const isLegacyNameRef = (ref) => Boolean(ref && (ref.poolItemId === undefined || ref.poolItemId === null || ref.poolItemId === '') && oldNameLower && String(ref.name || '').toLowerCase().trim() === oldNameLower);
    // A crafted item's own `id` is the edited row's id (or a crafted instance id), never a catalog base id.
    const forgedBaseId = forgedItem.baseItemId
      || (forgedItem.id !== undefined && String(forgedItem.id) !== String(poolItemId ?? originalItem?.id) && !/^crafted_item_/.test(String(forgedItem.id)) ? forgedItem.id : null);
    if (poolItem) {
      poolItem.baseItemId = forgedBaseId || poolItem.baseItemId || null;
      if (forgedItem.customEntryId) poolItem.customEntryId = forgedItem.customEntryId;
      poolItem.schemaVersion = 3;
      poolItem.name = newName;
      poolItem.masterDbName = newName;
      poolItem.category = cat;
      poolItem.slot = (forgedItem.slot && forgedItem.slot !== 'None') ? forgedItem.slot : (poolItem.slot || cat);
      poolItem.weight = newWeight;
      poolItem.cost = newCost;
      poolItem.desc = newDesc;
      poolItem.shortDescription = newShortDesc;
      poolItem.text = newText;
      if (clonedBash) poolItem.bash = JSON.parse(JSON.stringify(clonedBash)); else delete poolItem.bash;
      poolItem.material = forgedItem.material || null;
      poolItem.enhancementBonus = Number(forgedItem.enhancementBonus) || 0;
      poolItem.enhancements = Array.isArray(forgedItem.enhancements) ? forgedItem.enhancements.slice() : [];
      poolItem.effects = JSON.parse(JSON.stringify(clonedEffects));
      if (hasForgedPowers) poolItem.powers = JSON.parse(JSON.stringify(clonedPowers));
      poolItem.weapon = clonedWeapon ? JSON.parse(JSON.stringify(clonedWeapon)) : undefined;
      poolItem.armor = clonedArmor ? JSON.parse(JSON.stringify(clonedArmor)) : undefined;
      poolItem.modes = clonedModes;
      poolItem.weaponMeta = clonedWeaponMeta;
      poolItem.armorMeta = clonedArmorMeta;
      poolItem.ruleFlags = clonedRuleFlags;
      poolItem.tacticalBadges = clonedTacticalBadges;
      poolItem.dice = (clonedWeapon && clonedWeapon.damageDice) || (primaryRoll && primaryRoll.dice) || forgedItem.dice || poolItem.dice;
      poolItem.critMin = Number((clonedWeapon && clonedWeapon.baseCritRange) || forgedItem.weaponMeta?.critMin || forgedItem.critMin) || poolItem.critMin;
      poolItem.critMult = Number((clonedWeapon && clonedWeapon.critMultiplier) || forgedItem.weaponMeta?.critMult || forgedItem.critMult) || poolItem.critMult;
      poolItem.dmgType = (clonedWeapon && (clonedWeapon.dmgType || clonedWeapon.damageType)) || (primaryRoll && primaryRoll.dmgType) || forgedItem.dmgType || poolItem.dmgType;
      if (clonedArmor) {
        if (clonedArmor.maxDex !== undefined) poolItem.maxDex = clonedArmor.maxDex;
        if (clonedArmor.armorCheckPenalty !== undefined) poolItem.checkPenalty = clonedArmor.armorCheckPenalty;
        if (clonedArmor.arcaneSpellFailure !== undefined) poolItem.spellFailure = clonedArmor.arcaneSpellFailure;
      } else if (clonedArmorMeta) {
        poolItem.maxDex = clonedArmorMeta.maxDex;
        poolItem.checkPenalty = clonedArmorMeta.acp;
      }
    }

    const slotKeysToUpdate = [];
    if (targetSlotKey && doc.bodySlots[targetSlotKey] && doc.bodySlots[targetSlotKey].name !== '-') {
      slotKeysToUpdate.push(targetSlotKey);
    }
    Object.keys(doc.bodySlots).forEach(sk => {
      const sd = doc.bodySlots[sk];
      if (!sd || !sd.name || sd.name === '-' || slotKeysToUpdate.includes(sk)) return;
      if (isLinkedRef(sd) || isLegacyNameRef(sd)) slotKeysToUpdate.push(sk);
    });
    slotKeysToUpdate.forEach(sk => {
      const sd = doc.bodySlots[sk];
      if (!sd) return;
      if (poolItemId !== undefined) sd.poolItemId = poolItemId;
      sd.baseItemId = forgedBaseId || sd.baseItemId || null;
      if (forgedItem.customEntryId) sd.customEntryId = forgedItem.customEntryId;
      sd.schemaVersion = 3;
      sd.name = newName;
      sd.masterDbName = newName;
      sd.category = cat;
      sd.weight = newWeight;
      sd.cost = newCost;
      sd.desc = newDesc;
      sd.shortDescription = newShortDesc;
      sd.text = newText;
      delete sd.benefit;
      delete sd.description;
      if (clonedBash) sd.bash = JSON.parse(JSON.stringify(clonedBash)); else delete sd.bash;
      sd.material = forgedItem.material || null;
      sd.enhancementBonus = Number(forgedItem.enhancementBonus) || 0;
      sd.enhancements = Array.isArray(forgedItem.enhancements) ? forgedItem.enhancements.slice() : [];
      sd.effects = JSON.parse(JSON.stringify(clonedEffects));
      if (hasForgedPowers) sd.powers = JSON.parse(JSON.stringify(clonedPowers));
      sd.weapon = clonedWeapon ? JSON.parse(JSON.stringify(clonedWeapon)) : undefined;
      sd.armor = clonedArmor ? JSON.parse(JSON.stringify(clonedArmor)) : undefined;
      sd.modes = JSON.parse(JSON.stringify(clonedModes));
      sd.weaponMeta = clonedWeaponMeta ? JSON.parse(JSON.stringify(clonedWeaponMeta)) : null;
      sd.armorMeta = clonedArmorMeta ? JSON.parse(JSON.stringify(clonedArmorMeta)) : null;
      sd.ruleFlags = JSON.parse(JSON.stringify(clonedRuleFlags));
      sd.tacticalBadges = JSON.parse(JSON.stringify(clonedTacticalBadges));
      sd.dice = (clonedWeapon && clonedWeapon.damageDice) || (primaryRoll && primaryRoll.dice) || forgedItem.dice || sd.dice;
      sd.critMin = Number((clonedWeapon && clonedWeapon.baseCritRange) || forgedItem.weaponMeta?.critMin || forgedItem.critMin) || sd.critMin;
      sd.critMult = Number((clonedWeapon && clonedWeapon.critMultiplier) || forgedItem.weaponMeta?.critMult || forgedItem.critMult) || sd.critMult;
      sd.dmgType = (clonedWeapon && (clonedWeapon.dmgType || clonedWeapon.damageType)) || (primaryRoll && primaryRoll.dmgType) || forgedItem.dmgType || sd.dmgType;
      if (clonedArmor) {
        if (clonedArmor.maxDex !== undefined) sd.maxDex = clonedArmor.maxDex;
        if (clonedArmor.armorCheckPenalty !== undefined) sd.checkPenalty = clonedArmor.armorCheckPenalty;
        if (clonedArmor.arcaneSpellFailure !== undefined) sd.spellFailure = clonedArmor.arcaneSpellFailure;
      } else if (clonedArmorMeta) {
        sd.maxDex = clonedArmorMeta.maxDex;
        sd.checkPenalty = clonedArmorMeta.acp;
      }
    });

    if (cat === 'Weapon' || originalCategory === 'Weapon') {
      let wepIdx = doc.weapons.findIndex(w => isLinkedRef(w));
      if (wepIdx < 0) wepIdx = doc.weapons.findIndex(w => isLegacyNameRef(w));
      const wepDice = (clonedWeapon && clonedWeapon.damageDice) || (primaryRoll && primaryRoll.dice) || forgedItem.dice || '1d8';
      const wepDmgType = (clonedWeapon && (clonedWeapon.dmgType || clonedWeapon.damageType)) || (primaryRoll && primaryRoll.dmgType) || forgedItem.dmgType || 'Slashing';
      const updatedWepObj = {
        poolItemId: poolItemId !== undefined ? poolItemId : (wepIdx >= 0 ? doc.weapons[wepIdx].poolItemId : undefined),
        baseItemId: forgedBaseId || (wepIdx >= 0 ? doc.weapons[wepIdx].baseItemId : null) || null,
        customEntryId: forgedItem.customEntryId || originalItem?.customEntryId || null,
        schemaVersion: 3,
        name: newName,
        grip: String((clonedWeapon && clonedWeapon.handedness) || clonedWeaponMeta?.handedness || '').includes('Two') ? '2-Hand' : (wepIdx >= 0 ? doc.weapons[wepIdx].grip : '1-Hand'),
        dice: wepDice,
        weapon: clonedWeapon ? JSON.parse(JSON.stringify(clonedWeapon)) : undefined,
        effects: JSON.parse(JSON.stringify(clonedEffects)),
        modes: JSON.parse(JSON.stringify(clonedModes)),
        weaponMeta: clonedWeaponMeta ? JSON.parse(JSON.stringify(clonedWeaponMeta)) : null,
        ruleFlags: JSON.parse(JSON.stringify(clonedRuleFlags)),
        tacticalBadges: JSON.parse(JSON.stringify(clonedTacticalBadges)),
        critMin: Number((clonedWeapon && clonedWeapon.baseCritRange) || clonedWeaponMeta?.critMin || forgedItem.critMin) || 20,
        rawCritMin: Number((clonedWeapon && clonedWeapon.baseCritRange) || clonedWeaponMeta?.critMin || forgedItem.critMin) || 20,
        critMult: Number((clonedWeapon && clonedWeapon.critMultiplier) || clonedWeaponMeta?.critMult || forgedItem.critMult) || 2,
        enhancementBonus: Number(forgedItem.enhancementBonus) || 0,
        dmgType: wepDmgType,
        bonusType: 'enhancement',
        tags: forgedItem.tags || [],
        elementalMods: rollEffects.filter((sp, idx) => idx > 0 || (clonedWeapon && clonedWeapon.damageDice && sp.dice !== clonedWeapon.damageDice)).map(sp => ({ name: sp.source || sp.dmgType, dice: sp.dice, type: sp.dmgType, condition: sp.condition || '' })),
        keen: Boolean(clonedRuleFlags && clonedRuleFlags.keen)
      };
      if (wepIdx >= 0) {
        // Keep the existing weapon row's own id; only the content changes.
        doc.weapons[wepIdx] = Object.assign({}, doc.weapons[wepIdx], updatedWepObj);
      } else {
        updatedWepObj.id = 'wep_' + Date.now();
        doc.weapons.push(updatedWepObj);
      }
      if (oldNameLower && String(doc.activeWeapon || '').toLowerCase().trim() === oldNameLower) {
        doc.activeWeapon = newName;
      }
      if (oldNameLower && String(doc.activeOffHand || '').toLowerCase().trim() === oldNameLower) {
        doc.activeOffHand = newName;
      }
      if (doc.tactical?.weaponSets) {
        const s1 = doc.tactical.weaponSets.set1;
        const s2 = doc.tactical.weaponSets.set2;
        if (s1 && oldNameLower && String(s1.mainWeapon || '').toLowerCase().trim() === oldNameLower) {
          s1.mainWeapon = newName;
        }
        if (s2 && oldNameLower && String(s2.mainWeapon || '').toLowerCase().trim() === oldNameLower) {
          s2.mainWeapon = newName;
        }
      }
    }

    if (!Array.isArray(doc.customDb)) doc.customDb = [];
    if (forgedItem.enhancementBonus > 0 || forgedItem.material || (Array.isArray(forgedItem.enhancements) && forgedItem.enhancements.length > 0)) {
      // Key the catalog copy by its Copy-on-Write entry id so a rename replaces it instead of duplicating.
      let existingIdx = forgedItem.customEntryId
        ? doc.customDb.findIndex(m => m && m.customEntryId && String(m.customEntryId) === String(forgedItem.customEntryId))
        : -1;
      if (existingIdx < 0) existingIdx = doc.customDb.findIndex(m => m && String(m.name || '').toLowerCase().trim() === newName.toLowerCase());
      if (existingIdx >= 0) {
        doc.customDb[existingIdx] = Object.assign({}, doc.customDb[existingIdx], JSON.parse(JSON.stringify(forgedItem)));
      } else {
        doc.customDb.push(JSON.parse(JSON.stringify(forgedItem)));
      }
    }

    setStoreOutcome(stateObj, {
      status: 'item_reforged',
      oldName,
      newName,
      newCost
    });
    return doc;
  });

  // 9a. 'inventory/equipCompanionItem' ({ compId, slotKey, poolItemId })
  CharStore.registerReducer('inventory/equipCompanionItem', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const compId = payload.compId;
    const slotKey = payload.slotKey;
    const poolItemId = payload.poolItemId !== undefined ? payload.poolItemId : payload.itemId;
    const comp = compId
      ? (doc.companions || []).find(c => c && (String(c.id) === String(compId) || c.name === compId))
      : null;
    const useSingleComp = !comp && doc.companion && typeof doc.companion === 'object';
    if ((!comp && !useSingleComp) || !slotKey) {
      setStoreOutcome(stateObj, { status: 'not_found' });
      return doc;
    }
    const poolIdx = doc.gearPool.findIndex(p => p && (String(p.id) === String(poolItemId) || p.name === poolItemId));
    if (poolIdx < 0) {
      setStoreOutcome(stateObj, { status: 'not_found' });
      return doc;
    }
    const poolItem = doc.gearPool[poolIdx];
    const gearMap = comp
      ? (comp.gearSlots && typeof comp.gearSlots === 'object' ? comp.gearSlots : (comp.gearSlots = {}))
      : (doc.companion.gear && typeof doc.companion.gear === 'object' ? doc.companion.gear : (doc.companion.gear = {}));

    const prevItem = gearMap[slotKey];
    if (prevItem && prevItem.name && prevItem.name !== '-') {
      const existingPrev = doc.gearPool.find(g => g && g.name === prevItem.name);
      if (existingPrev) {
        existingPrev.qty = (Number(existingPrev.qty) || 1) + 1;
      } else {
        doc.gearPool.push({ ...prevItem, qty: 1 });
      }
    }

    const equippedCopy = JSON.parse(JSON.stringify(poolItem));
    equippedCopy.qty = 1;
    gearMap[slotKey] = equippedCopy;

    if ((Number(poolItem.qty) || 1) > 1) {
      poolItem.qty = Number(poolItem.qty) - 1;
    } else {
      doc.gearPool.splice(poolIdx, 1);
    }

    setStoreOutcome(stateObj, {
      status: 'companion_item_equipped',
      compId: comp ? (comp.id || comp.name) : (doc.companion.name || 'companion'),
      compName: comp ? comp.name : (doc.companion.name || 'Companion'),
      slotKey,
      itemName: equippedCopy.name
    });
    return doc;
  });

  // 9b. 'inventory/unequipCompanionSlot' ({ compId, slotKey })
  CharStore.registerReducer('inventory/unequipCompanionSlot', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    const compId = payload.compId;
    const slotKey = payload.slotKey;
    const comp = compId
      ? (doc.companions || []).find(c => c && (String(c.id) === String(compId) || c.name === compId))
      : null;
    const gearMap = comp ? comp.gearSlots : (doc.companion && doc.companion.gear ? doc.companion.gear : null);
    if (!gearMap || !gearMap[slotKey] || !gearMap[slotKey].name || gearMap[slotKey].name === '-') {
      setStoreOutcome(stateObj, { status: 'empty_slot' });
      return doc;
    }
    const prevItem = gearMap[slotKey];
    const existing = doc.gearPool.find(g => g && g.name === prevItem.name);
    if (existing) {
      existing.qty = (Number(existing.qty) || 1) + 1;
    } else {
      doc.gearPool.push({ ...prevItem, qty: 1 });
    }
    delete gearMap[slotKey];
    setStoreOutcome(stateObj, {
      status: 'companion_slot_unequipped',
      compId: comp ? (comp.id || comp.name) : (doc.companion?.name || 'companion'),
      compName: comp ? comp.name : (doc.companion?.name || 'Companion'),
      slotKey,
      itemName: prevItem.name
    });
    return doc;
  });

  // 10. 'inventory/updateWealth' ({ pp, gp, sp, cp } or { field, value })
  CharStore.registerReducer('inventory/updateWealth', (doc, action, stateObj) => {
    ensureInventoryDocStructures(doc);
    const payload = (action && action.payload) || {};
    if (!doc.wealth || typeof doc.wealth !== 'object') {
      doc.wealth = { pp: 0, gp: 0, sp: 0, cp: 0 };
    }
    const coins = ['pp', 'gp', 'sp', 'cp'];
    if (payload.field && coins.includes(payload.field)) {
      doc.wealth[payload.field] = Math.max(0, Number(payload.value) || 0);
    } else {
      coins.forEach(c => {
        if (payload[c] !== undefined) {
          doc.wealth[c] = Math.max(0, Number(payload[c]) || 0);
        }
      });
    }
    setStoreOutcome(stateObj, { status: 'wealth_updated', wealth: Object.assign({}, doc.wealth) });
    return doc;
  });

  // =========================================================================
  // PHASE R5 — SPELLS & MANEUVERS REDUCERS (12 Pure Reducers)
  // =========================================================================
  function ensureSpellsDocStructures(doc) {
    if (!doc || typeof doc !== 'object') return;
    if (!doc.spellcasting || typeof doc.spellcasting !== 'object') {
      doc.spellcasting = {};
    }
    if (!Array.isArray(doc.spellcasting.slots)) doc.spellcasting.slots = [];
    if (!Array.isArray(doc.spellcasting.preparedSlots)) doc.spellcasting.preparedSlots = [];
    if (!Array.isArray(doc.spellcasting.divineSlots)) doc.spellcasting.divineSlots = [];
    if (!Array.isArray(doc.spellcasting.knownSpells)) {
      doc.spellcasting.knownSpells = Array.isArray(doc.spells) ? JSON.parse(JSON.stringify(doc.spells)) : [];
    }
    if (!Array.isArray(doc.spellcasting.preparedSpells)) doc.spellcasting.preparedSpells = [];
    if (!Array.isArray(doc.spellcasting.divineSpells)) doc.spellcasting.divineSpells = [];
    if (!doc.spellcasting.domainPowerUses || typeof doc.spellcasting.domainPowerUses !== 'object') {
      doc.spellcasting.domainPowerUses = {};
    }
    if (!doc.tomeOfBattle || typeof doc.tomeOfBattle !== 'object') {
      doc.tomeOfBattle = {};
    }
    if (!Array.isArray(doc.tomeOfBattle.maneuversKnown)) doc.tomeOfBattle.maneuversKnown = [];
    if (!Array.isArray(doc.tomeOfBattle.readiedManeuvers)) doc.tomeOfBattle.readiedManeuvers = [];
    if (!Array.isArray(doc.tomeOfBattle.stancesKnown)) doc.tomeOfBattle.stancesKnown = [];
    if (!Array.isArray(doc.buffs)) doc.buffs = [];
  }

  function ensureSlotEntryForDiscipline(doc, discipline, lvl) {
    ensureSpellsDocStructures(doc);
    const numLvl = Math.max(0, Number(lvl) || 0);
    const disc = String(discipline || 'spontaneous').toLowerCase();
    const listKey = disc === 'prepared'
      ? 'preparedSlots'
      : (disc === 'divine' || disc === 'clericconversion' ? 'divineSlots' : 'slots');
    const arr = doc.spellcasting[listKey];
    let slot = arr.find(s => s && Number(s.level) === numLvl);
    const engine = resolveRuleEngine();
    const derivedView = (engine && typeof engine.deriveSpellsView === 'function')
      ? engine.deriveSpellsView(doc)
      : null;
    const viewDiscKey = (disc === 'divine' || disc === 'clericconversion')
      ? 'divine'
      : (disc === 'prepared' ? 'prepared' : 'spontaneous');
    const derivedSlot = derivedView?.slotsByLevelView?.[viewDiscKey]?.[numLvl] || null;

    if (!slot) {
      slot = derivedSlot
        ? Object.assign({}, derivedSlot)
        : { level: numLvl, daily: 0, used: 0, dmBonus: 0 };
      arr.push(slot);
      arr.sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));
    } else {
      if (slot.daily === undefined && slot.total !== undefined) {
        slot.daily = Number(slot.total) || 0;
      }
      if (derivedSlot) {
        if ((Number(slot.daily) || 0) === 0 && (Number(derivedSlot.daily) || 0) > 0) {
          slot.daily = derivedSlot.daily;
        }
        if (slot.regularDaily === undefined && derivedSlot.regularDaily !== undefined) {
          slot.regularDaily = derivedSlot.regularDaily;
        }
        if (slot.domainDaily === undefined && derivedSlot.domainDaily !== undefined) {
          slot.domainDaily = derivedSlot.domainDaily;
        }
        if (slot.known === undefined && derivedSlot.known !== undefined) {
          slot.known = derivedSlot.known;
        }
      }
    }
    return slot;
  }

  function upsertBuffEntryOnDoc(doc, buffEntry) {
    if (!buffEntry || typeof buffEntry !== 'object') return false;
    if (!Array.isArray(doc.buffs)) doc.buffs = [];
    const copy = JSON.parse(JSON.stringify(buffEntry));
    const nameKey = String(copy.name || '').toLowerCase().trim();
    const existingIdx = doc.buffs.findIndex(b => b && (
      (copy.id && b.id === copy.id) ||
      (nameKey && String(b.name || '').toLowerCase().trim() === nameKey)
    ));
    if (existingIdx >= 0) {
      doc.buffs[existingIdx] = Object.assign({}, doc.buffs[existingIdx], copy, { active: true });
    } else {
      doc.buffs.push(Object.assign({ active: true }, copy));
    }
    const tempHpGranted = Number(copy.tempHpGranted) || 0;
    if (tempHpGranted > 0) {
      if (!doc.hp || typeof doc.hp !== 'object') doc.hp = { current: 10, max: 10, temp: 0 };
      doc.hp.temp = Math.max(Number(doc.hp.temp) || 0, tempHpGranted);
    }
    return true;
  }

  // 1. 'spells/castSpell' ({ discipline: 'spontaneous'|'prepared'|'divine'|'clericConversion', index, spellLevel, isDomain, buffEntry, selfHpCost, isAtWill })
  CharStore.registerReducer('spells/castSpell', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const rawDisc = payload.isSpontaneousConversion ? 'clericconversion' : String(payload.discipline || payload.pool || 'spontaneous').toLowerCase();
    const disc = rawDisc === 'clericspontaneousconversion' ? 'clericconversion' : rawDisc;
    const rawIdx = payload.index ?? payload.spellIndex ?? payload.spellIdx;
    const idx = rawIdx !== undefined && rawIdx !== null ? Number(rawIdx) : -1;

    let spell = null;
    if (disc === 'prepared' && idx >= 0) {
      spell = doc.spellcasting.preparedSpells[idx] || null;
    } else if ((disc === 'divine' || disc === 'clericconversion') && idx >= 0) {
      spell = doc.spellcasting.divineSpells[idx] || null;
    } else if (disc === 'spontaneous' && idx >= 0) {
      spell = doc.spellcasting.knownSpells[idx] || (Array.isArray(doc.spells) ? doc.spells[idx] : null) || null;
    }

    const lvl = Math.max(0, Number(payload.spellLevel ?? payload.level ?? (spell ? spell.level : 0)) || 0);
    const isDom = Boolean(payload.isDomain ?? payload.isDomainSpell ?? (spell && spell.isDomainSpell));
    const isAtWill = Boolean(
      payload.isAtWill ||
      (spell && (
        spell.category === 'Warlock Invocation' ||
        /invocation|eldritch/i.test(String(spell.school || '')) ||
        /at-will|at will/i.test(String(spell.duration || ''))
      ))
    );

    if (disc === 'prepared') {
      if (spell && (spell.isCast || spell.cast)) {
        setStoreOutcome(stateObj, { status: 'already_cast', discipline: 'prepared', spellLevel: lvl });
        return doc;
      }
      const slot = ensureSlotEntryForDiscipline(doc, 'prepared', lvl);
      const daily = Number(slot.daily) || 0;
      const used = Number(slot.used) || 0;
      if (used >= daily) {
        setStoreOutcome(stateObj, { status: 'no_slots_remaining', discipline: 'prepared', spellLevel: lvl });
        return doc;
      }
      slot.used = used + 1;
      if (spell && payload.markPreparedCast !== false) {
        spell.isCast = true;
        spell.cast = true;
      }
    } else if (disc === 'divine') {
      if (spell && (spell.isCast || spell.cast)) {
        setStoreOutcome(stateObj, { status: 'already_cast', discipline: 'divine', spellLevel: lvl });
        return doc;
      }
      const slot = ensureSlotEntryForDiscipline(doc, 'divine', lvl);
      const daily = Number(slot.daily) || 0;
      const used = Number(slot.used) || 0;
      const domDaily = Number(slot.domainDaily) || 0;
      const domUsed = Number(slot.domainUsed) || 0;
      const regDaily = slot.regularDaily !== undefined
        ? Number(slot.regularDaily)
        : Math.max(0, daily - domDaily);
      const regUsed = Math.max(0, used - domUsed);
      const canCast = used < daily && (isDom ? domUsed < domDaily : regUsed < regDaily);
      if (!canCast) {
        setStoreOutcome(stateObj, { status: 'no_slots_remaining', discipline: 'divine', spellLevel: lvl, isDomain: isDom });
        return doc;
      }
      slot.used = used + 1;
      if (isDom) {
        slot.domainUsed = Math.min(domDaily, domUsed + 1);
      }
      if (spell && payload.markPreparedCast !== false) {
        spell.isCast = true;
        spell.cast = true;
      }
    } else if (disc === 'clericconversion') {
      if ((spell && spell.isDomainSpell) || isDom) {
        setStoreOutcome(stateObj, { status: 'invalid_payload', reason: 'domain_cannot_convert' });
        return doc;
      }
      if (spell && (spell.isCast || spell.cast)) {
        setStoreOutcome(stateObj, { status: 'already_cast', discipline: 'clericConversion', spellLevel: lvl });
        return doc;
      }
      const slot = ensureSlotEntryForDiscipline(doc, 'divine', lvl);
      const daily = Number(slot.daily) || 0;
      const used = Number(slot.used) || 0;
      const domDaily = Number(slot.domainDaily) || 0;
      const domUsed = Number(slot.domainUsed) || 0;
      const regDaily = slot.regularDaily !== undefined
        ? Number(slot.regularDaily)
        : Math.max(0, daily - domDaily);
      const regUsed = Math.max(0, used - domUsed);
      const regRem = Math.max(0, regDaily - regUsed);
      if (used >= daily || regRem <= 0) {
        setStoreOutcome(stateObj, { status: 'no_slots_remaining', discipline: 'clericConversion', spellLevel: lvl });
        return doc;
      }
      slot.used = used + 1;
      if (spell) {
        spell.isCast = true;
        spell.cast = true;
        if (payload.convName) spell.convertedTo = payload.convName;
      }
    } else {
      if (!isAtWill) {
        const slot = ensureSlotEntryForDiscipline(doc, 'spontaneous', lvl);
        const daily = Number(slot.daily) || 0;
        const used = Number(slot.used) || 0;
        if (used >= daily) {
          setStoreOutcome(stateObj, { status: 'no_slots_remaining', discipline: 'spontaneous', spellLevel: lvl });
          return doc;
        }
        slot.used = used + 1;
      }
    }

    const buffActivated = upsertBuffEntryOnDoc(doc, payload.buffEntry || payload.buffPayload);

    const selfHpCost = Number(payload.selfHpCost) || 0;
    if (selfHpCost > 0 && doc.hp && typeof doc.hp === 'object') {
      let dmgLeft = selfHpCost;
      const prevTemp = Math.max(0, Number(doc.hp.temp) || 0);
      if (prevTemp > 0) {
        const absorbed = Math.min(prevTemp, dmgLeft);
        doc.hp.temp = prevTemp - absorbed;
        dmgLeft -= absorbed;
      }
      if (dmgLeft > 0) {
        doc.hp.current = Math.max(-10, (Number(doc.hp.current) || 0) - dmgLeft);
      }
      doc.hp._lastPlayerChangeTs = Date.now();
    }

    setStoreOutcome(stateObj, {
      status: 'spell_cast',
      discipline: disc === 'clericconversion' ? 'clericConversion' : (payload.discipline || disc || 'spontaneous'),
      spellLevel: lvl,
      spellName: (spell && spell.name) || payload.spellName || '',
      isDomain: isDom,
      isAtWill,
      buffActivated,
      selfHpCost
    });
    return doc;
  });

  // 2. 'spells/adjustSlot' ({ discipline: 'spontaneous'|'prepared'|'divine', level, deltaUsed, totalOverride, isDomain, dmBonusOverride, knownBonusOverride, slotsBatch })
  CharStore.registerReducer('spells/adjustSlot', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const disc = String(payload.discipline || 'spontaneous').toLowerCase();
    const listKey = disc === 'prepared' ? 'preparedSlots' : (disc === 'divine' ? 'divineSlots' : 'slots');

    if (Array.isArray(payload.slotsBatch)) {
      doc.spellcasting[listKey] = JSON.parse(JSON.stringify(payload.slotsBatch));
      setStoreOutcome(stateObj, { status: 'slot_adjusted', discipline: disc, batch: true });
      return doc;
    }

    const lvl = Math.max(0, Number(payload.level) || 0);
    const slot = ensureSlotEntryForDiscipline(doc, disc, lvl);

    if (payload.totalOverride !== undefined && payload.totalOverride !== null) {
      const nextTotal = Math.max(0, Number(payload.totalOverride) || 0);
      slot.daily = nextTotal;
      if (disc === 'divine' && slot.regularDaily !== undefined) {
        const domD = Number(slot.domainDaily) || 0;
        slot.regularDaily = Math.max(0, nextTotal - domD);
      }
    }
    if (payload.dmBonusOverride !== undefined && payload.dmBonusOverride !== null) {
      slot.dmBonus = Math.max(0, Number(payload.dmBonusOverride) || 0);
    }
    if (payload.knownBonusOverride !== undefined && payload.knownBonusOverride !== null) {
      slot.knownBonus = Math.max(0, Number(payload.knownBonusOverride) || 0);
    }

    const daily = Math.max(0, Number(slot.daily) || 0);
    if (payload.isDomain && disc === 'divine') {
      const domDaily = Math.max(0, Number(slot.domainDaily) || 0);
      const nextDomUsed = Math.min(domDaily, Math.max(0, (Number(slot.domainUsed) || 0) + (Number(payload.deltaUsed) || 0)));
      const domDiff = nextDomUsed - (Number(slot.domainUsed) || 0);
      slot.domainUsed = nextDomUsed;
      slot.used = Math.min(daily, Math.max(nextDomUsed, (Number(slot.used) || 0) + domDiff));
    } else if (payload.deltaUsed !== undefined && payload.deltaUsed !== null) {
      const minUsed = (disc === 'divine') ? (Number(slot.domainUsed) || 0) : 0;
      slot.used = Math.min(daily, Math.max(minUsed, (Number(slot.used) || 0) + (Number(payload.deltaUsed) || 0)));
    } else {
      slot.used = Math.min(daily, Math.max(0, Number(slot.used) || 0));
    }

    setStoreOutcome(stateObj, {
      status: 'slot_adjusted',
      discipline: disc,
      level: lvl,
      used: slot.used,
      daily: slot.daily,
      domainUsed: slot.domainUsed || 0
    });
    return doc;
  });

  // 3. 'spells/restoreAllSlots' ({ discipline: 'spontaneous'|'prepared'|'divine'|'all' })
  CharStore.registerReducer('spells/restoreAllSlots', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const disc = String(payload.discipline || 'all').toLowerCase();

    const resetSlots = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(s => {
        if (!s) return;
        s.used = 0;
        if (s.domainUsed !== undefined) s.domainUsed = 0;
      });
    };

    if (disc === 'spontaneous' || disc === 'all') {
      resetSlots(doc.spellcasting.slots);
    }
    if (disc === 'prepared' || disc === 'all') {
      resetSlots(doc.spellcasting.preparedSlots);
      (doc.spellcasting.preparedSpells || []).forEach(sp => {
        if (sp) { sp.isCast = false; sp.cast = false; }
      });
    }
    if (disc === 'divine' || disc === 'all') {
      resetSlots(doc.spellcasting.divineSlots);
      (doc.spellcasting.divineSpells || []).forEach(sp => {
        if (sp) { sp.isCast = false; sp.cast = false; delete sp.convertedTo; }
      });
      doc.spellcasting.turnUndeadUsed = 0;
      doc.spellcasting.domainPowerUses = {};
    }

    setStoreOutcome(stateObj, { status: 'slots_restored', discipline: disc });
    return doc;
  });

  // 4. 'spells/addSpell' ({ discipline: 'spontaneous'|'prepared'|'divine', spellEntry, allowDuplicate })
  CharStore.registerReducer('spells/addSpell', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const disc = String(payload.discipline || payload.pool || 'spontaneous').toLowerCase();
    const rawEntry = payload.spellEntry;
    if (!rawEntry || !rawEntry.name) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const listKey = disc === 'prepared' ? 'preparedSpells' : (disc === 'divine' ? 'divineSpells' : 'knownSpells');
    const arr = doc.spellcasting[listKey];
    const cleanName = String(rawEntry.name || '').toLowerCase().trim();
    const lvl = Math.max(0, Number(rawEntry.level) || 0);

    if (disc === 'spontaneous' && !payload.allowDuplicate) {
      const exists = arr.some(s => s && String(s.name || '').toLowerCase().trim() === cleanName && (Number(s.level) || 0) === lvl);
      if (exists) {
        setStoreOutcome(stateObj, { status: 'already_exists', spellName: rawEntry.name, level: lvl });
        return doc;
      }
    }

    const entryCopy = JSON.parse(JSON.stringify(rawEntry));
    entryCopy.level = lvl;
    arr.push(entryCopy);

    setStoreOutcome(stateObj, {
      status: 'spell_added',
      discipline: disc,
      spellName: entryCopy.name,
      level: lvl,
      isDomainSpell: Boolean(entryCopy.isDomainSpell)
    });
    return doc;
  });

  // 5. 'spells/removeSpell' ({ discipline: 'spontaneous'|'prepared'|'divine', index })
  CharStore.registerReducer('spells/removeSpell', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const disc = String(payload.discipline || payload.pool || 'spontaneous').toLowerCase();
    const rawIdx = payload.index ?? payload.spellIndex ?? payload.spellIdx;
    const idx = Number(rawIdx);
    const listKey = disc === 'prepared' ? 'preparedSpells' : (disc === 'divine' ? 'divineSpells' : 'knownSpells');
    const arr = doc.spellcasting[listKey];

    if (isNaN(idx) || idx < 0 || idx >= arr.length) {
      setStoreOutcome(stateObj, { status: 'not_found', discipline: disc, index: idx });
      return doc;
    }

    const removed = arr.splice(idx, 1)[0];
    setStoreOutcome(stateObj, {
      status: 'spell_removed',
      discipline: disc,
      spellName: (removed && removed.name) || '',
      isDomainSpell: Boolean(removed && removed.isDomainSpell)
    });
    return doc;
  });

  // 6. 'spells/toggleClericSpontaneousMode' ({ mode })
  CharStore.registerReducer('spells/toggleClericSpontaneousMode', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const cur = doc.spellcasting.clericSpontaneousMode || 'cure';
    const nextMode = payload.mode
      ? String(payload.mode).toLowerCase()
      : (cur === 'cure' || cur === 'good' ? 'inflict' : 'cure');
    doc.spellcasting.clericSpontaneousMode = nextMode;
    setStoreOutcome(stateObj, {
      status: 'cleric_spont_mode_updated',
      mode: nextMode
    });
    return doc;
  });

  // 7. 'spells/useTurnOrDomainPower' ({ kind: 'turn'|'domain'|'setDomains', id, isReset, maxUses, buffEntry, domains })
  CharStore.registerReducer('spells/useTurnOrDomainPower', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const id = String(payload.id || payload.powerId || payload.poolId || 'undead');
    const kind = payload.kind
      ? String(payload.kind).toLowerCase()
      : (payload.powerId ? 'domain' : (payload.isTurnUndead === false ? 'domain' : (id === 'undead' ? 'turn' : 'domain')));

    if (kind === 'setdomains' && Array.isArray(payload.domains)) {
      doc.spellcasting.domains = payload.domains.filter(Boolean).slice(0, 2);
      setStoreOutcome(stateObj, { status: 'domains_updated', domains: [...doc.spellcasting.domains] });
      return doc;
    }

    if (payload.isReset) {
      if (kind === 'turn' && id === 'undead') {
        doc.spellcasting.turnUndeadUsed = 0;
      } else {
        doc.spellcasting.domainPowerUses[id] = 0;
      }
      setStoreOutcome(stateObj, { status: 'power_reset', kind, id });
      return doc;
    }

    const maxUses = payload.maxUses !== undefined ? Math.max(1, Number(payload.maxUses) || 1) : 99;
    const curUsed = (kind === 'turn' && id === 'undead')
      ? Math.max(0, Number(doc.spellcasting.turnUndeadUsed) || 0)
      : Math.max(0, Number(doc.spellcasting.domainPowerUses[id]) || 0);

    if (curUsed >= maxUses) {
      setStoreOutcome(stateObj, { status: 'exhausted_daily', kind, id, used: curUsed, maxUses });
      return doc;
    }

    if (payload.consumeTurnUndead) {
      const curTurnUsed = Math.max(0, Number(doc.spellcasting.turnUndeadUsed) || 0);
      const maxTurnUses = payload.maxTurnUses !== undefined ? Math.max(1, Number(payload.maxTurnUses) || 1) : 99;
      if (curTurnUsed >= maxTurnUses) {
        setStoreOutcome(stateObj, { status: 'exhausted_daily', kind: 'turn', id: 'undead', used: curTurnUsed, maxUses: maxTurnUses });
        return doc;
      }
      doc.spellcasting.turnUndeadUsed = curTurnUsed + 1;
    }

    if (kind === 'turn' && id === 'undead') {
      doc.spellcasting.turnUndeadUsed = curUsed + 1;
    } else {
      doc.spellcasting.domainPowerUses[id] = curUsed + 1;
    }

    const buffActivated = upsertBuffEntryOnDoc(doc, payload.buffEntry || payload.buffPayload);

    setStoreOutcome(stateObj, {
      status: 'power_used',
      kind,
      id,
      used: curUsed + 1,
      maxUses,
      buffActivated
    });
    return doc;
  });

  // 8. 'spells/toggleManeuverReadied' ({ name, slotIdx, maxReadied })
  CharStore.registerReducer('spells/toggleManeuverReadied', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const readied = doc.tomeOfBattle.readiedManeuvers;

    if (payload.slotIdx !== undefined && payload.slotIdx !== null && !payload.name) {
      const sIdx = Number(payload.slotIdx);
      if (sIdx >= 0 && sIdx < readied.length) {
        const removed = readied.splice(sIdx, 1)[0];
        setStoreOutcome(stateObj, { status: 'maneuver_unreadied', name: removed?.name || '' });
        return doc;
      }
    }

    const rawName = String(payload.name || '').trim();
    const cleanName = rawName.toLowerCase();
    if (!cleanName) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }

    const existingIdx = readied.findIndex(m => m && String(m.name || '').toLowerCase().trim() === cleanName);
    if (existingIdx >= 0) {
      readied.splice(existingIdx, 1);
      setStoreOutcome(stateObj, { status: 'maneuver_unreadied', name: rawName });
      return doc;
    }

    const engine = resolveRuleEngine();
    const derivedMax = (engine && typeof engine.deriveSpellsView === 'function')
      ? (engine.deriveSpellsView(doc)?.casterStatsView?.martial?.maxReadied || 0)
      : 0;
    const maxReadied = payload.maxReadied !== undefined ? Number(payload.maxReadied) : (derivedMax || 99);

    if (readied.length >= maxReadied) {
      setStoreOutcome(stateObj, { status: 'max_readied_reached', maxReadied });
      return doc;
    }

    const knownItem = (doc.tomeOfBattle.maneuversKnown || []).find(
      m => m && String(m.name || '').toLowerCase().trim() === cleanName
    );
    if (!knownItem) {
      setStoreOutcome(stateObj, { status: 'not_found', name: rawName });
      return doc;
    }

    readied.push(Object.assign({}, JSON.parse(JSON.stringify(knownItem)), { expended: false }));
    setStoreOutcome(stateObj, { status: 'maneuver_readied', name: knownItem.name });
    return doc;
  });

  // 9. 'spells/expendOrRecoverManeuver' ({ slotIdx, recoverAll })
  CharStore.registerReducer('spells/expendOrRecoverManeuver', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const readied = doc.tomeOfBattle.readiedManeuvers;

    if (payload.recoverAll || payload.mode === 'recoverAll') {
      readied.forEach(m => {
        if (m) m.expended = false;
      });
      doc.lastModified = new Date().toISOString();
      setStoreOutcome(stateObj, { status: 'all_maneuvers_recovered' });
      return doc;
    }

    const rawIdx = payload.slotIdx ?? payload.index ?? payload.idx;
    const idx = rawIdx !== undefined && rawIdx !== null ? Number(rawIdx) : NaN;
    if (isNaN(idx) || idx < 0 || idx >= readied.length || !readied[idx]) {
      setStoreOutcome(stateObj, { status: 'not_found', slotIdx: idx });
      return doc;
    }

    const m = readied[idx];
    if (payload.mode === 'recover') {
      m.expended = false;
    } else if (payload.mode === 'expend') {
      m.expended = true;
    } else {
      m.expended = !Boolean(m.expended);
    }
    setStoreOutcome(stateObj, {
      status: m.expended ? 'maneuver_expended' : 'maneuver_recovered',
      slotIdx: idx,
      name: m.name || '',
      expended: m.expended
    });
    return doc;
  });

  // 10. 'spells/selectStance' ({ name })
  CharStore.registerReducer('spells/selectStance', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const rawStance = payload.name !== undefined && payload.name !== null ? payload.name : payload.stanceName;
    const nextStance = rawStance !== undefined && rawStance !== null ? String(rawStance) : 'None';
    doc.activeStance = nextStance;
    if (doc.tomeOfBattle) doc.tomeOfBattle.activeStance = nextStance;
    setStoreOutcome(stateObj, { status: 'stance_selected', name: nextStance });
    return doc;
  });

  // 11a. 'spells/addManeuverOrStance' ({ entry, isStance })
  CharStore.registerReducer('spells/addManeuverOrStance', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const entry = payload.entry;
    const isStance = Boolean(payload.isStance || payload.itemType === 'Stance');
    if (!entry || !entry.name) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const cleanName = String(entry.name || '').toLowerCase().trim();
    const targetArr = isStance ? doc.tomeOfBattle.stancesKnown : doc.tomeOfBattle.maneuversKnown;
    if (targetArr.some(x => x && String(x.name || '').toLowerCase().trim() === cleanName)) {
      setStoreOutcome(stateObj, { status: 'already_exists', name: entry.name, isStance });
      return doc;
    }
    const copy = JSON.parse(JSON.stringify(entry));
    targetArr.push(copy);

    let autoReadied = false;
    if (!isStance && payload.autoReadyIfOpen) {
      const maxR = Number(payload.maxReadied) || 0;
      if (doc.tomeOfBattle.readiedManeuvers.length < maxR) {
        doc.tomeOfBattle.readiedManeuvers.push(Object.assign({}, JSON.parse(JSON.stringify(copy)), { expended: false }));
        autoReadied = true;
      }
    }
    if (isStance && (!doc.activeStance || doc.activeStance === 'None')) {
      doc.activeStance = copy.name;
    }

    setStoreOutcome(stateObj, {
      status: isStance ? 'stance_added' : 'maneuver_added',
      name: copy.name,
      isStance,
      autoReadied
    });
    return doc;
  });

  // 11b. 'spells/removeManeuverOrStance' ({ name, isStance })
  CharStore.registerReducer('spells/removeManeuverOrStance', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    const payload = (action && action.payload) || {};
    const rawName = String(payload.name || '').trim();
    const cleanName = rawName.toLowerCase();
    const isStance = Boolean(payload.isStance);

    if (isStance) {
      const idx = doc.tomeOfBattle.stancesKnown.findIndex(st => st && String(st.name || '').toLowerCase().trim() === cleanName);
      if (idx < 0) {
        setStoreOutcome(stateObj, { status: 'not_found', name: rawName, isStance: true });
        return doc;
      }
      doc.tomeOfBattle.stancesKnown.splice(idx, 1);
      if (String(doc.activeStance || '').toLowerCase().trim() === cleanName) {
        doc.activeStance = 'None';
      }
    } else {
      const idx = doc.tomeOfBattle.maneuversKnown.findIndex(m => m && String(m.name || '').toLowerCase().trim() === cleanName);
      if (idx < 0) {
        setStoreOutcome(stateObj, { status: 'not_found', name: rawName, isStance: false });
        return doc;
      }
      doc.tomeOfBattle.maneuversKnown.splice(idx, 1);
      const rIdx = doc.tomeOfBattle.readiedManeuvers.findIndex(m => m && String(m.name || '').toLowerCase().trim() === cleanName);
      if (rIdx >= 0) {
        doc.tomeOfBattle.readiedManeuvers.splice(rIdx, 1);
      }
    }

    setStoreOutcome(stateObj, {
      status: isStance ? 'stance_removed' : 'maneuver_removed',
      name: rawName,
      isStance
    });
    return doc;
  });

  // 12. 'spells/toggleHomebrew' ({ key })
  CharStore.registerReducer('spells/toggleHomebrew', (doc, action, stateObj) => {
    ensureSpellsDocStructures(doc);
    if (!doc.settings || typeof doc.settings !== 'object') doc.settings = {};
    const payload = (action && action.payload) || {};
    const target = String(payload.key || payload.discipline || '').toLowerCase().trim();
    const valid = ['spontaneous', 'prepared', 'divine', 'martial', 'warlock'];
    if (!valid.includes(target)) {
      setStoreOutcome(stateObj, { status: 'invalid_payload', key: target });
      return doc;
    }

    const currentBoons = Array.isArray(doc.settings.boonDisciplines)
      ? doc.settings.boonDisciplines.map(d => String(d || '').toLowerCase().trim()).filter(d => valid.includes(d))
      : [];
    const wasActive = currentBoons.includes(target);
    const nextBoons = wasActive
      ? currentBoons.filter(d => d !== target)
      : [...currentBoons, target];

    doc.settings.boonDisciplines = nextBoons;
    doc.settings.warlockBoon = nextBoons.includes('warlock');

    if (nextBoons.length > 0) {
      doc.settings.casterTypeExplicit = true;
      if (!wasActive) {
        doc.settings.casterType = target;
      } else if (!nextBoons.includes(doc.settings.casterType)) {
        doc.settings.casterType = nextBoons[0];
      }
      if (nextBoons.length === 1 && nextBoons[0] === 'warlock') {
        doc.settings.clMode = 'Warlock Boon (Invocations & Eldritch Blast)';
      } else {
        doc.settings.clMode = 'Character Level (Homebrew)';
      }
    } else {
      doc.settings.casterTypeExplicit = false;
      doc.settings.clMode = 'Class Level';
      doc.settings.casterType = payload.fallbackDiscipline || 'spontaneous';
    }

    setStoreOutcome(stateObj, {
      status: 'homebrew_toggled',
      key: target,
      enabled: !wasActive,
      boonDisciplines: [...nextBoons]
    });
    return doc;
  });

  // =========================================================================
  // PHASE R6: CHAR TAB (ABILITIES, SKILLS, FEATS, LEVEL PROGRESSION) & HUD REDUCERS
  // =========================================================================

  function extractLevelStatIncreaseKey(lvlRow) {
    if (!lvlRow) return null;
    if (lvlRow.statIncreased) return String(lvlRow.statIncreased).toLowerCase().trim();
    if (Array.isArray(lvlRow.feats)) {
      for (let i = 0; i < lvlRow.feats.length; i++) {
        const f = String(lvlRow.feats[i] || '');
        const m = f.match(/(?:\+1\s*Stat|Stat)\s*:\s*(STR|DEX|CON|INT|WIS|CHA)/i);
        if (m) return m[1].toLowerCase();
      }
    }
    return null;
  }

  CharStore.registerReducer('progression/adjustAbility', function (doc, action, stateObj) {
    const payload = (action && action.payload) || action || {};
    if (!doc || !payload) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const rawKey = payload.statKey || payload.abilityKey || payload.key;
    if (!rawKey) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const key = String(rawKey).toLowerCase().trim();
    if (!['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(key)) {
      setStoreOutcome(stateObj, { status: 'invalid_payload', statKey: key });
      return doc;
    }
    if (!doc.baseAbilities || typeof doc.baseAbilities !== 'object') {
      doc.baseAbilities = Object.assign({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, doc.abilities || {});
    }
    if (!doc.abilities || typeof doc.abilities !== 'object') {
      doc.abilities = Object.assign({}, doc.baseAbilities);
    }
    const prevScore = Number(doc.baseAbilities[key] ?? doc.abilities[key] ?? 10);
    let nextScore = prevScore;
    if (payload.score !== undefined && payload.score !== null) {
      nextScore = Math.max(1, Number(payload.score) || 10);
    } else if (payload.delta !== undefined && payload.delta !== null) {
      nextScore = Math.max(1, prevScore + (Number(payload.delta) || 0));
    }
    doc.baseAbilities[key] = nextScore;
    doc.abilities[key] = nextScore;
    doc.hasCustomBaseAbilities = true;
    setStoreOutcome(stateObj, {
      status: 'ability_adjusted',
      statKey: key,
      previousScore: prevScore,
      baseScore: nextScore
    });
    return doc;
  });

  CharStore.registerReducer('progression/setAbilityScores', function (doc, action, stateObj) {
    const payload = (action && action.payload) || action || {};
    if (!doc || !payload) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    if (!doc.baseAbilities || typeof doc.baseAbilities !== 'object') {
      doc.baseAbilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    }
    if (!doc.abilities || typeof doc.abilities !== 'object') {
      doc.abilities = Object.assign({}, doc.baseAbilities);
    }
    const srcBase = payload.baseAbilities || payload.abilities;
    if (srcBase && typeof srcBase === 'object') {
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (k) {
        if (srcBase[k] !== undefined && srcBase[k] !== null) {
          const val = Math.max(1, Number(srcBase[k]) || 10);
          doc.baseAbilities[k] = val;
          doc.abilities[k] = val;
        }
      });
      doc.hasCustomBaseAbilities = true;
    }
    if (payload.abilities && typeof payload.abilities === 'object') {
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (k) {
        if (payload.abilities[k] !== undefined && payload.abilities[k] !== null) {
          doc.abilities[k] = Math.max(1, Number(payload.abilities[k]) || 10);
        }
      });
    }
    if (payload.racialMods && typeof payload.racialMods === 'object') {
      doc.racialMods = Object.assign({}, doc.racialMods || {}, payload.racialMods);
    }
    if (payload.levelUpMods && typeof payload.levelUpMods === 'object') {
      doc.levelUpMods = Object.assign({}, doc.levelUpMods || {}, payload.levelUpMods);
    }
    if (Array.isArray(payload.templates)) {
      doc.templates = JSON.parse(JSON.stringify(payload.templates));
    }
    if (payload.profile && typeof payload.profile === 'object') {
      const p = payload.profile;
      if (p.name) doc.name = p.name;
      if (p.race) doc.race = p.race;
      if (p.size) doc.size = p.size;
      if (p.baseSpeed !== undefined && Number(p.baseSpeed) > 0) doc.baseSpeed = Number(p.baseSpeed);
      if (p.alignment) doc.alignment = p.alignment;
      if (p.deity !== undefined) doc.deity = p.deity;
      if (p.gender !== undefined) doc.gender = p.gender;
      if (p.age !== undefined && !isNaN(Number(p.age))) doc.age = Number(p.age);
      if (p.height !== undefined) doc.height = p.height;
      if (p.weight !== undefined) doc.weight = p.weight;
      if (Array.isArray(p.specialAbilities)) {
        doc.specialAbilities = JSON.parse(JSON.stringify(p.specialAbilities));
      }
      if (p.clericSpontaneousMode && doc.spellcasting) {
        doc.spellcasting.clericSpontaneousMode = p.clericSpontaneousMode;
      }
    }
    setStoreOutcome(stateObj, {
      status: 'ability_scores_set',
      baseAbilities: Object.assign({}, doc.baseAbilities)
    });
    return doc;
  });

  CharStore.registerReducer('progression/adjustSkillRank', function (doc, action, stateObj) {
    const payload = (action && action.payload) || action || {};
    if (!doc || !payload || !payload.skillKey) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    if (!Array.isArray(doc.skills)) doc.skills = [];
    const skillKey = String(payload.skillKey).trim();
    const delta = Number(payload.delta) || 0;
    const components = Array.isArray(payload.components) ? payload.components : null;

    const activeLevels = Array.isArray(doc.levelProgression) && doc.levelProgression.length > 0
      ? doc.levelProgression.filter(function (p) { return p && p.active !== false; }).length
      : (Number(doc.level) || 1);
    const charLevel = Math.max(1, activeLevels || Number(doc.level) || 1);
    const maxClassRank = charLevel + 3;
    const maxCrossRank = Math.floor((charLevel + 3) / 2 * 10) / 10;

    let targetSkills = [];
    if (components && components.length > 0) {
      components.forEach(function (compKey) {
        let sk = doc.skills.find(function (s) { return s && (s.key === compKey || s.name === compKey); });
        if (!sk) {
          sk = { key: compKey, name: compKey, ranks: 0, isClass: false };
          doc.skills.push(sk);
        }
        targetSkills.push(sk);
      });
    } else {
      let sk = doc.skills.find(function (s) {
        return s && (s.key === skillKey || s.name === skillKey || String(s.key || '').toLowerCase() === skillKey.toLowerCase());
      });
      if (!sk) {
        sk = { key: skillKey, name: skillKey, ranks: 0, isClass: false };
        doc.skills.push(sk);
      }
      targetSkills.push(sk);
    }

    const currentRanks = Math.max(0, ...targetSkills.map(function (s) { return Number(s.ranks) || 0; }));
    const isClass = targetSkills.some(function (s) { return Boolean(s.isClass); });
    const maxAllowedRank = isClass ? maxClassRank : maxCrossRank;

    if (delta > 0 && currentRanks + delta > maxAllowedRank) {
      setStoreOutcome(stateObj, {
        status: 'max_rank_cap',
        skillKey: skillKey,
        currentRanks: currentRanks,
        maxAllowedRank: maxAllowedRank,
        isClass: isClass
      });
      return doc;
    }

    const newRanks = Math.max(0, currentRanks + delta);
    targetSkills.forEach(function (s) {
      s.ranks = newRanks;
    });

    setStoreOutcome(stateObj, {
      status: 'skill_rank_adjusted',
      skillKey: skillKey,
      previousRanks: currentRanks,
      newRanks: newRanks,
      isClass: isClass,
      maxAllowedRank: maxAllowedRank
    });
    return doc;
  });

  CharStore.registerReducer('progression/toggleSkillClass', function (doc, action, stateObj) {
    const payload = (action && action.payload) || action || {};
    if (!doc || !payload || !payload.skillKey) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    if (!Array.isArray(doc.skills)) doc.skills = [];
    const skillKey = String(payload.skillKey).trim();
    const components = Array.isArray(payload.components) ? payload.components : null;

    let targetSkills = [];
    if (components && components.length > 0) {
      components.forEach(function (compKey) {
        let sk = doc.skills.find(function (s) { return s && (s.key === compKey || s.name === compKey); });
        if (!sk) {
          sk = { key: compKey, name: compKey, ranks: 0, isClass: false };
          doc.skills.push(sk);
        }
        targetSkills.push(sk);
      });
    } else {
      let sk = doc.skills.find(function (s) {
        return s && (s.key === skillKey || s.name === skillKey || String(s.key || '').toLowerCase() === skillKey.toLowerCase());
      });
      if (!sk) {
        sk = { key: skillKey, name: skillKey, ranks: 0, isClass: false };
        doc.skills.push(sk);
      }
      targetSkills.push(sk);
    }

    const anyClass = targetSkills.some(function (s) { return Boolean(s.isClass); });
    const nextState = payload.isClass !== undefined ? Boolean(payload.isClass) : !anyClass;
    targetSkills.forEach(function (s) {
      s.isClass = nextState;
    });

    setStoreOutcome(stateObj, {
      status: 'skill_class_toggled',
      skillKey: skillKey,
      isClass: nextState
    });
    return doc;
  });

  CharStore.registerReducer('progression/addFeat', function (doc, action, stateObj) {
    const payload = (action && action.payload) || action || {};
    if (!doc || !payload) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    if (!Array.isArray(doc.feats)) doc.feats = [];
    if (!Array.isArray(doc.specialAbilities)) doc.specialAbilities = [];
    if (!Array.isArray(doc.levelProgression)) doc.levelProgression = [];

    const lvlIdx = payload.levelIndex !== undefined && payload.levelIndex !== null ? Number(payload.levelIndex) : null;
    const category = payload.category || (payload.featObj && payload.featObj.category) || 'Regular Feat';
    const featName = String(payload.featName || (payload.featObj && payload.featObj.name) || (payload.specialAbilityObj && payload.specialAbilityObj.name) || payload.featString || '').trim();
    const featString = String(payload.featString || featName).trim();
    if (!featName && !featString && !payload.featObj && !payload.specialAbilityObj && !payload.customDbEntry) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }

    if (lvlIdx !== null && lvlIdx >= 0) {
      if (!doc.levelProgression[lvlIdx]) {
        doc.levelProgression[lvlIdx] = {
          level: lvlIdx + 1,
          className: (doc.classes ? String(doc.classes).split(' ')[0] : 'Fighter'),
          hd: 'd10',
          hpGain: 10,
          feats: [],
          specialAbilities: [],
          active: true
        };
      }
      const row = doc.levelProgression[lvlIdx];
      if (!Array.isArray(row.feats)) row.feats = [];
      if (!Array.isArray(row.specialAbilities)) row.specialAbilities = [];

      if (payload.clearExistingFlawName) {
        const cleanFlaw = String(payload.clearExistingFlawName).toLowerCase().trim();
        row.feats = row.feats.filter(function (fStr) {
          const raw = String(fStr || '').replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
          return raw !== cleanFlaw;
        });
      }

      if (category === 'Special Ability') {
        if (featString && !row.specialAbilities.includes(featString)) {
          row.specialAbilities.push(featString);
        }
      } else if (featString) {
        row.feats.push(featString);
      }
    }

    if (payload.specialAbilityObj && typeof payload.specialAbilityObj === 'object') {
      const sa = JSON.parse(JSON.stringify(payload.specialAbilityObj));
      const saNameLower = String(sa.name || '').toLowerCase().trim();
      const exSaIdx = doc.specialAbilities.findIndex(function (a) {
        return String(typeof a === 'string' ? a : (a && a.name) || '').toLowerCase().trim() === saNameLower;
      });
      if (exSaIdx === -1) {
        doc.specialAbilities.push(sa);
      } else {
        doc.specialAbilities[exSaIdx] = typeof doc.specialAbilities[exSaIdx] === 'object'
          ? Object.assign({}, doc.specialAbilities[exSaIdx], sa)
          : sa;
      }
    }

    if (payload.featObj && typeof payload.featObj === 'object') {
      const fObj = JSON.parse(JSON.stringify(payload.featObj));
      const fNameLower = String(fObj.name || '').toLowerCase().trim();
      const exIdx = doc.feats.findIndex(function (f) {
        return String(typeof f === 'string' ? f : (f && f.name) || '').toLowerCase().trim() === fNameLower;
      });
      if (exIdx === -1) {
        doc.feats.push(fObj);
        if ((payload.isToughness || fNameLower === 'toughness') && doc.hp) {
          if (doc.hp.baseMax === undefined) doc.hp.baseMax = (Number(doc.hp.max) || 44) - (Number(doc.hp.conBonusHp) || 0);
          doc.hp.baseMax = (Number(doc.hp.baseMax) || 0) + 3;
          doc.hp.max = (Number(doc.hp.baseMax) || 0) + (Number(doc.hp.conBonusHp) || 0);
          doc.hp.current = (Number(doc.hp.current) || 0) + 3;
        }
      } else if (typeof doc.feats[exIdx] === 'object') {
        doc.feats[exIdx] = Object.assign({}, doc.feats[exIdx], fObj);
      }
    } else if (featName && category !== 'Special Ability') {
      const cleanNameLower = featName.toLowerCase();
      const exists = doc.feats.some(function (f) {
        return String(typeof f === 'string' ? f : (f && f.name) || '').toLowerCase().trim() === cleanNameLower;
      });
      if (!exists) {
        const entry = {
          name: featName,
          type: category === 'Flaw' ? 'Flaw' : 'Feat',
          category: category
        };
        if (payload.target) entry.target = payload.target;
        doc.feats.push(entry);
      }
    }

    if (payload.customDbEntry && typeof payload.customDbEntry === 'object') {
      if (!Array.isArray(doc.customDb)) doc.customDb = [];
      const entryCopy = JSON.parse(JSON.stringify(payload.customDbEntry));
      const cleanDb = String(entryCopy.name || '').toLowerCase().trim();
      const exDbIdx = doc.customDb.findIndex(function (m) {
        return m && String(m.name || '').toLowerCase().trim() === cleanDb;
      });
      if (exDbIdx >= 0) {
        doc.customDb[exDbIdx] = Object.assign({}, doc.customDb[exDbIdx], entryCopy);
      } else if (!payload.customDbUpdateOnly) {
        doc.customDb.push(entryCopy);
      }
    }

    setStoreOutcome(stateObj, {
      status: 'feat_added',
      featName: featName,
      category: category,
      levelIndex: lvlIdx
    });
    return doc;
  });

  CharStore.registerReducer('progression/removeFeat', function (doc, action, stateObj) {
    const payload = (action && action.payload) || action || {};
    if (!doc || !payload) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const rawTarget = String(payload.featName || payload.featString || '').trim();
    const cleanTarget = rawTarget
      .replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/i, '')
      .replace(/^Homebrew:\s*/i, '')
      .replace(/^Flaw:\s*/i, '')
      .trim()
      .toLowerCase();
    if (!cleanTarget) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }

    const lvlIdx = payload.levelIndex !== undefined && payload.levelIndex !== null ? Number(payload.levelIndex) : null;
    const matchesFeatStr = function (s) {
      const cleaned = String(s || '')
        .replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/i, '')
        .replace(/^Homebrew:\s*/i, '')
        .replace(/^Flaw:\s*/i, '')
        .trim()
        .toLowerCase();
      return cleaned === cleanTarget || String(s || '').trim().toLowerCase() === rawTarget.toLowerCase();
    };

    if (Array.isArray(doc.levelProgression)) {
      if (lvlIdx !== null && lvlIdx >= 0 && doc.levelProgression[lvlIdx]) {
        const row = doc.levelProgression[lvlIdx];
        if (Array.isArray(row.feats)) {
          row.feats = row.feats.filter(function (f) { return !matchesFeatStr(f); });
        }
        if (Array.isArray(row.specialAbilities)) {
          row.specialAbilities = row.specialAbilities.filter(function (a) { return !matchesFeatStr(a); });
        }
      } else {
        doc.levelProgression.forEach(function (row) {
          if (!row) return;
          if (Array.isArray(row.feats)) {
            row.feats = row.feats.filter(function (f) { return !matchesFeatStr(f); });
          }
          if (Array.isArray(row.specialAbilities)) {
            row.specialAbilities = row.specialAbilities.filter(function (a) { return !matchesFeatStr(a); });
          }
        });
      }
    }

    const stillInProg = Array.isArray(doc.levelProgression) && doc.levelProgression.some(function (row) {
      if (!row || row.active === false) return false;
      const inF = Array.isArray(row.feats) && row.feats.some(matchesFeatStr);
      const inA = Array.isArray(row.specialAbilities) && row.specialAbilities.some(matchesFeatStr);
      return inF || inA;
    });

    if (!stillInProg) {
      if (Array.isArray(doc.feats)) {
        doc.feats = doc.feats.filter(function (f) {
          const n = typeof f === 'string' ? f : (f && f.name) || '';
          return !matchesFeatStr(n);
        });
      }
      if (payload.isAbility && Array.isArray(doc.specialAbilities)) {
        doc.specialAbilities = doc.specialAbilities.filter(function (a) {
          const n = typeof a === 'string' ? a : (a && a.name) || '';
          return !matchesFeatStr(n) && !matchesFeatStr(n.replace(/\s*\(Invocation\)$/i, ''));
        });
      }
    }

    setStoreOutcome(stateObj, {
      status: 'feat_removed',
      featName: rawTarget,
      levelIndex: lvlIdx
    });
    return doc;
  });

  CharStore.registerReducer('progression/updateLevelRow', function (doc, action, stateObj) {
    const payload = (action && action.payload) || action || {};
    if (!doc || !payload) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    if (!Array.isArray(doc.levelProgression)) doc.levelProgression = [];
    const prog = doc.levelProgression;
    const mode = String(payload.mode || '').trim();
    const idx = payload.levelIndex !== undefined && payload.levelIndex !== null ? Number(payload.levelIndex) : -1;

    if (mode === 'add') {
      const nextLvl = prog.length + 1;
      const rowData = payload.row ? JSON.parse(JSON.stringify(payload.row)) : {
        level: nextLvl,
        active: payload.active !== undefined ? Boolean(payload.active) : false,
        className: payload.className || (prog.length > 0 ? prog[prog.length - 1].className : 'Fighter'),
        hd: payload.hd || 'd10',
        hpGain: Number(payload.hpGain) || 10,
        bab: Number(payload.bab) || 1,
        fort: Number(payload.fort) || 0,
        ref: Number(payload.ref) || 0,
        will: Number(payload.will) || 0,
        skillPts: Number(payload.skillPts) || 4,
        feats: Array.isArray(payload.feats) ? [...payload.feats] : [],
        specialAbilities: Array.isArray(payload.specialAbilities) ? [...payload.specialAbilities] : [],
        statIncreased: payload.statIncreased || null,
        notes: payload.notes || ''
      };
      rowData.level = nextLvl;
      prog.push(rowData);
      setStoreOutcome(stateObj, { status: 'level_row_added', level: nextLvl, row: rowData });
      return doc;
    }

    if (idx < 0 || idx >= prog.length) {
      setStoreOutcome(stateObj, { status: 'not_found', levelIndex: idx });
      return doc;
    }
    const row = prog[idx];

    if (mode === 'remove' || mode === 'delete') {
      if (prog.length <= 1) {
        setStoreOutcome(stateObj, { status: 'min_level_reached' });
        return doc;
      }
      const statToRevert = extractLevelStatIncreaseKey(row);
      if (statToRevert && row.active !== false && doc.baseAbilities && doc.baseAbilities[statToRevert] !== undefined) {
        doc.baseAbilities[statToRevert] = Math.max(1, Number(doc.baseAbilities[statToRevert]) - 1);
      }
      prog.splice(idx, 1);
      prog.forEach(function (p, i) { p.level = i + 1; });
      setStoreOutcome(stateObj, { status: 'level_row_removed', levelIndex: idx });
      return doc;
    }

    if (mode === 'toggleActive') {
      if (idx === 0 && row.active !== false) {
        setStoreOutcome(stateObj, { status: 'level_1_locked' });
        return doc;
      }
      if (row.active === false) {
        for (let i = 0; i < idx; i++) {
          if (prog[i].active === false) {
            setStoreOutcome(stateObj, { status: 'sequential_activation_required', blockingLevel: i + 1 });
            return doc;
          }
        }
        row.active = true;
        const statKey = extractLevelStatIncreaseKey(row);
        if (statKey && doc.baseAbilities && doc.baseAbilities[statKey] !== undefined) {
          doc.baseAbilities[statKey] = Number(doc.baseAbilities[statKey]) + 1;
        }
      } else {
        for (let i = idx + 1; i < prog.length; i++) {
          if (prog[i].active !== false) {
            setStoreOutcome(stateObj, { status: 'sequential_deactivation_required', blockingLevel: i + 1 });
            return doc;
          }
        }
        row.active = false;
        const statKey = extractLevelStatIncreaseKey(row);
        if (statKey && doc.baseAbilities && doc.baseAbilities[statKey] !== undefined) {
          doc.baseAbilities[statKey] = Math.max(1, Number(doc.baseAbilities[statKey]) - 1);
        }
      }
      setStoreOutcome(stateObj, { status: 'level_active_toggled', levelIndex: idx, active: row.active });
      return doc;
    }

    if (mode === 'setHp' || mode === 'hp') {
      const oldHp = Number(row.hpGain) || 0;
      const newHp = Math.max(1, Number(payload.hpGain ?? payload.hp) || 1);
      const hpDiff = newHp - oldHp;
      row.hpGain = newHp;
      if (row.active !== false && doc.hp) {
        if (doc.hp.baseMax === undefined) doc.hp.baseMax = (Number(doc.hp.max) || 44) - (Number(doc.hp.conBonusHp) || 0);
        doc.hp.baseMax = Math.max(1, (Number(doc.hp.baseMax) || 1) + hpDiff);
        doc.hp.max = Math.max(1, (Number(doc.hp.baseMax) || 1) + (Number(doc.hp.conBonusHp) || 0));
        doc.hp.current = Math.min(doc.hp.max, Math.max(1, (Number(doc.hp.current) || 1) + hpDiff));
      }
      setStoreOutcome(stateObj, { status: 'level_hp_updated', levelIndex: idx, hpGain: newHp });
      return doc;
    }

    if (mode === 'setStatIncrease' || mode === 'stat') {
      const oldStat = extractLevelStatIncreaseKey(row);
      const rawStatVal = payload.statKey !== undefined ? payload.statKey : payload.statIncreased;
      const newStatKey = rawStatVal ? String(rawStatVal).toLowerCase().trim() : null;
      if (oldStat !== newStatKey) {
        if (!doc.baseAbilities || typeof doc.baseAbilities !== 'object') {
          doc.baseAbilities = Object.assign({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, doc.abilities || {});
        }
        if (row.active !== false) {
          if (oldStat && doc.baseAbilities[oldStat] !== undefined) {
            doc.baseAbilities[oldStat] = Math.max(1, Number(doc.baseAbilities[oldStat]) - 1);
          }
          if (newStatKey && doc.baseAbilities[newStatKey] !== undefined) {
            doc.baseAbilities[newStatKey] = Number(doc.baseAbilities[newStatKey]) + 1;
          }
        }
        row.statIncreased = newStatKey;
        if (!Array.isArray(row.feats)) row.feats = [];
        row.feats = row.feats.filter(function (f) {
          const str = String(f).toLowerCase();
          return !str.includes('+1 stat') && !str.includes('stat:');
        });
        if (newStatKey) {
          const label = payload.statLabel || newStatKey.toUpperCase();
          row.feats.push('+1 Stat: ' + label);
        }
      }
      setStoreOutcome(stateObj, { status: 'level_stat_updated', levelIndex: idx, statKey: newStatKey });
      return doc;
    }

    if (mode === 'setClass' || mode === 'editClass') {
      const oldHp = Number(row.hpGain) || 0;
      const newHp = payload.hpGain !== undefined ? Math.max(1, Number(payload.hpGain) || 1) : oldHp;
      const hpDiff = newHp - oldHp;
      if (payload.className) row.className = payload.className;
      if (payload.hd) row.hd = payload.hd;
      row.hpGain = newHp;
      if (payload.skillPts !== undefined) row.skillPts = Number(payload.skillPts) || 4;
      if (payload.bab !== undefined) row.bab = Number(payload.bab) || 0;
      if (payload.fort !== undefined) row.fort = Number(payload.fort) || 0;
      if (payload.ref !== undefined) row.ref = Number(payload.ref) || 0;
      if (payload.will !== undefined) row.will = Number(payload.will) || 0;
      if (Array.isArray(payload.specialAbilities)) {
        row.specialAbilities = [...payload.specialAbilities];
      }
      if (payload.notes !== undefined) {
        row.notes = payload.notes;
      }
      if (row.active !== false && doc.hp && hpDiff !== 0) {
        if (doc.hp.baseMax === undefined) doc.hp.baseMax = (Number(doc.hp.max) || 44) - (Number(doc.hp.conBonusHp) || 0);
        doc.hp.baseMax = Math.max(1, (Number(doc.hp.baseMax) || 1) + hpDiff);
        doc.hp.max = Math.max(1, (Number(doc.hp.baseMax) || 1) + (Number(doc.hp.conBonusHp) || 0));
        doc.hp.current = Math.min(doc.hp.max, Math.max(1, (Number(doc.hp.current) || 1) + hpDiff));
      }
      if (payload.statKey !== undefined) {
        const oldStat = extractLevelStatIncreaseKey(row);
        const newStatKey = payload.statKey ? String(payload.statKey).toLowerCase().trim() : null;
        if (oldStat !== newStatKey) {
          if (!doc.baseAbilities || typeof doc.baseAbilities !== 'object') {
            doc.baseAbilities = Object.assign({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, doc.abilities || {});
          }
          if (row.active !== false) {
            if (oldStat && doc.baseAbilities[oldStat] !== undefined) {
              doc.baseAbilities[oldStat] = Math.max(1, Number(doc.baseAbilities[oldStat]) - 1);
            }
            if (newStatKey && doc.baseAbilities[newStatKey] !== undefined) {
              doc.baseAbilities[newStatKey] = Number(doc.baseAbilities[newStatKey]) + 1;
            }
          }
          row.statIncreased = newStatKey;
          if (!Array.isArray(row.feats)) row.feats = [];
          row.feats = row.feats.filter(function (f) {
            const str = String(f).toLowerCase();
            return !str.includes('+1 stat') && !str.includes('stat:');
          });
          if (newStatKey) {
            const label = payload.statLabel || newStatKey.toUpperCase();
            row.feats.push('+1 Stat: ' + label);
          }
        }
      }
      setStoreOutcome(stateObj, { status: 'level_class_updated', levelIndex: idx, className: row.className });
      return doc;
    }

    setStoreOutcome(stateObj, { status: 'invalid_payload', mode: mode });
    return doc;
  });

  CharStore.registerReducer('hud/adjustHp', function (doc, action, stateObj) {
    const payload = (action && action.payload) || action || {};
    if (!doc || !payload) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    if (!doc.hp || typeof doc.hp !== 'object') {
      doc.hp = { current: 10, max: 10, temp: 0 };
    }
    const mode = String(payload.mode || 'damage').trim();
    const amt = Math.max(0, Number(payload.amount) || 0);
    const prevCurrent = Number(doc.hp.current) || 0;
    const prevTemp = Math.max(0, Number(doc.hp.temp) || 0);
    const maxHp = Math.max(1, Number(doc.hp.max) || 1);
    let absorbedTemp = 0;

    if (mode === 'damage') {
      let dmgLeft = amt;
      if (prevTemp > 0 && dmgLeft > 0) {
        absorbedTemp = Math.min(prevTemp, dmgLeft);
        doc.hp.temp = prevTemp - absorbedTemp;
        dmgLeft -= absorbedTemp;
      }
      if (dmgLeft > 0) {
        doc.hp.current = Math.max(-10, prevCurrent - dmgLeft);
      }
    } else if (mode === 'heal') {
      doc.hp.current = Math.min(maxHp, prevCurrent + amt);
    } else if (mode === 'temp') {
      if (payload.additive) {
        doc.hp.temp = prevTemp + amt;
      } else {
        doc.hp.temp = Math.max(prevTemp, amt);
      }
    } else if (mode === 'clearTemp') {
      doc.hp.temp = 0;
    } else if (mode === 'setCurrent') {
      doc.hp.current = Number(payload.amount) || 0;
    } else if (mode === 'setMax') {
      const nextMax = Math.max(1, Number(payload.amount) || 1);
      doc.hp.max = nextMax;
      doc.hp.baseMax = nextMax - (Number(doc.hp.conBonusHp) || 0);
    } else {
      setStoreOutcome(stateObj, { status: 'invalid_payload', mode: mode });
      return doc;
    }

    doc.hp._lastPlayerChangeTs = Date.now();
    setStoreOutcome(stateObj, {
      status: 'hp_adjusted',
      mode: mode,
      amount: amt,
      absorbedTemp: absorbedTemp,
      tempAbsorbed: absorbedTemp,
      hpLost: Math.max(0, prevCurrent - doc.hp.current),
      previousHp: prevCurrent,
      previousTemp: prevTemp,
      currentHp: doc.hp.current,
      maxHp: doc.hp.max,
      tempHp: doc.hp.temp,
      source: payload.source || ''
    });
    return doc;
  });

  CharStore.registerReducer('hud/shortRest', function (doc, action, stateObj) {
    const payload = (action && action.payload) || action || {};
    if (!doc) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const minutes = Math.max(1, Number(payload.minutes) || 5);
    const charLvl = Math.max(1, (Array.isArray(doc.levelProgression) ? doc.levelProgression.filter(function (r) { return r && r.active !== false; }).length : 0) || Number(doc.level) || 1);

    // 1. Tome of Battle Maneuvers recovery & auto-fill
    let refreshedManeuvers = 0;
    let reReadiedCount = 0;
    if (!doc.tomeOfBattle || typeof doc.tomeOfBattle !== 'object') doc.tomeOfBattle = {};
    if (!Array.isArray(doc.tomeOfBattle.readiedManeuvers)) doc.tomeOfBattle.readiedManeuvers = [];
    if (!Array.isArray(doc.tomeOfBattle.maneuversKnown) && doc.tomeOfBattle.readiedManeuvers.length > 0) {
      doc.tomeOfBattle.maneuversKnown = doc.tomeOfBattle.readiedManeuvers.map(function (m) { return Object.assign({}, m); });
    }
    doc.tomeOfBattle.readiedManeuvers.forEach(function (m) {
      if (m && m.expended) {
        m.expended = false;
        refreshedManeuvers++;
      }
    });
    const maxReadied = Number(doc.tomeOfBattle.maxReadied) || (typeof root !== 'undefined' && typeof root.getInitiatorInfo === 'function' ? (root.getInitiatorInfo().maxReadied || 3) : 3);
    if (doc.tomeOfBattle.readiedManeuvers.length < maxReadied && Array.isArray(doc.tomeOfBattle.maneuversKnown)) {
      const readiedNames = doc.tomeOfBattle.readiedManeuvers.map(function (m) { return String((m && m.name) || '').toLowerCase().trim(); });
      for (let i = 0; i < doc.tomeOfBattle.maneuversKnown.length; i++) {
        if (doc.tomeOfBattle.readiedManeuvers.length >= maxReadied) break;
        const known = doc.tomeOfBattle.maneuversKnown[i];
        if (!known) continue;
        const kName = String(known.name || '').toLowerCase().trim();
        if (kName && !readiedNames.includes(kName)) {
          doc.tomeOfBattle.readiedManeuvers.push(Object.assign({}, known, { expended: false }));
          readiedNames.push(kName);
          reReadiedCount++;
        }
      }
    }
    if (Array.isArray(doc.tacticalRiders)) {
      doc.tacticalRiders.forEach(function (mod) {
        if (mod && mod.source === 'Maneuver' && mod.active) {
          mod.active = false;
        }
      });
    }

    // 2. Encounter round, cooldowns & action economy reset
    doc.encounterRound = 1;
    if (!doc.tactical || typeof doc.tactical !== 'object') doc.tactical = {};
    doc.tactical.round = 1;
    if (!payload || payload.resetRecharge !== false) {
      doc.tactical.abilityCooldowns = {};
      doc.specialAttackCooldowns = {};
    }
    resetPowerUsesOnDoc(doc, ['perEncounter']);
    doc.actionEconomy = { standard: true, move: true, swift: true, immediate: true };
    doc.tactical.spentActions = { standard: false, move: false, swift: false, immediate: false, fullRound: false };

    // 3. Expire or decrement combat / round-based / minute-based buffs
    let expiredBuffs = 0;
    const expiredBuffNames = [];
    const restRounds = minutes * 10;
    if (Array.isArray(doc.buffs)) {
      doc.buffs.forEach(function (b) {
        if (!b || !b.active) return;
        const bIdLower = String(b.id || '').toLowerCase();
        const bNameLower = String(b.name || '').toLowerCase();
        if (
          bIdLower === 'debuff_exhausted' || bIdLower === 'debuff_fatigued' ||
          bIdLower === 'debuff_sickened' || bIdLower === 'debuff_shaken' ||
          bNameLower === 'exhausted' || bNameLower === 'fatigued'
        ) {
          return;
        }

        const durRaw = String(b.durationText || b.duration || '').trim();
        const durLower = durRaw.toLowerCase();
        const isPermanent = Boolean(b.permanent) || durLower.includes('permanent') || durLower.includes('condition');
        const is24h = durLower.includes('24 hour') || durLower.includes('24 hr');
        if (isPermanent || is24h) return;

        if (!b.initialDuration && durRaw) b.initialDuration = durRaw;
        if ((b.initialRounds === undefined || b.initialRounds === null) && b.rounds !== null && b.rounds !== undefined) {
          b.initialRounds = Number(b.rounds);
        }

        const bCl = Math.max(1, Number(b.casterLevel || b.cl || charLvl) || 1);
        let shouldExpire = false;

        if (b.durationType === 'rounds') {
          shouldExpire = true;
        } else if (b.rounds !== null && b.rounds !== undefined && Number(b.rounds) > 0) {
          const remRds = Number(b.rounds) - restRounds;
          if (remRds <= 0) {
            shouldExpire = true;
          } else {
            b.rounds = remRds;
            if (/\b(?:min|mins|minute|minutes)\b/i.test(durLower)) {
              const remMins = Math.max(1, Math.ceil(remRds / 10));
              b.duration = remMins + ' min';
              b.durationText = remMins + ' min';
            }
          }
        } else if (Number(b.durationRounds) > 0 && Number(b.durationRounds) <= restRounds) {
          shouldExpire = true;
        } else {
          let parsedMins = null;
          let parsedRounds = null;

          if (/\b1\s*round\/level/i.test(durLower)) {
            parsedRounds = bCl;
          } else {
            const rdMatch = durLower.match(/(\d+)\s*(?:rd|rds|round|rounds)\b/i);
            if (rdMatch) parsedRounds = parseInt(rdMatch[1], 10);
          }

          if (parsedRounds !== null) {
            if (parsedRounds <= restRounds) {
              shouldExpire = true;
            } else {
              const remRds = parsedRounds - restRounds;
              b.rounds = remRds;
              b.duration = remRds + ' rounds';
              b.durationText = remRds + ' rounds';
            }
          } else {
            if (/10\s*min\.?\/level/i.test(durLower)) {
              parsedMins = bCl * 10;
            } else if (/\b1\s*min\.?\/level/i.test(durLower)) {
              parsedMins = bCl;
            } else if (/\b1\s*(?:hr|hour)\.?\/level/i.test(durLower)) {
              parsedMins = bCl * 60;
            } else {
              const minMatch = durLower.match(/(\d+)\s*(?:min|mins|minute|minutes)\b/i);
              if (minMatch) {
                parsedMins = parseInt(minMatch[1], 10);
              } else {
                const hrMatch = durLower.match(/(\d+)\s*(?:hr|hrs|hour|hours)\b/i);
                if (hrMatch) parsedMins = parseInt(hrMatch[1], 10) * 60;
              }
            }

            if (parsedMins !== null && parsedMins > 0) {
              if (parsedMins <= minutes) {
                shouldExpire = true;
              } else {
                const remMins = parsedMins - minutes;
                if (remMins >= 60 && remMins % 60 === 0 && /\b(?:hr|hrs|hour|hours)\b/i.test(durLower)) {
                  const remHrs = remMins / 60;
                  b.duration = remHrs + ' hr';
                  b.durationText = remHrs + ' hr';
                } else {
                  b.duration = remMins + ' min';
                  b.durationText = remMins + ' min';
                  if (remMins <= 15) b.rounds = remMins * 10;
                }
              }
            }
          }
        }

        if (shouldExpire) {
          b.active = false;
          if (typeof b.durationLeft === 'number') b.durationLeft = 0;
          expiredBuffs++;
          if (b.name) expiredBuffNames.push(b.name);
          if (b.initialDuration) {
            b.duration = b.initialDuration;
            b.durationText = b.initialDuration;
          }
          if (b.initialRounds !== undefined && b.initialRounds !== null) {
            b.rounds = b.initialRounds;
          }
          const tempHp = (typeof root !== 'undefined' && typeof root.getBuffGrantedTempHp === 'function')
            ? root.getBuffGrantedTempHp(b)
            : (Number(b.grantedTempHp) || 0);
          if (tempHp > 0 && doc.hp) {
            doc.hp.temp = Math.max(0, (Number(doc.hp.temp) || 0) - tempHp);
            b._tempHpSynced = false;
            doc.hp._lastPlayerChangeTs = Date.now();
          }
        }
      });
    }

    // 4. Nonlethal and Condition healing for 1 Hour rest (60 min)
    let nonlethalHealed = 0;
    let downgradedExhausted = false;
    let fatigueCleared = false;
    if (minutes >= 60) {
      if (!doc.hp || typeof doc.hp !== 'object') {
        const maxH = (charLvl * 10) || 10;
        doc.hp = { current: maxH, max: maxH, temp: 0, nonlethal: 0 };
      }
      const currentNonlethal = Number(doc.hp.nonlethal) || 0;
      if (currentNonlethal > 0) {
        nonlethalHealed = Math.min(currentNonlethal, charLvl);
        doc.hp.nonlethal = currentNonlethal - nonlethalHealed;
        doc.hp._lastPlayerChangeTs = Math.max(Date.now(), (Number(doc.hp._lastDmUpdateTs) || 0) + 100);
      }

      if (Array.isArray(doc.buffs)) {
        const exhaustedBuff = doc.buffs.find(function (b) {
          return b && b.active && (b.id === 'debuff_exhausted' || String(b.name || '').toLowerCase().includes('exhausted'));
        });
        if (exhaustedBuff) {
          downgradedExhausted = true;
          const fatiguedBuff = doc.buffs.find(function (b) {
            return b && b !== exhaustedBuff && (b.id === 'debuff_fatigued' || String(b.name || '').toLowerCase().includes('fatigued'));
          });
          if (fatiguedBuff) {
            exhaustedBuff.active = false;
            fatiguedBuff.active = true;
          } else {
            exhaustedBuff.id = 'debuff_fatigued';
            exhaustedBuff.schemaVersion = 3;
            exhaustedBuff.name = 'Fatigued (-2 STR/DEX)';
            exhaustedBuff.strBonus = -2;
            exhaustedBuff.dexBonus = -2;
            exhaustedBuff.speedBonus = 0;
            exhaustedBuff.effects = [
              { type: 'stat', targets: ['ability.str', 'ability.dex'], mode: 'flat', value: -2, btype: 'Penalty' }
            ];
            exhaustedBuff.ruleFlags = { fatigued: true };
            exhaustedBuff.active = true;
          }
        } else {
          const fatiguedBuff = doc.buffs.find(function (b) {
            return b && b.active && (b.id === 'debuff_fatigued' || String(b.name || '').toLowerCase().includes('fatigued'));
          });
          if (fatiguedBuff && payload.clearFatigueOnHour) {
            fatiguedBuff.active = false;
            fatigueCleared = true;
          }
        }
      }
    }

    doc.lastModified = new Date().toISOString();
    setStoreOutcome(stateObj, {
      status: 'short_rest_complete',
      minutes: minutes,
      refreshedManeuvers: refreshedManeuvers,
      reReadiedCount: reReadiedCount,
      expiredBuffs: expiredBuffs,
      expiredBuffNames: expiredBuffNames,
      nonlethalHealed: nonlethalHealed,
      fatigueCleared: fatigueCleared,
      downgradedExhausted: downgradedExhausted
    });
    return doc;
  });

  CharStore.registerReducer('hud/longRest', function (doc, action, stateObj) {
    const payload = (action && action.payload) || action || {};
    if (!doc) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const opts = payload || {};
    const isFullHeal = opts.isFullHeal !== undefined ? Boolean(opts.isFullHeal) : (opts.healHp !== false);
    const charLvl = Math.max(1, (Array.isArray(doc.levelProgression) ? doc.levelProgression.filter(function (r) { return r && r.active !== false; }).length : 0) || Number(doc.level) || 1);
    const maxHp = Number(doc.hp && doc.hp.max) || (charLvl * 10) || 10;
    if (!doc.hp || typeof doc.hp !== 'object') {
      doc.hp = { current: maxHp, max: maxHp, temp: 0, nonlethal: 0 };
    }
    const prevHp = Number(doc.hp.current) || 0;
    let hpGain = 0;

    if (opts.healHp !== false) {
      if (isFullHeal) {
        hpGain = Math.max(0, maxHp - prevHp);
        doc.hp.current = maxHp;
      } else {
        // D&D 3.5e RAW PHB p.146: 1 HP per character level per 8 hours of natural rest
        hpGain = Math.max(0, Math.min(maxHp - prevHp, charLvl));
        doc.hp.current = Math.min(maxHp, prevHp + charLvl);
      }
      doc.hp.temp = 0;
      doc.hp.nonlethal = 0;
      doc.hp._lastPlayerChangeTs = Math.max(Date.now(), (Number(doc.hp._lastDmUpdateTs) || 0) + 100);
    }

    // Encounter round, cooldowns & action economy reset
    doc.encounterRound = 1;
    if (!doc.tactical || typeof doc.tactical !== 'object') doc.tactical = {};
    if (opts.clearRoundBuffs !== false) {
      doc.tactical.combatExpertise = 0;
      doc.tactical.fightingDefensively = false;
      doc.tactical.totalDefense = false;
      doc.tactical.shieldBlockActive = false;
      doc.tactical.abilityCooldowns = {};
      doc.tactical.round = 1;
    }
    doc.specialAttackCooldowns = {};
    resetPowerUsesOnDoc(doc, ['perDay', 'perEncounter']);
    doc.actionEconomy = { standard: true, move: true, swift: true, immediate: true };
    doc.tactical.spentActions = { standard: false, move: false, swift: false, immediate: false, fullRound: false };

    // Spell slots & prepared/divine cast flags reset
    let refreshedSpells = 0;
    if (opts.restoreSlots !== false && doc.spellcasting) {
      if (Array.isArray(doc.spellcasting.slots)) {
        doc.spellcasting.slots.forEach(function (s) {
          if (s) {
            if (Number(s.used) > 0) refreshedSpells += Number(s.used);
            s.used = 0;
          }
        });
      }
      if (Array.isArray(doc.spellcasting.preparedSlots)) {
        doc.spellcasting.preparedSlots.forEach(function (s) {
          if (s) {
            if (Number(s.used) > 0) refreshedSpells += Number(s.used);
            s.used = 0;
          }
        });
      }
      if (Array.isArray(doc.spellcasting.divineSlots)) {
        doc.spellcasting.divineSlots.forEach(function (s) {
          if (s) {
            if (Number(s.used) > 0) refreshedSpells += Number(s.used);
            if (Number(s.domainUsed) > 0) refreshedSpells += Number(s.domainUsed);
            s.used = 0;
            s.domainUsed = 0;
          }
        });
      }
      if (Array.isArray(doc.spellcasting.preparedSpells)) {
        doc.spellcasting.preparedSpells.forEach(function (sp) {
          if (sp) {
            sp.isCast = false;
            sp.cast = false;
            delete sp.convertedTo;
          }
        });
      }
      if (Array.isArray(doc.spellcasting.divineSpells)) {
        doc.spellcasting.divineSpells.forEach(function (sp) {
          if (sp) {
            sp.isCast = false;
            sp.cast = false;
            delete sp.convertedTo;
          }
        });
      }
      doc.spellcasting.turnUndeadUsed = 0;
      doc.spellcasting.domainPowerUses = {};
    }

    // Tome of Battle Maneuvers recovery & auto-fill
    let refreshedManeuvers = 0;
    let reReadiedCount = 0;
    if (!doc.tomeOfBattle || typeof doc.tomeOfBattle !== 'object') doc.tomeOfBattle = {};
    if (!Array.isArray(doc.tomeOfBattle.readiedManeuvers)) doc.tomeOfBattle.readiedManeuvers = [];
    if (!Array.isArray(doc.tomeOfBattle.maneuversKnown) && doc.tomeOfBattle.readiedManeuvers.length > 0) {
      doc.tomeOfBattle.maneuversKnown = doc.tomeOfBattle.readiedManeuvers.map(function (m) { return Object.assign({}, m); });
    }
    doc.tomeOfBattle.readiedManeuvers.forEach(function (m) {
      if (m && m.expended) {
        m.expended = false;
        refreshedManeuvers++;
      }
    });
    const maxReadied = Number(doc.tomeOfBattle.maxReadied) || (typeof root !== 'undefined' && typeof root.getInitiatorInfo === 'function' ? (root.getInitiatorInfo().maxReadied || 3) : 3);
    if (doc.tomeOfBattle.readiedManeuvers.length < maxReadied && Array.isArray(doc.tomeOfBattle.maneuversKnown)) {
      const readiedNames = doc.tomeOfBattle.readiedManeuvers.map(function (m) { return String((m && m.name) || '').toLowerCase().trim(); });
      for (let i = 0; i < doc.tomeOfBattle.maneuversKnown.length; i++) {
        if (doc.tomeOfBattle.readiedManeuvers.length >= maxReadied) break;
        const known = doc.tomeOfBattle.maneuversKnown[i];
        if (!known) continue;
        const kName = String(known.name || '').toLowerCase().trim();
        if (kName && !readiedNames.includes(kName)) {
          doc.tomeOfBattle.readiedManeuvers.push(Object.assign({}, known, { expended: false }));
          readiedNames.push(kName);
          reReadiedCount++;
        }
      }
    }
    if (Array.isArray(doc.tacticalRiders)) {
      doc.tacticalRiders.forEach(function (mod) {
        if (mod && mod.source === 'Maneuver' && mod.active) {
          mod.active = false;
        }
      });
    }

    // Durations, Conditions & Debuffs
    let removedConditions = 0;
    if (Array.isArray(doc.buffs)) {
      doc.buffs.forEach(function (b) {
        if (!b || !b.active) return;
        const bName = String(b.name || '').toLowerCase();
        const isFatigued = b.id === 'debuff_fatigued' || bName.includes('fatigued');
        const isExhausted = b.id === 'debuff_exhausted' || bName.includes('exhausted');
        const isSickened = b.id === 'debuff_sickened' || bName.includes('sickened');
        const isShaken = b.id === 'debuff_shaken' || bName.includes('shaken');
        if (isFatigued || isExhausted || isSickened || isShaken) {
          b.active = false;
          removedConditions++;
          return;
        }
        const dur = String(b.durationText || b.duration || '').toLowerCase();
        const isPermanent = dur.includes('permanent') || Boolean(b.permanent);
        const is24h = dur.includes('24 hour') || dur.includes('24 hr');
        if (!isPermanent && !is24h) {
          b.active = false;
          b._tempHpSynced = false;
          if (b.initialDuration) {
            b.duration = b.initialDuration;
            b.durationText = b.initialDuration;
          }
          if (b.initialRounds !== undefined && b.initialRounds !== null) {
            b.rounds = b.initialRounds;
          }
        }
      });
    }

    if (Array.isArray(doc.periodicHpEffects)) {
      doc.periodicHpEffects = [];
    }

    // Daily charges on magic items
    let refreshedDailyItems = 0;
    const resetItemCharges = function (item) {
      if (item && item.dailyCharges && typeof item.dailyCharges.max === 'number') {
        const max = Number(item.dailyCharges.max) || 0;
        const cur = Number(item.dailyCharges.current) || 0;
        if (cur < max) {
          refreshedDailyItems++;
        }
        item.dailyCharges.current = max;
      }
    };
    if (doc.bodySlots && typeof doc.bodySlots === 'object') {
      Object.values(doc.bodySlots).forEach(resetItemCharges);
    }
    if (Array.isArray(doc.gearPool)) {
      doc.gearPool.forEach(resetItemCharges);
    }
    if (Array.isArray(doc.consumables)) {
      doc.consumables.forEach(resetItemCharges);
    }

    // Daily feats / specialAbilities / legoEntries
    let refreshedDailyFeats = 0;
    const resetFeatCharges = function (f) {
      if (!f || typeof f !== 'object') return;
      if (f.used === true) { f.used = false; refreshedDailyFeats++; }
      if (f.expended === true) { f.expended = false; refreshedDailyFeats++; }
      if (f.dailyCharges && typeof f.dailyCharges.max === 'number') {
        const max = Number(f.dailyCharges.max) || 0;
        const cur = Number(f.dailyCharges.current) || 0;
        if (cur < max) {
          refreshedDailyFeats++;
        }
        f.dailyCharges.current = max;
      }
    };
    if (Array.isArray(doc.feats)) doc.feats.forEach(resetFeatCharges);
    if (Array.isArray(doc.specialAbilities)) doc.specialAbilities.forEach(resetFeatCharges);
    if (Array.isArray(doc.legoEntries)) doc.legoEntries.forEach(resetFeatCharges);

    const hasRingOfSustenance = Boolean(
      doc.bodySlots && (
        (doc.bodySlots.ring1 && String(doc.bodySlots.ring1.name || '').includes('Ring of Sustenance')) ||
        (doc.bodySlots.ring2 && String(doc.bodySlots.ring2.name || '').includes('Ring of Sustenance'))
      )
    );

    doc.lastModified = new Date().toISOString();
    setStoreOutcome(stateObj, {
      status: 'long_rest_complete',
      isFullHeal: isFullHeal,
      hpGain: hpGain,
      currentHp: doc.hp.current,
      maxHp: maxHp,
      refreshedSpells: refreshedSpells,
      refreshedManeuvers: refreshedManeuvers,
      reReadiedCount: reReadiedCount,
      refreshedDailyItems: refreshedDailyItems,
      refreshedDailyFeats: refreshedDailyFeats,
      removedConditions: removedConditions,
      hasRingOfSustenance: hasRingOfSustenance
    });
    return doc;
  });

  // Sprint B.5 -> Faz C.3 Isolated Rule Crafter Capsule Bridge (0-DOM Overhead)
  CharStore.registerReducer('customDb/upsertV3', function (doc, action, stateObj) {
    const entry = action && action.payload && action.payload.entry;
    if (!entry || typeof entry !== 'object' || !entry.id || !entry.name) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    if (!Array.isArray(doc.customDb)) doc.customDb = [];
    const copy = CharStore._fastCloneHistoryVal(entry);
    copy.schemaVersion = copy.schemaVersion || 3;
    const idx = doc.customDb.findIndex(function (e) { return e && e.id === copy.id; });
    if (idx >= 0) {
      if (typeof root !== 'undefined' && root.SrdCompendium && typeof root.SrdCompendium.invalidateEntryCache === 'function') {
        root.SrdCompendium.invalidateEntryCache(doc.customDb[idx]);
      }
      doc.customDb[idx] = copy;
    } else {
      doc.customDb.unshift(copy);
    }
    setStoreOutcome(stateObj, { status: 'ok', id: copy.id, updated: idx >= 0 });
    return doc;
  });

  function _slugifyCrafterId(val) {
    return String(val || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || ('crafted_' + Date.now());
  }

  function _stripBoonPrefix(val) {
    return String(val || '')
      .replace(/^\[Homebrew\]\s*/i, '')
      .replace(/^Homebrew:\s*/i, '')
      .trim();
  }

  function _showCrafterToast(msg, tone) {
    try {
      if (typeof root !== 'undefined' && typeof root.showDiceTopToast === 'function') {
        root.showDiceTopToast({
          title: 'Rule Crafter',
          message: String(msg || ''),
          icon: tone === 'reset' ? '↺' : '⚒️'
        });
        return;
      }
      if (typeof root !== 'undefined' && typeof root.showToast === 'function') {
        root.showToast(String(msg || ''));
        return;
      }
      if (typeof document !== 'undefined' && document.body) {
        let el = document.getElementById('crafter-bridge-toast');
        if (!el) {
          el = document.createElement('div');
          el.id = 'crafter-bridge-toast';
          el.setAttribute('style', 'position:fixed;top:16px;right:16px;z-index:10090;padding:10px 14px;border-radius:10px;background:#0f172a;color:#fde68a;border:1px solid rgba(245,158,11,0.55);font-size:12px;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,0.45);pointer-events:none;transition:opacity 0.2s ease;');
          document.body.appendChild(el);
        }
        el.textContent = (tone === 'reset' ? '↺ ' : '⚒️ ') + String(msg || '');
        el.style.opacity = '1';
        clearTimeout(el._hideTimer);
        el._hideTimer = setTimeout(function () {
          if (el) el.style.opacity = '0';
        }, 2800);
      }
    } catch (_) {}
  }

  function _srdTypeForKind(kind) {
    const k = String(kind || '').toLowerCase().trim();
    if (k === 'weapon' || k === 'weapons') return 'Weapon';
    if (k === 'armor' || k === 'shield') return 'Armor';
    if (k === 'item' || k === 'gear' || k === 'wondrous') return 'Magic Item';
    if (k === 'feat' || k === 'boon') return 'Feat';
    if (k === 'classability' || k === 'class_ability' || k === 'classfeature' || k === 'class_feature') return 'ClassAbility';
    if (k === 'spell') return 'Spell';
    if (k === 'maneuver') return 'Maneuver';
    if (k === 'psionic' || k === 'psionics') return 'Power';
    if (k === 'incarnum') return 'Soulmeld';
    if (k === 'pactmagic' || k === 'vestige') return 'Vestige';
    if (k === 'shadowmagic' || k === 'mystery') return 'Mystery';
    if (k === 'truenaming' || k === 'utterance') return 'Utterance';
    if (k === 'class') return 'Class';
    if (k === 'race') return 'Race';
    if (k === 'domain') return 'Domain';
    if (k === 'deity') return 'Deity';
    if (k === 'template' || k === 'templates') return 'Template';
    return undefined;
  }

  const _SOURCE_BOOK_NAMES = {
    'tob': 'Tome of Battle (ToB)',
    'phb2': 'Player\'s Handbook II (PHB2)',
    'phbii': 'Player\'s Handbook II (PHB2)',
    'cad': 'Complete Adventurer (CAdv)',
    'cadv': 'Complete Adventurer (CAdv)',
    'cw': 'Complete Warrior (CW)',
    'cd': 'Complete Divine (CD)',
    'ca': 'Complete Arcane (CArc)',
    'carc': 'Complete Arcane (CArc)',
    'cm': 'Complete Mage (CM)',
    'cs': 'Complete Scoundrel (CS)',
    'cc': 'Complete Champion (CC)',
    'moi': 'Magic of Incarnum (MoI)',
    'tom': 'Tome of Magic (ToM)',
    'xph': 'Expanded Psionics Handbook (XPH)',
    'ua': 'Unearthed Arcana (UA)'
  };

  function _findInSrdCompendium(id, name, kind) {
    const comp = typeof root !== 'undefined' ? root.SrdCompendium : null;
    if (!comp) return null;
    const typeHint = _srdTypeForKind(kind);
    const cleanName = _stripBoonPrefix(name);
    const strippedAbilityName = cleanName
      ? cleanName.replace(/\s*\((?:ex|su|sp|na)\)\s*$/i, '').replace(/\s*\+\d+(?:d\d+)?.*$/i, '').trim()
      : '';
    const parenChoiceMatch = strippedAbilityName
      ? strippedAbilityName.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
      : null;
    const canStripChoiceParen = Boolean(
      parenChoiceMatch &&
      String(typeHint || '').toLowerCase() !== 'class' &&
      !/\b(variant|adventurer|thug|cloistered|acf|urban|martial|wildshape|template)\b/i.test(parenChoiceMatch[2])
    );
    const strippedChoiceBaseName = canStripChoiceParen ? parenChoiceMatch[1].trim() : '';
    const cabSlug = strippedAbilityName
      ? ('cab-' + _slugifyCrafterId(strippedAbilityName).replace(/_/g, '-'))
      : '';

    const tryDirectLookup = function () {
      if (id && typeof comp.getById === 'function') {
        const byId = comp.getById(id);
        if (byId) return byId;
      }
      if (cleanName && typeof comp.getByName === 'function') {
        const byName = typeHint ? comp.getByName(cleanName, typeHint) : null;
        if (byName) return byName;
        const byCab = comp.getByName(cleanName, 'ClassAbility');
        if (byCab) return byCab;
        if (strippedAbilityName && strippedAbilityName !== cleanName) {
          const byStrippedHint = typeHint ? comp.getByName(strippedAbilityName, typeHint) : null;
          if (byStrippedHint) return byStrippedHint;
          const byStrippedCab = comp.getByName(strippedAbilityName, 'ClassAbility');
          if (byStrippedCab) return byStrippedCab;
          const byStrippedAny = comp.getByName(strippedAbilityName);
          if (byStrippedAny) return byStrippedAny;
        }
        if (strippedChoiceBaseName && strippedChoiceBaseName !== cleanName) {
          const byChoiceHint = typeHint ? comp.getByName(strippedChoiceBaseName, typeHint) : null;
          if (byChoiceHint) return byChoiceHint;
          const byChoiceCab = comp.getByName(strippedChoiceBaseName, 'ClassAbility');
          if (byChoiceCab) return byChoiceCab;
          const byChoiceAny = comp.getByName(strippedChoiceBaseName);
          if (byChoiceAny) return byChoiceAny;
        }
        const anyName = comp.getByName(cleanName);
        if (anyName) return anyName;
      }
      if (cabSlug && typeof comp.getById === 'function') {
        const byCabSlug = comp.getById(cabSlug);
        if (byCabSlug) return byCabSlug;
      }
      return null;
    };

    const directHit = tryDirectLookup();
    if (directHit) return directHit;

    if (typeof comp.findIndexEntry === 'function' && typeof comp.ensureChunkLoaded === 'function') {
      const idxHit = (id && comp.findIndexEntry(id))
        || (cabSlug && comp.findIndexEntry(cabSlug))
        || (cleanName && typeHint && comp.findIndexEntry(cleanName, typeHint))
        || (strippedChoiceBaseName && typeHint && comp.findIndexEntry(strippedChoiceBaseName, typeHint))
        || (cleanName && comp.findIndexEntry(cleanName, 'ClassAbility'))
        || (strippedAbilityName && comp.findIndexEntry(strippedAbilityName, 'ClassAbility'))
        || (cleanName && comp.findIndexEntry(cleanName))
        || (strippedAbilityName && comp.findIndexEntry(strippedAbilityName))
        || (strippedChoiceBaseName && comp.findIndexEntry(strippedChoiceBaseName));
      if (idxHit && idxHit.f) {
        comp.ensureChunkLoaded(idxHit.f);
        const lazyHit = tryDirectLookup();
        if (lazyHit) return lazyHit;
      }
    }

    if (cleanName && typeof comp.search === 'function') {
      const hits = comp.search(cleanName, typeHint ? { type: typeHint, limit: 5 } : { limit: 5 });
      if (Array.isArray(hits) && hits.length > 0) {
        const exact = hits.find(function (h) {
          const hn = String((h && h.name) || '').trim().toLowerCase();
          return hn === cleanName.toLowerCase() || (strippedAbilityName && hn === strippedAbilityName.toLowerCase());
        });
        if (exact) return exact;
      }
    }
    return null;
  }

  const _V2_TARGET_ALIASES = {
    'ability.str': 'str', 'ability.dex': 'dex', 'ability.con': 'con', 'ability.int': 'int', 'ability.wis': 'wis', 'ability.cha': 'cha',
    'ac': 'ac.total', 'ac.all': 'ac.total', 'ac.naturalarmor': 'ac.natural',
    'attack': 'atk.all', 'attack.all': 'atk.all', 'attack.weapon': 'atk.all', 'attack.melee': 'atk.melee', 'attack.ranged': 'atk.ranged',
    'damage': 'dmg.all', 'damage.all': 'dmg.all', 'damage.weapon': 'dmg.all', 'damage.melee': 'dmg.melee', 'damage.ranged': 'dmg.all',
    'saves': 'save.all', 'saves.all': 'save.all', 'saves.fort': 'save.fort', 'saves.ref': 'save.ref', 'saves.will': 'save.will',
    'skills': 'skill.all', 'skills.all': 'skill.all', 'skill.knowledge_all': 'skill.knowledge', 'skill.wilderness_lore': 'skill.survival',
    'init': 'initiative', 'speed': 'speed.land', 'speed.all': 'speed.land', 'speed.base': 'speed.land', 'cmb': 'grapple'
  };

  const _V2_BONUS_TYPES = {
    untyped: 'Untyped', dodge: 'Dodge', circumstance: 'Circumstance', penalty: 'Penalty',
    enhancement: 'Enhancement', luck: 'Luck', morale: 'Morale', sacred: 'Sacred', divine: 'Sacred',
    profane: 'Profane', insight: 'Insight', competence: 'Competence', resistance: 'Resistance',
    deflection: 'Deflection', alchemical: 'Alchemical', inherent: 'Inherent',
    armor: 'Armor', armor_enhancement: 'Armor Enhancement', shield: 'Shield', shield_enhancement: 'Shield Enhancement',
    natural: 'Natural Armor', natural_armor: 'Natural Armor', natural_enhancement: 'Natural Armor Enhancement',
    racial: 'Racial', size: 'Size', exalted: 'Exalted', perfection: 'Perfection', haste: 'Untyped', trait: 'Untyped', domain: 'Untyped', cover: 'Circumstance'
  };

  function _stripHtmlText(html) {
    return String(html || '')
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\s*\/p\s*>/gi, '\n\n')
      .replace(/<\s*hr\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  }

  function _normCrafterTarget(raw) {
    const s = String(raw || '').trim();
    if (!s) return 'atk.all';
    const low = s.toLowerCase();
    return _V2_TARGET_ALIASES[low] || s;
  }

  function _normCrafterBonusType(raw) {
    const s = String(raw || '').trim();
    if (!s) return 'Untyped';
    return _V2_BONUS_TYPES[s.toLowerCase()] || (s.charAt(0).toUpperCase() + s.slice(1));
  }

  function _convertV2ModToV3Block(mod) {
    if (!mod || typeof mod !== 'object') return null;
    const target = _normCrafterTarget(mod.target);
    const btype = _normCrafterBonusType(mod.type);
    const condition = mod.condition ? String(mod.condition) : '';
    const fStr = mod.formula !== undefined && mod.formula !== null ? String(mod.formula).trim() : '';
    const hasDynamicFormula = fStr !== '' && isNaN(Number(fStr));
    if (hasDynamicFormula) {
      let m;
      if ((m = fStr.match(/^min\(\s*(\d+)\s*,\s*max\(\s*(\d+)\s*,\s*floor\(\s*@cl\s*\/\s*(\d+)\s*\)\s*(?:\*\s*(\d+))?\s*\)\s*\)$/i))) {
        return { type: 'stat', targets: [target], mode: 'perCL', value: m[4] ? (Number(m[4]) || 1) : 1, per: Number(m[3]) || 1, min: Number(m[2]) || 0, max: Number(m[1]) || 5, btype: btype, condition: condition };
      }
      if ((m = fStr.match(/^(\d+)\s*\+\s*min\(\s*(\d+)\s*,\s*(?:max\(\s*\d+\s*,\s*)?floor\(\s*(?:\(\s*@cl\s*-\s*\d+\s*\)|@cl)\s*\/\s*(\d+)\s*\)\s*\)?\s*\)$/i))) {
        const base = Number(m[1]) || 2, addMax = Number(m[2]) || 3, per = Number(m[3]) || 3;
        return { type: 'stat', targets: [target], mode: 'perCL', value: 1, per: per, min: base, max: base + addMax, btype: btype, condition: condition };
      }
      if ((m = fStr.match(/@(?:abilities\.)?(str|dex|con|int|wis|cha)(?:\.mod|Mod)/i))) {
        return { type: 'stat', targets: [target], mode: 'stat', stat: m[1].toLowerCase() + 'Mod', mult: 1, value: Number(mod.value) || 0, cap: 'none', btype: btype, condition: condition };
      }
    }
    const numVal = Number.isFinite(Number(mod.value)) && Number(mod.value) !== 0
      ? Number(mod.value)
      : (!isNaN(Number(fStr)) && fStr !== '' ? Number(fStr) : 0);
    if (numVal === 0 && !hasDynamicFormula) return null;
    return {
      type: 'stat',
      targets: [target],
      mode: 'flat',
      value: numVal,
      btype: btype,
      condition: condition
    };
  }

  function _convertTempHpToV3Block(formula) {
    const f = String(formula || '').trim();
    if (!f) return null;
    if (!isNaN(Number(f)) && Number(f) > 0) {
      return { type: 'roll', kind: 'Temp HP', count: Number(f), die: 'flat', scaling: 'flat' };
    }
    let m;
    if ((m = f.match(/^(\d+)d(\d+)\s*\+\s*min\(\s*(\d+)\s*,\s*@cl(?:\s*\*\s*(\d+))?\s*\)$/i))) {
      return { type: 'roll', kind: 'Temp HP', count: Number(m[1]) || 1, die: 'd' + m[2], scaling: 'perCL', amount: m[4] ? (Number(m[4]) || 1) : 1, per: 1, start: 1, max: Number(m[3]) || 10 };
    }
    if ((m = f.match(/^min\(\s*(\d+)\s*,\s*@cl(?:\s*\*\s*(\d+))?\s*\)$/i))) {
      return { type: 'roll', kind: 'Temp HP', count: 0, die: 'flat', scaling: 'perCL', amount: m[2] ? (Number(m[2]) || 1) : 1, per: 1, start: 1, max: Number(m[1]) || 20 };
    }
    if ((m = f.match(/^(?:(\d+)\s*\*\s*)?@cl(?:\s*\*\s*(\d+))?$/i))) {
      const amt = m[1] ? (Number(m[1]) || 1) : (m[2] ? (Number(m[2]) || 1) : 1);
      return { type: 'roll', kind: 'Temp HP', count: 0, die: 'flat', scaling: 'perCL', amount: amt, per: 1, start: 1, max: amt * 20 };
    }
    return null;
  }

  function _convertRuleFlagsToV3Blocks(rf) {
    if (!rf || typeof rf !== 'object') return [];
    const out = [];
    const immMap = [
      ['immuneFear', 'Fear'], ['immuneMindAffecting', 'Mind-Affecting'], ['immuneDeathEffects', 'Death Effects'],
      ['immunePoison', 'Poison'], ['immuneDisease', 'Disease'], ['immuneParalysis', 'Paralysis'],
      ['immuneSleep', 'Sleep'], ['immuneNegativeEnergy', 'Negative Energy & Energy Drain'],
      ['immuneMagicMissile', 'Magic Missile'], ['immuneMentalControl', 'Mental Control']
    ];
    immMap.forEach(function (pair) {
      if (rf[pair[0]]) out.push({ type: 'defense', mode: 'Immunity', what: pair[1] });
    });
    if (rf.freedomOfMovement) out.push({ type: 'defense', mode: 'Condition Immunity', what: 'Grapple, Paralysis & Movement Impediments (Freedom of Movement)' });
    if (rf.extraAttackFullAttack) out.push({ type: 'attack', attackMode: 'extra', extraKind: 'extraFull', count: 1, rider: 'Extra attack on Full Attack (Haste)' });
    if (rf.concealment || rf.missChance) out.push({ type: 'defense', mode: 'Concealment %', value: Number(rf.concealment || rf.missChance) || 20 });
    if (rf.dr) {
      const dm = String(rf.dr).match(/^(\d+)\s*\/\s*(.+)$/);
      if (dm) out.push({ type: 'defense', mode: 'DR', value: Number(dm[1]) || 5, what: dm[2].trim() });
    }
    return out;
  }

  function _convertDmgPartToV3Block(part) {
    if (!part || typeof part !== 'object') return null;
    let count = 1;
    let die = 'd6';
    if (part.dice && typeof part.dice === 'string') {
      const m = part.dice.trim().match(/^(\d+)\s*d(\d+)$/i);
      if (m) {
        count = parseInt(m[1], 10) || 1;
        die = 'd' + m[2];
      }
    } else if (part.bonus !== undefined && part.bonus !== null) {
      count = Number(part.bonus) || 0;
      die = 'flat';
    }
    return {
      type: 'roll',
      kind: 'Damage',
      count: count,
      die: die,
      flat: part.dice && part.bonus ? (Number(part.bonus) || 0) : 0,
      dmgType: String(part.type || 'Untyped'),
      critRule: part.onCritOnly ? 'onCritOnly' : (part.multiplyOnCrit ? 'multiply' : 'flat'),
      condition: part.condition ? String(part.condition) : ''
    };
  }

  function _syncCharacterTargetWithV3(doc, v3Copy, originalId, context) {
    if (!doc || !v3Copy) return;
    const ctx = context || {};
    const targetName = String(v3Copy.name || '').trim();
    const matchName = String(ctx.originalName || ctx.name || '').trim().toLowerCase();
    const matchesTarget = function (obj) {
      if (!obj || typeof obj !== 'object') return false;
      if (originalId && (obj.id === originalId || obj.customEntryId === originalId || obj.baseEntryId === originalId)) return true;
      if (v3Copy.id && (obj.id === v3Copy.id || obj.customEntryId === v3Copy.id)) return true;
      if (matchName && String(obj.name || '').trim().toLowerCase() === matchName) return true;
      return false;
    };
    const applyToObj = function (obj) {
      if (!obj || typeof obj !== 'object') return;
      if (targetName) obj.name = targetName;
      obj.customEntryId = v3Copy.id;
      obj.schemaVersion = 3;
      if (v3Copy.text) {
        obj.description = v3Copy.text;
        if ('benefit' in obj) obj.benefit = v3Copy.text;
      }
      if (v3Copy.weapon && typeof v3Copy.weapon === 'object') {
        obj.weapon = CharStore._fastCloneHistoryVal(v3Copy.weapon);
        if (v3Copy.weapon.damageDice) obj.dice = v3Copy.weapon.damageDice;
        if (v3Copy.weapon.dmgType || v3Copy.weapon.damageType) obj.dmgType = v3Copy.weapon.dmgType || v3Copy.weapon.damageType;
        if (v3Copy.weapon.rangeIncrement !== undefined && v3Copy.weapon.rangeIncrement !== null) {
          obj.range = String(v3Copy.weapon.rangeIncrement) + ' ft.';
        }
        if (v3Copy.weapon.effectiveCritRange && v3Copy.weapon.critMultiplier) {
          obj.crit = (v3Copy.weapon.effectiveCritRange < 20 ? (v3Copy.weapon.effectiveCritRange + '-20') : '20') + '/x' + v3Copy.weapon.critMultiplier;
        }
      }
      if (Array.isArray(v3Copy.effects)) {
        obj.effects = CharStore._fastCloneHistoryVal(v3Copy.effects);
      }
      if (v3Copy.armor && typeof v3Copy.armor === 'object') {
        obj.armor = CharStore._fastCloneHistoryVal(v3Copy.armor);
        if (v3Copy.armor.armorBonus !== undefined) obj.armorBonus = v3Copy.armor.armorBonus;
        if (v3Copy.armor.maxDex !== undefined) obj.maxDex = v3Copy.armor.maxDex;
        if (v3Copy.armor.armorCheckPenalty !== undefined) obj.acp = v3Copy.armor.armorCheckPenalty;
        if (v3Copy.armor.arcaneSpellFailure !== undefined) obj.asf = v3Copy.armor.arcaneSpellFailure;
      }
      if (v3Copy.item && typeof v3Copy.item === 'object') {
        obj.item = CharStore._fastCloneHistoryVal(v3Copy.item);
        if (v3Copy.item.price !== undefined) { obj.cost = v3Copy.item.price; obj.gpValue = v3Copy.item.price; }
        if (v3Copy.item.casterLevel !== undefined) obj.casterLevel = v3Copy.item.casterLevel;
      }
      if (v3Copy.spell && typeof v3Copy.spell === 'object') {
        obj.spell = CharStore._fastCloneHistoryVal(v3Copy.spell);
        const sp = v3Copy.spell;
        if (sp.school) obj.school = sp.school;
        if (sp.discipline) obj.discipline = sp.discipline;
        if (sp.level !== undefined) obj.level = sp.level;
        else if (Array.isArray(sp.classLevels) && sp.classLevels[0] && sp.classLevels[0].level !== undefined) obj.level = sp.classLevels[0].level;
        if (sp.ppCost !== undefined) { obj.ppCost = sp.ppCost; obj.powerPointsCost = sp.ppCost; }
        if (Array.isArray(sp.components)) obj.components = sp.components.join(', ');
      }
      if (v3Copy.delivery && typeof v3Copy.delivery === 'object') {
        obj.delivery = CharStore._fastCloneHistoryVal(v3Copy.delivery);
        if (v3Copy.delivery.action) { obj.action = v3Copy.delivery.action; obj.castingTime = v3Copy.delivery.action; }
        if (v3Copy.delivery.range) obj.range = v3Copy.delivery.range;
        if (v3Copy.delivery.area) obj.area = v3Copy.delivery.area;
        if (v3Copy.delivery.spellResistance) obj.sr = v3Copy.delivery.spellResistance;
        if (v3Copy.delivery.save && v3Copy.delivery.save.type) {
          obj.save = v3Copy.delivery.save.type === 'None' ? 'None' : (v3Copy.delivery.save.dc || (v3Copy.delivery.save.type + ' ' + String(v3Copy.delivery.save.effect || '').toLowerCase()).trim());
        }
      }
      if (v3Copy.lifecycle && typeof v3Copy.lifecycle === 'object') {
        obj.lifecycle = CharStore._fastCloneHistoryVal(v3Copy.lifecycle);
        if (v3Copy.lifecycle.durationText) obj.duration = v3Copy.lifecycle.durationText;
      }
      if (v3Copy.prerequisites && typeof v3Copy.prerequisites === 'object' && v3Copy.prerequisites.text) {
        obj.prerequisites = CharStore._fastCloneHistoryVal(v3Copy.prerequisites);
        obj.prereq = v3Copy.prerequisites.text;
      }
    };

    if (doc.bodySlots && typeof doc.bodySlots === 'object') {
      if (ctx.slotKey && doc.bodySlots[ctx.slotKey]) {
        applyToObj(doc.bodySlots[ctx.slotKey]);
      } else {
        Object.values(doc.bodySlots).forEach(function (s) {
          if (matchesTarget(s)) applyToObj(s);
        });
      }
    }
    ['weapons', 'gearPool', 'inventory', 'feats', 'specialAbilities', 'homebrewBoons', 'spells', 'knownSpells', 'preparedSpells', 'maneuvers', 'stances', 'psionics', 'incarnum', 'pactMagic', 'shadowMagic', 'truenaming', 'templates'].forEach(function (arrKey) {
      const list = doc[arrKey];
      if (!Array.isArray(list)) return;
      list.forEach(function (entry) {
        if (matchesTarget(entry)) applyToObj(entry);
      });
    });
    if (ctx.kind === 'weapon' && Array.isArray(doc.weaponSets) && matchName && targetName) {
      doc.weaponSets.forEach(function (ws) {
        if (ws && String(ws.mainWeapon || '').trim().toLowerCase() === matchName) {
          ws.mainWeapon = targetName;
        }
      });
    }
    if (ctx.kind === 'class' && Array.isArray(doc.levelProgression) && typeof ctx.levelIndex === 'number' && doc.levelProgression[ctx.levelIndex]) {
      const row = doc.levelProgression[ctx.levelIndex];
      if (targetName) row.className = targetName;
      row.customEntryId = v3Copy.id;
    }
    if (ctx.kind === 'race' && targetName) {
      doc.race = targetName;
    }
  }

  const _CRAFTER_META_KEYS = {
    _crafterOverride: 1, _snapshot: 1, _srdSnapshot: 1, source: 1, id: 1, baseEntryId: 1, customEntryId: 1,
    createdAt: 1, updatedAt: 1, modifiedAt: 1, _createdAt: 1, _updatedAt: 1, timestamp: 1, ts: 1, origin: 1, schemaVersion: 1
  };
  function _crafterNormalizeForCompare(val) {
    if (Array.isArray(val)) return val.map(_crafterNormalizeForCompare);
    if (val && typeof val === 'object') {
      const out = {};
      Object.keys(val).sort().forEach(function (k) {
        if (_CRAFTER_META_KEYS[k]) return;
        if (val[k] === undefined) return;
        out[k] = _crafterNormalizeForCompare(val[k]);
      });
      return out;
    }
    return val;
  }
  function _crafterEntriesEquivalent(a, b) {
    if (!a || !b) return false;
    try {
      return JSON.stringify(_crafterNormalizeForCompare(a)) === JSON.stringify(_crafterNormalizeForCompare(b));
    } catch (err) {
      return false;
    }
  }

  const StudioBridge = {
    upsertEntry(v3Entry, meta) {
      return CharStore.dispatch({
        type: 'customDb/upsertV3',
        payload: { entry: v3Entry },
        meta: Object.assign({ label: 'Save Studio Entry: ' + ((v3Entry && v3Entry.name) || 'V3 Entry') }, meta || {})
      });
    },
    getCustomDb() {
      const doc = CharStore.getDoc();
      return (doc && Array.isArray(doc.customDb)) ? doc.customDb : [];
    },
    resolveEntity(spec) {
      const q = typeof spec === 'string' ? { name: spec } : (spec || {});
      const doc = CharStore.getDoc() || (typeof root !== 'undefined' ? root.character : null) || {};
      const kind = String(q.kind || '').toLowerCase().trim();
      const rawName = String(q.name || '').trim();
      const cleanName = _stripBoonPrefix(rawName);
      const nameLower = cleanName.toLowerCase();
      const idQuery = q.id ? String(q.id).trim() : '';

      const matchesItem = function (item) {
        if (!item) return false;
        if (typeof item === 'string') {
          return nameLower && _stripBoonPrefix(item).toLowerCase() === nameLower;
        }
        if (idQuery && (item.id === idQuery || item.customEntryId === idQuery || item.baseEntryId === idQuery || item.baseItemId === idQuery)) return true;
        if (nameLower && item.name && _stripBoonPrefix(item.name).toLowerCase() === nameLower) return true;
        return false;
      };

      let overrideEntry = null;
      let resolvedId = idQuery || '';
      let sourceLocation = null;

      // 1. Character-local Copy-on-Write dictionary: character.customEntries?.[id]
      if (doc.customEntries && typeof doc.customEntries === 'object' && !Array.isArray(doc.customEntries)) {
        if (idQuery && doc.customEntries[idQuery]) {
          overrideEntry = doc.customEntries[idQuery];
          resolvedId = idQuery;
          sourceLocation = 'customEntries';
        } else {
          const keys = Object.keys(doc.customEntries);
          for (let i = 0; i < keys.length; i++) {
            const candidate = doc.customEntries[keys[i]];
            if (matchesItem(candidate)) {
              overrideEntry = candidate;
              resolvedId = candidate.id || keys[i];
              sourceLocation = 'customEntries';
              break;
            }
          }
        }
      }

      // 2. Character's own arrays / fields
      let charItem = null;
      const tryList = function (arr, locName) {
        if (charItem || !Array.isArray(arr)) return;
        if (typeof q.index === 'number' && arr[q.index] && (kind === locName || !nameLower || matchesItem(arr[q.index]))) {
          charItem = arr[q.index];
          sourceLocation = sourceLocation || locName;
          return;
        }
        for (let i = 0; i < arr.length; i++) {
          if (matchesItem(arr[i])) {
            charItem = arr[i];
            sourceLocation = sourceLocation || locName;
            return;
          }
        }
      };

      if (q.slotKey && doc.bodySlots && doc.bodySlots[q.slotKey]) {
        charItem = doc.bodySlots[q.slotKey];
        sourceLocation = sourceLocation || 'bodySlots';
      }
      if (!charItem && kind === 'class' && Array.isArray(doc.levelProgression)) {
        const lp = (typeof q.levelIndex === 'number' && doc.levelProgression[q.levelIndex]) ? doc.levelProgression[q.levelIndex] : doc.levelProgression.find(function (r) {
          return r && nameLower && String(r.className || '').trim().toLowerCase() === nameLower;
        });
        if (lp && lp.customEntryId && !resolvedId) {
          resolvedId = lp.customEntryId;
        }
        sourceLocation = sourceLocation || 'levelProgression';
      }
      if (!charItem && kind === 'race' && (doc.race || cleanName)) {
        sourceLocation = sourceLocation || 'race';
      }
      if (!charItem && kind === 'domain') {
        sourceLocation = sourceLocation || 'domains';
      }
      if (!charItem && kind === 'boon' && Array.isArray(doc.levelProgression) && typeof q.levelIndex === 'number' && doc.levelProgression[q.levelIndex]) {
        const lp = doc.levelProgression[q.levelIndex];
        const bonuses = [].concat(Array.isArray(lp.otherBonuses) ? lp.otherBonuses : [], Array.isArray(lp.bonusFeats) ? lp.bonusFeats : [], Array.isArray(lp.specials) ? lp.specials : []);
        const hit = bonuses.find(function (b) { return matchesItem(b); });
        if (hit) {
          charItem = typeof hit === 'string'
            ? { id: 'boon_' + _slugifyCrafterId(cleanName), name: cleanName, type: 'Homebrew', benefit: hit, source: 'Homebrew' }
            : hit;
          sourceLocation = sourceLocation || 'levelProgression';
        }
      }
      if (!charItem && doc.bodySlots && typeof doc.bodySlots === 'object') {
        const slots = Object.values(doc.bodySlots);
        for (let i = 0; i < slots.length; i++) {
          if (matchesItem(slots[i])) {
            charItem = slots[i];
            sourceLocation = sourceLocation || 'bodySlots';
            break;
          }
        }
      }
      tryList(doc.weapons, 'weapons');
      tryList(doc.gearPool, 'gearPool');
      tryList(doc.inventory, 'inventory');
      tryList(doc.feats, 'feats');
      tryList(doc.specialAbilities, 'specialAbilities');
      tryList(doc.homebrewBoons, 'homebrewBoons');
      tryList(doc.spells, 'spells');
      tryList(doc.knownSpells, 'knownSpells');
      tryList(doc.preparedSpells, 'preparedSpells');
      tryList(doc.maneuvers, 'maneuvers');
      tryList(doc.stances, 'stances');
      tryList(doc.psionics, 'psionics');
      tryList(doc.incarnum, 'incarnum');
      tryList(doc.pactMagic, 'pactMagic');
      tryList(doc.shadowMagic, 'shadowMagic');
      tryList(doc.truenaming, 'truenaming');
      tryList(doc.templates, 'templates');

      if (typeof charItem === 'string') {
        const cleanItemStr = _stripBoonPrefix(charItem);
        const pm = cleanItemStr.replace(/\s*\((?:ex|su|sp|na)\)\s*$/i, '').match(/^(.+?)\s*\(([^)]+)\)\s*$/);
        charItem = {
          id: resolvedId || null,
          name: cleanItemStr,
          choice: pm && pm[2] ? pm[2].trim() : undefined,
          type: _srdTypeForKind(kind) || 'Feature'
        };
      }

      // 3. masterDb (character customDb / campaign DB)
      let masterEntry = null;
      const dbList = (typeof root !== 'undefined' && Array.isArray(root.masterDb))
        ? root.masterDb
        : (Array.isArray(doc.customDb) ? doc.customDb : []);
      for (let i = 0; i < dbList.length; i++) {
        if (matchesItem(dbList[i])) {
          masterEntry = dbList[i];
          break;
        }
      }

      // 4. Official SrdCompendium
      const srdEntry = _findInSrdCompendium(
        idQuery || (charItem && (charItem.baseEntryId || charItem.baseItemId || charItem.id)) || (overrideEntry && (overrideEntry.baseEntryId || overrideEntry.id)),
        cleanName || (charItem && charItem.name) || (masterEntry && masterEntry.name) || (overrideEntry && overrideEntry.name),
        kind
      );

      // 4.5. Fallback search in active/all Classes' `features` map for Class Features (`cab-*`)
      let classFeatureEntry = null;
      if (!srdEntry && (cleanName || idQuery)) {
        const comp = typeof root !== 'undefined' ? root.SrdCompendium : null;
        const re = typeof root !== 'undefined' ? root.RuleEngine : null;
        const normAbilityKey = function (s) {
          return String(s || '')
            .toLowerCase()
            .replace(/\s*\((?:ex|su|sp|na)\)\s*/gi, ' ')
            .replace(/\s*\+\d+(?:d\d+)?.*$/i, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
        };
        const targetNorm = normAbilityKey(cleanName || (charItem && charItem.name) || '');
        const candidateClasses = [];
        const seenClsNames = new Set();
        const pushCls = function (clsObj) {
          if (!clsObj || typeof clsObj !== 'object') return;
          const k = String(clsObj.id || clsObj.name || '').toLowerCase().trim();
          if (k && !seenClsNames.has(k)) {
            seenClsNames.add(k);
            candidateClasses.push(clsObj);
          }
        };
        if (Array.isArray(doc.levelProgression) && re && typeof re.getClassDef === 'function') {
          doc.levelProgression.forEach(function (row) {
            if (row && (row.className || row.class)) {
              pushCls(re.getClassDef(row.className || row.class, doc));
            }
          });
        }
        if (comp && typeof comp.getAllClasses === 'function') {
          if (typeof comp.ensureChunkLoaded === 'function') {
            comp.ensureChunkLoaded('srd_classes_splat.json');
          }
          const allCls = comp.getAllClasses() || [];
          allCls.forEach(pushCls);
        }
        for (let ci = 0; ci < candidateClasses.length && !classFeatureEntry; ci++) {
          const cls = candidateClasses[ci];
          let levelEntries = [];
          if (cls && cls.progression && Array.isArray(cls.progression.levels)) {
            levelEntries = cls.progression.levels.map(function (lv) { return { lvl: lv.level, list: Array.isArray(lv.features) ? lv.features : [] }; });
          } else if (cls && cls.features && typeof cls.features === 'object') {
            levelEntries = Object.keys(cls.features).map(function (k) { return { lvl: k, list: Array.isArray(cls.features[k]) ? cls.features[k] : [] }; });
          }
          for (let li = 0; li < levelEntries.length && !classFeatureEntry; li++) {
            const lvl = levelEntries[li].lvl;
            const fArr = levelEntries[li].list;
            for (let fi = 0; fi < fArr.length; fi++) {
              const f = fArr[fi];
              if (!f) continue;
              const fObj = typeof f === 'string' ? { name: f } : f;
              const fId = String(fObj.refId || fObj.id || '').trim();
              const fName = String(fObj.name || '').trim();
              const isMatch = (idQuery && fId && fId.toLowerCase() === idQuery.toLowerCase()) ||
                (cleanName && fName.toLowerCase() === cleanName.toLowerCase()) ||
                (targetNorm && normAbilityKey(fName) === targetNorm);
              if (isMatch) {
                const linkedCab = (fId && comp && typeof comp.getById === 'function') ? comp.getById(fId) : null;
                const slug = _slugifyCrafterId(fName.replace(/\s*\((?:ex|su|sp|na)\)\s*$/i, '')).replace(/_/g, '-');
                const rawSrc = String((linkedCab && linkedCab.source) || cls.source || 'PHB').trim();
                const expandedSrc = _SOURCE_BOOK_NAMES[rawSrc.toLowerCase()] || rawSrc;
                const summaryText = (linkedCab && (linkedCab.shortDescription || linkedCab.text || linkedCab.benefit || linkedCab.description)) || fObj.text || fObj.summary || fObj.benefit || fObj.description || '';
                classFeatureEntry = Object.assign({}, linkedCab || {}, {
                  id: (linkedCab && linkedCab.id) || fId || ('cab-' + slug),
                  name: (linkedCab && linkedCab.name) || fName,
                  type: 'ClassAbility',
                  blueprint: 'feat',
                  featKind: 'classAbility',
                  abilityType: String((linkedCab && linkedCab.abilityType) || fObj.abilityType || fObj.type || 'Ex').toLowerCase(),
                  source: expandedSrc + ' (' + (cls.name || 'Class') + ' Level ' + lvl + ')',
                  shortDescription: summaryText,
                  text: summaryText,
                  effects: (linkedCab && Array.isArray(linkedCab.effects) && linkedCab.effects.length > 0)
                    ? linkedCab.effects
                    : (Array.isArray(fObj.effects) ? fObj.effects : [])
                });
                break;
              }
            }
          }
        }
      }

      if (!overrideEntry && doc.customEntries && typeof doc.customEntries === 'object' && !Array.isArray(doc.customEntries)) {
        const lookupId = (charItem && (charItem.customEntryId || charItem.id || charItem.baseItemId)) || (srdEntry && srdEntry.id) || (classFeatureEntry && classFeatureEntry.id) || '';
        if (lookupId && doc.customEntries[lookupId]) {
          overrideEntry = doc.customEntries[lookupId];
          resolvedId = overrideEntry.id || lookupId;
          sourceLocation = 'customEntries';
        }
      }

      let entry = null;
      if (overrideEntry) {
        entry = CharStore._fastCloneHistoryVal(overrideEntry);
      } else if (charItem && typeof charItem === 'object') {
        const baseObj = srdEntry || masterEntry || classFeatureEntry;
        if (baseObj) {
          const clonedBase = CharStore._fastCloneHistoryVal(baseObj);
          const clonedChar = CharStore._fastCloneHistoryVal(charItem);
          entry = Object.assign({}, clonedBase, clonedChar);
          if ((!Array.isArray(clonedChar.effects) || clonedChar.effects.length === 0) && Array.isArray(clonedBase.effects) && clonedBase.effects.length > 0) {
            entry.effects = clonedBase.effects;
          }
          if ((!clonedChar.source || clonedChar.source === 'Custom') && clonedBase.source) {
            entry.source = clonedBase.source;
          }
          if (!clonedChar.id && clonedBase.id) {
            entry.id = clonedBase.id;
          }
        } else {
          entry = CharStore._fastCloneHistoryVal(charItem);
        }
        sourceLocation = sourceLocation || 'character';
      } else if (masterEntry) {
        entry = CharStore._fastCloneHistoryVal(masterEntry);
        sourceLocation = 'masterDb';
      } else if (srdEntry) {
        entry = CharStore._fastCloneHistoryVal(srdEntry);
        sourceLocation = 'srd';
      } else if (classFeatureEntry) {
        entry = CharStore._fastCloneHistoryVal(classFeatureEntry);
        sourceLocation = 'srd';
      } else if (cleanName) {
        entry = {
          id: resolvedId || ((kind || 'entry') + '_' + _slugifyCrafterId(cleanName)),
          name: cleanName,
          type: _srdTypeForKind(kind) || 'Feature',
          source: kind === 'boon' ? 'Homebrew' : 'Custom'
        };
        sourceLocation = 'synthetic';
      }

      if (entry && (entry.type === 'ClassAbility' || String(entry.id || '').startsWith('cab-'))) {
        if (!entry.blueprint) entry.blueprint = 'feat';
        if (!entry.featKind) entry.featKind = 'classAbility';
        const rawEntrySrc = String(entry.source || '').trim().toLowerCase();
        if (_SOURCE_BOOK_NAMES[rawEntrySrc]) {
          entry.source = _SOURCE_BOOK_NAMES[rawEntrySrc];
        }
      }

      if (entry && !resolvedId) {
        resolvedId = entry.id || entry.baseEntryId || ((kind || 'entry') + '_' + _slugifyCrafterId(entry.name || cleanName));
        if (!entry.id) entry.id = resolvedId;
      }

      const effSrdBase = srdEntry || classFeatureEntry || null;
      const hasCustomLayer = Boolean(overrideEntry || (entry && entry.schemaVersion === 3 && entry._crafterOverride));
      let customKind = null;
      if (hasCustomLayer) {
        if (!effSrdBase) customKind = 'homebrew';
        else customKind = _crafterEntriesEquivalent(entry, effSrdBase) ? 'snapshot' : 'override';
      }
      return {
        entry: entry,
        resolvedId: resolvedId || null,
        kind: kind || null,
        sourceLocation: sourceLocation,
        customKind: customKind,
        isCustomOverride: customKind === 'override' || customKind === 'homebrew',
        hasSrdBase: Boolean(effSrdBase),
        srdBaseEntry: effSrdBase ? CharStore._fastCloneHistoryVal(effSrdBase) : null
      };
    },
    toV3CrafterDraft(entry, kind) {
      if (!entry || typeof entry !== 'object') {
        const k = String(kind || 'feat').toLowerCase().trim();
        return {
          schemaVersion: 3,
          blueprint: k === 'weapon' ? 'weapon' : (k === 'armor' || k === 'shield' ? 'armor' : (k === 'spell' || k === 'maneuver' ? 'spell' : (k === 'class' ? 'class' : (k === 'race' || k === 'template' ? 'race' : (k === 'monster' || k === 'companion' ? 'monster' : 'feat'))))),
          id: 'crafted_' + Date.now(),
          name: 'New Crafted Rule',
          source: 'Homebrew',
          text: '',
          effects: []
        };
      }
      if (entry.schemaVersion === 3) {
        const cloned = CharStore._fastCloneHistoryVal(entry);
        if (!cloned.baseEntryId && (entry.baseItemId || entry.id)) {
          cloned.baseEntryId = entry.baseEntryId || entry.baseItemId || entry.id;
        }
        if (!cloned.origin && entry.id && !entry._crafterOverride) {
          cloned.origin = {
            mode: 'override',
            srdId: entry.id,
            srdName: entry.name || '',
            srdType: entry.type || kind || ''
          };
        }
        return cloned;
      }
      const k = String(kind || entry.type || entry.category || 'feat').toLowerCase().trim();
      const entryTypeLow = String(entry.type || '').toLowerCase().trim();
      const hasRealSlot = Boolean(entry.slot && String(entry.slot).toLowerCase() !== 'none');
      const isSpellLike = Boolean(
        entry.learnedAt
        || ['spell', 'power', 'maneuver', 'invocation', 'soulmeld', 'vestige', 'mystery', 'utterance'].includes(entryTypeLow)
        || k.includes('spell') || k.includes('maneuver') || k.includes('psionic') || k.includes('power')
        || k.includes('incarnum') || k.includes('soulmeld') || k.includes('pact') || k.includes('vestige')
        || k.includes('shadow') || k.includes('mystery') || k.includes('truename') || k.includes('utterance') || k.includes('invocation')
      );
      let blueprint = 'feat';
      if (isSpellLike) blueprint = 'spell';
      else if (k.includes('monster') || k.includes('companion') || entryTypeLow === 'monster' || entry.monster) blueprint = 'monster';
      else if (k.includes('weapon') || entryTypeLow === 'weapon' || entry.weapon || (entry.damage && entry.crit)) blueprint = 'weapon';
      else if (k.includes('armor') || k.includes('shield') || entryTypeLow === 'armor' || entryTypeLow === 'shield' || (entry.armor && entry.armor.armorBonus !== undefined) || entry.armorBonus !== undefined) blueprint = 'armor';
      else if (k.includes('item') || k.includes('wondrous') || k.includes('ring') || k.includes('rod') || k.includes('staff') || k.includes('wand') || entryTypeLow === 'magicitem' || entryTypeLow === 'consumable' || hasRealSlot || entry.gpValue !== undefined || entry.cost !== undefined) blueprint = 'wondrous';
      else if (k.includes('race') || k.includes('template') || entryTypeLow === 'race' || entryTypeLow === 'template') blueprint = 'race';
      else if (k.includes('class') || entryTypeLow === 'class') blueprint = 'class';
      else if (k.includes('buff')) blueprint = 'buff';

      const effects = [];
      if (Array.isArray(entry.effects)) {
        entry.effects.forEach(function (ef) {
          if (ef) effects.push(CharStore._fastCloneHistoryVal(ef));
        });
      }
      _convertRuleFlagsToV3Blocks(entry.ruleFlags).forEach(function (fb) { effects.push(fb); });
      const thpBlk = _convertTempHpToV3Block(entry.tempHpFormula);
      if (thpBlk) effects.push(thpBlk);

      const schoolLow = String(entry.school || entry.category || '').toLowerCase().trim();
      const srdTypeLabel = entry.type || (blueprint.charAt(0).toUpperCase() + blueprint.slice(1));
      const out = {
        schemaVersion: 3,
        blueprint: blueprint,
        id: entry.id || ('crafted_' + _slugifyCrafterId(entry.name)),
        baseEntryId: entry.baseEntryId || entry.baseItemId || entry.id || null,
        origin: entry.id ? { mode: 'override', srdId: entry.id, srdName: entry.name || '', srdType: srdTypeLabel } : { mode: 'new', srdId: '', srdName: '', srdType: '' },
        name: entry.name || 'Crafted Entry',
        source: entry.source || 'Official SRD',
        tags: Array.isArray(entry.tags) ? entry.tags.filter(function (tg) {
          const tl = String(tg || '').toLowerCase();
          return tl !== 'spell' && !(blueprint === 'spell' && schoolLow && tl === schoolLow);
        }) : [],
        text: _stripHtmlText(entry.benefit || entry.description || entry.text || entry.summary || entry.shortDescription || ''),
        effects: effects
      };

      if (entry.prereq || entry.prerequisites) {
        out.prerequisites = typeof entry.prerequisites === 'object' && !Array.isArray(entry.prerequisites)
          ? CharStore._fastCloneHistoryVal(entry.prerequisites)
          : { all: [], text: String(entry.prereq || entry.prerequisites || '') };
      }

      if (blueprint === 'weapon' || blueprint === 'armor' || blueprint === 'wondrous') {
        if (entry.baseItemId) out.baseItemId = entry.baseItemId;
        if (entry.material) out.material = entry.material;
        if (entry.enhancementBonus !== undefined) out.enhancementBonus = Number(entry.enhancementBonus) || 0;
        if (Array.isArray(entry.enhancements)) out.enhancements = entry.enhancements.slice();
        if (blueprint === 'weapon') {
          out.weapon = {
            category: entry.category || (entry.weapon && entry.weapon.category) || 'Martial',
            handedness: entry.handedness || (entry.weapon && entry.weapon.handedness) || 'One-Handed',
            damageDice: (entry.weapon && entry.weapon.damageDice) || entry.dice || '1d8',
            dmgType: (entry.weapon && (entry.weapon.dmgType || entry.weapon.damageType)) || entry.dmgType || 'Slashing',
            baseCritRange: (entry.weapon && entry.weapon.baseCritRange) || entry.critRange || 20,
            critMultiplier: (entry.weapon && entry.weapon.critMultiplier) || entry.critMult || 2,
            rangeIncrement: entry.range ? (parseInt(String(entry.range), 10) || null) : ((entry.weapon && entry.weapon.rangeIncrement) || entry.rangeIncrement || null)
          };
        } else if (blueprint === 'armor') {
          out.armor = {
            armorType: (entry.armor && entry.armor.armorType) || entry.armorType || entry.category || 'Light',
            armorBonus: Number((entry.armor && entry.armor.armorBonus) ?? entry.armorBonus) || 0,
            maxDex: (entry.armor && entry.armor.maxDex !== undefined) ? entry.armor.maxDex : (entry.maxDex !== undefined ? entry.maxDex : null),
            armorCheckPenalty: Number((entry.armor && entry.armor.armorCheckPenalty !== undefined) ? entry.armor.armorCheckPenalty : (entry.acp !== undefined ? entry.acp : (entry.checkPenalty !== undefined ? entry.checkPenalty : entry.armorCheckPenalty))) || 0,
            arcaneSpellFailure: Number((entry.armor && entry.armor.arcaneSpellFailure !== undefined) ? entry.armor.arcaneSpellFailure : (entry.asf !== undefined ? entry.asf : (entry.spellFailure !== undefined ? entry.spellFailure : entry.arcaneSpellFailure))) || 0
          };
        } else {
          out.item = {
            subtype: entry.subtype || 'Wondrous Item',
            slot: (entry.slot && entry.slot !== 'None') ? entry.slot : 'Slotless',
            price: Number(entry.price !== undefined ? entry.price : (entry.cost !== undefined ? entry.cost : entry.gpValue)) || 0,
            cl: Number(entry.cl !== undefined ? entry.cl : entry.casterLevel) || 1
          };
        }
      } else if (blueprint === 'spell') {
        let sys = 'spell';
        if (k.includes('maneuver') || entryTypeLow === 'maneuver') sys = 'maneuver';
        else if (k.includes('psionic') || k.includes('power') || entryTypeLow === 'power') sys = 'psionic';
        else if (k.includes('incarnum') || k.includes('soulmeld') || entryTypeLow === 'soulmeld') sys = 'soulmeld';
        else if (k.includes('pact') || k.includes('vestige') || entryTypeLow === 'vestige') sys = 'vestige';
        else if (k.includes('shadow') || k.includes('mystery') || entryTypeLow === 'mystery') sys = 'mystery';
        else if (k.includes('truename') || k.includes('utterance') || entryTypeLow === 'utterance') sys = 'utterance';
        else if (k.includes('invocation') || entryTypeLow === 'invocation') sys = 'invocation';

        const classAbbr = { Wizard: 'Sor/Wiz', Sorcerer: 'Sor/Wiz', Cleric: 'Clr', Druid: 'Drd', Bard: 'Brd', Paladin: 'Pal', Ranger: 'Rgr' };
        const classLevels = [];
        const seenCls = {};
        if (entry.learnedAt && entry.learnedAt.class) {
          Object.keys(entry.learnedAt.class).forEach(function (clsKey) {
            const abbr = classAbbr[clsKey] || clsKey;
            if (seenCls[abbr] === undefined) {
              seenCls[abbr] = entry.learnedAt.class[clsKey];
              classLevels.push({ class: abbr, level: Number(entry.learnedAt.class[clsKey]) || 1 });
            }
          });
        }
        if (entry.learnedAt && entry.learnedAt.domain) {
          Object.keys(entry.learnedAt.domain).forEach(function (domKey) {
            classLevels.push({ class: domKey, level: Number(entry.learnedAt.domain[domKey]) || 1 });
          });
        }
        if (!classLevels.length) {
          classLevels.push({ class: 'Sor/Wiz', level: entry.level !== undefined ? Number(entry.level) : 1 });
        }
        const rawDescs = Array.isArray(entry.descriptors)
          ? entry.descriptors
          : String(entry.descriptors || '').split(/,\s*|\s+or\s+/).map(function (d) { return d.trim(); }).filter(Boolean);
        const normDescs = rawDescs.map(function (d) {
          return d.split('-').map(function (p) { return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p; }).join('-');
        });
        out.spell = {
          system: sys,
          school: entry.school || entry.category || 'Universal',
          discipline: entry.discipline || '',
          classLevels: classLevels,
          components: Array.isArray(entry.components) ? entry.components.slice() : ['V', 'S'],
          descriptors: normDescs,
          level: entry.level !== undefined ? Number(entry.level) : 1,
          ppCost: entry.ppCost !== undefined ? Number(entry.ppCost) : (entry.powerPointsCost !== undefined && entry.powerPointsCost !== null ? Number(entry.powerPointsCost) : undefined)
        };
        const actionMap = { standard: 'Standard', free: 'Free', swift: 'Swift', immediate: 'Immediate', full: 'Full-Round', move: 'Move', '1': 'Full-Round' };
        const rangeMap = { close: 'Close (25 ft. + 5 ft./2 levels)', medium: 'Medium (100 ft. + 10 ft./level)', long: 'Long (400 ft. + 40 ft./level)', touch: 'Touch', personal: 'Personal', unlimited: 'Unlimited' };
        const rawAction = String(entry.castingTime || entry.initiationAction || 'standard').toLowerCase().split(/[\s-]/)[0];
        const rawRange = String(entry.range || '').trim();
        const saveRaw = String(entry.save || entry.savingThrow || '').trim();
        const srRaw = entry.sr === true ? (/harmless/i.test(saveRaw) ? 'Yes (harmless)' : 'Yes') : (entry.sr === false ? 'No' : (entry.spellResistance || 'Yes'));
        out.delivery = {
          action: actionMap[rawAction] || 'Standard',
          range: rangeMap[rawRange.toLowerCase()] || rawRange || null,
          area: entry.area || entry.target || null,
          spellResistance: srRaw
        };
        if (saveRaw && !/^none/i.test(saveRaw)) {
          const svTypeM = saveRaw.match(/Fortitude|Reflex|Will/i);
          const svType = svTypeM ? (svTypeM[0].charAt(0).toUpperCase() + svTypeM[0].slice(1).toLowerCase()) : 'Will';
          const svEff = /half/i.test(saveRaw) ? 'Half' : (/partial/i.test(saveRaw) ? 'Partial' : (/harmless/i.test(saveRaw) ? 'Negates (harmless)' : (/disbelief/i.test(saveRaw) ? 'Disbelief' : 'Negates')));
          out.delivery.save = { type: svType, effect: svEff };
        }
        const durStr = String(entry.duration || '').trim();
        const dismissible = /\(\s*D\s*\)/i.test(durStr);
        const cleanDur = durStr.replace(/\s*\(\s*D\s*\)\s*/gi, '').trim();
        let durCode = 'instant';
        if (!cleanDur || /instant/i.test(cleanDur)) durCode = 'instant';
        else if (/permanent/i.test(cleanDur)) durCode = 'permanent';
        else if (/10 min\.?\s*\/\s*level/i.test(cleanDur)) durCode = 'tenMinPerLevel';
        else if (/rounds?\s*\/\s*level/i.test(cleanDur)) durCode = 'roundsPerLevel';
        else if (/min(ute)?s?\.?\s*\/\s*level/i.test(cleanDur)) durCode = 'minPerLevel';
        else if (/hours?\s*\/\s*level/i.test(cleanDur)) durCode = 'hourPerLevel';
        else durCode = 'text';
        out.lifecycle = {
          usage: sys === 'spell' ? { mode: 'spellSlot', slotLevel: classLevels[0] ? classLevels[0].level : (Number(entry.level) || 1) } : { mode: 'atwill' },
          duration: durCode,
          durationText: cleanDur || 'Instantaneous',
          dismissible: dismissible
        };
      } else if (blueprint === 'race') {
        out.race = {
          kind: k.includes('template') ? 'template' : 'race',
          size: entry.size || 'Medium',
          creatureType: entry.creatureType || 'Humanoid',
          speed: Number(entry.speed) || 30,
          levelAdjustment: Number(entry.levelAdjustment !== undefined ? entry.levelAdjustment : entry.la) || 0
        };
      }
      return out;
    },
    saveFromCrafter(v3Entry, opts) {
      const options = opts || {};
      const saveScope = options.saveScope === 'campaign' ? 'campaign' : 'character';
      const originalId = options.originalId || null;
      const context = options.context || {};
      if (!v3Entry || typeof v3Entry !== 'object' || !v3Entry.name) {
        return { ok: false, reason: 'invalid_entry' };
      }
      const copy = CharStore._fastCloneHistoryVal(v3Entry);
      copy.schemaVersion = 3;
      const targetId = copy.id || originalId || ('crafted_' + _slugifyCrafterId(copy.name));
      copy.id = targetId;
      if (originalId && !copy.baseEntryId) {
        copy.baseEntryId = originalId;
      }

      if (saveScope === 'character') {
        const doc = CharStore.getDoc();
        if (!doc) return { ok: false, reason: 'no_character' };
        const srdBaseForSave = _findInSrdCompendium(originalId || targetId, '', '');
        if (srdBaseForSave && _crafterEntriesEquivalent(copy, srdBaseForSave)) {
          // Identical to the official SRD entry: store nothing (drop any stale override).
          StudioBridge.resetCustomEntry(originalId || targetId, { silent: true });
          if (originalId && originalId !== targetId) StudioBridge.resetCustomEntry(targetId, { silent: true });
          return { ok: true, saveScope: 'character', id: targetId, entry: srdBaseForSave, unchanged: true };
        }
        copy._crafterOverride = true;
        if (!doc.customEntries || typeof doc.customEntries !== 'object' || Array.isArray(doc.customEntries)) {
          doc.customEntries = {};
        }
        doc.customEntries[targetId] = copy;
        if (originalId && originalId !== targetId) {
          doc.customEntries[originalId] = copy;
        }
        _syncCharacterTargetWithV3(doc, copy, originalId, context);
        StudioBridge.upsertEntry(copy, { label: 'Apply Crafted Rules: ' + copy.name, persist: false });
        if (typeof root !== 'undefined') {
          if (root.RuleEngine && root.RuleEngine.DND35_CLASS_DEFS) root.RuleEngine.DND35_CLASS_DEFS = {};
          root._customClassCacheVer = (root._customClassCacheVer || 0) + 1;
          if ((copy.blueprint === 'class' || copy.type === 'Class') && typeof root.syncCustomClassesToRuleEngine === 'function') {
            root.syncCustomClassesToRuleEngine();
          }
          if ((copy.blueprint === 'domain' || copy.type === 'Domain') && typeof root.syncClericDomainsToCharacterSpecialAbilities === 'function') {
            root.syncClericDomainsToCharacterSpecialAbilities();
          }
        }
        CharStore.recompute('crafter');
        if (typeof root !== 'undefined' && typeof root.saveStateToStorage === 'function') {
          root.saveStateToStorage(true);
        }
        if (typeof root !== 'undefined' && typeof root.renderAll === 'function') {
          root.renderAll();
        }
        _showCrafterToast('Applied Crafted Rules to Character');
        return { ok: true, saveScope: 'character', id: targetId, entry: copy };
      }

      // saveScope === 'campaign'
      if (typeof root !== 'undefined' && Array.isArray(root.masterDb)) {
        const idx = root.masterDb.findIndex(function (e) { return e && e.id === targetId; });
        if (idx >= 0) root.masterDb[idx] = copy;
        else root.masterDb.unshift(copy);
      }
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem('dnd35_custom_db');
          const parsed = raw ? JSON.parse(raw) : [];
          const list = Array.isArray(parsed) ? parsed : [];
          const exIdx = list.findIndex(function (e) { return e && (e.id === targetId || (originalId && e.id === originalId)); });
          if (exIdx >= 0) list[exIdx] = copy;
          else list.unshift(copy);
          localStorage.setItem('dnd35_custom_db', JSON.stringify(list));
        } catch (err) {
          console.warn('StudioBridge campaign library storage error:', err);
        }
      }
      const doc = CharStore.getDoc();
      if (doc) {
        StudioBridge.upsertEntry(copy, { label: 'Campaign Rule Crafter: ' + copy.name, persist: false });
        if (typeof root !== 'undefined') {
          if (root.RuleEngine && root.RuleEngine.DND35_CLASS_DEFS) root.RuleEngine.DND35_CLASS_DEFS = {};
          root._customClassCacheVer = (root._customClassCacheVer || 0) + 1;
          if ((copy.blueprint === 'class' || copy.type === 'Class') && typeof root.syncCustomClassesToRuleEngine === 'function') {
            root.syncCustomClassesToRuleEngine();
          }
          if ((copy.blueprint === 'domain' || copy.type === 'Domain') && typeof root.syncClericDomainsToCharacterSpecialAbilities === 'function') {
            root.syncClericDomainsToCharacterSpecialAbilities();
          }
        }
        CharStore.recompute('crafter');
        if (typeof root !== 'undefined' && typeof root.saveStateToStorage === 'function') {
          root.saveStateToStorage(true);
        }
        if (typeof root !== 'undefined' && typeof root.renderAll === 'function') {
          root.renderAll();
        }
      }
      _showCrafterToast('Saved to Campaign Rule Crafter Library');
      return { ok: true, saveScope: 'campaign', id: targetId, entry: copy };
    },
    resetCustomEntry(id, opts) {
      const resetOpts = opts || {};
      const targetId = String(id || '').trim();
      const doc = CharStore.getDoc();
      if (!doc || !targetId) return false;
      let removed = false;
      if (doc.customEntries && typeof doc.customEntries === 'object') {
        if (doc.customEntries[targetId]) {
          delete doc.customEntries[targetId];
          removed = true;
        }
        Object.keys(doc.customEntries).forEach(function (k) {
          const val = doc.customEntries[k];
          if (val && (val.id === targetId || val.baseEntryId === targetId)) {
            delete doc.customEntries[k];
            removed = true;
          }
        });
      }
      if (Array.isArray(doc.customDb)) {
        const nextDb = doc.customDb.filter(function (e) {
          if (!e) return false;
          const matches = (e.id === targetId || e.baseEntryId === targetId) && (e._crafterOverride || e.schemaVersion === 3);
          if (matches) removed = true;
          return !matches;
        });
        doc.customDb = nextDb;
        if (typeof root !== 'undefined') root.masterDb = nextDb;
      }
      if (typeof root !== 'undefined') {
        if (root.RuleEngine && root.RuleEngine.DND35_CLASS_DEFS) root.RuleEngine.DND35_CLASS_DEFS = {};
        root._customClassCacheVer = (root._customClassCacheVer || 0) + 1;
        if (typeof root.syncCustomClassesToRuleEngine === 'function') root.syncCustomClassesToRuleEngine();
        if (typeof root.syncClericDomainsToCharacterSpecialAbilities === 'function') root.syncClericDomainsToCharacterSpecialAbilities();
      }
      CharStore.recompute('crafter');
      if (typeof root !== 'undefined' && typeof root.saveStateToStorage === 'function') {
        root.saveStateToStorage(true);
      }
      if (typeof root !== 'undefined' && typeof root.renderAll === 'function') {
        root.renderAll();
      }
      if (!resetOpts.silent) {
        _showCrafterToast(resetOpts.homebrew ? 'Homebrew entry deleted' : 'Restored Official SRD Rules', 'reset');
      }
      return removed;
    }
  };
  CharStore.StudioBridge = StudioBridge;

  // Global Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z Keyboard Listener (Browser Only)
  if (typeof window !== 'undefined' && window.addEventListener && typeof document !== 'undefined') {
    window.addEventListener('keydown', function (ev) {
      if (!ev || (!ev.ctrlKey && !ev.metaKey) || ev.altKey) return;
      const target = ev.target;
      if (target) {
        const tag = String(target.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
      }
      const key = String(ev.key || '').toLowerCase();
      if (key === 'z' && !ev.shiftKey) {
        if (CharStore.canUndo()) {
          ev.preventDefault();
          CharStore.undo();
        }
      } else if (key === 'y' || (key === 'z' && ev.shiftKey)) {
        if (CharStore.canRedo()) {
          ev.preventDefault();
          CharStore.redo();
        }
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.CharStore = CharStore;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharStore;
  }
})(typeof window !== 'undefined' ? window : globalThis);
