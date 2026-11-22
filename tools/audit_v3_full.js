#!/usr/bin/env node
'use strict';

/**
 * Full V3 audit (0 tokens, on demand; NOT part of verify_and_sync yet).
 *
 *   Layer 1  V2 -> V3 parity: every record of the pre-migration corpus (git `7802b25^`, the commit before
 *            "migrate all 7,987 corpus & Bestiary entries to pure Canonical V3") and its current version are
 *            run through the SAME current engine (`RuleEngine.evaluateV3Entry`, which seeds V2 `modifiers` /
 *            `damageParts` and walks V3 `effects[]`) on probe characters and every mode. The outputs are reduced
 *            to atoms (target | bonus type | condition | value) and compared: LOST (V2 had it, now gone),
 *            CHANGED (same target+type+condition, other value), ADDED, RENAMED / REMOVED records.
 *   Layer 2  dead blocks: every block of every current record must produce engine output in at least one probe.
 *   Layer 3  reference integrity: every refId / targetId / baseItemId / known id-shaped string resolves; armor /
 *            shield records whose armorBonus already includes the enhancement (the engine adds it again).
 *   Layer 4  text coverage (heuristic): claims parsed from benefit / text / traits by tools/lib/v3_claims.js
 *            ("+2 racial bonus on Will saves", "darkvision 60 ft.", "3/day") vs the same engine atoms.
 *            The claim parser is the seed of the future text-to-block generator.
 *
 *   Reviewed intended differences: tools/audit_v3_allowlist.json (id -> reason / commit).
 *
 * What it proves: internal consistency and V2 parity. Not book correctness (V2 had its own errors).
 *
 *   node tools/audit_v3_full.js                       full report -> audit_v3_full_report.md (repo root)
 *   node tools/audit_v3_full.js --json out.json       also write the raw result
 *   node tools/audit_v3_full.js --id feat-dodge       print the atoms of one record (V2 vs now) and exit
 *   AUDIT_V2_REF=<git ref>                            other V2 baseline (default 7802b25^)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');
const V2_REF = process.env.AUDIT_V2_REF || '7802b25^';

// ---------------------------------------------------------------- corpus loading
function chunkEntries(raw) {
  return (Array.isArray(raw) ? raw : (raw && raw.entries) || []).filter((e) => e && typeof e === 'object' && e.id);
}

function loadCurrentCorpus() {
  const idx = JSON.parse(fs.readFileSync(path.join(DB_DIR, 'srd_index.json'), 'utf8'));
  const byId = new Map();
  for (const chunk of Object.keys(idx.chunks || {})) {
    const fp = path.join(DB_DIR, chunk);
    if (!fs.existsSync(fp)) continue;
    chunkEntries(JSON.parse(fs.readFileSync(fp, 'utf8'))).forEach((e) => { if (!byId.has(e.id)) byId.set(e.id, Object.assign({ _chunk: chunk }, e)); });
  }
  return byId;
}

function gitShow(ref, file) {
  return execFileSync('git', ['show', ref + ':' + file], { cwd: ROOT, maxBuffer: 1 << 30 }).toString('utf8');
}

function loadV2Corpus(ref) {
  const idx = JSON.parse(gitShow(ref, 'database/srd_index.json'));
  const byId = new Map();
  for (const chunk of Object.keys(idx.chunks || {})) {
    let raw;
    try { raw = JSON.parse(gitShow(ref, 'database/' + chunk)); } catch (_) { continue; }
    chunkEntries(raw).forEach((e) => { if (!byId.has(e.id)) byId.set(e.id, Object.assign({ _chunk: chunk }, e)); });
  }
  return byId;
}

// ---------------------------------------------------------------- engine harness
function loadEngine() {
  const RuleEngine = require(path.join(ROOT, 'rule_engine.js'));
  return RuleEngine;
}

// Probe characters: low / mid / high level, mixed caster + martial so @classLevel, @cl, @hd, ability mods resolve.
function makeProbes() {
  const mk = (lvl) => ({
    name: 'Audit Probe ' + lvl,
    level: lvl,
    hd: lvl,
    abilities: { str: 16, dex: 14, con: 14, int: 14, wis: 14, cha: 14 },
    levelProgression: Array.from({ length: lvl }, (_, i) => ({ className: i % 2 ? 'Cleric' : 'Fighter', level: i + 1, active: true })),
    classes: [{ name: 'Fighter', level: Math.ceil(lvl / 2) }, { name: 'Cleric', level: Math.floor(lvl / 2) }],
    bab: lvl,
    tactical: {},
    inventory: [],
    bodySlots: {},
    activeModes: {}
  });
  return [mk(1), mk(10), mk(20)];
}

const IGNORE_GRANT_KEYS = new Set(['source', 'sourceLabel', 'label', 'id', 'blockId', '_blockId', 'origin']);

function normCond(c) {
  if (c === undefined || c === null || c === '' || c === false) return '';
  if (typeof c === 'object') return stableStr(c);
  return String(c).toLowerCase().replace(/\bvs\b\.?/g, 'vs').replace(/\s+/g, ' ').replace(/[.;,\s]+$/, '').trim();
}
// Spelling variants of the same bonus type / damage type / target (not semantic changes)
const TYPE_ALIASES = { naturalarmor: 'natural', '': 'untyped' };
const DMG_TYPE_ALIASES = { 'positive energy': 'positive', 'negative energy': 'negative', healing: 'positive' };
const TARGET_ALIASES = { grapple: 'atk.grapple', cmb: 'atk.grapple', 'resource.pp': 'psionics.powerPoints' };
function normType(t) {
  const k = String(t || 'untyped').toLowerCase().replace(/[\s_-]+/g, '');
  return TYPE_ALIASES[k] !== undefined ? TYPE_ALIASES[k] : k;
}
function stableStr(o) {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return '[' + o.map(stableStr).join(',') + ']';
  return '{' + Object.keys(o).filter((k) => !IGNORE_GRANT_KEYS.has(k)).sort().map((k) => k + ':' + stableStr(o[k])).join(',') + '}';
}
// A V2 modifier with a formula carries a placeholder `value` (often 0); consumers evaluate the formula.
// Evaluate it the same way for both sides so V2 `value: 0, formula: "11+2*@enhancement"` compares by result.
function numOrFormula(m, fctx) {
  const f = m.formula;
  const hasFormula = f !== undefined && f !== null && f !== '' && !Number.isFinite(Number(f));
  if (hasFormula && fctx) {
    let r;
    try { r = fctx.RE.evaluateFormula(String(f), fctx.ctx); } catch (_) { r = NaN; }
    if (Number.isFinite(Number(r))) return String(Math.round(Number(r) * 1000) / 1000);
    return 'f:' + String(f).replace(/\s+/g, '');
  }
  const v = Number(m.value);
  if (Number.isFinite(v) && (m.value !== '' && m.value !== null && m.value !== undefined)) return String(Math.round(v * 1000) / 1000);
  if (hasFormula) return 'f:' + String(f).replace(/\s+/g, '');
  return String(m.value);
}

/** Reduce one evaluated entry to atom map key -> value-string. key = kind|target|type|condition */
function atomsOf(ev, canonTarget, fctx) {
  const atoms = new Map();
  const put = (k, v) => {
    const prev = atoms.get(k);
    atoms.set(k, prev === undefined ? v : prev + '&' + v);
  };
  (ev.modifiers || []).forEach((m) => {
    if (!m) return;
    let t = canonTarget(m.target);
    if (TARGET_ALIASES[t]) t = TARGET_ALIASES[t];
    put('mod|' + t + '|' + normType(m.type) + '|' + normCond(m.condition), (m.op && m.op !== 'add' ? m.op + ':' : '') + numOrFormula(m, fctx));
  });
  // A selected weapon mode (double weapon head, two-handed grip) REPLACES the base damage in combat: V2 put it in
  // mode.damageParts, V3 in mode.damageDice / mode.weapon. Use the mode's damage alone when it defines one.
  const am = ev.activeMode;
  let parts = ev.damageParts || [];
  if (am && typeof am === 'object') {
    const mDice = am.damageDice || (am.weapon && am.weapon.damageDice);
    if (Array.isArray(am.damageParts) && am.damageParts.length) parts = am.damageParts;
    else if (mDice) parts = [{ dice: mDice, type: am.dmgType || (am.weapon && am.weapon.dmgType) || '' }];
  }
  const seenDmg = new Set();
  parts.forEach((d) => {
    if (!d) return;
    const dt = String(d.type || '').toLowerCase().trim();
    const key = 'dmg|' + (DMG_TYPE_ALIASES[dt] || dt) + '|' + normCond(d.condition) + (d.onCritOnly ? '|crit' : '');
    const val = String(d.dice || '').replace(/\s+/g, '') + (d.bonus ? '+' + d.bonus : '');
    // the same part listed twice: kept as its own `dup` atom so a real double-count stays visible
    if (seenDmg.has(key + '=' + val)) { put('dup' + key, val); return; }
    seenDmg.add(key + '=' + val);
    put(key, val);
  });
  (ev.defenses || []).forEach((d) => { if (d) put('def|' + String(d.kind || d.type || '').toLowerCase(), stableStr(d)); });
  (ev.resources || []).forEach((r) => { if (r) put('res|' + String(r.name || r.id || '').toLowerCase(), String(r.max ?? r.maxFormula ?? '')); });
  (ev.grants || []).forEach((g) => { if (g) put('grant|' + String(g.kind || g.effectKind || g.grantType || g.type || '').toLowerCase(), stableStr(g)); });
  const rf = ev.ruleFlags || {};
  Object.keys(rf).forEach((k) => {
    const v = rf[k];
    if (v === false || v === null || v === undefined || v === 0 || v === '') return;
    put('flag|' + k, typeof v === 'object' ? stableStr(v) : String(v));
  });
  return atoms;
}

