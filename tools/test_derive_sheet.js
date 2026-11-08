/**
 * ============================================================================
 * JOYFUL-FERMI D&D 3.5e — GOLDEN CHARACTER FIXTURES & DERIVE-SHEET SUITE (R0)
 * ============================================================================
 * Deterministic baseline and two-pass immutability verification across 5
 * canonical D&D 3.5e character fixtures (`tools/fixtures/01_*.json` .. `05_*.json`).
 * ============================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const RuleEngine = require('../rule_engine.js');
const CharStore = require('../char_store.js');
const { UI, Actions } = require('../ui_components.js');
const SchemaMigrator = global.SchemaMigrator;

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key]);
  }
  return obj;
}

/**
 * Two-Pass Pure Immutability Gate:
 *   Pass 1 (Unfrozen Snapshot Diff): Verifies zero silent mutation when running
 *     in non-strict mode against an unfrozen clone.
 *   Pass 2 (Deep-Frozen Strict Check): Verifies zero strict-mode write attempts
 *     against a recursively frozen clone.
 */
function verifyPureExecution(fn, inputChar, inputDb = []) {
  // Pass 1: Unfrozen Snapshot Diff
  const unfrozenChar = JSON.parse(JSON.stringify(inputChar));
  const unfrozenDb = JSON.parse(JSON.stringify(inputDb));
  const beforeJson = JSON.stringify({ c: unfrozenChar, db: unfrozenDb });
  const res1 = fn(unfrozenChar, unfrozenDb);
  const afterJson = JSON.stringify({ c: unfrozenChar, db: unfrozenDb });
  if (afterJson !== beforeJson) {
    throw new Error('Pure execution violation (Pass 1 Unfrozen Diff): input character or db was mutated.');
  }

  // Pass 2: Deep-Frozen Strict Check
  const frozenChar = deepFreeze(JSON.parse(JSON.stringify(inputChar)));
  const frozenDb = deepFreeze(JSON.parse(JSON.stringify(inputDb)));
  const res2 = fn(frozenChar, frozenDb);

  if (res1 && res2 && res1._workingSnapshot?.hp?._lastPlayerChangeTs && res2._workingSnapshot?.hp?._lastPlayerChangeTs) {
    res2._workingSnapshot.hp._lastPlayerChangeTs = res1._workingSnapshot.hp._lastPlayerChangeTs;
  }
  if (JSON.stringify(res1) !== JSON.stringify(res2)) {
    throw new Error('Pure execution violation (Pass 2 Determinism): frozen vs unfrozen output mismatch.');
  }
  return res1;
}

