// D&D 3.5e Core Rules & Calculation Engine

import { RACES } from '../data/racesData.js';
import { CLASSES } from '../data/classesData.js';
import { SKILLS } from '../data/skillsData.js';
import { SAMPLE_EQUIPMENT } from '../data/equipmentData.js';

export function calculateAbilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

export function calculateTotalAbilityScores(char) {
  const base = { ...char.baseAbilityScores };
  const race = RACES[char.race] || RACES.human;

  // Add racial modifiers
  Object.keys(base).forEach(stat => {
    base[stat] += (race.abilityMods[stat] || 0);
  });

  // Add custom item / spell / DM bonuses
  (char.customBonuses || []).forEach(bonus => {
    if (base[bonus.target] !== undefined) {
      base[bonus.target] += Number(bonus.amount) || 0;
    }
  });

  // Calculate modifiers
  const mods = {};
  Object.keys(base).forEach(stat => {
    mods[stat] = calculateAbilityModifier(base[stat]);
  });

  return { scores: base, mods };
}

// Unearthed Arcana Fractional vs Standard BAB
export function calculateBAB(char) {
  let babFractional = 0;
  let babStandard = 0;

  char.classes.forEach(c => {
    const cls = CLASSES[c.classId];
    if (!cls) return;
    const lvl = c.level;

    if (cls.babRate === 'good') {
      babFractional += lvl * 1.0;
      babStandard += lvl * 1.0;
    } else if (cls.babRate === 'average') {
      babFractional += lvl * 0.75;
      babStandard += Math.floor(lvl * 0.75);
    } else if (cls.babRate === 'poor') {
      babFractional += lvl * 0.5;
      babStandard += Math.floor(lvl * 0.5);
    }
  });

  const finalBAB = char.useFractionalBAB ? Math.floor(babFractional) : Math.floor(babStandard);

  // Attack routine string generation (e.g. +11/+6/+1)
  const attacks = [];
  let currentAttack = finalBAB;
  while (currentAttack > 0) {
    attacks.push(`+${currentAttack}`);
    currentAttack -= 5;
  }
  if (attacks.length === 0) attacks.push('+0');

  return { bab: finalBAB, attackRoutine: attacks.join('/') };
}

// Unearthed Arcana Fractional vs Standard Base Saves
export function calculateSaves(char, abilityMods) {
  let fortBase = 0, refBase = 0, willBase = 0;

  if (char.useFractionalSaves) {
    let hasGoodFort = false, hasGoodRef = false, hasGoodWill = false;

    char.classes.forEach(c => {
      const cls = CLASSES[c.classId];
      if (!cls) return;
      const lvl = c.level;

      if (cls.fortSaveRate === 'good') {
        fortBase += (hasGoodFort ? 0 : 2.0) + lvl * 0.5;
        hasGoodFort = true;
      } else {
        fortBase += lvl * (1/3);
      }

      if (cls.refSaveRate === 'good') {
        refBase += (hasGoodRef ? 0 : 2.0) + lvl * 0.5;
        hasGoodRef = true;
      } else {
        refBase += lvl * (1/3);
      }

      if (cls.willSaveRate === 'good') {
        willBase += (hasGoodWill ? 0 : 2.0) + lvl * 0.5;
        hasGoodWill = true;
      } else {
        willBase += lvl * (1/3);
      }
    });

    fortBase = Math.floor(fortBase);
    refBase = Math.floor(refBase);
    willBase = Math.floor(willBase);
  } else {
    // Standard 3.5e save tables
    char.classes.forEach(c => {
      const cls = CLASSES[c.classId];
      if (!cls) return;
      const lvl = c.level;

      const getSave = (rate, level) => rate === 'good' ? (2 + Math.floor(level / 2)) : Math.floor(level / 3);
      fortBase += getSave(cls.fortSaveRate, lvl);
      refBase += getSave(cls.refSaveRate, lvl);
      willBase += getSave(cls.willSaveRate, lvl);
    });
  }

  // Custom save bonuses
  let bonusFort = 0, bonusRef = 0, bonusWill = 0, bonusAll = 0;
  (char.customBonuses || []).forEach(b => {
    if (b.target === 'fort') bonusFort += Number(b.amount) || 0;
    if (b.target === 'ref') bonusRef += Number(b.amount) || 0;
    if (b.target === 'will') bonusWill += Number(b.amount) || 0;
    if (b.target === 'saves') bonusAll += Number(b.amount) || 0;
  });

  const totalFort = fortBase + abilityMods.con + bonusFort + bonusAll;
  const totalRef = refBase + abilityMods.dex + bonusRef + bonusAll;
  const totalWill = willBase + abilityMods.wis + bonusWill + bonusAll;

  return {
    fort: { base: fortBase, mod: abilityMods.con, bonus: bonusFort + bonusAll, total: totalFort },
    ref: { base: refBase, mod: abilityMods.dex, bonus: bonusRef + bonusAll, total: totalRef },
    will: { base: willBase, mod: abilityMods.wis, bonus: bonusWill + bonusAll, total: totalWill }
  };
}

