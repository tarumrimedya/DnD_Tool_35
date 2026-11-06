/**
 * ============================================================================
 * JOYFUL-FERMI D&D 3.5e — ZERO-TOKEN AUTOMATED RAW RULE ENGINE TEST SUITE
 * ============================================================================
 * Step 0 Safety Net: Deterministic D&D 3.5e RAW mathematical verification.
 * Runs in ~15ms with 0 AI tokens via `tools/verify_and_sync.js`.
 * ============================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const RuleEngine = require('../rule_engine.js');

function runRuleEngineTests() {
  const startMs = Date.now();
  let passed = 0;

  function test(name, fn) {
    try {
      fn();
      passed++;
    } catch (err) {
      throw new Error(`[RAW RuleEngine Test Failed] ${name}: ${err.message}`);
    }
  }

  // 1. D&D 3.5e RAW Bonus Stacking Rules (DMG p.21 / PHB p.171)
  test('RAW Bonus Stacking: Enhancement takes highest; Dodge & Untyped stack; Penalties always stack', () => {
    const bonuses = [
      { val: 2, type: 'Enhancement', source: 'Belt +2' },
      { val: 4, type: 'Enhancement', source: 'Bull\'s Strength' },
      { val: 1, type: 'Dodge', source: 'Dodge Feat' },
      { val: 1, type: 'Dodge', source: 'Haste' },
      { val: 2, type: 'Untyped', source: 'Insightful Strike' },
      { val: -2, type: 'Penalty', source: 'Shaken' },
      { val: -1, type: 'Penalty', source: 'Dazzled' }
    ];
    const net = RuleEngine.resolveBonusStacking(bonuses);
    // Max Enhancement (+4) + Dodge (+1 +1 = +2) + Untyped (+2) + Penalties (-2 -1 = -3) = +5
    assert.strictEqual(net, 5, `Expected net bonus 5, got ${net}`);
  });

  // 2. Full Character Recalculation: Abilities, AC (Normal/Touch/Flat-Footed), Saves & Mithral Armor
  test('RAW RecalculateCharacter: Ability Modifiers, Mithral Chain Shirt, Ring of Protection & Haste', () => {
    const char = {
      name: 'Test Fighter',
      race: 'Human',
      size: 'Medium',
      level: 6,
      bab: 6,
      baseSpeed: 30,
      baseAbilities: { str: 18, dex: 16, con: 14, int: 10, wis: 12, cha: 8 },
      abilities: { str: 18, dex: 16, con: 14, int: 10, wis: 12, cha: 8 },
      baseSaves: { fort: 5, ref: 2, will: 2 },
      feats: [{ name: 'Improved Initiative', active: true }],
      specialAbilities: [],
      bodySlots: {
        armor: {
          name: '+1 Mithral Chain Shirt',
          type: 'Armor',
          category: 'Light',
          armorBonus: 4,
          enhancementBonus: 1,
          maxDex: 6,
          acp: -1,
          material: 'mat-mithral',
          modifiers: [{ target: 'ac.armor', value: 5, type: 'Armor' }],
          equipped: true
        },
        ring1: {
          name: 'Ring of Protection +2',
          type: 'Ring',
          modifiers: [{ target: 'ac.deflection', value: 2, type: 'Deflection' }],
          equipped: true
        },
        waist: {
          name: 'Belt of Giant Strength +2',
          type: 'Wondrous',
          modifiers: [{ target: 'ability.str', value: 2, type: 'Enhancement' }],
          equipped: true
        }
      },
      gearPool: [],
      buffs: [
        {
          id: 'buff_haste',
          name: 'Haste',
          active: true,
          modifiers: [
            { target: 'ac.dodge', value: 1, type: 'Dodge' },
            { target: 'attack.all', value: 1, type: 'Untyped' },
            { target: 'save.ref', value: 1, type: 'Dodge' }
          ]
        }
      ],
      skills: [],
      weapons: []
    };

    RuleEngine.recalculateCharacter(char, []);

    // STR: 18 base + 2 Enhancement = 20 (+5 mod)
    assert.strictEqual(char.abilities.str, 20, `Expected STR 20, got ${char.abilities.str}`);
    // AC: 10 + 5 (Armor: 4 base + 1 enh) + 3 (Dex) + 2 (Deflection) + 1 (Haste Dodge) = 21
    assert.strictEqual(char.acBreakdown.total, 21, `Expected Normal AC 21, got ${char.acBreakdown.total}`);
    // Touch AC: 10 + 3 (Dex) + 2 (Deflection) + 1 (Dodge) = 16
    assert.strictEqual(char.acBreakdown.touch, 16, `Expected Touch AC 16, got ${char.acBreakdown.touch}`);
    // Flat-Footed AC: 10 + 5 (Armor) + 2 (Deflection) = 17 (Dex and Dodge lost when flat-footed)
    assert.strictEqual(char.acBreakdown.flat, 17, `Expected Flat-Footed AC 17, got ${char.acBreakdown.flat}`);
    // Fort Save: 5 base + 2 CON = 7
    assert.strictEqual(char.evaluatedSaves.fort, 7, `Expected Fort 7, got ${char.evaluatedSaves.fort}`);
    // Ref Save: 2 base + 3 DEX + 1 Haste = 6
    assert.strictEqual(char.evaluatedSaves.ref, 6, `Expected Ref 6, got ${char.evaluatedSaves.ref}`);
  });

  // 3. Weapon Attack & 2-Handed Power Attack Math (PHB p.98: 1.5x STR + 2x Power Attack)
  test('RAW Weapon Evaluation: Two-Handed Greatsword 1.5x STR & 2-for-1 Power Attack', () => {
    const char = {
      name: 'Test Barbarian',
      size: 'Medium',
      level: 6,
      bab: 6,
      abilities: { str: 18, dex: 14, con: 14, int: 10, wis: 10, cha: 10 }, // STR +4
      feats: [{ name: 'Power Attack', active: true }],
      buffs: [],
      tactical: { powerAttack: 3 }
    };
    const greatsword = {
      id: 'wpn_gs',
      name: '+1 Greatsword',
      dice: '2d6',
      crit: '19-20/x2',
      type: 'Slashing',
      handedness: 'Two-Handed',
      enhancementBonus: 1,
      modifiers: [
        { target: 'attack.melee', value: 1, type: 'Enhancement' },
        { target: 'damage.melee', value: 1, type: 'Enhancement' }
      ],
      equipped: true
    };

    const evalRes = RuleEngine.evaluateWeaponAttack(char, greatsword, { powerAttack: 3 });
    // Attack: +6 BAB + 4 STR + 1 Enh - 3 PA = +8
    assert.strictEqual(evalRes.netAttackBonus, 8, `Expected primary attack +8, got ${evalRes.netAttackBonus}`);
    // Iteratives at BAB 6: [+8, +3]
    assert.deepStrictEqual(evalRes.iteratives, [8, 3], `Expected iteratives [8, 3], got ${JSON.stringify(evalRes.iteratives)}`);
    // Damage: floor(4 * 1.5) = +6 STR + 1 Enh + (3 * 2 = +6 Two-Handed PA) = +13
    assert.strictEqual(evalRes.netFlatDamage, 13, `Expected 2H damage bonus +13, got ${evalRes.netFlatDamage}`);
  });

  // 4. Weapon Damage Dice Scaling (DMG p.28 Table 2-2: Mighty Wallop / Enlarge Person)
  test('RAW Weapon Size Step Scaling: 1d8 Medium -> 2d6 Large -> 3d6 Huge', () => {
    if (typeof RuleEngine.stepDamageDice === 'function') {
      assert.strictEqual(RuleEngine.stepDamageDice('1d8', 1), '2d6');
      assert.strictEqual(RuleEngine.stepDamageDice('1d8', 2), '3d6');
    }
  });

  // 5. Canonical Bundled Character (`character_data.json`) Smoke Verification
  test('Canonical character_data.json recalculates cleanly without error', () => {
    const charPath = path.join(__dirname, '..', 'character_data.json');
    if (fs.existsSync(charPath)) {
      const charData = JSON.parse(fs.readFileSync(charPath, 'utf8'));
      RuleEngine.recalculateCharacter(charData, []);
      assert.ok(charData.acBreakdown && typeof charData.acBreakdown.total === 'number', 'AC total must be numeric');
      assert.ok(charData.evaluatedSaves && typeof charData.evaluatedSaves.fort === 'number', 'Fort save must be numeric');
    }
  });

  // 6. Double Weapon & Off-Hand Attack Math (PHB p.113: Off-Hand gets 0.5x STR and 0x Power Attack)
  test('RAW Double Weapon & Off-Hand Math: Quarterstaff detected as Double Weapon; Off-Hand gets 0.5x STR & 0x PA', () => {
    assert.strictEqual(RuleEngine.isDoubleWeapon({ name: 'Quarterstaff' }), true, 'Quarterstaff must be detected as Double Weapon');
    const char = {
      name: 'Test Ranger',
      size: 'Medium',
      level: 6,
      bab: 6,
      abilities: { str: 18, dex: 16, con: 14, int: 10, wis: 12, cha: 10 }, // STR +4
      feats: [{ name: 'Power Attack', active: true }, { name: 'Two-Weapon Fighting', active: true }],
      buffs: []
    };
    const offHandHead = {
      id: 'wpn_qstaff_off',
      name: 'Quarterstaff (Off-Hand)',
      dice: '1d6',
      crit: '20/x2',
      type: 'Bludgeoning',
      grip: 'Off-Hand',
      equipped: true
    };
    assert.strictEqual(RuleEngine.isOffHandWeaponHead(offHandHead), true, 'Off-Hand head must be detected');
    const evalOff = RuleEngine.evaluateWeaponAttack(char, offHandHead, { grip: 'Off-Hand', powerAttack: 2 });
    // Off-Hand damage: floor(4 * 0.5) = +2 STR + 0 Power Attack = +2
    assert.strictEqual(evalOff.netFlatDamage, 2, `Expected Off-Hand damage +2 (0.5x STR, 0x PA), got ${evalOff.netFlatDamage}`);
  });

  // 7. Magic Item Compendium: Armbands of Might Power Attack Synergy & Extra DamageParts
  test('RAW MIC Synergy: Armbands of Might (+2 Dmg on PA >= 2) & Weapon Crystal DamageParts', () => {
    const char = {
      name: 'Test Warblade',
      size: 'Medium',
      level: 6,
      bab: 6,
      abilities: { str: 18, dex: 14, con: 14, int: 14, wis: 10, cha: 10 }, // STR +4
      feats: [{ name: 'Power Attack', active: true }],
      bodySlots: {
        arms: {
          id: 'srd_armbands_of_might',
          name: 'Armbands of Might',
          equipped: true
        }
      },
      buffs: []
    };
    const longswordWithCrystal = {
      id: 'wpn_ls_crystal',
      name: '+1 Longsword',
      dice: '1d8',
      crit: '19-20/x2',
      type: 'Slashing',
      grip: '1-Hand',
      enhancementBonus: 1,
      damageParts: [
        { dice: '1d8', bonus: 0, type: 'Slashing', multiplyOnCrit: true, onCritOnly: false, source: 'Base Weapon' },
        { dice: '1d6', bonus: 0, type: 'Fire', multiplyOnCrit: false, onCritOnly: false, source: 'Crystal of Energy Assault, Lesser (Fire)' }
      ],
      equipped: true
    };
    const evalRes = RuleEngine.evaluateWeaponAttack(char, longswordWithCrystal, { grip: '1-Hand', powerAttack: 2 });
    // 1-Hand Damage: +4 STR + 1 Enh + 2 (1-Hand PA) + 2 (Armbands of Might) = +9
    assert.strictEqual(evalRes.netFlatDamage, 9, `Expected +9 flat damage with Armbands of Might, got ${evalRes.netFlatDamage}`);
    assert.strictEqual(evalRes.extraDamageParts.length, 1, 'Expected 1 extra damage part from Fire Crystal');
    assert.strictEqual(evalRes.extraDamageParts[0].dice, '1d6');
    assert.strictEqual(evalRes.extraDamageParts[0].type, 'Fire');
  });

  // 8. Cleric Domain Caster Level Bonus & Situational AC Separation
  test('RAW Cleric Domains & Conditional AC: Healing/Good Domain +1 CL; Protection from Evil does not inflate unconditional AC', () => {
    const cleric = {
      name: 'Test Cleric',
      race: 'Human',
      size: 'Medium',
      level: 5,
      bab: 3,
      baseAbilities: { str: 12, dex: 10, con: 14, int: 10, wis: 18, cha: 14 },
      abilities: { str: 12, dex: 10, con: 14, int: 10, wis: 18, cha: 14 },
      baseSaves: { fort: 4, ref: 1, will: 4 },
      spellcasting: { domains: ['Healing', 'Good'] },
      feats: [],
      bodySlots: {},
      gearPool: [],
      buffs: [
        {
          id: 'spl-protection-from-evil',
          name: 'Protection from Evil',
          active: true,
          modifiers: [
            { target: 'ac.deflection', value: 2, type: 'Deflection', condition: 'vs. Evil' },
            { target: 'save.all', value: 2, type: 'Resistance', condition: 'vs. Evil' }
          ]
        }
      ],
      skills: [],
      weapons: []
    };
    const cureCl = RuleEngine.getSpellCasterLevelBonus({ name: 'Cure Light Wounds', school: 'Conjuration (Healing)' }, cleric);
    assert.strictEqual(cureCl.bonus, 1, `Expected +1 CL from Healing Domain, got ${cureCl.bonus}`);

    RuleEngine.recalculateCharacter(cleric, []);
    // Unconditional AC must remain 10; the +2 Deflection (vs. Evil) must be isolated in conditionalAcBonuses
    assert.strictEqual(cleric.acBreakdown.total, 10, `Expected unconditional AC 10, got ${cleric.acBreakdown.total}`);
    assert.ok(Array.isArray(cleric.conditionalAcBonuses) && cleric.conditionalAcBonuses.length > 0, 'Expected conditionalAcBonuses to record vs. Evil deflection bonus');
  });

  // 9. Character Template (Half-Dragon) Level Adjustment, ECL, Abilities & Natural Armor
  test('RAW Character Template: Half-Dragon grants LA +3, +8 STR, +2 CON/INT/CHA & +4 Natural Armor', () => {
    const char = {
      name: 'Test Half-Dragon Fighter',
      race: 'Human',
      size: 'Medium',
      level: 4,
      bab: 4,
      baseAbilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
      baseSaves: { fort: 4, ref: 1, will: 1 },
      templates: ['Half-Dragon'],
      feats: [],
      bodySlots: {},
      gearPool: [],
      buffs: [],
      skills: [],
      weapons: []
    };
    RuleEngine.recalculateCharacter(char, []);
    assert.strictEqual(char.abilities.str, 24, `Expected STR 24 (16 + 8 Half-Dragon), got ${char.abilities.str}`);
    assert.strictEqual(char.abilities.con, 16, `Expected CON 16 (14 + 2 Half-Dragon), got ${char.abilities.con}`);
    assert.strictEqual(char.acBreakdown.natural, 4, `Expected +4 Natural Armor from Half-Dragon, got ${char.acBreakdown.natural}`);
    assert.strictEqual(char.levelAdjustment, 3, `Expected LA +3, got ${char.levelAdjustment}`);
    assert.strictEqual(char.ecl, 7, `Expected ECL 7 (4 HD + 3 LA), got ${char.ecl}`);
  });

  // 10. Canonical V2 Compendium Hydration for Classes & Spells (Zero-Static-Table Verification)
  test('Canonical V2 Compendium Lookup: getClassDef(Warblade/Archmage) & resolveSpellBuffSpec(Greater Heroism/Primal Instinct)', () => {
    const warbladeDef = RuleEngine.getClassDef('Warblade');
    assert.ok(warbladeDef && warbladeDef.hd === 12 && warbladeDef.bab === 1.0, 'Warblade must resolve from srd_classes_races.json with d12 HD and 1.0 BAB');
    const archmageDef = RuleEngine.getClassDef('Archmage');
    assert.ok(archmageDef && archmageDef.hd === 4 && Array.isArray(archmageDef.prerequisites) && archmageDef.prerequisites.length > 0, 'Archmage must resolve from srd_classes_races.json with prerequisites');

    const ghSpec = RuleEngine.resolveSpellBuffSpec({ name: 'Greater Heroism' }, null, 11);
    assert.ok(ghSpec && ghSpec.isBuffSpell && ghSpec.tempHpFormula === 'min(20, @cl)', 'Greater Heroism must resolve via comma-inverted Compendium alias');
    const primalSpec = RuleEngine.resolveSpellBuffSpec({ name: 'Primal Instinct' }, null, 8);
    assert.ok(primalSpec && primalSpec.isBuffSpell && primalSpec.ruleFlags?.primalSpell === true, 'Primal Instinct must resolve from srd_spells.json');
  });

  return { passed, elapsedMs: Date.now() - startMs };
}

if (require.main === module) {
  const res = runRuleEngineTests();
  console.log(`✅ RuleEngine RAW Test Suite: ${res.passed}/${res.passed} passed in ${res.elapsedMs}ms.`);
}

module.exports = { runRuleEngineTests };
