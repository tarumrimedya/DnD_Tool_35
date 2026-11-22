'use strict';

/**
 * Golden 0-Token D&D 3.5e AppAtlas Recognition Regression Suite
 *
 * Verifies:
 *   1. Confident UI hits on real Character Sheet, Hub, and Rule Crafter queries
 *   2. Zero false-positive hijacking of pure D&D 3.5e RAW rule questions / maneuvers
 *      (trip, bull rush, disarm, sunder, grapple, 5-foot step, "how does sneak attack work", etc.)
 *   3. Same-page precedence ("quest log" resolves to hud.quest_notebook on sheet, hub.notes on hub)
 */
const path = require('path');

function runAppAtlasRecognitionTests() {
  const atlas = require(path.join(__dirname, '..', 'app_atlas.js'));
  const failures = [];
  let passed = 0;

  // [query, pageType, expectedKeyOrNull]
  // expectedKeyOrNull === null means MUST NOT produce a confident 0-token match (should fall through to AI)
  const CASES = [
    // --- Character Sheet: HUD & Vitals ---
    ['long rest', 'sheet', 'hud.long_rest'],
    ['take a long rest', 'sheet', 'hud.long_rest'],
    ['sleep', 'sheet', 'hud.long_rest'],
    ['short rest', 'sheet', 'hud.short_rest'],
    ['hp', 'sheet', 'hud.hp'],
    ['take damage', 'sheet', 'hud.hp'],
    ['fast healing', 'sheet', 'hud.periodic_hp'],
    ['bleed', 'sheet', 'hud.periodic_hp'],
    ['initiative', 'sheet', 'hud.initiative'],
    ['roll initiative', 'sheet', 'hud.initiative'],
    ['turn order', 'sheet', 'hud.initiative'],
    ['fortitude', 'sheet', 'hud.saves'],
    ['reflex', 'sheet', 'hud.saves'],
    ['will', 'sheet', 'hud.saves'],
    ['saving throw', 'sheet', 'hud.saves'],
    ['ac breakdown', 'sheet', 'hud.armor_class'],
    ['armor class', 'sheet', 'hud.armor_class'],
    ['touch ac', 'sheet', 'hud.armor_class'],
    ['flat-footed', 'sheet', 'hud.armor_class'],
    ['level up', 'sheet', 'hud.level_up'],
    ['multiclass', 'sheet', 'hud.level_up'],
    ['quest log', 'sheet', 'hud.quest_notebook'],
    ['quest notebook', 'sheet', 'hud.quest_notebook'],

    // --- Character Sheet: Combat Cockpit ---
    ['next round', 'sheet', 'combat.next_round'],
    ['power attack', 'sheet', 'combat.power_attack'],
    ['combat expertise', 'sheet', 'combat.power_attack'],
    ['full attack', 'sheet', 'combat.attacks'],
    ['attack of opportunity', 'sheet', 'combat.attacks'],
    ['flanking', 'sheet', 'combat.tactical_mods'],
    ['rage', 'sheet', 'combat.tactical_mods'],
    ['smite', 'sheet', 'combat.tactical_mods'],
    ['buffs', 'sheet', 'combat.buffs'],
    ['add buff', 'sheet', 'combat.buffs'],
    ['haste', 'sheet', 'combat.buffs'],
    ['turn undead', 'sheet', 'combat.turn_undead'],
    ['rebuke undead', 'sheet', 'combat.turn_undead'],
    ['channeling', 'sheet', 'combat.turn_undead'],
    ['metamagic', 'sheet', 'combat.metamagic'],
    ['empower spell', 'sheet', 'combat.metamagic'],
    ['quicken spell', 'sheet', 'combat.metamagic'],
    ['shield block', 'sheet', 'combat.shield_block'],
    ['cast spell', 'sheet', 'combat.spells'],
    ['wild shape', 'sheet', 'combat.companions'],
    ['animal companion', 'sheet', 'combat.companions'],
    ['familiar', 'sheet', 'combat.companions'],
    ['combat profile', 'sheet', 'combat.saved_profiles'],

    // --- Character Sheet: Spells, Dice, Inventory, Core ---
    ['dice tray', 'sheet', 'dice.tray'],
    ['spellbook', 'sheet', 'spells.manage'],
    ['spell slots', 'sheet', 'spells.slots'],
    ['tome of battle', 'sheet', 'spells.maneuvers'],
    ['psionics', 'sheet', 'spells.subsystems'],
    ['inventory', 'sheet', 'inventory.gear'],
    ['add item', 'sheet', 'inventory.add_item'],
    ['item forge', 'sheet', 'inventory.add_item'],
    ['encumbrance', 'sheet', 'inventory.encumbrance'],
    ['carrying capacity', 'sheet', 'inventory.encumbrance'],
    ['feats', 'sheet', 'core.feats_skills'],
    ['skills', 'sheet', 'core.skills'],

    // --- Pure D&D 3.5e RAW Rules & Maneuvers (MUST fall through to AI, NOT hijack UI) ---
    ['trip', 'sheet', null],
    ['grapple', 'sheet', null],
    ['5-foot step', 'sheet', null],
    ['bull rush', 'sheet', null],
    ['disarm', 'sheet', null],
    ['sunder', 'sheet', null],
    ['feint', 'sheet', null],
    ['withdraw', 'sheet', null],
    ['stabilize', 'sheet', null],
    ['nonlethal', 'sheet', null],
    ['how does sneak attack work', 'sheet', null],
    ['will haste stack with speed', 'sheet', null],
    ['combat log', 'sheet', null],
    ['damage reduction', 'sheet', null],

    // --- Rule Crafter & Hub sanity checks ---
    ['undo', 'crafter', 'crafter.undo_redo'],
    ['live preview', 'crafter', 'crafter.undo_redo'],
    ['rule blocks', 'crafter', 'crafter.blocks'],
    ['import json', 'crafter', 'crafter.examples_json'],
    ['quest log', 'hub', 'hub.notes'],
    ['animal companion', 'hub', 'hub.companions'],
    ['familiar', 'hub', 'hub.companions']
  ];

  for (const [query, page, expected] of CASES) {
    const hits = atlas.matchQuery(query, page, 3);
    const top = hits[0];
    const actual = (top && top.confident) ? top.entry.key : null;
    if (actual === expected) {
      passed++;
    } else {
      const debugTop = hits.map(h => `${h.entry.key}:${h.score}${h.confident ? '*' : ''}`).join(', ') || 'NONE';
      failures.push(`"${query}" (${page}): expected ${expected || 'AI_FALLTHROUGH'}, got ${actual || 'AI_FALLTHROUGH'} [top: ${debugTop}]`);
    }
  }

  return { passed, total: CASES.length, failures };
}

if (require.main === module) {
  const res = runAppAtlasRecognitionTests();
  if (res.failures.length > 0) {
    console.error(`[FAIL] AppAtlas recognition: ${res.passed}/${res.total} passed`);
    res.failures.forEach(f => console.error('  - ' + f));
    process.exit(1);
  } else {
    console.log(`[OK] AppAtlas recognition: ${res.passed}/${res.total} golden 0-token queries passed.`);
  }
}

module.exports = { runAppAtlasRecognitionTests };
