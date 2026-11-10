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
      // levelProgression stores display strings such as "🎖️ Aberration Banemagic" / "🌟 [DM Boon] Name"
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

  // Every lazy-chunk reference type the character can hold: feat-list rows plus class levels.
  function collectSrdRefGroups(doc) {
    return FEAT_REF_TYPES.map(t => ({ t, names: collectFeatRefNames(doc, t) }))
      .concat([{ t: 'Class', names: collectClassRefNames(doc) }]);
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
      return this.dispatch({
        type: 'doc/replace',
        payload: newDoc,
        meta
      });
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

    /**
     * Records a snapshot of `{ doc, session }` onto the 20-step Undo stack.
     */
    recordHistory(label = 'Sheet Edit') {
      if (_isRestoringHistory || !_state.doc) return false;
      const engine = resolveRuleEngine();
      const cleanDoc = (engine && typeof engine.stripDerivedFields === 'function')
        ? engine.stripDerivedFields(_state.doc)
        : _state.doc;
      const docJson = JSON.stringify(cleanDoc);
      const sessionJson = JSON.stringify(_state.session || createDefaultSession());

      const top = _undoStack[_undoStack.length - 1];
      if (top && top.docJson === docJson && top.sessionJson === sessionJson) {
        return false;
      }

      _undoStack.push({
        label: String(label || 'Sheet Edit'),
        docJson,
        sessionJson,
        timestamp: Date.now()
      });
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
      const engine = resolveRuleEngine();
      const currentClean = (engine && typeof engine.stripDerivedFields === 'function')
        ? engine.stripDerivedFields(_state.doc)
        : _state.doc;
      _redoStack.push({
        label: _undoStack[_undoStack.length - 1].label,
        docJson: JSON.stringify(currentClean),
        sessionJson: JSON.stringify(_state.session || createDefaultSession()),
        timestamp: Date.now()
      });
      if (_redoStack.length > MAX_HISTORY_STEPS) {
        _redoStack.shift();
      }

      const snap = _undoStack.pop();
      this._applyHistorySnapshot(snap, 'Undo');
      return snap;
    },

    redo() {
      if (_redoStack.length === 0 || !_state.doc) return null;
      const engine = resolveRuleEngine();
      const currentClean = (engine && typeof engine.stripDerivedFields === 'function')
        ? engine.stripDerivedFields(_state.doc)
        : _state.doc;
      _undoStack.push({
        label: _redoStack[_redoStack.length - 1].label,
        docJson: JSON.stringify(currentClean),
        sessionJson: JSON.stringify(_state.session || createDefaultSession()),
        timestamp: Date.now()
      });
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
        const restoredDoc = JSON.parse(snap.docJson);
        const restoredSession = JSON.parse(snap.sessionJson);
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
        const engine = resolveRuleEngine();
        const preClean = (engine && typeof engine.stripDerivedFields === 'function')
          ? engine.stripDerivedFields(_state.doc)
          : _state.doc;
        const preDocJson = JSON.stringify(preClean);
        const preSessionJson = JSON.stringify(_state.session || createDefaultSession());
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
          if (!meta.skipHistory && !_isRestoringHistory) {
            const top = _undoStack[_undoStack.length - 1];
            if (!top || top.docJson !== preDocJson || top.sessionJson !== preSessionJson) {
              _undoStack.push({
                label: String(meta.label || action.label || type),
                docJson: preDocJson,
                sessionJson: preSessionJson,
                timestamp: Date.now()
              });
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
      } catch (_) {}
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
      const m = combinedDesc.match(/(\d+)\s*\/\s*(?:day|gun)|gunde\s*(\d+)/i);
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
            if (bName.includes('sick') || bName.includes('nauseat') || bName.includes('blind') || bName.includes('deaf') || bName.includes('disease') || bName.includes('poison') || bName.includes('fatigue') || bName.includes('exhaust') || bName.includes('daze') || bName.includes('stun') || bName.includes('confus') || bName.includes('kor') || bName.includes('sagir') || bName.includes('zehir') || bName.includes('hastalik') || bName.includes('yorgun')) {
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
            const isExhaust = bName.includes('exhaust') || bName.includes('bitkin');
            const isFatigue = bName.includes('fatigue') || bName.includes('yorgun');

            if (cf.lesserRestoration) {
              if (isDrain) return;
              if (isExhaust) {
                b.name = 'Fatigued';
                b.durationText = 'Reduced from Exhausted (Lesser Restoration)';
                b.summary = '-2 penalty to Strength and Dexterity; cannot run or charge.';
                b.modifiers = [
                  { target: 'ability.str', value: -2, type: 'Condition' },
                  { target: 'ability.dex', value: -2, type: 'Condition' }
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
              if (dFold.includes('exhaust') || dFold.includes('bitkin')) {
                nextDebuffs.push('Fatigued');
                if (!curedDebuffs.includes('Exhausted -> Fatigued')) curedDebuffs.push('Exhausted -> Fatigued');
              } else if (dFold.includes('fatigue') || dFold.includes('yorgun')) {
                if (!curedDebuffs.includes('Fatigued')) curedDebuffs.push('Fatigued');
              } else {
                nextDebuffs.push(d);
              }
            });
            doc.activeDebuffs = nextDebuffs;
          } else if (cf.fullRestoration) {
            const beforeLen = doc.activeDebuffs.length;
            doc.activeDebuffs = doc.activeDebuffs.filter(d => !/drain|negative\s*level|exhaust|bitkin|fatigue|yorgun/i.test(fold(d)));
            if (doc.activeDebuffs.length < beforeLen && curedDebuffs.length === 0) curedDebuffs.push('Restored');
          }
        }
      }

      if (cf.curse) {
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('curse') || bName.includes('lanet')) {
              b.active = false;
              b.durationText = 'Cured (Remove Curse)';
              curedDebuffs.push(b.name);
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          const beforeLen = doc.activeDebuffs.length;
          doc.activeDebuffs = doc.activeDebuffs.filter(d => !/curse|lanet/i.test(fold(d)));
          if (doc.activeDebuffs.length < beforeLen) curedDebuffs.push('Cursed');
        }
      }

      if (cf.disease) {
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('disease') || bName.includes('hastalik') || bName.includes('sickened') || bName.includes('nauseated')) {
              b.active = false;
              b.durationText = 'Cured (Remove Disease)';
              curedDebuffs.push(b.name);
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          const beforeLen = doc.activeDebuffs.length;
          doc.activeDebuffs = doc.activeDebuffs.filter(d => !/disease|hastalik|sicken|nauseat/i.test(fold(d)));
          if (doc.activeDebuffs.length < beforeLen) curedDebuffs.push('Diseased');
        }
      }

      if (cf.blindDeaf) {
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('blind') || bName.includes('deaf') || bName.includes('kor') || bName.includes('sagir')) {
              b.active = false;
              b.durationText = 'Cured (Remove Blindness/Deafness)';
              curedDebuffs.push(b.name);
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          const beforeLen = doc.activeDebuffs.length;
          doc.activeDebuffs = doc.activeDebuffs.filter(d => !/blind|deaf|kor|sagir/i.test(fold(d)));
          if (doc.activeDebuffs.length < beforeLen) curedDebuffs.push('Blinded/Deafened');
        }
      }

      if (cf.paralysis) {
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('paraly') || bName.includes('felc') || bName.includes('slow')) {
              b.active = false;
              b.durationText = 'Cured (Remove Paralysis)';
              curedDebuffs.push(b.name);
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          const beforeLen = doc.activeDebuffs.length;
          doc.activeDebuffs = doc.activeDebuffs.filter(d => !/paraly|felc|slow/i.test(fold(d)));
          if (doc.activeDebuffs.length < beforeLen) curedDebuffs.push('Paralyzed');
        }
      }

      if (cf.poison) {
        if (Array.isArray(doc.buffs)) {
          doc.buffs.forEach(b => {
            if (!b || !b.active) return;
            const bName = fold(b.name);
            if (bName.includes('poison') || bName.includes('zehir')) {
              b.active = false;
              b.durationText = 'Cured (Neutralize Poison)';
              curedDebuffs.push(b.name);
            }
          });
        }
        if (Array.isArray(doc.activeDebuffs)) {
          const beforeLen = doc.activeDebuffs.length;
          doc.activeDebuffs = doc.activeDebuffs.filter(d => !/poison|zehir/i.test(fold(d)));
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
      const strippedItem = cleanName.replace(/^(potion|oil|elixir|iksir)\s+(of\s+)?/i, '').replace(/iksir[ii]?/i, '').replace(/'s/g, '').trim();
      return bClean && (cleanName.includes(bClean) || (strippedItem && bClean.includes(strippedItem)));
    });
    if (match) {
      match.active = true;
      match.rounds = defaultRounds;
      activatedBuff = match.name;
      activatedRounds = match.rounds;
      activatedSummary = match.summary || match.notes || '';
    } else if (compendiumEntry && ((Array.isArray(compendiumEntry.modifiers) && compendiumEntry.modifiers.length > 0) || (compendiumEntry.ruleFlags && Object.keys(compendiumEntry.ruleFlags).length > 0))) {
      const buffTitle = String(compendiumEntry.name || name).replace(/^(Potion|Oil|Elixir)\s+of\s+/i, '').trim();
      const v2Mods = Array.isArray(compendiumEntry.modifiers) ? JSON.parse(JSON.stringify(compendiumEntry.modifiers)) : [];
      const v2Flags = compendiumEntry.ruleFlags ? JSON.parse(JSON.stringify(compendiumEntry.ruleFlags)) : {};
      const durMin = Math.round(defaultRounds / 10);
      const durText = defaultRounds >= 600 ? `${Math.round(defaultRounds / 600)} hr.` : (defaultRounds >= 10 ? `${durMin} min. (${defaultRounds} rounds)` : `${defaultRounds} rounds`);
      const newBuff = {
        id: 'buff_pot_' + (payload.nowTs || Date.now()),
        schemaVersion: 2,
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
        modifiers: v2Mods,
        ruleFlags: v2Flags
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
  CharStore.registerReducer('combat/specialAttackRoll', (doc, action, stateObj) => {
    const payload = (action && action.payload) || {};
    const abilityKey = payload.abilityKey;
    if (!abilityKey) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
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
    'rangedHigherGround', 'targetInMelee', 'coverPenalty', 'defensiveCastingActive',
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
      if (Array.isArray(doc.activeModifiers) && doc.activeModifiers[idx]) {
        const nextAct = payload.value !== undefined
          ? Boolean(payload.value)
          : !Boolean(doc.activeModifiers[idx].active);
        doc.activeModifiers[idx].active = nextAct;
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
      doc.tactical.fightingDefensively = false;
    }
    setStoreOutcome(stateObj, { status: 'tactical_toggled', key: resolvedKey, value: doc.tactical[resolvedKey] });
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

  function unequipSlotOnDoc(doc, slotKey) {
    ensureInventoryDocStructures(doc);
    const slot = doc.bodySlots[slotKey];
    if (!slot || !slot.name || slot.name === '-') return null;
    const engine = resolveRuleEngine();
    const slotNameLower = String(slot.name || '').toLowerCase().trim();
    const existingInPool = doc.gearPool.find(p => p && String(p.name || '').toLowerCase().trim() === slotNameLower);
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
        dice: slot.dice,
        critMin: slot.critMin,
        critRange: slot.critRange,
        critMult: slot.critMult,
        handedness: slot.handedness,
        attBonus: slot.attBonus,
        dmgBonus: slot.dmgBonus,
        dmgType: slot.dmgType,
        isLight: slot.isLight,
        acBonus: slot.acBonus,
        bonusType: slot.bonusType,
        maxDex: slot.maxDex,
        checkPenalty: slot.checkPenalty,
        spellFailure: slot.spellFailure,
        dailyCharges: slot.dailyCharges ? JSON.parse(JSON.stringify(slot.dailyCharges)) : undefined,
        damageParts: Array.isArray(slot.damageParts) ? JSON.parse(JSON.stringify(slot.damageParts)) : undefined,
        modifiers: Array.isArray(slot.modifiers) ? JSON.parse(JSON.stringify(slot.modifiers)) : undefined,
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
      material: item.material,
      enhancementBonus: item.enhancementBonus,
      enhancements: Array.isArray(item.enhancements) ? item.enhancements.slice() : undefined,
      dice: item.dice || (Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0].dice : undefined),
      critMin: item.critMin || item.critRange || item.weaponMeta?.critMin,
      critRange: item.critRange || item.critMin || item.weaponMeta?.critMin,
      critMult: item.critMult || item.weaponMeta?.critMult,
      handedness: item.handedness || item.weaponMeta?.handedness,
      attBonus: item.attBonus || item.enhancementBonus || 0,
      dmgBonus: item.dmgBonus || item.enhancementBonus || 0,
      dmgType: item.dmgType || (Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0].type : undefined),
      isLight: item.isLight || Boolean(engine && typeof engine.isLightWeapon === 'function' && engine.isLightWeapon(item)),
      parent: item.parent,
      dailyCharges: normDc ? JSON.parse(JSON.stringify(normDc)) : undefined,
      damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : undefined,
      modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : undefined,
      acBonus: item.acBonus,
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
      maxDex: item.maxDex,
      checkPenalty: item.checkPenalty,
      spellFailure: item.spellFailure,
      ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : undefined,
      tacticalBadges: Array.isArray(item.tacticalBadges) ? JSON.parse(JSON.stringify(item.tacticalBadges)) : undefined,
      combatModifiers: item.combatModifiers ? JSON.parse(JSON.stringify(item.combatModifiers)) : undefined
    };
    item.isEquipped = true;

    if (item.category === 'Weapon') {
      const existingWep = doc.weapons.find(w => w && String(w.name || '').toLowerCase() === String(item.name || '').toLowerCase());
      const targetGrip = isTwoHand ? '2-Hand' : (targetSlotKey === 'offHand' ? 'Off-Hand' : '1-Hand');
      if (existingWep) {
        existingWep.grip = targetGrip;
        if (item.dice) existingWep.dice = item.dice;
        if (item.critMin || item.critRange) existingWep.critMin = item.critMin || item.critRange;
        if (item.critMult) existingWep.critMult = item.critMult;
        if (item.dmgType) existingWep.dmgType = item.dmgType;
        if (item.handedness) existingWep.handedness = item.handedness;
        if (item.enhancementBonus !== undefined) existingWep.enhancementBonus = item.enhancementBonus;
        if (item.attBonus !== undefined) existingWep.attBonus = item.attBonus;
        if (item.dmgBonus !== undefined) existingWep.dmgBonus = item.dmgBonus;
        if (item.isLight !== undefined) existingWep.isLight = item.isLight;
        if (Array.isArray(item.damageParts) && item.damageParts.length > 0) existingWep.damageParts = JSON.parse(JSON.stringify(item.damageParts));
        if (Array.isArray(item.modifiers) && item.modifiers.length > 0) existingWep.modifiers = JSON.parse(JSON.stringify(item.modifiers));
      } else {
        doc.weapons.push({
          baseItemId: item.baseItemId,
          name: item.name,
          grip: targetGrip,
          handedness: item.handedness || item.weaponMeta?.handedness,
          dice: item.dice || (Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0].dice : (isTwoHand ? '2d6' : '1d6')),
          critMin: item.critMin || item.critRange || item.weaponMeta?.critMin || 20,
          critMult: item.critMult || item.weaponMeta?.critMult || 2,
          enhancementBonus: item.enhancementBonus || 0,
          attBonus: item.attBonus || item.enhancementBonus || 0,
          dmgBonus: item.dmgBonus || item.enhancementBonus || 0,
          dmgType: item.dmgType || (Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0].type : 'Slashing'),
          bonusType: item.bonusType || 'Enhancement',
          isLight: item.isLight || Boolean(engine && typeof engine.isLightWeapon === 'function' && engine.isLightWeapon(item)),
          damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : undefined,
          modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : undefined,
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
        if (!Array.isArray(doc.activeModifiers)) doc.activeModifiers = [];
        let twfMod = doc.activeModifiers.find(m => m && m.name && (m.name.includes('TWF') || m.name.includes('Two-Weapon')));
        if (!twfMod) {
          doc.activeModifiers.push({
            name: 'Two-Weapon Fighting (TWF)',
            source: 'Combat',
            bonusAtk: 0,
            dice: '',
            type: 'TWF',
            active: true,
            notes: 'Extra Off-Hand Attack (RAW TWF)'
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
    const v2Item = payload.item || payload;
    if (!v2Item || !v2Item.name) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const engine = resolveRuleEngine();
    const cat = v2Item.category && v2Item.category !== 'Other'
      ? v2Item.category
      : (engine && typeof engine.inferInventoryItemCategory === 'function' ? engine.inferInventoryItemCategory(v2Item) : (v2Item.type || 'Other'));
    const isBeltItem = Boolean(v2Item.isBelt || v2Item.inBelt || String(v2Item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable');
    const primaryPart = Array.isArray(v2Item.damageParts) && v2Item.damageParts[0] ? v2Item.damageParts[0] : null;
    const armorAcMod = Array.isArray(v2Item.modifiers) ? v2Item.modifiers.find(m => m && (m.target === 'ac.armor' || m.target === 'ac.shield')) : null;
    const qtyVal = (v2Item.qty !== undefined && v2Item.qty !== null) ? Math.max(0, Number(v2Item.qty)) : 1;
    const newEntry = {
      id: v2Item.id || ('item_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
      baseItemId: v2Item.baseItemId || v2Item.id || null,
      name: v2Item.name,
      masterDbName: v2Item.masterDbName || v2Item.name,
      category: cat,
      slot: v2Item.slot && v2Item.slot !== 'None' ? v2Item.slot : cat,
      qty: qtyVal,
      weight: Number(v2Item.weightLb ?? v2Item.weight) || 0,
      cost: Number(v2Item.priceGp ?? v2Item.cost) || 0,
      desc: v2Item.desc || v2Item.benefit || v2Item.description || '',
      material: v2Item.material || null,
      enhancementBonus: Number(v2Item.enhancementBonus) || 0,
      enhancements: Array.isArray(v2Item.enhancements) ? v2Item.enhancements.slice() : [],
      modifiers: Array.isArray(v2Item.modifiers) ? JSON.parse(JSON.stringify(v2Item.modifiers)) : [],
      damageParts: Array.isArray(v2Item.damageParts) ? JSON.parse(JSON.stringify(v2Item.damageParts)) : [],
      modes: Array.isArray(v2Item.modes) ? JSON.parse(JSON.stringify(v2Item.modes)) : [],
      weaponMeta: v2Item.weaponMeta ? JSON.parse(JSON.stringify(v2Item.weaponMeta)) : null,
      armorMeta: v2Item.armorMeta ? JSON.parse(JSON.stringify(v2Item.armorMeta)) : null,
      ruleFlags: v2Item.ruleFlags ? JSON.parse(JSON.stringify(v2Item.ruleFlags)) : {},
      tacticalBadges: Array.isArray(v2Item.tacticalBadges) ? JSON.parse(JSON.stringify(v2Item.tacticalBadges)) : [],
      dice: (primaryPart && primaryPart.dice) || v2Item.dice,
      dmgType: (primaryPart && primaryPart.type) || v2Item.dmgType,
      critMin: Number(v2Item.critRange || v2Item.critMin || v2Item.weaponMeta?.critMin) || undefined,
      critRange: Number(v2Item.critRange || v2Item.critMin || v2Item.weaponMeta?.critMin) || undefined,
      critMult: Number(v2Item.critMult || v2Item.weaponMeta?.critMult) || undefined,
      handedness: v2Item.handedness || v2Item.weaponMeta?.handedness,
      attBonus: Number(v2Item.enhancementBonus || v2Item.attBonus) || 0,
      dmgBonus: Number(v2Item.enhancementBonus || v2Item.dmgBonus) || 0,
      acBonus: v2Item.acBonus !== undefined ? v2Item.acBonus : (armorAcMod ? Number(armorAcMod.value) : undefined),
      maxDex: v2Item.maxDex !== undefined ? v2Item.maxDex : v2Item.armorMeta?.maxDex,
      checkPenalty: v2Item.checkPenalty !== undefined ? v2Item.checkPenalty : v2Item.armorMeta?.acp,
      spellFailure: v2Item.spellFailure !== undefined ? v2Item.spellFailure : v2Item.armorMeta?.asf,
      isBelt: isBeltItem,
      isEquipped: false
    };
    doc.gearPool.push(newEntry);

    if (cat === 'Weapon' || v2Item.type === 'Weapon') {
      const hasWep = doc.weapons.some(w => w && String(w.name || '').toLowerCase() === String(v2Item.name || '').toLowerCase());
      if (!hasWep) {
        const secondaryParts = Array.isArray(v2Item.damageParts) && v2Item.damageParts.length > 1 ? v2Item.damageParts.slice(1) : [];
        const isTwoHand = Boolean(
          String(v2Item.weaponMeta?.handedness || v2Item.handedness || '').toLowerCase().includes('two') ||
          (engine && typeof engine.isTwoHandedWeapon === 'function' && engine.isTwoHandedWeapon(v2Item))
        );
        doc.weapons.push({
          id: newEntry.id,
          baseItemId: newEntry.baseItemId,
          name: v2Item.name,
          grip: isTwoHand ? '2-Hand' : '1-Hand',
          handedness: newEntry.handedness,
          dice: (primaryPart && primaryPart.dice) || v2Item.dice || '1d8',
          damageParts: newEntry.damageParts.length > 0
            ? JSON.parse(JSON.stringify(newEntry.damageParts))
            : [{ dice: v2Item.dice || '1d8', bonus: Number(v2Item.dmgBonus) || 0, type: v2Item.dmgType || 'Slashing', multiplyOnCrit: true }],
          modifiers: JSON.parse(JSON.stringify(newEntry.modifiers)),
          modes: JSON.parse(JSON.stringify(newEntry.modes)),
          weaponMeta: newEntry.weaponMeta ? JSON.parse(JSON.stringify(newEntry.weaponMeta)) : null,
          ruleFlags: JSON.parse(JSON.stringify(newEntry.ruleFlags)),
          tacticalBadges: JSON.parse(JSON.stringify(newEntry.tacticalBadges)),
          critMin: Number(v2Item.weaponMeta?.critMin || v2Item.critMin) || 20,
          rawCritMin: Number(v2Item.weaponMeta?.critMin || v2Item.critMin) || 20,
          critMult: Number(v2Item.weaponMeta?.critMult || v2Item.critMult) || 2,
          enhancementBonus: Number(v2Item.enhancementBonus) || 0,
          attBonus: Number(v2Item.enhancementBonus || v2Item.attBonus) || 0,
          dmgBonus: Number(v2Item.enhancementBonus || v2Item.dmgBonus) || 0,
          dmgType: (primaryPart && primaryPart.type) || v2Item.dmgType || 'Slashing',
          bonusType: 'enhancement',
          tags: v2Item.tags || [],
          elementalMods: secondaryParts.map(sp => ({ name: sp.source || sp.type, dice: sp.dice, type: sp.type })),
          keen: Boolean(v2Item.ruleFlags && v2Item.ruleFlags.keen)
        });
      }
    }

    if (cat === 'Consumable' || (isBeltItem && cat !== 'Weapon')) {
      const cleanName = String(v2Item.name || '').toLowerCase().trim();
      const hasCons = doc.consumables.some(c => c && String(c.name || '').toLowerCase().trim() === cleanName);
      if (!hasCons) {
        doc.consumables.push({
          name: v2Item.name,
          qty: qtyVal,
          effect: newEntry.desc || 'Consumable effect'
        });
      }
    }

    let attachedChildCount = 0;
    const itemModes = Array.isArray(v2Item.modes) ? v2Item.modes : [];
    if (itemModes.length > 0) {
      itemModes.forEach(mode => {
        if (!mode || mode.handedness || mode.id === 'primary-head' || mode.id === 'offhand-head' || mode.id === '2h-single' || mode.ruleFlags?.doubleWeapon || mode.ruleFlags?.doubleWeaponOffHand) {
          return;
        }
        const modeClean = String(mode.name || mode.label || '').replace(/^↳\s*/, '').trim();
        if (!modeClean) return;
        const modePart = Array.isArray(mode.damageParts) && mode.damageParts[0] ? mode.damageParts[0] : null;
        const modeDice = (modePart && modePart.dice) || mode.dice || '';
        if (String(mode.action || '').toLowerCase().includes('action') || (mode.duration && mode.duration !== 'Continuous')) {
          if (!Array.isArray(doc.specialAbilities)) doc.specialAbilities = [];
          if (!doc.specialAbilities.some(a => a && String(a.name || '').toLowerCase() === modeClean.toLowerCase())) {
            doc.specialAbilities.push({
              name: modeClean,
              source: v2Item.name,
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
          if (!Array.isArray(doc.activeModifiers)) doc.activeModifiers = [];
          if (!doc.activeModifiers.some(m => m && String(m.name || '').toLowerCase() === modeClean.toLowerCase())) {
            doc.activeModifiers.push({
              name: modeClean,
              source: v2Item.name,
              bonusAtk: 0,
              dice: modeDice,
              type: (modePart && modePart.type) || 'Energy',
              active: true,
              notes: mode.benefit || mode.description || ''
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
    const forgedV2Item = payload.itemData || payload.forgedV2Item;
    if (!forgedV2Item) {
      setStoreOutcome(stateObj, { status: 'invalid_payload' });
      return doc;
    }
    const engine = resolveRuleEngine();
    const oldName = String(originalItem?.name || '').trim();
    const oldNameLower = oldName.toLowerCase();
    const newName = String(forgedV2Item.name || oldName || 'Forged Item').trim();
    const cat = forgedV2Item.category && forgedV2Item.category !== 'Other'
      ? forgedV2Item.category
      : (engine && typeof engine.inferInventoryItemCategory === 'function' ? engine.inferInventoryItemCategory(forgedV2Item) : (forgedV2Item.type || originalItem?.category || 'Weapon'));
    const newWeight = Number(forgedV2Item.weightLb ?? forgedV2Item.weight) || 0;
    const newCost = Number(forgedV2Item.priceGp ?? forgedV2Item.cost) || 0;
    const newDesc = forgedV2Item.benefit || forgedV2Item.description || originalItem?.desc || '';
    const primaryPart = Array.isArray(forgedV2Item.damageParts) && forgedV2Item.damageParts[0] ? forgedV2Item.damageParts[0] : null;
    const secondaryParts = Array.isArray(forgedV2Item.damageParts) && forgedV2Item.damageParts.length > 1 ? forgedV2Item.damageParts.slice(1) : [];

    const clonedModifiers = Array.isArray(forgedV2Item.modifiers) ? JSON.parse(JSON.stringify(forgedV2Item.modifiers)) : [];
    const clonedDamageParts = Array.isArray(forgedV2Item.damageParts) ? JSON.parse(JSON.stringify(forgedV2Item.damageParts)) : [];
    const clonedModes = Array.isArray(forgedV2Item.modes) ? JSON.parse(JSON.stringify(forgedV2Item.modes)) : [];
    const clonedWeaponMeta = forgedV2Item.weaponMeta ? JSON.parse(JSON.stringify(forgedV2Item.weaponMeta)) : null;
    const clonedArmorMeta = forgedV2Item.armorMeta ? JSON.parse(JSON.stringify(forgedV2Item.armorMeta)) : null;
    const clonedRuleFlags = forgedV2Item.ruleFlags ? JSON.parse(JSON.stringify(forgedV2Item.ruleFlags)) : {};
    const clonedTacticalBadges = Array.isArray(forgedV2Item.tacticalBadges) ? JSON.parse(JSON.stringify(forgedV2Item.tacticalBadges)) : [];

    const armorAcMod = clonedModifiers.find(m => m && (m.target === 'ac.armor' || m.target === 'ac.shield'));
    const computedAcBonus = armorAcMod ? (Number(armorAcMod.value) || 0) : (forgedV2Item.acBonus ?? originalItem?.acBonus);

    const poolItem = doc.gearPool.find(p => {
      if (!p) return false;
      if (originalItem?.id !== undefined && String(p.id) === String(originalItem.id)) return true;
      return oldNameLower && String(p.name || '').toLowerCase().trim() === oldNameLower;
    });
    if (poolItem) {
      poolItem.baseItemId = forgedV2Item.baseItemId || forgedV2Item.id || poolItem.baseItemId || null;
      poolItem.name = newName;
      poolItem.masterDbName = newName;
      poolItem.category = cat;
      poolItem.slot = (forgedV2Item.slot && forgedV2Item.slot !== 'None') ? forgedV2Item.slot : (poolItem.slot || cat);
      poolItem.weight = newWeight;
      poolItem.cost = newCost;
      poolItem.desc = newDesc;
      poolItem.material = forgedV2Item.material || null;
      poolItem.enhancementBonus = Number(forgedV2Item.enhancementBonus) || 0;
      poolItem.enhancements = Array.isArray(forgedV2Item.enhancements) ? forgedV2Item.enhancements.slice() : [];
      poolItem.modifiers = clonedModifiers;
      poolItem.damageParts = clonedDamageParts;
      poolItem.modes = clonedModes;
      poolItem.weaponMeta = clonedWeaponMeta;
      poolItem.armorMeta = clonedArmorMeta;
      poolItem.ruleFlags = clonedRuleFlags;
      poolItem.tacticalBadges = clonedTacticalBadges;
      poolItem.dice = (primaryPart && primaryPart.dice) || forgedV2Item.dice || poolItem.dice;
      poolItem.critMin = Number(forgedV2Item.weaponMeta?.critMin || forgedV2Item.critMin) || poolItem.critMin;
      poolItem.critMult = Number(forgedV2Item.weaponMeta?.critMult || forgedV2Item.critMult) || poolItem.critMult;
      poolItem.attBonus = Number(forgedV2Item.enhancementBonus) || 0;
      poolItem.dmgBonus = Number(forgedV2Item.enhancementBonus) || 0;
      poolItem.dmgType = (primaryPart && primaryPart.type) || forgedV2Item.dmgType || poolItem.dmgType;
      if (computedAcBonus !== undefined) poolItem.acBonus = computedAcBonus;
      if (clonedArmorMeta) {
        poolItem.maxDex = clonedArmorMeta.maxDex;
        poolItem.checkPenalty = clonedArmorMeta.acp;
      }
    }

    const slotKeysToUpdate = [];
    if (targetSlotKey && doc.bodySlots[targetSlotKey] && doc.bodySlots[targetSlotKey].name !== '-') {
      slotKeysToUpdate.push(targetSlotKey);
    } else if (oldNameLower) {
      Object.keys(doc.bodySlots).forEach(sk => {
        const sd = doc.bodySlots[sk];
        if (sd && sd.name && String(sd.name).toLowerCase().trim() === oldNameLower) {
          slotKeysToUpdate.push(sk);
        }
      });
    }
    slotKeysToUpdate.forEach(sk => {
      const sd = doc.bodySlots[sk];
      if (!sd) return;
      sd.baseItemId = forgedV2Item.baseItemId || forgedV2Item.id || sd.baseItemId || null;
      sd.name = newName;
      sd.masterDbName = newName;
      sd.category = cat;
      sd.weight = newWeight;
      sd.cost = newCost;
      sd.desc = newDesc;
      sd.benefit = newDesc;
      sd.description = newDesc;
      sd.material = forgedV2Item.material || null;
      sd.enhancementBonus = Number(forgedV2Item.enhancementBonus) || 0;
      sd.enhancements = Array.isArray(forgedV2Item.enhancements) ? forgedV2Item.enhancements.slice() : [];
      sd.modifiers = JSON.parse(JSON.stringify(clonedModifiers));
      sd.damageParts = JSON.parse(JSON.stringify(clonedDamageParts));
      sd.modes = JSON.parse(JSON.stringify(clonedModes));
      sd.weaponMeta = clonedWeaponMeta ? JSON.parse(JSON.stringify(clonedWeaponMeta)) : null;
      sd.armorMeta = clonedArmorMeta ? JSON.parse(JSON.stringify(clonedArmorMeta)) : null;
      sd.ruleFlags = JSON.parse(JSON.stringify(clonedRuleFlags));
      sd.tacticalBadges = JSON.parse(JSON.stringify(clonedTacticalBadges));
      sd.dice = (primaryPart && primaryPart.dice) || forgedV2Item.dice || sd.dice;
      sd.critMin = Number(forgedV2Item.weaponMeta?.critMin || forgedV2Item.critMin) || sd.critMin;
      sd.critMult = Number(forgedV2Item.weaponMeta?.critMult || forgedV2Item.critMult) || sd.critMult;
      sd.attBonus = Number(forgedV2Item.enhancementBonus) || 0;
      sd.dmgBonus = Number(forgedV2Item.enhancementBonus) || 0;
      sd.dmgType = (primaryPart && primaryPart.type) || forgedV2Item.dmgType || sd.dmgType;
      if (computedAcBonus !== undefined) sd.acBonus = computedAcBonus;
      if (clonedArmorMeta) {
        sd.maxDex = clonedArmorMeta.maxDex;
        sd.checkPenalty = clonedArmorMeta.acp;
      }
    });

    if (cat === 'Weapon' || originalItem?.category === 'Weapon') {
      const wepIdx = doc.weapons.findIndex(w => {
        if (!w) return false;
        if (originalItem?.id !== undefined && String(w.id) === String(originalItem.id)) return true;
        return oldNameLower && String(w.name || '').toLowerCase().trim() === oldNameLower;
      });
      const updatedWepObj = {
        id: forgedV2Item.id || originalItem?.id || ('wep_' + Date.now()),
        baseItemId: forgedV2Item.baseItemId || forgedV2Item.id || null,
        name: newName,
        grip: String(clonedWeaponMeta?.handedness || '').includes('Two') ? '2-Hand' : (wepIdx >= 0 ? doc.weapons[wepIdx].grip : '1-Hand'),
        dice: (primaryPart && primaryPart.dice) || forgedV2Item.dice || '1d8',
        damageParts: JSON.parse(JSON.stringify(clonedDamageParts)),
        modifiers: JSON.parse(JSON.stringify(clonedModifiers)),
        modes: JSON.parse(JSON.stringify(clonedModes)),
        weaponMeta: clonedWeaponMeta ? JSON.parse(JSON.stringify(clonedWeaponMeta)) : null,
        ruleFlags: JSON.parse(JSON.stringify(clonedRuleFlags)),
        tacticalBadges: JSON.parse(JSON.stringify(clonedTacticalBadges)),
        critMin: Number(clonedWeaponMeta?.critMin || forgedV2Item.critMin) || 20,
        rawCritMin: Number(clonedWeaponMeta?.critMin || forgedV2Item.critMin) || 20,
        critMult: Number(clonedWeaponMeta?.critMult || forgedV2Item.critMult) || 2,
        attBonus: Number(forgedV2Item.enhancementBonus) || 0,
        dmgBonus: Number(forgedV2Item.enhancementBonus) || 0,
        dmgType: (primaryPart && primaryPart.type) || forgedV2Item.dmgType || 'Slashing',
        bonusType: 'enhancement',
        tags: forgedV2Item.tags || [],
        elementalMods: secondaryParts.map(sp => ({ name: sp.source || sp.type, dice: sp.dice, type: sp.type })),
        keen: Boolean(clonedRuleFlags && clonedRuleFlags.keen)
      };
      if (wepIdx >= 0) {
        doc.weapons[wepIdx] = Object.assign({}, doc.weapons[wepIdx], updatedWepObj);
      } else {
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
    if (forgedV2Item.enhancementBonus > 0 || forgedV2Item.material || (Array.isArray(forgedV2Item.enhancements) && forgedV2Item.enhancements.length > 0)) {
      const existingIdx = doc.customDb.findIndex(m => m && String(m.name || '').toLowerCase().trim() === newName.toLowerCase());
      if (existingIdx >= 0) {
        doc.customDb[existingIdx] = Object.assign({}, doc.customDb[existingIdx], JSON.parse(JSON.stringify(forgedV2Item)));
      } else {
        doc.customDb.push(JSON.parse(JSON.stringify(forgedV2Item)));
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

  // 12. 'spells/toggleDmBoon' ({ key })
  CharStore.registerReducer('spells/toggleDmBoon', (doc, action, stateObj) => {
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
        doc.settings.clMode = 'Character Level (DM Boon)';
      }
    } else {
      doc.settings.casterTypeExplicit = false;
      doc.settings.clMode = 'Class Level';
      doc.settings.casterType = payload.fallbackDiscipline || 'spontaneous';
    }

    setStoreOutcome(stateObj, {
      status: 'dm_boon_toggled',
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
      .replace(/^DM\s*Boon:\s*/i, '')
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
        .replace(/^DM\s*Boon:\s*/i, '')
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
    if (Array.isArray(doc.activeModifiers)) {
      doc.activeModifiers.forEach(function (mod) {
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
        const isPermanent = Boolean(b.permanent) || durLower.includes('kalıcı') || durLower.includes('permanent') || durLower.includes('condition');
        const is24h = durLower.includes('24 saat') || durLower.includes('24 hour') || durLower.includes('24 hr');
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
            if (/\b(?:min|mins|minute|minutes|dk|dakika)\b/i.test(durLower)) {
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
            const rdMatch = durLower.match(/(\d+)\s*(?:rd|rds|round|rounds|tur)\b/i);
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
              const minMatch = durLower.match(/(\d+)\s*(?:min|mins|minute|minutes|dk|dakika)\b/i);
              if (minMatch) {
                parsedMins = parseInt(minMatch[1], 10);
              } else {
                const hrMatch = durLower.match(/(\d+)\s*(?:hr|hrs|hour|hours|saat)\b/i);
                if (hrMatch) parsedMins = parseInt(hrMatch[1], 10) * 60;
              }
            }

            if (parsedMins !== null && parsedMins > 0) {
              if (parsedMins <= minutes) {
                shouldExpire = true;
              } else {
                const remMins = parsedMins - minutes;
                if (remMins >= 60 && remMins % 60 === 0 && /\b(?:hr|hrs|hour|hours|saat)\b/i.test(durLower)) {
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
            exhaustedBuff.name = 'Fatigued (-2 STR/DEX)';
            exhaustedBuff.strBonus = -2;
            exhaustedBuff.dexBonus = -2;
            exhaustedBuff.speedBonus = 0;
            exhaustedBuff.modifiers = [
              { target: 'ability.str', value: -2, type: 'untyped' },
              { target: 'ability.dex', value: -2, type: 'untyped' }
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
    if (Array.isArray(doc.activeModifiers)) {
      doc.activeModifiers.forEach(function (mod) {
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
        const isPermanent = dur.includes('kalıcı') || dur.includes('permanent') || Boolean(b.permanent);
        const is24h = dur.includes('24 saat') || dur.includes('24 hour') || dur.includes('24 hr');
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
