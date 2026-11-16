'use strict';

/**
 * ============================================================================
 * Sprint C.6 (C6-F4) — Complete Deterministic 0-Token V3 Corpus Compiler
 * (`tools/compile_v3_corpus_complete.js`, invoked by `tools/compile_v3_mechanics.js`)
 * ============================================================================
 * Converts all mechanically active entries (Grup A + Grup B + Grup C) across
 * all open SRD/Splat/Epic/Legacy/MIC chunks to Pure Canonical V3 (`effects[]`,
 * `choices[]`), normalizes `When / While` `condKind` dialect across all 24 chunks,
 * and leaves pure narrative/utility/item-creation/mundane Grup D entries cleanly
 * at `effects: []` per ADR-048.
 * ============================================================================
 */

const NAMED_WHEN_CONDS = new Set([
  'wieldingChosenShield',
  'wieldingChosenWeapon',
  'notFlatFooted',
  'wieldingTwoWeapons',
  'vsAoOFromMovement',
  'castingChosenSchool',
  'charging',
  'flanking',
  'fightingDefensively',
  'totalDefense',
  'powerAttack',
  'combatExpertise',
  'bloodied'
]);

const SKILL_NAME_TO_SLUG = {
  'appraise': 'appraise',
  'autohypnosis': 'autohypnosis',
  'balance': 'balance',
  'bluff': 'bluff',
  'climb': 'climb',
  'concentration': 'concentration',
  'craft': 'craft',
  'decipher script': 'decipher-script',
  'diplomacy': 'diplomacy',
  'disable device': 'disable-device',
  'disguise': 'disguise',
  'escape artist': 'escape-artist',
  'forgery': 'forgery',
  'gather information': 'gather-information',
  'handle animal': 'handle-animal',
  'heal': 'heal',
  'hide': 'hide',
  'intimidate': 'intimidate',
  'jump': 'jump',
  'knowledge': 'knowledge',
  'knowledge (psionics)': 'knowledge-psionics',
  'listen': 'listen',
  'move silently': 'move-silently',
  'open lock': 'open-lock',
  'perform': 'perform',
  'profession': 'profession',
  'psicraft': 'psicraft',
  'ride': 'ride',
  'search': 'search',
  'sense motive': 'sense-motive',
  'sleight of hand': 'sleight-of-hand',
  'speak language': 'speak-language',
  'spellcraft': 'spellcraft',
  'spot': 'spot',
  'survival': 'survival',
  'wilderness lore': 'survival',
  'swim': 'swim',
  'truespeak': 'truespeak',
  'tumble': 'tumble',
  'use magic device': 'use-magic-device',
  'use psionic device': 'use-psionic-device',
  'use rope': 'use-rope'
};

const BONUS_TYPE_CANON = {
  'enhancement': 'Enhancement',
  'deflection': 'Deflection',
  'armor': 'Armor',
  'shield': 'Shield',
  'natural': 'Natural Armor',
  'natural armor': 'Natural Armor',
  'resistance': 'Resistance',
  'morale': 'Morale',
  'luck': 'Luck',
  'insight': 'Insight',
  'sacred': 'Sacred',
  'profane': 'Profane',
  'competence': 'Competence',
  'circumstance': 'Circumstance',
  'alchemical': 'Alchemical',
  'racial': 'Racial',
  'size': 'Size',
  'dodge': 'Dodge',
  'inherent': 'Inherent',
  'penalty': 'Penalty',
  'untyped': 'Untyped'
};

function canonBonusType(raw, val = 1) {
  if (val < 0) return 'Penalty';
  if (!raw) return 'Untyped';
  const k = String(raw).trim().toLowerCase();
  return BONUS_TYPE_CANON[k] || 'Untyped';
}

function statB(id, targets, valOrFormula, btype = 'Untyped', extra = {}) {
  const isFormula = typeof valOrFormula === 'string';
  return Object.assign({
    id,
    type: 'stat',
    targets: Array.isArray(targets) ? targets : [targets],
    mode: isFormula ? 'formula' : 'flat',
    ...(isFormula ? { formula: valOrFormula } : { value: Number(valOrFormula) || 0 }),
    btype: canonBonusType(btype, isFormula ? 1 : Number(valOrFormula))
  }, extra);
}

function whenNamedB(id, condKind, effects) {
  return {
    id,
    type: 'when',
    flow: 'while',
    branches: [{ id: `${id}-br`, condKind, condText: '', effects }]
  };
}

function whenSitB(id, condKind, condText, effects) {
  if (NAMED_WHEN_CONDS.has(condText)) {
    return whenNamedB(id, condText, effects);
  }
  return {
    id,
    type: 'when',
    flow: 'while',
    branches: [{ id: `${id}-br`, condKind: condKind || 'situational', condText, effects }]
  };
}

function rollB(id, kind, count, die, flat = 0, dmgType = 'Untyped', extra = {}) {
  return Object.assign({
    id,
    type: 'roll',
    kind,
    count: Number(count) || 1,
    die: die || 'd6',
    flat: Number(flat) || 0,
    dmgType,
    scaling: 'flat',
    crit: 'normal'
  }, extra);
}

function defB(id, mode, what, value = 0, extra = {}) {
  return Object.assign({
    id,
    type: 'defense',
    mode,
    what,
    value: Number(value) || 0
  }, extra);
}

function resB(id, name, max = 1, reset = 'perDay', extra = {}) {
  const varKey = String(name || 'charges').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'charges';
  return Object.assign({
    id,
    type: 'resource',
    name,
    varKey,
    resMode: 'spend',
    scaling: typeof max === 'string' ? 'formula' : 'flat',
    max: typeof max === 'number' ? max : 1,
    ...(typeof max === 'string' ? { maxFormula: max } : {}),
    reset
  }, extra);
}

function metaB(id, slotAdj, transform, riderText, extra = {}) {
  return Object.assign({
    id,
    type: 'carrier',
    carrierMode: 'metamagic',
    costMode: 'slot',
    slotAdj: Number(slotAdj) || 0,
    transform: transform || 'custom',
    riderText: riderText || ''
  }, extra);
}

function riderB(id, riderEffect, saveType = '', dc = '', extra = {}) {
  return Object.assign({
    id,
    type: 'carrier',
    carrierMode: 'weaponRider',
    riderEffect,
    ...(saveType ? { saveType } : {}),
    ...(dc !== '' && dc !== null && dc !== undefined ? { dc: String(dc) } : {})
  }, extra);
}

function switchB(id, flag, label, text) {
  return {
    id,
    type: 'effect',
    effectKind: 'ruleSwitch',
    flag,
    label,
    text: text || label
  };
}

function ruleB(id, text, extra = {}) {
  return Object.assign({
    id,
    type: 'effect',
    effectKind: 'rule',
    text
  }, extra);
}

function spellLinkB(id, spellName, text, extra = {}) {
  return Object.assign({
    id,
    type: 'effect',
    effectKind: 'linkedSpell',
    castMode: 'linkedSpell',
    spellName,
    text: text || `Cast ${spellName}`
  }, extra);
}

const WEAPON_CHOICE_DEF = [{
  id: 'ch-weapon',
  key: 'weapon',
  label: 'Chosen Weapon',
  options: ['Longsword', 'Greatsword', 'Greataxe', 'Battleaxe', 'Warhammer', 'Heavy Mace', 'Rapier', 'Scimitar', 'Short Sword', 'Dagger', 'Longbow', 'Shortbow', 'Light Crossbow', 'Heavy Crossbow', 'Halberd', 'Glaive', 'Guisarme', 'Spiked Chain', 'Unarmed Strike', 'Grapple', 'Ray']
}];

const EXOTIC_WEAPON_CHOICE_DEF = [{
  id: 'ch-exotic-weapon',
  key: 'weapon',
  label: 'Exotic Weapon',
  options: ['Bastard Sword', 'Dwarven Waraxe', 'Spiked Chain', 'Whip', 'Dire Flail', 'Two-Bladed Sword', 'Orc Double Axe', 'Gnome Hooked Hammer', 'Dwarven Urgrosh', 'Hand Crossbow', 'Repeating Light Crossbow', 'Repeating Heavy Crossbow', 'Bolas', 'Net', 'Shuriken', 'Kama', 'Kukri', 'Nunchaku', 'Sai', 'Siangham']
}];

const MARTIAL_WEAPON_CHOICE_DEF = [{
  id: 'ch-martial-weapon',
  key: 'weapon',
  label: 'Martial Weapon',
  options: ['Longsword', 'Greatsword', 'Greataxe', 'Battleaxe', 'Warhammer', 'Rapier', 'Scimitar', 'Short Sword', 'Handaxe', 'Light Hammer', 'Light Pick', 'Heavy Pick', 'Flail', 'Heavy Flail', 'Falchion', 'Glaive', 'Guisarme', 'Halberd', 'Lance', 'Longspear', 'Ranseur', 'Scythe', 'Trident', 'Shortbow', 'Longbow']
}];

const CROSSBOW_CHOICE_DEF = [{
  id: 'ch-crossbow',
  key: 'weapon',
  label: 'Crossbow Type',
  options: ['Hand Crossbow', 'Light Crossbow', 'Heavy Crossbow', 'Repeating Light Crossbow', 'Repeating Heavy Crossbow']
}];

const NATURAL_WEAPON_CHOICE_DEF = [{
  id: 'ch-natural-weapon',
  key: 'weapon',
  label: 'Natural Weapon',
  options: ['Unarmed Strike', 'Bite', 'Claw', 'Slam', 'Gore', 'Tail Slap', 'Wing', 'Tentacle', 'Talon', 'Sting']
}];

const SCHOOL_CHOICE_DEF = [{
  id: 'ch-school',
  key: 'school',
  label: 'Spell School',
  options: ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']
}];

