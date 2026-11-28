/**
 * Joyful-Fermi — Calm Sheet Shell, Change Bus, Region Ownership & Idle Warm-Up (Phase 0)
 *
 * Single public namespace: `window.Sheet`
 *   - Sheet.shell   : Feature flag (`classic` default | `calm` opt-in, ?shell=calm|classic)
 *   - Sheet.theme   : Scoped 3-theme controller (`slate` | `obsidian` | `midnight`)
 *   - Sheet.regions : Single-owner legacy zone claims + granular slice subscribers
 *   - Sheet.bus     : Coalesced rAF change bus (eliminates redundant renderAll storms)
 *   - Sheet.warmup  : 4-tier resource-aware SRD idle prefetcher
 */
(function (root) {
  'use strict';

  const STORAGE_SHELL_KEY = 'dnd35_sheet_shell';
  const STORAGE_THEME_KEY = 'dnd35_sheet_theme';
  const VALID_SHELLS = ['classic', 'calm'];
  const VALID_THEMES = ['slate', 'obsidian', 'midnight'];

  function _reportErr(context, err) {
    if (typeof root !== 'undefined' && typeof root.reportError === 'function') {
      root.reportError(context, err);
    } else if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(`[Sheet:${context}]`, err);
    }
  }

  function _safeStorageGet(key) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
    } catch (err) {
      _reportErr('storage:get', err);
    }
    return null;
  }

  function _safeStorageSet(key, val) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(key, val);
      }
    } catch (err) {
      _reportErr('storage:set', err);
    }
  }

  function _readQueryParam(name) {
    try {
      if (typeof location !== 'undefined' && location && typeof location.search === 'string') {
        const params = new URLSearchParams(location.search);
        return params.get(name);
      }
    } catch (err) {
      _reportErr('url:param', err);
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // 1. Shell Feature Flag & 3-Theme Controller
  // ---------------------------------------------------------------------------
  let _shellMode = 'calm';
  let _themeName = 'slate';

  function _applyDomAttrs() {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.dataset.sheetShell = _shellMode;
      document.documentElement.dataset.sheetTheme = _themeName;
    }
  }

  const shell = {
    getMode() {
      return _shellMode;
    },
    isCalm() {
      return _shellMode === 'calm';
    },
    setMode(rawMode, opts = {}) {
      const normalized = String(rawMode || '').toLowerCase().trim();
      const next = VALID_SHELLS.includes(normalized) ? normalized : 'calm';
      _shellMode = next;
      if (opts.persist !== false) {
        _safeStorageSet(STORAGE_SHELL_KEY, next);
      }
      _applyDomAttrs();
      return _shellMode;
    }
  };

  const theme = {
    list() {
      return VALID_THEMES.slice();
    },
    get() {
      return _themeName;
    },
    set(rawTheme, opts = {}) {
      const normalized = String(rawTheme || '').toLowerCase().trim();
      const next = VALID_THEMES.includes(normalized) ? normalized : 'slate';
      _themeName = next;
      if (opts.persist !== false) {
        _safeStorageSet(STORAGE_THEME_KEY, next);
      }
      _applyDomAttrs();
      return _themeName;
    }
  };

  // Hydrate initial shell mode & theme from URL param or localStorage
  (function initShellAndTheme() {
    const qShell = _readQueryParam('shell');
    const savedShell = _safeStorageGet(STORAGE_SHELL_KEY);
    if (qShell && VALID_SHELLS.includes(qShell.toLowerCase())) {
      _shellMode = qShell.toLowerCase();
    } else if (savedShell && VALID_SHELLS.includes(savedShell.toLowerCase())) {
      _shellMode = savedShell.toLowerCase();
    } else {
      _shellMode = 'calm';
    }

    const qTheme = _readQueryParam('theme');
    const savedTheme = _safeStorageGet(STORAGE_THEME_KEY);
    if (qTheme && VALID_THEMES.includes(qTheme.toLowerCase())) {
      _themeName = qTheme.toLowerCase();
    } else if (savedTheme && VALID_THEMES.includes(savedTheme.toLowerCase())) {
      _themeName = savedTheme.toLowerCase();
    } else {
      _themeName = 'slate';
    }

    _applyDomAttrs();
  })();

  // ---------------------------------------------------------------------------
  // 2. Single-Owner Legacy Zone Registry & Granular Slice Subscribers
  // ---------------------------------------------------------------------------
  const _zoneOwners = new Map(); // zoneKey -> ownerId
  const _subscribers = new Map(); // key -> { key, slices: Set<string>, render: Function }

  const regions = {
    claim(zoneKey, ownerId) {
      if (!zoneKey || !ownerId) return false;
      _zoneOwners.set(String(zoneKey), String(ownerId));
      return true;
    },
    release(zoneKey, ownerId) {
      const z = String(zoneKey);
      if (!_zoneOwners.has(z)) return false;
      if (ownerId && _zoneOwners.get(z) !== String(ownerId)) return false;
      return _zoneOwners.delete(z);
    },
    owns(zoneKey) {
      return _zoneOwners.has(String(zoneKey));
    },
    getOwner(zoneKey) {
      return _zoneOwners.get(String(zoneKey)) || null;
    },
    listOwners() {
      const out = {};
      _zoneOwners.forEach((owner, zone) => {
        out[zone] = owner;
      });
      return out;
    },
    register(key, config) {
      if (!key || !config || typeof config.render !== 'function') return false;
      const rawSlices = Array.isArray(config.slices) && config.slices.length > 0 ? config.slices : ['*'];
      _subscribers.set(String(key), {
        key: String(key),
        slices: new Set(rawSlices.map(s => String(s))),
        render: config.render
      });
      return true;
    },
    unregister(key) {
      return _subscribers.delete(String(key));
    },
    clearAll() {
      _zoneOwners.clear();
      _subscribers.clear();
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Coalesced Change Bus (1 flush per animation frame, or sync when forced)
  // ---------------------------------------------------------------------------
  let _rev = 0;
  let _pendingSlices = new Set();
  let _pendingMeta = {};
  let _rafHandle = null;

  function _resolveDocAndDerived(meta) {
    const store = typeof root !== 'undefined' ? root.CharStore : null;
    const doc = (meta && meta.doc)
      || (store && typeof store.getDoc === 'function' ? store.getDoc() : null)
      || (typeof root !== 'undefined' ? root.character || null : null);
    let derived = (meta && meta.derived) || null;
    if (!derived && store) {
      if (typeof store.getSheet === 'function') derived = store.getSheet();
      else if (typeof store.getState === 'function') derived = store.getState().sheet || null;
    }
    return { doc, derived };
  }

  function _flushBus() {
    _rafHandle = null;
    if (_pendingSlices.size === 0) return 0;

    const slicesArr = Array.from(_pendingSlices);
    const sliceSet = _pendingSlices;
    const meta = _pendingMeta;
    _pendingSlices = new Set();
    _pendingMeta = {};

    const isWildcard = sliceSet.has('*');
    const { doc, derived } = _resolveDocAndDerived(meta);
    const payload = {
      slices: slicesArr,
      rev: _rev,
      doc,
      derived,
      meta
    };

    let notified = 0;
    _subscribers.forEach(sub => {
      const wants = isWildcard || sub.slices.has('*') || slicesArr.some(s => sub.slices.has(s));
      if (!wants) return;
      try {
        sub.render(payload);
        notified++;
      } catch (err) {
        _reportErr(`bus:${sub.key}`, err);
      }
    });
    return notified;
  }

  const bus = {
    getRev() {
      return _rev;
    },
    emit(slices, meta = {}) {
      const list = Array.isArray(slices) ? slices : [slices];
      let added = false;
      for (const s of list) {
        if (s) {
          _pendingSlices.add(String(s));
          added = true;
        }
      }
      if (!added) return _rev;

      _rev += 1;
      _pendingMeta = Object.assign({}, _pendingMeta, meta || {});

      const forceSync = Boolean(meta && meta.sync) || typeof requestAnimationFrame !== 'function';
      if (forceSync) {
        if (_rafHandle !== null && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(_rafHandle);
          _rafHandle = null;
        }
        _flushBus();
      } else if (_rafHandle === null) {
        _rafHandle = requestAnimationFrame(() => {
          _flushBus();
        });
      }
      return _rev;
    },
    flushNow() {
      if (_rafHandle !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(_rafHandle);
        _rafHandle = null;
      }
      return _flushBus();
    }
  };

  // ---------------------------------------------------------------------------
  // 4. 4-Tier Resource-Aware Idle Warm-Up
  // ---------------------------------------------------------------------------
  let _warmupQueue = [];
  let _warmupRunning = false;
  let _warmupScheduled = false;
  let _warmupIdleId = null;
  let _warmupTimerId = null;
  let _warmupResumeTimer = null;
  let _warmupDone = [];
  let _warmupListenersAttached = false;

  const TIER2_TYPES = ['Spell', 'Feat', 'Equipment'];
  const TIER3_TYPES = ['Class', 'Race', 'Template', 'Domain', 'Maneuver', 'ClassAbility', 'Power', 'Monster'];

  function _clearWarmupHandles() {
    if (_warmupIdleId !== null && typeof cancelIdleCallback === 'function') {
      cancelIdleCallback(_warmupIdleId);
      _warmupIdleId = null;
    }
    if (_warmupTimerId !== null && typeof clearTimeout === 'function') {
      clearTimeout(_warmupTimerId);
      _warmupTimerId = null;
    }
    _warmupScheduled = false;
  }

  function _scheduleNextWarmupTick(delayMs) {
    if (_warmupScheduled || _warmupQueue.length === 0) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    _warmupScheduled = true;

    const runStep = (deadline) => {
      _warmupIdleId = null;
      _warmupTimerId = null;
      _warmupScheduled = false;
      if (typeof document !== 'undefined' && document.hidden) return;
      if (deadline && typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() <= 8) {
        _scheduleNextWarmupTick(80);
        return;
      }
      const task = _warmupQueue.shift();
      if (!task) {
        _warmupRunning = false;
        return;
      }
      Promise.resolve()
        .then(() => task.run())
        .then(() => {
          _warmupDone.push(task.id);
        })
        .catch(err => {
          _reportErr(`warmup:${task.id}`, err);
        })
        .finally(() => {
          if (_warmupQueue.length > 0) {
            _scheduleNextWarmupTick(60);
          } else {
            _warmupRunning = false;
          }
        });
    };

    if (delayMs > 0) {
      _warmupTimerId = setTimeout(() => {
        _warmupTimerId = null;
        _warmupScheduled = false;
        if (typeof requestIdleCallback === 'function') {
          _warmupScheduled = true;
          _warmupIdleId = requestIdleCallback(runStep, { timeout: 1500 });
        } else {
          runStep(null);
        }
      }, delayMs);
    } else if (typeof requestIdleCallback === 'function') {
      _warmupIdleId = requestIdleCallback(runStep, { timeout: 1500 });
    } else {
      _warmupTimerId = setTimeout(() => runStep(null), 120);
    }
  }

  function _attachWarmupPauseListeners() {
    if (_warmupListenersAttached || typeof document === 'undefined') return;
    _warmupListenersAttached = true;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        _clearWarmupHandles();
      } else if (_warmupQueue.length > 0) {
        _scheduleNextWarmupTick(250);
      }
    });

    const yieldToUserInput = () => {
      if (_warmupQueue.length === 0) return;
      _clearWarmupHandles();
      if (_warmupResumeTimer !== null) clearTimeout(_warmupResumeTimer);
      _warmupResumeTimer = setTimeout(() => {
        _warmupResumeTimer = null;
        if (_warmupQueue.length > 0) _scheduleNextWarmupTick(0);
      }, 600);
    };

    document.addEventListener('pointerdown', yieldToUserInput, { passive: true });
    document.addEventListener('keydown', yieldToUserInput, { passive: true });
  }

  const warmup = {
    getMaxTier(env) {
      const nav = (env && env.navigator) || (typeof navigator !== 'undefined' ? navigator : null);
      const win = (env && env.window) || (typeof window !== 'undefined' ? window : null);

      const conn = nav && nav.connection ? nav.connection : null;
      if (conn && conn.saveData) return 1;
      const eff = conn && typeof conn.effectiveType === 'string' ? conn.effectiveType.toLowerCase() : '';
      if (eff === 'slow-2g' || eff === '2g' || eff === '3g') return 1;

      const mem = nav && typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
      if (mem !== null && mem <= 4) return 1;

      const width = win && typeof win.innerWidth === 'number' ? win.innerWidth : 1280;
      if (width < 1024) return 1;

      return 3;
    },

    schedule(doc, env) {
      const maxTier = this.getMaxTier(env);
      const comp = typeof root !== 'undefined' ? root.SrdCompendium : null;
      const engine = typeof root !== 'undefined' ? root.RuleEngine : null;

      _clearWarmupHandles();
      _warmupQueue = [];
      _warmupRunning = true;

      // Tier 0: Index + Spotlight base
      _warmupQueue.push({
        id: 'T0:initIndex',
        tier: 0,
        run: () => (comp && typeof comp.initIndex === 'function' ? comp.initIndex() : Promise.resolve())
      });

      // Tier 1: Active character's required chunks
      if (doc && engine && typeof engine.collectRequiredChunks === 'function' && comp && typeof comp.ensureTypesLoaded === 'function') {
        const reqTypes = engine.collectRequiredChunks(doc);
        if (Array.isArray(reqTypes) && reqTypes.length > 0) {
          reqTypes.forEach(t => {
            _warmupQueue.push({
              id: `T1:${t}`,
              tier: 1,
              run: () => comp.ensureTypesLoaded([t])
            });
          });
        }
      }

      // Tier 2 & 3: Desktop-only background picker prefetch (1 chunk per idle task)
      if (maxTier >= 2 && comp && typeof comp.ensureTypesLoaded === 'function') {
        TIER2_TYPES.forEach(t => {
          _warmupQueue.push({
            id: `T2:${t}`,
            tier: 2,
            run: () => comp.ensureTypesLoaded([t])
          });
        });
      }
      if (maxTier >= 3 && comp && typeof comp.ensureTypesLoaded === 'function') {
        TIER3_TYPES.forEach(t => {
          _warmupQueue.push({
            id: `T3:${t}`,
            tier: 3,
            run: () => comp.ensureTypesLoaded([t])
          });
        });
      }

      _attachWarmupPauseListeners();
      _scheduleNextWarmupTick(300);
      return { maxTier, queued: _warmupQueue.length };
    },

    cancel() {
      _clearWarmupHandles();
      if (_warmupResumeTimer !== null) {
        clearTimeout(_warmupResumeTimer);
        _warmupResumeTimer = null;
      }
      _warmupQueue = [];
      _warmupRunning = false;
    },

    getStatus() {
      return {
        running: _warmupRunning,
        queued: _warmupQueue.length,
        completed: _warmupDone.slice()
      };
    }
  };

  const Sheet = {
    version: 'phase-0',
    shell,
    theme,
    regions,
    bus,
    warmup
  };

  if (typeof window !== 'undefined') {
    window.Sheet = Sheet;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sheet;
  }
})(typeof window !== 'undefined' ? window : globalThis);