function cloneEntry(e) {
  const c = JSON.parse(JSON.stringify(e));
  delete c._chunk;
  return c;
}

/** Union of atoms over all probes x (no mode + every mode). Values keyed per probe so level scaling is compared. */
function fingerprint(RE, entry, probes, canonTarget, errors) {
  const out = new Map();
  const modeCount = Array.isArray(entry.modes) ? entry.modes.length : 0;
  const selectors = [undefined].concat(Array.from({ length: modeCount }, (_, i) => i));
  probes.forEach((probe, pi) => {
    selectors.forEach((sel) => {
      let ev;
      try {
        RE._activeCharacter = probe;
        const ctx = { character: probe, level: probe.level, cl: probe.level };
        if (sel !== undefined) ctx.activeModeIdx = sel;
        ev = RE.evaluateV3Entry(cloneEntry(entry), ctx);
      } catch (err) {
        errors.push(entry.id + ': evaluateV3Entry threw ' + (err && err.message));
        return;
      }
      const tag = (sel === undefined ? '' : 'mode' + sel + '|');
      let fctx = null;
      try { fctx = { RE, ctx: RE.buildV3FormulaContext(probe, ev, {}) }; } catch (_) { fctx = null; }
      atomsOf(ev, canonTarget, fctx).forEach((v, k) => {
        const key = tag + k;
        const cur = out.get(key) || [];
        cur[pi] = v;
        out.set(key, cur);
      });
    });
  });
  const flat = new Map();
  out.forEach((arr, k) => {
    const vals = probes.map((_, i) => (arr[i] === undefined ? '-' : arr[i]));
    flat.set(k, vals.every((v) => v === vals[0]) ? vals[0] : vals.join(' / '));
  });
  return flat;
}

