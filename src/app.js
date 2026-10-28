// D&D 3.5 Character Creator - Standalone Application Bundle (Direct file:// Compatible)

/* ==========================================================================
   1. DATASETS (Races, Classes, Skills, Feats, Spells, Equipment, Sample Char)
   ========================================================================== */

const RACES = {
  human: {
    id: 'human',
    name: 'Human',
    sourceBook: "Player's Handbook v3.5, p. 12",
    size: 'Medium',
    speed: 30,
    abilityMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    bonusFeatsAtLevel1: 1,
    bonusSkillPointsAtLevel1: 4,
    bonusSkillPointsPerLevel: 1,
    favoredClass: 'Any',
    traits: [
      'Medium-size: As Medium creatures, humans have no special bonuses or penalties due to their size.',
      'Human base land speed is 30 feet.',
      '1 extra bonus feat at 1st level.',
      '4 extra skill points at 1st level and 1 extra skill point at each additional level.'
    ],
    description: `Humans are the most adaptable, flexible, and ambitious people among the common races. They have widely varying tastes, morals, customs, and habits. Their short lifespans drive them to accomplish as much as possible in the time they have.`
  },
  elf_high: {
    id: 'elf_high',
    name: 'Elf (High)',
    sourceBook: "Player's Handbook v3.5, p. 15",
    size: 'Medium',
    speed: 30,
    abilityMods: { str: 0, dex: 2, con: -2, int: 0, wis: 0, cha: 0 },
    favoredClass: 'Wizard',
    traits: [
      '+2 Dexterity, -2 Constitution.',
      'Immunity to magic sleep effects, and a +2 racial saving throw bonus against enchantment spells or effects.',
      'Low-Light Vision: An elf can see twice as far as a human in starlight, moonlight, torchlight, and similar conditions.',
      'Weapon Proficiency: Elves receive Martial Weapon Proficiency feats for the longsword, rapier, longbow, and shortbow.',
      '+2 racial bonus on Listen, Search, and Spot checks.'
    ],
    description: `Elves are known for their poetry, song, literature, arts, magic, and lore. They favor natural beauty and quiet grace.`
  },
  dwarf_shield: {
    id: 'dwarf_shield',
    name: 'Dwarf (Shield / Mountain)',
    sourceBook: "Player's Handbook v3.5, p. 14",
    size: 'Medium',
    speed: 20,
    abilityMods: { str: 0, dex: 0, con: 2, int: 0, wis: 0, cha: -2 },
    favoredClass: 'Fighter',
    traits: [
      '+2 Constitution, -2 Charisma.',
      'Darkvision up to 60 feet.',
      'Stonecunning: +2 racial bonus on Search checks to notice unusual stonework.',
      '+2 racial bonus on saving throws against poison, spells, and spell-like effects.'
    ],
    description: `Dwarves are known for their skill in warfare, their ability to withstand physical and magical punishment, and their knowledge of the earth's secrets.`
  },
  halfling_lightfoot: {
    id: 'halfling_lightfoot',
    name: 'Halfling (Lightfoot)',
    sourceBook: "Player's Handbook v3.5, p. 19",
    size: 'Small',
    speed: 20,
    abilityMods: { str: -2, dex: 2, con: 0, int: 0, wis: 0, cha: 0 },
    favoredClass: 'Rogue',
    traits: [
      '+2 Dexterity, -2 Strength.',
      'Small size: +1 bonus to AC, +1 attack bonus, +4 Hide bonus.',
      '+2 racial bonus on Climb, Jump, Move Silently, and Listen checks.',
      '+1 racial bonus on all saving throws.'
    ],
    description: `Halflings are clever, capable, and resourceful survivors. They are notorious opportunists who love adventure.`
  },
  drow: {
    id: 'drow',
    name: 'Drow (Dark Elf)',
    sourceBook: "Player's Guide to Faerûn, p. 14 / Monster Manual v3.5, p. 102",
    size: 'Medium',
    speed: 30,
    abilityMods: { str: 0, dex: 2, con: -2, int: 2, wis: 0, cha: 2 },
    favoredClass: 'Wizard',
    traits: [
      '+2 Dex, -2 Con, +2 Int, +2 Cha.',
      'Spell Resistance: 11 + Character Level.',
      'Darkvision 120 feet.',
      'Light Blindness: Abrupt exposure to bright light blinds drow for 1 round.'
    ],
    description: `Drow are dark-skinned sub-elves dwelling deep in the Underdark, famed for their deadly stealth and innate spellcasting abilities.`
  }
};

const CLASSES = {
  fighter: {
    id: 'fighter',
    name: 'Fighter',
    sourceBook: "Player's Handbook v3.5, p. 37",
    hitDie: 10,
    babRate: 'good',
    fortSaveRate: 'good',
    refSaveRate: 'poor',
    willSaveRate: 'poor',
    skillPointsPerLevel: 2,
    keyAbility: 'str',
    casterType: 'none',
    description: `Fighters are masters of martial combat, skilled with a variety of weapons and armor.`
  },
  wizard: {
    id: 'wizard',
    name: 'Wizard',
    sourceBook: "Player's Handbook v3.5, p. 52",
    hitDie: 4,
    babRate: 'poor',
    fortSaveRate: 'poor',
    refSaveRate: 'poor',
    willSaveRate: 'good',
    skillPointsPerLevel: 2,
    keyAbility: 'int',
    casterType: 'prepared',
    spellcastingStat: 'int',
    description: `Wizards cast powerful arcane spells drawn from intense study and spellbooks.`
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    sourceBook: "Player's Handbook v3.5, p. 49",
    hitDie: 6,
    babRate: 'average',
    fortSaveRate: 'poor',
    refSaveRate: 'good',
    willSaveRate: 'poor',
    skillPointsPerLevel: 8,
    keyAbility: 'dex',
    casterType: 'none',
    description: `Rogues rely on skill, stealth, and exploiting enemy vulnerabilities.`
  },
  cleric: {
    id: 'cleric',
    name: 'Cleric',
    sourceBook: "Player's Handbook v3.5, p. 30",
    hitDie: 8,
    babRate: 'average',
    fortSaveRate: 'good',
    refSaveRate: 'poor',
    willSaveRate: 'good',
    skillPointsPerLevel: 2,
    keyAbility: 'wis',
    casterType: 'prepared',
    spellcastingStat: 'wis',
    description: `Clerics are divine champions wielding sacred magic granted by deities.`
  },
  duskblade: {
    id: 'duskblade',
    name: 'Duskblade',
    sourceBook: "Player's Handbook II v3.5, p. 19",
    hitDie: 8,
    babRate: 'good',
    fortSaveRate: 'good',
    refSaveRate: 'poor',
    willSaveRate: 'good',
    skillPointsPerLevel: 2,
    keyAbility: 'str',
    casterType: 'spontaneous',
    spellcastingStat: 'int',
    description: `Duskblades combine martial prowess with swift arcane magic, channeling touch spells directly through weapon strikes.`
  }
};

