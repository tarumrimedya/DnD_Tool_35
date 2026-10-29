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
  const IDB_VERSION = 1;
  const IDB_STORE = 'chunks';

  const EAGER_CHUNKS = [
    'srd_equipment.json',
    'srd_feats.json',
    'srd_classes_races.json',
    'srd_combat_rules.json',
    'srd_spells.json'
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
  const _loadedChunks = new Set();  // chunk filenames currently in memory
  const _chunkPromises = new Map(); // in-flight chunk load promises
  let _indexData = null;            // srd_index.json payload
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
  function registerEntries(records) {
    if (!Array.isArray(records)) return;
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      if (!rec || !rec.id) continue;
      _byId.set(rec.id, rec);
      const nKey = normalizeNameKey(rec.name);
      if (nKey) {
        if (!_byName.has(nKey)) {
          _byName.set(nKey, rec);
        }
        const tKey = `${String(rec.type || '').toLowerCase()}:${nKey}`;
        _byTypeAndName.set(tKey, rec);
      }
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
          // 1. Load srd_index.json (fall back to IDB if offline)
          try {
            const idxRes = await fetch(`${_basePath}/srd_index.json`, { cache: 'no-cache' });
            if (idxRes.ok) {
              _indexData = await idxRes.json();
              await idbSet('srd_index.json', _indexData.compendiumHash, _indexData);
            }
          } catch (_) {
            const cachedIdx = await idbGet('srd_index.json');
            if (cachedIdx && cachedIdx.data) {
              _indexData = cachedIdx.data;
            }
          }

          if (!_indexData) {
            console.warn('[SrdCompendium] srd_index.json unavailable.');
            return false;
          }

          // 2. Load eager chunks in parallel (using versioned IndexedDB cache)
          const chunksToLoad = options.preloadAll
            ? [...EAGER_CHUNKS, ...LAZY_CHUNKS]
            : EAGER_CHUNKS;

          await Promise.all(chunksToLoad.map((fname) => SrdCompendium.ensureChunkLoaded(fname)));
          _ready = true;

          // Expose legacy compatibility catalog array reference if needed during transition
          if (typeof global.dispatchEvent === 'function') {
            global.dispatchEvent(new CustomEvent('srdCompendiumReady', {
              detail: {
                totalIndexed: _indexData.totalEntries,
                loadedEntries: _byId.size,
                compendiumHash: _indexData.compendiumHash
              }
            }));
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
     * Ensures a specific chunk (e.g. 'srd_spells.json' or 'srd_monsters.json') is loaded into memory.
     */
    async ensureChunkLoaded(fileName) {
      if (_loadedChunks.has(fileName)) return true;
      if (_chunkPromises.has(fileName)) return _chunkPromises.get(fileName);

      const p = (async () => {
        const meta = _indexData && _indexData.chunks && _indexData.chunks[fileName];
        const expectedHash = meta ? meta.hash : null;
        const records = await fetchJsonChunk(fileName, expectedHash);
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
      const out = [];
      const tf = typeFilter
        ? (Array.isArray(typeFilter)
            ? new Set(typeFilter.map((t) => String(t).toLowerCase()))
            : new Set([String(typeFilter).toLowerCase()]))
        : null;

      _byId.forEach((val) => {
        if (!tf || tf.has(String(val.type || '').toLowerCase())) {
          out.push(val);
        }
      });
      return out;
    },

    /**
     * Reads the user's dynamic Master DB (`master_db.json` / `localStorage`) and ensures V2 shape.
     */
    getMasterDb() {
      try {
        if (global.RuleMaster && typeof global.RuleMaster.getDatabase === 'function') {
          const db = global.RuleMaster.getDatabase();
          if (Array.isArray(db)) return db;
        }
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('dnd35_master_db') : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {
        // Ignore parse error
      }
      return [];
    },

    /**
     * Unified Search across all 3,522 SRD Index entries AND the user's dynamic Master DB.
     * Supports type, category, slot, level, isFighterBonusFeat, and resolveFull options.
     */
    search(query = '', filters = {}) {
      const q = normalizeNameKey(query);
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

        if (allowedTypes && !allowedTypes.has(tLower)) return;
        if (catFilter && !cLower.includes(catFilter)) return;
        if (slotFilter && sLower !== slotFilter) return;
        if (fighterOnly && !isFb) return;
        if (levelFilter !== null && Number(level) !== levelFilter) return;

        let score = isCustom ? 5 : 0;
        if (q) {
          if (nLower === q) {
            score += 1000;
          } else if (nLower.startsWith(q)) {
            score += 600 - Math.min(100, nLower.length);
          } else if (nLower.includes(q)) {
            score += 350 - Math.min(100, nLower.indexOf(q));
          } else {
            // Token match across name + category + type
            const haystack = `${nLower} ${cLower} ${tLower}`;
            for (let i = 0; i < qTokens.length; i++) {
              if (!haystack.includes(qTokens[i])) return;
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
      const bypassDRSet = new Set(Array.isArray(item.ruleFlags.bypassDR) ? item.ruleFlags.bypassDR : []);
      if (matFlags.bypassDR) bypassDRSet.add(matFlags.bypassDR);

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
          const baseAc = Number(item.acBonus) || 0;
          const totalAc = baseAc + enhBonus;
          item.acBonus = totalAc;
          const acTarget = isShield ? 'ac.shield' : 'ac.armor';
          const acMod = item.modifiers.find((m) => m.target === acTarget);
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

      if (bypassDRSet.size > 0) {
        item.ruleFlags.bypassDR = Array.from(bypassDRSet);
        item.tacticalBadges.push({
          id: 'bypass-dr',
          label: `DR Bypass: ${item.ruleFlags.bypassDR.join(', ')}`,
          summary: `Overcomes Damage Reduction: ${item.ruleFlags.bypassDR.join(', ')}.`
        });
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
