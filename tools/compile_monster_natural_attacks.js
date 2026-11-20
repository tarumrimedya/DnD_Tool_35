#!/usr/bin/env node
'use strict';

/**
 * Full Bestiary Monster Natural Attack Compiler & Deterministic -5/-2 Validator (ADR-058 Faz 1a + Faz 3)
 *
 * Scope: ALL 649 Bestiary monsters in `database/srd_monsters.json`.
 *
 * Generates `tools/data/srd_monster_natural_attacks.json` as the compiler map and writes
 * canonical `count`, `primary` (`true | false | 'special_rake' | 'weapon' | 'misc'`), and `dmgType`
 * (`B | P | S | B/P | P/S | B/P/S`) into `database/srd_monsters.json`, resolving all Foundry
 * `sizeRoll` / `sizeNaturalRoll` expressions to exact D&D 3.5e dice (DMG Table 2-2 / MM p.291)
 * and validating every multi-attack primary/secondary `-5/-2` delta deterministically.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MONSTERS_PATH = path.join(ROOT, 'database', 'srd_monsters.json');
const COMPANIONS_PATH = path.join(ROOT, 'database', 'srd_companions.json');
const DATA_OUT_PATH = path.join(__dirname, 'data', 'srd_monster_natural_attacks.json');

const SIZE_ATK_MOD = {
  Fine: 8, Diminutive: 4, Tiny: 2, Small: 1, Medium: 0, Large: -1, Huge: -2, Gargantuan: -4, Colossal: -8
};

const SIZE_INDEX = {
  Fine: 0, Diminutive: 1, Tiny: 2, Small: 3, Medium: 4, Large: 5, Huge: 6, Gargantuan: 7, Colossal: 8
};

// Official D&D 3.5e DMG Table 2-2 / MM p.291 weapon & natural attack size-scaling ladder
const WEAPON_SIZE_LADDER = [
  '1', '1d2', '1d3', '1d4', '1d6', '1d8', '2d6', '3d6', '4d6', '6d6', '8d6', '12d6', '16d6'
];
const WEAPON_D10_LADDER = [
  '1d2', '1d3', '1d4', '1d6', '1d8', '1d10', '2d8', '3d8', '4d8', '6d8', '8d8', '12d8'
];
const WEAPON_D12_LADDER = [
  '1d3', '1d4', '1d6', '1d8', '1d10', '1d12', '3d6', '4d6', '6d6', '8d6', '12d6'
];

function scaleDiceBySizeDelta(baseDice, delta) {
  const clean = String(baseDice || '1d6').toLowerCase().trim();
  if (delta === 0) return clean;
  // Exact 3.5e step progressions for common base dice
  const ladders = {
    '1d4': { arr: ['1', '1', '1d2', '1d3', '1d4', '1d6', '1d8', '2d6', '3d6'], medIdx: 4 },
    '1d6': { arr: ['1', '1d2', '1d3', '1d4', '1d6', '1d8', '2d6', '3d6', '4d6'], medIdx: 4 },
    '1d8': { arr: ['1d2', '1d3', '1d4', '1d6', '1d8', '2d6', '3d6', '4d6', '6d6'], medIdx: 4 },
    '1d10': { arr: ['1d3', '1d4', '1d6', '1d8', '1d10', '2d8', '3d8', '4d8', '6d8'], medIdx: 4 },
    '1d12': { arr: ['1d4', '1d6', '1d8', '1d10', '1d12', '3d6', '4d6', '6d6', '8d6'], medIdx: 4 },
    '2d4': { arr: ['1d2', '1d3', '1d4', '1d6', '2d4', '2d6', '3d6', '4d6', '6d6'], medIdx: 4 },
    '2d6': { arr: ['1d3', '1d4', '1d6', '1d10', '2d6', '3d6', '4d6', '6d6', '8d6'], medIdx: 4 },
    '1d3': { arr: ['1', '1', '1', '1d2', '1d3', '1d4', '1d6', '1d8', '2d6'], medIdx: 4 }
  };
  const entry = ladders[clean];
  if (entry) {
    const idx = Math.max(0, Math.min(entry.arr.length - 1, entry.medIdx + delta));
    return entry.arr[idx];
  }
  return clean;
}

function resolveFoundrySizeDice(expr, monsterSize) {
  const raw = String(expr || '').trim();
  if (!raw || !/sizeRoll|sizeNaturalRoll|@/i.test(raw)) return raw;
  const mSizeIdx = SIZE_INDEX[monsterSize || 'Medium'] ?? 4;

  // Pattern 1: sizeRoll(num, die, @size|N, ...)
  const srMatch = raw.match(/sizeRoll\(\s*(\d+)\s*,\s*(\d+)\s*,\s*([^,)\s]+)/i);
  if (srMatch) {
    const baseDice = `${srMatch[1]}d${srMatch[2]}`;
    const sizeArg = srMatch[3].trim();
    const targetIdx = /^\d+$/.test(sizeArg) ? Number(sizeArg) : mSizeIdx;
    return scaleDiceBySizeDelta(baseDice, targetIdx - 4);
  }

  // Pattern 2: sizeNaturalRoll(step, @size|N, ...) where step 1=1d3, 2=1d4, 3=1d6 at Medium
  const snrMatch = raw.match(/sizeNaturalRoll\(\s*(\d+)\s*,\s*([^,)\s]+)/i);
  if (snrMatch) {
    const step = Number(snrMatch[1]);
    const baseByStep = { 1: '1d3', 2: '1d4', 3: '1d6', 4: '1d8', 5: '2d6' };
    const baseDice = baseByStep[step] || '1d4';
    const sizeArg = snrMatch[2].trim();
    const targetIdx = /^\d+$/.test(sizeArg) ? Number(sizeArg) : mSizeIdx;
    return scaleDiceBySizeDelta(baseDice, targetIdx - 4);
  }

  // Pattern 3: 2d6+(@critMult - 1)d6-6 -> base 2d6
  const leadDice = raw.match(/^(\d+d\d+)/i);
  if (leadDice) return leadDice[1];

  return '1d6';
}

// Official 3.5e SRD / Monster Manual v3.5 natural & manufactured weapon damage types (MM p.312 / PHB p.116)
function inferNaturalDmgType(name) {
  const n = String(name || '').toLowerCase();
  if (/bite|jaw|mandible|beak|maw/.test(n)) return 'B/P/S';
  if (/claw|talon|rake|rend|razor/.test(n)) return 'P/S';
  if (/gore|sting|horn|quill|spike|tusk|antler|proboscis|barb|dart|needle|thorn/.test(n)) return 'P';
  if (/longsword|greatsword|bastard sword|scimitar|falchion|battleaxe|greataxe|handaxe|kukri|glaive|guisarme|halberd|scythe|kamas?|whip|blade|axe|sword/.test(n)) return 'S';
  if (/short sword|shortsword|rapier|dagger|spear|lance|javelin|bow|crossbow|arrow|bolt|trident|pick|ranseur|morningstar/.test(n)) return 'P';
  if (/club|greatclub|mace|flail|hammer|warhammer|quarterstaff|staff|sling|rock|boulder|sap|gauntlet|unarmed/.test(n)) return 'B';
  if (/slam|hoof|hooves|tail|wing|tentacle|arm|stamp|stomp|ram|trample|constrict|pincer|tendril|buffet|vine|root|strand|pseudopod|crush|smash|slap|kick|foreleg/.test(n)) return 'B';
  if (/swarm/.test(n)) return 'B/P/S';
  return 'B';
}

// Curated 3.5e Monster Manual v3.5 overrides for Foundry-imported defects, multi-count attacks,
// and primary/secondary ordering. Only entries with `recalc: true` recalculate attackBonus/damageBonus
// to fix verified Foundry primary/secondary inversions (e.g. Dire Bear, Big Cats, Eagle).
const MM35_OVERRIDES = {
  // Bears (MM p.63, 269): 2 claws primary, bite secondary (Foundry had inverted Bite/Claw)
  'mst-bear-black': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-bear-brown': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-bear-polar': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-dire-bear': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S', dice: '2d4' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S', dice: '2d8' }] },
  'mst-legendary-bear': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },

  // Big Cats (MM p.64-65, 275, 281): 2 claws primary, bite secondary, 2 rakes special_rake
  'mst-lion': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S', dice: '1d4' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S', dice: '1d8' }, { name: 'Rake', count: 2, primary: 'special_rake', dmgType: 'P/S', dice: '1d4' }] },
  'mst-tiger': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S', dice: '1d8' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S', dice: '2d6' }, { name: 'Rake', count: 2, primary: 'special_rake', dmgType: 'P/S', dice: '1d8' }] },
  'mst-dire-lion': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }, { name: 'Rake', count: 2, primary: 'special_rake', dmgType: 'P/S' }] },
  'mst-dire-tiger': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }, { name: 'Rake', count: 2, primary: 'special_rake', dmgType: 'P/S' }] },
  'mst-legendary-tiger': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }, { name: 'Rake', count: 2, primary: 'special_rake', dmgType: 'P/S' }] },

  // Small / Medium Cats (MM p.270-274)
  'mst-cat': { attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-leopard': { attacks: [{ name: 'Bite', count: 1, primary: true, dmgType: 'B/P/S', dice: '1d6' }, { name: 'Claw', count: 2, primary: false, dmgType: 'P/S', dice: '1d3' }, { name: 'Rake', count: 2, primary: 'special_rake', dmgType: 'P/S', dice: '1d3' }] },
  'mst-cheetah': { attacks: [{ name: 'Bite', count: 1, primary: true, dmgType: 'B/P/S' }, { name: 'Claw', count: 2, primary: false, dmgType: 'P/S' }] },

  // Apes & Badgers & Wolverines (MM p.62, 268, 283): 2 claws primary, bite secondary
  'mst-ape': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-dire-ape': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-badger': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-dire-badger': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-wolverine': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-dire-wolverine': { recalc: true, attacks: [{ name: 'Claw', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },

  // Birds of Prey (MM p.272-277): 2 talons primary, bite secondary
  'mst-eagle': { deduplicate: true, recalc: true, attacks: [{ name: 'Talon', count: 2, primary: true, dmgType: 'P/S', dice: '1d4' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S', dice: '1d4' }] },
  'mst-giant-eagle': { recalc: true, attacks: [{ name: 'Talon', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-hawk': { attacks: [{ name: 'Talon', count: 1, primary: true, dmgType: 'P/S' }] },
  'mst-owl': { attacks: [{ name: 'Talon', count: 1, primary: true, dmgType: 'P/S' }] },
  'mst-giant-owl': { recalc: true, attacks: [{ name: 'Talon', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-roc': { recalc: true, attacks: [{ name: 'Talon', count: 2, primary: true, dmgType: 'P/S' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },

  // Non-warhorses & Ponies (MM p.273-277): 2 hooves are SECONDARY (-5, 1/2 STR); Warhorses: 2 hooves primary, bite secondary
  'mst-horse-heavy': { recalc: true, attacks: [{ name: 'Hoof', count: 2, primary: false, dmgType: 'B' }] },
  'mst-horse-light': { recalc: true, attacks: [{ name: 'Hoof', count: 2, primary: false, dmgType: 'B' }] },
  'mst-pony': { recalc: true, attacks: [{ name: 'Hoof', count: 2, primary: false, dmgType: 'B' }] },
  'mst-pony-war': { recalc: true, attacks: [{ name: 'Hoof', count: 2, primary: true, dmgType: 'B' }] },
  'mst-warhorse-light': { recalc: true, attacks: [{ name: 'Hoof', count: 2, primary: true, dmgType: 'B' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },
  'mst-warhorse-heavy': { recalc: true, attacks: [{ name: 'Hoof', count: 2, primary: true, dmgType: 'B' }, { name: 'Bite', count: 1, primary: false, dmgType: 'B/P/S' }] },

  // Foundry sizeNaturalRoll fixes
  'mst-griffon': { recalc: true, attacks: [{ name: 'Bite', count: 1, primary: true, dmgType: 'B/P/S', dice: '2d6' }, { name: 'Claw', count: 2, primary: false, dmgType: 'P/S', dice: '1d4' }, { name: 'Rake', count: 2, primary: 'special_rake', dmgType: 'P/S', dice: '1d6' }] },
  'mst-snake-tiny-viper': { attacks: [{ name: 'Bite', count: 1, primary: true, dmgType: 'B/P/S', dice: '1' }] },
  'mst-twelve-headed-hydra': { attacks: [{ name: 'Bite', count: 12, primary: true, dmgType: 'B/P/S', dice: '1d10' }] },
  'mst-lamia': { attacks: [{ name: 'Touch', count: 1, primary: true, dmgType: 'B' }, { name: 'Dagger', count: 1, primary: 'weapon', dmgType: 'P/S', dice: '1d4' }] },

  // Crocodiles (MM p.271): Bite +6 (1d8+6) OR Tail Slap +6 (1d12+6) — mutually exclusive single primary attacks (1.5x STR)
  'mst-crocodile': { recalc: true, singlePrimaryEach: true, attacks: [{ name: 'Bite', count: 1, primary: true, dmgType: 'B/P/S' }, { name: 'Tail', count: 1, primary: true, dmgType: 'B' }] },
  'mst-crocodile-giant': { recalc: true, singlePrimaryEach: true, attacks: [{ name: 'Bite', count: 1, primary: true, dmgType: 'B/P/S' }, { name: 'Tail', count: 1, primary: true, dmgType: 'B' }] }
};

function isManufacturedWeaponName(name) {
  const n = String(name || '').toLowerCase();
  return /\b(longsword|shortsword|short sword|greatsword|bastard sword|scimitar|falchion|battleaxe|greataxe|handaxe|throwing axe|kukri|glaive|guisarme|halberd|scythe|kama|whip|rapier|dagger|spear|longspear|shortspear|lance|javelin|longbow|shortbow|crossbow|trident|pick|ranseur|morningstar|club|greatclub|mace|flail|warhammer|hammer|quarterstaff|sling|sap|gauntlet|net|shuriken|bolas|spiked chain|trident)\b/.test(n);
}

function isSpecialNonIterativeAttack(atk) {
  const n = String(atk.name || '').toLowerCase();
  return /constrict|trample|rend|poison|breath|swallow|web|acid|spit|gaze|roar|stink|spore|pollen|disease|energy drain|blood drain|attach|swarm|crush|tail sweep|frightful presence/.test(n)
    || isManufacturedWeaponName(n)
    || (atk.attackType && atk.attackType !== 'natural' && !/rake/i.test(n));
}

function inferDefaultCount(monster, atkName) {
  const n = String(atkName || '').toLowerCase();
  const mName = String(monster.name || '').toLowerCase();
  const size = String(monster.size || 'Medium');

  // Hydras: N-headed -> N bites
  const hydraMap = { five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
  for (const [word, cnt] of Object.entries(hydraMap)) {
    if (mName.includes(word + '-headed') && /bite/.test(n)) return cnt;
  }

  // Elementals: Small & Medium = 1 slam, Large+ = 2 slams (MM p.95-101)
  const cType = String(monster.monster?.creatureType || monster.creatureType || monster.category || '');
  if (/elemental/i.test(cType) && /slam/.test(n)) {
    const mSz = String(monster.monster?.size || size || 'Medium');
    return (mSz === 'Small' || mSz === 'Medium' || mSz === 'Tiny' || mSz === 'Fine' || mSz === 'Diminutive') ? 1 : 2;
  }

  // Bilateral natural weapons
  if (/claw|talon|hoof|hooves|wing|pincer|rake|foreleg/.test(n)) {
    if (size === 'Tiny' && /hawk|owl|cat/.test(mName) && /talon/.test(n)) return 1;
    return 2;
  }
  if (/tentacle/.test(n)) {
    if (/octopus|squid|kraken/.test(mName)) return 8;
    return 2;
  }
  return 1;
}

function normalizeMonster(m) {
  const rawAtks = Array.isArray(m.attacks) ? m.attacks : [];
  if (rawAtks.length === 0) return { id: m.id, name: m.name, attacks: [] };

  const ov = MM35_OVERRIDES[m.id] || null;
  let working = rawAtks.map(a => JSON.parse(JSON.stringify(a)));

  // Deduplicate if explicitly flagged (e.g. Eagle duplicate Talon)
  if (ov && ov.deduplicate) {
    const seen = new Set();
    working = working.filter(a => {
      const k = String(a.name || '').toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  const bab = Number(m.bab) || 0;
  const str = Number(m.abilities?.str ?? 10);
  const dex = Number(m.abilities?.dex ?? 10);
  const strMod = Math.floor((str - 10) / 2);
  const dexMod = Math.floor((dex - 10) / 2);
  const sizeMod = SIZE_ATK_MOD[m.size || 'Medium'] ?? 0;
  const feats = Array.isArray(m.feats) ? m.feats : [];
  const hasFinesse = feats.some(f => /weapon\s*finesse/i.test(f));
  const hasMultiattack = feats.some(f => /\bmultiattack\b/i.test(f));
  const atkAbilityMod = hasFinesse ? Math.max(strMod, dexMod) : strMod;
  const secondaryPen = hasMultiattack ? -2 : -5;

  const wfBonusFor = (atkName) => {
    const low = String(atkName || '').toLowerCase();
    return feats.some(f => {
      const mWf = String(f).match(/weapon\s*focus\s*\(([^)]+)\)/i);
      return mWf && low.includes(mWf[1].toLowerCase().replace(/s$/, ''));
    }) ? 1 : 0;
  };

  // Identify natural attacks vs special/misc attacks
  const natIndices = [];
  working.forEach((a, idx) => {
    if (/rake/i.test(a.name || '')) {
      a.primary = 'special_rake';
      a.count = 2;
      a.dmgType = 'P/S';
      return;
    }
    if (!isSpecialNonIterativeAttack(a)) {
      natIndices.push(idx);
    } else {
      a.primary = (a.attackType === 'weapon' || isManufacturedWeaponName(a.name)) ? 'weapon' : 'misc';
    }
  });

  // Determine primary vs secondary for natural attacks
  if (ov && Array.isArray(ov.attacks)) {
    working.forEach(a => {
      const rule = ov.attacks.find(r => r.name.toLowerCase() === String(a.name || '').toLowerCase());
      if (rule) {
        a.count = rule.count;
        a.primary = rule.primary;
        a.dmgType = rule.dmgType;
        if (rule.dice) {
          a.damageDice = rule.dice;
          if (a.weapon) a.weapon.damageDice = rule.dice;
        }
      }
    });
  } else {
    // Infer primary: True Dragons (MM p.69) always use Bite as their primary natural weapon;
    // otherwise pick highest existing attackBonus among natural attacks (tie -> first).
    const isDragon = /dragon/i.test(String(m.creatureType || m.monster?.creatureType || m.category || ''));
    const dragonBiteIdx = isDragon ? natIndices.find(idx => /^bite\b/i.test(String(working[idx].name || '').trim())) : undefined;
    let bestBonus = -999;
    let bestIdx = dragonBiteIdx !== undefined ? dragonBiteIdx : (natIndices[0] ?? -1);
    if (dragonBiteIdx === undefined) {
      natIndices.forEach(idx => {
        const b = Number(working[idx].attackBonus ?? -999);
        if (b > bestBonus) { bestBonus = b; bestIdx = idx; }
      });
    }
    natIndices.forEach(idx => {
      const a = working[idx];
      a.count = inferDefaultCount(m, a.name);
      a.primary = (idx === bestIdx);
      a.dmgType = inferNaturalDmgType(a.name);
    });
  }

  // Ensure every natural & rake attack has canonical fields and RAW-consistent attack/damage bonuses
  const totalNatWeapons = working.reduce((sum, a) => {
    if (a.primary === true || a.primary === false) return sum + (Number(a.count) || 1);
    return sum;
  }, 0);

  working.forEach(a => {
    // Resolve any Foundry sizeRoll / sizeNaturalRoll / @critMult dice formulas cleanly
    if (a.damageDice && /sizeRoll|sizeNaturalRoll|@/i.test(String(a.damageDice))) {
      a.damageDice = resolveFoundrySizeDice(a.damageDice, m.size || m.monster?.size || 'Medium');
      if (a.weapon) a.weapon.damageDice = a.damageDice;
    }
    if (a.weapon && a.weapon.damageDice && /sizeRoll|sizeNaturalRoll|@/i.test(String(a.weapon.damageDice))) {
      a.weapon.damageDice = resolveFoundrySizeDice(a.weapon.damageDice, m.size || m.monster?.size || 'Medium');
    }

    if (a.primary !== true && a.primary !== false && a.primary !== 'special_rake') {
      // Special/misc or manufactured weapon attack — ensure canonical count, primary, dmgType
      if (!a.count) a.count = 1;
      a.primary = (a.attackType === 'weapon') ? 'weapon' : 'misc';
      if (!a.dmgType || a.dmgType === 'Physical') a.dmgType = inferNaturalDmgType(a.name);
      if (a.weapon && (!a.weapon.dmgType || a.weapon.dmgType === 'Physical')) a.weapon.dmgType = a.dmgType;
      return;
    }
    if (!a.count) a.count = inferDefaultCount(m, a.name);
    if (!a.dmgType || a.dmgType === 'Physical') a.dmgType = inferNaturalDmgType(a.name);

    // Fix Foundry incorporeal touch bug (Foundry applied STR 0 = -5 instead of DEX; MM p.310 uses DEX, 0 STR dmg)
    const isIncorpTouch = /incorporeal\s+touch/i.test(String(a.name || ''));
    const isDragonEntry = /dragon/i.test(String(m.monster?.creatureType || m.creatureType || m.category || ''))
      && working.some(w => w.primary === true && /^bite\b/i.test(String(w.name || '')));
    if (isIncorpTouch) {
      const wf = wfBonusFor(a.name);
      a.attackBonus = bab + dexMod + sizeMod + wf;
      a.damageBonus = 0;
      if (a.weapon) {
        a.weapon.damageBonus = 0;
        a.weapon.dmgType = a.dmgType;
      }
    } else if (((ov && ov.recalc === true) || isDragonEntry) && a.actionType !== 'rwak') {
      // Recalculate ONLY for verified Foundry primary/secondary inversions (True Dragons, Bears, Big Cats, Apes, Horses, Crocodiles, Eagle)
      const wf = wfBonusFor(a.name);
      const isPrim = a.primary === true;
      const isRake = a.primary === 'special_rake';
      const rawAtk = bab + atkAbilityMod + sizeMod + wf + (isPrim || isRake ? 0 : secondaryPen);
      let rawDmg = 0;
      if (isRake) {
        rawDmg = strMod > 0 ? Math.floor(strMod * 0.5) : strMod;
      } else if (isPrim) {
        const use15x = (totalNatWeapons === 1 || Boolean(ov && ov.singlePrimaryEach)) && strMod > 0;
        rawDmg = use15x ? Math.floor(strMod * 1.5) : strMod;
      } else {
        rawDmg = strMod > 0 ? Math.floor(strMod * 0.5) : strMod;
      }
      a.attackBonus = rawAtk;
      a.damageBonus = rawDmg;
      if (a.weapon) {
        a.weapon.damageBonus = rawDmg;
        a.weapon.dmgType = a.dmgType;
      }
    } else if (a.weapon) {
      a.weapon.dmgType = a.dmgType;
    }
  });

  // Sort primary first, secondary next, special_rake / misc last
  const rank = (a) => a.primary === true ? 0 : (a.primary === false ? 1 : (a.primary === 'special_rake' ? 2 : 3));
  working.sort((a, b) => rank(a) - rank(b));

  m.attacks = working;
  return {
    id: m.id,
    name: m.name,
    creatureType: m.monster?.creatureType || m.creatureType || m.category || '',
    size: m.monster?.size || m.size || 'Medium',
    bab,
    strMod,
    dexMod,
    hasFinesse,
    hasMultiattack,
    attacks: working.map(a => ({
      name: a.name,
      count: a.count || 1,
      primary: a.primary !== undefined ? a.primary : 'misc',
      dmgType: a.dmgType || 'B',
      dice: a.damageDice || '1d4',
      attackBonus: a.attackBonus,
      damageBonus: a.damageBonus
    }))
  };
}

function run() {
  const mons = JSON.parse(fs.readFileSync(MONSTERS_PATH, 'utf8'));
  const comp = JSON.parse(fs.readFileSync(COMPANIONS_PATH, 'utf8'));
  const allowedIds = new Set([
    ...(comp.druidAllowedAnimals || []).map(x => x.id),
    ...(comp.familiarAllowedAnimals || []).map(x => x.id),
    ...(comp.paladinAllowedMounts || []).map(x => x.id),
    ...(comp.fiendishAllowedServants || []).map(x => x.id)
  ]);

  const mapOut = {};
  let scopeCount = 0;
  let validatedMulti = 0;
  const errors = [];

  for (const m of mons) {
    scopeCount++;
    const summary = normalizeMonster(m);
    mapOut[m.id] = summary;

    // Deterministic -5 / -2 validator on recalculated multi-attack monsters + canonical schema & dice hygiene on ALL 649
    const ov = MM35_OVERRIDES[m.id] || null;
    const isDragonEntry = /dragon/i.test(String(m.monster?.creatureType || m.creatureType || m.category || ''));
    const meleeNats = (m.attacks || []).filter(a => (a.primary === true || a.primary === false) && a.actionType !== 'rwak');
    const prim = meleeNats.find(a => a.primary === true);
    const secs = meleeNats.filter(a => a.primary === false);
    if (prim && secs.length > 0 && ((ov && ov.recalc === true) || isDragonEntry)) {
      validatedMulti++;
      const expectedDelta = summary.hasMultiattack ? -2 : -5;
      const feats = Array.isArray(m.feats) ? m.feats : [];
      const wfOf = (nm) => feats.some(f => {
        const mw = String(f).match(/weapon\s*focus\s*\(([^)]+)\)/i);
        return mw && String(nm || '').toLowerCase().includes(mw[1].toLowerCase().replace(/s$/, ''));
      }) ? 1 : 0;
      const primBase = prim.attackBonus - wfOf(prim.name);
      for (const s of secs) {
        const secBase = s.attackBonus - wfOf(s.name);
        const actualDelta = secBase - primBase;
        if (actualDelta !== expectedDelta) {
          errors.push(`${m.id} (${m.name}): ${prim.name}(${prim.attackBonus}) vs ${s.name}(${s.attackBonus}) delta=${actualDelta}, expected=${expectedDelta}`);
        }
      }
    }
    for (const a of (m.attacks || [])) {
      if (/sizeNaturalRoll|sizeRoll|@/i.test(String(a.damageDice || ''))) {
        errors.push(`${m.id} (${m.name}): unnormalized Foundry dice "${a.damageDice}" on ${a.name}`);
      }
      if (a.count === undefined || a.primary === undefined || !a.dmgType) {
        errors.push(`${m.id} (${m.name}): missing canonical count/primary/dmgType on ${a.name}`);
      }
    }
  }

  fs.mkdirSync(path.dirname(DATA_OUT_PATH), { recursive: true });
  fs.writeFileSync(DATA_OUT_PATH, JSON.stringify({
    schemaVersion: 1,
    scope: 'Full Bestiary (All 649 SRD 3.5e Monsters — ADR-058 Phase 1a + Phase 3)',
    count: scopeCount,
    entries: mapOut
  }, null, 2), 'utf8');

  fs.writeFileSync(MONSTERS_PATH, JSON.stringify(mons), 'utf8');

  console.log(`Normalized ${scopeCount} Bestiary monsters (${validatedMulti} multi-attack primary/secondary pairs validated).`);
  if (errors.length > 0) {
    console.error(`VALIDATION FAILED (${errors.length} errors):`);
    errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }
  console.log('Deterministic -5/-2 primary/secondary & dice hygiene validator: 0 errors.');
}

run();
