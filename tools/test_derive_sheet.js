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
  check('03_twf_rogue_swashbuckler_lvl12: Standalone Main-Hand +2 Keen Rapier uses DEX (Weapon Finesse), threat 15-20, iteratives [20, 15, 10], & +3 base weapon damage (+1 STR + 2 Enh; Insightful Strike +3 INT routed in R1 deriveSheet)', f03.weapons[0].attackStatName.includes('DEX') && f03.weapons[0].critMin === 15 && f03.weapons[0].netAttackBonus === 20 && JSON.stringify(f03.weapons[0].iteratives) === '[20,15,10]' && f03.weapons[0].netFlatDamage === 3, `got ${JSON.stringify(f03.weapons[0])}`);
  check('03_twf_rogue_swashbuckler_lvl12: Standalone Off-Hand +1 Flaming Short Sword has +19 Attack & extra Flaming 1d6 damagePart', f03.weapons[1].extraDamagePartsCount === 1 && f03.weapons[1].netAttackBonus === 19, `got ${JSON.stringify(f03.weapons[1])}`);

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
  // Forward-Compatible `RuleEngine.deriveSheet` Two-Pass Immutability & Parity Gate
  // --------------------------------------------------------------------------
  if (typeof RuleEngine.deriveSheet === 'function') {
    const allFixtures = [f01Raw, f02Raw, f03Raw, f04Raw, f05Raw];
    for (const raw of allFixtures) {
      const baseline = computeBaselineMetrics(raw);
      const viewModel = verifyPureExecution(
        (c, db) => RuleEngine.deriveSheet(c, db),
        raw,
        raw.customDb || []
      );
      check(`deriveSheet(${raw.name}): two-pass immutability & viewModel truthy`, Boolean(viewModel && viewModel.ac && viewModel.saves));
      check(`deriveSheet(${raw.name}): AC parity`, viewModel.ac.total === baseline.ac.total && viewModel.ac.touch === baseline.ac.touch && viewModel.ac.flatFooted === baseline.ac.flatFooted);
      check(`deriveSheet(${raw.name}): Saves parity`, viewModel.saves.fort === baseline.saves.fort && viewModel.saves.ref === baseline.saves.ref && viewModel.saves.will === baseline.saves.will);
    }
  }

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
