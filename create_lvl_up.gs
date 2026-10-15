/**
 * D&D 3.5e Google Sheets - Master Engine
 * lvl_up Sheet Builder (Levels 1-30 + Checkbox Planning + Human Skill Bonus + 100-Row Feats/Abilities Roster)
 */
function createLevelUpSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ----------------------------------------------------
  // 1. ENSURE Master_DB DUMMY SEED EXISTS
  // ----------------------------------------------------
  var dbSheet = ss.getSheetByName("Master_DB");
  if (!dbSheet) {
    dbSheet = ss.insertSheet("Master_DB");
    dbSheet.setTabColor("#1e3a5f");
    dbSheet.getRange("A1").setValue("Feat / Ability Name").setFontWeight("bold").setBackground("#334155").setFontColor("#ffffff");
  }
  
  var initialFeats = [
    "Power Attack", "Cleave", "Great Cleave", "Weapon Focus", "Weapon Specialization",
    "Improved Initiative", "Iron Will", "Great Fortitude", "Lightning Reflexes",
    "Toughness", "Dodge", "Mobility", "Spring Attack", "Combat Expertise",
    "Improved Trip", "Improved Disarm", "Combat Reflexes", "Combat Brute",
    "Improved Bull Rush", "Improved Sunder", "Improved Shield Bash", "Shield Specialization",
    "Shield Sling", "Agile Shield Fighter", "Point Blank Shot", "Precise Shot",
    "Leadership", "Flaw: Shaky", "Flaw: Frail", "Flaw: Meager Heft", "Flaw: Vulnerable",
    "Endurance", "Diehard", "Steadfast Determination", "Leap Attack",
    "Battle Clarity (Ex)", "Weapon Aptitude (Ex)", "Uncanny Dodge (Ex)",
    "Improved Uncanny Dodge (Ex)", "Trapfinding (Ex)", "Evasion (Ex)",
    "Returning Attacks (Ex)", "Throw Anything (Ex)", "Martial Throw (Ex)",
    "Thunderous Throw (Ex)", "Lightning Ricochet (Ex)", "Blood Wind Ricochet (Ex)",
    "Eye of the Storm (Ex)", "Blood Rain (Ex)", "Blade Storm (Ex)"
  ];
  
  // Seed Master_DB with dummy list if currently empty
  if (dbSheet.getRange("A2").getValue() === "") {
    var seedData = [];
    for (var i = 0; i < initialFeats.length; i++) {
      seedData.push([initialFeats[i]]);
    }
    dbSheet.getRange(2, 1, seedData.length, 1).setValues(seedData);
  }

  // ----------------------------------------------------
  // 2. SETUP lvl_up SHEET
  // ----------------------------------------------------
  var sheetName = "lvl_up";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
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

  // ----------------------------------------------------
  // 3. SETTINGS PANEL (Rows 1-3)
  // ----------------------------------------------------
  sheet.getRange("A1:U3").setBackground("#f3f6f4");
  
  sheet.getRange("A1").setValue("⚙️ SETTINGS:").setFontWeight("bold").setFontColor("#1e3a2f");
  sheet.getRange("B1").setValue("Feat Mode:");
  sheet.getRange("C1").setValue("Standard 3.5e (1, 3, 6, 9, 12, 15, 18)")
       .setBackground("#ffffff").setFontWeight("bold");
       
  var featRuleRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Standard 3.5e (1, 3, 6, 9, 12, 15, 18)",
    "Every 2 Levels (1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20)",
    "Every 4 Levels (1, 4, 8, 12, 16, 20)",
    "All Free / Custom"
  ], true).build();
  sheet.getRange("C1").setDataValidation(featRuleRule);

  sheet.getRange("D1").setValue("Character Race:");
  sheet.getRange("E1").setValue("Human (+4 at Lvl 1, +1/lvl)")
       .setBackground("#ffffff").setFontWeight("bold");
  var raceRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Human (+4 at Lvl 1, +1/lvl)",
    "Non-Human / Other"
  ], true).build();
  sheet.getRange("E1").setDataValidation(raceRule);

  sheet.getRange("B2").setValue("BAB & Save System:");
  sheet.getRange("C2").setValue("Fractional (Unearthed Arcana)")
       .setBackground("#ffffff").setFontWeight("bold");
       
  var babRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Fractional (Unearthed Arcana)",
    "Standard Core 3.5e"
  ], true).build();
  sheet.getRange("C2").setDataValidation(babRule);

  sheet.getRange("D2").setValue("Race Skill Bonus:");
  sheet.getRange("E2").setFormula(f('=IF(LEFT($E$1, 5)="Human", "Active (+4 at L1, +1/lvl)", "None")'))
       .setBackground("#e8f5e9").setFontWeight("bold").setFontColor("#2e7d32");

  sheet.getRange("B3").setValue("Level 1 Max HP Rule:");
  sheet.getRange("C3").setValue("Yes (Max Hit Die at Lvl 1)")
       .setBackground("#ffffff").setFontWeight("bold");
       
  var hpRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Yes (Max Hit Die at Lvl 1)",
    "No (Roll at Lvl 1)"
  ], true).build();
  sheet.getRange("C3").setDataValidation(hpRule);

  // ----------------------------------------------------
  // 4. SUMMARY TOTALS ROW (Row 4 - Active Checked Levels Only)
  // ----------------------------------------------------
  sheet.getRange("A4:U4").setBackground("#d9ead3").setFontWeight("bold");
  sheet.getRange("A4").setValue("ACTIVE LVL:").setHorizontalAlignment("right");
  sheet.getRange("B4").setFormula(f('=COUNTIF(B6:B35, TRUE)')).setHorizontalAlignment("center");
  sheet.getRange("C4").setFormula(f('="of " & COUNTA(C6:C35) & " planned"')).setFontStyle("italic");
  sheet.getRange("D4").setValue("");
  sheet.getRange("E4").setValue("Base HP:").setHorizontalAlignment("right");
  sheet.getRange("F4").setFormula(f('=SUMIF($B$6:$B$35, TRUE, $F$6:$F$35)')).setHorizontalAlignment("center");
  sheet.getRange("G4").setValue("");
  sheet.getRange("H4").setValue("Base BAB:").setHorizontalAlignment("right");
  sheet.getRange("I4").setFormula(f('=IF($C$2="Fractional (Unearthed Arcana)", INT(SUMIF($B$6:$B$35, TRUE, $I$6:$I$35)), SUMIF($B$6:$B$35, TRUE, $I$6:$I$35))')).setHorizontalAlignment("center");
  sheet.getRange("J4").setValue("Fort:").setHorizontalAlignment("right");
  sheet.getRange("K4").setFormula(f('=IF($C$2="Fractional (Unearthed Arcana)", INT(SUMIF($B$6:$B$35, TRUE, $K$6:$K$35)), SUMIF($B$6:$B$35, TRUE, $K$6:$K$35))')).setHorizontalAlignment("center");
  sheet.getRange("L4").setValue("Ref:").setHorizontalAlignment("right");
  sheet.getRange("M4").setFormula(f('=IF($C$2="Fractional (Unearthed Arcana)", INT(SUMIF($B$6:$B$35, TRUE, $M$6:$M$35)), SUMIF($B$6:$B$35, TRUE, $M$6:$M$35))')).setHorizontalAlignment("center");
  sheet.getRange("N4").setValue("Will:").setHorizontalAlignment("right");
  sheet.getRange("O4").setFormula(f('=IF($C$2="Fractional (Unearthed Arcana)", INT(SUMIF($B$6:$B$35, TRUE, $O$6:$O$35)), SUMIF($B$6:$B$35, TRUE, $O$6:$O$35))')).setHorizontalAlignment("center");
  sheet.getRange("P4").setValue("Skill Pts:").setHorizontalAlignment("right");
  sheet.getRange("Q4").setFormula(f('=SUMIF($B$6:$B$35, TRUE, $Q$6:$Q$35)')).setHorizontalAlignment("center");
  sheet.getRange("R4:U4").setValue("");

  // ----------------------------------------------------
  // 5. TABLE HEADERS (Row 5)
  // ----------------------------------------------------
  var mainHeaders = [
    "LVL", "Active?", "Class & Lvl", "HD", "HP Roll", "HP Gain", "Cumul HP",
    "BAB Rate", "BAB Gain", "Fort Rate", "Fort Gain", "Ref Rate", "Ref Gain",
    "Will Rate", "Will Gain", "Skill Base", "Skill Gain",
    "Feats (Auto-Merged)", "Special Abilities (Auto-Merged)", "Ability Boost", "Notes"
  ];
  sheet.getRange(5, 1, 1, mainHeaders.length).setValues([mainHeaders]);
  sheet.getRange("A5:U5")
       .setBackground("#356854").setFontColor("#ffffff").setFontWeight("bold")
       .setHorizontalAlignment("center").setVerticalAlignment("middle");

  sheet.setColumnWidth(22, 20);
  sheet.getRange("V1:V105").setBackground("#e2e8f0");

  sheet.getRange("W1:AA3").setBackground("#e0f2fe");
  sheet.getRange("W1").setValue("📜 FEATS & ABILITIES ROSTER (100 Rows)").setFontWeight("bold").setFontColor("#0369a1");
  sheet.getRange("W2").setValue("Single-item entries from Master_DB. Auto-summarized into the Level Up table.");
  
  var rosterHeaders = ["#", "Level", "Category / Type", "Feat / Ability Name (Master_DB)", "Notes & Details"];
  sheet.getRange(5, 23, 1, rosterHeaders.length).setValues([rosterHeaders]);
  sheet.getRange("W5:AA5")
       .setBackground("#1e3a5f").setFontColor("#ffffff").setFontWeight("bold")
       .setHorizontalAlignment("center").setVerticalAlignment("middle");

  sheet.setRowHeight(5, 28);

  // Checkboxes for column B
  sheet.getRange("B6:B35").insertCheckboxes();

  // Validations
  var hdRule = SpreadsheetApp.newDataValidation().requireValueInList(["d4", "d6", "d8", "d10", "d12"], true).build();
  var babRateRule = SpreadsheetApp.newDataValidation().requireValueInList(["Good (+1.0)", "Average (+0.75)", "Poor (+0.50)"], true).build();
  var saveRateRule = SpreadsheetApp.newDataValidation().requireValueInList(["Good", "Poor"], true).build();
  var abilityBoostRule = SpreadsheetApp.newDataValidation().requireValueInList(["-", "STR +1", "DEX +1", "CON +1", "INT +1", "WIS +1", "CHA +1"], true).build();

  sheet.getRange("D6:D35").setDataValidation(hdRule);
  sheet.getRange("H6:H35").setDataValidation(babRateRule);
  sheet.getRange("J6:J35").setDataValidation(saveRateRule);
  sheet.getRange("L6:L35").setDataValidation(saveRateRule);
  sheet.getRange("N6:N35").setDataValidation(saveRateRule);
  sheet.getRange("T6:T35").setDataValidation(abilityBoostRule);

  var lvlRangeList = [];
  for (var l = 1; l <= 30; l++) lvlRangeList.push(String(l));
  var rosterLvlRule = SpreadsheetApp.newDataValidation().requireValueInList(lvlRangeList, true).build();
  var rosterTypeRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Regular Feat", "Class Bonus Feat", "DM Grant", "Flaw", "Racial Trait", "Special Ability"
  ], true).build();
  var masterDbFeatRule = SpreadsheetApp.newDataValidation().requireValueInRange(dbSheet.getRange("A5:A300"), true).build();

  sheet.getRange("X6:X105").setDataValidation(rosterLvlRule);
  sheet.getRange("Y6:Y105").setDataValidation(rosterTypeRule);
  sheet.getRange("Z6:Z105").setDataValidation(masterDbFeatRule);

  // Rows 1-30 Formulas & Checkbox states
  for (var lvl = 1; lvl <= 30; lvl++) {
    var r = lvl + 5;
    sheet.getRange(r, 1).setValue(lvl).setHorizontalAlignment("center").setFontWeight("bold");

    if (lvl <= 16) {
      sheet.getRange(r, 2).setValue(true);
    } else {
      sheet.getRange(r, 2).setValue(false);
    }

    var hpGainFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IF(E' + r + '<>"", E' + r + ', IF(AND(A' + r + '=1, $C$3="Yes (Max Hit Die at Lvl 1)"), IF(D' + r + '="d12", 12, IF(D' + r + '="d10", 10, IF(D' + r + '="d8", 8, IF(D' + r + '="d6", 6, 4)))), 0)))'
    );
    sheet.getRange(r, 6).setFormula(hpGainFormula).setHorizontalAlignment("center");

    var cumulHpFormula = f('=IF(ISBLANK(C' + r + '), "", SUM($F$6:F' + r + '))');
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
      '=IF(ISBLANK(C' + r + '), "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER($Z$6:$Z$105, $X$6:$X$105=A' + r + ', $Y$6:$Y$105<>"Special Ability")), ""))'
    );
    sheet.getRange(r, 18).setFormula(featMergeFormula);

    var specMergeFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER($Z$6:$Z$105, $X$6:$X$105=A' + r + ', $Y$6:$Y$105="Special Ability")), ""))'
    );
    sheet.getRange(r, 19).setFormula(specMergeFormula);

    sheet.getRange(r, 20).setValue("-");
    if (lvl % 4 === 0) {
      sheet.getRange(r, 20).setBackground("#fff2cc");
    }
  }

  // Conditional Formatting: If Level is checked (B=TRUE), highlight row in soft gray
  sheet.clearConditionalFormatRules();
  var grayRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$B6=TRUE')
    .setBackground("#e2e8f0")
    .setRanges([sheet.getRange("A6:U35")])
    .build();
  sheet.setConditionalFormatRules([grayRule]);

  // Populate 100 Roster Index Numbers
  for (var n = 1; n <= 100; n++) {
    sheet.getRange(n + 5, 23).setValue(n).setHorizontalAlignment("center").setFontColor("#64748b");
  }

  // Seed sample feats
  var sampleRoster = [
    { lvl: 1, type: "Regular Feat", name: "Power Attack", notes: "Standard 1st level feat" },
    { lvl: 1, type: "Class Bonus Feat", name: "Weapon Focus", notes: "Warblade Weapon Focus" },
    { lvl: 1, type: "Flaw", name: "Flaw: Shaky", notes: "-2 penalty on ranged attack rolls" },
    { lvl: 1, type: "Flaw", name: "Flaw: Frail", notes: "-1 HP per hit die" },
    { lvl: 1, type: "DM Grant", name: "Endurance", notes: "+4 on checks against exhaustion" },
    { lvl: 1, type: "DM Grant", name: "Steadfast Determination", notes: "Use CON modifier for Will saves" },
    { lvl: 1, type: "Special Ability", name: "Battle Clarity (Ex)", notes: "INT modifier to Reflex saves" },
    { lvl: 1, type: "Special Ability", name: "Weapon Aptitude (Ex)", notes: "Can switch weapon feats daily" },
    { lvl: 2, type: "Special Ability", name: "Uncanny Dodge (Ex)", notes: "Retain DEX bonus to AC if flat-footed" },
    { lvl: 3, type: "Regular Feat", name: "Improved Bull Rush", notes: "Prereq for Shock Trooper" },
    { lvl: 3, type: "Class Bonus Feat", name: "Improved Sunder", notes: "Bonus feat" }
  ];

  for (var k = 0; k < sampleRoster.length; k++) {
    var item = sampleRoster[k];
    var rIndex = k + 6;
    sheet.getRange(rIndex, 24).setValue(item.lvl);
    sheet.getRange(rIndex, 25).setValue(item.type);
    sheet.getRange(rIndex, 26).setValue(item.name);
  }

  // Col AA (Notes & Details): Auto-lookup description from Master_DB
  for (var rIndex = 6; rIndex <= 105; rIndex++) {
    sheet.getRange(rIndex, 27).setFormula(f('=IF(ISBLANK(Z' + rIndex + '), "", IFERROR(VLOOKUP(Z' + rIndex + ', Master_DB!$A$5:$F, 6, FALSE), ""))'));
  }

  var sampleClasses = [
    { lvl: 1, cls: "Warblade-1", hd: "d12", roll: 12, bab: "Good (+1.0)", f: "Good", r: "Poor", w: "Poor", sk: 4, boost: "-" },
    { lvl: 2, cls: "Warblade-2", hd: "d12", roll: 10, bab: "Good (+1.0)", f: "Good", r: "Poor", w: "Poor", sk: 4, boost: "-" },
    { lvl: 3, cls: "Warblade-3", hd: "d12", roll: 8,  bab: "Good (+1.0)", f: "Good", r: "Poor", w: "Poor", sk: 4, boost: "-" },
    { lvl: 4, cls: "Warblade-4", hd: "d12", roll: 11, bab: "Good (+1.0)", f: "Good", r: "Poor", w: "Poor", sk: 4, boost: "INT +1" }
  ];

  for (var c = 0; c < sampleClasses.length; c++) {
    var sc = sampleClasses[c];
    var row = sc.lvl + 5;
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

  sheet.getRange("I6:I35").setNumberFormat("0.00");
  sheet.getRange("K6:K35").setNumberFormat("0.00");
  sheet.getRange("M6:M35").setNumberFormat("0.00");
  sheet.getRange("O6:O35").setNumberFormat("0.00");

  sheet.setColumnWidth(1, 45);   // LVL
  sheet.setColumnWidth(2, 60);   // Active?
  sheet.setColumnWidth(3, 130);  // Class
  sheet.setColumnWidth(4, 55);   // HD
  sheet.setColumnWidth(5, 70);   // HP Roll
  sheet.setColumnWidth(6, 70);   // HP Gain
  sheet.setColumnWidth(7, 75);   // Cumul HP
  sheet.setColumnWidth(8, 110);  // BAB Rate
  sheet.setColumnWidth(9, 70);   // BAB Gain
  sheet.setColumnWidth(10, 75);  // Fort Rate
  sheet.setColumnWidth(11, 70);  // Fort Gain
  sheet.setColumnWidth(12, 75);  // Ref Rate
  sheet.setColumnWidth(13, 70);  // Ref Gain
  sheet.setColumnWidth(14, 75);  // Will Rate
  sheet.setColumnWidth(15, 70);  // Will Gain
  sheet.setColumnWidth(16, 75);  // Skill Base
  sheet.setColumnWidth(17, 75);  // Skill Gain
  sheet.setColumnWidth(18, 180); // Feats (Auto-Merged)
  sheet.setColumnWidth(19, 200); // Special Abilities (Auto-Merged)
  sheet.setColumnWidth(20, 100); // Ability Boost
  sheet.setColumnWidth(21, 140); // Notes
  
  sheet.setColumnWidth(23, 35);  // #
  sheet.setColumnWidth(24, 60);  // Level
  sheet.setColumnWidth(25, 130); // Category / Type
  sheet.setColumnWidth(26, 200); // Feat / Ability Name
  sheet.setColumnWidth(27, 220); // Notes & Details

  sheet.getRange("A6:U35").setBorder(true, true, true, true, true, true, "#d0d7de", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("W6:AA105").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("R6:S35").setWrap(true);
  sheet.getRange("AA6:AA105").setWrap(true);

  SpreadsheetApp.getActiveSpreadsheet().toast("lvl_up (Lvl 1-30 with Checkboxes & Human Skill Rule) updated successfully!", "✅ Success", 6);
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

  // Ensure sheet does not scroll past column AB (28 columns)
  limitLvlUpColumnsSheet(sheet);

  var sep = getFormulaSeparator(sheet);
  function f(str) {
    return str.replace(/,/g, sep);
  }

  // 1. Re-align Settings Labels & References
  sheet.getRange("A1").setValue("⚙️ SETTINGS:").setFontWeight("bold").setFontColor("#1e3a2f");
  sheet.getRange("B1").setValue("Feat Mode:");
  sheet.getRange("D1").setValue("Character Race:");
  sheet.getRange("B2").setValue("BAB & Save System:");
  sheet.getRange("D2").setValue("Race Skill Bonus:");
  sheet.getRange("E2").setFormula(f('=IF(LEFT($E$1, 5)="Human", "Active (+4 at L1, +1/lvl)", "None")'));
  sheet.getRange("B3").setValue("Level 1 Max HP Rule:");

  // 2. Re-align Row 4 Totals (Active Checked Levels Only)
  sheet.getRange("A4:U4").setBackground("#d9ead3").setFontWeight("bold");
  sheet.getRange("A4").setValue("ACTIVE LVL:").setHorizontalAlignment("right");
  sheet.getRange("B4").setFormula(f('=COUNTIF(B6:B35, TRUE)')).setHorizontalAlignment("center");
  sheet.getRange("C4").setFormula(f('="of " & COUNTA(C6:C35) & " planned"')).setFontStyle("italic");
  sheet.getRange("D4").setValue("");
  sheet.getRange("E4").setValue("Base HP:").setHorizontalAlignment("right");
  sheet.getRange("F4").setFormula(f('=SUMIF($B$6:$B$35, TRUE, $F$6:$F$35)')).setHorizontalAlignment("center");
  sheet.getRange("G4").setValue("");
  sheet.getRange("H4").setValue("Base BAB:").setHorizontalAlignment("right");
  sheet.getRange("I4").setFormula(f('=IF($C$2="Fractional (Unearthed Arcana)", INT(SUMIF($B$6:$B$35, TRUE, $I$6:$I$35)), SUMIF($B$6:$B$35, TRUE, $I$6:$I$35))')).setHorizontalAlignment("center");
  sheet.getRange("J4").setValue("Fort:").setHorizontalAlignment("right");
  sheet.getRange("K4").setFormula(f('=IF($C$2="Fractional (Unearthed Arcana)", INT(SUMIF($B$6:$B$35, TRUE, $K$6:$K$35)), SUMIF($B$6:$B$35, TRUE, $K$6:$K$35))')).setHorizontalAlignment("center");
  sheet.getRange("L4").setValue("Ref:").setHorizontalAlignment("right");
  sheet.getRange("M4").setFormula(f('=IF($C$2="Fractional (Unearthed Arcana)", INT(SUMIF($B$6:$B$35, TRUE, $M$6:$M$35)), SUMIF($B$6:$B$35, TRUE, $M$6:$M$35))')).setHorizontalAlignment("center");
  sheet.getRange("N4").setValue("Will:").setHorizontalAlignment("right");
  sheet.getRange("O4").setFormula(f('=IF($C$2="Fractional (Unearthed Arcana)", INT(SUMIF($B$6:$B$35, TRUE, $O$6:$O$35)), SUMIF($B$6:$B$35, TRUE, $O$6:$O$35))')).setHorizontalAlignment("center");
  sheet.getRange("P4").setValue("Skill Pts:").setHorizontalAlignment("right");
  sheet.getRange("Q4").setFormula(f('=SUMIF($B$6:$B$35, TRUE, $Q$6:$Q$35)')).setHorizontalAlignment("center");
  sheet.getRange("R4:U4").setValue("");

  // 3. Ensure Row 5 Headers are in exact columns
  var mainHeaders = [
    "LVL", "Active?", "Class & Lvl", "HD", "HP Roll", "HP Gain", "Cumul HP",
    "BAB Rate", "BAB Gain", "Fort Rate", "Fort Gain", "Ref Rate", "Ref Gain",
    "Will Rate", "Will Gain", "Skill Base", "Skill Gain",
    "Feats (Auto-Merged)", "Special Abilities (Auto-Merged)", "Ability Boost", "Notes"
  ];
  sheet.getRange(5, 1, 1, mainHeaders.length).setValues([mainHeaders]);
  sheet.getRange("A5:U5")
       .setBackground("#356854").setFontColor("#ffffff").setFontWeight("bold")
       .setHorizontalAlignment("center").setVerticalAlignment("middle");

  // Ensure Column B has checkboxes
  sheet.getRange("B6:B35").insertCheckboxes();

  // 4. Re-inject exact formulas into columns F, G, I, K, M, O, Q, R, S for rows 6-35
  for (var lvl = 1; lvl <= 30; lvl++) {
    var r = lvl + 5;
    sheet.getRange(r, 1).setValue(lvl).setHorizontalAlignment("center").setFontWeight("bold");

    // HP Gain (Col F)
    var hpGainFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IF(E' + r + '<>"", E' + r + ', IF(AND(A' + r + '=1, $C$3="Yes (Max Hit Die at Lvl 1)"), IF(D' + r + '="d12", 12, IF(D' + r + '="d10", 10, IF(D' + r + '="d8", 8, IF(D' + r + '="d6", 6, 4)))), 0)))'
    );
    sheet.getRange(r, 6).setFormula(hpGainFormula).setHorizontalAlignment("center");

    // Cumul HP (Col G)
    var cumulHpFormula = f('=IF(ISBLANK(C' + r + '), "", SUM($F$6:F' + r + '))');
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
      '=IF(ISBLANK(C' + r + '), "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER($Z$6:$Z$105, $X$6:$X$105=A' + r + ', $Y$6:$Y$105<>"Special Ability")), ""))'
    );
    sheet.getRange(r, 18).setFormula(featMergeFormula);

    // Special Abilities Merge (Col S)
    var specMergeFormula = f(
      '=IF(ISBLANK(C' + r + '), "", IFERROR(TEXTJOIN(CHAR(10), TRUE, FILTER($Z$6:$Z$105, $X$6:$X$105=A' + r + ', $Y$6:$Y$105="Special Ability")), ""))'
    );
    sheet.getRange(r, 19).setFormula(specMergeFormula);
  }

  // Number formats
  sheet.getRange("I6:I35").setNumberFormat("0.00");
  sheet.getRange("K6:K35").setNumberFormat("0.00");
  sheet.getRange("M6:M35").setNumberFormat("0.00");
  sheet.getRange("O6:O35").setNumberFormat("0.00");

  // Re-apply Conditional Formatting (Active Row Highlight)
  sheet.clearConditionalFormatRules();
  var grayRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$B6=TRUE')
    .setBackground("#e2e8f0")
    .setRanges([sheet.getRange("A6:U35")])
    .build();
  sheet.setConditionalFormatRules([grayRule]);

  // Re-apply Master_DB Validation & Col AA VLOOKUP
  var dbSheet = ss.getSheetByName("Master_DB");
  if (dbSheet) {
    var masterDbFeatRule = SpreadsheetApp.newDataValidation().requireValueInRange(dbSheet.getRange("A5:A300"), true).build();
    sheet.getRange("Z6:Z105").setDataValidation(masterDbFeatRule);
  }
  for (var rIndex = 6; rIndex <= 105; rIndex++) {
    sheet.getRange(rIndex, 27).setFormula(f('=IF(ISBLANK(Z' + rIndex + '), "", IFERROR(VLOOKUP(Z' + rIndex + ', Master_DB!$A$5:$F, 6, FALSE), ""))'));
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("lvl_up formulas and columns successfully repaired & aligned!", "✅ Repaired", 6);
}

