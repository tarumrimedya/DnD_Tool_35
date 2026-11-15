#!/usr/bin/env node
'use strict';

/**
 * ============================================================================
 * Sprint C.6 — Deterministic Seeded >=10% (25%) V3 Mechanics Auditor
 * ============================================================================
 * Diffs current `database/*.json` against `c6_pre_db` backup, samples >=25%
 * across Variant Classes, `cab-*` ClassAbilities, Mechanical Feats, Domains,
 * and Spells using Mulberry32 PRNG (seeds: 20261116, 77773333), plus 100%
 * verification on the 3 UA Variant Classes, `cab-battle-clarity`,
 * `feat-shield-specialization`, narrative spells (Teleport, Wish, Speak with Dead),
 * `verify_v3_corpus.js` 100% gate, and `srd_index.json` SHA-256 integrity.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');
const PRE_DIR = process.env.C6_PRE_DB_DIR ||
  'C:/Users/tarum/.gemini/antigravity/brain/f812a2ec-ad5a-471a-9bc4-f30a835195cc/scratch/c6_pre_db';

const { runCorpusAudit, canonicalizeTarget } = require(path.join(ROOT, 'tools', 'verify_v3_corpus.js'));
const RuleEngine = require(path.join(ROOT, 'rule_engine.js'));

const CANONICAL_BLOCK_TYPES = new Set(['stat', 'roll', 'attack', 'defense', 'effect', 'resource', 'when', 'table', 'carrier']);
const ALLOWED_FORMULA_VARS = new Set([
  'level', 'cl', 'ml', 'il', 'ebl', 'hd', 'bab', 'classLevel', 'castMod',
  'strMod', 'dexMod', 'conMod', 'intMod', 'wisMod', 'chaMod',
  'warbladeLevel', 'rogueLevel', 'paladinLevel', 'barbarianLevel', 'monkLevel',
  'swashbucklerLevel', 'fighterLevel', 'clericLevel', 'bardLevel', 'rangerLevel',
  'essentia', 'augmentPP', 'critMult', 'baseSlots', 'size',
  'classes.monk.level', 'attributes.sneakAttackDiceTotal'
]);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleDeterministic(arr, rng) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function checkBalancedParens(expr) {
  let depth = 0;
  for (const ch of String(expr)) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function validateFormulaExpr(expr, label, errors) {
  if (expr === undefined || expr === null) return;
  const s = String(expr).trim();
  if (!s) return;
  if (/\$\{this\.|@attributes\.|undefined|NaN/i.test(s)) {
    errors.push(`${label}: invalid token in formula "${s}"`);
  }
  if (!checkBalancedParens(s)) {
    errors.push(`${label}: unbalanced parentheses in formula "${s}"`);
  }
  const vars = s.match(/@[a-zA-Z0-9_.]+/g) || [];
  for (const v of vars) {
    const key = v.slice(1);
    if (!ALLOWED_FORMULA_VARS.has(key)) {
      errors.push(`${label}: unknown formula variable ${v} in "${s}"`);
    }
  }
}

function validateEntryV3(entry, errors) {
  if (!entry || typeof entry !== 'object') {
    errors.push('Null or non-object entry');
    return;
  }
  const id = entry.id || entry.name || 'UNKNOWN';
  if (entry.schemaVersion !== 3) errors.push(`${id}: schemaVersion !== 3 (${entry.schemaVersion})`);
  if (Object.prototype.hasOwnProperty.call(entry, 'modifiers')) errors.push(`${id}: forbidden top-level modifiers[]`);
  if (entry.slot === 'None' && !['item', 'weapon', 'armor', 'itemMod'].includes(entry.blueprint)) {
    errors.push(`${id}: non-item slot="None"`);
  }

  const walkBlocks = (list, pathTag) => {
    for (let i = 0; i < (list || []).length; i++) {
      const b = list[i];
      if (!b || typeof b !== 'object') {
        errors.push(`${id} ${pathTag}[${i}]: non-object block`);
        continue;
      }
      if (!CANONICAL_BLOCK_TYPES.has(b.type)) {
        errors.push(`${id} ${pathTag}[${i}]: unmapped block type "${b.type}"`);
      }
      if (b.type === 'stat') {
        const tgts = Array.isArray(b.targets) ? b.targets : (b.target ? [b.target] : []);
        if (tgts.length === 0) errors.push(`${id} ${pathTag}[${i}]: stat block missing targets`);
        for (const t of tgts) {
          const r = canonicalizeTarget(t);
          if (!r.ok) errors.push(`${id} ${pathTag}[${i}]: unmapped target "${t}"`);
        }
        if (b.formula !== undefined) validateFormulaExpr(b.formula, `${id} ${pathTag}[${i}]`, errors);
      }
      if (b.type === 'resource' && b.maxFormula !== undefined) {
        validateFormulaExpr(b.maxFormula, `${id} ${pathTag}[${i}].maxFormula`, errors);
      }
      if (b.type === 'roll' && b.dice !== undefined) {
        if (!checkBalancedParens(String(b.dice))) {
          errors.push(`${id} ${pathTag}[${i}]: unbalanced parens in dice "${b.dice}"`);
        }
        const innerVars = String(b.dice).match(/@[a-zA-Z0-9_.]+/g) || [];
        for (const v of innerVars) {
          if (!ALLOWED_FORMULA_VARS.has(v.slice(1))) {
            errors.push(`${id} ${pathTag}[${i}]: unknown var ${v} in dice "${b.dice}"`);
          }
        }
      }
      if (Array.isArray(b.branches)) {
        b.branches.forEach((br, bi) => walkBlocks(br.effects || br.kids || br.then, `${pathTag}[${i}].branches[${bi}]`));
      }
      if (Array.isArray(b.effects)) walkBlocks(b.effects, `${pathTag}[${i}].effects`);
      if (Array.isArray(b.then)) walkBlocks(b.then, `${pathTag}[${i}].then`);
    }
  };

  walkBlocks(entry.effects || [], 'effects');
  if (Array.isArray(entry.modes)) {
    entry.modes.forEach((m, mi) => walkBlocks(m.effects || m.blocks || [], `modes[${mi}]`));
  }

  // Test evaluation in RuleEngine.evaluateV3Entry
  try {
    const sampleChar = {
      level: 8,
      abilities: { str: 14, dex: 16, con: 14, int: 16, wis: 12, cha: 14 },
      levelProgression: [
        { className: 'Warblade', level: 4, active: true },
        { className: 'Rogue', level: 4, active: true }
      ],
      tactical: { sneakAttack: true }
    };
    RuleEngine.evaluateV3Entry(entry, { character: sampleChar, level: 8, cl: 8 });
  } catch (err) {
    errors.push(`${id}: RuleEngine.evaluateV3Entry threw ${err.message}`);
  }
}

function collectDeltaEntries() {
  const files = [
    { file: 'srd_classes_races.json', kind: 'classes_races' },
    { file: 'srd_feats.json', kind: 'feats_core' },
    { file: 'srd_feats_splat.json', kind: 'feats_splat' },
    { file: 'srd_domains.json', kind: 'domains' },
    { file: 'srd_spells.json', kind: 'spells' }
  ];

  const categories = {
    variantClasses: [],
    classAbilities: [],
    feats: [],
    domains: [],
    spells: []
  };

  const preMaps = {};
  for (const f of files) {
    const cur = JSON.parse(fs.readFileSync(path.join(DB_DIR, f.file), 'utf8'));
    const prePath = path.join(PRE_DIR, f.file);
    const pre = fs.existsSync(prePath) ? JSON.parse(fs.readFileSync(prePath, 'utf8')) : [];
    const preById = new Map(pre.map((e) => [e.id, e]));
    preMaps[f.file] = { cur, preById };

    for (const e of cur) {
      const old = preById.get(e.id);
      const changed = !old || JSON.stringify(old) !== JSON.stringify(e);
      if (!changed) continue;

      if (f.kind === 'classes_races') {
        if (e.type === 'Class' && e.category === 'Variant') categories.variantClasses.push(e);
        else if (e.type === 'ClassAbility') categories.classAbilities.push(e);
      } else if (f.kind === 'feats_core' || f.kind === 'feats_splat') {
        if (e.type === 'Feat') categories.feats.push(e);
      } else if (f.kind === 'domains') {
        categories.domains.push(e);
      } else if (f.kind === 'spells') {
        categories.spells.push(e);
      }
    }
  }
  return { categories, preMaps };
}

function runChecks100Pct(preMaps, errors) {
  const crCur = preMaps['srd_classes_races.json'].cur;
  const fcCur = preMaps['srd_feats.json'].cur;
  const splCur = preMaps['srd_spells.json'].cur;
  const splPre = preMaps['srd_spells.json'].preById;

  // 1. 100% Check: 3 UA Variant Classes
  const rogAdv = crCur.find((e) => e.id === 'cls-rogue-adventurer-variant');
  if (!rogAdv) errors.push('Missing cls-rogue-adventurer-variant');
  else {
    if (rogAdv.name !== 'Rogue (Adventurer Variant)') errors.push('rogAdv wrong name');
    if (rogAdv.variantOf !== 'cls-rogue') errors.push('rogAdv wrong variantOf');
    if (!Array.isArray(rogAdv.replaces) || !rogAdv.replaces.includes('cab-sneak-attack')) errors.push('rogAdv missing replaces cab-sneak-attack');
    if (!(rogAdv.aliases || []).includes('cls_rogue_adventurer_ua')) errors.push('rogAdv missing alias cls_rogue_adventurer_ua');
    if (JSON.stringify(rogAdv.bonusFeatLevels) !== JSON.stringify([1, 3, 5, 7, 9, 11, 13, 15, 17, 19])) errors.push('rogAdv wrong bonusFeatLevels');
    const allFeatNames = Object.values(rogAdv.features || {}).flat().map((x) => x.name || '');
    if (allFeatNames.some((n) => /sneak\s*attack/i.test(n))) errors.push('rogAdv STILL contains Sneak Attack in features');
    for (const lvl of [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) {
      const list = rogAdv.features?.[String(lvl)] || [];
      if (!list.some((x) => x.id === 'cab-fighter-bonus-feat' && x.name === 'Fighter Bonus Feat')) {
        errors.push(`rogAdv missing cab-fighter-bonus-feat at level ${lvl}`);
      }
    }
  }

  const thug = crCur.find((e) => e.id === 'cls-fighter-thug-variant');
  if (!thug) errors.push('Missing cls-fighter-thug-variant');
  else {
    if (thug.skills !== 4 || thug.skillPointsPerLevel !== 4) errors.push('thug skills !== 4');
    if (!(thug.aliases || []).includes('cls_fighter_thug_ua')) errors.push('thug missing alias cls_fighter_thug_ua');
    for (const sk of ['bluff', 'gather_information', 'k_local', 'sleight_of_hand']) {
      if (!(thug.classSkills || []).includes(sk)) errors.push(`thug missing urban skill ${sk}`);
    }
    if (JSON.stringify(thug.bonusFeatLevels) !== JSON.stringify([2, 4, 6, 8, 10, 12, 14, 16, 18, 20])) errors.push('thug wrong bonusFeatLevels');
  }

  const cloistered = crCur.find((e) => e.id === 'cls-cleric-cloistered-variant');
  if (!cloistered) errors.push('Missing cls-cleric-cloistered-variant');
  else {
    if (cloistered.hd !== 6 || cloistered.bab !== 0.5 || cloistered.skills !== 6) errors.push('cloistered wrong hd/bab/skills');
    if (!(cloistered.aliases || []).includes('cls_cleric_cloistered_ua')) errors.push('cloistered missing alias');
    const f1Ids = (cloistered.features?.['1'] || []).map((x) => x.id);
    if (!f1Ids.includes('cab-lore') || !f1Ids.includes('cab-bonus-domain-knowledge')) {
      errors.push('cloistered level 1 missing cab-lore or cab-bonus-domain-knowledge');
    }
    if ((cloistered.classSkills || []).filter((s) => s.startsWith('k_')).length < 10) {
      errors.push('cloistered missing k_* knowledge skills');
    }
  }

  // 2. 100% Check: Battle Clarity (Ex) & Shield Specialization
  const bc = crCur.find((e) => e.id === 'cab-battle-clarity');
  if (!bc || !Array.isArray(bc.effects) || bc.effects.length === 0) errors.push('Missing or empty cab-battle-clarity');
  else {
    const s = JSON.stringify(bc.effects);
    if (!s.includes('notFlatFooted') || !s.includes('save.ref') || !s.includes('@warbladeLevel') || !s.includes('@intMod')) {
      errors.push('cab-battle-clarity missing expected V3 when/stat formula');
    }
  }
  const warblade = crCur.find((e) => e.id === 'cls-warblade');
  if (!warblade || !(warblade.features?.['1'] || []).some((x) => x.id === 'cab-battle-clarity')) {
    errors.push('cls-warblade level 1 missing cab-battle-clarity id link');
  }

  const shSpec = fcCur.find((e) => e.id === 'feat-shield-specialization');
  if (!shSpec || !Array.isArray(shSpec.choices) || !Array.isArray(shSpec.effects) || shSpec.effects.length === 0) {
    errors.push('feat-shield-specialization missing choices or effects');
  } else {
    const s = JSON.stringify(shSpec.effects);
    if (!s.includes('wieldingChosenShield') || !s.includes('ac.shieldBonus')) {
      errors.push('feat-shield-specialization missing wieldingChosenShield / ac.shieldBonus');
    }
  }

  // 3. 100% Check: Narrative Spells Untouched (0 pollution)
  for (const narId of ['spl-teleport', 'spl-wish', 'spl-speak-with-dead']) {
    const curS = splCur.find((e) => e.id === narId);
    const preS = splPre.get(narId);
    if (!curS) errors.push(`Missing narrative spell ${narId}`);
    else {
      if ((curS.effects || []).length !== 0) errors.push(`Narrative spell ${narId} was polluted with effects`);
      if (preS && JSON.stringify(curS) !== JSON.stringify(preS)) errors.push(`Narrative spell ${narId} differs from pre-migration backup`);
    }
  }

  // 4. 100% Check: srd_index.json SHA-256 & counts + no U+1F3B2 emoji
  const idx = JSON.parse(fs.readFileSync(path.join(DB_DIR, 'srd_index.json'), 'utf8'));
  let sumCount = 0;
  for (const [chunkFile, meta] of Object.entries(idx.chunks || {})) {
    const buf = fs.readFileSync(path.join(DB_DIR, chunkFile));
    const actualHash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
    if (actualHash !== meta.hash) errors.push(`srd_index.json hash mismatch on ${chunkFile}: ${meta.hash} vs ${actualHash}`);
    if (buf.length !== meta.bytes) errors.push(`srd_index.json bytes mismatch on ${chunkFile}: ${meta.bytes} vs ${buf.length}`);
    if (buf.toString('utf8').includes('\uD83C\uDFB2')) errors.push(`${chunkFile} contains forbidden U+1F3B2 dice emoji`);
    if (chunkFile !== 'srd_companions.json') sumCount += meta.count;
  }
  if (idx.totalEntries !== sumCount) errors.push(`srd_index.json totalEntries mismatch: ${idx.totalEntries} vs ${sumCount}`);
  if (idx.index.length !== sumCount) errors.push(`srd_index.json index.length mismatch: ${idx.index.length} vs ${sumCount}`);
}

function runSeedAudit(seed, samplePct = 0.25) {
  const rng = mulberry32(seed);
  const { categories, preMaps } = collectDeltaEntries();
  const errors = [];

  runChecks100Pct(preMaps, errors);

  const sampledCounts = {};
  for (const [catName, list] of Object.entries(categories)) {
    const need = Math.max(catName === 'variantClasses' ? list.length : Math.min(list.length, 1), Math.ceil(list.length * samplePct));
    const shuffled = shuffleDeterministic(list, rng);
    const sample = shuffled.slice(0, need);
    sampledCounts[catName] = { totalDelta: list.length, sampled: sample.length };
    for (const entry of sample) {
      validateEntryV3(entry, errors);
    }
  }

  // Run full corpus gate
  const corpusRep = runCorpusAudit();
  if (corpusRep.v2Entries > 0 || Object.keys(corpusRep.unmappedTargets).length > 0 || Object.keys(corpusRep.unmappedV3BlockTypes).length > 0) {
    errors.push(`verify_v3_corpus gate failed: v2=${corpusRep.v2Entries}, unmappedTargets=${Object.keys(corpusRep.unmappedTargets).length}`);
  }

  return { seed, samplePct, sampledCounts, corpusTotal: corpusRep.totalEntries, corpusV3: corpusRep.v3Entries, errors };
}

if (require.main === module) {
  const seeds = [20261116, 77773333];
  let allOk = true;
  for (const seed of seeds) {
    const res = runSeedAudit(seed, 0.25);
    console.log(`🔍 Seed ${seed} (>=25% stratified audit):`, JSON.stringify({
      corpus: `${res.corpusV3}/${res.corpusTotal} V3`,
      sampledCounts: res.sampledCounts,
      errorCount: res.errors.length
    }));
    if (res.errors.length > 0) {
      allOk = false;
      console.error('❌ Errors:', res.errors.slice(0, 20));
    }
  }
  if (!allOk) process.exit(1);
  console.log('✅ All seeded >=25% (min >=10%) V3 mechanics audits PASSED with 0 errors!');
}

module.exports = { runSeedAudit, mulberry32 };
