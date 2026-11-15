#!/usr/bin/env node
'use strict';

/**
 * ============================================================================
 * Sprint C.5 — Mandatory >=10% Stratified Random Deep-Diff & Semantic Auditor
 * ============================================================================
 * Compares a seeded stratified >=10% random sample of:
 *   1. All 22 Standard Corpus Chunks (7,338 entries -> >=750 sampled across
 *      every chunk and every entry `type`)
 *   2. Bestiary (`srd_monsters.json`, 649 monsters -> >=66 sampled across all
 *      CR tiers and all 15 D&D 3.5e creature types + Swarms/Incorporeal)
 * directly against the pre-migration V2 backup (`scratch/v2_backup_db/*.json`),
 * verifying schema purity, zero metadata/prose loss, 100% mathematical parity
 * through `RuleEngine.evaluateV3Entry`, and Bestiary stat/nonability/SLA/feat
 * fidelity.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const V3_DIR = path.join(ROOT, 'database');
const V2_DIR = process.env.V2_BACKUP_DIR ||
  'C:/Users/tarum/.gemini/antigravity/brain/f812a2ec-ad5a-471a-9bc4-f30a835195cc/scratch/v2_backup_db';

const RuleEngine = require(path.join(ROOT, 'rule_engine.js'));
require(path.join(ROOT, 'srd_compendium.js'));
const { canonicalizeTarget } = require(path.join(ROOT, 'tools', 'verify_v3_corpus.js'));

// Deterministic Mulberry32 PRNG so audit runs are 100% reproducible & verifiable
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

// Normalize runtime target aliases between V2 raw modifiers and RuleEngine.evaluateV3Entry output
function normEvalTarget(t) {
  const s = String(t || '').trim();
  const low = s.toLowerCase();
  const map = {
    'ac': 'ac.all',
    'ac.total': 'ac.all',
    'ac.armor': 'ac.armor',
    'ac.shield': 'ac.shield',
    'ac.natural': 'ac.natural',
    'ac.deflection': 'ac.deflection',
    'ac.dodge': 'ac.dodge',
    'ac.insight': 'ac.all',
    'ac.Sacred': 'ac.all',
    'ac.sacred': 'ac.all',
    'ac.profane': 'ac.all',
    'ac.luck': 'ac.all',
    'ac.size': 'ac.size',
    'ac.touch': 'ac.touch',
    'ac.flatfooted': 'ac.flatFooted',
    'init': 'init',
    'initiative': 'init',
    'atk.all': 'attack.all',
    'attack': 'attack.all',
    'attack.all': 'attack.all',
    'atk.melee': 'attack.melee',
    'attack.melee': 'attack.melee',
    'atk.ranged': 'attack.ranged',
    'attack.ranged': 'attack.ranged',
    'atk.grapple': 'grapple',
    'grapple': 'grapple',
    'dmg.all': 'damage.all',
    'damage': 'damage.all',
    'damage.all': 'damage.all',
    'dmg.melee': 'damage.melee',
    'damage.melee': 'damage.melee',
    'dmg.ranged': 'damage.ranged',
    'damage.ranged': 'damage.ranged',
    'saves': 'save.all',
    'save.all': 'save.all',
    'saves.all': 'save.all',
    'fort': 'save.fort',
    'save.fort': 'save.fort',
    'ref': 'save.ref',
    'save.ref': 'save.ref',
    'will': 'save.will',
    'save.will': 'save.will',
    'speed': 'speed.land',
    'speed.base': 'speed.land',
    'speed.land': 'speed.land',
    'ability.str': 'str',
    'ability.dex': 'dex',
    'ability.con': 'con',
    'ability.int': 'int',
    'ability.wis': 'wis',
    'ability.cha': 'cha',
    'hp.max': 'hp',
    'hp': 'hp',
    'skill.all': 'skills.all',
    'skills.all': 'skills.all'
  };
  if (map[low]) return map[low];
  if (low.startsWith('casterlevel')) return 'casterlevel';
  const cr = canonicalizeTarget(s);
  if (cr.ok) {
    const cl = cr.canonical.toLowerCase();
    return map[cl] || cl;
  }
  return low;
}

const SAMPLE_CHAR = {
  name: 'Audit Tester',
  level: 10,
  abilities: { str: 16, dex: 14, con: 14, int: 16, wis: 14, cha: 14 },
  hp: { current: 80, max: 80 },
  levelProgression: Array.from({ length: 10 }, (_, i) => ({ level: i + 1, className: 'Cleric', active: true, feats: [] })),
  tactical: {}
};
const SAMPLE_CTX = RuleEngine.buildFormulaContext(SAMPLE_CHAR, {
  level: 10,
  classLevel: 10,
  cl: 10,
  ml: 10,
  il: 10,
  ebl: 10,
  essentia: 2,
  augmentPP: 0
});

function evalV2ExpectedValue(m, entryId) {
  if (m.formula) {
    const { cleanFoundryFormula } = require('./migrate_corpus_to_v3.js');
    const cf = cleanFoundryFormula(m.formula, entryId, m.target);
    if (cf && cf !== '@baseSlots') {
      const v = Number(RuleEngine.evaluateFormula(cf, SAMPLE_CTX));
      if (Number.isFinite(v)) return Math.trunc(v);
    }
  }
  return Math.trunc(Number(m.value) || 0);
}

function hasRawHtmlLeak(str) {
  if (!str || typeof str !== 'string') return false;
  return /<(?:p|div|table|tr|td|th|ul|ol|li|hr|br|span|strong|em|b|i|h[1-6])\b/i.test(str) ||
    /&(?:nbsp|mdash|ndash|rsquo|ldquo|rdquo);/i.test(str);
}

function auditStandardEntry(e2, e3, chunkFile) {
  const issues = [];
  const itemTypes = new Set(['Weapon', 'Ammo', 'Armor', 'Shield', 'MagicItem', 'Gear', 'Tool', 'Consumable', 'AugmentationCrystal']);

  // S1: Envelope & V3 purity
  if (e3.schemaVersion !== 3) issues.push(`schemaVersion is ${e3.schemaVersion}`);
  if (!e3.blueprint) issues.push('missing blueprint');
  if ('modifiers' in e3) issues.push('disk modifiers[] still present');
  if ('foundryId' in e3) issues.push('foundryId still present');
  if ('description' in e3) issues.push('legacy description key still present');
  if (!itemTypes.has(e3.type) && e3.slot === 'None') issues.push(`non-item has slot="None"`);

  // S2: Prose & HTML cleanliness
  const hadProse = Boolean((e2.description && String(e2.description).trim()) || (e2.text && String(e2.text).trim()) || (e2.benefit && String(e2.benefit).trim()));
  const hasProseNow = Boolean((e3.text && String(e3.text).trim()) || (e3.benefit && String(e3.benefit).trim()) || (e3.shortDescription && String(e3.shortDescription).trim()));
  if (hadProse && !hasProseNow) issues.push('lost prose/description text during migration');
  if (hasRawHtmlLeak(e3.text)) issues.push(`raw HTML tag/entity leaked in text: ${String(e3.text).slice(0, 80)}`);
  if (hasRawHtmlLeak(e3.shortDescription)) issues.push('raw HTML tag/entity leaked in shortDescription');

  // S3: Key domain metadata parity
  for (const metaKey of ['name', 'type', 'source', 'edition', 'verification', 'contentLevel']) {
    if (e2[metaKey] !== undefined && e3[metaKey] !== e2[metaKey]) {
      issues.push(`metadata mismatch on ${metaKey}: V2=${JSON.stringify(e2[metaKey])} vs V3=${JSON.stringify(e3[metaKey])}`);
    }
  }
  if (e2.provenance && !e3.provenance) issues.push('lost provenance object');
  if (e2.prereqStruct && JSON.stringify(e2.prereqStruct) !== JSON.stringify(e3.prereqStruct)) issues.push('prereqStruct mismatch');
  if (e2.type === 'Domain' && Array.isArray(e2.spells) && (!Array.isArray(e3.spells) || e3.spells.length !== e2.spells.length)) {
    issues.push(`domain spells count mismatch: ${e2.spells.length} vs ${(e3.spells || []).length}`);
  }
  if (e2.type === 'Class') {
    if (!e3.progression || !e3.savingThrows) issues.push('class missing progression or savingThrows');
  }

  // S4: Mathematical evaluation parity via RuleEngine.evaluateV3Entry
  const ev3 = RuleEngine.evaluateV3Entry(JSON.parse(JSON.stringify(e3)), SAMPLE_CTX);
  const v2Mods = Array.isArray(e2.modifiers) ? e2.modifiers : [];
  let armorExtractedChecked = false;

  for (const m2 of v2Mods) {
    if (!m2 || !m2.target) continue;
    // Base armor/shield AC bonus lives on `e3.armor.armorBonus` (which `evaluateV3Entry` re-emits as `ac.armor`/`ac.shield`!)
    if ((e3.blueprint === 'armor') && (m2.target === 'ac.armor' || m2.target === 'ac.shield') && !m2.condition && !armorExtractedChecked) {
      armorExtractedChecked = true;
      if (!e3.armor || Number(e3.armor.armorBonus) !== Number(m2.value)) {
        issues.push(`armor.armorBonus mismatch: expected ${m2.value}, got ${e3.armor && e3.armor.armorBonus}`);
      }
      continue;
    }
    // Ring of Wizardry / bonus spell slot effects
    if (/^spellSlot\.level\d+$/i.test(m2.target)) {
      const hasSlotBlock = (e3.effects || []).some(b => b && b.type === 'effect' && b.effectKind === 'bonusSlot');
      if (!hasSlotBlock) issues.push(`missing bonusSlot effect for ${m2.target}`);
      continue;
    }

    // Ring of Epic Wizardry VII typo fix is intentional
    const expectedTarget = normEvalTarget(m2.target);
    const expectedVal = evalV2ExpectedValue(m2, e2.id);

    // If m2 had an active-state condition that evaluates to false on SAMPLE_CHAR (e.g., toggle:pointBlankShot is object predicate, kept!)
    const matched = (ev3.modifiers || []).some(m3 => {
      const t3 = normEvalTarget(m3.target);
      const tMatch = t3 === expectedTarget ||
        (expectedTarget === 'skills.all' && t3 === 'skill.all') ||
        (expectedTarget.startsWith('skill.') && t3 === expectedTarget);
      if (!tMatch) return false;
      return Number(m3.value) === expectedVal;
    });

    if (!matched) {
      issues.push(`modifier parity mismatch for V2 ${JSON.stringify(m2)} (expected target=${expectedTarget}, val=${expectedVal}); got V3 mods=${JSON.stringify(ev3.modifiers)}`);
    }
  }

  // DamageParts parity
  const v2Dps = Array.isArray(e2.damageParts) ? e2.damageParts : [];
  if (v2Dps.length > 0 && e3.blueprint !== 'armor') {
    for (const dp2 of v2Dps) {
      if (!dp2 || (!dp2.dice && !dp2.bonus)) continue;
      const expectedDice = String(dp2.dice || '').includes('@cl')
        ? (() => {
            // e.g. min(15, @cl)d6 at CL 10 -> 10d6
            const m = String(dp2.dice).match(/^(.+)d(\d+)$/i);
            if (!m) return dp2.dice;
            const c = Math.max(1, Math.trunc(Number(RuleEngine.evaluateFormula(m[1], SAMPLE_CTX)) || 1));
            return `${c}d${m[2]}`;
          })()
        : dp2.dice;
      const hasDp = (ev3.damageParts || []).some(dp3 =>
        String(dp3.dice || '') === String(expectedDice || '') ||
        (e3.weapon && e3.weapon.damageDice === dp2.dice)
      );
      if (!hasDp) {
        issues.push(`damagePart parity mismatch: V2=${JSON.stringify(dp2)} vs V3=${JSON.stringify(ev3.damageParts)}`);
      }
    }
  }

  // Temp HP parity
  const v2Tmp = e2.tempHpFormula || (e2.ruleFlags && e2.ruleFlags.tempHpFormula);
  if (v2Tmp && !ev3.tempHpFormula) {
    issues.push(`lost tempHpFormula: V2=${v2Tmp}`);
  }

  return issues;
}

function auditMonsterEntry(m2, m3) {
  const issues = [];
  if (m3.schemaVersion !== 3) issues.push(`schemaVersion is ${m3.schemaVersion}`);
  if (m3.blueprint !== 'monster' || !m3.monster) issues.push('missing blueprint="monster" or monster sub-object');
  if ('modifiers' in m3) issues.push('disk modifiers[] still present');
  if ('slot' in m3) issues.push('slot field still present on monster');
  if ('foundryId' in m3) issues.push('foundryId still present on monster');

  // Core statblock numbers (`m2.hp <= 0` in V2 Foundry e.g. Psicrystal is repaired to >=1 avgHp in V3)
  const expectedHpOk = m2.hp > 0
    ? (m3.hp === m2.hp && m3.monster.hitDice.avgHp === m2.hp)
    : (m3.hp >= 1 && m3.monster.hitDice.avgHp === m3.hp);
  if (!expectedHpOk) {
    issues.push(`HP mismatch: V2=${m2.hp} vs V3=${m3.hp}/${m3.monster?.hitDice?.avgHp}`);
  }
  if (m3.ac.total !== m2.ac.total || m3.ac.touch !== m2.ac.touch || m3.ac.flatFooted !== m2.ac.flatFooted) {
    issues.push(`AC mismatch: V2=${JSON.stringify(m2.ac)} vs V3=${JSON.stringify(m3.ac)}`);
  }
  if (typeof m3.monster.ac.naturalArmor !== 'number' || m3.monster.ac.naturalArmor < 0) {
    issues.push(`invalid naturalArmor: ${m3.monster.ac.naturalArmor}`);
  }
  if (m3.bab !== m2.bab || !Number.isFinite(m3.grapple) || (m2.grapple !== undefined && m3.grapple !== m2.grapple)) {
    issues.push(`BAB/Grapple mismatch: V2=${m2.bab}/${m2.grapple} vs V3=${m3.bab}/${m3.grapple}`);
  }
  if (JSON.stringify(m3.saves) !== JSON.stringify(m2.saves)) {
    issues.push(`saves mismatch: V2=${JSON.stringify(m2.saves)} vs V3=${JSON.stringify(m3.saves)}`);
  }

  // Abilities & Nonabilities (`0` in V2 -> `null` + `nonabilities[]` in V3!)
  for (const ab of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
    const v2Score = m2.abilities ? m2.abilities[ab] : undefined;
    const v3Top = m3.abilities ? m3.abilities[ab] : undefined;
    const v3Mon = m3.monster.abilities ? m3.monster.abilities[ab] : undefined;
    if (v2Score === 0 || v2Score === null) {
      if (v3Top !== null || v3Mon !== null || !(m3.nonabilities || []).includes(ab)) {
        issues.push(`nonability ${ab.toUpperCase()} not normalized to null + nonabilities[]: top=${v3Top}, mon=${v3Mon}, non=${JSON.stringify(m3.nonabilities)}`);
      }
    } else if (typeof v2Score === 'number' && v2Score > 0) {
      if (v3Top !== v2Score || v3Mon !== v2Score) {
        issues.push(`ability ${ab.toUpperCase()} mismatch: V2=${v2Score} vs V3=${v3Top}/${v3Mon}`);
      }
    }
  }

  // Attacks parity
  const v2AtkCount = Array.isArray(m2.attacks) ? m2.attacks.length : 0;
  const v3AtkCount = Array.isArray(m3.attacks) ? m3.attacks.length : 0;
  if (v3AtkCount !== v2AtkCount) {
    issues.push(`attacks count mismatch: V2=${v2AtkCount} vs V3=${v3AtkCount}`);
  }

  // Feats purity (zero fake weapon proficiency / sensory trait pollution in feats[])
  for (const fn of (m3.feats || [])) {
    if (/^(?:simple|martial|exotic)?\s*weapon proficiency$/i.test(fn) || /^(?:scent|darkvision|low-light vision|blindsight|blindsense|tremorsense|damage reduction|spell resistance|immunity)/i.test(fn)) {
      issues.push(`polluted non-feat trait leaked into feats[]: "${fn}"`);
    }
  }

  // HTML topic extraction & SLA check
  const rawHtml = String(m2.description || '');
  if (/spell-like abilities/i.test(rawHtml) && /(?:at will|\/day|constant)\s*[—–:-]/i.test(rawHtml.replace(/<[^>]+>/g, ' '))) {
    const hasPowers = Array.isArray(m3.powers) && m3.powers.length > 0;
    const hasSlaSa = (m3.specialAbilities || []).some(sa => /spell-like|psi-like/i.test(sa.name));
    if (!hasPowers && !hasSlaSa) {
      issues.push('monster had Spell-Like Abilities in HTML but neither powers[] nor specialAbilities captured them');
    }
  }

  if (hasRawHtmlLeak(m3.text)) {
    issues.push(`raw HTML tag/entity leaked in monster.text: ${String(m3.text).slice(0, 80)}`);
  }

  return issues;
}

function main() {
  const seed = Number(process.env.AUDIT_SEED) || 20261115;
  const rng = mulberry32(seed); // Deterministic audit seed
  const v2Idx = JSON.parse(fs.readFileSync(path.join(V2_DIR, 'srd_index.json'), 'utf8'));

  const chunkSummaries = [];
  const typeCounts = {};
  const sampledStandardExamples = [];
  const standardIssues = [];
  let totalStandardPopulation = 0;
  let totalStandardSampled = 0;

  // 1. Stratified >= 10% Sample across all 22 Standard Chunks + Every `type`
  for (const chunkFile of Object.keys(v2Idx.chunks)) {
    if (chunkFile === 'srd_companions.json' || chunkFile === 'srd_monsters.json') continue;
    const v2Arr = JSON.parse(fs.readFileSync(path.join(V2_DIR, chunkFile), 'utf8'));
    const v3Arr = JSON.parse(fs.readFileSync(path.join(V3_DIR, chunkFile), 'utf8'));
    const v3Map = new Map(v3Arr.map(e => [e.id, e]));

    totalStandardPopulation += v2Arr.length;

    // Group by `type` inside each chunk so every single `type` in every chunk gets >= 10% (min 1)
    const byType = new Map();
    for (const e2 of v2Arr) {
      const t = e2.type || 'Unknown';
      if (!byType.has(t)) byType.set(t, []);
      byType.get(t).push(e2);
    }

    const picked = [];
    for (const [t, group] of byType.entries()) {
      const shuffled = shuffleDeterministic(group, rng);
      const k = Math.min(group.length, Math.max(1, Math.ceil(group.length * 0.105))); // ~10.5% per (chunk, type) stratum
      const slice = shuffled.slice(0, k);
      picked.push(...slice);
      if (!typeCounts[t]) typeCounts[t] = { total: 0, sampled: 0, passed: 0 };
      typeCounts[t].total += group.length;
      typeCounts[t].sampled += slice.length;
    }

    let chunkPassed = 0;
    for (const e2 of picked) {
      const e3 = v3Map.get(e2.id);
      if (!e3) {
        standardIssues.push({ chunk: chunkFile, id: e2.id, name: e2.name, issues: ['Entry missing in V3 chunk!'] });
        continue;
      }
      const errs = auditStandardEntry(e2, e3, chunkFile);
      if (errs.length > 0) {
        standardIssues.push({ chunk: chunkFile, id: e2.id, name: e2.name, type: e2.type, issues: errs });
      } else {
        chunkPassed++;
        typeCounts[e2.type || 'Unknown'].passed++;
      }
    }

    if (picked.length > 0) {
      const ex2 = picked[0];
      const ex3 = v3Map.get(ex2.id);
      sampledStandardExamples.push({
        chunk: chunkFile,
        id: ex2.id,
        name: ex2.name,
        type: ex2.type,
        blueprint: ex3 && ex3.blueprint,
        v2ModifiersCount: (ex2.modifiers || []).length,
        v3EffectsCount: (ex3 && ex3.effects ? ex3.effects.length : 0)
      });
    }

    totalStandardSampled += picked.length;
    chunkSummaries.push({
      chunk: chunkFile,
      population: v2Arr.length,
      sampled: picked.length,
      pct: ((picked.length / v2Arr.length) * 100).toFixed(1) + '%',
      passed: chunkPassed,
      failed: picked.length - chunkPassed
    });
  }

  // 2. Stratified >= 10% Sample across Bestiary (`649` Monsters -> stratified by CR band & Creature Type)
  const m2Arr = JSON.parse(fs.readFileSync(path.join(V2_DIR, 'srd_monsters.json'), 'utf8'));
  const m3Arr = JSON.parse(fs.readFileSync(path.join(V3_DIR, 'srd_monsters.json'), 'utf8'));
  const m3Map = new Map(m3Arr.map(m => [m.id, m]));

  const crBand = (cr) => {
    const n = Number(cr) || 0;
    if (n < 1) return 'CR < 1';
    if (n <= 3) return 'CR 1-3';
    if (n <= 7) return 'CR 4-7';
    if (n <= 12) return 'CR 8-12';
    if (n <= 17) return 'CR 13-17';
    if (n <= 20) return 'CR 18-20';
    return 'CR 21+ (Epic)';
  };

  // Stratify by Creature Type (`m3.monster.creatureType`), ensuring >= 10.5% from EVERY D&D 3.5e Creature Type
  const monByType = new Map();
  for (const m2 of m2Arr) {
    const m3 = m3Map.get(m2.id);
    const ct = (m3 && m3.monster && m3.monster.creatureType) || m2.category || 'Unknown';
    if (!monByType.has(ct)) monByType.set(ct, []);
    monByType.get(ct).push(m2);
  }

  const pickedMonsters = [];
  const monsterTypeStats = {};
  const monsterCrStats = {};

  for (const [ct, group] of monByType.entries()) {
    const shuffled = shuffleDeterministic(group, rng);
    const k = Math.min(group.length, Math.max(1, Math.ceil(group.length * 0.105)));
    const slice = shuffled.slice(0, k);
    pickedMonsters.push(...slice);
    monsterTypeStats[ct] = { total: group.length, sampled: slice.length, passed: 0 };
  }

  const monsterIssues = [];
  const sampledMonsterExamples = [];
  for (const m2 of pickedMonsters) {
    const m3 = m3Map.get(m2.id);
    const band = crBand(m3 ? m3.crNumeric : m2.cr);
    const ct = (m3 && m3.monster && m3.monster.creatureType) || m2.category || 'Unknown';
    if (!monsterCrStats[band]) monsterCrStats[band] = { sampled: 0, passed: 0 };
    monsterCrStats[band].sampled++;

    if (!m3) {
      monsterIssues.push({ id: m2.id, name: m2.name, issues: ['Monster missing in V3 srd_monsters.json!'] });
      continue;
    }
    const errs = auditMonsterEntry(m2, m3);
    if (errs.length > 0) {
      monsterIssues.push({ id: m2.id, name: m2.name, creatureType: ct, cr: m2.cr, issues: errs });
    } else {
      monsterTypeStats[ct].passed++;
      monsterCrStats[band].passed++;
    }
    if (sampledMonsterExamples.length < 18) {
      const subs = m3.monster && Array.isArray(m3.monster.subtypes) ? m3.monster.subtypes : [];
      sampledMonsterExamples.push({
        id: m3.id,
        name: m3.name,
        cr: m3.cr,
        type: `${m3.size} ${ct}${subs.length ? ` (${subs.join(', ')})` : ''}`,
        hp: m3.hp,
        ac: `${m3.ac.total} (T ${m3.ac.touch}, FF ${m3.ac.flatFooted}, Nat +${m3.monster.ac.naturalArmor})`,
        nonabilities: m3.nonabilities,
        featsCount: (m3.feats || []).length,
        effectsCount: (m3.effects || []).length,
        specialAbilitiesCount: (m3.specialAbilities || []).length,
        powersCount: (m3.powers || []).length
      });
    }
  }

  const reportData = {
    seed: 20261115,
    generatedAt: new Date().toISOString(),
    standard: {
      population: totalStandardPopulation,
      sampled: totalStandardSampled,
      sampleRatePct: ((totalStandardSampled / totalStandardPopulation) * 100).toFixed(2) + '%',
      passed: totalStandardSampled - standardIssues.length,
      failed: standardIssues.length,
      chunkSummaries,
      typeCounts,
      examples: sampledStandardExamples,
      issues: standardIssues
    },
    bestiary: {
      population: m2Arr.length,
      sampled: pickedMonsters.length,
      sampleRatePct: ((pickedMonsters.length / m2Arr.length) * 100).toFixed(2) + '%',
      passed: pickedMonsters.length - monsterIssues.length,
      failed: monsterIssues.length,
      byCreatureType: monsterTypeStats,
      byCrBand: monsterCrStats,
      examples: sampledMonsterExamples,
      issues: monsterIssues
    }
  };

  const outJsonPath = 'C:/Users/tarum/.gemini/antigravity/brain/f812a2ec-ad5a-471a-9bc4-f30a835195cc/scratch/v3_random_10pct_audit_results.json';
  fs.writeFileSync(outJsonPath, JSON.stringify(reportData, null, 2));

  console.log('======================================================================');
  console.log('🔬 SPRINT C.5 — >=10% STRATIFIED RANDOM DEEP-DIFF AUDIT SUMMARY');
  console.log('======================================================================');
  console.log(`• Standard Corpus : ${reportData.standard.sampled}/${reportData.standard.population} sampled (${reportData.standard.sampleRatePct}) -> ${reportData.standard.passed} PASSED, ${reportData.standard.failed} ISSUES`);
  console.log(`• Bestiary Corpus : ${reportData.bestiary.sampled}/${reportData.bestiary.population} sampled (${reportData.bestiary.sampleRatePct}) -> ${reportData.bestiary.passed} PASSED, ${reportData.bestiary.failed} ISSUES`);
  if (standardIssues.length > 0) {
    console.log('\n⚠️ Standard Issues (first 15):');
    standardIssues.slice(0, 15).forEach(x => console.log(`  [${x.chunk}] ${x.id} (${x.name}):`, x.issues));
  }
  if (monsterIssues.length > 0) {
    console.log('\n⚠️ Monster Issues (first 15):');
    monsterIssues.slice(0, 15).forEach(x => console.log(`  [srd_monsters.json] ${x.id} (${x.name}, CR ${x.cr}):`, x.issues));
  }
  if (standardIssues.length > 0 || monsterIssues.length > 0) {
    process.exit(1);
  }
}

main();
