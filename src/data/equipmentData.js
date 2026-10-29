// D&D 3.5e Equipment & Body Slot Magic Items

export const ITEM_SLOTS = [
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

export const SAMPLE_EQUIPMENT = {
  jovar_blackstone: {
    id: 'jovar_blackstone',
    name: 'Jovar of Blackstone +4',
    slot: 'primary_weapon',
    weaponData: {
      damage: '2d8',
      critRange: '15-20x2',
      enhancement: 4,
      type: 'Slashing (Exotic 2H)',
      weight: 12,
      properties: ['Ghost Touch', 'Keen', 'Doom Burst', 'Sweeping']
    },
    sourceBook: "Planar Handbook p. 69 / DM Custom",
    description: `A formidable +4 Jovar wrought of Blackstone. On a successful critical hit, the Doom Burst enchantment forces the target to become shaken for 5 minutes. Includes Keen (doubling threat range) and Ghost Touch.`
  },
  falchion_plus_3: {
    id: 'falchion_plus_3',
    name: 'Falchion +3',
    slot: 'primary_weapon',
    weaponData: {
      damage: '2d4',
      critRange: '18-20x2',
      enhancement: 3,
      type: 'Slashing (Martial 2H)',
      weight: 8,
      properties: ['Magic']
    },
    sourceBook: "Player's Handbook v3.5, p. 115",
    description: `A finely balanced curved two-handed sword with a +3 enhancement bonus to attack and damage rolls.`
  },
  impaling_spear: {
    id: 'impaling_spear',
    name: 'Impaling Spear +4 (Adamantine)',
    slot: 'primary_weapon',
    weaponData: {
      damage: '1d6',
      critRange: '20x2',
      enhancement: 4,
      type: 'Piercing (Simple 1H)',
      weight: 3,
      properties: ['Adamantine', 'Ghost Touch', 'Bleed DC 19']
    },
    sourceBook: 'DM Custom Relic',
    description: `Shortspear +4 forged of adamantine with Ghost Touch. Each hit forces Fort save DC 19 or target bleeds. If bleed reaches 10+, auto-crits on next strike.`
  },
  shield_guwenya: {
    id: 'shield_guwenya',
    name: 'Shield of Guwenya +4 (Kite Shield)',
    slot: 'offhand_shield',
    armorData: {
      shieldBonus: 6, // 2 base + 4 enhancement
      maxDex: null,
      checkPenalty: -1,
      weight: 10
    },
    sourceBook: 'DM Custom Relic',
    description: `Kite Shield +4. As a standard action, activate to gain 25 energy resistance to a chosen element and Evasion against spells of that element.`
  },
  breastplate_plus_2: {
    id: 'breastplate_plus_2',
    name: 'Breastplate +2',
    slot: 'body',
    armorData: {
      armorBonus: 7, // 5 base + 2 enhancement
      maxDex: 3,
      checkPenalty: -3,
      weight: 30
    },
    sourceBook: "Player's Handbook v3.5, p. 124",
    description: `Covering the torso, this +2 breastplate offers superb protection while retaining agility.`
  },
  belt_giant_strength: {
    id: 'belt_giant_strength',
    name: 'Belt of Giant Strength +4',
    slot: 'waist',
    statBonus: { stat: 'str', amount: 4, type: 'Enhancement' },
    sourceBook: "Dungeon Master's Guide v3.5, p. 248",
    description: `This heavy leather belt is bound with iron studs and grants a +4 enhancement bonus to Strength.`
  },
  cloak_resistance_3: {
    id: 'cloak_resistance_3',
    name: 'Cloak of Resistance +3',
    slot: 'shoulders',
    saveBonus: { amount: 3, type: 'Resistance' },
    sourceBook: "Dungeon Master's Guide v3.5, p. 253",
    description: `Fleece-lined mantle that offers magical protection, granting a +3 resistance bonus on all saving throws (Fort, Ref, Will).`
  },
  ring_protection_2: {
    id: 'ring_protection_2',
    name: 'Ring of Protection +2',
    slot: 'ring1',
    acBonus: { amount: 2, type: 'Deflection' },
    sourceBook: "Dungeon Master's Guide v3.5, p. 230",
    description: `This ring offers a continuous +2 deflection bonus to Armor Class.`
  }
};
