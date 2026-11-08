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
      if (!Array.isArray(_state.doc.customDb)) {
        _state.doc.customDb = [];
      }
      if (typeof root !== 'undefined') {
        root.masterDb = _state.doc.customDb;
      }
      const db = _state.doc.customDb;
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
          this.recordHistory(meta.label || action.label || 'Replace Character');
        }
        _state.doc = payload ? JSON.parse(JSON.stringify(payload)) : null;
        if (_state.doc && !Array.isArray(_state.doc.customDb)) {
          _state.doc.customDb = [];
        }
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
            outcome.status === 'invalid_payload'
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