const SKILL_CHOICE_DEF = [{
  id: 'ch-skill',
  key: 'skill',
  label: 'Chosen Skill',
  options: ['Appraise', 'Autohypnosis', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Handle Animal', 'Heal', 'Hide', 'Intimidate', 'Jump', 'Knowledge', 'Listen', 'Move Silently', 'Open Lock', 'Perform', 'Profession', 'Psicraft', 'Ride', 'Search', 'Sense Motive', 'Sleight of Hand', 'Speak Language', 'Spellcraft', 'Spot', 'Survival', 'Swim', 'Truespeak', 'Tumble', 'Use Magic Device', 'Use Psionic Device', 'Use Rope']
}];

const ENERGY_CHOICE_DEF = [{
  id: 'ch-energy',
  key: 'energy',
  label: 'Energy Type',
  options: ['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic']
}];

const ABILITY_CHOICE_DEF = [{
  id: 'ch-ability',
  key: 'ability',
  label: 'Ability Score',
  options: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
}];

// ----------------------------------------------------------------------------
// 1. Explicit Patches for Core Choice Feats, Flaws, Traits, Skill Tricks,
//    Warlock Invocations, Epic Feats, Conditions, Domains, Materials & Key Items
// ----------------------------------------------------------------------------
const EXPLICIT_PATCHES = {
  // Core Choice Feats (both canonical & -no-*-selected variants)
  'feat-weapon-focus': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-wf-w', 'wieldingChosenWeapon', [statB('ef-wf-atk', ['atk.weapon'], 1, 'Untyped')])]
  },
  'feat-weapon-focus-no-weapon-selected': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-wf-w', 'wieldingChosenWeapon', [statB('ef-wf-atk', ['atk.weapon'], 1, 'Untyped')])]
  },
  'feat-greater-weapon-focus': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-gwf-w', 'wieldingChosenWeapon', [statB('ef-gwf-atk', ['atk.weapon'], 1, 'Untyped')])]
  },
  'feat-greater-weapon-focus-no-weapon-selected': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-gwf-w', 'wieldingChosenWeapon', [statB('ef-gwf-atk', ['atk.weapon'], 1, 'Untyped')])]
  },
  'feat-epic-weapon-focus-no-weapon-selected': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-ewf-w', 'wieldingChosenWeapon', [statB('ef-ewf-atk', ['atk.weapon'], 2, 'Untyped')])]
  },
  'feat-weapon-specialization': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-ws-w', 'wieldingChosenWeapon', [statB('ef-ws-dmg', ['dmg.weapon'], 2, 'Untyped')])]
  },
  'feat-weapon-specialization-no-weapon-selected': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-ws-w', 'wieldingChosenWeapon', [statB('ef-ws-dmg', ['dmg.weapon'], 2, 'Untyped')])]
  },
  'feat-greater-weapon-specialization': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-gws-w', 'wieldingChosenWeapon', [statB('ef-gws-dmg', ['dmg.weapon'], 2, 'Untyped')])]
  },
  'feat-greater-weapon-specialization-no-weapon-selected': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-gws-w', 'wieldingChosenWeapon', [statB('ef-gws-dmg', ['dmg.weapon'], 2, 'Untyped')])]
  },
  'feat-epic-weapon-specialization': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-ews-w', 'wieldingChosenWeapon', [statB('ef-ews-dmg', ['dmg.weapon'], 4, 'Untyped')])]
  },
  'feat-skill-focus': {
    choices: SKILL_CHOICE_DEF,
    effects: [statB('ef-sf-sk', ['choice.skill.1'], 3, 'Untyped')]
  },
  'feat-skill-focus-not-set': {
    choices: SKILL_CHOICE_DEF,
    effects: [statB('ef-sf-sk', ['choice.skill.1'], 3, 'Untyped')]
  },
  'feat-epic-skill-focus-not-set': {
    choices: SKILL_CHOICE_DEF,
    effects: [statB('ef-esf-sk', ['choice.skill.1'], 10, 'Untyped')]
  },
  'feat-spell-focus': {
    choices: SCHOOL_CHOICE_DEF,
    effects: [whenNamedB('ef-spf-w', 'castingChosenSchool', [statB('ef-spf-dc', ['spell.dc'], 1, 'Untyped')])]
  },
  'feat-spell-focus-no-spell-school-selected': {
    choices: SCHOOL_CHOICE_DEF,
    effects: [whenNamedB('ef-spf-w', 'castingChosenSchool', [statB('ef-spf-dc', ['spell.dc'], 1, 'Untyped')])]
  },
  'feat-greater-spell-focus': {
    choices: SCHOOL_CHOICE_DEF,
    effects: [whenNamedB('ef-gspf-w', 'castingChosenSchool', [statB('ef-gspf-dc', ['spell.dc'], 1, 'Untyped')])]
  },
  'feat-greater-spell-focus-no-spell-school-selected': {
    choices: SCHOOL_CHOICE_DEF,
    effects: [whenNamedB('ef-gspf-w', 'castingChosenSchool', [statB('ef-gspf-dc', ['spell.dc'], 1, 'Untyped')])]
  },
  'feat-epic-spell-focus-no-spell-school-selected': {
    choices: SCHOOL_CHOICE_DEF,
    effects: [whenNamedB('ef-espf-w', 'castingChosenSchool', [statB('ef-espf-dc', ['spell.dc'], 1, 'Untyped')])]
  },
  'feat-energy-resistance': {
    choices: ENERGY_CHOICE_DEF,
    effects: [defB('ef-eres', 'Energy Resistance', '@Choice', 10)]
  },
  'feat-energy-substitution': {
    choices: ENERGY_CHOICE_DEF,
    effects: [metaB('feat-energy-substitution-mm', 0, 'energySub', 'Energy Substitution (@Choice)')]
  },
  'feat-privileged-energy': {
    choices: ENERGY_CHOICE_DEF,
    effects: [switchB('feat-privileged-energy-sw', 'privileged-energy', 'Privileged Energy', 'Deal +1 damage per die with spells of chosen energy type.')]
  },
  'feat-exotic-weapon-proficiency': {
    choices: EXOTIC_WEAPON_CHOICE_DEF,
    effects: [switchB('feat-exotic-weapon-proficiency-sw', 'exotic-weapon-proficiency', 'Exotic Weapon Proficiency', 'Make attack rolls with chosen exotic weapon without taking the -4 non-proficiency penalty.')]
  },
  'feat-martial-weapon-proficiency': {
    choices: MARTIAL_WEAPON_CHOICE_DEF,
    effects: [switchB('feat-martial-weapon-proficiency-sw', 'martial-weapon-proficiency', 'Martial Weapon Proficiency', 'Make attack rolls with chosen martial weapon without taking the -4 non-proficiency penalty.')]
  },
  'feat-improved-critical': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-icrit-w', 'wieldingChosenWeapon', [switchB('ef-icrit', 'improvedCritical', 'Doubles Critical Threat Range with Chosen Weapon')])]
  },
  'feat-improved-critical-no-weapon-selected': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-icrit-w', 'wieldingChosenWeapon', [switchB('ef-icrit', 'improvedCritical', 'Doubles Critical Threat Range with Chosen Weapon')])]
  },
  'feat-power-critical': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-powcrit', 'wieldingChosenWeapon', [statB('ef-powcrit-atk', ['atk.critConfirm'], 4, 'Untyped')])]
  },
  'feat-weapon-supremacy': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-wsup-w', 'wieldingChosenWeapon', [statB('ef-wsup-ac', ['ac.all'], 1, 'Untyped'), switchB('ef-wsup-sw', 'weapon-supremacy', 'Weapon Supremacy', 'Mastery bonuses with chosen weapon.')])]
  },
  'feat-rapid-reload': {
    choices: CROSSBOW_CHOICE_DEF,
    effects: [switchB('feat-rapid-reload-sw', 'rapid-reload', 'Rapid Reload', 'Reduce reload action for chosen crossbow type (hand/light: free action; heavy: move action).')]
  },
  'feat-rapid-reload-none': {
    choices: CROSSBOW_CHOICE_DEF,
    effects: [switchB('feat-rapid-reload-none-sw', 'rapid-reload', 'Rapid Reload', 'Reduce reload action for chosen crossbow type (hand/light: free action; heavy: move action).')]
  },
  'feat-improved-natural-attack': {
    choices: NATURAL_WEAPON_CHOICE_DEF,
    effects: [switchB('ef-ina', 'improvedNaturalAttack', 'Chosen Natural Weapon Damage Increases by One Size Step')]
  },
  'feat-improved-natural-attack-no-weapon-selected': {
    choices: NATURAL_WEAPON_CHOICE_DEF,
    effects: [switchB('ef-ina', 'improvedNaturalAttack', 'Chosen Natural Weapon Damage Increases by One Size Step')]
  },
  'feat-improved-natural-attack-no-weapon-set': {
    choices: NATURAL_WEAPON_CHOICE_DEF,
    effects: [switchB('ef-ina', 'improvedNaturalAttack', 'Chosen Natural Weapon Damage Increases by One Size Step')]
  },
  'gear-tools-masterworked': {
    choices: SKILL_CHOICE_DEF,
    forceOverwriteEffects: true,
    effects: [statB('ef-mw-tool', ['choice.skill.1'], 2, 'Circumstance')]
  },
  'feat-armor-specialization': {
    choices: [{ id: 'ch-armor', key: 'armorType', label: 'Medium or Heavy Armor Type', options: ['Breastplate', 'Chainmail', 'Splint Mail', 'Banded Mail', 'Half-Plate', 'Full Plate'] }],
    effects: [defB('ef-armspec-dr', 'Damage Reduction', '-', 2)]
  },

  // 4 Missing UA Flaws
  'flaw-frail': {
    effects: [
      statB('ef-frail-hp', ['hp.perLevel'], -1, 'Penalty'),
      switchB('ef-frail-bonus', 'grantsBonusFeat', 'Character Flaw: -1 HP/HD (min 1 HP/level); Grants +1 Bonus Feat')
    ]
  },
  'flaw-murky-eyed': {
    effects: [
      switchB('ef-murky', 'rollConcealmentTwice', 'Roll Concealment Miss Chance Twice; Grants +1 Bonus Feat')
    ]
  },
  'flaw-pathetic': {
    choices: ABILITY_CHOICE_DEF,
    effects: [
      statB('ef-pathetic', ['choice.ability.1'], -2, 'Penalty'),
      switchB('ef-pathetic-bf', 'grantsBonusFeat', 'Character Flaw: -2 to Chosen Ability Score; Grants +1 Bonus Feat')
    ]
  },
  'flaw-slow': {
    effects: [
      switchB('ef-flaw-slow', 'halfBaseLandSpeed', 'Base Land Speed Halved (Rounded Down to 5-ft. Interval); Grants +1 Bonus Feat')
    ]
  },

  // 5 Missing UA Traits
  'trait-illiterate': {
    choices: SKILL_CHOICE_DEF,
    effects: [
      statB('ef-tr-illit-sk', ['choice.skill.1'], 1, 'Untyped'),
      switchB('ef-tr-illit', 'illiterate', 'Illiterate (Must Spend 2 Skill Points to Gain Literacy)')
    ]
  },
  'trait-inattentive': {
    choices: SKILL_CHOICE_DEF,
    effects: [
      statB('ef-tr-inat-sk', ['choice.skill.1'], 1, 'Untyped'),
      statB('ef-tr-inat-pen', ['skill.listen', 'skill.spot'], -4, 'Penalty', { condition: 'Complex or Distracted Checks' })
    ]
  },
  'trait-slow': {
    effects: [
      statB('ef-tr-slow-hp', ['hp.perLevel'], 1, 'Untyped'),
      switchB('ef-tr-slow-spd', 'halfBaseLandSpeed', 'Base Land Speed Halved (Minimum -10 ft.)')
    ]
  },
  'trait-specialized': {
    choices: [{ id: 'ch-spec-skill', key: 'skill', label: 'Craft, Knowledge, or Profession Skill', options: ['Craft', 'Knowledge', 'Profession'] }],
    effects: [
      statB('ef-tr-spec', ['choice.skill.1'], 1, 'Untyped')
    ]
  },
  'trait-spellgifted': {
    choices: SCHOOL_CHOICE_DEF,
    effects: [
      whenNamedB('ef-tr-sg-w', 'castingChosenSchool', [statB('ef-tr-sg-cl', ['casterLevel'], 1, 'Untyped')]),
      ruleB('ef-tr-sg-pen', '-1 Caster Level on spells from all other schools of magic.')
    ]
  },

  // Key Skill Tricks (plus generic fallback for the remaining tactical tricks)
  'trick-collector-of-stories': {
    effects: [
      resB('ef-cos-res', 'Skill Trick', 1, 'perEncounter'),
      statB('ef-cos-kn', ['skill.knowledge'], 5, 'Competence')
    ]
  },
  'trick-healing-hands': {
    effects: [
      resB('ef-hh-res', 'Skill Trick', 1, 'perEncounter'),
      rollB('ef-hh-heal', 'Healing', 1, 'd6', 0, 'Positive')
    ]
  },
  'trick-clever-improviser': {
    effects: [
      resB('ef-ci-res', 'Skill Trick', 1, 'perEncounter'),
      switchB('ef-ci-sw', 'ignoreNoToolPenalty', 'Ignore -2 Penalty on Disable Device / Open Lock Without Tools')
    ]
  },
  'trick-nimble-stand': {
    effects: [
      resB('ef-ns-res', 'Skill Trick', 1, 'perEncounter'),
      switchB('ef-ns-sw', 'standWithoutAoO', 'Stand From Prone Without Provoking Attacks of Opportunity')
    ]
  },
  'trick-back-on-your-feet': {
    effects: [
      resB('ef-boyf-res', 'Skill Trick', 1, 'perEncounter'),
      switchB('ef-boyf-sw', 'immediateStandFromProne', 'Stand Up From Prone as an Immediate Action')
    ]
  },
  'trick-swift-concentration': {
    effects: [
      resB('ef-sc-res', 'Skill Trick', 1, 'perEncounter'),
      switchB('ef-sc-sw', 'swiftConcentration', 'Maintain Concentration on a Spell/Power as a Swift Action')
    ]
  },
  'trick-acrobatic-backstab': {
    effects: [
      resB('ef-ab-res', 'Skill Trick', 1, 'perEncounter'),
      switchB('ef-ab-sw', 'targetFlatFootedNextMelee', 'Foe Tumbled Through Is Flat-Footed Against Your Next Melee Attack')
    ]
  },
  'trick-spot-the-weak-point': {
    effects: [
      resB('ef-stwp-res', 'Skill Trick', 1, 'perEncounter'),
      switchB('ef-stwp-sw', 'nextAttackIsTouch', 'Standard Action Spot Check Makes Next Attack a Touch Attack')
    ]
  },
  'trick-shrouded-dance': {
    effects: [
      resB('ef-sd-res', 'Skill Trick', 1, 'perEncounter'),
      defB('ef-sd-conc', 'State', 'Concealment (20% Miss Chance, 1 round)', 20)
    ]
  },
  'trick-clarity-of-vision': {
    effects: [
      resB('ef-cov-res', 'Skill Trick', 1, 'perEncounter'),
      defB('ef-cov-see', 'Sense', 'See Invisible (1 round)', 30)
    ]
  },
  'trick-twisted-charge': {
    effects: [
      resB('ef-tc-res', 'Skill Trick', 1, 'perEncounter'),
      switchB('ef-tc-sw', 'chargeTurnOnce', 'Make Up to One 90-Degree Turn During a Charge')
    ]
  },
  'trick-nimble-charge': {
    effects: [
      resB('ef-nc-res', 'Skill Trick', 1, 'perEncounter'),
      switchB('ef-nc-sw', 'chargeDifficultSurface', 'Run or Charge Across Difficult Surface Without Balance Check')
    ]
  },

  // 32 Warlock Invocations (`srd_feats.json::SpecialAbility`)
  'inv-beguiling-influence': {
    effects: [statB('ef-inv-bi', ['skill.bluff', 'skill.diplomacy', 'skill.intimidate'], 6, 'Untyped')]
  },
  'inv-all-seeing-eyes': {
    effects: [
      statB('ef-inv-ase', ['skill.search', 'skill.spot'], 6, 'Untyped'),
      spellLinkB('ef-inv-ase-sp', 'Comprehend Languages', 'Comprehend written languages as Comprehend Languages (24 hours).')
    ]
  },
  'inv-see-the-unseen': {
    effects: [
      defB('ef-inv-stu-dv', 'Sense', 'Darkvision 60 ft.', 60),
      spellLinkB('ef-inv-stu-si', 'See Invisibility', 'See Invisibility for 24 hours.')
    ]
  },
  'inv-devils-sight': {
    effects: [defB('ef-inv-ds', 'Sense', 'See in Magical & Natural Darkness 30 ft.', 30)]
  },
  'inv-fell-flight': {
    effects: [switchB('ef-inv-ff', 'flyEqualLandSpeed', 'Fly Speed Equal to Base Land Speed (Good Maneuverability, 24h)')]
  },
  'inv-spiderwalk': {
    effects: [
      spellLinkB('ef-inv-sw-sp', 'Spider Climb', 'Continuous Spider Climb for 24 hours.'),
      defB('ef-inv-sw-imm', 'Immunity', 'Webs (Mundane & Magical)', 0)
    ]
  },
  'inv-dark-foresight': {
    effects: [
      statB('ef-inv-df-ac', ['ac.insight'], 2, 'Insight'),
      statB('ef-inv-df-ref', ['save.ref'], 2, 'Insight'),
      switchB('ef-inv-df-ff', 'neverFlatFooted', 'Never Surprised or Flat-Footed (Foresight)')
    ]
  },
  'inv-dark-discorporation': {
    effects: [
      statB('ef-inv-dd-dex', ['dex'], 4, 'Untyped'),
      statB('ef-inv-dd-fly', ['speed.fly'], 40, 'Untyped'),
      defB('ef-inv-dd-swm', 'Immunity', 'Weapon Damage (Diminutive Shadow Swarm Traits)', 0)
    ]
  },
  'inv-eldritch-spear': {
    effects: [riderB('ef-inv-esp', 'Blast Shape: Range 250 ft. (No Range Increment)')]
  },
  'inv-hideous-blow': {
    effects: [{ id: 'ef-inv-hb', type: 'carrier', carrierMode: 'meleeChannel', riderText: 'Deliver Eldritch Blast Through Single Melee Attack' }]
  },
  'inv-eldritch-chain': {
    effects: [riderB('ef-inv-ech', 'Blast Shape: Arcs to +1 Secondary Target per 5 Caster Levels (Half Damage to Secondary)')]
  },
  'inv-eldritch-cone': {
    effects: [riderB('ef-inv-econ', 'Blast Shape: 30-ft. Cone (Reflex Half)', 'Reflex', '')]
  },
  'inv-eldritch-doom': {
    effects: [riderB('ef-inv-edoom', 'Blast Shape: 20-ft. Radius Emanation Enemies Only (Reflex Half)', 'Reflex', '')]
  },
  'inv-brimstone-blast': {
    effects: [
      riderB('ef-inv-brim', 'Eldritch Essence: Fire Damage + Catch Fire 2d6/round', 'Reflex', ''),
      rollB('ef-inv-brim-r', 'Damage', 2, 'd6', 0, 'Fire')
    ]
  },
  'inv-hellrime-blast': {
    effects: [riderB('ef-inv-hrim', 'Eldritch Essence: Cold Damage + -4 Dex Penalty (10 min)', 'Fortitude', '')]
  },
  'inv-vitriolic-blast': {
    effects: [
      riderB('ef-inv-vit', 'Eldritch Essence: Conjured Acid (Ignores SR) + 2d6 Acid/round'),
      rollB('ef-inv-vit-r', 'Damage', 2, 'd6', 0, 'Acid')
    ]
  },
  'inv-noxious-blast': {
    effects: [riderB('ef-inv-nox', 'Eldritch Essence: Nauseated for 1 Minute', 'Fortitude', '')]
  },
  'inv-repelling-blast': {
    effects: [
      riderB('ef-inv-rep', 'Eldritch Essence: Hurled Back 1d6x5 ft. + Knocked Prone (1d6 Damage/10 ft.)', 'Reflex', ''),
      rollB('ef-inv-rep-r', 'Damage', 1, 'd6', 0, 'Bludgeoning')
    ]
  },
  'inv-utterdark-blast': {
    effects: [riderB('ef-inv-utt', 'Eldritch Essence: Negative Energy + 2 Negative Levels', 'Fortitude', '')]
  },
  'inv-chilling-tentacles': {
    effects: [
      spellLinkB('ef-inv-ct-sp', 'Evard\'s Black Tentacles', 'Grappling tentacles in 20-ft. spread.'),
      rollB('ef-inv-ct-r', 'Damage', 2, 'd6', 0, 'Cold')
    ]
  },
  'inv-devour-magic': {
    effects: [
      spellLinkB('ef-inv-dm-sp', 'Greater Dispel Magic', 'Touch Greater Dispel Magic; gain 5 Temp HP per spell level dispelled.'),
      rollB('ef-inv-dm-thp', 'Temp HP', 5, 'flat', 0, 'Positive')
    ]
  },
  'inv-voracious-dispelling': {
    effects: [spellLinkB('ef-inv-vd', 'Dispel Magic', 'Dispel Magic; target takes 1 damage per spell level dispelled.')]
  },
  'inv-wall-of-perilous-flame': {
    effects: [
      spellLinkB('ef-inv-wpf', 'Wall of Fire', 'Wall of Fire (half Fire, half Supernatural Untyped damage).'),
      rollB('ef-inv-wpf-r', 'Damage', 2, 'd6', 0, 'Fire')
    ]
  },
  'inv-darkness': { effects: [spellLinkB('ef-inv-dk', 'Darkness', 'At-will Darkness (20-ft. radius).')] },
  'inv-baleful-utterance': { effects: [spellLinkB('ef-inv-bu', 'Shatter', 'At-will Shatter via Dark Speech.')] },
  'inv-earthen-grasp': { effects: [spellLinkB('ef-inv-eg', 'Earthen Grasp', 'Summon grappling earthen arm.')] },
  'inv-frightful-presence': { effects: [riderB('ef-inv-fp', 'Enemies within 30 ft. with fewer HD Shaken for 10 min', 'Will', '')] },
  'inv-flee-the-scene': { effects: [spellLinkB('ef-inv-fts', 'Dimension Door', 'Short-range Dimension Door + Major Image duplicate (1 round).')] },
  'inv-walk-unseen': { effects: [spellLinkB('ef-inv-wu', 'Invisibility', 'At-will Invisibility (self, 24 hours).')] },
  'inv-charm': { effects: [spellLinkB('ef-inv-chm', 'Charm Monster', 'Single-target Charm Monster (60 ft., Will negates).')] },
  'inv-curse-of-despair': { effects: [spellLinkB('ef-inv-cod', 'Bestow Curse', 'Touch Bestow Curse (-1 attack rolls for 1 min even on successful save).')] },
  'inv-retributive-phantasm': { effects: [spellLinkB('ef-inv-rp', 'Phantasmal Killer', 'Immediate action Phantasmal Killer against attacker.')] },

  // Epic Feats (`srd_feats_epic.json`)
  'feat-combat-insight': {
    effects: [switchB('ef-ep-ci', 'intModToMeleeDamage', 'Add INT Modifier Instead of STR Modifier to Melee Weapon Damage Rolls')]
  },
  'feat-epic-combat-expertise': {
    effects: [switchB('ef-ep-ece', 'uncappedCombatExpertise', 'Combat Expertise Penalty/Dodge Bonus Uncapped up to Full Base Attack Bonus')]
  },
  'feat-epic-sunder': {
    effects: [
      statB('ef-ep-esun', ['ability.str.check'], 4, 'Untyped', { condition: 'Breaking Objects with Sudden Force' }),
      switchB('ef-ep-esun-sw', 'doubleStrOnSunder', 'Double Strength Damage Bonus on Sunder Attacks')
    ]
  },
  'feat-wield-oversized-weapon': {
    effects: [switchB('ef-ep-wow', 'wieldOversizedWeapon', 'Treat Weapons as One Size Category Smaller/Lighter for Effort to Wield')]
  },
  'feat-epic-devotion': {
    effects: [whenSitB('ef-ep-edev', 'situational', 'vs. Chosen Alignment Spells', [statB('ef-ep-edev-s', ['save.all'], 4, 'Untyped')])]
  },
  'feat-improved-skirmish': {
    effects: [
      whenSitB('ef-ep-isk', 'situational', 'Moved 20+ ft. This Round', [
        rollB('ef-ep-isk-d', 'Damage', 2, 'd6', 0, 'Precision'),
        statB('ef-ep-isk-ac', ['ac.competence' in {} ? 'ac.total' : 'ac.total'], 2, 'Competence')
      ])
    ]
  },
  'feat-improved-sudden-strike': {
    effects: [rollB('ef-ep-iss', 'Damage', 1, 'd6', 0, 'Precision')]
  },
  'feat-legendary-acrobat': {
    effects: [switchB('ef-ep-lacro', 'ignoreAcceleratedBalanceTumblePenalty', 'Ignore Accelerated Movement Penalties on Balance and Tumble')]
  },
  'feat-automatic-quicken-power': {
    effects: [metaB('ef-ep-aqp', 0, 'quicken', 'Quicken 1st-Level Powers Automatically While Psionically Focused', { costMode: 'passive' })]
  },
  'feat-epic-power-penetration': {
    effects: [statB('ef-ep-epp', ['caster.spellPenetration'], 2, 'Untyped')]
  },
  'feat-epic-psionic-endowment': {
    effects: [whenSitB('ef-ep-epe', 'state', 'Expending Psionic Focus', [statB('ef-ep-epe-dc', ['spell.dc'], 1, 'Untyped')])]
  },
  'feat-improved-combat-manifestation': {
    effects: [whenSitB('ef-ep-icm', 'situational', 'Manifesting Defensively', [statB('ef-ep-icm-c', ['skill.concentration'], 'floor(@level / 2)', 'Untyped')])]
  },
  'feat-improved-overchannel': {
    effects: [switchB('ef-ep-iov', 'improvedOverchannel', 'Overchannel Manifester Level Beyond Normal Cap by Taking HP Damage')]
  },
  'feat-axiomatic-strike-pgtf': {
    effects: [{ id: 'ef-ep-ax', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'all', drBypassList: 'lawful', enhEquivalent: 0 }, rollB('ef-ep-ax-r', 'Damage', 2, 'd6', 0, 'Lawful', { condition: 'vs. Chaotic' })]
  },
  'feat-chosen-weapon-specialization': {
    choices: WEAPON_CHOICE_DEF,
    effects: [whenNamedB('ef-ep-cws', 'wieldingChosenWeapon', [statB('ef-ep-cws-d', ['dmg.weapon'], 2, 'Untyped')])]
  },
  'feat-divine-spell-penetration': {
    effects: [whenSitB('ef-ep-dsp', 'situational', 'Aligned Spells', [statB('ef-ep-dsp-sr', ['caster.spellPenetration'], 4, 'Untyped')])]
  },
  'feat-epic-counterspell': {
    effects: [switchB('ef-ep-ecsp', 'reactiveUnlimitedCounterspell', 'Counterspell Any Number of Times per Round Without Readying an Action')]
  },
  'feat-epic-spellfire-wielder': {
    effects: [ruleB('ef-ep-esfw', 'Effective Constitution +4 for maximum stored Spellfire energy levels.')]
  },
  'feat-enhance-effect': {
    effects: [ruleB('ef-ep-enhef', 'Alter variable parameters of an active persistent spell effect.')]
  },
  'feat-improved-cooperative-metamagic': {
    effects: [metaB('ef-ep-icmm', 0, 'quicken', 'Apply Silent, Still, or Quicken Spell via Cooperative Metamagic', { costMode: 'passive' })]
  },
  'feat-improved-snatch-spell': {
    effects: [ruleB('ef-ep-isnatch', 'Redirect and control spells seized via Snatch Spell or Seize Concentration.')]
  },
  'feat-improved-spellpool-access': {
    effects: [ruleB('ef-ep-ispa', 'Increased spell availability threshold when calling spells from a Spellpool.')]
  },

  // Protection Domain (`srd_domains.json`)
  'dom-protection': {
    effects: [
      resB('ef-dom-prot-res', 'Protective Ward', 1, 'perDay'),
      whenSitB('ef-dom-prot-w', 'state', 'Protective Ward Active (Next Saving Throw, up to 1 Hour)', [
        statB('ef-dom-prot-sv', ['save.all'], '@level', 'Resistance')
      ])
    ]
  },

  // Conditions (`srd_combat_rules.json`)
  'cnd-flat-footed': {
    effects: [
      switchB('ef-cnd-ff-dex', 'loseDexToAC', 'Loses Dexterity Bonus to AC'),
      switchB('ef-cnd-ff-aoo', 'cannotMakeAoO', 'Cannot Make Attacks of Opportunity')
    ]
  },
  'cnd-paralyzed': {
    effects: [
      switchB('ef-cnd-par-dex', 'effectiveDexZero', 'Helpless & Frozen (Effective STR 0, DEX 0; Loses Dex to AC)')
    ]
  },
  'cnd-unconscious': {
    effects: [
      switchB('ef-cnd-unc-dex', 'effectiveDexZero', 'Helpless & Unconscious (Effective DEX 0; Loses Dex to AC)')
    ]
  },
  'cnd-nauseated': {
    effects: [
      switchB('ef-cnd-nau', 'singleMoveActionOnly', 'Unable to Attack or Cast Spells; Single Move Action per Turn Only')
    ]
  },
  'cnd-staggered': {
    effects: [
      switchB('ef-cnd-stag', 'singleMoveOrStandardOnly', 'Single Move Action or Standard Action per Round Only')
    ]
  },
  'cnd-dazed': {
    effects: [
      switchB('ef-cnd-daz', 'noActionsAllowed', 'Can Take No Actions (No AC Penalty)')
    ]
  },
  'cnd-disabled': {
    effects: [
      switchB('ef-cnd-dis-spd', 'halfSpeed', 'Move at Half Speed; Single Move or Standard Action (Standard Action Costs 1 HP)')
    ]
  },
  'cnd-incorporeal': {
    effects: [
      defB('ef-cnd-inc-imm', 'Immunity', 'Nonmagical Attack Forms', 0),
      defB('ef-cnd-inc-miss', 'State', '50% Incorporeal Miss Chance vs. Corporeal Magic Sources', 50)
    ]
  },
  'cnd-energy-drained': {
    effects: [
      statB('ef-cnd-ed-atk', ['atk.all', 'save.all', 'skill.all'], -1, 'Penalty'),
      statB('ef-cnd-ed-hp', ['hp.max'], -5, 'Penalty')
    ]
  },
  'cnd-turned': {
    effects: [
      statB('ef-cnd-trn-ac', ['ac.total'], -2, 'Penalty', { condition: 'Cowering if Cornered (+2 Attack Bonus to Foes)' }),
      ruleB('ef-cnd-trn-r', 'Flees for 10 rounds (1 minute); cowers if unable to flee.')
    ]
  },
  'cnd-confused': {
    effects: [
      ruleB('ef-cnd-conf', 'Roll d% each round: 01-10 attack caster, 11-20 act normally, 21-50 babble incoherently, 51-70 flee from caster, 71-100 attack nearest creature.')
    ]
  },
  'cnd-petrified': {
    effects: [
      defB('ef-cnd-pet-dr', 'Hardness', 'Stone Body (Hardness 8, Unconscious)', 8)
    ]
  },
  'cnd-knocked-down': {
    effects: [
      switchB('ef-cnd-kd', 'proneFromWind', 'Knocked Prone (or Blown Down 1d6x10 ft. if Flying)')
    ]
  },

  // Special Materials (`srd_equipment.json`)
  'mat-adamantine': {
    effects: [
      defB('ef-mat-adam-dr', 'Damage Reduction', '-', 3),
      { id: 'ef-mat-adam-byp', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'equipped', drBypassList: 'adamantine', enhEquivalent: 0 },
      switchB('ef-mat-adam-hd', 'ignoreHardnessBelow20', 'Weapon Ignores Hardness < 20; Armor Grants DR 1/- (Light), 2/- (Medium), 3/- (Heavy)')
    ]
  },
  'mat-mithral': {
    effects: [
      { id: 'ef-mat-mith-byp', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'equipped', drBypassList: 'silver', enhEquivalent: 0 },
      switchB('ef-mat-mith-arm', 'mithralArmorReduction', 'Half Weight; Armor/Shield +2 Max Dex, -3 ACP, -10% ASF, One Category Lighter')
    ]
  },
  'mat-alchemical-silver': {
    effects: [
      { id: 'ef-mat-silv-byp', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'equipped', drBypassList: 'silver', enhEquivalent: 0 },
      statB('ef-mat-silv-dmg', ['dmg.weapon'], -1, 'Penalty')
    ]
  },
  'mat-darkwood': {
    effects: [
      switchB('ef-mat-dw', 'darkwoodWeightAndAcp', 'Half Weight Wooden Masterwork; Shield Armor Check Penalty Reduced by 2')
    ]
  },
  'mat-cold-iron': {
    effects: [
      { id: 'ef-mat-ci-byp', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'equipped', drBypassList: 'cold iron', enhEquivalent: 0 }
    ]
  },
  'mat-iron-cold': {
    effects: [
      { id: 'ef-mat-ci2-byp', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'equipped', drBypassList: 'cold iron', enhEquivalent: 0 }
    ]
  },
  'mat-crystal-deep': {
    effects: [
      resB('ef-mat-dcrys-res', 'Psionic Charge', 2, 'atWill'),
      rollB('ef-mat-dcrys-dmg', 'Damage', 2, 'd6', 0, 'Untyped')
    ]
  },
  'mat-dragonhide': {
    effects: [
      switchB('ef-mat-dhide', 'druidPermittedMetalReplacement', 'Masterwork Nonmetal Armor/Shield Usable by Druids Without Oath Violation')
    ]
  },

  // Key Charged Items (`Healing Belt`, `Belt of Battle`, `Boots of Speed`, `Witchlight Reservoir`)
  'mi-mic-healing-belt': {
    forceOverwriteEffects: true,
    effects: [
      statB('ef-hb-heal-sk', ['skill.heal'], 2, 'Competence'),
      resB('ef-hb-charges', 'Daily Charges', 3, 'perDay'),
      rollB('ef-hb-heal-r', 'Healing', 2, 'd8', 0, 'Positive')
    ]
  },
  'mi-mic-belt-of-battle': {
    forceOverwriteEffects: true,
    effects: [
      statB('ef-bob-init', ['initiative'], 2, 'Competence'),
      resB('ef-bob-charges', 'Daily Charges', 3, 'perDay'),
      ruleB('ef-bob-act', 'Swift action: spend 1 charge (extra Move action), 2 charges (extra Standard action), or 3 charges (extra Full-Round action).')
    ]
  },
  'mi-boots-of-speed': {
    forceOverwriteEffects: true,
    effects: [
      resB('ef-bos-rounds', 'Haste Rounds', 10, 'perDay'),
      spellLinkB('ef-bos-haste', 'Haste', 'Free action: act as if affected by Haste for up to 10 rounds/day.')
    ]
  },
  'crys-witchlight-reservoir': {
    forceOverwriteEffects: true,
    effects: [
      resB('ef-wlr-charges', 'Daily Charges', 5, 'perDay'),
      rollB('ef-wlr-dmg', 'Damage', 2, 'd6', 0, 'Fire/Electricity')
    ]
  }
};

