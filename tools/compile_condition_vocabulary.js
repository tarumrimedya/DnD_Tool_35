#!/usr/bin/env node
'use strict';

/**
 * Closed condition vocabulary migration (idempotent, 0 tokens).
 *
 * A `when` / `while` branch whose `condKind` is `state` (or `bound`, `toggle`, empty) but whose `condText` the engine
 * does not understand ("Acidic Gaze", "Normal Utterance", "Expending Psionic Focus") is an ACTIVATION note: the text is
 * only the name of the ability / utterance mode / pact power the block belongs to. It is rewritten to
 * `condKind: 'activation'` (declared descriptive: listed as situational, never in the totals, no sheet UI flips it yet).
 *
 * Text the engine DOES understand (gear atoms, alignment, Vestige Pact, tactical toggles, levels, HP, buffs ...) is left alone.
 *
 *   node tools/compile_condition_vocabulary.js           apply
 *   node tools/compile_condition_vocabulary.js --check   report only (exit 1 when something would change)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');
const CHECK = process.argv.includes('--check');
const RuleEngine = require(path.join(ROOT, 'rule_engine.js'));

const SKIP_KINDS = new Set(['note', 'else', 'situational', 'activation', 'levelTier', 'choicePath', 'oath', 'synergy']);

function convertBranch(kindRaw, textRaw, isFlat) {
  const kind = String(kindRaw || '').trim();
  if (SKIP_KINDS.has(kind)) return false;
  if (!isFlat && RuleEngine.V3_NAMED_WHEN_CONDS.has(kind.toLowerCase())) return false;
  if (textRaw !== undefined && textRaw !== null && typeof textRaw === 'object') return false;
  const text = textRaw === undefined || textRaw === null ? '' : String(textRaw).trim();
  if (!text) return false;
  const res = RuleEngine.resolveV3WhenCondition(kind, text, 'when', {}, {}, {}, { useNamedKind: !isFlat, strict: true });
  return res === 'unrecognized';
}

function visit(node, fn) {
  if (Array.isArray(node)) { node.forEach((x) => visit(x, fn)); return; }
  if (!node || typeof node !== 'object') return;
  fn(node);
  Object.keys(node).forEach((k) => visit(node[k], fn));
}

function main() {
  const idx = JSON.parse(fs.readFileSync(path.join(DB_DIR, 'srd_index.json'), 'utf8'));
  let changed = 0;
  const byText = {};
  Object.keys(idx.chunks || {}).forEach((chunk) => {
    const fp = path.join(DB_DIR, chunk);
    if (!fs.existsSync(fp)) return;
    const raw = fs.readFileSync(fp, 'utf8');
    const data = JSON.parse(raw);
    let touched = 0;
    visit(data, (o) => {
      if (o.type !== 'when' && o.type !== 'while') return;
      if (Array.isArray(o.branches) && o.branches.length) {
        o.branches.forEach((br) => {
          if (!br || typeof br !== 'object') return;
          if (convertBranch(br.condKind || 'toggle', br.condText !== undefined ? br.condText : br.condition, false)) {
            const key = (br.condKind || 'toggle') + '|' + (br.condText !== undefined ? br.condText : br.condition);
            byText[key] = (byText[key] || 0) + 1;
            br.condKind = 'activation';
            touched++;
          }
        });
      } else {
        const c = o.condition !== undefined ? o.condition : (o.when !== undefined ? o.when : (o.while !== undefined ? o.while : o.condText));
        if (c !== undefined && convertBranch(o.condKind, c, true)) {
          o.condKind = 'activation';
          if (o.condText === undefined) o.condText = String(c);
          touched++;
        }
      }
    });
    if (!touched) return;
    changed += touched;
    if (!CHECK) {
      const pretty = JSON.stringify(data, null, 2);
      const out = raw === pretty ? pretty : (raw === pretty + '\n' ? pretty + '\n' : (raw.endsWith('\n') ? JSON.stringify(data) + '\n' : JSON.stringify(data)));
      fs.writeFileSync(fp, out);
    }
    console.log(`  ${chunk}: ${touched} branch(es) -> activation`);
  });
  console.log(`${CHECK ? 'would convert' : 'converted'} ${changed} branch(es) to condKind 'activation'.`);
  if (CHECK && changed > 0) process.exit(1);
}

main();