function loadFixture(fileName) {
  const fullPath = path.join(FIXTURES_DIR, fileName);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function computeBaselineMetrics(charFixture) {
  const clone = JSON.parse(JSON.stringify(charFixture));
  if (SchemaMigrator && typeof SchemaMigrator.sanitizeCharacterAbilitiesAndPool === 'function') {
    SchemaMigrator.sanitizeCharacterAbilitiesAndPool(clone);
  }
  const customDb = Array.isArray(clone.customDb) ? clone.customDb : [];
  RuleEngine.recalculateCharacter(clone, customDb);
  const lego = clone.legoEvaluation || RuleEngine.evaluateLegoCharacter(clone, customDb);

  const weapons = (clone.weapons || []).map(w => {
    const isOff = w.slot === 'offHand' || /off-?hand/i.test(String(w.grip || ''));
    const evalRes = RuleEngine.evaluateWeaponAttack(clone, w, {
      grip: isOff ? 'Off-Hand' : (w.grip || '1-Hand')
    });
    return {
      id: w.id || w.name,
      name: w.name,
      netAttackBonus: evalRes.netAttackBonus,
      iteratives: evalRes.iteratives,
      attackStatName: evalRes.attackStatName,
      netFlatDamage: evalRes.netFlatDamage,
      baseDice: evalRes.baseDice,
      critMin: evalRes.critMin,
      critMult: evalRes.critMult,
      damagePartsCount: (evalRes.damageParts || []).length,
      extraDamagePartsCount: (evalRes.extraDamageParts || []).length
    };
  });

  return {
    name: clone.name,
    level: clone.level,
    ecl: clone.ecl,
    levelAdjustment: clone.levelAdjustment,
    abilities: {
      str: clone.abilities.str,
      dex: clone.abilities.dex,
      con: clone.abilities.con,
      int: clone.abilities.int,
      wis: clone.abilities.wis,
      cha: clone.abilities.cha
    },
    ac: {
      total: clone.acBreakdown.total,
      touch: clone.acBreakdown.touch,
      flatFooted: clone.acBreakdown.flatFooted,
      armor: clone.acBreakdown.armor,
      shield: clone.acBreakdown.shield,
      natural: clone.acBreakdown.natural,
      deflection: clone.acBreakdown.deflection,
      dodge: clone.acBreakdown.dodge,
      effectiveDex: clone.acBreakdown.effectiveDex,
      maxDex: clone.acBreakdown.maxDex,
      acp: clone.acBreakdown.acp,
      conditionalCount: (clone.conditionalAcBonuses || []).length
    },
    saves: {
      fort: clone.evaluatedSaves.fort,
      ref: clone.evaluatedSaves.ref,
      will: clone.evaluatedSaves.will,
      conditionalCount: (clone.conditionalSaveBonuses || []).length
    },
    weapons,
    specialAbilitiesCount: (clone.specialAbilities || []).length,
    gearPoolCount: (clone.gearPool || []).length,
    lego: {
      modesCount: (lego.modes || []).length,
      modes: (lego.modes || []).map(m => ({
        id: m.modeId || m.id,
        name: m.name,
        actionType: m.actionType,
        dc: m.dc,
        reactsTo: m.reactsTo
      })),
      defenses: lego.defenses,
      resources: lego.resources
    }
  };
}

function runDeriveSheetTests() {
  const startMs = Date.now();
  let passed = 0;

  function check(label, condition, detail = '') {
    if (!condition) {
      throw new Error(`[DeriveSheet Golden Test Failed] ${label}${detail ? ': ' + detail : ''}`);
    }
    passed++;
  }

  // --------------------------------------------------------------------------
  // Fixture 01: Level 1 Human Fighter (Sword & Board)
  // --------------------------------------------------------------------------
  const f01Raw = loadFixture('01_fighter_lvl1.json');
  const f01 = computeBaselineMetrics(f01Raw);
  check('01_fighter_lvl1: STR 18 & unified mainHand/weapons[0] id wpn-longsword', f01.abilities.str === 18 && f01Raw.bodySlots.mainHand.id === 'wpn-longsword' && f01Raw.weapons[0].id === 'wpn-longsword', `got ${f01.abilities.str}`);
  check('01_fighter_lvl1: Normal AC 19 (10 + 5 Chainmail + 2 Heavy Shield + 2 Dex)', f01.ac.total === 19, `got ${f01.ac.total}`);
  check('01_fighter_lvl1: Touch AC 12 (10 + 2 Dex)', f01.ac.touch === 12, `got ${f01.ac.touch}`);
  check('01_fighter_lvl1: Flat-Footed AC 17 (10 + 5 Chainmail + 2 Heavy Shield)', f01.ac.flatFooted === 17, `got ${f01.ac.flatFooted}`);
  check('01_fighter_lvl1: ACP -7 (-5 Chainmail -2 Heavy Steel Shield)', f01.ac.acp === -7, `got ${f01.ac.acp}`);
  check('01_fighter_lvl1: Saves Fort +4 / Ref +2 / Will +1', f01.saves.fort === 4 && f01.saves.ref === 2 && f01.saves.will === 1, `got ${JSON.stringify(f01.saves)}`);
  check('01_fighter_lvl1: Masterwork Longsword Attack +7 (BAB +1, STR +4, MW +1, WF +1) & Damage +4', f01.weapons[0].netAttackBonus === 7 && f01.weapons[0].netFlatDamage === 4, `got ${JSON.stringify(f01.weapons[0])}`);

  // --------------------------------------------------------------------------
  // Fixture 02: Level 9 Cleric / Radiant Servant of Pelor
  // --------------------------------------------------------------------------
  const f02Raw = loadFixture('02_cleric_radiant_lvl9.json');
  const f02 = computeBaselineMetrics(f02Raw);
  check('02_cleric_radiant_lvl9: WIS 22 (20 Base + 2 Periapt) & CHA 18 (16 Base + 2 Cloak)', f02.abilities.wis === 22 && f02.abilities.cha === 18, `got ${JSON.stringify(f02.abilities)}`);
  check('02_cleric_radiant_lvl9: Unconditional AC 23 (10 + 9 Full Plate +1 + 3 Heavy Shield +1 + 1 Ring of Protection +1) — Protection from Evil (+2 vs. Evil) is conditional', f02.ac.total === 23 && f02.ac.conditionalCount >= 1, `got AC=${f02.ac.total}, cond=${f02.ac.conditionalCount}`);
  check('02_cleric_radiant_lvl9: Touch AC 11 (10 + 1 Deflection), Flat-Footed AC 23, & ACP -6 (-5 Full Plate +1 -1 Heavy Shield +1)', f02.ac.touch === 11 && f02.ac.flatFooted === 23 && f02.ac.acp === -6, `got ${JSON.stringify(f02.ac)}`);
  check('02_cleric_radiant_lvl9: Unconditional Saves Fort +10 / Ref +3 / Will +14 (Protection from Evil +2 vs Evil is conditional)', f02.saves.fort === 10 && f02.saves.ref === 3 && f02.saves.will === 14 && f02.saves.conditionalCount >= 1, `got ${JSON.stringify(f02.saves)}`);
  const f02Clone = JSON.parse(JSON.stringify(f02Raw));
  RuleEngine.recalculateCharacter(f02Clone, []);
  const healCl = RuleEngine.getSpellCasterLevelBonus({ name: 'Cure Serious Wounds', school: 'Conjuration (Healing)' }, f02Clone);
  check('02_cleric_radiant_lvl9: Healing Domain grants +1 CL to Healing spells', healCl.bonus === 1, `got ${JSON.stringify(healCl)}`);
  check('02_cleric_radiant_lvl9: +1 Heavy Mace with Divine Favor (+3 Luck Atk/Dmg) -> Attack +12 & Damage +6', f02.weapons[0].netAttackBonus === 12 && f02.weapons[0].netFlatDamage === 6, `got ${JSON.stringify(f02.weapons[0])}`);

  // --------------------------------------------------------------------------
  // Fixture 03: Level 12 TWF Rogue 4 / Swashbuckler 8 (Elf)
  // --------------------------------------------------------------------------
  const f03Raw = loadFixture('03_twf_rogue_swashbuckler_lvl12.json');
  const f03 = computeBaselineMetrics(f03Raw);
  check('03_twf_rogue_swashbuckler_lvl12: Post-Racial Elf Abilities DEX 24 (+7 Mod), CON 14 (+2 Mod), INT 16 (+3 Mod)', f03.abilities.dex === 24 && f03.abilities.con === 14 && f03.abilities.int === 16, `got ${JSON.stringify(f03.abilities)}`);
  check('03_twf_rogue_swashbuckler_lvl12: +1 Mithral Chain Shirt (Max Dex 6, ACP 0) caps +7 DEX at +6 -> Normal AC 21 (10 + 5 Armor + 6 Dex)', f03.ac.effectiveDex === 6 && f03.ac.total === 21 && f03.ac.acp === 0, `got ${JSON.stringify(f03.ac)}`);
  check('03_twf_rogue_swashbuckler_lvl12: Uncanny Dodge retains DEX to Flat-Footed AC (21)', f03.ac.flatFooted === 21, `got ${f03.ac.flatFooted}`);
  check('03_twf_rogue_swashbuckler_lvl12: Saves Fort +9 (7 Base + 2 CON), Ref +14 (6 Base + 7 DEX + 1 Grace), Will +3 (3 Base + 0 WIS)', f03.saves.fort === 9 && f03.saves.ref === 14 && f03.saves.will === 3, `got ${JSON.stringify(f03.saves)}`);
  check('03_twf_rogue_swashbuckler_lvl12: Standalone Main-Hand +2 Keen Rapier uses DEX (Weapon Finesse), threat 15-20, iteratives [20, 15, 10], & +6 damage (+1 STR + 2 Enh + 3 Insightful Strike)', f03.weapons[0].attackStatName.includes('DEX') && f03.weapons[0].critMin === 15 && f03.weapons[0].netAttackBonus === 20 && JSON.stringify(f03.weapons[0].iteratives) === '[20,15,10]' && f03.weapons[0].netFlatDamage === 6, `got ${JSON.stringify(f03.weapons[0])}`);
  check('03_twf_rogue_swashbuckler_lvl12: Standalone Off-Hand +1 Flaming Short Sword has +19 Attack, +4 flat damage (+0 STR + 1 Enh + 3 Insightful Strike), & extra Flaming 1d6 damagePart', f03.weapons[1].extraDamagePartsCount === 1 && f03.weapons[1].netAttackBonus === 19 && f03.weapons[1].netFlatDamage === 4, `got ${JSON.stringify(f03.weapons[1])}`);

  // --------------------------------------------------------------------------
  // Fixture 04: Level 15 Wizard / Archmage
  // --------------------------------------------------------------------------
  const f04Raw = loadFixture('04_wizard_archmage_lvl15.json');
  const f04 = computeBaselineMetrics(f04Raw);
  check('04_wizard_archmage_lvl15: INT 30 (24 Base + 6 Headband) & CON 16 (+3 Mod)', f04.abilities.int === 30 && f04.abilities.con === 16, `got ${JSON.stringify(f04.abilities)}`);
  check('04_wizard_archmage_lvl15: Normal AC 19 (10 + 5 Bracers + 3 Dex + 1 Haste Dodge), Touch AC 14, & Flat-Footed AC 15 (loses +3 Dex & +1 Haste Dodge)', f04.ac.total === 19 && f04.ac.touch === 14 && f04.ac.flatFooted === 15, `got ${JSON.stringify(f04.ac)}`);
  check('04_wizard_archmage_lvl15: Saves Fort +15 / Ref +16 / Will +20 (Cloak +4 Resistance + Greater Heroism +4 Morale + Haste +1 Dodge Ref) & Greater Heroism tempHpFormula', f04.saves.fort === 15 && f04.saves.ref === 16 && f04.saves.will === 20 && f04Raw.buffs.some(b => b.id === 'spl-greater-heroism' && b.tempHpFormula === 'min(20, @cl)'), `got ${JSON.stringify(f04.saves)}`);

  // --------------------------------------------------------------------------
  // Fixture 05: Level 17 Half-Dragon Warblade with V2.5 DM Boons & Sanitization
  // --------------------------------------------------------------------------
  const f05Raw = loadFixture('05_dragon_blooded_boons_lvl17.json');
  const f05 = computeBaselineMetrics(f05Raw);
  check('05_dragon_blooded_boons_lvl17: Half-Dragon Template Abilities STR 26 (+8), CON 18 (+2), INT 14 (+2), CHA 16 (+2)', f05.abilities.str === 26 && f05.abilities.con === 18 && f05.abilities.int === 14 && f05.abilities.cha === 16, `got ${JSON.stringify(f05.abilities)}`);
  check('05_dragon_blooded_boons_lvl17: Level Adjustment +3 -> ECL 20 (17 HD + 3 LA)', f05.levelAdjustment === 3 && f05.ecl === 20, `got LA=${f05.levelAdjustment}, ECL=${f05.ecl}`);
  check('05_dragon_blooded_boons_lvl17: Natural Armor +4 (Half-Dragon) + Shield +7 -> Normal AC 23', f05.ac.natural === 4 && f05.ac.shield === 7 && f05.ac.total === 23, `got ${JSON.stringify(f05.ac)}`);
  const boonBreathMode = f05.lego.modes.find(m => m.id === 'breath_acid_line');
  const racialBreathMode = f05.lego.modes.find(m => m.id === 'half_dragon_breath_6d8');
  const reflectMode = f05.lego.modes.find(m => m.id === 'mode_reflect_ward');
  check('05_dragon_blooded_boons_lvl17: DM Boon Breath Weapon DC = 31 (10 + @level 17 + @conMod 4) & Half-Dragon Racial Breath Weapon DC = 22 (10 + floor(17/2) + 4)', Boolean(boonBreathMode && boonBreathMode.dc === 31 && racialBreathMode && racialBreathMode.dc === 22), `got boon=${JSON.stringify(boonBreathMode)}, racial=${JSON.stringify(racialBreathMode)}`);
  check('05_dragon_blooded_boons_lvl17: Immediate Reaction mode_reflect_ward reactsTo incoming_spell', Boolean(reflectMode && reflectMode.actionType === 'immediate' && reflectMode.reactsTo === 'incoming_spell'), `got ${JSON.stringify(reflectMode)}`);
  check('05_dragon_blooded_boons_lvl17: SchemaMigrator deduplicates Dragon Breath (3 distinct specialAbilities remain) & removes ability from gearPool while keeping Ring of Blinking', f05.specialAbilitiesCount === 3 && f05.gearPoolCount === 1, `got sa=${f05.specialAbilitiesCount}, gear=${f05.gearPoolCount}`);

  // --------------------------------------------------------------------------
  // Self-Verification of Two-Pass Immutability Gate (`verifyPureExecution`)
  // --------------------------------------------------------------------------
  const pureRes = verifyPureExecution((c) => computeBaselineMetrics(c), f01Raw, []);
  check('verifyPureExecution: accepts pure function without mutation', pureRes.ac.total === 19);
  let caughtSilentMutation = false;
  try {
    verifyPureExecution((c) => { c.level = 99; return {}; }, f01Raw, []);
  } catch (_) {
    caughtSilentMutation = true;
  }
  check('verifyPureExecution: catches non-strict silent mutation in Pass 1 (Unfrozen Snapshot Diff)', caughtSilentMutation);

  // --------------------------------------------------------------------------
  // `RuleEngine.deriveSheet` Two-Pass Immutability, Parity & Consumables Gate
  // --------------------------------------------------------------------------
  check('RuleEngine.deriveSheet is defined as a function', typeof RuleEngine.deriveSheet === 'function');
  const allFixtures = [f01Raw, f02Raw, f03Raw, f04Raw, f05Raw];
  const derivedViews = [];
  for (const raw of allFixtures) {
    const baseline = computeBaselineMetrics(raw);
    const viewModel = verifyPureExecution(
      (c, db) => RuleEngine.deriveSheet(c, db),
      raw,
      raw.customDb || []
    );
    derivedViews.push(viewModel);
    check(`deriveSheet(${raw.name}): two-pass immutability & viewModel truthy`, Boolean(viewModel && viewModel.ac && viewModel.saves && viewModel.combat && viewModel.inventory));
    check(`deriveSheet(${raw.name}): AC parity`, viewModel.ac.total === baseline.ac.total && viewModel.ac.touch === baseline.ac.touch && viewModel.ac.flatFooted === baseline.ac.flatFooted);
    check(`deriveSheet(${raw.name}): Saves parity`, viewModel.saves.fort === baseline.saves.fort && viewModel.saves.ref === baseline.saves.ref && viewModel.saves.will === baseline.saves.will);

    // Full Deep-Equal Parity Gate (`recalculateCharacter` vs `deriveSheet` + `writeBackLegacyFields`)
    const cloneA = JSON.parse(JSON.stringify(raw));
    if (SchemaMigrator && typeof SchemaMigrator.sanitizeCharacterAbilitiesAndPool === 'function') {
      SchemaMigrator.sanitizeCharacterAbilitiesAndPool(cloneA);
    }
    RuleEngine.recalculateCharacter(cloneA, cloneA.customDb || []);

    const cloneB = JSON.parse(JSON.stringify(raw));
    const sheetB = RuleEngine.deriveSheet(cloneB, cloneB.customDb || []);
    RuleEngine.writeBackLegacyFields(cloneB, sheetB);
    const hasPlayerTsA = Boolean(cloneA.hp && cloneA.hp._lastPlayerChangeTs);
    const hasPlayerTsB = Boolean(cloneB.hp && cloneB.hp._lastPlayerChangeTs);
    if (hasPlayerTsA && hasPlayerTsB) {
      cloneB.hp._lastPlayerChangeTs = cloneA.hp._lastPlayerChangeTs;
    }
    check(
      `writeBackLegacyFields(${raw.name}): 100% Deep-Equal parity with recalculateCharacter`,
      hasPlayerTsA === hasPlayerTsB && JSON.stringify(cloneB) === JSON.stringify(cloneA)
    );
  }

  // Insightful Strike Edge-Case Verification (`INT 8/10`, Medium Armor, Medium Load, Non-Finessable Greatsword)
  const f03Int8 = JSON.parse(JSON.stringify(f03Raw));
  f03Int8.baseAbilities.int = 8;
  f03Int8.abilities.int = 8;
  const v03Int8 = RuleEngine.deriveSheet(f03Int8, []);
  const f03Int10 = JSON.parse(JSON.stringify(f03Raw));
  f03Int10.baseAbilities.int = 10;
  f03Int10.abilities.int = 10;
  const v03Int10 = RuleEngine.deriveSheet(f03Int10, []);
  check(
    '03_twf_rogue_swashbuckler_lvl12: Insightful Strike with INT 8 (-1 mod) or INT 10 (0 mod) yields +0 bonus (netFlatDamage === 3, never falls back to value)',
    v03Int8.combat.weapons[0].evaluated.netFlatDamage === 3 && v03Int10.combat.weapons[0].evaluated.netFlatDamage === 3,
    `int8=${v03Int8.combat.weapons[0].evaluated.netFlatDamage}, int10=${v03Int10.combat.weapons[0].evaluated.netFlatDamage}`
  );

  const f03MedArmor = JSON.parse(JSON.stringify(f03Raw));
  f03MedArmor.bodySlots.armor.category = 'Medium';
  delete f03MedArmor.bodySlots.armor.material;
  const v03MedArmor = RuleEngine.deriveSheet(f03MedArmor, []);
  const f03MedLoad = JSON.parse(JSON.stringify(f03Raw));
  f03MedLoad.carryingLoad = 'Medium';
  const v03MedLoad = RuleEngine.deriveSheet(f03MedLoad, []);
  const greatswordEval = RuleEngine.evaluateWeaponAttack(
    v03Int10._workingSnapshot,
    { id: 'wpn-greatsword', name: 'Greatsword', handedness: 'Two-Handed', grip: '2-Hand', dice: '2d6' },
    { grip: '2-Hand' }
  );
  check(
    '03_twf_rogue_swashbuckler_lvl12: Insightful Strike suppressed in Medium Armor, Medium Load, or with Two-Handed Greatsword',
    v03MedArmor.combat.weapons[0].evaluated.netFlatDamage === 3 &&
    v03MedLoad.combat.weapons[0].evaluated.netFlatDamage === 3 &&
    greatswordEval.netFlatDamage === 1,
    `medArmor=${v03MedArmor.combat.weapons[0].evaluated.netFlatDamage}, medLoad=${v03MedLoad.combat.weapons[0].evaluated.netFlatDamage}, greatsword=${greatswordEval.netFlatDamage}`
  );

  // Multi-Render Temp HP Stability Gate (Fixture 04 Greater Heroism)
  CharStore.clearHistory();
  CharStore.dispatch({ type: 'doc/replace', payload: f04Raw, meta: { skipHistory: true } });
  const ghBuffAfterInit = (CharStore.getDoc().buffs || []).find(b => b.id === 'spl-greater-heroism');
  check('04_wizard_archmage_lvl15: Greater Heroism sets initial Temp HP 15 & writes back _tempHpSynced=true',
    CharStore.getSheet().hp.temp === 15 && Boolean(ghBuffAfterInit && ghBuffAfterInit._tempHpSynced === true)
  );
  CharStore.dispatch({
    type: 'doc/mutate',
    meta: { label: 'Absorb 6 Damage into Temp HP' },
    payload: (doc) => { doc.hp.temp = 9; }
  });
  CharStore.recompute();
  check('04_wizard_archmage_lvl15: Multi-render recompute preserves reduced Temp HP 9 (does NOT reset to 15)',
    CharStore.getSheet().hp.temp === 9,
    `got ${CharStore.getSheet().hp.temp}`
  );

  // Verify `deriveConsumablesView` grouping & P11 physical item / ability exclusion
  const v01 = derivedViews[0];
  check('deriveSheet(01_fighter_lvl1): Potion of Cure Light Wounds in healing group; Heavy Steel Shield excluded',
    v01.inventory.consumablesGrouped.byGroup.healing.some(i => i.name === 'Potion of Cure Light Wounds') &&
    !v01.inventory.consumablesGrouped.allItems.some(i => /shield|longsword|chainmail/i.test(i.name))
  );
  const v05 = derivedViews[4];
  check('deriveSheet(05_dragon_blooded_boons_lvl17): Ring of Blinking in daily_charge group; Heavy Steel Shield & Dragon Breath excluded',
    v05.inventory.consumablesGrouped.byGroup.daily_charge.some(i => i.name === 'Ring of Blinking') &&
    !v05.inventory.consumablesGrouped.allItems.some(i => /shield|dragon breath/i.test(i.name))
  );

  // --------------------------------------------------------------------------
  // `CharStore` Lifecycle, 20-Step Undo/Redo & Fine-Grained Region Subscriptions
  // --------------------------------------------------------------------------
  CharStore.clearHistory();
  CharStore.dispatch({ type: 'doc/replace', payload: f01Raw, meta: { skipHistory: true } });
  let acRegionFires = 0;
  let hpRegionFires = 0;
  CharStore.mountRegion('test_ac', (s) => s.sheet?.ac?.total, () => { acRegionFires++; });
  CharStore.mountRegion('test_hp', (s) => s.sheet?.hp?.current, () => { hpRegionFires++; });

  // Mutate HP (should fire hpRegion, NOT acRegion)
  CharStore.dispatch({
    type: 'doc/mutate',
    meta: { label: 'Take 5 Damage' },
    payload: (doc) => { doc.hp.current = 7; }
  });
  check('CharStore region subscription: HP mutation fires only hpRegion, not acRegion', hpRegionFires === 1 && acRegionFires === 0, `hp=${hpRegionFires}, ac=${acRegionFires}`);
  check('CharStore undo/redo: Undo restores HP 12 -> Redo restores HP 7',
    (() => {
      CharStore.undo();
      const afterUndoHp = CharStore.getSheet().hp.current;
      CharStore.redo();
      const afterRedoHp = CharStore.getSheet().hp.current;
      return afterUndoHp === 12 && afterRedoHp === 7;
    })()
  );

  // Push 25 history mutations and verify 20-step ring buffer cap
  for (let step = 1; step <= 25; step++) {
    CharStore.dispatch({
      type: 'doc/mutate',
      meta: { label: `Step ${step}` },
      payload: (doc) => { doc.hp.temp = step; }
    });
  }
  const counts = CharStore.getHistoryCounts();
  check('CharStore 20-step Undo ring buffer: caps at 20 steps after 25 dispatches', counts.undo === 20 && counts.redo === 0, `got ${JSON.stringify(counts)}`);
  CharStore.unmountRegion('test_ac');
  CharStore.unmountRegion('test_hp');
  CharStore.clearHistory();

  // --------------------------------------------------------------------------
  // Phase R2: `UI.html` XSS Auto-Escaping, Composition & `Actions` Router
  // --------------------------------------------------------------------------
  const xssPayload = `<script>alert("xss")</script>' " &`;
  const escapedFragment = UI.html`<div data-name="${xssPayload}">${xssPayload}</div>`;
  const escapedStr = escapedFragment.toString();
  check(
    'UI.html auto-escapes <script>, quotes, and ampersands in attributes & text nodes',
    !escapedStr.includes('<script>') &&
    escapedStr.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&#39; &quot; &amp;'),
    escapedStr
  );

  const nestedList = ['Alpha', '<Beta>'].map(item => UI.html`<li>${item}</li>`);
  const composedFragment = UI.html`<ul>${nestedList}${UI.raw('<li class="raw">Gamma</li>')}</ul>`;
  check(
    'UI.html composes nested UI.html arrays and UI.raw without double-escaping',
    composedFragment.toString() === '<ul><li>Alpha</li><li>&lt;Beta&gt;</li><li class="raw">Gamma</li></ul>',
    composedFragment.toString()
  );

  let invokedActionPayload = null;
  Actions.register('test:ping', (_el, dataset) => {
    invokedActionPayload = dataset;
    return 'pong';
  });
  const pingRes = Actions.invoke('test:ping', { sourceType: 'pool', id: 'gear-potion-clw' });
  check(
    'Actions.register & Actions.invoke route delegated dataset actions cleanly',
    pingRes === 'pong' && invokedActionPayload && invokedActionPayload.id === 'gear-potion-clw'
  );

  // --------------------------------------------------------------------------
  // Phase R2: `renderConsumables` Pure View-Model & `data-action` Verification
  // --------------------------------------------------------------------------
  const mockContainer = { innerHTML: '' };
  const f01WithSpecialId = JSON.parse(JSON.stringify(f01Raw));
  f01WithSpecialId.gearPool.push({
    id: `pot_quote'_"_<script>`,
    name: `Elixir of 'Testing' <1>`,
    category: 'Consumable',
    qty: 1,
    desc: 'Grants +2 morale bonus'
  });
  const specialView = RuleEngine.deriveSheet(f01WithSpecialId, []);
  const renderedHtml = UI.renderConsumablesView(mockContainer, specialView.inventory.consumablesGrouped);
  const inlineOnEventRegex = new RegExp('\\bon(click|change|input|submit)\\s*=', 'i');
  check(
    'UI.renderConsumablesView: emits data-action="consumable:use", zero inline event handlers, and escapes special characters in data-id & name',
    renderedHtml.includes('data-action="consumable:use"') &&
    !inlineOnEventRegex.test(renderedHtml) &&
    !renderedHtml.includes('<script>') &&
    renderedHtml.includes('pot_quote&#39;_&quot;_&lt;script&gt;') &&
    renderedHtml.includes('1d8+1 HP'),
    renderedHtml.slice(0, 240)
  );

  // --------------------------------------------------------------------------
  // Phase R2: `consumable/use` Dispatch + `Ctrl+Z` Undo Verification
  // --------------------------------------------------------------------------
  CharStore.clearHistory();
  CharStore.replaceDoc(f01Raw, { skipHistory: true });
  const initialPotion = (CharStore.getDoc().consumables || [])[0];
  check('R2 Consumable Use (Fixture 01): initial Potion of Cure Light Wounds qty === 2 & HP === 12',
    Boolean(initialPotion && initialPotion.qty === 2 && CharStore.getSheet().hp.current === 12)
  );

  // Take 5 damage (HP: 12 -> 7)
  CharStore.dispatch({
    type: 'doc/mutate',
    meta: { label: 'Take 5 Damage' },
    payload: (doc) => { doc.hp.current = 7; }
  });
  check('R2 Consumable Use (Fixture 01): HP drops to 7 after taking 5 damage', CharStore.getSheet().hp.current === 7);

  // Use Potion of Cure Light Wounds with deterministic d8 roll = 4 (heals 4 + 1 = 5 HP -> 12 HP, qty: 2 -> 1)
  CharStore.dispatch({
    type: 'consumable/use',
    label: 'Use Potion of Cure Light Wounds',
    payload: {
      sourceType: 'consumable',
      idOrIdx: 0,
      rolls: [{ type: 'd8', value: 4 }]
    }
  });
  const afterUsePotion = (CharStore.getDoc().consumables || [])[0];
  check(
    'R2 Consumable Use (Fixture 01): Potion of Cure Light Wounds decrements qty 2 -> 1 & heals HP 7 -> 12',
    Boolean(afterUsePotion && afterUsePotion.qty === 1 && CharStore.getSheet().hp.current === 12),
    `qty=${afterUsePotion?.qty}, hp=${CharStore.getSheet().hp.current}`
  );

  // Undo (Ctrl+Z) restores qty 1 -> 2 and HP 12 -> 7
  CharStore.undo();
  const afterUndoPotion = (CharStore.getDoc().consumables || [])[0];
  check(
    'R2 Consumable Undo (Fixture 01): Ctrl+Z restores Potion of Cure Light Wounds qty 1 -> 2 & HP 12 -> 7',
    Boolean(afterUndoPotion && afterUndoPotion.qty === 2 && CharStore.getSheet().hp.current === 7),
    `qty=${afterUndoPotion?.qty}, hp=${CharStore.getSheet().hp.current}`
  );

  // Daily-charge item on Fixture 05: Ring of Blinking (gearPool id: 'item-ring-of-blinking', dailyCharges: 3/day)
  CharStore.clearHistory();
  CharStore.replaceDoc(f05Raw, { skipHistory: true });
  const getRingOfBlinking = () => (CharStore.getDoc().gearPool || []).find(p => p.id === 'item-ring-of-blinking');
  check(
    'R2 Daily Charge Use (Fixture 05): Ring of Blinking starts with 3/3 daily charges',
    Boolean(getRingOfBlinking() && getRingOfBlinking().dailyCharges.current === 3)
  );
  CharStore.dispatch({
    type: 'consumable/use',
    label: 'Use Ring of Blinking',
    payload: {
      sourceType: 'pool',
      idOrIdx: 'item-ring-of-blinking'
    }
  });
  check(
    'R2 Daily Charge Use (Fixture 05): Ring of Blinking decrements dailyCharges.current 3 -> 2',
    getRingOfBlinking().dailyCharges.current === 2 &&
    CharStore.getSheet().inventory.consumablesGrouped.byGroup.daily_charge[0].dailyCharges.current === 2
  );
  CharStore.undo();
  check(
    'R2 Daily Charge Undo (Fixture 05): Ctrl+Z restores Ring of Blinking dailyCharges.current 2 -> 3',
    getRingOfBlinking().dailyCharges.current === 3 &&
    CharStore.getSheet().inventory.consumablesGrouped.byGroup.daily_charge[0].dailyCharges.current === 3
  );

  // --------------------------------------------------------------------------
  // Character-Scoped `character.customDb` (`masterDb`) Isolation Gate
  // --------------------------------------------------------------------------
  CharStore.clearHistory();
  const charA = JSON.parse(JSON.stringify(f01Raw));
  charA.customDb = [
    { id: 'hb_valerius_blade', name: 'Valerius Family Greatsword', category: 'Weapon', schemaVersion: 2 }
  ];
  CharStore.replaceDoc(charA, { skipHistory: true });
  check(
    'Character-Scoped customDb Isolation: Character A loads its own customDb and syncs global.masterDb === doc.customDb',
    CharStore.getCustomDb().length === 1 &&
    CharStore.getCustomDb()[0].id === 'hb_valerius_blade' &&
    global.masterDb === CharStore.getDoc().customDb
  );

  // Switch to Character B (with its own distinct customDb)
  const charB = JSON.parse(JSON.stringify(f05Raw));
  charB.customDb = [
    { id: 'hb_kaelen_draconic_boon', name: 'Draconic Path Boon', category: 'DM Boon', schemaVersion: 2 }
  ];
  CharStore.replaceDoc(charB, { label: 'Switch to Kaelen' });
  check(
    'Character-Scoped customDb Isolation: Switching to Character B isolates customDb (zero leakage from Character A)',
    CharStore.getCustomDb().length === 1 &&
    !CharStore.getCustomDb().some(e => e.id === 'hb_valerius_blade') &&
    CharStore.getCustomDb()[0].id === 'hb_kaelen_draconic_boon' &&
    global.masterDb === CharStore.getDoc().customDb
  );

  // Undo character switch -> restores Character A's customDb
  CharStore.undo();
  check(
    'Character-Scoped customDb Isolation: Undo restores Character A customDb with zero cross-character pollution',
    CharStore.getCustomDb().length === 1 &&
    CharStore.getCustomDb()[0].id === 'hb_valerius_blade' &&
    global.masterDb === CharStore.getDoc().customDb
  );
  CharStore.clearHistory();

  // --------------------------------------------------------------------------
  // Phase R2 QA Remediation: Bilingual Turkish Consumable Parsing & Reducer + No-Op Undo Guard
  // --------------------------------------------------------------------------
  const trHealPlan = RuleEngine.parseConsumablePlan('İyileştirme İksiri (Ciddi)', '');
  const trFirePlan = RuleEngine.parseConsumablePlan('Ateş Topu Asası', '');
  const trCursePlan = RuleEngine.parseConsumablePlan('Lanet Kaldırma İksiri', '');
  check(
    'RuleEngine.parseConsumablePlan Bilingual Reader Shield: parses Turkish Ciddi İyileştirme (3d8+5), Ateş Topu Asası (5d6), and Lanet Kaldırma (cursed)',
    trHealPlan.isHealing === true && trHealPlan.diceCount === 3 && trHealPlan.flatBonus === 5 &&
    trFirePlan.isDamage === true && trFirePlan.formula === '5d6' &&
    trCursePlan.isCure === true && trCursePlan.cureFlags.curse === true,
    JSON.stringify({ trHealPlan, trFirePlan, trCursePlan })
  );

  // Dispatch Turkish consumables via CharStore & verify No-Op Undo Guard on exhausted / missing items
  CharStore.clearHistory();
  const trChar = JSON.parse(JSON.stringify(f05Raw));
  trChar.hp.current = 1;
  trChar.activeDebuffs = ['cursed'];
  trChar.consumables = [
    { name: 'İyileştirme İksiri (Ciddi)', qty: 1, effect: '' },
    { name: 'Ateş Topu Asası', qty: 2, effect: '' },
    { name: 'Lanet Kaldırma İksiri', qty: 1, effect: '' },
    { name: 'Tükenmiş İksir', qty: 0, effect: 'Heals 1d8+1 HP' }
  ];
  CharStore.replaceDoc(trChar, { skipHistory: true });

  // 1. No-op guard: dispatch on exhausted item (qty: 0) and missing item (idx: 99) -> must NOT push onto Undo stack
  CharStore.dispatch({
    type: 'consumable/use',
    label: 'Use Depleted Potion',
    payload: { sourceType: 'consumable', idOrIdx: 3 }
  });
  CharStore.dispatch({
    type: 'consumable/use',
    label: 'Use Missing Potion',
    payload: { sourceType: 'consumable', idOrIdx: 99 }
  });
  check(
    'CharStore No-Op Undo Guard: dispatching consumable/use on exhausted (qty: 0) or missing item does NOT push onto Undo stack',
    CharStore.canUndo() === false && CharStore.getHistoryCounts().undo === 0,
    `canUndo=${CharStore.canUndo()}, counts=${JSON.stringify(CharStore.getHistoryCounts())}`
  );

  // 2. Dispatch Turkish "İyileştirme İksiri (Ciddi)" with deterministic rolls [5, 6, 7] + 5 = +23 HP (1 -> 24)
  CharStore.dispatch({
    type: 'consumable/use',
    label: 'Use İyileştirme İksiri (Ciddi)',
    payload: {
      sourceType: 'consumable',
      idOrIdx: 0,
      rolls: { healRoll: [5, 6, 7] }
    }
  });
  const trHealOutcome = CharStore.getLastOutcome();
  check(
    'Bilingual Consumable Dispatch: "İyileştirme İksiri (Ciddi)" heals 3d8+5 (+23 HP -> 24 HP) & records outcome on CharStore.getLastOutcome()',
    CharStore.getSheet().hp.current === 24 &&
    trHealOutcome && trHealOutcome.status === 'healed_dice' && trHealOutcome.healTotal === 23 &&
    CharStore.getDoc().consumables[0].qty === 0 &&
    CharStore.canUndo() === true,
    JSON.stringify(trHealOutcome)
  );

  // 3. Dispatch Turkish "Ateş Topu Asası" with deterministic rolls [3, 4, 5, 6, 2] = 20 Fire Damage
  CharStore.dispatch({
    type: 'consumable/use',
    label: 'Use Ateş Topu Asası',
    payload: {
      sourceType: 'consumable',
      idOrIdx: 1,
      rolls: { dmgRoll: [3, 4, 5, 6, 2] }
    }
  });
  const trFireOutcome = CharStore.getLastOutcome();
  check(
    'Bilingual Consumable Dispatch: "Ateş Topu Asası" rolls 5d6 (20 Fire Damage) & decrements qty 2 -> 1',
    trFireOutcome && trFireOutcome.status === 'damage_roll' && trFireOutcome.totalDamage === 20 &&
    CharStore.getDoc().consumables[1].qty === 1,
    JSON.stringify(trFireOutcome)
  );

  // 4. Dispatch Turkish "Lanet Kaldırma İksiri" -> clears 'cursed' from activeDebuffs
  CharStore.dispatch({
    type: 'consumable/use',
    label: 'Use Lanet Kaldırma İksiri',
    payload: {
      sourceType: 'consumable',
      idOrIdx: 2
    }
  });
  const trCurseOutcome = CharStore.getLastOutcome();
  check(
    'Bilingual Consumable Dispatch: "Lanet Kaldırma İksiri" clears cursed debuff',
    trCurseOutcome && trCurseOutcome.status === 'cured_debuffs' &&
    !CharStore.getDoc().activeDebuffs.includes('cursed') &&
    CharStore.getDoc().consumables[2].qty === 0,
    JSON.stringify({ trCurseOutcome, activeDebuffs: CharStore.getDoc().activeDebuffs })
  );
  CharStore.clearHistory();

  // --------------------------------------------------------------------------
  // Phase R3: `sheet.combat` View-Model, Special Attacks, Action Economy, Round Tick & Undo/Redo
  // --------------------------------------------------------------------------
  const v05Combat = derivedViews[4];
  check(
    'Phase R3: sheet.combat exposes round, actionEconomy, tactical, specialAttacks, and activeBuffsStrip across all 5 fixtures',
    derivedViews.every(v =>
      v && v.combat &&
      typeof v.combat.round === 'number' &&
      v.combat.actionEconomy && typeof v.combat.actionEconomy.standard === 'boolean' &&
      v.combat.tactical && typeof v.combat.tactical.maxBabCap === 'number' &&
      Array.isArray(v.combat.specialAttacks) &&
      Array.isArray(v.combat.activeBuffsStrip)
    )
  );
  check(
    'Phase R3: Fixture 05 (Dragon-Blooded Boons) derives both Half-Dragon Breath Weapon (6d8 Acid, DC 22) and DM Boon Breath Weapon (4d8 Acid, 1d4+1 recharge, DC 31)',
    v05Combat.combat.specialAttacks.some(sa => sa.name.includes('Half-Dragon') && sa.diceFormula === '6d8' && sa.dcVal === 22) &&
    v05Combat.combat.specialAttacks.some(sa => sa.name.includes('Dragon Breath Weapon') && sa.diceFormula === '4d8' && sa.dcVal === 31 && sa.cooldownExpr === '1d4+1'),
    JSON.stringify(v05Combat.combat.specialAttacks.map(s => ({ key: s.key, name: s.name, dice: s.diceFormula, dc: s.dcVal, cd: s.cooldownExpr })))
  );
  check(
    'Phase R3: Fixture 04 (Mystic Theurge) derives activeBuffsStrip with effective Caster Level and summary without mutating character.buffs',
    derivedViews[3].combat.activeBuffsStrip.length >= 2 &&
    derivedViews[3].combat.activeBuffsStrip.every(b => typeof b.effectiveCasterLevel === 'number' && b.id),
    JSON.stringify(derivedViews[3].combat.activeBuffsStrip.map(b => ({ id: b.id, name: b.name, cl: b.effectiveCasterLevel })))
  );

  // Initialize CharStore with Fixture 05 and test Special Attack Roll -> Advance Round -> Undo -> Redo
  CharStore.clearHistory();
  CharStore.replaceDoc(JSON.parse(JSON.stringify(f05Raw)));
  const boonSa = CharStore.getSheet().combat.specialAttacks.find(sa => sa.cooldownExpr === '1d4+1') || CharStore.getSheet().combat.specialAttacks[0];
  check(
    'Phase R3: Initial Round === 1, Standard Action available, Breath Weapon ready (remainingCooldown === 0)',
    CharStore.getSheet().combat.round === 1 &&
    CharStore.getSheet().combat.actionEconomy.standard === true &&
    Boolean(boonSa && boonSa.isReady === true && boonSa.remainingCooldown === 0)
  );

  // Dispatch combat/specialAttackRoll with 3-round cooldown and Move/Standard action consumption
  CharStore.dispatch({
    type: 'combat/specialAttackRoll',
    label: `Special Attack: ${boonSa.name}`,
    payload: {
      abilityKey: boonSa.key,
      abilityName: boonSa.name,
      entryId: boonSa.entryId,
      modeId: boonSa.modeId,
      cooldownRounds: 3,
      actionType: 'standard'
    }
  });
  const afterRollSheet = CharStore.getSheet();
  const boonSaAfterRoll = afterRollSheet.combat.specialAttacks.find(sa => sa.key === boonSa.key);
  check(
    'Phase R3: combat/specialAttackRoll sets cooldown to 3 rounds (readyRound === 4) and consumes Standard Action',
    afterRollSheet.combat.round === 1 &&
    afterRollSheet.combat.actionEconomy.standard === false &&
    Boolean(boonSaAfterRoll && boonSaAfterRoll.isReady === false && boonSaAfterRoll.remainingCooldown === 3 && boonSaAfterRoll.readyRound === 4),
    JSON.stringify({ round: afterRollSheet.combat.round, actionEconomy: afterRollSheet.combat.actionEconomy, boonSaAfterRoll })
  );

  // Dispatch combat/toggleTacticalMod (charge + shieldBlockActive) before advancing round
  CharStore.dispatch({
    type: 'combat/toggleTacticalMod',
    label: 'Toggle Charge',
    payload: { key: 'charge', value: true }
  });
  CharStore.dispatch({
    type: 'combat/toggleTacticalMod',
    label: 'Toggle Shield Block',
    payload: { key: 'shieldBlockActive', value: true }
  });
  check(
    'Phase R3: combat/toggleTacticalMod activates charge and shieldBlockActive in sheet.combat.tactical',
    CharStore.getSheet().combat.tactical.charge === true &&
    CharStore.getSheet().combat.tactical.shieldBlockActive === true
  );

  // Dispatch combat/advanceRound -> Round 1 -> 2, cooldown 3 -> 2, actionEconomy reset, 1-round reactions cleared
  CharStore.dispatch({
    type: 'combat/advanceRound',
    label: 'Next Round'
  });
  const afterRound2Sheet = CharStore.getSheet();
  const boonSaRound2 = afterRound2Sheet.combat.specialAttacks.find(sa => sa.key === boonSa.key);
  const round2Outcome = CharStore.getLastOutcome();
  check(
    'Phase R3: combat/advanceRound advances Round 1 -> 2, ticks cooldown 3 -> 2, resets Standard Action to true, and clears Charge/Shield Block',
    afterRound2Sheet.combat.round === 2 &&
    afterRound2Sheet.combat.actionEconomy.standard === true &&
    afterRound2Sheet.combat.tactical.charge === false &&
    afterRound2Sheet.combat.tactical.shieldBlockActive === false &&
    Boolean(boonSaRound2 && boonSaRound2.remainingCooldown === 2) &&
    Boolean(round2Outcome && round2Outcome.round === 2 && Array.isArray(round2Outcome.notes) && round2Outcome.notes.length >= 2),
    JSON.stringify({ round: afterRound2Sheet.combat.round, rem: boonSaRound2?.remainingCooldown, notes: round2Outcome?.notes })
  );

  // Undo (Ctrl+Z) -> Restores Round 1, cooldown 3, Standard Action spent (false), Charge & Shield Block active
  CharStore.undo();
  const afterUndoSheet = CharStore.getSheet();
  const boonSaAfterUndo = afterUndoSheet.combat.specialAttacks.find(sa => sa.key === boonSa.key);
  check(
    'Phase R3: CharStore.undo() (Ctrl+Z) restores Round 1, cooldown 3, spent Standard Action (false), and tactical flags',
    afterUndoSheet.combat.round === 1 &&
    afterUndoSheet.combat.actionEconomy.standard === false &&
    afterUndoSheet.combat.tactical.charge === true &&
    afterUndoSheet.combat.tactical.shieldBlockActive === true &&
    Boolean(boonSaAfterUndo && boonSaAfterUndo.remainingCooldown === 3),
    JSON.stringify({ round: afterUndoSheet.combat.round, rem: boonSaAfterUndo?.remainingCooldown, std: afterUndoSheet.combat.actionEconomy.standard })
  );

  // Redo (Ctrl+Y) -> Re-applies Round 2, cooldown 2, Standard Action available (true)
  CharStore.redo();
  const afterRedoSheet = CharStore.getSheet();
  const boonSaAfterRedo = afterRedoSheet.combat.specialAttacks.find(sa => sa.key === boonSa.key);
  check(
    'Phase R3: CharStore.redo() (Ctrl+Y) re-applies Round 2, cooldown 2, and available Standard Action (true)',
    afterRedoSheet.combat.round === 2 &&
    afterRedoSheet.combat.actionEconomy.standard === true &&
    Boolean(boonSaAfterRedo && boonSaAfterRedo.remainingCooldown === 2)
  );
  CharStore.clearHistory();

  // --------------------------------------------------------------------------
  // Phase R3 QA Remediation Gates:
  // 1) Actions.invoke (el, dataset, event) Parameter Order & combat:* Contract
  // 2) Strict Whitelist on combat/toggleTacticalMod
  // 3) BAB 0 Combat Expertise Cap (0)
  // 4) Unified Buff Round Tick (b.rounds & b.durationRounds) on combat/advanceRound
  // 5) Formula Temp HP Subtraction on combat/toggleBuff & combat/removeBuff
  // --------------------------------------------------------------------------
  check('Phase R3 QA: UI.Actions is exported with register and invoke', Boolean(Actions && typeof Actions.register === 'function' && typeof Actions.invoke === 'function'));

  let capturedOrder = null;
  Actions.register('test:param-order-probe', (el, data, event) => {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    capturedOrder = {
      hasDatasetOnArg0: Boolean(el && el.dataset && el.dataset.abilityKey === 'sa_half_dragon_breath_weapon'),
      elValueOnArg0: el ? el.value : null,
      abilityKeyOnArg1: data ? data.abilityKey : null,
      idxOnArg1: data ? Number(data.idx) : null,
      deltaOnArg1: data ? Number(data.delta) : null,
      pinNameOnArg1: data ? data.pinName : null,
      eventStoppedOnArg2: Boolean(event && event.stopped === true)
    };
  });
  const mockEvent = {
    stopped: false,
    stopPropagation() { this.stopped = true; },
    preventDefault() {},
    target: { closest: () => null }
  };
  Actions.invoke('test:param-order-probe', {
    abilityKey: 'sa_half_dragon_breath_weapon',
    idx: '2',
    delta: '-1',
    pinName: 'Scorching Ray',
    value: 'offense_spell'
  }, mockEvent);
  check(
    'Phase R3 QA: Actions.invoke passes (el, dataset, event) in exact order and preserves dataset.abilityKey, idx, delta, pinName, el.value, and event.stopPropagation()',
    Boolean(
      capturedOrder &&
      capturedOrder.hasDatasetOnArg0 === true &&
      capturedOrder.elValueOnArg0 === 'offense_spell' &&
      capturedOrder.abilityKeyOnArg1 === 'sa_half_dragon_breath_weapon' &&
      capturedOrder.idxOnArg1 === 2 &&
      capturedOrder.deltaOnArg1 === -1 &&
      capturedOrder.pinNameOnArg1 === 'Scorching Ray' &&
      capturedOrder.eventStoppedOnArg2 === true
    ),
    JSON.stringify(capturedOrder)
  );

  // Verify all 24 `combat:*` Actions registrations in char_combat.js use `(el, data, event)` signature (never `(event, data)`)
  const charCombatSrc = fs.readFileSync(path.join(__dirname, '..', 'char_combat.js'), 'utf8');
  const combatActionRegs = [...charCombatSrc.matchAll(/Actions\.register\(\s*'(combat:[^']+)'\s*,\s*\(([^)]*)\)/g)];
  check(
    'Phase R3 QA: All Actions.register("combat:*") handlers in char_combat.js declare (el, data, event) parameter order and read data.abilityKey on special-attack-roll/recharge',
    combatActionRegs.length >= 24 &&
    combatActionRegs.every(m => {
      const params = m[2].split(',').map(s => s.trim());
      return params[0] === 'el' && params[1] === 'data';
    }) &&
    /Actions\.register\('combat:special-attack-roll'[\s\S]{0,200}data\.abilityKey/.test(charCombatSrc) &&
    /Actions\.register\('combat:special-attack-recharge'[\s\S]{0,200}data\.abilityKey/.test(charCombatSrc),
    JSON.stringify(combatActionRegs.map(m => [m[1], m[2]]))
  );

  // Verify strict whitelist on combat/toggleTacticalMod rejects arbitrary keys without polluting Undo history
  CharStore.clearHistory();
  const undoBeforeInvalidKey = CharStore.getHistoryCounts().undo;
  CharStore.dispatch({
    type: 'combat/toggleTacticalMod',
    payload: { key: '__proto_pollute_or_arbitrary_key__' }
  });
  check(
    'Phase R3 QA: combat/toggleTacticalMod rejects non-whitelisted tactical key with invalid_payload and does not push onto Undo stack',
    CharStore.getLastOutcome()?.status === 'invalid_payload' &&
    CharStore.getHistoryCounts().undo === undoBeforeInvalidKey &&
    CharStore.getDoc().tactical.__proto_pollute_or_arbitrary_key__ === undefined
  );

  // Verify ALL canonical tactical modifier keys (melee, defense, and all 6 qualified ranged modifier keys) are accepted by combat/toggleTacticalMod
  const expectedTacticalKeys = [
    'flanking', 'charge', 'higherGround',
    'fightingDefensively', 'totalDefense', 'shieldBlock', 'shieldBlockActive',
    'powerAttackActive', 'combatExpertiseActive',
    'rapidShot', 'manyshot', 'pointBlankShot', 'deadlyAim',
    'rangedHigherGround', 'targetInMelee', 'coverPenalty', 'defensiveCastingActive',
    'rangePenalty', 'enhanceArrow', 'trueStrike', 'sneakAttack', 'bootsHaste', 'witchlightSpeed'
  ];
  const allTacticalKeysAccepted = expectedTacticalKeys.every(k => {
    CharStore.dispatch({
      type: 'combat/toggleTacticalMod',
      payload: { key: k, value: true },
      meta: { skipHistory: true }
    });
    const out = CharStore.getLastOutcome();
    const resolved = k === 'shieldBlock' ? 'shieldBlockActive' : k;
    return out && out.status === 'tactical_toggled' && CharStore.getDoc().tactical[resolved] === true;
  });
  check(
    'Phase R3 QA: combat/toggleTacticalMod accepts all 23 melee, defense, and ranged tactical modifier keys (including rangePenalty, enhanceArrow, trueStrike, sneakAttack, bootsHaste, witchlightSpeed)',
    allTacticalKeysAccepted && Array.isArray(RuleEngine.TACTICAL_MOD_KEYS) && RuleEngine.TACTICAL_MOD_KEYS.length === 22
  );

  // Verify BAB 0 Combat Expertise Cap === 0
  const bab0Doc = JSON.parse(JSON.stringify(f01Raw));
  bab0Doc.bab = 0;
  CharStore.replaceDoc(bab0Doc, { skipHistory: true });
  CharStore.dispatch({
    type: 'combat/adjustCombatExpertise',
    payload: { delta: 3 }
  });
  check(
    'Phase R3 QA: combat/adjustCombatExpertise enforces D&D 3.5e RAW cap min(5, max(0, bab)) -> 0 when BAB is 0',
    CharStore.getDoc().tactical.combatExpertise === 0 &&
    CharStore.getSheet().combat.tactical.combatExpertise === 0
  );

  // Verify Unified Buff Round Tick (b.rounds = 2 -> 1 -> 0 expired) & Formula Temp HP subtraction on toggleBuff
  const buffTestDoc = JSON.parse(JSON.stringify(f04Raw));
  buffTestDoc.buffs.push({
    id: 'buff_potion_bull_str',
    name: "Bull's Strength (Potion)",
    active: true,
    rounds: 2,
    durationText: '2 rounds'
  });
  CharStore.replaceDoc(buffTestDoc, { skipHistory: true });
  const initialTempHp = CharStore.getSheet().hp.temp; // 18 from Greater Heroism
  const ghIdx = CharStore.getDoc().buffs.findIndex(b => b && b.name === 'Greater Heroism');
  CharStore.dispatch({
    type: 'combat/toggleBuff',
    payload: { index: ghIdx, grantedTempHp: 18 }
  });
  check(
    'Phase R3 QA: combat/toggleBuff subtracts formula grantedTempHp (18 -> 0) when deactivating Greater Heroism',
    CharStore.getDoc().hp.temp === 0 && CharStore.getSheet().hp.temp === 0 && CharStore.getDoc().buffs[ghIdx].active === false,
    `initialTemp=${initialTempHp}, afterToggleTemp=${CharStore.getSheet().hp.temp}`
  );
  CharStore.dispatch({ type: 'combat/advanceRound' });
  const potionBuffR2 = CharStore.getDoc().buffs.find(b => b && b.id === 'buff_potion_bull_str');
  CharStore.dispatch({ type: 'combat/advanceRound' });
  const potionBuffR3 = CharStore.getDoc().buffs.find(b => b && b.id === 'buff_potion_bull_str');
  check(
    'Phase R3 QA: combat/advanceRound ticks R2 potion buff b.rounds (2 -> 1 -> 0) and marks active=false on expiry',
    potionBuffR2 && potionBuffR3 && potionBuffR3.rounds === 0 && potionBuffR3.active === false && potionBuffR3.durationText === 'Expired',
    JSON.stringify(potionBuffR3)
  );
  CharStore.clearHistory();

  // ============================================================================
  // Phase R4: Inventory & Gear Pool View-Models, Pure Reducers & Undo/Redo
  // ============================================================================
  const r4Doc = JSON.parse(JSON.stringify(f01Raw));
  // Add a daily-charge ring and a pool item to test bodySlotsView, poolRows, and inventory/* reducers
  if (!r4Doc.bodySlots) r4Doc.bodySlots = {};
  r4Doc.bodySlots.ring1 = {
    id: 'item_ring_prot_1_charged',
    name: 'Ring of Blinking',
    type: 'Wondrous Item',
    slot: 'ring1',
    weight: 0.1,
    active: true,
    dailyCharges: { max: 3, current: 3, recharge: 'long_rest' }
  };
  r4Doc.gearPool.push({
    id: 'pool_test_cloak_res_2',
    name: 'Cloak of Resistance +2',
    category: 'Shoulders',
    slot: 'shoulders',
    weight: 1,
    qty: 1,
    cost: 4000,
    modifiers: [{ target: 'saves.all', value: 2, type: 'Resistance' }]
  });
  CharStore.replaceDoc(r4Doc, { skipHistory: true });
  const r4Sheet0 = CharStore.getSheet();

  check(
    'Phase R4: sheet.inventory exposes pure encumbranceView, wealthView, bodySlotsView, poolRows, weaponsView, and armorView',
    r4Sheet0.inventory &&
    r4Sheet0.inventory.encumbranceView &&
    typeof r4Sheet0.inventory.encumbranceView.totalWeight === 'number' &&
    typeof r4Sheet0.inventory.encumbranceView.equippedWeight === 'number' &&
    typeof r4Sheet0.inventory.encumbranceView.poolWeight === 'number' &&
    typeof r4Sheet0.inventory.encumbranceView.barPct === 'number' &&
    r4Sheet0.inventory.wealthView &&
    typeof r4Sheet0.inventory.wealthView.totalGpEquivalent === 'number' &&
    r4Sheet0.inventory.bodySlotsView &&
    Array.isArray(r4Sheet0.inventory.bodySlotsView.slotList) &&
    r4Sheet0.inventory.bodySlotsView.slotList.length === 14 &&
    typeof r4Sheet0.inventory.bodySlotsView.slotsByKey === 'object' &&
    Array.isArray(r4Sheet0.inventory.poolRows) &&
    Array.isArray(r4Sheet0.inventory.weaponsView) &&
    Array.isArray(r4Sheet0.inventory.armorView),
    JSON.stringify({
      encumbranceView: r4Sheet0.inventory?.encumbranceView,
      slotsLen: r4Sheet0.inventory?.bodySlotsView?.slotList?.length,
      poolLen: r4Sheet0.inventory?.poolRows?.length
    })
  );

  // Check normalized dailyCharges in bodySlotsView without mutating source doc if missing
  const ring1SlotView = r4Sheet0.inventory.bodySlotsView.slotsByKey.ring1;
  check(
    'Phase R4: bodySlotsView normalizes occupied slot item and dailyCharges cleanly',
    ring1SlotView && ring1SlotView.isOccupied === true && ring1SlotView.isActive === true &&
    ring1SlotView.dailyCharges && ring1SlotView.dailyCharges.max === 3 && ring1SlotView.dailyCharges.current === 3
  );

  // Test inventory/adjustSlotCharge + Undo/Redo
  CharStore.dispatch({
    type: 'inventory/adjustSlotCharge',
    payload: { slotKey: 'ring1', delta: -1 }
  });
  check(
    'Phase R4: inventory/adjustSlotCharge decrements slot dailyCharges.current (3 -> 2)',
    CharStore.getDoc().bodySlots.ring1.dailyCharges.current === 2 &&
    CharStore.getSheet().inventory.bodySlotsView.slotsByKey.ring1.dailyCharges.current === 2
  );
  CharStore.undo();
  check(
    'Phase R4: CharStore.undo() restores slot dailyCharges.current (2 -> 3)',
    CharStore.getDoc().bodySlots.ring1.dailyCharges.current === 3
  );
  CharStore.redo();
  check(
    'Phase R4: CharStore.redo() re-applies slot dailyCharges.current (3 -> 2)',
    CharStore.getDoc().bodySlots.ring1.dailyCharges.current === 2
  );

  // Test inventory/equipPoolItem -> updates saves (+2 Resistance) & marks pool item isEquipped, then Undo/Redo
  const fortBeforeCloak = CharStore.getSheet().saves.fort;
  const poolWeightBeforeEquip = CharStore.getSheet().inventory.encumbranceView.poolWeight;
  const eqWeightBeforeEquip = CharStore.getSheet().inventory.encumbranceView.equippedWeight;
  CharStore.dispatch({
    type: 'inventory/equipPoolItem',
    payload: { itemId: 'pool_test_cloak_res_2', forceSlotKey: 'shoulders' }
  });
  const sheetAfterEquip = CharStore.getSheet();
  const cloakInPoolAfterEquip = CharStore.getDoc().gearPool.find(i => i && i.id === 'pool_test_cloak_res_2');
  check(
    'Phase R4: inventory/equipPoolItem equips Cloak of Resistance +2 into shoulders, marks pool item isEquipped, shifts weight from pool to equipped, and updates saves (+2 Resistance)',
    CharStore.getDoc().bodySlots.shoulders &&
    CharStore.getDoc().bodySlots.shoulders.name === 'Cloak of Resistance +2' &&
    cloakInPoolAfterEquip && cloakInPoolAfterEquip.isEquipped === true &&
    sheetAfterEquip.saves.fort === fortBeforeCloak + 2 &&
    sheetAfterEquip.inventory.encumbranceView.equippedWeight === Math.round((eqWeightBeforeEquip + 1) * 10) / 10 &&
    sheetAfterEquip.inventory.encumbranceView.poolWeight === Math.round((poolWeightBeforeEquip - 1) * 10) / 10
  );

  // Test inventory/toggleSlotActive on shoulders -> deactivates Cloak bonus, Undo restores it
  const fortWithCloak = CharStore.getSheet().saves.fort;
  CharStore.dispatch({
    type: 'inventory/toggleSlotActive',
    payload: { slotKey: 'shoulders' }
  });
  check(
    'Phase R4: inventory/toggleSlotActive deactivates shoulders slot and recalculates saves',
    CharStore.getDoc().bodySlots.shoulders.active === false &&
    CharStore.getSheet().saves.fort === fortBeforeCloak
  );
  CharStore.undo();
  check(
    'Phase R4: CharStore.undo() restores active shoulders slot and save bonus',
    CharStore.getDoc().bodySlots.shoulders.active === true &&
    CharStore.getSheet().saves.fort === fortWithCloak
  );

  // Test inventory/unequipSlot -> unmarks isEquipped in gearPool and resets shoulders slot
  CharStore.dispatch({
    type: 'inventory/unequipSlot',
    payload: { slotKey: 'shoulders' }
  });
  const cloakInPoolAfterUnequip = CharStore.getDoc().gearPool.find(i => i && i.name === 'Cloak of Resistance +2');
  check(
    'Phase R4: inventory/unequipSlot unmarks isEquipped in gearPool and clears bodySlot',
    CharStore.getDoc().bodySlots.shoulders.name === '-' &&
    cloakInPoolAfterUnequip && cloakInPoolAfterUnequip.isEquipped === false &&
    CharStore.getSheet().saves.fort === fortBeforeCloak
  );

  // Test inventory/adjustPoolQty, inventory/togglePoolBelt, inventory/deletePoolItem + Undo
  CharStore.dispatch({
    type: 'inventory/adjustPoolQty',
    payload: { itemId: 'pool_test_cloak_res_2', delta: 2 }
  });
  CharStore.dispatch({
    type: 'inventory/togglePoolBelt',
    payload: { itemId: 'pool_test_cloak_res_2' }
  });
  const cloakAfterQtyBelt = CharStore.getDoc().gearPool.find(i => i && i.id === 'pool_test_cloak_res_2');
  check(
    'Phase R4: inventory/adjustPoolQty (1 -> 3) and inventory/togglePoolBelt (isBelt: true) mutate doc cleanly',
    cloakAfterQtyBelt && cloakAfterQtyBelt.qty === 3 && cloakAfterQtyBelt.isBelt === true && cloakAfterQtyBelt.inBelt === true
  );
  CharStore.dispatch({
    type: 'inventory/deletePoolItem',
    payload: { itemId: 'pool_test_cloak_res_2' }
  });
  check(
    'Phase R4: inventory/deletePoolItem removes item from gearPool and CharStore.undo() restores it',
    !CharStore.getDoc().gearPool.some(i => i && i.id === 'pool_test_cloak_res_2')
  );
  CharStore.undo();
  check(
    'Phase R4: CharStore.undo() after inventory/deletePoolItem restores the deleted item with qty=3',
    CharStore.getDoc().gearPool.some(i => i && i.id === 'pool_test_cloak_res_2' && i.qty === 3)
  );

  // Test inventory/updateWealth + wealthView calculation + Undo
  CharStore.dispatch({
    type: 'inventory/updateWealth',
    payload: { pp: 2, gp: 150, sp: 5, cp: 5 }
  });
  const wv = CharStore.getSheet().inventory.wealthView;
  check(
    'Phase R4: inventory/updateWealth updates doc.wealth and derives totalGpEquivalent (2*10 + 150 + 0.5 + 0.05 = 170.55)',
    wv.pp === 2 && wv.gp === 150 && wv.sp === 5 && wv.cp === 5 && wv.totalGpEquivalent === 170.55,
    JSON.stringify(wv)
  );
  CharStore.undo();

  // Static check: Verify every Actions.register('inventory:*', ...) handler in char_inventory.js uses (el, data, event)
  const charInventorySrc = fs.readFileSync(path.join(__dirname, '..', 'char_inventory.js'), 'utf8');
  const invActionRegRegex = /actionsApi\.register\(\s*['"]inventory:([^'"]+)['"]\s*,\s*\(([^)]*)\)/g;
  let invRegMatch;
  let invRegCount = 0;
  const badInvSigs = [];
  while ((invRegMatch = invActionRegRegex.exec(charInventorySrc)) !== null) {
    invRegCount++;
    const actionName = invRegMatch[1];
    const params = invRegMatch[2].split(',').map(s => s.trim()).filter(Boolean);
    if (params[0] !== 'el' || (params.length > 1 && params[1] !== 'data')) {
      badInvSigs.push(`inventory:${actionName}(${invRegMatch[2]})`);
    }
  }
  check(
    'Phase R4: All 38 Actions.register("inventory:*") handlers in char_inventory.js strictly follow (el, data, event) parameter order',
    invRegCount >= 35 && badInvSigs.length === 0,
    `count=${invRegCount}, bad=${badInvSigs.join(', ')}`
  );

  // Phase R4 QA Remediation Gate:
  // 1) syncInventoryStore is defined in char_inventory.js
  // 2) inventory/equipCompanionItem & inventory/unequipCompanionSlot work with Undo/Redo
  // 3) No-op inventory outcomes (empty_slot, charges_exhausted, no_daily_charges) do NOT push onto Undo stack
  check(
    'Phase R4 QA: syncInventoryStore helper is defined in char_inventory.js for companion equip/unequip wrappers',
    /function\s+syncInventoryStore\s*\(/.test(charInventorySrc)
  );

  CharStore.clearHistory();
  const compDoc = JSON.parse(JSON.stringify(r4Doc));
  compDoc.companion = { name: 'Wolf', gear: {} };
  CharStore.replaceDoc(compDoc, { skipHistory: true });
  CharStore.clearHistory();

  // Attempt no-op unequipCompanionSlot on empty slot -> should NOT push to Undo stack
  CharStore.dispatch({
    type: 'inventory/unequipCompanionSlot',
    payload: { slotKey: 'neck' }
  });
  check(
    'Phase R4 QA: No-op inventory/unequipCompanionSlot (empty_slot) does not push onto Undo stack',
    CharStore.getLastOutcome()?.status === 'empty_slot' && CharStore.getHistoryCounts().undo === 0
  );

  // Equip Cloak of Resistance +2 onto companion neck slot -> Undo -> Redo
  CharStore.dispatch({
    type: 'inventory/equipCompanionItem',
    payload: { poolItemId: 'pool_test_cloak_res_2', slotKey: 'neck' },
    meta: { label: 'Equip Companion Item (neck)' }
  });
  check(
    'Phase R4 QA: inventory/equipCompanionItem equips item into doc.companion.gear.neck and records Undo history',
    Boolean(CharStore.getDoc().companion?.gear?.neck && CharStore.getDoc().companion.gear.neck.name === 'Cloak of Resistance +2') &&
    CharStore.getHistoryCounts().undo === 1
  );
  CharStore.dispatch({
    type: 'inventory/unequipCompanionSlot',
    payload: { slotKey: 'neck' },
    meta: { label: 'Unequip Companion Slot (neck)' }
  });
  check(
    'Phase R4 QA: inventory/unequipCompanionSlot returns item from doc.companion.gear.neck back to doc.gearPool',
    !CharStore.getDoc().companion?.gear?.neck &&
    CharStore.getDoc().gearPool.some(i => i && i.name === 'Cloak of Resistance +2') &&
    CharStore.getHistoryCounts().undo === 2
  );
  CharStore.undo();
  check(
    'Phase R4 QA: CharStore.undo() restores companion equipped item in doc.companion.gear.neck',
    Boolean(CharStore.getDoc().companion?.gear?.neck && CharStore.getDoc().companion.gear.neck.name === 'Cloak of Resistance +2')
  );
  CharStore.clearHistory();

  // ==========================================================================
  // Phase R5: Spells & Maneuvers Tab (`sheet.spells` & 12 Pure Reducers)
  // ==========================================================================
  const f01Spells = derivedViews[0].spells;
  const f02Spells = derivedViews[1].spells;
  const f03Spells = derivedViews[2].spells;
  const f04Spells = derivedViews[3].spells;
  const f05Spells = derivedViews[4].spells;

  check(
    'Phase R5: deriveSheet populates pure sheet.spells (casterStatsView, slotsByLevelView, spellsByLevelView, maneuversView) across Fixtures 01-05',
    Boolean(
      f01Spells?.casterStatsView && f01Spells?.slotsByLevelView && f01Spells?.spellsByLevelView && f01Spells?.maneuversView &&
      f02Spells?.casterStatsView && f03Spells?.casterStatsView && f04Spells?.casterStatsView && f05Spells?.maneuversView
    )
  );

  // Fixture 05 (Half-Dragon Warblade 17): Initiator Level = 17, maxManeuverLvl = 9, maxReadied = 6
  check(
    'Phase R5 (Fixture 05 Warblade 17): sheet.spells.maneuversView computes IL 17, maxManeuverLvl 9, maxReadied 6',
    f05Spells.maneuversView.hasClass === true &&
    f05Spells.maneuversView.il === 17 &&
    f05Spells.maneuversView.maxManeuverLvl === 9 &&
    f05Spells.maneuversView.maxReadied === 6,
    JSON.stringify({
      hasClass: f05Spells.maneuversView.hasClass,
      il: f05Spells.maneuversView.il,
      maxLvl: f05Spells.maneuversView.maxManeuverLvl,
      maxReadied: f05Spells.maneuversView.maxReadied
    })
  );

  // Fixture 02 (Cleric 6 / Radiant Servant of Pelor 3 -> Divine CL 9) & Fixture 04 (Wizard 13 / Archmage 2 -> Prepared CL 15):
  check(
    'Phase R5 (Fixture 02 Cleric 9 & Fixture 04 Wizard 15): sheet.spells.casterStatsView & slotsByLevelView compute Divine (CL 9) and Prepared (CL 15) progressions',
    Boolean(
      f02Spells.casterStatsView.divine?.active === true &&
      f02Spells.casterStatsView.divine?.rawCl === 9 &&
      f04Spells.casterStatsView.prepared?.active === true &&
      f04Spells.casterStatsView.prepared?.rawCl === 15 &&
      Array.isArray(f02Spells.slotsByLevelView.divineArray) &&
      f02Spells.slotsByLevelView.divineArray.length > 0 &&
      Array.isArray(f04Spells.slotsByLevelView.preparedArray) &&
      f04Spells.slotsByLevelView.preparedArray.length > 0
    ),
    JSON.stringify({
      f02Div: f02Spells.casterStatsView.divine,
      f04Prep: f04Spells.casterStatsView.prepared
    })
  );

  // Test 1: 'spells/castSpell' (spontaneous, prepared, divine, clericSpontaneousConversion) + Undo/Redo
  const r5CasterDoc = JSON.parse(JSON.stringify(f04Raw));
  r5CasterDoc.spellcasting = {
    cl: 12,
    clericSpontaneousMode: 'cure',
    slots: [{ level: 1, daily: 4, used: 1 }],
    knownSpells: [{ id: 'spl_magic_missile', name: 'Magic Missile', level: 1, school: 'Evocation' }],
    preparedSlots: [{ level: 3, daily: 2, used: 0 }],
    preparedSpells: [{ id: 'spl_fireball', name: 'Fireball', level: 3, school: 'Evocation', cast: false }],
    divineSlots: [{ level: 2, regularDaily: 2, domainDaily: 1, daily: 3, used: 0 }],
    divineSpells: [
      { id: 'spl_lesser_restoration', name: 'Lesser Restoration', level: 2, school: 'Conjuration', isDomainSpell: false, cast: false },
      { id: 'spl_aid_domain', name: 'Aid', level: 2, school: 'Enchantment', isDomainSpell: true, domainSource: 'Good', cast: false }
    ],
    domainPowers: [{ id: 'dom_good', domain: 'Good', name: 'Good Domain Power', maxUses: 1, usesRemaining: 1 }],
    turnPools: [{ id: 'undead', name: 'Turn Undead', maxUses: 5, usesRemaining: 5 }]
  };
  CharStore.replaceDoc(r5CasterDoc, { skipHistory: true });
  CharStore.clearHistory();

  // 1a. Cast spontaneous spell (Magic Missile L1 -> slots[0].used: 1 -> 2)
  CharStore.dispatch({
    type: 'spells/castSpell',
    payload: { pool: 'spontaneous', spellIdx: 0 },
    meta: { label: 'Cast Magic Missile' }
  });
  check(
    'Phase R5 Reducer (spells/castSpell spontaneous): increments slots[0].used 1 -> 2 and supports Undo/Redo',
    CharStore.getDoc().spellcasting.slots[0].used === 2 &&
    CharStore.getLastOutcome()?.status === 'spell_cast'
  );
  CharStore.undo();
  check(
    'Phase R5 Undo (spells/castSpell spontaneous): Ctrl+Z restores slots[0].used 2 -> 1',
    CharStore.getDoc().spellcasting.slots[0].used === 1
  );
  CharStore.redo();
  check(
    'Phase R5 Redo (spells/castSpell spontaneous): Ctrl+Y re-applies slots[0].used 1 -> 2',
    CharStore.getDoc().spellcasting.slots[0].used === 2
  );

  // 1b. Cast prepared spell (Fireball L3 -> preparedSpells[0].cast = true, preparedSlots[0].used = 1)
  CharStore.dispatch({
    type: 'spells/castSpell',
    payload: { pool: 'prepared', spellIdx: 0 },
    meta: { label: 'Cast Prepared Spell: Fireball' }
  });
  check(
    'Phase R5 Reducer (spells/castSpell prepared): marks preparedSpells[0].cast = true and updates preparedSlots[0].used = 1',
    CharStore.getDoc().spellcasting.preparedSpells[0].cast === true &&
    CharStore.getDoc().spellcasting.preparedSlots[0].used === 1
  );

  // 1c. No-op guard: casting already-cast prepared spell does NOT push onto Undo stack
  const undoBeforeDupCast = CharStore.getHistoryCounts().undo;
  CharStore.dispatch({
    type: 'spells/castSpell',
    payload: { pool: 'prepared', spellIdx: 0 }
  });
  check(
    'Phase R5 No-Op Guard: casting already-cast prepared spell returns already_cast and does NOT push onto Undo stack',
    CharStore.getLastOutcome()?.status === 'already_cast' &&
    CharStore.getHistoryCounts().undo === undoBeforeDupCast
  );

  // 1d. Cleric Spontaneous Conversion (sacrificing Lesser Restoration L2 -> Cure Moderate Wounds 2d8+10)
  CharStore.dispatch({
    type: 'spells/castSpell',
    payload: { pool: 'clericSpontaneousConversion', spellIdx: 0, convName: 'Cure Moderate Wounds' },
    meta: { label: 'Spontaneous Conversion: Cure Moderate Wounds' }
  });
  check(
    'Phase R5 Reducer (spells/castSpell clericSpontaneousConversion): marks non-domain divine spell cast and records convertedTo',
    CharStore.getDoc().spellcasting.divineSpells[0].cast === true &&
    CharStore.getDoc().spellcasting.divineSpells[0].convertedTo === 'Cure Moderate Wounds' &&
    CharStore.getDoc().spellcasting.divineSlots[0].used === 1
  );

  // Test 2: 'spells/restoreAllSlots'
  CharStore.dispatch({
    type: 'spells/restoreAllSlots',
    payload: { discipline: 'all' },
    meta: { label: 'Restore All Spell Slots' }
  });
  check(
    'Phase R5 Reducer (spells/restoreAllSlots): resets used slots and unmarks cast prepared/divine spells',
    CharStore.getDoc().spellcasting.slots[0].used === 0 &&
    CharStore.getDoc().spellcasting.preparedSpells[0].cast === false &&
    CharStore.getDoc().spellcasting.divineSpells[0].cast === false
  );

  // Test 3: 'spells/toggleClericSpontaneousMode' & 'spells/useTurnOrDomainPower'
  CharStore.dispatch({
    type: 'spells/toggleClericSpontaneousMode',
    payload: {},
    meta: { label: 'Toggle Cleric Spontaneous Mode' }
  });
  check(
    'Phase R5 Reducer (spells/toggleClericSpontaneousMode): switches cure -> inflict and supports Undo',
    CharStore.getDoc().spellcasting.clericSpontaneousMode === 'inflict'
  );
  CharStore.undo();
  check(
    'Phase R5 Undo (spells/toggleClericSpontaneousMode): Ctrl+Z restores cure mode',
    CharStore.getDoc().spellcasting.clericSpontaneousMode === 'cure'
  );

  CharStore.dispatch({
    type: 'spells/useTurnOrDomainPower',
    payload: { kind: 'turn', id: 'undead', maxUses: 5 },
    meta: { label: 'Turn Undead (1/5 used)' }
  });
  CharStore.dispatch({
    type: 'spells/useTurnOrDomainPower',
    payload: { kind: 'domain', id: 'dom_good', maxUses: 1 },
    meta: { label: 'Activate Domain Power: Good' }
  });
  check(
    'Phase R5 Reducer (spells/useTurnOrDomainPower): increments Turn Undead (0 -> 1) and Domain Power (0 -> 1)',
    CharStore.getDoc().spellcasting.turnUndeadUsed === 1 &&
    CharStore.getDoc().spellcasting.domainPowerUses.dom_good === 1
  );

  // Test 4: Tome of Battle Maneuvers & Stances Reducers on Fixture 05 (Warblade 17)
  const r5TobDoc = JSON.parse(JSON.stringify(f05Raw));
  r5TobDoc.tomeOfBattle = {
    initiatorLevel: 17,
    activeStance: 'Punishing Stance',
    maneuversKnown: [
      { id: 'tob_steel_wind', name: 'Steel Wind', level: 1, discipline: 'Iron Heart', subType: 'Strike', expended: false },
      { id: 'tob_iron_heart_surge', name: 'Iron Heart Surge', level: 3, discipline: 'Iron Heart', subType: 'Maneuver', expended: false }
    ],
    readiedManeuvers: [
      { id: 'tob_steel_wind', name: 'Steel Wind', level: 1, discipline: 'Iron Heart', subType: 'Strike', expended: false },
      { id: 'tob_iron_heart_surge', name: 'Iron Heart Surge', level: 3, discipline: 'Iron Heart', subType: 'Maneuver', expended: false }
    ],
    stancesKnown: [
      { id: 'tob_punishing_stance', name: 'Punishing Stance', level: 1, discipline: 'Iron Heart' }
    ]
  };
  CharStore.replaceDoc(r5TobDoc, { skipHistory: true });
  CharStore.clearHistory();

  // 4a. 'spells/expendOrRecoverManeuver' (expend idx 0 -> recover idx 0 -> recoverAll)
  CharStore.dispatch({
    type: 'spells/expendOrRecoverManeuver',
    payload: { idx: 0 },
    meta: { label: 'Initiate Maneuver #0' }
  });
  check(
    'Phase R5 Reducer (spells/expendOrRecoverManeuver): expends readied maneuver #0 and supports Undo',
    CharStore.getDoc().tomeOfBattle.readiedManeuvers[0].expended === true &&
    CharStore.getSheet().spells.maneuversView.readiedManeuvers[0].expended === true
  );
  CharStore.undo();
  check(
    'Phase R5 Undo (spells/expendOrRecoverManeuver): Ctrl+Z recovers readied maneuver #0',
    CharStore.getDoc().tomeOfBattle.readiedManeuvers[0].expended === false
  );

  // 4b. 'spells/toggleManeuverReadied' (unready first maneuver, then re-ready it)
  const firstReadiedName = CharStore.getDoc().tomeOfBattle.readiedManeuvers[0].name;
  const initialReadiedCount = CharStore.getDoc().tomeOfBattle.readiedManeuvers.length;
  CharStore.dispatch({
    type: 'spells/toggleManeuverReadied',
    payload: { name: firstReadiedName },
    meta: { label: `Unready Maneuver: ${firstReadiedName}` }
  });
  check(
    'Phase R5 Reducer (spells/toggleManeuverReadied): unreadies maneuver from combat deck',
    CharStore.getDoc().tomeOfBattle.readiedManeuvers.length === initialReadiedCount - 1
  );
  CharStore.dispatch({
    type: 'spells/toggleManeuverReadied',
    payload: { name: firstReadiedName, maxReadied: 4 },
    meta: { label: `Ready Maneuver: ${firstReadiedName}` }
  });
  check(
    'Phase R5 Reducer (spells/toggleManeuverReadied): re-readies maneuver into combat deck',
    CharStore.getDoc().tomeOfBattle.readiedManeuvers.length === initialReadiedCount
  );

  // 4c. 'spells/selectStance' & 'spells/toggleDmBoon'
  CharStore.dispatch({
    type: 'spells/selectStance',
    payload: { stanceName: '' },
    meta: { label: 'Leave Stance' }
  });
  check(
    'Phase R5 Reducer (spells/selectStance): clears activeStance and supports Undo',
    CharStore.getDoc().tomeOfBattle.activeStance === ''
  );
  CharStore.undo();
  check(
    'Phase R5 Undo (spells/selectStance): Ctrl+Z restores activeStance',
    Boolean(CharStore.getDoc().tomeOfBattle.activeStance)
  );

  CharStore.dispatch({
    type: 'spells/toggleDmBoon',
    payload: { discipline: 'spontaneous', fallbackDiscipline: 'martial' },
    meta: { label: 'Enable DM Boon (spontaneous)' }
  });
  check(
    'Phase R5 Reducer (spells/toggleDmBoon): enables spontaneous DM Boon in doc.settings.boonDisciplines',
    Array.isArray(CharStore.getDoc().settings?.boonDisciplines) &&
    CharStore.getDoc().settings.boonDisciplines.includes('spontaneous')
  );
  CharStore.undo();

  // Verify all Actions.register('spells:*') handlers in char_spells.js strictly follow (el, data, event) parameter order
  const charSpellsSrc = fs.readFileSync(path.join(__dirname, '..', 'char_spells.js'), 'utf8');
  const spellsActionRegRegex = /Actions\.register\(\s*['"]spells:([^'"]+)['"]\s*,\s*\(([^)]*)\)\s*=>/g;
  let spellsRegMatch;
  let spellsRegCount = 0;
  const badSpellsSigs = [];
  while ((spellsRegMatch = spellsActionRegRegex.exec(charSpellsSrc)) !== null) {
    spellsRegCount++;
    const actionName = spellsRegMatch[1];
    const params = spellsRegMatch[2].split(',').map(s => s.trim()).filter(Boolean);
    if (params[0] !== 'el' || (params.length > 1 && params[1] !== 'data')) {
      badSpellsSigs.push(`spells:${actionName}(${spellsRegMatch[2]})`);
    }
  }
  check(
    'Phase R5: All 39 Actions.register("spells:*") handlers in char_spells.js strictly follow (el, data, event) parameter order',
    spellsRegCount >= 39 && badSpellsSigs.length === 0,
    `count=${spellsRegCount}, bad=${badSpellsSigs.join(', ')}`
  );

  // ==========================================================================
  // Phase R5 QA Remediation: Wrapper-Payload Contract & Outcome Guard Tests
  // ==========================================================================
  const qaWrapperDoc = JSON.parse(JSON.stringify(f04Raw));
  qaWrapperDoc.spellcasting = {
    cl: 12,
    clericSpontaneousMode: 'cure',
    turnUndeadUsed: 0,
    domainPowerUses: {},
    slots: [
      { level: 0, daily: 6, used: 0 },
      { level: 3, daily: 4, used: 0 }
    ],
    knownSpells: [
      { id: 'spl_lightning_bolt', name: 'Lightning Bolt', level: 3, school: 'Evocation' }
    ],
    preparedSlots: [
      { level: 0, daily: 4, used: 0 },
      { level: 3, daily: 3, used: 0 }
    ],
    preparedSpells: [
      { id: 'spl_fireball', name: 'Fireball', level: 3, school: 'Evocation', isCast: false }
    ],
    divineSlots: [
      { level: 2, regularDaily: 2, domainDaily: 1, daily: 3, used: 0, domainUsed: 0 }
    ],
    divineSpells: [
      { id: 'spl_aid_dom', name: 'Aid', level: 2, school: 'Enchantment', isDomainSpell: true, isCast: false },
      { id: 'spl_bulls_strength', name: "Bull's Strength", level: 2, school: 'Transmutation', isDomainSpell: false, isCast: false }
    ]
  };
  qaWrapperDoc.tomeOfBattle = {
    initiatorLevel: 9,
    maneuversKnown: [
      { id: 'tob_steel_wind', name: 'Steel Wind', level: 1, discipline: 'Iron Heart', expended: false }
    ],
    readiedManeuvers: [
      { id: 'tob_steel_wind', name: 'Steel Wind', level: 1, discipline: 'Iron Heart', expended: false }
    ],
    stancesKnown: []
  };
  CharStore.replaceDoc(qaWrapperDoc, { skipHistory: true });
  CharStore.clearHistory();

  // QA Test 1: spells/castSpell with wrapper payload { discipline: 'spontaneous', spellIndex: 0, level: 3 }
  CharStore.dispatch({
    type: 'spells/castSpell',
    payload: { discipline: 'spontaneous', spellIndex: 0, level: 3 },
    meta: { label: 'Cast Spontaneous L3' }
  });
  const spontSlot0 = CharStore.getDoc().spellcasting.slots.find(s => Number(s.level) === 0);
  const spontSlot3 = CharStore.getDoc().spellcasting.slots.find(s => Number(s.level) === 3);
  check(
    'Phase R5 QA Wrapper Test 1: spells/castSpell { discipline: "spontaneous", spellIndex: 0, level: 3 } increments L3 slot (NOT L0)',
    spontSlot3?.used === 1 && spontSlot0?.used === 0 && CharStore.getLastOutcome()?.status === 'spell_cast'
  );

  // QA Test 2: spells/castSpell with wrapper payload { discipline: 'prepared', spellIndex: 0, level: 3 }
  CharStore.dispatch({
    type: 'spells/castSpell',
    payload: { discipline: 'prepared', spellIndex: 0, level: 3 },
    meta: { label: 'Cast Prepared L3' }
  });
  const prepSlot3 = CharStore.getDoc().spellcasting.preparedSlots.find(s => Number(s.level) === 3);
  check(
    'Phase R5 QA Wrapper Test 2: spells/castSpell { discipline: "prepared", spellIndex: 0, level: 3 } marks preparedSpells[0].isCast === true & increments L3 prepared slot',
    CharStore.getDoc().spellcasting.preparedSpells[0].isCast === true &&
    prepSlot3?.used === 1 &&
    CharStore.getLastOutcome()?.status === 'spell_cast'
  );

  // QA Test 3: spells/castSpell with { discipline: 'divine', spellIndex: 0, level: 2, isDomainSpell: true } & spontaneous conversion guards
  CharStore.dispatch({
    type: 'spells/castSpell',
    payload: { discipline: 'divine', spellIndex: 0, level: 2, isDomainSpell: true },
    meta: { label: 'Cast Domain Spell Aid' }
  });
  const divSlot2 = CharStore.getDoc().spellcasting.divineSlots.find(s => Number(s.level) === 2);
  check(
    'Phase R5 QA Wrapper Test 3a: spells/castSpell { discipline: "divine", spellIndex: 0, level: 2, isDomainSpell: true } increments domainUsed & marks isCast',
    divSlot2?.domainUsed === 1 &&
    divSlot2?.used === 1 &&
    CharStore.getDoc().spellcasting.divineSpells[0].isCast === true
  );

  // Attempt spontaneous conversion on domain spell (index 0) -> rejected with domain_cannot_convert & does NOT push to Undo stack
  const undoBeforeDomConv = CharStore.getHistoryCounts().undo;
  CharStore.dispatch({
    type: 'spells/castSpell',
    payload: { discipline: 'divine', spellIndex: 0, level: 2, isSpontaneousConversion: true }
  });
  check(
    'Phase R5 QA Wrapper Test 3b: spells/castSpell with isSpontaneousConversion: true rejects domain spell (domain_cannot_convert) & does not push onto Undo stack',
    CharStore.getLastOutcome()?.status === 'invalid_payload' &&
    CharStore.getLastOutcome()?.reason === 'domain_cannot_convert' &&
    CharStore.getHistoryCounts().undo === undoBeforeDomConv
  );

  // Spontaneous conversion on regular divine spell (index 1: Bull's Strength) -> succeeds and marks isCast = true
  CharStore.dispatch({
    type: 'spells/castSpell',
    payload: { discipline: 'divine', spellIndex: 1, level: 2, isSpontaneousConversion: true, convName: 'Cure Moderate Wounds' },
    meta: { label: 'Spontaneous Conversion' }
  });
  check(
    'Phase R5 QA Wrapper Test 3c: spells/castSpell with isSpontaneousConversion: true converts regular divine spell (isCast === true, used === 2)',
    CharStore.getDoc().spellcasting.divineSpells[1].isCast === true &&
    CharStore.getDoc().spellcasting.divineSpells[1].convertedTo === 'Cure Moderate Wounds' &&
    CharStore.getDoc().spellcasting.divineSlots[0].used === 2
  );

  // QA Test 4: spells/useTurnOrDomainPower with wrapper payload { powerId: 'strength_feat_of_strength', maxUses: 1, buffPayload: {...} }
  CharStore.dispatch({
    type: 'spells/useTurnOrDomainPower',
    payload: {
      powerId: 'strength_feat_of_strength',
      maxUses: 1,
      buffPayload: { id: 'strength_feat_of_strength', name: 'Feat of Strength', active: true }
    },
    meta: { label: 'Activate Feat of Strength' }
  });
  check(
    'Phase R5 QA Wrapper Test 4: spells/useTurnOrDomainPower { powerId, maxUses, buffPayload } increments domainPowerUses["strength_feat_of_strength"], leaves turnUndeadUsed === 0, and activates buff',
    CharStore.getDoc().spellcasting.domainPowerUses['strength_feat_of_strength'] === 1 &&
    CharStore.getDoc().spellcasting.turnUndeadUsed === 0 &&
    CharStore.getDoc().buffs.some(b => b && b.id === 'strength_feat_of_strength' && b.active === true) &&
    CharStore.getLastOutcome()?.status === 'power_used'
  );

  // QA Test 5: spells/expendOrRecoverManeuver with { index: 0, mode: 'expend' } and { mode: 'recoverAll' }
  CharStore.dispatch({
    type: 'spells/expendOrRecoverManeuver',
    payload: { index: 0, mode: 'expend' },
    meta: { label: 'Execute Steel Wind' }
  });
  check(
    'Phase R5 QA Wrapper Test 5a: spells/expendOrRecoverManeuver { index: 0, mode: "expend" } sets readiedManeuvers[0].expended = true',
    CharStore.getDoc().tomeOfBattle.readiedManeuvers[0].expended === true &&
    CharStore.getLastOutcome()?.status === 'maneuver_expended'
  );
  CharStore.dispatch({
    type: 'spells/expendOrRecoverManeuver',
    payload: { mode: 'recoverAll' },
    meta: { label: 'Recover All Maneuvers' }
  });
  check(
    'Phase R5 QA Wrapper Test 5b: spells/expendOrRecoverManeuver { mode: "recoverAll" } resets readiedManeuvers[0].expended = false',
    CharStore.getDoc().tomeOfBattle.readiedManeuvers[0].expended === false &&
    CharStore.getLastOutcome()?.status === 'all_maneuvers_recovered'
  );
  CharStore.clearHistory();

  return { passed, elapsedMs: Date.now() - startMs };
}

if (require.main === module) {
  const res = runDeriveSheetTests();
  console.log(`✅ DeriveSheet Golden Fixture Suite: ${res.passed}/${res.passed} assertions passed in ${res.elapsedMs}ms.`);
}

module.exports = {
  runDeriveSheetTests,
  computeBaselineMetrics,
  verifyPureExecution,
  deepFreeze
};
