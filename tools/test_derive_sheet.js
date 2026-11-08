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
