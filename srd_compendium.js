/**
 * ============================================================================
 * JOYFUL-FERMI D&D 3.5e — CANONICAL V2 SRD COMPENDIUM, ITEM ASSEMBLER & MIGRATOR
 * ============================================================================
 * Phase 2 Architecture Module (`srd_compendium.js`)
 * Exports:
 *   1. window.SrdCompendium  — O(1) In-Memory Map + Versioned IndexedDB Lazy Loader + Unified Search
 *   2. window.ItemAssembler  — Modular Lego Item Factory (Base + Material + Enh + Abilities)
 *   3. window.SchemaMigrator — Deterministic V1 -> V2 Gatekeeper (Zero-Patchwork Migration)
 * ============================================================================
 */
(function (global) {
  'use strict';

  const IDB_NAME = 'dnd35_srd_compendium_v2';
  const IDB_VERSION = 5;
  const IDB_STORE = 'chunks';

  const EAGER_CHUNKS = [
    'srd_equipment.json',
    'srd_feats.json',
    'srd_classes_races.json',
    'srd_combat_rules.json',
    'srd_spells.json',
    'srd_maneuvers.json',
    'mic_compendium.json',
    'srd_domains.json',
    'srd_companions.json',
    'srd_templates.json',
    'lego_patterns.json'
  ];

  const LAZY_CHUNKS = [
    'srd_monsters.json'
  ];

  // ==========================================================================
  // INTERNAL STATE
  // ==========================================================================
  const _byId = new Map();          // id -> V2 Entry
  const _byName = new Map();        // lower(name) -> V2 Entry
  const _byTypeAndName = new Map(); // lower(type) + ':' + lower(name) -> V2 Entry
  const _byType = new Map();        // lower(type) -> Array of V2 Entries (O(1) type bucket)
  const _loadedChunks = new Set();  // chunk filenames currently in memory
  const _chunkPromises = new Map(); // in-flight chunk load promises
  let _indexData = null;            // srd_index.json payload
  let _companionsData = null;       // srd_companions.json payload
  let _initPromise = null;
  let _ready = false;
  let _basePath = 'database';

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================
  function slugify(text, prefix) {
    const s = String(text || '')
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/\+/g, ' plus ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return prefix ? `${prefix}-${s}` : s;
  }

  function safeClone(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(obj);
      } catch (_) {
        // Fallback below
      }
    }
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizeNameKey(name) {
    return String(name || '')
      .replace(/[İIı]/g, 'i')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u')
      .replace(/[şŞ]/g, 's')
      .replace(/[öÖ]/g, 'o')
      .replace(/[çÇ]/g, 'c')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^↳\s*/, '')
      .trim();
  }

  // ==========================================================================
  // INDEXEDDB VERSIONED CACHE LAYER
  // ==========================================================================
  function openIdb() {
    return new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE, { keyPath: 'key' });
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  async function idbGet(key) {
    const db = await openIdb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  async function idbSet(key, hash, data) {
    const db = await openIdb();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put({
          key,
          hash,
          updatedAt: Date.now(),
          data
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (_) {
        resolve(false);
      }
    });
  }

  // ==========================================================================
  // IN-MEMORY INDEX REGISTRATION
  // ==========================================================================
  if (!Array.isArray(global.BUNDLED_SRD_CORE_CATALOG)) {
    global.BUNDLED_SRD_CORE_CATALOG = [];
  }
  const _catalogIds = new Set();

  function registerEntries(records) {
    if (records && typeof records === 'object' && !Array.isArray(records)) {
      if (Array.isArray(records.entries)) {
        records = records.entries;
      } else if (Array.isArray(records.patterns)) {
        global.LEGO_PATTERNS_CATALOG = records.patterns;
        return;
      } else {
        return;
      }
    }
    if (!Array.isArray(records)) return;
    if (!Array.isArray(global.BUNDLED_SRD_CORE_CATALOG)) {
      global.BUNDLED_SRD_CORE_CATALOG = [];
    }
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      if (!rec || !rec.id) continue;
      if (rec.isChild || rec.parent || String(rec.name || '').trim().startsWith('↳') || String(rec.id || '').includes('-sub-')) continue;
      const isNew = !_catalogIds.has(rec.id);
      _byId.set(rec.id, rec);
      if (isNew) {
        _catalogIds.add(rec.id);
        global.BUNDLED_SRD_CORE_CATALOG.push(rec);
        const typeBucketKey = String(rec.type || '').toLowerCase();
        if (typeBucketKey) {
          let bucket = _byType.get(typeBucketKey);
          if (!bucket) {
            bucket = [];
            _byType.set(typeBucketKey, bucket);
          }
          bucket.push(rec);
        }
      }
      const nKey = normalizeNameKey(rec.name);
      const tLow = String(rec.type || '').toLowerCase();
      const registerAliasKey = (aKey) => {
        if (!aKey) return;
        if (!_byName.has(aKey)) _byName.set(aKey, rec);
        const atKey = `${tLow}:${aKey}`;
        if (!_byTypeAndName.has(atKey)) _byTypeAndName.set(atKey, rec);
      };
      if (nKey) {
        if (!_byName.has(nKey)) {
          _byName.set(nKey, rec);
        }
        const tKey = `${tLow}:${nKey}`;
        _byTypeAndName.set(tKey, rec);
        if (nKey.includes(', ')) {
          const [p1, p2] = nKey.split(', ');
          if (p1 && p2) registerAliasKey(`${p2} ${p1}`);
        } else {
          const prefixMatch = nKey.match(/^(greater|lesser|mass|superior)\s+(.+)$/);
          if (prefixMatch) registerAliasKey(`${prefixMatch[2]}, ${prefixMatch[1]}`);
        }
        if (nKey === 'primal senses') registerAliasKey('primal sense');
      }
      if (Array.isArray(rec.aliases)) {
        for (const al of rec.aliases) {
          registerAliasKey(normalizeNameKey(al));
        }
      }
    }
    if (typeof global !== 'undefined') {
      global._srdCatalogVersion = (_catalogIds.size || 0);
    }
  }

  // Node (tests / tooling) has no fetch-backed chunk loading: read database files synchronously.
  function isNodeSyncEnv() {
    return typeof require === 'function' && (typeof window === 'undefined' || typeof window.fetch !== 'function');
  }

  function nodeReadDatabaseJson(fileName) {
    try {
      const fs = require('fs');
      const path = require('path');
      const p = path.resolve(__dirname, 'database', fileName);
      return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Lazy tier = every chunk flagged `eagerLoad: false` in srd_index.json (index-driven),
   * plus the static LAZY_CHUNKS fallback for when the index is not available yet.
   */
  function getLazyChunkNames() {
    const out = new Set(LAZY_CHUNKS);
    const chunks = _indexData && _indexData.chunks;
    if (chunks && typeof chunks === 'object') {
      Object.keys(chunks).forEach((name) => {
        const meta = chunks[name];
        if (meta && meta.eagerLoad === false && !EAGER_CHUNKS.includes(name)) out.add(name);
      });
    }
    return Array.from(out);
  }

  /** Opt-in chunks (index meta `optIn: true`, e.g. 3.0 / licensed content): loaded only on explicit request. */
  function getOptInChunkNames() {
    const chunks = (_indexData && _indexData.chunks) || {};
    return Object.keys(chunks).filter((name) => chunks[name] && chunks[name].optIn === true);
  }

  /**
   * Chunk files that hold index rows of the given record types (index-driven, so a new lazy chunk such as
   * srd_spells_splat.json is found without code changes). Opt-in chunks are left out unless `includeOptIn`.
   * Pickers ask for types, never for file names.
   */
  let _chunksByTypeCache = null;
  let _chunksByTypeSource = null;
  function getChunksForTypes(types, includeOptIn = false) {
    const idx = _indexData && Array.isArray(_indexData.index) ? _indexData.index : null;
    if (!idx) return [];
    if (_chunksByTypeSource !== _indexData) {
      _chunksByTypeCache = new Map();
      idx.forEach((row) => {
        if (!row || !row.f || !row.t) return;
        const t = String(row.t).toLowerCase();
        if (!_chunksByTypeCache.has(t)) _chunksByTypeCache.set(t, new Set());
        _chunksByTypeCache.get(t).add(row.f);
      });
      _chunksByTypeSource = _indexData;
    }
    const optIn = includeOptIn ? [] : getOptInChunkNames();
    const out = new Set();
    (Array.isArray(types) ? types : [types]).forEach((t) => {
      const files = _chunksByTypeCache.get(String(t || '').toLowerCase());
      if (files) files.forEach((f) => { if (!optIn.includes(f)) out.add(f); });
    });
    return Array.from(out);
  }

  // id -> index row, rebuilt whenever a different index payload is loaded
  let _indexRowsById = null;
  let _indexRowsSource = null;
  function indexRowById(id) {
    const rows = _indexData && Array.isArray(_indexData.index) ? _indexData.index : null;
    if (!rows) return null;
    if (_indexRowsSource !== rows) {
      _indexRowsById = new Map();
      for (let i = 0; i < rows.length; i++) if (rows[i] && rows[i].id) _indexRowsById.set(rows[i].id, rows[i]);
      _indexRowsSource = rows;
    }
    return _indexRowsById.get(id) || null;
  }

  // --------------------------------------------------------------------------
  // SRD SNAPSHOTS (tier-2 entries copied into character.customDb)
  // --------------------------------------------------------------------------
  const SNAPSHOT_ORIGIN = 'srd-snapshot';

  function isSnapshot(entry) {
    return Boolean(entry && entry._snapshot && entry._snapshot.origin === SNAPSHOT_ORIGIN);
  }

  // Deterministic JSON. Excluded so they never count as user edits: keys starting with "_"
  // (snapshot meta, UI scratch such as _originalIndex / _fuzzyScore) and empty defaults
  // (null, [], {}) that normalizers like RuleMaster.ensureV2 add to entries in place.
  function isEmptyDefault(v) {
    return v === undefined || v === null ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
  }

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value === undefined ? null : value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const keys = Object.keys(value).filter((k) => k.charAt(0) !== '_' && !isEmptyDefault(value[k])).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }

  // FNV-1a 32-bit over the stable JSON: change detection only, not security.
  function contentHash(entry) {
    const s = stableStringify(entry || null);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  function buildSnapshot(src) {
    const copy = safeClone(src);
    Object.keys(copy).forEach((k) => { if (k.charAt(0) === '_') delete copy[k]; });
    const idxHit = indexRowById(src.id);
    const chunkName = idxHit && idxHit.f ? idxHit.f : null;
    const chunkMeta = chunkName && _indexData && _indexData.chunks ? _indexData.chunks[chunkName] : null;
    copy._snapshot = {
      origin: SNAPSHOT_ORIGIN,
      srcId: src.id,
      chunk: chunkName,
      // Chunk file hash at copy time: while srd_index.json reports the same hash, the source cannot have
      // changed, so a character load does not need to download the chunk to reconcile this snapshot.
      chunkHash: chunkMeta && chunkMeta.hash ? chunkMeta.hash : null,
      srcHash: contentHash(src),
      takenAt: new Date().toISOString(),
      status: 'current'
    };
    return copy;
  }

  let _nodeSyncInitialized = false;
  function ensureNodeSyncLoaded() {
    if (_nodeSyncInitialized || _byId.size > 0) return;
    if (isNodeSyncEnv()) {
      _nodeSyncInitialized = true;
      try {
        const fs = require('fs');
        const path = require('path');
        if (!_indexData) _indexData = nodeReadDatabaseJson('srd_index.json');
        for (const chunk of EAGER_CHUNKS) {
          const p = path.resolve(__dirname, 'database', chunk);
          if (fs.existsSync(p)) {
            const records = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (chunk === 'srd_companions.json') _companionsData = records;
            registerEntries(records);
            _loadedChunks.add(chunk);
          }
        }
        _ready = true;
      } catch (_) {}
    }
  }

  async function fetchJsonChunk(fileName, expectedHash) {
    if (expectedHash) {
      const cached = await idbGet(fileName);
      if (cached && cached.hash === expectedHash && cached.data) {
        return cached.data;
      }
    }
    const url = `${_basePath}/${fileName}`;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`[SrdCompendium] Failed to fetch ${url} (${res.status})`);
    }
    const data = await res.json();
    if (expectedHash) {
      idbSet(fileName, expectedHash, data);
    }
    return data;
  }

  // ==========================================================================
  // 1. window.SrdCompendium PUBLIC API
  // ==========================================================================
  const SrdCompendium = {
    /**
     * Initializes the Modular V2 Compendium.
     * Preloads `srd_index.json` + the 4 core calculation chunks into O(1) memory maps.
     */
    async init(options = {}) {
      if (_initPromise) return _initPromise;
      if (options.basePath) _basePath = options.basePath.replace(/\/+$/, '');

      _initPromise = (async () => {
        try {
          // 1. IndexedDB-First (Stale-While-Revalidate): Resolve in ~10ms without blocking on network
          const cachedIdx = await idbGet('srd_index.json');
          if (cachedIdx && cachedIdx.data) {
            _indexData = cachedIdx.data;
          } else {
            try {
              const idxRes = await fetch(`${_basePath}/srd_index.json`);
              if (idxRes.ok) {
                _indexData = await idxRes.json();
                await idbSet('srd_index.json', _indexData.compendiumHash, _indexData);
              }
            } catch (_) {}
          }

          if (!_indexData) {
            console.warn('[SrdCompendium] srd_index.json unavailable.');
            return false;
          }

          // Lazy chunk names are derived from the index, so they are resolved after it loads.
          const optIn = getOptInChunkNames();
          const chunksToLoad = options.preloadAll
            ? [...EAGER_CHUNKS, ...getLazyChunkNames().filter((n) => !optIn.includes(n))]
            : EAGER_CHUNKS;

          // 2. Load eager chunks in parallel from IndexedDB cache (falling back to network only if missing)
          await Promise.all(chunksToLoad.map((fname) => SrdCompendium.ensureChunkLoaded(fname)));
          _ready = true;

          if (typeof global.dispatchEvent === 'function') {
            global.dispatchEvent(new CustomEvent('srdCompendiumReady', {
              detail: {
                totalIndexed: _indexData.totalEntries,
                loadedEntries: _byId.size,
                compendiumHash: _indexData.compendiumHash
              }
            }));
          }

          // 3. Non-blocking background hash revalidation when booted from IndexedDB cache
          if (cachedIdx && cachedIdx.data) {
            setTimeout(async () => {
              try {
                const bgRes = await fetch(`${_basePath}/srd_index.json`, { cache: 'no-cache' });
                if (!bgRes.ok) return;
                const remoteIdx = await bgRes.json();
                if (remoteIdx && remoteIdx.compendiumHash && remoteIdx.compendiumHash !== _indexData.compendiumHash) {
                  _indexData = remoteIdx;
                  await idbSet('srd_index.json', remoteIdx.compendiumHash, remoteIdx);
                  _loadedChunks.clear();
                  await Promise.all(chunksToLoad.map((fname) => SrdCompendium.ensureChunkLoaded(fname)));
                  if (typeof global.dispatchEvent === 'function') {
                    global.dispatchEvent(new CustomEvent('srdCompendiumReady', {
                      detail: {
                        totalIndexed: _indexData.totalEntries,
                        loadedEntries: _byId.size,
                        compendiumHash: _indexData.compendiumHash,
                        revalidated: true
                      }
                    }));
                  }
                }
              } catch (_) {}
            }, 1200);
          }

          return true;
        } catch (err) {
          console.error('[SrdCompendium] Initialization error:', err);
          return false;
        }
      })();

      return _initPromise;
    },

    get _ready() {
      return _ready;
    },

    isReady() {
      return _ready;
    },

    getIndexData() {
      return _indexData;
    },

    /**
     * O(1) lookup of all loaded SRD entries for a specific type ('Weapon', 'Armor', 'Shield', 'Feat', 'Spell', 'Maneuver', 'Race').
     */
    getByType(type) {
      if (!type) return [];
      return _byType.get(String(type).toLowerCase().trim()) || [];
    },

    /**
     * Ensures a specific chunk (e.g. 'srd_spells.json' or 'srd_monsters.json') is loaded into memory.
     */
    async ensureChunkLoaded(fileName) {
      if (_loadedChunks.has(fileName)) return true;
      if (_chunkPromises.has(fileName)) return _chunkPromises.get(fileName);

      if (isNodeSyncEnv()) {
        ensureNodeSyncLoaded();
        if (_loadedChunks.has(fileName)) return true;
        const records = nodeReadDatabaseJson(fileName);
        if (!records) return false;
        if (fileName === 'srd_companions.json') _companionsData = records;
        registerEntries(records);
        _loadedChunks.add(fileName);
        return records;
      }

      const p = (async () => {
        const meta = _indexData && _indexData.chunks && _indexData.chunks[fileName];
        const expectedHash = meta ? meta.hash : null;
        const records = await fetchJsonChunk(fileName, expectedHash);
        if (fileName === 'srd_companions.json') {
          _companionsData = records;
        }
        registerEntries(records);
        _loadedChunks.add(fileName);
        _chunkPromises.delete(fileName);
        return records;
      })();

      _chunkPromises.set(fileName, p);
      return p;
    },

    /**
     * Synchronous O(1) lookup by immutable ID (`wpn-longsword`, `feat-power-attack`, etc.).
     * Also checks dynamic `master_db` if not found in SRD.
     */
    getById(id) {
      if (!id) return null;
      ensureNodeSyncLoaded();
      const key = String(id).trim();
      if (_byId.has(key)) return _byId.get(key);

      // Check dynamic master_db if available
      const masterDb = SrdCompendium.getMasterDb();
      for (let i = 0; i < masterDb.length; i++) {
        if (masterDb[i] && masterDb[i].id === key) return masterDb[i];
      }
      return null;
    },

    /**
     * Synchronous O(1) lookup by name (and optional type filter).
     */
    getByName(name, typeFilter = null) {
      if (!name) return null;
      ensureNodeSyncLoaded();
      const raw = String(name).trim();
      if (_byId.has(raw)) return _byId.get(raw);

      let nKey = normalizeNameKey(raw);
      if (nKey.includes('bastard sword')) nKey = 'bastard sword';
      else if (nKey.includes('dwarven waraxe')) nKey = 'dwarven waraxe';

      if (typeFilter) {
        const tKey = `${String(typeFilter).toLowerCase()}:${nKey}`;
        if (_byTypeAndName.has(tKey)) return _byTypeAndName.get(tKey);
      }
      if (_byName.has(nKey)) return _byName.get(nKey);

      // Check dynamic master_db
      const masterDb = SrdCompendium.getMasterDb();
      for (let i = 0; i < masterDb.length; i++) {
        const m = masterDb[i];
        if (!m || !m.name) continue;
        if (normalizeNameKey(m.name) === nKey) {
          if (!typeFilter || String(m.type || '').toLowerCase() === String(typeFilter).toLowerCase()) {
            return m;
          }
        }
      }
      return null;
    },

    /**
     * Async lookup that automatically lazy-loads `srd_spells.json` or `srd_monsters.json` if needed.
     */
    async fetchEntry(idOrName, typeFilter = null) {
      if (isNodeSyncEnv()) ensureNodeSyncLoaded();
      else await SrdCompendium.init();
      let found = SrdCompendium.getById(idOrName) || SrdCompendium.getByName(idOrName, typeFilter);
      if (found) return found;

      // Search index to see which lazy chunk owns this entry
      if (_indexData && Array.isArray(_indexData.index)) {
        const nKey = normalizeNameKey(idOrName);
        const idxHit = _indexData.index.find(
          (x) => x.id === idOrName || normalizeNameKey(x.n) === nKey
        );
        if (idxHit && idxHit.f && !_loadedChunks.has(idxHit.f)) {
          await SrdCompendium.ensureChunkLoaded(idxHit.f);
          found = SrdCompendium.getById(idxHit.id) || SrdCompendium.getByName(idOrName, typeFilter);
        }
      }
      return found || null;
    },

    // ------------------------------------------------------------------------
    // TIERED LOOKUP + CHARACTER SNAPSHOTS
    // Tier 1: eager chunks (always in memory). Tier 2: lazy chunks (index-listed,
    // loaded on demand). An entry picked from a lazy chunk is copied into the
    // character's customDb as an `srd-snapshot`, so deriveSheet always resolves it
    // synchronously, offline, and in exported / synced characters.
    // ------------------------------------------------------------------------

    /** Names of chunks loaded on demand (index `eagerLoad: false`). */
    getLazyChunkNames() {
      return getLazyChunkNames();
    },

    /** Lazy chunks that are never auto-loaded (index `optIn: true`). */
    getOptInChunkNames() {
      return getOptInChunkNames();
    },

    /** Number of records currently in memory; changes whenever a chunk arrives (use it in picker cache keys). */
    getLoadedEntryCount() {
      return _byId.size;
    },

    /** Chunk files holding index rows of these record types (opt-in chunks only with `includeOptIn`). */
    getChunksForTypes(types, includeOptIn = false) {
      if (!_indexData && isNodeSyncEnv()) ensureNodeSyncLoaded();
      return getChunksForTypes(types, includeOptIn);
    },

    /**
     * Loads every chunk that holds records of these types (eager and lazy; opt-in only with `includeOptIn`).
     * Resolves to the file names that were not loaded before (empty when nothing new arrived), so a picker
     * redraws only when it gets new records: `ensureTypesLoaded(['Spell']).then(f => f.length && redraw())`.
     */
    async ensureTypesLoaded(types, includeOptIn = false) {
      if (!_indexData && isNodeSyncEnv()) ensureNodeSyncLoaded();
      const missing = getChunksForTypes(types, includeOptIn).filter((f) => !_loadedChunks.has(f));
      if (missing.length === 0) return [];
      await Promise.all(missing.map((f) => SrdCompendium.ensureChunkLoaded(f)));
      return missing;
    },

    /**
     * Synchronous: for every referenced name that currently resolves to an SRD record from a lazy
     * chunk (i.e. the chunk is in memory this session), make sure an `srd-snapshot` exists in customDb.
     * Keeps characters self-contained (export / sync / next page load) without waiting for a reload.
     * Returns the ids added.
     */
    snapshotLazyRefs(customDb, names, typeFilter = null) {
      const added = [];
      if (!Array.isArray(customDb) || !Array.isArray(names) || names.length === 0) return added;
      const lazy = getLazyChunkNames();
      if (lazy.length === 0) return added;
      const have = new Set(customDb.map((e) => e && e.id).filter(Boolean));
      for (let i = 0; i < names.length; i++) {
        const nm = String(names[i] || '').trim();
        if (!nm) continue;
        const nKey = normalizeNameKey(nm);
        const rec = (typeFilter && _byTypeAndName.get(`${String(typeFilter).toLowerCase()}:${nKey}`)) || _byName.get(nKey);
        if (!rec || !rec.id || have.has(rec.id) || _byId.get(rec.id) !== rec) continue;
        const row = indexRowById(rec.id);
        if (!row || !row.f || !lazy.includes(row.f)) continue;
        customDb.push(buildSnapshot(rec));
        have.add(rec.id);
        added.push(rec.id);
      }
      return added;
    },

    isChunkLoaded(fileName) {
      return _loadedChunks.has(fileName);
    },

    /** Index row (`{id, n, t, c, f, ...}`) for an id or name, optionally type-filtered. */
    findIndexEntry(idOrName, typeFilter = null) {
      if (!idOrName) return null;
      if (!_indexData && isNodeSyncEnv()) ensureNodeSyncLoaded();
      const idx = _indexData && Array.isArray(_indexData.index) ? _indexData.index : null;
      if (!idx) return null;
      const raw = String(idOrName).trim();
      const byId = indexRowById(raw);
      if (byId) return byId;
      const nKey = normalizeNameKey(raw);
      const tLow = typeFilter ? String(typeFilter).toLowerCase() : null;
      for (let i = 0; i < idx.length; i++) {
        const it = idx[i];
        if (!it) continue;
        if (it.id === raw) return it;
        if (normalizeNameKey(it.n) === nKey && (!tLow || String(it.t || '').toLowerCase() === tLow)) return it;
      }
      return null;
    },

    /** True when the entry lives in a lazy (tier 2) chunk. */
    isLazyEntry(idOrName, typeFilter = null) {
      const it = SrdCompendium.findIndexEntry(idOrName, typeFilter);
      return Boolean(it && it.f && getLazyChunkNames().includes(it.f));
    },

    /** Stable content hash of an entry, ignoring snapshot metadata. */
    contentHash(entry) {
      return contentHash(entry);
    },

    /**
     * Loads the entry (lazy chunk if needed) and returns a detached copy tagged with
     * `_snapshot: { origin: 'srd-snapshot', srcId, chunk, srcHash, takenAt }`.
     */
    async snapshotEntry(idOrName, typeFilter = null) {
      const src = await SrdCompendium.fetchEntry(idOrName, typeFilter);
      if (!src) return null;
      return buildSnapshot(src);
    },

    /** Synchronous variant for entries whose chunk is already in memory. */
    snapshotLoadedEntry(idOrName, typeFilter = null) {
      const raw = String(idOrName || '').trim();
      const src = _byId.get(raw) || (() => {
        const hit = SrdCompendium.getByName(raw, typeFilter);
        return hit && _byId.get(hit.id) === hit ? hit : null;
      })();
      return src ? buildSnapshot(src) : null;
    },

    /**
     * Inserts or refreshes a snapshot in a customDb array. A user-authored entry with the
     * same id (no `_snapshot`) is never overwritten. Returns 'added' | 'updated' | 'kept'.
     */
    upsertSnapshot(customDb, snapshot) {
      if (!Array.isArray(customDb) || !snapshot || !snapshot.id) return 'kept';
      const i = customDb.findIndex((e) => e && e.id === snapshot.id);
      if (i < 0) {
        customDb.push(snapshot);
        return 'added';
      }
      const existing = customDb[i];
      if (!isSnapshot(existing)) return 'kept';
      if (contentHash(existing) !== existing._snapshot.srcHash) return 'kept';
      customDb[i] = snapshot;
      return 'updated';
    },

    /**
     * Copies an index-listed entry into the customDb when it lives in a lazy chunk.
     * Eager (tier 1) entries are not copied: they are always in memory.
     */
    async ensureEntryInCustomDb(customDb, idOrName, typeFilter = null) {
      if (!Array.isArray(customDb) || !SrdCompendium.isLazyEntry(idOrName, typeFilter)) return null;
      const snap = await SrdCompendium.snapshotEntry(idOrName, typeFilter);
      if (!snap) return null;
      SrdCompendium.upsertSnapshot(customDb, snap);
      return customDb.find((e) => e && e.id === snap.id) || snap;
    },

    /**
     * Character-load reconciliation of `srd-snapshot` entries against the current SRD data:
     * - unmodified + SRD changed  -> refreshed in place ('autoUpdated')
     * - user-modified + SRD changed -> kept, flagged `_snapshot.status = 'update-available'`
     * - source no longer in the SRD -> kept, flagged 'orphaned'
     */
    async reconcileSnapshots(customDb) {
      if (Array.isArray(customDb)) {
        const needed = new Set();
        const chunks = (_indexData && _indexData.chunks) || {};
        customDb.forEach((e) => {
          if (!isSnapshot(e) || !e._snapshot.chunk || _loadedChunks.has(e._snapshot.chunk)) return;
          const current = chunks[e._snapshot.chunk] && chunks[e._snapshot.chunk].hash;
          // Unchanged chunk since the copy was taken: nothing to reconcile, keep the chunk unloaded.
          if (e._snapshot.chunkHash && current && e._snapshot.chunkHash === current) return;
          needed.add(e._snapshot.chunk);
        });
        for (const chunk of needed) {
          try { await SrdCompendium.ensureChunkLoaded(chunk); } catch (_) {}
        }
      }
      return SrdCompendium.reconcileSnapshotsSync(customDb);
    },

    /** Synchronous core of reconcileSnapshots: assumes the snapshot source chunks are loaded. */
    reconcileSnapshotsSync(customDb) {
      const result = { checked: 0, autoUpdated: [], updateAvailable: [], orphaned: [], changed: false };
      if (!Array.isArray(customDb)) return result;
      for (let i = 0; i < customDb.length; i++) {
        const e = customDb[i];
        if (!isSnapshot(e)) continue;
        result.checked++;
        const meta = e._snapshot;
        if (meta.chunk && !_loadedChunks.has(meta.chunk)) continue; // source unavailable right now: leave as is
        const src = _byId.get(meta.srcId || e.id) || null;
        let status;
        if (!src) {
          status = 'orphaned';
          result.orphaned.push(e.id);
        } else {
          const latest = contentHash(src);
          if (latest === meta.srcHash) {
            status = 'current';
          } else if (contentHash(e) === meta.srcHash) {
            customDb[i] = buildSnapshot(src);
            result.autoUpdated.push(e.id);
            result.changed = true;
            continue;
          } else {
            status = 'update-available';
            result.updateAvailable.push(e.id);
          }
        }
        if (meta.status !== status) {
          meta.status = status;
          result.changed = true;
        }
      }
      return result;
    },

    /**
     * Migration path: snapshots referenced names that no longer resolve from memory
     * (e.g. after a chunk moved to the lazy tier). Returns the ids that were added.
     */
    async resolveMissingRefs(customDb, names, typeFilter = null) {
      const added = [];
      if (!Array.isArray(customDb) || !Array.isArray(names)) return added;
      const seen = new Set();
      for (let i = 0; i < names.length; i++) {
        const name = String(names[i] || '').trim();
        const key = normalizeNameKey(name);
        if (!name || seen.has(key)) continue;
        seen.add(key);
        if (SrdCompendium.getByName(name, typeFilter)) continue;
        const snap = await SrdCompendium.ensureEntryInCustomDb(customDb, name, typeFilter);
        if (snap) added.push(snap.id);
      }
      return added;
    },

    /** Removes a snapshot's update flag by refreshing it to the current SRD version. */
    applySnapshotUpdate(customDb, id) {
      if (!Array.isArray(customDb)) return false;
      const i = customDb.findIndex((e) => e && e.id === id);
      if (i < 0 || !isSnapshot(customDb[i])) return false;
      const src = _byId.get(customDb[i]._snapshot.srcId || id);
      if (!src) return false;
      customDb[i] = buildSnapshot(src);
      return true;
    },

    /**
     * Deep-clones an entry by ID or name for safe attachment to a character sheet.
     */
    cloneEntry(idOrName, typeFilter = null) {
      const entry = SrdCompendium.getById(idOrName) || SrdCompendium.getByName(idOrName, typeFilter);
      return entry ? safeClone(entry) : null;
    },

    /**
     * Returns all loaded entries matching an optional filter predicate or type.
     */
    getAllLoaded(typeFilter = null) {
      ensureNodeSyncLoaded();
      if (!typeFilter) {
        return Array.from(_byId.values());
      }
      const types = Array.isArray(typeFilter) ? typeFilter : [typeFilter];
      const out = [];
      for (let i = 0; i < types.length; i++) {
        const bucket = _byType.get(String(types[i] || '').toLowerCase().trim());
        if (bucket && bucket.length > 0) {
          for (let j = 0; j < bucket.length; j++) out.push(bucket[j]);
        }
      }
      return out;
    },

    /**
     * Returns the active character's customDb (`window.masterDb` per ADR-011).
     */
    getMasterDb() {
      return Array.isArray(global.masterDb) ? global.masterDb : [];
    },

    /**
     * Bounded Levenshtein edit distance (returns maxDist + 1 if distance exceeds maxDist).
     */
    _boundedLevenshtein(a, b, maxDist = 2) {
      if (a === b) return 0;
      const la = a.length;
      const lb = b.length;
      if (Math.abs(la - lb) > maxDist) return maxDist + 1;
      if (la === 0) return lb <= maxDist ? lb : maxDist + 1;
      if (lb === 0) return la <= maxDist ? la : maxDist + 1;

      let prev = new Array(lb + 1);
      let curr = new Array(lb + 1);
      for (let j = 0; j <= lb; j++) prev[j] = j;

      for (let i = 1; i <= la; i++) {
        curr[0] = i;
        let rowMin = curr[0];
        const ca = a.charCodeAt(i - 1);
        for (let j = 1; j <= lb; j++) {
          const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
          const val = Math.min(
            prev[j] + 1,
            curr[j - 1] + 1,
            prev[j - 1] + cost
          );
          curr[j] = val;
          if (val < rowMin) rowMin = val;
        }
        if (rowMin > maxDist) return maxDist + 1;
        const tmp = prev;
        prev = curr;
        curr = tmp;
      }
      return prev[lb];
    },

    /**
     * Returns true if all characters of needle appear in target in order.
     */
    _isOrderedSubsequence(needle, target) {
      if (!needle) return true;
      if (!target || needle.length > target.length) return false;
      let i = 0;
      for (let j = 0; j < target.length && i < needle.length; j++) {
        if (needle.charCodeAt(i) === target.charCodeAt(j)) i++;
      }
      return i === needle.length;
    },

    /**
     * Typo-tolerant Fuzzy Relevance Scorer for Spotlight & Compendium searches.
     * Ranks Exact (1000) > Prefix (500-600) > Name Substring (250-350) > All Name Tokens (220)
     * > Name-word Levenshtein Typo (140-200) > Name Subsequence (115) > Haystack Substring (80).
     */
    fuzzyScore(query, targetName, haystack = '') {
      const q = normalizeNameKey(query);
      if (!q) return 100;
      const nLower = normalizeNameKey(targetName);
      const hLower = haystack ? normalizeNameKey(haystack) : '';
      if (!nLower && !hLower) return 0;
      const qClean = q.replace(/[^a-z0-9]/g, '');
      const nClean = nLower.replace(/[^a-z0-9]/g, '');

      const matchesSubstringOrWordPrefix = (text, needle) => {
        if (!text || !needle) return false;
        if (needle.length >= 4) return text.includes(needle);
        const words = text.split(/[^a-z0-9]+/).filter(Boolean);
        return words.some(w => w.startsWith(needle));
      };

      if (nLower === q || (qClean && nClean === qClean)) {
        return 1000;
      }
      if (nLower.startsWith(q) || (qClean.length >= 3 && nClean.startsWith(qClean))) {
        return 600 - Math.min(100, nLower.length);
      }
      if (matchesSubstringOrWordPrefix(nLower, q) || (qClean.length >= 4 && nClean.includes(qClean))) {
        const idx = nLower.indexOf(q);
        return 350 - Math.min(100, idx >= 0 ? idx : 0);
      }

      const qTokens = q.split(/\s+/).filter(Boolean);
      const allNameTokens = nLower && qTokens.length > 0 && qTokens.every(tok => matchesSubstringOrWordPrefix(nLower, tok) || (tok.length >= 4 && nClean.includes(tok)));
      if (allNameTokens) {
        return 220;
      }

      // Typo-tolerant per-token Levenshtein against target NAME words (requires >= 4 chars per typo token)
      const targetWords = nLower.split(/[^a-z0-9]+/).filter(Boolean);
      if (targetWords.length > 0 && qTokens.length > 0) {
        let totalDist = 0;
        let allTokensMatched = true;
        for (let i = 0; i < qTokens.length; i++) {
          const qt = qTokens[i].replace(/[^a-z0-9]/g, '');
          if (!qt) continue;
          if (matchesSubstringOrWordPrefix(nLower, qt) || (qt.length >= 4 && nClean.includes(qt))) continue;
          if (qt.length < 4) {
            allTokensMatched = false;
            break;
          }
          const maxDist = qt.length >= 6 ? 2 : 1;
          let bestWordDist = maxDist + 1;
          for (let w = 0; w < targetWords.length; w++) {
            const tw = targetWords[w];
            const d = SrdCompendium._boundedLevenshtein(qt, tw, maxDist);
            if (d < bestWordDist) bestWordDist = d;
            if (bestWordDist === 0) break;
          }
          if (bestWordDist <= maxDist) {
            totalDist += bestWordDist;
          } else {
            allTokensMatched = false;
            break;
          }
        }
        if (allTokensMatched) {
          return Math.max(140, 200 - totalDist * 20);
        }
      }

      // Ordered subsequence fallback on target name when first character matches (e.g. "scimtr" -> "scimitar")
      if (qClean.length >= 4 && nClean.length >= qClean.length && qClean[0] === nClean[0] && (nClean.length - qClean.length) <= 4) {
        if (SrdCompendium._isOrderedSubsequence(qClean, nClean)) {
          return 115;
        }
      }

      // Haystack / description substring or token match ranks below name matches
      if (hLower) {
        const fullHaystack = `${nLower} ${hLower}`;
        if (matchesSubstringOrWordPrefix(fullHaystack, q) || (qTokens.length > 0 && qTokens.every(tok => matchesSubstringOrWordPrefix(fullHaystack, tok)))) {
          return 80;
        }
      }

      return 0;
    },

    /**
     * Unified Search across all 3,522 SRD Index entries AND the user's dynamic Master DB.
     * Supports type, category, slot, level, isFighterBonusFeat, and resolveFull options.
     */
    search(query = '', filters = {}) {
      const q = normalizeNameKey(query);
      const limit = filters.limit || 50;
      const includeMasterDb = filters.includeMasterDb !== false;
      const resolveFull = filters.resolveFull !== false;

      const allowedTypes = filters.type
        ? new Set(
            (Array.isArray(filters.type) ? filters.type : [filters.type]).map((t) =>
              String(t).toLowerCase()
            )
          )
        : null;
      const catFilter = filters.category ? String(filters.category).toLowerCase() : null;
      const slotFilter = filters.slot ? String(filters.slot).toLowerCase() : null;
      const fighterOnly = Boolean(filters.isFighterBonusFeat);
      const levelFilter = filters.level !== undefined && filters.level !== null && filters.level !== ''
        ? Number(filters.level)
        : null;

      const scored = [];
      const seenIds = new Set();

      function scoreCandidate(id, name, type, category, slot, level, isFb, sourceObj, isCustom) {
        if (!id || seenIds.has(id)) return;
        const tLower = String(type || '').toLowerCase();
        const cLower = String(category || '').toLowerCase();
        const sLower = String(slot || '').toLowerCase();

        if (allowedTypes && !allowedTypes.has(tLower)) return;
        if (catFilter && !cLower.includes(catFilter)) return;
        if (slotFilter && sLower !== slotFilter) return;
        if (fighterOnly && !isFb) return;
        if (levelFilter !== null && Number(level) !== levelFilter) return;

        let score = (q && isCustom) ? 5 : 0;
        if (q) {
          const fScore = SrdCompendium.fuzzyScore(q, name, `${cLower} ${tLower} ${sLower}`);
          if (fScore <= 0) return;
          score += fScore;
        } else {
          score += 100;
        }

        seenIds.add(id);
        scored.push({
          score,
          id,
          name,
          type,
          category,
          slot,
          level,
          isFighterBonusFeat: Boolean(isFb),
          sourceObj
        });
      }

      // 1. Scan User Master DB first
      if (includeMasterDb) {
        const masterDb = SrdCompendium.getMasterDb();
        for (let i = 0; i < masterDb.length; i++) {
          const m = SchemaMigrator.upgradeEntryToV2(masterDb[i]);
          if (!m || m.type === 'HouseRule') continue;
          scoreCandidate(
            m.id,
            m.name,
            m.type,
            m.category,
            m.slot,
            m.level !== undefined ? m.level : m.cr,
            m.isFighterBonusFeat,
            m,
            true
          );
        }
      }

      // 2. Scan SRD Index (or in-memory Map if index not yet loaded)
      if (_indexData && Array.isArray(_indexData.index)) {
        const idxArr = _indexData.index;
        for (let i = 0; i < idxArr.length; i++) {
          const it = idxArr[i];
          scoreCandidate(
            it.id,
            it.n,
            it.t,
            it.c,
            it.s,
            it.l,
            Boolean(it.fb),
            it,
            false
          );
        }
      } else {
        _byId.forEach((rec) => {
          scoreCandidate(
            rec.id,
            rec.name,
            rec.type,
            rec.category,
            rec.slot,
            rec.level !== undefined ? rec.level : rec.cr,
            rec.isFighterBonusFeat,
            rec,
            false
          );
        });
      }

      scored.sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)));
      const sliced = scored.slice(0, limit);

      if (!resolveFull) return sliced;
      return sliced.map((hit) => {
        const full = _byId.get(hit.id);
        if (full) return full;
        if (hit.sourceObj && hit.sourceObj.schemaVersion === 2) return hit.sourceObj;
        return {
          id: hit.id,
          schemaVersion: 2,
          name: hit.name,
          type: hit.type,
          category: hit.category,
          slot: hit.slot,
          level: hit.level,
          isFighterBonusFeat: hit.isFighterBonusFeat,
          _chunkFile: hit.sourceObj ? hit.sourceObj.f : null,
          _isIndexStub: true
        };
      });
    },

    _ensureNodeEquipmentLoaded() {
      if (this.getAllLoaded('Material').length === 0 && typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          const path = require('path');
          ['database/srd_equipment.json', 'database/mic_compendium.json'].forEach((rel) => {
            const p = path.resolve(__dirname, rel);
            if (fs.existsSync(p)) {
              const records = JSON.parse(fs.readFileSync(p, 'utf8'));
              registerEntries(records);
            }
          });
        } catch (_) {}
      }
    },

    getMaterials() {
      this._ensureNodeEquipmentLoaded();
      return this.getAllLoaded('Material');
    },

    getEnhancements(targetType = null) {
      this._ensureNodeEquipmentLoaded();
      const list = this.getAllLoaded('Enhancement');
      if (!targetType) return list;
      if (targetType === 'Shield' || targetType === 'Armor') {
        return list.filter((e) => {
          if (!e.targetType || e.targetType === 'Any') return true;
          if (e.targetType !== 'Armor' && e.targetType !== 'Shield') return false;
          const applies = String(e.appliesTo || '').toLowerCase().trim();
          if (targetType === 'Shield' && applies === 'armor') return false;
          if (targetType === 'Armor' && applies === 'shield') return false;
          return true;
        });
      }
      return list.filter((e) => !e.targetType || e.targetType === targetType || e.targetType === 'Any');
    },

    getCrystals(targetType = null) {
      this._ensureNodeEquipmentLoaded();
      const list = this.getAllLoaded('AugmentationCrystal');
      if (!targetType) return list;
      const t = targetType.toLowerCase();
      return list.filter((c) => {
        const ct = (c.targetType || c.slot || '').toLowerCase();
        return ct.includes(t);
      });
    },

    getAllFeats() {
      let list = this.getAllLoaded(['Feat', 'Flaw']);
      if (list.length === 0 && typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          const path = require('path');
          const p = path.resolve(__dirname, 'database/srd_feats.json');
          if (fs.existsSync(p)) {
            const records = JSON.parse(fs.readFileSync(p, 'utf8'));
            registerEntries(records);
            list = this.getAllLoaded(['Feat', 'Flaw']);
          }
        } catch (_) {}
      }
      if (list.length === 0 && Array.isArray(_index) && _index.length > 0) {
        return _index.filter(r => r && (r.t === 'Feat' || r.t === 'Flaw')).map(r => ({
          id: r.id,
          name: r.n,
          type: r.t || 'Feat',
          category: r.c || (r.t === 'Flaw' ? 'Flaw' : 'General')
        }));
      }
      return list;
    },

    getAllSpells() {
      let list = this.getAllLoaded('Spell');
      if (list.length === 0 && typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          const path = require('path');
          const p = path.resolve(__dirname, 'database/srd_spells.json');
          if (fs.existsSync(p)) {
            const records = JSON.parse(fs.readFileSync(p, 'utf8'));
            registerEntries(records);
            list = this.getAllLoaded('Spell');
          }
        } catch (_) {}
      }
      if (list.length === 0 && Array.isArray(_index) && _index.length > 0) {
        return _index.filter(r => r && r.t === 'Spell').map(r => ({
          id: r.id,
          name: r.n,
          type: 'Spell',
          school: r.c || 'Universal',
          level: r.l !== undefined ? r.l : 1
        }));
      }
      return list;
    },

    getAllDomains() {
      let list = this.getAllLoaded('Domain');
      if (list.length === 0 && typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          const path = require('path');
          const p = path.resolve(__dirname, 'database/srd_domains.json');
          if (fs.existsSync(p)) {
            const records = JSON.parse(fs.readFileSync(p, 'utf8'));
            registerEntries(records);
            list = this.getAllLoaded('Domain');
          }
        } catch (_) {}
      }

      const byKey = new Map();
      list.forEach((d) => {
        if (d && d.name) byKey.set(String(d.name).toLowerCase().trim(), d);
      });

      const mergeDomainOverride = (entry) => {
        if (!entry || !entry.name) return;
        const isDom = String(entry.type || '').toLowerCase() === 'domain' || String(entry.category || '').toLowerCase().includes('domain') || String(entry.id || '').startsWith('dom-');
        if (!isDom) return;
        const key = String(entry.name).toLowerCase().trim();
        byKey.set(key, entry);
      };

      // 1. Merge Custom Domains cached in localStorage
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem('dnd35_custom_domains');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) parsed.forEach(mergeDomainOverride);
          }
        } catch (_) {}
      }

      // 2. Merge Custom Domains from character.customDb & masterDb (takes highest precedence)
      if (typeof window !== 'undefined') {
        if (window.character && Array.isArray(window.character.customDb)) {
          window.character.customDb.forEach(mergeDomainOverride);
        }
        if (Array.isArray(window.masterDb)) {
          window.masterDb.forEach(mergeDomainOverride);
        }
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        masterDb.forEach(mergeDomainOverride);
      }

      return Array.from(byKey.values());
    },

    getDomain(idOrName) {
      if (!idOrName) return null;
      const allDom = this.getAllDomains();
      const raw = String(idOrName).trim();
      const rawLower = raw.toLowerCase();
      const slug = `dom-${rawLower.replace(/[^a-z0-9]+/g, '-')}`;
      const match = allDom.find((d) => d && (d.id === raw || d.id === slug || String(d.name || '').toLowerCase().trim() === rawLower));
      if (match) return match;
      const byId = this.getById(raw);
      if (byId && byId.type === 'Domain') return byId;
      const bySlug = this.getById(slug);
      if (bySlug && bySlug.type === 'Domain') return bySlug;
      return this.getByName(raw, 'Domain') || null;
    },

    getAllTemplates() {
      let list = this.getAllLoaded('Template');
      if (list.length === 0 && typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          const path = require('path');
          const p = path.resolve(__dirname, 'database/srd_templates.json');
          if (fs.existsSync(p)) {
            const records = JSON.parse(fs.readFileSync(p, 'utf8'));
            registerEntries(records);
            list = this.getAllLoaded('Template');
          }
        } catch (_) {}
      }
      if (typeof window !== 'undefined' && Array.isArray(window.masterDb)) {
        const seenIds = new Set(list.map(t => t && t.id));
        const seenNames = new Set(list.map(t => normalizeNameKey(t && t.name)));
        for (const entry of window.masterDb) {
          if (entry && (entry.type === 'Template' || String(entry.category || '').toLowerCase().includes('template'))) {
            const nKey = normalizeNameKey(entry.name);
            if (!seenIds.has(entry.id) && !seenNames.has(nKey)) {
              list.push(entry);
              if (entry.id) seenIds.add(entry.id);
              if (nKey) seenNames.add(nKey);
            }
          }
        }
      }
      return list;
    },

    getTemplate(idOrName) {
      if (!idOrName) return null;
      const list = this.getAllTemplates();
      const raw = String(typeof idOrName === 'object' ? (idOrName.id || idOrName.name || '') : idOrName).trim();
      if (!raw) return null;
      const byId = this.getById(raw);
      if (byId && byId.type === 'Template') return byId;
      const cleanSlug = raw.toLowerCase().replace(/\s*\(template\)\s*$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const bySlug = this.getById(`tmpl-${cleanSlug}`);
      if (bySlug && bySlug.type === 'Template') return bySlug;
      const byName = this.getByName(raw, 'Template') || this.getByName(raw.replace(/\s*\(template\)\s*$/i, ''), 'Template');
      if (byName) return byName;
      const nKey = normalizeNameKey(raw.replace(/\s*\(template\)\s*$/i, ''));
      return list.find(t => t && (
        t.id === raw ||
        normalizeNameKey(t.name) === nKey ||
        (Array.isArray(t.aliases) && t.aliases.some(a => normalizeNameKey(a) === nKey || normalizeNameKey(a) === normalizeNameKey(raw)))
      )) || list.find(t => t && normalizeNameKey(t.name).startsWith(nKey + ' (')) || null;
    },

    getAllClasses() {
      let list = this.getAllLoaded('Class');
      if (list.length === 0 && typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          const path = require('path');
          const p = path.resolve(__dirname, 'database/srd_classes_races.json');
          if (fs.existsSync(p)) {
            const records = JSON.parse(fs.readFileSync(p, 'utf8'));
            registerEntries(records);
            list = this.getAllLoaded('Class');
          }
        } catch (_) {}
      }
      return list;
    },

    getClass(idOrName) {
      if (!idOrName) return null;
      this.getAllClasses();
      const raw = String(idOrName).trim();
      const byId = this.getById(raw);
      if (byId && byId.type === 'Class') return byId;
      const bySlug = this.getById(`cls-${raw.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
      if (bySlug && bySlug.type === 'Class') return bySlug;
      return this.getByName(raw, 'Class');
    },

    getCompanionsData() {
      if (!_companionsData && typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          const path = require('path');
          const p = path.resolve(__dirname, 'database/srd_companions.json');
          if (fs.existsSync(p)) {
            _companionsData = JSON.parse(fs.readFileSync(p, 'utf8'));
          }
        } catch (_) {}
      }
      return _companionsData;
    },

    getDruidCompanionProgression(effectiveLevel = 1) {
      const data = this.getCompanionsData();
      if (!data || !Array.isArray(data.druidProgression)) return null;
      const lvl = Math.max(1, parseInt(effectiveLevel, 10) || 1);
      return data.druidProgression.find(p => lvl >= p.minLevel && lvl <= p.maxLevel) || data.druidProgression[0];
    },

    getFamiliarProgression(masterLevel = 1) {
      const data = this.getCompanionsData();
      if (!data || !Array.isArray(data.familiarProgression)) return null;
      const lvl = Math.max(1, parseInt(masterLevel, 10) || 1);
      return data.familiarProgression.find(p => lvl >= p.minLevel && lvl <= p.maxLevel) || data.familiarProgression[0];
    },

    getPaladinMountProgression(paladinLevel = 5) {
      const data = this.getCompanionsData();
      if (!data || !Array.isArray(data.paladinMountProgression)) return null;
      const lvl = Math.max(5, parseInt(paladinLevel, 10) || 5);
      return data.paladinMountProgression.find(p => lvl >= p.minLevel && lvl <= p.maxLevel) || data.paladinMountProgression[0];
    },

    getAllowedAnimals(type = 'animal_companion') {
      const data = this.getCompanionsData();
      if (!data) return [];
      if (type === 'familiar') return data.familiarAllowedAnimals || [];
      if (type === 'special_mount') return data.paladinAllowedMounts || [];
      return data.druidAllowedAnimals || [];
    },

    calculateCompanionStats(char, companionConfig) {
      if (!companionConfig || !companionConfig.baseMonsterId) return null;
      let baseMonster = this.getById(companionConfig.baseMonsterId);
      if (!baseMonster && typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          const path = require('path');
          const p = path.resolve(__dirname, 'database/srd_monsters.json');
          if (fs.existsSync(p)) {
            const list = JSON.parse(fs.readFileSync(p, 'utf8'));
            baseMonster = list.find(m => m.id === companionConfig.baseMonsterId) || null;
          }
        } catch (_) {}
      }
      if (!baseMonster) return null;

      const compData = this.getCompanionsData() || {};
      const type = companionConfig.type || 'animal_companion';
      const customName = companionConfig.name || baseMonster.name;

      // 1. Effective Level Calculation
      let effectiveLevel = 1;
      const classesStr = (char && char.classes) ? String(char.classes) : '';
      const druidMatch = classesStr.match(/druid\s*(\d+)/i);
      const rangerMatch = classesStr.match(/ranger\s*(\d+)/i);
      const wizardMatch = classesStr.match(/wizard\s*(\d+)/i);
      const sorcererMatch = classesStr.match(/sorcerer\s*(\d+)/i);
      const paladinMatch = classesStr.match(/paladin\s*(\d+)/i);

      if (type === 'animal_companion') {
        let lvl = 0;
        if (druidMatch) lvl += parseInt(druidMatch[1], 10);
        if (rangerMatch) {
          const rLvl = parseInt(rangerMatch[1], 10);
          if (rLvl >= 4) lvl += Math.floor(rLvl / 2);
        }
        if (lvl === 0 && char && char.level) lvl = parseInt(char.level, 10);
        const allowedList = compData.druidAllowedAnimals || [];
        const allowedEntry = allowedList.find(a => a.id === companionConfig.baseMonsterId);
        const adj = (allowedEntry && allowedEntry.levelAdj) ? allowedEntry.levelAdj : 0;
        effectiveLevel = Math.max(1, (lvl || 1) + adj);
      } else if (type === 'familiar') {
        let lvl = 0;
        if (wizardMatch) lvl += parseInt(wizardMatch[1], 10);
        if (sorcererMatch) lvl += parseInt(sorcererMatch[1], 10);
        if (lvl === 0 && char && char.level) lvl = parseInt(char.level, 10);
        effectiveLevel = Math.max(1, lvl || 1);
      } else if (type === 'special_mount') {
        let lvl = 0;
        if (paladinMatch) lvl += parseInt(paladinMatch[1], 10);
        if (lvl === 0 && char && char.level) lvl = parseInt(char.level, 10);
        effectiveLevel = Math.max(5, lvl || 5);
      }

      // 2. Progression Bracket Lookup
      let bonusHd = 0;
      let natArmorAdj = 0;
      let strDexAdj = 0;
      let bonusTricks = 0;
      let specialAbilities = [];
      let companionInt = baseMonster.abilities?.int ?? 2;
      let masterBonusText = null;

      if (type === 'animal_companion') {
        const prog = this.getDruidCompanionProgression(effectiveLevel);
        if (prog) {
          bonusHd = prog.bonusHd || 0;
          natArmorAdj = prog.natArmorAdj || 0;
          strDexAdj = prog.strDexAdj || 0;
          bonusTricks = prog.bonusTricks || 0;
          specialAbilities = Array.isArray(prog.special) ? [...prog.special] : [];
        }
      } else if (type === 'familiar') {
        const prog = this.getFamiliarProgression(effectiveLevel);
        if (prog) {
          natArmorAdj = prog.natArmorAdj || 0;
          companionInt = prog.intScore || prog.int || 6;
          specialAbilities = Array.isArray(prog.special) ? [...prog.special] : [];
        }
        const famAllowed = (compData.familiarAllowedAnimals || []).find(f => f.id === companionConfig.baseMonsterId);
        if (famAllowed) masterBonusText = famAllowed.masterBonusText;
      } else if (type === 'special_mount') {
        const prog = this.getPaladinMountProgression(effectiveLevel);
        if (prog) {
          bonusHd = prog.bonusHd || 0;
          natArmorAdj = prog.natArmorAdj || 0;
          strDexAdj = prog.strAdj || 0;
          companionInt = prog.intScore || prog.int || 6;
          specialAbilities = Array.isArray(prog.special) ? [...prog.special] : [];
        }
      }

      // 3. Ability Scores
      const baseStr = baseMonster.abilities?.str ?? 10;
      const baseDex = baseMonster.abilities?.dex ?? 10;
      const baseCon = baseMonster.abilities?.con ?? 10;
      const baseWis = baseMonster.abilities?.wis ?? 10;
      const baseCha = baseMonster.abilities?.cha ?? 10;

      const totalStr = baseStr + strDexAdj;
      const totalDex = baseDex + (type === 'special_mount' ? 0 : strDexAdj);
      const totalCon = baseCon;
      const totalInt = companionInt;
      const totalWis = baseWis;
      const totalCha = baseCha;

      const strMod = Math.floor((totalStr - 10) / 2);
      const dexMod = Math.floor((totalDex - 10) / 2);
      const conMod = Math.floor((totalCon - 10) / 2);
      const intMod = Math.floor((totalInt - 10) / 2);
      const wisMod = Math.floor((totalWis - 10) / 2);
      const chaMod = Math.floor((totalCha - 10) / 2);

      // 4. Hit Dice & Hit Points
      const baseHdNum = parseInt(String(baseMonster.hitDice || '1').match(/\d+/)?.[0] || '1', 10);
      const totalHd = (type === 'familiar') ? (char?.level || 1) : (baseHdNum + bonusHd);

      let maxHp = 0;
      if (type === 'familiar') {
        maxHp = Math.max(1, Math.floor((char?.hp?.max || 10) / 2));
      } else {
        // D&D 3.5e RAW average HP: 4.5 per d8 + Con mod per HD
        maxHp = Math.max(1, Math.round(totalHd * 4.5 + totalHd * conMod));
      }
      const currentHp = (companionConfig.currentHp !== undefined) ? companionConfig.currentHp : maxHp;

      // 5. Base Attack Bonus
      const bab = (type === 'familiar') ? (char?.bab || 0) : Math.floor(totalHd * 0.75);

      // 6. Natural Armor, Gear & AC
      const baseTotalAC = baseMonster.ac?.total || 14;
      const baseDexMod = Math.floor((baseDex - 10) / 2);
      const baseNatArmor = Math.max(0, baseTotalAC - 10 - baseDexMod);
      const totalNatArmor = Math.max(0, baseNatArmor + natArmorAdj);

      const gear = companionConfig.gear || {};
      let armorACBonus = 0;
      let armorCheckPenalty = 0;
      let attackEnhancement = 0;
      let damageEnhancement = 0;
      let speedBonus = 0;

      if (gear.armor) {
        armorACBonus += (gear.armor.acBonus || gear.armor.armorBonus || 0) + (gear.armor.enhancementBonus || 0);
        armorCheckPenalty += (gear.armor.armorCheckPenalty || 0);
      }
      if (gear.neck && gear.neck.enhancementBonus) {
        attackEnhancement += gear.neck.enhancementBonus;
        damageEnhancement += gear.neck.enhancementBonus;
      }
      if (gear.feet) {
        if (gear.feet.speedBonus) speedBonus += gear.feet.speedBonus;
        else if (String(gear.feet.name || '').toLowerCase().includes('speed')) speedBonus += 30;
      }
      if (type === 'special_mount' && effectiveLevel >= 8) {
        speedBonus += 10; // RAW Paladin Mount 8th level Improved Speed
      }

      const acTotal = 10 + dexMod + totalNatArmor + armorACBonus;
      const acTouch = 10 + dexMod;
      const acFlatFooted = 10 + totalNatArmor + armorACBonus;

      // 7. Saving Throws
      let fortSave = 0;
      let refSave = 0;
      let willSave = 0;
      if (type === 'familiar') {
        fortSave = (char?.saves?.fort?.total || 2);
        refSave = (char?.saves?.ref?.total || 2);
        willSave = (char?.saves?.will?.total || 0);
      } else {
        fortSave = 2 + Math.floor(totalHd / 2) + conMod;
        refSave = 2 + Math.floor(totalHd / 2) + dexMod;
        willSave = Math.floor(totalHd / 3) + wisMod;
      }

      // 8. Natural Attacks & Rotations
      const monsterFeats = Array.isArray(baseMonster.feats) ? baseMonster.feats : [];
      const hasWeaponFocus = monsterFeats.some(f => /weapon\s*focus/i.test(f));
      const attacks = (baseMonster.attacks || []).map(atk => {
        const isMelee = (atk.actionType === 'mwak' || atk.attackType === 'natural' || !atk.actionType);
        const abilityMod = isMelee ? strMod : dexMod;
        const totalBonus = bab + abilityMod + attackEnhancement + (hasWeaponFocus ? 1 : 0);
        const baseDice = atk.damageParts?.[0]?.dice || '1d6';
        const totalDmgBonus = (atk.damageParts?.[0]?.bonus || 0) + strMod + damageEnhancement;
        return {
          name: atk.name,
          attackBonus: totalBonus,
          damageDice: baseDice,
          damageBonus: totalDmgBonus,
          formattedAttack: (totalBonus >= 0 ? '+' + totalBonus : String(totalBonus)),
          formattedDamage: baseDice + (totalDmgBonus >= 0 ? '+' + totalDmgBonus : String(totalDmgBonus)),
          source: atk.name
        };
      });

      return {
        type,
        customName,
        baseName: baseMonster.name,
        baseMonsterId: companionConfig.baseMonsterId,
        size: baseMonster.size || 'Medium',
        effectiveLevel,
        totalHd,
        hp: { current: currentHp, max: maxHp },
        ac: { total: acTotal, touch: acTouch, flatFooted: acFlatFooted, naturalArmor: totalNatArmor, armorBonus: armorACBonus },
        abilities: { str: totalStr, dex: totalDex, con: totalCon, int: totalInt, wis: totalWis, cha: totalCha },
        abilityMods: { str: strMod, dex: dexMod, con: conMod, int: intMod, wis: wisMod, cha: chaMod },
        saves: { fort: fortSave, ref: refSave, will: willSave },
        bab,
        speed: { land: (baseMonster.speed?.land || 30) + speedBonus, fly: baseMonster.speed?.fly || 0 },
        attacks,
        bonusTricks,
        specialAbilities,
        monsterFeats,
        masterBonusText,
        gear
      };
    }
  };

  // ==========================================================================
  // 2. window.ItemAssembler (MODULAR LEGO ITEM FACTORY — D&D 3.5e RAW)
  // ==========================================================================
  const DOUBLE_CRIT_MAP = {
    20: 19,
    19: 17,
    18: 15,
    17: 13
  };

  const BUILT_IN_ENHANCEMENT_FALLBACKS = {
    'enh-corrosive': {
      id: 'enh-corrosive',
      name: 'Corrosive',
      type: 'Enhancement',
      targetType: 'Weapon',
      enhIncrease: 1,
      flatCost: 0,
      damageParts: [{ dice: '1d6', bonus: 0, type: 'Acid', multiplyOnCrit: false, onCritOnly: false, source: 'Corrosive' }],
      shortDescription: 'Deals +1d6 acid damage on a successful hit.'
    },
    'enh-ghost-touch': {
      id: 'enh-ghost-touch',
      name: 'Ghost Touch',
      type: 'Enhancement',
      targetType: 'Weapon',
      enhIncrease: 1,
      flatCost: 0,
      ruleFlags: { ghostTouch: true },
      shortDescription: 'Deals normal damage to incorporeal creatures.'
    },
    'enh-fortification-light': {
      id: 'enh-fortification-light',
      name: 'Light Fortification',
      type: 'Enhancement',
      targetType: 'Armor',
      enhIncrease: 1,
      flatCost: 0,
      ruleFlags: { fortification: 25 },
      shortDescription: '25% chance to negate Critical Hits and Sneak Attack bonus damage.'
    },
    'enh-fortification-moderate': {
      id: 'enh-fortification-moderate',
      name: 'Moderate Fortification',
      type: 'Enhancement',
      targetType: 'Armor',
      enhIncrease: 3,
      flatCost: 0,
      ruleFlags: { fortification: 75 },
      shortDescription: '75% chance to negate Critical Hits and Sneak Attack bonus damage.'
    },
    'enh-fortification-heavy': {
      id: 'enh-fortification-heavy',
      name: 'Heavy Fortification',
      type: 'Enhancement',
      targetType: 'Armor',
      enhIncrease: 5,
      flatCost: 0,
      ruleFlags: { fortification: 100 },
      shortDescription: '100% immunity to Critical Hits and Sneak Attack bonus damage.'
    }
  };

  const ItemAssembler = {
    /**
     * Builds a complete Canonical V2 Equipment Item from modular Lego components:
     * {
     *   baseItemId: 'wpn-scimitar',
     *   material: 'mat-mithral',
     *   masterwork: true,
     *   enhancementBonus: 2,
     *   enhancements: ['enh-keen', 'enh-flaming'],
     *   customName: '',
     *   customModifiers: [],
     *   customNotes: ''
     * }
     */
    assemble(spec = {}) {
      const baseRef = spec.baseItem || SrdCompendium.getById(spec.baseItemId) || SrdCompendium.getByName(spec.baseItemId || spec.baseItemName);
      if (!baseRef) {
        throw new Error(`[ItemAssembler] Base item not found: ${spec.baseItemId || spec.baseItemName}`);
      }

      const item = safeClone(baseRef);
      item.schemaVersion = 2;
      item.baseItemId = baseRef.id;
      item.modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
      item.damageParts = Array.isArray(item.damageParts) ? item.damageParts : [];
      item.modes = Array.isArray(item.modes) ? item.modes : [];
      item.ruleFlags = item.ruleFlags && typeof item.ruleFlags === 'object' ? item.ruleFlags : {};
      item.tacticalBadges = [];

      const isWeapon = item.type === 'Weapon';
      const isArmor = item.type === 'Armor';
      const isShield = item.type === 'Shield';

      // 1. Resolve Special Material
      let matEntry = null;
      if (spec.material) {
        matEntry = SrdCompendium.getById(spec.material) ||
          SrdCompendium.getByName(spec.material, 'Material') ||
          SrdCompendium.getById(slugify(spec.material, 'mat'));
      }
      const matName = matEntry ? matEntry.name : '';
      const matFlags = (matEntry && matEntry.ruleFlags) || {};
      item.material = matEntry ? matEntry.id : null;
      item.materialName = matName || null;

      // 2. Resolve Enhancement Bonus & Special Enhancements
      const enhBonus = Math.max(0, Math.min(10, Number(spec.enhancementBonus) || 0));
      item.enhancementBonus = enhBonus;

      const resolvedEnhs = [];
      if (Array.isArray(spec.enhancements)) {
        for (let i = 0; i < spec.enhancements.length; i++) {
          const eRef = spec.enhancements[i];
          const enhObj = typeof eRef === 'object' && eRef !== null
            ? eRef
            : (SrdCompendium.getById(eRef) ||
               BUILT_IN_ENHANCEMENT_FALLBACKS[eRef] ||
               SrdCompendium.getByName(eRef, 'Enhancement') ||
               SrdCompendium.getById(slugify(eRef, 'enh')));
          if (enhObj) resolvedEnhs.push(safeClone(enhObj));
        }
      }
      item.enhancements = resolvedEnhs.map((e) => e.id);

      const isMasterwork = Boolean(
        spec.masterwork ||
        enhBonus > 0 ||
        resolvedEnhs.length > 0 ||
        ['mithral', 'adamantine', 'darkwood'].includes(matName.toLowerCase())
      );
      item.masterwork = isMasterwork;

      // 3. Apply Material Rules (Mithral, Adamantine, Darkwood, Cold Iron, Alchemical Silver)
      const bypassDRSet = new Set(isWeapon && Array.isArray(item.ruleFlags.bypassDR) ? item.ruleFlags.bypassDR : []);
      if (isWeapon && matFlags.bypassDR) bypassDRSet.add(matFlags.bypassDR);

      if (isArmor || isShield) {
        const aMod = matFlags.armorMod || {};
        if (aMod.weightMult) {
          item.weight = Math.round(Number(item.weight || 0) * aMod.weightMult * 10) / 10;
        }
        if (aMod.maxDexBonusIncrease && item.maxDex !== null && item.maxDex !== undefined) {
          item.maxDex = Number(item.maxDex) + Number(aMod.maxDexBonusIncrease);
        }
        if (aMod.asfReduction && item.spellFailure) {
          item.spellFailure = Math.max(0, Number(item.spellFailure) - Number(aMod.asfReduction));
        }
        let acpReduce = Number(aMod.acpReduction || 0);
        if (!acpReduce && isMasterwork) acpReduce = 1; // Standard Masterwork armor/shield reduces ACP by 1
        if (acpReduce && item.checkPenalty < 0) {
          item.checkPenalty = Math.min(0, Number(item.checkPenalty) + acpReduce);
        }
        if (aMod.speedCategoryStepDown && isArmor) {
          if (item.category === 'Heavy') {
            item.effectiveWeightCategory = 'Medium';
            item.ruleFlags.mithralHeavyAsMedium = true;
          } else if (item.category === 'Medium') {
            item.effectiveWeightCategory = 'Light';
            item.ruleFlags.mithralMediumAsLight = true;
            item.speed30 = '30 ft.';
            item.speed20 = '20 ft.';
          }
        }
        if (aMod.drByCategory && isArmor) {
          const drVal = aMod.drByCategory[item.category] || '1/-';
          item.ruleFlags.dr = drVal;
          const drNum = parseInt(drVal, 10) || 1;
          item.modifiers.push({
            target: 'dr',
            value: drNum,
            formula: String(drNum),
            type: 'untyped',
            condition: `Adamantine ${item.category} Armor (${drVal})`
          });
          item.tacticalBadges.push({
            id: 'adamantine-dr',
            label: `DR ${drVal}`,
            summary: `Adamantine ${item.category} Armor grants Damage Reduction ${drVal}.`
          });
        }
      } else if (isWeapon) {
        const wMod = matFlags.weaponMod || {};
        if (wMod.weightMult) {
          item.weight = Math.round(Number(item.weight || 0) * wMod.weightMult * 10) / 10;
        }
        if (wMod.ignoreHardnessBelow) {
          item.ruleFlags.ignoreHardnessBelow = wMod.ignoreHardnessBelow;
          item.tacticalBadges.push({
            id: 'ignore-hardness',
            label: `Ignores Hardness < ${wMod.ignoreHardnessBelow}`,
            summary: 'Adamantine weapon bypasses hardness less than 20 when sundering or smashing objects.'
          });
        }
        if (wMod.damagePenalty && item.damageParts.length > 0) {
          item.damageParts[0].bonus = (Number(item.damageParts[0].bonus) || 0) + Number(wMod.damagePenalty);
          item.modes.forEach((m) => {
            if (Array.isArray(m.damageParts) && m.damageParts.length > 0) {
              m.damageParts[0].bonus = (Number(m.damageParts[0].bonus) || 0) + Number(wMod.damagePenalty);
            }
          });
        }
      }

      // 4. Apply Enhancement Bonus (+1 to +10) & Masterwork Attack Bonus
      if (isWeapon) {
        if (enhBonus > 0) {
          bypassDRSet.add('magic');
          if (enhBonus >= 6) bypassDRSet.add('epic');
          item.modifiers.push({
            target: 'attack.weapon',
            value: enhBonus,
            formula: String(enhBonus),
            type: 'enhancement',
            condition: null,
            source: 'Weapon Enhancement'
          });
          if (item.damageParts.length > 0) {
            item.damageParts[0].bonus = (Number(item.damageParts[0].bonus) || 0) + enhBonus;
          }
          item.modes.forEach((m) => {
            if (Array.isArray(m.damageParts) && m.damageParts.length > 0) {
              m.damageParts[0].bonus = (Number(m.damageParts[0].bonus) || 0) + enhBonus;
            }
          });
        } else if (isMasterwork) {
          // Masterwork weapon grants +1 enhancement bonus on attack rolls only
          item.modifiers.push({
            target: 'attack.weapon',
            value: 1,
            formula: '1',
            type: 'enhancement',
            condition: null,
            source: 'Masterwork'
          });
        }
      } else if (isArmor || isShield) {
        if (enhBonus > 0) {
          const acTarget = isShield ? 'ac.shield' : 'ac.armor';
          const acMod = item.modifiers.find((m) => m.target === acTarget || String(m.target).startsWith('ac.'));
          const baseAc = acMod ? (Number(acMod.value) || 0) : (Number(item.acBonus) || Number(item.armorStats?.baseAc) || 0);
          const totalAc = baseAc + enhBonus;
          item.acBonus = totalAc;
          if (acMod) {
            acMod.value = totalAc;
            acMod.formula = String(totalAc);
          } else {
            item.modifiers.push({
              target: acTarget,
              value: totalAc,
              formula: String(totalAc),
              type: isShield ? 'shield' : 'armor',
              condition: null
            });
          }
        }
      }

      // 5. Apply Weapon / Armor Special Enhancements (Keen, Flaming, Speed, Fortification, etc.)
      let totalEnhIncrease = enhBonus;
      let flatEnhGold = 0;

      for (let i = 0; i < resolvedEnhs.length; i++) {
        const enh = resolvedEnhs[i];
        totalEnhIncrease += Number(enh.enhIncrease) || 0;
        flatEnhGold += Number(enh.flatCost) || 0;

        // Merge modifiers
        if (Array.isArray(enh.modifiers) && enh.modifiers.length > 0) {
          item.modifiers.push(...safeClone(enh.modifiers));
        }

        // Merge extra damageParts (Flaming, Frost, Shock, Holy, Burst, etc.)
        if (isWeapon && Array.isArray(enh.damageParts) && enh.damageParts.length > 0) {
          item.damageParts.push(...safeClone(enh.damageParts));
          item.modes.forEach((m) => {
            if (Array.isArray(m.damageParts)) {
              m.damageParts.push(...safeClone(enh.damageParts));
            }
          });
        }

        // Check special flags (Keen, Speed, Thrown, Defending, Fortification)
        const ef = enh.ruleFlags || {};
        if (ef.keen) {
          item.ruleFlags.keen = true;
          const baseCrit = Number(item.critRange) || 20;
          const newCrit = DOUBLE_CRIT_MAP[baseCrit] || Math.max(15, 21 - (21 - baseCrit) * 2);
          item.critRange = newCrit;
          item.modes.forEach((m) => {
            const mc = Number(m.critRange) || baseCrit;
            m.critRange = DOUBLE_CRIT_MAP[mc] || newCrit;
          });
        }
        if (ef.speed) {
          item.ruleFlags.speed = true;
          item.tacticalBadges.push({
            id: 'enh-speed',
            label: '⚡ Speed (+1 Attack)',
            summary: 'Grants one extra attack at highest bonus during a Full Attack action (does not stack with Haste).'
          });
        }
        if (ef.defending) {
          item.ruleFlags.defending = true;
          item.tacticalBadges.push({
            id: 'enh-defending',
            label: '🛡️ Defending',
            summary: 'Free action at start of turn: allocate some or all enhancement bonus to AC (stacks with all other AC bonuses).'
          });
        }
        if (ef.fortification) {
          item.ruleFlags.fortification = Math.max(Number(item.ruleFlags.fortification) || 0, ef.fortification);
          item.tacticalBadges.push({
            id: 'enh-fortification',
            label: `🛡️ Fortification ${ef.fortification}%`,
            summary: `${ef.fortification}% chance to negate Critical Hits and Sneak Attack bonus damage.`
          });
        }
        if (!ef.keen && !ef.speed && !ef.defending && !ef.fortification && (!enh.damageParts || enh.damageParts.length === 0)) {
          item.tacticalBadges.push({
            id: enh.id,
            label: `✨ ${enh.name}`,
            summary: enh.shortDescription || enh.name
          });
        }
      }

      if (isWeapon && bypassDRSet.size > 0) {
        item.ruleFlags.bypassDR = Array.from(bypassDRSet);
      } else {
        delete item.ruleFlags.bypassDR;
      }

      // 5b. Resolve Augmentation Crystal (Magic Item Compendium RAW)
      let resolvedCrystal = null;
      if (spec.crystal) {
        const cRef = spec.crystal;
        const crysObj = typeof cRef === 'object' && cRef !== null
          ? cRef
          : (SrdCompendium.getById(cRef) ||
             SrdCompendium.getByName(cRef, 'AugmentationCrystal') ||
             SrdCompendium.getById(slugify(cRef, 'crys')));
        if (crysObj) {
          resolvedCrystal = safeClone(crysObj);
          item.crystal = {
            id: resolvedCrystal.id,
            name: resolvedCrystal.name,
            slot: resolvedCrystal.slot,
            cost: Number(resolvedCrystal.cost) || 0,
            shortDescription: resolvedCrystal.shortDescription || resolvedCrystal.name
          };

          // Merge crystal modifiers if any
          if (Array.isArray(resolvedCrystal.modifiers) && resolvedCrystal.modifiers.length > 0) {
            item.modifiers.push(...safeClone(resolvedCrystal.modifiers));
          }

          // Merge crystal ruleFlags if any (e.g. Iron Ward Diamond DR, Truedeath Ghost Touch)
          if (resolvedCrystal.ruleFlags && typeof resolvedCrystal.ruleFlags === 'object') {
            Object.assign(item.ruleFlags, safeClone(resolvedCrystal.ruleFlags));
          }

          // Merge crystal damageParts if any (e.g. Energy Assault +1d6)
          if (isWeapon && Array.isArray(resolvedCrystal.damageParts) && resolvedCrystal.damageParts.length > 0) {
            item.damageParts.push(...safeClone(resolvedCrystal.damageParts));
            item.modes.forEach((m) => {
              if (Array.isArray(m.damageParts)) {
                m.damageParts.push(...safeClone(resolvedCrystal.damageParts));
              }
            });
          }

          // Merge crystal tactical badge
          item.tacticalBadges.push({
            id: resolvedCrystal.id,
            label: `💎 ${resolvedCrystal.name}`,
            summary: resolvedCrystal.shortDescription || resolvedCrystal.benefit || resolvedCrystal.name
          });
        }
      }

      // 6. Custom Modifiers & Notes
      if (Array.isArray(spec.customModifiers) && spec.customModifiers.length > 0) {
        item.modifiers.push(...safeClone(spec.customModifiers));
      }
      if (spec.customNotes) {
        item.notes = String(spec.customNotes);
      }

      // 7. Compute D&D 3.5e RAW Market Price
      let totalCost = Number(baseRef.cost) || 0;
      if (isWeapon) {
        if (matName.toLowerCase() === 'adamantine') totalCost += 3000;
        else if (matName.toLowerCase() === 'mithral') totalCost += (Number(baseRef.weight) || 1) * 500;
        else if (matName.toLowerCase() === 'cold iron') totalCost *= 2;
        else if (matName.toLowerCase() === 'alchemical silver') totalCost += item.handedness === 'light' ? 20 : (item.handedness === '1h' ? 90 : 180);
        else if (isMasterwork) totalCost += 300;
        if (totalEnhIncrease > 0) {
          totalCost += 2000 * totalEnhIncrease * totalEnhIncrease;
          if (matName.toLowerCase() === 'cold iron') totalCost += 2000;
        }
        totalCost += flatEnhGold;
      } else if (isArmor || isShield) {
        if (matName.toLowerCase() === 'mithral') {
          totalCost += isShield ? 1000 : (item.category === 'Light' ? 1000 : (item.category === 'Medium' ? 4000 : 9000));
        } else if (matName.toLowerCase() === 'adamantine') {
          totalCost += item.category === 'Light' ? 5000 : (item.category === 'Medium' ? 10000 : 15000);
        } else if (matName.toLowerCase() === 'darkwood') {
          totalCost += 150 + (Number(baseRef.weight) || 5) * 10;
        } else if (isMasterwork) {
          totalCost += 150;
        }
        if (totalEnhIncrease > 0) {
          totalCost += 1000 * totalEnhIncrease * totalEnhIncrease;
        }
        totalCost += flatEnhGold;
      }
      if (resolvedCrystal && resolvedCrystal.cost) {
        totalCost += Number(resolvedCrystal.cost) || 0;
      }
      item.cost = totalCost;

      // 8. Build Canonical Display Name & Deterministic Instance ID
      if (spec.customName && String(spec.customName).trim()) {
        item.name = String(spec.customName).trim();
      } else {
        const nameParts = [];
        if (enhBonus > 0) nameParts.push(`+${enhBonus}`);
        else if (isMasterwork && !['mithral', 'adamantine', 'darkwood'].includes(matName.toLowerCase())) {
          nameParts.push('Masterwork');
        }
        resolvedEnhs.forEach((e) => nameParts.push(e.name));
        if (matName) nameParts.push(matName);
        nameParts.push(baseRef.name);
        item.name = nameParts.join(' ');
      }

      item.id = spec.id || slugify(item.name, isWeapon ? 'wpn-inst' : (isShield ? 'shd-inst' : 'arm-inst'));
      item.source = spec.source || 'ItemAssembler-ZeroToken';
      return item;
    },

    /**
     * Deterministically parses a natural language composite item query
     * (e.g. "+2 Keen Mithral Scimitar", "+1 Flaming Longsword", "Masterwork Cold Iron Greatsword")
     * into Lego parts and returns a Canonical V2 item in 0 tokens.
     */
    parseNaturalLanguageItem(rawText) {
      if (!rawText || typeof rawText !== 'string') return null;
      if (typeof SrdCompendium._ensureNodeEquipmentLoaded === 'function') {
        SrdCompendium._ensureNodeEquipmentLoaded();
      }
      let working = rawText.trim();
      if (!working) return null;

      // Step A: Strip leading prefixes (armor:, shield:, weapon:, item:, ring:, wondrous:, type:..., slot:...) even without space after colon
      working = working
        .replace(/^(?:armor|shield|weapon|item|ring|wondrous|equipment)\s*:\s*/i, '')
        .replace(/\b(?:type|slot)\s*:\s*(?:"[^"]+"|'[^']+'|[^\s,;]+)/gi, ' ')
        .trim();
      if (!working) return null;

      // Step B: Match +1..+10 even when followed by a comma or parenthesis
      let enhancementBonus = 0;
      const bonusMatch = working.match(/(?:^|[\s,(])\+([1-9]|10)(?=[\s,)]|$)/i);
      if (bonusMatch) {
        enhancementBonus = parseInt(bonusMatch[1], 10) || 0;
        working = working.replace(/\+([1-9]|10)(?=[\s,)]|$)/i, ' ').trim();
      }

      let masterwork = false;
      if (/\b(?:masterwork|mwk)\b/i.test(working)) {
        masterwork = true;
        working = working.replace(/\b(?:masterwork|mwk)\b/gi, ' ').trim();
      }

      let material = null;
      const materials = SrdCompendium.getMaterials().slice().sort((a, b) => (b.name || '').length - (a.name || '').length);
      for (let i = 0; i < materials.length; i++) {
        const mat = materials[i];
        const mName = String(mat.name || '').trim();
        if (!mName) continue;
        const escaped = mName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`\\b${escaped}\\b`, 'i');
        if (re.test(working)) {
          material = mat.id;
          working = working.replace(re, ' ').trim();
          break;
        }
      }

      let crystal = null;
      const crystalMatch = working.match(/(?:with|socketed with|attached with)\s+([a-z0-9\s,'-]+)$/i);
      if (crystalMatch) {
        const cQuery = crystalMatch[1].trim();
        const foundCrystal = SrdCompendium.getByName(cQuery, 'AugmentationCrystal') ||
          SrdCompendium.getById(`crys-${slugify(cQuery)}`) ||
          SrdCompendium.getCrystals().find(c => (c.name || '').toLowerCase().includes(cQuery.toLowerCase()));
        if (foundCrystal) {
          crystal = foundCrystal.id;
          working = working.replace(crystalMatch[0], ' ').trim();
        }
      }

      // Step C: Resolve Base Item (exact loaded Weapon/Armor/Shield or common aliases like "heavy shield", "light shield", "studded leather", "half plate")
      let matchedBase = null;
      const isWoodHint = material === 'mat-darkwood' || /\b(?:wood|wooden|darkwood)\b/i.test(rawText);
      const allBaseCandidates = SrdCompendium.getAllLoaded(['Weapon', 'Armor', 'Shield'])
        .slice()
        .sort((a, b) => (b.name || '').length - (a.name || '').length);

      for (let i = 0; i < allBaseCandidates.length; i++) {
        const cand = allBaseCandidates[i];
        const cName = String(cand.name || '').trim();
        if (!cName) continue;
        const escaped = cName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`\\b${escaped}\\b`, 'i');
        if (re.test(working)) {
          matchedBase = cand;
          working = working.replace(re, ' ').trim();
          break;
        }
      }

      if (!matchedBase) {
        const baseAliases = [
          { re: /\bheavy\s+shield\b/i, id: isWoodHint ? 'shd-heavy-wooden-shield' : 'shd-heavy-steel-shield' },
          { re: /\blight\s+shield\b/i, id: isWoodHint ? 'shd-light-wooden-shield' : 'shd-light-steel-shield' },
          { re: /\btower\s+shield\b/i, id: 'shd-tower-shield' },
          { re: /\bstudded\s+leather(?:\s+armor)?\b/i, id: 'arm-studded-leather-armor' },
          { re: /\bhalf[\s-]+plate(?:\s+armor)?\b/i, id: 'arm-half-plate' },
          { re: /\bfull[\s-]+plate(?:\s+armor)?\b/i, id: 'arm-full-plate' }
        ];
        for (let i = 0; i < baseAliases.length; i++) {
          if (baseAliases[i].re.test(working)) {
            const resolved = SrdCompendium.getById(baseAliases[i].id);
            if (resolved) {
              matchedBase = resolved;
              working = working.replace(baseAliases[i].re, ' ').trim();
              break;
            }
          }
        }
      }

      // Step D: Normalize enhancement aliases (strip [Synergy] and (MIC), invert "X, Greater" -> "Greater X") and match comma segments
      const enhancements = [];
      const candidateEnhs = matchedBase
        ? SrdCompendium.getEnhancements(matchedBase.type)
        : [
            ...SrdCompendium.getEnhancements('Weapon'),
            ...SrdCompendium.getEnhancements('Armor'),
            ...SrdCompendium.getEnhancements('Shield')
          ];
      const seenEnhIds = new Set();
      const uniqueEnhs = [];
      for (let i = 0; i < candidateEnhs.length; i++) {
        if (candidateEnhs[i] && !seenEnhIds.has(candidateEnhs[i].id)) {
          seenEnhIds.add(candidateEnhs[i].id);
          uniqueEnhs.push(candidateEnhs[i]);
        }
      }

      const aliasPairs = [];
      for (let i = 0; i < uniqueEnhs.length; i++) {
        const enh = uniqueEnhs[i];
        const rawName = String(enh.name || '').trim();
        if (!rawName) continue;
        const stripped = rawName
          .replace(/\[[^\]]*\]/g, '')
          .replace(/\([^)]*\)/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const localAliases = new Set([rawName, stripped]);
        if (stripped.includes(',')) {
          const parts = stripped.split(',').map(s => s.trim()).filter(Boolean);
          if (parts.length === 2) {
            localAliases.add(`${parts[1]} ${parts[0]}`);
            localAliases.add(`${parts[0]} ${parts[1]}`);
          }
        }
        localAliases.forEach((al) => {
          if (al) aliasPairs.push({ enh, alias: al });
        });
      }
      aliasPairs.sort((a, b) => b.alias.length - a.alias.length);

      for (let i = 0; i < aliasPairs.length; i++) {
        const { enh, alias } = aliasPairs[i];
        if (enhancements.includes(enh.id)) continue;
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`\\b${escaped}\\b`, 'i');
        if (re.test(working)) {
          enhancements.push(enh.id);
          working = working.replace(re, ' ').trim();
        }
      }

      // Match leftover comma/semicolon-separated segments by prefix (len >= 4) or fuzzyScore >= 160
      const segments = working.split(/[,;]+/);
      const unmatchedSegments = [];
      for (let s = 0; s < segments.length; s++) {
        const segClean = segments[s]
          .replace(/\bof\b/gi, ' ')
          .replace(/[()]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!segClean) continue;
        const segLower = segClean.toLowerCase();
        let matchedSegEnh = null;

        if (segLower.length >= 4) {
          // 1. Prefix match against normalized enhancement aliases (e.g., "Bashi" -> "Bashing")
          let bestPrefixAliasLen = Infinity;
          for (let i = 0; i < aliasPairs.length; i++) {
            const { enh, alias } = aliasPairs[i];
            if (enhancements.includes(enh.id)) continue;
            const alLower = alias.toLowerCase();
            if (alLower.startsWith(segLower) && alLower.length < bestPrefixAliasLen) {
              bestPrefixAliasLen = alLower.length;
              matchedSegEnh = enh;
            }
          }
          // 2. Fuzzy match fallback (>= 160)
          if (!matchedSegEnh && typeof SrdCompendium.fuzzyScore === 'function') {
            let bestScore = 159;
            for (let i = 0; i < aliasPairs.length; i++) {
              const { enh, alias } = aliasPairs[i];
              if (enhancements.includes(enh.id)) continue;
              const sc = SrdCompendium.fuzzyScore(segLower, alias);
              if (sc > bestScore) {
                bestScore = sc;
                matchedSegEnh = enh;
              }
            }
          }
        }

        if (matchedSegEnh) {
          enhancements.push(matchedSegEnh.id);
        } else {
          unmatchedSegments.push(segClean);
        }
      }

      let usedUnmatchedForBase = false;
      if (!matchedBase) {
        const baseQuery = unmatchedSegments.join(' ').replace(/\s+/g, ' ').trim();
        if (!baseQuery) return null;
        matchedBase = SrdCompendium.getByName(baseQuery, 'Weapon') ||
          SrdCompendium.getByName(baseQuery, 'Armor') ||
          SrdCompendium.getByName(baseQuery, 'Shield') ||
          SrdCompendium.getById(`wpn-${slugify(baseQuery)}`) ||
          SrdCompendium.getById(`arm-${slugify(baseQuery)}`) ||
          SrdCompendium.getById(`shd-${slugify(baseQuery)}`);
        if (matchedBase) usedUnmatchedForBase = true;
      }

      if (!matchedBase || !['Weapon', 'Armor', 'Shield'].includes(matchedBase.type)) {
        return null;
      }

      const parseWarnings = [];
      if (!usedUnmatchedForBase && unmatchedSegments.length > 0) {
        parseWarnings.push(`Unrecognized token(s): ${unmatchedSegments.join(', ')}`);
      }
      if (enhancements.length > 0 && enhancementBonus < 1) {
        parseWarnings.push('RAW 3.5e: Magic special abilities require at least a +1 enhancement bonus');
      }
      if (enhancementBonus > 5) {
        parseWarnings.push(`Epic (+${enhancementBonus}) enhancement bonus`);
      }

      try {
        const assembled = ItemAssembler.assemble({
          baseItem: matchedBase,
          baseItemId: matchedBase.id,
          material,
          masterwork,
          enhancementBonus,
          enhancements,
          crystal,
          source: 'ItemAssembler-ZeroToken'
        });
        if (assembled && parseWarnings.length > 0) {
          assembled._parseWarnings = parseWarnings;
        }
        return assembled;
      } catch (e) {
        return null;
      }
    },

    assembleFromNaturalLanguage(rawText) {
      return ItemAssembler.parseNaturalLanguageItem(rawText);
    }
  };

  // ==========================================================================
  // 3. window.SchemaMigrator (DETERMINISTIC V1 -> V2 GATEKEEPER)
  // ==========================================================================
  const LEGACY_BONUS_MAP = [
    { key: 'strBonus', target: 'ability.str' },
    { key: 'dexBonus', target: 'ability.dex' },
    { key: 'conBonus', target: 'ability.con' },
    { key: 'intBonus', target: 'ability.int' },
    { key: 'wisBonus', target: 'ability.wis' },
    { key: 'chaBonus', target: 'ability.cha' },
    { key: 'fortBonus', target: 'save.fort' },
    { key: 'refBonus', target: 'save.ref' },
    { key: 'willBonus', target: 'save.will' },
    { key: 'initBonus', target: 'init' },
    { key: 'speedBonus', target: 'speed.land' },
    { key: 'sr', target: 'sr' }
  ];

  const SchemaMigrator = {
    /**
     * Deterministically upgrades any V1 item/feat/spell/buff object into Canonical V2 (`schemaVersion: 2`).
     */
    upgradeEntryToV2(rawEntry) {
      if (!rawEntry || typeof rawEntry !== 'object') return rawEntry;
      if (rawEntry.schemaVersion === 2 && Array.isArray(rawEntry.modifiers) && Array.isArray(rawEntry.damageParts)) {
        return rawEntry;
      }

      const entry = safeClone(rawEntry);
      entry.schemaVersion = 2;

      // Match canonical SRD entry if possible for ID & base metadata
      const srdMatch = SrdCompendium.getById(entry.id) || SrdCompendium.getByName(entry.name, entry.type);
      if (!entry.id) {
        entry.id = srdMatch ? srdMatch.id : slugify(entry.name || 'item', String(entry.type || 'custom').toLowerCase().slice(0, 3));
      }
      if (srdMatch && !entry.baseItemId && ['Weapon', 'Armor', 'Shield'].includes(entry.type || srdMatch.type)) {
        entry.baseItemId = srdMatch.id;
      }

      const defaultBonusType = String(entry.bonusType || 'untyped').toLowerCase();
      const modifiers = Array.isArray(entry.modifiers) ? entry.modifiers : [];

      // 1. Migrate legacy flat bonus fields into universal `modifiers`
      //    (weapon attack / damage bonuses live only in `enhancementBonus` + typed `modifiers`; there is no flat column)
      for (let i = 0; i < LEGACY_BONUS_MAP.length; i++) {
        const { key, target } = LEGACY_BONUS_MAP[i];
        const val = Number(entry[key]);
        if (!Number.isNaN(val) && val !== 0) {
          const exists = modifiers.some((m) => m.target === target && Number(m.value) === val);
          if (!exists) {
            modifiers.push({
              target,
              value: val,
              formula: String(val),
              type: defaultBonusType,
              condition: null
            });
          }
        }
        delete entry[key];
      }

      // Migrate `acBonus`
      const acVal = Number(entry.acBonus);
      if (!Number.isNaN(acVal) && acVal !== 0) {
        const isArmor = entry.type === 'Armor';
        const isShield = entry.type === 'Shield';
        const acTarget = isArmor ? 'ac.armor' : (isShield ? 'ac.shield' : (defaultBonusType === 'natural' ? 'ac.natural' : (defaultBonusType === 'deflection' ? 'ac.deflection' : 'ac.total')));
        const acType = isArmor ? 'armor' : (isShield ? 'shield' : defaultBonusType);
        const exists = modifiers.some((m) => m.target === acTarget && Number(m.value) === acVal);
        if (!exists) {
          modifiers.push({
            target: acTarget,
            value: acVal,
            formula: String(acVal),
            type: acType,
            condition: null
          });
        }
        if (!isArmor && !isShield) {
          delete entry.acBonus;
        }
      }

      // Migrate `skillBonuses` dictionary and `skillBonus` + `targetSkill`
      if (entry.skillBonuses && typeof entry.skillBonuses === 'object') {
        Object.entries(entry.skillBonuses).forEach(([skName, skVal]) => {
          const num = Number(skVal);
          if (!Number.isNaN(num) && num !== 0) {
            const skSlug = slugify(skName).replace(/-/g, '_');
            modifiers.push({
              target: `skill.${skSlug}`,
              value: num,
              formula: String(num),
              type: defaultBonusType === 'untyped' ? 'competence' : defaultBonusType,
              condition: null
            });
          }
        });
        delete entry.skillBonuses;
      }
      if (entry.skillBonus && entry.targetSkill) {
        const num = Number(entry.skillBonus);
        if (!Number.isNaN(num) && num !== 0) {
          const skSlug = slugify(entry.targetSkill).replace(/-/g, '_');
          modifiers.push({
            target: `skill.${skSlug}`,
            value: num,
            formula: String(num),
            type: defaultBonusType === 'untyped' ? 'competence' : defaultBonusType,
            condition: null
          });
        }
        delete entry.skillBonus;
      }

      entry.modifiers = modifiers;
      delete entry.bonusType;

      // 2. Migrate legacy `dice`, `damageDice`, `damage`, `extraDmg` into `damageParts`
      const damageParts = Array.isArray(entry.damageParts) ? entry.damageParts : [];
      if (damageParts.length === 0) {
        const baseDice = entry.dice || entry.damageDice || (typeof entry.damage === 'string' ? entry.damage : null);
        if (baseDice && /\d+d\d+/i.test(String(baseDice))) {
          damageParts.push({
            dice: String(baseDice).trim(),
            bonus: Number(entry.enhancementBonus) || 0,
            type: entry.dmgType || 'Physical',
            multiplyOnCrit: entry.type === 'Weapon',
            onCritOnly: false,
            source: 'Base'
          });
        }
        if (entry.extraDmg && entry.extraDmg !== baseDice && /\d+d\d+/i.test(String(entry.extraDmg))) {
          damageParts.push({
            dice: String(entry.extraDmg).trim(),
            bonus: 0,
            type: entry.extraDmgType || 'Untyped',
            multiplyOnCrit: false,
            onCritOnly: false,
            source: 'Extra'
          });
        }
      }
      entry.damageParts = damageParts;
      delete entry.dice;
      delete entry.damageDice;
      delete entry.extraDmg;

      // 3. Migrate `critMin` -> `critRange`
      if (entry.critMin !== undefined && entry.critRange === undefined) {
        entry.critRange = Number(entry.critMin) || 20;
        delete entry.critMin;
      }

      // 4. Populate `modes` from canonical SRD match if missing on a Weapon
      if (!Array.isArray(entry.modes) || entry.modes.length === 0) {
        if (srdMatch && Array.isArray(srdMatch.modes) && srdMatch.modes.length > 0) {
          entry.modes = safeClone(srdMatch.modes);
        } else {
          entry.modes = [];
        }
      }

      entry.ruleFlags = entry.ruleFlags && typeof entry.ruleFlags === 'object' ? entry.ruleFlags : {};
      if (!Array.isArray(entry.defenses)) entry.defenses = [];
      if (!Array.isArray(entry.resources)) entry.resources = [];
      if (!Array.isArray(entry.grants)) entry.grants = [];
      if (!Array.isArray(entry.choices)) entry.choices = [];
      if (rawEntry.requires !== undefined && entry.requires === undefined) entry.requires = safeClone(rawEntry.requires);
      if (rawEntry.overrides !== undefined && entry.overrides === undefined) entry.overrides = rawEntry.overrides;
      if (rawEntry.pack !== undefined && entry.pack === undefined) entry.pack = rawEntry.pack;
      if (rawEntry.stacks !== undefined && entry.stacks === undefined) entry.stacks = rawEntry.stacks;
      if (rawEntry.invested !== undefined && entry.invested === undefined) entry.invested = rawEntry.invested;
      if (rawEntry.autoUnlock !== undefined && entry.autoUnlock === undefined) entry.autoUnlock = rawEntry.autoUnlock;
      if (rawEntry.isSynergy !== undefined && entry.isSynergy === undefined) entry.isSynergy = rawEntry.isSynergy;
      if (rawEntry.isSynergyGrant !== undefined && entry.isSynergyGrant === undefined) entry.isSynergyGrant = rawEntry.isSynergyGrant;
      if (rawEntry.sourceCategory !== undefined && entry.sourceCategory === undefined) entry.sourceCategory = rawEntry.sourceCategory;
      const cleanNameLower = String(entry.name || '').toLowerCase().trim();
      if (cleanNameLower.includes('steadfast determination')) {
        entry.ruleFlags.conToWillSave = true;
        entry.ruleFlags.noAutoFailFortSaveOnNat1 = true;
      }
      if (cleanNameLower.includes('agile shield fighter') || cleanNameLower.includes('agile shiled fighter')) {
        entry.name = 'Agile Shield Fighter';
        entry.type = 'Feat';
        entry.category = 'Fighter';
        entry.isFighterBonusFeat = true;
        entry.source = "Player's Handbook II, p. 74";
        entry.prereq = 'Shield Proficiency, Improved Shield Bash, Shield Specialization';
        entry.prerequisites = 'Shield Proficiency, Improved Shield Bash, Shield Specialization';
        entry.benefit = 'When making a shield bash and armed strike attack as part of a full attack action, you take a -2 penalty on each attack. These penalties replace the normal ones you incur for fighting with two weapons.';
        entry.description = 'You are skilled in combining your shield bash attack with an armed strike. When you use your shield in unison with a weapon, your training allows you to score telling blows with both.\n\nPrerequisites: Proficiency with shields, Improved Shield Bash, Shield Specialization.\n\nBenefit: When making a shield bash and armed strike attack as part of a full attack action, you take a -2 penalty on each attack. These penalties replace the normal ones you incur for fighting with two weapons.\n\nSpecial: A fighter can select Agile Shield Fighter as one of his fighter bonus feats.';
        entry.special = 'A fighter can select Agile Shield Fighter as one of his fighter bonus feats.';
        entry.ruleFlags.agileShieldFighter = true;
      }
      delete entry.isChild;
      delete entry.parent;

      return entry;
    },

    migrateMasterDbEntryToV2(raw) {
      return SchemaMigrator.upgradeEntryToV2(raw);
    },

    /**
     * Folds any legacy `isChild` / `"↳ ..."` entries in an array into their parent item's `modes`
     * and upgrades all items in the array to Canonical V2.
     */
    upgradeArrayToV2(arr) {
      if (!Array.isArray(arr)) return [];
      const parents = [];
      const children = [];

      for (let i = 0; i < arr.length; i++) {
        const it = arr[i];
        if (!it) continue;
        if (it.isChild || it.parent || (typeof it.name === 'string' && it.name.trim().startsWith('↳'))) {
          children.push(it);
        } else {
          parents.push(SchemaMigrator.upgradeEntryToV2(it));
        }
      }

      // Fold any custom children into parent's modes if not already present
      for (let i = 0; i < children.length; i++) {
        const ch = children[i];
        const pName = normalizeNameKey(ch.parent || ch.name.replace(/^↳\s*/, '').split('(')[0]);
        const parentObj = parents.find((p) => normalizeNameKey(p.name).includes(pName));
        if (parentObj) {
          parentObj.modes = Array.isArray(parentObj.modes) ? parentObj.modes : [];
          const chLabel = String(ch.name || 'Alt Mode').replace(/^↳\s*/, '').trim();
          const alreadyHas = parentObj.modes.some((m) => normalizeNameKey(m.label) === normalizeNameKey(chLabel));
          if (!alreadyHas) {
            const v2Ch = SchemaMigrator.upgradeEntryToV2(ch);
            parentObj.modes.push({
              id: slugify(chLabel, 'mode'),
              label: chLabel,
              handedness: v2Ch.ruleFlags && v2Ch.ruleFlags.doubleWeaponOffHand ? 'light' : '2h',
              combatScope: v2Ch.combatScope || 'melee',
              critRange: v2Ch.critRange || parentObj.critRange || 20,
              critMult: v2Ch.critMult || parentObj.critMult || 2,
              damageParts: v2Ch.damageParts,
              modifiers: v2Ch.modifiers,
              ruleFlags: v2Ch.ruleFlags
            });
          }
        }
      }

      return parents;
    },

    getAbilityStemAndScore(entry) {
      if (!entry || typeof entry !== 'object') {
        const s = typeof entry === 'string' ? entry.toLowerCase().trim() : '';
        return { stem: s, score: 0, isMalformedSlug: false, hasTypedDamage: false, hasSaveOrDc: false };
      }
      const rawName = String(entry.name || '').toLowerCase();
      const stem = rawName
        .replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\b(?:damage|deals|dealing)\b.*$/i, ' ')
        .replace(/\b(?:weapon|attack|blast|strike|ability)\b\s*$/i, ' ')
        .replace(/[^a-z0-9\s]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const idStr = String(entry.id || '').toLowerCase().trim();
      const isMalformedSlug = /_(?:damage|deals|dealing)(?:_|$)/i.test(idStr);
      const hasTypedDamage = (Array.isArray(entry.damageParts) && entry.damageParts.some(dp => dp && dp.type && !/^(untyped|physical)$/i.test(String(dp.type).trim()))) ||
        (Array.isArray(entry.modes) && entry.modes.some(m => Array.isArray(m.damageParts) && m.damageParts.some(dp => dp && dp.type && !/^(untyped|physical)$/i.test(String(dp.type).trim()))));
      const hasSaveOrDc = Boolean(entry.dcFormula || entry.save || (Array.isArray(entry.modes) && entry.modes.some(m => m && m.save)));
      const hasRecharge = Boolean(entry.recharge || entry.rechargeDice || (Array.isArray(entry.resources) && entry.resources.length > 0));
      const score = (hasTypedDamage ? 2 : 0) + (hasSaveOrDc ? 2 : 0) + (hasRecharge ? 1 : 0) + (entry.range ? 1 : 0) - (isMalformedSlug ? 3 : 0);
      return { stem, score, isMalformedSlug, hasTypedDamage, hasSaveOrDc };
    },

    sanitizeCharacterAbilitiesAndPool(charData) {
      if (!charData || typeof charData !== 'object') return charData;
      const EXPLICIT_NON_GEAR_CATS = new Set([
        'special ability', 'dm grant', 'dm boon', 'boon',
        'feat', 'flaw', 'class feature', 'racial trait', 'synergy', 'template',
        'spell', 'maneuver', 'stance'
      ]);
      const STRICT_NON_PHYSICAL_CATS = new Set([
        'special ability', 'dm boon', 'dm grant', 'boon', 'feat', 'flaw', 'class feature', 'racial trait', 'synergy', 'template'
      ]);
      const PHYSICAL_SLOTS = new Set([
        'mainhand', 'main hand', 'offhand', 'off-hand', 'off hand', 'off-hand/shield', 'two hands', 'two-handed',
        'body', 'ring', 'ring1', 'ring2', 'neck', 'throat', 'waist', 'belt', 'shoulders',
        'head', 'eyes', 'face', 'feet', 'boots', 'hands', 'gloves', 'arms', 'bracers',
        'torso', 'armor', 'shield', 'weapon'
      ]);
      const PHYSICAL_GEAR_RX = /\b(scroll|wand|potion|oil|elixir|staff|rod|ring|amulet|cloak|boots|gloves|bracers|belt|helm|shield|armor|sword|dagger|bow|crossbow|axe|mace|spear)\b/i;

      if (!Array.isArray(charData.specialAbilities)) charData.specialAbilities = [];
      if (!Array.isArray(charData.feats)) charData.feats = [];
      if (!Array.isArray(charData.spells)) charData.spells = [];

      const pushUniqueEntry = (targetArr, item) => {
        const idStr = String(item.id || '').trim();
        const nmLower = String(item.name || '').toLowerCase().trim();
        const exists = targetArr.some(existing => {
          if (!existing) return false;
          if (typeof existing === 'string') return existing.toLowerCase().trim() === nmLower;
          return (idStr && String(existing.id || '').trim() === idStr) ||
            (nmLower && String(existing.name || '').toLowerCase().trim() === nmLower);
        });
        if (!exists) targetArr.push(item);
      };

      if (Array.isArray(charData.gearPool)) {
        const cleanPool = [];
        for (let i = 0; i < charData.gearPool.length; i++) {
          const item = charData.gearPool[i];
          if (!item || typeof item !== 'object') continue;
          const idStr = String(item.id || '').trim();
          const idLower = idStr.toLowerCase();
          const catLower = String(item.category || item.type || '').toLowerCase().trim();
          const typeLower = String(item.type || '').toLowerCase().trim();
          const slotLower = String(item.slot || '').toLowerCase().trim();
          const nameStr = String(item.name || '');

          const hasPhysicalSlot = PHYSICAL_SLOTS.has(slotLower);
          const isScrollOrWand = PHYSICAL_GEAR_RX.test(nameStr) || PHYSICAL_GEAR_RX.test(catLower) || PHYSICAL_GEAR_RX.test(typeLower);
          const hasPhysicalEconomy = Number(item.cost) > 0 || Number(item.gpValue) > 0 || Number(item.priceGp) > 0 ||
            Number(item.weight) > 0 || Number(item.weightLb) > 0 || Boolean(item.weaponStats || item.armorStats || item.baseItemId);
          const isStrictNonPhysicalCat = STRICT_NON_PHYSICAL_CATS.has(catLower) || STRICT_NON_PHYSICAL_CATS.has(typeLower);
          const isMalformedAbilitySlug = /_(?:damage|deals|dealing)(?:_|$)/i.test(idLower);

          // Physical Item Guard (B1): keep physical items in gearPool unless explicitly typed as non-gear ability/feat/boon
          if ((hasPhysicalSlot || isScrollOrWand || hasPhysicalEconomy) && !isStrictNonPhysicalCat && !isMalformedAbilitySlug) {
            cleanPool.push(item);
            continue;
          }

          const effectiveCat = EXPLICIT_NON_GEAR_CATS.has(catLower)
            ? catLower
            : (EXPLICIT_NON_GEAR_CATS.has(typeLower) ? typeLower : '');

          if (item.autoUnlock === true || item.isSynergy === true || effectiveCat === 'synergy') {
            // Synergies auto-unlock dynamically via RuleEngine.evaluateLegoCharacter; ensure preserved in customDb before removing from gearPool
            if (!Array.isArray(charData.customDb)) charData.customDb = [];
            pushUniqueEntry(charData.customDb, item);
            continue;
          } else if (effectiveCat === 'feat' || effectiveCat === 'flaw') {
            pushUniqueEntry(charData.feats, item);
            continue;
          } else if (effectiveCat === 'spell' && !isScrollOrWand) {
            pushUniqueEntry(charData.spells, item);
            continue;
          } else if (
            effectiveCat === 'maneuver' ||
            effectiveCat === 'stance' ||
            effectiveCat === 'special ability' ||
            effectiveCat === 'dm grant' ||
            effectiveCat === 'dm boon' ||
            effectiveCat === 'boon' ||
            effectiveCat === 'class feature' ||
            effectiveCat === 'racial trait' ||
            effectiveCat === 'template' ||
            isMalformedAbilitySlug
          ) {
            pushUniqueEntry(charData.specialAbilities, item);
            continue;
          }

          cleanPool.push(item);
        }
        charData.gearPool = cleanPool;
      }

      // Generic Stem & Completeness Deduplication (B2 & M1)
      if (Array.isArray(charData.specialAbilities) && charData.specialAbilities.length > 0) {
        const stemMaxScore = new Map();
        for (let i = 0; i < charData.specialAbilities.length; i++) {
          const a = charData.specialAbilities[i];
          if (!a || typeof a !== 'object') continue;
          const info = SchemaMigrator.getAbilityStemAndScore(a);
          if (!info.stem) continue;
          const prev = stemMaxScore.has(info.stem) ? stemMaxScore.get(info.stem) : -Infinity;
          if (info.score > prev) stemMaxScore.set(info.stem, info.score);
        }

        charData.specialAbilities = charData.specialAbilities.filter(a => {
          if (!a || typeof a !== 'object') return true;
          if (Array.isArray(a.overrides) && a.overrides.length > 0) return true;
          if (Array.isArray(a.modifiers) && a.modifiers.length > 0) return true;
          const info = SchemaMigrator.getAbilityStemAndScore(a);
          if (!info.stem) return true;
          const maxScore = stemMaxScore.get(info.stem);
          if (maxScore !== undefined && maxScore >= 2 && info.score < maxScore) {
            if (info.isMalformedSlug || (info.score <= 1 && !info.hasTypedDamage && !info.hasSaveOrDc)) {
              return false;
            }
          }
          return true;
        });

        if (Array.isArray(charData.customDb)) {
          charData.customDb = charData.customDb.filter(entry => {
            if (!entry || typeof entry !== 'object') return true;
            const info = SchemaMigrator.getAbilityStemAndScore(entry);
            if (info.isMalformedSlug && info.stem && (stemMaxScore.get(info.stem) || 0) >= 2) {
              return false;
            }
            return true;
          });
        }
      }

      return charData;
    },

    /**
     * Upgrades an entire character sheet object (`characterData`) to Canonical V2 (`schemaVersion: 2`)
     * on load, including inventory, feats, spells, buffs, and `smartNotes`.
     */
    upgradeCharacterToV2(charData) {
      if (!charData || typeof charData !== 'object') return charData;

      SchemaMigrator.sanitizeCharacterAbilitiesAndPool(charData);

      const listKeys = ['inventory', 'gear', 'weapons', 'armors', 'feats', 'specialAbilities', 'spells', 'buffs'];
      for (let i = 0; i < listKeys.length; i++) {
        const k = listKeys[i];
        if (Array.isArray(charData[k])) {
          charData[k] = SchemaMigrator.upgradeArrayToV2(charData[k]);
        }
      }

      SchemaMigrator.sanitizeCharacterAbilitiesAndPool(charData);

      // Migrate legacy plain-text `notes` into structured `smartNotes` for `HubNotes` compatibility
      if (!Array.isArray(charData.smartNotes)) {
        charData.smartNotes = [];
      }
      if (typeof charData.notes === 'string' && charData.notes.trim() && charData.smartNotes.length === 0) {
        charData.smartNotes.push({
          id: 'note_migrated_v2',
          title: 'Character Notes',
          text: `${charData.notes.trim()} #general`,
          tags: ['general'],
          pinned: true,
          ts: Date.now()
        });
      }

      charData.schemaVersion = 2;
      return charData;
    }
  };

  // ==========================================================================
  // EXPORT TO GLOBAL WINDOW
  // ==========================================================================
  global.SrdCompendium = SrdCompendium;
  global.ItemAssembler = ItemAssembler;
  global.SchemaMigrator = SchemaMigrator;

  // Early start: on a page whose <script> tag carries data-srd-autoinit (the character sheet), begin
  // loading the SRD as soon as this file runs, so the fetch overlaps the remaining deferred scripts.
  // init() is idempotent: later init() calls (the sheet boot, pickers) receive this same promise.
  // Pages without the attribute (the Hub) keep calling init() themselves, as before.
  try {
    const selfTag = typeof document !== 'undefined' ? document.currentScript : null;
    if (selfTag && selfTag.hasAttribute('data-srd-autoinit') && !isNodeSyncEnv()) {
      SrdCompendium.init();
    }
  } catch (_) {}

})(typeof window !== 'undefined' ? window : globalThis);