// ---------------------------------------------------------------- layer 1
function normName(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }

/**
 * Explainers: a LOST / CHANGED atom that is a verified structural move, not a loss. Each one checks the
 * current record, so the explanation stops applying the moment the data stops matching.
 * (atomKey without mode prefix, value, v2 record, current record) -> reason | null
 */
const EXPLAINERS = [
  (k, v, a, b) => {
    const m = /^mod\|speed\.(all|land)\|racial\|$/.exec(k);
    if (!m || !b || !b.race) return null;
    return Number(b.race.speed) === 30 + Number(v) ? 'racial speed modifier became the Race base speed (race.speed ' + b.race.speed + ')' : null;
  },
  // V2 listed the same modifier twice (double count); V3 keeps it once
  (k, v, a, b, it) => (it && it.to !== undefined && it.from === it.to + '&' + it.to ? 'V2 listed this modifier twice (double count), V3 once' : null),
  // Weapon damage "+N" where N is the weapon's enhancement: evaluateWeaponAttack adds `enhancementBonus` itself
  (k, v, a, b, it) => {
    if (!it || it.to === undefined || !/^dmg\|/.test(k) || !b || b.type !== 'Weapon') return null;
    const m = /^(.+)\+(-?\d+)$/.exec(String(it.from));
    const enh = Number(b.enhancementBonus || (b.weapon && b.weapon.enhancementBonus) || 0);
    return m && m[1] === it.to && Number(m[2]) === enh && enh > 0 ? 'weapon enhancement +' + enh + ' now comes from enhancementBonus (evaluateWeaponAttack)' : null;
  },
  // "(Not Set)" placeholder feats: an unbound choice slot either way (V2 raw `choice.*`, now resolved from the name)
  (k, v, a, b) => (b && /\(not set\)/i.test(b.name || '') && /^mod\|choice\./.test(k) ? 'unbound "(Not Set)" placeholder choice' : null)
];

// Does any engine / sheet source read this ruleFlags key? A lost flag nobody reads has no mechanical effect.
let SOURCE_TEXT = null;
const CONSUMER_FILES = ['rule_engine.js', 'char_combat.js', 'char_hud.js', 'char_spells.js', 'char_progression.js', 'char_inventory.js', 'char_store.js', 'ui_components.js', 'ui_shared.js'];
function flagHasConsumer(key) {
  if (SOURCE_TEXT === null) {
    SOURCE_TEXT = CONSUMER_FILES.map((f) => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } }).join('\n');
  }
  return new RegExp('\\b' + String(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(SOURCE_TEXT);
}

// Block keys read straight from the raw record by the sheet (not through evaluateV3Entry), e.g. castSpell in char_spells.js
let UI_TEXT = null;
function readOutsideEngine(key) {
  if (UI_TEXT === null) {
    UI_TEXT = CONSUMER_FILES.filter((f) => f !== 'rule_engine.js').map((f) => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } }).join('\n');
  }
  return new RegExp('[\'"`]' + String(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\'"`]').test(UI_TEXT);
}

function loadAllowlist() {
  const fp = path.join(__dirname, 'audit_v3_allowlist.json');
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (_) { return { records: {}, removed: {} }; }
}

function explain(item, a, b) {
  const k = item.k.replace(/^mode\d+\|/, '');
  for (const fn of EXPLAINERS) {
    const r = fn(k, item.v !== undefined ? item.v : item.from, a, b, item);
    if (r) return r;
  }
  return null;
}