// ----------------------------------------------------
// 3. LINK LVL_UP TO MAIN SHEET
// ----------------------------------------------------
function linkLvlUpToMain() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mainSheet = ss.getSheetByName("Main");
  var lvlSheet = ss.getSheetByName("lvl_up");
  if (!mainSheet || !lvlSheet) {
    SpreadsheetApp.getUi().alert("Error: 'Main' or 'lvl_up' sheet not found.");
    return;
  }

  var sep = getFormulaSeparator(mainSheet);
  function f(str) {
    return str.replace(/,/g, sep);
  }

  // 1. Clean & Fix background to the right of JI2:KR5 (Past column KR / col 304)
  cleanRightOfFeatsSheet(mainSheet);

  // 2. Total HP (BN35): Base HP (lvl_up!F4) + Con Mod (Main!Z54) * Active Level (lvl_up!B4)
  mainSheet.getRange("BN35").setFormula("=lvl_up!F4 + (Z54 * lvl_up!B4)");

  // 3. Base Attack Bonus (BW56)
  mainSheet.getRange("BW56").setFormula("=lvl_up!I4");

  // 4. Saving Throws (Base Saves: AG86, AG91, AG96)
  mainSheet.getRange("AG86").setFormula("=lvl_up!K4");
  mainSheet.getRange("AG91").setFormula("=lvl_up!M4");
  mainSheet.getRange("AG96").setFormula("=lvl_up!O4");

  // 5. Total Skill Points (EJ203)
  mainSheet.getRange("EJ203").setFormula("=lvl_up!Q4");

  // 6. Read Feats & Abilities Roster from lvl_up to attach Notes to Main cells
  var rosterData = lvlSheet.getRange("X6:AA105").getValues();
  var activeLvl = lvlSheet.getRange("B4").getValue();
  if (typeof activeLvl !== "number" || activeLvl <= 0) activeLvl = 30;

  var dmEntries = [];
  var otherEntries = [];

  for (var idx = 0; idx < rosterData.length; idx++) {
    var itemLvl = rosterData[idx][0];
    var itemCat = String(rosterData[idx][1] || "").trim();
    var itemName = String(rosterData[idx][2] || "").trim();
    var itemNotes = String(rosterData[idx][3] || "").trim();

    if (!itemName) continue;

    // Skip future planning levels if level is higher than active checked level
    if (typeof itemLvl === "number" && itemLvl > activeLvl) continue;

    var noteText = "";
    if (itemCat && itemCat !== "Regular Feat") {
      noteText = "[" + itemCat + (itemLvl ? " - Lvl " + itemLvl : "") + "]\n";
    } else if (itemLvl) {
      noteText = "[Lvl " + itemLvl + "]\n";
    }
    if (itemNotes) {
      noteText += itemNotes;
    }
    noteText = noteText.trim();

    if (itemCat.toUpperCase().indexOf("DM") !== -1) {
      dmEntries.push({ name: itemName, note: noteText });
    } else {
      otherEntries.push({ name: itemName, note: noteText });
    }
  }

  // 7. DM Grants (HX6:JG98) - 31 Slots (every 3 rows: 6, 9, 12, ... 96)
  for (var i = 0; i < 31; i++) {
    var r = 6 + (i * 3);
    var k = i + 1;
    var dmFormula = f(
      '=IFERROR(INDEX(FILTER(lvl_up!$Z$6:$Z$105, lvl_up!$Z$6:$Z$105<>"", ISNUMBER(SEARCH("DM", lvl_up!$Y$6:$Y$105)), (lvl_up!$X$6:$X$105 <= IF(lvl_up!$B$4>0, lvl_up!$B$4, 30)) + (lvl_up!$X$6:$X$105 = "")), ' + k + '), "")'
    );
    var cell = mainSheet.getRange("HX" + r);
    cell.setFormula(dmFormula);
    if (i < dmEntries.length && dmEntries[i].note) {
      cell.setNote(dmEntries[i].note);
    } else {
      cell.clearNote();
    }
  }

  // 8. Other Feats & Special Abilities (JI6:KR173) - 56 Slots (every 3 rows: 6, 9, 12, ... 171)
  for (var j = 0; j < 56; j++) {
    var r = 6 + (j * 3);
    var k = j + 1;
    var featFormula = f(
      '=IFERROR(INDEX(FILTER(lvl_up!$Z$6:$Z$105, lvl_up!$Z$6:$Z$105<>"", NOT(ISNUMBER(SEARCH("DM", lvl_up!$Y$6:$Y$105))), (lvl_up!$X$6:$X$105 <= IF(lvl_up!$B$4>0, lvl_up!$B$4, 30)) + (lvl_up!$X$6:$X$105 = "")), ' + k + '), "")'
    );
    var cell = mainSheet.getRange("JI" + r);
    cell.setFormula(featFormula);
    if (j < otherEntries.length && otherEntries[j].note) {
      cell.setNote(otherEntries[j].note);
    } else {
      cell.clearNote();
    }
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("HP, BAB, Saves, Skill Points, and Feats & Notes linked to Main!", "✅ Linked", 6);
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

function limitLvlUpColumns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("lvl_up");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: 'lvl_up' sheet not found.");
    return;
  }
  limitLvlUpColumnsSheet(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast("lvl_up scrolling locked at column AB (col 28)!", "🔒 Locked", 5);
}

