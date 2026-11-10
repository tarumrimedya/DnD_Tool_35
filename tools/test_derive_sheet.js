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
const vm = require('vm');

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

  // ==========================================================================
  // PHASE R6: Pure sheet.progression View-Models, Progression & HUD Reducers,
  //           Play/Build/Both Mode Toggle, Pre-Cast Spell Store Wiring,
  //           and Static (el, data, event) Signature Audit
  // ==========================================================================
  allFixtures.forEach(rawFix => {
    const rawClone = JSON.parse(JSON.stringify(rawFix));
    deepFreeze(rawClone);
    const derived = RuleEngine.deriveSheet(rawClone, rawClone.customDb || []);
    const prog = derived.progression;
    check(
      `Phase R6 [${rawFix.name}]: sheet.progression exposes pure levelsView, featSlotsView, skillBudgetsView, and featuresView with 0 input mutation`,
      Boolean(
        prog &&
        Array.isArray(prog.levelsView) &&
        prog.featSlotsView &&
        typeof prog.featSlotsView.maxStandardFeats === 'number' &&
        prog.skillBudgetsView &&
        typeof prog.skillBudgetsView.totalBudget === 'number' &&
        typeof prog.skillBudgetsView.maxClassRank === 'number' &&
        prog.featuresView &&
        Array.isArray(prog.featuresView.featsList) &&
        Array.isArray(prog.featuresView.abilitiesList)
      )
    );
  });

  // Phase R6 Reducer & Undo/Redo Suite
  const r6Doc = {
    name: 'R6 Test Hero',
    race: 'Human',
    classes: 'Fighter 4',
    level: 4,
    uiMode: 'both',
    baseAbilities: { str: 16, dex: 14, con: 14, int: 12, wis: 10, cha: 8 },
    abilities: { str: 16, dex: 14, con: 14, int: 12, wis: 10, cha: 8 },
    hp: { current: 36, max: 40, baseMax: 32, conBonusHp: 8, temp: 5, nonlethal: 0 },
    levelProgression: [
      { level: 1, className: 'Fighter', hd: 'd10', hpGain: 10, skillPts: 16, feats: ['🎖️ Power Attack', '🧬 [Racial] Cleave', '⚔️ [Bonus] Weapon Focus (Longsword)'], specialAbilities: [], active: true },
      { level: 2, className: 'Fighter', hd: 'd10', hpGain: 8, skillPts: 4, feats: ['⚔️ [Bonus] Improved Initiative'], specialAbilities: [], active: true },
      { level: 3, className: 'Fighter', hd: 'd10', hpGain: 7, skillPts: 4, feats: ['🎖️ Iron Will'], specialAbilities: [], active: true },
      { level: 4, className: 'Fighter', hd: 'd10', hpGain: 7, skillPts: 4, feats: [], specialAbilities: [], statIncreased: null, active: true }
    ],
    skills: [
      { key: 'jump', name: 'Jump', stat: 'str', ranks: 4, isClass: true },
      { key: 'tumble', name: 'Tumble', stat: 'dex', ranks: 2, isClass: false }
    ],
    feats: [
      { name: 'Power Attack', category: 'Regular Feat' },
      { name: 'Cleave', category: 'Racial Trait' },
      { name: 'Weapon Focus (Longsword)', category: 'Class Bonus Feat' },
      { name: 'Improved Initiative', category: 'Class Bonus Feat' },
      { name: 'Iron Will', category: 'Regular Feat' }
    ],
    specialAbilities: [],
    spellcasting: {
      cl: 4,
      slots: [{ level: 1, total: 3, used: 1 }],
      knownSpells: [{ name: 'Shield', level: 1, castsUsed: 1 }],
      preparedSlots: [],
      preparedSpells: [],
      divineSlots: [],
      divineSpells: [],
      turnUndeadUsed: 1,
      domainPowerUses: {}
    },
    tomeOfBattle: {
      readiedManeuvers: [{ name: 'Steel Wind', level: 1, expended: true }]
    },
    buffs: [
      { id: 'buff_haste', name: 'Haste', durationType: 'rounds', durationLeft: 3, active: true }
    ],
    customDb: []
  };
  CharStore.replaceDoc(r6Doc);
  CharStore.clearHistory();

  // 1. ui/setMode ('play' -> 'build' -> 'both')
  CharStore.dispatch({ type: 'ui/setMode', payload: { mode: 'play' }, meta: { label: 'Mode: Play' } });
  check(
    'Phase R6: ui/setMode sets CharStore.getMode() and doc.uiMode to "play"',
    CharStore.getMode() === 'play' && CharStore.getDoc().uiMode === 'play' && CharStore.getDoc().settings?.sheetViewMode === 'play'
  );
  CharStore.dispatch({ type: 'ui/setMode', payload: { mode: 'build' }, meta: { label: 'Mode: Build' } });
  check(
    'Phase R6: ui/setMode sets CharStore.getMode() and doc.uiMode to "build"',
    CharStore.getMode() === 'build' && CharStore.getDoc().uiMode === 'build'
  );
  CharStore.undo();
  check(
    'Phase R6: CharStore.undo() restores uiMode === "play"',
    CharStore.getMode() === 'play' && CharStore.getDoc().uiMode === 'play'
  );
  CharStore.redo();
  check(
    'Phase R6: CharStore.redo() re-applies uiMode === "build"',
    CharStore.getMode() === 'build' && CharStore.getDoc().uiMode === 'build'
  );

  // 2. progression/adjustAbility & progression/updateLevelRow (setStatIncrease)
  CharStore.dispatch({ type: 'progression/adjustAbility', payload: { abilityKey: 'str', delta: 2 }, meta: { label: '+2 Base STR' } });
  check(
    'Phase R6: progression/adjustAbility increments baseAbilities.str from 16 -> 18',
    CharStore.getDoc().baseAbilities.str === 18
  );
  CharStore.dispatch({
    type: 'progression/updateLevelRow',
    payload: { mode: 'setStatIncrease', levelIndex: 3, statKey: 'str', statLabel: 'STR' },
    meta: { label: 'Lv.4 +1 STR' }
  });
  check(
    'Phase R6: progression/updateLevelRow (setStatIncrease) sets level 4 statIncreased="str" and increments baseAbilities.str 18 -> 19',
    CharStore.getDoc().levelProgression[3].statIncreased === 'str' &&
    CharStore.getDoc().baseAbilities.str === 19 &&
    CharStore.getSheet().progression.levelsView[3].statIncreaseKey === 'str'
  );

  // 3. progression/adjustSkillRank & progression/toggleSkillClass
  CharStore.dispatch({
    type: 'progression/adjustSkillRank',
    payload: { skillKey: 'jump', delta: 2 },
    meta: { label: '+2 Jump Ranks' }
  });
  check(
    'Phase R6: progression/adjustSkillRank increments Jump ranks 4 -> 6 and updates skillBudgetsView.spentPoints',
    CharStore.getDoc().skills.find(s => s.key === 'jump').ranks === 6 &&
    CharStore.getSheet().progression.skillBudgetsView.spentPoints === 10
  );
  // Attempt to exceed maxClassRank (level 4 + 3 = 7)
  CharStore.dispatch({
    type: 'progression/adjustSkillRank',
    payload: { skillKey: 'jump', delta: 2 },
    meta: { label: 'Exceed Max Rank Cap' }
  });
  check(
    'Phase R6: progression/adjustSkillRank blocks rank increase above maxClassRank (7 at level 4)',
    CharStore.getDoc().skills.find(s => s.key === 'jump').ranks === 6 &&
    CharStore.getLastOutcome()?.status === 'max_rank_cap'
  );
  CharStore.dispatch({
    type: 'progression/toggleSkillClass',
    payload: { skillKey: 'tumble' },
    meta: { label: 'Toggle Tumble Class Skill' }
  });
  check(
    'Phase R6: progression/toggleSkillClass toggles Tumble isClass false -> true',
    CharStore.getDoc().skills.find(s => s.key === 'tumble').isClass === true
  );

  // 4. progression/addFeat & progression/removeFeat
  CharStore.dispatch({
    type: 'progression/addFeat',
    payload: {
      levelIndex: 3,
      category: 'Class Bonus Feat',
      featName: 'Weapon Specialization (Longsword)',
      featString: '⚔️ [Bonus] Weapon Specialization (Longsword)',
      featObj: { name: 'Weapon Specialization (Longsword)', category: 'Class Bonus Feat', benefit: '+2 damage with Longsword' }
    },
    meta: { label: 'Add Weapon Specialization' }
  });
  check(
    'Phase R6: progression/addFeat adds Weapon Specialization (Longsword) to level 4 and doc.feats',
    CharStore.getDoc().levelProgression[3].feats.includes('⚔️ [Bonus] Weapon Specialization (Longsword)') &&
    CharStore.getDoc().feats.some(f => f.name === 'Weapon Specialization (Longsword)') &&
    CharStore.getSheet().progression.featuresView.featCount === 6
  );
  CharStore.dispatch({
    type: 'progression/removeFeat',
    payload: { featName: 'Weapon Specialization (Longsword)', levelIndex: 3 },
    meta: { label: 'Remove Weapon Specialization' }
  });
  check(
    'Phase R6: progression/removeFeat removes Weapon Specialization (Longsword) from level 4 and doc.feats',
    !CharStore.getDoc().levelProgression[3].feats.some(f => f.includes('Weapon Specialization')) &&
    !CharStore.getDoc().feats.some(f => f.name === 'Weapon Specialization (Longsword)') &&
    CharStore.getSheet().progression.featuresView.featCount === 5
  );

  // 5. progression/updateLevelRow ('add', 'toggleActive', 'setHp', 'remove')
  CharStore.dispatch({
    type: 'progression/updateLevelRow',
    payload: { mode: 'add', className: 'Fighter', hd: 'd10', hpGain: 6, bab: 5, fort: 4, ref: 1, will: 1, skillPts: 4, active: false },
    meta: { label: 'Add Planned Level 5' }
  });
  check(
    'Phase R6: progression/updateLevelRow (add) appends planned Level 5 row',
    CharStore.getDoc().levelProgression.length === 5 &&
    CharStore.getDoc().levelProgression[4].active === false &&
    CharStore.getSheet().progression.plannedLevelsCount === 5 &&
    CharStore.getSheet().progression.activeLevelsCount === 4
  );
  CharStore.dispatch({
    type: 'progression/updateLevelRow',
    payload: { mode: 'toggleActive', levelIndex: 4 },
    meta: { label: 'Activate Level 5' }
  });
  check(
    'Phase R6: progression/updateLevelRow (toggleActive) activates Level 5',
    CharStore.getDoc().levelProgression[4].active === true &&
    CharStore.getSheet().progression.activeLevelsCount === 5
  );
  CharStore.dispatch({
    type: 'progression/updateLevelRow',
    payload: { mode: 'setHp', levelIndex: 4, hpGain: 9 },
    meta: { label: 'Set Level 5 HP to 9' }
  });
  check(
    'Phase R6: progression/updateLevelRow (setHp) updates Level 5 hpGain 6 -> 9',
    CharStore.getDoc().levelProgression[4].hpGain === 9
  );
  CharStore.dispatch({
    type: 'progression/updateLevelRow',
    payload: { mode: 'remove', levelIndex: 4 },
    meta: { label: 'Remove Level 5' }
  });
  check(
    'Phase R6: progression/updateLevelRow (remove) deletes Level 5',
    CharStore.getDoc().levelProgression.length === 4
  );

  // 6. hud/adjustHp (Temp HP absorption first on damage!) & Undo/Redo
  const hpBeforeDmg = CharStore.getDoc().hp.current; // 36, temp: 5
  CharStore.dispatch({
    type: 'hud/adjustHp',
    payload: { mode: 'damage', amount: 8 },
    meta: { label: 'Take 8 Damage' }
  });
  check(
    'Phase R6: hud/adjustHp (damage: 8) absorbs 5 Temp HP first (temp: 5 -> 0) and reduces current HP by remaining 3 (36 -> 33)',
    CharStore.getDoc().hp.temp === 0 &&
    CharStore.getDoc().hp.current === hpBeforeDmg - 3 &&
    CharStore.getLastOutcome()?.tempAbsorbed === 5 &&
    CharStore.getLastOutcome()?.hpLost === 3
  );
  CharStore.undo();
  check(
    'Phase R6: CharStore.undo() after hud/adjustHp restores Temp HP (5) and current HP (36)',
    CharStore.getDoc().hp.temp === 5 &&
    CharStore.getDoc().hp.current === hpBeforeDmg
  );
  CharStore.redo();
  check(
    'Phase R6: CharStore.redo() re-applies 8 damage (temp === 0, current === 33)',
    CharStore.getDoc().hp.temp === 0 &&
    CharStore.getDoc().hp.current === hpBeforeDmg - 3
  );

  // 7. Pre-Cast Spell selfHpCost via spells/castSpell & atomic consumeTurnUndead via spells/useTurnOrDomainPower
  CharStore.dispatch({
    type: 'hud/adjustHp',
    payload: { mode: 'temp', amount: 3 },
    meta: { label: 'Grant +3 Temp HP' }
  });
  CharStore.dispatch({
    type: 'spells/castSpell',
    payload: { discipline: 'spontaneous', spellIndex: 0, level: 1, selfHpCost: 5 },
    meta: { label: 'Cast Shield (Blood Sacrifice -5 HP)' }
  });
  check(
    'Phase R6: spells/castSpell with selfHpCost: 5 deducts 3 Temp HP first and 2 current HP atomically while spending spell slot',
    CharStore.getDoc().hp.temp === 0 &&
    CharStore.getDoc().hp.current === hpBeforeDmg - 5 &&
    CharStore.getDoc().spellcasting.slots[0].used === 2 &&
    CharStore.getLastOutcome()?.selfHpCost === 5
  );
  CharStore.dispatch({
    type: 'spells/useTurnOrDomainPower',
    payload: {
      powerId: 'sun_greater_turning',
      maxUses: 1,
      consumeTurnUndead: true,
      maxTurnUses: 5
    },
    meta: { label: 'Sun Domain: Greater Turning' }
  });
  check(
    'Phase R6: spells/useTurnOrDomainPower with consumeTurnUndead: true atomically increments domainPowerUses["sun_greater_turning"] AND turnUndeadUsed (1 -> 2)',
    CharStore.getDoc().spellcasting.domainPowerUses['sun_greater_turning'] === 1 &&
    CharStore.getDoc().spellcasting.turnUndeadUsed === 2
  );

  // 8. hud/shortRest & hud/longRest with Undo/Redo
  CharStore.dispatch({
    type: 'hud/shortRest',
    payload: { minutes: 5 },
    meta: { label: 'Short Rest (5m)' }
  });
  check(
    'Phase R6: hud/shortRest recovers expended Tome of Battle maneuvers and expires round-based buffs',
    CharStore.getDoc().tomeOfBattle.readiedManeuvers[0].expended === false &&
    CharStore.getDoc().buffs.find(b => b.id === 'buff_haste').active === false
  );
  CharStore.dispatch({
    type: 'hud/longRest',
    payload: { isFullHeal: true },
    meta: { label: 'Long Rest' }
  });
  check(
    'Phase R6: hud/longRest restores full HP, resets spell slots (used === 0), and resets turnUndeadUsed & domainPowerUses',
    CharStore.getDoc().hp.current === CharStore.getDoc().hp.max &&
    CharStore.getDoc().spellcasting.slots[0].used === 0 &&
    CharStore.getDoc().spellcasting.turnUndeadUsed === 0 &&
    Object.keys(CharStore.getDoc().spellcasting.domainPowerUses).length === 0
  );
  CharStore.undo();
  check(
    'Phase R6: CharStore.undo() after hud/longRest restores pre-rest HP and spent spell slots (used === 2)',
    CharStore.getDoc().hp.current === hpBeforeDmg - 5 &&
    CharStore.getDoc().spellcasting.slots[0].used === 2 &&
    CharStore.getDoc().spellcasting.turnUndeadUsed === 2
  );

  // 9. Static Audit: Every Actions.register('hud:*' | 'progression:*') handler strictly declares (el, data, event)
  const hudSrc = fs.readFileSync(path.join(__dirname, '..', 'char_hud.js'), 'utf8');
  const progSrc = fs.readFileSync(path.join(__dirname, '..', 'char_progression.js'), 'utf8');
  const hudRegMatches = [...hudSrc.matchAll(/Actions\.register\(\s*['"](hud:[^'"]+)['"]\s*,\s*(?:async\s*)?\(\s*([^)]*)\)/g)];
  const progRegMatches = [...progSrc.matchAll(/Actions\.register\(\s*['"](progression:[^'"]+)['"]\s*,\s*(?:async\s*)?\(\s*([^)]*)\)/g)];
  const badHudSigs = hudRegMatches.filter(m => m[2].replace(/\s+/g, '') !== 'el,data,event');
  const badProgSigs = progRegMatches.filter(m => m[2].replace(/\s+/g, '') !== 'el,data,event');
  check(
    `Phase R6 Static Gate: All ${hudRegMatches.length} hud:* and ${progRegMatches.length} progression:* Actions.register handlers strictly declare (el, data, event)`,
    hudRegMatches.length >= 25 && progRegMatches.length >= 50 && badHudSigs.length === 0 && badProgSigs.length === 0,
    JSON.stringify({ badHud: badHudSigs.map(m => m[1]), badProg: badProgSigs.map(m => m[1]) })
  );

  // 10. Phase R6 QA Remediation:
  // A. hud/longRest { isFullHeal: false } (8h Natural Healing +1 HP / level per PHB p.146) vs { isFullHeal: true }
  const r6ClericDoc = JSON.parse(JSON.stringify(allFixtures[0]));
  r6ClericDoc.level = 9;
  r6ClericDoc.levelProgression = Array.from({ length: 9 }, (_, i) => ({
    level: i + 1,
    className: 'Cleric',
    hd: 'd8',
    hpGain: 6,
    active: true
  }));
  r6ClericDoc.hp = { current: 20, max: 68, baseMax: 50, conBonusHp: 18, temp: 4, nonlethal: 6 };
  r6ClericDoc.spellcasting = {
    divineSlots: [{ level: 1, total: 4, used: 3, domainTotal: 1, domainUsed: 1 }],
    turnUndeadUsed: 2,
    domainPowerUses: { strength_feat_of_strength: 1 }
  };
  CharStore.replaceDoc(r6ClericDoc, { skipHistory: true });
  const clericMaxHp = CharStore.getDoc().hp.max;
  CharStore.dispatch({
    type: 'doc/mutate',
    payload: function (d) { d.hp.current = 20; d.hp.temp = 4; d.hp.nonlethal = 6; },
    meta: { skipHistory: true }
  });
  CharStore.clearHistory();
  CharStore.dispatch({
    type: 'hud/longRest',
    payload: { isFullHeal: false },
    meta: { label: '8h Natural Healing Rest' }
  });
  const naturalRestOut = CharStore.getLastOutcome();
  check(
    'Phase R6 QA: hud/longRest with { isFullHeal: false } on Level 9 Cleric at 20 HP heals +9 HP (29 HP, 1 HP/lvl per PHB p.146) and reports out.hpGain === 9 & out.refreshedSpells === 4',
    CharStore.getDoc().hp.current === 29 &&
    CharStore.getDoc().hp.temp === 0 &&
    CharStore.getDoc().hp.nonlethal === 0 &&
    naturalRestOut?.isFullHeal === false &&
    naturalRestOut?.hpGain === 9 &&
    naturalRestOut?.currentHp === 29 &&
    naturalRestOut?.refreshedSpells === 4
  );
  CharStore.dispatch({
    type: 'hud/longRest',
    payload: { isFullHeal: true },
    meta: { label: 'Full Long Rest' }
  });
  const fullRestOut = CharStore.getLastOutcome();
  check(
    'Phase R6 QA: hud/longRest with { isFullHeal: true } heals remaining HP to full maxHp',
    CharStore.getDoc().hp.current === clericMaxHp &&
    fullRestOut?.isFullHeal === true &&
    fullRestOut?.hpGain === (clericMaxHp - 29)
  );

  // B. Single-Undo-Step Greater Turning & exhausted_daily guard when turnUndeadUsed >= maxTurnUses
  CharStore.clearHistory();
  const undoBeforeGreaterTurn = CharStore.getHistoryCounts().undo;
  CharStore.dispatch({
    type: 'spells/useTurnOrDomainPower',
    payload: {
      kind: 'domain',
      id: 'sun_greater_turning',
      powerId: 'sun_greater_turning',
      maxUses: 1,
      consumeTurnUndead: true,
      maxTurnUses: 2
    },
    meta: { label: 'Use Greater Turning (Sun Domain)' }
  });
  check(
    'Phase R6 QA: Greater Turning single dispatch increments both domainPowerUses["sun_greater_turning"] and turnUndeadUsed in exactly 1 Undo step',
    CharStore.getDoc().spellcasting.domainPowerUses['sun_greater_turning'] === 1 &&
    CharStore.getDoc().spellcasting.turnUndeadUsed === 1 &&
    CharStore.getHistoryCounts().undo === undoBeforeGreaterTurn + 1
  );
  // Set turnUndeadUsed = 2 (at maxTurnUses = 2) and reset domainPowerUses to test exhausted_daily guard
  CharStore.dispatch({
    type: 'doc/mutate',
    payload: function (d) {
      d.spellcasting.turnUndeadUsed = 2;
      d.spellcasting.domainPowerUses = {};
    },
    meta: { skipHistory: true }
  });
  const undoBeforeExhaustedTurn = CharStore.getHistoryCounts().undo;
  CharStore.dispatch({
    type: 'spells/useTurnOrDomainPower',
    payload: {
      kind: 'domain',
      id: 'sun_greater_turning',
      powerId: 'sun_greater_turning',
      maxUses: 1,
      consumeTurnUndead: true,
      maxTurnUses: 2
    },
    meta: { label: 'Blocked Greater Turning' }
  });
  check(
    'Phase R6 QA: spells/useTurnOrDomainPower with consumeTurnUndead: true aborts with exhausted_daily when turnUndeadUsed >= maxTurnUses, leaving domainPowerUses untouched and _undoStack unchanged',
    CharStore.getLastOutcome()?.status === 'exhausted_daily' &&
    !CharStore.getDoc().spellcasting.domainPowerUses['sun_greater_turning'] &&
    CharStore.getHistoryCounts().undo === undoBeforeExhaustedTurn
  );

  // C. No-op R6 dispatches (max_rank_cap, level_1_locked, invalid statKey) do NOT push onto _undoStack
  CharStore.dispatch({
    type: 'doc/mutate',
    payload: function (d) {
      d.skills = [{ key: 'concentration', name: 'Concentration', ranks: 12, isClass: true }];
    },
    meta: { skipHistory: true }
  });
  const undoBeforeNoOps = CharStore.getHistoryCounts().undo;
  CharStore.dispatch({
    type: 'progression/adjustSkillRank',
    payload: { skillKey: 'concentration', delta: 1 },
    meta: { label: 'Over Cap Skill Rank' }
  });
  const outSkillCap = CharStore.getLastOutcome();
  CharStore.dispatch({
    type: 'progression/updateLevelRow',
    payload: { mode: 'toggleActive', levelIndex: 0 },
    meta: { label: 'Deactivate Level 1' }
  });
  const outLvl1Locked = CharStore.getLastOutcome();
  CharStore.dispatch({
    type: 'progression/adjustAbility',
    payload: { statKey: 'invalid_stat', delta: 1 },
    meta: { label: 'Invalid Stat Key' }
  });
  const outInvalidStat = CharStore.getLastOutcome();
  check(
    'Phase R6 QA: No-op R6 dispatches (max_rank_cap, level_1_locked, invalid statKey) set rejection outcomes and do NOT push onto _undoStack',
    outSkillCap?.status === 'max_rank_cap' &&
    outLvl1Locked?.status === 'level_1_locked' &&
    outInvalidStat?.status === 'invalid_payload' &&
    CharStore.getHistoryCounts().undo === undoBeforeNoOps
  );

  // =========================================================================
  // Phase R7: Final Strangler Fig Gate — 0 Domain JS Inline Events & R6 Cleanups A-D
  // =========================================================================
  // 1. R6-Cleanup-B: hud/longRest accurate refreshedDailyItems & refreshedDailyFeats when already full vs spent
  CharStore.dispatch({
    type: 'doc/mutate',
    payload: function (d) {
      d.gearPool = [
        { id: 'item_boots', name: 'Boots of Speed', dailyCharges: { current: 10, max: 10 } }
      ];
      d.feats = [
        { name: 'Divine Might', used: false, dailyCharges: { current: 3, max: 3 } }
      ];
    },
    meta: { skipHistory: true }
  });
  CharStore.dispatch({
    type: 'hud/longRest',
    payload: { isFullHeal: true },
    meta: { label: 'Rest When Full' }
  });
  const restWhenFullOut = CharStore.getLastOutcome();
  check(
    'Phase R7 (R6-Cleanup-B): hud/longRest reports refreshedDailyItems === 0 and refreshedDailyFeats === 0 when daily items/feats are already at full charges',
    restWhenFullOut?.refreshedDailyItems === 0 &&
    restWhenFullOut?.refreshedDailyFeats === 0
  );
  CharStore.dispatch({
    type: 'doc/mutate',
    payload: function (d) {
      d.gearPool[0].dailyCharges.current = 4;
      d.feats[0].used = true;
    },
    meta: { skipHistory: true }
  });
  CharStore.dispatch({
    type: 'hud/longRest',
    payload: { isFullHeal: true },
    meta: { label: 'Rest When Spent' }
  });
  const restWhenSpentOut = CharStore.getLastOutcome();
  check(
    'Phase R7 (R6-Cleanup-B): hud/longRest reports refreshedDailyItems === 1 and refreshedDailyFeats === 1 when 1 item and 1 feat had spent charges',
    restWhenSpentOut?.refreshedDailyItems === 1 &&
    restWhenSpentOut?.refreshedDailyFeats === 1 &&
    CharStore.getDoc().gearPool[0].dailyCharges.current === 10 &&
    CharStore.getDoc().feats[0].used === false
  );

  // 2. R6-Cleanup-C: hud/shortRest (60 min) in-place Exhausted -> Fatigued conversion when no separate Fatigued buff exists
  CharStore.dispatch({
    type: 'doc/mutate',
    payload: function (d) {
      d.buffs = [
        {
          id: 'debuff_exhausted',
          name: 'Exhausted (-6 STR/DEX)',
          active: true,
          strBonus: -6,
          dexBonus: -6,
          ruleFlags: { exhausted: true }
        }
      ];
    },
    meta: { skipHistory: true }
  });
  CharStore.dispatch({
    type: 'hud/shortRest',
    payload: { minutes: 60 },
    meta: { label: '1h Short Rest Exhausted -> Fatigued' }
  });
  const shortRestExhOut = CharStore.getLastOutcome();
  const convertedBuff = (CharStore.getDoc().buffs || [])[0];
  check(
    'Phase R7 (R6-Cleanup-C): hud/shortRest (60 min) converts Exhausted buff in-place to active Fatigued (-2 STR/DEX) when no separate Fatigued entry exists',
    shortRestExhOut?.downgradedExhausted === true &&
    convertedBuff &&
    convertedBuff.active === true &&
    convertedBuff.ruleFlags?.fatigued === true &&
    convertedBuff.strBonus === -2 &&
    convertedBuff.dexBonus === -2
  );

  // 3. Domain JS Modules Zero Inline Events Gate (char_hud.js, char_combat.js, char_spells.js, char_progression.js, char_inventory.js)
  const inlineEventRatchetRegex = /\bon(click|dblclick|change|input|keydown|keyup|keypress|submit|focus|blur|mousedown|mouseup|mouseover|mouseout|mouseenter|mouseleave|pointerdown|pointerup|touchstart|touchend|dragstart|dragover|dragleave|drop|wheel|scroll|contextmenu)\s*=/gi;
  const domainModules = ['char_hud.js', 'char_combat.js', 'char_spells.js', 'char_progression.js', 'char_inventory.js'];
  for (const modFile of domainModules) {
    const modSrc = fs.readFileSync(path.join(__dirname, '..', modFile), 'utf8');
    const inlineMatches = modSrc.match(inlineEventRatchetRegex) || [];
    check(
      `Phase R7: ${modFile} has 0 inline event handlers (actual=${inlineMatches.length})`,
      inlineMatches.length === 0
    );
  }

  // =========================================================================
  // PHASE R8: CUSTOM RULE & ITEM FORGE ENHANCEMENTS (R8.1 + R8.2 + R8.6)
  // =========================================================================
  const rmSrc = fs.readFileSync(path.join(__dirname, '..', 'rule_master.js'), 'utf8');
  const promptMatches = rmSrc.match(/\bwindow\.prompt\s*\(/g) || [];
  check(
    `Phase R8.1: rule_master.js has 0 blocking window.prompt() calls (actual=${promptMatches.length})`,
    promptMatches.length === 0
  );

  const skillOptionMatches = rmSrc.match(/\bv:\s*'skill\.[a-z_]+'/g) || [];
  check(
    `Phase R8.1: RuleMaster modifier target selector includes all 36 official D&D 3.5e skills + skill.all (actual=${skillOptionMatches.length})`,
    skillOptionMatches.length >= 37
  );

  // R8.2: Multi-damageParts[] weapon assembly & combat evaluation
  const multiDmgChar = JSON.parse(JSON.stringify(f01Raw));
  const stormbladeEntry = {
    id: 'custom_stormblade_r8',
    schemaVersion: 2,
    name: 'Stormfire Greatsword +1',
    type: 'Weapon',
    slot: 'Two-Handed',
    active: true,
    modifiers: [
      { target: 'attack.melee', value: 1, type: 'Enhancement', condition: null },
      { target: 'damage.melee', value: 1, type: 'Enhancement', condition: null }
    ],
    damageParts: [
      { dice: '2d6', bonus: 1, type: 'Slashing', multiplyOnCrit: true, onCritOnly: false, source: 'Base Weapon' },
      { dice: '1d6', bonus: 0, type: 'Fire', multiplyOnCrit: false, onCritOnly: false, source: 'Extra Damage' },
      { dice: '1d6', bonus: 0, type: 'Electricity', multiplyOnCrit: false, onCritOnly: false, source: 'Extra Damage' },
      { dice: '1d10', bonus: 0, type: 'Fire', multiplyOnCrit: false, onCritOnly: true, source: 'On Critical Hit' }
    ],
    weaponStats: {
      category: 'Martial',
      handedness: 'Two-Handed',
      baseDamage: '2d6',
      critMin: 19,
      critMult: 2,
      damageTypes: ['Slashing']
    }
  };
  CharStore.dispatch({
    type: 'progression/addFeat',
    payload: { customDbEntry: stormbladeEntry },
    meta: { label: 'Upsert Stormfire Greatsword +1' }
  });
  const savedStormblade = (CharStore.getDoc().customDb || []).find(e => e && e.id === 'custom_stormblade_r8');
  check(
    'Phase R8.2: Custom Weapon with multi-damageParts[] (Base + Fire + Electricity + Crit Burst) preserves all 4 structured damageParts in customDb',
    Boolean(savedStormblade) &&
    Array.isArray(savedStormblade.damageParts) &&
    savedStormblade.damageParts.length === 4 &&
    savedStormblade.damageParts[1].type === 'Fire' &&
    savedStormblade.damageParts[2].type === 'Electricity' &&
    savedStormblade.damageParts[3].onCritOnly === true
  );

  // R8.6: Stackable Custom Feat (maxRanks: 3, stackable: true) taken twice in levelProgression
  const stackFeatChar = JSON.parse(JSON.stringify(f01Raw));
  const customToughnessPlus = {
    id: 'custom_draconic_vigor_r8',
    schemaVersion: 2,
    name: 'Draconic Vigor (Custom)',
    type: 'Feat',
    category: 'Fighter Bonus',
    isFighterBonusFeat: true,
    featTags: ['Fighter Bonus', 'Draconic'],
    maxRanks: 3,
    stackable: true,
    targetRepeatable: false,
    modifiers: [
      { target: 'hp', value: 5, type: 'Untyped', condition: null }
    ]
  };
  const baseHpBeforeVigor = RuleEngine.deriveSheet(stackFeatChar, [customToughnessPlus]).hp.max;
  stackFeatChar.levelProgression = [
    { level: 1, className: 'Fighter', active: true, feats: ['Draconic Vigor (Custom)', 'Draconic Vigor (Custom)'] }
  ];
  const stackFeatSheet = RuleEngine.deriveSheet(stackFeatChar, [customToughnessPlus]);
  check(
    `Phase R8.6: Custom Feat with maxRanks=3 & stackable=true taken 2x in levelProgression stacks its +5 HP modifier twice (+10 HP: ${baseHpBeforeVigor} -> ${stackFeatSheet.hp.max})`,
    stackFeatSheet.hp.max === baseHpBeforeVigor + 10 &&
    customToughnessPlus.isFighterBonusFeat === true &&
    customToughnessPlus.featTags.includes('Fighter Bonus')
  );

  // SRD Import P1: book-verified class saves & fighter bonus feat flags (SRD_IMPORT_VERIFICATION_TABLE.md)
  const dbDir = path.join(__dirname, '..', 'database');
  const p1Classes = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_classes_races.json'), 'utf8'));
  const p1Feats = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_feats.json'), 'utf8'));
  const p1Cls = id => p1Classes.find(c => c.id === id) || {};
  const p1SaveOk = (id, fort, ref, will) => {
    const c = p1Cls(id);
    const legacy = v => (v === 'high' ? 'good' : 'poor');
    return c.savingThrows && c.savingThrows.fort === fort && c.savingThrows.ref === ref && c.savingThrows.will === will &&
      c.fort === legacy(fort) && c.ref === legacy(ref) && c.will === legacy(will);
  };
  check(
    'SRD Import P1: Class base saves match the books (Knight PHB2 T1-4, Spellthief CAd T1-3, Dervish CW T2-7, Ur-Priest CD T2-23, Jade Phoenix Mage ToB T5-5)',
    p1SaveOk('cls-knight', 'low', 'low', 'high') &&
    p1SaveOk('cls-spellthief', 'low', 'low', 'high') &&
    p1SaveOk('cls-dervish', 'low', 'high', 'high') &&
    p1SaveOk('cls-ur-priest', 'low', 'low', 'high') &&
    p1SaveOk('cls-jade-phoenix-mage', 'high', 'low', 'low')
  );
  const p1Fb = id => (p1Feats.find(f => f.id === id) || {}).isFighterBonusFeat;
  check(
    'SRD Import P1: Fighter bonus feat flags match the books (PHB p.101, CW p.103/105, ToB Table 2-1)',
    p1Fb('feat-tower-shield-proficiency') === false && p1Fb('feat-monkey-grip') === false &&
    p1Fb('feat-evasive-reflexes') === false && p1Fb('feat-snap-kick') === false && p1Fb('feat-stone-power') === false &&
    p1Fb('feat-sharp-shooting') === true && p1Fb('feat-martial-study') === true && p1Fb('feat-martial-stance') === true
  );
  check(
    'SRD Import P1: Fighter feat picker trusts an explicit isFighterBonusFeat=false over the Martial/Fighter category fallback (both pickers use one helper)',
    /if \(f\.isFighterBonusFeat === false\) return false;\s*const tagged/.test(progSrc) &&
    (progSrc.match(/const isFighterFeat = f => isFighterBonusFeatEntry\(f, /g) || []).length === 2 &&
    !/isFighterBonusFeat === true \|\| f\.category === 'Fighter'/.test(progSrc)
  );

  // SRD Import P0: tiered lookup (index-driven lazy chunks) + srd-snapshot lifecycle in customDb
  require('../srd_compendium.js');
  const Comp = globalThis.SrdCompendium;
  const p0Clone = o => JSON.parse(JSON.stringify(o));
  Comp.getById('feat-power-attack'); // Node: synchronous load of index + eager chunks
  const lazyNames = Comp.getLazyChunkNames();
  check(
    'SRD Import P0: Lazy tier is derived from srd_index.json eagerLoad:false (monsters lazy, feats eager) and isLazyEntry() follows it',
    lazyNames.includes('srd_monsters.json') && !lazyNames.includes('srd_feats.json') &&
    Comp.isLazyEntry('mst-nightwalker') === true && Comp.isLazyEntry('feat-power-attack') === false &&
    (Comp.findIndexEntry('Nightwalker', 'Monster') || {}).f === 'srd_monsters.json'
  );
  Comp.ensureChunkLoaded('srd_monsters.json'); // Node path registers synchronously
  const nwSrc = Comp.getById('mst-nightwalker');
  const nwSnap = Comp.snapshotLoadedEntry('mst-nightwalker');
  check(
    'SRD Import P0: snapshotLoadedEntry() copies a lazy entry with _snapshot {origin, srcId, chunk, srcHash} and the copy hashes equal to its source',
    Boolean(nwSrc) && Boolean(nwSnap) && nwSnap !== nwSrc &&
    nwSnap._snapshot.origin === 'srd-snapshot' && nwSnap._snapshot.srcId === 'mst-nightwalker' &&
    nwSnap._snapshot.chunk === 'srd_monsters.json' && nwSnap._snapshot.srcHash === Comp.contentHash(nwSrc) &&
    Comp.contentHash(nwSnap) === nwSnap._snapshot.srcHash
  );
  const p0Db = [];
  const homebrewDb = [{ id: 'mst-nightwalker', name: 'My Nightwalker', type: 'Monster' }];
  check(
    'SRD Import P0: upsertSnapshot() adds, refreshes unmodified copies, and never overwrites a homebrew entry with the same id',
    Comp.upsertSnapshot(p0Db, p0Clone(nwSnap)) === 'added' && p0Db.length === 1 &&
    Comp.upsertSnapshot(p0Db, p0Clone(nwSnap)) === 'updated' && p0Db.length === 1 &&
    Comp.upsertSnapshot(homebrewDb, p0Clone(nwSnap)) === 'kept' && homebrewDb[0].name === 'My Nightwalker'
  );
  const p0Current = p0Clone(nwSnap);
  p0Current.defenses = []; // empty default added by RuleMaster.ensureV2 must not count as a user edit
  p0Current._originalIndex = 4; // UI scratch field must not count either
  const p0CurrentRes = Comp.reconcileSnapshotsSync([p0Current]);
  check(
    'SRD Import P0: reconcile keeps an up-to-date copy as current (empty defaults and _scratch fields are not edits)',
    p0CurrentRes.checked === 1 && p0CurrentRes.changed === false && p0Current._snapshot.status === 'current'
  );
  const p0Stale = p0Clone(nwSnap);
  p0Stale.hp = 1;
  p0Stale._snapshot.srcHash = Comp.contentHash(p0Stale); // unedited copy of an older SRD version
  const p0Edited = p0Clone(nwSnap);
  p0Edited._snapshot.srcHash = '00000000';
  p0Edited.hp = 999; // user edit on top of an older SRD version
  const p0Orphan = p0Clone(nwSnap);
  p0Orphan.id = 'mst-not-in-srd';
  p0Orphan._snapshot.srcId = 'mst-not-in-srd';
  const p0DbA = [p0Stale, p0Orphan];
  const p0DbB = [p0Edited];
  const p0ResA = Comp.reconcileSnapshotsSync(p0DbA);
  const p0ResB = Comp.reconcileSnapshotsSync(p0DbB);
  check(
    'SRD Import P0: reconcile auto-updates unedited stale copies, flags edited ones update-available, and flags missing sources orphaned',
    p0ResA.autoUpdated.includes('mst-nightwalker') && p0DbA[0].hp === nwSrc.hp && p0DbA[0]._snapshot.status === 'current' &&
    p0ResA.orphaned.includes('mst-not-in-srd') && p0DbA[1]._snapshot.status === 'orphaned' &&
    p0ResB.updateAvailable.includes('mst-nightwalker') && p0DbB[0].hp === 999 && p0DbB[0]._snapshot.status === 'update-available'
  );
  check(
    'SRD Import P0: applySnapshotUpdate() replaces an edited copy with the current SRD version',
    Comp.applySnapshotUpdate(p0DbB, 'mst-nightwalker') === true && p0DbB[0].hp === nwSrc.hp && p0DbB[0]._snapshot.status === 'current'
  );
  const p0Idx = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_index.json'), 'utf8'));
  const p0Row = id => p0Idx.index.find(r => r.id === id) || {};
  check(
    'SRD Import P0: srd_index.json lists every chunk record in short form (missing feats/domain rows added, template rows carry n/t/f)',
    p0Row('feat-agile-shield-fighter').f === 'srd_feats.json' && p0Row('dom-dragon').f === 'srd_domains.json' &&
    p0Row('tmpl-celestial').n === 'Celestial Creature' && p0Row('tmpl-celestial').t === 'Template' && p0Row('tmpl-celestial').f === 'srd_templates.json' &&
    p0Idx.totalEntries === p0Idx.index.length && p0Idx.chunks['srd_feats.json'].count === p1Feats.length
  );

  // SRD Import P2: splatbook gear, traits, skill tricks (lazy chunks) + Weak Will + Boulder Roll
  const p2Gear = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_equipment_splat.json'), 'utf8'));
  const p2Opts = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_feats_splat.json'), 'utf8')).filter(e => e.type === 'Trait' || e.type === 'Skill Trick');
  const p2Mans = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_maneuvers.json'), 'utf8'));
  const p2By = id => p2Gear.concat(p2Opts).find(e => e.id === id) || {};
  const p2AllIds = [];
  Object.keys(p0Idx.chunks).forEach(name => {
    const data = JSON.parse(fs.readFileSync(path.join(dbDir, name), 'utf8'));
    (Array.isArray(data) ? data : []).forEach(e => { if (e && e.id) p2AllIds.push(e.id); });
  });
  check(
    'SRD Import P2: splat gear + traits/tricks live in lazy chunks; ids are unique across every chunk',
    p0Idx.chunks['srd_equipment_splat.json'].eagerLoad === false && p0Idx.chunks['srd_feats_splat.json'].eagerLoad === false &&
    Comp.getLazyChunkNames().includes('srd_equipment_splat.json') && Comp.getLazyChunkNames().includes('srd_feats_splat.json') &&
    p2Gear.filter(e => e.type === 'Weapon').length === 51 && p2Gear.filter(e => e.type !== 'Weapon').length === 25 &&
    p2Opts.filter(e => e.type === 'Trait').length === 35 && p2Opts.filter(e => e.type === 'Skill Trick').length === 42 &&
    new Set(p2AllIds).size === p2AllIds.length
  );
  const p2Valid = p2Gear.concat(p2Opts).every(e =>
    e.schemaVersion === 2 && / p\.\s?\d/.test(e.source || '') && e.contentLevel === 'summary' &&
    ['verified', 'cross-checked'].includes(e.verification) && e.provenance && Array.isArray(e.modifiers) &&
    (e.type !== 'Weapon' || (Array.isArray(e.modes) && e.modes.length > 0 && e.modes.every(m => /^\d+d\d+$/.test(m.damageParts[0].dice)))) &&
    (!['Armor', 'Shield'].includes(e.type) || (e.modifiers[0] && e.modifiers[0].target === (e.type === 'Shield' ? 'ac.shield' : 'ac.armor'))));
  check('SRD Import P2: every new record is Canonical V2 with a book page, contentLevel, verification and provenance; weapon modes and armor AC modifiers are well-formed', p2Valid);
  const lynx = p2By('wpn-lynxpaw');
  const lynxOff = (lynx.modes || []).find(m => m.id === 'offhand-head') || {};
  const mtn = p2By('arm-mountain-plate');
  check(
    'SRD Import P2: book-settled weapon stats (Sugliin Frost T4-1, Drow Scorpion Chain RoE, Lynxpaw RotW T7-1, Foot Spike) and armor table values (RoS T7-2)',
    p2By('wpn-sugliin').damage === '2d8' && p2By('wpn-sugliin').critMult === 2 && p2By('wpn-sugliin').weight === 20 &&
    p2By('wpn-drow-scorpion-chain').weight === 12 && p2By('wpn-drow-scorpion-chain').ruleFlags.reach === true &&
    lynx.damage === '1d6' && lynx.critRange === 18 && lynxOff.damageParts[0].dice === '1d4' && lynxOff.damageParts[0].type === 'Slashing' && lynxOff.critMult === 3 &&
    p2By('wpn-foot-spike').damage === '1d4' && p2By('wpn-foot-spike').critMult === 3 &&
    mtn.modifiers[0].value === 10 && mtn.maxDex === 0 && mtn.checkPenalty === -9 && mtn.spellFailure === 60 && mtn.weight === 225 && mtn.speed30 === '15 ft.' &&
    p2By('arm-chitin-armor-stormwrack').modifiers[0].value === 4 && p2By('arm-chitin-armor-races-of-eberron').modifiers[0].value === 2
  );
  const p2Mod = (id, target) => ((p2By(id).modifiers || []).find(m => m.target === target && !m.condition) || {}).value;
  check(
    'SRD Import P2: UA trait modifiers (Aggressive +2 init / -1 AC, Detached, Quick, Slow) and Weak Will -3 Will (UA p.92)',
    p2Mod('trait-aggressive', 'init') === 2 && p2Mod('trait-aggressive', 'ac') === -1 &&
    p2Mod('trait-detached', 'save.will') === 1 && p2Mod('trait-detached', 'save.ref') === -1 &&
    p2Mod('trait-quick', 'speed.land') === 10 && p2By('trait-quick').ruleFlags.frailHpPenalty === true &&
    p2By('trait-slow').ruleFlags.hpPerLevel === true && p2By('trait-slow').ruleFlags.halfBaseLandSpeed === true &&
    ((p1Feats.find(f => f.id === 'flaw-weak-will') || {}).modifiers || [])[0].value === -3
  );
  const boulder = p2Mans.find(e => e.id === 'tob-maneuver-boulder-roll') || {};
  check(
    'SRD Import P2: Skill tricks carry CS Table 3-2 prerequisites as prereqStruct; Boulder Roll is a 4th-level Stone Dragon boost (ToB p.81)',
    JSON.stringify(p2By('trick-walk-the-walls').prereqStruct.skills) === JSON.stringify({ climb: 12, tumble: 5 }) &&
    (p2By('trick-hidden-blade').prereqStruct.feats || []).includes('Quick Draw') && p2By('trick-hidden-blade').cost.skillPoints === 2 &&
    boulder.subType === 'Boost' && boulder.level === 4 && boulder.discipline === 'Stone Dragon' && boulder.source === 'ToB p.81'
  );
  // SRD Import P3: splatbook feats in lazy chunks; 3.0 / licensed content opt-in only
  const p3Splat = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_feats_splat.json'), 'utf8')).filter(f => f.type === 'Feat');
  const p3Epic = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_feats_epic.json'), 'utf8'));
  const p3Legacy = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_feats_legacy.json'), 'utf8'));
  const p3All = p3Splat.concat(p3Epic, p3Legacy);
  check(
    'SRD Import P3: 3.5 heroic / epic / legacy feats are split by edition and level band; the legacy chunk is opt-in and excluded from preloadAll',
    p3Splat.length > 1500 && p3Splat.every(f => f.edition === '3.5' && f.levelBand === 'heroic') &&
    p3Epic.length > 0 && p3Epic.every(f => f.edition === '3.5' && f.levelBand === 'epic' && f.isFighterBonusFeat === false) &&
    p3Legacy.length > 300 && p3Legacy.every(f => f.edition === '3.0' || f.edition === '3.5-licensed') &&
    p0Idx.chunks['srd_feats_legacy.json'].optIn === true && p0Idx.chunks['srd_feats_splat.json'].eagerLoad === false &&
    Comp.getOptInChunkNames().includes('srd_feats_legacy.json') && !Comp.getOptInChunkNames().includes('srd_feats_splat.json')
  );
  check(
    'SRD Import P3: no Dragon Magazine, placeholder, header or "xN" rows; every feat has a book source, a summary benefit, verification and provenance; no Warlock "tier" key',
    p3All.every(f => !/Dragon Magazine/i.test(f.source) && !/ x\d$|Feats$/.test(f.name) && f.benefit && f.benefit.length > 3 &&
      ['cross-checked', 'unverified'].includes(f.verification) && f.provenance && f.contentLevel === 'summary' && !('tier' in f)) &&
    p3All.filter(f => f.verification === 'cross-checked').length > 600
  );
  Comp.ensureChunkLoaded('srd_feats_splat.json'); // Node: synchronous
  const p3Db = [];
  const p3Added = Comp.snapshotLazyRefs(p3Db, ['Acrobatic Strike', 'Power Attack', 'Not A Real Feat'], 'Feat');
  const rendPh2 = Comp.getByName("Two-Weapon Rend (Player's Handbook II)");
  check(
    'SRD Import P3: snapshotLazyRefs copies only lazy-chunk feats (not eager SRD feats) into customDb; book-qualified aliases resolve same-name feats',
    p3Added.length === 1 && p3Db.length === 1 && p3Db[0].name === 'Acrobatic Strike' && p3Db[0]._snapshot.chunk === 'srd_feats_splat.json' &&
    Comp.snapshotLazyRefs(p3Db, ['Acrobatic Strike'], 'Feat').length === 0 &&
    Boolean(rendPh2) && rendPh2.id === 'feat-two-weapon-rend-ph2' && /base attack bonus \+11/.test(rendPh2.prerequisites) &&
    (Comp.getById('feat-two-weapon-rend') || {}).prerequisites.includes('+9')
  );
  const p3ChunkHash = p0Idx.chunks['srd_feats_splat.json'].hash;
  check(
    'SRD Import P3: snapshots record the chunk hash so an unchanged chunk is never downloaded just to reconcile; prefixed level-row feat names are cleaned',
    p3Db[0]._snapshot.chunkHash === p3ChunkHash && Boolean(p3ChunkHash) &&
    /e\._snapshot\.chunkHash === current\) return;/.test(fs.readFileSync(path.join(__dirname, '..', 'srd_compendium.js'), 'utf8')) &&
    /replace\(\/\^\[\^A-Za-z0-9\(\]\+\(\\\[\.\*\?\\\]\)\?\\s\*\/, ''\)/.test(fs.readFileSync(path.join(__dirname, '..', 'char_store.js'), 'utf8'))
  );
  const p3ProgSrc = fs.readFileSync(path.join(__dirname, '..', 'char_progression.js'), 'utf8');
  const p3StoreSrc = fs.readFileSync(path.join(__dirname, '..', 'char_store.js'), 'utf8');
  check(
    'SRD Import P3: feat catalog loads splat chunks on demand, hides 3.0/licensed unless toggled, and the store snapshots referenced lazy feats',
    /function ensureFeatSplatChunks\(\)/.test(p3ProgSrc) && /getCombinedFeatCatalog\(includeInvocations = false\) \{\s*ensureFeatSplatChunks\(\);/.test(p3ProgSrc) &&
    /LEGACY_FEAT_EDITIONS\.has\(f && f\.edition\)/.test(p3ProgSrc) && /'progression:toggle-legacy-feats'/.test(p3ProgSrc) &&
    /return FEAT_REF_TYPES\.map\(t => \(\{ t, names: collectFeatRefNames\(doc, t\) \}\)\)/.test(p3StoreSrc) &&
    /collectSrdRefGroups\(_state\.doc\)\.forEach\(g => comp\.snapshotLazyRefs\(db, g\.names, g\.t\)\)/.test(p3StoreSrc)
  );

  // SRD Import P3 (rest): book-checked prerequisite conflicts and the ELH epic fighter bonus feat list
  const p3bFeats = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_feats.json'), 'utf8'));
  const p3bF = id => p3bFeats.find(f => f.id === id) || {};
  check(
    'SRD Import P3: prerequisite conflicts settled from the books (Somatic Weaponry CM p.47: 5 ranks; Oversized TWF CAd p.111: Str 13; Master Staff ELH p.62: Spellcraft 15)',
    p3bF('feat-somatic-weaponry').prerequisites === 'Concentration 5 ranks, Spellcraft 5 ranks' &&
    p3bF('feat-somatic-weaponry').prereqStruct.skills.spellcraft === 5 &&
    p3bF('feat-oversized-two-weapon-fighting').prerequisites === 'Str 13, Two-Weapon Fighting' &&
    p3bF('feat-oversized-two-weapon-fighting').prereqStruct.abilities.str === 13 && !p3bF('feat-oversized-two-weapon-fighting').prereqStruct.abilities.dex &&
    /Spellcraft 15 ranks/.test(p3bF('feat-master-staff').prerequisites)
  );
  const p3bEpicFtr = p3bFeats.filter(f => f.fighterBonusFeatTier === 'epic');
  check(
    'SRD Import P3: the 31 ELH epic fighter bonus feats carry fighterBonusFeatTier "epic" (not the heroic flag) and are offered only for slots at character level 21+',
    p3bEpicFtr.length === 31 && p3bEpicFtr.every(f => f.isFighterBonusFeat !== true) &&
    p3bEpicFtr.some(f => f.id === 'feat-two-weapon-rend') && p3bEpicFtr.some(f => f.id === 'feat-armor-skin') &&
    /if \(f\.fighterBonusFeatTier === 'epic'\) return \(Number\(slotCharLevel\) \|\| 0\) >= 21;/.test(progSrc)
  );

  // SRD Import P3 (rest): UA traits and Complete Scoundrel skill tricks on the character
  const p3tSplat = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_feats_splat.json'), 'utf8'));
  const p3tTrait = p3tSplat.find(e => e.id === 'trait-abrasive');
  const p3tTrick = p3tSplat.find(e => e.id === 'trick-acrobatic-backstab');
  const p3tChar = {
    level: 2, race: 'Elf', abilities: { cha: 10 },
    levelProgression: [
      { level: 1, className: 'Rogue', active: true, feats: ['🎖️ Dodge', '🧬 [Trait] Abrasive', '💪 [Skill Trick] Acrobatic Backstab'] },
      { level: 2, className: 'Rogue', active: true, feats: [] }
    ],
    skills: [{ key: 'tumble', ranks: 3, isClass: true }],
    feats: [{ name: 'Dodge', type: 'Feat' }, JSON.parse(JSON.stringify(p3tTrait)), JSON.parse(JSON.stringify(p3tTrick))]
  };
  const p3tView = RuleEngine.deriveProgressionView(p3tChar, []);
  const p3tNoTrait = JSON.parse(JSON.stringify(p3tChar));
  p3tNoTrait.feats = p3tNoTrait.feats.filter(f => f.type !== 'Trait');
  p3tNoTrait.levelProgression[0].feats = p3tNoTrait.levelProgression[0].feats.filter(f => !f.includes('[Trait]'));
  check(
    'SRD Import P3: traits and skill tricks never use a feat slot; each skill trick costs 2 skill points (CSc p.83)',
    p3tView.featSlotsView.regularFeatsTaken === 1 && p3tView.featSlotsView.openRegularSlots === 0 &&
    p3tView.skillBudgetsView.skillTrickCount === 1 && p3tView.skillBudgetsView.spentPoints === 5 &&
    RuleEngine.countSkillTricks(p3tChar) === 1 && RuleEngine.isTraitOrSkillTrickRef('🧬 [Trait] Abrasive')
  );
  check(
    'SRD Import P3: a chosen trait applies its benefit and drawback (Abrasive: +1 Intimidate, -1 Bluff, UA p.87)',
    RuleEngine.evaluateSkillBonus(p3tChar, 'intimidate', 'Intimidate', 'cha').total -
      RuleEngine.evaluateSkillBonus(p3tNoTrait, 'intimidate', 'Intimidate', 'cha').total === 1 &&
    RuleEngine.evaluateSkillBonus(p3tChar, 'bluff', 'Bluff', 'cha').total -
      RuleEngine.evaluateSkillBonus(p3tNoTrait, 'bluff', 'Bluff', 'cha').total === -1
  );
  check(
    'SRD Import P3: quick feat picker offers Trait / Skill Trick categories with the RAW limits (2 traits, 1 trick per level, half level rounded up) and type-aware snapshots',
    /value=\\"Trait\\" id=\\"quick-feat-opt-trait\\"/.test(fs.readFileSync(path.join(__dirname, '..', 'char_modals.js'), 'utf8')) &&
    /value=\\"Skill Trick\\" id=\\"quick-feat-opt-skill-trick\\"/.test(fs.readFileSync(path.join(__dirname, '..', 'char_modals.js'), 'utf8')) &&
    /if \(countKind\(prog\) >= 2\)/.test(progSrc) && /const trickCap = Math\.ceil\(rowLevel \/ 2\);/.test(progSrc) &&
    /else if \(category === 'Trait'\) prefix = '🧬 \[Trait\] ';/.test(progSrc) &&
    /const FEAT_REF_TYPES = \['Feat', 'Trait', 'Skill Trick'\];/.test(p3StoreSrc)
  );

  // SRD Import P1 (rest): class pages from book contents, PrC requirements, cross-checked feat pages
  const p1bClasses = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_classes_races.json'), 'utf8')).filter(c => c.type === 'Class');
  const p1bFeats = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_feats.json'), 'utf8'));
  const p1bCls = id => p1bClasses.find(c => c.id === id) || {};
  const p1bReq = (id, key) => (p1bCls(id).prerequisites || []).filter(r => r.key === key);
  check(
    'SRD Import P1: every class source has a book page (PHB/DMG/XPH/ToB/PHB2/CM/CW/CAr contents) and the three PrCs without requirements now have them (CW p.34/45, CD p.70)',
    p1bClasses.every(c => /p\.?\s?\d/.test(String(c.source || ''))) &&
    p1bCls('cls-wizard').source === 'SRD / PHB p.55' && p1bCls('cls-thaumaturgist').source === "Dungeon Master's Guide p.196" &&
    p1bCls('cls-psionic-fist').source === 'Expanded Psionics Handbook p.144' && p1bCls('cls-soulknife').source === 'SRD / XPH p.26' && p1bCls('cls-crusader').source === 'Tome of Battle p.8' &&
    (p1bReq('cls-frenzied-berserker', 'bab')[0] || {}).min === 6 && p1bReq('cls-frenzied-berserker', 'feat').length === 4 &&
    p1bReq('cls-invisible-blade', 'skill').some(r => r.skill === 'sense_motive' && r.ranks === 6) &&
    (p1bReq('cls-ur-priest', 'alignment')[0] || {}).allowed.join() === 'LE,NE,CE' && p1bReq('cls-ur-priest', 'skill').length === 5
  );
  const p1bF = id => (p1bFeats.find(f => f.id === id) || {}).source;
  check(
    'SRD Import P1: feat pages only where two sources agree; same-name epic/psionic SRD feats are never relabelled with a splatbook page',
    p1bF('feat-hold-the-line') === 'Complete Warrior p.100' && p1bF('feat-improved-counterspell') === 'SRD / PHB p.95' &&
    p1bF('feat-two-weapon-rend') === 'SRD 3.5e' && p1bF('feat-mind-over-body') === 'SRD 3.5e' && p1bF('feat-dragon-wild-shape') === 'SRD 3.5e'
  );

  const p2RmSrc = fs.readFileSync(path.join(__dirname, '..', 'rule_master.js'), 'utf8');
  const uiSharedSrc = fs.readFileSync(path.join(__dirname, '..', 'ui_shared.js'), 'utf8');
  check(
    'SRD Import P2: equipping reads V2 weapon stats (category/critRange/critMult) and lazy compendium picks are snapshotted into customDb before equip',
    (p2RmSrc.match(/const wStats = this\.resolveWeaponStats\(item\);/g) || []).length === 2 &&
    /snapshotLazyEntryIntoCustomDb\(entry\)/.test(uiSharedSrc) && !/equipItem\(entry\.id\)/.test(uiSharedSrc) &&
    /SrdCompendium\.ensureEntryInCustomDb\(masterDb, lazyId\)/.test(fs.readFileSync(path.join(__dirname, '..', 'char_combat.js'), 'utf8'))
  );

  // SRD Import P4: splatbook base / prestige class chassis in lazy chunks; 3.0 / licensed classes opt-in only
  const p4Splat = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_classes_splat.json'), 'utf8'));
  const p4Legacy = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_classes_legacy.json'), 'utf8'));
  const p4All = p4Splat.concat(p4Legacy);
  const p4Core = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_classes_races.json'), 'utf8')).filter(c => c.type === 'Class');
  const p4NameKey = n => String(n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const p4Names = p4All.concat(p4Core).map(c => p4NameKey(c.name));
  const p4Ids = p4All.concat(p4Core).map(c => c.id);
  check(
    'SRD Import P4: class chunks are lazy (legacy opt-in, never in preloadAll or the eager set); class ids and names are unique across all class chunks',
    p4Splat.length > 150 && p4Splat.every(c => c.edition === '3.5') && p4Legacy.length > 0 && p4Legacy.every(c => c.edition === '3.0' || c.edition === '3.5-licensed') &&
    p0Idx.chunks['srd_classes_splat.json'].eagerLoad === false && !p0Idx.chunks['srd_classes_splat.json'].optIn &&
    p0Idx.chunks['srd_classes_legacy.json'].eagerLoad === false && p0Idx.chunks['srd_classes_legacy.json'].optIn === true &&
    Comp.getOptInChunkNames().includes('srd_classes_legacy.json') && Comp.getLazyChunkNames().includes('srd_classes_splat.json') &&
    !Comp.isChunkLoaded('srd_classes_splat.json') && !Comp.isChunkLoaded('srd_classes_legacy.json') &&
    new Set(p4Names).size === p4Names.length && new Set(p4Ids).size === p4Ids.length &&
    p4Legacy.some(c => c.name === 'Samurai (Oriental Adventures)') && p4Splat.some(c => c.name === 'Samurai' && c.source === 'Complete Warrior p.8')
  );
  const p4By = id => p4All.find(c => c.id === id) || {};
  const p4Chassis = (id, hd, bab, saves, skills, maxLevel, prc) => {
    const c = p4By(id);
    return c.hd === hd && c.hitDie === `d${hd}` && c.bab === bab && `${c.fort[0]}${c.ref[0]}${c.will[0]}` === saves &&
      c.skillPointsPerLevel === skills && c.skills === skills && c.maxLevel === maxLevel && c.isPrestige === prc &&
      c.type === 'Class' && c.contentLevel === 'stub' && c.schemaVersion === 2;
  };
  check(
    'SRD Import P4: chassis values (Alienist CAr p.21 d4 1/2 BAB good Will 2 sp; Samurai CW p.8 d10 full BAB good Fort 2 sp 20 levels) and the 5 book-settled classes',
    p4Chassis('cls-alienist', 4, 0.5, 'ppg', 2, 10, true) && p4Chassis('cls-samurai', 10, 1, 'gpp', 2, 20, false) &&
    p4Chassis('cls-evangelist', 6, 0.75, 'ppg', 6, 5, true) && p4Chassis('cls-rainbow-servant', 4, 0.5, 'ppg', 2, 10, true) &&
    p4Chassis('cls-void-disciple', 6, 0.5, 'ppg', 2, 13, true) && p4Chassis('cls-moonspeaker', 8, 0.75, 'gpg', 4, 12, true) &&
    p4Chassis('cls-reforged', 8, 0.75, 'ppg', 4, 3, true) &&
    ['cls-evangelist', 'cls-rainbow-servant', 'cls-void-disciple', 'cls-moonspeaker', 'cls-reforged'].every(id => p4By(id).verification === 'verified' && p4By(id).provenance.book) &&
    p4All.every(c => ['verified', 'cross-checked', 'unverified'].includes(c.verification) && c.provenance && c.source) &&
    p4All.filter(c => c.isPrestige).every(c => c.verification !== 'unverified')
  );
  check(
    'SRD Import P4: requirements are structured; "must be female" is a special requirement, not a race (Yathrinshee PGtF p.187)',
    (p4By('cls-alienist').prerequisites || []).length > 0 &&
    p4All.every(c => (c.prerequisites || []).every(r => r.key !== 'race' || !/^(fe)?male$/i.test(r.val))) &&
    (p4By('cls-yathrinshee').prerequisites || []).some(r => r.key === 'race' && r.val === 'Drow') &&
    (p4By('cls-yathrinshee').prerequisites || []).some(r => r.key === 'special' && /female/i.test(r.text)) &&
    p4All.every(c => (c.prerequisites || []).every(r => r.key !== 'skill' || /^[a-z_]+$/.test(r.skill)))
  );
  // A character with levels in a lazy class resolves it from its srd-snapshot while the chunk is not loaded.
  const p4Snap = Object.assign(JSON.parse(JSON.stringify(p4By('cls-alienist'))), {
    _snapshot: { origin: 'srd-snapshot', srcId: 'cls-alienist', chunk: 'srd_classes_splat.json', chunkHash: p0Idx.chunks['srd_classes_splat.json'].hash, status: 'current' }
  });
  const p4Char = {
    name: 'P4 Alienist Test', level: 7, race: 'Human', abilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 },
    levelProgression: [1, 2, 3, 4, 5].map(l => ({ level: l, className: 'Wizard', active: true, feats: [] }))
      .concat([6, 7].map(l => ({ level: l, className: 'Alienist', active: true, feats: [] })))
  };
  RuleEngine.deriveSheet(p4Char, { customDb: [p4Snap] });
  const p4Def = RuleEngine.getClassDef('Alienist') || {};
  const p4Prog = RuleEngine.calculateProgression(p4Char.levelProgression, { system: 'standard' });
  check(
    'SRD Import P4: a lazy class on the character resolves from its customDb snapshot without the chunk (Alienist d4, 1/2 BAB, good Will, prestige)',
    !Comp.isChunkLoaded('srd_classes_splat.json') && !Comp.getClass('Alienist') &&
    p4Def.hd === 4 && p4Def.bab === 0.5 && p4Def.will === 'good' && p4Def.fort === 'poor' && p4Def.maxLevel === 10 &&
    p4Def.isPrestige === true && p4Def.type === 'Prestige Class' && p4Prog.classCounts && p4Prog.classCounts.Alienist === 2
  );
  const p4StoreSrc = fs.readFileSync(path.join(__dirname, '..', 'char_store.js'), 'utf8');
  const p4SpellsSrc = fs.readFileSync(path.join(__dirname, '..', 'char_spells.js'), 'utf8');
  check(
    'SRD Import P4: the store snapshots class refs (levelProgression className / doc.classes) and getAvailableClassDefs types snapshots as official prestige/base classes',
    /function collectClassRefNames\(doc\)/.test(p4StoreSrc) && /\.concat\(\[\{ t: 'Class', names: collectClassRefNames\(doc\) \}, /.test(p4StoreSrc) &&
    /const isSnap = Boolean\(c\._snapshot\) && c\.type === 'Class';/.test(p4SpellsSrc) && /isCustom: !isSnap,/.test(p4SpellsSrc) &&
    Boolean(RuleEngine.DND35_CLASS_DEFS.alienist) && /if \(k === k\.toLowerCase\(\) && displayKeysLower\.has\(k\)\) return;/.test(p4SpellsSrc)
  );
  const p4ProgSrc = fs.readFileSync(path.join(__dirname, '..', 'char_progression.js'), 'utf8');
  const p4EnsureCalls = (p4ProgSrc.match(/\n\s*ensureClassSplatChunks\(\);/g) || []).length;
  check(
    'SRD Import P4: class chunks load only from the class pickers (never at page open); 3.0 / licensed classes follow the "3.0 & Licensed" setting',
    /function ensureClassSplatChunks\(\)/.test(p4ProgSrc) && p4EnsureCalls === 3 &&
    /if \(typeof ensureClassSplatChunks === 'function'\) ensureClassSplatChunks\(\);\s*const allDefs = getAvailableClassDefs\(\);/.test(p4SpellsSrc) &&
    /if \(includeLegacyFeats\(\)\) wanted\.push\('srd_classes_legacy\.json'\);/.test(p4ProgSrc) &&
    (p4ProgSrc.match(/if \(isClassHiddenByEdition\(cName, def\)/g) || []).length === 3 &&
    !/ensureClassSplatChunks/.test(fs.readFileSync(path.join(__dirname, '..', 'srd_compendium.js'), 'utf8'))
  );
  // Class prerequisite skill ranks: character.skills is an array; older P1 records use knowledge_<field> keys.
  const p4SkillSrc = p4ProgSrc.slice(p4ProgSrc.indexOf('const LEGACY_PREREQ_SKILL_KEYS'), p4ProgSrc.indexOf('function checkClassPrerequisites('));
  const p4Ranks = (skills, key) => new Function('character', `${p4SkillSrc}\nreturn getPrereqSkillRanks(${JSON.stringify(key)});`)({ skills });
  const p4Skills = [{ key: 'k_arcana', ranks: 8 }, { key: 'k_planes', ranks: 4 }, { key: 'perform_oratory', ranks: 6 }, { key: 'umd', ranks: 2 }];
  check(
    'SRD Import P4: class skill prerequisites read ranks from the skills array (knowledge_arcana -> k_arcana, any Perform subtype, legacy object map)',
    p4Ranks(p4Skills, 'k_arcana') === 8 && p4Ranks(p4Skills, 'knowledge_arcana') === 8 && p4Ranks(p4Skills, 'knowledge_planes') === 4 &&
    p4Ranks(p4Skills, 'perform') === 6 && p4Ranks(p4Skills, 'use_magic_device') === 2 && p4Ranks(p4Skills, 'spellcraft') === 0 &&
    p4Ranks({ k_religion: { ranks: 5 } }, 'knowledge_religion') === 5 &&
    /const curRanks = getPrereqSkillRanks\(req\.skill\);/.test(p4ProgSrc) && !/character\.skills\[req\.skill\]/.test(p4ProgSrc)
  );

  // SRD Import: psionic powers in their own lazy chunk (out of the eager srd_spells.json)
  const pwChunk = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_powers.json'), 'utf8'));
  const pwSpells = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_spells.json'), 'utf8'));
  const pwIdx = JSON.parse(fs.readFileSync(path.join(dbDir, 'srd_index.json'), 'utf8'));
  const pwRows = pwIdx.index.filter(r => r.t === 'Power');
  check(
    'SRD Import Powers: the 440 XPH powers live only in the lazy srd_powers.json (not eager, not opt-in); srd_spells.json keeps spells only; index rows point at the new chunk',
    pwChunk.length === 440 && pwChunk.every(p => p.type === 'Power' && p.id && p.schemaVersion === 2) &&
    !pwSpells.some(s => s.type === 'Power') && pwSpells.length > 600 &&
    pwIdx.chunks['srd_powers.json'].eagerLoad === false && !pwIdx.chunks['srd_powers.json'].optIn &&
    pwRows.length === 440 && pwRows.every(r => r.f === 'srd_powers.json') &&
    Comp.getLazyChunkNames().includes('srd_powers.json') && !Comp.isChunkLoaded('srd_powers.json') &&
    !Comp.getByName('Force Screen')
  );
  // A psionic buff on the character resolves from its srd-snapshot while the chunk is not loaded.
  const pwSrc = pwChunk.find(p => p.name === 'Force Screen');
  const pwSnap = Object.assign(JSON.parse(JSON.stringify(pwSrc)), {
    _snapshot: { origin: 'srd-snapshot', srcId: pwSrc.id, chunk: 'srd_powers.json', chunkHash: pwIdx.chunks['srd_powers.json'].hash, status: 'current' }
  });
  const pwChar = { name: 'P Powers Test', level: 3, abilities: { int: 14 }, buffs: [{ name: 'Force Screen', active: true }] };
  RuleEngine.deriveSheet(pwChar, { customDb: [pwSnap] });
  const pwSpec = RuleEngine.resolveSpellBuffSpec({ name: 'Force Screen' }, pwChar, 3);
  check(
    'SRD Import Powers: an active psionic buff (Force Screen, +4 shield) resolves from the customDb snapshot without the powers chunk',
    !Comp.isChunkLoaded('srd_powers.json') && pwSpec && pwSpec.isBuffSpell === true &&
    (pwSpec.modifiers || []).some(m => m && m.target === 'ac.shield' && Number(m.value) === 4)
  );
  Comp.ensureChunkLoaded('srd_powers.json'); // Node: synchronous
  const pwDb = [];
  const pwAdded = Comp.snapshotLazyRefs(pwDb, ['Force Screen', 'Fireball', 'Rage'], 'Power');
  const pwStoreSrc = fs.readFileSync(path.join(__dirname, '..', 'char_store.js'), 'utf8');
  const pwUiSrc = fs.readFileSync(path.join(__dirname, '..', 'ui_shared.js'), 'utf8');
  check(
    'SRD Import Powers: only lazy powers are snapshotted (not eager spells or unknown buff names); the store collects power refs from spell lists and buffs; Spotlight picks resolve lazy stubs via fetchEntry',
    pwAdded.length === 1 && pwDb[0].name === 'Force Screen' && pwDb[0]._snapshot.chunk === 'srd_powers.json' &&
    /function collectPowerRefNames\(doc\)/.test(pwStoreSrc) && /\{ t: 'Power', names: collectPowerRefNames\(doc\) \}/.test(pwStoreSrc) &&
    !/getSpellById|getMonsterById/.test(pwUiSrc) && /await global\.SrdCompendium\.fetchEntry\(picked\.id\)/.test(pwUiSrc)
  );

  // Hub custom DB isolation (ADR-011): a rule pack loaded in the Hub reaches only one campaign's characters.
  const hubSrc = fs.readFileSync(path.join(__dirname, '..', 'hub.html'), 'utf8');
  const hubFnSrc = hubSrc.slice(hubSrc.indexOf('function getHubCampaignScopeIds('), hubSrc.indexOf('function describeHubDbMergeResult('));
  const hubRun = (activeCampaignId, sheetCharId, entries, campArg) => {
    const store = { dnd35_character: JSON.stringify({ id: sheetCharId, customDb: [] }) };
    const sandbox = {
      JSON,
      state: {
        activeCampaignId,
        campaigns: [{ id: 'camp_main' }, { id: 'camp_sub', parentId: 'camp_main' }, { id: 'camp_other' }],
        characters: [
          { id: 'c_main', campaignId: 'camp_main', fullData: { customDb: [{ id: 'x1', name: 'Shared Name', type: 'Item', weight: 5 }] } },
          { id: 'c_sub', campaignId: 'camp_sub', fullData: { customDb: [] } },
          { id: 'c_other', campaignId: 'camp_other', fullData: { customDb: [] } },
          { id: 'c_free', campaignId: null, fullData: { customDb: [] } }
        ]
      },
      localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
      saveHubStorage: () => {}
    };
    vm.runInNewContext(hubFnSrc + '\nresult = mergeEntriesIntoHubCharacters(entries, campArg);', Object.assign(sandbox, { entries, campArg: campArg || null }));
    const dbOf = id => sandbox.state.characters.find(c => c.id === id).fullData.customDb;
    return { res: sandbox.result, dbOf, sheetDb: JSON.parse(store.dnd35_character).customDb };
  };
  const hubPack = [{ id: 'pack:boon_a', name: 'Boon A', type: 'DM Boon' }, { id: 'pack:feat_shared', name: 'Shared Name', type: 'Feat' }];
  const hubAll = hubRun('all', 'c_free', hubPack);
  const hubMain = hubRun('camp_main', 'c_other', hubPack);
  const hubSheet = hubRun('camp_main', 'c_main', hubPack);
  const hubEmpty = hubRun('camp_main', 'c_main', hubPack, 'camp_empty');
  const hubReplace = hubRun('camp_main', 'c_other', [{ id: 'x1', name: 'Shared Name', type: 'Item', weight: 2 }]);
  check(
    'Hub custom DB isolation: a pack goes only to the active campaign and its sub-campaigns (never every character, never with "All" selected or an empty campaign); the sheet character gets it only when targeted; same-name entries of other types stay separate and a same-id entry is replaced',
    hubAll.res.targets === 0 && ['c_main', 'c_sub', 'c_other', 'c_free'].every(id => !hubAll.dbOf(id).some(e => e.id === 'pack:boon_a')) && hubAll.sheetDb.length === 0 &&
    hubMain.res.targets === 2 && hubMain.dbOf('c_sub').length === 2 && hubMain.dbOf('c_other').length === 0 && hubMain.dbOf('c_free').length === 0 && hubMain.sheetDb.length === 0 &&
    hubMain.dbOf('c_main').length === 3 && hubMain.dbOf('c_main').find(e => e.id === 'x1').weight === 5 &&
    hubSheet.sheetDb.length === 2 &&
    hubEmpty.res.targets === 0 && hubEmpty.dbOf('c_main').length === 1 &&
    hubReplace.res.updated === 1 && hubReplace.dbOf('c_main').length === 1 && hubReplace.dbOf('c_main')[0].weight === 2
  );

  // Campaign DB (CAMPAIGN_PACKS_DESIGN.md): campaign_db.js reconcile rules on the real DM Boons pack.
  const CampaignDb = require('../campaign_db.js');
  const boonFile = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'exports', 'dm_boons_master_db_import.json'), 'utf8'));
  const boonPack = CampaignDb.readPackFile(boonFile);
  const cdbPacksV1 = CampaignDb.attachPack([], boonPack, '2026-11-10T00:00:00Z');
  const cdbDb = [{ id: 'own_homebrew', name: 'My Homebrew Sword', type: 'Weapon' }];
  const cdbAdd = CampaignDb.reconcile(cdbDb, cdbPacksV1, { campaignId: 'camp_main', used: new Set() });
  const cdbAgain = CampaignDb.reconcile(cdbDb, cdbPacksV1, { campaignId: 'camp_main', used: new Set() });
  const cdbTagged = cdbDb.filter(e => CampaignDb.getTag(e));
  check(
    'Campaign DB: a pack file is read with its id, every entry is copied into the character customDb with a _campaignPack tag (own entries untouched), and a second reconcile changes nothing',
    boonPack && boonPack.packId === 'pack_dm_draconic_boons' && boonPack.entries.length === 107 && cdbPacksV1[0].version === 1 &&
    cdbAdd.added === 107 && cdbTagged.length === 107 && cdbDb[0].id === 'own_homebrew' && !CampaignDb.getTag(cdbDb[0]) &&
    cdbTagged.every(e => e._campaignPack.campaignId === 'camp_main' && e._campaignPack.status === 'active' && e.pack === 'pack_dm_draconic_boons') &&
    !cdbAgain.changed
  );

  // DM edits one entry and drops two (one used by the character, one not), then re-uploads -> v2.
  const usedBoon = boonPack.entries[1], unusedBoon = boonPack.entries[2];
  const editedPack = Object.assign({}, boonPack, {
    entries: boonPack.entries.filter(e => e !== usedBoon && e !== unusedBoon).map((e, i) => i === 0 ? Object.assign({}, e, { description: 'DM edit' }) : e)
  });
  const cdbPacksV2 = CampaignDb.attachPack(cdbPacksV1, editedPack, '2026-11-11T00:00:00Z');
  const cdbChar = { specialAbilities: [{ id: usedBoon.id.split(':').pop(), name: usedBoon.name }] };
  const cdbV2 = CampaignDb.reconcile(cdbDb, cdbPacksV2, { campaignId: 'camp_main', used: CampaignDb.collectUsedRefs(cdbChar) });
  const keptUsed = cdbDb.find(e => e.id === usedBoon.id);
  check(
    'Campaign DB: a re-upload is v2; changed entries are refreshed, an unused removed entry is deleted, a removed entry the character uses is kept as "removed"',
    cdbPacksV2.length === 1 && cdbPacksV2[0].version === 2 &&
    cdbV2.removed === 1 && cdbV2.keptRemoved === 1 && !cdbDb.some(e => e.id === unusedBoon.id) &&
    keptUsed && keptUsed._campaignPack.status === 'removed' &&
    cdbDb.find(e => e.id === boonPack.entries[0].id).description === 'DM edit' &&
    cdbTagged.length === 107 && cdbDb.filter(e => CampaignDb.getTag(e)).length === 106
  );

  // Leaving the campaign detaches the copies; joining again re-attaches them. Hand-imported copies are adopted;
  // a character's own same-name entry is never overwritten.
  const cdbDetach = CampaignDb.reconcile(cdbDb, cdbPacksV2, { campaignId: null, used: new Set() });
  const detachedCount = cdbDb.filter(e => CampaignDb.getTag(e) && e._campaignPack.status === 'detached').length;
  const cdbRejoin = CampaignDb.reconcile(cdbDb, cdbPacksV2, { campaignId: 'camp_main', used: new Set() });
  const handDb = boonFile.entries.slice(0, 3).map(e => Object.assign({}, e, { pack: 'pack_dm_draconic_boons' }))
    .concat([{ id: 'mine', name: boonFile.entries[3].name, type: boonFile.entries[3].type, description: 'my own version' }]);
  const cdbAdopt = CampaignDb.reconcile(handDb, cdbPacksV1, { campaignId: 'camp_main', used: new Set() });
  check(
    'Campaign DB: copies are detached (kept) when the character leaves the campaign and re-attached when it returns; hand-imported copies are adopted without duplicates; a character entry with the same name is skipped, not overwritten',
    cdbDetach.detached === 106 && detachedCount === 106 &&
    cdbRejoin.updated >= 105 && cdbDb.filter(e => CampaignDb.getTag(e) && e._campaignPack.status === 'detached').length === 0 &&
    cdbAdopt.adopted === 3 && cdbAdopt.added === 103 && cdbAdopt.skipped.length === 1 &&
    handDb.length === 107 && handDb.find(e => e.id === 'mine').description === 'my own version' && !CampaignDb.getTag(handDb.find(e => e.id === 'mine'))
  );

  // The tag does not change the rule engine: boons from tagged copies give the same sheet as a plain import.
  const cdbFixture = loadFixture('05_dragon_blooded_boons_lvl17.json');
  cdbFixture.feats = (cdbFixture.feats || []).concat(boonFile.entries.filter(e => e.type === 'DM Boon').map(e => ({ id: e.id, name: e.name, type: e.type })));
  const cdbPlainDb = JSON.parse(JSON.stringify(boonFile.entries));
  const cdbTaggedDb = [];
  CampaignDb.reconcile(cdbTaggedDb, cdbPacksV1, { campaignId: 'camp_main', used: new Set() });
  const cdbSheetPlain = RuleEngine.deriveSheet(JSON.parse(JSON.stringify(cdbFixture)), cdbPlainDb);
  const cdbSheetTagged = RuleEngine.deriveSheet(JSON.parse(JSON.stringify(cdbFixture)), cdbTaggedDb);
  const cdbSig = (s) => JSON.stringify({ ac: s.ac && [s.ac.total, s.ac.touch, s.ac.flatFooted, s.ac.natural], saves: s.saves && [s.saves.fort, s.saves.ref, s.saves.will], hp: s.hp && s.hp.max });
  check(
    'Campaign DB: fixture 05 with all DM boons derives the same AC, saves and HP from tagged Campaign DB copies as from a plain pack import',
    cdbSig(cdbSheetPlain) === cdbSig(cdbSheetTagged) && cdbSheetPlain.ac.total > 23,
    `plain=${cdbSig(cdbSheetPlain)} tagged=${cdbSig(cdbSheetTagged)}`
  );

  // Hub: a pack file attaches to the selected (root) campaign; sub-campaign characters get it, others do not.
  const cdbHubFnSrc = hubSrc.slice(hubSrc.indexOf('function getHubRootCampaign('), hubSrc.indexOf('function exportMasterDbJson('));
  const cdbHubRun = (activeCampaignId, sheetCharId) => {
    const store = { dnd35_character: JSON.stringify({ id: sheetCharId, customDb: [] }) };
    const alerts = [];
    const sandbox = {
      JSON, Object, Array, Map, Set, Date, Number, String,
      CampaignDb, window: { CampaignDb },
      state: {
        activeCampaignId,
        campaigns: [{ id: 'camp_main', name: 'Main' }, { id: 'camp_sub', name: 'Sub', parentId: 'camp_main' }, { id: 'camp_other', name: 'Other' }],
        characters: [
          { id: 'c_main', name: 'A', campaignId: 'camp_main', fullData: { customDb: [] } },
          { id: 'c_sub', name: 'B', campaignId: 'camp_sub', fullData: { customDb: [] } },
          { id: 'c_other', name: 'C', campaignId: 'camp_other', fullData: { customDb: [] } }
        ]
      },
      localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
      saveHubStorage: () => {}, renderHub: () => {}, renderHubDmPackManager: () => {},
      alert: (m) => alerts.push(m), confirm: () => true
    };
    vm.runInNewContext(cdbHubFnSrc + '\nattachPackToActiveCampaignDb(CampaignDb.readPackFile(packFile));', Object.assign(sandbox, { packFile: boonFile }));
    const tagged = id => sandbox.state.characters.find(c => c.id === id).fullData.customDb.filter(e => CampaignDb.getTag(e)).length;
    const sheetTagged = JSON.parse(store.dnd35_character).customDb.filter(e => CampaignDb.getTag(e)).length;
    return { sandbox, tagged, sheetTagged, alerts };
  };
  const cdbHubSub = cdbHubRun('camp_sub', 'c_sub');
  const cdbHubAll = cdbHubRun('all', 'c_main');
  const cdbHubAttached = [cdbHubSub.sandbox.state.campaigns[0].packs.length, !cdbHubSub.sandbox.state.campaigns[1].packs, cdbHubSub.tagged('c_main'), cdbHubSub.tagged('c_sub'), cdbHubSub.tagged('c_other'), cdbHubSub.sheetTagged];
  vm.runInNewContext(cdbHubFnSrc + '\nstate.activeCampaignId = "camp_main"; removePackFromActiveCampaignDb("pack_dm_draconic_boons");', cdbHubSub.sandbox);
  check(
    'Campaign DB (Hub): a pack attaches to the root campaign of the selected sub-campaign and reaches its characters and the sheet character; nothing is attached with "All" selected; removing the pack removes the unused copies',
    JSON.stringify(cdbHubAttached) === JSON.stringify([1, true, 107, 107, 0, 107]) &&
    cdbHubAll.tagged('c_main') === 0 && !cdbHubAll.sandbox.state.campaigns[0].packs && /select a campaign first/.test(cdbHubAll.alerts[0] || '') &&
    cdbHubSub.sandbox.state.campaigns[0].packs.length === 0 && cdbHubSub.tagged('c_main') === 0 && cdbHubSub.tagged('c_sub') === 0 &&
    !/e\._hubElig = res/.test(hubSrc) && /CampaignDb\.readPackFile\(parsed\)/.test(hubSrc)
  );

  // Campaign DB phase 2 (cloud): a fake SupabaseAuth whose calls settle synchronously, so the Hub code runs in vm.
  const syncOk = (v) => ({ then(f) { return syncOk(f ? f(v) : v); }, catch() { return this; } });
  const syncFail = (e) => ({ then(f, r) { return r ? syncOk(r(e)) : syncFail(e); }, catch(r) { return syncOk(r(e)); } });
  const cdbCloudRun = (opts) => {
    const store = { dnd35_character: JSON.stringify({ id: 'c_none', customDb: [] }) };
    const calls = [], alerts = [];
    const fakeAuth = {
      isLocalMode: () => Boolean(opts.localMode),
      upsertCampaignPack: (cid, p) => { calls.push(['upsert', cid, p.packId, p.version]); return opts.failWrite ? syncFail(new Error('RLS denied')) : syncOk(true); },
      deleteCampaignPack: (cid, pid) => { calls.push(['delete', cid, pid]); return opts.failWrite ? syncFail(new Error('RLS denied')) : syncOk(true); }
    };
    const sandbox = {
      JSON, Object, Array, Map, Set, Date, Number, String,
      CampaignDb, SupabaseAuth: fakeAuth, window: { CampaignDb, SupabaseAuth: fakeAuth },
      state: {
        activeCampaignId: 'local_main',
        campaigns: [{ id: 'local_main', name: 'Main', cloudCampaignId: 'cloud-uuid-1', packs: opts.packs || [] }],
        characters: [
          { id: 'c_dm_npc', name: 'NPC', campaignId: 'cloud-uuid-1', fullData: { customDb: [] } },
          { id: 'c_player', name: 'Player', campaignId: 'cloud-uuid-other', fullData: { customDb: (opts.playerDb || []) } }
        ]
      },
      localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
      saveHubStorage: () => {}, renderHub: () => {}, renderHubDmPackManager: () => {},
      alert: (m) => alerts.push(m), confirm: () => true
    };
    vm.runInNewContext(cdbHubFnSrc + '\n' + opts.code, Object.assign(sandbox, { packFile: boonFile }));
    return { sandbox, calls, alerts, npcDb: sandbox.state.characters[0].fullData.customDb, playerDb: sandbox.state.characters[1].fullData.customDb };
  };
  const cdbCloudAttach = cdbCloudRun({ code: 'attachPackToActiveCampaignDb(CampaignDb.readPackFile(packFile));' });
  const cdbCloudFail = cdbCloudRun({ failWrite: true, code: 'attachPackToActiveCampaignDb(CampaignDb.readPackFile(packFile));' });
  const cdbCloudOffline = cdbCloudRun({ localMode: true, code: 'attachPackToActiveCampaignDb(CampaignDb.readPackFile(packFile));' });
  const cdbPlayerCopy = [{ id: 'x', name: 'Copy', _campaignPack: { campaignId: 'cloud-uuid-other', packId: 'p', version: 1, hash: 'h', status: 'active' } }];
  const cdbCloudRemove = cdbCloudRun({ playerDb: cdbPlayerCopy, packs: [Object.assign({}, cdbPacksV1[0], { inCloud: true })],
    code: 'reconcileHubCampaignDbs({ save: false }); removePackFromActiveCampaignDb("pack_dm_draconic_boons");' });
  const cdbOfflineRemove = cdbCloudRun({ localMode: true, packs: [Object.assign({}, cdbPacksV1[0], { inCloud: true })],
    code: 'removePackFromActiveCampaignDb("pack_dm_draconic_boons");' });
  check(
    'Campaign DB (cloud): attaching to a cloud campaign writes campaign_packs first and tags copies with the cloud id; a failed write changes nothing; signed out it is kept as not uploaded; removing deletes the cloud row (refused while signed out); a player character in another DM\'s campaign is left alone',
    JSON.stringify(cdbCloudAttach.calls) === JSON.stringify([['upsert', 'cloud-uuid-1', 'pack_dm_draconic_boons', 1]]) &&
    cdbCloudAttach.sandbox.state.campaigns[0].packs[0].inCloud === true &&
    cdbCloudAttach.npcDb.length === 107 && cdbCloudAttach.npcDb.every(e => e._campaignPack.campaignId === 'cloud-uuid-1') &&
    cdbCloudFail.sandbox.state.campaigns[0].packs.length === 0 && cdbCloudFail.npcDb.length === 0 && /not attached: RLS denied/.test(cdbCloudFail.alerts[0] || '') &&
    cdbCloudOffline.calls.length === 0 && cdbCloudOffline.sandbox.state.campaigns[0].packs[0].inCloud === false && cdbCloudOffline.npcDb.length === 107 &&
    JSON.stringify(cdbCloudRemove.calls) === JSON.stringify([['delete', 'cloud-uuid-1', 'pack_dm_draconic_boons']]) &&
    cdbCloudRemove.sandbox.state.campaigns[0].packs.length === 0 && cdbCloudRemove.npcDb.length === 0 &&
    cdbCloudRemove.playerDb.length === 1 && cdbCloudRemove.playerDb[0]._campaignPack.status === 'active' &&
    cdbOfflineRemove.calls.length === 0 && cdbOfflineRemove.sandbox.state.campaigns[0].packs.length === 1 && /Sign in to remove/.test(cdbOfflineRemove.alerts[0] || '')
  );

  const cdbMerged = CampaignDb.mergeCloudPacks(
    [{ packId: 'from_other_device', version: 3, entries: [] }, { packId: 'edited_offline', version: 1, entries: [] }],
    [{ packId: 'edited_offline', version: 2, entries: [], inCloud: false }, { packId: 'phase1_local', version: 1, entries: [] }, { packId: 'deleted_elsewhere', version: 1, entries: [], inCloud: true }],
    new Set(['edited_offline']));
  const cdbM = (id) => cdbMerged.find(p => p.packId === id);
  check(
    'Campaign DB (cloud sync): the cloud list wins, packs not yet in the cloud are laid over it (uploaded ones become cloud packs, failed ones stay pending), and a cloud pack deleted on another device is dropped',
    cdbMerged.length === 3 && cdbM('from_other_device').inCloud === true && cdbM('edited_offline').version === 2 && cdbM('edited_offline').inCloud === true &&
    cdbM('phase1_local').inCloud === false && !cdbM('deleted_elsewhere') &&
    /await pullCloudCampaignDbs\(\)/.test(hubSrc) && /if \(sc && sc\.parentId === oldId\) sc\.parentId = cloudCamp\.id;/.test(hubSrc)
  );

  // Campaign DB phase 3 (character sheet): char_hud.js runs in vm with a fake SupabaseAuth.
  const hudCdbSrc = fs.readFileSync(path.join(__dirname, '..', 'char_hud.js'), 'utf8');
  const hudCdbFnSrc = hudCdbSrc.slice(hudCdbSrc.indexOf('// ── Campaign DB (CAMPAIGN_PACKS_DESIGN.md, phase 3)'), hudCdbSrc.indexOf('function initCampaignRealtimeListener('));
  const cdbSheetRun = (opts) => {
    const calls = [], toasts = [];
    let saved = 0, rendered = 0;
    const fakeAuth = {
      isLocalMode: () => Boolean(opts.localMode),
      fetchCampaignPacks: (cid) => { calls.push(['fetch', cid]); return new Promise(() => {}); },
      subscribeCampaignPacks: (cid) => { calls.push(['subscribe', cid]); return {}; },
      unsubscribeCampaignPacks: (cid) => { calls.push(['unsubscribe', cid]); }
    };
    const sandbox = {
      JSON, Object, Array, Map, Set, Date, Number, String, Boolean, console,
      CampaignDb, window: { CampaignDb, SupabaseAuth: fakeAuth },
      character: opts.character, masterDb: [], packsV1: cdbPacksV1,
      saveStateToStorage: () => { saved++; }, renderAll: () => { rendered++; },
      showDiceTopToast: (t) => toasts.push(t)
    };
    vm.runInNewContext(hudCdbFnSrc + '\n' + opts.code, sandbox);
    return { sandbox, calls, toasts, saved: () => saved, rendered: () => rendered };
  };
  const cdbSheetChar = () => ({ id: 'p1', cloudCampaignId: 'cloud-uuid-1', campaignName: 'Test Camp', customDb: [{ id: 'mine', name: 'My Own Feat', type: 'Feat' }],
    specialAbilities: [{ id: boonPack.entries[5].id, name: boonPack.entries[5].name }] });
  const cdbSheetInit = cdbSheetRun({ character: cdbSheetChar(), code: 'initCampaignDbSync(character.cloudCampaignId, "load");' });
  const cdbSheetOffline = cdbSheetRun({ localMode: true, character: cdbSheetChar(), code: 'initCampaignDbSync(character.cloudCampaignId, "load");' });
  // Packs arrive; then the DM removes the whole pack (the used boon stays as "removed"); then the player leaves.
  const cdbSheetApply = cdbSheetRun({ character: cdbSheetChar(), code:
    'result = applyCampaignDbPacks("cloud-uuid-1", packsV1, "realtime"); firstDb = character.customDb.slice(); firstMaster = masterDb;' +
    'result2 = applyCampaignDbPacks("cloud-uuid-1", [], "realtime"); detachCampaignDb("cloud-uuid-1");' });
  const cdbSheetDb = cdbSheetApply.sandbox.firstDb;
  const cdbSheetAfter = cdbSheetApply.sandbox.character.customDb;
  check(
    'Campaign DB (sheet): a character in a cloud campaign subscribes to and fetches its packs (nothing while signed out); the packs become tagged copies next to the character\'s own entries, with a save, a re-render and a toast; a used entry the DM removes is kept; leaving the campaign detaches the copies',
    JSON.stringify(cdbSheetInit.calls) === JSON.stringify([['subscribe', 'cloud-uuid-1'], ['fetch', 'cloud-uuid-1']]) &&
    cdbSheetOffline.calls.length === 0 &&
    cdbSheetApply.sandbox.result.added === 107 && cdbSheetDb.length === 108 && cdbSheetDb[0].id === 'mine' &&
    cdbSheetApply.sandbox.firstMaster === cdbSheetApply.sandbox.character.customDb && cdbSheetApply.saved() >= 1 && cdbSheetApply.rendered() >= 1 &&
    /107 added/.test(cdbSheetApply.toasts[0] && cdbSheetApply.toasts[0].breakdown || '') &&
    cdbSheetApply.sandbox.result2.removed === 106 && cdbSheetApply.sandbox.result2.keptRemoved === 1 &&
    cdbSheetAfter.length === 2 && cdbSheetAfter[1]._campaignPack.status === 'detached' &&
    /initCampaignDbSync\(character\.cloudCampaignId, 'load'\)/.test(hudCdbSrc) && /initCampaignDbSync\(result\.campaign\.id, 'join'\)/.test(hudCdbSrc) &&
    /detachCampaignDb\(character\.cloudCampaignId\);\s*character\.cloudCampaignId = null;/.test(hudCdbSrc) &&
    (() => { const ix = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'); return ix.indexOf('campaign_db.js') > 0 && ix.indexOf('campaign_db.js') < ix.indexOf('char_hud.js'); })()
  );

  // Sheet: spells granted at will (DM boons) are listed as records. Named spells keep the boon's text when no DB
  // entry exists (Charm Reptiles is not SRD); a school/level filter grant is listed as that choice with its benefit line.
  {
    const awChar = JSON.parse(JSON.stringify(f05Raw));
    awChar.customDb = boonPack.entries.map(e => JSON.parse(JSON.stringify(e)));
    const lord = awChar.customDb.find(e => /boon_lord_of_reptiles$/.test(e.id));
    const abj = awChar.customDb.find(e => /boon_of_abjuration_lesser$/.test(e.id));
    awChar.specialAbilities = (awChar.specialAbilities || []).concat([JSON.parse(JSON.stringify(lord)), JSON.parse(JSON.stringify(abj))]);
    RuleEngine.recalculateCharacter(awChar, awChar.customDb);
    const spellsSrc = fs.readFileSync(path.join(__dirname, '..', 'char_spells.js'), 'utf8');
    const awFnSrc = spellsSrc.slice(spellsSrc.indexOf('function getGrantedAtWillSpellRecords('), spellsSrc.indexOf('function renderGrantedAtWillSpells('));
    const awBox = { Array, String, Number, Set, character: awChar, masterDb: [] };
    vm.runInNewContext(awFnSrc + '\nrecs = getGrantedAtWillSpellRecords(character);', awBox);
    const recs = awBox.recs || [];
    const charm = recs.find(r => r.name === 'Charm Reptiles');
    const abjRec = recs.find(r => r.isChoice && r.school === 'Abjuration');
    const ixHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    check(
      'Sheet: DM boon spell_at_will grants become At Will records: Lord of Reptiles lists Charm Reptiles and Summon Locust Swarm with the boon text, Boon of Abjuration Lesser lists "1st-level Abjuration spell of your choice" with its Benefit 1 line; nothing without such a boon',
      recs.length === 3 && charm && charm.source === lord.name && /Charm Reptiles/.test(charm.desc) &&
      recs.some(r => r.name === 'Summon Locust Swarm') &&
      abjRec && abjRec.name === '1st-level Abjuration spell of your choice' && /^Benefit 1: Choose a 1st level spell/i.test(abjRec.desc) && abjRec.source === abj.name &&
      (() => { const b = { Array, String, Number, Set, character: { grantedCapabilities: { spellsAtWill: [] } }, masterDb: [] }; vm.runInNewContext(awFnSrc + '\nr = getGrantedAtWillSpellRecords(character);', b); return b.r.length === 0; })() &&
      // The boon only on the character (empty customDb / masterDb): its name and text still come from specialAbilities.
      (() => {
        const b = { Array, String, Number, Set, masterDb: [], character: { customDb: [], specialAbilities: awChar.specialAbilities, grantedCapabilities: awChar.grantedCapabilities } };
        vm.runInNewContext(awFnSrc + '\nr = getGrantedAtWillSpellRecords(character);', b);
        const c = b.r.find(x => x.name === 'Charm Reptiles');
        return b.r.length === 3 && c && c.source === lord.name && /Charm Reptiles/.test(c.desc);
      })() &&
      /id="granted-at-will-spells"/.test(ixHtml) && /renderGrantedAtWillSpells\(\)/.test(hudCdbSrc)
    );
  }

  // Sheet: campaign Realtime HP events. The old row carries only the primary key, so every save of the character's
  // row reaches onHpChange; only a newer last_dm_hp_update_ts with a real HP change is a DM event.
  const hudSliceFn = (startMarker, endMarker) => {
    const a = hudCdbSrc.indexOf(startMarker);
    return hudCdbSrc.slice(a, hudCdbSrc.indexOf(endMarker, a + startMarker.length));
  };
  const hpListenerSrc = hudSliceFn('function initCampaignRealtimeListener(', '\n    function ');
  const hpRun = (hp, evts) => {
    const got = [];
    let handlers = null;
    const sandbox = {
      Number, character: { id: 'p1', name: 'Hero', hp },
      window: {
        SupabaseAuth: { subscribeCampaignRealtime: (cid, h) => { handlers = h; } },
        handleIncomingDmHpEvent: (e) => got.push(e)
      }
    };
    vm.runInNewContext(hpListenerSrc + '\ninitCampaignRealtimeListener("camp-1");', sandbox);
    evts.forEach(e => handlers.onHpChange(e));
    return { got, hp: sandbox.character.hp };
  };
  const hpAutosave = hpRun({ current: 14, max: 155, temp: 0, _lastDmUpdateTs: 1000 }, [
    { characterId: 'p1', currentHp: 14, tempHp: 0, lastDmHpUpdateTs: 1000 },
    { characterId: 'p1', currentHp: 14, tempHp: 0, lastDmHpUpdateTs: undefined }
  ]);
  const hpDm = hpRun({ current: 14, max: 155, temp: 0, _lastDmUpdateTs: 1000 }, [
    { characterId: 'other', currentHp: 1, tempHp: 0, lastDmHpUpdateTs: 5000 },
    { characterId: 'p1', currentHp: 20, tempHp: 0, lastDmHpUpdateTs: 2000 }
  ]);
  const hpSame = hpRun({ current: 14, max: 155, temp: 0, _lastDmUpdateTs: 1000 }, [
    { characterId: 'p1', currentHp: 14, tempHp: 0, lastDmHpUpdateTs: 3000 }
  ]);
  const hpOlderThanPlayer = hpRun({ current: 30, max: 155, temp: 0, _lastDmUpdateTs: 1000, _lastPlayerChangeTs: 4000 }, [
    { characterId: 'p1', currentHp: 14, tempHp: 0, lastDmHpUpdateTs: 3000 }
  ]);
  check(
    'Sheet: a campaign Realtime save of the character\'s row (autosave, Hub sync) is not a DM HP event; a newer DM write with an HP change gives a complete event (delta, max HP, timestamp); an unchanged HP only records the timestamp; a DM write older than the player\'s own change is ignored',
    hpAutosave.got.length === 0 &&
    hpDm.got.length === 1 && hpDm.got[0].delta === 6 && hpDm.got[0].maxHp === 155 && hpDm.got[0].timestamp === 2000 && hpDm.got[0].currentHp === 20 &&
    hpSame.got.length === 0 && hpSame.hp._lastDmUpdateTs === 3000 &&
    hpOlderThanPlayer.got.length === 0
  );

  // Sheet: cloud revalidation never swaps the requested (or already shown) character for another cloud character.
  // Run synchronously: the suite is synchronous, so the async function is de-asynced in the sandbox
  // (the fake cloud returns its rows directly).
  const revalSrc = hudSliceFn('async function revalidateCharacterFromCloudInBackground(', '\n    async function ').split('\n    function ')[0]
    .replace(/^async /, '').replace(/\bawait\s+/g, '');
  const revalRun = (search, character) => {
    const sandbox = {
      URLSearchParams, Array, Number, Date, JSON, Math, console, character,
      localStorage: { getItem: () => 'char_magnus', setItem: () => {} },
      window: {
        location: { search },
        SupabaseAuth: { isLocalMode: () => false, fetchUserCharacters: () => [{ id: 'char_magnus', name: 'Magnus', full_data: { name: 'Magnus' } }] }
      }
    };
    vm.runInNewContext(revalSrc + '\nout = revalidateCharacterFromCloudInBackground(' + JSON.stringify(new URLSearchParams(search).get('id')) + ');', sandbox);
    return sandbox;
  };
  const revalLocalOnly = revalRun('?id=char_local_new', { id: 'char_local_new', name: 'Local Hero' });
  const revalNoChar = revalRun('?id=char_missing', null);
  check(
    'Sheet: a character that is not in the cloud yet stays on the sheet (cloud revalidation does not swap in the last active cloud character); an unknown ?id= is not replaced by another character either',
    revalLocalOnly.out === false && revalLocalOnly.character.id === 'char_local_new' && revalNoChar.out === false && revalNoChar.character === null
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
