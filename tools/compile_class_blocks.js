/**
 * Class / ClassAbility V3 blocks (idempotent). Step 2 of the "text-only mechanics" plan.
 *
 * Class records keep their inline `features` rows as display text; the engine only applies a row when it carries an
 * immutable `cab-*` id (collectLegoEntries -> ClassAbility entries). This module
 *   1. creates the missing `cab-*` records with V3 `effects[]` / `modes[]` / `powers[]`,
 *   2. fixes existing `cab-*` records that scaled with `@level` (character level) instead of the class level,
 *   3. links the class feature rows to those ids.
 * Level scaling uses `@classes.<slug>.level` so it never depends on the entry's source class.
 *
 * Run alone (does NOT run the full compile):  node tools/compile_class_blocks.js
 * Also called from `tools/compile_v3_mechanics.js` main().
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = path.resolve(__dirname, '..', 'database');

const lvl = (slug) => `@classes.${slug}.level`;
// tier('barbarian', [[20, 8], [11, 6]], 4) -> "@classes.barbarian.level >= 20 ? 8 : (... >= 11 ? 6 : 4)"
// descending list [[20,8],[11,6]] is expected; builds nested ternaries from the highest threshold.
function tierDesc(slug, steps, base) {
  const sorted = steps.slice().sort((a, b) => b[0] - a[0]);
  let expr = String(base);
  for (let i = sorted.length - 1; i >= 0; i--) {
    expr = `${lvl(slug)} >= ${sorted[i][0]} ? ${sorted[i][1]} : ${i === sorted.length - 1 ? expr : '(' + expr + ')'}`;
  }
  return expr;
}

const stat = (id, targets, formula, btype) => ({ id, type: 'stat', targets: Array.isArray(targets) ? targets : [targets], mode: 'formula', value: 0, formula, btype });
const flat = (id, targets, value, btype) => ({ id, type: 'stat', targets: Array.isArray(targets) ? targets : [targets], mode: 'flat', value, btype });
const whenState = (id, condKind, condText, effects) => ({ id, type: 'when', flow: 'while', branches: [{ id: id + '-br', condKind, condText, effects }] });
const defense = (id, mode, what, extra) => Object.assign({ id, type: 'defense', mode, what }, extra || {});
const resource = (id, name, varKey, maxFormula) => ({ id, type: 'resource', name, varKey, resMode: 'spend', maxFormula, reset: 'perDay', unit: 'uses', recharge: { period: 'day' } });
const modesOffOn = (key, name, label, effects) => ([
  { id: `mode-${key}-off`, name: 'Inactive', label: 'Inactive', effects: [] },
  { id: `mode-${key}-on`, name, label, effects }
]);

function makeCab(spec) {
  const rec = {
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
    effects: spec.effects || [],
    shortDescription: spec.shortDescription,
    text: spec.text || spec.shortDescription,
    tags: ['class-ability']
  };
  if (spec.modes) rec.modes = spec.modes;
  if (spec.powers) rec.powers = spec.powers;
  return rec;
}

// ---------------------------------------------------------------------------------------------------------------
// New records. `link`: [classId, rowNameRegex] pairs; the row gets `id` (rows that already carry an id are kept
// unless `force`).
// ---------------------------------------------------------------------------------------------------------------
const NEW_CABS = [
  // Barbarian (PHB p.25): DR 1/- at 7th, +1 every three levels (10, 13, 16, 19).
  {
    id: 'cab-barbarian-damage-reduction', name: 'Damage Reduction (Ex)', source: 'SRD / PHB p.25', abilityType: 'ex',
    associations: [['Barbarian', 7]],
    shortDescription: 'Subtract 1 from the damage taken each time you are dealt damage from a weapon or natural attack; increases by 1 every three levels after 7th (maximum 5/- at 19th).',
    effects: [{
      id: 'ef-barb-dr', type: 'table', key: 'classLevel',
      rows: [[7, 9, 1], [10, 12, 2], [13, 15, 3], [16, 18, 4], [19, 99, 5]].map(([min, max, v]) => ({ min, max, blocks: [defense(`ef-barb-dr-${v}`, 'Damage Reduction', '-', { value: v })] }))
    }],
    link: [['cls-barbarian', /^Damage Reduction/i]]
  },
  // Druid (PHB p.36)
  {
    id: 'cab-venom-immunity', name: 'Venom Immunity (Ex)', source: 'SRD / PHB p.36', abilityType: 'ex',
    associations: [['Druid', 9]],
    shortDescription: 'Immunity to all organic poisons (monster, plant, and giant vermin poisons).',
    effects: [defense('ef-venom-imm', 'Immunity', 'Poison', { text: 'Immune to all organic poisons' })],
    link: [['cls-druid', /^Venom Immunity/i]]
  },
  // Dwarven Defender (DMG p.? / SRD)
  {
    id: 'cab-dwarven-defender-ac-bonus', name: 'AC Bonus (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Dwarven Defender', 1]],
    shortDescription: 'Dodge bonus to Armor Class: +1 at 1st level, +2 at 4th, +3 at 7th, +4 at 10th.',
    effects: [stat('ef-dd-ac', 'ac.dodge', `1 + floor((${lvl('dwarven_defender')} - 1) / 3)`, 'Dodge')],
    link: [['cls-dwarven-defender', /^AC Bonus/i]]
  },
  {
    id: 'cab-dwarven-defender-damage-reduction', name: 'Damage Reduction (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Dwarven Defender', 6]],
    shortDescription: 'Damage reduction 3/- at 6th level, 6/- at 10th level.',
    effects: [{
      id: 'ef-ddef-dr', type: 'table', key: 'classLevel',
      rows: [{ min: 6, max: 9, blocks: [defense('ef-ddef-dr-3', 'Damage Reduction', '-', { value: 3 })] }, { min: 10, max: 99, blocks: [defense('ef-ddef-dr-6', 'Damage Reduction', '-', { value: 6 })] }]
    }],
    link: [['cls-dwarven-defender', /^Damage Reduction/i]]
  },
  // Dragon Disciple (DMG): natural armor, ability boosts, claws and bite, breath weapon, blindsense, apotheosis
  {
    id: 'cab-dragon-disciple-natural-armor', name: 'Natural Armor Increase (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Dragon Disciple', 1]],
    shortDescription: 'Existing natural armor bonus increases by +1 at 1st, 4th and 7th level; Dragon Apotheosis (10th) brings the total to +4.',
    effects: [stat('ef-ddisc-na', 'ac.natural', tierDesc('dragon_disciple', [[10, 4], [7, 3], [4, 2]], 1), 'Natural')],
    link: [['cls-dragon-disciple', /^Natural Armor Increase/i]]
  },
  {
    id: 'cab-dragon-disciple-ability-boost', name: 'Ability Boost (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Dragon Disciple', 2]],
    shortDescription: 'Str +2 at 2nd and 4th level, Con +2 at 6th, Int +2 at 8th; Dragon Apotheosis (10th) adds Str +4 and Cha +2.',
    effects: [
      stat('ef-ddisc-str', 'str', `(${lvl('dragon_disciple')} >= 2 ? 2 : 0) + (${lvl('dragon_disciple')} >= 4 ? 2 : 0) + (${lvl('dragon_disciple')} >= 10 ? 4 : 0)`, 'Untyped'),
      stat('ef-ddisc-con', 'con', `${lvl('dragon_disciple')} >= 6 ? 2 : 0`, 'Untyped'),
      stat('ef-ddisc-int', 'int', `${lvl('dragon_disciple')} >= 8 ? 2 : 0`, 'Untyped'),
      stat('ef-ddisc-cha', 'cha', `${lvl('dragon_disciple')} >= 10 ? 2 : 0`, 'Untyped')
    ],
    link: [['cls-dragon-disciple', /^Ability Boost/i]]
  },
  {
    id: 'cab-dragon-disciple-claws-and-bite', name: 'Claws and Bite (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Dragon Disciple', 2]],
    shortDescription: 'Gain two claw attacks (1d4) and a bite attack (1d6) for Medium size.',
    effects: [
      { id: 'ef-ddisc-bite', type: 'attack', attackMode: 'natural', natKind: 'primary', count: 1, weaponName: 'Bite', dice: '1d6', dmgType: 'Piercing', summary: 'Bite 1d6 piercing natural weapon (primary).' },
      { id: 'ef-ddisc-claw', type: 'attack', attackMode: 'natural', natKind: 'primary', count: 2, weaponName: 'Claw', dice: '1d4', dmgType: 'Slashing', usesHands: true, summary: '2 Claw 1d4 slashing natural weapon (primary).' }
    ],
    link: [['cls-dragon-disciple', /^Claws and Bite/i]]
  },
  {
    id: 'cab-dragon-disciple-breath-weapon', name: 'Breath Weapon (Su)', source: 'SRD / DMG', abilityType: 'su',
    associations: [['Dragon Disciple', 3]],
    shortDescription: 'Once per day, a breath weapon of the chosen dragon variety: 2d8 at 3rd level, 4d8 at 7th, 6d8 at 10th (Reflex half, DC 10 + class level + Con modifier).',
    effects: [],
    powers: [{
      id: 'pw-ddisc-breath', kind: 'inline', name: 'Breath Weapon (Su, Dragon Disciple)', action: 'Standard',
      usage: { mode: 'perDay', uses: 1 },
      dcFormula: `10 + ${lvl('dragon_disciple')} + @conMod`,
      save: { type: 'Reflex', effect: 'Half' },
      effects: [{ type: 'roll', kind: 'Damage', dmgType: 'Energy', dice: `(${tierDesc('dragon_disciple', [[10, 6], [7, 4]], 2)})d8`, crit: 'normal', save: 'Reflex half', source: 'Breath Weapon' }],
      text: 'Energy type and shape (cone or line) follow the chosen dragon variety. 2d8 at 3rd level, 4d8 at 7th, 6d8 at 10th.'
    }],
    link: [['cls-dragon-disciple', /^Breath Weapon/i]]
  },
  {
    id: 'cab-dragon-disciple-blindsense', name: 'Blindsense (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Dragon Disciple', 5]],
    shortDescription: 'Blindsense 30 ft. at 5th level, 60 ft. at 10th level.',
    effects: [{
      id: 'ef-ddisc-bs', type: 'table', key: 'classLevel',
      rows: [{ min: 5, max: 9, blocks: [defense('ef-ddisc-bs-30', 'Sense / Movement', 'Blindsense 30 ft.')] }, { min: 10, max: 99, blocks: [defense('ef-ddisc-bs-60', 'Sense / Movement', 'Blindsense 60 ft.')] }]
    }],
    link: [['cls-dragon-disciple', /^Blindsense/i]]
  },
  {
    id: 'cab-dragon-disciple-apotheosis', name: 'Dragon Apotheosis (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Dragon Disciple', 10]],
    shortDescription: 'Acquire the half-dragon template: darkvision 60 ft., low-light vision, immunity to sleep, paralysis and the chosen dragon energy type. (Ability and natural armor increases are in Ability Boost / Natural Armor Increase.)',
    effects: [
      defense('ef-ddisc-apo-sleep', 'Immunity', 'Sleep'),
      defense('ef-ddisc-apo-para', 'Immunity', 'Paralysis'),
      defense('ef-ddisc-apo-dv', 'Sense / Movement', 'Darkvision 60 ft.'),
      defense('ef-ddisc-apo-ll', 'Sense / Movement', 'Low-Light Vision')
    ],
    link: [['cls-dragon-disciple', /^Dragon Apotheosis/i]]
  },
  // Duelist (DMG)
  {
    id: 'cab-duelist-canny-defense', name: 'Canny Defense (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Duelist', 1]],
    shortDescription: 'When wearing no armor and not using a shield, add your Intelligence bonus (maximum equal to your Duelist level) as a dodge bonus to AC while wielding a melee weapon.',
    effects: [whenState('ef-duel-canny', 'state', 'unarmoredNoShield', [stat('ef-duel-canny-ac', 'ac.dodge', `min(max(0, @intMod), ${lvl('duelist')})`, 'Dodge')])],
    link: [['cls-duelist', /^Canny Defense/i]]
  },
  {
    id: 'cab-duelist-improved-reaction', name: 'Improved Reaction (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Duelist', 2]],
    shortDescription: '+2 competence bonus on initiative checks at 2nd level, +4 at 8th level.',
    effects: [stat('ef-duel-init', 'init', tierDesc('duelist', [[8, 4]], 2), 'Competence')],
    link: [['cls-duelist', /^Improved Reaction/i]]
  },
  {
    id: 'cab-duelist-enhanced-mobility', name: 'Enhanced Mobility (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Duelist', 3]],
    shortDescription: 'When wearing no armor and not using a shield, +4 dodge bonus to AC against attacks of opportunity provoked by moving (stacks with Mobility).',
    effects: [whenState('ef-duel-mob', 'vsAoOFromMovement', '', [flat('ef-duel-mob-ac', 'ac.dodge', 4, 'Dodge')])],
    link: [['cls-duelist', /^Enhanced Mobility/i]]
  },
  {
    id: 'cab-duelist-grace', name: 'Grace (Ex)', source: 'SRD / DMG', abilityType: 'ex',
    associations: [['Duelist', 4]],
    shortDescription: '+2 competence bonus on Reflex saving throws when wearing no armor and not using a shield.',
    effects: [whenState('ef-duel-grace', 'state', 'unarmoredNoShield', [flat('ef-duel-grace-ref', 'save.ref', 2, 'Competence')])],
    link: [['cls-duelist', /^Grace/i, true]]
  },
  // Dervish (Complete Warrior). NOT verifiable from the books on disk (no text layer); values follow the record text.
  {
    id: 'cab-dervish-fast-movement', name: 'Fast Movement (Ex)', source: 'Complete Warrior', abilityType: 'ex',
    associations: [['Dervish', 2]],
    shortDescription: '+5 ft. enhancement bonus to land speed at 2nd level, +10 ft. at 5th, +15 ft. at 8th.',
    effects: [stat('ef-derv-speed', 'speed.land', tierDesc('dervish', [[8, 15], [5, 10]], 5), 'Enhancement')],
    link: [['cls-dervish', /^Fast Movement/i, true]]
  },
  {
    id: 'cab-dervish-ac-bonus', name: 'AC Bonus (Ex)', source: 'Complete Warrior', abilityType: 'ex',
    associations: [['Dervish', 1]],
    shortDescription: 'AC bonus when wearing no or light armor and not carrying a shield: +1 at 1st level, +2 at 5th, +3 at 9th.',
    effects: [whenState('ef-derv-ac', 'state', 'lightOrNoArmorNoShield', [stat('ef-derv-ac-b', 'ac.total', tierDesc('dervish', [[9, 3], [5, 2]], 1), 'Untyped')])],
    link: [['cls-dervish', /^AC Bonus/i]]
  },
  {
    id: 'cab-dervish-dance', name: 'Dervish Dance (Ex)', source: 'Complete Warrior', abilityType: 'ex',
    associations: [['Dervish', 1]],
    shortDescription: 'Full attack with a slashing weapon while moving; +1 attack and damage per odd Dervish level, usable 1/day at 1st level, +1/day at 3rd, 5th, 7th and 9th.',
    effects: [resource('ef-derv-dance-res', 'Dervish Dance', 'dervish_dance_uses', `floor((${lvl('dervish')} + 1) / 2)`)],
    modes: modesOffOn('derv-dance', 'Dervish Dance', 'Dervish Dance (+1 attack/damage per odd Dervish level)', [
      stat('ef-derv-dance-atk', 'atk.melee', `floor((${lvl('dervish')} + 1) / 2)`, 'Untyped'),
      stat('ef-derv-dance-dmg', 'dmg.melee', `floor((${lvl('dervish')} + 1) / 2)`, 'Untyped')
    ]),
    link: [['cls-dervish', /^Dervish Dance/i]]
  },
  {
    id: 'cab-dervish-improved-reaction', name: 'Improved Reaction (Ex)', source: 'Complete Warrior', abilityType: 'ex',
    associations: [['Dervish', 6]],
    shortDescription: '+2 bonus on initiative checks.',
    effects: [flat('ef-derv-init', 'init', 2, 'Competence')],
    link: [['cls-dervish', /^Improved Reaction/i]]
  },
  // Red Wizard (Unapproachable East / SRD)
  {
    id: 'cab-red-wizard-specialist-defense', name: 'Specialist Defense (Ex)', source: 'SRD', abilityType: 'ex',
    associations: [['Red Wizard', 1]],
    shortDescription: 'Bonus on saving throws against spells from your specialist school: +1 at 1st level, +2 at 3rd, +3 at 7th, +4 at 9th.',
    effects: [whenState('ef-rw-def', 'situational', 'vs. Spells from Specialist School', [stat('ef-rw-def-s', 'save.all', tierDesc('red_wizard', [[9, 4], [7, 3], [3, 2]], 1), 'Untyped')])],
    link: [['cls-red-wizard', /^Specialist Defense/i]]
  },
  // Shadowdancer (DMG)
  {
    id: 'cab-shadowdancer-darkvision', name: 'Darkvision (Su)', source: 'SRD / DMG', abilityType: 'su',
    associations: [['Shadowdancer', 2]],
    shortDescription: 'Darkvision 60 ft. (or +30 ft. to existing darkvision).',
    effects: [defense('ef-shdn-dv', 'Sense / Movement', 'Darkvision 60 ft.')],
    link: [['cls-shadowdancer', /^Darkvision/i]]
  },
];

// ---------------------------------------------------------------------------------------------------------------
// Patches to existing cab records (rewrite `effects` / `modes`). `link` as above (rows that exist but lack an id).
// ---------------------------------------------------------------------------------------------------------------
const PATCHES = {
  // Greater Rage (11th) and Mighty Rage (20th) were rows of cab-rage but the mode stayed +4/+4/+2.
  'cab-rage': (rec) => {
    const L = lvl('barbarian');
    const strCon = `${L} >= 20 ? 8 : (${L} >= 11 ? 6 : 4)`;
    const will = `${L} >= 20 ? 4 : (${L} >= 11 ? 3 : 2)`;
    rec.modes = [
      { id: 'mode-rage-calm', name: 'Calm', label: 'Calm', effects: [] },
      {
        id: 'mode-rage-active', name: 'Raging', label: 'Raging (+4 STR/CON, +2 Will, -2 AC; +6/+3 Greater Rage, +8/+4 Mighty Rage)',
        effects: [
          stat('ef-rage-str', ['str', 'con'], strCon, 'Morale'),
          stat('ef-rage-will', ['save.will'], will, 'Morale'),
          flat('ef-rage-ac', ['ac.total'], -2, 'Untyped')
        ]
      }
    ];
  },
  // Inspire Courage already exists (attack/damage). Add the saves vs. charm/fear and the self-targetable songs
  // (PHB p.28-29: Inspire Greatness and Inspire Heroics may be used on the bard himself).
  'cab-bardic-music': (rec) => {
    const B = '@bardLevel';
    const ic = `${B} >= 20 ? 4 : (${B} >= 14 ? 3 : (${B} >= 8 ? 2 : 1))`;
    const modes = Array.isArray(rec.modes) ? rec.modes.filter((m) => m && ['mode-bm-off', 'mode-bm-ic'].includes(m.id)) : [];
    const icMode = modes.find((m) => m.id === 'mode-bm-ic');
    if (icMode) {
      icMode.label = 'Inspire Courage (+1..+4 Morale Atk/Dmg, +1..+4 vs Charm & Fear)';
      icMode.effects = (icMode.effects || []).filter((e) => e && e.id === 'ef-bm-ic-atk');
      icMode.effects.push(whenState('ef-bm-ic-sv', 'situational', 'vs. Charm and Fear Effects', [stat('ef-bm-ic-sv-s', 'save.all', ic, 'Morale')]));
    }
    modes.push({
      id: 'mode-bm-greatness', name: 'Inspire Greatness', label: 'Inspire Greatness (Bard 9+; +2 attack, +1 Fort; bonus HD not applied)',
      effects: [stat('ef-bm-ig-atk', 'atk.all', `${B} >= 9 ? 2 : 0`, 'Competence'), stat('ef-bm-ig-fort', 'save.fort', `${B} >= 9 ? 1 : 0`, 'Competence')]
    });
    modes.push({
      id: 'mode-bm-heroics', name: 'Inspire Heroics', label: 'Inspire Heroics (Bard 15+; +4 saves, +4 dodge AC)',
      effects: [stat('ef-bm-ih-sv', 'save.all', `${B} >= 15 ? 4 : 0`, 'Morale'), stat('ef-bm-ih-ac', 'ac.dodge', `${B} >= 15 ? 4 : 0`, 'Dodge')]
    });
    rec.modes = modes;
  },
  // Assassin (DMG): +1 at 2nd, +2 at 4th ... +5 at 10th = floor(level / 2); it used the character level.
  'cab-save-bonus-against-poison': (rec) => {
    rec.effects = [whenState('ef-asn-psn', 'situational', 'vs. Poison', [stat('ef-asn-psn-s', 'save.all', `floor(${lvl('assassin')} / 2)`, 'Untyped')])];
    rec.link = [['cls-assassin', /^\+\d Save against Poison/i]];
  },
  // Blackguard (DMG): 1/day at 2nd, 2/day at 5th, 3/day at 10th; +Cha attack, +Blackguard level damage (melee).
  'cab-smite-good': (rec) => {
    rec.effects = [resource('ef-smg-r', 'Smite Good', 'smite_good', `1 + (${lvl('blackguard')} >= 5 ? 1 : 0) + (${lvl('blackguard')} >= 10 ? 1 : 0)`)];
    rec.modes = modesOffOn('smg', 'Smite Good', 'Smite Good (+CHA Atk, +Blackguard Lvl Dmg)', [
      stat('ef-smg-a', 'atk.melee', 'max(0, @chaMod)', 'Untyped'),
      stat('ef-smg-d', 'dmg.melee', lvl('blackguard'), 'Untyped')
    ]);
    rec.link = [['cls-blackguard', /^Smite Good/i]];
  },
  // Dwarven Defender (DMG): the old block was an unconditional `state` branch (would be a permanent +4 Con); use modes.
  'cab-defensive-stance': (rec) => {
    rec.effects = [resource('ef-defst-res', 'Defensive Stance', 'defensive_stance_uses', `floor((${lvl('dwarven_defender')} + 1) / 2)`)];
    rec.modes = modesOffOn('defst', 'Defensive Stance', 'Defensive Stance (+2 STR, +4 CON, +2 resistance on saves, +4 dodge AC)', [
      flat('ef-defst-str', 'str', 2, 'Untyped'), flat('ef-defst-con', 'con', 4, 'Untyped'),
      flat('ef-defst-sv', 'save.all', 2, 'Resistance'), flat('ef-defst-ac', 'ac.dodge', 4, 'Dodge')
    ]);
    rec.link = [['cls-dwarven-defender', /^Defensive Stance/i]];
  },
  // Arcane Trickster (DMG): 1/day at 1st, 2/day at 5th, 3/day at 9th (the old formula used the character level).
  'cab-ranged-legerdemain': (rec) => {
    rec.effects = (rec.effects || []).filter((e) => e && e.id !== 'ef-rl-res');
    rec.effects.unshift(resource('ef-rl-res', 'Ranged Legerdemain', 'ranged_legerdemain_uses', `1 + (${lvl('arcane_trickster')} >= 5 ? 1 : 0) + (${lvl('arcane_trickster')} >= 9 ? 1 : 0)`));
    rec.link = [['cls-arcane-trickster', /^Ranged Legerdemain/i]];
  },
  // 1/day at 3rd, 2/day at 7th.
  'cab-impromptu-sneak-attack': (rec) => {
    (rec.effects || []).forEach((e) => {
      if (e && e.id === 'ef-isa-r') {
        e.maxFormula = `1 + (${lvl('arcane_trickster')} >= 7 ? 1 : 0)`;
        e.scaling = 'formula';
      }
    });
    rec.link = [['cls-arcane-trickster', /^Impromptu Sneak Attack/i]];
  }
};

// Dropped: the engine already resolves these rows by name to the Feat entry (granted bonus feat), so a cab would double them.
const REMOVED_CABS = ['cab-dervish-spring-attack', 'cab-thaumaturgist-augment-summoning'];

function applyAll(crData) {
  const stats = { created: 0, patched: 0, linked: 0, missingClass: [] };
  for (let i = crData.length - 1; i >= 0; i--) if (crData[i] && REMOVED_CABS.includes(crData[i].id)) crData.splice(i, 1);
  crData.forEach((cls) => {
    if (!cls || cls.type !== 'Class') return;
    const lists = Object.values(cls.features || {}).filter(Array.isArray);
    const prog = cls.progression;
    ((prog && (prog.levels || prog.milestones)) || []).forEach((lv) => { if (lv && Array.isArray(lv.features)) lists.push(lv.features); });
    lists.forEach((rows) => rows.forEach((row) => {
      if (!row || (row.id !== undefined && !REMOVED_CABS.includes(row.id)) && (row.refId === undefined || !REMOVED_CABS.includes(row.refId))) return;
      if (REMOVED_CABS.includes(row.id)) delete row.id;
      if (REMOVED_CABS.includes(row.refId)) { delete row.refId; row.kind = 'inline'; }
    }));
  });
  const linkJobs = [];
  for (const spec of NEW_CABS) {
    const rec = makeCab(spec);
    const idx = crData.findIndex((e) => e && e.id === spec.id);
    if (idx >= 0) crData[idx] = rec; else { crData.push(rec); stats.created++; }
    (spec.link || []).forEach((l) => linkJobs.push({ cab: spec.id, classId: l[0], rx: l[1], force: Boolean(l[2]) }));
  }
  for (const [id, fn] of Object.entries(PATCHES)) {
    const rec = crData.find((e) => e && e.id === id);
    if (!rec) continue;
    fn(rec);
    stats.patched++;
    (rec.link || []).forEach((l) => linkJobs.push({ cab: id, classId: l[0], rx: l[1], force: Boolean(l[2]) }));
    delete rec.link;
  }
  for (const job of linkJobs) {
    const cls = crData.find((e) => e && e.id === job.classId);
    if (!cls || !cls.features) { stats.missingClass.push(job.classId); continue; }
    // The engine builds the class definition from progression.levels[].features (kind 'ref' + refId); the legacy
    // `features` map is kept in sync (id) because tools and the Rule Master still read it.
    const rowLists = Object.values(cls.features).filter(Array.isArray);
    const prog = cls.progression;
    const progRows = prog && Array.isArray(prog.levels) ? prog.levels : (prog && Array.isArray(prog.milestones) ? prog.milestones : []);
    progRows.forEach((lv) => { if (lv && Array.isArray(lv.features)) rowLists.push(lv.features); });
    rowLists.forEach((rows) => {
      rows.forEach((row) => {
        if (!row || typeof row !== 'object' || !row.name || typeof row.name !== 'string') return;
        const clean = String(row.name).replace(/\s*\((Ex|Su|Sp)\)\s*$/i, '').trim();
        if (!job.rx.test(clean)) return;
        const cur = row.refId || row.id;
        if (cur && cur !== job.cab && !job.force) return;
        if (cur === job.cab) return;
        if (Object.prototype.hasOwnProperty.call(row, 'kind') || 'abilityType' in row) { row.kind = 'ref'; row.refId = job.cab; } else { row.id = job.cab; }
        stats.linked++;
      });
    });
  }
  return stats;
}

function runOnly() {
  const fp = path.join(DB_DIR, 'srd_classes_races.json');
  const raw = fs.readFileSync(fp, 'utf8');
  const wasMin = raw.split('\n').length <= 5;
  const data = JSON.parse(raw);
  const stats = applyAll(data);
  fs.writeFileSync(fp, (wasMin ? JSON.stringify(data) : JSON.stringify(data, null, 2)) + '\n');
  return stats;
}

module.exports = { applyAll, runOnly, NEW_CABS, PATCHES };

if (require.main === module) {
  console.log(JSON.stringify(runOnly()));
}
void crypto;
