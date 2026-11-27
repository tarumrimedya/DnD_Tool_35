/**
 * ============================================================================
 * D&D 3.5e Official RAW Ruleset Plugin (`rulesets/dnd35.js`)
 * ============================================================================
 * Pluggable System Physics & Canonical Taxonomies for the system-agnostic
 * V3 Rule Block Engine (`RuleEngine`) and V3 Studio (`Rule Crafter`).
 *
 * Isolates all D&D 3.5e system constants and laws:
 *   - 6 Core Abilities & 40 Canonical Skills (36 PHB + 4 Subsystem)
 *   - 25 Bonus Types & Official RAW Stacking Laws
 *   - 21 Damage & Energy Types (replacing legacy `dt-*` DB cards)
 *   - 9 Creature Sizes, AC/Attack, Grapple & Hide Size Modifiers
 *   - Skill Rank Caps/Costs, Iterative BAB, Save Progressions & Grapple Math
 *   - Base Armor/Shield & Core Class Proficiency Reference Tables
 * ============================================================================
 */
(function (root) {
  'use strict';

  const ABILITIES = [
    ['str', 'Strength'],
    ['dex', 'Dexterity'],
    ['con', 'Constitution'],
    ['int', 'Intelligence'],
    ['wis', 'Wisdom'],
    ['cha', 'Charisma']
  ];

  const SKILLS = [
    ['Appraise', 'int'],
    ['Autohypnosis', 'wis'],
    ['Balance', 'dex'],
    ['Bluff', 'cha'],
    ['Climb', 'str'],
    ['Concentration', 'con'],
    ['Craft', 'int'],
    ['Decipher Script', 'int'],
    ['Diplomacy', 'cha'],
    ['Disable Device', 'int'],
    ['Disguise', 'cha'],
    ['Escape Artist', 'dex'],
    ['Forgery', 'int'],
    ['Gather Information', 'cha'],
    ['Handle Animal', 'cha'],
    ['Heal', 'wis'],
    ['Hide', 'dex'],
    ['Intimidate', 'cha'],
    ['Jump', 'str'],
    ['Knowledge', 'int'],
    ['Knowledge (Psionics)', 'int'],
    ['Listen', 'wis'],
    ['Move Silently', 'dex'],
    ['Open Lock', 'dex'],
    ['Perform', 'cha'],
    ['Profession', 'wis'],
    ['Psicraft', 'int'],
    ['Ride', 'dex'],
    ['Search', 'int'],
    ['Sense Motive', 'wis'],
    ['Sleight of Hand', 'dex'],
    ['Speak Language', 'int'],
    ['Spellcraft', 'int'],
    ['Spot', 'wis'],
    ['Survival', 'wis'],
    ['Swim', 'str'],
    ['Truespeak', 'int'],
    ['Tumble', 'dex'],
    ['Use Magic Device', 'cha'],
    ['Use Psionic Device', 'cha'],
    ['Use Rope', 'dex']
  ];

  const BONUS_TYPES = [
    { id: 'Untyped', stacks: true },
    { id: 'Dodge', stacks: true, lostFF: true },
    { id: 'Circumstance', stacks: true },
    { id: 'Penalty', stacks: true },
    { id: 'Racial', stacks: true },
    { id: 'Synergy', stacks: true },
    { id: 'Enhancement' },
    { id: 'Luck' },
    { id: 'Morale' },
    { id: 'Sacred' },
    { id: 'Profane' },
    { id: 'Insight' },
    { id: 'Competence' },
    { id: 'Resistance' },
    { id: 'Deflection' },
    { id: 'Alchemical' },
    { id: 'Inherent', cap: 5 },
    { id: 'Armor' },
    { id: 'Armor Enhancement' },
    { id: 'Shield' },
    { id: 'Shield Enhancement' },
    { id: 'Natural Armor' },
    { id: 'Natural Armor Enhancement' },
    { id: 'Size' },
    { id: 'Exalted' },
    { id: 'Perfection' }
  ];

  // Canonical 21 D&D 3.5e Damage & Energy Types (migrated from legacy `dt-*` DB entries)
  const DAMAGE_TYPE_DEFS = [
    { id: 'slashing', name: 'Slashing', category: 'physical' },
    { id: 'piercing', name: 'Piercing', category: 'physical' },
    { id: 'bludgeoning', name: 'Bludgeoning', category: 'physical' },
    { id: 'piercing-or-slashing', name: 'Piercing or Slashing', category: 'compound' },
    { id: 'piercing-or-bludgeoning', name: 'Piercing or Bludgeoning', category: 'compound' },
    { id: 'slashing-or-bludgeoning', name: 'Slashing or Bludgeoning', category: 'compound' },
    { id: 'piercing-bludgeoning-and-slashing', name: 'Piercing, Bludgeoning and Slashing', category: 'compound' },
    { id: 'fire', name: 'Fire', category: 'energy' },
    { id: 'cold', name: 'Cold', category: 'energy' },
    { id: 'acid', name: 'Acid', category: 'energy' },
    { id: 'electricity', name: 'Electricity', category: 'energy' },
    { id: 'sonic', name: 'Sonic', category: 'energy' },
    { id: 'force', name: 'Force', category: 'energy' },
    { id: 'holy', name: 'Holy', category: 'aligned' },
    { id: 'unholy', name: 'Unholy', category: 'aligned' },
    { id: 'positive', name: 'Positive', category: 'energy', aliases: ['Positive Energy'] },
    { id: 'negative', name: 'Negative', category: 'energy', aliases: ['Negative Energy'] },
    { id: 'divine', name: 'Divine', category: 'special' },
    { id: 'precision', name: 'Precision', category: 'special' },
    { id: 'vile', name: 'Vile', category: 'aligned' },
    { id: 'nonlethal', name: 'Nonlethal', category: 'special', aliases: ['Non-lethal'] },
    { id: 'untyped', name: 'Untyped', category: 'special' },
    { id: 'healing', name: 'Healing', category: 'healing' },
    { id: 'repair', name: 'Repair', category: 'healing' }
  ];

  const DAMAGE_TYPES = [
    'Slashing', 'Piercing', 'Bludgeoning',
    'Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Force',
    'Holy', 'Unholy', 'Positive', 'Negative', 'Divine',
    'Precision', 'Vile', 'Nonlethal', 'Untyped', 'Healing', 'Repair'
  ];

  const ENERGY_TYPES = ['Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Force'];

  const CREATURE_SIZES = ['Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal'];

  const SIZE_AC_ATTACK_MODS = {
    Fine: 8, Diminutive: 4, Tiny: 2, Small: 1, Medium: 0, Large: -1, Huge: -2, Gargantuan: -4, Colossal: -8
  };

  const SIZE_GRAPPLE_MODS = {
    Fine: -16, Diminutive: -12, Tiny: -8, Small: -4, Medium: 0, Large: 4, Huge: 8, Gargantuan: 12, Colossal: 16
  };

  const SIZE_HIDE_MODS = {
    Fine: 16, Diminutive: 12, Tiny: 8, Small: 4, Medium: 0, Large: -4, Huge: -8, Gargantuan: -12, Colossal: -16
  };

  const SRD_ARMORS = {
    'padded': { armor: 1, maxDex: 8, acp: 0, type: 'Light' },
    'leather': { armor: 2, maxDex: 6, acp: 0, type: 'Light' },
    'leather armor': { armor: 2, maxDex: 6, acp: 0, type: 'Light' },
    'studded leather': { armor: 3, maxDex: 5, acp: -1, type: 'Light' },
    'studded leather armor': { armor: 3, maxDex: 5, acp: -1, type: 'Light' },
    'chain shirt': { armor: 4, maxDex: 4, acp: -2, type: 'Light' },
    'hide': { armor: 3, maxDex: 4, acp: -3, type: 'Medium' },
    'hide armor': { armor: 3, maxDex: 4, acp: -3, type: 'Medium' },
    'scale mail': { armor: 4, maxDex: 3, acp: -4, type: 'Medium' },
    'chainmail': { armor: 5, maxDex: 2, acp: -5, type: 'Medium' },
    'breastplate': { armor: 5, maxDex: 3, acp: -4, type: 'Medium' },
    'splint mail': { armor: 6, maxDex: 0, acp: -7, type: 'Heavy' },
    'banded mail': { armor: 6, maxDex: 1, acp: -6, type: 'Heavy' },
    'half-plate': { armor: 7, maxDex: 0, acp: -7, type: 'Heavy' },
    'full plate': { armor: 8, maxDex: 1, acp: -6, type: 'Heavy' }
  };

  const SRD_SHIELDS = {
    'buckler': { shield: 1, maxDex: null, acp: -1 },
    'light wooden shield': { shield: 1, maxDex: null, acp: -1 },
    'light steel shield': { shield: 1, maxDex: null, acp: -1 },
    'light shield': { shield: 1, maxDex: null, acp: -1 },
    'heavy wooden shield': { shield: 2, maxDex: null, acp: -2 },
    'heavy steel shield': { shield: 2, maxDex: null, acp: -2 },
    'heavy shield': { shield: 2, maxDex: null, acp: -2 },
    'tower shield': { shield: 4, maxDex: 2, acp: -10 }
  };

  const CLASS_PROFICIENCIES = {
    'fighter': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: true, heavy: true }, shields: { shield: true, tower: true } },
    'barbarian': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: true, heavy: false }, shields: { shield: true, tower: false } },
    'paladin': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: true, heavy: true }, shields: { shield: true, tower: false } },
    'ranger': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: true, tower: false } },
    'cleric': { weapons: { simple: true, martial: false, specific: [] }, armors: { light: true, medium: true, heavy: true }, shields: { shield: true, tower: false } },
    'druid': { weapons: { simple: false, martial: false, specific: ['club', 'dagger', 'dart', 'quarterstaff', 'scimitar', 'sickle', 'shortspear', 'sling', 'spear'] }, armors: { light: true, medium: true, heavy: false }, shields: { shield: true, tower: false } },
    'rogue': { weapons: { simple: true, martial: false, specific: ['hand crossbow', 'rapier', 'sap', 'shortbow', 'short sword'] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'rogue (adventurer variant)': { weapons: { simple: true, martial: false, specific: ['hand crossbow', 'rapier', 'sap', 'shortbow', 'short sword'] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'bloodstorm blade': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: true, heavy: false }, shields: { shield: true, tower: false } },
    'bard': { weapons: { simple: true, martial: false, specific: ['longsword', 'rapier', 'sap', 'short sword', 'shortbow', 'whip'] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: true, tower: false } },
    'monk': { weapons: { simple: false, martial: false, specific: ['club', 'crossbow', 'light crossbow', 'heavy crossbow', 'dagger', 'handaxe', 'javelin', 'kama', 'nunchaku', 'quarterstaff', 'sai', 'shuriken', 'siangham', 'sling', 'unarmed strike'] }, armors: { light: false, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'sorcerer': { weapons: { simple: true, martial: false, specific: [] }, armors: { light: false, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'wizard': { weapons: { simple: false, martial: false, specific: ['club', 'dagger', 'heavy crossbow', 'light crossbow', 'quarterstaff'] }, armors: { light: false, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'warlock': { weapons: { simple: true, martial: false, specific: [] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'crusader': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: true, heavy: true }, shields: { shield: true, tower: false } },
    'swordsage': { weapons: { simple: true, martial: false, specific: ['light crossbow', 'heavy crossbow', 'shortbow', 'composite shortbow'] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'warblade': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: true, heavy: false }, shields: { shield: true, tower: false } },
    'duskblade': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: true, heavy: false }, shields: { shield: true, tower: false } },
    'knight': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: true, heavy: true }, shields: { shield: true, tower: true } },
    'warmage': { weapons: { simple: true, martial: false, specific: ['light repeating crossbow'] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: true, tower: false } },
    'beguiler': { weapons: { simple: true, martial: false, specific: ['hand crossbow', 'rapier', 'shortbow', 'short sword'] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'scout': { weapons: { simple: true, martial: false, specific: ['hand crossbow', 'sap', 'shortbow', 'short sword'] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'swashbuckler': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'hexblade': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'favored soul': { weapons: { simple: true, martial: false, specific: [] }, armors: { light: true, medium: true, heavy: false }, shields: { shield: true, tower: false } },
    'spellthief': { weapons: { simple: true, martial: false, specific: ['hand crossbow', 'rapier', 'shortbow', 'short sword'] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'psion': { weapons: { simple: false, martial: false, specific: ['club', 'dagger', 'heavy crossbow', 'light crossbow', 'quarterstaff', 'shortspear'] }, armors: { light: false, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'psychic warrior': { weapons: { simple: true, martial: true, specific: [] }, armors: { light: true, medium: true, heavy: true }, shields: { shield: true, tower: false } },
    'soulknife': { weapons: { simple: true, martial: false, specific: ['mind blade'] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } },
    'wilder': { weapons: { simple: true, martial: false, specific: [] }, armors: { light: true, medium: false, heavy: false }, shields: { shield: false, tower: false } }
  };

  const STAT_SWAP_TARGET_GROUPS = [
    ['Attack Rolls', [
      ['atk.melee.abilityMod', 'Melee Attack Ability (Default: STR)', 'str'],
      ['atk.ranged.abilityMod', 'Ranged Attack Ability (Default: DEX)', 'dex'],
      ['atk.thrown.abilityMod', 'Thrown Weapon Attack Ability (Default: DEX)', 'dex'],
      ['atk.touch.abilityMod', 'Touch Attack Ability (Default: STR / DEX)', 'dex'],
      ['grapple.abilityMod', 'Grapple / Combat Maneuver Ability (Default: STR)', 'str']
    ]],
    ['Damage Rolls', [
      ['dmg.melee.abilityMod', 'Melee Damage Ability (Default: STR)', 'str'],
      ['dmg.ranged.abilityMod', 'Ranged / Thrown Damage Ability (Default: None / STR)', 'str']
    ]],
    ['Saving Throws', [
      ['save.fort.abilityMod', 'Fortitude Save Ability (Default: CON)', 'con'],
      ['save.ref.abilityMod', 'Reflex Save Ability (Default: DEX)', 'dex'],
      ['save.will.abilityMod', 'Will Save Ability (Default: WIS)', 'wis']
    ]],
    ['Defense & Vitals', [
      ['ac.abilityMod', 'Armor Class Ability (Default: DEX)', 'dex'],
      ['initiative.abilityMod', 'Initiative Ability (Default: DEX)', 'dex'],
      ['hp.abilityMod', 'Hit Points per HD Ability (Default: CON)', 'con']
    ]],
    ['Skills & Concentration', [
      ['concentration.abilityMod', 'Concentration Ability (Default: CON)', 'con'],
      ['choice.skill.1.abilityMod', 'Chosen Skill (@Choice) Key Ability', 'wis']
    ].concat(SKILLS.map(function (s) {
      const skSlug = String(s[0]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return ['skill.' + skSlug + '.abilityMod', s[0] + ' Skill Ability (Default: ' + String(s[1]).toUpperCase() + ')', s[1]];
    }))],
    ['Core Scaling & Spellcasting', [
      ['bab', 'Base Attack Bonus (Default: Class BAB)', 'bab'],
      ['spell.dc.abilityMod', 'Spell Save DC Key Ability', 'wis'],
      ['spell.bonusSlots.abilityMod', 'Bonus Spells Key Ability', 'wis']
    ]]
  ];

  const STAT_SWAP_SOURCES = [
    ['str', 'STR Modifier (@strMod)'],
    ['dex', 'DEX Modifier (@dexMod)'],
    ['con', 'CON Modifier (@conMod)'],
    ['int', 'INT Modifier (@intMod)'],
    ['wis', 'WIS Modifier (@wisMod)'],
    ['cha', 'CHA Modifier (@chaMod)'],
    ['0.5*str', '½× STR Modifier'],
    ['0.5*dex', '½× DEX Modifier'],
    ['0.5*int', '½× INT Modifier'],
    ['0.5*wis', '½× WIS Modifier'],
    ['0.5*cha', '½× CHA Modifier'],
    ['1.5*str', '1.5× STR Modifier'],
    ['1.5*dex', '1.5× DEX Modifier'],
    ['choice.abilityMod', 'Chosen Ability Modifier (@Choice)'],
    ['@level', 'Character Level / Total HD (@level)'],
    ['@classLevel', 'Class Level (@classLevel)'],
    ['@cl', 'Caster Level (@cl)']
  ];

  const STAT_SWAP_OPS = [
    ['max', 'Higher Of A or B (May Use B Instead of A)'],
    ['replace', 'Replace A with B (Always Use B)'],
    ['add', 'Add B Alongside A (A + B)']
  ];

  const STAT_SWAP_SCOPES = [
    ['all', 'All Applicable Rolls (Unconditional)'],
    ['finessable', 'Light & Finesse Weapons (Light, Rapier, Whip, Spiked Chain)'],
    ['simple_or_natural', 'Simple & Natural Weapons (Intuitive Attack)'],
    ['thrown', 'Thrown Weapons Only (Brutal / Power Throw)'],
    ['bow_or_crossbow', 'Bows & Crossbows Only'],
    ['chosen_weapon', 'Chosen Weapon (@Choice)'],
    ['discipline_weapons', 'Shadow Hand / Discipline Weapons (In Stance)'],
    ['light_or_no_armor', 'In Light or No Armor'],
    ['not_flat_footed', 'While Not Flat-Footed'],
    ['mind_affecting', 'vs. Mind-Affecting Effects Only']
  ];

  const RULE_SWITCH_FLAGS = [
    ['noAutoFailFortSaveOnNat1', 'Do Not Auto-Fail Fortitude Save on Natural 1'],
    ['shieldToTouchAc', 'Shield AC Bonus Applies to Touch AC'],
    ['monkeyGrip', 'Wield +1 Size Larger Weapons at -2 Attack (Monkey Grip)'],
    ['naturalSpell', 'Cast Spells While in Wild Shape (Natural Spell)'],
    ['uncannyDodge', 'Retain DEX Bonus to AC When Flat-Footed (Uncanny Dodge)'],
    ['ignoreArmorSpeedPenalty', 'Ignore Medium/Heavy Armor Speed Reduction'],
    ['oneHandedOffHandAsLight', 'Treat One-Handed Off-Hand Weapon as Light (Oversized TWF)'],
    ['tacticalSlider', 'Enable Tactical Combat Slider (Power Attack / Expertise / Manyshot)'],
    ['powerAttackPenaltyToAc', 'Shift Power Attack Penalty to AC on Charge (Heedless Charge)']
  ];

  const RULE_SWITCH_PARAMS_SCHEMA = {
    powerAttackPenaltyToAc: {
      when: { type: 'string', enum: ['charging'], default: 'charging' },
      minPowerAttack: { type: 'number', min: 1, default: 5 }
    }
  };

  // Canonical D&D 3.5e Metamagic Transforms (PHB p.88-102, Rules Compendium)
  const METAMAGIC_TRANSFORMS = {
    empower:    { id: 'empower',    label: 'Empower (x1.5 Variable)',       shortLabel: 'Empowered',   defaultSlotAdj: 2, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: 'empower',  durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1 },
    maximize:   { id: 'maximize',   label: 'Maximize Dice',                 shortLabel: 'Maximized',   defaultSlotAdj: 3, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: 'maximize', durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1 },
    quicken:    { id: 'quicken',    label: 'Quicken (Swift Action)',        shortLabel: 'Quickened',   defaultSlotAdj: 4, variableSlot: false, raisesSaveDc: false, actionOverride: 'Swift Action', damageMode: null,       durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1, notes: 'PHB p.98 Free Action (1/round), errata Swift Action (Rules Compendium)' },
    extend:     { id: 'extend',     label: 'Extend (x2 Duration)',          shortLabel: 'Extended',    defaultSlotAdj: 1, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 2, rangeMultiplier: 1, areaMultiplier: 1 },
    persistent: { id: 'persistent', label: 'Persistent (24h)',              shortLabel: 'Persistent',  defaultSlotAdj: 6, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 1, durationOverride: '24 hours', rangeMultiplier: 1, areaMultiplier: 1 },
    enlarge:    { id: 'enlarge',    label: 'Enlarge (x2 Range)',            shortLabel: 'Enlarged',    defaultSlotAdj: 1, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 1, rangeMultiplier: 2, areaMultiplier: 1 },
    widen:      { id: 'widen',      label: 'Widen (x2 Area)',               shortLabel: 'Widened',     defaultSlotAdj: 3, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 2 },
    twin:       { id: 'twin',       label: 'Twin Spell',                    shortLabel: 'Twinned',     defaultSlotAdj: 4, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1 },
    splitRay:   { id: 'splitRay',   label: 'Split Ray (+1 Ray)',            shortLabel: 'Split Ray',   defaultSlotAdj: 2, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1 },
    chain:      { id: 'chain',      label: 'Chain Secondary Targets',       shortLabel: 'Chained',     defaultSlotAdj: 3, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1 },
    heighten:   { id: 'heighten',   label: 'Heighten (+Save DC / Level)',   shortLabel: 'Heightened',  defaultSlotAdj: 0, variableSlot: true,  raisesSaveDc: true,  actionOverride: null,           damageMode: null,       durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1 },
    energySub:  { id: 'energySub',  label: 'Energy Substitution',           shortLabel: 'Energy Sub',  defaultSlotAdj: 0, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1 },
    pierceRes:  { id: 'pierceRes',  label: 'Pierce Energy Resistance',      shortLabel: 'Searing',     defaultSlotAdj: 1, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1 },
    silent:     { id: 'silent',     label: 'Silent (No Verbal)',            shortLabel: 'Silent',      defaultSlotAdj: 1, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1 },
    still:      { id: 'still',      label: 'Still (No Somatic)',            shortLabel: 'Still',       defaultSlotAdj: 1, variableSlot: false, raisesSaveDc: false, actionOverride: null,           damageMode: null,       durationMultiplier: 1, rangeMultiplier: 1, areaMultiplier: 1 }
  };

  const METAMAGIC_RULES = {
    maxSpellLevel: 9,
    domainUsesBaseLevelForEligibility: true,
    spontaneousCastingTimeFullRound: true,
    spontaneousRodFullRound: true,
    maxRodsPerSpell: 1,
    quickenExemptFromSpontaneousFullRound: true,
    quickenAction: 'Swift Action'
  };

  // PHB p.93/97: An empowered, maximized spell gains the separate benefits of each feat:
  // the maximum result plus one-half the normally rolled result.
  function resolveMetamagicDamageMode(transforms) {
    const set = new Set((Array.isArray(transforms) ? transforms : []).map(t => String(t || '').trim()));
    const hasMax = set.has('maximize');
    const hasEmp = set.has('empower');
    if (hasMax && hasEmp) return 'maximize_and_empower';
    if (hasMax) return 'maximize';
    if (hasEmp) return 'empower';
    return 'normal';
  }

  // Canonical V3 Casting Known-Source contract (Sprint E5 — Epic B)
  const CASTING_KNOWN_SOURCES = ['spellbook', 'fullList', 'knownList'];
  const SPELLBOOK_SOURCES = ['levelUp', 'scribed', 'scroll', 'mastery'];
  const DEFAULT_KNOWN_SOURCE_BY_CLASS_ID = {
    'cls-wizard': 'spellbook',
    'cls-wu-jen': 'spellbook',
    'cls-archivist': 'spellbook',
    'cls-cleric': 'fullList',
    'cls-cleric-cloistered-variant': 'fullList',
    'cls-druid': 'fullList',
    'cls-paladin': 'fullList',
    'cls-ranger': 'fullList',
    'cls-blackguard': 'fullList',
    'cls-adept-npc': 'fullList',
    'cls-sorcerer': 'knownList',
    'cls-bard': 'knownList',
    'cls-assassin': 'knownList',
    'cls-beguiler': 'fullList',
    'cls-warmage': 'fullList',
    'cls-dread-necromancer': 'fullList',
    'cls-duskblade': 'knownList',
    'cls-favored-soul': 'knownList'
  };

  function resolveCastingKnownSource(clsDef) {
    if (!clsDef || typeof clsDef !== 'object') return null;
    const sc = clsDef.spellcasting || clsDef.casting || clsDef.progression?.spellcastingChassis || null;
    if (sc && typeof sc.knownSource === 'string' && CASTING_KNOWN_SOURCES.includes(sc.knownSource)) {
      return sc.knownSource;
    }
    const id = String(clsDef.id || '').toLowerCase().trim();
    if (id && DEFAULT_KNOWN_SOURCE_BY_CLASS_ID[id]) return DEFAULT_KNOWN_SOURCE_BY_CLASS_ID[id];
    const nameLow = String(clsDef.name || '').toLowerCase().trim();
    if (/\b(wizard|wu jen|archivist)\b/.test(nameLow)) return 'spellbook';
    if (/\b(cleric|druid|paladin|ranger|blackguard|adept|healer|spirit shaman)\b/.test(nameLow)) return 'fullList';
    if (sc && sc.type && sc.type !== 'none') {
      if (sc.spontaneous) return 'knownList';
      if (String(sc.type).toLowerCase() === 'divine') return 'fullList';
      if (String(sc.type).toLowerCase() === 'arcane') return 'spellbook';
      return 'knownList';
    }
    return null;
  }

  // Official D&D 3.5e Divine Spontaneous Casting Rules & Target Tables (PHB p. 32 Cleric, p. 35 Druid)
  const DIVINE_SPONTANEOUS_CLASS_RULES = {
    'cls-cleric': { kind: 'cleric_energy', minLevel: 0, maxLevel: 9, allowDomainSlot: false },
    'cls-cleric-cloistered-variant': { kind: 'cleric_energy', minLevel: 0, maxLevel: 9, allowDomainSlot: false },
    'cls-cloistered-cleric': { kind: 'cleric_energy', minLevel: 0, maxLevel: 9, allowDomainSlot: false },
    'cls-druid': { kind: 'druid_sna', minLevel: 1, maxLevel: 9, allowDomainSlot: false }
  };

  const DIVINE_SPONTANEOUS_TABLES = {
    cure: [
      { level: 0, id: 'spl-cure-minor-wounds', name: 'Cure Minor Wounds', shortPrefix: 'Cure', diceCount: 0, capMult: 0, flat: 1, effectType: 'heal', icon: '💚', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 1, id: 'spl-cure-light-wounds', name: 'Cure Light Wounds', shortPrefix: 'Cure', diceCount: 1, capMult: 5, effectType: 'heal', icon: '💚', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 2, id: 'spl-cure-moderate-wounds', name: 'Cure Moderate Wounds', shortPrefix: 'Cure', diceCount: 2, capMult: 10, effectType: 'heal', icon: '💚', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 3, id: 'spl-cure-serious-wounds', name: 'Cure Serious Wounds', shortPrefix: 'Cure', diceCount: 3, capMult: 15, effectType: 'heal', icon: '💚', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 4, id: 'spl-cure-critical-wounds', name: 'Cure Critical Wounds', shortPrefix: 'Cure', diceCount: 4, capMult: 20, effectType: 'heal', icon: '💚', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 5, id: 'spl-mass-cure-light-wounds', name: 'Mass Cure Light Wounds', shortPrefix: 'M.Cure', diceCount: 1, capMult: 25, effectType: 'heal', icon: '💚', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 6, id: 'spl-mass-cure-moderate-wounds', name: 'Mass Cure Moderate Wounds', shortPrefix: 'M.Cure', diceCount: 2, capMult: 30, effectType: 'heal', icon: '💚', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 7, id: 'spl-mass-cure-serious-wounds', name: 'Mass Cure Serious Wounds', shortPrefix: 'M.Cure', diceCount: 3, capMult: 35, effectType: 'heal', icon: '💚', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 8, id: 'spl-mass-cure-critical-wounds', name: 'Mass Cure Critical Wounds', shortPrefix: 'M.Cure', diceCount: 4, capMult: 40, effectType: 'heal', icon: '💚', actionType: 'standard', castingTime: 'Standard Action' }
    ],
    inflict: [
      { level: 0, id: 'spl-inflict-minor-wounds', name: 'Inflict Minor Wounds', shortPrefix: 'Inflict', diceCount: 0, capMult: 0, flat: 1, effectType: 'damage', icon: '💀', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 1, id: 'spl-inflict-light-wounds', name: 'Inflict Light Wounds', shortPrefix: 'Inflict', diceCount: 1, capMult: 5, effectType: 'damage', icon: '💀', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 2, id: 'spl-inflict-moderate-wounds', name: 'Inflict Moderate Wounds', shortPrefix: 'Inflict', diceCount: 2, capMult: 10, effectType: 'damage', icon: '💀', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 3, id: 'spl-inflict-serious-wounds', name: 'Inflict Serious Wounds', shortPrefix: 'Inflict', diceCount: 3, capMult: 15, effectType: 'damage', icon: '💀', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 4, id: 'spl-inflict-critical-wounds', name: 'Inflict Critical Wounds', shortPrefix: 'Inflict', diceCount: 4, capMult: 20, effectType: 'damage', icon: '💀', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 5, id: 'spl-mass-inflict-light-wounds', name: 'Mass Inflict Light Wounds', shortPrefix: 'M.Inflict', diceCount: 1, capMult: 25, effectType: 'damage', icon: '💀', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 6, id: 'spl-mass-inflict-moderate-wounds', name: 'Mass Inflict Moderate Wounds', shortPrefix: 'M.Inflict', diceCount: 2, capMult: 30, effectType: 'damage', icon: '💀', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 7, id: 'spl-mass-inflict-serious-wounds', name: 'Mass Inflict Serious Wounds', shortPrefix: 'M.Inflict', diceCount: 3, capMult: 35, effectType: 'damage', icon: '💀', actionType: 'standard', castingTime: 'Standard Action' },
      { level: 8, id: 'spl-mass-inflict-critical-wounds', name: 'Mass Inflict Critical Wounds', shortPrefix: 'M.Inflict', diceCount: 4, capMult: 40, effectType: 'damage', icon: '💀', actionType: 'standard', castingTime: 'Standard Action' }
    ],
    sna: [
      null,
      { level: 1, id: 'spl-summon-natures-ally-i', name: "Summon Nature's Ally I", roman: 'I', effectType: 'summon', icon: '🐺', actionType: 'full', castingTime: '1 Round' },
      { level: 2, id: 'spl-summon-natures-ally-ii', name: "Summon Nature's Ally II", roman: 'II', effectType: 'summon', icon: '🐺', actionType: 'full', castingTime: '1 Round' },
      { level: 3, id: 'spl-summon-natures-ally-iii', name: "Summon Nature's Ally III", roman: 'III', effectType: 'summon', icon: '🐺', actionType: 'full', castingTime: '1 Round' },
      { level: 4, id: 'spl-summon-natures-ally-iv', name: "Summon Nature's Ally IV", roman: 'IV', effectType: 'summon', icon: '🐺', actionType: 'full', castingTime: '1 Round' },
      { level: 5, id: 'spl-summon-natures-ally-v', name: "Summon Nature's Ally V", roman: 'V', effectType: 'summon', icon: '🐺', actionType: 'full', castingTime: '1 Round' },
      { level: 6, id: 'spl-summon-natures-ally-vi', name: "Summon Nature's Ally VI", roman: 'VI', effectType: 'summon', icon: '🐺', actionType: 'full', castingTime: '1 Round' },
      { level: 7, id: 'spl-summon-natures-ally-vii', name: "Summon Nature's Ally VII", roman: 'VII', effectType: 'summon', icon: '🐺', actionType: 'full', castingTime: '1 Round' },
      { level: 8, id: 'spl-summon-natures-ally-viii', name: "Summon Nature's Ally VIII", roman: 'VIII', effectType: 'summon', icon: '🐺', actionType: 'full', castingTime: '1 Round' },
      { level: 9, id: 'spl-summon-natures-ally-ix', name: "Summon Nature's Ally IX", roman: 'IX', effectType: 'summon', icon: '🐺', actionType: 'full', castingTime: '1 Round' }
    ]
  };

  function resolveDivineSpontaneousTarget(conversionType, slotLevel, effectiveCl = 1, opts = {}) {
    const type = String(conversionType || '').toLowerCase().trim();
    const numLvl = Number(slotLevel);
    if (!Number.isFinite(numLvl) || numLvl < 0 || numLvl > 9) return null;
    const slotLvl = Math.floor(numLvl);
    const reqTarget = (opts && opts.targetLevel !== undefined && opts.targetLevel !== null && Number.isFinite(Number(opts.targetLevel)))
      ? Math.min(slotLvl, Math.max(0, Math.floor(Number(opts.targetLevel))))
      : slotLvl;
    const cl = Math.max(1, Math.floor(Number(effectiveCl) || 1));

    if (type === 'sna') {
      if (slotLvl < 1 || reqTarget < 1 || reqTarget > 9) return null;
      const entry = DIVINE_SPONTANEOUS_TABLES.sna[reqTarget];
      if (!entry) return null;
      return {
        conversionType: 'sna',
        id: entry.id,
        name: entry.name,
        targetLevel: entry.level,
        slotLevel: slotLvl,
        formula: null,
        effectType: 'summon',
        shortLabel: `SNA ${entry.roman}`,
        compactLabel: `SNA ${entry.roman}`,
        icon: entry.icon,
        actionType: entry.actionType,
        castingTime: entry.castingTime,
        durationText: `${cl} round${cl === 1 ? '' : 's'}`
      };
    }

    if (type === 'rejuvenation') {
      // PHB II p. 39 (Druid ACF: Spontaneous Rejuvenation): Level 1-9 slot -> Fast Healing = spell level for 3 rounds (30 ft. aura)
      if (slotLvl < 1 || slotLvl > 9) return null;
      return {
        conversionType: 'rejuvenation',
        id: 'acf-spontaneous-rejuvenation',
        name: `Spontaneous Rejuvenation (+${slotLvl} Fast Healing)`,
        targetLevel: slotLvl,
        slotLevel: slotLvl,
        formula: null,
        effectType: 'buff',
        fastHealing: slotLvl,
        durationRounds: 3,
        radiusFt: 30,
        shortLabel: `Rejuv (+${slotLvl} FH)`,
        compactLabel: `FH +${slotLvl}`,
        icon: '🌿',
        actionType: 'standard',
        castingTime: 'Standard Action',
        durationText: '3 rounds (30 ft. aura)'
      };
    }

    if (type === 'domain') {
      // PHB II p. 37 (Cleric ACF: Spontaneous Domain Casting): Level 1-9 slot -> chosen Domain spell of same level or lower
      if (slotLvl < 1 || reqTarget < 1 || reqTarget > 9) return null;
      const domainName = String(opts?.domainName || '').trim();
      const domainSpells = Array.isArray(opts?.domainSpells) ? opts.domainSpells : [];
      const domSpell = domainSpells.find(sp => sp && Number(sp.level) === reqTarget)
        || domainSpells.filter(sp => sp && Number(sp.level) <= reqTarget).sort((a, b) => Number(b.level) - Number(a.level))[0]
        || null;
      if (!domSpell || !domSpell.name) return null;
      const compactSpell = domSpell.name.length > 14 ? `${domSpell.name.slice(0, 13)}…` : domSpell.name;
      const shortSpell = domSpell.name.length > 18 ? `${domSpell.name.slice(0, 17)}…` : domSpell.name;
      return {
        conversionType: 'domain',
        id: domSpell.id || `dom-${domainName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${domSpell.level}`,
        name: domSpell.name,
        domainName,
        targetLevel: Number(domSpell.level) || reqTarget,
        slotLevel: slotLvl,
        formula: null,
        effectType: 'domain_spell',
        shortLabel: shortSpell,
        compactLabel: compactSpell,
        icon: '⚜️',
        actionType: 'standard',
        castingTime: 'Standard Action'
      };
    }

    if (type === 'cure' || type === 'inflict') {
      // PHB p. 32: "of the same spell level or lower" -> 9th-level slot converts to 8th-level Mass Cure/Inflict Critical Wounds
      const targetLvl = Math.min(8, reqTarget);
      const entry = DIVINE_SPONTANEOUS_TABLES[type][targetLvl];
      if (!entry) return null;
      const formula = entry.diceCount === 0
        ? String(entry.flat || 1)
        : `${entry.diceCount}d8+${Math.min(cl, entry.capMult)}`;
      return {
        conversionType: type,
        id: entry.id,
        name: entry.name,
        targetLevel: entry.level,
        slotLevel: slotLvl,
        formula,
        effectType: entry.effectType,
        shortLabel: entry.diceCount === 0
          ? `${entry.shortPrefix} (${formula}${type === 'cure' ? ' HP' : ''})`
          : `${entry.shortPrefix} (${formula})`,
        compactLabel: type === 'inflict' ? `Inf ${formula}` : `Cure ${formula}`,
        icon: entry.icon,
        actionType: entry.actionType,
        castingTime: entry.castingTime
      };
    }

    return null;
  }

  // Canonical V3 Companion / Entity kinds (ADR-058)
  const ENTITY_KINDS = ['animal_companion', 'familiar', 'special_mount', 'fiendish_servant'];

  // Official 3.5e arcane SPELL-casting classes (Complete Arcane p.81: excludes invocation/SLA classes like Warlock)
  const ARCANE_SPELLCASTING_CLASSES = [
    'wizard', 'sorcerer', 'bard', 'assassin', 'beguiler', 'duskblade', 'warmage',
    'dread necromancer', 'wu jen', 'hexblade', 'spellthief', 'sublime chord',
    'savage bard', 'battle sorcerer', 'death master', 'sha\'ir', 'red wizard'
  ];

  // Canonical D&D 3.5e default effective-level formulas for Companion / Entity kinds (ADR-058)
  const DEFAULT_ENTITY_LEVEL_FORMULAS = {
    animal_companion: '@classes.druid.level + (@classes.ranger.level >= 4 ? floor(@classes.ranger.level / 2) : 0)',
    familiar: '@classes.wizard.level + @classes.sorcerer.level',
    special_mount: '@classes.paladin.level',
    fiendish_servant: '@level'
  };

  // Canonical D&D 3.5e per-kind Companion / Entity eligibility rules (Phase P3)
  const DEFAULT_ENTITY_ELIGIBILITY = {
    animal_companion: {
      label: 'Animal Companion',
      prerequisite: 'Requires Druid 1+, Ranger 4+, or an Animal Companion / Wild Cohort grant.',
      formula: '(@classes.druid.level >= 1 || @classes.ranger.level >= 4) ? 1 : 0'
    },
    familiar: {
      label: 'Familiar',
      prerequisite: 'Requires Wizard 1+, Sorcerer 1+, or a Summon / Obtain Familiar grant.',
      formula: '(@classes.wizard.level >= 1 || @classes.sorcerer.level >= 1) ? 1 : 0'
    },
    special_mount: {
      label: 'Special Mount',
      prerequisite: 'Requires Paladin 5+ or a Special Mount grant.',
      formula: '@classes.paladin.level >= 5 ? 1 : 0'
    },
    fiendish_servant: {
      label: 'Fiendish Servant',
      prerequisite: 'Requires Blackguard 5+ or a Fiendish Servant grant.',
      formula: '@classes.blackguard.level >= 5 ? 1 : 0'
    }
  };

  // Official D&D 3.5e Druid Wild Shape progression (PHB p.37, Table 3-8 + ELH p.10: +1/day every 4 levels after 18th)
  function getWildShapeProfile(druidLevel, hasElementalFlag) {
    const lvl = Math.max(0, Math.floor(Number(druidLevel) || 0));
    const dailyUses = lvl >= 22 ? (6 + Math.floor((lvl - 18) / 4))
      : (lvl >= 18 ? 6
        : (lvl >= 14 ? 5
          : (lvl >= 10 ? 4
            : (lvl >= 7 ? 3
              : (lvl >= 6 ? 2
                : (lvl >= 5 ? 1 : 0))))));
    const elementalDailyUses = lvl >= 20 ? 3
      : (lvl >= 18 ? 2
        : (lvl >= 16 ? 1 : 0));
    const allowedTypes = ['Animal'];
    if (lvl >= 12) allowedTypes.push('Plant');
    if (lvl >= 16 || hasElementalFlag) allowedTypes.push('Elemental');
    const allowedSizes = ['Small', 'Medium'];
    if (lvl >= 8) allowedSizes.push('Large');
    if (lvl >= 11) allowedSizes.push('Tiny');
    if (lvl >= 15) allowedSizes.push('Huge');
    const elementalAllowedSizes = lvl >= 20
      ? ['Small', 'Medium', 'Large', 'Huge']
      : (lvl >= 16 ? ['Small', 'Medium', 'Large'] : []);
    return {
      effectiveLevel: lvl,
      maxHd: lvl,
      durationHours: lvl,
      dailyUses,
      elementalDailyUses,
      allowedTypes,
      allowedSizes,
      elementalAllowedSizes
    };
  }

  const DnD35Ruleset = {
    id: 'dnd35',
    name: 'D&D 3.5e Official RAW',
    abilities: ABILITIES,
    skills: SKILLS,
    bonusTypes: BONUS_TYPES,
    stackingBonusTypes: ['dodge', 'circumstance', 'racial', 'untyped', 'synergy'],
    consolidatedSkillBonusMode: 'single_highest',
    actionEconomy: 'standard_move_swift',
    damageTypeDefs: DAMAGE_TYPE_DEFS,
    damageTypes: DAMAGE_TYPES,
    energyTypes: ENERGY_TYPES,
    creatureSizes: CREATURE_SIZES,
    sizeAcAttackModifiers: SIZE_AC_ATTACK_MODS,
    sizeGrappleModifiers: SIZE_GRAPPLE_MODS,
    sizeHideModifiers: SIZE_HIDE_MODS,
    srdArmors: SRD_ARMORS,
    srdShields: SRD_SHIELDS,
    classProficiencies: CLASS_PROFICIENCIES,
    statSwapTargetGroups: STAT_SWAP_TARGET_GROUPS,
    statSwapSources: STAT_SWAP_SOURCES,
    statSwapOps: STAT_SWAP_OPS,
    statSwapScopes: STAT_SWAP_SCOPES,
    ruleSwitchFlags: RULE_SWITCH_FLAGS,
    ruleSwitchParamsSchema: RULE_SWITCH_PARAMS_SCHEMA,
    metamagicTransforms: METAMAGIC_TRANSFORMS,
    metamagicRules: METAMAGIC_RULES,
    resolveMetamagicDamageMode,
    castingKnownSources: CASTING_KNOWN_SOURCES,
    spellbookSources: SPELLBOOK_SOURCES,
    defaultKnownSourceByClassId: DEFAULT_KNOWN_SOURCE_BY_CLASS_ID,
    resolveCastingKnownSource,
    divineSpontaneousClassRules: DIVINE_SPONTANEOUS_CLASS_RULES,
    divineSpontaneousTables: DIVINE_SPONTANEOUS_TABLES,
    resolveDivineSpontaneousTarget,
    entityKinds: ENTITY_KINDS,
    arcaneSpellcastingClasses: ARCANE_SPELLCASTING_CLASSES,
    defaultEntityLevelFormulas: DEFAULT_ENTITY_LEVEL_FORMULAS,
    defaultEntityEligibility: DEFAULT_ENTITY_ELIGIBILITY,
    getWildShapeProfile,

    calcAbilityMod(score) {
      return Math.floor(((Number(score) || 10) - 10) / 2);
    },
    calcMaxSkillRanks(level, isClassSkill) {
      const maxCls = Math.max(1, Number(level) || 1) + 3;
      return isClassSkill ? maxCls : maxCls / 2;
    },
    calcSkillPointCost(isClassSkill) {
      return isClassSkill ? 1 : 2;
    },
    calcLevelSkillPoints(baseSkill, intMod, racialSkillBonus = 0, isFirstLevel = false) {
      const perLvl = Math.max(1, (Number(baseSkill) || 2) + (Number(intMod) || 0)) + (Number(racialSkillBonus) || 0);
      return isFirstLevel ? perLvl * 4 : perLvl;
    },
    durationToRounds(durationText, casterLevel = 1) {
      const raw = String(durationText || '').trim();
      if (!raw || /instantaneous|permanent|concentration|dismissible\s+only/i.test(raw)) return null;
      const cl = Math.max(1, Number(casterLevel) || 1);
      const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
      const normalized = raw.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, (m) => String(WORD_NUM[m.toLowerCase()] || m));
      const perLvl = normalized.match(/(\d+)\s*(round|rd|rds|rounds|min|mins|minute|minutes|hour|hr|hrs|hours|day|days)\.?\s*\/\s*(?:level|cl)/i);
      if (perLvl) {
        const n = parseInt(perLvl[1], 10) || 1;
        const u = perLvl[2].toLowerCase();
        if (u.startsWith('r')) return n * cl;
        if (u.startsWith('m')) return n * 10 * cl;
        if (u.startsWith('h')) return n * 600 * cl;
        if (u.startsWith('d')) return n * 14400 * cl;
      }
      const fixed = normalized.match(/^(\d+)\s*(round|rd|rds|rounds|min|mins|minute|minutes|hour|hr|hrs|hours|day|days)\b/i);
      if (fixed) {
        const n = parseInt(fixed[1], 10) || 0;
        if (n <= 0) return null;
        const u = fixed[2].toLowerCase();
        if (u.startsWith('r')) return n;
        if (u.startsWith('m')) return n * 10;
        if (u.startsWith('h')) return n * 600;
        if (u.startsWith('d')) return n * 14400;
      }
      return null;
    },
    formatRoundsDuration(rounds) {
      const r = Math.max(0, Math.floor(Number(rounds) || 0));
      if (r <= 0) return 'Expired';
      if (r >= 14400 && r % 14400 === 0) {
        const d = r / 14400;
        return d === 1 ? '24 hr' : `${d} days`;
      }
      if (r >= 600 && r % 600 === 0) return `${r / 600} hr`;
      if (r >= 10 && r % 10 === 0 && r < 600) return `${r / 10} min`;
      return `${r} ${r === 1 ? 'round' : 'rounds'}`;
    },
    // Official D&D 3.5e Metamagic duration scaling (Extend Spell ×2, Persistent Spell 24 hr)
    applyMetamagicToDuration(durationRounds, durationText, metamagicList) {
      const list = Array.isArray(metamagicList) ? metamagicList : [];
      if (list.length === 0) return { durationRounds, durationText };
      const keys = list.map((m) => String((typeof m === 'string' ? m : (m && (m.transform || m.featId || m.id || m.name))) || '').toLowerCase());
      const hasPersistent = keys.some((k) => k.includes('persist'));
      const hasExtend = keys.some((k) => k.includes('extend'));
      const rawLower = String(durationText || '').toLowerCase();
      if (/instantaneous|permanent|concentration/.test(rawLower)) {
        return { durationRounds, durationText };
      }
      if (hasPersistent) {
        return { durationRounds: 14400, durationText: '24 hr' };
      }
      if (hasExtend && Number.isFinite(Number(durationRounds)) && Number(durationRounds) > 0) {
        const doubled = Math.floor(Number(durationRounds) * 2);
        return { durationRounds: doubled, durationText: DnD35Ruleset.formatRoundsDuration(doubled) };
      }
      return { durationRounds, durationText };
    },
    // Official D&D 3.5e Spell Matrix backlash heal cap (Spell Compendium p.199)
    getEffectiveHealCap(doc, maxHp) {
      const m = Math.max(1, Number(maxHp) || 1);
      const locked = (doc && doc.spellcasting && doc.spellcasting.matrix && doc.spellcasting.matrix.active)
        ? Math.max(0, Math.floor(Number(doc.spellcasting.matrix.lockedDamage) || 0))
        : 0;
      return Math.max(0, m - locked);
    },
    // Official D&D 3.5e Spell Matrix rules (Spell Compendium p.199-200)
    // Backlash damage (1d6/2d6/3d6) cannot be healed while the matrix persists.
    // All three tiers hold only spells of <= 3rd level that are Quicken-eligible (<= 1 standard action).
    spellMatrixTiers: {
      lesser: {
        id: 'spl-lesser-spell-matrix',
        tier: 'lesser',
        name: 'Lesser Spell Matrix',
        spellLevel: 5,
        maxStored: 1,
        maxStoredSpellLevel: 3,
        backlashDice: '1d6',
        allowSequence: false,
        allowAutoTrigger: false,
        durationFormula: '10 min/level',
        loadWindowRounds: 1
      },
      standard: {
        id: 'spl-spell-matrix',
        tier: 'standard',
        name: 'Spell Matrix',
        spellLevel: 7,
        maxStored: 2,
        maxStoredSpellLevel: 3,
        backlashDice: '2d6',
        allowSequence: true,
        allowAutoTrigger: false,
        durationFormula: '10 min/level',
        loadWindowRounds: 2
      },
      greater: {
        id: 'spl-greater-spell-matrix',
        tier: 'greater',
        name: 'Greater Spell Matrix',
        spellLevel: 9,
        maxStored: 3,
        maxStoredSpellLevel: 3,
        backlashDice: '3d6',
        allowSequence: true,
        allowAutoTrigger: true,
        durationFormula: '10 min/level',
        loadWindowRounds: 3
      }
    },
    isSpellMatrixEligible(spell, effectiveSlotLevel, tierKey = 'lesser') {
      const tier = DnD35Ruleset.spellMatrixTiers[tierKey] || DnD35Ruleset.spellMatrixTiers.lesser;
      const lvl = Number(effectiveSlotLevel);
      if (!Number.isFinite(lvl) || lvl < 0 || lvl > tier.maxStoredSpellLevel) {
        return { eligible: false, reason: `Spell level (${lvl}) exceeds Spell Matrix cap (max ${tier.maxStoredSpellLevel}rd level).` };
      }
      const ct = String(spell?.castingTime || spell?.delivery?.castingTime || spell?.actionType || '1 standard action').toLowerCase().trim();
      const isQuickOrStandard = /\b(standard|swift|immediate|free|move)\b/i.test(ct);
      const isLonger = /\b(round|rounds|full[\s-]*round|min|mins|minute|minutes|hour|hours|hr|day|days)\b/i.test(ct);
      if (isLonger || !isQuickOrStandard) {
        return { eligible: false, reason: `Casting time "${spell?.castingTime || ct}" is not Quicken-eligible (must be <= 1 standard action).` };
      }
      return { eligible: true, reason: null };
    },
    // Official D&D 3.5e Contingency (PHB p.213), Psionic Contingency (XPH), and Craft Contingent Spell (CArc p.77)
    contingencyRules: {
      maxActiveSpellContingency: 1,
      psionicsMagicTransparency: true,
      maxCompanionSpellLevel(cl) {
        return Math.min(6, Math.floor(Math.max(1, Number(cl) || 1) / 3));
      },
      maxCraftedContingentSpells(hd) {
        return Math.max(0, Math.floor(Number(hd) || 0));
      }
    },
    calcIterativeBab(bab, preEpicBab) {
      const eff = Math.max(0, Math.floor(Number(bab) || 0));
      const countBasis = (preEpicBab !== undefined && preEpicBab !== null && Number.isFinite(Number(preEpicBab)))
        ? Math.max(0, Math.floor(Number(preEpicBab)))
        : eff;
      const attackCount = Math.min(4, Math.max(1, Math.floor((Math.max(1, countBasis) - 1) / 5) + 1));
      const out = [];
      for (let i = 0; i < attackCount; i++) {
        out.push(eff - i * 5);
      }
      return out;
    },
    calcGrapple(bab, strMod, sizeMod, misc) {
      return (Number(bab) || 0) + (Number(strMod) || 0) + (Number(sizeMod) || 0) + (Number(misc) || 0);
    },
    calcBaseSave(level, progression) {
      const lvl = Math.max(0, Math.floor(Number(level) || 0));
      if (lvl === 0) return 0;
      return progression === 'good' ? (2 + Math.floor(lvl / 2)) : Math.floor(lvl / 3);
    },
    // Official D&D 3.5e Epic Level Progression (DMG p.206):
    // After character level 20, class BAB/save progressions stop; Epic Attack Bonus is +1 at odd levels (21, 23, ...)
    // and Epic Save Bonus is +1 to all saves at even levels (22, 24, ...), regardless of class taken.
    epic: {
      threshold: 20,
      thresholdBasis: 'characterLevel'
    },
    calcEpicBonuses(totalLevels) {
      const lvl = Math.max(0, Math.floor(Number(totalLevels) || 0));
      if (lvl <= 20) return { epicBab: 0, epicSave: 0 };
      const epicLevels = lvl - 20;
      return {
        epicBab: Math.floor((epicLevels + 1) / 2),
        epicSave: Math.floor(epicLevels / 2)
      };
    },
    // Official D&D 3.5e Monk Unarmed Strike Damage (PHB Table 3-10, p.41 + DMG p.28 size progression):
    // Returns the canonical base unarmed die for a Monk of `monkLevel` at effective creature `sizeCategory`.
    calcMonkUnarmedDamage(monkLevel, sizeCategory = 'Medium') {
      const lvl = Math.max(1, Math.floor(Number(monkLevel) || 0));
      const tier = lvl >= 20 ? 5 : (lvl >= 16 ? 4 : (lvl >= 12 ? 3 : (lvl >= 8 ? 2 : (lvl >= 4 ? 1 : 0))));
      const sz = String(sizeCategory || 'Medium').trim().toLowerCase();
      const tables = {
        fine:       ['1',   '1d2', '1d3', '1d4', '1d6', '1d8'],
        diminutive: ['1d2', '1d3', '1d4', '1d6', '1d8', '1d10'],
        tiny:       ['1d3', '1d4', '1d6', '1d8', '1d10', '2d6'],
        small:      ['1d4', '1d6', '1d8', '1d10', '2d6', '2d8'],
        medium:     ['1d6', '1d8', '1d10', '2d6', '2d8', '2d10'],
        large:      ['1d8', '2d6', '2d8', '3d6', '3d8', '4d8'],
        huge:       ['2d6', '3d6', '3d8', '4d6', '4d8', '6d8'],
        gargantuan: ['3d6', '4d6', '4d8', '6d6', '6d8', '8d8'],
        colossal:   ['4d6', '6d6', '6d8', '8d6', '8d8', '12d8']
      };
      const row = tables[sz] || tables.medium;
      return row[tier] || '1d6';
    },
    // Official D&D 3.5e Positive / Negative Energy Healing Inversion (MM p.317, PHB p.215):
    // Positive energy (Cure, Heal) heals the living and damages Undead; Negative energy (Inflict, Harm) damages the living and heals Undead.
    resolveEnergyHealingEffect(isUndead, energyType = 'positive', amount = 0) {
      const amt = Math.max(0, Math.floor(Number(amount) || 0));
      const eLow = String(energyType || 'positive').trim().toLowerCase();
      const isNeg = eLow.includes('neg') || eLow.includes('inflict') || eLow.includes('harm');
      const heals = isUndead ? isNeg : !isNeg;
      return {
        mode: heals ? 'heal' : 'damage',
        delta: heals ? amt : -amt,
        inverted: Boolean(isUndead),
        energyType: isNeg ? 'Negative' : 'Positive'
      };
    },
    // Official D&D 3.5e RAW (MIC p.139 Strongarm Bracers vs. XPH Powerful Build):
    // Effective-size category shifts in the same scope do not stack with each other;
    // take the single highest positive shift plus the most negative penalty.
    resolveEffectiveSizeScope(values) {
      if (!Array.isArray(values) || values.length === 0) return 0;
      let maxPos = 0;
      let minNeg = 0;
      values.forEach((raw) => {
        const v = Math.floor(Number(raw) || 0);
        if (v > maxPos) maxPos = v;
        if (v < minNeg) minNeg = v;
      });
      return maxPos + minNeg;
    },
    // Official D&D 3.5e RAW (FAQ / Rules Compendium p. 151):
    // One actual creature size change (e.g. Enlarge Person, Righteous Might) stacks with at most
    // one effective/virtual weapon size increase (e.g. Improved Natural Attack, Lead Blades, Greater Mighty Wallop).
    // Multiple effective size/die-step increases do not stack with each other (take highest positive + lowest negative).
    resolveWeaponDamageDieSteps(entries) {
      if (!Array.isArray(entries) || entries.length === 0) {
        return { total: 0, actual: 0, effective: 0, sources: [] };
      }
      const pickWinners = (list) => {
        let bestPos = null;
        let bestNeg = null;
        list.forEach((entry) => {
          const val = Math.floor(Number(entry.value) || 0);
          if (val > 0 && (!bestPos || val > bestPos.val)) bestPos = { val, source: entry.source };
          if (val < 0 && (!bestNeg || val < bestNeg.val)) bestNeg = { val, source: entry.source };
        });
        const total = (bestPos ? bestPos.val : 0) + (bestNeg ? bestNeg.val : 0);
        const srcs = [];
        if (bestPos && bestPos.source) srcs.push(bestPos.source);
        if (bestNeg && bestNeg.source) srcs.push(bestNeg.source);
        return { total, srcs };
      };
      const actualList = entries.filter(e => e && e.category === 'actual');
      const effectiveList = entries.filter(e => e && e.category !== 'actual');
      const act = pickWinners(actualList);
      const eff = pickWinners(effectiveList);
      return {
        total: act.total + eff.total,
        actual: act.total,
        effective: eff.total,
        sources: [...act.srcs, ...eff.srcs]
      };
    },
    /**
     * D&D 3.5e RAW tactical limits (PHB p.98 Power Attack, PHB p.92 Combat Expertise).
     * Single source of truth for Store reducers, UI steppers, and Rule Master terminal.
     */
    getTacticalLimits(doc) {
      const bab = Math.max(0, Number(doc && doc.bab) || 0);
      if (!doc || typeof doc !== 'object') {
        return { bab: 0, hasPowerAttack: false, hasCombatExpertise: false, powerAttackMax: 0, combatExpertiseMax: 0 };
      }
      const norm = (s) => String(s || '').replace(/^[^A-Za-z0-9]+(\[.*?\])?\s*/, '').trim().toLowerCase();
      let hasPowerAttack = false;
      let hasCombatExpertise = false;
      const checkFeat = (f) => {
        if (!f) return;
        if (typeof f === 'object') {
          const id = String(f.id || '').toLowerCase();
          if (id === 'feat-power-attack') hasPowerAttack = true;
          if (id === 'feat-combat-expertise') hasCombatExpertise = true;
          const nm = norm(f.name || f.featName || '');
          if (nm === 'power attack') hasPowerAttack = true;
          if (nm === 'combat expertise') hasCombatExpertise = true;
          if (Array.isArray(f.grantedCapabilities)) {
            if (f.grantedCapabilities.includes('powerAttack')) hasPowerAttack = true;
            if (f.grantedCapabilities.includes('combatExpertise')) hasCombatExpertise = true;
          }
        } else {
          const nm = norm(f);
          if (nm === 'power attack') hasPowerAttack = true;
          if (nm === 'combat expertise') hasCombatExpertise = true;
        }
      };
      if (Array.isArray(doc.feats)) doc.feats.forEach(checkFeat);
      if (Array.isArray(doc.levelProgression)) {
        doc.levelProgression.forEach((row) => {
          if (row && Array.isArray(row.feats)) row.feats.forEach(checkFeat);
        });
      }
      return {
        bab,
        hasPowerAttack,
        hasCombatExpertise,
        powerAttackMax: hasPowerAttack ? bab : 0,
        combatExpertiseMax: hasCombatExpertise ? Math.min(5, bab) : 0
      };
    },
    /**
     * Single-source D&D 3.5e RAW tactical combat resolver (Power Attack, Charge, Heedless Charge).
     * Shared by AC derivation and weapon attack/damage derivation so BAB buffs never desync AC and attack rolls.
     */
    resolveTacticalCombat(doc, derived = {}) {
      const bab = Math.max(0, Number(derived.bab ?? (doc && doc.bab) ?? 0) || 0);
      const tac = Object.assign({}, (doc && doc.tactical) || {}, derived.tactical || {});
      // Never read stale doc.ruleFlags (previous derive output); only read freshly derived ruleFlags or legoEval.entries.
      let paToAcFlag = (derived.ruleFlags && derived.ruleFlags.powerAttackPenaltyToAc)
        || (derived.legoEval && derived.legoEval.ruleFlags && derived.legoEval.ruleFlags.powerAttackPenaltyToAc)
        || null;
      if (!paToAcFlag && derived.legoEval && Array.isArray(derived.legoEval.entries)) {
        for (let i = 0; i < derived.legoEval.entries.length; i++) {
          const ent = derived.legoEval.entries[i];
          if (ent && ent.ruleFlags && ent.ruleFlags.powerAttackPenaltyToAc) {
            paToAcFlag = ent.ruleFlags.powerAttackPenaltyToAc;
            break;
          }
        }
      }
      const paRaw = Math.max(0, Number(tac.powerAttack) || 0);
      const paAmount = Math.min(bab, paRaw);
      const charge = Boolean(tac.charge || tac.charging);
      const chargeAcPenalty = charge ? 2 : 0;

      const heedlessChargeAvailable = Boolean(paToAcFlag);
      const minPa = (paToAcFlag && typeof paToAcFlag === 'object' && Number.isFinite(Number(paToAcFlag.minPowerAttack)))
        ? Math.max(1, Number(paToAcFlag.minPowerAttack))
        : 5;
      const reqCond = (paToAcFlag && typeof paToAcFlag === 'object' && paToAcFlag.when !== undefined)
        ? String(paToAcFlag.when).toLowerCase().trim()
        : 'charging';
      // Fail-closed closed enum check: unknown `when` values never auto-activate Heedless Charge.
      const allowedWhen = RULE_SWITCH_PARAMS_SCHEMA.powerAttackPenaltyToAc.when.enum;
      const condMet = allowedWhen.includes(reqCond) ? (reqCond === 'charging' ? charge : false) : false;
      const heedlessChargeEligible = heedlessChargeAvailable && condMet && paAmount >= minPa;
      const heedlessChargeActive = heedlessChargeEligible && Boolean(tac.heedlessCharge);

      return {
        bab,
        paAmount,
        paAttackPenalty: heedlessChargeActive ? 0 : paAmount,
        paAcPenalty: heedlessChargeActive ? paAmount : 0,
        charge,
        chargeAcPenalty,
        heedlessChargeAvailable,
        heedlessChargeMinPa: minPa,
        heedlessChargeEligible,
        heedlessChargeActive
      };
    },

    /**
     * D&D 3.5e RAW Arcane Spell Failure (PHB p. 123, Bard p. 29, Warmage/Beguiler/Duskblade/Hexblade, Battle Caster):
     * Evaluates equipped armor & shield ASF per arcane casting class (`byClassId`) using effective armor category
     * (so Mithral shifts one category lighter) while preserving shield ASF unless the class explicitly exempts shields.
     */
    resolveArcaneSpellFailure(asfSources, casterProfiles, otherAsf = 0) {
      const ARMOR_RANK = { none: 0, light: 1, medium: 2, heavy: 3 };
      const SHIELD_RANK = { none: 0, buckler: 1, light: 2, heavy: 3, tower: 4 };
      const sources = Array.isArray(asfSources) ? asfSources : [];
      const profiles = Array.isArray(casterProfiles) ? casterProfiles : [];
      const other = Math.max(0, Math.floor(Number(otherAsf) || 0));
      const rawArmor = sources.reduce((sum, s) => sum + Math.max(0, Number(s && s.asf) || 0), 0);

      const normalizeArmorRank = (v) => {
        if (v === true) return 3;
        const k = String(v || 'none').toLowerCase().trim();
        if (k === 'all') return 3;
        return ARMOR_RANK[k] !== undefined ? ARMOR_RANK[k] : 0;
      };
      const normalizeShieldRank = (v) => {
        if (v === true) return 4;
        const k = String(v || 'none').toLowerCase().trim();
        if (k === 'all') return 4;
        return SHIELD_RANK[k] !== undefined ? SHIELD_RANK[k] : 0;
      };

      const byClassId = {};
      let primaryResult = null;
      profiles.forEach((p) => {
        if (!p || !p.classId) return;
        const isDivineOnly = String(p.tradition || '').toLowerCase() === 'divine';
        const baseArmorRank = isDivineOnly ? 3 : normalizeArmorRank(p.ignoreAsf);
        const bcSteps = (!isDivineOnly && baseArmorRank > 0) ? Math.max(0, Number(p.battleCasterSteps) || 0) : 0;
        const maxArmorRank = Math.min(3, baseArmorRank + bcSteps);
        const maxShieldRank = isDivineOnly ? 4 : normalizeShieldRank(p.ignoreShieldAsf);

        let classArmorAsf = 0;
        sources.forEach((src) => {
          const val = Math.max(0, Number(src && src.asf) || 0);
          if (val <= 0) return;
          if (src.kind === 'shield') {
            const sRank = SHIELD_RANK[String(src.effectiveCategory || 'heavy').toLowerCase()] || 3;
            if (sRank > maxShieldRank) classArmorAsf += val;
          } else {
            const aRank = ARMOR_RANK[String(src.effectiveCategory || 'light').toLowerCase()] || 1;
            if (aRank > maxArmorRank) classArmorAsf += val;
          }
        });
        const entry = {
          classId: p.classId,
          className: p.className || p.classId,
          tradition: p.tradition || 'arcane',
          armor: classArmorAsf,
          other: isDivineOnly ? 0 : other,
          total: isDivineOnly ? 0 : Math.min(100, classArmorAsf + other)
        };
        byClassId[p.classId] = entry;
        if (!primaryResult && !isDivineOnly) primaryResult = entry;
        if (p.isPrimary && !isDivineOnly) primaryResult = entry;
      });

      const aggArmor = primaryResult ? primaryResult.armor : rawArmor;
      return {
        armor: aggArmor,
        other,
        total: Math.min(100, aggArmor + other),
        rawArmor,
        byClassId,
        sources
      };
    },

    bodySlots: ['Head', 'Face', 'Throat', 'Shoulders', 'Body', 'Torso', 'Arms', 'Hands', 'Waist', 'Feet', 'Ring 1', 'Ring 2'],

    assistant: {
      displayName: 'D&D 3.5e',
      shortTag: '3.5e',
      promptVersion: 'e4.4-v1',
      memoryNamespace: 'dnd35',
      compendiumScope: { rulesetId: 'dnd35' },
      bookAbbrevs: ['PHB', 'DMG', 'MM', 'SRD', 'SC', 'MIC', 'PHB II', 'ToB', 'CArc', 'CDiv', 'CAdv', 'CW', 'XPH', 'MoI', 'ToM'],
      editionGuard: [
        'Advantage / Disadvantage (5e)',
        'Bonus Action / 5e Concentration limit (5e)',
        'Short Rest Hit Dice spending (5e)',
        'CMB / CMD (PF1e)',
        '3-Action Economy / Degrees of Success / Proficiency Ranks (PF2e)'
      ],
      commandCapabilities: [
        'next_round', 'long_rest', 'short_rest', 'roll_init', 'toggle_action',
        'attack', 'full_attack', 'aoo', 'roll_save', 'roll_skill', 'roll_dice',
        'open_level_up', 'open_guide', 'hp', 'cast_spell', 'toggle_buff',
        'add_feat', 'add_item', 'use_ability', 'stat_adjust', 'switch_tab',
        'undo', 'open_crafter', 'add_note', 'remember_pref',
        'comp_hp', 'comp_attack', 'comp_full_attack', 'comp_save', 'comp_switch', 'comp_open'
      ],
      crafterPromptFragment: 'Pure Canonical V3 entry (effects/modes/powers/choices)',

      stackingSummary() {
        const stacking = (DnD35Ruleset.stackingBonusTypes || []).join(', ');
        const nonStacking = (DnD35Ruleset.bonusTypes || [])
          .filter(b => b && !b.stacks && b.id !== 'Penalty')
          .map(b => b.id)
          .slice(0, 14)
          .join(', ');
        return `Same-type bonuses do NOT stack (highest wins). Stacking types: ${stacking}. Common non-stacking types: ${nonStacking}.`;
      },

      actionEconomySummary() {
        return 'Per round: 1 Standard + 1 Move (or 1 Full-Round) + 1 Swift (or 1 Immediate, consuming next Swift) + Free actions.';
      },

      buildTacticalSnapshot(derived, char) {
        if (!derived || !char) return null;
        const stackingSet = new Set((DnD35Ruleset.stackingBonusTypes || []).map(s => String(s).toLowerCase()));
        const entries = Array.isArray(derived.lego?.entries) ? derived.lego.entries : [];

        const SAVE_BONUS_POOL = ['Resistance', 'Morale', 'Luck', 'Insight', 'Sacred', 'Profane', 'Competence', 'Alchemical', 'Circumstance'];
        const AC_BONUS_POOL = ['Armor', 'Shield', 'Natural Armor', 'Deflection', 'Dodge', 'Insight', 'Luck', 'Sacred', 'Profane', 'Morale', 'Circumstance'];

        function collectOccupied(targetPredicate, pool) {
          const occupied = {};
          for (const ent of entries) {
            const mods = Array.isArray(ent?.modifiers) ? ent.modifiers : [];
            for (const m of mods) {
              if (!m || !targetPredicate(String(m.target || '').toLowerCase())) continue;
              const val = Number(m.value);
              if (!Number.isFinite(val) || val === 0) continue;
              const rawType = String(m.type || 'Untyped').trim() || 'Untyped';
              const src = String(m.source || ent.name || 'Active Effect').trim();
              if (!occupied[rawType] || Math.abs(val) > Math.abs(occupied[rawType].v)) {
                occupied[rawType] = { v: val, src };
              }
            }
          }
          const openTypes = pool.filter(t => {
            const lc = t.toLowerCase();
            if (stackingSet.has(lc)) return true;
            return !Object.keys(occupied).some(k => k.toLowerCase() === lc);
          });
          return { occupied, openTypes };
        }

        const saves = {};
        const saveDetail = derived.saves?.detail || {};
        for (const key of ['fort', 'ref', 'will']) {
          const det = saveDetail[key] || {};
          const { occupied, openTypes } = collectOccupied(
            t => t === 'save.all' || t === 'saves.all' || t === `save.${key}` || t === `saves.${key}`,
            SAVE_BONUS_POOL
          );
          saves[key] = {
            total: Number(derived.saves?.[key] ?? det.total ?? 0),
            base: Number(det.base ?? 0),
            ability: Number(det.ability ?? 0),
            occupied,
            openTypes
          };
        }

        const acScan = collectOccupied(
          t => t === 'ac' || t === 'ac.total' || t.startsWith('ac.'),
          AC_BONUS_POOL
        );
        if (derived.ac) {
          const acMap = [
            ['Armor', derived.ac.armor],
            ['Shield', derived.ac.shield],
            ['Natural Armor', derived.ac.natural],
            ['Deflection', derived.ac.deflection],
            ['Dodge', derived.ac.dodge]
          ];
          for (const [label, val] of acMap) {
            if (Number(val) > 0 && !acScan.occupied[label]) {
              const srcList = derived.ac.sources?.[label.toLowerCase().split(' ')[0]];
              const src = Array.isArray(srcList) && srcList.length
                ? String(srcList[0].source || srcList[0].name || label)
                : label;
              acScan.occupied[label] = { v: Number(val), src };
            }
          }
          acScan.openTypes = AC_BONUS_POOL.filter(t => {
            const lc = t.toLowerCase();
            if (stackingSet.has(lc)) return true;
            return !Object.keys(acScan.occupied).some(k => k.toLowerCase() === lc);
          });
        }

        const SLOT_ALIAS_MAP = {
          head: 'Head', headband: 'Head', helm: 'Head',
          face: 'Face', eyes: 'Face', goggles: 'Face', mask: 'Face',
          throat: 'Throat', neck: 'Throat', amulet: 'Throat', periapt: 'Throat',
          shoulders: 'Shoulders', cloak: 'Shoulders', mantle: 'Shoulders', cape: 'Shoulders',
          body: 'Body', armor: 'Body', robe: 'Body',
          torso: 'Torso', vest: 'Torso', shirt: 'Torso', tunic: 'Torso',
          arms: 'Arms', wrists: 'Arms', bracers: 'Arms',
          hands: 'Hands', gloves: 'Hands', gauntlets: 'Hands',
          waist: 'Waist', belt: 'Waist',
          feet: 'Feet', boots: 'Feet', shoes: 'Feet',
          ring1: 'Ring 1', 'ring 1': 'Ring 1', ring_1: 'Ring 1',
          ring2: 'Ring 2', 'ring 2': 'Ring 2', ring_2: 'Ring 2'
        };
        const usedSlots = new Set();
        let ringsUsed = 0;
        const markSlot = (rawSlot) => {
          const lc = String(rawSlot || '').trim().toLowerCase();
          if (!lc) return;
          if (SLOT_ALIAS_MAP[lc]) {
            usedSlots.add(SLOT_ALIAS_MAP[lc]);
          } else if (/^ring/.test(lc)) {
            ringsUsed += 1;
            usedSlots.add(ringsUsed === 1 ? 'Ring 1' : 'Ring 2');
          } else {
            const match = (DnD35Ruleset.bodySlots || []).find(s => s.toLowerCase() === lc);
            if (match) usedSlots.add(match);
          }
        };

        // 1. Canonical sheet bodySlots object ({ head: { name, active }, shoulders: ..., ring1: ... })
        if (char.bodySlots && typeof char.bodySlots === 'object') {
          for (const [slotKey, slotVal] of Object.entries(char.bodySlots)) {
            if (!slotVal || typeof slotVal !== 'object') continue;
            const nm = String(slotVal.name || '').trim();
            if (!nm || nm.toLowerCase() === 'none' || slotVal.active === false) continue;
            markSlot(slotVal.bodySlot || slotVal.slot || slotKey);
          }
        }
        // 2. Fallback for legacy/external inventory[] shape
        const inv = Array.isArray(char.inventory) ? char.inventory : [];
        for (const it of inv) {
          if (!it || !it.equipped) continue;
          markSlot(it.bodySlot || it.slot || '');
        }
        const openBodySlots = (DnD35Ruleset.bodySlots || []).filter(s => !usedSlots.has(s));

        const abilities = {};
        if (derived.abilities && typeof derived.abilities === 'object') {
          const mods = derived.abilities.mods || {};
          for (const ab of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
            const rawVal = derived.abilities[ab];
            if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
              const mod = Number.isFinite(Number(mods[ab])) ? Number(mods[ab]) : DnD35Ruleset.calcAbilityMod(rawVal);
              abilities[ab] = { score: rawVal, mod };
            } else if (rawVal && typeof rawVal === 'object') {
              const sc = Number(rawVal.total ?? rawVal.score ?? 10);
              abilities[ab] = { score: sc, mod: Number(rawVal.mod ?? DnD35Ruleset.calcAbilityMod(sc)) };
            }
          }
        }

        const preparedSpells = [];
        const prepRaw = [
          ...(Array.isArray(char.spellcasting?.preparedSpells) ? char.spellcasting.preparedSpells : []),
          ...(Array.isArray(char.spellcasting?.divineSpells) ? char.spellcasting.divineSpells : []),
          ...(Array.isArray(char.preparedSpells) ? char.preparedSpells : [])
        ];
        for (const sp of prepRaw) {
          if (!sp || !sp.name) continue;
          const totalCount = Number(sp.preparedCount ?? sp.count ?? 1);
          const usedCount = Number(sp.usedCount ?? sp.castCount ?? 0);
          if (sp.cast === true || sp.used === true || (totalCount > 0 && usedCount >= totalCount)) continue;
          if (!preparedSpells.includes(sp.name)) preparedSpells.push(sp.name);
          if (preparedSpells.length >= 24) break;
        }

        const knownSpells = [];
        const knownRaw = [
          ...(Array.isArray(char.spellcasting?.knownSpells) ? char.spellcasting.knownSpells : []),
          ...(Array.isArray(char.knownSpells) ? char.knownSpells : [])
        ];
        for (const sp of knownRaw) {
          const nm = typeof sp === 'string' ? sp : sp?.name;
          if (nm && !knownSpells.includes(nm)) knownSpells.push(nm);
          if (knownSpells.length >= 24) break;
        }

        const consumables = [];
        const addConsumable = (it) => {
          if (!it || !it.name || consumables.length >= 16) return;
          const qty = Number(it.charges ?? it.qty ?? it.quantity ?? 1);
          if (qty <= 0) return;
          const label = qty > 1 ? `${it.name} (${qty})` : it.name;
          if (!consumables.includes(label)) consumables.push(label);
        };
        if (Array.isArray(char.consumables)) {
          char.consumables.forEach(addConsumable);
        }
        for (const it of [...(Array.isArray(char.gearPool) ? char.gearPool : []), ...inv]) {
          if (!it || !it.name || consumables.length >= 16) continue;
          const cat = String(it.category || it.type || it.item?.subtype || '').toLowerCase();
          const isCons = it.consumable || it.item?.consumable || /potion|oil|scroll|wand|staff|elixir|consumable/.test(cat) || (Number(it.charges) > 0);
          if (isCons) addConsumable(it);
        }
        const activeBuffs = (Array.isArray(char.buffs) ? char.buffs : [])
          .filter(b => b && b.active !== false && b.name)
          .slice(0, 16)
          .map(b => b.roundsLeft != null ? `${b.name} (${b.roundsLeft}r)` : b.name);
        const feats = (Array.isArray(char.feats) ? char.feats : [])
          .map(f => typeof f === 'string' ? f : f?.name)
          .filter(Boolean)
          .slice(0, 24);

        return {
          ruleset: 'dnd35',
          abilities,
          saves,
          ac: {
            total: Number(derived.ac?.total ?? 10),
            touch: Number(derived.ac?.touch ?? 10),
            flatFooted: Number(derived.ac?.flatFooted ?? derived.ac?.flat ?? 10),
            occupied: acScan.occupied,
            openTypes: acScan.openTypes
          },
          openBodySlots,
          activeBuffs,
          candidates: {
            preparedSpells,
            knownSpells,
            consumables,
            feats
          }
        };
      }
    },

    // Canonical usage reset cadences (Single Source of Truth for RuleEngine, CharStore, and Rest flows)
    usageResetCadence: Object.freeze({
      perEncounter: Object.freeze(['encounterEnd', 'longRest']),
      perHour: Object.freeze(['hourPass', 'longRest']),
      perDay: Object.freeze(['longRest'])
    }),

    getUsageModesResetOn(trigger) {
      const t = String(trigger || '').trim();
      if (!t) return [];
      return Object.keys(this.usageResetCadence).filter(m => this.usageResetCadence[m].includes(t));
    },

    /**
     * Pure D&D 3.5e RAW Hit Points condition evaluator (PHB p. 145).
     * Healthy (>0), Staggered (nonlethal == current), Unconscious (nonlethal > current),
     * Disabled (0), Dying (-1 to -9), Dead (<= -10).
     */
    evaluateHpCondition(hpObj) {
      const hp = hpObj && typeof hpObj === 'object' ? hpObj : {};
      const cur = Number(hp.current ?? hp.max ?? 1);
      const nl = Math.max(0, Number(hp.nonlethal) || 0);
      if (cur <= -10) return { status: 'dead', label: 'Dead', severity: 'fatal', badge: '💀 Dead' };
      if (cur <= -1) return { status: 'dying', label: 'Dying', severity: 'critical', badge: '🩸 Dying' };
      if (cur === 0) return { status: 'disabled', label: 'Disabled', severity: 'warn', badge: '⚠️ Disabled' };
      if (nl > cur) return { status: 'unconscious', label: 'Unconscious', severity: 'warn', badge: '💤 Unconscious' };
      if (nl > 0 && nl === cur) return { status: 'staggered', label: 'Staggered', severity: 'warn', badge: '💫 Staggered' };
      return { status: 'healthy', label: 'Healthy', severity: 'ok', badge: '' };
    }
  };

  if (root) {
    root.DnD35Ruleset = DnD35Ruleset;
    if (root.RuleEngine && root.RuleEngine.rulesets) {
      root.RuleEngine.rulesets.dnd35 = DnD35Ruleset;
    }
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DnD35Ruleset;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