// ----------------------------------------------------------------------------
// 2. All 34 Empty ToB Stances & 76 Empty ToB Maneuvers (`srd_maneuvers.json`)
// ----------------------------------------------------------------------------
function compileManeuversAndStances(manData) {
  let count = 0;
  const STANCE_MAP = {
    'tob-stance-flame-s-blessing': [defB('ef-st-fb', 'Energy Resistance', 'Fire (Scales with Tumble Ranks: 5/10/20/Immunity)', 5)],
    'tob-stance-holocaust-cloak': [rollB('ef-st-hc', 'Damage', 5, 'flat', 0, 'Fire')],
    'tob-stance-iron-guard-s-glare': [switchB('ef-st-igg', 'threatenedFoesPenaltyVsAllies', 'Threatened Enemies Take -4 Attack Penalty Against Your Allies')],
    'tob-stance-martial-spirit': [rollB('ef-st-ms', 'Healing', 2, 'flat', 0, 'Positive')],
    'tob-stance-thicket-of-blades': [switchB('ef-st-tob', 'anyMovementProvokesAoO', 'All Movement by Threatened Foes (Including 5-ft. Steps) Provokes AoO')],
    'tob-stance-aura-of-chaos': [switchB('ef-st-aoc', 'explodingMeleeDamageDice', 'Reroll and Add Maximum-Value Melee Damage Dice')],
    'tob-stance-aura-of-perfect-order': [switchB('ef-st-aopo', 'treatD20As11OncePerRound', '1/Round Treat One d20 Roll as 11 Before Rolling')],
    'tob-stance-aura-of-triumph': [rollB('ef-st-aot', 'Healing', 4, 'flat', 0, 'Positive')],
    'tob-stance-aura-of-tyranny': [rollB('ef-st-aoty', 'Healing', 2, 'flat', 0, 'Negative')],
    'tob-stance-immortal-fortitude': [switchB('ef-st-if', 'fortSaveStayAt1Hp', 'Fortitude Save (DC = -HP) to Remain at 1 HP Against Lethal HP Damage')],
    'tob-stance-pearl-of-black-doubt': [whenSitB('ef-st-pobd', 'state', 'Each Melee Miss Against You This Round', [statB('ef-st-pobd-ac', ['ac.dodge'], 2, 'Dodge')])],
    'tob-stance-stance-of-alacrity': [switchB('ef-st-soa', 'freeCounterPerRound', 'Use One Counter per Round Without Spending Immediate Action')],
    'tob-stance-dancing-blade-form': [switchB('ef-st-dbf', 'reachPlus5OnTurn', '+5 ft. Melee Reach During Your Turn')],
    'tob-stance-supreme-blade-parry': [defB('ef-st-sbp', 'Damage Reduction', '-', 5)],
    'tob-stance-shifting-defense': [switchB('ef-st-shd', 'fiveFootStepOnFoeMiss', 'Immediate 5-ft. Step (Consumes AoO) When Missed in Melee')],
    'tob-stance-ghostly-defense': [switchB('ef-st-gd', 'redirectConcealmentMisses', 'Attacks Missing Due to Concealment Strike Adjacent Creature')],
    'tob-stance-child-of-shadow': [whenSitB('ef-st-cos', 'state', 'Moved 10+ ft. This Turn', [defB('ef-st-cos-c', 'State', 'Concealment (20% Miss Chance)', 20)])],
    'tob-stance-island-of-blades': [switchB('ef-st-iob', 'adjacentAllyAlwaysFlanks', 'You and Any Ally Adjacent to Same Foe Always Flank That Foe')],
    'tob-stance-dance-of-the-spider': [statB('ef-st-dots', ['speed.climb'], 20, 'Enhancement')],
    'tob-stance-step-of-the-dancing-moth': [whenNamedB('ef-st-sodm', 'vsAoOFromMovement', [statB('ef-st-sodm-ac', ['ac.dodge'], 2, 'Dodge')]), switchB('ef-st-sodm-w', 'walkOnLiquidIgnoreTerrain', 'Walk on Liquids / 5 ft. Above Ground; Ignore Difficult Terrain')],
    'tob-stance-balance-on-the-sky': [spellLinkB('ef-st-bots', 'Air Walk', 'Continuous Air Walk while one hand remains free.')],
    'tob-stance-roots-of-the-mountain': [
      defB('ef-st-rotm-dr', 'Damage Reduction', '-', 2),
      statB('ef-st-rotm-cmd', ['cmd.bullRushTripDisarmOverrun'], 10, 'Untyped')
    ],
    'tob-stance-giant-s-stance': [switchB('ef-st-gs', 'weaponDamageSizeUpOne', 'Melee Weapons Deal Damage as One Size Category Larger (Max Large)')],
    'tob-stance-strength-of-stone': [defB('ef-st-sos', 'Immunity', 'Critical Hits', 0)],
    'tob-stance-blood-in-the-water': [whenSitB('ef-st-bitw', 'state', 'Per Critical Hit Scored (Cumulative)', [statB('ef-st-bitw-b', ['atk.all', 'dmg.all'], 1, 'Untyped')])],
    'tob-stance-hunter-s-sense': [defB('ef-st-hs', 'Sense', 'Scent 30 ft.', 30)],
    'tob-stance-leaping-dragon-stance': [statB('ef-st-lds', ['skill.jump'], 10, 'Enhancement'), switchB('ef-st-lds-r', 'alwaysRunningJump', 'All Jumps Treated as Running Jumps')],
    'tob-stance-wolverine-stance': [whenSitB('ef-st-ws', 'situational', 'While Grappling (vs. Larger Foe)', [statB('ef-st-ws-d', ['dmg.melee'], 4, 'Untyped')]), switchB('ef-st-ws-g', 'noGrappleWeaponPenalty', 'Use 1-Handed Weapon in Grapple Without -4 Penalty')],
    'tob-stance-wolf-pack-tactics': [switchB('ef-st-wpt', 'free5ftStepPerMeleeHit', 'Free 5-ft. Step After Each Successful Melee Attack')],
    'tob-stance-prey-on-the-weak': [switchB('ef-st-potw', 'freeAoOOnNearbyDrop', 'Free AoO Against Adjacent Foes When Creature Within 10 ft. Drops Below 0 HP')],
    'tob-stance-leading-the-charge': [whenNamedB('ef-st-ltc', 'charging', [statB('ef-st-ltc-d', ['dmg.melee'], '@level', 'Untyped')])],
    'tob-stance-tactics-of-the-wolf': [whenNamedB('ef-st-totw', 'flanking', [statB('ef-st-totw-d', ['dmg.melee'], 'floor(@level / 2)', 'Untyped')])],
    'tob-stance-press-the-advantage': [switchB('ef-st-pta', 'doubleFiveFootStep', 'Take a Second Immediate 5-ft. Step Whenever Taking a 5-ft. Step')],
    'tob-stance-swarm-tactics': [switchB('ef-st-swt', 'alliesPlus5AtkVsAdjacent', 'Allies Gain +5 Melee Attack Against Foes Adjacent to You')]
  };

  for (const e of manData) {
    if (!e || (Array.isArray(e.effects) && e.effects.length > 0)) continue;
    if (STANCE_MAP[e.id]) {
      e.effects = STANCE_MAP[e.id];
      count++;
      continue;
    }
    if (e.type === 'Maneuver') {
      const d = String(e.shortDescription || e.text || '');
      const effs = [];
      // Healing strikes
      const healM = d.match(/heals?\s+(\d+)d(\d+)\s*\+\s*1\/initiator\s+level\s*\(max\s*\+(\d+)\)/i);
      if (healM) {
        effs.push(rollB(`${e.id}-hl`, 'Healing', Number(healM[1]), `d${healM[2]}`, 0, 'Positive', { scaling: 'perCL', amount: 1, per: 1, max: Number(healM[3]) }));
      } else if (/benefit of a Heal spell/i.test(d)) {
        effs.push(spellLinkB(`${e.id}-hlsp`, 'Heal', 'Single melee hit triggers Heal spell on self or ally within 10 ft.'));
      } else if (/heal HP equal to twice your character level/i.test(d)) {
        effs.push(rollB(`${e.id}-ihe`, 'Healing', 1, 'flat', 0, 'Positive', { scaling: 'formula', dice: '@level * 2' }));
      }
      // Ability damage strikes
      const abDmgM = d.match(/(\d+(?:d\d+)?)\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+damage/i);
      if (abDmgM) {
        const dicePart = abDmgM[1];
        const dm = dicePart.match(/^(\d+)d(\d+)$/i);
        effs.push(dm
          ? rollB(`${e.id}-abd`, 'Ability Damage', Number(dm[1]), `d${dm[2]}`, 0, `${abDmgM[2].slice(0, 3).toUpperCase()} Damage`)
          : rollB(`${e.id}-abd`, 'Ability Damage', Number(dicePart), 'flat', 0, `${abDmgM[2].slice(0, 3).toUpperCase()} Damage`)
        );
      }
      // Negative levels
      if (/1d4\s+negative\s+levels/i.test(d)) {
        effs.push(rollB(`${e.id}-nl`, 'Damage', 1, 'd4', 0, 'Negative Levels'));
      }
      // DR grants (Stone/Iron/Adamantine Bones)
      const drM = d.match(/gain\s+DR\s+(\d+)\/([a-z\-]+)/i);
      if (drM) {
        effs.push(defB(`${e.id}-dr`, 'Damage Reduction', drM[2], Number(drM[1])));
      }
      // Concentration save replacements
      const concSaveM = d.match(/Concentration check in place of a (Fortitude|Reflex|Will) saving throw/i);
      if (concSaveM) {
        effs.push(switchB(`${e.id}-csv`, `concentrationReplaces${concSaveM[1]}`, `Replace ${concSaveM[1]} Save with Concentration Check`));
      }
      // Diamond Defense
      if (e.id === 'tob-maneuver-diamond-defense') {
        effs.push(statB('ef-dd-sv', ['save.all'], '@level', 'Untyped'));
      }
      // Extra attacks (Dancing/Raging Mongoose, Steel Wind, Time Stands Still, Avalanche of Blades, Rapid Counter, Scything Blade)
      if (/extra attack|two melee attacks|two full attack|extra AoO/i.test(d)) {
        effs.push({ id: `${e.id}-xatk`, type: 'attack', attackMode: 'extraAttack', extraKind: 'extraFull', penalty: 0, rider: e.name });
      }
      // Save riders
      const saveM = d.match(/(Fortitude|Reflex|Will|Fort)\s*(?:save|negates|partial|halves)?[^.;]*?DC\s*(\d+\s*\+\s*[A-Za-z]+\s*mod)/i);
      if (saveM) {
        const st = saveM[1].toLowerCase().startsWith('fort') ? 'Fortitude' : (saveM[1].toLowerCase().startsWith('ref') ? 'Reflex' : 'Will');
        effs.push(riderB(`${e.id}-rd`, e.shortDescription || e.name, st, saveM[2]));
      }
      if (effs.length === 0) {
        effs.push(switchB(`${e.id}-sw`, e.id.replace(/^tob-maneuver-/, ''), e.name, e.shortDescription || e.text || e.name));
      }
      e.effects = effs;
      count++;
    }
  }
  return count;
}

