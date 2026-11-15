#!/usr/bin/env node
'use strict';

/**
 * ============================================================================
 * Sprint C.5 — Pure Canonical V3 Corpus & Bestiary Migrator (`0 LLM Tokens`)
 * ============================================================================
 * Deterministically upgrades all 24 modular database chunks (`7,987` entries +
 * `srd_companions.json` + `srd_index.json`) into pure `schemaVersion: 3`:
 *   - 22 Standard Chunks (`7,338` entries): `weapon`, `armor`, `wondrous`,
 *     `item_mod`, `feat`, `spell`, `class`, `race`, `domain`, `buff`
 *   - Bestiary (`srd_monsters.json`, `649` entries): `blueprint: "monster"`
 *     with full `monster` chassis (`size`, `creatureType`, `subtypes`, `hitDice`,
 *     `abilities`, `nonabilities`, `speeds`, `ac` with true `naturalArmor`,
 *     `space`, `reach`, `levelAdjustment`), verified real D&D 3.5e `feats[]`,
 *     structured `attacks[]`, extracted `<div topic>` `specialAbilities[]`,
 *     SLAs -> V3 `powers[]`, defenses/senses/breath -> V3 `effects[]`, and
 *     clean readable `text` stripping bloated Foundry HTML tables.
 *   - Single-Source-of-Truth V3 `effects[]` (zero `modifiers[]` arrays on disk,
 *     zero `"slot": "None"` pollution on non-items).
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');
const DEFAULT_SRC_DIR = process.env.V2_BACKUP_DIR ||
  'C:/Users/tarum/.gemini/antigravity/brain/f812a2ec-ad5a-471a-9bc4-f30a835195cc/scratch/v2_backup_db';
const SRC_DIR = fs.existsSync(DEFAULT_SRC_DIR) ? DEFAULT_SRC_DIR : DB_DIR;

const { canonicalizeTarget } = require('./verify_v3_corpus.js');

// ----------------------------------------------------------------------------
// 1. Canonical Bonus Types, Foundry Formula Cleaner & HTML Stripper
// ----------------------------------------------------------------------------
const BONUS_TYPE_CANON = {
  alchemical: 'Alchemical',
  armor: 'Armor',
  circumstance: 'Circumstance',
  competence: 'Competence',
  cover: 'Cover',
  deflection: 'Deflection',
  divine: 'Divine',
  dodge: 'Dodge',
  domain: 'Domain',
  enhancement: 'Enhancement',
  haste: 'Haste',
  inherent: 'Inherent',
  insight: 'Insight',
  luck: 'Luck',
  morale: 'Morale',
  natural: 'Natural',
  natural_enhancement: 'Natural Enhancement',
  'natural enhancement': 'Natural Enhancement',
  penalty: 'Penalty',
  profane: 'Profane',
  racial: 'Racial',
  replace: 'Replace',
  resistance: 'Resistance',
  sacred: 'Sacred',
  shield: 'Shield',
  size: 'Size',
  trait: 'Trait',
  untyped: 'Untyped'
};

function normBonusType(raw) {
  if (!raw) return 'Untyped';
  const k = String(raw).trim().toLowerCase();
  return BONUS_TYPE_CANON[k] || (String(raw).charAt(0).toUpperCase() + String(raw).slice(1));
}

function cleanFoundryFormula(rawFormula, entryId, target) {
  if (rawFormula === null || rawFormula === undefined) return '';
  let f = String(rawFormula).trim();
  if (!f) return '';

  // Specific Foundry legacy cleanup
  if (/^\$\{this\.attributes\.encumbrance\.level\s*>\s*0\s*\?\s*0\s*:\s*Math\.floor\(this\.classes\.monk\.level\/3\)\*10\}$/.test(f)) {
    return 'floor(@classes.monk.level / 3) * 10';
  }
  if (/^@attributes\.spells\.spellbooks\.primary\.spells\.spell(\d+)\.classBase$/.test(f)) {
    return '@baseSlots';
  }
  if (/this\.classes\['divine-mind'\]\?\.level\s*>=\s*4/.test(f)) {
    return '@classes.divine_mind.level >= 4 ? max(0, @chaMod) : 0';
  }
  if (/this\.classes\.lurk\?\.level\s*>=\s*6/.test(f)) {
    return '@classes.lurk.level >= 6 ? max(0, @intMod) : 0';
  }

  f = f
    .replace(/@attributes\.hd\.total\b/g, '@level')
    .replace(/@abilities\.(str|dex|con|int|wis|cha)\.mod\b/gi, (_, s) => `@${s.toLowerCase()}Mod`)
    .replace(/@ability\.(str|dex|con|int|wis|cha)\.mod\b/gi, (_, s) => `@${s.toLowerCase()}Mod`)
    .replace(/@classes\.\s*([a-zA-Z0-9_-]+)\.level\b/g, (_, c) => `@classes.${c.toLowerCase().replace(/-/g, '_')}.level`)
    .replace(/@incarnum\.soulmelds\b/g, '@soulmeldsCount');

  return f;
}

function decodeHtmlEntities(str) {
  return String(str || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;|&#8212;/gi, '—')
    .replace(/&ndash;|&#8211;/gi, '–')
    .replace(/&rsquo;|&#8217;/gi, "'")
    .replace(/&lsquo;|&#8216;/gi, "'")
    .replace(/&ldquo;|&#8220;/gi, '"')
    .replace(/&rdquo;|&#8221;/gi, '"')
    .replace(/&times;/gi, '×')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function htmlToCleanText(html, opts = {}) {
  if (!html) return '';
  let s = String(html);
  if (opts.stripTables) {
    s = s.replace(/<table[\s\S]*?<\/table>/gi, '\n');
  } else {
    s = s
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/t[dh]>/gi, ' | ')
      .replace(/<table[^>]*>|<\/table>|<tbody[^>]*>|<\/tbody>|<thead[^>]*>|<\/thead>|<tr[^>]*>|<t[dh][^>]*>/gi, '');
  }
  s = s
    .replace(/<hr\s*\/?>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|li|ul|ol|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '');
  s = decodeHtmlEntities(s)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return s;
}

// ----------------------------------------------------------------------------
// 2. V2 Modifiers / DamageParts / TempHP / RuleFlags -> Canonical V3 `effects[]`
// ----------------------------------------------------------------------------
function buildStatBlockFromModifier(m, entryId) {
  if (!m || !m.target) return null;
  // Fix known SRD Ring of Epic Wizardry VII target typo (`spellSlot.level6` -> `spellSlot.level7`)
  let rawTarget = String(m.target).trim();
  if (entryId === 'mi-ring-of-epic-wizardry-vii' && rawTarget === 'spellSlot.level6') {
    rawTarget = 'spellSlot.level7';
  }
  const tRes = canonicalizeTarget(rawTarget);
  const canonTarget = tRes.ok ? tRes.canonical : rawTarget;

  if (tRes.toEffectSlotBlock || /^spellSlot\.level(\d+)$/.test(canonTarget)) {
    const slotLvl = Number((canonTarget.match(/\d+/) || [1])[0]) || 1;
    const rawF = cleanFoundryFormula(m.formula, entryId, canonTarget);
    const isDoubler = rawF === '@baseSlots' || /epic-wizardry|ring-of-wizardry/i.test(String(entryId || ''));
    return {
      type: 'effect',
      effectKind: 'bonusSlot',
      slotLevel: slotLvl,
      count: isDoubler ? 'double' : (Number(m.value) || 1),
      text: isDoubler
        ? `Doubles base arcane spell slots of level ${slotLvl}.`
        : `+${Number(m.value) || 1} bonus spell slot (Level ${slotLvl}).`
    };
  }

  let cond = null;
  if (m.condition && typeof m.condition === 'object') {
    cond = Object.assign({}, m.condition);
  } else if (m.condition) {
    cond = String(m.condition).trim() || null;
  }
  if (tRes.conditionFromSubkey && !cond) {
    cond = `${tRes.conditionFromSubkey} spells`;
  }

  const btype = normBonusType(m.type || m.bonusType || 'Untyped');
  const cleanedFormula = cleanFoundryFormula(m.formula, entryId, canonTarget);
  const numVal = Number(m.value);
  const hasNumericVal = Number.isFinite(numVal);
  const formulaIsSameNumber = cleanedFormula === '' || (hasNumericVal && Number(cleanedFormula) === numVal) || (!isNaN(Number(cleanedFormula)) && cleanedFormula !== '');

  // Check if formula is a pure Rule Crafter `perCL` scaling pattern:
  //   e.g. `min(5, max(1, floor(@cl / 3)))`, `min(5, floor(@cl / 3))`, `2 + min(3, floor(@cl / 6))`, `floor(@cl / 2)`
  if (!formulaIsSameNumber && cleanedFormula) {
    const simpleFloor = cleanedFormula.match(/^floor\(\s*@cl\s*\/\s*(\d+)\s*\)$/i);
    const minFloor = cleanedFormula.match(/^min\(\s*(\d+)\s*,\s*floor\(\s*@cl\s*\/\s*(\d+)\s*\)\s*\)$/i);
    const minMaxFloor = cleanedFormula.match(/^min\(\s*(\d+)\s*,\s*max\(\s*(\d+)\s*,\s*floor\(\s*@cl\s*\/\s*(\d+)\s*\)\s*\)\s*\)$/i);
    const minCl = cleanedFormula.match(/^min\(\s*(\d+)\s*,\s*@cl\s*\)$/i);
    const pureStatMod = cleanedFormula.match(/^@(str|dex|con|int|wis|cha)Mod$/i);
    const max1StatMod = cleanedFormula.match(/^max\(\s*1\s*,\s*@(str|dex|con|int|wis|cha)Mod\s*\)$/i);

    if (pureStatMod) {
      const st = `${pureStatMod[1].toLowerCase()}Mod`;
      const blk = { type: 'stat', targets: [canonTarget], mode: 'stat', stat: st, mult: 1, value: 0, cap: null, btype, formula: `@${st}` };
      if (cond) blk.condition = cond;
      return blk;
    }
    if (simpleFloor) {
      const per = Number(simpleFloor[1]) || 1;
      const blk = { type: 'stat', targets: [canonTarget], mode: 'perCL', value: 1, per, min: 0, max: 99, btype, formula: cleanedFormula };
      if (cond) blk.condition = cond;
      return blk;
    }
    if (minFloor) {
      const maxCap = Number(minFloor[1]);
      const per = Number(minFloor[2]) || 1;
      const blk = { type: 'stat', targets: [canonTarget], mode: 'perCL', value: 1, per, min: 0, max: maxCap, btype, formula: cleanedFormula };
      if (cond) blk.condition = cond;
      return blk;
    }
    if (minMaxFloor) {
      const maxCap = Number(minMaxFloor[1]);
      const minFloorVal = Number(minMaxFloor[2]);
      const per = Number(minMaxFloor[3]) || 1;
      // Preserve exact min/max formula if min > 0 so CL 1..per-1 still gets `minFloorVal` (e.g. Barkskin +2 at CL 1-3 -> wait: Barkskin is `2 + min(3, max(0, floor((@cl-3)/3)))`, Shield of Faith is `2 + min(3, floor(@cl/6))`, Magic Vestment is `min(5, max(1, floor(@cl/4)))`)
      const blk = {
        type: 'stat',
        targets: [canonTarget],
        mode: 'formula',
        value: hasNumericVal ? numVal : minFloorVal,
        formula: cleanedFormula,
        btype
      };
      if (cond) blk.condition = cond;
      return blk;
    }
    if (minCl) {
      const maxCap = Number(minCl[1]);
      const blk = { type: 'stat', targets: [canonTarget], mode: 'perCL', value: 1, per: 1, min: 0, max: maxCap, btype, formula: cleanedFormula };
      if (cond) blk.condition = cond;
      return blk;
    }

    // General dynamic formula (evaluated natively by RuleEngine.evaluateFormula!)
    const blk = {
      type: 'stat',
      targets: [canonTarget],
      mode: 'formula',
      value: hasNumericVal ? numVal : 0,
      formula: cleanedFormula,
      btype
    };
    if (m.bypass) blk.bypass = m.bypass;
    if (cond) blk.condition = cond;
    return blk;
  }

  const finalVal = (cleanedFormula !== '' && !isNaN(Number(cleanedFormula)))
    ? Number(cleanedFormula)
    : (hasNumericVal ? numVal : 0);

  const blk = {
    type: 'stat',
    targets: [canonTarget],
    mode: 'flat',
    value: finalVal,
    btype
  };
  if (m.op && m.op !== 'add') blk.op = m.op;
  if (m.bypass) blk.bypass = m.bypass;
  if (cond) blk.condition = cond;
  return blk;
}

function mergeIdenticalStatBlocks(blocks) {
  const out = [];
  const mergeIndexByKey = new Map();
  for (const b of blocks) {
    if (!b) continue;
    if (b.type === 'stat' && Array.isArray(b.targets) && b.targets.length === 1 && !b.bypass && (!b.op || b.op === 'add')) {
      const key = JSON.stringify({
        mode: b.mode,
        value: b.value,
        btype: b.btype,
        formula: b.formula || null,
        stat: b.stat || null,
        mult: b.mult ?? null,
        per: b.per ?? null,
        min: b.min ?? null,
        max: b.max ?? null,
        condition: b.condition || null
      });
      if (mergeIndexByKey.has(key)) {
        const existing = out[mergeIndexByKey.get(key)];
        if (!existing.targets.includes(b.targets[0])) {
          existing.targets.push(b.targets[0]);
        }
        continue;
      }
      mergeIndexByKey.set(key, out.length);
    }
    out.push(b);
  }
  return out;
}

function buildTempHpBlock(tempHpFormula) {
  const f = String(tempHpFormula || '').trim();
  if (!f) return null;

  // Flat integer: "1", "30", "60", "100", "110"
  if (/^\d+$/.test(f)) {
    return { type: 'roll', kind: 'Temp HP', count: Number(f), die: 'flat', scaling: 'flat', tempHpFormula: f };
  }
  // "@cl"
  if (/^@cl$/i.test(f)) {
    return { type: 'roll', kind: 'Temp HP', count: 0, die: 'flat', scaling: 'perCL', amount: 1, per: 1, max: 99, tempHpFormula: f };
  }
  // "5 * @cl" or "@cl * 5"
  const multCl = f.match(/^(?:(\d+)\s*\*\s*@cl|@cl\s*\*\s*(\d+))$/i);
  if (multCl) {
    const amt = Number(multCl[1] || multCl[2]) || 1;
    return { type: 'roll', kind: 'Temp HP', count: 0, die: 'flat', scaling: 'perCL', amount: amt, per: 1, max: 999, tempHpFormula: f };
  }
  // "min(20, @cl)" or "min(30, @cl * 2)"
  const minCl = f.match(/^min\(\s*(\d+)\s*,\s*@cl(?:\s*\*\s*(\d+))?\s*\)$/i);
  if (minCl) {
    const cap = Number(minCl[1]);
    const amt = Number(minCl[2] || 1);
    return { type: 'roll', kind: 'Temp HP', count: 0, die: 'flat', scaling: 'perCL', amount: amt, per: 1, max: cap, tempHpFormula: f };
  }
  // "1d8 + min(10, @cl)" or "1d10 + min(10, @cl)"
  const dicePlusMinCl = f.match(/^(\d+)(d\d+)\s*\+\s*min\(\s*(\d+)\s*,\s*@cl\s*\)$/i);
  if (dicePlusMinCl) {
    return {
      type: 'roll',
      kind: 'Temp HP',
      count: Number(dicePlusMinCl[1]),
      die: dicePlusMinCl[2].toLowerCase(),
      scaling: 'perCL',
      amount: 1,
      per: 1,
      max: Number(dicePlusMinCl[3]),
      tempHpFormula: f
    };
  }
  // Fallback preserving exact formula
  return { type: 'roll', kind: 'Temp HP', count: 1, die: 'd8', scaling: 'formula', tempHpFormula: f };
}

function buildRollBlockFromDamagePart(dp) {
  if (!dp || typeof dp !== 'object') return null;
  const rawDice = dp.dice !== undefined && dp.dice !== null ? String(dp.dice).trim() : '';
  const bonus = Number(dp.bonus || 0) || 0;
  const dmgType = dp.type ? String(dp.type).trim() : 'Untyped';
  const kind = /^positive|healing$/i.test(dmgType) ? 'Healing' : 'Damage';
  const crit = dp.onCritOnly ? 'onCritOnly' : (dp.multiplyOnCrit ? 'multiply' : 'normal');

  // Parse simple XdY vs dynamic formula dice (e.g. `(min(10, @cl))d6`)
  const simpleMatch = rawDice.match(/^(\d+)(d\d+)$/i);
  const blk = {
    type: 'roll',
    kind,
    dmgType: kind === 'Healing' ? 'Positive' : dmgType,
    crit
  };
  if (simpleMatch) {
    blk.count = Number(simpleMatch[1]);
    blk.die = simpleMatch[2].toLowerCase();
    blk.scaling = 'flat';
  } else if (rawDice) {
    // Check `(min(MAX, floor(@cl / PER)))dX` or `(min(MAX, @cl))dX`
    const scaleClDice = rawDice.match(/^\(\s*min\(\s*(\d+)\s*,\s*@cl\s*\)\s*\)(d\d+)$/i);
    const scaleHalfClDice = rawDice.match(/^\(\s*min\(\s*(\d+)\s*,\s*(?:max\(\s*1\s*,\s*)?floor\(\s*@cl\s*\/\s*(\d+)\s*\)\s*\)?\s*\)(d\d+)$/i);
    if (scaleClDice) {
      blk.count = 0;
      blk.die = scaleClDice[2].toLowerCase();
      blk.scaling = 'perCL';
      blk.amount = 1;
      blk.per = 1;
      blk.start = 1;
      blk.max = Number(scaleClDice[1]);
      blk.dice = rawDice;
    } else if (scaleHalfClDice) {
      blk.count = 0;
      blk.die = scaleHalfClDice[3].toLowerCase();
      blk.scaling = 'perCL';
      blk.amount = 1;
      blk.per = Number(scaleHalfClDice[2]);
      blk.start = Number(scaleHalfClDice[2]);
      blk.max = Number(scaleHalfClDice[1]);
      blk.dice = rawDice;
    } else {
      blk.dice = rawDice;
      blk.count = 1;
      blk.die = 'd6';
      blk.scaling = 'formula';
    }
  } else {
    blk.count = bonus;
    blk.die = 'flat';
    blk.scaling = 'flat';
  }

  if (bonus !== 0 && rawDice) blk.bonus = bonus;
  if (dp.critScaleByMult) blk.critScaleByMult = true;
  if (dp.touchAttack) blk.touch = true;
  if (dp.saveType) blk.save = dp.saveType;
  if (dp.dcFormula) blk.dc = dp.dcFormula;
  if (dp.condition) blk.condition = dp.condition;
  if (dp.source) blk.source = dp.source;
  return blk;
}

function buildBlocksFromRuleFlags(rf, existingEffects, bp) {
  if (!rf || typeof rf !== 'object') return [];
  const blocks = [];
  const hasDefenseWhat = (mode, whatRe) => existingEffects.some(
    e => e && e.type === 'defense' && e.mode === mode && whatRe.test(String(e.what || ''))
  );
  const hasStatTarget = (t) => existingEffects.some(
    e => e && e.type === 'stat' && Array.isArray(e.targets) && e.targets.includes(t)
  );

  if (rf.immuneFear && !hasDefenseWhat('Immunity', /fear/i)) {
    blocks.push({ type: 'defense', mode: 'Immunity', what: 'Fear' });
  }
  if (rf.immuneMindAffecting && !hasDefenseWhat('Immunity', /mind-affecting/i)) {
    blocks.push({ type: 'defense', mode: 'Immunity', what: 'Mind-Affecting' });
  }
  if (rf.immuneDeathEffects && !hasDefenseWhat('Immunity', /death/i)) {
    blocks.push({ type: 'defense', mode: 'Immunity', what: 'Death Effects' });
  }
  if (rf.immuneNegativeEnergy && !hasDefenseWhat('Immunity', /negative energy/i)) {
    blocks.push({ type: 'defense', mode: 'Immunity', what: 'Negative Energy' });
  }
  if (rf.immuneBlindnessDazzle && !hasDefenseWhat('Immunity', /blindness/i)) {
    blocks.push({ type: 'defense', mode: 'Immunity', what: 'Blindness and Dazzled' });
  }
  if (rf.freedomOfMovement && !hasDefenseWhat('Immunity', /paralysis|grapple/i)) {
    blocks.push({ type: 'defense', mode: 'Immunity', what: 'Paralysis, Solid Fog, Slow, Web & Grapple (Freedom of Movement)' });
  }
  if (Array.isArray(rf.energyImmunity)) {
    for (const el of rf.energyImmunity) {
      if (el && !hasDefenseWhat('Immunity', new RegExp(String(el), 'i'))) {
        blocks.push({ type: 'defense', mode: 'Immunity', what: String(el) });
      }
    }
  } else if (typeof rf.energyImmunity === 'string' && rf.energyImmunity !== 'choice') {
    if (!hasDefenseWhat('Immunity', new RegExp(rf.energyImmunity, 'i'))) {
      blocks.push({ type: 'defense', mode: 'Immunity', what: rf.energyImmunity });
    }
  }

  if ((rf.extraAttackFullAttack || rf.haste || (rf.speed && bp !== 'weapon')) &&
      !existingEffects.some(e => (e && e.type === 'attack' && e.attackMode === 'extra') || (e && e.type === 'defense' && e.flag === 'extraAttack'))) {
    blocks.push({ type: 'attack', attackMode: 'extra', extraKind: 'extraFull', count: 1, penalty: 0 });
  }

  if (rf.dr && !hasStatTarget('dr') && !existingEffects.some(e => e && e.type === 'defense' && e.mode === 'DR')) {
    const drStr = String(rf.dr).trim();
    const m = drStr.match(/^(\d+)\s*\/\s*(.+)$/);
    if (m) {
      blocks.push({ type: 'defense', mode: 'DR', value: Number(m[1]), what: m[2].trim() });
    }
  }

  if ((rf.sr || rf.srFormula) && !hasStatTarget('sr') && !existingEffects.some(e => e && e.type === 'defense' && (e.mode === 'Spell Resistance' || e.sr !== undefined))) {
    if (rf.srFormula) {
      blocks.push({ type: 'defense', sr: cleanFoundryFormula(rf.srFormula, '', 'sr') });
    } else if (typeof rf.sr === 'number' && rf.sr > 0) {
      blocks.push({ type: 'defense', mode: 'Spell Resistance', srMode: 'flat', value: rf.sr });
    }
  }

  if (rf.energyResistance && typeof rf.energyResistance === 'object' && !Array.isArray(rf.energyResistance)) {
    for (const [elem, val] of Object.entries(rf.energyResistance)) {
      const targetKey = `resist.${String(elem).toLowerCase()}`;
      if (Number(val) > 0 && !hasStatTarget(targetKey)) {
        blocks.push({ type: 'defense', mode: 'Energy Resistance', what: String(elem).charAt(0).toUpperCase() + String(elem).slice(1), value: Number(val) });
      }
    }
  }

  if (typeof rf.concealment === 'number' && rf.concealment > 0 && !existingEffects.some(e => e && e.type === 'defense' && e.mode === 'Concealment %')) {
    blocks.push({ type: 'defense', mode: 'Concealment %', value: rf.concealment });
  } else if (typeof rf.missChance === 'number' && rf.missChance > 0 && !existingEffects.some(e => e && e.type === 'defense' && e.mode === 'Concealment %')) {
    blocks.push({ type: 'defense', mode: 'Concealment %', value: rf.missChance });
  }

  if (typeof rf.fortification === 'number' && rf.fortification > 0 && !existingEffects.some(e => e && e.type === 'defense' && (e.defType === 'fortification' || e.kind === 'fortification'))) {
    blocks.push({ type: 'defense', defType: 'fortification', value: rf.fortification });
  }

  if (typeof rf.fastHealing === 'number' && rf.fastHealing > 0 && !hasStatTarget('fastHealing')) {
    blocks.push({ type: 'roll', kind: 'Fast Healing', count: rf.fastHealing, die: 'flat' });
  }

  const dv = Number(rf.darkvisionFt || rf.darkvision || 0);
  if (dv > 0 && !hasDefenseWhat('Sense / Movement', /darkvision/i)) {
    blocks.push({ type: 'defense', mode: 'Sense / Movement', what: `Darkvision ${dv} ft.` });
  }
  if (rf.lowLightVision && !hasDefenseWhat('Sense / Movement', /low-light vision/i)) {
    blocks.push({ type: 'defense', mode: 'Sense / Movement', what: 'Low-Light Vision' });
  }
  if (typeof rf.blindsightFt === 'number' && rf.blindsightFt > 0 && !hasDefenseWhat('Sense / Movement', /blindsight/i)) {
    blocks.push({ type: 'defense', mode: 'Sense / Movement', what: `Blindsight ${rf.blindsightFt} ft.` });
  }
  if (rf.scent && !hasDefenseWhat('Sense / Movement', /scent/i)) {
    blocks.push({ type: 'defense', mode: 'Sense / Movement', what: 'Scent' });
  }
  if (typeof rf.sizeStepChange === 'number' && rf.sizeStepChange !== 0 && !existingEffects.some(e => e && e.type === 'defense' && e.mode === 'Size Change')) {
    blocks.push({ type: 'defense', mode: 'Size Change', steps: rf.sizeStepChange });
  }

  return blocks;
}

// Normalize existing Sprint B V3 splat `effects[]` so 100% of targets & `perVar` conform to Canonical V3
function normalizeExistingV3Effects(effects, entryId) {
  if (!Array.isArray(effects)) return [];
  const walk = (list) => list.map((ef) => {
    if (!ef || typeof ef !== 'object') return null;
    const out = JSON.parse(JSON.stringify(ef));
    if (out.type === 'stat') {
      const rawTgts = Array.isArray(out.targets) ? out.targets : (out.target ? [out.target] : []);
      delete out.target;
      out.targets = rawTgts.map((t) => {
        const r = canonicalizeTarget(t);
        return r.ok ? r.canonical : t;
      });
      out.btype = normBonusType(out.btype || out.bonusType || 'Untyped');
      delete out.bonusType;
      if (out.mode === 'perVar') {
        const varName = String(out.varKey || out.stat || 'essentia').replace(/^@/, '');
        const step = Number(out.value ?? out.val ?? 1) || 1;
        out.mode = 'formula';
        out.formula = step === 1 ? `@${varName}` : `(@${varName} * ${step})`;
      } else if (out.formula) {
        out.formula = cleanFoundryFormula(out.formula, entryId, out.targets[0]);
      }
      if (out.val !== undefined && out.value === undefined) {
        out.value = out.val;
        delete out.val;
      }
    }
    if (Array.isArray(out.branches)) {
      out.branches = out.branches.map((br) => {
        const b = Object.assign({}, br);
        const childList = Array.isArray(b.effects) ? b.effects : (Array.isArray(b.kids) ? b.kids : []);
        delete b.kids;
        b.effects = walk(childList);
        return b;
      });
    }
    if (Array.isArray(out.effects)) out.effects = walk(out.effects);
    if (Array.isArray(out.rows)) {
      out.rows = out.rows.map((r) => {
        const row = Object.assign({}, r);
        const childList = Array.isArray(row.effects) ? row.effects : (Array.isArray(row.kids) ? row.kids : []);
        delete row.kids;
        row.effects = walk(childList);
        return row;
      });
    }
    return out;
  }).filter(Boolean);
  return walk(effects);
}

// ----------------------------------------------------------------------------
// 3. Blueprint Classifier & Sub-Object Builders for the 22 Standard Chunks
// ----------------------------------------------------------------------------
function resolveBlueprint(e) {
  const t = String(e.type || '').trim();
  if (t === 'Weapon' || t === 'Ammo') return 'weapon';
  if (t === 'Armor' || t === 'Shield') return 'armor';
  if (t === 'Enhancement' || t === 'AugmentationCrystal' || t === 'Material') return 'item_mod';
  if (t === 'MagicItem' || t === 'Gear' || t === 'Tool' || t === 'Consumable') return 'wondrous';
  if (['Spell', 'Power', 'Maneuver', 'Stance', 'Vestige', 'Mystery', 'Utterance', 'Soulmeld'].includes(t)) return 'spell';
  if (t === 'Class') return 'class';
  if (t === 'Race' || t === 'Template') return 'race';
  if (t === 'Domain') return 'domain';
  if (t === 'Condition' || t === 'Buff' || t === 'DamageType') return 'buff';
  if (t === 'Monster') return 'monster';
  return 'feat'; // Feat, Trait, Flaw, Skill Trick, SpecialAbility, ClassAbility, RacialTrait
}

function parseSpellEnvelope(e) {
  const t = String(e.type || 'Spell').trim();
  const descArr = Array.isArray(e.descriptors)
    ? e.descriptors
    : (typeof e.descriptors === 'string' && e.descriptors.trim()
        ? e.descriptors.split(/[,;]/).map(s => s.trim()).filter(Boolean)
        : []);

  let spellObj;
  if (e.spell && typeof e.spell === 'object' && e.spell.system) {
    spellObj = JSON.parse(JSON.stringify(e.spell));
  } else if (t === 'Power') {
    spellObj = {
      system: 'psionic',
      discipline: e.category || e.school || 'Psychometabolism',
      level: Number(e.level ?? 1) || 1,
      ppCost: Number(e.powerPointsCost ?? (Math.max(1, (Number(e.level ?? 1) * 2) - 1))) || 1,
      augmentable: Boolean(e.augment),
      descriptors: descArr
    };
  } else if (t === 'Maneuver' || t === 'Stance') {
    spellObj = {
      system: 'maneuver',
      maneuverType: t === 'Stance' ? 'Stance' : (e.subType || e.category || 'Strike'),
      discipline: e.discipline || e.school || 'Iron Heart',
      level: Number(e.level ?? 1) || 1,
      prereqManeuvers: 0,
      descriptors: descArr
    };
  } else if (t === 'Soulmeld') {
    spellObj = {
      system: 'soulmeld',
      chakraSlots: e.chakraBinds ? Object.keys(e.chakraBinds).join(' / ') : 'Arms',
      meldshaperList: e.learnedAt?.class ? Object.keys(e.learnedAt.class).join(' / ') : 'Incarnate',
      descriptors: descArr
    };
  } else if (t === 'Vestige') {
    spellObj = {
      system: 'vestige',
      level: Number(e.level ?? 1) || 1,
      bindingDc: Number(e.bindingDC ?? 15) || 15,
      sign: e.sign || '',
      descriptors: descArr
    };
  } else if (t === 'Mystery') {
    spellObj = {
      system: 'mystery',
      tier: e.tier || 'Apprentice',
      path: e.category || '',
      level: Number(e.level ?? 1) || 1,
      descriptors: descArr
    };
  } else if (t === 'Utterance') {
    spellObj = {
      system: 'utterance',
      lexicon: e.category || 'Evolving Mind',
      level: Number(e.level ?? 1) || 1,
      descriptors: descArr
    };
  } else {
    const classLevels = [];
    if (e.learnedAt && e.learnedAt.class && typeof e.learnedAt.class === 'object') {
      for (const [cls, lvl] of Object.entries(e.learnedAt.class)) {
        const cPretty = cls === 'sorcererWizard' || cls === 'wizard' || cls === 'sorcerer' ? 'Sor/Wiz' : (cls.charAt(0).toUpperCase() + cls.slice(1));
        if (!classLevels.some(x => x.class === cPretty && x.level === Number(lvl))) {
          classLevels.push({ class: cPretty, level: Number(lvl) });
        }
      }
    }
    if (classLevels.length === 0 && e.level !== undefined) {
      classLevels.push({ class: 'Sor/Wiz', level: Number(e.level) || 1 });
    }
    const comps = Array.isArray(e.components)
      ? e.components
      : (typeof e.components === 'string'
          ? e.components.split(/[,/\s]+/).filter(k => ['V', 'S', 'M', 'F', 'DF', 'XP'].includes(k))
          : ['V', 'S']);
    spellObj = {
      system: 'spell',
      classLevels,
      school: e.school || e.category || 'Universal',
      subschool: e.subschool || undefined,
      descriptors: descArr,
      components: comps
    };
  }

  // Delivery
  let delivery = e.delivery && typeof e.delivery === 'object' ? JSON.parse(JSON.stringify(e.delivery)) : null;
  if (!delivery) {
    const rawAct = String(e.castingTime || e.action || '1 standard action');
    const action = /swift/i.test(rawAct) ? 'Swift'
      : (/immediate/i.test(rawAct) ? 'Immediate'
        : (/full/i.test(rawAct) ? 'Full-Round'
          : (/move/i.test(rawAct) ? 'Move'
            : (/free/i.test(rawAct) ? 'Free' : 'Standard'))));
    const atkKind = e.actionType === 'rsak' ? 'rangedTouch'
      : (e.actionType === 'msak' ? 'meleeTouch'
        : (e.actionType === 'rwak' ? 'ranged'
          : (e.actionType === 'mwak' ? 'melee' : 'none')));
    const srVal = e.sr === true || /^yes/i.test(String(e.sr || '')) ? 'Yes'
      : (e.sr === false || /^no|^none/i.test(String(e.sr || '')) ? 'No' : null);
    delivery = {
      action,
      castingTime: e.castingTime || undefined,
      range: e.range || null,
      area: e.area || null,
      target: e.target || null,
      attack: atkKind,
      spellResistance: srVal
    };
    const rawSave = String(e.save || e.savingThrow || '').trim();
    if (rawSave && !/^none$/i.test(rawSave)) {
      const sType = /fort/i.test(rawSave) ? 'Fort' : (/ref/i.test(rawSave) ? 'Ref' : (/will/i.test(rawSave) ? 'Will' : 'None'));
      const sEff = /half/i.test(rawSave) ? 'Half' : (/partial/i.test(rawSave) ? 'Partial' : (/disbelief/i.test(rawSave) ? 'Disbelief' : 'Negates'));
      if (sType !== 'None') {
        delivery.save = { type: sType, effect: sEff, raw: rawSave };
      }
    }
  }

  // Lifecycle
  let lifecycle = e.lifecycle && typeof e.lifecycle === 'object' ? JSON.parse(JSON.stringify(e.lifecycle)) : null;
  if (!lifecycle) {
    const rawDur = String(e.duration || 'Instantaneous').trim();
    const dLow = rawDur.toLowerCase();
    const dismissible = dLow.includes('(d)');
    let durCode = 'text';
    if (/^instant/i.test(dLow)) durCode = 'instant';
    else if (/^perm/i.test(dLow)) durCode = 'perm';
    else if (/^conc/i.test(dLow)) durCode = 'conc';
    else if (/round\/level|rd\.?\/level/i.test(dLow)) durCode = 'rdLvl';
    else if (/min\.?\/level|minute\/level/i.test(dLow)) durCode = 'minLvl';
    else if (/10\s*min\.?\/level/i.test(dLow)) durCode = '10minLvl';
    else if (/hour\/level|hr\.?\/level/i.test(dLow)) durCode = 'hrLvl';
    else if (/day\/level/i.test(dLow)) durCode = 'dayLvl';
    lifecycle = {
      usage: { mode: t === 'Stance' || t === 'Soulmeld' || t === 'Vestige' ? 'atwill' : 'spellSlot', slotLevel: Number(e.level ?? 1) || 1 },
      duration: durCode,
      durationText: rawDur,
      dismissible
    };
  }

  return { spell: spellObj, delivery, lifecycle };
}

function migrateStandardEntry(raw) {
  const e = JSON.parse(JSON.stringify(raw));
  const bp = resolveBlueprint(e);

  // 1. Clean text from raw description / benefit
  const rawHtml = e.text && typeof e.text === 'string'
    ? e.text
    : (e.description || e.benefit || e.shortDescription || '');
  const cleanText = htmlToCleanText(rawHtml);

  // 2. Build canonical `effects[]`
  let effects = Array.isArray(e.effects) && e.effects.length > 0
    ? normalizeExistingV3Effects(e.effects, e.id)
    : [];

  // Extract Armor/Shield base AC bonus BEFORE converting remaining modifiers to `effects[]`
  let extractedArmorBonus = null;
  const remainingMods = [];
  if (Array.isArray(e.modifiers)) {
    for (const m of e.modifiers) {
      if (!m) continue;
      if (bp === 'armor' && (m.target === 'ac.armor' || m.target === 'ac.shield') && !m.condition && extractedArmorBonus === null) {
        extractedArmorBonus = Number(m.value) || 0;
        continue;
      }
      remainingMods.push(m);
    }
  }

  if (remainingMods.length > 0) {
    const modBlocks = remainingMods.map(m => buildStatBlockFromModifier(m, e.id)).filter(Boolean);
    effects.push(...mergeIdenticalStatBlocks(modBlocks));
  }

  // Convert `tempHpFormula` -> V3 `roll` (`kind: 'Temp HP'`)
  const tmpFormula = e.tempHpFormula || (e.ruleFlags && e.ruleFlags.tempHpFormula);
  if (tmpFormula && !effects.some(b => b && b.type === 'roll' && b.kind === 'Temp HP')) {
    const tmpBlk = buildTempHpBlock(tmpFormula);
    if (tmpBlk) effects.push(tmpBlk);
  }

  // Convert non-weapon `damageParts[]` -> V3 `roll` blocks
  if (bp !== 'weapon' && Array.isArray(e.damageParts) && e.damageParts.length > 0) {
    // Only add if not already represented by roll blocks in `effects`
    const hasRollAlready = effects.some(b => b && b.type === 'roll' && b.kind !== 'Temp HP');
    if (!hasRollAlready) {
      for (const dp of e.damageParts) {
        const rb = buildRollBlockFromDamagePart(dp);
        if (rb) effects.push(rb);
      }
    }
  }

  // Convert structured `ruleFlags` -> V3 `defense` / `attack` blocks
  if (e.ruleFlags && typeof e.ruleFlags === 'object') {
    const rfBlocks = buildBlocksFromRuleFlags(e.ruleFlags, effects, bp);
    effects.push(...rfBlocks);
  }

  // Convert `modes[]` inner `modifiers` / `damageParts` -> `mode.effects[]`
  let migratedModes = undefined;
  if (Array.isArray(e.modes) && e.modes.length > 0) {
    migratedModes = e.modes.map((m) => {
      const mc = Object.assign({}, m);
      const mEffects = Array.isArray(mc.effects) ? normalizeExistingV3Effects(mc.effects, e.id) : [];
      if (Array.isArray(mc.modifiers) && mc.modifiers.length > 0) {
        const mb = mc.modifiers.map(mod => buildStatBlockFromModifier(mod, e.id)).filter(Boolean);
        mEffects.push(...mergeIdenticalStatBlocks(mb));
      }
      delete mc.modifiers;
      if (bp !== 'weapon' && Array.isArray(mc.damageParts) && mc.damageParts.length > 0) {
        for (const dp of mc.damageParts) {
          const rb = buildRollBlockFromDamagePart(dp);
          if (rb) mEffects.push(rb);
        }
        delete mc.damageParts;
      }
      if (mEffects.length > 0) mc.effects = mEffects;
      return mc;
    });
  }

  // 3. Build V3 Blueprint Envelope & Sub-Objects
  const out = {
    schemaVersion: 3,
    id: e.id,
    blueprint: bp,
    name: e.name,
    type: e.type
  };
  if (e.category !== undefined) out.category = e.category;
  if (e.source) out.source = e.source;
  if (e.aliases && e.aliases.length) out.aliases = e.aliases;
  if (e.page !== undefined) out.page = e.page;
  if (e.edition) out.edition = e.edition;
  if (e.verification) out.verification = e.verification;

  // Blueprint-specific chassis sub-objects
  if (bp === 'weapon') {
    const baseDp = (Array.isArray(e.damageParts) && e.damageParts[0]) || null;
    const dice = (baseDp && baseDp.dice) || e.damage || e.weapon?.damageDice || '1d6';
    const dmgType = (baseDp && baseDp.type) || e.dmgType || e.weapon?.dmgType || 'Slashing';
    const critRange = Number(e.critRange ?? e.weapon?.baseCritRange ?? 20) || 20;
    const critMult = Number(e.critMult ?? e.weapon?.critMultiplier ?? 2) || 2;
    const rangeInc = Number(e.rangeIncrement ?? e.range ?? e.weapon?.rangeIncrement ?? 0) || 0;
    out.slot = e.slot && e.slot !== 'None' ? e.slot : 'Main Hand';
    out.cost = Number(e.cost ?? 0) || 0;
    out.weight = Number(e.weight ?? 0) || 0;
    if (e.baseItemId) out.baseItemId = e.baseItemId;
    if (e.material) out.material = e.material;
    if (e.enhancementBonus) out.enhancementBonus = Number(e.enhancementBonus);
    out.item = {
      subtype: e.type === 'Ammo' ? 'Ammunition' : 'Weapon',
      slot: out.slot,
      consumable: e.type === 'Ammo',
      price: out.cost,
      casterLevel: Number(e.casterLevel ?? 0) || 0
    };
    out.weapon = {
      category: e.category || 'Simple',
      handedness: e.handedness || (e.isLight ? 'light' : 'one-handed'),
      damageDice: dice,
      dmgType,
      baseCritRange: critRange,
      keen: Boolean(e.ruleFlags && e.ruleFlags.keen),
      effectiveCritRange: critRange,
      critMultiplier: critMult,
      rangeIncrement: rangeInc > 0 ? rangeInc : null
    };
    out.damageParts = Array.isArray(e.damageParts) && e.damageParts.length > 0
      ? e.damageParts
      : [{ dice, bonus: 0, type: dmgType, multiplyOnCrit: true, onCritOnly: false, source: 'Base' }];
    // Preserve quick weapon catalog fields used by Inventory & Combat tables
    out.handedness = out.weapon.handedness;
    out.critRange = critRange;
    out.critMult = critMult;
    if (rangeInc > 0) out.rangeIncrement = rangeInc;
    if (e.quantity !== undefined) out.quantity = e.quantity;
  } else if (bp === 'armor') {
    const isShield = e.type === 'Shield' || /shield|buckler/i.test(String(e.category || ''));
    const armorBonus = extractedArmorBonus !== null
      ? extractedArmorBonus
      : Number(e.acBonus ?? e.armor?.armorBonus ?? e.armor?.acBonus ?? 0) || 0;
    const maxDex = (e.maxDex === null || e.maxDex === undefined) ? null : Number(e.maxDex);
    const acp = Number(e.checkPenalty ?? e.armor?.armorCheckPenalty ?? 0) || 0;
    const asf = Number(e.spellFailure ?? e.armor?.arcaneSpellFailure ?? 0) || 0;
    const spdNum = e.speed30 ? (parseInt(String(e.speed30), 10) || 30) : 30;
    out.slot = e.slot && e.slot !== 'None' ? e.slot : (isShield ? 'Shield' : 'Armor');
    out.cost = Number(e.cost ?? 0) || 0;
    out.weight = Number(e.weight ?? 0) || 0;
    if (e.baseItemId) out.baseItemId = e.baseItemId;
    if (e.material) out.material = e.material;
    if (e.enhancementBonus) out.enhancementBonus = Number(e.enhancementBonus);
    out.item = {
      subtype: isShield ? 'Shield' : 'Armor',
      slot: out.slot,
      consumable: false,
      price: out.cost,
      casterLevel: Number(e.casterLevel ?? 0) || 0
    };
    out.armor = {
      armorType: isShield ? 'Shield' : (e.category || 'Light'),
      armorBonus,
      maxDex,
      armorCheckPenalty: acp,
      arcaneSpellFailure: asf,
      speed: spdNum
    };
    out.acBonus = armorBonus;
    out.maxDex = maxDex;
    out.checkPenalty = acp;
    out.spellFailure = asf;
    if (e.speed30) out.speed30 = e.speed30;
    if (e.speed20) out.speed20 = e.speed20;
    if (Array.isArray(e.damageParts) && e.damageParts.length > 0) out.damageParts = e.damageParts; // Shield bash / Armor spikes
  } else if (bp === 'wondrous') {
    const slot = (e.slot && e.slot !== 'None') ? e.slot : (e.bodySlot && e.bodySlot !== 'None' ? e.bodySlot : 'Slotless');
    out.slot = slot;
    out.cost = Number(e.cost ?? 0) || 0;
    out.weight = Number(e.weight ?? 0) || 0;
    out.item = {
      subtype: e.category || e.type || 'Wondrous Item',
      slot,
      consumable: e.type === 'Consumable' || /potion|scroll|wand|oil|elixir/i.test(String(e.category || '')),
      price: out.cost,
      casterLevel: Number(e.casterLevel ?? 0) || 0
    };
    if (e.charges !== undefined) out.charges = e.charges;
    if (e.maxCharges !== undefined) out.maxCharges = e.maxCharges;
    if (e.activation) out.activation = e.activation;
    if (e.aura) out.aura = e.aura;
    if (e.requirements) out.requirements = e.requirements;
  } else if (bp === 'item_mod') {
    const kind = e.type === 'Material' ? 'material' : (e.type === 'AugmentationCrystal' ? 'crystal' : 'enchantment');
    const applies = String(e.targetType || e.appliesTo || e.category || 'weapon').toLowerCase().includes('armor') ? 'armor'
      : (String(e.targetType || e.appliesTo || e.category || '').toLowerCase().includes('shield') ? 'shield' : 'weapon');
    out.cost = Number(e.cost ?? e.flatCost ?? 0) || 0;
    if (e.targetType) out.targetType = e.targetType;
    if (e.appliesTo) out.appliesTo = e.appliesTo;
    if (e.enhIncrease !== undefined) out.enhIncrease = e.enhIncrease;
    if (e.flatCost !== undefined) out.flatCost = e.flatCost;
    if (e.hardness !== undefined) out.hardness = e.hardness;
    if (e.hpPerInch !== undefined) out.hpPerInch = e.hpPerInch;
    if (e.casterLevel !== undefined) out.casterLevel = e.casterLevel;
    if (e.requirements) out.requirements = e.requirements;
    if (e.slot && e.type === 'AugmentationCrystal' && e.slot !== 'None') out.slot = e.slot;
    out.itemModifier = {
      kind,
      appliesTo: applies,
      costMode: Number(e.enhIncrease) > 0 ? 'plus' : 'gp',
      enhancementIncrease: Number(e.enhIncrease || 0),
      flatGp: Number(e.flatCost ?? e.cost ?? 0) || 0,
      keen: Boolean(e.ruleFlags && e.ruleFlags.keen)
    };
  } else if (bp === 'spell') {
    const env = parseSpellEnvelope(e);
    out.spell = env.spell;
    out.delivery = env.delivery;
    out.lifecycle = env.lifecycle;
    // Keep fast spellbook/subsystem index keys (NO `slot: "None"`!)
    if (e.level !== undefined) out.level = e.level;
    if (e.school) out.school = e.school;
    if (e.subschool) out.subschool = e.subschool;
    if (e.descriptors) out.descriptors = e.descriptors;
    if (e.discipline) out.discipline = e.discipline;
    if (e.learnedAt) out.learnedAt = e.learnedAt;
    if (e.castingTime) out.castingTime = e.castingTime;
    if (e.action) out.action = e.action;
    if (e.actionType) out.actionType = e.actionType;
    if (e.components) out.components = e.components;
    if (e.materials) out.materials = e.materials;
    if (e.display) out.display = e.display;
    if (e.range) out.range = e.range;
    if (e.area) out.area = e.area;
    if (e.effect) out.effect = e.effect;
    if (e.target) out.target = e.target;
    if (e.duration) out.duration = e.duration;
    if (e.save) out.save = e.save;
    if (e.sr !== undefined) out.sr = e.sr;
    if (e.buffTargetMode) out.buffTargetMode = e.buffTargetMode;
    if (e.powerPointsCost !== undefined) out.powerPointsCost = e.powerPointsCost;
    if (e.augment) out.augment = e.augment;
    if (e.shapedEffect) out.shapedEffect = e.shapedEffect;
    if (e.essentiaEffect) out.essentiaEffect = e.essentiaEffect;
    if (e.chakraBinds) {
      // Normalize any inner blocks inside chakraBinds
      const cbOut = {};
      for (const [ck, cv] of Object.entries(e.chakraBinds)) {
        if (Array.isArray(cv)) cbOut[ck] = normalizeExistingV3Effects(cv, e.id);
        else if (cv && typeof cv === 'object') {
          const copyCv = Object.assign({}, cv);
          if (Array.isArray(copyCv.effects)) copyCv.effects = normalizeExistingV3Effects(copyCv.effects, e.id);
          if (Array.isArray(copyCv.blocks)) {
            copyCv.effects = normalizeExistingV3Effects(copyCv.blocks, e.id);
            delete copyCv.blocks;
          }
          delete copyCv.modifiers;
          cbOut[ck] = copyCv;
        } else cbOut[ck] = cv;
      }
      out.chakraBinds = cbOut;
    }
    if (e.title) out.title = e.title;
  } else if (bp === 'feat') {
    const t = String(e.type || 'Feat');
    out.featKind = t === 'Trait' ? 'trait'
      : (t === 'Flaw' ? 'flaw'
        : (t === 'Skill Trick' ? 'skillTrick'
          : (t === 'ClassAbility' ? 'classAbility'
            : (t === 'RacialTrait' ? 'racialTrait' : 'feat'))));
    if (e.isFighterBonusFeat !== undefined) out.isFighterBonusFeat = e.isFighterBonusFeat;
    if (e.bonusFeatFor) out.bonusFeatFor = e.bonusFeatFor;
    if (e.featTypes) out.featTypes = e.featTypes;
    if (e.prereq) out.prereq = e.prereq;
    if (e.prereqStruct) out.prereqStruct = e.prereqStruct;
    if (e.prerequisites !== undefined) out.prerequisites = e.prerequisites;
    else if (typeof e.prereq === 'string' && e.prereq.trim() && e.prereq.trim().toLowerCase() !== 'none') out.prerequisites = e.prereq.trim();
    if (e.benefit) out.benefit = htmlToCleanText(e.benefit);
    if (e.normal) out.normal = htmlToCleanText(e.normal);
    if (e.special) out.special = htmlToCleanText(e.special);
    if (e.drawback) out.drawback = htmlToCleanText(e.drawback);
    if (e.cost !== undefined && t === 'Skill Trick') out.cost = e.cost;
    if (e.usage) out.usage = e.usage;
    if (e.abilityType) out.abilityType = e.abilityType;
    if (e.associations) out.associations = e.associations;
  } else if (bp === 'class') {
    const isPrest = Boolean(e.isPrestige || String(e.category || '').toLowerCase().includes('prestige'));
    const maxLvl = Number(e.maxLevel ?? (isPrest ? 10 : 20)) || 20;
    const hdNum = Number(String(e.hitDie || e.hd || 8).replace(/^d/i, '')) || 8;
    const babRaw = String(e.babProgression || e.bab || 'medium').toLowerCase();
    const babCode = babRaw === 'high' || babRaw === 'full' || babRaw === '1' ? 'full'
      : (babRaw === 'low' || babRaw === 'poor' || babRaw === '1/2' ? '1/2' : '3/4');
    const st = e.savingThrows || { fort: e.fort || 'low', ref: e.ref || 'low', will: e.will || 'low' };
    const goodSaves = ['fort', 'ref', 'will'].filter(s => st[s] === 'high' || st[s] === 'good');
    const skillPts = Number(e.skillPointsPerLevel ?? e.skills ?? 2) || 2;
    const classSkills = Array.isArray(e.classSkills) ? e.classSkills : [];
    out.hitDie = (typeof e.hitDie === 'string' && /^d\d+$/i.test(e.hitDie.trim())) ? e.hitDie.trim() : hdNum;
    if (e.hd !== undefined) out.hd = e.hd;
    out.babProgression = babCode === 'full' ? 'high' : (babCode === '1/2' ? 'low' : 'medium');
    out.savingThrows = {
      fort: goodSaves.includes('fort') ? 'high' : 'low',
      ref: goodSaves.includes('ref') ? 'high' : 'low',
      will: goodSaves.includes('will') ? 'high' : 'low'
    };
    out.fort = goodSaves.includes('fort') ? 'good' : 'poor';
    out.ref = goodSaves.includes('ref') ? 'good' : 'poor';
    out.will = goodSaves.includes('will') ? 'good' : 'poor';
    if (e.bab !== undefined) out.bab = e.bab;
    if (e.skills !== undefined) out.skills = e.skills;
    if (e.contentLevel) out.contentLevel = e.contentLevel;
    if (e.subsystem) out.subsystem = e.subsystem;
    out.skillPointsPerLevel = skillPts;
    out.classSkills = classSkills;
    if (e.isPrestige !== undefined) out.isPrestige = e.isPrestige;
    if (e.maxLevel !== undefined) out.maxLevel = maxLvl;
    if (e.proficiencies) out.proficiencies = e.proficiencies;
    if (e.prerequisites !== undefined) out.prerequisites = e.prerequisites;
    if (e.features) out.features = e.features;
    if (e.addedAbilities) out.addedAbilities = e.addedAbilities;
    if (e.bonusFeatLevels) out.bonusFeatLevels = e.bonusFeatLevels;
    if (e.bonusFeatContract) out.bonusFeatContract = e.bonusFeatContract;
    if (e.bonusFeatContracts) out.bonusFeatContracts = e.bonusFeatContracts;
    if (e.spellcasting) out.spellcasting = e.spellcasting;
    if (e.spellcastingProgression) out.spellcastingProgression = e.spellcastingProgression;
    if (e.castingProgression) out.castingProgression = e.castingProgression;
    if (e.dualProgression) out.dualProgression = e.dualProgression;
    if (e.meldshaping) out.meldshaping = e.meldshaping;
    if (e.pactProgression) out.pactProgression = e.pactProgression;
    if (e.mysteryProgression) out.mysteryProgression = e.mysteryProgression;
    if (e.utteranceProgression) out.utteranceProgression = e.utteranceProgression;

    out.progression = e.progression && typeof e.progression === 'object'
      ? e.progression
      : {
          mode: isPrest ? 'prestige' : 'base',
          maxLevel: maxLvl,
          hitDie: `d${hdNum}`,
          bab: babCode,
          goodSaves,
          skillPointsPerLevel: skillPts,
          classSkills
        };
  } else if (bp === 'race') {
    const isTmpl = e.type === 'Template';
    const spd = typeof e.baseSpeed === 'number' ? e.baseSpeed : (parseInt(String(e.baseSpeed || '30'), 10) || 30);
    out.race = e.race && typeof e.race === 'object'
      ? e.race
      : {
          kind: isTmpl ? 'template' : 'race',
          timing: isTmpl ? (e.templateAcquisition || 'Inherited') : null,
          size: e.size || 'Medium',
          creatureType: e.creatureType || 'Humanoid',
          subtype: Array.isArray(e.subtypes) && e.subtypes.length ? e.subtypes.join(', ') : null,
          speed: spd,
          flySpeed: 0,
          flyManeuverability: null,
          levelAdjustment: Number(e.levelAdjustment ?? 0) || 0,
          favoredClass: e.favoredClass || 'Any',
          bonusFeatAt1st: Boolean((Array.isArray(e.bonusFeats) && e.bonusFeats.includes('Any')) || (typeof e.bonusFeats === 'number' && e.bonusFeats > 0)),
          humanBonusSkillPoints: Number(e.bonusSkillPointsPerLevel) > 0
        };
    // Preserve structural Race/Template fields read by Level-Up & Template engines
    if (e.size) out.size = e.size;
    if (e.baseSpeed !== undefined) out.baseSpeed = spd;
    if (e.levelAdjustment !== undefined) out.levelAdjustment = e.levelAdjustment;
    if (e.crIncrease !== undefined) out.crIncrease = e.crIncrease;
    if (e.creatureType) out.creatureType = e.creatureType;
    if (e.subtypes) out.subtypes = e.subtypes;
    if (e.favoredClass) out.favoredClass = e.favoredClass;
    if (e.languages) out.languages = e.languages;
    if (e.bonusLanguages) out.bonusLanguages = e.bonusLanguages;
    if (e.bonusFeats) out.bonusFeats = e.bonusFeats;
    if (e.bonusSkillPointsLevel1 !== undefined) out.bonusSkillPointsLevel1 = e.bonusSkillPointsLevel1;
    if (e.bonusSkillPointsPerLevel !== undefined) out.bonusSkillPointsPerLevel = e.bonusSkillPointsPerLevel;
    if (e.abilityModifiers) {
      out.abilityModifiers = e.abilityModifiers;
      // Also ensure abilityModifiers are in `effects[]` if not already from `modifiers[]`
      for (const [ab, delta] of Object.entries(e.abilityModifiers)) {
        const abClean = ab.toLowerCase().slice(0, 3);
        const val = Number(delta) || 0;
        if (val !== 0 && ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(abClean)) {
          if (!effects.some(b => b && b.type === 'stat' && Array.isArray(b.targets) && b.targets.includes(abClean))) {
            effects.push({ type: 'stat', targets: [abClean], mode: 'flat', value: val, btype: 'Racial' });
          }
        }
      }
    }
    if (e.traits) out.traits = e.traits;
    if (e.darkvision !== undefined) out.darkvision = e.darkvision;
    if (e.lowLightVision !== undefined) out.lowLightVision = e.lowLightVision;
    if (e.templateAcquisition) out.templateAcquisition = e.templateAcquisition;
    if (e.hitDieOverride) out.hitDieOverride = e.hitDieOverride;
    if (e.vision) out.vision = e.vision;
    if (e.immunities) out.immunities = e.immunities;
    if (e.resistances) out.resistances = e.resistances;
    if (e.specialAttacks) out.specialAttacks = e.specialAttacks;
    if (e.specialQualities) out.specialQualities = e.specialQualities;
    if (e.turnResistance !== undefined) out.turnResistance = e.turnResistance;
  } else if (bp === 'domain') {
    const gpText = typeof e.grantedPower === 'string'
      ? e.grantedPower
      : (e.grantedPower && e.grantedPower.description ? e.grantedPower.description : cleanText);
    const ladder = [];
    if (Array.isArray(e.spells)) {
      for (const sp of e.spells) {
        if (sp && sp.level) ladder.push({ level: Number(sp.level), spell: sp.name || sp.id, refId: sp.id || null });
      }
    }
    out.grants = {
      grantedPower: { name: `${e.name} Domain Power`, text: gpText, usage: { mode: 'passive' } },
      spellLadder: ladder
    };
    out.grantedPower = e.grantedPower;
    out.spells = e.spells || [];
    if (e.requiredAlignment) out.requiredAlignment = e.requiredAlignment;
  } else if (bp === 'buff') {
    out.buffKind = e.type === 'Condition' ? 'Condition' : (e.type === 'DamageType' ? 'Rule' : 'Buff');
    if (e.durationCategory) out.durationCategory = e.durationCategory;
    if (e.defaultCasterLevel !== undefined) out.defaultCasterLevel = e.defaultCasterLevel;
    if (e.isBludgeoning !== undefined) out.isBludgeoning = e.isBludgeoning;
    if (e.isPiercing !== undefined) out.isPiercing = e.isPiercing;
    if (e.isSlashing !== undefined) out.isSlashing = e.isSlashing;
    out.lifecycle = {
      usage: { mode: 'atwill' },
      duration: 'perm',
      durationText: e.durationCategory || 'Active while toggled',
      dismissible: true
    };
  }

  out.effects = effects;
  if (migratedModes && migratedModes.length > 0) out.modes = migratedModes;
  if (e.ruleFlags && typeof e.ruleFlags === 'object' && Object.keys(e.ruleFlags).length > 0) {
    out.ruleFlags = e.ruleFlags;
  }
  if (e.shortDescription) out.shortDescription = htmlToCleanText(e.shortDescription);
  if (cleanText) out.text = cleanText;
  if (Array.isArray(e.tags)) out.tags = e.tags;

  // Preserve all remaining domain, book provenance, and subsystem metadata keys (never deprecated V2 keys)
  const DEPRECATED_V2_KEYS = new Set([
    'schemaVersion', 'id', 'blueprint', 'name', 'type',
    'modifiers', 'damageParts', 'tempHpFormula',
    'description', 'desc', 'foundryId',
    'slot', 'bodySlot', 'effects', 'blocks', 'modes',
    'ruleFlags', 'shortDescription', 'text', 'tags', 'tacticalBadges'
  ]);
  for (const [k, v] of Object.entries(e)) {
    if (DEPRECATED_V2_KEYS.has(k) || k in out || v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue;
    out[k] = v;
  }

  return out;
}

// ----------------------------------------------------------------------------
// 4. Bestiary (`srd_monsters.json` `649` Monsters) -> Canonical V3 `monster`
// ----------------------------------------------------------------------------
const SIZE_AC_MOD = {
  Fine: 8, Diminutive: 4, Tiny: 2, Small: 1, Medium: 0,
  Large: -1, Huge: -2, Gargantuan: -4, Colossal: -8
};
const SIZE_GRAPPLE_MOD = {
  Fine: -16, Diminutive: -12, Tiny: -8, Small: -4, Medium: 0,
  Large: 4, Huge: 8, Gargantuan: 12, Colossal: 16
};
const SIZE_DEFAULT_SPACE_REACH = {
  Fine: { space: '1/2 ft.', reach: '0 ft.' },
  Diminutive: { space: '1 ft.', reach: '0 ft.' },
  Tiny: { space: '2-1/2 ft.', reach: '0 ft.' },
  Small: { space: '5 ft.', reach: '5 ft.' },
  Medium: { space: '5 ft.', reach: '5 ft.' },
  Large: { space: '10 ft.', reach: '10 ft.' },
  Huge: { space: '15 ft.', reach: '15 ft.' },
  Gargantuan: { space: '20 ft.', reach: '20 ft.' },
  Colossal: { space: '30 ft.', reach: '30 ft.' }
};

// Official Monster Manual p.303-305 Monster Feats (not all in player feat files)
const OFFICIAL_MONSTER_FEATS = new Set([
  'ability focus', 'awesome blow', 'craft construct', 'empower spell-like ability',
  'flyby attack', 'hover', 'improved multiattack', 'improved natural armor',
  'improved natural attack', 'multiattack', 'multiweapon fighting',
  'improved multiweapon fighting', 'greater multiweapon fighting',
  'quicken spell-like ability', 'snatch', 'wingover', 'virulent poison',
  'large and in charge', 'epic toughness', 'superior initiative', 'dire charge',
  'blinding speed', 'automatic quicken spell', 'automatic silent spell',
  'automatic still spell', 'perfect automatic still spell', 'tenacious magic',
  'multispell', 'spellcasting harrier', 'devastating critical', 'overwhelming critical',
  'epic weapon focus', 'epic weapon specialization', 'epic prowess', 'epic fortitude',
  'epic reflexes', 'epic will', 'armor skin', 'damage reduction', 'energy resistance',
  'fast healing', 'improved spell resistance', 'penetrate damage reduction'
]);

const DRAGON_BREATH_MAP = {
  black: { shape: 'Line', energy: 'Acid', save: 'Ref' },
  blue: { shape: 'Line', energy: 'Electricity', save: 'Ref' },
  green: { shape: 'Cone', energy: 'Acid', save: 'Ref' },
  red: { shape: 'Cone', energy: 'Fire', save: 'Ref' },
  white: { shape: 'Cone', energy: 'Cold', save: 'Ref' },
  brass: { shape: 'Line', energy: 'Fire', save: 'Ref' },
  bronze: { shape: 'Line', energy: 'Electricity', save: 'Ref' },
  copper: { shape: 'Line', energy: 'Acid', save: 'Ref' },
  gold: { shape: 'Cone', energy: 'Fire', save: 'Ref' },
  silver: { shape: 'Cone', energy: 'Cold', save: 'Ref' }
};

function buildKnownFeatSet() {
  const set = new Set(OFFICIAL_MONSTER_FEATS);
  for (const fn of ['srd_feats.json', 'srd_feats_splat.json', 'srd_feats_epic.json', 'srd_feats_legacy.json']) {
    const p = path.join(SRC_DIR, fn);
    if (!fs.existsSync(p)) continue;
    const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const f of arr) {
      if (f && f.name) {
        const clean = String(f.name)
          .replace(/\s*\([^)]*\)\s*$/g, '')
          .replace(/\s*\[[^\]]*\]\s*$/g, '')
          .trim()
          .toLowerCase();
        if (clean) set.add(clean);
        set.add(String(f.name).trim().toLowerCase());
      }
    }
  }
  return set;
}

function isRealFeatName(rawFeatName, knownFeatSet) {
  const s = String(rawFeatName || '').trim();
  if (!s || /^custom ability$/i.test(s)) return false;
  const base = s
    .replace(/ᴮ|\s*\[B\]\s*$/gi, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .trim()
    .toLowerCase();
  if (!base) return false;
  // Known non-feat monster traits that collide or look generic
  if ([
    'keen senses', 'spell-like abilities', 'psi-like abilities', 'spells', 'improved grab',
    'poison', 'alternate form', 'water breathing', 'pounce', 'breath weapon', 'trip',
    'swallow whole', 'web', 'create spawn', 'blur', 'earth glide', 'locate object',
    'sound imitation', 'ferocity', 'ink cloud', 'change shape', 'scent', 'constrict',
    'rake', 'rend', 'trample', 'frightful presence', 'immunities', 'immunity to magic',
    'magic immunity', 'undead traits', 'construct traits', 'plant traits', 'ooze traits',
    'vermin traits', 'elemental traits', 'swarm traits', 'incorporeal', 'amorphous',
    'amphibious', 'freeze', 'jet', 'mimic shape', 'adhesive', 'acid', 'engulf', 'paralysis',
    'transparent', 'split', 'stench', 'gaze', 'petrification', 'blood drain', 'energy drain',
    'disease', 'curse of lycanthropy', 'summon demon', 'summon tanar\'ri', 'summon baatezu',
    'summon mephit', 'single actions only', 'abomination traits', 'air mastery', 'water mastery',
    'earth mastery', 'fire subtype', 'cold subtype', 'whirlwind', 'burn', 'spider climb',
    'cloudwalking', 'icewalking', 'create/destroy water', 'wolf empathy', 'slow'
  ].includes(base)) {
    return false;
  }
  if (/^(?:telepathy|tremorsense|blindsight|blindsense|darkvision|low-light vision|regeneration|fast healing|damage reduction|spell resistance|turn resistance)\b/i.test(base)) {
    return false;
  }
  return knownFeatSet.has(base) || knownFeatSet.has(s.toLowerCase());
}

function parseDragonAgeRow(descHtml, monsterName) {
  // Match e.g. "Green Dragon, Wyrmling" or "Young Adult Red Dragon"
  const ageList = [
    'Great wyrm', 'Wyrm', 'Ancient', 'Very old', 'Old', 'Mature adult',
    'Adult', 'Young adult', 'Juvenile', 'Young', 'Very young', 'Wyrmling'
  ];
  let matchedAge = null;
  for (const a of ageList) {
    if (new RegExp(`\\b${a}\\b`, 'i').test(monsterName)) {
      matchedAge = a;
      break;
    }
  }
  let matchedColor = null;
  for (const c of Object.keys(DRAGON_BREATH_MAP)) {
    if (new RegExp(`\\b${c}\\s+dragon\\b|\\bdragon,\\s*${c}\\b`, 'i').test(monsterName)) {
      matchedColor = c;
      break;
    }
  }
  if (!matchedAge || !matchedColor || !descHtml) return null;

  const ageRankOrder = [
    'Wyrmling', 'Very young', 'Young', 'Juvenile', 'Young adult', 'Adult',
    'Mature adult', 'Old', 'Very old', 'Ancient', 'Wyrm', 'Great wyrm'
  ];
  const ageRank = ageRankOrder.findIndex(a => a.toLowerCase() === matchedAge.toLowerCase()) + 1;
  const out = { age: matchedAge, ageRank: ageRank || 1, color: matchedColor, ...DRAGON_BREATH_MAP[matchedColor] };
  // Parse breath weapon dice + DC from age table row: `<td>Wyrmling<br/></td>...<td>2d6 (13)<br/></td><td>-<br/></td>`
  const rowRe = new RegExp(`<tr[^>]*>\\s*<td>\\s*${matchedAge}\\b[\\s\\S]*?<\\/tr>`, 'i');
  const rowM = descHtml.match(rowRe);
  if (rowM) {
    const cells = [...rowM[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x => htmlToCleanText(x[1]));
    // Last two cells are Breath Weapon (DC) and Frightful Presence DC
    if (cells.length >= 15) {
      const bwCell = cells[cells.length - 2] || '';
      const fpCell = cells[cells.length - 1] || '';
      const bwM = bwCell.match(/(\d+d\d+)\s*\((\d+)\)/i);
      if (bwM) {
        out.breathDice = bwM[1];
        out.breathDc = Number(bwM[2]);
      }
      const fpNum = parseInt(fpCell, 10);
      if (Number.isFinite(fpNum) && fpNum > 0) out.frightfulPresenceDc = fpNum;
    }
  }

  // Cumulative scan across second dragon table (`Wyrmling` .. `matchedAge`) for DR + current row SR / CL / Natural Armor
  for (let rIdx = 0; rIdx < (ageRank || 1); rIdx++) {
    const aName = ageRankOrder[rIdx];
    const rAll = [...descHtml.matchAll(new RegExp(`<tr[^>]*>\\s*<td>\\s*${aName}\\b[\\s\\S]*?<\\/tr>`, 'gi'))];
    if (rAll.length >= 2) {
      const c2 = [...rAll[1][0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x => htmlToCleanText(x[1]));
      if (c2.length >= 6) {
        const saTxt = c2[c2.length - 3] || '';
        const drM = saTxt.match(/(?:DR|Damage\s+reduction)\s*(\d+\/[a-zA-Z-]+)/i);
        if (drM) out.dr = drM[1];
        if (rIdx === (ageRank - 1)) {
          const srN = parseInt(c2[c2.length - 1], 10);
          if (Number.isFinite(srN) && srN > 0) out.sr = srN;
          const clN = parseInt(c2[c2.length - 2], 10);
          if (Number.isFinite(clN) && clN > 0) out.casterLevel = clN;
          const natM = (c2[c2.length - 4] || '').match(/\+(\d+)\s*natural/i);
          if (natM) out.naturalArmor = Number(natM[1]);
        }
      }
    }
  }

  // Parse Level Adjustment for this age: `Wyrmling +5;`
  const laSec = descHtml.match(/<b>Level Adjustment:?<\/b>\s*([^<]+)/i);
  if (laSec) {
    const ageLa = laSec[1].match(new RegExp(`${matchedAge}\\s*\\+(\\d+)`, 'i'));
    if (ageLa) out.levelAdjustment = Number(ageLa[1]);
  }

  return out;
}

function extractHtmlTopicAbilities(descHtml) {
  if (!descHtml) return { abilities: [], env: null, la: null, subtypes: [], space: null, reach: null };
  const abilities = [];
  let env = null;
  let la = null;
  const subtypes = [];
  let space = null;
  let reach = null;

  const envM = descHtml.match(/<b>Environment:?<\/b>\s*([^<\n]+)/i);
  if (envM) env = decodeHtmlEntities(envM[1]).trim();

  const laM = descHtml.match(/<b>Level Adjustment:?<\/b>\s*\+(\d+)\b/i);
  if (laM) la = Number(laM[1]);

  // Subtypes like `<p><b>Dragon (Air)</b></p>` or `(Evil, Extraplanar, Tanar'ri)`
  const subTypeBlock = descHtml.match(/<b>(?:Dragon|Outsider|Elemental|Humanoid|Monstrous Humanoid|Giant|Aberration|Magical Beast|Fey|Undead|Construct|Plant|Ooze|Vermin)\s*\(([^)]+)\)<\/b>/i);
  if (subTypeBlock) {
    subTypeBlock[1].split(/[,;]/).map(s => s.trim()).filter(Boolean).forEach(st => {
      if (!subtypes.includes(st)) subtypes.push(st);
    });
  }

  const spReachM = descHtml.match(/<b>Space\/Reach:?<\/b>\s*([^/<]+)\/\s*([^<\n]+)/i);
  if (spReachM) {
    space = decodeHtmlEntities(spReachM[1]).trim();
    reach = decodeHtmlEntities(spReachM[2]).trim();
  }

  // Extract `<p><b>Name (Ex|Su|Sp):</b> Description...</p>` blocks (including italicized `<b><i>Locate Object</i> (Sp):</b>`)
  const normHtml = descHtml.replace(/<b>([\s\S]*?)<\/b>/gi, (_, inner) => `<b>${inner.replace(/<\/?(?:i|em)>/gi, '')}</b>`);
  const pMatches = [...normHtml.matchAll(/<p[^>]*>\s*<b>([^<]{2,80}?)\s*(?:\((Ex|Su|Sp)\))?\s*:?<\/b>\s*([\s\S]*?)<\/p>/gi)];
  const metaSkip = /^(?:environment|organization|challenge ratings?|treasure|alignment|advancement|level adjustment|combat|skills|feats|possessions|carrying capacity|tactics|round-by-round|size and type|hit dice|speed|armor class|attack|full attack|damage|special attacks|special qualities|saves|abilities|climate\/terrain)$/i;
  for (const pm of pMatches) {
    const rawTitle = decodeHtmlEntities(pm[1]).replace(/:$/, '').trim();
    const abType = pm[2] ? pm[2] : (/spell-like|psi-like/i.test(rawTitle) ? 'Sp' : 'Ex');
    if (!rawTitle || metaSkip.test(rawTitle)) continue;
    // Only capture combat/trait entries that either have `(Ex|Su|Sp)` OR are Spell-Like Abilities / Spells / Immunities / Resistances / Senses
    if (!pm[2] && !/^(?:(?:other\s+)?spell-like abilities|(?:other\s+)?psi-like abilities|immunities|resistances|damage reduction|spell resistance|regeneration|fast healing|breath weapon|poison|pounce|improved grab|constrict|rake|rend|trample|frightful presence|blindsight|blindsense|tremorsense|scent)$/i.test(rawTitle)) {
      continue;
    }
    const cleanBody = htmlToCleanText(pm[3]);
    if (!cleanBody) continue;
    if (!abilities.some(a => a.name.toLowerCase() === rawTitle.toLowerCase())) {
      abilities.push({
        name: rawTitle,
        type: abType,
        description: cleanBody
      });
    }
  }

  return { abilities, env, la, subtypes, space, reach };
}

function dragonAgeRankFromLabel(str) {
  const s = String(str || '').toLowerCase();
  const map = [
    ['great wyrm', 12], ['very old', 9], ['young adult', 5], ['mature adult', 7], ['very young', 2],
    ['wyrmling', 1], ['wyrm', 11], ['ancient', 10], ['old', 8], ['adult', 6], ['juvenile', 4], ['young', 3]
  ];
  for (const [k, r] of map) {
    if (new RegExp(`\\b${k}\\b`, 'i').test(s)) return r;
  }
  return null;
}

function parseSpellLikePowersFromText(slaDesc, dragonInfo = null) {
  if (!slaDesc) return { powers: [], cl: null };
  const powers = [];
  const clM = slaDesc.match(/caster level\s+(\d+)(?:st|nd|rd|th)?/i);
  const cl = clM ? Number(clM[1]) : (dragonInfo && dragonInfo.casterLevel ? dragonInfo.casterLevel : null);

  // Match frequency segments: `At will-aid, blur (DC 14); 3/day-fireball (DC 16), haste; 1/day-wish.` (ignore `;` or `.` inside parentheses)
  const freqRe = /(At will|Constant|\d+\/(?:day|week|month|round))\s*[-—–:]\s*((?:[^;.(]|\([^)]*\))+)/gi;
  let m;
  while ((m = freqRe.exec(slaDesc)) !== null) {
    const freqRaw = m[1].trim();
    const listStr = m[2].trim();
    const isAtWill = /^(?:at will|constant)$/i.test(freqRaw);
    const usesNum = isAtWill ? 0 : (parseInt(freqRaw, 10) || 1);
    const items = listStr.split(/,\s*(?![^()]*\))/).map(s => s.trim()).filter(Boolean);
    for (const item of items) {
      // If Dragon age-gated `(old or older)` / `(great wyrm)`, skip if younger than required age!
      if (dragonInfo && dragonInfo.ageRank) {
        const parenM = item.match(/\(([^)]+)\)/g) || [];
        let ageBlocked = false;
        for (const p of parenM) {
          const reqRank = dragonAgeRankFromLabel(p);
          if (reqRank !== null && dragonInfo.ageRank < reqRank) {
            ageBlocked = true;
            break;
          }
        }
        if (ageBlocked) continue;
      }
      const dcM = item.match(/\(DC\s*(\d+)\)/i);
      const cleanSpellName = item
        .replace(/\(DC\s*\d+\)/gi, '')
        .replace(/\([^)]*\)/g, m0 => (/protection|circle|bull|bear|cat|eagle|fox|owl|summon|detect|dispel|fog|wall|cure|inflict|polymorph/i.test(item) && dragonAgeRankFromLabel(m0) === null ? m0 : ''))
        .trim();
      if (!cleanSpellName || cleanSpellName.length > 60) continue;
      const pObj = {
        kind: 'inline',
        name: cleanSpellName.charAt(0).toUpperCase() + cleanSpellName.slice(1),
        action: 'Standard',
        usage: isAtWill ? { mode: 'atwill' } : { mode: 'perDay', uses: usesNum }
      };
      if (cl) pObj.casterLevel = cl;
      if (dcM) pObj.saveDC = Number(dcM[1]);
      powers.push(pObj);
    }
  }
  return { powers, cl };
}

function migrateMonsterEntry(raw, knownFeatSet) {
  const m = JSON.parse(JSON.stringify(raw));
  const descHtml = m.description || '';

  // 1. Parse Category -> `creatureType` & `subtypes[]`
  let rawCat = String(m.category || 'Monstrous Humanoid').replace(/\*$/, '').trim();
  const catSubMatch = rawCat.match(/^([^(]+)\s*\(([^)]+)\)$/);
  let creatureType = catSubMatch ? catSubMatch[1].trim() : rawCat;
  const subtypes = catSubMatch
    ? catSubMatch[2].split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : [];

  const topicInfo = extractHtmlTopicAbilities(descHtml);
  for (const st of topicInfo.subtypes) {
    if (!subtypes.includes(st)) subtypes.push(st);
  }
  const dragonInfo = creatureType === 'Dragon' ? parseDragonAgeRow(descHtml, m.name) : null;

  // 2. Hit Dice parsing (`"6d8+24"` or `"21d12+3"` or `"1/2d8"`)
  const hdRaw = String(m.hitDice || '1d8').trim();
  const hdFracMatch = hdRaw.match(/^1\/(\d+)d(\d+)([+-]\d+)?$/i);
  const hdStdMatch = hdRaw.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  let hdCount = 1, hdDie = 8, hdBonus = 0;
  if (hdFracMatch) {
    hdCount = 1 / (Number(hdFracMatch[1]) || 2);
    hdDie = Number(hdFracMatch[2]) || 8;
    hdBonus = Number(hdFracMatch[3] || 0) || 0;
  } else if (hdStdMatch) {
    hdCount = Number(hdStdMatch[1]) || 1;
    hdDie = Number(hdStdMatch[2]) || 8;
    hdBonus = Number(hdStdMatch[3] || 0) || 0;
  }
  const avgHp = Number(m.hp) || Math.max(1, Math.floor(hdCount * ((hdDie + 1) / 2) + hdBonus));

  // 3. Abilities & Nonabilities (`Undead` & `Construct` -> `con` nonability; mindless `Vermin`/`Ooze`/`Construct`/`Undead` with `int: 0` -> `int` nonability)
  const rawAb = m.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const nonabilities = [];
  const cTypeLow = creatureType.toLowerCase();
  if (rawAb.con === 0 || rawAb.con === null || cTypeLow === 'undead' || cTypeLow === 'construct') {
    nonabilities.push('con');
  }
  for (const ab of ['str', 'dex', 'int', 'wis', 'cha']) {
    if ((rawAb[ab] === 0 || rawAb[ab] === null) && !nonabilities.includes(ab)) {
      nonabilities.push(ab);
    }
  }
  const abilities = {
    str: nonabilities.includes('str') ? null : (Number(rawAb.str) || 10),
    dex: nonabilities.includes('dex') ? null : (Number(rawAb.dex) || 10),
    con: nonabilities.includes('con') ? null : (Number(rawAb.con) || 10),
    int: nonabilities.includes('int') ? null : (Number(rawAb.int) || 10),
    wis: nonabilities.includes('wis') ? null : (Number(rawAb.wis) || 10),
    cha: nonabilities.includes('cha') ? null : (Number(rawAb.cha) || 10)
  };

  // 4. Size, Space, Reach, Speeds & AC Breakdown (`Total - Touch = Armor + Shield + Natural`)
  const size = m.size || 'Medium';
  const sizeMod = SIZE_AC_MOD[size] !== undefined ? SIZE_AC_MOD[size] : 0;
  // MM p.312: A creature with no Dexterity score (`dex: null`) takes a -5 penalty to Initiative and AC instead of a Dex modifier
  const dexMod = abilities.dex === null ? -5 : Math.floor(((abilities.dex ?? 10) - 10) / 2);
  const strMod = abilities.str === null ? Math.max(0, dexMod) : Math.floor(((abilities.str ?? 10) - 10) / 2);

  const acTotal = Number(m.ac?.total ?? m.ac ?? 10);
  const acTouch = Number(m.ac?.touch ?? 10);
  const acFlat = Number(m.ac?.flatFooted ?? acTotal);
  const armorBonus = Number(m.armorBonus ?? 0) || 0;
  const shieldBonus = Number(m.shieldBonus ?? 0) || 0;
  // Exact D&D 3.5e RAW theorem: `acTotal - acTouch === armorBonus + shieldBonus + naturalArmor`
  const computedNat = Math.max(0, acTotal - acTouch - armorBonus - shieldBonus);
  const naturalArmor = typeof m.naturalArmor === 'number'
    ? m.naturalArmor
    : (dragonInfo && typeof dragonInfo.naturalArmor === 'number' ? dragonInfo.naturalArmor : computedNat);
  const deflection = typeof m.deflection === 'number'
    ? m.deflection
    : Math.max(0, acTouch - (10 + sizeMod + dexMod));

  const spdIn = m.speed || {};
  let flyMan = null;
  if (Number(spdIn.fly) > 0) {
    const manM = descHtml.match(/fly\s+\d+\s*ft\.\s*\((perfect|good|average|poor|clumsy)\)/i);
    flyMan = manM ? (manM[1].charAt(0).toUpperCase() + manM[1].slice(1).toLowerCase())
      : (cTypeLow === 'dragon' ? (size === 'Small' || size === 'Medium' ? 'Average' : (size === 'Colossal' || size === 'Gargantuan' ? 'Clumsy' : 'Poor')) : 'Average');
  }
  const speeds = {
    land: Number(spdIn.land ?? 30) || 0,
    fly: Number(spdIn.fly ?? 0) || 0,
    flyManeuverability: flyMan,
    swim: Number(spdIn.swim ?? 0) || 0,
    climb: Number(spdIn.climb ?? 0) || 0,
    burrow: Number(spdIn.burrow ?? 0) || 0
  };

  const defSpReach = SIZE_DEFAULT_SPACE_REACH[size] || { space: '5 ft.', reach: '5 ft.' };
  const space = topicInfo.space || defSpReach.space;
  const reach = topicInfo.reach || defSpReach.reach;

  // CR & Level Adjustment
  const crStr = String(m.cr ?? '1');
  const crNumeric = m.crNumeric !== undefined
    ? Number(m.crNumeric)
    : (crStr.includes('/') ? (Number(crStr.split('/')[0]) / Number(crStr.split('/')[1])) : (parseFloat(crStr) || 1));
  const levelAdjustment = dragonInfo && dragonInfo.levelAdjustment !== undefined
    ? dragonInfo.levelAdjustment
    : (topicInfo.la !== null ? topicInfo.la : null);

  // BAB & Grapple
  const bab = m.bab !== undefined ? Number(m.bab) : Math.floor(hdCount * 0.75);
  const grapple = m.grapple !== undefined
    ? Number(m.grapple)
    : (bab + strMod + (SIZE_GRAPPLE_MOD[size] || 0));

  // 5. Separate REAL D&D 3.5e Feats from Trait/Special-Ability names in `m.feats[]`
  const realFeats = [];
  const displacedTraitNames = [];
  const seenFeatLower = new Set();
  for (const fRaw of (m.feats || [])) {
    const fName = typeof fRaw === 'string' ? fRaw.trim() : String(fRaw?.name || '').trim();
    if (!fName || /^custom ability$/i.test(fName)) continue;
    if (isRealFeatName(fName, knownFeatSet)) {
      const k = fName.toLowerCase();
      if (!seenFeatLower.has(k)) {
        seenFeatLower.add(k);
        realFeats.push(fName);
      }
    } else {
      displacedTraitNames.push(fName);
    }
  }

  // 6. Merge `specialAbilities[]` (`m.specialAbilities` + `<div topic=...>` + displaced traits)
  const specialAbilities = [];
  const addSa = (sa) => {
    if (!sa || !sa.name) return;
    const cleanN = String(sa.name).trim();
    if (!cleanN || /^custom ability$/i.test(cleanN)) return;
    if (specialAbilities.some(x => x.name.toLowerCase() === cleanN.toLowerCase())) return;
    specialAbilities.push({
      name: cleanN,
      type: sa.type || 'Ex',
      description: htmlToCleanText(sa.description || cleanN)
    });
  };
  for (const sa of (m.specialAbilities || [])) addSa(sa);
  for (const sa of topicInfo.abilities) addSa(sa);
  for (const trName of displacedTraitNames) {
    if (/^spell-like abilities$|^spells$|^psi-like abilities$/i.test(trName)) continue;
    if (!specialAbilities.some(x => x.name.toLowerCase().startsWith(trName.toLowerCase()))) {
      addSa({ name: trName, type: 'Ex', description: trName });
    }
  }

  // 7. Build V3 `effects[]` (Defenses: DR, SR, Immunities, Resistances, Fast Healing, Regeneration, Senses, Breath Weapon)
  const effects = [];
  const fullCorpusText = [
    ...specialAbilities.map(s => `${s.name}: ${s.description}`),
    ...displacedTraitNames,
    htmlToCleanText(descHtml, { stripTables: true })
  ].join('\n');

  // Senses
  const addSense = (label) => {
    if (!effects.some(b => b.type === 'defense' && b.mode === 'Sense / Movement' && b.what.toLowerCase() === label.toLowerCase())) {
      effects.push({ type: 'defense', mode: 'Sense / Movement', what: label });
    }
  };
  const dvMatch = fullCorpusText.match(/\bdarkvision\s+(\d+)\s*ft/i);
  if (dvMatch) addSense(`Darkvision ${dvMatch[1]} ft.`);
  else if (['dragon', 'undead', 'construct', 'outsider', 'aberration', 'elemental', 'magical beast', 'monstrous humanoid', 'vermin', 'giant'].includes(cTypeLow)) {
    addSense('Darkvision 60 ft.');
  }
  if (/low-light vision|keen senses/i.test(fullCorpusText) || ['animal', 'dragon', 'fey', 'magical beast', 'plant', 'giant'].includes(cTypeLow)) {
    addSense('Low-Light Vision');
  }
  const bsMatch = fullCorpusText.match(/\bblindsight\s+(\d+)\s*ft/i);
  if (bsMatch) addSense(`Blindsight ${bsMatch[1]} ft.`);
  const bsenMatch = fullCorpusText.match(/\bblindsense\s+(\d+)\s*ft/i);
  if (bsenMatch) addSense(`Blindsense ${bsenMatch[1]} ft.`);
  else if (cTypeLow === 'dragon') addSense('Blindsense 60 ft.');
  const tremMatch = fullCorpusText.match(/\btremorsense\s+(\d+)\s*ft/i);
  if (tremMatch) addSense(`Tremorsense ${tremMatch[1]} ft.`);
  if (/\bscent\b/i.test(fullCorpusText)) addSense('Scent');

  // DR
  let drVal = null, drByp = null;
  if (dragonInfo && dragonInfo.dr) {
    const dm = dragonInfo.dr.match(/^(\d+)\/(.+)$/);
    if (dm) { drVal = Number(dm[1]); drByp = dm[2]; }
  }
  if (drVal === null) {
    const drM = fullCorpusText.match(/\bdamage reduction\s+(\d+)\s*\/\s*([a-zA-Z0-9\s,-]+?)(?:[:.;,\n)]|$)/i)
      || fullCorpusText.match(/\bDR\s+(\d+)\s*\/\s*([a-zA-Z0-9-]+)\b/);
    if (drM) {
      drVal = Number(drM[1]);
      drByp = drM[2].trim();
    } else if (/^iron golem$/i.test(m.name)) {
      drVal = 15; drByp = 'adamantine';
    } else if (/^(?:greater )?stone golem$/i.test(m.name)) {
      drVal = 10; drByp = 'adamantine';
    } else if (/^clay golem$/i.test(m.name)) {
      drVal = 10; drByp = 'adamantine and bludgeoning';
    } else if (/^flesh golem$/i.test(m.name)) {
      drVal = 5; drByp = 'adamantine';
    } else if (/skeleton/i.test(m.name) && cTypeLow === 'undead') {
      drVal = 5; drByp = 'bludgeoning';
    } else if (/zombie/i.test(m.name) && cTypeLow === 'undead') {
      drVal = 5; drByp = 'slashing';
    }
  }
  if (drVal !== null && drVal > 0) {
    effects.push({ type: 'defense', mode: 'DR', value: drVal, what: drByp || '-' });
  }

  // SR
  let srVal = dragonInfo && dragonInfo.sr ? dragonInfo.sr : null;
  if (srVal === null) {
    const srM = fullCorpusText.match(/\b(?:spell resistance|SR)\s+(\d+)\b/i);
    if (srM) srVal = Number(srM[1]);
  }
  if (srVal !== null && srVal > 0) {
    effects.push({ type: 'defense', mode: 'Spell Resistance', srMode: 'flat', value: srVal });
  }

  // Fast Healing & Regeneration
  const fhM = fullCorpusText.match(/\bfast healing\s+(\d+)\b/i);
  if (fhM) {
    effects.push({ type: 'roll', kind: 'Fast Healing', count: Number(fhM[1]), die: 'flat' });
  }
  const regM = fullCorpusText.match(/\bregeneration\s+(\d+)\b/i);
  if (regM) {
    effects.push({ type: 'defense', defType: 'regeneration', value: Number(regM[1]) });
  }

  // Energy Resistances (`resistance to acid 10, cold 10, fire 10` or `fire resistance 10`)
  for (const elem of ['acid', 'cold', 'electricity', 'fire', 'sonic']) {
    const r1 = fullCorpusText.match(new RegExp(`\\b${elem}\\s+(?:resistance\\s+)?(\\d+)\\b`, 'i'));
    const r2 = fullCorpusText.match(new RegExp(`resistance\\s+to[^.;\\n]*?\\b${elem}\\s+(\\d+)\\b`, 'i'));
    const rVal = r2 ? Number(r2[1]) : (r1 && /resistance/i.test(fullCorpusText) ? Number(r1[1]) : 0);
    if (rVal > 0) {
      effects.push({
        type: 'defense',
        mode: 'Energy Resistance',
        what: elem.charAt(0).toUpperCase() + elem.slice(1),
        value: rVal
      });
    }
  }

  // Immunities (Dragon subtype immunities, Undead/Construct/Elemental/Plant/Ooze/Vermin traits, explicit `immune to ...`)
  const addImm = (what) => {
    if (!effects.some(b => b.type === 'defense' && b.mode === 'Immunity' && b.what.toLowerCase() === what.toLowerCase())) {
      effects.push({ type: 'defense', mode: 'Immunity', what });
    }
  };
  if (cTypeLow === 'dragon') {
    addImm('Sleep');
    addImm('Paralysis');
    if (dragonInfo && dragonInfo.energy) addImm(dragonInfo.energy);
  }
  if (cTypeLow === 'undead') {
    addImm('Mind-Affecting');
    addImm('Poison');
    addImm('Sleep');
    addImm('Paralysis');
    addImm('Stunning');
    addImm('Disease');
    addImm('Critical Hits');
  } else if (cTypeLow === 'construct') {
    addImm('Mind-Affecting');
    addImm('Poison');
    addImm('Sleep');
    addImm('Paralysis');
    addImm('Stunning');
    addImm('Disease');
    addImm('Critical Hits');
    if (/immunity to magic|magic immunity/i.test(fullCorpusText)) addImm('Magic (SR Infinite)');
  }
  for (const elem of ['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic', 'Poison', 'Petrification', 'Electricity']) {
    if (new RegExp(`immun(?:e|ity)\\s+to\\s+[^.;\\n]*\\b${elem}\\b`, 'i').test(fullCorpusText)) {
      addImm(elem);
    }
  }

  // Breath Weapon -> V3 `roll` block + structured specialAttack if Dragon or Breath Weapon creature
  if (dragonInfo && dragonInfo.breathDice) {
    const bwCountM = dragonInfo.breathDice.match(/^(\d+)(d\d+)$/i);
    effects.push({
      type: 'roll',
      kind: 'Damage',
      count: bwCountM ? Number(bwCountM[1]) : 2,
      die: bwCountM ? bwCountM[2].toLowerCase() : 'd6',
      dmgType: dragonInfo.energy,
      scaling: 'flat',
      crit: 'normal',
      save: `${dragonInfo.save} DC ${dragonInfo.breathDc} half`,
      dc: dragonInfo.breathDc,
      source: `Breath Weapon (${dragonInfo.shape})`
    });
    if (!specialAbilities.some(s => /breath weapon/i.test(s.name))) {
      specialAbilities.unshift({
        name: `Breath Weapon (${dragonInfo.shape} of ${dragonInfo.energy})`,
        type: 'Su',
        description: `${dragonInfo.breathDice} ${dragonInfo.energy.toLowerCase()} damage (Reflex DC ${dragonInfo.breathDc} half), usable once every 1d4 rounds.`
      });
    }
  } else {
    const bwSa = specialAbilities.find(s => /^breath weapon/i.test(s.name));
    if (bwSa) {
      const dm = bwSa.description.match(/(\d+)(d\d+)\s+(?:points?\s+of\s+)?(fire|cold|acid|electricity|sonic)/i);
      const dcM = bwSa.description.match(/DC\s*(\d+)/i);
      if (dm) {
        effects.push({
          type: 'roll',
          kind: 'Damage',
          count: Number(dm[1]),
          die: dm[2].toLowerCase(),
          dmgType: dm[3].charAt(0).toUpperCase() + dm[3].slice(1).toLowerCase(),
          scaling: 'flat',
          crit: 'normal',
          save: dcM ? `Ref DC ${dcM[1]} half` : 'Ref half',
          dc: dcM ? Number(dcM[1]) : undefined,
          source: 'Breath Weapon'
        });
      }
    }
  }

  // 8. Structured `attacks[]` (clean `${...}` Foundry garbage if any, preserve exact bonus & damageParts)
  const attacks = (m.attacks || []).map((atk) => {
    const dpIn = (Array.isArray(atk.damageParts) && atk.damageParts[0]) || {};
    let dice = String(dpIn.dice || '1d6').trim();
    if (dice.includes('${') || dice === '0') dice = '1d6';
    const bonus = Number(dpIn.bonus ?? 0) || 0;
    const dmgType = dpIn.type && dpIn.type !== 'Untyped' ? dpIn.type : 'Physical';
    return {
      name: atk.name || 'Natural Attack',
      attackType: atk.attackType || 'natural',
      actionType: atk.actionType || 'mwak',
      attackBonus: Number(atk.attackBonus ?? atk.bonus ?? bab) || 0,
      critRange: Number(atk.critRange ?? 20) || 20,
      critMult: Number(atk.critMult ?? 2) || 2,
      damageParts: (Array.isArray(atk.damageParts) && atk.damageParts.length > 0)
        ? atk.damageParts.map((p, idx) => ({
            dice: (p.dice && !String(p.dice).includes('${') && p.dice !== '0') ? p.dice : dice,
            bonus: Number(p.bonus ?? (idx === 0 ? bonus : 0)) || 0,
            type: p.type && p.type !== 'Untyped' ? p.type : dmgType,
            multiplyOnCrit: idx === 0,
            onCritOnly: Boolean(p.onCritOnly),
            source: p.source || atk.name || 'Natural'
          }))
        : [{ dice, bonus, type: dmgType, multiplyOnCrit: true, onCritOnly: false, source: atk.name || 'Natural' }]
    };
  });

  // 9. Spell-Like Abilities -> V3 `powers[]` (and preserve `spells[]` if present)
  const powers = [];
  const allSlaCandidates = [...specialAbilities, ...topicInfo.abilities];
  for (const sa of allSlaCandidates) {
    if (/^(?:other\s+)?(?:spell-like|psi-like) abilities/i.test(sa.name)) {
      const parsed = parseSpellLikePowersFromText(sa.description, dragonInfo);
      for (const p of parsed.powers) {
        if (!powers.some(x => x.name.toLowerCase() === p.name.toLowerCase())) powers.push(p);
      }
    } else if (sa.type === 'Sp') {
      // Named `(Sp)` ability (e.g. `Locate Object (Sp)`, `Corrupt Water (Sp)`, `Speak with Animals (Sp)`)
      let ageBlocked = false;
      if (dragonInfo && dragonInfo.ageRank) {
        const reqRank = dragonAgeRankFromLabel(sa.description);
        if (reqRank !== null && /or older/i.test(sa.description) && dragonInfo.ageRank < reqRank) {
          ageBlocked = true;
        }
      }
      if (!ageBlocked && !powers.some(x => x.name.toLowerCase() === sa.name.toLowerCase())) {
        const perAge = /once per day per age category/i.test(sa.description) && dragonInfo && dragonInfo.ageRank;
        const atWill = /\bat will\b/i.test(sa.description);
        const timesDayM = sa.description.match(/\b(\d+)\/day\b|\bonce per day\b|\btwice per day\b|\bthree times per day\b/i);
        const uses = perAge ? dragonInfo.ageRank
          : (timesDayM ? (timesDayM[1] ? Number(timesDayM[1]) : (/twice/i.test(timesDayM[0]) ? 2 : (/three/i.test(timesDayM[0]) ? 3 : 1))) : 1);
        const pObj = {
          kind: 'inline',
          name: sa.name,
          action: 'Standard',
          usage: atWill ? { mode: 'atwill' } : { mode: 'perDay', uses }
        };
        if (dragonInfo && dragonInfo.casterLevel) pObj.casterLevel = dragonInfo.casterLevel;
        powers.push(pObj);
      }
    }
  }
  if (powers.length === 0 && Array.isArray(m.spells) && m.spells.length > 0) {
    for (const sp of m.spells) {
      const dcM = String(sp.savingThrow || '').match(/DC\s*(\d+)/i);
      powers.push({
        kind: 'inline',
        name: sp.name,
        action: 'Standard',
        usage: { mode: 'atwill' },
        saveDC: dcM ? Number(dcM[1]) : undefined,
        text: sp.description || ''
      });
    }
  }

  // 10. Clean readable `text` (strip bloated 17-column Dragon age HTML tables!)
  const cleanText = htmlToCleanText(descHtml, { stripTables: true });
  const envClean = (m.environment && m.environment !== 'Any')
    ? m.environment
    : (topicInfo.env || m.environment || 'Any');

  // Canonical V3 `monster` object
  const out = {
    schemaVersion: 3,
    id: m.id,
    blueprint: 'monster',
    name: m.name,
    type: 'Monster',
    category: creatureType,
    source: m.source || 'SRD 3.5e / Monster Manual',
    monster: {
      size,
      creatureType,
      subtypes,
      alignment: m.alignment || 'Neutral',
      environment: envClean,
      cr: m.cr,
      crNumeric,
      levelAdjustment,
      hitDice: {
        count: hdCount,
        die: `d${hdDie}`,
        bonusHp: hdBonus,
        avgHp,
        formula: hdRaw
      },
      init: Number(m.init ?? dexMod) || 0,
      speeds,
      ac: {
        total: acTotal,
        touch: acTouch,
        flatFooted: acFlat,
        naturalArmor,
        armor: armorBonus,
        shield: shieldBonus,
        deflection,
        size: sizeMod
      },
      bab,
      grapple,
      space,
      reach,
      abilities,
      nonabilities,
      saves: {
        fort: Number(m.saves?.fort ?? 0) || 0,
        ref: Number(m.saves?.ref ?? 0) || 0,
        will: Number(m.saves?.will ?? 0) || 0
      },
      skills: Array.isArray(m.skills) ? m.skills : []
    },
    // Top-level convenience mirrors for fast Compendium/Bestiary listing & Companion engine
    size,
    cr: m.cr,
    crNumeric,
    alignment: m.alignment || 'Neutral',
    environment: envClean,
    hitDice: hdRaw,
    hitDiceStr: m.hitDiceStr || `${creatureType} ${Math.max(1, Math.round(hdCount))}`,
    hp: avgHp,
    init: Number(m.init ?? dexMod) || 0,
    ac: {
      total: acTotal,
      touch: acTouch,
      flatFooted: acFlat,
      naturalArmor,
      deflection
    },
    saves: {
      fort: Number(m.saves?.fort ?? 0) || 0,
      ref: Number(m.saves?.ref ?? 0) || 0,
      will: Number(m.saves?.will ?? 0) || 0
    },
    speed: {
      land: speeds.land,
      fly: speeds.fly,
      swim: speeds.swim,
      climb: speeds.climb,
      burrow: speeds.burrow
    },
    abilities: Object.assign({}, abilities),
    nonabilities,
    bab,
    grapple,
    space,
    reach,
    naturalArmor,
    deflection,
    armorBonus,
    shieldBonus,
    sizeMod,
    attacks,
    feats: realFeats,
    specialAbilities,
    effects
  };

  if (powers.length > 0) out.powers = powers;
  if (Array.isArray(m.spells) && m.spells.length > 0) out.spells = m.spells;
  if (Array.isArray(m.skills) && m.skills.length > 0) out.skills = m.skills;
  if (Array.isArray(m.aliases) && m.aliases.length > 0) out.aliases = m.aliases;
  out.shortDescription = `${size} ${creatureType}${subtypes.length ? ` (${subtypes.join(', ')})` : ''} (CR ${m.cr}, HP ${avgHp}, AC ${acTotal})`;
  if (cleanText) out.text = cleanText;
  out.tags = Array.isArray(m.tags) ? m.tags : ['monster', creatureType.toLowerCase(), size.toLowerCase()];

  return out;
}

// ----------------------------------------------------------------------------
// 5. Companion Rules (`srd_companions.json`) & Index (`srd_index.json`)
// ----------------------------------------------------------------------------
function migrateCompanionsFile(rawComp) {
  const out = JSON.parse(JSON.stringify(rawComp));
  out.schemaVersion = 3;
  out.version = '3.0.0';
  return out;
}

function buildIndexRow(entry, chunkFile) {
  const row = {
    id: entry.id,
    n: entry.name,
    t: entry.type || 'Feat',
    c: entry.school || entry.category || 'General',
    s: entry.slot || 'None',
    f: chunkFile
  };
  if (entry.level !== undefined) row.l = entry.level;
  else if (entry.crNumeric !== undefined) row.l = entry.crNumeric;
  return row;
}

function main() {
  const t0 = Date.now();
  console.log(`🚀 Migrating corpus from [${SRC_DIR}] -> [${DB_DIR}] (` + 'schemaVersion: 3)...');

  const rawIdx = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'srd_index.json'), 'utf8'));
  const knownFeatSet = buildKnownFeatSet();

  const newChunksMeta = {};
  const newIndexRows = [];
  let totalMigrated = 0;
  let monstersMigrated = 0;

  for (const [chunkFile, oldMeta] of Object.entries(rawIdx.chunks)) {
    const srcPath = path.join(SRC_DIR, chunkFile);
    const dstPath = path.join(DB_DIR, chunkFile);
    const rawFileStr = fs.readFileSync(srcPath, 'utf8');
    const wasMinified = rawFileStr.split('\n').length <= 5;
    const rawData = JSON.parse(rawFileStr);

    let migratedPayload;
    let count = 0;
    if (chunkFile === 'srd_companions.json') {
      migratedPayload = migrateCompanionsFile(rawData);
      count = 1;
    } else if (chunkFile === 'srd_monsters.json') {
      migratedPayload = rawData.map(m => migrateMonsterEntry(m, knownFeatSet));
      count = migratedPayload.length;
      monstersMigrated = count;
      totalMigrated += count;
      for (const e of migratedPayload) newIndexRows.push(buildIndexRow(e, chunkFile));
    } else if (Array.isArray(rawData)) {
      migratedPayload = rawData.map(e => migrateStandardEntry(e));
      count = migratedPayload.length;
      totalMigrated += count;
      for (const e of migratedPayload) newIndexRows.push(buildIndexRow(e, chunkFile));
    } else {
      throw new Error(`Unexpected payload format in ${chunkFile}`);
    }

    const jsonText = (wasMinified ? JSON.stringify(migratedPayload) : JSON.stringify(migratedPayload, null, 2)) + '\n';
    const buf = Buffer.from(jsonText, 'utf8');
    fs.writeFileSync(dstPath, buf);

    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
    const metaOut = Object.assign({}, oldMeta, {
      count,
      bytes: buf.length,
      hash
    });
    if ('sha256' in metaOut) delete metaOut.sha256;
    newChunksMeta[chunkFile] = metaOut;
  }

  // Compute aggregate compendium hash
  const combinedHashes = Object.keys(newChunksMeta).sort().map(k => `${k}:${newChunksMeta[k].hash}`).join('|');
  const compendiumHash = crypto.createHash('sha256').update(combinedHashes).digest('hex').slice(0, 16);

  const newIndex = {
    schemaVersion: 3,
    version: '3.0.0',
    compendiumHash,
    generatedAt: new Date().toISOString(),
    totalEntries: totalMigrated,
    chunks: newChunksMeta,
    index: newIndexRows
  };

  fs.writeFileSync(path.join(DB_DIR, 'srd_index.json'), Buffer.from(JSON.stringify(newIndex, null, 2) + '\n', 'utf8'));

  const ms = Date.now() - t0;
  console.log(`✅ Pure V3 Migration complete in ${ms}ms (0 LLM tokens):`);
  console.log(`   • Standard entries migrated : ${totalMigrated - monstersMigrated}`);
  console.log(`   • Bestiary monsters migrated: ${monstersMigrated}`);
  console.log(`   • Total V3 entries          : ${totalMigrated}`);
  console.log(`   • Monsters file size        : ${(rawIdx.chunks['srd_monsters.json'].bytes / 1024 / 1024).toFixed(2)} MB -> ${(newChunksMeta['srd_monsters.json'].bytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   • Compendium hash           : ${compendiumHash}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  migrateStandardEntry,
  migrateMonsterEntry,
  migrateCompanionsFile,
  buildKnownFeatSet,
  htmlToCleanText,
  cleanFoundryFormula
};