function runParity(RE, v2, cur, canonTarget) {
  const allowlist = loadAllowlist();
  const probes = makeProbes();
  const errors = [];
  const removedIds = [...v2.keys()].filter((id) => !cur.has(id));
  const addedIds = [...cur.keys()].filter((id) => !v2.has(id));
  // rename = removed + added record with the same type and name
  const addedByName = new Map();
  addedIds.forEach((id) => {
    const e = cur.get(id);
    const k = normName(e.type) + '|' + normName(e.name);
    if (!addedByName.has(k)) addedByName.set(k, []);
    addedByName.get(k).push(id);
  });
  const pairs = [];
  const renamed = [];
  const removed = [];
  v2.forEach((e, id) => { if (cur.has(id)) pairs.push([id, id]); });
  removedIds.forEach((id) => {
    const e = v2.get(id);
    const cand = addedByName.get(normName(e.type) + '|' + normName(e.name));
    if (cand && cand.length) { const to = cand.shift(); renamed.push([id, to]); pairs.push([id, to]); }
    else removed.push(id);
  });
  const renamedTo = new Set(renamed.map((r) => r[1]));
  const added = addedIds.filter((id) => !renamedTo.has(id));
  // Removed records: did they carry mechanics, and where did they go (an id in code, a current record of the same name)?
  const curByName = new Map();
  cur.forEach((e, id) => { const k = normName(e.name); if (!curByName.has(k)) curByName.set(k, []); curByName.get(k).push(id); });
  if (SOURCE_TEXT === null) flagHasConsumer('__init__');
  const removedInfo = removed.map((id) => {
    const e = v2.get(id);
    const fp = fingerprint(RE, e, probes, canonTarget, errors);
    const inCode = new RegExp('[\'"]' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\'"]').test(SOURCE_TEXT);
    const sameName = (curByName.get(normName(e.name)) || []).filter((x) => x !== id);
    const why = (allowlist.removed || {})[id] || Object.entries(allowlist.removedPrefixes || {}).filter(([p]) => id.startsWith(p)).map(([, r]) => r)[0];
    return { id, type: e.type, name: e.name, atoms: fp.size, inCode, sameName, allow: why };
  });

  const records = [];
  let identical = 0;
  pairs.forEach(([oldId, newId]) => {
    const a = fingerprint(RE, v2.get(oldId), probes, canonTarget, errors);
    const b = fingerprint(RE, cur.get(newId), probes, canonTarget, errors);
    const lost = [];
    const changed = [];
    const gained = [];
    const explained = [];
    const recA = v2.get(oldId);
    const recB = cur.get(newId);
    a.forEach((v, k) => {
      if (!b.has(k)) {
        const it = { k, v };
        const why = explain(it, recA, recB);
        if (why) explained.push(Object.assign(it, { why })); else lost.push(it);
      } else if (b.get(k) !== v) {
        const it = { k, from: v, to: b.get(k) };
        const why = explain(it, recA, recB);
        if (why) explained.push(Object.assign(it, { why })); else changed.push(it);
      }
    });
    b.forEach((v, k) => { if (!a.has(k)) gained.push({ k, v }); });
    // A lost atom and a gained atom on the same kind|target (other bonus type / condition / damage qualifier)
    // are one CHANGED item, not a loss plus an unrelated gain.
    const head = (k) => { const p = k.split('|'); return p[0].startsWith('mode') ? p.slice(0, 3).join('|') : p.slice(0, 2).join('|'); };
    for (let i = lost.length - 1; i >= 0; i--) {
      const gi = gained.findIndex((g) => head(g.k) === head(lost[i].k) && !g.k.startsWith('dup'));
      if (gi < 0) continue;
      const g = gained.splice(gi, 1)[0];
      const it = { k: lost[i].k, from: lost[i].v, to: g.v, toKey: g.k };
      lost.splice(i, 1);
      const why = explain(it, recA, recB);
      if (why) explained.push(Object.assign(it, { why })); else changed.push(it);
    }
    lost.forEach((x) => { if (x.k.replace(/^mode\d+\|/, '').startsWith('flag|')) x.consumer = flagHasConsumer(x.k.split('|').pop()); });
    if (!lost.length && !changed.length && !gained.length && !explained.length) { identical++; return; }
    const allow = (allowlist.records || {})[newId];
    records.push({ id: newId, oldId: oldId !== newId ? oldId : undefined, type: recB.type, name: recB.name, lost, changed, gained, explained, allow: allow || undefined, v2Atoms: a.size, nowAtoms: b.size });
  });
  return { pairs: pairs.length, identical, records, renamed, removed, removedInfo, added, errors };
}

// ---------------------------------------------------------------- layer 2: dead blocks
/**
 * Every top-level block (and every mode block) of every current record is evaluated ALONE with all branch
 * conditions forced true (maximal output). A block that still adds no atom is dead: unknown target, a kind the
 * entry evaluator ignores, or a shape the engine cannot read. `powers[]` sub-powers are a separate system
 * (expandEntryPowers) and are not scanned here.
 */
const STD_OUT_KEYS = new Set(['modifiers', 'damageParts', 'defenses', 'resources', 'grants', 'ruleFlags', 'tacticalBadges', 'effects', 'modes', 'activeMode', 'activeModeIdx', 'activeModeId']);
function rawOutputDiff(RE, base, probe, probes, modeIdx) {
  const fields = new Set();
  let badges = false;
  probes.forEach((p) => {
    const ctx = { character: p, level: p.level, cl: p.level };
    if (modeIdx !== undefined) ctx.activeModeIdx = modeIdx;
    let a; let b;
    try { RE._activeCharacter = p; a = RE.evaluateV3Entry(cloneEntry(base), ctx); b = RE.evaluateV3Entry(cloneEntry(probe), ctx); } catch (_) { return; }
    Object.keys(b).forEach((k) => {
      if (STD_OUT_KEYS.has(k)) return;
      if (stableStr(a[k]) !== stableStr(b[k])) fields.add(k);
    });
    if (stableStr(a.tacticalBadges || []) !== stableStr(b.tacticalBadges || [])) badges = true;
  });
  return { fields: [...fields], badges };
}