// ----------------------------------------------------------------------------
// 3. Poisons, Consumables, Gear/Tools, Augmentation Crystals, Enhancements & Magic Items
// ----------------------------------------------------------------------------
function parsePoisonExprToRoll(idPrefix, label, expr) {
  if (!expr || expr === '0' || /^none$/i.test(expr)) return null;
  const clean = String(expr).trim();
  const blocks = [];
  const parts = clean.split(/\s*\+\s*/);
  parts.forEach((p, idx) => {
    const dm = p.match(/^(\d+)d(\d+)\s*(hp|str|dex|con|int|wis|cha)(?:\s*(drain))?/i);
    const fm = p.match(/^(\d+)\s*(hp|str|dex|con|int|wis|cha)(?:\s*(drain))?/i);
    if (dm) {
      const isHp = dm[3].toLowerCase() === 'hp';
      const kind = isHp ? 'Damage' : (dm[4] ? 'Ability Drain' : 'Ability Damage');
      const dtype = isHp ? 'Poison' : `${dm[3].toUpperCase()} ${dm[4] ? 'Drain' : 'Damage'}`;
      blocks.push(rollB(`${idPrefix}-${idx}`, kind, Number(dm[1]), `d${dm[2]}`, 0, dtype, { condition: label }));
    } else if (fm) {
      const isHp = fm[2].toLowerCase() === 'hp';
      const kind = isHp ? 'Damage' : (fm[3] ? 'Ability Drain' : 'Ability Damage');
      const dtype = isHp ? 'Poison' : `${fm[2].toUpperCase()} ${fm[3] ? 'Drain' : 'Damage'}`;
      blocks.push(rollB(`${idPrefix}-${idx}`, kind, Number(fm[1]), 'flat', 0, dtype, { condition: label }));
    } else {
      blocks.push(riderB(`${idPrefix}-${idx}`, `${label}: ${p}`));
    }
  });
  return blocks;
}

