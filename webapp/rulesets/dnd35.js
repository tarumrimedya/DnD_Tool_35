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
    ['tacticalSlider', 'Enable Tactical Combat Slider (Power Attack / Expertise / Manyshot)']
  ];

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

  // Official D&D 3.5e Druid Wild Shape progression (PHB p.37, Table 3-8)
  function getWildShapeProfile(druidLevel, hasElementalFlag) {
    const lvl = Math.max(0, Math.floor(Number(druidLevel) || 0));
    const dailyUses = lvl >= 18 ? 6
      : (lvl >= 14 ? 5
        : (lvl >= 10 ? 4
          : (lvl >= 7 ? 3
            : (lvl >= 6 ? 2
              : (lvl >= 5 ? 1 : 0)))));
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
    entityKinds: ENTITY_KINDS,
    arcaneSpellcastingClasses: ARCANE_SPELLCASTING_CLASSES,
    defaultEntityLevelFormulas: DEFAULT_ENTITY_LEVEL_FORMULAS,
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
      const perLvl = raw.match(/(\d+)\s*(round|rd|rds|rounds|min|mins|minute|minutes|hour|hr|hrs|hours|day|days)\.?\s*\/\s*(?:level|cl)/i);
      if (perLvl) {
        const n = parseInt(perLvl[1], 10) || 1;
        const u = perLvl[2].toLowerCase();
        if (u.startsWith('r')) return n * cl;
        if (u.startsWith('m')) return n * 10 * cl;
        if (u.startsWith('h')) return n * 600 * cl;
        if (u.startsWith('d')) return n * 14400 * cl;
      }
      const fixed = raw.match(/^(\d+)\s*(round|rd|rds|rounds|min|mins|minute|minutes|hour|hr|hrs|hours|day|days)\b/i);
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
    calcIterativeBab(bab) {
      const b = Math.max(0, Math.floor(Number(bab) || 0));
      const out = [b];
      let cur = b - 5;
      while (cur >= 1 && out.length < 4) {
        out.push(cur);
        cur -= 5;
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
