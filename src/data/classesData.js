// D&D 3.5e Classes Data

export const CLASSES = {
  fighter: {
    id: 'fighter',
    name: 'Fighter',
    sourceBook: "Player's Handbook v3.5, p. 37",
    hitDie: 10,
    babRate: 'good', // +1 per level
    fortSaveRate: 'good',
    refSaveRate: 'poor',
    willSaveRate: 'poor',
    skillPointsPerLevel: 2,
    keyAbility: 'str',
    classSkills: ['climb', 'craft', 'handle_animal', 'intimidate', 'jump', 'ride', 'swim'],
    casterType: 'none',
    features: {
      1: ['Bonus Feat'],
      2: ['Bonus Feat'],
      3: [],
      4: ['Bonus Feat'],
      5: [],
      6: ['Bonus Feat'],
      8: ['Bonus Feat'],
      10: ['Bonus Feat']
    },
    description: `Fighters are masters of martial combat, skilled with a variety of weapons and armor. They excel in melee and ranged engagements.`
  },
  wizard: {
    id: 'wizard',
    name: 'Wizard',
    sourceBook: "Player's Handbook v3.5, p. 52",
    hitDie: 4,
    babRate: 'poor', // +0.5 per level
    fortSaveRate: 'poor',
    refSaveRate: 'poor',
    willSaveRate: 'good',
    skillPointsPerLevel: 2,
    keyAbility: 'int',
    classSkills: ['concentration', 'craft', 'decipher_script', 'knowledge_arcana', 'knowledge_dungeoneering', 'knowledge_history', 'knowledge_local', 'knowledge_nature', 'knowledge_planes', 'knowledge_religion', 'profession', 'spellcraft'],
    casterType: 'prepared',
    spellcastingStat: 'int',
    features: {
      1: ['Summon Familiar', 'Scribe Scroll'],
      5: ['Bonus Feat (Metamagic / Item Creation)'],
      10: ['Bonus Feat']
    },
    description: `Wizards cast powerful arcane spells drawn from intense study and spellbooks. Intelligence governs their spell potency.`
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    sourceBook: "Player's Handbook v3.5, p. 49",
    hitDie: 6,
    babRate: 'average', // +0.75 per level
    fortSaveRate: 'poor',
    refSaveRate: 'good',
    willSaveRate: 'poor',
    skillPointsPerLevel: 8,
    keyAbility: 'dex',
    classSkills: ['appraise', 'balance', 'bluff', 'climb', 'craft', 'decipher_script', 'diplomacy', 'disable_device', 'disguise', 'escape_artist', 'forgery', 'gather_information', 'hide', 'intimidate', 'jump', 'knowledge_local', 'listen', 'move_silently', 'open_lock', 'perform', 'profession', 'search', 'sense_motive', 'sleight_of_hand', 'spot', 'swim', 'tumble', 'use_magic_device', 'use_rope'],
    casterType: 'none',
    features: {
      1: ['Sneak Attack +1d6', 'Trapfinding'],
      2: ['Evasion'],
      3: ['Sneak Attack +2d6', 'Trap Sense +1'],
      4: ['Uncanny Dodge'],
      5: ['Sneak Attack +3d6']
    },
    description: `Rogues rely on skill, stealth, and exploiting enemy vulnerabilities. They excel at trapfinding, locks, and sneak attacks.`
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
    classSkills: ['concentration', 'craft', 'diplomacy', 'heal', 'knowledge_arcana', 'knowledge_history', 'knowledge_religion', 'knowledge_planes', 'profession', 'spellcraft'],
    casterType: 'prepared',
    spellcastingStat: 'wis',
    features: {
      1: ['Turn / Rebuke Undead', 'Divine Magic', 'Domain Powers']
    },
    description: `Clerics are divine champions wielding sacred magic granted by deities. Wisdom governs their spells, and Charisma drives Turn Undead.`
  },
  paladin: {
    id: 'paladin',
    name: 'Paladin',
    sourceBook: "Player's Handbook v3.5, p. 42",
    hitDie: 10,
    babRate: 'good',
    fortSaveRate: 'good',
    refSaveRate: 'poor',
    willSaveRate: 'poor',
    skillPointsPerLevel: 2,
    keyAbility: 'str',
    classSkills: ['concentration', 'craft', 'diplomacy', 'handle_animal', 'heal', 'knowledge_nobility', 'knowledge_religion', 'profession', 'ride', 'sense_motive'],
    casterType: 'prepared',
    spellcastingStat: 'wis',
    features: {
      1: ['Aura of Good', 'Detect Evil', 'Smite Evil 1/day'],
      2: ['Divine Grace', 'Lay on Hands'],
      3: ['Aura of Courage', 'Divine Health'],
      4: ['Turn Undead', 'Paladin Spells']
    },
    description: `Paladins are holy warriors bound by sacred oaths of righteousness and honor. They gain Divine Grace (Charisma bonus to all saves) and divine magic.`
  },
  barbarian: {
    id: 'barbarian',
    name: 'Barbarian',
    sourceBook: "Player's Handbook v3.5, p. 24",
    hitDie: 12,
    babRate: 'good',
    fortSaveRate: 'good',
    refSaveRate: 'poor',
    willSaveRate: 'poor',
    skillPointsPerLevel: 4,
    keyAbility: 'str',
    classSkills: ['climb', 'craft', 'handle_animal', 'intimidate', 'jump', 'listen', 'ride', 'survival', 'swim'],
    casterType: 'none',
    features: {
      1: ['Fast Movement (+10ft)', 'Rage 1/day', 'Illiteracy'],
      2: ['Uncanny Dodge'],
      3: ['Trap Sense +1'],
      4: ['Rage 2/day']
    },
    description: `Barbarians tap into primal fury to enter rage, granting massive boosts to Strength, Constitution, and Will saves.`
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
    classSkills: ['climb', 'concentration', 'craft', 'decipher_script', 'jump', 'knowledge_all', 'ride', 'spellcraft', 'swim'],
    casterType: 'spontaneous',
    spellcastingStat: 'int',
    features: {
      1: ['Arcane Attunement', 'Armored Mage (Light)'],
      2: ['Combat Casting', 'Arcane Channeling (Standard Action)'],
      3: ['Arcane Channeling (Full Attack)']
    },
    description: `Duskblades combine martial prowess with swift arcane magic, channeling touch spells directly through their weapon strikes.`
  }
};