function compileEquipmentAndMic(eqData, micEntries) {
  let patched = 0;

  // Bogus mundane tool ruleFlags to strip so mundane camp tools stay clean Grup D
  const MUNDANE_TOOL_STRIP_IDS = new Set([
    'gear-holy-symbol-silver',
    'gear-holy-symbol-wooden',
    'gear-spellbook',
    'gear-pouch-spell-component',
    'gear-thieves-tools',
    'gear-artisans-tools'
  ]);

  const GEAR_SKILL_BONUSES = {
    'gear-crowbar': [statB('ef-crowbar', ['ability.str.check'], 2, 'Circumstance', { condition: 'Forcing Open Doors/Chests' })],
    'gear-ram-portable': [statB('ef-pram', ['ability.str.check'], 2, 'Circumstance', { condition: 'Breaking Down Doors' })],
    'gear-climbers-kit': [statB('ef-ckit', ['skill.climb'], 2, 'Circumstance')],
    'gear-disguise-kit': [statB('ef-dkit', ['skill.disguise'], 2, 'Circumstance')],
    'gear-healers-kit': [statB('ef-hkit', ['skill.heal'], 2, 'Circumstance')],
    'gear-magnifying-glass': [statB('ef-mglass', ['skill.appraise'], 2, 'Circumstance', { condition: 'Small or Highly Detailed Items' })],
    'gear-thieves-tools-masterwork': [statB('ef-mw-tt', ['skill.disable-device', 'skill.open-lock'], 2, 'Circumstance')],
    'gear-artisans-tools-masterwork': [statB('ef-mw-at', ['skill.craft'], 2, 'Circumstance')],
    'gear-tools-masterworked': [statB('ef-mw-tool', ['choice.skill.1'], 2, 'Circumstance')],
    'gear-musical-instrument-masterwork': [statB('ef-mw-inst', ['skill.perform'], 2, 'Circumstance')],
    'gear-torch-everburning': [defB('ef-ebtorch', 'Sense', 'Continuous Bright Light 20 ft. / Shadowy 40 ft.', 20)],
    'gear-sunrod': [defB('ef-sunrod', 'Sense', 'Bright Light 30 ft. / Shadowy 60 ft. (6 hours)', 30)],
    'gear-smokestick': [defB('ef-smokestick', 'State', 'Total Concealment in 10-ft. Smoke Cube', 50)],
    'gear-tindertwig': [ruleB('ef-tinder', 'Ignites flame immediately as a standard action.')],
    'gear-thunderstone': [riderB('ef-tstone', '10-ft. Burst: Deafened for 1 Hour (-4 Initiative, 20% Vocal Spell Failure)', 'Fortitude', 15)],
    'gear-tanglefoot-bag': [riderB('ef-tfbag', 'Ranged Touch: Entangled (-2 Attack, -4 DEX, Half Speed) & Glued', 'Reflex', 15)],
    'pot-levitate': [spellLinkB('ef-pot-lev', 'Levitate', 'Levitate for 3 minutes (CL 3rd).')],
    'pot-water-breathing': [spellLinkB('ef-pot-wb', 'Water Breathing', 'Breathe underwater for 10 hours (CL 5th).')],
    'pot-water-walk': [spellLinkB('ef-pot-ww', 'Water Walk', 'Walk on liquid for 50 minutes (CL 5th).')],
    'pot-pass-without-trace': [spellLinkB('ef-pot-pwt', 'Pass without Trace', 'Leave no tracks or scent for 1 hour (CL 1st).')],
    'pot-tongues': [spellLinkB('ef-pot-tng', 'Tongues', 'Speak and understand any language for 50 minutes (CL 5th).')],
    'pot-nondetection': [spellLinkB('ef-pot-nd', 'Nondetection', 'Ward against divination/scrying (DC 16) for 5 hours (CL 5th).')],
    'pot-mic-dragon-s-draught': [defB('ef-pot-dd', 'Immunity', 'Sleep & Paralysis (1 hour; Blindsense 30 ft. if Dragonblood)', 30)]
  };

  const allItems = [...eqData, ...micEntries];
  for (const e of allItems) {
    if (!e) continue;
    if (MUNDANE_TOOL_STRIP_IDS.has(e.id)) {
      delete e.ruleFlags;
      continue;
    }
    if (EXPLICIT_PATCHES[e.id]) {
      const p = EXPLICIT_PATCHES[e.id];
      if (p.choices) e.choices = p.choices;
      if (p.forceOverwriteEffects || !Array.isArray(e.effects) || e.effects.length === 0) {
        e.effects = JSON.parse(JSON.stringify(p.effects));
        patched++;
      }
      continue;
    }
    if (Array.isArray(e.effects) && e.effects.length > 0) continue;
    if (Array.isArray(e.powers) && e.powers.length > 0) continue;
    if ((e.weapon || e.armor) && !/^mi-|-mic-/.test(String(e.id || ''))) continue;

    if (GEAR_SKILL_BONUSES[e.id]) {
      e.effects = GEAR_SKILL_BONUSES[e.id];
      patched++;
      continue;
    }

    // 1) 28 DMG Poisons (`psn-*`)
    if (e.id && e.id.startsWith('psn-') && e.ruleFlags) {
      const rf = e.ruleFlags;
      const effs = [
        riderB(`${e.id}-hdr`, `${rf.poisonMethod || 'Injury'} Poison (Initial: ${rf.initialEffect || '0'} / Secondary: ${rf.secondaryEffect || '0'})`, 'Fortitude', rf.fortDc || 15)
      ];
      const initB = parsePoisonExprToRoll(`${e.id}-init`, 'Initial Damage', rf.initialEffect);
      const secB = parsePoisonExprToRoll(`${e.id}-sec`, 'Secondary Damage', rf.secondaryEffect);
      if (initB) effs.push(...initB);
      if (secB) effs.push(...secB);
      e.effects = effs;
      patched++;
      continue;
    }

    // 2) All 26 Remaining Augmentation Crystals (`crys-*`)
    if (e.type === 'AugmentationCrystal') {
      const rf = e.ruleFlags || {};
      const effs = [];
      if (rf.armorHardnessBonus) effs.push(defB(`${e.id}-hd`, 'Hardness', `Armor/Shield Hardness +${rf.armorHardnessBonus}`, rf.armorHardnessBonus));
      if (rf.weaponHardnessBonus) effs.push(defB(`${e.id}-hd`, 'Hardness', `Weapon Hardness +${rf.weaponHardnessBonus}`, rf.weaponHardnessBonus));
      if (rf.endureElements) effs.push(defB(`${e.id}-ee`, 'Immunity', 'Environmental Heat/Cold & Hostile Planar Traits', 0));
      if (rf.avertGazeNoMissChance) effs.push(switchB(`${e.id}-gaze`, 'avertGazeNoMissChance', 'No Concealment Miss Chance When Averting Eyes From Gaze Attacks'));
      if (rf.lightRadiusBrightFt) effs.push(defB(`${e.id}-lt`, 'Sense', `Bright Illumination ${rf.lightRadiusBrightFt} ft.`, rf.lightRadiusBrightFt));
      if (rf.lifeStealPerHit) {
        effs.push(resB(`${e.id}-cap`, 'Daily Life Drinking Pool', rf.lifeStealDailyCap || 10, 'perDay'));
        effs.push(rollB(`${e.id}-hl`, 'Healing', rf.lifeStealPerHit, 'flat', 0, 'Positive'));
      }
      if (rf.quickDraw) effs.push(switchB(`${e.id}-qd`, 'quickDraw', rf.returning ? 'Quick Draw + Returning Property' : 'Draw Attached Weapon as a Free Action (Quick Draw)'));
      if (rf.incorporealTouchPenalty) effs.push(switchB(`${e.id}-scr`, 'incorporealTouchPenalty5', 'Incorporeal Touch Attacks Against You Take -5 Penalty'));
      if (rf.disarmResistBonus) effs.push(statB(`${e.id}-dis`, ['cmd.bullRushTripDisarmOverrun'], rf.disarmResistBonus, 'Untyped', { condition: 'vs. Disarm (Cannot Drop Weapon on Panic)' }));
      if (rf.lingeringFireDamage) effs.push(rollB(`${e.id}-pash`, 'Damage', rf.lingeringFireDamage, 'flat', 0, 'Fire'));
      if (rf.sleepInArmorNoFatigue) effs.push(switchB(`${e.id}-rest`, 'sleepInArmorNoFatigue', 'Sleep in Medium or Heavy Armor Without Becoming Fatigued'));
      if (rf.revealInvisibleOnHit || rf.suppressInvisibilityOnHit) {
        effs.push(switchB(`${e.id}-rev`, 'suppressInvisibilityOnHit', rf.suppressConcealmentOnHit ? 'Suppress Target Invisibility & Concealment for 1 Round on Hit' : 'Reveal/Suppress Target Invisibility for 1 Round on Hit'));
      }
      if (effs.length === 0) effs.push(ruleB(`${e.id}-r`, e.shortDescription || e.text || e.name));
      e.effects = effs;
      patched++;
      continue;
    }

    // 3) DMG & MIC Weapon/Armor Enhancements (`type === 'Enhancement'`)
    if (e.type === 'Enhancement') {
      const d = String(e.shortDescription || e.text || '');
      const nm = String(e.name || '');
      const effs = [];
      const resM = nm.match(/^(Acid|Cold|Electricity|Fire|Sonic)\s+Resistance(?:,\s*(Improved|Greater))?$/i);
      if (resM) {
        const tier = (resM[2] || '').toLowerCase();
        const val = tier === 'greater' ? 30 : (tier === 'improved' ? 20 : 10);
        effs.push(defB(`${e.id}-res`, 'Energy Resistance', resM[1][0].toUpperCase() + resM[1].slice(1).toLowerCase(), val));
      } else if (e.id === 'enh-radiant') {
        effs.push(defB('ef-rad-res', 'Energy Resistance', 'All (Acid, Cold, Electricity, Fire, Sonic)', 10));
      } else if (e.id === 'enh-invulnerability') {
        effs.push(defB('ef-invuln-dr', 'Damage Reduction', 'magic', 5));
      } else if (e.id === 'enh-wounding') {
        effs.push(rollB('ef-wound-con', 'Ability Damage', 1, 'flat', 0, 'CON Damage'));
      } else if (e.id === 'enh-keen' || e.id === 'enh-impact' || e.itemModifier?.keen) {
        effs.push(switchB(`${e.id}-keen`, 'keen', 'Doubles Weapon Critical Threat Range'));
      } else if (e.id === 'enh-defending') {
        effs.push(switchB('ef-defending', 'defendingWeapon', 'Allocate Weapon Enhancement Bonus to AC (Stacks with All Bonuses)'));
      } else if (e.id === 'enh-throwing') {
        effs.push(switchB('ef-throwing', 'thrownRange10Ft', 'Melee Weapon Can Be Thrown (10-ft. Range Increment)'));
      } else if (e.id === 'enh-returning') {
        effs.push(switchB('ef-returning', 'returningWeapon', 'Thrown Weapon Returns to Hand Before Next Turn'));
      } else if (e.id === 'enh-distance') {
        effs.push(switchB('ef-distance', 'doubleRangeIncrement', 'Doubles Ranged Weapon Range Increment'));
      } else if (e.id === 'enh-seeking') {
        effs.push(switchB('ef-seeking', 'ignoreConcealmentMissChance', 'Negates Concealment Miss Chances'));
      } else if (e.id === 'enh-ghost-touch-weapon' || /ghost touch weapon/i.test(d)) {
        effs.push(switchB(`${e.id}-gt`, 'ghostTouchWeapon', 'Deals Full Damage to Incorporeal Creatures'));
      } else if (e.id === 'enh-brilliant-energy') {
        effs.push(switchB('ef-bril', 'ignoreArmorAndShieldAc', 'Ignores Armor and Shield Bonuses to AC (Cannot Harm Undead/Constructs)'));
      } else if (e.id === 'enh-disruption') {
        effs.push(riderB('ef-disrupt', 'Undead Struck Destroyed Immediately', 'Will', 14));
      } else if (e.id === 'enh-vorpal') {
        effs.push(riderB('ef-vorpal', 'Natural 20 Confirmed Critical Hit Severs Target Head'));
      } else if (e.id === 'enh-plus-1-weapon-enhancement') {
        effs.push(statB('ef-wep-p1', ['atk.weapon', 'dmg.weapon'], 1, 'Enhancement'));
      } else if (e.id === 'enh-plus-1-armor-enhancement') {
        effs.push(statB('ef-arm-p1', ['ac.armor'], 1, 'Enhancement'));
      } else if (e.id === 'enh-deadly-precision') {
        effs.push(rollB('ef-dprec', 'Damage', 1, 'd6', 0, 'Precision'));
      } else if (e.id === 'enh-berserker') {
        effs.push(whenSitB('ef-berz', 'state', 'While Raging', [rollB('ef-berz-r', 'Damage', 1, 'd8', 0, 'Untyped')]));
      } else if (e.id === 'enh-charging') {
        effs.push(whenNamedB('ef-chg', 'charging', [rollB('ef-chg-r', 'Damage', 2, 'd6', 0, 'Untyped')]));
      } else if (e.id === 'enh-healing') {
        effs.push(resB('ef-enh-hl-res', 'Healing Activation', 1, 'perDay'), rollB('ef-enh-hl', 'Healing', 2, 'd8', 5, 'Positive'));
      } else if (e.id === 'enh-healing-greater-synergy') {
        effs.push(resB('ef-enh-ghl-res', 'Greater Healing Activation', 2, 'perDay'), rollB('ef-enh-ghl', 'Healing', 3, 'd8', 15, 'Positive'));
      } else if (e.id === 'enh-heartening') {
        effs.push(resB('ef-enh-hrt-res', 'Heartening Activation', 2, 'perDay'), rollB('ef-enh-hrt', 'Temp HP', 5, 'flat', 0, 'Positive'));
      } else if (e.id === 'enh-harmonizing') {
        effs.push(statB('ef-harm', ['skill.perform'], 2, 'Competence'));
      } else if (e.id === 'enh-sweeping') {
        effs.push(statB('ef-sweep', ['cmd.trip'], 2, 'Competence'));
      } else if (e.id === 'enh-disarming') {
        effs.push(statB('ef-disarm-enh', ['cmd.bullRushTripDisarmOverrun'], 2, 'Untyped', { condition: 'Disarm Attempts; Immune to Being Disarmed' }));
      } else if (e.id === 'enh-anchoring') {
        effs.push(statB('ef-anch', ['cmd.bullRushTripDisarmOverrun'], 5, 'Enhancement'));
      } else if (e.id === 'enh-anchoring-greater-synergy') {
        effs.push(statB('ef-ganch', ['cmd.bullRushTripDisarmOverrun'], 10, 'Enhancement'));
      } else if (e.id === 'enh-freedom') {
        effs.push(spellLinkB('ef-enh-fom', 'Freedom of Movement', 'Continuous Freedom of Movement while worn.'));
      } else if (e.id === 'enh-death-ward') {
        effs.push(resB('ef-enh-dw-r', 'Death Ward Ignore', 1, 'perDay'), defB('ef-enh-dw', 'Immunity', 'Death Effects / Negative Energy (1/day)', 0));
      } else if (e.id === 'enh-twilight') {
        effs.push(switchB('ef-enh-twi', 'reduceAsf10', 'Reduces Arcane Spell Failure Chance by 10%'));
      } else if (e.id === 'enh-nimbleness') {
        effs.push(switchB('ef-enh-nimb', 'nimblenessArmor', '+1 Max Dex Bonus and Reduces Armor Check Penalty by 2'));
      } else if (e.id === 'enh-easy-travel') {
        effs.push(switchB('ef-enh-et', 'mediumLoadAsLight', 'Carry Medium Load as if Light Load'));
      } else if (e.id === 'enh-manifester' || e.id === 'enh-manifester-weapon') {
        const pp = e.id.includes('weapon') ? 5 : 3;
        effs.push(resB(`${e.id}-pp`, 'Stored Power Points', pp, 'perDay'));
      } else if (e.id.startsWith('enh-soulbound')) {
        effs.push(resB(`${e.id}-ess`, 'Essentia Receptacle', e.id.includes('greater') ? 3 : 2, 'atWill'));
      } else if (e.id === 'enh-blessed') {
        effs.push({ id: 'ef-enh-bls', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'equipped', drBypassList: 'good', enhEquivalent: 0 });
      } else if (e.id === 'enh-transmuting') {
        effs.push({ id: 'ef-enh-trn', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'equipped', drBypassList: 'all', enhEquivalent: 0 });
      } else if (e.id === 'enh-metalline') {
        effs.push({ id: 'ef-enh-met', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'equipped', drBypassList: 'adamantine, silver, cold iron', enhEquivalent: 0 });
      } else {
        // Generic Enhancement parser for remaining active MIC/DMG enhancements
        const xDmg = d.match(/deals?\s+an\s+extra\s+(\d+)d(\d+)\s+points?\s+of\s+([a-z]+)?\s*damage/i);
        if (xDmg) {
          effs.push(rollB(`${e.id}-xd`, 'Damage', Number(xDmg[1]), `d${xDmg[2]}`, 0, xDmg[3] ? (xDmg[3][0].toUpperCase() + xDmg[3].slice(1)) : 'Untyped'));
        }
        const dayUses = d.match(/\b(once|twice|three\s+times|\d+\s+times)\s+per\s+day\b/i);
        if (dayUses) {
          const uLow = dayUses[1].toLowerCase();
          const n = uLow === 'once' ? 1 : (uLow === 'twice' ? 2 : (uLow.startsWith('three') ? 3 : (parseInt(uLow, 10) || 1)));
          effs.push(resB(`${e.id}-use`, `${e.name} Uses`, n, 'perDay'));
        }
        const saveDcM = d.match(/DC\s*(\d+)\s*(Fortitude|Reflex|Will)/i) || d.match(/(Fortitude|Reflex|Will)\s*DC\s*(\d+)/i);
        if (saveDcM) {
          const dc = /^\d+$/.test(saveDcM[1]) ? saveDcM[1] : saveDcM[2];
          const st = /^\d+$/.test(saveDcM[1]) ? saveDcM[2] : saveDcM[1];
          effs.push(riderB(`${e.id}-sv`, e.name, st, dc));
        }
        if (effs.length === 0) {
          effs.push(switchB(`${e.id}-sw`, e.id.replace(/^enh-/, ''), e.name, d.slice(0, 180)));
        }
      }
      e.effects = effs;
      patched++;
      continue;
    }

    // 4) DMG & MIC MagicItems + Specific Magic Armors/Shields/Weapons/Ammo
    if (e.type === 'MagicItem' || ((e.type === 'Armor' || e.type === 'Shield' || e.type === 'Weapon' || e.type === 'Ammo') && /^mi-|-mic-/.test(String(e.id || '')))) {
      const nm = String(e.name || '');
      const d = String(e.shortDescription || e.text || '');
      const rf = e.ruleFlags || {};
      const effs = [];

      // Skip pure Grup D narrative/container/furniture items unless they have ruleFlags
      const isNarrativeCurio = !Object.keys(rf).length && /^(Bag of Holding|Portable Hole|Handy Haversack|Efficient Quiver|Boat, Folding|Folding Boat|Sustaining Spoon|Decanter of Endless Water|Blessed Book|Apparatus of the Crab|Mirror of Life Trapping|Mirror of Mental Prowess|Cubic Gate|Deck of Illusions|Deck of Many Things|Iron Flask|Efreeti Bottle|Eversmoking Bottle|Feather Token|Stone Horse|Figurine of Wondrous Power|Sovereign Glue|Universal Solvent|Unguent of Timelessness|Dust of Dryness|Dust of Illusion|Dust of Tracelessness|Chime of Interruption|Brazier of|Bowl of|Censer of|Stone of Controlling|Golem Manual|Vacuous Grimoire|Flask of Curses|Robe of Useful Items|Robe of Bones|Cabinet of Feasting|Ring Gates|Instant Fortress|Lyre of Building|Mattock of the Titans|Maul of the Titans|Spade of Colossal Excavation)/i.test(nm);
      if (isNarrativeCurio) continue;

      // Inherent Manuals & Tomes (+1..+5)
      const tomeM = nm.match(/^(Manual of Gainful Exercise|Manual of Quickness of Action|Manual of Bodily Health|Tome of Clear Thought|Tome of Understanding|Tome of Leadership and Influence)\s*\+(\d+)$/i);
      if (tomeM) {
        const map = {
          'manual of gainful exercise': 'str',
          'manual of quickness of action': 'dex',
          'manual of bodily health': 'con',
          'tome of clear thought': 'int',
          'tome of understanding': 'wis',
          'tome of leadership and influence': 'cha'
        };
        effs.push(statB(`${e.id}-inh`, [map[tomeM[1].toLowerCase()]], Number(tomeM[2]), 'Inherent'));
        e.effects = effs;
        patched++;
        continue;
      }

      // Metamagic Rods
      const rodMetaM = nm.match(/^Rod of Metamagic,\s*([A-Za-z\s]+),\s*(Lesser|Normal|Greater)$/i) || nm.match(/^(Lesser|Greater)?\s*Metamagic Rod of\s*([A-Za-z\s]+)$/i);
      if (rodMetaM || /^mi-rod-of-metamagic-/i.test(e.id)) {
        const idLow = e.id.toLowerCase();
        const maxSp = idLow.includes('lesser') ? 3 : (idLow.includes('greater') ? 9 : 6);
        const tx = idLow.includes('empower') ? 'empower'
          : idLow.includes('maximize') ? 'maximize'
          : idLow.includes('quicken') ? 'quicken'
          : idLow.includes('extend') ? 'extend'
          : idLow.includes('enlarge') ? 'enlarge'
          : idLow.includes('silent') ? 'silent'
          : idLow.includes('still') ? 'still'
          : idLow.includes('widen') ? 'widen'
          : 'empower';
        effs.push(metaB(`${e.id}-rod`, 0, tx, e.name, { costMode: 'rod', uses: 3, maxSpellLvl: maxSp }));
        e.effects = effs;
        patched++;
        continue;
      }

      // Pearls of Power
      const pearlM = nm.match(/^Pearl of Power\s*\((1st|2nd|3rd|4th|5th|6th|7th|8th|9th|Two Spells)\)/i);
      if (pearlM) {
        const isTwo = /two/i.test(pearlM[1]);
        effs.push(
          resB(`${e.id}-res`, 'Pearl Recall', isTwo ? 2 : 1, 'perDay'),
          ruleB(`${e.id}-rec`, `Recall ${isTwo ? 'two prepared spells (up to 6th level)' : `one prepared ${pearlM[1]}-level spell`} cast today.`)
        );
        e.effects = effs;
        patched++;
        continue;
      }

      // Rings of Wizardry I..IV
      const wizM = nm.match(/^Ring of Wizardry\s+(I|II|III|IV)$/i);
      if (wizM) {
        const lvl = { I: 1, II: 2, III: 3, IV: 4 }[wizM[1].toUpperCase()] || 1;
        effs.push(switchB(`${e.id}-wiz`, `doubleArcaneSlotsLevel${lvl}`, `Doubles Base Arcane Spell Slots of Level ${lvl}`));
        e.effects = effs;
        patched++;
        continue;
      }

      // Rings of Energy Resistance & Immunity
      if (/^mi-ring-of-(?:universal-)?energy-(?:resistance|immunity)/i.test(e.id)) {
        const isUniv = e.id.includes('universal');
        const isImm = e.id.includes('immunity');
        if (!isUniv) e.choices = ENERGY_CHOICE_DEF;
        const val = e.id.includes('greater') ? 30 : (e.id.includes('major') ? 20 : 10);
        effs.push(isImm
          ? defB(`${e.id}-imm`, 'Immunity', isUniv ? 'All Energy' : '@Choice', 0)
          : defB(`${e.id}-res`, 'Energy Resistance', isUniv ? 'All (Acid, Cold, Electricity, Fire, Sonic)' : '@Choice', val)
        );
        e.effects = effs;
        patched++;
        continue;
      }

      // Staves (`Staff of ...`) & Psicrowns
      if (/^mi-staff-of-/i.test(e.id) || /^Staff of\s/i.test(nm)) {
        effs.push(resB(`${e.id}-chg`, 'Staff Charges', 50, 'charges'), ruleB(`${e.id}-sp`, d.slice(0, 200)));
        e.effects = effs;
        patched++;
        continue;
      }
      const psiCrownM = d.match(/This psicrown has (\d+) power points/i);
      if (psiCrownM) {
        effs.push(resB(`${e.id}-pp`, 'Psicrown Power Points', Number(psiCrownM[1]), 'charges'), ruleB(`${e.id}-pw`, d.slice(0, 200)));
        e.effects = effs;
        patched++;
        continue;
      }

      // Specific Iconic DMG Magic Items
      if (e.id === 'mi-periapt-of-proof-against-poison') effs.push(defB('ef-ppap', 'Immunity', 'Poison', 0));
      else if (e.id === 'mi-periapt-of-health') effs.push(defB('ef-poh', 'Immunity', 'Disease', 0));
      else if (e.id === 'mi-ring-of-evasion' || rf.evasion) effs.push(switchB(`${e.id}-ev`, 'evasion', 'Grants Evasion (No Damage on Successful Reflex Save)'));
      else if (e.id === 'mi-ring-of-force-shield') effs.push(statB('ef-rofs', ['ac.shield'], 2, 'Shield'));
      else if (e.id === 'mi-ring-of-ironskin') effs.push(defB('ef-rois', 'Damage Reduction', 'adamantine', 15));
      else if (e.id === 'mi-ring-of-rapid-healing') effs.push(defB('ef-rorh', 'Fast Healing', 'Fast Healing 3', 3));
      else if (e.id === 'mi-mantle-of-faith') effs.push(defB('ef-mof', 'Damage Reduction', 'evil', 5));
      else if (e.id === 'mi-phylactery-of-undead-turning' || e.id === 'mi-rod-of-restless-death') effs.push(statB(`${e.id}-trn`, ['turnLevel'], 4, 'Untyped'));
      else if (e.id === 'mi-wings-of-flying') effs.push(statB('ef-wof', ['speed.fly'], 60, 'Enhancement'));
      else if (e.id === 'mi-slippers-of-spider-climbing') effs.push(resB('ef-sosc-r', 'Spider Climb Minutes', 10, 'perDay'), statB('ef-sosc', ['speed.climb'], 20, 'Enhancement'));
      else if (e.id === 'mi-rod-of-invulnerability') effs.push(statB('ef-roi-na', ['ac.natural'], 5, 'Enhancement'), defB('ef-roi-dr', 'Damage Reduction', 'adamantine', 15), defB('ef-roi-sr', 'Spell Resistance', 'SR 32', 32));
      else if (e.id === 'mi-scarab-of-protection') effs.push(resB('ef-sop-c', 'Charges', 12, 'charges'), defB('ef-sop-sr', 'Spell Resistance', 'SR 20', 20), defB('ef-sop-imm', 'Immunity', 'Death Effects & Energy Drain', 0));
      else if (e.id === 'mi-belt-monks') effs.push(whenSitB('ef-mbelt', 'state', 'unarmoredNoShield', [statB('ef-mbelt-ac', ['ac.total'], '1 + max(0, @wisMod)', 'Untyped')]), switchB('ef-mbelt-ua', 'monkUnarmedPlus5Levels', 'Unarmed Damage & AC Treated as Monk +5 Levels'));
      else if (e.id === 'mi-circlet-of-blasting-minor') effs.push(resB('ef-cobm-r', 'Daily Blast', 1, 'perDay'), rollB('ef-cobm-d', 'Damage', 3, 'd8', 0, 'Light'));
      else if (e.id === 'mi-circlet-of-blasting-major') effs.push(resB('ef-cobj-r', 'Daily Blast', 1, 'perDay'), rollB('ef-cobj-d', 'Damage', 5, 'd8', 0, 'Light'));
      else if (e.id === 'mi-brooch-of-shielding') effs.push(resB('ef-bos-hp', 'Magic Missile Absorption', 101, 'charges'), defB('ef-bos-imm', 'Immunity', 'Magic Missile', 0));
      else if (e.id === 'mi-mithral-full-plate-of-speed') effs.push(resB('ef-mfpos-r', 'Haste Rounds', 10, 'perDay'), ruleB('ef-mfpos', 'Free action: grants Haste for up to 10 rounds per day.'));
      else if (e.id === 'mi-celestial-armor' || e.id === 'mi-winged-shield') effs.push(resB(`${e.id}-fly`, 'Fly', 1, 'perDay'), spellLinkB(`${e.id}-sp`, 'Fly', 'Fly once per day on command.'));
      else if (e.id === 'mi-rhino-hide') effs.push(whenNamedB('ef-rhino', 'charging', [rollB('ef-rhino-d', 'Damage', 2, 'd6', 0, 'Untyped')]));
      else if (e.id === 'mi-breastplate-of-command') effs.push(statB('ef-boc', ['skill.diplomacy', 'skill.intimidate'], 2, 'Competence'), ruleB('ef-boc-r', '+2 competence bonus on Charisma checks and Leadership score.'));
      else if (e.id === 'mi-demon-armor') effs.push(rollB('ef-dmn-c', 'Damage', 1, 'd10', 4, 'Slashing'), riderB('ef-dmn-ct', 'Claw attacks inflict Contagion (Fort DC 14 negates); non-evil wearer gains 1 negative level', 'Fortitude', '14'));
      else if (e.id === 'mi-plate-armor-of-the-deep') effs.push(switchB('ef-paotd', 'waterBreathingAndSwim', 'Breathe Underwater & Treated as Unarmored on Swim Checks'));

      // Generic MagicItem parser (MIC charges, ruleFlags, stat bonuses, DR, resistance, healing/damage dice, X/day)
      if (effs.length === 0) {
        if (rf.chargesPerDay) {
          effs.push(resB(`${e.id}-chg`, 'Daily Charges', Number(rf.chargesPerDay) || 3, 'perDay'));
        } else {
          const dayM = d.match(/\b(once|twice|three\s+times|four\s+times|five\s+times|\d+\s+times)\s+per\s+day\b/i);
          if (dayM) {
            const w = dayM[1].toLowerCase();
            const n = w === 'once' ? 1 : (w === 'twice' ? 2 : (w.startsWith('three') ? 3 : (w.startsWith('four') ? 4 : (w.startsWith('five') ? 5 : (parseInt(w, 10) || 1)))));
            effs.push(resB(`${e.id}-day`, `${e.name} Uses`, n, 'perDay'));
          }
        }
        // Parse explicit stat bonuses in text
        const statBonusM = d.match(/\+(\d+)\s+(enhancement|competence|resistance|deflection|natural\s+armor|morale|luck|insight|sacred|profane|alchemical|circumstance|armor|shield)?\s*bonus\s+(?:to|on)\s+([a-z\s,()]+?)(?:\s+checks|\s+saves|\s+rolls|[.;,])/i);
        if (statBonusM) {
          const val = Number(statBonusM[1]);
          const bt = canonBonusType(statBonusM[2] || 'Untyped', val);
          const what = statBonusM[3].trim().toLowerCase();
          if (what === 'ac' || what === 'armor class') effs.push(statB(`${e.id}-st`, ['ac.total'], val, bt));
          else if (what.includes('saving throw') || what === 'all saves') effs.push(statB(`${e.id}-st`, ['save.all'], val, bt));
          else if (what.includes('fortitude')) effs.push(statB(`${e.id}-st`, ['save.fort'], val, bt));
          else if (what.includes('reflex')) effs.push(statB(`${e.id}-st`, ['save.ref'], val, bt));
          else if (what.includes('will')) effs.push(statB(`${e.id}-st`, ['save.will'], val, bt));
          else if (what.includes('initiative')) effs.push(statB(`${e.id}-st`, ['initiative'], val, bt));
          else if (SKILL_NAME_TO_SLUG[what]) effs.push(statB(`${e.id}-st`, [`skill.${SKILL_NAME_TO_SLUG[what]}`], val, bt));
        }
        const drM = d.match(/damage\s+reduction\s+(\d+)\/([a-z\-]+)/i);
        if (drM) effs.push(defB(`${e.id}-dr`, 'Damage Reduction', drM[2], Number(drM[1])));
        const srM = d.match(/spell\s+resistance\s+(\d+)/i);
        if (srM) effs.push(defB(`${e.id}-sr`, 'Spell Resistance', `SR ${srM[1]}`, Number(srM[1])));
        const resM = d.match(/resistance\s+(?:to\s+)?(acid|cold|electricity|fire|sonic)\s+(\d+)/i) || d.match(/(acid|cold|electricity|fire|sonic)\s+resistance\s+(\d+)/i);
        if (resM) effs.push(defB(`${e.id}-er`, 'Energy Resistance', resM[1][0].toUpperCase() + resM[1].slice(1).toLowerCase(), Number(resM[2])));
        const immM = d.match(/immune\s+to\s+(poison|disease|fear|sleep|paralysis|mind-affecting|blindness|dazzled|exhaustion|fatigue|petrification|energy\s+drain|death\s+effects)/i);
        if (immM) effs.push(defB(`${e.id}-im`, 'Immunity', immM[1], 0));
        const healDiceM = d.match(/(?:heals?|restores?|cures?)\s+(?:you\s+of\s+)?(\d+)d(\d+)(?:\s*\+\s*(\d+))?\s*(?:points?\s+of\s+damage|hit\s+points|hp)/i);
        if (healDiceM) effs.push(rollB(`${e.id}-hl`, 'Healing', Number(healDiceM[1]), `d${healDiceM[2]}`, Number(healDiceM[3] || 0), 'Positive'));
        const dmgDiceM = !healDiceM && d.match(/deals?\s+(?:an\s+extra\s+)?(\d+)d(\d+)(?:\s*\+\s*(\d+))?\s*(?:points?\s+of\s+)?(acid|cold|electricity|fire|sonic|force|negative|positive|untyped)?\s*damage/i);
        if (dmgDiceM) effs.push(rollB(`${e.id}-dm`, 'Damage', Number(dmgDiceM[1]), `d${dmgDiceM[2]}`, Number(dmgDiceM[3] || 0), dmgDiceM[4] ? (dmgDiceM[4][0].toUpperCase() + dmgDiceM[4].slice(1)) : 'Untyped'));

        // If item had mechanical ruleFlags or charges/uses or explicit active activation ("When you activate", "On command", "continually grants"), emit a clean rule/switch block so it's visible in Rule Crafter
        if (effs.length > 0 && effs.every(b => b.type === 'resource')) {
          effs.push(ruleB(`${e.id}-act`, d.slice(0, 180)));
        } else if (effs.length === 0 && (Object.keys(rf).length > 0 || /\b(when you activate|activating this|on command|while wearing|while wielding|continually|grants? you|you gain)\b/i.test(d))) {
          effs.push(ruleB(`${e.id}-act`, d.slice(0, 180)));
        }
      }

      if (effs.length > 0) {
        e.effects = effs;
        patched++;
      }
    }
  }
  return patched;
}

