/**
 * D&D 3.5e V2.5 Composable Lego Object Engine — 21-Example Benchmark & Security Test Suite
 * Verifies 15 DM Boon / SRD Golden Set cases + 6 Giant in the Playground / ENWorld Forum Edge Cases
 * against a deterministic Level 8 Test Character with expected numeric outputs.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const srdCompendiumCode = fs.readFileSync(path.join(rootDir, 'srd_compendium.js'), 'utf8');
const ruleEngineCode = fs.readFileSync(path.join(rootDir, 'rule_engine.js'), 'utf8');
const sandbox = { window: {}, console, Math, Number, String, Array, Object, Set, Map, JSON, RegExp };
vm.createContext(sandbox);
vm.runInContext(`${srdCompendiumCode}\n${ruleEngineCode}\nwindow.RuleEngine = RuleEngine;`, sandbox);
const RuleEngine = sandbox.window.RuleEngine;
const SchemaMigrator = sandbox.window.SchemaMigrator;

let passed = 0;
let failed = 0;

function assertEq(testName, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL [${testName}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function createBaseChar(overrides = {}) {
  return Object.assign({
    level: 8,
    bab: 6,
    abilities: {
      str: { base: 14 }, // +2
      dex: { base: 14 }, // +2
      con: { base: 16 }, // +3
      int: { base: 12 }, // +1
      wis: { base: 10 }, // +0
      cha: { base: 18 }  // +4
    },
    baseSaves: { fort: 6, ref: 2, will: 6 },
    classLevels: { sorcerer: 6, duelist: 2 },
    skills: { perform_dance: { total: 23, ranks: 11 } },
    legoState: { perform_dance_roll: 24 },
    activeToggles: { vs_targeted_spell: true, dancing: true, charging: true },
    activeTerrain: 'swamp',
    wornArmorCategory: 'Light',
    spells: {
      prepared: [
        { name: 'Fireball', level: 3, descriptor: 'Fire', school: 'Evocation', spent: false },
        { name: 'Scorching Ray', level: 2, descriptor: 'Fire', school: 'Evocation', spent: false }
      ]
    },
    legoEntries: []
  }, overrides);
}

// ============================================================================
// PART A: 15 GOLDEN SET EXAMPLES (DM BOONS & SRD)
// ============================================================================

// 1 & 2. Breath Weapon 4d8 Acid, DC 10 + lvl + Con (10 + 8 + 3 = 21), 60ft, recharge 1d4+1
{
  const ch = createBaseChar({
    legoEntries: [{
      id: 'boon_breath_weapon',
      name: 'Breath Weapon',
      type: 'Special Ability',
      tags: ['breath_weapon', 'acid'],
      resources: [{ id: 'breath_cd', name: 'Breath Recharge', kind: 'consume', maxFormula: 1, recharge: { period: 'rounds', dice: '1d4+1' } }],
      modes: [{
        id: 'acid_breath',
        name: 'Acid Breath',
        actionType: 'standard',
        area: '60 ft. line',
        save: { type: 'Reflex', dcFormula: '10 + @level + @conMod', onSave: 'half' },
        damageParts: [{ dice: '4d8', bonus: 0, type: 'Acid' }]
      }]
    }]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('1. Breath Weapon Dice (4d8 Acid)', res.modes[0].damageParts[0].dice, '4d8');
  assertEq('2. Breath Weapon Non-RAW DC (10 + 8 + 3 = 21)', res.modes[0].dc, 21);
  assertEq('1b. Breath Weapon Recharge Dice (1d4+1)', res.resources.breath_cd.recharge.dice, '1d4+1');
}

// 3. Nat AC 2 + 1/4lvl (Level 8 -> 2 + 2 = +4 Natural Armor -> Normal AC 10 + 2 DEX + 4 Nat = 16)
{
  const ch = createBaseChar({
    legoEntries: [{
      id: 'boon_nat_ac',
      name: 'Draconic Natural Armor',
      type: 'DM Boon',
      modifiers: [{ target: 'ac.natural', op: 'add', formula: '2 + floor(@level / 4)', type: 'Natural Armor' }]
    }]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('3. Nat AC 2 + 1/4lvl at Lvl 8 (+4 Nat AC -> AC 16)', res.ac.normal, 16);
}

// 4. Acid Resist lvl*2 (Level 8 -> Acid Resist 16)
{
  const ch = createBaseChar({
    legoEntries: [{
      id: 'boon_acid_resist',
      name: 'Acid Resistance',
      type: 'DM Boon',
      defenses: [{ kind: 'resistance', target: 'acid', formula: '@level * 2' }]
    }]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('4. Acid Resist lvl*2 at Lvl 8 (= 16)', res.defenses.resistances.acid, 16);
}

// 5 & 6. Synergy Auto-Unlock (Absorb Magic + Elemental Accustomed -> Arcane Shield) & Selector Mutation (+2 -> +4 Competence Save)
{
  const absorbMagic = {
    id: 'boon_absorb_magic',
    name: 'Absorb Magic',
    type: 'DM Boon',
    modifiers: [{ target: 'save.all', op: 'add', value: 2, type: 'Competence', when: { toggle: 'vs_targeted_spell' } }],
    modes: [{
      id: 'absorb_react',
      name: 'Absorb Spell',
      actionType: 'immediate',
      reactsTo: 'on_spell_targeted',
      inputs: [{ id: 'spellLevel', label: 'Spell Level', type: 'int', min: 1, max: 9 }],
      spawnsBuff: {
        id: 'buff_absorb',
        name: 'Absorb Magic Shield',
        durationRounds: 1,
        tempHpFormula: '10 * @input.spellLevel',
        modifiers: [{ target: 'ac', op: 'add', formula: '@input.spellLevel', type: 'Sacred' }]
      }
    }]
  };
  const elementalAccustomed = {
    id: 'boon_elemental_accustomed',
    name: 'Elemental Accustomed',
    type: 'DM Boon',
    modifiers: [{ target: 'ac.natural', op: 'add', value: 3, type: 'Untyped', when: { terrain: ['marsh', 'bog', 'swamp'] } }],
    defenses: [
      { kind: 'immunity', target: 'acid' },
      { kind: 'dr', target: 'physical', value: 3, bypass: '-', when: { terrain: ['marsh', 'bog', 'swamp'] } }
    ]
  };
  const arcaneShieldInPool = {
    id: 'boon_arcane_shield',
    name: 'Arcane Shield',
    type: 'DM Boon',
    requires: { all: ['boon_absorb_magic', 'boon_elemental_accustomed'] },
    modifiers: [{
      target: 'entity.saveBonus',
      selector: { id: 'boon_absorb_magic' },
      op: 'set',
      value: 4,
      type: 'Competence'
    }]
  };

  const ch = createBaseChar({ legoEntries: [absorbMagic, elementalAccustomed] });
  const res = RuleEngine.evaluateLegoCharacter(ch, [arcaneShieldInPool]);
  assertEq('5. Synergy Auto-Unlock (Arcane Shield unlocked from pool)', res.grantedCapabilities.unlockedEntities.includes('boon_arcane_shield'), true);
  // Will Save = Base 6 + WIS 0 + Mutated Absorb Magic 4 = 10
  assertEq('6. Selector Mutation (Absorb Magic save bonus upgraded 2 -> 4, Will Save = 10)', res.saves.will, 10);
  // Trigger reactive mode with spellLevel = 4 -> 40 Temp HP & +4 Sacred AC
  const trig = RuleEngine.triggerLegoMode(ch, 'boon_absorb_magic', 'absorb_react', { spellLevel: 4 });
  assertEq('6b. Reactive Mode Input (@input.spellLevel=4 -> 40 Temp HP)', trig.tempHpGained, 40);
}

// 7. School Boon (Boon of Low Magic: Level 1-3 spells get +1 DC; Boon of Abjuration grants 1st-level spell at-will)
{
  const ch = createBaseChar({
    legoEntries: [
      {
        id: 'spell_burning_hands',
        name: 'Burning Hands',
        type: 'Spell',
        level: 1,
        school: 'Evocation',
        dcFormula: '10 + 1 + @chaMod', // 10 + 1 + 4 = 15
        modes: [{ id: 'cast', name: 'Cast', save: { type: 'Reflex', dcFormula: '10 + 1 + @chaMod', onSave: 'half' } }]
      },
      {
        id: 'boon_low_magic_lesser',
        name: 'Boon of Low Magic Lesser',
        type: 'DM Boon',
        modifiers: [{ target: 'entity.dc', selector: { type: 'Spell', maxLevel: 3 }, op: 'add', value: 1, sourceLabel: 'Benefit 2' }],
        grants: [{ grantType: 'spell_at_will', filter: { school: 'Abjuration', level: 1 }, sourceLabel: 'Benefit 1' }]
      }
    ]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('7. School/Level Boon (+1 DC to Lvl 1-3 spells: 15 -> 16)', res.modes[0].dc, 16);
  assertEq('7b. At-Will Spell Grant recorded', res.grantedCapabilities.spellsAtWill.length, 1);
}

// 8. Stacking On-Kill Counter Buff (Boon of Bloodlust Lesser: +1 dmg/kill up to +10)
{
  const ch = createBaseChar({
    legoEntries: [{
      id: 'buff_bloodlust_active',
      name: 'Boon of Bloodlust (Kills)',
      type: 'DM Boon',
      stacks: 5,
      modifiers: [{ target: 'damage.all', op: 'add', formula: 'min(10, @self.stacks)', type: 'Untyped', sourceLabel: 'Benefit 1' }]
    }]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  const dmgEntry = res.entries.find(e => e.id === 'buff_bloodlust_active');
  assertEq('8. Bloodlust Stacking Counter (5 kills -> +5 dmg)', RuleEngine.evaluateFormula(dmgEntry.modifiers[0].formula, { self: { stacks: 5 } }), 5);
}

// 9. Weapon Die Step Upgrade (Boon of Blacksmith Lesser: crafted 1d6 short sword -> 1d8)
{
  const ch = createBaseChar({
    legoEntries: [
      {
        id: 'wpn_crafted_shortsword',
        name: 'Crafted Short Sword',
        type: 'Weapon',
        tags: ['crafted_by_self'],
        weaponMeta: { damageDice: '1d6' },
        damageParts: [{ dice: '1d6', bonus: 0, type: 'Piercing' }],
        modes: [{ id: 'strike', name: 'Strike', damageParts: [{ dice: '1d6', bonus: 0, type: 'Piercing' }] }]
      },
      {
        id: 'boon_blacksmith_lesser',
        name: 'Boon of Blacksmith Lesser',
        type: 'DM Boon',
        modifiers: [{ target: 'entity.damageDice', selector: { type: 'Weapon', tag: 'crafted_by_self' }, op: 'step_die', value: 1 }]
      }
    ]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  const wpn = res.entries.find(e => e.id === 'wpn_crafted_shortsword');
  assertEq('9. Weapon Die Step Upgrade (1d6 -> 1d8)', wpn.weaponMeta.damageDice, '1d8');
}

// 10. Action Economy Mutation (Lockpick/Disable Device or Spell Action -> Move/Swift)
{
  const ch = createBaseChar({
    legoEntries: [
      { id: 'act_disable_device', name: 'Disable Device', type: 'Special Ability', actionType: 'full_round', modes: [{ id: 'use', name: 'Use', actionType: 'full_round' }] },
      { id: 'boon_dexterous', name: 'Boon of Dexterous Lesser', type: 'DM Boon', modifiers: [{ target: 'entity.actionType', selector: { id: 'act_disable_device' }, op: 'set', value: 'move' }] }
    ]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('10. Action Economy Override (full_round -> move)', res.modes[0].actionType, 'move');
}

// 11. Perform (Dance) Check = AC (Boon of Combat Perform Lesser: Dance roll 24 replaces Normal/Touch/FF AC)
{
  const ch = createBaseChar({
    legoEntries: [{
      id: 'boon_combat_perform',
      name: 'Boon of Combat Perform Lesser',
      type: 'DM Boon',
      modifiers: [{
        target: 'ac.total',
        op: 'replace',
        formula: '@state.perform_dance_roll',
        affects: ['normal', 'touch', 'flatFooted'],
        when: { toggle: 'dancing' }
      }]
    }]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('11. Perform Dance Check Replaces AC (= 24)', res.ac.normal, 24);
  assertEq('11b. Perform Dance Touch AC (= 24)', res.ac.touch, 24);
}

// 12 & 13. Warrior Mage Sacrifice Spell -> Heal 5x Spell Level & Draconic Core 2x Breath Weapon Damage
{
  const ch = createBaseChar({
    legoEntries: [
      {
        id: 'boon_breath_weapon',
        name: 'Breath Weapon',
        type: 'Special Ability',
        tags: ['breath_weapon'],
        modes: [{ id: 'breath', name: 'Breath', damageParts: [{ dice: '4d8', bonus: 0, type: 'Acid' }] }]
      },
      {
        id: 'boon_draconic_core',
        name: 'Draconic Core',
        type: 'DM Boon',
        modifiers: [{ target: 'entity.damageMultiplier', selector: { tag: 'breath_weapon' }, op: 'multiply', value: 2 }]
      },
      {
        id: 'boon_warrior_mage',
        name: 'Boon of the Warrior Mage Lesser',
        type: 'DM Boon',
        modes: [{
          id: 'sacrifice_heal',
          name: 'Sacrifice Spell (Heal)',
          actionType: 'swift',
          inputs: [{ id: 'spellLevel', label: 'Spell Level', type: 'int', min: 1, max: 9 }],
          spawnsBuff: { id: 'heal_burst', name: 'Arcane Heal', durationRounds: 1, healFormula: '5 * @input.spellLevel' }
        }]
      }
    ]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('12. Draconic Core 2x Breath Weapon Damage (4d8 -> 8d8)', res.modes[0].damageParts[0].dice, '8d8');
  const healTrig = RuleEngine.triggerLegoMode(ch, 'boon_warrior_mage', 'sacrifice_heal', { spellLevel: 3 });
  assertEq('13. Warrior Mage Spell Sacrifice Heal (Lvl 3 * 5 = 15 HP)', healTrig.healedHp, 15);
}

// 14 & 15. Postponed Fate (3-Round Delay Timer) & Dual-Benefit Ability Shift (+2 STR, -2 CHA)
{
  const ch = createBaseChar({
    legoEntries: [
      {
        id: 'boon_master_of_deferment',
        name: 'Master of Deferment',
        type: 'DM Boon',
        resources: [{ id: 'postponed_fate_hr', name: 'Postponed Fate', kind: 'consume', maxFormula: 1, recharge: { period: 'hour' } }],
        modes: [{
          id: 'postponed_fate',
          name: 'Postponed Fate (Delay 3 Rounds)',
          actionType: 'immediate',
          reactsTo: 'save_failed',
          spawnsBuff: { id: 'timer_postponed_fate', name: 'Delayed Failed Save Effect', durationRounds: 3 }
        }]
      },
      {
        id: 'boon_ability_shift',
        name: 'Ability Shift (+2 Str, -2 Cha)',
        type: 'DM Boon',
        modifiers: [
          { target: 'ability.str', op: 'add', value: 2, type: 'Untyped', sourceLabel: 'Benefit 1' },
          { target: 'ability.cha', op: 'add', value: -2, type: 'Penalty', sourceLabel: 'Benefit 2' }
        ]
      }
    ]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  const deferTrig = RuleEngine.triggerLegoMode(ch, 'boon_master_of_deferment', 'postponed_fate');
  assertEq('14. Postponed Fate Spawns 3-Round Countdown Timer', deferTrig.spawnedBuff.durationRounds, 3);
  assertEq('15. Ability Shift (STR 14->16 [+3], CHA 18->16 [+3])', [res.abilities.str.mod, res.abilities.cha.mod], [3, 3]);
}

// ============================================================================
// PART B: 6 GIANT IN THE PLAYGROUND / ENWORLD FORUM EDGE CASES
// ============================================================================

// Forum #1: "X Stat to Y Bonus" with Candidate Pool & Cap (Steadfast Determination CON +3 vs Force of Personality CHA +4 to Will Save; Canny Defense INT capped by Duelist level)
{
  const ch = createBaseChar({
    legoEntries: [
      {
        id: 'feat_steadfast_determination',
        name: 'Steadfast Determination',
        type: 'Feat',
        modifiers: [{ target: 'save.will.abilityMod', op: 'max', formula: '@conMod', type: 'Untyped' }]
      },
      {
        id: 'feat_force_of_personality',
        name: 'Force of Personality',
        type: 'Feat',
        modifiers: [{ target: 'save.will.abilityMod', op: 'max', formula: '@chaMod', type: 'Untyped' }]
      },
      {
        id: 'feat_canny_defense',
        name: 'Canny Defense',
        type: 'Class Feature',
        modifiers: [{ target: 'ac.dodge', op: 'add', formula: '@intMod', cap: '@classes.duelist.level', type: 'Dodge', when: { armorCategory: ['None', 'Light'] } }]
      }
    ]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  // Base Will 6 + max(WIS 0, CON +3, CHA +4) = 10
  assertEq('Forum 1a. Multi-Candidate Stat Substitution (Will Save uses best of WIS 0, CON +3, CHA +4 -> 10)', res.saves.will, 10);
  // Normal AC = 10 + DEX 2 + Canny Defense 1 (INT +1 capped by Duelist 2) = 13
  assertEq('Forum 1b. Canny Defense Capped by Class Level (AC = 13)', res.ac.normal, 13);
}

// Forum #2: Shock Trooper (Heedless Charge Composite Mode: trade AC instead of Attack for 2H Power Attack)
{
  const ch = createBaseChar({
    legoEntries: [
      { id: 'feat_power_attack', name: 'Power Attack', type: 'Feat' },
      {
        id: 'feat_shock_trooper',
        name: 'Shock Trooper',
        type: 'Feat',
        modes: [{
          id: 'heedless_charge',
          name: 'Heedless Charge (2H)',
          actionType: 'free',
          requires: { has: 'feat_power_attack' },
          inputs: [{ id: 'pa', label: 'Power Attack Penalty', type: 'slider', min: 0, max: '@bab' }],
          spawnsBuff: {
            id: 'buff_heedless_charge',
            name: 'Heedless Charge',
            durationRounds: 1,
            modifiers: [
              { target: 'ac', op: 'add', formula: '-@input.pa', type: 'Penalty' },
              { target: 'damage.melee', op: 'add', formula: '@input.pa * 2', type: 'Untyped' }
            ]
          }
        }]
      }
    ]
  });
  const trig = RuleEngine.triggerLegoMode(ch, 'feat_shock_trooper', 'heedless_charge', { pa: 6 });
  assertEq('Forum 2. Shock Trooper Heedless Charge (PA 6 -> -6 AC, +12 Melee Damage)',
    [trig.spawnedBuff.modifiers[0].value, trig.spawnedBuff.modifiers[1].value], [-6, 12]);
}

// Forum #3: Magic of Incarnum Essentia Allocation Pool (Allocate 3 Essentia -> +3 Insight Save Bonus)
{
  const ch = createBaseChar({
    legoEntries: [{
      id: 'soulmeld_crystal_helm',
      name: 'Crystal Helm (Soulmeld)',
      type: 'Special Ability',
      invested: 3,
      resources: [{ id: 'pool_essentia', name: 'Essentia Pool', kind: 'allocate', maxFormula: 4 }],
      modifiers: [{ target: 'save.will', op: 'add', formula: '@self.invested', type: 'Insight' }]
    }]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('Forum 3. Incarnum Essentia Investment (3 invested -> Will Save 6 + 3 = 9)', res.saves.will, 9);
  assertEq('Forum 3b. Resource Pool Kind = allocate', res.resources.pool_essentia.kind, 'allocate');
}

// Forum #4: Complete Mage Reserve Feat (Fiery Burst scales off highest unspent Fire spell = 3d6)
{
  const ch = createBaseChar({
    legoEntries: [{
      id: 'feat_fiery_burst',
      name: 'Fiery Burst (Reserve)',
      type: 'Feat',
      modes: [{
        id: 'burst',
        name: 'Fiery Burst (At-Will)',
        actionType: 'standard',
        damageParts: [{ dice: "(@spells.maxUnspentLevel('Fire'))d6", bonus: 0, type: 'Fire' }]
      }]
    }]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('Forum 4. Reserve Feat Scaling Dice (3rd-lvl Fireball unspent -> 3d6 Fire)', res.modes[0].damageParts[0].dice, '3d6');
}

// Forum #5: Elemental Damage Absorption & Spell/Heal Multipliers (Elemental Supremacy + Caster Combat + Superior Blood)
{
  const ch = createBaseChar({
    legoEntries: [
      {
        id: 'boon_elemental_supremacy',
        name: 'Elemental Supremacy',
        type: 'DM Boon',
        defenses: [{ kind: 'absorption', target: 'acid', healRatio: 1.0 }]
      },
      {
        id: 'boon_caster_combat',
        name: 'Boon of Caster Combat Lesser',
        type: 'DM Boon',
        modifiers: [{ target: 'spell.damageMultiplier', op: 'add', value: 0.10 }]
      },
      {
        id: 'boon_superior_blood',
        name: 'Boon of Superior Blood Lesser',
        type: 'DM Boon',
        modifiers: [{ target: 'healing.receivedMultiplier', op: 'add', value: 0.25 }]
      }
    ]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('Forum 5a. Acid Damage Absorption Ratio (= 1.0)', res.defenses.absorptions.acid, 1);
  assertEq('Forum 5b. Spell Damage (+10%) & Healing (+25%) Multipliers', [res.multipliers.spellDamage, res.multipliers.healingReceived], [1.1, 1.25]);
}

// Forum #6: Powerful Build Scoped Size & Carrying Capacity x3 (Races of Stone / Boon of Atlas)
{
  const ch = createBaseChar({
    legoEntries: [
      {
        id: 'trait_powerful_build',
        name: 'Powerful Build',
        type: 'Racial Trait',
        modifiers: [{ target: 'size.effective', op: 'add', value: 1, appliesTo: ['grapple', 'bullRush', 'trip', 'weaponSize', 'opposedSize'] }]
      },
      {
        id: 'boon_atlas_lesser',
        name: 'Boon of Atlas Lesser',
        type: 'DM Boon',
        modifiers: [{ target: 'carryingCapacity.multiplier', op: 'multiply', value: 3 }]
      }
    ]
  });
  const res = RuleEngine.evaluateLegoCharacter(ch);
  assertEq('Forum 6a. Powerful Build Scoped Size (+1 Grapple/WeaponSize, AC unchanged at 12)', [res.effectiveSizeScopes.grapple, res.ac.normal], [1, 12]);
  assertEq('Forum 6b. Carrying Capacity Multiplier (x3)', res.multipliers.carryingCapacity, 3);
}

// Security Test: Untrusted DM Pack Formula Injection Attempt MUST return 0 and NEVER execute arbitrary JS
{
  let injected = false;
  sandbox.window.alert = () => { injected = true; };
  const val = RuleEngine.evaluateFormula("alert(1) + process.exit(1)", {});
  assertEq('Security: Zero-eval AST Parser blocks code injection', [injected, val], [false, 0]);
}

// Page Object Interaction Map Test: Dragon Breath (4d8 Acid, 60ft, recharge 1d4+1, action: move)
{
  const dragonBreathMove = {
    id: 'boon_dragon_breath_move',
    name: 'Dragon Breath (Acid)',
    type: 'Special Ability',
    actionType: 'move',
    resources: [{ id: 'breath_cd', name: 'Breath Recharge', kind: 'consume', maxFormula: 1, recharge: { period: 'rounds', dice: '1d4+1' } }],
    modes: [{
      id: 'breath_move',
      name: 'Acid Breath (Move)',
      actionType: 'move',
      area: '60 ft. line',
      save: { type: 'Reflex', dcFormula: '10 + @level + @conMod', onSave: 'half' },
      damageParts: [{ dice: '4d8', bonus: 0, type: 'Acid' }]
    }]
  };
  const imap = RuleEngine.getObjectInteractionMap(dragonBreathMove);
  assertEq('Interaction Map: Dragon Breath (Move, 1d4+1) connects to ActionEconomyBar, CombatSpecialAttacksPanel, and TurnClockNode',
    ['ActionEconomyBar', 'CombatSpecialAttacksPanel', 'TurnClockNode'].every(n => imap.nodes.includes(n) && imap.boundUiTargets.includes(n)), true);
}

// Namespace Isolation & Chained Overrides Test
{
  const srdPA = { id: 'srd:power_attack', name: 'Power Attack (SRD)', modifiers: [{ target: 'damage.melee', op: 'add', value: 1 }] };
  const packAPA = { id: 'pack_a:power_attack', name: 'Power Attack (Pack A)', overrides: 'srd:power_attack', modifiers: [{ target: 'damage.melee', op: 'add', value: 2 }] };
  const packBPA = { id: 'pack_b:power_attack', name: 'Power Attack (Pack B)', modifiers: [{ target: 'damage.melee', op: 'add', value: 4 }] };

  const chCross = createBaseChar({ legoEntries: [srdPA, packAPA, packBPA] });
  const resCross = RuleEngine.evaluateLegoCharacter(chCross);
  const activeCrossIds = resCross.entries.map(e => e.id);
  assertEq('Namespace Override 1: pack_a overriding srd:power_attack suppresses srd:power_attack but NOT pack_b:power_attack',
    [!activeCrossIds.includes('srd:power_attack'), activeCrossIds.includes('pack_a:power_attack'), activeCrossIds.includes('pack_b:power_attack')],
    [true, true, true]);

  const packBChained = { id: 'pack_b:power_attack_v2', name: 'Power Attack (Pack B Chained)', overrides: 'pack_a:power_attack', modifiers: [{ target: 'damage.melee', op: 'add', value: 5 }] };
  const chChain = createBaseChar({ legoEntries: [srdPA, packAPA, packBChained] });
  const resChain = RuleEngine.evaluateLegoCharacter(chChain);
  const activeChainIds = resChain.entries.map(e => e.id);
  assertEq('Namespace Override 2: Chained override (pack_b -> pack_a -> srd) leaves only pack_b active',
    activeChainIds, ['pack_b:power_attack_v2']);

  // B1: Order-independent override when unprefixed SRD entry is paired with packA:power_attack (overrides srd:power_attack)
  const unprefixedPA = { id: 'power_attack', name: 'Power Attack', modifiers: [{ target: 'damage.melee', op: 'add', value: 1 }] };
  const resOrder1 = RuleEngine.evaluateLegoCharacter(createBaseChar({ legoEntries: [unprefixedPA, packAPA, packBPA] }));
  const resOrder2 = RuleEngine.evaluateLegoCharacter(createBaseChar({ legoEntries: [packAPA, unprefixedPA, packBPA] }));
  assertEq('Namespace Override 3 (B1): Order-independent [unprefixed, packA] vs [packA, unprefixed] both suppress unprefixed while keeping packA and packB',
    [resOrder1.entries.map(e => e.id).sort(), resOrder2.entries.map(e => e.id).sort()],
    [['pack_a:power_attack', 'pack_b:power_attack'], ['pack_a:power_attack', 'pack_b:power_attack']]);
}

// Unified Character Collection & Deduplication Test (collectLegoEntries)
{
  const dupBoon = {
    id: 'pack_dm_draconic_boons:boon_scales',
    name: 'Draconic Scales',
    type: 'DM Boon',
    modifiers: [{ target: 'ac.natural', op: 'add', value: 3, type: 'Untyped' }]
  };
  const dupRing = {
    inventoryId: 'inv_ring_prot_1',
    id: 'item_ring_prot',
    name: 'Ring of Protection +2',
    equipped: true,
    modifiers: [{ target: 'ac.deflection', op: 'add', value: 2, type: 'Deflection' }]
  };
  const chDedup = createBaseChar({
    legoEntries: [dupBoon],
    feats: [dupBoon],
    specialAbilities: [Object.assign({}, dupBoon, { id: 'boon_scales' })],
    bodySlots: { ring1: dupRing },
    inventory: [dupRing]
  });
  const collected = RuleEngine.collectLegoEntries(chDedup);
  const evalDedup = RuleEngine.evaluateLegoCharacter(chDedup);
  // Base AC 12 (10 + DEX 2) + 3 Untyped Natural + 2 Deflection = 17 (NOT 20 or 23 from double counting!)
  assertEq('Deduplication: collectLegoEntries deduplicates across legoEntries/feats/specialAbilities and bodySlots/inventory',
    [collected.length, evalDedup.ac.normal], [2, 17]);
}

// Incoming Damage Pipeline Test (B3: Immunity, Vulnerability +50% + Resistance, and Absorption)
{
  const chDef = createBaseChar({
    legoEntries: [
      {
        id: 'boon_def_suite',
        name: 'Elemental Matrix',
        defenses: [
          { kind: 'immunity', target: 'fire' },
          { kind: 'vulnerability', target: 'cold' },
          { kind: 'resistance', target: 'cold', value: 5 },
          { kind: 'absorption', target: 'acid', healRatio: 0.5 }
        ]
      }
    ]
  });
  const evalDef = RuleEngine.evaluateLegoCharacter(chDef);
  const fireRes = RuleEngine.applyIncomingDamage(evalDef, 20, 'Fire');
  const coldRes = RuleEngine.applyIncomingDamage(evalDef, 20, 'Cold'); // 20 * 1.5 = 30 - 5 = 25 taken (-25)
  const acidRes = RuleEngine.applyIncomingDamage(evalDef, 15, 'Acid'); // floor(15 * 0.5) = +7 healed
  assertEq('Incoming Damage (B3): Immunity (0), Vulnerability+Resistance (-25), and Absorption (+7)',
    [fireRes.finalDelta, coldRes.finalDelta, acidRes.finalDelta],
    [0, -25, 7]);
}

// SchemaMigrator V2.5 Preservation Test (m10)
{
  const rawV25 = {
    name: 'Test V2.5 Boon',
    type: 'DM Boon',
    pack: 'pack_test',
    overrides: 'srd:toughness',
    requires: { all: ['srd:power_attack'] },
    defenses: [{ kind: 'resistance', target: 'acid', value: 10 }],
    resources: [{ id: 'res_1', maxFormula: 3 }],
    grants: [{ grantType: 'sense', targetId: 'darkvision', value: 60 }],
    choices: [{ id: 'ch_1', options: ['acid', 'cold'] }]
  };
  const upgraded = SchemaMigrator.upgradeEntryToV2(rawV25);
  assertEq('SchemaMigrator V2.5 Preservation (m10): preserves defenses, resources, grants, choices, requires, overrides, pack',
    [upgraded.pack, upgraded.overrides, Array.isArray(upgraded.defenses) && upgraded.defenses.length, Array.isArray(upgraded.resources) && upgraded.resources.length, Array.isArray(upgraded.grants) && upgraded.grants.length, Array.isArray(upgraded.choices) && upgraded.choices.length, Boolean(upgraded.requires)],
    ['pack_test', 'srd:toughness', 1, 1, 1, 1, true]);
}

// Phase P2 Live Sheet Engine Unification & Parity Gate Test (recalculateCharacter vs evaluateLegoCharacter)
{
  const absorbMagic = {
    id: 'boon_absorb_magic',
    name: 'Absorb Magic',
    type: 'DM Boon',
    modifiers: [{ target: 'save.all', op: 'add', value: 2, type: 'Competence', when: { toggle: 'vs_targeted_spell' } }],
    modes: [{ id: 'absorb_react', name: 'Absorb Spell', actionType: 'immediate', reactsTo: 'on_spell_targeted' }]
  };
  const elemAcc = {
    id: 'boon_elemental_accustomed',
    name: 'Elemental Accustomed',
    type: 'DM Boon',
    modifiers: [{ target: 'ac.natural', op: 'add', value: 3, type: 'Untyped', when: { terrain: ['swamp'] } }],
    defenses: [{ kind: 'immunity', target: 'acid' }, { kind: 'dr', target: 'physical', value: 3, bypass: '-', when: { terrain: ['swamp'] } }]
  };
  const arcaneShield = {
    id: 'boon_arcane_shield',
    name: 'Arcane Shield',
    type: 'DM Boon',
    sourceCategory: 'Synergy',
    autoUnlock: true,
    isSynergy: true,
    requires: { all: ['boon_absorb_magic', 'boon_elemental_accustomed'] },
    modifiers: [{ target: 'entity.saveBonus', selector: { id: 'boon_absorb_magic' }, op: 'set', value: 4, type: 'Competence' }]
  };
  const forceOfPersonality = {
    id: 'feat_force_of_personality',
    name: 'Force of Personality',
    type: 'Feat',
    modifiers: [{ target: 'save.will.abilityMod', op: 'max', formula: '@chaMod' }]
  };
  const cannyDefense = {
    id: 'feat_canny_defense',
    name: 'Canny Defense (Duelist)',
    type: 'Class Feature',
    modifiers: [{ target: 'ac.abilityMod', op: 'add', formula: 'max(0, @intMod)', cap: '@classes.duelist.level', when: { armorCategory: ['None', 'Light'] } }]
  };

  const liveChar = {
    level: 8,
    bab: 6,
    baseAbilities: { str: 14, dex: 14, con: 16, int: 14, wis: 10, cha: 18 },
    abilities: { str: 14, dex: 14, con: 16, int: 14, wis: 10, cha: 18 },
    baseSaves: { fort: 6, ref: 2, will: 6 },
    classLevels: { sorcerer: 6, duelist: 2 },
    activeToggles: { vs_targeted_spell: true },
    activeTerrain: 'swamp',
    wornArmorCategory: 'Light',
    feats: [absorbMagic, elemAcc, forceOfPersonality],
    legoEntries: [cannyDefense]
  };
  RuleEngine.recalculateCharacter(liveChar, [arcaneShield]);
  const legoDirect = RuleEngine.evaluateLegoCharacter(liveChar, [arcaneShield]);

  assertEq('Phase P2 Parity Gate 1: recalculateCharacter attaches legoEvaluation, evaluatedDefenses, and auto-unlocks Arcane Shield',
    [Boolean(liveChar.legoEvaluation), liveChar.grantedCapabilities.unlockedEntities.includes('boon_arcane_shield'), liveChar.evaluatedDefenses.immunities.includes('acid')],
    [true, true, true]);
  assertEq('Phase P2 Parity Gate 2: recalculateCharacter AC & Saves match evaluateLegoCharacter (Stage-2 mutated +4 save, Force of Personality CHA to Will, Canny Defense INT to AC)',
    [liveChar.acBreakdown.total, liveChar.evaluatedSaves.fort, liveChar.evaluatedSaves.ref, liveChar.evaluatedSaves.will],
    [legoDirect.ac.normal, legoDirect.saves.fort, legoDirect.saves.ref, legoDirect.saves.will]);
}

// Phase P4 Standalone DM Boons Master DB Import Pack Validation Test
{
  const exportPackPath = path.join(rootDir, 'exports', 'dm_boons_master_db_import.json');
  const exportPack = JSON.parse(fs.readFileSync(exportPackPath, 'utf8'));
  const allValidV25 = Array.isArray(exportPack.entries)
    && !('masterDb' in exportPack)
    && exportPack.entries.length === 107
    && exportPack.entries.every(e => e.schemaVersion === 2 && e.id && e.pack === 'pack_dm_draconic_boons' && Array.isArray(e.modifiers) && Array.isArray(e.defenses) && Array.isArray(e.resources) && Array.isArray(e.modes));
  assertEq('Phase P4 Export Pack Validation (M9): exports/dm_boons_master_db_import.json contains 107 valid V2.5 entries (24 Draconic Path + 83 Lesser Boons, single entries array)',
    [allValidV25, exportPack.pack.draconicPathCount, exportPack.pack.lesserBoonsCount],
    [true, 24, 83]);
}

// PDCA Act Parity Fixtures (BL1, BL2, BL3, BL5)
{
  // Fixture 1 (BL1): Armor + Size + Charge penalty + Perform-AC (max) via recalculateCharacter
  const performDanceAC = {
    id: 'feat_perform_dance_ac',
    name: 'Dervishes Dance AC',
    type: 'Class Feature',
    modifiers: [{ target: 'ac.total', op: 'max', value: 22, affects: ['normal', 'touch'] }]
  };
  const chBL1 = {
    level: 6,
    bab: 6,
    size: 'Large', // -1 AC
    acBreakdown: { size: -1 },
    baseAbilities: { str: 14, dex: 14, con: 14, int: 10, wis: 10, cha: 16 },
    abilities: { str: 14, dex: 14, con: 14, int: 10, wis: 10, cha: 16 },
    baseSaves: { fort: 5, ref: 5, will: 2 },
    bodySlots: {
      body: { id: 'item_chain_shirt', name: 'Chain Shirt', type: 'Armor', acBonus: 4, maxDex: 4, equipped: true }
    },
    buffs: [
      { id: 'buff_charge', name: 'Charging', active: true, modifiers: [{ target: 'ac', value: -2, type: 'Penalty' }] }
    ],
    legoEntries: [performDanceAC]
  };
  RuleEngine.recalculateCharacter(chBL1);
  // Pre-penalty normal AC = 10 + 4(armor) + 2(dex) - 1(Large) = 15 -> max(15, 22) = 22 -> minus 2 penalty = 20
  // Pre-penalty touch AC = 10 + 2(dex) - 1(Large) = 11 -> max(11, 22) = 22 -> minus 2 penalty = 20
  // Flat-footed AC is NOT in affects ['normal', 'touch']: 10 + 4(armor) - 1(Large) - 2(penalty) = 11
  assertEq('Parity Fixture 1 (BL1): Armor + Size + Charge penalty + Perform-AC (max) preserves penalties after replacement and respects affects[]',
    [chBL1.acBreakdown.total, chBL1.acBreakdown.touch, chBL1.acBreakdown.flatFooted],
    [20, 20, 11]);

  // Fixture 2 (BL2): Cloak of Charisma +4 + Force of Personality (CHA to Will) via recalculateCharacter
  const chBL2 = {
    level: 5,
    bab: 3,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 14 }, // base CHA 14 (+2), with Cloak +4 -> 18 (+4)
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 14 },
    baseSaves: { fort: 1, ref: 1, will: 4 },
    bodySlots: {
      shoulders: {
        id: 'item_cloak_cha_4',
        name: 'Cloak of Charisma +4',
        equipped: true,
        modifiers: [{ target: 'ability.cha', value: 4, type: 'Enhancement' }]
      }
    },
    feats: [
      {
        id: 'feat_force_of_personality',
        name: 'Force of Personality',
        type: 'Feat',
        modifiers: [{ target: 'save.will.abilityMod', op: 'max', formula: '@chaMod' }]
      }
    ]
  };
  RuleEngine.recalculateCharacter(chBL2);
  // Base Will 4 + post-item CHA mod (+4) = 8 (NOT 6 from pre-item CHA 14!)
  assertEq('Parity Fixture 2 (BL2): Item ability enhancement (+4 CHA) is reflected in Force of Personality Will save substitution (Will = 8)',
    [chBL2.abilities.cha, chBL2.evaluatedSaves.will],
    [18, 8]);

  // Fixture 3 (BL3): Legacy buff without active property stays inactive in recalculateCharacter
  const chBL3 = {
    level: 5,
    bab: 5,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    baseSaves: { fort: 2, ref: 2, will: 2 },
    buffs: [
      { id: 'buff_legacy_inactive', name: 'Inactive Haste', modifiers: [{ target: 'ac.dodge', value: 1, type: 'Dodge' }] }
    ]
  };
  RuleEngine.recalculateCharacter(chBL3);
  assertEq('Parity Fixture 3 (BL3): Legacy buff without active property remains inactive (AC = 10)',
    chBL3.acBreakdown.total, 10);

  // Fixture 4 (BL5): Equipped Untyped gearPool item is counted once (never doubled) in recalculateCharacter
  const chBL5 = {
    level: 5,
    bab: 5,
    baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    baseSaves: { fort: 2, ref: 2, will: 2 },
    gearPool: [
      {
        id: 'item_dusty_rose_ioun',
        name: 'Dusty Rose Prism Ioun Stone',
        equipped: true,
        modifiers: [{ target: 'ac', value: 1, type: 'Untyped' }]
      }
    ]
  };
  RuleEngine.recalculateCharacter(chBL5);
  assertEq('Parity Fixture 4 (BL5): Equipped Untyped gearPool item is applied once in recalculateCharacter (AC = 11, not 12)',
    chBL5.acBreakdown.total, 11);

  // Fixture 5 (BL6): RuleEngine.evaluatePredicate({ all: ["boon_absorb_magic", "boon_elemental_accustomed"] }, char) auto-derives ownedIds and normalizes namespace prefixes
  const chBL6Partial = {
    specialAbilities: [{ id: 'pack_dm_draconic_boons:boon_absorb_magic', name: 'Absorb Magic' }]
  };
  const chBL6Full = {
    specialAbilities: [
      { id: 'pack_dm_draconic_boons:boon_absorb_magic', name: 'Absorb Magic' },
      { id: 'pack_dm_draconic_boons:boon_elemental_accustomed', name: 'Elemental Accustomed' }
    ]
  };
  const reqPred = { all: ['boon_absorb_magic', 'boon_elemental_accustomed'] };
  assertEq('Regression Test 45 (BL6): evaluatePredicate auto-derives normalized ownedIds from character (false with 1/2 owned, true with 2/2 owned)',
    [RuleEngine.evaluatePredicate(reqPred, chBL6Partial), RuleEngine.evaluatePredicate(reqPred, chBL6Full)],
    [false, true]);

  // Fixture 6 (BL10): Regular feat in masterDb with requires and NO autoUnlock:true is NOT auto-granted for free, whereas synergy with autoUnlock:true IS auto-unlocked
  const mockMasterDb = [
    {
      id: 'feat_cleave',
      name: 'Cleave (Test Regular Feat)',
      type: 'Feat',
      requires: { all: ['feat_power_attack'] },
      modifiers: [{ target: 'ac.natural', value: 5, type: 'Natural Armor' }]
    },
    {
      id: 'syn_power_surge',
      name: 'Power Surge (Synergy)',
      type: 'DM Boon',
      sourceCategory: 'Synergy',
      autoUnlock: true,
      isSynergy: true,
      requires: { all: ['feat_power_attack'] },
      modifiers: [{ target: 'ac.deflection', value: 2, type: 'Deflection' }]
    }
  ];
  const chBL10 = {
    level: 5,
    bab: 5,
    baseAbilities: { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilities: { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    baseSaves: { fort: 4, ref: 1, will: 1 },
    feats: [{ id: 'feat_power_attack', name: 'Power Attack', type: 'Feat' }]
  };
  RuleEngine.recalculateCharacter(chBL10, mockMasterDb);
  // Only syn_power_surge (+2 deflection -> AC 12) should auto-unlock; feat_cleave (+5 natural) must NOT auto-unlock!
  assertEq('Regression Test 46 (BL10): recalculateCharacter only auto-unlocks entries with explicit autoUnlock/isSynergy (AC = 12, not 17)',
    [chBL10.acBreakdown.total, chBL10.grantedCapabilities.unlockedEntities.includes('syn_power_surge'), chBL10.grantedCapabilities.unlockedEntities.includes('feat_cleave')],
    [12, true, false]);

  // Phase P9 Universal Spotlight Search Fuzzy Tests (Tests 47, 48, 49)
  const SrdCompendium = sandbox.window.SrdCompendium;
  sandbox.window.masterDb = [
    { id: 'feat-cleave', name: 'Cleave', type: 'Feat', category: 'General' },
    { id: 'feat-great-cleave', name: 'Great Cleave', type: 'Feat', category: 'General' },
    { id: 'feat-power-attack', name: 'Power Attack', type: 'Feat', category: 'General' }
  ];
  const claveSearchHits = SrdCompendium.search('clave', { type: 'Feat' });
  assertEq('Phase P9 Test 47: SrdCompendium.fuzzyScore("clave", "Cleave") > 0 and search("clave", { type: "Feat" }) returns Cleave',
    [SrdCompendium.fuzzyScore('clave', 'Cleave') > 0, claveSearchHits.some(h => h.name === 'Cleave')],
    [true, true]);

  assertEq('Phase P9 Test 48: Typo-tolerant fuzzyScore matches "scimtr" -> "Scimitar" and "powr atack" -> "Power Attack"',
    [SrdCompendium.fuzzyScore('scimtr', 'Scimitar') > 0, SrdCompendium.fuzzyScore('powr atack', 'Power Attack') > 0],
    [true, true]);

  assertEq('Phase P9 Test 49: Exact match "cleave" ranks strictly higher than typo match "clave" for "Cleave"',
    SrdCompendium.fuzzyScore('cleave', 'Cleave') > SrdCompendium.fuzzyScore('clave', 'Cleave'),
    true);

  assertEq('Phase P9 Test 50: Name typo ("clave" -> "Cleave") outranks haystack substring ("enclave"), 3-char "ice" does not false-match "Dice", and Turkish "SCİMİTAR" normalizes to exact match 1000',
    [
      SrdCompendium.fuzzyScore('clave', 'Cleave', 'Feat') > SrdCompendium.fuzzyScore('clave', 'Ward Specialist', 'Protects the enclave'),
      SrdCompendium.fuzzyScore('ice', 'Dice') === 0,
      SrdCompendium.fuzzyScore('SCİMİTAR', 'Scimitar') === 1000
    ],
    [true, true, true]);
}

console.log(`✅ V2.5 LEGO ENGINE BENCHMARK: ${passed}/${passed + failed} assertions passed (15 Golden Set + 6 Forum Edge Cases + Interaction Map + Namespace/Deduplication + Damage/Migrator + P2 Parity Gate + 6 Parity/Regression Fixtures + P4 Export Pack + P9 Fuzzy Search + Security Gate).`);
if (failed > 0) process.exit(1);
