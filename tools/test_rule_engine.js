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

  // 5. Canonical Pure V3 Character Shell Smoke Verification
  test('Canonical V3 character shell recalculates cleanly without error', () => {
    const charData = {
      schemaVersion: 3,
      name: 'Test V3 Paladin',
      level: 5,
      bab: 5,
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 16 },
      baseSaves: { fort: 4, ref: 1, will: 1 },
      feats: [{ id: 'feat-power-attack', name: 'Power Attack', type: 'Feat', active: true }],
      buffs: [],
      bodySlots: {},
      customEntries: {},
      customDb: []
    };
    RuleEngine.recalculateCharacter(charData, []);
    assert.ok(charData.acBreakdown && typeof charData.acBreakdown.total === 'number', 'AC total must be numeric');
    assert.ok(charData.evaluatedSaves && typeof charData.evaluatedSaves.fort === 'number', 'Fort save must be numeric');
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
    // Primal Instinct (Dragon Magic) lives in the lazy srd_spells_splat.json: it resolves once the chunk is loaded
    // (Spotlight / fetchEntry in the browser; a character that uses it carries an srd-snapshot).
    const comp = globalThis.SrdCompendium;
    const primalRow = comp && comp.findIndexEntry('Primal Instinct', 'Spell');
    assert.ok(primalRow && primalRow.f === 'srd_spells_splat.json', 'Primal Instinct must be indexed in srd_spells_splat.json');
    comp.ensureChunkLoaded('srd_spells_splat.json'); // Node: synchronous
    const primalSpec = RuleEngine.resolveSpellBuffSpec({ name: 'Primal Instinct' }, null, 8);
    assert.ok(primalSpec && primalSpec.isBuffSpell && primalSpec.ruleFlags?.primalSpell === true, 'Primal Instinct must resolve from srd_spells_splat.json');
  });

  // 11. Shield bash weapon (PHB p.125 / Table 7-5): one canonical builder for the attack chain and the combat card.
  test('Shield Bash: buildShieldBashWeapon dice by size/spikes, item.bash linked vs independent enhancement, tower shield cannot bash', () => {
    const char = {
      name: 'Bash Tester', size: 'Medium', level: 4, bab: 4, classes: 'Fighter 4',
      abilities: { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, // STR +3
      feats: [], buffs: [], weapons: [], bodySlots: {}
    };
    const plus5 = { schemaVersion: 3, id: 'custom-hss-5', name: '+5 Heavy Steel Shield', type: 'Shield', category: 'Shield', enhancementBonus: 5, armor: { armorType: 'Shield', armorBonus: 2 }, effects: [] };
    const linked = RuleEngine.buildShieldBashWeapon(plus5, char);
    assert.ok(linked && linked.dice === '1d4' && linked.critMin === 20 && linked.critMult === 2 && linked.dmgType === 'Bludgeoning', `heavy bash 1d4 20/x2 Bludgeoning, got ${JSON.stringify(linked)}`);
    assert.strictEqual(linked.bashMode, 'linked');
    assert.strictEqual(linked.enhancementBonus, 5, 'linked (default) bash uses the shield enhancement');
    assert.ok(!linked.modifiers.length && !linked.effects.length && !linked.armor, 'shield AC modifiers / effects / chassis must not leak into the bash weapon');
    const linkedEval = RuleEngine.evaluateWeaponAttack(char, linked, { grip: 'Off-Hand' });
    // Damage: 1d4 + 1 (1/2 STR off-hand) + 5 enhancement
    assert.strictEqual(linkedEval.netFlatDamage, 6, `linked bash flat damage 6, got ${linkedEval.netFlatDamage}`);

    const independent = RuleEngine.buildShieldBashWeapon(Object.assign({}, plus5, { bash: { mode: 'independent', enhancementBonus: 1 } }), char);
    assert.strictEqual(independent.enhancementBonus, 1, 'independent bash uses item.bash.enhancementBonus');
    const indepEval = RuleEngine.evaluateWeaponAttack(char, independent, { grip: 'Off-Hand' });
    assert.strictEqual(linkedEval.netAttackBonus - indepEval.netAttackBonus, 4, 'linked +5 vs independent +1 attack differ by 4');

    const light = RuleEngine.buildShieldBashWeapon({ name: 'Light Steel Shield', type: 'Shield', category: 'Shield' }, char);
    assert.ok(light.dice === '1d3' && light.isLight === true, `light shield bash 1d3 light weapon, got ${light.dice}/${light.isLight}`);
    const smallLight = RuleEngine.buildShieldBashWeapon({ name: 'Light Steel Shield', type: 'Shield', category: 'Shield' }, Object.assign({}, char, { size: 'Small' }));
    assert.strictEqual(smallLight.dice, '1d2', 'Small light shield bash 1d2');
    const spiked = RuleEngine.buildShieldBashWeapon({ name: 'Spiked Heavy Steel Shield', type: 'Shield', category: 'Shield' }, char);
    assert.ok(spiked.dice === '1d6' && spiked.dmgType === 'Piercing', `spiked heavy shield 1d6 piercing, got ${spiked.dice}/${spiked.dmgType}`);
    assert.strictEqual(RuleEngine.buildShieldBashWeapon({ name: 'Tower Shield', type: 'Shield', category: 'Shield' }, char), null, 'tower shield cannot bash');
    assert.strictEqual(RuleEngine.buildShieldBashWeapon(Object.assign({}, plus5, { canShieldBash: false }), char), null, 'canShieldBash false');
  });

  // 12. Formula registry: FORMULA_VARS / FORMULA_FUNCS are the evaluator's single source of truth.
  test('Formula Registry: every scalar token and alias resolves, @halfLevel, @augment_pp / @uses_today aliases, functions table drives the evaluator', () => {
    const vars = RuleEngine.FORMULA_VARS;
    const funcs = RuleEngine.FORMULA_FUNCS;
    assert.ok(Array.isArray(vars) && vars.length > 0 && Array.isArray(funcs) && funcs.length > 0, 'registry exported');
    const tokens = vars.map(v => v.token);
    assert.strictEqual(new Set(tokens).size, tokens.length, 'tokens are unique');
    vars.forEach(v => assert.ok(v.token && v.label && v.group && v.desc && v.example, `registry row complete: ${v.token}`));
    const ctx = {
      level: 9, cl: 7, ml: 6, il: 5, ebl: 4, ecl: 10, classLevel: 3, hd: 9, bab: 6, enhancement: 2, critMult: 3,
      essentia: 2, soulmeldsCount: 1, baseSlots: 4, augmentPP: 4, castsToday: 2, targetCR: 8,
      strMod: 1, dexMod: 2, conMod: 3, intMod: 4, wisMod: 5, chaMod: 6
    };
    const scalars = RuleEngine._resolveFormulaScalars(ctx);
    vars.filter(v => !v.pattern).forEach(v => {
      [v.token].concat(v.aliases || []).forEach(t => {
        const got = RuleEngine.evaluateFormula(t, ctx);
        assert.strictEqual(got, scalars[v.key], `${t} -> ${scalars[v.key]}, got ${got}`);
      });
    });
    assert.strictEqual(RuleEngine.evaluateFormula('10 + @halfLevel + @conMod', ctx), 17);
    assert.strictEqual(RuleEngine.evaluateFormula('@augment_pp', ctx), 4);
    assert.strictEqual(RuleEngine.evaluateFormula('@uses_today', ctx), 2);
    assert.strictEqual(RuleEngine.evaluateFormula('@paladinLevel', { level: 9, paladinLevel: 5 }), 5);
    assert.strictEqual(RuleEngine.evaluateFormula('@classes.warblade.level', { level: 9, classLevels: { warblade: 4 } }), 4);
    assert.strictEqual(RuleEngine.evaluateFormula('min(10, @cl)d6', ctx), '7d6');
    funcs.forEach(f => assert.ok(f.name && f.signature && f.desc && typeof f.impl === 'function', `function row complete: ${f.name}`));
    assert.strictEqual(RuleEngine.evaluateFormula('clamp(@level, 1, 5) + abs(-2) + ceil(1.2) + round(1.6) + floor(@level / 2) + max(1, @chaMod) + min(3, @strMod)', ctx), 5 + 2 + 2 + 2 + 4 + 6 + 1);
  });

  // Inventory row summary: derived from V3 effects[] / powers[] (never from description prose)
  test('summarizeItemMechanics: Potion of Heal / Heroism, Necklace of Fireballs powers[] via baseItemId, charges', () => {
    const heal = RuleEngine.summarizeItemMechanics({ name: 'Potion of Heal', effects: [{ type: 'roll', kind: 'Healing', count: 110, die: 'flat', flat: 0, scaling: 'flat' }] });
    assert.deepStrictEqual(heal, ['Heals 110 HP']);
    const heroism = RuleEngine.summarizeItemMechanics({ name: 'Potion of Heroism', effects: [{ type: 'stat', targets: ['atk.all', 'save.all', 'skill.all'], mode: 'flat', value: 2, btype: 'Morale' }] });
    assert.deepStrictEqual(heroism, ['+2 Morale Attack, Saves, Skill Checks']);
    // Carried row has no blocks (and a long description): the compendium entry's powers[] supply the summary.
    const necklace = RuleEngine.summarizeItemMechanics({ name: 'Necklace of Fireballs', baseItemId: 'mi-necklace-of-fireballs', effects: [], desc: 'x'.repeat(2000) });
    assert.strictEqual(necklace.length, 1, JSON.stringify(necklace));
    assert.ok(/Fire/.test(necklace[0]) && /Ref DC 14 half/.test(necklace[0]) && /2d6/.test(necklace[0]), necklace[0]);
    const ring = RuleEngine.summarizeItemMechanics({ name: 'Ring', dailyCharges: { max: 3, current: 2 }, effects: [{ type: 'defense', mode: 'Energy Resistance', what: 'Fire', value: 10 }] });
    assert.deepStrictEqual(ring, ['Fire Resistance 10', '2/3 charges']);
    assert.deepStrictEqual(RuleEngine.summarizeItemMechanics({ name: 'Rope', desc: 'Deals 9d6 fire damage (prose must not be scraped).' }), []);
  });

  // 11. Class level cap by immutable class id (Bloodstorm Blade is a 10-level prestige class, ToB p.110)
  test('Class Level Cap: prestige class blocked at progression.maxLevel; base class uncapped; excludeIndex for re-class', () => {
    const bsbDef = RuleEngine.getClassDef('Bloodstorm Blade'); // srd_classes_races.json (eager chunk)
    assert.ok(bsbDef && Number(bsbDef.maxLevel) === 10 && bsbDef.isPrestige === true, 'Bloodstorm Blade record: 10-level prestige class');
    const rows = [];
    for (let i = 0; i < 4; i++) rows.push({ className: 'Warblade' });
    for (let i = 0; i < 2; i++) rows.push({ className: 'Rogue (Adventurer Variant)' });
    for (let i = 0; i < 10; i++) rows.push({ className: 'Bloodstorm Blade' });
    const bsb = RuleEngine.getClassLevelCapStatus('Bloodstorm Blade', rows, { classDef: bsbDef });
    assert.strictEqual(bsb.classId, 'cls-bloodstorm-blade');
    assert.strictEqual(bsb.maxLevel, 10);
    assert.strictEqual(bsb.taken, 10);
    assert.strictEqual(bsb.atCap, true, 'Bloodstorm Blade 11 must be blocked');
    const reclass = RuleEngine.getClassLevelCapStatus('Bloodstorm Blade', rows, { classDef: bsbDef, excludeIndex: 15 });
    assert.strictEqual(reclass.atCap, false, 'Re-classing one of the 10 Bloodstorm Blade rows keeps it at 9/10');
    const nine = RuleEngine.getClassLevelCapStatus('Bloodstorm Blade', rows.slice(0, 15), { classDef: bsbDef });
    assert.strictEqual(nine.atCap, false);
    assert.strictEqual(nine.remaining, 1);
    const warblade = RuleEngine.getClassLevelCapStatus('Warblade', rows);
    assert.strictEqual(warblade.hasCap, false, '20-level base classes continue into epic levels (ELH)');
    assert.strictEqual(warblade.atCap, false);
    // Rows match by immutable class id: a row stored under the id (not the display name) still counts.
    const byId = RuleEngine.getClassLevelCapStatus('Fighter', [{ className: 'cls-fighter' }, { className: 'Fighter' }], {
      classDef: { id: 'cls-fighter', name: 'Fighter', type: 'Prestige Class', maxLevel: 2 }
    });
    assert.strictEqual(byId.taken, 2);
    assert.strictEqual(byId.atCap, true);
  });

  // 12. Prerequisites respect build order: a feat picked at row N only sees rows 0..N (+ unleveled grants)
  test('Build-Order Prerequisites: getFeatNamesKnownAtLevel excludes feats first gained on later rows', () => {
    const ch = {
      race: 'Human',
      feats: [
        { name: 'Power Attack', source: 'Level 1 (Warblade)' },
        { name: 'Combat Expertise', source: 'Level 5 (Warblade)' },
        { name: 'Improved Trip', source: 'Level 7 (Rogue (Adventurer Variant))' },
        { name: 'Exotic Weapon Proficiency (Jovar)', source: 'Level 11 (Bloodstorm Blade)', choice: 'Jovar' },
        { name: 'Wotemberere Born', source: 'Level 1 (Warblade)' }
      ],
      specialAbilities: [{ name: 'Evasion (Ex)', source: 'Rogue (Adventurer Variant) Level 7' }],
      levelProgression: [
        { className: 'Warblade', feats: ['🧬 [Racial] Power Attack', '🎖️ [Extra] Wotemberere Born'] },
        { className: 'Warblade', feats: [] },
        { className: 'Warblade', feats: [] },
        { className: 'Warblade', feats: ['+1 Stat: INT'] },
        { className: 'Warblade', feats: ['🎖️ Combat Expertise'] },
        { className: 'Rogue (Adventurer Variant)', feats: [] },
        { className: 'Rogue (Adventurer Variant)', feats: ['🎖️ Improved Trip'], specialAbilities: ['Evasion (Ex)'] }
      ]
    };
    // Same normalization as checkFeatPrerequisites (strips emoji + "[Tag]" row prefixes)
    const norm = s => String(s).toLowerCase().replace(/^[^a-z0-9[]*(\[.*?\])?\s*/, '').replace(/[^a-z0-9]/g, '');
    const at = idx => new Set(RuleEngine.getFeatNamesKnownAtLevel(ch, idx).map(norm));
    const lv3 = at(2);
    assert.ok(lv3.has('powerattack') && lv3.has('wotemberereborn'), 'Level 1 feats count at level 3');
    assert.ok(!lv3.has('combatexpertise'), 'Combat Expertise (level 5) must not satisfy a level-3 prerequisite');
    assert.ok(!lv3.has('improvedtrip'), 'Improved Trip (level 7) must not satisfy a level-3 prerequisite');
    assert.ok(!lv3.has('evasionex'), 'Evasion (level 7) must not count at level 3');
    assert.ok(!lv3.has('exoticweaponproficiencyjovar'), 'A feat sourced at Level 11 must not count at level 3');
    const lv5 = at(4);
    assert.ok(lv5.has('combatexpertise') && !lv5.has('improvedtrip'));
    const lv7 = at(6);
    assert.ok(lv7.has('improvedtrip') && lv7.has('evasionex'));
  });

  // 13. Feats granted by templates (bonusFeats) and domains (V3 grant effects) surface as owned feats
  test('Granted Feats: Vampire template bonus feats and War domain grant surface via getGrantedFeats', () => {
    const vamp = RuleEngine.getGrantedFeats({ race: 'Human', templates: ['Vampire'] });
    const vampNames = vamp.map(g => g.name);
    ['Alertness', 'Combat Reflexes', 'Dodge', 'Improved Initiative', 'Lightning Reflexes'].forEach(n => {
      assert.ok(vampNames.includes(n), `Vampire must grant ${n}`);
    });
    assert.ok(vamp.every(g => g.grantSource === 'template' && /vampire/i.test(g.source)));
    const war = RuleEngine.getGrantedFeats({ race: 'Human', spellcasting: { domains: ['War'] } });
    assert.ok(war.some(g => g.id === 'feat-martial-weapon-proficiency' && g.grantSource === 'domain'), 'War domain grants Martial Weapon Proficiency');
    const known = RuleEngine.getFeatNamesKnownAtLevel({ race: 'Human', templates: ['Vampire'], feats: [], levelProgression: [{ className: 'Fighter', feats: [] }] }, 0);
    assert.ok(known.includes('Dodge'), 'Template-granted feats count toward prerequisites at every level');
  });

  return { passed, elapsedMs: Date.now() - startMs };
}

if (require.main === module) {
  const res = runRuleEngineTests();
  console.log(`✅ RuleEngine RAW Test Suite: ${res.passed}/${res.passed} passed in ${res.elapsedMs}ms.`);
}

module.exports = { runRuleEngineTests };