// ----------------------------------------------------------------------------
// 4. ClassAbilities & RacialTraits (`srd_classes_races.json`)
// ----------------------------------------------------------------------------
function compileClassAbilitiesAndRacialTraits(crData) {
  let count = 0;
  // Meta/container class features that stay Grup D (`effects: []`)
  const META_CAB_IDS = new Set([
    'cab-bonus-feat-rogue', 'cab-bonus-feat-monk', 'cab-bonus-feat-psion',
    'cab-bonus-feat-fighter', 'cab-bonus-feat-psychic-warrior', 'cab-bonus-feat-wizard',
    'cab-scribe-scroll', 'cab-summon-familiar', 'cab-animal-companion', 'cab-special-mount',
    'cab-rogue-special-ability', 'cab-high-arcana', 'cab-empty-body',
    'cab-speak-with-master', 'cab-speak-with-animals-of-its-kind', 'cab-empathic-link', 'cab-telepathic-link'
  ]);

  const CAB_RAB_PATCHES = {
    'cab-resist-natures-lure': [whenSitB('ef-rnl', 'situational', 'vs. Fey Spell-Like Abilities', [statB('ef-rnl-sv', ['save.all'], 4, 'Untyped')])],
    'cab-opportunist': [resB('ef-opp-r', 'Opportunist AoO', 1, 'perRound'), switchB('ef-opp', 'opportunistAoO', '1/Round Make AoO Against Foe Just Struck for Melee Damage by Another')],
    'cab-enhance-arrow': [statB('ef-enh-arr', ['atk.ranged', 'dmg.ranged'], '1 + floor((@level - 1) / 2)', 'Enhancement')],
    'cab-weapon-focus-mind-blade': [whenNamedB('ef-wf-mb', 'wieldingChosenWeapon', [statB('ef-wf-mb-a', ['atk.weapon'], 1, 'Untyped')])],
    'cab-greater-weapon-focus-mind-blade': [whenNamedB('ef-gwf-mb', 'wieldingChosenWeapon', [statB('ef-gwf-mb-a', ['atk.weapon'], 1, 'Untyped')])],
    'cab-impromptu-sneak-attack': [resB('ef-isa-r', 'Impromptu Sneak Attack', 'max(1, floor((@level + 1) / 4))', 'perDay'), switchB('ef-isa', 'impromptuSneakAttack', 'Declare Attack to Be a Sneak Attack (Target Loses Dex to AC)')],
    'cab-endurance': [whenSitB('ef-cab-end', 'situational', 'vs. Nonlethal Swim, Forced March, Starvation, Thirst, Hot/Cold', [statB('ef-cab-end-s', ['save.fort'], 4, 'Untyped')])],
    'cab-favored-enemy-no-enemy-set-plus-2': [whenSitB('ef-fe', 'situational', 'vs. Favored Enemy', [statB('ef-fe-d', ['dmg.all', 'skill.bluff', 'skill.listen', 'skill.sense-motive', 'skill.spot', 'skill.survival'], 2, 'Untyped')])],
    'cab-arcane-fire': [rollB('ef-arcf', 'Damage', 1, 'd6', 0, 'Arcane Energy', { scaling: 'formula', dice: '(@spellLevel)d6 + @level * 1d6' })],
    'cab-save-bonus-against-poison': [whenSitB('ef-asn-psn', 'situational', 'vs. Poison', [statB('ef-asn-psn-s', ['save.fort'], 'floor(@level / 2)', 'Untyped')])],
    'cab-ki-strike': [{ id: 'ef-kistrike', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'unarmed', drBypassList: 'magic, lawful, adamantine', enhEquivalent: 0 }],
    'cab-surging-euphoria': [whenSitB('ef-seuph', 'state', 'After Wild Surge', [statB('ef-seuph-b', ['atk.all', 'dmg.all', 'save.all'], '1 + floor((@level - 4) / 8)', 'Morale')])],
    'cab-elude-touch': [statB('ef-elude', ['ac.touch'], 'max(0, @chaMod)', 'Untyped')],
    'cab-smite-good': [resB('ef-smg-r', 'Smite Good', 1, 'perDay'), whenSitB('ef-smg-w', 'situational', 'Smite Good Attack', [statB('ef-smg-a', ['atk.melee'], 'max(0, @chaMod)', 'Untyped'), statB('ef-smg-d', ['dmg.melee'], '@level', 'Untyped')])],
    'cab-aura-of-despair': [switchB('ef-aod', 'enemiesWithin10FtMinus2Saves', 'Enemies Within 10 ft. Take -2 Penalty on All Saving Throws')],
    'cab-multiattack': [switchB('ef-cab-matk', 'multiattackMinus2', 'Secondary Natural Attacks Take Only -2 Penalty (Instead of -5)')],
    'cab-spell-power': [statB('ef-sppow', ['casterLevel'], 1, 'Untyped')],
    'cab-indomitable-will': [whenSitB('ef-indw', 'situational', 'While Raging vs. Enchantment Spells', [statB('ef-indw-w', ['save.will'], 4, 'Untyped')])],
    'cab-devotion': [whenSitB('ef-devot', 'situational', 'vs. Enchantment Spells & Effects', [statB('ef-devot-w', ['save.will'], 4, 'Morale')])],
    'cab-defensive-stance': [whenSitB('ef-defst', 'state', 'In Defensive Stance', [statB('ef-defst-str', ['str'], 2, 'Untyped'), statB('ef-defst-con', ['con'], 4, 'Untyped'), statB('ef-defst-sv', ['save.all'], 2, 'Resistance'), statB('ef-defst-ac', ['ac.dodge'], 4, 'Dodge')])],
    'cab-perfect-self': [defB('ef-pself', 'Damage Reduction', 'magic', 10)],
    'cab-crippling-strike': [rollB('ef-crip', 'Ability Damage', 2, 'flat', 0, 'STR Damage')],
    'cab-defensive-roll': [resB('ef-droll-r', 'Defensive Roll', 1, 'perDay'), switchB('ef-droll', 'reflexSaveForHalfLethalBlow', '1/Day Reflex Save (DC = Damage Dealt) to Take Half Damage From Lethal Blow')],
    'cab-wild-surge': [switchB('ef-wsurge', 'wildSurgeManifesterBoost', 'Boost Effective Manifester Level by +1 to +6 During Manifestation (Risk Psychic Enervation)')],

    // RacialTraits (`rab-*`)
    'rab-stonecunning': [statB('ef-rab-stc', ['skill.search'], 2, 'Racial', { condition: 'Unusual Stonework' })],
    'rab-illusionist': [
      whenSitB('ef-rab-ill-sv', 'situational', 'vs. Illusions', [statB('ef-rab-ill-s', ['save.all'], 2, 'Racial')]),
      statB('ef-rab-ill-dc', ['spell.dc'], 1, 'Racial', { condition: 'Illusion Spells' })
    ],
    'rab-svirfneblin-illusionist': [statB('ef-rab-svill', ['spell.dc'], 1, 'Racial', { condition: 'Illusion Spells' })],
    'rab-nondetection': [spellLinkB('ef-rab-nd', 'Nondetection', 'Continuous Nondetection (CL = Character Level).')],
    'rab-outburst': [resB('ef-rab-out-r', 'Outburst', 1, 'perDay'), whenSitB('ef-rab-out', 'state', 'Outburst Active (Up to 4 Rounds)', [statB('ef-rab-out-s', ['str'], 2, 'Untyped'), statB('ef-rab-out-i', ['int', 'wis'], -2, 'Penalty')])],
    'rab-keen-eye': [statB('ef-rab-ke', ['atk.ranged'], 1, 'Racial', { condition: 'Thrown Weapons and Slings' })],
    'rab-gnomish-alchemist': [statB('ef-rab-ga', ['skill.craft'], 2, 'Racial', { condition: 'Craft (Alchemy)' })],
    'rab-blood-drain': [rollB('ef-rab-bd', 'Ability Drain', 1, 'd4', 0, 'CON Drain')],
    'rab-light-sensitivity': [whenSitB('ef-rab-ls', 'state', 'In Bright Sunlight / Daylight', [statB('ef-rab-ls-a', ['atk.all', 'skill.spot', 'skill.search'], -1, 'Penalty')])],
    'rab-light-blindness': [switchB('ef-rab-lb', 'blinded1RoundBrightLight', 'Blinded 1 Round on Abrupt Bright Light Exposure; Dazzled Thereafter')],
    'rab-smite-good': [resB('ef-rab-smg-r', 'Smite Good', 1, 'perDay'), whenSitB('ef-rab-smg', 'situational', 'Smite Good Melee Attack', [statB('ef-rab-smg-d', ['dmg.melee'], 'min(20, @level)', 'Untyped')])],
    'rab-smite-evil': [resB('ef-rab-sme-r', 'Smite Evil', 1, 'perDay'), whenSitB('ef-rab-sme', 'situational', 'Smite Evil Melee Attack', [statB('ef-rab-sme-d', ['dmg.melee'], 'min(20, @level)', 'Untyped')])],
    'rab-scent': [defB('ef-rab-scent', 'Sense', 'Scent 30 ft.', 30)],
    'rab-small-hunter-forest-gnome': [whenSitB('ef-rab-shfg', 'situational', 'vs. Kobolds, Goblinoids, Orcs, Reptilian Humanoids', [statB('ef-rab-shfg-a', ['atk.all'], 1, 'Racial')])],
    'rab-small-hunter': [whenSitB('ef-rab-sh', 'situational', 'vs. Kobolds and Goblinoids', [statB('ef-rab-sh-a', ['atk.all'], 1, 'Racial')])],
    'rab-goblinslayer': [whenSitB('ef-rab-gs', 'situational', 'vs. Orcs and Goblinoids', [statB('ef-rab-gs-a', ['atk.all'], 1, 'Racial')])],
    'rab-elven-blood': [defB('ef-rab-eb-im', 'Immunity', 'Magic Sleep Effects', 0), whenSitB('ef-rab-eb-w', 'situational', 'vs. Enchantment Spells & Effects', [statB('ef-rab-eb-s', ['save.all'], 2, 'Racial')])],
    'rab-stability': [statB('ef-rab-stab', ['cmd.stability'], 4, 'Racial')],
    'rab-stand-against-giants': [whenSitB('ef-rab-sag', 'situational', 'vs. Giants', [statB('ef-rab-sag-ac', ['ac.dodge'], 4, 'Dodge')])],
    'rab-fearless': [whenSitB('ef-rab-fl', 'situational', 'vs. Fear', [statB('ef-rab-fl-s', ['save.all'], 2, 'Morale')])],
    'rab-burst': [resB('ef-rab-br-r', 'Burst', 3, 'perDay'), whenSitB('ef-rab-br', 'state', 'Burst Active (3 Rounds)', [statB('ef-rab-br-sp', ['speed.land'], '10 + floor(@level / 4) * 10', 'Competence')])],
    'rab-innate-resistance': [whenSitB('ef-rab-ir', 'situational', 'vs. Powers, Spells, and Spell-Like Effects', [statB('ef-rab-ir-s', ['save.all'], 1, 'Racial')])],
    'rab-horrific-appearance': [rollB('ef-rab-ha', 'Ability Damage', 1, 'd4', 0, 'STR/DEX/CON Damage')],
    'rab-paralyzing-touch': [riderB('ef-rab-pt', 'Touch Attack: Permanent Paralysis', 'Fortitude', '')],
    'rab-fear-aura': [riderB('ef-rab-fa', '60-ft. Aura (< 5 HD): Fear', 'Will', '')],
    'rab-frighful-moan': [riderB('ef-rab-fm', '30-ft. Spread: Panicked for 2d4 Rounds', 'Will', '')]
  };

  for (const e of crData) {
    if (!e || (Array.isArray(e.effects) && e.effects.length > 0)) continue;
    if (e.type !== 'ClassAbility' && e.type !== 'RacialTrait') continue;
    if (META_CAB_IDS.has(e.id)) continue;
    if (CAB_RAB_PATCHES[e.id]) {
      e.effects = CAB_RAB_PATCHES[e.id];
      count++;
      continue;
    }
    const d = String(e.shortDescription || e.text || '');
    if (d) {
      e.effects = [switchB(`${e.id}-sw`, e.id.replace(/^(?:cab|rab)-/, ''), e.name, d.slice(0, 180))];
      count++;
    }
  }
  return count;
}