const SKILLS = {
  appraise: { id: 'appraise', name: 'Appraise', ability: 'int', trainedOnly: false, sourceBook: "Player's Handbook v3.5, p. 67", description: 'Determine value of common or rare objects.' },
  balance: { id: 'balance', name: 'Balance', ability: 'dex', trainedOnly: false, armorCheckPenalty: true, sourceBook: "Player's Handbook v3.5, p. 67", description: 'Walk on precarious surfaces or tightropes.' },
  bluff: { id: 'bluff', name: 'Bluff', ability: 'cha', trainedOnly: false, sourceBook: "Player's Handbook v3.5, p. 67", synergies: [{ target: 'diplomacy', bonus: 2, reqRanks: 5, note: '5+ ranks in Bluff gives +2 to Diplomacy' }], description: 'Deceive, feint in combat, or lie to NPCs.' },
  climb: { id: 'climb', name: 'Climb', ability: 'str', trainedOnly: false, armorCheckPenalty: true, sourceBook: "Player's Handbook v3.5, p. 69", description: 'Traverse vertical surfaces or ropes.' },
  concentration: { id: 'concentration', name: 'Concentration', ability: 'con', trainedOnly: false, sourceBook: "Player's Handbook v3.5, p. 69", description: 'Cast spells while taking damage or defensively in melee.' },
  diplomacy: { id: 'diplomacy', name: 'Diplomacy', ability: 'cha', trainedOnly: false, sourceBook: "Player's Handbook v3.5, p. 71", description: 'Negotiate, persuade NPCs, or settle arguments.' },
  hide: { id: 'hide', name: 'Hide', ability: 'dex', trainedOnly: false, armorCheckPenalty: true, sourceBook: "Player's Handbook v3.5, p. 76", description: 'Conceal yourself from observation behind cover.' },
  jump: { id: 'jump', name: 'Jump', ability: 'str', trainedOnly: false, armorCheckPenalty: true, sourceBook: "Player's Handbook v3.5, p. 77", synergies: [{ target: 'tumble', bonus: 2, reqRanks: 5, note: '5+ ranks in Jump gives +2 to Tumble' }], description: 'Leap over chasms or hurdles.' },
  knowledge_arcana: { id: 'knowledge_arcana', name: 'Knowledge (Arcana)', ability: 'int', trainedOnly: true, sourceBook: "Player's Handbook v3.5, p. 78", synergies: [{ target: 'spellcraft', bonus: 2, reqRanks: 5, note: '5+ ranks in Knowledge (Arcana) gives +2 to Spellcraft' }], description: 'Covers magic traditions, arcane symbols, dragons, and magical beasts.' },
  listen: { id: 'listen', name: 'Listen', ability: 'wis', trainedOnly: false, sourceBook: "Player's Handbook v3.5, p. 78", description: 'Hear approaching footsteps or hidden creatures.' },
  move_silently: { id: 'move_silently', name: 'Move Silently', ability: 'dex', trainedOnly: false, armorCheckPenalty: true, sourceBook: "Player's Handbook v3.5, p. 79", description: 'Creep past guards without making a sound.' },
  search: { id: 'search', name: 'Search', ability: 'int', trainedOnly: false, sourceBook: "Player's Handbook v3.5, p. 81", description: 'Examine an area closely for secret doors or traps.' },
  spellcraft: { id: 'spellcraft', name: 'Spellcraft', ability: 'int', trainedOnly: true, sourceBook: "Player's Handbook v3.5, p. 82", description: 'Identify spells being cast or analyze magic items.' },
  spot: { id: 'spot', name: 'Spot', ability: 'wis', trainedOnly: false, sourceBook: "Player's Handbook v3.5, p. 83", description: 'Notice hidden enemies or subtle visual details.' },
  tumble: { id: 'tumble', name: 'Tumble', ability: 'dex', trainedOnly: true, armorCheckPenalty: true, sourceBook: "Player's Handbook v3.5, p. 84", synergies: [{ target: 'balance', bonus: 2, reqRanks: 5, note: '5+ ranks in Tumble gives +2 to Balance' }, { target: 'jump', bonus: 2, reqRanks: 5, note: '5+ ranks in Tumble gives +2 to Jump' }], description: 'Roll safely past opponents without provoking attacks of opportunity.' }
};

const FEATS = {
  power_attack: { id: 'power_attack', name: 'Power Attack', type: 'General', prereqs: 'Str 13', sourceBook: "Player's Handbook v3.5, p. 98", description: `Subtract from attack rolls to add to melee damage rolls. Two-handed weapons add double the subtracted amount.` },
  cleave: { id: 'cleave', name: 'Cleave', type: 'General', prereqs: 'Str 13, Power Attack', sourceBook: "Player's Handbook v3.5, p. 92", description: `If you drop a foe, gain an immediate extra melee attack against another nearby target.` },
  weapon_focus: { id: 'weapon_focus', name: 'Weapon Focus', type: 'General', prereqs: 'Proficiency, BAB +1', sourceBook: "Player's Handbook v3.5, p. 102", description: `+1 bonus on all attack rolls with selected weapon.` },
  dodge: { id: 'dodge', name: 'Dodge', type: 'General', prereqs: 'Dex 13', sourceBook: "Player's Handbook v3.5, p. 93", description: `Designate an opponent for a +1 dodge bonus to Armor Class.` },
  improved_initiative: { id: 'improved_initiative', name: 'Improved Initiative', type: 'General', prereqs: 'None', sourceBook: "Player's Handbook v3.5, p. 96", description: `+4 bonus on initiative checks.` },
  leap_attack: { id: 'leap_attack', name: 'Leap Attack', type: 'Tactical', prereqs: 'Jump 8 ranks, Power Attack', sourceBook: "Complete Adventurer p. 110", description: `Combine a powerful jump with a charge attack to triple Power Attack damage on 2H weapons.` }
};

const SPELLS = {
  magic_missile: { id: 'magic_missile', name: 'Magic Missile', level: 'Sorcerer/Wizard 1', school: 'Evocation [Force]', castingTime: '1 std action', range: 'Medium', duration: 'Instant', sourceBook: "Player's Handbook v3.5, p. 251", description: `Fires missiles of magical force dealing 1d4+1 damage each.` },
  shield: { id: 'shield', name: 'Shield', level: 'Sorcerer/Wizard 1', school: 'Abjuration [Force]', castingTime: '1 std action', range: 'Personal', duration: '1 min/lvl', sourceBook: "Player's Handbook v3.5, p. 278", description: `Invisible force shield granting +4 shield AC and negating magic missiles.` },
  blade_of_blood: { id: 'blade_of_blood', name: 'Blade of Blood', level: 'Duskblade 1', school: 'Necromancy', castingTime: '1 swift action', range: 'Touch', duration: '1 rnd/lvl', sourceBook: "Spell Compendium, p. 30", description: `Infuses weapon to deal +1d6 extra damage (or +3d6 if sacrificing 5 HP).` },
  nightshield: { id: 'nightshield', name: 'Nightshield', level: 'Cleric 1, Sorcerer/Wizard 1', school: 'Abjuration', castingTime: '1 immediate action', range: 'Personal', duration: '1 min/lvl', sourceBook: "Spell Compendium, p. 148", description: `Grants +1 to +3 resistance bonus to saving throws and absorbs magic missiles.` }
};

const ITEM_SLOTS = [
  { id: 'head', name: 'Head / Headband' },
  { id: 'face', name: 'Face / Eyes' },
  { id: 'throat', name: 'Throat / Amulet' },
  { id: 'shoulders', name: 'Shoulders / Cloak' },
  { id: 'body', name: 'Body / Armor' },
  { id: 'torso', name: 'Torso / Vest' },
  { id: 'arms', name: 'Arms / Bracers' },
  { id: 'hands', name: 'Hands / Gloves' },
  { id: 'waist', name: 'Waist / Belt' },
  { id: 'feet', name: 'Feet / Boots' },
  { id: 'ring1', name: 'Ring 1' },
  { id: 'ring2', name: 'Ring 2' },
  { id: 'primary_weapon', name: 'Primary Weapon' },
  { id: 'offhand_shield', name: 'Offhand / Shield' }
];

