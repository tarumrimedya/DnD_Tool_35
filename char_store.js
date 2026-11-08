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
      cooldowns: {}
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

    getSession() {
      return _state.session;
    },

    getUi() {
      return _state.ui;
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
      const prevId = _state.doc && (_state.doc.id || _state.doc.name);
      const nextId = newChar.id || newChar.name;
      _state.doc = newChar;
      _sheetDirty = true;
      if (prevId !== nextId && !_isRestoringHistory) {
        _state.session = loadSessionFromStorage(newChar);
      }
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
      const db = (typeof root !== 'undefined' && Array.isArray(root.masterDb))
        ? root.masterDb
        : (Array.isArray(_state.doc.customDb) ? _state.doc.customDb : []);
      const sheetView = engine.deriveSheet(_state.doc, {
        masterDb: db,
        session: _state.session,
        tactical: _lastTacticalOptions
      }, _lastTacticalOptions);

      _state.sheet = sheetView;
      _sheetDirty = false;

      if (typeof engine.writeBackLegacyFields === 'function') {
        engine.writeBackLegacyFields(_state.doc, sheetView);
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
        _state.doc = restoredDoc;
        _state.session = restoredSession;
        saveSessionToStorage(_state.doc, _state.session);

        if (typeof root !== 'undefined' && root.document) {
          root.character = _state.doc;
          if (Array.isArray(_state.doc.customDb)) {
            root.masterDb = _state.doc.customDb;
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
        const mode = (payload && payload.mode) || payload || 'both';
        _state.ui = Object.assign({}, _state.ui, { mode: String(mode) });
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
          this.recordHistory(meta.label || 'Replace Character');
        }
        _state.doc = payload ? JSON.parse(JSON.stringify(payload)) : null;
        _state.session = loadSessionFromStorage(_state.doc);
        if (typeof root !== 'undefined' && root.document && _state.doc) {
          root.character = _state.doc;
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
          this.recordHistory(meta.label || 'Session Update');
        }
        if (typeof payload === 'function') {
          payload(_state.session);
        } else if (payload && typeof payload === 'object') {
          _state.session = Object.assign({}, _state.session, payload);
        }
        saveSessionToStorage(_state.doc, _state.session);
        sessionChanged = true;
      } else if (_customReducers.has(type)) {
        if (!meta.skipHistory && _state.doc) {
          this.recordHistory(meta.label || type);
        }
        const reducerFn = _customReducers.get(type);
        reducerFn(_state, payload, meta);
        docChanged = true;
      }

      if (docChanged || sessionChanged) {
        this.recompute(meta.tactical);
        if (docChanged && typeof root !== 'undefined' && typeof root.saveStateToStorage === 'function' && meta.persist !== false) {
          root.saveStateToStorage(meta.cloudSync !== false);
        }
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