// ----------------------------------------------------------------------------
// 5. Feats (Core, Splat, Legacy) & Skill Tricks
// ----------------------------------------------------------------------------
function isGrupDNarrativeFeat(e) {
  const cat = String(e.category || '').toLowerCase();
  const nm = String(e.name || '');
  const d = String(e.benefit || e.shortDescription || e.text || '');
  if (cat.includes('item creation')) return true;
  if (/^(Craft\s|Forge\s|Brew\sPotion|Scribe\sScroll|Scribe\sEpic|Scribe\sTattoo|Imprint\sStone|Inscribe\sRune|Attune\sGem|Sanctify\sRelic)/i.test(nm)) return true;
  if (/^(Leadership|Epic Leadership|Legendary Commander|Undead Leadership|Dragon Cohort|Dragon Steed|Wild Cohort|Improved Familiar|Celestial Familiar|DraconicCohort|Magical Beast Companion|Exalted Companion|Vermin Companion|Obtain Familiar|Bonded Familiar)$/i.test(nm)) return true;
  // Pure Wild Shape form list unlocks / spellbook / language / age feats with zero stat/combat block
  if (/^(Extended Life Span|Polyglot|Spell Mastery|Expanded Knowledge|Epic Expanded Knowledge|Power Knowledge|Bonus Domain|Spontaneous Domain Access|Extra Slot|Extra Spell)$/i.test(nm) && !/\+\d+/.test(d)) return true;
  return false;
}

function detectMetamagicTransform(nm, d) {
  const low = `${nm} ${d}`.toLowerCase();
  if (low.includes('empower')) return 'empower';
  if (low.includes('maximize')) return 'maximize';
  if (low.includes('quicken')) return 'quicken';
  if (low.includes('persistent')) return 'persistent';
  if (low.includes('extend')) return 'extend';
  if (low.includes('enlarge') || low.includes('reach spell')) return 'enlarge';
  if (low.includes('widen')) return 'widen';
  if (low.includes('twin')) return 'twin';
  if (low.includes('split') && low.includes('ray')) return 'splitRay';
  if (low.includes('chain')) return 'chain';
  if (low.includes('heighten')) return 'heighten';
  if (low.includes('substitution')) return 'energySub';
  if (low.includes('searing') || low.includes('piercing')) return 'pierceRes';
  if (low.includes('silent') || low.includes('verbal')) return 'silent';
  if (low.includes('still') || low.includes('somatic')) return 'still';
  return 'empower';
}

function parseSlotAdjustment(d, rf) {
  if (rf && rf.metamagicLevelMod !== undefined) return Number(rf.metamagicLevelMod) || 0;
  const wordNum = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
  const m = d.match(/spell\s+slot\s+(one|two|three|four|five|six|\d+)\s+levels?\s+higher/i)
    || d.match(/uses?\s+(?:up\s+)?a\s+(?:spell\s+)?slot\s+(one|two|three|four|five|six|\d+)\s+levels?\s+higher/i)
    || d.match(/\+(\d+)\s+spell\s+level/i);
  if (m) {
    const raw = m[1].toLowerCase();
    return wordNum[raw] !== undefined ? wordNum[raw] : (parseInt(raw, 10) || 1);
  }
  if (/same\s+level|zero\s+levels?\s+higher|\+0\s+slot|does\s+not\s+use\s+up\s+a\s+higher/i.test(d)) return 0;
  return 1;
}

function compileFeatList(featArr) {
  let count = 0;
  for (const e of featArr) {
    if (!e) continue;
    if (EXPLICIT_PATCHES[e.id]) {
      const p = EXPLICIT_PATCHES[e.id];
      if (p.choices) e.choices = p.choices;
      e.effects = JSON.parse(JSON.stringify(p.effects));
      count++;
      continue;
    }
    if (Array.isArray(e.effects) && e.effects.length > 0) continue;

    // Remaining Skill Tricks (`type === 'Skill Trick'`)
    if (e.type === 'Skill Trick') {
      e.effects = [
        resB(`${e.id}-res`, 'Skill Trick', 1, 'perEncounter'),
        switchB(`${e.id}-sw`, e.id.replace(/^trick-/, ''), e.name, e.shortDescription || e.benefit || e.text || e.name)
      ];
      count++;
      continue;
    }

    if (e.type !== 'Feat') continue;
    if (isGrupDNarrativeFeat(e)) continue;

    const nm = String(e.name || '');
    const cat = String(e.category || '');
    const d = String(e.benefit || e.shortDescription || e.text || '').replace(/\s+/g, ' ').trim();
    const rf = e.ruleFlags || {};
    const effs = [];

    // 1) Metamagic & Sudden Metamagic & Automatic Metamagic & Metapsionic
    const isSuddenMeta = /^Sudden\s+(Empower|Enlarge|Extend|Maximize|Quicken|Silent|Still|Widen)/i.test(nm);
    const isAutoMeta = /^Automatic\s+(Quicken|Silent|Still)\s+(Spell|Power)/i.test(nm);
    const isMetaCat = /metamagic/i.test(cat) || rf.metamagicLevelMod !== undefined || /\bSpell\b$/.test(nm) && /spell\s+slot\s+(?:one|two|three|four|five|six|\d+)\s+levels?\s+higher|metamagic/i.test(d);
    const isMetapsi = /\bPower\b$/.test(nm) && /expend\s+your\s+psionic\s+focus.*power\s+points/i.test(d);

    if (isSuddenMeta) {
      effs.push(metaB(`${e.id}-sud`, 0, detectMetamagicTransform(nm, d), nm, { costMode: 'sudden', uses: 1 }));
      e.effects = effs;
      count++;
      continue;
    }
    if (isAutoMeta) {
      effs.push(metaB(`${e.id}-auto`, 0, detectMetamagicTransform(nm, d), nm, { costMode: 'passive' }));
      e.effects = effs;
      count++;
      continue;
    }
    if (isMetaCat) {
      const slotAdj = parseSlotAdjustment(d, rf);
      effs.push(metaB(`${e.id}-mm`, slotAdj, detectMetamagicTransform(nm, d), nm, { costMode: 'slot' }));
      e.effects = effs;
      count++;
      continue;
    }
    if (isMetapsi) {
      effs.push(metaB(`${e.id}-mp`, 0, detectMetamagicTransform(nm, d), `${nm} (Expend Psionic Focus)`, { costMode: 'passive' }));
      e.effects = effs;
      count++;
      continue;
    }

    // 2) Great Ability Feats (`Great Strength`, etc.)
    const grtAbM = nm.match(/^Great\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)$/i);
    if (grtAbM) {
      const abKey = grtAbM[1].slice(0, 3).toLowerCase();
      effs.push(statB(`${e.id}-ab`, [abKey], 1, 'Untyped'));
      e.effects = effs;
      count++;
      continue;
    }

    // 3) Parse Skill Bonuses (`+2 bonus on <Skill> and <Skill> checks`, `+X [type] bonus on <Skill> checks`)
    const skillPairM = d.match(/\+(\d+)\s+(competence|racial|insight|sacred|profane|morale|luck|circumstance|untyped)?\s*bonus\s+on\s+(?:all\s+)?([A-Za-z\s()]+?)\s+and\s+([A-Za-z\s()]+?)\s+checks/i);
    if (skillPairM) {
      const val = Number(skillPairM[1]);
      const bt = canonBonusType(skillPairM[2], val);
      const s1 = SKILL_NAME_TO_SLUG[skillPairM[3].trim().toLowerCase()];
      const s2 = SKILL_NAME_TO_SLUG[skillPairM[4].trim().toLowerCase()];
      const tgs = [s1 && `skill.${s1}`, s2 && `skill.${s2}`].filter(Boolean);
      if (tgs.length > 0) effs.push(statB(`${e.id}-sk2`, tgs, val, bt));
    } else {
      const skillSingleM = d.match(/\+(\d+)\s+(competence|racial|insight|sacred|profane|morale|luck|circumstance|untyped)?\s*bonus\s+on\s+(?:all\s+)?([A-Za-z\s]+?)\s+checks/i);
      if (skillSingleM) {
        const val = Number(skillSingleM[1]);
        const bt = canonBonusType(skillSingleM[2], val);
        const s1 = SKILL_NAME_TO_SLUG[skillSingleM[3].trim().toLowerCase()];
        if (s1) effs.push(statB(`${e.id}-sk1`, [`skill.${s1}`], val, bt));
      }
    }

    // 4) Parse Save Bonuses
    const saveM = d.match(/\+(\d+)\s+(morale|resistance|insight|sacred|profane|luck|competence|racial)?\s*bonus\s+on\s+(Fortitude|Reflex|Will|all)?\s*saving\s+throws(?:\s+against\s+([^.;]+))?/i);
    if (saveM) {
      const val = Number(saveM[1]);
      const bt = canonBonusType(saveM[2], val);
      const svWhich = (saveM[3] || 'all').toLowerCase();
      const svTarget = svWhich.startsWith('fort') ? 'save.fort' : (svWhich.startsWith('ref') ? 'save.ref' : (svWhich.startsWith('will') ? 'save.will' : 'save.all'));
      if (saveM[4]) {
        effs.push(whenSitB(`${e.id}-svw`, 'situational', `vs. ${saveM[4].trim().slice(0, 60)}`, [statB(`${e.id}-sv`, [svTarget], val, bt)]));
      } else {
        effs.push(statB(`${e.id}-sv`, [svTarget], val, bt));
      }
    }

    // 5) Parse AC, Initiative, Speed, Caster Level, Spell Penetration, Spell DC, Attack/Damage, DR, Resistance, Extra Dice
    const acM = d.match(/\+(\d+)\s+(dodge|natural\s+armor|deflection|insight|sacred|profane|luck|shield|armor)\s+bonus\s+to\s+(?:your\s+)?(?:Armor\s+Class|AC)(?:\s+(?:against|when|while)\s+([^.;]+))?/i);
    if (acM) {
      const val = Number(acM[1]);
      const bt = canonBonusType(acM[2], val);
      const acKey = bt === 'Dodge' ? 'ac.dodge' : (bt === 'Natural Armor' ? 'ac.natural' : (bt === 'Deflection' ? 'ac.deflection' : (bt === 'Shield' ? 'ac.shield' : 'ac.total')));
      if (acM[3]) effs.push(whenSitB(`${e.id}-acw`, 'situational', acM[3].trim().slice(0, 60), [statB(`${e.id}-ac`, [acKey], val, bt)]));
      else effs.push(statB(`${e.id}-ac`, [acKey], val, bt));
    }

    const initM = d.match(/\+(\d+)\s+([a-z]+)?\s*bonus\s+on\s+initiative\s+checks/i);
    if (initM) effs.push(statB(`${e.id}-init`, ['initiative'], Number(initM[1]), canonBonusType(initM[2], 1)));

    const clM = d.match(/\+(\d+)\s+bonus\s+to\s+(?:your\s+)?caster\s+level/i) || d.match(/caster\s+level\s+increases?\s+by\s+(\d+)/i);
    if (clM) effs.push(statB(`${e.id}-cl`, ['casterLevel'], Number(clM[1]), 'Untyped'));

    const spPenM = d.match(/\+(\d+)\s+bonus\s+on\s+caster\s+level\s+checks\s+to\s+overcome\s+spell\s+resistance/i);
    if (spPenM) effs.push(statB(`${e.id}-srp`, ['caster.spellPenetration'], Number(spPenM[1]), 'Untyped'));

    const dcM = d.match(/Add\s+\+(\d+)\s+to\s+the\s+(?:Difficulty\s+Class|DC)/i);
    if (dcM && effs.length === 0) effs.push(statB(`${e.id}-dc`, ['spell.dc'], Number(dcM[1]), 'Untyped'));

    const drM = d.match(/damage\s+reduction\s+(\d+)\/([a-z\-]+)/i);
    if (drM) effs.push(defB(`${e.id}-dr`, 'Damage Reduction', drM[2], Number(drM[1])));

    const xDiceM = d.match(/(?:extra|additional)\s+(\d+)d(\d+)\s+(?:points?\s+of\s+)?([a-z]+)?\s*damage/i);
    if (xDiceM) {
      effs.push(rollB(`${e.id}-xd`, 'Damage', Number(xDiceM[1]), `d${xDiceM[2]}`, 0, xDiceM[3] ? (xDiceM[3][0].toUpperCase() + xDiceM[3].slice(1)) : 'Untyped'));
    }

    // Resource pools (Turn/Rebuke Undead, Rage, Wild Shape, Bardic Music, X/day)
    if (/spend\s+(?:one\s+of\s+your\s+|a\s+)?turn\s+(?:or\s+rebuke\s+)?undead/i.test(d)) {
      effs.unshift(resB(`${e.id}-tu`, 'Turn Undead Attempt', 1, 'perDay'));
    } else if (/expend\s+your\s+psionic\s+focus/i.test(d)) {
      effs.unshift(whenSitB(`${e.id}-pf`, 'state', 'Expending Psionic Focus', [ruleB(`${e.id}-pfr`, d.slice(0, 160))]));
    } else {
      const dayM = d.match(/\b(once|twice|three\s+times|\d+\s+times)\s+per\s+day\b/i);
      if (dayM) {
        const w = dayM[1].toLowerCase();
        const n = w === 'once' ? 1 : (w === 'twice' ? 2 : (w.startsWith('three') ? 3 : (parseInt(w, 10) || 1)));
        effs.unshift(resB(`${e.id}-day`, `${nm} Uses`, n, 'perDay'));
      }
    }

    // Tactical / Combat / Fighter / Reserve / Devotion / Psionic / Wild / Divine Rule Switch when no pure numeric stat covered the full mechanic
    if (effs.length === 0 && d.length > 0) {
      effs.push(switchB(`${e.id}-sw`, e.id.replace(/^feat-/, ''), nm, d.slice(0, 180)));
    } else if (effs.length === 1 && effs[0].type === 'resource') {
      effs.push(switchB(`${e.id}-sw`, e.id.replace(/^feat-/, ''), nm, d.slice(0, 180)));
    }

    if (effs.length > 0) {
      e.effects = effs;
      count++;
    }
  }
  return count;
}

