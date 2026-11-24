#!/usr/bin/env node
'use strict';

/**
 * V2 Remnant & Hardcoded Shadow-Logic Audit / Ratchet Gate
 *
 * Enforces:
 *   1. Disk database/*.json is 100% pure V3 (0 non-V3, 0 modifiers, 0 damageParts).
 *   2. Runtime .damageParts & schemaVersion==2 are strictly confined to the import/compiler boundary.
 *   3. Runtime .modifiers & SRD name-literal shadow-logic counts never exceed their ratcheted baselines.
 *
 * Usage:
 *   node tools/v2_hardcode_gate.js --report   # Full categorized report (exit 0)
 *   node tools/v2_hardcode_gate.js            # Ratchet gate mode (exit 1 on regressions)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const RUNTIME_FILES = [
  'index.html',
  'hub.html',
  'login.html',
  'forge_sandbox.html',
  'rule_engine.js',
  'rule_master.js',
  'rulesets/dnd35.js',
  'char_store.js',
  'char_hud.js',
  'char_combat.js',
  'char_spells.js',
  'char_progression.js',
  'char_inventory.js',
  'ui_components.js',
  'ui_shared.js',
  'forge_sandbox.js',
  'srd_compendium.js',
  'campaign_db.js',
  'supabase_auth.js',
  'hub_dice.js',
  'hub_notes.js',
  'hub_ai.js',
  'dice3d.js',
  'ai_assistant.js',
  'app_atlas.js',
].filter((f) => fs.existsSync(path.join(ROOT, f)));

// Files legally permitted to touch compiled/import-boundary damageParts or schemaVersion==2
const DAMAGE_PARTS_ALLOWLIST = new Set([
  'rule_engine.js',     // V3 -> compiled internal damageParts output
  'rule_master.js',     // V3 sanitizer (delete v2.damageParts)
  'srd_compendium.js',  // migrateEntryToV3 import boundary
  'forge_sandbox.js',   // SRD/legacy import boundary
]);

const SCHEMA_V2_ALLOWLIST = new Set([
  'srd_compendium.js',  // migrateEntryToV3 import boundary
]);

// Ratcheted per-file upper bounds for .modifiers reads (compiled lego output / dice parser / import boundary)
const MODIFIERS_BASELINE = {
  'rule_engine.js': 179,
  'srd_compendium.js': 10,
  'forge_sandbox.js': 7,
  'char_combat.js': 5,
  'rule_master.js': 3,
  'rulesets/dnd35.js': 2,
  'char_spells.js': 2,
  'char_inventory.js': 2,
  'hub_dice.js': 2,
  'char_hud.js': 1,
};

// Ratcheted per-file upper bounds for SRD name-literal comparisons & multi-name regexes
const SHADOW_LOGIC_BASELINE = {
  'rule_engine.js': 139,
  'char_combat.js': 64,
  'char_spells.js': 46,
  'char_inventory.js': 21,
  'char_progression.js': 10,
  'srd_compendium.js': 7,
  'forge_sandbox.js': 6,
  'rule_master.js': 5,
  'rulesets/dnd35.js': 4,
  'char_store.js': 4,
};

const DISTINCTIVE_SINGLE_SRD = new Set([
  'toughness', 'cleave', 'dodge', 'mobility', 'alertness', 'endurance', 'diehard',
  'leadership', 'track', 'acrobatic', 'agile', 'athletic', 'deceitful', 'diligent',
  'investigator', 'negotiator', 'persuasive', 'stealthy', 'haste', 'barkskin',
  'stoneskin', 'blur', 'displacement', 'blink', 'evasion', 'mettle', 'flurry',
]);

const IGNORE_LITERALS = new Set([
  'character sheet', 'magic item', 'special ability', 'natural armor', 'spell resistance',
  'damage reduction', 'darkvision', 'low-light vision', 'blind-fight', 'weapon focus',
  'weapon specialization', 'greater weapon focus', 'greater weapon specialization',
  'improved critical', 'skill focus', 'spell focus', 'greater spell focus',
  'martial weapon proficiency', 'simple weapon proficiency', 'exotic weapon proficiency',
  'armor proficiency (light)', 'armor proficiency (medium)', 'armor proficiency (heavy)',
  'shield proficiency', 'tower shield proficiency', 'medium armor', 'heavy armor',
  'light armor', 'natural weapon', 'unarmed strike', 'touch attack', 'ranged touch',
  'full attack', 'standard action', 'move action', 'swift action', 'immediate action',
  'free action', 'full-round action', 'attack of opportunity', 'saving throw',
  'hit points', 'armor class', 'caster level', 'base attack bonus', 'spell level',
]);

function loadSrdNames() {
  const dbDir = path.join(ROOT, 'database');
  const dbFiles = fs.readdirSync(dbDir).filter(
    (f) => f.endsWith('.json') && f !== 'srd_index.json' && f !== 'lego_patterns.json'
  );
  const srdNames = new Map();
  let totalEntries = 0;
  let nonV3 = 0;
  let diskModifiers = 0;
  let diskDamageParts = 0;

  for (const f of dbFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(dbDir, f), 'utf8'));
    const arr = Array.isArray(data) ? data : (data.entries || data.items || []);
    for (const e of arr) {
      if (!e || typeof e !== 'object') continue;
      totalEntries++;
      if (e.schemaVersion !== 3) nonV3++;
      if (e.modifiers && Object.keys(e.modifiers).length) diskModifiers++;
      if (e.damageParts && e.damageParts.length) diskDamageParts++;
      if (!e.name) continue;
      const raw = String(e.name).trim();
      const low = raw.toLowerCase();
      if (IGNORE_LITERALS.has(low)) continue;
      const words = low.split(/\s+/);
      if ((words.length >= 2 && low.length >= 8) || DISTINCTIVE_SINGLE_SRD.has(low)) {
        if (!srdNames.has(low)) srdNames.set(low, { name: raw, type: e.type || f });
      }
    }
  }
  return { srdNames, dbStats: { dbFiles: dbFiles.length, totalEntries, nonV3, diskModifiers, diskDamageParts } };
}

function scanRuntime(srdNames) {
  const cmpRe = /(?:===|!==|==|!=|\.(?:includes|indexOf|startsWith|endsWith|has)\()\s*['"]([^'"\\]{4,60})['"]|['"]([^'"\\]{4,60})['"]\s*(?:===|!==|==|!=)/g;
  const regexMultiRe = /\/([^/\n]{12,240})\/[gimsuy]*/g;
  const v2PropRe = /\.(modifiers|damageParts)\b|\[\s*['"](modifiers|damageParts)['"]\s*\]|\b(damageParts)\s*[:},]|schemaVersion\s*(?:===|==|<|<=|!==|!=)\s*2\b/g;

  const shadowHits = [];
  const v2PropHits = [];

  for (const rel of RUNTIME_FILES) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const lines = src.split('\n');
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      let rawLine = lines[i];
      if (inBlockComment) {
        const endIdx = rawLine.indexOf('*/');
        if (endIdx === -1) continue;
        rawLine = rawLine.slice(endIdx + 2);
        inBlockComment = false;
      }
      // Strip single-line /* ... */ comments while preserving trailing code on the same line
      rawLine = rawLine.replace(/\/\*[\s\S]*?\*\//g, '');
      const openIdx = rawLine.indexOf('/*');
      if (openIdx !== -1) {
        rawLine = rawLine.slice(0, openIdx);
        inBlockComment = true;
      }
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('<!--')) continue;

      if (rel.endsWith('.js')) {
        let m;
        cmpRe.lastIndex = 0;
        while ((m = cmpRe.exec(rawLine))) {
          const lit = (m[1] || m[2] || '').trim().toLowerCase();
          if (srdNames.has(lit)) {
            shadowHits.push({
              file: rel,
              line: i + 1,
              literal: lit,
              kind: 'literal',
              srdType: srdNames.get(lit).type,
              text: trimmed.slice(0, 120),
            });
          }
        }
        regexMultiRe.lastIndex = 0;
        while ((m = regexMultiRe.exec(rawLine))) {
          const parts = m[1].toLowerCase().split('|').map((s) => s.replace(/[^a-z0-9 '\-]/g, '').trim()).filter(Boolean);
          const matched = parts.filter((p) => srdNames.has(p));
          if (matched.length >= 2) {
            shadowHits.push({
              file: rel,
              line: i + 1,
              literal: 'REGEX[' + matched.slice(0, 4).join('|') + ']',
              kind: 'regex',
              srdType: 'regex',
              text: trimmed.slice(0, 120),
            });
          }
        }
      }

      let vm;
      v2PropRe.lastIndex = 0;
      while ((vm = v2PropRe.exec(rawLine))) {
        v2PropHits.push({
          file: rel,
          line: i + 1,
          token: vm[1] || vm[2] || vm[3] || vm[0],
          text: trimmed.slice(0, 120),
        });
      }
    }
  }

  return { shadowHits, v2PropHits };
}

function runV2HardcodeGate() {
  const { srdNames, dbStats } = loadSrdNames();
  const { shadowHits, v2PropHits } = scanRuntime(srdNames);
  const errors = [];
  const tighten = [];

  // 1. Disk Pure-V3 hard gate
  if (dbStats.nonV3 > 0) errors.push(`database/*.json has ${dbStats.nonV3} non-V3 entries (must be 0).`);
  if (dbStats.diskModifiers > 0) errors.push(`database/*.json has ${dbStats.diskModifiers} legacy modifiers fields (must be 0).`);
  if (dbStats.diskDamageParts > 0) errors.push(`database/*.json has ${dbStats.diskDamageParts} legacy damageParts fields (must be 0).`);

  // 2. Runtime V2 boundary & modifiers ratchet
  const modCounts = {};
  for (const h of v2PropHits) {
    if (h.token === 'damageParts' && !DAMAGE_PARTS_ALLOWLIST.has(h.file)) {
      errors.push(`${h.file}:${h.line} reads/writes legacy .damageParts outside import/compiler allowlist.`);
    } else if (h.token.startsWith('schemaVersion') && !SCHEMA_V2_ALLOWLIST.has(h.file)) {
      errors.push(`${h.file}:${h.line} checks V2 schemaVersion outside migrateEntryToV3 allowlist.`);
    } else if (h.token === 'modifiers') {
      modCounts[h.file] = (modCounts[h.file] || 0) + 1;
    }
  }
  const allModFiles = new Set([...Object.keys(MODIFIERS_BASELINE), ...Object.keys(modCounts)]);
  for (const f of allModFiles) {
    const actual = modCounts[f] || 0;
    const max = MODIFIERS_BASELINE[f] || 0;
    if (actual > max) {
      errors.push(`${f} has ${actual} .modifiers references (ratchet max: ${max}).`);
    } else if (actual < max) {
      tighten.push(`.modifiers[${f}]: ${actual} < ${max}`);
    }
  }

  // 3. SRD name-literal shadow-logic ratchet
  const shadowCounts = {};
  for (const h of shadowHits) {
    shadowCounts[h.file] = (shadowCounts[h.file] || 0) + 1;
  }
  const allShadowFiles = new Set([...Object.keys(SHADOW_LOGIC_BASELINE), ...Object.keys(shadowCounts)]);
  for (const f of allShadowFiles) {
    const actual = shadowCounts[f] || 0;
    const max = SHADOW_LOGIC_BASELINE[f] || 0;
    if (actual > max) {
      errors.push(`${f} has ${actual} SRD name-literal shadow-logic checks (ratchet max: ${max}). Run --report to inspect.`);
    } else if (actual < max) {
      tighten.push(`shadowLogic[${f}]: ${actual} < ${max}`);
    }
  }

  const totalShadow = shadowHits.length;
  const maxShadow = Object.values(SHADOW_LOGIC_BASELINE).reduce((a, b) => a + b, 0);

  return { dbStats, shadowHits, v2PropHits, errors, tighten, totalShadow, maxShadow };
}

function formatSummary(res) {
  return `[OK] V2 & Shadow-Logic Ratchet Gate: DB ${res.dbStats.totalEntries}/${res.dbStats.totalEntries} pure V3 (0 disk V2), 0 illegal runtime damageParts/v2-schema reads, ${res.totalShadow}/${res.maxShadow} SRD name-literal baseline.`;
}

if (require.main === module) {
  const reportMode = process.argv.includes('--report');
  const res = runV2HardcodeGate();
  if (reportMode) {
    console.log('=== 1. DATABASE PURE-V3 CHECK ===');
    console.log(res.dbStats);
    console.log('\n=== 2. SRD NAME-LITERAL SHADOW LOGIC HITS (' + res.shadowHits.length + ') ===');
    const byFile = {};
    for (const h of res.shadowHits) (byFile[h.file] = byFile[h.file] || []).push(h);
    for (const [f, list] of Object.entries(byFile)) {
      console.log(`\n--- ${f} (${list.length}) ---`);
      for (const h of list) console.log(`  L${h.line} [${h.literal} | ${h.srdType}]: ${h.text}`);
    }
    console.log('\n=== 3. RUNTIME .modifiers / .damageParts / schemaVersion==2 SUMMARY ===');
    const v2ByFile = {};
    for (const h of res.v2PropHits) (v2ByFile[h.file] = v2ByFile[h.file] || []).push(h);
    for (const [f, list] of Object.entries(v2ByFile)) {
      const counts = {};
      for (const h of list) counts[h.token] = (counts[h.token] || 0) + 1;
      console.log(`  ${f}: ${JSON.stringify(counts)}`);
    }
    process.exit(0);
  }
  if (res.errors.length > 0) {
    res.errors.forEach((e) => console.error('[FAIL] ' + e));
    process.exit(1);
  }
  console.log(formatSummary(res));
  if (res.tighten.length > 0) {
    console.log('📉 Baselines that can be tightened:', res.tighten.join(', '));
  }
}

module.exports = { runV2HardcodeGate, formatSummary };