function runDeadBlocks(RE, cur, canonTarget) {
  const probes = makeProbes().slice(1);
  const origCond = RE.evaluateV3BranchCondition;
  const origPred = RE.evaluatePredicate;
  const origResolve = RE.resolveV3WhenCondition;
  RE.evaluateV3BranchCondition = function () { return true; };
  RE.evaluatePredicate = function () { return true; };
  RE.resolveV3WhenCondition = function () { return true; };
  const errors = [];
  const dead = [];
  let scanned = 0;
  try {
    cur.forEach((e, id) => {
      const lists = [];
      if (Array.isArray(e.effects) && e.effects.length) lists.push({ where: 'effects', blocks: e.effects });
      (Array.isArray(e.modes) ? e.modes : []).forEach((m, mi) => {
        const bl = m && (Array.isArray(m.blocks) && m.blocks.length ? m.blocks : m.effects);
        if (Array.isArray(bl) && bl.length) lists.push({ where: 'modes[' + mi + ']', blocks: bl, modeIdx: mi });
      });
      if (!lists.length) return;
      const base = cloneEntry(e);
      base.effects = [];
      if (Array.isArray(base.modes)) base.modes = base.modes.map((m) => Object.assign({}, m, { blocks: [], effects: [] }));
      const baseFp = fingerprint(RE, base, probes, canonTarget, errors);
      lists.forEach((L) => {
        L.blocks.forEach((blk, bi) => {
          if (!blk || typeof blk !== 'object') return;
          scanned++;
          const probe = cloneEntry(base);
          if (L.modeIdx === undefined) probe.effects = [blk];
          else probe.modes[L.modeIdx] = Object.assign({}, probe.modes[L.modeIdx], { blocks: [blk], effects: [blk] });
          const fp = fingerprint(RE, probe, probes, canonTarget, errors);
          let adds = 0;
          fp.forEach((v, k) => { if (baseFp.get(k) !== v) adds++; });
          if (adds) return;
          // Other output fields (tempHp, concealment, ... set directly on the evaluated entry) and display badges
          const side = rawOutputDiff(RE, base, probe, probes, L.modeIdx);
          if (side.fields.length) return;
          // Does the block only repeat what the record already declares at top level (ruleFlags / damageParts /
          // modifiers)? Strip those and compare again: then it is redundant, not dead.
          const strip = (x) => { const c = cloneEntry(x); delete c.ruleFlags; delete c.damageParts; delete c.modifiers; return c; };
          const fpS0 = fingerprint(RE, strip(base), probes, canonTarget, errors);
          const fpS1 = fingerprint(RE, strip(probe), probes, canonTarget, errors);
          let addsStripped = 0;
          fpS1.forEach((v, k) => { if (fpS0.get(k) !== v) addsStripped++; });
          const blkKey = [blk.effectKind, blk.carrierMode, blk.mode, blk.kind].filter(Boolean).map(String);
          dead.push({
            id, type: e.type, where: L.where + '[' + bi + ']', blockType: blk.type,
            target: blk.targets || blk.target || blk.effectKind || blk.kind || blk.stat || blk.mode || '', blockId: blk.id || '',
            cls: addsStripped ? 'redundant' : (side.badges ? 'badgeOnly' : 'none'),
            readElsewhere: blkKey.some((k) => k.length > 3 && readOutsideEngine(k) && !/^(rule|effect|attack|defense|roll)$/i.test(k))
          });
        });
      });
    });
  } finally {
    RE.evaluateV3BranchCondition = origCond;
    RE.evaluatePredicate = origPred;
    RE.resolveV3WhenCondition = origResolve;
  }
  return { scanned, dead, errors };
}

// ---------------------------------------------------------------- layer 3: reference integrity + structure
const REF_KEYS = new Set(['refId', 'targetId', 'baseItemId', 'baseEntryId', 'variantOf', 'linkedSpell', 'spellId', 'featId', 'itemId', 'replaces', 'grants', 'srdId']);

function runRefIntegrity(cur) {
  const ids = new Set(cur.keys());
  const prefixes = new Set();
  ids.forEach((id) => { const m = /^([a-z]+)-/.exec(id); if (m) prefixes.add(m[1]); });
  const broken = [];
  const visit = (node, rec, keyPath, parentKey) => {
    if (Array.isArray(node)) { node.forEach((x, i) => visit(x, rec, keyPath + '[' + i + ']', parentKey)); return; }
    if (node && typeof node === 'object') { Object.keys(node).forEach((k) => visit(node[k], rec, keyPath + '.' + k, k)); return; }
    if (typeof node !== 'string' || !REF_KEYS.has(parentKey)) return;
    const s = node.trim();
    const m = /^([a-z]+)-[a-z0-9][a-z0-9-]*$/.exec(s);
    if (!m || !prefixes.has(m[1])) return; // free text / token (weapon:martial, toggle keys) is not an id
    if (!ids.has(s) && !ids.has(s.replace(/-plus-\d+$/, ''))) broken.push({ id: rec.id, path: keyPath.replace(/^\./, ''), ref: s });
  };
  cur.forEach((e) => { const c = Object.assign({}, e); delete c._chunk; delete c.id; visit(c, e, '', ''); });

  // Armor / shield chassis: `armor.armorBonus` must be the BASE bonus; resolveArmorChassis adds enhancementBonus.
  const doubleEnh = [];
  const legacyContractIssues = [];
  cur.forEach((e) => {
    const a = e.armor;
    const enh = Number(e.enhancementBonus || 0);
    if (a && typeof a === 'object' && (enh > 0) && e.baseItemId) {
      const base = cur.get(e.baseItemId);
      const baseBonus = base && base.armor ? Number(base.armor.armorBonus) : NaN;
      if (Number.isFinite(baseBonus) && Number(a.armorBonus) === baseBonus + enh) {
        doubleEnh.push({ id: e.id, name: e.name, armorBonus: a.armorBonus, base: e.baseItemId, baseBonus, enh, engineTotal: Number(a.armorBonus) + enh });
      }
    }
    const scObj = e.spellcasting || e.casting || (e.progression && e.progression.spellcastingChassis) || null;
    if (scObj && typeof scObj === 'object' && scObj.knownSource !== undefined && scObj.knownSource !== null && scObj.knownSource !== '') {
      if (!['spellbook', 'fullList', 'knownList'].includes(String(scObj.knownSource))) {
        legacyContractIssues.push({ id: e.id, issue: 'invalid casting.knownSource: ' + scObj.knownSource });
      }
    }
    (e.effects || []).forEach((ef) => {
      if (!ef || typeof ef !== 'object') return;
      if (ef.type === 'carrier' && ef.carrierMode === 'metamagic' && (ef.slotDelta !== undefined || ef.metaTransform !== undefined)) {
        legacyContractIssues.push({ id: e.id, issue: 'legacy slotDelta/metaTransform on metamagic carrier' });
      }
      if (ef.type === 'effect' && ef.effectKind === 'ruleSwitch' && ef.flag === 'shock-trooper') {
        legacyContractIssues.push({ id: e.id, issue: 'placeholder ruleSwitch flag shock-trooper' });
      }
    });
  });
  return { broken, doubleEnh, legacyContractIssues };
}