const SAMPLE_EQUIPMENT = {
  jovar_blackstone: {
    id: 'jovar_blackstone',
    name: 'Jovar of Blackstone +4',
    slot: 'primary_weapon',
    weaponData: { damage: '2d8', critRange: '15-20x2', enhancement: 4, type: 'Slashing (Exotic 2H)', properties: ['Ghost Touch', 'Keen', 'Doom Burst', 'Sweeping'] },
    sourceBook: "Planar Handbook p. 69 / DM Custom",
    description: `A formidable +4 Jovar wrought of Blackstone. On a successful critical hit, the Doom Burst enchantment forces target to become shaken for 5 minutes. Includes Keen and Ghost Touch.`
  },
  impaling_spear: {
    id: 'impaling_spear',
    name: 'Impaling Spear +4 (Adamantine)',
    slot: 'primary_weapon',
    weaponData: { damage: '1d6', critRange: '20x2', enhancement: 4, type: 'Piercing (Simple 1H)', properties: ['Adamantine', 'Ghost Touch', 'Bleed DC 19'] },
    sourceBook: 'DM Custom Relic',
    description: `Shortspear +4 forged of adamantine with Ghost Touch. Each hit forces Fort save DC 19 or target bleeds.`
  },
  shield_guwenya: {
    id: 'shield_guwenya',
    name: 'Shield of Guwenya +4 (Kite Shield)',
    slot: 'offhand_shield',
    armorData: { shieldBonus: 6, maxDex: null, checkPenalty: -1 },
    sourceBook: 'DM Custom Relic',
    description: `Kite Shield +4. Activate to gain 25 elemental resistance and Evasion against spells of that element.`
  },
  belt_giant_strength: {
    id: 'belt_giant_strength',
    name: 'Belt of Giant Strength +4',
    slot: 'waist',
    statBonus: { stat: 'str', amount: 4, type: 'Enhancement' },
    sourceBook: "Dungeon Master's Guide v3.5, p. 248",
    description: `Heavy leather belt with iron studs granting a +4 enhancement bonus to Strength.`
  },
  cloak_resistance_3: {
    id: 'cloak_resistance_3',
    name: 'Cloak of Resistance +3',
    slot: 'shoulders',
    saveBonus: { amount: 3, type: 'Resistance' },
    sourceBook: "Dungeon Master's Guide v3.5, p. 253",
    description: `Fleece-lined mantle granting a +3 resistance bonus on all saving throws.`
  },
  ring_protection_2: {
    id: 'ring_protection_2',
    name: 'Ring of Protection +2',
    slot: 'ring1',
    acBonus: { amount: 2, type: 'Deflection' },
    sourceBook: "Dungeon Master's Guide v3.5, p. 230",
    description: `Continuous +2 deflection bonus to Armor Class.`
  }
};

const SAMPLE_CHARACTER = {
  id: 'sample_valerius',
  name: 'Valerius Blackstone',
  player: 'Tarum',
  alignment: 'Neutral Good',
  deity: 'Tempus',
  race: 'human',
  gender: 'Male',
  age: 28,
  height: `6'2"`,
  weight: '215 lbs',
  hp: { current: 38, max: 38, temp: 0 },
  classes: [
    { classId: 'fighter', level: 2 },
    { classId: 'duskblade', level: 2 }
  ],
  useFractionalBAB: true,
  useFractionalSaves: true,
  baseAbilityScores: { str: 14, dex: 14, con: 14, int: 14, wis: 10, cha: 12 },
  dmCustomCasting: { enabled: false, casterType: 'wizard', customCasterLevel: 4 },
  customBonuses: [
    { id: 'b1', name: 'Belt of Strength', target: 'str', amount: 4, type: 'Enhancement', source: 'Belt of Giant Strength +4' },
    { id: 'b2', name: 'Cloak Saves', target: 'saves', amount: 3, type: 'Resistance', source: 'Cloak of Resistance +3' },
    { id: 'b3', name: 'Ring Deflection', target: 'ac', amount: 2, type: 'Deflection', source: 'Ring of Protection +2' },
    { id: 'b4', name: 'DM Sacred Blessing', target: 'will', amount: 2, type: 'Sacred', source: 'DM Custom Override' }
  ],
  skillRanks: { concentration: 7, intimidate: 5, jump: 5, knowledge_arcana: 4, spellcraft: 5, tumble: 5 },
  feats: ['power_attack', 'cleave', 'weapon_focus', 'dodge', 'leap_attack'],
  equippedSlots: {
    primary_weapon: 'jovar_blackstone',
    offhand_shield: 'shield_guwenya',
    waist: 'belt_giant_strength',
    shoulders: 'cloak_resistance_3',
    ring1: 'ring_protection_2'
  },
  spellsKnown: ['blade_of_blood', 'nightshield', 'magic_missile', 'shield'],
  spellSlots: { level1: { total: 4, used: 1 } },
  bio: `Valerius is a veteran spellblade of Blackstone Keep. Trained in traditional swordplay before unlocking innate Duskblade magic, he charges into battle wielding legendary arms and channeling touch spells through heavy strikes.`,
  notes: `Impaling Spear deals Fort DC 19 on hit or bleed 1. Shield of Guwenya grants 25 energy resistance + Evasion as a standard action.`
};


/* ==========================================================================
   2. DICE ROLLER UTILITY
   ========================================================================== */

let rollLog = [
  { id: 1, label: 'Initiative Check', dice: '1d20+2', roll: 18, modifier: 2, total: 20, isNat20: false, isNat1: false, time: 'Just now' }
];

function rollDice(sides, modifier = 0, label = 'Custom Roll') {
  const roll = Math.floor(Math.random() * sides) + 1;
  const total = roll + modifier;
  const isNat20 = sides === 20 && roll === 20;
  const isNat1 = sides === 20 && roll === 1;

  const entry = {
    id: Date.now(),
    label,
    dice: `1d${sides}${modifier >= 0 ? '+' + modifier : modifier}`,
    roll,
    modifier,
    total,
    isNat20,
    isNat1,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  rollLog.unshift(entry);
  if (rollLog.length > 25) rollLog.pop();

  return entry;
}

function clearRollLog() {
  rollLog = [];
}


/* ==========================================================================
   3. D&D RULES & CALCULATIONS ENGINE
   ========================================================================== */

function calculateAbilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

function calculateTotalAbilityScores(char) {
  const base = { ...char.baseAbilityScores };
  const race = RACES[char.race] || RACES.human;

  Object.keys(base).forEach(stat => {
    base[stat] += (race.abilityMods[stat] || 0);
  });

  (char.customBonuses || []).forEach(bonus => {
    if (base[bonus.target] !== undefined) {
      base[bonus.target] += Number(bonus.amount) || 0;
    }
  });

  const mods = {};
  Object.keys(base).forEach(stat => {
    mods[stat] = calculateAbilityModifier(base[stat]);
  });

  return { scores: base, mods };
}

function calculateBAB(char) {
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

  const attacks = [];
  let currentAttack = finalBAB;
  while (currentAttack > 0) {
    attacks.push(`+${currentAttack}`);
    currentAttack -= 5;
  }
  if (attacks.length === 0) attacks.push('+0');

  return { bab: finalBAB, attackRoutine: attacks.join('/') };
}

function calculateSaves(char, abilityMods) {
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

function calculateArmorClass(char, dexMod) {
  let armorBonus = 0;
  let shieldBonus = 0;
  let maxDexLimit = null;
  let checkPenalty = 0;
  let deflectionBonus = 0;

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

  (char.customBonuses || []).forEach(b => {
    if (b.target === 'ac') deflectionBonus += Number(b.amount) || 0;
  });

  const effectiveDex = maxDexLimit !== null ? Math.min(dexMod, maxDexLimit) : dexMod;
  const sizeMod = 0;

  const totalAC = 10 + armorBonus + shieldBonus + effectiveDex + deflectionBonus + sizeMod;
  const touchAC = 10 + effectiveDex + deflectionBonus + sizeMod;
  const flatFootedAC = 10 + armorBonus + shieldBonus + deflectionBonus + sizeMod;

  return { total: totalAC, touch: touchAC, flatFooted: flatFootedAC, armorBonus, shieldBonus, effectiveDex, deflectionBonus, checkPenalty };
}

function calculateSkills(char, abilityMods, armorCheckPenalty) {
  const skillRanks = char.skillRanks || {};
  const skillTotals = {};

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

    skillTotals[skillId] = { ranks, abilityMod, synergy, penalty, customBonus, total, isTrained: ranks > 0 || !skillDef.trainedOnly };
  });

  return skillTotals;
}

