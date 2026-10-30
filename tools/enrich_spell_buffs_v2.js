/**
 * ============================================================================
 * JOYFUL-FERMI D&D 3.5e — CANONICAL V2 SPELL BUFF ENRICHMENT & SPLATBOOK SEED
 * ============================================================================
 * Populates:
 *   1. `database/srd_spells.json` with Canonical V2 `modifiers`, `sizeModifier`,
 *      `ruleFlags`, `tempHpFormula`, and `buffTargetMode` across all SRD & Psionic
 *      buff spells.
 *   2. `database/srd_index.json` with updated SHA-256 hash & byte size.
 *   3. `master_db.json` with canonical D&D 3.5e Splatbook Buff Spells (Dragon Magic
 *      Primal series, Races of the Dragon Mighty Wallop / Greater Mighty Wallop,
 *      Spell Compendium & Complete Mage classics).
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRD_SPELLS_PATH = path.join(ROOT, 'database', 'srd_spells.json');
const SRD_INDEX_PATH = path.join(ROOT, 'database', 'srd_index.json');
const MASTER_DB_PATH = path.join(ROOT, 'master_db.json');

function mod(target, valueOrFormula, type = 'untyped', condition = null) {
  const isNum = typeof valueOrFormula === 'number';
  return {
    target,
    value: isNum ? valueOrFormula : 0,
    formula: String(valueOrFormula),
    type,
    condition
  };
}

// Canonical D&D 3.5e SRD & Psionic Buff Definitions (Keyed by lowercase spell name)
const SRD_BUFF_SPECS = {
  // --- ABILITY SCORE ENHANCEMENTS (+4) ---
  "bull's strength": {
    buffTargetMode: 'single',
    modifiers: [mod('ability.str', 4, 'enhancement')]
  },
  "bull's strength, mass": {
    buffTargetMode: 'party',
    modifiers: [mod('ability.str', 4, 'enhancement')]
  },
  "cat's grace": {
    buffTargetMode: 'single',
    modifiers: [mod('ability.dex', 4, 'enhancement')]
  },
  "cat's grace, mass": {
    buffTargetMode: 'party',
    modifiers: [mod('ability.dex', 4, 'enhancement')]
  },
  "bear's endurance": {
    buffTargetMode: 'single',
    modifiers: [mod('ability.con', 4, 'enhancement')]
  },
  "bear's endurance, mass": {
    buffTargetMode: 'party',
    modifiers: [mod('ability.con', 4, 'enhancement')]
  },
  "fox's cunning": {
    buffTargetMode: 'single',
    modifiers: [mod('ability.int', 4, 'enhancement')]
  },
  "fox's cunning, mass": {
    buffTargetMode: 'party',
    modifiers: [mod('ability.int', 4, 'enhancement')]
  },
  "owl's wisdom": {
    buffTargetMode: 'single',
    modifiers: [mod('ability.wis', 4, 'enhancement')]
  },
  "owl's wisdom, mass": {
    buffTargetMode: 'party',
    modifiers: [mod('ability.wis', 4, 'enhancement')]
  },
  "eagle's splendor": {
    buffTargetMode: 'single',
    modifiers: [mod('ability.cha', 4, 'enhancement')]
  },
  "eagle's splendor, mass": {
    buffTargetMode: 'party',
    modifiers: [mod('ability.cha', 4, 'enhancement')]
  },

  // --- AC & DEFENSIVE WARDS ---
  "shield of faith": {
    buffTargetMode: 'single',
    modifiers: [mod('ac.deflection', '2 + min(3, floor(@cl / 6))', 'deflection')]
  },
  "barkskin": {
    buffTargetMode: 'single',
    modifiers: [mod('ac.natural', '2 + min(3, max(0, floor((@cl - 3) / 3)))', 'natural_enhancement')]
  },
  "mage armor": {
    buffTargetMode: 'single',
    modifiers: [mod('ac.armor', 4, 'armor')]
  },
  "shield": {
    buffTargetMode: 'self',
    modifiers: [mod('ac.shield', 4, 'shield')],
    ruleFlags: { immuneMagicMissile: true }
  },
  "protection from evil": {
    buffTargetMode: 'single',
    modifiers: [
      mod('ac.deflection', 2, 'deflection', 'vs. evil'),
      mod('save.all', 2, 'resistance', 'vs. evil')
    ]
  },
  "protection from good": {
    buffTargetMode: 'single',
    modifiers: [
      mod('ac.deflection', 2, 'deflection', 'vs. good'),
      mod('save.all', 2, 'resistance', 'vs. good')
    ]
  },
  "protection from law": {
    buffTargetMode: 'single',
    modifiers: [
      mod('ac.deflection', 2, 'deflection', 'vs. lawful'),
      mod('save.all', 2, 'resistance', 'vs. lawful')
    ]
  },
  "protection from chaos": {
    buffTargetMode: 'single',
    modifiers: [
      mod('ac.deflection', 2, 'deflection', 'vs. chaotic'),
      mod('save.all', 2, 'resistance', 'vs. chaotic')
    ]
  },
  "magic circle against evil": {
    buffTargetMode: 'party',
    modifiers: [
      mod('ac.deflection', 2, 'deflection', 'vs. evil'),
      mod('save.all', 2, 'resistance', 'vs. evil')
    ]
  },
  "magic circle against good": {
    buffTargetMode: 'party',
    modifiers: [
      mod('ac.deflection', 2, 'deflection', 'vs. good'),
      mod('save.all', 2, 'resistance', 'vs. good')
    ]
  },
  "magic circle against law": {
    buffTargetMode: 'party',
    modifiers: [
      mod('ac.deflection', 2, 'deflection', 'vs. lawful'),
      mod('save.all', 2, 'resistance', 'vs. lawful')
    ]
  },
  "magic circle against chaos": {
    buffTargetMode: 'party',
    modifiers: [
      mod('ac.deflection', 2, 'deflection', 'vs. chaotic'),
      mod('save.all', 2, 'resistance', 'vs. chaotic')
    ]
  },
  "holy aura": {
    buffTargetMode: 'party',
    modifiers: [
      mod('ac.deflection', 4, 'deflection'),
      mod('save.all', 4, 'resistance')
    ],
    ruleFlags: { sr: 25 }
  },
  "unholy aura": {
    buffTargetMode: 'party',
    modifiers: [
      mod('ac.deflection', 4, 'deflection'),
      mod('save.all', 4, 'resistance')
    ],
    ruleFlags: { sr: 25 }
  },
  "shield of law": {
    buffTargetMode: 'party',
    modifiers: [
      mod('ac.deflection', 4, 'deflection'),
      mod('save.all', 4, 'resistance')
    ],
    ruleFlags: { sr: 25 }
  },
  "cloak of chaos": {
    buffTargetMode: 'party',
    modifiers: [
      mod('ac.deflection', 4, 'deflection'),
      mod('save.all', 4, 'resistance')
    ],
    ruleFlags: { sr: 25 }
  },
  "magic vestment": {
    buffTargetMode: 'single',
    modifiers: [mod('ac.armor', 'min(5, max(1, floor(@cl / 4)))', 'enhancement')]
  },
  "shield other": {
    buffTargetMode: 'single',
    modifiers: [
      mod('ac.deflection', 1, 'deflection'),
      mod('save.all', 1, 'resistance')
    ]
  },
  "resistance": {
    buffTargetMode: 'single',
    modifiers: [mod('save.all', 1, 'resistance')]
  },
  "protection from spells": {
    buffTargetMode: 'party',
    modifiers: [mod('save.all', 8, 'resistance', 'vs. spells & spell-like abilities')]
  },
  "foresight": {
    buffTargetMode: 'single',
    modifiers: [
      mod('ac.dodge', 2, 'insight'),
      mod('save.ref', 2, 'insight')
    ],
    ruleFlags: { uncannyDodge: true }
  },

  // --- COMBAT, ATTACK, DAMAGE & MORALE / LUCK BUFFS ---
  "divine favor": {
    buffTargetMode: 'self',
    modifiers: [
      mod('attack.all', 'min(3, max(1, floor(@cl / 3)))', 'luck'),
      mod('damage.weapon', 'min(3, max(1, floor(@cl / 3)))', 'luck')
    ]
  },
  "divine power": {
    buffTargetMode: 'self',
    tempHpFormula: '@cl',
    modifiers: [
      mod('ability.str', 6, 'enhancement')
    ],
    ruleFlags: { babEqualsLevel: true }
  },
  "righteous might": {
    buffTargetMode: 'self',
    sizeModifier: {
      targetType: 'creature',
      scaling: { type: 'flat', steps: 1 }
    },
    modifiers: [
      mod('ability.str', 4, 'size'),
      mod('ability.con', 2, 'size'),
      mod('ac.natural', 2, 'natural_enhancement'),
      mod('ac.total', -1, 'size'),
      mod('attack.all', -1, 'size')
    ],
    ruleFlags: { drEvilOrGood: 'min(9, floor(@cl / 4) * 3)' }
  },
  "bless": {
    buffTargetMode: 'party',
    modifiers: [
      mod('attack.all', 1, 'morale')
    ]
  },
  "prayer": {
    buffTargetMode: 'party',
    modifiers: [
      mod('attack.all', 1, 'luck'),
      mod('damage.weapon', 1, 'luck'),
      mod('save.all', 1, 'luck'),
      mod('skill.all', 1, 'luck')
    ]
  },
  "aid": {
    buffTargetMode: 'single',
    tempHpFormula: '1d8 + min(10, @cl)',
    modifiers: [
      mod('attack.all', 1, 'morale')
    ]
  },
  "heroism": {
    buffTargetMode: 'single',
    modifiers: [
      mod('attack.all', 2, 'morale'),
      mod('save.all', 2, 'morale'),
      mod('skill.all', 2, 'morale')
    ]
  },
  "heroism, greater": {
    buffTargetMode: 'single',
    tempHpFormula: 'min(20, @cl)',
    modifiers: [
      mod('attack.all', 4, 'morale'),
      mod('save.all', 4, 'morale'),
      mod('skill.all', 4, 'morale')
    ],
    ruleFlags: { immuneFear: true }
  },
  "good hope": {
    buffTargetMode: 'party',
    modifiers: [
      mod('attack.all', 2, 'morale'),
      mod('damage.weapon', 2, 'morale'),
      mod('save.all', 2, 'morale'),
      mod('skill.all', 2, 'morale')
    ]
  },
  "rage": {
    buffTargetMode: 'party',
    modifiers: [
      mod('ability.str', 2, 'morale'),
      mod('ability.con', 2, 'morale'),
      mod('save.will', 1, 'morale'),
      mod('ac.total', -2, 'penalty')
    ]
  },
  "transformation": {
    buffTargetMode: 'self',
    modifiers: [
      mod('ability.str', 4, 'enhancement'),
      mod('ability.dex', 4, 'enhancement'),
      mod('ability.con', 4, 'enhancement'),
      mod('ac.natural', 4, 'natural'),
      mod('save.fort', 5, 'competence')
    ],
    ruleFlags: { babEqualsLevel: true }
  },
  "haste": {
    buffTargetMode: 'party',
    modifiers: [
      mod('attack.all', 1, 'haste'),
      mod('ac.dodge', 1, 'dodge'),
      mod('save.ref', 1, 'dodge'),
      mod('speed.land', 30, 'enhancement')
    ],
    ruleFlags: { extraAttackFullAttack: true }
  },
  "true strike": {
    buffTargetMode: 'self',
    modifiers: [
      mod('attack.all', 20, 'insight')
    ],
    ruleFlags: { ignoreConcealment: true }
  },
  "guidance": {
    buffTargetMode: 'single',
    modifiers: [
      mod('attack.all', 1, 'competence'),
      mod('save.all', 1, 'competence'),
      mod('skill.all', 1, 'competence')
    ]
  },
  "virtue": {
    buffTargetMode: 'single',
    tempHpFormula: '1',
    modifiers: []
  },
  "false life": {
    buffTargetMode: 'self',
    tempHpFormula: '1d10 + min(10, @cl)',
    modifiers: []
  },

  // --- SIZE & FORM SPELLS ---
  "enlarge person": {
    buffTargetMode: 'single',
    sizeModifier: {
      targetType: 'creature',
      scaling: { type: 'flat', steps: 1 }
    },
    modifiers: [
      mod('ability.str', 2, 'size'),
      mod('ability.dex', -2, 'size'),
      mod('ac.total', -1, 'size'),
      mod('attack.all', -1, 'size')
    ]
  },
  "enlarge person, mass": {
    buffTargetMode: 'party',
    sizeModifier: {
      targetType: 'creature',
      scaling: { type: 'flat', steps: 1 }
    },
    modifiers: [
      mod('ability.str', 2, 'size'),
      mod('ability.dex', -2, 'size'),
      mod('ac.total', -1, 'size'),
      mod('attack.all', -1, 'size')
    ]
  },
  "reduce person": {
    buffTargetMode: 'single',
    sizeModifier: {
      targetType: 'creature',
      scaling: { type: 'flat', steps: -1 }
    },
    modifiers: [
      mod('ability.dex', 2, 'size'),
      mod('ability.str', -2, 'size'),
      mod('ac.total', 1, 'size'),
      mod('attack.all', 1, 'size')
    ]
  },
  "reduce person, mass": {
    buffTargetMode: 'party',
    sizeModifier: {
      targetType: 'creature',
      scaling: { type: 'flat', steps: -1 }
    },
    modifiers: [
      mod('ability.dex', 2, 'size'),
      mod('ability.str', -2, 'size'),
      mod('ac.total', 1, 'size'),
      mod('attack.all', 1, 'size')
    ]
  },
  "animal growth": {
    buffTargetMode: 'single',
    sizeModifier: {
      targetType: 'creature',
      scaling: { type: 'flat', steps: 1 }
    },
    modifiers: [
      mod('ability.str', 8, 'size'),
      mod('ability.con', 4, 'size'),
      mod('ability.dex', -2, 'size'),
      mod('ac.natural', 2, 'natural'),
      mod('save.all', 4, 'resistance')
    ]
  },
  "iron body": {
    buffTargetMode: 'self',
    modifiers: [
      mod('ability.str', 6, 'enhancement'),
      mod('ability.dex', -6, 'penalty')
    ],
    ruleFlags: { drAdamantine: 15 }
  },
  "crown of glory": {
    buffTargetMode: 'self',
    modifiers: [
      mod('ability.cha', 4, 'enhancement')
    ]
  },

  // --- WEAPON BUFF SPELLS ---
  "magic weapon": {
    buffTargetMode: 'weapon',
    modifiers: [
      mod('attack.all', 1, 'enhancement'),
      mod('damage.weapon', 1, 'enhancement')
    ]
  },
  "magic weapon, greater": {
    buffTargetMode: 'weapon',
    modifiers: [
      mod('attack.all', 'min(5, max(1, floor(@cl / 4)))', 'enhancement'),
      mod('damage.weapon', 'min(5, max(1, floor(@cl / 4)))', 'enhancement')
    ]
  },
  "magic fang": {
    buffTargetMode: 'single',
    modifiers: [
      mod('attack.all', 1, 'enhancement'),
      mod('damage.weapon', 1, 'enhancement')
    ]
  },
  "magic fang, greater": {
    buffTargetMode: 'single',
    modifiers: [
      mod('attack.all', 'min(5, max(1, floor(@cl / 4)))', 'enhancement'),
      mod('damage.weapon', 'min(5, max(1, floor(@cl / 4)))', 'enhancement')
    ]
  },
  "keen edge": {
    buffTargetMode: 'weapon',
    modifiers: [],
    ruleFlags: { keen: true }
  },
  "bless weapon": {
    buffTargetMode: 'weapon',
    modifiers: [],
    ruleFlags: { bypassDR: ['Evil'], autoConfirmCritVsEvil: true }
  },

  // --- SPEED, MOBILITY & SKILL SPELLS ---
  "expeditious retreat": {
    buffTargetMode: 'self',
    modifiers: [mod('speed.land', 30, 'enhancement')]
  },
  "longstrider": {
    buffTargetMode: 'self',
    modifiers: [mod('speed.land', 10, 'enhancement')]
  },
  "jump": {
    buffTargetMode: 'single',
    modifiers: [mod('skill.jump', 'min(30, max(10, floor(@cl / 4) * 10))', 'enhancement')]
  },
  "glibness": {
    buffTargetMode: 'self',
    modifiers: [mod('skill.bluff', 30, 'untyped')]
  },
  "pass without trace": {
    buffTargetMode: 'party',
    modifiers: [mod('skill.survival', 0, 'untyped')],
    ruleFlags: { untrackable: true }
  },
  "find traps": {
    buffTargetMode: 'self',
    modifiers: [mod('skill.search', 'min(10, max(1, floor(@cl / 2)))', 'insight')]
  },
  "moment of prescience": {
    buffTargetMode: 'self',
    modifiers: [],
    ruleFlags: { momentOfPrescience: 'min(25, @cl)' }
  },

  // --- DEFENSIVE CONCEALMENT / IMMUNITY WARDS (Active Buff Tracking) ---
  "blur": {
    buffTargetMode: 'single',
    modifiers: [],
    ruleFlags: { concealment: 20 }
  },
  "displacement": {
    buffTargetMode: 'single',
    modifiers: [],
    ruleFlags: { concealment: 50 }
  },
  "entropic shield": {
    buffTargetMode: 'self',
    modifiers: [],
    ruleFlags: { rangedMissChance: 20 }
  },
  "stoneskin": {
    buffTargetMode: 'single',
    modifiers: [],
    ruleFlags: { drAdamantine: 10 }
  },
  "death ward": {
    buffTargetMode: 'single',
    modifiers: [],
    ruleFlags: { immuneDeathEffects: true, immuneNegativeEnergy: true }
  },
  "freedom of movement": {
    buffTargetMode: 'single',
    modifiers: [],
    ruleFlags: { freedomOfMovement: true }
  },

  // --- PSIONIC BUFF POWERS ---
  "ectoplasmic armor": {
    buffTargetMode: 'self',
    modifiers: [mod('ac.armor', 10, 'armor')]
  },
  "inertial armor": {
    buffTargetMode: 'self',
    modifiers: [mod('ac.armor', 4, 'armor')]
  },
  "force screen": {
    buffTargetMode: 'self',
    modifiers: [mod('ac.shield', 4, 'shield')]
  },
  "thicken skin": {
    buffTargetMode: 'self',
    modifiers: [mod('ac.natural', 1, 'enhancement')]
  },
  "precognition, defensive": {
    buffTargetMode: 'self',
    modifiers: [
      mod('ac.dodge', 1, 'insight'),
      mod('save.all', 1, 'insight')
    ]
  },
  "precognition, offensive": {
    buffTargetMode: 'self',
    modifiers: [mod('attack.all', 1, 'insight')]
  },
  "lesser metaphysical weapon": {
    buffTargetMode: 'weapon',
    modifiers: [
      mod('attack.all', 1, 'enhancement'),
      mod('damage.weapon', 1, 'enhancement')
    ]
  },
  "metaphysical weapon": {
    buffTargetMode: 'weapon',
    modifiers: [
      mod('attack.all', 1, 'enhancement'),
      mod('damage.weapon', 1, 'enhancement')
    ]
  },
  "keen edge, psionic": {
    buffTargetMode: 'weapon',
    modifiers: [],
    ruleFlags: { keen: true }
  },
  "vigor": {
    buffTargetMode: 'self',
    tempHpFormula: '5 * @cl',
    modifiers: []
  },
  "expansion": {
    buffTargetMode: 'self',
    sizeModifier: {
      targetType: 'creature',
      scaling: { type: 'flat', steps: 1 }
    },
    modifiers: [
      mod('ability.str', 2, 'size'),
      mod('ability.dex', -2, 'size'),
      mod('ac.total', -1, 'size'),
      mod('attack.all', -1, 'size')
    ]
  },
  "compression": {
    buffTargetMode: 'self',
    sizeModifier: {
      targetType: 'creature',
      scaling: { type: 'flat', steps: -1 }
    },
    modifiers: [
      mod('ability.dex', 2, 'size'),
      mod('ability.str', -2, 'size'),
      mod('ac.total', 1, 'size'),
      mod('attack.all', 1, 'size')
    ]
  }
};

// Splatbook Canonical V2 Buff Spells (stored in `master_db.json` per Rule #3)
const SPLATBOOK_BUFF_SPELLS = [
  {
    id: 'spl-primal-hunter',
    schemaVersion: 2,
    name: 'Primal Hunter',
    type: 'Spell',
    category: 'Transmutation',
    level: 1,
    learnedAt: { class: { Druid: 1, Ranger: 1, Sorcerer: 1, Wizard: 1 } },
    source: 'Dragon Magic p.71',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S'],
    range: 'Personal',
    target: 'You',
    duration: '24 hours',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: '+5 competence bonus on Climb, Jump, and Swim checks for 24 hours.',
    description: '<p>Bestial strength floods your limbs, granting you a +5 competence bonus on Climb, Jump, and Swim checks for 24 hours. If active simultaneously with another Primal spell, you gain Uncanny Dodge (or Improved Uncanny Dodge if all four Primal spells are active).</p>',
    modifiers: [
      mod('skill.climb', 5, 'competence'),
      mod('skill.jump', 5, 'competence'),
      mod('skill.swim', 5, 'competence')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: { primalSpell: true }
  },
  {
    id: 'spl-primal-instinct',
    schemaVersion: 2,
    name: 'Primal Instinct',
    type: 'Spell',
    category: 'Transmutation',
    level: 2,
    learnedAt: { class: { Druid: 2, Ranger: 2, Sorcerer: 2, Wizard: 2 } },
    source: 'Dragon Magic p.71',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S'],
    range: 'Personal',
    target: 'You',
    duration: '24 hours',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: '+5 competence bonus on Initiative and Survival checks for 24 hours.',
    description: '<p>Primeval awareness sharpens your reflexes, granting you a +5 competence bonus on Initiative and Survival checks for 24 hours. If active simultaneously with another Primal spell, you gain Uncanny Dodge (or Improved Uncanny Dodge if all four Primal spells are active).</p>',
    modifiers: [
      mod('initiative', 5, 'competence'),
      mod('skill.survival', 5, 'competence')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: { primalSpell: true }
  },
  {
    id: 'spl-primal-senses',
    schemaVersion: 2,
    name: 'Primal Senses',
    type: 'Spell',
    category: 'Transmutation',
    level: 3,
    learnedAt: { class: { Druid: 3, Ranger: 3, Sorcerer: 3, Wizard: 3 } },
    source: 'Dragon Magic p.71',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S'],
    range: 'Personal',
    target: 'You',
    duration: '24 hours',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: 'Low-light vision and +5 competence bonus on Listen and Spot checks for 24 hours.',
    description: '<p>Your senses sharpen to draconic acuity, granting you Low-Light Vision and a +5 competence bonus on Listen and Spot checks for 24 hours. If active simultaneously with another Primal spell, you gain Uncanny Dodge (or Improved Uncanny Dodge if all four Primal spells are active).</p>',
    modifiers: [
      mod('skill.listen', 5, 'competence'),
      mod('skill.spot', 5, 'competence')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: { primalSpell: true, lowLightVision: true }
  },
  {
    id: 'spl-primal-speed',
    schemaVersion: 2,
    name: 'Primal Speed',
    type: 'Spell',
    category: 'Transmutation',
    level: 4,
    learnedAt: { class: { Druid: 4, Ranger: 4, Sorcerer: 4, Wizard: 4 } },
    source: 'Dragon Magic p.71',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S'],
    range: 'Personal',
    target: 'You',
    duration: '24 hours',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: '+5 competence bonus on Reflex saves and +10 ft. enhancement bonus to speed for 24 hours.',
    description: '<p>Raw predatory speed courses through your body, granting you a +5 competence bonus on Reflex saves and a +10-foot enhancement bonus to all modes of movement for 24 hours. If active simultaneously with another Primal spell, you gain Uncanny Dodge (or Improved Uncanny Dodge if all four Primal spells are active).</p>',
    modifiers: [
      mod('save.ref', 5, 'competence'),
      mod('speed.land', 10, 'enhancement')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: { primalSpell: true }
  },
  {
    id: 'spl-mighty-wallop',
    schemaVersion: 2,
    name: 'Mighty Wallop',
    type: 'Spell',
    category: 'Transmutation',
    level: 1,
    learnedAt: { class: { Sorcerer: 1, Wizard: 1 } },
    source: 'Races of the Dragon p.114',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'F'],
    range: 'Touch',
    target: 'One bludgeoning melee weapon touched',
    duration: '1 min./level',
    save: 'Will negates (harmless, object)',
    sr: true,
    buffTargetMode: 'weapon',
    sizeModifier: {
      targetType: 'weapon',
      targetFilter: { meleeOnly: true, allowedDmgTypes: ['Bludgeoning'] },
      scaling: { type: 'flat', steps: 1 }
    },
    shortDescription: 'Increases a bludgeoning melee weapon’s damage by 1 effective size category.',
    description: '<p><i>Mighty wallop</i> increases the damage of a bludgeoning melee weapon by one effective size category without changing its dimensions or weight.</p>',
    modifiers: [],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-greater-mighty-wallop',
    schemaVersion: 2,
    name: 'Greater Mighty Wallop',
    type: 'Spell',
    category: 'Transmutation',
    level: 3,
    learnedAt: { class: { Sorcerer: 3, Wizard: 3 } },
    source: 'Races of the Dragon p.115',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'F'],
    range: 'Touch',
    target: 'One bludgeoning melee weapon touched',
    duration: '1 hour/level',
    save: 'Will negates (harmless, object)',
    sr: true,
    buffTargetMode: 'weapon',
    sizeModifier: {
      targetType: 'weapon',
      targetFilter: { meleeOnly: true, allowedDmgTypes: ['Bludgeoning'] },
      scaling: { type: 'per_caster_level', clDivisor: 4, maxSteps: 5 }
    },
    shortDescription: 'Increases a bludgeoning melee weapon’s damage by +1 size category per 4 caster levels (max Colossal / +5 steps).',
    description: '<p>This spell functions like <i>mighty wallop</i>, except that it increases the bludgeoning melee weapon’s effective damage size by one category per four caster levels (maximum +5 size categories, up to Colossal) for 1 hour/level.</p>',
    modifiers: [],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-conviction',
    schemaVersion: 2,
    name: 'Conviction',
    type: 'Spell',
    category: 'Abjuration',
    level: 1,
    learnedAt: { class: { Cleric: 1, Paladin: 1 } },
    source: 'Spell Compendium p.52',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'M'],
    range: 'Touch',
    target: 'Living creature touched',
    duration: '10 min./level',
    save: 'Will negates (harmless)',
    sr: true,
    buffTargetMode: 'single',
    shortDescription: 'Subject gains +2 morale bonus on saving throws, +1 per 6 caster levels (max +5).',
    description: '<p>This spell bolsters the mental, physical, and spiritual strength of the creature touched, granting a +2 morale bonus on saving throws, plus an additional +1 for every six caster levels you have (maximum +5 morale bonus at 18th level).</p>',
    modifiers: [mod('save.all', '2 + min(3, floor(@cl / 6))', 'morale')],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-mass-conviction',
    schemaVersion: 2,
    name: 'Conviction, Mass',
    type: 'Spell',
    category: 'Abjuration',
    level: 3,
    learnedAt: { class: { Cleric: 3 } },
    source: 'Spell Compendium p.52',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'M'],
    range: 'Medium',
    target: 'Allies in a 20-ft.-radius burst',
    duration: '10 min./level',
    save: 'Will negates (harmless)',
    sr: true,
    buffTargetMode: 'party',
    shortDescription: 'Allies gain +2 morale bonus on saving throws, +1 per 6 caster levels (max +5).',
    description: '<p>As <i>conviction</i>, except it bolsters all allies in a 20-ft.-radius burst with a +2 morale bonus on all saving throws (+1 per 6 caster levels, maximum +5).</p>',
    modifiers: [mod('save.all', '2 + min(3, floor(@cl / 6))', 'morale')],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-recitation',
    schemaVersion: 2,
    name: 'Recitation',
    type: 'Spell',
    category: 'Conjuration',
    level: 4,
    learnedAt: { class: { Cleric: 4 } },
    source: 'Spell Compendium p.170',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'DF'],
    range: '60 ft.',
    target: 'Allies within a 60-ft.-radius burst centered on you',
    duration: '1 round/level',
    save: 'None',
    sr: true,
    buffTargetMode: 'party',
    shortDescription: 'Allies gain +2 luck bonus on attack rolls, AC, and saving throws (+3 if they worship your deity).',
    description: '<p>By reciting a sacred passage, you invoke your deity’s blessing upon yourself and your allies, granting a +2 luck bonus on attack rolls, AC, and saving throws (or +3 if they worship the same patron deity as you).</p>',
    modifiers: [
      mod('attack.all', 3, 'luck'),
      mod('ac.dodge', 3, 'luck'),
      mod('save.all', 3, 'luck')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-righteous-wrath-of-the-faithful',
    schemaVersion: 2,
    name: 'Righteous Wrath of the Faithful',
    type: 'Spell',
    category: 'Enchantment',
    level: 5,
    learnedAt: { class: { Cleric: 5 } },
    source: 'Spell Compendium p.177',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'DF'],
    range: '30 ft.',
    target: 'Allies within a 30-ft.-radius burst centered on you',
    duration: '1 round/level',
    save: 'None',
    sr: true,
    buffTargetMode: 'party',
    shortDescription: 'Allies gain 1 extra melee attack at highest bonus and +3 morale bonus on melee attack, melee damage, and saves.',
    description: '<p>Allies gain one extra melee attack at their highest base attack bonus when making a full attack, plus a +3 morale bonus on melee attack rolls, melee damage rolls, and saving throws.</p>',
    modifiers: [
      mod('attack.melee', 3, 'morale'),
      mod('damage.melee', 3, 'morale'),
      mod('save.all', 3, 'morale')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: { extraAttackFullAttack: true }
  },
  {
    id: 'spl-resistance-greater',
    schemaVersion: 2,
    name: 'Resistance, Greater',
    type: 'Spell',
    category: 'Abjuration',
    level: 4,
    learnedAt: { class: { Bard: 4, Cleric: 4, Druid: 4, Sorcerer: 4, Wizard: 4 } },
    source: 'Spell Compendium p.174',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'M', 'DF'],
    range: 'Touch',
    target: 'Creature touched',
    duration: '24 hours',
    save: 'Will negates (harmless)',
    sr: true,
    buffTargetMode: 'single',
    shortDescription: 'Subject gains +3 resistance bonus on all saving throws for 24 hours.',
    description: '<p>You grant the subject a +3 resistance bonus on all saving throws for 24 hours.</p>',
    modifiers: [mod('save.all', 3, 'resistance')],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-resistance-superior',
    schemaVersion: 2,
    name: 'Resistance, Superior',
    type: 'Spell',
    category: 'Abjuration',
    level: 6,
    learnedAt: { class: { Bard: 6, Cleric: 6, Druid: 6, Sorcerer: 6, Wizard: 6 } },
    source: 'Spell Compendium p.174',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'M', 'DF'],
    range: 'Touch',
    target: 'Creature touched',
    duration: '24 hours',
    save: 'Will negates (harmless)',
    sr: true,
    buffTargetMode: 'single',
    shortDescription: 'Subject gains +6 resistance bonus on all saving throws for 24 hours.',
    description: '<p>You grant the subject a +6 resistance bonus on all saving throws for 24 hours.</p>',
    modifiers: [mod('save.all', 6, 'resistance')],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-nerveskitter',
    schemaVersion: 2,
    name: 'Nerveskitter',
    type: 'Spell',
    category: 'Transmutation',
    level: 1,
    learnedAt: { class: { Sorcerer: 1, Wizard: 1 } },
    source: 'Spell Compendium p.146',
    actionType: 'Immediate',
    castingTime: '1 immediate action',
    components: ['V', 'S'],
    range: 'Close',
    target: 'One creature',
    duration: '1 round',
    save: 'None',
    sr: true,
    buffTargetMode: 'single',
    shortDescription: 'Subject gains a +5 bonus on Initiative checks.',
    description: '<p>Cast when initiative is rolled, <i>nerveskitter</i> grants the subject a +5 untyped bonus on its Initiative check.</p>',
    modifiers: [mod('initiative', 5, 'untyped')],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-divine-agility',
    schemaVersion: 2,
    name: 'Divine Agility',
    type: 'Spell',
    category: 'Transmutation',
    level: 5,
    learnedAt: { class: { Cleric: 5 } },
    source: 'Spell Compendium p.69',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'DF'],
    range: 'Touch',
    target: 'Living creature touched',
    duration: '1 round/level',
    save: 'Will negates (harmless)',
    sr: true,
    buffTargetMode: 'single',
    shortDescription: 'Subject gains +10 enhancement bonus to Dexterity and the Spring Attack feat.',
    description: '<p>You imbue the subject with divine grace and reflexes, granting a +10 enhancement bonus to Dexterity, the benefits of the Spring Attack feat, and a base Reflex save progression equal to a Rogue of the subject’s character level.</p>',
    modifiers: [mod('ability.dex', 10, 'enhancement')],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-sirines-grace',
    schemaVersion: 2,
    name: "Sirine's Grace",
    type: 'Spell',
    category: 'Transmutation',
    level: 4,
    learnedAt: { class: { Bard: 4, Druid: 4 } },
    source: 'Spell Compendium p.191',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'M'],
    range: 'Personal',
    target: 'You',
    duration: '1 round/level',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: '+4 enhancement to CHA and DEX, +8 on Perform, and Deflection AC bonus equal to CHA modifier.',
    description: '<p>You gain a +4 enhancement bonus to Charisma and Dexterity, a +8 untyped bonus on Perform checks, a deflection bonus to AC equal to your Charisma modifier, and a swim speed of 60 ft.</p>',
    modifiers: [
      mod('ability.cha', 4, 'enhancement'),
      mod('ability.dex', 4, 'enhancement'),
      mod('skill.perform', 8, 'untyped'),
      mod('ac.deflection', 'max(1, @chaMod)', 'deflection')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-bite-of-the-werewolf',
    schemaVersion: 2,
    name: 'Bite of the Werewolf',
    type: 'Spell',
    category: 'Transmutation',
    level: 3,
    learnedAt: { class: { Druid: 3, Sorcerer: 3, Wizard: 3 } },
    source: 'Spell Compendium p.28',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'M'],
    range: 'Personal',
    target: 'You',
    duration: '1 round/level',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: '+2 enhancement STR, +4 DEX, +4 CON, +4 natural armor, and Blind-Fight.',
    description: '<p>You gain a +2 enhancement bonus to Strength, +4 enhancement bonus to Dexterity, +4 enhancement bonus to Constitution, +4 enhancement bonus to natural armor, and the Blind-Fight feat.</p>',
    modifiers: [
      mod('ability.str', 2, 'enhancement'),
      mod('ability.dex', 4, 'enhancement'),
      mod('ability.con', 4, 'enhancement'),
      mod('ac.natural', 4, 'natural_enhancement')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-bite-of-the-weretiger',
    schemaVersion: 2,
    name: 'Bite of the Weretiger',
    type: 'Spell',
    category: 'Transmutation',
    level: 5,
    learnedAt: { class: { Druid: 5, Sorcerer: 5, Wizard: 5 } },
    source: 'Spell Compendium p.28',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'M'],
    range: 'Personal',
    target: 'You',
    duration: '1 round/level',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: '+12 enhancement STR, +4 DEX, +6 CON, +5 natural armor, Blind-Fight, and Power Attack.',
    description: '<p>You gain a +12 enhancement bonus to Strength, +4 enhancement bonus to Dexterity, +6 enhancement bonus to Constitution, +5 enhancement bonus to natural armor, and the Blind-Fight and Power Attack feats.</p>',
    modifiers: [
      mod('ability.str', 12, 'enhancement'),
      mod('ability.dex', 4, 'enhancement'),
      mod('ability.con', 6, 'enhancement'),
      mod('ac.natural', 5, 'natural_enhancement')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-bite-of-the-werebear',
    schemaVersion: 2,
    name: 'Bite of the Werebear',
    type: 'Spell',
    category: 'Transmutation',
    level: 6,
    learnedAt: { class: { Druid: 6, Sorcerer: 6, Wizard: 6 } },
    source: 'Spell Compendium p.28',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S', 'M'],
    range: 'Personal',
    target: 'You',
    duration: '1 round/level',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: '+16 enhancement STR, -2 DEX, +8 CON, +7 natural armor, Blind-Fight, and Power Attack.',
    description: '<p>You gain a +16 enhancement bonus to Strength, -2 penalty to Dexterity, +8 enhancement bonus to Constitution, +7 enhancement bonus to natural armor, and the Blind-Fight and Power Attack feats.</p>',
    modifiers: [
      mod('ability.str', 16, 'enhancement'),
      mod('ability.dex', -2, 'penalty'),
      mod('ability.con', 8, 'enhancement'),
      mod('ac.natural', 7, 'natural_enhancement')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: {}
  },
  {
    id: 'spl-heart-of-air',
    schemaVersion: 2,
    name: 'Heart of Air',
    type: 'Spell',
    category: 'Transmutation',
    level: 2,
    learnedAt: { class: { Druid: 2, Sorcerer: 2, Wizard: 2 } },
    source: 'Complete Mage p.106',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S'],
    range: 'Personal',
    target: 'You',
    duration: '1 hour/level',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: '+10 enhancement bonus on Jump checks (+10 ft. fly speed if you already have one).',
    description: '<p>You gain a +10 enhancement bonus on Jump checks and can expend this spell as an immediate action to gain Feather Fall for 1 round.</p>',
    modifiers: [mod('skill.jump', 10, 'enhancement')],
    damageParts: [],
    modes: [],
    ruleFlags: { heartSpell: true }
  },
  {
    id: 'spl-heart-of-water',
    schemaVersion: 2,
    name: 'Heart of Water',
    type: 'Spell',
    category: 'Transmutation',
    level: 3,
    learnedAt: { class: { Druid: 3, Sorcerer: 3, Wizard: 3 } },
    source: 'Complete Mage p.107',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S'],
    range: 'Personal',
    target: 'You',
    duration: '1 hour/level',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: 'Swim speed, water breathing, and +5 enhancement bonus on Escape Artist checks.',
    description: '<p>You gain water breathing, a swim speed equal to your land speed (+8 racial bonus on Swim checks), and a +5 enhancement bonus on Escape Artist checks. You can expend this spell as a swift action to gain Freedom of Movement for 1 round/level.</p>',
    modifiers: [
      mod('skill.escape_artist', 5, 'enhancement'),
      mod('skill.swim', 8, 'racial')
    ],
    damageParts: [],
    modes: [],
    ruleFlags: { heartSpell: true }
  },
  {
    id: 'spl-heart-of-earth',
    schemaVersion: 2,
    name: 'Heart of Earth',
    type: 'Spell',
    category: 'Transmutation',
    level: 4,
    learnedAt: { class: { Druid: 4, Sorcerer: 4, Wizard: 4 } },
    source: 'Complete Mage p.106',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S'],
    range: 'Personal',
    target: 'You',
    duration: '1 hour/level',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    tempHpFormula: 'min(30, @cl * 2)',
    shortDescription: 'Gain 2 temporary HP per caster level (max 30) and +8 bonus to resist Bull Rush, Overrun, and Trip.',
    description: '<p>You gain temporary hit points equal to twice your caster level (maximum 30) and a +8 bonus on checks to resist being bull rushed, overrun, or tripped. You can expend this spell as a swift action to gain Stoneskin (DR 10/adamantine) for 1 round/level.</p>',
    modifiers: [],
    damageParts: [],
    modes: [],
    ruleFlags: { heartSpell: true }
  },
  {
    id: 'spl-heart-of-fire',
    schemaVersion: 2,
    name: 'Heart of Fire',
    type: 'Spell',
    category: 'Transmutation',
    level: 5,
    learnedAt: { class: { Druid: 5, Sorcerer: 5, Wizard: 5 } },
    source: 'Complete Mage p.107',
    actionType: 'Standard',
    castingTime: '1 standard action',
    components: ['V', 'S'],
    range: 'Personal',
    target: 'You',
    duration: '1 hour/level',
    save: 'None',
    sr: false,
    buffTargetMode: 'self',
    shortDescription: '+10 ft. enhancement bonus to land speed and Fire Resistance 10.',
    description: '<p>You gain a +10-foot enhancement bonus to your land speed and resistance to fire 10. You can expend this spell as a swift action to activate Fire Shield (warm shield) for 1 round/level.</p>',
    modifiers: [mod('speed.land', 10, 'enhancement')],
    damageParts: [],
    modes: [],
    ruleFlags: { heartSpell: true }
  }
];

function inferAutoModifiersFromDescription(spell) {
  const text = `${spell.shortDescription || ''} ${(spell.description || '').replace(/<[^>]+>/g, ' ')}`;
  const mods = [];
  const addUnique = (m) => {
    if (!mods.some(x => x.target === m.target && x.type === m.type && x.formula === m.formula)) {
      mods.push(m);
    }
  };

  // Match "+X <type> bonus to/on <stat>"
  const statMap = {
    strength: 'ability.str', str: 'ability.str',
    dexterity: 'ability.dex', dex: 'ability.dex',
    constitution: 'ability.con', con: 'ability.con',
    intelligence: 'ability.int', int: 'ability.int',
    wisdom: 'ability.wis', wis: 'ability.wis',
    charisma: 'ability.cha', cha: 'ability.cha'
  };

  const statRe = /\+(\d+)\s+(?:(enhancement|morale|luck|sacred|profane|inherent|size|alchemical|insight|competence)\s+)?bonus\s+(?:to|on)\s+(?:his\s+or\s+her\s+|your\s+|its\s+)?(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Str|Dex|Con|Int|Wis|Cha)\b/gi;
  let m;
  while ((m = statRe.exec(text)) !== null) {
    const val = parseInt(m[1], 10);
    const bType = (m[2] || 'enhancement').toLowerCase();
    const statKey = statMap[m[3].toLowerCase()];
    if (statKey && val > 0) addUnique(mod(statKey, val, bType));
  }

  // Match "+X <type> bonus on saving throws / Fortitude / Reflex / Will saves"
  const saveRe = /\+(\d+)\s+(?:(resistance|morale|luck|sacred|profane|insight|competence)\s+)?bonus\s+on\s+(?:all\s+)?(saving throws|saves|Fortitude saves|Reflex saves|Will saves)\b/gi;
  while ((m = saveRe.exec(text)) !== null) {
    const val = parseInt(m[1], 10);
    const bType = (m[2] || 'resistance').toLowerCase();
    const sTargetRaw = m[3].toLowerCase();
    const sTarget = sTargetRaw.includes('fort') ? 'save.fort' : (sTargetRaw.includes('ref') ? 'save.ref' : (sTargetRaw.includes('will') ? 'save.will' : 'save.all'));
    if (val > 0) addUnique(mod(sTarget, val, bType));
  }

  // Match "+X <type> bonus to AC"
  const acRe = /\+(\d+)\s+(armor|shield|deflection|natural armor|dodge|insight|sacred|profane|luck)\s+bonus\s+to\s+(?:your\s+|its\s+|the\s+subject's\s+)?AC\b/gi;
  while ((m = acRe.exec(text)) !== null) {
    const val = parseInt(m[1], 10);
    const bTypeRaw = m[2].toLowerCase();
    const acSub = bTypeRaw === 'natural armor' ? 'ac.natural' : `ac.${bTypeRaw}`;
    const bType = bTypeRaw === 'natural armor' ? 'natural' : bTypeRaw;
    if (val > 0) addUnique(mod(acSub, val, bType));
  }

  return mods;
}

function main() {
  const spells = JSON.parse(fs.readFileSync(SRD_SPELLS_PATH, 'utf8'));
  let enrichedCount = 0;

  for (const s of spells) {
    const key = String(s.name || '').toLowerCase().trim();
    const spec = SRD_BUFF_SPECS[key];
    if (spec) {
      s.modifiers = spec.modifiers || [];
      if (spec.sizeModifier) s.sizeModifier = spec.sizeModifier;
      if (spec.tempHpFormula) s.tempHpFormula = spec.tempHpFormula;
      if (spec.buffTargetMode) s.buffTargetMode = spec.buffTargetMode;
      if (spec.ruleFlags) {
        s.ruleFlags = { ...(s.ruleFlags || {}), ...spec.ruleFlags };
      }
      enrichedCount++;
      continue;
    }

    // Secondary pass for harmless / personal SRD spells with explicit numeric bonuses
    const isHarmlessOrPersonal = (s.save || '').toLowerCase().includes('harmless') || (s.range || '').toLowerCase() === 'personal';
    if (isHarmlessOrPersonal && (!Array.isArray(s.modifiers) || s.modifiers.length === 0)) {
      const autoMods = inferAutoModifiersFromDescription(s);
      if (autoMods.length > 0) {
        s.modifiers = autoMods;
        const rLower = (s.range || '').toLowerCase();
        const tLower = `${s.target || ''} ${s.area || ''}`.toLowerCase();
        s.buffTargetMode = rLower === 'personal'
          ? 'self'
          : (tLower.includes('allies') || tLower.includes('creatures') || tLower.includes('one creature/level') ? 'party' : 'single');
        enrichedCount++;
      }
    }
  }

  const serializedSpells = JSON.stringify(spells, null, 2);
  fs.writeFileSync(SRD_SPELLS_PATH, serializedSpells, 'utf8');

  // Update srd_index.json hash and bytes
  if (fs.existsSync(SRD_INDEX_PATH)) {
    const idx = JSON.parse(fs.readFileSync(SRD_INDEX_PATH, 'utf8'));
    const spellBytes = Buffer.byteLength(serializedSpells, 'utf8');
    const spellHash = crypto.createHash('sha256').update(serializedSpells).digest('hex').slice(0, 16);
    if (idx.chunks && idx.chunks['srd_spells.json']) {
      idx.chunks['srd_spells.json'].bytes = spellBytes;
      idx.chunks['srd_spells.json'].hash = spellHash;
    }
    const allChunkHashes = Object.values(idx.chunks || {}).map(c => c.hash).join(':');
    idx.compendiumHash = crypto.createHash('sha256').update(allChunkHashes).digest('hex').slice(0, 16);
    fs.writeFileSync(SRD_INDEX_PATH, JSON.stringify(idx), 'utf8');
  }

  // Merge Splatbook Buff Spells into master_db.json
  let masterDb = [];
  if (fs.existsSync(MASTER_DB_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(MASTER_DB_PATH, 'utf8'));
      if (Array.isArray(parsed)) masterDb = parsed;
    } catch (_) {}
  }

  let splatAdded = 0;
  for (const splat of SPLATBOOK_BUFF_SPELLS) {
    const existingIdx = masterDb.findIndex(e => e && (e.id === splat.id || (e.name && e.name.toLowerCase() === splat.name.toLowerCase())));
    if (existingIdx !== -1) {
      masterDb[existingIdx] = { ...masterDb[existingIdx], ...splat };
    } else {
      masterDb.push(splat);
    }
    splatAdded++;
  }
  fs.writeFileSync(MASTER_DB_PATH, JSON.stringify(masterDb, null, 2), 'utf8');

  console.log(`[OK] Enriched ${enrichedCount} SRD buff spells/powers in database/srd_spells.json`);
  console.log(`[OK] Seeded ${splatAdded} Splatbook buff spells (Primal series, Greater Mighty Wallop, etc.) in master_db.json`);
}

main();
