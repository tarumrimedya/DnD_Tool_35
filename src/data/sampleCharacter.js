// Pre-loaded Sample Character for Instant Preview

export const SAMPLE_CHARACTER = {
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
  
  // Multiclass progression
  classes: [
    { classId: 'fighter', level: 2 },
    { classId: 'duskblade', level: 2 }
  ],
  
  // Unearthed Arcana rules toggle
  useFractionalBAB: true,
  useFractionalSaves: true,

  // Base ability scores (before race, items, DM overrides)
  baseAbilityScores: {
    str: 14,
    dex: 14,
    con: 14,
    int: 14,
    wis: 10,
    cha: 12
  },

  // DM Custom Caster Configuration
  dmCustomCasting: {
    enabled: false,
    casterType: 'wizard',
    customCasterLevel: 4
  },

  // Custom Bonus Engine entries (from items, spells, feats, DM grants)
  customBonuses: [
    { id: 'b1', name: 'Belt of Strength', target: 'str', amount: 4, type: 'Enhancement', source: 'Belt of Giant Strength +4' },
    { id: 'b2', name: 'Cloak Saves', target: 'saves', amount: 3, type: 'Resistance', source: 'Cloak of Resistance +3' },
    { id: 'b3', name: 'Ring Deflection', target: 'ac', amount: 2, type: 'Deflection', source: 'Ring of Protection +2' },
    { id: 'b4', name: 'DM Sacred Blessing', target: 'will', amount: 2, type: 'Sacred', source: 'DM Custom Override' },
    { id: 'b5', name: 'DM Weapon Training', target: 'attack', amount: 1, type: 'Competence', source: 'DM Custom Override' }
  ],

  // Skill Ranks allocated
  skillRanks: {
    climb: 4,
    concentration: 7,
    intimidate: 5,
    jump: 5,
    knowledge_arcana: 4,
    spellcraft: 5,
    tumble: 5
  },

  // Selected Feats
  feats: ['power_attack', 'cleave', 'weapon_focus', 'dodge', 'leap_attack'],

  // Equipped Items by Body Slot
  equippedSlots: {
    primary_weapon: 'jovar_blackstone',
    offhand_shield: 'shield_guwenya',
    waist: 'belt_giant_strength',
    shoulders: 'cloak_resistance_3',
    ring1: 'ring_protection_2'
  },

  // Active Spells / Prepared
  spellsKnown: ['blade_of_blood', 'nightshield', 'magic_missile', 'haste'],
  spellSlots: {
    level1: { total: 4, used: 1 }
  },

  bio: `Valerius is a veteran spellblade of Blackstone Keep. Trained in traditional swordplay before unlocking innate Duskblade magic, he charges into battle wielding legendary arms and channeling touch spells through heavy strikes.`,
  notes: `Impaling Spear deals Fort DC 19 on hit or bleed 1. Shield of Guwenya grants 25 energy resistance + Evasion as a standard action.`
};
