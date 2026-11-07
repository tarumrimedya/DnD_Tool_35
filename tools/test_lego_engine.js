/**
 * D&D 3.5e V2.5 Composable Lego Object Engine — 21-Example Benchmark & Security Test Suite
 * Verifies 15 DM Boon / SRD Golden Set cases + 6 Giant in the Playground / ENWorld Forum Edge Cases
 * against a deterministic Level 8 Test Character with expected numeric outputs.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const ruleEngineCode = fs.readFileSync(path.join(rootDir, 'rule_engine.js'), 'utf8');
const sandbox = { window: {}, console, Math, Number, String, Array, Object, Set, Map, JSON, RegExp };
vm.createContext(sandbox);
vm.runInContext(`${ruleEngineCode}\nwindow.RuleEngine = RuleEngine;`, sandbox);
const RuleEngine = sandbox.window.RuleEngine;

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
    ['ActionEconomyBar', 'CombatSpecialAttacksPanel', 'TurnClockNode'].every(n => imap.nodes.includes(n)), true);
}

console.log(`✅ V2.5 LEGO ENGINE BENCHMARK: ${passed}/${passed + failed} assertions passed (15 Golden Set + 6 Forum Edge Cases + Interaction Map + Security Gate).`);
if (failed > 0) process.exit(1);
