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
  const IDB_VERSION = 4;
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
    'srd_templates.json'
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
      .toLowerCase()
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

  let _nodeSyncInitialized = false;
  function ensureNodeSyncLoaded() {
    if (_nodeSyncInitialized || _byId.size > 0) return;
    if (typeof require === 'function' && (typeof window === 'undefined' || typeof window.fetch !== 'function')) {
      _nodeSyncInitialized = true;
      try {
        const fs = require('fs');
        const path = require('path');
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
          const chunksToLoad = options.preloadAll
            ? [...EAGER_CHUNKS, ...LAZY_CHUNKS]
            : EAGER_CHUNKS;

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
      await SrdCompendium.init();
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
     * Unified Search across all 3,522 SRD Index entries AND the user's dynamic Master DB.
     * Supports type, category, slot, level, isFighterBonusFeat, and resolveFull options.
     */
    search(query = '', filters = {}) {
      const q = normalizeNameKey(query);
      const qClean = q ? q.replace(/[^a-z0-9]/g, '') : '';
      const qTokens = q ? q.split(/\s+/).filter(Boolean) : [];
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
        const nLower = normalizeNameKey(name);
        const nClean = nLower.replace(/[^a-z0-9]/g, '');

        if (allowedTypes && !allowedTypes.has(tLower)) return;
        if (catFilter && !cLower.includes(catFilter)) return;
        if (slotFilter && sLower !== slotFilter) return;
        if (fighterOnly && !isFb) return;
        if (levelFilter !== null && Number(level) !== levelFilter) return;

        let score = (q && isCustom) ? 5 : 0;
        if (q) {
          if (nLower === q || (qClean && nClean === qClean)) {
            score += 1000;
          } else if (nLower.startsWith(q) || (qClean.length >= 3 && nClean.startsWith(qClean))) {
            score += 600 - Math.min(100, nLower.length);
          } else if (nLower.includes(q) || (qClean.length >= 3 && nClean.includes(qClean))) {
            score += 350 - Math.min(100, nLower.indexOf(q));
          } else {
            // Token match across name + category + type
            const haystack = `${nLower} ${cLower} ${tLower}`;
            for (let i = 0; i < qTokens.length; i++) {
              const tok = qTokens[i];
              if (!haystack.includes(tok) && !nClean.includes(tok)) return;
            }
            score += 150;
          }
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

    getMaterials() {
      return this.getAllLoaded('Material');
    },

    getEnhancements(targetType = null) {
      const list = this.getAllLoaded('Enhancement');
      if (!targetType) return list;
      return list.filter((e) => !e.targetType || e.targetType === targetType || e.targetType === 'Any');
    },

    getCrystals(targetType = null) {
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
            condition: 'Weapon Enhancement'
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
            condition: 'Masterwork'
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
      let working = rawText.trim();
      if (!working) return null;

      let enhancementBonus = 0;
      const bonusMatch = working.match(/(?:^|\s)\+([1-9]|10)(?=\s|$)/i);
      if (bonusMatch) {
        enhancementBonus = parseInt(bonusMatch[1], 10) || 0;
        working = working.replace(bonusMatch[0], ' ').trim();
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

      const enhancements = [];
      const allEnhs = [
        ...SrdCompendium.getEnhancements('Weapon'),
        ...SrdCompendium.getEnhancements('Armor')
      ];
      const seenEnhIds = new Set();
      const sortedEnhs = [];
      for (let i = 0; i < allEnhs.length; i++) {
        if (!seenEnhIds.has(allEnhs[i].id)) {
          seenEnhIds.add(allEnhs[i].id);
          sortedEnhs.push(allEnhs[i]);
        }
      }
      sortedEnhs.sort((a, b) => (b.name || '').length - (a.name || '').length);

      for (let i = 0; i < sortedEnhs.length; i++) {
        const enh = sortedEnhs[i];
        const eName = String(enh.name || '').trim();
        if (!eName) continue;
        const escaped = eName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`\\b${escaped}\\b`, 'i');
        if (re.test(working)) {
          enhancements.push(enh.id);
          working = working.replace(re, ' ').trim();
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

      const baseQuery = working
        .replace(/\bof\b/gi, ' ')
        .replace(/[(),]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!baseQuery) return null;

      const baseRef = SrdCompendium.getByName(baseQuery, 'Weapon') ||
        SrdCompendium.getByName(baseQuery, 'Armor') ||
        SrdCompendium.getByName(baseQuery, 'Shield') ||
        SrdCompendium.getById(`wpn-${slugify(baseQuery)}`) ||
        SrdCompendium.getById(`arm-${slugify(baseQuery)}`) ||
        SrdCompendium.getById(`shd-${slugify(baseQuery)}`);

      if (!baseRef || !['Weapon', 'Armor', 'Shield'].includes(baseRef.type)) {
        return null;
      }

      try {
        return ItemAssembler.assemble({
          baseItem: baseRef,
          baseItemId: baseRef.id,
          material,
          masterwork,
          enhancementBonus,
          enhancements,
          crystal,
          source: 'ItemAssembler-ZeroToken'
        });
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
    { key: 'attBonus', target: 'attack.all' },
    { key: 'dmgBonus', target: 'damage.weapon' },
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

      // 1. Migrate legacy 16 flat bonus fields into universal `modifiers`
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

    /**
     * Upgrades an entire character sheet object (`characterData`) to Canonical V2 (`schemaVersion: 2`)
     * on load, including inventory, feats, spells, buffs, and `smartNotes`.
     */
    upgradeCharacterToV2(charData) {
      if (!charData || typeof charData !== 'object') return charData;

      const listKeys = ['inventory', 'gear', 'weapons', 'armors', 'feats', 'specialAbilities', 'spells', 'buffs'];
      for (let i = 0; i < listKeys.length; i++) {
        const k = listKeys[i];
        if (Array.isArray(charData[k])) {
          charData[k] = SchemaMigrator.upgradeArrayToV2(charData[k]);
        }
      }

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

})(typeof window !== 'undefined' ? window : globalThis);
