// D&D 3.5e Races & Subraces Data

export const RACES = {
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
      '+2 racial bonus on Listen, Search, and Spot checks. An elf who merely passes within 5 feet of a secret or concealed door is entitled to a Search check to notice it.'
    ],
    description: `Elves are known for their poetry, song, literature, arts, magic, and lore. They favor natural beauty and quiet grace. Elves stand 4-1/2 to 5-1/2 feet tall and weigh 95 to 135 pounds.`
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
      'Stability: A dwarf gains a +4 bonus on stability checks to resist being bull rushed or tripped.',
      '+2 racial bonus on saving throws against poison, spells, and spell-like effects.',
      '+1 racial bonus on attack rolls against orcs and goblinoids.',
      '+4 dodge bonus to Armor Class against giants.'
    ],
    description: `Dwarves are known for their skill in warfare, their ability to withstand physical and magical punishment, their knowledge of the earth's secrets, and their hardiness.`
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
      'Small size: +1 bonus to AC, +1 bonus on attack rolls, +4 bonus on Hide checks.',
      'Base land speed of 20 feet.',
      '+2 racial bonus on Climb, Jump, Move Silently, and Listen checks.',
      '+1 racial bonus on all saving throws.',
      '+2 morale bonus on saving throws against fear.'
    ],
    description: `Halflings are clever, capable, and resourceful survivors. They are notorious opportunists who love adventure, travel, and discovering new sights.`
  },
  gnome_rock: {
    id: 'gnome_rock',
    name: 'Gnome (Rock)',
    sourceBook: "Player's Handbook v3.5, p. 16",
    size: 'Small',
    speed: 20,
    abilityMods: { str: -2, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    favoredClass: 'Bard',
    traits: [
      '+2 Constitution, -2 Strength.',
      'Small size: +1 bonus to AC, +1 attack bonus, +4 Hide bonus.',
      'Low-Light Vision.',
      '+2 racial bonus on saves against illusions.',
      '+1 racial bonus on attack rolls against kobolds and goblinoids.',
      '+4 dodge bonus to AC against giants.'
    ],
    description: `Gnomes are welcomed everywhere as technicians, alchemists, and inventors. They love humor, gems, and trickery.`
  },
  half_elf: {
    id: 'half_elf',
    name: 'Half-Elf',
    sourceBook: "Player's Handbook v3.5, p. 18",
    size: 'Medium',
    speed: 30,
    abilityMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    favoredClass: 'Any',
    traits: [
      'Immunity to sleep spells and similar magical effects, and a +2 racial bonus on saves against enchantment spells.',
      'Low-Light Vision.',
      '+1 racial bonus on Listen, Search, and Spot checks.',
      '+2 racial bonus on Diplomacy and Gather Information checks.'
    ],
    description: `Half-elves combine the curiosity and ambition of humans with the refined senses and love of nature of elves.`
  },
  half_orc: {
    id: 'half_orc',
    name: 'Half-Orc',
    sourceBook: "Player's Handbook v3.5, p. 18",
    size: 'Medium',
    speed: 30,
    abilityMods: { str: 2, dex: 0, con: 0, int: -2, wis: 0, cha: -2 },
    favoredClass: 'Barbarian',
    traits: [
      '+2 Strength, -2 Intelligence, -2 Charisma.',
      'Darkvision up to 60 feet.',
      'Orc Blood: For all effects related to race, a half-orc is considered an orc.'
    ],
    description: `Half-orcs combine human adaptability with savage strength. They stand between 6 and 7 feet tall and weigh upwards of 200 pounds.`
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
      'Light Blindness: Abrupt exposure to bright light blinds drow for 1 round.',
      'Spell-Like Abilities: 1/day - Dancing Lights, Darkness, Faerie Fire.'
    ],
    description: `Drow are dark-skinned sub-elves dwelling deep in the Underdark, famed for their deadly stealth, matriarchal society, and innate spellcasting abilities.`
  }
};
