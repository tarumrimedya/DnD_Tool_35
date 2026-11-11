/* ============================================================================
 * LIVING FACET STUDIO — Rule Forge 3.0 Sandbox (Stage 1 prototype)
 * Self-contained: works over file:// and http:// (optionally merges
 * window.SrdCompendium if present). No blocking browser dialogs and no
 * inline handlers — all routing via delegated data-action attributes.
 * ========================================================================== */
(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 0. Helpers
  // --------------------------------------------------------------------------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sgn = (n) => (n >= 0 ? '+' + n : String(n));
  const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : (d || 0); };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = (p) => (p || 'x') + '_' + Math.random().toString(36).slice(2, 9);
  const mod = (score) => Math.floor((score - 10) / 2);
  const gp = (n) => Math.round(n).toLocaleString('en-US') + ' gp';
  const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const DICE_SVG = '<svg class="fs-dice-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 2 7.5 9.5h9zM3 7l4.5 2.5M21 7l-4.5 2.5M7.5 9.5 12 17l4.5-7.5M12 17v5M3 17l4.5-7.5M21 17l-4.5-7.5M3 17h18"/></svg>';

  function rollDice(expr) {
    // supports "XdY+Z", "XdY-Z", "Z"
    const m = String(expr || '').replace(/\s+/g, '').match(/^(\d*)d(\d+)([+-]\d+)?$/i);
    if (!m) return { total: num(expr, 0), rolls: [] };
    const count = num(m[1] || 1, 1), sides = num(m[2], 6), bonus = num(m[3] || 0, 0);
    const rolls = [];
    for (let i = 0; i < count; i++) rolls.push(1 + Math.floor(Math.random() * sides));
    return { total: rolls.reduce((a, b) => a + b, 0) + bonus, rolls };
  }

  // --------------------------------------------------------------------------
  // 1. Built-in SRD / MIC seed catalog (offline-safe)
  // --------------------------------------------------------------------------
  const ABILITIES = [['str', 'Strength'], ['dex', 'Dexterity'], ['con', 'Constitution'], ['int', 'Intelligence'], ['wis', 'Wisdom'], ['cha', 'Charisma']];
  const ABIL_KEYS = ABILITIES.map((a) => a[0]);

  // All 36 official D&D 3.5e PHB skills: [name, key ability, armor check penalty applies]
  const SKILLS = [
    ['Appraise', 'int', 0], ['Balance', 'dex', 1], ['Bluff', 'cha', 0], ['Climb', 'str', 1], ['Concentration', 'con', 0],
    ['Craft', 'int', 0], ['Decipher Script', 'int', 0], ['Diplomacy', 'cha', 0], ['Disable Device', 'int', 0], ['Disguise', 'cha', 0],
    ['Escape Artist', 'dex', 1], ['Forgery', 'int', 0], ['Gather Information', 'cha', 0], ['Handle Animal', 'cha', 0], ['Heal', 'wis', 0],
    ['Hide', 'dex', 1], ['Intimidate', 'cha', 0], ['Jump', 'str', 1], ['Knowledge', 'int', 0], ['Listen', 'wis', 0],
    ['Move Silently', 'dex', 1], ['Open Lock', 'dex', 0], ['Perform', 'cha', 0], ['Profession', 'wis', 0], ['Ride', 'dex', 0],
    ['Search', 'int', 0], ['Sense Motive', 'wis', 0], ['Sleight of Hand', 'dex', 1], ['Speak Language', 'int', 0], ['Spellcraft', 'int', 0],
    ['Spot', 'wis', 0], ['Survival', 'wis', 0], ['Swim', 'str', 2], ['Tumble', 'dex', 1], ['Use Magic Device', 'cha', 0], ['Use Rope', 'dex', 0]
  ];
  const skillKey = (name) => 'skill.' + slug(name);
  const SKILL_BY_KEY = {};
  SKILLS.forEach((s) => { SKILL_BY_KEY[skillKey(s[0])] = { name: s[0], ability: s[1], acp: s[2] }; });

  const TARGET_GROUPS = [
    ['Abilities', ABILITIES.map((a) => [a[0], a[1]])],
    ['Armor Class', [['ac.total', 'AC (All)'], ['ac.touch', 'Touch AC only'], ['ac.flatFooted', 'Flat-Footed AC only'], ['ac.armor', 'Armor Bonus'], ['ac.shield', 'Shield Bonus'], ['ac.natural', 'Natural Armor'], ['ac.deflection', 'Deflection'], ['ac.dodge', 'Dodge']]],
    ['Saving Throws', [['save.all', 'All Saving Throws'], ['save.fort', 'Fortitude'], ['save.ref', 'Reflex'], ['save.will', 'Will']]],
    ['Combat', [['atk.all', 'Attack Rolls (All)'], ['atk.melee', 'Melee Attack'], ['atk.ranged', 'Ranged Attack'], ['dmg.all', 'Damage (All)'], ['dmg.melee', 'Melee Damage'], ['initiative', 'Initiative'], ['speed.land', 'Land Speed (ft.)'], ['casterLevel', 'Caster Level'], ['hp.temp', 'Temporary Hit Points'], ['grapple', 'Grapple']]],
    ['Skills (36)', [['skill.all', 'All Skills']].concat(SKILLS.map((s) => [skillKey(s[0]), s[0]]))]
  ];
  const TARGET_LABEL = {};
  TARGET_GROUPS.forEach((g) => g[1].forEach((t) => { TARGET_LABEL[t[0]] = t[1]; }));

  // 3.5e bonus types. stacks: same-type bonuses stack; lostFF: lost when Flat-Footed; noTouch: does not apply to Touch AC
  const BONUS_TYPES = [
    { id: 'Untyped', stacks: true }, { id: 'Dodge', stacks: true, lostFF: true }, { id: 'Circumstance', stacks: true, note: 'stacks from different sources' },
    { id: 'Penalty', stacks: true, note: 'always stacks' }, { id: 'Enhancement' }, { id: 'Luck' }, { id: 'Morale' }, { id: 'Sacred' }, { id: 'Profane' },
    { id: 'Insight' }, { id: 'Competence' }, { id: 'Resistance' }, { id: 'Deflection' }, { id: 'Alchemical' }, { id: 'Inherent', cap: 5 },
    { id: 'Armor', noTouch: true }, { id: 'Armor Enhancement', noTouch: true }, { id: 'Shield', noTouch: true }, { id: 'Shield Enhancement', noTouch: true },
    { id: 'Natural Armor', noTouch: true }, { id: 'Natural Armor Enhancement', noTouch: true }, { id: 'Racial' }, { id: 'Size' }, { id: 'Exalted' }, { id: 'Perfection' }
  ];

  const FORMULAS = [['flat', 'Flat Value'], ['@level', '= Character Level (@level)'], ['floor(@level/2)', '= Half Level (floor(@level/2))'], ['@cl', '= Caster Level (@cl)'],
    ['@strMod', '= STR modifier'], ['@dexMod', '= DEX modifier'], ['@conMod', '= CON modifier'], ['@intMod', '= INT modifier'], ['@wisMod', '= WIS modifier'], ['@chaMod', '= CHA modifier']];

  const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Force', 'Holy', 'Unholy', 'Positive', 'Negative', 'Precision', 'Vile', 'Nonlethal'];
  const ENERGY = ['Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Force'];
  const DR_BYPASS = ['magic', 'adamantine', 'cold iron', 'silver', 'evil', 'good', 'lawful', 'chaotic', '-'];
  const ACTIONS = ['Standard', 'Full-Round', 'Move', 'Swift', 'Immediate', 'Free', 'Passive'];
  const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation', 'Universal'];
  const ALIGNS = ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE'];
  const ALIGN_NAMES = { LG: 'Lawful Good', NG: 'Neutral Good', CG: 'Chaotic Good', LN: 'Lawful Neutral', N: 'True Neutral', CN: 'Chaotic Neutral', LE: 'Lawful Evil', NE: 'Neutral Evil', CE: 'Chaotic Evil' };
  const ALIGN_REQS = ALIGNS.concat(['Any Good', 'Any Evil', 'Any Lawful', 'Any Chaotic', 'Any Non-Good', 'Any Non-Evil', 'Any Non-Lawful', 'Any Non-Chaotic', 'Any Neutral']);

  // [id, name, cost gp, dice, critRange (low end), critMult, category, handed, damage type, weight lb, range ft, wooden]
  const WEAPONS_RAW = [
    ['dagger', 'Dagger', 2, '1d4', 19, 2, 'Simple', 'Light', 'Piercing', 1, 10, 0],
    ['mace_heavy', 'Mace, Heavy', 12, '1d8', 20, 2, 'Simple', 'One-Handed', 'Bludgeoning', 8, 0, 0],
    ['quarterstaff', 'Quarterstaff', 0, '1d6', 20, 2, 'Simple', 'Two-Handed', 'Bludgeoning', 4, 0, 1],
    ['spear', 'Spear', 2, '1d8', 20, 3, 'Simple', 'Two-Handed', 'Piercing', 6, 20, 0],
    ['crossbow_light', 'Crossbow, Light', 35, '1d8', 19, 2, 'Simple', 'Two-Handed', 'Piercing', 4, 80, 0],
    ['longsword', 'Longsword', 15, '1d8', 19, 2, 'Martial', 'One-Handed', 'Slashing', 4, 0, 0],
    ['scimitar', 'Scimitar', 15, '1d6', 18, 2, 'Martial', 'One-Handed', 'Slashing', 4, 0, 0],
    ['rapier', 'Rapier', 20, '1d6', 18, 2, 'Martial', 'One-Handed', 'Piercing', 2, 0, 0],
    ['battleaxe', 'Battleaxe', 10, '1d8', 20, 3, 'Martial', 'One-Handed', 'Slashing', 6, 0, 0],
    ['warhammer', 'Warhammer', 12, '1d8', 20, 3, 'Martial', 'One-Handed', 'Bludgeoning', 5, 0, 0],
    ['greatsword', 'Greatsword', 50, '2d6', 19, 2, 'Martial', 'Two-Handed', 'Slashing', 8, 0, 0],
    ['greataxe', 'Greataxe', 20, '1d12', 20, 3, 'Martial', 'Two-Handed', 'Slashing', 12, 0, 0],
    ['longbow', 'Longbow', 75, '1d8', 20, 3, 'Martial', 'Two-Handed', 'Piercing', 3, 100, 1],
    ['bastard_sword', 'Bastard Sword', 35, '1d10', 19, 2, 'Exotic', 'One-Handed', 'Slashing', 6, 0, 0],
    ['katana', 'Katana (OA, masterwork bastard sword)', 400, '1d10', 19, 2, 'Exotic', 'One-Handed', 'Slashing', 6, 0, 0],
    ['spiked_chain', 'Spiked Chain', 25, '2d4', 20, 2, 'Exotic', 'Two-Handed', 'Piercing', 10, 0, 0]
  ];
  const WEAPONS = WEAPONS_RAW.map((w) => ({ id: w[0], name: w[1], cost: w[2], dice: w[3], critRange: w[4], critMult: w[5], category: w[6], handed: w[7], dmgType: w[8], weight: w[9], range: w[10], wooden: !!w[11] }));

  // [id, name, cost, armorBonus, maxDex (99 = none), acp, asf %, type, speed30, kind, weight]
  const ARMORS_RAW = [
    ['padded', 'Padded', 5, 1, 8, 0, 5, 'Light', 30, 'armor', 10], ['leather', 'Leather', 10, 2, 6, 0, 10, 'Light', 30, 'armor', 15],
    ['studded_leather', 'Studded Leather', 25, 3, 5, -1, 15, 'Light', 30, 'armor', 20], ['chain_shirt', 'Chain Shirt', 100, 4, 4, -2, 20, 'Light', 30, 'armor', 25],
    ['hide', 'Hide', 15, 3, 4, -3, 20, 'Medium', 20, 'armor', 25], ['scale_mail', 'Scale Mail', 50, 4, 3, -4, 25, 'Medium', 20, 'armor', 30],
    ['chainmail', 'Chainmail', 150, 5, 2, -5, 30, 'Medium', 20, 'armor', 40], ['breastplate', 'Breastplate', 200, 5, 3, -4, 25, 'Medium', 20, 'armor', 30],
    ['splint_mail', 'Splint Mail', 200, 6, 0, -7, 40, 'Heavy', 20, 'armor', 45], ['banded_mail', 'Banded Mail', 250, 6, 1, -6, 35, 'Heavy', 20, 'armor', 35],
    ['half_plate', 'Half-Plate', 600, 7, 0, -7, 40, 'Heavy', 20, 'armor', 50], ['full_plate', 'Full Plate', 1500, 8, 1, -6, 35, 'Heavy', 20, 'armor', 50],
    ['buckler', 'Buckler', 15, 1, 99, -1, 5, 'Shield', 30, 'shield', 5], ['shield_light_wooden', 'Shield, Light Wooden', 3, 1, 99, -1, 5, 'Shield', 30, 'shield', 5],
    ['shield_light_steel', 'Shield, Light Steel', 9, 1, 99, -1, 5, 'Shield', 30, 'shield', 6], ['shield_heavy_wooden', 'Shield, Heavy Wooden', 7, 2, 99, -2, 15, 'Shield', 30, 'shield', 10],
    ['shield_heavy_steel', 'Shield, Heavy Steel', 20, 2, 99, -2, 15, 'Shield', 30, 'shield', 15], ['shield_tower', 'Shield, Tower', 30, 4, 2, -10, 50, 'Shield', 30, 'shield', 45]
  ];
  const ARMORS = ARMORS_RAW.map((a) => ({ id: a[0], name: a[1], cost: a[2], armorBonus: a[3], maxDex: a[4], acp: a[5], asf: a[6], type: a[7], speed: a[8], kind: a[9], weight: a[10], wooden: /wooden/.test(a[0]) }));

  const MATERIALS = [
    { id: 'standard', name: 'Standard' },
    { id: 'masterwork', name: 'Masterwork', note: 'Weapon: +1 Enhancement on attack (superseded by magic). Armor: ACP reduced by 1.' },
    { id: 'mithral', name: 'Mithral', note: 'Armor: +2 Max Dex, ACP -3 (toward 0), ASF -10%, one category lighter. Always masterwork.' },
    { id: 'adamantine', name: 'Adamantine', note: 'Weapon: bypasses DR/adamantine & hardness < 20. Armor: DR 1/- (Light), 2/- (Medium), 3/- (Heavy). Always masterwork.' },
    { id: 'cold_iron', name: 'Cold Iron', note: 'Bypasses DR/cold iron. Double base cost; +2,000 gp to enchant.' },
    { id: 'alchemical_silver', name: 'Alchemical Silver', note: 'Bypasses DR/silver. -1 damage (min 1).' },
    { id: 'darkwood', name: 'Darkwood', note: 'Wooden items only. Half weight; shields ACP -2 (toward 0). Always masterwork.' }
  ];

  // Enchantments: [id, name, applies (weapon|armor|shield|armor+shield), bonus cost (+N) or 0, flat gp, effect payload]
  const ENCHANTMENTS = [
    { id: 'bane', name: 'Bane', on: 'weapon', plus: 1, effect: { badge: 'Bane: +2 Enh & +2d6 vs designated foe' } },
    { id: 'defending', name: 'Defending', on: 'weapon', plus: 1, effect: { badge: 'Defending: transfer Enh to AC' } },
    { id: 'flaming', name: 'Flaming', on: 'weapon', plus: 1, effect: { parts: [{ count: 1, die: 'd6', type: 'Fire', crit: 'normal' }] } },
    { id: 'frost', name: 'Frost', on: 'weapon', plus: 1, effect: { parts: [{ count: 1, die: 'd6', type: 'Cold', crit: 'normal' }] } },
    { id: 'shock', name: 'Shock', on: 'weapon', plus: 1, effect: { parts: [{ count: 1, die: 'd6', type: 'Electricity', crit: 'normal' }] } },
    { id: 'ghost_touch_w', name: 'Ghost Touch', on: 'weapon', plus: 1, effect: { badge: 'Ghost Touch: full damage vs incorporeal' } },
    { id: 'keen', name: 'Keen', on: 'weapon', plus: 1, effect: { keen: true }, note: 'Doubles threat range (Slashing/Piercing only)' },
    { id: 'merciful', name: 'Merciful', on: 'weapon', plus: 1, effect: { parts: [{ count: 1, die: 'd6', type: 'Nonlethal', crit: 'normal' }] } },
    { id: 'spell_storing', name: 'Spell Storing', on: 'weapon', plus: 1, effect: { badge: 'Spell Storing: 3rd-level spell' } },
    { id: 'thundering', name: 'Thundering', on: 'weapon', plus: 1, effect: { parts: [{ count: 1, die: 'd8', type: 'Sonic', crit: 'onCritOnly', perMult: true }] } },
    { id: 'vicious', name: 'Vicious', on: 'weapon', plus: 1, effect: { parts: [{ count: 2, die: 'd6', type: 'Force', crit: 'normal' }], badge: 'Vicious: wielder takes 1d6' } },
    { id: 'anarchic', name: 'Anarchic', on: 'weapon', plus: 2, effect: { parts: [{ count: 2, die: 'd6', type: 'Unholy', crit: 'normal', cond: 'vs Lawful' }] } },
    { id: 'axiomatic', name: 'Axiomatic', on: 'weapon', plus: 2, effect: { parts: [{ count: 2, die: 'd6', type: 'Holy', crit: 'normal', cond: 'vs Chaotic' }] } },
    { id: 'flaming_burst', name: 'Flaming Burst', on: 'weapon', plus: 2, effect: { parts: [{ count: 1, die: 'd6', type: 'Fire', crit: 'normal' }, { count: 1, die: 'd10', type: 'Fire', crit: 'onCritOnly', perMult: true }] } },
    { id: 'icy_burst', name: 'Icy Burst', on: 'weapon', plus: 2, effect: { parts: [{ count: 1, die: 'd6', type: 'Cold', crit: 'normal' }, { count: 1, die: 'd10', type: 'Cold', crit: 'onCritOnly', perMult: true }] } },
    { id: 'shocking_burst', name: 'Shocking Burst', on: 'weapon', plus: 2, effect: { parts: [{ count: 1, die: 'd6', type: 'Electricity', crit: 'normal' }, { count: 1, die: 'd10', type: 'Electricity', crit: 'onCritOnly', perMult: true }] } },
    { id: 'holy', name: 'Holy', on: 'weapon', plus: 2, effect: { parts: [{ count: 2, die: 'd6', type: 'Holy', crit: 'normal', cond: 'vs Evil' }] } },
    { id: 'unholy', name: 'Unholy', on: 'weapon', plus: 2, effect: { parts: [{ count: 2, die: 'd6', type: 'Unholy', crit: 'normal', cond: 'vs Good' }] } },
    { id: 'wounding', name: 'Wounding', on: 'weapon', plus: 2, effect: { badge: 'Wounding: 1 Con damage per hit' } },
    { id: 'speed', name: 'Speed', on: 'weapon', plus: 3, effect: { badge: 'Speed: +1 extra attack on Full Attack' } },
    { id: 'brilliant_energy', name: 'Brilliant Energy', on: 'weapon', plus: 4, effect: { badge: 'Brilliant Energy: ignores armor & shield AC' } },
    { id: 'dancing', name: 'Dancing', on: 'weapon', plus: 4, effect: { badge: 'Dancing: fights alone 4 rounds' } },
    { id: 'vorpal', name: 'Vorpal', on: 'weapon', plus: 5, effect: { badge: 'Vorpal: severs head on natural 20 confirmed' } },
    { id: 'glamered', name: 'Glamered', on: 'armor', gp: 2700, effect: { badge: 'Glamered: appears as normal clothing' } },
    { id: 'fort_light', name: 'Light Fortification', on: 'armor+shield', plus: 1, effect: { badge: 'Fortification 25%' } },
    { id: 'shadow', name: 'Shadow', on: 'armor', gp: 3750, effect: { mods: [{ target: 'skill.hide', value: 5, type: 'Competence' }] } },
    { id: 'silent_moves', name: 'Silent Moves', on: 'armor', gp: 3750, effect: { mods: [{ target: 'skill.move_silently', value: 5, type: 'Competence' }] } },
    { id: 'slick', name: 'Slick', on: 'armor', gp: 3750, effect: { mods: [{ target: 'skill.escape_artist', value: 5, type: 'Competence' }] } },
    { id: 'improved_shadow', name: 'Improved Shadow', on: 'armor', gp: 15000, effect: { mods: [{ target: 'skill.hide', value: 10, type: 'Competence' }] } },
    { id: 'spell_res_13', name: 'Spell Resistance (13)', on: 'armor+shield', plus: 2, effect: { sr: 13 } },
    { id: 'fort_moderate', name: 'Moderate Fortification', on: 'armor+shield', plus: 3, effect: { badge: 'Fortification 75%' } },
    { id: 'ghost_touch_a', name: 'Ghost Touch', on: 'armor+shield', plus: 3, effect: { badge: 'Ghost Touch armor' } },
    { id: 'invulnerability', name: 'Invulnerability', on: 'armor', plus: 3, effect: { dr: { value: 5, bypass: 'magic' } } },
    { id: 'fort_heavy', name: 'Heavy Fortification', on: 'armor+shield', plus: 5, effect: { badge: 'Fortification 100%' } },
    { id: 'fire_res', name: 'Fire Resistance', on: 'armor+shield', gp: 18000, effect: { energy: { type: 'Fire', value: 10 } } },
    { id: 'cold_res', name: 'Cold Resistance', on: 'armor+shield', gp: 18000, effect: { energy: { type: 'Cold', value: 10 } } },
    { id: 'acid_res', name: 'Acid Resistance', on: 'armor+shield', gp: 18000, effect: { energy: { type: 'Acid', value: 10 } } },
    { id: 'bashing', name: 'Bashing', on: 'shield', plus: 1, effect: { badge: 'Bashing: shield bash as two sizes larger' } },
    { id: 'animated', name: 'Animated', on: 'shield', plus: 2, effect: { badge: 'Animated: floats, hands free' } },
    { id: 'arrow_deflection', name: 'Arrow Deflection', on: 'shield', plus: 2, effect: { badge: 'Arrow Deflection: DC 20 Reflex vs ranged' } },
    { id: 'reflecting', name: 'Reflecting', on: 'shield', plus: 5, effect: { badge: 'Reflecting: Spell Turning 1/day' } }
  ];
  const ENCH_BY_ID = {}; ENCHANTMENTS.forEach((e) => { ENCH_BY_ID[e.id] = e; });

  // MIC Augment Crystals — tier gating: Least (masterwork), Lesser (+1), Greater (+3)
  const CRYSTALS = [
    { id: 'truedeath', name: 'Truedeath Crystal', on: 'weapon', cost: [500, 1400, 4000], tiers: ['+1d6 damage vs undead', '+1d6 vs undead; threats vs undead +2 to confirm', '+2d6 vs undead; slain undead cannot rise'], parts: [[1, 'd6'], [1, 'd6'], [2, 'd6']], ptype: 'Positive', cond: 'vs undead' },
    { id: 'energy_assault', name: 'Crystal of Energy Assault', on: 'weapon', cost: [1000, 3000, 8000], tiers: ['+1 energy damage', '+1d6 energy damage', '+2d6 energy damage'], parts: [[0, '1'], [1, 'd6'], [2, 'd6']], ptype: 'Fire' },
    { id: 'arcane_steel', name: 'Crystal of Arcane Steel', on: 'weapon', cost: [250, 1000, 4000], tiers: ['+1 attack vs creatures with SR', 'Overcome DR/magic as +1', 'Ignore SR once per day'], mods: [[{ target: 'atk.melee', value: 1, type: 'Insight', condition: 'vs creatures with SR' }], [], []] },
    { id: 'demolition', name: 'Demolition Crystal', on: 'weapon', cost: [100, 500, 1500], tiers: ['+1d6 vs constructs & objects', '+2d6 vs constructs & objects', '+3d6 vs constructs & objects'], parts: [[1, 'd6'], [2, 'd6'], [3, 'd6']], ptype: 'Force', cond: 'vs constructs/objects' },
    { id: 'return', name: 'Crystal of Return', on: 'weapon', cost: [300, 1000, 3000], tiers: ['Draw weapon as free action', 'Weapon returns when disarmed', 'Teleport weapon to hand 1/day'] },
    { id: 'security', name: 'Crystal of Security', on: 'weapon', cost: [500, 1000, 3000], tiers: ['+5 vs Disarm & Sunder', '+10 vs Disarm & Sunder', 'Cannot be disarmed or sundered'] },
    { id: 'iron_ward', name: 'Iron Ward Diamond', on: 'armor+shield', cost: [1000, 3000, 9000], tiers: ['DR 1/- (1/day, 10 rounds)', 'DR 2/- (1/day, 10 rounds)', 'DR 3/- (constant)'], dr: [1, 2, 3] },
    { id: 'glancing_blows', name: 'Crystal of Glancing Blows', on: 'armor+shield', cost: [500, 1500, 4500], tiers: ['+2 AC vs Bull Rush/Overrun', '+4 vs Grapple escapes', '+2 Dodge AC vs AoO'] },
    { id: 'life_drinking', name: 'Crystal of Life Drinking', on: 'armor+shield', cost: [1000, 3000, 9000], tiers: ['Resist first negative level/day', 'Resist two negative levels/day', 'Immune to negative levels'] },
    { id: 'lifekeeping', name: 'Crystal of Lifekeeping', on: 'armor+shield', cost: [500, 1500, 4500], tiers: ['+1 Resistance on saves vs death effects', '+3 Resistance on saves vs death effects', '+5 Resistance on saves vs death effects'], mods: [[{ target: 'save.all', value: 1, type: 'Resistance', condition: 'vs death effects' }], [{ target: 'save.all', value: 3, type: 'Resistance', condition: 'vs death effects' }], [{ target: 'save.all', value: 5, type: 'Resistance', condition: 'vs death effects' }]] },
    { id: 'mind_cloaking', name: 'Crystal of Mind Cloaking', on: 'armor+shield', cost: [500, 1500, 4500], tiers: ['+2 Resistance on Will vs mind-affecting', '+3 vs mind-affecting', '+5 vs mind-affecting'], mods: [[{ target: 'save.will', value: 2, type: 'Resistance', condition: 'vs mind-affecting' }], [{ target: 'save.will', value: 3, type: 'Resistance', condition: 'vs mind-affecting' }], [{ target: 'save.will', value: 5, type: 'Resistance', condition: 'vs mind-affecting' }]] },
    { id: 'stamina', name: 'Crystal of Stamina', on: 'armor+shield', cost: [500, 1500, 4500], tiers: ['Ignore fatigue 1/day', 'Immune to fatigue', 'Immune to fatigue & exhaustion'] },
    { id: 'adaptation', name: 'Crystal of Adaptation', on: 'armor+shield', cost: [500, 1500, 4500], tiers: ['Endure Elements (constant)', 'Breathe in hostile environments', 'Immune to environmental extremes'] }
  ];
  const CRYSTAL_BY_ID = {}; CRYSTALS.forEach((c) => { CRYSTAL_BY_ID[c.id] = c; });
  const CRYSTAL_TIERS = ['least', 'lesser', 'greater'];
  const CRYSTAL_REQ = { least: 0, lesser: 1, greater: 3 };

  const FEATS = [
    { id: 'power_attack', name: 'Power Attack', tags: ['#FighterBonus', '#General'] }, { id: 'cleave', name: 'Cleave', tags: ['#FighterBonus'] },
    { id: 'dodge', name: 'Dodge', tags: ['#FighterBonus'] }, { id: 'mobility', name: 'Mobility', tags: ['#FighterBonus'] },
    { id: 'weapon_focus', name: 'Weapon Focus (Longsword)', tags: ['#FighterBonus'] }, { id: 'iron_will', name: 'Iron Will', tags: ['#General'] },
    { id: 'combat_expertise', name: 'Combat Expertise', tags: ['#FighterBonus'] }, { id: 'improved_initiative', name: 'Improved Initiative', tags: ['#FighterBonus'] },
    { id: 'spell_focus_illusion', name: 'Spell Focus (Illusion)', tags: ['#WizardBonus'] }, { id: 'combat_casting', name: 'Combat Casting', tags: ['#General'] },
    { id: 'shadow_weave_magic', name: 'Shadow Weave Magic', tags: ['#ShadowcastPool'] }, { id: 'scribe_scroll', name: 'Scribe Scroll', tags: ['#ItemCreation', '#WizardBonus'] },
    { id: 'empower_spell', name: 'Empower Spell', tags: ['#Metamagic', '#WizardBonus'] }, { id: 'weapon_specialization', name: 'Weapon Specialization (Longsword)', tags: ['#FighterBonus'] }
  ];
  const SAMPLE_SPELLS = ['Haste', 'Bestow Curse', 'Righteous Might', 'Heroism', 'Mage Armor', 'Shield', 'Bull\'s Strength', 'Blur', 'Displacement', 'Fireball', 'Energy Drain', 'Searing Light'];
  const DOMAINS = ['Sun', 'Good', 'Healing', 'Strength', 'War', 'Protection', 'Fire', 'Death', 'Trickery', 'Knowledge', 'Magic', 'Law', 'Chaos', 'Evil', 'Travel', 'Luck'];
  const FACETS = [
    { key: 'identity', n: 1, title: 'Identity & Living Tag Pools', icon: '📜' },
    { key: 'prereqs', n: 2, title: 'Gatekeeper Prerequisites', icon: '🏛️' },
    { key: 'chassis', n: 3, title: 'Physical Chassis & Assembly', icon: '⚔️' },
    { key: 'modifiers', n: 4, title: 'Continuous Modifiers, Penalties & State Locks', icon: '✨' },
    { key: 'delivery', n: 5, title: 'Active Delivery & Resolution', icon: '🔮' },
    { key: 'lifecycle', n: 6, title: 'Lifecycle, Duration, Cooldown & Stacks', icon: '⚡' },
    { key: 'defenses', n: 7, title: 'Defenses & Reactions', icon: '🛡️' },
    { key: 'progression', n: 8, title: 'Progression Matrix', icon: '💎' },
    { key: 'grants', n: 9, title: 'Grants, Deity & Domain Ladders', icon: '🏛️' }
  ];
  const FACET_BY_KEY = {}; FACETS.forEach((f) => { FACET_BY_KEY[f.key] = f; });

  const BLUEPRINTS = [
    { id: 'weapon', name: 'Weapon', icon: '⚔️', facets: ['identity', 'chassis', 'modifiers'], chassis: 'weapon' },
    { id: 'armor', name: 'Armor / Shield', icon: '🛡️', facets: ['identity', 'chassis', 'modifiers', 'defenses'], chassis: 'armor' },
    { id: 'feat', name: 'Feat / Boon', icon: '📜', facets: ['identity', 'prereqs', 'modifiers'] },
    { id: 'spell', name: 'Spell / Power', icon: '🔮', facets: ['identity', 'delivery', 'lifecycle', 'modifiers'] },
    { id: 'buff', name: 'Buff / Condition', icon: '✨', facets: ['identity', 'modifiers', 'lifecycle', 'defenses'] },
    { id: 'class', name: 'Class / Prestige Class', icon: '💎', facets: ['identity', 'prereqs', 'progression', 'grants'] },
    { id: 'deity', name: 'Deity & Domain', icon: '🏛️', facets: ['identity', 'grants'] },
    { id: 'wondrous', name: 'Wondrous / Ring', icon: '💎', facets: ['identity', 'modifiers', 'lifecycle', 'defenses'] }
  ];
  const BP_BY_ID = {}; BLUEPRINTS.forEach((b) => { BP_BY_ID[b.id] = b; });

  // Optional SRD compendium merge (when served over HTTP with srd scripts loaded)
  try {
    const C = window.SrdCompendium;
    if (C && Array.isArray(C.weapons)) {
      C.weapons.forEach((w) => {
        if (!w || !w.id || WEAPONS.some((x) => x.id === w.id)) return;
        WEAPONS.push({ id: w.id, name: w.name || w.id, cost: num(w.cost), dice: w.dice || w.damage || '1d6', critRange: num(w.critRange, 20), critMult: num(w.critMult, 2), category: w.category || 'Martial', handed: w.handed || 'One-Handed', dmgType: w.dmgType || 'Slashing', weight: num(w.weight, 1), range: num(w.range), wooden: false });
      });
    }
  } catch (e) { /* compendium optional */ }

  // --------------------------------------------------------------------------
  // 2. Entry model (Canonical V2.5 facet entry)
  // --------------------------------------------------------------------------
  function weaponOverrides(baseId) {
    const w = WEAPONS.find((x) => x.id === baseId) || WEAPONS[5];
    return { dice: w.dice, critRange: w.critRange, critMult: w.critMult, rangeOn: w.range > 0, range: w.range, category: w.category, handed: w.handed, dmgType: w.dmgType };
  }
  function armorOverrides(baseId) {
    const a = ARMORS.find((x) => x.id === baseId) || ARMORS[3];
    return { type: a.type, armorBonus: a.armorBonus, maxDex: a.maxDex, acp: a.acp, asf: a.asf, speed: a.speed };
  }
  function blankChassis(kind, baseId) {
    const isW = kind === 'weapon';
    const id = baseId || (isW ? 'longsword' : kind === 'shield' ? 'shield_heavy_steel' : 'chain_shirt');
    return {
      kind: kind, baseId: id, material: 'standard', enhancement: 0, enchantments: [], crystal: { id: '', tier: 'least' }, damageParts: [],
      weapon: weaponOverrides(isW ? id : 'longsword'), armor: armorOverrides(isW ? 'chain_shirt' : id)
    };
  }
  function blankLevels() { const a = []; for (let i = 0; i < 20; i++) a.push({ features: [], spell: false }); return a; }

  function blankEntry(bpId) {
    const bp = BP_BY_ID[bpId] || null;
    return {
      schemaVersion: 2.5, id: uid('custom'), blueprint: bpId, name: '', source: 'Homebrew', tags: [], repeat: { mode: 'once', n: 2 },
      facets: bp ? bp.facets.slice() : ['identity'],
      prereqs: [],
      chassis: blankChassis(bp && bp.chassis === 'armor' ? 'armor' : 'weapon'),
      modifiers: [], substitutions: [],
      locks: { loseDex: false, flatFooted: false, cannotAct: false, blinded: false, entangled: false, negLevel: false, extraAttack: false },
      delivery: {
        action: 'Standard', rangeOn: false, range: 'Close (25 ft. + 5 ft./2 levels)', area: '',
        saveOn: false, save: { type: 'Reflex', effect: 'Half', dcMode: 'spell', stat: 'int', flat: 15, spellLevel: 1 },
        srOn: false, sr: 'Yes', diceOn: false, dice: { count: 1, die: 'd6', type: 'Fire', perCL: false, max: 10 },
        spellOn: false, spell: { classes: [{ cls: 'Sor/Wiz', lvl: 1 }], school: 'Evocation', comps: { V: true, S: true, M: false, F: false, DF: false, XP: false } },
        linkedBuff: false
      },
      lifecycle: { usage: 'atwill', perDay: 3, charges: 50, cooldown: '1d4+1', duration: 'permanent', durValue: 10, stackable: false, maxStacks: 5, ongoingOn: false, ongoing: { kind: 'dot', dice: '1d6', type: 'Fire', value: 2 } },
      defenses: { dr: [], energy: [], srOn: false, sr: { mode: 'flat', value: 15 }, concealment: 0, reactionOn: false, reaction: '' },
      progression: { mode: 'prestige', maxLevel: 10, hitDie: 8, bab: '3/4', good: { fort: false, ref: false, will: false }, skillPts: 2, testLevel: 1, levels: blankLevels(), pattern: { name: 'Sneak Attack', start: 1, every: 2, scale: '+1d6' } },
      grants: { deityAlign: 'NG', favoredWeapon: 'mace_heavy', domains: [], grantedPower: '', grantedUses: '1/day', ladder: ['', '', '', '', '', '', '', '', ''], featGrants: [] }
    };
  }
  const M = (target, value, type, condition, formula) => ({ id: uid('m'), target: target, value: value, formula: formula || 'flat', type: type || 'Untyped', condition: condition || '' });
  const ALT = (o) => Object.assign({ id: uid('a'), kind: 'ability', ability: 'str', min: 13, skill: 'skill.tumble', feat: '', levelKind: 'casterLevel', cls: '', align: 'Any Good' }, o);

  // --------------------------------------------------------------------------
  // 3. Presets (8 stress-test scenarios)
  // --------------------------------------------------------------------------
  const PRESETS = [
    { id: 'katana', label: '+2 Keen Flaming Burst Adamantine Katana + Truedeath Crystal', build() {
      const e = blankEntry('weapon');
      e.name = ''; e.source = 'DMG / Oriental Adventures / MIC'; e.tags = ['#Weapon', '#Sword'];
      e.chassis = blankChassis('weapon', 'katana');
      e.chassis.material = 'adamantine'; e.chassis.enhancement = 2; e.chassis.enchantments = ['keen', 'flaming_burst'];
      e.chassis.crystal = { id: 'truedeath', tier: 'least' };
      e.chassis.damageParts = [{ id: uid('d'), count: 1, die: 'd4', type: 'Precision', crit: 'normal', cond: 'when flanking (custom chip — editable)' }];
      return e; } },
    { id: 'halfplate', label: '+1 Shadow Mithral Half-Plate + Iron Ward Diamond', build() {
      const e = blankEntry('armor');
      e.source = 'DMG / MIC'; e.tags = ['#Armor'];
      e.chassis = blankChassis('armor', 'half_plate');
      e.chassis.material = 'mithral'; e.chassis.enhancement = 1; e.chassis.enchantments = ['shadow'];
      e.chassis.crystal = { id: 'iron_ward', tier: 'least' };
      e.facets = ['identity', 'chassis', 'modifiers', 'defenses'];
      return e; } },
    { id: 'breath', label: 'Dragon Breath Weapon (Acid)', build() {
      const e = blankEntry('spell');
      e.name = 'Breath Weapon (Acid)'; e.source = 'Monster Manual'; e.tags = ['#SpecialAbility', '#Draconic'];
      e.facets = ['identity', 'delivery', 'lifecycle'];
      Object.assign(e.delivery, { action: 'Standard', rangeOn: true, range: 'Personal', area: '30-ft. Cone', saveOn: true, srOn: false, diceOn: true, spellOn: false, linkedBuff: false });
      e.delivery.save = { type: 'Reflex', effect: 'Half', dcMode: 'hd', stat: 'con', flat: 15, spellLevel: 1 };
      e.delivery.dice = { count: 6, die: 'd8', type: 'Acid', perCL: false, max: 10 };
      Object.assign(e.lifecycle, { usage: 'cooldown', cooldown: '1d4+1', duration: 'permanent' });
      return e; } },
    { id: 'curse', label: 'Bestow Curse / Energy Drain (Stackable Debuff)', build() {
      const e = blankEntry('buff');
      e.name = 'Bestow Curse / Energy Drain'; e.source = 'PHB'; e.tags = ['#Curse', '#Debuff'];
      e.modifiers = [M('atk.all', -4, 'Penalty'), M('save.all', -4, 'Penalty'), M('skill.all', -4, 'Penalty')];
      e.locks.negLevel = true;
      Object.assign(e.lifecycle, { usage: 'atwill', duration: 'permanent', stackable: true, maxStacks: 5 });
      e.facets = ['identity', 'modifiers', 'lifecycle'];
      return e; } },
    { id: 'might', label: 'Righteous Might / Heroism Aura (Multi-Stat Buff)', build() {
      const e = blankEntry('buff');
      e.name = 'Righteous Might + Heroism'; e.source = 'PHB'; e.tags = ['#Buff', '#Divine'];
      e.modifiers = [M('str', 4, 'Size'), M('con', 4, 'Size'), M('ac.natural', 2, 'Natural Armor Enhancement'), M('atk.all', -1, 'Size'), M('ac.total', -1, 'Size'),
        M('atk.all', 2, 'Morale'), M('save.all', 2, 'Morale'), M('skill.all', 2, 'Morale'), M('save.will', 4, 'Morale', 'vs Fear')];
      e.defenses.dr = [{ id: uid('dr'), value: 5, bypass: 'evil' }];
      Object.assign(e.lifecycle, { duration: 'roundsPerLevel', durValue: 1 });
      return e; } },
    { id: 'shadowadept', label: 'Shadow Adept (Prestige Class 1–10)', build() {
      const e = blankEntry('class');
      e.name = 'Shadow Adept'; e.source = "Player's Guide to Faerûn"; e.tags = ['#PrestigeClass', '#ShadowcastPool'];
      e.prereqs = [
        { id: uid('p'), alts: [ALT({ kind: 'alignment', align: 'Any Non-Good' })] },
        { id: uid('p'), alts: [ALT({ kind: 'skill', skill: 'skill.knowledge', min: 8 }), ALT({ kind: 'skill', skill: 'skill.spellcraft', min: 8 })] },
        { id: uid('p'), alts: [ALT({ kind: 'feat', feat: 'Shadow Weave Magic' }), ALT({ kind: 'feat', feat: '#ShadowcastPool' })] },
        { id: uid('p'), alts: [ALT({ kind: 'level', levelKind: 'casterLevel', min: 5 })] }
      ];
      const p = e.progression;
      Object.assign(p, { mode: 'prestige', maxLevel: 10, hitDie: 4, bab: '1/2', skillPts: 2, testLevel: 3 });
      p.good = { fort: false, ref: false, will: true };
      p.levels.forEach((l, i) => { l.spell = i < 10; });
      p.levels[0].features = ['Low-Light Vision', 'Shadow Feats'];
      p.levels[3].features = ['Shadow Walk'];
      p.levels[6].features = ['Darkvision'];
      p.levels[9].features = ['Shadow Double'];
      applyPattern(p, { name: 'Shadow Defense', start: 2, every: 3, scale: '+1' });
      applyPattern(p, { name: 'Spell Power', start: 3, every: 3, scale: '+1' });
      p.pattern = { name: 'Shadow Defense', start: 2, every: 3, scale: '+1' };
      e.grants.featGrants = [{ id: uid('g'), count: 1, pool: '#ShadowcastPool', level: 1 }];
      e.facets = ['identity', 'prereqs', 'progression', 'grants'];
      return e; } },
    { id: 'haste', label: 'Haste (Spell → Cast Buff)', build() {
      const e = blankEntry('spell');
      e.name = 'Haste'; e.source = 'PHB'; e.tags = ['#Spell', '#Transmutation'];
      e.facets = ['identity', 'delivery', 'lifecycle', 'modifiers'];
      Object.assign(e.delivery, { action: 'Standard', rangeOn: true, range: 'Close (25 ft. + 5 ft./2 levels)', area: 'One creature/level, no two more than 30 ft. apart', saveOn: true, srOn: true, sr: 'Yes (harmless)', diceOn: false, spellOn: true, linkedBuff: true });
      e.delivery.save = { type: 'Fortitude', effect: 'Negates (harmless)', dcMode: 'spell', stat: 'int', flat: 15, spellLevel: 3 };
      e.delivery.spell = { classes: [{ cls: 'Sor/Wiz', lvl: 3 }, { cls: 'Brd', lvl: 3 }], school: 'Transmutation', comps: { V: true, S: true, M: true, F: false, DF: false, XP: false } };
      e.modifiers = [M('atk.all', 1, 'Untyped'), M('ac.dodge', 1, 'Dodge'), M('save.ref', 1, 'Dodge'), M('speed.land', 30, 'Enhancement')];
      e.locks.extraAttack = true;
      Object.assign(e.lifecycle, { duration: 'roundsPerLevel', durValue: 1 });
      return e; } },
    { id: 'pelor', label: 'Pelor & Sun Domain (Deity)', build() {
      const e = blankEntry('deity');
      e.name = 'Pelor, the Shining One'; e.source = 'PHB / Deities and Demigods'; e.tags = ['#Deity', '#Sun'];
      Object.assign(e.grants, { deityAlign: 'NG', favoredWeapon: 'mace_heavy', domains: ['Sun', 'Good', 'Healing', 'Strength'], grantedPower: 'Greater Turning (Sun Domain): once per day, perform a greater turning against undead in place of a regular turning; undead that would be turned are destroyed instead.', grantedUses: '1/day',
        ladder: ['Endure Elements', 'Heat Metal', 'Searing Light', 'Fire Shield', 'Flame Strike', 'Fire Seeds', 'Sunbeam', 'Sunburst', 'Prismatic Sphere'] });
      return e; } }
  ];

  function applyPattern(p, pat) {
    const start = Math.max(1, num(pat.start, 1)), every = Math.max(1, num(pat.every, 1));
    const m = String(pat.scale || '').match(/^\+?(\d+)(d\d+)?$/i);
    let step = 0;
    for (let L = start; L <= p.maxLevel; L += every) {
      step++;
      let label = pat.name;
      if (m) label += ' +' + (num(m[1], 1) * step) + (m[2] || '');
      const row = p.levels[L - 1];
      row.features = row.features.filter((f) => f.indexOf(pat.name) !== 0);
      row.features.push(label);
    }
  }

  // --------------------------------------------------------------------------
  // 4. Test character (Valerius) & app state
  // --------------------------------------------------------------------------
  function baseCharacter() {
    const w = blankChassis('weapon', 'longsword'); w.material = 'masterwork';
    const a = blankChassis('armor', 'chain_shirt'); a.enhancement = 1;
    return {
      name: 'Valerius', classLine: 'Human Fighter 6 / Wizard 4', level: 10, alignment: 'NG', classes: [{ name: 'Fighter', level: 6 }, { name: 'Wizard', level: 4 }],
      abil: { str: 16, dex: 14, con: 14, int: 16, wis: 10, cha: 8 },
      bab: 8, baseSaves: { fort: 6, ref: 3, will: 6 }, casterLevel: 4, hpBase: 52, hp: 72, gold: 60000,
      ranks: { 'skill.climb': 9, 'skill.jump': 9, 'skill.intimidate': 5, 'skill.ride': 4, 'skill.concentration': 7, 'skill.spellcraft': 7, 'skill.knowledge': 7, 'skill.tumble': 2, 'skill.spot': 3 },
      feats: ['power_attack', 'cleave', 'dodge', 'mobility', 'weapon_focus', 'weapon_specialization', 'combat_expertise', 'improved_initiative', 'scribe_scroll', 'combat_casting', 'spell_focus_illusion'],
      weapon: { name: 'Masterwork Longsword', chassis: w },
      armor: { name: '+1 Chain Shirt', chassis: a },
      gear: [
        { id: 'ring_prot', name: 'Ring of Protection +2', on: true, mods: [M('ac.deflection', 2, 'Deflection')] },
        { id: 'amulet_na', name: 'Amulet of Natural Armor +1', on: true, mods: [M('ac.natural', 1, 'Natural Armor Enhancement')] },
        { id: 'cloak_res', name: 'Cloak of Resistance +2', on: true, mods: [M('save.all', 2, 'Resistance')] },
        { id: 'belt_str', name: 'Belt of Giant Strength +4', on: true, mods: [M('str', 4, 'Enhancement')] }
      ]
    };
  }

  const LS_KEY = 'forgeSandbox.v1';
  function loadLS() { try { return JSON.parse(window.localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveLS() {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify({ customBlueprints: S.customBlueprints, livingTags: S.livingTags, customBonusTypes: S.customBonusTypes })); } catch (e) { /* storage unavailable on some file:// contexts */ }
  }
  const persisted = loadLS();

  const S = {
    entry: blankEntry('weapon'),
    activePreset: '',
    activeBlueprint: 'weapon',
    customBlueprints: Array.isArray(persisted.customBlueprints) ? persisted.customBlueprints : [],
    livingTags: Array.isArray(persisted.livingTags) ? persisted.livingTags : ['#FighterBonus', '#WizardBonus', '#Metamagic', '#ItemCreation', '#General', '#ShadowcastPool'],
    customBonusTypes: Array.isArray(persisted.customBonusTypes) ? persisted.customBonusTypes : [],
    char: baseCharacter(),
    effects: [],
    round: 1,
    flatFooted: false,
    log: ['Round 1 — Valerius enters the Test Bench.'],
    ui: { facetOpen: {}, cardOpen: {}, sheetOpen: {}, effectOpen: {}, jsonOpen: false, attachOpen: false, enchSearch: '', buyMode: 'give', sheetMobile: false, newBpName: '', bpSaveOpen: false, customTypeOpen: false, customType: { name: '', stacks: false, lostFF: false }, tagDraft: '', editingEffect: '', dmgDraft: { count: 1, die: 'd6', type: 'Fire', crit: 'normal' } }
  };
  S.entry.name = '';

  // --------------------------------------------------------------------------
  // 5. Rule engine (sandbox-local, deterministic, explicit-schema only)
  // --------------------------------------------------------------------------
  function btInfo(type) {
    const b = BONUS_TYPES.find((x) => x.id === type) || S.customBonusTypes.find((x) => x.id === type);
    return b || { id: type, stacks: false };
  }
  function allBonusTypes() { return BONUS_TYPES.concat(S.customBonusTypes.map((c) => Object.assign({ custom: true }, c))); }

  function aggregate(list, opts) {
    opts = opts || {};
    const out = list.map((p) => Object.assign({}, p, { suppressed: false, reason: '' }));
    let total = 0;
    const groups = {};
    out.forEach((p) => {
      const info = btInfo(p.type);
      if (p.type === 'Base') { total += p.value; return; }
      if (opts.touch && info.noTouch) { p.suppressed = true; p.reason = 'Not vs Touch'; return; }
      if (opts.ff && info.lostFF && p.value > 0) { p.suppressed = true; p.reason = 'Lost (Flat-Footed)'; return; }
      if (p.value < 0 || info.stacks) { total += p.value; return; }
      (groups[p.type] = groups[p.type] || []).push(p);
    });
    Object.keys(groups).forEach((t) => {
      const g = groups[t].sort((a, b) => b.value - a.value);
      const info = btInfo(t);
      let best = g[0].value;
      if (info.cap && best > info.cap) { best = info.cap; g[0].reason = 'Capped at +' + info.cap; }
      total += best;
      g.slice(1).forEach((p) => { p.suppressed = true; p.reason = 'Suppressed: ' + t + ' bonuses do not stack'; });
    });
    return { total: total, parts: out };
  }

  const baseName = (b) => String((b && b.name) || '').replace(/\s*\(.*\)$/, '');
  function enchApplies(e, kind) { return e.on === kind || (e.on === 'armor+shield' && kind !== 'weapon'); }
  function crystalApplies(c, kind) { return c.on === kind || (c.on === 'armor+shield' && kind !== 'weapon'); }
  function partText(p) {
    const d = p.die === 'flat' ? String(num(p.count)) : num(p.count, 1) + p.die;
    const crit = p.crit === 'onCritOnly' ? ' (On Crit Only)' : p.crit === 'multiply' ? ' (×Crit)' : '';
    return d + ' ' + p.type + crit + (p.cond ? ' [' + p.cond + ']' : '');
  }

  function chassisView(ch) {
    const isW = ch.kind === 'weapon';
    const base = isW ? (WEAPONS.find((x) => x.id === ch.baseId) || WEAPONS[5]) : (ARMORS.find((x) => x.id === ch.baseId) || ARMORS[3]);
    const kind = isW ? 'weapon' : base.kind;
    const enh = Math.max(0, Math.min(5, num(ch.enhancement)));
    const warnings = [], badges = [], mods = [], dr = [], energy = [];
    let sr = 0, extraAttack = false;
    const enchs = (ch.enchantments || []).map((id) => ENCH_BY_ID[id]).filter(Boolean);
    let plusSum = 0, flatGp = 0;
    enchs.forEach((e) => {
      if (!enchApplies(e, kind)) warnings.push(e.name + ' cannot be applied to a ' + kind);
      plusSum += e.plus || 0; flatGp += e.gp || 0;
    });
    const effective = enh + plusSum;
    if (enchs.some((e) => e.plus) && enh < 1) warnings.push('Prerequisites Not Met: special abilities require at least a +1 enhancement bonus');
    if (effective > 10) warnings.push('Effective enhancement +' + effective + ' exceeds the +10 cap');
    const mat = ch.material;
    const mwIncluded = ['mithral', 'adamantine', 'darkwood'].indexOf(mat) >= 0 || (isW && base.id === 'katana');
    const isMW = mat === 'masterwork' || mwIncluded || enh > 0;
    if (mat === 'darkwood' && !base.wooden) warnings.push('Darkwood applies only to wooden items');
    if (mat === 'mithral' && isW && !/Slashing|Piercing|Bludgeoning/.test(ch.weapon.dmgType)) warnings.push('Mithral requires a metal item');

    // Gold piece value (DMG pricing)
    const gpRows = [['Base ' + baseName(base), base.cost]];
    if (isMW && !mwIncluded) gpRows.push(['Masterwork', isW ? 300 : 150]);
    if (isW) {
      if (mat === 'mithral') gpRows.push(['Mithral (+500 gp/lb.)', 500 * base.weight]);
      if (mat === 'adamantine') gpRows.push(['Adamantine', 3000]);
      if (mat === 'cold_iron') { gpRows.push(['Cold Iron (double base)', base.cost]); if (enh > 0) gpRows.push(['Cold Iron enchant surcharge', 2000]); }
      if (mat === 'alchemical_silver') gpRows.push(['Alchemical Silver', base.handed === 'Light' ? 20 : base.handed === 'Two-Handed' ? 180 : 90]);
      if (mat === 'darkwood') gpRows.push(['Darkwood (+10 gp/lb.)', 10 * base.weight]);
    } else {
      const cat = base.type;
      if (mat === 'mithral') gpRows.push(['Mithral', cat === 'Light' ? 1000 : cat === 'Medium' ? 4000 : cat === 'Heavy' ? 9000 : 1000]);
      if (mat === 'adamantine') gpRows.push(['Adamantine', cat === 'Medium' ? 10000 : cat === 'Heavy' ? 15000 : 5000]);
      if (mat === 'darkwood') gpRows.push(['Darkwood (+10 gp/lb.)', 10 * base.weight]);
      if (mat === 'cold_iron') gpRows.push(['Cold Iron (double base)', base.cost]);
      if (mat === 'alchemical_silver') gpRows.push(['Alchemical Silver', 90]);
    }
    if (effective > 0) gpRows.push(['Enhancement (+' + effective + ' effective)', effective * effective * (isW ? 2000 : 1000)]);
    enchs.filter((e) => e.gp).forEach((e) => gpRows.push([e.name, e.gp]));

    // Augment crystal
    let crystal = null;
    const c = CRYSTAL_BY_ID[ch.crystal && ch.crystal.id];
    if (c) {
      const ti = Math.max(0, CRYSTAL_TIERS.indexOf(ch.crystal.tier));
      const tier = CRYSTAL_TIERS[ti];
      crystal = { c: c, ti: ti, tier: tier, text: c.tiers[ti] };
      gpRows.push([c.name + ' (' + tier + ')', c.cost[ti]]);
      if (!crystalApplies(c, kind)) warnings.push(c.name + ' does not fit a ' + kind);
      if (tier === 'least' && !isMW) warnings.push('Prerequisites Not Met: Least crystal requires a masterwork item');
      if (enh < CRYSTAL_REQ[tier]) warnings.push('Prerequisites Not Met: ' + tier[0].toUpperCase() + tier.slice(1) + ' crystal requires +' + CRYSTAL_REQ[tier] + ' enhancement');
      badges.push('💎 ' + c.name + ': ' + c.tiers[ti]);
      if (c.mods && c.mods[ti]) c.mods[ti].forEach((m) => mods.push(Object.assign({}, m, { source: c.name })));
      if (c.dr) dr.push({ value: c.dr[ti], bypass: '-', source: c.name });
    }
    const gpTotal = gpRows.reduce((a, r) => a + r[1], 0);
    const view = { isW: isW, kind: kind, base: base, enh: enh, plusSum: plusSum, effective: effective, gpRows: gpRows, gpTotal: gpTotal, warnings: warnings, badges: badges, mods: mods, dr: dr, energy: energy, crystal: crystal, isMW: isMW, enchs: enchs };

    if (isW) {
      const w = ch.weapon;
      const keen = enchs.some((e) => e.effect.keen);
      if (keen && !/Slashing|Piercing/.test(w.dmgType)) warnings.push('Keen requires a Slashing or Piercing weapon');
      const size = Math.max(1, 21 - num(w.critRange, 20));
      const low = 21 - size * (keen ? 2 : 1);
      const mult = Math.max(2, num(w.critMult, 2));
      const parts = [{ count: 1, die: w.dice, type: w.dmgType, crit: 'multiply', source: 'Base', raw: true }];
      enchs.forEach((e) => (e.effect.parts || []).forEach((p) => {
        const count = p.perMult ? p.count * (mult - 1) : p.count;
        parts.push(Object.assign({}, p, { count: count, source: e.name }));
      }));
      if (crystal && crystal.c.parts) {
        const cp = crystal.c.parts[crystal.ti];
        if (cp[0] === 0) parts.push({ count: num(cp[1]), die: 'flat', type: crystal.c.ptype, crit: 'normal', source: crystal.c.name, cond: crystal.c.cond || '' });
        else parts.push({ count: cp[0], die: cp[1], type: crystal.c.ptype, crit: 'normal', source: crystal.c.name, cond: crystal.c.cond || '' });
      }
      (ch.damageParts || []).forEach((p) => parts.push(Object.assign({ source: 'Custom' }, p)));
      enchs.forEach((e) => { if (e.effect.badge) badges.push('⚔️ ' + e.effect.badge); if (e.id === 'speed') extraAttack = true; });
      const ranged = /bow/.test(base.id);
      const atkT = ranged ? 'atk.ranged' : 'atk.melee', dmgT = ranged ? 'dmg.ranged' : 'dmg.melee';
      if (enh > 0) { mods.push({ target: atkT, value: enh, type: 'Enhancement', source: 'Weapon +' + enh }); mods.push({ target: dmgT, value: enh, type: 'Enhancement', source: 'Weapon +' + enh }); }
      else if (isMW) mods.push({ target: atkT, value: 1, type: 'Enhancement', source: 'Masterwork' });
      if (mat === 'alchemical_silver') mods.push({ target: dmgT, value: -1, type: 'Penalty', source: 'Alchemical Silver' });
      if (mat === 'adamantine') badges.push('⚔️ Bypasses DR/adamantine & hardness < 20');
      if (mat === 'cold_iron') badges.push('⚔️ Bypasses DR/cold iron');
      if (mat === 'alchemical_silver') badges.push('⚔️ Bypasses DR/silver');
      Object.assign(view, { dice: w.dice, critLow: low, critMult: mult, keen: keen, parts: parts, ranged: ranged, handed: w.handed, dmgType: w.dmgType, extraAttack: extraAttack,
        critText: (low < 20 ? low + '–20' : '20') + '/×' + mult, rangeText: w.rangeOn && num(w.range) > 0 ? num(w.range) + ' ft.' : '' });
    } else {
      const a = ch.armor;
      let type = a.type, maxDex = num(a.maxDex, 99), acp = num(a.acp), asf = num(a.asf), speed = num(a.speed, 30);
      if (isMW && mat !== 'mithral' && mat !== 'darkwood') acp = Math.min(0, acp + 1);
      if (mat === 'mithral') {
        acp = Math.min(0, acp + 3); asf = Math.max(0, asf - 10);
        if (maxDex < 99) maxDex += 2;
        if (type === 'Heavy') type = 'Medium'; else if (type === 'Medium') type = 'Light';
      }
      if (mat === 'darkwood' && kind === 'shield') acp = Math.min(0, acp + 2);
      if (type === 'Light' || kind === 'shield') speed = 30;
      if (mat === 'adamantine' && kind === 'armor') dr.push({ value: a.type === 'Heavy' ? 3 : a.type === 'Medium' ? 2 : 1, bypass: '-', source: 'Adamantine' });
      enchs.forEach((e) => {
        if (e.effect.mods) e.effect.mods.forEach((m) => mods.push(Object.assign({}, m, { source: e.name })));
        if (e.effect.badge) badges.push('🛡️ ' + e.effect.badge);
        if (e.effect.sr) sr = Math.max(sr, e.effect.sr);
        if (e.effect.dr) dr.push(Object.assign({ source: e.name }, e.effect.dr));
        if (e.effect.energy) energy.push(Object.assign({ source: e.name }, e.effect.energy));
      });
      const isShield = kind === 'shield';
      mods.push({ target: isShield ? 'ac.shield' : 'ac.armor', value: num(a.armorBonus), type: isShield ? 'Shield' : 'Armor', source: baseName(base) });
      if (enh > 0) mods.push({ target: isShield ? 'ac.shield' : 'ac.armor', value: enh, type: isShield ? 'Shield Enhancement' : 'Armor Enhancement', source: (isShield ? 'Shield' : 'Armor') + ' +' + enh });
      Object.assign(view, { armor: { type: type, armorBonus: num(a.armorBonus), maxDex: maxDex, acp: acp, asf: asf, speed: speed }, sr: sr });
    }
    view.sr = view.sr || sr;
    view.name = synthChassisName(ch, view);
    return view;
  }

  function synthChassisName(ch, v) {
    const parts = [];
    if (v.enh > 0) parts.push('+' + v.enh);
    v.enchs.forEach((e) => parts.push(e.name));
    const matName = (MATERIALS.find((m) => m.id === ch.material) || {}).name;
    if (ch.material === 'masterwork') { if (!v.enh) parts.push('Masterwork'); }
    else if (ch.material !== 'standard') parts.push(matName);
    parts.push(baseName(v.base).replace(/^Shield, (.*)$/, '$1 Shield'));
    let n = parts.join(' ');
    if (v.crystal) n += ' + ' + v.crystal.tier[0].toUpperCase() + v.crystal.tier.slice(1) + ' ' + v.crystal.c.name;
    return n;
  }

  function entryName(en) {
    if (en.name && en.name.trim()) return en.name.trim();
    if (en.facets.indexOf('chassis') >= 0) return chassisView(en.chassis).name;
    return 'Untitled ' + ((BP_BY_ID[en.blueprint] || {}).name || 'Creation');
  }

  const classBAB = (prog, L) => (prog === 'full' ? L : prog === '3/4' ? Math.floor(L * 3 / 4) : Math.floor(L / 2));
  const goodSave = (L) => (L > 0 ? 2 + Math.floor(L / 2) : 0);
  const poorSave = (L) => Math.floor(L / 3);

  function evalFormula(f, value, ctx) {
    switch (f) {
      case '@level': return ctx.level;
      case 'floor(@level/2)': return Math.floor(ctx.level / 2);
      case '@cl': return ctx.cl;
      case '@strMod': case '@dexMod': case '@conMod': case '@intMod': case '@wisMod': case '@chaMod': return ctx[f.slice(1, 4) + 'Mod'];
      default: return num(value);
    }
  }

  function alignMatch(req, al) {
    if (ALIGNS.indexOf(req) >= 0) return req === al;
    const law = al[0] === 'L', cha = al[0] === 'C', good = al.slice(-1) === 'G', evil = al.slice(-1) === 'E';
    const neutral = al === 'N' || al[0] === 'N' || al.slice(-1) === 'N';
    switch (req) {
      case 'Any Good': return good; case 'Any Evil': return evil; case 'Any Lawful': return law; case 'Any Chaotic': return cha;
      case 'Any Non-Good': return !good; case 'Any Non-Evil': return !evil; case 'Any Non-Lawful': return !law; case 'Any Non-Chaotic': return !cha;
      case 'Any Neutral': return neutral; default: return false;
    }
  }

  // Cleric 1-step rule: same alignment, or exactly one step on ONE axis
  // ALIGNS is row-major [LG NG CG / LN N CN / LE NE CE]: column = law-chaos axis, row = good-evil axis
  function alignAxes(a) { const i = ALIGNS.indexOf(a); return [i % 3, Math.floor(i / 3)]; }
  function clericLegal(deity, al) {
    const d = alignAxes(deity), c = alignAxes(al);
    const dx = Math.abs(d[0] - c[0]), dy = Math.abs(d[1] - c[1]);
    return (dx + dy) <= 1;
  }

  function derive(effects) {
    const c = S.char;
    const raw = [];
    const subs = [];
    const locks = { loseDex: false, flatFooted: false, cannotAct: false, blinded: false, entangled: false, negLevel: false, extraAttack: false };
    let negLevels = 0;
    const drs = [], energy = [], badges = [], deities = [], classAdds = [], feats = [];
    let srList = [], conceal = 0;
    let weapon = { label: c.weapon.name, chassis: c.weapon.chassis, source: 'Base Gear' };
    let armor = { label: c.armor.name, chassis: c.armor.chassis, source: 'Base Gear' };
    let shield = null;
    c.feats.forEach((id) => { const f = FEATS.find((x) => x.id === id); if (f) feats.push({ name: f.name, tags: f.tags }); });
    c.gear.forEach((g) => { if (g.on) g.mods.forEach((m) => raw.push(Object.assign({}, m, { source: g.name }))); });

    effects.filter((e) => e.on).forEach((ef) => {
      const en = ef.entry, F = en.facets, st = Math.max(1, num(ef.stacks, 1));
      const label = entryName(en) + (st > 1 ? ' ×' + st : '');
      if (F.indexOf('identity') >= 0 && en.blueprint === 'feat') feats.push({ name: entryName(en), tags: en.tags || [] });
      if (F.indexOf('chassis') >= 0) {
        const k = en.chassis.kind === 'weapon' ? 'weapon' : (ARMORS.find((a) => a.id === en.chassis.baseId) || {}).kind;
        if (k === 'weapon') weapon = { label: label, chassis: en.chassis, source: label };
        else if (k === 'shield') shield = { label: label, chassis: en.chassis, source: label };
        else armor = { label: label, chassis: en.chassis, source: label };
      }
      if (F.indexOf('modifiers') >= 0) {
        en.modifiers.forEach((m) => raw.push(Object.assign({}, m, { stackMul: st, source: label })));
        (en.substitutions || []).forEach((s) => subs.push(Object.assign({ source: label }, s)));
        Object.keys(locks).forEach((k) => { if (en.locks[k]) locks[k] = true; });
        if (en.locks.negLevel) negLevels += st;
      }
      if (F.indexOf('defenses') >= 0) {
        const d = en.defenses;
        d.dr.forEach((x) => drs.push({ value: num(x.value), bypass: x.bypass, source: label }));
        d.energy.forEach((x) => energy.push({ type: x.type, mode: x.mode || 'Resistance', value: num(x.value), source: label }));
        if (d.srOn) srList.push({ value: d.sr.mode === 'level' ? 10 + c.level : num(d.sr.value), source: label });
        if (num(d.concealment) > conceal) conceal = num(d.concealment);
        if (d.reactionOn && d.reaction) badges.push('⚡ Reaction: ' + d.reaction + ' (' + label + ')');
      }
      if (F.indexOf('progression') >= 0) {
        const p = en.progression;
        classAdds.push({ name: entryName(en), p: p, L: Math.max(1, Math.min(p.maxLevel, num(p.testLevel, 1))) });
      }
      if (F.indexOf('grants') >= 0 && (en.blueprint === 'deity' || en.grants.domains.length)) deities.push(en);
    });

    // Gear chassis
    const wv = chassisView(weapon.chassis), av = chassisView(armor.chassis), sv = shield ? chassisView(shield.chassis) : null;
    [[wv, weapon], [av, armor], [sv, shield]].forEach((pair) => {
      const v = pair[0]; if (!v) return;
      v.mods.forEach((m) => raw.push(Object.assign({}, m, { source: m.source + ' (' + pair[1].label + ')' })));
      v.badges.forEach((b) => badges.push(b));
      v.dr.forEach((d) => drs.push(d));
      v.energy.forEach((x) => energy.push({ type: x.type, mode: 'Resistance', value: x.value, source: x.source }));
      if (v.sr) srList.push({ value: v.sr, source: pair[1].label });
      if (v.extraAttack) locks.extraAttack = true;
    });

    if (negLevels > 0) ['atk.all', 'save.all', 'skill.all', 'casterLevel'].forEach((t) => raw.push({ target: t, value: -negLevels, type: 'Penalty', source: 'Negative Levels ×' + negLevels }));
    if (locks.entangled) { raw.push({ target: 'atk.all', value: -2, type: 'Penalty', source: 'Entangled' }); raw.push({ target: 'dex', value: -4, type: 'Penalty', source: 'Entangled' }); }
    if (locks.blinded) raw.push({ target: 'ac.total', value: -2, type: 'Penalty', source: 'Blinded' });

    // Class level additions
    let addLevel = 0, addBAB = 0, addCL = 0, addHD = 0;
    const addSave = { fort: 0, ref: 0, will: 0 };
    classAdds.forEach((ca) => {
      addLevel += ca.L; addBAB += classBAB(ca.p.bab, ca.L);
      ['fort', 'ref', 'will'].forEach((s) => { addSave[s] += ca.p.good[s] ? goodSave(ca.L) : poorSave(ca.L); });
      addCL += ca.p.levels.slice(0, ca.L).filter((l) => l.spell).length;
      addHD += ca.L * (Math.floor(num(ca.p.hitDie, 8) / 2) + 1);
    });
    const level = c.level + addLevel;

    // Pass 1: abilities with flat-only mods (formula context)
    const pre = {};
    ABIL_KEYS.forEach((k) => { pre[k] = c.abil[k] + aggregate(raw.filter((m) => m.target === k && (m.formula || 'flat') === 'flat' && !m.condition).map((m) => ({ value: num(m.value) * (m.stackMul || 1), type: m.type }))).total; });
    const ctx = { level: level, cl: c.casterLevel + addCL };
    ABIL_KEYS.forEach((k) => { ctx[k + 'Mod'] = mod(pre[k]); });

    const resolved = raw.map((m) => Object.assign({}, m, { value: evalFormula(m.formula || 'flat', m.value, ctx) * (m.stackMul || 1) }));
    const conditional = resolved.filter((m) => m.condition);
    const active = resolved.filter((m) => !m.condition);
    const pool = (t) => active.filter((m) => m.target === t).map((m) => ({ value: m.value, type: m.type || 'Untyped', source: m.source, target: m.target }));

    const abil = {};
    ABIL_KEYS.forEach((k) => {
      const ag = aggregate([{ value: c.abil[k], type: 'Base', source: 'Base Score' }].concat(pool(k)));
      abil[k] = { score: ag.total, mod: mod(ag.total), parts: ag.parts };
    });
    const M_ = (k) => abil[k].mod;

    // Armor Class
    const remap = { 'ac.armor': ['Armor', { Enhancement: 'Armor Enhancement' }], 'ac.shield': ['Shield', { Enhancement: 'Shield Enhancement' }], 'ac.natural': ['Natural Armor', { Enhancement: 'Natural Armor Enhancement' }], 'ac.deflection': ['Deflection', {}], 'ac.dodge': ['Dodge', {}] };
    const acPool = [];
    ['ac.total', 'ac.armor', 'ac.shield', 'ac.natural', 'ac.deflection', 'ac.dodge'].forEach((t) => pool(t).forEach((p) => {
      let type = p.type;
      if (remap[t]) {
        const r = remap[t];
        if (r[1][type]) type = r[1][type];          // e.g. Enhancement on ac.armor -> Armor Enhancement
        else if (type === 'Untyped') type = r[0];   // untyped on a typed AC slot inherits the slot type
      }
      acPool.push(Object.assign({}, p, { type: type }));
    }));
    const ffNow = S.flatFooted || locks.flatFooted;
    const loseDex = ffNow || locks.loseDex || locks.blinded || locks.cannotAct;
    const maxDexCap = Math.min(av.armor ? av.armor.maxDex : 99, sv && sv.armor ? sv.armor.maxDex : 99);
    const dexMod = M_('dex');
    const dexCapped = Math.min(dexMod, maxDexCap);
    const dexAC = loseDex ? Math.min(0, dexMod) : dexCapped;
    const dexPart = { value: dexAC, type: 'Base', source: 'DEX modifier' + (maxDexCap < 99 ? ' (Max Dex ' + sgn(maxDexCap) + ')' : '') + (loseDex && dexMod > 0 ? ' — lost' : '') };
    const baseAC = { value: 10, type: 'Base', source: 'Base' };
    const acMain = aggregate([baseAC, dexPart].concat(acPool), { ff: loseDex });
    const acTouch = aggregate([baseAC, dexPart].concat(acPool, pool('ac.touch')), { touch: true, ff: loseDex });
    const acFF = aggregate([baseAC, { value: Math.min(0, dexMod), type: 'Base', source: 'DEX (denied)' }].concat(acPool, pool('ac.flatFooted')), { ff: true });

    // Saves
    const saves = {};
    const saveAb = { fort: 'con', ref: 'dex', will: 'wis' };
    ['fort', 'ref', 'will'].forEach((s) => {
      let ab = saveAb[s], abVal = M_(ab), abLabel = ab.toUpperCase();
      subs.filter((x) => x.save === s).forEach((x) => {
        const v = M_(x.to);
        if (x.op === 'replace') { abVal = v; abLabel = x.to.toUpperCase() + ' (replaces ' + ab.toUpperCase() + ')'; }
        else if (v > abVal) { abVal = v; abLabel = x.to.toUpperCase() + ' (max)'; }
      });
      const parts = [{ value: c.baseSaves[s] + addSave[s], type: 'Base', source: 'Base Save' }, { value: abVal, type: 'Base', source: abLabel + ' modifier' }]
        .concat(pool('save.' + s), pool('save.all'));
      saves[s] = aggregate(parts);
    });

    const bab = c.bab + addBAB;
    const twoH = wv.handed === 'Two-Handed';
    const strDmg = twoH ? Math.floor(M_('str') * 1.5) : M_('str');
    const melee = aggregate([{ value: bab, type: 'Base', source: 'Base Attack Bonus' }, { value: M_('str'), type: 'Base', source: 'STR modifier' }].concat(pool('atk.melee'), pool('atk.all')));
    const ranged = aggregate([{ value: bab, type: 'Base', source: 'Base Attack Bonus' }, { value: M_('dex'), type: 'Base', source: 'DEX modifier' }].concat(pool('atk.ranged'), pool('atk.all')));
    const dmgM = aggregate([{ value: strDmg, type: 'Base', source: 'STR modifier' + (twoH ? ' ×1.5' : '') }].concat(pool('dmg.melee'), pool('dmg.all')));
    const dmgR = aggregate([{ value: 0, type: 'Base', source: 'Ranged' }].concat(pool('dmg.ranged'), pool('dmg.all')));
    const grapple = aggregate([{ value: bab, type: 'Base', source: 'Base Attack Bonus' }, { value: M_('str'), type: 'Base', source: 'STR modifier' }].concat(pool('grapple')));
    const init = aggregate([{ value: dexMod, type: 'Base', source: 'DEX modifier' }].concat(pool('initiative')));
    const armorSpeed = av.armor ? av.armor.speed : 30;
    const speed = aggregate([{ value: armorSpeed, type: 'Base', source: 'Base Speed' + (armorSpeed < 30 ? ' (armor)' : '') }].concat(pool('speed.land')));
    const cl = aggregate([{ value: c.casterLevel, type: 'Base', source: 'Wizard 4' }].concat(addCL ? [{ value: addCL, type: 'Base', source: '+1 Existing Spellcasting Class' }] : [], pool('casterLevel')));
    const acp = (av.armor ? av.armor.acp : 0) + (sv && sv.armor ? sv.armor.acp : 0);
    const asf = (av.armor ? av.armor.asf : 0) + (sv && sv.armor ? sv.armor.asf : 0);
    const temp = aggregate(pool('hp.temp'));
    const conDelta = (M_('con') - mod(c.abil.con)) * level;
    const hpMax = Math.max(1, c.hpBase + mod(c.abil.con) * c.level + conDelta + addHD + M_('con') * addLevel - 5 * negLevels);

    // Skills
    const skills = [];
    SKILLS.forEach((s) => {
      const key = skillKey(s[0]);
      const ranks = num(c.ranks[key]);
      const specific = pool(key);
      if (!ranks && !specific.length) return;
      const parts = [{ value: ranks, type: 'Base', source: 'Ranks' }, { value: M_(s[1]), type: 'Base', source: s[1].toUpperCase() + ' modifier' }];
      if (s[2] && acp) parts.push({ value: acp * s[2], type: 'Base', source: 'Armor Check Penalty' + (s[2] === 2 ? ' ×2' : '') });
      const ag = aggregate(parts.concat(specific, pool('skill.all')));
      skills.push({ key: key, name: s[0], total: ag.total, parts: ag.parts, ranks: ranks });
    });

    // Defenses
    const drBest = {};
    drs.forEach((d) => { const k = d.bypass || '-'; if (!drBest[k] || drBest[k].value < d.value) drBest[k] = d; });
    const enBest = {};
    energy.forEach((x) => { const k = x.type + ':' + x.mode; if (!enBest[k] || enBest[k].value < x.value) enBest[k] = x; });
    const srBest = srList.reduce((a, b) => (b.value > a ? b.value : a), 0);

    const iter = [];
    const atkTotalForIter = wv.ranged ? ranged.total : melee.total;
    for (let i = 0; i < 4 && (i === 0 || bab - 5 * i > 0); i++) iter.push(sgn(atkTotalForIter - 5 * i));
    if (locks.extraAttack) iter.unshift(sgn(atkTotalForIter));

    const atkMain = wv.ranged ? ranged : melee, dmgMain = wv.ranged ? dmgR : dmgM;
    const extraParts = (wv.parts || []).filter((p) => !p.raw);
    return {
      level: level, abil: abil, bab: bab, ac: { total: acMain.total, touch: acTouch.total, ff: acFF.total, main: acMain, touchAg: acTouch, ffAg: acFF, loseDex: loseDex, ffNow: ffNow },
      saves: saves, melee: melee, ranged: ranged, dmgM: dmgM, dmgR: dmgR, atkMain: atkMain, dmgMain: dmgMain, grapple: grapple, init: init, speed: speed, cl: cl, acp: acp, asf: asf,
      hpMax: hpMax, hp: Math.min(c.hp, hpMax), temp: temp.total, skills: skills, conditional: conditional, locks: locks, negLevels: negLevels,
      dr: Object.keys(drBest).map((k) => drBest[k]), drAll: drs, energy: Object.keys(enBest).map((k) => enBest[k]), sr: srBest, conceal: conceal, badges: badges,
      weapon: { label: weapon.label, view: wv }, armor: { label: armor.label, view: av }, shield: shield ? { label: shield.label, view: sv } : null,
      damageText: wv.dice + (dmgMain.total ? sgn(dmgMain.total) : '') + extraParts.map((p) => ' +' + partText(p)).join(''),
      iter: iter, feats: feats, deities: deities, classAdds: classAdds, alignment: c.alignment, subs: subs
    };
  }

  // Prerequisites
  function evalAlt(a, sh) {
    const c = S.char;
    switch (a.kind) {
      case 'ability': { const v = sh.abil[a.ability].score; return { ok: v >= num(a.min), text: a.ability.toUpperCase() + ' ' + num(a.min), have: v }; }
      case 'bab': return { ok: sh.bab >= num(a.min), text: 'Base Attack Bonus ' + sgn(num(a.min)), have: sgn(sh.bab) };
      case 'skill': { const r = num(c.ranks[a.skill]); return { ok: r >= num(a.min), text: (SKILL_BY_KEY[a.skill] || {}).name + ' ' + num(a.min) + ' ranks', have: r + ' ranks' }; }
      case 'feat': {
        const f = String(a.feat || '').trim();
        if (!f) return { ok: false, text: 'Feat (unset)', have: '—' };
        const ok = f[0] === '#' ? sh.feats.some((x) => (x.tags || []).indexOf(f) >= 0) : sh.feats.some((x) => x.name.toLowerCase() === f.toLowerCase());
        return { ok: ok, text: f[0] === '#' ? 'Any feat from ' + f : f, have: ok ? 'Has' : 'Missing' };
      }
      case 'level': {
        let v = 0, label = '';
        if (a.levelKind === 'casterLevel') { v = sh.cl.total; label = 'Caster Level'; }
        else if (a.levelKind === 'charLevel') { v = sh.level; label = 'Character Level'; }
        else { const k = c.classes.find((x) => x.name.toLowerCase() === String(a.cls || '').toLowerCase()); v = k ? k.level : 0; label = (a.cls || 'Class') + ' Level'; }
        return { ok: v >= num(a.min), text: label + ' ' + num(a.min), have: v };
      }
      case 'alignment': return { ok: alignMatch(a.align, sh.alignment), text: a.align, have: sh.alignment };
      default: return { ok: false, text: '?', have: '' };
    }
  }
  function evalPrereqs(prereqs, sh) {
    const rows = (prereqs || []).map((r) => { const alts = r.alts.map((a) => evalAlt(a, sh)); return { alts: alts, ok: alts.some((x) => x.ok) }; });
    return { rows: rows, ok: rows.every((r) => r.ok), text: rows.map((r) => r.alts.map((a) => a.text).join(' OR ')).join(', ') };
  }

  function saveDC(en, sh) {
    const s = en.delivery.save;
    const stat = sh.abil[s.stat] ? sh.abil[s.stat].mod : 0;
    if (s.dcMode === 'flat') return num(s.flat);
    if (s.dcMode === 'hd') return 10 + Math.floor(sh.level / 2) + stat;
    const lvl = en.delivery.spellOn && en.delivery.spell.classes[0] ? num(en.delivery.spell.classes[0].lvl) : num(s.spellLevel);
    return 10 + lvl + stat;
  }
  function dcFormulaText(en) {
    const s = en.delivery.save;
    if (s.dcMode === 'flat') return 'DC ' + s.flat;
    if (s.dcMode === 'hd') return 'DC 10 + 1/2 HD + ' + s.stat.toUpperCase();
    return 'DC 10 + Spell Level + ' + s.stat.toUpperCase();
  }
  function diceText(en, sh) {
    const d = en.delivery.dice;
    if (d.perCL) { const n = Math.min(num(d.max, 10), sh ? sh.cl.total : 1) * num(d.count, 1); return n + d.die + ' ' + d.type + ' (' + num(d.count, 1) + d.die + '/CL, max ' + num(d.max) * num(d.count, 1) + d.die + ')'; }
    return num(d.count, 1) + d.die + ' ' + d.type;
  }
  function durationRounds(en, sh) {
    const l = en.lifecycle;
    switch (l.duration) {
      case 'rounds': return num(l.durValue, 1);
      case 'roundsPerLevel': return Math.max(1, sh.cl.total * Math.max(1, num(l.durValue, 1)));
      case 'minPerLevel': return Math.max(1, sh.cl.total * 10 * Math.max(1, num(l.durValue, 1)));
      default: return null;
    }
  }
  function durationText(l) {
    return { permanent: 'Permanent / Equipped', rounds: num(l.durValue) + ' rounds', roundsPerLevel: (num(l.durValue) > 1 ? l.durValue + ' rounds' : '1 round') + '/level', minPerLevel: (num(l.durValue) > 1 ? l.durValue + ' min.' : '1 min.') + '/level', saveEnds: 'Save Ends' }[l.duration] || l.duration;
  }
  function usageText(l) {
    return { atwill: 'At-Will', perDay: num(l.perDay) + '/day', charges: num(l.charges) + ' charges', cooldown: 'Recharge ' + l.cooldown + ' rounds' }[l.usage] || l.usage;
  }

  // --------------------------------------------------------------------------
  // 6. Effects (Test Bench)
  // --------------------------------------------------------------------------
  function previewEffect(en) {
    const copy = clone(en);
    // A spell without a Linked Cast Buff only resolves (damage/log); it does not persist modifiers on the sheet
    if (copy.blueprint === 'spell' && copy.facets.indexOf('delivery') >= 0 && !copy.delivery.linkedBuff) copy.facets = copy.facets.filter((f) => f !== 'modifiers' && f !== 'defenses');
    return { uid: '__preview__', entry: copy, on: true, stacks: 1, roundsLeft: null, cooldown: 0 };
  }
  function benchEffects(excludeUid) { return S.effects.filter((e) => e.uid !== excludeUid); }

  function cardSummary(en, sh) {
    const F = en.facets, seg = [];
    if (F.indexOf('chassis') >= 0) {
      const v = chassisView(en.chassis);
      if (v.isW) {
        seg.push((v.ranged ? 'Ranged' : 'Melee') + ', ' + v.handed + (v.rangeText ? ' (Range ' + v.rangeText + ')' : ''));
        const extra = v.parts.filter((p) => !p.raw && p.crit !== 'onCritOnly').map((p) => '+' + (p.die === 'flat' ? p.count : p.count + p.die) + ' ' + p.type + (p.cond ? ' ' + p.cond : ''));
        seg.push(v.dice + (v.enh ? sgn(v.enh) : '') + ' ' + v.dmgType + (extra.length ? ' ' + extra.join(' ') : ''));
        seg.push(v.critText);
        const onCrit = v.parts.filter((p) => p.crit === 'onCritOnly');
        if (onCrit.length) seg.push('On crit: ' + onCrit.map((p) => '+' + p.count + p.die + ' ' + p.type).join(', '));
      } else {
        const a = v.armor;
        seg.push((v.kind === 'shield' ? 'Shield ' : 'Armor ') + sgn(a.armorBonus) + (v.enh ? ' (' + sgn(v.enh) + ' Enh)' : ''));
        seg.push('Max Dex ' + (a.maxDex >= 99 ? '—' : sgn(a.maxDex)));
        seg.push('Armor Check Penalty ' + a.acp);
        seg.push('Arcane Spell Failure ' + a.asf + '%');
        if (v.kind !== 'shield') seg.push(a.type + ', Speed ' + a.speed + ' ft.');
      }
    }
    if (F.indexOf('delivery') >= 0) {
      const d = en.delivery;
      if (d.spellOn) seg.push(d.spell.classes.map((c) => c.cls + ' ' + c.lvl).join(', ') + ' • ' + d.spell.school + ' • ' + Object.keys(d.spell.comps).filter((k) => d.spell.comps[k]).join(', '));
      seg.push(d.action + (d.action === 'Passive' ? '' : ' Action'));
      if (d.rangeOn) seg.push([d.range, d.area].filter(Boolean).join(' • '));
      if (d.diceOn) seg.push(diceText(en, sh));
      if (d.saveOn) seg.push(d.save.type + ' ' + d.save.effect.toLowerCase() + ' DC ' + saveDC(en, sh));
      if (d.srOn) seg.push('SR ' + d.sr);
      if (d.linkedBuff) seg.push('Linked Cast Buff');
    }
    if (F.indexOf('lifecycle') >= 0) {
      const l = en.lifecycle;
      if (l.usage !== 'atwill') seg.push(usageText(l));
      if (l.duration !== 'permanent') seg.push(durationText(l));
      if (l.stackable) seg.push('Stackable ×' + l.maxStacks);
      if (l.ongoingOn) seg.push(l.ongoing.kind === 'dot' ? 'Ongoing ' + l.ongoing.dice + ' ' + l.ongoing.type + '/round' : 'Fast Healing ' + l.ongoing.value);
    }
    if (F.indexOf('modifiers') >= 0 && en.modifiers.length) seg.push(en.modifiers.slice(0, 4).map(modShort).join(', ') + (en.modifiers.length > 4 ? ' …' : ''));
    if (F.indexOf('modifiers') >= 0) { const L = Object.keys(en.locks).filter((k) => en.locks[k]).map((k) => LOCK_LABEL[k].split(' (')[0]); if (L.length) seg.push(L.join(', ')); }
    if (F.indexOf('defenses') >= 0) {
      const d = en.defenses;
      d.dr.forEach((x) => seg.push('DR ' + x.value + '/' + x.bypass));
      d.energy.forEach((x) => seg.push((x.mode || 'Resistance') === 'Resistance' ? 'Resist ' + x.type + ' ' + x.value : x.type + ' ' + x.mode));
      if (d.srOn) seg.push('SR ' + (d.sr.mode === 'level' ? '10 + level' : d.sr.value));
      if (num(d.concealment)) seg.push(d.concealment + '% miss chance');
    }
    if (F.indexOf('progression') >= 0) {
      const p = en.progression;
      seg.push('d' + p.hitDie + ' HD • ' + (p.bab === 'full' ? 'Full' : p.bab) + ' BAB • Good ' + (['fort', 'ref', 'will'].filter((s) => p.good[s]).map((s) => ({ fort: 'Fortitude', ref: 'Reflex', will: 'Will' }[s])).join('/') || 'none') + ' • ' + p.skillPts + ' + Int skill points • ' + p.maxLevel + ' levels');
    }
    if (F.indexOf('grants') >= 0) {
      const g = en.grants;
      if (en.blueprint === 'deity' || g.domains.length) seg.push(ALIGN_NAMES[g.deityAlign] + ' • Favored Weapon: ' + baseName(WEAPONS.find((w) => w.id === g.favoredWeapon)) + (g.domains.length ? ' • Domains: ' + g.domains.join(', ') : ''));
      if (g.featGrants.length) seg.push(g.featGrants.map((x) => 'Bonus Feat ×' + x.count + ' from ' + x.pool).join(', '));
    }
    if (F.indexOf('prereqs') >= 0 && en.prereqs.length) seg.push('Prerequisites: ' + evalPrereqs(en.prereqs, sh).text);
    return seg.filter(Boolean);
  }
  const LOCK_LABEL = {
    loseDex: 'Lose DEX Bonus to AC', flatFooted: 'Flat-Footed', cannotAct: 'Cannot Take Actions (Stunned/Dazed)', blinded: 'Blinded (-2 AC, Lose DEX)',
    entangled: 'Entangled (-2 Atk, -4 DEX)', negLevel: 'Negative Level (-1 Atk/Saves/Checks/CL, -5 HP per stack)', extraAttack: 'Extra Attack on Full Attack (Haste / Speed)'
  };
  function modShort(m) {
    const v = (m.formula || 'flat') === 'flat' ? sgn(num(m.value)) : '+' + m.formula;
    const tl = TARGET_LABEL[m.target] || m.target;
    const showType = m.type !== 'Untyped' && tl.indexOf(m.type) < 0 && m.type.indexOf(tl) < 0;
    return v + ' ' + (showType ? m.type + ' ' : '') + tl + (m.condition ? ' (' + m.condition + ')' : '');
  }

  function collectSuppressed(sh) {
    const out = [];
    const scan = (label, ag) => ag.parts.forEach((p) => { if (p.suppressed) out.push(label + ': ' + sgn(p.value) + ' ' + p.type + ' (' + p.source + ') — ' + p.reason); });
    scan('AC', sh.ac.main); ['fort', 'ref', 'will'].forEach((s) => scan({ fort: 'Fortitude', ref: 'Reflex', will: 'Will' }[s], sh.saves[s]));
    scan('Melee Attack', sh.melee); scan('Melee Damage', sh.dmgM); scan('Caster Level', sh.cl); scan('Speed', sh.speed);
    ABIL_KEYS.forEach((k) => { if (sh.abil[k].parts) scan(k.toUpperCase(), { parts: sh.abil[k].parts }); });
    return out;
  }

  // --------------------------------------------------------------------------
  // 7. Canonical V2.5 JSON export
  // --------------------------------------------------------------------------
  function exportEntry(en) {
    const F = en.facets;
    const out = { schemaVersion: 2.5, id: en.id, blueprint: en.blueprint, name: entryName(en), source: en.source, tags: en.tags.slice(), facets: F.slice() };
    if (en.blueprint === 'feat' || en.repeat.mode !== 'once') out.timesSelectable = en.repeat.mode === 'upto' ? num(en.repeat.n) : en.repeat.mode === 'per' ? 'perWeaponOrSchool' : 1;
    const sh = derive(S.effects);
    if (F.indexOf('prereqs') >= 0) {
      out.prerequisites = { all: en.prereqs.map((r) => ({ anyOf: r.alts.map((a) => cleanAlt(a)) })), text: evalPrereqs(en.prereqs, sh).text };
    }
    if (F.indexOf('chassis') >= 0) {
      const ch = en.chassis, v = chassisView(ch);
      out.baseItemId = ch.baseId; out.material = ch.material; out.enhancementBonus = v.enh; out.enhancements = ch.enchantments.slice();
      if (v.crystal) out.augmentCrystal = { id: v.crystal.c.id, tier: v.crystal.tier };
      out.effectiveEnhancement = v.effective; out.gpValue = v.gpTotal;
      if (v.isW) {
        out.weapon = { category: ch.weapon.category, handedness: ch.weapon.handed, critRange: v.critLow, critMultiplier: v.critMult, rangeIncrement: ch.weapon.rangeOn ? num(ch.weapon.range) : null };
        out.damageParts = v.parts.map((p) => ({ dice: p.die === 'flat' ? null : num(p.count, 1) + p.die, bonus: p.die === 'flat' ? num(p.count) : 0, type: p.type.toLowerCase(), multiplyOnCrit: p.crit === 'multiply', onCritOnly: p.crit === 'onCritOnly', condition: p.cond || null, source: p.source }));
      } else {
        out.armor = { armorType: v.armor.type, armorBonus: v.armor.armorBonus, maxDex: v.armor.maxDex >= 99 ? null : v.armor.maxDex, armorCheckPenalty: v.armor.acp, arcaneSpellFailure: v.armor.asf, speed: v.armor.speed };
      }
      if (v.badges.length) out.tacticalBadges = v.badges.map((b) => b.replace(/^\S+\s/, ''));
    }
    if (F.indexOf('modifiers') >= 0) {
      out.modifiers = en.modifiers.map((m) => { const o = { target: m.target, type: m.type }; if ((m.formula || 'flat') === 'flat') o.value = num(m.value); else o.formula = m.formula; if (m.condition) o.condition = m.condition; return o; });
      if (en.substitutions.length) out.substitutions = en.substitutions.map((s) => ({ target: 'save.' + s.save + '.abilityMod', op: s.op, from: '@' + s.from + 'Mod', source: '@' + s.to + 'Mod' }));
      const flags = Object.keys(en.locks).filter((k) => en.locks[k]);
      if (flags.length) out.ruleFlags = flags;
    }
    if (F.indexOf('delivery') >= 0) {
      const d = en.delivery;
      out.delivery = { action: d.action };
      if (d.rangeOn) Object.assign(out.delivery, { range: d.range, area: d.area || null });
      if (d.saveOn) out.delivery.save = { type: d.save.type, effect: d.save.effect, dc: dcFormulaText(en), dcVsTestSheet: saveDC(en, sh) };
      if (d.srOn) out.delivery.spellResistance = d.sr;
      if (d.diceOn) out.delivery.dice = { count: num(d.dice.count), die: d.dice.die, type: d.dice.type.toLowerCase(), perCasterLevel: d.dice.perCL, max: d.dice.perCL ? num(d.dice.max) : null };
      if (d.spellOn) out.delivery.spell = { classLevels: d.spell.classes.map((c) => ({ class: c.cls, level: num(c.lvl) })), school: d.spell.school, components: Object.keys(d.spell.comps).filter((k) => d.spell.comps[k]) };
      out.delivery.linkedCastBuff = !!d.linkedBuff;
    }
    if (F.indexOf('lifecycle') >= 0) {
      const l = en.lifecycle;
      out.lifecycle = { usage: l.usage, duration: l.duration };
      if (l.usage === 'perDay') out.lifecycle.perDay = num(l.perDay);
      if (l.usage === 'charges') out.lifecycle.charges = num(l.charges);
      if (l.usage === 'cooldown') out.lifecycle.recharge = l.cooldown;
      if (['rounds', 'roundsPerLevel', 'minPerLevel'].indexOf(l.duration) >= 0) out.lifecycle.durationValue = num(l.durValue);
      if (l.stackable) out.lifecycle.maxStacks = num(l.maxStacks);
      if (l.ongoingOn) out.lifecycle.ongoing = l.ongoing.kind === 'dot' ? { kind: 'dot', dice: l.ongoing.dice, type: l.ongoing.type.toLowerCase() } : { kind: 'fastHealing', value: num(l.ongoing.value) };
    }
    if (F.indexOf('defenses') >= 0) {
      const d = en.defenses;
      out.defenses = { dr: d.dr.map((x) => ({ value: num(x.value), bypass: x.bypass })), energy: d.energy.map((x) => ({ type: x.type.toLowerCase(), mode: (x.mode || 'Resistance').toLowerCase(), value: num(x.value) })) };
      if (d.srOn) out.defenses.spellResistance = d.sr.mode === 'level' ? { formula: '10 + @level' } : { value: num(d.sr.value) };
      if (num(d.concealment)) out.defenses.missChance = num(d.concealment);
      if (d.reactionOn) out.defenses.reaction = d.reaction;
    }
    if (F.indexOf('progression') >= 0) {
      const p = en.progression;
      out.progression = { mode: p.mode, maxLevel: p.maxLevel, hitDie: 'd' + p.hitDie, bab: p.bab, goodSaves: ['fort', 'ref', 'will'].filter((s) => p.good[s]), skillPointsPerLevel: num(p.skillPts),
        levels: p.levels.slice(0, p.maxLevel).map((l, i) => ({ level: i + 1, bab: classBAB(p.bab, i + 1), fort: p.good.fort ? goodSave(i + 1) : poorSave(i + 1), ref: p.good.ref ? goodSave(i + 1) : poorSave(i + 1), will: p.good.will ? goodSave(i + 1) : poorSave(i + 1), features: l.features.slice(), spellcasting: l.spell ? '+1 level of existing spellcasting class' : null })) };
    }
    if (F.indexOf('grants') >= 0) {
      const g = en.grants;
      out.grants = { alignment: g.deityAlign, clericAlignments: ALIGNS.filter((a) => clericLegal(g.deityAlign, a)), favoredWeapon: g.favoredWeapon, domains: g.domains.slice(), grantedPower: g.grantedPower ? { text: g.grantedPower, uses: g.grantedUses } : null,
        spellLadder: g.ladder.map((s, i) => ({ level: i + 1, spell: s || null })).filter((x) => x.spell), bonusFeats: g.featGrants.map((x) => ({ count: num(x.count), pool: x.pool, level: num(x.level) })) };
    }
    return out;
  }
  function cleanAlt(a) {
    switch (a.kind) {
      case 'ability': return { kind: 'ability', ability: a.ability, min: num(a.min) };
      case 'bab': return { kind: 'bab', min: num(a.min) };
      case 'skill': return { kind: 'skill', skill: a.skill, ranks: num(a.min) };
      case 'feat': return a.feat && a.feat[0] === '#' ? { kind: 'tagPool', tag: a.feat } : { kind: 'feat', name: a.feat };
      case 'level': return { kind: a.levelKind, className: a.levelKind === 'classLevel' ? a.cls : undefined, min: num(a.min) };
      case 'alignment': return { kind: 'alignment', value: a.align };
      default: return a;
    }
  }

  // --------------------------------------------------------------------------
  // 8. Form helpers (data-bind => S.entry path, data-cbind => S.char, data-uibind => S.ui)
  // --------------------------------------------------------------------------
  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
  function setPath(obj, path, val) {
    const ks = path.split('.'); let o = obj;
    for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = val;
  }
  const bindAttr = (scope) => (scope === 'char' ? 'data-cbind' : scope === 'ui' ? 'data-uibind' : 'data-bind');
  function inp(path, val, o) {
    o = o || {};
    return '<input class="fs-in' + (o.narrow ? ' fs-narrow' : '') + '" ' + bindAttr(o.scope) + '="' + path + '"' + (o.num ? ' data-t="num" type="number"' : ' type="text"') +
      (o.min != null ? ' min="' + o.min + '"' : '') + (o.max != null ? ' max="' + o.max + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') +
      (o.style ? ' style="' + o.style + '"' : '') + (o.enter ? ' data-enter="' + o.enter + '"' : '') + (o.extra || '') + ' value="' + esc(val) + '">';
  }
  function opts(list, val) {
    return list.map((x) => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('');
  }
  function sel(path, val, list, o) {
    o = o || {};
    return '<select class="fs-sel' + (o.narrow ? ' fs-narrow' : '') + '" ' + bindAttr(o.scope) + '="' + path + '"' + (o.num ? ' data-t="num"' : '') + (o.style ? ' style="' + o.style + '"' : '') + '>' + opts(list, val) + '</select>';
  }
  function selGroups(path, val, groups, o) {
    o = o || {};
    return '<select class="fs-sel" ' + bindAttr(o.scope) + '="' + path + '">' + groups.map((g) => '<optgroup label="' + esc(g[0]) + '">' + opts(g[1], val) + '</optgroup>').join('') + '</select>';
  }
  function chk(path, val, label, o) {
    o = o || {};
    return '<label class="fs-check' + (val ? ' on' : '') + '"><input type="checkbox" ' + bindAttr(o.scope) + '="' + path + '" data-t="bool"' + (val ? ' checked' : '') + '>' + label + '</label>';
  }
  const field = (label, html, style) => '<label class="fs-field"' + (style ? ' style="' + style + '"' : '') + '><span>' + esc(label) + '</span>' + html + '</label>';
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const btn = (action, label, cls, data) => '<button type="button" class="fs-btn ' + (cls || '') + '" data-action="' + action + '"' + Object.keys(data || {}).map((k) => ' data-' + k + '="' + esc(data[k]) + '"').join('') + '>' + label + '</button>';
  const live = (kind, args) => '<span data-live="' + kind + '" data-args="' + esc(args == null ? '' : args) + '">' + (LIVE[kind] ? LIVE[kind](String(args == null ? '' : args)) : '') + '</span>';
  const passBadge = (ok, txt) => '<span class="fs-pill ' + (ok ? 'fs-badge-pass' : 'fs-badge-fail') + '">' + (ok ? '✓ ' : '✕ ') + esc(txt || (ok ? 'Pass' : 'Prerequisites Not Met')) + '</span>';
  function card(key, summaryHtml, editHtml, extraHead) {
    const open = !!S.ui.cardOpen[key];
    return '<div class="fs-card' + (open ? ' open' : '') + '"><div class="fs-card-sum" data-action="toggle-card" data-key="' + esc(key) + '"><span class="fs-chev" style="transform:rotate(' + (open ? 90 : 0) + 'deg)">▶</span><span class="fs-grow">' + summaryHtml + '</span>' + (extraHead || '') + '</div><div class="fs-card-edit">' + editHtml + '</div></div>';
  }

  // Live slots refreshed on every keystroke without rebuilding inputs
  let SHEET_CACHE = null;
  function cur() { return SHEET_CACHE || (SHEET_CACHE = derive(benchEffects(S.ui.editingEffect))); }
  const LIVE = {
    'mod-sum': (i) => { const m = S.entry.modifiers[num(i)]; return m ? esc(modShort(m)) : ''; },
    'prereq-row': (i) => { const r = S.entry.prereqs[num(i)]; if (!r) return ''; const ev = evalPrereqs([r], cur()); return esc(ev.text) + ' ' + passBadge(ev.ok, ev.ok ? 'Pass' : 'Fail'); },
    'prereq-alt': (a) => { const p = a.split(':'); const r = S.entry.prereqs[num(p[0])]; const alt = r && r.alts[num(p[1])]; if (!alt) return ''; const ev = evalAlt(alt, cur()); return passBadge(ev.ok, (ev.ok ? 'Pass' : 'Fail') + ' — have ' + ev.have); },
    'prereq-all': () => { if (!S.entry.prereqs.length) return ''; const ev = evalPrereqs(S.entry.prereqs, cur()); return passBadge(ev.ok, ev.ok ? 'Valerius qualifies' : 'Prerequisites Not Met') + ' <span class="fs-hint">Readable: ' + esc(ev.text) + '</span>'; },
    'dc': () => 'DC ' + saveDC(S.entry, cur()) + ' <span class="fs-hint">(' + esc(dcFormulaText(S.entry)) + ' vs Valerius)</span>',
    'dice': () => esc(diceText(S.entry, cur())),
    'budget': () => budgetHtml(),
    'chassis-warn': () => { const v = chassisView(S.entry.chassis); return v.warnings.map((w) => '<div class="fs-warn" style="font-size:11px">⚠️ ' + esc(w) + '</div>').join(''); },
    'gp-table': () => { const v = chassisView(S.entry.chassis); return v.gpRows.map((r) => '<div class="fs-bd-row"><span class="src">' + esc(r[0]) + '</span><b>' + gp(r[1]) + '</b></div>').join('') + '<div class="fs-bd-row" style="border-top:1px solid var(--border-subtle);margin-top:3px;padding-top:3px"><span>Total Market Price</span><b class="fs-up">' + gp(v.gpTotal) + '</b></div>'; },
    'ench-list': () => enchListHtml(),
    'dmg-sum': (i) => { const p = S.entry.chassis.damageParts[num(i)]; return p ? esc('+' + partText(p)) : ''; },
    'dr-sum': (i) => { const x = S.entry.defenses.dr[num(i)]; return x ? 'DR ' + esc(x.value) + '/' + esc(x.bypass) : ''; },
    'en-sum': (i) => { const x = S.entry.defenses.energy[num(i)]; return x ? esc((x.mode || 'Resistance') === 'Resistance' ? 'Resist ' + x.type + ' ' + x.value : x.type + ' ' + x.mode) : ''; },
    'sub-sum': (i) => { const s = S.entry.substitutions[num(i)]; return s ? esc((s.op === 'replace' ? 'Replace ' : 'Max of ') + s.from.toUpperCase() + (s.op === 'replace' ? ' with ' : ' or ') + s.to.toUpperCase() + ' on ' + { fort: 'Fortitude', ref: 'Reflex', will: 'Will' }[s.save] + ' saves') : ''; },
    'grant-sum': (i) => { const g = S.entry.grants.featGrants[num(i)]; return g ? esc('Level ' + g.level + ': Grant ' + g.count + ' Feat' + (g.count > 1 ? 's' : '') + ' from ' + g.pool) : ''; },
    'spellcls-sum': () => esc(S.entry.delivery.spell.classes.map((c) => c.cls + ' ' + c.lvl).join(', '))
  };

  function budgetHtml() {
    const v = chassisView(S.entry.chassis);
    const pct = Math.min(100, v.effective * 10);
    const color = v.effective > 10 ? 'var(--accent-rose)' : v.effective >= 8 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
    return '<div style="display:flex;align-items:center;gap:8px;font-size:11.5px"><b style="color:var(--text-primary)">Effective Enhancement ' + sgn(v.effective) + ' / +10</b><span class="fs-hint">Base ' + sgn(v.enh) + ' + Special Abilities ' + sgn(v.plusSum) + ' — Remaining ' + sgn(Math.max(0, 10 - v.effective)) + '</span></div>' +
      '<div class="fs-hp" style="height:6px"><div style="width:' + pct + '%;background:' + color + '"></div></div>';
  }
  function enchListHtml() {
    const ch = S.entry.chassis, v = chassisView(ch), q = String(S.ui.enchSearch || '').toLowerCase();
    const list = ENCHANTMENTS.filter((e) => enchApplies(e, v.kind) && (!q || e.name.toLowerCase().indexOf(q) >= 0));
    if (!list.length) return '<span class="fs-hint">No matching special abilities for a ' + v.kind + '.</span>';
    return list.map((e) => {
      const on = ch.enchantments.indexOf(e.id) >= 0;
      const blocked = !on && e.plus && (v.effective + e.plus > 10 || v.enh < 1);
      const cost = e.plus ? '+' + e.plus + ' bonus' : gp(e.gp);
      return '<button type="button" class="fs-ench' + (on ? ' sel' : '') + (blocked ? ' blocked' : '') + '" data-action="toggle-ench" data-id="' + e.id + '" title="' + esc(e.note || e.effect.badge || '') + '"><span>' + (on ? '✓ ' : '') + esc(e.name) + '</span><small>' + cost + (blocked ? (v.enh < 1 ? ' • needs +1 base' : ' • over +10') : '') + '</small></button>';
    }).join('');
  }

  // --------------------------------------------------------------------------
  // 9. Render: top bar & sticky live header
  // --------------------------------------------------------------------------
  function renderTopbar() {
    const bpBtns = BLUEPRINTS.map((b) => btn('set-blueprint', b.icon + ' ' + esc(b.name), 'fs-xs' + (S.activeBlueprint === b.id ? ' fs-on' : ''), { id: b.id })).join('');
    const custom = S.customBlueprints.map((b) => '<span class="fs-pill purple" style="padding:0 2px 0 0">' + btn('load-custom-bp', '📌 ' + esc(b.name), 'fs-xs fs-ghost' + (S.activeBlueprint === b.id ? ' fs-on' : ''), { id: b.id }) + '<span class="fs-x" data-action="delete-custom-bp" data-id="' + esc(b.id) + '" title="Delete blueprint">×</span></span>').join('');
    const save = S.ui.bpSaveOpen
      ? '<span class="fs-row" style="gap:4px">' + inp('newBpName', S.ui.newBpName, { scope: 'ui', ph: 'Blueprint name…', style: 'width:170px', enter: 'save-blueprint' }) + btn('save-blueprint', 'Save', 'fs-xs fs-emerald') + btn('toggle-bp-save', 'Cancel', 'fs-xs fs-ghost') + '</span>'
      : btn('toggle-bp-save', '📌 Save Current Facets as New Blueprint', 'fs-xs fs-dashed');
    $('#fs-topbar').innerHTML =
      '<div class="fs-row" style="justify-content:space-between">' +
        '<div class="fs-title">' + DICE_SVG + ' Living Facet Studio <span class="fs-pill indigo">Rule Forge 3.0 • Sandbox</span><span class="fs-sub">D&amp;D 3.5e RAW • Canonical V2.5</span></div>' +
        '<div class="fs-row">' + btn('new-entry', '✨ Blank Entry', 'fs-xs') + '<span class="fs-mobile-only">' + btn('toggle-sheet-mobile', S.ui.sheetMobile ? '✕ Hide Test Sheet' : '🛡️ Show Test Sheet', 'fs-xs fs-primary') + '</span></div>' +
      '</div>' +
      '<div class="fs-row"><span class="fs-label-mini">Presets</span>' + PRESETS.map((p, i) => btn('load-preset', '<b>' + (i + 1) + '</b>' + esc(p.label), 'fs-preset fs-xs' + (S.activePreset === p.id ? ' fs-on' : ''), { id: p.id })).join('') + '</div>' +
      '<div class="fs-row"><span class="fs-label-mini">Blueprint</span>' + bpBtns + custom + save + '</div>';
  }

  function applyLabel(en) {
    if (S.ui.editingEffect) return '⚡ Update Active Effect';
    if (en.facets.indexOf('chassis') >= 0) return '⚡ Equip to Test Sheet';
    if (en.blueprint === 'spell' || en.facets.indexOf('delivery') >= 0) return en.delivery.linkedBuff ? '⚡ Cast / Apply to Sheet' : '⚡ Add Ability to Test Sheet';
    if (en.facets.indexOf('progression') >= 0) return '⚡ Apply ' + en.progression.testLevel + ' Class Level' + (en.progression.testLevel > 1 ? 's' : '');
    return '⚡ Apply to Test Sheet';
  }

  function renderLiveHeader() {
    const en = S.entry;
    const base = cur();
    const withSh = derive(benchEffects(S.ui.editingEffect).concat([previewEffect(en)]));
    const bp = BP_BY_ID[en.blueprint] || { name: 'Custom', icon: '📌' };
    const hasCh = en.facets.indexOf('chassis') >= 0;
    let l1 = '<span class="fs-live-name">' + esc(entryName(en)) + '</span><span class="fs-pill indigo">' + bp.icon + ' ' + esc(bp.name) + '</span>' + en.tags.map((t) => '<span class="fs-pill purple">' + esc(t) + '</span>').join('');
    if (S.ui.editingEffect) l1 += '<span class="fs-pill amber">✏️ Editing active effect</span>';
    if (hasCh) {
      const v = chassisView(en.chassis);
      l1 += '<span class="fs-pill ' + (v.effective > 10 ? 'rose' : 'emerald') + '">' + sgn(v.effective) + ' / +10</span><span class="fs-pill amber">💰 ' + gp(v.gpTotal) + '</span>' +
        '<span class="fs-row" style="gap:3px">' + btn('set-buy', '💰 Buy', 'fs-xs' + (S.ui.buyMode === 'buy' ? ' fs-amber' : ' fs-ghost'), { v: 'buy' }) + btn('set-buy', '🎁 Give', 'fs-xs' + (S.ui.buyMode === 'give' ? ' fs-emerald' : ' fs-ghost'), { v: 'give' }) + '</span>';
    }
    const segs = cardSummary(en, base);
    const l2 = '<span class="fs-live-card">' + (segs.length ? segs.map(esc).join(' <span style="color:var(--text-dim)">•</span> ') : '<span class="fs-hint">Configure facets below — the in-game card summary renders here.</span>') + '</span>';
    const d = (label, a, b, fmt) => {
      const diff = b - a, f = fmt || sgn;
      return '<span class="fs-delta">' + label + ' <b class="' + (diff > 0 ? 'fs-up' : diff < 0 ? 'fs-down' : '') + '">' + f(b) + '</b>' + (diff ? '<span class="' + (diff > 0 ? 'fs-up' : 'fs-down') + '">(' + sgn(diff) + ')</span>' : '') + '</span>';
    };
    const plain = (v) => String(v);
    let l3 = d('ATK', base.atkMain.total, withSh.atkMain.total) + '<span class="fs-delta">DMG <b' + (base.damageText !== withSh.damageText ? ' class="fs-up"' : '') + '>' + esc(withSh.damageText) + '</b></span>' +
      d('AC', base.ac.total, withSh.ac.total, plain) + d('Touch', base.ac.touch, withSh.ac.touch, plain) + d('Flat-Footed', base.ac.ff, withSh.ac.ff, plain) +
      d('Fort', base.saves.fort.total, withSh.saves.fort.total) + d('Ref', base.saves.ref.total, withSh.saves.ref.total) + d('Will', base.saves.will.total, withSh.saves.will.total) +
      d('CL', base.cl.total, withSh.cl.total, plain);
    if (withSh.speed.total !== base.speed.total) l3 += d('Speed', base.speed.total, withSh.speed.total, (v) => v + ' ft.');
    if (withSh.hpMax !== base.hpMax) l3 += d('HP', base.hpMax, withSh.hpMax, plain);
    if (withSh.bab !== base.bab) l3 += d('BAB', base.bab, withSh.bab);
    ABIL_KEYS.forEach((k) => { if (withSh.abil[k].score !== base.abil[k].score) l3 += d(k.toUpperCase(), base.abil[k].score, withSh.abil[k].score, plain); });
    l3 += '<span style="margin-left:auto">' + btn('apply-entry', esc(applyLabel(en)), 'fs-emerald') + '</span>';
    const before = collectSuppressed(base);
    const newSupp = collectSuppressed(withSh).filter((x) => before.indexOf(x) < 0);
    const warns = [];
    newSupp.slice(0, 3).forEach((x) => warns.push('<span class="fs-warn">⚠️ ' + esc(x) + '</span>'));
    if (hasCh) chassisView(en.chassis).warnings.slice(0, 2).forEach((w) => warns.push('<span class="fs-down">⛔ ' + esc(w) + '</span>'));
    if (en.facets.indexOf('prereqs') >= 0 && en.prereqs.length) { const ev = evalPrereqs(en.prereqs, base); warns.push(passBadge(ev.ok, ev.ok ? 'Prerequisites met' : 'Prerequisites Not Met')); }
    $('#fs-live').innerHTML = '<div class="fs-live-line">' + l1 + '</div><div class="fs-live-line">' + l2 + '</div><div class="fs-live-line">' + l3 + '</div>' + (warns.length ? '<div class="fs-live-line" style="font-size:11px">' + warns.join(' ') + '</div>' : '');
  }

  // --------------------------------------------------------------------------
  // 10. Render: the 9 composable facets
  // --------------------------------------------------------------------------
  const SKILL_OPTS = SKILLS.map((s) => [skillKey(s[0]), s[0]]);
  const ABIL_OPTS = ABILITIES.map((a) => [a[0], a[1]]);

  function facetIdentity(en) {
    const tagChips = en.tags.map((t, i) => '<span class="fs-pill purple">' + esc(t) + '<span class="fs-x" data-action="remove-tag" data-i="' + i + '">×</span></span>').join('');
    const sugg = S.livingTags.filter((t) => en.tags.indexOf(t) < 0).map((t) => btn('add-tag', esc(t), 'fs-xs fs-ghost', { tag: t })).join('');
    return '<div class="fs-grid2">' +
      field('Name', inp('name', en.name, { ph: entryName(Object.assign({}, en, { name: '' })) + ' (auto-synthesized)' })) +
      field('Source Book', inp('source', en.source, { ph: 'PHB, DMG, MIC, Homebrew…' })) + '</div>' +
      '<div class="fs-section-label">Living #PoolTags</div>' +
      '<div class="fs-row">' + (tagChips || '<span class="fs-hint">No tags yet.</span>') + inp('tagDraft', S.ui.tagDraft, { scope: 'ui', ph: 'Type #NewTag + Enter', enter: 'add-tag-draft', style: 'width:190px' }) + btn('add-tag-draft', '+ Tag', 'fs-xs') + '</div>' +
      (sugg ? '<div class="fs-row" style="margin-top:4px"><span class="fs-hint">Living pools:</span>' + sugg + '</div>' : '') +
      '<div class="fs-section-label">Feat Repeatability (Times Selectable)</div><div class="fs-row">' +
      sel('repeat.mode', en.repeat.mode, [['once', '1x Only'], ['upto', 'Up to N times'], ['per', 'Per Weapon / School']], { narrow: true }) +
      (en.repeat.mode === 'upto' ? sel('repeat.n', en.repeat.n, range(2, 20).map((n) => [n, n + ' times']), { narrow: true, num: true }) : '') + '</div>';
  }

  function altEditor(ri, ai, a) {
    const p = 'prereqs.' + ri + '.alts.' + ai + '.';
    let body = '';
    switch (a.kind) {
      case 'ability': body = sel(p + 'ability', a.ability, ABIL_OPTS, { narrow: true }) + sel(p + 'min', a.min, range(3, 30).map((n) => [n, 'Min ' + n]), { narrow: true, num: true }); break;
      case 'bab': body = sel(p + 'min', a.min, range(1, 20).map((n) => [n, 'Base Attack Bonus +' + n]), { narrow: true, num: true }); break;
      case 'skill': body = sel(p + 'skill', a.skill, SKILL_OPTS, { narrow: true }) + sel(p + 'min', a.min, range(1, 23).map((n) => [n, n + ' ranks']), { narrow: true, num: true }); break;
      case 'feat': body = '<select class="fs-sel fs-narrow" data-bind="' + p + 'feat"><optgroup label="Living Tag Pools">' + opts(S.livingTags.map((t) => [t, t + ' (any feat)']), a.feat) + '</optgroup><optgroup label="Feats">' + opts(FEATS.map((f) => [f.name, f.name]), a.feat) + '</optgroup></select>'; break;
      case 'level': body = sel(p + 'levelKind', a.levelKind, [['casterLevel', 'Caster Level'], ['charLevel', 'Character Level'], ['classLevel', 'Class Level']], { narrow: true }) +
        (a.levelKind === 'classLevel' ? inp(p + 'cls', a.cls, { ph: 'Fighter', narrow: true, style: 'width:90px' }) : '') + sel(p + 'min', a.min, range(1, 20).map((n) => [n, '≥ ' + n]), { narrow: true, num: true }); break;
      case 'alignment': body = sel(p + 'align', a.align, ALIGN_REQS.map((x) => [x, ALIGN_NAMES[x] || x]), { narrow: true }); break;
    }
    return '<div class="fs-row" style="margin-top:4px">' + (ai > 0 ? '<span class="fs-or">OR</span>' : '') +
      sel(p + 'kind', a.kind, [['ability', 'Ability Score'], ['bab', 'Base Attack Bonus'], ['skill', 'Skill Ranks'], ['feat', 'Feat / Tag Pool'], ['level', 'Caster / Class Level'], ['alignment', 'Alignment']], { narrow: true }) +
      body + live('prereq-alt', ri + ':' + ai) + btn('remove-alt', '×', 'fs-xs fs-ghost', { ri: ri, ai: ai }) + '</div>';
  }
  function facetPrereqs(en) {
    if (!en.prereqs.length) return '<div class="fs-row"><span class="fs-hint">No prerequisites — available to everyone.</span>' + btn('add-prereq', '+ Add Prerequisite', 'fs-xs fs-dashed') + '</div>';
    const rows = en.prereqs.map((r, ri) => (ri > 0 ? '<div class="fs-and">AND</div>' : '') +
      card('pr:' + r.id, live('prereq-row', ri), r.alts.map((a, ai) => altEditor(ri, ai, a)).join('') + '<div class="fs-row" style="margin-top:6px">' + btn('add-or', '+Or', 'fs-xs', { ri: ri }) + btn('remove-prereq', 'Delete Row', 'fs-xs fs-rose', { ri: ri }) + '</div>', '')).join('');
    return rows + '<div class="fs-row" style="margin-top:8px">' + btn('add-prereq', '+ Add Prerequisite', 'fs-xs fs-dashed') + live('prereq-all') + '</div>';
  }

  function facetChassis(en) {
    const ch = en.chassis, v = chassisView(ch), isW = ch.kind === 'weapon';
    const baseSel = isW
      ? '<select class="fs-sel" data-bind="chassis.baseId">' + ['Simple', 'Martial', 'Exotic'].map((c) => '<optgroup label="' + c + ' Weapons">' + opts(WEAPONS.filter((w) => w.category === c).map((w) => [w.id, w.name + ' (' + w.dice + ', ' + gp(w.cost) + ')']), ch.baseId) + '</optgroup>').join('') + '</select>'
      : '<select class="fs-sel" data-bind="chassis.baseId">' + ['Light', 'Medium', 'Heavy', 'Shield'].map((c) => '<optgroup label="' + (c === 'Shield' ? 'Shields' : c + ' Armor') + '">' + opts(ARMORS.filter((a) => a.type === c).map((a) => [a.id, a.name + ' (+' + a.armorBonus + ', ' + gp(a.cost) + ')']), ch.baseId) + '</optgroup>').join('') + '</select>';
    let over;
    if (isW) {
      const w = ch.weapon;
      over = '<div class="fs-grid4">' +
        field('Base Dice', sel('chassis.weapon.dice', w.dice, ['1d2', '1d3', '1d4', '1d6', '1d8', '1d10', '1d12', '2d4', '2d6', '2d8', '3d6'])) +
        field('Crit Range', sel('chassis.weapon.critRange', w.critRange, [[20, '20'], [19, '19–20'], [18, '18–20'], [17, '17–20'], [15, '15–20']], { num: true })) +
        field('Crit Mult', sel('chassis.weapon.critMult', w.critMult, [[2, '×2'], [3, '×3'], [4, '×4']], { num: true })) +
        field('Damage Type', sel('chassis.weapon.dmgType', w.dmgType, DAMAGE_TYPES.slice(0, 3))) +
        field('Category', sel('chassis.weapon.category', w.category, ['Simple', 'Martial', 'Exotic'])) +
        field('Handedness', sel('chassis.weapon.handed', w.handed, ['Light', 'One-Handed', 'Two-Handed'])) +
        field('Range Increment', w.rangeOn ? '<span class="fs-row" style="gap:3px">' + inp('chassis.weapon.range', w.range, { num: true, min: 0, style: 'width:70px' }) + btn('toggle-range', '×', 'fs-xs fs-ghost') + '</span>' : btn('toggle-range', '+ Range Increment', 'fs-xs fs-dashed')) +
        field('Threat (live)', '<span class="fs-pill sky" style="height:var(--input-sm-h)">' + esc(v.critText) + (v.keen ? ' (Keen)' : '') + '</span>') + '</div>';
    } else {
      const a = ch.armor;
      over = '<div class="fs-grid3">' +
        field('Armor Type', sel('chassis.armor.type', a.type, ['Light', 'Medium', 'Heavy', 'Shield'])) +
        field(v.kind === 'shield' ? 'Shield Bonus' : 'Armor Bonus', inp('chassis.armor.armorBonus', a.armorBonus, { num: true, min: 0 })) +
        field('Max Dex (99 = none)', inp('chassis.armor.maxDex', a.maxDex, { num: true })) +
        field('Armor Check Penalty', inp('chassis.armor.acp', a.acp, { num: true, max: 0 })) +
        field('Arcane Spell Failure %', inp('chassis.armor.asf', a.asf, { num: true, min: 0 })) +
        field('Speed (30-ft. base)', inp('chassis.armor.speed', a.speed, { num: true })) + '</div>' +
        '<div class="fs-hint" style="margin-top:4px">After material: Max Dex ' + (v.armor.maxDex >= 99 ? '—' : sgn(v.armor.maxDex)) + ' • ACP ' + v.armor.acp + ' • ASF ' + v.armor.asf + '% • ' + v.armor.type + ' • Speed ' + v.armor.speed + ' ft.</div>';
    }
    const mat = MATERIALS.find((m) => m.id === ch.material) || MATERIALS[0];
    const crystals = CRYSTALS.filter((c) => crystalApplies(c, v.kind));
    const cr = CRYSTAL_BY_ID[ch.crystal.id];
    const derivedChips = isW ? v.parts.filter((p) => p.source !== 'Custom').map((p) => '<span class="fs-pill ' + (p.raw ? 'sky' : p.crit === 'onCritOnly' ? 'rose' : 'amber') + '" title="' + esc(p.source) + '">' + (p.raw ? '⚔️ ' : p.crit === 'onCritOnly' ? '💥 ' : '🔥 ') + esc(partText(p)) + ' <span style="opacity:.6">· ' + esc(p.source) + '</span></span>').join('') : '';
    const customParts = (ch.damageParts || []).map((p, i) => card('dp:' + (p.id || i), '<span class="fs-pill amber">🩸 ' + live('dmg-sum', i) + '</span>',
      '<div class="fs-row">' + sel('chassis.damageParts.' + i + '.count', p.count, range(1, 20), { narrow: true, num: true }) + sel('chassis.damageParts.' + i + '.die', p.die, [['d4', 'd4'], ['d6', 'd6'], ['d8', 'd8'], ['d10', 'd10'], ['d12', 'd12'], ['flat', 'Flat']], { narrow: true }) +
      sel('chassis.damageParts.' + i + '.type', p.type, DAMAGE_TYPES, { narrow: true }) + sel('chassis.damageParts.' + i + '.crit', p.crit, [['normal', 'Normal'], ['multiply', 'Multiply on Crit'], ['onCritOnly', 'On Crit Only (Burst)']], { narrow: true }) +
      inp('chassis.damageParts.' + i + '.cond', p.cond || '', { ph: 'Condition (vs undead)', style: 'width:150px' }) + btn('remove-dmg', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    const dd = S.ui.dmgDraft;
    return '<div class="fs-grid3">' +
        field('Chassis Kind', sel('chassis.kind', ch.kind, [['weapon', 'Weapon'], ['armor', 'Armor / Shield']])) +
        field('Base ' + (isW ? 'Weapon' : 'Armor / Shield'), baseSel) +
        field('Material', sel('chassis.material', ch.material, MATERIALS.map((m) => [m.id, m.name]))) + '</div>' +
      (mat.note ? '<div class="fs-hint" style="margin-top:4px">💎 ' + esc(mat.note) + '</div>' : '') +
      '<div class="fs-section-label">Hand-Editable Overrides</div>' + over +
      '<div class="fs-section-label">Enhancement & Special Abilities</div>' +
      '<div class="fs-row">' + field('Enhancement', sel('chassis.enhancement', ch.enhancement, range(0, 5).map((n) => [n, sgn(n)]), { num: true }), 'width:90px') +
        '<div style="flex:1;min-width:220px">' + live('budget') + '</div></div>' +
      '<div class="fs-row" style="margin-top:6px">' + inp('enchSearch', S.ui.enchSearch, { scope: 'ui', ph: 'Search special abilities (Keen, Holy, Shadow…)', style: 'max-width:320px' }) +
        ch.enchantments.map((id) => { const e = ENCH_BY_ID[id]; return e ? '<span class="fs-pill emerald">' + esc(e.name) + '<span class="fs-x" data-action="toggle-ench" data-id="' + id + '">×</span></span>' : ''; }).join('') + '</div>' +
      '<div class="fs-picker">' + live('ench-list') + '</div>' +
      '<div class="fs-section-label">💎 MIC Augment Crystal</div>' +
      '<div class="fs-row">' + '<select class="fs-sel fs-narrow" data-bind="chassis.crystal.id"><option value="">— None —</option>' + opts(crystals.map((c) => [c.id, c.name]), ch.crystal.id) + '</select>' +
        (cr ? sel('chassis.crystal.tier', ch.crystal.tier, [['least', 'Least (masterwork) — ' + gp(cr.cost[0])], ['lesser', 'Lesser (+1) — ' + gp(cr.cost[1])], ['greater', 'Greater (+3) — ' + gp(cr.cost[2])]], { narrow: true }) + '<span class="fs-hint">' + esc(cr.tiers[Math.max(0, CRYSTAL_TIERS.indexOf(ch.crystal.tier))]) + '</span>' : '<span class="fs-hint">Least requires masterwork, Lesser +1, Greater +3.</span>') + '</div>' +
      (isW ? '<div class="fs-section-label">🩸 damageParts[] Builder</div><div class="fs-row">' + derivedChips + '</div>' + customParts +
        '<div class="fs-row" style="margin-top:6px">' + sel('dmgDraft.count', dd.count, range(1, 20), { scope: 'ui', narrow: true }) + sel('dmgDraft.die', dd.die, [['d4', 'd4'], ['d6', 'd6'], ['d8', 'd8'], ['d10', 'd10'], ['d12', 'd12'], ['flat', 'Flat']], { scope: 'ui', narrow: true }) +
        sel('dmgDraft.type', dd.type, DAMAGE_TYPES, { scope: 'ui', narrow: true }) + sel('dmgDraft.crit', dd.crit, [['normal', 'Normal'], ['multiply', 'Multiply on Crit'], ['onCritOnly', 'On Crit Only (Burst)']], { scope: 'ui', narrow: true }) + btn('add-dmg', '+ Add', 'fs-xs fs-primary') + '</div>' : '') +
      '<div style="margin-top:8px">' + live('chassis-warn') + '</div>' +
      '<div class="fs-section-label">💰 Market Price (DMG)</div><div class="fs-bd">' + live('gp-table') + '</div>';
  }

  function bonusTypeOpts() { return allBonusTypes().map((b) => [b.id, b.id + (b.custom ? ' (custom)' : '') + (b.stacks ? ' — stacks' : '') + (b.lostFF ? ', lost Flat-Footed' : '') + (b.cap ? ' — max +' + b.cap : '')]); }
  function facetModifiers(en) {
    const mods = en.modifiers.map((m, i) => card('m:' + m.id, '<span class="fs-pill ' + (num(m.value) < 0 || m.type === 'Penalty' ? 'rose' : 'emerald') + '">✨</span> ' + live('mod-sum', i),
      '<div class="fs-grid3">' + field('Target', selGroups('modifiers.' + i + '.target', m.target, TARGET_GROUPS)) +
      field('Bonus Type', sel('modifiers.' + i + '.type', m.type, bonusTypeOpts())) +
      field('Scaling', sel('modifiers.' + i + '.formula', m.formula || 'flat', FORMULAS)) +
      field('Value', inp('modifiers.' + i + '.value', m.value, { num: true })) +
      field('Condition (optional)', inp('modifiers.' + i + '.condition', m.condition, { ph: 'vs Fear, flanking…' })) +
      field('\u00a0', btn('remove-mod', 'Delete Modifier', 'fs-xs fs-rose', { i: i })) + '</div>' +
      (m.condition ? '<div class="fs-hint" style="margin-top:4px">Conditional modifiers are listed on the sheet but excluded from totals.</div>' : ''))).join('');
    const ct = S.ui.customType;
    const customForm = S.ui.customTypeOpen
      ? '<div class="fs-card open" style="padding:8px"><div class="fs-row">' + inp('customType.name', ct.name, { scope: 'ui', ph: 'Bonus type name (e.g. Shadow)', style: 'width:200px' }) +
        chk('customType.stacks', ct.stacks, 'Stacks with itself', { scope: 'ui' }) + chk('customType.lostFF', ct.lostFF, 'Lost when Flat-Footed', { scope: 'ui' }) +
        btn('save-custom-type', 'Save Bonus Type', 'fs-xs fs-emerald') + btn('toggle-custom-type', 'Cancel', 'fs-xs fs-ghost') + '</div></div>' : '';
    const subs = en.substitutions.map((s, i) => card('s:' + (s.id || i), '🔄 ' + live('sub-sum', i),
      '<div class="fs-row">' + sel('substitutions.' + i + '.op', s.op, [['replace', 'Replace'], ['max', 'Use Higher Of']], { narrow: true }) +
      sel('substitutions.' + i + '.save', s.save, [['fort', 'Fortitude'], ['ref', 'Reflex'], ['will', 'Will']], { narrow: true }) + '<span class="fs-hint">save:</span>' +
      sel('substitutions.' + i + '.from', s.from, ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true }) + '<span class="fs-hint">→</span>' +
      sel('substitutions.' + i + '.to', s.to, ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true }) + btn('remove-sub', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    return (mods || '<div class="fs-hint">No continuous modifiers yet.</div>') +
      '<div class="fs-row" style="margin-top:8px">' + btn('add-mod', '+ Add Modifier', 'fs-xs fs-dashed') + btn('toggle-custom-type', '+ Define Custom Bonus Type', 'fs-xs fs-dashed') + btn('add-sub', '+ Ability Modifier Substitution', 'fs-xs fs-dashed') + '</div>' + customForm +
      (S.customBonusTypes.length ? '<div class="fs-row" style="margin-top:4px"><span class="fs-hint">Custom types:</span>' + S.customBonusTypes.map((b, i) => '<span class="fs-pill sky">' + esc(b.id) + (b.stacks ? ' · stacks' : '') + (b.lostFF ? ' · lost FF' : '') + '<span class="fs-x" data-action="remove-custom-type" data-i="' + i + '">×</span></span>').join('') + '</div>' : '') +
      (subs ? '<div class="fs-section-label">Ability Modifier Substitution</div>' + subs : '') +
      '<div class="fs-section-label">🩸 Debuff State Locks</div><div class="fs-row">' + Object.keys(LOCK_LABEL).map((k) => chk('locks.' + k, en.locks[k], esc(LOCK_LABEL[k]))).join('') + '</div>';
  }

  function facetDelivery(en) {
    const d = en.delivery;
    let h = '<div class="fs-row">' + field('Action Economy', sel('delivery.action', d.action, ACTIONS), 'width:160px') + '</div><div class="fs-row" style="margin-top:8px">' +
      chk('delivery.rangeOn', d.rangeOn, '+ Range / Area') + chk('delivery.saveOn', d.saveOn, '+ Saving Throw') + chk('delivery.srOn', d.srOn, '+ Spell Resistance') +
      chk('delivery.diceOn', d.diceOn, '+ Damage / Healing Dice') + chk('delivery.spellOn', d.spellOn, '+ Spell Metadata') + chk('delivery.linkedBuff', d.linkedBuff, '🔮 Linked Cast Buff/Debuff') + '</div>';
    if (d.rangeOn) h += '<div class="fs-section-label">Range / Area</div><div class="fs-grid2">' + field('Range', '<input class="fs-in" data-bind="delivery.range" list="fs-range-list" value="' + esc(d.range) + '"><datalist id="fs-range-list">' + opts(['Personal', 'Touch', 'Close (25 ft. + 5 ft./2 levels)', 'Medium (100 ft. + 10 ft./level)', 'Long (400 ft. + 40 ft./level)', 'Unlimited'], '') + '</datalist>') +
      field('Area / Target', '<input class="fs-in" data-bind="delivery.area" list="fs-area-list" value="' + esc(d.area) + '"><datalist id="fs-area-list">' + opts(['30-ft. Cone', '60-ft. Line', '20-ft.-radius Spread', 'One creature', 'You'], '') + '</datalist>') + '</div>';
    if (d.saveOn) h += '<div class="fs-section-label">Saving Throw</div><div class="fs-row">' + sel('delivery.save.type', d.save.type, ['Fortitude', 'Reflex', 'Will'], { narrow: true }) +
      sel('delivery.save.effect', d.save.effect, ['Negates', 'Half', 'Partial', 'Negates (harmless)', 'Disbelief'], { narrow: true }) +
      sel('delivery.save.dcMode', d.save.dcMode, [['spell', 'DC 10 + Spell Level + Stat'], ['hd', 'DC 10 + 1/2 HD + Stat'], ['flat', 'Flat DC']], { narrow: true }) +
      (d.save.dcMode === 'flat' ? inp('delivery.save.flat', d.save.flat, { num: true, style: 'width:70px' }) : sel('delivery.save.stat', d.save.stat, ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true })) +
      (d.save.dcMode === 'spell' && !d.spellOn ? sel('delivery.save.spellLevel', d.save.spellLevel, range(0, 9).map((n) => [n, 'Spell Level ' + n]), { narrow: true, num: true }) : '') +
      '<span class="fs-pill amber">' + live('dc') + '</span></div>';
    if (d.srOn) h += '<div class="fs-section-label">Spell Resistance</div>' + sel('delivery.sr', d.sr, ['Yes', 'No', 'Yes (harmless)', 'See text'], { narrow: true });
    if (d.diceOn) h += '<div class="fs-section-label">' + DICE_SVG + ' Dice Scaling</div><div class="fs-row">' + sel('delivery.dice.count', d.dice.count, range(1, 20), { narrow: true, num: true }) +
      sel('delivery.dice.die', d.dice.die, ['d4', 'd6', 'd8', 'd10', 'd12'], { narrow: true }) + sel('delivery.dice.type', d.dice.type, DAMAGE_TYPES.concat(['Healing']), { narrow: true }) +
      chk('delivery.dice.perCL', d.dice.perCL, 'per Caster Level') + (d.dice.perCL ? sel('delivery.dice.max', d.dice.max, range(1, 25).map((n) => [n, 'max ' + n]), { narrow: true, num: true }) : '') +
      '<span class="fs-pill rose">' + live('dice') + '</span></div>';
    if (d.spellOn) h += '<div class="fs-section-label">🔮 Spell Metadata</div><div class="fs-row">' +
      d.spell.classes.map((c, i) => '<span class="fs-pill indigo" style="padding:2px 4px">' + inp('delivery.spell.classes.' + i + '.cls', c.cls, { style: 'width:70px;height:22px' }) + sel('delivery.spell.classes.' + i + '.lvl', c.lvl, range(0, 9), { num: true, style: 'width:48px;height:22px' }) + '<span class="fs-x" data-action="remove-spellcls" data-i="' + i + '">×</span></span>').join('') +
      btn('add-spellcls', '+ Class/Level', 'fs-xs fs-dashed') + sel('delivery.spell.school', d.spell.school, SCHOOLS, { narrow: true }) + '</div><div class="fs-row" style="margin-top:6px"><span class="fs-hint">Components:</span>' +
      ['V', 'S', 'M', 'F', 'DF', 'XP'].map((k) => btn('toggle-comp', k, 'fs-xs' + (d.spell.comps[k] ? ' fs-on' : ''), { k: k })).join('') + '</div>';
    if (d.linkedBuff) h += '<div class="fs-hint" style="margin-top:6px">🔮 Casting pushes this entry’s Facet 4 modifiers (and Facet 6 duration) onto the Test Sheet as an active effect.' + (en.facets.indexOf('modifiers') < 0 ? ' <b class="fs-warn">Attach Facet 4 to define the buff.</b>' : '') + '</div>';
    return h;
  }

  function facetLifecycle(en) {
    const l = en.lifecycle;
    return '<div class="fs-grid3">' +
      field('Usage', sel('lifecycle.usage', l.usage, [['atwill', 'At-Will'], ['perDay', 'X / Day'], ['charges', 'Charges (Wand / Staff)'], ['cooldown', 'Cooldown Recharge Dice']])) +
      field(l.usage === 'perDay' ? 'Uses per Day' : l.usage === 'charges' ? 'Charges' : l.usage === 'cooldown' ? 'Recharge (rounds)' : '\u00a0',
        l.usage === 'perDay' ? sel('lifecycle.perDay', l.perDay, range(1, 10), { num: true }) : l.usage === 'charges' ? inp('lifecycle.charges', l.charges, { num: true, min: 1, max: 50 }) : l.usage === 'cooldown' ? inp('lifecycle.cooldown', l.cooldown, { ph: '1d4+1' }) : '<span class="fs-hint">Unlimited</span>') +
      field('Duration', sel('lifecycle.duration', l.duration, [['permanent', 'Permanent / Equipped'], ['rounds', 'X Rounds'], ['roundsPerLevel', 'Rounds / Level'], ['minPerLevel', 'Minutes / Level'], ['saveEnds', 'Save Ends']])) +
      (['rounds', 'roundsPerLevel', 'minPerLevel'].indexOf(l.duration) >= 0 ? field(l.duration === 'rounds' ? 'Rounds' : 'Multiplier', inp('lifecycle.durValue', l.durValue, { num: true, min: 1 })) : '') + '</div>' +
      '<div class="fs-row" style="margin-top:8px">' + chk('lifecycle.stackable', l.stackable, 'Stackable ×N') + (l.stackable ? sel('lifecycle.maxStacks', l.maxStacks, range(1, 20).map((n) => [n, 'Max Stacks ' + n]), { narrow: true, num: true }) : '') +
      chk('lifecycle.ongoingOn', l.ongoingOn, 'Ongoing Start-of-Turn Effect') + '</div>' +
      (l.ongoingOn ? '<div class="fs-row" style="margin-top:6px">' + sel('lifecycle.ongoing.kind', l.ongoing.kind, [['dot', '🩸 DOT Damage'], ['fastHeal', '💚 Fast Healing']], { narrow: true }) +
        (l.ongoing.kind === 'dot' ? inp('lifecycle.ongoing.dice', l.ongoing.dice, { ph: '1d6', style: 'width:80px' }) + sel('lifecycle.ongoing.type', l.ongoing.type, DAMAGE_TYPES, { narrow: true }) : inp('lifecycle.ongoing.value', l.ongoing.value, { num: true, style: 'width:70px' }) + '<span class="fs-hint">HP / round</span>') + '</div>' : '');
  }

  function facetDefenses(en) {
    const d = en.defenses;
    const drs = d.dr.map((x, i) => card('dr:' + (x.id || i), '🛡️ ' + live('dr-sum', i), '<div class="fs-row">' + inp('defenses.dr.' + i + '.value', x.value, { num: true, style: 'width:70px' }) + '<span>/</span>' + sel('defenses.dr.' + i + '.bypass', x.bypass, DR_BYPASS.map((b) => [b, b === '-' ? '— (untyped)' : b]), { narrow: true }) + btn('remove-dr', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    const ens = d.energy.map((x, i) => card('en:' + (x.id || i), '🔥 ' + live('en-sum', i), '<div class="fs-row">' + sel('defenses.energy.' + i + '.type', x.type, ENERGY, { narrow: true }) + sel('defenses.energy.' + i + '.mode', x.mode || 'Resistance', ['Resistance', 'Immunity', 'Vulnerability'], { narrow: true }) +
      ((x.mode || 'Resistance') === 'Resistance' ? inp('defenses.energy.' + i + '.value', x.value, { num: true, style: 'width:70px' }) : '') + btn('remove-en', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    return '<div class="fs-section-label">Damage Reduction</div>' + drs + btn('add-dr', '+ Damage Reduction', 'fs-xs fs-dashed') +
      '<div class="fs-section-label">Energy Resistance / Immunity / Vulnerability</div>' + ens + btn('add-en', '+ Energy Entry', 'fs-xs fs-dashed') +
      '<div class="fs-section-label">Spell Resistance, Miss Chance & Reactions</div><div class="fs-row">' + chk('defenses.srOn', d.srOn, 'Spell Resistance') +
      (d.srOn ? sel('defenses.sr.mode', d.sr.mode, [['flat', 'Flat'], ['level', '10 + @level']], { narrow: true }) + (d.sr.mode === 'flat' ? inp('defenses.sr.value', d.sr.value, { num: true, style: 'width:70px' }) : '') : '') +
      sel('defenses.concealment', d.concealment, [[0, 'No Miss Chance'], [20, '20% Concealment (Blur)'], [50, '50% Miss Chance (Displacement)']], { narrow: true, num: true }) +
      chk('defenses.reactionOn', d.reactionOn, '⚡ Immediate Reaction Trigger') + (d.reactionOn ? inp('defenses.reaction', d.reaction, { ph: 'When hit by a melee attack…', style: 'width:240px' }) : '') + '</div>';
  }

  function facetProgression(en) {
    const p = en.progression;
    const rows = p.levels.slice(0, p.maxLevel).map((l, i) => {
      const L = i + 1;
      return '<tr class="' + (L === num(p.testLevel) ? 'fs-testlvl' : '') + '"><td><b>' + L + '</b></td><td>' + sgn(classBAB(p.bab, L)) + '</td><td>' + sgn(p.good.fort ? goodSave(L) : poorSave(L)) + '</td><td>' + sgn(p.good.ref ? goodSave(L) : poorSave(L)) + '</td><td>' + sgn(p.good.will ? goodSave(L) : poorSave(L)) + '</td>' +
        '<td><div class="fs-row" style="gap:3px">' + l.features.map((f, fi) => '<span class="fs-pill indigo">' + esc(f) + '<span class="fs-x" data-action="remove-feature" data-l="' + i + '" data-f="' + fi + '">×</span></span>').join('') +
        '<input class="fs-in" style="width:110px;height:22px;font-size:11px" placeholder="+ feature ⏎" data-enter="add-feature" data-l="' + i + '"></div></td>' +
        '<td><label class="fs-check' + (l.spell ? ' on' : '') + '" style="padding:1px 6px"><input type="checkbox" data-bind="progression.levels.' + i + '.spell" data-t="bool"' + (l.spell ? ' checked' : '') + '>+1</label></td></tr>';
    }).join('');
    return '<div class="fs-grid4">' +
      field('Matrix', sel('progression.mode', p.mode, [['base', 'Base Class (1–20)'], ['prestige', 'Prestige Class (1–10)'], ['legacy', 'Legacy Item (1–20)']])) +
      field('Hit Die', sel('progression.hitDie', p.hitDie, [4, 6, 8, 10, 12].map((n) => [n, 'd' + n]), { num: true })) +
      field('Base Attack Bonus', sel('progression.bab', p.bab, [['full', 'Full (Fighter)'], ['3/4', '3/4 (Cleric)'], ['1/2', '1/2 (Wizard)']])) +
      field('Skill Points / Level', sel('progression.skillPts', p.skillPts, [2, 4, 6, 8].map((n) => [n, n + ' + Int']), { num: true })) + '</div>' +
      '<div class="fs-row" style="margin-top:8px"><span class="fs-hint">Good Saves:</span>' + chk('progression.good.fort', p.good.fort, 'Fortitude') + chk('progression.good.ref', p.good.ref, 'Reflex') + chk('progression.good.will', p.good.will, 'Will') +
      '<span class="fs-hint" style="margin-left:8px">Test at class level:</span>' + sel('progression.testLevel', p.testLevel, range(1, p.maxLevel), { narrow: true, num: true }) + '</div>' +
      '<div class="fs-section-label">🔁 Repeating Pattern Generator</div><div class="fs-row">' + inp('progression.pattern.name', p.pattern.name, { ph: 'Feature name', style: 'width:150px' }) +
      '<span class="fs-hint">start</span>' + sel('progression.pattern.start', p.pattern.start, range(1, p.maxLevel), { narrow: true, num: true }) + '<span class="fs-hint">every</span>' + sel('progression.pattern.every', p.pattern.every, range(1, 10), { narrow: true, num: true }) +
      '<span class="fs-hint">scaling</span>' + inp('progression.pattern.scale', p.pattern.scale, { ph: '+1d6 or +1', style: 'width:80px' }) + btn('gen-pattern', '⚡ Generate Rows', 'fs-xs fs-primary') + '</div>' +
      '<div class="fs-scroll-x" style="margin-top:8px"><table class="fs-table"><thead><tr><th>Lvl</th><th>BAB</th><th>Fort</th><th>Ref</th><th>Will</th><th>Features</th><th title="+1 Level of Existing Spellcasting Class">+1 Spellcasting</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function facetGrants(en) {
    const g = en.grants, me = S.char.alignment;
    const grid = '<div class="fs-align">' + ALIGNS.map((a) => '<button type="button" data-action="set-deity-align" data-a="' + a + '" class="' + (a === g.deityAlign ? 'deity' : clericLegal(g.deityAlign, a) ? 'legal' : '') + '" title="' + ALIGN_NAMES[a] + '">' + a + '</button>').join('') + '</div>';
    const grants = g.featGrants.map((x, i) => card('g:' + (x.id || i), '🎯 ' + live('grant-sum', i), '<div class="fs-row">' + sel('grants.featGrants.' + i + '.level', x.level, range(1, 20).map((n) => [n, 'Level ' + n]), { narrow: true, num: true }) +
      sel('grants.featGrants.' + i + '.count', x.count, range(1, 5).map((n) => [n, n + ' feat' + (n > 1 ? 's' : '')]), { narrow: true, num: true }) + '<span class="fs-hint">from</span>' + sel('grants.featGrants.' + i + '.pool', x.pool, S.livingTags, { narrow: true }) + btn('remove-grant', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    return '<div class="fs-row" style="align-items:flex-start;gap:16px"><div><div class="fs-section-label" style="margin-top:0">Deity Alignment</div>' + grid +
      '<div class="fs-hint" style="margin-top:4px;max-width:210px">Green = legal Cleric alignments (one step on one axis). Valerius (' + me + '): ' + (clericLegal(g.deityAlign, me) ? '<b class="fs-up">may worship as Cleric</b>' : '<b class="fs-down">illegal for Cleric</b>') + '</div></div>' +
      '<div style="flex:1;min-width:240px"><div class="fs-grid2">' + field('Favored Weapon', sel('grants.favoredWeapon', g.favoredWeapon, WEAPONS.map((w) => [w.id, w.name]))) + field('Granted Power Uses', inp('grants.grantedUses', g.grantedUses, { ph: '1/day' })) + '</div>' +
      '<div class="fs-section-label">Domains</div><div class="fs-row">' + DOMAINS.map((dm) => btn('toggle-domain', esc(dm), 'fs-xs' + (g.domains.indexOf(dm) >= 0 ? ' fs-on' : ''), { d: dm })).join('') + '</div>' +
      '<div class="fs-section-label">Granted Power</div><textarea class="fs-in" data-bind="grants.grantedPower" placeholder="Describe the granted power…">' + esc(g.grantedPower) + '</textarea></div></div>' +
      '<div class="fs-section-label">📜 Domain Spell Ladder (Levels 1–9)</div><div class="fs-grid3">' + g.ladder.map((s, i) => field('Level ' + (i + 1), '<input class="fs-in" data-bind="grants.ladder.' + i + '" list="fs-spell-list" value="' + esc(s) + '">')).join('') + '</div><datalist id="fs-spell-list">' + opts(SAMPLE_SPELLS, '') + '</datalist>' +
      '<div class="fs-section-label">🎯 Bonus Feat Slot Grants (Living #PoolTags)</div>' + grants + btn('add-grant', '+ Grant Bonus Feat Slot', 'fs-xs fs-dashed');
  }

  const FACET_RENDER = { identity: facetIdentity, prereqs: facetPrereqs, chassis: facetChassis, modifiers: facetModifiers, delivery: facetDelivery, lifecycle: facetLifecycle, defenses: facetDefenses, progression: facetProgression, grants: facetGrants };
  function facetMeta(en, k) {
    switch (k) {
      case 'identity': return en.tags.length + ' tags';
      case 'prereqs': return en.prereqs.length + ' AND rows';
      case 'chassis': { const v = chassisView(en.chassis); return sgn(v.effective) + ' / +10 • ' + gp(v.gpTotal); }
      case 'modifiers': return en.modifiers.length + ' modifiers • ' + Object.keys(en.locks).filter((x) => en.locks[x]).length + ' locks';
      case 'delivery': return en.delivery.action;
      case 'lifecycle': return usageText(en.lifecycle) + ' • ' + durationText(en.lifecycle);
      case 'defenses': return (en.defenses.dr.length + en.defenses.energy.length + (en.defenses.srOn ? 1 : 0)) + ' entries';
      case 'progression': return en.progression.maxLevel + ' levels';
      case 'grants': return en.grants.domains.length + ' domains • ' + en.grants.featGrants.length + ' grants';
      default: return '';
    }
  }
  function renderFacets() {
    const en = S.entry;
    const active = FACETS.filter((f) => en.facets.indexOf(f.key) >= 0);
    let h = active.map((f) => {
      const open = S.ui.facetOpen[f.key] !== false;
      return '<div class="fs-glass fs-facet' + (open ? ' open' : '') + '"><div class="fs-facet-head" data-action="toggle-facet" data-k="' + f.key + '"><span class="fs-chev">▶</span><span class="fs-facet-num">' + f.n + '</span><span>' + f.icon + '</span><span class="fs-facet-title">' + esc(f.title) + '</span>' +
        '<span class="fs-facet-meta">' + esc(facetMeta(en, f.key)) + (f.key !== 'identity' ? '<span class="fs-btn fs-xs fs-ghost" data-action="detach-facet" data-k="' + f.key + '" title="Detach facet">✕ Detach</span>' : '') + '</span></div>' +
        '<div class="fs-facet-body">' + FACET_RENDER[f.key](en) + '</div></div>';
    }).join('');
    const inactive = FACETS.filter((f) => en.facets.indexOf(f.key) < 0);
    h += '<div class="fs-glass fs-facet" style="padding:10px 12px"><div class="fs-row">' + btn('toggle-attach', '+ Attach Another Facet', 'fs-dashed') +
      (S.ui.attachOpen ? (inactive.length ? inactive.map((f) => btn('attach-facet', f.icon + ' ' + f.n + '. ' + esc(f.title), 'fs-xs', { k: f.key })).join('') : '<span class="fs-hint">All 9 facets attached.</span>') : '<span class="fs-hint">Compose any facet onto any item, feat, spell or class.</span>') + '</div></div>';
    $('#fs-facets').innerHTML = h;
  }

  function renderJson() {
    const open = S.ui.jsonOpen;
    $('#fs-json-wrap').className = 'fs-glass fs-facet' + (open ? ' open' : '');
    $('#fs-json-wrap').innerHTML = '<div class="fs-facet-head" data-action="toggle-json"><span class="fs-chev">▶</span><span>📜</span><span class="fs-facet-title">Canonical V2.5 JSON Output Inspector</span><span class="fs-facet-meta">' + (open ? btn('copy-json', 'Copy JSON', 'fs-xs') : 'click to expand') + '</span></div>' +
      '<div class="fs-facet-body"><pre class="fs-json" id="fs-json-pre">' + (open ? esc(JSON.stringify(exportEntry(S.entry), null, 2)) : '') + '</pre></div>';
  }

  // --------------------------------------------------------------------------
  // 11. Render: Live Mini-Character Sheet Test Bench
  // --------------------------------------------------------------------------
  function bdHtml(ag) {
    return '<div class="fs-bd">' + ag.parts.map((p) => '<div class="fs-bd-row"><span class="src' + (p.suppressed ? ' fs-supp' : '') + '" title="' + esc(p.reason || '') + '">' + esc(p.source) + (p.type && p.type !== 'Base' ? ' <span style="color:var(--text-dim)">[' + esc(p.type) + ']</span>' : '') + '</span><span>' +
      (p.suppressed ? '<span class="fs-supp">' + sgn(p.value) + '</span><span class="fs-supp-badge" title="' + esc(p.reason) + '">' + (/Flat-Footed/.test(p.reason) ? 'LOST' : /Touch/.test(p.reason) ? 'N/A' : 'SUPPRESSED') + '</span>' : '<b>' + sgn(p.value) + '</b>') + (p.reason && !p.suppressed ? ' <span class="fs-warn" title="' + esc(p.reason) + '">⚠️</span>' : '') + '</span></div>').join('') +
      '<div class="fs-bd-row" style="border-top:1px solid var(--border-subtle);margin-top:3px;padding-top:3px"><span>Total</span><b>' + ag.total + '</b></div></div>';
  }
  function effectStatus(fx, sh) {
    const en = fx.entry, l = en.lifecycle, F = en.facets, out = [];
    if (fx.expired) out.push('<span class="fs-pill dim">Expired</span>');
    if (fx.roundsLeft != null && fx.on) out.push('<span class="fs-pill sky">⏳ ' + fx.roundsLeft + ' rd' + (fx.roundsLeft === 1 ? '' : 's') + '</span>');
    if (F.indexOf('lifecycle') >= 0) {
      if (l.duration === 'saveEnds' && fx.on) out.push('<span class="fs-pill amber">Save Ends</span>');
      if (l.usage === 'cooldown') out.push(fx.cooldown > 0 ? '<span class="fs-pill rose">Recharging ' + fx.cooldown + ' rd</span>' : '<span class="fs-pill emerald">Ready</span>');
      if (l.usage === 'perDay') out.push('<span class="fs-pill indigo">' + fx.usesLeft + '/' + num(l.perDay) + ' per day</span>');
      if (l.usage === 'charges') out.push('<span class="fs-pill indigo">' + fx.charges + ' charges</span>');
      if (l.ongoingOn) out.push('<span class="fs-pill ' + (l.ongoing.kind === 'dot' ? 'rose">🩸 ' + esc(l.ongoing.dice) + ' ' + esc(l.ongoing.type) : 'emerald">💚 Fast Healing ' + num(l.ongoing.value)) + '/rd</span>');
    }
    return out.join('');
  }
  function canUse(en) { return en.facets.indexOf('delivery') >= 0 && (en.delivery.diceOn || en.delivery.saveOn || en.lifecycle.usage !== 'atwill'); }

  function renderSheet() {
    const sh = derive(S.effects), c = S.char;
    const open = S.ui.sheetOpen.k || '';
    const stat = (k, label, v, sub, ag) => '<div class="fs-stat" data-action="toggle-bd" data-k="' + k + '" style="' + (open === k ? 'border-color:var(--accent-indigo)' : '') + '"><div class="k">' + label + '</div><div class="v">' + v + '</div><div class="s">' + (sub || '&nbsp;') + '</div></div>';
    const AGS = { ac: sh.ac.main, touch: sh.ac.touchAg, ff: sh.ac.ffAg, fort: sh.saves.fort, ref: sh.saves.ref, will: sh.saves.will, melee: sh.melee, ranged: sh.ranged, dmg: sh.dmgMain, init: sh.init, speed: sh.speed, cl: sh.cl, grapple: sh.grapple };
    ABIL_KEYS.forEach((k) => { AGS['ab_' + k] = { total: sh.abil[k].score, parts: sh.abil[k].parts }; });
    sh.skills.forEach((s) => { AGS['sk_' + s.key] = { total: s.total, parts: s.parts }; });
    const hpPct = Math.max(0, Math.min(100, (sh.hp / sh.hpMax) * 100));
    let h = '<div class="fs-row" style="justify-content:space-between"><div><div class="fs-live-name">🛡️ ' + esc(c.name) + '</div><div class="fs-hint">' + esc(c.classLine) + (sh.classAdds.length ? ' / ' + sh.classAdds.map((x) => esc(x.name) + ' ' + x.L).join(' / ') : '') + ' • Level ' + sh.level + '</div></div>' +
      '<div class="fs-row" style="gap:4px">' + sel('alignment', c.alignment, ALIGNS.map((a) => [a, a]), { scope: 'char', narrow: true }) + '<span class="fs-pill amber">💰 ' + gp(c.gold) + '</span></div></div>';
    h += '<div style="margin-top:8px"><div class="fs-row" style="justify-content:space-between;font-size:11.5px"><span><b style="color:var(--text-primary)">HP ' + sh.hp + ' / ' + sh.hpMax + '</b>' + (sh.temp ? ' <span class="fs-pill sky">+' + sh.temp + ' temp</span>' : '') + (sh.hp <= 0 ? ' <span class="fs-pill rose">' + (sh.hp === 0 ? 'Disabled' : 'Dying') + '</span>' : '') + '</span>' +
      '<span class="fs-row" style="gap:3px">' + btn('hp-delta', '🩸 -5', 'fs-xs', { v: -5 }) + btn('hp-delta', '💚 +5', 'fs-xs', { v: 5 }) + '</span></div><div class="fs-hp"><div style="width:' + hpPct + '%"></div></div></div>';
    h += '<div class="fs-row" style="margin-top:8px">' + btn('next-round', '⏭️ Next Round', 'fs-primary') + '<span class="fs-pill indigo">Round ' + S.round + '</span>' +
      btn('toggle-ff', '🛡️ Flat-Footed: ' + (S.flatFooted ? 'ON' : 'OFF'), S.flatFooted ? 'fs-rose' : '') + btn('reset-bench', 'Reset Bench', 'fs-xs fs-ghost') + '</div>';
    h += '<div class="fs-section-label">Ability Scores <span class="fs-hint" style="text-transform:none;letter-spacing:0">(edit base)</span></div><div class="fs-abil">' + ABIL_KEYS.map((k) => {
      const a = sh.abil[k], changed = a.score !== c.abil[k];
      return '<div class="fs-stat" data-action="toggle-bd" data-k="ab_' + k + '"><div class="k">' + k.toUpperCase() + '</div><div class="v' + (changed ? (a.score > c.abil[k] ? ' fs-up' : ' fs-down') : '') + '">' + a.score + '</div><div class="s">' + sgn(a.mod) + '</div>' +
        '<input class="fs-in" type="number" data-t="num" data-cbind="abil.' + k + '" value="' + c.abil[k] + '" title="Base ' + k.toUpperCase() + '"></div>';
    }).join('') + '</div>';
    h += '<div class="fs-section-label">Combat Statistics <span class="fs-hint" style="text-transform:none;letter-spacing:0">(click for breakdown)</span></div><div class="fs-stat-grid">' +
      stat('ac', 'Armor Class' + (sh.ac.ffNow ? ' (FF)' : ''), sh.ac.total, sh.ac.loseDex ? '<span class="fs-down">DEX denied</span>' : 'Dex to AC ' + sgn(Math.min(sh.abil.dex.mod, sh.armor.view.armor.maxDex)), sh.ac.main) +
      stat('touch', 'Touch AC', sh.ac.touch) + stat('ff', 'Flat-Footed AC', sh.ac.ff) +
      stat('fort', 'Fortitude', sgn(sh.saves.fort.total)) + stat('ref', 'Reflex', sgn(sh.saves.ref.total)) + stat('will', 'Will', sgn(sh.saves.will.total)) +
      stat('melee', 'Melee Attack', sgn(sh.melee.total), sh.weapon.view.ranged ? '' : 'Full Attack ' + sh.iter.join('/')) + stat('ranged', 'Ranged Attack', sgn(sh.ranged.total), sh.weapon.view.ranged ? 'Full Attack ' + sh.iter.join('/') : '') +
      stat('dmg', 'Damage', esc(sh.weapon.view.dice) + (sh.dmgMain.total ? sgn(sh.dmgMain.total) : ''), esc(sh.weapon.view.critText)) +
      stat('init', 'Initiative', sgn(sh.init.total)) + stat('speed', 'Land Speed', sh.speed.total + ' ft.') + stat('cl', 'Caster Level', sh.cl.total, 'ASF ' + sh.asf + '%') +
      stat('bab', 'Base Attack Bonus', sgn(sh.bab), sh.classAdds.length ? 'incl. ' + sh.classAdds.map((x) => esc(x.name)).join(', ') : '') + stat('grapple', 'Grapple', sgn(sh.grapple.total)) + stat('acp', 'Armor Check Penalty', sh.acp, 'Max Dex ' + (sh.armor.view.armor.maxDex >= 99 ? '—' : sgn(sh.armor.view.armor.maxDex))) + '</div>';
    if (open && AGS[open]) h += bdHtml(AGS[open]);
    // Gear
    h += '<div class="fs-section-label">⚔️ Wielded & Worn</div>' +
      '<div class="fs-gear"><span class="fs-pill sky">Weapon</span><b style="color:var(--text-primary)">' + esc(sh.weapon.label) + '</b><span class="fs-hint">' + sh.iter.join('/') + ' • ' + esc(sh.damageText) + ' • ' + esc(sh.weapon.view.critText) + '</span></div>' +
      '<div class="fs-gear"><span class="fs-pill sky">Armor</span><b style="color:var(--text-primary)">' + esc(sh.armor.label) + '</b><span class="fs-hint">' + esc(sh.armor.view.armor.type) + ' • ACP ' + sh.armor.view.armor.acp + ' • ASF ' + sh.armor.view.armor.asf + '%</span></div>' +
      (sh.shield ? '<div class="fs-gear"><span class="fs-pill sky">Shield</span><b style="color:var(--text-primary)">' + esc(sh.shield.label) + '</b></div>' : '') +
      c.gear.map((g, i) => '<label class="fs-gear" style="cursor:pointer"><input type="checkbox" data-cbind="gear.' + i + '.on" data-t="bool"' + (g.on ? ' checked' : '') + '><span' + (g.on ? '' : ' class="fs-supp"') + '>' + esc(g.name) + '</span><span class="fs-hint">' + esc(g.mods.map(modShort).join(', ')) + '</span></label>').join('');
    // Defenses & badges
    const defs = [];
    sh.dr.forEach((d) => defs.push('<span class="fs-pill amber">DR ' + d.value + '/' + esc(d.bypass) + ' <span style="opacity:.6">· ' + esc(d.source) + '</span></span>'));
    sh.energy.forEach((x) => defs.push('<span class="fs-pill rose">' + esc(x.mode === 'Resistance' ? 'Resist ' + x.type + ' ' + x.value : x.type + ' ' + x.mode) + '</span>'));
    if (sh.sr) defs.push('<span class="fs-pill purple">SR ' + sh.sr + '</span>');
    if (sh.conceal) defs.push('<span class="fs-pill sky">' + sh.conceal + '% Miss Chance</span>');
    Object.keys(sh.locks).forEach((k) => { if (sh.locks[k] && k !== 'negLevel') defs.push('<span class="fs-pill rose">' + esc(LOCK_LABEL[k].split(' (')[0]) + '</span>'); });
    if (sh.negLevels) defs.push('<span class="fs-pill rose">Negative Levels ×' + sh.negLevels + '</span>');
    if (S.flatFooted) defs.push('<span class="fs-pill rose">Flat-Footed</span>');
    h += '<div class="fs-section-label">🛡️ Defenses, States & Tactical Badges</div><div class="fs-row">' + (defs.join('') || '<span class="fs-hint">None</span>') + '</div>' +
      (sh.badges.length ? '<div class="fs-row" style="margin-top:4px">' + sh.badges.map((b) => '<span class="fs-pill dim">' + esc(b) + '</span>').join('') + '</div>' : '') +
      (sh.conditional.length ? '<div class="fs-row" style="margin-top:4px"><span class="fs-hint">Conditional:</span>' + sh.conditional.map((m) => '<span class="fs-pill indigo">' + sgn(m.value) + ' ' + esc(m.type) + ' ' + esc(TARGET_LABEL[m.target] || m.target) + ' ' + esc(m.condition) + '</span>').join('') + '</div>' : '') +
      (sh.deities.length ? '<div class="fs-row" style="margin-top:4px">' + sh.deities.map((d) => '<span class="fs-pill amber">🏛️ ' + esc(entryName(d)) + ' (' + d.grants.deityAlign + ') — Cleric: ' + (clericLegal(d.grants.deityAlign, c.alignment) ? 'legal' : 'illegal') + '</span>').join('') + '</div>' : '');
    // Skills
    h += '<div class="fs-section-label">📜 Skills</div><div class="fs-row" style="gap:4px">' + sh.skills.map((s) => '<span class="fs-pill' + (open === 'sk_' + s.key ? ' indigo' : '') + '" data-action="toggle-bd" data-k="sk_' + s.key + '" style="cursor:pointer">' + esc(s.name) + ' <b style="color:var(--text-primary)">' + sgn(s.total) + '</b></span>').join('') + '</div>';
    // Prerequisite results
    const prq = [];
    if (S.entry.facets.indexOf('prereqs') >= 0 && S.entry.prereqs.length) prq.push([entryName(S.entry) + ' (Studio)', evalPrereqs(S.entry.prereqs, sh)]);
    S.effects.forEach((fx) => { if (fx.entry.facets.indexOf('prereqs') >= 0 && fx.entry.prereqs.length) prq.push([entryName(fx.entry), evalPrereqs(fx.entry.prereqs, sh)]); });
    if (prq.length) h += '<div class="fs-section-label">🏛️ Prerequisite Check Results</div>' + prq.map((p) => '<div class="fs-bd" style="margin-top:4px"><div class="fs-bd-row"><b style="color:var(--text-primary)">' + esc(p[0]) + '</b>' + passBadge(p[1].ok, p[1].ok ? 'Qualifies' : 'Prerequisites Not Met') + '</div>' +
      p[1].rows.map((r) => '<div class="fs-bd-row"><span class="src">' + r.alts.map((a) => '<span class="' + (a.ok ? 'fs-up' : 'fs-down') + '">' + esc(a.text) + '</span>').join(' <span class="fs-or">OR</span> ') + '</span><span>' + (r.ok ? '✓' : '✕') + '</span></div>').join('') + '</div>').join('');
    // Active effects tray
    h += '<div class="fs-section-label">✨ Active Effects / Equipped Creations (' + S.effects.length + ')</div>';
    if (!S.effects.length) h += '<div class="fs-hint">Apply a Studio creation to see live stacking vs suppression here.</div>';
    h += S.effects.map((fx) => {
      const en = fx.entry, bp = BP_BY_ID[en.blueprint] || { icon: '📌', name: 'Custom' }, l = en.lifecycle;
      const stackable = en.facets.indexOf('lifecycle') >= 0 && l.stackable;
      const inspect = S.ui.effectOpen[fx.uid];
      let body = '';
      if (inspect) {
        const single = derive([Object.assign({}, fx, { on: true })]);
        const baseOnly = derive([]);
        const rows = [['AC / Touch / Flat-Footed', baseOnly.ac.total + '/' + baseOnly.ac.touch + '/' + baseOnly.ac.ff, single.ac.total + '/' + single.ac.touch + '/' + single.ac.ff],
          ['Fort / Ref / Will', [baseOnly.saves.fort.total, baseOnly.saves.ref.total, baseOnly.saves.will.total].map(sgn).join('/'), [single.saves.fort.total, single.saves.ref.total, single.saves.will.total].map(sgn).join('/')],
          ['Melee / Ranged Attack', sgn(baseOnly.melee.total) + '/' + sgn(baseOnly.ranged.total), sgn(single.melee.total) + '/' + sgn(single.ranged.total)],
          ['Damage', baseOnly.damageText, single.damageText], ['Caster Level', baseOnly.cl.total, single.cl.total],
          ['DR / Resistances', baseOnly.dr.map((d) => d.value + '/' + d.bypass).concat(baseOnly.energy.map((x) => x.type + ' ' + x.value)).join(', ') || '—', single.dr.map((d) => d.value + '/' + d.bypass).concat(single.energy.map((x) => x.type + ' ' + x.value)).join(', ') || '—']];
        body = '<div class="fs-bd">' + rows.map((r) => '<div class="fs-bd-row"><span class="src">' + esc(r[0]) + '</span><span>' + esc(r[1]) + ' → <b' + (String(r[1]) !== String(r[2]) ? ' class="fs-up"' : '') + '>' + esc(r[2]) + '</b></span></div>').join('') +
          (en.facets.indexOf('prereqs') >= 0 && en.prereqs.length ? '<div class="fs-bd-row"><span class="src">Prerequisite Check</span>' + passBadge(evalPrereqs(en.prereqs, sh).ok) + '</div>' : '') +
          '<div class="fs-hint" style="margin-top:4px">' + esc(cardSummary(en, sh).join(' • ')) + '</div></div>';
      }
      return '<div class="fs-effect' + (fx.on ? '' : ' off') + '"><div class="fs-effect-top"><span>' + bp.icon + '</span><span class="fs-effect-name">' + esc(entryName(en)) + '</span>' + (fx.stacks > 1 ? '<span class="fs-pill rose">×' + fx.stacks + '</span>' : '') + effectStatus(fx, sh) + '</div>' +
        '<div class="fs-row" style="margin-top:5px;gap:4px">' + btn('fx-toggle', fx.on ? 'On' : 'Off', 'fs-xs' + (fx.on ? ' fs-emerald' : ''), { u: fx.uid }) +
        (stackable ? btn('fx-stack', '−', 'fs-xs', { u: fx.uid, d: -1 }) + '<span class="fs-pill">Stack ' + fx.stacks + '/' + l.maxStacks + '</span>' + btn('fx-stack', '+', 'fs-xs', { u: fx.uid, d: 1 }) : '') +
        (canUse(en) ? btn('fx-use', '⚡ Use', 'fs-xs fs-amber', { u: fx.uid }) : '') + (en.facets.indexOf('lifecycle') >= 0 && l.duration === 'saveEnds' && fx.on ? btn('fx-save', 'Attempt Save', 'fs-xs', { u: fx.uid }) : '') +
        btn('fx-inspect', inspect ? 'Hide Breakdown' : 'Inspect', 'fs-xs', { u: fx.uid }) + btn('fx-edit', 'Edit in Studio', 'fs-xs fs-primary', { u: fx.uid }) + btn('fx-remove', '×', 'fs-xs fs-ghost', { u: fx.uid }) + '</div>' + body + '</div>';
    }).join('');
    h += '<div class="fs-section-label">📜 Combat Log</div><div class="fs-log">' + S.log.slice(-12).reverse().map((x) => '<div>' + esc(x) + '</div>').join('') + '</div>';
    $('#fs-sheet').innerHTML = h;
    $('#fs-sheet-col').classList.toggle('fs-collapsed', !S.ui.sheetMobile);
  }

  // --------------------------------------------------------------------------
  // 12. Render orchestration
  // --------------------------------------------------------------------------
  function refreshSlots() {
    document.querySelectorAll('[data-live]').forEach((el) => { const fn = LIVE[el.dataset.live]; if (fn) el.innerHTML = fn(el.dataset.args || ''); });
  }
  function renderLive(o) {
    o = o || {};
    SHEET_CACHE = null;
    renderLiveHeader();
    refreshSlots();
    if (S.ui.jsonOpen) { const pre = $('#fs-json-pre'); if (pre) pre.textContent = JSON.stringify(exportEntry(S.entry), null, 2); }
    if (!o.skipSheet) renderSheet();
  }
  function renderAll() {
    SHEET_CACHE = null;
    renderTopbar(); renderLiveHeader(); renderFacets(); renderJson(); renderSheet();
  }
  function toast(msg, kind) {
    const wrap = $('#fs-toasts'); if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'fs-toast ' + (kind || 'ok');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.remove(); }, 3200);
  }
  function log(msg) { S.log.push('R' + S.round + ' — ' + msg); if (S.log.length > 60) S.log.shift(); }

  // --------------------------------------------------------------------------
  // 13. Actions (delegated data-action routing)
  // --------------------------------------------------------------------------
  const fxBy = (el) => S.effects.find((f) => f.uid === el.dataset.u);
  function loadEntry(en, bpId, presetId) {
    S.entry = en; S.activeBlueprint = bpId; S.activePreset = presetId || ''; S.ui.editingEffect = ''; S.ui.cardOpen = {}; S.ui.facetOpen = {}; S.ui.attachOpen = false;
  }
  function onSet(path, v) {
    const en = S.entry;
    if (path === 'chassis.baseId') {
      if (en.chassis.kind === 'weapon') { en.chassis.weapon = weaponOverrides(v); en.chassis.enchantments = en.chassis.enchantments.filter((id) => enchApplies(ENCH_BY_ID[id], 'weapon')); }
      else {
        en.chassis.armor = armorOverrides(v);
        const k = (ARMORS.find((a) => a.id === v) || {}).kind;
        en.chassis.enchantments = en.chassis.enchantments.filter((id) => enchApplies(ENCH_BY_ID[id], k));
        if (en.chassis.crystal.id && !crystalApplies(CRYSTAL_BY_ID[en.chassis.crystal.id], k)) en.chassis.crystal.id = '';
      }
    } else if (path === 'chassis.kind') {
      const keep = { material: en.chassis.material, enhancement: en.chassis.enhancement };
      en.chassis = Object.assign(blankChassis(v), keep);
    } else if (path === 'progression.mode') {
      en.progression.maxLevel = v === 'prestige' ? 10 : 20;
      en.progression.testLevel = Math.min(en.progression.testLevel, en.progression.maxLevel);
    } else if (/^prereqs\.\d+\.alts\.\d+\.kind$/.test(path)) {
      const alt = getPath(en, path.replace(/\.kind$/, ''));
      alt.min = { ability: 13, bab: 1, skill: 4, level: 1 }[v] || alt.min;
    }
  }
  function resolveDelivery(en, sh) {
    const d = en.delivery, parts = [entryName(en)];
    if (d.diceOn) {
      const count = d.dice.perCL ? Math.min(num(d.dice.max, 10), sh.cl.total) * num(d.dice.count, 1) : num(d.dice.count, 1);
      const r = rollDice(count + d.dice.die);
      parts.push(count + d.dice.die + ' ' + d.dice.type + ' = ' + r.total + ' [' + r.rolls.join(',') + ']');
    }
    if (d.saveOn) parts.push(d.save.type + ' ' + d.save.effect.toLowerCase() + ' DC ' + saveDC(en, sh));
    if (d.rangeOn && d.area) parts.push(d.area);
    return parts.join(' — ');
  }
  function makeEffect(en, sh) {
    const pe = previewEffect(en);
    return { uid: uid('fx'), entry: pe.entry, source: clone(en), on: true, stacks: 1, roundsLeft: en.facets.indexOf('lifecycle') >= 0 ? durationRounds(en, sh) : null, cooldown: 0, usesLeft: num(en.lifecycle.perDay), charges: num(en.lifecycle.charges), expired: false };
  }

  const ACT = {
    'toggle-card': (el) => { const k = el.dataset.key; S.ui.cardOpen[k] = !S.ui.cardOpen[k]; renderFacets(); },
    'toggle-facet': (el, ev) => { if (ev.target.closest('[data-action="detach-facet"]')) return; const k = el.dataset.k; S.ui.facetOpen[k] = S.ui.facetOpen[k] === false; renderFacets(); },
    'detach-facet': (el) => { S.entry.facets = S.entry.facets.filter((f) => f !== el.dataset.k); toast('Detached Facet ' + FACET_BY_KEY[el.dataset.k].n + ': ' + FACET_BY_KEY[el.dataset.k].title, 'warn'); renderAll(); },
    'attach-facet': (el) => { const k = el.dataset.k; if (S.entry.facets.indexOf(k) < 0) S.entry.facets.push(k); S.ui.facetOpen[k] = true; if (k === 'chassis' && !S.entry.chassis) S.entry.chassis = blankChassis('weapon'); toast('Attached Facet ' + FACET_BY_KEY[k].n + ': ' + FACET_BY_KEY[k].title); renderAll(); },
    'toggle-attach': () => { S.ui.attachOpen = !S.ui.attachOpen; renderFacets(); },
    'toggle-json': (el, ev) => { if (ev.target.closest('[data-action="copy-json"]')) return; S.ui.jsonOpen = !S.ui.jsonOpen; renderJson(); },
    'copy-json': () => {
      const txt = JSON.stringify(exportEntry(S.entry), null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Canonical V2.5 JSON copied'), () => toast('Clipboard unavailable — select the JSON manually', 'warn'));
      else toast('Clipboard unavailable — select the JSON manually', 'warn');
    },
    'load-preset': (el) => { const p = PRESETS.find((x) => x.id === el.dataset.id); if (!p) return; const en = p.build(); loadEntry(en, en.blueprint, p.id); toast('Preset loaded: ' + p.label); renderAll(); },
    'set-blueprint': (el) => { loadEntry(blankEntry(el.dataset.id), el.dataset.id); renderAll(); },
    'new-entry': () => { loadEntry(blankEntry(S.activeBlueprint in BP_BY_ID ? S.activeBlueprint : 'weapon'), S.activeBlueprint in BP_BY_ID ? S.activeBlueprint : 'weapon'); renderAll(); },
    'load-custom-bp': (el) => { const b = S.customBlueprints.find((x) => x.id === el.dataset.id); if (!b) return; const en = clone(b.entry); en.id = uid('custom'); loadEntry(en, b.id); toast('Blueprint loaded: ' + b.name); renderAll(); },
    'delete-custom-bp': (el) => { S.customBlueprints = S.customBlueprints.filter((x) => x.id !== el.dataset.id); saveLS(); toast('Blueprint deleted', 'warn'); renderTopbar(); },
    'toggle-bp-save': () => { S.ui.bpSaveOpen = !S.ui.bpSaveOpen; S.ui.newBpName = S.ui.newBpName || (S.entry.name || ''); renderTopbar(); const i = document.querySelector('[data-uibind="newBpName"]'); if (i) i.focus(); },
    'save-blueprint': () => {
      const name = String(S.ui.newBpName || '').trim();
      if (!name) { toast('Name the blueprint first', 'warn'); return; }
      const b = { id: uid('cbp'), name: name, base: S.entry.blueprint, facets: S.entry.facets.slice(), entry: clone(S.entry) };
      S.customBlueprints.push(b); S.activeBlueprint = b.id; S.ui.bpSaveOpen = false; S.ui.newBpName = ''; saveLS();
      toast('📌 Blueprint "' + name + '" saved (' + b.facets.length + ' facets)'); renderTopbar();
    },
    'toggle-sheet-mobile': () => { S.ui.sheetMobile = !S.ui.sheetMobile; renderTopbar(); renderSheet(); },
    'set-buy': (el) => { S.ui.buyMode = el.dataset.v; renderLiveHeader(); },
    'apply-entry': () => {
      const en = S.entry, sh = derive(benchEffects(S.ui.editingEffect));
      if (S.ui.editingEffect) {
        const fx = S.effects.find((f) => f.uid === S.ui.editingEffect);
        if (fx) { const pe = previewEffect(en); fx.entry = pe.entry; fx.source = clone(en); log('Updated ' + entryName(en)); toast('Active effect updated: ' + entryName(en)); }
        S.ui.editingEffect = ''; renderAll(); return;
      }
      if (en.facets.indexOf('prereqs') >= 0 && en.prereqs.length && !evalPrereqs(en.prereqs, sh).ok) toast('Prerequisites Not Met — applied anyway for testing', 'warn');
      const hasDelivery = en.facets.indexOf('delivery') >= 0;
      if (hasDelivery && !en.delivery.linkedBuff && !(en.facets.indexOf('lifecycle') >= 0 && en.lifecycle.usage !== 'atwill') && en.facets.indexOf('chassis') < 0) {
        const msg = resolveDelivery(en, sh); log('Cast ' + msg); toast('🔮 ' + msg); renderSheet(); return;
      }
      if (en.facets.indexOf('chassis') >= 0) {
        const v = chassisView(en.chassis);
        if (S.ui.buyMode === 'buy') {
          if (S.char.gold < v.gpTotal) { toast('Not enough gold: need ' + gp(v.gpTotal) + ', have ' + gp(S.char.gold), 'err'); return; }
          S.char.gold -= v.gpTotal; log('Bought ' + v.name + ' for ' + gp(v.gpTotal));
        }
        const slot = v.isW ? 'weapon' : v.kind;
        S.effects.forEach((f) => { if (f.on && f.entry.facets.indexOf('chassis') >= 0) { const fv = chassisView(f.entry.chassis); if ((fv.isW ? 'weapon' : fv.kind) === slot) f.on = false; } });
      }
      const fx = makeEffect(en, sh);
      S.effects.push(fx);
      let msg = (en.facets.indexOf('chassis') >= 0 ? 'Equipped ' : hasDelivery && en.delivery.linkedBuff ? 'Cast ' : 'Applied ') + entryName(en);
      if (hasDelivery && en.delivery.linkedBuff && (en.delivery.diceOn || en.delivery.saveOn)) msg += ' — ' + resolveDelivery(en, sh);
      if (fx.roundsLeft != null) msg += ' (' + fx.roundsLeft + ' rounds)';
      log(msg); toast('⚡ ' + msg); renderAll();
    },
    'add-tag': (el) => { addTag(el.dataset.tag); },
    'add-tag-draft': () => { const t = S.ui.tagDraft; S.ui.tagDraft = ''; addTag(t); },
    'remove-tag': (el) => { S.entry.tags.splice(num(el.dataset.i), 1); renderAll(); },
    'add-prereq': () => { const r = { id: uid('p'), alts: [ALT({})] }; S.entry.prereqs.push(r); S.ui.cardOpen['pr:' + r.id] = true; renderAll(); },
    'add-or': (el) => { const r = S.entry.prereqs[num(el.dataset.ri)]; r.alts.push(ALT({ kind: 'skill', skill: 'skill.tumble', min: 5 })); S.ui.cardOpen['pr:' + r.id] = true; renderAll(); },
    'remove-alt': (el) => { const ri = num(el.dataset.ri), r = S.entry.prereqs[ri]; r.alts.splice(num(el.dataset.ai), 1); if (!r.alts.length) S.entry.prereqs.splice(ri, 1); renderAll(); },
    'remove-prereq': (el) => { S.entry.prereqs.splice(num(el.dataset.ri), 1); renderAll(); },
    'toggle-range': () => { const w = S.entry.chassis.weapon; w.rangeOn = !w.rangeOn; if (w.rangeOn && !num(w.range)) w.range = 10; renderAll(); },
    'toggle-ench': (el) => {
      const ch = S.entry.chassis, id = el.dataset.id, i = ch.enchantments.indexOf(id);
      if (i >= 0) { ch.enchantments.splice(i, 1); renderAll(); return; }
      const e = ENCH_BY_ID[id], v = chassisView(ch);
      if (e.plus && v.enh < 1) { toast('Prerequisites Not Met: ' + e.name + ' requires at least a +1 enhancement bonus', 'err'); return; }
      if (e.plus && v.effective + e.plus > 10) { toast(e.name + ' would exceed the +10 effective cap (+' + (v.effective + e.plus) + ')', 'err'); return; }
      ch.enchantments.push(id); renderAll();
    },
    'add-dmg': () => { const d = S.ui.dmgDraft; const p = { id: uid('d'), count: num(d.count, 1), die: d.die, type: d.type, crit: d.crit, cond: '' }; S.entry.chassis.damageParts.push(p); renderAll(); },
    'remove-dmg': (el) => { S.entry.chassis.damageParts.splice(num(el.dataset.i), 1); renderAll(); },
    'add-mod': () => { const m = M('atk.all', 1, 'Untyped'); S.entry.modifiers.push(m); S.ui.cardOpen['m:' + m.id] = true; renderAll(); },
    'remove-mod': (el) => { S.entry.modifiers.splice(num(el.dataset.i), 1); renderAll(); },
    'toggle-custom-type': () => { S.ui.customTypeOpen = !S.ui.customTypeOpen; renderFacets(); },
    'save-custom-type': () => {
      const ct = S.ui.customType, name = String(ct.name || '').trim();
      if (!name) { toast('Name the bonus type first', 'warn'); return; }
      if (allBonusTypes().some((b) => b.id.toLowerCase() === name.toLowerCase())) { toast('Bonus type "' + name + '" already exists', 'warn'); return; }
      S.customBonusTypes.push({ id: name, stacks: !!ct.stacks, lostFF: !!ct.lostFF }); saveLS();
      S.ui.customType = { name: '', stacks: false, lostFF: false }; S.ui.customTypeOpen = false; toast('Custom bonus type "' + name + '" defined'); renderAll();
    },
    'remove-custom-type': (el) => { S.customBonusTypes.splice(num(el.dataset.i), 1); saveLS(); renderAll(); },
    'add-sub': () => { const s = { id: uid('s'), save: 'will', from: 'wis', to: 'cha', op: 'replace' }; S.entry.substitutions.push(s); S.ui.cardOpen['s:' + s.id] = true; renderAll(); },
    'remove-sub': (el) => { S.entry.substitutions.splice(num(el.dataset.i), 1); renderAll(); },
    'add-spellcls': () => { S.entry.delivery.spell.classes.push({ cls: 'Clr', lvl: 1 }); renderAll(); },
    'remove-spellcls': (el) => { S.entry.delivery.spell.classes.splice(num(el.dataset.i), 1); renderAll(); },
    'toggle-comp': (el) => { const c = S.entry.delivery.spell.comps; c[el.dataset.k] = !c[el.dataset.k]; renderAll(); },
    'add-dr': () => { const x = { id: uid('dr'), value: 5, bypass: 'magic' }; S.entry.defenses.dr.push(x); S.ui.cardOpen['dr:' + x.id] = true; renderAll(); },
    'remove-dr': (el) => { S.entry.defenses.dr.splice(num(el.dataset.i), 1); renderAll(); },
    'add-en': () => { const x = { id: uid('en'), type: 'Fire', mode: 'Resistance', value: 10 }; S.entry.defenses.energy.push(x); S.ui.cardOpen['en:' + x.id] = true; renderAll(); },
    'remove-en': (el) => { S.entry.defenses.energy.splice(num(el.dataset.i), 1); renderAll(); },
    'gen-pattern': () => { const p = S.entry.progression; if (!String(p.pattern.name || '').trim()) { toast('Name the repeating feature first', 'warn'); return; } applyPattern(p, p.pattern); toast('Generated "' + p.pattern.name + '" rows'); renderAll(); },
    'add-feature': (el) => { const v = String(el.value || '').trim(); if (!v) return; S.entry.progression.levels[num(el.dataset.l)].features.push(v); renderAll(); const n = document.querySelector('[data-enter="add-feature"][data-l="' + el.dataset.l + '"]'); if (n) n.focus(); },
    'remove-feature': (el) => { S.entry.progression.levels[num(el.dataset.l)].features.splice(num(el.dataset.f), 1); renderAll(); },
    'set-deity-align': (el) => { S.entry.grants.deityAlign = el.dataset.a; renderAll(); },
    'toggle-domain': (el) => { const d = S.entry.grants.domains, i = d.indexOf(el.dataset.d); if (i >= 0) d.splice(i, 1); else d.push(el.dataset.d); renderAll(); },
    'add-grant': () => { const g = { id: uid('g'), count: 1, pool: S.livingTags[0] || '#FighterBonus', level: 1 }; S.entry.grants.featGrants.push(g); S.ui.cardOpen['g:' + g.id] = true; renderAll(); },
    'remove-grant': (el) => { S.entry.grants.featGrants.splice(num(el.dataset.i), 1); renderAll(); },

    // ---- Test Bench ----
    'toggle-bd': (el) => { S.ui.sheetOpen.k = S.ui.sheetOpen.k === el.dataset.k ? '' : el.dataset.k; renderSheet(); },
    'hp-delta': (el) => { const sh = derive(S.effects); S.char.hp = Math.min(sh.hpMax, S.char.hp + num(el.dataset.v)); renderSheet(); },
    'toggle-ff': () => { S.flatFooted = !S.flatFooted; log('Flat-Footed ' + (S.flatFooted ? 'ON — Dodge bonuses and DEX to AC lost' : 'OFF')); renderLive(); },
    'reset-bench': () => { S.char = baseCharacter(); S.effects = []; S.round = 1; S.flatFooted = false; S.ui.editingEffect = ''; S.log = ['Round 1 — Test Bench reset.']; renderAll(); },
    'next-round': () => {
      S.round++;
      const msgs = [];
      S.effects.forEach((fx) => {
        if (!fx.on) return;
        const en = fx.entry, l = en.lifecycle, name = entryName(en);
        if (en.facets.indexOf('lifecycle') >= 0 && l.ongoingOn) {
          const st = Math.max(1, fx.stacks);
          if (l.ongoing.kind === 'dot') { let dmg = 0; for (let i = 0; i < st; i++) dmg += rollDice(l.ongoing.dice).total; S.char.hp -= dmg; msgs.push('🩸 ' + name + ': ' + dmg + ' ' + l.ongoing.type + ' damage'); }
          else { const hpMax = derive(S.effects).hpMax, before = S.char.hp; S.char.hp = Math.min(hpMax, S.char.hp + num(l.ongoing.value) * st); msgs.push('💚 ' + name + ': Fast Healing +' + (S.char.hp - before)); }
        }
        if (fx.cooldown > 0) { fx.cooldown--; if (!fx.cooldown) msgs.push('⚡ ' + name + ' recharged'); }
        if (fx.roundsLeft != null) { fx.roundsLeft--; if (fx.roundsLeft <= 0) { fx.on = false; fx.expired = true; fx.roundsLeft = 0; msgs.push('⏳ ' + name + ' expired'); } }
      });
      log('Next Round' + (msgs.length ? ': ' + msgs.join('; ') : ''));
      if (msgs.length) toast('Round ' + S.round + ': ' + msgs.join(' • '), 'ok');
      renderLive();
    },
    'fx-toggle': (el) => {
      const fx = fxBy(el); if (!fx) return;
      fx.on = !fx.on; fx.expired = false;
      if (fx.on && fx.entry.facets.indexOf('chassis') >= 0) {
        const v = chassisView(fx.entry.chassis), slot = v.isW ? 'weapon' : v.kind;
        S.effects.forEach((f) => { if (f !== fx && f.on && f.entry.facets.indexOf('chassis') >= 0) { const fv = chassisView(f.entry.chassis); if ((fv.isW ? 'weapon' : fv.kind) === slot) f.on = false; } });
      }
      if (fx.on && fx.roundsLeft === 0) fx.roundsLeft = durationRounds(fx.entry, derive(S.effects));
      renderLive();
    },
    'fx-stack': (el) => { const fx = fxBy(el); if (!fx) return; const max = num(fx.entry.lifecycle.maxStacks, 1); fx.stacks = Math.max(1, Math.min(max, fx.stacks + num(el.dataset.d))); log(entryName(fx.entry) + ' stack ×' + fx.stacks); renderLive(); },
    'fx-use': (el) => {
      const fx = fxBy(el); if (!fx) return;
      const en = fx.entry, l = en.lifecycle, sh = derive(S.effects);
      if (!fx.on) { toast(entryName(en) + ' is switched off', 'warn'); return; }
      if (l.usage === 'cooldown' && fx.cooldown > 0) { toast(entryName(en) + ' is recharging (' + fx.cooldown + ' rounds)', 'warn'); return; }
      if (l.usage === 'perDay') { if (fx.usesLeft <= 0) { toast('No uses left today', 'warn'); return; } fx.usesLeft--; }
      if (l.usage === 'charges') { if (fx.charges <= 0) { toast('No charges left', 'warn'); return; } fx.charges--; }
      let msg = resolveDelivery(en, sh);
      if (l.usage === 'cooldown') { const r = rollDice(l.cooldown); fx.cooldown = Math.max(1, r.total); msg += ' — recharge ' + l.cooldown + ' = ' + fx.cooldown + ' rounds'; }
      log('⚡ ' + msg); toast('⚡ ' + msg); renderSheet();
    },
    'fx-save': (el) => {
      const fx = fxBy(el); if (!fx) return;
      const sh = derive(S.effects), en = fx.entry;
      const type = en.facets.indexOf('delivery') >= 0 && en.delivery.saveOn ? en.delivery.save.type : 'Will';
      const key = { Fortitude: 'fort', Reflex: 'ref', Will: 'will' }[type];
      const dc = en.facets.indexOf('delivery') >= 0 && en.delivery.saveOn ? saveDC(en, sh) : 15;
      const r = rollDice('1d20').total, tot = r + sh.saves[key].total;
      const ok = tot >= dc;
      if (ok) { fx.on = false; fx.expired = true; }
      log(type + ' save vs ' + entryName(en) + ': d20 ' + r + ' ' + sgn(sh.saves[key].total) + ' = ' + tot + ' vs DC ' + dc + (ok ? ' — ends' : ' — persists'));
      toast(type + ' save ' + tot + ' vs DC ' + dc + (ok ? ' — effect ends' : ' — failed'), ok ? 'ok' : 'warn'); renderLive();
    },
    'fx-inspect': (el) => { S.ui.effectOpen[el.dataset.u] = !S.ui.effectOpen[el.dataset.u]; renderSheet(); },
    'fx-edit': (el) => {
      const fx = fxBy(el); if (!fx) return;
      const en = clone(fx.source || fx.entry);
      loadEntry(en, en.blueprint); S.ui.editingEffect = fx.uid;
      toast('Loaded "' + entryName(en) + '" into the Studio — Update to push changes'); renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    'fx-remove': (el) => { S.effects = S.effects.filter((f) => f.uid !== el.dataset.u); if (S.ui.editingEffect === el.dataset.u) S.ui.editingEffect = ''; renderAll(); }
  };

  function addTag(raw) {
    let t = String(raw || '').trim().replace(/\s+/g, '');
    if (!t || t === '#') { toast('Type a tag such as #ShadowcastPool', 'warn'); return; }
    if (t[0] !== '#') t = '#' + t;
    if (S.entry.tags.indexOf(t) < 0) S.entry.tags.push(t);
    if (S.livingTags.indexOf(t) < 0) { S.livingTags.push(t); saveLS(); toast('Living Tag Pool ' + t + ' created — now selectable in Prerequisites & Bonus Feat Grants'); }
    renderAll();
  }

  // --------------------------------------------------------------------------
  // 14. Event wiring (single delegated root)
  // --------------------------------------------------------------------------
  function handleBind(el, full) {
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.t === 'num') v = num(v);
    if (el.dataset.bind) { setPath(S.entry, el.dataset.bind, v); onSet(el.dataset.bind, v); }
    else if (el.dataset.uibind) setPath(S.ui, el.dataset.uibind, v);
    else if (el.dataset.cbind) setPath(S.char, el.dataset.cbind, v);
    else return;
    if (full) renderAll(); else renderLive(el.dataset.cbind ? { skipSheet: true } : {});
  }
  function init() {
    const root = document.getElementById('fs-app');
    root.addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-action]');
      if (!el || !root.contains(el)) return;
      const fn = ACT[el.dataset.action];
      if (fn) fn(el, ev);
    });
    root.addEventListener('input', (ev) => {
      const el = ev.target;
      if (el.type === 'checkbox' || el.tagName === 'SELECT') return;
      handleBind(el, false);
    });
    root.addEventListener('change', (ev) => {
      const el = ev.target;
      if (el.type === 'checkbox' || el.tagName === 'SELECT') handleBind(el, true);
      else if (el.dataset.cbind) renderAll();
    });
    root.addEventListener('keydown', (ev) => {
      const el = ev.target;
      if (ev.key !== 'Enter' || !el.dataset || !el.dataset.enter) return;
      ev.preventDefault();
      const fn = ACT[el.dataset.enter];
      if (fn) fn(el, ev);
    });
    const first = PRESETS[0].build();
    loadEntry(first, first.blueprint, PRESETS[0].id);
    renderAll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // Test hook (read-only API for QA harnesses)
  window.ForgeSandbox = { state: S, derive: derive, chassisView: chassisView, exportEntry: exportEntry, presets: PRESETS.map((p) => p.id), loadPreset: (id) => { const p = PRESETS.find((x) => x.id === id); if (p) { const en = p.build(); loadEntry(en, en.blueprint, id); renderAll(); } }, act: (name, data) => { const el = document.createElement('div'); Object.keys(data || {}).forEach((k) => { el.dataset[k] = data[k]; }); ACT[name](el, { target: el }); } };
})();
