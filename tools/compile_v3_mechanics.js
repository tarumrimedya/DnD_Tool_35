#!/usr/bin/env node
'use strict';

/**
 * ============================================================================
 * Sprint C.6 — Deterministic 0-Token V3 Mechanics Compiler (`tools/compile_v3_mechanics.js`)
 * ============================================================================
 * Idempotently compiles & enriches Pure Canonical V3 (`schemaVersion: 3`) data:
 *   A) 3 Official Unearthed Arcana Variant Classes in `database/srd_classes_races.json`:
 *      - `cls-rogue-adventurer-variant` (UA p.58)
 *      - `cls-fighter-thug-variant` (UA p.51)
 *      - `cls-cleric-cloistered-variant` (UA p.50)
 *   B) First-Class V3 Mechanical `ClassAbility` (`cab-*`) Records in `database/srd_classes_races.json`
 *      and `id` links inside `cls-*.features` across `srd_classes_races.json` & `srd_classes_splat.json`
 *   C) Shadow-Logic Feats, ~55+ Mechanical Core Feats, Domains & Combat Spells in
 *      `srd_feats.json`, `srd_feats_splat.json`, `srd_domains.json`, `srd_spells.json`
 *      (leaving purely narrative spells like Teleport, Wish, Speak with Dead untouched)
 *   D) Recomputes SHA-256 hashes, byte sizes, counts & `index[]` in `database/srd_index.json`.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  NAMED_WHEN_CONDS,
  compileManeuversAndStances,
  compileEquipmentAndMic,
  compileClassAbilitiesAndRacialTraits,
  compileFeatList,
  compilePowers,
  compileRemainingMechanicalSpells,
  normalizeEntryV3Dialect
} = require('./compile_v3_corpus_complete');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');

function readChunk(filename) {
  const fp = path.join(DB_DIR, filename);
  const raw = fs.readFileSync(fp, 'utf8');
  const wasMinified = raw.split('\n').length <= 5;
  return { fp, data: JSON.parse(raw), wasMinified };
}

function writeChunk(fp, data, wasMinified) {
  const jsonText = (wasMinified ? JSON.stringify(data) : JSON.stringify(data, null, 2)) + '\n';
  const buf = Buffer.from(jsonText, 'utf8');
  fs.writeFileSync(fp, buf);
  const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
  return { bytes: buf.length, hash, count: Array.isArray(data) ? data.length : 1 };
}

function upsertById(arr, record) {
  const idx = arr.findIndex((e) => e && e.id === record.id);
  if (idx >= 0) {
    const prev = arr[idx];
    if (prev && typeof prev === 'object') {
      if (!record.grants && prev.grants) record.grants = deepClone(prev.grants);
      if (prev.progression?.levels && !record.progression?.levels) {
        record.progression = Object.assign({}, record.progression || {}, { levels: deepClone(prev.progression.levels) });
      }
    }
    arr[idx] = record;
    return 'updated';
  }
  arr.push(record);
  return 'created';
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function makeCab(spec) {
  return {
    schemaVersion: 3,
    id: spec.id,
    blueprint: 'feat',
    name: spec.name,
    type: 'ClassAbility',
    category: 'Class Feature',
    source: spec.source || 'SRD 3.5e',
    featKind: 'classAbility',
    abilityType: spec.abilityType || 'ex',
    associations: spec.associations || [],
    ...(spec.aliases ? { aliases: spec.aliases } : {}),
    ...(spec.choices ? { choices: spec.choices } : {}),
    effects: spec.effects || [],
    ...(spec.modes ? { modes: spec.modes } : {}),
    shortDescription: spec.shortDescription,
    text: spec.text || spec.shortDescription,
    tags: spec.tags || ['class-ability']
  };
}

// ----------------------------------------------------------------------------
// A. Unearthed Arcana Variant Classes
// ----------------------------------------------------------------------------
function compileVariantClasses(crData) {
  const baseRogue = crData.find((e) => e && e.id === 'cls-rogue');
  const baseFighter = crData.find((e) => e && e.id === 'cls-fighter');
  const baseCleric = crData.find((e) => e && e.id === 'cls-cleric');
  if (!baseRogue || !baseFighter || !baseCleric) {
    throw new Error('Missing base Rogue, Fighter, or Cleric class in srd_classes_races.json');
  }

  // 1. Rogue (Adventurer Variant) - Unearthed Arcana p.58
  const advFeatures = {};
  const advBonusLvls = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  for (let lvl = 1; lvl <= 20; lvl++) {
    const key = String(lvl);
    const baseList = Array.isArray(baseRogue.features?.[key]) ? deepClone(baseRogue.features[key]) : [];
    const filtered = baseList.filter((f) => !/sneak\s*attack/i.test(String(f?.name || '')));
    if (advBonusLvls.includes(lvl)) {
      filtered.unshift({
        id: 'cab-fighter-bonus-feat',
        name: 'Fighter Bonus Feat',
        category: 'Bonus Feat',
        type: 'Ex',
        summary: 'Select a Fighter Bonus Feat (in place of Sneak Attack, Unearthed Arcana p.58)'
      });
    }
    if (filtered.length > 0) advFeatures[key] = filtered;
  }
  const rogueAdventurer = {
    schemaVersion: 3,
    id: 'cls-rogue-adventurer-variant',
    blueprint: 'class',
    name: 'Rogue (Adventurer Variant)',
    type: 'Class',
    category: 'Variant',
    source: 'Unearthed Arcana p.58',
    variantOf: 'cls-rogue',
    replaces: ['cab-sneak-attack'],
    aliases: ['cls_rogue_adventurer_ua', 'Martial Rogue', 'Feat Rogue'],
    hitDie: 'd6',
    hd: 6,
    bab: 0.75,
    babProgression: 'medium',
    savingThrows: { fort: 'low', ref: 'high', will: 'low' },
    fort: 'poor',
    ref: 'good',
    will: 'poor',
    skills: 8,
    skillPointsPerLevel: 8,
    classSkills: deepClone(baseRogue.classSkills || []),
    isPrestige: false,
    maxLevel: 20,
    features: advFeatures,
    addedAbilities: [],
    bonusFeatLevels: advBonusLvls,
    bonusFeatContract: {
      mode: 'tag',
      tag: 'isFighterBonusFeat',
      label: 'Fighter Bonus Feat',
      filter: 'FIGHTER'
    },
    spellcasting: deepClone(baseRogue.spellcasting || { type: 'none', ability: 'int', spontaneous: false, spellsPerDay: {}, spellsKnown: {} }),
    grants: {
      bonusFeats: advBonusLvls.map((lvl) => ({ count: 1, pool: '#FighterBonus', level: lvl }))
    },
    progression: (() => {
      const prog = deepClone(baseRogue.progression || {
        mode: 'base',
        maxLevel: 20,
        hitDie: 'd6',
        bab: '3/4',
        goodSaves: ['ref'],
        skillPointsPerLevel: 8,
        classSkills: deepClone(baseRogue.classSkills || [])
      });
      if (Array.isArray(prog.levels)) {
        prog.levels = prog.levels.map((row) => {
          const lvl = Number(row?.level) || 0;
          const nextRow = deepClone(row);
          const filteredRefs = Array.isArray(nextRow.features)
            ? nextRow.features.filter((f) => f?.refId !== 'cab-sneak-attack' && !/sneak\s*attack/i.test(String(f?.name || '')))
            : [];
          if (advBonusLvls.includes(lvl)) {
            filteredRefs.unshift({
              kind: 'ref',
              name: 'Fighter Bonus Feat',
              abilityType: 'Ex',
              refId: 'cab-fighter-bonus-feat',
              text: 'Select a Fighter Bonus Feat (in place of Sneak Attack, Unearthed Arcana p.58)',
              category: 'Bonus Feat'
            });
          }
          nextRow.features = filteredRefs;
          return nextRow;
        });
      }
      return prog;
    })(),
    effects: [],
    shortDescription: 'Trades all Sneak Attack progression for Fighter Bonus Feats at 1st, 3rd, and every odd Rogue level (Unearthed Arcana p.58).',
    text: 'Adventurer / Martial Rogue Variant (Unearthed Arcana p.58). Gives up Sneak Attack (+1d6 at 1st level and every odd level thereafter) to gain a Fighter Bonus Feat at 1st, 3rd, 5th, 7th, 9th, 11th, 13th, 15th, 17th, and 19th level, while retaining d6 Hit Die, 8 + INT skill points per level, Trapfinding, Evasion, Uncanny Dodge, Trap Sense, and Rogue Special Abilities.',
    tags: ['class', 'base', 'variant', 'unearthed-arcana'],
    role: 'Variant Base Class / Martial Feat Rogue'
  };

  // 2. Fighter (Thug Variant) - Unearthed Arcana p.51
  const thugBonusLvls = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
  const thugSkills = Array.from(new Set([
    ...(baseFighter.classSkills || []),
    'bluff',
    'gather_information',
    'k_local',
    'sleight_of_hand'
  ]));
  const thugFeatures = {
    '1': [
      {
        id: 'cab-urban-class-skills',
        name: 'Urban Class Skills (Thug)',
        category: 'Class Feature',
        type: 'Ex',
        summary: 'Gains 4 + INT skill points/level and adds Bluff, Gather Information, Knowledge (local), and Sleight of Hand to Fighter class skills (replaces 1st-level Fighter Bonus Feat, Unearthed Arcana p.51).'
      }
    ]
  };
  for (const lvl of thugBonusLvls) {
    thugFeatures[String(lvl)] = [
      {
        id: 'cab-fighter-bonus-feat',
        name: 'Fighter Bonus Feat',
        category: 'Bonus Feat',
        type: 'Special',
        summary: 'Gain a bonus combat-oriented feat from the Fighter bonus feat list.'
      }
    ];
  }
  const fighterThug = {
    schemaVersion: 3,
    id: 'cls-fighter-thug-variant',
    blueprint: 'class',
    name: 'Fighter (Thug Variant)',
    type: 'Class',
    category: 'Variant',
    source: 'Unearthed Arcana p.51',
    variantOf: 'cls-fighter',
    replaces: ['cab-fighter-bonus-feat-1'],
    aliases: ['cls_fighter_thug_ua'],
    hitDie: 'd10',
    hd: 10,
    bab: 1,
    babProgression: 'high',
    savingThrows: { fort: 'high', ref: 'low', will: 'low' },
    fort: 'good',
    ref: 'poor',
    will: 'poor',
    skills: 4,
    skillPointsPerLevel: 4,
    classSkills: thugSkills,
    isPrestige: false,
    maxLevel: 20,
    features: thugFeatures,
    addedAbilities: [],
    bonusFeatLevels: thugBonusLvls,
    bonusFeatContract: deepClone(baseFighter.bonusFeatContract || {
      mode: 'tag',
      tag: 'isFighterBonusFeat',
      label: 'Fighter Class Bonus Feat',
      filter: 'FIGHTER'
    }),
    spellcasting: deepClone(baseFighter.spellcasting || { type: 'none', ability: 'int', spontaneous: false, spellsPerDay: {}, spellsKnown: {} }),
    progression: {
      mode: 'base',
      maxLevel: 20,
      hitDie: 'd10',
      bab: 'full',
      goodSaves: ['fort'],
      skillPointsPerLevel: 4,
      classSkills: thugSkills
    },
    effects: [],
    shortDescription: 'Urban brawler Fighter variant gaining 4 + INT skill points and urban class skills in exchange for the 1st-level bonus feat and medium/heavy armor & tower shield proficiencies (Unearthed Arcana p.51).',
    text: 'Thug Fighter Variant (Unearthed Arcana p.51). Gains 4 + INT skill points per level and adds Bluff, Gather Information, Knowledge (local), and Sleight of Hand to class skills, trading away medium armor, heavy armor, and tower shield proficiencies as well as the 1st-level Fighter Bonus Feat.',
    tags: ['class', 'base', 'variant', 'unearthed-arcana'],
    role: 'Variant Base Class / Urban Brawler'
  };

  // 3. Cleric (Cloistered Cleric) - Unearthed Arcana p.50
  const cloisteredSkills = Array.from(new Set([
    ...(baseCleric.classSkills || []),
    'decipher_script',
    'speak_language',
    'k_arcana',
    'k_arch',
    'k_dungeon',
    'k_geo',
    'k_history',
    'k_local',
    'k_nature',
    'k_nobility',
    'k_planes',
    'k_religion'
  ]));
  const clericCloistered = {
    schemaVersion: 3,
    id: 'cls-cleric-cloistered-variant',
    blueprint: 'class',
    name: 'Cleric (Cloistered Cleric)',
    type: 'Class',
    category: 'Variant',
    source: 'Unearthed Arcana p.50',
    variantOf: 'cls-cleric',
    replaces: [],
    aliases: ['cls_cleric_cloistered_ua'],
    hitDie: 'd6',
    hd: 6,
    bab: 0.5,
    babProgression: 'low',
    savingThrows: { fort: 'high', ref: 'low', will: 'high' },
    fort: 'good',
    ref: 'poor',
    will: 'good',
    skills: 6,
    skillPointsPerLevel: 6,
    classSkills: cloisteredSkills,
    isPrestige: false,
    maxLevel: 20,
    features: {
      '1': [
        {
          id: 'cab-turn-undead',
          name: 'Turn Undead (Su)',
          category: 'Special Ability',
          type: 'Su',
          summary: 'Channel positive energy to turn or destroy undead 3 + CHA mod times/day.'
        },
        {
          id: 'cab-lore',
          name: 'Lore (Ex)',
          category: 'Class Feature',
          type: 'Ex',
          summary: 'Functions like Bardic Knowledge (Cleric level + INT modifier).'
        },
        {
          id: 'cab-bonus-domain-knowledge',
          name: 'Bonus Domain: Knowledge',
          category: 'Class Feature',
          type: 'Ex',
          summary: 'Gains the Knowledge domain as a bonus third Cleric domain.'
        }
      ]
    },
    addedAbilities: [],
    spellcasting: Object.assign(deepClone(baseCleric.spellcasting || {}), { knownSource: 'fullList' }),
    progression: {
      mode: 'base',
      maxLevel: 20,
      hitDie: 'd6',
      bab: '1/2',
      goodSaves: ['fort', 'will'],
      skillPointsPerLevel: 6,
      classSkills: cloisteredSkills
    },
    effects: [],
    shortDescription: 'Scholarly Cleric variant with d6 HD, 1/2 BAB, 6 + INT skill points, all Knowledge skills, Lore (Ex), and the Knowledge domain as a bonus third domain (Unearthed Arcana p.50).',
    text: 'Cloistered Cleric Variant (Unearthed Arcana p.50). Trades heavy/medium armor, shield proficiency, d8 Hit Die, and 3/4 BAB for d6 Hit Die, 1/2 BAB, 6 + INT skill points per level, Decipher Script, Speak Language, all Knowledge skills as class skills, Lore (functions as Bardic Knowledge), and the Knowledge domain as a bonus third domain.',
    tags: ['class', 'base', 'variant', 'unearthed-arcana'],
    role: 'Variant Base Class / Scholarly Divine Caster'
  };

  return [
    upsertById(crData, rogueAdventurer),
    upsertById(crData, fighterThug),
    upsertById(crData, clericCloistered)
  ];
}

// ----------------------------------------------------------------------------
// B. First-Class V3 ClassAbility (`cab-*`) Records & Class Feature Links
// ----------------------------------------------------------------------------
function buildClassAbilitySpecs() {
  return [
    makeCab({
      id: 'cab-battle-clarity',
      name: 'Battle Clarity (Ex)',
      source: 'Tome of Battle p.21',
      abilityType: 'ex',
      associations: [['Warblade', 1]],
      shortDescription: 'While not flat-footed, add your Intelligence bonus (up to your Warblade level) as an insight bonus on Reflex saves.',
      effects: [
        {
          id: 'ef-bc-when',
          type: 'when',
          flow: 'while',
          branches: [
            {
              id: 'br-bc-1',
              condKind: 'state',
              condText: 'notFlatFooted',
              effects: [
                {
                  id: 'ef-bc-ref',
                  type: 'stat',
                  targets: ['save.ref'],
                  mode: 'formula',
                  formula: 'min(@warbladeLevel, max(0, @intMod))',
                  btype: 'Insight'
                }
              ]
            }
          ]
        }
      ]
    }),
    makeCab({
      id: 'cab-weapon-aptitude',
      name: 'Weapon Aptitude (Ex)',
      source: 'Tome of Battle p.22',
      abilityType: 'ex',
      associations: [['Warblade', 1]],
      shortDescription: 'Reassign weapon-specific feats (Weapon Focus, Improved Critical, etc.) with 1 hour of weapon practice; count Warblade level - 2 as Fighter level for feat prerequisites.',
      effects: [
        {
          id: 'ef-wa-note',
          type: 'effect',
          effectKind: 'ruleSwitch',
          flag: 'weaponAptitude',
          label: 'Reassign weapon-specific feats (1 hr practice); Fighter level = Warblade - 2 for feat prerequisites',
          text: 'Weapon Aptitude: Reassign weapon feats (1 hr); Fighter lvl = Warblade - 2 for prereqs'
        }
      ]
    }),
    makeCab({
      id: 'cab-battle-ardor',
      name: 'Battle Ardor (Ex)',
      source: 'Tome of Battle p.22',
      abilityType: 'ex',
      associations: [['Warblade', 3]],
      shortDescription: 'Add your Intelligence bonus (if positive) as an insight bonus on attack rolls made to confirm critical hits.',
      effects: [
        {
          id: 'ef-ba-crit',
          type: 'stat',
          targets: ['atk.critConfirm'],
          mode: 'formula',
          formula: 'max(0, @intMod)',
          btype: 'Insight'
        }
      ]
    }),
    makeCab({
      id: 'cab-battle-cunning',
      name: 'Battle Cunning (Ex)',
      source: 'Tome of Battle p.22',
      abilityType: 'ex',
      associations: [['Warblade', 7]],
      shortDescription: 'Add your Intelligence bonus (if positive) as an insight bonus on melee damage rolls against flat-footed or flanked opponents.',
      effects: [
        {
          id: 'ef-bcun-when',
          type: 'when',
          flow: 'while',
          branches: [
            {
              id: 'br-bcun-1',
              condKind: 'situational',
              condText: 'vsFlatFootedOrFlanked',
              effects: [
                {
                  id: 'ef-bcun-dmg',
                  type: 'stat',
                  targets: ['dmg.melee'],
                  mode: 'formula',
                  formula: 'max(0, @intMod)',
                  btype: 'Insight'
                }
              ]
            }
          ]
        }
      ]
    }),
    makeCab({
      id: 'cab-battle-skill',
      name: 'Battle Skill (Ex)',
      source: 'Tome of Battle p.23',
      abilityType: 'ex',
      associations: [['Warblade', 11]],
      shortDescription: 'Add your Intelligence bonus (if positive) as an insight bonus on opposed checks made to bull rush, disarm, feint, overrun, sunder, or trip.',
      effects: [
        {
          id: 'ef-bsk',
          type: 'stat',
          targets: ['cmd.bullRushTripDisarmOverrun'],
          mode: 'formula',
          formula: 'max(0, @intMod)',
          btype: 'Insight'
        }
      ]
    }),
    makeCab({
      id: 'cab-battle-mastery',
      name: 'Battle Mastery (Ex)',
      source: 'Tome of Battle p.23',
      abilityType: 'ex',
      associations: [['Warblade', 15]],
      shortDescription: 'Add your Intelligence bonus (if positive) as an insight bonus on melee attack and damage rolls made for attacks of opportunity.',
      effects: [
        {
          id: 'ef-bmas',
          type: 'effect',
          effectKind: 'ruleSwitch',
          flag: 'battleMasteryAoO',
          label: '+INT Insight on AoO attack & damage rolls',
          text: 'Battle Mastery: +INT Insight on AoO attack & damage rolls'
        }
      ]
    }),
    makeCab({
      id: 'cab-trapfinding',
      name: 'Trapfinding (Ex)',
      source: 'SRD / PHB p.50',
      abilityType: 'ex',
      associations: [['Rogue', 1], ['Rogue (Adventurer Variant)', 1]],
      shortDescription: 'Use the Search skill to locate traps with a DC higher than 20 and Disable Device to disarm magic traps.',
      effects: [
        {
          id: 'ef-trapfinding',
          type: 'effect',
          effectKind: 'ruleSwitch',
          flag: 'trapfinding',
          label: 'Locate traps DC > 20 with Search and disarm magic traps with Disable Device',
          text: 'Trapfinding: Search DC > 20 traps & Disable Device magic traps'
        }
      ]
    }),
    makeCab({
      id: 'cab-monk-ac-bonus',
      name: 'AC Bonus (Ex)',
      source: 'SRD / PHB p.40',
      abilityType: 'ex',
      associations: [['Monk', 1]],
      shortDescription: 'When unarmored and unencumbered (no shield), add your Wisdom bonus (if any) plus +1 per 5 Monk levels to AC (applies to touch and flat-footed AC).',
      effects: [
        {
          id: 'ef-monk-ac-when',
          type: 'when',
          flow: 'while',
          branches: [
            {
              id: 'br-monk-ac-1',
              condKind: 'state',
              condText: 'unarmoredNoShield',
              effects: [
                {
                  id: 'ef-monk-ac-wis',
                  type: 'stat',
                  targets: ['ac.total'],
                  mode: 'formula',
                  formula: 'max(0, @wisMod) + floor(@monkLevel / 5)',
                  btype: 'Untyped'
                }
              ]
            }
          ]
        }
      ]
    }),
    makeCab({
      id: 'cab-grace',
      name: 'Grace (Ex)',
      source: 'Complete Warrior p.11',
      abilityType: 'ex',
      associations: [['Swashbuckler', 2]],
      shortDescription: 'Gain a +1 competence bonus on Reflex saves at 2nd level (+2 at 11th, +3 at 20th) when wearing no or light armor and carrying no more than a light load.',
      effects: [
        {
          id: 'ef-grace-ref',
          type: 'stat',
          targets: ['save.ref'],
          mode: 'formula',
          formula: '@swashbucklerLevel >= 20 ? 3 : (@swashbucklerLevel >= 11 ? 2 : (@swashbucklerLevel >= 2 ? 1 : 0))',
          btype: 'Competence'
        }
      ]
    }),
    makeCab({
      id: 'cab-insightful-strike',
      name: 'Insightful Strike (Ex)',
      source: 'Complete Warrior p.11',
      abilityType: 'ex',
      associations: [['Swashbuckler', 3]],
      shortDescription: 'Add your Intelligence bonus (if positive, in addition to Strength) to damage rolls with any light or Weapon Finesse-eligible weapon (excludes creatures immune to critical hits).',
      effects: [
        {
          id: 'ef-inst-dmg',
          type: 'effect',
          effectKind: 'ruleSwitch',
          flag: 'insightfulStrike',
          label: '+INT modifier precision damage on light or Weapon Finesse-eligible melee attacks',
          text: 'Insightful Strike: +INT Precision Damage (Light/Finesse Weapons)'
        }
      ]
    }),
    makeCab({
      id: 'cab-favored-enemy',
      name: 'Favored Enemy (Ex)',
      source: 'SRD / PHB p.47',
      abilityType: 'ex',
      associations: [['Ranger', 1]],
      shortDescription: 'Gain +2 bonus on Bluff, Listen, Sense Motive, Spot, and Survival checks and +2 weapon damage rolls against selected favored enemy creature type.',
      effects: [
        {
          id: 'ef-fe-when',
          type: 'when',
          flow: 'while',
          branches: [
            {
              id: 'br-fe-1',
              condKind: 'situational',
              condText: 'vs. Favored Enemy',
              effects: [
                {
                  id: 'ef-fe-dmg',
                  type: 'stat',
                  targets: ['dmg.all'],
                  mode: 'flat',
                  value: 2,
                  btype: 'Untyped'
                },
                {
                  id: 'ef-fe-sk',
                  type: 'stat',
                  targets: ['skill.bluff', 'skill.listen', 'skill.sense-motive', 'skill.spot', 'skill.survival'],
                  mode: 'flat',
                  value: 2,
                  btype: 'Untyped'
                }
              ]
            }
          ]
        }
      ]
    }),
    makeCab({
      id: 'cab-turn-undead',
      name: 'Turn Undead (Su)',
      source: 'SRD / PHB p.33',
      abilityType: 'su',
      associations: [['Cleric', 1], ['Cleric (Cloistered Cleric)', 1], ['Paladin', 4]],
      aliases: ['Turn/Rebuke Undead'],
      shortDescription: 'Channel positive energy to turn or destroy undead a number of times per day equal to 3 + Charisma modifier.',
      effects: [
        {
          id: 'ef-turn-res',
          type: 'resource',
          name: 'Turn Undead',
          varKey: 'turn_undead_uses',
          resMode: 'spend',
          maxFormula: '3 + max(0, @chaMod)',
          reset: 'perDay',
          unit: 'uses',
          recharge: { period: 'day' }
        },
        {
          id: 'ef-turn-note',
          type: 'effect',
          effectKind: 'ruleSwitch',
          flag: 'turnUndead',
          label: 'Channel positive energy to turn/destroy undead (3 + CHA mod/day)',
          text: 'Turn Undead (3 + CHA mod/day)'
        }
      ]
    }),
    makeCab({
      id: 'cab-lore',
      name: 'Lore (Ex)',
      source: 'Unearthed Arcana p.50',
      abilityType: 'ex',
      associations: [['Cleric (Cloistered Cleric)', 1]],
      shortDescription: 'Functions like Bardic Knowledge, using Cleric level + Intelligence modifier (+2 synergy with 5+ ranks in Knowledge (history)).',
      effects: [
        {
          id: 'ef-lore',
          type: 'effect',
          effectKind: 'ruleSwitch',
          flag: 'loreCheck',
          label: 'Lore check = 1d20 + Cleric level + INT modifier (functions as Bardic Knowledge)',
          text: 'Lore Check: 1d20 + Cleric Level + INT Mod'
        }
      ]
    }),
    makeCab({
      id: 'cab-fighter-bonus-feat',
      name: 'Fighter Bonus Feat',
      source: 'SRD / PHB p.38 / Unearthed Arcana p.58',
      abilityType: 'ex',
      associations: [['Fighter', 1], ['Fighter (Thug Variant)', 2], ['Rogue (Adventurer Variant)', 1]],
      shortDescription: 'Select a bonus combat-oriented feat from the Fighter Bonus Feat list.',
      effects: [
        {
          id: 'ef-fbf',
          type: 'effect',
          effectKind: 'ruleSwitch',
          flag: 'grantsFighterBonusFeat',
          label: 'Select a Fighter Bonus Feat',
          text: 'Grants Fighter Bonus Feat'
        }
      ]
    }),
    makeCab({
      id: 'cab-bonus-domain-knowledge',
      name: 'Bonus Domain: Knowledge',
      source: 'Unearthed Arcana p.50',
      abilityType: 'ex',
      associations: [['Cleric (Cloistered Cleric)', 1]],
      shortDescription: 'Cloistered Clerics gain the Knowledge domain as a bonus third domain (all Knowledge skills are class skills; cast divination spells at +1 CL).',
      effects: [
        {
          id: 'ef-bdk',
          type: 'effect',
          effectKind: 'ruleSwitch',
          flag: 'bonusDomainKnowledge',
          label: 'Bonus 3rd Cleric Domain: Knowledge (+1 CL on Divination spells)',
          text: 'Bonus Domain: Knowledge (+1 CL Divination)'
        }
      ]
    }),
    makeCab({
      id: 'cab-urban-class-skills',
      name: 'Urban Class Skills (Thug)',
      source: 'Unearthed Arcana p.51',
      abilityType: 'ex',
      associations: [['Fighter (Thug Variant)', 1]],
      shortDescription: 'Gains 4 + INT skill points per level and adds Bluff, Gather Information, Knowledge (local), and Sleight of Hand to class skills.',
      effects: [
        {
          id: 'ef-urban-thug',
          type: 'effect',
          effectKind: 'ruleSwitch',
          flag: 'urbanThugSkills',
          label: '4 + INT skill points/lvl; Bluff, Gather Information, K (local), Sleight of Hand',
          text: 'Thug Urban Skills (4 + INT/lvl)'
        }
      ]
    })
  ];
}

function enrichExistingClassAbilities(crData) {
  const existingOverrides = {
    'cab-sneak-attack': {
      effects: [
        {
          id: 'ef-sa-when',
          type: 'when',
          flow: 'while',
          branches: [
            {
              id: 'br-sa-1',
              condKind: 'state',
              condText: 'sneakAttack',
              effects: [
                {
                  id: 'ef-sa-roll',
                  type: 'roll',
                  kind: 'Damage',
                  dice: 'ceil(@rogueLevel / 2)d6',
                  dmgType: 'Precision',
                  crit: 'normal',
                  multiplyOnCrit: false,
                  source: 'Sneak Attack'
                }
              ]
            }
          ]
        }
      ]
    },
    'cab-evasion': {
      effects: [
        {
          id: 'ef-evasion',
          type: 'defense',
          mode: 'State Flag',
          flag: 'evasion',
          what: 'Reflex Half -> No Damage in Light or No Armor',
          text: 'Evasion: Reflex Half -> No Damage (Light/No Armor)'
        }
      ]
    },
    'cab-improved-evasion': {
      effects: [
        {
          id: 'ef-imp-evasion',
          type: 'defense',
          mode: 'State Flag',
          flag: 'improvedEvasion',
          what: 'Half damage even on failed Reflex save (Light or No Armor)',
          text: 'Improved Evasion: Half Damage on Failed Reflex Save'
        }
      ]
    },
    'cab-uncanny-dodge': {
      effects: [
        {
          id: 'ef-uncanny-dodge',
          type: 'defense',
          mode: 'State Flag',
          flag: 'uncannyDodge',
          what: 'Retain DEX bonus to AC when Flat-Footed or struck by an invisible attacker',
          text: 'Uncanny Dodge: Retain DEX to AC when Flat-Footed'
        }
      ]
    },
    'cab-improved-uncanny-dodge': {
      effects: [
        {
          id: 'ef-imp-uncanny-dodge',
          type: 'defense',
          mode: 'State Flag',
          flag: 'improvedUncannyDodge',
          what: 'Cannot be flanked except by a Rogue at least 4 levels higher',
          text: 'Improved Uncanny Dodge: Cannot Be Flanked'
        }
      ]
    },
    'cab-divine-grace': {
      effects: [
        {
          id: 'ef-divine-grace',
          type: 'stat',
          targets: ['save.all'],
          mode: 'formula',
          formula: 'max(0, @chaMod)',
          btype: 'Sacred'
        }
      ]
    },
    'cab-rage': {
      effects: [
        {
          id: 'ef-rage-res',
          type: 'resource',
          name: 'Rage',
          varKey: 'rage_uses',
          resMode: 'spend',
          maxFormula: '1 + floor((max(1, @barbarianLevel) - 1) / 4)',
          reset: 'perDay',
          unit: 'uses',
          recharge: { period: 'day' }
        }
      ],
      modes: [
        { id: 'mode-rage-calm', name: 'Calm', label: 'Calm', effects: [] },
        {
          id: 'mode-rage-active',
          name: 'Raging',
          label: 'Raging (+4 STR/CON, +2 Will, -2 AC)',
          effects: [
            { id: 'ef-rage-str', type: 'stat', targets: ['str', 'con'], mode: 'flat', value: 4, btype: 'Morale' },
            { id: 'ef-rage-will', type: 'stat', targets: ['save.will'], mode: 'flat', value: 2, btype: 'Morale' },
            { id: 'ef-rage-ac', type: 'stat', targets: ['ac.total'], mode: 'flat', value: -2, btype: 'Untyped' }
          ]
        }
      ]
    },
    'cab-smite-evil': {
      effects: [
        {
          id: 'ef-smite-res',
          type: 'resource',
          name: 'Smite Evil',
          varKey: 'smite_evil_uses',
          resMode: 'spend',
          maxFormula: '1 + floor(@paladinLevel / 5)',
          reset: 'perDay',
          unit: 'uses',
          recharge: { period: 'day' }
        }
      ],
      modes: [
        { id: 'mode-smite-off', name: 'Inactive', label: 'Inactive', effects: [] },
        {
          id: 'mode-smite-on',
          name: 'Smite Evil',
          label: 'Smite Evil (+CHA Atk, +Paladin Lvl Dmg)',
          effects: [
            { id: 'ef-smite-atk', type: 'stat', targets: ['atk.melee'], mode: 'formula', formula: 'max(0, @chaMod)', btype: 'Untyped' },
            { id: 'ef-smite-dmg', type: 'stat', targets: ['dmg.melee'], mode: 'formula', formula: '@paladinLevel', btype: 'Untyped' }
          ]
        }
      ]
    },
    'cab-bardic-music': {
      effects: [
        {
          id: 'ef-bm-res',
          type: 'resource',
          name: 'Bardic Music',
          varKey: 'bardic_music_uses',
          resMode: 'spend',
          maxFormula: 'max(1, @bardLevel)',
          reset: 'perDay',
          unit: 'uses',
          recharge: { period: 'day' }
        }
      ],
      modes: [
        { id: 'mode-bm-off', name: 'Inactive', label: 'Inactive', effects: [] },
        {
          id: 'mode-bm-ic',
          name: 'Inspire Courage',
          label: 'Inspire Courage (+1..+4 Morale Atk/Dmg/vs Charm & Fear)',
          effects: [
            { id: 'ef-bm-ic-atk', type: 'stat', targets: ['atk.all', 'dmg.weapon'], mode: 'formula', formula: '@bardLevel >= 20 ? 4 : (@bardLevel >= 14 ? 3 : (@bardLevel >= 8 ? 2 : 1))', btype: 'Morale' }
          ]
        }
      ]
    },
    'cab-turn-rebuke-undead': {
      effects: [
        {
          id: 'ef-turn-reb-res',
          type: 'resource',
          name: 'Turn/Rebuke Undead',
          varKey: 'turn_undead_uses',
          resMode: 'spend',
          maxFormula: '3 + max(0, @chaMod)',
          reset: 'perDay',
          unit: 'uses',
          recharge: { period: 'day' }
        }
      ]
    },
    'cab-aura-of-courage': {
      effects: [
        { id: 'ef-aoc-imm', type: 'defense', mode: 'Immunity', what: 'Fear', text: 'Immune to Fear (allies within 10 ft. gain +4 Morale vs Fear)' }
      ]
    },
    'cab-divine-health': {
      effects: [
        { id: 'ef-div-health', type: 'defense', mode: 'Immunity', what: 'Disease', text: 'Immune to all diseases (including supernatural & magical)' }
      ]
    },
    'cab-purity-of-body': {
      effects: [
        { id: 'ef-purity-body', type: 'defense', mode: 'Immunity', what: 'Disease', text: 'Immune to all nonmagical diseases' }
      ]
    },
    'cab-diamond-body': {
      effects: [
        { id: 'ef-diamond-body', type: 'defense', mode: 'Immunity', what: 'Poison', text: 'Immune to all poisons' }
      ]
    },
    'cab-still-mind': {
      effects: [
        {
          id: 'ef-still-mind-when',
          type: 'when',
          flow: 'while',
          branches: [
            {
              id: 'br-still-mind',
              condKind: 'situational',
              condText: 'vs. Enchantment Spells & Effects',
              effects: [{ id: 'ef-still-mind-stat', type: 'stat', targets: ['save.all'], mode: 'flat', value: 2, btype: 'Untyped' }]
            }
          ]
        }
      ]
    },
    'cab-slippery-mind': {
      effects: [
        { id: 'ef-slippery-mind', type: 'effect', text: 'Slippery Mind: Reroll failed Will save vs enchantment 1 round later' }
      ]
    },
    'cab-trap-sense': {
      effects: [
        {
          id: 'ef-trap-sense-when',
          type: 'when',
          flow: 'while',
          branches: [
            {
              id: 'br-trap-sense',
              condKind: 'situational',
              condText: 'vs. Traps',
              effects: [
                { id: 'ef-ts-ref', type: 'stat', targets: ['save.ref'], mode: 'formula', formula: 'max(1, floor(@classLevel / 3))', btype: 'Untyped' },
                { id: 'ef-ts-ac', type: 'stat', targets: ['ac.dodge'], mode: 'formula', formula: 'max(1, floor(@classLevel / 3))', btype: 'Dodge' }
              ]
            }
          ]
        }
      ]
    },
    'cab-flurry-of-blows': {
      effects: [
        { id: 'ef-flurry', type: 'attack', attackMode: 'extra', extraKind: 'flurry', count: 1, penalty: -2 }
      ]
    },
    'cab-bardic-knowledge': {
      effects: [
        { id: 'ef-bk', type: 'effect', effectKind: 'ruleSwitch', flag: 'loreCheck', label: 'Bardic Knowledge: 1d20 + Bard Level + INT mod', text: 'Bardic Knowledge: 1d20 + Bard Level + INT Mod' }
      ]
    }
  };

  let count = 0;
  for (const entry of crData) {
    if (entry && entry.id && existingOverrides[entry.id]) {
      Object.assign(entry, existingOverrides[entry.id]);
      count++;
    }
  }
  return count;
}

function linkClassFeatureIds(classList, cabLookup) {
  const FEATURE_ID_RULES = [
    [/^battle\s+clarity\b/i, 'cab-battle-clarity'],
    [/^weapon\s+aptitude\b/i, 'cab-weapon-aptitude'],
    [/^battle\s+ardor\b/i, 'cab-battle-ardor'],
    [/^battle\s+cunning\b/i, 'cab-battle-cunning'],
    [/^battle\s+skill\b/i, 'cab-battle-skill'],
    [/^battle\s+mastery\b/i, 'cab-battle-mastery'],
    [/^sneak\s+attack\b/i, 'cab-sneak-attack'],
    [/^trapfinding\b/i, 'cab-trapfinding'],
    [/^improved\s+evasion\b/i, 'cab-improved-evasion'],
    [/^evasion\b/i, 'cab-evasion'],
    [/^improved\s+uncanny\s+dodge\b/i, 'cab-improved-uncanny-dodge'],
    [/^uncanny\s+dodge\b/i, 'cab-uncanny-dodge'],
    [/^divine\s+grace\b/i, 'cab-divine-grace'],
    [/^rage\b|^greater\s+rage\b|^mighty\s+rage\b/i, 'cab-rage'],
    [/^fast\s+movement\b/i, 'cab-fast-movement'],
    [/^ac\s+bonus\b/i, 'cab-monk-ac-bonus'],
    [/^grace\b/i, 'cab-grace'],
    [/^insightful\s+strike\b/i, 'cab-insightful-strike'],
    [/^smite\s+evil\b/i, 'cab-smite-evil'],
    [/^(?:\d+(?:st|nd|rd|th)\s+)?favored\s+enemy\b/i, 'cab-favored-enemy'],
    [/^bardic\s+music\b/i, 'cab-bardic-music'],
    [/^bardic\s+knowledge\b/i, 'cab-bardic-knowledge'],
    [/^turn\s+undead\b|^turn\/rebuke\s+undead\b/i, 'cab-turn-undead'],
    [/^lore\b/i, 'cab-lore'],
    [/^fighter\s+bonus\s+feat\b/i, 'cab-fighter-bonus-feat'],
    [/^bonus\s+domain:\s*knowledge\b/i, 'cab-bonus-domain-knowledge'],
    [/^urban\s+class\s+skills\b/i, 'cab-urban-class-skills'],
    [/^trap\s+sense\b/i, 'cab-trap-sense'],
    [/^aura\s+of\s+courage\b/i, 'cab-aura-of-courage'],
    [/^divine\s+health\b/i, 'cab-divine-health'],
    [/^lay\s+on\s+hands\b/i, 'cab-lay-on-hands'],
    [/^flurry\s+of\s+blows\b/i, 'cab-flurry-of-blows'],
    [/^unarmed\s+strike\b/i, 'cab-unarmed-strike-monk'],
    [/^still\s+mind\b/i, 'cab-still-mind'],
    [/^purity\s+of\s+body\b/i, 'cab-purity-of-body'],
    [/^diamond\s+body\b/i, 'cab-diamond-body'],
    [/^diamond\s+soul\b/i, 'cab-diamond-soul'],
    [/^wholeness\s+of\s+body\b/i, 'cab-wholeness-of-body'],
    [/^wild\s+empathy\b/i, 'cab-wild-empathy'],
    [/^nature\s+sense\b/i, 'cab-nature-sense'],
    [/^woodland\s+stride\b/i, 'cab-woodland-stride'],
    [/^trackless\s+step\b/i, 'cab-trackless-step'],
    [/^dark\s+blessing\b/i, 'cab-dark-blessing'],
    [/^slippery\s+mind\b/i, 'cab-slippery-mind'],
    [/^opportunist\b/i, 'cab-opportunist'],
    [/^crippling\s+strike\b/i, 'cab-crippling-strike'],
    [/^defensive\s+roll\b/i, 'cab-defensive-roll'],
    [/^skill\s+mastery\b/i, 'cab-skill-mastery'],
    [/^hide\s+in\s+plain\s+sight\b/i, 'cab-hide-in-plain-sight'],
    [/^death\s+attack\b/i, 'cab-death-attack'],
    [/^poison\s+use\b/i, 'cab-poison-use'],
    [/^indomitable\s+will\b/i, 'cab-indomitable-will'],
    [/^remove\s+disease\b/i, 'cab-remove-disease'],
    [/^special\s+mount\b/i, 'cab-special-mount'],
    [/^animal\s+companion\b/i, 'cab-animal-companion'],
    [/^summon\s+familiar\b/i, 'cab-summon-familiar'],
    [/^fiendish\s+servant\b/i, 'cab-fiendish-servant'],
    [/^detect\s+evil\b/i, 'cab-detect-evil'],
    [/^weapon\s+finesse\b/i, 'feat-weapon-finesse']
  ];

  let linked = 0;
  for (const cls of classList) {
    if (!cls || cls.type !== 'Class' || !cls.features || typeof cls.features !== 'object') continue;
    for (const lvl of Object.keys(cls.features)) {
      const list = cls.features[lvl];
      if (!Array.isArray(list)) continue;
      for (const feat of list) {
        if (!feat || typeof feat !== 'object' || !feat.name) continue;
        const clean = String(feat.name).replace(/\s*\((Ex|Su|Sp)\)\s*$/i, '').trim();
        let matchedId = null;
        for (const [rx, cid] of FEATURE_ID_RULES) {
          if (rx.test(clean)) {
            if (cid === 'cab-monk-ac-bonus' && !/monk/i.test(cls.name || '') && !/ninja/i.test(cls.name || '')) {
              continue;
            }
            matchedId = cid;
            break;
          }
        }
        if (!matchedId && cabLookup.has(clean.toLowerCase())) {
          matchedId = cabLookup.get(clean.toLowerCase());
        }
        if (matchedId) {
          feat.id = matchedId;
          linked++;
        }
      }
    }
  }
  return linked;
}

// ----------------------------------------------------------------------------
// C. Feats, Domains & Spells V3 Mechanics
// ----------------------------------------------------------------------------
function whenBlock(id, condKind, condText, innerEffects) {
  const isNamed = NAMED_WHEN_CONDS.has(condText);
  return {
    id,
    type: 'when',
    flow: 'while',
    branches: [
      {
        id: `${id}-br`,
        condKind: isNamed ? condText : condKind,
        condText: isNamed ? '' : condText,
        effects: innerEffects
      }
    ]
  };
}

function statBlock(id, targets, valOrFormula, btype, extra = {}) {
  const isFormula = typeof valOrFormula === 'string';
  return Object.assign({
    id,
    type: 'stat',
    targets: Array.isArray(targets) ? targets : [targets],
    mode: isFormula ? 'formula' : 'flat',
    ...(isFormula ? { formula: valOrFormula } : { value: valOrFormula }),
    btype: btype || 'Untyped'
  }, extra);
}

function switchBlock(id, flag, label, text, extra = {}) {
  return Object.assign({
    id,
    type: 'effect',
    effectKind: 'ruleSwitch',
    flag,
    label,
    text
  }, extra);
}

function noteBlock(id, text) {
  return { id, type: 'effect', text };
}

// Race weapon/armor proficiency + weapon familiarity (V3 `effect` blocks, immutable ids; consumed by RuleEngine.getCharacterProficiencies).
// Sources: PHB (elf, dwarf, gnome), Drow of the Underdark (drow), MM (orc), SRD race text for the rest.
function profBlock(id, token) { return { id, type: 'effect', effectKind: 'proficiency', targetId: token }; }
function familiarityBlock(id, weaponId) { return { id, type: 'effect', effectKind: 'familiarity', targetId: weaponId, treatAs: 'martial' }; }
function compileRaceProficiencies(crData) {
  const ELF_WPNS = ['wpn-longsword', 'wpn-rapier', 'wpn-longbow', 'wpn-composite-longbow', 'wpn-shortbow', 'wpn-composite-shortbow'];
  const DWARF_FAM = ['wpn-dwarven-waraxe', 'wpn-dwarven-urgrosh'];
  const GNOME_FAM = ['wpn-gnome-hooked-hammer'];
  const SPEC = {};
  ['race-elf', 'race-elf-high', 'race-elf-wood', 'race-elf-wild', 'race-elf-grey', 'race-elf-aquatic'].forEach((id) => {
    SPEC[id] = { prof: ELF_WPNS.map((w) => 'weapon:' + w) };
  });
  SPEC['race-elf-drow'] = { prof: ['weapon:wpn-hand-crossbow', 'weapon:wpn-rapier', 'weapon:wpn-short-sword', 'weapon:wpn-shortsword'] };
  ['race-dwarf', 'race-dwarf-hill', 'race-dwarf-mountain', 'race-dwarf-deep'].forEach((id) => { SPEC[id] = { fam: DWARF_FAM }; });
  ['race-gnome', 'race-gnome-rock', 'race-gnome-forest', 'race-gnome-svirfneblin'].forEach((id) => { SPEC[id] = { fam: GNOME_FAM }; });
  SPEC['race-orc'] = { fam: ['wpn-orc-double-axe'] };
  SPEC['race-dromite'] = { prof: ['weapon:simple', 'weapon:wpn-longsword', 'armor:light', 'shield:shield'] };
  SPEC['race-elan'] = { prof: ['weapon:simple', 'weapon:wpn-longbow', 'weapon:wpn-warhammer', 'armor:light', 'shield:shield'] };
  SPEC['race-half-giant'] = { prof: ['weapon:simple', 'weapon:martial', 'armor:light', 'armor:medium', 'shield:shield'] };
  SPEC['race-aasimar'] = { prof: ['weapon:simple', 'weapon:martial', 'armor:light', 'armor:medium', 'shield:shield'] };
  SPEC['race-tiefling'] = { prof: ['weapon:simple', 'weapon:martial', 'armor:light', 'shield:shield'] };
  SPEC['race-goliath'] = { prof: ['weapon:simple'] };
  let n = 0;
  for (const [rid, spec] of Object.entries(SPEC)) {
    const rec = crData.find((e) => e && e.id === rid);
    if (!rec) continue;
    if (!Array.isArray(rec.effects)) rec.effects = [];
    rec.effects = rec.effects.filter((b) => !(b && typeof b.id === 'string' && b.id.startsWith('ef-race-prof-')));
    (spec.prof || []).forEach((tok, i) => rec.effects.push(profBlock('ef-race-prof-' + i, tok)));
    (spec.fam || []).forEach((w, i) => rec.effects.push(familiarityBlock('ef-race-prof-fam-' + i, w)));
    n++;
  }
  return n;
}

// Powerful Build (Half-Giant EPH, Goliath Races of Stone): one size larger for opposed-check special size modifiers and weapon size
// (space, reach, AC and attack size modifier are unchanged). Stability: +4 on ability checks to resist bull rush / trip on the ground.
function compileRaceManeuvers(crData) {
  const POWERFUL_BUILD = ['race-goliath', 'race-half-giant'];
  const STABILITY = ['race-dwarf', 'race-dwarf-hill', 'race-dwarf-mountain', 'race-dwarf-deep', 'race-duergar'];
  let n = 0;
  const put = (rec, blk) => {
    if (!Array.isArray(rec.effects)) rec.effects = [];
    rec.effects = rec.effects.filter((b) => !(b && (b.id === blk.id || (Array.isArray(b.targets) && b.targets.length === 1 && b.targets[0] === blk.targets[0]))));
    rec.effects.push(blk);
    n++;
  };
  for (const id of POWERFUL_BUILD) {
    const rec = crData.find((e) => e && e.id === id);
    if (rec) put(rec, { id: 'ef-race-powerful-build', type: 'stat', targets: ['size.effective'], mode: 'flat', value: 1, btype: 'Untyped', appliesTo: ['grapple', 'bullRush', 'trip', 'overrun', 'opposedSize', 'weaponSize'] });
  }
  for (const id of STABILITY) {
    const rec = crData.find((e) => e && e.id === id);
    if (!rec) continue;
    rec.effects = (rec.effects || []).filter((b) => !(b && b.id === 'ef-race-stability'));
    if (!(rec.effects || []).some((b) => b && Array.isArray(b.targets) && b.targets.includes('cmd.stability'))) {
      put(rec, { id: 'ef-race-stability', type: 'stat', targets: ['cmd.stability'], mode: 'flat', value: 4, btype: 'Untyped', condition: 'Standing on Ground' });
    }
  }
  return n;
}

// Racial bonus feats (V3 `effect` block `effectKind: 'feat'`, `targetId` = immutable feat id; consumed by RuleEngine Stage 1 as a granted feat).
// Pixie: MM/Dragon "Racial Feats: A pixie receives Dodge as a bonus feat". Dromite: EPH "Its antennae also give a dromite Blind-Fight as a bonus feat".
// Wood/Aquatic/Wild/Grey elf "Martial Weapon Proficiency feats ... as bonus feats" stay proficiency blocks (compileRaceProficiencies); Human/Azurin are open feat slots.
function compileRaceBonusFeats(crData) {
  const SPEC = { 'race-sprite-pixie': ['feat-dodge'], 'race-dromite': ['feat-blind-fight'] };
  let n = 0;
  for (const [rid, feats] of Object.entries(SPEC)) {
    const rec = crData.find((e) => e && e.id === rid);
    if (!rec) continue;
    if (!Array.isArray(rec.effects)) rec.effects = [];
    rec.effects = rec.effects.filter((b) => !(b && typeof b.id === 'string' && b.id.startsWith('ef-race-bonus-feat-')));
    feats.forEach((fid) => rec.effects.push({ id: 'ef-race-bonus-feat-' + fid.replace(/^feat-/, ''), type: 'effect', effectKind: 'feat', targetId: fid }));
    n++;
  }
  return n;
}

// Natural weapons (Rule Crafter `attack` block, `attackMode: 'natural'`; consumed by RuleEngine.getNaturalWeapons into Full Attack).
// Warforged (Eberron Campaign Setting): Slam 1d4, a hand-limb attack. Idempotent; also drops the old inline slam sub-power.
function compileRaceNaturalWeapons(crData) {
  const rec = crData.find((e) => e && e.id === 'race-warforged');
  if (!rec) return 0;
  if (!Array.isArray(rec.effects)) rec.effects = [];
  rec.effects = rec.effects.filter((b) => !(b && b.id === 'ef-race-natural-slam'));
  rec.effects.push({ id: 'ef-race-natural-slam', type: 'attack', attackMode: 'natural', natKind: 'primary', count: 1, weaponName: 'Slam', dice: '1d4', dmgType: 'Bludgeoning', usesHands: true, summary: 'Slam 1d4 bludgeoning natural weapon (primary).' });
  if (Array.isArray(rec.powers)) {
    rec.powers = rec.powers.filter((p) => !(p && p.id === 'pw-warforged-slam'));
    if (rec.powers.length === 0) delete rec.powers;
  }
  return 1;
}

// Templates as Lego entries: bonus feats (`effect` block `effectKind: 'feat'`, immutable `feat-*` id) and natural weapons
// (`attack` block `attackMode: 'natural'`). Idempotent (blocks `ef-tmpl-*`). Feat names with a choice in parentheses
// (e.g. "Weapon Focus (Bite)") and feats without a record stay text only. Form-dependent natural weapons (lycanthropes) are not written.
const TEMPLATE_NATURAL_WEAPONS = {
  'tmpl-vampire': [{ weaponName: 'Slam', dice: '1d6', dmgType: 'Bludgeoning', count: 1, usesHands: true }],
  'tmpl-zombie': [{ weaponName: 'Slam', dice: '1d6', dmgType: 'Bludgeoning', count: 1, usesHands: true }],
  'tmpl-skeleton': [{ weaponName: 'Claw', dice: '1d4', dmgType: 'Slashing', count: 2, usesHands: true }]
};
['red', 'gold', 'silver', 'blue', 'black', 'green', 'white', 'brass', 'bronze', 'copper'].forEach((c) => {
  TEMPLATE_NATURAL_WEAPONS['tmpl-half-dragon-' + c] = [
    { weaponName: 'Bite', dice: '1d6', dmgType: 'Piercing', count: 1 },
    { weaponName: 'Claw', dice: '1d4', dmgType: 'Slashing', count: 2, usesHands: true }
  ];
});
TEMPLATE_NATURAL_WEAPONS['tmpl-half-fiend'] = TEMPLATE_NATURAL_WEAPONS['tmpl-half-dragon-red'];

function compileTemplateBlocks(tmplData, featNameToId) {
  let n = 0;
  for (const rec of tmplData) {
    if (!rec || !/^tmpl-/.test(String(rec.id || ''))) continue;
    if (!Array.isArray(rec.effects)) rec.effects = [];
    rec.effects = rec.effects.filter((b) => !(b && typeof b.id === 'string' && b.id.startsWith('ef-tmpl-')));
    const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    (Array.isArray(rec.bonusFeats) ? rec.bonusFeats : []).forEach((nm) => {
      const name = String(nm || '').trim();
      if (!name || /\(/.test(name)) return;
      const fid = featNameToId.get(name.toLowerCase());
      if (!fid) return;
      rec.effects.push({ id: 'ef-tmpl-bonus-feat-' + fid.replace(/^feat-/, ''), type: 'effect', effectKind: 'feat', targetId: fid });
      n++;
    });
    (TEMPLATE_NATURAL_WEAPONS[rec.id] || []).forEach((w) => {
      const b = { id: 'ef-tmpl-natural-' + slug(w.weaponName), type: 'attack', attackMode: 'natural', natKind: 'primary', count: w.count, weaponName: w.weaponName, dice: w.dice, dmgType: w.dmgType };
      if (w.usesHands) b.usesHands = true;
      b.summary = (w.count > 1 ? w.count + ' ' : '') + w.weaponName + ' ' + w.dice + ' ' + w.dmgType.toLowerCase() + ' natural weapon (primary).';
      rec.effects.push(b);
      n++;
    });
  }
  return n;
}

function loadFeatNameMap() {
  const map = new Map();
  ['srd_feats.json', 'srd_feats_splat.json', 'srd_feats_epic.json', 'srd_feats_legacy.json'].forEach((f) => {
    const d = readChunk(f).data;
    (Array.isArray(d) ? d : (d.entries || [])).forEach((e) => {
      if (e && e.id && /^feat-/.test(e.id) && e.name && !map.has(e.name.toLowerCase())) map.set(e.name.toLowerCase(), e.id);
    });
  });
  return map;
}

// Isolated runner (does NOT re-run the full compile): rewrites only `srd_templates.json` and refreshes `srd_index.json`.
function compileTemplateBlocksOnly() {
  const t = readChunk('srd_templates.json');
  const entries = Array.isArray(t.data) ? t.data : (t.data.entries || t.data.templates);
  const n = compileTemplateBlocks(entries, loadFeatNameMap());
  const wr = writeChunk(t.fp, t.data, t.wasMinified);
  wr.count = entries.length;
  rebuildSrdIndex({ 'srd_templates.json': wr });
  return n;
}

function compileFeatPatches(featsCore, featsSplat) {
  // Ensure Hidden Talent (XPH p.67) exists in srd_feats_splat.json
  const hiddenTalent = {
    schemaVersion: 3,
    id: 'feat-hidden-talent',
    blueprint: 'feat',
    name: 'Hidden Talent',
    type: 'Feat',
    category: 'Psionic',
    source: 'Expanded Psionics Handbook p.67',
    featKind: 'feat',
    isFighterBonusFeat: false,
    prereq: '1st level only; Charisma 11',
    prereqStruct: {},
    prerequisites: 'Must be taken at 1st level; Cha 11',
    benefit: 'Your latent psionic power manifests: you gain 2 power points and learn one 1st-level psionic power from any class list (Cha-based manifesting, DC 11 + Cha mod).',
    effects: [
      statBlock('ef-ht-pp', ['psionics.powerPoints'], 2, 'Untyped')
    ],
    shortDescription: 'Gain 2 power points and know one 1st-level psionic power (Cha-based).',
    text: 'Benefit: You gain 2 power points and learn one 1st-level power from any psionic power list. Your manifester level is 1st (unless you have levels in a psionic class), and your key ability score for manifesting this power is Charisma.',
    tags: ['feat', 'psionic', 'xph'],
    scope: 'All'
  };
  upsertById(featsSplat, hiddenTalent);

  const patches = {
    // Explicit Shadow-Logic & Subsystem Feats (#68)
    'feat-shield-specialization': {
      choices: [
        {
          id: 'ch-shield-type',
          key: 'shieldType',
          label: 'Shield Type',
          options: ['Buckler', 'Light Wooden Shield', 'Light Steel Shield', 'Heavy Wooden Shield', 'Heavy Steel Shield']
        }
      ],
      effects: [
        whenBlock('ef-shspec-when', 'state', 'wieldingChosenShield', [
          statBlock('ef-shspec-ac', ['ac.shieldBonus'], 1, 'Untyped', { stacksWithShield: true })
        ])
      ]
    },
    'feat-shield-ward': {
      effects: [
        switchBlock('ef-shward', 'shieldToTouchAc', 'Apply Shield AC bonus to Touch AC and resist Bull Rush, Disarm, Grapple, Overrun, Trip', 'Shield Bonus Applies to Touch AC & Combat Maneuver Resistance')
      ]
    },
    'feat-two-weapon-defense': {
      effects: [
        whenBlock('ef-twd-when', 'state', 'wieldingTwoWeapons', [
          statBlock('ef-twd-ac', ['ac.total'], 1, 'Shield')
        ])
      ]
    },
    'feat-improved-two-weapon-defense': {
      effects: [
        whenBlock('ef-itwd-when', 'state', 'wieldingTwoWeapons', [
          statBlock('ef-itwd-ac', ['ac.total'], 2, 'Shield')
        ])
      ]
    },
    'feat-greater-two-weapon-defense': {
      effects: [
        whenBlock('ef-gtwd-when', 'state', 'wieldingTwoWeapons', [
          statBlock('ef-gtwd-ac', ['ac.total'], 3, 'Shield')
        ])
      ]
    },
    'feat-dodge': {
      effects: [
        whenBlock('ef-dodge-when', 'situational', 'vs. Designated Opponent', [
          statBlock('ef-dodge-ac', ['ac.dodge'], 1, 'Dodge')
        ])
      ]
    },
    'feat-mobility': {
      effects: [
        whenBlock('ef-mob-when', 'state', 'vsAoOFromMovement', [
          statBlock('ef-mob-ac', ['ac.dodge'], 4, 'Dodge')
        ])
      ]
    },
    'feat-weapon-finesse': {
      effects: [
        { id: 'ef-wf', type: 'stat', mode: 'replaceStat', swapTarget: 'atk.melee.abilityMod', targets: ['atk.melee.abilityMod'], subOp: 'max', fromStat: 'str', toStat: 'dex', swapScope: 'finessable', formula: '@dexMod' }
      ]
    },
    'feat-power-attack': {
      effects: [
        switchBlock('ef-pa', 'tacticalSlider', 'Enable Power Attack tactical combat slider', 'Tactical Slider: Power Attack', { slider: 'powerAttack' })
      ]
    },
    'feat-shock-trooper': {
      effects: [
        switchBlock(
          'ef-heedless-charge',
          'powerAttackPenaltyToAc',
          'Heedless Charge: When charging with a Power Attack penalty of -5 or more, shift the attack roll penalty to Armor Class instead.',
          'Heedless Charge (Power Attack >= 5 -> AC Penalty on Charge)',
          { params: { when: 'charging', minPowerAttack: 5 } }
        ),
        noteBlock('ef-directed-bull-rush', 'Directed Bull Rush: Push a foe diagonally (1 square left or right per square pushed back) on a charging Bull Rush.'),
        noteBlock('ef-domino-rush', 'Domino Rush: If a bull rushed foe is pushed into another foe, make a free trip attempt against both.')
      ]
    },
    'feat-combat-expertise': {
      effects: [
        switchBlock('ef-ce', 'tacticalSlider', 'Enable Combat Expertise tactical combat slider', 'Tactical Slider: Combat Expertise', { slider: 'combatExpertise' })
      ]
    },
    'feat-manyshot': {
      effects: [
        switchBlock('ef-ms', 'tacticalSlider', 'Enable Manyshot tactical combat slider', 'Tactical Slider: Manyshot', { slider: 'manyshot' })
      ]
    },
    'feat-monkey-grip': {
      effects: [
        switchBlock('ef-mg', 'monkeyGrip', 'Wield melee weapons one size category larger with -2 attack penalty', 'Monkey Grip: Wield +1 Size Weapon (-2 Attack)')
      ]
    },
    'feat-shadow-blade': {
      effects: [
        { id: 'ef-sb', type: 'stat', mode: 'replaceStat', swapTarget: 'dmg.melee.abilityMod', targets: ['dmg.melee.abilityMod'], subOp: 'add', fromStat: 'str', toStat: 'dex', swapScope: 'discipline_weapons', formula: '@dexMod' }
      ]
    },
    'feat-steadfast-determination': {
      effects: [
        { id: 'ef-sd-swap', type: 'stat', mode: 'replaceStat', swapTarget: 'save.will.abilityMod', targets: ['save.will.abilityMod'], subOp: 'replace', fromStat: 'wis', toStat: 'con', swapScope: 'all', formula: '@conMod' },
        switchBlock('ef-sd-nat1', 'noAutoFailFortSaveOnNat1', 'Do not automatically fail Fortitude saves on a natural 1', 'No Auto-Fail Fortitude Save on Natural 1')
      ]
    },
    'feat-natural-spell': {
      effects: [
        switchBlock('ef-ns', 'naturalSpell', 'Cast spells normally while in Wild Shape', 'Cast Spells in Wild Shape')
      ]
    },
    'feat-wild-talent': {
      effects: [
        statBlock('ef-wt-pp', ['psionics.powerPoints'], 2, 'Untyped')
      ]
    },
    'feat-bonus-essentia': {
      effects: [
        statBlock('ef-be-ess', ['incarnum.essentiaPool'], 2, 'Untyped')
      ]
    },
    'feat-expanded-soulmeld-capacity': {
      effects: [
        statBlock('ef-esc-cap', ['incarnum.capacityBonus'], 1, 'Untyped')
      ]
    },
    'feat-spell-penetration': {
      effects: [
        statBlock('ef-sp-pen', ['caster.spellPenetration'], 2, 'Untyped')
      ]
    },
    'feat-greater-spell-penetration': {
      effects: [
        statBlock('ef-gsp-pen', ['caster.spellPenetration'], 2, 'Untyped')
      ]
    },
    'feat-epic-spell-penetration': {
      effects: [
        statBlock('ef-esp-pen', ['caster.spellPenetration'], 2, 'Untyped')
      ]
    },

    // ~55+ Remaining Mechanical Core Feats in `srd_feats.json`
    'feat-psionic-dodge': {
      effects: [
        whenBlock('ef-pdodge', 'activation', 'Psionically Focused', [
          statBlock('ef-pdodge-ac', ['ac.dodge'], 1, 'Dodge')
        ])
      ]
    },
    'feat-reckless-offense': {
      effects: [
        whenBlock('ef-reckless', 'situational', 'Reckless Offense (Attack / Full Attack)', [
          statBlock('ef-reckless-atk', ['atk.melee'], 2, 'Untyped'),
          statBlock('ef-reckless-ac', ['ac.total'], -4, 'Untyped')
        ])
      ]
    },
    'feat-sharp-shooting': {
      effects: [
        noteBlock('ef-sharpshoot', 'Sharp-Shooting: Targets receive only +2 AC from cover (instead of +4)')
      ]
    },
    'feat-improved-aura-of-courage': {
      effects: [
        whenBlock('ef-iaoc', 'situational', 'vs. Fear (Aura of Courage)', [
          statBlock('ef-iaoc-save', ['save.all'], 8, 'Morale')
        ])
      ]
    },
    'feat-stunning-fist': {
      effects: [
        {
          id: 'ef-stunning-res',
          type: 'resource',
          name: 'Stunning Fist',
          varKey: 'stunning_fist_uses',
          resMode: 'spend',
          maxFormula: 'max(1, floor(@level / 4))',
          reset: 'perDay',
          unit: 'uses',
          recharge: { period: 'day' }
        },
        noteBlock('ef-stunning-note', 'Stunning Fist: Fort DC 10 + 1/2 level + WIS mod or stunned 1 round')
      ]
    },
    'feat-run': {
      effects: [
        whenBlock('ef-run-jmp', 'situational', 'After Running Start', [
          statBlock('ef-run-jump', ['skill.jump'], 4, 'Untyped')
        ]),
        noteBlock('ef-run-spd', 'Run: Move x5 speed (x4 in heavy armor); retain DEX to AC while running')
      ]
    },
    'feat-self-concealment': {
      effects: [
        { id: 'ef-self-conc', type: 'defense', mode: 'Concealment %', value: 10, text: 'Self-Concealment: 10% Miss Chance' }
      ]
    },
    'feat-improved-disarm': {
      effects: [
        noteBlock('ef-imp-disarm', 'Improved Disarm: +4 on opposed disarm rolls; no Attack of Opportunity')
      ]
    },
    'feat-improved-trip': {
      effects: [
        whenBlock('ef-imp-trip-w', 'situational', 'vs. Trip / Making Trip Check', [
          statBlock('ef-imp-trip-s', ['cmd.trip'], 4, 'Untyped')
        ]),
        noteBlock('ef-imp-trip-n', 'Improved Trip: +4 on Trip checks; immediate extra melee attack on trip; no AoO')
      ]
    },
    'feat-improved-bull-rush': {
      effects: [
        whenBlock('ef-imp-br-w', 'situational', 'vs. Bull Rush / Making Bull Rush', [
          statBlock('ef-imp-br-s', ['cmd.bullRush'], 4, 'Untyped')
        ]),
        noteBlock('ef-imp-br-n', 'Improved Bull Rush: +4 on Bull Rush checks; no AoO')
      ]
    },
    'feat-improved-overrun': {
      effects: [
        whenBlock('ef-imp-ovr-w', 'situational', 'vs. Overrun / Making Overrun', [
          statBlock('ef-imp-ovr-s', ['cmd.overrun'], 4, 'Untyped')
        ]),
        noteBlock('ef-imp-ovr-n', 'Improved Overrun: +4 on Overrun checks; target cannot avoid')
      ]
    },
    'feat-improved-sunder': {
      effects: [
        noteBlock('ef-imp-sunder', 'Improved Sunder: +4 on Sunder opposed attack rolls; no AoO')
      ]
    },
    'feat-combat-reflexes': {
      effects: [
        switchBlock('ef-combat-refl', 'combatReflexes', 'Make extra AoOs per round equal to DEX modifier; make AoOs while flat-footed', 'Combat Reflexes: Extra AoOs = DEX Mod (even Flat-Footed)')
      ]
    },
    'feat-endurance': {
      effects: [
        whenBlock('ef-endur-w', 'situational', 'vs. Exhaustion, Starvation, Cold/Hot Environments', [
          statBlock('ef-endur-s', ['save.fort'], 4, 'Untyped')
        ]),
        noteBlock('ef-endur-n', 'Endurance: Sleep in light or medium armor without fatigue')
      ]
    },
    'feat-diehard': {
      effects: [
        noteBlock('ef-diehard', 'Diehard: Auto-stabilize at -1 to -9 HP; act as disabled instead of dying')
      ]
    },
    'feat-blind-fight': {
      effects: [
        switchBlock('ef-blind-fight', 'blindFight', 'Reroll concealment miss chance; retain DEX to AC vs invisible melee attackers', 'Blind-Fight: Reroll Miss Chance; Retain DEX vs Invisible Melee')
      ]
    },
    'feat-deflect-arrows': {
      effects: [
        noteBlock('ef-deflect', 'Deflect Arrows: 1/round deflect a ranged weapon attack (no damage)')
      ]
    },
    'feat-combat-casting': {
      effects: [
        whenBlock('ef-ccast', 'situational', 'Casting Defensively / While Grappled', [
          statBlock('ef-ccast-conc', ['skill.concentration'], 4, 'Untyped')
        ])
      ]
    },
    'feat-combat-manifestation': {
      effects: [
        whenBlock('ef-cman', 'situational', 'Manifesting Defensively / While Grappled', [
          statBlock('ef-cman-conc', ['skill.concentration'], 4, 'Untyped')
        ])
      ]
    },
    'feat-psionic-affinity': {
      effects: [
        statBlock('ef-psiaff', ['skill.psicraft', 'skill.use-psionic-device'], 2, 'Untyped')
      ]
    },
    'feat-closed-mind': {
      effects: [
        whenBlock('ef-clmind', 'situational', 'vs. Psionic Powers', [
          statBlock('ef-clmind-s', ['save.all'], 2, 'Untyped')
        ])
      ]
    },
    'feat-mental-resistance': {
      effects: [
        whenBlock('ef-mres', 'situational', 'vs. Non-Energy Psionic Attacks', [
          statBlock('ef-mres-s', ['save.all'], 3, 'Untyped')
        ])
      ]
    },
    'feat-antipsionic-magic': {
      effects: [
        whenBlock('ef-antipsi', 'situational', 'vs. Psionic Creatures', [
          statBlock('ef-antipsi-pen', ['sr.penetration'], 2, 'Untyped'),
          statBlock('ef-antipsi-dc', ['spell.dc'], 2, 'Untyped')
        ])
      ]
    },
    'feat-epic-reputation': {
      effects: [
        statBlock('ef-eprep', ['skill.bluff', 'skill.diplomacy', 'skill.gather-information', 'skill.intimidate', 'skill.perform'], 4, 'Untyped')
      ]
    },
    'feat-epic-speed': {
      effects: [
        statBlock('ef-epspd', ['speed.land'], 30, 'Untyped')
      ]
    },
    'feat-damage-reduction': {
      effects: [
        { id: 'ef-feat-dr', type: 'defense', mode: 'DR', value: 3, what: '-', dr: '3/-', text: 'DR 3/—' }
      ]
    },
    'feat-legendary-wrestler': {
      effects: [
        statBlock('ef-legwrest', ['grapple'], 10, 'Untyped')
      ]
    },
    'feat-improved-aura-of-despair': {
      effects: [
        noteBlock('ef-iaod', 'Improved Aura of Despair: Aura imposes -4 morale penalty on enemy saving throws')
      ]
    },
    'feat-extra-music': {
      effects: [
        {
          id: 'ef-extramus-res',
          type: 'resource',
          name: 'Extra Bardic Music',
          varKey: 'extra_bardic_music',
          resMode: 'spend',
          maxFormula: '4',
          reset: 'perDay',
          unit: 'uses',
          recharge: { period: 'day' }
        }
      ]
    },
    'feat-improved-sneak-attack': {
      effects: [
        whenBlock('ef-impsa-w', 'state', 'sneakAttack', [
          {
            id: 'ef-impsa-r',
            type: 'roll',
            kind: 'Damage',
            dice: '1d6',
            dmgType: 'Precision',
            crit: 'normal',
            multiplyOnCrit: false,
            source: 'Improved Sneak Attack'
          }
        ])
      ]
    },
    'feat-sidestep-charge': {
      effects: [
        whenBlock('ef-sidestep', 'situational', 'vs. Charging Attack', [
          statBlock('ef-sidestep-ac', ['ac.dodge'], 4, 'Dodge')
        ])
      ]
    },
    'feat-psionic-talent': {
      effects: [
        statBlock('ef-psital-pp', ['psionics.powerPoints'], 2, 'Untyped')
      ]
    },
    'feat-power-critical': {
      effects: [
        whenBlock('ef-powcrit', 'state', 'wieldingChosenWeapon', [
          statBlock('ef-powcrit-atk', ['atk.critConfirm'], 4, 'Untyped')
        ])
      ]
    },
    'feat-eyes-in-the-back-of-your-head': {
      effects: [
        noteBlock('ef-eyesback', 'Eyes in the Back of Your Head: Attackers gain no +2 flanking attack bonus against you')
      ]
    },
    'feat-precise-shot': {
      effects: [
        switchBlock('ef-precshot', 'preciseShot', 'No -4 penalty for shooting ranged weapons into melee', 'Precise Shot: No -4 Penalty into Melee')
      ]
    },
    'feat-rapid-shot': {
      effects: [
        switchBlock('ef-rapshot', 'rapidShot', '+1 extra ranged attack on full attack (-2 penalty to all ranged attacks)', 'Rapid Shot: +1 Extra Attack (-2 All Ranged)')
      ]
    },
    'feat-far-shot': {
      effects: [
        switchBlock('ef-farshot', 'farShot', '+50% projectile range increment (+100% thrown range increment)', 'Far Shot: +50% Projectile / +100% Thrown Range')
      ]
    },
    'feat-improved-critical': {
      effects: [
        switchBlock('ef-impcrit', 'improvedCritical', 'Double critical threat range of chosen weapon', 'Improved Critical: 2x Threat Range')
      ]
    },
    'feat-two-weapon-fighting': {
      effects: [
        switchBlock('ef-twf', 'twoWeaponFighting', 'Reduce two-weapon fighting penalties (-2/-2 with light off-hand)', 'Two-Weapon Fighting: Reduced Off-Hand Penalties')
      ]
    },
    'feat-improved-two-weapon-fighting': {
      effects: [
        switchBlock('ef-itwf', 'improvedTwoWeaponFighting', 'Gain a second off-hand attack at -5 penalty', 'Improved TWF: +1 Off-Hand Attack (-5)')
      ]
    },
    'feat-greater-two-weapon-fighting': {
      effects: [
        switchBlock('ef-gtwf', 'greaterTwoWeaponFighting', 'Gain a third off-hand attack at -10 penalty', 'Greater TWF: +1 Off-Hand Attack (-10)')
      ]
    },
    'feat-improved-shield-bash': {
      effects: [
        switchBlock('ef-ishbash', 'improvedShieldBash', 'Retain shield AC bonus when performing a shield bash', 'Improved Shield Bash: Retain Shield AC')
      ]
    },
    'feat-agile-shield-fighter': {
      effects: [
        switchBlock('ef-asf', 'agileShieldFighter', 'Shield bash + armed strike at flat -2/-2 penalty', 'Agile Shield Fighter: Flat -2/-2 Shield Bash')
      ]
    },
    'feat-spirited-charge': {
      effects: [
        switchBlock('ef-spcharge', 'spiritedCharge', 'Deal x2 melee damage (x3 lance) on mounted charge', 'Spirited Charge: 2x Charge Damage (3x Lance)')
      ]
    },
    'feat-mounted-combat': {
      effects: [
        switchBlock('ef-mcombat', 'mountedCombat', '1/round negate hit on mount with Ride check', 'Mounted Combat: Negate Hit on Mount (Ride)')
      ]
    },
    'feat-mounted-archery': {
      effects: [
        noteBlock('ef-marchery', 'Mounted Archery: Halve ranged penalties while mounted (-2 double move, -4 run)')
      ]
    },
    'feat-empower-spell': {
      effects: [{ id: 'ef-mm-empower', type: 'carrier', carrierMode: 'metamagic', slotAdj: 2, transform: 'empower', costMode: 'slot', label: 'Empower Spell (+2 Slot Level: +50% Variable Numeric Spell Effects)' }]
    },
    'feat-maximize-spell': {
      effects: [{ id: 'ef-mm-max', type: 'carrier', carrierMode: 'metamagic', slotAdj: 3, transform: 'maximize', costMode: 'slot', label: 'Maximize Spell (+3 Slot Level: Maximize Variable Numeric Spell Effects)' }]
    },
    'feat-quicken-spell': {
      effects: [{ id: 'ef-mm-quick', type: 'carrier', carrierMode: 'metamagic', slotAdj: 4, transform: 'quicken', costMode: 'slot', label: 'Quicken Spell (+4 Slot Level: Cast as a Swift Action)' }]
    },
    'feat-extend-spell': {
      effects: [{ id: 'ef-mm-extend', type: 'carrier', carrierMode: 'metamagic', slotAdj: 1, transform: 'extend', costMode: 'slot', label: 'Extend Spell (+1 Slot Level: Double Spell Duration)' }]
    },
    'feat-silent-spell': {
      effects: [{ id: 'ef-mm-silent', type: 'carrier', carrierMode: 'metamagic', slotAdj: 1, transform: 'silent', costMode: 'slot', label: 'Silent Spell (+1 Slot Level: Cast Without Verbal Components)' }]
    },
    'feat-still-spell': {
      effects: [{ id: 'ef-mm-still', type: 'carrier', carrierMode: 'metamagic', slotAdj: 1, transform: 'still', costMode: 'slot', label: 'Still Spell (+1 Slot Level: Cast Without Somatic Components)' }]
    },
    'feat-heighten-spell': {
      effects: [{ id: 'ef-mm-heighten', type: 'carrier', carrierMode: 'metamagic', slotAdj: 'variable', transform: 'heighten', costMode: 'slot', label: 'Heighten Spell (Variable Slot Level: Increase Effective Spell Level & Save DC)' }]
    },
    'feat-widen-spell': {
      effects: [{ id: 'ef-mm-widen', type: 'carrier', carrierMode: 'metamagic', slotAdj: 3, transform: 'widen', costMode: 'slot', label: 'Widen Spell (+3 Slot Level: Double Burst, Emanation, Line, or Spread Area)' }]
    },
    'feat-practiced-spellcaster': {
      effects: [noteBlock('ef-prac-cast', 'Practiced Spellcaster: +4 Caster Level (capped at Character Level / HD)')]
    },
    'feat-arcane-strike': {
      effects: [noteBlock('ef-arc-strike', 'Arcane Strike: Sacrifice arcane slot (level L) -> +L melee attack & +Ld4 melee damage (1 rd)')]
    },
    'feat-snap-kick': {
      effects: [noteBlock('ef-snap-kick', 'Snap Kick: +1 extra unarmed attack (-2 on all attacks) during melee attack action')]
    },
    'feat-stone-power': {
      effects: [noteBlock('ef-stone-pow', 'Stone Power: Trade up to -5 melee attack (max BAB) for 2 x penalty Temp HP')]
    },
    'feat-leap-attack': {
      effects: [noteBlock('ef-leap-atk', 'Leap Attack: 10+ ft. Jump on charge doubles Power Attack bonus damage')]
    },
    'feat-ability-focus-eldritch-blast': {
      effects: [
        whenBlock('ef-afeb', 'situational', 'Eldritch Blast', [
          statBlock('ef-afeb-dc', ['spell.dc'], 2, 'Untyped')
        ])
      ]
    },
    'feat-mortal-bane': {
      effects: [
        {
          id: 'ef-mbane-res',
          type: 'resource',
          name: 'Mortal Bane',
          varKey: 'mortal_bane_uses',
          resMode: 'spend',
          maxFormula: '5',
          reset: 'perDay',
          unit: 'uses',
          recharge: { period: 'day' }
        },
        whenBlock('ef-mbane-w', 'situational', 'vs. Living Non-Outsider/Construct/Undead (SLA)', [
          { id: 'ef-mbane-r', type: 'roll', kind: 'Damage', dice: '2d6', dmgType: 'Untyped', crit: 'normal', multiplyOnCrit: false, source: 'Mortal Bane' }
        ])
      ]
    },
    'feat-power-penetration': {
      effects: [
        whenBlock('ef-powpen', 'activation', 'Expending Psionic Focus', [
          statBlock('ef-powpen-s', ['sr.penetration'], 4, 'Untyped')
        ])
      ]
    },
    'feat-greater-power-penetration': {
      effects: [
        whenBlock('ef-gpowpen', 'activation', 'Expending Psionic Focus', [
          statBlock('ef-gpowpen-s', ['sr.penetration'], 4, 'Untyped')
        ])
      ]
    },
    'feat-inquisitor': {
      effects: [
        whenBlock('ef-inq', 'activation', 'Expending Psionic Focus', [
          statBlock('ef-inq-s', ['skill.sense-motive'], 10, 'Untyped')
        ])
      ]
    },
    'feat-mental-leap': {
      effects: [
        whenBlock('ef-mleap', 'activation', 'Expending Psionic Focus', [
          statBlock('ef-mleap-s', ['skill.jump'], 10, 'Untyped')
        ])
      ]
    },
    'feat-rapid-metabolism': {
      effects: [noteBlock('ef-rapmet', 'Rapid Metabolism: Natural healing/day = 2 x (level + CON mod)')]
    },
    'feat-cleave': {
      effects: [noteBlock('ef-cleave', 'Cleave: Drop foe -> immediate extra melee attack against adjacent foe (1/rd)')]
    },
    'feat-great-cleave': {
      effects: [noteBlock('ef-gcleave', 'Great Cleave: Unlimited Cleave follow-up melee attacks per round')]
    },
    'feat-whirlwind-attack': {
      effects: [noteBlock('ef-whirl', 'Whirlwind Attack: Full attack -> 1 melee attack at full BAB against every adjacent foe')]
    },
    'feat-spring-attack': {
      effects: [noteBlock('ef-spring', 'Spring Attack: Move before & after single melee attack without provoking AoO from target')]
    },
    'feat-shot-on-the-run': {
      effects: [noteBlock('ef-sotr', 'Shot on the Run: Move before & after single ranged attack')]
    },
    'feat-improved-precise-shot': {
      effects: [noteBlock('ef-ips', 'Improved Precise Shot: Ignore less than total cover & less than total concealment')]
    },
    'feat-improved-feint': {
      effects: [noteBlock('ef-impfeint', 'Improved Feint: Feint in combat (Bluff) as a Move action')]
    },
    'feat-improved-unarmed-strike': {
      effects: [noteBlock('ef-ius', 'Improved Unarmed Strike: Considered armed; deal lethal or nonlethal damage without AoO')]
    },
    'feat-track': {
      effects: [noteBlock('ef-track', 'Track: Follow tracks with Survival checks (DC by surface/conditions)')]
    },
    'feat-eschew-materials': {
      effects: [noteBlock('ef-eschew', 'Eschew Materials: Cast spells without material components costing 1 gp or less')]
    },
    'feat-armor-proficiency-light': {
      effects: [noteBlock('ef-apl', 'Armor Proficiency (Light): No armor check penalty on attack rolls in light armor')]
    },
    'feat-armor-proficiency-medium': {
      effects: [noteBlock('ef-apm', 'Armor Proficiency (Medium): No armor check penalty on attack rolls in medium armor')]
    },
    'feat-armor-proficiency-heavy': {
      effects: [noteBlock('ef-aph', 'Armor Proficiency (Heavy): No armor check penalty on attack rolls in heavy armor')]
    },
    'feat-shield-proficiency': {
      effects: [noteBlock('ef-shprof', 'Shield Proficiency: No shield check penalty on attack rolls with bucklers/light/heavy shields')]
    },
    'feat-tower-shield-proficiency': {
      effects: [noteBlock('ef-tshprof', 'Tower Shield Proficiency: Use tower shields without shield check penalty on attacks')]
    },
    'feat-simple-weapon-proficiency': {
      effects: [noteBlock('ef-swprof', 'Simple Weapon Proficiency: No -4 nonproficiency penalty with simple weapons')]
    },
    'feat-martial-weapon-proficiency-all': {
      effects: [noteBlock('ef-mwprof', 'Martial Weapon Proficiency (All): No -4 nonproficiency penalty with martial weapons')]
    },
    'feat-bullet-time': undefined
  };

  let count = 0;
  for (const list of [featsCore, featsSplat]) {
    for (const f of list) {
      if (!f || !f.id) continue;
      const p = patches[f.id];
      if (!p) continue;
      if (p.choices) f.choices = p.choices;
      if (p.effects) f.effects = p.effects;
      count++;
    }
  }
  return count;
}

function compileDomainPatches(domains) {
  const patches = {
    'dom-air': [
      { id: 'ef-dom-air-res', type: 'resource', name: 'Turn Earth / Rebuke Air', varKey: 'domain_air_uses', resMode: 'spend', maxFormula: '3 + max(0, @chaMod)', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-air-n', 'Turn or destroy Earth creatures; rebuke or command Air creatures (3 + CHA mod/day)')
    ],
    'dom-earth': [
      { id: 'ef-dom-earth-res', type: 'resource', name: 'Turn Air / Rebuke Earth', varKey: 'domain_earth_uses', resMode: 'spend', maxFormula: '3 + max(0, @chaMod)', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-earth-n', 'Turn or destroy Air creatures; rebuke or command Earth creatures (3 + CHA mod/day)')
    ],
    'dom-fire': [
      { id: 'ef-dom-fire-res', type: 'resource', name: 'Turn Water / Rebuke Fire', varKey: 'domain_fire_uses', resMode: 'spend', maxFormula: '3 + max(0, @chaMod)', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-fire-n', 'Turn or destroy Water creatures; rebuke or command Fire creatures (3 + CHA mod/day)')
    ],
    'dom-water': [
      { id: 'ef-dom-water-res', type: 'resource', name: 'Turn Fire / Rebuke Water', varKey: 'domain_water_uses', resMode: 'spend', maxFormula: '3 + max(0, @chaMod)', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-water-n', 'Turn or destroy Fire creatures; rebuke or command Water creatures (3 + CHA mod/day)')
    ],
    'dom-plant': [
      { id: 'ef-dom-plant-res', type: 'resource', name: 'Rebuke Plants', varKey: 'domain_plant_uses', resMode: 'spend', maxFormula: '3 + max(0, @chaMod)', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-plant-n', 'Rebuke or command plant creatures (3 + CHA mod/day); Knowledge (nature) is a class skill')
    ],
    'dom-scalykind': [
      { id: 'ef-dom-scaly-res', type: 'resource', name: 'Rebuke Reptilian/Snakes', varKey: 'domain_scalykind_uses', resMode: 'spend', maxFormula: '3 + max(0, @chaMod)', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-scaly-n', 'Rebuke or command reptilian creatures and snakes (3 + CHA mod/day)')
    ],
    'dom-animal': [
      { id: 'ef-dom-anim-res', type: 'resource', name: 'Speak with Animals (SLA)', varKey: 'domain_animal_sla', resMode: 'spend', maxFormula: '1', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-anim-n', 'Speak with Animals 1/day (SLA); Knowledge (nature) is a class skill')
    ],
    'dom-death': [
      { id: 'ef-dom-death-res', type: 'resource', name: 'Death Touch', varKey: 'domain_death_touch', resMode: 'spend', maxFormula: '1', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-death-n', 'Death Touch 1/day (Su): Melee touch, roll 1d6/Cleric level; kills living creature if >= current HP')
    ],
    'dom-repose': [
      { id: 'ef-dom-rep-res', type: 'resource', name: 'Death Touch (Repose)', varKey: 'domain_repose_touch', resMode: 'spend', maxFormula: '1', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-rep-n', 'Death Touch 1/day (Su): Melee touch, roll 1d6/Cleric level vs current HP')
    ],
    'dom-destruction': [
      { id: 'ef-dom-dest-res', type: 'resource', name: 'Smite (Destruction)', varKey: 'domain_destruction_smite', resMode: 'spend', maxFormula: '1', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-dest-n', 'Smite 1/day (Su): Single melee attack with +4 attack and +Cleric level damage')
    ],
    'dom-luck': [
      { id: 'ef-dom-luck-res', type: 'resource', name: 'Good Fortune', varKey: 'domain_luck_reroll', resMode: 'spend', maxFormula: '1', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-luck-n', 'Good Fortune 1/day (Ex): Reroll one roll before result is declared')
    ],
    'dom-magic': [
      noteBlock('ef-dom-magic-n', 'Use scrolls, wands, and spell-completion/trigger items as a Wizard of 1/2 Cleric level (min 1)')
    ],
    'dom-strength': [
      { id: 'ef-dom-str-res', type: 'resource', name: 'Feat of Strength', varKey: 'domain_strength_uses', resMode: 'spend', maxFormula: '1', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-str-n', 'Feat of Strength 1/day (Su): +Cleric level Enhancement bonus to Strength for 1 round')
    ],
    'dom-sun': [
      { id: 'ef-dom-sun-res', type: 'resource', name: 'Greater Turning', varKey: 'domain_sun_greater', resMode: 'spend', maxFormula: '1', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-sun-n', 'Greater Turning 1/day: Undead that would be turned are destroyed instead')
    ],
    'dom-travel': [
      { id: 'ef-dom-trav-res', type: 'resource', name: 'Freedom of Movement (Domain)', varKey: 'domain_travel_rounds', resMode: 'spend', maxFormula: '@cl', reset: 'perDay', unit: 'rounds', recharge: { period: 'day' } },
      noteBlock('ef-dom-trav-n', 'Freedom of Movement 1 round/Cleric level per day (Su); Survival is a class skill')
    ],
    'dom-trickery': [
      noteBlock('ef-dom-trick-n', 'Class Skills: Bluff, Disguise, and Hide are Cleric class skills')
    ],
    'dom-war': [
      { id: 'ef-dom-war-grant', type: 'effect', effectKind: 'grant', targetId: 'feat-martial-weapon-proficiency', text: 'Grants Martial Weapon Proficiency & Weapon Focus with deity favored weapon' }
    ],
    'dom-charm': [
      { id: 'ef-dom-charm-res', type: 'resource', name: 'Charm Boost (+4 CHA)', varKey: 'domain_charm_boost', resMode: 'spend', maxFormula: '1', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-charm-n', 'Charm Boost 1/day (free action): +4 Charisma for 1 minute')
    ],
    'dom-darkness': [
      { id: 'ef-dom-dark-grant', type: 'effect', effectKind: 'grant', targetId: 'feat-blind-fight', text: 'Grants Blind-Fight as a bonus feat' }
    ],
    'dom-madness': [
      noteBlock('ef-dom-mad-n', 'Insanity Score: +1/2 Cleric level to WIS for spellcasting DCs & bonus spells; -1/2 level penalty to Wisdom checks & Will saves')
    ],
    'dom-nobility': [
      { id: 'ef-dom-nob-res', type: 'resource', name: 'Inspire Allies', varKey: 'domain_nobility_inspire', resMode: 'spend', maxFormula: '1', reset: 'perDay', unit: 'uses', recharge: { period: 'day' } },
      noteBlock('ef-dom-nob-n', 'Inspire Allies 1/day (SLA, CHA mod rounds): +2 Morale bonus on saves, attacks, ability/skill checks, and weapon damage')
    ],
    'dom-rune': [
      { id: 'ef-dom-rune-grant', type: 'effect', effectKind: 'grant', targetId: 'feat-scribe-scroll', text: 'Grants Scribe Scroll as a bonus feat' }
    ],
    'dom-weather': [
      noteBlock('ef-dom-weath-n', 'Class Skill: Survival is a Cleric class skill')
    ],
    'dom-dragon': [
      noteBlock('ef-dom-drag-n', 'Class Skills: Bluff and Intimidate are Cleric class skills')
    ]
  };

  let count = 0;
  for (const d of domains) {
    if (d && d.id && patches[d.id] && (!Array.isArray(d.effects) || d.effects.length === 0)) {
      d.effects = patches[d.id];
      count++;
    }
  }
  return count;
}

function compileSpellPatches(spells) {
  // Strictly mechanical combat/defense/damage spells that currently have effects: []
  // Narrative/utility spells (Teleport, Wish, Speak with Dead, etc.) are intentionally untouched.
  const patches = {
    'spl-stoneskin': [
      {
        id: 'ef-stoneskin-dr',
        type: 'defense',
        mode: 'DR',
        value: 10,
        what: 'adamantine',
        dr: '10/adamantine',
        poolFormula: 'min(150, @cl * 10)',
        text: 'DR 10/adamantine (absorbs up to min(150, 10 x CL) total damage)'
      }
    ],
    'spl-bless-weapon': [
      switchBlock('ef-bless-weapon', 'blessWeapon', 'Weapon counts as good-aligned (bypasses DR/good) and auto-confirms critical threats vs. evil foes', 'Bless Weapon: Good-Aligned & Auto-Confirm Crits vs. Evil')
    ],
    'spl-faerie-fire': [
      switchBlock('ef-faerie-fire', 'negatesConcealment', 'Outlines subjects in pale glow, negating blur, displacement, invisibility, and concealment', 'Faerie Fire: Negates Blur/Displacement/Invisibility/Concealment')
    ],
    'spl-shocking-grasp': [
      {
        id: 'ef-shocking-grasp',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Electricity',
        crit: 'multiply',
        multiplyOnCrit: true,
        touch: true,
        dice: 'min(5, @cl)d6',
        count: 1,
        die: 'd6',
        scaling: 'formula',
        source: 'Shocking Grasp'
      }
    ],
    'spl-lightning-bolt': [
      {
        id: 'ef-lightning-bolt',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Electricity',
        crit: 'normal',
        multiplyOnCrit: false,
        saveType: 'Reflex',
        save: 'Reflex half',
        dice: 'min(10, @cl)d6',
        count: 1,
        die: 'd6',
        scaling: 'formula',
        source: 'Lightning Bolt'
      }
    ],
    'spl-polar-ray': [
      {
        id: 'ef-polar-ray',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Cold',
        crit: 'multiply',
        multiplyOnCrit: true,
        touch: true,
        dice: 'min(25, @cl)d6',
        count: 1,
        die: 'd6',
        scaling: 'formula',
        source: 'Polar Ray'
      }
    ],
    'spl-searing-light': [
      {
        id: 'ef-searing-light',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Untyped',
        crit: 'multiply',
        multiplyOnCrit: true,
        touch: true,
        dice: 'min(5, max(1, floor(@cl / 2)))d8',
        count: 1,
        die: 'd8',
        scaling: 'formula',
        source: 'Searing Light'
      },
      noteBlock('ef-searing-undead', 'Searing Light: 1d6/CL (max 10d6) vs. undead; 1d8/CL (max 10d8) vs. undead vulnerable to bright light')
    ],
    'spl-ray-of-enfeeblement': [
      {
        id: 'ef-ray-enfeeble',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'STR Penalty',
        crit: 'normal',
        multiplyOnCrit: false,
        touch: true,
        dice: '1d6+min(5, floor(@cl / 2))',
        count: 1,
        die: 'd6',
        scaling: 'formula',
        source: 'Ray of Enfeeblement'
      }
    ],
    'spl-vampiric-touch': [
      {
        id: 'ef-vamp-touch',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Untyped',
        crit: 'multiply',
        multiplyOnCrit: true,
        touch: true,
        dice: 'min(10, max(1, floor(@cl / 2)))d6',
        count: 1,
        die: 'd6',
        scaling: 'formula',
        source: 'Vampiric Touch'
      },
      noteBlock('ef-vamp-touch-thp', 'Caster gains temporary HP equal to damage dealt (lasts 1 hour)')
    ],
    'spl-chill-touch': [
      {
        id: 'ef-chill-touch',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Negative Energy',
        crit: 'multiply',
        multiplyOnCrit: true,
        touch: true,
        dice: '1d6',
        count: 1,
        die: 'd6',
        scaling: 'flat',
        source: 'Chill Touch'
      },
      noteBlock('ef-chill-touch-str', '1 touch/CL: deals 1d6 damage + 1 STR damage (Fort negates STR damage; undead flee on failed Will save)')
    ],
    'spl-fire-shield': [
      {
        id: 'ef-fire-shield-dmg',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Fire',
        crit: 'normal',
        multiplyOnCrit: false,
        dice: '1d6+min(15, @cl)',
        count: 1,
        die: 'd6',
        scaling: 'formula',
        source: 'Fire Shield (Retaliation)'
      },
      noteBlock('ef-fire-shield-prot', 'Melee attackers take 1d6 + CL (max +15) Fire/Cold damage; half damage (none on save) from opposing energy')
    ],
    'spl-blade-barrier': [
      {
        id: 'ef-blade-barrier',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Slashing',
        crit: 'normal',
        multiplyOnCrit: false,
        saveType: 'Reflex',
        save: 'Reflex half',
        dice: 'min(15, @cl)d6',
        count: 1,
        die: 'd6',
        scaling: 'formula',
        source: 'Blade Barrier'
      }
    ],
    'spl-meteor-swarm': [
      {
        id: 'ef-meteor-swarm-bludg',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Bludgeoning',
        crit: 'multiply',
        multiplyOnCrit: true,
        touch: true,
        dice: '2d6',
        count: 2,
        die: 'd6',
        scaling: 'flat',
        source: 'Meteor Swarm (Sphere Impact)'
      },
      {
        id: 'ef-meteor-swarm-fire',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Fire',
        crit: 'normal',
        multiplyOnCrit: false,
        saveType: 'Reflex',
        save: 'Reflex half',
        dice: '6d6',
        count: 6,
        die: 'd6',
        scaling: 'flat',
        source: 'Meteor Swarm (Fire Explosion x4)'
      }
    ],
    'spl-sound-burst': [
      {
        id: 'ef-sound-burst',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Sonic',
        crit: 'normal',
        multiplyOnCrit: false,
        saveType: 'Fortitude',
        save: 'Fortitude negates stun',
        dice: '1d8',
        count: 1,
        die: 'd8',
        scaling: 'flat',
        source: 'Sound Burst'
      }
    ],
    'spl-sunburst': [
      {
        id: 'ef-sunburst',
        type: 'roll',
        kind: 'Damage',
        dmgType: 'Untyped',
        crit: 'normal',
        multiplyOnCrit: false,
        saveType: 'Reflex',
        save: 'Reflex partial',
        dice: '6d6',
        count: 6,
        die: 'd6',
        scaling: 'flat',
        source: 'Sunburst'
      },
      noteBlock('ef-sunburst-undead', 'Blinds targets (Reflex negates); deals min(25, @cl)d6 damage to undead and light-vulnerable creatures')
    ]
  };

  let count = 0;
  for (const s of spells) {
    if (s && s.id && patches[s.id]) {
      s.effects = patches[s.id];
      count++;
    }
  }
  return count;
}

function buildIndexRow(entry, chunkFile) {
  const row = {
    id: entry.id,
    n: entry.name,
    t: entry.type || 'Feat',
    c: entry.school || entry.category || 'General',
    s: entry.slot || 'None',
    f: chunkFile
  };
  if (entry.level !== undefined) row.l = entry.level;
  else if (entry.crNumeric !== undefined) row.l = entry.crNumeric;
  return row;
}

function rebuildSrdIndex(updatedChunkMeta) {
  const idxPath = path.join(DB_DIR, 'srd_index.json');
  const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
  const newChunksMeta = {};
  const newIndexRows = [];
  let totalEntries = 0;

  for (const [chunkFile, oldMeta] of Object.entries(idx.chunks || {})) {
    const fp = path.join(DB_DIR, chunkFile);
    const buf = fs.readFileSync(fp);
    const parsed = JSON.parse(buf.toString('utf8'));
    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);

    if (chunkFile === 'srd_companions.json') {
      newChunksMeta[chunkFile] = Object.assign({}, oldMeta, { count: 1, bytes: buf.length, hash });
    } else {
      const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed && parsed.entries) ? parsed.entries : []);
      const count = list.length;
      totalEntries += count;
      newChunksMeta[chunkFile] = Object.assign({}, oldMeta, updatedChunkMeta[chunkFile] || {}, { count, bytes: buf.length, hash });
      for (const e of list) {
        newIndexRows.push(buildIndexRow(e, chunkFile));
      }
    }
  }

  const combinedHashes = Object.keys(newChunksMeta).sort().map((k) => `${k}:${newChunksMeta[k].hash}`).join('|');
  const compendiumHash = crypto.createHash('sha256').update(combinedHashes).digest('hex').slice(0, 16);

  const outIndex = {
    schemaVersion: 3,
    version: '3.0.0',
    compendiumHash,
    generatedAt: idx.generatedAt || '2026-11-15T00:00:00.000Z',
    totalEntries,
    chunks: newChunksMeta,
    index: newIndexRows
  };
  fs.writeFileSync(idxPath, Buffer.from(JSON.stringify(outIndex, null, 2) + '\n', 'utf8'));
  return { totalEntries, compendiumHash };
}

function compileEquipmentPotions(eqData) {
  const POTION_PATCHES = {
    'pot-cure-minor-wounds': [
      { type: 'roll', kind: 'Healing', count: 1, die: 'flat', flat: 0, scaling: 'flat' }
    ],
    'pot-cure-light-wounds': [
      { type: 'roll', kind: 'Healing', count: 1, die: 'd8', flat: 1, scaling: 'flat' }
    ],
    'pot-cure-moderate-wounds': [
      { type: 'roll', kind: 'Healing', count: 2, die: 'd8', flat: 3, scaling: 'flat' }
    ],
    'pot-cure-serious-wounds': [
      { type: 'roll', kind: 'Healing', count: 3, die: 'd8', flat: 5, scaling: 'flat' }
    ],
    'pot-cure-critical-wounds': [
      { type: 'roll', kind: 'Healing', count: 4, die: 'd8', flat: 7, scaling: 'flat' }
    ],
    'pot-heal': [
      { type: 'roll', kind: 'Healing', count: 110, die: 'flat', flat: 0, scaling: 'flat' },
      { type: 'effect', effectKind: 'rule', text: 'Ends ability damage, blinded, confused, dazed, dazzled, deafened, diseased, exhausted, fatigued, feebleminded, insanity, nauseated, sickened, stunned, and poisoned.' }
    ],
    'pot-heal-greater': [
      { type: 'roll', kind: 'Healing', count: 150, die: 'flat', flat: 0, scaling: 'flat' },
      { type: 'effect', effectKind: 'rule', text: 'Ends ability damage, blinded, confused, dazed, dazzled, deafened, diseased, exhausted, fatigued, feebleminded, insanity, nauseated, sickened, stunned, and poisoned.' }
    ],
    'pot-lesser-restoration': [
      { type: 'effect', effectKind: 'rule', text: 'Cures 1d4 points of temporary ability damage to one ability score and eliminates fatigue (or reduces exhaustion to fatigue).' }
    ],
    'pot-remove-paralysis': [
      { type: 'effect', effectKind: 'rule', text: 'Frees drinker from temporary paralysis, hold, or slow effects.' }
    ],
    'pot-remove-blindness-deafness': [
      { type: 'effect', effectKind: 'rule', text: 'Cures blindness or deafness (normal or magical).' }
    ],
    'pot-remove-curse': [
      { type: 'effect', effectKind: 'rule', text: 'Instantaneously removes all curses on the drinker.' }
    ],
    'pot-remove-disease': [
      { type: 'effect', effectKind: 'rule', text: 'Cures all diseases affecting the drinker.' }
    ],
    'pot-neutralize-poison': [
      { type: 'defense', mode: 'Immunity', what: 'Poison' },
      { type: 'effect', effectKind: 'rule', text: 'Detoxifies venom in drinker and grants temporary immunity to poison for 50 minutes (CL 5th).' }
    ],
    'pot-delay-poison': [
      { type: 'defense', mode: 'Immunity', what: 'Poison' }
    ],
    'pot-resist-energy-10': [
      { type: 'defense', mode: 'Energy Resistance', what: '@Choice', value: 10 }
    ],
    'pot-resist-energy-20': [
      { type: 'defense', mode: 'Energy Resistance', what: '@Choice', value: 20 }
    ],
    'pot-resist-energy-30': [
      { type: 'defense', mode: 'Energy Resistance', what: '@Choice', value: 30 }
    ],
    'pot-protection-from-energy': [
      { type: 'effect', effectKind: 'rule', text: 'Absorbs up to 60 points of damage from the specified energy type (50 minutes, CL 5th).' }
    ],
    'pot-endure-elements': [
      { type: 'effect', effectKind: 'rule', text: 'Protects against hot and cold environments (-50°F to 140°F) for 24 hours.' }
    ],
    'pot-sanctuary': [
      { type: 'effect', effectKind: 'rule', text: 'Opponents must succeed on a Will save (DC 11) to directly attack the warded drinker (1 round, CL 1st).' }
    ],
    'oil-magic-weapon': [
      { type: 'stat', targets: ['atk.weapon', 'dmg.weapon'], mode: 'flat', value: 1, btype: 'Enhancement' }
    ],
    'oil-greater-magic-weapon-plus-2': [
      { type: 'stat', targets: ['atk.weapon', 'dmg.weapon'], mode: 'flat', value: 2, btype: 'Enhancement' }
    ],
    'oil-greater-magic-weapon-plus-3': [
      { type: 'stat', targets: ['atk.weapon', 'dmg.weapon'], mode: 'flat', value: 3, btype: 'Enhancement' }
    ],
    'oil-keen-edge': [
      { type: 'effect', effectKind: 'ruleSwitch', flag: 'keen', text: 'Doubles critical threat range of piercing or slashing weapon (50 minutes, CL 5th).' }
    ],
    'oil-bless-weapon': [
      { type: 'effect', effectKind: 'ruleSwitch', flag: 'autoConfirmCritVsEvil', text: 'Weapon becomes good-aligned and automatically confirms critical threats against evil foes (2 minutes, CL 2nd).' }
    ]
  };
  const ENERGY_POTION_IDS = new Set(['pot-resist-energy-10', 'pot-resist-energy-20', 'pot-resist-energy-30', 'pot-protection-from-energy']);
  let patched = 0;
  for (const e of eqData) {
    if (!e || !e.id || !POTION_PATCHES[e.id]) continue;
    e.schemaVersion = 3;
    e.effects = POTION_PATCHES[e.id];
    if (ENERGY_POTION_IDS.has(e.id)) {
      e.choices = [{ id: 'ch-energy', key: 'energy', label: 'Energy Type', options: ['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic'] }];
    }
    patched++;
  }
  return patched;
}

function main() {
  const t0 = Date.now();
  const cr = readChunk('srd_classes_races.json');
  const cs = readChunk('srd_classes_splat.json');
  const fc = readChunk('srd_feats.json');
  const fsChunk = readChunk('srd_feats_splat.json');
  const dom = readChunk('srd_domains.json');
  const spl = readChunk('srd_spells.json');
  const eq = readChunk('srd_equipment.json');

  // A. Variant Classes
  const variantRes = compileVariantClasses(cr.data);

  // B. ClassAbility records & feature ID linking
  const cabSpecs = buildClassAbilitySpecs();
  let cabCreated = 0;
  let cabUpdated = 0;
  for (const spec of cabSpecs) {
    const res = upsertById(cr.data, spec);
    if (res === 'created') cabCreated++;
    else cabUpdated++;
  }
  const cabExistingEnriched = enrichExistingClassAbilities(cr.data);
  const raceProfCount = compileRaceProficiencies(cr.data);
  compileRaceManeuvers(cr.data);
  compileRaceBonusFeats(cr.data);
  compileRaceNaturalWeapons(cr.data);

  const cabLookup = new Map();
  for (const e of cr.data) {
    if (e && e.type === 'ClassAbility' && e.name) {
      const clean = String(e.name).replace(/\s*\((Ex|Su|Sp)\)\s*$/i, '').trim().toLowerCase();
      cabLookup.set(clean, e.id);
    }
  }
  const linkedCore = linkClassFeatureIds(cr.data, cabLookup);
  const linkedSplat = linkClassFeatureIds(cs.data, cabLookup);

  // C. Feats, Domains, Spells, Equipment Potions
  const featsPatched = compileFeatPatches(fc.data, fsChunk.data);
  const domainsPatched = compileDomainPatches(dom.data);
  const spellsPatched = compileSpellPatches(spl.data);
  const potionsPatched = compileEquipmentPotions(eq.data);

  // E. Complete Corpus V3 Conversion (Grup A + B + C across all open chunks + global dialect normalization)
  const feEpic = readChunk('srd_feats_epic.json');
  const feLegacy = readChunk('srd_feats_legacy.json');
  const cndChunk = readChunk('srd_combat_rules.json');
  const manChunk = readChunk('srd_maneuvers.json');
  const pwrChunk = readChunk('srd_powers.json');
  const splSplat = readChunk('srd_spells_splat.json');
  const micChunk = readChunk('mic_compendium.json');
  const micEntries = Array.isArray(micChunk.data) ? micChunk.data : (micChunk.data.entries || []);

  const extraFeatsCore = compileFeatList(fc.data);
  const extraFeatsSplat = compileFeatList(fsChunk.data);
  const extraFeatsEpic = compileFeatList(feEpic.data);
  const extraFeatsLegacy = compileFeatList(feLegacy.data);
  const extraCabRab = compileClassAbilitiesAndRacialTraits(cr.data);
  // Class feature V3 blocks (cab-* records + class row refs); must run after the generic cab compile so it is not overwritten.
  const classBlockStats = require('./compile_class_blocks').applyAll(cr.data);
  const extraConditions = compileFeatList(cndChunk.data) + (() => {
    let n = 0;
    const { EXPLICIT_PATCHES } = require('./compile_v3_corpus_complete');
    for (const c of cndChunk.data) {
      if (c && EXPLICIT_PATCHES[c.id] && (!Array.isArray(c.effects) || c.effects.length === 0)) {
        c.effects = JSON.parse(JSON.stringify(EXPLICIT_PATCHES[c.id].effects));
        n++;
      }
    }
    return n;
  })();
  const extraDom = (() => {
    const { EXPLICIT_PATCHES } = require('./compile_v3_corpus_complete');
    let n = 0;
    for (const d of dom.data) {
      if (d && EXPLICIT_PATCHES[d.id] && (!Array.isArray(d.effects) || d.effects.length === 0)) {
        d.effects = JSON.parse(JSON.stringify(EXPLICIT_PATCHES[d.id].effects));
        n++;
      }
    }
    return n;
  })();
  const extraManeuvers = compileManeuversAndStances(manChunk.data);
  const extraEqMic = compileEquipmentAndMic(eq.data, micEntries);
  const extraPowers = compilePowers(pwrChunk.data);
  const extraSpells = compileRemainingMechanicalSpells(spl.data, splSplat.data);

  // Normalize V3 dialect across ALL 24 chunks in srd_index.json
  const idxRaw = JSON.parse(fs.readFileSync(path.join(DB_DIR, 'srd_index.json'), 'utf8'));
  const loadedMap = new Map([
    ['srd_classes_races.json', cr],
    ['srd_classes_splat.json', cs],
    ['srd_feats.json', fc],
    ['srd_feats_splat.json', fsChunk],
    ['srd_feats_epic.json', feEpic],
    ['srd_feats_legacy.json', feLegacy],
    ['srd_domains.json', dom],
    ['srd_combat_rules.json', cndChunk],
    ['srd_maneuvers.json', manChunk],
    ['srd_powers.json', pwrChunk],
    ['srd_spells.json', spl],
    ['srd_spells_splat.json', splSplat],
    ['srd_equipment.json', eq],
    ['mic_compendium.json', micChunk]
  ]);
  let dialectFixes = 0;
  const metaUpdates = {};
  for (const chunkName of Object.keys(idxRaw.chunks || {})) {
    const chObj = loadedMap.get(chunkName) || readChunk(chunkName);
    const entries = Array.isArray(chObj.data) ? chObj.data : (chObj.data.entries || []);
    let chDirty = loadedMap.has(chunkName);
    for (const e of entries) {
      const df = normalizeEntryV3Dialect(e);
      if (df > 0) {
        dialectFixes += df;
        chDirty = true;
      }
    }
    if (chDirty) {
      const wr = writeChunk(chObj.fp, chObj.data, chObj.wasMinified);
      wr.count = entries.length;
      metaUpdates[chunkName] = wr;
    }
  }

  // C2. `whenBlock(..., 'activation', ...)` blocks emitted above become selectable `modes[]` (idempotent; rewrites chunks on disk,
  // the index rebuild below re-hashes every chunk from disk).
  const activationModes = require('./compile_activation_modes').run();

  // D. Rebuild srd_index.json
  const idxRes = rebuildSrdIndex(metaUpdates);
  const elapsedMs = Date.now() - t0;

  const summary = {
    elapsedMs,
    variantClassesProcessed: variantRes.length,
    classAbilitiesCreated: cabCreated,
    classAbilitiesUpdated: cabUpdated,
    existingClassAbilitiesEnriched: cabExistingEnriched,
    classFeatureLinksAdded: { core: linkedCore, splat: linkedSplat },
    classBlocks: classBlockStats,
    activationModes,
    featsPatched,
    domainsPatched: domainsPatched + extraDom,
    spellsPatched: spellsPatched + extraSpells,
    potionsPatched,
    corpusComplete: {
      extraFeatsCore,
      extraFeatsSplat,
      extraFeatsEpic,
      extraFeatsLegacy,
      extraCabRab,
      extraConditions,
      extraManeuvers,
      extraEqMic,
      extraPowers,
      extraSpells,
      dialectFixes
    },
    totalEntries: idxRes.totalEntries,
    compendiumHash: idxRes.compendiumHash
  };
  console.log('✅ compile_v3_mechanics completed:', JSON.stringify(summary));
  return summary;
}

if (require.main === module) {
  main();
}

module.exports = { main, compileTemplateBlocks, compileTemplateBlocksOnly };
