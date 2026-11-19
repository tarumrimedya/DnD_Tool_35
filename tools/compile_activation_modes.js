#!/usr/bin/env node
'use strict';

/**
 * Activation branches -> `modes[]` (idempotent, 0 tokens).
 *
 * A top-level `when` / `while` branch with `condKind: 'activation'` ("Normal Utterance", "Expending Psionic Focus",
 * a vestige power, a domain power) only named the ability it belongs to, so the engine listed it as a situational note.
 * It is now a selectable mode of the same record: `modes[] = [{ id: 'mode-off', name: 'Inactive' }, { id, name, label, effects }, ...]`.
 * The sheet flips it through `char.activeModes[entryId]` (combat/setActiveMode, mode chips in the Combat tab) and the
 * engine applies the mode's blocks like any other V3 block (`evaluateV3Entry`, Structural Bridge 1).
 *
 * Rules:
 *   - Only top-level `when` / `while` blocks of Lego-consumed records; a `when` that also has non-activation branches keeps them.
 *   - Class records (`cls-*`) and Tome of Battle stances (`tob-*`) are skipped (class `effects[]` are not consumed; a stance
 *     trigger is not an activation). They keep `condKind: 'activation'`.
 *   - `enh-berserker` ("While Raging") is not a mode: it reads the Rage mode of the character (`mode:mode-rage-active`).
 *   - A stat / roll `condition` that only restates the mode ("Normal Utterance (5 rounds)") is dropped (it would keep the
 *     block situational); its text becomes the mode label. Other condition text stays (a real situational note).
 *   - Branch metadata (trigger, action, cost, check, cooldown, oath) moves to `mode.activation`.
 *
 *   node tools/compile_activation_modes.js           apply
 *   node tools/compile_activation_modes.js --check   report only (exit 1 when something would change)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');

const SKIP_ID_PREFIXES = ['cls-', 'tob-'];
const SPECIAL_BRANCH = {
  'enh-berserker': { condKind: 'state', condText: 'mode:mode-rage-active' }
};
const META_KEYS = ['trigger', 'action', 'targetText', 'cooldownText', 'oathRule'];
const COST_KEYS = ['costKind', 'costVal', 'costFormula', 'poolName', 'checkFormula'];

function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'mode';
}

function visit(node, fn) {
  if (Array.isArray(node)) { node.forEach((x) => visit(x, fn)); return; }
  if (!node || typeof node !== 'object') return;
  fn(node);
  Object.keys(node).forEach((k) => visit(node[k], fn));
}

function isActivation(br) {
  return !!br && typeof br === 'object' && br.condKind === 'activation';
}

function buildMode(br, usedIds) {
  const name = String(br.condText || 'Activated').trim();
  let id = 'mode-' + slug(name);
  let n = 2;
  while (usedIds.has(id)) id = 'mode-' + slug(name) + '-' + (n++);
  usedIds.add(id);
  const effects = JSON.parse(JSON.stringify(Array.isArray(br.effects) ? br.effects : []));
  const restated = new Set();
  const lowName = name.toLowerCase();
  visit(effects, (o) => {
    if (typeof o.condition === 'string' && o.condition.trim().toLowerCase().startsWith(lowName)) {
      restated.add(o.condition.trim());
      delete o.condition;
    }
  });
  const mode = { id, name, label: restated.size === 1 ? Array.from(restated)[0] : name };
  const activation = {};
  META_KEYS.forEach((k) => { if (br[k]) activation[k] = br[k]; });
  if (br.costKind && br.costKind !== 'none') COST_KEYS.forEach((k) => { if (br[k] !== undefined && br[k] !== '') activation[k] = br[k]; });
  if (Object.keys(activation).length) mode.activation = activation;
  mode.effects = effects;
  return mode;
}

/** Converts one record in place; returns the number of branches handled. */
function convertRecord(e) {
  if (!e || typeof e !== 'object' || !Array.isArray(e.effects)) return 0;
  const id = String(e.id || '');
  if (SKIP_ID_PREFIXES.some((p) => id.startsWith(p))) return 0;
  const special = SPECIAL_BRANCH[id];
  let count = 0;
  const modes = Array.isArray(e.modes) ? e.modes : [];
  const usedIds = new Set(modes.map((m) => m && m.id).filter(Boolean));
  const newModes = [];
  const kept = [];
  e.effects.forEach((b) => {
    const isWhen = b && typeof b === 'object' && (b.type === 'when' || b.type === 'while') && Array.isArray(b.branches);
    if (!isWhen || !b.branches.some(isActivation)) { kept.push(b); return; }
    if (special) {
      b.branches.forEach((br) => { if (isActivation(br)) { br.condKind = special.condKind; br.condText = special.condText; count++; } });
      kept.push(b);
      return;
    }
    const rest = [];
    b.branches.forEach((br) => {
      if (isActivation(br)) { newModes.push(buildMode(br, usedIds)); count++; } else rest.push(br);
    });
    if (rest.length) { b.branches = rest; kept.push(b); }
  });
  if (!count) return 0;
  e.effects = kept;
  if (newModes.length) {
    if (!modes.some((m) => m && Array.isArray(m.effects) && m.effects.length === 0)) {
      if (!usedIds.has('mode-off')) modes.unshift({ id: 'mode-off', name: 'Inactive', label: 'Inactive', effects: [] });
    }
    e.modes = modes.concat(newModes);
  }
  return count;
}

function records(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.entries)) return data.entries;
  return [];
}

function run(opts) {
  const check = !!(opts && opts.check);
  const idx = JSON.parse(fs.readFileSync(path.join(DB_DIR, 'srd_index.json'), 'utf8'));
  let total = 0;
  let recs = 0;
  Object.keys(idx.chunks || {}).forEach((chunk) => {
    const fp = path.join(DB_DIR, chunk);
    if (!fs.existsSync(fp)) return;
    const raw = fs.readFileSync(fp, 'utf8');
    const data = JSON.parse(raw);
    let touched = 0;
    records(data).forEach((e) => {
      const n = convertRecord(e);
      if (n) { touched += n; recs++; }
    });
    if (!touched) return;
    total += touched;
    if (!check) {
      const pretty = JSON.stringify(data, null, 2);
      const out = raw === pretty ? pretty : (raw === pretty + '\n' ? pretty + '\n' : (raw.endsWith('\n') ? JSON.stringify(data) + '\n' : JSON.stringify(data)));
      fs.writeFileSync(fp, out);
    }
    console.log(`  ${chunk}: ${touched} activation branch(es)`);
  });
  console.log(`${check ? 'would convert' : 'converted'} ${total} activation branch(es) in ${recs} record(s).`);
  return { branches: total, records: recs };
}

module.exports = { run, convertRecord };

if (require.main === module) {
  const res = run({ check: process.argv.includes('--check') });
  if (process.argv.includes('--check') && res.branches > 0) process.exit(1);
}
