// D&D 3.5e Skills Data & Synergies

export const SKILLS = {
  appraise: {
    id: 'appraise',
    name: 'Appraise',
    ability: 'int',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 67",
    description: 'Use this skill to determine the approximate value of common or rare objects, treasures, and trade goods.'
  },
  balance: {
    id: 'balance',
    name: 'Balance',
    ability: 'dex',
    trainedOnly: false,
    armorCheckPenalty: true,
    sourceBook: "Player's Handbook v3.5, p. 67",
    description: 'Use this skill to walk on precarious surfaces, tightropes, ice, or narrow ledges without falling.'
  },
  bluff: {
    id: 'bluff',
    name: 'Bluff',
    ability: 'cha',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 67",
    synergies: [
      { target: 'diplomacy', bonus: 2, reqRanks: 5, note: '5+ ranks in Bluff gives +2 to Diplomacy' },
      { target: 'disguise', bonus: 2, reqRanks: 5, note: '5+ ranks in Bluff gives +2 to Disguise acting' },
      { target: 'intimidate', bonus: 2, reqRanks: 5, note: '5+ ranks in Bluff gives +2 to Intimidate' },
      { target: 'sleight_of_hand', bonus: 2, reqRanks: 5, note: '5+ ranks in Bluff gives +2 to Sleight of Hand' }
    ],
    description: 'Use this skill to mislead, deceive, feint in combat, or lie to NPCs.'
  },
  climb: {
    id: 'climb',
    name: 'Climb',
    ability: 'str',
    trainedOnly: false,
    armorCheckPenalty: true,
    sourceBook: "Player's Handbook v3.5, p. 69",
    description: 'Use this skill to traverse vertical surfaces, trees, ropes, or cliff faces.'
  },
  concentration: {
    id: 'concentration',
    name: 'Concentration',
    ability: 'con',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 69",
    description: 'Use this skill to cast spells while taking damage, defensively in melee, or under harsh environmental conditions.'
  },
  craft: {
    id: 'craft',
    name: 'Craft (General)',
    ability: 'int',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 70",
    description: 'Use this skill to manufacture items such as armor, weapons, alchemy, or woodworking.'
  },
  decipher_script: {
    id: 'decipher_script',
    name: 'Decipher Script',
    ability: 'int',
    trainedOnly: true,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 71",
    description: 'Use this skill to read archaic scripts, ancient runes, or encoded messages.'
  },
  diplomacy: {
    id: 'diplomacy',
    name: 'Diplomacy',
    ability: 'cha',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 71",
    description: 'Use this skill to negotiate, settle arguments, persuade NPCs, or improve NPC attitudes.'
  },
  disable_device: {
    id: 'disable_device',
    name: 'Disable Device',
    ability: 'int',
    trainedOnly: true,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 72",
    description: 'Use this skill to disarm traps, sabotage complex machinery, or jam locks.'
  },
  disguise: {
    id: 'disguise',
    name: 'Disguise',
    ability: 'cha',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 72",
    description: 'Use this skill to alter your appearance and pass as someone else.'
  },
  escape_artist: {
    id: 'escape_artist',
    name: 'Escape Artist',
    ability: 'dex',
    trainedOnly: false,
    armorCheckPenalty: true,
    sourceBook: "Player's Handbook v3.5, p. 73",
    description: 'Use this skill to slip out of ropes, manacles, grapples, or tight spaces.'
  },
  gather_information: {
    id: 'gather_information',
    name: 'Gather Information',
    ability: 'cha',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 74",
    description: 'Use this skill to make inquiries in towns, taverns, and guilds to discover rumors or facts.'
  },
  handle_animal: {
    id: 'handle_animal',
    name: 'Handle Animal',
    ability: 'cha',
    trainedOnly: true,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 74",
    description: 'Use this skill to train, command, or calm wild or domesticated animals.'
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    ability: 'wis',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 75",
    description: 'Use this skill to administer first aid, stabilize dying allies, treat poison or disease.'
  },
  hide: {
    id: 'hide',
    name: 'Hide',
    ability: 'dex',
    trainedOnly: false,
    armorCheckPenalty: true,
    sourceBook: "Player's Handbook v3.5, p. 76",
    description: 'Use this skill to conceal yourself from observation behind cover or shadows.'
  },
  intimidate: {
    id: 'intimidate',
    name: 'Intimidate',
    ability: 'cha',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 76",
    description: 'Use this skill to force an opponent to cooperate or demoralize foes in combat.'
  },
  jump: {
    id: 'jump',
    name: 'Jump',
    ability: 'str',
    trainedOnly: false,
    armorCheckPenalty: true,
    sourceBook: "Player's Handbook v3.5, p. 77",
    synergies: [
      { target: 'tumble', bonus: 2, reqRanks: 5, note: '5+ ranks in Jump gives +2 to Tumble' }
    ],
    description: 'Use this skill to leap over chasms, hurdles, or reach high ledges.'
  },
  knowledge_arcana: {
    id: 'knowledge_arcana',
    name: 'Knowledge (Arcana)',
    ability: 'int',
    trainedOnly: true,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 78",
    synergies: [
      { target: 'spellcraft', bonus: 2, reqRanks: 5, note: '5+ ranks in Knowledge (Arcana) gives +2 to Spellcraft' }
    ],
    description: 'Covers ancient mysteries, magic traditions, arcane symbols, dragons, and magical beasts.'
  },
  knowledge_religion: {
    id: 'knowledge_religion',
    name: 'Knowledge (Religion)',
    ability: 'int',
    trainedOnly: true,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 78",
    description: 'Covers gods, divine mythology, holy symbols, undead creatures, and ecclesiastical rites.'
  },
  listen: {
    id: 'listen',
    name: 'Listen',
    ability: 'wis',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 78",
    description: 'Use this skill to hear approaching footsteps, whispered secret conversations, or hidden creatures.'
  },
  move_silently: {
    id: 'move_silently',
    name: 'Move Silently',
    ability: 'dex',
    trainedOnly: false,
    armorCheckPenalty: true,
    sourceBook: "Player's Handbook v3.5, p. 79",
    description: 'Use this skill to creep past guards, monsters, or sentries without making a sound.'
  },
  open_lock: {
    id: 'open_lock',
    name: 'Open Lock',
    ability: 'dex',
    trainedOnly: true,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 79",
    description: 'Use thieves tools to pick mechanical locks on doors, chests, or shackles.'
  },
  ride: {
    id: 'ride',
    name: 'Ride',
    ability: 'dex',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 80",
    description: 'Use this skill to control horses, mounts, or fight effectively from horseback.'
  },
  search: {
    id: 'search',
    name: 'Search',
    ability: 'int',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 81",
    description: 'Use this skill to examine an area closely for secret doors, traps, or concealed objects.'
  },
  sense_motive: {
    id: 'sense_motive',
    name: 'Sense Motive',
    ability: 'wis',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 81",
    synergies: [
      { target: 'diplomacy', bonus: 2, reqRanks: 5, note: '5+ ranks in Sense Motive gives +2 to Diplomacy' }
    ],
    description: 'Use this skill to detect lies, sense hidden motives, or recognize enchantment influence.'
  },
  sleight_of_hand: {
    id: 'sleight_of_hand',
    name: 'Sleight of Hand',
    ability: 'dex',
    trainedOnly: true,
    armorCheckPenalty: true,
    sourceBook: "Player's Handbook v3.5, p. 81",
    description: 'Use this skill to pick pockets, palm small objects, or hide daggers under clothing.'
  },
  spellcraft: {
    id: 'spellcraft',
    name: 'Spellcraft',
    ability: 'int',
    trainedOnly: true,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 82",
    synergies: [
      { target: 'use_magic_device', bonus: 2, reqRanks: 5, note: '5+ ranks in Spellcraft gives +2 to Use Magic Device (scrolls)' }
    ],
    description: 'Use this skill to identify spells being cast, analyze magic item properties, or read scrolls.'
  },
  spot: {
    id: 'spot',
    name: 'Spot',
    ability: 'wis',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 83",
    description: 'Use this skill to notice hidden enemies, distant objects, or subtle visual details.'
  },
  survival: {
    id: 'survival',
    name: 'Survival',
    ability: 'wis',
    trainedOnly: false,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 83",
    description: 'Use this skill to track creatures across wilderness, find food/water, or avoid natural hazards.'
  },
  tumble: {
    id: 'tumble',
    name: 'Tumble',
    ability: 'dex',
    trainedOnly: true,
    armorCheckPenalty: true,
    sourceBook: "Player's Handbook v3.5, p. 84",
    synergies: [
      { target: 'balance', bonus: 2, reqRanks: 5, note: '5+ ranks in Tumble gives +2 to Balance' },
      { target: 'jump', bonus: 2, reqRanks: 5, note: '5+ ranks in Tumble gives +2 to Jump' }
    ],
    description: 'Use this skill to roll safely past opponents without provoking attacks of opportunity or absorb falling damage.'
  },
  use_magic_device: {
    id: 'use_magic_device',
    name: 'Use Magic Device',
    ability: 'cha',
    trainedOnly: true,
    armorCheckPenalty: false,
    sourceBook: "Player's Handbook v3.5, p. 85",
    description: 'Use this skill to activate magic wands, scrolls, or rods as if you possessed the required class or alignment.'
  }
};
