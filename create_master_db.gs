/**
 * D&D 3.5e Google Sheets - Master Database & Interactive Guide Engine
 * 1. Master_DB: Unified 29-Column Database (Feats, Weapons, Armors, Rings, Wondrous, Slotless, Spells)
 * 2. Master_DB_Guide: Comprehensive User Manual with Step-by-Step Case Studies & Stacking Rules
 */

// ----------------------------------------------------
// 1. MASTER BUILDER - BUILDS BOTH DB & GUIDE
// ----------------------------------------------------
function buildAllMasterDb() {
  createMasterDbSheet();
  createMasterDbGuideSheet();
  SpreadsheetApp.getActiveSpreadsheet().toast("Master_DB and Master_DB_Guide built successfully!", "✅ Complete", 6);
}

// ----------------------------------------------------
// 2. MASTER_DB BUILDER (29-Column Universal Architecture)
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

  // Ensure exact 29 columns (A through AC)
  var curCols = sheet.getMaxColumns();
  if (curCols < 29) {
    sheet.insertColumnsAfter(curCols, 29 - curCols);
  } else if (curCols > 29) {
    sheet.deleteColumns(30, curCols - 29);
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
  sheet.getRange("A1:AC4").setBackground("#0f172a");

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
    .setFormula(f('=COUNTIF(B6:B, "Feat") + COUNTIF(B6:B, "Special Ability") + COUNTIF(B6:B, "DM Grant")'));
  sheet.getRange("I3:J4").merge().setBackground("#1e293b").setFontColor("#94a3b8")
    .setFontSize(7).setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("FEATS / ABIL");

  // K1:L4 -> EQUIPMENT & ITEMS COUNT
  sheet.getRange("K1:L2").merge().setBackground("#1e293b").setFontColor("#facc15")
    .setFontSize(15).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setFormula(f('=COUNTIF(B6:B, "Weapon") + COUNTIF(B6:B, "Armor / Shield") + COUNTIF(B6:B, "Ring") + COUNTIF(B6:B, "Wondrous Item") + COUNTIF(B6:B, "Slotless Item")'));
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

  // O1:AC4 -> Info & Reset Guide
  sheet.getRange("O1:AC4").merge().setBackground("#1e293b").setFontColor("#f1f5f9")
    .setFontSize(8).setVerticalAlignment("middle").setHorizontalAlignment("center")
    .setValue("🎯 CANLI FİLTRELEME & ARAMA:\n• E1:E4 kutularını işaretleyerek kategorileri filtreleyin (ALL, Feats, Gear, Spells).\n• C2 arama kutusuna isim yazıp Enter'a basarak Entry Name'e göre anında süzün.\n• Menüden '🔄 Reset Filter' seçerek tüm filtreleri tek tıkla temizleyebilirsiniz.");

  // ----------------------------------------------------
  // Row 5: Column Headers (29 Columns)
  // ----------------------------------------------------
  var headers = [
    "Entry Name",               // A (1)
    "Type / Category",          // B (2)
    "Slot / Location",          // C (3)
    "Parent Entry",             // D (4)
    "Prereq / Source",          // E (5)
    "Benefit / Description",     // F (6)
    "Bonus Type",               // G (7)
    "Combat Scope",             // H (8)
    "Str", "Dex", "Con", "Int", "Wis", "Cha",  // I - N (9-14)
    "AC", "HP", "Att", "Dmg",                  // O - R (15-18)
    "Fort", "Ref", "Will",                     // S - U (19-21)
    "Skill", "Initiative", "Speed",            // V - X (22-24)
    "On-Hit / Extra Dmg",       // Y (25)
    "Active Power / Action",    // Z (26)
    "Duration / Uses",          // AA (27)
    "Weight (lbs)",             // AB (28)
    "Cost (gp)"                 // AC (29)
  ];

  sheet.getRange(5, 1, 1, headers.length).setValues([headers]);
  sheet.getRange("A5:AC5")
    .setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  
  // Highlight Parent Entry header (Col D) in distinct indigo / purple
  sheet.getRange("D5").setBackground("#4f46e5").setFontColor("#ffffff");

  // Highlight Combat Scope header in distinct blue-slate
  sheet.getRange("H5").setBackground("#0369a1").setFontColor("#e0f2fe");

  // Highlight Buff Columns header (Cols I to X) in distinct dark emerald
  sheet.getRange("I5:X5").setBackground("#134e4a").setFontColor("#5eead4");

  // ----------------------------------------------------
  // Dropdown Validations
  // ----------------------------------------------------
  var typeRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Feat", "Weapon", "Armor / Shield", "Ring", "Wondrous Item", "Slotless Item",
    "Spell", "Special Ability", "DM Grant", "Active Power", "Flaw", "Racial Trait"
  ], true).build();
  sheet.getRange("B6:B300").setDataValidation(typeRule);

  var slotRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Armor", "Shield", "Head", "Eyes", "Neck", "Shoulders", "Torso", "Body",
    "Waist", "Arms", "Hands", "Ring", "Feet", "Main Hand", "Off Hand",
    "Slotless", "None"
  ], true).build();
  sheet.getRange("C6:C300").setDataValidation(slotRule);

  var bonusTypeRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "Untyped", "Enhancement", "Resistance", "Deflection", "Natural Armor",
    "Armor", "Shield", "Morale", "Luck", "Insight", "Dodge", "Circumstance",
    "Sacred", "Profane", "Alchemical", "Competence", "Size", "Inherent",
    "Spell-Like", "Racial"
  ], true).build();
  sheet.getRange("G6:G300").setDataValidation(bonusTypeRule);

  var combatScopeRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "All Attacks", "Melee Only", "Ranged Only", "Thrown Only", "Unarmed",
    "Specific Weapon", "Slashing", "Piercing", "Bludgeoning", "Spells", "None / General"
  ], true).build();
  sheet.getRange("H6:H300").setDataValidation(combatScopeRule);

  // ----------------------------------------------------
  // Seed Baseline Library Data (Magnus + D&D 3.5e Essentials)
  // Each row has exactly 29 elements
  // ----------------------------------------------------
  var seedRows = [
    // --- 1. CORE FEATS ---
    ["Power Attack", "Feat", "None", "-", "Str 13", "Trade base attack bonus for extra melee damage (up to BAB, x2 with 2H weapon)", "Untyped", "Melee Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Combat Expertise", "Feat", "None", "-", "Int 13", "Trade base attack bonus for dodge bonus to AC (up to -5 / +5)", "Dodge", "Melee Only", "", "", "", "", "", "", 0, "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Improved Bull Rush", "Feat", "None", "-", "Power Attack, Str 13", "+4 bonus on bull rush attempts; does not provoke attacks of opportunity", "Untyped", "Melee Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Improved Sunder", "Feat", "None", "-", "Power Attack, Str 13", "+4 bonus on sunder attempts; does not provoke attacks of opportunity", "Untyped", "Melee Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Combat Brute", "Feat", "None", "-", "Imp Bull Rush, BAB +6", "Tactical feat: Advancing Blow, Sundering Cleave, Momentum Swing (+3x Power Attack)", "Untyped", "Melee Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Combat Reflexes", "Feat", "None", "-", "-", "Make additional attacks of opportunity per round equal to Dex modifier", "Untyped", "Melee Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Mage Slayer", "Feat", "None", "-", "Spellcraft 2, BAB +3", "Spellcasters you threaten cannot cast defensively; -4 penalty to caster level", "Untyped", "Melee Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Endurance", "Feat", "None", "-", "-", "+4 on checks against exhaustion, forced march, starvation; sleep in light/medium armor", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Steadfast Determination", "Feat", "None", "-", "Endurance", "Use Con modifier instead of Wis for Will saves; nat 1 on Fort save is not auto-fail", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Point Blank Shot", "Feat", "None", "-", "-", "+1 bonus on attack and damage rolls with ranged weapons at ranges up to 30 ft", "Untyped", "Ranged Only", "", "", "", "", "", "", "", "", 1, 1, "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Knockdown", "Feat", "None", "-", "Combat Reflexes, BAB +2", "Deal 10+ damage in melee for free immediate trip attempt", "Untyped", "Melee Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Weapon Focus (Longsword)", "Feat", "None", "-", "Proficiency, BAB +1", "+1 bonus on attack rolls with Longsword", "Untyped", "Specific Weapon", "", "", "", "", "", "", "", "", 1, "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Improved Initiative", "Feat", "None", "-", "-", "+4 bonus on initiative checks", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", 4, "", "-", "-", "Passive", "", ""],
    ["Iron Will", "Feat", "None", "-", "-", "+2 bonus on Will saving throws", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", 2, "", "", "", "-", "-", "Passive", "", ""],
    ["Great Fortitude", "Feat", "None", "-", "-", "+2 bonus on Fortitude saving throws", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", 2, "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Lightning Reflexes", "Feat", "None", "-", "-", "+2 bonus on Reflex saving throws", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", 2, "", "", "", "", "-", "-", "Passive", "", ""],

    // --- 2. FLAWS ---
    ["Flaw: Shaky", "Flaw", "None", "-", "-", "-2 penalty on all ranged attack rolls", "Untyped", "Ranged Only", "", "", "", "", "", "", "", "", -2, "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Flaw: Frail", "Flaw", "None", "-", "-", "-1 hit point per hit die / character level", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],

    // --- 3. CLASS & SPECIAL ABILITIES ---
    ["Battle Clarity (Ex)", "Special Ability", "None", "-", "Warblade 1", "Add Int modifier (up to Warblade level) as insight bonus to Reflex saving throws", "Insight", "None / General", "", "", "", "", "", "", "", "", "", "", "", 0, "", "", "", "", "-", "-", "Passive", "", ""],
    ["Weapon Aptitude (Ex)", "Special Ability", "None", "-", "Warblade 1", "Can change weapon-specific feats with 1 hour of morning practice", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Uncanny Dodge (Ex)", "Special Ability", "None", "-", "Warblade 2", "Retain Dex bonus to AC even if caught flat-footed or struck by an invisible attacker", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Trapfinding (Ex)", "Special Ability", "None", "-", "Rogue 1", "Can find traps with Search DC > 20 and disarm magic traps with Disable Device", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Evasion (Ex)", "Special Ability", "None", "-", "Class", "Take no damage on successful Reflex saving throw against half-damage effects", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Returning Attacks (Ex)", "Special Ability", "None", "-", "Bloodstorm Blade", "Thrown weapons return to hand immediately after attack resolved", "Untyped", "Thrown Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Throw Anything (Ex)", "Special Ability", "None", "-", "Bloodstorm Blade", "Throw any melee weapon as a ranged thrown weapon with 10 ft range increment", "Untyped", "Thrown Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Martial Throw (Ex)", "Special Ability", "None", "-", "Bloodstorm Blade", "Can initiate martial strike maneuvers with ranged thrown attacks", "Untyped", "Thrown Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Thunderous Throw (Ex)", "Special Ability", "None", "-", "Bloodstorm Blade", "Swift action: Treat all thrown attacks this turn as melee attacks for modifiers", "Untyped", "Thrown Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Swift Action", "At Will", "", ""],
    ["Lightning Ricochet (Ex)", "Special Ability", "None", "-", "Bloodstorm Blade", "Thrown weapon returns instantaneously before your next attack in full routine", "Untyped", "Thrown Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],

    // --- 4. DM GRANTS ---
    ["Nat AC 2+1/4lvl", "DM Grant", "None", "-", "Campaign Award", "Innate natural armor bonus equal to 2 + 1/4 character level", "Natural Armor", "None / General", "", "", "", "", "", "", 2, "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Darkness (lvl3) 1/day", "DM Grant", "None", "-", "Campaign Award", "Cast Darkness spell-like ability at 3rd level once per day", "Spell-Like", "Spells", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Standard Action", "1/day", "", ""],
    ["Breath Weapon 3d8 Acid", "DM Grant", "None", "-", "Campaign Award", "60ft line/cone of acid dealing 3d8 damage; Reflex DC 10+lvl+Con half. Recharge 1d4+1", "Spell-Like", "Spells", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "3d8 Acid", "Standard Action", "Recharge 1d4+1", "", ""],
    ["Ability Boost +1 Str, +1 Cha", "DM Grant", "None", "-", "Campaign Award", "Permanent +1 inherent bonus to Strength and Charisma", "Untyped", "None / General", 1, "", "", "", "", 1, "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Charm Reptiles", "DM Grant", "None", "-", "Campaign Award", "Charm reptilian creatures as Charm Monster spell; Will DC 14+Cha", "Spell-Like", "Spells", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Standard Action", "At Will", "", ""],
    ["Ability Boost +1 Dex, +1 Cha", "DM Grant", "None", "-", "Campaign Award", "Permanent +1 inherent bonus to Dexterity and Charisma", "Untyped", "None / General", "", 1, "", "", "", 1, "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Acid Resist lvl*2", "DM Grant", "None", "-", "Campaign Award", "Permanent energy resistance to acid equal to level * 2", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Blindsense 30ft", "DM Grant", "None", "-", "Campaign Award", "Pinpoint the location of all creatures within 30 ft regardless of visual concealment", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Save Magic +4 insight", "DM Grant", "None", "-", "Campaign Award", "+4 insight bonus on saving throws against magic spells and effects", "Insight", "None / General", "", "", "", "", "", "", "", "", "", "", 4, 4, 4, "", "", "", "-", "-", "Passive", "", ""],
    ["Draconic Core 1h/day", "DM Grant", "None", "-", "Campaign Award", "Activate for 1 hour/day: Total immunity to acid, breath weapon deals x2 damage", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Swift Action", "1 hour/day", "", ""],
    ["Cha mod to magic saves 1/d", "DM Grant", "None", "-", "Campaign Award", "Add Charisma modifier as an immediate bonus to any save vs magic 1/day", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Immediate Action", "1/day", "", ""],
    ["Draconic Shield 1/d", "DM Grant", "None", "-", "Campaign Award", "Negate and ignore all critical hit damage from one attack 1/day", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Immediate Action", "1/day", "", ""],
    ["Ability Boost +2 Dex", "DM Grant", "None", "-", "Campaign Award", "Permanent +2 inherent bonus to Dexterity", "Untyped", "None / General", "", 2, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Save Magic +1 Draconic", "DM Grant", "None", "-", "Campaign Award", "+1 draconic bonus on all saves against spells and spell-like abilities", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", 1, 1, 1, "", "", "", "-", "-", "Passive", "", ""],
    ["Draconic Toughness", "DM Grant", "None", "-", "Campaign Award", "Gain extra maximum hit points equal to character level", "Untyped", "None / General", "", "", "", "", "", "", "", 16, "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Draconic Shield (DR/- 1min)", "DM Grant", "None", "-", "Campaign Award", "Gain Damage Reduction (DR Cha mod/-) for 1 minute per day", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Swift Action", "1 min/day", "", ""],
    ["Ability Boost +2 Con", "DM Grant", "None", "-", "Campaign Award", "Permanent +2 inherent bonus to Constitution", "Untyped", "None / General", "", "", 2, "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", "", ""],
    ["Absorb Magic", "DM Grant", "None", "-", "Campaign Award", "Absorb single target magical spell targeted at you and convert into temporary HP", "Untyped", "Spells", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Immediate Action", "1/day", "", ""],

    // --- 5. MAGIC ITEMS, RINGS & WONDROUS GEAR ---
    ["Vest of Resistance +5", "Wondrous Item", "Torso", "-", "DMG p.268", "+5 resistance bonus to Fortitude, Reflex, and Will saving throws", "Resistance", "None / General", "", "", "", "", "", "", "", "", "", "", 5, 5, 5, "", "", "", "-", "-", "Passive", 1, 25000],
    ["Ring of Protection +5", "Ring", "Ring", "-", "DMG p.232", "+5 deflection bonus to Armor Class", "Deflection", "None / General", "", "", "", "", "", "", 5, "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 0, 50000],
    ["Ring of Health Greater", "Ring", "Ring", "-", "MIC p.128", "+4 enhancement bonus to Constitution and immunity to non-magical disease", "Enhancement", "None / General", "", "", 4, "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 0, 32000],
    ["Ring of Dark Vision", "Ring", "Ring", "-", "DMG p.230", "Continuously grants Darkvision 60 ft", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 0, 12000],
    ["Ring of Touch", "Ring", "Ring", "-", "Custom", "Specialized defensive ring enhancing touch AC protection", "Deflection", "None / General", "", "", "", "", "", "", 2, "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 0, 8000],
    ["Belt of Guardian", "Wondrous Item", "Waist", "-", "MIC p.73", "+2 enhancement bonus to Con and emergency defensive ward", "Enhancement", "None / General", "", "", 2, "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Swift Action", "Passive", 1, 12000],
    ["Circlet of Rapid Casting", "Wondrous Item", "Head", "-", "MIC p.86", "Cast a spell up to 2nd lvl as a swift action (uses 1-3 charges/day based on spell lvl)", "Untyped", "Spells", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Swift Action", "3 charges/day", 1, 15000],
    ["Collar of Pain", "Wondrous Item", "Neck", "-", "Custom", "Whenever you take melee damage, attacker takes retaliatory force damage", "Untyped", "Melee Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Triggered", "Passive", 1, 9000],
    ["War Wizard Cloak", "Wondrous Item", "Shoulders", "-", "MIC p.147", "Feather fall (continuous), Mage Armor (1/day), Protection from Arrows (1/day)", "Resistance", "None / General", "", "", "", "", "", "", "", "", "", "", 1, 1, 1, "", "", "", "-", "Standard Action", "1/day", 1, 16000],
    ["Armbands of Might", "Wondrous Item", "Arms", "-", "MIC p.72", "+2 bonus on damage when Power Attack is used at -2 penalty or more; +2 to Str checks", "Untyped", "Melee Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 1, 4100],
    ["Gauntlets of Extended Range", "Wondrous Item", "Hands", "-", "MIC p.103", "Doubles range increment for all thrown weapons", "Untyped", "Thrown Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 1, 2000],
    ["Duelist Boots", "Wondrous Item", "Feet", "-", "MIC p.95", "+10 ft enhancement bonus to base land speed and +2 competence on Acrobatics", "Enhancement", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", 2, "", 10, "-", "-", "Passive", 1, 6000],
    ["Third Eye Aware", "Wondrous Item", "Eyes", "-", "MIC p.141", "+10 competence bonus on Spot and Listen skill checks", "Competence", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", 10, "", "", "-", "-", "Passive", 0, 10000],
    ["Deathward Brooch", "Wondrous Item", "Neck", "-", "MIC p.93", "Immunity to death effects, energy drain, and negative energy effects", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 0, 15000],
    ["Elemental Ward", "Wondrous Item", "Torso", "-", "MIC p.97", "Continuous energy resistance 10 against acid, cold, fire, or electricity", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 1, 12000],
    ["Potion of Healing", "Slotless Item", "Slotless", "-", "DMG p.229", "Consumable: Cures 1d8+1 hit points upon drinking", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Standard Action", "1 use", 0.5, 50],
    ["Potion of Antidote", "Slotless Item", "Slotless", "-", "Custom", "Neutralizes poison and grants +4 on Fortitude saves vs poison for 1 hour", "Alchemical", "None / General", "", "", "", "", "", "", "", "", "", "", 4, "", "", "", "", "", "-", "Standard Action", "1 use", 0.5, 100],
    ["Cure P&D", "Slotless Item", "Slotless", "-", "Custom", "Elixir curing Paralysis & Disease completely upon consumption", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Standard Action", "1 use", 1, 300],
    ["Greater Restoration", "Slotless Item", "Slotless", "-", "DMG p.230", "Potion/Scroll: Restores all drained ability levels and dispels negative effects", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Standard Action", "1 use", 1, 1000],

    // --- 6. SLOTLESS ITEMS (NO BODY SLOT OCCUPIED) ---
    ["Bag of Holding", "Slotless Item", "Slotless", "-", "DMG p.248", "Extradimensional storage bag; holds up to 500 lbs / 70 cu. ft. Weight is fixed at 15 lbs", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 15, 2500],
    ["Stone of Good Luck (Luckstone)", "Slotless Item", "Slotless", "-", "DMG p.267", "+1 luck bonus on all saving throws, ability checks, and skill checks", "Luck", "None / General", "", "", "", "", "", "", "", "", "", "", 1, 1, 1, 1, "", "", "-", "-", "Passive", 0, 20000],
    ["Hourglass", "Slotless Item", "Slotless", "-", "PHB p.128", "Accurate brass hourglass used for measuring round/minute tactical spell durations", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 1, 25],
    ["Witchlight Reservoir", "Slotless Item", "Slotless", "-", "MIC p.148", "Stores up to 5 charges of light energy for emergency dark vision and weapon radiant boost", "Untyped", "None / General", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "Swift Action", "5 charges/day", 0.5, 2000],

    // --- 7. WEAPONS (COMPOSITE WITH ON-HIT & ACTIVE POWERS) ---
    ["Longsword", "Weapon", "Main Hand", "-", "PHB p.116", "Standard martial one-handed slashing weapon (1d8, 19-20/x2)", "Untyped", "Melee Only", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "1d8 (19-20/x2)", "-", "Passive", 4, 15],
    ["Venomfang (+5 Acidic)", "Weapon", "Main Hand", "-", "Custom", "+5 Longsword dealing an extra +1d12 acid damage on every hit. Grants Acid Breath 1/day", "Enhancement", "Melee Only", "", "", "", "", "", "", "", "", 5, 5, "", "", "", "", "", "", "+1d12 Acid", "-", "Passive", 4, 72015],
    ["Venomfang: Breath", "Active Power", "Main Hand", "Venomfang (+5 Acidic)", "-", "60ft cone of acid dealing 3d8 acid damage; Reflex DC 18 half. Linked to Venomfang", "Spell-Like", "Spells", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "3d8 Acid", "Standard Action", "1/day", 0, 0],
    ["Ring of the Nine Hells", "Ring", "Ring", "-", "Custom", "+3 deflection bonus to AC. Grants Fireball spell-like ability once per day", "Deflection", "None / General", "", "", "", "", "", "", 3, "", "", "", "", "", "", "", "", "", "-", "-", "Passive", 0, 36000],
    ["Nine Hells: Fireball", "Active Power", "Ring", "Ring of the Nine Hells", "-", "8d6 Fire damage in 20ft radius spread; Reflex DC 16 half. Linked to Ring of Nine Hells", "Spell-Like", "Spells", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "8d6 Fire", "Standard Action", "1/day", 0, 0],

    // --- 8. SPELLS & BUFFS ---
    ["Bull's Strength", "Spell", "None", "-", "Sor/Wiz 2, Clr 2", "+4 enhancement bonus to Strength for 1 min/level", "Enhancement", "None / General", 4, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "1 min/lvl", 0, 0],
    ["Cat's Grace", "Spell", "None", "-", "Sor/Wiz 2, Clr 2", "+4 enhancement bonus to Dexterity for 1 min/level", "Enhancement", "None / General", "", 4, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "1 min/lvl", 0, 0],
    ["Bear's Endurance", "Spell", "None", "-", "Sor/Wiz 2, Clr 2", "+4 enhancement bonus to Constitution for 1 min/level", "Enhancement", "None / General", "", "", 4, "", "", "", "", "", "", "", "", "", "", "", "", "", "-", "-", "1 min/lvl", 0, 0],
    ["Haste", "Spell", "None", "-", "Sor/Wiz 3", "+1 attack, +1 dodge AC, +1 Reflex save, +30ft speed, and 1 extra attack on full attack routine", "Dodge", "All Attacks", "", "", "", "", "", "", 1, "", 1, "", "", 1, "", "", "", 30, "-", "-", "1 round/lvl", 0, 0],
    ["Heroism", "Spell", "None", "-", "Sor/Wiz 3, Brd 2", "+2 morale bonus on attack rolls, saves, and skill checks for 10 min/level", "Morale", "All Attacks", "", "", "", "", "", "", "", "", 2, "", 2, 2, 2, 2, "", "", "-", "-", "10 min/lvl", 0, 0],
    ["Prayer", "Spell", "None", "-", "Clr 3", "+1 luck bonus on attacks, damage, saves, and skill checks (allies); enemies take -1", "Luck", "All Attacks", "", "", "", "", "", "", "", "", 1, 1, 1, 1, 1, 1, "", "", "-", "-", "1 round/lvl", 0, 0],
    ["Mage Armor", "Spell", "None", "-", "Sor/Wiz 1", "+4 armor bonus to AC for 1 hour/level", "Armor", "None / General", "", "", "", "", "", "", 4, "", "", "", "", "", "", "", "", "", "-", "-", "1 hour/lvl", 0, 0],
    ["Shield", "Spell", "None", "-", "Sor/Wiz 1", "+4 shield bonus to AC; completely blocks Magic Missile attacks", "Shield", "None / General", "", "", "", "", "", "", 4, "", "", "", "", "", "", "", "", "", "-", "-", "1 min/lvl", 0, 0]
  ];

  // Defensive check: ensure every row has exactly 29 elements
  for (var i = 0; i < seedRows.length; i++) {
    while (seedRows[i].length < 29) {
      seedRows[i].push("");
    }
    if (seedRows[i].length > 29) {
      seedRows[i] = seedRows[i].slice(0, 29);
    }
  }

  sheet.getRange(6, 1, seedRows.length, 29).setValues(seedRows);

  // ----------------------------------------------------
  // Column Formatting & Alignments
  // ----------------------------------------------------
  sheet.setColumnWidth(1, 220);  // A: Entry Name
  sheet.setColumnWidth(2, 130);  // B: Type / Category
  sheet.setColumnWidth(3, 110);  // C: Slot / Location
  sheet.setColumnWidth(4, 180);  // D: Parent Entry (Widened for tag pill & clear readability)
  sheet.setColumnWidth(5, 140);  // E: Prereq / Source
  sheet.setColumnWidth(6, 280);  // F: Benefit / Description
  sheet.setColumnWidth(7, 120);  // G: Bonus Type
  sheet.setColumnWidth(8, 120);  // H: Combat Scope

  // 16 Buff Columns (Cols I to X: Cols 9 to 24)
  for (var c = 9; c <= 24; c++) {
    sheet.setColumnWidth(c, 48);
    sheet.getRange(6, c, seedRows.length, 1).setHorizontalAlignment("center");
  }

  sheet.setColumnWidth(25, 130); // Y: On-Hit / Extra Dmg
  sheet.setColumnWidth(26, 140); // Z: Active Power / Action
  sheet.setColumnWidth(27, 120); // AA: Duration / Uses
  sheet.setColumnWidth(28, 85);  // AB: Weight (lbs)
  sheet.setColumnWidth(29, 95);  // AC: Cost (gp)

  // Alignments for text columns
  sheet.getRange("B6:D" + (seedRows.length + 5)).setHorizontalAlignment("center");
  sheet.getRange("G6:H" + (seedRows.length + 5)).setHorizontalAlignment("center");
  sheet.getRange("Y6:AA" + (seedRows.length + 5)).setHorizontalAlignment("center");
  sheet.getRange("AB6:AC" + (seedRows.length + 5)).setHorizontalAlignment("right");

  // Grid Borders
  var fullDataRange = sheet.getRange(5, 1, seedRows.length + 1, 29);
  fullDataRange.setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // Text wrap for Description
  sheet.getRange("F6:F" + (seedRows.length + 5)).setWrap(true);

  // Soft zebra striping for rows
  for (var r = 6; r <= seedRows.length + 5; r++) {
    if (r % 2 === 0) {
      sheet.getRange(r, 1, 1, 29).setBackground("#f8fafc");
    }
  }

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
    .setRanges([sheet.getRange("A6:AC" + maxRow)])
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
    .setRanges([sheet.getRange("A6:AC" + maxRow)])
    .build();

  sheet.setConditionalFormatRules([childColDRule, childColARule, parentColARule, childRowRule, parentRowRule]);

  SpreadsheetApp.getActiveSpreadsheet().toast("Master_DB (29 Cols with Interactive Search & Category Filter) built successfully!", "✅ Master_DB Ready", 6);
}

// ----------------------------------------------------
// DYNAMIC FILTER & LIVE SEARCH ENGINE FOR MASTER_DB
// ----------------------------------------------------
function applyMasterDbFilter(sheet) {
  if (!sheet) {
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
    "weapon": true, "armor / shield": true, "ring": true, "wondrous item": true, "slotless item": true
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
    [false, "1. Ağ / AI İzni (OAuth)", "🎲 D&D System ➔ 🌐 Authorize AI Network Access", "Dış dünya bağlantı iznini Google ana penceresinde bir kez onaylayın.", "UrlFetchApp (script.external_request)", "Tek Seferlik"],
    [false, "2. Gemini API Anahtarı", "🎲 D&D System ➔ 🔑 Set My Gemini API Key", "Google AI Studio'dan aldığınız ücretsiz API anahtarınızı girin.", "UserProperties & Session Cache", "Kişiye Özel"],
    [false, "3. AI Model Tanısı & Güncelleme", "🎲 D&D System ➔ 🩺 Diagnose Gemini API & Models", "Aktif modelleri test edin ve kütüphane açılır menüsünü otomatik güncelleyin.", "AI Modeli Doğrulandı & C3 Güncellendi", "Otomatik / Hızlı"],
    [false, "4. Kural Kütüphanesi", "🎲 D&D System ➔ 📜 Build / Open \"Rule_Library\"", "Kademeli arama linklerini ve kitap kataloğunu oluşturan sayfayı kurun.", "Rule_Library Sekmesi", "Otomatik"],
    [false, "5. Master_DB Veritabanı", "🎲 D&D System ➔ ⚡ Build Both DB & Guide (1-Click)", "29 sütunluk kütüphane altyapısını ve başlangıç tohumlarını kurun.", "Master_DB (En az 6 satır)", "Otomatik"],
    [false, "6. AI Rule Importer Testi", "🎲 D&D System ➔ 🤖 Open AI Rule Importer", "Yan paneli açıp örnek bir kural aratın (Örn: Greater Heroism) ve tabloya ekleyin.", "Gemini Flash-Lite Entegrasyonu", "Hazır!"]
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
    .setValue("  💡 Sıfırlama: İzinleri ve API anahtarını silip tikleri kaldırmak için: '🎲 D&D System ➔ 🗑️ Clear / Reset My API Key & Permissions' seçeneğini kullanabilirsiniz.");

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
  addSection("2. 📌 MASTER_DB SÜTUNLARI VE ALDIĞI DEĞERLER (A - AC)", "#0f766e");
  addRow("A: Entry Name", "Metin", "Tüm Sayfalar", "Eşyanın, feat'in veya büyünün tam adı.", "Power Attack, Vest of Resistance +5, Luckstone", "Zorunlu Alan", false);
  addRow("B: Type / Category", "Açılır Liste", "Filtreleme & Sayfalar", "Feat, Weapon, Armor / Shield, Ring, Wondrous Item, Slotless Item, Spell, Special Ability, DM Grant, Active Power, Flaw", "Wondrous Item seçildiğinde Inventory'de ilgili sekmeye düşer.", "Doğru tipi seçin", true);
  addRow("C: Slot / Location", "Açılır Liste", "Inventory", "Armor, Shield, Head, Eyes, Neck, Shoulders, Torso, Body, Waist, Arms, Hands, Ring, Feet, Main Hand, Off Hand, Slotless, None", "Circlet için Head, Potion veya Luckstone için Slotless, Feat için None seçilir.", "Slotless vücutta yer kaplamaz!", false);
  addRow("D: Parent Entry", "Metin / Boş (-)", "Inventory & Spells", "Bağlı olduğu ana eşyanın adı. Eşya tek başına ise tire (-) konur. Bir isim yazıldığında satır otomatik MOR (Child ↳), ana eşya ise MAVİ (Parent) renge bürünür ve miras bağlantısı kurulur!", "Nine Hells: Fireball satırı için Parent: 'Ring of the Nine Hells'", "İsmi harfi harfine aynı yazın", true);
  addRow("E: Prereq / Source", "Metin", "Bilgi / Not", "Gereksinimler veya kaynak kitap adı.", "Str 13, BAB +6, DMG p.268, PHB p.98", "Opsiyonel", false);
  addRow("F: Benefit / Description", "Uzun Metin", "lvl_up & Main Tooltip", "Özelliğin detaylı kural açıklaması. lvl_up tablosuna ve Main sayfasındaki hücre notlarına (hover) otomatik gider!", "Trade BAB for extra melee damage (up to BAB, x2 with 2H weapon)", "Hücre notunda bu metin görünür", true);
  addRow("G: Bonus Type", "Açılır Liste", "Bufffs Motoru", "D&D 3.5e İstif Tipi: Enhancement, Resistance, Deflection, Natural Armor, Armor, Shield, Morale, Luck, Insight, Dodge, Circumstance, Sacred, Profane, Alchemical, Competence, Size, Inherent, Untyped", "Vest için Resistance, Kalkan için Shield, Zırh için Armor, Dua için Luck seçilir.", "İstif kurallarını belirler!", false);
  addRow("H: Combat Scope", "Açılır Liste", "Combat & Silah Filtresi", "Saldırı ve hasar bonusunun nereye uygulanacağı: All Attacks, Melee Only, Ranged Only, Thrown Only, Unarmed, Specific Weapon, Slashing, Piercing, Bludgeoning, Spells, None / General", "Point Blank Shot için Ranged Only; Power Attack için Melee Only; Haste için All Attacks seçilir.", "Silah filtreleri için kritik", true);
  addRow("I - X: 16 Buff Kolonu", "Sayısal (+ / -)", "Bufffs & Main", "Str, Dex, Con, Int, Wis, Cha, AC, HP, Att, Dmg, Fort, Ref, Will, Skill, Initiative, Speed sütunları.", "Kemer için Str kolonuna 6; Vest için Fort, Ref, Will kolonlarına 5 yazılır.", "Pasif statlar buraya girilir", false);
  addRow("Y: On-Hit / Extra Dmg", "Zar Metni", "Combat (Hasar)", "Vuruş başı ek hasar zarları (örn: asit, ateş, kutsal hasarlar).", "1d12 Acid, 2d6 Holy, 1d6 Fire", "Zar atıcı hasar tiplerini ayrıştırır!", true);
  addRow("Z: Active Power / Action", "Aksiyon Tipi", "Combat & Spells", "Aktif yeteneğin gerektirdiği aksiyon (Swift, Standard, Immediate, Move).", "Swift Action, Standard Action (Reflex DC 18)", "Nasıl tetiklendiğini belirtir", false);
  addRow("AA: Duration / Uses", "Kullanım / Süre", "Spells & Günlük Takip", "Günde kaç kez veya ne kadar süre çalıştığı.", "Passive, 1/day, 3 charges/day, 1 round/lvl, 10 min/lvl", "Checkbox takibini belirler", true);
  addRow("AB - AC: Weight & Cost", "Sayı", "Inventory & Taşıma", "Ağırlık (lbs) ve Değer (gp). Taşıma kapasitesi (Encumbrance) için kullanılır.", "Ağırlık: 4 lbs, Fiyat: 25000 gp", "Sayısal girin", false);

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

// ----------------------------------------------------
// 5. LOCALE SEPARATOR DETECTOR HELPER
// ----------------------------------------------------
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
