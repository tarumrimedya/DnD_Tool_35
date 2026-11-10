/**
 * Campaign DB: the campaign's shared rule database (see CAMPAIGN_PACKS_DESIGN.md).
 *
 * A campaign holds DM rule packs (`{ packId, name, version, entries, updatedAt }`). Every character in the campaign
 * gets each pack entry as a tagged copy in its own `customDb` (ADR-011), so the rule engine and every picker keep
 * reading only the character's customDb, and the character still works offline or after leaving the campaign.
 *
 * Tag on each copy: `_campaignPack: { campaignId, packId, version, hash, status }`
 *   status 'active'   - follows the campaign pack
 *   status 'removed'  - the DM removed the entry, but the character uses it, so the copy is kept
 *   status 'detached' - the character is no longer in that campaign; the copy is kept and no longer updated
 *
 * Pure functions only (no DOM, no storage); shared by hub.html and the character sheet and tested in Node.
 */
(function (root) {
  'use strict';

  const TAG = '_campaignPack';

  function norm(v) {
    return String(v === undefined || v === null ? '' : v).toLowerCase().trim();
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function slug(s) {
    return norm(s).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  // Same change-detection hash as the SRD snapshots: stable JSON without `_` metadata keys, FNV-1a 32-bit.
  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value === undefined ? null : value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    const keys = Object.keys(value).filter(k => k.charAt(0) !== '_' && value[k] !== undefined).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
  }

  function contentHash(entry) {
    const s = stableStringify(entry || null);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  function packIdOf(raw) {
    if (!raw || typeof raw !== 'object') return '';
    if (raw.pack && typeof raw.pack === 'object') return String(raw.pack.id || raw.pack.name || '').trim();
    return String(raw.pack || raw.packId || '').trim();
  }

  /**
   * Reads a pack file `{ schemaVersion, pack: { id, name }, entries: [...] }`.
   * Returns `{ packId, name, entries }`, or null when the file has no pack id or no entries.
   * Entries without an id get `<packId>:<name slug>` so every copy can be matched by id.
   */
  function readPackFile(parsed) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.entries)) return null;
    const packId = packIdOf(parsed);
    if (!packId) return null;
    const name = (parsed.pack && typeof parsed.pack === 'object' && parsed.pack.name) ? String(parsed.pack.name) : packId;
    const entries = parsed.entries
      .filter(e => e && typeof e === 'object' && !Array.isArray(e) && e.name)
      .map(e => {
        const copy = clone(e);
        Object.keys(copy).forEach(k => { if (k.charAt(0) === '_') delete copy[k]; });
        if (!copy.id) copy.id = packId + ':' + slug(copy.name);
        copy.pack = packId;
        return copy;
      });
    if (entries.length === 0) return null;
    return { packId, name, entries };
  }

  /** Adds or replaces a pack in a campaign's pack list; the version goes up by one on every upload. */
  function attachPack(packs, pack, nowIso) {
    const list = Array.isArray(packs) ? packs.slice() : [];
    const i = list.findIndex(p => p && norm(p.packId) === norm(pack.packId));
    const version = (i >= 0 ? Number(list[i].version) || 0 : 0) + 1;
    const next = { packId: pack.packId, name: pack.name || pack.packId, version, entries: clone(pack.entries), updatedAt: nowIso || null };
    if (i >= 0) list[i] = next; else list.push(next);
    return list;
  }

  function removePack(packs, packId) {
    return (Array.isArray(packs) ? packs : []).filter(p => p && norm(p.packId) !== norm(packId));
  }

  function getTag(entry) {
    const t = entry && entry[TAG];
    return t && typeof t === 'object' && t.packId ? t : null;
  }

  /**
   * Ids and names the character uses (feats, special abilities, buffs, gear ...). A pack entry the DM removes is
   * kept on the character when it is used. Ids are also stored without their `pack:` prefix.
   */
  function collectUsedRefs(doc) {
    const used = new Set();
    if (!doc || typeof doc !== 'object') return used;
    const add = (v) => {
      const n = norm(v);
      if (!n) return;
      used.add(n);
      if (n.indexOf(':') >= 0) used.add(n.split(':').pop());
    };
    const addItem = (x) => {
      if (!x) return;
      if (typeof x === 'string') { add(x); add(x.replace(/^[^A-Za-z0-9(]+(\[.*?\])?\s*/, '')); return; }
      if (typeof x !== 'object') return;
      add(x.id); add(x.name); add(x.baseItemId); add(x.masterDbName);
    };
    ['feats', 'specialAbilities', 'buffs', 'legoEntries', 'classFeatures', 'traits', 'flaws', 'gearPool', 'consumables', 'activeModifiers']
      .forEach(k => { if (Array.isArray(doc[k])) doc[k].forEach(addItem); });
    if (doc.bodySlots && typeof doc.bodySlots === 'object') {
      Object.keys(doc.bodySlots).forEach(k => {
        const v = doc.bodySlots[k];
        if (Array.isArray(v)) v.forEach(addItem); else addItem(v);
      });
    }
    return used;
  }

  function isUsed(entry, used) {
    if (!used || used.size === 0 || !entry) return false;
    const id = norm(entry.id);
    return (id && (used.has(id) || used.has(id.split(':').pop()))) || used.has(norm(entry.name));
  }

  function makeCopy(entry, pack, campaignId, hash) {
    const copy = clone(entry);
    Object.keys(copy).forEach(k => { if (k.charAt(0) === '_') delete copy[k]; });
    copy.pack = pack.packId;
    copy[TAG] = { campaignId, packId: pack.packId, version: Number(pack.version) || 1, hash, status: 'active' };
    return copy;
  }

  /**
   * Brings a character's customDb in line with its campaign's packs. Mutates `customDb` in place.
   *   packs       - the packs of the character's (root) campaign; [] when it has none
   *   campaignId  - that campaign's id; null when the character is in no campaign
   *   used        - collectUsedRefs(character)
   * The character's own entries (no tag) are never overwritten: a clash by id, or by name with a compatible type,
   * skips the pack entry and reports it. An untagged entry with the same id and the same `pack` value (a pack the
   * player imported by hand earlier) is adopted as the pack's copy, so nothing is duplicated.
   */
  function reconcile(customDb, packs, opts) {
    const o = opts || {};
    const campaignId = o.campaignId || null;
    const used = o.used instanceof Set ? o.used : new Set();
    const res = { added: 0, updated: 0, adopted: 0, removed: 0, keptRemoved: 0, detached: 0, skipped: [], changed: false };
    if (!Array.isArray(customDb)) return res;
    const packList = campaignId && Array.isArray(packs) ? packs.filter(p => p && p.packId && Array.isArray(p.entries)) : [];

    const wanted = new Set();
    packList.forEach(p => p.entries.forEach(e => { if (e && e.name) wanted.add(norm(p.packId) + '\u0000' + norm(e.id)); }));

    // 1. Copies that no longer belong to the campaign's packs.
    for (let i = customDb.length - 1; i >= 0; i--) {
      const e = customDb[i];
      const t = getTag(e);
      if (!t) continue;
      if (!campaignId || t.campaignId !== campaignId) {
        if (t.status !== 'detached') { t.status = 'detached'; res.detached++; }
        continue;
      }
      if (wanted.has(norm(t.packId) + '\u0000' + norm(e.id))) continue;
      if (isUsed(e, used)) {
        if (t.status !== 'removed') { t.status = 'removed'; res.keptRemoved++; }
      } else {
        customDb.splice(i, 1);
        res.removed++;
      }
    }

    // 2. Add, refresh or adopt the pack entries.
    packList.forEach(pack => {
      pack.entries.forEach(entry => {
        if (!entry || !entry.name) return;
        const id = norm(entry.id);
        const hash = contentHash(entry);
        const tagged = customDb.findIndex(e => { const t = getTag(e); return t && norm(t.packId) === norm(pack.packId) && norm(e.id) === id; });
        if (tagged >= 0) {
          const t = getTag(customDb[tagged]);
          if (t.hash !== hash || t.campaignId !== campaignId || t.status !== 'active' || t.version !== (Number(pack.version) || 1)) {
            customDb[tagged] = makeCopy(entry, pack, campaignId, hash);
            res.updated++;
          }
          return;
        }
        const sameId = id ? customDb.findIndex(e => e && !getTag(e) && norm(e.id) === id) : -1;
        if (sameId >= 0) {
          if (norm(packIdOf(customDb[sameId])) === norm(pack.packId)) {
            customDb[sameId] = makeCopy(entry, pack, campaignId, hash);
            res.adopted++;
          } else {
            res.skipped.push({ packId: pack.packId, name: entry.name, reason: 'same id as a character entry' });
          }
          return;
        }
        const name = norm(entry.name), type = norm(entry.type);
        const clash = customDb.some(e => {
          if (!e || getTag(e) || norm(e.name) !== name) return false;
          const et = norm(e.type);
          return !type || !et || type === et;
        });
        if (clash) {
          res.skipped.push({ packId: pack.packId, name: entry.name, reason: 'same name as a character entry' });
          return;
        }
        customDb.push(makeCopy(entry, pack, campaignId, hash));
        res.added++;
      });
    });

    res.changed = Boolean(res.added || res.updated || res.adopted || res.removed || res.keptRemoved || res.detached);
    return res;
  }

  const api = { TAG, readPackFile, attachPack, removePack, getTag, collectUsedRefs, reconcile, contentHash };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CampaignDb = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