// ----------------------------------------------------------------------------
// 6. Core XPH Powers (`srd_powers.json`) & Remaining Mechanical Spells
// ----------------------------------------------------------------------------
function compilePowers(pwrData) {
  let count = 0;
  const POWER_EXPLICIT = {
    'pwr-animal-affinity': { choices: ABILITY_CHOICE_DEF, effects: [statB('ef-pw-aa', ['choice.ability.1'], 4, 'Enhancement')] },
    'pwr-biofeedback': { effects: [defB('ef-pw-bio', 'Damage Reduction', '-', 2)] },
    'pwr-inertial-barrier': { effects: [defB('ef-pw-ib', 'Damage Reduction', '-', 5)] },
    'pwr-immovability': { effects: [defB('ef-pw-immv', 'Damage Reduction', '-', 15), statB('ef-pw-immv-c', ['cmd.stability'], 20, 'Untyped')] },
    'pwr-body-adjustment': { effects: [rollB('ef-pw-ba', 'Healing', 1, 'd12', 0, 'Positive')] },
    'pwr-body-purification': { effects: [rollB('ef-pw-bp', 'Healing', 2, 'flat', 0, 'Ability Damage Restored')] },
    'pwr-psionic-repair-damage': { effects: [rollB('ef-pw-prd', 'Healing', 3, 'd8', 0, 'Construct Repair', { scaling: 'perCL', amount: 1, per: 1, max: 20 })] },
    'pwr-true-metabolism': { effects: [defB('ef-pw-tm', 'Regeneration', 'Regeneration 10', 10)] },
    'pwr-burst': { effects: [statB('ef-pw-brst', ['speed.land'], 10, 'Enhancement')] },
    'pwr-fly-psionic': { effects: [statB('ef-pw-fly', ['speed.fly'], 60, 'Untyped')] },
    'pwr-overland-flight-psionic': { effects: [statB('ef-pw-ofly', ['speed.fly'], 40, 'Untyped')] },
    'pwr-chameleon': { effects: [statB('ef-pw-cham', ['skill.hide'], 10, 'Enhancement')] },
    'pwr-call-to-mind': { effects: [statB('ef-pw-ctm', ['skill.knowledge'], 4, 'Competence')] },
    'pwr-danger-sense': { effects: [whenSitB('ef-pw-ds', 'situational', 'vs. Traps', [statB('ef-pw-ds-r', ['save.ref', 'ac.insight'], 4, 'Insight')])] },
    'pwr-darkvision-psionic': { effects: [defB('ef-pw-dv', 'Sense', 'Darkvision 60 ft.', 60)] },
    'pwr-psionic-scent': { effects: [defB('ef-pw-sc', 'Sense', 'Scent 30 ft.', 30)] },
    'pwr-elfsight': { effects: [defB('ef-pw-es-v', 'Sense', 'Low-Light Vision', 0), statB('ef-pw-es-s', ['skill.search', 'skill.spot'], 2, 'Untyped')] },
    'pwr-steadfast-perception': { effects: [defB('ef-pw-sp-i', 'Immunity', 'Figments & Glamers', 0), statB('ef-pw-sp-s', ['skill.search', 'skill.spot'], 6, 'Enhancement')] },
    'pwr-empty-mind': { effects: [statB('ef-pw-em', ['save.will'], 2, 'Untyped')] },
    'pwr-mental-barrier': { effects: [statB('ef-pw-mb', ['ac.deflection'], 4, 'Deflection')] },
    'pwr-grip-of-iron': { effects: [statB('ef-pw-goi', ['grapple'], 4, 'Enhancement')] },
    'pwr-prescience-offensive': { effects: [statB('ef-pw-po', ['dmg.all'], 2, 'Insight')] },
    'pwr-precognition': { effects: [statB('ef-pw-pc', ['atk.all'], 2, 'Insight', { condition: 'Single Roll Chosen Before Result' })] },
    'pwr-precognition-greater': { effects: [statB('ef-pw-gpc', ['atk.all'], 4, 'Insight', { condition: 'Single Roll Chosen Before Result' })] },
    'pwr-power-resistance': { effects: [defB('ef-pw-pr', 'Spell Resistance', '12 + @cl', 12)] },
    'pwr-thought-shield': { effects: [defB('ef-pw-ts', 'Spell Resistance', 'PR 13 vs. Mind-Affecting', 13)] },
    'pwr-tower-of-iron-will': { effects: [defB('ef-pw-toiw', 'Spell Resistance', 'PR 19 vs. Mind-Affecting (10-ft. Radius)', 19)] },
    'pwr-energy-adaptation': { effects: [defB('ef-pw-ea', 'Energy Resistance', 'Acid, Cold, Electricity, Fire, Sonic', 10)] },
    'pwr-energy-adaptation-specified': { choices: ENERGY_CHOICE_DEF, effects: [defB('ef-pw-eas', 'Energy Resistance', '@Choice', 10)] },
    'pwr-adapt-body': { effects: [defB('ef-pw-ab', 'Immunity', 'Hostile Environmental Effects', 0)] },
    'pwr-mind-blank-personal': { effects: [defB('ef-pw-mbp', 'Immunity', 'Mind-Affecting & Scrying', 0)] },
    'pwr-mind-blank-psionic': { effects: [defB('ef-pw-mbps', 'Immunity', 'Mind-Affecting & Scrying', 0)] },
    'pwr-freedom-of-movement-psionic': { effects: [switchB('ef-pw-fom', 'freedomOfMovement', 'Move and Attack Normally Despite Grappling/Impeding Effects')] },
    'pwr-keen-edge-psionic': { effects: [switchB('ef-pw-ke', 'keen', 'Doubles Normal Weapon Threat Range')] },
    'pwr-psionic-lions-charge': { effects: [switchB('ef-pw-plc', 'pounce', 'Make Full Attack in Same Round You Charge')] },
    'pwr-hustle': { effects: [switchB('ef-pw-hst', 'gainExtraMoveAction', 'Gain an Immediate Extra Move Action This Round')] },
    'pwr-prowess': { effects: [switchB('ef-pw-prw', 'extraAoOImmediate', 'Make One Additional Attack of Opportunity This Round')] },
    'pwr-Oak-body': { effects: [defB('ef-pw-oak', 'Damage Reduction', 'slashing', 5), statB('ef-pw-oak-s', ['str'], 4, 'Untyped'), statB('ef-pw-oak-d', ['dex'], -2, 'Penalty')] },
    'pwr-oak-body': { effects: [defB('ef-pw-oak', 'Damage Reduction', 'slashing', 5), statB('ef-pw-oak-s', ['str'], 4, 'Untyped'), statB('ef-pw-oak-d', ['dex'], -2, 'Penalty')] },
    'pwr-iron-body-psionic': { effects: [defB('ef-pw-ibody', 'Damage Reduction', 'adamantine', 15), statB('ef-pw-ib-s', ['str'], 6, 'Enhancement'), statB('ef-pw-ib-d', ['dex'], -6, 'Penalty')] },
    'pwr-bite-of-the-wolf': { effects: [{ id: 'ef-pw-botw', type: 'attack', attackMode: 'natural', natKind: 'primary', count: 1, weaponName: 'Bite', dice: '1d8', dmgType: 'B/P/S' }] },
    'pwr-claws-of-the-beast': { effects: [{ id: 'ef-pw-cotb', type: 'attack', attackMode: 'natural', natKind: 'primary', count: 2, weaponName: 'Claw', dice: '1d4', dmgType: 'B/S' }] },
    'pwr-metaphysical-claw': { effects: [statB('ef-pw-mclaw', ['atk.natural', 'dmg.natural'], 1, 'Enhancement')] },
    'pwr-painful-strike': { effects: [rollB('ef-pw-pstr', 'Damage', 1, 'd6', 0, 'Nonlethal')] },
    'pwr-weapon-of-energy': { choices: ENERGY_CHOICE_DEF, effects: [rollB('ef-pw-woe', 'Damage', 1, 'd6', 0, '@Choice')] },
    'pwr-claw-of-energy': { choices: ENERGY_CHOICE_DEF, effects: [rollB('ef-pw-coe', 'Damage', 1, 'd6', 0, '@Choice')] },
    'pwr-energy-ray': { choices: ENERGY_CHOICE_DEF, effects: [rollB('ef-pw-eray', 'Damage', 1, 'd6', 0, '@Choice', { touch: true })] },
    'pwr-ego-whip': { effects: [rollB('ef-pw-ew', 'Ability Damage', 1, 'd4', 0, 'CHA Damage')] },
    'pwr-distract': { effects: [statB('ef-pw-dist', ['skill.listen', 'skill.search', 'skill.sense-motive', 'skill.spot'], -4, 'Penalty')] },
    'pwr-inflict-pain': { effects: [statB('ef-pw-ipain', ['atk.all', 'skill.all'], -4, 'Penalty')] },
    'pwr-concealing-amorpha': { effects: [defB('ef-pw-cam', 'State', 'Concealment (20% Miss Chance)', 20)] },
    'pwr-concealing-amorpha-greater': { effects: [defB('ef-pw-gcam', 'State', 'Total Concealment (50% Miss Chance)', 50)] },
    'pwr-evade-burst': { effects: [switchB('ef-pw-eb', 'evasion', 'Take No Damage From Burst on Successful Reflex Save')] },
    'pwr-share-pain': { effects: [switchB('ef-pw-shp', 'shareHalfDamageWithWillingTarget', 'Split Incoming HP Damage 50/50 With Willing Linked Subject')] }
  };

  for (const e of pwrData) {
    if (!e) continue;
    if (POWER_EXPLICIT[e.id]) {
      if (POWER_EXPLICIT[e.id].choices) e.choices = POWER_EXPLICIT[e.id].choices;
      if (!Array.isArray(e.effects) || e.effects.length === 0) {
        e.effects = POWER_EXPLICIT[e.id].effects;
      }
      count++;
      continue;
    }
    if (Array.isArray(e.effects) && e.effects.length > 0) continue;
    const d = String(e.shortDescription || e.text || '');
    // Parse damage dice powers (`Deal 5d6 energy damage`, `deals 9d4 slashing damage`, `Deal 1d10 damage`, etc.)
    const dmgM = d.match(/(?:deals?|subjects\s+your\s+foes\s+to|takes?)\s+(\d+)d(\d+)\s*(?:points?\s+)?(acid|cold|electricity|fire|sonic|force|slashing|nonlethal|energy)?\s*damage/i);
    if (dmgM) {
      const rawType = (dmgM[3] || 'Untyped').toLowerCase();
      if (rawType === 'energy' || /chosen energy/i.test(d)) {
        e.choices = ENERGY_CHOICE_DEF;
        e.effects = [rollB(`${e.id}-dmg`, 'Damage', Number(dmgM[1]), `d${dmgM[2]}`, 0, '@Choice')];
      } else {
        const dt = rawType === 'untyped' ? 'Untyped' : (rawType[0].toUpperCase() + rawType.slice(1));
        e.effects = [rollB(`${e.id}-dmg`, 'Damage', Number(dmgM[1]), `d${dmgM[2]}`, 0, dt)];
      }
      count++;
    }
  }
  return count;
}

function compileRemainingMechanicalSpells(spellsCore, spellsSplat) {
  let count = 0;
  const SPELL_PATCHES = {
    'spl-protection-from-arrows': [defB('ef-sp-pfa', 'Damage Reduction', 'magic (Ranged Weapons)', 10)],
    'spl-dispel-chaos': [statB('ef-sp-dch', ['ac.deflection'], 4, 'Deflection', { condition: 'vs. Chaotic Creatures' })],
    'spl-dispel-evil': [statB('ef-sp-dev', ['ac.deflection'], 4, 'Deflection', { condition: 'vs. Evil Creatures' })],
    'spl-dispel-good': [statB('ef-sp-dgd', ['ac.deflection'], 4, 'Deflection', { condition: 'vs. Good Creatures' })],
    'spl-dispel-law': [statB('ef-sp-dlw', ['ac.deflection'], 4, 'Deflection', { condition: 'vs. Lawful Creatures' })],
    'spl-undetectable-alignment': [defB('ef-sp-ua', 'Immunity', 'Alignment Divination (24 hours)', 0)],
    'spl-nondetection': [defB('ef-sp-nd', 'Immunity', 'Divination/Scrying (Caster Level Check Required)', 0)],
    'spl-water-breathing': [defB('ef-sp-wb', 'Immunity', 'Drowning (Breathe Underwater)', 0)],
    'spl-endure-elements': [defB('ef-sp-ee', 'Immunity', 'Severe Heat & Cold Environments (-50 to 140 F)', 0)],
    'spl-feather-fall': [switchB('ef-sp-ff', 'featherFall60Ft', 'Fall Slowly at 60 ft./Round; Take Zero Falling Damage')],
    'spl-corrupt-weapon': [{ id: 'ef-sp-cw', type: 'attack', attackMode: 'drBypass', appliesToWeapon: 'touched', drBypassList: 'evil', enhEquivalent: 0 }, switchB('ef-sp-cw-c', 'autoConfirmCritVsGood', 'Automatically Confirms Critical Threats Against Good Foes')],
    'spl-keen-edge': [switchB('ef-sp-ke', 'keen', 'Doubles Touched Piercing/Slashing Weapon Critical Threat Range')]
  };

  for (const arr of [spellsCore, spellsSplat]) {
    for (const e of arr) {
      if (!e || (Array.isArray(e.effects) && e.effects.length > 0)) continue;
      if (SPELL_PATCHES[e.id]) {
        e.effects = SPELL_PATCHES[e.id];
        count++;
        continue;
      }
      const d = String(e.shortDescription || '');
      // Catch any remaining pure direct damage or healing spells whose shortDescription explicitly states dice damage/healing
      const healM = d.match(/^(?:Cures|Heals|Restores)\s+(\d+)d(\d+)(?:\s*\+\s*1\/level\s*\(max\s*\+(\d+)\))?/i);
      if (healM) {
        e.effects = [rollB(`${e.id}-hl`, 'Healing', Number(healM[1]), `d${healM[2]}`, 0, 'Positive', healM[3] ? { scaling: 'perCL', amount: 1, per: 1, max: Number(healM[3]) } : {})];
        count++;
        continue;
      }
      const directDmgM = d.match(/^(?:Deals?|Ray\s+deals?|Cone\s+deals?|Line\s+deals?)\s+(\d+)d(\d+)\s+(acid|cold|electricity|fire|sonic|force|negative|positive)?\s*damage/i);
      if (directDmgM) {
        const dt = directDmgM[3] ? (directDmgM[3][0].toUpperCase() + directDmgM[3].slice(1)) : 'Untyped';
        e.effects = [rollB(`${e.id}-dm`, 'Damage', Number(directDmgM[1]), `d${directDmgM[2]}`, 0, dt)];
        count++;
      }
    }
  }
  return count;
}

// ----------------------------------------------------------------------------
// 7. Global Dialect Normalizer & Stranded RuleFlags Sweeper (Across All Chunks)
// ----------------------------------------------------------------------------
function normalizeEntryV3Dialect(e) {
  let normalizedCount = 0;
  if (!e) return 0;

  // Sync chargesPerDay into a V3 resource block on items that already had stat/roll blocks
  if (e.ruleFlags && e.ruleFlags.chargesPerDay && Array.isArray(e.effects) && e.effects.length > 0) {
    const hasRes = e.effects.some(b => b && (b.type === 'resource' || (b.type === 'carrier' && (b.costMode === 'rod' || b.costMode === 'sudden'))));
    if (!hasRes) {
      e.effects.unshift(resB(`${e.id}-chg`, 'Daily Charges', Number(e.ruleFlags.chargesPerDay) || 3, 'perDay'));
      normalizedCount++;
    }
  }

  // If an entry STILL has effects: [] AND has non-structural ruleFlags, bridge them cleanly
  const hasChassis = Boolean(e.weapon || e.armor || e.chassis || e.race || e.monster || e.type === 'Class' || e.type === 'Race' || e.type === 'DamageType');
  if (!hasChassis && (!Array.isArray(e.effects) || e.effects.length === 0) && (!Array.isArray(e.powers) || e.powers.length === 0) && e.ruleFlags && Object.keys(e.ruleFlags).length > 0) {
    const rf = e.ruleFlags;
    const effs = [];
    if (rf.chargesPerDay) effs.push(resB(`${e.id}-chg`, 'Daily Charges', Number(rf.chargesPerDay) || 3, 'perDay'));
    const d = String(e.benefit || e.shortDescription || e.text || e.name || '').replace(/\s+/g, ' ').trim();
    const firstFlag = Object.keys(rf)[0];
    effs.push(switchB(`${e.id}-rf`, firstFlag, e.name, d.slice(0, 180)));
    e.effects = effs;
    normalizedCount++;
  }

  const walk = (blocks) => {
    if (!Array.isArray(blocks)) return;
    for (const b of blocks) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'when' && Array.isArray(b.branches)) {
        for (const br of b.branches) {
          if ((br.condKind === 'state' || br.condKind === 'situational') && br.condText && NAMED_WHEN_CONDS.has(br.condText)) {
            br.condKind = br.condText;
            br.condText = '';
            normalizedCount++;
          }
          if (Array.isArray(br.effects)) walk(br.effects);
        }
      }
      if (b.type === 'roll') {
        if (b.scaling !== 'formula' && b.dice !== undefined) {
          const simpleM = String(b.dice).trim().match(/^(\d+)d(\d+)(?:\s*([+-]\s*\d+))?$/i);
          if (simpleM) {
            b.count = parseInt(simpleM[1], 10) || 1;
            b.die = `d${simpleM[2]}`;
            if (simpleM[3] && b.flat === undefined) b.flat = parseInt(simpleM[3].replace(/\s+/g, ''), 10) || 0;
            delete b.dice;
            normalizedCount++;
          } else if (b.dice) {
            b.scaling = 'formula';
            normalizedCount++;
          }
        }
      }
      if (Array.isArray(b.effects)) walk(b.effects);
    }
  };
  if (Array.isArray(e.effects)) walk(e.effects);
  return normalizedCount;
}

module.exports = {
  NAMED_WHEN_CONDS,
  EXPLICIT_PATCHES,
  compileManeuversAndStances,
  compileEquipmentAndMic,
  compileClassAbilitiesAndRacialTraits,
  compileFeatList,
  compilePowers,
  compileRemainingMechanicalSpells,
  normalizeEntryV3Dialect
};