export function calculateArmorClass(char, dexMod) {
  let armorBonus = 0;
  let shieldBonus = 0;
  let maxDexLimit = null;
  let checkPenalty = 0;
  let deflectionBonus = 0;

  // Check equipped items
  Object.values(char.equippedSlots || {}).forEach(itemId => {
    const item = SAMPLE_EQUIPMENT[itemId];
    if (!item) return;

    if (item.armorData) {
      if (item.armorData.armorBonus) armorBonus += item.armorData.armorBonus;
      if (item.armorData.shieldBonus) shieldBonus += item.armorData.shieldBonus;
      if (item.armorData.maxDex !== null && item.armorData.maxDex !== undefined) {
        maxDexLimit = maxDexLimit === null ? item.armorData.maxDex : Math.min(maxDexLimit, item.armorData.maxDex);
      }
      if (item.armorData.checkPenalty) checkPenalty += item.armorData.checkPenalty;
    }

    if (item.acBonus) {
      if (item.acBonus.type === 'Deflection') deflectionBonus += item.acBonus.amount;
    }
  });

  // Custom AC bonuses
  (char.customBonuses || []).forEach(b => {
    if (b.target === 'ac') deflectionBonus += Number(b.amount) || 0;
  });

  const effectiveDex = maxDexLimit !== null ? Math.min(dexMod, maxDexLimit) : dexMod;
  const sizeMod = 0; // Medium

  const totalAC = 10 + armorBonus + shieldBonus + effectiveDex + deflectionBonus + sizeMod;
  const touchAC = 10 + effectiveDex + deflectionBonus + sizeMod;
  const flatFootedAC = 10 + armorBonus + shieldBonus + deflectionBonus + sizeMod;

  return {
    total: totalAC,
    touch: touchAC,
    flatFooted: flatFootedAC,
    armorBonus,
    shieldBonus,
    effectiveDex,
    deflectionBonus,
    checkPenalty
  };
}

// Calculate skills with ranks, synergies, ability mods, and penalties
export function calculateSkills(char, abilityMods, armorCheckPenalty) {
  const skillRanks = char.skillRanks || {};
  const skillTotals = {};

  // Step 1: Calculate synergies (5+ ranks checks)
  const activeSynergies = {};
  Object.keys(skillRanks).forEach(skillId => {
    const ranks = skillRanks[skillId] || 0;
    const skillDef = SKILLS[skillId];
    if (skillDef && skillDef.synergies && ranks >= 5) {
      skillDef.synergies.forEach(syn => {
        activeSynergies[syn.target] = (activeSynergies[syn.target] || 0) + syn.bonus;
      });
    }
  });

  // Step 2: Compute skill total
  Object.keys(SKILLS).forEach(skillId => {
    const skillDef = SKILLS[skillId];
    const ranks = skillRanks[skillId] || 0;
    const abilityMod = abilityMods[skillDef.ability] || 0;
    const synergy = activeSynergies[skillId] || 0;
    const penalty = skillDef.armorCheckPenalty ? armorCheckPenalty : 0;

    let customBonus = 0;
    (char.customBonuses || []).forEach(b => {
      if (b.target === skillId || b.target === 'skills') customBonus += Number(b.amount) || 0;
    });

    const total = ranks + abilityMod + synergy + penalty + customBonus;

    skillTotals[skillId] = {
      ranks,
      abilityMod,
      synergy,
      penalty,
      customBonus,
      total,
      isTrained: ranks > 0 || !skillDef.trainedOnly
    };
  });

  return skillTotals;
}

export function calculateCarryingCapacity(strScore) {
  // D&D 3.5 Carrying Capacity Table for Strength
  const baseCarrying = [
    0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
    115, 130, 150, 175, 200, 230, 260, 300, 350, 400,
    460, 520, 600, 700, 800, 920, 1040, 1200, 1400, 1600
  ];
  const heavy = baseCarrying[Math.min(strScore, 30)] || (strScore * 50);
  const medium = Math.floor(heavy * 2 / 3);
  const light = Math.floor(heavy * 1 / 3);

  return { light, medium, heavy };
}
