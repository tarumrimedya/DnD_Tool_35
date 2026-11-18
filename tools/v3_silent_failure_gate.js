#!/usr/bin/env node
'use strict';

/**
 * Silent-failure gate (0 tokens). Finds data that LOOKS valid but is never applied (or is always on).
 * Ratcheted against tools/v3_silent_failure_baseline.json: anything NOT in the baseline is an error,
 * existing problems may only shrink (a fixed entry is reported as "baseline can be tightened").
 *
 *   (a) condition strings the engine does not understand. `evaluateV3BranchCondition` falls through to
 *       'qualifier' and the branch is then applied unconditionally; an empty condText is always true too.
 *       Branches whose `condKind` is not in RuleEngine.V3_NAMED_WHEN_CONDS ignore their kind entirely, so a
 *       kind-only branch (`charging`, `flanking`, empty text) is always true.
 *   (b) orphan `cab-*` ClassAbility records no class progression row, race row or other record links to
 *       (the engine builds the class definition from `progression.levels[].features`, so they are never applied).
 *   (c) records with effects[] whose kind the engine never evaluates (Class: only copied in normalizeV3ClassDef).
 *
 *   node tools/v3_silent_failure_gate.js                  report
 *   node tools/v3_silent_failure_gate.js --write-baseline regenerate the baseline (only to record a deliberate state)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');
const BASELINE_FILE = path.join(__dirname, 'v3_silent_failure_baseline.json');

// Branch kinds that carry no engine-evaluated meaning (descriptive notes / structural else)
const NOTE_KINDS = new Set(['note', 'else']);
// Named conditions that legitimately resolve to 'qualifier' while no weapon / spell context is supplied
const CONTEXT_ONLY_CONDS = new Set(['vsaoofrommovement', 'wieldingchosenweapon', 'castingchosenschool']);
// Record types whose effects[] the engine never evaluates (collectLegoEntries has no Class source)
const NON_CONSUMED_EFFECT_TYPES = new Set(['Class']);

function loadAllEntries() {
  const idx = JSON.parse(fs.readFileSync(path.join(DB_DIR, 'srd_index.json'), 'utf8'));
  const all = [];
  for (const chunkName of Object.keys(idx.chunks || {})) {
    const fp = path.join(DB_DIR, chunkName);
    if (!fs.existsSync(fp)) continue;
    const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
    (Array.isArray(raw) ? raw : (raw.entries || [])).forEach((e) => { if (e && typeof e === 'object') all.push(e); });
  }
  return all;
}

function deepVisit(node, fn) {
  if (Array.isArray(node)) { node.forEach((x) => deepVisit(x, fn)); return; }
  if (!node || typeof node !== 'object') return;
  fn(node);
  Object.keys(node).forEach((k) => deepVisit(node[k], fn));
}

function normAbilityName(s) {
  return String(s || '').toLowerCase().replace(/\s*\((?:ex|su|sp|na)\)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
}

function runSilentFailureGate() {
  const RuleEngine = require(path.join(ROOT, 'rule_engine.js'));
  const NAMED = RuleEngine.V3_NAMED_WHEN_CONDS;
  const all = loadAllEntries();

  // (a) unrecognized conditions, keyed "kind|text" with an occurrence count
  const conds = {};
  const classify = (kindRaw, textRaw, isFlat) => {
    const kind = String(kindRaw || '').trim();
    const kLow = kind.toLowerCase();
    if (NOTE_KINDS.has(kLow)) return null;
    if (textRaw !== undefined && textRaw !== null && typeof textRaw === 'object') return null; // predicate object
    const text = textRaw === undefined || textRaw === null ? '' : String(textRaw).trim();
    const cond = (!isFlat && NAMED.has(kLow)) ? kind : text;
    if (CONTEXT_ONLY_CONDS.has(String(cond).toLowerCase())) return null;
    if (!cond) return { key: kind + '|(empty)' };
    let res;
    try { res = RuleEngine.evaluateV3BranchCondition(cond, 'when', {}, {}, {}); } catch (_) { res = 'qualifier'; }
    return res === 'qualifier' ? { key: kind + '|' + text } : null;
  };
  all.forEach((e) => {
    deepVisit(e, (o) => {
      if (o.type !== 'when' && o.type !== 'while') return;
      if (Array.isArray(o.branches) && o.branches.length) {
        o.branches.forEach((br) => {
          if (!br || typeof br !== 'object') return;
          const r = classify(br.condKind || 'toggle', br.condText !== undefined ? br.condText : br.condition, false);
          if (r) conds[r.key] = (conds[r.key] || 0) + 1;
        });
      } else {
        const c = o.condition !== undefined ? o.condition : (o.when !== undefined ? o.when : (o.while !== undefined ? o.while : o.condText));
        if (c === undefined) return;
        const r = classify(o.condKind, c, true);
        if (r) conds[r.key] = (conds[r.key] || 0) + 1;
      }
    });
  });

  // (b) orphan cab-* records
  const cabs = all.filter((e) => /^cab-/.test(e.id || ''));
  const cabIds = new Set(cabs.map((e) => e.id));
  const linkedIds = new Set();
  const linkedNames = new Set();
  const addRef = (f) => {
    if (!f) return;
    if (typeof f === 'string') { linkedNames.add(normAbilityName(f)); return; }
    const id = f.refId || f.id;
    if (id) linkedIds.add(id);
    if (f.name) linkedNames.add(normAbilityName(f.name));
  };
  all.forEach((e) => {
    if (e.type === 'Class' || /^cls-/.test(e.id || '')) {
      const pr = e.progression || {};
      const rows = Array.isArray(pr.levels) ? pr.levels : (Array.isArray(pr.milestones) ? pr.milestones : null);
      if (rows) {
        rows.forEach((lv) => (lv && Array.isArray(lv.features) ? lv.features : []).forEach(addRef));
      } else if (e.features && typeof e.features === 'object') {
        // the legacy features map only counts while the class has no progression rows (normalizeV3ClassDef)
        Object.values(e.features).forEach((list) => (Array.isArray(list) ? list : []).forEach(addRef));
      }
      deepVisit({ r: e.replaces, g: e.grants, a: e.addedAbilities, m: e.modes }, (o) => {
        Object.values(o).forEach((v) => { if (typeof v === 'string' && cabIds.has(v)) linkedIds.add(v); });
      });
      return;
    }
    deepVisit(e, (o) => {
      Object.values(o).forEach((v) => { if (typeof v === 'string' && cabIds.has(v) && v !== e.id) linkedIds.add(v); });
    });
  });
  const orphanCabs = cabs
    .filter((e) => !/^cab-bonus-feat-/.test(e.id) && !linkedIds.has(e.id) && !linkedNames.has(normAbilityName(e.name)))
    .map((e) => e.id).sort();

  // (c) effects[] on a record kind the engine never evaluates
  const deadEffects = all
    .filter((e) => NON_CONSUMED_EFFECT_TYPES.has(e.type) && Array.isArray(e.effects) && e.effects.length > 0)
    .map((e) => e.id).sort();

  let baseline = { conditions: {}, orphanCabs: [], deadEffects: [] };
  try { baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')); } catch (_) { /* no baseline: everything is new */ }
  const errors = [];
  const tighten = [];
  Object.keys(conds).forEach((k) => {
    const cap = (baseline.conditions || {})[k];
    if (cap === undefined) errors.push('unrecognized condition (applied as always true): ' + k + ' x' + conds[k]);
    else if (conds[k] > cap) errors.push('unrecognized condition grew: ' + k + ' ' + conds[k] + ' > baseline ' + cap);
    else if (conds[k] < cap) tighten.push('condition ' + k + ': ' + conds[k] + ' < ' + cap);
  });
  Object.keys(baseline.conditions || {}).forEach((k) => { if (conds[k] === undefined) tighten.push('condition fixed: ' + k); });
  const setCheck = (label, cur, base) => {
    const bs = new Set(base || []);
    cur.forEach((id) => { if (!bs.has(id)) errors.push(label + ': ' + id); });
    (base || []).forEach((id) => { if (!cur.includes(id)) tighten.push(label + ' fixed: ' + id); });
  };
  setCheck('orphan cab-* record (no class row links it)', orphanCabs, baseline.orphanCabs);
  setCheck('effects[] on a record kind the engine never consumes', deadEffects, baseline.deadEffects);

  return {
    errors,
    tighten,
    counts: {
      unrecognizedConditionKeys: Object.keys(conds).length,
      unrecognizedConditionUses: Object.values(conds).reduce((a, b) => a + b, 0),
      orphanCabs: orphanCabs.length,
      deadEffects: deadEffects.length
    },
    current: { conditions: conds, orphanCabs, deadEffects }
  };
}

