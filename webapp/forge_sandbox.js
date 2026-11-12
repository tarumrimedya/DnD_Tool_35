/* ============================================================================
 * LIVING FACET STUDIO — Rule Forge 3.0 Sandbox (Stage 1.2)
 * Streamlined Spotlight UI & Nested Multi-Power Composer.
 * Self-contained: offline seed catalog over file://, real SrdCompendium +
 * master_db.json over http://. No blocking browser dialogs and no inline
 * handlers — all routing via delegated data-action / data-spot attributes.
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
  const gp = (n) => Math.round(num(n)).toLocaleString('en-US') + ' gp';
  const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const cap1 = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
  const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const DICE_SVG = '<svg class="fs-dice-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 2 7.5 9.5h9zM3 7l4.5 2.5M21 7l-4.5 2.5M7.5 9.5 12 17l4.5-7.5M12 17v5M3 17l4.5-7.5M21 17l-4.5-7.5M3 17h18"/></svg>';

  // --------------------------------------------------------------------------
  // 1. Taxonomy & offline seed catalog (DMG / PHB / MIC)
  // --------------------------------------------------------------------------
  const ABILITIES = [['str', 'Strength'], ['dex', 'Dexterity'], ['con', 'Constitution'], ['int', 'Intelligence'], ['wis', 'Wisdom'], ['cha', 'Charisma']];
  const ABIL_KEYS = ABILITIES.map((a) => a[0]);
  const SKILLS = [
    ['Appraise', 'int'], ['Balance', 'dex'], ['Bluff', 'cha'], ['Climb', 'str'], ['Concentration', 'con'], ['Craft', 'int'], ['Decipher Script', 'int'], ['Diplomacy', 'cha'],
    ['Disable Device', 'int'], ['Disguise', 'cha'], ['Escape Artist', 'dex'], ['Forgery', 'int'], ['Gather Information', 'cha'], ['Handle Animal', 'cha'], ['Heal', 'wis'], ['Hide', 'dex'],
    ['Intimidate', 'cha'], ['Jump', 'str'], ['Knowledge', 'int'], ['Listen', 'wis'], ['Move Silently', 'dex'], ['Open Lock', 'dex'], ['Perform', 'cha'], ['Profession', 'wis'],
    ['Ride', 'dex'], ['Search', 'int'], ['Sense Motive', 'wis'], ['Sleight of Hand', 'dex'], ['Speak Language', 'int'], ['Spellcraft', 'int'], ['Spot', 'wis'], ['Survival', 'wis'],
    ['Swim', 'str'], ['Tumble', 'dex'], ['Use Magic Device', 'cha'], ['Use Rope', 'dex']
  ];
  const skillKey = (name) => 'skill.' + slug(name);
  const SKILL_BY_KEY = {}; SKILLS.forEach((s) => { SKILL_BY_KEY[skillKey(s[0])] = { name: s[0], ability: s[1] }; });
  const TARGET_GROUPS = [
    ['Abilities', ABILITIES.map((a) => [a[0], a[1]])],
    ['Armor Class', [['ac.total', 'AC (All)'], ['ac.touch', 'Touch AC only'], ['ac.flatFooted', 'Flat-Footed AC only'], ['ac.armor', 'Armor Bonus'], ['ac.shield', 'Shield Bonus'], ['ac.natural', 'Natural Armor'], ['ac.deflection', 'Deflection'], ['ac.dodge', 'Dodge']]],
    ['Saving Throws', [['save.all', 'All Saving Throws'], ['save.fort', 'Fortitude'], ['save.ref', 'Reflex'], ['save.will', 'Will']]],
    ['Combat', [['atk.all', 'Attack Rolls (All)'], ['atk.melee', 'Melee Attack'], ['atk.ranged', 'Ranged Attack'], ['dmg.all', 'Damage (All)'], ['dmg.melee', 'Melee Damage'], ['initiative', 'Initiative'], ['speed.land', 'Land Speed (ft.)'], ['casterLevel', 'Caster Level'], ['hp.temp', 'Temporary Hit Points'], ['grapple', 'Grapple']]],
    ['Skills (36)', [['skill.all', 'All Skills']].concat(SKILLS.map((s) => [skillKey(s[0]), s[0]]))]
  ];
  const TARGET_LABEL = {}; TARGET_GROUPS.forEach((g) => g[1].forEach((t) => { TARGET_LABEL[t[0]] = t[1]; }));
  const BONUS_TYPES = [
    { id: 'Untyped', stacks: true }, { id: 'Dodge', stacks: true, lostFF: true }, { id: 'Circumstance', stacks: true }, { id: 'Penalty', stacks: true },
    { id: 'Enhancement' }, { id: 'Luck' }, { id: 'Morale' }, { id: 'Sacred' }, { id: 'Profane' }, { id: 'Insight' }, { id: 'Competence' }, { id: 'Resistance' },
    { id: 'Deflection' }, { id: 'Alchemical' }, { id: 'Inherent', cap: 5 }, { id: 'Armor' }, { id: 'Armor Enhancement' }, { id: 'Shield' }, { id: 'Shield Enhancement' },
    { id: 'Natural Armor' }, { id: 'Natural Armor Enhancement' }, { id: 'Racial' }, { id: 'Size' }, { id: 'Exalted' }, { id: 'Perfection' }
  ];
  const FORMULAS = [['flat', 'Flat Value'], ['@level', '= Character Level (@level)'], ['floor(@level/2)', '= Half Level (floor(@level/2))'], ['@cl', '= Caster Level (@cl)'],
    ['@strMod', '= STR modifier'], ['@dexMod', '= DEX modifier'], ['@conMod', '= CON modifier'], ['@intMod', '= INT modifier'], ['@wisMod', '= WIS modifier'], ['@chaMod', '= CHA modifier']];
  const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Force', 'Holy', 'Unholy', 'Positive', 'Negative', 'Precision', 'Vile', 'Nonlethal', 'Untyped', 'Healing'];
  const DIE_LIST = ['1', '1d2', '1d3', '1d4', '1d6', '1d8', '1d10', '1d12', '2d4', '2d6', '2d8', '2d10', '3d6', '4d6', '6d6', '6d8', 'd4', 'd6', 'd8', 'd10', 'd12', 'flat'];
  const ENERGY = ['Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Force'];
  const DR_BYPASS = ['magic', 'adamantine', 'cold iron', 'silver', 'evil', 'good', 'lawful', 'chaotic', '-'];
  const ACTIONS = ['Standard', 'Full-Round', 'Move', 'Swift', 'Immediate', 'Free', 'Reaction', 'Passive'];
  const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation', 'Universal'];
  const DESCRIPTORS = ['Acid', 'Air', 'Chaotic', 'Cold', 'Darkness', 'Death', 'Earth', 'Electricity', 'Evil', 'Fear', 'Fire', 'Force', 'Good', 'Language-Dependent', 'Lawful', 'Light', 'Mind-Affecting', 'Sonic', 'Water', 'Teleportation', 'Shadow'];
  const SPELL_CLASSES = ['Sor/Wiz', 'Clr', 'Drd', 'Brd', 'Pal', 'Rgr', 'Adept', 'Sha', 'War Mage', 'Wu Jen'];
  const RANGES = ['Personal', 'Touch', 'Close (25 ft. + 5 ft./2 levels)', 'Medium (100 ft. + 10 ft./level)', 'Long (400 ft. + 40 ft./level)', '30 ft.', '60 ft.', 'Unlimited', 'See text'];
  const AREAS = ['30-ft. Cone', '60-ft. Line', '20-ft.-radius Spread', '10-ft.-radius Burst', 'One creature', 'One or more rays', 'You', 'One creature/level'];
  const ALIGNS = ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE'];
  const ALIGN_NAMES = { LG: 'Lawful Good', NG: 'Neutral Good', CG: 'Chaotic Good', LN: 'Lawful Neutral', N: 'True Neutral', CN: 'Chaotic Neutral', LE: 'Lawful Evil', NE: 'Neutral Evil', CE: 'Chaotic Evil' };
  const ALIGN_REQS = ALIGNS.concat(['Any Good', 'Any Evil', 'Any Lawful', 'Any Chaotic', 'Any Non-Good', 'Any Non-Evil', 'Any Non-Lawful', 'Any Non-Chaotic', 'Any Neutral']);
  const ITEM_SUBTYPES = ['Weapon', 'Armor', 'Shield', 'Wondrous Item', 'Ring', 'Rod', 'Staff', 'Wand', 'Potion / Oil', 'Scroll', 'Artifact / Relic'];
  const BODY_SLOTS = ['Head', 'Eyes', 'Neck', 'Torso', 'Body / Robe', 'Waist / Belt', 'Shoulders / Cloak', 'Arms / Bracers', 'Hands / Gloves', 'Ring', 'Feet / Boots', 'Held', 'Slotless'];
  const STANDARD_TAGS = [
    ['Feat Pools', ['#FighterBonus', '#WizardBonus', '#Metamagic', '#ItemCreation', '#Reserve', '#Divine', '#Tactical', '#Exalted', '#Vile', '#Draconic', '#General']],
    ['Item / Boon', ['#DMGrant', '#Relic', '#Consumable', '#Artifact', '#Weapon', '#Armor']],
    ['Descriptors', ['#Fire', '#Cold', '#Acid', '#Electricity', '#Sonic', '#Force', '#MindAffecting', '#Fear', '#Teleportation']]
  ];
  const STD_TAG_SET = new Set(STANDARD_TAGS.flatMap((g) => g[1]));

  // [id, name, cost, dice, critRange, critMult, category, handed, dmgType, weight, range, wooden, ranged]
  const WEAPONS = [
    ['dagger', 'Dagger', 2, '1d4', 19, 2, 'Simple', 'Light', 'Piercing', 1, 10, 0, 0], ['mace_heavy', 'Mace, Heavy', 12, '1d8', 20, 2, 'Simple', 'One-Handed', 'Bludgeoning', 8, 0, 0, 0],
    ['quarterstaff', 'Quarterstaff', 0, '1d6', 20, 2, 'Simple', 'Two-Handed', 'Bludgeoning', 4, 0, 1, 0], ['spear', 'Spear', 2, '1d8', 20, 3, 'Simple', 'Two-Handed', 'Piercing', 6, 20, 0, 0],
    ['crossbow_light', 'Crossbow, Light', 35, '1d8', 19, 2, 'Simple', 'Two-Handed', 'Piercing', 4, 80, 0, 1], ['longsword', 'Longsword', 15, '1d8', 19, 2, 'Martial', 'One-Handed', 'Slashing', 4, 0, 0, 0],
    ['scimitar', 'Scimitar', 15, '1d6', 18, 2, 'Martial', 'One-Handed', 'Slashing', 4, 0, 0, 0], ['rapier', 'Rapier', 20, '1d6', 18, 2, 'Martial', 'One-Handed', 'Piercing', 2, 0, 0, 0],
    ['battleaxe', 'Battleaxe', 10, '1d8', 20, 3, 'Martial', 'One-Handed', 'Slashing', 6, 0, 0, 0], ['warhammer', 'Warhammer', 12, '1d8', 20, 3, 'Martial', 'One-Handed', 'Bludgeoning', 5, 0, 0, 0],
    ['greatsword', 'Greatsword', 50, '2d6', 19, 2, 'Martial', 'Two-Handed', 'Slashing', 8, 0, 0, 0], ['greataxe', 'Greataxe', 20, '1d12', 20, 3, 'Martial', 'Two-Handed', 'Slashing', 12, 0, 0, 0],
    ['longbow', 'Longbow', 75, '1d8', 20, 3, 'Martial', 'Two-Handed', 'Piercing', 3, 100, 1, 1], ['bastard_sword', 'Bastard Sword', 35, '1d10', 19, 2, 'Exotic', 'One-Handed', 'Slashing', 6, 0, 0, 0],
    ['katana', 'Katana (OA, masterwork bastard sword)', 400, '1d10', 19, 2, 'Exotic', 'One-Handed', 'Slashing', 6, 0, 0, 0], ['spiked_chain', 'Spiked Chain', 25, '2d4', 20, 2, 'Exotic', 'Two-Handed', 'Piercing', 10, 0, 0, 0]
  ].map((w) => ({ id: w[0], name: w[1], cost: w[2], dice: w[3], critRange: w[4], critMult: w[5], category: w[6], handed: w[7], dmgType: w[8], weight: w[9], range: w[10], wooden: !!w[11], ranged: !!w[12], src: 'Seed' }));

  // [id, name, cost, armorBonus, maxDex (99 = none), acp, asf, type, speed30, kind, weight]
  const ARMORS = [
    ['padded', 'Padded', 5, 1, 8, 0, 5, 'Light', 30, 'armor', 10], ['leather', 'Leather', 10, 2, 6, 0, 10, 'Light', 30, 'armor', 15], ['studded_leather', 'Studded Leather', 25, 3, 5, -1, 15, 'Light', 30, 'armor', 20],
    ['chain_shirt', 'Chain Shirt', 100, 4, 4, -2, 20, 'Light', 30, 'armor', 25], ['hide', 'Hide', 15, 3, 4, -3, 20, 'Medium', 20, 'armor', 25], ['scale_mail', 'Scale Mail', 50, 4, 3, -4, 25, 'Medium', 20, 'armor', 30],
    ['chainmail', 'Chainmail', 150, 5, 2, -5, 30, 'Medium', 20, 'armor', 40], ['breastplate', 'Breastplate', 200, 5, 3, -4, 25, 'Medium', 20, 'armor', 30], ['splint_mail', 'Splint Mail', 200, 6, 0, -7, 40, 'Heavy', 20, 'armor', 45],
    ['banded_mail', 'Banded Mail', 250, 6, 1, -6, 35, 'Heavy', 20, 'armor', 35], ['half_plate', 'Half-Plate', 600, 7, 0, -7, 40, 'Heavy', 20, 'armor', 50], ['full_plate', 'Full Plate', 1500, 8, 1, -6, 35, 'Heavy', 20, 'armor', 50],
    ['buckler', 'Buckler', 15, 1, 99, -1, 5, 'Shield', 30, 'shield', 5], ['shield_light_wooden', 'Shield, Light Wooden', 3, 1, 99, -1, 5, 'Shield', 30, 'shield', 5],
    ['shield_light_steel', 'Shield, Light Steel', 9, 1, 99, -1, 5, 'Shield', 30, 'shield', 6], ['shield_heavy_wooden', 'Shield, Heavy Wooden', 7, 2, 99, -2, 15, 'Shield', 30, 'shield', 10],
    ['shield_heavy_steel', 'Shield, Heavy Steel', 20, 2, 99, -2, 15, 'Shield', 30, 'shield', 15], ['shield_tower', 'Shield, Tower', 30, 4, 2, -10, 50, 'Shield', 30, 'shield', 45]
  ].map((a) => ({ id: a[0], name: a[1], cost: a[2], armorBonus: a[3], maxDex: a[4], acp: a[5], asf: a[6], type: a[7], speed: a[8], kind: a[9], weight: a[10], wooden: /wooden/.test(a[0]), src: 'Seed' }));

  const MATERIALS = [
    { id: 'standard', name: 'Standard' },
    { id: 'masterwork', name: 'Masterwork', note: 'Weapon: +1 Enhancement on attack (superseded by magic). Armor: ACP reduced by 1.' },
    { id: 'mithral', name: 'Mithral', note: 'Armor: +2 Max Dex, ACP -3 (toward 0), ASF -10%, one category lighter. Always masterwork.' },
    { id: 'adamantine', name: 'Adamantine', note: 'Weapon: bypasses DR/adamantine & hardness < 20. Armor: DR 1/- (Light), 2/- (Medium), 3/- (Heavy). Always masterwork.' },
    { id: 'cold_iron', name: 'Cold Iron', note: 'Bypasses DR/cold iron. Double base cost; +2,000 gp to enchant.' },
    { id: 'alchemical_silver', name: 'Alchemical Silver', note: 'Bypasses DR/silver. -1 damage (min 1).' },
    { id: 'darkwood', name: 'Darkwood', note: 'Wooden items only. Half weight; shields ACP -2 (toward 0). Always masterwork.' }
  ];

  const E = (id, name, on, plus, gpCost, effect, desc) => ({ id: id, name: name, on: on, plus: plus || 0, gp: gpCost || 0, effect: effect || {}, desc: desc || '', src: 'DMG' });
  const ENCHANTMENTS = [
    E('bane', 'Bane', 'weapon', 1, 0, { badge: '+2 Enh & +2d6 vs designated foe' }, 'Against a designated foe, +2 better enhancement and +2d6 damage.'),
    E('defending', 'Defending', 'weapon', 1, 0, { badge: 'Transfer Enh to AC' }, 'Wielder may transfer some or all of the enhancement bonus to AC.'),
    E('flaming', 'Flaming', 'weapon', 1, 0, { parts: [{ count: 1, die: 'd6', type: 'Fire', crit: 'normal' }] }, '+1d6 fire damage on a successful hit.'),
    E('frost', 'Frost', 'weapon', 1, 0, { parts: [{ count: 1, die: 'd6', type: 'Cold', crit: 'normal' }] }, '+1d6 cold damage on a successful hit.'),
    E('shock', 'Shock', 'weapon', 1, 0, { parts: [{ count: 1, die: 'd6', type: 'Electricity', crit: 'normal' }] }, '+1d6 electricity damage on a successful hit.'),
    E('ghost_touch_w', 'Ghost Touch', 'weapon', 1, 0, { badge: 'Full damage vs incorporeal' }, 'Deals damage normally against incorporeal creatures.'),
    E('keen', 'Keen', 'weapon', 1, 0, { keen: true }, 'Doubles the threat range. Slashing or piercing weapons only.'),
    E('merciful', 'Merciful', 'weapon', 1, 0, { parts: [{ count: 1, die: 'd6', type: 'Nonlethal', crit: 'normal' }] }, '+1d6 damage; all damage is nonlethal.'),
    E('spell_storing', 'Spell Storing', 'weapon', 1, 0, { badge: 'Stores a 3rd-level spell' }, 'Stores a single targeted spell of up to 3rd level.'),
    E('thundering', 'Thundering', 'weapon', 1, 0, { parts: [{ count: 1, die: 'd8', type: 'Sonic', crit: 'onCritOnly', perMult: true }] }, '+1d8 sonic on a critical hit (per multiplier above ×1).'),
    E('vicious', 'Vicious', 'weapon', 1, 0, { parts: [{ count: 2, die: 'd6', type: 'Force', crit: 'normal' }], badge: 'Wielder takes 1d6' }, '+2d6 damage to the target, 1d6 to the wielder.'),
    E('anarchic', 'Anarchic', 'weapon', 2, 0, { parts: [{ count: 2, die: 'd6', type: 'Unholy', crit: 'normal', cond: 'vs Lawful' }] }, 'Chaotic-aligned; +2d6 vs lawful creatures.'),
    E('axiomatic', 'Axiomatic', 'weapon', 2, 0, { parts: [{ count: 2, die: 'd6', type: 'Holy', crit: 'normal', cond: 'vs Chaotic' }] }, 'Lawful-aligned; +2d6 vs chaotic creatures.'),
    E('flaming_burst', 'Flaming Burst', 'weapon', 2, 0, { parts: [{ count: 1, die: 'd6', type: 'Fire', crit: 'normal' }, { count: 1, die: 'd10', type: 'Fire', crit: 'onCritOnly', perMult: true }] }, 'As flaming; +1d10 fire on a critical (+2d10 at ×3, +3d10 at ×4).'),
    E('icy_burst', 'Icy Burst', 'weapon', 2, 0, { parts: [{ count: 1, die: 'd6', type: 'Cold', crit: 'normal' }, { count: 1, die: 'd10', type: 'Cold', crit: 'onCritOnly', perMult: true }] }, 'As frost; +1d10 cold on a critical hit.'),
    E('shocking_burst', 'Shocking Burst', 'weapon', 2, 0, { parts: [{ count: 1, die: 'd6', type: 'Electricity', crit: 'normal' }, { count: 1, die: 'd10', type: 'Electricity', crit: 'onCritOnly', perMult: true }] }, 'As shock; +1d10 electricity on a critical hit.'),
    E('holy', 'Holy', 'weapon', 2, 0, { parts: [{ count: 2, die: 'd6', type: 'Holy', crit: 'normal', cond: 'vs Evil' }] }, 'Good-aligned; +2d6 vs evil creatures.'),
    E('unholy', 'Unholy', 'weapon', 2, 0, { parts: [{ count: 2, die: 'd6', type: 'Unholy', crit: 'normal', cond: 'vs Good' }] }, 'Evil-aligned; +2d6 vs good creatures.'),
    E('wounding', 'Wounding', 'weapon', 2, 0, { badge: '1 Con damage per hit' }, 'Each hit deals 1 point of Constitution damage from blood loss.'),
    E('speed', 'Speed', 'weapon', 3, 0, { badge: '+1 extra attack on Full Attack' }, 'One extra attack at full bonus when making a full attack.'),
    E('brilliant_energy', 'Brilliant Energy', 'weapon', 4, 0, { badge: 'Ignores armor & shield AC' }, 'Passes through nonliving matter; ignores armor and shield bonuses.'),
    E('dancing', 'Dancing', 'weapon', 4, 0, { badge: 'Fights alone 4 rounds' }, 'Loosed as a standard action, it fights on its own for 4 rounds.'),
    E('vorpal', 'Vorpal', 'weapon', 5, 0, { badge: 'Severs head on confirmed natural 20' }, 'Slashing only; a confirmed natural 20 severs the opponent’s head.'),
    E('glamered', 'Glamered', 'armor', 0, 2700, { badge: 'Appears as normal clothing' }, 'On command, appears as normal clothing.'),
    E('fort_light', 'Light Fortification', 'armor+shield', 1, 0, { badge: 'Fortification 25%' }, '25% chance to negate a critical hit or sneak attack.'),
    E('shadow', 'Shadow', 'armor', 0, 3750, { mods: [{ target: 'skill.hide', value: 5, type: 'Competence' }] }, '+5 competence bonus on Hide checks.'),
    E('silent_moves', 'Silent Moves', 'armor', 0, 3750, { mods: [{ target: 'skill.move_silently', value: 5, type: 'Competence' }] }, '+5 competence bonus on Move Silently checks.'),
    E('slick', 'Slick', 'armor', 0, 3750, { mods: [{ target: 'skill.escape_artist', value: 5, type: 'Competence' }] }, '+5 competence bonus on Escape Artist checks.'),
    E('improved_shadow', 'Improved Shadow', 'armor', 0, 15000, { mods: [{ target: 'skill.hide', value: 10, type: 'Competence' }] }, '+10 competence bonus on Hide checks.'),
    E('spell_res_13', 'Spell Resistance (13)', 'armor+shield', 2, 0, { sr: 13 }, 'Grants spell resistance 13.'),
    E('fort_moderate', 'Moderate Fortification', 'armor+shield', 3, 0, { badge: 'Fortification 75%' }, '75% chance to negate a critical hit or sneak attack.'),
    E('ghost_touch_a', 'Ghost Touch', 'armor+shield', 3, 0, { badge: 'Ghost Touch armor' }, 'Armor bonus counts against incorporeal attacks.'),
    E('invulnerability', 'Invulnerability', 'armor', 3, 0, { dr: { value: 5, bypass: 'magic' } }, 'Grants damage reduction 5/magic.'),
    E('fort_heavy', 'Heavy Fortification', 'armor+shield', 5, 0, { badge: 'Fortification 100%' }, 'Negates all critical hits and sneak attacks.'),
    E('fire_res', 'Fire Resistance', 'armor+shield', 0, 18000, { energy: { type: 'Fire', value: 10 } }, 'Resistance 10 against fire.'),
    E('cold_res', 'Cold Resistance', 'armor+shield', 0, 18000, { energy: { type: 'Cold', value: 10 } }, 'Resistance 10 against cold.'),
    E('acid_res', 'Acid Resistance', 'armor+shield', 0, 18000, { energy: { type: 'Acid', value: 10 } }, 'Resistance 10 against acid.'),
    E('bashing', 'Bashing', 'shield', 1, 0, { badge: 'Bash as two sizes larger' }, 'Shield bash deals damage as a shield two sizes larger.'),
    E('animated', 'Animated', 'shield', 2, 0, { badge: 'Floats, hands free' }, 'Floats near the wearer, leaving both hands free.'),
    E('arrow_deflection', 'Arrow Deflection', 'shield', 2, 0, { badge: 'Deflect ranged weapons' }, 'Once per round, DC 20 Reflex save to deflect a ranged weapon.'),
    E('reflecting', 'Reflecting', 'shield', 5, 0, { badge: 'Spell Turning 1/day' }, 'Once per day, reflects a spell as spell turning.')
  ];

  // MIC Augment Crystals — Least (masterwork), Lesser (+1), Greater (+3). null cost = tier not published.
  const CRYSTALS = [
    { id: 'truedeath', name: 'Truedeath Crystal', on: 'weapon', cost: [500, 1400, 10000], tiers: ['+1d6 damage vs undead', '+1d6 vs undead; +2 to confirm criticals vs undead', '+1d6 vs undead; slain undead cannot rise'], parts: [[1, 'd6'], [1, 'd6'], [1, 'd6']], ptype: 'Positive', cond: 'vs undead' },
    { id: 'energy_assault', name: 'Crystal of Energy Assault', on: 'weapon', cost: [1000, 3000, 8000], tiers: ['+1 energy damage', '+1d6 energy damage', '+2d6 energy damage'], parts: [[0, '1'], [1, 'd6'], [2, 'd6']], ptype: 'Fire' },
    { id: 'arcane_steel', name: 'Crystal of Arcane Steel', on: 'weapon', cost: [250, 1000, 4000], tiers: ['+1 attack vs creatures with SR', 'Overcome DR/magic', 'Ignore SR once per day'], mods: [[{ target: 'atk.melee', value: 1, type: 'Insight', condition: 'vs creatures with SR' }], [], []] },
    { id: 'demolition', name: 'Demolition Crystal', on: 'weapon', cost: [100, 500, 1500], tiers: ['+1d6 vs constructs & objects', '+2d6 vs constructs & objects', '+3d6 vs constructs & objects'], parts: [[1, 'd6'], [2, 'd6'], [3, 'd6']], ptype: 'Force', cond: 'vs constructs/objects' },
    { id: 'return', name: 'Crystal of Return', on: 'weapon', cost: [300, 1000, 3000], tiers: ['Draw weapon as free action', 'Weapon returns when disarmed', 'Teleport weapon to hand 1/day'] },
    { id: 'security', name: 'Crystal of Security', on: 'weapon', cost: [500, 1000, 3000], tiers: ['+5 vs Disarm & Sunder', '+10 vs Disarm & Sunder', 'Cannot be disarmed or sundered'] },
    { id: 'iron_ward', name: 'Iron Ward Diamond', on: 'armor+shield', cost: [1000, 3000, 9000], tiers: ['DR 1/- (1/day, 10 rounds)', 'DR 2/- (1/day, 10 rounds)', 'DR 3/- (constant)'], dr: [1, 2, 3] },
    { id: 'glancing_blows', name: 'Crystal of Glancing Blows', on: 'armor+shield', cost: [500, 1500, 4500], tiers: ['+2 AC vs Bull Rush/Overrun', '+4 vs Grapple escapes', '+2 Dodge AC vs attacks of opportunity'] },
    { id: 'life_drinking', name: 'Crystal of Life Drinking', on: 'armor+shield', cost: [1000, 3000, 9000], tiers: ['Resist first negative level/day', 'Resist two negative levels/day', 'Immune to negative levels'] },
    { id: 'lifekeeping', name: 'Crystal of Lifekeeping', on: 'armor+shield', cost: [500, 1500, 4500], tiers: ['+1 Resistance vs death effects', '+3 Resistance vs death effects', '+5 Resistance vs death effects'] },
    { id: 'mind_cloaking', name: 'Crystal of Mind Cloaking', on: 'armor+shield', cost: [500, 1500, 4500], tiers: ['+2 Resistance on Will vs mind-affecting', '+3 vs mind-affecting', '+5 vs mind-affecting'] },
    { id: 'adaptation', name: 'Crystal of Adaptation', on: 'armor+shield', cost: [500, 1500, 4500], tiers: ['Endure Elements (constant)', 'Breathe in hostile environments', 'Immune to environmental extremes'] }
  ].map((c) => Object.assign({ src: 'MIC (seed)' }, c));
  const CRYSTAL_TIERS = ['least', 'lesser', 'greater'];
  const CRYSTAL_REQ = { least: 0, lesser: 1, greater: 3 };

  const FEATS = [
    ['Power Attack', ['#FighterBonus'], 'Str 13'], ['Cleave', ['#FighterBonus'], 'Str 13, Power Attack'], ['Dodge', ['#FighterBonus'], 'Dex 13'], ['Mobility', ['#FighterBonus'], 'Dex 13, Dodge'],
    ['Weapon Focus', ['#FighterBonus'], 'Proficiency, BAB +1'], ['Iron Will', ['#General'], ''], ['Combat Expertise', ['#FighterBonus'], 'Int 13'], ['Improved Initiative', ['#FighterBonus'], ''],
    ['Spell Focus', ['#General'], ''], ['Combat Casting', ['#General'], ''], ['Shadow Weave Magic', ['#Reserve'], 'Wis 13 or Knowledge (religion) 6 ranks'], ['Scribe Scroll', ['#ItemCreation', '#WizardBonus'], 'Caster level 1st'],
    ['Empower Spell', ['#Metamagic', '#WizardBonus'], ''], ['Craft Wondrous Item', ['#ItemCreation'], 'Caster level 3rd'], ['Extra Turning', ['#Divine'], 'Turn or rebuke undead']
  ].map((f) => ({ id: 'seed-feat-' + slug(f[0]), name: f[0], tags: f[1], prereq: f[2], desc: f[2] ? 'Prerequisites: ' + f[2] : '', src: 'PHB (seed)' }));

  const SPELLS = [
    ['Feather Fall', 'Sor/Wiz 1, Brd 1', 'Transmutation', 1, 'Free', 'Close (25 ft. + 5 ft./2 levels)', 'Will negates (harmless)', 'Objects or creatures fall slowly (60 ft./round).'],
    ['Dimension Door', 'Sor/Wiz 4, Brd 4', 'Conjuration', 4, 'Standard', 'Long (400 ft. + 40 ft./level)', 'None', 'Teleports you short distance.'],
    ['Haste', 'Sor/Wiz 3, Brd 3', 'Transmutation', 3, 'Standard', 'Close (25 ft. + 5 ft./2 levels)', 'Fortitude negates (harmless)', 'One creature/level moves faster, +1 on attack rolls, AC, and Reflex saves.'],
    ['Fireball', 'Sor/Wiz 3', 'Evocation', 3, 'Standard', 'Long (400 ft. + 40 ft./level)', 'Reflex half', '1d6 damage per level, 20-ft. radius.'],
    ['Scorching Ray', 'Sor/Wiz 2', 'Evocation', 2, 'Standard', 'Close (25 ft. + 5 ft./2 levels)', 'None', 'Ranged touch attack deals 4d6 fire damage, +1 ray/four levels (max 3).'],
    ['Endure Elements', 'Clr 1, Sor/Wiz 1, Sun 1', 'Abjuration', 1, 'Standard', 'Touch', 'Will negates (harmless)', 'Exist comfortably in hot or cold environments.'],
    ['Heat Metal', 'Drd 2, Sun 2', 'Transmutation', 2, 'Standard', 'Close (25 ft. + 5 ft./2 levels)', 'Will negates (object)', 'Make metal so hot it damages those who touch it.'],
    ['Searing Light', 'Clr 3, Sun 3', 'Evocation', 3, 'Standard', 'Medium (100 ft. + 10 ft./level)', 'None', 'Ray deals 1d8/two levels, more against undead.'],
    ['Shield', 'Sor/Wiz 1', 'Abjuration', 1, 'Standard', 'Personal', 'None', 'Invisible disc gives +4 to AC, blocks magic missiles.'],
    ['Blur', 'Sor/Wiz 2, Brd 2', 'Illusion', 2, 'Standard', 'Touch', 'Will negates (harmless)', 'Attacks miss subject 20% of the time.'],
    ['Bestow Curse', 'Clr 3, Sor/Wiz 4', 'Necromancy', 3, 'Standard', 'Touch', 'Will negates', '-6 to an ability score; -4 on attack rolls, saves, and checks; or 50% chance of losing each action.'],
    ['Righteous Might', 'Clr 5, Strength 5', 'Transmutation', 5, 'Standard', 'Personal', 'None', 'Your size increases, and you gain combat bonuses.']
  ].map((s) => ({ id: 'seed-spl-' + slug(s[0]), name: s[0], levelText: s[1], school: s[2], level: s[3], action: s[4], range: s[5], save: s[6], desc: s[7], src: 'PHB (seed)' }));

  const DOMAINS = [
    ['Sun', 'Once per day, perform a greater turning against undead in place of a regular turning; undead that would be turned are destroyed instead.', ['Endure Elements', 'Heat Metal', 'Searing Light', 'Fire Shield', 'Flame Strike', 'Fire Seeds', 'Sunbeam', 'Sunburst', 'Prismatic Sphere']],
    ['Good', 'Cast good spells at +1 caster level.', ['Protection from Evil', 'Aid', 'Magic Circle against Evil', 'Holy Smite', 'Dispel Evil', 'Blade Barrier', 'Holy Word', 'Holy Aura', 'Summon Monster IX (good only)']],
    ['Healing', 'Cast healing spells at +1 caster level.', ['Cure Light Wounds', 'Cure Moderate Wounds', 'Cure Serious Wounds', 'Cure Critical Wounds', 'Cure Light Wounds, Mass', 'Heal', 'Regenerate', 'Cure Critical Wounds, Mass', 'Heal, Mass']],
    ['Strength', 'Supernatural feat of strength: enhancement bonus to Strength equal to cleric level for 1 round, once per day.', ['Enlarge Person', 'Bull\'s Strength', 'Magic Vestment', 'Spell Immunity', 'Righteous Might', 'Stoneskin', 'Grasping Hand', 'Clenched Fist', 'Crushing Hand']],
    ['War', 'Free Martial Weapon Proficiency and Weapon Focus with the deity’s favored weapon.', ['Magic Weapon', 'Spiritual Weapon', 'Magic Vestment', 'Divine Power', 'Flame Strike', 'Blade Barrier', 'Power Word Blind', 'Power Word Stun', 'Power Word Kill']],
    ['Magic', 'Use spell completion and spell trigger items as a wizard of one-half your cleric level.', ['Magic Aura', 'Identify', 'Dispel Magic', 'Imbue with Spell Ability', 'Spell Resistance', 'Antimagic Field', 'Spell Turning', 'Protection from Spells', 'Mage\'s Disjunction']]
  ].map((d) => ({ id: 'seed-dom-' + slug(d[0]), name: d[0], grantedPower: d[1], spells: d[2], src: 'PHB (seed)' }));

  const DEITIES = [
    ['Pelor', 'NG', 'Mace, Heavy', ['Sun', 'Good', 'Healing', 'Strength']], ['Heironeous', 'LG', 'Longsword', ['Good', 'Law', 'War']], ['Kord', 'CG', 'Greatsword', ['Chaos', 'Good', 'Luck', 'Strength']],
    ['St. Cuthbert', 'LN', 'Mace, Heavy', ['Destruction', 'Law', 'Protection', 'Strength']], ['Wee Jas', 'LN', 'Dagger', ['Death', 'Law', 'Magic']], ['Boccob', 'N', 'Quarterstaff', ['Knowledge', 'Magic', 'Trickery']],
    ['Obad-Hai', 'N', 'Quarterstaff', ['Air', 'Animal', 'Earth', 'Fire', 'Plant', 'Water']], ['Olidammara', 'CN', 'Rapier', ['Chaos', 'Luck', 'Trickery']], ['Hextor', 'LE', 'Flail, Heavy', ['Destruction', 'Evil', 'Law', 'War']],
    ['Nerull', 'NE', 'Scythe', ['Death', 'Evil', 'Trickery']], ['Erythnul', 'CE', 'Morningstar', ['Chaos', 'Evil', 'Trickery', 'War']], ['Moradin', 'LG', 'Warhammer', ['Earth', 'Good', 'Law', 'Protection']],
    ['Corellon Larethian', 'CG', 'Longsword', ['Chaos', 'Good', 'Protection', 'War']], ['Ehlonna', 'NG', 'Longsword', ['Animal', 'Good', 'Plant', 'Sun']]
  ].map((d) => ({ id: 'seed-deity-' + slug(d[0]), name: d[0], align: d[1], favoredWeapon: d[2], domains: d[3], src: 'PHB (seed)' }));

  const CLASS_FEATURES = [
    ['Sneak Attack', 'Ex', '+1d6 damage when flanking or vs a foe denied DEX to AC.'], ['Evasion', 'Ex', 'No damage on a successful Reflex save vs half-damage effects.'],
    ['Uncanny Dodge', 'Ex', 'Retain DEX bonus to AC when flat-footed.'], ['Bonus Feat', 'Ex', 'Gain a bonus feat from the class list.'], ['Turn Undead', 'Su', 'Channel positive energy to turn undead.'],
    ['Low-Light Vision', 'Ex', 'See twice as far as a human in dim light.'], ['Darkvision', 'Ex', 'See in darkness out to 60 ft.'], ['Damage Reduction', 'Ex', 'Ignore a portion of damage from each attack.']
  ].map((c) => ({ id: 'seed-cab-' + slug(c[0]), name: c[0], abilityType: c[1], desc: c[2], src: 'SRD (seed)' }));

  // Live catalog (seed first; SRD/MIC/master_db merged on load)
  const CAT = { weapons: WEAPONS, armors: ARMORS, enchants: ENCHANTMENTS, crystals: CRYSTALS, feats: FEATS, spells: SPELLS, domains: DOMAINS, deities: DEITIES, classFeatures: CLASS_FEATURES, special: [], magicItems: [], classes: [], srdLoaded: false, srdCount: 0, customCount: 0 };
  const byId = (list, id) => list.find((x) => x.id === id);

  // --------------------------------------------------------------------------
  // 2. Categories (templates) & facets
  // --------------------------------------------------------------------------
  const FACETS = [
    { key: 'identity', title: 'Identity, Classification & Tags', icon: '📜' },
    { key: 'prereqs', title: 'Gatekeeper Prerequisites', icon: '🏛️' },
    { key: 'chassis', title: 'Physical Chassis & Assembly', icon: '⚔️' },
    { key: 'modifiers', title: 'Passive Modifiers, Penalties & State Locks', icon: '✨' },
    { key: 'effects', title: 'Effect Blocks (Bonus, Damage, Defense, Size, Tier, Roll Table)', icon: '🧩' },
    { key: 'powers', title: 'Powers, Spells & Activated Sub-Abilities', icon: '⚡' },
    { key: 'delivery', title: 'Delivery, Damage & Resolution', icon: '🔮' },
    { key: 'lifecycle', title: 'Usage, Duration & Stacks', icon: '⚡' },
    { key: 'defenses', title: 'Defenses & Reactions', icon: '🛡️' },
    { key: 'progression', title: 'Progression Matrix', icon: '💎' },
    { key: 'grants', title: 'Deity, Domains & Grants', icon: '🏛️' }
  ];
  const FACET_BY_KEY = {}; FACETS.forEach((f, i) => { f.n = i + 1; FACET_BY_KEY[f.key] = f; });
  const BLUEPRINTS = [
    { id: 'weapon', name: 'Weapon', icon: '⚔️', facets: ['identity', 'chassis', 'modifiers'], item: true },
    { id: 'armor', name: 'Armor / Shield', icon: '🛡️', facets: ['identity', 'chassis', 'modifiers', 'defenses'], item: true },
    { id: 'wondrous', name: 'Wondrous / Ring / Staff / Consumable', icon: '💎', facets: ['identity', 'modifiers', 'powers'], item: true },
    { id: 'spell', name: 'Spell / Power', icon: '🔮', facets: ['identity', 'delivery', 'lifecycle', 'effects'] },
    { id: 'feat', name: 'Feat / Boon', icon: '📜', facets: ['identity', 'prereqs', 'modifiers'] },
    { id: 'buff', name: 'Buff / Condition', icon: '✨', facets: ['identity', 'modifiers', 'effects', 'lifecycle', 'defenses'] },
    { id: 'class', name: 'Class / Prestige Class', icon: '💎', facets: ['identity', 'prereqs', 'progression', 'grants'] },
    { id: 'deity', name: 'Deity', icon: '🏛️', facets: ['identity', 'grants'] },
    { id: 'domain', name: 'Domain', icon: '✨', facets: ['identity', 'grants'] }
  ];
  const BP_BY_ID = {}; BLUEPRINTS.forEach((b) => { BP_BY_ID[b.id] = b; });
  const isItemBp = (bp) => !!(BP_BY_ID[bp] && BP_BY_ID[bp].item);
  // Consumable is derived (no checkbox): depleting subtypes or any 'charges' usage mode
  const isConsumable = (en) => /Potion|Scroll|Wand/.test(en.item.subtype) || en.lifecycle.use.mode === 'charges' || en.powers.some((p) => p.use.mode === 'charges');

  // --------------------------------------------------------------------------
  // 3. Entry model (Canonical V2.5)
  // --------------------------------------------------------------------------
  function weaponOverrides(baseId) {
    const w = byId(CAT.weapons, baseId) || WEAPONS[5];
    return { dice: w.dice, critRange: w.critRange, critMult: w.critMult, rangeOn: w.range > 0, range: w.range, category: w.category, handed: w.handed, dmgType: w.dmgType };
  }
  function armorOverrides(baseId) {
    const a = byId(CAT.armors, baseId) || ARMORS[3];
    return { type: a.type, armorBonus: a.armorBonus, maxDex: a.maxDex, acp: a.acp, asf: a.asf, speed: a.speed };
  }
  function blankChassis(kind, baseId) {
    const isW = kind === 'weapon';
    const id = baseId || (isW ? 'longsword' : 'chain_shirt');
    return { kind: kind, baseId: id, material: 'standard', enhancement: 0, enchantments: [], crystal: { id: '', tier: 'least' }, damageParts: [], weapon: weaponOverrides(isW ? id : 'longsword'), armor: armorOverrides(isW ? 'chain_shirt' : id) };
  }
  const blankUse = (mode) => ({ mode: mode || 'atwill', n: 3, slotLevel: 1, pool: 'Turn Undead', poolCost: 1, cooldown: '1d4+1' });
  const blankDamage = (on) => ({ on: !!on, count: 1, die: 'd6', type: 'Fire', scaling: 'flat', per: 1, start: 1, max: 10 });
  function blankLevels() { const a = []; for (let i = 0; i < 20; i++) a.push({ features: [], spell: false }); return a; }
  function blankEntry(bpId) {
    const bp = BP_BY_ID[bpId] || BLUEPRINTS[0];
    return {
      schemaVersion: 2.5, id: uid('custom'), blueprint: bp.id, name: '', source: 'Homebrew', text: '', tags: [], repeat: { mode: 'once', n: 2 },
      origin: { mode: 'new', srdId: '', srdName: '', srdType: '' },
      facets: bp.facets.slice(),
      item: { subtype: bp.id === 'weapon' ? 'Weapon' : bp.id === 'armor' ? 'Armor' : 'Wondrous Item', slot: bp.id === 'weapon' ? 'Held' : bp.id === 'armor' ? 'Body / Robe' : 'Slotless', consumable: false, price: 0, cl: 0 },
      spell: { classes: [{ cls: 'Sor/Wiz', lvl: 1 }], school: 'Evocation', descriptors: [], comps: { V: true, S: true, M: false, F: false, DF: false, XP: false } },
      prereqs: [],
      chassis: blankChassis(bp.id === 'armor' ? 'armor' : 'weapon'),
      modifiers: [], substitutions: [],
      locks: { loseDex: false, flatFooted: false, cannotAct: false, blinded: false, entangled: false, negLevel: false, extraAttack: false },
      powers: [], effects: [], buffKind: 'Buff',
      delivery: { action: 'Standard', range: 'Close (25 ft. + 5 ft./2 levels)', area: '', target: '', attack: 'none', attackOn: false, save: { type: 'None', effect: 'Half', dcMode: 'spell', stat: 'int', flat: 15 }, sr: 'Yes', damage: blankDamage(false), extras: [] },
      lifecycle: { use: blankUse('atwill'), duration: 'instant', durValue: 1, durText: '', dismissible: false, stackable: false, maxStacks: 5, ongoingOn: false, ongoing: { kind: 'dot', dice: '1d6', type: 'Fire', value: 2 } },
      defenses: { dr: [], energy: [], srOn: false, sr: { mode: 'flat', value: 15 }, concealment: 0, reactionOn: false, reaction: '' },
      progression: { mode: 'prestige', maxLevel: 10, hitDie: 8, bab: '3/4', good: { fort: false, ref: false, will: false }, skillPts: 2, classSkills: [], levels: blankLevels(), pattern: { name: 'Sneak Attack', start: 1, every: 2, scale: '+1d6' } },
      grants: { deityAlign: 'NG', favoredWeapon: 'Mace, Heavy', portfolio: '', dogma: '', grantedPowerName: '', gpUse: blankUse('passive'), grantedPower: '', grantedUses: '1/day', ladder: ['', '', '', '', '', '', '', '', ''], featGrants: [], domains: [], deities: [] }
    };
  }
  const M = (target, value, type, condition, formula) => ({ id: uid('m'), target: target, value: value, formula: formula || 'flat', type: type || 'Untyped', condition: condition || '' });
  const ALT = (o) => Object.assign({ id: uid('a'), kind: 'ability', ability: 'str', min: 13, skill: 'skill.tumble', feat: '', levelKind: 'casterLevel', cls: '', align: 'Any Good', text: '' }, o);
  function blankPower(kind, o) {
    return Object.assign({ id: uid('pw'), kind: kind, name: kind === 'inline' ? 'New Power' : '', ref: null, grantMode: 'cast', use: blankUse('perDay'), action: 'Standard', cl: 5, dc: 0, duration: '', attack: 'none', attackOn: false, range: '', area: '',
      save: { type: 'None', effect: 'Negates' }, damage: blankDamage(false), modifiers: [], text: '', exportStandalone: false }, o || {});
  }
  const FEATURE = (name, o) => Object.assign({ id: uid('f'), kind: 'ref', name: name, abilityType: 'Ex', text: '', refId: '' }, o || {});
  const DOMAIN_REF = (d) => ({ id: uid('dm'), kind: 'ref', name: d.name, refId: d.id, grantedPower: d.grantedPower || '', ladder: (d.spells || []).slice(0, 9).concat(['', '', '', '', '', '', '', '', '']).slice(0, 9) });
  const findDomain = (name) => CAT.domains.find((d) => d.name.toLowerCase() === String(name).toLowerCase());

  function applyPattern(p, pat) {
    const start = Math.max(1, num(pat.start, 1)), every = Math.max(1, num(pat.every, 1));
    const m = String(pat.scale || '').match(/^\+?(\d+)(d\d+)?$/i);
    let step = 0;
    for (let L = start; L <= p.maxLevel; L += every) {
      step++;
      let label = pat.name;
      if (m) label += ' +' + (num(m[1], 1) * step) + (m[2] || '');
      const row = p.levels[L - 1];
      row.features = row.features.filter((f) => String(f.name).indexOf(pat.name) !== 0);
      row.features.push(FEATURE(label, { kind: 'pattern' }));
    }
  }

  // --------------------------------------------------------------------------
  // 4. Curated presets
  // --------------------------------------------------------------------------
  const PRESETS = [
    { id: 'hourglass', icon: '⏳', label: 'Chronos Hourglass (DM Relic: 3/day Reroll + 1/day Replay Turn)', build() {
      const e = blankEntry('wondrous');
      Object.assign(e, { name: 'Chronos Hourglass', source: 'DM Relic (Homebrew)', tags: ['#DMGrant', '#Relic'], text: 'A palm-sized hourglass of star-glass whose sand flows upward. Bound to a single wielder by the DM.' });
      Object.assign(e.item, { subtype: 'Artifact / Relic', slot: 'Held', consumable: false, price: 0, cl: 20 });
      e.modifiers = [M('initiative', 2, 'Insight')];
      e.powers = [
        blankPower('inline', { name: 'Rewind the Die', action: 'Immediate', use: Object.assign(blankUse('perDay'), { n: 3 }), cl: 20, duration: 'Instantaneous', range: '30 ft.', text: 'After any d20 roll made by you or an ally within 30 ft. is revealed, force a reroll. The new result must be used.' }),
        blankPower('inline', { name: 'Replay Turn', action: 'Immediate', use: Object.assign(blankUse('perDay'), { n: 1 }), cl: 20, duration: 'Instantaneous', range: 'Personal', text: 'At the end of your turn, rewind time to the start of that turn. You retain knowledge of what happened; all other effects are undone.' })
      ];
      return e; } },
    { id: 'cloak', icon: '🧥', label: "War Wizard's Cloak (Passive Saves + Feather Fall At-Will + Dimension Door 1/day + Arcane Blast)", build() {
      const e = blankEntry('wondrous');
      Object.assign(e, { name: "War Wizard's Cloak", source: 'Homebrew (MIC-style)', tags: ['#Arcane'], text: 'A battle-scarred cloak of storm-grey silk stitched with abjuration sigils.' });
      Object.assign(e.item, { subtype: 'Wondrous Item', slot: 'Shoulders / Cloak', consumable: false, price: 32000, cl: 9 });
      e.modifiers = [M('save.all', 2, 'Resistance'), M('save.will', 2, 'Insight', 'vs Enchantment spells')];
      const ff = CAT.spells.find((s) => s.name === 'Feather Fall'), dd = CAT.spells.find((s) => s.name === 'Dimension Door');
      e.powers = [
        blankPower('attached', { name: 'Feather Fall', ref: spellRef(ff), action: 'Free', use: blankUse('atwill'), cl: 9, grantMode: 'cast' }),
        blankPower('attached', { name: 'Dimension Door', ref: spellRef(dd), action: 'Standard', use: Object.assign(blankUse('perDay'), { n: 1 }), cl: 9, grantMode: 'cast' }),
        blankPower('inline', { name: 'Arcane Blast', action: 'Standard', use: Object.assign(blankUse('perDay'), { n: 3 }), cl: 9, attack: 'ranged-touch', attackOn: true, range: '60 ft.', duration: 'Instantaneous',
          damage: { on: true, count: 1, die: 'd6', type: 'Force', scaling: 'perCL', per: 2, start: 1, max: 5 }, text: 'A bolt of raw force leaps from the cloak’s clasp.' })
      ];
      return e; } },
    { id: 'katana', icon: '⚔️', label: '+2 Keen Flaming Burst Adamantine Katana + Truedeath Crystal', build() {
      const e = blankEntry('weapon');
      Object.assign(e, { source: 'DMG / Oriental Adventures / MIC', tags: ['#Weapon'] });
      e.chassis = blankChassis('weapon', 'katana');
      Object.assign(e.chassis, { material: 'adamantine', enhancement: 2, enchantments: ['keen', 'flaming_burst'], crystal: { id: crystalIdByName('Truedeath Crystal'), tier: 'least' } });
      e.chassis.damageParts = [{ id: uid('d'), count: 1, die: 'd4', type: 'Precision', crit: 'normal', cond: 'when flanking (custom chip)' }];
      return e; } },
    { id: 'halfplate', icon: '🛡️', label: '+1 Shadow Mithral Half-Plate + Iron Ward Diamond', build() {
      const e = blankEntry('armor');
      Object.assign(e, { source: 'DMG / MIC', tags: ['#Armor'] });
      e.chassis = blankChassis('armor', 'half_plate');
      Object.assign(e.chassis, { material: 'mithral', enhancement: 1, enchantments: ['shadow'], crystal: { id: crystalIdByName('Iron Ward Diamond'), tier: 'least' } });
      return e; } },
    { id: 'fireball', icon: '🔮', label: 'Fireball (1d6 per CL, max 10d6)', build() {
      const e = blankEntry('spell');
      Object.assign(e, { name: 'Fireball', source: 'PHB p.231', tags: ['#Fire'], text: 'A glowing bead streaks to a point you choose and blossoms into a 20-ft.-radius burst of flame.' });
      e.spell = { classes: [{ cls: 'Sor/Wiz', lvl: 3 }], school: 'Evocation', descriptors: ['Fire'], comps: { V: true, S: true, M: true, F: false, DF: false, XP: false } };
      Object.assign(e.delivery, { action: 'Standard', range: 'Long (400 ft. + 40 ft./level)', area: '20-ft.-radius Spread', attack: 'none', sr: 'Yes' });
      e.delivery.save = { type: 'Reflex', effect: 'Half', dcMode: 'spell', stat: 'int', flat: 15 };
      e.delivery.damage = { on: true, count: 1, die: 'd6', type: 'Fire', scaling: 'perCL', per: 1, start: 1, max: 10 };
      e.lifecycle.duration = 'instant';
      return e; } },
    { id: 'scorching', icon: '🔮', label: 'Scorching Ray (Ranged Touch, 4d6 Fire, +1 ray per 4 CL)', build() {
      const e = blankEntry('spell');
      Object.assign(e, { name: 'Scorching Ray', source: 'PHB p.274', tags: ['#Fire'], text: 'Blast enemies with fiery rays: one ray, plus one additional ray for every four levels beyond 3rd (maximum three rays at 11th level).' });
      e.spell = { classes: [{ cls: 'Sor/Wiz', lvl: 2 }], school: 'Evocation', descriptors: ['Fire'], comps: { V: true, S: true, M: false, F: false, DF: false, XP: false } };
      Object.assign(e.delivery, { action: 'Standard', range: 'Close (25 ft. + 5 ft./2 levels)', area: 'One or more rays', attack: 'ranged-touch', attackOn: true, sr: 'Yes' });
      e.delivery.damage = { on: true, count: 4, die: 'd6', type: 'Fire', scaling: 'flat', per: 4, start: 3, max: 3 };
      e.delivery.extras = [{ id: uid('x'), kind: 'rays', text: '+1 ray per 4 CL beyond 3rd (max 3 rays at CL 11)' }];
      return e; } },
    { id: 'disciple', icon: '📜', label: 'Arcane Disciple (Feat granting Domain Spells)', build() {
      const e = blankEntry('feat');
      Object.assign(e, { name: 'Arcane Disciple (Sun)', source: 'Complete Divine', tags: ['#Divine'], text: 'Choose a domain of your patron deity. Add its spells to your arcane spell list; you must have Wisdom 10 + spell level to cast them.' });
      e.prereqs = [
        { id: uid('p'), alts: [ALT({ kind: 'skill', skill: 'skill.knowledge', min: 4 })] },
        { id: uid('p'), alts: [ALT({ kind: 'level', levelKind: 'casterLevel', min: 1 })] },
        { id: uid('p'), alts: [ALT({ kind: 'custom', text: 'Patron deity who grants the chosen domain' })] }
      ];
      e.facets = ['identity', 'prereqs', 'powers'];
      e.powers = ['Endure Elements', 'Heat Metal', 'Searing Light'].map((n, i) => {
        const s = CAT.spells.find((x) => x.name === n);
        return blankPower('attached', { name: n, ref: spellRef(s), grantMode: 'known', use: Object.assign(blankUse('spellSlot'), { slotLevel: i + 1 }), action: 'Standard', cl: 0 });
      });
      return e; } },
    { id: 'breath', icon: '🩸', label: 'Dragon Breath Weapon (Acid, 30-ft. Cone, Recharge 1d4+1)', build() {
      const e = blankEntry('spell');
      Object.assign(e, { name: 'Breath Weapon (Acid)', source: 'Monster Manual', tags: ['#Draconic', '#Acid'], text: 'Supernatural ability. Exhales a cone of acid.' });
      e.spell.classes = []; e.spell.school = 'Universal';
      Object.assign(e.delivery, { action: 'Standard', range: 'Personal', area: '30-ft. Cone', attack: 'none', sr: 'No' });
      e.delivery.save = { type: 'Reflex', effect: 'Half', dcMode: 'hd', stat: 'con', flat: 15 };
      e.delivery.damage = { on: true, count: 6, die: 'd8', type: 'Acid', scaling: 'flat', per: 1, start: 1, max: 10 };
      e.lifecycle.use = Object.assign(blankUse('cooldown'), { cooldown: '1d4+1' });
      return e; } },
    { id: 'curse', icon: '🩸', label: 'Bestow Curse / Energy Drain (Stackable Debuff)', build() {
      const e = blankEntry('buff');
      Object.assign(e, { name: 'Bestow Curse / Energy Drain', source: 'PHB', tags: ['#Curse'] });
      e.modifiers = [M('atk.all', -4, 'Penalty'), M('save.all', -4, 'Penalty'), M('skill.all', -4, 'Penalty')];
      e.locks.negLevel = true;
      Object.assign(e.lifecycle, { duration: 'permanent', stackable: true, maxStacks: 5 });
      e.facets = ['identity', 'modifiers', 'lifecycle'];
      return e; } },
    { id: 'shadowadept', icon: '💎', label: 'Shadow Adept (Prestige Class 1–10)', build() {
      const e = blankEntry('class');
      Object.assign(e, { name: 'Shadow Adept', source: "Player's Guide to Faerûn", tags: ['#Reserve'] });
      e.prereqs = [
        { id: uid('p'), alts: [ALT({ kind: 'alignment', align: 'Any Non-Good' })] },
        { id: uid('p'), alts: [ALT({ kind: 'skill', skill: 'skill.knowledge', min: 8 }), ALT({ kind: 'skill', skill: 'skill.spellcraft', min: 8 })] },
        { id: uid('p'), alts: [ALT({ kind: 'feat', feat: 'Shadow Weave Magic' }), ALT({ kind: 'feat', feat: '#Reserve' })] },
        { id: uid('p'), alts: [ALT({ kind: 'level', levelKind: 'casterLevel', min: 5 })] }
      ];
      const p = e.progression;
      Object.assign(p, { mode: 'prestige', maxLevel: 10, hitDie: 4, bab: '1/2', skillPts: 2 });
      p.good = { fort: false, ref: false, will: true };
      p.levels.forEach((l, i) => { l.spell = i < 10; });
      p.levels[0].features = [FEATURE('Low-Light Vision', { refId: 'seed-cab-low_light_vision' }), FEATURE('Shadow Feats', { kind: 'inline', abilityType: 'Ex', text: 'Gain Insidious Magic, Pernicious Magic and Tenacious Magic as bonus feats over levels 1–3.' })];
      p.levels[3].features = [FEATURE('Shadow Walk', { kind: 'inline', abilityType: 'Sp', text: 'Use shadow walk once per day as a spell-like ability.' })];
      p.levels[6].features = [FEATURE('Darkvision', { refId: 'seed-cab-darkvision' })];
      p.levels[9].features = [FEATURE('Shadow Double', { kind: 'inline', abilityType: 'Sp', text: 'Create a shadow duplicate once per day.' })];
      applyPattern(p, { name: 'Shadow Defense', start: 2, every: 3, scale: '+1' });
      applyPattern(p, { name: 'Spell Power', start: 3, every: 3, scale: '+1' });
      p.pattern = { name: 'Shadow Defense', start: 2, every: 3, scale: '+1' };
      e.grants.featGrants = [{ id: uid('g'), count: 1, pool: '#Reserve', level: 1 }];
      return e; } },
    { id: 'pelor', icon: '🏛️', label: 'Pelor & Sun Domain (Deity)', build() {
      const e = blankEntry('deity');
      Object.assign(e, { name: 'Pelor, the Shining One', source: 'PHB p.108', tags: ['#Divine'], text: 'Greater deity of the sun, light, strength and healing.' });
      Object.assign(e.grants, { deityAlign: 'NG', favoredWeapon: 'Mace, Heavy' });
      e.grants.domains = ['Sun', 'Good', 'Healing', 'Strength'].map((n) => DOMAIN_REF(findDomain(n) || { name: n, id: '' }));
      return e; } }
  ];
  function spellRef(s) { return s ? { id: s.id, name: s.name, levelText: s.levelText || '', level: num(s.level, 1), school: s.school || '', desc: s.desc || '', range: s.range || '', save: s.save || '' } : null; }
  function crystalIdByName(name) { const c = CAT.crystals.find((x) => x.name.toLowerCase() === name.toLowerCase()); return c ? c.id : ''; }

  // ---- Effect blocks (shared by Scratch Lego + Classic views) ----
  const META_COST_MODES = [['slot', '+Slot Level'], ['rod', 'Metamagic Rod (Uses/Day)'], ['sudden', 'Sudden (Uses/Day, +0 Slot)'], ['pool', 'Pool Cost (Divine Metamagic)']];
  const META_TRANSFORMS = [
    ['empower', 'Damage / Variable ×1.5 (Empower)'], ['maximize', 'Maximize Variable Dice'], ['quicken', 'Cast as Swift Action (Quicken)'],
    ['extend', 'Duration ×2 (Extend)'], ['persistent', 'Duration → 24 Hours (Persistent)'], ['enlarge', 'Range ×2 (Enlarge)'], ['widen', 'Area ×2 (Widen)'],
    ['twin', 'Cast Spell Twice (Twin)'], ['splitRay', '+1 Extra Ray (Split Ray)'], ['chain', 'Arc Secondary Targets (Chain)'],
    ['heighten', '+Save DC / Effective Level'], ['energySub', 'Substitute Energy Type'], ['pierceRes', 'Ignore Energy Resist / ½ Immunity'],
    ['silent', 'Remove Verbal (V) Component'], ['still', 'Remove Somatic (S) Component'], ['rider', 'Add Rider / Custom Transform']
  ];
  const META_TX_LABEL = {}; META_TRANSFORMS.forEach((x) => { META_TX_LABEL[x[0]] = x[1]; });
  const BLOCK_TYPES = {
    bonus: { icon: '📊', label: 'Bonus', color: 'b-blue' }, damage: { icon: '💥', label: 'Damage / Heal / Temp HP', color: 'b-red' }, defense: { icon: '🛡️', label: 'Immunity / DR / Resist / Sense', color: 'b-green' },
    size: { icon: '📏', label: 'Size Change', color: 'b-purple' }, metamagic: { icon: '✨', label: 'Metamagic', color: 'b-purple', metaOnly: true }, rule: { icon: '📜', label: 'Rule Effect', color: 'b-slate' },
    tier: { icon: '🔶', label: 'CL Tier C-Block', color: 'c-teal', container: 'branches' }, synergy: { icon: '🔶', label: 'Synergy C-Block', color: 'c-teal', container: 'kids' }, table: { icon: '🎯', label: 'Roll Table C-Block', color: 'c-amber', container: 'rows' }
  };
  function BLK(type, o) {
    const base = { id: uid('b'), type: type };
    const d = {
      bonus: { targets: ['atk.all'], value: 1, btype: 'Morale', scaling: 'flat', per: 3, min: 1, max: 3, condition: '' },
      damage: { kind: 'Damage', dice: '1d6', dmgType: 'Fire', perOn: false, amount: 1, per: 1, max: 10, save: '' },
      defense: { mode: 'Immunity', what: 'Fear', value: 0 },
      size: { steps: 1 },
      metamagic: { costMode: 'slot', slotAdj: 1, uses: 3, maxSpellLvl: 3, pool: 'Turn Undead', poolCost: 2, transform: 'empower', dcBonus: 1, energy: 'Fire', rider: '', appliesTo: '' },
      rule: { text: '' },
      tier: { branches: [{ id: uid('br'), cond: 'CL ≤ 11', kids: [] }] }, synergy: { cond: 'If 2+ active #Primal effects', kids: [] },
      table: { die: '1d8', rows: [{ id: uid('r'), roll: '1', kids: [] }] }
    }[type] || {};
    return Object.assign(base, clone(d), o || {});
  }
  const SIZE_STEPS = { '-2': 'Shrink 2 categories', '-1': 'Shrink 1 category', '1': '+1 Size Category (e.g. Medium → Large)', '2': '+2 Size Categories' };
  function metamagicCostText(b) {
    if (b.costMode === 'rod') return num(b.uses, 3) + '/day Rod (max Lvl ' + num(b.maxSpellLvl, 3) + ', +0 Slot)';
    if (b.costMode === 'sudden') return num(b.uses, 1) + '/day Sudden (+0 Slot)';
    if (b.costMode === 'pool') return num(b.poolCost, 1) + ' ' + (b.pool || 'Turn Undead') + ' (+0 Slot)';
    return '+' + num(b.slotAdj) + ' Spell Slot';
  }
  function metamagicTxText(b) {
    if (b.transform === 'heighten') return '+' + num(b.dcBonus, 1) + ' Save DC / Effective Level';
    if (b.transform === 'energySub') return 'Substitute Energy → ' + b.energy;
    if (b.transform === 'pierceRes') return 'Ignore ' + b.energy + ' Resistance (½ vs Immunity)';
    if (b.transform === 'rider') return b.rider || 'Custom spell rider';
    return META_TX_LABEL[b.transform] || b.transform;
  }
  function blockText(b) {
    switch (b.type) {
      case 'bonus': {
        const t = b.targets.map((x) => TARGET_LABEL[x] || x).join(', ') || '(no target)';
        const v = b.scaling === 'perCL' ? '+' + num(b.value, 1) + ' per ' + num(b.per, 1) + ' CL (min +' + num(b.min) + ', max +' + num(b.max) + ')' : sgn(num(b.value));
        return v + ' ' + b.btype + ' → ' + t + (b.condition ? ' (' + b.condition + ')' : '');
      }
      case 'damage': {
        const dice = String(b.dice || '').trim();
        const per = b.perOn ? (dice ? ' + ' : '') + num(b.amount, 1) + ' per ' + (num(b.per, 1) === 1 ? '' : num(b.per) + ' ') + 'CL (max +' + num(b.max) + ')' : '';
        return (b.kind === 'Damage' ? '' : b.kind + ': ') + (dice || (b.perOn ? '' : '0')) + per + (b.kind === 'Damage' ? ' ' + b.dmgType + ' damage' : '') + (b.save ? ' • ' + b.save : '');
      }
      case 'defense': return b.mode + ': ' + (['DR', 'Energy Resistance', 'Spell Resistance'].indexOf(b.mode) >= 0 ? num(b.value) + (b.mode === 'DR' ? '/' : ' ') : '') + (b.mode === 'Spell Resistance' ? '' : b.what);
      case 'size': return 'Size: ' + (SIZE_STEPS[String(b.steps)] || (sgn(num(b.steps)) + ' categories'));
      case 'metamagic': return 'Metamagic (' + metamagicCostText(b) + ') → ' + metamagicTxText(b) + (b.appliesTo ? ' [' + b.appliesTo + ']' : '');
      case 'rule': return b.text || 'Rule effect (empty)';
      case 'tier': return 'CL Tier: ' + b.branches.map((br) => br.cond + ' → ' + (br.kids.map(blockText).join(' + ') || '—')).join(' | ');
      case 'synergy': return b.cond + ' → ' + (b.kids.map(blockText).join(' + ') || '—');
      case 'table': return 'Roll ' + b.die + ': ' + b.rows.map((r) => '[' + r.roll + '] ' + (r.kids.map(blockText).join(' + ') || '—')).join(' ');
      default: return b.type;
    }
  }

  // ---- 6 benchmark spells ----
  function spellBase(name, src, classes, school, desc, comps, env) {
    const e = blankEntry('spell');
    Object.assign(e, { name: name, source: src, text: desc });
    e.spell = { classes: classes.map((c) => ({ cls: c[0], lvl: c[1] })), school: school, descriptors: env.desc || [], comps: Object.assign({ V: false, S: false, M: false, F: false, DF: false, XP: false }, comps) };
    Object.assign(e.delivery, { action: env.action || 'Standard', range: env.range || 'Touch', area: env.area || '', sr: env.sr || 'Yes (harmless)' });
    e.delivery.save = Object.assign(e.delivery.save, env.save || { type: 'None', effect: 'Negates' });
    Object.assign(e.lifecycle, env.life || {});
    return e;
  }
  PRESETS.push(
    { id: 'gheroism', icon: '✨', label: 'Greater Heroism (+4 Morale, Fear Immunity, Temp HP per CL)', build() {
      const e = spellBase('Greater Heroism', 'PHB p.240', [['Brd', 5], ['Sor/Wiz', 6]], 'Enchantment', 'Imbues a creature with great bravery and morale in battle.', { V: true, S: true }, { desc: ['Mind-Affecting'], range: 'Touch', area: 'Creature touched', save: { type: 'Will', effect: 'Negates (harmless)' }, life: { duration: 'minPerLevel', durValue: 1 } });
      e.effects = [BLK('bonus', { targets: ['atk.all', 'save.all', 'skill.all'], value: 4, btype: 'Morale' }), BLK('defense', { mode: 'Immunity', what: 'Fear' }), BLK('damage', { kind: 'Temp HP', dice: '', perOn: true, amount: 1, per: 1, max: 20 })];
      return e; } },
    { id: 'aid', icon: '💚', label: 'Aid (+1 Morale, 1d8 + 1/CL Temp HP)', build() {
      const e = spellBase('Aid', 'PHB p.196', [['Clr', 2], ['Good', 2], ['Luck', 2]], 'Enchantment', 'The subject gains a +1 morale bonus on attack rolls and saves against fear effects, plus temporary hit points equal to 1d8 + caster level (maximum +10 at 10th).', { V: true, S: true, DF: true }, { desc: ['Mind-Affecting'], range: 'Touch', area: 'Living creature touched', save: { type: 'None', effect: 'Negates' }, life: { duration: 'minPerLevel', durValue: 1 } });
      e.effects = [BLK('bonus', { targets: ['atk.all'], value: 1, btype: 'Morale' }), BLK('bonus', { targets: ['save.all'], value: 1, btype: 'Morale', condition: 'vs Fear' }), BLK('damage', { kind: 'Temp HP', dice: '1d8', perOn: true, amount: 1, per: 1, max: 10 })];
      return e; } },
    { id: 'dfavor', icon: '⚔️', label: 'Divine Favor (+1 Luck per 3 CL, max +3)', build() {
      const e = spellBase('Divine Favor', 'PHB p.224', [['Clr', 1], ['Pal', 1]], 'Evocation', 'You gain a +1 luck bonus on attack and weapon damage rolls for every three caster levels (minimum +1, maximum +3).', { V: true, S: true, DF: true }, { range: 'Personal', area: 'You', sr: 'No', life: { duration: 'text', durText: '1 minute' } });
      e.effects = [BLK('bonus', { targets: ['atk.all', 'dmg.all'], value: 1, btype: 'Luck', scaling: 'perCL', per: 3, min: 1, max: 3, condition: 'weapon damage' })];
      return e; } },
    { id: 'rmight', icon: '📏', label: 'Righteous Might (Size +1, CL Tier DR C-Block)', build() {
      const e = spellBase('Righteous Might', 'PHB p.273', [['Clr', 5], ['Strength', 5]], 'Transmutation', 'You grow to Large size, gaining +4 size bonuses to Strength and Constitution, +2 enhancement bonus to natural armor, and damage reduction based on caster level.', { V: true, S: true, DF: true }, { range: 'Personal', area: 'You', sr: 'No', life: { duration: 'roundsPerLevel', durValue: 1, dismissible: true } });
      e.effects = [BLK('size', { steps: 1 }), BLK('bonus', { targets: ['str', 'con'], value: 4, btype: 'Size' }), BLK('bonus', { targets: ['ac.natural'], value: 2, btype: 'Enhancement' }),
        BLK('tier', { branches: [{ id: uid('br'), cond: 'CL ≤ 11', kids: [BLK('defense', { mode: 'DR', value: 3, what: 'evil or good' })] }, { id: uid('br'), cond: 'CL 12–14', kids: [BLK('defense', { mode: 'DR', value: 6, what: 'evil or good' })] }, { id: uid('br'), cond: 'CL ≥ 15', kids: [BLK('defense', { mode: 'DR', value: 9, what: 'evil or good' })] }] })];
      return e; } },
    { id: 'prismatic', icon: '🎯', label: 'Prismatic Spray (1d8 Roll Table C-Block)', build() {
      const e = spellBase('Prismatic Spray', 'PHB p.264', [['Sor/Wiz', 7]], 'Evocation', 'Seven shimmering rays spring from your hand. Creatures of 8 HD or less are blinded for 2d4 rounds. Each creature is struck by one or more rays.', { V: true, S: true }, { range: '60 ft.', area: 'Cone-shaped burst', sr: 'Yes', save: { type: 'None', effect: 'Negates' }, life: { duration: 'instant' } });
      const R = (roll, kids) => ({ id: uid('r'), roll: roll, kids: kids });
      e.effects = [BLK('rule', { text: 'Every creature of 8 HD or less in the area is blinded for 2d4 rounds.' }), BLK('table', { die: '1d8', rows: [
        R('1', [BLK('damage', { dice: '20', dmgType: 'Fire', save: 'Reflex half' })]), R('2', [BLK('damage', { dice: '40', dmgType: 'Acid', save: 'Reflex half' })]), R('3', [BLK('damage', { dice: '80', dmgType: 'Electricity', save: 'Reflex half' })]),
        R('4', [BLK('rule', { text: 'Green — Poison: dies (Fortitude partial: 1d6 Con damage instead)' })]), R('5', [BLK('rule', { text: 'Blue — Turned to stone (Fortitude negates)' })]),
        R('6', [BLK('rule', { text: 'Indigo — Insane, as insanity spell (Will negates)' })]), R('7', [BLK('rule', { text: 'Violet — Sent to another plane (Will negates)' })]), R('8', [BLK('rule', { text: 'Struck by two rays; roll twice more, ignoring any further 8 results' })])] })];
      return e; } },
    { id: 'primal', icon: '👁️', label: 'Primal Senses (+5 Listen/Spot, Low-Light, Synergy C-Block)', build() {
      const e = spellBase('Primal Senses', 'Dragon Magic p.71', [['Drd', 3], ['Rgr', 3], ['Sor/Wiz', 3]], 'Transmutation', 'Low-light vision and +5 competence bonus on Listen and Spot checks. Combined with another Primal spell you gain uncanny dodge.', { V: true, S: true }, { range: 'Personal', area: 'You', sr: 'No', life: { duration: 'text', durText: '24 hours' } });
      e.tags = ['#Primal'];
      e.effects = [BLK('bonus', { targets: ['skill.listen', 'skill.spot'], value: 5, btype: 'Competence' }), BLK('defense', { mode: 'Sense', what: 'Low-Light Vision' }),
        BLK('synergy', { cond: 'If 2+ active #Primal effects', kids: [BLK('bonus', { targets: ['initiative'], value: 5, btype: 'Competence' }), BLK('defense', { mode: 'Sense', what: 'Uncanny Dodge' })] })];
      return e; } },
    { id: 'searing', icon: '✨', label: 'Searing Spell (Metamagic Feat: +1 Slot, Pierce Fire Resist/Immunity)', build() {
      const e = blankEntry('feat');
      Object.assign(e, { name: 'Searing Spell', source: 'Sandstorm p.53', tags: ['#Metamagic'], facets: ['identity', 'prereqs', 'modifiers', 'effects'], text: 'A searing spell is so hot that it ignores fire resistance and deals half damage even to creatures immune to fire.' });
      e.effects = [BLK('metamagic', { costMode: 'slot', slotAdj: 1, transform: 'pierceRes', energy: 'Fire', appliesTo: '[Fire] spells' })];
      return e; } },
    { id: 'rod_quicken', icon: '⚡', label: 'Metamagic Rod of Quicken, Lesser (3/day Swift Cast up to 3rd Lvl)', build() {
      const e = blankEntry('wondrous');
      Object.assign(e, { name: 'Metamagic Rod of Quicken, Lesser', source: 'DMG p.236', tags: ['#Metamagic', '#Arcane'], facets: ['identity', 'modifiers', 'powers', 'effects'], text: 'The wielder can cast up to three spells per day of up to 3rd level that are quickened as though using the Quicken Spell feat.' });
      Object.assign(e.item, { subtype: 'Rod', slot: 'Held', consumable: false, price: 35000, cl: 17 });
      e.effects = [BLK('metamagic', { costMode: 'rod', uses: 3, maxSpellLvl: 3, transform: 'quicken', appliesTo: 'Spells up to 3rd level' })];
      return e; } }
  );

  // --------------------------------------------------------------------------
  // 5. App state & persistence
  // --------------------------------------------------------------------------
  const LS_KEY = 'forgeSandbox.v2';
  function loadLS() { try { return JSON.parse(window.localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveLS() {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify({ templates: S.templates, livingTags: S.livingTags, customBonusTypes: S.customBonusTypes, house: S.house })); } catch (e) { /* storage unavailable on some file:// contexts */ }
  }
  const persisted = loadLS();
  const S = {
    entry: blankEntry('weapon'),
    activePreset: '',
    templates: Array.isArray(persisted.templates) ? persisted.templates : [],
    livingTags: Array.isArray(persisted.livingTags) ? persisted.livingTags : [],
    customBonusTypes: Array.isArray(persisted.customBonusTypes) ? persisted.customBonusTypes : [],
    house: { critCap: 0 }, // engine-ready; Stage 2 feeds house rules from the Character Sheet
    spot: null,
    ui: { viewMode: 'scratch', liveOpenMobile: false, facetOpen: {}, cardOpen: {}, jsonOpen: false, attachOpen: false, tplSaveOpen: false, newTplName: '', houseOpen: false, customTypeOpen: false, customType: { name: '', stacks: false, lostFF: false },
      dmgDraft: { count: 1, die: 'd6', type: 'Fire', crit: 'normal', cond: '' }, extraDraft: 'rays' }
  };

  // --------------------------------------------------------------------------
  // 6. Rule engine (sandbox-local, explicit schema only)
  // --------------------------------------------------------------------------
  function allBonusTypes() { return BONUS_TYPES.concat(S.customBonusTypes.map((c) => Object.assign({ custom: true }, c))); }
  const baseName = (b) => String((b && b.name) || '').replace(/\s*\(.*\)$/, '');
  function enchApplies(e, kind) { return !!e && (e.on === kind || (e.on === 'armor+shield' && kind !== 'weapon')); }
  function crystalApplies(c, kind) { return !!c && (c.on === kind || (c.on === 'armor+shield' && kind !== 'weapon')); }
  const enchById = (id) => byId(CAT.enchants, id);
  const crystalById = (id) => byId(CAT.crystals, id);
  function partText(p) {
    const d = p.die === 'flat' ? String(num(p.count)) : (/^\d+d\d+$/.test(p.die) ? p.die : num(p.count, 1) + p.die);
    const crit = p.crit === 'onCritOnly' ? ' (On Crit Only)' : p.crit === 'multiply' ? ' (×Crit)' : '';
    return d + ' ' + p.type + crit + (p.cond ? ' [' + p.cond + ']' : '');
  }

  function chassisView(ch) {
    const isW = ch.kind === 'weapon';
    const base = isW ? (byId(CAT.weapons, ch.baseId) || WEAPONS[5]) : (byId(CAT.armors, ch.baseId) || ARMORS[3]);
    const kind = isW ? 'weapon' : base.kind;
    const enh = Math.max(0, Math.min(5, num(ch.enhancement)));
    const warnings = [], badges = [], mods = [], dr = [], energy = [];
    let sr = 0;
    const enchs = (ch.enchantments || []).map(enchById).filter(Boolean);
    let plusSum = 0;
    enchs.forEach((e) => { if (!enchApplies(e, kind)) warnings.push(e.name + ' cannot be applied to a ' + kind); plusSum += e.plus || 0; });
    const effective = enh + plusSum;
    if (enchs.some((e) => e.plus) && enh < 1) warnings.push('Prerequisites Not Met: special abilities require at least a +1 enhancement bonus');
    if (effective > 10) warnings.push('Effective enhancement +' + effective + ' exceeds the +10 cap');
    const mat = ch.material;
    const mwIncluded = ['mithral', 'adamantine', 'darkwood'].indexOf(mat) >= 0 || (isW && base.id === 'katana');
    const isMW = mat === 'masterwork' || mwIncluded || enh > 0;
    if (mat === 'darkwood' && !base.wooden) warnings.push('Darkwood applies only to wooden items');
    const gpRows = [['Base ' + baseName(base), num(base.cost)]];
    if (isMW && !mwIncluded) gpRows.push(['Masterwork', isW ? 300 : 150]);
    if (isW) {
      if (mat === 'mithral') gpRows.push(['Mithral (+500 gp/lb.)', 500 * num(base.weight)]);
      if (mat === 'adamantine') gpRows.push(['Adamantine', 3000]);
      if (mat === 'cold_iron') { gpRows.push(['Cold Iron (double base)', num(base.cost)]); if (enh > 0) gpRows.push(['Cold Iron enchant surcharge', 2000]); }
      if (mat === 'alchemical_silver') gpRows.push(['Alchemical Silver', base.handed === 'Light' ? 20 : base.handed === 'Two-Handed' ? 180 : 90]);
      if (mat === 'darkwood') gpRows.push(['Darkwood (+10 gp/lb.)', 10 * num(base.weight)]);
    } else {
      const cat = base.type;
      if (mat === 'mithral') gpRows.push(['Mithral', cat === 'Medium' ? 4000 : cat === 'Heavy' ? 9000 : 1000]);
      if (mat === 'adamantine') gpRows.push(['Adamantine', cat === 'Medium' ? 10000 : cat === 'Heavy' ? 15000 : 5000]);
      if (mat === 'darkwood') gpRows.push(['Darkwood (+10 gp/lb.)', 10 * num(base.weight)]);
      if (mat === 'cold_iron') gpRows.push(['Cold Iron (double base)', num(base.cost)]);
      if (mat === 'alchemical_silver') gpRows.push(['Alchemical Silver', 90]);
    }
    if (effective > 0) gpRows.push(['Enhancement (+' + effective + ' effective)', effective * effective * (isW ? 2000 : 1000)]);
    enchs.filter((e) => e.gp).forEach((e) => gpRows.push([e.name, e.gp]));
    let crystal = null;
    const c = crystalById(ch.crystal && ch.crystal.id);
    if (c) {
      let ti = Math.max(0, CRYSTAL_TIERS.indexOf(ch.crystal.tier));
      if (c.cost[ti] == null) ti = c.cost.findIndex((x) => x != null);
      const tier = CRYSTAL_TIERS[ti];
      crystal = { c: c, ti: ti, tier: tier, text: c.tiers[ti] || '' };
      gpRows.push([c.name + ' (' + tier + ')', num(c.cost[ti])]);
      if (!crystalApplies(c, kind)) warnings.push(c.name + ' does not fit a ' + kind);
      if (tier === 'least' && !isMW) warnings.push('Prerequisites Not Met: Least crystal requires a masterwork item');
      if (enh < CRYSTAL_REQ[tier]) warnings.push('Prerequisites Not Met: ' + cap1(tier) + ' crystal requires +' + CRYSTAL_REQ[tier] + ' enhancement');
      badges.push('💎 ' + c.name + ': ' + (c.tiers[ti] || ''));
      if (c.mods && c.mods[ti]) c.mods[ti].forEach((m) => mods.push(Object.assign({}, m, { source: c.name })));
      if (c.dr) dr.push({ value: c.dr[ti], bypass: '-', source: c.name });
    }
    const gpTotal = gpRows.reduce((a, r) => a + r[1], 0);
    const view = { isW: isW, kind: kind, base: base, enh: enh, plusSum: plusSum, effective: effective, gpRows: gpRows, gpTotal: gpTotal, warnings: warnings, badges: badges, mods: mods, dr: dr, energy: energy, crystal: crystal, isMW: isMW, enchs: enchs };
    if (isW) {
      const w = ch.weapon;
      const keen = enchs.some((e) => e.effect.keen);
      if (keen && !/Slashing|Piercing/i.test(w.dmgType)) warnings.push('Keen requires a Slashing or Piercing weapon');
      const size = Math.max(1, 21 - num(w.critRange, 20));
      const rawLow = 21 - size * (keen ? 2 : 1);
      const capAt = num(S.house.critCap);
      const capped = capAt > 0 && rawLow < capAt;
      const low = capped ? capAt : rawLow;
      const mult = Math.max(2, num(w.critMult, 2));
      const parts = [{ count: 1, die: w.dice, type: w.dmgType, crit: 'multiply', source: 'Base', raw: true }];
      enchs.forEach((e) => (e.effect.parts || []).forEach((p) => parts.push(Object.assign({}, p, { count: p.perMult ? p.count * (mult - 1) : p.count, source: e.name }))));
      if (crystal && crystal.c.parts && crystal.c.parts[crystal.ti]) {
        const cp = crystal.c.parts[crystal.ti];
        parts.push({ count: cp[0] === 0 ? num(cp[1]) : cp[0], die: cp[0] === 0 ? 'flat' : cp[1], type: crystal.c.ptype || 'Untyped', crit: 'normal', source: crystal.c.name, cond: crystal.c.cond || '' });
      }
      (ch.damageParts || []).forEach((p) => parts.push(Object.assign({ source: 'Custom' }, p)));
      enchs.forEach((e) => { if (e.effect.badge) badges.push('⚔️ ' + e.name + ': ' + e.effect.badge); });
      if (mat === 'adamantine') badges.push('⚔️ Bypasses DR/adamantine & hardness < 20');
      if (mat === 'cold_iron') badges.push('⚔️ Bypasses DR/cold iron');
      if (mat === 'alchemical_silver') badges.push('⚔️ Bypasses DR/silver (-1 damage)');
      const ranged = !!base.ranged;
      const fmt = (lo) => (lo < 20 ? lo + '–20' : '20') + '/×' + mult;
      Object.assign(view, { dice: w.dice, critLow: low, rawLow: rawLow, capped: capped, critMult: mult, keen: keen, parts: parts, ranged: ranged, handed: w.handed, dmgType: w.dmgType,
        critText: fmt(low) + (capped ? ' (Capped by House Rule)' : ''), rawCritText: fmt(rawLow), rangeText: w.rangeOn && num(w.range) > 0 ? num(w.range) + ' ft.' : '',
        dmgBonus: enh > 0 ? enh : 0, atkBonus: enh > 0 ? enh : isMW ? 1 : 0 });
    } else {
      const a = ch.armor;
      let type = a.type, maxDex = num(a.maxDex, 99), acp = num(a.acp), asf = num(a.asf), speed = num(a.speed, 30);
      if (isMW && mat !== 'mithral' && mat !== 'darkwood') acp = Math.min(0, acp + 1);
      if (mat === 'mithral') { acp = Math.min(0, acp + 3); asf = Math.max(0, asf - 10); if (maxDex < 99) maxDex += 2; if (type === 'Heavy') type = 'Medium'; else if (type === 'Medium') type = 'Light'; }
      if (mat === 'darkwood' && kind === 'shield') acp = Math.min(0, acp + 2);
      if (type === 'Light' || kind === 'shield') speed = 30;
      if (mat === 'adamantine' && kind === 'armor') dr.push({ value: a.type === 'Heavy' ? 3 : a.type === 'Medium' ? 2 : 1, bypass: '-', source: 'Adamantine' });
      enchs.forEach((e) => {
        if (e.effect.mods) e.effect.mods.forEach((m) => mods.push(Object.assign({}, m, { source: e.name })));
        if (e.effect.badge) badges.push('🛡️ ' + e.name + ': ' + e.effect.badge);
        if (e.effect.sr) sr = Math.max(sr, e.effect.sr);
        if (e.effect.dr) dr.push(Object.assign({ source: e.name }, e.effect.dr));
        if (e.effect.energy) energy.push(Object.assign({ source: e.name }, e.effect.energy));
      });
      Object.assign(view, { armor: { type: type, armorBonus: num(a.armorBonus), maxDex: maxDex, acp: acp, asf: asf, speed: speed }, sr: sr });
    }
    view.name = synthChassisName(ch, view);
    return view;
  }
  function synthChassisName(ch, v) {
    const parts = [];
    if (v.enh > 0) parts.push('+' + v.enh);
    v.enchs.forEach((e) => parts.push(e.name));
    const matName = (MATERIALS.find((m) => m.id === ch.material) || {}).name;
    if (ch.material === 'masterwork') { if (!v.enh) parts.push('Masterwork'); } else if (ch.material !== 'standard') parts.push(matName);
    parts.push(baseName(v.base).replace(/^Shield, (.*)$/, '$1 Shield'));
    let n = parts.join(' ');
    if (v.crystal) n += ' + ' + cap1(v.crystal.tier) + ' ' + v.crystal.c.name;
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
  function alignAxes(a) { const i = ALIGNS.indexOf(a); return [i % 3, Math.floor(i / 3)]; } // row-major grid: column = law-chaos, row = good-evil
  function clericLegal(deity, al) { const d = alignAxes(deity), c = alignAxes(al); return (Math.abs(d[0] - c[0]) + Math.abs(d[1] - c[1])) <= 1; }

  function altText(a) {
    switch (a.kind) {
      case 'ability': return a.ability.toUpperCase() + ' ' + num(a.min);
      case 'bab': return 'Base Attack Bonus +' + num(a.min);
      case 'skill': return ((SKILL_BY_KEY[a.skill] || {}).name || a.skill) + ' ' + num(a.min) + ' ranks';
      case 'feat': { const f = String(a.feat || '').trim(); return !f ? 'Feat (unset)' : f[0] === '#' ? 'Any feat from ' + f : f; }
      case 'level': return (a.levelKind === 'casterLevel' ? 'Caster Level' : a.levelKind === 'charLevel' ? 'Character Level' : (a.cls || 'Class') + ' Level') + ' ' + num(a.min);
      case 'alignment': return a.align;
      case 'custom': return a.text ? 'DM: ' + a.text : 'Custom Story / DM Requirement (unset)';
      case 'spellcasting': return 'Ability to cast ' + (a.cls || 'any') + ' spells of level ' + num(a.min);
      case 'deity': return 'Patron Deity: ' + (a.feat || '(unset)');
      default: return '?';
    }
  }
  const prereqText = (rows) => (rows || []).map((r) => r.alts.map(altText).join(' OR ')).join(', ');

  // Dice scaling: "per X CL" => count × min(max, floor((CL - start)/per) + 1)
  function scaledCount(d, cl) {
    if (d.scaling !== 'perCL') return num(d.count, 1);
    if (cl < num(d.start, 1)) return 0;
    const steps = Math.floor((cl - num(d.start, 1)) / Math.max(1, num(d.per, 1))) + 1;
    return num(d.count, 1) * Math.min(Math.max(1, num(d.max, 10)), steps);
  }
  function damageText(d) {
    if (!d || !d.on || d.type === 'None') return '';
    const die = String(d.die || 'd6');
    const unit = die === 'flat' ? String(num(d.count)) : (/^\d+d\d+$/.test(die) ? die : num(d.count, 1) + die);
    const type = d.type === 'Healing' ? 'Healing' : d.type;
    if (d.scaling !== 'perCL') return unit + ' ' + type;
    const per = Math.max(1, num(d.per, 1)), maxSteps = Math.max(1, num(d.max, 10));
    const maxText = die === 'flat' ? String(num(d.count) * maxSteps) : (num(d.count, 1) * maxSteps) + die.replace(/^\d+/, '');
    return unit + ' ' + type + ' per ' + (per === 1 ? '' : per + ' ') + 'CL' + (num(d.start, 1) > 1 ? ' from CL ' + d.start : '') + ' (max ' + maxText + ')';
  }
  function damageAtCL(d, cl) {
    if (!d || !d.on || d.type === 'None') return '';
    const n = scaledCount(d, cl), die = String(d.die || 'd6');
    if (die === 'flat') return String(n);
    if (/^\d+d\d+$/.test(die)) return d.scaling === 'perCL' ? (n * num(die.split('d')[0])) + 'd' + die.split('d')[1] : die;
    return n + die;
  }
  const ATTACK_LABEL = { none: 'No Attack Roll', 'melee-touch': 'Melee Touch Attack', 'ranged-touch': 'Ranged Touch Attack (Ray / Orb)', weapon: 'Weapon Attack' };
  function useText(u) {
    switch (u.mode) {
      case 'passive': return 'Passive';
      case 'atwill': return 'At-Will';
      case 'perDay': return num(u.n) + '/day';
      case 'perEncounter': return num(u.n) + '/encounter';
      case 'charges': return num(u.n) + ' charges';
      case 'spellSlot': return 'Expend Spell Slot (Level ' + num(u.slotLevel) + ')';
      case 'resourcePool': return 'Expend ' + num(u.poolCost, 1) + ' ' + (u.pool || 'Resource') + ' use' + (num(u.poolCost, 1) > 1 ? 's' : '');
      case 'cooldown': return 'Recharge ' + (u.cooldown || '1d4+1') + ' rounds';
      default: return u.mode;
    }
  }
  const DURATIONS = [['instant', 'Instantaneous'], ['permanent', 'Permanent / Equipped'], ['rounds', 'X Rounds'], ['roundsPerLevel', 'Rounds / Level'], ['minPerLevel', 'Minutes / Level'], ['tenMinPerLevel', '10 Minutes / Level'], ['hourPerLevel', 'Hours / Level'], ['saveEnds', 'Save Ends'], ['text', 'Custom (text)']];
  function durationText(l) {
    const v = Math.max(1, num(l.durValue, 1));
    switch (l.duration) {
      case 'instant': return 'Instantaneous';
      case 'permanent': return 'Permanent / Equipped';
      case 'rounds': return v + ' round' + (v > 1 ? 's' : '');
      case 'roundsPerLevel': return (v > 1 ? v + ' rounds' : '1 round') + '/level';
      case 'minPerLevel': return (v > 1 ? v + ' min.' : '1 min.') + '/level';
      case 'tenMinPerLevel': return '10 min./level';
      case 'hourPerLevel': return (v > 1 ? v + ' hours' : '1 hour') + '/level';
      case 'saveEnds': return 'Save Ends';
      default: return l.durText || 'See text';
    }
  }
  function spellLevelText(sp) { return (sp.classes || []).map((c) => c.cls + ' ' + c.lvl).join(', '); }
  function dcText(en) {
    const s = en.delivery.save;
    if (s.type === 'None') return '';
    const dc = s.dcMode === 'flat' ? 'DC ' + num(s.flat) : s.dcMode === 'hd' ? 'DC 10 + 1/2 HD + ' + s.stat.toUpperCase() : 'DC 10 + ' + (en.spell.classes[0] ? num(en.spell.classes[0].lvl) : 'Spell Level') + ' + ' + s.stat.toUpperCase();
    return s.type + ' ' + s.effect.toLowerCase() + ' (' + dc + ')';
  }
  const ORIGIN_LABEL = { new: 'New Entry', override: 'Override SRD', variant: 'Clone as Variant' };
  function powerSummary(pw) {
    const nm = pw.kind === 'attached' ? (pw.ref ? pw.ref.name : pw.name) : pw.name;
    const icon = pw.kind === 'attached' ? '🔮' : '⚡';
    const mode = pw.grantMode === 'known' ? ' [Spell List]' : pw.grantMode === 'slot' ? ' [Own Slot]' : '';
    const dmg = pw.damage && pw.damage.on ? ' • ' + damageText(pw.damage) : '';
    return icon + ' ' + useText(pw.use) + ': ' + (nm || 'Unnamed') + ' (' + pw.action + ')' + mode + dmg;
  }
  function modShort(m) {
    const v = (m.formula || 'flat') === 'flat' ? sgn(num(m.value)) : '+' + m.formula;
    const tl = TARGET_LABEL[m.target] || m.target;
    const showType = m.type !== 'Untyped' && tl.indexOf(m.type) < 0 && m.type.indexOf(tl) < 0;
    return v + ' ' + (showType ? m.type + ' ' : '') + tl + (m.condition ? ' (' + m.condition + ')' : '');
  }
  const LOCK_LABEL = {
    loseDex: 'Lose DEX Bonus to AC', flatFooted: 'Flat-Footed', cannotAct: 'Cannot Take Actions (Stunned/Dazed)', blinded: 'Blinded (-2 AC, Lose DEX)',
    entangled: 'Entangled (-2 Atk, -4 DEX)', negLevel: 'Negative Level (-1 Atk/Saves/Checks/CL, -5 HP per stack)', extraAttack: 'Extra Attack on Full Attack (Haste / Speed)'
  };

  // Header line 2: the clean RAW stat line of the object itself
  function rawHeaderLine(en) {
    const F = en.facets, seg = [];
    const has = (k) => F.indexOf(k) >= 0;
    if (has('chassis')) {
      const v = chassisView(en.chassis);
      if (v.isW) {
        seg.push((v.ranged ? 'Ranged' : 'Melee') + ' • ' + v.handed + ' • ' + en.chassis.weapon.category);
        const extra = v.parts.filter((p) => !p.raw && p.crit !== 'onCritOnly').map((p) => '+' + (p.die === 'flat' ? p.count : p.count + p.die) + ' ' + p.type + (p.cond ? ' ' + p.cond : ''));
        seg.push(v.dice + (v.dmgBonus ? sgn(v.dmgBonus) : '') + ' ' + v.dmgType + (extra.length ? ' ' + extra.join(' ') : ''));
        seg.push(v.critText);
        const onCrit = v.parts.filter((p) => p.crit === 'onCritOnly');
        if (onCrit.length) seg.push('On crit: ' + onCrit.map((p) => '+' + p.count + p.die + ' ' + p.type).join(', '));
        if (v.atkBonus) seg.push('Attack ' + sgn(v.atkBonus) + ' ' + (v.enh ? 'Enhancement' : 'Masterwork'));
        seg.push('Range ' + (v.rangeText || '—'));
      } else {
        const a = v.armor;
        seg.push((v.kind === 'shield' ? 'Shield ' : 'Armor ') + sgn(a.armorBonus) + (v.enh ? ' (' + sgn(v.enh) + ' Enh)' : ''));
        seg.push('Max Dex ' + (a.maxDex >= 99 ? '—' : sgn(a.maxDex)));
        seg.push('Armor Check Penalty ' + a.acp);
        seg.push('Arcane Spell Failure ' + a.asf + '%');
        if (v.kind !== 'shield') seg.push(a.type + ' • Speed ' + a.speed + ' ft.');
      }
    }
    if (en.blueprint === 'spell' || has('delivery')) {
      const d = en.delivery, sp = en.spell;
      if (en.blueprint === 'spell') seg.push(sp.school + (sp.descriptors.length ? ' [' + sp.descriptors.join(', ') + ']' : ''));
      if (has('delivery')) {
        seg.push(d.action + (d.action === 'Passive' || d.action === 'Reaction' ? '' : ' Action'));
        if (d.range) seg.push(d.range);
        if (d.area) seg.push(d.area);
        if (d.attackOn && d.attack !== 'none') seg.push(ATTACK_LABEL[d.attack]);
        const dc = dcText(en); if (dc) seg.push(dc);
        if (en.blueprint === 'spell') seg.push('SR ' + d.sr);
        const dm = damageText(d.damage); if (dm) seg.push(dm);
        d.extras.forEach((x) => seg.push(x.text));
      }
    }
    if (has('lifecycle')) {
      const l = en.lifecycle;
      if (l.use.mode !== 'atwill') seg.push(useText(l.use));
      if (l.duration !== 'instant' || en.blueprint === 'spell') seg.push('Duration ' + durationText(l) + (l.dismissible ? ' (D)' : ''));
      if (l.stackable) seg.push('Stackable ×' + l.maxStacks);
      if (l.ongoingOn) seg.push(l.ongoing.kind === 'dot' ? 'Ongoing ' + l.ongoing.dice + ' ' + l.ongoing.type + '/round' : 'Fast Healing ' + l.ongoing.value);
    }
    if (isItemBp(en.blueprint) && !has('chassis')) {
      seg.push(en.item.subtype + ' • ' + en.item.slot + (isConsumable(en) ? ' • Consumable' : '') + (num(en.item.cl) ? ' • CL ' + num(en.item.cl) : ''));
    }
    if (has('progression')) {
      const p = en.progression;
      const spellLv = p.levels.slice(0, p.maxLevel).filter((l) => l.spell).length;
      seg.push('d' + p.hitDie + ' HD • ' + (p.bab === 'full' ? 'Full' : p.bab) + ' BAB • Good ' + (['fort', 'ref', 'will'].filter((s) => p.good[s]).map((s) => ({ fort: 'Fortitude', ref: 'Reflex', will: 'Will' }[s])).join('/') || 'none') + ' • ' + p.skillPts + ' + Int skill points • ' + p.maxLevel + ' levels' + (spellLv ? ' • +1 Spellcasting ×' + spellLv : ''));
    }
    if (has('grants')) {
      const g = en.grants;
      if (en.blueprint === 'deity') seg.push(ALIGN_NAMES[g.deityAlign] + ' • Cleric alignments: ' + ALIGNS.filter((a) => clericLegal(g.deityAlign, a)).join(', ') + ' • Favored Weapon: ' + g.favoredWeapon + (g.domains.length ? ' • Domains: ' + g.domains.map((d) => d.name).join(', ') : ''));
      else if (en.blueprint === 'domain') seg.push('Granted Power: ' + (g.grantedPower ? g.grantedPower.slice(0, 90) + (g.grantedPower.length > 90 ? '…' : '') : '—') + ' • Spells: ' + (g.ladder.filter(Boolean).length) + '/9');
    }
    if (en.blueprint === 'feat') seg.push('Feat' + (en.repeat.mode === 'upto' ? ' • Up to ' + en.repeat.n + '×' : en.repeat.mode === 'per' ? ' • Per Weapon / School' : ''));
    return seg.filter(Boolean);
  }
  // Header line 3: summary pills
  function summaryPills(en) {
    const F = en.facets, pills = [];
    const has = (k) => F.indexOf(k) >= 0;
    if (has('chassis')) chassisView(en.chassis).badges.forEach((b) => pills.push(['dim', b]));
    if (has('modifiers')) {
      en.modifiers.forEach((m) => pills.push([num(m.value) < 0 || m.type === 'Penalty' ? 'rose' : 'emerald', '✨ ' + modShort(m)]));
      Object.keys(en.locks).forEach((k) => { if (en.locks[k]) pills.push(['rose', '🩸 ' + LOCK_LABEL[k].split(' (')[0]]); });
      en.substitutions.forEach((s) => pills.push(['sky', '🔄 ' + s.to.toUpperCase() + ' → ' + { fort: 'Fortitude', ref: 'Reflex', will: 'Will' }[s.save]]));
    }
    if (has('defenses')) {
      const d = en.defenses;
      d.dr.forEach((x) => pills.push(['amber', '🛡️ DR ' + x.value + '/' + x.bypass]));
      d.energy.forEach((x) => pills.push(['amber', '🛡️ ' + ((x.mode || 'Resistance') === 'Resistance' ? 'Resist ' + x.type + ' ' + x.value : x.type + ' ' + x.mode)]));
      if (d.srOn) pills.push(['purple', '🛡️ SR ' + (d.sr.mode === 'level' ? '10 + level' : d.sr.value)]);
      if (num(d.concealment)) pills.push(['sky', '🛡️ ' + d.concealment + '% miss chance']);
      if (d.reactionOn && d.reaction) pills.push(['sky', '⚡ Reaction: ' + d.reaction]);
    }
    if (has('chassis')) { const v = chassisView(en.chassis); v.dr.forEach((x) => pills.push(['amber', '🛡️ DR ' + x.value + '/' + x.bypass])); v.energy.forEach((x) => pills.push(['amber', '🛡️ Resist ' + x.type + ' ' + x.value])); if (v.sr) pills.push(['purple', '🛡️ SR ' + v.sr]); }
    if (has('prereqs') && en.prereqs.length) pills.push(['indigo', '🏛️ Prerequisites: ' + prereqText(en.prereqs)]);
    if (has('effects')) en.effects.forEach((b) => pills.push([{ bonus: 'indigo', damage: 'rose', defense: 'emerald', size: 'purple', metamagic: 'purple', rule: 'dim', tier: 'sky', synergy: 'sky', table: 'amber' }[b.type] || 'dim', BLOCK_TYPES[b.type].icon + ' ' + blockText(b)]));
    if (has('powers')) en.powers.forEach((pw) => pills.push([pw.kind === 'attached' ? 'purple' : 'amber', powerSummary(pw)]));
    if (has('grants')) {
      const g = en.grants;
      if (en.blueprint !== 'deity') g.domains.forEach((d) => pills.push(['amber', '✨ Domain: ' + d.name]));
      g.deities.forEach((d) => pills.push(['amber', '🏛️ Deity: ' + d.name + ' (' + d.align + ')']));
      g.featGrants.forEach((x) => pills.push(['indigo', '🎯 L' + x.level + ': Bonus Feat ×' + x.count + ' from ' + x.pool]));
    }
    return pills;
  }

  // --------------------------------------------------------------------------
  // 7. Canonical V2.5 JSON export
  // --------------------------------------------------------------------------
  function exportDamage(d) {
    if (!d || !d.on || d.type === 'None') return null;
    const o = { dice: d.die === 'flat' ? null : (/^\d+d\d+$/.test(d.die) ? d.die : num(d.count, 1) + d.die), bonus: d.die === 'flat' ? num(d.count) : 0, type: String(d.type).toLowerCase() };
    if (d.scaling === 'perCL') o.scaling = { mode: 'perCasterLevels', every: num(d.per, 1), startCL: num(d.start, 1), maxSteps: num(d.max, 10) };
    return o;
  }
  function exportUse(u) {
    const o = { mode: u.mode };
    if (['perDay', 'perEncounter', 'charges'].indexOf(u.mode) >= 0) o.uses = num(u.n);
    if (u.mode === 'spellSlot') o.slotLevel = num(u.slotLevel);
    if (u.mode === 'resourcePool') { o.pool = u.pool; o.cost = num(u.poolCost, 1); }
    if (u.mode === 'cooldown') o.recharge = u.cooldown;
    return o;
  }
  const cleanMods = (list) => list.map((m) => { const o = { target: m.target, type: m.type }; if ((m.formula || 'flat') === 'flat') o.value = num(m.value); else o.formula = m.formula; if (m.condition) o.condition = m.condition; return o; });
  function cleanAlt(a) {
    switch (a.kind) {
      case 'ability': return { kind: 'ability', ability: a.ability, min: num(a.min) };
      case 'bab': return { kind: 'bab', min: num(a.min) };
      case 'skill': return { kind: 'skill', skill: a.skill, ranks: num(a.min) };
      case 'feat': return a.feat && a.feat[0] === '#' ? { kind: 'tagPool', tag: a.feat } : { kind: 'feat', name: a.feat };
      case 'level': return { kind: a.levelKind, className: a.levelKind === 'classLevel' ? a.cls : undefined, min: num(a.min) };
      case 'alignment': return { kind: 'alignment', value: a.align };
      case 'custom': return { kind: 'custom', text: a.text };
      case 'spellcasting': return { kind: 'spellcasting', tradition: a.cls || 'any', spellLevel: num(a.min) };
      case 'deity': return { kind: 'patronDeity', name: a.feat };
      default: return a;
    }
  }
  function exportPower(pw) {
    const o = { id: pw.id, kind: pw.kind, name: pw.kind === 'attached' && pw.ref ? pw.ref.name : pw.name, action: pw.action, usage: exportUse(pw.use) };
    if (pw.kind === 'attached') { o.refId = pw.ref ? pw.ref.id : null; o.grantMode = pw.grantMode; }
    if (num(pw.cl)) o.casterLevel = num(pw.cl);
    if (num(pw.dc)) o.saveDC = num(pw.dc);
    if (pw.duration) o.duration = pw.duration;
    if (pw.attackOn && pw.attack !== 'none') o.attack = pw.attack;
    if (pw.range) o.range = pw.range;
    if (pw.area) o.area = pw.area;
    if (pw.save && pw.save.type !== 'None') o.save = { type: pw.save.type, effect: pw.save.effect };
    const dmg = exportDamage(pw.damage); if (dmg) o.damage = dmg;
    if (pw.modifiers.length) o.modifiers = cleanMods(pw.modifiers);
    if (pw.text) o.text = pw.text;
    if (pw.exportStandalone) o.exportStandalone = true;
    return o;
  }
  function exportBlock(b) {
    const o = Object.assign({}, b); delete o.id; o.summary = blockText(b);
    if (b.kids) { o.effects = b.kids.map(exportBlock); delete o.kids; }
    if (b.branches) o.branches = b.branches.map((br) => ({ cond: br.cond, effects: br.kids.map(exportBlock) }));
    if (b.rows) o.rows = b.rows.map((r) => ({ roll: r.roll, effects: r.kids.map(exportBlock) }));
    return o;
  }
  function exportFeature(f) { const o = { kind: f.kind, name: f.name }; if (f.refId) o.refId = f.refId; if (f.kind === 'inline') { o.abilityType = f.abilityType; if (f.text) o.text = f.text; } return o; }
  function exportEntry(en) {
    const F = en.facets, has = (k) => F.indexOf(k) >= 0;
    const out = { schemaVersion: 2.5, id: en.origin.mode === 'override' && en.origin.srdId ? en.origin.srdId : en.id, blueprint: en.blueprint, name: entryName(en), source: en.source, tags: en.tags.slice(), facets: F.slice() };
    if (en.origin.mode !== 'new') out.origin = { mode: en.origin.mode, srdId: en.origin.srdId, srdName: en.origin.srdName };
    if (en.text) out.text = en.text;
    if (en.blueprint === 'feat') out.timesSelectable = en.repeat.mode === 'upto' ? num(en.repeat.n) : en.repeat.mode === 'per' ? 'perWeaponOrSchool' : 1;
    if (isItemBp(en.blueprint)) { out.item = { subtype: en.item.subtype, slot: en.item.slot, consumable: isConsumable(en) }; if (!has('chassis')) { out.item.price = num(en.item.price); out.item.casterLevel = num(en.item.cl); } }
    if (en.blueprint === 'spell') out.spell = { classLevels: en.spell.classes.map((c) => ({ class: c.cls, level: num(c.lvl) })), school: en.spell.school, descriptors: en.spell.descriptors.slice(), components: Object.keys(en.spell.comps).filter((k) => en.spell.comps[k]) };
    if (has('prereqs')) out.prerequisites = { all: en.prereqs.map((r) => ({ anyOf: r.alts.map(cleanAlt) })), text: prereqText(en.prereqs) };
    if (has('chassis')) {
      const ch = en.chassis, v = chassisView(ch);
      Object.assign(out, { baseItemId: ch.baseId, material: ch.material, enhancementBonus: v.enh, enhancements: ch.enchantments.slice(), effectiveEnhancement: v.effective, gpValue: v.gpTotal });
      if (v.crystal) out.augmentCrystal = { id: v.crystal.c.id, tier: v.crystal.tier };
      if (v.isW) {
        out.weapon = { category: ch.weapon.category, handedness: ch.weapon.handed, baseCritRange: num(ch.weapon.critRange), keen: v.keen, effectiveCritRange: v.critLow, critCappedByHouseRule: v.capped, critMultiplier: v.critMult, rangeIncrement: ch.weapon.rangeOn ? num(ch.weapon.range) : null };
        out.damageParts = v.parts.map((p) => ({ dice: p.die === 'flat' ? null : (/^\d+d\d+$/.test(p.die) ? p.die : num(p.count, 1) + p.die), bonus: p.die === 'flat' ? num(p.count) : 0, type: String(p.type).toLowerCase(), multiplyOnCrit: p.crit === 'multiply', onCritOnly: p.crit === 'onCritOnly', condition: p.cond || null, source: p.source }));
      } else out.armor = { armorType: v.armor.type, armorBonus: v.armor.armorBonus, maxDex: v.armor.maxDex >= 99 ? null : v.armor.maxDex, armorCheckPenalty: v.armor.acp, arcaneSpellFailure: v.armor.asf, speed: v.armor.speed };
      if (v.badges.length) out.tacticalBadges = v.badges.map((b) => b.replace(/^\S+\s/, ''));
    }
    if (has('modifiers')) {
      out.modifiers = cleanMods(en.modifiers);
      if (en.substitutions.length) out.substitutions = en.substitutions.map((s) => ({ target: 'save.' + s.save + '.abilityMod', op: s.op, from: '@' + s.from + 'Mod', source: '@' + s.to + 'Mod' }));
      const flags = Object.keys(en.locks).filter((k) => en.locks[k]); if (flags.length) out.ruleFlags = flags;
    }
    if (has('powers')) out.powers = en.powers.map(exportPower);
    if (has('effects')) {
      out.effects = en.effects.map(exportBlock);
      const mms = en.effects.filter((b) => b.type === 'metamagic');
      if (mms.length) out.metamagic = mms.map((b) => ({
        costMode: b.costMode,
        slotAdjustment: b.costMode === 'slot' ? num(b.slotAdj) : 0,
        usesPerDay: b.costMode === 'rod' || b.costMode === 'sudden' ? num(b.uses, 1) : null,
        maxSpellLevel: b.costMode === 'rod' ? num(b.maxSpellLvl, 3) : null,
        pool: b.costMode === 'pool' ? { name: b.pool, cost: num(b.poolCost, 1) } : null,
        transform: b.transform,
        dcBonus: b.transform === 'heighten' ? num(b.dcBonus, 1) : 0,
        energyType: b.transform === 'energySub' || b.transform === 'pierceRes' ? b.energy : null,
        rider: b.transform === 'rider' ? b.rider : null,
        appliesTo: b.appliesTo || null
      }));
    }
    if (en.blueprint === 'buff') out.buffKind = en.buffKind;
    if (has('delivery')) {
      const d = en.delivery;
      out.delivery = { action: d.action, range: d.range || null, area: d.area || null, attack: d.attackOn ? d.attack : 'none', spellResistance: d.sr };
      if (d.save.type !== 'None') out.delivery.save = { type: d.save.type, effect: d.save.effect, dc: dcText(en) };
      const dmg = exportDamage(d.damage); if (dmg) out.delivery.damage = dmg;
      if (d.extras.length) out.delivery.rules = d.extras.map((x) => ({ kind: x.kind, text: x.text }));
    }
    if (has('lifecycle')) {
      const l = en.lifecycle;
      out.lifecycle = { usage: exportUse(l.use), duration: l.duration, durationText: durationText(l), dismissible: !!l.dismissible };
      if (l.stackable) out.lifecycle.maxStacks = num(l.maxStacks);
      if (l.ongoingOn) out.lifecycle.ongoing = l.ongoing.kind === 'dot' ? { kind: 'dot', dice: l.ongoing.dice, type: l.ongoing.type.toLowerCase() } : { kind: 'fastHealing', value: num(l.ongoing.value) };
    }
    if (has('defenses')) {
      const d = en.defenses;
      out.defenses = { dr: d.dr.map((x) => ({ value: num(x.value), bypass: x.bypass })), energy: d.energy.map((x) => ({ type: x.type.toLowerCase(), mode: (x.mode || 'Resistance').toLowerCase(), value: num(x.value) })) };
      if (d.srOn) out.defenses.spellResistance = d.sr.mode === 'level' ? { formula: '10 + @level' } : { value: num(d.sr.value) };
      if (num(d.concealment)) out.defenses.missChance = num(d.concealment);
      if (d.reactionOn) out.defenses.reaction = d.reaction;
    }
    if (has('progression')) {
      const p = en.progression;
      out.progression = { mode: p.mode, maxLevel: p.maxLevel, hitDie: 'd' + p.hitDie, bab: p.bab, goodSaves: ['fort', 'ref', 'will'].filter((s) => p.good[s]), skillPointsPerLevel: num(p.skillPts), classSkills: (p.classSkills || []).slice(),
        levels: p.levels.slice(0, p.maxLevel).map((l, i) => ({ level: i + 1, bab: classBAB(p.bab, i + 1), fort: p.good.fort ? goodSave(i + 1) : poorSave(i + 1), ref: p.good.ref ? goodSave(i + 1) : poorSave(i + 1), will: p.good.will ? goodSave(i + 1) : poorSave(i + 1), features: l.features.map(exportFeature), spellcasting: l.spell ? '+1 level of existing spellcasting class' : null })) };
    }
    if (has('grants')) {
      const g = en.grants, o = {};
      if (en.blueprint === 'deity') Object.assign(o, { alignment: g.deityAlign, clericAlignments: ALIGNS.filter((a) => clericLegal(g.deityAlign, a)), favoredWeapon: g.favoredWeapon, portfolio: g.portfolio || null, dogma: g.dogma || null });
      if (en.blueprint === 'domain') Object.assign(o, { grantedPower: g.grantedPower || g.grantedPowerName ? { name: g.grantedPowerName || null, text: g.grantedPower, usage: exportUse(g.gpUse) } : null, spellLadder: g.ladder.map((s, i) => ({ level: i + 1, spell: s || null })).filter((x) => x.spell) });
      if (g.domains.length) o.domains = g.domains.map((d) => (d.kind === 'ref' ? { kind: 'ref', name: d.name, refId: d.refId || null } : { kind: 'inline', name: d.name, grantedPower: d.grantedPower, spellLadder: d.ladder.map((s, i) => ({ level: i + 1, spell: s || null })).filter((x) => x.spell) }));
      if (g.deities.length) o.deities = g.deities.map((d) => ({ kind: d.kind, name: d.name, alignment: d.align, favoredWeapon: d.favoredWeapon }));
      if (g.featGrants.length) o.bonusFeats = g.featGrants.map((x) => ({ count: num(x.count), pool: x.pool, level: num(x.level) }));
      out.grants = o;
    }
    return out;
  }

  // --------------------------------------------------------------------------
  // 8. SRD / MIC / master_db integration (http) with seed fallback (file://)
  // --------------------------------------------------------------------------
  const HANDED = { light: 'Light', '1h': 'One-Handed', '2h': 'Two-Handed', ranged: 'Two-Handed' };
  const SLOT_MAP = { Shoulders: 'Shoulders / Cloak', Wrists: 'Arms / Bracers', Waist: 'Waist / Belt', Hands: 'Hands / Gloves', Feet: 'Feet / Boots', Body: 'Body / Robe', 'Main Hand': 'Held' };
  const CLASS_ABBR = { Wizard: 'Sor/Wiz', Sorcerer: 'Sor/Wiz', Cleric: 'Clr', Druid: 'Drd', Bard: 'Brd', Paladin: 'Pal', Ranger: 'Rgr' };
  const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  function partsFromSrd(dps) {
    return (dps || []).map((p) => { const m = String(p.dice || '').match(/^(\d+)(d\d+)$/); return m ? { count: num(m[1]), die: m[2], type: cap1(String(p.type || 'Untyped').split(' ')[0]), crit: p.onCritOnly ? 'onCritOnly' : p.multiplyOnCrit ? 'multiply' : 'normal', cond: (String(p.type || '').match(/\((.*)\)/) || [])[1] || '' } : null; }).filter(Boolean);
  }
  function bonusTypeName(t) { const b = BONUS_TYPES.find((x) => x.id.toLowerCase() === String(t || '').toLowerCase()); return b ? b.id : 'Untyped'; }
  function modsFromSrd(list) { return (list || []).filter((m) => m && m.target && Number.isFinite(Number(m.value)) && Number(m.value) !== 0).map((m) => M(m.target, num(m.value), bonusTypeName(m.type), m.condition || '')); }
  function levelTextFromLearned(la) {
    const out = [], seen = {};
    Object.keys((la && la.class) || {}).forEach((k) => { const a = CLASS_ABBR[k] || k; if (seen[a] == null) { seen[a] = la.class[k]; out.push(a + ' ' + la.class[k]); } });
    Object.keys((la && la.domain) || {}).forEach((k) => out.push(k + ' ' + la.domain[k]));
    return out.join(', ');
  }
  function mergeSrd(C) {
    const seenW = new Set(CAT.weapons.map((w) => normName(baseName(w)))), seenA = new Set(CAT.armors.map((a) => normName(a.name)));
    let n = 0;
    C.getByType('Weapon').forEach((w) => {
      if (seenW.has(normName(w.name))) return;
      const dp = (w.damageParts || [])[0] || {};
      CAT.weapons.push({ id: w.id, name: w.name, cost: num(w.cost), dice: dp.dice || '1d6', critRange: num(w.critRange, 20), critMult: num(w.critMult, 2), category: /exotic/i.test(w.category) ? 'Exotic' : /martial/i.test(w.category) ? 'Martial' : 'Simple', handed: HANDED[w.handedness] || 'One-Handed', dmgType: cap1(String(dp.type || 'Slashing').split(/[\s/]/)[0]), weight: num(w.weight, 1), range: num(w.rangeIncrement), wooden: /wood|staff|club|bow/i.test(w.name), ranged: w.handedness === 'ranged', src: w.source || 'SRD', desc: w.shortDescription || '' });
      n++;
    });
    C.getByType('Armor').concat(C.getByType('Shield')).forEach((a) => {
      if (seenA.has(normName(a.name))) return;
      const isS = a.type === 'Shield', ab = (a.modifiers || []).find((m) => /^ac\.(armor|shield)$/.test(m.target));
      CAT.armors.push({ id: a.id, name: a.name, cost: num(a.cost), armorBonus: ab ? num(ab.value) : 0, maxDex: a.maxDex == null ? 99 : num(a.maxDex), acp: num(a.checkPenalty), asf: num(a.spellFailure), type: isS ? 'Shield' : (a.category || 'Light'), speed: parseInt(a.speed30, 10) || 30, kind: isS ? 'shield' : 'armor', weight: num(a.weight), wooden: /wood/i.test(a.name), src: a.source || 'SRD', desc: a.shortDescription || '' });
      n++;
    });
    const seenE = new Set(CAT.enchants.map((e) => normName(e.name)));
    (C.getEnhancements ? C.getEnhancements() : C.getByType('Enhancement')).forEach((e) => {
      if (seenE.has(normName(e.name)) || /Misc/.test(e.category || '')) return;
      const applies = String(e.appliesTo || '').toLowerCase();
      const on = /Weapon/.test(e.category) ? 'weapon' : e.targetType === 'Shield' || applies === 'shield' ? 'shield' : applies === 'armor' ? 'armor' : 'armor+shield';
      const parts = partsFromSrd(e.damageParts);
      CAT.enchants.push({ id: e.id, name: e.name, on: on, plus: num(e.enhIncrease), gp: num(e.flatCost), effect: { parts: parts.length ? parts : undefined, keen: !!(e.ruleFlags && e.ruleFlags.keen), mods: modsFromSrd(e.modifiers).map((m) => ({ target: m.target, value: m.value, type: m.type })) }, desc: e.shortDescription || stripHtml(e.description).slice(0, 160), src: e.source || 'SRD' });
      seenE.add(normName(e.name)); n++;
    });
    // MIC crystals: one SRD record per tier -> group by base name; real MIC data replaces seed rows
    const groups = {};
    (C.getCrystals ? C.getCrystals() : C.getByType('AugmentationCrystal')).forEach((c) => {
      const m = String(c.name).match(/^(.*?),\s*(Least|Lesser|Greater)$/i);
      const baseN = m ? m[1] : c.name, tier = m ? m[2].toLowerCase() : 'least';
      const g = groups[baseN] = groups[baseN] || { id: 'crys-' + slug(baseN), name: baseN, on: /Weapon/.test(c.slot) ? 'weapon' : /Shield/.test(c.slot) ? 'shield' : 'armor+shield', cost: [null, null, null], tiers: ['', '', ''], parts: [null, null, null], src: c.source || 'MIC' };
      const ti = CRYSTAL_TIERS.indexOf(tier);
      g.cost[ti] = num(c.cost); g.tiers[ti] = c.shortDescription || stripHtml(c.description).slice(0, 140);
      const dp = partsFromSrd(c.damageParts)[0];
      if (dp) { g.parts[ti] = [dp.count, dp.die]; g.ptype = dp.type; g.cond = dp.cond; }
    });
    Object.keys(groups).forEach((k) => {
      const g = groups[k];
      if (!g.parts.some(Boolean)) delete g.parts;
      const i = CAT.crystals.findIndex((c) => normName(c.name) === normName(g.name));
      if (i >= 0) { g.id = CAT.crystals[i].id; g.dr = CAT.crystals[i].dr; g.mods = CAT.crystals[i].mods; CAT.crystals[i] = g; } else CAT.crystals.push(g);
      n++;
    });
    const seenS = new Set(CAT.spells.map((s) => normName(s.name)));
    (C.getAllSpells ? C.getAllSpells() : C.getByType('Spell')).forEach((s) => {
      const row = { id: s.id, name: s.name, levelText: levelTextFromLearned(s.learnedAt), level: num(s.level, 1), school: s.category || s.school || 'Universal', action: cap1(String(s.castingTime || 'standard').split(' ')[0]), range: s.range || '', save: s.save || '', desc: s.shortDescription || '', src: s.source || 'SRD', raw: s };
      const i = CAT.spells.findIndex((x) => normName(x.name) === normName(s.name));
      if (i >= 0) CAT.spells[i] = Object.assign(row, { id: CAT.spells[i].id, levelText: row.levelText || CAT.spells[i].levelText }); else if (!seenS.has(normName(s.name))) CAT.spells.push(row);
      n++;
    });
    const seenF = new Set(CAT.feats.map((f) => normName(f.name)));
    (C.getAllFeats ? C.getAllFeats() : C.getByType('Feat')).forEach((f) => {
      if (seenF.has(normName(f.name))) return;
      const tags = []; if (f.isFighterBonusFeat) tags.push('#FighterBonus'); if (f.category === 'Metamagic') tags.push('#Metamagic'); if (f.category === 'Item Creation') tags.push('#ItemCreation');
      CAT.feats.push({ id: f.id, name: f.name, tags: tags, prereq: f.prereq || f.prerequisites || '', desc: f.shortDescription || '', src: f.source || 'SRD', raw: f });
      n++;
    });
    C.getByType('SpecialAbility').forEach((x) => { CAT.special.push({ id: x.id, name: x.name, desc: x.shortDescription || '', src: x.source || 'SRD', cat: x.category || 'Special Ability' }); n++; });
    C.getByType('ClassAbility').forEach((x) => { if (!CAT.classFeatures.some((c) => normName(c.name) === normName(x.name))) { CAT.classFeatures.push({ id: x.id, name: x.name, abilityType: cap1(x.abilityType || 'ex').replace(/^(Ex|Su|Sp).*/i, (m) => m.slice(0, 2)), desc: x.shortDescription || '', src: x.source || 'SRD' }); n++; } });
    (C.getAllDomains ? C.getAllDomains() : C.getByType('Domain')).forEach((d) => {
      const row = { id: d.id, name: d.name, grantedPower: (d.grantedPower && d.grantedPower.description) || d.shortDescription || '', spells: (d.spells || []).sort((a, b) => a.level - b.level).map((s) => s.name), src: d.source || 'SRD' };
      const i = CAT.domains.findIndex((x) => normName(x.name) === normName(d.name));
      if (i >= 0) CAT.domains[i] = row; else CAT.domains.push(row);
      n++;
    });
    C.getByType('MagicItem').concat(C.getByType('Consumable')).forEach((x) => { CAT.magicItems.push(x); n++; });
    C.getByType('Class').forEach((x) => { CAT.classes.push(x); n++; });
    CAT.srdLoaded = true; CAT.srdCount = n;
  }
  function mergeMasterDb(list) {
    let n = 0;
    (list || []).forEach((x) => {
      if (!x || !x.name) return;
      const isSpell = x.type === 'Spell' || x.learnedAt || x.level != null;
      if (isSpell && !CAT.spells.some((s) => normName(s.name) === normName(x.name))) { CAT.spells.push({ id: x.id || 'custom-' + slug(x.name), name: x.name, levelText: levelTextFromLearned(x.learnedAt), level: num(x.level, 1), school: x.category || 'Universal', action: 'Standard', range: x.range || '', save: x.save || '', desc: x.shortDescription || '', src: 'Custom DB (' + (x.source || 'master_db') + ')', raw: x, custom: true }); n++; }
      else if (x.type === 'Feat' && !CAT.feats.some((f) => normName(f.name) === normName(x.name))) { CAT.feats.push({ id: x.id, name: x.name, tags: [], prereq: x.prereq || '', desc: x.shortDescription || '', src: 'Custom DB', raw: x, custom: true }); n++; }
    });
    CAT.customCount += n;
  }

  // --------------------------------------------------------------------------
  // 9. Hydration: SRD / MIC / Custom entry -> Studio entry
  // --------------------------------------------------------------------------
  const RANGE_MAP = { close: RANGES[2], medium: RANGES[3], long: RANGES[4], touch: 'Touch', personal: 'Personal', unlimited: 'Unlimited' };
  const ACTION_MAP = { standard: 'Standard', free: 'Free', swift: 'Swift', immediate: 'Immediate', full: 'Full-Round', move: 'Move', '1': 'Full-Round' };
  function parseSave(s) {
    const t = String(s || '');
    if (!t || /^none/i.test(t)) return { type: 'None', effect: 'Negates' };
    const type = (t.match(/Fortitude|Reflex|Will/i) || ['Will'])[0];
    const effect = /half/i.test(t) ? 'Half' : /partial/i.test(t) ? 'Partial' : /harmless/i.test(t) ? 'Negates (harmless)' : /disbelief/i.test(t) ? 'Disbelief' : 'Negates';
    return { type: cap1(type.toLowerCase()), effect: effect };
  }
  function parseDuration(l, d) {
    const t = String(d || '');
    let m;
    if (!t || /instant/i.test(t)) l.duration = 'instant';
    else if (/permanent/i.test(t)) l.duration = 'permanent';
    else if (/10 min\.?\s*\/\s*level/i.test(t)) l.duration = 'tenMinPerLevel';
    else if ((m = t.match(/^(\d+)?\s*rounds?\s*\/\s*level/i))) { l.duration = 'roundsPerLevel'; l.durValue = num(m[1], 1); }
    else if ((m = t.match(/^(\d+)?\s*min(ute)?s?\.?\s*\/\s*level/i))) { l.duration = 'minPerLevel'; l.durValue = num(m[1], 1); }
    else if ((m = t.match(/^(\d+)?\s*hours?\s*\/\s*level/i))) { l.duration = 'hourPerLevel'; l.durValue = num(m[1], 1); }
    else { l.duration = 'text'; l.durText = t; }
  }
  function damageFromSrd(dps, descriptors) {
    const p = (dps || [])[0];
    if (!p || !p.dice) return blankDamage(false);
    let m = String(p.dice).match(/^\(min\((\d+),\s*@cl\)\)d(\d+)$/i);
    let type = cap1(String(p.type || 'Untyped').split(' ')[0]);
    if (type === 'Untyped' && descriptors.length && ENERGY.indexOf(descriptors[0]) >= 0) type = descriptors[0];
    if (m) return { on: true, count: 1, die: 'd' + m[2], type: type, scaling: 'perCL', per: 1, start: 1, max: num(m[1], 10) };
    m = String(p.dice).match(/^(\d+)d(\d+)$/);
    if (m) return { on: true, count: num(m[1]), die: 'd' + m[2], type: type, scaling: 'flat', per: 1, start: 1, max: 10 };
    return blankDamage(false);
  }
  function setOrigin(e, x, typeLabel) { e.origin = { mode: 'override', srdId: x.id || '', srdName: x.name || '', srdType: typeLabel }; e.source = x.source || e.source; }
  function hydrate(x) {
    const t = x.type || (x.learnedAt ? 'Spell' : '');
    let e;
    if (t === 'Weapon') { e = blankEntry('weapon'); const w = byId(CAT.weapons, x.id) || CAT.weapons.find((y) => normName(baseName(y)) === normName(x.name)); e.chassis = blankChassis('weapon', w ? w.id : 'longsword'); }
    else if (t === 'Armor' || t === 'Shield') { e = blankEntry('armor'); const a = byId(CAT.armors, x.id) || CAT.armors.find((y) => normName(y.name) === normName(x.name)); e.chassis = blankChassis('armor', a ? a.id : 'chain_shirt'); e.item.subtype = t; }
    else if (t === 'MagicItem' || t === 'Consumable') {
      e = blankEntry('wondrous');
      e.name = x.name; e.text = x.shortDescription || stripHtml(x.description).slice(0, 300);
      const nm = String(x.name);
      e.item.subtype = x.category === 'Rod' ? 'Rod' : x.category === 'Staff' ? 'Staff' : x.slot === 'Ring' ? 'Ring' : /potion|oil/i.test(nm) ? 'Potion / Oil' : /scroll/i.test(nm) ? 'Scroll' : /wand/i.test(nm) ? 'Wand' : 'Wondrous Item';
      e.item.slot = SLOT_MAP[x.slot] || (BODY_SLOTS.indexOf(x.slot) >= 0 ? x.slot : 'Slotless');
      e.item.consumable = t === 'Consumable' || /Potion|Scroll|Wand/.test(e.item.subtype);
      e.item.price = num(x.cost); e.item.cl = num(x.casterLevel);
      e.modifiers = modsFromSrd(x.modifiers);
    } else if (t === 'Spell') {
      e = blankEntry('spell');
      e.name = x.name; e.text = x.shortDescription || '';
      const lt = levelTextFromLearned(x.learnedAt) || x.levelText || '';
      e.spell.classes = lt ? lt.split(', ').map((s) => { const m = s.match(/^(.*) (\d+)$/); return { cls: m ? m[1] : s, lvl: m ? num(m[2]) : 1 }; }) : [{ cls: 'Sor/Wiz', lvl: num(x.level, 1) }];
      e.spell.school = SCHOOLS.indexOf(x.category || x.school) >= 0 ? (x.category || x.school) : 'Universal';
      e.spell.descriptors = String(x.descriptors || '').split(/,\s*|\s+or\s+/).map((d) => DESCRIPTORS.find((k) => k.toLowerCase() === d.trim().toLowerCase())).filter(Boolean);
      const comps = Array.isArray(x.components) ? x.components : [];
      e.spell.comps = { V: comps.indexOf('V') >= 0, S: comps.indexOf('S') >= 0, M: comps.indexOf('M') >= 0, F: comps.indexOf('F') >= 0, DF: comps.indexOf('DF') >= 0, XP: comps.indexOf('XP') >= 0 };
      const d = e.delivery;
      d.action = ACTION_MAP[String(x.castingTime || 'standard').toLowerCase().split(/[\s-]/)[0]] || 'Standard';
      d.range = RANGE_MAP[String(x.range || '').toLowerCase()] || x.range || '';
      d.area = x.area || x.target || '';
      d.attack = { rsak: 'ranged-touch', msak: 'melee-touch', rwak: 'weapon', mwak: 'weapon' }[x.actionType] || 'none';
      d.save = Object.assign(d.save, parseSave(x.save));
      d.sr = x.sr === true ? 'Yes' : x.sr === false ? 'No' : String(x.sr || 'Yes');
      d.damage = damageFromSrd(x.damageParts, e.spell.descriptors);
      parseDuration(e.lifecycle, x.duration);
      const mods = modsFromSrd(x.modifiers);
      if (mods.length) { e.modifiers = mods; e.facets.push('modifiers'); }
    } else if (t === 'Feat' || t === 'Flaw') {
      e = blankEntry('feat');
      e.name = x.name; e.text = stripHtml(x.benefit || x.shortDescription || '').slice(0, 400);
      if (x.isFighterBonusFeat) e.tags.push('#FighterBonus');
      if (x.category === 'Metamagic') e.tags.push('#Metamagic');
      if (x.category === 'Item Creation') e.tags.push('#ItemCreation');
      const ps = x.prereqStruct || {};
      Object.keys(ps.abilities || {}).forEach((k) => e.prereqs.push({ id: uid('p'), alts: [ALT({ kind: 'ability', ability: k.toLowerCase().slice(0, 3), min: num(ps.abilities[k]) })] }));
      if (ps.bab) e.prereqs.push({ id: uid('p'), alts: [ALT({ kind: 'bab', min: num(ps.bab) })] });
      Object.keys(ps.skills || {}).forEach((k) => { const key = skillKey(String(k).replace(/\s*\(.*$/, '').replace(/_/g, ' ')); e.prereqs.push({ id: uid('p'), alts: [ALT({ kind: 'skill', skill: SKILL_BY_KEY[key] ? key : 'skill.knowledge', min: num(ps.skills[k]) })] }); });
      if (ps.casterLevel) e.prereqs.push({ id: uid('p'), alts: [ALT({ kind: 'level', levelKind: 'casterLevel', min: num(ps.casterLevel) })] });
      if (ps.characterLevel) e.prereqs.push({ id: uid('p'), alts: [ALT({ kind: 'level', levelKind: 'charLevel', min: num(ps.characterLevel) })] });
      Object.keys(ps.classLevels || {}).forEach((k) => e.prereqs.push({ id: uid('p'), alts: [ALT({ kind: 'level', levelKind: 'classLevel', cls: cap1(k), min: num(ps.classLevels[k]) })] }));
      String(x.prereq || '').split(/,\s*/).map((s) => s.trim()).filter(Boolean).forEach((tok) => {
        if (/^(str|dex|con|int|wis|cha)\b\s*\d+/i.test(tok) || /base attack|bab/i.test(tok) || /ranks?/i.test(tok) || /level/i.test(tok)) return;
        const f = CAT.feats.find((y) => normName(y.name) === normName(tok));
        e.prereqs.push({ id: uid('p'), alts: [f ? ALT({ kind: 'feat', feat: f.name }) : ALT({ kind: 'custom', text: tok })] });
      });
      const mods = modsFromSrd(x.modifiers);
      if (mods.length) e.modifiers = mods;
    } else if (t === 'Class') {
      e = blankEntry('class');
      e.name = x.name;
      const p = e.progression;
      p.mode = x.category === 'Prestige' || x.isPrestige ? 'prestige' : 'base';
      p.maxLevel = num(x.maxLevel, p.mode === 'prestige' ? 10 : 20);
      p.hitDie = num(String(x.hitDie || x.hd || 8).replace(/^d/, ''), 8);
      p.bab = { high: 'full', med: '3/4', medium: '3/4', low: '1/2' }[x.babProgression] || '3/4';
      const st = x.savingThrows || {};
      p.good = { fort: /high|good/.test(st.fort || ''), ref: /high|good/.test(st.ref || ''), will: /high|good/.test(st.will || '') };
      p.skillPts = num(x.skillPointsPerLevel, 2);
      Object.keys(x.features || {}).forEach((L) => { const row = p.levels[num(L) - 1]; if (row) (x.features[L] || []).forEach((f) => row.features.push(FEATURE(f.name, { kind: 'ref', text: f.summary || '' }))); });
      e.text = x.shortDescription || '';
    } else if (t === 'Domain') {
      e = blankEntry('domain');
      e.name = x.name + ' Domain';
      e.grants.grantedPower = (x.grantedPower && x.grantedPower.description) || x.grantedPower || x.shortDescription || '';
      const sp = (x.spells || []).slice().sort((a, b) => num(a.level) - num(b.level)).map((s) => (typeof s === 'string' ? s : s.name));
      e.grants.ladder = sp.concat(['', '', '', '', '', '', '', '', '']).slice(0, 9);
    } else return null;
    setOrigin(e, x, t);
    return e;
  }

  // --------------------------------------------------------------------------
  // 10. Form helpers (data-bind => S.entry path, data-uibind => S.ui)
  // --------------------------------------------------------------------------
  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
  function setPath(obj, path, val) { const ks = path.split('.'); let o = obj; for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; } o[ks[ks.length - 1]] = val; }
  const bindAttr = (scope) => (scope === 'ui' ? 'data-uibind' : scope === 'house' ? 'data-house' : 'data-bind');
  function inp(path, val, o) {
    o = o || {};
    return '<input class="fs-in' + (o.narrow ? ' fs-narrow' : '') + '" ' + bindAttr(o.scope) + '="' + path + '"' + (o.num ? ' data-t="num" type="number"' : ' type="text"') + (o.list ? ' list="' + o.list + '"' : '') +
      (o.min != null ? ' min="' + o.min + '"' : '') + (o.max != null ? ' max="' + o.max + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.style ? ' style="' + o.style + '"' : '') +
      (o.enter ? ' data-enter="' + o.enter + '"' : '') + ' value="' + esc(val) + '">';
  }
  function opts(list, val) { return list.map((x) => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join(''); }
  function sel(path, val, list, o) { o = o || {}; return '<select class="fs-sel' + (o.narrow ? ' fs-narrow' : '') + '" ' + bindAttr(o.scope) + '="' + path + '"' + (o.num ? ' data-t="num"' : '') + (o.style ? ' style="' + o.style + '"' : '') + '>' + opts(list, val) + '</select>'; }
  function selGroups(path, val, groups) { return '<select class="fs-sel" data-bind="' + path + '">' + groups.map((g) => '<optgroup label="' + esc(g[0]) + '">' + opts(g[1], val) + '</optgroup>').join('') + '</select>'; }
  function chk(path, val, label, o) { o = o || {}; return '<label class="fs-check' + (val ? ' on' : '') + '"><input type="checkbox" ' + bindAttr(o.scope) + '="' + path + '" data-t="bool"' + (val ? ' checked' : '') + '>' + label + '</label>'; }
  const field = (label, html, style) => '<label class="fs-field"' + (style ? ' style="' + style + '"' : '') + '><span>' + esc(label) + '</span>' + html + '</label>';
  const btn = (action, label, cls, data) => '<button type="button" class="fs-btn ' + (cls || '') + '" data-action="' + action + '"' + Object.keys(data || {}).map((k) => ' data-' + k + '="' + esc(data[k]) + '"').join('') + '>' + label + '</button>';
  const live = (kind, args) => '<span data-live="' + kind + '" data-args="' + esc(args == null ? '' : args) + '">' + (LIVE[kind] ? LIVE[kind](String(args == null ? '' : args)) : '') + '</span>';
  function card(key, summaryHtml, editHtml, extraHead) {
    const open = !!S.ui.cardOpen[key];
    return '<div class="fs-card' + (open ? ' open' : '') + '"><div class="fs-card-sum" data-action="toggle-card" data-key="' + esc(key) + '"><span class="fs-chev" style="transform:rotate(' + (open ? 90 : 0) + 'deg)">▶</span><span class="fs-grow">' + summaryHtml + '</span>' + (extraHead || '') + '</div><div class="fs-card-edit">' + editHtml + '</div></div>';
  }
  const datalists = () => '<datalist id="fs-dice-list">' + opts(DIE_LIST.filter((d) => d !== 'flat'), '') + '</datalist><datalist id="fs-range-list">' + opts(RANGES, '') + '</datalist><datalist id="fs-area-list">' + opts(AREAS, '') + '</datalist>' +
    '<datalist id="fs-defense-list">' + opts(DEF_LIST, '') + '</datalist><datalist id="fs-deity-list">' + opts(CAT.deities.map((d) => d.name), '') + '</datalist><datalist id="fs-weapon-names">' + opts(CAT.weapons.map((w) => baseName(w)), '') + '</datalist><datalist id="fs-spell-names">' + opts(CAT.spells.slice(0, 800).map((s) => s.name), '') + '</datalist>';

  // --------------------------------------------------------------------------
  // 11. Universal Spotlight Combobox (fs-spotlight)
  // --------------------------------------------------------------------------
  function rank(list, q, nameOf, descOf, limit) {
    const s = String(q || '').trim().toLowerCase();
    if (!s) return list.slice(0, limit || 30);
    const scored = [];
    for (let i = 0; i < list.length; i++) {
      const it = list[i], n = String(nameOf(it)).toLowerCase();
      let sc = n === s ? 100 : n.indexOf(s) === 0 ? 80 : n.indexOf(' ' + s) >= 0 ? 60 : n.indexOf(s) >= 0 ? 45 : 0;
      if (!sc && descOf && String(descOf(it) || '').toLowerCase().indexOf(s) >= 0) sc = 15;
      if (sc) scored.push([sc, it]);
    }
    scored.sort((a, b) => b[0] - a[0] || String(nameOf(a[1])).length - String(nameOf(b[1])).length);
    return scored.slice(0, limit || 30).map((x) => x[1]);
  }
  const SI = (group, id, label, badge, desc, data) => ({ group: group, id: id, label: label, badge: badge || '', desc: desc || '', data: data });
  const short = (s, n) => { const t = stripHtml(s); return t.length > (n || 110) ? t.slice(0, n || 110) + '…' : t; };
  const SPOT = {
    load: {
      ph: '🔍 Load Example or Existing SRD / MIC / Custom Entry…',
      layers: ['All', 'Presets', 'SRD', 'MIC', 'Saved'],
      search(q, ctx, layer) {
        layer = layer || 'All';
        if (layer === 'Saved') return rank(S.templates, q, (t) => t.name, null, 30).map((t) => SI('📌 Saved Templates', t.id, t.name, (BP_BY_ID[t.base] || {}).name || 'Template', t.facets.length + ' sections', { tpl: t.id }));
        const pre = layer === 'All' || layer === 'Presets' ? rank(PRESETS, q, (p) => p.label, null, 20).map((p) => SI('⭐ Curated Presets', p.id, p.icon + ' ' + p.label, 'Preset', '', { preset: p.id })) : [];
        if (layer === 'Presets' || (!String(q || '').trim() && layer === 'All')) return pre;
        const out = pre.slice();
        const isMic = (x) => /Magic Item Compendium|MIC/i.test(String(x.src || x.source || ''));
        const add = (group, list, badgeFn, descFn, type, lim) => rank(list.filter((x) => layer === 'All' || (layer === 'MIC' ? isMic(x) : !isMic(x))), q, (x) => x.name, descFn, lim || 6).forEach((x) => out.push(SI(group, x.id, x.name, badgeFn(x), short(descFn(x)), { srd: x, type: type })));
        add('⚔️ Weapons', CAT.weapons, (x) => gp(x.cost), (x) => x.desc || x.dice + ' ' + x.dmgType, 'Weapon');
        add('🛡️ Armor & Shields', CAT.armors, (x) => gp(x.cost), (x) => x.desc || '+' + x.armorBonus + ' ' + x.type, 'Armor');
        add('💎 Magic Items (SRD / MIC)', CAT.magicItems, (x) => gp(x.cost), (x) => x.shortDescription || '', 'MagicItem', 8);
        add('🔮 Spells', CAT.spells, (x) => x.levelText || 'Spell', (x) => x.desc, 'Spell', 8);
        add('📜 Feats', CAT.feats, (x) => (x.custom ? 'Custom' : x.src || 'Feat'), (x) => x.desc || x.prereq, 'Feat', 6);
        add('💎 Classes', CAT.classes, (x) => x.category || 'Class', (x) => x.shortDescription || '', 'Class', 4);
        add('✨ Domains', CAT.domains, () => 'Domain', (x) => x.grantedPower, 'Domain', 4);
        return out;
      },
      pick(it) {
        if (it.data.preset) { ACT['load-preset']({ dataset: { id: it.data.preset } }); return; }
        if (it.data.tpl) { setBlueprint(it.data.tpl); return; }
        const raw = it.data.srd.raw || it.data.srd;
        const type = it.data.type === 'Armor' ? (raw.type === 'Shield' ? 'Shield' : 'Armor') : it.data.type;
        const en = hydrate(Object.assign({}, raw, { type: raw.type || type, id: raw.id || it.data.srd.id, name: raw.name || it.data.srd.name }));
        if (!en) { toast('Cannot hydrate ' + it.label, 'warn'); return; }
        loadEntry(en, ''); toast('Loaded "' + it.label + '" — editing as Override SRD (toggle in Identity)'); renderAll();
      }
    },
    base: {
      ph: '🔍 Search base weapon / armor / shield…',
      search(q) {
        const ch = S.entry.chassis;
        if (ch.kind === 'weapon') return rank(CAT.weapons, q, (w) => w.name, (w) => w.desc, 30).map((w) => SI(w.category + ' Weapons', w.id, w.name, w.dice + ' • ' + gp(w.cost), w.handed + ' • ' + w.dmgType + (w.ranged ? ' • Ranged' : '') + ' • ' + w.src, { id: w.id }));
        return rank(CAT.armors, q, (a) => a.name, (a) => a.desc, 30).map((a) => SI(a.type === 'Shield' ? 'Shields' : a.type + ' Armor', a.id, a.name, '+' + a.armorBonus + ' • ' + gp(a.cost), 'Max Dex ' + (a.maxDex >= 99 ? '—' : '+' + a.maxDex) + ' • ACP ' + a.acp + ' • ASF ' + a.asf + '% • ' + a.src, { id: a.id }));
      },
      pick(it) { setEntry('chassis.baseId', it.data.id); renderAll(); }
    },
    ench: {
      ph: '🔍 + Enchantment (DMG + MIC): Keen, Holy, Shadow…',
      layers: ['All', '+1..+5 Bonus', 'Flat GP', 'MIC', 'DMG'],
      search(q, ctx, layer) {
        const ch = S.entry.chassis, v = chassisView(ch), L = layer || 'All';
        const lf = (e) => L === 'All' || (L === 'Flat GP' ? !e.plus : L === '+1..+5 Bonus' ? !!e.plus : L === 'MIC' ? /MIC|Magic Item Compendium/i.test(e.src) : !/MIC|Magic Item Compendium/i.test(e.src));
        return rank(CAT.enchants.filter((e) => enchApplies(e, v.kind) && ch.enchantments.indexOf(e.id) < 0 && lf(e)), q, (e) => e.name, (e) => e.desc, 40)
          .map((e) => SI(e.plus ? 'Bonus-Equivalent (+' + e.plus + ')' : 'Flat Price', e.id, e.name, e.plus ? '+' + e.plus + ' bonus' : gp(e.gp), short(e.desc, 120) + ' • ' + e.src, { id: e.id }));
      },
      pick(it) { addEnchantment(it.data.id); }
    },
    crystal: {
      ph: '🔍 + MIC Augment Crystal…',
      layers: ['All', 'Least', 'Lesser', 'Greater'],
      search(q, ctx, layer) {
        const v = chassisView(S.entry.chassis), ti = CRYSTAL_TIERS.indexOf(String(layer || '').toLowerCase());
        return rank(CAT.crystals.filter((c) => crystalApplies(c, v.kind) && (ti < 0 || c.cost[ti] != null)), q, (c) => c.name, (c) => c.tiers.join(' '), 40)
          .map((c) => SI(c.on === 'weapon' ? 'Weapon Crystals' : 'Armor / Shield Crystals', c.id, c.name, c.cost.map((x, i) => (x == null ? null : cap1(CRYSTAL_TIERS[i]) + ' ' + gp(x))).filter(Boolean).join(' / '), short(c.tiers.find(Boolean) || '', 120) + ' • ' + c.src, { id: c.id }));
      },
      pick(it) { const c = crystalById(it.data.id); S.entry.chassis.crystal = { id: c.id, tier: CRYSTAL_TIERS[Math.max(0, c.cost.findIndex((x) => x != null))] }; renderAll(); }
    },
    prereq: {
      ph: '🔍 Feat, #TagPool, special ability or DM requirement…',
      layers: ['All', 'Feats', '#Pools', 'Abilities'],
      search(q, ctx, layer) {
        const out = [], L = layer || 'All';
        const tags = allTags().filter((t) => !q || t.toLowerCase().indexOf(String(q).toLowerCase().replace(/^#?/, '#')) >= 0 || t.toLowerCase().indexOf(String(q).toLowerCase()) >= 0).slice(0, 8);
        if (L === 'All' || L === '#Pools') tags.forEach((t) => out.push(SI('#Tag Pools (any feat from pool)', t, t, 'Pool', 'Any feat carrying this tag satisfies the requirement', { feat: t })));
        if (L === 'All' || L === 'Feats') rank(CAT.feats, q, (f) => f.name, (f) => f.desc, 15).forEach((f) => out.push(SI(f.custom ? 'Custom DB Feats' : 'Feats', f.id, f.name, f.custom ? 'Custom' : (f.tags[0] || 'Feat'), short(f.prereq ? 'Prerequisites: ' + f.prereq : f.desc), { feat: f.name })));
        if (L === 'All' || L === 'Abilities') rank(CAT.special, q, (f) => f.name, (f) => f.desc, 6).forEach((f) => out.push(SI('Special Abilities / DM Boons', f.id, f.name, f.cat, short(f.desc), { feat: f.name })));
        if (String(q || '').trim()) out.push(SI('Custom Story / DM Requirement', 'custom', '📜 Custom requirement: "' + q + '"', 'DM', 'Free-text story requirement checked by the DM', { custom: String(q).trim() }));
        return out;
      },
      pick(it, ctx) {
        const p = ctx.split(':'), alt = S.entry.prereqs[num(p[0])].alts[num(p[1])];
        if (it.data.custom) { alt.kind = 'custom'; alt.text = it.data.custom; } else { alt.kind = 'feat'; alt.feat = it.data.feat; }
        renderAll();
      }
    },
    tag: {
      ph: '🔍 + #Tag (standard taxonomy or create a custom pool)…',
      layers: ['All', 'Feat Pools', 'Item / Boon', 'Descriptors', 'Custom'],
      search(q, ctx, layer) {
        const s = String(q || '').trim(), out = [], L = layer || 'All';
        const norm = s ? (s[0] === '#' ? s : '#' + s).replace(/\s+/g, '') : '';
        STANDARD_TAGS.filter((g) => L === 'All' || L === g[0]).forEach((g) => g[1].filter((t) => S.entry.tags.indexOf(t) < 0 && (!s || t.toLowerCase().indexOf(norm.toLowerCase()) >= 0)).forEach((t) => out.push(SI(g[0], t, t, 'Standard', '', { tag: t }))));
        S.livingTags.filter((t) => (L === 'All' || L === 'Custom') && S.entry.tags.indexOf(t) < 0 && (!s || t.toLowerCase().indexOf(norm.toLowerCase()) >= 0)).forEach((t) => out.push(SI('Custom Pools', t, t, 'Custom', '', { tag: t })));
        if (norm && norm.length > 1 && !allTags().some((t) => t.toLowerCase() === norm.toLowerCase())) out.push(SI('Create', 'new', '+ Create Custom Pool ' + norm, 'New', 'Reusable living tag pool, selectable in Prerequisites & Bonus Feat Grants', { tag: norm, create: true }));
        return out;
      },
      pick(it) { addTag(it.data.tag); }
    },
    descriptor: {
      ph: '🔍 Add descriptor: [Fire], [Mind-Affecting], [Fear]…',
      search(q) { return rank(DESCRIPTORS.filter((d) => S.entry.spell.descriptors.indexOf(d) < 0).map((d) => ({ name: d })), q, (d) => d.name, null, 25).map((d) => SI('Descriptors', d.name, '[' + d.name + ']', '', '', { d: d.name })); },
      pick(it) { S.entry.spell.descriptors.push(it.data.d); renderAll(); }
    },
    power: {
      ph: '🔍 + Attach Existing Spell / Ability (SRD + Custom DB)…',
      layers: ['All', 'SRD', 'Custom', 'Lvl 0–3', 'Lvl 4–9'],
      search(q, ctx, layer) {
        const L = layer || 'All';
        const lf = (s) => L === 'All' || (L === 'SRD' ? !s.custom : L === 'Custom' ? !!s.custom : L === 'Lvl 0–3' ? num(s.level) <= 3 : num(s.level) >= 4);
        const out = rank(CAT.spells.filter(lf), q, (s) => s.name, (s) => s.desc, 25).map((s) => SI(s.custom ? 'Custom DB Spells' : 'Spells', s.id, s.name, s.levelText || 'Level ' + s.level, short(s.school + ' • ' + s.desc), { spell: s }));
        rank(CAT.special, q, (f) => f.name, (f) => f.desc, 6).forEach((f) => out.push(SI('Special Abilities', f.id, f.name, f.cat, short(f.desc), { special: f })));
        return out;
      },
      pick(it) {
        const s = it.data.spell, f = it.data.special;
        const ref = s ? spellRef(s) : { id: f.id, name: f.name, levelText: f.cat, level: 0, school: '', desc: f.desc };
        const lvl = s ? num(s.level, 1) : 0;
        const pw = blankPower('attached', { name: ref.name, ref: ref, action: s && ACTIONS.indexOf(s.action) >= 0 ? s.action : 'Standard', cl: Math.max(1, lvl * 2 - 1), use: Object.assign(blankUse('perDay'), { n: 1 }) });
        if (s && s.save) pw.save = parseSave(s.save);
        S.entry.powers.push(pw); S.ui.cardOpen['pw:' + pw.id] = true; toast('Attached ' + ref.name); renderAll();
      }
    },
    feature: {
      ph: '🔍 Attach class feature / feat…',
      search(q) {
        const out = rank(CAT.classFeatures, q, (c) => c.name, (c) => c.desc, 15).map((c) => SI('Class Features', c.id, c.name, c.abilityType || 'Ex', short(c.desc), { name: c.name, refId: c.id, type: c.abilityType, desc: c.desc }));
        rank(CAT.feats, q, (f) => f.name, (f) => f.desc, 8).forEach((f) => out.push(SI('Feats (granted)', f.id, f.name, 'Feat', short(f.desc), { name: f.name, refId: f.id, type: 'Ex', desc: f.desc })));
        return out;
      },
      pick(it, ctx) { S.entry.progression.levels[num(ctx)].features.push(FEATURE(it.data.name, { refId: it.data.refId, abilityType: it.data.type || 'Ex', text: short(it.data.desc, 200) })); renderAll(); }
    },
    domain: {
      ph: '🔍 Attach domain (SRD + Custom)…',
      search(q) { const have = S.entry.grants.domains.map((d) => d.name); return rank(CAT.domains.filter((d) => have.indexOf(d.name) < 0), q, (d) => d.name, (d) => d.grantedPower, 30).map((d) => SI('Domains', d.id, d.name, (d.spells || []).length + ' spells', short(d.grantedPower), { d: d })); },
      pick(it) { S.entry.grants.domains.push(DOMAIN_REF(it.data.d)); renderAll(); }
    },
    deity: {
      ph: '🔍 Attach patron deity…',
      search(q) { return rank(CAT.deities, q, (d) => d.name, (d) => d.domains.join(' '), 20).map((d) => SI('Deities', d.id, d.name, d.align, 'Favored Weapon: ' + d.favoredWeapon + ' • Domains: ' + d.domains.join(', '), { d: d })); },
      pick(it) { const d = it.data.d; S.entry.grants.deities.push({ id: uid('dt'), kind: 'ref', name: d.name, align: d.align, favoredWeapon: d.favoredWeapon, refId: d.id }); renderAll(); }
    }
  };
  function spotHtml(key, ctx, o) {
    o = o || {};
    const open = S.spot && S.spot.key === key && S.spot.ctx === String(ctx || '');
    return '<div class="fs-spot" style="' + (o.style || '') + '"><input class="fs-in fs-spot-in" type="text" autocomplete="off" spellcheck="false" data-spot-input="' + key + '" data-ctx="' + esc(ctx || '') + '" placeholder="' + esc(o.ph || SPOT[key].ph) + '" value="' + esc(open ? S.spot.q : '') + '">' +
      '<div class="fs-spot-dd" data-spot-dd="' + esc(key + '|' + (ctx || '')) + '"></div></div>';
  }
  function renderSpotDD() {
    document.querySelectorAll('.fs-spot-dd.open').forEach((el) => { if (!S.spot || el.dataset.spotDd !== S.spot.key + '|' + S.spot.ctx) { el.classList.remove('open'); el.innerHTML = ''; } });
    if (!S.spot) return;
    const dd = document.querySelector('[data-spot-dd="' + (S.spot.key + '|' + S.spot.ctx).replace(/"/g, '\\"') + '"]');
    if (!dd) return;
    const def = SPOT[S.spot.key];
    const layers = typeof def.layers === 'function' ? def.layers(S.spot.ctx) : def.layers;
    if (layers && !S.spot.layer) S.spot.layer = layers[0];
    const items = def.search(S.spot.q, S.spot.ctx, S.spot.layer);
    S.spot.items = items;
    if (S.spot.idx >= items.length) S.spot.idx = Math.max(0, items.length - 1);
    let last = '';
    const pills = layers && layers.length > 1 ? '<div class="fs-spot-layers">' + layers.map((l) => '<span class="fs-spot-layer' + (l === S.spot.layer ? ' on' : '') + '" data-spot-layer="' + esc(l) + '">' + esc(l) + '</span>').join('') + '</div>' : '';
    dd.innerHTML = pills + (items.length ? items.map((it, i) => {
      const head = it.group !== last ? '<div class="fs-spot-group">' + esc(it.group) + '</div>' : '';
      last = it.group;
      return head + '<div class="fs-spot-item' + (i === S.spot.idx ? ' active' : '') + '" data-spot-pick="' + i + '"><div class="fs-spot-row"><b>' + esc(it.label) + '</b><span>' + (it.badge ? '<span class="fs-pill dim">' + esc(it.badge) + '</span>' : '') + (it.data && it.data.tpl ? '<span class="fs-spot-del" data-spot-del="' + esc(it.data.tpl) + '" title="Delete saved template">✕</span>' : '') + '</span></div>' + (it.desc ? '<div class="fs-spot-desc">' + esc(it.desc) + '</div>' : '') + '</div>';
    }).join('') : '<div class="fs-spot-empty">No matches' + (CAT.srdLoaded ? '' : ' in the offline seed catalog (serve over http:// to search the full SRD)') + '.</div>');
    dd.classList.add('open');
    if (window.innerWidth > 640) { dd.style.left = ''; dd.style.right = ''; const rc = dd.getBoundingClientRect(); if (rc.right > window.innerWidth - 8) { dd.style.left = 'auto'; dd.style.right = '0'; } }
    const act = dd.querySelector('.fs-spot-item.active'); if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
  }
  function spotPick(i) {
    if (!S.spot || !S.spot.items || !S.spot.items[i]) return;
    const it = S.spot.items[i], key = S.spot.key, ctx = S.spot.ctx;
    S.spot = null;
    SPOT[key].pick(it, ctx);
  }
  const allTags = () => STANDARD_TAGS.flatMap((g) => g[1]).concat(S.livingTags.filter((t) => !STD_TAG_SET.has(t)));

  // --------------------------------------------------------------------------
  // 12. Live slots (refreshed on keystrokes without rebuilding inputs)
  // --------------------------------------------------------------------------
  const LIVE = {
    'mod-sum': (i) => { const m = S.entry.modifiers[num(i)]; return m ? esc(modShort(m)) : ''; },
    'prereq-row': (i) => { const r = S.entry.prereqs[num(i)]; return r ? esc(r.alts.map(altText).join(' OR ')) : ''; },
    'prereq-all': () => (S.entry.prereqs.length ? '<span class="fs-hint">Readable: ' + esc(prereqText(S.entry.prereqs)) + '</span>' : ''),
    'dc': () => esc(dcText(S.entry) || 'No saving throw'),
    'dmg-main': () => { const d = S.entry.delivery.damage; const t = damageText(d); if (!t) return '<span class="fs-hint">No damage / healing</span>'; return esc(t) + (d.scaling === 'perCL' ? ' <span class="fs-hint">— CL 1: ' + (damageAtCL(d, 1) || '0') + ' • CL 5: ' + damageAtCL(d, 5) + ' • CL 10: ' + damageAtCL(d, 10) + ' • CL 20: ' + damageAtCL(d, 20) + '</span>' : ''); },
    'budget': () => budgetHtml(),
    'chassis-warn': () => chassisView(S.entry.chassis).warnings.map((w) => '<div class="fs-warn" style="font-size:11px">⚠️ ' + esc(w) + '</div>').join(''),
    'gp-table': () => { const v = chassisView(S.entry.chassis); return v.gpRows.map((r) => '<div class="fs-bd-row"><span class="src">' + esc(r[0]) + '</span><b>' + gp(r[1]) + '</b></div>').join('') + '<div class="fs-bd-row" style="border-top:1px solid var(--border-subtle);margin-top:3px;padding-top:3px"><span>Total Market Price</span><b class="fs-up">' + gp(v.gpTotal) + '</b></div>'; },
    'dmg-sum': (i) => { const p = S.entry.chassis.damageParts[num(i)]; return p ? esc('+' + partText(p)) : ''; },
    'dr-sum': (i) => { const x = S.entry.defenses.dr[num(i)]; return x ? 'DR ' + esc(x.value) + '/' + esc(x.bypass) : ''; },
    'en-sum': (i) => { const x = S.entry.defenses.energy[num(i)]; return x ? esc((x.mode || 'Resistance') === 'Resistance' ? 'Resist ' + x.type + ' ' + x.value : x.type + ' ' + x.mode) : ''; },
    'sub-sum': (i) => { const s = S.entry.substitutions[num(i)]; return s ? esc((s.op === 'replace' ? 'Replace ' : 'Higher of ') + s.from.toUpperCase() + (s.op === 'replace' ? ' with ' : ' or ') + s.to.toUpperCase() + ' on ' + { fort: 'Fortitude', ref: 'Reflex', will: 'Will' }[s.save] + ' saves') : ''; },
    'grant-sum': (i) => { const g = S.entry.grants.featGrants[num(i)]; return g ? esc('Level ' + g.level + ': Grant ' + g.count + ' Feat' + (g.count > 1 ? 's' : '') + ' from ' + g.pool) : ''; },
    'pw-sum': (i) => { const pw = S.entry.powers[num(i)]; return pw ? esc(powerSummary(pw)) : ''; },
    'pw-dmg': (i) => { const pw = S.entry.powers[num(i)]; if (!pw || !pw.damage.on) return ''; const d = pw.damage; return esc(damageText(d)) + (d.scaling === 'perCL' && num(pw.cl) ? ' <span class="fs-hint">— at CL ' + num(pw.cl) + ': ' + esc(damageAtCL(d, num(pw.cl))) + '</span>' : ''); },
    'feat-sum': (a) => { const p = a.split(':'); const f = (S.entry.progression.levels[num(p[0])] || { features: [] }).features[num(p[1])]; return f ? esc(f.name) : ''; },
    'dom-sum': (i) => { const d = S.entry.grants.domains[num(i)]; return d ? esc(d.name + (d.grantedPower ? ' — ' + short(d.grantedPower, 80) : '')) : ''; },
    'deity-sum': (i) => { const d = S.entry.grants.deities[num(i)]; return d ? esc(d.name + ' (' + d.align + ') • Favored Weapon: ' + d.favoredWeapon) : ''; },
    'x-sum': (i) => { const x = S.entry.delivery.extras[num(i)]; return x ? esc(x.text || EXTRA_KINDS[x.kind]) : ''; }
  };
  const EXTRA_KINDS = { rays: 'Multiple Rays / Projectiles', material: 'Costly Material Component', concentration: 'Concentration / Dismissible', sla: 'Spell-Like Ability (Sp)', su: 'Supernatural Ability (Su)', aura: 'Persistent Aura', other: 'Custom Rule' };
  function budgetHtml() {
    const v = chassisView(S.entry.chassis);
    const pct = Math.min(100, v.effective * 10);
    const color = v.effective > 10 ? 'var(--accent-rose)' : v.effective >= 8 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
    return '<div style="display:flex;align-items:center;gap:8px;font-size:11.5px;flex-wrap:wrap"><b style="color:var(--text-primary)">Effective Enhancement ' + sgn(v.effective) + ' / +10</b><span class="fs-hint">Base ' + sgn(v.enh) + ' + Special Abilities ' + sgn(v.plusSum) + ' — Remaining ' + sgn(Math.max(0, 10 - v.effective)) + '</span></div>' +
      '<div class="fs-bar"><div style="width:' + pct + '%;background:' + color + '"></div></div>';
  }

  // --------------------------------------------------------------------------
  // 13. Render: compact top bar & sticky object preview
  // --------------------------------------------------------------------------
  function renderTopbar() {
    const curTpl = S.entry.templateId || '';
    const catSel = '<select class="fs-sel" data-topcat="1" style="width:auto;min-width:190px" title="Category / Template"><optgroup label="Category">' + opts(BLUEPRINTS.map((b) => [b.id, b.icon + ' ' + b.name]), curTpl ? '' : S.entry.blueprint) + '</optgroup>' +
      (S.templates.length ? '<optgroup label="📌 Saved Templates">' + opts(S.templates.map((t) => [t.id, t.name]), curTpl) + '</optgroup>' : '') + '</select>';
    const save = S.ui.tplSaveOpen ? '<span class="fs-row" style="gap:4px">' + inp('newTplName', S.ui.newTplName, { scope: 'ui', ph: 'Template name…', style: 'width:150px', enter: 'save-template' }) + btn('save-template', 'Save', 'fs-xs fs-emerald') + btn('toggle-tpl-save', '✕', 'fs-xs fs-ghost') + '</span>' : btn('toggle-tpl-save', '📌 Save Template', 'fs-xs');
    const status = CAT.srdLoaded ? '<span class="fs-pill emerald" title="SrdCompendium + master_db.json">📚 SRD ' + CAT.srdCount.toLocaleString('en-US') + (CAT.customCount ? ' + ' + CAT.customCount + ' custom' : '') + '</span>' : '<span class="fs-pill dim" title="Serve over http:// to load srd_compendium.js data">📚 Offline seed</span>';
    const view = '<span class="fs-seg">' + btn('set-view', '🧩 Scratch Lego', S.ui.viewMode === 'scratch' ? 'fs-on' : 'fs-ghost', { v: 'scratch' }) + btn('set-view', '📋 Classic Facets', S.ui.viewMode === 'classic' ? 'fs-on' : 'fs-ghost', { v: 'classic' }) + '</span>';
    $('#fs-topbar').innerHTML = '<div class="fs-topbar-row"><div class="fs-title">' + DICE_SVG + ' Living Facet Studio</div>' + view + catSel +
      '<div class="fs-top-spot">' + spotHtml('load', 'top') + '</div>' + save + btn('new-entry', '✨ Blank', 'fs-xs') + status + '</div>';
  }
  function renderLiveHeader() {
    const en = S.entry, bp = BP_BY_ID[en.blueprint] || BLUEPRINTS[0], has = (k) => en.facets.indexOf(k) >= 0;
    let sub = bp.name.split(' /')[0];
    if (isItemBp(en.blueprint)) sub = (isConsumable(en) ? 'Consumable • ' : '') + en.item.subtype + (has('chassis') ? '' : ' • ' + en.item.slot.split(' /')[0]);
    if (en.blueprint === 'spell') sub = 'Spell' + (en.spell.classes.length ? ' • ' + spellLevelText(en.spell) : '');
    if (en.blueprint === 'class') sub = en.progression.mode === 'prestige' ? 'Prestige Class' : en.progression.mode === 'base' ? 'Base Class' : 'Legacy Progression';
    let l1 = '<span class="fs-live-icon">' + bp.icon + '</span><span class="fs-live-name">' + esc(entryName(en)) + '</span><span class="fs-pill indigo">' + esc(sub) + '</span>' +
      '<span class="fs-pill ' + (en.origin.mode === 'new' ? 'dim' : en.origin.mode === 'override' ? 'amber' : 'sky') + '">' + esc(ORIGIN_LABEL[en.origin.mode]) + (en.origin.srdName && en.origin.mode !== 'new' ? ': ' + esc(en.origin.srdName) : '') + '</span>' +
      en.tags.map((t) => '<span class="fs-pill purple">' + esc(t) + '</span>').join('');
    if (has('chassis')) { const v = chassisView(en.chassis); l1 += '<span class="fs-grow-gap"></span><span class="fs-pill ' + (v.effective > 10 ? 'rose' : 'emerald') + '">' + sgn(v.effective) + ' / +10</span><span class="fs-pill amber">💰 ' + gp(v.gpTotal) + '</span>'; }
    else if (isItemBp(en.blueprint) && num(en.item.price)) l1 += '<span class="fs-grow-gap"></span><span class="fs-pill amber">💰 ' + gp(en.item.price) + '</span>';
    const segs = rawHeaderLine(en);
    const l2 = segs.length ? segs.map(esc).join(' <span class="fs-sep">•</span> ') : '<span class="fs-hint">Configure the sections below — the clean RAW stat line renders here.</span>';
    const pills = summaryPills(en);
    const l3 = pills.length ? pills.map((p) => '<span class="fs-pill ' + p[0] + '">' + esc(p[1]) + '</span>').join('') : '<span class="fs-hint">Passive modifiers, defenses, prerequisites and attached powers appear here.</span>';
    const warns = has('chassis') ? chassisView(en.chassis).warnings : [];
    l1 += '<button type="button" class="fs-btn fs-xs fs-live-toggle" data-action="toggle-live">' + (S.ui.liveOpenMobile ? '▴ Hide' : '▾ Preview') + '</button>';
    $('#fs-live').innerHTML = '<div class="fs-live-line">' + l1 + '</div><div class="fs-live-more' + (S.ui.liveOpenMobile ? ' open' : '') + '"><div class="fs-live-line fs-live-card">' + l2 + '</div><div class="fs-live-line">' + l3 + '</div>' + (warns.length ? '<div class="fs-live-line" style="font-size:11px">' + warns.slice(0, 2).map((w) => '<span class="fs-down">⛔ ' + esc(w) + '</span>').join(' ') + '</div>' : '') + '</div>';
  }

  // --------------------------------------------------------------------------
  // 14. Render: composable facets
  // --------------------------------------------------------------------------
  const SKILL_OPTS = SKILLS.map((s) => [skillKey(s[0]), s[0]]);
  const ABIL_OPTS = ABILITIES.map((a) => [a[0], a[1]]);
  const USE_MODES = [['passive', 'Passive (Always On)'], ['atwill', '♾️ At-Will'], ['perDay', '🔄 X / Day (Resets Daily)'], ['perEncounter', '⚡ X / Encounter'], ['charges', '🧪 X Charges / Uses (Depletes — Potion/Scroll/Wand)'], ['spellSlot', '🔮 Expend Spell Slot'], ['resourcePool', '🔥 Expend Pool (Turn Undead / Bardic / Ki)'], ['cooldown', '⏳ Cooldown Rounds (e.g. 1d4)']];
  function usageEditor(p, u) {
    let param = '';
    if (['perDay', 'perEncounter', 'charges'].indexOf(u.mode) >= 0) param = inp(p + '.n', u.n, { num: true, min: 1, max: 50, style: 'width:70px' });
    else if (u.mode === 'spellSlot') param = sel(p + '.slotLevel', u.slotLevel, range(0, 9).map((n) => [n, 'Slot Level ' + n]), { narrow: true, num: true });
    else if (u.mode === 'resourcePool') param = '<input class="fs-in" style="width:130px" data-bind="' + p + '.pool" list="fs-pool-list" value="' + esc(u.pool) + '"><datalist id="fs-pool-list">' + opts(['Turn Undead', 'Rebuke Undead', 'Ki', 'Bardic Music', 'Wild Shape', 'Psionic Power Points', 'Custom Pool'], '') + '</datalist>' + inp(p + '.poolCost', u.poolCost, { num: true, min: 1, style: 'width:60px' }) + '<span class="fs-hint">use(s)</span>';
    else if (u.mode === 'cooldown') param = inp(p + '.cooldown', u.cooldown, { ph: '1d4+1', style: 'width:80px' }) + '<span class="fs-hint">rounds</span>';
    return '<span class="fs-row" style="gap:4px">' + sel(p + '.mode', u.mode, USE_MODES, { narrow: true }) + param + '</span>';
  }
  function damageEditor(p, d, liveKind, liveArg) {
    return '<div class="fs-dmg-panel"><div class="fs-row">' + '<span class="fs-label-mini">' + DICE_SVG + ' Damage / Healing</span>' +
      inp(p + '.count', d.count, { num: true, min: 0, style: 'width:60px' }) + inp(p + '.die', d.die, { list: 'fs-dice-list', style: 'width:80px', ph: 'd6 / 4d6 / flat' }) +
      sel(p + '.type', d.on ? d.type : 'None', ['None'].concat(DAMAGE_TYPES), { narrow: true }) +
      sel(p + '.scaling', d.scaling, [['flat', 'Flat (no scaling)'], ['perCL', 'Per [X] Caster Levels']], { narrow: true }) +
      (d.scaling === 'perCL' ? '<span class="fs-hint">every</span>' + sel(p + '.per', d.per, range(1, 10).map((n) => [n, n + ' CL']), { narrow: true, num: true }) + '<span class="fs-hint">from</span>' + sel(p + '.start', d.start, range(1, 20).map((n) => [n, 'CL ' + n]), { narrow: true, num: true }) + '<span class="fs-hint">max</span>' + sel(p + '.max', d.max, range(1, 30).map((n) => [n, n + ' steps']), { narrow: true, num: true }) : '') +
      '</div><div class="fs-dmg-live">' + live(liveKind, liveArg) + '</div></div>';
  }

  function facetIdentity(en) {
    const tagChips = en.tags.map((t, i) => '<span class="fs-pill purple">' + esc(t) + '<span class="fs-x" data-action="remove-tag" data-i="' + i + '">×</span></span>').join('');
    let h = '<div class="fs-grid2">' + field('Name', inp('name', en.name, { ph: entryName(Object.assign({}, en, { name: '' })) + ' (auto-synthesized)' })) + field('Source Book', inp('source', en.source, { ph: 'PHB, DMG, MIC, Homebrew…' })) + '</div>';
    if (en.origin.mode !== 'new' || en.origin.srdId) h += '<div class="fs-origin"><span>📚 Loaded from <b>' + esc(en.origin.srdName) + '</b> <span class="fs-hint">(' + esc(en.origin.srdType) + ' • ' + esc(en.origin.srdId) + ')</span></span>' +
      sel('origin.mode', en.origin.mode, [['override', 'Override Official ID'], ['variant', 'Clone as Variant (new ID)'], ['new', 'Detach as New Entry']], { narrow: true }) + '</div>';
    if (isItemBp(en.blueprint)) {
      h += '<div class="fs-section-label">Item Classification</div><div class="fs-grid4">' + field('Subtype', sel('item.subtype', en.item.subtype, ITEM_SUBTYPES)) + field('Body Slot', sel('item.slot', en.item.slot, BODY_SLOTS)) +
        (en.facets.indexOf('chassis') < 0 ? field('Market Price (gp)', inp('item.price', en.item.price, { num: true, min: 0 })) + field('Caster Level', inp('item.cl', en.item.cl, { num: true, min: 0, max: 30 })) : field('Market Price', '<span class="fs-pill amber" style="height:var(--input-sm-h)">' + gp(chassisView(en.chassis).gpTotal) + ' (computed)</span>')) + '</div>' +
        '';
    }
    if (en.blueprint === 'spell') {
      const sp = en.spell;
      h += '<div class="fs-section-label">🔮 Class & Spell Level • School • Descriptors • Components</div><div class="fs-row">' +
        sp.classes.map((c, i) => '<span class="fs-pill indigo" style="padding:2px 4px">' + '<input class="fs-in" style="width:76px;height:22px" data-bind="spell.classes.' + i + '.cls" list="fs-spellcls-list" value="' + esc(c.cls) + '">' + sel('spell.classes.' + i + '.lvl', c.lvl, range(0, 9), { num: true, style: 'width:48px;height:22px' }) + '<span class="fs-x" data-action="remove-spellcls" data-i="' + i + '">×</span></span>').join('') +
        '<datalist id="fs-spellcls-list">' + opts(SPELL_CLASSES, '') + '</datalist>' + btn('add-spellcls', '+ Class / Level', 'fs-xs fs-dashed') + sel('spell.school', sp.school, SCHOOLS, { narrow: true }) + '</div>' +
        '<div class="fs-row" style="margin-top:6px">' + sp.descriptors.map((d, i) => '<span class="fs-pill rose">[' + esc(d) + ']<span class="fs-x" data-action="remove-descriptor" data-i="' + i + '">×</span></span>').join('') + spotHtml('descriptor', 'spell', { style: 'width:260px' }) + '</div>' +
        '<div class="fs-row" style="margin-top:6px"><span class="fs-hint">Components:</span>' + ['V', 'S', 'M', 'F', 'DF', 'XP'].map((k) => btn('toggle-comp', k, 'fs-xs' + (sp.comps[k] ? ' fs-on' : ''), { k: k })).join('') + '</div>';
    }
    if (en.blueprint === 'feat') h += '<div class="fs-section-label">Times Selectable</div><div class="fs-row">' + sel('repeat.mode', en.repeat.mode, [['once', '1x Only'], ['upto', 'Up to N times'], ['per', 'Per Weapon / School']], { narrow: true }) + (en.repeat.mode === 'upto' ? sel('repeat.n', en.repeat.n, range(2, 20).map((n) => [n, n + ' times']), { narrow: true, num: true }) : '') + '</div>';
    h += '<div class="fs-section-label">#Tags (Standard Taxonomy & Living Pools)</div><div class="fs-row">' + tagChips + spotHtml('tag', 'identity', { style: 'width:300px' }) + '</div>' +
      '<div class="fs-section-label">Rules Text</div><textarea class="fs-in" data-bind="text" placeholder="Official / custom rules text…">' + esc(en.text) + '</textarea>';
    return h;
  }

  function altEditor(ri, ai, a) {
    const p = 'prereqs.' + ri + '.alts.' + ai + '.';
    let body = '';
    switch (a.kind) {
      case 'ability': body = sel(p + 'ability', a.ability, ABIL_OPTS, { narrow: true }) + sel(p + 'min', a.min, range(3, 30).map((n) => [n, 'Min ' + n]), { narrow: true, num: true }); break;
      case 'bab': body = sel(p + 'min', a.min, range(1, 20).map((n) => [n, 'Base Attack Bonus +' + n]), { narrow: true, num: true }); break;
      case 'skill': body = sel(p + 'skill', a.skill, SKILL_OPTS, { narrow: true }) + sel(p + 'min', a.min, range(1, 23).map((n) => [n, n + ' ranks']), { narrow: true, num: true }); break;
      case 'feat': body = (a.feat ? '<span class="fs-pill indigo">' + esc(altText(a)) + '</span>' : '') + spotHtml('prereq', ri + ':' + ai, { style: 'width:280px' }); break;
      case 'level': body = sel(p + 'levelKind', a.levelKind, [['casterLevel', 'Caster Level'], ['charLevel', 'Character Level'], ['classLevel', 'Class Level']], { narrow: true }) + (a.levelKind === 'classLevel' ? inp(p + 'cls', a.cls, { ph: 'Fighter', style: 'width:90px' }) : '') + sel(p + 'min', a.min, range(1, 20).map((n) => [n, '≥ ' + n]), { narrow: true, num: true }); break;
      case 'alignment': body = sel(p + 'align', a.align, ALIGN_REQS.map((x) => [x, ALIGN_NAMES[x] || x]), { narrow: true }); break;
      case 'custom': body = inp(p + 'text', a.text, { ph: 'e.g. Must have slain a dragon; DM approval', style: 'width:300px' }); break;
      case 'spellcasting': body = sel(p + 'cls', a.cls || 'any', [['any', 'Any'], ['arcane', 'Arcane'], ['divine', 'Divine']], { narrow: true }) + sel(p + 'min', a.min, range(0, 9).map((n) => [n, 'Spell Level ' + n]), { narrow: true, num: true }); break;
      case 'deity': body = inp(p + 'feat', a.feat, { list: 'fs-deity-list', ph: 'Pelor', style: 'width:180px' }); break;
    }
    return '<div class="fs-row" style="margin-top:4px">' + (ai > 0 ? '<span class="fs-or">OR</span>' : '') +
      sel(p + 'kind', a.kind, [['ability', 'Ability Score'], ['bab', 'Base Attack Bonus'], ['skill', 'Skill Ranks'], ['feat', 'Feat / Tag Pool / Ability'], ['level', 'Caster / Class Level'], ['alignment', 'Alignment'], ['spellcasting', 'Spellcasting'], ['deity', 'Patron Deity'], ['custom', 'Special / DM Requirement']], { narrow: true }) +
      body + btn('remove-alt', '×', 'fs-xs fs-ghost', { ri: ri, ai: ai }) + '</div>';
  }
  function facetPrereqs(en) {
    if (!en.prereqs.length) return '<div class="fs-row"><span class="fs-hint">No prerequisites — available to everyone.</span>' + btn('add-prereq', '+ Add Prerequisite', 'fs-xs fs-dashed') + '</div>';
    return en.prereqs.map((r, ri) => (ri > 0 ? '<div class="fs-and">AND</div>' : '') + card('pr:' + r.id, '🏛️ ' + live('prereq-row', ri), r.alts.map((a, ai) => altEditor(ri, ai, a)).join('') + '<div class="fs-row" style="margin-top:6px">' + btn('add-or', '+Or', 'fs-xs', { ri: ri }) + btn('remove-prereq', 'Delete Row', 'fs-xs fs-rose', { ri: ri }) + '</div>')).join('') +
      '<div class="fs-row" style="margin-top:8px">' + btn('add-prereq', '+ Add Prerequisite', 'fs-xs fs-dashed') + live('prereq-all') + '</div>';
  }

  function facetChassis(en) {
    const ch = en.chassis, v = chassisView(ch), isW = ch.kind === 'weapon';
    let over;
    if (isW) {
      const w = ch.weapon;
      over = '<div class="fs-grid4">' + field('Base Dice (any expression)', inp('chassis.weapon.dice', w.dice, { list: 'fs-dice-list', ph: '1d8, 2d6, 4d6…' })) +
        field('Base Crit Range', sel('chassis.weapon.critRange', w.critRange, [[20, '20'], [19, '19–20'], [18, '18–20'], [17, '17–20'], [15, '15–20']], { num: true })) +
        field('Crit Mult', sel('chassis.weapon.critMult', w.critMult, [[2, '×2'], [3, '×3'], [4, '×4']], { num: true })) + field('Damage Type', sel('chassis.weapon.dmgType', w.dmgType, DAMAGE_TYPES.slice(0, 3))) +
        field('Category', sel('chassis.weapon.category', w.category, ['Simple', 'Martial', 'Exotic'])) + field('Handedness', sel('chassis.weapon.handed', w.handed, ['Light', 'One-Handed', 'Two-Handed'])) +
        field('Range Increment', w.rangeOn ? '<span class="fs-row" style="gap:3px">' + inp('chassis.weapon.range', w.range, { num: true, min: 0, style: 'width:70px' }) + btn('toggle-range', '×', 'fs-xs fs-ghost') + '</span>' : btn('toggle-range', '+ Range Increment', 'fs-xs fs-dashed')) +
        field('Effective Threat', '<span class="fs-pill ' + (v.capped ? 'amber' : 'sky') + '" style="height:var(--input-sm-h)">' + esc(v.critText) + (v.keen ? ' (Keen)' : '') + '</span>') + '</div>';
    } else {
      const a = ch.armor;
      over = '<div class="fs-grid3">' + field('Armor Type', sel('chassis.armor.type', a.type, ['Light', 'Medium', 'Heavy', 'Shield'])) + field(v.kind === 'shield' ? 'Shield Bonus' : 'Armor Bonus', inp('chassis.armor.armorBonus', a.armorBonus, { num: true, min: 0 })) +
        field('Max Dex (99 = none)', inp('chassis.armor.maxDex', a.maxDex, { num: true })) + field('Armor Check Penalty', inp('chassis.armor.acp', a.acp, { num: true, max: 0 })) +
        field('Arcane Spell Failure %', inp('chassis.armor.asf', a.asf, { num: true, min: 0 })) + field('Speed (30-ft. base)', inp('chassis.armor.speed', a.speed, { num: true })) + '</div>' +
        '<div class="fs-hint" style="margin-top:4px">After material: Max Dex ' + (v.armor.maxDex >= 99 ? '—' : sgn(v.armor.maxDex)) + ' • ACP ' + v.armor.acp + ' • ASF ' + v.armor.asf + '% • ' + v.armor.type + ' • Speed ' + v.armor.speed + ' ft.</div>';
    }
    const mat = MATERIALS.find((m) => m.id === ch.material) || MATERIALS[0];
    const enchCards = v.enchs.map((e) => card('en:' + e.id, '<span class="fs-pill emerald">' + esc(e.name) + '</span> <span class="fs-pill dim">' + (e.plus ? '+' + e.plus + ' bonus' : gp(e.gp)) + '</span> <span class="fs-hint">' + esc(short(e.desc, 90)) + '</span>',
      '<div class="fs-hint" style="color:var(--text-secondary)">' + esc(e.desc) + '</div><div class="fs-row" style="margin-top:6px"><span class="fs-hint">Source: ' + esc(e.src) + '</span>' + btn('remove-ench', 'Remove', 'fs-xs fs-rose', { id: e.id }) + '</div>')).join('');
    const cr = v.crystal;
    const crystalBlock = cr ? card('crystal', '<span class="fs-pill purple">💎 ' + esc(cr.c.name) + '</span> <span class="fs-pill dim">' + cap1(cr.tier) + ' • ' + gp(cr.c.cost[cr.ti]) + '</span> <span class="fs-hint">' + esc(short(cr.text, 90)) + '</span>',
      '<div class="fs-row">' + sel('chassis.crystal.tier', cr.tier, CRYSTAL_TIERS.map((t, i) => [t, cap1(t) + ' (' + (t === 'least' ? 'masterwork' : '+' + CRYSTAL_REQ[t]) + ')' + (cr.c.cost[i] == null ? ' — n/a' : ' — ' + gp(cr.c.cost[i]))]), { narrow: true }) + btn('remove-crystal', 'Remove Crystal', 'fs-xs fs-rose') + '</div>' +
      '<div class="fs-hint" style="margin-top:6px;color:var(--text-secondary)">' + esc(cr.text) + '</div><div class="fs-hint">Source: ' + esc(cr.c.src) + '</div>') : spotHtml('crystal', 'chassis', { style: 'max-width:420px' });
    const derivedChips = isW ? v.parts.filter((p) => p.source !== 'Custom').map((p) => '<span class="fs-pill ' + (p.raw ? 'sky' : p.crit === 'onCritOnly' ? 'rose' : 'amber') + '">' + (p.raw ? '⚔️ ' : p.crit === 'onCritOnly' ? '💥 ' : '🔥 ') + esc(partText(p)) + ' <span style="opacity:.6">· ' + esc(p.source) + '</span></span>').join('') : '';
    const customParts = (ch.damageParts || []).map((p, i) => card('dp:' + (p.id || i), '<span class="fs-pill amber">🩸 ' + live('dmg-sum', i) + '</span>',
      '<div class="fs-row">' + inp('chassis.damageParts.' + i + '.count', p.count, { num: true, min: 0, style: 'width:60px' }) + sel('chassis.damageParts.' + i + '.die', p.die, [['d4', 'd4'], ['d6', 'd6'], ['d8', 'd8'], ['d10', 'd10'], ['d12', 'd12'], ['flat', 'Flat']], { narrow: true }) +
      sel('chassis.damageParts.' + i + '.type', p.type, DAMAGE_TYPES, { narrow: true }) + sel('chassis.damageParts.' + i + '.crit', p.crit, [['normal', 'Normal'], ['multiply', 'Multiply on Crit'], ['onCritOnly', 'On Crit Only (Burst)']], { narrow: true }) +
      inp('chassis.damageParts.' + i + '.cond', p.cond || '', { ph: 'Condition / note (vs undead)', style: 'width:180px' }) + btn('remove-dmg', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    const dd = S.ui.dmgDraft;
    return '<div class="fs-grid3">' + field('Chassis Kind', sel('chassis.kind', ch.kind, [['weapon', 'Weapon'], ['armor', 'Armor / Shield']])) +
      field('Base ' + (isW ? 'Weapon' : 'Armor / Shield'), '<span class="fs-pill sky" style="height:var(--input-sm-h)">' + esc(v.base.name) + ' • ' + gp(v.base.cost) + '</span>') + field('Material', sel('chassis.material', ch.material, MATERIALS.map((m) => [m.id, m.name]))) + '</div>' +
      '<div style="margin-top:6px">' + spotHtml('base', 'chassis', { ph: '🔍 Change base ' + (isW ? 'weapon' : 'armor / shield') + ' (SRD + seed)…' }) + '</div>' +
      (mat.note ? '<div class="fs-hint" style="margin-top:4px">💎 ' + esc(mat.note) + '</div>' : '') +
      '<div class="fs-section-label">Hand-Editable Overrides</div>' + over +
      '<div class="fs-section-label">Enhancement & Special Abilities</div><div class="fs-row">' + field('Enhancement', sel('chassis.enhancement', ch.enhancement, range(0, 5).map((n) => [n, sgn(n)]), { num: true }), 'width:90px') + '<div style="flex:1;min-width:220px">' + live('budget') + '</div></div>' +
      enchCards + '<div style="margin-top:6px">' + spotHtml('ench', 'chassis') + '</div>' +
      '<div class="fs-section-label">💎 MIC Augment Crystal</div>' + crystalBlock +
      (isW ? '<div class="fs-section-label">🩸 damageParts[] Builder</div><div class="fs-row">' + derivedChips + '</div>' + customParts +
        '<div class="fs-row" style="margin-top:6px">' + inp('dmgDraft.count', dd.count, { scope: 'ui', num: true, min: 0, style: 'width:60px' }) + sel('dmgDraft.die', dd.die, [['d4', 'd4'], ['d6', 'd6'], ['d8', 'd8'], ['d10', 'd10'], ['d12', 'd12'], ['flat', 'Flat']], { scope: 'ui', narrow: true }) +
        sel('dmgDraft.type', dd.type, DAMAGE_TYPES, { scope: 'ui', narrow: true }) + sel('dmgDraft.crit', dd.crit, [['normal', 'Normal'], ['multiply', 'Multiply on Crit'], ['onCritOnly', 'On Crit Only (Burst)']], { scope: 'ui', narrow: true }) +
        inp('dmgDraft.cond', dd.cond, { scope: 'ui', ph: 'Condition / note (e.g. vs Undead)', style: 'width:200px', enter: 'add-dmg' }) + btn('add-dmg', '+ Add', 'fs-xs fs-primary') + '</div>' : '') +
      '<div style="margin-top:8px">' + live('chassis-warn') + '</div><div class="fs-section-label">💰 Market Price (DMG)</div><div class="fs-bd">' + live('gp-table') + '</div>';
  }

  function bonusTypeOpts() { return allBonusTypes().map((b) => [b.id, b.id + (b.custom ? ' (custom)' : '') + (b.stacks ? ' — stacks' : '') + (b.lostFF ? ', lost Flat-Footed' : '') + (b.cap ? ' — max +' + b.cap : '')]); }
  function modRows(prefix, list, keyPrefix, liveKind) {
    return list.map((m, i) => card(keyPrefix + m.id, '<span class="fs-pill ' + (num(m.value) < 0 || m.type === 'Penalty' ? 'rose' : 'emerald') + '">✨</span> ' + (liveKind ? live(liveKind, i) : esc(modShort(m))),
      '<div class="fs-grid3">' + field('Target', selGroups(prefix + '.' + i + '.target', m.target, TARGET_GROUPS)) + field('Bonus Type', sel(prefix + '.' + i + '.type', m.type, bonusTypeOpts())) +
      field('Scaling', sel(prefix + '.' + i + '.formula', m.formula || 'flat', FORMULAS)) + field('Value', inp(prefix + '.' + i + '.value', m.value, { num: true })) +
      field('Condition (optional)', inp(prefix + '.' + i + '.condition', m.condition, { ph: 'vs Fear, flanking…' })) + field('\u00a0', btn('remove-mod', 'Delete Modifier', 'fs-xs fs-rose', { i: i, p: prefix })) + '</div>')).join('');
  }
  function facetModifiers(en) {
    const ct = S.ui.customType;
    const customForm = S.ui.customTypeOpen ? '<div class="fs-card open" style="padding:8px"><div class="fs-row">' + inp('customType.name', ct.name, { scope: 'ui', ph: 'Bonus type name (e.g. Shadow)', style: 'width:200px' }) +
      chk('customType.stacks', ct.stacks, 'Stacks with itself', { scope: 'ui' }) + chk('customType.lostFF', ct.lostFF, 'Lost when Flat-Footed', { scope: 'ui' }) + btn('save-custom-type', 'Save Bonus Type', 'fs-xs fs-emerald') + btn('toggle-custom-type', 'Cancel', 'fs-xs fs-ghost') + '</div></div>' : '';
    const subs = en.substitutions.map((s, i) => card('s:' + (s.id || i), '🔄 ' + live('sub-sum', i), '<div class="fs-row">' + sel('substitutions.' + i + '.op', s.op, [['replace', 'Replace'], ['max', 'Use Higher Of']], { narrow: true }) +
      sel('substitutions.' + i + '.save', s.save, [['fort', 'Fortitude'], ['ref', 'Reflex'], ['will', 'Will']], { narrow: true }) + '<span class="fs-hint">save:</span>' + sel('substitutions.' + i + '.from', s.from, ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true }) +
      '<span class="fs-hint">→</span>' + sel('substitutions.' + i + '.to', s.to, ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true }) + btn('remove-sub', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    return (en.modifiers.length ? modRows('modifiers', en.modifiers, 'm:', 'mod-sum') : '<div class="fs-hint">No passive modifiers yet.</div>') +
      '<div class="fs-row" style="margin-top:8px">' + btn('add-mod', '+ Add Modifier', 'fs-xs fs-dashed', { p: 'modifiers' }) + btn('toggle-custom-type', '+ Define Custom Bonus Type', 'fs-xs fs-dashed') + btn('add-sub', '+ Ability Modifier Substitution', 'fs-xs fs-dashed') + '</div>' + customForm +
      (S.customBonusTypes.length ? '<div class="fs-row" style="margin-top:4px"><span class="fs-hint">Custom types:</span>' + S.customBonusTypes.map((b, i) => '<span class="fs-pill sky">' + esc(b.id) + (b.stacks ? ' · stacks' : '') + (b.lostFF ? ' · lost FF' : '') + '<span class="fs-x" data-action="remove-custom-type" data-i="' + i + '">×</span></span>').join('') + '</div>' : '') +
      (subs ? '<div class="fs-section-label">Ability Modifier Substitution</div>' + subs : '') +
      '<div class="fs-section-label">🩸 Debuff State Locks</div><div class="fs-row">' + Object.keys(LOCK_LABEL).map((k) => chk('locks.' + k, en.locks[k], esc(LOCK_LABEL[k]))).join('') + '</div>';
  }

  function powerEditor(pw, i) {
    const p = 'powers.' + i;
    const ref = pw.kind === 'attached' && pw.ref ? '<div class="fs-ref"><b>🔮 ' + esc(pw.ref.name) + '</b> <span class="fs-pill dim">' + esc(pw.ref.levelText || ('Level ' + pw.ref.level)) + '</span>' + (pw.ref.school ? ' <span class="fs-pill dim">' + esc(pw.ref.school) + '</span>' : '') + '<div class="fs-hint" style="margin-top:3px">' + esc(pw.ref.desc) + '</div></div>' : '';
    let h = ref + '<div class="fs-grid4">' + (pw.kind === 'inline' ? field('Power Name', inp(p + '.name', pw.name)) : field('Grant Mode', sel(p + '.grantMode', pw.grantMode, [['cast', 'Cast from Item / SLA'], ['known', 'Add to Spells Known / Spell List'], ['slot', 'Expend Own Spell Slot (Runestaff)']]))) +
      field('Action', sel(p + '.action', pw.action, ACTIONS)) + field('Caster Level', inp(p + '.cl', pw.cl, { num: true, min: 0, max: 30 })) + field('Save DC (0 = per spell)', inp(p + '.dc', pw.dc, { num: true, min: 0 })) + '</div>' +
      '<div class="fs-row" style="margin-top:6px"><span class="fs-label-mini">Independent Usage</span>' + usageEditor(p + '.use', pw.use) + '</div>' +
      '<div class="fs-grid3" style="margin-top:6px">' + field('Range', inp(p + '.range', pw.range, { list: 'fs-range-list', ph: pw.ref && pw.ref.range ? pw.ref.range : '—' })) +
      field('Area / Target', inp(p + '.area', pw.area, { list: 'fs-area-list' })) + field('Duration', inp(p + '.duration', pw.duration, { ph: 'Instantaneous, 1 round/level…' })) + '</div>' +
      (pw.attackOn ? '<div class="fs-row" style="margin-top:6px"><span class="fs-label-mini">🎯 Attack & Save</span>' + sel(p + '.attack', pw.attack, Object.keys(ATTACK_LABEL).map((k) => [k, ATTACK_LABEL[k]]), { narrow: true }) + sel(p + '.save.type', pw.save.type, ['None', 'Fortitude', 'Reflex', 'Will'], { narrow: true }) + (pw.save.type !== 'None' ? sel(p + '.save.effect', pw.save.effect, ['Negates', 'Half', 'Partial', 'Negates (harmless)', 'Disbelief'], { narrow: true }) : '') + btn('toggle-flag', '×', 'fs-xs fs-ghost', { p: p + '.attackOn' }) + '</div>' : '') +
      (pw.damage.on ? damageEditor(p + '.damage', pw.damage, 'pw-dmg', i) : '') +
      '<div class="fs-row" style="margin-top:6px">' + (pw.attackOn ? '' : btn('toggle-flag', '+ 🎯 Attack & Save', 'fs-xs fs-dashed', { p: p + '.attackOn' })) + (pw.damage.on ? '' : btn('toggle-flag', '+ 💥 Damage', 'fs-xs fs-dashed', { p: p + '.damage.on' })) + '</div>' +
      '<div class="fs-section-label">Activated Buff / Debuff Modifiers</div>' + (pw.modifiers.length ? modRows(p + '.modifiers', pw.modifiers, 'pm:' + pw.id + ':') : '') + btn('add-mod', '+ Add Activated Modifier', 'fs-xs fs-dashed', { p: p + '.modifiers' }) +
      '<div class="fs-section-label">Rule Effect Text</div><textarea class="fs-in" data-bind="' + p + '.text" placeholder="What happens when activated…">' + esc(pw.text) + '</textarea>' +
      '<div class="fs-row" style="margin-top:6px">' + (pw.kind === 'inline' ? chk(p + '.exportStandalone', pw.exportStandalone, '📌 Also export as standalone Custom DB entry') : '') + btn('move-power', '↑', 'fs-xs', { i: i, d: -1 }) + btn('move-power', '↓', 'fs-xs', { i: i, d: 1 }) + btn('remove-power', 'Delete Power', 'fs-xs fs-rose', { i: i }) + '</div>';
    return h;
  }
  function facetPowers(en) {
    const list = en.powers.map((pw, i) => card('pw:' + pw.id, '<span class="fs-pill ' + (pw.kind === 'attached' ? 'purple' : 'amber') + '">' + (pw.kind === 'attached' ? 'Attached' : 'Inline') + '</span> ' + live('pw-sum', i), powerEditor(pw, i))).join('');
    return (list || '<div class="fs-hint">No sub-abilities yet. Define several independent powers or spells inside this single entry.</div>') +
      '<div class="fs-row" style="margin-top:8px;align-items:flex-start"><div style="flex:1;min-width:260px">' + spotHtml('power', 'powers') + '</div>' + btn('add-power-inline', '✨ + Create New Power / Spell Inline', 'fs-primary') + '</div>';
  }

  function facetDelivery(en) {
    const d = en.delivery;
    const extras = d.extras.map((x, i) => card('x:' + x.id, '📜 <b>' + esc(EXTRA_KINDS[x.kind] || 'Rule') + ':</b> ' + live('x-sum', i), '<div class="fs-row">' + inp('delivery.extras.' + i + '.text', x.text, { style: 'flex:1;min-width:240px', ph: 'Rule detail…' }) + btn('remove-extra', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    return '<div class="fs-grid4">' + field('Action', sel('delivery.action', d.action, ACTIONS)) + field('Range', inp('delivery.range', d.range, { list: 'fs-range-list' })) + field('Area / Target', inp('delivery.area', d.area, { list: 'fs-area-list' })) +
      field('Attack Roll', d.attackOn ? '<span class="fs-row" style="gap:3px">' + sel('delivery.attack', d.attack, Object.keys(ATTACK_LABEL).map((k) => [k, ATTACK_LABEL[k]])) + btn('toggle-flag', '×', 'fs-xs fs-ghost', { p: 'delivery.attackOn' }) + '</span>' : btn('toggle-flag', '+ 🎯 Attack Roll', 'fs-xs fs-dashed', { p: 'delivery.attackOn' })) + '</div>' +
      (d.damage.on ? damageEditor('delivery.damage', d.damage, 'dmg-main') : '<div class="fs-row" style="margin-top:8px">' + btn('toggle-flag', '+ 💥 Damage / Healing & Scaling', 'fs-xs fs-dashed', { p: 'delivery.damage.on' }) + '</div>') +
      '<div class="fs-section-label">Saving Throw & Spell Resistance</div><div class="fs-row">' + sel('delivery.save.type', d.save.type, [['None', 'No Saving Throw'], 'Fortitude', 'Reflex', 'Will'], { narrow: true }) +
      (d.save.type !== 'None' ? sel('delivery.save.effect', d.save.effect, ['Negates', 'Half', 'Partial', 'Negates (harmless)', 'Disbelief'], { narrow: true }) + sel('delivery.save.dcMode', d.save.dcMode, [['spell', 'DC 10 + Spell Level + Stat'], ['hd', 'DC 10 + 1/2 HD + Stat'], ['flat', 'Flat DC']], { narrow: true }) +
        (d.save.dcMode === 'flat' ? inp('delivery.save.flat', d.save.flat, { num: true, style: 'width:70px' }) : sel('delivery.save.stat', d.save.stat, ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true })) : '') +
      '<span class="fs-pill amber">' + live('dc') + '</span>' + field('Spell Resistance', sel('delivery.sr', d.sr, ['Yes', 'No', 'Yes (harmless)', 'Yes (object)', 'See text']), 'width:150px;flex-direction:row;align-items:center;gap:6px') + '</div>' +
      (extras ? '<div class="fs-section-label">Delivery Rules</div>' + extras : '') +
      '<div class="fs-row" style="margin-top:8px">' + sel('extraDraft', S.ui.extraDraft, Object.keys(EXTRA_KINDS).map((k) => [k, EXTRA_KINDS[k]]), { scope: 'ui', narrow: true }) + btn('add-extra', '+ Add Delivery Rule', 'fs-xs fs-dashed') + '</div>';
  }

  function facetLifecycle(en) {
    const l = en.lifecycle, dur = ['rounds', 'roundsPerLevel', 'minPerLevel', 'hourPerLevel'].indexOf(l.duration) >= 0;
    return '<div class="fs-row"><span class="fs-label-mini">Usage</span>' + usageEditor('lifecycle.use', l.use) + '</div>' +
      '<div class="fs-row" style="margin-top:6px"><span class="fs-label-mini">Duration</span>' + sel('lifecycle.duration', l.duration, DURATIONS, { narrow: true }) +
      (dur ? inp('lifecycle.durValue', l.durValue, { num: true, min: 1, style: 'width:70px' }) : '') + (l.duration === 'text' ? inp('lifecycle.durText', l.durText, { ph: 'Until landing or 1 round/level', style: 'width:240px' }) : '') + chk('lifecycle.dismissible', l.dismissible, 'Dismissible (D)') + '</div>' +
      '<div class="fs-row" style="margin-top:8px">' + chk('lifecycle.stackable', l.stackable, 'Stackable ×N') + (l.stackable ? sel('lifecycle.maxStacks', l.maxStacks, range(1, 20).map((n) => [n, 'Max Stacks ' + n]), { narrow: true, num: true }) : '') + chk('lifecycle.ongoingOn', l.ongoingOn, 'Ongoing Start-of-Turn Effect') + '</div>' +
      (l.ongoingOn ? '<div class="fs-row" style="margin-top:6px">' + sel('lifecycle.ongoing.kind', l.ongoing.kind, [['dot', '🩸 DOT Damage'], ['fastHeal', '💚 Fast Healing']], { narrow: true }) +
        (l.ongoing.kind === 'dot' ? inp('lifecycle.ongoing.dice', l.ongoing.dice, { ph: '1d6', style: 'width:80px' }) + sel('lifecycle.ongoing.type', l.ongoing.type, DAMAGE_TYPES, { narrow: true }) : inp('lifecycle.ongoing.value', l.ongoing.value, { num: true, style: 'width:70px' }) + '<span class="fs-hint">HP / round</span>') + '</div>' : '');
  }

  function facetDefenses(en) {
    const d = en.defenses;
    const drs = d.dr.map((x, i) => card('dr:' + (x.id || i), '🛡️ ' + live('dr-sum', i), '<div class="fs-row">' + inp('defenses.dr.' + i + '.value', x.value, { num: true, style: 'width:70px' }) + '<span>/</span>' + sel('defenses.dr.' + i + '.bypass', x.bypass, DR_BYPASS.map((b) => [b, b === '-' ? '— (untyped)' : b]), { narrow: true }) + btn('remove-dr', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    const ens = d.energy.map((x, i) => card('en:' + (x.id || i), '🛡️ ' + live('en-sum', i), '<div class="fs-row">' + sel('defenses.energy.' + i + '.type', x.type, ENERGY, { narrow: true }) + sel('defenses.energy.' + i + '.mode', x.mode || 'Resistance', ['Resistance', 'Immunity', 'Vulnerability'], { narrow: true }) +
      ((x.mode || 'Resistance') === 'Resistance' ? inp('defenses.energy.' + i + '.value', x.value, { num: true, style: 'width:70px' }) : '') + btn('remove-en', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    return '<div class="fs-section-label" style="margin-top:0">Damage Reduction</div>' + drs + btn('add-dr', '+ Damage Reduction', 'fs-xs fs-dashed') +
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
      const chips = l.features.map((f, fi) => '<span class="fs-pill ' + (f.kind === 'inline' ? 'amber' : f.kind === 'pattern' ? 'sky' : 'indigo') + '" data-action="toggle-card" data-key="ft:' + f.id + '" style="cursor:pointer" title="' + esc(f.text || '') + '">' + (f.kind === 'inline' ? '✨ ' : '') + live('feat-sum', i + ':' + fi) + '<span class="fs-x" data-action="remove-feature" data-l="' + i + '" data-f="' + fi + '">×</span></span>').join('');
      const editors = l.features.map((f, fi) => (S.ui.cardOpen['ft:' + f.id] ? '<tr class="fs-sub-row"><td></td><td colspan="6"><div class="fs-card open" style="padding:8px"><div class="fs-grid3">' + field('Feature Name', inp('progression.levels.' + i + '.features.' + fi + '.name', f.name)) +
        field('Ability Type', sel('progression.levels.' + i + '.features.' + fi + '.abilityType', f.abilityType || 'Ex', [['Ex', 'Extraordinary (Ex)'], ['Su', 'Supernatural (Su)'], ['Sp', 'Spell-Like (Sp)'], ['—', 'Natural / Other']])) +
        field('Origin', '<span class="fs-pill ' + (f.kind === 'inline' ? 'amber' : 'indigo') + '" style="height:var(--input-sm-h)">' + (f.kind === 'inline' ? 'Created inline' : f.kind === 'pattern' ? 'Pattern Generator' : 'SRD / Custom ref') + '</span>') + '</div>' +
        '<textarea class="fs-in" style="margin-top:6px" data-bind="progression.levels.' + i + '.features.' + fi + '.text" placeholder="Feature rules text…">' + esc(f.text || '') + '</textarea></div></td></tr>' : '')).join('');
      return '<tr><td><b>' + L + '</b></td><td>' + sgn(classBAB(p.bab, L)) + '</td><td>' + sgn(p.good.fort ? goodSave(L) : poorSave(L)) + '</td><td>' + sgn(p.good.ref ? goodSave(L) : poorSave(L)) + '</td><td>' + sgn(p.good.will ? goodSave(L) : poorSave(L)) + '</td>' +
        '<td><div class="fs-row" style="gap:3px">' + chips + spotHtml('feature', i, { style: 'width:170px', ph: '🔍 + feature / feat' }) + btn('add-feature-inline', '+ Inline', 'fs-xs fs-dashed', { l: i }) + '</div></td>' +
        '<td><label class="fs-check' + (l.spell ? ' on' : '') + '" style="padding:1px 6px"><input type="checkbox" data-bind="progression.levels.' + i + '.spell" data-t="bool"' + (l.spell ? ' checked' : '') + '>+1</label></td></tr>' + editors;
    }).join('');
    return '<div class="fs-grid4">' + field('Matrix', sel('progression.mode', p.mode, [['base', 'Base Class (1–20)'], ['prestige', 'Prestige Class (1–10)'], ['legacy', 'Legacy Item (1–20)']])) +
      field('Hit Die', sel('progression.hitDie', p.hitDie, [4, 6, 8, 10, 12].map((n) => [n, 'd' + n]), { num: true })) + field('Base Attack Bonus', sel('progression.bab', p.bab, [['full', 'Full (Fighter)'], ['3/4', '3/4 (Cleric)'], ['1/2', '1/2 (Wizard)']])) +
      field('Skill Points / Level', sel('progression.skillPts', p.skillPts, [2, 4, 6, 8].map((n) => [n, n + ' + Int']), { num: true })) + '</div>' +
      '<div class="fs-row" style="margin-top:8px"><span class="fs-hint">Good Saves:</span>' + chk('progression.good.fort', p.good.fort, 'Fortitude') + chk('progression.good.ref', p.good.ref, 'Reflex') + chk('progression.good.will', p.good.will, 'Will') + '</div>' +
      '<div class="fs-section-label">🔁 Repeating Pattern Generator</div><div class="fs-row">' + inp('progression.pattern.name', p.pattern.name, { ph: 'Feature name', style: 'width:150px' }) +
      '<span class="fs-hint">start</span>' + sel('progression.pattern.start', p.pattern.start, range(1, p.maxLevel), { narrow: true, num: true }) + '<span class="fs-hint">every</span>' + sel('progression.pattern.every', p.pattern.every, range(1, 10), { narrow: true, num: true }) +
      '<span class="fs-hint">scaling</span>' + inp('progression.pattern.scale', p.pattern.scale, { ph: '+1d6 or +1', style: 'width:80px' }) + btn('gen-pattern', '⚡ Generate Rows', 'fs-xs fs-primary') + '</div>' +
      '<div class="fs-section-label">🧩 Class Skills</div><div class="fs-row">' + p.classSkills.map((s, i) => '<span class="fs-pill emerald">' + esc(s) + '<span class="fs-x" data-action="remove-skill" data-i="' + i + '">×</span></span>').join('') + spotHtml('skill', 'classic', { style: 'width:180px' }) + Object.keys(SKILL_PACKAGES).map((k) => btn('skill-pkg', '+ ' + k, 'fs-xs', { k: k })).join('') + '</div>' +
      '<div class="fs-scroll-x" style="margin-top:8px"><table class="fs-table"><thead><tr><th>Lvl</th><th>BAB</th><th>Fort</th><th>Ref</th><th>Will</th><th>Features (click to edit)</th><th title="+1 Level of Existing Spellcasting Class">+1 Spellcasting</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function ladderEditor(prefix, ladder, readonly) {
    return '<div class="fs-grid3">' + ladder.map((s, i) => field('Level ' + (i + 1), readonly ? '<span class="fs-pill dim" style="height:var(--input-sm-h)">' + esc(s || '—') + '</span>' : '<input class="fs-in" data-bind="' + prefix + '.' + i + '" list="fs-spell-names" value="' + esc(s) + '">')).join('') + '</div>';
  }
  function domainsBlock(en) {
    const g = en.grants;
    const list = g.domains.map((d, i) => card('dm:' + d.id, '✨ ' + live('dom-sum', i) + ' <span class="fs-pill ' + (d.kind === 'inline' ? 'amber' : 'dim') + '">' + (d.kind === 'inline' ? 'Inline' : 'SRD') + '</span>',
      (d.kind === 'inline' ? '<div class="fs-grid2">' + field('Domain Name', inp('grants.domains.' + i + '.name', d.name)) + '</div>' : '') +
      '<div class="fs-section-label">Granted Power</div>' + (d.kind === 'inline' ? '<textarea class="fs-in" data-bind="grants.domains.' + i + '.grantedPower">' + esc(d.grantedPower) + '</textarea>' : '<div class="fs-hint" style="color:var(--text-secondary)">' + esc(d.grantedPower) + '</div>') +
      '<div class="fs-section-label">Spell Ladder</div>' + ladderEditor('grants.domains.' + i + '.ladder', d.ladder, d.kind !== 'inline') +
      '<div class="fs-row" style="margin-top:6px">' + btn('remove-domain', 'Remove Domain', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
    return '<div class="fs-section-label">✨ Domains</div>' + list + '<div class="fs-row" style="margin-top:6px"><div style="flex:1;min-width:240px">' + spotHtml('domain', 'grants') + '</div>' + btn('add-domain-inline', '+ Create New Domain Inline', 'fs-xs fs-dashed') + '</div>';
  }
  function facetGrants(en) {
    const g = en.grants;
    if (en.blueprint === 'domain') return '<div class="fs-grid2">' + field('Granted Power Name', inp('grants.grantedPowerName', g.grantedPowerName)) + field('Usage', usageEditor('grants.gpUse', g.gpUse)) + '</div>' + '<div class="fs-section-label">Granted Power Rules</div><textarea class="fs-in" data-bind="grants.grantedPower" placeholder="Describe the granted power…">' + esc(g.grantedPower) + '</textarea>' +
      '<div class="fs-section-label">📜 Domain Spell Ladder (Levels 1–9)</div>' + ladderEditor('grants.ladder', g.ladder, false);
    let h = '';
    if (en.blueprint === 'deity') {
      const grid = '<div class="fs-align">' + ALIGNS.map((a) => '<button type="button" data-action="set-deity-align" data-a="' + a + '" class="' + (a === g.deityAlign ? 'deity' : clericLegal(g.deityAlign, a) ? 'legal' : '') + '" title="' + ALIGN_NAMES[a] + '">' + a + '</button>').join('') + '</div>';
      h += '<div class="fs-row" style="align-items:flex-start;gap:16px"><div><div class="fs-section-label" style="margin-top:0">Deity Alignment</div>' + grid + '<div class="fs-hint" style="margin-top:4px;max-width:210px">Green = legal Cleric alignments (one step on one axis): ' + ALIGNS.filter((a) => clericLegal(g.deityAlign, a)).join(', ') + '</div></div>' +
        '<div style="flex:1;min-width:240px">' + field('Favored Weapon', inp('grants.favoredWeapon', g.favoredWeapon, { list: 'fs-weapon-names' })) + field('Portfolio', inp('grants.portfolio', g.portfolio)) + field('Worshippers / Dogma', inp('grants.dogma', g.dogma)) + '</div></div>';
    } else {
      const ds = g.deities.map((d, i) => card('dt:' + d.id, '🏛️ ' + live('deity-sum', i) + ' <span class="fs-pill ' + (d.kind === 'inline' ? 'amber' : 'dim') + '">' + (d.kind === 'inline' ? 'Inline' : 'PHB') + '</span>',
        '<div class="fs-grid3">' + field('Deity Name', inp('grants.deities.' + i + '.name', d.name)) + field('Alignment', sel('grants.deities.' + i + '.align', d.align, ALIGNS.map((a) => [a, ALIGN_NAMES[a]]))) + field('Favored Weapon', inp('grants.deities.' + i + '.favoredWeapon', d.favoredWeapon, { list: 'fs-weapon-names' })) + '</div>' +
        '<div class="fs-row" style="margin-top:6px">' + btn('remove-deity', 'Remove Deity', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
      h += '<div class="fs-section-label" style="margin-top:0">🏛️ Patron Deity</div>' + ds + '<div class="fs-row" style="margin-top:6px"><div style="flex:1;min-width:240px">' + spotHtml('deity', 'grants') + '</div>' + btn('add-deity-inline', '+ Create New Deity Inline', 'fs-xs fs-dashed') + '</div>';
    }
    h += domainsBlock(en);
    if (en.blueprint !== 'deity') {
      const grants = g.featGrants.map((x, i) => card('g:' + (x.id || i), '🎯 ' + live('grant-sum', i), '<div class="fs-row">' + sel('grants.featGrants.' + i + '.level', x.level, range(1, 20).map((n) => [n, 'Level ' + n]), { narrow: true, num: true }) +
        sel('grants.featGrants.' + i + '.count', x.count, range(1, 5).map((n) => [n, n + ' feat' + (n > 1 ? 's' : '')]), { narrow: true, num: true }) + '<span class="fs-hint">from</span>' + sel('grants.featGrants.' + i + '.pool', x.pool, allTags(), { narrow: true }) + btn('remove-grant', 'Delete', 'fs-xs fs-rose', { i: i }) + '</div>')).join('');
      h += '<div class="fs-section-label">🎯 Bonus Feat Slot Grants (#Tag Pools)</div>' + grants + btn('add-grant', '+ Grant Bonus Feat Slot', 'fs-xs fs-dashed');
    }
    return h;
  }

  const FACET_RENDER = { identity: facetIdentity, prereqs: facetPrereqs, chassis: facetChassis, modifiers: facetModifiers, effects: (en) => facetEffects(en), powers: facetPowers, delivery: facetDelivery, lifecycle: facetLifecycle, defenses: facetDefenses, progression: facetProgression, grants: facetGrants };
  function facetMeta(en, k) {
    switch (k) {
      case 'identity': return en.tags.length + ' tags';
      case 'prereqs': return en.prereqs.length + ' AND rows';
      case 'chassis': { const v = chassisView(en.chassis); return sgn(v.effective) + ' / +10 • ' + gp(v.gpTotal); }
      case 'modifiers': return en.modifiers.length + ' modifiers • ' + Object.keys(en.locks).filter((x) => en.locks[x]).length + ' locks';
      case 'powers': return en.powers.length + ' sub-abilities';
      case 'effects': return en.effects.length + ' blocks';
      case 'delivery': return en.delivery.action + (damageText(en.delivery.damage) ? ' • ' + damageText(en.delivery.damage) : '');
      case 'lifecycle': return useText(en.lifecycle.use) + ' • ' + durationText(en.lifecycle);
      case 'defenses': return (en.defenses.dr.length + en.defenses.energy.length + (en.defenses.srOn ? 1 : 0)) + ' entries';
      case 'progression': return en.progression.maxLevel + ' levels';
      case 'grants': return en.grants.domains.length + ' domains';
      default: return '';
    }
  }
  function renderFacets() {
    const en = S.entry;
    if (S.ui.viewMode === 'scratch') { $('#fs-facets').innerHTML = renderScratch(); return; }
    const active = FACETS.filter((f) => en.facets.indexOf(f.key) >= 0);
    let h = datalists() + active.map((f) => {
      const open = S.ui.facetOpen[f.key] !== false;
      return '<div class="fs-glass fs-facet' + (open ? ' open' : '') + '"><div class="fs-facet-head" data-action="toggle-facet" data-k="' + f.key + '"><span class="fs-chev">▶</span><span class="fs-facet-num">' + f.n + '</span><span>' + f.icon + '</span><span class="fs-facet-title">' + esc(f.title) + '</span>' +
        '<span class="fs-facet-meta">' + esc(facetMeta(en, f.key)) + (f.key !== 'identity' ? '<span class="fs-btn fs-xs fs-ghost" data-action="detach-facet" data-k="' + f.key + '" title="Detach section">✕</span>' : '') + '</span></div>' +
        '<div class="fs-facet-body">' + FACET_RENDER[f.key](en) + '</div></div>';
    }).join('');
    const inactive = FACETS.filter((f) => en.facets.indexOf(f.key) < 0);
    h += '<div class="fs-attach">' + btn('toggle-attach', '+ Attach Another Section', 'fs-dashed') +
      (S.ui.attachOpen ? inactive.map((f) => btn('attach-facet', f.icon + ' ' + esc(f.title), 'fs-xs', { k: f.key })).join('') || '<span class="fs-hint">All sections attached.</span>' : '<span class="fs-hint">Compose any section onto any item, feat, spell or class.</span>') + '</div>';
    $('#fs-facets').innerHTML = h;
  }
  function renderJson() {
    const open = S.ui.jsonOpen;
    $('#fs-json-wrap').className = 'fs-glass fs-facet' + (open ? ' open' : '');
    $('#fs-json-wrap').innerHTML = '<div class="fs-facet-head" data-action="toggle-json"><span class="fs-chev">▶</span><span>📜</span><span class="fs-facet-title">Canonical V2.5 JSON Output Inspector</span><span class="fs-facet-meta">' + (open ? btn('copy-json', 'Copy JSON', 'fs-xs') : 'click to expand') + '</span></div>' +
      '<div class="fs-facet-body"><pre class="fs-json" id="fs-json-pre">' + (open ? esc(JSON.stringify(exportEntry(S.entry), null, 2)) : '') + '</pre></div>';
  }


  // --------------------------------------------------------------------------
  // 14b. Effect blocks — shared controls for Scratch Lego + Classic views
  // --------------------------------------------------------------------------
  const DEF_MODES = ['Immunity', 'Condition Immunity', 'DR', 'Energy Resistance', 'Spell Resistance', 'Sense', 'Vulnerability'];
  const DEF_LIST = ['Fear', 'Poison', 'Sleep', 'Paralysis', 'Disease', 'Mind-Affecting', 'Death Effects', 'Low-Light Vision', 'Darkvision 60 ft.', 'Blindsense 30 ft.', 'Tremorsense 30 ft.', 'Uncanny Dodge', 'evil or good', 'magic', 'Fire', 'Cold', 'Acid', 'Electricity', 'Sonic'];
  function targetChips(list, p) {
    return list.map((t, i) => '<span class="fs-pill indigo">' + esc(TARGET_LABEL[t] || t) + '<span class="fs-x" data-action="remove-target" data-p="' + p + '" data-i="' + i + '">×</span></span>').join('') +
      '<select class="fs-sel fs-narrow" data-push="' + p + '"><option value="">+ Target</option>' + TARGET_GROUPS.map((g) => '<optgroup label="' + esc(g[0]) + '">' + opts(g[1], '') + '</optgroup>').join('') + '</select>';
  }
  function blockControls(b, p) {
    switch (b.type) {
      case 'bonus': return targetChips(b.targets, p + '.targets') + inp(p + '.value', b.value, { num: true, style: 'width:56px' }) + sel(p + '.btype', b.btype, bonusTypeOpts().map((o) => [o[0], o[0]]), { narrow: true }) +
        sel(p + '.scaling', b.scaling, [['flat', 'Flat'], ['perCL', 'Per X CL']], { narrow: true }) +
        (b.scaling === 'perCL' ? '<span class="lego-lbl">every</span>' + sel(p + '.per', b.per, range(1, 10).map((n) => [n, n + ' CL']), { narrow: true, num: true }) + '<span class="lego-lbl">min</span>' + inp(p + '.min', b.min, { num: true, style: 'width:50px' }) + '<span class="lego-lbl">max</span>' + inp(p + '.max', b.max, { num: true, style: 'width:50px' }) : '') +
        inp(p + '.condition', b.condition, { ph: 'condition (vs Fear)', style: 'width:140px' });
      case 'damage': return sel(p + '.kind', b.kind, ['Damage', 'Healing', 'Temp HP'], { narrow: true }) + inp(p + '.dice', b.dice, { list: 'fs-dice-list', ph: '1d8 / 20', style: 'width:76px' }) +
        (b.kind === 'Damage' ? sel(p + '.dmgType', b.dmgType, DAMAGE_TYPES.slice(0, 16), { narrow: true }) : '') + chk(p + '.perOn', b.perOn, '+ per CL') +
        (b.perOn ? inp(p + '.amount', b.amount, { num: true, style: 'width:50px' }) + '<span class="lego-lbl">per</span>' + sel(p + '.per', b.per, range(1, 10).map((n) => [n, n + ' CL']), { narrow: true, num: true }) + '<span class="lego-lbl">max +</span>' + inp(p + '.max', b.max, { num: true, style: 'width:50px' }) : '') +
        (b.kind === 'Damage' ? inp(p + '.save', b.save, { ph: 'save (Reflex half)', style: 'width:130px' }) : '');
      case 'defense': return sel(p + '.mode', b.mode, DEF_MODES, { narrow: true }) + (['DR', 'Energy Resistance', 'Spell Resistance'].indexOf(b.mode) >= 0 ? inp(p + '.value', b.value, { num: true, style: 'width:56px' }) : '') +
        (b.mode === 'Spell Resistance' ? '' : inp(p + '.what', b.what, { list: 'fs-defense-list', style: 'width:150px', ph: 'Fear / evil or good / Low-Light Vision' }));
      case 'size': return sel(p + '.steps', b.steps, [[-2, SIZE_STEPS['-2']], [-1, SIZE_STEPS['-1']], [1, SIZE_STEPS['1']], [2, SIZE_STEPS['2']]], { narrow: true, num: true });
      case 'metamagic': return sel(p + '.costMode', b.costMode, META_COST_MODES, { narrow: true }) +
        (b.costMode === 'slot' ? sel(p + '.slotAdj', b.slotAdj, range(0, 6).map((n) => [n, '+' + n + ' Slot']), { narrow: true, num: true }) : '') +
        (b.costMode === 'rod' ? inp(p + '.uses', b.uses, { num: true, style: 'width:48px' }) + '<span class="lego-lbl">/day • Max</span>' + sel(p + '.maxSpellLvl', b.maxSpellLvl, [[3, 'Lvl 3 (Lesser)'], [6, 'Lvl 6 (Normal)'], [9, 'Lvl 9 (Greater)']], { narrow: true, num: true }) : '') +
        (b.costMode === 'sudden' ? inp(p + '.uses', b.uses, { num: true, style: 'width:48px' }) + '<span class="lego-lbl">/day</span>' : '') +
        (b.costMode === 'pool' ? inp(p + '.poolCost', b.poolCost, { num: true, style: 'width:48px' }) + '<input class="fs-in" style="width:130px" data-bind="' + p + '.pool" list="fs-pool-list" value="' + esc(b.pool) + '"><datalist id="fs-pool-list">' + opts(['Turn Undead', 'Rebuke Undead', 'Ki', 'Bardic Music', 'Wild Shape', 'Psionic Power Points', 'Custom Pool'], '') + '</datalist>' : '') +
        '<span class="lego-lbl">→</span>' + sel(p + '.transform', b.transform, META_TRANSFORMS, { narrow: true }) +
        (b.transform === 'heighten' ? '<span class="lego-lbl">DC +</span>' + inp(p + '.dcBonus', b.dcBonus, { num: true, style: 'width:48px' }) : '') +
        ((b.transform === 'energySub' || b.transform === 'pierceRes') ? sel(p + '.energy', b.energy, ['Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Any'], { narrow: true }) : '') +
        (b.transform === 'rider' ? inp(p + '.rider', b.rider, { ph: '+1 Negative Level (Fell Drain)', style: 'width:185px' }) : '') +
        inp(p + '.appliesTo', b.appliesTo, { ph: 'scope ([Fire] / ray / all)', style: 'width:145px' });
      case 'rule': return inp(p + '.text', b.text, { ph: 'Rule effect text…', style: 'flex:1;min-width:220px' });
      case 'synergy': return inp(p + '.cond', b.cond, { ph: 'If 2+ active #Primal effects', style: 'width:230px' });
      case 'table': return '<span class="lego-lbl">Roll</span>' + inp(p + '.die', b.die, { list: 'fs-dice-list', style: 'width:66px' });
      default: return '';
    }
  }
  function canUseBlock(t) { return !BLOCK_TYPES[t].metaOnly || ['feat', 'wondrous', 'class'].indexOf(S.entry.blueprint) >= 0; }
  function blockPalette(listPath, containers, compact) {
    const types = Object.keys(BLOCK_TYPES).filter((t) => (containers || !BLOCK_TYPES[t].container) && (!compact ? canUseBlock(t) : !BLOCK_TYPES[t].metaOnly));
    return '<div class="lego-palette' + (compact ? ' compact' : '') + '">' + (compact ? '' : '<span class="lego-lbl">+ Snap Block:</span>') + types.map((t) => '<button type="button" class="lego-add ' + BLOCK_TYPES[t].color + '" data-action="add-block" data-p="' + listPath + '" data-t="' + t + '">+ ' + BLOCK_TYPES[t].icon + ' ' + esc(BLOCK_TYPES[t].label) + '</button>').join('') + '</div>';
  }
  const delBtn = (action, data) => '<button type="button" class="lego-del" data-action="' + action + '"' + Object.keys(data).map((k) => ' data-' + k + '="' + esc(data[k]) + '"').join('') + ' title="Remove">✕</button>';
  function scratchBlocks(list, listPath) {
    return list.map((b, i) => {
      const p = listPath + '.' + i, T = BLOCK_TYPES[b.type];
      const head = '<span class="lego-lbl">' + T.icon + ' ' + esc(T.label) + ':</span>' + blockControls(b, p) + delBtn('remove-block', { p: listPath, i: i });
      if (!T.container) return '<div class="lego-block lego-tab ' + T.color + '">' + head + '</div>';
      let inner = '';
      if (T.container === 'kids') inner = scratchBlocks(b.kids, p + '.kids') + blockPalette(p + '.kids', false, true);
      if (T.container === 'branches') inner = b.branches.map((br, bi) => cBlock('c-sub', '<span class="lego-lbl">If</span>' + inp(p + '.branches.' + bi + '.cond', br.cond, { style: 'width:120px' }) + delBtn('remove-branch', { p: p + '.branches', i: bi }),
        scratchBlocks(br.kids, p + '.branches.' + bi + '.kids') + blockPalette(p + '.branches.' + bi + '.kids', false, true))).join('') + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-branch" data-p="' + p + '.branches">+ CL Tier Branch</button>';
      if (T.container === 'rows') inner = b.rows.map((r, ri) => cBlock('c-sub', '<span class="lego-lbl">On</span>' + inp(p + '.rows.' + ri + '.roll', r.roll, { style: 'width:52px' }) + delBtn('remove-row', { p: p + '.rows', i: ri }),
        scratchBlocks(r.kids, p + '.rows.' + ri + '.kids') + blockPalette(p + '.rows.' + ri + '.kids', false, true))).join('') + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-row" data-p="' + p + '.rows">+ Table Row</button>';
      return cBlock(T.color, head, inner);
    }).join('');
  }
  function cBlock(color, head, inner) { return '<div class="lego-c ' + color + '"><div class="c-top">' + head + '</div><div class="c-mouth"><div class="c-spine"></div><div class="c-inner">' + inner + '</div></div><div class="c-bot lego-tab"></div></div>'; }
  function classicBlocks(list, listPath) {
    return list.map((b, i) => {
      const p = listPath + '.' + i, T = BLOCK_TYPES[b.type];
      let inner = '<div class="fs-row">' + blockControls(b, p) + btn('remove-block', 'Delete', 'fs-xs fs-rose', { p: listPath, i: i }) + '</div>';
      if (T.container === 'kids') inner += '<div class="fs-nest">' + classicBlocks(b.kids, p + '.kids') + blockPalette(p + '.kids', false, true) + '</div>';
      if (T.container === 'branches') inner += b.branches.map((br, bi) => '<div class="fs-nest"><div class="fs-row"><span class="fs-label-mini">If</span>' + inp(p + '.branches.' + bi + '.cond', br.cond, { style: 'width:140px' }) + btn('remove-branch', '×', 'fs-xs fs-ghost', { p: p + '.branches', i: bi }) + '</div>' + classicBlocks(br.kids, p + '.branches.' + bi + '.kids') + blockPalette(p + '.branches.' + bi + '.kids', false, true) + '</div>').join('') + btn('add-branch', '+ CL Tier Branch', 'fs-xs fs-dashed', { p: p + '.branches' });
      if (T.container === 'rows') inner += b.rows.map((r, ri) => '<div class="fs-nest"><div class="fs-row"><span class="fs-label-mini">On roll</span>' + inp(p + '.rows.' + ri + '.roll', r.roll, { style: 'width:60px' }) + btn('remove-row', '×', 'fs-xs fs-ghost', { p: p + '.rows', i: ri }) + '</div>' + classicBlocks(r.kids, p + '.rows.' + ri + '.kids') + blockPalette(p + '.rows.' + ri + '.kids', false, true) + '</div>').join('') + btn('add-row', '+ Table Row', 'fs-xs fs-dashed', { p: p + '.rows' });
      return card('blk:' + b.id, T.icon + ' <b>' + esc(T.label) + ':</b> ' + esc(blockText(b)), inner);
    }).join('');
  }
  function facetEffects(en) {
    return (en.effects.length ? classicBlocks(en.effects, 'effects') : '<div class="fs-hint">No effect blocks yet. Snap Bonus, Damage / Temp HP, Defense, Size, CL Tier, Synergy or Roll Table blocks.</div>') + blockPalette('effects', true);
  }

  // --------------------------------------------------------------------------
  // 14c. Scratch Lego view — 9 fill-in-the-blank category templates
  // --------------------------------------------------------------------------
  const L = (t) => '<span class="lego-lbl">' + t + '</span>';
  const hat = (color, inner) => '<div class="lego-hat lego-tab ' + color + '">' + inner + '</div>';
  const stack = (color, inner) => '<div class="lego-block lego-tab ' + color + '">' + inner + '</div>';
  function tagSockets(en) { return L('Tags') + en.tags.map((t, i) => '<span class="fs-pill purple">' + esc(t) + '<span class="fs-x" data-action="remove-tag" data-i="' + i + '">×</span></span>').join('') + spotHtml('tag', 'identity', { style: 'width:200px', ph: '🔍 + #Tag' }); }
  function modStacks(en) {
    return en.modifiers.map((m, i) => stack('b-blue', L('📊 Bonus:') + selGroups('modifiers.' + i + '.target', m.target, TARGET_GROUPS) + inp('modifiers.' + i + '.value', m.value, { num: true, style: 'width:56px' }) +
      sel('modifiers.' + i + '.type', m.type, bonusTypeOpts().map((o) => [o[0], o[0]]), { narrow: true }) + inp('modifiers.' + i + '.condition', m.condition, { ph: 'condition', style: 'width:120px' }) + delBtn('remove-mod', { p: 'modifiers', i: i }))).join('');
  }
  function prereqCBlock(en, title) {
    const rows = en.prereqs.map((r, ri) => cBlock('c-sub', '<span class="lego-lbl">' + (ri ? 'AND' : 'Require') + '</span>' + delBtn('remove-prereq', { ri: ri }),
      r.alts.map((a, ai) => stack('b-slate', altEditor(ri, ai, a))).join('') + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-or" data-ri="' + ri + '">+Or</button>')).join('');
    return cBlock('c-amber', L('🦖 ' + title) + '<span class="fs-hint" style="color:#fde68a">' + esc(prereqText(en.prereqs) || 'none — open to all') + '</span>', rows + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-prereq">+ Add Prerequisite (AND)</button>');
  }
  function enchCBlock(en) {
    const ch = en.chassis, v = chassisView(ch), cr = v.crystal;
    const enchs = v.enchs.map((e) => stack('b-green', L('✨ ' + esc(e.name)) + '<span class="fs-pill dim">' + (e.plus ? '+' + e.plus + ' bonus' : gp(e.gp)) + '</span><span class="lego-desc">' + esc(short(e.desc, 80)) + '</span>' + delBtn('remove-ench', { id: e.id }))).join('');
    const crystal = cr ? stack('b-purple', L('💎 ' + esc(cr.c.name)) + sel('chassis.crystal.tier', cr.tier, CRYSTAL_TIERS.map((t, i) => [t, cap1(t) + (cr.c.cost[i] == null ? ' — n/a' : ' — ' + gp(cr.c.cost[i]))]), { narrow: true }) + '<span class="lego-desc">' + esc(short(cr.text, 70)) + '</span>' + delBtn('remove-crystal', {})) : stack('b-purple', L('💎 Crystal') + spotHtml('crystal', 'chassis', { style: 'width:260px' }));
    return cBlock('c-amber', L('🦖 Enchantments & Crystal') + '<span class="fs-pill ' + (v.effective > 10 ? 'rose' : 'emerald') + '">' + sgn(v.effective) + ' / +10</span><span class="fs-pill amber">💰 ' + gp(v.gpTotal) + '</span>',
      enchs + stack('b-green', L('✨ Enchantment') + spotHtml('ench', 'chassis', { style: 'width:300px' })) + crystal + v.warnings.map((w) => '<div class="fs-warn" style="font-size:12px">⚠️ ' + esc(w) + '</div>').join(''));
  }
  function powerCBlock(pw, i) {
    const p = 'powers.' + i;
    const head = L('⚡ Sub-Power:') + (pw.kind === 'inline' ? inp(p + '.name', pw.name, { style: 'width:160px' }) : '<span class="fs-pill purple">🔮 ' + esc(pw.ref ? pw.ref.name : pw.name) + '</span>') + usageEditor(p + '.use', pw.use) + sel(p + '.action', pw.action, ACTIONS, { narrow: true }) + L('CL') + inp(p + '.cl', pw.cl, { num: true, style: 'width:50px' }) +
      btn('move-power', '↑', 'fs-xs fs-ghost', { i: i, d: -1 }) + delBtn('remove-power', { i: i });
    let kids = '';
    if (pw.kind === 'attached') kids += stack('b-purple', L('🔮 Cast Spell:') + '<span class="fs-pill purple">' + esc(pw.ref ? pw.ref.name + ' (' + (pw.ref.levelText || 'Lvl ' + pw.ref.level) + ')' : pw.name) + '</span>' + sel(p + '.grantMode', pw.grantMode, [['cast', 'Cast from Item / SLA'], ['known', 'Add to Spells Known'], ['slot', 'Expend Own Slot (Runestaff)']], { narrow: true }));
    pw.modifiers.forEach((m, mi) => { kids += stack('b-blue', L('📊 Bonus:') + selGroups(p + '.modifiers.' + mi + '.target', m.target, TARGET_GROUPS) + inp(p + '.modifiers.' + mi + '.value', m.value, { num: true, style: 'width:56px' }) + sel(p + '.modifiers.' + mi + '.type', m.type, bonusTypeOpts().map((o) => [o[0], o[0]]), { narrow: true }) + delBtn('remove-mod', { p: p + '.modifiers', i: mi })); });
    if (pw.damage.on) kids += stack('b-red', L('💥 Damage:') + inp(p + '.damage.count', pw.damage.count, { num: true, style: 'width:50px' }) + inp(p + '.damage.die', pw.damage.die, { list: 'fs-dice-list', style: 'width:66px' }) + sel(p + '.damage.type', pw.damage.type, DAMAGE_TYPES, { narrow: true }) +
      sel(p + '.damage.scaling', pw.damage.scaling, [['flat', 'Flat'], ['perCL', 'Per X CL']], { narrow: true }) + (pw.damage.scaling === 'perCL' ? L('every') + sel(p + '.damage.per', pw.damage.per, range(1, 10).map((n) => [n, n + ' CL']), { narrow: true, num: true }) + L('max') + sel(p + '.damage.max', pw.damage.max, range(1, 30), { narrow: true, num: true }) : '') + '<span class="lego-desc">' + live('pw-dmg', i) + '</span>' + delBtn('toggle-flag', { p: p + '.damage.on' }));
    if (pw.attackOn) kids += stack('b-red', L('🎯 Attack & Save:') + sel(p + '.attack', pw.attack, Object.keys(ATTACK_LABEL).map((k) => [k, ATTACK_LABEL[k]]), { narrow: true }) + inp(p + '.range', pw.range, { list: 'fs-range-list', ph: 'Range', style: 'width:110px' }) +
      sel(p + '.save.type', pw.save.type, ['None', 'Fortitude', 'Reflex', 'Will'], { narrow: true }) + (pw.save.type !== 'None' ? sel(p + '.save.effect', pw.save.effect, ['Negates', 'Half', 'Partial', 'Negates (harmless)'], { narrow: true }) + L('DC') + inp(p + '.dc', pw.dc, { num: true, style: 'width:50px' }) : '') + delBtn('toggle-flag', { p: p + '.attackOn' }));
    if (pw.ruleOn || pw.text) kids += stack('b-slate', L('📜 Rule Effect:') + inp(p + '.text', pw.text, { ph: 'What happens…', style: 'flex:1;min-width:240px' }));
    kids += '<div class="lego-palette compact">' + '<button type="button" class="lego-add b-blue" data-action="add-mod" data-p="' + p + '.modifiers">+ 📊 Bonus</button>' + (pw.damage.on ? '' : '<button type="button" class="lego-add b-red" data-action="toggle-flag" data-p="' + p + '.damage.on">+ 💥 Damage</button>') +
      (pw.attackOn ? '' : '<button type="button" class="lego-add b-red" data-action="toggle-flag" data-p="' + p + '.attackOn">+ 🎯 Attack & Save</button>') + (pw.ruleOn || pw.text ? '' : '<button type="button" class="lego-add b-slate" data-action="toggle-flag" data-p="' + p + '.ruleOn">+ 📜 Rule Effect</button>') + '</div>';
    return cBlock('c-amber', head, kids);
  }
  function effectsArea(en, containers) {
    return scratchBlocks(en.effects, 'effects') + blockPalette('effects', containers);
  }
  function scratchWeaponArmor(en) {
    const ch = en.chassis, v = chassisView(ch), isW = ch.kind === 'weapon';
    let h = hat('h-amber', L(isW ? '⚔️ Weapon' : '🛡️ Armor / Shield') + inp('name', en.name, { ph: v.name, style: 'width:230px' }) + L('Base') + spotHtml('base', 'chassis', { style: 'width:210px', ph: '🔍 ' + baseName(v.base) }) +
      L('Material') + sel('chassis.material', ch.material, MATERIALS.map((m) => [m.id, m.name]), { narrow: true }) + L('Enh') + sel('chassis.enhancement', ch.enhancement, range(0, 5).map((n) => [n, sgn(n)]), { narrow: true, num: true }) + '<div class="lego-row">' + tagSockets(en) + '</div>');
    if (isW) {
      const w = ch.weapon;
      h += stack('b-blue', L('🧩 Weapon Chassis:') + L('Damage') + inp('chassis.weapon.dice', w.dice, { list: 'fs-dice-list', style: 'width:70px' }) + sel('chassis.weapon.dmgType', w.dmgType, DAMAGE_TYPES.slice(0, 3), { narrow: true }) +
        L('Crit') + sel('chassis.weapon.critRange', w.critRange, [[20, '20'], [19, '19–20'], [18, '18–20'], [17, '17–20'], [15, '15–20']], { narrow: true, num: true }) + '<span>/</span>' + sel('chassis.weapon.critMult', w.critMult, [[2, '×2'], [3, '×3'], [4, '×4']], { narrow: true, num: true }) +
        sel('chassis.weapon.handed', w.handed, ['Light', 'One-Handed', 'Two-Handed'], { narrow: true }) + L('Range') + inp('chassis.weapon.range', w.range, { num: true, style: 'width:56px' }) + '<span class="fs-pill sky">' + esc(v.critText) + (v.keen ? ' (Keen)' : '') + '</span>');
    } else {
      const a = ch.armor;
      h += stack('b-blue', L('🧩 Armor Stats:') + L('AC') + inp('chassis.armor.armorBonus', a.armorBonus, { num: true, style: 'width:50px' }) + L('Max Dex') + inp('chassis.armor.maxDex', a.maxDex, { num: true, style: 'width:50px' }) + L('ACP') + inp('chassis.armor.acp', a.acp, { num: true, style: 'width:50px' }) +
        L('ASF %') + inp('chassis.armor.asf', a.asf, { num: true, style: 'width:50px' }) + '<span class="lego-desc">After material: Max Dex ' + (v.armor.maxDex >= 99 ? '—' : sgn(v.armor.maxDex)) + ' • ACP ' + v.armor.acp + ' • ASF ' + v.armor.asf + '% • ' + v.armor.type + '</span>');
    }
    h += enchCBlock(en);
    if (isW) h += (ch.damageParts || []).map((p, i) => stack('b-red', L('🩸 Extra Damage:') + inp('chassis.damageParts.' + i + '.count', p.count, { num: true, style: 'width:50px' }) + sel('chassis.damageParts.' + i + '.die', p.die, [['d4', 'd4'], ['d6', 'd6'], ['d8', 'd8'], ['d10', 'd10'], ['d12', 'd12'], ['flat', 'Flat']], { narrow: true }) +
      sel('chassis.damageParts.' + i + '.type', p.type, DAMAGE_TYPES, { narrow: true }) + sel('chassis.damageParts.' + i + '.crit', p.crit, [['normal', 'Normal'], ['multiply', '×Crit'], ['onCritOnly', 'On Crit Only']], { narrow: true }) + inp('chassis.damageParts.' + i + '.cond', p.cond || '', { ph: 'vs Undead', style: 'width:120px' }) + delBtn('remove-dmg', { i: i }))).join('');
    return h + modStacks(en) + effectsArea(en, false);
  }
  function scratchWondrous(en) {
    const kinds = ['Wondrous Item', 'Ring', 'Rod', 'Staff', 'Wand', 'Potion / Oil', 'Scroll', 'Artifact / Relic'];
    let h = hat('h-amber', L('💎 Item') + inp('name', en.name, { ph: 'Item name', style: 'width:220px' }) + L('Kind') + sel('item.subtype', en.item.subtype, kinds, { narrow: true }) + L('Slot') + sel('item.slot', en.item.slot, BODY_SLOTS, { narrow: true }) +
      L('Price') + inp('item.price', en.item.price, { num: true, style: 'width:90px' }) + L('gp • CL') + inp('item.cl', en.item.cl, { num: true, style: 'width:50px' }) + '<div class="lego-row">' + tagSockets(en) + '</div>');
    h += modStacks(en) + scratchBlocks(en.effects, 'effects') + en.powers.map(powerCBlock).join('');
    h += '<div class="lego-palette"><span class="lego-lbl">+ Snap Block:</span><button type="button" class="lego-add b-blue" data-action="add-mod" data-p="modifiers">+ 📊 Bonus</button><button type="button" class="lego-add c-amber" data-action="add-power-inline">+ ⚡ Activated Sub-Power (C-Block)</button>' +
      Object.keys(BLOCK_TYPES).filter((t) => t !== 'bonus' && !BLOCK_TYPES[t].container).map((t) => '<button type="button" class="lego-add ' + BLOCK_TYPES[t].color + '" data-action="add-block" data-p="effects" data-t="' + t + '">+ ' + BLOCK_TYPES[t].icon + ' ' + esc(BLOCK_TYPES[t].label) + '</button>').join('') +
      '<div style="width:280px">' + spotHtml('power', 'powers', { ph: '🔍 + Attach Existing Spell (Sub-Power)' }) + '</div></div>';
    return h;
  }
  function scratchSpell(en) {
    const sp = en.spell, d = en.delivery, l = en.lifecycle;
    let h = hat('h-violet', L('🔮 Spell') + inp('name', en.name, { ph: 'Spell name', style: 'width:200px' }) + L('Class/Lvl') + sp.classes.map((c, i) => '<span class="fs-pill indigo" style="padding:2px 4px"><input class="fs-in" style="width:70px" data-bind="spell.classes.' + i + '.cls" list="fs-spellcls-list" value="' + esc(c.cls) + '">' + sel('spell.classes.' + i + '.lvl', c.lvl, range(0, 9), { num: true, style: 'width:52px' }) + '<span class="fs-x" data-action="remove-spellcls" data-i="' + i + '">×</span></span>').join('') +
      '<datalist id="fs-spellcls-list">' + opts(SPELL_CLASSES, '') + '</datalist><button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-spellcls">+</button>' + L('School') + sel('spell.school', sp.school, SCHOOLS, { narrow: true }) +
      '<div class="lego-row">' + L('Descriptors') + sp.descriptors.map((x, i) => '<span class="fs-pill rose">[' + esc(x) + ']<span class="fs-x" data-action="remove-descriptor" data-i="' + i + '">×</span></span>').join('') + spotHtml('descriptor', 'spell', { style: 'width:190px', ph: '🔍 + Fire, Fear…' }) +
      L('Components') + ['V', 'S', 'M', 'F', 'DF', 'XP'].map((k) => '<button type="button" class="lego-pill' + (sp.comps[k] ? ' on' : '') + '" data-action="toggle-comp" data-k="' + k + '">' + k + '</button>').join('') + '</div><div class="lego-row">' + tagSockets(en) + '</div>');
    h += stack('b-teal', L('🧩 Casting Envelope:') + L('Cast Time') + sel('delivery.action', d.action, ACTIONS, { narrow: true }) + L('Range') + inp('delivery.range', d.range, { list: 'fs-range-list', style: 'width:170px' }) + L('Target/Area') + inp('delivery.area', d.area, { list: 'fs-area-list', style: 'width:150px' }) +
      L('Duration') + sel('lifecycle.duration', l.duration, DURATIONS, { narrow: true }) + (['rounds', 'roundsPerLevel', 'minPerLevel', 'hourPerLevel'].indexOf(l.duration) >= 0 ? inp('lifecycle.durValue', l.durValue, { num: true, style: 'width:46px' }) : '') + (l.duration === 'text' ? inp('lifecycle.durText', l.durText, { style: 'width:110px' }) : '') + chk('lifecycle.dismissible', l.dismissible, '(D)') +
      L('Save') + sel('delivery.save.type', d.save.type, [['None', 'None'], 'Fortitude', 'Reflex', 'Will'], { narrow: true }) + (d.save.type !== 'None' ? sel('delivery.save.effect', d.save.effect, ['Negates', 'Half', 'Partial', 'Negates (harmless)', 'Disbelief'], { narrow: true }) : '') + L('SR') + sel('delivery.sr', d.sr, ['Yes', 'No', 'Yes (harmless)', 'Yes (object)', 'See text'], { narrow: true }) +
      L('Usage') + usageEditor('lifecycle.use', l.use));
    if (d.damage.on) h += stack('b-red', L('💥 Spell Damage:') + inp('delivery.damage.count', d.damage.count, { num: true, style: 'width:50px' }) + inp('delivery.damage.die', d.damage.die, { list: 'fs-dice-list', style: 'width:66px' }) + sel('delivery.damage.type', d.damage.type, DAMAGE_TYPES, { narrow: true }) +
      sel('delivery.damage.scaling', d.damage.scaling, [['flat', 'Flat'], ['perCL', 'Per X CL']], { narrow: true }) + (d.damage.scaling === 'perCL' ? L('every') + sel('delivery.damage.per', d.damage.per, range(1, 10).map((n) => [n, n + ' CL']), { narrow: true, num: true }) + L('from') + sel('delivery.damage.start', d.damage.start, range(1, 20).map((n) => [n, 'CL ' + n]), { narrow: true, num: true }) + L('max') + sel('delivery.damage.max', d.damage.max, range(1, 30), { narrow: true, num: true }) : '') +
      '<span class="lego-desc">' + live('dmg-main') + '</span>' + delBtn('toggle-flag', { p: 'delivery.damage.on' }));
    if (d.attackOn) h += stack('b-red', L('🎯 Attack Roll:') + sel('delivery.attack', d.attack, Object.keys(ATTACK_LABEL).map((k) => [k, ATTACK_LABEL[k]]), { narrow: true }) + delBtn('toggle-flag', { p: 'delivery.attackOn' }));
    h += scratchBlocks(en.effects, 'effects');
    h += '<div class="lego-palette"><span class="lego-lbl">+ Snap Effect Block:</span>' + (d.damage.on ? '' : '<button type="button" class="lego-add b-red" data-action="toggle-flag" data-p="delivery.damage.on">+ 💥 Scaling Spell Damage</button>') + (d.attackOn ? '' : '<button type="button" class="lego-add b-red" data-action="toggle-flag" data-p="delivery.attackOn">+ 🎯 Attack Roll</button>') +
      Object.keys(BLOCK_TYPES).filter(canUseBlock).map((t) => '<button type="button" class="lego-add ' + BLOCK_TYPES[t].color + '" data-action="add-block" data-p="effects" data-t="' + t + '">+ ' + BLOCK_TYPES[t].icon + ' ' + esc(BLOCK_TYPES[t].label) + '</button>').join('') + '</div>';
    return h;
  }
  function scratchFeat(en) {
    return hat('h-emerald', L('📜 Feat') + inp('name', en.name, { ph: 'Feat name', style: 'width:220px' }) + L('Repeatable') + sel('repeat.mode', en.repeat.mode, [['once', '1x Only'], ['upto', 'Up to N times'], ['per', 'Per Weapon / School']], { narrow: true }) + (en.repeat.mode === 'upto' ? sel('repeat.n', en.repeat.n, range(2, 20), { narrow: true, num: true }) : '') + '<div class="lego-row">' + tagSockets(en) + '</div>') +
      prereqCBlock(en, 'Prerequisites') + modStacks(en) + scratchBlocks(en.effects, 'effects') + en.powers.map(powerCBlock).join('') +
      '<div class="lego-palette"><span class="lego-lbl">+ Snap Block:</span><button type="button" class="lego-add b-blue" data-action="add-mod" data-p="modifiers">+ 📊 Benefit Bonus</button><button type="button" class="lego-add c-amber" data-action="add-power-inline">+ ⚡ Granted Power (C-Block)</button>' +
      Object.keys(BLOCK_TYPES).filter((t) => t !== 'bonus' && canUseBlock(t)).map((t) => '<button type="button" class="lego-add ' + BLOCK_TYPES[t].color + '" data-action="add-block" data-p="effects" data-t="' + t + '">+ ' + BLOCK_TYPES[t].icon + ' ' + esc(BLOCK_TYPES[t].label) + '</button>').join('') + '<div style="width:260px">' + spotHtml('power', 'powers', { ph: '🔍 + Granted Spell' }) + '</div></div>';
  }
  function scratchBuff(en) {
    const l = en.lifecycle;
    return hat('h-rose', L('✨') + sel('buffKind', en.buffKind, ['Buff', 'Condition', 'Curse'], { narrow: true }) + inp('name', en.name, { ph: 'Name', style: 'width:210px' }) + L('Duration') + sel('lifecycle.duration', l.duration, DURATIONS, { narrow: true }) +
      (['rounds', 'roundsPerLevel', 'minPerLevel', 'hourPerLevel'].indexOf(l.duration) >= 0 ? inp('lifecycle.durValue', l.durValue, { num: true, style: 'width:46px' }) : '') + chk('lifecycle.stackable', l.stackable, 'Stackable ×N') + (l.stackable ? sel('lifecycle.maxStacks', l.maxStacks, range(1, 20), { narrow: true, num: true }) : '') + '<div class="lego-row">' + tagSockets(en) + '</div>') +
      modStacks(en) + stack('b-slate', L('🩸 State Locks:') + Object.keys(LOCK_LABEL).map((k) => chk('locks.' + k, en.locks[k], esc(LOCK_LABEL[k].split(' (')[0]))).join('')) + scratchBlocks(en.effects, 'effects') +
      '<div class="lego-palette"><span class="lego-lbl">+ Snap Block:</span><button type="button" class="lego-add b-blue" data-action="add-mod" data-p="modifiers">+ 📊 Bonus / Penalty</button>' + Object.keys(BLOCK_TYPES).filter((t) => t !== 'bonus' && canUseBlock(t)).map((t) => '<button type="button" class="lego-add ' + BLOCK_TYPES[t].color + '" data-action="add-block" data-p="effects" data-t="' + t + '">+ ' + BLOCK_TYPES[t].icon + ' ' + esc(BLOCK_TYPES[t].label) + '</button>').join('') + '</div>';
  }
  const SKILL_PACKAGES = { Martial: ['Climb', 'Intimidate', 'Jump', 'Ride', 'Swim'], Arcane: ['Concentration', 'Craft', 'Decipher Script', 'Knowledge', 'Spellcraft'], Divine: ['Concentration', 'Diplomacy', 'Heal', 'Knowledge', 'Spellcraft'], Skirmisher: ['Balance', 'Hide', 'Listen', 'Move Silently', 'Spot', 'Tumble'] };
  function scratchClass(en) {
    const p = en.progression;
    let h = hat('h-emerald', L('💎') + sel('progression.mode', p.mode, [['base', 'Base Class (1–20)'], ['prestige', 'Prestige Class (1–10)']], { narrow: true }) + inp('name', en.name, { ph: 'Class name', style: 'width:180px' }) + L('HD') + sel('progression.hitDie', p.hitDie, [4, 6, 8, 10, 12].map((n) => [n, 'd' + n]), { narrow: true, num: true }) +
      L('BAB') + sel('progression.bab', p.bab, [['full', 'Full 1/1'], ['3/4', 'Med 3/4'], ['1/2', 'Poor 1/2']], { narrow: true }) + L('Good Saves') + ['fort', 'ref', 'will'].map((s) => '<button type="button" class="lego-pill' + (p.good[s] ? ' on' : '') + '" data-action="toggle-flag" data-p="progression.good.' + s + '">' + { fort: 'Fort', ref: 'Ref', will: 'Will' }[s] + '</button>').join('') +
      L('Skill Pts') + sel('progression.skillPts', p.skillPts, [2, 4, 6, 8].map((n) => [n, n + ' + Int']), { narrow: true, num: true }) + '<div class="lego-row">' + tagSockets(en) + '</div>');
    h += prereqCBlock(en, 'Entry Prerequisites');
    h += stack('b-blue', L('🔁 Every') + sel('progression.pattern.every', p.pattern.every, range(1, 10), { narrow: true, num: true }) + L('levels from Lvl') + sel('progression.pattern.start', p.pattern.start, range(1, p.maxLevel), { narrow: true, num: true }) + L('grant') + inp('progression.pattern.name', p.pattern.name, { style: 'width:140px' }) + L('scaling') + inp('progression.pattern.scale', p.pattern.scale, { style: 'width:70px' }) + btn('gen-pattern', '⚡ Apply to Levels', 'fs-xs fs-primary'));
    const rows = p.levels.slice(0, p.maxLevel).map((l, i) => {
      const Lv = i + 1;
      const chips = l.features.map((f, fi) => '<span class="fs-pill ' + (f.kind === 'inline' ? 'amber' : f.kind === 'pattern' ? 'sky' : 'indigo') + '" data-action="toggle-card" data-key="ft:' + f.id + '" style="cursor:pointer">' + (f.kind === 'inline' ? '✨ ' : '') + live('feat-sum', i + ':' + fi) + '<span class="fs-x" data-action="remove-feature" data-l="' + i + '" data-f="' + fi + '">×</span></span>').join('');
      const editors = l.features.map((f, fi) => (S.ui.cardOpen['ft:' + f.id] ? '<div class="lego-sub">' + inp('progression.levels.' + i + '.features.' + fi + '.name', f.name, { style: 'width:170px' }) + sel('progression.levels.' + i + '.features.' + fi + '.abilityType', f.abilityType || 'Ex', ['Ex', 'Su', 'Sp', '—'], { narrow: true }) + inp('progression.levels.' + i + '.features.' + fi + '.text', f.text || '', { ph: 'Feature rules text…', style: 'flex:1;min-width:200px' }) + '</div>' : '')).join('');
      return stack('b-slate', '<b class="lego-lvl">Lvl ' + Lv + '</b><span class="lego-desc">BAB ' + sgn(classBAB(p.bab, Lv)) + ' • F ' + sgn(p.good.fort ? goodSave(Lv) : poorSave(Lv)) + ' / R ' + sgn(p.good.ref ? goodSave(Lv) : poorSave(Lv)) + ' / W ' + sgn(p.good.will ? goodSave(Lv) : poorSave(Lv)) + '</span>' + chips +
        spotHtml('feature', i, { style: 'width:160px', ph: '🔍 + Feature / Feat' }) + btn('add-feature-inline', '✨ + Inline', 'fs-xs fs-dashed', { l: i }) + chk('progression.levels.' + i + '.spell', l.spell, '✓ +1 Spellcasting') + editors);
    }).join('');
    h += cBlock('c-teal', L('🦖 Level Progression (1–' + p.maxLevel + ')'), rows);
    h += stack('b-green', L('🧩 Class Skills:') + p.classSkills.map((s, i) => '<span class="fs-pill emerald">' + esc(s) + '<span class="fs-x" data-action="remove-skill" data-i="' + i + '">×</span></span>').join('') + spotHtml('skill', 'class', { style: 'width:170px', ph: '🔍 + Add Skill' }) +
      Object.keys(SKILL_PACKAGES).map((k) => btn('skill-pkg', '+ ' + k, 'fs-xs', { k: k })).join(''));
    h += stack('b-purple', L('🎯 Bonus Feat Grants:') + en.grants.featGrants.map((x, i) => '<span class="fs-pill indigo">' + sel('grants.featGrants.' + i + '.level', x.level, range(1, 20).map((n) => [n, 'L' + n]), { num: true, style: 'width:56px' }) + ' ×' + x.count + ' from ' + sel('grants.featGrants.' + i + '.pool', x.pool, allTags(), { style: 'width:130px' }) + '<span class="fs-x" data-action="remove-grant" data-i="' + i + '">×</span></span>').join('') + btn('add-grant', '+ Grant', 'fs-xs fs-dashed'));
    return h;
  }
  function alignGrid(g) { return '<div class="fs-align">' + ALIGNS.map((a) => '<button type="button" data-action="set-deity-align" data-a="' + a + '" class="' + (a === g.deityAlign ? 'deity' : clericLegal(g.deityAlign, a) ? 'legal' : '') + '" title="' + ALIGN_NAMES[a] + '">' + a + '</button>').join('') + '</div>'; }
  function scratchDeity(en) {
    const g = en.grants;
    let h = hat('h-amber', '<div class="lego-row">' + L('🏛️ Deity') + inp('name', en.name, { ph: 'Deity name', style: 'width:220px' }) + L('Favored Weapon') + spotHtml('favwpn', 'deity', { style: 'width:200px', ph: '🔍 ' + (g.favoredWeapon || 'Select Base Weapon') }) + '</div>' +
      '<div class="lego-row" style="align-items:flex-start">' + L('Alignment') + alignGrid(g) + '<span class="lego-desc">Legal Cleric alignments (1 step): ' + ALIGNS.filter((a) => clericLegal(g.deityAlign, a)).join(', ') + '</span></div><div class="lego-row">' + tagSockets(en) + '</div>');
    const doms = g.domains.map((d, i) => stack('b-purple', L('✨ Domain:') + (d.kind === 'inline' ? inp('grants.domains.' + i + '.name', d.name, { style: 'width:140px' }) + inp('grants.domains.' + i + '.grantedPower', d.grantedPower, { ph: 'Granted power…', style: 'flex:1;min-width:200px' }) : '<span class="fs-pill purple">' + esc(d.name) + '</span><span class="lego-desc">' + esc(short(d.grantedPower, 90)) + '</span>') + delBtn('remove-domain', { i: i }))).join('');
    let empty = ''; for (let k = 0; k < Math.max(1, 2 - g.domains.length); k++) empty += stack('b-purple', L('✨ Domain:') + spotHtml('domain', 'slot' + k, { style: 'width:260px', ph: '🔍 Pick SRD / Custom Domain' }));
    h += cBlock('c-amber', L('🦖 Granted Domains'), doms + empty + btn('add-domain-inline', '✨ + Inline New Domain', 'fs-xs fs-dashed'));
    h += stack('b-slate', L('🧩 Portfolio & Dogma:') + L('Portfolio') + inp('grants.portfolio', g.portfolio, { ph: 'Sun, light, strength, healing', style: 'width:220px' }) + L('Worshippers / Dogma') + inp('grants.dogma', g.dogma, { ph: 'Those who wish to see evil vanquished…', style: 'flex:1;min-width:220px' }));
    return h;
  }
  function scratchDomain(en) {
    const g = en.grants;
    let h = hat('h-sky', L('✨ Domain') + inp('name', en.name, { ph: 'Domain name', style: 'width:220px' }) + '<div class="lego-row">' + tagSockets(en) + '</div>');
    h += stack('b-blue', L('🧩 Granted Power:') + inp('grants.grantedPowerName', g.grantedPowerName, { ph: 'Power name (e.g. Greater Turning)', style: 'width:200px' }) + L('Usage') + usageEditor('grants.gpUse', g.gpUse) + inp('grants.grantedPower', g.grantedPower, { ph: 'Rule summary…', style: 'flex:1;min-width:240px' }));
    h += scratchBlocks(en.effects, 'effects') + '<div class="lego-palette compact"><button type="button" class="lego-add b-blue" data-action="add-block" data-p="effects" data-t="bonus">+ 📊 Bonus (granted power)</button></div>';
    h += cBlock('c-teal', L('🦖 Domain Spell Ladder (1st–9th)'), g.ladder.map((s, i) => stack('b-slate', '<b class="lego-lvl">Lvl ' + (i + 1) + '</b>' + (s ? '<span class="fs-pill purple">🔮 ' + esc(s) + '<span class="fs-x" data-action="clear-ladder" data-i="' + i + '">×</span></span>' : '') + spotHtml('ladder', i, { style: 'width:240px', ph: '🔍 Pick Spell (Lvl ' + (i + 1) + ')' }))).join(''));
    return h;
  }
  function renderScratch() {
    const en = S.entry;
    const fn = { weapon: scratchWeaponArmor, armor: scratchWeaponArmor, wondrous: scratchWondrous, spell: scratchSpell, feat: scratchFeat, buff: scratchBuff, class: scratchClass, deity: scratchDeity, domain: scratchDomain }[en.blueprint] || scratchWondrous;
    return datalists() + '<div class="lego-canvas"><div class="lego-stack">' + fn(en) + '</div>' +
      '<div class="fs-row" style="margin-top:12px"><span class="fs-label-mini">Rules Text</span><input class="fs-in" data-bind="text" value="' + esc(en.text) + '" placeholder="Official / custom rules text…" style="flex:1;min-width:260px"></div></div>';
  }

  // Extra spotlights for the templates
  Object.assign(SPOT, {
    ladder: {
      ph: '🔍 Pick Spell…',
      layers: (ctx) => ['Lvl ' + (num(ctx) + 1), 'All SRD'],
      search(q, ctx, layer) {
        const lvl = num(ctx) + 1;
        const lf = (s) => layer === 'All SRD' || num(s.level) === lvl || new RegExp('\\b' + lvl + '\\b').test(s.levelText || '');
        return rank(CAT.spells.filter(lf), q, (s) => s.name, (s) => s.desc, 30).map((s) => SI('Spells', s.id, s.name, s.levelText || 'Level ' + s.level, short(s.school + ' • ' + s.desc), { name: s.name }));
      },
      pick(it, ctx) { S.entry.grants.ladder[num(ctx)] = it.data.name; renderAll(); }
    },
    skill: {
      ph: '🔍 + Add Skill',
      search(q) { return rank(SKILLS.filter((s) => S.entry.progression.classSkills.indexOf(s[0]) < 0).map((s) => ({ name: s[0], ab: s[1] })), q, (s) => s.name, null, 36).map((s) => SI('3.5e Skills', s.name, s.name, s.ab.toUpperCase(), '', { name: s.name })); },
      pick(it) { S.entry.progression.classSkills.push(it.data.name); renderAll(); }
    },
    favwpn: {
      ph: '🔍 Select Base Weapon',
      search(q) { return rank(CAT.weapons, q, (w) => w.name, null, 30).map((w) => SI(w.category + ' Weapons', w.id, baseName(w), w.dice, w.handed, { name: baseName(w) })); },
      pick(it) { S.entry.grants.favoredWeapon = it.data.name; renderAll(); }
    }
  });

  // --------------------------------------------------------------------------
  // 15. Render orchestration
  // --------------------------------------------------------------------------
  function refreshSlots() { document.querySelectorAll('[data-live]').forEach((el) => { const fn = LIVE[el.dataset.live]; if (fn) el.innerHTML = fn(el.dataset.args || ''); }); }
  function renderLive() {
    renderLiveHeader(); refreshSlots();
    if (S.ui.jsonOpen) { const pre = $('#fs-json-pre'); if (pre) pre.textContent = JSON.stringify(exportEntry(S.entry), null, 2); }
  }
  function renderAll() { S.spot = null; renderTopbar(); renderLiveHeader(); renderFacets(); renderJson(); }
  function toast(msg, kind) {
    const wrap = $('#fs-toasts'); if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'fs-toast ' + (kind || 'ok'); el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.remove(); }, 3200);
  }

  // --------------------------------------------------------------------------
  // 16. Actions (delegated data-action routing)
  // --------------------------------------------------------------------------
  function loadEntry(en, presetId) {
    S.entry = en; S.activePreset = presetId || ''; S.ui.cardOpen = {}; S.ui.facetOpen = {}; S.ui.attachOpen = false; S.spot = null;
  }
  function setEntry(path, v) { setPath(S.entry, path, v); onSet(path, v); }
  function onSet(path, v) {
    const en = S.entry;
    if (path === 'chassis.baseId') {
      if (en.chassis.kind === 'weapon') { en.chassis.weapon = weaponOverrides(v); en.chassis.enchantments = en.chassis.enchantments.filter((id) => enchApplies(enchById(id), 'weapon')); }
      else {
        en.chassis.armor = armorOverrides(v);
        const k = (byId(CAT.armors, v) || {}).kind;
        en.chassis.enchantments = en.chassis.enchantments.filter((id) => enchApplies(enchById(id), k));
        if (en.chassis.crystal.id && !crystalApplies(crystalById(en.chassis.crystal.id), k)) en.chassis.crystal.id = '';
        if (isItemBp(en.blueprint)) en.item.subtype = k === 'shield' ? 'Shield' : 'Armor';
      }
    } else if (path === 'chassis.kind') {
      en.chassis = Object.assign(blankChassis(v), { material: en.chassis.material, enhancement: en.chassis.enhancement });
      if (isItemBp(en.blueprint)) { en.item.subtype = v === 'weapon' ? 'Weapon' : 'Armor'; en.item.slot = v === 'weapon' ? 'Held' : 'Body / Robe'; }
    } else if (path === 'progression.mode') {
      en.progression.maxLevel = v === 'prestige' ? 10 : 20;
    } else if (/^prereqs\.\d+\.alts\.\d+\.kind$/.test(path)) {
      const alt = getPath(en, path.replace(/\.kind$/, ''));
      alt.min = { ability: 13, bab: 1, skill: 4, level: 1 }[v] || alt.min;
    } else if (/\.damage\.type$/.test(path)) {
      getPath(en, path.replace(/\.type$/, '')).on = v !== 'None';
    } else if (path === 'origin.mode' && v === 'variant') {
      en.id = uid('custom');
    }
  }
  function addEnchantment(id) {
    const ch = S.entry.chassis, e = enchById(id), v = chassisView(ch);
    if (!e) return;
    if (e.plus && v.enh < 1) { toast('Prerequisites Not Met: ' + e.name + ' requires at least a +1 enhancement bonus', 'err'); return; }
    if (e.plus && v.effective + e.plus > 10) { toast(e.name + ' would exceed the +10 effective cap (+' + (v.effective + e.plus) + ')', 'err'); return; }
    ch.enchantments.push(id); renderAll();
  }
  function addTag(raw) {
    let t = String(raw || '').trim().replace(/\s+/g, '');
    if (!t || t === '#') return;
    if (t[0] !== '#') t = '#' + t;
    if (S.entry.tags.indexOf(t) < 0) S.entry.tags.push(t);
    if (!STD_TAG_SET.has(t) && S.livingTags.indexOf(t) < 0) { S.livingTags.push(t); saveLS(); toast('Custom pool ' + t + ' created — selectable in Prerequisites & Bonus Feat Grants'); }
    renderAll();
  }
  function scaffold(en) {
    // Fill-in-the-blank starter blocks for the Scratch templates
    if (en.blueprint === 'wondrous' && !en.powers.length) en.powers.push(blankPower('inline', { name: '', use: Object.assign(blankUse('perDay'), { n: 1 }) }));
    if ((en.blueprint === 'feat' || en.blueprint === 'class') && !en.prereqs.length) en.prereqs.push({ id: uid('p'), alts: [ALT({ kind: en.blueprint === 'class' ? 'bab' : 'ability', min: en.blueprint === 'class' ? 5 : 13 })] });
    return en;
  }
  function setBlueprint(id) {
    if (BP_BY_ID[id]) { loadEntry(scaffold(blankEntry(id))); renderAll(); return; }
    const t = S.templates.find((x) => x.id === id);
    if (t) { const en = clone(t.entry); en.id = uid('custom'); en.templateId = t.id; loadEntry(en); toast('Template loaded: ' + t.name); renderAll(); }
  }
  const ACT = {
    'toggle-card': (el) => { const k = el.dataset.key; S.ui.cardOpen[k] = !S.ui.cardOpen[k]; renderFacets(); },
    'toggle-facet': (el, ev) => { if (ev && ev.target && ev.target.closest && ev.target.closest('[data-action="detach-facet"]')) return; const k = el.dataset.k; S.ui.facetOpen[k] = S.ui.facetOpen[k] === false; renderFacets(); },
    'detach-facet': (el) => { S.entry.facets = S.entry.facets.filter((f) => f !== el.dataset.k); toast('Detached: ' + FACET_BY_KEY[el.dataset.k].title, 'warn'); renderAll(); },
    'attach-facet': (el) => { const k = el.dataset.k; if (S.entry.facets.indexOf(k) < 0) S.entry.facets.push(k); S.ui.facetOpen[k] = true; toast('Attached: ' + FACET_BY_KEY[k].title); renderAll(); },
    'toggle-attach': () => { S.ui.attachOpen = !S.ui.attachOpen; renderFacets(); },
    'toggle-json': (el, ev) => { if (ev && ev.target && ev.target.closest && ev.target.closest('[data-action="copy-json"]')) return; S.ui.jsonOpen = !S.ui.jsonOpen; renderJson(); },
    'copy-json': () => {
      const txt = JSON.stringify(exportEntry(S.entry), null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Canonical V2.5 JSON copied'), () => toast('Clipboard unavailable — select the JSON manually', 'warn'));
      else toast('Clipboard unavailable — select the JSON manually', 'warn');
    },
    'load-preset': (el) => { const p = PRESETS.find((x) => x.id === el.dataset.id); if (!p) return; loadEntry(p.build(), p.id); toast('Preset loaded: ' + p.label); renderAll(); },
    'new-entry': () => { loadEntry(scaffold(blankEntry(S.entry.blueprint))); renderAll(); },
    'toggle-live': () => { S.ui.liveOpenMobile = !S.ui.liveOpenMobile; renderLiveHeader(); },
    'set-view': (el) => { S.ui.viewMode = el.dataset.v; S.ui.cardOpen = {}; renderAll(); toast(el.dataset.v === 'scratch' ? '🧩 Scratch Lego view — same live entry' : '📋 Classic Facets view — same live entry'); },
    'add-block': (el) => { const list = getPath(S.entry, el.dataset.p); const b = BLK(el.dataset.t, el.dataset.t === 'metamagic' && S.entry.blueprint === 'wondrous' ? { costMode: 'rod', transform: 'quicken' } : null); list.push(b); if (el.dataset.p === 'effects' && S.entry.facets.indexOf('effects') < 0) S.entry.facets.push('effects'); if (el.dataset.t === 'metamagic' && S.entry.blueprint === 'feat' && S.entry.tags.indexOf('#Metamagic') < 0) S.entry.tags.push('#Metamagic'); S.ui.cardOpen['blk:' + b.id] = true; renderAll(); },
    'remove-block': (el) => { getPath(S.entry, el.dataset.p).splice(num(el.dataset.i), 1); renderAll(); },
    'add-branch': (el) => { getPath(S.entry, el.dataset.p).push({ id: uid('br'), cond: 'CL ≥ 15', kids: [] }); renderAll(); },
    'remove-branch': (el) => { getPath(S.entry, el.dataset.p).splice(num(el.dataset.i), 1); renderAll(); },
    'add-row': (el) => { const rows = getPath(S.entry, el.dataset.p); rows.push({ id: uid('r'), roll: String(rows.length + 1), kids: [] }); renderAll(); },
    'remove-row': (el) => { getPath(S.entry, el.dataset.p).splice(num(el.dataset.i), 1); renderAll(); },
    'remove-target': (el) => { getPath(S.entry, el.dataset.p).splice(num(el.dataset.i), 1); renderAll(); },
    'toggle-flag': (el) => { setEntry(el.dataset.p, !getPath(S.entry, el.dataset.p)); renderAll(); },
    'skill-pkg': (el) => { const cs = S.entry.progression.classSkills; SKILL_PACKAGES[el.dataset.k].forEach((s) => { if (cs.indexOf(s) < 0) cs.push(s); }); renderAll(); },
    'remove-skill': (el) => { S.entry.progression.classSkills.splice(num(el.dataset.i), 1); renderAll(); },
    'clear-ladder': (el) => { S.entry.grants.ladder[num(el.dataset.i)] = ''; renderAll(); },
    'toggle-tpl-save': () => { S.ui.tplSaveOpen = !S.ui.tplSaveOpen; S.ui.newTplName = S.ui.newTplName || S.entry.name || ''; renderTopbar(); const i = document.querySelector('[data-uibind="newTplName"]'); if (i) i.focus(); },
    'save-template': () => {
      const name = String(S.ui.newTplName || '').trim();
      if (!name) { toast('Name the template first', 'warn'); return; }
      const t = { id: uid('tpl'), name: name, base: S.entry.blueprint, facets: S.entry.facets.slice(), entry: clone(S.entry) };
      t.entry.templateId = t.id; S.entry.templateId = t.id;
      S.templates.push(t); S.ui.tplSaveOpen = false; S.ui.newTplName = ''; saveLS();
      toast('📌 Template "' + name + '" saved (' + t.facets.length + ' sections)'); renderTopbar();
    },
    'delete-template': (el) => { S.templates = S.templates.filter((x) => x.id !== el.dataset.id); saveLS(); toast('Template deleted', 'warn'); renderTopbar(); },
    'remove-tag': (el) => { S.entry.tags.splice(num(el.dataset.i), 1); renderAll(); },
    'add-spellcls': () => { S.entry.spell.classes.push({ cls: 'Clr', lvl: 1 }); renderAll(); },
    'remove-spellcls': (el) => { S.entry.spell.classes.splice(num(el.dataset.i), 1); renderAll(); },
    'remove-descriptor': (el) => { S.entry.spell.descriptors.splice(num(el.dataset.i), 1); renderAll(); },
    'toggle-comp': (el) => { const c = S.entry.spell.comps; c[el.dataset.k] = !c[el.dataset.k]; renderAll(); },
    'add-prereq': () => { const r = { id: uid('p'), alts: [ALT({})] }; S.entry.prereqs.push(r); S.ui.cardOpen['pr:' + r.id] = true; renderAll(); },
    'add-or': (el) => { const r = S.entry.prereqs[num(el.dataset.ri)]; r.alts.push(ALT({ kind: 'skill', skill: 'skill.tumble', min: 5 })); S.ui.cardOpen['pr:' + r.id] = true; renderAll(); },
    'remove-alt': (el) => { const ri = num(el.dataset.ri), r = S.entry.prereqs[ri]; r.alts.splice(num(el.dataset.ai), 1); if (!r.alts.length) S.entry.prereqs.splice(ri, 1); renderAll(); },
    'remove-prereq': (el) => { S.entry.prereqs.splice(num(el.dataset.ri), 1); renderAll(); },
    'toggle-range': () => { const w = S.entry.chassis.weapon; w.rangeOn = !w.rangeOn; if (w.rangeOn && !num(w.range)) w.range = 10; renderAll(); },
    'remove-ench': (el) => { const a = S.entry.chassis.enchantments, i = a.indexOf(el.dataset.id); if (i >= 0) a.splice(i, 1); renderAll(); },
    'remove-crystal': () => { S.entry.chassis.crystal = { id: '', tier: 'least' }; renderAll(); },
    'add-dmg': () => { const d = S.ui.dmgDraft; S.entry.chassis.damageParts.push({ id: uid('d'), count: num(d.count, 1), die: d.die, type: d.type, crit: d.crit, cond: String(d.cond || '').trim() }); d.cond = ''; renderAll(); },
    'remove-dmg': (el) => { S.entry.chassis.damageParts.splice(num(el.dataset.i), 1); renderAll(); },
    'add-mod': (el) => { const list = getPath(S.entry, el.dataset.p || 'modifiers'); const m = M('atk.all', 1, 'Untyped'); list.push(m); S.ui.cardOpen[(el.dataset.p === 'modifiers' || !el.dataset.p ? 'm:' : 'pm:' + (getPath(S.entry, el.dataset.p.replace(/\.modifiers$/, '')) || {}).id + ':') + m.id] = true; renderAll(); },
    'remove-mod': (el) => { getPath(S.entry, el.dataset.p || 'modifiers').splice(num(el.dataset.i), 1); renderAll(); },
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
    'add-power-inline': () => { const pw = blankPower('inline', { name: 'New Power ' + (S.entry.powers.length + 1) }); S.entry.powers.push(pw); S.ui.cardOpen['pw:' + pw.id] = true; renderAll(); },
    'remove-power': (el) => { S.entry.powers.splice(num(el.dataset.i), 1); renderAll(); },
    'move-power': (el) => { const a = S.entry.powers, i = num(el.dataset.i), j = i + num(el.dataset.d); if (j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; renderAll(); },
    'add-extra': () => { const k = S.ui.extraDraft || 'other'; const x = { id: uid('x'), kind: k, text: EXTRA_KINDS[k] }; S.entry.delivery.extras.push(x); S.ui.cardOpen['x:' + x.id] = true; renderAll(); },
    'remove-extra': (el) => { S.entry.delivery.extras.splice(num(el.dataset.i), 1); renderAll(); },
    'add-dr': () => { const x = { id: uid('dr'), value: 5, bypass: 'magic' }; S.entry.defenses.dr.push(x); S.ui.cardOpen['dr:' + x.id] = true; renderAll(); },
    'remove-dr': (el) => { S.entry.defenses.dr.splice(num(el.dataset.i), 1); renderAll(); },
    'add-en': () => { const x = { id: uid('en'), type: 'Fire', mode: 'Resistance', value: 10 }; S.entry.defenses.energy.push(x); S.ui.cardOpen['en:' + x.id] = true; renderAll(); },
    'remove-en': (el) => { S.entry.defenses.energy.splice(num(el.dataset.i), 1); renderAll(); },
    'gen-pattern': () => { const p = S.entry.progression; if (!String(p.pattern.name || '').trim()) { toast('Name the repeating feature first', 'warn'); return; } applyPattern(p, p.pattern); toast('Generated "' + p.pattern.name + '" rows'); renderAll(); },
    'add-feature-inline': (el) => { const f = FEATURE('New Class Feature', { kind: 'inline', abilityType: 'Ex' }); S.entry.progression.levels[num(el.dataset.l)].features.push(f); S.ui.cardOpen['ft:' + f.id] = true; renderAll(); },
    'remove-feature': (el) => { S.entry.progression.levels[num(el.dataset.l)].features.splice(num(el.dataset.f), 1); renderAll(); },
    'set-deity-align': (el) => { S.entry.grants.deityAlign = el.dataset.a; renderAll(); },
    'add-domain-inline': () => { const d = { id: uid('dm'), kind: 'inline', name: 'New Domain', grantedPower: '', ladder: ['', '', '', '', '', '', '', '', ''] }; S.entry.grants.domains.push(d); S.ui.cardOpen['dm:' + d.id] = true; renderAll(); },
    'remove-domain': (el) => { S.entry.grants.domains.splice(num(el.dataset.i), 1); renderAll(); },
    'add-deity-inline': () => { const d = { id: uid('dt'), kind: 'inline', name: 'New Deity', align: 'N', favoredWeapon: 'Quarterstaff' }; S.entry.grants.deities.push(d); S.ui.cardOpen['dt:' + d.id] = true; renderAll(); },
    'remove-deity': (el) => { S.entry.grants.deities.splice(num(el.dataset.i), 1); renderAll(); },
    'add-grant': () => { const g = { id: uid('g'), count: 1, pool: allTags()[0], level: 1 }; S.entry.grants.featGrants.push(g); S.ui.cardOpen['g:' + g.id] = true; renderAll(); },
    'remove-grant': (el) => { S.entry.grants.featGrants.splice(num(el.dataset.i), 1); renderAll(); }
  };

  // --------------------------------------------------------------------------
  // 17. Event wiring (single delegated root)
  // --------------------------------------------------------------------------
  function handleBind(el, full) {
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.t === 'num') v = num(v);
    if (el.dataset.bind) setEntry(el.dataset.bind, v);
    else if (el.dataset.uibind) setPath(S.ui, el.dataset.uibind, v);
    else return;
    if (full) renderAll(); else renderLive();
  }
  function openSpot(el) {
    const key = el.dataset.spotInput, ctx = el.dataset.ctx || '';
    if (!S.spot || S.spot.key !== key || S.spot.ctx !== ctx) S.spot = { key: key, ctx: ctx, q: el.value, idx: 0, items: [] };
    renderSpotDD();
  }
  function init() {
    const root = document.getElementById('fs-app');
    root.addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-action]');
      if (!el || !root.contains(el)) return;
      const fn = ACT[el.dataset.action];
      if (fn) fn(el, ev);
    });
    root.addEventListener('mousedown', (ev) => {
      const del = ev.target.closest('[data-spot-del]');
      if (del && S.spot) { ev.preventDefault(); ev.stopPropagation(); const t = S.templates.find((x) => x.id === del.dataset.spotDel); S.templates = S.templates.filter((x) => x.id !== del.dataset.spotDel); saveLS(); toast('Template deleted: ' + (t ? t.name : ''), 'warn'); renderSpotDD(); return; }
      const lay = ev.target.closest('[data-spot-layer]');
      if (lay && S.spot) { ev.preventDefault(); S.spot.layer = lay.dataset.spotLayer; S.spot.idx = 0; renderSpotDD(); return; }
      const it = ev.target.closest('[data-spot-pick]');
      if (!it) return;
      ev.preventDefault();
      spotPick(num(it.dataset.spotPick));
    });
    root.addEventListener('focusin', (ev) => { if (ev.target.dataset && ev.target.dataset.spotInput) openSpot(ev.target); });
    root.addEventListener('focusout', (ev) => {
      if (!ev.target.dataset || !ev.target.dataset.spotInput) return;
      setTimeout(() => { const a = document.activeElement; if (!a || !a.dataset || !a.dataset.spotInput) { S.spot = null; renderSpotDD(); } }, 150);
    });
    root.addEventListener('input', (ev) => {
      const el = ev.target;
      if (el.dataset.spotInput) { openSpot(el); S.spot.q = el.value; S.spot.idx = 0; renderSpotDD(); return; }
      if (el.type === 'checkbox' || el.tagName === 'SELECT') return;
      handleBind(el, false);
    });
    root.addEventListener('change', (ev) => {
      const el = ev.target;
      if (el.dataset.topcat) { setBlueprint(el.value); return; }
      if (el.dataset.push) { if (el.value) { getPath(S.entry, el.dataset.push).push(el.value); renderAll(); } return; }
      if (el.type === 'checkbox' || el.tagName === 'SELECT') handleBind(el, true);
    });
    root.addEventListener('keydown', (ev) => {
      const el = ev.target;
      if (el.dataset && el.dataset.spotInput && S.spot) {
        const n = (S.spot.items || []).length;
        if (ev.key === 'ArrowDown') { ev.preventDefault(); S.spot.idx = n ? (S.spot.idx + 1) % n : 0; renderSpotDD(); return; }
        if (ev.key === 'ArrowUp') { ev.preventDefault(); S.spot.idx = n ? (S.spot.idx - 1 + n) % n : 0; renderSpotDD(); return; }
        if (ev.key === 'Enter') { ev.preventDefault(); spotPick(S.spot.idx); return; }
        if (ev.key === 'Escape') { ev.preventDefault(); S.spot = null; renderSpotDD(); el.blur(); return; }
        return;
      }
      if (ev.key !== 'Enter' || !el.dataset || !el.dataset.enter) return;
      ev.preventDefault();
      const fn = ACT[el.dataset.enter];
      if (fn) fn(el, ev);
    });
    loadEntry(PRESETS[0].build(), PRESETS[0].id);
    renderAll();
    bootCompendium();
  }
  function bootCompendium() {
    const C = window.SrdCompendium;
    const http = /^https?:$/.test(location.protocol);
    if (!C || typeof C.init !== 'function' || !http) return; // file:// => offline seed catalog
    C.init({ basePath: 'database' }).then((ok) => {
      if (!ok) return;
      try { mergeSrd(C); } catch (e) { console.warn('[ForgeSandbox] SRD merge skipped:', e && e.message); }
      return fetch('./master_db.json').then((r) => (r.ok ? r.json() : [])).then((list) => { mergeMasterDb(Array.isArray(list) ? list : (list && list.entries) || []); }).catch(() => {});
    }).then(() => { if (CAT.srdLoaded) { toast('📚 SRD + MIC loaded: ' + CAT.srdCount.toLocaleString('en-US') + ' entries' + (CAT.customCount ? ' (+' + CAT.customCount + ' custom)' : '')); renderAll(); } })
      .catch((e) => console.warn('[ForgeSandbox] SrdCompendium unavailable:', e && e.message));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // Read-only QA hook
  window.ForgeSandbox = { state: S, catalog: CAT, chassisView: chassisView, exportEntry: exportEntry, rawHeaderLine: rawHeaderLine, damageAtCL: damageAtCL, presets: PRESETS.map((p) => p.id),
    loadPreset: (id) => ACT['load-preset']({ dataset: { id: id } }), act: (name, data) => { const el = document.createElement('div'); Object.keys(data || {}).forEach((k) => { el.dataset[k] = data[k]; }); ACT[name](el, { target: el }); } };
})();