// ---------------------------------------------------------------- layer 4: text coverage (heuristic)
const TEXT_SKIP_TYPES = new Set(['Monster', 'Class', 'DamageType']); // stat-block text / class tables (gate + class batches cover these)

function runTextCoverage(RE, cur, canonTarget) {
  const claimsLib = require(path.join(__dirname, 'lib', 'v3_claims.js'));
  const probes = makeProbes();
  const errors = [];
  const rows = [];
  cur.forEach((e, id) => {
    if (TEXT_SKIP_TYPES.has(e.type)) return;
    const claims = claimsLib.extractClaims(claimsLib.recordText(e));
    if (!claims.length) { rows.push({ id, type: e.type, verdict: 'NOCLAIM', claims: [] }); return; }
    const fp = fingerprint(RE, e, probes, canonTarget, errors);
    const cov = claimsLib.coverage(claims, fp, e);
    const miss = cov.filter((c) => c.status === 'missing').length;
    const val = cov.filter((c) => c.status === 'value').length;
    const verdict = miss === cov.length ? 'MISSING' : (miss ? 'PARTIAL' : (val ? 'VALUE' : 'OK'));
    rows.push({ id, type: e.type, name: e.name, verdict, claims: cov.filter((c) => c.status !== 'ok') });
  });
  return { rows, errors };
}