function calculateCarryingCapacity(strScore) {
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


/* ==========================================================================
   4. UI COMPONENTS (Navigation, Combat, Roleplay, Builder, DM, Modals)
   ========================================================================== */

function renderNavigation(activeTab, charName) {
  return `
    <header class="app-header">
      <div class="brand-title">
        <span style="font-size:1.5rem;">⚔️</span>
        <h1>D&D 3.5e Character Creator</h1>
        <span class="brand-badge">SRD + Expanded Books</span>
      </div>

      <nav class="nav-tabs">
        <button class="nav-tab ${activeTab === 'combat' ? 'active' : ''}" data-tab="combat">
          <span>⚔️</span> Combat Sheet
        </button>
        <button class="nav-tab ${activeTab === 'roleplay' ? 'active' : ''}" data-tab="roleplay">
          <span>📜</span> Roleplay & Bio
        </button>
        <button class="nav-tab ${activeTab === 'builder' ? 'active' : ''}" data-tab="builder">
          <span>🛠️</span> Character Builder
        </button>
        <button class="nav-tab ${activeTab === 'dm_overrides' ? 'active' : ''}" data-tab="dm_overrides">
          <span>⚙️</span> DM Overrides
        </button>
      </nav>

      <div class="header-actions">
        <button class="btn-secondary" id="btn-export-json" title="Export Character to JSON">📥 Export</button>
        <label class="btn-secondary" style="cursor:pointer;" title="Import Character JSON">
          📤 Import
          <input type="file" id="file-import-json" accept=".json" style="display:none;" />
        </label>
        <button class="btn-secondary" id="btn-reset-sample" title="Reload Sample Character">🔄 Reload Sample</button>
      </div>
    </header>
  `;
}

function renderCombatTab(char) {
  const race = RACES[char.race] || RACES.human;
  const { scores, mods } = calculateTotalAbilityScores(char);
  const babData = calculateBAB(char);
  const saves = calculateSaves(char, mods);
  const ac = calculateArmorClass(char, mods.dex);

  const initBonus = mods.dex + (char.feats.includes('improved_initiative') ? 4 : 0);
  const totalLevel = char.classes.reduce((sum, c) => sum + c.level, 0);
  const classString = char.classes.map(c => `${CLASSES[c.classId]?.name || c.classId} ${c.level}`).join(' / ');

  return `
    <div class="combat-tab-view">
      <div class="char-summary-bar">
        <div style="display:flex; align-items:center; gap:1rem;">
          <div class="char-portrait-mini" style="background:rgba(212,175,55,0.1);display:flex;align-items:center;justify-content:center;font-size:1.8rem;">
            ⚔️
          </div>
          <div>
            <h2>${char.name}</h2>
            <div class="char-summary-meta">
              <span class="char-meta-pill">Lvl ${totalLevel} ${race.name}</span>
              <span class="char-meta-pill">${classString}</span>
              <span class="char-meta-pill">${char.alignment}</span>
              ${char.useFractionalBAB ? '<span class="char-meta-pill" style="border-color:var(--purple-accent);color:#c4b5fd;">Unearthed Arcana Fractional Rules</span>' : ''}
            </div>
          </div>
        </div>

        <div style="background:rgba(10,14,25,0.85); border:1px solid var(--border-gold); padding:0.6rem 1.2rem; border-radius:12px; display:flex; align-items:center; gap:1.2rem;">
          <div>
            <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Hit Points (HP)</div>
            <div style="font-size:1.5rem; font-weight:700; color:#ef4444; font-family:var(--font-heading);">
              ${char.hp.current} <span style="font-size:0.9rem; color:var(--text-muted);">/ ${char.hp.max}</span>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            <div style="display:flex; gap:0.3rem;">
              <button class="btn-secondary btn-hp-mod" data-mod="-5" style="padding:0.15rem 0.4rem;font-size:0.75rem;">-5</button>
              <button class="btn-secondary btn-hp-mod" data-mod="-1" style="padding:0.15rem 0.4rem;font-size:0.75rem;">-1</button>
              <button class="btn-secondary btn-hp-mod" data-mod="+1" style="padding:0.15rem 0.4rem;font-size:0.75rem;">+1</button>
              <button class="btn-secondary btn-hp-mod" data-mod="+5" style="padding:0.15rem 0.4rem;font-size:0.75rem;">+5</button>
            </div>
          </div>
        </div>

        <div class="char-summary-stats">
          <div class="summary-stat-box highlight">
            <div class="summary-stat-label">Armor Class</div>
            <div class="summary-stat-value">${ac.total}</div>
          </div>
          <div class="summary-stat-box">
            <div class="summary-stat-label">Initiative</div>
            <div class="summary-stat-value" style="cursor:pointer;" id="btn-roll-init" title="Click to Roll Initiative">
              ${initBonus >= 0 ? '+' + initBonus : initBonus}
            </div>
          </div>
          <div class="summary-stat-box">
            <div class="summary-stat-label">BAB</div>
            <div class="summary-stat-value">+${babData.bab}</div>
          </div>
        </div>
      </div>

      <div class="ability-grid">
        ${Object.keys(scores).map(stat => `
          <div class="ability-card">
            <div class="ability-name">${stat.toUpperCase()}</div>
            <div class="ability-score">${scores[stat]}</div>
            <div class="ability-mod">${mods[stat] >= 0 ? '+' + mods[stat] : mods[stat]}</div>
          </div>
        `).join('')}
      </div>

      <div class="grid-main-side">
        <div>
          <div class="panel gold-border">
            <div class="panel-header">
              <h3 class="panel-title">⚔️ Combat Attacks & Weapon Routines</h3>
              <span style="font-size:0.8rem; color:var(--text-muted);">Base Attack: <strong>${babData.attackRoutine}</strong></span>
            </div>

            ${Object.keys(char.equippedSlots || {}).map(slotId => {
              const itemId = char.equippedSlots[slotId];
              const item = SAMPLE_EQUIPMENT[itemId];
              if (!item || !item.weaponData) return '';
              const w = item.weaponData;
              const atkBonus = babData.bab + mods.str + w.enhancement;
              const dmgBonus = mods.str + w.enhancement;

              return `
                <div class="weapon-card">
                  <div class="weapon-name">
                    <h4 class="rule-book-trigger" data-itemid="${item.id}" style="cursor:pointer;display:inline-block;">${item.name} 📖</h4>
                    <p>${w.type} &bull; ${w.properties.join(', ')}</p>
                  </div>
                  <div>
                    <div style="font-size:0.7rem;color:var(--text-muted);">Attack Bonus</div>
                    <div style="font-weight:700;color:var(--gold-light);font-size:1.1rem;">
                      +${atkBonus} <span style="font-size:0.75rem;color:var(--text-muted);">(${babData.attackRoutine.split('/').map(b => '+' + (parseInt(b) + mods.str + w.enhancement)).join('/')})</span>
                    </div>
                  </div>
                  <div>
                    <div style="font-size:0.7rem;color:var(--text-muted);">Damage / Crit</div>
                    <div style="font-weight:700;color:var(--text-main);">${w.damage} + ${dmgBonus} <span style="font-size:0.8rem;color:var(--gold-primary);">(${w.critRange})</span></div>
                  </div>
                  <div style="display:flex; gap:0.5rem;">
                    <button class="btn-roll btn-roll-weapon-atk" data-name="${item.name}" data-mod="${atkBonus}">⚔️ Attack</button>
                    <button class="btn-roll crimson btn-roll-weapon-dmg" data-name="${item.name}" data-dice="${w.damage}" data-mod="${dmgBonus}">💥 Damage</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">✨ Arcane / Divine Spells & Daily Slots</h3>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
              <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); padding:0.75rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:0.8rem; font-weight:600;">1st-Level Spell Slots</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">DC: ${10 + 1 + mods.int}</div>
                </div>
                <div style="font-weight:700; font-size:1.1rem; color:var(--gold-light);">
                  ${char.spellSlots?.level1?.used || 0} / ${char.spellSlots?.level1?.total || 4}
                </div>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${(char.spellsKnown || []).map(spellId => {
                const s = SPELLS[spellId];
                if (!s) return '';
                return `
                  <div style="background:rgba(15,21,35,0.8); border:1px solid var(--border-subtle); padding:0.6rem 0.8rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <strong class="rule-book-trigger" data-spellid="${s.id}" style="color:var(--gold-light); cursor:pointer;">${s.name} 📖</strong>
                      <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.5rem;">(${s.level} &bull; ${s.castingTime})</span>
                    </div>
                    <button class="btn-secondary btn-cast-spell" data-name="${s.name}" style="padding:0.2rem 0.6rem; font-size:0.75rem;">✨ Cast Spell</button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">🛡️ Defense & Saving Throws</h3>
            </div>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.5rem; margin-bottom:1rem; text-align:center;">
              <div style="background:rgba(10,14,25,0.8); border:1px solid var(--border-gold); padding:0.5rem; border-radius:8px;">
                <div style="font-size:0.65rem; color:var(--text-muted);">Normal AC</div>
                <div style="font-size:1.3rem; font-weight:700; color:var(--gold-light);">${ac.total}</div>
              </div>
              <div style="background:rgba(10,14,25,0.8); border:1px solid var(--border-subtle); padding:0.5rem; border-radius:8px;">
                <div style="font-size:0.65rem; color:var(--text-muted);">Touch AC</div>
                <div style="font-size:1.3rem; font-weight:700; color:var(--text-main);">${ac.touch}</div>
              </div>
              <div style="background:rgba(10,14,25,0.8); border:1px solid var(--border-subtle); padding:0.5rem; border-radius:8px;">
                <div style="font-size:0.65rem; color:var(--text-muted);">Flat-Footed</div>
                <div style="font-size:1.3rem; font-weight:700; color:var(--text-main);">${ac.flatFooted}</div>
              </div>
            </div>

            <div class="saves-grid" style="grid-template-columns:1fr; gap:0.6rem;">
              <div class="save-box">
                <div class="save-info">
                  <h4>Fortitude (CON)</h4>
                  <p>Base: +${saves.fort.base} | Con: +${saves.fort.mod}</p>
                </div>
                <div class="save-val btn-roll-save" data-name="Fortitude Save" data-mod="${saves.fort.total}">+${saves.fort.total}</div>
              </div>
              <div class="save-box">
                <div class="save-info">
                  <h4>Reflex (DEX)</h4>
                  <p>Base: +${saves.ref.base} | Dex: +${saves.ref.mod}</p>
                </div>
                <div class="save-val btn-roll-save" data-name="Reflex Save" data-mod="${saves.ref.total}">+${saves.ref.total}</div>
              </div>
              <div class="save-box">
                <div class="save-info">
                  <h4>Will (WIS)</h4>
                  <p>Base: +${saves.will.base} | Wis: +${saves.will.mod}</p>
                </div>
                <div class="save-val btn-roll-save" data-name="Will Save" data-mod="${saves.will.total}">+${saves.will.total}</div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">⚡ Active Buffs & Custom Modifiers</h3>
            </div>
            <div>
              ${(char.customBonuses || []).length === 0 ? '<p style="font-size:0.85rem;color:var(--text-muted);">No active custom bonuses registered.</p>' : ''}
              ${(char.customBonuses || []).map(b => `
                <div class="bonus-tag ${b.source.includes('DM') ? 'dm-override' : ''}">
                  <strong>${b.name}:</strong> +${b.amount} ${b.target.toUpperCase()} (${b.type})
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRoleplayTab(char) {
  const { scores, mods } = calculateTotalAbilityScores(char);
  const ac = calculateArmorClass(char, mods.dex);
  const skills = calculateSkills(char, mods, ac.checkPenalty);
  const capacity = calculateCarryingCapacity(scores.str);

  return `
    <div class="roleplay-tab-view">
      <div class="grid-main-side" style="margin-bottom:1.5rem;">
        <div class="panel gold-border">
          <div class="panel-header">
            <h3 class="panel-title">📜 Character Bio & Identity</h3>
          </div>
          <div class="grid-2col" style="margin-bottom:1rem; font-size:0.9rem;">
            <div><strong>Character Name:</strong> ${char.name}</div>
            <div><strong>Player:</strong> ${char.player || 'Player'}</div>
            <div><strong>Alignment:</strong> ${char.alignment}</div>
            <div><strong>Deity:</strong> ${char.deity}</div>
            <div><strong>Gender / Age:</strong> ${char.gender}, ${char.age} yrs</div>
            <div><strong>Height / Weight:</strong> ${char.height}, ${char.weight}</div>
          </div>
          <div style="margin-bottom:1rem;">
            <strong style="color:var(--gold-light);">Background & Personality:</strong>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem; line-height:1.5;">${char.bio}</p>
          </div>
          <div>
            <strong style="color:var(--gold-light);">Quest Notes & Relics:</strong>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">${char.notes}</p>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">🎒 Carrying Capacity</h3>
          </div>
          <div style="text-align:center; margin-bottom:1rem;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Strength Score: ${scores.str}</div>
            <div style="font-size:1.4rem; font-weight:700; color:var(--gold-light);">${capacity.light} lbs Max Light Load</div>
          </div>
          <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:0.5rem;">
            <div style="display:flex; justify-content:space-between; background:rgba(10,14,25,0.7); padding:0.4rem 0.8rem; border-radius:6px;">
              <span>Light Load:</span> <strong>0 - ${capacity.light} lbs</strong>
            </div>
            <div style="display:flex; justify-content:space-between; background:rgba(10,14,25,0.7); padding:0.4rem 0.8rem; border-radius:6px;">
              <span>Medium Load:</span> <strong>${capacity.light + 1} - ${capacity.medium} lbs</strong>
            </div>
            <div style="display:flex; justify-content:space-between; background:rgba(10,14,25,0.7); padding:0.4rem 0.8rem; border-radius:6px;">
              <span>Heavy Load:</span> <strong>${capacity.medium + 1} - ${capacity.heavy} lbs</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="panel gold-border" style="margin-bottom:1.5rem;">
        <div class="panel-header">
          <h3 class="panel-title">🛡️ Magic Items & Equipment Slots</h3>
        </div>
        <div class="equipment-slots-grid">
          ${ITEM_SLOTS.map(slot => {
            const itemId = char.equippedSlots[slot.id];
            const item = SAMPLE_EQUIPMENT[itemId];

            return `
              <div class="equipment-slot-card">
                <div class="slot-icon">💎</div>
                <div class="slot-details" style="flex:1;">
                  <h5>${slot.name}</h5>
                  ${item ? `
                    <div class="slot-item-name rule-book-trigger" data-itemid="${item.id}">
                      ${item.name} 📖
                    </div>
                  ` : `
                    <span style="font-size:0.8rem; color:var(--text-muted); italic;">(Empty Slot)</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="panel" style="margin-bottom:1.5rem;">
        <div class="panel-header">
          <h3 class="panel-title">📊 Skill Ranks & Synergy Matrix</h3>
          <span style="font-size:0.8rem; color:var(--text-muted);">Armor Penalty: <strong>${ac.checkPenalty}</strong></span>
        </div>

        <div class="skills-table-container">
          <table class="skills-table">
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Key Ability</th>
                <th>Ranks</th>
                <th>Ability Mod</th>
                <th>Synergy</th>
                <th>ACP</th>
                <th>Total Mod</th>
                <th>Roll Check</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(SKILLS).map(skillId => {
                const s = SKILLS[skillId];
                const calc = skills[skillId];
                if (!calc) return '';

                return `
                  <tr>
                    <td>
                      <span class="skill-name rule-book-trigger" data-skillid="${s.id}">
                        ${s.name} ${s.trainedOnly ? '🔒' : ''} 📖
                      </span>
                    </td>
                    <td style="text-transform:uppercase; font-size:0.75rem; color:var(--text-muted);">${s.ability}</td>
                    <td><strong>${calc.ranks}</strong></td>
                    <td>${calc.abilityMod >= 0 ? '+' + calc.abilityMod : calc.abilityMod}</td>
                    <td>${calc.synergy > 0 ? `<span class="synergy-badge">+${calc.synergy} Synergy</span>` : '-'}</td>
                    <td>${s.armorCheckPenalty ? calc.penalty : 0}</td>
                    <td style="font-weight:700; color:var(--gold-light); font-size:0.95rem;">
                      ${calc.total >= 0 ? '+' + calc.total : calc.total}
                    </td>
                    <td>
                      <button class="btn-roll btn-roll-skill" data-name="${s.name} Check" data-mod="${calc.total}" style="padding:0.2rem 0.5rem; font-size:0.75rem;">
                        ⚡ Roll
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">🏅 Feats & Special Abilities</h3>
        </div>
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem;">
          ${(char.feats || []).map(featId => {
            const f = FEATS[featId];
            if (!f) return '';
            return `
              <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); border-radius:8px; padding:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong class="rule-book-trigger" data-featid="${f.id}" style="color:var(--gold-light); cursor:pointer;">
                    ${f.name} 📖
                  </strong>
                  <span class="rulebook-badge">${f.type}</span>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">
                  Prereqs: ${f.prereqs}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderBuilderTab(char) {
  return `
    <div class="builder-tab-view">
      <div class="panel gold-border">
        <div class="panel-header">
          <h3 class="panel-title">🛠️ Interactive Character Builder & Level Up</h3>
        </div>

        <form id="form-builder" style="display:flex; flex-direction:column; gap:1.5rem;">
          <div class="grid-2col">
            <div class="form-group">
              <label class="form-label">Character Name</label>
              <input type="text" class="form-input" id="builder-name" value="${char.name}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Player Name</label>
              <input type="text" class="form-input" id="builder-player" value="${char.player || ''}" />
            </div>
          </div>

          <div class="grid-2col">
            <div class="form-group">
              <label class="form-label">Race</label>
              <select class="form-select" id="builder-race">
                ${Object.keys(RACES).map(raceId => `
                  <option value="${raceId}" ${char.race === raceId ? 'selected' : ''}>
                    ${RACES[raceId].name} (${RACES[raceId].size}, Speed ${RACES[raceId].speed}ft)
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Alignment</label>
              <select class="form-select" id="builder-alignment">
                <option value="Lawful Good" ${char.alignment === 'Lawful Good' ? 'selected' : ''}>Lawful Good</option>
                <option value="Neutral Good" ${char.alignment === 'Neutral Good' ? 'selected' : ''}>Neutral Good</option>
                <option value="Chaotic Good" ${char.alignment === 'Chaotic Good' ? 'selected' : ''}>Chaotic Good</option>
                <option value="True Neutral" ${char.alignment === 'True Neutral' ? 'selected' : ''}>True Neutral</option>
                <option value="Chaotic Evil" ${char.alignment === 'Chaotic Evil' ? 'selected' : ''}>Chaotic Evil</option>
              </select>
            </div>
          </div>

          <div>
            <h4 style="color:var(--gold-light); margin-bottom:0.75rem;">Base Ability Scores (Before Race / Items)</h4>
            <div class="grid-3col">
              ${Object.keys(char.baseAbilityScores).map(stat => `
                <div class="form-group">
                  <label class="form-label">${stat.toUpperCase()}</label>
                  <input type="number" min="3" max="25" class="form-input builder-base-stat" data-stat="${stat}" value="${char.baseAbilityScores[stat]}" />
                </div>
              `).join('')}
            </div>
          </div>

          <div>
            <h4 style="color:var(--gold-light); margin-bottom:0.75rem;">Class & Multiclass Levels</h4>
            <div class="grid-2col">
              <div class="form-group">
                <label class="form-label">Primary Class Level (Fighter)</label>
                <input type="number" min="0" max="20" class="form-input" id="builder-cls-fighter" value="${char.classes.find(c => c.classId === 'fighter')?.level || 0}" />
              </div>
              <div class="form-group">
                <label class="form-label">Secondary Class Level (Duskblade / Wizard)</label>
                <input type="number" min="0" max="20" class="form-input" id="builder-cls-duskblade" value="${char.classes.find(c => c.classId === 'duskblade')?.level || 0}" />
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <button type="submit" class="btn-primary" style="padding:0.75rem 2rem;">💾 Save & Update Character</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderDMOverridesTab(char) {
  return `
    <div class="dm-overrides-tab-view">
      <div class="panel gold-border" style="margin-bottom:1.5rem;">
        <div class="panel-header">
          <h3 class="panel-title">📚 Unearthed Arcana Fractional Rules</h3>
        </div>
        <div class="grid-2col">
          <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); padding:1rem; border-radius:8px;">
            <label style="display:flex; align-items:center; gap:0.75rem; cursor:pointer;">
              <input type="checkbox" id="toggle-fractional-bab" ${char.useFractionalBAB ? 'checked' : ''} style="width:18px;height:18px;" />
              <div>
                <strong style="color:var(--gold-light);">Enable Fractional Base Attack Bonus (BAB)</strong>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
                  Sums fractional BAB per level (+1.0 Good, +0.75 Average, +0.5 Poor) before rounding down.
                </p>
              </div>
            </label>
          </div>

          <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); padding:1rem; border-radius:8px;">
            <label style="display:flex; align-items:center; gap:0.75rem; cursor:pointer;">
              <input type="checkbox" id="toggle-fractional-saves" ${char.useFractionalSaves ? 'checked' : ''} style="width:18px;height:18px;" />
              <div>
                <strong style="color:var(--gold-light);">Enable Fractional Base Saving Throws</strong>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
                  Grants +2.0 base save bonus only the first time a good save is gained across all classes.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="panel gold-border" style="margin-bottom:1.5rem;">
        <div class="panel-header">
          <h3 class="panel-title">✨ DM Custom Spellcasting Assignment</h3>
        </div>

        <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); padding:1rem; border-radius:8px;">
          <label style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem; cursor:pointer;">
            <input type="checkbox" id="toggle-dm-casting" ${char.dmCustomCasting?.enabled ? 'checked' : ''} style="width:18px;height:18px;" />
            <div>
              <strong style="color:var(--gold-light);">Grant Custom Spellcasting to Non-Caster Classes</strong>
              <p style="font-size:0.8rem; color:var(--text-muted);">Allows non-caster classes to cast spells scaling with Character Level.</p>
            </div>
          </label>

          <div class="grid-2col" style="display:${char.dmCustomCasting?.enabled ? 'grid' : 'none'};" id="dm-casting-options">
            <div class="form-group">
              <label class="form-label">Spellcasting Progression Class</label>
              <select class="form-select" id="dm-caster-type">
                <option value="wizard" ${char.dmCustomCasting?.casterType === 'wizard' ? 'selected' : ''}>Wizard (Arcane Prepared)</option>
                <option value="sorcerer" ${char.dmCustomCasting?.casterType === 'sorcerer' ? 'selected' : ''}>Sorcerer (Arcane Spontaneous)</option>
                <option value="cleric" ${char.dmCustomCasting?.casterType === 'cleric' ? 'selected' : ''}>Cleric (Divine Prepared)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Custom Caster Level Override</label>
              <input type="number" min="1" max="20" class="form-input" id="dm-caster-level" value="${char.dmCustomCasting?.customCasterLevel || 4}" />
            </div>
          </div>
        </div>
      </div>

      <div class="panel gold-border">
        <div class="panel-header">
          <h3 class="panel-title">➕ Add Custom Bonus / Stat Override</h3>
        </div>

        <form id="form-add-bonus" style="display:flex; flex-direction:column; gap:1rem; margin-bottom:1.5rem;">
          <div class="grid-3col">
            <div class="form-group">
              <label class="form-label">Bonus Name / Label</label>
              <input type="text" class="form-input" id="bonus-name" placeholder="e.g. DM Sacred Blessing" required />
            </div>
            <div class="form-group">
              <label class="form-label">Target Stat / Parameter</label>
              <select class="form-select" id="bonus-target">
                <option value="str">Strength (STR)</option>
                <option value="dex">Dexterity (DEX)</option>
                <option value="con">Constitution (CON)</option>
                <option value="int">Intelligence (INT)</option>
                <option value="wis">Wisdom (WIS)</option>
                <option value="cha">Charisma (CHA)</option>
                <option value="ac">Armor Class (AC)</option>
                <option value="fort">Fortitude Save</option>
                <option value="ref">Reflex Save</option>
                <option value="will">Will Save</option>
                <option value="saves">All Saving Throws</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Bonus Value / Amount</label>
              <input type="number" class="form-input" id="bonus-amount" placeholder="e.g. +2" required />
            </div>
          </div>

          <div class="grid-2col">
            <div class="form-group">
              <label class="form-label">Bonus Type</label>
              <select class="form-select" id="bonus-type">
                <option value="Enhancement">Enhancement</option>
                <option value="Morale">Morale</option>
                <option value="Luck">Luck</option>
                <option value="Sacred">Sacred</option>
                <option value="Deflection">Deflection</option>
                <option value="DM Override">DM Override</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source Description</label>
              <input type="text" class="form-input" id="bonus-source" placeholder="e.g. House Rule / Relic" />
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <button type="submit" class="btn-primary">➕ Add Bonus to Stack</button>
          </div>
        </form>

        <div>
          <h4 style="color:var(--gold-light); margin-bottom:0.75rem;">Current Active Custom Bonuses</h4>
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            ${(char.customBonuses || []).map((b, idx) => `
              <div style="background:rgba(10,14,25,0.7); border:1px solid var(--border-subtle); padding:0.6rem 0.8rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong style="color:var(--gold-light);">${b.name}</strong>
                  <span style="font-size:0.8rem; color:var(--text-muted); margin-left:0.5rem;">
                    &rarr; +${b.amount} ${b.target.toUpperCase()} (${b.type}) &bull; ${b.source}
                  </span>
                </div>
                <button class="btn-secondary btn-delete-bonus" data-index="${idx}" style="color:#ef4444; border-color:rgba(239,68,68,0.4); padding:0.2rem 0.6rem; font-size:0.75rem;">
                  🗑️ Remove
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRulebookModal(itemData) {
  if (!itemData) return '';

  return `
    <div class="modal-overlay" id="rulebook-modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <span class="rulebook-badge">${itemData.sourceBook || 'D&D 3.5e Rulebook'}</span>
            <h3 class="modal-title" style="margin-top: 0.25rem;">${itemData.name || itemData.id}</h3>
          </div>
          <button class="btn-close" id="btn-close-modal">&times;</button>
        </div>
        <div class="modal-body">
          ${itemData.prereqs ? `<div class="modal-meta-grid"><div><strong>Prerequisites:</strong> ${itemData.prereqs}</div><div><strong>Type:</strong> ${itemData.type || 'Feat'}</div></div>` : ''}
          ${itemData.level ? `<div class="modal-meta-grid"><div><strong>Spell Level:</strong> ${itemData.level}</div><div><strong>School:</strong> ${itemData.school}</div></div>` : ''}
          ${itemData.castingTime ? `<div class="modal-meta-grid"><div><strong>Casting Time:</strong> ${itemData.castingTime}</div><div><strong>Range:</strong> ${itemData.range}</div></div>` : ''}
          ${itemData.weaponData ? `<div class="modal-meta-grid"><div><strong>Damage:</strong> ${itemData.weaponData.damage} (${itemData.weaponData.critRange})</div><div><strong>Type:</strong> ${itemData.weaponData.type}</div></div>` : ''}
          ${itemData.traits ? `<div style="margin-bottom:1rem;"><strong>Racial Traits:</strong><ul>${itemData.traits.map(t => `<li style="margin-left:1.2rem;margin-top:0.2rem;">${t}</li>`).join('')}</ul></div>` : ''}
          
          <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--gold-primary);">
            <p style="white-space: pre-line;">${itemData.description || 'No detailed book description available.'}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDiceRollerDock() {
  return `
    <div class="dice-roller-dock">
      <div class="dice-dock-header">
        <h4>⚡ Interactive Dice Roller</h4>
        <span style="font-size:0.7rem; color:var(--text-muted);">D&D 3.5e</span>
      </div>

      <div class="dice-btns">
        <button class="btn-dice" data-sides="20">d20</button>
        <button class="btn-dice" data-sides="12">d12</button>
        <button class="btn-dice" data-sides="10">d10</button>
        <button class="btn-dice" data-sides="8">d8</button>
        <button class="btn-dice" data-sides="6">d6</button>
        <button class="btn-dice" data-sides="4">d4</button>
        <button class="btn-dice" data-sides="100">d%</button>
        <button class="btn-dice" id="btn-clear-dice-log" style="background:rgba(220,38,38,0.2);border-color:var(--crimson-primary);color:#fca5a5;">Clear</button>
      </div>

      <div class="dice-log">
        ${rollLog.length === 0 ? '<div style="color:var(--text-muted);text-align:center;">No rolls recorded yet.</div>' : ''}
        ${rollLog.map(log => `
          <div class="dice-log-entry ${log.isNat20 ? 'nat20' : ''} ${log.isNat1 ? 'nat1' : ''}">
            <strong>${log.label}:</strong> rolled <span>${log.dice}</span> 
            &rarr; [${log.roll}] ${log.modifier >= 0 ? '+' + log.modifier : log.modifier} = 
            <strong style="font-size:0.9rem;color:${log.isNat20 ? '#4ade80' : log.isNat1 ? '#f87171' : 'var(--gold-light)'}">${log.total}</strong>
            ${log.isNat20 ? '🔥 NAT 20!' : ''} ${log.isNat1 ? '💀 NAT 1!' : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}


/* ==========================================================================
   5. APPLICATION CONTROLLER & STATE MANAGER
   ========================================================================== */

class DndApp {
  constructor() {
    this.activeTab = 'combat';
    this.modalData = null;
    
    const saved = localStorage.getItem('dnd35_character');
    if (saved) {
      try {
        this.character = JSON.parse(saved);
      } catch (e) {
        this.character = JSON.parse(JSON.stringify(SAMPLE_CHARACTER));
      }
    } else {
      this.character = JSON.parse(JSON.stringify(SAMPLE_CHARACTER));
    }

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  saveState() {
    localStorage.setItem('dnd35_character', JSON.stringify(this.character));
  }

  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    let contentHtml = '';
    switch (this.activeTab) {
      case 'combat':
        contentHtml = renderCombatTab(this.character);
        break;
      case 'roleplay':
        contentHtml = renderRoleplayTab(this.character);
        break;
      case 'builder':
        contentHtml = renderBuilderTab(this.character);
        break;
      case 'dm_overrides':
        contentHtml = renderDMOverridesTab(this.character);
        break;
      default:
        contentHtml = renderCombatTab(this.character);
    }

    appEl.innerHTML = `
      ${renderNavigation(this.activeTab, this.character.name)}
      <main class="main-container">
        ${contentHtml}
      </main>
      ${renderDiceRollerDock()}
      ${renderRulebookModal(this.modalData)}
    `;

    this.bindDynamicEvents();
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.nav-tab');
      if (tabBtn) {
        this.activeTab = tabBtn.dataset.tab;
        this.render();
        return;
      }

      const trigger = e.target.closest('.rule-book-trigger');
      if (trigger) {
        const itemid = trigger.dataset.itemid;
        const featid = trigger.dataset.featid;
        const spellid = trigger.dataset.spellid;
        const skillid = trigger.dataset.skillid;

        if (itemid) this.modalData = SAMPLE_EQUIPMENT[itemid];
        else if (featid) this.modalData = FEATS[featid];
        else if (spellid) this.modalData = SPELLS[spellid];
        else if (skillid) this.modalData = SKILLS[skillid];

        this.render();
        return;
      }

      if (e.target.id === 'btn-close-modal' || e.target.id === 'rulebook-modal-overlay') {
        this.modalData = null;
        this.render();
        return;
      }

      if (e.target.classList.contains('btn-roll-weapon-atk')) {
        const name = e.target.dataset.name;
        const mod = parseInt(e.target.dataset.mod) || 0;
        rollDice(20, mod, `${name} Attack`);
        this.render();
        return;
      }

      if (e.target.classList.contains('btn-roll-weapon-dmg')) {
        const name = e.target.dataset.name;
        const diceStr = e.target.dataset.dice || '1d8';
        const mod = parseInt(e.target.dataset.mod) || 0;
        const sides = parseInt(diceStr.replace(/[^0-9]/g, '')) || 8;
        rollDice(sides, mod, `${name} Damage`);
        this.render();
        return;
      }

      if (e.target.id === 'btn-roll-init' || e.target.classList.contains('btn-roll-save') || e.target.classList.contains('btn-roll-skill')) {
        const name = e.target.dataset.name || 'Initiative Check';
        const mod = parseInt(e.target.dataset.mod) || 0;
        rollDice(20, mod, name);
        this.render();
        return;
      }

      if (e.target.classList.contains('btn-dice') && e.target.dataset.sides) {
        const sides = parseInt(e.target.dataset.sides);
        rollDice(sides, 0, `d${sides} Roll`);
        this.render();
        return;
      }

      if (e.target.id === 'btn-clear-dice-log') {
        clearRollLog();
        this.render();
        return;
      }

      if (e.target.classList.contains('btn-hp-mod')) {
        const mod = parseInt(e.target.dataset.mod);
        this.character.hp.current = Math.min(this.character.hp.max, Math.max(0, this.character.hp.current + mod));
        this.saveState();
        this.render();
        return;
      }

      if (e.target.id === 'btn-reset-sample') {
        if (confirm('Reset character sheet to sample character?')) {
          this.character = JSON.parse(JSON.stringify(SAMPLE_CHARACTER));
          this.saveState();
          this.render();
        }
        return;
      }

      if (e.target.id === 'btn-export-json') {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.character, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `${this.character.name.replace(/\s+/g, '_')}_dnd35.json`);
        dlAnchorElem.click();
        return;
      }

      if (e.target.classList.contains('btn-delete-bonus')) {
        const idx = parseInt(e.target.dataset.index);
        this.character.customBonuses.splice(idx, 1);
        this.saveState();
        this.render();
        return;
      }

      if (e.target.classList.contains('btn-cast-spell')) {
        if (this.character.spellSlots?.level1?.used < this.character.spellSlots?.level1?.total) {
          this.character.spellSlots.level1.used += 1;
          rollDice(20, 0, `Cast ${e.target.dataset.name}`);
          this.saveState();
          this.render();
        } else {
          alert('No remaining 1st-level spell slots today!');
        }
        return;
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'file-import-json') {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              this.character = JSON.parse(event.target.result);
              this.saveState();
              this.render();
              alert('Character imported successfully!');
            } catch (err) {
              alert('Invalid character JSON file!');
            }
          };
          reader.readAsText(file);
        }
      }

      if (e.target.id === 'toggle-fractional-bab') {
        this.character.useFractionalBAB = e.target.checked;
        this.saveState();
        this.render();
      }

      if (e.target.id === 'toggle-fractional-saves') {
        this.character.useFractionalSaves = e.target.checked;
        this.saveState();
        this.render();
      }

      if (e.target.id === 'toggle-dm-casting') {
        if (!this.character.dmCustomCasting) this.character.dmCustomCasting = {};
        this.character.dmCustomCasting.enabled = e.target.checked;
        this.saveState();
        this.render();
      }
    });
  }

  bindDynamicEvents() {
    const addBonusForm = document.getElementById('form-add-bonus');
    if (addBonusForm) {
      addBonusForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newBonus = {
          id: 'bonus_' + Date.now(),
          name: document.getElementById('bonus-name').value,
          target: document.getElementById('bonus-target').value,
          amount: parseInt(document.getElementById('bonus-amount').value) || 0,
          type: document.getElementById('bonus-type').value,
          source: document.getElementById('bonus-source').value || 'Custom'
        };

        if (!this.character.customBonuses) this.character.customBonuses = [];
        this.character.customBonuses.push(newBonus);
        this.saveState();
        this.render();
      });
    }

    const builderForm = document.getElementById('form-builder');
    if (builderForm) {
      builderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.character.name = document.getElementById('builder-name').value;
        this.character.player = document.getElementById('builder-player').value;
        this.character.race = document.getElementById('builder-race').value;
        this.character.alignment = document.getElementById('builder-alignment').value;

        document.querySelectorAll('.builder-base-stat').forEach(inp => {
          const stat = inp.dataset.stat;
          this.character.baseAbilityScores[stat] = parseInt(inp.value) || 10;
        });

        const fLvl = parseInt(document.getElementById('builder-cls-fighter').value) || 0;
        const dLvl = parseInt(document.getElementById('builder-cls-duskblade').value) || 0;

        this.character.classes = [];
        if (fLvl > 0) this.character.classes.push({ classId: 'fighter', level: fLvl });
        if (dLvl > 0) this.character.classes.push({ classId: 'duskblade', level: dLvl });

        this.saveState();
        this.activeTab = 'combat';
        this.render();
        alert('Character updated successfully!');
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new DndApp();
});