function limitLvlUpColumnsSheet(sheet) {
  var curCols = sheet.getMaxColumns();
  // Lock at exactly 28 columns (A through AB)
  if (curCols < 28) {
    sheet.insertColumnsAfter(curCols, 28 - curCols);
  } else if (curCols > 28) {
    sheet.deleteColumns(29, curCols - 28);
  }
  sheet.setColumnWidth(28, 40); // Buffer column AB
}

function getFormulaSeparator(sheet) {
  var testCol = sheet.getMaxColumns();
  var testCell = sheet.getRange(1, testCol);
  var origVal = testCell.getValue();
  var origFormula = testCell.getFormula();
  try {
    testCell.setFormula("=IF(1=1, 10, 20)");
    SpreadsheetApp.flush();
    if (testCell.getValue() === 10) {
      if (origFormula) testCell.setFormula(origFormula);
      else if (origVal !== "") testCell.setValue(origVal);
      else testCell.clearContent();
      return ",";
    }
  } catch (e) {}

  try {
    testCell.setFormula("=IF(1=1; 10; 20)");
    SpreadsheetApp.flush();
    if (testCell.getValue() === 10) {
      if (origFormula) testCell.setFormula(origFormula);
      else if (origVal !== "") testCell.setValue(origVal);
      else testCell.clearContent();
      return ";";
    }
  } catch (e) {}

  if (origFormula) testCell.setFormula(origFormula);
  else if (origVal !== "") testCell.setValue(origVal);
  else testCell.clearContent();
  return ",";
}