// ---------------------------------------------------------------- report
function writeReport(res, file) {
  const p = res.parity;
  const open = p.records.filter((r) => !r.allow);
  const allowed = p.records.filter((r) => r.allow && (r.lost.length || r.changed.length));
  const lostRecs = open.filter((r) => r.lost.length);
  const changedRecs = open.filter((r) => !r.lost.length && r.changed.length);
  const gainOnly = p.records.filter((r) => !r.lost.length && !r.changed.length);
  const explainedCount = p.records.reduce((n, r) => n + r.explained.length, 0);
  const byType = {};
  lostRecs.forEach((r) => { byType[r.type] = (byType[r.type] || 0) + 1; });
  const lostKinds = {};
  lostRecs.forEach((r) => r.lost.forEach((x) => { const k = x.k.replace(/^mode\d+\|/, '').split('|')[0] + '|' + x.k.replace(/^mode\d+\|/, '').split('|')[1]; lostKinds[k] = (lostKinds[k] || 0) + 1; }));
  const L = [];
  L.push('# V3 full audit report');
  L.push('');
  L.push('Generated by `tools/audit_v3_full.js`. V2 baseline: git `' + V2_REF + '`. Engine: current `rule_engine.js` on both sides.');
  L.push('');
  L.push('## Layer 1: V2 -> V3 parity');
  L.push('');
  L.push('| | count |');
  L.push('|---|---|');
  L.push('| record pairs compared | ' + p.pairs + ' |');
  L.push('| identical engine output | ' + p.identical + ' |');
  L.push('| LOST (V2 output missing now) | ' + lostRecs.length + ' |');
  L.push('| CHANGED only | ' + changedRecs.length + ' |');
  L.push('| ADDED only (enriched) | ' + gainOnly.length + ' |');
  L.push('| allowlisted with a reason (LOST/CHANGED reviewed) | ' + allowed.length + ' |');
  L.push('| atoms explained by a verified structural move | ' + explainedCount + ' |');
  L.push('| renamed records | ' + p.renamed.length + ' |');
  L.push('| removed records | ' + p.removed.length + ' |');
  L.push('| new records | ' + p.added.length + ' |');
  L.push('| engine errors | ' + p.errors.length + ' |');
  L.push('');
  L.push('LOST by record type: ' + Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', '));
  L.push('');
  L.push('LOST by atom kind|target (top 40): ' + Object.entries(lostKinds).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, v]) => '`' + k + '` ' + v).join(', '));
  L.push('');
  const fmtRec = (r) => {
    const out = ['### ' + r.id + (r.oldId ? ' (was ' + r.oldId + ')' : '') + ' — ' + r.type + ' "' + r.name + '"'];
    r.lost.forEach((x) => out.push('- LOST `' + x.k + '` = ' + x.v + (x.consumer === false ? ' (no code reads this flag)' : '')));
    r.changed.forEach((x) => out.push('- CHANGED `' + x.k + '`' + (x.toKey ? ' -> `' + x.toKey + '`' : '') + ': ' + x.from + ' -> ' + x.to));
    r.gained.forEach((x) => out.push('- added `' + x.k + '` = ' + x.v));
    r.explained.forEach((x) => out.push('- explained `' + x.k + '`: ' + x.why));
    if (r.allow) out.push('- ALLOWLISTED: ' + r.allow);
    return out.join('\n');
  };
  L.push('## LOST records');
  L.push('');
  lostRecs.forEach((r) => { L.push(fmtRec(r)); L.push(''); });
  L.push('## CHANGED records');
  L.push('');
  changedRecs.forEach((r) => { L.push(fmtRec(r)); L.push(''); });
  L.push('## Allowlisted records (reviewed, reason recorded in tools/audit_v3_allowlist.json)');
  L.push('');
  allowed.forEach((r) => { L.push(fmtRec(r)); L.push(''); });
  L.push('## ADDED-only records (ids)');
  L.push('');
  L.push(gainOnly.map((r) => r.id).join(', '));
  L.push('');
  L.push('## Renamed / removed / new');
  L.push('');
  L.push('Renamed: ' + p.renamed.map((r) => r[0] + ' -> ' + r[1]).join(', '));
  L.push('');
  L.push('Removed records (V2 mechanics atoms / where it lives now):');
  L.push('');
  p.removedInfo.forEach((x) => L.push('- ' + x.id + ' (' + x.type + ' "' + x.name + '", ' + x.atoms + ' atoms): '
    + (x.allow ? 'ALLOWLISTED: ' + x.allow : (x.inCode ? 'id is defined in code (rule_engine.js / sheet)' : (x.sameName.length ? 'same-name record now: ' + x.sameName.join(', ') : 'NO replacement found')))));
  L.push('');
  L.push('New: ' + p.added.join(', '));
  L.push('');
  const d = res.deadBlocks;
  L.push('## Layer 2: dead blocks');
  L.push('');
  L.push(d.dead.length + ' of ' + d.scanned + ' blocks add no mechanical engine output even with every condition forced true (each block evaluated alone, probes level 10/20). Classes:');
  L.push('');
  L.push('- `none`: no output at all (not even a display badge) and no sheet code reads the block kind: dead.');
  L.push('- `badgeOnly`: only a display badge (text). Fine for narrative blocks; a problem when the text states a number.');
  L.push('- `redundant`: repeats a top-level `ruleFlags` / `damageParts` / `modifiers` value of the same record.');
  L.push('- `readElsewhere`: the sheet reads the raw block kind directly (e.g. castSpell in char_spells.js).');
  L.push('');
  const tgtStr = (x) => (Array.isArray(x.target) ? x.target.join(', ') : String(x.target)).replace(/\|/g, '/');
  const groups = { none: [], badgeOnly: [], redundant: [], readElsewhere: [] };
  d.dead.forEach((x) => groups[x.readElsewhere ? 'readElsewhere' : x.cls].push(x));
  Object.keys(groups).forEach((g) => {
    const list = groups[g];
    const dk = {};
    list.forEach((x) => { const k = x.blockType + ' | ' + tgtStr(x); dk[k] = (dk[k] || 0) + 1; });
    L.push('### ' + g + ' (' + list.length + ')');
    L.push('');
    L.push('By block | target: ' + Object.entries(dk).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, v]) => '`' + k + '` ' + v).join(', '));
    L.push('');
    if (g === 'badgeOnly' || g === 'redundant') {
      L.push('Records: ' + list.map((x) => x.id + ' ' + x.where).join(', '));
    } else {
      L.push('| record | type | where | block | target |');
      L.push('|---|---|---|---|---|');
      list.forEach((x) => L.push('| ' + x.id + ' | ' + x.type + ' | ' + x.where + ' | ' + x.blockType + ' | ' + tgtStr(x) + ' |'));
    }
    L.push('');
  });
  const r3 = res.refs;
  L.push('## Layer 3: reference integrity and structure');
  L.push('');
  L.push('Unresolved ids (' + r3.broken.length + '):');
  L.push('');
  r3.broken.forEach((x) => L.push('- ' + x.id + ' `' + x.path + '` -> `' + x.ref + '`'));
  L.push('');
  L.push('Armor / shield records whose `armor.armorBonus` already includes the enhancement (resolveArmorChassis adds `enhancementBonus` again) (' + r3.doubleEnh.length + '):');
  L.push('');
  r3.doubleEnh.forEach((x) => L.push('- ' + x.id + ' "' + x.name + '": armorBonus ' + x.armorBonus + ' = ' + x.base + ' ' + x.baseBonus + ' + enh ' + x.enh + ' -> engine total ' + x.engineTotal));
  L.push('');
  const tc = res.text;
  L.push('## Layer 4: text coverage (heuristic, low confidence)');
  L.push('');
  L.push('Claims parsed from `benefit` / `text` / `special` / `traits` by `tools/lib/v3_claims.js` and matched against the same engine atoms. '
    + 'MISSING = every claim has no engine output; PARTIAL = some do not; VALUE = the family exists but the number differs; OK; NOCLAIM. '
    + 'Skipped types: ' + [...TEXT_SKIP_TYPES].join(', ') + '. Conditional riders ("against", "when") are matched by family only.');
  L.push('');
  const vt = {};
  tc.rows.forEach((r) => { vt[r.type] = vt[r.type] || { total: 0, MISSING: 0, PARTIAL: 0, VALUE: 0, OK: 0, NOCLAIM: 0 }; vt[r.type].total++; vt[r.type][r.verdict]++; });
  L.push('| type | total | MISSING | PARTIAL | VALUE | OK | NOCLAIM |');
  L.push('|---|---|---|---|---|---|---|');
  const tot = { total: 0, MISSING: 0, PARTIAL: 0, VALUE: 0, OK: 0, NOCLAIM: 0 };
  Object.entries(vt).sort((a, b) => (b[1].MISSING + b[1].PARTIAL) - (a[1].MISSING + a[1].PARTIAL)).forEach(([t, c]) => {
    Object.keys(tot).forEach((k) => { tot[k] += c[k]; });
    L.push('| ' + t + ' | ' + c.total + ' | ' + c.MISSING + ' | ' + c.PARTIAL + ' | ' + c.VALUE + ' | ' + c.OK + ' | ' + c.NOCLAIM + ' |');
  });
  L.push('| **all** | ' + tot.total + ' | ' + tot.MISSING + ' | ' + tot.PARTIAL + ' | ' + tot.VALUE + ' | ' + tot.OK + ' | ' + tot.NOCLAIM + ' |');
  L.push('');
  const fam = {};
  tc.rows.forEach((r) => r.claims.forEach((c) => { const k = c.family + ' ' + c.status; fam[k] = (fam[k] || 0) + 1; }));
  L.push('Uncovered claims by family: ' + Object.entries(fam).sort((a, b) => b[1] - a[1]).map(([k, v]) => '`' + k + '` ' + v).join(', '));
  L.push('');
  const worst = tc.rows.filter((r) => r.claims.length).sort((a, b) => b.claims.filter((c) => c.status === 'missing').length - a.claims.filter((c) => c.status === 'missing').length);
  L.push('Records with uncovered claims (' + worst.length + '; first 300, all in --json):');
  L.push('');
  worst.slice(0, 300).forEach((r) => {
    L.push('- **' + r.id + '** (' + r.type + ', ' + r.verdict + '): ' + r.claims.map((c) => c.status.toUpperCase() + ' ' + c.family + (c.target ? ' ' + c.target : '') + (c.value !== null && c.value !== undefined ? ' ' + c.value : '') + ' «' + c.phrase.slice(0, 70) + '»' + (c.engine ? ' [engine: ' + c.engine + ']' : '')).join('; '));
  });
  L.push('');
  if (p.errors.length) {
    L.push('## Engine errors');
    L.push('');
    p.errors.slice(0, 200).forEach((e) => L.push('- ' + e));
  }
  fs.writeFileSync(file, L.join('\n') + '\n');
}

