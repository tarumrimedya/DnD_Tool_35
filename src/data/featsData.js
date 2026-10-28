// D&D 3.5e Feats Data

export const FEATS = {
  power_attack: {
    id: 'power_attack',
    name: 'Power Attack',
    type: 'General',
    prereqs: 'Str 13',
    sourceBook: "Player's Handbook v3.5, p. 98",
    description: `On your action, before making attack rolls for a round, you may choose to subtract a number from all melee attack rolls and add the same number to all melee damage rolls. This number may not exceed your base attack bonus. If attacking with a two-handed weapon, add twice the subtracted amount to damage.`
  },
  cleave: {
    id: 'cleave',
    name: 'Cleave',
    type: 'General',
    prereqs: 'Str 13, Power Attack',
    sourceBook: "Player's Handbook v3.5, p. 92",
    description: `If you deal a creature enough damage to drop it (below 0 hit points), you get an immediate, extra melee attack against another creature within reach with the same weapon and attack bonus.`
  },
  weapon_focus: {
    id: 'weapon_focus',
    name: 'Weapon Focus',
    type: 'General',
    prereqs: 'Proficiency with selected weapon, Base Attack Bonus +1',
    sourceBook: "Player's Handbook v3.5, p. 102",
    description: `You gain a +1 bonus on all attack rolls you make using the selected weapon.`
  },
  dodge: {
    id: 'dodge',
    name: 'Dodge',
    type: 'General',
    prereqs: 'Dex 13',
    sourceBook: "Player's Handbook v3.5, p. 93",
    description: `During your action, you designate an opponent and receive a +1 dodge bonus to Armor Class against attacks from that opponent.`
  },
  mobility: {
    id: 'mobility',
    name: 'Mobility',
    type: 'General',
    prereqs: 'Dex 13, Dodge',
    sourceBook: "Player's Handbook v3.5, p. 98",
    description: `You get a +4 dodge bonus to Armor Class against attacks of opportunity caused when you move out of or within a threatened area.`
  },
  spring_attack: {
    id: 'spring_attack',
    name: 'Spring Attack',
    type: 'General',
    prereqs: 'Dex 13, Dodge, Mobility, Base Attack Bonus +4',
    sourceBook: "Player's Handbook v3.5, p. 100",
    description: `When using the attack action with a melee weapon, you can move both before and after the attack, provided that your total distance moved is not greater than your speed.`
  },
  improved_critical: {
    id: 'improved_critical',
    name: 'Improved Critical',
    type: 'General',
    prereqs: 'Proficiency with weapon, Base Attack Bonus +8',
    sourceBook: "Player's Handbook v3.5, p. 95",
    description: `When using the weapon you selected, your threat range is doubled. For example, a falchion (18-20) becomes 15-20.`
  },
  improved_initiative: {
    id: 'improved_initiative',
    name: 'Improved Initiative',
    type: 'General',
    prereqs: 'None',
    sourceBook: "Player's Handbook v3.5, p. 96",
    description: `You get a +4 bonus on initiative checks.`
  },
  iron_will: {
    id: 'iron_will',
    name: 'Iron Will',
    type: 'General',
    prereqs: 'None',
    sourceBook: "Player's Handbook v3.5, p. 97",
    description: `You get a +2 bonus on all Will saving throws.`
  },
  lightning_reflexes: {
    id: 'lightning_reflexes',
    name: 'Lightning Reflexes',
    type: 'General',
    prereqs: 'None',
    sourceBook: "Player's Handbook v3.5, p. 97",
    description: `You get a +2 bonus on all Reflex saving throws.`
  },
  great_fortitude: {
    id: 'great_fortitude',
    name: 'Great Fortitude',
    type: 'General',
    prereqs: 'None',
    sourceBook: "Player's Handbook v3.5, p. 94",
    description: `You get a +2 bonus on all Fortitude saving throws.`
  },
  leap_attack: {
    id: 'leap_attack',
    name: 'Leap Attack',
    type: 'Tactical / Martial',
    prereqs: 'Jump 8 ranks, Power Attack',
    sourceBook: "Complete Adventurer p. 110",
    description: `You can combine a powerful jump with a charge attack. If you cover at least 10 feet of horizontal distance with your Jump check during a charge, your Power Attack damage bonus is multiplied by 3 (for 2H weapons) instead of 2.`
  },
  empower_spell: {
    id: 'empower_spell',
    name: 'Empower Spell',
    type: 'Metamagic',
    prereqs: 'None',
    sourceBook: "Player's Handbook v3.5, p. 93",
    description: `All variable, numeric effects of an empowered spell are increased by one-half. An empowered spell uses up a spell slot two levels higher than the spell's actual level.`
  }
};
