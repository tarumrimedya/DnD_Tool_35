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

  /**
   * A cloud campaign's pack list after a sync: the cloud packs (`inCloud: true`), with the local packs that were
   * not confirmed in the cloud yet laid over them. `uploadedIds` holds the ones whose upload just succeeded; the
   * others stay `inCloud: false` and are uploaded again by the next sync.
   */
  function mergeCloudPacks(cloudPacks, localPacks, uploadedIds) {
    const up = uploadedIds instanceof Set ? uploadedIds : new Set(uploadedIds || []);
    let next = (Array.isArray(cloudPacks) ? cloudPacks : []).map(p => Object.assign({}, p, { inCloud: true }));
    (Array.isArray(localPacks) ? localPacks : []).filter(p => p && p.packId && p.inCloud !== true).forEach(p => {
      next = next.filter(np => norm(np.packId) !== norm(p.packId)).concat([Object.assign({}, p, { inCloud: up.has(p.packId) })]);
    });
    return next;
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

  // ---------------------------------------------------------------------------------------------------------------
  // Campaign bundle: one file with a main campaign, its sub-campaigns, Campaign DB packs, notes and characters.
  // ---------------------------------------------------------------------------------------------------------------
  const BUNDLE_FORMAT = 'dnd35-campaign-bundle';

  function notesOf(obj) {
    if (!obj) return [];
    if (Array.isArray(obj.smartNotes) && obj.smartNotes.length) return obj.smartNotes;
    return Array.isArray(obj.notesList) ? obj.notesList : [];
  }

  function setNotes(obj, list) {
    obj.smartNotes = list;
    obj.notesList = list;
  }

  // A character's DB without the active copies of the given packs: the importing campaign re-creates those from
  // its packs. Copies the DM removed but the character uses ('removed') and detached copies stay.
  function stripActivePackCopies(customDb, packIds) {
    const ids = new Set((packIds || []).map(norm));
    return (Array.isArray(customDb) ? customDb : []).filter(e => {
      const t = getTag(e);
      return !(t && t.status === 'active' && ids.has(norm(t.packId)));
    });
  }

  function characterHash(rec, packIds) {
    const fd = clone((rec && rec.fullData) || rec || {});
    fd.customDb = stripActivePackCopies(fd.customDb, packIds);
    ['id', 'campaignId', 'cloudCampaignId', 'lastModified'].forEach(k => { delete fd[k]; });
    return contentHash(fd);
  }

  /**
   * Builds a bundle for the main campaign `rootId` (a sub-campaign id resolves to its main campaign).
   * `state` is the Hub state `{ campaigns, characters }`. Returns null when the campaign is unknown.
   */
  function buildCampaignBundle(state, rootId, nowIso) {
    const camps = (state && Array.isArray(state.campaigns)) ? state.campaigns : [];
    let root = camps.find(c => c && (c.id === rootId || (c.cloudCampaignId && c.cloudCampaignId === rootId)));
    if (root && root.parentId) root = camps.find(c => c && c.id === root.parentId) || root;
    if (!root) return null;
    const subs = camps.filter(c => c && c.parentId === root.id);
    const scope = new Set([root.id].concat(subs.map(s => s.id)));
    const packs = (Array.isArray(root.packs) ? root.packs : []).map(p => ({
      packId: p.packId, name: p.name, version: p.version, entries: clone(p.entries || []), updatedAt: p.updatedAt || null
    }));
    const packIds = packs.map(p => p.packId);
    const campOut = (c) => {
      const o = clone(c);
      delete o.packs;
      delete o.invite_code;
      delete o.inviteCode;
      setNotes(o, clone(notesOf(c)));
      return o;
    };
    const characters = ((state && Array.isArray(state.characters)) ? state.characters : [])
      .filter(ch => ch && scope.has(ch.campaignId))
      .map(ch => {
        const o = clone(ch);
        if (o.fullData && typeof o.fullData === 'object') o.fullData.customDb = stripActivePackCopies(o.fullData.customDb, packIds);
        return o;
      });
    return {
      format: BUNDLE_FORMAT,
      schemaVersion: 1,
      exportedAt: nowIso || null,
      campaign: Object.assign(campOut(root), { packs }),
      subCampaigns: subs.map(campOut),
      characters
    };
  }

  function isCampaignBundle(parsed) {
    return Boolean(parsed && typeof parsed === 'object' && parsed.format === BUNDLE_FORMAT && parsed.campaign && parsed.campaign.id);
  }

  /**
   * Plans the import of a bundle into a Hub state. Pure: returns `{ campaigns, characters, rootId, packsChanged,
   * report }` built from copies; the caller saves them and uploads packs of a cloud campaign.
   * - No campaign with the bundle's id (or cloud id): the campaign, its sub-campaigns, notes, packs and characters
   *   are created as a local campaign.
   * - The campaign exists: each note, sub-campaign, character and pack is matched by id. Missing ones are added.
   *   An identical one is skipped. A different one is added as a new copy, with a new id and "(Imported <date>)"
   *   in its name; nothing existing is overwritten. A pack with the same id is attached as a new version.
   */
  function importCampaignBundle(state, bundle, opts) {
    const o = opts || {};
    const day = String(o.nowIso || new Date().toISOString()).slice(0, 10);
    const stamp = o.idStamp || String(Date.now());
    let seq = 0;
    const newId = (prefix) => `${prefix}_imp_${stamp}_${++seq}`;
    const suffix = ` (Imported ${day})`;
    const campaigns = clone((state && state.campaigns) || []);
    const characters = clone((state && state.characters) || []);
    const report = { campaignCreated: false, subCampaignsAdded: 0, notesAdded: 0, notesCopied: 0, notesSkipped: 0,
      charactersAdded: 0, charactersCopied: 0, charactersSkipped: 0, packsAdded: 0, packsUpdated: 0, packsSkipped: 0 };
    const bc = bundle.campaign;
    const bPacks = Array.isArray(bc.packs) ? bc.packs : [];
    const packIds = bPacks.map(p => p.packId);
    const ids = [bc.id, bc.cloudCampaignId].filter(Boolean);
    let root = campaigns.find(c => c && !c.parentId && (ids.includes(c.id) || (c.cloudCampaignId && ids.includes(c.cloudCampaignId))));
    const idMap = new Map(); // bundle campaign id -> Hub campaign id
    let packsChanged = false;

    const mergeNotes = (target, incoming) => {
      const list = notesOf(target).slice();
      (incoming || []).forEach(n => {
        if (!n || typeof n !== 'object') return;
        const cur = list.find(x => x && x.id === n.id);
        if (!cur) { list.push(clone(n)); report.notesAdded++; return; }
        if (contentHash(cur) === contentHash(n)) { report.notesSkipped++; return; }
        list.push(Object.assign(clone(n), { id: newId('note'), title: (n.title || 'Note') + suffix }));
        report.notesCopied++;
      });
      setNotes(target, list);
    };

    if (!root) {
      root = clone(bc);
      delete root.cloudCampaignId;
      delete root.parentId;
      if (campaigns.some(c => c && c.id === root.id)) root.id = newId('camp');
      root.packs = bPacks.map(p => Object.assign(clone(p), { inCloud: false }));
      campaigns.push(root);
      report.campaignCreated = true;
      report.notesAdded += notesOf(root).length;
      report.packsAdded += root.packs.length;
      packsChanged = root.packs.length > 0;
    } else {
      mergeNotes(root, notesOf(bc));
      let packs = Array.isArray(root.packs) ? root.packs.slice() : [];
      bPacks.forEach(p => {
        const cur = packs.find(x => x && norm(x.packId) === norm(p.packId));
        if (cur && contentHash(cur.entries) === contentHash(p.entries)) { report.packsSkipped++; return; }
        packs = attachPack(packs, p, o.nowIso || null);
        const added = packs.find(x => norm(x.packId) === norm(p.packId));
        if (added) added.inCloud = false;
        if (cur) report.packsUpdated++; else report.packsAdded++;
        packsChanged = true;
      });
      root.packs = packs;
    }
    idMap.set(bc.id, root.id);
    if (bc.cloudCampaignId) idMap.set(bc.cloudCampaignId, root.id);

    (Array.isArray(bundle.subCampaigns) ? bundle.subCampaigns : []).forEach(s => {
      if (!s || !s.id) return;
      const cur = campaigns.find(c => c && c.id === s.id);
      if (cur && cur.parentId === root.id) {
        mergeNotes(cur, notesOf(s));
        idMap.set(s.id, cur.id);
        return;
      }
      const sub = clone(s);
      sub.parentId = root.id;
      delete sub.cloudCampaignId;
      if (cur) sub.id = newId('camp');
      campaigns.push(sub);
      report.subCampaignsAdded++;
      report.notesAdded += notesOf(sub).length;
      idMap.set(s.id, sub.id);
    });

    const rootCloud = root.cloudCampaignId || null;
    (Array.isArray(bundle.characters) ? bundle.characters : []).forEach(ch => {
      if (!ch || !ch.id) return;
      const rec = clone(ch);
      rec.campaignId = idMap.get(ch.campaignId) || root.id;
      if (rec.fullData && typeof rec.fullData === 'object') {
        rec.fullData.campaignId = rec.campaignId;
        if (rootCloud) rec.fullData.cloudCampaignId = rootCloud; else delete rec.fullData.cloudCampaignId;
      }
      const cur = characters.find(c => c && c.id === ch.id);
      if (!cur) { characters.push(rec); report.charactersAdded++; return; }
      if (characterHash(cur, packIds) === characterHash(ch, packIds)) { report.charactersSkipped++; return; }
      const id = newId('char');
      rec.id = id;
      rec.name = (ch.name || 'Character') + suffix;
      rec.cloudSynced = false;
      if (rec.fullData && typeof rec.fullData === 'object') {
        rec.fullData.id = id;
        rec.fullData.name = rec.name;
        delete rec.fullData._hubId;
        delete rec.fullData._cloudUpdatedAt;
      }
      characters.push(rec);
      report.charactersCopied++;
    });

    return { campaigns, characters, rootId: root.id, packsChanged, report };
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Hub state sync (Supabase user_hub_state): the user's campaigns and their notes on every device.
  // ---------------------------------------------------------------------------------------------------------------
  const SYNC_KEY = '_hubSyncHash';

  // What a campaign looks like in the cloud row: no local sync marker, and no packs for a cloud campaign
  // (public.campaign_packs owns those). The hash ignores `_` keys, so the marker never changes it.
  function cloudFormOfCampaign(c) {
    const o = clone(c);
    delete o[SYNC_KEY];
    if (o.cloudCampaignId) delete o.packs;
    return o;
  }

  function mergeNotesById(localList, cloudList) {
    const out = [];
    const byId = new Map();
    (cloudList || []).concat(localList || []).forEach(n => {
      if (!n || typeof n !== 'object') return;
      const key = n.id || JSON.stringify(n);
      const prev = byId.get(key);
      if (!prev) { byId.set(key, n); out.push(key); return; }
      if (Number(n.updatedAt || 0) >= Number(prev.updatedAt || 0)) byId.set(key, n);
    });
    return out.map(k => clone(byId.get(k)));
  }

  /**
   * Three-way merge of the Hub's campaigns with the cloud row. Each local campaign keeps the hash it had at its
   * last sync (`_hubSyncHash`), so a side that did not change since then takes the other side's version:
   * - only this device changed it: the local version is kept and uploaded;
   * - only another device changed it: the cloud version is taken (a cloud campaign keeps its local packs);
   * - both changed: the cloud fields with the local ones on top, notes merged by id (newer updatedAt wins);
   * - present on one side only: kept (a deletion travels as an id in `deleted`, never by absence).
   * Returns `{ campaigns, deleted, upload, uploadDeleted, localChanged, cloudChanged }`.
   */
  function mergeHubCampaignState(localCampaigns, localDeleted, cloudRow) {
    const cloud = cloudRow && typeof cloudRow === 'object' ? cloudRow : {};
    const cloudCamps = Array.isArray(cloud.campaigns) ? cloud.campaigns : [];
    const deletedList = [];
    (Array.isArray(cloud.deletedCampaignIds) ? cloud.deletedCampaignIds : []).concat(Array.isArray(localDeleted) ? localDeleted : [])
      .forEach(id => { if (id && !deletedList.includes(id)) deletedList.push(id); });
    const deleted = new Set(deletedList);
    const locals = (Array.isArray(localCampaigns) ? localCampaigns : []).filter(c => c && c.id);
    const order = [];
    const L = new Map(), C = new Map();
    locals.forEach(c => { L.set(c.id, c); if (!order.includes(c.id)) order.push(c.id); });
    cloudCamps.forEach(c => { if (c && c.id) { C.set(c.id, c); if (!order.includes(c.id)) order.push(c.id); } });

    const merged = [];
    order.forEach(id => {
      if (deleted.has(id)) return;
      const l = L.get(id), c = C.get(id);
      let out;
      if (l && !c) out = clone(l);
      else if (!l && c) out = clone(c);
      else {
        const hL = contentHash(cloudFormOfCampaign(l)), hC = contentHash(cloudFormOfCampaign(c));
        const base = l[SYNC_KEY] || null;
        if (hL === hC || (base && hL !== base && hC === base)) out = clone(l);
        else if (base && hL === base) {
          out = clone(c);
          if (c.cloudCampaignId && Array.isArray(l.packs)) out.packs = clone(l.packs);
        } else {
          out = Object.assign(clone(c), clone(l));
          setNotes(out, mergeNotesById(notesOf(l), notesOf(c)));
        }
      }
      out[SYNC_KEY] = contentHash(cloudFormOfCampaign(out));
      merged.push(out);
    });

    const upload = merged.map(cloudFormOfCampaign);
    // Order-independent: two devices may list the same campaigns in a different order.
    const sig = (list) => stableStringify((list || []).map(cloudFormOfCampaign).sort((x, y) => String(x.id).localeCompare(String(y.id))));
    const localChanged = sig(merged) !== sig(locals) || locals.length !== merged.length;
    const cloudChanged = sig(upload) !== sig(cloudCamps) ||
      stableStringify(deletedList) !== stableStringify(Array.isArray(cloud.deletedCampaignIds) ? cloud.deletedCampaignIds : []);
    return { campaigns: merged, deleted: deletedList.slice(-500), upload, uploadDeleted: deletedList.slice(-500), localChanged, cloudChanged };
  }

  const api = { TAG, readPackFile, attachPack, removePack, mergeCloudPacks, getTag, collectUsedRefs, reconcile, contentHash,
    BUNDLE_FORMAT, buildCampaignBundle, isCampaignBundle, importCampaignBundle, mergeHubCampaignState };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CampaignDb = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