function main() {
  const t0 = Date.now();
  const { canonicalizeTarget } = require(path.join(__dirname, 'verify_v3_corpus.js'));
  const canonTarget = (t) => {
    const r = canonicalizeTarget(t);
    return r && r.ok ? r.canonical : String(t || '?');
  };
  const RE = loadEngine();
  const cur = loadCurrentCorpus();
  const v2 = loadV2Corpus(V2_REF);
  const argId = process.argv.indexOf('--id');
  if (argId > 0) {
    const id = process.argv[argId + 1];
    const probes = makeProbes();
    const errs = [];
    const show = (label, e) => {
      if (!e) { console.log(label + ': (none)'); return; }
      const f = fingerprint(RE, e, probes, canonTarget, errs);
      console.log(label + ' (' + f.size + ' atoms)');
      [...f.entries()].sort().forEach(([k, v]) => console.log('   ' + k + ' = ' + v));
    };
    show('V2 ' + V2_REF, v2.get(id));
    show('NOW', cur.get(id));
    errs.forEach((e) => console.log('ERR ' + e));
    return;
  }
  const parity = runParity(RE, v2, cur, canonTarget);
  const deadBlocks = runDeadBlocks(RE, cur, canonTarget);
  const refs = runRefIntegrity(cur);
  const text = runTextCoverage(RE, cur, canonTarget);
  const res = { v2Ref: V2_REF, parity, deadBlocks, refs, text };
  const reportFile = path.join(ROOT, 'audit_v3_full_report.md');
  writeReport(res, reportFile);
  const jIdx = process.argv.indexOf('--json');
  if (jIdx > 0) fs.writeFileSync(process.argv[jIdx + 1], JSON.stringify(res, null, 1));
  const openRecs = parity.records.filter((r) => !r.allow);
  const lost = openRecs.filter((r) => r.lost.length).length;
  console.log('V2 parity: ' + parity.pairs + ' pairs, ' + parity.identical + ' identical, ' + lost + ' with LOST atoms, '
    + openRecs.filter((r) => !r.lost.length && r.changed.length).length + ' changed-only, '
    + parity.records.filter((r) => r.allow).length + ' allowlisted, '
    + parity.records.filter((r) => !r.lost.length && !r.changed.length).length + ' added-only; renamed '
    + parity.renamed.length + ', removed ' + parity.removed.length + ', new ' + parity.added.length + ', engine errors ' + parity.errors.length);
  const dc = { none: 0, badgeOnly: 0, redundant: 0, readElsewhere: 0 };
  deadBlocks.dead.forEach((x) => { dc[x.readElsewhere ? 'readElsewhere' : x.cls]++; });
  console.log('Dead blocks: ' + deadBlocks.dead.length + ' of ' + deadBlocks.scanned + ' blocks add no mechanical output: '
    + dc.none + ' none, ' + dc.badgeOnly + ' badge-only, ' + dc.redundant + ' redundant, ' + dc.readElsewhere + ' read by the sheet (errors ' + deadBlocks.errors.length + ')');
  console.log('References: ' + refs.broken.length + ' unresolved ids; armor/shield double enhancement: ' + refs.doubleEnh.length + '; legacy contract issues: ' + (refs.legacyContractIssues ? refs.legacyContractIssues.length : 0));
  const tv = {};
  text.rows.forEach((r) => { tv[r.verdict] = (tv[r.verdict] || 0) + 1; });
  console.log('Text coverage: ' + ['MISSING', 'PARTIAL', 'VALUE', 'OK', 'NOCLAIM'].map((k) => k + ' ' + (tv[k] || 0)).join(', '));
  console.log('report: ' + reportFile + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
}

if (require.main === module) main();

module.exports = { loadCurrentCorpus, loadV2Corpus, fingerprint, atomsOf, makeProbes, runParity };