function writeBaseline(sf) {
  const sorted = Object.fromEntries(Object.entries(sf.current.conditions).sort((a, b) => a[0].localeCompare(b[0])));
  fs.writeFileSync(BASELINE_FILE, JSON.stringify({
    _note: 'Ratchet baseline for tools/v3_silent_failure_gate.js. Entries may only be removed, never added.',
    conditions: sorted,
    orphanCabs: sf.current.orphanCabs,
    deadEffects: sf.current.deadEffects
  }, null, 2) + '\n');
}

function formatSummary(sf) {
  return '   • Silent failures (baseline): ' + sf.counts.unrecognizedConditionKeys + ' unrecognized condition strings ('
    + sf.counts.unrecognizedConditionUses + ' uses), ' + sf.counts.orphanCabs + ' orphan cab-*, '
    + sf.counts.deadEffects + ' unconsumed effects[] records';
}

if (require.main === module) {
  const sf = runSilentFailureGate();
  if (process.argv.includes('--write-baseline')) {
    writeBaseline(sf);
    console.log('baseline written: ' + BASELINE_FILE);
  }
  console.log(formatSummary(sf));
  sf.tighten.slice(0, 20).forEach((t) => console.log('   📉 baseline can be tightened: ' + t));
  sf.errors.slice(0, 40).forEach((er) => console.error('   ❌ ' + er));
  if (sf.errors.length > 0 && !process.argv.includes('--write-baseline')) process.exit(1);
}

module.exports = { runSilentFailureGate, formatSummary, writeBaseline, BASELINE_FILE };
