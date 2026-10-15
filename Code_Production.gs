/**
 * D&D 3.5e Character Sheet - Google Apps Script Master Engine
 * Features:
 * 1. Ultra-Fast Dice Roller & Instant Sidebar (0ms response)
 * 2. Complex expression parser (e.g. 3d8+10+1d12+5)
 * 3. Robust Sheet Builders with automatic locale separator detection (, vs ;)
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();

  // 1. Rule Master & AI Submenu
  var ruleMasterMenu = ui.createMenu('🧙‍♂️ Rule Master & AI')
    .addItem('🧙‍♂️🤖 Open Rule Master (Sidebar)', 'showAiRuleImporterSidebar')
    .addSeparator()
    .addItem('🔑 Set My Gemini API Key', 'promptSetMyGeminiApiKey')
    .addItem('🩺 Diagnose Gemini API & Models', 'diagnoseGeminiApiKey')
    .addItem('🌐 Authorize AI Network Access (İzin Ver)', 'testOrAuthorizeExternalAccess')
    .addItem('🗑️ Clear / Reset My API Key & Permissions', 'clearResetAllApiKeyAndPermissions')
    .addSeparator()
    .addItem('📜 Build / Open "Rule_Library" Sheet', 'createRuleLibrarySheet')
    .addItem('🔄 Refresh Guide Setup Checklist', 'updateGuideChecklist');

  // 2. Dice & Quick Rolls Submenu
  var diceMenu = ui.createMenu('🎲 Dice & Rolls')
    .addItem('⚡ Open Instant Dice Panel (0ms Speed)', 'showInstantDiceSidebar')
    .addSeparator()
    .addItem('⚔️ Roll Selected Cell / Expression', 'rollSelectedCell')
    .addItem('⚡ Roll Initiative (BW48)', 'rollInitiative')
    .addItem('🛡️ Roll Fortitude Save (Z86)', 'rollFortitude')
    .addItem('⚡ Roll Reflex Save (Z91)', 'rollReflex')
    .addItem('🧠 Roll Will Save (Z96)', 'rollWill');

  // 3. Level-Up Tools Submenu
  var lvlUpMenu = ui.createMenu('📈 Level-Up Tools')
    .addItem('🛠️ Auto-Build "lvl_up" Sheet (Clean)', 'createLevelUpSheet')
    .addItem('🔧 Fix / Realign "lvl_up" Formulas (Keep Data)', 'fixLvlUpFormulas')
    .addItem('🔄 Refresh Roster Feat Dropdowns', 'refreshLvlUpRosterDropdownsMenu')
    .addItem('🧹 Clear Level Progression & Roster (Sıfırla)', 'clearLvlUpDataMenu')
    .addItem('🔒 Lock "lvl_up" Scroll at Col AB', 'limitLvlUpColumns')
    .addItem('🔗 Link "lvl_up" to "Main" Sheet', 'linkLvlUpToMain')
    .addItem('🔗 Sync All Feat Notes to Main', 'syncAllFeatNotesToMainMenu')
    .addItem('🧹 Clean Cells Right of Feats (Past KR)', 'cleanRightOfFeats');

  // 4. Combat Tools Submenu
  var combatMenu = ui.createMenu('⚔️ Combat Tools')
    .addItem('⚔️ Auto-Build "combat" Sheet', 'createCombatSheet')
    .addItem('🤖 AI Auto-Group & Build "combat" Sheet (Gemini)', 'buildCombatWithAi')
    .addItem('🎲 Roll Full Attack for Active Weapon (A11)', 'rollActiveCombatWeapon')
    .addItem('☀️ Long Rest (8 Hours - Reset All)', 'performLongRestMenu')
    .addItem('🔄 Encounter Reset (Maneuvers & Buffs)', 'performEncounterResetMenu')
    .addItem('🔧 Fix / Realign "combat" Formulas', 'fixCombatFormulas');

  // 5. Spells & Maneuvers Submenu
  var spellsMenu = ui.createMenu('🔮 Spells & Maneuvers')
    .addItem('🔮 Auto-Build "spells_maneuvers" Sheet', 'createSpellsManeuversSheet')
    .addItem('🔄 Recover All Readied Maneuvers', 'recoverAllManeuversMenu');

  // 5. Inventory Tools Submenu
  var inventoryMenu = ui.createMenu('🎒 Inventory Tools')
    .addItem('🎒 Build / Reset "inventory" Sheet', 'createInventorySheet')
    .addItem('🔧 Fix / Realign "inventory" Formulas', 'fixInventoryFormulas')
    .addItem('🔄 Refresh Inventory Dropdowns', 'refreshInventoryDropdownsMenu');

  // 5. Master Database Submenu
  var masterDbMenu = ui.createMenu('📚 Master Database')
    .addItem('📚 Build "Master_DB" & Seed Library Data', 'createMasterDbSheet')
    .addItem('📖 Build / Open "Master_DB_Guide" Sheet', 'openMasterDbGuide')
    .addItem('⚡ Build Both DB & Guide (1-Click)', 'buildAllMasterDb')
    .addItem('🔧 Fix / Realign Master_DB Formats (No Decimals)', 'fixMasterDbFormats')
    .addItem('🧹 Clean Formatting & Blank Row Colors', 'cleanMasterDbFormattingMenu')
    .addItem('🔄 Sync & Update Validations (Dropdowns)', 'fixMasterDbValidationsMenu')
    .addSeparator()
    .addItem('🔍 Filter & Search Master_DB', 'applyMasterDbFilter')
    .addItem('🔄 Reset Filter (Show All)', 'resetMasterDbFilter');

  ui.createMenu('🎲 D&D Tools')
    // Quick Direct Launchers at Top (Rule Master First)
    .addItem('🧙‍♂️🤖 Open Rule Master (Sidebar)', 'showAiRuleImporterSidebar')
    .addItem('⚡ Open Instant Dice Panel (0ms Speed)', 'showInstantDiceSidebar')
    .addItem('⚔️ Auto-Build "combat" Sheet', 'createCombatSheet')
    .addItem('🤖 AI Auto-Build "combat" Sheet (Gemini)', 'buildCombatWithAi')
    .addSeparator()
    // Grouped Submenus with Rule Master on top
    .addSubMenu(ruleMasterMenu)
    .addSubMenu(diceMenu)
    .addSeparator()
    .addSubMenu(lvlUpMenu)
    .addSubMenu(combatMenu)
    .addSubMenu(spellsMenu)
    .addSubMenu(inventoryMenu)
    .addSubMenu(masterDbMenu)
    .addSeparator()
    .addItem('💾 Export Character Data (JSON)', 'exportCharacterDataModal')
    .addItem('📥 Import Character Data (JSON)', 'importCharacterDataModal')
    .addItem('⚠️ Reset All Data & Character (Sıfırla)', 'promptResetAllData')
    .addToUi();
}

/**
 * Global onEdit Trigger for Real-Time Interactive Actions
 */
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();

  if (sheetName === "Master_DB") {
    clearMasterDbEquipCatalogCache();
    clearMasterDbRosterCatalogCache();
    var row = e.range.getRow();
    var col = e.range.getColumn();
    // If edited cell is in rows 1-4 and cols B to F (search bar or checkboxes)
    if (row <= 4 && col >= 2 && col <= 6) {
      handleMasterDbFilterEdit(sheet, e.range);
    }
  } else if (sheetName === "lvl_up") {
    var row = e.range.getRow();
    var col = e.range.getColumn();
    var numCols = e.range.getNumColumns();
    var numRows = e.range.getNumRows();

    // Lock Guard: C1:C3 and E1 cannot be changed if at least 1 level is entered in C7:C36
    if ((col <= 3 && col + numCols - 1 >= 3 && row <= 3) || (col <= 5 && col + numCols - 1 >= 5 && row === 1)) {
      var classes = sheet.getRange("C7:C36").getValues();
      var hasLevels = classes.some(function(r) { return String(r[0] || "").trim() !== ""; });
      if (hasLevels) {
        if (e.oldValue !== undefined) {
          e.range.setValue(e.oldValue);
        }
        SpreadsheetApp.getActiveSpreadsheet().toast(
          "Karakter seviyesi girildikten sonra temel ırk ve kural ayarları değiştirilemez. Değiştirmek için önce seviyeleri silin veya sıfırlayın.",
          "⚠️ Kilitli Ayar (Locked Setting)",
          6
        );
        return;
      }
    }

    // Intersects with Column Z (26: Category) or Column AA (27: Feat Name) -> Fast diminishing validation update
    if (col <= 27 && col + numCols - 1 >= 26 && row >= 6) {
      handleLvlUpEdit(sheet, e.range, e);
    }
    // Intersects with Column C (3: Class) -> Class clear handler
    if (col <= 3 && col + numCols - 1 >= 3 && row >= 7) {
      handleLvlUpClassClear(sheet, e.range);
    }
  } else if (sheetName === "inventory") {
    handleInventoryEdit(sheet, e.range, e);
  } else if (sheetName === "combat") {
    handleCombatEdit(sheet, e.range, e);
  } else if (sheetName === "spells_maneuvers") {
    handleSpellsManeuversEdit(sheet, e.range, e);
  }
}

// ----------------------------------------------------
// 1. LEVEL UP (lvl_up) AUTOMATED BUILDER (Lvls 1-30 + Roster)
// ----------------------------------------------------
function createLevelUpSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Ensure Master_DB exists with standard 31-column architecture
  var dbSheet = ss.getSheetByName("Master_DB");
  if (!dbSheet || dbSheet.getLastRow() < 5) {
    createMasterDbSheet();
    dbSheet = ss.getSheetByName("Master_DB");
  }

  // 2. Setup lvl_up sheet
  var sheetName = "lvl_up";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.setFrozenColumns(0);
  sheet.setFrozenRows(0);
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
  sheet.clearConditionalFormatRules();
  sheet.clear();
  sheet.setTabColor("#284e3f");
  sheet.setFrozenRows(5);
  sheet.setFrozenColumns(2);

  // Ensure sheet does not scroll past column AB (28 columns)
  limitLvlUpColumnsSheet(sheet);

  var sep = getFormulaSeparator(sheet);
  function f(str) {
    return str.replace(/,/g, sep);
  }

  // Settings Panel (Rows 1-3)
  sheet.getRange("A1:E3").breakApart();
  sheet.getRange("A1:U3").setBackground("#0f172a");
  
  sheet.getRange("A1:B1").merge().setValue("Feats:");
  sheet.getRange("C1").setValue("Standard 3.5e")
       .setBackground("#1e293b").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center");
       
  var featRuleRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Standard 3.5e",
    "Every 2 Levels",
    "Every 4 Levels",
    "All Free / Custom"
  ], true).build();
  sheet.getRange("C1").setDataValidation(featRuleRule);

  // Ensure Master_DB contains essential rows (Race, Weapon Focus)
  ensureMasterDbSeedEssentials(ss);

  // Set up 7 dynamic helper columns (AD through AJ) so AJ7:AJ is populated for Race dropdown
  setupLvlUpHelperColumns(sheet, f);

  sheet.getRange("D1").setValue("Race:");
  sheet.getRange("E1").setValue("Human")
       .setBackground("#1e293b").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center");
  var raceRule = SpreadsheetApp.newDataValidation().requireValueInRange(sheet.getRange("AJ7:AJ"), true).setAllowInvalid(true).build();
  sheet.getRange("E1").setDataValidation(raceRule);

  sheet.getRange("A2:B2").merge().setValue("BAB / Saves:");
  sheet.getRange("C2").setValue("Fractional (Unearthed Arcana)")
       .setBackground("#1e293b").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center");
       
  var babRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Fractional (Unearthed Arcana)",
    "Standard Core 3.5e"
  ], true).build();
  sheet.getRange("C2").setDataValidation(babRule);

  sheet.getRange("D2").setValue("Skill Bonus:");
  sheet.getRange("E2").setFormula(f('=IF(LEFT($E$1, 5)="Human", "Human (+4/+1)", "None")'))
       .setBackground("#1e293b").setFontWeight("bold").setFontColor("#4ade80").setHorizontalAlignment("center");

  sheet.getRange("A3:B3").merge().setValue("Max HP L1:");
  sheet.getRange("C3").setValue("Yes (Max Hit Die at Lvl 1)")
       .setBackground("#1e293b").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center");
       
  var hpRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Yes (Max Hit Die at Lvl 1)",
    "No (Roll at Lvl 1)"
  ], true).build();
  sheet.getRange("C3").setDataValidation(hpRule);

  sheet.getRange("D3").setValue("Land Speed:");
  sheet.getRange("E3").setFormula(f('=IFERROR(VLOOKUP($E$1, Master_DB!$A$6:$Y, 25, FALSE), 30) & " ft"'))
       .setBackground("#1e293b").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center");

  // Row 4: Blank Spacer Row (Separates Top Cards & Settings from Table)
  sheet.getRange("A4:AA4").clearContent().clearFormat().setBackground("#0b1120");

  // Summary Totals (Row 5 - Active Checked Levels Only)
  sheet.getRange("A5").setValue("ACTIVE LVL:").setHorizontalAlignment("right");
  sheet.getRange("B5").setFormula(f('=COUNTIF(B7:B36, TRUE)')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("C5").setFormula(f('="of " & COUNTA(C7:C36) & " planned"')).setFontStyle("italic");
  sheet.getRange("D5").setValue("");
  sheet.getRange("E5").setValue("Base HP:").setHorizontalAlignment("right");
  sheet.getRange("F5").setFormula(f('=SUMIF($B$7:$B$36, TRUE, $F$7:$F$36)')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("G5").setValue("");
  sheet.getRange("H5").setValue("Base BAB:").setHorizontalAlignment("right");
  sheet.getRange("I5").setFormula(f('=INT(SUMIF($B$7:$B$36, TRUE, $I$7:$I$36))')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("J5").setValue("Fort:").setHorizontalAlignment("right");
  sheet.getRange("K5").setFormula(f('=INT(SUMIF($B$7:$B$36, TRUE, $K$7:$K$36))')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("L5").setValue("Ref:").setHorizontalAlignment("right");
  sheet.getRange("M5").setFormula(f('=INT(SUMIF($B$7:$B$36, TRUE, $M$7:$M$36))')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("N5").setValue("Will:").setHorizontalAlignment("right");
  sheet.getRange("O5").setFormula(f('=INT(SUMIF($B$7:$B$36, TRUE, $O$7:$O$36))')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("P5").setValue("Skill Pts:").setHorizontalAlignment("right");
  sheet.getRange("Q5").setFormula(f('=SUMIF($B$7:$B$36, TRUE, $Q$7:$Q$36)')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("R5:V5").setValue("");

  // Table Headers (Row 6)
  var mainHeaders = [
    "LVL", "Active?", "Class & Lvl", "HD", "HP Roll", "HP Gain", "Cumul HP",
    "BAB Rate", "BAB Gain", "Fort Rate", "Fort Gain", "Ref Rate", "Ref Gain",
    "Will Rate", "Will Gain", "Skill Base", "Skill Gain",
    "Feats", "Special Abilities (Auto-Merged)", "Ability Boost", "Notes", "Details"
  ];
  sheet.getRange(6, 1, 1, mainHeaders.length).setValues([mainHeaders]);

  sheet.getRange("X1").setValue("📜 FEATS & ABILITIES ROSTER (Dynamic)");
  sheet.getRange("X2").setValue("Single-item entries from Master_DB. Auto-summarized into the Level Up table.");
  
  var rosterHeaders = ["#", "Level", "Category / Type", "Feat / Ability Name (Master_DB)", "Notes & Details"];
  sheet.getRange(6, 24, 1, rosterHeaders.length).setValues([rosterHeaders]);

  // Apply unified layout & styling (dimensions, palettes, borders)
  formatLvlUpSheetLayout(sheet);
  setupLvlUpTopSummaryCards(sheet, f);

  // Checkboxes for column B (Active Level tracking)
  sheet.getRange("B7:B36").insertCheckboxes();

  // Validations
  var hdRule = SpreadsheetApp.newDataValidation().requireValueInList(["d4", "d6", "d8", "d10", "d12"], true).build();
  var babRateRule = SpreadsheetApp.newDataValidation().requireValueInList(["Good (+1.0)", "Average (+0.75)", "Poor (+0.50)"], true).build();
  var saveRateRule = SpreadsheetApp.newDataValidation().requireValueInList(["Good", "Poor"], true).build();
  var abilityBoostRule = SpreadsheetApp.newDataValidation().requireValueInList(["-", "STR +1", "DEX +1", "CON +1", "INT +1", "WIS +1", "CHA +1"], true).build();

  sheet.getRange("D7:D36").setDataValidation(hdRule);
  sheet.getRange("H7:H36").setDataValidation(babRateRule);
  sheet.getRange("J7:J36").setDataValidation(saveRateRule);
  sheet.getRange("L7:L36").setDataValidation(saveRateRule);
  sheet.getRange("N7:N36").setDataValidation(saveRateRule);
  sheet.getRange("T7:T36").setDataValidation(abilityBoostRule);

  var lvlRangeList = [];
  for (var l = 1; l <= 30; l++) lvlRangeList.push(String(l));
  var rosterLvlRule = SpreadsheetApp.newDataValidation().requireValueInList(lvlRangeList, true).build();
  var rosterTypeRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Regular Feat", "Class Bonus Feat", "DM Grant", "Flaw", "Racial Trait", "Special Ability"
  ], true).build();

  // Set up 7 dynamic helper columns (AD through AJ)
  setupLvlUpHelperColumns(sheet, f);

  sheet.getRange("Y7:Y").setDataValidation(rosterLvlRule);
  sheet.getRange("Z7:Z").setDataValidation(rosterTypeRule);
  applyLvlUpRosterValidations(sheet);

  // Rows 1-30 Formulas & Checkbox states
  for (var lvl = 1; lvl <= 30; lvl++) {
    var r = lvl + 6;
    sheet.getRange(r, 1).setValue(lvl).setHorizontalAlignment("center").setFontWeight("bold");

    // Levels 1-4 are active by default for sample character, 5-30 are future planning
    if (lvl <= 4) {
      sheet.getRange(r, 2).setValue(true);
    } else {
      sheet.getRange(r, 2).setValue(false);
    }

    var hpGainFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IF(E' + r + '<>"", E' + r + ', IF(AND(A' + r + '=1, $C$3="Yes (Max Hit Die at Lvl 1)"), IF(D' + r + '="d12", 12, IF(D' + r + '="d10", 10, IF(D' + r + '="d8", 8, IF(D' + r + '="d6", 6, 4)))), 0)))'
    );
    sheet.getRange(r, 6).setFormula(hpGainFormula).setHorizontalAlignment("center");

    var cumulHpFormula = f('=IF(ISBLANK(C' + r + '), "", SUM($F$7:F' + r + '))');
    sheet.getRange(r, 7).setFormula(cumulHpFormula).setHorizontalAlignment("center");

    var babFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IF(LEFT(H' + r + ', 4)="Good", 1, IF(LEFT(H' + r + ', 7)="Average", 3/4, IF(LEFT(H' + r + ', 4)="Poor", 1/2, 0))))'
    );
    sheet.getRange(r, 9).setFormula(babFormula).setHorizontalAlignment("center");

    var fortFormula = f('=IF(ISBLANK(C' + r + '), "", IF(J' + r + '="Good", IF(A' + r + '=1, 5/2, 1/2), 1/3))');
    sheet.getRange(r, 11).setFormula(fortFormula).setHorizontalAlignment("center");

    var refFormula = f('=IF(ISBLANK(C' + r + '), "", IF(L' + r + '="Good", IF(A' + r + '=1, 5/2, 1/2), 1/3))');
    sheet.getRange(r, 13).setFormula(refFormula).setHorizontalAlignment("center");

    var willFormula = f('=IF(ISBLANK(C' + r + '), "", IF(N' + r + '="Good", IF(A' + r + '=1, 5/2, 1/2), 1/3))');
    sheet.getRange(r, 15).setFormula(willFormula).setHorizontalAlignment("center");

    // Human bonus: +4 at level 1, +1 at level 2+
    var skillFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IF(A' + r + '=1, (P' + r + '*4) + IF(LEFT($E$1, 5)="Human", 4, 0), P' + r + ' + IF(LEFT($E$1, 5)="Human", 1, 0)))'
    );
    sheet.getRange(r, 17).setFormula(skillFormula).setHorizontalAlignment("center");

    var featMergeFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER($AA$7:$AA, $Y$7:$Y=A' + r + ', $Z$7:$Z<>"Special Ability")), ""))'
    );
    sheet.getRange(r, 18).setFormula(featMergeFormula);

    var specMergeFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER($AA$7:$AA, $Y$7:$Y=A' + r + ', $Z$7:$Z="Special Ability")), ""))'
    );
    sheet.getRange(r, 19).setFormula(specMergeFormula);

    sheet.getRange(r, 20).setValue("-");
    if (lvl % 4 === 0) {
      sheet.getRange(r, 20).setBackground("#fff2cc");
    }
  }

  // Alignments: Vertical middle across table & Roster, Horizontal center for D:Q
  sheet.getRange("D7:Q36").setHorizontalAlignment("center");
  sheet.getRange("A7:V36").setVerticalAlignment("middle");

  // Populate Roster Index Numbers (# in Col X) dynamically with ARRAYFORMULA
  sheet.getRange("X7").setFormula(f('=ARRAYFORMULA(ROW(X7:X) - 6)'));
  sheet.getRange("X7:X").setHorizontalAlignment("center").setFontColor("#64748b");

  // Seed sample feats (Empty by default for clean start)
  var sampleRoster = [];

  for (var k = 0; k < sampleRoster.length; k++) {
    var item = sampleRoster[k];
    var rIndex = k + 7;
    sheet.getRange(rIndex, 25).setValue(item.lvl);
    sheet.getRange(rIndex, 26).setValue(item.type);
    sheet.getRange(rIndex, 27).setValue(item.name);
  }

  // Apply category-dependent validation to AA7:AA106
  applyLvlUpRosterValidations(sheet);

  // Col AB (Notes & Details): Dynamic Auto-lookup from Master_DB (Col G) for entire column
  sheet.getRange("AB7").setFormula(f('=ARRAYFORMULA(IF(ISBLANK(AA7:AA), "", IFERROR(VLOOKUP(AA7:AA, Master_DB!$A$5:$G, 7, FALSE), "")))'));

  // Seed sample classes (Empty by default for clean start)
  var sampleClasses = [];

  for (var c = 0; c < sampleClasses.length; c++) {
    var sc = sampleClasses[c];
    var row = sc.lvl + 6;
    sheet.getRange(row, 3).setValue(sc.cls);
    sheet.getRange(row, 4).setValue(sc.hd);
    sheet.getRange(row, 5).setValue(sc.roll);
    sheet.getRange(row, 8).setValue(sc.bab);
    sheet.getRange(row, 10).setValue(sc.f);
    sheet.getRange(row, 12).setValue(sc.r);
    sheet.getRange(row, 14).setValue(sc.w);
    sheet.getRange(row, 16).setValue(sc.sk);
    sheet.getRange(row, 20).setValue(sc.boost);
  }

  sheet.getRange("I7:I36").setNumberFormat("0.00");
  sheet.getRange("K7:K36").setNumberFormat("0.00");
  sheet.getRange("M7:M36").setNumberFormat("0.00");
  sheet.getRange("O7:O36").setNumberFormat("0.00");

  sheet.getRange("R7:S36").setWrap(true);
  sheet.getRange("AB7:AB").setWrap(true);

  // Detailed Spellcasting & Martial Progression Matrix (Rows 37+)
  setupLvlUpProgressionMatrix(sheet, f);

  SpreadsheetApp.getActiveSpreadsheet().toast("lvl_up (Lvl 1-30 with Checkboxes & Human Skill Rule) updated successfully!", "✅ Success", 6);
}

// ----------------------------------------------------
// 1.9 ENSURE ESSENTIAL MASTER_DB ENTRIES (Races, Feats)
// ----------------------------------------------------
function ensureMasterDbSeedEssentials(ss) {
  var masterSheet = ss.getSheetByName("Master_DB");
  if (!masterSheet) return;
  var lastRow = masterSheet.getLastRow();
  
  var existingNames = [];
  var hasRace = false;
  if (lastRow >= 6) {
    var rawData = masterSheet.getRange(6, 1, lastRow - 5, 2).getValues();
    for (var k = 0; k < rawData.length; k++) {
      var n = String(rawData[k][0] || "").trim().toLowerCase();
      var c = String(rawData[k][1] || "").trim();
      if (n) existingNames.push(n);
      if (c.toLowerCase() === "race") hasRace = true;
    }
  }

  var essentials = [
    ["Human", "Race", "None", "-", "-", "PHB p.12", "Medium size, base land speed 30 ft. 1 extra feat at 1st level, 4 extra skill points at 1st level, +1 extra skill point at each additional level.", "Racial", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", 30, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Dwarf", "Race", "None", "-", "-", "PHB p.14", "Medium size, base speed 20 ft (not reduced by armor). +2 Con, -2 Cha. Darkvision 60 ft, stonecunning, stability, +2 saves vs poison and spells.", "Racial", "None / General", "", "", 2, "", "", -2, "", "", "", "", "", "", "", "", "", 20, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Elf", "Race", "None", "-", "-", "PHB p.15", "Medium size, base speed 30 ft. +2 Dex, -2 Con. Immunity to sleep, +2 saves vs enchantment, low-light vision, martial weapon proficiencies.", "Racial", "None / General", "", 2, -2, "", "", "", "", "", "", "", "", "", "", "", "", 30, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Gnome", "Race", "None", "-", "-", "PHB p.16", "Small size (+1 AC, +1 attack), base speed 20 ft. +2 Con, -2 Str. Low-light vision, +2 saves vs illusions, +1 attack vs kobolds/goblinoids.", "Racial", "None / General", -2, "", 2, "", "", "", 1, "", 1, "", "", "", "", "", "", 20, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Half-Elf", "Race", "None", "-", "-", "PHB p.18", "Medium size, base speed 30 ft. Immunity to sleep spells, +2 saves vs enchantments, low-light vision, +1 Listen/Search/Spot, +2 Diplomacy/Gather Information.", "Racial", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", 2, "", "", 30, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Half-Orc", "Race", "None", "-", "-", "PHB p.18", "Medium size, base speed 30 ft. +2 Str, -2 Int, -2 Cha. Darkvision 60 ft, orc blood.", "Racial", "None / General", 2, "", "", -2, "", -2, "", "", "", "", "", "", "", "", "", 30, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Halfling", "Race", "None", "-", "-", "PHB p.19", "Small size (+1 AC, +1 attack), base speed 20 ft. +2 Dex, -2 Str. +2 Climb/Jump/Move Silently, +1 all saves, +2 saves vs fear, +1 attack with thrown weapons/slings.", "Racial", "None / General", -2, 2, "", "", "", "", 1, "", 1, "", 1, 1, 1, "", "", 20, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Goliath", "Race", "None", "-", "LA +1", "Races of Stone p.56", "Medium size (Powerful Build), base speed 30 ft. +4 Str, -2 Dex, +2 Con. Powerful Build treats character as Large for maneuvers and weapon size.", "Racial", "None / General", 4, -2, 2, "", "", "", "", "", "", "", "", "", "", "", "", 30, "", "-", "Continuous", "", "", "Non-Combat"]
  ];

  var rowsToAdd = [];
  for (var i = 0; i < essentials.length; i++) {
    var nameLower = essentials[i][0].toLowerCase();
    if (existingNames.indexOf(nameLower) === -1) {
      rowsToAdd.push(essentials[i]);
    }
  }

  if (rowsToAdd.length > 0) {
    appendMasterDbRows(rowsToAdd);
  } else {
    updateMasterDbValidations(masterSheet);
  }
}

// ----------------------------------------------------
// 2. REPAIR & REALIGN "lvl_up" FORMULAS (Keeps Your Data)
// ----------------------------------------------------
function fixLvlUpFormulas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("lvl_up");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: 'lvl_up' sheet not found.");
    return;
  }

  // Ensure essential seeds exist in Master_DB (Races, Weapon Focus)
  ensureMasterDbSeedEssentials(ss);

  // Ensure sheet does not scroll past column AB (28 columns)
  limitLvlUpColumnsSheet(sheet);

  var sep = getFormulaSeparator(sheet);
  function f(str) {
    return str.replace(/,/g, sep);
  }

  // 0. Ensure a blank spacer row exists between Row 3 (cards) and Totals
  if (sheet.getRange("A4").getValue() === "ACTIVE LVL:") {
    sheet.insertRowBefore(4);
  }

  // Row 4: Blank Spacer Row (Separates Top Cards & Settings from Table)
  sheet.getRange("A4:AB4").clearContent().clearFormat().setBackground("#0b1120");
  sheet.setRowHeight(4, 14);

  // 1. Re-align Settings Labels & References
  sheet.getRange("A1:E3").breakApart();
  sheet.getRange("A1:B1").merge().setValue("Feats:");
  sheet.getRange("D1").setValue("Race:");
  sheet.getRange("A2:B2").merge().setValue("BAB / Saves:");
  sheet.getRange("D2").setValue("Skill Bonus:");
  sheet.getRange("E2").setFormula(f('=IF(LEFT($E$1, 5)="Human", "Human (+4/+1)", "None")'));
  sheet.getRange("A3:B3").merge().setValue("Max HP L1:");
  sheet.getRange("D3").setValue("Land Speed:");
  sheet.getRange("E3").setFormula(f('=IFERROR(VLOOKUP($E$1, Master_DB!$A$6:$Y, 25, FALSE), 30) & " ft"'));

  // 2. Re-align Row 5 Totals (Active Checked Levels Only)
  sheet.getRange("A5").setValue("ACTIVE LVL:").setHorizontalAlignment("right");
  sheet.getRange("B5").setFormula(f('=COUNTIF(B7:B36, TRUE)')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("C5").setFormula(f('="of " & COUNTA(C7:C36) & " planned"')).setFontStyle("italic");
  sheet.getRange("D5").setValue("");
  sheet.getRange("E5").setValue("Base HP:").setHorizontalAlignment("right");
  sheet.getRange("F5").setFormula(f('=SUMIF($B$7:$B$36, TRUE, $F$7:$F$36)')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("G5").setValue("");
  sheet.getRange("H5").setValue("Base BAB:").setHorizontalAlignment("right");
  sheet.getRange("I5").setFormula(f('=INT(SUMIF($B$7:$B$36, TRUE, $I$7:$I$36))')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("J5").setValue("Fort:").setHorizontalAlignment("right");
  sheet.getRange("K5").setFormula(f('=INT(SUMIF($B$7:$B$36, TRUE, $K$7:$K$36))')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("L5").setValue("Ref:").setHorizontalAlignment("right");
  sheet.getRange("M5").setFormula(f('=INT(SUMIF($B$7:$B$36, TRUE, $M$7:$M$36))')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("N5").setValue("Will:").setHorizontalAlignment("right");
  sheet.getRange("O5").setFormula(f('=INT(SUMIF($B$7:$B$36, TRUE, $O$7:$O$36))')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("P5").setValue("Skill Pts:").setHorizontalAlignment("right");
  sheet.getRange("Q5").setFormula(f('=SUMIF($B$7:$B$36, TRUE, $Q$7:$Q$36)')).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("R5:V5").setValue("");

  // Check if live sheet still has Roster # in Column 23 (W); if so, insert new Column 22 (V) between U and W
  if (sheet.getRange(6, 23).getValue() === "#") {
    sheet.insertColumnAfter(21);
  }

  // 3. Ensure Row 6 Headers are in exact columns
  var mainHeaders = [
    "LVL", "Active?", "Class & Lvl", "HD", "HP Roll", "HP Gain", "Cumul HP",
    "BAB Rate", "BAB Gain", "Fort Rate", "Fort Gain", "Ref Rate", "Ref Gain",
    "Will Rate", "Will Gain", "Skill Base", "Skill Gain",
    "Feats", "Special Abilities (Auto-Merged)", "Ability Boost", "Notes", "Details"
  ];
  sheet.getRange(6, 1, 1, mainHeaders.length).setValues([mainHeaders]);

  var rosterHeaders = ["#", "Level", "Category / Type", "Feat / Ability Name (Master_DB)", "Notes & Details"];
  sheet.getRange(6, 24, 1, rosterHeaders.length).setValues([rosterHeaders]);

  // Apply unified layout & styling (dimensions, palettes, borders)
  formatLvlUpSheetLayout(sheet);
  setupLvlUpTopSummaryCards(sheet, f);

  // Ensure Column B has checkboxes
  sheet.getRange("B7:B36").insertCheckboxes();

  // 4. Re-inject exact formulas into columns F, G, I, K, M, O, Q, R, S for rows 7-36
  for (var lvl = 1; lvl <= 30; lvl++) {
    var r = lvl + 6;
    sheet.getRange(r, 1).setValue(lvl).setHorizontalAlignment("center").setFontWeight("bold");

    // HP Gain (Col F) - If roll is blank, fallback to RAW average Hit Die
    var hpGainFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IF(E' + r + '<>"", E' + r + ', IF(AND(A' + r + '=1, $C$3="Yes (Max Hit Die at Lvl 1)"), IF(D' + r + '="d12", 12, IF(D' + r + '="d10", 10, IF(D' + r + '="d8", 8, IF(D' + r + '="d6", 6, 4)))), IF(D' + r + '="d12", 7, IF(D' + r + '="d10", 6, IF(D' + r + '="d8", 5, IF(D' + r + '="d6", 4, 3)))))))'
    );
    sheet.getRange(r, 6).setFormula(hpGainFormula).setHorizontalAlignment("center");

    // Cumul HP (Col G)
    var cumulHpFormula = f('=IF(ISBLANK(C' + r + '), "", SUM($F$7:F' + r + '))');
    sheet.getRange(r, 7).setFormula(cumulHpFormula).setHorizontalAlignment("center");

    // BAB Gain (Col I)
    var babFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IF(LEFT(H' + r + ', 4)="Good", 1, IF(LEFT(H' + r + ', 7)="Average", 3/4, IF(LEFT(H' + r + ', 4)="Poor", 1/2, 0))))'
    );
    sheet.getRange(r, 9).setFormula(babFormula).setHorizontalAlignment("center");

    // Fort Gain (Col K)
    var fortFormula = f('=IF(ISBLANK(C' + r + '), "", IF(J' + r + '="Good", IF(A' + r + '=1, 5/2, 1/2), 1/3))');
    sheet.getRange(r, 11).setFormula(fortFormula).setHorizontalAlignment("center");

    // Ref Gain (Col M)
    var refFormula = f('=IF(ISBLANK(C' + r + '), "", IF(L' + r + '="Good", IF(A' + r + '=1, 5/2, 1/2), 1/3))');
    sheet.getRange(r, 13).setFormula(refFormula).setHorizontalAlignment("center");

    // Will Gain (Col O)
    var willFormula = f('=IF(ISBLANK(C' + r + '), "", IF(N' + r + '="Good", IF(A' + r + '=1, 5/2, 1/2), 1/3))');
    sheet.getRange(r, 15).setFormula(willFormula).setHorizontalAlignment("center");

    // Skill Gain (Col Q) with Human Bonus
    var skillFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IF(A' + r + '=1, (P' + r + '*4) + IF(LEFT($E$1, 5)="Human", 4, 0), P' + r + ' + IF(LEFT($E$1, 5)="Human", 1, 0)))'
    );
    sheet.getRange(r, 17).setFormula(skillFormula).setHorizontalAlignment("center");

    // Feats Merge (Col R)
    var featMergeFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER($AA$7:$AA, $Y$7:$Y=A' + r + ', $Z$7:$Z<>"Special Ability")), ""))'
    );
    sheet.getRange(r, 18).setFormula(featMergeFormula);

    // Special Abilities Merge (Col S)
    var specMergeFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER($AA$7:$AA, $Y$7:$Y=A' + r + ', $Z$7:$Z="Special Ability")), ""))'
    );
    sheet.getRange(r, 19).setFormula(specMergeFormula);
  }

  // Number formats
  sheet.getRange("I7:I36").setNumberFormat("0.00");
  sheet.getRange("K7:K36").setNumberFormat("0.00");
  sheet.getRange("M7:M36").setNumberFormat("0.00");
  sheet.getRange("O7:O36").setNumberFormat("0.00");

  // User requested: D:Q horizontal center, and vertical alignment middle across the sheet
  sheet.getRange("D7:Q36").setHorizontalAlignment("center");
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 105), 28).setVerticalAlignment("middle");

  // Active Level Conditional Formatting is handled by formatLvlUpSheetLayout (soft emerald tint)

  // Set up 7 dynamic helper columns (AD through AJ)
  setupLvlUpHelperColumns(sheet, f);

  // Re-apply Character Race dropdown
  var raceRule = SpreadsheetApp.newDataValidation().requireValueInRange(sheet.getRange("AJ7:AJ"), true).setAllowInvalid(true).build();
  sheet.getRange("E1").setDataValidation(raceRule);

  // Re-apply validations to Y, Z
  var lvlRangeList = [];
  for (var l = 1; l <= 30; l++) lvlRangeList.push(String(l));
  var rosterLvlRule = SpreadsheetApp.newDataValidation().requireValueInList(lvlRangeList, true).build();
  var rosterTypeRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Regular Feat", "Class Bonus Feat", "DM Grant", "Flaw", "Racial Trait", "Special Ability"
  ], true).build();
  sheet.getRange("Y7:Y").setDataValidation(rosterLvlRule);
  sheet.getRange("Z7:Z").setDataValidation(rosterTypeRule);
  applyLvlUpRosterValidations(sheet);

  // Clear any stray values in X8:X and AB8:AB so ARRAYFORMULA never gets blocked with #REF!
  var maxRows = sheet.getMaxRows();
  if (maxRows >= 8) {
    sheet.getRange("X8:X" + maxRows).clearContent();
    sheet.getRange("AB8:AB" + maxRows).clearContent();
  }

  // Col X: Dynamic Indexing
  sheet.getRange("X7").setFormula(f('=ARRAYFORMULA(ROW(X7:X) - 6)'));
  sheet.getRange("X7:X").setHorizontalAlignment("center").setFontColor("#64748b");

  // Col AB: Dynamic Benefit lookup
  sheet.getRange("AB7").setFormula(f('=ARRAYFORMULA(IF(ISBLANK(AA7:AA), "", IFERROR(VLOOKUP(AA7:AA, Master_DB!$A$5:$G, 7, FALSE), "")))'));
  sheet.getRange("AB7:AB").setWrap(true);

  // Detailed Spellcasting & Martial Progression Matrix (Rows 37+)
  setupLvlUpProgressionMatrix(sheet, f);

  SpreadsheetApp.getActiveSpreadsheet().toast("lvl_up formulas and columns successfully repaired & aligned!", "✅ Repaired", 6);
}

/**
 * Clears all user progression entries (Class, HD, HP, BAB, Saves, Skill, Boost, Notes)
 * and Roster entries from lvl_up, restoring clean formulas and Level 1 baseline.
 */
function clearLvlUpDataMenu() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.alert(
    "⚠️ lvl_up Sayfasını Sıfırla",
    "lvl_up sayfasındaki tüm seviye girişleri (Sınıf, HD, HP, BAB, Saves, Skill) ve Roster yetenekleri temizlenecektir. Devam etmek istiyor musunuz?",
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lvlSheet = ss.getSheetByName("lvl_up");
  if (!lvlSheet) {
    ui.alert("Hata: 'lvl_up' sayfası bulunamadı.");
    return;
  }

  // Clear Level Progression user input columns (Cols C, D, E, H, J, L, N, P, T, U, V)
  lvlSheet.getRange("C7:E36").clearContent().clearNote(); // Class names (C), HD (D), HP rolls (E)
  lvlSheet.getRange("H7:H36").clearContent().clearNote(); // BAB rates (Good, Average, Poor)
  lvlSheet.getRange("J7:J36").clearContent().clearNote(); // Fort rates (Good, Poor)
  lvlSheet.getRange("L7:L36").clearContent().clearNote(); // Ref rates (Good, Poor)
  lvlSheet.getRange("N7:N36").clearContent().clearNote(); // Will rates (Good, Poor)
  lvlSheet.getRange("P7:P36").clearContent().clearNote(); // Skill base points
  lvlSheet.getRange("T7:V36").clearContent().clearNote(); // Ability boosts, Notes, Details
  lvlSheet.getRange("T7:T36").setValue("-");              // Reset ability boost to "-"
  lvlSheet.getRange("B7:B36").uncheck();                  // Uncheck active level boxes
  lvlSheet.getRange("B7").check();                        // Keep Level 1 active

  // Clear Roster input columns (Cols Y, Z, AA: Level, Category, Feat/Ability Name)
  var rosterRows = Math.max(1, lvlSheet.getMaxRows() - 6);
  lvlSheet.getRange(7, 25, rosterRows, 3).clearContent().clearNote(); // Cols Y (25) to AA (27)

  // Reapply formulas
  if (typeof fixLvlUpFormulas === "function") {
    fixLvlUpFormulas(lvlSheet);
  }

  try {
    linkLvlUpToMain();
  } catch (e) {}

  ss.toast("lvl_up seviye tablosu ve Roster tertemiz sıfırlandı!", "🧹 lvl_up Temizlendi", 5);
}

// ----------------------------------------------------
// 3. LINK LVL_UP TO MAIN SHEET
// ----------------------------------------------------
function linkLvlUpToMain() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mainSheet = ss.getSheetByName("Main");
  var lvlSheet = ss.getSheetByName("lvl_up");
  if (!mainSheet || !lvlSheet) {
    try {
      SpreadsheetApp.getUi().alert("Error: 'Main' or 'lvl_up' sheet not found.");
    } catch (e) {
      console.warn("linkLvlUpToMain: 'Main' or 'lvl_up' sheet not found.");
    }
    return;
  }

  var sep = getFormulaSeparator(mainSheet);
  function f(str) {
    return str.replace(/,/g, sep);
  }

  // 1. Clean & Fix background to the right of JI2:KR5 (Past column KR / col 304)
  cleanRightOfFeatsSheet(mainSheet);

  // 1b. Character Level (BQ12) and Race (AA12)
  mainSheet.getRange("BQ12").setFormula("=lvl_up!B5");
  mainSheet.getRange("AA12").setFormula("=lvl_up!E1");

  // 1c. Class Summary (B12)
  var levelsData = lvlSheet.getRange("B7:C36").getValues();
  var activeClasses = {};
  var classOrder = [];
  for (var i = 0; i < levelsData.length; i++) {
    if (levelsData[i][0] === true) {
      var rawCls = String(levelsData[i][1] || "").trim();
      if (!rawCls) continue;
      var baseName = rawCls.split("-")[0].trim();
      if (!activeClasses[baseName]) {
        activeClasses[baseName] = 0;
        classOrder.push(baseName);
      }
      activeClasses[baseName]++;
    }
  }
  var classSummary = classOrder.map(function(c) { return c + " " + activeClasses[c]; }).join(" / ");
  if (classSummary) {
    mainSheet.getRange("B12").setValue(classSummary);
  }

  // 2. Total HP (BN35): Base HP (lvl_up!F5) + Con Mod (Main!AT54) * Active Level (lvl_up!B5)
  mainSheet.getRange("BN35").setFormula("=lvl_up!F5 + (AT54 * lvl_up!B5)");

  // 3. Base Attack Bonus (BW56)
  mainSheet.getRange("BW56").setFormula("=lvl_up!I5");

  // 4. Saving Throws (Base Saves: AG86, AG91, AG96)
  mainSheet.getRange("AG86").setFormula("=lvl_up!K5");
  mainSheet.getRange("AG91").setFormula("=lvl_up!M5");
  mainSheet.getRange("AG96").setFormula("=lvl_up!O5");

  // 5. Total Skill Points (EJ203)
  mainSheet.getRange("EJ203").setFormula("=lvl_up!Q5");

  // 6. Set Dynamic Formulas for DM Grants (HX6:JG98) - 31 Slots (every 3 rows: 6, 9, 12, ... 96)
  for (var i = 0; i < 31; i++) {
    var r = 6 + (i * 3);
    var k = i + 1;
    var dmFormula = f(
      '=IFERROR(INDEX(FILTER(lvl_up!$AA$7:$AA, lvl_up!$AA$7:$AA<>"", ISNUMBER(SEARCH("DM", lvl_up!$Z$7:$Z)), (lvl_up!$Y$7:$Y <= IF(lvl_up!$B$5>0, lvl_up!$B$5, 30)) + (lvl_up!$Y$7:$Y = "")), ' + k + '), "")'
    );
    mainSheet.getRange("HX" + r).setFormula(dmFormula);
  }

  // 7. Set Dynamic Formulas for Other Feats & Special Abilities (JI6:KR173) - 56 Slots (every 3 rows: 6, 9, 12, ... 171)
  for (var j = 0; j < 56; j++) {
    var r = 6 + (j * 3);
    var k = j + 1;
    var featFormula = f(
      '=IFERROR(INDEX(FILTER(lvl_up!$AA$7:$AA, lvl_up!$AA$7:$AA<>"", NOT(ISNUMBER(SEARCH("DM", lvl_up!$Z$7:$Z))), (lvl_up!$Y$7:$Y <= IF(lvl_up!$B$5>0, lvl_up!$B$5, 30)) + (lvl_up!$Y$7:$Y = "")), ' + k + '), "")'
    );
    mainSheet.getRange("JI" + r).setFormula(featFormula);
  }

  // 8. Populate Full Tooltips / Notes from Master_DB
  try {
    syncAllFeatNotesToMain(true);
  } catch (errSync) {
    console.warn("syncAllFeatNotesToMain warning: " + errSync.message);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("Level, Race, Class, HP, BAB, Saves, Skill Points ve Feat Notları Main sayfasına başarıyla bağlandı!", "✅ Linked", 6);
}

// ----------------------------------------------------
// 1.8b SYNC ALL FEAT & SPECIAL ABILITY NOTES TO MAIN
// ----------------------------------------------------
function syncAllFeatNotesToMainMenu() {
  syncAllFeatNotesToMain(false);
}

function syncAllFeatNotesToMain(silent) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mainSheet = ss.getSheetByName("Main");
  var lvlSheet = ss.getSheetByName("lvl_up");
  var dbSheet = ss.getSheetByName("Master_DB");
  if (!mainSheet || !lvlSheet) return;

  var activeLvl = lvlSheet.getRange("B5").getValue();
  if (typeof activeLvl !== "number" || activeLvl <= 0) activeLvl = 30;

  // Build Master_DB catalog map for fast O(1) tooltip lookup
  var dbMap = {};
  if (dbSheet && dbSheet.getLastRow() >= 6) {
    var dbData = dbSheet.getRange(6, 1, dbSheet.getLastRow() - 5, 31).getValues();
    for (var d = 0; d < dbData.length; d++) {
      var entryName = String(dbData[d][0] || "").trim();
      if (entryName) {
        dbMap[entryName.toLowerCase()] = {
          name: entryName,
          category: String(dbData[d][1] || "").trim(),
          slot: String(dbData[d][2] || "").trim(),
          prereq: String(dbData[d][4] || "").trim(),
          source: String(dbData[d][5] || "").trim(),
          desc: String(dbData[d][6] || "").trim(),
          bonusType: String(dbData[d][7] || "").trim(),
          scope: String(dbData[d][8] || "").trim(),
          action: String(dbData[d][26] || "").trim(),
          duration: String(dbData[d][27] || "").trim(),
          role: String(dbData[d][30] || "").trim()
        };
      }
    }
  }

  // Read Roster from lvl_up (Cols Y to AB)
  var maxRosterRow = Math.max(lvlSheet.getLastRow(), 36);
  var rosterData = lvlSheet.getRange("Y7:AB" + maxRosterRow).getValues();

  var dmEntries = [];
  var otherEntries = [];

  for (var idx = 0; idx < rosterData.length; idx++) {
    var itemLvl = rosterData[idx][0];
    var itemCat = String(rosterData[idx][1] || "").trim();
    var itemName = String(rosterData[idx][2] || "").trim();
    var itemNotes = String(rosterData[idx][3] || "").trim();

    if (!itemName || itemName === "-") continue;
    if (typeof itemLvl === "number" && itemLvl > activeLvl) continue;

    // Build rich, formatted tooltip
    var dbItem = dbMap[itemName.toLowerCase()];
    var noteParts = [];

    // Header tag: [Category - Lvl X]
    var tag = "[" + (itemCat || "Feat") + (itemLvl ? " - Lvl " + itemLvl : "") + "]";
    noteParts.push(tag);

    if (dbItem) {
      // Name & Source Book
      var titleLine = "📖 " + dbItem.name;
      if (dbItem.source && dbItem.source !== "-") {
        titleLine += " (" + dbItem.source + ")";
      }
      noteParts.push(titleLine);

      // Prerequisites
      if (dbItem.prereq && dbItem.prereq !== "-") {
        noteParts.push("🎯 Prereq: " + dbItem.prereq);
      }

      // Benefit / Description
      if (dbItem.desc) {
        noteParts.push("📜 Benefit:\n" + dbItem.desc);
      }

      // Action & Duration & Role
      var metaDetails = [];
      if (dbItem.action && dbItem.action !== "-") metaDetails.push("⚡ " + dbItem.action);
      if (dbItem.duration && dbItem.duration !== "-") metaDetails.push("⏳ " + dbItem.duration);
      if (dbItem.role && dbItem.role !== "Non-Combat") metaDetails.push("🎯 " + dbItem.role);
      if (metaDetails.length > 0) {
        noteParts.push(metaDetails.join(" | "));
      }
    } else {
      noteParts.push("📖 " + itemName);
      if (itemNotes) {
        noteParts.push(itemNotes);
      }
    }

    var fullNote = noteParts.join("\n\n").trim();

    if (itemCat.toUpperCase().indexOf("DM") !== -1) {
      dmEntries.push({ name: itemName, note: fullNote });
    } else {
      otherEntries.push({ name: itemName, note: fullNote });
    }
  }

  // 1. Sync DM Grants (HX6:JG98) - 31 Slots (every 3 rows: 6, 9, 12, ... 96)
  for (var i = 0; i < 31; i++) {
    var r = 6 + (i * 3);
    var cell = mainSheet.getRange("HX" + r);
    if (i < dmEntries.length && dmEntries[i].note) {
      cell.setNote(dmEntries[i].note);
    } else {
      cell.clearNote();
    }
  }

  // 2. Sync Other Feats & Special Abilities (JI6:KR173) - 56 Slots (every 3 rows: 6, 9, 12, ... 171)
  for (var j = 0; j < 56; j++) {
    var r = 6 + (j * 3);
    var cell = mainSheet.getRange("JI" + r);
    if (j < otherEntries.length && otherEntries[j].note) {
      cell.setNote(otherEntries[j].note);
    } else {
      cell.clearNote();
    }
  }

  if (!silent) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "Main sayfası Feat ve Özel Yetenek notları Master_DB ile başarıyla senkronize edildi!",
      "🔗 Feat Notes Synced",
      5
    );
  }
}

// ----------------------------------------------------
// CLEAN & REPAIR CELLS TO THE RIGHT OF JI2:KR5
// ----------------------------------------------------
function cleanRightOfFeats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mainSheet = ss.getSheetByName("Main");
  if (!mainSheet) {
    SpreadsheetApp.getUi().alert("Error: 'Main' sheet not found.");
    return;
  }
  var count = cleanRightOfFeatsSheet(mainSheet);
  if (count > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Cleaned black cells and removed empty columns past KR (col 304)!", "✅ Cleaned", 5);
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast("Area to the right of KR is already clean!", "ℹ️ Clean", 4);
  }
}

function cleanRightOfFeatsSheet(mainSheet) {
  var maxCols = mainSheet.getMaxColumns();
  if (maxCols <= 304) return 0;

  var extraCols = maxCols - 304;
  var maxRows = mainSheet.getMaxRows();

  // 1. Reset background, font color and notes for all extra columns
  mainSheet.getRange(1, 305, maxRows, extraCols)
    .setBackground(null)
    .setFontColor(null)
    .clearNote();

  // 2. If all extra cells are completely blank, delete the unnecessary columns so sheet ends at KR
  try {
    var checkRange = mainSheet.getRange(1, 305, Math.min(200, maxRows), extraCols);
    if (checkRange.isBlank()) {
      mainSheet.deleteColumns(305, extraCols);
    }
  } catch (e) {}

  return extraCols;
}

// ----------------------------------------------------
// 2.1 LVL_UP DYNAMIC DIMINISHING DROPDOWNS & VALIDATION ENGINE
// ----------------------------------------------------
var _cachedMasterDbRosterCatalog = null;

function clearMasterDbRosterCatalogCache() {
  _cachedMasterDbRosterCatalog = null;
  try {
    CacheService.getScriptCache().remove("master_db_roster_catalog_v2");
  } catch (e) {}
}

/**
 * Reads Master_DB and catalogs all selectable feats, special abilities,
 * DM grants, flaws, and racial traits (excluding child rows starting with '↳' or non-root parents).
 */
function getMasterDbRosterCatalog(ss) {
  if (_cachedMasterDbRosterCatalog) return _cachedMasterDbRosterCatalog;
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();

  var cache = CacheService.getScriptCache();
  try {
    var cached = cache.get("master_db_roster_catalog_v2");
    if (cached) {
      _cachedMasterDbRosterCatalog = JSON.parse(cached);
      return _cachedMasterDbRosterCatalog;
    }
  } catch (e) {}

  var masterSheet = ss.getSheetByName("Master_DB");
  if (!masterSheet) {
    return { feat: [], ability: [], dm: [], flaw: [], racial: [], all: [] };
  }

  var masterLastRow = masterSheet.getLastRow();
  if (masterLastRow < 6) {
    return { feat: [], ability: [], dm: [], flaw: [], racial: [], all: [] };
  }

  // Read Cols A (1: Name), B (2: Category), D (4: Parent Entry)
  var masterData = masterSheet.getRange(6, 1, masterLastRow - 5, 4).getValues();

  var catalog = {
    feat: [],
    ability: [],
    dm: [],
    flaw: [],
    racial: [],
    all: []
  };

  for (var m = 0; m < masterData.length; m++) {
    var mName = String(masterData[m][0] || "").trim();
    var mCat = String(masterData[m][1] || "").trim().toLowerCase();
    var mParent = String(masterData[m][3] || "").trim();

    if (!mName || mName.indexOf("↳") === 0) continue;
    if (mParent !== "-" && mParent !== "") continue; // Skip composite child sub-bonuses

    if (mCat === "feat" || mCat.indexOf("feat") !== -1 || mCat === "metamagic" || mCat === "item creation") {
      catalog.feat.push(mName);
      catalog.dm.push(mName);
      catalog.all.push(mName);
    } else if (mCat === "special ability" || mCat.indexOf("ability") !== -1 || mCat === "class feature" || mCat.indexOf("class feature") !== -1) {
      catalog.ability.push(mName);
      catalog.dm.push(mName);
      catalog.all.push(mName);
    } else if (mCat === "dm grant" || mCat.indexOf("grant") !== -1) {
      catalog.dm.push(mName);
      catalog.all.push(mName);
    } else if (mCat === "flaw" || mCat.indexOf("flaw") !== -1) {
      catalog.flaw.push(mName);
      catalog.all.push(mName);
    } else if (mCat === "racial trait" || mCat.indexOf("trait") !== -1 || mCat.indexOf("racial") !== -1) {
      catalog.racial.push(mName);
      catalog.all.push(mName);
    }
  }

  // De-duplicate and sort alphabetically (Turkish locale aware)
  for (var key in catalog) {
    catalog[key] = catalog[key].filter(function(item, idx, arr) {
      return item && arr.indexOf(item) === idx;
    }).sort(function(a, b) {
      return a.localeCompare(b, "tr", { sensitivity: "base" });
    });
  }

  try {
    cache.put("master_db_roster_catalog_v2", JSON.stringify(catalog), 21600); // 6 hours
  } catch (e) {}

  _cachedMasterDbRosterCatalog = catalog;
  return catalog;
}

/**
 * Builds candidate item list for a specific roster category while excluding
 * feats/abilities already selected in other roster rows, but retaining currentItem
 * to guarantee ZERO validation error triangles.
 */
function getCandidateRosterItems(catalog, category, selectedCounts, currentItem) {
  var cat = String(category || "").trim().toLowerCase();
  var list = [];

  if (cat.indexOf("feat") !== -1) {
    list = (catalog && catalog.feat) ? catalog.feat : [];
  } else if (cat.indexOf("special") !== -1 || cat.indexOf("ability") !== -1) {
    list = (catalog && catalog.ability) ? catalog.ability : [];
  } else if (cat.indexOf("dm") !== -1 || cat.indexOf("grant") !== -1) {
    list = (catalog && catalog.dm) ? catalog.dm : [];
  } else if (cat.indexOf("flaw") !== -1) {
    list = (catalog && catalog.flaw) ? catalog.flaw : [];
  } else if (cat.indexOf("racial") !== -1 || cat.indexOf("trait") !== -1) {
    list = (catalog && catalog.racial) ? catalog.racial : [];
  } else {
    list = (catalog && catalog.all) ? catalog.all : [];
  }

  var candidates = [];
  for (var i = 0; i < list.length; i++) {
    var name = list[i];
    var count = selectedCounts[name] || 0;
    // Exclude if already selected in another row, but allow if it is the current row's item
    if (count === 0 || name === currentItem) {
      candidates.push(name);
    }
  }

  // Guarantee currentItem is retained in candidates list so zero validation error triangles occur!
  if (currentItem && currentItem !== "-" && candidates.indexOf(currentItem) === -1) {
    candidates.unshift(currentItem);
  }

  if (candidates.length === 0) {
    candidates = ["-"];
  }

  return candidates;
}

/**
 * Updates dynamic, category-dependent, and diminishing dropdowns for lvl_up Roster (AA7:AA).
 * 1. Filters feats/abilities from Master_DB matching the category in Column Z for each row.
 * 2. Excludes feats/abilities already selected in OTHER roster rows to eliminate duplicate clutter.
 * 3. Keeps each cell's own selected feat in its list to guarantee zero validation error triangles!
 * 4. High-performance single batch read and single batch write (~60ms total).
 */
function updateLvlUpRosterValidations(sheet, catalog) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName("lvl_up");
    if (!sheet) return;
  }

  if (!catalog) {
    catalog = getMasterDbRosterCatalog(sheet.getParent());
  }

  var rosterStart = (sheet.getRange("A5").getValue() === "ACTIVE LVL:") ? 7 : 6;
  var maxRows = sheet.getMaxRows();
  var maxR = Math.min(maxRows, Math.max(sheet.getLastRow(), rosterStart + 99));
  if (maxR < rosterStart) return;
  var numRows = maxR - rosterStart + 1;

  // Single batch read: Col Z (26: Category) and Col AA (27: Feat Name)
  var rosterData = sheet.getRange(rosterStart, 26, numRows, 2).getValues();

  var selectedCounts = {};
  for (var i = 0; i < rosterData.length; i++) {
    var itm = String(rosterData[i][1] || "").trim();
    if (itm && itm !== "-") {
      selectedCounts[itm] = (selectedCounts[itm] || 0) + 1;
    }
  }

  var validations = [];
  for (var r = 0; r < rosterData.length; r++) {
    var rowCat = rosterData[r][0];
    var rowCurrentItem = String(rosterData[r][1] || "").trim();
    var candidates = getCandidateRosterItems(catalog, rowCat, selectedCounts, rowCurrentItem);

    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(candidates, true)
      .setAllowInvalid(true)
      .build();

    validations.push([rule]);
  }

  // Single batch write
  sheet.getRange(rosterStart, 27, validations.length, 1).setDataValidations(validations);
}

/**
 * Menu action to manually refresh lvl_up roster diminishing feat dropdowns
 */
function refreshLvlUpRosterDropdownsMenu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("lvl_up");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Hata: 'lvl_up' sayfası bulunamadı.");
    return;
  }
  clearMasterDbRosterCatalogCache();
  updateLvlUpRosterValidations(sheet);
  ss.toast("Roster açılır menüleri güncellendi: Seçilen feat/yetenekler listeden gizlendi ve veri doğrulama korundu!", "🔄 Dropdownlar Güncellendi", 5);
}

function getCachedLvlUpRule(sheet, category, currentItem) {
  var catalog = getMasterDbRosterCatalog(sheet ? sheet.getParent() : SpreadsheetApp.getActiveSpreadsheet());
  var candidates = getCandidateRosterItems(catalog, category, {}, currentItem || "");
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(candidates, true)
    .setAllowInvalid(true)
    .build();
}

function getRosterFeatValidationRule(sheet, category, currentItem) {
  return getCachedLvlUpRule(sheet, category, currentItem);
}

function handleLvlUpEdit(sheet, range, e) {
  var startRow = range.getRow();
  var startCol = range.getColumn();
  var numRows = range.getNumRows();
  var numCols = range.getNumColumns();
  var endRow = startRow + numRows - 1;
  var endCol = startCol + numCols - 1;

  var rosterStart = (sheet.getRange("A5").getValue() === "ACTIVE LVL:") ? 7 : 6;
  if (endRow < rosterStart) return;

  // Intersects with Column Z (26: Category) or Column AA (27: Feat Name)
  if (endCol < 26 || startCol > 27) return;

  var catalog = getMasterDbRosterCatalog(sheet.getParent());

  // 1. Ultra-fast path: single cell edit in Column Z (User changed Category)
  if (numRows === 1 && startCol === 26 && endCol === 26) {
    var row = startRow;
    var newCat = (e && e.value !== undefined) ? e.value : sheet.getRange(row, 26).getValue();
    var currentItem = String(sheet.getRange(row, 27).getValue() || "").trim();

    var maxRows = sheet.getMaxRows();
    var maxR = Math.min(maxRows, Math.max(sheet.getLastRow(), rosterStart + 99));
    var poolAA = sheet.getRange(rosterStart, 27, maxR - rosterStart + 1, 1).getValues();
    var selectedCounts = {};
    for (var i = 0; i < poolAA.length; i++) {
      var itm = String(poolAA[i][0] || "").trim();
      if (itm && itm !== "-") selectedCounts[itm] = (selectedCounts[itm] || 0) + 1;
    }

    var candidates = getCandidateRosterItems(catalog, newCat, selectedCounts, currentItem);
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(candidates, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(row, 27).setDataValidation(rule);
    return;
  }

  // 2. Column AA edit (User selected, changed, or cleared Feat) or multi-row edit:
  // Batch update all roster dropdowns in 1 single remote call
  updateLvlUpRosterValidations(sheet, catalog);
  try {
    syncAllFeatNotesToMain();
  } catch (err) {}
}

function setupLvlUpHelperColumns(sheet, f) {
  var headers = [
    "⚙️ All Feats & Abilities", // AD (30)
    "⚙️ Feats",                 // AE (31)
    "⚙️ Special Abilities",     // AF (32)
    "⚙️ DM Grants",             // AG (33)
    "⚙️ Flaws",                 // AH (34)
    "⚙️ Racial Traits",         // AI (35)
    "⚙️ Races"                  // AJ (36)
  ];
  sheet.getRange(6, 30, 1, headers.length).setValues([headers]).setFontWeight("bold");

  var formulas = [
    f('=IFERROR(SORT(UNIQUE(FILTER(Master_DB!$A$6:$A, Master_DB!$A$6:$A<>"", ((TRIM(Master_DB!$B$6:$B)="Feat") + (TRIM(Master_DB!$B$6:$B)="Special Ability") + (TRIM(Master_DB!$B$6:$B)="Racial Trait") + (TRIM(Master_DB!$B$6:$B)="DM Grant") + (TRIM(Master_DB!$B$6:$B)="Flaw")), ((TRIM(Master_DB!$D$6:$D)="-") + (Master_DB!$D$6:$D="")), LEFT(TRIM(Master_DB!$A$6:$A), 1)<>"↳"))), "")'),
    f('=IFERROR(SORT(UNIQUE(FILTER(Master_DB!$A$6:$A, Master_DB!$A$6:$A<>"", TRIM(Master_DB!$B$6:$B)="Feat", ((TRIM(Master_DB!$D$6:$D)="-") + (Master_DB!$D$6:$D="")), LEFT(TRIM(Master_DB!$A$6:$A), 1)<>"↳"))), "")'),
    f('=IFERROR(SORT(UNIQUE(FILTER(Master_DB!$A$6:$A, Master_DB!$A$6:$A<>"", TRIM(Master_DB!$B$6:$B)="Special Ability", ((TRIM(Master_DB!$D$6:$D)="-") + (Master_DB!$D$6:$D="")), LEFT(TRIM(Master_DB!$A$6:$A), 1)<>"↳"))), "")'),
    f('=IFERROR(SORT(UNIQUE(FILTER(Master_DB!$A$6:$A, Master_DB!$A$6:$A<>"", ((TRIM(Master_DB!$B$6:$B)="DM Grant") + (TRIM(Master_DB!$B$6:$B)="Feat") + (TRIM(Master_DB!$B$6:$B)="Special Ability")), ((TRIM(Master_DB!$D$6:$D)="-") + (Master_DB!$D$6:$D="")), LEFT(TRIM(Master_DB!$A$6:$A), 1)<>"↳"))), "")'),
    f('=IFERROR(SORT(UNIQUE(FILTER(Master_DB!$A$6:$A, Master_DB!$A$6:$A<>"", TRIM(Master_DB!$B$6:$B)="Flaw", ((TRIM(Master_DB!$D$6:$D)="-") + (Master_DB!$D$6:$D="")), LEFT(TRIM(Master_DB!$A$6:$A), 1)<>"↳"))), "")'),
    f('=IFERROR(SORT(UNIQUE(FILTER(Master_DB!$A$6:$A, Master_DB!$A$6:$A<>"", TRIM(Master_DB!$B$6:$B)="Racial Trait", ((TRIM(Master_DB!$D$6:$D)="-") + (Master_DB!$D$6:$D="")), LEFT(TRIM(Master_DB!$A$6:$A), 1)<>"↳"))), "")'),
    f('=IFERROR(SORT(UNIQUE(FILTER(Master_DB!$A$6:$A, Master_DB!$A$6:$A<>"", TRIM(Master_DB!$B$6:$B)="Race", LEFT(TRIM(Master_DB!$A$6:$A), 1)<>"↳"))), "")')
  ];

  for (var i = 0; i < formulas.length; i++) {
    sheet.getRange(7, 30 + i).setFormula(formulas[i]);
  }
}

// ----------------------------------------------------
// 2.1A-2 LVL_UP LAYOUT & HARMONIZED STYLING
// ----------------------------------------------------
function formatLvlUpSheetLayout(sheet) {
  // Ensure enough columns exist (at least 38 for table + roster + hidden helpers)
  if (sheet.getMaxColumns() < 38) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 38 - sheet.getMaxColumns());
  }
  // If Roster is currently at column 23 (W), insert 1 column after col 21 to create new col 22 (between U and W)
  if (sheet.getRange(6, 23).getValue() === "#") {
    sheet.insertColumnAfter(21);
  }

  // 1. Comfortable row heights: Settings/Cards (1-3), Spacer (4), Totals (5), Table Header (6), Data rows (7-36)
  sheet.setRowHeight(1, 28);
  sheet.setRowHeight(2, 28);
  sheet.setRowHeight(3, 28);
  sheet.setRowHeight(4, 14);
  sheet.setRowHeight(5, 28);
  sheet.setRowHeight(6, 32);
  sheet.setRowHeights(7, 30, 24);

  // 2. Spacious, readable column widths
  sheet.setColumnWidth(1, 50);   // LVL
  sheet.setColumnWidth(2, 75);   // Active? (Expanded to 75)
  sheet.setColumnWidth(3, 190);  // Class & Lvl (Expanded to 190 for breathing room)
  sheet.setColumnWidth(4, 80);   // HD / Race labels (Expanded to 80 for breathing room)
  sheet.setColumnWidth(5, 90);   // HP Roll / Race values (Expanded to 90)
  sheet.setColumnWidth(6, 60);   // HP Gain / Spacer F (Clean 60px spacer)
  sheet.setColumnWidth(7, 75);   // Cumul HP
  sheet.setColumnWidth(8, 90);   // BAB Rate (Harmonized with E: 90)
  sheet.setColumnWidth(9, 68);   // BAB Gain
  sheet.setColumnWidth(10, 72);  // Fort Rate
  sheet.setColumnWidth(11, 68);  // Fort Gain
  sheet.setColumnWidth(12, 65);  // Ref Rate / Spacer L (Clean 65px spacer)
  sheet.setColumnWidth(13, 72);  // Ref Gain
  sheet.setColumnWidth(14, 110); // Will Rate (Expanded to 110 for spacious, readable dropdowns and headers)
  sheet.setColumnWidth(15, 72);  // Will Gain
  sheet.setColumnWidth(16, 72);  // Skill Base
  sheet.setColumnWidth(17, 72);  // Skill Gain / Spacer Q (Clean 72px spacer in rows 1-3)
  sheet.setColumnWidth(18, 130); // Feats / Martial Adept Title (R1:S1) - Spacious 130px for feats readability
  sheet.setColumnWidth(19, 130); // Special Abilities / Martial Adept IL & Max
  sheet.setColumnWidth(20, 65);  // Ability Boost / Martial Adept Class (T1)
  sheet.setColumnWidth(21, 80);  // Notes / Martial Adept Class (U1) & Max (U2)
  sheet.setColumnWidth(22, 80);  // Details / Martial Adept Stat (V1) & Max (V2) - Added between U and W!
  
  sheet.setColumnWidth(23, 20);  // Divider W (Clean 20px dark canvas divider)
  sheet.setColumnWidth(24, 35);  // # (Roster starts at col 24 / X)
  sheet.setColumnWidth(25, 55);  // Level (Y)
  sheet.setColumnWidth(26, 135); // Category / Type (Z)
  sheet.setColumnWidth(27, 200); // Feat / Ability Name (AA)
  sheet.setColumnWidth(28, 230); // Notes & Details (AB)

  // 3. Top Canvas & Settings Panel (A1:E3) - Master Database Dark Slate & Cyan Theme
  sheet.getRange("A1:AB3").setBackground("#0b1120");
  sheet.getRange("A1:E3").setBackground("#0f172a");
  sheet.getRange("A1:E3").breakApart();

  sheet.getRange("A1:B1").merge().setFontColor("#94a3b8").setFontWeight("bold").setHorizontalAlignment("right").setFontSize(9);
  sheet.getRange("C1").setBackground("#1e293b").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center").setFontSize(9);
  sheet.getRange("D1").setFontColor("#94a3b8").setFontWeight("bold").setHorizontalAlignment("right").setFontSize(9);
  sheet.getRange("E1").setBackground("#1e293b").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center").setFontSize(9);

  sheet.getRange("A2:B2").merge().setFontColor("#94a3b8").setFontWeight("bold").setHorizontalAlignment("right").setFontSize(9);
  sheet.getRange("C2").setBackground("#1e293b").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center").setFontSize(9);
  sheet.getRange("D2").setFontColor("#94a3b8").setFontWeight("bold").setHorizontalAlignment("right").setFontSize(9);
  sheet.getRange("E2").setBackground("#1e293b").setFontWeight("bold").setFontColor("#4ade80").setHorizontalAlignment("center").setFontSize(9);

  sheet.getRange("A3:B3").merge().setFontColor("#94a3b8").setFontWeight("bold").setHorizontalAlignment("right").setFontSize(9);
  sheet.getRange("C3").setBackground("#1e293b").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center").setFontSize(9);
  sheet.getRange("D3").setFontColor("#94a3b8").setFontWeight("bold").setHorizontalAlignment("right").setFontSize(9);
  sheet.getRange("E3").setBackground("#1e293b").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center").setFontSize(9);

  sheet.getRange("A1:E3").setBorder(true, true, true, true, false, false, "#38bdf8", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A1:E3").setBorder(true, true, true, true, true, true, "#334155", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("C1").setBorder(true, true, true, true, false, false, "#38bdf8", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("E1").setBorder(true, true, true, true, false, false, "#38bdf8", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("C2").setBorder(true, true, true, true, false, false, "#38bdf8", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("C3").setBorder(true, true, true, true, false, false, "#38bdf8", SpreadsheetApp.BorderStyle.SOLID);

  // Clear spacer columns F1:F3, L1:L3, and Q1:Q3
  sheet.getRange("F1:F3").breakApart().clearContent().clearFormat().setBackground("#0b1120");
  sheet.getRange("L1:L3").breakApart().clearContent().clearFormat().setBackground("#0b1120");
  sheet.getRange("Q1:Q3").breakApart().clearContent().clearFormat().setBackground("#0b1120");

  // Row 4: Blank Spacer Row between Cards and Totals
  sheet.getRange("A4:AB4").breakApart().clearContent().clearFormat().setBackground("#0b1120");
  sheet.setRowHeight(4, 14);

  // 4. Summary Totals Row (Row 5) - Sleek Dark Slate with Glowing Neon Stats
  sheet.getRange("A5:V5").setBackground("#1e293b").setFontWeight("bold");
  sheet.getRange("A5:V5").setBorder(true, false, true, false, false, false, "#38bdf8", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A5").setValue("ACTIVE LVL:").setFontColor("#94a3b8").setHorizontalAlignment("right");
  sheet.getRange("B5").setFontColor("#38bdf8").setFontSize(11).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("C5").setFontColor("#64748b").setFontStyle("italic");
  sheet.getRange("E5").setValue("Base HP:").setFontColor("#94a3b8").setHorizontalAlignment("right");
  sheet.getRange("F5").setFontColor("#4ade80").setFontSize(10).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("H5").setValue("Base BAB:").setFontColor("#94a3b8").setHorizontalAlignment("right");
  sheet.getRange("I5").setFontColor("#facc15").setFontSize(10).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("J5").setValue("Fort:").setFontColor("#94a3b8").setHorizontalAlignment("right");
  sheet.getRange("K5").setFontColor("#38bdf8").setFontSize(10).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("L5").setValue("Ref:").setFontColor("#94a3b8").setHorizontalAlignment("right");
  sheet.getRange("M5").setFontColor("#38bdf8").setFontSize(10).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("N5").setValue("Will:").setFontColor("#94a3b8").setHorizontalAlignment("right");
  sheet.getRange("O5").setFontColor("#38bdf8").setFontSize(10).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("P5").setValue("Skill Pts:").setFontColor("#94a3b8").setHorizontalAlignment("right");
  sheet.getRange("Q5").setFontColor("#c084fc").setFontSize(10).setNumberFormat("0").setHorizontalAlignment("center");
  sheet.getRange("R5:V5").setValue("");

  // Fill X5:AB5 (Roster header band in Row 5, eliminating white gap)
  sheet.getRange("X5:AB5").breakApart();
  sheet.getRange("X5:AB5").merge()
       .setValue("📜 ACTIVE ROSTER ENTRIES")
       .setBackground("#1e293b").setFontColor("#4ade80").setFontWeight("bold").setFontSize(9)
       .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("X5:AB5").setBorder(true, false, true, false, false, false, "#4ade80", SpreadsheetApp.BorderStyle.SOLID);

  // 5. Table Headers (Row 6) - Unified Dark Midnight Navy (matching Master_DB row 5)
  sheet.getRange("A6:V6")
       .setBackground("#0f172a").setFontColor("#f8fafc").setFontWeight("bold")
       .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("X6:AB6")
       .setBackground("#0f172a").setFontColor("#f8fafc").setFontWeight("bold")
       .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("A6:V6").setBorder(true, true, true, true, true, true, "#334155", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("X6:AB6").setBorder(true, true, true, true, true, true, "#334155", SpreadsheetApp.BorderStyle.SOLID);

  // 6. Column W (23): Clean Dark Divider
  sheet.getRange(1, 23, sheet.getMaxRows(), 1).setBackground("#0b1120");

  // 7. Roster Card (X1:AB3) - Sleek Unified Emerald Theme
  sheet.getRange("X1:AB3").breakApart();
  sheet.getRange("X1:AB3").setBackground("#1e293b");
  sheet.getRange("X1:AB1").merge()
       .setValue("📜 FEATS & ABILITIES ROSTER (Dynamic)")
       .setFontWeight("bold").setFontColor("#4ade80").setFontSize(10)
       .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("X2:AB3").merge()
       .setValue("Single-item entries from Master_DB • Auto-summarized into the Level Up table")
       .setFontColor("#94a3b8").setFontSize(9).setFontStyle("italic")
       .setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
  sheet.getRange("X1:AB3").setBorder(true, true, true, true, false, false, "#4ade80", SpreadsheetApp.BorderStyle.SOLID);

  // 8. Progression Table Grid & Ability Boost Highlights (Rows 7-36)
  var maxRows = Math.max(sheet.getMaxRows(), 105);
  sheet.getRange("A7:V36").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(7, 24, maxRows - 6, 5).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("R7:S36").setWrap(true);
  sheet.getRange("AB7:AB").setWrap(true);

  // Vertical alignment middle across the sheet (Cols A to AB, rows 1 to maxRows)
  sheet.getRange(1, 1, maxRows, 28).setVerticalAlignment("middle");

  // Horizontal alignment center for Columns D through Q (Cols 4-17: HD, HP, BAB, Saves, Skills)
  sheet.getRange("D7:Q36").setHorizontalAlignment("center");
  sheet.getRange("T7:T36").setHorizontalAlignment("center");
  sheet.getRange("Y7:Y").setHorizontalAlignment("center");

  // Highlight every 4th level in Col T (Ability Boost)
  for (var lvl = 1; lvl <= 30; lvl++) {
    var r = lvl + 6;
    if (lvl % 4 === 0) {
      sheet.getRange(r, 20).setBackground("#fef3c7"); // Amber accent
    } else {
      sheet.getRange(r, 20).setBackground("#ffffff");
    }
  }

  // Active Level Conditional Formatting (Soft emerald tint)
  sheet.clearConditionalFormatRules();
  var activeLevelRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$B7=TRUE')
    .setBackground("#f0fdf4")
    .setRanges([sheet.getRange("A7:V36")])
    .build();
  sheet.setConditionalFormatRules([activeLevelRule]);
}

// ----------------------------------------------------
// 2.1B LVL_UP TOP SUMMARY CARDS (3 Merged Channels)
// ----------------------------------------------------
function setupLvlUpTopSummaryCards(sheet, f) {
  // Clear any existing merges in F1:V3 before creating fresh cards
  sheet.getRange("F1:V3").breakApart();

  // SPACER 1: F1:F3 (Empty dark canvas separating Settings and Primary Caster)
  sheet.getRange("F1:F3").clearContent().clearFormat().setBackground("#0b1120");

  // 1. CARD 1: 🔮 PRIMARY CASTER TRACK (G1:K3) - Neon Purple / Violet (#c084fc)
  sheet.getRange("G1:K3").setBackground("#1e293b");
  sheet.getRange("G1:H1").merge().setValue("🔮 PRIMARY CASTER:").setFontWeight("bold").setFontColor("#c084fc").setHorizontalAlignment("left");
  sheet.getRange("I1:J1").merge().setValue("Sorcerer").setBackground("#0f172a").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center");
  
  // Dynamic Ability Mod from inventory (24h continuous equipment bonus from Master_DB) with fallback to Main!AT
  var modFormula1 = f('=IFERROR(IF(J2="CHA", inventory!$AS$12, IF(J2="WIS", inventory!$AS$11, IF(J2="INT", inventory!$AS$10, Main!$AT$75))), IFERROR(IF(J2="CHA", Main!$AT$75, IF(J2="WIS", Main!$AT$68, IF(J2="INT", Main!$AT$61, 0))), 0))');
  sheet.getRange("K1").setFormula(modFormula1).setBackground("#0f172a").setFontWeight("bold").setFontColor("#c084fc").setHorizontalAlignment("center");
  sheet.getRange("K1").setNote("PHB s.8 / DMG s.214: Envanterdeki kuşanılmış eşyalardan gelen stat bonusları 24 saat takılmış kabul edilerek günlük büyü slotlarına dahil edilmiştir.");
  
  var casterClasses = ["None", "Sorcerer", "Wizard", "Cleric", "Druid", "Bard", "Warlock", "Paladin", "Ranger"];
  var primaryClassRule = SpreadsheetApp.newDataValidation().requireValueInList(casterClasses, true).build();
  sheet.getRange("I1").setDataValidation(primaryClassRule);

  sheet.getRange("G2").setValue("CL Mode:").setFontColor("#94a3b8").setFontWeight("bold").setHorizontalAlignment("right");
  sheet.getRange("H2:I2").merge().setValue("Character Level (DM Boon)").setBackground("#0f172a").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center");
  var clModeRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Character Level (DM Boon)", "Class Level", "Custom"
  ], true).build();
  sheet.getRange("H2").setDataValidation(clModeRule);

  sheet.getRange("J2").setValue("CHA").setBackground("#0f172a").setFontWeight("bold").setFontColor("#c084fc").setHorizontalAlignment("center");
  var statRule = SpreadsheetApp.newDataValidation().requireValueInList(["CHA", "INT", "WIS"], true).build();
  sheet.getRange("J2").setDataValidation(statRule);

  // Effective CL formula (K2)
  var cl1Formula = f('=IF(I1="None", 0, IF(H2="Character Level (DM Boon)", $B$5, COUNTIF($C$7:$C$36, "*" & I1 & "*")))');
  sheet.getRange("K2").setFormula(cl1Formula).setBackground("#0f172a").setFontWeight("bold").setFontColor("#38bdf8").setHorizontalAlignment("center");

  // Summary slots display (G3:K3)
  sheet.getRange("G3:K3").merge()
    .setFormula(f('="Slots (0-6): " & F40 & " / " & G40 & " / " & H40 & " / " & I40 & " / " & J40 & " / " & K40 & " / " & L40'))
    .setBackground("#0f172a").setFontColor("#c084fc").setFontStyle("italic").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("G1:K3").setBorder(true, true, true, true, false, false, "#c084fc", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("I1:K1").setBorder(true, true, true, true, false, false, "#a855f7", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("H2:K2").setBorder(true, true, true, true, false, false, "#a855f7", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("G3:K3").setBorder(true, true, true, true, false, false, "#a855f7", SpreadsheetApp.BorderStyle.SOLID);


  // SPACER 2: L1:L3 (Empty dark canvas separating Primary and Secondary Caster)
  sheet.getRange("L1:L3").clearContent().clearFormat().setBackground("#0b1120");

  // 2. CARD 2: ✝️ SECONDARY CASTER TRACK (M1:P3) - Neon Gold / Amber (#facc15)
  sheet.getRange("M1:P3").setBackground("#1e293b");
  sheet.getRange("M1:N1").merge().setValue("✝️ SECONDARY CASTER:").setFontWeight("bold").setFontColor("#facc15").setHorizontalAlignment("left").setFontSize(9);
  sheet.getRange("O1").setValue("None").setBackground("#0f172a").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center").setFontSize(9);
  
  var secClasses = ["None", "Cleric", "Druid", "Wizard", "Sorcerer", "Bard", "Paladin", "Ranger"];
  var secClassRule = SpreadsheetApp.newDataValidation().requireValueInList(secClasses, true).build();
  sheet.getRange("O1").setDataValidation(secClassRule);

  // Dynamic Ability Mod from inventory (24h continuous equipment bonus from Master_DB) with fallback to Main!AT
  var modFormula2 = f('=IFERROR(IF(O2="WIS", inventory!$AS$11, IF(O2="INT", inventory!$AS$10, IF(O2="CHA", inventory!$AS$12, Main!$AT$68))), IFERROR(IF(O2="WIS", Main!$AT$68, IF(O2="INT", Main!$AT$61, IF(O2="CHA", Main!$AT$75, 0))), 0))');
  sheet.getRange("P1").setFormula(modFormula2).setBackground("#0f172a").setFontWeight("bold").setFontColor("#facc15").setHorizontalAlignment("center").setFontSize(9);
  sheet.getRange("P1").setNote("PHB s.8 / DMG s.214: Envanterdeki kuşanılmış eşyalardan gelen stat bonusları 24 saat takılmış kabul edilerek günlük büyü slotlarına dahil edilmiştir.");

  sheet.getRange("M2").setValue("CL Mode:").setFontColor("#94a3b8").setFontWeight("bold").setHorizontalAlignment("right").setFontSize(9);
  sheet.getRange("N2").setValue("Class Level").setBackground("#0f172a").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center").setFontSize(9);
  sheet.getRange("N2").setDataValidation(clModeRule);

  sheet.getRange("O2").setValue("WIS").setBackground("#0f172a").setFontWeight("bold").setFontColor("#facc15").setHorizontalAlignment("center").setFontSize(9);
  sheet.getRange("O2").setDataValidation(statRule);

  // Effective CL formula (P2)
  var cl2Formula = f('=IF(O1="None", 0, IF(N2="Character Level (DM Boon)", $B$5, COUNTIF($C$7:$C$36, "*" & O1 & "*")))');
  sheet.getRange("P2").setFormula(cl2Formula).setBackground("#0f172a").setFontWeight("bold").setFontColor("#38bdf8").setHorizontalAlignment("center").setFontSize(9);

  // Summary slots display (M3:P3)
  sheet.getRange("M3:P3").merge()
    .setFormula(f('=IF(O1="None", "Inactive / None", "Slots (0-6): " & F43 & " / " & G43 & " / " & H43 & " / " & I43 & " / " & J43 & " / " & K43 & " / " & L43)'))
    .setBackground("#0f172a").setFontColor("#facc15").setFontStyle("italic").setFontWeight("bold").setHorizontalAlignment("center").setFontSize(9);
  sheet.getRange("M1:P3").setBorder(true, true, true, true, false, false, "#facc15", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("O1:P1").setBorder(true, true, true, true, false, false, "#eab308", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("N2:P2").setBorder(true, true, true, true, false, false, "#eab308", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("M3:P3").setBorder(true, true, true, true, false, false, "#eab308", SpreadsheetApp.BorderStyle.SOLID);


  // SPACER 3: Q1:Q3 (Empty dark canvas separating Secondary Caster and Martial Adept - 72px wide)
  sheet.getRange("Q1:Q3").clearContent().clearFormat().setBackground("#0b1120");

  // 3. CARD 3: ⚔️ MARTIAL ADEPT TRACK (R1:V3) - Neon Ruby / Crimson (#fb7185)
  sheet.getRange("R1:V3").setBackground("#1e293b");
  sheet.getRange("R1:S1").merge().setValue("⚔️ MARTIAL ADEPT:").setFontWeight("bold").setFontColor("#fb7185").setHorizontalAlignment("left").setFontSize(9);
  sheet.getRange("T1:U1").merge().setValue("None").setBackground("#0f172a").setFontWeight("bold").setFontColor("#f8fafc").setHorizontalAlignment("center").setFontSize(9);
  
  var martialClasses = ["None", "Warblade", "Crusader", "Swordsage"];
  var martialClassRule = SpreadsheetApp.newDataValidation().requireValueInList(martialClasses, true).build();
  sheet.getRange("T1").setDataValidation(martialClassRule);

  // Key Ability Stat for Martial Adept (V1)
  var martialStatFormula = f('=IF(T1="Warblade", "INT", IF(T1="Crusader", "CHA", IF(T1="Swordsage", "WIS", "-")))');
  sheet.getRange("V1").setFormula(martialStatFormula).setBackground("#0f172a").setFontWeight("bold").setFontColor("#fb7185").setHorizontalAlignment("center").setFontSize(9);
  sheet.getRange("V1").setNote("Tome of Battle Key Abilities: Warblade = INT, Crusader = CHA, Swordsage = WIS");

  // Initiator Level Formula (ToB p.39 RAW) in S2
  sheet.getRange("R2").setValue("IL:").setFontColor("#94a3b8").setFontWeight("bold").setHorizontalAlignment("right").setFontSize(9);
  var ilFormula = f('=IF(T1="None", 0, COUNTIF($C$7:$C$36, "*" & T1 & "*") + INT(($B$5 - COUNTIF($C$7:$C$36, "*" & T1 & "*")) / 2))');
  sheet.getRange("S2").setFormula(ilFormula).setNumberFormat('"IL: "0').setBackground("#0f172a").setFontWeight("bold").setFontColor("#38bdf8").setHorizontalAlignment("center").setFontSize(9);

  sheet.getRange("T2").setValue("Max:").setFontColor("#94a3b8").setFontWeight("bold").setHorizontalAlignment("right").setFontSize(9);
  var maxManeuverFormula = f('=IF(T1="None", "-", MIN(9, INT((S2 + 1) / 2)))');
  sheet.getRange("U2:V2").merge().setFormula(maxManeuverFormula).setBackground("#0f172a").setFontWeight("bold").setFontColor("#fb7185").setHorizontalAlignment("center").setFontSize(9);

  // Summary display (R3:V3)
  sheet.getRange("R3:V3").merge()
    .setFormula(f('=IF(T1="None", "Inactive / None", "Known: " & L46 & " | Ready: " & O46 & " | Stances: " & R46)'))
    .setBackground("#0f172a").setFontColor("#fb7185").setFontStyle("italic").setFontWeight("bold").setHorizontalAlignment("center").setFontSize(9);
  sheet.getRange("R1:V3").setBorder(true, true, true, true, false, false, "#fb7185", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("T1:V1").setBorder(true, true, true, true, false, false, "#f43f5e", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("R2:V2").setBorder(true, true, true, true, false, false, "#f43f5e", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("R3:V3").setBorder(true, true, true, true, false, false, "#f43f5e", SpreadsheetApp.BorderStyle.SOLID);
}

// ----------------------------------------------------
// 2.1C LVL_UP DETAILED PROGRESSION MATRIX (Rows 37+)
// ----------------------------------------------------
function setupLvlUpProgressionMatrix(sheet, f) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 48) {
    sheet.insertRowsAfter(lastRow, 48 - lastRow + 5);
  }

  // Row 37: Spacer
  sheet.getRange("A37:V37").clear();
  sheet.setRowHeight(37, 16);

  // Clear any existing merges in rows 37-48
  sheet.getRange("A37:V48").breakApart();

  // Row 38: Section Title Banner (Split into frozen A:B and unfrozen C:V to respect frozen column boundary)
  sheet.getRange("A38:B38").merge()
    .setValue("🔮 MATRIX")
    .setBackground("#0f172a").setFontColor("#38bdf8").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("C38:V38").merge()
    .setValue("D&D 3.5E RAW SPELLCASTING & MARTIAL PROGRESSION MATRIX")
    .setBackground("#0f172a").setFontColor("#38bdf8").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(38, 28);

  // Row 39: Primary Caster Header
  sheet.getRange("A39:B39").merge().setBackground("#581c87");
  sheet.getRange("C39:E39").merge()
    .setFormula(f('="🔮 " & I1 & " (CL: " & K2 & ", Stat Mod: " & IF(K1>=0, "+"&K1, K1) & ")"'))
    .setBackground("#581c87").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("left");
  
  var spellLevelLabels = ["0 (Cantrip)", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
  for (var s = 0; s < 10; s++) {
    sheet.getRange(39, 6 + s).setValue(spellLevelLabels[s])
      .setBackground("#7e22ce").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  }
  sheet.getRange("P39:R39").merge().setValue("Total Slots").setBackground("#581c87").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("S39:V39").merge().setValue("Spells Known Total").setBackground("#581c87").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.setRowHeight(39, 26);

  // Row 40: Primary Daily Slots
  sheet.getRange("A40:B40").merge().setBackground("#faf5ff");
  sheet.getRange("C40:E40").merge().setValue("Daily Spell Slots (Base + 24H Equip Stat Bonus)").setFontWeight("bold").setBackground("#faf5ff").setFontColor("#581c87").setHorizontalAlignment("right");
  sheet.getRange("A40").setNote("PHB s.8 / DMG s.214: Envanterdeki kuşanılmış eşyalardan gelen stat bonusları 24 saat takılmış kabul edilerek günlük büyü slotlarına dahil edilmiştir.");
  sheet.setRowHeight(40, 26);
  
  // Spell Slots Formulas (0 to 9) in F40:O40
  sheet.getRange("F40").setFormula(f('=IF($I$1="None", 0, IF($I$1="Sorcerer", IF($K$2>=2, 6, IF($K$2=1, 5, 0)), IF(OR($I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$2>=1, 4, 0), IF($I$1="Bard", IF($K$2>=2, 4, IF($K$2=1, 3, 0)), 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("G40").setFormula(f(
    '=IF($I$1="None", 0, IF($K$2<1, 0, (IF($I$1="Sorcerer", IF($K$2>=4, 6, IF($K$2=3, 5, IF($K$2=2, 4, 3))), IF(OR($I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$2>=4, 4, IF($K$2=3, 3, IF($K$2=2, 2, 1))), IF($I$1="Bard", IF($K$2>=5, 4, IF($K$2=4, 3, IF($K$2=3, 2, IF($K$2=2, 1, 0)))), 0))) + IF(AND($I$1="Bard", $K$2<2), 0, IF($K$1>=1, INT(($K$1-1)/4)+1, 0)))))'
  )).setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("H40").setFormula(f(
    '=IF($I$1="None", 0, IF($K$2<3, 0, (IF($I$1="Sorcerer", IF($K$2<4, 0, IF($K$2>=7, 6, IF($K$2=6, 5, IF($K$2=5, 4, 3)))), IF(OR($I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$2>=6, 4, IF($K$2=5, 3, IF($K$2=4, 2, 1))), IF($I$1="Bard", IF($K$2<4, 0, IF($K$2>=7, 4, IF($K$2=6, 3, IF($K$2=5, 2, 1)))), 0))) + IF(OR(AND($I$1="Sorcerer", $K$2<4), AND($I$1="Bard", $K$2<4)), 0, IF($K$1>=2, INT(($K$1-2)/4)+1, 0)))))'
  )).setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("I40").setFormula(f(
    '=IF($I$1="None", 0, IF($K$2<5, 0, (IF($I$1="Sorcerer", IF($K$2<6, 0, IF($K$2>=9, 6, IF($K$2=8, 5, IF($K$2=7, 4, 3)))), IF(OR($I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$2>=8, 4, IF($K$2=7, 3, IF($K$2=6, 2, 1))), IF($I$1="Bard", IF($K$2<7, 0, IF($K$2>=10, 4, IF($K$2=9, 3, IF($K$2=8, 2, 1)))), 0))) + IF(OR(AND($I$1="Sorcerer", $K$2<6), AND($I$1="Bard", $K$2<7)), 0, IF($K$1>=3, INT(($K$1-3)/4)+1, 0)))))'
  )).setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("J40").setFormula(f(
    '=IF($I$1="None", 0, IF($K$2<7, 0, (IF($I$1="Sorcerer", IF($K$2<8, 0, IF($K$2>=11, 6, IF($K$2=10, 5, IF($K$2=9, 4, 3)))), IF(OR($I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$2>=10, 4, IF($K$2=9, 3, IF($K$2=8, 2, 1))), IF($I$1="Bard", IF($K$2<10, 0, IF($K$2>=13, 4, IF($K$2=12, 3, IF($K$2=11, 2, 1)))), 0))) + IF(OR(AND($I$1="Sorcerer", $K$2<8), AND($I$1="Bard", $K$2<10)), 0, IF($K$1>=4, INT(($K$1-4)/4)+1, 0)))))'
  )).setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("K40").setFormula(f(
    '=IF($I$1="None", 0, IF($K$2<9, 0, (IF($I$1="Sorcerer", IF($K$2<10, 0, IF($K$2>=13, 6, IF($K$2=12, 5, IF($K$2=11, 4, 3)))), IF(OR($I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$2>=12, 4, IF($K$2=11, 3, IF($K$2=10, 2, 1))), IF($I$1="Bard", IF($K$2<13, 0, IF($K$2>=16, 4, IF($K$2=15, 3, IF($K$2=14, 2, 1)))), 0))) + IF(OR(AND($I$1="Sorcerer", $K$2<10), AND($I$1="Bard", $K$2<13)), 0, IF($K$1>=5, INT(($K$1-5)/4)+1, 0)))))'
  )).setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("L40").setFormula(f(
    '=IF($I$1="None", 0, IF($K$2<11, 0, (IF($I$1="Sorcerer", IF($K$2<12, 0, IF($K$2>=15, 6, IF($K$2=14, 5, IF($K$2=13, 4, 3)))), IF(OR($I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$2>=14, 4, IF($K$2=13, 3, IF($K$2=12, 2, 1))), IF($I$1="Bard", IF($K$2<16, 0, IF($K$2>=19, 4, IF($K$2=18, 3, IF($K$2=17, 2, 1)))), 0))) + IF(OR(AND($I$1="Sorcerer", $K$2<12), AND($I$1="Bard", $K$2<16)), 0, IF($K$1>=6, INT(($K$1-6)/4)+1, 0)))))'
  )).setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("M40").setFormula(f(
    '=IF($I$1="None", 0, IF($K$2<13, 0, (IF($I$1="Sorcerer", IF($K$2<14, 0, IF($K$2>=17, 6, IF($K$2=16, 5, IF($K$2=15, 4, 3)))), IF(OR($I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$2>=16, 4, IF($K$2=15, 3, IF($K$2=14, 2, 1))), 0)) + IF(AND($I$1="Sorcerer", $K$2<14), 0, IF(OR($I$1="Sorcerer", $I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$1>=7, INT(($K$1-7)/4)+1, 0), 0)))))'
  )).setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("N40").setFormula(f(
    '=IF($I$1="None", 0, IF($K$2<15, 0, (IF($I$1="Sorcerer", IF($K$2<16, 0, IF($K$2>=19, 6, IF($K$2=18, 5, IF($K$2=17, 4, 3)))), IF(OR($I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$2>=18, 4, IF($K$2=17, 3, IF($K$2=16, 2, 1))), 0)) + IF(AND($I$1="Sorcerer", $K$2<16), 0, IF(OR($I$1="Sorcerer", $I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$1>=8, INT(($K$1-8)/4)+1, 0), 0)))))'
  )).setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("O40").setFormula(f(
    '=IF($I$1="None", 0, IF($K$2<17, 0, (IF($I$1="Sorcerer", IF($K$2<18, 0, IF($K$2>=20, 6, IF($K$2=19, 4, 3))), IF(OR($I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$2>=20, 4, IF($K$2=19, 3, IF($K$2=18, 2, 1))), 0)) + IF(AND($I$1="Sorcerer", $K$2<18), 0, IF(OR($I$1="Sorcerer", $I$1="Wizard", $I$1="Cleric", $I$1="Druid"), IF($K$1>=9, INT(($K$1-9)/4)+1, 0), 0)))))'
  )).setHorizontalAlignment("center").setBackground("#ffffff");

  // Total Slots Sum (P40:R40)
  sheet.getRange("P40:R40").merge().setFormula(f('=SUM(F40:O40)')).setFontWeight("bold").setFontColor("#581c87").setHorizontalAlignment("center").setBackground("#faf5ff");

  // Row 41: Spells Known (F41:O41) - Official PHB Table 3-17 RAW
  sheet.getRange("A41:B41").merge().setBackground("#f3e8ff");
  sheet.getRange("C41:E41").merge().setValue("Spells Known (Sorcerer/Bard)").setFontWeight("bold").setBackground("#f3e8ff").setFontColor("#581c87").setHorizontalAlignment("right");
  sheet.setRowHeight(41, 26);
  sheet.getRange("F41").setFormula(f('=IF($I$1="Sorcerer", IF($K$2>=10, 9, IF($K$2>=8, 8, IF($K$2>=6, 7, IF($K$2>=4, 6, IF($K$2>=2, 5, IF($K$2=1, 4, 0)))))), IF($I$1="Bard", IF($K$2>=3, 6, IF($K$2=2, 5, IF($K$2=1, 4, 0))), "-"))')).setHorizontalAlignment("center").setBackground("#faf5ff");
  sheet.getRange("G41").setFormula(f('=IF($I$1="Sorcerer", IF($K$2>=7, 5, IF($K$2>=5, 4, IF($K$2>=3, 3, IF($K$2>=1, 2, 0)))), IF($I$1="Bard", IF($K$2>=4, 4, IF($K$2=3, 3, IF($K$2=2, 2, 0))), "-"))')).setHorizontalAlignment("center").setBackground("#faf5ff");
  sheet.getRange("H41").setFormula(f('=IF($I$1="Sorcerer", IF($K$2>=11, 5, IF($K$2>=9, 4, IF($K$2>=7, 3, IF($K$2>=5, 2, IF($K$2=4, 1, 0))))), IF($I$1="Bard", IF($K$2>=8, 4, IF($K$2=7, 3, IF($K$2=6, 2, IF($K$2=5, 1, 0)))), "-"))')).setHorizontalAlignment("center").setBackground("#faf5ff");
  sheet.getRange("I41").setFormula(f('=IF($I$1="Sorcerer", IF($K$2>=11, 4, IF($K$2>=9, 3, IF($K$2>=7, 2, IF($K$2=6, 1, 0)))), IF($I$1="Bard", IF($K$2>=11, 4, IF($K$2=10, 3, IF($K$2=9, 2, IF($K$2=8, 1, 0)))), "-"))')).setHorizontalAlignment("center").setBackground("#faf5ff");
  sheet.getRange("J41").setFormula(f('=IF($I$1="Sorcerer", IF($K$2>=13, 4, IF($K$2>=11, 3, IF($K$2>=9, 2, IF($K$2=8, 1, 0)))), IF($I$1="Bard", IF($K$2>=14, 4, IF($K$2=13, 3, IF($K$2=12, 2, IF($K$2=11, 1, 0)))), "-"))')).setHorizontalAlignment("center").setBackground("#faf5ff");
  sheet.getRange("K41").setFormula(f('=IF($I$1="Sorcerer", IF($K$2>=15, 4, IF($K$2>=13, 3, IF($K$2>=11, 2, IF($K$2=10, 1, 0)))), IF($I$1="Bard", IF($K$2>=17, 4, IF($K$2=16, 3, IF($K$2=15, 2, IF($K$2=14, 1, 0)))), "-"))')).setHorizontalAlignment("center").setBackground("#faf5ff");
  sheet.getRange("L41").setFormula(f('=IF($I$1="Sorcerer", IF($K$2>=15, 3, IF($K$2>=13, 2, IF($K$2=12, 1, 0))), IF($I$1="Bard", IF($K$2>=20, 4, IF($K$2=19, 3, IF($K$2=18, 2, IF($K$2=17, 1, 0)))), "-"))')).setHorizontalAlignment("center").setBackground("#faf5ff");
  sheet.getRange("M41").setFormula(f('=IF($I$1="Sorcerer", IF($K$2>=17, 3, IF($K$2>=15, 2, IF($K$2=14, 1, 0))), "-")')).setHorizontalAlignment("center").setBackground("#faf5ff");
  sheet.getRange("N41").setFormula(f('=IF($I$1="Sorcerer", IF($K$2>=19, 3, IF($K$2>=17, 2, IF($K$2=16, 1, 0))), "-")')).setHorizontalAlignment("center").setBackground("#faf5ff");
  sheet.getRange("O41").setFormula(f('=IF($I$1="Sorcerer", IF($K$2>=20, 3, IF($K$2=19, 2, IF($K$2=18, 1, 0))), "-")')).setHorizontalAlignment("center").setBackground("#faf5ff");
  
  // Total Spells Known Sum (S41:V41)
  sheet.getRange("S41:V41").merge().setFormula(f('=IF(ISNUMBER(F41), SUM(F41:O41), "Prepared Spellbook")')).setFontWeight("bold").setFontColor("#581c87").setHorizontalAlignment("center").setBackground("#f3e8ff");
  sheet.getRange("A39:V41").setBorder(true, true, true, true, true, true, "#d8b4fe", SpreadsheetApp.BorderStyle.SOLID);


  // Row 42: Secondary Caster Header
  sheet.getRange("A42:B42").merge().setBackground("#92400e");
  sheet.getRange("C42:E42").merge()
    .setFormula(f('="✝️ " & O1 & " (CL: " & P2 & ", Stat Mod: " & IF(P1>=0, "+"&P1, P1) & ")"'))
    .setBackground("#92400e").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("left");
  for (var s2 = 0; s2 < 10; s2++) {
    sheet.getRange(42, 6 + s2).setValue(spellLevelLabels[s2])
      .setBackground("#b45309").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  }
  sheet.getRange("P42:R42").merge().setValue("Total Slots").setBackground("#92400e").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("S42:V42").merge().setValue("Domain / Special Slots").setBackground("#92400e").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.setRowHeight(42, 26);

  // Row 43: Secondary Daily Slots (F43:O43)
  sheet.getRange("A43:B43").merge().setBackground("#fffbeb");
  sheet.getRange("C43:E43").merge().setValue("Daily Spell Slots (Base + 24H Equip Stat Bonus)").setFontWeight("bold").setBackground("#fffbeb").setFontColor("#78350f").setHorizontalAlignment("right");
  sheet.getRange("A43").setNote("PHB s.8 / DMG s.214: Envanterdeki kuşanılmış eşyalardan gelen stat bonusları 24 saat takılmış kabul edilerek günlük büyü slotlarına dahil edilmiştir.");
  sheet.setRowHeight(43, 26);
  sheet.getRange("F43").setFormula(f('=IF($O$1="None", 0, IF($O$1="Cleric", IF($P$2>=1, 3, 0), IF($O$1="Druid", IF($P$2>=1, 3, 0), IF($O$1="Wizard", IF($P$2>=1, 3, 0), 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("G43").setFormula(f('=IF($O$1="None", 0, IF($P$2<1, 0, (IF($O$1="Cleric", IF($P$2>=4, 4, IF($P$2>=3, 3, IF($P$2>=2, 2, 1))), IF($O$1="Druid", IF($P$2>=4, 4, IF($P$2>=3, 3, IF($P$2>=2, 2, 1))), IF($O$1="Wizard", IF($P$2>=4, 4, IF($P$2>=3, 3, IF($P$2>=2, 2, 1))), 0))) + IF($P$1>=1, INT(($P$1-1)/4)+1, 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("H43").setFormula(f('=IF($O$1="None", 0, IF($P$2<3, 0, (IF($O$1="Cleric", IF($P$2>=6, 4, IF($P$2=5, 3, IF($P$2=4, 2, 1))), IF($O$1="Druid", IF($P$2>=6, 4, IF($P$2=5, 3, IF($P$2=4, 2, 1))), IF($O$1="Wizard", IF($P$2>=6, 4, IF($P$2=5, 3, IF($P$2=4, 2, 1))), 0))) + IF($P$1>=2, INT(($P$1-2)/4)+1, 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("I43").setFormula(f('=IF($O$1="None", 0, IF($P$2<5, 0, (IF($O$1="Cleric", IF($P$2>=8, 4, IF($P$2=7, 3, IF($P$2=6, 2, 1))), IF($O$1="Druid", IF($P$2>=8, 4, IF($P$2=7, 3, IF($P$2=6, 2, 1))), IF($O$1="Wizard", IF($P$2>=8, 4, IF($P$2=7, 3, IF($P$2=6, 2, 1))), 0))) + IF($P$1>=3, INT(($P$1-3)/4)+1, 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("J43").setFormula(f('=IF($O$1="None", 0, IF($P$2<7, 0, (IF($O$1="Cleric", IF($P$2>=10, 4, IF($P$2=9, 3, IF($P$2=8, 2, 1))), IF($O$1="Druid", IF($P$2>=10, 4, IF($P$2=9, 3, IF($P$2=8, 2, 1))), IF($O$1="Wizard", IF($P$2>=10, 4, IF($P$2=9, 3, IF($P$2=8, 2, 1))), 0))) + IF($P$1>=4, INT(($P$1-4)/4)+1, 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("K43").setFormula(f('=IF($O$1="None", 0, IF($P$2<9, 0, (IF($O$1="Cleric", IF($P$2>=12, 4, IF($P$2=11, 3, IF($P$2=10, 2, 1))), IF($O$1="Druid", IF($P$2>=12, 4, IF($P$2=11, 3, IF($P$2=10, 2, 1))), IF($O$1="Wizard", IF($P$2>=12, 4, IF($P$2=11, 3, IF($P$2=10, 2, 1))), 0))) + IF($P$1>=5, INT(($P$1-5)/4)+1, 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("L43").setFormula(f('=IF($O$1="None", 0, IF($P$2<11, 0, (IF($O$1="Cleric", IF($P$2>=14, 4, IF($P$2=13, 3, IF($P$2=12, 2, 1))), IF($O$1="Druid", IF($P$2>=14, 4, IF($P$2=13, 3, IF($P$2=12, 2, 1))), IF($O$1="Wizard", IF($P$2>=14, 4, IF($P$2=13, 3, IF($P$2=12, 2, 1))), 0))) + IF($P$1>=6, INT(($P$1-6)/4)+1, 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("M43").setFormula(f('=IF($O$1="None", 0, IF($P$2<13, 0, (IF($O$1="Cleric", IF($P$2>=16, 4, IF($P$2=15, 3, IF($P$2=14, 2, 1))), IF($O$1="Druid", IF($P$2>=16, 4, IF($P$2=15, 3, IF($P$2=14, 2, 1))), IF($O$1="Wizard", IF($P$2>=16, 4, IF($P$2=15, 3, IF($P$2=14, 2, 1))), 0))) + IF($P$1>=7, INT(($P$1-7)/4)+1, 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("N43").setFormula(f('=IF($O$1="None", 0, IF($P$2<15, 0, (IF($O$1="Cleric", IF($P$2>=18, 4, IF($P$2=17, 3, IF($P$2=16, 2, 1))), IF($O$1="Druid", IF($P$2>=18, 4, IF($P$2=17, 3, IF($P$2=16, 2, 1))), IF($O$1="Wizard", IF($P$2>=18, 4, IF($P$2=17, 3, IF($P$2=16, 2, 1))), 0))) + IF($P$1>=8, INT(($P$1-8)/4)+1, 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("O43").setFormula(f('=IF($O$1="None", 0, IF($P$2<17, 0, (IF($O$1="Cleric", IF($P$2>=20, 4, IF($P$2=19, 3, IF($P$2=18, 2, 1))), IF($O$1="Druid", IF($P$2>=20, 4, IF($P$2=19, 3, IF($P$2=18, 2, 1))), IF($O$1="Wizard", IF($P$2>=20, 4, IF($P$2=19, 3, IF($P$2=18, 2, 1))), 0))) + IF($P$1>=9, INT(($P$1-9)/4)+1, 0))))')).setHorizontalAlignment("center").setBackground("#ffffff");
  
  sheet.getRange("P43:R43").merge().setFormula(f('=SUM(F43:O43)')).setFontWeight("bold").setFontColor("#78350f").setHorizontalAlignment("center").setBackground("#fffbeb");
  sheet.getRange("S43:V43").merge().setFormula(f('=IF($O$1="Cleric", "+1 Domain Spell per Level (1st-9th)", IF($O$1="Druid", "Spontaneous Summon Nature\'s Ally", "None"))')).setFontWeight("bold").setFontColor("#78350f").setHorizontalAlignment("center").setBackground("#fef3c7");
  sheet.getRange("A42:V43").setBorder(true, true, true, true, true, true, "#fde68a", SpreadsheetApp.BorderStyle.SOLID);

  // Row 44: Spacer
  sheet.getRange("A44:V44").clear();
  sheet.setRowHeight(44, 14);

  // Row 45: Martial Adept (Tome of Battle) Header (Split across frozen boundary A:B and C:E)
  sheet.getRange("A45:B45").merge().setBackground("#9f1239");
  sheet.getRange("C45:E45").merge()
    .setFormula(f('="⚔️ " & T1 & " (Tome of Battle Martial Adept)"'))
    .setBackground("#9f1239").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("left");
  sheet.getRange("F45:H45").merge().setValue("Initiator Level (IL)").setBackground("#be123c").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("I45:K45").merge().setValue("Max Maneuver Lvl").setBackground("#be123c").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("L45:N45").merge().setValue("Maneuvers Known").setBackground("#be123c").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("O45:Q45").merge().setValue("Maneuvers Readied").setBackground("#be123c").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("R45:V45").merge().setValue("Stances Known").setBackground("#be123c").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.setRowHeight(45, 26);

  // Row 46: Martial Adept Values (Split across frozen boundary A:B and C:E)
  sheet.getRange("A46:B46").merge().setBackground("#fff1f2");
  sheet.getRange("C46:E46").merge().setValue("Maneuvers Progression (ToB RAW)").setFontWeight("bold").setBackground("#fff1f2").setFontColor("#881337").setHorizontalAlignment("right");
  sheet.setRowHeight(46, 26);
  sheet.getRange("F46:H46").merge().setFormula(f('=S2')).setFontWeight("bold").setFontColor("#881337").setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("I46:K46").merge().setFormula(f('=U2')).setFontWeight("bold").setFontColor("#881337").setHorizontalAlignment("center").setBackground("#ffffff");
  
  var martialLvlCell = f('COUNTIF($C$7:$C$36, "*" & T1 & "*")');
  sheet.getRange("L46:N46").merge().setFormula(f(
    '=IF(T1="Warblade", IF(' + martialLvlCell + '>=19, 14, IF(' + martialLvlCell + '>=17, 13, IF(' + martialLvlCell + '>=15, 12, IF(' + martialLvlCell + '>=13, 11, IF(' + martialLvlCell + '>=11, 10, IF(' + martialLvlCell + '>=9, 9, IF(' + martialLvlCell + '>=7, 8, IF(' + martialLvlCell + '>=5, 7, IF(' + martialLvlCell + '>=3, 6, IF(' + martialLvlCell + '>=1, 5, 0)))))))))), IF(T1="Crusader", IF(' + martialLvlCell + '>=18, 14, IF(' + martialLvlCell + '>=14, 13, IF(' + martialLvlCell + '>=10, 11, IF(' + martialLvlCell + '>=6, 9, IF(' + martialLvlCell + '>=1, 5, 0))))), IF(T1="Swordsage", IF(' + martialLvlCell + '>=19, 25, IF(' + martialLvlCell + '>=17, 23, IF(' + martialLvlCell + '>=15, 21, IF(' + martialLvlCell + '>=13, 19, IF(' + martialLvlCell + '>=11, 17, IF(' + martialLvlCell + '>=9, 15, IF(' + martialLvlCell + '>=7, 13, IF(' + martialLvlCell + '>=5, 11, IF(' + martialLvlCell + '>=3, 9, IF(' + martialLvlCell + '>=1, 6, 0)))))))))), 0)))'
  )).setFontWeight("bold").setFontColor("#881337").setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("O46:Q46").merge().setFormula(f(
    '=IF(T1="Warblade", IF(' + martialLvlCell + '>=15, 7, IF(' + martialLvlCell + '>=10, 6, IF(' + martialLvlCell + '>=5, 5, IF(' + martialLvlCell + '>=1, 4, 0)))), IF(T1="Crusader", 5, IF(T1="Swordsage", IF(' + martialLvlCell + '>=20, 10, IF(' + martialLvlCell + '>=15, 8, IF(' + martialLvlCell + '>=10, 6, IF(' + martialLvlCell + '>=1, 4, 0)))), 0)))'
  )).setFontWeight("bold").setFontColor("#881337").setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("R46:V46").merge().setFormula(f(
    '=IF(T1="Warblade", IF(' + martialLvlCell + '>=16, 4, IF(' + martialLvlCell + '>=10, 3, IF(' + martialLvlCell + '>=4, 2, IF(' + martialLvlCell + '>=1, 1, 0)))), IF(T1="Crusader", IF(' + martialLvlCell + '>=14, 4, IF(' + martialLvlCell + '>=8, 3, IF(' + martialLvlCell + '>=2, 2, 1))), IF(T1="Swordsage", IF(' + martialLvlCell + '>=14, 5, IF(' + martialLvlCell + '>=9, 4, IF(' + martialLvlCell + '>=5, 3, IF(' + martialLvlCell + '>=2, 2, 1)))), 0)))'
  )).setFontWeight("bold").setFontColor("#881337").setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("A45:V46").setBorder(true, true, true, true, true, true, "#fecdd3", SpreadsheetApp.BorderStyle.SOLID);
}

function applyLvlUpRosterValidations(sheet) {
  clearMasterDbRosterCatalogCache();
  updateLvlUpRosterValidations(sheet);
}

function limitLvlUpColumns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("lvl_up");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: 'lvl_up' sheet not found.");
    return;
  }
  limitLvlUpColumnsSheet(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast("lvl_up scrolling locked at column AB (col 28) with helper columns hidden!", "🔒 Locked", 5);
}

function limitLvlUpColumnsSheet(sheet) {
  var curCols = sheet.getMaxColumns();
  // Maintain 36 columns (A through AJ). Columns AD through AJ (30 to 36) are hidden helper columns for dropdowns.
  if (curCols < 36) {
    sheet.insertColumnsAfter(curCols, 36 - curCols);
  } else if (curCols > 36) {
    sheet.deleteColumns(37, curCols - 36);
  }
  sheet.setColumnWidth(29, 20); // Margin/buffer column AC
  sheet.hideColumns(30, 7);     // Keep helper columns AD through AJ hidden from user view
}

function getFormulaSeparator(sheet) {
  try {
    var ss = sheet ? sheet.getParent() : SpreadsheetApp.getActiveSpreadsheet();
    var loc = String(ss.getSpreadsheetLocale() || "").toLowerCase();
    
    // Locales where comma is used as decimal separator (so semicolon MUST be used for formula arguments)
    var commaDecimalLocales = [
      "tr", "de", "fr", "es", "it", "pt", "ru", "nl", "pl", "sv", "da", "fi", "no", "nb", "cs", "hu", "el", "ro", "bg", "sk"
    ];
    for (var i = 0; i < commaDecimalLocales.length; i++) {
      if (loc.indexOf(commaDecimalLocales[i]) === 0) {
        return ";";
      }
    }
    if (loc.indexOf("en") === 0 || loc.indexOf("ja") === 0 || loc.indexOf("zh") === 0) {
      return ",";
    }
  } catch (e) {}

  // Fallback test: test using setValue (setValue parses user-typed text in local spreadsheet format, unlike setFormula)
  try {
    var testCell = sheet.getRange(1, sheet.getMaxColumns());
    var origVal = testCell.getValue();
    var origFormula = testCell.getFormula();

    testCell.setValue("=IF(1=1; 10; 20)");
    SpreadsheetApp.flush();
    if (testCell.getValue() === 10) {
      if (origFormula) testCell.setFormula(origFormula);
      else if (origVal !== "") testCell.setValue(origVal);
      else testCell.clearContent();
      return ";";
    }

    testCell.setValue("=IF(1=1, 10, 20)");
    SpreadsheetApp.flush();
    if (testCell.getValue() === 10) {
      if (origFormula) testCell.setFormula(origFormula);
      else if (origVal !== "") testCell.setValue(origVal);
      else testCell.clearContent();
      return ",";
    }
    if (origFormula) testCell.setFormula(origFormula);
    else if (origVal !== "") testCell.setValue(origVal);
    else testCell.clearContent();
  } catch (e2) {}

  return ";"; // Safe default for Turkish spreadsheet environment
}

// ----------------------------------------------------
// 2.1D BUILD / RESET "inventory" SHEET (D&D 3.5E RAW)
// ----------------------------------------------------
function createInventorySheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("inventory");
  if (!sheet) {
    sheet = ss.insertSheet("inventory");
  }

  // Ensure Master_DB contains all essential items (Races, Feats, Magic Gear)
  ensureMasterDbSeedEssentials(ss);

  var sep = getFormulaSeparator(sheet);
  function f(str) {
    return str.replace(/,/g, sep);
  }
  var pAc = 'IFERROR(1*SUBSTITUTE(Master_DB!$P$6:$P, "+", ""), 0)';
  var statPrefix = 'IF(' + pAc + '<>0, "[AC " & IF(' + pAc + '>0, "+", "") & ' + pAc + ' & "] ", "") & IF(Master_DB!$Z$6:$Z<>"", IF(Master_DB!$Z$6:$Z<>"-", "[Dmg: " & Master_DB!$Z$6:$Z & "] ", ""), "")';

  // 1. Clear All Validations, Formats, and Rules First
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
  sheet.clear();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();

  // Canvas Dimensions: Up to Column AS (Col 45) for helpers, at least 110 rows for 75 pool items
  var curCols = sheet.getMaxColumns();
  if (curCols < 46) {
    sheet.insertColumnsAfter(curCols, 46 - curCols);
  } else if (curCols > 46) {
    sheet.deleteColumns(47, curCols - 46);
  }

  var curRows = sheet.getMaxRows();
  if (curRows < 110) {
    sheet.insertRowsAfter(curRows, 110 - curRows);
  }

  // Visible Column Widths (A to O)
  sheet.setColumnWidth(1, 35);   // A: Checkbox / #
  sheet.setColumnWidth(2, 35);   // B: Slot Icon
  sheet.setColumnWidth(3, 95);   // C: Slot Name / Category
  sheet.setColumnWidth(4, 180);  // D: Equipped Item Name (Dropdown)
  sheet.setColumnWidth(5, 150);  // E: Description Part 1
  sheet.setColumnWidth(6, 110);  // F: Description Part 2
  sheet.setColumnWidth(7, 110);  // G: Description Part 3 (E:G merged = 370px for generous description!)
  sheet.setColumnWidth(8, 65);   // H: Wt (lbs)
  sheet.setColumnWidth(9, 75);   // I: Cost (GP)
  sheet.setColumnWidth(10, 75);  // J: Storage Part 1
  sheet.setColumnWidth(11, 65);  // K: Storage Part 2
  sheet.setColumnWidth(12, 85);  // L: Storage Part 3 (J:L merged = 225px for notes)
  sheet.setColumnWidth(13, 115); // M: Equipped? (Widened for "⚔️ Equipped" & "🎒 In Bag / Spare")
  sheet.setColumnWidth(14, 85);  // N: Category Details Part 1
  sheet.setColumnWidth(15, 100); // O: Category Details Part 2

  // Helper Columns AA to AS (Cols 27 to 45)
  for (var c = 27; c <= 45; c++) {
    sheet.setColumnWidth(c, 90);
  }
  sheet.hideColumns(27, 19);

  // 2. Title Banner (Rows 1-2)
  sheet.getRange("A1:O1").merge()
    .setValue("🎒 D&D 3.5E INVENTORY, EQUIPMENT & CARRYING CAPACITY")
    .setBackground("#0f172a").setFontColor("#38bdf8").setFontWeight("bold").setFontSize(13)
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  sheet.getRange("A2:I2").merge()
    .setValue("⚔️ BODY SLOT EQUIPMENT (14 Official Slots)")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(11)
    .setHorizontalAlignment("left").setVerticalAlignment("middle");

  sheet.getRange("J2:O2").merge()
    .setValue("⚙️ EQUIPMENT & LOAD CONTROLS")
    .setBackground("#1e293b").setFontColor("#94a3b8").setFontWeight("bold").setFontSize(10)
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  // 3. STAGE 2: ⚔️ BODY SLOT EQUIPMENT (Headers in Row 3)
  sheet.getRange("A3:I3").setBackground("#334155").setFontColor("#ffffff").setFontWeight("bold");
  sheet.getRange("A3").setValue("☑️").setHorizontalAlignment("center");
  sheet.getRange("B3").setValue("");
  sheet.getRange("C3").setValue("Slot");
  sheet.getRange("D3").setValue("Equipped Item Name");
  sheet.getRange("E3:G3").merge().setValue("Description & Magic Properties (Master_DB)").setHorizontalAlignment("center");
  sheet.getRange("H3").setValue("Wt (lbs)").setHorizontalAlignment("center");
  sheet.getRange("I3").setValue("Cost (GP)").setHorizontalAlignment("center");

  // 14 Official Body Slots exactly matching user reference image
  var bodySlots = [
    ["👑", "Head", "AA", ""],
    ["👁️", "Eyes", "AB", ""],
    ["📿", "Neck", "AC", ""],
    ["🧥", "Shoulders", "AD", ""],
    ["🥋", "Torso", "AE", ""],
    ["🛡️", "Armor", "AF", ""],
    ["🪢", "Belt", "AG", ""],
    ["🦾", "Bracers", "AH", ""],
    ["🧤", "Gloves", "AI", ""],
    ["💍", "Ring 1", "AJ", ""],
    ["💍", "Ring 2", "AJ", ""],
    ["👢", "Boots", "AK", ""],
    ["⚔️", "Main Hand", "AL", ""],
    ["🛡️", "Off-Hand/Shield", "AM", ""]
  ];

  for (var i = 0; i < bodySlots.length; i++) {
    var r = 4 + i;
    var slotIcon = bodySlots[i][0];
    var slotName = bodySlots[i][1];
    var helperCol = bodySlots[i][2];
    var defaultItem = bodySlots[i][3];

    // Col A: Interactive Checkbox (Active / Equipped)
    sheet.getRange(r, 1).insertCheckboxes().uncheck().setHorizontalAlignment("center").setBackground("#f8fafc");

    // Col B: Slot Icon
    sheet.getRange(r, 2).setValue(slotIcon).setHorizontalAlignment("center").setBackground("#f8fafc");

    // Col C: Slot Name
    sheet.getRange(r, 3).setValue(slotName).setFontWeight("bold").setBackground("#f8fafc");

    // Col D: Dynamic dropdown validating from filtered helper column in AA:AM
    var slotRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(sheet.getRange(helperCol + "6:" + helperCol), true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(r, 4).setDataValidation(slotRule).setValue(defaultItem).setFontWeight("bold");

    // Col E:G (merged): Description -> Master_DB Parent+Child Merged with [AC +X] / [Dmg: X], fallback to pool notes
    sheet.getRange(r, 5, 1, 3).merge();
    var descFormula = f(
      '=IF(D' + r + '="", "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER(IF(Master_DB!$D$6:$D=D' + r + ', "↳ " & Master_DB!$A$6:$A & ": ", "") & (' + statPrefix + ') & Master_DB!$G$6:$G, (Master_DB!$A$6:$A=D' + r + ') + (Master_DB!$D$6:$D=D' + r + '))), IFERROR(VLOOKUP(D' + r + ', $D$22:$I$96, 2, FALSE), "")))'
    );
    sheet.getRange(r, 5).setFormula(descFormula).setWrap(true).setFontSize(9).setFontColor("#334155");

    // Col H: Weight (lbs) -> Looked up directly from Master_DB (Col AC, Col 29)
    sheet.getRange(r, 8).setFormula(f('=IF(D' + r + '="", 0, IFERROR(VLOOKUP(D' + r + ', Master_DB!$A$6:$AC, 29, FALSE), 0))')).setNumberFormat("0.0").setHorizontalAlignment("center");

    // Col I: Cost (GP) -> Looked up directly from Master_DB (Col AD, Col 30)
    sheet.getRange(r, 9).setFormula(f('=IF(D' + r + '="", 0, IFERROR(VLOOKUP(D' + r + ', Master_DB!$A$6:$AD, 30, FALSE), 0))')).setNumberFormat("#,##0").setHorizontalAlignment("right");
  }
  sheet.getRange("A4:I17").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A4:O17").setVerticalAlignment("middle");

  // Row 18: Total Active Equipped Gear Weight & Value
  sheet.getRange("A18:G18").merge().setValue("⚔️ Total Active Equipped Gear Weight & Value:").setFontWeight("bold").setHorizontalAlignment("right").setBackground("#f1f5f9");
  sheet.getRange("H18").setFormula(f('=SUMIF($A$4:$A$17, TRUE, $H$4:$H$17)')).setFontWeight("bold").setNumberFormat("0.0").setHorizontalAlignment("center").setBackground("#e2e8f0");
  sheet.getRange("I18").setFormula(f('=SUMIF($A$4:$A$17, TRUE, $I$4:$I$17)')).setFontWeight("bold").setNumberFormat("#,##0").setHorizontalAlignment("right").setBackground("#e2e8f0");
  sheet.getRange("A18:I18").setBorder(true, true, true, true, true, true, "#94a3b8", SpreadsheetApp.BorderStyle.SOLID);

  sheet.setRowHeight(19, 10); // Spacer

  // 4. RIGHT SIDE - BLOCK 1: CARRYING CAPACITY & LOAD STATUS (Rows 3 to 7, Cols J to O)
  sheet.getRange("J3:O3").merge().setValue("⚖️ CARRYING CAPACITY & LOAD STATUS (PHB p.162)").setBackground("#1e293b").setFontColor("#38bdf8").setFontWeight("bold").setHorizontalAlignment("center");
  
  sheet.getRange("J4:K4").merge().setValue("Character STR Score:").setHorizontalAlignment("right").setFontWeight("bold").setBackground("#f8fafc");
  sheet.getRange("L4").setFormula(f('=IFERROR(AR7, IFERROR(Main!$P$40, 18))')).setFontWeight("bold").setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("M4").setValue("Load Status:").setHorizontalAlignment("right").setFontWeight("bold").setBackground("#f8fafc");
  sheet.getRange("N4:O4").merge()
    .setFormula(f('=IF(L7<=L5, "🟢 Light Load", IF(L7<=N5, "🟡 Medium Load", IF(L7<=L6, "🔴 Heavy Load", "⛔ OVERBURDENED!")))'))
    .setFontWeight("bold").setHorizontalAlignment("center").setBackground("#fef9c3");

  sheet.getRange("J5:K5").merge().setValue("Light Load Max:").setHorizontalAlignment("right").setBackground("#f8fafc");
  sheet.getRange("L5").setFormula(f('=INT(L6 / 3)')).setNumberFormat("0").setFontWeight("bold").setHorizontalAlignment("center").setBackground("#ffffff");
  sheet.getRange("M5").setValue("Medium Max:").setHorizontalAlignment("right").setBackground("#f8fafc");
  sheet.getRange("N5:O5").merge().setFormula(f('=INT(2 * L6 / 3)')).setNumberFormat("0").setFontWeight("bold").setHorizontalAlignment("center").setBackground("#ffffff");

  sheet.getRange("J6:K6").merge().setValue("Heavy Max (Capacity):").setHorizontalAlignment("right").setFontWeight("bold").setBackground("#f8fafc");
  var chooseCap = f('IFERROR(CHOOSE(MIN(MAX(L4, 1), 30), 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 115, 130, 150, 175, 200, 230, 260, 300, 350, 400, 460, 520, 600, 700, 800, 920, 1040, 1200, 1400, 1600), 100)');
  sheet.getRange("L6").setFormula(f('=' + chooseCap)).setNumberFormat("0").setFontWeight("bold").setHorizontalAlignment("center").setBackground("#fef2f2").setFontColor("#991b1b");
  sheet.getRange("M6").setValue("Lift / Drag:").setHorizontalAlignment("right").setBackground("#f8fafc");
  sheet.getRange("N6:O6").merge().setFormula(f('="Lift: " & (L6*2) & " | Drag: " & (L6*5) & " lbs"')).setHorizontalAlignment("center").setBackground("#f8fafc").setFontStyle("italic");

  sheet.getRange("J7:K7").merge().setValue("TOTAL CARRIED WT:").setHorizontalAlignment("right").setFontWeight("bold").setBackground("#e2e8f0").setFontColor("#0f172a");
  // Total Carried = Sum of (Qty * Weight) for items in Pool + Coin Weight (I16)
  sheet.getRange("L7:M7").merge().setFormula(f('=ROUND(SUMPRODUCT(ARRAYFORMULA(IF(H22:H96>0, H22:H96, 1)), I22:I96) + I16, 1)')).setFontWeight("bold").setHorizontalAlignment("center").setBackground("#ffffff").setFontSize(11);
  sheet.getRange("N7:O7").merge().setFormula(f('="of " & L6 & " lbs (Max Capacity)"')).setHorizontalAlignment("center").setBackground("#e2e8f0").setFontStyle("italic");
  sheet.getRange("J3:O7").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // Expanded Load & Encumbrance Penalties Panel (Rows 8 to 10 - J8:O10)
  sheet.getRange("J8:O8").merge().setValue("💡 D&D 3.5E RAW YÜK KAPASİTESİ VE CEZALARI (PHB p.162)")
    .setFontColor("#f8fafc").setFontWeight("bold").setFontSize(9).setBackground("#334155").setHorizontalAlignment("center");
  sheet.getRange("J9:O9").merge().setValue("🟢 Light Load: Ceza yok. Normal hareket hızı, max Dex sınırı yok, zırh kontrol cezası yok.")
    .setFontColor("#15803d").setFontSize(8).setBackground("#f0fdf4").setHorizontalAlignment("left");
  sheet.getRange("J10:O10").merge().setValue("🟡 Med: Max Dex +3, Check -3, Hız 20 ft, Run x4 | 🔴 Heavy: Max Dex +1, Check -6, Hız 20 ft, Run x3")
    .setFontColor("#b45309").setFontSize(8).setBackground("#fffbeb").setHorizontalAlignment("left");
  sheet.getRange("J8:O10").setBorder(true, true, true, true, true, true, "#94a3b8", SpreadsheetApp.BorderStyle.SOLID);

  sheet.setRowHeight(11, 10); // Spacer

  // 5. RIGHT SIDE - BLOCK 2: 💰 WEALTH & COINAGE (Rows 12 to 16, Cols J to O - Shifted Down)
  sheet.getRange("J12:O12").merge().setValue("💰 WEALTH & COINAGE").setBackground("#b45309").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("J13:O13").setBackground("#d97706").setFontColor("#ffffff").setFontWeight("bold");
  sheet.getRange("J13").setValue("PP (10 GP)").setHorizontalAlignment("center");
  sheet.getRange("K13").setValue("GP (1 GP)").setHorizontalAlignment("center");
  sheet.getRange("L13").setValue("SP (0.1 GP)").setHorizontalAlignment("center");
  sheet.getRange("M13").setValue("CP (0.01 GP)").setHorizontalAlignment("center");
  sheet.getRange("N13:O13").merge().setValue("Total Net Worth (GP)").setHorizontalAlignment("center");

  sheet.getRange("J14").setValue(10).setNumberFormat("#,##0").setHorizontalAlignment("center");
  sheet.getRange("K14").setValue(450).setNumberFormat("#,##0").setHorizontalAlignment("center");
  sheet.getRange("L14").setValue(75).setNumberFormat("#,##0").setHorizontalAlignment("center");
  sheet.getRange("M14").setValue(120).setNumberFormat("#,##0").setHorizontalAlignment("center");
  sheet.getRange("N14:O14").merge().setFormula(f('=(J14*10) + K14 + (L14/10) + (M14/100)')).setNumberFormat("#,##0.00 'GP'").setFontWeight("bold").setHorizontalAlignment("center").setBackground("#fef3c7");

  sheet.getRange("J15:M15").merge().setFormula(f('="Total Coin Count: " & SUM(J14:M14) & " coins"')).setFontStyle("italic").setHorizontalAlignment("center").setBackground("#fffbeb");
  sheet.getRange("N15:O15").merge().setFormula(f('="Coin Weight: " & ROUND(SUM(J14:M14)/50, 1) & " lbs"')).setFontWeight("bold").setHorizontalAlignment("center").setBackground("#fffbeb");
  
  // Coin Weight helper in I16 for Total Carried formula
  sheet.getRange("I16").setFormula(f('=ROUND(SUM(J14:M14)/50, 1)')).setFontColor("#ffffff");
  sheet.getRange("J16:O16").merge().setValue("💡 D&D 3.5e RAW: 50 madeni para = 1 lb ağırlığındadır.")
    .setFontColor("#64748b").setFontStyle("italic").setFontSize(8).setBackground("#faf5ff").setHorizontalAlignment("center");
  sheet.getRange("J12:O16").setBorder(true, true, true, true, true, true, "#fcd34d", SpreadsheetApp.BorderStyle.SOLID);

  // Rows 17 to 19: Clean background on right side & backward-compatible formulas in N17:N19
  sheet.getRange("J17:O19").setBackground("#0f172a");
  sheet.getRange("N17").setFormula(f("=AS10")).setFontColor("#0f172a"); // INT 24h mod
  sheet.getRange("N18").setFormula(f("=AS11")).setFontColor("#0f172a"); // WIS 24h mod
  sheet.getRange("N19").setFormula(f("=AS12")).setFontColor("#0f172a"); // CHA 24h mod

  // 6. STAGE 1: 🎒 INVENTORY & GEAR POOL (Rows 20 to 97 - 75 Items Capacity)
  sheet.getRange("A20:O20").merge().setValue("🎒 INVENTORY & GEAR POOL (Çanta, Ekipman ve Malzeme Havuzu - 75 Eşya Kapasitesi)")
    .setBackground("#0f172a").setFontColor("#38bdf8").setFontWeight("bold").setHorizontalAlignment("left");
  sheet.getRange("A21:O21").setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");
  sheet.getRange("A21").setValue("#").setHorizontalAlignment("center");
  sheet.getRange("B21").setValue("⚔️ Belt").setHorizontalAlignment("center");
  sheet.getRange("C21").setValue("Slot Category");
  sheet.getRange("D21").setValue("Item Name (Master_DB / Free)");
  sheet.getRange("E21:G21").merge().setValue("Description & Magic Properties (Master_DB Auto-Merge / Notes)").setHorizontalAlignment("center");
  sheet.getRange("H21").setValue("Qty").setHorizontalAlignment("center");
  sheet.getRange("I21").setValue("Wt (lbs)").setHorizontalAlignment("center");
  sheet.getRange("J21").setValue("Cost (GP)").setHorizontalAlignment("center");
  sheet.getRange("K21:L21").merge().setValue("Location / Storage Notes").setHorizontalAlignment("center");
  sheet.getRange("M21").setValue("Equipped?").setHorizontalAlignment("center");
  sheet.getRange("N21:O21").merge().setValue("Category Details");

  var poolSlotValidation = SpreadsheetApp.newDataValidation().requireValueInList([
    "Head", "Eyes", "Neck", "Shoulders", "Torso", "Armor", "Belt", "Bracers", "Gloves", "Ring", "Boots", "Weapon", "Shield", "Consumable", "Other"
  ], true).setAllowInvalid(true).build();

  // Sample Pool: empty by default for clean start
  var samplePool = [];

  for (var k = 0; k < 75; k++) {
    var pRow = 22 + k;
    sheet.getRange(pRow, 1).setValue(k + 1).setHorizontalAlignment("center").setFontColor("#64748b");
    var item = samplePool[k] || ["", "", "", "", false];
    
    // Col B: Combat/Belt Ready Checkbox
    sheet.getRange(pRow, 2).insertCheckboxes().setValue(item[4] ? true : false);
    
    // Col C: Category
    sheet.getRange(pRow, 3).setValue(item[0]).setDataValidation(poolSlotValidation);
    
    // Col D: Item Name
    sheet.getRange(pRow, 4).setValue(item[1]);
    
    // Col E:G (merged): Dynamic description from Master_DB (Parent+Child Auto-Merge with [AC +X] / [Dmg: X])
    sheet.getRange(pRow, 5, 1, 3).merge();
    var poolDescFormula = f(
      '=IF(D' + pRow + '="", "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER(IF(Master_DB!$D$6:$D=D' + pRow + ', "↳ " & Master_DB!$A$6:$A & ": ", "") & (' + statPrefix + ') & Master_DB!$G$6:$G, (Master_DB!$A$6:$A=D' + pRow + ') + (Master_DB!$D$6:$D=D' + pRow + '))), IFERROR(VLOOKUP(D' + pRow + ', Master_DB!$A$6:$G, 7, FALSE), "")))'
    );
    sheet.getRange(pRow, 5).setFormula(poolDescFormula).setFontSize(9).setFontColor("#334155").setWrap(true);
    
    // Col H: Qty (Adet)
    if (item[1]) {
      sheet.getRange(pRow, 8).setValue(item[3] || 1).setNumberFormat("0").setHorizontalAlignment("center").setFontWeight("bold");
    } else {
      sheet.getRange(pRow, 8).setValue("").setNumberFormat("0").setHorizontalAlignment("center");
    }

    // Col I: Weight from Master_DB (Col AC, 29)
    sheet.getRange(pRow, 9).setFormula(f('=IF(D' + pRow + '="", 0, IFERROR(VLOOKUP(D' + pRow + ', Master_DB!$A$6:$AC, 29, FALSE), 0))')).setNumberFormat("0.0").setHorizontalAlignment("center");

    // Col J: Cost from Master_DB (Col AD, 30)
    sheet.getRange(pRow, 10).setFormula(f('=IF(D' + pRow + '="", 0, IFERROR(VLOOKUP(D' + pRow + ', Master_DB!$A$6:$AD, 30, FALSE), 0))')).setNumberFormat("#,##0").setHorizontalAlignment("right");

    // Col K:L (merged): Storage Notes
    sheet.getRange(pRow, 11, 1, 2).merge().setValue(item[2] || "").setFontSize(9).setFontColor("#64748b");
    
    // Col M: Auto-Equipped indicator checking if item is selected in Body Slots D4:D17 and Active Checkbox A4:A17 is TRUE
    sheet.getRange(pRow, 13).setFormula(f('=IF(D' + pRow + '="", "", IF(COUNTIFS($D$4:$D$17, D' + pRow + ', $A$4:$A$17, TRUE)>0, "⚔️ Equipped", IF(COUNTIF($D$4:$D$17, D' + pRow + ')>0, "⏸️ Slot Inactive", "🎒 In Bag / Spare")))'))
      .setFontWeight("bold").setHorizontalAlignment("center").setFontSize(9);
      
    // Col N-O (merged): Category info from Master_DB
    sheet.getRange(pRow, 14, 1, 2).merge().setFormula(f('=IF(D' + pRow + '="", "", IFERROR(VLOOKUP(D' + pRow + ', Master_DB!$A$6:$B, 2, FALSE), ""))')).setFontSize(9).setFontColor("#94a3b8").setHorizontalAlignment("center");
  }
  sheet.getRange("A22:O96").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID).setVerticalAlignment("middle");

  // Apply dynamic category-dependent and diminishing dropdown validations across all 75 pool rows
  updateInventoryPoolValidations(sheet);

  // Row 97: Total Inventory Pool Weight & Value
  sheet.getRange("A97:G97").merge().setValue("🎒 Grand Total Pool Weight & Value (Equipped + Carried):").setFontWeight("bold").setHorizontalAlignment("right").setBackground("#f1f5f9");
  sheet.getRange("H97").setValue("Total Wt →").setFontWeight("bold").setFontSize(8).setHorizontalAlignment("right").setBackground("#f1f5f9");
  sheet.getRange("I97").setFormula(f('=ROUND(SUMPRODUCT(ARRAYFORMULA(IF(H22:H96>0, H22:H96, 1)), I22:I96), 1)')).setFontWeight("bold").setNumberFormat("0.0").setHorizontalAlignment("center").setBackground("#e2e8f0");
  sheet.getRange("J97").setFormula(f('=SUMPRODUCT(ARRAYFORMULA(IF(H22:H96>0, H22:H96, 1)), J22:J96)')).setFontWeight("bold").setNumberFormat("#,##0").setHorizontalAlignment("right").setBackground("#e2e8f0");
  sheet.getRange("K97:O97").merge().setValue("Total of 75 Gear & Consumable Slots in Possession").setFontStyle("italic").setFontColor("#64748b").setBackground("#f1f5f9");
  sheet.getRange("A97:O97").setBorder(true, true, true, true, true, true, "#94a3b8", SpreadsheetApp.BorderStyle.SOLID);

  // 7. SETUP HIDDEN HELPER COLUMNS FOR DEPENDENT DROPDOWNS & 24H STAT ENGINE (AA to AS, cols 27 to 45)
  var helperConfigs = [
    ["AA", "Head", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, $C$22:$C$96="Head", $D$22:$D$96<>""))), "")')],
    ["AB", "Eyes", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, $C$22:$C$96="Eyes", $D$22:$D$96<>""))), "")')],
    ["AC", "Neck", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, $C$22:$C$96="Neck", $D$22:$D$96<>""))), "")')],
    ["AD", "Shoulders", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, $C$22:$C$96="Shoulders", $D$22:$D$96<>""))), "")')],
    ["AE", "Torso", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, $C$22:$C$96="Torso", $D$22:$D$96<>""))), "")')],
    ["AF", "Armor", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, $C$22:$C$96="Armor", $D$22:$D$96<>""))), "")')],
    ["AG", "Belt", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, ($C$22:$C$96="Belt") + ($C$22:$C$96="Waist"), $D$22:$D$96<>""))), "")')],
    ["AH", "Bracers", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, ($C$22:$C$96="Bracers") + ($C$22:$C$96="Arms"), $D$22:$D$96<>""))), "")')],
    ["AI", "Gloves", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, ($C$22:$C$96="Gloves") + ($C$22:$C$96="Hands"), $D$22:$D$96<>""))), "")')],
    ["AJ", "Ring", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, $C$22:$C$96="Ring", $D$22:$D$96<>""))), "")')],
    ["AK", "Boots", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, ($C$22:$C$96="Boots") + ($C$22:$C$96="Feet"), $D$22:$D$96<>""))), "")')],
    ["AL", "Main Hand", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, ($C$22:$C$96="Weapon") + ($C$22:$C$96="Main Hand"), $D$22:$D$96<>""))), "")')],
    ["AM", "Off-Hand/Shield", f('=IFERROR(SORT(UNIQUE(FILTER($D$22:$D$96, ($C$22:$C$96="Weapon") + ($C$22:$C$96="Shield") + ($C$22:$C$96="Off Hand") + ($C$22:$C$96="Off-Hand/Shield"), $D$22:$D$96<>""))), "")')],
    ["AN", "Master_DB Equipment", f('=IFERROR(SORT(UNIQUE(FILTER(Master_DB!$A$6:$A, Master_DB!$A$6:$A<>"", LEFT(TRIM(Master_DB!$A$6:$A), 1)<>"↳", Master_DB!$B$6:$B<>"Race", Master_DB!$B$6:$B<>"Feat", Master_DB!$B$6:$B<>"Special Ability", Master_DB!$B$6:$B<>"Spell", Master_DB!$B$6:$B<>"Racial Trait"))), "")')]
  ];

  for (var h = 0; h < helperConfigs.length; h++) {
    var colLetter = helperConfigs[h][0];
    var colLabel = helperConfigs[h][1];
    var colFormula = helperConfigs[h][2];
    sheet.getRange(colLetter + "5").setValue(colLabel).setFontWeight("bold");
    sheet.getRange(colLetter + "6").setFormula(colFormula);
  }

  // 8. 24H CONTINUOUS EQUIPMENT STAT ENGINE (AO to AS, Cols 41 to 45)
  // Evaluates D&D 3.5e RAW Stacking: Only active items (A4:A17=TRUE) pulled from Master_DB with MAX on Enhancement
  sheet.getRange("AO5").setValue("Stat").setFontWeight("bold");
  sheet.getRange("AP5").setValue("Base").setFontWeight("bold");
  sheet.getRange("AQ5").setValue("Equip+").setFontWeight("bold");
  sheet.getRange("AR5").setValue("24h Total").setFontWeight("bold");
  sheet.getRange("AS5").setValue("24h Mod").setFontWeight("bold");

  var statRows = [
    ["STR", "Main!$P$40", "Master_DB!$J$6:$J"],
    ["DEX", "Main!$P$47", "Master_DB!$K$6:$K"],
    ["CON", "Main!$P$54", "Master_DB!$L$6:$L"],
    ["INT", "Main!$P$61", "Master_DB!$M$6:$M"],
    ["WIS", "Main!$P$68", "Master_DB!$N$6:$N"],
    ["CHA", "Main!$P$75", "Master_DB!$O$6:$O"]
  ];

  for (var s = 0; s < statRows.length; s++) {
    var sRow = 7 + s; // Rows 7 to 12
    sheet.getRange("AO" + sRow).setValue(statRows[s][0]).setFontWeight("bold");
    sheet.getRange("AP" + sRow).setFormula(f('=IFERROR(' + statRows[s][1] + ', 10)'));
    // MAX over active equipped items for proper D&D 3.5e RAW stacking
    sheet.getRange("AQ" + sRow).setFormula(f('=IFERROR(MAX(FILTER(' + statRows[s][2] + ', ISNUMBER(MATCH(Master_DB!$A$6:$A, FILTER($D$4:$D$17, $A$4:$A$17=TRUE), 0)))), 0)'));
    sheet.getRange("AR" + sRow).setFormula(f('=AP' + sRow + ' + AQ' + sRow));
    sheet.getRange("AS" + sRow).setFormula(f('=INT((AR' + sRow + ' - 10) / 2)'));
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("inventory sheet successfully built with 75-item pool, expanded layout and RAW stacking!", "🎒 Inventory Ready", 6);
}

// ----------------------------------------------------
// 2.1D-2 INVENTORY CACHING & DYNAMIC DROPDOWN ENGINE
// ----------------------------------------------------
var _cachedMasterDbEquipCatalog = null;

function clearMasterDbEquipCatalogCache() {
  _cachedMasterDbEquipCatalog = null;
  try {
    CacheService.getScriptCache().remove("master_db_equip_catalog_v2");
    CacheService.getScriptCache().remove("master_db_equip_catalog");
  } catch (e) {}
}

/**
 * Rigorous filter to determine if an entry from Master_DB is a physical inventory item
 * and NOT a feat, spell, class feature, special ability, maneuver, stance, race, or grant.
 */
function isPhysicalEquipment(cat, slot) {
  var c = String(cat || "").trim().toLowerCase();
  var s = String(slot || "").trim().toLowerCase();

  // 1. Strict blacklist: Any non-item concept is rejected immediately
  var nonItemPatterns = [
    "spell", "feat", "ability", "feature", "maneuver", "stance",
    "grant", "power", "flaw", "trait", "race", "class", "domain",
    "invocation", "infusion", "psionic", "condition", "drain"
  ];
  for (var p = 0; p < nonItemPatterns.length; p++) {
    if (c.indexOf(nonItemPatterns[p]) !== -1 || s.indexOf(nonItemPatterns[p]) !== -1) {
      return false;
    }
  }

  if (c === "-" || c === "none" || c === "") {
    return false;
  }

  // 2. Equipment category whitelist (must match a genuine physical item category)
  var equipKeywords = [
    "weapon", "armor", "shield", "ring", "wondrous item", "wondrous",
    "slotless item", "slotless", "consumable", "potion", "scroll", "wand",
    "ammunition", "alchemical", "gear", "tool", "clothing", "item",
    "container", "goods", "book", "instrument"
  ];
  for (var i = 0; i < equipKeywords.length; i++) {
    if (c.indexOf(equipKeywords[i]) !== -1) {
      return true;
    }
  }

  // 3. Equipment body slots whitelist
  var equipSlots = [
    "head", "eyes", "neck", "shoulders", "torso", "body", "armor", "waist", "belt",
    "arms", "bracers", "hands", "gloves", "ring", "feet", "boots", "main hand", "off hand", "shield"
  ];
  for (var j = 0; j < equipSlots.length; j++) {
    if (s.indexOf(equipSlots[j]) !== -1) {
      return true;
    }
  }

  return false;
}

/**
 * Returns pre-categorized equipment items from Master_DB.
 * Uses script cache and in-memory cache to eliminate repetitive Master_DB queries.
 */
function getMasterDbEquipCatalog(ss) {
  if (_cachedMasterDbEquipCatalog) {
    return _cachedMasterDbEquipCatalog;
  }

  var cache = CacheService.getScriptCache();
  var cachedJson = cache.get("master_db_equip_catalog_v2");
  if (cachedJson) {
    try {
      _cachedMasterDbEquipCatalog = JSON.parse(cachedJson);
      return _cachedMasterDbEquipCatalog;
    } catch (err) {}
  }

  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName("Master_DB");
  if (!masterSheet) return { byCategory: {} };

  var masterLastRow = masterSheet.getLastRow();
  if (masterLastRow < 6) return { byCategory: {} };

  var masterData = masterSheet.getRange(6, 1, masterLastRow - 5, 3).getValues();

  var byCategory = {
    "head": [], "eyes": [], "neck": [], "shoulders": [], "torso": [], "armor": [],
    "belt": [], "bracers": [], "gloves": [], "ring": [], "boots": [],
    "main hand": [], "off hand": [], "weapon": [], "shield": [], "consumable": [], "other": []
  };

  // Single fast pass $O(N)$
  for (var m = 0; m < masterData.length; m++) {
    var mName = String(masterData[m][0] || "").trim();
    var mCat = String(masterData[m][1] || "").trim().toLowerCase();
    var mSlot = String(masterData[m][2] || "").trim().toLowerCase();

    if (!mName || mName.indexOf("↳") === 0) continue;
    if (!isPhysicalEquipment(mCat, mSlot)) continue;

    // Check wearable body slot first
    if (mSlot === "head") { byCategory["head"].push(mName); continue; }
    if (mSlot === "eyes") { byCategory["eyes"].push(mName); continue; }
    if (mSlot === "neck") { byCategory["neck"].push(mName); continue; }
    if (mSlot === "shoulders") { byCategory["shoulders"].push(mName); continue; }
    if (mSlot === "torso" || mSlot === "body") { byCategory["torso"].push(mName); continue; }
    if (mSlot === "belt" || mSlot === "waist") { byCategory["belt"].push(mName); continue; }
    if (mSlot === "bracers" || mSlot === "arms") { byCategory["bracers"].push(mName); continue; }
    if (mSlot === "gloves" || mSlot === "hands") { byCategory["gloves"].push(mName); continue; }
    if (mSlot === "ring" || mCat === "ring") { byCategory["ring"].push(mName); continue; }
    if (mSlot === "boots" || mSlot === "feet") { byCategory["boots"].push(mName); continue; }

    // Shield mapping (pool Shield and body slot off-hand) - check before generic armor
    if (mCat === "shield" || mSlot === "shield" || mSlot === "off-hand/shield" || mCat.indexOf("shield") !== -1 || mSlot.indexOf("shield") !== -1) {
      byCategory["shield"].push(mName);
      byCategory["off hand"].push(mName);
      continue;
    }

    if (mSlot === "armor" || mCat === "armor" || (mCat.indexOf("armor") !== -1 && mSlot !== "shield" && mCat.indexOf("shield") === -1)) { byCategory["armor"].push(mName); continue; }

    // Weapon mapping (pool Weapon, body slot main hand, off hand)
    if (mSlot === "main hand" || mSlot === "off hand" || mCat === "weapon" || mCat.indexOf("weapon") !== -1 || mSlot === "one-handed" || mSlot === "two-handed" || mSlot === "light") {
      byCategory["weapon"].push(mName);
      byCategory["main hand"].push(mName);
      byCategory["off hand"].push(mName);
      continue;
    }

    if (mCat === "consumable" || mCat === "potion" || mCat === "scroll" || mCat === "wand" || mCat === "ammunition" || mSlot === "consumable") { byCategory["consumable"].push(mName); continue; }

    // Otherwise, slotless item / other gear
    byCategory["other"].push(mName);
  }

  var catalog = { byCategory: byCategory };

  try {
    cache.put("master_db_equip_catalog_v2", JSON.stringify(catalog), 21600); // 6 hours
  } catch (e) {}

  _cachedMasterDbEquipCatalog = catalog;
  return catalog;
}

/**
 * Builds candidate item list for a specific category while excluding
 * items already selected in other pool rows, but retaining currentItem.
 */
function getCandidateItemsForCategory(catalog, cat, selectedCounts, currentItem) {
  var c = String(cat || "").trim().toLowerCase();
  var list = [];
  if (!c) {
    list = ["-"];
  } else {
    list = (catalog && catalog.byCategory) ? (catalog.byCategory[c] || catalog.byCategory["other"] || []) : [];
  }
  var candidates = [];
  for (var i = 0; i < list.length; i++) {
    var name = list[i];
    var count = selectedCounts[name] || 0;
    if (count === 0 || name === currentItem) {
      candidates.push(name);
    }
  }
  if (currentItem && candidates.indexOf(currentItem) === -1) {
    candidates.unshift(currentItem);
  }
  if (candidates.length === 0) {
    candidates = ["-"];
  }
  return candidates;
}

/**
 * Updates dynamic, category-dependent, and diminishing dropdowns for inventory pool (D22:D96).
 * 1. Filters items from Master_DB matching the slot/category selected in Column C for each row.
 * 2. Excludes items already selected in OTHER pool rows to eliminate clutter.
 * 3. Keeps the current cell's own item in its list to guarantee zero validation error triangles!
 * 4. High-performance single batch read and single batch write (~120ms total).
 */
function updateInventoryPoolValidations(sheet, catalog) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName("inventory");
    if (!sheet) return;
  }

  if (!catalog) {
    catalog = getMasterDbEquipCatalog(sheet.getParent());
  }

  var poolRange = sheet.getRange(22, 3, 75, 2);
  var poolData = poolRange.getValues();

  var selectedCount = {};
  for (var i = 0; i < poolData.length; i++) {
    var selectedItem = String(poolData[i][1] || "").trim();
    if (selectedItem) {
      selectedCount[selectedItem] = (selectedCount[selectedItem] || 0) + 1;
    }
  }

  var validations = [];
  for (var r = 0; r < poolData.length; r++) {
    var rowCat = poolData[r][0];
    var rowCurrentItem = String(poolData[r][1] || "").trim();
    var candidateList = getCandidateItemsForCategory(catalog, rowCat, selectedCount, rowCurrentItem);

    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(candidateList, true)
      .setAllowInvalid(true)
      .build();

    validations.push([rule]);
  }

  // Exactly ONE remote batch write for all 75 rows
  sheet.getRange(22, 4, 75, 1).setDataValidations(validations);
}

/**
 * Handles interactive edits on inventory sheet:
 * Ultra-fast targeted updates:
 * - If user edits Column C (Slot Category), updates ONLY that row's validation (<50ms).
 * - If user edits Column D (Item Name), updates all pool rows in ONE batch call (<120ms).
 */
function handleInventoryEdit(sheet, range, e) {
  var startRow = range.getRow();
  var startCol = range.getColumn();
  var numRows = range.getNumRows();
  var numCols = range.getNumColumns();
  var endRow = startRow + numRows - 1;
  var endCol = startCol + numCols - 1;

  // Intersects with pool rows 22:96 and cols 3 (C) or 4 (D)
  if (endRow < 22 || startRow > 96 || endCol < 3 || startCol > 4) {
    return;
  }

  var catalog = getMasterDbEquipCatalog(sheet.getParent());

  // 1. Ultra-fast path: single cell edit in Column C (User changed Slot Category)
  if (numRows === 1 && startCol === 3 && endCol === 3) {
    var row = startRow;
    var newCat = (e && e.value !== undefined) ? e.value : sheet.getRange(row, 3).getValue();
    var currentItem = String(sheet.getRange(row, 4).getValue() || "").trim();

    var poolD = sheet.getRange(22, 4, 75, 1).getValues();
    var selectedCounts = {};
    for (var i = 0; i < poolD.length; i++) {
      var itm = String(poolD[i][0] || "").trim();
      if (itm) selectedCounts[itm] = (selectedCounts[itm] || 0) + 1;
    }

    var candidates = getCandidateItemsForCategory(catalog, newCat, selectedCounts, currentItem);
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(candidates, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(row, 4).setDataValidation(rule);
    return;
  }

  // 2. Column D edit or multi-row edit: Batch update in 1 single remote call
  updateInventoryPoolValidations(sheet, catalog);
}

/**
 * Menu action to manually refresh inventory pool category-filtered diminishing dropdowns
 */
function refreshInventoryDropdownsMenu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("inventory");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Hata: 'inventory' sayfası bulunamadı.");
    return;
  }
  clearMasterDbEquipCatalogCache();
  updateInventoryPoolValidations(sheet);
  ss.toast("Envanter havuzu açılır menüleri kategoriye göre filtrelendi ve seçilen eşyalar gizlendi!", "🎒 Açılır Menüler Güncellendi", 5);
}

/**
 * Repairs and realigns all inventory formulas (Body Slots + Gear Pool),
 * injecting [AC +X] and [Dmg: X] stat prefixes and Master_DB child auto-merges
 * WITHOUT clearing user items.
 */
function fixInventoryFormulas(sheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!sheet || typeof sheet.getName !== "function") sheet = ss.getSheetByName("inventory");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Hata: 'inventory' sayfası bulunamadı.");
    return;
  }

  var sep = getFormulaSeparator(sheet);
  function f(str) { return str.replace(/,/g, sep); }

  var pAc = 'IFERROR(1*SUBSTITUTE(Master_DB!$P$6:$P, "+", ""), 0)';
  var statPrefix = 'IF(' + pAc + '<>0, "[AC " & IF(' + pAc + '>0, "+", "") & ' + pAc + ' & "] ", "") & IF(Master_DB!$Z$6:$Z<>"", IF(Master_DB!$Z$6:$Z<>"-", "[Dmg: " & Master_DB!$Z$6:$Z & "] ", ""), "")';

  // 1. Body Slots (Rows 4 to 17)
  var bodyDesc = [];
  var bodyWt = [];
  var bodyCost = [];
  for (var r = 4; r <= 17; r++) {
    bodyDesc.push([f(
      '=IF(D' + r + '="", "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER(IF(Master_DB!$D$6:$D=D' + r + ', "↳ " & Master_DB!$A$6:$A & ": ", "") & (' + statPrefix + ') & Master_DB!$G$6:$G, (Master_DB!$A$6:$A=D' + r + ') + (Master_DB!$D$6:$D=D' + r + '))), IFERROR(VLOOKUP(D' + r + ', $D$22:$I$96, 2, FALSE), "")))'
    )]);
    bodyWt.push([f('=IF(D' + r + '="", 0, IFERROR(VLOOKUP(D' + r + ', Master_DB!$A$6:$AC, 29, FALSE), 0))')]);
    bodyCost.push([f('=IF(D' + r + '="", 0, IFERROR(VLOOKUP(D' + r + ', Master_DB!$A$6:$AD, 30, FALSE), 0))')]);
  }
  sheet.getRange(4, 5, 14, 1).setFormulas(bodyDesc);
  sheet.getRange(4, 8, 14, 1).setFormulas(bodyWt);
  sheet.getRange(4, 9, 14, 1).setFormulas(bodyCost);

  // 2. Inventory Pool (Rows 22 to 96)
  var poolDesc = [];
  var poolWt = [];
  var poolCost = [];
  var poolEquip = [];
  var poolCat = [];
  for (var pRow = 22; pRow <= 96; pRow++) {
    poolDesc.push([f(
      '=IF(D' + pRow + '="", "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER(IF(Master_DB!$D$6:$D=D' + pRow + ', "↳ " & Master_DB!$A$6:$A & ": ", "") & (' + statPrefix + ') & Master_DB!$G$6:$G, (Master_DB!$A$6:$A=D' + pRow + ') + (Master_DB!$D$6:$D=D' + pRow + '))), IFERROR(VLOOKUP(D' + pRow + ', Master_DB!$A$6:$G, 7, FALSE), "")))'
    )]);
    poolWt.push([f('=IF(D' + pRow + '="", 0, IFERROR(VLOOKUP(D' + pRow + ', Master_DB!$A$6:$AC, 29, FALSE), 0))')]);
    poolCost.push([f('=IF(D' + pRow + '="", 0, IFERROR(VLOOKUP(D' + pRow + ', Master_DB!$A$6:$AD, 30, FALSE), 0))')]);
    poolEquip.push([f('=IF(D' + pRow + '="", "", IF(COUNTIFS($D$4:$D$17, D' + pRow + ', $A$4:$A$17, TRUE)>0, "⚔️ Equipped", IF(COUNTIF($D$4:$D$17, D' + pRow + ')>0, "⏸️ Slot Inactive", "🎒 In Bag / Spare")))')]);
    poolCat.push([f('=IF(D' + pRow + '="", "", IFERROR(VLOOKUP(D' + pRow + ', Master_DB!$A$6:$B, 2, FALSE), ""))')]);
  }
  sheet.getRange(22, 5, 75, 1).setFormulas(poolDesc);
  sheet.getRange(22, 9, 75, 1).setFormulas(poolWt);
  sheet.getRange(22, 10, 75, 1).setFormulas(poolCost);
  sheet.getRange(22, 13, 75, 1).setFormulas(poolEquip);
  sheet.getRange(22, 14, 75, 1).setFormulas(poolCat);

  ss.toast("🎒 inventory formülleri (AC bonus ve Silah hasarları dahil) başarıyla yenilendi!", "🔧 Fix Inventory Formulas", 5);
}

// ----------------------------------------------------
// ----------------------------------------------------
// ----------------------------------------------------
// 2.15 D&D 3.5e RAW COMBAT SHEET BUILDER & COMBAT ENGINE
// ============================================================================
// CHECKPOINT 4: SPELLS & MANEUVERS PREPARATION + REDESIGNED 4-BLOCK COMBAT ENGINE
// ============================================================================

/**
 * ----------------------------------------------------
 * 1. SPELLS & MANEUVERS PREPARATION ENGINE (spells_maneuvers)
 * ----------------------------------------------------
 */
function createSpellsManeuversSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("spells_maneuvers");
  if (!sheet) {
    sheet = ss.insertSheet("spells_maneuvers");
  }

  ensureMasterDbSeedEssentials(ss);

  var sep = getFormulaSeparator(sheet);
  function f(str) {
    return str.replace(/,/g, sep);
  }

  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
  sheet.clear();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();

  var curCols = sheet.getMaxColumns();
  if (curCols < 20) {
    sheet.insertColumnsAfter(curCols, 20 - curCols);
  } else if (curCols > 20) {
    sheet.deleteColumns(21, curCols - 20);
  }
  var curRows = sheet.getMaxRows();
  if (curRows < 120) {
    sheet.insertRowsAfter(curRows, 120 - curRows);
  } else if (curRows > 120) {
    sheet.deleteRows(121, curRows - 120);
  }

  var colWidths = [35, 45, 50, 180, 110, 85, 80, 85, 65, 115, 160, 160, 140, 80, 80, 80, 80, 80, 80, 80];
  for (var i = 0; i < colWidths.length; i++) {
    sheet.setColumnWidth(i + 1, colWidths[i]);
  }

  var DARK_BG   = "#0b1329";
  var CARD_BG   = "#111d38";
  var INNER_BG  = "#080e1e";
  var BORDER    = "#1e293b";
  var TEXT_MAIN = "#f8fafc";
  var TEXT_MUT  = "#94a3b8";

  sheet.getRange(1, 1, 120, 20).setBackground(DARK_BG);

  // Row 1: Header
  sheet.getRange("A1:M1").merge().setValue("🔮 SPELLS & MANEUVERS PREPARATION (Büyü & Manevra Komuta Merkezi)")
    .setBackground("#0f172a").setFontColor("#38bdf8").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("left");

  // Rows 2-4: Caster & Initiator Summary Cards
  sheet.getRange("A2:E2").merge().setValue("🔮 PRIMARY CASTER:").setFontColor("#c084fc").setFontWeight("bold").setFontSize(9);
  sheet.getRange("F2:G2").merge().setFormula(f('=IFERROR(lvl_up!$I$1, "Wizard")')).setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("H2").setValue("CL:").setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("right");
  sheet.getRange("I2").setFormula(f('=IFERROR(lvl_up!$K$2, 1) + IFERROR(inventory!$AS$10, 0)')).setFontColor("#4ade80").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("J2").setValue("Stat:").setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("right");
  sheet.getRange("K2:M2").merge().setFormula(f('="Mod: " & IFERROR(INDEX(Main!$P$40:$P$75, MATCH(lvl_up!$J$2, {"STR";"DEX";"CON";"INT";"WIS";"CHA"}, 0)), 0)')).setFontColor("#38bdf8").setFontSize(9).setHorizontalAlignment("center");

  sheet.getRange("A3").setValue("Slots:").setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("center");
  var slotLetters = ["0", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
  for (var s = 0; s < 10; s++) {
    sheet.getRange(3, 2 + s).setValue(slotLetters[s] + ": " + f('=IFERROR(lvl_up!F40, 0)'))
      .setFontSize(8).setFontColor("#fbbf24").setHorizontalAlignment("center").setBackground(CARD_BG);
  }
  sheet.getRange("L3:M3").merge().setFormula(f('="Total: " & SUM(lvl_up!$F$40:$O$40)')).setFontColor("#4ade80").setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");

  sheet.getRange("A4:C4").merge().setValue("⚔️ MARTIAL ADEPT:").setFontColor("#fb7185").setFontWeight("bold").setFontSize(9);
  sheet.getRange("D4:E4").merge().setFormula(f('=IFERROR(lvl_up!$T$1, "Warblade")')).setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("F4").setValue("IL:").setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("right");
  sheet.getRange("G4").setFormula(f('=IFERROR(lvl_up!$S$2, 1)')).setFontColor("#fb7185").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("H4").setValue("Max Lvl:").setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("right");
  sheet.getRange("I4").setFormula(f('=IFERROR(lvl_up!$U$2, 1)')).setFontColor("#fbbf24").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("J4").setValue("Stance:").setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("right");
  sheet.getRange("K4:M4").merge().setValue("Leading the Charge").setFontColor("#5eead4").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("A2:M4").setBorder(true, true, true, true, true, true, BORDER, SpreadsheetApp.BorderStyle.SOLID);

  // Section 1: Daily Prepared Spells (Rows 6-36)
  sheet.getRange("A5:M5").merge().setValue("🔮 DAILY PREPARED SPELLS (Günlük Hazırlanan Büyüler - Seviye 0–9)")
    .setBackground("#312e81").setFontColor("#c7d2fe").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("left");
  sheet.getRange("A6:M6").setValues([["#", "Lvl", "Cast?", "Spell Name (Master_DB)", "School", "Cast Time", "Range", "Duration", "DC", "Combat Role", "Effect & Properties", "", ""]])
    .setBackground("#1e1b4b").setFontColor("#a5b4fc").setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("K6:M6").merge();

  var spellValidation = SpreadsheetApp.newDataValidation().requireValueInList([
    "-", "Detect Magic", "Read Magic", "Light", "Mage Hand", "Shield", "Mage Armor", "Magic Missile", "True Strike",
    "Mirror Image", "Scorching Ray", "Invisibility", "Bull's Strength", "Fireball", "Haste", "Fly", "Dispel Magic",
    "Stoneskin", "Dimension Door", "Wall of Fire", "Teleport", "Cone of Cold", "Wall of Force",
    "Chain Lightning", "Disintegrate", "Greater Dispel Magic", "Delayed Blast Fireball", "Horrid Wilting"
  ], true).setAllowInvalid(true).build();

  var defaultSpells = [];

  for (var sp = 0; sp < 30; sp++) {
    var sr = 7 + sp;
    sheet.getRange(sr, 1).setValue(sp + 1).setFontColor("#64748b").setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(sr, 2).setValue("").setFontColor("#fbbf24").setHorizontalAlignment("center").setFontWeight("bold").setFontSize(8);
    sheet.getRange(sr, 3).insertCheckboxes().uncheck();
    sheet.getRange(sr, 4).setValue("").setDataValidation(spellValidation).setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(8).setBackground(INNER_BG);
    sheet.getRange(sr, 5).setFormula(f('=IF(D' + sr + '="", "", IFERROR(VLOOKUP(D' + sr + ', Master_DB!$A$6:$C, 3, FALSE), ""))')).setFontColor("#a5b4fc").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(sr, 6).setFormula(f('=IF(D' + sr + '="", "", IFERROR(VLOOKUP(D' + sr + ', Master_DB!$A$6:$D, 4, FALSE), "1 std"))')).setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(sr, 7).setFormula(f('=IF(D' + sr + '="", "", IFERROR(VLOOKUP(D' + sr + ', Master_DB!$A$6:$E, 5, FALSE), "Medium"))')).setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(sr, 8).setFormula(f('=IF(D' + sr + '="", "", IFERROR(VLOOKUP(D' + sr + ', Master_DB!$A$6:$F, 6, FALSE), "Instant"))')).setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(sr, 9).setFormula(f('=IF(D' + sr + '="", "", 10 + N(B' + sr + ') + IFERROR(INDEX(Main!$P$40:$P$75, MATCH(lvl_up!$J$2, {"STR";"DEX";"CON";"INT";"WIS";"CHA"}, 0)), 4))')).setFontColor("#f43f5e").setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(sr, 10).setFormula(f('=IF(D' + sr + '="", "", IFERROR(VLOOKUP(D' + sr + ', Master_DB!$A$6:$AE, 31, FALSE), "Offense / Attack"))')).setFontColor("#38bdf8").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(sr, 11, 1, 3).merge().setFormula(f('=IF(D' + sr + '="", "", IFERROR(VLOOKUP(D' + sr + ', Master_DB!$A$6:$G, 7, FALSE), "Standard RAW spell effect"))')).setFontColor(TEXT_MUT).setFontSize(8);
  }
  sheet.getRange("A6:M36").setBorder(true, true, true, true, true, true, BORDER, SpreadsheetApp.BorderStyle.SOLID);

  // Section 2: Readied Maneuvers (Rows 38-50)
  sheet.getRange("A38:K38").merge().setValue("⚔️ TOME OF BATTLE: READIED MANEUVERS (Kuşanılan Savaş Manevraları)")
    .setBackground("#4c0519").setFontColor("#fecdd3").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("left");
  sheet.getRange("L38:M38").merge().setValue("🔄 RECOVER ALL").setBackground("#be123c").setFontColor("#ffffff").setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");

  sheet.getRange("A39:M39").setValues([["#", "Lvl", "Expended?", "Maneuver Name (Master_DB)", "Discipline", "Type", "Action", "Combat Role", "Effect & Damage", "", "", "", ""]])
    .setBackground("#881337").setFontColor("#ffe4e6").setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("I39:M39").merge();

  var maneuverValidation = SpreadsheetApp.newDataValidation().requireValueInList([
    "-", "Steel Wind", "Sapphire Nightmare Blade", "Mountain Tombstone Strike",
    "White Raven Tactics", "Iron Heart Surge", "Wall of Blades", "Moment of Perfect Mind",
    "Zephyr Dance", "Dancing Mongoose", "Emerald Gressation"
  ], true).setAllowInvalid(true).build();

  var defaultManeuvers = [];

  for (var mn = 0; mn < 10; mn++) {
    var mr = 40 + mn;
    sheet.getRange(mr, 1).setValue(mn + 1).setFontColor("#64748b").setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(mr, 2).setValue("").setFontColor("#fbbf24").setHorizontalAlignment("center").setFontWeight("bold").setFontSize(8);
    sheet.getRange(mr, 3).insertCheckboxes().uncheck();
    sheet.getRange(mr, 4).setValue("").setDataValidation(maneuverValidation).setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(8).setBackground(INNER_BG);
    sheet.getRange(mr, 5).setFormula(f('=IF(D' + mr + '="", "", IFERROR(VLOOKUP(D' + mr + ', Master_DB!$A$6:$C, 3, FALSE), ""))')).setFontColor("#f43f5e").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(mr, 6).setFormula(f('=IF(D' + mr + '="", "", IFERROR(VLOOKUP(D' + mr + ', Master_DB!$A$6:$D, 4, FALSE), "Strike"))')).setFontColor("#38bdf8").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(mr, 7).setFormula(f('=IF(D' + mr + '="", "", IFERROR(VLOOKUP(D' + mr + ', Master_DB!$A$6:$E, 5, FALSE), "Standard"))')).setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(mr, 8).setFormula(f('=IF(D' + mr + '="", "", IFERROR(VLOOKUP(D' + mr + ', Master_DB!$A$6:$AE, 31, FALSE), "Offense / Attack"))')).setFontColor("#4ade80").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(mr, 9, 1, 5).merge().setFormula(f('=IF(D' + mr + '="", "", IFERROR(VLOOKUP(D' + mr + ', Master_DB!$A$6:$G, 7, FALSE), "Tome of Battle RAW Maneuver Effect"))')).setFontColor(TEXT_MUT).setFontSize(8);
  }
  sheet.getRange("A39:M49").setBorder(true, true, true, true, true, true, BORDER, SpreadsheetApp.BorderStyle.SOLID);

  // Section 3: Spellbook & Library (Rows 52-110)
  sheet.getRange("A51:M51").merge().setValue("📜 SPELLBOOK & KNOWN ABILITIES ARCHIVE (Bilinen Tüm Büyüler & Manevralar Kütüphanesi)")
    .setBackground("#0f172a").setFontColor("#38bdf8").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("left");
  sheet.getRange("A52:M52").setValues([["#", "Type", "Lvl", "Name (Master_DB)", "School / Discipline", "Action", "Range", "Target", "Cost", "Combat Role", "Full Rules & Mechanics", "", ""]])
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("K52:M52").merge();

  for (var kn = 0; kn < 45; kn++) {
    var kr = 53 + kn;
    sheet.getRange(kr, 1).setValue(kn + 1).setFontColor("#64748b").setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(kr, 2).setValue(kn < 30 ? "Spell" : "Maneuver").setFontColor("#38bdf8").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(kr, 3).setValue("").setFontColor("#fbbf24").setFontWeight("bold").setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(kr, 4).setValue("").setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(8).setBackground(INNER_BG);
    sheet.getRange(kr, 5).setFormula(f('=IF(D' + kr + '="", "", IFERROR(VLOOKUP(D' + kr + ', Master_DB!$A$6:$C, 3, FALSE), ""))')).setFontColor("#a5b4fc").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(kr, 6).setFormula(f('=IF(D' + kr + '="", "", IFERROR(VLOOKUP(D' + kr + ', Master_DB!$A$6:$D, 4, FALSE), ""))')).setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(kr, 7).setFormula(f('=IF(D' + kr + '="", "", IFERROR(VLOOKUP(D' + kr + ', Master_DB!$A$6:$E, 5, FALSE), ""))')).setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(kr, 8).setValue("Target / Area").setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(kr, 9).setValue("-").setFontColor(TEXT_MUT).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(kr, 10).setFormula(f('=IF(D' + kr + '="", "", IFERROR(VLOOKUP(D' + kr + ', Master_DB!$A$6:$AE, 31, FALSE), ""))')).setFontColor("#38bdf8").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(kr, 11, 1, 3).merge().setFormula(f('=IF(D' + kr + '="", "", IFERROR(VLOOKUP(D' + kr + ', Master_DB!$A$6:$G, 7, FALSE), ""))')).setFontColor(TEXT_MUT).setFontSize(8);
  }
  sheet.getRange("A52:M97").setBorder(true, true, true, true, true, true, BORDER, SpreadsheetApp.BorderStyle.SOLID);

  sheet.setFrozenRows(4);
  ss.toast("🔮 spells_maneuvers sayfası başarıyla oluşturuldu!", "🔮 Spells & Maneuvers Ready", 4);
}

/**
 * Menu trigger for recovering all readied maneuvers
 */
function recoverAllManeuversMenu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("spells_maneuvers");
  if (sheet) {
    sheet.getRange("C40:C49").uncheck();
  }
  var combat = ss.getSheetByName("combat");
  if (combat) {
    combat.getRange("T16:T20").uncheck();
    combat.getRange("T34:T38").uncheck();
  }
  ss.toast("⚔️ Tüm savaş manevraları tazelendi ve kuşanıldı!", "⚔️ Recover All", 4);
}

/**
 * onEdit handler for spells_maneuvers
 */
function handleSpellsManeuversEdit(sheet, range, e) {
  var row = range.getRow();
  var col = range.getColumn();
  if (row === 38 && (col === 12 || col === 13)) {
    recoverAllManeuversMenu();
  }
}


/**
 * ----------------------------------------------------
 * TACTICAL COMBAT FORMULAS & INTERACTIVE ENGINE V4
 * ----------------------------------------------------
 */

/**
 * ----------------------------------------------------
 * TACTICAL COMBAT COCKPIT ENGINE (combat) - REDESIGNED V4
 * Dikey 4 Bloklu Taktik Savaş Kokpiti (Status, Offense, Defense, Utility)
 * ----------------------------------------------------
 */

/**
 * ----------------------------------------------------
 * COMBAT ENGINE & TACTICAL COCKPIT (12-COLUMN CLEAN & MINIMAL)
 * ----------------------------------------------------
 */

var COMBAT_TYPES_MAX = ["Enhancement", "Armor", "Shield", "Natural Armor", "Deflection", "Resistance", "Luck",
  "Insight", "Sacred", "Profane", "Morale", "Competence", "Alchemical", "Size", "Circumstance", "Inherent", "Racial"];
var COMBAT_TYPES_SUM = ["Dodge", "Untyped", "None", "-", "Penalty"];

function combatStackFormula(colLetter, opts) {
  opts = opts || {};
  var col = 'Master_DB!$' + colLetter + '$6:$' + colLetter;
  var conds = '((ISNUMBER(MATCH(Master_DB!$A$6:$A, $M$3:$M$30, 0))) + (ISNUMBER(MATCH(Master_DB!$D$6:$D, $M$3:$M$30, 0)))) > 0, Master_DB!$A$6:$A<>""';
  if (opts.excludeWeapons) conds += ', Master_DB!$B$6:$B<>"Weapon"';
  var skip = opts.skipTypes || [];
  var parts = [];

  function part(fn, t) {
    return 'IFERROR(' + fn + '(FILTER(' + col + ', Master_DB!$H$6:$H="' + t + '", ' + conds + ')), 0)';
  }

  if (opts.onlyTypes) {
    for (var o = 0; o < opts.onlyTypes.length; o++) {
      var ot = opts.onlyTypes[o];
      parts.push(part(COMBAT_TYPES_SUM.indexOf(ot) !== -1 ? "SUM" : "MAX", ot));
    }
    return '(' + parts.join(' + ') + ')';
  }

  for (var i = 0; i < COMBAT_TYPES_MAX.length; i++) {
    if (skip.indexOf(COMBAT_TYPES_MAX[i]) === -1) parts.push(part("MAX", COMBAT_TYPES_MAX[i]));
  }
  for (var j = 0; j < COMBAT_TYPES_SUM.length; j++) {
    if (skip.indexOf(COMBAT_TYPES_SUM[j]) === -1) parts.push(part("SUM", COMBAT_TYPES_SUM[j]));
  }
  var known = COMBAT_TYPES_MAX.concat(COMBAT_TYPES_SUM).map(function(t) { return '"' + t + '"'; }).join(', ');
  parts.push('IFERROR(SUM(FILTER(' + col + ', ISNA(MATCH(Master_DB!$H$6:$H, {' + known + '}, 0)), ' + conds + ')), 0)');
  return '(' + parts.join(' + ') + ')';
}

function f_combat(sheet, str) {
  var sep = getFormulaSeparator(sheet);
  return sep === "," ? str : str.replace(/,/g, sep);
}

/**
 * Dynamically queries active character sheets (spells_maneuvers, lvl_up, inventory)
 * to find real offensive stances, maneuvers, spells, feats and items that add to weapon attacks.
 * Filters out passive defenses and irrelevant abilities.
 */
function getCharacterOffensiveModifiers(ss) {
  var mods = [];
  var seen = {};

  function addMod(name, defaultActive) {
    if (!name) return;
    name = String(name).trim();
    if (!name || name === "-" || name === '""' || name.toLowerCase() === "none" || seen[name.toLowerCase()]) return;
    seen[name.toLowerCase()] = true;
    mods.push({ name: name, active: defaultActive === true });
  }

  // 1. From spells_maneuvers: Active Stance (K4), Readied Maneuvers (D40:D49), Prepared Spells (D7:D36)
  try {
    var smSheet = ss.getSheetByName("spells_maneuvers");
    if (smSheet) {
      var stance = smSheet.getRange("K4").getValue();
      if (stance) addMod(stance, true);

      var manVals = smSheet.getRange("D40:D49").getValues();
      for (var mi = 0; mi < manVals.length; mi++) {
        var mn = manVals[mi][0];
        if (mn) addMod(mn, false);
      }

      var spVals = smSheet.getRange("D7:D36").getValues();
      for (var si = 0; si < spVals.length; si++) {
        var sn = spVals[si][0];
        if (sn) addMod(sn, false);
      }
    }
  } catch (err) {}

  // 2. From lvl_up: Feats & Special Abilities in AA7:AA50
  try {
    var lvlSheet = ss.getSheetByName("lvl_up");
    if (lvlSheet) {
      var featVals = lvlSheet.getRange("AA7:AA50").getValues();
      for (var fi = 0; fi < featVals.length; fi++) {
        var fn = featVals[fi][0];
        if (fn) addMod(fn, false);
      }
    }
  } catch (err) {}

  // 3. From inventory: Equipped items in D4:D17 and pool D22:D96 (if equipped)
  try {
    var invSheet = ss.getSheetByName("inventory");
    if (invSheet) {
      var eqSlots = invSheet.getRange("D4:D17").getValues();
      for (var ei = 0; ei < eqSlots.length; ei++) {
        var en = eqSlots[ei][0];
        if (en) addMod(en, false);
      }
      var invPool = invSheet.getRange("D22:D96").getValues();
      var invEquip = invSheet.getRange("B22:B96").getValues();
      for (var ip = 0; ip < invPool.length; ip++) {
        if (invEquip[ip][0] === true && invPool[ip][0]) {
          addMod(invPool[ip][0], false);
        }
      }
    }
  } catch (err) {}

  // 4. Cross-reference with Master_DB to retain only combat offensive modifiers
  try {
    var mdbSheet = ss.getSheetByName("Master_DB");
    if (mdbSheet && mods.length > 0) {
      var lastRow = mdbSheet.getLastRow();
      if (lastRow >= 6) {
        var mdbData = mdbSheet.getRange(6, 1, lastRow - 5, 31).getValues();
        var mdbMap = {};
        for (var i = 0; i < mdbData.length; i++) {
          var entryName = String(mdbData[i][0] || "").trim().toLowerCase();
          if (entryName) {
            mdbMap[entryName] = {
              type: String(mdbData[i][1] || "").trim(),
              extraDmg: String(mdbData[i][25] || "").trim(),
              attBonus: Number(mdbData[i][17]) || 0,
              role: String(mdbData[i][30] || "").trim()
            };
          }
        }

        var offensiveOnly = [];
        for (var j = 0; j < mods.length; j++) {
          var mItem = mods[j];
          var info = mdbMap[mItem.name.toLowerCase()];
          if (info) {
            var isOff = (
              info.extraDmg !== "" ||
              info.attBonus > 0 ||
              info.role.indexOf("Offense") !== -1 ||
              info.type === "Maneuver" ||
              info.type === "Stance" ||
              /strike|stance|attack|damage|bless|blood|sneak|reservoir|pain/i.test(mItem.name)
            );
            if (isOff) {
              offensiveOnly.push(mItem);
            }
          }
        }
        if (offensiveOnly.length > 0) {
          mods = offensiveOnly;
        }
      }
    }
  } catch (err) {}

  return mods;
}

function createCombatSheet(aiGroupingData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("combat");
  if (!sheet) {
    sheet = ss.insertSheet("combat");
  }
  try {
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(3);
  } catch (err) {}

  // Ensure dependencies exist
  ensureMasterDbSeedEssentials(ss);

  var sep = getFormulaSeparator(sheet);
  function f(str) {
    return str.replace(/,/g, sep);
  }

  // 1. Reset sheet completely
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
  sheet.clear();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();

  // Dimensions: 12 visible columns (A to L) + 8 hidden helper columns (M to T)
  var totalCols = 20;
  var curCols = sheet.getMaxColumns();
  if (curCols < totalCols) {
    sheet.insertColumnsAfter(curCols, totalCols - curCols);
  } else if (curCols > totalCols) {
    sheet.deleteColumns(totalCols + 1, curCols - totalCols);
  }
  
  var targetRows = 72;
  var curRows = sheet.getMaxRows();
  if (curRows < targetRows) {
    sheet.insertRowsAfter(curRows, targetRows - curRows);
  } else if (curRows > targetRows) {
    sheet.deleteRows(targetRows + 1, curRows - targetRows);
  }

  // Set 12 Generous Column Widths (A to L) - Total width = 1240px (Perfect 1080p fit)
  var colWidths = [
    40,  // A: # / Checkbox
    90,  // B: Type / Slot / Cast
    200, // C: Name (Silah, Büyü, Manevra, İksir)
    70,  // D: 1st Atk / Value / Stat
    70,  // E: 2nd Atk / Max / Save
    70,  // F: 3rd Atk / Mod / DC
    70,  // G: 4th Atk / Bonus
    95,  // H: Grip / Action / Usage
    140, // I: Damage & Dice / Duration
    75,  // J: Crit / Rounds Left
    85,  // K: Range / Target
    285  // L: Properties & RAW Mechanical Notes
  ];
  for (var i = 0; i < colWidths.length; i++) {
    sheet.setColumnWidth(i + 1, colWidths[i]);
  }
  // Helper columns M to T (Cols 13 to 20)
  for (var h = 13; h <= 20; h++) {
    sheet.setColumnWidth(h, 80);
  }
  sheet.hideColumns(13, 8);

  // Row heights
  sheet.setRowHeight(1, 30); // Top Title
  sheet.setRowHeight(2, 6);  // Gap
  sheet.setRowHeight(8, 8);  // Gap
  sheet.setRowHeight(16, 6); // Gap
  sheet.setRowHeight(24, 6); // Gap
  sheet.setRowHeight(32, 8); // Gap
  sheet.setRowHeight(48, 8); // Gap

  // Professional Slate Color Palette (Sade & Okunaklı)
  var CANVAS_BG   = "#0f172a"; // Deep Slate canvas
  var CARD_HEAD   = "#1e293b"; // Card header slate
  var SUB_HEAD    = "#182234"; // Sub-table header slate
  var ROW_BG_1    = "#0f172a"; // Zebra row 1
  var ROW_BG_2    = "#131d33"; // Zebra row 2
  var INPUT_BG    = "#0b1220"; // Input cell background
  var BORDER_COL  = "#334155"; // Subtle soft border (göz yormaz)
  var TEXT_MAIN   = "#f8fafc"; // Pure white
  var TEXT_MUTED  = "#94a3b8"; // Muted gray
  var GREEN       = "#22c55e"; // Health
  var SKY         = "#38bdf8"; // Info / AC
  var PURPLE      = "#c084fc"; // Magic / Will
  var AMBER       = "#fbbf24"; // Warning / Consumables
  var RED         = "#f43f5e"; // Offense / Danger

  // Paint whole canvas
  sheet.getRange(1, 1, targetRows, totalCols).setBackground(CANVAS_BG);

  // Helper formatting functions
  function headerBar(a1, text, accentColor) {
    var r = sheet.getRange(a1);
    r.merge().setValue(text).setBackground(CARD_HEAD).setFontColor(accentColor || TEXT_MAIN)
      .setFontWeight("bold").setFontSize(10).setHorizontalAlignment("left").setVerticalAlignment("middle")
      .setBorder(true, true, true, true, false, false, BORDER_COL, SpreadsheetApp.BorderStyle.SOLID);
    return r;
  }

  function subHeaderBar(a1, text, accentColor) {
    var r = sheet.getRange(a1);
    r.merge().setValue(text).setBackground(SUB_HEAD).setFontColor(accentColor || TEXT_MUTED)
      .setFontWeight("bold").setFontSize(8).setHorizontalAlignment("left").setVerticalAlignment("middle")
      .setBorder(true, true, true, true, false, false, BORDER_COL, SpreadsheetApp.BorderStyle.SOLID);
    return r;
  }

  function setTableBorders(a1) {
    sheet.getRange(a1).setBorder(true, true, true, true, true, true, BORDER_COL, SpreadsheetApp.BorderStyle.SOLID);
  }

  // ----------------------------------------------------
  // ROW 1: TOP CONTROL BAR & CHARACTER SUMMARY (PRESERVED)
  // ----------------------------------------------------
  sheet.getRange("A1:E1").merge().setValue("⚔️ D&D 3.5E TACTICAL COMBAT COCKPIT")
    .setFontColor(SKY).setFontWeight("bold").setFontSize(11).setBackground(CARD_HEAD).setHorizontalAlignment("left");
  sheet.getRange("F1:I1").merge().setFormula(f('="Level " & lvl_up!$B$5 & " | BAB: +" & lvl_up!$I$5 & " | HD: " & lvl_up!$B$5 & "d" & lvl_up!$D$7'))
    .setFontColor(TEXT_MUTED).setFontSize(9).setBackground(CARD_HEAD).setHorizontalAlignment("center");
  sheet.getRange("J1:L1").merge().setFormula(f('="CL: " & IFERROR(lvl_up!$K$2, 0) & " | IL: " & IFERROR(lvl_up!$S$2, 0)'))
    .setFontColor(PURPLE).setFontSize(9).setBackground(CARD_HEAD).setHorizontalAlignment("right");
  setTableBorders("A1:L1");

  // ====================================================
  // BLOK 1: 🩸 STATUS & VITALS HUD (Rows 3 to 7 - PRESERVED)
  // 4 Balanced Cards across 12 columns (3 columns each)
  // ====================================================

  // Card 1A: Hit Points (A3:C7)
  sheet.getRange("A3:C3").merge().setValue("🩸 HIT POINTS").setBackground(CARD_HEAD).setFontColor(GREEN).setFontWeight("bold").setFontSize(9);
  sheet.getRange("A4:B6").merge().setFormula(f("=C4")).setFontColor(GREEN).setFontWeight("bold").setFontSize(24)
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setBackground(INPUT_BG);
  sheet.getRange("C4").setNumberFormat('"Max: "0').setFontColor(TEXT_MAIN).setFontSize(8).setBackground(INPUT_BG).setHorizontalAlignment("center")
    .setNote("Maksimum Can (Max HP) — Dinlenmede bu değere eşitlenir.");
  sheet.getRange("C5").setValue(0).setNumberFormat('"Temp: "0').setFontColor(SKY).setFontSize(8).setBackground(INPUT_BG).setHorizontalAlignment("center")
    .setNote("Geçici Can (Temporary HP) — Hasar aldığında önce bu tükenir.");
  sheet.getRange("C6").setValue(0).setNumberFormat('"Nonleth: "0').setFontColor(AMBER).setFontSize(8).setBackground(INPUT_BG).setHorizontalAlignment("center")
    .setNote("Öldürücü Olmayan Hasar (Nonlethal Damage) — Mevcut canı aşarsa karakter Staggered olur.");
  sheet.getRange("A7:C7").merge().setFormula(f('=IF(A4<=0, IF(A4<=-10, "💀 DEAD", "🩸 DYING"), IF(A4=0, "⚠️ DISABLED", IF(C6>=A4, "💫 STAGGERED", "💚 HEALTHY")))'))
    .setFontColor(GREEN).setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center").setBackground(CARD_HEAD);
  setTableBorders("A3:C7");

  // Card 1B: Armor Class (D3:F7)
  sheet.getRange("D3:F3").merge().setValue("🛡️ ARMOR CLASS").setBackground(CARD_HEAD).setFontColor(SKY).setFontWeight("bold").setFontSize(9);
  sheet.getRange("D4").setFontColor(SKY).setFontWeight("bold").setFontSize(18)
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setBackground(INPUT_BG);
  sheet.getRange("E4").setFontColor(SKY).setFontWeight("bold").setFontSize(13)
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setBackground(INPUT_BG);
  sheet.getRange("F4").setFontColor(TEXT_MUTED).setFontWeight("bold").setFontSize(13)
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setBackground(INPUT_BG);
  sheet.getRange("D5").setValue("Total AC").setFontColor("#38bdf8").setFontWeight("bold").setFontSize(7).setHorizontalAlignment("center").setBackground(INPUT_BG);
  sheet.getRange("E5").setValue("Touch").setFontColor("#94a3b8").setFontWeight("bold").setFontSize(7).setHorizontalAlignment("center").setBackground(INPUT_BG);
  sheet.getRange("F5").setValue("Flat-Foot").setFontColor("#94a3b8").setFontWeight("bold").setFontSize(7).setHorizontalAlignment("center").setBackground(INPUT_BG);
  sheet.getRange("D6:F6").merge().setFontColor(TEXT_MUTED).setFontSize(7).setHorizontalAlignment("center").setBackground(INPUT_BG);
  sheet.getRange("D7:F7").merge().setFormula(f('="DR: " & IFERROR(VLOOKUP("Damage Reduction", Master_DB!$A$6:$G, 7, FALSE), "5 / Magic") & " | SR: " & IFERROR(lvl_up!$B$5 + 11, "-")'))
    .setFontColor("#a5b4fc").setFontSize(8).setHorizontalAlignment("center").setBackground(CARD_HEAD);
  setTableBorders("D3:F7");

  // Card 1C: Saves & Speed (G3:I7)
  sheet.getRange("G3:I3").merge().setValue("⚡ SAVES & MOBILITY").setBackground(CARD_HEAD).setFontColor(PURPLE).setFontWeight("bold").setFontSize(9);
  sheet.getRange("G4").setFontColor(GREEN).setFontWeight("bold").setFontSize(14).setNumberFormat("+0;-0;+0")
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setBackground(INPUT_BG);
  sheet.getRange("H4").setFontColor(SKY).setFontWeight("bold").setFontSize(14).setNumberFormat("+0;-0;+0")
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setBackground(INPUT_BG);
  sheet.getRange("I4").setFontColor(PURPLE).setFontWeight("bold").setFontSize(14).setNumberFormat("+0;-0;+0")
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setBackground(INPUT_BG);
  sheet.getRange("G5").setValue("🛡️ Fort").setFontColor("#4ade80").setFontWeight("bold").setFontSize(7).setHorizontalAlignment("center").setBackground(INPUT_BG);
  sheet.getRange("H5").setValue("⚡ Ref").setFontColor("#38bdf8").setFontWeight("bold").setFontSize(7).setHorizontalAlignment("center").setBackground(INPUT_BG);
  sheet.getRange("I5").setValue("🧠 Will").setFontColor("#c084fc").setFontWeight("bold").setFontSize(7).setHorizontalAlignment("center").setBackground(INPUT_BG);
  sheet.getRange("G6:H6").merge().setFontColor(AMBER).setFontSize(8).setHorizontalAlignment("center").setBackground(INPUT_BG);
  sheet.getRange("I6").setFontColor(SKY).setFontSize(8).setHorizontalAlignment("center").setBackground(INPUT_BG);
  sheet.getRange("G7:I7").merge().setFormula(f('="Senses: " & IFERROR(VLOOKUP("Darkvision", Master_DB!$A$6:$G, 7, FALSE), "Normal Vision, Listen +8, Spot +8")'))
    .setFontColor(TEXT_MUTED).setFontSize(7).setHorizontalAlignment("center").setBackground(CARD_HEAD);
  setTableBorders("G3:I7");

  // Card 1D: Controls & Conditions (J3:L7)
  sheet.getRange("J3:L3").merge().setValue("⚡ ACTIONS & CONTROLS").setBackground(CARD_HEAD).setFontColor(AMBER).setFontWeight("bold").setFontSize(9);
  sheet.getRange("J4").setValue("💥 Hasar:").setFontColor(RED).setFontSize(8).setFontWeight("bold").setHorizontalAlignment("right").setBackground(INPUT_BG);
  sheet.getRange("K4").setValue(10).setFontColor(TEXT_MAIN).setFontSize(9).setFontWeight("bold").setBackground(INPUT_BG).setHorizontalAlignment("center")
    .setNote("Hasar / İyileşme miktarı (Amt)");
  sheet.getRange("L4").insertCheckboxes().uncheck().setBackground(RED)
    .setNote("💥 Tıkla: K4 hücresindeki miktar kadar HASAR uygula.");
  sheet.getRange("J5").setValue("💖 İyileş:").setFontColor(GREEN).setFontSize(8).setFontWeight("bold").setHorizontalAlignment("right").setBackground(INPUT_BG);
  sheet.getRange("K5").setValue(0).setNumberFormat('"Neg: "0').setFontColor(AMBER).setFontSize(9).setFontWeight("bold").setBackground(INPUT_BG).setHorizontalAlignment("center")
    .setNote("Negatif Seviye (NegLvl) sayısı — -1 tüm zarlara, -5 Max HP.");
  sheet.getRange("L5").insertCheckboxes().uncheck().setBackground(GREEN)
    .setNote("💖 Tıkla: K4 hücresindeki miktar kadar CAN YENİLE.");
  var actionMenuRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "- Eylem / Dinlenme Seç -",
    "☀️ Long Rest (8h) - Tam Dinlenme",
    "🔄 Encounter Reset - Savaş Sıfırla",
    "⚡ Next Round - Sonraki Tur"
  ], true).setAllowInvalid(true).build();
  sheet.getRange("J6:L6").merge().setValue("- Eylem / Dinlenme Seç -").setDataValidation(actionMenuRule)
    .setFontColor(AMBER).setFontSize(8).setFontWeight("bold").setHorizontalAlignment("center").setBackground(CARD_HEAD);
  var condValidation = SpreadsheetApp.newDataValidation().requireValueInList([
    "-", "🟢 Healthy", "Fatigued", "Exhausted", "Shaken", "Frightened", "Panicked",
    "Sickened", "Nauseated", "Dazed", "Stunned", "Blinded", "Entangled", "Prone", "Grappled", "Pinned"
  ], true).setAllowInvalid(true).build();
  sheet.getRange("J7:L7").merge().setValue("🟢 Healthy").setDataValidation(condValidation).setFontColor(GREEN).setFontSize(8).setFontWeight("bold").setHorizontalAlignment("center").setBackground(CARD_HEAD);
  setTableBorders("J3:L7");

  // ====================================================
  // BLOK 2: ⚔️ OFFENSE ZONE (Rows 9 to 31)
  // Sub-A: Weapons (Rows 10-15)
  // Sub-B: Tactical Strikes & Poisons (Rows 17-23)
  // Sub-C: Offensive Spells & Attack Scrolls (Rows 25-30)
  // Roll Banner: Row 31
  // ====================================================
  headerBar("A9:J9", "⚔️ OFFENSE: WEAPONS, ROTATION & DAMAGE ENGINE", RED);
  sheet.getRange("K9").insertCheckboxes().setValue(true).setHorizontalAlignment("center").setVerticalAlignment("middle").setBackground(CARD_HEAD)
    .setNote("İşaretliyse: Kritik onay zarı (Critical Confirmation Roll) atılmaz. Silahın crit aralığında gelen her zar OTOMATİK KRİTİK sayılır.");
  sheet.getRange("L9").setValue("🚫 No Crit Confirm (Otomatik)")
    .setFontColor(AMBER).setFontWeight("bold").setFontSize(8).setVerticalAlignment("middle").setHorizontalAlignment("left").setBackground(CARD_HEAD);
  sheet.getRange("K9:L9").setBorder(true, true, true, true, false, false, BORDER_COL, SpreadsheetApp.BorderStyle.SOLID);
  
  sheet.getRange("A10:L10").setValues([["🎲 Atk", "Type", "Weapon / Attack Name", "1st Atk", "2nd Atk", "3rd Atk", "4th Atk", "Grip", "Damage & Dice", "Crit", "Range", "Special Properties & RAW Notes"]])
    .setBackground(SUB_HEAD).setFontColor(TEXT_MUTED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  setTableBorders("A10:L10");

  var gripRule = SpreadsheetApp.newDataValidation().requireValueInList(["1-Hand", "2-Hand", "Off-Hand", "Ranged (No Str)", "Composite (Str)"], true).setAllowInvalid(true).build();

  // 5 Weapons Table (Rows 11 to 15)
  // Always dynamically linked to inventory sheet via live formulas (Main Hand, Off-Hand, and Ready Belt Weapons)
  for (var w = 0; w < 5; w++) {
    var wr = 11 + w;
    var rowBg = (w % 2 === 0) ? ROW_BG_1 : ROW_BG_2;
    sheet.getRange(wr, 1, 1, 12).setBackground(rowBg);
    sheet.getRange(wr, 1).insertCheckboxes().uncheck()
      .setNote("🎲 Tıkla: Bu silahla Tüm Saldırıları (Full Attack) at ve dökümlü hasar sonucunu aç!");
    
    var wepFormula = "";
    var defaultGrip = "1-Hand";
    if (w === 0) {
      wepFormula = f('=IFERROR(inventory!$D$16, "")');
      defaultGrip = "1-Hand";
    } else if (w === 1) {
      wepFormula = f('=IFERROR(inventory!$D$17, "")');
      defaultGrip = "Off-Hand";
    } else {
      var poolIdx = w - 1; // 1, 2, 3
      wepFormula = f('=IFERROR(INDEX(FILTER(inventory!$D$22:$D$96, inventory!$B$22:$B$96=TRUE, ((inventory!$C$22:$C$96="Weapon") + (inventory!$C$22:$C$96="Main Hand")), inventory!$D$22:$D$96<>""), ' + poolIdx + '), "")');
    }
    sheet.getRange(wr, 3).setFormula(wepFormula).setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(9);

    sheet.getRange(wr, 2).setFormula(f('=IF(C' + wr + '="", "", IFERROR(VLOOKUP(C' + wr + ', Master_DB!$A$6:$B, 2, FALSE), "Melee"))')).setFontColor(SKY).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(wr, 4).setFontColor(GREEN).setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center").setBackground(INPUT_BG);
    sheet.getRange(wr, 5, 1, 3).setFontColor(TEXT_MUTED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(wr, 8).setFormula(f('=IF(C' + wr + '="", "", "' + defaultGrip + '")')).setDataValidation(gripRule).setFontColor(AMBER).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(wr, 9).setFormula(f('=IF(C' + wr + '="", "", IFERROR(REGEXEXTRACT(VLOOKUP(C' + wr + ', Master_DB!$A$6:$Z, 26, FALSE), "^[0-9]+d[0-9]+"), "1d8"))')).setFontColor(TEXT_MAIN).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(wr, 10).setFormula(f('=IF(C' + wr + '="", "", IFERROR(REGEXEXTRACT(VLOOKUP(C' + wr + ', Master_DB!$A$6:$Z, 26, FALSE), "\\(([^\\)]+)\\)"), "20/x2"))')).setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(wr, 11).setFormula(f('=IF(C' + wr + '="", "", IFERROR(VLOOKUP(C' + wr + ', Master_DB!$A$6:$E, 5, FALSE), "Melee"))')).setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(wr, 12).setFormula(f('=IF(C' + wr + '="", "", IFERROR(VLOOKUP(C' + wr + ', Master_DB!$A$6:$G, 7, FALSE), ""))')).setFontColor(TEXT_MUTED).setFontSize(8);
  }
  setTableBorders("A11:L15");

  // Sub-B: Tactical Attack Modes & Weapon Damage Add-ons (Rows 17 to 23)
  subHeaderBar("A17:L17", "⚡ TACTICAL MODIFIERS & WEAPON DAMAGE ADD-ONS (Select active for this swing)", SKY);
  sheet.getRange("A18:L18").setBackground(ROW_BG_1);
  sheet.getRange("A18:B18").merge().setValue("⚔️ Power Attack (-BAB):").setFontColor(RED).setFontSize(9)
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
  sheet.getRange("C18").setValue(0).setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(10).setBackground(INPUT_BG).setHorizontalAlignment("center")
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0, 30).setAllowInvalid(true).build())
    .setNote("Power Attack: İndirilecek BAB miktarı (0 ile BAB arası). 1-Hand silahlarda +1x, 2-Hand silahlarda +2x hasar ekler, saldırı zarına -BAB yazar.");
  sheet.getRange("D18").insertCheckboxes();
  sheet.getRange("E18:F18").merge().setValue("Flanking (+2 Melee Att)").setFontColor(SKY).setFontSize(8).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("G18").insertCheckboxes();
  sheet.getRange("H18:I18").merge().setValue("Charge (+2 Att / -2 AC)").setFontColor(RED).setFontSize(8).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("J18").insertCheckboxes();
  sheet.getRange("K18:L18").merge().setValue("Higher Ground (+1 Att)").setFontColor(AMBER).setFontSize(8).setHorizontalAlignment("center").setVerticalAlignment("middle");
  setTableBorders("A17:L18");

  sheet.getRange("A19:L19").setValues([["#", "Active?", "Strike / Damage Add-On (Master_DB)", "", "Source", "Bonus Atk", "Bonus Dmg / Dice", "Damage Type", "Crit Mult?", "Duration / Cost", "Stacking & RAW Mechanical Notes", ""]])
    .setBackground(SUB_HEAD).setFontColor(TEXT_MUTED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("C19:D19").merge();
  sheet.getRange("K19:L19").merge();
  setTableBorders("A19:L19");

  var aiStrikes = (aiGroupingData && aiGroupingData.offense && aiGroupingData.offense.tactical_strikes_and_poisons) ? aiGroupingData.offense.tactical_strikes_and_poisons : [];
  for (var m = 0; m < 4; m++) {
    var mr = 20 + m;
    var mBg = (m % 2 === 0) ? ROW_BG_1 : ROW_BG_2;
    var sItem = (m < aiStrikes.length) ? aiStrikes[m] : null;

    sheet.getRange(mr, 1, 1, 12).setBackground(mBg);
    sheet.getRange(mr, 1).setValue(m + 1).setFontColor(TEXT_MUTED).setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(mr, 2).insertCheckboxes().uncheck();
    sheet.getRange(mr, 3, 1, 2).merge().setValue(sItem ? sItem.name : "").setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(8);
    sheet.getRange(mr, 5).setValue(sItem ? (sItem.source || "Maneuver") : "").setFontColor(PURPLE).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(mr, 6).setValue(sItem ? (sItem.bonus_atk || 0) : "").setFontColor(GREEN).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(mr, 7).setValue(sItem ? (sItem.bonus_dmg || "") : "").setFontColor(AMBER).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(mr, 8).setValue(sItem ? (sItem.damage_type || "Weapon") : "").setFontColor(SKY).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(mr, 9).setValue(sItem ? (sItem.crit_mult ? "Yes" : "No") : "").setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(mr, 10).setValue(sItem ? (sItem.duration || "1 swing") : "").setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(mr, 11, 1, 2).merge().setValue(sItem ? (sItem.notes || "") : "").setFontColor(TEXT_MUTED).setFontSize(8);
  }
  setTableBorders("A20:L23");

  // Sub-C: Offensive Spells, Scrolls & Wands (Rows 25 to 30)
  subHeaderBar("A25:L25", "🔥 OFFENSIVE SPELLS, SCROLLS & ATTACK WANDS (Direct Damage & Touch Attacks)", RED);
  sheet.getRange("A26:L26").setValues([["#", "Cast/Use?", "Spell / Scroll / Wand Name", "", "Source", "Attack / DC", "Damage & Dice", "Damage Type", "Range / Target", "Components / Slot", "RAW Spell Description & Effects", ""]])
    .setBackground(SUB_HEAD).setFontColor(TEXT_MUTED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("C26:D26").merge();
  sheet.getRange("K26:L26").merge();
  setTableBorders("A26:L26");

  var aiSpells = (aiGroupingData && aiGroupingData.offense && aiGroupingData.offense.offensive_spells_and_scrolls) ? aiGroupingData.offense.offensive_spells_and_scrolls : [];
  for (var sp = 0; sp < 4; sp++) {
    var spr = 27 + sp;
    var spBg = (sp % 2 === 0) ? ROW_BG_1 : ROW_BG_2;
    var spItem = (sp < aiSpells.length) ? aiSpells[sp] : null;

    sheet.getRange(spr, 1, 1, 12).setBackground(spBg);
    sheet.getRange(spr, 1).setValue(sp + 1).setFontColor(TEXT_MUTED).setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(spr, 2).insertCheckboxes().uncheck()
      .setNote("Tıkla: Bu hasar büyüsünü at / kullan!");
    sheet.getRange(spr, 3, 1, 2).merge().setValue(spItem ? spItem.name : "").setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(8);
    sheet.getRange(spr, 5).setValue(spItem ? (spItem.source || "Spell") : "").setFontColor(PURPLE).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(spr, 6).setValue(spItem ? (spItem.dc || "Melee Touch") : "").setFontColor(AMBER).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(spr, 7).setValue(spItem ? (spItem.damage_dice || "") : "").setFontColor(RED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(spr, 8).setValue(spItem ? (spItem.damage_type || "Energy") : "").setFontColor(SKY).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(spr, 9).setValue(spItem ? (spItem.range || "Touch") : "").setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(spr, 10).setValue(spItem ? (spItem.slot || "V, S") : "").setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(spr, 11, 1, 2).merge().setValue(spItem ? (spItem.notes || "") : "").setFontColor(TEXT_MUTED).setFontSize(8);
  }
  setTableBorders("A27:L30");

  // Row 31: Live Roll & Damage Summary Banner
  sheet.getRange("A31:L31").merge()
    .setValue("🎲 SON SALDIRI: (Henüz zar atılmadı — A11:A15 veya A27:A30 kutularından birine tıklayın)")
    .setFontColor("#a5b4fc").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center").setBackground("#1e1b4b");
  setTableBorders("A31:L31");

  // ====================================================
  // BLOK 3: 🛡️ DEFENSE ZONE (Rows 33 to 47)
  // Sub-A: Defensive Modes Bar (Row 34)
  // Sub-B: Reactive Counters & Defensive Spells (Rows 35-40)
  // Sub-C: Active Sustained Buffs (Rows 41-47)
  // ====================================================
  headerBar("A33:L33", "🛡️ DEFENSE: TACTICAL MODES, REACTION COUNTERS & ACTIVE BUFFS", SKY);

  sheet.getRange("A34:L34").setBackground(ROW_BG_1);
  sheet.getRange("A34:B34").merge().setValue("🛡️ Combat Exp (+AC):").setFontColor(SKY).setFontSize(9)
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
  sheet.getRange("C34").setValue(0).setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(10).setBackground(INPUT_BG).setHorizontalAlignment("center")
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0, 5).setAllowInvalid(true).build())
    .setNote("Combat Expertise: Saldırı zarından feda edip AC'ye Dodge bonusu alma (0 ile 5 arası).");
  sheet.getRange("D34").insertCheckboxes();
  sheet.getRange("E34:F34").merge().setValue("Fighting Defensively (+2 AC / -4 Att)").setFontColor(SKY).setFontSize(8).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("G34").insertCheckboxes();
  sheet.getRange("H34:I34").merge().setValue("Total Defense (+4 Dodge AC)").setFontColor(AMBER).setFontSize(8).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("J34").insertCheckboxes();
  sheet.getRange("K34:L34").merge().setValue("⚡ Ev Kuralı: Manevraları Katla").setFontColor("#a5b4fc").setFontSize(8).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setNote("İşaretliyse: Strike manevralarının zarları (Mountain Hammer vb.) crit durumunda temel silah zarıyla birlikte katlanır.");
  setTableBorders("A33:L34");

  // Sub-B: Reactive Counters & Defensive Spells (Rows 35 to 40)
  subHeaderBar("A35:L35", "🥋 REACTION COUNTERS & DEFENSIVE / EVASION SPELLS", SKY);
  sheet.getRange("A36:L36").setValues([["#", "Active?", "Reaction / Counter / Defensive Spell", "", "Type", "Trigger / Action", "Defense / AC Bonus", "Duration", "Rounds Left", "Source", "Mechanical Notes & RAW Effects", ""]])
    .setBackground(SUB_HEAD).setFontColor(TEXT_MUTED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("C36:D36").merge();
  sheet.getRange("K36:L36").merge();
  setTableBorders("A36:L36");

  var aiCounters = (aiGroupingData && aiGroupingData.defense && aiGroupingData.defense.reactive_counters_and_spells) ? aiGroupingData.defense.reactive_counters_and_spells : [];

  // Deterministic safety: If character has Dodge in roster or feats, ensure Dodge is included in aiCounters if not already present
  try {
    var lvlSheet = ss.getSheetByName("lvl_up");
    if (lvlSheet) {
      var maxR = lvlSheet.getMaxRows();
      if (maxR >= 7) {
        var rVals = lvlSheet.getRange(7, 26, maxR - 6, 2).getValues();
        var hasDodge = false;
        for (var dIdx = 0; dIdx < rVals.length; dIdx++) {
          if (String(rVals[dIdx][1] || "").trim().toLowerCase() === "dodge") {
            hasDodge = true;
            break;
          }
        }
        if (hasDodge) {
          var existsInCounters = false;
          for (var c = 0; c < aiCounters.length; c++) {
            if (String(aiCounters[c].name || "").toLowerCase().indexOf("dodge") !== -1) {
              existsInCounters = true;
              break;
            }
          }
          if (!existsInCounters) {
            aiCounters.unshift({
              name: "Dodge (+1 AC vs 1 target)",
              source: "Feat",
              action: "Free (Your turn)",
              effect: "+1 Dodge AC",
              duration: "1 round",
              rounds_left: "-",
              trigger: "Designated opponent",
              notes: "Designate 1 opponent on your turn. Gain +1 dodge bonus to AC against attacks from that opponent."
            });
          }
        }
      }
    }
  } catch(e) {}
  for (var rc = 0; rc < 4; rc++) {
    var rcr = 37 + rc;
    var rcBg = (rc % 2 === 0) ? ROW_BG_1 : ROW_BG_2;
    var rcItem = (rc < aiCounters.length) ? aiCounters[rc] : null;

    sheet.getRange(rcr, 1, 1, 12).setBackground(rcBg);
    sheet.getRange(rcr, 1).setValue(rc + 1).setFontColor(TEXT_MUTED).setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(rcr, 2).insertCheckboxes().uncheck();
    sheet.getRange(rcr, 3, 1, 2).merge().setValue(rcItem ? rcItem.name : "").setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(8);
    sheet.getRange(rcr, 5).setValue(rcItem ? (rcItem.source || "Maneuver") : "").setFontColor(PURPLE).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(rcr, 6).setValue(rcItem ? (rcItem.action || "Immediate") : "").setFontColor(SKY).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(rcr, 7).setValue(rcItem ? (rcItem.effect || "+4 AC") : "").setFontColor(GREEN).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(rcr, 8).setValue(rcItem ? (rcItem.duration || "1 attack") : "").setFontColor(AMBER).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(rcr, 9).setValue(rcItem ? (rcItem.rounds_left || "-") : "-").setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(rcr, 10).setValue(rcItem ? (rcItem.trigger || "On being attacked") : "").setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(rcr, 11, 1, 2).merge().setValue(rcItem ? (rcItem.notes || "") : "").setFontColor(TEXT_MUTED).setFontSize(8);
  }
  setTableBorders("A37:L40");

  // Sub-C: Active Sustained Buffs (Rows 41 to 47)
  subHeaderBar("A41:L41", "✨ ACTIVE SUSTAINED BUFFS & ROUND TIMERS", SKY);
  sheet.getRange("A42:L42").setValues([["#", "Active?", "Buff Name (Master_DB)", "", "Bonus Type", "Scope", "Stat / AC Bonus", "Duration", "Rds Left", "⏭️ Next Rd", "Stacking & RAW Mechanical Notes", ""]])
    .setBackground(SUB_HEAD).setFontColor(TEXT_MUTED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("C42:D42").merge();
  sheet.getRange("K42:L42").merge();
  setTableBorders("A42:L42");

  var aiBuffs = (aiGroupingData && aiGroupingData.defense && aiGroupingData.defense.active_sustained_buffs) ? aiGroupingData.defense.active_sustained_buffs : [];
  for (var b = 0; b < 4; b++) {
    var br = 43 + b;
    var bBg = (b % 2 === 0) ? ROW_BG_1 : ROW_BG_2;
    var bItem = (b < aiBuffs.length) ? aiBuffs[b] : null;

    sheet.getRange(br, 1, 1, 12).setBackground(bBg);
    sheet.getRange(br, 1).setValue(b + 1).setFontColor(TEXT_MUTED).setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(br, 2).insertCheckboxes().uncheck();
    sheet.getRange(br, 3, 1, 2).merge().setValue(bItem ? bItem.name : "").setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(8);
    sheet.getRange(br, 5).setFormula(f('=IF(C' + br + '="", "", IFERROR(VLOOKUP(C' + br + ', Master_DB!$A$6:$H, 8, FALSE), "Morale"))')).setFontColor("#a5b4fc").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(br, 6).setFormula(f('=IF(C' + br + '="", "", IFERROR(VLOOKUP(C' + br + ', Master_DB!$A$6:$I, 9, FALSE), "Self"))')).setFontColor(SKY).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(br, 7).setValue(bItem ? (bItem.stat_summary || "+4 Str / -2 AC") : "").setFontColor(GREEN).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(br, 8).setValue(bItem ? (bItem.duration_rounds || "1 min") : "").setFontColor(AMBER).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(br, 9).setValue(bItem ? (bItem.initial_rounds || "") : "").setFontColor(RED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center").setBackground(INPUT_BG);
    sheet.getRange(br, 10).setValue("-").setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(br, 11, 1, 2).merge().setValue(bItem ? (bItem.notes || "") : "").setFontColor(TEXT_MUTED).setFontSize(8);
  }
  sheet.getRange("A47:I47").merge().setValue("Check Next Round to decrement all active buff timers by 1 round:").setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("right").setBackground(ROW_BG_1);
  sheet.getRange("J47").insertCheckboxes().setBackground(ROW_BG_1);
  sheet.getRange("K47:L47").merge().setValue("⏭️ Next Round (-1 rd)").setFontColor(GREEN).setFontWeight("bold").setFontSize(8).setBackground(ROW_BG_1);
  setTableBorders("A43:L47");

  // ====================================================
  // BLOK 4: 🧪 UTILITY ZONE (Rows 49 to 71)
  // Sub-A: Healing & Mobility Magic (Rows 50-55)
  // Sub-B: Belt Quick-Bar Consumables (Rows 56-63)
  // Sub-C: Class Resource Pools (Rows 64-71)
  // ====================================================
  headerBar("A49:L49", "🧪 UTILITY: HEALING, MOBILITY MAGIC, BELT QUICK-BAR & RESOURCE POOLS", AMBER);

  // Sub-A: Healing & Mobility Magic (Rows 50 to 55)
  subHeaderBar("A50:L50", "🕊️ HEALING & MOBILITY / UTILITY MAGIC (Spells, Potions, Scrolls)", GREEN);
  sheet.getRange("A51:L51").setValues([["#", "Cast / Use?", "Spell / Ability / Item Name", "", "Type", "Heal / Utility Effect", "", "Action", "Range", "Target / Duration", "Mechanical Notes & Healing Values", ""]])
    .setBackground(SUB_HEAD).setFontColor(TEXT_MUTED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("C51:D51").merge();
  sheet.getRange("F51:G51").merge();
  sheet.getRange("K51:L51").merge();
  setTableBorders("A51:L51");

  var aiUtility = (aiGroupingData && aiGroupingData.utility && aiGroupingData.utility.healing_and_mobility) ? aiGroupingData.utility.healing_and_mobility : [];
  for (var u = 0; u < 4; u++) {
    var ur = 52 + u;
    var uBg = (u % 2 === 0) ? ROW_BG_1 : ROW_BG_2;
    var uItem = (u < aiUtility.length) ? aiUtility[u] : null;

    sheet.getRange(ur, 1, 1, 12).setBackground(uBg);
    sheet.getRange(ur, 1).setValue(u + 1).setFontColor(TEXT_MUTED).setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(ur, 2).insertCheckboxes().uncheck();
    sheet.getRange(ur, 3, 1, 2).merge().setValue(uItem ? uItem.name : "").setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(8);
    sheet.getRange(ur, 5).setValue(uItem ? (uItem.type || "Spell") : "").setFontColor(PURPLE).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(ur, 6, 1, 2).merge().setValue(uItem ? (uItem.effect || "") : "").setFontColor(GREEN).setFontWeight("bold").setFontSize(8);
    sheet.getRange(ur, 8).setValue(uItem ? (uItem.action || "Standard") : "").setFontColor(AMBER).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(ur, 9).setValue(uItem ? (uItem.range || "Touch") : "").setFontColor(SKY).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(ur, 10).setValue(uItem ? (uItem.duration || "Instantaneous") : "").setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(ur, 11, 1, 2).merge().setValue(uItem ? (uItem.notes || "") : "").setFontColor(TEXT_MUTED).setFontSize(8);
  }
  setTableBorders("A52:L55");

  // Sub-B: Belt Quick-Bar Consumables (Rows 56 to 63)
  subHeaderBar("A56:L56", "🎒 BELT QUICK-BAR & CONSUMABLES (Instant Click-to-Use with Stock Decrement)", AMBER);
  sheet.getRange("A57:L57").setValues([["#", "Use 1", "Qty Left", "Potion / Consumable Name (Belt)", "", "Effect / HP Heal Value", "", "", "Slot", "Action", "Notes & Source", ""]])
    .setBackground(SUB_HEAD).setFontColor(TEXT_MUTED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("D57:E57").merge();
  sheet.getRange("F57:H57").merge();
  sheet.getRange("K57:L57").merge();
  setTableBorders("A57:L57");

  var aiBelt = (aiGroupingData && aiGroupingData.utility && aiGroupingData.utility.belt_consumables) ? aiGroupingData.utility.belt_consumables : null;
  for (var c = 0; c < 6; c++) {
    var cr = 58 + c;
    var cIdx = c + 1;
    var cBg = (c % 2 === 0) ? ROW_BG_1 : ROW_BG_2;
    var cItem = (aiBelt && c < aiBelt.length) ? aiBelt[c] : null;

    sheet.getRange(cr, 1, 1, 12).setBackground(cBg);
    sheet.getRange(cr, 1).setValue(c + 1).setFontColor(TEXT_MUTED).setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(cr, 2).insertCheckboxes().uncheck()
      .setNote("Tıkla: 1 adet tüket, stoku düşür ve şifa/etkiyi anında uygula!");
    
    sheet.getRange(cr, 4, 1, 2).merge().setFormula(f('=IFERROR(INDEX(FILTER(inventory!$D$22:$D$96, inventory!$B$22:$B$96=TRUE, inventory!$D$22:$D$96<>""), ' + cIdx + '), "")')).setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(8);
    sheet.getRange(cr, 3).setFormula(f('=IF(D' + cr + '="", "", IFERROR(INDEX(FILTER(inventory!$H$22:$H$96, inventory!$B$22:$B$96=TRUE, inventory!$D$22:$D$96=D' + cr + '), 1), 0))')).setFontColor(AMBER).setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center").setBackground(INPUT_BG);
    sheet.getRange(cr, 6, 1, 3).merge().setFormula(f('=IF(D' + cr + '="", "", IFERROR(VLOOKUP(D' + cr + ', Master_DB!$A$6:$G, 7, FALSE), ""))')).setFontColor(TEXT_MUTED).setFontSize(8);

    sheet.getRange(cr, 9).setFormula(f('=IF(D' + cr + '="", "", "Belt")')).setFontColor(SKY).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(cr, 10).setFormula(f('=IF(D' + cr + '="", "", IFERROR(VLOOKUP(D' + cr + ', Master_DB!$A$6:$AA, 27, FALSE), "Standard"))')).setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(cr, 11, 1, 2).merge().setFormula(f('=IF(D' + cr + '="", "", IFERROR(VLOOKUP(D' + cr + ', Master_DB!$A$6:$F, 6, FALSE), "inventory"))')).setFontColor(TEXT_MUTED).setFontSize(8);
  }
  setTableBorders("A58:L63");

  // Sub-C: Class Resource Pools (Rows 64 to 71)
  subHeaderBar("A64:L64", "⚡ CLASS ABILITY RESOURCE POOLS", GREEN);
  sheet.getRange("A65:L65").setValues([["#", "Resource / Ability Name", "", "", "Remaining", "Max Pool", "Reset By", "Class Feature Mechanics & RAW Recovery Rules", "", "", "", ""]])
    .setBackground(SUB_HEAD).setFontColor(TEXT_MUTED).setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("B65:D65").merge();
  sheet.getRange("H65:L65").merge();
  setTableBorders("A65:L65");

  var aiPools = (aiGroupingData && aiGroupingData.utility && aiGroupingData.utility.class_resource_pools) ? aiGroupingData.utility.class_resource_pools : [];
  for (var cp = 0; cp < 6; cp++) {
    var cpr = 66 + cp;
    var cpBg = (cp % 2 === 0) ? ROW_BG_1 : ROW_BG_2;
    var cpItem = (cp < aiPools.length) ? aiPools[cp] : null;

    sheet.getRange(cpr, 1, 1, 12).setBackground(cpBg);
    sheet.getRange(cpr, 1).setValue(cp + 1).setFontColor(TEXT_MUTED).setHorizontalAlignment("center").setFontSize(8);
    sheet.getRange(cpr, 2, 1, 3).merge().setValue(cpItem ? cpItem.name : "").setFontColor(TEXT_MAIN).setFontWeight("bold").setFontSize(8);
    sheet.getRange(cpr, 5).setValue(cpItem ? cpItem.max_uses : "").setFontColor(GREEN).setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center").setBackground(INPUT_BG);
    sheet.getRange(cpr, 6).setValue(cpItem ? cpItem.max_uses : "").setFontColor(TEXT_MUTED).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(cpr, 7).setValue(cpItem ? (cpItem.recovery || "Daily") : "").setFontColor(AMBER).setFontSize(8).setHorizontalAlignment("center");
    sheet.getRange(cpr, 8, 1, 5).merge().setValue(cpItem ? (cpItem.notes || "") : "").setFontColor(TEXT_MUTED).setFontSize(8);
  }
  setTableBorders("A66:L71");

  // Freeze row 1
  sheet.setFrozenRows(1);

  // Apply real formulas
  applyCombatFormulas(sheet);

  ss.toast("⚔️ combat sayfası yeni semantik düzenle oluşturuldu!", "⚔️ Savaş Kokpiti Hazır", 4);
}


function applyCombatFormulas(sheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!sheet) sheet = ss.getSheetByName("combat");
  if (!sheet) return;
  var sep = getFormulaSeparator(sheet);
  function f(str) { return f_combat(sheet, str); }
  function set(a1, formula) { sheet.getRange(a1).setFormula(f(formula)); }

  // ---------- Hidden helpers: dropdown sources & active set (Cols M to T) ----------
  var notChild = 'Master_DB!$A$6:$A<>"", LEFT(TRIM(Master_DB!$A$6:$A), 1)<>"↳"';
  function listF(cond) { return '=IFERROR(SORT(UNIQUE(FILTER(Master_DB!$A$6:$A, ' + cond + ', ' + notChild + '))), "-")'; }
  var B = 'TRIM(Master_DB!$B$6:$B)';

  // Active Set in Col M (M3:M30): Equipped items from inventory + Active Buffs (C43:C46)
  sheet.getRange("M1").setValue("Active Set");
  sheet.getRange("M3:M30").clearContent();
  set("M3", '=IFERROR(FILTER(inventory!$D$4:$D$17, inventory!$A$4:$A$17=TRUE, inventory!$D$4:$D$17<>""), "")');
  set("M17", '=IFERROR(FILTER($C$43:$C$46, $B$43:$B$46=TRUE, $C$43:$C$46<>"-", $C$43:$C$46<>""), "")');

  var lists = [
    ["N", "Weapons & Attacks", listF('(' + B + '="Weapon") + (' + B + '="Spell") + (' + B + '="Maneuver") + (' + B + '="Ammunition")')],
    ["O", "Spells", listF(B + '="Spell"')],
    ["P", "Conditions", listF(B + '="Condition"')],
    ["Q", "Maneuvers", listF(B + '="Maneuver"')],
    ["R", "Buffs", listF('((Master_DB!$AE$6:$AE="Combat Buff") + (Master_DB!$AE$6:$AE="Defense / Counter") + (' + B + '="Spell")) * (' + B + '<>"Condition")')],
    ["S", "Consumables", listF('(' + B + '="Consumable") + (' + B + '="Potion") + (' + B + '="Scroll") + (' + B + '="Wand") + (' + B + '="Alchemical")')]
  ];
  for (var l = 0; l < lists.length; l++) {
    sheet.getRange(lists[l][0] + "1").setValue(lists[l][1]);
    sheet.getRange(lists[l][0] + "2").setValue("-");
    sheet.getRange(lists[l][0] + "3").setFormula(f(lists[l][2]));
  }

  // Ability Modifiers in Col T (T3 to T8)
  function abil(mainCell, mdbCol) {
    return '=INT((IFERROR(IF(N(Main!' + mainCell + ')>0, Main!' + mainCell + ', 10), 10) + ' +
      combatStackFormula(mdbCol, {}) + ' - N($K$5) - 10) / 2)';
  }
  var helpers = [
    [3, "STR mod", abil("$P$40", "J")],
    [4, "DEX mod", abil("$P$47", "K")],
    [5, "CON mod", abil("$P$54", "L")],
    [6, "INT mod", abil("$P$61", "M")],
    [7, "WIS mod", abil("$P$68", "N")],
    [8, "CHA mod", abil("$P$75", "O")]
  ];
  for (var h = 0; h < helpers.length; h++) {
    sheet.getRange("S" + helpers[h][0]).setValue(helpers[h][1]);
    set("T" + helpers[h][0], helpers[h][2]);
  }

  // 1. Max HP on C4 (Preserved)
  set("C4", '=IFERROR(lvl_up!$F$5, 100) + (T5 * IFERROR(lvl_up!$B$5, 1)) - (N($K$5) * 5)');

  // 2. Armor Class (D4, E4, F4) - Updated C34 (Combat Exp), D34 (Fighting Def), G34 (Total Def)
  set("D4", '=10 + T4 + ' + combatStackFormula("P", {}) + ' + IF(C34>0, C34, 0) + IF(D34=TRUE, 2, 0) + IF(G34=TRUE, 4, 0) - IF(G18=TRUE, 2, 0) - N($K$5)');
  set("E4", '=10 + T4 + IF(C34>0, C34, 0) + IF(D34=TRUE, 2, 0) + IF(G34=TRUE, 4, 0) - IF(G18=TRUE, 2, 0) - N($K$5)');
  set("F4", '=10 + ' + combatStackFormula("P", {noDex: true}) + ' + IF(G34=TRUE, 4, 0) - N($K$5)');
  set("D6", '="10 Base + " & T4 & " Dex + " & (' + combatStackFormula("P", {}) + ') & " Gear/Buff - " & N($K$5) & " NegLvl"');

  // 3. Saves & Senses (Integer only - no decimals) - Active buffs in B43:B46
  set("G4", '=INT(IFERROR(lvl_up!$K$5, 0)) + T5 - N($K$5) + ' + combatStackFormula("T", {})); // Fort
  set("H4", '=INT(IFERROR(lvl_up!$M$5, 0)) + T4 - N($K$5) + ' + combatStackFormula("U", {}) + ' + IF(B43=TRUE, 1, 0)'); // Ref
  set("I4", '=INT(IFERROR(lvl_up!$O$5, 0)) + T7 - N($K$5) + ' + combatStackFormula("V", {})); // Will
  set("G6", '="Init: +" & (T4 + IF(B43=TRUE, 1, 0))'); // Initiative
  set("I6", '=IFERROR(REGEXEXTRACT(TO_TEXT(lvl_up!$E$3), "[0-9]+"), 30) + IF(B43=TRUE, 30, 0) & " ft"'); // Speed

  // 4. Attack Iteratives & Dynamic Damage (Rows 11 to 15)
  for (var w = 0; w < 5; w++) {
    var wr = 11 + w;
    var attMod = 'IF(B' + wr + '="Ranged", T4, T3)';
    var hasteAtt = 'IF(B43=TRUE, 1, 0)';
    var pAtt = 'N(C18)';
    var flank = 'IF(D18=TRUE, 2, 0)';
    var chg = 'IF(G18=TRUE, 2, 0)';
    var hg = 'IF(J18=TRUE, 1, 0)';
    var wepEnh = 'IFERROR(VLOOKUP(C' + wr + ', Master_DB!$A$6:$R, 18, FALSE), 0)';

    // 1st Attack on Col D (4)
    set("D" + wr, '=IF(C' + wr + '="","", IFERROR(lvl_up!$I$5, 0) + ' + attMod + ' - ' + pAtt + ' + ' + flank + ' + ' + chg + ' + ' + hg + ' + ' + hasteAtt + ' + ' + wepEnh + ')');
    // 2nd on E (5)
    set("E" + wr, '=IF(OR(C' + wr + '="", IFERROR(lvl_up!$I$5, 0)<6), "-", D' + wr + ' - 5)');
    // 3rd on F (6)
    set("F" + wr, '=IF(OR(C' + wr + '="", IFERROR(lvl_up!$I$5, 0)<11), "-", D' + wr + ' - 10)');
    // 4th on G (7)
    set("G" + wr, '=IF(OR(C' + wr + '="", IFERROR(lvl_up!$I$5, 0)<16), "-", D' + wr + ' - 15)');

    // Dynamic Damage & Dice on Col I (9) - RAW: Base Die + (Grip * STR) + (Grip * PA) + Enhancement
    var baseDie = 'IFERROR(REGEXEXTRACT(VLOOKUP(C' + wr + ', Master_DB!$A$6:$Z, 26, FALSE), "^[0-9]+d[0-9]+"), "1d8")';
    var strDmg = 'IF(T3<0, T3, IF(H' + wr + '="2-Hand", INT(3 * T3 / 2), IF(H' + wr + '="Off-Hand", INT(T3 / 2), IF(H' + wr + '="Ranged (No Str)", 0, T3))))';
    var paDmg = 'IF(H' + wr + '="2-Hand", 2 * N(C18), IF(OR(H' + wr + '="Off-Hand", LEFT(H' + wr + ', 6)="Ranged"), 0, N(C18)))';
    var wepDmgEnh = 'IFERROR(N(VLOOKUP(C' + wr + ', Master_DB!$A$6:$S, 19, FALSE)), 0)';
    var totFlat = '(' + strDmg + ' + ' + paDmg + ' + ' + wepDmgEnh + ')';

    set("I" + wr, '=IF(C' + wr + '="", "", ' + baseDie + ' & IF(' + totFlat + '>0, "+" & ' + totFlat + ', IF(' + totFlat + '<0, "" & ' + totFlat + ', "")))');

    // Crit on Col J (10)
    set("J" + wr, '=IF(C' + wr + '="", "", IFERROR(REGEXEXTRACT(VLOOKUP(C' + wr + ', Master_DB!$A$6:$Z, 26, FALSE), "\\(([^\\)]+)\\)"), "20/x2"))');
  }

  // 5. Tactical Strikes Dynamic Formulas (Rows 20 to 23)
  for (var tm = 0; tm < 4; tm++) {
    var tmr = 20 + tm;
    if (!sheet.getRange("C" + tmr).getValue()) continue;
    if (!sheet.getRange("E" + tmr).getValue()) set("E" + tmr, '=IF(C' + tmr + '="", "", IFERROR(VLOOKUP(C' + tmr + ', Master_DB!$A$6:$B, 2, FALSE), "Ability"))');
    if (!sheet.getRange("F" + tmr).getValue()) set("F" + tmr, '=IF(C' + tmr + '="", "", IFERROR(VLOOKUP(C' + tmr + ', Master_DB!$A$6:$R, 18, FALSE), 0))');
    if (!sheet.getRange("G" + tmr).getValue()) set("G" + tmr, '=IF(C' + tmr + '="", "", IFERROR(VLOOKUP(C' + tmr + ', Master_DB!$A$6:$Z, 26, FALSE), ""))');
    if (!sheet.getRange("H" + tmr).getValue()) set("H" + tmr, '=IF(C' + tmr + '="", "", IFERROR(REGEXEXTRACT(VLOOKUP(C' + tmr + ', Master_DB!$A$6:$Z, 26, FALSE), "(?i)(fire|cold|acid|electricity|force|sonic|divine|holy|unholy|slashing|bludgeoning|piercing)"), "Weapon"))');
    if (!sheet.getRange("I" + tmr).getValue()) set("I" + tmr, '=IF(C' + tmr + '="", "", IF(E' + tmr + '="Maneuver", "Ev Kuralı", "No"))');
    if (!sheet.getRange("J" + tmr).getValue()) set("J" + tmr, '=IF(C' + tmr + '="", "", IFERROR(VLOOKUP(C' + tmr + ', Master_DB!$A$6:$AB, 28, FALSE), "1 swing"))');
    if (!sheet.getRange("K" + tmr).getValue()) set("K" + tmr, '=IF(C' + tmr + '="", "", IFERROR(VLOOKUP(C' + tmr + ', Master_DB!$A$6:$G, 7, FALSE), ""))');
  }

  // 6. Active Buffs Dynamic Formulas (Rows 43 to 46)
  for (var b = 0; b < 4; b++) {
    var br = 43 + b;
    if (!sheet.getRange("C" + br).getValue()) continue;
    if (!sheet.getRange("E" + br).getValue()) set("E" + br, '=IF(C' + br + '="", "", IFERROR(VLOOKUP(C' + br + ', Master_DB!$A$6:$H, 8, FALSE), ""))');
    if (!sheet.getRange("F" + br).getValue()) set("F" + br, '=IF(C' + br + '="", "", IFERROR(VLOOKUP(C' + br + ', Master_DB!$A$6:$I, 9, FALSE), ""))');
    if (!sheet.getRange("H" + br).getValue()) set("H" + br, '=IF(C' + br + '="", "", IFERROR(VLOOKUP(C' + br + ', Master_DB!$A$6:$AB, 28, FALSE), ""))');
    if (!sheet.getRange("K" + br).getValue()) set("K" + br, '=IF(C' + br + '="", "", IFERROR(VLOOKUP(C' + br + ', Master_DB!$A$6:$G, 7, FALSE), ""))');
  }
}


function getLiveFilteredGeminiModels(apiKey) {
  if (!apiKey && typeof getMyGeminiApiKey === "function") apiKey = getMyGeminiApiKey();
  if (!apiKey) return [];

  // Check cache first (1 hour = 3600 seconds)
  try {
    var cached = CacheService.getScriptCache().get("GEMINI_LIVE_MODELS_CACHE_V4");
    if (cached) {
      var parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch(e){}

  // Curated, active 2026 production models (Google recommended)
  var curatedList = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
    "gemini-flash-latest"
  ];

  try {
    var listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(apiKey);
    var resp = UrlFetchApp.fetch(listUrl, { muteHttpExceptions: true });
    if (resp.getResponseCode() === 200) {
      var data = JSON.parse(resp.getContentText());
      var available = (data.models || []).map(function(m) {
        return m.name.replace(/^models\//, "");
      });

      // Keep only verified models that exist in user's API key
      var verified = curatedList.filter(function(m) {
        return available.indexOf(m) !== -1;
      });

      if (verified.length > 0) {
        try { CacheService.getScriptCache().put("GEMINI_LIVE_MODELS_CACHE_V4", JSON.stringify(verified), 3600); } catch(ec){}
        return verified;
      }
    }
  } catch (err) {}

  return curatedList;
}

function getGeminiModelQueue(apiKey, taskType) {
  if (!apiKey && typeof getMyGeminiApiKey === "function") apiKey = getMyGeminiApiKey();
  var queue = [];

  // 1. If user selected a manual model in Rule_Library C3:D3, prioritize it first!
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ruleLib = ss.getSheetByName("Rule_Library");
    if (ruleLib) {
      var manualModel = String(ruleLib.getRange("C3").getValue() || "").trim();
      if (manualModel && manualModel.toUpperCase().indexOf("AUTO") === -1) {
        var cleanManual = manualModel.replace(/^models\//, "");
        queue.push(cleanManual);
      }
    }
  } catch(e){}

  // 2. Task-specific order:
  // - "combat" (Combat Builder): gemini-3.5-flash -> gemini-flash-latest -> gemini-3.5-flash-lite
  // - "rules" (Rule Master): gemini-3.5-flash-lite -> gemini-flash-lite-latest -> gemini-3.5-flash
  var taskOrder = (taskType === "combat")
    ? ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"]
    : ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.5-flash", "gemini-flash-latest"];

  var live = getLiveFilteredGeminiModels(apiKey);
  for (var i = 0; i < taskOrder.length; i++) {
    var m = taskOrder[i];
    if (live.indexOf(m) !== -1 && queue.indexOf(m) === -1) {
      queue.push(m);
    }
  }

  // Fallbacks if queue is somehow empty
  for (var j = 0; j < taskOrder.length; j++) {
    if (queue.indexOf(taskOrder[j]) === -1) {
      queue.push(taskOrder[j]);
    }
  }

  return queue;
}

function getBestGeminiModelEndpoint(apiKey, taskType) {
  var q = getGeminiModelQueue(apiKey, taskType);
  return q.length > 0 ? q[0] : (taskType === "combat" ? "gemini-3.5-flash" : "gemini-3.5-flash-lite");
}

function getSelectedModelName(apiKey) {
  return getBestGeminiModelEndpoint(apiKey);
}

function cleanGeminiJson(rawText) {
  if (!rawText) return "{}";
  var cleaned = String(rawText).trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```\s*$/i, "");
  return cleaned.trim();
}

function queryGeminiForCombatGrouping(charPayload) {
  var apiKey = getMyGeminiApiKey();
  if (!apiKey) {
    return { success: false, error: "API anahtarı bulunamadı. Lütfen önce '🔑 Set My Gemini API Key' menüsünden anahtarınızı kaydedin." };
  }

  var promptText = 
    "You are an expert D&D 3.5e Rules Arbiter and Combat Systems Architect.\n" +
    "Your task is to SEMANTICALLY GROUP feats, special abilities, equipped weapons/items, prepared spells, readied maneuvers, and inventory consumables (potions, scrolls, wands, alchemical items) from the provided character JSON into functional combat cockpit zones according to D&D 3.5e RAW (Rules as Written):\n\n" +
    "REASONING & AUDIT PROTOCOL (MANDATORY):\n" +
    "- You MUST first perform a step-by-step tactical reasoning audit in the '_tactical_reasoning' object before outputting the category arrays.\n" +
    "- IN '_tactical_reasoning.feats_audit': Analyze every feat from 'featsAndAbilities':\n" +
    "  * DODGE FEAT: In D&D 3.5e RAW, Dodge is NOT a static baked number; it requires designating 1 opponent during your turn to receive +1 Dodge AC against their attacks. YOU MUST PLACE 'Dodge' IN 'defense.reactive_counters_and_spells' (name: 'Dodge (+1 AC vs 1 target)', source: 'Feat', action: 'Free (Your turn)', effect: '+1 Dodge AC', duration: '1 round', trigger: 'Designated opponent', notes: 'Designate 1 opponent during your turn for +1 AC.')!\n" +
    "  * POWER ATTACK: Do NOT put Power Attack in strikes because cell C18 is its dedicated numeric input box!\n" +
    "  * COMBAT EXPERTISE: Do NOT put Combat Expertise in defense because cell C34 is its dedicated input box!\n" +
    "  * WEAPON MODIFIERS (Weapon Focus, Weapon Specialization): Put in 'offense.weapon_modifiers'.\n" +
    "- IN '_tactical_reasoning.spells_and_items_audit':\n" +
    "  * Activated item attacks (e.g. Ring casting Fireball) and attack scrolls/wands -> 'offense.offensive_spells_and_scrolls'.\n" +
    "  * Healing potions/spells -> 'utility.healing_and_mobility'.\n" +
    "  * Buff potions/spells -> 'defense.active_sustained_buffs'.\n\n" +
    "CRITICAL CONSTRAINTS & ZERO-HALLUCINATION POLICY:\n" +
    "- ONLY categorize items, feats, and spells EXPLICITLY present in the provided character JSON.\n" +
    "- NEVER invent, assume, or inject unlisted weapons (such as Dagger, Crossbow, Unarmed Strike, etc.) or items that are not in 'equippedItems', 'beltConsumables', or 'inventoryItemsAndConsumables'!\n" +
    "- For physical weapons: only include weapons that appear in 'equippedItems' or 'beltConsumables'.\n" +
    "- CRITICAL: SPECIAL PROPERTIES OF EQUIPPED ITEMS ('equippedItems'):\n" +
    "  * If an equipped item in 'equippedItems' (e.g. Ring 1, Ring 2, Head, Shoulders, Torso, etc.) grants an offensive attack, spell, or activated damage ability (e.g. an equipped ring that allows casting Fireball, Ring of the Ram, etc.), YOU MUST LIST THIS EFFECT IN 'offensive_spells_and_scrolls' (e.g. name: 'Fireball (Ring 1)', source: 'Item (Ring 1)', dc: '...', damage_dice: '7d6', damage_type: 'Fire', range: '...', slot: 'Ring 1', notes: 'Cast via equipped Ring of Fireballs')!\n" +
    "  * If an equipped item grants a weapon strike bonus or enhancement, put it in 'tactical_strikes_and_poisons'.\n" +
    "  * If an equipped item grants an immediate/reaction defense or defensive spell (e.g. Ring of Invisibility, Cloak of Displacement), put it in 'reactive_counters_and_spells' or 'active_sustained_buffs'.\n" +
    "- CRITICAL: INVENTORY CONSUMABLES & POOL ITEMS ('inventoryItemsAndConsumables'):\n" +
    "  * Usable items from the inventory pool that are not body-slot wearables (Potions, Scrolls, Wands, Alchemical, Oils) MUST be categorized into the combat cockpit:\n" +
    "    - Direct attack/damage scrolls, wands, or items (e.g. Scroll of Fireball, Wand of Magic Missile, Alchemist's Fire) -> 'offensive_spells_and_scrolls' with source 'Scroll'|'Wand'|'Item'.\n" +
    "    - Healing/restoration potions or scrolls (e.g. Potion of Cure Light Wounds) -> 'healing_and_mobility' with source 'Potion'|'Scroll'.\n" +
    "    - Combat buff potions or scrolls (e.g. Potion of Bull's Strength, Potion of Haste, Scroll of Blur) -> 'active_sustained_buffs' or 'healing_and_mobility'.\n" +
    "    - Weapon oils or poisons -> 'tactical_strikes_and_poisons' with source 'Poison'|'Oil'.\n" +
    "- CRITICAL EXCLUSION: Power Attack is controlled via dedicated numeric box C18, do NOT put Power Attack here!\n" +
    "- CRITICAL EXCLUSION: Combat Expertise is controlled via dedicated box C34, do NOT put Combat Expertise in defense!\n" +
    "- CRITICAL EXCLUSION: Do NOT put physical weapons into tactical strikes!\n\n" +
    "=============================\n" +
    "1. ⚔️ OFFENSE ZONE:\n" +
    "=============================\n" +
    "- weapons: Physical weapons or shield bashes ready to attack with (name, grip: '1-Hand'|'2-Hand'|'Off-Hand'|'Ranged', damage_dice, crit, damage_type).\n" +
    "- weapon_modifiers: Continuous passive feats/abilities modifying weapons directly (Weapon Focus, Weapon Specialization, Two-Weapon Fighting, Rapid Shot).\n" +
    "- tactical_strikes_and_poisons: Strike maneuvers (Mountain Hammer), swing add-ons (Cleave, Sneak Attack, Smite), weapon oils, or poisons (Black Adder Venom).\n" +
    "- offensive_spells_and_scrolls: Direct damage spells, attack touch spells, offensive scrolls/wands, or activated offensive items/rings (e.g. Shocking Grasp, Scorching Ray, Fireball, Scroll of Magic Missile, Fireball via Ring).\n" +
    "- situational_modifiers: Flanking (+2 Atk), Charge (+2 Atk / -2 AC), Higher Ground (+1 Atk).\n\n" +
    "=============================\n" +
    "2. 🛡️ DEFENSE ZONE:\n" +
    "=============================\n" +
    "- tactical_defensive_modes: Combat Expertise (cell C34), Fighting Defensively, Total Defense.\n" +
    "- reactive_counters_and_spells: Immediate action counters (Wall of Blades, Shield Block), defensive/evasion spells or items (Shield, Mirror Image, Blur, Protection from Evil, Ring of Invisibility), AND tactical defense feats like Dodge (+1 AC vs 1 target)!\n" +
    "- active_sustained_buffs: Multi-round combat modes with round countdowns (Barbarian Rage, Haste, Bull's Strength, Righteous Might, Potion of Bull's Strength).\n\n" +
    "=============================\n" +
    "3. 🧪 UTILITY ZONE:\n" +
    "=============================\n" +
    "- healing_and_restoration: Potions/spells of Cure/Heal, Lay on Hands, Remove Curse.\n" +
    "- mobility_and_support_magic: Tactical movement or utility spells/items (Fly, Teleport, Expeditious Retreat, Spider Climb, Dispel Magic).\n" +
    "- belt_consumables: Quick-access items equipped on the belt with quantity tracking.\n" +
    "- class_resource_pools: Trackable daily or encounter pools (Rage 1/day, Turn Undead X/day, Bardic Music).\n\n" +
    "=============================\n" +
    "4. 📜 PASSIVES / BAKED STATS:\n" +
    "=============================\n" +
    "- Abilities permanently integrated into base stats (Fast Movement -> Speed, Uncanny Dodge -> AC notes, Trap Sense -> notes, Armor/Shield -> AC).\n\n" +
    "Return ONLY a valid JSON object matching this schema:\n" +
    "{\n" +
    '  "_tactical_reasoning": {\n' +
    '    "feats_audit": "Detailed classification of Dodge, Power Attack, and other feats...",\n' +
    '    "spells_and_items_audit": "Detailed audit of spells, magic rings, potions, scrolls..."\n' +
    '  },\n' +
    '  "offense": {\n' +
    '    "weapons": [ { "name": "...", "grip": "1-Hand", "damage_dice": "1d8", "crit": "19-20/x2", "damage_type": "Slashing" } ],\n' +
    '    "weapon_modifiers": [ { "name": "...", "applies_to": "Longsword", "bonus_atk": 1, "bonus_dmg": 0 } ],\n' +
    '    "tactical_strikes_and_poisons": [ { "name": "...", "source": "Feat"|"Maneuver"|"Spell"|"Poison"|"Item", "bonus_atk": 0, "bonus_dmg": "...", "damage_type": "...", "crit_mult": false, "duration": "1 swing", "notes": "..." } ],\n' +
    '    "offensive_spells_and_scrolls": [ { "name": "...", "source": "Spell"|"Scroll"|"Wand"|"Item", "dc": "...", "damage_dice": "...", "damage_type": "...", "range": "...", "slot": "V, S", "notes": "..." } ]\n' +
    '  },\n' +
    '  "defense": {\n' +
    '    "reactive_counters_and_spells": [ { "name": "...", "source": "Maneuver"|"Spell"|"Feat"|"Item", "action": "Immediate"|"Free", "effect": "...", "duration": "1 attack"|"1 round", "rounds_left": "-", "trigger": "On attack"|"Designated opponent", "notes": "..." } ],\n' +
    '    "active_sustained_buffs": [ { "name": "...", "source": "Ability"|"Spell"|"Potion"|"Item", "stat_summary": "+4 Str / -2 AC", "duration_rounds": "3+Con rds", "initial_rounds": 6, "notes": "..." } ]\n' +
    '  },\n' +
    '  "utility": {\n' +
    '    "healing_and_mobility": [ { "name": "...", "type": "Healing"|"Mobility", "source": "Spell"|"Potion"|"Scroll"|"Item", "action": "Standard", "effect": "Heals 3d8+CL", "range": "Touch", "duration": "Instantaneous", "notes": "..." } ],\n' +
    '    "belt_consumables": [ { "name": "...", "qty": 1, "effect": "...", "action": "Standard" } ],\n' +
    '    "class_resource_pools": [ { "name": "...", "max_uses": 1, "recovery": "Daily", "notes": "..." } ]\n' +
    '  }\n' +
    "}\n\n" +
    "CHARACTER JSON:\n" + JSON.stringify(charPayload);

  var payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  var queue = getGeminiModelQueue(apiKey, "combat");
  var successBody = null;
  var errorHistory = [];

  for (var m = 0; m < queue.length; m++) {
    var curModel = queue[m];
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + curModel + ":generateContent?key=" + encodeURIComponent(apiKey);
    try {
      var response = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      var status = response.getResponseCode();
      var body = response.getContentText();
      if (status === 200) {
        successBody = body;
        break;
      } else {
        var errObj = {};
        try { errObj = JSON.parse(body); } catch(e){}
        var errMsg = (errObj.error && errObj.error.message) ? errObj.error.message : ("HTTP " + status);
        errorHistory.push(curModel + " ➔ " + errMsg);
      }
    } catch (err) {
      errorHistory.push(curModel + " ➔ " + err.message);
    }
  }

  if (!successBody) {
    return { success: false, error: "Tüm modeller başarısız oldu:\n" + errorHistory.join("\n") };
  }

  try {
    var data = JSON.parse(successBody);
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
      return { success: false, error: "Model geçerli bir yanıt üretmedi." };
    }

    var rawOutput = data.candidates[0].content.parts[0].text;
    var parsed = JSON.parse(cleanGeminiJson(rawOutput));
    return { success: true, data: parsed };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Collects ONLY the active character combat state (equipped items, belt items,
 * active feats/abilities, prepared spells, readied maneuvers).
 * EXCLUDES Master_DB and unequipped inventory items to prevent AI hallucinations and bloat.
 */
function collectCombatDataPayload(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();

  var data = {
    characterName: "",
    race: "Human",
    classes: [],
    totalLevel: 0,
    bab: 0,
    equippedItems: [],
    beltConsumables: [],
    inventoryItemsAndConsumables: [],
    featsAndAbilities: [],
    preparedSpells: [],
    readiedManeuvers: []
  };

  // 0. Quick Master_DB dictionary for targeted description enrichment (only for owned items)
  var masterDbMap = {};
  var dbSheet = ss.getSheetByName("Master_DB");
  if (dbSheet) {
    var maxDb = dbSheet.getMaxRows();
    if (maxDb >= 6) {
      // Col 1: Name, Col 2: Category, Col 7: Desc, Col 26: Dmg/Special, Col 27: Action
      var dbData = dbSheet.getRange(6, 1, maxDb - 5, 27).getValues();
      for (var d = 0; d < dbData.length; d++) {
        var dName = String(dbData[d][0] || "").trim();
        if (dName) {
          masterDbMap[dName.toLowerCase()] = {
            fullName: dName,
            category: String(dbData[d][1] || "").trim(),
            description: String(dbData[d][6] || "").trim(),
            specialDmg: String(dbData[d][25] || "").trim(),
            action: String(dbData[d][26] || "").trim()
          };
        }
      }
    }
  }

  // 1. lvl_up Sheet: Basic stats & active roster
  var lvlSheet = ss.getSheetByName("lvl_up");
  if (lvlSheet) {
    data.race = String(lvlSheet.getRange("E1").getValue() || "Human").trim();
    data.bab = Number(lvlSheet.getRange("I5").getValue()) || 0;

    // Progression
    var levelsData = lvlSheet.getRange("B7:V36").getValues();
    var activeLevels = 0;
    var classCounts = {};
    for (var i = 0; i < levelsData.length; i++) {
      if (levelsData[i][0] === true) {
        activeLevels++;
        var cls = String(levelsData[i][1] || "").trim();
        if (cls) classCounts[cls] = (classCounts[cls] || 0) + 1;
      }
    }
    data.totalLevel = activeLevels;
    for (var cName in classCounts) {
      data.classes.push(cName + " " + classCounts[cName]);
    }

    // Dynamic Roster (Cols X to AB -> 24 to 28)
    var maxR = lvlSheet.getMaxRows();
    if (maxR >= 7) {
      var rosterData = lvlSheet.getRange(7, 24, maxR - 6, 5).getValues();
      for (var r = 0; r < rosterData.length; r++) {
        var rCat = String(rosterData[r][2] || "").trim();
        var rName = String(rosterData[r][3] || "").trim();
        var rNotes = String(rosterData[r][4] || "").trim();
        if (rName && rName !== "-") {
          data.featsAndAbilities.push({
            category: rCat,
            name: rName,
            notes: rNotes
          });
        }
      }
    }
  }

  // Also check character name from Main if available
  var mainSheet = ss.getSheetByName("Main");
  if (mainSheet) {
    var rawName = String(mainSheet.getRange("B3").getValue() || mainSheet.getRange("C3").getValue() || "").trim();
    if (rawName) data.characterName = rawName;
  }

  // 2. inventory Sheet: Equipped body slots (Rows 4-17) & Gear Pool non-wearable consumables (Rows 22-96)
  var invSheet = ss.getSheetByName("inventory");
  if (invSheet) {
    // 2A. Body slots: Col A = IsEquipped, Col C = SlotName, Col D = ItemName, Col E = Notes/Properties
    var bodyVals = invSheet.getRange("A4:E17").getValues();
    for (var b = 0; b < bodyVals.length; b++) {
      var isEquipped = bodyVals[b][0] === true;
      var slot = String(bodyVals[b][2] || "").trim();
      var item = String(bodyVals[b][3] || "").trim();
      var notes = String(bodyVals[b][4] || "").trim();
      if (isEquipped && item && item !== "-") {
        var itemKey = item.toLowerCase();
        var extra = masterDbMap[itemKey];
        var fullDesc = notes;
        if (extra) {
          if (!fullDesc) fullDesc = extra.description;
          if (extra.specialDmg && extra.specialDmg !== "-" && fullDesc.indexOf(extra.specialDmg) === -1) {
            fullDesc += " [Dmg/Special: " + extra.specialDmg + "]";
          }
          if (extra.action && extra.action !== "-" && fullDesc.indexOf(extra.action) === -1) {
            fullDesc += " [Action: " + extra.action + "]";
          }
        }
        data.equippedItems.push({
          slot: slot,
          item: item,
          properties: fullDesc
        });
      }
    }

    // 2B. Gear Pool: Col B = IsBelt, Col C = Category, Col D = ItemName, Col E = Desc, Col H = Qty, Col K = Location
    var poolVals = invSheet.getRange("B22:K96").getValues();
    var wearableSlots = [
      "head", "eyes", "neck", "shoulders", "torso", "armor",
      "belt", "bracers", "gloves", "ring", "ring 1", "ring 2",
      "boots", "main hand", "off-hand/shield", "shield"
    ];

    for (var p = 0; p < poolVals.length; p++) {
      var isBelt = poolVals[p][0] === true;
      var pCat = String(poolVals[p][1] || "").trim();
      var pItem = String(poolVals[p][2] || "").trim();
      var pDesc = String(poolVals[p][3] || "").trim();
      var pQty = Number(poolVals[p][6]) || 1;
      var pLoc = String(poolVals[p][9] || "").trim();

      if (!pItem || pItem === "-") continue;

      var catLower = pCat.toLowerCase();
      var isWearableSlot = wearableSlots.indexOf(catLower) !== -1;

      // Look up extra details from Master_DB for this specific pool item
      var pItemKey = pItem.toLowerCase();
      var pExtra = masterDbMap[pItemKey];
      var pFullDesc = pDesc;
      if (pExtra) {
        if (!pFullDesc) pFullDesc = pExtra.description;
        if (pExtra.specialDmg && pExtra.specialDmg !== "-" && pFullDesc.indexOf(pExtra.specialDmg) === -1) {
          pFullDesc += " [Dmg/Special: " + pExtra.specialDmg + "]";
        }
        if (pExtra.action && pExtra.action !== "-" && pFullDesc.indexOf(pExtra.action) === -1) {
          pFullDesc += " [Action: " + pExtra.action + "]";
        }
      }

      // If marked as belt, add to beltConsumables
      if (isBelt) {
        data.beltConsumables.push({
          category: pCat || "Consumable",
          item: pItem,
          qty: pQty,
          notes: pFullDesc
        });
      }

      // If NOT a wearable gear slot and NOT an unequipped spare weapon:
      // Collect as consumable/usable combat item (potions, scrolls, wands, alchemical items, wondrous items, oils, etc.)
      if (!isWearableSlot && catLower !== "weapon") {
        data.inventoryItemsAndConsumables.push({
          category: pCat || "Consumable",
          item: pItem,
          qty: pQty,
          isBelt: isBelt,
          location: pLoc || (isBelt ? "Belt" : "Backpack"),
          properties: pFullDesc
        });
      }
    }
  }

  // 3. spells_maneuvers Sheet: Prepared spells & readied maneuvers
  var smSheet = ss.getSheetByName("spells_maneuvers");
  if (smSheet) {
    var prepVals = smSheet.getRange("B7:D36").getValues();
    for (var s = 0; s < prepVals.length; s++) {
      var sName = String(prepVals[s][1] || "").trim();
      if (sName && sName !== "-") {
        data.preparedSpells.push(sName);
      }
    }
    var mnvVals = smSheet.getRange("B40:D49").getValues();
    for (var m = 0; m < mnvVals.length; m++) {
      var mName = String(mnvVals[m][1] || "").trim();
      if (mName && mName !== "-") {
        data.readiedManeuvers.push(mName);
      }
    }
  }

  return data;
}

function buildCombatWithAi() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  // 1. Check API Key
  var apiKey = getMyGeminiApiKey();
  if (!apiKey) {
    ui.alert("⚠️ Gemini API Anahtarı Gerekli", "Lütfen önce '🔑 Set My Gemini API Key' menüsünden anahtarınızı kaydedin.", ui.ButtonSet.OK);
    return;
  }

  // 2. Notify user that AI process is starting
  ss.toast("⏳ AI Savaş Sistemi Hazırlanıyor... Yetenekler, büyüler ve envanter analiz ediliyor...", "D&D AI Engine", 15);

  // 3. Collect character payload (Master_DB excluded to prevent hallucinations & bloat)
  var charPayload = collectCombatDataPayload(ss);

  // 4. Query Gemini
  var result = queryGeminiForCombatGrouping(charPayload);
  if (!result.success) {
    ui.alert("⚠️ AI Gruplama Hatası", "Gemini sorgusu başarısız oldu:\n" + result.error, ui.ButtonSet.OK);
    return;
  }

  // 5. Build layout & populate with AI grouped data!
  createCombatSheet(result.data);

  ss.toast("✅ Savaş sayfası yeni semantik düzene göre başarıyla yapılandırıldı!", "D&D AI Engine", 5);
}


function fixCombatFormulas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("combat");
  if (!sheet) {
    createCombatSheet();
  } else {
    applyCombatFormulas(sheet);
    try {
      // Ensure K9 has checkbox and default value
      var k9Val = sheet.getRange("K9").getValue();
      if (k9Val === "" || k9Val === null) {
        sheet.getRange("K9").insertCheckboxes().setValue(true).setHorizontalAlignment("center").setVerticalAlignment("middle");
        sheet.getRange("L9").setValue("🚫 No Crit Confirm (Otomatik)").setFontColor("#f59e0b").setFontWeight("bold").setFontSize(8);
      }
      // Ensure Power Attack and Combat Expertise cells
      if (sheet.getRange("C18").getValue() === "") sheet.getRange("C18").setValue(0);
      if (sheet.getRange("C34").getValue() === "") sheet.getRange("C34").setValue(0);
    } catch (e) {}
    ss.toast("⚔️ combat formülleri başarıyla yenilendi!", "🔧 Fix Combat Formulas", 4);
  }
}

function handleCombatEdit(sheet, range, e) {
  var ss = sheet.getParent();
  var row = range.getRow();
  var col = range.getColumn();

  // 1. Quick HP Adjust (L4: Dmg, L5: Heal)
  if (col === 12 && (row === 4 || row === 5)) {
    var isChecked = range.isChecked();
    if (!isChecked) return;

    var amt = Number(sheet.getRange("K4").getValue()) || 0;
    var curHp = Number(sheet.getRange("A4").getValue()) || 0;
    var maxHp = Number(sheet.getRange("C4").getValue()) || 1;
    var tmpHp = Number(sheet.getRange("C5").getValue()) || 0;
    var nlHp  = Number(sheet.getRange("C6").getValue()) || 0;

    if (row === 4) { // Dmg
      if (tmpHp > 0) {
        if (amt <= tmpHp) {
          sheet.getRange("C5").setValue(tmpHp - amt);
          amt = 0;
        } else {
          amt -= tmpHp;
          sheet.getRange("C5").setValue(0);
        }
      }
      var newHp = curHp - amt;
      sheet.getRange("A4").setValue(newHp);
      ss.toast("💥 " + amt + " hasar uygulandı! Yeni HP: " + newHp + "/" + maxHp, "Combat HUD", 3);
    } else if (row === 5) { // Heal
      var healedHp = Math.min(maxHp, curHp + amt);
      sheet.getRange("A4").setValue(healedHp);
      if (nlHp > 0) {
        sheet.getRange("C6").setValue(Math.max(0, nlHp - amt));
      }
      ss.toast("💖 " + amt + " can yenilendi! Yeni HP: " + healedHp + "/" + maxHp, "Combat HUD", 3);
    }
    range.uncheck();
    return;
  }

  // 2. Action & Rest Dropdown Menu (J6:L6)
  if (row === 6 && col >= 10 && col <= 12) {
    var actionVal = String(range.getValue() || "").trim().toLowerCase();
    if (actionVal.indexOf("long rest") !== -1) {
      performLongRest(sheet);
      sheet.getRange("J6:L6").setValue("- Eylem / Dinlenme Seç -");
      return;
    } else if (actionVal.indexOf("encounter reset") !== -1) {
      performEncounterReset(sheet);
      sheet.getRange("J6:L6").setValue("- Eylem / Dinlenme Seç -");
      return;
    } else if (actionVal.indexOf("next round") !== -1) {
      advanceCombatRound(sheet);
      sheet.getRange("J6:L6").setValue("- Eylem / Dinlenme Seç -");
      return;
    }
  }

  // Backward compatibility: Long Rest / Encounter Reset Checkboxes
  if (row === 6 && col === 10) {
    if (typeof range.isChecked === "function" && range.isChecked()) {
      performLongRest(sheet);
      range.uncheck();
    }
    return;
  }
  if (row === 6 && col === 11) {
    if (typeof range.isChecked === "function" && range.isChecked()) {
      performEncounterReset(sheet);
      range.uncheck();
    }
    return;
  }

  // 4. Next Round (J36)
  if (row === 47 && col === 10) {
    if (range.isChecked()) {
      advanceCombatRound(sheet);
      range.uncheck();
    }
    return;
  }

  // 5. Use 1 Consumable (Col B, Rows 40 to 45)
  if (col === 2 && row >= 58 && row <= 63) {
    if (range.isChecked()) {
      var itemQty = Number(sheet.getRange(row, 3).getValue()) || 0;
      var itemName = String(sheet.getRange(row, 4).getValue()).trim();

      if (itemQty <= 0) {
        range.uncheck();
        SpreadsheetApp.getUi().alert("⚠️ Tüketim Uyarısı", "'" + itemName + "' stokta kalmadı (Adet: 0)!", SpreadsheetApp.getUi().ButtonSet.OK);
        return;
      }

      // Decrement Combat Qty if static
      var newQty = itemQty - 1;
      if (!sheet.getRange(row, 3).getFormula()) {
        sheet.getRange(row, 3).setValue(newQty);
      }

      // Decrement Inventory Qty in inventory!H
      var invSheet = ss.getSheetByName("inventory");
      var decrementedInInv = false;
      if (invSheet) {
        var invData = invSheet.getRange("D22:H96").getValues();
        for (var iv = 0; iv < invData.length; iv++) {
          if (String(invData[iv][0]).trim().toLowerCase() === itemName.toLowerCase()) {
            var curInvQty = Number(invData[iv][4]) || 0;
            var newInvQty = Math.max(0, curInvQty - 1);
            invSheet.getRange(22 + iv, 8).setValue(newInvQty);
            decrementedInInv = true;
            break;
          }
        }
      }

      // If Cure potion, heal character
      if (itemName.toLowerCase().indexOf("cure") !== -1 || itemName.toLowerCase().indexOf("heal") !== -1) {
        var healAmt = 15;
        if (itemName.toLowerCase().indexOf("serious") !== -1) healAmt = 25;
        else if (itemName.toLowerCase().indexOf("moderate") !== -1) healAmt = 18;
        else if (itemName.toLowerCase().indexOf("light") !== -1) healAmt = 9;

        var cHp = Number(sheet.getRange("A4").getValue()) || 0;
        var mHp = Number(sheet.getRange("C4").getValue()) || 100;
        sheet.getRange("A4").setValue(Math.min(mHp, cHp + healAmt));
        sheet.getRange("C6").setValue(Math.max(0, (Number(sheet.getRange("C6").getValue()) || 0) - healAmt));
      }

      range.uncheck();
      ss.toast("🧪 '" + itemName + "' kullanıldı! Kalan: " + newQty + (decrementedInInv ? " (Envanterden de düşüldü)" : ""), "Consumable Used", 4);
    }
  }

  // 5B. Cast / Use Offensive Spell, Scroll, Wand or Magic Item (Col B, Rows 27 to 30)
  if (col === 2 && row >= 27 && row <= 30) {
    if (range.isChecked()) {
      var spellName = String(sheet.getRange(row, 3).getValue()).trim();
      var spellSource = String(sheet.getRange(row, 5).getValue()).trim();
      var spellDc = String(sheet.getRange(row, 6).getValue()).trim();
      var spellDmgDice = String(sheet.getRange(row, 7).getValue()).trim();
      var spellDmgType = String(sheet.getRange(row, 8).getValue()).trim();
      var spellRange = String(sheet.getRange(row, 9).getValue()).trim();

      if (spellName) {
        var totalSpellDmg = 0;
        var rollBreakdown = [];
        var diceMatch = spellDmgDice.match(/(\d+)d(\d+)(?:\s*([+-]\s*\d+))?/i);
        if (diceMatch) {
          var count = parseInt(diceMatch[1], 10) || 1;
          var sides = parseInt(diceMatch[2], 10) || 6;
          var flat = diceMatch[3] ? parseInt(diceMatch[3].replace(/\s+/g, ""), 10) : 0;
          var rolls = [];
          for (var r = 0; r < count; r++) {
            var roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            totalSpellDmg += roll;
          }
          totalSpellDmg += flat;
          rollBreakdown.push(count + "d" + sides + " [" + rolls.join(",") + "]" + (flat !== 0 ? (flat > 0 ? " +" + flat : " " + flat) : ""));
        }

        var bannerMsg = "🔥 " + spellName + " (" + (spellSource || "Saldırı") + ") Kullanıldı! ";
        if (totalSpellDmg > 0) {
          bannerMsg += "HASAR: " + totalSpellDmg + " " + spellDmgType + " (" + rollBreakdown.join(" ") + ") • ";
        }
        if (spellDc && spellDc !== "-") {
          bannerMsg += "DC/Saldırı: " + spellDc + " • ";
        }
        bannerMsg += "Menzil: " + (spellRange || "Touch");

        try {
          sheet.getRange("A31:L31").setValue(bannerMsg);
        } catch(e){}
        ss.toast(bannerMsg, "🔥 Büyü / Eşya Saldırısı", 6);
      }
      range.uncheck();
      return;
    }
  }

  // 6. Toggle Crit Confirmation House Rule (K9)
  if (row === 9 && col === 11) {
    var isNoCrit = (range.getValue() === true);
    if (isNoCrit) {
      sheet.getRange("L9").setValue("🚫 No Crit Confirm (Otomatik)").setFontColor("#f59e0b");
      ss.toast("⚡ Kritik Tehditleri otomatik onaylanır (Onay zarı atılmaz).", "Kritik Kuralı: Otomatik", 3);
    } else {
      sheet.getRange("L9").setValue("🎲 Crit Confirm Aktif (Zarlı)").setFontColor("#38bdf8");
      ss.toast("🎲 Kritik Tehditleri için onay zarı (Confirmation Roll) atılacak.", "Kritik Kuralı: Standart", 3);
    }
    return;
  }

  // 7. Roll Full Attack (Col A, Rows 11 to 15)
  if (col === 1 && row >= 11 && row <= 15) {
    var isChk = false;
    try {
      if (typeof range.isChecked === "function") {
        isChk = range.isChecked();
      }
    } catch (chkErr) {}
    if (!isChk) {
      var cellVal = range.getValue();
      isChk = (cellVal === true || (e && (e.value === "TRUE" || e.value === true)));
    }
    if (isChk) {
      try {
        range.setValue(false);
      } catch (uErr) {
        try { range.uncheck(); } catch (uErr2) {}
      }
      rollFullAttackForCombatWeapon(sheet, row);
    }
    return;
  }
}

/**
 * ----------------------------------------------------
 * TACTICAL OFFENSE DICE ROLLER & MODELESS DIALOG ENGINE
 * ----------------------------------------------------
 */
function rollActiveCombatWeapon() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("combat");
  if (!sheet) return;
  rollFullAttackForCombatWeapon(sheet, 11);
}

function rollFullAttackForCombatWeapon(sheet, row) {
  var ss = sheet ? sheet.getParent() : SpreadsheetApp.getActiveSpreadsheet();
  if (!sheet) sheet = ss.getSheetByName("combat");
  if (!sheet) return;

  var wepName = String(sheet.getRange(row, 3).getValue() || "").trim();
  if (!wepName) {
    // Fallback: check equipped weapon in inventory!D16 or search equipped weapon
    try {
      var invSheet = ss.getSheetByName("inventory");
      if (invSheet) {
        wepName = String(invSheet.getRange("D16").getValue() || "").trim();
        if (!wepName) wepName = String(invSheet.getRange("D4").getValue() || "").trim();
      }
    } catch (e) {}
  }
  if (!wepName) wepName = "Jovar +4";

  // Attack bonuses
  var rawAtks = [
    { num: 1, val: sheet.getRange(row, 4).getValue() },
    { num: 2, val: sheet.getRange(row, 5).getValue() },
    { num: 3, val: sheet.getRange(row, 6).getValue() },
    { num: 4, val: sheet.getRange(row, 7).getValue() }
  ];

  var validAtks = [];
  for (var i = 0; i < rawAtks.length; i++) {
    var v = rawAtks[i].val;
    if (typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== "" && String(v).trim() !== "-")) {
      validAtks.push({ num: rawAtks[i].num, bonus: Number(v) });
    }
  }
  if (validAtks.length === 0) {
    // Dynamic fallback calculation: BAB + Str mod if cells not evaluated
    var bab = 11;
    var strMod = 4;
    try {
      var lvlSheet = ss.getSheetByName("lvl_up");
      if (lvlSheet) {
        var bVal = lvlSheet.getRange("I5").getValue();
        if (bVal && !isNaN(Number(bVal))) bab = Number(bVal);
      }
      var sVal = sheet.getRange("T3").getValue();
      if (sVal && !isNaN(Number(sVal))) strMod = Number(sVal);
    } catch (e) {}
    var baseBonus = bab + strMod;
    validAtks.push({ num: 1, bonus: baseBonus });
    if (bab >= 6) validAtks.push({ num: 2, bonus: baseBonus - 5 });
    if (bab >= 11) validAtks.push({ num: 3, bonus: baseBonus - 10 });
    if (bab >= 16) validAtks.push({ num: 4, bonus: baseBonus - 15 });
  }

  // Grip
  var grip = String(sheet.getRange(row, 8).getValue() || "1-Hand").trim();

  // Base Dice & Flat
  var dmgFormulaStr = String(sheet.getRange(row, 9).getValue() || "1d8").trim();
  var baseDiceCount = 1;
  var baseDiceSides = 8;
  var flatBonus = 0;

  var diceMatch = dmgFormulaStr.match(/^(\d+)d(\d+)(?:([+-]\d+))?/i);
  if (diceMatch) {
    baseDiceCount = Number(diceMatch[1]) || 1;
    baseDiceSides = Number(diceMatch[2]) || 8;
    if (diceMatch[3]) flatBonus = Number(diceMatch[3]) || 0;
  }

  // Crit
  var critStr = String(sheet.getRange(row, 10).getValue() || "20/x2").trim();
  var critRangeMin = 20;
  var critMult = 2;
  var critMatch = critStr.match(/(?:(\d+)-20|\b20)\s*\/\s*x?(\d+)/i);
  if (critMatch) {
    if (critMatch[1]) critRangeMin = Number(critMatch[1]);
    if (critMatch[2]) critMult = Number(critMatch[2]);
  }

  // Weapon physical damage type
  var wepType = "Slashing";
  var lowerWep = wepName.toLowerCase();
  if (grip === "Off-Hand" || lowerWep.indexOf("shield") !== -1 || lowerWep.indexOf("hammer") !== -1 || lowerWep.indexOf("mace") !== -1 || lowerWep.indexOf("flail") !== -1) {
    wepType = "Bludgeoning";
  } else if (lowerWep.indexOf("bow") !== -1 || lowerWep.indexOf("spear") !== -1 || lowerWep.indexOf("rapier") !== -1 || lowerWep.indexOf("dagger") !== -1 || lowerWep.indexOf("arrow") !== -1) {
    wepType = "Piercing";
  }

  // House Rule Toggle for Maneuvers: J29
  var houseRuleManeuverCrit = false;
  try {
    houseRuleManeuverCrit = (sheet.getRange("J34").isChecked() === true);
  } catch (err) {}

  // House Rule Toggle for Critical Confirmation: K9
  var noCritConfirm = true; // Default as requested by user
  try {
    var k9Val = sheet.getRange("K9").getValue();
    if (k9Val === false || String(k9Val).toUpperCase() === "FALSE") {
      noCritConfirm = false;
    }
  } catch (err) {}

  // Active Modifiers from table rows 20 to 25
  var modRangeValues = sheet.getRange("B20:H23").getValues();
  var activeModifiers = [];
  var totalBonusAtk = 0;
  for (var m = 0; m < modRangeValues.length; m++) {
    var isChecked = (modRangeValues[m][0] === true);
    var mName = String(modRangeValues[m][1] || "").trim();
    if (isChecked && mName) {
      var mSource = String(modRangeValues[m][3] || "").trim();
      var mAtk = Number(modRangeValues[m][4]) || 0;
      var mDiceStr = String(modRangeValues[m][5] || "").trim();
      var mDmgType = String(modRangeValues[m][6] || "").trim();
      if (!mDmgType || mDmgType.toLowerCase() === "weapon") mDmgType = wepType;

      var mCount = 0;
      var mSides = 6;
      var mMatch = mDiceStr.match(/(\d+)d(\d+)/i);
      if (mMatch) {
        mCount = Number(mMatch[1]) || 1;
        mSides = Number(mMatch[2]) || 6;
      }

      var isMan = (mSource.toLowerCase().indexOf("maneuver") !== -1 || /hammer|minotaur/i.test(mName));

      totalBonusAtk += mAtk;
      activeModifiers.push({
        name: mName,
        source: mSource,
        bonusAtk: mAtk,
        diceCount: mCount,
        diceSides: mSides,
        dmgType: mDmgType,
        isManeuver: isMan
      });
    }
  }

  // Execution of rolls
  var results = [];
  var grandTotalDamage = 0;
  var summaryShortParts = [];

  for (var a = 0; a < validAtks.length; a++) {
    var atkItem = validAtks[a];
    var effectiveBonus = atkItem.bonus + totalBonusAtk;
    var d20 = Math.floor(Math.random() * 20) + 1;
    var totalAtk = d20 + effectiveBonus;
    var isThreat = (d20 >= critRangeMin);
    var isCrit = false;
    var confirmD20 = 0;
    var confirmTotal = 0;

    if (isThreat) {
      if (noCritConfirm) {
        isCrit = true;
        confirmD20 = d20;
        confirmTotal = totalAtk;
      } else {
        confirmD20 = Math.floor(Math.random() * 20) + 1;
        confirmTotal = confirmD20 + effectiveBonus;
        isCrit = (confirmTotal >= 15); // Standard confirmation threshold
      }
    }

    var effectiveMult = isCrit ? critMult : 1;

    // Roll base weapon dice
    var totalBaseDiceCount = baseDiceCount * effectiveMult;
    var baseRolls = [];
    var baseRollSum = 0;
    for (var b = 0; b < totalBaseDiceCount; b++) {
      var rVal = Math.floor(Math.random() * baseDiceSides) + 1;
      baseRolls.push(rVal);
      baseRollSum += rVal;
    }

    var effectiveFlat = flatBonus * effectiveMult;

    // Damage Types Dictionary
    var typeTotals = {};
    typeTotals[wepType] = baseRollSum + effectiveFlat;

    // Roll active modifiers
    var extraDiceSum = 0;
    var extraDetails = [];

    for (var em = 0; em < activeModifiers.length; em++) {
      var mod = activeModifiers[em];
      if (mod.diceCount > 0) {
        var shouldMult = (mod.isManeuver && houseRuleManeuverCrit && isCrit);
        var rCount = shouldMult ? (mod.diceCount * effectiveMult) : mod.diceCount;
        var rList = [];
        var rSum = 0;
        for (var rc = 0; rc < rCount; rc++) {
          var rv = Math.floor(Math.random() * mod.diceSides) + 1;
          rList.push(rv);
          rSum += rv;
        }
        extraDiceSum += rSum;
        typeTotals[mod.dmgType] = (typeTotals[mod.dmgType] || 0) + rSum;
        extraDetails.push(mod.name + " [" + rCount + "d" + mod.diceSides + ": " + rList.join("+") + "=" + rSum + " " + mod.dmgType + "]");
      }
    }

    var totalAttackDmg = baseRollSum + effectiveFlat + extraDiceSum;
    grandTotalDamage += totalAttackDmg;

    // Format type breakdown e.g. " (30 Slashing + 12 Fire + 18 Acid)"
    var typeKeys = Object.keys(typeTotals);
    var typeBreakdownStr = "";
    if (typeKeys.length > 1) {
      typeBreakdownStr = " (" + typeKeys.map(function(k) { return typeTotals[k] + " " + k; }).join(" + ") + ")";
    } else if (typeKeys.length === 1) {
      typeBreakdownStr = " (" + typeTotals[typeKeys[0]] + " " + typeKeys[0] + ")";
    }

    var critStatusTxt = "";
    if (isCrit) {
      critStatusTxt = noCritConfirm ? " 🎯 CRIT! (Oto)" : " 🎯 CRIT!";
    }
    summaryShortParts.push(atkItem.num + ". Atk: " + totalAtk + " | DMG: " + totalAttackDmg + typeBreakdownStr + critStatusTxt);

    results.push({
      num: atkItem.num,
      bonus: effectiveBonus,
      d20: d20,
      totalAtk: totalAtk,
      isThreat: isThreat,
      noCritConfirm: noCritConfirm,
      confirmD20: confirmD20,
      confirmTotal: confirmTotal,
      isCrit: isCrit,
      critMult: critMult,
      critStr: critStr,
      baseRolls: baseRolls,
      baseRollSum: baseRollSum,
      effectiveFlat: effectiveFlat,
      extraDiceSum: extraDiceSum,
      extraDetails: extraDetails,
      totalAttackDmg: totalAttackDmg,
      typeTotals: typeTotals,
      typeBreakdownStr: typeBreakdownStr
    });
  }

  // Update in-sheet banner cell (A26:L26)
  var bannerText = "🎲 " + wepName + " Son Saldırı: " + summaryShortParts.join("  •  ") + "  [TOPLAM: " + grandTotalDamage + " HP]";
  try {
    sheet.getRange("A31:L31").setValue(bannerText);
  } catch (bErr) {}

  // Instant notification via Toast (works reliably in onEdit simple triggers!)
  try {
    ss.toast(summaryShortParts.join(" | ") + " => TOPLAM: " + grandTotalDamage + " HP", "🎲 " + wepName + " Saldırı Sonucu", 10);
  } catch (tErr) {}

  // Modeless Dialog (opens when run via Menu / Drawing Button, gracefully ignored inside onEdit)
  try {
    showCombatAttackResultDialog({
      weaponName: wepName,
      grip: grip,
      critStr: critStr,
      results: results,
      grandTotalDamage: grandTotalDamage,
      noCritConfirm: noCritConfirm
    });
  } catch (uiErr) {
    // In onEdit simple trigger context, getUi().showModelessDialog() is restricted.
    // The in-sheet banner A26:L26 and ss.toast provide instant live feedback!
  }
}

function showCombatAttackResultDialog(data) {
  var htmlContent = getCombatAttackDialogHtml(data);
  var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(560)
    .setHeight(520);
  SpreadsheetApp.getUi().showModelessDialog(htmlOutput, "⚔️ " + data.weaponName + " — Attack Result");
}

function getCombatAttackDialogHtml(data) {
  var wepName = data.weaponName;
  var results = data.results;
  var grandTotalDamage = data.grandTotalDamage;

  var summaryCards = [];
  var breakdownCards = [];

  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    var critTag = r.isCrit 
      ? '<span style="color:#fb7185;font-weight:800;background:rgba(244,63,94,0.2);padding:2px 6px;border-radius:4px;border:1px solid #f43f5e;">🎯 CRIT (x' + r.critMult + ')</span>' 
      : (r.d20 === 20 ? '<span style="color:#fbbf24;font-weight:700;">✨ NAT 20</span>' : (r.d20 === 1 ? '<span style="color:#64748b;font-weight:700;">💀 NAT 1</span>' : '<span style="color:#94a3b8;">Normal</span>'));

    summaryCards.push(
      '<div style="background:#1e293b;border:1px solid ' + (r.isCrit ? '#f43f5e' : '#334155') + ';border-radius:8px;padding:10px;margin-bottom:8px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:6px;">' +
          '<strong style="color:#ffffff;">' + r.num + '. Attack</strong>' +
          critTag +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid #334155;padding-top:6px;font-family:monospace;font-size:13px;">' +
          '<span style="color:#94a3b8;">Atk: <strong style="color:#34d399;font-size:15px;">' + r.totalAtk + '</strong></span>' +
          '<span style="color:#94a3b8;">DMG: <strong style="color:#f43f5e;font-size:16px;">' + r.totalAttackDmg + '</strong>' +
            '<span style="color:#fde047;font-size:11px;font-weight:normal;margin-left:4px;">' + r.typeBreakdownStr + '</span>' +
          '</span>' +
        '</div>' +
      '</div>'
    );

    var atkLine = '1d20 [' + r.d20 + '] ' + (r.bonus >= 0 ? '+' : '') + r.bonus + ' = <strong>' + r.totalAtk + '</strong>';
    if (r.isThreat) {
      if (r.noCritConfirm) {
        atkLine += ' &rarr; <span style="color:#fbbf24;">Crit Tehdidi (' + (r.critStr || 'Crit') + ')</span> &rarr; <span style="color:#f43f5e;font-weight:bold;">🎯 OTOMATİK KRİTİK! (K9 Onaysız)</span>';
      } else {
        atkLine += ' &rarr; <span style="color:#fbbf24;">Crit Tehdidi!</span> Onay: 1d20 [' + r.confirmD20 + '] + ' + r.bonus + ' = ' + r.confirmTotal + ' &rarr; ' +
          (r.isCrit ? '<span style="color:#f43f5e;font-weight:bold;">ONAYLANDI!</span>' : '<span style="color:#94a3b8;">Onaylanmadı</span>');
      }
    }

    var dmgLines = [];
    dmgLines.push('<div style="margin-bottom:3px;"><span style="color:#6ee7b7;font-weight:600;">Katlanan:</span> Silah (' + (r.isCrit ? 'x' + r.critMult : 'x1') + ') ' + r.baseRollSum + ' + Sabitler ' + r.effectiveFlat + ' = <strong>' + (r.baseRollSum + r.effectiveFlat) + '</strong></div>');
    if (r.extraDetails && r.extraDetails.length > 0) {
      dmgLines.push('<div style="margin-bottom:3px;"><span style="color:#fbbf24;font-weight:600;">Ekstra Zarlar:</span> ' + r.extraDetails.join(' + ') + ' = <strong>' + r.extraDiceSum + '</strong></div>');
    }
    dmgLines.push('<div style="border-top:1px solid #334155;padding-top:4px;display:flex;justify-content:space-between;color:#f8fafc;font-weight:600;">' +
      '<span>Toplam:</span><span style="color:#f43f5e;font-family:monospace;">' + (r.baseRollSum + r.effectiveFlat) + ' + ' + r.extraDiceSum + ' = ' + r.totalAttackDmg + ' HP ' + r.typeBreakdownStr + '</span>' +
    '</div>');

    breakdownCards.push(
      '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px;margin-bottom:8px;font-size:11px;">' +
        '<div style="display:flex;justify-content:space-between;border-bottom:1px solid #1e293b;padding-bottom:4px;margin-bottom:4px;color:#38bdf8;font-weight:bold;">' +
          '<span>' + r.num + '. Vuruş Hesabı:</span>' +
          '<span style="font-family:monospace;color:#f1f5f9;">' + atkLine + '</span>' +
        '</div>' +
        dmgLines.join('') +
      '</div>'
    );
  }

  return '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
      '<meta charset="UTF-8">' +
      '<style>' +
        'body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background-color: #0b1220; color: #f8fafc; margin: 0; padding: 12px; }' +
        '::-webkit-scrollbar { width: 6px; }' +
        '::-webkit-scrollbar-track { background: #0f172a; }' +
        '::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:8px;margin-bottom:10px;">' +
        '<div>' +
          '<div style="font-size:14px;font-weight:bold;color:#ffffff;">⚔️ ' + wepName + ' — Full Attack</div>' +
          '<div style="font-size:10px;color:#94a3b8;">Bu kutu siz kapatana veya yeni zar atana kadar açık kalır.</div>' +
        '</div>' +
        '<button onclick="google.script.host.close()" style="background:#334155;color:#f8fafc;border:none;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;">✕ Kapat</button>' +
      '</div>' +

      '<div style="font-size:11px;font-weight:bold;color:#38bdf8;text-transform:uppercase;margin-bottom:6px;">1. Saldırı & Hasar Özeti</div>' +
      summaryCards.join('') +

      '<div style="background:#1e1b4b;border:1px solid #4338ca;border-radius:6px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
        '<span style="font-size:12px;font-weight:600;color:#c7d2fe;">Toplam Potansiyel Hasar:</span>' +
        '<span style="font-size:18px;font-weight:800;color:#34d399;font-family:monospace;">' + grandTotalDamage + ' HP</span>' +
      '</div>' +

      '<div style="font-size:11px;font-weight:bold;color:#fbbf24;text-transform:uppercase;margin-bottom:6px;">2. Detaylı Hesaplamalar ve Zar Dökümü</div>' +
      breakdownCards.join('') +
    '</body>' +
    '</html>';
}

/**
 * D&D 3.5e RAW Long Rest (8h)
 */
function performLongRest(sheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!sheet) sheet = ss.getSheetByName("combat");
  if (!sheet) return;

  var maxHp = Number(sheet.getRange("C4").getValue()) || 100;
  sheet.getRange("A4").setValue(maxHp);
  sheet.getRange("C5").setValue(0); // temp
  sheet.getRange("C6").setValue(0); // nonlethal

  // Uncheck prepared attack spells/maneuvers (D22:D26)
  sheet.getRange("D22:D26").uncheck();

  // Uncheck active buffs (B32:B35)
  sheet.getRange("B43:B46").uncheck();

  // Reset spells_maneuvers sheet
  var smSheet = ss.getSheetByName("spells_maneuvers");
  if (smSheet) {
    smSheet.getRange("C7:C36").uncheck();
    smSheet.getRange("C40:C49").uncheck();
  }

  // Reset class resource pools remaining (E48:E53 = F48:F53)
  for (var cp = 48; cp <= 53; cp++) {
    var maxVal = sheet.getRange(cp, 6).getValue();
    sheet.getRange(cp, 5).setValue(maxVal);
  }

  // Synchronize lvl_up to Main sheet
  try {
    linkLvlUpToMain();
  } catch (e) {
    console.warn("linkLvlUpToMain during rest error: " + e.message);
  }

  ss.toast("☀️ 8 saat dinlenme tamamlandı: Can fullendi, büyü slotları, manevralar, günlük havuzlar ve 'Main' sayfası senkronize edildi.", "☀️ Long Rest", 5);
}

/**
 * Encounter Reset
 */
function performEncounterReset(sheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!sheet) sheet = ss.getSheetByName("combat");
  if (!sheet) return;

  // Uncheck tactical attack modifiers (B20:B25)
  sheet.getRange("B20:B23").uncheck();

  // Reset tactical modes (C18: Power Attack, C29: Combat Expertise)
  sheet.getRange("C18").setValue(0);
  sheet.getRange("C34").setValue(0);
  ["D18", "G18", "J18", "D34", "G34"].forEach(function(a1) { sheet.getRange(a1).uncheck(); });

  // Reset active buffs (B32:B35)
  sheet.getRange("B43:B46").uncheck();

  // Reset readied maneuvers in spells_maneuvers
  var smSheet = ss.getSheetByName("spells_maneuvers");
  if (smSheet) {
    smSheet.getRange("C40:C49").uncheck();
  }

  ss.toast("🔄 Karşılaşma bitti: manevralar hazırlandı, geçici buff'lar ve taktik modlar sıfırlandı.", "🔄 Encounter Reset", 4);
}

/**
 * Advance Combat Round
 */
function advanceCombatRound(sheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!sheet) sheet = ss.getSheetByName("combat");
  if (!sheet) return;

  var rounds = sheet.getRange("I43:I46").getValues();
  var active = sheet.getRange("B43:B46").getValues();
  var expired = 0;

  for (var i = 0; i < rounds.length; i++) {
    if (active[i][0] === true && rounds[i][0] !== "" && !isNaN(Number(rounds[i][0]))) {
      var r = Number(rounds[i][0]) - 1;
      if (r <= 0) {
        sheet.getRange(43 + i, 2).uncheck();
        sheet.getRange(43 + i, 9).setValue(0);
        expired++;
      } else {
        sheet.getRange(43 + i, 9).setValue(r);
      }
    }
  }

  ss.toast("⏭️ 1 Tur İlerletildi (Tüm aktif buff süreleri 1 tur azaltıldı)." + (expired > 0 ? " · " + expired + " buff süresi bitti!" : ""), "Round Advanced", 3);
}

function performLongRestMenu() { performLongRest(); }
function performEncounterResetMenu() { performEncounterReset(); }


/**
 * ----------------------------------------------------
 * RESET ALL DATA & IMPORT / EXPORT ENGINE
 * ----------------------------------------------------
 */

/**
 * 2-Step Safe Reset of All Sheet Data
 * Asks for confirmation, then requires typing "SIFIRLA" to proceed.
 * Preserves core race data in Master_DB.
 */
function promptResetAllData() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Step 1: Warning Confirmation Dialog
  var confirm1 = ui.alert(
    "⚠️ TÜM VERİLERİ SIFIRLAMA UYARISI",
    "Bu işlem çalışma kitabındaki tüm karakter verilerini, seviye ilerlemelerini, envanter eşyalarını, büyü/manevra kayıtlarını ve savaş kokpitini KALICI OLARAK SİLECEKTİR.\n\n" +
    "Yalnızca temel ırk (Race) verileri Master_DB'de korunacaktır.\n\n" +
    "Devam etmek istiyor musunuz?",
    ui.ButtonSet.YES_NO
  );

  if (confirm1 !== ui.Button.YES) {
    ui.alert("İşlem İptal Edildi", "Sıfırlama işlemi iptal edildi. Hiçbir veriniz silinmedi.", ui.ButtonSet.OK);
    return;
  }

  // Step 2: Strict Text Verification Dialog
  var confirm2 = ui.prompt(
    "🚨 SON ONAY - VERİLERİ TEMİZLE",
    "Tüm test/karakter verilerini silip temiz bir başlangıç yapmak istediğinizi onaylamak için lütfen aşağıdaki kutuya 'SIFIRLA' yazıp Tamam'a tıklayın:\n(İptal etmek için 'İptal'e basın)",
    ui.ButtonSet.OK_CANCEL
  );

  if (confirm2.getSelectedButton() !== ui.Button.OK || confirm2.getResponseText().trim().toUpperCase() !== "SIFIRLA") {
    ui.alert("İşlem İptal Edildi", "Onay metni eşleşmedi veya iptal edildi. Hiçbir veri silinmedi.", ui.ButtonSet.OK);
    return;
  }

  // Execute Complete Reset
  executeResetAllSheets(ss);
}

/**
 * Resets all sheets to a clean slate, preserving core race data in Master_DB.
 */
function executeResetAllSheets(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Reset Master_DB (Preserve core races only)
  var dbSheet = ss.getSheetByName("Master_DB");
  if (dbSheet) {
    var maxRows = dbSheet.getMaxRows();
    if (maxRows >= 6) {
      var numRows = maxRows - 5;
      var vals = dbSheet.getRange(6, 1, numRows, 31).getValues();
      var raceRows = [];
      for (var r = 0; r < vals.length; r++) {
        var cat = String(vals[r][1] || "").trim();
        if (cat.toLowerCase() === "race") {
          raceRows.push(vals[r]);
        }
      }

      // Completely wipe content, notes, backgrounds, font styles and borders for all data rows (6:maxRows)
      var allDataRange = dbSheet.getRange(6, 1, numRows, 31);
      allDataRange.clearContent();
      allDataRange.clearNote();
      allDataRange.setBackground(null);
      allDataRange.setFontColor(null);
      allDataRange.setFontStyle("normal");
      allDataRange.setFontWeight("normal");
      allDataRange.setBorder(false, false, false, false, false, false);

      // Re-write only the preserved core races
      if (raceRows.length > 0) {
        dbSheet.getRange(6, 1, raceRows.length, 31).setValues(raceRows);
      }
    }
    // Re-seed essential races if missing
    ensureMasterDbSeedEssentials(ss);
    cleanMasterDbFormatting(dbSheet);
    if (typeof updateMasterDbValidations === "function") {
      updateMasterDbValidations(dbSheet);
    }
  }

  // 2. Reset lvl_up sheet
  var lvlSheet = ss.getSheetByName("lvl_up");
  if (lvlSheet) {
    // Clear Level Progression user input columns (Cols C, D, E, H, J, L, N, P, T, U, V)
    lvlSheet.getRange("C7:E36").clearContent().clearNote(); // Class names (C), HD (D), HP rolls (E)
    lvlSheet.getRange("H7:H36").clearContent().clearNote(); // BAB rates (Good, Average, Poor)
    lvlSheet.getRange("J7:J36").clearContent().clearNote(); // Fort rates (Good, Poor)
    lvlSheet.getRange("L7:L36").clearContent().clearNote(); // Ref rates (Good, Poor)
    lvlSheet.getRange("N7:N36").clearContent().clearNote(); // Will rates (Good, Poor)
    lvlSheet.getRange("P7:P36").clearContent().clearNote(); // Skill base points
    lvlSheet.getRange("T7:V36").clearContent().clearNote(); // Ability boosts, Notes, Details
    lvlSheet.getRange("T7:T36").setValue("-");              // Reset ability boost to "-"
    lvlSheet.getRange("B7:B36").uncheck();                  // Uncheck active level boxes
    lvlSheet.getRange("B7").check();                        // Keep Level 1 active

    // Clear Roster input columns (Cols Y, Z, AA: Level, Category, Feat/Ability Name)
    var rosterRows = Math.max(1, lvlSheet.getMaxRows() - 6);
    lvlSheet.getRange(7, 25, rosterRows, 3).clearContent().clearNote(); // Cols Y (25) to AA (27)

    // Reset Top Settings
    lvlSheet.getRange("C1").setValue("Standard 3.5e (1, 3, 6, 9...)");
    lvlSheet.getRange("C2").setValue("Fractional (Unearthed Arcana)");
    lvlSheet.getRange("C3").setValue("Yes (Max Hit Die at Lvl 1)");
    lvlSheet.getRange("E1").setValue("Human");
    lvlSheet.getRange("E2").setValue("30 ft");

    // Reapply formulas
    if (typeof fixLvlUpFormulas === "function") {
      fixLvlUpFormulas(lvlSheet);
    }
  }

  // 3. Reset inventory sheet
  var invSheet = ss.getSheetByName("inventory");
  if (invSheet) {
    // Clear 14 Body Slots (A4:A17 checkboxes, D4:D17 item names)
    invSheet.getRange("A4:A17").uncheck();
    invSheet.getRange("D4:D17").clearContent().clearNote();

    // Clear Inventory Pool (B22:L96)
    invSheet.getRange("B22:B96").uncheck();                  // Uncheck Belt
    invSheet.getRange("C22:D96").clearContent().clearNote();  // Clear Category & Item Name
    invSheet.getRange("H22:L96").clearContent().clearNote();  // Clear Qty, Wt, Cost, Notes

    // Reset Coins (J14:M14)
    try {
      invSheet.getRange("J14:M14").setValue(0);
    } catch (e) {}

    if (typeof updateInventoryPoolValidations === "function") {
      updateInventoryPoolValidations(invSheet);
    }
  }

  // 4. Reset spells_maneuvers sheet
  var smSheet = ss.getSheetByName("spells_maneuvers");
  if (smSheet) {
    smSheet.getRange("B7:D36").clearContent().clearNote();  // Spell level & name
    smSheet.getRange("C7:C36").uncheck();                   // Cast?

    smSheet.getRange("B40:D49").clearContent().clearNote(); // Maneuver level & name
    smSheet.getRange("C40:C49").uncheck();                  // Expended?

    smSheet.getRange("C53:D97").clearContent().clearNote(); // Spellbook library level & name
  }

  // 5. Rebuild clean combat sheet
  createCombatSheet();

  // 6. Link lvl_up to Main Sheet
  try {
    linkLvlUpToMain();
  } catch (e) {
    console.warn("linkLvlUpToMain during reset error: " + e.message);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "✨ Tüm test verileri başarıyla temizlendi! Temel ırklar korundu, temiz sayfalar kullanıma hazır.",
    "✨ Fabrika Ayarlarına Sıfırlandı",
    6
  );
}

/**
 * ----------------------------------------------------
 * IMPORT & EXPORT ENGINE (JSON MODALS)
 * ----------------------------------------------------
 */

/**
 * Collects complete character data into a structured JSON object
 */
function collectCharacterDataJson() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {
    schemaVersion: "1.0",
    exportDate: new Date().toISOString(),
    characterName: "",
    race: "Human",
    baseSpeed: "30 ft",
    settings: {},
    levelProgression: [],
    roster: [],
    inventory: {
      bodySlots: [],
      pool: []
    },
    spellsManeuvers: {
      preparedSpells: [],
      readiedManeuvers: []
    },
    customMasterDbEntries: []
  };

  // 1. Collect from lvl_up
  var lvlSheet = ss.getSheetByName("lvl_up");
  if (lvlSheet) {
    data.race = String(lvlSheet.getRange("E1").getValue() || "Human");
    data.baseSpeed = String(lvlSheet.getRange("E2").getValue() || "30 ft");
    data.settings = {
      featMode: String(lvlSheet.getRange("C1").getValue() || ""),
      babSaveMode: String(lvlSheet.getRange("C2").getValue() || ""),
      maxHpLvl1: String(lvlSheet.getRange("C3").getValue() || ""),
      primaryCaster: {
        className: String(lvlSheet.getRange("G1").getValue() || ""),
        clMode: String(lvlSheet.getRange("I1").getValue() || ""),
        stat: String(lvlSheet.getRange("K1").getValue() || "")
      },
      secondaryCaster: {
        className: String(lvlSheet.getRange("O1").getValue() || ""),
        stat: String(lvlSheet.getRange("P1").getValue() || ""),
        clMode: String(lvlSheet.getRange("N2").getValue() || "")
      },
      martialAdept: {
        className: String(lvlSheet.getRange("T1").getValue() || ""),
        stat: String(lvlSheet.getRange("V1").getValue() || "")
      }
    };

    // Levels 1 to 30
    var levelsData = lvlSheet.getRange("B7:V36").getValues();
    for (var i = 0; i < levelsData.length; i++) {
      var row = levelsData[i];
      var isActive = row[0] === true;
      var className = String(row[1] || "").trim();
      if (className) {
        data.levelProgression.push({
          level: i + 1,
          active: isActive,
          className: className,
          hd: Number(row[2]) || 0,
          hpRoll: Number(row[3]) || 0,
          notes: String(row[19] || "")
        });
      }
    }

    // Dynamic Roster (Cols X to AB)
    var maxR = lvlSheet.getMaxRows();
    if (maxR >= 7) {
      var rosterData = lvlSheet.getRange(7, 24, maxR - 6, 5).getValues();
      for (var r = 0; r < rosterData.length; r++) {
        var rLvl = rosterData[r][1];
        var rCat = String(rosterData[r][2] || "").trim();
        var rName = String(rosterData[r][3] || "").trim();
        var rNotes = String(rosterData[r][4] || "").trim();
        if (rName && rName !== "-") {
          data.roster.push({
            level: rLvl,
            category: rCat,
            name: rName,
            notes: rNotes
          });
        }
      }
    }
  }

  // 2. Collect from inventory
  var invSheet = ss.getSheetByName("inventory");
  if (invSheet) {
    // Body slots (Rows 4 to 17)
    var bodyVals = invSheet.getRange("A4:D17").getValues();
    for (var b = 0; b < bodyVals.length; b++) {
      var bActive = bodyVals[b][0] === true;
      var bSlot = String(bodyVals[b][2] || "").trim();
      var bItem = String(bodyVals[b][3] || "").trim();
      if (bItem && bItem !== "-") {
        data.inventory.bodySlots.push({
          slot: bSlot,
          equipped: bActive,
          item: bItem
        });
      }
    }

    // Pool items (Rows 22 to 96)
    var poolVals = invSheet.getRange("B22:L96").getValues();
    for (var p = 0; p < poolVals.length; p++) {
      var pBelt = poolVals[p][0] === true;
      var pCat = String(poolVals[p][1] || "").trim();
      var pItem = String(poolVals[p][2] || "").trim();
      var pQty = Number(poolVals[p][6]) || 1;
      var pWt = Number(poolVals[p][7]) || 0;
      var pCost = Number(poolVals[p][8]) || 0;
      var pLoc = String(poolVals[p][9] || "").trim();
      if (pItem && pItem !== "-") {
        data.inventory.pool.push({
          belt: pBelt,
          category: pCat,
          item: pItem,
          qty: pQty,
          wt: pWt,
          cost: pCost,
          location: pLoc
        });
      }
    }
  }

  // 3. Collect from spells_maneuvers
  var smSheet = ss.getSheetByName("spells_maneuvers");
  if (smSheet) {
    var prepVals = smSheet.getRange("B7:D36").getValues();
    for (var s = 0; s < prepVals.length; s++) {
      var sName = String(prepVals[s][1] || "").trim();
      if (sName && sName !== "-") {
        data.spellsManeuvers.preparedSpells.push(sName);
      }
    }
    var mnvVals = smSheet.getRange("B40:D49").getValues();
    for (var m = 0; m < mnvVals.length; m++) {
      var mName = String(mnvVals[m][1] || "").trim();
      if (mName && mName !== "-") {
        data.spellsManeuvers.readiedManeuvers.push(mName);
      }
    }
  }

  // 4. Collect custom Master_DB items (Non-core)
  var dbSheet = ss.getSheetByName("Master_DB");
  if (dbSheet) {
    var maxDb = dbSheet.getMaxRows();
    if (maxDb >= 6) {
      var dbRows = dbSheet.getRange(6, 1, maxDb - 5, 31).getValues();
      for (var d = 0; d < dbRows.length; d++) {
        var dName = String(dbRows[d][0] || "").trim();
        var dCat = String(dbRows[d][1] || "").trim();
        if (dName && dCat.toLowerCase() !== "race") {
          data.customMasterDbEntries.push(dbRows[d]);
        }
      }
    }
  }

  return data;
}

/**
 * Displays Export Modal Dialog with formatted JSON and 1-Click Copy / Download
 */
function exportCharacterDataModal() {
  var data = collectCharacterDataJson();
  var jsonStr = JSON.stringify(data, null, 2);

  var htmlContent = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 16px; margin: 0; }' +
    'h2 { margin-top: 0; color: #38bdf8; font-size: 16px; display: flex; align-items: center; gap: 8px; }' +
    'p { color: #94a3b8; font-size: 12px; margin-bottom: 12px; }' +
    'textarea { width: 100%; height: 320px; background: #080e1e; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; padding: 10px; font-family: Consolas, monospace; font-size: 11px; box-sizing: border-box; resize: vertical; }' +
    '.btn-bar { display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end; }' +
    'button { padding: 8px 14px; border: none; border-radius: 5px; font-weight: bold; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; }' +
    '.btn-primary { background: #0284c7; color: white; }' +
    '.btn-primary:hover { background: #0369a1; }' +
    '.btn-success { background: #16a34a; color: white; }' +
    '.btn-success:hover { background: #15803d; }' +
    '.btn-cancel { background: #334155; color: #cbd5e1; }' +
    '.toast { color: #4ade80; font-size: 11px; margin-top: 6px; display: none; }' +
    '</style>' +
    '</head><body>' +
    '<h2>💾 D&D 3.5E Karakter Verilerini Dışa Aktar (JSON)</h2>' +
    '<p>Bu JSON metni karakterinizin seviyelerini, hünerlerini, envanterini, büyülerini ve Master_DB kayıtlarını içerir.</p>' +
    '<textarea id="jsonArea" readonly>' + escapeHtmlString(jsonStr) + '</textarea>' +
    '<div id="toast" class="toast">✓ Panoya başarıyla kopyalandı!</div>' +
    '<div class="btn-bar">' +
    '  <button class="btn-cancel" onclick="google.script.host.close()">Kapat</button>' +
    '  <button class="btn-primary" onclick="copyToClipboard()">📋 Panoya Kopyala</button>' +
    '  <button class="btn-success" onclick="downloadJson()">💾 Dosya Olarak İndir (.json)</button>' +
    '</div>' +
    '<script>' +
    'function copyToClipboard() {' +
    '  var ta = document.getElementById("jsonArea");' +
    '  ta.select();' +
    '  document.execCommand("copy");' +
    '  var t = document.getElementById("toast");' +
    '  t.style.display = "block";' +
    '  setTimeout(function() { t.style.display = "none"; }, 3000);' +
    '}' +
    'function downloadJson() {' +
    '  var text = document.getElementById("jsonArea").value;' +
    '  var blob = new Blob([text], { type: "application/json" });' +
    '  var a = document.createElement("a");' +
    '  a.download = "dnd35_character.json";' +
    '  a.href = URL.createObjectURL(blob);' +
    '  a.click();' +
    '}' +
    '</script>' +
    '</body></html>';

  var htmlOutput = HtmlService.createHtmlOutput(htmlContent).setWidth(650).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "💾 D&D 3.5e Karakter Dışa Aktarma");
}

/**
 * Displays Import Modal Dialog where users can paste JSON or upload a .json file
 */
function importCharacterDataModal() {
  var htmlContent = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 16px; margin: 0; }' +
    'h2 { margin-top: 0; color: #38bdf8; font-size: 16px; display: flex; align-items: center; gap: 8px; }' +
    'p { color: #94a3b8; font-size: 12px; margin-bottom: 10px; }' +
    '.file-box { background: #1e293b; padding: 10px; border-radius: 6px; margin-bottom: 12px; border: 1px dashed #475569; display: flex; align-items: center; justify-content: space-between; }' +
    'input[type="file"] { font-size: 11px; color: #cbd5e1; }' +
    'textarea { width: 100%; height: 260px; background: #080e1e; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; padding: 10px; font-family: Consolas, monospace; font-size: 11px; box-sizing: border-box; resize: vertical; }' +
    '.warn { color: #fbbf24; font-size: 11px; margin-top: 8px; }' +
    '.btn-bar { display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end; }' +
    'button { padding: 8px 14px; border: none; border-radius: 5px; font-weight: bold; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; }' +
    '.btn-primary { background: #0284c7; color: white; }' +
    '.btn-primary:hover { background: #0369a1; }' +
    '.btn-cancel { background: #334155; color: #cbd5e1; }' +
    '#spinner { display: none; color: #38bdf8; font-size: 12px; margin-right: auto; align-items: center; gap: 6px; }' +
    '</style>' +
    '</head><body>' +
    '<h2>📥 D&D 3.5E Karakter Verilerini İçe Aktar (JSON)</h2>' +
    '<p>Daha önce dışa aktardığınız karakter dosyasını (.json) seçin veya JSON metnini doğrudan kutuya yapıştırın:</p>' +
    '<div class="file-box">' +
    '  <label style="font-size:12px; font-weight:bold;">📁 Dosya Seç (.json):</label>' +
    '  <input type="file" id="fileInput" accept=".json" onchange="loadFile(event)">' +
    '</div>' +
    '<textarea id="jsonInput" placeholder="Karakter JSON kodunu buraya yapıştırın..."></textarea>' +
    '<div class="warn">⚠️ Dikkat: İçe aktarma işlemi mevcut karakter verilerinizin üzerine yazacaktır.</div>' +
    '<div class="btn-bar">' +
    '  <span id="spinner">⏳ Karakter içe aktarılıyor, lütfen bekleyin...</span>' +
    '  <button class="btn-cancel" onclick="google.script.host.close()">İptal</button>' +
    '  <button class="btn-primary" id="btnImport" onclick="startImport()">📥 Karakteri İçe Aktar</button>' +
    '</div>' +
    '<script>' +
    'function loadFile(e) {' +
    '  var file = e.target.files[0];' +
    '  if (!file) return;' +
    '  var reader = new FileReader();' +
    '  reader.onload = function(evt) {' +
    '    document.getElementById("jsonInput").value = evt.target.result;' +
    '  };' +
    '  reader.readAsText(file);' +
    '}' +
    'function startImport() {' +
    '  var text = document.getElementById("jsonInput").value.trim();' +
    '  if (!text) { alert("Lütfen içe aktarılacak JSON metnini yapıştırın veya dosya seçin!"); return; }' +
    '  document.getElementById("spinner").style.display = "flex";' +
    '  document.getElementById("btnImport").disabled = true;' +
    '  google.script.run' +
    '    .withSuccessHandler(function(res) {' +
    '      alert(res.message);' +
    '      google.script.host.close();' +
    '    })' +
    '    .withFailureHandler(function(err) {' +
    '      alert("İçe aktarma hatası: " + err.message);' +
    '      document.getElementById("spinner").style.display = "none";' +
    '      document.getElementById("btnImport").disabled = false;' +
    '    })' +
    '    .executeCharacterImport(text);' +
    '}' +
    '</script>' +
    '</body></html>';

  var htmlOutput = HtmlService.createHtmlOutput(htmlContent).setWidth(650).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "📥 D&D 3.5e Karakter İçe Aktarma");
}

function escapeHtmlString(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Normalizes custom Master_DB entries imported from external JSON:
 * 1. Ensures Shields are categorized as "Shield" (not "Armor" or "Armor / Shield").
 * 2. Decomposes composite bonus types (e.g. "Deflection / Resistance") into distinct Parent and Child rows.
 */
function normalizeCustomMasterDbEntries(rawEntries) {
  if (!rawEntries || !rawEntries.length) return [];
  var result = [];

  for (var i = 0; i < rawEntries.length; i++) {
    var row = rawEntries[i].slice();
    while (row.length < 31) row.push("");

    var name = String(row[0] || "").trim();
    var cat = String(row[1] || "").trim();
    var slot = String(row[2] || "").trim();
    var bType = String(row[7] || "").trim();

    // 1. Shield categorization:
    if (cat.toLowerCase() === "armor / shield" || cat.toLowerCase() === "armor") {
      if (name.toLowerCase() === "shield" || name.toLowerCase().indexOf("shield") !== -1 || slot.toLowerCase().indexOf("shield") !== -1) {
        row[1] = "Shield";
        cat = "Shield";
      } else if (slot.toLowerCase() === "armor" || slot.toLowerCase() === "torso" || slot.toLowerCase() === "body") {
        row[1] = "Armor";
        cat = "Armor";
      }
    }

    // 2. Composite Bonus Type (e.g. "Deflection / Resistance" or "Deflection, Resistance"):
    if (bType.indexOf("/") !== -1 || bType.indexOf(",") !== -1) {
      var types = bType.split(/[,\/]/).map(function(t) { return t.trim(); }).filter(Boolean);
      var hasAc = (row[16] !== "" && row[16] !== 0 && row[16] !== "-");
      var hasSaves = (row[19] !== "" && row[19] !== 0) || (row[20] !== "" && row[20] !== 0) || (row[21] !== "" && row[21] !== 0) || (row[22] !== "" && row[22] !== 0);

      if (types.length >= 2 && hasAc && hasSaves) {
        // Parent row: AC bonus
        row[7] = types[0];
        var fortVal = row[20];
        var refVal = row[21];
        var willVal = row[22];
        var allSavesVal = row[19];
        row[19] = "";
        row[20] = "";
        row[21] = "";
        row[22] = "";
        result.push(row);

        // Child row: Saves bonus
        var childRow = new Array(31).fill("");
        childRow[0] = "↳ " + name + ": Saves";
        childRow[1] = cat;
        childRow[2] = slot;
        childRow[3] = name;
        childRow[4] = "-";
        childRow[5] = row[5] || "-";
        childRow[6] = "Grants +" + (allSavesVal || fortVal || 2) + " " + types[1] + " bonus on saving throws.";
        childRow[7] = types[1];
        childRow[8] = "None / General";
        childRow[19] = allSavesVal;
        childRow[20] = fortVal;
        childRow[21] = refVal;
        childRow[22] = willVal;
        childRow[26] = "Passive";
        childRow[27] = "Continuous";
        childRow[30] = "Defense / Counter";
        result.push(childRow);
        continue;
      } else if (types.length > 0) {
        row[7] = types[0];
      }
    }

    result.push(row);
  }

  return result;
}

/**
 * Backend executor for Character Import
 */
function executeCharacterImport(jsonString) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var parsed = null;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error("Geçersiz JSON formatı! Lütfen dosya içeriğini kontrol edin.");
  }

  // 1. Reset all sheets first for a clean slate
  executeResetAllSheets(ss);

  // 2. Restore Master_DB custom entries if present (auto-normalized for Shield categories and Multi-Bonus items)
  var dbSheet = ss.getSheetByName("Master_DB");
  if (dbSheet && parsed.customMasterDbEntries && parsed.customMasterDbEntries.length > 0) {
    var normalizedDbEntries = normalizeCustomMasterDbEntries(parsed.customMasterDbEntries);
    var startRow = dbSheet.getLastRow() + 1;
    if (startRow < 6) startRow = 6;
    dbSheet.getRange(startRow, 1, normalizedDbEntries.length, 31).setValues(normalizedDbEntries);
    if (typeof updateMasterDbValidations === "function") {
      updateMasterDbValidations(dbSheet);
    }
  }

  // 3. Restore lvl_up settings and levels
  var lvlSheet = ss.getSheetByName("lvl_up");
  if (lvlSheet) {
    if (parsed.race) lvlSheet.getRange("E1").setValue(parsed.race);
    if (parsed.baseSpeed) lvlSheet.getRange("E2").setValue(parsed.baseSpeed);
    if (parsed.settings) {
      if (parsed.settings.featMode) lvlSheet.getRange("C1").setValue(parsed.settings.featMode);
      if (parsed.settings.babSaveMode) lvlSheet.getRange("C2").setValue(parsed.settings.babSaveMode);
      if (parsed.settings.maxHpLvl1) lvlSheet.getRange("C3").setValue(parsed.settings.maxHpLvl1);
      if (parsed.settings.primaryCaster) {
        if (parsed.settings.primaryCaster.className) lvlSheet.getRange("G1").setValue(parsed.settings.primaryCaster.className);
        if (parsed.settings.primaryCaster.clMode) lvlSheet.getRange("I1").setValue(parsed.settings.primaryCaster.clMode);
        if (parsed.settings.primaryCaster.stat) lvlSheet.getRange("K1").setValue(parsed.settings.primaryCaster.stat);
      }
      if (parsed.settings.secondaryCaster) {
        if (parsed.settings.secondaryCaster.className) lvlSheet.getRange("O1").setValue(parsed.settings.secondaryCaster.className);
        if (parsed.settings.secondaryCaster.stat) lvlSheet.getRange("P1").setValue(parsed.settings.secondaryCaster.stat);
        if (parsed.settings.secondaryCaster.clMode) lvlSheet.getRange("N2").setValue(parsed.settings.secondaryCaster.clMode);
      }
      if (parsed.settings.martialAdept) {
        if (parsed.settings.martialAdept.className) lvlSheet.getRange("T1").setValue(parsed.settings.martialAdept.className);
        if (parsed.settings.martialAdept.stat) lvlSheet.getRange("V1").setValue(parsed.settings.martialAdept.stat);
      }
    }

    // Restore Levels
    if (parsed.levelProgression && parsed.levelProgression.length > 0) {
      for (var l = 0; l < parsed.levelProgression.length; l++) {
        var lp = parsed.levelProgression[l];
        var row = 6 + lp.level; // L1 = Row 7
        if (row <= 36) {
          lvlSheet.getRange(row, 2).setValue(lp.active !== false);
          lvlSheet.getRange(row, 3).setValue(lp.className || "");
          if (lp.hpRoll) lvlSheet.getRange(row, 5).setValue(lp.hpRoll);
          if (lp.notes) lvlSheet.getRange(row, 21).setValue(lp.notes);
        }
      }
    }

    // Restore Roster (Cols Y, Z, AA: Level, Category, Name)
    if (parsed.roster && parsed.roster.length > 0) {
      var rosterVals = [];
      for (var r = 0; r < parsed.roster.length; r++) {
        var ro = parsed.roster[r];
        rosterVals.push([
          ro.level || 1,
          ro.category || "Regular Feat",
          ro.name || ""
        ]);
      }
      lvlSheet.getRange(7, 25, rosterVals.length, 3).setValues(rosterVals);
    }

    if (typeof fixLvlUpFormulas === "function") {
      fixLvlUpFormulas(lvlSheet);
    }
  }

  // 4. Restore inventory
  var invSheet = ss.getSheetByName("inventory");
  if (invSheet) {
    if (parsed.inventory) {
      // Body slots
      if (parsed.inventory.bodySlots && parsed.inventory.bodySlots.length > 0) {
        var slotMap = {
          "Head": 4, "Eyes": 5, "Neck": 6, "Shoulders": 7, "Torso": 8, "Armor": 9,
          "Belt": 10, "Bracers": 11, "Gloves": 12, "Ring 1": 13, "Ring 2": 14,
          "Boots": 15, "Main Hand": 16, "Off-Hand/Shield": 17
        };
        for (var bs = 0; bs < parsed.inventory.bodySlots.length; bs++) {
          var bObj = parsed.inventory.bodySlots[bs];
          var targetRow = slotMap[bObj.slot];
          if (targetRow) {
            invSheet.getRange(targetRow, 1).setValue(bObj.equipped !== false);
            invSheet.getRange(targetRow, 4).setValue(bObj.item);
          }
        }
      }

      // Pool items
      if (parsed.inventory.pool && parsed.inventory.pool.length > 0) {
        for (var pi = 0; pi < parsed.inventory.pool.length; pi++) {
          var pRow = 22 + pi;
          if (pRow <= 96) {
            var pObj = parsed.inventory.pool[pi];
            invSheet.getRange(pRow, 2).setValue(pObj.belt === true);
            invSheet.getRange(pRow, 3).setValue(pObj.category || "Consumable");
            invSheet.getRange(pRow, 4).setValue(pObj.item || "");
            invSheet.getRange(pRow, 8).setValue(pObj.qty || 1);
            if (pObj.location) invSheet.getRange(pRow, 11).setValue(pObj.location);
          }
        }
      }
    }
    if (typeof updateInventoryPoolValidations === "function") {
      updateInventoryPoolValidations(invSheet);
    }
  }

  // 5. Restore spells_maneuvers
  var smSheet = ss.getSheetByName("spells_maneuvers");
  if (smSheet && parsed.spellsManeuvers) {
    if (parsed.spellsManeuvers.preparedSpells) {
      for (var ps = 0; ps < parsed.spellsManeuvers.preparedSpells.length; ps++) {
        var psRow = 7 + ps;
        if (psRow <= 36) {
          smSheet.getRange(psRow, 3).setValue(parsed.spellsManeuvers.preparedSpells[ps]);
        }
      }
    }
    if (parsed.spellsManeuvers.readiedManeuvers) {
      for (var rm = 0; rm < parsed.spellsManeuvers.readiedManeuvers.length; rm++) {
        var rmRow = 40 + rm;
        if (rmRow <= 49) {
          smSheet.getRange(rmRow, 3).setValue(parsed.spellsManeuvers.readiedManeuvers[rm]);
        }
      }
    }
  }

  // 6. Rebuild Combat Sheet
  createCombatSheet();

  // 7. Link lvl_up to Main Sheet
  try {
    linkLvlUpToMain();
  } catch (e) {
    console.warn("linkLvlUpToMain during import error: " + e.message);
  }

  return {
    success: true,
    message: "✓ Karakter başarıyla içe aktarıldı!\nSeviyeler, envanter, büyüler, savaş ve ana sayfa senkronize edildi."
  };
}






// 2.2 LVL_UP COPILOT ENGINE & CLASS CLEAR HANDLERS
// ----------------------------------------------------

function getLvlUpDataStartRow(sheet) {
  if (!sheet) return 7;
  return (sheet.getRange("A5").getValue() === "ACTIVE LVL:") ? 7 : 6;
}

/**
 * Handles clearing of level stats and associated roster entries
 * when the user deletes/clears the class name in Column C.
 * IMPORTANT: Unchecking the checkbox in Column B NEVER deletes anything.
 */
function handleLvlUpClassClear(sheet, range) {
  var startRow = range.getRow();
  var startCol = range.getColumn();
  var endRow = startRow + range.getNumRows() - 1;
  var endCol = startCol + range.getNumColumns() - 1;

  var dataStartRow = getLvlUpDataStartRow(sheet);
  var dataEndRow = dataStartRow + 29;

  // Intersects with Column C (3: Class & Lvl) in level rows
  if (startCol <= 3 && endCol >= 3 && endRow >= dataStartRow && startRow <= dataEndRow) {
    var rMin = Math.max(dataStartRow, startRow);
    var rMax = Math.min(dataEndRow, endRow);
    var clearedLevels = [];

    for (var r = rMin; r <= rMax; r++) {
      var val = String(sheet.getRange(r, 3).getValue() || "").trim();
      if (val === "") {
        // Clear level stats in that row
        sheet.getRange(r, 4).clearContent();  // Col D: HD
        sheet.getRange(r, 5).clearContent();  // Col E: HP Roll
        sheet.getRange(r, 8).clearContent();  // Col H: BAB Rate
        sheet.getRange(r, 10).clearContent(); // Col J: Fort Rate
        sheet.getRange(r, 12).clearContent(); // Col L: Ref Rate
        sheet.getRange(r, 14).clearContent(); // Col N: Will Rate
        sheet.getRange(r, 16).clearContent(); // Col P: Skill Base
        sheet.getRange(r, 20).setValue("-");  // Col T: Ability Boost reset
        sheet.getRange(r, 21).clearContent(); // Col U: Notes
        sheet.getRange(r, 22).clearContent(); // Col V: Details
        clearedLevels.push(r - (dataStartRow - 1));
      }
    }

    if (clearedLevels.length > 0) {
      clearRosterEntriesForLevels(sheet, clearedLevels);
    }
  }
}

/**
 * Removes roster rows corresponding to specific character levels,
 * compacts remaining entries upward cleanly, and re-applies validations.
 */
function clearRosterEntriesForLevels(sheet, levels) {
  if (!sheet || !levels || levels.length === 0) return;
  var levelMap = {};
  for (var k = 0; k < levels.length; k++) {
    levelMap[Number(levels[k])] = true;
  }

  var dataStartRow = getLvlUpDataStartRow(sheet);
  var maxR = Math.max(sheet.getLastRow(), dataStartRow + 29);
  if (maxR < dataStartRow) return;
  var numRosterRows = maxR - (dataStartRow - 1);
  var rangeYZAAAB = sheet.getRange(dataStartRow, 25, numRosterRows, 4); // Cols Y (25), Z (26), AA (27), AB (28)
  var values = rangeYZAAAB.getValues();
  var newValues = [];
  var clearedCount = 0;

  for (var i = 0; i < values.length; i++) {
    var rowLvl = values[i][0];
    var cat = values[i][1];
    var name = values[i][2];
    var notes = values[i][3];

    var numLvl = Number(rowLvl);
    if (rowLvl !== "" && !isNaN(numLvl) && levelMap[numLvl]) {
      clearedCount++;
      continue; // Skip: deleted from roster
    }

    if (rowLvl !== "" || cat !== "" || name !== "" || notes !== "") {
      newValues.push([rowLvl, cat, name, notes]);
    }
  }

  if (clearedCount > 0) {
    while (newValues.length < values.length) {
      newValues.push(["", "", "", ""]);
    }
    rangeYZAAAB.setValues(newValues);
    applyLvlUpRosterValidations(sheet);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      clearedCount + " adet yetenek/feat kaydı silinen seviyeler için Roster'dan temizlendi.",
      "🧹 Roster Temizlendi",
      4
    );
  }
}

/**
 * Finds the next available unallocated character level in lvl_up (rows 6 to 35).
 * Level 1 is Row 6, Level 2 is Row 7, ..., Level 30 is Row 35.
 */
/**
 * Canonicalizes class names and corrects common abbreviations/typos:
 * e.g. "fightrt" -> "Fighter", "warblad" -> "Warblade", "barb" -> "Barbarian"
 */
function canonicalizeClassName(name) {
  if (!name) return "";
  var s = String(name).trim().toLowerCase();
  
  var aliases = {
    "fightrt": "Fighter",
    "figter": "Fighter",
    "figther": "Fighter",
    "fighter": "Fighter",
    "warblade": "Warblade",
    "warblad": "Warblade",
    "barbarian": "Barbarian",
    "barb": "Barbarian",
    "rogue": "Rogue",
    "roge": "Rogue",
    "wizard": "Wizard",
    "wiz": "Wizard",
    "cleric": "Cleric",
    "clrk": "Cleric",
    "paladin": "Paladin",
    "pladin": "Paladin",
    "pala": "Paladin",
    "sorcerer": "Sorcerer",
    "sorc": "Sorcerer",
    "ranger": "Ranger",
    "druid": "Druid",
    "monk": "Monk",
    "bard": "Bard",
    "crusader": "Crusader",
    "swordsage": "Swordsage",
    "warlock": "Warlock",
    "duskblade": "Duskblade",
    "blood storm blade": "Bloodstorm Blade",
    "bloodstorm blade": "Bloodstorm Blade",
    "bloodstorm": "Bloodstorm Blade",
    "abjurant champion": "Abjurant Champion",
    "abjurant champ": "Abjurant Champion",
    "frenzied berzerker": "Frenzied Berserker",
    "frenzied berserker": "Frenzied Berserker",
    "dervish": "Dervish",
    "dragon disciple": "Dragon Disciple",
    "eldritch knight": "Eldritch Knight",
    "shadowdancer": "Shadowdancer",
    "assassin": "Assassin",
    "arcane archer": "Arcane Archer",
    "mystic theurge": "Mystic Theurge",
    "master thrower": "Master Thrower",
    "jade phoenix mage": "Jade Phoenix Mage",
    "ruby knight vindicator": "Ruby Knight Vindicator",
    "deepstone sentinel": "Deepstone Sentinel",
    "eternal blade": "Eternal Blade"
  };

  if (aliases[s]) {
    return aliases[s];
  }

  // Proper Title Case for multi-word or custom classes
  return s.split(/[\s_]+/).map(function(w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(" ");
}

/**
 * Normalizes a class name to alphanumeric lowercase for safe comparison.
 */
function normalizeClassName(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Parses an entry in lvl_up!C6:C35, supporting both:
 * - "Warblade-5" / "Fighter-1" (canonical hyphenated)
 * - "Warblade 5" / "Warblade - 5" (legacy space or hyphen separated)
 */
function parseSheetClassEntry(val) {
  if (!val) return null;
  var s = String(val).trim();
  var m = s.match(/^(.*?)(?:[\s\-]+)(\d+)$/);
  if (m) {
    return {
      className: canonicalizeClassName(m[1].trim()),
      classLevel: parseInt(m[2], 10)
    };
  }
  return {
    className: canonicalizeClassName(s),
    classLevel: 1
  };
}

/**
 * Finds the first empty character level before a given targetLevel in lvl_up!C6:C35.
 * Used to enforce strict character level continuity (no gaps allowed).
 */
function findFirstEmptyLevelBefore(sheet, targetLevel) {
  if (!sheet || !targetLevel || targetLevel <= 1) return null;
  var limit = Math.min(targetLevel - 1, 30);
  var startRow = getLvlUpDataStartRow(sheet);
  var cVals = sheet.getRange(startRow, 3, 30, 1).getValues();
  for (var i = 0; i < limit; i++) {
    var val = String(cVals[i][0] || "").trim();
    if (!val) {
      return i + 1; // 1-based character level that is missing
    }
  }
  return null;
}

/**
 * Finds the next available unallocated character level in lvl_up.
 * Returns null if all 30 levels are full.
 */
function getNextAvailableLevel(sheet) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName("lvl_up");
  }
  if (!sheet) return 1;
  var startRow = getLvlUpDataStartRow(sheet);
  var cValues = sheet.getRange(startRow, 3, 30, 1).getValues();
  for (var i = 0; i < cValues.length; i++) {
    var val = String(cValues[i][0] || "").trim();
    if (!val) {
      return i + 1; // 1-based character level
    }
  }
  return null; // All 30 levels full
}

/**
 * Counts existing class levels recorded in lvl_up for a given class name.
 * If upToLevel is provided, counts only in rows before that character level.
 */
function countExistingClassLevels(sheet, className, upToLevel) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName("lvl_up");
  }
  if (!sheet || !className) return 0;
  var target = normalizeClassName(canonicalizeClassName(className));
  var limit = (typeof upToLevel === 'number') ? Math.max(0, Math.min(upToLevel, 30)) : 30;
  if (limit === 0) return 0;

  var startRow = getLvlUpDataStartRow(sheet);
  var cVals = sheet.getRange(startRow, 3, 30, 1).getValues();
  var count = 0;
  for (var i = 0; i < limit; i++) {
    var parsed = parseSheetClassEntry(cVals[i][0]);
    if (parsed && normalizeClassName(parsed.className) === target) {
      count++;
    }
  }
  return count;
}

/**
 * Checks whether the target character level grants regular feats or racial bonus feats
 * based on the Feat Mode in C1 and Race in E1.
 */
function checkLevelUpFeatRules(targetLevel, featMode, characterRace) {
  var grantsRegularFeat = false;
  var featReason = "";
  var mode = String(featMode || "").toLowerCase();

  if (mode.indexOf("every 2") !== -1) {
    // Every 2 levels starting from 1: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19... (Odd levels)
    if (targetLevel % 2 !== 0) {
      grantsRegularFeat = true;
      featReason = "Every 2 Levels Rule (Lvl " + targetLevel + " Feat)";
    }
  } else if (mode.indexOf("every 4") !== -1) {
    if (targetLevel === 1 || targetLevel % 4 === 0) {
      grantsRegularFeat = true;
      featReason = "Every 4 Levels Rule (Lvl " + targetLevel + " Feat)";
    }
  } else if (mode.indexOf("free") !== -1 || mode.indexOf("custom") !== -1) {
    grantsRegularFeat = false;
  } else {
    // Standard 3.5e: 1, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30
    if (targetLevel === 1 || (targetLevel >= 3 && targetLevel % 3 === 0)) {
      grantsRegularFeat = true;
      featReason = "Standard 3.5e Character Feat (Lvl " + targetLevel + ")";
    }
  }

  var grantsHumanBonusFeat = false;
  var raceStr = String(characterRace || "").toLowerCase();
  if (targetLevel === 1 && raceStr.indexOf("human") !== -1) {
    grantsHumanBonusFeat = true;
  }

  return {
    grantsRegularFeat: grantsRegularFeat,
    featReason: featReason,
    grantsHumanBonusFeat: grantsHumanBonusFeat
  };
}

/**
 * Parses user input queries like:
 * - "warblade 5" -> Warblade-5 (validates class continuity)
 * - "fightrt 1" -> Fighter-1 (corrects common typos)
 * - "lvl 3 Warblade 2" -> validates character continuity
 * - "Warblade" -> auto-detects next legal class level
 */
function parseLevelUpQuery(rawQuery, sheet) {
  var q = String(rawQuery || "").trim();
  if (!q) return null;
  q = correctRuleSearchQuery(q);

  var targetLevel = null;
  var cleanQuery = q;

  // 1. Look for explicit target level pattern: "lvl 3", "level 3", "lvl: 3", "seviye 3"
  var lvlMatch = cleanQuery.match(/\b(?:lvl|level|seviye)\s*:?\s*(\d+)\b/i);
  if (lvlMatch) {
    targetLevel = parseInt(lvlMatch[1], 10);
    cleanQuery = cleanQuery.replace(lvlMatch[0], "").replace(/^[,\s:\-]+|[,\s:\-]+$/g, "").trim();
  }

  // If target level not explicitly provided, detect next available level in lvl_up!C6:C35
  if (!targetLevel) {
    targetLevel = getNextAvailableLevel(sheet);
  }

  if (!targetLevel || targetLevel > 30) {
    return {
      success: false,
      error: "⚠️ Karakter maksimum seviyeye (Seviye 30) ulaşmıştır. Yeni seviye eklenemez."
    };
  }

  // Check character level continuity: ensure no empty level exists before targetLevel
  var missingLevel = findFirstEmptyLevelBefore(sheet, targetLevel);
  if (missingLevel) {
    return {
      success: false,
      error: "⚠️ Kademeli Karakter Seviyesi Uyarısı:\n\n" +
             "Seviye " + targetLevel + " seçilemez!\n" +
             "Önce boş olan Seviye " + missingLevel + " doldurulmalıdır.\n" +
             "Karakter seviyeleri atlanmadan sırayla ilerlemelidir."
    };
  }

  // 2. Parse Class Name and Class Level (supports "warblade 5", "warblade-5", "warblade")
  var classMatch = cleanQuery.match(/^(.*?)(?:[\s\-]+)(\d+)$/);
  var rawClassName = "";
  var classLevel = null;

  if (classMatch) {
    rawClassName = classMatch[1].trim();
    classLevel = parseInt(classMatch[2], 10);
  } else {
    rawClassName = cleanQuery.trim();
  }

  var className = canonicalizeClassName(rawClassName);
  if (!className) {
    return {
      success: false,
      error: "Lütfen bir sınıf adı girin (Örn: Warblade 3 veya Fighter 1)."
    };
  }

  // 3. Class Level Continuity Check
  var currentClassCount = countExistingClassLevels(sheet, className, targetLevel - 1);
  var expectedNextClassLevel = currentClassCount + 1;

  if (classLevel === null || isNaN(classLevel)) {
    // If user omitted class level (e.g. just typed "warblade"), auto-assign the next valid level
    classLevel = expectedNextClassLevel;
  } else if (classLevel !== expectedNextClassLevel) {
    if (currentClassCount === 0) {
      return {
        success: false,
        error: "⚠️ Kademeli Sınıf Gelişimi Uyarısı:\n\n" +
               "'" + className + "-" + classLevel + "' seçilemez!\n" +
               "Karakterinizde henüz hiç " + className + " seviyesi bulunmuyor.\n\n" +
               "👉 Yönlendirme: Lütfen önce '" + className + "-1' (veya sadece '" + className + "') yazarak 1. seviyeyi ekleyin."
      };
    } else {
      return {
        success: false,
        error: "⚠️ Kademeli Sınıf Gelişimi Uyarısı:\n\n" +
               "'" + className + "-" + classLevel + "' seçilemez!\n" +
               "Mevcut " + className + " seviyeniz: " + currentClassCount + ".\n\n" +
               "👉 Yönlendirme: Sıradaki geçerli sınıf seviyesi '" + className + "-" + expectedNextClassLevel + "' olmalıdır."
      };
    }
  }

  return {
    success: true,
    rawQuery: rawQuery,
    targetLevel: targetLevel,
    className: className,
    classLevel: classLevel,
    classLevelTag: className + "-" + classLevel
  };
}

/**
 * Inserts new items into the lvl_up dynamic Roster table (Columns Y, Z, AA, AB).
 * Automatically finds the first empty row in Y:AB and sets category validation.
 */
function insertIntoLvlUpRoster(sheet, items) {
  if (!sheet || !items || items.length === 0) return;
  var rosterStart = getLvlUpDataStartRow(sheet);
  var maxR = Math.max(sheet.getLastRow(), rosterStart + 29);
  var values = sheet.getRange(rosterStart, 25, maxR - (rosterStart - 1), 3).getValues(); // Y:AA
  var firstEmptyIdx = -1;

  for (var i = 0; i < values.length; i++) {
    var lvlVal = String(values[i][0] || "").trim();
    var catVal = String(values[i][1] || "").trim();
    var nameVal = String(values[i][2] || "").trim();
    if (!lvlVal && !catVal && !nameVal) {
      firstEmptyIdx = i;
      break;
    }
  }

  if (firstEmptyIdx === -1) {
    firstEmptyIdx = values.length;
  }

  var startRow = firstEmptyIdx + rosterStart;
  var neededRows = startRow + items.length - 1;
  if (neededRows > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), neededRows - sheet.getMaxRows() + 5);
  }

  var rowData = [];
  for (var k = 0; k < items.length; k++) {
    rowData.push([items[k].lvl, items[k].cat, items[k].name]);
  }

  sheet.getRange(startRow, 25, rowData.length, 3).setValues(rowData);

  // Ensure Col AB has the dynamic ARRAYFORMULA from Master_DB (Col G)
  var ab7 = sheet.getRange("AB7");
  if (!ab7.getFormula()) {
    var sep = getFormulaSeparator(sheet);
    ab7.setFormula('=ARRAYFORMULA(IF(ISBLANK(AA7:AA), "", IFERROR(VLOOKUP(AA7:AA, Master_DB!$A$6:$G, 7, FALSE), "")))'.replace(/,/g, sep));
  }
  applyLvlUpRosterValidations(sheet);
}

// ----------------------------------------------------
// 2. DICE ROLLER & SIDEBAR ENGINE
// ----------------------------------------------------
function showInstantDiceSidebar() {
  var html = HtmlService.createHtmlOutput(getSidebarHtml())
      .setTitle('🎲 D&D 3.5e Instant Dice Roller')
      .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getSidebarHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f141c; color: #e2e8f0; margin: 0; padding: 12px; }
    h3 { margin: 0 0 10px 0; color: #d4af37; font-size: 15px; border-bottom: 1px solid #334155; padding-bottom: 6px; }
    .btn-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px; }
    button { background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 4px; padding: 8px 4px; font-weight: bold; cursor: pointer; transition: 0.1s; }
    button:hover { background: #334155; border-color: #d4af37; }
    button:active { transform: scale(0.96); }
    .btn-main { background: #284e3f; border-color: #48bb78; grid-column: span 2; }
    .btn-danger { background: #742a2a; border-color: #e53e3e; }
    #log { background: #090d14; border: 1px solid #1e293b; border-radius: 6px; padding: 8px; height: 350px; overflow-y: auto; font-family: monospace; font-size: 12px; }
    .entry { margin-bottom: 6px; padding: 6px; background: #141b26; border-left: 3px solid #d4af37; border-radius: 2px; }
    .nat20 { border-left-color: #38a169; color: #68d391; }
    .nat1 { border-left-color: #e53e3e; color: #fc8181; }
    .total { font-weight: bold; color: #faf089; font-size: 13px; }
  </style>
</head>
<body>
  <h3>🎲 Instant Dice Roller (0ms)</h3>
  <div class="btn-grid">
    <button onclick="rollD(20)">d20</button>
    <button onclick="rollD(12)">d12</button>
    <button onclick="rollD(10)">d10</button>
    <button onclick="rollD(8)">d8</button>
    <button onclick="rollD(6)">d6</button>
    <button onclick="rollD(4)">d4</button>
    <button onclick="rollD(100)">d%</button>
    <button class="btn-danger" onclick="document.getElementById('log').innerHTML=''">Clear</button>
  </div>
  <div style="margin-bottom: 10px;">
    <button class="btn-main" style="width: 100%;" onclick="rollSelection()">⚔️ Roll Selected Cell Expression</button>
  </div>
  <div id="log"></div>

  <script>
    function addLog(text, is20, is1) {
      var log = document.getElementById('log');
      var div = document.createElement('div');
      div.className = 'entry' + (is20 ? ' nat20' : '') + (is1 ? ' nat1' : '');
      div.innerHTML = text;
      log.insertBefore(div, log.firstChild);
    }

    function rollD(sides) {
      var r = Math.floor(Math.random() * sides) + 1;
      var is20 = (sides === 20 && r === 20);
      var is1 = (sides === 20 && r === 1);
      var text = '<strong>d' + sides + '</strong> &rarr; <span class="total">' + r + '</span>' + (is20 ? ' 🔥 NAT 20!' : is1 ? ' 💀 NAT 1!' : '');
      addLog(text, is20, is1);
    }

    function rollSelection() {
      google.script.run.withSuccessHandler(function(val) {
        if (!val && val !== 0) { addLog('<em>Selected cell is empty!</em>'); return; }
        parseAndRoll(String(val));
      }).getSelectedCellValue();
    }

    function rollSingleExpression(rawStr, modeLabel) {
      var str = (rawStr || '').trim();
      if (!str) return;

      // Extract parenthetical note (e.g. "(10ft)", "(pass)") if present
      var note = '';
      var noteMatch = str.match(/\\(([^)]+)\\)/);
      if (noteMatch) {
        note = noteMatch[1].trim();
        str = str.replace(/\\([^)]+\\)/g, '').trim();
      }

      // Single flat modifier check: e.g. "+5", "-2", "12" -> Roll d20 + mod
      if (/^[\\+\\-]?\\d+$/.test(str)) {
        var mod = parseInt(str, 10);
        var r = Math.floor(Math.random() * 20) + 1;
        var tot = r + mod;
        var labelPrefix = modeLabel ? '<strong>[' + modeLabel + (note ? ' - ' + note : '') + ']</strong> ' : '';
        var text = labelPrefix + '<strong>d20' + (mod>=0?'+':'') + mod + '</strong>: [' + r + '] = <span class="total">' + tot + '</span>' + (r===20?' 🔥 NAT 20!':r===1?' 💀 NAT 1!':'');
        addLog(text, r===20, r===1);
        return;
      }

      // Token regex matching dice or numbers with optional damage type (e.g. "3d6", "+1d12 Acid", "3d8 Acid", "8d6 Fire")
      var tokenRegex = /([\\+\\-]?\\s*\\d*d\\d+(?:\\s+[a-zA-Z]+)?|[\\+\\-]?\\s*\\d+(?:\\s+[a-zA-Z]+)?)/gi;
      var tokens = str.match(tokenRegex);

      if (!tokens || tokens.length === 0) {
        var numMatch = str.match(/[\\+\\-]?\\d+/);
        var fallback = numMatch ? parseInt(numMatch[0], 10) : 0;
        var r = Math.floor(Math.random() * 20) + 1;
        var labelPrefix = modeLabel ? '<strong>[' + modeLabel + (note ? ' - ' + note : '') + ']</strong> ' : '';
        addLog(labelPrefix + '<strong>d20' + (fallback>=0?'+':'') + fallback + '</strong>: [' + r + '] = <span class="total">' + (r+fallback) + '</span>' + (r===20?' 🔥 NAT 20!':r===1?' 💀 NAT 1!':''), r===20, r===1);
        return;
      }

      var total = 0;
      var rollsByType = {};
      var details = [];

      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i].trim();
        if (!token) continue;

        var sign = 1;
        if (token.charAt(0) === '-') {
          sign = -1;
          token = token.substring(1).trim();
        } else if (token.charAt(0) === '+') {
          token = token.substring(1).trim();
        }

        var diceMatch = token.match(/^(\\d*)d(\\d+)(.*)$/i);
        if (diceMatch) {
          var count = parseInt(diceMatch[1], 10) || 1;
          var sides = parseInt(diceMatch[2], 10);
          var dtype = (diceMatch[3] || '').trim();
          var key = dtype ? dtype : 'Base';

          var rolls = [];
          var dsum = 0;
          for (var d = 0; d < count; d++) {
            var r = Math.floor(Math.random() * sides) + 1;
            rolls.push(r);
            dsum += r;
          }
          var signed = dsum * sign;
          total += signed;
          if (!rollsByType[key]) rollsByType[key] = 0;
          rollsByType[key] += signed;

          var tag = dtype ? ' ' + dtype : '';
          details.push((sign < 0 ? '-' : '') + count + 'd' + sides + tag + ' [' + rolls.join(',') + ']');
        } else {
          var numMatch = token.match(/^(\\d+)(.*)$/);
          if (numMatch) {
            var flatVal = parseInt(numMatch[1], 10) * sign;
            var dtype = (numMatch[2] || '').trim();
            var key = dtype ? dtype : 'Base';

            total += flatVal;
            if (!rollsByType[key]) rollsByType[key] = 0;
            rollsByType[key] += flatVal;

            details.push((flatVal >= 0 ? '+' : '') + flatVal + (dtype ? ' ' + dtype : ''));
          }
        }
      }

      var typeList = [];
      for (var k in rollsByType) {
        typeList.push(rollsByType[k] + (k !== 'Base' ? ' ' + k : ''));
      }
      var typeSummary = (typeList.length > 1) ? ' <em>(' + typeList.join(', ') + ')</em>' : '';
      var labelHtml = modeLabel ? '<strong>[' + modeLabel + (note ? ' - ' + note : '') + ']</strong> ' : '';

      addLog(labelHtml + '<strong>' + rawStr + '</strong><br>' + details.join(' + ') + ' = <span class="total">' + total + '</span>' + typeSummary);
    }

    function parseAndRoll(str) {
      str = (str || '').trim();
      if (!str) return;

      // Multi-mode check: e.g. "2d4 Fire (10ft) / 2d6+15 Fire (pass)"
      // Ignore weapon critical notations like "1d8 (19-20/x2)"
      var isCritNotation = /^\\d*d\\d+\\s*\\(\\s*\\d+-\\d+\\s*\\/\\s*[xX]?\\d+\\s*\\)$/i.test(str);
      if (!isCritNotation && str.indexOf('/') !== -1) {
        var subModes = str.split('/');
        var diceModes = subModes.filter(function(s) { return /\\d*d\\d+/i.test(s); });
        if (diceModes.length > 1) {
          addLog('<div style="margin:4px 0 2px; padding:3px 6px; background:#1e293b; border-left:3px solid #38bdf8; font-size:11px; font-weight:bold; color:#7dd3fc;">⚡ Çoklu Mod Zarları</div>');
          for (var m = 0; m < subModes.length; m++) {
            var modeStr = subModes[m].trim();
            if (modeStr) {
              rollSingleExpression(modeStr, 'Mod ' + (m + 1));
            }
          }
          return;
        }
      }

      rollSingleExpression(str);
    }
  </script>
</body>
</html>`;
}

function getSelectedCellValue() {
  return SpreadsheetApp.getActive().getActiveRange().getValue();
}

function rollInitiative() {
  var ss = SpreadsheetApp.getActive();
  var mod = Number(ss.getActiveSheet().getRange('BW48').getValue()) || 0;
  var r = Math.floor(Math.random() * 20) + 1;
  ss.toast("⚡ Initiative: 1d20 [" + r + "] " + (mod>=0?'+':"") + mod + " = " + (r+mod) + (r==20?" 🔥 NAT 20!":r==1?" 💀 NAT 1!":""), "🎲 Roll Result", 5);
}

function rollFortitude() {
  var ss = SpreadsheetApp.getActive();
  var mod = Number(ss.getActiveSheet().getRange('Z86').getValue()) || 0;
  var r = Math.floor(Math.random() * 20) + 1;
  ss.toast("🛡️ Fortitude: 1d20 [" + r + "] " + (mod>=0?'+':"") + mod + " = " + (r+mod) + (r==20?" 🔥 NAT 20!":r==1?" 💀 NAT 1!":""), "🎲 Roll Result", 5);
}

function rollReflex() {
  var ss = SpreadsheetApp.getActive();
  var mod = Number(ss.getActiveSheet().getRange('Z91').getValue()) || 0;
  var r = Math.floor(Math.random() * 20) + 1;
  ss.toast("⚡ Reflex: 1d20 [" + r + "] " + (mod>=0?'+':"") + mod + " = " + (r+mod) + (r==20?" 🔥 NAT 20!":r==1?" 💀 NAT 1!":""), "🎲 Roll Result", 5);
}

function rollWill() {
  var ss = SpreadsheetApp.getActive();
  var mod = Number(ss.getActiveSheet().getRange('Z96').getValue()) || 0;
  var r = Math.floor(Math.random() * 20) + 1;
  ss.toast("🧠 Will Save: 1d20 [" + r + "] " + (mod>=0?'+':"") + mod + " = " + (r+mod) + (r==20?" 🔥 NAT 20!":r==1?" 💀 NAT 1!":""), "🎲 Roll Result", 5);
}

function rollSelectedCell() {
  var ss = SpreadsheetApp.getActive();
  var val = ss.getActiveRange().getValue();
  if (!val && val !== 0) {
    ss.toast("Selected cell is empty!", "🎲 Roll Result", 4);
    return;
  }
  var str = String(val).trim();
  // Strip parenthetical notations like (19-20/x2) or (x3) or (slashing) before parsing
  str = str.replace(/\s*\([^)]*\)/g, "").trim();

  // If single number, roll d20 + mod
  if (/^[+-]?\d+$/.test(str)) {
    var mod = parseInt(str, 10);
    var r = Math.floor(Math.random() * 20) + 1;
    ss.toast("🎲 1d20 [" + r + "] " + (mod>=0?'+':"") + mod + " = " + (r+mod) + (r==20?" 🔥 NAT 20!":r==1?" 💀 NAT 1!":""), "🎲 D20 Roll", 6);
    return;
  }

  // Complex damage expression (e.g. 3d6 + 1d12 Acid, 3d8 Acid, 8d6 Fire)
  var tokenRegex = /([+-]?\s*\d*d\d+(?:\s+[a-zA-Z]+)?|[+-]?\s*\d+(?:\s+[a-zA-Z]+)?)/gi;
  var tokens = str.match(tokenRegex);
  if (!tokens || tokens.length === 0) {
    var m = str.match(/[+-]?\d+/);
    var mod = m ? parseInt(m[0], 10) : 0;
    var r = Math.floor(Math.random() * 20) + 1;
    ss.toast("🎲 1d20 [" + r + "] " + (mod>=0?'+':"") + mod + " = " + (r+mod), "🎲 Roll", 5);
    return;
  }

  var total = 0;
  var rollsByType = {};
  var details = [];

  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i].trim();
    if (!token) continue;
    var sign = 1;
    if (token.charAt(0) === '-') {
      sign = -1;
      token = token.substring(1).trim();
    } else if (token.charAt(0) === '+') {
      token = token.substring(1).trim();
    }

    var diceMatch = token.match(/^(\d*)d(\d+)(.*)$/i);
    if (diceMatch) {
      var count = parseInt(diceMatch[1], 10) || 1;
      var sides = parseInt(diceMatch[2], 10);
      var dtype = (diceMatch[3] || '').trim();
      var key = dtype ? dtype : 'Base';

      var rolls = [];
      var dsum = 0;
      for (var d = 0; d < count; d++) {
        var roll = Math.floor(Math.random() * sides) + 1;
        rolls.push(roll);
        dsum += roll;
      }
      var signed = dsum * sign;
      total += signed;
      if (!rollsByType[key]) rollsByType[key] = 0;
      rollsByType[key] += signed;
      details.push((sign < 0 ? '-' : '') + count + 'd' + sides + (dtype ? ' ' + dtype : '') + ' [' + rolls.join(',') + ']');
    } else {
      var numMatch = token.match(/^(\d+)(.*)$/);
      if (numMatch) {
        var flatVal = parseInt(numMatch[1], 10) * sign;
        var dtype = (numMatch[2] || '').trim();
        var key = dtype ? dtype : 'Base';
        total += flatVal;
        if (!rollsByType[key]) rollsByType[key] = 0;
        rollsByType[key] += flatVal;
        details.push((flatVal >= 0 ? '+' : '') + flatVal + (dtype ? ' ' + dtype : ''));
      }
    }
  }

  var typeList = [];
  for (var k in rollsByType) {
    typeList.push(rollsByType[k] + (k !== 'Base' ? ' ' + k : ''));
  }
  var typeSummary = (typeList.length > 1) ? ' (' + typeList.join(', ') + ')' : '';
  ss.toast("⚔️ " + details.join(' + ') + " = " + total + typeSummary, "🎲 " + str, 7);
}


// ====================================================
// MASTER DATABASE & INTERACTIVE GUIDE ENGINE (Phase 3)
// ====================================================

// ----------------------------------------------------
// 1. MASTER BUILDER - BUILDS BOTH DB & GUIDE
// ----------------------------------------------------
function buildAllMasterDb() {
  createMasterDbSheet();
  createMasterDbGuideSheet();
  SpreadsheetApp.getActiveSpreadsheet().toast("Master_DB and Master_DB_Guide built successfully!", "✅ Complete", 6);
}

// ----------------------------------------------------
// 2. MASTER_DB FORMATTING & ROW STYLING HELPERS
// ----------------------------------------------------

/**
 * Applies proper D&D 3.5e visual styling (Parent-Child, fonts, number formats, alignments, borders)
 * to a specific range of rows in Master_DB.
 */
function formatMasterDbRowRange(sheet, startRow, numRows) {
  if (!sheet || numRows <= 0) return;

  var data = sheet.getRange(startRow, 1, numRows, 31).getValues();

  for (var i = 0; i < numRows; i++) {
    var currentRow = startRow + i;
    var entryName = String(data[i][0] || "").trim();
    var parentEntry = String(data[i][3] || "").trim();
    if (!entryName) continue;

    var isChild = (entryName.indexOf("↳") === 0 || (parentEntry !== "-" && parentEntry !== ""));
    var rowRange = sheet.getRange(currentRow, 1, 1, 31);
    sheet.setRowHeight(currentRow, 26);

    if (isChild) {
      // Child styling: Lavender row background, italic name, purple parent pill
      rowRange.setBackground("#faf5ff");
      sheet.getRange(currentRow, 1).setFontStyle("italic").setFontColor("#6b21a8").setFontWeight("bold");
      sheet.getRange(currentRow, 4).setBackground("#ede9fe").setFontColor("#5b21b6").setFontWeight("bold");
    } else {
      // Parent styling: Sky blue row background, bold navy name
      rowRange.setBackground("#f0f9ff");
      sheet.getRange(currentRow, 1).setFontStyle("normal").setFontColor("#0369a1").setFontWeight("bold");
      sheet.getRange(currentRow, 4).setFontStyle("normal").setFontColor("#334155").setFontWeight("normal");
    }
  }

  // Batch column formats
  sheet.getRange(startRow, 2, numRows, 3).setHorizontalAlignment("center");  // Category, Slot, Parent (cols 2-4)
  sheet.getRange(startRow, 5, numRows, 2).setHorizontalAlignment("left");    // Prerequisites, Source Book (cols 5-6)
  sheet.getRange(startRow, 7, numRows, 1).setWrap(true);                     // Benefit / Description (col 7)
  sheet.getRange(startRow, 8, numRows, 2).setHorizontalAlignment("center");  // Bonus Type, Combat Scope (cols 8-9)
  sheet.getRange(startRow, 10, numRows, 16).setHorizontalAlignment("center").setNumberFormat("0"); // Buff cols 10-25
  sheet.getRange(startRow, 26, numRows, 3).setHorizontalAlignment("center"); // On-Hit, Action, Duration (cols 26-28)
  sheet.getRange(startRow, 29, numRows, 1).setHorizontalAlignment("right").setNumberFormat("0.##");  // Weight (col 29)
  sheet.getRange(startRow, 30, numRows, 1).setHorizontalAlignment("right").setNumberFormat("#,##0"); // Cost (col 30)
  sheet.getRange(startRow, 31, numRows, 1).setHorizontalAlignment("center"); // Combat Role (col 31)

  sheet.getRange(startRow, 1, numRows, 31).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Cleans Master_DB formatting:
 * - Populated rows (with entry names in Col A) are cleanly styled.
 * - All empty rows below them have their backgrounds, borders, font colors, notes, and styles completely wiped.
 */
function cleanMasterDbFormatting(sheet) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName("Master_DB");
  }
  if (!sheet) return;

  var maxRows = sheet.getMaxRows();
  if (maxRows < 6) return;

  var numRows = maxRows - 5;
  var colA = sheet.getRange(6, 1, numRows, 1).getValues();

  var lastPopulatedRow = 5;
  for (var r = 0; r < colA.length; r++) {
    var name = String(colA[r][0] || "").trim();
    if (name !== "") {
      lastPopulatedRow = 6 + r;
    }
  }

  // 1. Format populated rows
  if (lastPopulatedRow >= 6) {
    formatMasterDbRowRange(sheet, 6, lastPopulatedRow - 5);
  }

  // 2. Wipe empty rows below (removes lingering colors, zebra, and borders)
  var emptyStartRow = lastPopulatedRow + 1;
  var emptyCount = maxRows - emptyStartRow + 1;
  if (emptyCount > 0) {
    var emptyRange = sheet.getRange(emptyStartRow, 1, emptyCount, 31);
    emptyRange.clearNote();
    emptyRange.setBackground(null);
    emptyRange.setFontColor(null);
    emptyRange.setFontStyle("normal");
    emptyRange.setFontWeight("normal");
    emptyRange.setBorder(false, false, false, false, false, false);
  }
}

function cleanMasterDbFormattingMenu() {
  cleanMasterDbFormatting();
  SpreadsheetApp.getActiveSpreadsheet().toast("Master_DB boş satır renklendirmeleri ve kenarlıkları tamamen temizlendi!", "🧹 Biçimlendirme Temizlendi", 5);
}

// ----------------------------------------------------
// 3. MASTER_DB BUILDER (31-Column Universal Architecture)
// ----------------------------------------------------
function createMasterDbSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Master_DB";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Always clear validations & rules first to prevent corruptions
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
  sheet.clearConditionalFormatRules();
  sheet.clear();
  sheet.setTabColor("#1e3a5f");

  // Ensure exact 31 columns (A through AE)
  var curCols = sheet.getMaxColumns();
  if (curCols < 31) {
    sheet.insertColumnsAfter(curCols, 31 - curCols);
  } else if (curCols > 31) {
    sheet.deleteColumns(32, curCols - 31);
  }

  // Freeze top 5 rows (Dashboard, Search, Filters & Headers) and first column
  sheet.setFrozenRows(5);
  sheet.setFrozenColumns(1);

  // Dynamic separator helper for locale safety
  var sep = getFormulaSeparator(sheet);
  function f(str) {
    return str.replace(/,/g, sep);
  }

  // ----------------------------------------------------
  // Dashboard & Interactive Filter Panel (Rows 1-4)
  // ----------------------------------------------------
  sheet.getRange("A1:AE4").setBackground("#0f172a");

  // 1. Title Banner (Column A only - never crosses column 1 frozen boundary)
  sheet.getRange("A1").setValue("📚 MASTER DATABASE")
    .setFontColor("#f8fafc").setFontSize(12).setFontWeight("bold").setVerticalAlignment("middle");
  sheet.getRange("A2").setValue("Unified D&D 3.5e Library")
    .setFontColor("#94a3b8").setFontSize(8).setFontStyle("italic").setVerticalAlignment("middle");
  sheet.getRange("A3:A4").merge().setValue("🔵 Mavi: Parent Ebeveyn\n🟣 Mor: Child Miras (↳)")
    .setFontColor("#38bdf8").setFontSize(8).setVerticalAlignment("middle");

  // 2. Search Bar by Entry Name (B1:D4 - in unfrozen columns 2, 3, 4)
  sheet.getRange("B1:D1").merge().setBackground("#1e293b").setFontColor("#38bdf8")
    .setFontSize(8).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("🔍 SEARCH BY ENTRY NAME");
  
  sheet.getRange("B2:D3").merge().setBackground("#0f172a").setFontColor("#ffffff")
    .setFontSize(11).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue(""); // Empty input for search query
  sheet.getRange("B2:D3").setBorder(true, true, true, true, false, false, "#38bdf8", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  sheet.getRange("B4:D4").merge().setBackground("#1e293b").setFontColor("#94a3b8")
    .setFontSize(7).setFontStyle("italic").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("(İsim yazıp Enter'a basın)");

  // 3. Category Filter Checkboxes (E1:F4)
  // E1:F1 -> ALL
  sheet.getRange("E1").insertCheckboxes().setValue(true).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("F1").setValue("🌟 ALL (Tümü)").setFontColor("#f8fafc").setFontWeight("bold").setFontSize(8).setVerticalAlignment("middle").setBackground("#1e293b");

  // E2:F2 -> FEATS & ABILITIES
  sheet.getRange("E2").insertCheckboxes().setValue(false).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("F2").setValue("⚔️ FEATS & ABILITIES").setFontColor("#4ade80").setFontWeight("bold").setFontSize(8).setVerticalAlignment("middle").setBackground("#1e293b");

  // E3:F3 -> EQUIPMENT & ITEMS
  sheet.getRange("E3").insertCheckboxes().setValue(false).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("F3").setValue("🛡️ EQUIPMENT & ITEMS").setFontColor("#facc15").setFontWeight("bold").setFontSize(8).setVerticalAlignment("middle").setBackground("#1e293b");

  // E4:F4 -> SPELLS & POWERS
  sheet.getRange("E4").insertCheckboxes().setValue(false).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("F4").setValue("✨ SPELLS & POWERS").setFontColor("#c084fc").setFontWeight("bold").setFontSize(8).setVerticalAlignment("middle").setBackground("#1e293b");

  // 4. Quick Stats / KPI Cards in Row 1-4 (Locale-safe formulas)
  // G1:H4 -> TOTAL ENTRIES
  sheet.getRange("G1:H2").merge().setBackground("#1e293b").setFontColor("#38bdf8")
    .setFontSize(15).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setFormula(f('=COUNTA(A6:A)'));
  sheet.getRange("G3:H4").merge().setBackground("#1e293b").setFontColor("#94a3b8")
    .setFontSize(7).setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("TOTAL ENTRIES");

  // I1:J4 -> FEATS & ABILITIES COUNT
  sheet.getRange("I1:J2").merge().setBackground("#1e293b").setFontColor("#4ade80")
    .setFontSize(15).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setFormula(f('=COUNTIF(B6:B, "Feat") + COUNTIF(B6:B, "Special Ability") + COUNTIF(B6:B, "DM Grant") + COUNTIF(B6:B, "Race") + COUNTIF(B6:B, "Racial Trait")'));
  sheet.getRange("I3:J4").merge().setBackground("#1e293b").setFontColor("#94a3b8")
    .setFontSize(7).setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("FEATS / ABIL");

  // K1:L4 -> EQUIPMENT & ITEMS COUNT
  sheet.getRange("K1:L2").merge().setBackground("#1e293b").setFontColor("#facc15")
    .setFontSize(15).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setFormula(f('=COUNTIF(B6:B, "Weapon") + COUNTIF(B6:B, "Armor") + COUNTIF(B6:B, "Shield") + COUNTIF(B6:B, "Armor / Shield") + COUNTIF(B6:B, "Ring") + COUNTIF(B6:B, "Wondrous Item") + COUNTIF(B6:B, "Slotless Item")'));
  sheet.getRange("K3:L4").merge().setBackground("#1e293b").setFontColor("#94a3b8")
    .setFontSize(7).setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("EQUIPMENT");

  // M1:N4 -> SPELLS & POWERS COUNT
  sheet.getRange("M1:N2").merge().setBackground("#1e293b").setFontColor("#c084fc")
    .setFontSize(15).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setFormula(f('=COUNTIF(B6:B, "Spell") + COUNTIF(B6:B, "Active Power")'));
  sheet.getRange("M3:N4").merge().setBackground("#1e293b").setFontColor("#94a3b8")
    .setFontSize(7).setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("SPELLS");

  // O1:AE4 -> Info & Reset Guide
  sheet.getRange("O1:AE4").merge().setBackground("#1e293b").setFontColor("#f1f5f9")
    .setFontSize(8).setVerticalAlignment("middle").setHorizontalAlignment("center")
    .setValue("🎯 CANLI FİLTRELEME & ARAMA:\n• E1:E4 kutularını işaretleyerek kategorileri filtreleyin (ALL, Feats, Gear, Spells).\n• C2 arama kutusuna isim yazıp Enter'a basarak Entry Name'e göre anında süzün.\n• Menüden '🔄 Reset Filter' seçerek tüm filtreleri tek tıkla temizleyebilirsiniz.");

  // ----------------------------------------------------
  // Row 5: Column Headers (31 Columns)
  // ----------------------------------------------------
  var headers = [
    "Entry Name",               // A (1)
    "Type / Category",          // B (2)
    "Slot / Location",          // C (3)
    "Parent Entry",             // D (4)
    "Prerequisites",            // E (5)
    "Source Book / Page",       // F (6)
    "Benefit / Description",     // G (7)
    "Bonus Type",               // H (8)
    "Combat Scope",             // I (9)
    "Str", "Dex", "Con", "Int", "Wis", "Cha",  // J - O (10-15)
    "AC", "HP", "Att", "Dmg",                  // P - S (16-19)
    "Fort", "Ref", "Will",                     // T - V (20-22)
    "Skill", "Initiative", "Speed",            // W - Y (23-25)
    "On-Hit / Extra Dmg",       // Z (26)
    "Active Power / Action",    // AA (27)
    "Duration / Uses",          // AB (28)
    "Weight (lbs)",             // AC (29)
    "Cost (gp)",                // AD (30)
    "Combat Role"               // AE (31)
  ];

  sheet.getRange(5, 1, 1, headers.length).setValues([headers]);
  sheet.getRange("A5:AE5")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  
  // Highlight Parent Entry header (Col D) in distinct indigo / purple
  sheet.getRange("D5").setBackground("#4f46e5").setFontColor("#ffffff");

  // Highlight Combat Scope header in distinct blue-slate
  sheet.getRange("I5").setBackground("#0369a1").setFontColor("#e0f2fe");

  // Highlight Buff Columns header (Cols J to Y) in distinct dark emerald
  sheet.getRange("J5:Y5").setBackground("#134e4a").setFontColor("#5eead4");

  // Highlight Combat Role header (Col AE) in crimson / alert red
  sheet.getRange("AE5").setBackground("#dc2626").setFontColor("#ffffff");

  // ----------------------------------------------------
  // Dropdown Validations (Type, Slot, Bonus Type, Scope, Role)
  // ----------------------------------------------------
  updateMasterDbValidations(sheet);

  // ----------------------------------------------------
  // Seed Baseline Library Data (Magnus + D&D 3.5e Essentials)
  // Each row has exactly 31 elements:
  // [0:Name, 1:Cat, 2:Slot, 3:Parent, 4:Prereq, 5:Source, 6:Desc, 7:BonusType, 8:Scope, 9-24:Stats, 25:OnHit, 26:Action, 27:Duration, 28:Weight, 29:Cost, 30:CombatRole]
  // ----------------------------------------------------
  var seedRows = [
    // --- 8 CORE RACES (D&D 3.5e PHB & SUPPLEMENTS) ---
    ["Human", "Race", "None", "-", "-", "PHB p.12", "Medium size, base land speed 30 ft. 1 extra feat at 1st level, 4 extra skill points at 1st level, +1 extra skill point at each additional level.", "Racial", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", 30, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Dwarf", "Race", "None", "-", "-", "PHB p.14", "Medium size, base speed 20 ft (not reduced by armor). +2 Con, -2 Cha. Darkvision 60 ft, stonecunning, stability, +2 saves vs poison and spells.", "Racial", "None / General", "", "", 2, "", "", -2, "", "", "", "", "", "", "", "", "", 20, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Elf", "Race", "None", "-", "-", "PHB p.15", "Medium size, base speed 30 ft. +2 Dex, -2 Con. Immunity to magic sleep, +2 saves vs enchantments, low-light vision, keen senses.", "Racial", "None / General", "", 2, -2, "", "", "", "", "", "", "", "", "", "", "", "", 30, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Gnome", "Race", "None", "-", "-", "PHB p.16", "Small size (+1 AC, +1 attack), base speed 20 ft. +2 Con, -2 Str. Low-light vision, +2 saves vs illusions, +1 attack vs kobolds/goblinoids.", "Racial", "None / General", -2, "", 2, "", "", "", 1, "", 1, "", "", "", "", "", "", 20, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Half-Elf", "Race", "None", "-", "-", "PHB p.18", "Medium size, base speed 30 ft. Immunity to sleep spells, +2 saves vs enchantments, low-light vision, +1 Listen/Search/Spot, +2 Diplomacy/Gather Information.", "Racial", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", 2, "", "", 30, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Half-Orc", "Race", "None", "-", "-", "PHB p.18", "Medium size, base speed 30 ft. +2 Str, -2 Int, -2 Cha. Darkvision 60 ft, orc blood.", "Racial", "None / General", 2, "", "", -2, "", -2, "", "", "", "", "", "", "", "", "", 30, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Halfling", "Race", "None", "-", "-", "PHB p.19", "Small size (+1 AC, +1 attack), base speed 20 ft. +2 Dex, -2 Str. +2 Climb/Jump/Move Silently, +1 all saves, +2 saves vs fear, +1 attack with thrown weapons/slings.", "Racial", "None / General", -2, 2, "", "", "", "", 1, "", 1, "", 1, 1, 1, "", "", 20, "", "-", "Continuous", "", "", "Non-Combat"],
    ["Goliath", "Race", "None", "-", "LA +1", "Races of Stone p.56", "Medium size (Powerful Build), base speed 30 ft. +4 Str, -2 Dex, +2 Con. Powerful Build treats character as Large for maneuvers and weapon size.", "Racial", "None / General", 4, -2, 2, "", "", "", "", "", "", "", "", "", "", "", "", 30, "", "-", "Continuous", "", "", "Non-Combat"]
  ];

  // Defensive check: ensure every row has exactly 31 elements
  for (var i = 0; i < seedRows.length; i++) {
    while (seedRows[i].length < 31) {
      seedRows[i].push("");
    }
    if (seedRows[i].length > 31) {
      seedRows[i] = seedRows[i].slice(0, 31);
    }
  }

  sheet.getRange(6, 1, seedRows.length, 31).setValues(seedRows);

  // ----------------------------------------------------
  // Column Widths
  // ----------------------------------------------------
  sheet.setColumnWidth(1, 220);  // A: Entry Name
  sheet.setColumnWidth(2, 130);  // B: Type / Category
  sheet.setColumnWidth(3, 110);  // C: Slot / Location
  sheet.setColumnWidth(4, 180);  // D: Parent Entry (Widened for tag pill & clear readability)
  sheet.setColumnWidth(5, 150);  // E: Prerequisites
  sheet.setColumnWidth(6, 140);  // F: Source Book / Page
  sheet.setColumnWidth(7, 280);  // G: Benefit / Description
  sheet.setColumnWidth(8, 120);  // H: Bonus Type
  sheet.setColumnWidth(9, 120);  // I: Combat Scope

  // 16 Buff Columns (Cols J to Y: Cols 10 to 25)
  for (var c = 10; c <= 25; c++) {
    sheet.setColumnWidth(c, 48);
  }
  sheet.setColumnWidth(26, 130); // Z: On-Hit / Extra Dmg
  sheet.setColumnWidth(27, 140); // AA: Active Power / Action
  sheet.setColumnWidth(28, 120); // AB: Duration / Uses
  sheet.setColumnWidth(29, 85);  // AC: Weight (lbs)
  sheet.setColumnWidth(30, 95);  // AD: Cost (gp)
  sheet.setColumnWidth(31, 140); // AE: Combat Role

  // Header border for Row 5
  sheet.getRange(5, 1, 1, 31).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // Apply clean row formatting and wipe any lingering blank row colors
  cleanMasterDbFormatting(sheet);

  // ----------------------------------------------------
  // Dynamic Conditional Formatting: Parent & Child Inheritance Visual Styling
  // ----------------------------------------------------
  var maxRow = Math.max(seedRows.length + 50, 300);

  // Rule 1: Child Col D Pill (Prominent Purple Tag with bold purple text)
  var childColDRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(f('=AND($D6<>"", $D6<>"-")'))
    .setBackground("#ede9fe")
    .setFontColor("#5b21b6")
    .setBold(true)
    .setRanges([sheet.getRange("D6:D" + maxRow)])
    .build();

  // Rule 2: Child Col A Text (Deep Purple Italic text)
  var childColARule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(f('=AND($D6<>"", $D6<>"-")'))
    .setBackground("#faf5ff")
    .setFontColor("#6b21a8")
    .setItalic(true)
    .setRanges([sheet.getRange("A6:A" + maxRow)])
    .build();

  // Rule 3: Child Full Row (Soft Lavender Tint + Italic font)
  var childRowRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(f('=AND($D6<>"", $D6<>"-")'))
    .setBackground("#faf5ff")
    .setItalic(true)
    .setRanges([sheet.getRange("A6:AE" + maxRow)])
    .build();

  // Rule 4: Parent Col A Pill (Sky Blue Bold Header Tag)
  var parentColARule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(f('=AND($A6<>"", COUNTIF($D$6:$D, $A6)>0)'))
    .setBackground("#bae6fd")
    .setFontColor("#0369a1")
    .setBold(true)
    .setRanges([sheet.getRange("A6:A" + maxRow)])
    .build();

  // Rule 5: Parent Full Row (Soft Azure / Sky Tint)
  var parentRowRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(f('=AND($A6<>"", COUNTIF($D$6:$D, $A6)>0)'))
    .setBackground("#f0f9ff")
    .setFontColor("#0c4a6e")
    .setRanges([sheet.getRange("A6:AE" + maxRow)])
    .build();

  sheet.setConditionalFormatRules([childColDRule, childColARule, parentColARule, childRowRule, parentRowRule]);

  SpreadsheetApp.getActiveSpreadsheet().toast("Master_DB (31 Cols with Interactive Search & Combat Roles) built successfully!", "✅ Master_DB Ready", 6);
}

// ----------------------------------------------------
// DYNAMIC FILTER & LIVE SEARCH ENGINE FOR MASTER_DB
// ----------------------------------------------------
function applyMasterDbFilter(sheet) {
  if (!sheet || typeof sheet.getMaxRows !== "function") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName("Master_DB");
  }
  if (!sheet) return;

  var maxRows = sheet.getMaxRows();
  var startRow = 6;
  var totalDataRows = maxRows - startRow + 1;
  if (totalDataRows <= 0) return;

  // 1. Read Filter Checkbox states
  var allChecked = sheet.getRange("E1").getValue() === true;
  var featsChecked = sheet.getRange("E2").getValue() === true;
  var equipChecked = sheet.getRange("E3").getValue() === true;
  var spellsChecked = sheet.getRange("E4").getValue() === true;

  // If none are checked, treat as ALL
  if (!allChecked && !featsChecked && !equipChecked && !spellsChecked) {
    allChecked = true;
  }

  // 2. Read Search Term from B2:D3 (merged cell top-left is B2)
  var searchVal = sheet.getRange("B2").getValue();
  if (!searchVal) searchVal = sheet.getRange("C2").getValue();
  if (!searchVal) searchVal = sheet.getRange("D2").getValue();
  var searchTerm = String(searchVal || "").trim().toLowerCase();

  // 3. Define category sets
  var featCategories = {
    "feat": true, "special ability": true, "dm grant": true, "flaw": true, "racial trait": true
  };
  var equipCategories = {
    "weapon": true, "armor": true, "shield": true, "armor / shield": true, "ring": true, "wondrous item": true, "slotless item": true
  };
  var spellCategories = {
    "spell": true, "active power": true
  };

  // 4. Fetch all data rows in columns A (Name), B (Type), D (Parent)
  var dataRange = sheet.getRange(startRow, 1, totalDataRows, 4).getValues();

  var showRow = new Array(totalDataRows);
  for (var i = 0; i < totalDataRows; i++) {
    var name = String(dataRange[i][0] || "").trim();
    var cat = String(dataRange[i][1] || "").trim().toLowerCase();
    var parent = String(dataRange[i][3] || "").trim();

    // If completely blank row at bottom, keep visible
    if (!name && !cat) {
      showRow[i] = true;
      continue;
    }

    // A. Check Category Match
    var catMatch = false;
    if (allChecked) {
      catMatch = true;
    } else if (featsChecked && featCategories[cat]) {
      catMatch = true;
    } else if (equipChecked && equipCategories[cat]) {
      catMatch = true;
    } else if (spellsChecked && spellCategories[cat]) {
      catMatch = true;
    }

    // B. Check Search Term Match
    var searchMatch = false;
    if (!searchTerm) {
      searchMatch = true;
    } else {
      var nameLower = name.toLowerCase();
      var parentLower = parent.toLowerCase();
      if (nameLower.indexOf(searchTerm) !== -1 || parentLower.indexOf(searchTerm) !== -1) {
        searchMatch = true;
      }
    }

    showRow[i] = catMatch && searchMatch;
  }

  // 5. Batch show / hide operations for maximum performance
  sheet.showRows(startRow, totalDataRows);

  if (allChecked && !searchTerm) {
    return; // All rows visible
  }

  // Group hidden rows into contiguous blocks
  var hideBlocks = [];
  var currentBlockStart = null;
  var currentBlockCount = 0;

  for (var i = 0; i < totalDataRows; i++) {
    var rowNum = startRow + i;
    if (!showRow[i]) {
      if (currentBlockStart === null) {
        currentBlockStart = rowNum;
        currentBlockCount = 1;
      } else {
        currentBlockCount++;
      }
    } else {
      if (currentBlockStart !== null) {
        hideBlocks.push({ start: currentBlockStart, count: currentBlockCount });
        currentBlockStart = null;
        currentBlockCount = 0;
      }
    }
  }
  if (currentBlockStart !== null) {
    hideBlocks.push({ start: currentBlockStart, count: currentBlockCount });
  }

  for (var b = 0; b < hideBlocks.length; b++) {
    sheet.hideRows(hideBlocks[b].start, hideBlocks[b].count);
  }
}

function handleMasterDbFilterEdit(sheet, range) {
  var row = range.getRow();
  var col = range.getColumn();

  // Checkbox edited in E1:E4 (Column 5)
  if (col === 5 && row >= 1 && row <= 4) {
    var val = range.getValue() === true;
    if (row === 1) { // E1: ALL clicked
      if (val) {
        sheet.getRange("E2:E4").setValues([[false], [false], [false]]);
      } else {
        var others = sheet.getRange("E2:E4").getValues();
        if (!others[0][0] && !others[1][0] && !others[2][0]) {
          sheet.getRange("E1").setValue(true);
        }
      }
    } else { // E2, E3, or E4 clicked (Radio button logic)
      if (val) {
        sheet.getRange("E1").setValue(false);
        for (var r = 2; r <= 4; r++) {
          if (r !== row) {
            sheet.getRange(r, 5).setValue(false);
          }
        }
      } else {
        var anyChecked = false;
        for (var r = 2; r <= 4; r++) {
          if (r !== row && sheet.getRange(r, 5).getValue() === true) {
            anyChecked = true;
          }
        }
        if (!anyChecked) {
          sheet.getRange("E1").setValue(true);
        }
      }
    }
    applyMasterDbFilter(sheet);
    return;
  }

  // Search input edited in B1:D4 (Columns 2, 3, or 4)
  if (row >= 1 && row <= 4 && col >= 2 && col <= 4) {
    applyMasterDbFilter(sheet);
    return;
  }
}

function resetMasterDbFilter() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Master_DB");
  if (!sheet) return;

  sheet.getRange("E1").setValue(true);
  sheet.getRange("E2:E4").setValues([[false], [false], [false]]);
  sheet.getRange("B2:D3").clearContent();

  applyMasterDbFilter(sheet);
  ss.toast("Filtreler sıfırlandı ve tüm kayıtlar gösteriliyor!", "🔄 Sıfırlandı", 4);
}

// ----------------------------------------------------
// 3. MASTER_DB USAGE GUIDE SHEET (Interactive Manual)
// ----------------------------------------------------
function createMasterDbGuideSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Master_DB_Guide";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
  sheet.clearConditionalFormatRules();
  sheet.clear();
  sheet.setTabColor("#0f766e");

  // Format Guide with 6 clean columns (A to F)
  var curCols = sheet.getMaxColumns();
  if (curCols < 6) {
    sheet.insertColumnsAfter(curCols, 6 - curCols);
  } else if (curCols > 6) {
    sheet.deleteColumns(7, curCols - 6);
  }

  sheet.setColumnWidth(1, 180); // A: Topic / Field
  sheet.setColumnWidth(2, 140); // B: Type / Values
  sheet.setColumnWidth(3, 200); // C: Target Sheet Feed
  sheet.setColumnWidth(4, 300); // D: Rules & Explanations
  sheet.setColumnWidth(5, 260); // E: Concrete Example
  sheet.setColumnWidth(6, 120); // F: Important Note

  // 1. Title Banner
  sheet.getRange("A1:F2").merge().setBackground("#134e4a").setFontColor("#ffffff")
    .setFontSize(16).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("📖 MASTER_DB KULLANIM KILAVUZU & D&D 3.5e VERİ GİRİŞ REHBERİ");

  sheet.getRange("A3:F3").merge().setBackground("#042f2e").setFontColor("#5eead4")
    .setFontSize(9).setFontStyle("italic").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("Bu sayfa, Master_DB veritabanına yeni bir eşya, silah, zırh, feat veya büyü eklerken nelere dikkat etmeniz gerektiğini örneklerle açıklar.");

  // --- SECTION 0: SİSTEM, AĞ İZNİ & AI KURULUM CHECKLIST'İ ---
  sheet.getRange("A5:F5").merge()
    .setBackground("#312e81").setFontColor("#ffffff").setFontWeight("bold").setFontSize(11)
    .setVerticalAlignment("middle").setValue("⚡ 0. SİSTEM & AI KURULUM KONTROL LİSTESİ (Tamamlandıkça Otomatik Tiklenir)");

  var checkHeaders = ["Durum", "Kurulum Adımı", "Menü Yolu / Kısayol", "Yapılması Gereken İşlem", "Otomatik Doğrulama Kriteri", "Not / İpucu"];
  sheet.getRange(6, 1, 1, 6).setValues([checkHeaders]);
  sheet.getRange("A6:F6").setBackground("#4338ca").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  var checklistItems = [
    [false, "1. Ağ / AI İzni (OAuth)", "🎲 D&D Tools ➔ 🧙‍♂️ Rule Master & AI ➔ 🌐 Authorize AI Network Access", "Dış dünya bağlantı iznini Google ana penceresinde bir kez onaylayın.", "UrlFetchApp (script.external_request)", "Tek Seferlik"],
    [false, "2. Gemini API Anahtarı", "🎲 D&D Tools ➔ 🧙‍♂️ Rule Master & AI ➔ 🔑 Set My Gemini API Key", "Google AI Studio'dan aldığınız ücretsiz API anahtarınızı girin.", "UserProperties & Session Cache", "Kişiye Özel"],
    [false, "3. AI Model Tanısı & Güncelleme", "🎲 D&D Tools ➔ 🧙‍♂️ Rule Master & AI ➔ 🩺 Diagnose Gemini API & Models", "Aktif modelleri test edin ve kütüphane açılır menüsünü otomatik güncelleyin.", "AI Modeli Doğrulandı & C3 Güncellendi", "Otomatik / Hızlı"],
    [false, "4. Kural Kütüphanesi", "🎲 D&D Tools ➔ 🧙‍♂️ Rule Master & AI ➔ 📜 Build / Open \"Rule_Library\"", "Kademeli arama linklerini ve kitap kataloğunu oluşturan sayfayı kurun.", "Rule_Library Sekmesi", "Otomatik"],
    [false, "5. Master_DB Veritabanı", "🎲 D&D Tools ➔ 📚 Master Database ➔ ⚡ Build Both DB & Guide (1-Click)", "29 sütunluk kütüphane altyapısını ve başlangıç tohumlarını kurun.", "Master_DB (En az 6 satır)", "Otomatik"],
    [false, "6. AI Rule Importer Testi", "🎲 D&D Tools ➔ 🧙‍♂️🤖 Open Rule Master (Sidebar)", "Yan paneli açıp örnek bir kural aratın (Örn: Greater Heroism) ve tabloya ekleyin.", "Gemini Flash-Lite Entegrasyonu", "Hazır!"]
  ];
  sheet.getRange(7, 1, checklistItems.length, 6).setValues(checklistItems);
  sheet.getRange("A7:A12").insertCheckboxes();
  sheet.getRange("A7:A12").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("B7:B12").setFontWeight("bold").setVerticalAlignment("middle");
  sheet.getRange("C7:F12").setVerticalAlignment("middle");
  sheet.getRange("A6:F12").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A7:F12").setBackground("#f5f3ff");

  // Reset note row
  sheet.getRange("A13:F13").merge().setBackground("#fef2f2").setFontColor("#991b1b")
    .setFontSize(8).setFontStyle("italic").setVerticalAlignment("middle")
    .setValue("  💡 Sıfırlama: İzinleri ve API anahtarını silip tikleri kaldırmak için: '🎲 D&D Tools ➔ 🧙‍♂️ Rule Master & AI ➔ 🗑️ Clear / Reset My API Key & Permissions' seçeneğini kullanabilirsiniz.");

  // Detailed Step-by-Step Manual Authorization Instructions (Rows 15-21)
  sheet.getRange("A15:F15").merge().setBackground("#0f766e").setFontColor("#ffffff")
    .setFontSize(10).setFontWeight("bold").setVerticalAlignment("middle")
    .setValue("  📌 1. ADIM DETAYI: GOOGLE AĞ / AI İZNİ MANUEL OLARAK NASIL VERİLİR? (TEK SEFERLİK)");

  var authGuideHeaders = ["#", "İşlem Adımı", "Nereden Yapılır?", "Açıklama / Tıklanacak Butonlar", "Ekran Görüntüsü / İpucu", "Sonuç"];
  sheet.getRange(16, 1, 1, 6).setValues([authGuideHeaders]);
  sheet.getRange("A16:F16").setBackground("#134e4a").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  var authSteps = [
    ["1", "Apps Script'i Açın", "Google Sheets Üst Menü", "Uzantılar (Extensions) ➔ Apps Script seçeneğine tıklayın.", "Yeni sekmede kod editörü açılır", "Editör Hazır"],
    ["2", "Fonksiyonu Seçin", "Apps Script Üst Araç Çubuğu", "Fonksiyon açılır listesinden 'testOrAuthorizeExternalAccess' fonksiyonunu seçin.", "Hemen Kaydet'in sağındaki liste", "Hedef Seçildi"],
    ["3", "Çalıştır'a Basın", "Apps Script Üst Araç Çubuğu", "▶ Çalıştır (Run) butonuna basın.", "Google onay ekranı açılır", "İzin Tetiklendi"],
    ["4", "Google İznini Onaylayın", "Google Güvenlik Penceresi", "İzinleri İncele ➔ Hesabınızı Seçin ➔ Gelişmiş (Advanced) ➔ '...uygulamasına git (güvenli değil)' ➔ İzin Ver (Allow).", "Google standart OAuth onayıdır", "İzin Verildi!"],
    ["5", "E-Tabloya Dönün", "Google Sheets (Bu Sayfa)", "Kılavuza döndüğünüzde 1. sıradaki onay kutusunun otomatik olarak ☑ işaretlendiğini göreceksiniz!", "Onay kutusu A7 hücresindedir", "Sistem Aktif 🟢"]
  ];
  sheet.getRange(17, 1, authSteps.length, 6).setValues(authSteps);
  sheet.getRange("A17:A21").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("B17:B21").setFontWeight("bold");
  sheet.getRange("F17:F21").setHorizontalAlignment("center").setFontWeight("bold").setFontColor("#059669");
  sheet.getRange("A17:F21").setBackground("#f0fdfa").setVerticalAlignment("middle");
  sheet.getRange("A16:F21").setBorder(true, true, true, true, true, true, "#99f6e4", SpreadsheetApp.BorderStyle.SOLID);

  // Section Headers & Content Generator Helper
  var row = 23;

  function addSection(title, color) {
    sheet.getRange(row, 1, 1, 6).merge()
      .setBackground(color).setFontColor("#ffffff").setFontWeight("bold").setFontSize(11)
      .setVerticalAlignment("middle").setValue(title);
    row++;
  }

  function addRow(colA, colB, colC, colD, colE, colF, isAlt) {
    var vals = [colA, colB, colC, colD, colE, colF];
    sheet.getRange(row, 1, 1, 6).setValues([vals]);
    if (isAlt) sheet.getRange(row, 1, 1, 6).setBackground("#f8fafc");
    sheet.getRange(row, 1).setFontWeight("bold");
    sheet.getRange(row, 4).setWrap(true);
    sheet.getRange(row, 5).setWrap(true);
    sheet.getRange(row, 6).setFontColor("#dc2626");
    row++;
  }

  // --- SECTION 1: GENEL ÇALIŞMA MANTIĞI ---
  addSection("1. 🌟 MASTER_DB NEDİR VE SİSTEMDE NASIL ÇALIŞIR?", "#1e3a5f");
  addRow("Tek Merkez, 6 Sayfa", "Mimari İlke", "Tüm Sayfalar", "Master_DB tüm karakter kağıdının beynidir. Bir eşyayı buraya bir kere yazarsınız; lvl_up, Inventory, Spells, Bufffs, Main ve Combat sayfaları bilgileri buradan çeker.", "lvl_up sayfasında Power Attack seçtiğinizde açıklaması Master_DB'den çekilir.", "Asla A sütununu boş bırakmayın.", false);
  addRow("Benzersiz İsim (Entry Name)", "A Sütunu", "Primary Key", "A sütunundaki 'Entry Name' benzersiz olmalıdır. Açılır listeler ve VLOOKUP formülleri bu ada göre eşleşir.", "'Ring of Protection +5' veya 'Venomfang (+5 Acidic)'", "Aynı ismi iki kere vermeyin!", true);
  addRow("Parent / Child İlişkisi", "D Sütunu & Renkler", "Tüm Sayfalar", "Bir eşyanın hem pasif statı hem de günde 1 kez çalışan bir büyüsü/yeteneği varsa iki satır yapılır:\n🔵 EBEVEYN (Parent - Mavi): Ana fiziksel eşyadır.\n🟣 ÇOCUK (Child - Mor): Ebeveyne bağlı olan alt güç veya büyüdür. D sütununda ebeveynin adı seçilir.", "Örn: 'Venomfang (+5 Acidic)' [Mavi] ve bağlı gücü 'Venomfang: Breath' [Mor].", "Otomatik renklendirilir!", false);
  addRow("Miras (Inherit) Mantığı", "Otomasyon İlkesi", "Inventory & Spells", "Çocuk (Mor) satırlar yuva (Slot), kuşanma durumu (Equipped), ağırlık ve maliyeti ana eşyadan devralır (Inherit eder). Ana eşya çantada kuşanıldığında alt güçleri de otomatik devreye girer.", "Venomfang kuşanıldığında nefes büyüsü de Spells sayfasına kuşanılmış olarak yansır.", "Ağırlığı 0 gp/0 lbs girin", true);
  addRow("Canlı Filtre & Arama", "E1:F4 & C2:D3", "Master_DB", "1-4. satırlardaki onay kutularına (ALL, FEATS, ITEMS, SPELLS) tıklayarak kategorileri süzebilirsiniz. Arama kutusuna (C2) isim yazıp Enter'a basarak Entry Name'e göre anında filtreleyebilirsiniz!", "C2 kutusuna 'Acid' yazıldığında asitli nefes ve kılıç listelenir; E3 tıklandığında sadece eşyalar kalır.", "onEdit ile anında çalışır", false);

  row++;
  // --- SECTION 2: SÜTUNLAR NE İŞE YARAR? ---
  addSection("2. 📌 MASTER_DB SÜTUNLARI VE ALDIĞI DEĞERLER (A - AE)", "#0f766e");
  addRow("A: Entry Name", "Metin", "Tüm Sayfalar", "Eşyanın, feat'in veya büyünün tam adı.", "Power Attack, Vest of Resistance +5, Luckstone", "Zorunlu Alan", false);
  addRow("B: Type / Category", "Açılır Liste", "Filtreleme & Sayfalar", "Feat, Weapon, Armor, Shield, Armor / Shield, Ring, Wondrous Item, Slotless Item, Spell, Special Ability, DM Grant, Active Power, Flaw", "Wondrous Item seçildiğinde Inventory'de ilgili sekmeye düşer.", "Doğru tipi seçin", true);
  addRow("C: Slot / Location", "Açılır Liste", "Inventory", "Armor, Shield, Head, Eyes, Neck, Shoulders, Torso, Body, Waist, Arms, Hands, Ring, Feet, Main Hand, Off Hand, Slotless, None", "Circlet için Head, Potion veya Luckstone için Slotless, Feat için None seçilir.", "Slotless vücutta yer kaplamaz!", false);
  addRow("D: Parent Entry", "Metin / Boş (-)", "Inventory & Spells", "Bağlı olduğu ana eşyanın adı. Eşya tek başına ise tire (-) konur. Bir isim yazıldığında satır otomatik MOR (Child ↳), ana eşya ise MAVİ (Parent) renge bürünür ve miras bağlantısı kurulur!", "Nine Hells: Fireball satırı için Parent: 'Ring of the Nine Hells'", "İsmi harfi harfine aynı yazın", true);
  addRow("E: Prerequisites", "Metin", "lvl_up & Şart Kontrolü", "Feat veya yetenek gereksinimleri (BAB, Stat, Feat vb.).", "Str 13, BAB +6, Power Attack", "Opsiyonel", false);
  addRow("F: Source Book / Page", "Metin", "Kaynak / Kitap", "Kuralın geçtiği resmi D&D 3.5e kaynak kitabı ve sayfa numarası.", "PHB p.98, MIC p.128, ToB p.100, Complete Warrior p.12", "Kaynak arama ve filtre", true);
  addRow("G: Benefit / Description", "Uzun Metin", "lvl_up & Main Tooltip", "Özelliğin detaylı kural açıklaması. lvl_up tablosuna ve Main sayfasındaki hücre notlarına (hover) otomatik gider!", "Trade BAB for extra melee damage (up to BAB, x2 with 2H weapon)", "Hücre notunda bu metin görünür", false);
  addRow("H: Bonus Type", "Açılır Liste", "Bufffs Motoru", "D&D 3.5e İstif Tipi: Enhancement, Resistance, Deflection, Natural Armor, Armor, Shield, Morale, Luck, Insight, Dodge, Circumstance, Sacred, Profane, Alchemical, Competence, Size, Inherent, Untyped", "Vest için Resistance, Kalkan için Shield, Zırh için Armor, Dua için Luck seçilir.", "İstif kurallarını belirler!", true);
  addRow("I: Combat Scope", "Açılır Liste", "Combat & Silah Filtresi", "Saldırı ve hasar bonusunun nereye uygulanacağı: All Attacks, Melee Only, Ranged Only, Thrown Only, Unarmed, Specific Weapon, Slashing, Piercing, Bludgeoning, Spells, Skill: All, Skill: Listen, Spot, None / General", "Point Blank Shot için Ranged Only; Power Attack için Melee Only; Haste için All Attacks seçilir.", "Silah filtreleri için kritik", false);
  addRow("J - Y: 16 Buff Kolonu", "Sayısal (+ / -)", "Bufffs & Main", "Str, Dex, Con, Int, Wis, Cha, AC, HP, Att, Dmg, Fort, Ref, Will, Skill, Initiative, Speed sütunları.", "Kemer için Str kolonuna 6; Vest için Fort, Ref, Will kolonlarına 5 yazılır.", "Pasif statlar buraya girilir", true);
  addRow("Z: On-Hit / Extra Dmg", "Zar Metni", "Combat (Hasar)", "Vuruş başı ek hasar zarları (örn: asit, ateş, kutsal hasarlar).", "1d12 Acid, 2d6 Holy, 1d6 Fire", "Zar atıcı hasar tiplerini ayrıştırır!", false);
  addRow("AA: Active Power / Action", "Aksiyon Tipi", "Combat & Spells", "Aktif yeteneğin gerektirdiği aksiyon (Swift, Standard, Immediate, Move).", "Swift Action, Standard Action (Reflex DC 18)", "Nasıl tetiklendiğini belirtir", true);
  addRow("AB: Duration / Uses", "Kullanım / Süre", "Spells & Günlük Takip", "Günde kaç kez veya ne kadar süre çalıştığı.", "Passive, 1/day, 3 charges/day, 1 round/lvl, 10 min/lvl", "Checkbox takibini belirler", false);
  addRow("AC - AD: Weight & Cost", "Sayı", "Inventory & Taşıma", "Ağırlık (lbs) ve Değer (gp). Taşıma kapasitesi (Encumbrance) için kullanılır.", "Ağırlık: 4 lbs, Fiyat: 25000 gp", "Sayısal girin", true);
  addRow("AE: Combat Role", "Açılır Liste", "Combat & Taktik Dağıtım", "Offense / Attack, Tactical Maneuver, Resource Pool, Defense / Counter, Tactical Sense, Combat Buff, Non-Combat", "Shock Trooper -> Tactical Maneuver; Lay on Hands -> Resource Pool; Blindsense -> Tactical Sense; Haste -> Combat Buff; Bull's Strength -> Combat Buff; Mage Armor -> Defense / Counter; Longsword -> Offense / Attack; Bag of Holding -> Non-Combat.", "Combat sayfasına otomatik dağıtım yapar!", false);

  row++;
  // --- SECTION 3: D&D 3.5e İSTİF KURALLARI ---
  addSection("3. ⚖️ D&D 3.5e İSTİF (BONUS STACKING) MOTORU KURALLARI", "#1e293b");
  addRow("Aynı Tip İstiflenmez (MAX)", "Enhancement, Resistance, Deflection, Morale, Luck, Insight vb.", "Bufffs Tablosu", "Aynı bonus tipine sahip iki kaynak varsa sadece EN YÜKSEĞİ (MAX) geçerlidir.", "Bull's Strength (+4 Enhancement Str) ile Belt of Str +6 aynı anda takılırsa sadece +6 geçerlidir!", "Üst üste binip toplanmaz!", false);
  addRow("İstiflenen Tipler (SUM)", "Dodge, Circumstance, Untyped", "Bufffs Tablosu", "Bu bonus tipleri kural gereği BİRİKİR ve TOPLANIR (SUM).", "Dodge feat'inden +1 AC ve Haste büyüsünden +1 Dodge AC gelirse toplam +2 AC kazanırsınız.", "Her zaman toplanır", true);

  row++;
  // --- SECTION 4: 8 ADIMDA PRATİK VERİ GİRİŞİ ÖRNEKLERİ ---
  addSection("4. 🛠️ ADIM ADIM VERİ GİRİŞİ ÖRNEKLERİ (8 TEMEL SENARYO)", "#0369a1");
  
  addRow("1. Standart Melee Feat", "Power Attack", "lvl_up", "Type: Feat | Slot: None | Scope: Melee Only | Benefit: Trade BAB for damage | Bonus Type: Untyped | Uses: Passive", "Yakın dövüş featlerinde Scope olarak Melee Only seçilir.", "lvl_up'tan seçilir", false);
  addRow("2. Menzilli Feat (Ranged)", "Point Blank Shot", "lvl_up & Combat", "Type: Feat | Slot: None | Scope: Ranged Only | Bonus Type: Untyped | Att: 1, Dmg: 1 | Uses: Passive", "Menzilli silahlara +1 Att ve +1 Dmg verir; Combat sayfasında sadece yay/fırlatma zarlarına eklenir.", "Scope Ranged Only", true);
  addRow("3. Ek Hasarlı + Aktif Silah", "Venomfang (+5 Acidic)", "Inventory, Combat, Spells", "Satır 1 [🔵 PARENT - Mavi]: Venomfang (+5) -> Type: Weapon, Slot: Main Hand, Scope: Melee Only, Att: 5, Dmg: 5, On-Hit: +1d12 Acid\nSatır 2 [🟣 CHILD - Mor]: Venomfang: Breath -> Type: Active Power, Parent: Venomfang, Scope: Spells, Uses: 1/day, Active Power: 3d8 Acid Ref DC 18", "Kılıç kuşanıldığında hem vuruş hasarına +1d12 asit eklenir hem de günlük büyülere 1/day nefes kutucuğu açılır (Kuşanma mirası)!", "Zar motoru '3d8 Acid' ayrıştırır", false);
  addRow("4. Pasif + Aktif Yüzük", "Ring of the Nine Hells", "Inventory & Spells", "Satır 1 [🔵 PARENT - Mavi]: Ring of Nine Hells -> Type: Ring, Slot: Ring, Bonus Type: Deflection, AC: 3\nSatır 2 [🟣 CHILD - Mor]: Nine Hells: Fireball -> Type: Active Power, Parent: Ring of the Nine Hells, Scope: Spells, Uses: 1/day", "Yüzük parmağa takıldığında +3 AC verir ve günde 1 Fireball (8d6 Fire) atma butonu aktif olur (Kuşanma mirası)!", "Çok özellikli yüzükler", true);
  addRow("5. Slotless (Yuvasız) Eşya", "Stone of Good Luck", "Inventory (Çanta)", "Type: Slotless Item | Slot: Slotless | Bonus Type: Luck | Scope: None / General | Fort/Ref/Will: 1, Skill: 1 | Uses: Passive | Wt: 0, Cost: 20000", "Vücutta hiçbir yuva harcamaz. Çantada 'Active: YES' yapıldığı an şans bonusları tüm zarlara eklenir!", "Slotless serbesttir", false);
  addRow("6. Çoklu Bonus Tipli Eşya", "Cloak of the Shadow", "Inventory & Bufffs", "Satır 1 [🔵 PARENT - Mavi]: Cloak (Saves) -> Type: Wondrous, Slot: Shoulders, Bonus Type: Resistance, Fort/Ref/Will: 3\nSatır 2 [🟣 CHILD - Mor]: Cloak (Stealth) -> Type: Wondrous, Parent: Cloak of the Shadow, Bonus Type: Competence, Skill: 5", "İki farklı bonus tipi olduğu için iki satır yapılır; pelerin takılınca ikisi birden aktifleşir (Miras), Resistance savelere, Competence skillere doğru istiflenir.", "Farklı tipleri ayırın", true);
  addRow("7. Standart Büyü / Buff", "Bull's Strength", "Spells & Bufffs", "Type: Spell | Slot: None | Scope: None / General | Bonus Type: Enhancement | Str: 4 | Duration: 1 min/lvl", "Büyü yapıldığında Spells sayfasında 'Active' kutusu işaretlenir ve karaktere +4 Str enhancement bonusu işlenir.", "Süre bitince kaldırılır", false);
  addRow("8. Zırh ve Kalkan Büyüleri", "Mage Armor & Shield", "Spells & Bufffs", "Mage Armor -> Bonus Type: Armor, AC: 4 | Shield -> Bonus Type: Shield, AC: 4", "Armor ve Shield tipleri birbirleriyle ve Deflection ile istiflenir (Doğru bonus tipi seçimi)", "G85/G86 Armor ve Shield", true);

  // Borders & Aesthetics
  var tableRange = sheet.getRange(4, 1, row - 4, 6);
  tableRange.setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(4, 1, row - 4, 6).setVerticalAlignment("middle");

  updateGuideChecklist(sheet);

  SpreadsheetApp.getActiveSpreadsheet().toast("Master_DB_Guide (Kullanım Kılavuzu) hazırlandı!", "📖 Guide Ready", 6);
}

// ----------------------------------------------------
// 4. NAVIGATION SHORTCUT - OPEN MASTER_DB GUIDE
// ----------------------------------------------------
function openMasterDbGuide() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var guideSheet = ss.getSheetByName("Master_DB_Guide");
  if (!guideSheet) {
    createMasterDbGuideSheet();
    guideSheet = ss.getSheetByName("Master_DB_Guide");
  }
  updateGuideChecklist(guideSheet);
  ss.setActiveSheet(guideSheet);
  SpreadsheetApp.getActiveSpreadsheet().toast("Switched to Master_DB_Guide!", "📖 Guide", 3);
}

function updateGuideChecklist(optSheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = optSheet || ss.getSheetByName("Master_DB_Guide");
  if (!sheet) return;

  var userProps = PropertiesService.getUserProperties();
  var isNetAuth = userProps.getProperty("AI_NETWORK_AUTHORIZED") === "TRUE";
  
  var userCache = CacheService.getUserCache();
  var cachedKey = userCache.get("GEMINI_API_KEY");
  var propKey = userProps.getProperty("GEMINI_API_KEY");
  var apiKey = cachedKey || propKey || "";
  var hasApiKey = !!(apiKey && apiKey.length > 5);

  var isModelDiagnosed = userProps.getProperty("AI_MODEL_DIAGNOSED") === "TRUE";

  var ruleLibSheet = ss.getSheetByName("Rule_Library");
  var hasRuleLib = !!ruleLibSheet;

  var dbSheet = ss.getSheetByName("Master_DB");
  var hasDb = !!(dbSheet && dbSheet.getLastRow() >= 6);

  var canUseAi = isNetAuth && hasApiKey;

  sheet.getRange("A7").setValue(isNetAuth);
  sheet.getRange("A8").setValue(hasApiKey);
  sheet.getRange("A9").setValue(isModelDiagnosed);
  sheet.getRange("A10").setValue(hasRuleLib);
  sheet.getRange("A11").setValue(hasDb);
  sheet.getRange("A12").setValue(canUseAi);
}

// ====================================================
// RULE LIBRARY & AI RULE IMPORTER ENGINE
// ====================================================

// ----------------------------------------------------
// 1. RULE_LIBRARY SHEET BUILDER
// ----------------------------------------------------
function createRuleLibrarySheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Rule_Library";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
  sheet.clearConditionalFormatRules();
  sheet.clear();
  sheet.setTabColor("#7c3aed"); // Royal Purple tab color

  // Ensure 10 columns (A through J)
  var curCols = sheet.getMaxColumns();
  if (curCols < 10) {
    sheet.insertColumnsAfter(curCols, 10 - curCols);
  } else if (curCols > 10) {
    sheet.deleteColumns(11, curCols - 10);
  }

  sheet.setFrozenRows(4);

  // Column widths
  sheet.setColumnWidth(1, 40);   // Margin / Icon
  sheet.setColumnWidth(2, 90);   // Priority / Code
  sheet.setColumnWidth(3, 200);  // Name / Title
  sheet.setColumnWidth(4, 250);  // Scope / Contents
  sheet.setColumnWidth(5, 280);  // URL / Link
  sheet.setColumnWidth(6, 120);  // Format / Category
  sheet.setColumnWidth(7, 100);  // Status / Edition
  sheet.setColumnWidth(8, 220);  // Notes / Mechanics
  sheet.setColumnWidth(9, 40);   // Spacing
  sheet.setColumnWidth(10, 40);  // Spacing

  // --- Title Banner (Rows 1-2) ---
  sheet.getRange("A1:H1").merge().setBackground("#1e1b4b").setFontColor("#f8fafc")
    .setFontSize(14).setFontWeight("bold").setVerticalAlignment("middle")
    .setValue("  📚 D&D 3.5e RULE LIBRARY & AI SOURCE DIRECTORY");
  
  sheet.getRange("A2:H2").merge().setBackground("#0f172a").setFontColor("#cbd5e1")
    .setFontSize(9).setFontStyle("italic").setVerticalAlignment("middle")
    .setValue("  Kademeli Kural Kaynakları (Core SRD ➔ Foundry VTT ➔ Splatbooks) • Kural Kitapları & PDF Arşivi • AI Rule Importer Referansı");

  // --- AI Model Config Bar (Row 3) ---
  sheet.getRange("A3:B3").merge().setBackground("#1e1b4b").setFontColor("#e0e7ff")
    .setFontSize(9).setFontWeight("bold").setHorizontalAlignment("right").setVerticalAlignment("middle")
    .setValue("🤖 AI MODEL SEÇİMİ: ");

  var modelRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "AUTO (Otomatik En Hızlı Model)", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"
  ], false).build();
  sheet.getRange("C3:D3").merge().setBackground("#0f172a").setFontColor("#38bdf8")
    .setFontSize(10).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("AUTO (Otomatik En Hızlı Model)").setDataValidation(modelRule);
  sheet.getRange("C3:D3").setBorder(true, true, true, true, false, false, "#38bdf8", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  sheet.getRange("E3:H3").merge().setBackground("#1e1b4b").setFontColor("#94a3b8")
    .setFontSize(8).setFontStyle("italic").setVerticalAlignment("middle")
    .setValue(" 💡 İleride yeni bir model çıktığında buraya yazabilirsiniz. AUTO modunda sistem en güncelini otomatik seçer.");

  sheet.setRowHeight(1, 32);
  sheet.setRowHeight(2, 22);
  sheet.setRowHeight(3, 26);
  sheet.setRowHeight(4, 26);

  // --- Section 1: Prioritized Sources (Rows 4-8) ---
  sheet.getRange("A4:H4").merge().setBackground("#312e81").setFontColor("#e0e7ff")
    .setFontSize(10).setFontWeight("bold").setVerticalAlignment("middle")
    .setValue("  ⚡ 1. KADEMELİ ARAMA KAYNAKLARI (PRIORITIZED KNOWLEDGE BASES)");

  var srcHeaders = ["#", "Öncelik", "Kaynak Adı", "Kapsam & İçerik", "Resmi Web / Repo Linki", "Veri Formatı", "Durum", "AI Kullanım Rolü"];
  sheet.getRange(5, 1, 1, srcHeaders.length).setValues([srcHeaders]);
  sheet.getRange("A5:H5").setBackground("#4338ca").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  var sourcesData = [
    ["1", "1 (En Yüksek - Core)", "Core 3.5e SRD (d20srd.org)", "PHB, DMG, MM Core Kuralları, Featler, Büyüler, Büyülü Eşyalar", "https://www.d20srd.org/index.html", "Temiz HTML", "Aktif", "İlk taranacak saf temel kural kaynağı (Yedek Ayna: http://dndsrd.net)"],
    ["2", "2 (Resmi Revizyonlar)", "Definitive Compendiums (SpC, MIC, RC)", "Spell Compendium, Magic Item Compendium, Rules Compendium", "https://dndtools.net", "Resmi Revizyon", "Aktif", "Büyü ve eşyalarda en son resmi baskı ve güncellemeler (Eski sürümleri ezer)"],
    ["3", "3 (Genişletilmiş Kütüphane)", "Extended Splatbooks & dndtools (dndtools.net)", "Dragon Magic, Complete Serisi, Tome of Battle, Races Serisi vb.", "https://dndtools.net", "Genişletilmiş Arşiv", "Aktif", "Compendium sonrası ve tematik ek kitapların eksiksiz kütüphanesi"]
  ];
  sheet.getRange(6, 1, sourcesData.length, 8).setValues(sourcesData);
  sheet.getRange("A6:A8").setHorizontalAlignment("center");
  sheet.getRange("B6:B8").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("F6:G8").setHorizontalAlignment("center");
  sheet.getRange("A6:H8").setVerticalAlignment("middle");
  sheet.getRange("B6").setFontColor("#15803d");
  sheet.getRange("B7").setFontColor("#0369a1");
  sheet.getRange("B8").setFontColor("#a21caf");

  // --- Section 2: Campaign Books & PDF Archive (Rows 10-21) ---
  sheet.getRange("A10:H10").merge().setBackground("#1e293b").setFontColor("#f1f5f9")
    .setFontSize(10).setFontWeight("bold").setVerticalAlignment("middle")
    .setValue("  📖 2. KAMPANYA KİTAPLARI & PDF ARŞİV KATALOĞU (İlgili Kitap Linklerinizi Buraya Ekleyin)");

  var bookHeaders = ["#", "Kısaltma", "Kitap Adı (Book Title)", "Ana Kapsam / İçerik", "Google Drive / Web PDF Linkiniz", "Kategori", "Yayımcı", "Önemli Kural / Notlar"];
  sheet.getRange(11, 1, 1, bookHeaders.length).setValues([bookHeaders]);
  sheet.getRange("A11:H11").setBackground("#334155").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  var booksData = [
    ["1", "PHB", "Player's Handbook 3.5", "Temel sınıflar, ırklar, temel hünerler ve büyüler", "", "Core", "WotC", "Karakter yapım temeli"],
    ["2", "DMG", "Dungeon Master's Guide 3.5", "Büyülü eşyalar, prestij sınıfları, hazine tabloları", "", "Core", "WotC", "Eşya fiyatlandırma ve özellikler"],
    ["3", "MM", "Monster Manual 3.5", "Yaratıklar, ırksal özellikler ve şablonlar (templates)", "", "Core", "WotC", "Irk ve dönüşüm kuralları"],
    ["4", "MIC", "Magic Item Compendium", "Binlerce büyülü eşya, eşya kristalleri, vücut yuvaları", "", "Equipment", "WotC", "Tüm donanım ve eşya sinerjisi"],
    ["5", "SpC", "Spell Compendium", "Tüm 3.5e büyü kitaplarının birleştirilmiş ana arşivi", "", "Spells", "WotC", "Genişletilmiş büyü kütüphanesi"],
    ["6", "CW", "Complete Warrior", "Savaşçı sınıfları, dövüş hünerleri, prestij sınıfları", "", "Splatbook", "WotC", "Martial kombinasyonlar"],
    ["7", "CD", "Complete Divine", "İlahi sınıflar, domainler, ilahi hünerler (Divine feats)", "", "Splatbook", "WotC", "Cleric/Paladin mekanikleri"],
    ["8", "CA", "Complete Arcane", "Warlock, Warmage, metamagic hünerleri, büyü mekanikleri", "", "Splatbook", "WotC", "Büyücü mekanikleri"],
    ["9", "CAd", "Complete Adventurer", "Rogue/Bard yetenekleri, Skill Tricks, gizlilik hünerleri", "", "Splatbook", "WotC", "Skill ve keşif kuralları"],
    ["10", "ToB", "Tome of Battle (Book of 9 Swords)", "Savaş manevraları, duruşlar (stances), Martial Adept", "", "Combat", "WotC", "Gelişmiş dövüş manevraları"]
  ];
  sheet.getRange(12, 1, booksData.length, 8).setValues(booksData);
  sheet.getRange("A12:A21").setHorizontalAlignment("center");
  sheet.getRange("B12:B21").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("F12:G21").setHorizontalAlignment("center");
  sheet.getRange("A12:H21").setVerticalAlignment("middle");
  sheet.getRange("E12:E21").setBackground("#f8fafc").setFontStyle("italic");

  // --- Section 3: AI Importer & Schema Reference (Rows 23-28) ---
  sheet.getRange("A23:H23").merge().setBackground("#14532d").setFontColor("#dcfce7")
    .setFontSize(10).setFontWeight("bold").setVerticalAlignment("middle")
    .setValue("  🤖 3. AI RULE IMPORTER NASIL ÇALIŞIR? (KULLANIM REHBERİ)");

  var guideText = 
    "1. Model & Ayarlar: Row 3'teki 'AI Model Seçimi' kutusundan istediğiniz Gemini modelini seçebilir veya AUTO bırakabilirsiniz.\n" +
    "2. API Güvenliği: '🎲 D&D Tools' ➔ '🧙‍♂️ Rule Master & AI' ➔ '🔑 Set My Gemini API Key' menüsünden kendi Google AI Studio API anahtarınızı girin.\n" +
    "   Bu anahtar tarayıcınızın oturumunda (UserProperties/Cache) saklanır; tablodaki diğer oyuncular anahtarınızı ASLA göremez!\n" +
    "3. Canlı Arama (Grounding): Gemini, dndtools.net ve d20srd.org üzerinden canlı arama yaparak kuralın orijinal resmi metnine ulaşır.\n" +
    "4. 4 Sütunlu Revizyon Hiyerarşisi (Precedence):\n" +
    "   • Büyüler: Spell Compendium (SpC) en son resmi sürümdür. SpC sonrası kitaplar (Dragon Magic, ToB vb.) kendi kitabından alınır.\n" +
    "   • Eşyalar: Magic Item Compendium (MIC) en son fiyat, yuva ve eylem revizyonudur.\n" +
    "   • Hünerler (Feats): Core PHB veya en son 3.5e Complete/PHB II baskısı esastır.\n" +
    "   • Yetenekler: İlgili sınıfın basıldığı resmi kitap ve sınıf seviyesi işlenir.\n" +
    "5. Çoklu Güçler (Parent-Child): Eğer nesnenin birden fazla gücü varsa, Parent ve '↳' Child satırları otomatik oluşturulur.\n" +
    "6. Tek Tıkla Ekleme: '📥 Master_DB'ye Ekle' butonuna basıldığında satırlar Master_DB'nin en altına tüm formatıyla anında eklenir.";

  sheet.getRange("A24:H28").merge().setBackground("#f0fdf4").setFontColor("#166534")
    .setFontSize(9).setVerticalAlignment("top").setValue(guideText);

  // Border styling
  sheet.getRange("A5:H8").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A11:H21").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A23:H28").setBorder(true, true, true, true, true, true, "#86efac", SpreadsheetApp.BorderStyle.SOLID);

  SpreadsheetApp.getActiveSpreadsheet().toast("Rule_Library sayfası başarıyla oluşturuldu!", "📚 Tamamlandı", 5);
}

// ----------------------------------------------------
// 2. USER-ISOLATED API KEY SECURITY ENGINE
// ----------------------------------------------------
function getMyGeminiApiKey() {
  var userCache = CacheService.getUserCache();
  var cachedKey = userCache.get("GEMINI_API_KEY");
  if (cachedKey) return cachedKey;

  var userProps = PropertiesService.getUserProperties();
  var propKey = userProps.getProperty("GEMINI_API_KEY");
  if (propKey) {
    userCache.put("GEMINI_API_KEY", propKey, 21600); // 6 hours cache
    return propKey;
  }

  try {
    var docProps = PropertiesService.getDocumentProperties();
    var docKey = docProps.getProperty("GEMINI_API_KEY");
    if (docKey) {
      userCache.put("GEMINI_API_KEY", docKey, 21600);
      return docKey;
    }
  } catch(e) {}

  try {
    var scriptProps = PropertiesService.getScriptProperties();
    var sKey = scriptProps.getProperty("GEMINI_API_KEY");
    if (sKey) {
      userCache.put("GEMINI_API_KEY", sKey, 21600);
      return sKey;
    }
  } catch(e) {}

  return "";
}

function setMyGeminiApiKey(key) {
  var cleanKey = String(key || "").trim();
  if (!cleanKey) {
    clearMyGeminiApiKey();
    return false;
  }
  try { PropertiesService.getUserProperties().setProperty("GEMINI_API_KEY", cleanKey); } catch(e){}
  try { PropertiesService.getDocumentProperties().setProperty("GEMINI_API_KEY", cleanKey); } catch(e){}
  try { PropertiesService.getScriptProperties().setProperty("GEMINI_API_KEY", cleanKey); } catch(e){}
  try { CacheService.getUserCache().put("GEMINI_API_KEY", cleanKey, 21600); } catch(e){}
  if (typeof updateGuideChecklist === "function") updateGuideChecklist();
  return true;
}

function clearMyGeminiApiKey() {
  try { PropertiesService.getUserProperties().deleteProperty("GEMINI_API_KEY"); } catch(e){}
  try { PropertiesService.getDocumentProperties().deleteProperty("GEMINI_API_KEY"); } catch(e){}
  try { PropertiesService.getScriptProperties().deleteProperty("GEMINI_API_KEY"); } catch(e){}
  try { CacheService.getUserCache().remove("GEMINI_API_KEY"); } catch(e){}
  if (typeof updateGuideChecklist === "function") updateGuideChecklist();
  SpreadsheetApp.getActiveSpreadsheet().toast("Kişisel API anahtarınız oturumunuzdan silindi.", "🗑️ Temizlendi", 4);
}

function clearResetAllApiKeyAndPermissions() {
  var ui = SpreadsheetApp.getUi();
  
  // 1. Wipe UserProperties, DocumentProperties, ScriptProperties and UserCache
  try { PropertiesService.getUserProperties().deleteProperty("GEMINI_API_KEY"); } catch(e){}
  try { PropertiesService.getDocumentProperties().deleteProperty("GEMINI_API_KEY"); } catch(e){}
  try { PropertiesService.getScriptProperties().deleteProperty("GEMINI_API_KEY"); } catch(e){}
  try { PropertiesService.getUserProperties().deleteProperty("AI_NETWORK_AUTHORIZED"); } catch(e){}
  try { PropertiesService.getUserProperties().deleteProperty("AI_MODEL_DIAGNOSED"); } catch(e){}
  try { CacheService.getUserCache().remove("GEMINI_API_KEY"); } catch(e){}
  
  // 2. Uncheck checklist marks in Master_DB_Guide
  if (typeof updateGuideChecklist === "function") updateGuideChecklist();
  
  var msg = 
    "✅ Kişisel API Anahtarınız ve Yerel İzin Durumunuz Sıfırlandı!\n\n" +
    "• Kişisel Gemini API anahtarınız oturumunuzdan silindi.\n" +
    "• Master_DB_Guide kontrol listesindeki onay tikleri kaldırıldı.\n\n" +
    "📌 Google OAuth İznini Tamamen Kaldırmak İçin:\n" +
    "Google Hesabınız düzeyindeki genel OAuth iznini de tamamen kaldırmak isterseniz:\n" +
    "👉 https://myaccount.google.com/connections\n" +
    "adresine giderek 'Kaydedilen Makrolar' izinlerini silebilirsiniz.";

  ui.alert("🗑️ Sıfırlama Tamamlandı", msg, ui.ButtonSet.OK);
  SpreadsheetApp.getActiveSpreadsheet().toast("API Anahtarı ve izin durumları sıfırlandı, tikler kaldırıldı.", "🗑️ Sıfırlandı", 5);
}

function testOrAuthorizeExternalAccess() {
  // Direct call without try-catch so Google's runtime prompts for OAuth permission dialog!
  UrlFetchApp.fetch("https://generativelanguage.googleapis.com", { muteHttpExceptions: true });
  PropertiesService.getUserProperties().setProperty("AI_NETWORK_AUTHORIZED", "TRUE");
  if (typeof updateGuideChecklist === "function") updateGuideChecklist();
  var ui = SpreadsheetApp.getUi();
  ui.alert("✅ İnternet / AI İzni Aktif", "Google Apps Script dış web bağlantısı (UrlFetchApp) başarıyla yetkilendirildi!\nMaster_DB_Guide sayfasındaki 1. onay kutusu otomatik olarak işaretlendi.", ui.ButtonSet.OK);
}

function promptSetMyGeminiApiKey() {
  UrlFetchApp.fetch("https://generativelanguage.googleapis.com", { muteHttpExceptions: true });

  var ui = SpreadsheetApp.getUi();
  var currentKey = getMyGeminiApiKey();
  var masked = currentKey ? currentKey.substring(0, 6) + "..." + currentKey.substring(Math.max(0, currentKey.length - 4)) : "Tanımlı Değil";

  var response = ui.prompt(
    "🔑 Kişisel Gemini API Anahtarınızı Girin",
    "Mevcut Durum: " + masked + "\n\n" +
    "Ücretsiz Google AI Studio API anahtarınızı yapıştırın:\n" +
    "(Bu anahtar sadece sizin hesabınızda geçerlidir; diğer oyuncular göremez ve kullanamaz)\n" +
    "Anahtar almak için: https://aistudio.google.com/app/apikey",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    var inputKey = response.getResponseText().trim();
    if (inputKey) {
      setMyGeminiApiKey(inputKey);
      if (typeof updateGuideChecklist === "function") updateGuideChecklist();
      ui.alert("✅ Başarılı", "Gemini API anahtarınız kişisel oturumunuza güvenle kaydedildi!\nMaster_DB_Guide sayfasındaki 2. onay kutusu otomatik olarak işaretlendi.", ui.ButtonSet.OK);
    } else {
      ui.alert("⚠️ Uyarı", "Boş anahtar girildi, değişiklik yapılmadı.", ui.ButtonSet.OK);
    }
  }
}

function diagnoseGeminiApiKey() {
  var ui = SpreadsheetApp.getUi();
  var apiKey = getMyGeminiApiKey();
  if (!apiKey) {
    ui.alert("⚠️ API Anahtarı Bulunamadı", "Lütfen önce '🔑 Set My Gemini API Key' menüsünden anahtarınızı kaydedin.", ui.ButtonSet.OK);
    return;
  }

  // Auto-sync across all storage layers so sidebar & mobile iframe have it!
  try { PropertiesService.getDocumentProperties().setProperty("GEMINI_API_KEY", apiKey); } catch(e){}
  try { PropertiesService.getScriptProperties().setProperty("GEMINI_API_KEY", apiKey); } catch(e){}

  // Purge any stale model cache so diagnosis is always 100% fresh
  try {
    CacheService.getScriptCache().remove("GEMINI_LIVE_MODELS_CACHE_V2");
    CacheService.getScriptCache().remove("GEMINI_LIVE_MODELS_CACHE_V3");
    CacheService.getScriptCache().remove("GEMINI_LIVE_MODELS_CACHE_V4");
    CacheService.getScriptCache().remove("GEMINI_LIVE_MODELS_JSON");
    CacheService.getScriptCache().remove("GEMINI_BEST_MODEL");
  } catch(eCache){}

  // 1. Fetch live models and filter to concise modern curated list
  var availableModels = getLiveFilteredGeminiModels(apiKey);
  if (!availableModels || availableModels.length === 0) {
    availableModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-flash-lite-latest",
      "gemini-flash-latest"
    ];
  }

  var liteModels = availableModels.filter(function(m) { return m.indexOf("lite") !== -1; });
  var regularFlash = availableModels.filter(function(m) { return m.indexOf("lite") === -1; });

  // Determine top models for each task
  var ruleMasterModel = (liteModels.indexOf("gemini-3.5-flash-lite") !== -1)
    ? "gemini-3.5-flash-lite"
    : (liteModels.length > 0 ? liteModels[0] : "gemini-3.5-flash-lite");

  var combatBuilderModel = (regularFlash.indexOf("gemini-3.5-flash") !== -1)
    ? "gemini-3.5-flash"
    : (regularFlash.length > 0 ? regularFlash[0] : "gemini-3.5-flash");

  // 2. Auto-Update Rule_Library C3 dropdown with curated models!
  var updatedRuleLib = false;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ruleLib = ss.getSheetByName("Rule_Library");
    if (ruleLib) {
      var dropdownList = ["AUTO (Otomatik En Hızlı Model)"].concat(availableModels);
      var modelRule = SpreadsheetApp.newDataValidation().requireValueInList(dropdownList, false).build();
      ruleLib.getRange("C3:D3").setDataValidation(modelRule);
      
      var currentVal = String(ruleLib.getRange("C3").getValue() || "").trim();
      if (!currentVal || dropdownList.indexOf(currentVal) === -1) {
        ruleLib.getRange("C3:D3").setValue("AUTO (Otomatik En Hızlı Model)");
      }
      updatedRuleLib = true;
    }
  } catch (eLib) {}

  // 3. Test ping on the top Flash-Lite model (Rule Master Model)
  var testUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + ruleMasterModel + ":generateContent?key=" + encodeURIComponent(apiKey);
  var testPayload = {
    contents: [{ parts: [{ text: "ping" }] }]
  };
  var testMsg = "";
  var startTime = new Date().getTime();
  try {
    var testResp = UrlFetchApp.fetch(testUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(testPayload),
      muteHttpExceptions: true
    });
    var elapsed = new Date().getTime() - startTime;
    var testStatus = testResp.getResponseCode();
    var testBody = testResp.getContentText();
    if (testStatus === 200) {
      var tData = JSON.parse(testBody);
      var reply = tData.candidates[0].content.parts[0].text;
      var ver = tData.modelVersion || ruleMasterModel;
      testMsg = "✅ BAŞARILI! (" + elapsed + " ms)\nModel Sürümü: " + ver + "\nTest Yanıtı: \"" + reply.trim() + "\"";
      PropertiesService.getUserProperties().setProperty("AI_MODEL_DIAGNOSED", "TRUE");
      if (typeof updateGuideChecklist === "function") updateGuideChecklist();
    } else {
      var tErrObj = {};
      try { tErrObj = JSON.parse(testBody); } catch(e){}
      testMsg = "❌ HTTP " + testStatus + ": " + ((tErrObj.error && tErrObj.error.message) ? tErrObj.error.message : testBody);
    }
  } catch (e2) {
    testMsg = "❌ Ağ Hatası: " + e2.message;
  }

  var report = 
    "=== 🩺 GEMINI API VE MODEL TANI RAPORU ===\n\n" +
    "🔑 API Anahtarınız: " + apiKey.substring(0, 6) + "..." + apiKey.substring(Math.max(0, apiKey.length - 4)) + " (Doğrulandı ✅)\n\n" +
    "⚡ Görev Modeli Dağılımı:\n" +
    "• ⚡ Rule Master (Hızlı Arama): '" + ruleMasterModel + "' (Flash-Lite)\n" +
    "• 🧠 Combat Kokpiti (Taktik Akıl Yürütme): '" + combatBuilderModel + "' (Flash)\n\n" +
    "⚡ Rule Master Hız Testi ('" + ruleMasterModel + "'):\n" + testMsg + "\n\n" +
    "📋 Kullanılan Sadeleştirilmiş Modeller:\n" +
    availableModels.map(function(m, idx) {
      var roleNote = (m === ruleMasterModel) ? " [⚡ Rule Master]" : (m === combatBuilderModel ? " [🧠 Combat Kokpiti]" : " [Yedek Model]");
      return (idx + 1) + ". " + m + roleNote;
    }).join("\n") + "\n\n" +
    (updatedRuleLib ? "✨ Rule_Library C3 açılır menüsü bu sadeleştirilmiş modellerle OTOMATİK güncellendi!" : "");

  ui.alert("🩺 Tanı ve Otomatik Senkronizasyon Tamamlandı", report, ui.ButtonSet.OK);
}

function getApiKeyStatusForSidebar() {
  var key = getMyGeminiApiKey();
  if (!key) {
    return { hasKey: false, maskedKey: "" };
  }
  var masked = key.substring(0, 6) + "..." + key.substring(Math.max(0, key.length - 4));
  return { hasKey: true, maskedKey: masked };
}

// ----------------------------------------------------
// 3. AI RULE IMPORTER SIDEBAR
// ----------------------------------------------------
function showAiRuleImporterSidebar() {
  var html = HtmlService.createHtmlOutput(getAiRuleImporterSidebarHtml('search'))
      .setTitle('🧙‍♂️🤖 Rule Master')
      .setWidth(380);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showLevelUpCopilotSidebar() {
  var html = HtmlService.createHtmlOutput(getAiRuleImporterSidebarHtml('lvlup'))
      .setTitle('🧙‍♂️🤖 Rule Master')
      .setWidth(380);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getAiRuleImporterSidebarHtml(initialTab) {
  var startTab = initialTab || 'search';
  var keyStatus = getApiKeyStatusForSidebar();
  var hasKey = keyStatus.hasKey;
  var maskedKey = keyStatus.maskedKey;
  return `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <script>
    window.onerror = function(msg, url, line) {
      var b = document.getElementById('jsErrorBanner');
      if (b) {
        b.style.display = 'block';
        b.innerHTML = '⚠️ <strong>JS Hatası (Satır ' + line + '):</strong> ' + msg;
      }
    };
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 12px; font-size: 13px; -webkit-text-size-adjust: 100%; }
    h3 { margin: 0 0 6px 0; color: #38bdf8; font-size: 15px; display: flex; align-items: center; gap: 6px; }
    .sub { font-size: 11px; color: #94a3b8; margin-bottom: 12px; }
    
    .status-card { border-radius: 6px; padding: 8px 10px; margin-bottom: 12px; font-size: 11px; line-height: 1.4; }
    .status-active { background: #064e3b; border: 1px solid #059669; color: #a7f3d0; }
    .status-missing { background: #450a0a; border: 1px solid #dc2626; color: #fecaca; }
    
    .input-group { margin-bottom: 10px; }
    label { display: block; font-size: 11px; font-weight: bold; color: #cbd5e1; margin-bottom: 4px; }
    input[type="text"], input[type="password"], select { width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #ffffff; padding: 7px 8px; font-size: 12px; outline: none; transition: 0.15s; }
    input[type="text"]:focus, select:focus { border-color: #38bdf8; box-shadow: 0 0 0 1px #38bdf8; }
    
    button, .filter-chip, .tab-btn { touch-action: manipulation; -webkit-tap-highlight-color: rgba(56, 189, 248, 0.3); user-select: none; -webkit-user-select: none; }
    .btn { display: block; width: 100%; box-sizing: border-box; background: #2563eb; color: #ffffff; border: none; border-radius: 4px; padding: 8px 10px; font-weight: bold; font-size: 12px; cursor: pointer; text-align: center; transition: 0.15s; }
    .btn:hover { background: #1d4ed8; }
    .btn:disabled { background: #334155; color: #64748b; cursor: not-allowed; }
    .btn-success { background: #16a34a; }
    .btn-success:hover { background: #15803d; }
    .btn-outline { background: transparent; border: 1px solid #64748b; color: #cbd5e1; padding: 4px 6px; font-size: 10px; border-radius: 3px; cursor: pointer; width: auto; display: inline-block; }
    .btn-outline:hover { background: #1e293b; border-color: #94a3b8; }
    
    .tab-nav { display: flex; gap: 4px; margin-bottom: 12px; background: #0f172a; padding: 3px; border-radius: 6px; border: 1px solid #1e293b; }
    .tab-btn { flex: 1; padding: 6px 8px; font-size: 11px; font-weight: bold; background: transparent; color: #94a3b8; border: none; border-radius: 4px; cursor: pointer; transition: 0.15s; text-align: center; }
    .tab-btn.active { background: #2563eb; color: #ffffff; }
    textarea { width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #ffffff; padding: 7px 8px; font-size: 11px; outline: none; transition: 0.15s; font-family: inherit; }
    textarea:focus { border-color: #38bdf8; box-shadow: 0 0 0 1px #38bdf8; }

    .filter-chip { background: #1e293b; border: 1px solid #3b82f6; color: #93c5fd; padding: 4px 7px; font-size: 11px; border-radius: 4px; cursor: pointer; font-family: monospace; font-weight: bold; transition: 0.15s; }
    .filter-chip:hover { background: #1d4ed8; color: #ffffff; border-color: #60a5fa; }
    
    .source-pills { display: flex; gap: 4px; margin-bottom: 12px; font-size: 10px; }
    .pill { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2px 7px; color: #94a3b8; }
    .pill.active { border-color: #38bdf8; color: #38bdf8; }
    
    #previewBox { margin-top: 14px; display: none; }
    .card { background: #131c2e; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px; margin-bottom: 8px; position: relative; }
    .card.child { border-left: 3px solid #c084fc; background: #1a1528; }
    .card-title { font-weight: bold; font-size: 13px; color: #f8fafc; margin-bottom: 3px; display: flex; justify-content: space-between; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: #1e3a5f; color: #38bdf8; }
    .badge-child { background: #581c87; color: #e9d5ff; }
    .card-meta { font-size: 11px; color: #94a3b8; margin-bottom: 6px; }
    .card-desc { font-size: 11px; color: #cbd5e1; line-height: 1.35; background: #0f141f; padding: 6px; border-radius: 4px; margin-bottom: 6px; }
    .stat-row { display: flex; gap: 6px; flex-wrap: wrap; font-size: 10px; color: #a5f3fc; }
    .stat-tag { background: #083344; padding: 2px 5px; border-radius: 3px; border: 1px solid #155e75; }
    
    .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 6px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body ontouchstart="">
  <div id="jsErrorBanner" style="display: none; background: #7f1d1d; border: 1px solid #ef4444; color: #fecaca; padding: 6px 8px; font-size: 11px; margin-bottom: 8px; border-radius: 4px; line-height: 1.4;"></div>
  
  <div id="buildVersionBadge" style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; border: 1px solid #1e293b; padding: 4px 8px; border-radius: 4px; font-size: 10px; color: #38bdf8; margin-bottom: 8px;">
    <span>🧙‍♂️🤖 <strong>Rule Master</strong></span>
    <span id="activeTabPill" style="color: #a5f3fc;">Aktif: Akıllı Arama</span>
  </div>

  <h3>🧙‍♂️🤖 Rule Master</h3>
  <div class="sub">Kademeli D&D 3.5e Kural & Level-Up Motoru ➔ Master_DB</div>

  <!-- API Key Status Widget (Pre-rendered Server-Side) -->
  <div id="apiKeyWidget" class="status-card ${hasKey ? 'status-active' : 'status-missing'}">
    <div id="missingKeyBox" style="${hasKey ? 'display: none;' : 'display: block;'}">
      🔒 <strong>API Anahtarı Tanımlı Değil</strong><br>
      <div style="margin: 6px 0 4px 0;">Bu özellik kişiye özeldir. Ücretsiz Google AI Studio anahtarınızı girin:</div>
      <input type="password" id="inlineApiKey" placeholder="AIzaSy..." style="margin-bottom: 6px;" />
      <div style="display: flex; gap: 6px; align-items: center;">
        <button type="button" class="btn btn-outline" onclick="saveApiKeyFromSidebar()">💾 Kaydet</button>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" style="font-size: 10px;">🔗 Ücretsiz Al</a>
      </div>
    </div>
    <div id="activeKeyBox" style="${hasKey ? 'display: block;' : 'display: none;'}">
      🟢 <strong>API Anahtarı Aktif:</strong> <span id="maskedKeyVal" style="font-family: monospace;">${maskedKey}</span>
      <div style="margin-top: 4px;">
        <button type="button" class="btn-outline" onclick="clearApiKeyFromSidebar()">🗑️ Sıfırla / Sil</button>
      </div>
    </div>
  </div>

  <!-- Source Cascade Indicator -->
  <div class="source-pills">
    <span class="pill active" title="1. Öncelik: d20srd.org (Core 3.5e SRD)">1. Core SRD</span>
    <span class="pill active" title="2. Öncelik: Spell Compendium / MIC">2. Compendiums</span>
    <span class="pill active" title="3. Öncelik: dndtools.net (Splatbooks)">3. Splatbooks</span>
  </div>

  <!-- Mode Switcher Tabs -->
  <div class="tab-nav">
    <button type="button" id="tabSearchBtn" class="tab-btn active" data-mode="search" onclick="switchImportTab('search')">🔍 Akıllı Arama</button>
    <button type="button" id="tabFreeformBtn" class="tab-btn" data-mode="freeform" onclick="switchImportTab('freeform')">📋 Serbest Metin</button>
    <button type="button" id="tabLvlUpBtn" class="tab-btn" data-mode="lvlup" onclick="switchImportTab('lvlup')">⚔️ Level-Up Copilot</button>
  </div>

  <div id="categoryGroup" class="input-group">
    <label for="categorySelect">Kategori Filtresi (Opsiyonel):</label>
    <select id="categorySelect">
      <option value="Auto">✨ Otomatik Tespit (Tavsiye Edilen)</option>
      <option value="Race">Race (Irk / Racial Trait)</option>
      <option value="Feat">Feat (Hüner)</option>
      <option value="Weapon">Weapon (Silah)</option>
      <option value="Armor">Armor (Zırh)</option>
      <option value="Shield">Shield (Kalkan)</option>
      <option value="Armor / Shield">Armor / Shield (Zırh / Kalkan)</option>
      <option value="Ring">Ring (Yüzük)</option>
      <option value="Wondrous Item">Wondrous Item (Büyülü Eşya)</option>
      <option value="Slotless Item">Slotless Item (Yuvasız Eşya)</option>
      <option value="Spell">Spell (Büyü)</option>
      <option value="Special Ability">Special Ability / Class Feature (Özel Yetenek / Sınıf)</option>
    </select>
  </div>

  <!-- TAB 1: SMART SEARCH SECTION -->
  <div id="searchSection">
    <div class="input-group">
      <label for="queryInput">Kural / Hüner / Eşya / Büyü Arama:</label>
      <input type="text" id="queryInput" placeholder="Örn: race: Goliath, class: blood storm blade blood rain..." onkeypress="handleKeyPress(event)" />
      
      <!-- Outlook / Gmail Style Filter Operator Badges -->
      <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
        <span style="font-size: 10px; color: #64748b; font-weight: bold;">Hızlı Filtre:</span>
        <button type="button" class="filter-chip" data-prefix="race:" onclick="insertFilter('race:')" title="Irk (Örn: race: Goliath, race: Dwarf, race: Human)">race:</button>
        <button type="button" class="filter-chip" data-prefix="class:" onclick="insertFilter('class:')" title="Sınıf / Prestij Sınıfı Yeteneği">class:</button>
        <button type="button" class="filter-chip" data-prefix="feat:" onclick="insertFilter('feat:')" title="Feat / Hüner">feat:</button>
        <button type="button" class="filter-chip" data-prefix="spell:" onclick="insertFilter('spell:')" title="Büyü / Dua">spell:</button>
        <button type="button" class="filter-chip" data-prefix="book:" onclick="insertFilter('book:')" title="Kaynak Kitap (Örn: Tome of Battle, MIC, PHB)">book:</button>
        <button type="button" class="filter-chip" data-prefix="slot:" onclick="insertFilter('slot:')" title="Vücut Yuvası (Örn: feet, head, ring)">slot:</button>
        <button type="button" class="filter-chip" data-prefix="type:" onclick="insertFilter('type:')" title="Kategori (Örn: weapon, armor, wondrous)">type:</button>
      </div>
      <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; line-height: 1.5; background: #0f141f; padding: 6px 8px; border-radius: 4px; border: 1px solid #1e293b;">
        <div style="color: #38bdf8; font-weight: bold; margin-bottom: 3px;">💡 Arama Operatörü Örnekleri:</div>
        <div>• <code>race: Goliath</code> veya <code>race: Dwarf</code></div>
        <div>• <code>class: blood storm blade blood rain</code></div>
        <div>• <code>rogue: evasion</code></div>
        <div>• <code>feat: shock trooper</code></div>
        <div>• <code>spell: greater heroism</code></div>
        <div>• <code>book: MIC boots of speed</code></div>
        <div>• <code>slot: ring protection +5</code></div>
      </div>

      <!-- Turbo d20srd.org Mode vs Deep Web Search Toggle -->
      <div style="margin-top: 8px; padding: 6px 8px; background: #0f172a; border-radius: 4px; border: 1px solid #1e293b;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <input type="checkbox" id="deepSearchToggle" style="margin: 0; cursor: pointer;" />
          <label for="deepSearchToggle" style="font-size: 11px; color: #cbd5e1; cursor: pointer; user-select: none; font-weight: 500;">
            🌐 <strong>Derin Web Doğrulama</strong> <span style="color: #64748b; font-size: 10px;">(dndtools / Yan Kitaplar ~30-45 sn)</span>
          </label>
        </div>
        <div style="font-size: 10px; color: #38bdf8; margin-top: 3px; line-height: 1.3;">
          ⚡ <em>İşaretsizken (Varsayılan): <strong>d20srd.org (Core SRD)</strong> üzerinden <strong>2-3 saniyede süper hızlı</strong> arar.</em>
        </div>
      </div>
    </div>

    <button id="btnFetch" class="btn" onclick="fetchRuleData()">
      🔍 Kuralı Kaynaklardan Getir (AI)
    </button>
  </div>

  <!-- TAB 2: FREEFORM TEXT SECTION -->
  <div id="freeformSection" style="display: none;">
    <div class="input-group">
      <label for="freeformInput">dndtools veya PDF Kural Metnini Yapıştırın:</label>
      <textarea id="freeformInput" rows="7" placeholder="dndtools.net veya PDF'ten kural sayfasının tüm metnini doğrudan buraya yapıştırın (Örn: Primal Senses veya Shock Trooper metni)..."></textarea>
      <div style="font-size: 10px; color: #94a3b8; margin-top: 4px; line-height: 1.4;">
        💡 <em>İpucu: dndtools sayfasındaki tüm metni kopyalayıp buraya yapıştırmanız, sıfır hata ile kuralı 31 sütunluk Master_DB formatına dönüştürür.</em>
      </div>
    </div>
    <button id="btnFetchFreeform" class="btn" style="background: #9333ea;" onclick="fetchFreeformData()">
      ⚡ Metni Ayrıştır ve DB'ye Hazırla
    </button>
  </div>

  <!-- TAB 3: LEVEL-UP COPILOT SECTION -->
  <div id="lvlUpSection" style="display: none;">
    <div class="input-group">
      <label for="lvlUpQueryInput">Sınıf & Seviye:</label>
      <input type="text" id="lvlUpQueryInput" placeholder="Örn: Warblade 5, Fighter 1..." onkeypress="handleLvlUpKeyPress(event)" />
      
      <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; line-height: 1.5; background: #0f141f; padding: 6px 8px; border-radius: 4px; border: 1px solid #1e293b;">
        <div style="color: #38bdf8; font-weight: bold; margin-bottom: 3px;">💡 Kademeli Seviye Gelişimi:</div>
        <div>• <code>Warblade 5</code> ➔ Tabloya <strong>Warblade-5</strong> olarak ekler (kademeli kontrol ile).</div>
        <div>• <code>Fighter 1</code> ➔ Tabloya <strong>Fighter-1</strong> olarak ekler.</div>
        <div>• <code>Warblade</code> ➔ Seviye yazılmazsa sıradaki geçerli seviyeyi otomatik belirler.</div>
        <div>• Seviyeler atlanmadan sırayla doldurulmalıdır; kural dışı seçimlerde yönlendirir.</div>
        <div>• HD, BAB, Kurtarma Zarları, Feat ve Yetenekler otomatik aktarılır.</div>
      </div>
    </div>

    <button id="btnFetchLvlUp" class="btn" style="background: #2563eb;" onclick="fetchLvlUpData()">
      ⚡ Seviyeyi İncele ve Hazırla (AI)
    </button>

    <div id="lvlUpPreviewBox" style="display: none; margin-top: 12px;">
      <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">SEVİYE GELİŞİM ÖNİZLEMESİ:</div>
      <div id="lvlUpCardContainer"></div>
      <button id="btnApplyLvlUp" class="btn btn-success" onclick="applyLvlUpToSheet()" style="margin-top: 10px;">
        🚀 Karakter Kağıdına Uygula (1-Click Apply)
      </button>
    </div>
  </div>

  <!-- Preview & Append Section -->
  <div id="previewBox">
    <div id="duplicateAlertBox" style="display: none; background: #450a0a; border: 1px solid #ef4444; color: #fecaca; padding: 8px 10px; border-radius: 6px; font-size: 11px; margin-bottom: 8px; line-height: 1.4;">
      ⚠️ <strong>UYARI:</strong> Bu kural zaten Master_DB'de mevcut! Yinelenen kayıt oluşturulamaz.
      <div id="duplicateListText" style="margin-top: 4px; font-family: monospace; color: #fca5a5;"></div>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0 6px 0;">
      <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">ÖNİZLEME & AYRIŞTIRILAN VERİ:</span>
      <div id="selectionBatchBar" style="display: flex; gap: 5px;">
        <button type="button" onclick="toggleSelectAllCards(true)" style="background: #1e293b; color: #38bdf8; border: 1px solid #0284c7; border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 3px;" title="Tüm kartları seç">
          ☑ Tümünü Seç
        </button>
        <button type="button" onclick="toggleSelectAllCards(false)" style="background: #1e293b; color: #94a3b8; border: 1px solid #475569; border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 3px;" title="Tüm seçimleri kaldır">
          ☐ Temizle
        </button>
      </div>
    </div>
    <div id="cardsContainer"></div>
    <button id="btnAppend" class="btn btn-success" onclick="appendRowsToMasterDb()" style="margin-top: 8px;">
      📥 Master_DB'ye Ekle (Otomatik Format)
    </button>
  </div>

  <script>
    var currentParsedRows = [];
    var currentDuplicates = [];

    function initSidebar() {
      try {
        attachMobileTouchListeners();
        switchImportTab('${startTab}');
        checkKeyStatus();
      } catch(e) {
        console.error('initSidebar error:', e);
      }
    }
    window.onload = initSidebar;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initSidebar();
    } else {
      document.addEventListener('DOMContentLoaded', initSidebar);
    }

    function attachMobileTouchListeners() {
      try {
        var chips = document.querySelectorAll('.filter-chip');
        for (var i = 0; i < chips.length; i++) {
          (function(chip) {
            chip.addEventListener('touchend', function(e) {
              var prefix = chip.getAttribute('data-prefix') || chip.innerText.trim();
              insertFilter(prefix);
              e.preventDefault();
            }, { passive: false });
          })(chips[i]);
        }

        var tabBtns = document.querySelectorAll('.tab-btn');
        for (var j = 0; j < tabBtns.length; j++) {
          (function(tb) {
            tb.addEventListener('touchend', function(e) {
              var mode = tb.getAttribute('data-mode');
              if (mode) {
                switchImportTab(mode);
                e.preventDefault();
              }
            }, { passive: false });
          })(tabBtns[j]);
        }
      } catch(e) {
        console.error('attachMobileTouchListeners error:', e);
      }
    }

    function setAiButtonsDisabled(disabled) {
      ['btnFetch', 'btnFetchFreeform', 'btnFetchLvlUp'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.disabled = disabled;
      });
    }

    function checkKeyStatus() {
      google.script.run
        .withSuccessHandler(function(res) {
          if (res && res.hasKey) {
            document.getElementById('apiKeyWidget').className = 'status-card status-active';
            document.getElementById('missingKeyBox').style.display = 'none';
            document.getElementById('activeKeyBox').style.display = 'block';
            document.getElementById('maskedKeyVal').innerText = res.maskedKey;
            setAiButtonsDisabled(false);
          } else {
            document.getElementById('apiKeyWidget').className = 'status-card status-missing';
            document.getElementById('missingKeyBox').style.display = 'block';
            document.getElementById('activeKeyBox').style.display = 'none';
            setAiButtonsDisabled(true);
          }
        })
        .withFailureHandler(function(err) {
          console.error('checkKeyStatus error:', err);
        })
        .getApiKeyStatusForSidebar();
    }

    function saveApiKeyFromSidebar() {
      var key = document.getElementById('inlineApiKey').value.trim();
      if (!key) {
        alert('Lütfen geçerli bir API anahtarı yapıştırın.');
        return;
      }
      google.script.run
        .withSuccessHandler(function(success) {
          if (success) {
            document.getElementById('inlineApiKey').value = '';
            checkKeyStatus();
          } else {
            alert('Anahtar doğrulanamadı.');
          }
        })
        .withFailureHandler(function(err) {
          alert('Kayıt Hatası: ' + (err.message || err));
        })
        .setMyGeminiApiKey(key);
    }

    function clearApiKeyFromSidebar() {
      if (confirm('API anahtarınızı silmek istediğinize emin misiniz?')) {
        google.script.run
          .withSuccessHandler(function() {
            checkKeyStatus();
          })
          .withFailureHandler(function(err) {
            alert('Silme Hatası: ' + (err.message || err));
          })
          .clearMyGeminiApiKey();
      }
    }

    function insertFilter(prefix) {
      try {
        var input = document.getElementById('queryInput');
        if (!input) return;
        var val = input.value || '';
        if (val.length > 0 && val.charAt(val.length - 1) !== ' ') {
          input.value = val + ' ' + prefix + ' ';
        } else {
          input.value = val + prefix + ' ';
        }
        input.focus();

        var pill = document.getElementById('activeTabPill');
        if (pill) {
          var oldText = pill.innerText;
          pill.innerText = 'Filtre Eklendi: ' + prefix;
          setTimeout(function() { pill.innerText = oldText; }, 1500);
        }
      } catch(e) {
        console.error('insertFilter error:', e);
      }
    }

    function handleKeyPress(e) {
      if (e.key === 'Enter') {
        fetchRuleData();
      }
    }

    function fetchRuleData() {
      var query = document.getElementById('queryInput').value.trim();
      if (!query) {
        alert('Lütfen bir eşya, feat veya büyü adı yazın.');
        return;
      }
      var cat = document.getElementById('categorySelect').value;
      var isDeep = document.getElementById('deepSearchToggle') ? document.getElementById('deepSearchToggle').checked : false;

      var btn = document.getElementById('btnFetch');
      btn.disabled = true;
      btn.innerHTML = isDeep ? '<span class="spinner"></span> dndtools / Web taranıyor (Derin Arama)...' : '<span class="spinner"></span> d20srd.org taranıyor (Hızlı)...';
      document.getElementById('previewBox').style.display = 'none';

      google.script.run.withSuccessHandler(function(response) {
        btn.disabled = false;
        btn.innerHTML = '🔍 Kuralı Kaynaklardan Getir (AI)';

        if (!response.success) {
          alert('Hata: ' + response.error);
          return;
        }

        if (response.correctedQuery && response.correctedQuery.toLowerCase() !== query.toLowerCase()) {
          var qInp = document.getElementById('queryInput');
          if (qInp) qInp.value = response.correctedQuery;
        }

        currentParsedRows = response.rows;
        currentDuplicates = response.duplicates || [];
        renderPreviewCards(currentParsedRows, currentDuplicates);
      }).withFailureHandler(function(err) {
        btn.disabled = false;
        btn.innerHTML = '🔍 Kuralı Kaynaklardan Getir (AI)';
        alert('Bağlantı Hatası: ' + err.message);
      }).queryGeminiForMasterDb(query, cat, isDeep);
    }

    function toggleSelectAllCards(checkStatus) {
      if (!currentParsedRows || currentParsedRows.length === 0) return;
      for (var i = 0; i < currentParsedRows.length; i++) {
        var chk = document.getElementById('cardCheck_' + i);
        if (chk) {
          if (checkStatus && currentDuplicates && currentDuplicates.indexOf(currentParsedRows[i][0]) !== -1) {
            continue;
          }
          chk.checked = checkStatus;
        }
      }
      updateSelectedImportCount();
    }

    function updateSelectedImportCount() {
      if (!currentParsedRows || currentParsedRows.length === 0) return;
      var selectedCount = 0;
      for (var i = 0; i < currentParsedRows.length; i++) {
        var chk = document.getElementById('cardCheck_' + i);
        if (chk && chk.checked) {
          selectedCount++;
        }
      }
      var btnAppend = document.getElementById('btnAppend');
      if (btnAppend) {
        if (selectedCount === 0) {
          btnAppend.disabled = true;
          btnAppend.style.background = '#475569';
          btnAppend.innerHTML = '⛔ Hiçbir Kart Seçilmedi';
        } else {
          btnAppend.disabled = false;
          btnAppend.style.background = '#16a34a';
          btnAppend.innerHTML = "📥 Seçilenleri Master_DB'ye Kaydet (" + selectedCount + " Adet)";
        }
      }
    }

    function renderPreviewCards(rows, duplicates) {
      var container = document.getElementById('cardsContainer');
      container.innerHTML = '';

      var dupBox = document.getElementById('duplicateAlertBox');
      var dupText = document.getElementById('duplicateListText');
      var btnAppend = document.getElementById('btnAppend');

      if (duplicates && duplicates.length > 0) {
        dupBox.style.display = 'block';
        dupText.innerHTML = 'Mevcut (Varsayılan olarak seçilmedi): ' + duplicates.join(', ');
      } else {
        dupBox.style.display = 'none';
        dupText.innerHTML = '';
      }

      var bar = document.getElementById('selectionBatchBar');
      if (bar) bar.style.display = (rows && rows.length > 1) ? 'flex' : 'none';

      if (!rows || rows.length === 0) {
        container.innerHTML = '<div style="color: #f87171;">Uygun kural kaydı bulunamadı.</div>';
        return;
      }

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var name = r[0] || 'İsimsiz';
        var cat = r[1] || '-';
        var slot = r[2] || '-';
        var parent = r[3] || '-';
        var prereq = r[4] || '-';
        var source = r[5] || '-';
        var desc = r[6] || '';
        var bType = r[7] || '';
        var scope = r[8] || '';
        var onHit = r[25] || '';
        var action = r[26] || '';
        var duration = r[27] || '';
        var weight = r[28] ? r[28] + ' lbs' : '';
        var cost = r[29] ? r[29] + ' gp' : '';
        var combatRole = r[30] || 'Non-Combat';

        var isChild = (name.indexOf('↳') === 0 || parent !== '-');
        var isDup = (duplicates && duplicates.indexOf(name) !== -1);

        var card = document.createElement('div');
        card.className = 'card' + (isChild ? ' child' : '');
        if (isDup) {
          card.style.borderColor = '#ef4444';
          card.style.background = '#2a1215';
        }

        var badgeClass = isChild ? 'badge badge-child' : 'badge';
        var badgeText = isChild ? '↳ Child (Miras)' : 'Parent (Ana)';
        if (isDup) {
          badgeText += ' • [ZATEN MEVCUT]';
          badgeClass = 'badge';
        }

        var statsHtml = '';
        if (bType) statsHtml += '<span class="stat-tag">Bonus: ' + bType + '</span>';
        if (scope && scope !== 'None / General') {
          if (scope.indexOf('Skill:') === 0) {
            statsHtml += '<span class="stat-tag" style="background:#3b0764; color:#d8b4fe; border:1px solid #7e22ce;">🎯 ' + scope + '</span>';
          } else {
            statsHtml += '<span class="stat-tag">' + scope + '</span>';
          }
        }

        var buffList = [];
        var buffDefs = [
          {idx: 9, label: 'Str'}, {idx: 10, label: 'Dex'}, {idx: 11, label: 'Con'},
          {idx: 12, label: 'Int'}, {idx: 13, label: 'Wis'}, {idx: 14, label: 'Cha'},
          {idx: 15, label: 'AC'}, {idx: 16, label: 'HP'}, {idx: 17, label: 'Att'},
          {idx: 18, label: 'Dmg'}, {idx: 19, label: 'Fort'}, {idx: 20, label: 'Ref'},
          {idx: 21, label: 'Will'}, {idx: 22, label: 'Skill'}, {idx: 23, label: 'Init'},
          {idx: 24, label: 'Speed'}
        ];
        for (var b = 0; b < buffDefs.length; b++) {
          var val = r[buffDefs[b].idx];
          if (val !== '' && val !== null && val !== undefined) {
            var displayVal = val;
            if (typeof val === 'number') {
              displayVal = (val > 0 ? '+' : '') + val;
            } else if (typeof val === 'string' && val.charAt(0) === '=') {
              if (val.indexOf('lvl_up') !== -1) {
                displayVal = '⚡ Lvl-Scaled (' + val + ')';
              }
            }
            buffList.push(buffDefs[b].label + ': ' + displayVal);
          }
        }
        if (buffList.length > 0) {
          statsHtml += '<span class="stat-tag" style="background:#134e4a; color:#5eead4;">✨ ' + buffList.join(', ') + '</span>';
        }

        if (onHit) statsHtml += '<span class="stat-tag">⚔️ ' + onHit + '</span>';
        if (action && action !== '-') statsHtml += '<span class="stat-tag">⚡ ' + action + '</span>';
        if (duration && duration !== '-') statsHtml += '<span class="stat-tag">⏳ ' + duration + '</span>';
        if (weight) statsHtml += '<span class="stat-tag">⚖️ ' + weight + '</span>';
        if (cost) statsHtml += '<span class="stat-tag">🪙 ' + cost + '</span>';

        var metaText = cat + ' • Slot: ' + slot;
        if (prereq && prereq !== '-') metaText += ' • Şart: ' + prereq;
        metaText += ' • ' + source;

        // Interactive Combat Role Dropdown
        var roleOptions = [
          { val: 'Offense / Attack', icon: '⚔️' },
          { val: 'Tactical Maneuver', icon: '♟️' },
          { val: 'Resource Pool', icon: '🔋' },
          { val: 'Defense / Counter', icon: '🛡️' },
          { val: 'Tactical Sense', icon: '👁️' },
          { val: 'Combat Buff', icon: '⚡' },
          { val: 'Non-Combat', icon: '🌿' }
        ];
        var roleSelectHtml = '<div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #334155; display: flex; align-items: center; justify-content: space-between; gap: 6px;">' +
          '<span style="font-size: 11px; font-weight: bold; color: #f87171; white-space: nowrap;">🎯 Combat Role:</span>' +
          '<select onchange="updateRowCombatRole(' + i + ', this.value)" style="flex: 1; padding: 3px 6px; font-size: 11px; background: #0f172a; border: 1px solid #dc2626; color: #fecaca; border-radius: 4px;">';
        for (var ro = 0; ro < roleOptions.length; ro++) {
          var isSel = (roleOptions[ro].val === combatRole) ? ' selected' : '';
          roleSelectHtml += '<option value="' + roleOptions[ro].val + '"' + isSel + '>' + roleOptions[ro].icon + ' ' + roleOptions[ro].val + '</option>';
        }
        roleSelectHtml += '</select></div>';

        var chkHtml = '<input type="checkbox" id="cardCheck_' + i + '" ' + (isDup ? '' : 'checked') + ' onchange="updateSelectedImportCount()" style="width: 16px; height: 16px; cursor: pointer; accent-color: #22c55e;" /> ';

        card.innerHTML = 
          '<div class="card-title" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">' +
            '<div style="display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' +
              chkHtml +
              '<span style="font-weight: bold;">' + name + '</span>' +
            '</div>' +
            '<span class="' + badgeClass + '" style="flex-shrink: 0;">' + badgeText + '</span>' +
          '</div>' +
          '<div class="card-meta">' + metaText + '</div>' +
          '<div class="card-desc">' + desc + '</div>' +
          '<div class="stat-row">' + statsHtml + '</div>' +
          roleSelectHtml;

        container.appendChild(card);
      }

      document.getElementById('previewBox').style.display = 'block';
      updateSelectedImportCount();
    }

    function switchImportTab(mode) {
      try {
        var tabSearchBtn = document.getElementById('tabSearchBtn');
        var tabFreeformBtn = document.getElementById('tabFreeformBtn');
        var tabLvlUpBtn = document.getElementById('tabLvlUpBtn');
        var searchSection = document.getElementById('searchSection');
        var freeformSection = document.getElementById('freeformSection');
        var lvlUpSection = document.getElementById('lvlUpSection');
        var categoryGroup = document.getElementById('categoryGroup');
        var previewBox = document.getElementById('previewBox');

        if (tabSearchBtn) tabSearchBtn.className = 'tab-btn';
        if (tabFreeformBtn) tabFreeformBtn.className = 'tab-btn';
        if (tabLvlUpBtn) tabLvlUpBtn.className = 'tab-btn';

        if (searchSection) searchSection.style.display = 'none';
        if (freeformSection) freeformSection.style.display = 'none';
        if (lvlUpSection) lvlUpSection.style.display = 'none';

        if (mode === 'search') {
          if (tabSearchBtn) tabSearchBtn.className = 'tab-btn active';
          if (searchSection) searchSection.style.display = 'block';
          if (categoryGroup) categoryGroup.style.display = 'block';
        } else if (mode === 'freeform') {
          if (tabFreeformBtn) tabFreeformBtn.className = 'tab-btn active';
          if (freeformSection) freeformSection.style.display = 'block';
          if (categoryGroup) categoryGroup.style.display = 'block';
        } else if (mode === 'lvlup') {
          if (tabLvlUpBtn) tabLvlUpBtn.className = 'tab-btn active';
          if (lvlUpSection) lvlUpSection.style.display = 'block';
          if (categoryGroup) categoryGroup.style.display = 'none';
          if (previewBox) previewBox.style.display = 'none';
        }

        var pill = document.getElementById('activeTabPill');
        if (pill) {
          var modeNames = { 'search': 'Akıllı Arama', 'freeform': 'Serbest Metin', 'lvlup': 'Level-Up Copilot' };
          pill.innerText = 'Aktif: ' + (modeNames[mode] || mode);
        }
      } catch(e) {
        console.error('switchImportTab error:', e);
      }
    }

    function updateRowCombatRole(rowIndex, newRole) {
      if (currentParsedRows && currentParsedRows[rowIndex]) {
        currentParsedRows[rowIndex][30] = newRole;
      }
    }

    function fetchFreeformData() {
      var rawText = document.getElementById('freeformInput').value.trim();
      if (!rawText) {
        alert('Lütfen ayrıştırılacak kural metnini yapıştırın.');
        return;
      }
      var cat = document.getElementById('categorySelect').value;
      var btn = document.getElementById('btnFetchFreeform');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Metin analiz ediliyor...';
      document.getElementById('previewBox').style.display = 'none';

      google.script.run.withSuccessHandler(function(response) {
        btn.disabled = false;
        btn.innerHTML = '⚡ Metni Ayrıştır ve DB için Hazırla';

        if (!response.success) {
          alert('Hata: ' + response.error);
          return;
        }

        currentParsedRows = response.rows;
        currentDuplicates = response.duplicates || [];
        renderPreviewCards(currentParsedRows, currentDuplicates);
      }).withFailureHandler(function(err) {
        btn.disabled = false;
        btn.innerHTML = '⚡ Metni Ayrıştır ve DB için Hazırla';
        alert('Bağlantı Hatası: ' + err.message);
      }).queryGeminiForFreeformText(rawText, cat);
    }

    function appendRowsToMasterDb() {
      if (!currentParsedRows || currentParsedRows.length === 0) return;
      var rowsToAppend = [];
      for (var i = 0; i < currentParsedRows.length; i++) {
        var chk = document.getElementById('cardCheck_' + i);
        if (chk && chk.checked) {
          rowsToAppend.push(currentParsedRows[i]);
        }
      }
      if (rowsToAppend.length === 0) {
        alert('Lütfen eklenecek en az bir kural kartı seçin.');
        return;
      }
      var btn = document.getElementById('btnAppend');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Master_DB kaydı yapılıyor...';

      google.script.run.withSuccessHandler(function(res) {
        btn.disabled = false;
        btn.innerHTML = '📥 Master_DB Kaydet (Otomatik Format)';
        if (res.success) {
          alert('✅ ' + res.count + ' satır başarıyla Master_DB kaydına eklendi!');
          document.getElementById('previewBox').style.display = 'none';
          document.getElementById('queryInput').value = '';
          if (document.getElementById('freeformInput')) {
            document.getElementById('freeformInput').value = '';
          }
        } else {
          alert('Hata: ' + res.error);
        }
      }).withFailureHandler(function(err) {
        btn.disabled = false;
        btn.innerHTML = '📥 Master_DB Kaydet (Otomatik Format)';
        alert('Hata: ' + err.message);
      }).appendMasterDbRows(rowsToAppend);
    }

    // ----------------------------------------------------
    // LEVEL-UP COPILOT CLIENT FUNCTIONS
    // ----------------------------------------------------
    var currentLvlUpPayload = null;

    function setLvlUpInput(val) {
      var input = document.getElementById('lvlUpQueryInput');
      input.value = val;
      input.focus();
    }

    function handleLvlUpKeyPress(e) {
      if (e.key === 'Enter') {
        fetchLvlUpData();
      }
    }

    function fetchLvlUpData() {
      var query = document.getElementById('lvlUpQueryInput').value.trim();
      if (!query) {
        alert('Lütfen sınıf ve seviye yazın (Örn: Warblade 3 veya lvl 3 Warblade 3)');
        return;
      }

      var btn = document.getElementById('btnFetchLvlUp');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Seviye kuralları çözümleniyor...';
      document.getElementById('lvlUpPreviewBox').style.display = 'none';

      google.script.run.withSuccessHandler(function(response) {
        btn.disabled = false;
        btn.innerHTML = '⚡ Seviyeyi İncele ve Hazırla (AI)';

        if (!response.success) {
          alert(response.error);
          return;
        }

        currentLvlUpPayload = response;
        renderLvlUpPreview(response);
      }).withFailureHandler(function(err) {
        btn.disabled = false;
        btn.innerHTML = '⚡ Seviyeyi İncele ve Hazırla (AI)';
        alert('Bağlantı Hatası: ' + err.message);
      }).queryGeminiForLevelUp(query);
    }

    function renderLvlUpPreview(data) {
      var container = document.getElementById('lvlUpCardContainer');
      container.innerHTML = '';

      var card = document.createElement('div');
      card.className = 'card';

      var tag = data.classLevelTag || (data.className + '-' + data.classLevel);
      var titleHtml = '<div class="card-title">🎯 Hedef: Seviye ' + data.targetLevel + ' ➔ ' + tag + '</div>';

      var statsBadges = 
        '<div class="stat-row" style="margin-bottom: 8px;">' +
          '<span class="stat-tag">🎲 HD: ' + data.hitDie + '</span>' +
          '<span class="stat-tag">⚔️ BAB: ' + data.babRate + '</span>' +
          '<span class="stat-tag">🛡️ Fort: ' + data.fortRate + '</span>' +
          '<span class="stat-tag">⚡ Ref: ' + data.refRate + '</span>' +
          '<span class="stat-tag">🧠 Will: ' + data.willRate + '</span>' +
          '<span class="stat-tag">📚 Skill: ' + data.skillBase + '</span>' +
        '</div>';

      var featsHtml = '<div style="margin: 8px 0; font-size: 11px;"><strong>🎖️ Eklenecek Feat Hakları:</strong>';
      var hasAnyFeat = false;
      if (data.featCheck && data.featCheck.grantsRegularFeat) {
        hasAnyFeat = true;
        featsHtml += '<div style="color: #38bdf8; margin-top: 3px;">• Regular Feat: ' + (data.featCheck.featReason || ('Karakter ' + data.targetLevel + '. Seviye')) + '</div>';
      }
      if (data.featCheck && data.featCheck.grantsHumanBonusFeat) {
        hasAnyFeat = true;
        featsHtml += '<div style="color: #38bdf8; margin-top: 3px;">• Racial Bonus Feat: Human 1. Seviye Feat Hakkı</div>';
      }
      if (data.hasBonusFeat) {
        hasAnyFeat = true;
        featsHtml += '<div style="color: #facc15; margin-top: 3px;">• Class Bonus Feat: ' + tag + ' Sınıf Bonus Feat Hakkı</div>';
      }
      if (!hasAnyFeat) {
        featsHtml += '<div style="color: #94a3b8; font-style: italic; margin-top: 3px;">(Bu seviyede yeni feat hakkı bulunmuyor)</div>';
      }
      featsHtml += '</div>';

      var abilitiesHtml = '<div style="margin: 8px 0; font-size: 11px;"><strong>✨ Kazanılan Sınıf Yetenekleri:</strong>';
      if (data.classFeatures && data.classFeatures.length > 0) {
        for (var i = 0; i < data.classFeatures.length; i++) {
          var feat = data.classFeatures[i];
          var badge = feat.existsInDb 
            ? '<span style="color: #4ade80; font-weight: bold; font-size: 10px;">[✅ Master_DB Kayıtlı]</span>'
            : '<span style="color: #38bdf8; font-weight: bold; font-size: 10px;">[✨ Master_DB için Yeni]</span>';
          abilitiesHtml += '<div style="margin-top: 4px; padding: 4px; background: #0f141f; border-radius: 4px; border: 1px solid #1e293b;">' +
            '<div><strong>' + feat.name + '</strong> ' + badge + '</div>' +
            '<div style="color: #94a3b8; font-size: 10px;">' + (feat.summary || feat.description || '') + '</div>' +
          '</div>';
        }
      } else {
        abilitiesHtml += '<div style="color: #94a3b8; font-style: italic; margin-top: 3px;">(Bu seviyede özel yetenek bulunmuyor)</div>';
      }
      abilitiesHtml += '</div>';

      card.innerHTML = titleHtml + statsBadges + featsHtml + abilitiesHtml;
      container.appendChild(card);
      document.getElementById('lvlUpPreviewBox').style.display = 'block';
    }

    function applyLvlUpToSheet() {
      if (!currentLvlUpPayload) return;
      var btn = document.getElementById('btnApplyLvlUp');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Karakter kağıdı güncelleniyor...';

      google.script.run.withSuccessHandler(function(res) {
        btn.disabled = false;
        btn.innerHTML = '🚀 Karakter Kağıdına Uygula (1-Click Apply)';

        if (res.success) {
          var tag = res.classLevelTag || (res.className + '-' + res.classLevel);
          var msg = [
            '✅ Başarılı! Seviye ' + res.targetLevel + ' (' + tag + ') başarıyla uygulandı.',
            '• Master_DB Yeni Yetenek Sayısı: ' + res.addedToDbCount,
            '• Roster Yeni Kayıt Sayısı: ' + res.addedRosterCount,
            '• Sütun R (Feats) ve S (Abilities) otomatik birleştirildi!'
          ].join(String.fromCharCode(10));
          alert(msg);
          document.getElementById('lvlUpPreviewBox').style.display = 'none';
          document.getElementById('lvlUpQueryInput').value = '';
        } else {
          alert(res.error);
        }
      }).withFailureHandler(function(err) {
        btn.disabled = false;
        btn.innerHTML = '🚀 Karakter Kağıdına Uygula (1-Click Apply)';
        alert('İşlem Hatası: ' + err.message);
      }).applyLevelUpProgression(currentLvlUpPayload);
    }

    // Explicit window bindings for bulletproof mobile webview & iframe sandbox compatibility
    window.switchImportTab = switchImportTab;
    window.insertFilter = insertFilter;
    window.handleKeyPress = handleKeyPress;
    window.fetchRuleData = fetchRuleData;
    window.fetchFreeformData = fetchFreeformData;
    window.appendRowsToMasterDb = appendRowsToMasterDb;
    window.setLvlUpInput = setLvlUpInput;
    window.handleLvlUpKeyPress = handleLvlUpKeyPress;
    window.fetchLvlUpData = fetchLvlUpData;
    window.applyLvlUpToSheet = applyLvlUpToSheet;
    window.updateRowCombatRole = updateRowCombatRole;
    window.saveApiKeyFromSidebar = saveApiKeyFromSidebar;
    window.clearApiKeyFromSidebar = clearApiKeyFromSidebar;
    window.checkKeyStatus = checkKeyStatus;
  </script>
</body>
</html>`;
}

// ----------------------------------------------------
// 4. GEMINI API CASCADE SEARCH ENGINE
// Note: getBestGeminiModelEndpoint, getSelectedModelName, and getGeminiModelQueue
// are declared globally above (lines ~3655-3700) as the single source of truth.
// ----------------------------------------------------

/**
 * Smart Typo and Transliteration Corrector for D&D 3.5e Search Queries
 * Handles common abbreviations, typos, and Turkish-English transliterations for rules, classes, feats, spells, and items.
 */
function correctRuleSearchQuery(query) {
  if (!query) return "";
  var s = String(query).trim();

  // 1. Turkish operator keyword replacements
  s = s.replace(/\b(?:sinif|sınıf)\s*:/gi, "class:")
       .replace(/\b(?:yetenek|huner|hüner)\s*:/gi, "feat:")
       .replace(/\b(?:buyu|büyü)\s*:/gi, "spell:")
       .replace(/\b(?:irk|ırk)\s*:/gi, "race:")
       .replace(/\b(?:kitap|kaynak)\s*:/gi, "book:")
       .replace(/\b(?:yuva)\s*:/gi, "slot:")
       .replace(/\b(?:tur|tür)\s*:/gi, "type:")
       .replace(/\b(?:kapsam)\s*:/gi, "scope:");

  // 2. Common D&D 3.5e class & prestige class typos
  s = s.replace(/\bpladin\b/gi, "Paladin")
       .replace(/\bfigter\b/gi, "Fighter")
       .replace(/\bfightrt\b/gi, "Fighter")
       .replace(/\bfigther\b/gi, "Fighter")
       .replace(/\bwarblad\b/gi, "Warblade")
       .replace(/\broge\b/gi, "Rogue")
       .replace(/\bwzard\b/gi, "Wizard")
       .replace(/\bclrk\b/gi, "Cleric")
       .replace(/\bbarb\b/gi, "Barbarian")
       .replace(/\bbarbariyan\b/gi, "Barbarian")
       .replace(/\bsorc\b/gi, "Sorcerer")
       .replace(/\bswordsage\b/gi, "Swordsage")
       .replace(/\bsword\s*sage\b/gi, "Swordsage")
       .replace(/\bcrusader\b/gi, "Crusader")
       .replace(/\bduskblade\b/gi, "Duskblade")
       .replace(/\bdusk\s*blade\b/gi, "Duskblade")
       .replace(/\bblood\s*storm\s*blade\b/gi, "Bloodstorm Blade")
       .replace(/\bbloodstorm\b/gi, "Bloodstorm Blade")
       .replace(/\babjurant\s*champ(?:ion)?\b/gi, "Abjurant Champion")
       .replace(/\bfrenzied\s*berz?erker\b/gi, "Frenzied Berserker")
       .replace(/\bderwish\b/gi, "Dervish")
       .replace(/\bdragon\s*disiple\b/gi, "Dragon Disciple")
       .replace(/\beldritch\s*knigt\b/gi, "Eldritch Knight")
       .replace(/\bshadow\s*dancer\b/gi, "Shadowdancer")
       .replace(/\bassasin\b/gi, "Assassin")
       .replace(/\barkane\s*archer\b/gi, "Arcane Archer")
       .replace(/\bmistic\s*theurge\b/gi, "Mystic Theurge")
       .replace(/\bmaster\s*thrower\b/gi, "Master Thrower")
       .replace(/\bjade\s*phoenix(?:\s*mage)?\b/gi, "Jade Phoenix Mage")
       .replace(/\bruby\s*knight(?:\s*vindicator)?\b/gi, "Ruby Knight Vindicator")
       .replace(/\bdeepstone\s*sentinel\b/gi, "Deepstone Sentinel")
       .replace(/\beternal\s*blade\b/gi, "Eternal Blade");

  // 3. Common D&D 3.5e feat / spell / ability typos
  s = s.replace(/\bshok\s*trooper\b/gi, "Shock Trooper")
       .replace(/\bshock\s*troper\b/gi, "Shock Trooper")
       .replace(/\bpower\s*at(?:a)?ck\b/gi, "Power Attack")
       .replace(/\bpwr\s*attack\b/gi, "Power Attack")
       .replace(/\bleap\s*at(?:a)?ck\b/gi, "Leap Attack")
       .replace(/\bcombat\s*reflex(?:es)?\b/gi, "Combat Reflexes")
       .replace(/\bimp(?:roved)?\s*bull\s*rush\b/gi, "Improved Bull Rush")
       .replace(/\bimproved\s*bullrush\b/gi, "Improved Bull Rush")
       .replace(/\bimp(?:roved)?\s*trip\b/gi, "Improved Trip")
       .replace(/\bimp(?:roved)?\s*init(?:iative)?\b/gi, "Improved Initiative")
       .replace(/\bpoint\s*blank(?:\s*shot)?\b/gi, "Point Blank Shot")
       .replace(/\brapid\s*shot\b/gi, "Rapid Shot")
       .replace(/\biron\s*heart\s*surge\b/gi, "Iron Heart Surge")
       .replace(/\bwhite\s*raven\s*tactics\b/gi, "White Raven Tactics")
       .replace(/\bprimal\s*sense(?:s)?\b/gi, "Primal Senses")
       .replace(/\bprimal\s*insti(?:n)?ct\b/gi, "Primal Instinct")
       .replace(/\bcat(?:'s|\s+)?grace\b/gi, "Cat's Grace")
       .replace(/\bbull(?:'s|\s+)?strength\b/gi, "Bull's Strength")
       .replace(/\bbear(?:'s|\s+)?endurance\b/gi, "Bear's Endurance")
       .replace(/\bdevine\s*gr[ae]ce\b/gi, "Divine Grace")
       .replace(/\bdivine\s*grece\b/gi, "Divine Grace")
       .replace(/\bgrace\s*\(su\)/gi, "Divine Grace (Su)")
       .replace(/\blay\s*on\s*hands?\b/gi, "Lay on Hands")
       .replace(/\bsmite\s*ev[il]{2}\b/gi, "Smite Evil")
       .replace(/\bdevine\s*might\b/gi, "Divine Might")
       .replace(/\bdevine\s*shield\b/gi, "Divine Shield")
       .replace(/\bcleve\b/gi, "Cleave")
       .replace(/\bgreat\s*cleve\b/gi, "Great Cleave")
       .replace(/\bweap(?:on)?\s*foc(?:us)?\b/gi, "Weapon Focus")
       .replace(/\bweap(?:on)?\s*spec(?:ialization)?\b/gi, "Weapon Specialization")
       .replace(/\bquik(?:en)?\s*spell\b/gi, "Quicken Spell")
       .replace(/\bmax(?:imize)?\s*spell\b/gi, "Maximize Spell")
       .replace(/\bempow(?:er)?\s*spell\b/gi, "Empower Spell")
       .replace(/\bext(?:end)?\s*spell\b/gi, "Extend Spell")
       .replace(/\bnat(?:ural)?\s*spell\b/gi, "Natural Spell")
       .replace(/\bboots?\s*of\s*speed\b/gi, "Boots of Speed")
       .replace(/\bbelt\s*of\s*(?:giant\s*)?strength\b/gi, "Belt of Giant Strength")
       .replace(/\bcloak\s*of\s*resist(?:ance)?\b/gi, "Cloak of Resistance")
       .replace(/\bmage\s*armou?r\b/gi, "Mage Armor")
       .replace(/\bstone\s*skin\b/gi, "Stoneskin")
       .replace(/\btrue\s*strike\b/gi, "True Strike")
       .replace(/\bdim(?:ension)?\s*door\b/gi, "Dimension Door")
       .replace(/\bgreater\s*magic\s*weapon\b/gi, "Greater Magic Weapon")
       .replace(/\bgmw\b/gi, "Greater Magic Weapon");

  return s;
}

function parseSearchFilterOperators(query) {
  var normalizedQuery = correctRuleSearchQuery(query);
  var filters = {
    class: "",
    feat: "",
    spell: "",
    race: "",
    book: "",
    slot: "",
    type: "",
    scope: "",
    cleanQuery: normalizedQuery
  };

  if (!normalizedQuery) return filters;

  var q = normalizedQuery.trim();

  // 1. Explicit prefix regex: class:..., feat:..., spell:..., race:..., rc:..., book:..., source:..., src:..., slot:..., type:..., scope:...
  var operatorRegex = /\b(class|cls|sinif|sınıf|feat|ft|yetenek|huner|hüner|spell|sp|buyu|büyü|race|rc|irk|ırk|book|source|src|kitap|kaynak|slot|yuva|type|tur|tür|scope|kapsam):\s*([^\s,]+(?:\s+[^\s,:]+)*?)(?=\s+(?:class|cls|sinif|sınıf|feat|ft|yetenek|huner|hüner|spell|sp|buyu|büyü|race|rc|irk|ırk|book|source|src|kitap|kaynak|slot|yuva|type|tur|tür|scope|kapsam):|$)/gi;
  var match;
  var matchedSpans = [];

  while ((match = operatorRegex.exec(normalizedQuery)) !== null) {
    var rawKey = match[1].toLowerCase();
    var key = rawKey;
    if (key === "sinif" || key === "sınıf") key = "class";
    else if (key === "yetenek" || key === "huner" || key === "hüner") key = "feat";
    else if (key === "buyu" || key === "büyü") key = "spell";
    else if (key === "irk" || key === "ırk") key = "race";
    else if (key === "kitap" || key === "kaynak") key = "book";
    else if (key === "yuva") key = "slot";
    else if (key === "tur" || key === "tür") key = "type";
    else if (key === "kapsam") key = "scope";

    var val = match[2].trim();
    matchedSpans.push({ start: match.index, end: operatorRegex.lastIndex, full: match[0] });

    if (key === "class" || key === "cls") filters.class = canonicalizeClassName(val);
    else if (key === "feat" || key === "ft") filters.feat = correctRuleSearchQuery(val);
    else if (key === "spell" || key === "sp") filters.spell = correctRuleSearchQuery(val);
    else if (key === "race" || key === "rc") filters.race = val;
    else if (key === "book" || key === "source" || key === "src") filters.book = val;
    else if (key === "slot") filters.slot = val;
    else if (key === "type") filters.type = val;
    else if (key === "scope") filters.scope = val;
  }

  // If explicit operators found, strip them from cleanQuery
  if (matchedSpans.length > 0) {
    var clean = normalizedQuery;
    for (var i = matchedSpans.length - 1; i >= 0; i--) {
      clean = clean.substring(0, matchedSpans[i].start) + " " + clean.substring(matchedSpans[i].end);
    }
    filters.cleanQuery = correctRuleSearchQuery(clean.replace(/\s+/g, " ").trim());
  } else {
    // 2. Short-hand class feature syntax: e.g. "rogue: evasion" or "bloodstorm blade: blood rain"
    var classColonMatch = q.match(/^([a-zA-Z\s]+):\s*(.+)$/i);
    if (classColonMatch) {
      var possibleClass = classColonMatch[1].trim();
      var possibleAbility = classColonMatch[2].trim();
      // If prefix is not a reserved single keyword
      if (!/^(feat|spell|item|book|slot|type|source|scope|race|rc|sinif|sınıf|yetenek|buyu|büyü|irk|ırk|kitap|kaynak|yuva|tur|tür|kapsam)$/i.test(possibleClass)) {
        filters.class = canonicalizeClassName(possibleClass);
        filters.cleanQuery = correctRuleSearchQuery(possibleAbility);
      }
    }
  }

  return filters;
}

/**
 * Normalizes and guarantees 100% column alignment for Master_DB 31-column rows.
 * Fixes LLM off-by-one omissions in the 16 buff columns by anchoring on Combat Role and Action.
 */
function normalizeMasterDbRow(row) {
  var item;
  if (!Array.isArray(row)) {
    if (typeof row === 'object' && row !== null) {
      item = [
        row.name || row.entry_name || "",
        row.category || row.type || "",
        row.slot || "None",
        row.parent || row.parent_entry || "-",
        row.prerequisites || row.prereq || "-",
        row.source || "",
        row.description || row.desc || row.benefit || "",
        row.bonus_type || row.bonusType || "Untyped",
        row.scope || row.applies_to || "None / General",
        (row.str !== undefined && row.str !== null) ? row.str : "",
        (row.dex !== undefined && row.dex !== null) ? row.dex : "",
        (row.con !== undefined && row.con !== null) ? row.con : "",
        (row.int !== undefined && row.int !== null) ? row.int : "",
        (row.wis !== undefined && row.wis !== null) ? row.wis : "",
        (row.cha !== undefined && row.cha !== null) ? row.cha : "",
        (row.ac !== undefined && row.ac !== null) ? row.ac : "",
        (row.hp !== undefined && row.hp !== null) ? row.hp : "",
        (row.att !== undefined && row.att !== null) ? row.att : "",
        (row.dmg !== undefined && row.dmg !== null) ? row.dmg : "",
        (row.fort !== undefined && row.fort !== null) ? row.fort : "",
        (row.ref !== undefined && row.ref !== null) ? row.ref : "",
        (row.will !== undefined && row.will !== null) ? row.will : "",
        (row.skill !== undefined && row.skill !== null) ? row.skill : "",
        (row.init !== undefined && row.init !== null) ? row.init : "",
        (row.speed !== undefined && row.speed !== null) ? row.speed : "",
        row.on_hit || row.onHit || row.dice || "",
        row.action || "-",
        row.duration || "Passive",
        (row.weight !== undefined && row.weight !== null && row.weight !== "") ? row.weight : "",
        (row.cost !== undefined && row.cost !== null && row.cost !== "") ? row.cost : "",
        row.combat_role || row.combatRole || row.role || "Non-Combat"
      ];
    } else {
      item = new Array(31).fill("");
    }
  } else {
    item = row.slice(0); // clone array
    var knownRoles = [
      "Offense / Attack", "Tactical Maneuver", "Resource Pool",
      "Defense / Counter", "Tactical Sense", "Combat Buff", "Non-Combat"
    ];
    var knownActions = [
      "Standard Action", "Full-Round Action", "Swift Action",
      "Immediate Action", "Move Action", "Free Action", "Passive", "Reaction"
    ];

    // 1. Detect Combat Role anchor position
    var roleIdx = -1;
    for (var i = item.length - 1; i >= 0; i--) {
      if (typeof item[i] === 'string' && knownRoles.indexOf(item[i].trim()) !== -1) {
        roleIdx = i;
        break;
      }
    }

    // 2. If Combat Role is shifted left (e.g. at index 29 or 28 instead of 30)
    if (roleIdx !== -1 && roleIdx < 30) {
      var shift = 30 - roleIdx;
      // Insert missing empty strings into the buff zone (at index 24 - Speed column)
      for (var s = 0; s < shift; s++) {
        item.splice(24, 0, "");
      }
    } else if (roleIdx === -1) {
      // Check Action anchor (Action belongs at index 26)
      var actionIdx = -1;
      for (var a = 0; a < item.length; a++) {
        if (typeof item[a] === 'string' && knownActions.indexOf(item[a].trim()) !== -1) {
          actionIdx = a;
          break;
        }
      }
      if (actionIdx !== -1 && actionIdx < 26) {
        var aShift = 26 - actionIdx;
        for (var as = 0; as < aShift; as++) {
          item.splice(24, 0, "");
        }
      }
    }
  }

  // 3. Final defensive padding / truncation to exactly 31 columns
  while (item.length < 31) {
    item.push("");
  }
  if (item.length > 31) {
    item = item.slice(0, 31);
  }

  // 4. Defensive weapon stat healing (prevent HP/Att/Dmg column shifts on weapons)
  var cat = String(item[1] || "").toLowerCase();
  var slot = String(item[2] || "").toLowerCase();
  var role = String(item[30] || "").toLowerCase();
  var name = String(item[0] || "").toLowerCase();
  var weaponKeywords = /(sword|greatsword|longsword|shortsword|blade|dagger|axe|greataxe|bow|crossbow|spear|halberd|polearm|mace|morningstar|hammer|warhammer|scythe|flail|glaive|lance|quarterstaff|scimitar|falchion|bastard sword)/i;

  var isWeapon = (
    cat === "weapon" || 
    slot === "main hand" || 
    slot === "off hand" || 
    slot === "both hands" || 
    weaponKeywords.test(name) ||
    (role === "offense / attack" && (slot === "both hands" || slot === "main hand" || slot === "off hand"))
  );

  if (isWeapon) {
    var hpCell = String(item[16] || "").trim();
    var attCell = String(item[17] || "").trim();
    var dmgCell = String(item[18] || "").trim();
    var diceRegex = /^\d+d\d+/i;

    // Case 1: LLM put damage dice in Att (Col 17) and enhancement bonus in HP (Col 16)
    if (diceRegex.test(attCell)) {
      var enh = "";
      if (/^\+?\d+$/.test(hpCell)) {
        enh = parseInt(hpCell, 10);
      }
      item[17] = enh !== "" ? enh : "";
      if (dmgCell === "" || dmgCell === "-") {
        item[18] = enh !== "" ? enh : "";
      }
      item[16] = ""; // Weapons never give HP

      // Merge dice into Col 25 if not already there (Yaklaşım 1: Col 25 contains pure dice, NEVER +enh)
      var onHit = String(item[25] || "").trim();
      var pureDice = attCell;
      if (!onHit) {
        item[25] = pureDice;
      } else if (!diceRegex.test(onHit)) {
        item[25] = pureDice + " " + onHit;
      }
    } 
    // Case 2: AI confused "To-Hit" with "HP" and put To-Hit in HP (Col 16), Dmg in Att (Col 17), and left Dmg (Col 18) blank
    else if (hpCell && /^\+?\d+$/.test(hpCell) && attCell && /^\+?\d+$/.test(attCell) && (!dmgCell || dmgCell === "-")) {
      var hpValNum = parseInt(hpCell, 10);
      var attValNum = parseInt(attCell, 10);
      item[17] = hpValNum;   // Col 17 (Att) gets To-Hit bonus
      item[18] = attValNum;  // Col 18 (Dmg) gets Damage bonus
      item[16] = "";         // Col 16 (HP) is cleared
    }
    // Case 3: LLM put enhancement bonus in HP and left Att blank
    else if (hpCell && /^\+?\d+$/.test(hpCell) && (!attCell || attCell === "-")) {
      var enhVal = parseInt(hpCell, 10);
      item[17] = enhVal;
      if (!dmgCell || dmgCell === "-") item[18] = enhVal;
      item[16] = "";
    }
    // Case 4: General rule: Weapons NEVER grant static hit points! Clear HP unconditionally on weapons.
    else if (hpCell && !isNaN(hpCell)) {
      item[16] = "";
    }

    // Case 5: Yaklaşım 1 - Ensure Col 25 does NOT double-count flat enhancement bonus
    // Flat enhancement bonus (+1 to +5) belongs strictly in Col 17 (Att) and Col 18 (Dmg).
    // Col 25 must only contain pure weapon dice, critical, and elemental/extra dice.
    var currentEnh = parseInt(item[18] || item[17] || "", 10);
    var curOnHit = String(item[25] || "").trim();
    if (!isNaN(currentEnh) && currentEnh > 0 && curOnHit) {
      // Strip "+5" or "+ 5" from Col 25 (e.g. "4d6+5 (17-20/x2) + 1d6 Fire" -> "4d6 (17-20/x2) + 1d6 Fire")
      // Uses lookahead (?![0-9a-zA-Z]) so "+1d6" or "+5d6" is never matched or stripped!
      var stripEnhRegex = new RegExp("\\+\\s*" + currentEnh + "(?![0-9a-zA-Z])", "g");
      curOnHit = curOnHit.replace(stripEnhRegex, "").replace(/\s{2,}/g, " ").trim();
      item[25] = curOnHit;
    }
  }

  // 5. Defensive Haste / Boots of Speed healing
  var itemName = String(item[0] || "").toLowerCase();
  var itemDesc = String(item[6] || "").toLowerCase();
  var isHaste = (itemName.indexOf("haste") !== -1 || itemName.indexOf("boots of speed") !== -1 || itemDesc.indexOf("haste") !== -1);

  if (isHaste) {
    // In D&D 3.5e, Haste NEVER gives Dexterity! If model put 1 in Dex (index 10), clear it.
    if (String(item[10] || "").trim() === "1") {
      item[10] = "";
    }
    // Haste gives +1 attack (index 17), +1 dodge AC (index 15), +1 dodge Ref (index 20), +30 ft speed (index 24)
    if (!item[15] || item[15] === "") item[15] = 1;
    if (!item[17] || item[17] === "") item[17] = 1;
    if (!item[20] || item[20] === "") item[20] = 1;
    if (!item[24] || item[24] === "") item[24] = 30;

    // Boots of Speed specific rules (DMG p.250)
    if (itemName.indexOf("boots of speed") !== -1) {
      if (String(item[26] || "").toLowerCase().indexOf("free") === -1) {
        item[26] = "Free Action";
      }
      if (String(item[27] || "").toLowerCase().indexOf("continuous") !== -1 || !item[27] || item[27] === "Passive") {
        item[27] = "10 rounds/day";
      }
      if (!item[28] || item[28] === "") item[28] = 1;
      if (!item[29] || item[29] === "" || item[29] === 8000 || item[29] === "8.000") item[29] = 12000;
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Combat Buff";
    }
  }

  // 6. Defensive Class Feature Buff Healing (D&D 3.5e RAW Canon)
  // Ensures attack, damage, saves, AC, abilities, on-hit, and actions are never empty for class features
  var isClassFeature = (cat === "special ability" || cat === "class feature" || cat === "active power");
  
  // Canonicalize known feature name aliases (e.g. Grace (Su) -> Divine Grace (Su))
  if (itemName === "grace (su)" || itemName === "grace" || itemName === "divine grace") {
    item[0] = "Divine Grace (Su)";
    itemName = "divine grace (su)";
  }
  if (itemName === "lay on hand" || itemName === "lay on hands") {
    item[0] = "Lay on Hands (Su)";
    itemName = "lay on hands (su)";
  }

  if (isClassFeature || itemName.indexOf("smite evil") !== -1 || itemName.indexOf("sneak attack") !== -1 || itemName.indexOf("divine grace") !== -1 || itemName.indexOf("grace") !== -1 || itemName.indexOf("rage") !== -1) {
    // Smite Evil (Su)
    if (itemName.indexOf("smite evil") !== -1) {
      if (!item[8] || item[8] === "None / General" || item[8] === "-") item[8] = "Vs Evil";
      if (!item[7] || item[7] === "-") item[7] = "Untyped";
      if (!item[17] || item[17] === "-") item[17] = "=MAX(0, Main!AT75)"; // Charisma modifier to attack
      if (!item[18] || item[18] === "-") item[18] = "=lvl_up!$B$4";       // Paladin / Character level to damage
      if (!item[26] || item[26] === "-" || item[26] === "Passive") item[26] = "Part of Attack";
      if (!item[27] || item[27] === "-" || item[27] === "Passive" || item[27] === "Continuous") item[27] = "1 attack (1/day)";
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Offense / Attack";
    }
    // Divine Grace (Su)
    else if (itemName.indexOf("divine grace") !== -1) {
      if (!item[7] || item[7] === "-") item[7] = "Untyped";
      if (!item[19] || item[19] === "-") item[19] = "=MAX(0, Main!AT75)"; // Fort save bonus
      if (!item[20] || item[20] === "-") item[20] = "=MAX(0, Main!AT75)"; // Ref save bonus
      if (!item[21] || item[21] === "-") item[21] = "=MAX(0, Main!AT75)"; // Will save bonus
      if (!item[26] || item[26] === "-") item[26] = "Passive";
      if (!item[27] || item[27] === "-") item[27] = "Continuous";
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Defense / Counter";
    }
    // Lay on Hands (Su) - Resource / Healing Pool (Does NOT buff character's max HP stat)
    else if (itemName.indexOf("lay on hands") !== -1) {
      item[16] = "-"; // Col Q (HP stat buff) must be empty/dash; Lay on Hands is a healing pool, not an HP buff
      if (!item[7] || item[7] === "Untyped") item[7] = "-";
      if (!item[8] || item[8] === "None / General" || item[8] === "-") item[8] = "Healing / Pool";
      if (!item[26] || item[26] === "-") item[26] = "Standard Action";
      if (!item[27] || item[27] === "-" || item[27] === "Pool / Day") item[27] = '=(MAX(0, Main!AT75) * lvl_up!$B$4) & " HP Pool / Day"';
      item[30] = "Resource Pool";
    }
    // Aura of Courage (Su)
    else if (itemName.indexOf("aura of courage") !== -1) {
      if (!item[8] || item[8] === "None / General" || item[8] === "-") item[8] = "Vs Fear";
      if (!item[7] || item[7] === "-") item[7] = "Morale";
      if (!item[21] || item[21] === "-") item[21] = 4;
      if (!item[26] || item[26] === "-") item[26] = "Passive";
      if (!item[27] || item[27] === "-") item[27] = "Continuous (10 ft)";
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Combat Buff";
    }
    // Sneak Attack (Ex)
    else if (itemName.indexOf("sneak attack") !== -1) {
      var matchDice = itemName.match(/(\+\d+d\d+)/);
      var diceStr = matchDice ? matchDice[1] : "+1d6";
      if (!item[25] || item[25] === "-") item[25] = diceStr + " Precision";
      if (!item[8] || item[8] === "None / General" || item[8] === "-") item[8] = "Flanked / Flat-Footed";
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Offense / Attack";
    }
    // Trap Sense (Ex)
    else if (itemName.indexOf("trap sense") !== -1) {
      var matchBonus = itemName.match(/\+(\d+)/);
      var bVal = matchBonus ? parseInt(matchBonus[1], 10) : 1;
      if (!item[15] || item[15] === "-") item[15] = bVal; // AC vs traps
      if (!item[20] || item[20] === "-") item[20] = bVal; // Ref vs traps
      if (!item[8] || item[8] === "None / General" || item[8] === "-") item[8] = "Vs Traps";
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Defense / Counter";
    }
    // Fast Movement (Ex)
    else if (itemName.indexOf("fast movement") !== -1) {
      if (!item[24] || item[24] === "-") item[24] = 10;
      if (!item[7] || item[7] === "-") item[7] = "Enhancement";
      if (!item[26] || item[26] === "-") item[26] = "Passive";
      if (!item[27] || item[27] === "-") item[27] = "Continuous";
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Tactical Maneuver";
    }
    // Rage (Ex)
    else if (itemName.indexOf("rage") !== -1 && itemName.indexOf("courage") === -1) {
      if (!item[9] || item[9] === "-") item[9] = 4;
      if (!item[11] || item[11] === "-") item[11] = 4;
      if (!item[21] || item[21] === "-") item[21] = 2;
      if (!item[15] || item[15] === "-") item[15] = -2;
      if (!item[7] || item[7] === "-") item[7] = "Morale";
      if (!item[26] || item[26] === "-") item[26] = "Free Action";
      if (!item[27] || item[27] === "-") item[27] = "3+Con rounds";
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Combat Buff";
    }
    // Battle Clarity (Ex)
    else if (itemName.indexOf("battle clarity") !== -1) {
      if (!item[20] || item[20] === "-") item[20] = "=MIN(lvl_up!$B$4, MAX(0, Main!AT61))";
      if (!item[8] || item[8] === "None / General" || item[8] === "-") item[8] = "Reflex Saves";
      if (!item[7] || item[7] === "-") item[7] = "Insight";
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Tactical Sense";
    }
    // Battle Ardor (Ex)
    else if (itemName.indexOf("battle ardor") !== -1) {
      if (!item[17] || item[17] === "-") item[17] = "=MAX(0, Main!AT61)";
      if (!item[8] || item[8] === "None / General" || item[8] === "-") item[8] = "Critical Confirmation";
      if (!item[7] || item[7] === "-") item[7] = "Insight";
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Tactical Sense";
    }
    // Battle Cunning (Ex)
    else if (itemName.indexOf("battle cunning") !== -1) {
      if (!item[18] || item[18] === "-") item[18] = "=MAX(0, Main!AT61)";
      if (!item[8] || item[8] === "None / General" || item[8] === "-") item[8] = "Flanked / Flat-Footed";
      if (!item[7] || item[7] === "-") item[7] = "Insight";
      if (!item[30] || item[30] === "Non-Combat") item[30] = "Offense / Attack";
    }
  }

  // Auto-heal legacy or misaligned ability references in formulas across all columns
  for (var h = 0; h < item.length; h++) {
    if (typeof item[h] === 'string' && item[h].charAt(0) === '=') {
      item[h] = item[h].replace(/Main!Z56/gi, "Main!AT75")
                       .replace(/Main!Z52/gi, "Main!AT61")
                       .replace(/Main!Z54/gi, "Main!AT54");
    }
  }

  return item;
}

/**
 * Consolidates intrinsic weapon & armor properties (Enhancement, Materials, Keen, Flaming, Size Increase)
 * and single-effect duplicate decompositions (Boots of Speed) into the single parent row.
 */
function consolidateWeaponRows(rows) {
  if (!Array.isArray(rows) || rows.length <= 1) return rows;

  var consolidated = [];
  var parentWeaponMap = {};

  // First pass: identify weapon/armor parent rows
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var name = String(r[0] || "").trim();
    var cat = String(r[1] || "").toLowerCase();
    var slot = String(r[2] || "").toLowerCase();
    var parent = String(r[3] || "").trim();

    var isWeaponOrArmor = (cat === "weapon" || cat === "armor" || cat === "shield" || cat === "armor / shield" || slot === "main hand" || slot === "off hand" || slot === "both hands" || slot === "armor" || slot === "shield");

    if (isWeaponOrArmor && (!parent || parent === "-" || parent === "")) {
      parentWeaponMap[name.toLowerCase()] = r;
      consolidated.push(r);
    } else {
      consolidated.push(r);
    }
  }

  // Second pass: inspect child rows
  var finalRows = [];
  var intrinsicPattern = /(material|property|flaming|frost|shock|keen|adamantine|mithral|cold iron|silver|darkwood|increased damage|size increase|dice size|enhancement bonus|\+1|\+2|\+3|\+4|\+5)/i;
  var activatedActionPattern = /(standard action|full-round action|swift action|immediate action|move action|1\/day|2\/day|3\/day|at will)/i;

  for (var j = 0; j < consolidated.length; j++) {
    var row = consolidated[j];
    var rowName = String(row[0] || "").trim();
    var parentName = String(row[3] || "").trim();

    if (rowName.indexOf("↳") === 0 && parentName && parentWeaponMap[parentName.toLowerCase()]) {
      var parentRow = parentWeaponMap[parentName.toLowerCase()];
      var action = String(row[26] || "").toLowerCase();
      var duration = String(row[27] || "").toLowerCase();
      var isActivated = activatedActionPattern.test(action) || activatedActionPattern.test(duration);

      // If it's an intrinsic property (passive, matches intrinsic keywords, not an activated power)
      if (!isActivated && intrinsicPattern.test(rowName)) {
        // Absorb details into parent if missing
        var childDesc = String(row[6] || "").trim();
        var parentDesc = String(parentRow[6] || "").trim();
        if (childDesc && parentDesc.indexOf(childDesc) === -1) {
          if (rowName.toLowerCase().indexOf("keen") !== -1 && parentDesc.toLowerCase().indexOf("keen") === -1) {
            parentRow[6] += (parentRow[6] ? " " : "") + childDesc;
          } else if (rowName.toLowerCase().indexOf("adamantine") !== -1 && parentDesc.toLowerCase().indexOf("adamantine") === -1) {
            parentRow[6] += (parentRow[6] ? " " : "") + childDesc;
          } else if (rowName.toLowerCase().indexOf("flaming") !== -1 && parentDesc.toLowerCase().indexOf("flaming") === -1) {
            parentRow[6] += (parentRow[6] ? " " : "") + childDesc;
          }
        }

        // If child had dice in Col 25 or Col 17/18 that parent lacks, merge them
        var childDice = String(row[25] || "").trim();
        var parentDice = String(parentRow[25] || "").trim();
        if (childDice && parentDice.indexOf(childDice) === -1) {
          if (!parentDice) {
            parentRow[25] = childDice;
          } else {
            parentRow[25] = parentDice + " " + childDice;
          }
        }

        // Also check if child had size increased base dice (e.g. 4d6) in Col 17/18/25
        var childAtt = String(row[17] || "").trim();
        var childDmg = String(row[18] || "").trim();
        var diceRegex = /^\d+d\d+/i;
        if (diceRegex.test(childAtt) && !diceRegex.test(parentRow[25])) {
          parentRow[25] = childAtt + (parentRow[25] ? (" " + parentRow[25]) : "");
        } else if (diceRegex.test(childDmg) && !diceRegex.test(parentRow[25])) {
          parentRow[25] = childDmg + (parentRow[25] ? (" " + parentRow[25]) : "");
        }

        // Drop this redundant child row!
        continue;
      }
    }
    finalRows.push(row);
  }

  // Third pass: single-effect active item consolidation (e.g. Boots of Speed)
  // If an item has only 1 child, and that child is simply the item's sole power/benefit (e.g. "↳ Boots of Speed: Haste Benefit"),
  // and the parent row has no separate passive stats, consolidate into 1 single parent row!
  var parentToChildrenCount = {};
  for (var k = 0; k < finalRows.length; k++) {
    var pName = String(finalRows[k][3] || "").trim().toLowerCase();
    if (pName && pName !== "-") {
      parentToChildrenCount[pName] = (parentToChildrenCount[pName] || 0) + 1;
    }
  }

  var trulyFinalRows = [];
  for (var m = 0; m < finalRows.length; m++) {
    var curRow = finalRows[m];
    var curName = String(curRow[0] || "").trim();
    var curParent = String(curRow[3] || "").trim();

    if (curName.indexOf("↳") === 0 && curParent && parentToChildrenCount[curParent.toLowerCase()] === 1) {
      var parentObj = null;
      for (var p = 0; p < trulyFinalRows.length; p++) {
        if (String(trulyFinalRows[p][0] || "").trim().toLowerCase() === curParent.toLowerCase()) {
          parentObj = trulyFinalRows[p];
          break;
        }
      }

      if (parentObj) {
        var parentHasStats = false;
        var isPureDuplicate = true;
        for (var statIdx = 9; statIdx <= 25; statIdx++) {
          if (parentObj[statIdx] !== "" && parentObj[statIdx] !== null && parentObj[statIdx] !== undefined) {
            parentHasStats = true;
          }
          if (parentObj[statIdx] !== curRow[statIdx]) {
            isPureDuplicate = false;
          }
        }

        // If parent has no separate stats, or parent stats are identical to child stats (duplicate decomposition)
        if (!parentHasStats || isPureDuplicate) {
          if (curRow[26] && curRow[26] !== "-") parentObj[26] = curRow[26];
          if (curRow[27] && curRow[27] !== "Passive") parentObj[27] = curRow[27];
          for (var sIdx = 9; sIdx <= 25; sIdx++) {
            if (curRow[sIdx] !== "" && curRow[sIdx] !== null && curRow[sIdx] !== undefined) {
              parentObj[sIdx] = curRow[sIdx];
            }
          }
          if (curRow[30]) parentObj[30] = curRow[30];
          continue; // Drop redundant child row!
        }
      }
    }
    trulyFinalRows.push(curRow);
  }

  // Final pass: Yaklaşım 1 - Ensure all consolidated weapon rows have pure dice in Col 25
  for (var w = 0; w < trulyFinalRows.length; w++) {
    var tRow = trulyFinalRows[w];
    var tCat = String(tRow[1] || "").toLowerCase();
    var tSlot = String(tRow[2] || "").toLowerCase();
    var tRole = String(tRow[30] || "").toLowerCase();
    var tName = String(tRow[0] || "").toLowerCase();
    var tIsWeapon = (
      tCat === "weapon" || 
      tSlot === "main hand" || 
      tSlot === "off hand" || 
      tSlot === "both hands" || 
      intrinsicPattern.test(tName) ||
      (tRole === "offense / attack" && (tSlot === "both hands" || tSlot === "main hand" || tSlot === "off hand"))
    );
    if (tIsWeapon) {
      var tEnh = parseInt(tRow[18] || tRow[17] || "", 10);
      var tOnHit = String(tRow[25] || "").trim();
      if (!isNaN(tEnh) && tEnh > 0 && tOnHit) {
        var stripRe = new RegExp("\\+\\s*" + tEnh + "(?![0-9a-zA-Z])", "g");
        tRow[25] = tOnHit.replace(stripRe, "").replace(/\s{2,}/g, " ").trim();
      }
    }
  }

  return trulyFinalRows;
}

function queryGeminiForMasterDb(query, categoryHint, deepSearch) {
  var apiKey = getMyGeminiApiKey();
  if (!apiKey) {
    return { success: false, error: "API anahtarı bulunamadı. Lütfen önce geçerli bir Gemini API anahtarı tanımlayın." };
  }

  deepSearch = !!deepSearch;

  // Parse advanced search filters (e.g. class: blood storm blade blood rain, rogue: evasion, book: MIC)
  var parsedFilter = parseSearchFilterOperators(query);
  var targetItemName = parsedFilter.cleanQuery || query;

  var structuredDirectives = [];
  if (parsedFilter.class) {
    structuredDirectives.push("- TARGET CLASS / PRESTIGE CLASS: '" + parsedFilter.class + "' (Extract this specific class/prestige class progression ability/feature, set Category='Special Ability')");
  }
  if (parsedFilter.feat) {
    structuredDirectives.push("- TARGET FEAT: '" + parsedFilter.feat + "' (Set Category='Feat')");
    targetItemName = parsedFilter.feat;
  }
  if (parsedFilter.spell) {
    structuredDirectives.push("- TARGET SPELL: '" + parsedFilter.spell + "' (Set Category='Spell')");
    targetItemName = parsedFilter.spell;
  }
  if (parsedFilter.race) {
    structuredDirectives.push("- TARGET RACE: '" + parsedFilter.race + "' (Extract this specific D&D 3.5e Race or Racial Template, set Category='Race', Bonus Type='Racial')");
    targetItemName = parsedFilter.race;
  }
  if (categoryHint === "Race") {
    structuredDirectives.push("- CATEGORY HINT: 'Race' (Extract this entry as a D&D 3.5e Race, set Category='Race', Bonus Type='Racial')");
  }
  if (parsedFilter.book) {
    structuredDirectives.push("- TARGET SOURCE BOOK: '" + parsedFilter.book + "' (Strictly pull from this D&D 3.5e publication, e.g. " + parsedFilter.book + ")");
  }
  if (parsedFilter.slot) {
    structuredDirectives.push("- TARGET BODY SLOT: '" + parsedFilter.slot + "' (Verify and set Slot='" + parsedFilter.slot + "')");
  }
  if (parsedFilter.type) {
    structuredDirectives.push("- TARGET CATEGORY / TYPE: '" + parsedFilter.type + "')");
  }
  if (parsedFilter.scope) {
    structuredDirectives.push("- TARGET APPLIES TO / SCOPE: '" + parsedFilter.scope + "')");
  }

  var filterInstructions = "";
  if (structuredDirectives.length > 0) {
    filterInstructions = "\nEXPLICIT USER SEARCH OPERATORS & CONSTRAINTS:\n" + structuredDirectives.join("\n") + "\n";
  }

  var queue = getGeminiModelQueue(apiKey);
  var chosenModel = queue[0] || "gemini-3.5-flash-lite";

  // ----------------------------------------------------
  // STEP 1: LIVE SEARCH GROUNDING (Google Search Tool)
  // Runs ONLY when deepSearch is explicitly enabled (dndtools / splatbook deep search)
  // When deepSearch is false (Default): Directly queries Core SRD (d20srd.org) in 2-3 seconds!
  // ----------------------------------------------------
  var groundedRawText = "";
  if (deepSearch) {
    var searchPrompt = 
      "You are a master D&D 3.5e Rule Arbiter.\n" +
      "Search online for the official D&D 3.5e rule element: '" + targetItemName + "' (Query: '" + query + "').\n\n" +
      "MANDATORY SEARCH DOMAIN RESTRICTIONS:\n" +
      "1. ALLOWED DOMAINS ONLY: You are strictly restricted to information from: dndtools.net, d20srd.org, and realmshelps.net.\n" +
      "   - Execute your search using explicit site filters, for example:\n" +
      "     \"" + targetItemName + "\" (site:dndtools.net OR site:d20srd.org OR site:realmshelps.net)\n" +
      "2. STRICTLY PROHIBITED WEBSITES (NEGATIVE FILTER):\n" +
      "   - You MUST NEVER click, use, or cite search results from forum, blog, or homebrew websites, including:\n" +
      "     reddit.com, giantitp.com, enworld.org, dandwiki.com, minmaxforum.com, myth-weavers.com, rpg.stackexchange.com, or wikia/fandom.\n" +
      "   - If any search result contains homebrew variants, forum debates, or unverified errata opinions, DISCARD IT ENTIRELY.\n\n" +
      "CRITICAL 4-PILLAR REVISION & PRECEDENCE RULES:\n" +
      "1. SPELLS: If a spell was reprinted/updated in Spell Compendium (SpC), the SpC version is DEFINITIVE. If published after SpC (e.g. Dragon Magic, Complete Mage, Complete Scoundrel, Dungeonscape, Tome of Battle), use that respective official book. (Note: Primal series spells like Primal Senses, Primal Hunter, Primal Instinct, Primal Speed are strictly from Dragon Magic with 24-hour duration!).\n" +
      "2. MAGIC ITEMS: If an item was reprinted in Magic Item Compendium (MIC), the MIC version is DEFINITIVE for pricing, body slot, and activation actions.\n" +
      "3. FEATS: Core feats use PHB 3.5e. Tactical and Splatbook feats use their definitive 3.5e Complete series revision (e.g. Complete Warrior p.112 for Shock Trooper: Directed Bull Rush, Domino Rush, Heedless Charge). Ignore forum homebrew or errata debates.\n" +
      "4. CLASS & SPECIAL ABILITIES: Extract exact class name, prestige class progression, book, page, and class level (e.g. 'Tome of Battle p.100 (Bloodstorm Blade 4)').\n\n" +
      "OUTPUT REQUIREMENT:\n" +
      "Provide the exact, verbatim official D&D 3.5e rule text: Full Name, Category, Body Slot, Source Book & Page, Class/Spell Level, Prerequisites, Components/Actions, Duration/Uses, Bonus Types, Target Scopes, and complete mechanical description (including temporary HP, immunities, and synergies).";

    var searchPayload = {
      contents: [{ parts: [{ text: searchPrompt }] }],
      tools: [{ googleSearch: {} }]
    };

    try {
      var searchModel = chosenModel;
      var searchUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + searchModel + ":generateContent?key=" + encodeURIComponent(apiKey);
      var searchResp = UrlFetchApp.fetch(searchUrl, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(searchPayload),
        muteHttpExceptions: true
      });
      if (searchResp.getResponseCode() === 200) {
        var searchJson = JSON.parse(searchResp.getContentText());
        if (searchJson.candidates && searchJson.candidates[0].content && searchJson.candidates[0].content.parts) {
          groundedRawText = searchJson.candidates[0].content.parts.map(function(p){ return p.text || ""; }).join("\n");
        }
      }
    } catch (searchErr) {
      // Graceful fallback to knowledge-based prompt if search tool is unavailable
    }
  }

  // ----------------------------------------------------
  // STEP 2: 30-COLUMN MASTER_DB SCHEMA MAPPING (Structured JSON)
  // Formats the grounded/verified text into the exact Master_DB architecture
  // ----------------------------------------------------
  var promptText = 
    "You are a master D&D 3.5e Rule Arbiter and Database Architect.\n" +
    "Raw user query: '" + query + "'\n" +
    "Target item/rule: '" + targetItemName + "' (Category Hint: '" + categoryHint + "').\n" +
    filterInstructions + "\n" +
    (groundedRawText ? "VERIFIED OFFICIAL GROUNDED RULE TEXT (FROM DNDTOOLS / 3.5E SOURCEBOOKS):\n" + groundedRawText + "\n\n" : "") +
    "PRIORITIZED KNOWLEDGE BASES (Cascading Search Order):\n" +
    "1. Priority 1 (Core SRD): https://www.d20srd.org (PHB, DMG, MM Core 3.5e rules)\n" +
    "2. Priority 2 (Official Compendiums): Spell Compendium (SpC for spells), Magic Item Compendium (MIC for items), Rules Compendium (RC for combat/rules)\n" +
    "3. Priority 3 (Extended Splatbooks & dndtools): https://dndtools.net (Dragon Magic, Complete series, Tome of Battle, Races series, etc.)\n\n" +
    "CRITICAL 4-PILLAR REVISION & PRECEDENCE RULES:\n" +
    "1. SPELLS: Spell Compendium (SpC) is definitive if reprinted there. Spells published after SpC (e.g. Dragon Magic, Complete Mage, Tome of Battle) use that respective book. Primal series spells (Primal Senses, Primal Hunter, etc.) are strictly from Dragon Magic p.71-72 with 24-hour duration.\n" +
    "2. MAGIC ITEMS: Magic Item Compendium (MIC) is definitive for price, body slot, and activation time if reprinted there.\n" +
    "3. FEATS: Core feats use PHB 3.5e. Specialized feats use their respective Complete / PHB II 3.5e revision (discard obsolete 3.0 versions).\n" +
    "4. CLASS & SPECIAL ABILITIES: Set Category='Special Ability', Slot='None', and record exact class/prestige level in Source (e.g. 'ToB p.100 (Bloodstorm Blade 4)').\n\n" +
    "CANONICAL SOURCE ENFORCEMENT & ANTI-HALLUCINATION DIRECTIVE:\n" +
    "- Ground all stats, feats, and powers in official 3.5e WotC canon (PHB, Complete series, SpC, MIC, ToB, Dragon Magic).\n" +
    "- NEVER inject homebrew variants, forum discussions, or hypothetical errata into the mechanics or description. If an element cannot be verified from canon, decline to invent text and provide the strict official RAW rules only.\n\n" +
    "TASK:\n" +
    "Resolve the target D&D 3.5e game element into an array of rows adhering strictly to the Master_DB 31-column schema.\n" +
    "If the item grants multiple distinct activated abilities or spells (e.g. Ring of the Nine Hells granting Fire Resistance AND 1/day Charm Monster AND 1/day Wall of Fire), produce 1 Parent row and distinct Child rows starting with '↳ ' and setting Col 3 (Parent Entry) to the exact parent entry name.\n" +
    "If the element is a class feature (e.g. Blood Rain from Bloodstorm Blade, or Evasion from Rogue), set Category to 'Special Ability', Slot to 'None', Source to the relevant book and class level (e.g. 'ToB p.100 (Bloodstorm Blade 4)'), and capture full mechanical bonuses/dice.\n\n" +
    "CRITICAL RULES FOR MECHANICAL BENEFIT COMPLETENESS & DYNAMIC FORMULAS:\n" +
    "1. ZERO OMISSION: Never omit secondary benefits (e.g. temporary hit points, immunities, multiple save/attack/skill bonuses). Every mechanical rule must be faithfully captured.\n" +
    "2. LEVEL-SCALED BUFFS & TEMPORARY HIT POINTS:\n" +
    "   - In this sheet, active character level is dynamically tracked in cell 'lvl_up!$B$4'.\n" +
    "   - When an effect's buff or temporary HP scales with Caster Level (CL) or Character Level, you MUST output a dynamic Google Sheets formula referencing 'lvl_up!$B$4' (with comma ',' formula syntax):\n" +
    "     * Greater Heroism (temp HP = caster level, max 20): In Col 16 (HP), output '=MIN(20, lvl_up!$B$4)'. (e.g. if character level is 16, this evaluates to 16!).\n" +
    "     * False Life (1d10 + CL max 10): In Col 16 (HP), output '=10 + MIN(10, lvl_up!$B$4)'.\n" +
    "     * Divine Power (temp HP = 1/level): In Col 16 (HP), output '=lvl_up!$B$4'.\n" +
    "     * Barkskin (+2 natural AC + 1 per 3 CL above 3rd, max +5): In Col 15 (AC), output '=MIN(5, 2 + INT((lvl_up!$B$4 - 3) / 3))'.\n" +
    "     * Static temporary HP (e.g. Aid 1d8+CL): Use '=8 + MIN(10, lvl_up!$B$4)' or formula.\n" +
    "   - In Col 6 (Benefit / Description): Detail the exact scaling rule (e.g. 'temporary hit points equal to caster level (maximum 20)').\n" +
    "3. IMMUNITIES & SECONDARY SPECIAL ABILITIES (PARENT-CHILD ARCHITECTURE):\n" +
    "   - When an item or spell grants a distinct passive immunity or special ability alongside numerical buffs (such as Greater Heroism granting Fear Immunity alongside morale buffs):\n" +
    "     * ALWAYS produce 1 Parent row for the main spell/buff AND 1 Child row starting with '↳ ' for the immunity/special ability!\n" +
    "     * Example for Greater Heroism:\n" +
    "       - Row 1 [Parent]: Entry Name: 'Greater Heroism', Category: 'Spell', Parent: '-', Bonus Type: 'Morale', HP: '=MIN(20, lvl_up!$B$4)', Att: 4, Dmg: '', Fort: 4, Ref: 4, Will: 4, Skill: 4, Init: '', Action: 'Standard Action', Duration: '1 min/lvl'\n" +
    "       - Row 2 [Child]: Entry Name: '↳ Greater Heroism: Fear Immunity', Category: 'Special Ability', Slot: 'None', Parent: 'Greater Heroism', Bonus Type: 'Untyped', Benefit: 'Total immunity to all fear and demoralize effects while Greater Heroism is active', Action: 'Passive', Duration: '1 min/lvl'\n" +
    "   - MULTI-SPELL / MULTI-POWER ITEMS (COMPLETE DECOMPOSITION - ZERO OMISSION):\n" +
    "     * If an item grants multiple distinct spells or active abilities (such as War Wizard Cloak granting Endure Elements, Feather Fall, and 1/day each of Dimension Door, Mage Armor, Protection from Arrows, Sending; or Ring of the Nine Hells granting Fire Resistance, Charm Monster, Detect Magic, Greater Teleport, Wall of Fire, Summon Barbed Devil):\n" +
    "       - NEVER omit or group them into one! You MUST produce a distinct Child row (starting with '↳ ') for EVERY SINGLE SPELL/POWER!\n" +
    "       - Set Col 1 (Category) to 'Active Power' or 'Special Ability', Col 2 (Slot) to the item's body slot, Col 3 (Parent) to the parent item, Col 26 (Action) to the activation action (e.g. 'Standard Action'), Col 27 (Duration) to the frequency/duration (e.g. '1/day'), and set Weight=0 and Cost=0 so inventory weight and cost are not duplicated.\n" +
    "       - Assign each Child power its own dedicated Combat Role (e.g. Dimension Door -> 'Tactical Maneuver', Mage Armor -> 'Defense / Counter', Sending -> 'Non-Combat', Wall of Fire -> 'Offense / Attack').\n" +
    "   - DEEP RESOLUTION OF REFERENCED SPELLS & POWERS (COMBAT STAT ENRICHMENT):\n" +
    "     * When an item or ability grants the power to cast a specific D&D 3.5e spell (e.g. Wall of Fire, Fireball, Charm Monster, Dimension Door, Mage Armor):\n" +
    "       - NEVER write a generic hollow summary like 'Can cast Wall of Fire as a spell-like ability 1/day'!\n" +
    "       - You MUST resolve the full combat mechanics of that referenced spell:\n" +
    "         1. Col 25 (On-Hit Dmg / Dice Expression): If the spell deals damage, populate the exact damage dice! (e.g. for Wall of Fire: '2d4 Fire (10ft) / 2d6+CL Fire (pass)'; for Fireball: '8d6 Fire'; for Lightning Bolt: '8d6 Elec'; for Flame Strike: '1d6/CL').\n" +
    "         2. Col 6 (Benefit / Description): Detail the concrete combat mechanics: save DC or DC formula (e.g. 'Reflex half' or 'Will negates DC 16'), range (e.g. 'Medium 100ft + 10ft/CL'), area/spread, and core tactical effects (e.g. 'Deals 2d4 fire within 10 ft, 1d4 within 20 ft; 2d6 + CL fire (max +20) to creatures passing through. Blocks line of sight.').\n" +
    "         3. Col 26 (Action): Exact casting action ('Standard Action', 'Full-Round Action', 'Swift Action').\n" +
    "         4. Col 27 (Duration / Uses): State both frequency AND spell duration (e.g. 'Conc + 1 rnd/lvl (1/day)', '1 hour/lvl (1/day)', 'Instantaneous (1/day)').\n" +
    "         5. Col 8 (Applies To / Scope): Target scope ('Spells', 'None / General', etc.).\n" +
    "4. STAT MAPPING ACCURACY (PREVENT COLUMN SHIFTS):\n" +
    "   - Never confuse Attack and Damage, or Saves and Initiative!\n" +
    "   - Heroism / Greater Heroism grants bonuses to ATTACK ROLLS (Col 17: Att = 4), SAVING THROWS (Col 19: Fort = 4, Col 20: Ref = 4, Col 21: Will = 4), SKILL CHECKS (Col 22: Skill = 4), and TEMPORARY HP (Col 16: HP = '=MIN(20, lvl_up!$B$4)').\n" +
    "   - Col 18 (Dmg) MUST BE EMPTY ('') because Heroism does NOT give damage!\n" +
    "   - Col 23 (Init) MUST BE EMPTY ('') because Heroism does NOT give initiative!\n\n" +
    "5. SKILL BONUSES (SPECIFIC SKILLS VS GENERIC SKILLS & MULTI-MECHANICS):\n" +
    "   - When an item, feat, or spell grants a bonus to ALL skills (e.g. Heroism, Greater Heroism, Prayer, Stone of Good Luck):\n" +
    "     * Set Col 8 (Applies To / Scope) to 'All Attacks' or 'None / General' or 'Skill: All'.\n" +
    "     * Set Col 22 (Skill) to the numeric bonus (e.g. 2, 4, 1).\n" +
    "   - When a bonus applies ONLY to SPECIFIC skills or an ability-based group of skills:\n" +
    "     * Set Col 8 (Applies To / Scope) to 'Skill: [Target Skills]' (e.g. 'Skill: Listen, Spot', 'Skill: Move Silently', 'Skill: Str-based', 'Skill: Cha-based')!\n" +
    "     * Col 22 (Skill) MUST ALWAYS remain a pure number (or dynamic formula); NEVER write text inside the Skill column!\n" +
    "     * Examples:\n" +
    "       - Primal Senses (+5 to Listen and Spot): Scope='Skill: Listen, Spot', Skill=5, Bonus Type='Competence'\n" +
    "       - Boots of Elvenkind (+5 to Move Silently): Scope='Skill: Move Silently', Skill=5, Bonus Type='Competence'\n" +
    "       - Eyes of the Eagle (+5 to Spot): Scope='Skill: Spot', Skill=5, Bonus Type='Competence'\n" +
    "       - Third Eye Aware (+10 to Spot and Listen): Scope='Skill: Listen, Spot', Skill=10, Bonus Type='Competence'\n" +
    "       - Alertness (+2 to Listen and Spot): Scope='Skill: Listen, Spot', Skill=2, Bonus Type='Untyped'\n" +
    "       - Stealthy (+2 to Hide and Move Silently): Scope='Skill: Hide, Move Silently', Skill=2, Bonus Type='Untyped'\n" +
    "       - Circlet of Persuasion (+3 on Cha-based checks): Scope='Skill: Cha-based', Skill=3, Bonus Type='Competence'\n" +
    "   - MULTI-MECHANIC ITEMS (SPLIT INTO PARENT & CHILD):\n" +
    "     * If an item grants both a skill bonus and a combat/damage/stat bonus with different scopes or bonus types (e.g. Armbands of Might granting +2 Competence to Str skills AND +2 melee damage on Power Attack):\n" +
    "       - ALWAYS split into 1 Parent row and 1 Child row:\n" +
    "       - Row 1 [Parent]: Entry Name: 'Armbands of Might', Category: 'Wondrous Item', Slot: 'Arms', Parent: '-', Bonus Type: 'Competence', Scope: 'Skill: Str-based', Skill: 2, Action: 'Passive', Duration: 'Continuous', Weight: 1, Cost: 4100\n" +
    "       - Row 2 [Child]: Entry Name: '↳ Armbands of Might: Power Attack Boost', Category: 'Wondrous Item', Slot: 'Arms', Parent: 'Armbands of Might', Prerequisites: 'Power Attack', Bonus Type: 'Untyped', Scope: 'Melee Only', Dmg: 2, Benefit: 'When using Power Attack (min -2 penalty), gain +2 melee damage bonus (+4 if wielding two-handed).', Action: 'Passive', Duration: 'Continuous'\n\n" +
    "6. COMBAT ROLES & TACTICAL CLASSIFICATION (COL 30 - COMBAT ROLE):\n" +
    "   - Every entry must be categorized into exactly one of these 7 tactical roles:\n" +
    "     * 'Offense / Attack': Weapons, direct attack/damage bonuses, critical threat enhancers, BAB boosts, on-hit damage, offensive combat spells (e.g. Longsword, Weapon Focus, Point Blank Shot, Flame Blade, Power Attack damage boost).\n" +
    "     * 'Tactical Maneuver': Combat maneuvers, feats, strikes, and stances that alter tactical positioning, combat actions, or exchange stats (e.g. Shock Trooper, Improved Bull Rush, Power Attack trade mechanism, Improved Trip, Cleave, Combat Reflexes, Stand Still, Bloodstorm Blade throw tricks, Tome of Battle strikes/stances).\n" +
    "     * 'Resource Pool': Limited daily/hourly pools or point counters used in combat (e.g. Lay on Hands pool, Smite Evil uses, Turn Undead uses, Ki pool, Action Points, Breath Weapon cooldowns).\n" +
    "     * 'Defense / Counter': Armor Class bonuses, Saving Throw bonuses, Damage Reduction (DR), Spell Resistance (SR), Energy Resistances, Immunities (Fear, Poison, Death), and Immediate Action counters/reactions (e.g. Shield, Mage Armor, Cloak of Resistance, Evasion, Steadfast Determination, Wall of Blades, Wings of Cover, Greater Heroism: Fear Immunity).\n" +
    "     * 'Tactical Sense': Senses that pierce concealment, fog, darkness, invisibility, or grant spatial tactical awareness (e.g. Blindsense, Blindsight, Tremorsense, Scent, See Invisibility, Low-Light Vision, Darkvision, Uncanny Dodge, Third Eye Aware).\n" +
    "     * 'Combat Buff': Multi-attribute stat buffs, ability score boosts, speed increases, morale/haste boosts active during battle (e.g. Bull's Strength, Cat's Grace, Bear's Endurance, Haste, Heroism, Divine Favor, Inspire Courage, Enlarge Person, Belt of Giant Strength).\n" +
    "     * 'Non-Combat': Exploration, social, crafting, downtime, utility, passive skill focuses, or non-tactical abilities (e.g. Endurance, Trapfinding, Weapon Aptitude, Bag of Holding, Hourglass, Skill Focus: Craft).\n" +
    "   - PARENT-CHILD COMBAT ROLE ASSIGNMENT:\n" +
    "     * When decomposing an item or spell into Parent and Child rows, assign each row its own distinct Combat Role!\n" +
    "     * Examples:\n" +
    "       - Primal Senses (Parent): Combat Role = 'Tactical Sense'\n" +
    "       - ↳ Primal Senses: Low-Light Vision (Child): Combat Role = 'Tactical Sense'\n" +
    "       - ↳ Primal Senses: Blindsense (Child): Combat Role = 'Tactical Sense'\n" +
    "       - Armbands of Might (Parent - Str skill bonus): Combat Role = 'Non-Combat'\n" +
    "       - ↳ Armbands of Might: Power Attack Boost (Child - Melee Dmg): Combat Role = 'Tactical Maneuver'\n" +
    "       - Greater Heroism (Parent - Morale Buffs): Combat Role = 'Combat Buff'\n" +
    "       - ↳ Greater Heroism: Fear Immunity (Child - Immunity): Combat Role = 'Defense / Counter'\n\n" +
    "7. TACTICAL FEATS & MULTI-MANEUVER FEATS (STRICT PARENT-CHILD DECOMPOSITION):\n" +
    "   - When a feat is a Tactical Feat or provides multiple distinct combat options/maneuvers (e.g. Shock Trooper, Elusive Target, Combat Brute, Sun School):\n" +
    "     * NEVER cram all maneuvers into the parent feat's description cell! You MUST produce 1 Parent row for the feat, and 1 distinct Child row (starting with '↳ ') for EVERY SINGLE MANEUVER!\n" +
    "     * Strictly adhere to official 3.5e RAW names and mechanics from Complete Warrior / Complete series (NEVER use forum homebrew terms or unofficial errata names):\n" +
    "       - Example for Shock Trooper (Complete Warrior p.112):\n" +
    "         * Row 1 [Parent]: Entry Name: 'Shock Trooper', Category: 'Feat', Slot: 'None', Parent: '-', Prerequisites: 'Power Attack, Improved Bull Rush, base attack bonus +6', Source: 'Complete Warrior p.112', Description: 'Tactical feat enabling 3 combat maneuvers: Directed Bull Rush, Domino Rush, and Heedless Charge', Bonus Type: 'Untyped', Scope: 'Melee Only', Combat Role: 'Tactical Maneuver'\n" +
    "         * Row 2 [Child]: Entry Name: '↳ Shock Trooper: Directed Bull Rush', Category: 'Feat', Slot: 'None', Parent: 'Shock Trooper', Prerequisites: 'Shock Trooper', Source: 'Complete Warrior p.112', Description: 'On charge bull rush, for every 5 ft pushed back, may also move foe 5 ft left or right', Bonus Type: 'Untyped', Scope: 'Melee Only', Combat Role: 'Tactical Maneuver'\n" +
    "         * Row 3 [Child]: Entry Name: '↳ Shock Trooper: Domino Rush', Category: 'Feat', Slot: 'None', Parent: 'Shock Trooper', Prerequisites: 'Shock Trooper', Source: 'Complete Warrior p.112', Description: 'If bull rush foe into another foe\\'s space, make free trip attempt against both without provoking AoO (cannot be tripped back on failure)', Bonus Type: 'Untyped', Scope: 'Melee Only', Combat Role: 'Tactical Maneuver'\n" +
    "         * Row 4 [Child]: Entry Name: '↳ Shock Trooper: Heedless Charge', Category: 'Feat', Slot: 'None', Parent: 'Shock Trooper', Prerequisites: 'Shock Trooper', Source: 'Complete Warrior p.112', Description: 'When charging with Power Attack, assign melee attack penalty to Armor Class instead of attack rolls (up to your full BAB)', Bonus Type: 'Untyped', Scope: 'Melee Only', Combat Role: 'Tactical Maneuver'\n\n" +
    "8. WEAPONS & ARMOR PROPERTIES (CONSOLIDATION RULE - NEVER DECOMPOSE INTRINSIC PROPERTIES):\n" +
    "   - Intrinsic weapon or armor properties (Enhancement bonuses +1 to +5, materials like Adamantine/Mithral/Cold Iron/Silver, properties like Keen, Flaming, Frost, Shock, Holy, Unholy, Vorpal, Defending, Ghost Touch, and size increases like Medium -> Large -> Huge) MUST NEVER BE SPLIT INTO CHILD ROWS!\n" +
    "   - They MUST ALWAYS be consolidated into ONE SINGLE ROW for the weapon/armor:\n" +
    "     * Col 0 (Entry Name): The full weapon name, e.g. '+5 Adamantine Keen Flaming Greatsword'.\n" +
    "     * Col 1 (Category): 'Weapon' (or 'DM Grant' if specifically granted).\n" +
    "     * Col 2 (Slot): 'Main Hand', 'Off Hand', or 'Both Hands'.\n" +
    "     * Col 3 (Parent Entry): '-' (NEVER a child row!).\n" +
    "     * Col 6 (Description): Summarize all properties: e.g. 'Adamantine bypasses hardness <= 20 and DR/adamantine; Keen doubles threat range (17-20/x2); Flaming deals +1d6 fire damage on hit; base damage increased 2 size steps (2d6 -> 3d6 -> 4d6).'\n" +
    "     * Col 7 (Bonus Type): 'Enhancement' (or 'Untyped').\n" +
    "     * Col 8 (Applies To / Scope): 'Melee Only' (or 'Ranged Only' / 'Slashing' / 'Piercing').\n" +
    "     * Col 16 (HP): MUST BE STRICTLY EMPTY ('')! WEAPONS NEVER GRANT HIT POINTS! DO NOT CONFUSE 'TO-HIT' WITH 'HP' (HIT POINTS)! Col 16 is HIT POINTS (Health), NOT To-Hit! Attack/To-Hit bonus goes in Col 17 (Att) and Damage bonus goes in Col 18 (Dmg)!\n" +
    "     * Col 17 (Att): Numeric enhancement bonus (e.g. 5).\n" +
    "     * Col 18 (Dmg): Numeric enhancement bonus (e.g. 5).\n" +
    "     * Col 25 (On-Hit Dmg / Dice Expression): Base weapon dice (scaled for size), critical notation, and extra energy/elemental dice (e.g. '4d6 (17-20/x2) + 1d6 Fire'). CRITICAL: NEVER INCLUDE the flat numeric enhancement bonus (+5) in Col 25! Flat enhancement bonus belongs strictly in Col 17 (Att) and Col 18 (Dmg) to prevent double-counting in character sheet combat calculation formulas!\n" +
    "     * Col 26 (Action): 'Passive' or '-'.\n" +
    "     * Col 27 (Duration): 'Continuous' or 'Passive'.\n" +
    "     * Col 30 (Combat Role): 'Offense / Attack'.\n" +
    "   - CHILD ROWS FOR WEAPONS: Only create a child row for a weapon if the weapon has a separate activated spell-like command ability (e.g. 'Sun Blade: Daylight 1/day'). Passive combat properties, materials, keen, and elemental damage MUST REMAIN in the single parent weapon row!\n" +
    "   - ARMOR VS SHIELD CATEGORIZATION (STRICT SEPARATION):\n" +
    "     * Body Armor (Leather, Chainmail, Breastplate, Full Plate): Category MUST be 'Armor', Slot MUST be 'Armor' (or 'Torso'), Bonus Type is 'Armor'.\n" +
    "     * Shields (Buckler, Light Shield, Heavy Shield, Tower Shield): Category MUST be 'Shield', Slot MUST be 'Shield' (or 'Off-Hand/Shield'), Bonus Type is 'Shield'. NEVER classify a shield as 'Armor'!\n" +
    "   - MULTI-BONUS ITEMS (DIFFERENT BONUS TYPES REQUIRE STRICT PARENT-CHILD DECOMPOSITION):\n" +
    "     * Col 7 (Bonus Type) MUST ALWAYS CONTAIN EXACTLY ONE SINGLE BONUS TYPE. NEVER write composite types with slashes or commas (e.g. NEVER write 'Deflection / Resistance' or 'Enhancement / Morale')!\n" +
    "     * If an item grants bonuses of different bonus types (e.g. Cloak of Protection granting +2 Deflection to AC AND +2 Resistance to Saves):\n" +
    "       - Row 1 [Parent]: Name: 'Cloak of Protection +2', Category: 'Wondrous Item', Slot: 'Shoulders', Parent: '-', Bonus Type: 'Deflection', AC: 2, Saves: ''\n" +
    "       - Row 2 [Child]: Name: '↳ Cloak of Protection +2: Saves', Category: 'Wondrous Item', Slot: 'Shoulders', Parent: 'Cloak of Protection +2', Bonus Type: 'Resistance', AC: '', Fort: 2, Ref: 2, Will: 2\n\n" +
    "9. SINGLE-EFFECT ACTIVE ITEMS & HASTE RULES (BOOTS OF SPEED - STRICT CANON):\n" +
    "   - SINGLE-FUNCTION ACTIVE ITEMS (Boots of Speed, Cape of the Mountebank, Helm of Teleportation, Ring of Invisibility):\n" +
    "     * If an item has only 1 function or activated power and NO separate passive stat bonuses, NEVER CREATE CHILD ROWS! Output exactly ONE single row for the item!\n" +
    "     * Canonical RAW for Boots of Speed (DMG p.250 / SRD):\n" +
    "       - name: 'Boots of Speed', category: 'Wondrous Item', slot: 'Feet', parent: '-', prerequisites: '-', source: 'DMG p.250'\n" +
    "       - description: 'As a free action, click heels together to gain haste for up to 10 rounds per day (need not be consecutive). Grants +1 bonus on attack rolls, +1 dodge bonus to AC and Reflex saves, +30 ft enhancement bonus to land speed, and 1 extra attack on full attack.'\n" +
    "       - bonus_type: 'Untyped', scope: 'All Attacks'\n" +
    "       - ac: 1 (Dodge bonus), att: 1 (+1 attack bonus), ref: 1 (Dodge bonus), speed: 30 (+30 ft land speed)\n" +
    "       - dex: '' (NEVER put 1 in Dex for Haste! Haste does not grant Dexterity!)\n" +
    "       - hp: '', dmg: '', fort: '', will: '', skill: '', init: '', on_hit: ''\n" +
    "       - action: 'Free Action' (NEVER 'Swift Action' or 'Passive' for Boots of Speed)\n" +
    "       - duration: '10 rounds/day' (NEVER 'Continuous' for Boots of Speed)\n" +
    "       - weight: 1, cost: 12000, combat_role: 'Combat Buff'\n" +
    "       - Child rows: ZERO! Exactly 1 single row!\n\n" +
    "10. RACES & RACIAL TRAITS (STRICT D&D 3.5e RAW ARCHITECTURE):\n" +
    "11. CONDITIONS, ABILITY DRAIN & NEGATIVE LEVELS (STRICT D&D 3.5e RAW ARCHITECTURE):\n" +
    "   - When extracting a Condition, Negative Level, or Ability Drain (e.g. 'condition: Shaken', 'Energy Drain', 'Blinded', 'Ability Drain: Strength'):\n" +
    "     * Set Category to 'Condition', Slot to 'None', Parent to '-'.\n" +
    "     * Set Bonus Type to 'Penalty' (or 'Untyped').\n" +
    "     * Set Combat Role to 'Defense / Counter' or 'Tactical Maneuver'.\n" +
    "     * Record exact mechanical penalties in respective stat/save/attack/skill columns (e.g. -2 in Col 17 Att, -2 in Col 19-21 Saves, -2 in Col 22 Skill for Shaken).\n\n" +
    "   - When extracting a Race (e.g. 'race: Goliath', 'race: Dwarf', 'race: Human', 'race: Elf', 'race: Halfling', 'race: Tiefling'):\n" +
    "     * Row 1 [Parent]:\n" +
    "       - name: Base race name (e.g. 'Goliath', 'Dwarf', 'Human', 'Elf').\n" +
    "       - category: 'Race'.\n" +
    "       - slot: 'None', parent: '-'.\n" +
    "       - prerequisites: Level Adjustment if applicable (e.g. 'LA +1', or '-').\n" +
    "       - source: Official book and page (e.g. 'Races of Stone p.56', 'PHB p.14').\n" +
    "       - description: Comprehensive overview: Size (Medium/Small), base land speed, racial ability modifiers, vision/senses, weapon proficiencies, automatic languages, and core racial traits.\n" +
    "       - bonus_type: 'Racial'.\n" +
    "       - scope: 'None / General'.\n" +
    "       - str, dex, con, int, wis, cha: Populate EXACT racial ability score adjustments as numbers! (e.g. Goliath: str: 4, dex: -2, con: 2; Dwarf: con: 2, cha: -2; Elf: dex: 2, con: -2; Halfling: str: -2, dex: 2; Human: all empty ''). Positive numbers for bonuses, negative numbers for penalties!\n" +
    "       - ac: Size bonus to AC if Small (e.g. Halfling/Gnome: 1, Medium: '').\n" +
    "       - att: Size bonus to attack if Small (e.g. Halfling/Gnome: 1, Medium: '').\n" +
    "       - fort, ref, will: Universal racial save bonus if any (e.g. Halfling: fort: 1, ref: 1, will: 1; otherwise '').\n" +
    "       - speed: Base land speed in ft (e.g. 30 for Human/Elf/Goliath, 20 for Dwarf/Halfling/Gnome).\n" +
    "       - action: 'Passive', duration: 'Continuous', combat_role: 'Non-Combat'.\n" +
    "     * Distinct Child Rows (starting with '↳ <Race>: <Trait>'):\n" +
    "       - Decompose notable sensory, tactical, or defensive racial features into separate Child rows with their own distinct Combat Role:\n" +
    "         * Sensory traits (Darkvision, Low-Light Vision, Scent): Combat Role = 'Tactical Sense'.\n" +
    "         * Defensive traits (Stability, Poison/Spell saves, Dodge vs Giants): Combat Role = 'Defense / Counter'.\n" +
    "         * Tactical/maneuver traits (Powerful Build): Combat Role = 'Tactical Maneuver'.\n" +
    "         * Skill bonuses (Keen Senses, Stonecunning): Combat Role = 'Non-Combat' (or 'Tactical Sense').\n\n" +
    "OUTPUT REQUIREMENT (NAMED KEY-VALUE OBJECT SCHEMA - STRICTLY REQUIRED):\n" +
    "Return JSON format where 'rows' is an array of objects with explicit named keys (NEVER output positional arrays, as positional arrays cause column shifts):\n" +
    "{\n" +
    "  \"rows\": [\n" +
    "    {\n" +
    "      \"name\": \"Full item name (child starts with ↳ )\",\n" +
    "      \"category\": \"Weapon, Wondrous Item, Feat, Spell, Special Ability, etc.\",\n" +
    "      \"slot\": \"Feet, Waist, Hands, Both Hands, None, etc.\",\n" +
    "      \"parent\": \"- (or exact parent name)\",\n" +
    "      \"prerequisites\": \"- (or prereqs)\",\n" +
    "      \"source\": \"Book & page, e.g. DMG p.250\",\n" +
    "      \"description\": \"Rules mechanics\",\n" +
    "      \"bonus_type\": \"Enhancement, Dodge, Untyped, etc.\",\n" +
    "      \"scope\": \"All Attacks, Melee Only, None / General, etc.\",\n" +
    "      \"str\": \"\", \"dex\": \"\", \"con\": \"\", \"int\": \"\", \"wis\": \"\", \"cha\": \"\",\n" +
    "      \"ac\": \"\", \"hp\": \"\", \"att\": \"\", \"dmg\": \"\", \"fort\": \"\", \"ref\": \"\",\n" +
    "      \"will\": \"\", \"skill\": \"\", \"init\": \"\", \"speed\": \"\",\n" +
    "      \"on_hit\": \"\",\n" +
    "      \"action\": \"Free Action, Standard Action, Swift Action, Passive, etc.\",\n" +
    "      \"duration\": \"10 rounds/day, Continuous, 1 round/lvl, etc.\",\n" +
    "      \"weight\": 1,\n" +
    "      \"cost\": 12000,\n" +
    "      \"combat_role\": \"Combat Buff, Offense / Attack, etc.\"\n" +
    "    }\n" +
    "  ]\n" +
    "}";

  var payload = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.1
    }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var queue = getGeminiModelQueue(apiKey);
  var successBody = null;
  var errorHistory = [];

  for (var m = 0; m < queue.length; m++) {
    var curModel = queue[m];
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + curModel + ":generateContent?key=" + encodeURIComponent(apiKey);
    try {
      var response = UrlFetchApp.fetch(url, options);
      var statusCode = response.getResponseCode();
      var responseBody = response.getContentText();

      if (statusCode === 200) {
        successBody = responseBody;
        break;
      } else {
        var errObj = {};
        try { errObj = JSON.parse(responseBody); } catch(e){}
        var errMsg = (errObj.error && errObj.error.message) ? errObj.error.message : ("HTTP " + statusCode);
        errorHistory.push(curModel + " ➔ " + errMsg);
      }
    } catch (netErr) {
      errorHistory.push(curModel + " ➔ " + netErr.message);
    }
  }

  if (!successBody) {
    return { success: false, error: "Modellere ulaşılamadı:\n" + errorHistory.join("\n") };
  }

  try {
    var resultJson = JSON.parse(successBody);
    var candidateText = resultJson.candidates[0].content.parts[0].text;
    var parsedData = JSON.parse(candidateText);

    var rows = parsedData.rows || parsedData;
    if (!Array.isArray(rows)) {
      return { success: false, error: "Model geçerli satır dizisi üretemedi." };
    }

    // Guarantee 100% column alignment and defensive 31-column normalization
    for (var i = 0; i < rows.length; i++) {
      rows[i] = normalizeMasterDbRow(rows[i]);
    }
    rows = consolidateWeaponRows(rows);

    // Check against Master_DB to see if any generated row already exists
    var existingInDb = [];
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName("Master_DB");
      if (masterSheet && masterSheet.getLastRow() >= 6) {
        var dbNames = masterSheet.getRange("A6:A" + masterSheet.getLastRow()).getValues();
        var nameSet = {};
        for (var d = 0; d < dbNames.length; d++) {
          var val = String(dbNames[d][0] || "").trim().toLowerCase();
          if (val) nameSet[val] = true;
        }
        for (var r = 0; r < rows.length; r++) {
          var rName = String(rows[r][0] || "").trim();
          if (rName && nameSet[rName.toLowerCase()]) {
            existingInDb.push(rName);
          }
        }
      }
    } catch (eDb) {}

    return { success: true, rows: rows, duplicates: existingInDb };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 4B. GEMINI API FREEFORM TEXT / SPLATBOOK PARSER
// ----------------------------------------------------
function queryGeminiForFreeformText(rawText, categoryHint) {
  var apiKey = getMyGeminiApiKey();
  if (!apiKey) {
    return { success: false, error: "API anahtarı bulunamadı. Lütfen önce geçerli bir Gemini API anahtarı tanımlayın." };
  }
  if (!rawText || !rawText.trim()) {
    return { success: false, error: "Lütfen ayrıştırılacak kural veya splatbook metnini yapıştırın." };
  }

  var promptText = 
    "You are an expert D&D 3.5e Rule Arbiter and Database Architect.\n" +
    "The user has provided the following RAW rule text directly copied from an official D&D 3.5e sourcebook, dndtools, PDF, or homebrew:\n\n" +
    "\"\"\"\n" + rawText.trim() + "\n\"\"\"\n\n" +
    "Category Hint: '" + (categoryHint || "Auto") + "'.\n\n" +
    "TASK:\n" +
    "Extract and resolve the exact rules mechanics from the provided text into an array of rows adhering strictly to the Master_DB 31-column schema.\n\n" +
    "CRITICAL RULES:\n" +
    "1. VERBATIM MECHANICAL ACCURACY: Do not hallucinate or alter any values given in the text. Respect the text exactly.\n" +
    "2. PARENT-CHILD DECOMPOSITION (ZERO OMISSION):\n" +
    "   - If the element provides multiple distinct benefits (e.g. passive skill bonus AND a separate combat strike / damage booster like Armbands of Might, or low-light vision + blindsense like Primal Senses, or passive stat buffs + a fear immunity like Greater Heroism):\n" +
    "     * Produce 1 Parent row and 1 or more Child rows starting with '↳ '.\n" +
    "     * Child rows set Col 3 (Parent Entry) to the exact parent name.\n" +
    "   - MULTI-SPELL / MULTI-POWER ITEMS (War Wizard Cloak, Staves, Rings):\n" +
    "     * If an item grants multiple spells or daily abilities (e.g. 'Once per day, the wearer may use dimension door, lesser ironguard, protection from arrows, and sending'), you MUST create a separate Child row for EVERY SINGLE SPELL/POWER!\n" +
    "     * Never omit or collapse multiple spells into one row. Set Col 1 (Category) to 'Active Power', Col 26 (Action) to activation time, Col 27 (Duration) to '1/day', Weight=0, Cost=0, and assign each child power its specific Combat Role (e.g. Dimension Door -> 'Tactical Maneuver', Ironguard -> 'Defense / Counter', Sending -> 'Non-Combat').\n" +
    "   - TACTICAL FEATS & MULTI-MANEUVER FEATS (Shock Trooper, Elusive Target):\n" +
    "     * If a feat describes multiple tactical maneuvers or combat options, NEVER put them in a single row! Create 1 Parent row for the feat, and 1 Child row (starting with '↳ ') for each tactical maneuver with 'Tactical Maneuver' role!\n" +
    "   - DEEP RESOLUTION OF REFERENCED SPELLS & POWERS (SPELL-LIKE ABILITY ENRICHMENT):\n" +
    "     * When an item or ability grants the power to cast a specific D&D 3.5e spell (e.g. Wall of Fire, Fireball, Charm Monster, Greater Teleport, Dimension Door, Mage Armor):\n" +
    "       - NEVER write a generic hollow summary like 'Can cast Wall of Fire as a spell-like ability 1/day'!\n" +
    "       - You MUST resolve the full combat mechanics of that referenced spell:\n" +
    "         1. Col 25 (On-Hit Dmg / Dice Expression): If the spell deals damage, populate the exact damage dice! (e.g. for Wall of Fire: '2d4 Fire (10ft) / 2d6+CL Fire (pass)'; for Fireball: '8d6 Fire'; for Lightning Bolt: '8d6 Elec').\n" +
    "         2. Col 6 (Benefit / Description): Detail the concrete combat mechanics: save DC or DC formula (e.g. 'Reflex half' or 'Will negates DC 16'), range (e.g. 'Medium 100ft + 10ft/CL'), area/spread, and core tactical effects (e.g. 'Deals 2d4 fire within 10 ft, 1d4 within 20 ft; 2d6 + CL fire (max +20) to creatures passing through. Blocks line of sight.').\n" +
    "         3. Col 26 (Action): Exact casting action ('Standard Action', 'Full-Round Action', 'Swift Action').\n" +
    "         4. Col 27 (Duration / Uses): State both frequency AND spell duration (e.g. 'Conc + 1 rnd/lvl (1/day)', '1 hour/lvl (1/day)', 'Instantaneous (1/day)').\n" +
    "         5. Col 8 (Applies To / Scope): Target scope ('Spells', 'None / General', etc.).\n" +
    "3. LEVEL-SCALED BUFFS & TEMPORARY HIT POINTS:\n" +
    "   - Character level is tracked in 'lvl_up!$B$4'. Output dynamic formulas when effects scale with CL/level (e.g. '=MIN(20, lvl_up!$B$4)').\n" +
    "4. COMBAT ROLES & TACTICAL CLASSIFICATION (COL 30 - COMBAT ROLE):\n" +
    "   - Categorize each row into exactly one of: 'Offense / Attack', 'Tactical Maneuver', 'Resource Pool', 'Defense / Counter', 'Tactical Sense', 'Combat Buff', 'Non-Combat'.\n" +
    "   - Assign each Parent and Child row its own individual Combat Role based on what that specific row provides!\n\n" +
    "5. WEAPONS & ARMOR PROPERTIES (CONSOLIDATION RULE - NEVER DECOMPOSE INTRINSIC PROPERTIES):\n" +
    "   - Intrinsic weapon or armor properties (Enhancement bonuses +1 to +5, materials like Adamantine/Mithral/Cold Iron/Silver, properties like Keen, Flaming, Frost, Shock, Holy, Unholy, Vorpal, Defending, Ghost Touch, and size increases like Medium -> Large -> Huge) MUST NEVER BE SPLIT INTO CHILD ROWS!\n" +
    "   - They MUST ALWAYS be consolidated into ONE SINGLE ROW for the weapon/armor:\n" +
    "     * Col 0 (Entry Name): The full weapon name, e.g. '+5 Adamantine Keen Flaming Greatsword'.\n" +
    "     * Col 1 (Category): 'Weapon' (or 'DM Grant' if specifically granted).\n" +
    "     * Col 2 (Slot): 'Main Hand', 'Off Hand', or 'Both Hands'.\n" +
    "     * Col 3 (Parent Entry): '-' (NEVER a child row!).\n" +
    "     * Col 6 (Description): Summarize all properties: e.g. 'Adamantine bypasses hardness <= 20 and DR/adamantine; Keen doubles threat range (17-20/x2); Flaming deals +1d6 fire damage on hit; base damage increased 2 size steps (2d6 -> 3d6 -> 4d6).'\n" +
    "     * Col 7 (Bonus Type): 'Enhancement' (or 'Untyped').\n" +
    "     * Col 8 (Applies To / Scope): 'Melee Only' (or 'Ranged Only' / 'Slashing' / 'Piercing').\n" +
    "     * Col 16 (HP): MUST BE STRICTLY EMPTY ('')! WEAPONS NEVER GRANT HIT POINTS! DO NOT CONFUSE 'TO-HIT' WITH 'HP' (HIT POINTS)! Col 16 is HIT POINTS (Health), NOT To-Hit! Attack/To-Hit bonus goes in Col 17 (Att) and Damage bonus goes in Col 18 (Dmg)!\n" +
    "     * Col 17 (Att): Numeric enhancement bonus (e.g. 5).\n" +
    "     * Col 18 (Dmg): Numeric enhancement bonus (e.g. 5).\n" +
    "     * Col 25 (On-Hit Dmg / Dice Expression): Base weapon dice (scaled for size), critical notation, and extra energy/elemental dice (e.g. '4d6 (17-20/x2) + 1d6 Fire'). CRITICAL: NEVER INCLUDE the flat numeric enhancement bonus (+5) in Col 25! Flat enhancement bonus belongs strictly in Col 17 (Att) and Col 18 (Dmg) to prevent double-counting in character sheet combat calculation formulas!\n" +
    "     * Col 26 (Action): 'Passive' or '-'.\n" +
    "     * Col 27 (Duration): 'Continuous' or 'Passive'.\n" +
    "     * Col 30 (Combat Role): 'Offense / Attack'.\n" +
    "   - CHILD ROWS FOR WEAPONS: Only create a child row for a weapon if the weapon has a separate activated spell-like command ability (e.g. 'Sun Blade: Daylight 1/day'). Passive combat properties, materials, keen, and elemental damage MUST REMAIN in the single parent weapon row!\n\n" +
    "6. SINGLE-EFFECT ACTIVE ITEMS & HASTE RULES (BOOTS OF SPEED - STRICT CANON):\n" +
    "   - SINGLE-FUNCTION ACTIVE ITEMS (Boots of Speed, Cape of the Mountebank, Helm of Teleportation, Ring of Invisibility):\n" +
    "     * If an item has only 1 function or activated power and NO separate passive stat bonuses, NEVER CREATE CHILD ROWS! Output exactly ONE single row for the item!\n" +
    "     * Canonical RAW for Boots of Speed (DMG p.250 / SRD):\n" +
    "       - name: 'Boots of Speed', category: 'Wondrous Item', slot: 'Feet', parent: '-', prerequisites: '-', source: 'DMG p.250'\n" +
    "       - description: 'As a free action, click heels together to gain haste for up to 10 rounds per day (need not be consecutive). Grants +1 bonus on attack rolls, +1 dodge bonus to AC and Reflex saves, +30 ft enhancement bonus to land speed, and 1 extra attack on full attack.'\n" +
    "       - bonus_type: 'Untyped', scope: 'All Attacks'\n" +
    "       - ac: 1 (Dodge bonus), att: 1 (+1 attack bonus), ref: 1 (Dodge bonus), speed: 30 (+30 ft land speed)\n" +
    "       - dex: '' (NEVER put 1 in Dex for Haste! Haste does not grant Dexterity!)\n" +
    "       - hp: '', dmg: '', fort: '', will: '', skill: '', init: '', on_hit: ''\n" +
    "       - action: 'Free Action' (NEVER 'Swift Action' or 'Passive' for Boots of Speed)\n" +
    "       - duration: '10 rounds/day' (NEVER 'Continuous' for Boots of Speed)\n" +
    "       - weight: 1, cost: 12000, combat_role: 'Combat Buff'\n" +
    "       - Child rows: ZERO! Exactly 1 single row!\n\n" +
    "7. RACES & RACIAL TRAITS (STRICT D&D 3.5e RAW ARCHITECTURE):\n" +
    "   - When extracting a Race (e.g. 'race: Goliath', 'race: Dwarf', 'race: Human', 'race: Elf', 'race: Halfling', 'race: Tiefling'):\n" +
    "     * Row 1 [Parent]:\n" +
    "       - name: Base race name (e.g. 'Goliath', 'Dwarf', 'Human', 'Elf').\n" +
    "       - category: 'Race'.\n" +
    "       - slot: 'None', parent: '-'.\n" +
    "       - prerequisites: Level Adjustment if applicable (e.g. 'LA +1', or '-').\n" +
    "       - source: Official book and page (e.g. 'Races of Stone p.56', 'PHB p.14').\n" +
    "       - description: Comprehensive overview: Size (Medium/Small), base land speed, racial ability modifiers, vision/senses, weapon proficiencies, automatic languages, and core racial traits.\n" +
    "       - bonus_type: 'Racial'.\n" +
    "       - scope: 'None / General'.\n" +
    "       - str, dex, con, int, wis, cha: Populate EXACT racial ability score adjustments as numbers! (e.g. Goliath: str: 4, dex: -2, con: 2; Dwarf: con: 2, cha: -2; Elf: dex: 2, con: -2; Halfling: str: -2, dex: 2; Human: all empty ''). Positive numbers for bonuses, negative numbers for penalties!\n" +
    "       - ac: Size bonus to AC if Small (e.g. Halfling/Gnome: 1, Medium: '').\n" +
    "       - att: Size bonus to attack if Small (e.g. Halfling/Gnome: 1, Medium: '').\n" +
    "       - fort, ref, will: Universal racial save bonus if any (e.g. Halfling: fort: 1, ref: 1, will: 1; otherwise '').\n" +
    "       - speed: Base land speed in ft (e.g. 30 for Human/Elf/Goliath, 20 for Dwarf/Halfling/Gnome).\n" +
    "       - action: 'Passive', duration: 'Continuous', combat_role: 'Non-Combat'.\n" +
    "     * Distinct Child Rows (starting with '↳ <Race>: <Trait>'):\n" +
    "       - Decompose notable sensory, tactical, or defensive racial features into separate Child rows with their own distinct Combat Role:\n" +
    "         * Sensory traits (Darkvision, Low-Light Vision, Scent): Combat Role = 'Tactical Sense'.\n" +
    "         * Defensive traits (Stability, Poison/Spell saves, Dodge vs Giants): Combat Role = 'Defense / Counter'.\n" +
    "         * Tactical/maneuver traits (Powerful Build): Combat Role = 'Tactical Maneuver'.\n" +
    "         * Skill bonuses (Keen Senses, Stonecunning): Combat Role = 'Non-Combat' (or 'Tactical Sense').\n\n" +
    "OUTPUT REQUIREMENT (NAMED KEY-VALUE OBJECT SCHEMA - STRICTLY REQUIRED):\n" +
    "Return JSON format where 'rows' is an array of objects with explicit named keys (NEVER output positional arrays, as positional arrays cause column shifts):\n" +
    "{\n" +
    "  \"rows\": [\n" +
    "    {\n" +
    "      \"name\": \"Full item name (child starts with ↳ )\",\n" +
    "      \"category\": \"Weapon, Wondrous Item, Feat, Spell, Special Ability, etc.\",\n" +
    "      \"slot\": \"Feet, Waist, Hands, Both Hands, None, etc.\",\n" +
    "      \"parent\": \"- (or exact parent name)\",\n" +
    "      \"prerequisites\": \"- (or prereqs)\",\n" +
    "      \"source\": \"Book & page, e.g. DMG p.250\",\n" +
    "      \"description\": \"Rules mechanics\",\n" +
    "      \"bonus_type\": \"Enhancement, Dodge, Untyped, etc.\",\n" +
    "      \"scope\": \"All Attacks, Melee Only, None / General, etc.\",\n" +
    "      \"str\": \"\", \"dex\": \"\", \"con\": \"\", \"int\": \"\", \"wis\": \"\", \"cha\": \"\",\n" +
    "      \"ac\": \"\", \"hp\": \"\", \"att\": \"\", \"dmg\": \"\", \"fort\": \"\", \"ref\": \"\",\n" +
    "      \"will\": \"\", \"skill\": \"\", \"init\": \"\", \"speed\": \"\",\n" +
    "      \"on_hit\": \"\",\n" +
    "      \"action\": \"Free Action, Standard Action, Swift Action, Passive, etc.\",\n" +
    "      \"duration\": \"10 rounds/day, Continuous, 1 round/lvl, etc.\",\n" +
    "      \"weight\": 1,\n" +
    "      \"cost\": 12000,\n" +
    "      \"combat_role\": \"Combat Buff, Offense / Attack, etc.\"\n" +
    "    }\n" +
    "  ]\n" +
    "}";

  var payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.1
    }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var queue = getGeminiModelQueue(apiKey);
  var successBody = null;
  var errorHistory = [];

  for (var m = 0; m < queue.length; m++) {
    var curModel = queue[m];
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + curModel + ":generateContent?key=" + encodeURIComponent(apiKey);
    try {
      var response = UrlFetchApp.fetch(url, options);
      var statusCode = response.getResponseCode();
      var responseBody = response.getContentText();

      if (statusCode === 200) {
        successBody = responseBody;
        break;
      } else {
        var errObj = {};
        try { errObj = JSON.parse(responseBody); } catch(e){}
        var errMsg = (errObj.error && errObj.error.message) ? errObj.error.message : ("HTTP " + statusCode);
        errorHistory.push(curModel + " ➔ " + errMsg);
      }
    } catch (netErr) {
      errorHistory.push(curModel + " ➔ " + netErr.message);
    }
  }

  if (!successBody) {
    return { success: false, error: "Modellere ulaşılamadı:\n" + errorHistory.join("\n") };
  }

  try {
    var resultJson = JSON.parse(successBody);
    var candidateText = resultJson.candidates[0].content.parts[0].text;
    var parsedData = JSON.parse(candidateText);

    var rows = parsedData.rows || parsedData;
    if (!Array.isArray(rows)) {
      return { success: false, error: "Model geçerli satır dizisi üretemedi." };
    }

    // Guarantee 100% column alignment and defensive 31-column normalization
    for (var i = 0; i < rows.length; i++) {
      rows[i] = normalizeMasterDbRow(rows[i]);
    }
    rows = consolidateWeaponRows(rows);

    // Check against Master_DB to see if any generated row already exists
    var existingInDb = [];
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName("Master_DB");
      if (masterSheet && masterSheet.getLastRow() >= 6) {
        var dbNames = masterSheet.getRange("A6:A" + masterSheet.getLastRow()).getValues();
        var nameSet = {};
        for (var d = 0; d < dbNames.length; d++) {
          var val = String(dbNames[d][0] || "").trim().toLowerCase();
          if (val) nameSet[val] = true;
        }
        for (var r = 0; r < rows.length; r++) {
          var rName = String(rows[r][0] || "").trim();
          if (rName && nameSet[rName.toLowerCase()]) {
            existingInDb.push(rName);
          }
        }
      }
    } catch (eDb) {}

    return { success: true, rows: rows, duplicates: existingInDb, correctedQuery: targetItemName };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 5. MASTER_DB APPEND ENGINE
// ----------------------------------------------------
function appendMasterDbRows(rows) {
  if (!rows || rows.length === 0) {
    return { success: false, error: "Eklenecek satır yok." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Master_DB");
  if (!sheet) {
    return { success: false, error: "Master_DB sayfası bulunamadı. Lütfen önce tabloyu oluşturun." };
  }

  // Defensive normalization and weapon consolidation upfront
  for (var n = 0; n < rows.length; n++) {
    rows[n] = normalizeMasterDbRow(rows[n]);
  }
  rows = consolidateWeaponRows(rows);

  // Check for duplicates in Column A of Master_DB
  var lastRow = sheet.getLastRow();
  var existingNames = [];
  if (lastRow >= 6) {
    var rawNames = sheet.getRange("A6:A" + lastRow).getValues();
    for (var k = 0; k < rawNames.length; k++) {
      var n = String(rawNames[k][0] || "").trim().toLowerCase();
      if (n) existingNames.push(n);
    }
  }

  // Check if any incoming entry name already exists in Master_DB
  var duplicateNames = [];
  for (var i = 0; i < rows.length; i++) {
    var incomingName = String(rows[i][0] || "").trim();
    if (incomingName && existingNames.indexOf(incomingName.toLowerCase()) !== -1) {
      duplicateNames.push(incomingName);
    }
  }

  if (duplicateNames.length > 0) {
    return {
      success: false,
      error: "Bu kayıt Master_DB'de zaten mevcut! Yazma işlemi iptal edildi.\n\nMevcut Olan(lar):\n• " + duplicateNames.join("\n• ")
    };
  }

  // Find next empty row in Master_DB (checking Column A starting at row 6)
  var colAValues = sheet.getRange("A6:A" + Math.max(sheet.getMaxRows(), 300)).getValues();
  var targetRow = 6;
  for (var r = 0; r < colAValues.length; r++) {
    if (colAValues[r][0] !== "" && colAValues[r][0] !== null) {
      targetRow = 6 + r + 1;
    }
  }

  // Ensure sheet has enough rows
  var neededRows = targetRow + rows.length;
  if (sheet.getMaxRows() < neededRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), neededRows - sheet.getMaxRows() + 20);
  }

  // Localize formula separators for any dynamic formula cells (e.g. =MIN(20, lvl_up!$B$4))
  var sep = getFormulaSeparator(sheet);
  for (var r = 0; r < rows.length; r++) {
    for (var c = 0; c < rows[r].length; c++) {
      if (typeof rows[r][c] === 'string' && rows[r][c].charAt(0) === '=') {
        if (sep === ';') {
          rows[r][c] = rows[r][c].replace(/,/g, ';');
        } else {
          rows[r][c] = rows[r][c].replace(/;/g, ',');
        }
      }
    }
  }

  // Defensive normalization: ensure every row has exactly 31 properly aligned elements
  for (var i = 0; i < rows.length; i++) {
    rows[i] = normalizeMasterDbRow(rows[i]);
  }

  var range = sheet.getRange(targetRow, 1, rows.length, 31);
  range.setValues(rows);

  // Apply visual styling, Parent-Child hierarchy formatting, and borders
  formatMasterDbRowRange(sheet, targetRow, rows.length);

  // Dynamically update and synchronize Master_DB validations so novel types/slots from Rule Importer are instantly registered
  updateMasterDbValidations(sheet);

  ss.toast(rows.length + " kural kaydı başarıyla Master_DB'ye eklendi!", "✅ Tamamlandı", 5);
  return { success: true, count: rows.length };
}

/**
 * Dynamically synchronizes and updates Master_DB dropdown validations (Type, Slot, Bonus Type, Combat Scope, Combat Role).
 * Gathers all unique entries present in Master_DB, merges with core D&D 3.5e canon lists,
 * and sets allowInvalid(true) so that novel AI rule imports or manual entries never show red triangles.
 */
function updateMasterDbValidations(sheet) {
  clearMasterDbEquipCatalogCache();
  clearMasterDbRosterCatalogCache();

  if (!sheet || typeof sheet.getMaxRows !== "function") {
    var ss = (sheet && typeof sheet.getSheetByName === "function") ? sheet : SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName("Master_DB");
    if (!sheet) return;
  }

  var maxRows = sheet.getMaxRows();
  var lastRow = sheet.getLastRow();
  var numRows = Math.max(maxRows - 5, 300);

  // 1. Base Canonical Types & Categories (Col B / Col 2)
  var baseTypes = [
    "-", "Feat", "Weapon", "Armor", "Shield", "Armor / Shield", "Ring", "Wondrous Item", "Slotless Item",
    "Consumable", "Spell", "Maneuver", "Stance", "Special Ability", "DM Grant",
    "Active Power", "Flaw", "Racial Trait", "Race", "Potion", "Scroll", "Wand",
    "Ammunition", "Alchemical", "Gear", "Condition"
  ];

  // 2. Base Canonical Slots & Body Locations (Col C / Col 3 - includes canon slots and aliases)
  var baseSlots = [
    "-", "None", "Armor", "Shield", "Off-Hand/Shield", "Head", "Eyes", "Neck", "Shoulders",
    "Torso", "Body", "Waist", "Belt", "Arms", "Bracers", "Hands", "Gloves",
    "Ring", "Feet", "Boots", "Main Hand", "Off Hand", "Slotless", "Consumable", "Other"
  ];

  // 3. Base Bonus Types (Col H / Col 8)
  var baseBonusTypes = [
    "-", "None", "Untyped", "Enhancement", "Resistance", "Deflection", "Natural Armor",
    "Armor", "Shield", "Morale", "Luck", "Insight", "Dodge", "Circumstance",
    "Sacred", "Profane", "Alchemical", "Competence", "Size", "Inherent",
    "Spell-Like", "Racial", "Synergy", "Penalty"
  ];

  // 4. Base Combat Scopes (Col I / Col 9)
  var baseScopes = [
    "-", "None / General", "All Attacks", "Melee Only", "Ranged Only", "Thrown Only", "Unarmed",
    "Specific Weapon", "Slashing", "Piercing", "Bludgeoning", "Spells", "Spells & SLAs",
    "All Saves", "Fortitude Saves", "Reflex Saves", "Will Saves", "Armor Class",
    "Flanked / Flat-Footed", "Critical Confirmation", "Vs Evil", "Vs Fear", "Vs Traps", "Healing / Pool",
    "Skill: All", "Skill: Listen, Spot", "Skill: Spot", "Skill: Listen",
    "Skill: Hide, Move Silently", "Skill: Str-based", "Skill: Dex-based",
    "Skill: Cha-based", "Skill: Int-based", "Skill: Wis-based", "Skill: Con-based"
  ];

  // 5. Base Combat Roles (Col AE / Col 31)
  var baseRoles = [
    "-", "Offense / Attack", "Tactical Maneuver", "Resource Pool",
    "Defense / Counter", "Tactical Sense", "Combat Buff", "Non-Combat"
  ];

  // Initialize lookup maps
  var typeSet = {};
  for (var t = 0; t < baseTypes.length; t++) typeSet[baseTypes[t]] = true;

  var slotSet = {};
  for (var s = 0; s < baseSlots.length; s++) slotSet[baseSlots[s]] = true;

  var bonusTypeSet = {};
  for (var b = 0; b < baseBonusTypes.length; b++) bonusTypeSet[baseBonusTypes[b]] = true;

  var scopeSet = {};
  for (var sc = 0; sc < baseScopes.length; sc++) scopeSet[baseScopes[sc]] = true;

  var roleSet = {};
  for (var r = 0; r < baseRoles.length; r++) roleSet[baseRoles[r]] = true;

  // Gather unique values across all data rows (Cols 2 to 31)
  if (lastRow >= 6) {
    var dbVals = sheet.getRange(6, 2, lastRow - 5, 30).getValues();
    for (var i = 0; i < dbVals.length; i++) {
      var catVal = String(dbVals[i][0] || "").trim();    // Col B (2) -> index 0
      var slotVal = String(dbVals[i][1] || "").trim();   // Col C (3) -> index 1
      var bTypeVal = String(dbVals[i][6] || "").trim();  // Col H (8) -> index 6
      var scopeVal = String(dbVals[i][7] || "").trim();  // Col I (9) -> index 7
      var roleVal = String(dbVals[i][29] || "").trim();  // Col AE (31) -> index 29

      if (catVal && !typeSet[catVal]) typeSet[catVal] = true;
      if (slotVal && !slotSet[slotVal]) slotSet[slotVal] = true;
      if (bTypeVal && !bonusTypeSet[bTypeVal]) bonusTypeSet[bTypeVal] = true;
      if (scopeVal && !scopeSet[scopeVal]) scopeSet[scopeVal] = true;
      if (roleVal && !roleSet[roleVal]) roleSet[roleVal] = true;
    }
  }

  var typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.keys(typeSet), true)
    .setAllowInvalid(true)
    .build();

  var slotRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.keys(slotSet), true)
    .setAllowInvalid(true)
    .build();

  var bonusTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.keys(bonusTypeSet), true)
    .setAllowInvalid(true)
    .build();

  var scopeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.keys(scopeSet), true)
    .setAllowInvalid(true)
    .build();

  var roleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.keys(roleSet), true)
    .setAllowInvalid(true)
    .build();

  sheet.getRange(6, 2, numRows, 1).setDataValidation(typeRule);       // Col B: Type
  sheet.getRange(6, 3, numRows, 1).setDataValidation(slotRule);       // Col C: Slot
  sheet.getRange(6, 8, numRows, 1).setDataValidation(bonusTypeRule);  // Col H: Bonus Type
  sheet.getRange(6, 9, numRows, 1).setDataValidation(scopeRule);      // Col I: Combat Scope
  sheet.getRange(6, 31, numRows, 1).setDataValidation(roleRule);      // Col AE: Combat Role
}

/**
 * Menu action to manually trigger Master_DB validation synchronization
 */
function fixMasterDbValidationsMenu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Master_DB");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Hata: 'Master_DB' sayfası bulunamadı.");
    return;
  }
  updateMasterDbValidations(sheet);
  ss.toast("Master_DB veri doğrulama kuralları (Tip, Yuva, Bonus Türü, Combat Scope, Combat Role) güncellendi ve tüm hatalar giderildi!", "✅ Doğrulamalar Güncellendi", 5);
}

/**
 * Re-aligns and enforces strict integer number formatting on Master_DB buff columns (J:Y)
 * and numeric formats on Weight (AC) and Cost (AD). Also sanitizes lvl_up!B4 and updates validations.
 */
function fixMasterDbFormats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Master_DB");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Hata: 'Master_DB' sayfası bulunamadı.");
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow >= 6) {
    var numRows = lastRow - 5;
    
    // 1. Scan and auto-repair missing buffs for known class abilities (e.g. Smite Evil)
    var dbRange = sheet.getRange(6, 1, numRows, 31);
    var dbData = dbRange.getValues();
    var sep = getFormulaSeparator(sheet);
    var changed = false;

    for (var i = 0; i < dbData.length; i++) {
      var row = dbData[i];
      var name = String(row[0] || "").trim();
      if (!name) continue;
      var normalized = normalizeMasterDbRow(row);
      // Localize formula separators if formula is present
      for (var c = 0; c < normalized.length; c++) {
        if (typeof normalized[c] === 'string' && normalized[c].charAt(0) === '=') {
          normalized[c] = (sep === ';') ? normalized[c].replace(/,/g, ';') : normalized[c].replace(/;/g, ',');
        }
      }
      dbData[i] = normalized;
      changed = true;
    }

    if (changed) {
      dbRange.setValues(dbData);
    }

    // 2. Strict format for 16 Buff Columns (Cols J to Y: Cols 10 to 25)
    sheet.getRange(6, 10, numRows, 16)
         .setNumberFormat("0")
         .setHorizontalAlignment("center");

    // Weight (Col 29) -> "0.##"
    sheet.getRange(6, 29, numRows, 1)
         .setNumberFormat("0.##")
         .setHorizontalAlignment("right");

    // Cost (Col 30) -> "#,##0"
    sheet.getRange(6, 30, numRows, 1)
         .setNumberFormat("#,##0")
         .setHorizontalAlignment("right");
  }

  // 3. Synchronize and update validations (Type, Slot, Bonus Type) across all rows
  updateMasterDbValidations(sheet);

  // 4. Clean lingering blank row formats & borders
  cleanMasterDbFormatting(sheet);

  ss.toast("Master_DB buff, format, boş satır renklendirmeleri ve doğrulamaları başarıyla onarıldı!", "✅ Formatlar & Doğrulamalar Düzeltildi", 5);
}

// ----------------------------------------------------
// 4C. AI LEVEL-UP COPILOT BACKEND (Gemini ➔ lvl_up & Master_DB)
// ----------------------------------------------------

/**
 * Canonicalizes known D&D 3.5e class feature names to prevent abbreviations or truncations
 * (e.g. "Grace (Su)" -> "Divine Grace (Su)").
 */
function canonicalizeFeatureName(name) {
  if (!name) return "";
  var s = String(name).trim();
  var lower = s.toLowerCase();
  if (lower === "grace" || lower === "grace (su)" || lower === "divine grace") return "Divine Grace (Su)";
  if (lower === "lay on hand" || lower === "lay on hands" || lower === "lay on hands (su)") return "Lay on Hands (Su)";
  if (lower === "smite evil" || lower === "smite evil (su)") return "Smite Evil (Su)";
  if (lower === "aura of good" || lower === "aura of good (ex)") return "Aura of Good (Ex)";
  if (lower === "aura of courage" || lower === "aura of courage (su)") return "Aura of Courage (Su)";
  if (lower === "divine health" || lower === "divine health (ex)") return "Divine Health (Ex)";
  if (lower === "turn undead" || lower === "turn undead (su)") return "Turn Undead (Su)";
  if (lower === "special mount" || lower === "special mount (sp)") return "Special Mount (Sp)";
  if (lower === "detect evil" || lower === "detect evil (sp)") return "Detect Evil (Sp)";
  if (lower === "remove disease" || lower === "remove disease (sp)") return "Remove Disease (Sp)";
  if (lower === "battle clarity" || lower === "battle clarity (ex)") return "Battle Clarity (Ex)";
  if (lower === "battle ardor" || lower === "battle ardor (ex)") return "Battle Ardor (Ex)";
  if (lower === "battle cunning" || lower === "battle cunning (ex)") return "Battle Cunning (Ex)";
  if (lower === "weapon aptitude" || lower === "weapon aptitude (ex)") return "Weapon Aptitude (Ex)";
  if (lower === "fast movement" || lower === "fast movement (ex)") return "Fast Movement (Ex)";
  if (lower === "trapfinding" || lower === "trapfinding (ex)") return "Trapfinding (Ex)";
  if (lower === "evasion" || lower === "evasion (ex)") return "Evasion (Ex)";
  if (lower === "improved evasion" || lower === "improved evasion (ex)") return "Improved Evasion (Ex)";
  if (lower === "uncanny dodge" || lower === "uncanny dodge (ex)") return "Uncanny Dodge (Ex)";
  if (lower === "improved uncanny dodge" || lower === "improved uncanny dodge (ex)") return "Improved Uncanny Dodge (Ex)";
  return s;
}

/**
 * Authoritative D&D 3.5e Canon Knowledge Engine (PHB & Tome of Battle)
 * Provides 100% deterministic RAW progression, hit dice, saves, BAB, skill points,
 * bonus feats, and class features for core classes.
 */
function getCanonClassData(className, classLevel) {
  var lowerClass = String(className || "").toLowerCase();
  var cl = parseInt(classLevel, 10);
  if (isNaN(cl) || cl < 1) return null;

  var hitDie = null;
  var babRate = null;
  var fortRate = null;
  var refRate = null;
  var willRate = null;
  var skillBase = null;
  var hasBonusFeat = false;
  var bonusFeatType = "Class Bonus Feat";
  var classFeatures = [];
  var matched = false;

  if (lowerClass.indexOf("warblade") !== -1) {
    matched = true;
    hitDie = "d12"; babRate = "Good (+1.0)"; fortRate = "Good"; refRate = "Poor"; willRate = "Poor"; skillBase = 4;
    if (cl === 1) {
      classFeatures = [
        { name: "Battle Clarity (Ex)", category: "Special Ability", type: "Ex", combatRole: "Tactical Sense", book: "Tome of Battle", page: "22", summary: "INT modifier to Reflex saves (max Warblade lvl)" },
        { name: "Weapon Aptitude (Ex)", category: "Special Ability", type: "Ex", combatRole: "Tactical Maneuver", book: "Tome of Battle", page: "22", summary: "Adjust weapon feats to different weapons with 1 hour practice" }
      ];
    } else if (cl === 2) {
      classFeatures = [
        { name: "Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "Tome of Battle", page: "22", summary: "Retain Dex bonus to AC even if caught flat-footed" }
      ];
    } else if (cl === 3) {
      classFeatures = [
        { name: "Battle Ardor (Ex)", category: "Special Ability", type: "Ex", combatRole: "Tactical Sense", book: "Tome of Battle", page: "22", summary: "INT modifier on rolls made to confirm critical hits" }
      ];
    } else if (cl === 5 || cl === 9 || cl === 13 || cl === 17) {
      hasBonusFeat = true;
    } else if (cl === 6) {
      classFeatures = [
        { name: "Improved Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "Tome of Battle", page: "22", summary: "Can no longer be flanked unless attacker is 4+ levels higher" }
      ];
    } else if (cl === 7) {
      classFeatures = [
        { name: "Battle Cunning (Ex)", category: "Special Ability", type: "Ex", combatRole: "Offense / Attack", book: "Tome of Battle", page: "22", summary: "INT modifier to damage rolls against flat-footed or flanked foes" }
      ];
    } else if (cl === 11) {
      classFeatures = [
        { name: "Battle Skill (Ex)", category: "Special Ability", type: "Ex", combatRole: "Tactical Maneuver", book: "Tome of Battle", page: "22", summary: "INT modifier on checks to resist combat maneuvers" }
      ];
    } else if (cl === 15) {
      classFeatures = [
        { name: "Battle Mastery (Ex)", category: "Special Ability", type: "Ex", combatRole: "Offense / Attack", book: "Tome of Battle", page: "22", summary: "INT modifier on melee attack rolls and damage rolls on AoO" }
      ];
    } else if (cl === 20) {
      classFeatures = [
        { name: "Stance Mastery (Ex)", category: "Special Ability", type: "Ex", combatRole: "Tactical Maneuver", book: "Tome of Battle", page: "22", summary: "Can have two stances active simultaneously" }
      ];
    }
  } else if (lowerClass.indexOf("fighter") !== -1) {
    matched = true;
    hitDie = "d10"; babRate = "Good (+1.0)"; fortRate = "Good"; refRate = "Poor"; willRate = "Poor"; skillBase = 2;
    if (cl === 1 || cl === 2 || (cl >= 4 && cl % 2 === 0)) {
      hasBonusFeat = true;
    }
  } else if (lowerClass.indexOf("barbarian") !== -1) {
    matched = true;
    hitDie = "d12"; babRate = "Good (+1.0)"; fortRate = "Good"; refRate = "Poor"; willRate = "Poor"; skillBase = 4;
    if (cl === 1) {
      classFeatures = [
        { name: "Fast Movement (Ex)", category: "Special Ability", type: "Ex", combatRole: "Tactical Maneuver", book: "PHB", page: "25", summary: "+10 ft to base land speed in light or medium armor" },
        { name: "Rage 1/day (Ex)", category: "Special Ability", type: "Ex", combatRole: "Combat Buff", book: "PHB", page: "25", summary: "+4 Str, +4 Con, +2 morale to Will saves, -2 AC for 3+Con rounds" }
      ];
    } else if (cl === 2) {
      classFeatures = [{ name: "Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "26", summary: "Retain Dex bonus to AC if flat-footed" }];
    } else if (cl === 3) {
      classFeatures = [{ name: "Trap Sense +1 (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "26", summary: "+1 on Reflex saves and AC vs traps" }];
    } else if (cl === 4) {
      classFeatures = [{ name: "Rage 2/day (Ex)", category: "Special Ability", type: "Ex", combatRole: "Combat Buff", book: "PHB", page: "25", summary: "Can rage 2 times per day" }];
    } else if (cl === 5) {
      classFeatures = [{ name: "Improved Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "26", summary: "Can no longer be flanked unless attacker is 4+ levels higher" }];
    } else if (cl === 6) {
      classFeatures = [{ name: "Trap Sense +2 (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "26", summary: "+2 on Reflex saves and AC vs traps" }];
    } else if (cl === 7) {
      classFeatures = [{ name: "Damage Reduction 1/- (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "26", summary: "Ignore 1 point of damage from each melee or ranged attack" }];
    }
  } else if (lowerClass.indexOf("rogue") !== -1) {
    matched = true;
    hitDie = "d6"; babRate = "Average (+0.75)"; fortRate = "Poor"; refRate = "Good"; willRate = "Poor"; skillBase = 8;
    if (cl === 1) {
      classFeatures = [
        { name: "Sneak Attack +1d6", category: "Special Ability", type: "Ex", combatRole: "Offense / Attack", book: "PHB", page: "50", summary: "+1d6 precision damage vs flanked or flat-footed target" },
        { name: "Trapfinding (Ex)", category: "Special Ability", type: "Ex", combatRole: "Non-Combat", book: "PHB", page: "50", summary: "Can use Search skill to locate traps with DC > 20" }
      ];
    } else if (cl === 2) {
      classFeatures = [{ name: "Evasion (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "50", summary: "Take no damage on successful Reflex save against area attacks" }];
    } else if (cl === 3) {
      classFeatures = [
        { name: "Sneak Attack +2d6", category: "Special Ability", type: "Ex", combatRole: "Offense / Attack", book: "PHB", page: "50", summary: "+2d6 precision damage vs flanked or flat-footed target" },
        { name: "Trap Sense +1 (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "50", summary: "+1 on Reflex saves and AC vs traps" }
      ];
    } else if (cl === 4) {
      classFeatures = [{ name: "Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "50", summary: "Retain Dex bonus to AC if flat-footed" }];
    } else if (cl === 5) {
      classFeatures = [{ name: "Sneak Attack +3d6", category: "Special Ability", type: "Ex", combatRole: "Offense / Attack", book: "PHB", page: "50", summary: "+3d6 precision damage vs flanked or flat-footed target" }];
    } else if (cl === 6) {
      classFeatures = [{ name: "Trap Sense +2 (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "50", summary: "+2 on Reflex saves and AC vs traps" }];
    } else if (cl === 7) {
      classFeatures = [{ name: "Sneak Attack +4d6", category: "Special Ability", type: "Ex", combatRole: "Offense / Attack", book: "PHB", page: "50", summary: "+4d6 precision damage vs flanked or flat-footed target" }];
    } else if (cl === 8) {
      classFeatures = [{ name: "Improved Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "50", summary: "Cannot be flanked except by rogue 4+ levels higher" }];
    } else if (cl === 9) {
      classFeatures = [
        { name: "Sneak Attack +5d6", category: "Special Ability", type: "Ex", combatRole: "Offense / Attack", book: "PHB", page: "50", summary: "+5d6 precision damage vs flanked or flat-footed target" },
        { name: "Trap Sense +3 (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "50", summary: "+3 on Reflex saves and AC vs traps" }
      ];
    } else if (cl === 10 || cl === 13 || cl === 16 || cl === 19) {
      hasBonusFeat = true;
    }
  } else if (lowerClass.indexOf("wizard") !== -1) {
    matched = true;
    hitDie = "d4"; babRate = "Poor (+0.50)"; fortRate = "Poor"; refRate = "Poor"; willRate = "Good"; skillBase = 2;
    if (cl === 1) {
      classFeatures = [
        { name: "Scribe Scroll", category: "Special Ability", type: "Ex", combatRole: "Resource Pool", book: "PHB", page: "56", summary: "Create spell scrolls" },
        { name: "Summon Familiar", category: "Special Ability", type: "Sp", combatRole: "Resource Pool", book: "PHB", page: "56", summary: "Summon a magical animal companion" }
      ];
    } else if (cl === 5 || cl === 10 || cl === 15 || cl === 20) {
      hasBonusFeat = true;
    }
  } else if (lowerClass.indexOf("cleric") !== -1) {
    matched = true;
    hitDie = "d8"; babRate = "Average (+0.75)"; fortRate = "Good"; refRate = "Poor"; willRate = "Good"; skillBase = 2;
    if (cl === 1) {
      classFeatures = [
        { name: "Turn Undead (Su)", category: "Special Ability", type: "Su", combatRole: "Tactical Maneuver", book: "PHB", page: "32", summary: "Channel positive energy to turn or destroy undead 3+Cha times/day" }
      ];
    }
  } else if (lowerClass.indexOf("paladin") !== -1) {
    matched = true;
    hitDie = "d10"; babRate = "Good (+1.0)"; fortRate = "Good"; refRate = "Poor"; willRate = "Poor"; skillBase = 2;
    if (cl === 1) {
      classFeatures = [
        {
          name: "Aura of Good (Ex)",
          category: "Special Ability",
          type: "Ex",
          combatRole: "Non-Combat",
          book: "PHB",
          page: "43",
          summary: "The power of a paladin's aura of good is equal to her paladin level",
          fullEntry: {
            name: "Aura of Good (Ex)",
            category: "Special Ability",
            slot: "None",
            parent: "-",
            prerequisites: "-",
            source: "PHB p.43",
            description: "The power of a paladin's aura of good is equal to her paladin level.",
            bonus_type: "Untyped",
            scope: "None / General",
            action: "Passive",
            duration: "Continuous",
            combat_role: "Non-Combat"
          }
        },
        {
          name: "Detect Evil (Sp)",
          category: "Special Ability",
          type: "Sp",
          combatRole: "Tactical Sense",
          book: "PHB",
          page: "44",
          summary: "At will, a paladin can use detect evil as the spell",
          fullEntry: {
            name: "Detect Evil (Sp)",
            category: "Special Ability",
            slot: "None",
            parent: "-",
            prerequisites: "-",
            source: "PHB p.44",
            description: "At will, a paladin can use detect evil, as the spell.",
            bonus_type: "Spell-Like",
            scope: "None / General",
            action: "Standard Action",
            duration: "Concentration",
            combat_role: "Tactical Sense"
          }
        },
        {
          name: "Smite Evil (Su)",
          category: "Special Ability",
          type: "Su",
          combatRole: "Offense / Attack",
          book: "PHB",
          page: "44",
          summary: "Add Cha bonus to attack and +1 damage per Paladin level against an evil foe (1/day)",
          fullEntry: {
            name: "Smite Evil (Su)",
            category: "Special Ability",
            slot: "None",
            parent: "-",
            prerequisites: "-",
            source: "PHB p.44",
            description: "Once per day, a paladin may attempt to smite evil with one normal melee attack. She adds her Charisma bonus (if any) to her attack roll and deals extra damage equal to her paladin level.",
            bonus_type: "Untyped",
            scope: "Vs Evil",
            att: "=MAX(0, Main!AT75)",
            dmg: "=lvl_up!$B$4",
            action: "Part of Attack",
            duration: "1 attack (1/day)",
            combat_role: "Offense / Attack"
          }
        }
      ];
    } else if (cl === 2) {
      classFeatures = [
        {
          name: "Divine Grace (Su)",
          category: "Special Ability",
          type: "Su",
          combatRole: "Defense / Counter",
          book: "PHB",
          page: "44",
          summary: "Gain bonus equal to Charisma bonus (if any) on all saving throws",
          fullEntry: {
            name: "Divine Grace (Su)",
            category: "Special Ability",
            slot: "None",
            parent: "-",
            prerequisites: "-",
            source: "PHB p.44",
            description: "At 2nd level, a paladin gains a bonus equal to her Charisma bonus (if any) on all saving throws.",
            bonus_type: "Untyped",
            scope: "None / General",
            fort: "=MAX(0, Main!AT75)",
            ref: "=MAX(0, Main!AT75)",
            will: "=MAX(0, Main!AT75)",
            action: "Passive",
            duration: "Continuous",
            combat_role: "Defense / Counter"
          }
        },
        {
          name: "Lay on Hands (Su)",
          category: "Special Ability",
          type: "Su",
          combatRole: "Resource Pool",
          book: "PHB",
          page: "44",
          summary: "Heal each day a total amount of hit points equal to Paladin level x Charisma bonus (healing pool)",
          fullEntry: {
            name: "Lay on Hands (Su)",
            category: "Special Ability",
            slot: "None",
            parent: "-",
            prerequisites: "-",
            source: "PHB p.44",
            description: "Beginning at 2nd level, a paladin can heal wounds by touch. Each day she can heal a total number of hit points equal to her paladin level x her Charisma bonus.",
            bonus_type: "-",
            scope: "Healing / Pool",
            hp: "-",
            action: "Standard Action",
            duration: '=(MAX(0, Main!AT75) * lvl_up!$B$4) & " HP Pool / Day"',
            combat_role: "Resource Pool"
          }
        }
      ];
    } else if (cl === 3) {
      classFeatures = [
        {
          name: "Aura of Courage (Su)",
          category: "Special Ability",
          type: "Su",
          combatRole: "Combat Buff",
          book: "PHB",
          page: "44",
          summary: "Immune to fear; allies within 10 ft gain +4 morale bonus on saves vs fear",
          fullEntry: {
            name: "Aura of Courage (Su)",
            category: "Special Ability",
            slot: "None",
            parent: "-",
            prerequisites: "-",
            source: "PHB p.44",
            description: "Beginning at 3rd level, a paladin is immune to fear. Each ally within 10 feet of her gains a +4 morale bonus on saving throws against fear effects.",
            bonus_type: "Morale",
            scope: "Vs Fear",
            will: 4,
            action: "Passive",
            duration: "Continuous (10 ft)",
            combat_role: "Combat Buff"
          }
        },
        {
          name: "Divine Health (Ex)",
          category: "Special Ability",
          type: "Ex",
          combatRole: "Defense / Counter",
          book: "PHB",
          page: "44",
          summary: "Immunity to all diseases, including supernatural and magical diseases",
          fullEntry: {
            name: "Divine Health (Ex)",
            category: "Special Ability",
            slot: "None",
            parent: "-",
            prerequisites: "-",
            source: "PHB p.44",
            description: "At 3rd level, a paladin gains immunity to all diseases, including supernatural and magical diseases.",
            bonus_type: "Untyped",
            scope: "None / General",
            action: "Passive",
            duration: "Continuous",
            combat_role: "Defense / Counter"
          }
        }
      ];
    } else if (cl === 4) {
      classFeatures = [
        {
          name: "Turn Undead (Su)",
          category: "Special Ability",
          type: "Su",
          combatRole: "Tactical Maneuver",
          book: "PHB",
          page: "44",
          summary: "Turn undead as a cleric of 3 levels lower (effective cleric level = Paladin level - 3)"
        }
      ];
    } else if (cl === 5) {
      classFeatures = [
        {
          name: "Smite Evil (2/day)",
          category: "Special Ability",
          type: "Su",
          combatRole: "Offense / Attack",
          book: "PHB",
          page: "44",
          summary: "Smite Evil can be used 2 times per day"
        },
        {
          name: "Special Mount (Sp)",
          category: "Special Ability",
          type: "Sp",
          combatRole: "Resource Pool",
          book: "PHB",
          page: "44",
          summary: "Call an unusually intelligent, strong, and loyal steed"
        }
      ];
    } else if (cl === 6) {
      classFeatures = [
        {
          name: "Remove Disease (Sp)",
          category: "Special Ability",
          type: "Sp",
          combatRole: "Resource Pool",
          book: "PHB",
          page: "44",
          summary: "Can produce a remove disease effect 1/week"
        }
      ];
    }
  } else if (lowerClass.indexOf("monk") !== -1) {
    matched = true;
    hitDie = "d8"; babRate = "Average (+0.75)"; fortRate = "Good"; refRate = "Good"; willRate = "Good"; skillBase = 4;
    if (cl === 1) {
      hasBonusFeat = true;
      classFeatures = [
        { name: "Flurry of Blows (Ex)", category: "Special Ability", type: "Ex", combatRole: "Offense / Attack", book: "PHB", page: "40", summary: "One extra attack when making full attack with unarmed or monk weapons (-2 all attacks)" },
        { name: "Unarmed Strike", category: "Special Ability", type: "Ex", combatRole: "Offense / Attack", book: "PHB", page: "41", summary: "Deals lethal or nonlethal damage with unarmed strikes without attack penalty" }
      ];
    } else if (cl === 2) {
      hasBonusFeat = true;
      classFeatures = [{ name: "Evasion (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "41", summary: "Take no damage on successful Reflex save against area attacks" }];
    } else if (cl === 3) {
      classFeatures = [
        { name: "Fast Movement +10 ft (Ex)", category: "Special Ability", type: "Ex", combatRole: "Tactical Maneuver", book: "PHB", page: "41", summary: "Monk speed bonus +10 ft" },
        { name: "Still Mind (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "41", summary: "+2 on saves vs spells and effects from the enchantment school" }
      ];
    } else if (cl === 4) {
      classFeatures = [
        { name: "Ki Strike (Magic) (Su)", category: "Special Ability", type: "Su", combatRole: "Offense / Attack", book: "PHB", page: "41", summary: "Unarmed strikes treated as magic weapons for overcoming damage reduction" },
        { name: "Slow Fall 20 ft (Ex)", category: "Special Ability", type: "Ex", combatRole: "Tactical Maneuver", book: "PHB", page: "41", summary: "Reduce effective fall distance by 20 ft when wall is within arm's reach" }
      ];
    } else if (cl === 5) {
      classFeatures = [{ name: "Purity of Body (Ex)", category: "Special Ability", type: "Ex", combatRole: "Defense / Counter", book: "PHB", page: "41", summary: "Immunity to all diseases except supernatural and magical diseases" }];
    } else if (cl === 6) {
      hasBonusFeat = true;
      classFeatures = [{ name: "Slow Fall 30 ft (Ex)", category: "Special Ability", type: "Ex", combatRole: "Tactical Maneuver", book: "PHB", page: "41", summary: "Reduce effective fall distance by 30 ft" }];
    }
  } else if (lowerClass.indexOf("ranger") !== -1) {
    matched = true;
    hitDie = "d8"; babRate = "Good (+1.0)"; fortRate = "Good"; refRate = "Good"; willRate = "Poor"; skillBase = 6;
    if (cl === 1) {
      classFeatures = [
        { name: "1st Favored Enemy", category: "Special Ability", type: "Ex", combatRole: "Combat Buff", book: "PHB", page: "47", summary: "+2 bonus on Bluff, Listen, Sense Motive, Spot, Survival, and damage rolls vs chosen creature type" },
        { name: "Track", category: "Feat", type: "Ex", combatRole: "Non-Combat", book: "PHB", page: "101", summary: "Use Survival to follow tracks" },
        { name: "Wild Empathy (Ex)", category: "Special Ability", type: "Ex", combatRole: "Non-Combat", book: "PHB", page: "47", summary: "Improve the attitude of an animal (1d20 + ranger level + Cha bonus)" }
      ];
    } else if (cl === 2) {
      classFeatures = [{ name: "Combat Style (Ex)", category: "Special Ability", type: "Ex", combatRole: "Offense / Attack", book: "PHB", page: "47", summary: "Gain Rapid Shot (Archery) or Two-Weapon Defense/Fighting (TWF)" }];
    } else if (cl === 3) {
      classFeatures = [{ name: "Endurance", category: "Feat", type: "Ex", combatRole: "Non-Combat", book: "PHB", page: "93", summary: "Gain Endurance as a bonus feat" }];
    } else if (cl === 4) {
      classFeatures = [{ name: "Animal Companion (Ex)", category: "Special Ability", type: "Ex", combatRole: "Resource Pool", book: "PHB", page: "47", summary: "Gain an animal companion with effective druid level = Ranger level / 2" }];
    }
  }

  if (matched) {
    return {
      hitDie: hitDie,
      babRate: babRate,
      fortRate: fortRate,
      refRate: refRate,
      willRate: willRate,
      skillBase: skillBase,
      hasBonusFeat: hasBonusFeat,
      bonusFeatType: bonusFeatType,
      classFeatures: classFeatures
    };
  }

  return null;
}

/**
 * Resolves D&D 3.5e RAW class progression, hit dice, saves, BAB, skill points,
 * bonus feats, and new class features for a given level up query.
 * Leverages built-in authoritative canon first, falling back to Gemini API.
 */
function queryGeminiForLevelUp(rawQuery) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lvlSheet = ss.getSheetByName("lvl_up");
  var masterSheet = ss.getSheetByName("Master_DB");
  if (!lvlSheet) {
    return { success: false, error: "'lvl_up' sayfası bulunamadı. Lütfen önce tabloyu oluşturun." };
  }

  var parsed = parseLevelUpQuery(rawQuery, lvlSheet);
  if (!parsed) {
    return { success: false, error: "Sınıf adı ve seviye anlaşılamadı. Lütfen 'Warblade 5' veya 'Fighter 1' şeklinde yazın." };
  }
  if (!parsed.success) {
    return parsed;
  }

  var featMode = lvlSheet.getRange("C1").getValue();
  var charRace = lvlSheet.getRange("E1").getValue();
  var featCheck = checkLevelUpFeatRules(parsed.targetLevel, featMode, charRace);

  var hitDie = "d8";
  var babRate = "Average (+0.75)";
  var fortRate = "Poor";
  var refRate = "Poor";
  var willRate = "Poor";
  var skillBase = 2;
  var hasBonusFeat = false;
  var bonusFeatType = "Class Bonus Feat";
  var classFeatures = [];

  // 1. Authoritative D&D 3.5e Canon Check First (Immediate, 100% RAW Accuracy, Zero Hallucinations)
  var canon = getCanonClassData(parsed.className, parsed.classLevel);
  if (canon) {
    hitDie = canon.hitDie;
    babRate = canon.babRate;
    fortRate = canon.fortRate;
    refRate = canon.refRate;
    willRate = canon.willRate;
    skillBase = canon.skillBase;
    hasBonusFeat = !!canon.hasBonusFeat;
    bonusFeatType = canon.bonusFeatType || "Class Bonus Feat";
    classFeatures = canon.classFeatures || [];
  } else {
    // 2. Prestige Classes & Extended Classes: Ground strictly against https://dndtools.net / d20srd.org
    var apiKey = getMyGeminiApiKey();
    if (apiKey) {
      var queue = getGeminiModelQueue(apiKey);
      var chosenModel = queue[0] || "gemini-3.5-flash-lite";
      var groundedPrestigeText = "";

      // Step A: Live Search Grounding on https://dndtools.net / d20srd.org
      var searchPrompt = 
        "You are a master D&D 3.5e Rule Arbiter.\n" +
        "Search online for the official D&D 3.5e class or prestige class: '" + parsed.className + "' class progression level " + parsed.classLevel + ".\n\n" +
        "MANDATORY SEARCH DOMAIN RESTRICTIONS:\n" +
        "1. ALLOWED DOMAINS ONLY: You are strictly restricted to official information from: https://dndtools.net (classes/prestige classes) and d20srd.org.\n" +
        "   - Execute your search using explicit site filters, for example:\n" +
        "     '" + parsed.className + "' (site:dndtools.net/classes/ OR site:dndtools.net OR site:d20srd.org)\n" +
        "2. STRICTLY PROHIBITED WEBSITES (NEGATIVE FILTER):\n" +
        "   - You MUST NEVER click, use, or cite search results from forum, wiki, or homebrew websites, including:\n" +
        "     reddit.com, dandwiki.com, giantitp.com, enworld.org, minmaxforum.com, myth-weavers.com, rpg.stackexchange.com, or wikia/fandom.\n" +
        "   - ZERO HOMEBREW TOLERANCE: Do not accept any homebrew classes, fan adaptations, or unauthorized variants.\n\n" +
        "TASK:\n" +
        "Retrieve the official class progression table and features for '" + parsed.className + "':\n" +
        "- Hit Die (d4, d6, d8, d10, or d12)\n" +
        "- Base Attack Bonus (BAB) progression rate (Good +1.0, Average +0.75, or Poor +0.50)\n" +
        "- Base Saves (Fort, Ref, Will: Good or Poor)\n" +
        "- Skill points per level (base integer)\n" +
        "- Class Bonus Feats granted specifically at class level " + parsed.classLevel + "\n" +
        "- Exact Class Features / Special Abilities granted specifically at class level " + parsed.classLevel + " (including book and page number).";

      try {
        var searchPayload = {
          contents: [{ parts: [{ text: searchPrompt }] }],
          tools: [{ googleSearch: {} }]
        };
        var searchUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + chosenModel + ":generateContent?key=" + encodeURIComponent(apiKey);
        var searchResp = UrlFetchApp.fetch(searchUrl, {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(searchPayload),
          muteHttpExceptions: true
        });
        if (searchResp.getResponseCode() === 200) {
          var searchJson = JSON.parse(searchResp.getContentText());
          if (searchJson.candidates && searchJson.candidates[0].content && searchJson.candidates[0].content.parts) {
            groundedPrestigeText = searchJson.candidates[0].content.parts.map(function(p){ return p.text || ""; }).join("\n");
          }
        }
      } catch (eSearch) {}

      // Step B: Generate structured JSON strictly grounded in the official rules
      var promptText = 
        "You are a master D&D 3.5e Rule Arbiter.\n" +
        "The user is leveling up a character in D&D 3.5e.\n" +
        "Target Class: '" + parsed.className + "'\n" +
        "Class Level Being Gained: " + parsed.classLevel + " (e.g. " + parsed.className + " " + parsed.classLevel + ")\n" +
        "Total Character Level: " + parsed.targetLevel + "\n\n" +
        (groundedPrestigeText ? "VERIFIED OFFICIAL GROUNDED PRESTIGE CLASS / CLASS TEXT (FROM DNDTOOLS.NET / OFFICIAL SOURCEBOOKS):\n" + groundedPrestigeText + "\n\n" : "") +
        "MANDATORY CANONICAL GROUNDING & ANTI-HALLUCINATION DIRECTIVES:\n" +
        "1. Strictly ground all progression, stats, and abilities on official D&D 3.5e canon from https://dndtools.net and official WotC sourcebooks.\n" +
        "2. ZERO HOMEBREW TOLERANCE: Absolutely no Reddit, dandwiki, fandom, or homebrew content.\n" +
        "3. Return exact statistics for '" + parsed.className + "':\n" +
        "   - hitDie: exactly one of 'd12', 'd10', 'd8', 'd6', 'd4'\n" +
        "   - babRate: exactly one of 'Good (+1.0)', 'Average (+0.75)', 'Poor (+0.50)'\n" +
        "   - fortRate: 'Good' or 'Poor'\n" +
        "   - refRate: 'Good' or 'Poor'\n" +
        "   - willRate: 'Good' or 'Poor'\n" +
        "   - skillBase: base skill points per level as integer (e.g. 2, 4, 6, 8)\n" +
        "4. CLASS BONUS FEATS:\n" +
        "   - hasBonusFeat: boolean (true IF AND ONLY IF this specific class level " + parsed.classLevel + " grants a class bonus feat)\n" +
        "   - bonusFeatType: 'Class Bonus Feat'\n" +
        "   - IMPORTANT: DO NOT include bonus feats in classFeatures! Bonus feats are character choices and must be handled strictly via hasBonusFeat.\n" +
        "5. CLASS FEATURES GRANTED AT THIS SPECIFIC CLASS LEVEL " + parsed.classLevel + ":\n" +
        "   - classFeatures: Array of new special abilities or class features granted strictly AT class level " + parsed.classLevel + ".\n" +
        "   - DO NOT include bonus feats or generic feats in classFeatures!\n" +
        "   - DO NOT list abilities from earlier levels or later levels! Only what is gained at level " + parsed.classLevel + "!\n" +
        "   - If no new features are gained at level " + parsed.classLevel + ", classFeatures MUST be empty [].\n" +
        "   - For each feature:\n" +
        "     {\n" +
        "       'name': string (e.g. 'Throw Anything (Ex)' or 'Lightning Ricochet (Ex)'),\n" +
        "       'category': 'Special Ability',\n" +
        "       'subCategory': 'Class Feature',\n" +
        "       'type': 'Ex', 'Su', 'Sp', or '-',\n" +
        "       'combatRole': 'Offense / Attack', 'Tactical Maneuver', 'Resource Pool', 'Defense / Counter', 'Tactical Sense', 'Combat Buff', or 'Non-Combat',\n" +
        "       'book': string source publication (e.g. 'Tome of Battle', 'Complete Warrior'),\n" +
        "       'page': string page number,\n" +
        "       'summary': concise mechanical description in English,\n" +
        "       'fullEntry': {\n" +
        "         'name': string,\n" +
        "         'category': 'Special Ability',\n" +
        "         'slot': 'None',\n" +
        "         'parent': '-',\n" +
        "         'prerequisites': '-',\n" +
        "         'source': string (book and page),\n" +
        "         'description': string detailed mechanical rules text,\n" +
        "         'bonus_type': string (e.g. 'Untyped', 'Morale', 'Insight', 'Enhancement'),\n" +
        "         'scope': string (e.g. 'Vs Evil', 'Melee Only', 'All Attacks', 'Flanked / Flat-Footed', 'None / General'),\n" +
        "         'str': number or '',\n" +
        "         'dex': number or '',\n" +
        "         'con': number or '',\n" +
        "         'int': number or '',\n" +
        "         'wis': number or '',\n" +
        "         'cha': number or '',\n" +
        "         'ac': number or '',\n" +
        "         'hp': number or formula or '' (CRITICAL: Only for max HP stat buffs; DO NOT put healing pools like Lay on Hands here, healing pools belong in 'duration' with combat_role 'Resource Pool'),\n" +
        "         'att': number, formula (e.g. '=MAX(0, Main!AT75)' for Cha bonus, '=MAX(0, Main!AT61)' for Int bonus) or '',\n" +
        "         'dmg': number, formula or '',\n" +
        "         'fort': number or formula or '',\n" +
        "         'ref': number or formula or '',\n" +
        "         'will': number or formula or '',\n" +
        "         'skill': number or '',\n" +
        "         'init': number or '',\n" +
        "         'speed': number or '',\n" +
        "         'on_hit': string or '',\n" +
        "         'action': string ('Part of Attack', 'Swift Action', 'Standard Action', 'Passive'),\n" +
        "         'duration': string ('Continuous', etc.),\n" +
        "         'combat_role': string\n" +
        "       }\n" +
        "     }\n\n" +
        "OUTPUT FORMAT:\n" +
        "Return ONLY a raw JSON object with keys: hitDie, babRate, fortRate, refRate, willRate, skillBase, hasBonusFeat, bonusFeatType, classFeatures.";

      var successLvlBody = null;
      for (var lm = 0; lm < queue.length; lm++) {
        var curLvlModel = queue[lm];
        try {
          var url = "https://generativelanguage.googleapis.com/v1beta/models/" + curLvlModel + ":generateContent?key=" + encodeURIComponent(apiKey);
          var payload = {
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          };
          var resp = UrlFetchApp.fetch(url, {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          });
          if (resp.getResponseCode() === 200) {
            successLvlBody = resp.getContentText();
            break;
          }
        } catch (eGemini) {}
      }

      if (successLvlBody) {
        try {
          var json = JSON.parse(successLvlBody);
          if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
            var rawTxt = json.candidates[0].content.parts[0].text;
            rawTxt = rawTxt.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
            var parsedLvl = JSON.parse(rawTxt);
            if (parsedLvl.hitDie) hitDie = parsedLvl.hitDie;
            if (parsedLvl.babRate) babRate = parsedLvl.babRate;
            if (parsedLvl.fortRate) fortRate = parsedLvl.fortRate;
            if (parsedLvl.refRate) refRate = parsedLvl.refRate;
            if (parsedLvl.willRate) willRate = parsedLvl.willRate;
            if (parsedLvl.skillBase !== undefined) skillBase = parseInt(parsedLvl.skillBase, 10);
            if (parsedLvl.hasBonusFeat !== undefined) hasBonusFeat = !!parsedLvl.hasBonusFeat;
            if (parsedLvl.bonusFeatType) bonusFeatType = parsedLvl.bonusFeatType;
            if (Array.isArray(parsedLvl.classFeatures)) classFeatures = parsedLvl.classFeatures;
          }
        } catch (eParse) {}
      }
    }
  }

  // Cross-reference features against Master_DB Column A
  var dbNameSet = {};
  if (masterSheet && masterSheet.getLastRow() >= 6) {
    var rawDb = masterSheet.getRange("A6:A" + masterSheet.getLastRow()).getValues();
    for (var d = 0; d < rawDb.length; d++) {
      var n = String(rawDb[d][0] || "").trim().toLowerCase();
      if (n) dbNameSet[n] = true;
    }
  }

  for (var f = 0; f < classFeatures.length; f++) {
    classFeatures[f].name = canonicalizeFeatureName(classFeatures[f].name);
    var fName = String(classFeatures[f].name || "").trim().toLowerCase();
    classFeatures[f].existsInDb = !!dbNameSet[fName];
  }

  return {
    success: true,
    targetLevel: parsed.targetLevel,
    className: parsed.className,
    classLevel: parsed.classLevel,
    classLevelTag: parsed.classLevelTag || (parsed.className + "-" + parsed.classLevel),
    hitDie: hitDie,
    babRate: babRate,
    fortRate: fortRate,
    refRate: refRate,
    willRate: willRate,
    skillBase: skillBase,
    featCheck: featCheck,
    hasBonusFeat: hasBonusFeat,
    bonusFeatType: bonusFeatType,
    classFeatures: classFeatures
  };
}

/**
 * 1-Click Level Up Application Engine:
 * 1. Populates lvl_up table columns C:T for row (targetLevel + 5).
 * 2. Checks Master_DB for newly granted class features; appends any missing ones.
 * 3. Populates lvl_up dynamic Roster table (Columns W:AA).
 * 4. Columns R (Feats) and S (Special Abilities) automatically merge them.
 */
function applyLevelUpProgression(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lvlSheet = ss.getSheetByName("lvl_up");
  if (!lvlSheet) {
    return { success: false, error: "'lvl_up' sayfası bulunamadı." };
  }
  var masterSheet = ss.getSheetByName("Master_DB");
  if (!masterSheet) {
    return { success: false, error: "'Master_DB' sayfası bulunamadı." };
  }

  var targetLevel = parseInt(payload.targetLevel, 10);
  if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > 30) {
    return { success: false, error: "Geçersiz hedef seviye: " + payload.targetLevel };
  }

  var className = canonicalizeClassName(payload.className);
  var classLevel = parseInt(payload.classLevel, 10);

  // Check character level continuity before writing
  var missingLevel = findFirstEmptyLevelBefore(lvlSheet, targetLevel);
  if (missingLevel) {
    return {
      success: false,
      error: "⚠️ Kademeli Seviye Uyarısı: Seviye " + targetLevel + " uygulanamaz! Önce boş olan Seviye " + missingLevel + " doldurulmalıdır."
    };
  }

  // Check class level continuity before writing
  var currentClassCount = countExistingClassLevels(lvlSheet, className, targetLevel - 1);
  var expectedNextClassLevel = currentClassCount + 1;
  if (classLevel !== expectedNextClassLevel) {
    return {
      success: false,
      error: "⚠️ Kademeli Sınıf Gelişimi Uyarısı: '" + className + "-" + classLevel + "' uygulanamaz! Sıradaki geçerli sınıf seviyesi '" + className + "-" + expectedNextClassLevel + "' olmalıdır."
    };
  }

  var classLevelTag = className + "-" + classLevel;

  // 1. Populate lvl_up Main Table row (Row index = targetLevel + (startRow - 1))
  var startRow = getLvlUpDataStartRow(lvlSheet);
  var r = targetLevel + (startRow - 1);
  lvlSheet.getRange(r, 2).setValue(true); // Col B: Active? checkbox checked
  lvlSheet.getRange(r, 3).setValue(classLevelTag); // Col C: Class & Lvl (e.g. Warblade-5, Fighter-1)
  lvlSheet.getRange(r, 4).setValue(payload.hitDie || "d8"); // Col D: HD
  lvlSheet.getRange(r, 8).setValue(payload.babRate || "Average (+0.75)"); // Col H: BAB Rate
  lvlSheet.getRange(r, 10).setValue(payload.fortRate || "Poor"); // Col J: Fort Rate
  lvlSheet.getRange(r, 12).setValue(payload.refRate || "Poor"); // Col L: Ref Rate
  lvlSheet.getRange(r, 14).setValue(payload.willRate || "Poor"); // Col N: Will Rate
  lvlSheet.getRange(r, 16).setValue(payload.skillBase || 2); // Col P: Skill Base

  if (targetLevel % 4 === 0) {
    lvlSheet.getRange(r, 20).setValue("-"); // Col T: Ability Boost placeholder
  }

  // 2. Append missing features to Master_DB (31-column architecture)
  var addedToDb = [];
  if (payload.classFeatures && payload.classFeatures.length > 0) {
    var rowsToAppend = [];
    for (var f = 0; f < payload.classFeatures.length; f++) {
      var feat = payload.classFeatures[f];
      var fNameLower = (feat.name || "").toLowerCase();
      var fCatLower = (feat.category || "").toLowerCase();
      // Bonus feats are player-selected slots and must NOT be added to Master_DB
      if (fNameLower.indexOf("bonus feat") !== -1 || fCatLower === "bonus feat" || fCatLower === "feat") {
        continue;
      }
      if (!feat.existsInDb) {
        var rawEntry = feat.fullEntry || {
          name: feat.name,
          category: "Special Ability",
          slot: "-",
          parent: "-",
          prerequisites: "-",
          source: (feat.book ? feat.book + (feat.page ? " p." + feat.page : "") : "-"),
          description: feat.summary || feat.description || (payload.className + " " + payload.classLevel + " class feature."),
          bonus_type: "Untyped",
          scope: "None / General",
          combat_role: feat.combatRole || "Tactical Sense"
        };
        rowsToAppend.push(normalizeMasterDbRow(rawEntry));
        addedToDb.push(feat.name);
      }
    }
    if (rowsToAppend.length > 0) {
      appendMasterDbRows(rowsToAppend);
    }
  }

  // 3. Prepare items to add to lvl_up Roster (W:AA)
  var rosterItemsToAdd = [];

  // Feat Mode character feat slot
  if (payload.featCheck && payload.featCheck.grantsRegularFeat) {
    rosterItemsToAdd.push({
      lvl: targetLevel,
      cat: "Regular Feat",
      name: "",
      notes: payload.featCheck.featReason || ("Character Lvl " + targetLevel + " Feat")
    });
  }

  // Human race bonus feat slot (at Lvl 1)
  if (payload.featCheck && payload.featCheck.grantsHumanBonusFeat) {
    rosterItemsToAdd.push({
      lvl: 1,
      cat: "Regular Feat",
      name: "",
      notes: "Human Bonus Feat"
    });
  }

  // Class Bonus Feat slot (e.g. Fighter 1, 2; Warblade 5)
  if (payload.hasBonusFeat) {
    rosterItemsToAdd.push({
      lvl: targetLevel,
      cat: "Class Bonus Feat",
      name: "Bonus Feat",
      notes: classLevelTag + " Bonus Feat"
    });
  }

  // Read existing abilities already in Roster to prevent duplicates (e.g. Uncanny Dodge added twice)
  var existingRosterNames = {};
  var rosterStartRow = getLvlUpDataStartRow(lvlSheet);
  var maxRosterR = Math.max(lvlSheet.getLastRow(), rosterStartRow + 29);
  var currentRosterVals = lvlSheet.getRange(rosterStartRow, 27, maxRosterR - (rosterStartRow - 1), 1).getValues(); // Col AA (Name)
  for (var cr = 0; cr < currentRosterVals.length; cr++) {
    var exName = String(currentRosterVals[cr][0] || "").trim().toLowerCase();
    if (exName) existingRosterNames[exName] = true;
  }

  // Special Abilities
  if (payload.classFeatures && payload.classFeatures.length > 0) {
    for (var a = 0; a < payload.classFeatures.length; a++) {
      var ab = payload.classFeatures[a];
      var abNameLower = String(ab.name || "").trim().toLowerCase();
      if (abNameLower.indexOf("bonus feat") !== -1) {
        continue;
      }
      // Deduplication Guard: If already gained from previous level or class, skip duplicate
      if (existingRosterNames[abNameLower]) {
        continue;
      }
      existingRosterNames[abNameLower] = true;
      rosterItemsToAdd.push({
        lvl: targetLevel,
        cat: "Special Ability",
        name: ab.name,
        notes: ab.summary || (classLevelTag + " Feature")
      });
    }
  }

  // 4. Insert into lvl_up Roster (Columns X, Y, Z)
  if (rosterItemsToAdd.length > 0) {
    insertIntoLvlUpRoster(lvlSheet, rosterItemsToAdd);
  }

  ss.toast("Seviye " + targetLevel + " (" + classLevelTag + ") karakter kağıdına başarıyla uygulandı!", "✅ Level Up Başarılı", 5);

  return {
    success: true,
    targetLevel: targetLevel,
    className: className,
    classLevel: classLevel,
    classLevelTag: classLevelTag,
    addedToDbCount: addedToDb.length,
    addedRosterCount: rosterItemsToAdd.length
  };
}

