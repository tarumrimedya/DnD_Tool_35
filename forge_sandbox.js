/* ============================================================================
 * LIVING FACET STUDIO — Rule Forge 3.0 Sandbox (Lego Core V3)
 * Zero-Patchwork 5 Orthogonal Scratch Primitives & 37 Benchmark Presets.
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
  const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Force', 'Holy', 'Unholy', 'Positive', 'Negative', 'Precision', 'Vile', 'Nonlethal', 'Untyped', 'Healing'];
  const DIE_LIST = ['1', '1d2', '1d3', '1d4', '1d6', '1d8', '1d10', '1d12', '2d4', '2d6', '2d8', '2d10', '3d6', '4d6', '6d6', '6d8', 'd4', 'd6', 'd8', 'd10', 'd12', 'flat'];
  const ENERGY = ['Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Force'];
  const ACTIONS = ['Standard', 'Full-Round', 'Move', 'Swift', 'Immediate', 'Free', 'Reaction', 'Passive'];
  const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation', 'Universal'];
  const DESCRIPTORS = ['Acid', 'Air', 'Chaotic', 'Cold', 'Darkness', 'Death', 'Earth', 'Electricity', 'Evil', 'Fear', 'Fire', 'Force', 'Good', 'Language-Dependent', 'Lawful', 'Light', 'Mind-Affecting', 'Sonic', 'Water', 'Teleportation', 'Shadow'];
  const SPELL_CLASSES = ['Sor/Wiz', 'Clr', 'Drd', 'Brd', 'Pal', 'Rgr', 'Adept', 'Sha', 'War Mage', 'Wu Jen'];
  const SPELL_SYSTEMS = [
    ['spell', 'Arcane / Divine Spell'],
    ['psionic', 'Psionic Power'],
    ['maneuver', 'Martial Maneuver / Stance'],
    ['invocation', 'Invocation / Blast Mod'],
    ['soulmeld', 'Incarnum Soulmeld'],
    ['vestige', 'Binder Vestige'],
    ['utterance', 'Truenamer Utterance'],
    ['mystery', 'Shadowcaster Mystery']
  ];
  const MANEUVER_TYPES = ['Strike', 'Boost', 'Counter', 'Stance'];
  const TOB_DISCIPLINES = ['Desert Wind', 'Devoted Spirit', 'Diamond Mind', 'Iron Heart', 'Setting Sun', 'Shadow Hand', 'Stone Dragon', 'Tiger Claw', 'White Raven'];
  const PSIONIC_DISCIPLINES = ['Clairsentience', 'Metacreativity', 'Psychokinesis', 'Psychometabolism', 'Psychoportation', 'Telepathy'];
  const INV_GRADES = ['Least', 'Lesser', 'Greater', 'Dark'];
  const INV_KINDS = ['Invocation', 'Eldritch Essence', 'Blast Shape'];
  const MELDSHAPER_LISTS = ['Totemist', 'Incarnate', 'Soulborn'];
  const TRUENAME_LEXICONS = ['Evolving Mind', 'Crafted Tool', 'Perfected Map'];
  const MYSTERY_TIERS = ['Fundamental', 'Apprentice', 'Initiate', 'Master'];
  const CASTER_MODES = [
    ['none', 'Non-Caster'],
    ['fullPrep', 'Full Prepared (1st–9th, e.g. Cleric/Wizard)'],
    ['fullSpont', 'Full Spontaneous (1st–9th, e.g. Sorcerer)'],
    ['fast9', 'Fast 1st–9th in 10 Lvls (Ur-Priest / Sublime Chord)'],
    ['sixthPrep', '6-Lvl Prepared (0–6th, e.g. Magus)'],
    ['sixthSpont', '6-Lvl Spontaneous (0–6th, e.g. Bard)'],
    ['duskblade', '5-Lvl Spontaneous (0–5th, e.g. Duskblade)'],
    ['halfPrep', 'Half Prepared (1st–4th, e.g. Paladin/Ranger)'],
    ['halfSpont', 'Half Spontaneous (1st–4th, e.g. Bloodrager / Spellthief)'],
    ['psionic', 'Psionic (Power Points & Powers)'],
    ['meldshaper', 'Incarnum Meldshaper (Soulmelds / Essentia / Chakra Binds)'],
    ['binder', 'Binder (Soul Binding Vestige Pacts)'],
    ['truenamer', 'Truenamer (Truespeak Utterances)'],
    ['shadowcaster', 'Shadowcaster (Mysteries: Spell -> Sp -> Su)'],
    ['martial', 'Martial Adept (Maneuvers & Stances)']
  ];
  const CL_FORMULAS = [
    ['full', '= Class Lvl (Full CL)'],
    ['half', '= ½ Class Lvl'],
    ['minus3', '= Class Lvl - 3'],
    ['urPriest', '= Class Lvl + ½ Other Spellcasting Lvls (Ur-Priest)'],
    ['custom', 'Custom Formula']
  ];
  const CREATURE_SIZES = ['Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal'];
  const CREATURE_TYPES = ['Humanoid', 'Outsider', 'Dragon', 'Fey', 'Monstrous Humanoid', 'Construct', 'Undead', 'Aberration', 'Giant', 'Magical Beast'];
  const FLY_MANEUVERABILITIES = ['Clumsy', 'Poor', 'Average', 'Good', 'Perfect'];
  const RANGES = ['Personal', 'Touch', 'Close (25 ft. + 5 ft./2 levels)', 'Medium (100 ft. + 10 ft./level)', 'Long (400 ft. + 40 ft./level)', '30 ft.', '60 ft.', 'Unlimited', 'See text'];
  const AREAS = ['30-ft. Cone', '60-ft. Line', '20-ft.-radius Spread', '10-ft.-radius Burst', 'One creature', 'One or more rays', 'You', 'One creature/level'];
  const ALIGNS = ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE'];
  const ALIGN_NAMES = { LG: 'Lawful Good', NG: 'Neutral Good', CG: 'Chaotic Good', LN: 'Lawful Neutral', N: 'True Neutral', CN: 'Chaotic Neutral', LE: 'Lawful Evil', NE: 'Neutral Evil', CE: 'Chaotic Evil' };
  const ALIGN_REQS = ALIGNS.concat(['Any Good', 'Any Evil', 'Any Lawful', 'Any Chaotic', 'Any Non-Good', 'Any Non-Evil', 'Any Non-Lawful', 'Any Non-Chaotic', 'Any Neutral']);
  const BODY_SLOTS = ['Head', 'Eyes', 'Neck', 'Torso', 'Body / Robe', 'Waist / Belt', 'Shoulders / Cloak', 'Arms / Bracers', 'Hands / Gloves', 'Ring', 'Feet / Boots', 'Held', 'Slotless'];
  const STANDARD_TAGS = [
    ['Feat Pools', ['#FighterBonus', '#WizardBonus', '#Metamagic', '#ItemCreation', '#Reserve', '#Divine', '#Tactical', '#Exalted', '#Vile', '#Draconic', '#General']],
    ['Item / Boon', ['#DMGrant', '#Relic', '#Consumable', '#Artifact', '#Weapon', '#Armor']],
    ['Descriptors', ['#Fire', '#Cold', '#Acid', '#Electricity', '#Sonic', '#Force', '#MindAffecting', '#Fear', '#Teleportation']]
  ];
  const STD_TAG_SET = new Set(STANDARD_TAGS.flatMap((g) => g[1]));

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
    ['Righteous Might', 'Clr 5, Strength 5', 'Transmutation', 5, 'Standard', 'Personal', 'None', 'Your size increases, and you gain combat bonuses.'],
    ['Protection from Evil', 'Clr 1, Pal 1, Sor/Wiz 1, Good 1', 'Abjuration', 1, 'Standard', 'Touch', 'Will negates (harmless)', '+2 deflection to AC and +2 resistance on saves vs evil creatures; blocks bodily contact and mental control.'],
    ['Holy Word', 'Clr 7, Good 7', 'Evocation', 7, 'Standard', '40 ft.', 'None', 'Kills, paralyzes, blinds, or deafens nongood subjects based on Hit Dice.'],
    ['Command', 'Clr 1', 'Enchantment', 1, 'Standard', 'Close (25 ft. + 5 ft./2 levels)', 'Will negates', 'One subject obeys a single-word command for 1 round.']
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

  const CAT = { weapons: WEAPONS, armors: ARMORS, enchants: ENCHANTMENTS, crystals: CRYSTALS, feats: FEATS, spells: SPELLS, domains: DOMAINS, deities: DEITIES, classFeatures: CLASS_FEATURES, special: [], magicItems: [], classes: [], srdLoaded: false, srdCount: 0, customCount: 0 };
  const byId = (list, id) => list.find((x) => x.id === id);

  // --------------------------------------------------------------------------
  // 2. Categories (11 blueprints)
  // --------------------------------------------------------------------------
  const BLUEPRINTS = [
    { id: 'weapon', name: 'Weapon', icon: '⚔️', facets: ['identity', 'chassis', 'effects'], item: true },
    { id: 'armor', name: 'Armor / Shield', icon: '🛡️', facets: ['identity', 'chassis', 'effects'], item: true },
    { id: 'wondrous', name: 'Wondrous / Ring / Staff / Consumable', icon: '💎', facets: ['identity', 'effects', 'powers'], item: true },
    { id: 'spell', name: 'Spell / Power', icon: '🔮', facets: ['identity', 'delivery', 'lifecycle', 'effects'] },
    { id: 'feat', name: 'Feat / ACF / Boon', icon: '📜', facets: ['identity', 'prereqs', 'effects'] },
    { id: 'buff', name: 'Buff / Condition', icon: '✨', facets: ['identity', 'effects', 'lifecycle'] },
    { id: 'class', name: 'Class / Prestige Class', icon: '💎', facets: ['identity', 'prereqs', 'progression', 'grants', 'effects'] },
    { id: 'deity', name: 'Deity', icon: '🏛️', facets: ['identity', 'grants'] },
    { id: 'domain', name: 'Domain', icon: '✨', facets: ['identity', 'grants'] },
    { id: 'item_mod', name: 'Enchantment / Crystal / Material', icon: '✨', facets: ['identity', 'effects', 'powers'] },
    { id: 'race', name: 'Race / Creature Template', icon: '🧬', facets: ['identity', 'effects', 'powers'] }
  ];
  const BP_BY_ID = {}; BLUEPRINTS.forEach((b) => { BP_BY_ID[b.id] = b; });
  const isItemBp = (bp) => !!(BP_BY_ID[bp] && BP_BY_ID[bp].item);
  const isConsumable = (en) => /Potion|Scroll|Wand/.test(en.item.subtype) || en.lifecycle.use.mode === 'charges' || en.powers.some((p) => p.use.mode === 'charges');

  // --------------------------------------------------------------------------
  // 3. Entry model (Lego Core V3 — schemaVersion: 3)
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
    return { kind: kind, baseId: id, material: 'standard', enhancement: 0, enchantments: [], crystal: { id: '', tier: 'least' }, weapon: weaponOverrides(isW ? id : 'longsword'), armor: armorOverrides(isW ? 'chain_shirt' : id) };
  }
  const blankUse = (mode) => ({ mode: mode || 'atwill', n: 3, slotLevel: 1, pool: 'Turn Undead', poolCost: 1, cooldown: '1d4+1' });
  function blankLevels() { const a = []; for (let i = 0; i < 20; i++) a.push({ features: [], spell: false }); return a; }
  function blankEntry(bpId) {
    const bp = BP_BY_ID[bpId] || BLUEPRINTS[0];
    return {
      schemaVersion: 3, id: uid('custom'), blueprint: bp.id, name: '', source: 'Homebrew', text: '', tags: [], repeat: { mode: 'once', n: 2 },
      featKind: 'feat', acf: { targetClass: 'Barbarian', level: 1, replaces: 'Fast Movement', race: '' },
      origin: { mode: 'new', srdId: '', srdName: '', srdType: '' },
      facets: bp.facets.slice(),
      item: { subtype: bp.id === 'weapon' ? 'Weapon' : bp.id === 'armor' ? 'Armor' : 'Wondrous Item', slot: bp.id === 'weapon' ? 'Held' : bp.id === 'armor' ? 'Body / Robe' : 'Slotless', consumable: false, price: 0, cl: 0 },
      spell: {
        system: 'spell', classes: [{ cls: 'Sor/Wiz', lvl: 1 }], school: 'Evocation', descriptors: [],
        comps: { V: true, S: true, M: false, F: false, DF: false, XP: false },
        maneuverType: 'Strike', discipline: 'Iron Heart', maneuverLvl: 1, prereqManeuvers: 0,
        invGrade: 'Least', invKind: 'Invocation', ppCost: 1, augmentable: false,
        chakraSlots: 'Arms / Totem', meldshaperList: 'Totemist',
        vestigeLvl: 1, bindingDc: 15, vestigeSign: '',
        lexicon: 'Evolving Mind', mysteryTier: 'Apprentice', mysteryPath: 'Shutters and Clouds'
      },
      itemMod: { kind: 'enchantment', on: 'weapon', costMode: 'plus', plus: 1, gp: 2000, keen: false, badge: '', crystalCosts: [500, 1500, 5000], crystalTiers: ['', '', ''], mat: { acpDelta: 0, maxDexDelta: 0, asfDelta: 0, critMultOverride: 0, drBypass: '', weaponGp: 3000, lightGp: 1000, medGp: 4000, heavyGp: 9000 } },
      race: { kind: 'race', timing: 'Inherited', size: 'Medium', creatureType: 'Humanoid', subtype: '', speed: 30, flySpeed: 0, flyMan: 'Average', la: 0, rhdCount: 0, rhdDie: 8, favoredClass: 'Any', bonusFeat1: false, bonusSkillPts: false },
      prereqs: [],
      chassis: blankChassis(bp.id === 'armor' ? 'armor' : 'weapon'),
      powers: [], effects: [], buffKind: 'Buff',
      delivery: { action: 'Standard', range: 'Close (25 ft. + 5 ft./2 levels)', area: '', target: '', attack: 'none', attackOn: false, save: { type: 'None', effect: 'Half', dcMode: 'spell', stat: 'int', flat: 15 }, sr: 'Yes', extras: [] },
      lifecycle: { use: blankUse('atwill'), duration: 'instant', durValue: 1, durText: '', dismissible: false, stackable: false, maxStacks: 5 },
      progression: {
        mode: 'prestige', maxLevel: 10, hitDie: 8, bab: '3/4', good: { fort: false, ref: false, will: false }, skillPts: 2, classSkills: [], levels: blankLevels(),
        pattern: { name: 'Sneak Attack', start: 1, every: 2, scale: '+1d6' },
        caster: { mode: 'none', clFormula: 'full', clCustom: '', tradition: 'Arcane', ability: 'int', spellList: 'Sor/Wiz', ignoreAsf: 'none', ignoreShieldAsf: false, castInRage: false }
      },
      grants: { deityAlign: 'NG', favoredWeapon: 'Mace, Heavy', portfolio: '', dogma: '', grantedPowerName: '', gpUse: blankUse('passive'), grantedPower: '', grantedUses: '1/day', ladder: ['', '', '', '', '', '', '', '', ''], featGrants: [], domains: [], deities: [] }
    };
  }
  const ALT = (o) => Object.assign({ id: uid('a'), kind: 'ability', ability: 'str', min: 13, skill: 'skill.tumble', feat: '', levelKind: 'casterLevel', cls: '', align: 'Any Good', text: '' }, o);
  function blankPower(kind, o) {
    return Object.assign({
      id: uid('pw'), kind: kind, name: kind === 'inline' ? 'New Power' : '', ref: null, grantMode: 'cast',
      use: blankUse('perDay'), action: 'Standard', cl: 5, dc: 0, duration: '',
      attack: 'none', attackOn: false, range: '', area: '',
      save: { type: 'None', effect: 'Negates' }, effects: [], text: '', exportStandalone: false
    }, o || {});
  }
  const FEATURE = (name, o) => Object.assign({ id: uid('f'), kind: 'ref', name: name, abilityType: 'Ex', text: '', refId: '' }, o || {});
  const DOMAIN_REF = (d) => ({ id: uid('dm'), kind: 'ref', name: d.name, refId: d.id, grantedPower: d.grantedPower || '', ladder: (d.spells || []).slice(0, 9).concat(['', '', '', '', '', '', '', '', '']).slice(0, 9) });
  const findDomain = (name) => CAT.domains.find((d) => d.name.toLowerCase() === String(name).toLowerCase());
  function spellRef(s) { return s ? { id: s.id, name: s.name, levelText: s.levelText || '', level: num(s.level, 1), school: s.school || '', desc: s.desc || '', range: s.range || '', save: s.save || '' } : null; }
  function crystalIdByName(name) { const c = CAT.crystals.find((x) => x.name.toLowerCase() === name.toLowerCase()); return c ? c.id : ''; }

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
  // 4. Lego Core V3 — 5 Orthogonal Primitives (9 Block Types)
  // --------------------------------------------------------------------------
  const META_COST_MODES = [['slot', '+Slot Level'], ['rod', 'Metamagic Rod (Uses/Day)'], ['sudden', 'Sudden (Uses/Day, +0 Slot)'], ['pool', 'Pool Cost (Divine Metamagic)'], ['essenceShape', 'Invocation Essence / Blast Shape']];
  const META_TRANSFORMS = [
    ['empower', 'Damage / Variable ×1.5 (Empower)'], ['maximize', 'Maximize Variable Dice'], ['quicken', 'Cast as Swift Action (Quicken)'],
    ['extend', 'Duration ×2 (Extend)'], ['persistent', 'Duration → 24 Hours (Persistent)'], ['enlarge', 'Range ×2 (Enlarge)'], ['widen', 'Area ×2 (Widen)'],
    ['twin', 'Cast Spell Twice (Twin)'], ['splitRay', '+1 Extra Ray (Split Ray)'], ['chain', 'Arc Secondary Targets (Chain)'],
    ['heighten', '+Save DC / Effective Level'], ['energySub', 'Substitute Energy Type'], ['pierceRes', 'Ignore Energy Resist / ½ Immunity'],
    ['silent', 'Remove Verbal (V) Component'], ['still', 'Remove Somatic (S) Component'], ['rider', 'Add Rider / Custom Transform']
  ];
  const META_TX_LABEL = {}; META_TRANSFORMS.forEach((x) => { META_TX_LABEL[x[0]] = x[1]; });
  const SIZE_STEPS = { '-2': 'Shrink 2 categories', '-1': 'Shrink 1 category', '1': '+1 Size Category (e.g. Medium → Large)', '2': '+2 Size Categories' };
  const LOCK_LABEL = {
    loseDex: 'Lose DEX Bonus to AC', flatFooted: 'Flat-Footed', cannotAct: 'Cannot Take Actions (Stunned/Dazed)', blinded: 'Blinded (-2 AC, Lose DEX)',
    entangled: 'Entangled (-2 Atk, -4 DEX)', negLevel: 'Negative Level (-1 Atk/Saves/Checks/CL, -5 HP per stack)', extraAttack: 'Extra Attack on Full Attack (Haste / Speed)'
  };

  const BLOCK_TYPES = {
    resource: { icon: '🔋', label: 'Resource / Dial (@X)', shortLabel: '@Resource', color: 'b-teal' },
    when: { icon: '🔶', label: 'When / While', shortLabel: 'When / While', color: 'c-teal', container: 'branches' },
    table: { icon: '🎯', label: 'Roll Table', shortLabel: 'Roll Table', color: 'c-amber', container: 'rows' },
    carrier: { icon: '🎯', label: 'Carrier / Cast Mod', shortLabel: 'Carrier / Cast Mod', color: 'b-purple' },
    stat: { icon: '📊', label: 'Stat Modifier', shortLabel: 'Stat Mod', color: 'b-blue' },
    roll: { icon: '💥', label: 'Roll / Damage / Heal', shortLabel: 'Roll / Damage', color: 'b-red' },
    attack: { icon: '🦷', label: 'Attack / Weapon Mod', shortLabel: 'Attack / Imbue', color: 'b-red' },
    defense: { icon: '🛡️', label: 'Defense / Sense / State', shortLabel: 'Defense / State', color: 'b-green' },
    effect: { icon: '🔮', label: 'Cast / Slot / Rule', shortLabel: 'Cast / Slot / Rule', color: 'b-slate' }
  };
  const BLOCK_ORDER = ['resource', 'when', 'table', 'carrier', 'stat', 'roll', 'attack', 'defense', 'effect'];
  const PROGRESSION_MODES = [['base', 'Base Class (1–20)'], ['prestige', 'Prestige Class (1–10)'], ['hd', 'HD / Character Level Scaling (1–20)'], ['legacy', 'Legacy Item Rituals (1–20)']];

  function blankBranch(o) {
    return Object.assign({
      id: uid('br'),
      condKind: 'state', condText: 'Bloodrage',
      trigger: 'activate', action: 'Swift', targetText: '',
      costKind: 'none', costVal: 1, costFormula: '1', poolName: 'Arcane Pool', checkFormula: 'Truespeak DC 15 + 2×CR + 2×@uses_today', cooldownText: '5 rounds',
      kids: []
    }, o || {});
  }

  function BLK(type, o) {
    const base = { id: uid('b'), type: type };
    const d = {
      resource: {
        name: 'Arcane Pool', varKey: 'arcane_pool', resMode: 'spend',
        capMode: 'chakra', maxMode: 'spellLvl', dialCost: 'free', costPool: 'Turn Undead',
        scaling: 'halfLvlPlusMod', max: 0, ability: 'int',
        reset: 'perDay', cooldownText: '5 rounds'
      },
      when: {
        flow: 'while',
        branches: [blankBranch()]
      },
      table: {
        die: '1d8',
        rows: [{ id: uid('r'), roll: '1', kids: [] }]
      },
      carrier: {
        carrierMode: 'meleeChannel',
        channelStyle: 'spellstrikeFree', critRule: 'weaponRangeX2', holdCharge: true, maxSpellLvl: 3,
        atkPenalty: -2, offHandFree: true,
        costMode: 'slot', slotAdj: 1, uses: 3, pool: 'Turn Undead', poolCost: 1,
        transform: 'empower', dcBonus: 1, energy: 'Fire', rider: '', appliesTo: ''
      },
      stat: {
        targets: ['atk.all'], mode: 'flat', value: 1, btype: 'Morale',
        stat: 'chaMod', mult: 1, cap: 'none', capVal: 5,
        subOp: 'replace', fromStat: 'wis', toStat: 'con',
        per: 3, min: 0, max: 5, condition: ''
      },
      roll: {
        kind: 'Damage', count: 1, die: 'd6', dmgType: 'Fire',
        scaling: 'flat', amount: 1, per: 1, start: 1, max: 10,
        varKey: 'augment_pp', varMode: 'dice',
        crit: 'normal', save: '', condition: ''
      },
      attack: {
        attackMode: 'natural', natKind: 'primary', count: 2, weaponName: 'Claw', dice: '1d4', dmgType: 'B/P/S',
        extraKind: 'extraFull', penalty: -2, rider: '',
        duration: '1 min', budgetScaling: 'per4Lvl', maxBudget: 5, allowedEnchs: 'Flaming, Frost, Shock, Keen, Speed'
      },
      defense: {
        mode: 'Immunity', what: 'Fear', value: 10, srMode: 'flat', steps: 1, flag: 'negLevel'
      },
      effect: {
        effectKind: 'rule',
        castMode: 'linkedSpell', spellName: 'Command', maxSpellLvl: 2, spellOptions: 'Blur, Protection from Arrows, Resist Energy, Displacement, Haste', tiedDuration: true,
        targetPoolOrClass: 'Magus',
        maxLvlFormula: '≤ ⅓ Class Lvl', bufferVar: 'stolen_lvl',
        featOrPool: '#FighterBonus', floatingDaily: false,
        castNature: 'Arcane Spell',
        text: ''
      }
    }[type] || {};
    const out = Object.assign(base, clone(d), o || {});
    if (type === 'when' && Array.isArray(out.branches)) {
      out.branches = out.branches.map((br) => blankBranch(br));
    }
    if (type === 'table' && Array.isArray(out.rows)) {
      out.rows = out.rows.map((r) => ({ id: r.id || uid('r'), roll: String(r.roll || '1'), kids: Array.isArray(r.kids) ? r.kids : [] }));
    }
    if (type === 'resource' && !out.varKey) out.varKey = slug(out.name || 'resource');
    return out;
  }

  const modMode = (m) => m.mode || 'flat';
  function statFormulaText(m) {
    const baseVal = num(m.value, 0);
    const baseStr = baseVal !== 0 ? (baseVal > 0 ? '+' + baseVal + ' ' : baseVal + ' ') : '';
    const mult = num(m.mult, 1);
    const prefix = mult === 1 ? '+' : mult === -1 ? '-' : (mult === 0.5 ? '+½×' : sgn(mult) + '×');
    const cap = m.cap === 'classLevel' ? ' (cap @classLevel)' : m.cap === 'flat' ? ' (cap +' + num(m.capVal, 5) + ')' : '';
    return baseStr + prefix + '@' + (m.stat || 'chaMod') + cap;
  }
  function replaceStatTargetLabel(k) {
    return k === 'save.will' ? 'Will Save' : k === 'save.fort' ? 'Fortitude Save' : k === 'save.ref' ? 'Reflex Save' : targetLabel(k);
  }
  function replaceStatSummary(m, targetText) {
    const from = String(m.fromStat || 'wis').toUpperCase();
    const to = String(m.toStat || 'con').toUpperCase();
    return (m.subOp === 'max' ? 'Higher of ' + to + '/' + from : to + ' → ' + from) + ' on ' + targetText + (m.condition ? ' (' + m.condition + ')' : '');
  }
  function metamagicCostText(b) {
    if (b.costMode === 'rod') return num(b.uses, 3) + '/day Rod (max Lvl ' + num(b.maxSpellLvl, 3) + ', +0 Slot)';
    if (b.costMode === 'sudden') return num(b.uses, 1) + '/day Sudden (+0 Slot)';
    if (b.costMode === 'pool') return num(b.poolCost, 1) + ' ' + (b.pool || 'Turn Undead') + ' (+0 Slot)';
    if (b.costMode === 'essenceShape') return 'Eldritch Essence / Blast Shape (Eff. Lvl ' + num(b.maxSpellLvl, 1) + ')';
    return '+' + num(b.slotAdj) + ' Spell Slot';
  }
  function metamagicTxText(b) {
    if (b.transform === 'heighten') return '+' + num(b.dcBonus, 1) + ' Save DC / Effective Level';
    if (b.transform === 'energySub') return 'Substitute Energy → ' + b.energy;
    if (b.transform === 'pierceRes') return 'Ignore ' + b.energy + ' Resistance (½ vs Immunity)';
    if (b.transform === 'rider') return b.rider || 'Custom spell rider';
    return META_TX_LABEL[b.transform] || b.transform;
  }
  function rollBlockText(b) {
    const cnt = num(b.count, 1);
    const die = String(b.die || 'd6');
    const unit = die === 'flat' ? (cnt > 0 ? String(cnt) : '') : (/^\d+d\d+$/.test(die) ? die : (cnt > 0 ? cnt + die : ''));
    let scaleStr = '';
    if (b.scaling === 'perCL') {
      const per = Math.max(1, num(b.per, 1));
      const amt = num(b.amount, 1);
      const amtStr = die === 'flat' ? String(amt) : amt + die.replace(/^\d+/, '');
      scaleStr = (unit ? ' + ' : '') + amtStr + ' per ' + (per === 1 ? '' : per + ' ') + 'CL' + (num(b.start, 1) > 1 ? ' from CL ' + num(b.start, 1) : '') + ' (max +' + num(b.max, 10) + ')';
    } else if (b.scaling === 'perVar') {
      const vk = '@' + (b.varKey || 'x');
      const vPart = b.varMode === 'flat' ? num(b.amount, 1) + '×' + vk : vk + (die === 'flat' ? '' : die.replace(/^\d+/, ''));
      scaleStr = (unit ? ' + ' : '+') + vPart;
    }
    const core = (unit + scaleStr).trim() || '0';
    const crit = b.crit === 'onCritOnly' ? ' (On Crit Only)' : b.crit === 'multiply' ? ' (×Crit)' : '';
    const prefix = b.kind === 'Damage' ? '' : b.kind + ': ';
    const suffix = b.kind === 'Damage' || b.kind === 'Ongoing / Round' ? ' ' + (b.dmgType || 'Untyped') + (b.kind === 'Damage' ? ' damage' : '/round') : '';
    const saveCond = [b.save, b.condition].filter(Boolean).join(' • ');
    return prefix + core + suffix + crit + (saveCond ? ' [' + saveCond + ']' : '');
  }
  function rollAtCL(b, cl) {
    if (!b || b.type !== 'roll') return '';
    const cnt = num(b.count, 1), die = String(b.die || 'd6');
    if (b.scaling !== 'perCL') return die === 'flat' ? String(cnt) : (/^\d+d\d+$/.test(die) ? die : cnt + die);
    const start = num(b.start, 1), per = Math.max(1, num(b.per, 1)), maxSteps = Math.max(1, num(b.max, 10));
    const steps = cl < start ? 0 : Math.min(maxSteps, Math.floor((cl - start) / per) + 1);
    const total = (cnt > 0 && start > 1 ? cnt + (steps - 1) * num(b.amount, 1) : steps * num(b.amount, cnt || 1));
    if (die === 'flat') return String(total);
    return total + die.replace(/^\d+/, '');
  }
  function whenBranchHeadText(flow, br) {
    if (flow === 'while') {
      const kindLbl = { state: 'While State', bound: 'While Bound', levelTier: 'Tier', synergy: 'Synergy', situational: 'When' }[br.condKind || 'state'] || 'While';
      return kindLbl + ': ' + (br.condText || 'Active');
    }
    const trigLbl = {
      activate: 'Activate (' + (br.action || 'Swift') + ')',
      enterState: 'On Enter ' + (br.targetText || 'State'),
      meleeHit: 'On Melee Hit',
      critHit: 'On Critical Hit',
      sneakHit: 'On Sneak Attack Hit',
      takeDamage: 'On Taking Damage',
      castSpell: 'When Casting ' + (br.targetText || 'Spell')
    }[br.trigger || 'activate'] || 'When';
    let costLbl = '';
    if (br.costKind === 'pool') costLbl = ' [Spend ' + (br.costFormula || br.costVal || 1) + ' @' + slug(br.poolName || 'pool') + ']';
    else if (br.costKind === 'forgoSA') costLbl = ' [Forgo ' + num(br.costVal, 1) + 'd6 SA]';
    else if (br.costKind === 'skillCheck') costLbl = ' [' + (br.checkFormula || 'Skill Check') + ']';
    else if (br.costKind === 'expendFocus') costLbl = ' [Expend Psionic Focus]';
    else if (br.costKind === 'cooldown') costLbl = ' [Cooldown ' + (br.cooldownText || '5 rounds') + ']';
    else if (br.costKind === 'perDay') costLbl = ' [' + num(br.costVal, 1) + '/day]';
    return trigLbl + costLbl;
  }

  function blockText(b) {
    if (!b) return '';
    switch (b.type) {
      case 'resource': {
        const vk = '@' + (b.varKey || slug(b.name || 'res'));
        const ab = String(b.ability || 'int').toUpperCase() + ' Mod';
        const rs = { atWill: 'At-Will', cooldown: 'Cooldown ' + (b.cooldownText || '5 rounds'), perEncounter: '/encounter', perDay: '/day' }[b.reset || 'perDay'] || '/day';
        if (b.resMode === 'invest') return (b.name || 'Essentia') + ' (' + vk + ', Invest Cap: ' + (b.capMode || 'chakra') + ')';
        if (b.resMode === 'dial') {
          const mx = b.maxMode === 'flat' ? num(b.max, 5) : b.maxMode === 'spellLvl' ? 'Slot 1–9' : '@' + b.maxMode;
          const dc = b.dialCost === 'spellSlot' ? 'Burn Spell Slot' : b.dialCost === 'pool' ? 'Spend ' + (b.costPool || 'Pool') : 'Free Tradeoff';
          return (b.name || 'Dial') + ' (' + vk + ' = 0..' + mx + ', ' + dc + ')';
        }
        if (b.resMode === 'focus') return (b.name || 'Psionic Focus') + ' (' + vk + ' = 0/1 Binary State)';
        if (b.resMode === 'buffer') return (b.name || 'Buffer') + ' (' + vk + ', Max: ' + (b.scaling === 'level' ? '@level' : num(b.max, 10)) + ')';
        let sc = String(num(b.max, 0));
        if (b.scaling === 'level') sc = '@level';
        else if (b.scaling === 'halfLevel') sc = '½ @level';
        else if (b.scaling === 'plusMod') sc = (num(b.max, 0) ? num(b.max, 0) + ' + ' : '') + ab;
        else if (b.scaling === 'halfLvlPlusMod') sc = (num(b.max, 0) ? num(b.max, 0) + ' + ' : '') + '½ @level + ' + ab;
        else if (b.scaling === 'twoPerLvlPlusMod') sc = num(b.max, 0) + ' + 2/Lvl + ' + ab;
        return (b.name || 'Resource') + ' (' + vk + '): ' + sc + ' ' + rs;
      }
      case 'when': {
        return (b.branches || []).map((br) => whenBranchHeadText(b.flow || 'while', br) + ' → ' + ((br.kids || []).map(blockText).join(' + ') || '—')).join(' | ');
      }
      case 'table': {
        return 'Roll ' + b.die + ': ' + (b.rows || []).map((r) => '[' + r.roll + '] ' + ((r.kids || []).map(blockText).join(' + ') || '—')).join(' ');
      }
      case 'carrier': {
        const cm = b.carrierMode || 'meleeChannel';
        if (cm === 'meleeChannel') {
          const st = {
            spellstrikeFree: 'Spellstrike (Touch Spell via Free Melee Weapon Atk)',
            standardSingle: 'Arcane Channel (Standard: 1 Melee Atk + Touch Spell)',
            fullAttackEach: 'Full-Attack Channel (Touch Spell Hits Every Struck Foe)',
            spellStoring: 'Spell Storing (Weapon Stores ≤ Lvl ' + num(b.maxSpellLvl, 3) + ')'
          }[b.channelStyle || 'spellstrikeFree'];
          const cr = b.critRule === 'fullWeaponCrit' ? 'Full Weapon Crit' : b.critRule === 'spell20x2' ? 'Spell 20/×2' : 'Weapon Crit Range, ×2';
          return st + (b.channelStyle === 'spellStoring' ? '' : ' [' + cr + (b.holdCharge ? ', Hold Charge' : '') + ']');
        }
        if (cm === 'rangedChannel') return 'Ranged Channel (Imbue Arrow — Deliver Spell via Ranged Hit)';
        if (cm === 'fullAttackCast') return 'Spell Combat: Full Attack + Cast Spell (' + sgn(num(b.atkPenalty, -2)) + ' All Atk' + (b.offHandFree ? ', Off-Hand Free' : '') + ')';
        return 'Cast Mod (' + metamagicCostText(b) + ') → ' + metamagicTxText(b) + (b.appliesTo ? ' [' + b.appliesTo + ']' : '');
      }
      case 'stat': {
        const mode = modMode(b);
        const t = (b.targets || []).map((x) => (mode === 'replaceStat' ? replaceStatTargetLabel(x) : targetLabel(x))).join(', ') || '(no target)';
        if (mode === 'replaceStat') return replaceStatSummary(b, t);
        const v = mode === 'perCL'
          ? '+' + num(b.value, 1) + ' per ' + num(b.per, 1) + ' CL (min +' + num(b.min, 0) + ', max +' + num(b.max, 5) + ')'
          : mode === 'stat' ? statFormulaText(b) : sgn(num(b.value));
        return v + ' ' + (b.btype || 'Untyped') + ' → ' + t + (b.condition ? ' (' + b.condition + ')' : '');
      }
      case 'roll': return rollBlockText(b);
      case 'attack': {
        const am = b.attackMode || 'natural';
        if (am === 'weaponImbue') {
          const bud = b.budgetScaling === 'flat' ? '+' + num(b.maxBudget, 5) : '+1 at L1, +1/4 Lvls (max +' + num(b.maxBudget, 5) + ')';
          return 'Weapon Imbue (' + (b.duration || '1 min') + '): ' + bud + (b.allowedEnchs ? ' [' + b.allowedEnchs + ']' : '');
        }
        const cnt = Math.max(1, num(b.count, 1));
        if (am === 'extra') {
          if (b.extraKind === 'flurry') return '+' + cnt + ' Extra Attack (' + sgn(num(b.penalty, -2)) + ' All Atk)' + (b.rider ? ' • ' + b.rider : '');
          return '+' + cnt + ' Extra Attack (Full BAB)' + (b.rider ? ' • ' + b.rider : '');
        }
        const kLbl = b.natKind === 'secondary' ? 'Secondary -5, ½ Str' : b.natKind === 'primary2h' ? 'Primary 1.5× Str' : 'Primary';
        return cnt + '× ' + (b.weaponName || 'Claw') + ' (' + (b.dice || '1d4') + ' ' + (b.dmgType || 'B/P/S') + ', ' + kLbl + ')' + (b.rider ? ' • ' + b.rider : '');
      }
      case 'defense': {
        if (b.mode === 'Size Change') return 'Size: ' + (SIZE_STEPS[String(b.steps)] || (sgn(num(b.steps, 1)) + ' categories'));
        if (b.mode === 'State Flag') return 'State: ' + (LOCK_LABEL[b.flag] || b.flag);
        if (b.mode === 'Spell Resistance') return 'SR ' + (b.srMode === 'level' ? '10 + @level' : num(b.value, 15));
        if (b.mode === 'Concealment %') return num(b.value, 20) + '% Concealment Miss Chance';
        if (b.mode === 'DR') return 'DR ' + num(b.value, 5) + '/' + (b.what || '-');
        if (b.mode === 'Energy Resistance') return 'Resist ' + (b.what || 'Fire') + ' ' + num(b.value, 10);
        return b.mode + ': ' + (b.what || '');
      }
      case 'effect': {
        const ek = b.effectKind || 'rule';
        if (ek === 'castSpell') {
          const what = b.castMode === 'ownSlotUpTo'
            ? 'Cast Self Spell (Own Slot ≤ Lvl ' + num(b.maxSpellLvl, 2) + ')'
            : b.castMode === 'freeBuffList'
              ? 'Free Buff (' + (b.spellOptions || 'Blur, Haste') + ')'
              : 'Cast ' + (b.spellName || 'Spell');
          return what + (b.tiedDuration ? ' [Tied Duration]' : '');
        }
        if (ek === 'recoverSlot') return 'Recover Expended Slot / Maneuver (≤ Lvl ' + num(b.maxSpellLvl, 6) + ', ' + (b.targetPoolOrClass || 'Spell') + ')';
        if (ek === 'stealStore') return 'Steal / Drain Spell (' + (b.maxLvlFormula || '≤ ⅓ Class Lvl') + ') → @' + slug(b.bufferVar || 'stolen_lvl');
        if (ek === 'grantFeat') return 'Grant ' + (b.floatingDaily ? 'Floating Daily ' : 'Bonus ') + 'Feat (' + (b.featOrPool || '#General') + ')';
        if (ek === 'castEvolution') return 'Cast Nature → ' + (b.castNature || 'Supernatural (Su, No SR/AoO)');
        return b.text || 'Rule effect (empty)';
      }
      default: return b.type;
    }
  }

  // --------------------------------------------------------------------------
  // 4b. 37 Curated Benchmark Presets (Pure Lego Core V3)
  // --------------------------------------------------------------------------
  function spellBase(name, src, classes, school, desc, comps, env) {
    const e = blankEntry('spell');
    Object.assign(e, { name: name, source: src, text: desc });
    Object.assign(e.spell, { system: 'spell', classes: classes.map((c) => ({ cls: c[0], lvl: c[1] })), school: school, descriptors: env.desc || [], comps: Object.assign({ V: false, S: false, M: false, F: false, DF: false, XP: false }, comps) });
    Object.assign(e.delivery, { action: env.action || 'Standard', range: env.range || 'Touch', area: env.area || '', sr: env.sr || 'Yes (harmless)' });
    e.delivery.save = Object.assign(e.delivery.save, env.save || { type: 'None', effect: 'Negates' });
    Object.assign(e.lifecycle, env.life || {});
    return e;
  }

  const PRESETS = [
    { id: 'hourglass', icon: '⏳', label: 'Chronos Hourglass (DM Relic: 3/day Reroll + 1/day Replay Turn)', build() {
      const e = blankEntry('wondrous');
      Object.assign(e, { name: 'Chronos Hourglass', source: 'DM Relic (Homebrew)', tags: ['#DMGrant', '#Relic'], text: 'A palm-sized hourglass of star-glass whose sand flows upward. Bound to a single wielder by the DM.' });
      Object.assign(e.item, { subtype: 'Artifact / Relic', slot: 'Held', consumable: false, price: 0, cl: 20 });
      e.effects = [BLK('stat', { targets: ['initiative'], value: 2, btype: 'Insight' })];
      e.powers = [
        blankPower('inline', { name: 'Rewind the Die', action: 'Immediate', use: Object.assign(blankUse('perDay'), { n: 3 }), cl: 20, duration: 'Instantaneous', range: '30 ft.', text: 'After any d20 roll made by you or an ally within 30 ft. is revealed, force a reroll. The new result must be used.' }),
        blankPower('inline', { name: 'Replay Turn', action: 'Immediate', use: Object.assign(blankUse('perDay'), { n: 1 }), cl: 20, duration: 'Instantaneous', range: 'Personal', text: 'At the end of your turn, rewind time to the start of that turn. You retain knowledge of what happened; all other effects are undone.' })
      ];
      return e; } },
    { id: 'cloak', icon: '🧥', label: "War Wizard's Cloak (Passive Saves + Feather Fall At-Will + Dimension Door 1/day + Arcane Blast)", build() {
      const e = blankEntry('wondrous');
      Object.assign(e, { name: "War Wizard's Cloak", source: 'Homebrew (MIC-style)', tags: ['#Arcane'], text: 'A battle-scarred cloak of storm-grey silk stitched with abjuration sigils.' });
      Object.assign(e.item, { subtype: 'Wondrous Item', slot: 'Shoulders / Cloak', consumable: false, price: 32000, cl: 9 });
      e.effects = [
        BLK('stat', { targets: ['save.all'], value: 2, btype: 'Resistance' }),
        BLK('stat', { targets: ['save.will'], value: 2, btype: 'Insight', condition: 'vs Enchantment spells' })
      ];
      const ff = CAT.spells.find((s) => s.name === 'Feather Fall'), dd = CAT.spells.find((s) => s.name === 'Dimension Door');
      e.powers = [
        blankPower('attached', { name: 'Feather Fall', ref: spellRef(ff), action: 'Free', use: blankUse('atwill'), cl: 9, grantMode: 'cast' }),
        blankPower('attached', { name: 'Dimension Door', ref: spellRef(dd), action: 'Standard', use: Object.assign(blankUse('perDay'), { n: 1 }), cl: 9, grantMode: 'cast' }),
        blankPower('inline', { name: 'Arcane Blast', action: 'Standard', use: Object.assign(blankUse('perDay'), { n: 3 }), cl: 9, attack: 'ranged-touch', attackOn: true, range: '60 ft.', duration: 'Instantaneous',
          effects: [BLK('roll', { kind: 'Damage', count: 1, die: 'd6', dmgType: 'Force', scaling: 'perCL', amount: 1, per: 2, start: 1, max: 5 })], text: 'A bolt of raw force leaps from the cloak’s clasp.' })
      ];
      return e; } },
    { id: 'katana', icon: '⚔️', label: '+2 Keen Flaming Burst Adamantine Katana + Truedeath Crystal', build() {
      const e = blankEntry('weapon');
      Object.assign(e, { source: 'DMG / Oriental Adventures / MIC', tags: ['#Weapon'] });
      e.chassis = blankChassis('weapon', 'katana');
      Object.assign(e.chassis, { material: 'adamantine', enhancement: 2, enchantments: ['keen', 'flaming_burst'], crystal: { id: crystalIdByName('Truedeath Crystal'), tier: 'least' } });
      e.effects = [BLK('roll', { kind: 'Damage', count: 1, die: 'd4', dmgType: 'Precision', crit: 'normal', condition: 'when flanking (custom chip)' })];
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
      Object.assign(e.spell, { system: 'spell', classes: [{ cls: 'Sor/Wiz', lvl: 3 }], school: 'Evocation', descriptors: ['Fire'], comps: { V: true, S: true, M: true, F: false, DF: false, XP: false } });
      Object.assign(e.delivery, { action: 'Standard', range: 'Long (400 ft. + 40 ft./level)', area: '20-ft.-radius Spread', attack: 'none', sr: 'Yes' });
      e.delivery.save = { type: 'Reflex', effect: 'Half', dcMode: 'spell', stat: 'int', flat: 15 };
      e.lifecycle.duration = 'instant';
      e.effects = [BLK('roll', { kind: 'Damage', count: 1, die: 'd6', dmgType: 'Fire', scaling: 'perCL', amount: 1, per: 1, start: 1, max: 10, save: 'Reflex half' })];
      return e; } },
    { id: 'scorching', icon: '🔮', label: 'Scorching Ray (Ranged Touch, 4d6 Fire, +1 ray per 4 CL)', build() {
      const e = blankEntry('spell');
      Object.assign(e, { name: 'Scorching Ray', source: 'PHB p.274', tags: ['#Fire'], text: 'Blast enemies with fiery rays: one ray, plus one additional ray for every four levels beyond 3rd (maximum three rays at 11th level).' });
      Object.assign(e.spell, { system: 'spell', classes: [{ cls: 'Sor/Wiz', lvl: 2 }], school: 'Evocation', descriptors: ['Fire'], comps: { V: true, S: true, M: false, F: false, DF: false, XP: false } });
      Object.assign(e.delivery, { action: 'Standard', range: 'Close (25 ft. + 5 ft./2 levels)', area: 'One or more rays', attack: 'ranged-touch', attackOn: true, sr: 'Yes' });
      e.delivery.extras = [{ id: uid('x'), kind: 'rays', text: '+1 ray per 4 CL beyond 3rd (max 3 rays at CL 11)' }];
      e.effects = [BLK('roll', { kind: 'Damage', count: 4, die: 'd6', dmgType: 'Fire', scaling: 'flat' })];
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
      e.lifecycle.use = Object.assign(blankUse('cooldown'), { cooldown: '1d4+1' });
      e.effects = [BLK('roll', { kind: 'Damage', count: 6, die: 'd8', dmgType: 'Acid', scaling: 'flat', save: 'Reflex half' })];
      return e; } },
    { id: 'curse', icon: '🩸', label: 'Bestow Curse / Energy Drain (Stackable Debuff)', build() {
      const e = blankEntry('buff');
      Object.assign(e, { name: 'Bestow Curse / Energy Drain', source: 'PHB', tags: ['#Curse'] });
      e.effects = [
        BLK('stat', { targets: ['atk.all', 'save.all', 'skill.all'], value: -4, btype: 'Penalty' }),
        BLK('defense', { mode: 'State Flag', flag: 'negLevel' })
      ];
      Object.assign(e.lifecycle, { duration: 'permanent', stackable: true, maxStacks: 5 });
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
      return e; } },
    { id: 'gheroism', icon: '✨', label: 'Greater Heroism (+4 Morale, Fear Immunity, Temp HP per CL)', build() {
      const e = spellBase('Greater Heroism', 'PHB p.240', [['Brd', 5], ['Sor/Wiz', 6]], 'Enchantment', 'Imbues a creature with great bravery and morale in battle.', { V: true, S: true }, { desc: ['Mind-Affecting'], range: 'Touch', area: 'Creature touched', save: { type: 'Will', effect: 'Negates (harmless)' }, life: { duration: 'minPerLevel', durValue: 1 } });
      e.effects = [
        BLK('stat', { targets: ['atk.all', 'save.all', 'skill.all'], value: 4, btype: 'Morale' }),
        BLK('defense', { mode: 'Immunity', what: 'Fear' }),
        BLK('roll', { kind: 'Temp HP', count: 0, die: 'flat', scaling: 'perCL', amount: 1, per: 1, start: 1, max: 20 })
      ];
      return e; } },
    { id: 'aid', icon: '💚', label: 'Aid (+1 Morale, 1d8 + 1/CL Temp HP)', build() {
      const e = spellBase('Aid', 'PHB p.196', [['Clr', 2], ['Good', 2], ['Luck', 2]], 'Enchantment', 'The subject gains a +1 morale bonus on attack rolls and saves against fear effects, plus temporary hit points equal to 1d8 + caster level (maximum +10 at 10th).', { V: true, S: true, DF: true }, { desc: ['Mind-Affecting'], range: 'Touch', area: 'Living creature touched', save: { type: 'None', effect: 'Negates' }, life: { duration: 'minPerLevel', durValue: 1 } });
      e.effects = [
        BLK('stat', { targets: ['atk.all'], value: 1, btype: 'Morale' }),
        BLK('stat', { targets: ['save.all'], value: 1, btype: 'Morale', condition: 'vs Fear' }),
        BLK('roll', { kind: 'Temp HP', count: 1, die: 'd8', scaling: 'perCL', amount: 1, per: 1, start: 1, max: 10 })
      ];
      return e; } },
    { id: 'dfavor', icon: '⚔️', label: 'Divine Favor (+1 Luck per 3 CL, max +3)', build() {
      const e = spellBase('Divine Favor', 'PHB p.224', [['Clr', 1], ['Pal', 1]], 'Evocation', 'You gain a +1 luck bonus on attack and weapon damage rolls for every three caster levels (minimum +1, maximum +3).', { V: true, S: true, DF: true }, { range: 'Personal', area: 'You', sr: 'No', life: { duration: 'text', durText: '1 minute' } });
      e.effects = [BLK('stat', { targets: ['atk.all', 'dmg.all'], mode: 'perCL', value: 1, btype: 'Luck', per: 3, min: 1, max: 3, condition: 'weapon damage' })];
      return e; } },
    { id: 'rmight', icon: '🛡️', label: 'Righteous Might (Size +1, CL Tier DR C-Block)', build() {
      const e = spellBase('Righteous Might', 'PHB p.273', [['Clr', 5], ['Strength', 5]], 'Transmutation', 'You grow to Large size, gaining +4 size bonuses to Strength and Constitution, +2 enhancement bonus to natural armor, and damage reduction based on caster level.', { V: true, S: true, DF: true }, { range: 'Personal', area: 'You', sr: 'No', life: { duration: 'roundsPerLevel', durValue: 1, dismissible: true } });
      e.effects = [
        BLK('defense', { mode: 'Size Change', steps: 1 }),
        BLK('stat', { targets: ['str', 'con'], value: 4, btype: 'Size' }),
        BLK('stat', { targets: ['ac.natural'], value: 2, btype: 'Enhancement' }),
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'levelTier', condText: 'CL ≤ 11', kids: [BLK('defense', { mode: 'DR', value: 3, what: 'evil or good' })] }),
          blankBranch({ condKind: 'levelTier', condText: 'CL 12–14', kids: [BLK('defense', { mode: 'DR', value: 6, what: 'evil or good' })] }),
          blankBranch({ condKind: 'levelTier', condText: 'CL ≥ 15', kids: [BLK('defense', { mode: 'DR', value: 9, what: 'evil or good' })] })
        ] })
      ];
      return e; } },
    { id: 'prismatic', icon: '🎯', label: 'Prismatic Spray (1d8 Roll Table C-Block)', build() {
      const e = spellBase('Prismatic Spray', 'PHB p.264', [['Sor/Wiz', 7]], 'Evocation', 'Seven shimmering rays spring from your hand. Creatures of 8 HD or less are blinded for 2d4 rounds. Each creature is struck by one or more rays.', { V: true, S: true }, { range: '60 ft.', area: 'Cone-shaped burst', sr: 'Yes', save: { type: 'None', effect: 'Negates' }, life: { duration: 'instant' } });
      const R = (roll, kids) => ({ id: uid('r'), roll: roll, kids: kids });
      e.effects = [
        BLK('effect', { effectKind: 'rule', text: 'Every creature of 8 HD or less in the area is blinded for 2d4 rounds.' }),
        BLK('table', { die: '1d8', rows: [
          R('1', [BLK('roll', { kind: 'Damage', count: 20, die: 'flat', dmgType: 'Fire', save: 'Reflex half' })]),
          R('2', [BLK('roll', { kind: 'Damage', count: 40, die: 'flat', dmgType: 'Acid', save: 'Reflex half' })]),
          R('3', [BLK('roll', { kind: 'Damage', count: 80, die: 'flat', dmgType: 'Electricity', save: 'Reflex half' })]),
          R('4', [BLK('effect', { effectKind: 'rule', text: 'Green — Poison: dies (Fortitude partial: 1d6 Con damage instead)' })]),
          R('5', [BLK('effect', { effectKind: 'rule', text: 'Blue — Turned to stone (Fortitude negates)' })]),
          R('6', [BLK('effect', { effectKind: 'rule', text: 'Indigo — Insane, as insanity spell (Will negates)' })]),
          R('7', [BLK('effect', { effectKind: 'rule', text: 'Violet — Sent to another plane (Will negates)' })]),
          R('8', [BLK('effect', { effectKind: 'rule', text: 'Struck by two rays; roll twice more, ignoring any further 8 results' })])
        ] })
      ];
      return e; } },
    { id: 'primal', icon: '✨', label: 'Primal Senses (+5 Listen/Spot, Low-Light, Synergy C-Block)', build() {
      const e = spellBase('Primal Senses', 'Dragon Magic p.71', [['Drd', 3], ['Rgr', 3], ['Sor/Wiz', 3]], 'Transmutation', 'Low-light vision and +5 competence bonus on Listen and Spot checks. Combined with another Primal spell you gain uncanny dodge.', { V: true, S: true }, { range: 'Personal', area: 'You', sr: 'No', life: { duration: 'text', durText: '24 hours' } });
      e.tags = ['#Primal'];
      e.effects = [
        BLK('stat', { targets: ['skill.listen', 'skill.spot'], value: 5, btype: 'Competence' }),
        BLK('defense', { mode: 'Sense / Movement', what: 'Low-Light Vision' }),
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'synergy', condText: '2+ active #Primal effects', kids: [
            BLK('stat', { targets: ['initiative'], value: 5, btype: 'Competence' }),
            BLK('defense', { mode: 'Sense / Movement', what: 'Uncanny Dodge' })
          ] })
        ] })
      ];
      return e; } },
    { id: 'searing', icon: '✨', label: 'Searing Spell (Metamagic Feat: +1 Slot, Pierce Fire Resist/Immunity)', build() {
      const e = blankEntry('feat');
      Object.assign(e, { name: 'Searing Spell', source: 'Sandstorm p.53', tags: ['#Metamagic'], text: 'A searing spell is so hot that it ignores fire resistance and deals half damage even to creatures immune to fire.' });
      e.effects = [BLK('carrier', { carrierMode: 'metamagic', costMode: 'slot', slotAdj: 1, transform: 'pierceRes', energy: 'Fire', appliesTo: '[Fire] spells' })];
      return e; } },
    { id: 'rod_quicken', icon: '⚡', label: 'Metamagic Rod of Quicken, Lesser (3/day Swift Cast up to 3rd Lvl)', build() {
      const e = blankEntry('wondrous');
      Object.assign(e, { name: 'Metamagic Rod of Quicken, Lesser', source: 'DMG p.236', tags: ['#Metamagic', '#Arcane'], text: 'The wielder can cast up to three spells per day of up to 3rd level that are quickened as though using the Quicken Spell feat.' });
      Object.assign(e.item, { subtype: 'Rod', slot: 'Held', consumable: false, price: 35000, cl: 17 });
      e.effects = [BLK('carrier', { carrierMode: 'metamagic', costMode: 'rod', uses: 3, maxSpellLvl: 3, transform: 'quicken', appliesTo: 'Spells up to 3rd level' })];
      return e; } },
    { id: 'magebane', icon: '✨', label: 'Magebane (+1 Weapon Enchantment, +2d6 vs Arcane Casters)', build() {
      const e = blankEntry('item_mod');
      Object.assign(e, { name: 'Magebane', source: 'Complete Arcane / MIC p.38', tags: ['#Weapon'], text: 'Against creatures capable of casting arcane spells or using invocations, the weapon’s enhancement bonus is +2 better and it deals +2d6 extra damage.' });
      Object.assign(e.itemMod, { kind: 'enchantment', on: 'weapon', costMode: 'plus', plus: 1, keen: false, badge: '+2 Enh & +2d6 vs Arcane Casters' });
      e.effects = [BLK('roll', { kind: 'Damage', count: 2, die: 'd6', dmgType: 'Untyped', crit: 'normal', condition: 'vs Arcane Casters' })];
      return e; } },
    { id: 'kaorti', icon: '✨', label: 'Kaorti Resin (Special Material, Crit ×4)', build() {
      const e = blankEntry('item_mod');
      Object.assign(e, { name: 'Kaorti Resin', source: 'Fiend Folio p.108', tags: ['#Weapon'], text: 'Piercing or slashing weapons crafted from Kaorti resin deal ×4 damage on a critical hit.' });
      Object.assign(e.itemMod, { kind: 'material', on: 'weapon' });
      Object.assign(e.itemMod.mat, { critMultOverride: 4, weaponGp: 500, lightGp: 0, medGp: 0, heavyGp: 0, drBypass: '' });
      return e; } },
    { id: 'whisper_gnome', icon: '🧬', label: 'Whisper Gnome (Races of Stone — Small Humanoid, +4 Hide/Move Silently)', build() {
      const e = blankEntry('race');
      Object.assign(e, { name: 'Whisper Gnome', source: 'Races of Stone p.94', tags: [], text: 'Stealthy subterranean gnomes with 30-ft. speed, Darkvision 60 ft., Low-Light Vision, and innate silence.' });
      Object.assign(e.race, { kind: 'race', size: 'Small', creatureType: 'Humanoid', subtype: 'Gnome', speed: 30, favoredClass: 'Rogue' });
      e.effects = [
        BLK('stat', { targets: ['dex', 'con'], value: 2, btype: 'Racial' }),
        BLK('stat', { targets: ['str', 'cha'], value: -2, btype: 'Racial' }),
        BLK('stat', { targets: ['skill.hide', 'skill.move_silently'], value: 4, btype: 'Racial' }),
        BLK('stat', { targets: ['skill.listen', 'skill.spot'], value: 2, btype: 'Racial' }),
        BLK('defense', { mode: 'Sense / Movement', what: 'Darkvision 60 ft.' }),
        BLK('defense', { mode: 'Sense / Movement', what: 'Low-Light Vision' })
      ];
      e.powers = [blankPower('inline', { name: 'Silence (SLA)', action: 'Standard', use: Object.assign(blankUse('perDay'), { n: 1 }), cl: 1, duration: '1 min./level', range: 'Touch', text: 'Cast silence centered on yourself 1/day as a spell-like ability.' })];
      return e; } },
    { id: 'half_dragon', icon: '🧬', label: 'Half-Dragon Template (LA +3, +8 Str/+4 Nat Armor, Fire Immunity, Breath Weapon)', build() {
      const e = blankEntry('race');
      Object.assign(e, { name: 'Half-Dragon', source: 'MM p.146', tags: ['#Draconic'], text: 'Inherited template. Type changes to Dragon; gains wings (60 ft. average) at Large+ or as granted, +4 natural armor, energy immunity, and 1/day 6d8 breath weapon.' });
      Object.assign(e.race, { kind: 'template', timing: 'Inherited', size: 'Medium', creatureType: 'Dragon', subtype: 'Augmented', speed: 30, flySpeed: 60, flyMan: 'Average', la: 3, rhdCount: 0, rhdDie: 12, favoredClass: 'Any' });
      e.effects = [
        BLK('stat', { targets: ['str'], value: 8, btype: 'Racial' }),
        BLK('stat', { targets: ['con', 'int', 'cha'], value: 2, btype: 'Racial' }),
        BLK('stat', { targets: ['ac.natural'], value: 4, btype: 'Natural Armor' }),
        BLK('attack', { attackMode: 'natural', natKind: 'primary', count: 2, weaponName: 'Claw', dice: '1d4', dmgType: 'B & S', rider: '' }),
        BLK('attack', { attackMode: 'natural', natKind: 'secondary', count: 1, weaponName: 'Bite', dice: '1d6', dmgType: 'B, P & S', rider: '' }),
        BLK('defense', { mode: 'Immunity', what: 'Fire' }),
        BLK('defense', { mode: 'Immunity', what: 'Sleep' }),
        BLK('defense', { mode: 'Immunity', what: 'Paralysis' }),
        BLK('defense', { mode: 'Sense / Movement', what: 'Darkvision 60 ft.' }),
        BLK('defense', { mode: 'Sense / Movement', what: 'Low-Light Vision' })
      ];
      e.powers = [blankPower('inline', { name: 'Breath Weapon (Fire)', action: 'Standard', use: Object.assign(blankUse('perDay'), { n: 1 }), cl: 1, range: 'Personal', area: '30-ft. Cone', attackOn: false, save: { type: 'Reflex', effect: 'Half' }, dc: 15,
        effects: [BLK('roll', { kind: 'Damage', count: 6, die: 'd8', dmgType: 'Fire', scaling: 'flat', save: 'Reflex half' })],
        text: 'Once per day, exhale a 30-ft. cone of fire dealing 6d8 fire damage (Reflex DC 10 + 1/2 HD + Con mod half).' })];
      return e; } },
    { id: 'half_celestial', icon: '🧬', label: 'Half-Celestial Template (LA +4, Fly 60 ft., Ability Mods + HD 1–20 SLA Ladder)', build() {
      const e = blankEntry('race');
      Object.assign(e, { name: 'Half-Celestial', source: 'MM p.144', tags: ['#Template', '#Good', '#Celestial'], facets: ['identity', 'effects', 'powers', 'progression'],
        text: 'Inherited template. Type changes to Outsider (Good, Augmented); gains wings (Fly 60 ft. good), darkvision 60 ft., disease immunity, energy resistances, spell resistance (10 + HD, max 35), HD-scaling DR/magic, Smite Evil 1/day, and HD 1–20 spell-like abilities.' });
      Object.assign(e.race, { kind: 'template', timing: 'Inherited', size: 'Medium', creatureType: 'Outsider', subtype: 'Good, Augmented', speed: 30, flySpeed: 60, flyMan: 'Good', la: 4, favoredClass: 'Any' });
      e.effects = [
        BLK('stat', { targets: ['str', 'con', 'wis', 'cha'], value: 4, btype: 'Racial' }),
        BLK('stat', { targets: ['dex', 'int'], value: 2, btype: 'Racial' }),
        BLK('stat', { targets: ['save.fort'], value: 4, btype: 'Racial', condition: 'vs Poison' }),
        BLK('defense', { mode: 'Immunity', what: 'Disease' }),
        BLK('defense', { mode: 'Sense / Movement', what: 'Darkvision 60 ft.' }),
        BLK('defense', { mode: 'Energy Resistance', what: 'Acid', value: 10 }),
        BLK('defense', { mode: 'Energy Resistance', what: 'Cold', value: 10 }),
        BLK('defense', { mode: 'Energy Resistance', what: 'Electricity', value: 10 }),
        BLK('defense', { mode: 'Spell Resistance', srMode: 'level', value: 10 }),
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'levelTier', condText: 'HD 1–11', kids: [BLK('defense', { mode: 'DR', value: 5, what: 'magic' })] }),
          blankBranch({ condKind: 'levelTier', condText: 'HD ≥ 12', kids: [BLK('defense', { mode: 'DR', value: 10, what: 'magic' })] })
        ] })
      ];
      e.powers = [
        blankPower('inline', { name: 'Daylight (Sp)', action: 'Standard', use: blankUse('atwill'), cl: 1, range: 'Touch', duration: '10 min./level', text: 'Use daylight at will as a spell-like ability (CL = HD).' }),
        blankPower('inline', { name: 'Smite Evil (Su)', action: 'Free', use: Object.assign(blankUse('perDay'), { n: 1 }), range: 'Melee', text: 'Once per day, make a normal melee attack to deal extra damage equal to HD (max +20) against an evil foe.' })
      ];
      const p = e.progression;
      Object.assign(p, { mode: 'hd', maxLevel: 20 });
      const sla = (name, txt) => FEATURE(name, { kind: 'inline', abilityType: 'Sp', text: txt || 'Spell-like ability (CL = HD).' });
      p.levels[0].features = [sla('Protection from Evil (3/day, Sp)'), sla('Bless (1/day, Sp)')];
      p.levels[2].features = [sla('Aid (1/day, Sp)'), sla('Detect Evil (1/day, Sp)')];
      p.levels[4].features = [sla('Cure Serious Wounds (1/day, Sp)'), sla('Neutralize Poison (1/day, Sp)')];
      p.levels[6].features = [sla('Holy Smite (1/day, Sp)'), sla('Remove Disease (1/day, Sp)')];
      p.levels[8].features = [sla('Dispel Evil (1/day, Sp)')];
      p.levels[10].features = [sla('Holy Word (1/day, Sp)')];
      p.levels[12].features = [sla('Holy Aura (3/day, Sp)'), sla('Hallow (1/day, Sp)')];
      p.levels[14].features = [sla('Mass Charm Monster (1/day, Sp)')];
      p.levels[16].features = [sla('Summon Monster IX (Celestials Only, 1/day, Sp)')];
      p.levels[18].features = [sla('Resurrection (1/day, Sp)')];
      return e; } },
    { id: 'iron_heart_surge', icon: '⚔️', label: 'Iron Heart Surge (ToB: Iron Heart 3, Standard Action, Per Encounter)', build() {
      const e = blankEntry('spell');
      Object.assign(e, { name: 'Iron Heart Surge', source: 'Tome of Battle p.68', tags: ['#Tactical'], text: 'End one spell, effect, or other condition currently affecting you, and gain a +2 morale bonus on attack rolls until the end of your next turn.' });
      Object.assign(e.spell, { system: 'maneuver', maneuverType: 'Strike', discipline: 'Iron Heart', maneuverLvl: 3, prereqManeuvers: 1 });
      Object.assign(e.delivery, { action: 'Standard', range: 'Personal', area: 'You', sr: 'No' });
      Object.assign(e.lifecycle, { duration: 'rounds', durValue: 2 });
      e.lifecycle.use = Object.assign(blankUse('perEncounter'), { n: 1 });
      e.effects = [
        BLK('effect', { effectKind: 'rule', text: 'End one spell, effect, or condition with a duration of 1 or more rounds currently affecting you.' }),
        BLK('stat', { targets: ['atk.all'], value: 2, btype: 'Morale', condition: 'until end of next turn' })
      ];
      return e; } },
    { id: 'steadfast_grace', icon: '📜', label: 'Steadfast Determination / Divine Grace (Stat Replace + @CHA Saves)', build() {
      const e = blankEntry('feat');
      Object.assign(e, { name: 'Steadfast Determination / Divine Grace', source: 'PHB II p.83 / PHB p.44', tags: ['#General', '#Divine'], text: 'Use your Constitution modifier instead of Wisdom on Will saves, and add your Charisma modifier to all saving throws.' });
      e.effects = [
        BLK('stat', { targets: ['save.will'], mode: 'replaceStat', subOp: 'replace', fromStat: 'wis', toStat: 'con' }),
        BLK('stat', { targets: ['save.all'], mode: 'stat', stat: 'chaMod', mult: 1, cap: 'none', btype: 'Untyped' })
      ];
      return e; } },
    { id: 'arcane_strike', icon: '📜', label: 'Arcane Strike (Complete Warrior p.96 — Resource Dial @arcane_strike)', build() {
      const e = blankEntry('feat');
      Object.assign(e, { name: 'Arcane Strike', source: 'Complete Warrior p.96', tags: ['#General', '#Arcane'], text: 'Sacrifice a spell slot of level X as a free action to gain +X on melee attack rolls and +Xd4 bonus damage for 1 round.' });
      e.prereqs = [
        { id: uid('p'), alts: [ALT({ kind: 'bab', min: 1 })] },
        { id: uid('p'), alts: [ALT({ kind: 'spellcasting', cls: 'arcane', min: 3 })] }
      ];
      e.effects = [
        BLK('resource', { name: 'Arcane Strike', varKey: 'arcane_strike', resMode: 'dial', maxMode: 'spellLvl', dialCost: 'spellSlot', reset: 'atWill' }),
        BLK('stat', { targets: ['atk.melee'], mode: 'stat', stat: 'arcane_strike', mult: 1, btype: 'Untyped' }),
        BLK('roll', { kind: 'Damage', count: 0, die: 'd4', dmgType: 'Untyped', scaling: 'perVar', varKey: 'arcane_strike', varMode: 'dice' })
      ];
      return e; } },
    { id: 'lion_totem', icon: '⚡', label: 'Spirit Lion Totem Barbarian ACF (Complete Champion p.46 — Pounce Ex)', build() {
      const e = blankEntry('feat');
      Object.assign(e, { name: 'Spirit Lion Totem', featKind: 'acf', acf: { targetClass: 'Barbarian', level: 1, replaces: 'Fast Movement', race: '' }, source: 'Complete Champion p.46', tags: ['#Tactical'], text: 'You lose the barbarian fast movement ability and gain the pounce extraordinary ability (full attack at the end of a charge).' });
      e.prereqs = [];
      e.effects = [BLK('defense', { mode: 'Sense / Movement', what: 'Pounce (Full Attack on Charge)' })];
      return e; } },
    { id: 'bloodrager', icon: '🩸', label: 'Bloodrager Class 1–20: Bloodrage Resource, On-Enter Spell Cast, While-Bloodraging Stats/Claws/Free Buffs', build() {
      const e = blankEntry('class');
      Object.assign(e, {
        name: 'Bloodrager', source: 'ACG / Hybrid 3.5e', tags: ['#HybridClass', '#Arcane', '#Rage'],
        text: 'Arcane rage hybrid class combining full BAB, d10 HD, Bloodrage with bloodline claws, Cast in Rage, and spontaneous 1st–4th arcane bloodcasting.'
      });
      const p = e.progression;
      Object.assign(p, {
        mode: 'base', maxLevel: 20, hitDie: 10, bab: 'full', skillPts: 4,
        good: { fort: true, ref: false, will: false },
        classSkills: ['Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Jump', 'Knowledge', 'Listen', 'Ride', 'Spellcraft', 'Spot', 'Survival', 'Swim'],
        caster: { mode: 'halfSpont', clFormula: 'full', clCustom: '', tradition: 'Arcane', ability: 'cha', spellList: 'Bloodrager', ignoreAsf: 'light', ignoreShieldAsf: false, castInRage: true }
      });
      p.levels.forEach((l, i) => { l.spell = i >= 3; });
      const feat = (name, type, txt) => FEATURE(name, { kind: 'inline', abilityType: type || 'Ex', text: txt || '' });
      p.levels[0].features = [
        feat('Bloodrage', 'Su', 'Enter a bloodrage as a free action (+4 morale Str/Con, +2 morale Will, -2 AC).'),
        feat('Bloodline Claws', 'Su', 'Grow two primary 1d6 claws while bloodraging (magical at 4th level).'),
        feat('Fast Movement +10 ft.', 'Ex', '+10 ft. enhancement bonus to land speed in light, medium, or no armor.')
      ];
      p.levels[1].features = [feat('Uncanny Dodge', 'Ex', 'Retain Dexterity bonus to AC even if flat-footed or struck by an invisible attacker.')];
      p.levels[3].features = [
        feat('Bloodcasting', 'Ex', 'Cast Bloodrager spells while bloodraging without Concentration penalty from rage.'),
        feat('Arcane Bloodrage', 'Su', 'While bloodraging, gain a linked free buff from your arcane bloodline.'),
        feat('Eschew Materials', 'Ex', 'Bonus feat: cast spells without material components costing 1 gp or less.')
      ];
      p.levels[4].features = [feat('Improved Uncanny Dodge', 'Ex', 'Cannot be flanked except by a rogue 4+ levels higher.')];
      p.levels[6].features = [feat('DR 1/— (+1/3 Lvls)', 'Su', 'Damage reduction 1/— at 7th level, increasing by +1 every 3 levels thereafter.')];
      p.levels[7].features = [feat('True Arcane Bloodrage (Displacement/Haste)', 'Su', 'Upgrade Arcane Bloodrage free buff list with Displacement and Haste.')];
      p.levels[10].features = [feat('Greater Bloodrage (+6/+6/+3 & Free Self-Spell ≤ Lvl 2 on Enter)', 'Su', 'Bloodrage bonuses increase to +6/+6/+3 and auto-cast a self-only bloodrager spell (≤ 2nd level) on entry.')];
      p.levels[13].features = [feat('Indomitable Will', 'Ex', '+4 morale bonus on Will saves against enchantment spells while bloodraging.')];
      p.levels[16].features = [feat('Tireless Bloodrage', 'Ex', 'No longer fatigued when ending a bloodrage.')];
      p.levels[19].features = [feat('Mighty Bloodrage (+8/+8/+4 & Self-Spell ≤ Lvl 4)', 'Su', 'Bloodrage bonuses increase to +8/+8/+4 and auto-cast up to 4th-level self spell on entry.')];
      e.grants.featGrants = [6, 9, 12, 15, 18].map((lv) => ({ id: uid('g'), count: 1, pool: '#General', level: lv }));
      e.effects = [
        BLK('resource', { name: 'Bloodrage Rounds', varKey: 'bloodrage_rounds', resMode: 'spend', max: 2, scaling: 'twoPerLvlPlusMod', ability: 'con', reset: 'perDay' }),
        BLK('when', { flow: 'when', branches: [
          blankBranch({ trigger: 'enterState', targetText: 'Bloodrage', costKind: 'none', kids: [
            BLK('effect', { effectKind: 'castSpell', castMode: 'ownSlotUpTo', maxSpellLvl: 2, tiedDuration: true })
          ] })
        ] }),
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'state', condText: 'Bloodrage', kids: [
            BLK('stat', { targets: ['str', 'con'], value: 4, btype: 'Morale' }),
            BLK('stat', { targets: ['save.will'], value: 2, btype: 'Morale' }),
            BLK('stat', { targets: ['ac.total'], value: -2, btype: 'Penalty' }),
            BLK('attack', { attackMode: 'natural', natKind: 'primary', count: 2, weaponName: 'Claw', dice: '1d6', dmgType: 'Slashing', rider: 'Magical at Lvl 4' }),
            BLK('effect', { effectKind: 'castSpell', castMode: 'freeBuffList', spellOptions: 'Blur, Protection from Arrows, Resist Energy, Displacement, Haste', tiedDuration: true })
          ] })
        ] })
      ];
      return e; } },
    { id: 'magus', icon: '⚔️', label: 'Magus Class 1–20: Arcane Pool, Spellstrike Carrier, Spell Combat Carrier, Swift Imbue & Spell Recall', build() {
      const e = blankEntry('class');
      Object.assign(e, {
        name: 'Magus', source: 'UM / Hybrid 3.5e', tags: ['#HybridClass', '#Arcane', '#Gish'],
        text: 'Arcane sword-and-spell hybrid combining Spell Combat, Spellstrike through weapon critical threat range, Arcane Pool weapon imbuing, and Spell Recall.'
      });
      const p = e.progression;
      Object.assign(p, {
        mode: 'base', maxLevel: 20, hitDie: 8, bab: '3/4', skillPts: 2,
        good: { fort: true, ref: false, will: true },
        classSkills: ['Climb', 'Concentration', 'Craft', 'Intimidate', 'Knowledge', 'Profession', 'Ride', 'Spellcraft', 'Swim'],
        caster: { mode: 'sixthPrep', clFormula: 'full', clCustom: '', tradition: 'Arcane', ability: 'int', spellList: 'Magus', ignoreAsf: 'heavy', ignoreShieldAsf: false, castInRage: false }
      });
      p.levels.forEach((l) => { l.spell = true; });
      const feat = (name, type, txt) => FEATURE(name, { kind: 'inline', abilityType: type || 'Ex', text: txt || '' });
      p.levels[0].features = [
        feat('Arcane Pool', 'Su', 'Pool of points equal to ½ magus level + INT modifier (min 1) to enhance weapons and recall spells.'),
        feat('Spell Combat', 'Ex', 'Make a full attack and cast a magus spell in the same round at a -2 penalty to all attacks (requires free off-hand).'),
        feat('Cantrips', 'Sp', 'Prepare and cast 0-level magus spells at will.'),
        feat('Light Armor Casting', 'Ex', 'Ignore arcane spell failure while wearing light armor.')
      ];
      p.levels[1].features = [feat('Spellstrike', 'Su', 'Deliver a touch spell through a free melee weapon attack using the weapon’s threat range (spell ×2 on crit).')];
      p.levels[2].features = [feat('Magus Arcana', 'Su', 'Learn a specialized magus arcana at 3rd level and every 3 levels thereafter.')];
      p.levels[3].features = [feat('Spell Recall', 'Su', 'Spend Arcane Pool points equal to a spell’s level as a swift action to recall a cast spell.')];
      p.levels[4].features = [feat('Arcane Pool Properties', 'Su', 'Add weapon special properties (Flaming, Frost, Shock, Keen, Speed, etc.) via Arcane Pool.')];
      p.levels[6].features = [feat('Knowledge Pool', 'Su', 'Spend 1 Arcane Pool point to prepare a magus spell not in your spellbook for 1 day.'), feat('Medium Armor Casting', 'Ex', 'Ignore arcane spell failure while wearing medium armor.')];
      p.levels[7].features = [feat('Improved Spell Combat', 'Ex', '+2 circumstance bonus on Concentration checks when casting defensively during Spell Combat.')];
      p.levels[9].features = [feat('Fighter Training', 'Ex', 'Counts half magus level (full at 10th+ variants) as Fighter level for feat prerequisites.')];
      p.levels[10].features = [feat('Improved Spell Recall', 'Su', 'Recall spells by spending ½ spell level (min 1) Arcane Pool points, or prepare any spellbook spell.')];
      p.levels[12].features = [feat('Heavy Armor Casting', 'Ex', 'Ignore arcane spell failure while wearing heavy armor.')];
      p.levels[13].features = [feat('Greater Spell Combat', 'Ex', '+4 circumstance bonus on Concentration checks during Spell Combat.')];
      p.levels[15].features = [feat('Counterstrike', 'Ex', 'Make an attack of opportunity when an adjacent foe casts defensively.')];
      p.levels[18].features = [feat('Greater Spell Access', 'Ex', 'Add 14 wizard spells across levels 0–6 to your spellbook.')];
      p.levels[19].features = [feat('True Magus', 'Su', 'No attack penalty for Spell Combat, plus free Metamagic/DC boost.')];
      e.grants.featGrants = [5, 11, 17].map((lv) => ({ id: uid('g'), count: 1, pool: '#FighterBonus', level: lv }));
      e.effects = [
        BLK('resource', { name: 'Arcane Pool', varKey: 'arcane_pool', resMode: 'spend', max: 0, scaling: 'halfLvlPlusMod', ability: 'int', reset: 'perDay' }),
        BLK('carrier', { carrierMode: 'meleeChannel', channelStyle: 'spellstrikeFree', critRule: 'weaponRangeX2', holdCharge: true }),
        BLK('carrier', { carrierMode: 'fullAttackCast', atkPenalty: -2, offHandFree: true }),
        BLK('when', { flow: 'when', branches: [
          blankBranch({ trigger: 'activate', action: 'Swift', costKind: 'pool', costFormula: '1', poolName: 'Arcane Pool', kids: [
            BLK('attack', { attackMode: 'weaponImbue', duration: '1 min', budgetScaling: 'per4Lvl', maxBudget: 5, allowedEnchs: 'Dancing, Flaming, Flaming Burst, Frost, Icy Burst, Keen, Shock, Shocking Burst, Speed, Vorpal' })
          ] })
        ] }),
        BLK('when', { flow: 'when', branches: [
          blankBranch({ trigger: 'activate', action: 'Swift', costKind: 'pool', costFormula: 'Spell Level', poolName: 'Arcane Pool', kids: [
            BLK('effect', { effectKind: 'recoverSlot', maxSpellLvl: 6, targetPoolOrClass: 'Magus' })
          ] })
        ] })
      ];
      return e; } },
    { id: 'ur_priest', icon: '🏛️', label: 'Ur-Priest 1–10 (Complete Divine — Fast 1st–9th Divine Caster, Ur-Priest CL Formula, Steal SLA)', build() {
      const e = blankEntry('class');
      Object.assign(e, {
        name: 'Ur-Priest', source: 'Complete Divine p.70', tags: ['#Divine', '#Vile'],
        text: 'Blasphemous prestige class that siphons divine power from the gods to master 1st–9th level cleric spells in 10 levels.'
      });
      e.prereqs = [
        { id: uid('p'), alts: [ALT({ kind: 'alignment', align: 'Any Evil' })] },
        { id: uid('p'), alts: [ALT({ kind: 'save', text: 'Base Fort +3, Base Will +3', kind: 'custom' })] },
        { id: uid('p'), alts: [ALT({ kind: 'skill', skill: 'skill.knowledge', min: 5 }), ALT({ kind: 'skill', skill: 'skill.spellcraft', min: 8 })] },
        { id: uid('p'), alts: [ALT({ kind: 'feat', feat: 'Iron Will' })] },
        { id: uid('p'), alts: [ALT({ kind: 'feat', feat: 'Spell Focus' })] }
      ];
      const p = e.progression;
      Object.assign(p, {
        mode: 'prestige', maxLevel: 10, hitDie: 8, bab: '3/4', skillPts: 2,
        good: { fort: false, ref: false, will: true },
        classSkills: ['Bluff', 'Concentration', 'Craft', 'Decipher Script', 'Knowledge', 'Profession', 'Spellcraft'],
        caster: { mode: 'fast9', clFormula: 'urPriest', clCustom: '', tradition: 'Divine', ability: 'wis', spellList: 'Clr', ignoreAsf: 'heavy', ignoreShieldAsf: true, castInRage: false }
      });
      p.levels.forEach((l) => { l.spell = true; });
      const feat = (name, type, txt) => FEATURE(name, { kind: 'inline', abilityType: type || 'Ex', text: txt || '' });
      p.levels[1].features = [feat('Rebuke Undead', 'Su', 'Command or rebuke undead as an evil cleric of your Ur-Priest level.')];
      p.levels[3].features = [feat('Divine Spell Resistance 15', 'Ex', 'Gain SR 15 against divine spells and spell-like abilities of outsiders.')];
      p.levels[5].features = [feat('Siphon Spell Power', 'Su', 'Combine lower-level spell slots to cast a higher-level Ur-Priest spell 1/day.')];
      p.levels[7].features = [feat('Divine Spell Resistance 20', 'Ex', 'SR against divine spells increases to 20.')];
      p.levels[9].features = [feat('Steal Spell-Like Ability', 'Su', 'Steal a spell-like ability from a creature within 50 ft. for 24 hours.')];
      e.effects = [
        BLK('resource', { name: 'Stolen SLA Buffer', varKey: 'stolen_sla', resMode: 'buffer', scaling: 'halfLevel', max: 5, reset: 'perDay' }),
        BLK('when', { flow: 'when', branches: [
          blankBranch({ trigger: 'activate', action: 'Standard', costKind: 'perDay', costVal: 1, kids: [
            BLK('effect', { effectKind: 'stealStore', maxLvlFormula: '≤ ½ Ur-Priest CL', bufferVar: 'stolen_sla' })
          ] })
        ] })
      ];
      return e; } },
    { id: 'totemist_girallon', icon: '🦷', label: 'Girallon Arms (Magic of Incarnum — Soulmeld, Invest Essentia, Totem Chakra 4× Claw)', build() {
      const e = blankEntry('spell');
      Object.assign(e, {
        name: 'Girallon Arms', source: 'Magic of Incarnum p.68', tags: ['#Incarnum', '#NaturalAttack'],
        text: 'Four spectral blue-furred arms sheathe your limbs, boosting Climb and Grapple checks and granting four claw attacks when bound to your Totem chakra.'
      });
      Object.assign(e.spell, { system: 'soulmeld', chakraSlots: 'Arms / Totem', meldshaperList: 'Totemist', descriptors: [] });
      Object.assign(e.delivery, { action: 'Passive', range: 'Personal', area: 'You', sr: 'No' });
      Object.assign(e.lifecycle, { duration: 'permanent', use: blankUse('passive') });
      e.effects = [
        BLK('resource', { name: 'Essentia', varKey: 'essentia', resMode: 'invest', capMode: 'chakra', max: 4, scaling: 'flat', reset: 'atWill' }),
        BLK('stat', { targets: ['skill.climb', 'grapple'], mode: 'stat', value: 2, stat: 'essentia', mult: 2, btype: 'Competence' }),
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'bound', condText: 'Totem Chakra', kids: [
            BLK('attack', { attackMode: 'natural', natKind: 'primary', count: 1, weaponName: 'Claw (Primary)', dice: '1d4', dmgType: 'B & S', rider: '+@essentia Enh on Atk/Dmg' }),
            BLK('attack', { attackMode: 'natural', natKind: 'secondary', count: 3, weaponName: 'Extra Claws', dice: '1d4', dmgType: 'B & S', rider: 'Rend 2d4 + 2×Str on 2+ hits' })
          ] })
        ] })
      ];
      return e; } },
    { id: 'binder_naberius', icon: '🔮', label: 'Naberius, the Grinning Hound (Tome of Magic — Vestige Lvl 1, 5-Round Cooldown Command)', build() {
      const e = blankEntry('spell');
      Object.assign(e, {
        name: 'Naberius, the Grinning Hound', source: 'Tome of Magic p.41', tags: ['#Pact', '#Vestige'],
        text: 'First-level vestige granting silver-tongued diplomacy, fast ability score healing, and command on a 5-round cooldown.'
      });
      Object.assign(e.spell, { system: 'vestige', vestigeLvl: 1, bindingDc: 15, vestigeSign: ' gravelly voice', descriptors: ['Language-Dependent', 'Mind-Affecting'] });
      Object.assign(e.delivery, { action: 'Standard', range: 'Close (25 ft. + 5 ft./2 levels)', area: 'One living creature', sr: 'Yes' });
      Object.assign(e.lifecycle, { duration: 'permanent', use: Object.assign(blankUse('cooldown'), { cooldown: '5' }) });
      e.effects = [
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'bound', condText: 'Vestige Pact (Naberius)', kids: [
            BLK('effect', { effectKind: 'rule', text: 'Faster Ability Healing: Heal 1 point of ability damage per round and 1 point of ability drain per hour.' }),
            BLK('stat', { targets: ['skill.bluff', 'skill.diplomacy', 'skill.disguise'], value: 4, btype: 'Competence', condition: 'Take 10 allowed even when rushed' })
          ] })
        ] }),
        BLK('when', { flow: 'when', branches: [
          blankBranch({ trigger: 'activate', action: 'Standard', costKind: 'cooldown', cooldownText: '5 rounds', kids: [
            BLK('effect', { effectKind: 'castSpell', castMode: 'linkedSpell', spellName: 'Command', tiedDuration: false })
          ] })
        ] })
      ];
      return e; } },
    { id: 'psionic_energy_ray', icon: '⚡', label: 'Energy Ray (XPH — Psionic Psychokinesis 1, Augment PP Dial, 1d6 + @augment_pp d6)', build() {
      const e = blankEntry('spell');
      Object.assign(e, {
        name: 'Energy Ray', source: 'Expanded Psionics Handbook p.103', tags: ['#Fire', '#Cold', '#Electricity', '#Sonic'],
        text: 'Create a ray of your chosen energy type (Cold, Electricity, Fire, or Sonic) that shoots forth from your fingertip and strikes a target within Close range.'
      });
      Object.assign(e.spell, { system: 'psionic', discipline: 'Psychokinesis', maneuverLvl: 1, ppCost: 1, augmentable: true, descriptors: ['Fire', 'Cold', 'Electricity', 'Sonic'] });
      Object.assign(e.delivery, { action: 'Standard', range: 'Close (25 ft. + 5 ft./2 levels)', area: 'Ray', attack: 'ranged-touch', attackOn: true, sr: 'Yes' });
      Object.assign(e.lifecycle, { duration: 'instant', use: Object.assign(blankUse('resourcePool'), { pool: 'Psionic Power Points', poolCost: 1 }) });
      e.effects = [
        BLK('resource', { name: 'Augment PP', varKey: 'augment_pp', resMode: 'dial', maxMode: 'level', dialCost: 'pool', costPool: 'Psionic Power Points', reset: 'atWill' }),
        BLK('roll', { kind: 'Damage', count: 1, die: 'd6', dmgType: 'Fire', scaling: 'perVar', varKey: 'augment_pp', varMode: 'dice', crit: 'multiply' })
      ];
      return e; } },
    { id: 'truenamer_word', icon: '📜', label: 'Word of Nurturing, Lesser (Tome of Magic — Utterance, Law of Resistance @uses_today, Truespeak DC)', build() {
      const e = blankEntry('spell');
      Object.assign(e, {
        name: 'Word of Nurturing, Lesser', source: 'Tome of Magic p.245', tags: ['#Truename'],
        text: 'Normal: Grant target Fast Healing 5 for 5 rounds. Reverse: Tear flesh for 2d6 acid damage per round.'
      });
      Object.assign(e.spell, { system: 'utterance', lexicon: 'Evolving Mind', maneuverLvl: 2, descriptors: [] });
      Object.assign(e.delivery, { action: 'Standard', range: '60 ft.', area: 'One creature', sr: 'Yes' });
      Object.assign(e.lifecycle, { duration: 'rounds', durValue: 5, use: blankUse('atwill') });
      e.effects = [
        BLK('resource', { name: 'Law of Resistance', varKey: 'uses_today', resMode: 'spend', max: 20, scaling: 'flat', reset: 'perDay' }),
        BLK('when', { flow: 'when', branches: [
          blankBranch({ trigger: 'activate', action: 'Standard', costKind: 'skillCheck', checkFormula: 'Truespeak DC 15 + 2×CR + 2×@uses_today', kids: [
            BLK('roll', { kind: 'Fast Healing', count: 5, die: 'flat', dmgType: 'Healing', scaling: 'flat', condition: 'Normal Utterance (5 rounds)' }),
            BLK('roll', { kind: 'Ongoing / Round', count: 2, die: 'd6', dmgType: 'Acid', scaling: 'flat', condition: 'Reverse Utterance' })
          ] })
        ] })
      ];
      return e; } },
    { id: 'shadowcaster_mystery', icon: '🔮', label: 'Carpet of Shadow (Tome of Magic — Mystery Apprentice 1, Lvl 1–6 Spell → 7–12 Sp → 13+ Su)', build() {
      const e = blankEntry('spell');
      Object.assign(e, {
        name: 'Carpet of Shadow', source: 'Tome of Magic p.143', tags: ['#Shadow'],
        text: 'Turn the ground into a shifting maze of shadow-stuff (difficult terrain). Evolves from Arcane Spell to Spell-Like (7th) to Supernatural (13th).'
      });
      Object.assign(e.spell, { system: 'mystery', mysteryTier: 'Apprentice', mysteryPath: 'Shutters and Clouds', maneuverLvl: 1, descriptors: ['Shadow'] });
      Object.assign(e.delivery, { action: 'Standard', range: 'Close (25 ft. + 5 ft./2 levels)', area: 'One 5-ft. square/level', sr: 'No' });
      Object.assign(e.lifecycle, { duration: 'roundsPerLevel', durValue: 1, use: Object.assign(blankUse('perDay'), { n: 1 }) });
      e.effects = [
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'levelTier', condText: 'Class Lvl 1–6', kids: [BLK('effect', { effectKind: 'castEvolution', castNature: 'Arcane Spell' })] }),
          blankBranch({ condKind: 'levelTier', condText: 'Class Lvl 7–12', kids: [BLK('effect', { effectKind: 'castEvolution', castNature: 'Spell-Like (Sp)' })] }),
          blankBranch({ condKind: 'levelTier', condText: 'Class Lvl 13+', kids: [BLK('effect', { effectKind: 'castEvolution', castNature: 'Supernatural (Su, No SR/AoO)' })] })
        ] }),
        BLK('effect', { effectKind: 'rule', text: 'Affected squares become difficult terrain (2 squares of movement per square entered).' })
      ];
      return e; } },
    { id: 'spellthief_steal', icon: '⚡', label: 'Steal Spell (Complete Adventurer — Spellthief Buffer @stolen_lvl, Sneak Attack Forgo 1d6)', build() {
      const e = blankEntry('feat');
      Object.assign(e, {
        name: 'Steal Spell (Spellthief)', featKind: 'feat', source: 'Complete Adventurer p.16', tags: ['#Arcane', '#Tactical'],
        text: 'Forgo 1d6 sneak attack damage on a successful sneak attack to siphon a spell of up to ⅓ your Spellthief level into your stolen spell energy buffer.'
      });
      e.prereqs = [{ id: uid('p'), alts: [ALT({ kind: 'custom', text: 'Sneak Attack +1d6' })] }];
      e.effects = [
        BLK('resource', { name: 'Stolen Spell Energy', varKey: 'stolen_lvl', resMode: 'buffer', scaling: 'level', max: 20, reset: 'perEncounter' }),
        BLK('when', { flow: 'when', branches: [
          blankBranch({ trigger: 'sneakHit', costKind: 'forgoSA', costVal: 1, kids: [
            BLK('effect', { effectKind: 'stealStore', maxLvlFormula: '≤ ⅓ Class Lvl', bufferVar: 'stolen_lvl' })
          ] })
        ] })
      ];
      return e; } }
  ];

  // --------------------------------------------------------------------------
  // 5. App state & persistence
  // --------------------------------------------------------------------------
  const LS_KEY = 'forgeSandbox.v3';
  function loadLS() { try { return JSON.parse(window.localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveLS() {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify({ templates: S.templates, livingTags: S.livingTags, customBonusTypes: S.customBonusTypes, customItemMods: S.customItemMods, customPools: S.customPools, customSkills: S.customSkills, house: S.house })); } catch (e) { /* storage unavailable on some file:// contexts */ }
  }
  const persisted = loadLS();
  const S = {
    entry: blankEntry('weapon'),
    activePreset: '',
    templates: Array.isArray(persisted.templates) ? persisted.templates : [],
    livingTags: Array.isArray(persisted.livingTags) ? persisted.livingTags : [],
    customBonusTypes: Array.isArray(persisted.customBonusTypes) ? persisted.customBonusTypes : [],
    customItemMods: Array.isArray(persisted.customItemMods) ? persisted.customItemMods : [],
    customPools: Array.isArray(persisted.customPools) ? persisted.customPools : [],
    customSkills: Array.isArray(persisted.customSkills) ? persisted.customSkills : [],
    house: { critCap: 0 },
    spot: null,
    ui: {
      liveOpenMobile: false, progHideEmpty: false, facetOpen: {}, cardOpen: {}, jsonOpen: false, importOpen: false, importText: '', tplSaveOpen: false, newTplName: '', houseOpen: false,
      customSkillOpen: false, customSkill: { name: '', ability: 'cha', trainedOnly: true, acp: false }
    }
  };

  // --------------------------------------------------------------------------
  // 6. Rule engine (sandbox-local, explicit V3 schema only)
  // --------------------------------------------------------------------------
  function allBonusTypes() { return BONUS_TYPES.concat(S.customBonusTypes.map((c) => Object.assign({ custom: true }, c))); }
  function allMaterials() {
    const cust = (S.customItemMods || []).filter((x) => x.kind === 'material');
    const seen = new Set(cust.map((x) => x.name.toLowerCase()));
    return MATERIALS.filter((m) => !seen.has(m.name.toLowerCase())).concat(cust);
  }
  function allEnchs() {
    const cust = (S.customItemMods || []).filter((x) => x.kind === 'enchantment');
    const seen = new Set(cust.map((x) => x.name.toLowerCase()));
    return cust.concat(CAT.enchants.filter((e) => !seen.has(e.name.toLowerCase())));
  }
  function allCrystals() {
    const cust = (S.customItemMods || []).filter((x) => x.kind === 'crystal');
    const seen = new Set(cust.map((x) => x.name.toLowerCase()));
    return cust.concat(CAT.crystals.filter((c) => !seen.has(c.name.toLowerCase())));
  }
  function allSkills() { return SKILLS.map((s) => ({ key: skillKey(s[0]), name: s[0], ability: s[1], custom: false })).concat((S.customSkills || []).map((c) => ({ key: c.id, name: c.name, ability: c.ability || 'cha', trainedOnly: !!c.trainedOnly, acp: !!c.acp, custom: true }))); }
  function allTargetGroups() {
    const sks = allSkills();
    return TARGET_GROUPS.slice(0, -1).concat([['Skills (' + sks.length + ')', [['skill.all', 'All Skills']].concat(sks.map((s) => [s.key, s.name + (s.custom ? ' (custom)' : '')]))]]);
  }
  function targetLabel(k) { if (TARGET_LABEL[k]) return TARGET_LABEL[k]; const c = (S.customSkills || []).find((x) => x.id === k); return c ? c.name : k; }
  function entryResourceBlocks(en) {
    return ((en && en.effects) || []).filter((b) => b && b.type === 'resource');
  }
  function allPools() {
    const base = ['Arcane Pool', 'Turn Undead', 'Rebuke Undead', 'Ki', 'Bardic Music', 'Wild Shape', 'Psionic Power Points', 'Essentia', 'Bloodrage Rounds'];
    const seen = new Set(base);
    const out = base.slice();
    const add = (n) => { const s = String(n || '').trim(); if (s && !seen.has(s)) { seen.add(s); out.push(s); } };
    (S.customPools || []).forEach(add);
    entryResourceBlocks(S.entry).forEach((b) => add(b.name));
    return out;
  }
  function statFormulaOpts(en) {
    const base = [
      ['strMod', '@STR Mod'], ['dexMod', '@DEX Mod'], ['conMod', '@CON Mod'],
      ['intMod', '@INT Mod'], ['wisMod', '@WIS Mod'], ['chaMod', '@CHA Mod'],
      ['level', '@Char Level'], ['classLevel', '@Class Level'], ['halfLevel', '@½ Level'],
      ['il', '@Initiator Lvl'], ['bab', '@BAB']
    ];
    const seen = new Set(base.map((x) => x[0]));
    entryResourceBlocks(en || S.entry).forEach((b) => {
      const k = b.varKey || slug(b.name || 'res');
      if (k && !seen.has(k)) { seen.add(k); base.push([k, '@' + k + ' (' + (b.name || k) + ')']); }
    });
    return base;
  }
  function resourceVarOpts(en) {
    const out = [];
    const seen = new Set();
    entryResourceBlocks(en || S.entry).forEach((b) => {
      const k = b.varKey || slug(b.name || 'res');
      if (k && !seen.has(k)) { seen.add(k); out.push([k, '@' + k + ' (' + (b.name || k) + ')']); }
    });
    [['augment_pp', '@augment_pp'], ['arcane_strike', '@arcane_strike'], ['essentia', '@essentia'], ['power_attack', '@power_attack'], ['uses_today', '@uses_today'], ['stolen_lvl', '@stolen_lvl']].forEach((x) => {
      if (!seen.has(x[0])) { seen.add(x[0]); out.push(x); }
    });
    return out;
  }

  const baseName = (b) => String((b && b.name) || '').replace(/\s*\(.*\)$/, '');
  function enchApplies(e, kind) { return !!e && (e.on === kind || (e.on === 'armor+shield' && kind !== 'weapon')); }
  function crystalApplies(c, kind) { return !!c && (c.on === kind || (c.on === 'armor+shield' && kind !== 'weapon')); }
  const enchById = (id) => byId(allEnchs(), id);
  const crystalById = (id) => byId(allCrystals(), id);

  function topRollParts(en) {
    return ((en && en.effects) || [])
      .filter((b) => b && b.type === 'roll' && b.kind === 'Damage')
      .map((b) => ({
        count: num(b.count, 1),
        die: b.die || 'd6',
        type: b.dmgType || 'Untyped',
        crit: b.crit || 'normal',
        cond: b.condition || '',
        source: 'Custom'
      }));
  }

  function chassisView(ch, en) {
    const owner = en || S.entry;
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
    const matObj = allMaterials().find((m) => m.id === mat);
    const customMat = matObj && matObj.mat ? matObj.mat : null;
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
      if (customMat && num(customMat.weaponGp) > 0) gpRows.push([matObj.name, num(customMat.weaponGp)]);
    } else {
      const cat = base.type;
      if (mat === 'mithral') gpRows.push(['Mithral', cat === 'Medium' ? 4000 : cat === 'Heavy' ? 9000 : 1000]);
      if (mat === 'adamantine') gpRows.push(['Adamantine', cat === 'Medium' ? 10000 : cat === 'Heavy' ? 15000 : 5000]);
      if (mat === 'darkwood') gpRows.push(['Darkwood (+10 gp/lb.)', 10 * num(base.weight)]);
      if (mat === 'cold_iron') gpRows.push(['Cold Iron (double base)', num(base.cost)]);
      if (mat === 'alchemical_silver') gpRows.push(['Alchemical Silver', 90]);
      if (customMat) {
        const agp = cat === 'Medium' ? num(customMat.medGp) : cat === 'Heavy' ? num(customMat.heavyGp) : num(customMat.lightGp);
        if (agp > 0) gpRows.push([matObj.name, agp]);
      }
    }
    if (effective > 0) gpRows.push(['Enhancement (+' + effective + ' effective)', effective * effective * (isW ? 2000 : 1000)]);
    enchs.filter((e) => e.gp).forEach((e) => gpRows.push([e.name, e.gp]));
    let crystal = null;
    const c = crystalById(ch.crystal && ch.crystal.id);
    if (c) {
      let ti = Math.max(0, CRYSTAL_TIERS.indexOf(ch.crystal.tier));
      if (c.cost[ti] == null) ti = c.cost.findIndex((x) => x != null);
      if (ti < 0) ti = 0;
      const tier = CRYSTAL_TIERS[ti];
      crystal = { c: c, ti: ti, tier: tier, text: (c.tiers && c.tiers[ti]) || '' };
      gpRows.push([c.name + ' (' + tier + ')', num(c.cost[ti])]);
      if (!crystalApplies(c, kind)) warnings.push(c.name + ' does not fit a ' + kind);
      if (tier === 'least' && !isMW) warnings.push('Prerequisites Not Met: Least crystal requires a masterwork item');
      if (enh < CRYSTAL_REQ[tier]) warnings.push('Prerequisites Not Met: ' + cap1(tier) + ' crystal requires +' + CRYSTAL_REQ[tier] + ' enhancement');
      badges.push('💎 ' + c.name + ': ' + ((c.tiers && c.tiers[ti]) || ''));
      if (c.mods && c.mods[ti]) c.mods[ti].forEach((m) => mods.push(Object.assign({}, m, { source: c.name })));
      if (c.customMods && c.customMods.length) c.customMods.forEach((m) => mods.push(Object.assign({}, m, { source: c.name })));
      if (c.dr) dr.push({ value: c.dr[ti], bypass: '-', source: c.name });
    }
    const gpTotal = gpRows.reduce((a, r) => a + r[1], 0);
    const view = { isW: isW, kind: kind, base: base, enh: enh, plusSum: plusSum, effective: effective, gpRows: gpRows, gpTotal: gpTotal, warnings: warnings, badges: badges, mods: mods, dr: dr, energy: energy, crystal: crystal, isMW: isMW, enchs: enchs };
    if (isW) {
      const w = ch.weapon;
      const keen = enchs.some((e) => e.effect && e.effect.keen);
      if (keen && !/Slashing|Piercing/i.test(w.dmgType)) warnings.push('Keen requires a Slashing or Piercing weapon');
      const size = Math.max(1, 21 - num(w.critRange, 20));
      const rawLow = 21 - size * (keen ? 2 : 1);
      const capAt = num(S.house.critCap);
      const capped = capAt > 0 && rawLow < capAt;
      const low = capped ? capAt : rawLow;
      const mult = customMat && num(customMat.critMultOverride) >= 2 ? num(customMat.critMultOverride) : Math.max(2, num(w.critMult, 2));
      const parts = [{ count: 1, die: w.dice, type: w.dmgType, crit: 'multiply', source: 'Base', raw: true }];
      enchs.forEach((e) => {
        ((e.effect && e.effect.parts) || []).forEach((p) => parts.push(Object.assign({}, p, { count: p.perMult ? p.count * (mult - 1) : p.count, source: e.name })));
        if (e.effect && e.effect.mods) e.effect.mods.forEach((m) => mods.push(Object.assign({}, m, { source: e.name })));
      });
      if (crystal && crystal.c.parts && crystal.c.parts[crystal.ti]) {
        const cp = crystal.c.parts[crystal.ti];
        parts.push({ count: cp[0] === 0 ? num(cp[1]) : cp[0], die: cp[0] === 0 ? 'flat' : cp[1], type: crystal.c.ptype || 'Untyped', crit: 'normal', source: crystal.c.name, cond: crystal.c.cond || '' });
      }
      if (crystal && crystal.c.customParts && crystal.c.customParts.length) {
        crystal.c.customParts.forEach((p) => parts.push(Object.assign({ source: crystal.c.name }, p)));
      }
      if (owner && owner.chassis === ch && owner.blueprint === 'weapon') {
        topRollParts(owner).forEach((p) => parts.push(p));
      }
      enchs.forEach((e) => { if (e.effect && e.effect.badge) badges.push('⚔️ ' + e.name + ': ' + e.effect.badge); });
      if (mat === 'adamantine') badges.push('⚔️ Bypasses DR/adamantine & hardness < 20');
      if (mat === 'cold_iron') badges.push('⚔️ Bypasses DR/cold iron');
      if (mat === 'alchemical_silver') badges.push('⚔️ Bypasses DR/silver (-1 damage)');
      if (customMat && customMat.drBypass) badges.push('⚔️ Bypasses DR/' + customMat.drBypass);
      if (customMat && num(customMat.critMultOverride) >= 2) badges.push('⚔️ ' + matObj.name + ': Crit ×' + num(customMat.critMultOverride));
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
      if (customMat) { acp = Math.min(0, acp + num(customMat.acpDelta)); asf = Math.max(0, asf + num(customMat.asfDelta)); if (maxDex < 99) maxDex = Math.max(0, maxDex + num(customMat.maxDexDelta)); }
      if (type === 'Light' || kind === 'shield') speed = 30;
      if (mat === 'adamantine' && kind === 'armor') dr.push({ value: a.type === 'Heavy' ? 3 : a.type === 'Medium' ? 2 : 1, bypass: '-', source: 'Adamantine' });
      enchs.forEach((e) => {
        if (e.effect && e.effect.mods) e.effect.mods.forEach((m) => mods.push(Object.assign({}, m, { source: e.name })));
        if (e.effect && e.effect.badge) badges.push('🛡️ ' + e.name + ': ' + e.effect.badge);
        if (e.effect && e.effect.sr) sr = Math.max(sr, e.effect.sr);
        if (e.effect && e.effect.dr) dr.push(Object.assign({ source: e.name }, e.effect.dr));
        if (e.effect && e.effect.energy) energy.push(Object.assign({ source: e.name }, e.effect.energy));
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
    const matName = (allMaterials().find((m) => m.id === ch.material) || {}).name;
    if (ch.material === 'masterwork') { if (!v.enh) parts.push('Masterwork'); } else if (ch.material !== 'standard' && matName) parts.push(matName);
    parts.push(baseName(v.base).replace(/^Shield, (.*)$/, '$1 Shield'));
    let n = parts.join(' ');
    if (v.crystal) n += ' + ' + cap1(v.crystal.tier) + ' ' + v.crystal.c.name;
    return n;
  }
  function entryName(en) {
    if (en.name && en.name.trim()) return en.name.trim();
    if (en.facets.indexOf('chassis') >= 0) return chassisView(en.chassis, en).name;
    return 'Untitled ' + ((BP_BY_ID[en.blueprint] || {}).name || 'Creation');
  }
  const classBAB = (prog, L) => (prog === 'full' ? L : prog === '3/4' ? Math.floor(L * 3 / 4) : Math.floor(L / 2));
  const goodSave = (L) => (L > 0 ? 2 + Math.floor(L / 2) : 0);
  const poorSave = (L) => Math.floor(L / 3);
  function alignAxes(a) { const i = ALIGNS.indexOf(a); return [i % 3, Math.floor(i / 3)]; }
  function clericLegal(deity, al) { const d = alignAxes(deity), c = alignAxes(al); return (Math.abs(d[0] - c[0]) + Math.abs(d[1] - c[1])) <= 1; }

  function altText(a) {
    switch (a.kind) {
      case 'ability': return a.ability.toUpperCase() + ' ' + num(a.min);
      case 'bab': return 'Base Attack Bonus +' + num(a.min);
      case 'skill': return (targetLabel(a.skill) || a.skill) + ' ' + num(a.min) + ' ranks';
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
    const sp = en.spell, sys = sp.system || 'spell';
    const splLvl = sys === 'spell' ? (sp.classes[0] ? num(sp.classes[0].lvl) : 'Spell Level') : sys === 'vestige' ? num(sp.vestigeLvl, 1) : num(sp.maneuverLvl, 1);
    const dc = s.dcMode === 'flat' ? 'DC ' + num(s.flat) : s.dcMode === 'hd' ? 'DC 10 + 1/2 HD + ' + s.stat.toUpperCase() : 'DC 10 + ' + splLvl + ' + ' + s.stat.toUpperCase();
    return s.type + ' ' + s.effect.toLowerCase() + ' (' + dc + ')';
  }
  const ORIGIN_LABEL = { new: 'New Entry', override: 'Override SRD', variant: 'Clone as Variant' };
  function powerSummary(pw) {
    const nm = pw.kind === 'attached' ? (pw.ref ? pw.ref.name : pw.name) : pw.name;
    const icon = pw.kind === 'attached' ? '🔮' : '⚡';
    const mode = pw.grantMode === 'known' ? ' [Spell List]' : pw.grantMode === 'slot' ? ' [Own Slot]' : '';
    const effs = (pw.effects || []).map(blockText).filter(Boolean).join(' • ');
    return icon + ' ' + useText(pw.use) + ': ' + (nm || 'Unnamed') + ' (' + pw.action + ')' + mode + (effs ? ' • ' + effs : '');
  }
  function modShort(m) {
    const tl = targetLabel(m.target);
    const v = sgn(num(m.value));
    const showType = m.type !== 'Untyped' && tl.indexOf(m.type) < 0 && m.type.indexOf(tl) < 0;
    return v + ' ' + (showType ? m.type + ' ' : '') + tl + (m.condition ? ' (' + m.condition + ')' : '');
  }

  function rawHeaderLine(en) {
    const F = en.facets, seg = [];
    const has = (k) => F.indexOf(k) >= 0;
    if (has('chassis')) {
      const v = chassisView(en.chassis, en);
      if (v.isW) {
        seg.push((v.ranged ? 'Ranged' : 'Melee') + ' • ' + v.handed + ' • ' + en.chassis.weapon.category);
        const extra = v.parts.filter((p) => !p.raw && p.crit !== 'onCritOnly').map((p) => '+' + (p.die === 'flat' ? p.count : p.count + p.die) + ' ' + p.type + (p.cond ? ' ' + p.cond : ''));
        seg.push(v.dice + (v.dmgBonus ? sgn(v.dmgBonus) : '') + ' ' + v.dmgType + (extra.length ? ' ' + extra.join(' ') : ''));
        seg.push(v.critText);
        const critOnlyParts = v.parts.filter((p) => p.crit === 'onCritOnly');
        if (critOnlyParts.length) seg.push('On crit: ' + critOnlyParts.map((p) => '+' + p.count + p.die + ' ' + p.type).join(', '));
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
      const d = en.delivery, sp = en.spell, sys = sp.system || 'spell';
      if (en.blueprint === 'spell') {
        if (sys === 'maneuver') seg.push(sp.discipline + ' (' + sp.maneuverType + ' ' + num(sp.maneuverLvl, 1) + ')' + (num(sp.prereqManeuvers) ? ' • Prereq ' + num(sp.prereqManeuvers) + ' maneuvers' : '') + (sp.descriptors.length ? ' [' + sp.descriptors.join(', ') + ']' : ''));
        else if (sys === 'invocation') seg.push(sp.invGrade + ' ' + (sp.invKind || 'Invocation') + ' (Effective Lvl ' + num(sp.maneuverLvl, 1) + ') • ' + sp.school + (sp.descriptors.length ? ' [' + sp.descriptors.join(', ') + ']' : ''));
        else if (sys === 'psionic') seg.push(sp.discipline + ' ' + num(sp.maneuverLvl, 1) + ' • ' + num(sp.ppCost, 1) + ' PP' + (sp.augmentable ? ' (Augmentable)' : '') + (sp.descriptors.length ? ' [' + sp.descriptors.join(', ') + ']' : ''));
        else if (sys === 'soulmeld') seg.push('Soulmeld (' + (sp.meldshaperList || 'Totemist') + ') • Chakra: ' + (sp.chakraSlots || 'Arms / Totem'));
        else if (sys === 'vestige') seg.push('Vestige Lvl ' + num(sp.vestigeLvl, 1) + ' • Binding DC ' + num(sp.bindingDc, 15) + (sp.vestigeSign ? ' • Sign: ' + sp.vestigeSign : ''));
        else if (sys === 'utterance') seg.push('Utterance (' + (sp.lexicon || 'Evolving Mind') + ' ' + num(sp.maneuverLvl, 1) + ')');
        else if (sys === 'mystery') seg.push((sp.mysteryTier || 'Apprentice') + ' Mystery (' + (sp.mysteryPath || 'Path') + ' • Lvl ' + num(sp.maneuverLvl, 1) + ')');
        else seg.push(sp.school + (sp.descriptors.length ? ' [' + sp.descriptors.join(', ') + ']' : ''));
      }
      if (has('delivery')) {
        seg.push(d.action + (d.action === 'Passive' || d.action === 'Reaction' ? '' : ' Action'));
        if (d.range) seg.push(d.range);
        if (d.area) seg.push(d.area);
        if (d.attackOn && d.attack !== 'none') seg.push(ATTACK_LABEL[d.attack]);
        const dc = dcText(en); if (dc) seg.push(dc);
        if (en.blueprint === 'spell' && ['maneuver', 'soulmeld', 'vestige'].indexOf(sys) < 0) seg.push((sys === 'psionic' ? 'PR ' : 'SR ') + d.sr);
        d.extras.forEach((x) => seg.push(x.text));
      }
    }
    if (has('lifecycle')) {
      const l = en.lifecycle;
      if (l.use.mode !== 'atwill') seg.push(useText(l.use));
      if (l.duration !== 'instant' || en.blueprint === 'spell') seg.push('Duration ' + durationText(l) + (l.dismissible ? ' (D)' : ''));
      if (l.stackable) seg.push('Stackable ×' + l.maxStacks);
    }
    if (isItemBp(en.blueprint) && !has('chassis')) {
      seg.push(en.item.subtype + ' • ' + en.item.slot + (isConsumable(en) ? ' • Consumable' : '') + (num(en.item.cl) ? ' • CL ' + num(en.item.cl) : ''));
    }
    if (has('progression')) {
      const p = en.progression;
      if (p.mode === 'hd' || p.mode === 'legacy') {
        const mc = p.levels.slice(0, p.maxLevel).reduce((acc, l) => acc + l.features.length, 0);
        seg.push((p.mode === 'hd' ? 'HD Scaling' : 'Legacy Rituals') + ' (1–' + p.maxLevel + ' • ' + mc + ' milestone feature' + (mc === 1 ? '' : 's') + ')');
      } else {
        const spellLv = p.levels.slice(0, p.maxLevel).filter((l) => l.spell).length;
        seg.push('d' + p.hitDie + ' HD • ' + (p.bab === 'full' ? 'Full' : p.bab) + ' BAB • Good ' + (['fort', 'ref', 'will'].filter((s) => p.good[s]).map((s) => ({ fort: 'Fortitude', ref: 'Reflex', will: 'Will' }[s])).join('/') || 'none') + ' • ' + p.skillPts + ' + Int skill points • ' + p.maxLevel + ' levels' + (spellLv ? ' • +1 Spellcasting ×' + spellLv : ''));
        if (p.caster && p.caster.mode && p.caster.mode !== 'none') {
          const asfLbl = p.caster.ignoreAsf && p.caster.ignoreAsf !== 'none' ? ', Ignore ' + cap1(p.caster.ignoreAsf) + ' ASF' + (p.caster.ignoreShieldAsf ? ' + Shields' : '') : (p.caster.ignoreShieldAsf ? ', Ignore Shield ASF' : '');
          const rageLbl = p.caster.castInRage ? ', Cast in Rage' : '';
          const clF = p.caster.clFormula && p.caster.clFormula !== 'full' ? ', CL: ' + p.caster.clFormula : '';
          seg.push(p.caster.tradition + ' Caster (' + p.caster.mode + ', ' + String(p.caster.ability || 'int').toUpperCase() + clF + asfLbl + rageLbl + ')');
        }
      }
    }
    if (has('grants')) {
      const g = en.grants;
      if (en.blueprint === 'deity') seg.push(ALIGN_NAMES[g.deityAlign] + ' • Cleric alignments: ' + ALIGNS.filter((a) => clericLegal(g.deityAlign, a)).join(', ') + ' • Favored Weapon: ' + g.favoredWeapon + (g.domains.length ? ' • Domains: ' + g.domains.map((d) => d.name).join(', ') : ''));
      else if (en.blueprint === 'domain') seg.push('Granted Power: ' + (g.grantedPower ? g.grantedPower.slice(0, 90) + (g.grantedPower.length > 90 ? '…' : '') : '—') + ' • Spells: ' + (g.ladder.filter(Boolean).length) + '/9');
    }
    if (en.blueprint === 'feat') {
      if (en.featKind === 'acf' || en.featKind === 'substitution') {
        const a = en.acf || {};
        seg.push((en.featKind === 'substitution' ? (a.race ? a.race + ' ' : '') + 'Substitution' : 'ACF') + ' • ' + (a.targetClass || 'Class') + ' Lvl ' + num(a.level, 1) + (a.replaces ? ' (Replaces ' + a.replaces + ')' : ''));
      } else {
        seg.push((en.featKind === 'boon' ? 'Boon / Blessing' : 'Feat') + (en.repeat.mode === 'upto' ? ' • Up to ' + en.repeat.n + '×' : en.repeat.mode === 'per' ? ' • Per Weapon / School' : ''));
      }
    }
    if (en.blueprint === 'item_mod') {
      const im = en.itemMod;
      seg.push((im.kind === 'crystal' ? 'Augment Crystal' : im.kind === 'material' ? 'Special Material' : 'Enchantment') + ' • Applies to: ' + im.on);
      if (im.kind === 'enchantment') {
        seg.push(im.costMode === 'plus' ? '+' + num(im.plus, 1) + ' Bonus' : gp(im.gp));
        if (im.keen) seg.push('Keen (Crit ×2)');
        if (im.badge) seg.push(im.badge);
      } else if (im.kind === 'crystal') {
        CRYSTAL_TIERS.forEach((t, i) => { if (im.crystalCosts[i] != null && im.crystalCosts[i] !== '') seg.push(cap1(t) + ' ' + gp(im.crystalCosts[i])); });
      } else if (im.kind === 'material') {
        const m = im.mat;
        if (num(m.critMultOverride) >= 2) seg.push('Crit ×' + num(m.critMultOverride));
        if (m.drBypass) seg.push('Bypasses DR/' + m.drBypass);
        if (num(m.maxDexDelta)) seg.push('Max Dex ' + sgn(num(m.maxDexDelta)));
        if (num(m.acpDelta)) seg.push('ACP ' + sgn(num(m.acpDelta)));
        if (num(m.asfDelta)) seg.push('ASF ' + sgn(num(m.asfDelta)) + '%');
        if (num(m.weaponGp)) seg.push('Weapon +' + gp(m.weaponGp));
        if (num(m.lightGp) || num(m.medGp) || num(m.heavyGp)) seg.push('Armor +' + gp(m.lightGp) + '/' + gp(m.medGp) + '/' + gp(m.heavyGp));
      }
    }
    if (en.blueprint === 'race') {
      const r = en.race;
      seg.push((r.kind === 'template' ? r.timing + ' Template' : 'Base Race') + ' • ' + r.size + ' ' + r.creatureType + (r.subtype ? ' (' + r.subtype + ')' : ''));
      seg.push('Speed ' + num(r.speed, 30) + ' ft.' + (num(r.flySpeed) > 0 ? ', Fly ' + num(r.flySpeed) + ' ft. (' + r.flyMan + ')' : ''));
      if (num(r.la) > 0) seg.push('LA +' + num(r.la));
      if (num(r.rhdCount) > 0) seg.push(num(r.rhdCount) + 'd' + num(r.rhdDie, 8) + ' RHD');
      if (r.favoredClass) seg.push('Favored Class: ' + r.favoredClass);
      if (r.bonusFeat1) seg.push('1st-Lvl Bonus Feat');
      if (r.bonusSkillPts) seg.push('+4/+1 Skill Points');
    }
    return seg.filter(Boolean);
  }

  function summaryPills(en) {
    const F = en.facets, pills = [];
    const has = (k) => F.indexOf(k) >= 0;
    if (has('chassis')) {
      const v = chassisView(en.chassis, en);
      v.badges.forEach((b) => pills.push(['dim', b]));
      v.mods.forEach((m) => pills.push(['emerald', '✨ ' + modShort(m)]));
      v.dr.forEach((x) => pills.push(['amber', '🛡️ DR ' + x.value + '/' + x.bypass]));
      v.energy.forEach((x) => pills.push(['amber', '🛡️ Resist ' + x.type + ' ' + x.value]));
      if (v.sr) pills.push(['purple', '🛡️ SR ' + v.sr]);
    }
    if (en.blueprint === 'item_mod') {
      if (en.itemMod.kind === 'enchantment' && en.itemMod.keen) pills.push(['sky', '⚔️ Keen (Crit ×2)']);
      if (en.itemMod.kind === 'enchantment' && en.itemMod.badge) pills.push(['dim', '✨ ' + en.itemMod.badge]);
    }
    if (en.blueprint === 'race') {
      if (en.race.bonusFeat1) pills.push(['indigo', '✨ 1st-Lvl Bonus Feat']);
      if (en.race.bonusSkillPts) pills.push(['indigo', '🎯 +4/+1 Skill Points']);
    }
    if (has('prereqs') && en.prereqs.length) pills.push(['indigo', '🏛️ Prerequisites: ' + prereqText(en.prereqs)]);
    (en.effects || []).forEach((b) => {
      const col = {
        resource: 'emerald', when: 'sky', table: 'amber', carrier: 'purple',
        stat: (b.mode === 'flat' && num(b.value) < 0) || b.btype === 'Penalty' ? 'rose' : 'indigo',
        roll: 'rose', attack: 'rose', defense: 'emerald', effect: 'purple'
      }[b.type] || 'dim';
      const T = BLOCK_TYPES[b.type] || { icon: '✨' };
      pills.push([col, T.icon + ' ' + blockText(b)]);
    });
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
  // 7. Canonical V3 JSON export & lossless import (schemaVersion: 3)
  // --------------------------------------------------------------------------
  function exportUse(u) {
    const o = { mode: u.mode };
    if (['perDay', 'perEncounter', 'charges'].indexOf(u.mode) >= 0) o.uses = num(u.n);
    if (u.mode === 'spellSlot') o.slotLevel = num(u.slotLevel);
    if (u.mode === 'resourcePool') { o.pool = u.pool; o.cost = num(u.poolCost, 1); }
    if (u.mode === 'cooldown') o.recharge = u.cooldown;
    return o;
  }
  function exportModFormula(m) {
    const baseVal = num(m.value, 0);
    const mult = num(m.mult, 1);
    const statPart = (mult !== 1 ? mult + '*' : '') + '@' + (m.stat || 'chaMod');
    return baseVal !== 0 ? baseVal + '+' + statPart : statPart;
  }
  function exportModCap(m) {
    return m.cap === 'classLevel' ? '@classLevel' : m.cap === 'flat' ? num(m.capVal, 5) : null;
  }
  function exportPerCLFormula(m) {
    return 'clamp(floor(@cl/' + Math.max(1, num(m.per, 1)) + ')*' + num(m.value, 1) + ',' + num(m.min, 0) + ',' + num(m.max, 5) + ')';
  }
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
  function exportBlock(b) {
    const o = clone(b);
    delete o.id;
    delete o.summary;
    delete o.formula;
    if (b.type === 'stat') {
      const mode = modMode(b);
      o.mode = mode;
      if (mode === 'stat') { o.formula = exportModFormula(b); o.cap = exportModCap(b); }
      else if (mode === 'perCL') { o.formula = exportPerCLFormula(b); }
    }
    o.summary = blockText(b);
    if (b.type === 'when' && Array.isArray(b.branches)) {
      o.branches = b.branches.map((br) => {
        const bo = clone(br);
        delete bo.id;
        bo.effects = (br.kids || []).map(exportBlock);
        delete bo.kids;
        return bo;
      });
    }
    if (b.type === 'table' && Array.isArray(b.rows)) {
      o.rows = b.rows.map((r) => ({ roll: String(r.roll || '1'), effects: (r.kids || []).map(exportBlock) }));
    }
    return o;
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
    if (pw.effects && pw.effects.length) o.effects = pw.effects.map(exportBlock);
    if (pw.text) o.text = pw.text;
    if (pw.exportStandalone) o.exportStandalone = true;
    return o;
  }
  function exportFeature(f) { const o = { kind: f.kind, name: f.name }; if (f.refId) o.refId = f.refId; if (f.kind === 'inline') { o.abilityType = f.abilityType; if (f.text) o.text = f.text; } else if (f.abilityType === 'Sp') { o.abilityType = 'Sp'; } return o; }

  function exportEntry(en) {
    const F = en.facets, has = (k) => F.indexOf(k) >= 0;
    const out = { schemaVersion: 3, id: en.origin.mode === 'override' && en.origin.srdId ? en.origin.srdId : en.id, blueprint: en.blueprint, name: entryName(en), source: en.source, tags: en.tags.slice(), facets: F.slice() };
    if (en.origin.mode !== 'new') out.origin = { mode: en.origin.mode, srdId: en.origin.srdId, srdName: en.origin.srdName };
    if (en.text) out.text = en.text;
    if (en.blueprint === 'feat') {
      out.featKind = en.featKind || 'feat';
      if (en.featKind === 'acf' || en.featKind === 'substitution') {
        const a = en.acf || {};
        out.acf = { targetClass: a.targetClass || '', level: num(a.level, 1), replaces: a.replaces || '', race: en.featKind === 'substitution' ? (a.race || null) : null };
      } else {
        out.timesSelectable = en.repeat.mode === 'upto' ? num(en.repeat.n) : en.repeat.mode === 'per' ? 'perWeaponOrSchool' : 1;
      }
    }
    if (isItemBp(en.blueprint)) { out.item = { subtype: en.item.subtype, slot: en.item.slot, consumable: isConsumable(en) }; if (!has('chassis')) { out.item.price = num(en.item.price); out.item.casterLevel = num(en.item.cl); } }
    if (en.blueprint === 'spell') {
      const sp = en.spell, sys = sp.system || 'spell';
      if (sys === 'maneuver') out.spell = { system: 'maneuver', maneuverType: sp.maneuverType, discipline: sp.discipline, level: num(sp.maneuverLvl, 1), prereqManeuvers: num(sp.prereqManeuvers, 0), descriptors: sp.descriptors.slice() };
      else if (sys === 'invocation') out.spell = { system: 'invocation', grade: sp.invGrade, kind: sp.invKind || 'Invocation', effectiveLevel: num(sp.maneuverLvl, 1), school: sp.school, descriptors: sp.descriptors.slice() };
      else if (sys === 'psionic') out.spell = { system: 'psionic', discipline: sp.discipline, level: num(sp.maneuverLvl, 1), ppCost: num(sp.ppCost, 1), augmentable: !!sp.augmentable, descriptors: sp.descriptors.slice() };
      else if (sys === 'soulmeld') out.spell = { system: 'soulmeld', chakraSlots: sp.chakraSlots || 'Arms / Totem', meldshaperList: sp.meldshaperList || 'Totemist', descriptors: sp.descriptors.slice() };
      else if (sys === 'vestige') out.spell = { system: 'vestige', level: num(sp.vestigeLvl, 1), bindingDc: num(sp.bindingDc, 15), sign: sp.vestigeSign || '', descriptors: sp.descriptors.slice() };
      else if (sys === 'utterance') out.spell = { system: 'utterance', lexicon: sp.lexicon || 'Evolving Mind', level: num(sp.maneuverLvl, 1), descriptors: sp.descriptors.slice() };
      else if (sys === 'mystery') out.spell = { system: 'mystery', tier: sp.mysteryTier || 'Apprentice', path: sp.mysteryPath || '', level: num(sp.maneuverLvl, 1), descriptors: sp.descriptors.slice() };
      else out.spell = { system: 'spell', classLevels: sp.classes.map((c) => ({ class: c.cls, level: num(c.lvl) })), school: sp.school, descriptors: sp.descriptors.slice(), components: Object.keys(sp.comps).filter((k) => sp.comps[k]) };
    }
    if (en.blueprint === 'item_mod') {
      const im = en.itemMod, imOut = { kind: im.kind, appliesTo: im.on };
      if (im.kind === 'enchantment') {
        imOut.costMode = im.costMode;
        if (im.costMode === 'plus') imOut.enhancementIncrease = num(im.plus, 1); else imOut.flatGp = num(im.gp);
        if (im.keen) imOut.keen = true;
        if (im.badge) imOut.tacticalBadge = im.badge;
      } else if (im.kind === 'crystal') {
        imOut.tiers = CRYSTAL_TIERS.map((t, i) => ({ tier: t, cost: im.crystalCosts[i] != null && im.crystalCosts[i] !== '' ? num(im.crystalCosts[i]) : null, text: im.crystalTiers[i] || '' }));
      } else if (im.kind === 'material') {
        imOut.material = { acpDelta: num(im.mat.acpDelta), maxDexDelta: num(im.mat.maxDexDelta), asfDelta: num(im.mat.asfDelta), critMultOverride: num(im.mat.critMultOverride), drBypass: im.mat.drBypass || null, weaponGp: num(im.mat.weaponGp), lightGp: num(im.mat.lightGp), medGp: num(im.mat.medGp), heavyGp: num(im.mat.heavyGp) };
      }
      const rParts = topRollParts(en);
      if (rParts.length) {
        imOut.damageParts = rParts.map((p) => ({ dice: p.die === 'flat' ? null : (/^\d+d\d+$/.test(p.die) ? p.die : num(p.count, 1) + p.die), bonus: p.die === 'flat' ? num(p.count) : 0, type: String(p.type || 'Untyped').toLowerCase(), multiplyOnCrit: p.crit === 'multiply', onCritOnly: p.crit === 'onCritOnly', condition: p.cond || null }));
      }
      out.itemModifier = imOut;
    }
    if (en.blueprint === 'race') {
      const r = en.race;
      out.race = { kind: r.kind, timing: r.kind === 'template' ? r.timing : null, size: r.size, creatureType: r.creatureType, subtype: r.subtype || null, speed: num(r.speed, 30), flySpeed: num(r.flySpeed, 0), flyManeuverability: num(r.flySpeed, 0) > 0 ? r.flyMan : null, levelAdjustment: num(r.la, 0), racialHitDice: num(r.rhdCount, 0) > 0 ? { count: num(r.rhdCount), die: 'd' + num(r.rhdDie, 8) } : null, favoredClass: r.favoredClass || null, bonusFeatAt1st: !!r.bonusFeat1, humanBonusSkillPoints: !!r.bonusSkillPts };
    }
    if (has('prereqs')) out.prerequisites = { all: en.prereqs.map((r) => ({ anyOf: r.alts.map(cleanAlt) })), text: prereqText(en.prereqs) };
    if (has('chassis')) {
      const ch = en.chassis, v = chassisView(ch, en);
      Object.assign(out, { baseItemId: ch.baseId, material: ch.material, enhancementBonus: v.enh, enhancements: ch.enchantments.slice(), effectiveEnhancement: v.effective, gpValue: v.gpTotal });
      if (v.crystal) out.augmentCrystal = { id: v.crystal.c.id, tier: v.crystal.tier };
      if (v.isW) {
        out.weapon = { category: ch.weapon.category, handedness: ch.weapon.handed, baseCritRange: num(ch.weapon.critRange), keen: v.keen, effectiveCritRange: v.critLow, critCappedByHouseRule: v.capped, critMultiplier: v.critMult, rangeIncrement: ch.weapon.rangeOn ? num(ch.weapon.range) : null };
        out.damageParts = v.parts.map((p) => ({ dice: p.die === 'flat' ? null : (/^\d+d\d+$/.test(p.die) ? p.die : num(p.count, 1) + p.die), bonus: p.die === 'flat' ? num(p.count) : 0, type: String(p.type).toLowerCase(), multiplyOnCrit: p.crit === 'multiply', onCritOnly: p.crit === 'onCritOnly', condition: p.cond || null, source: p.source }));
      } else out.armor = { armorType: v.armor.type, armorBonus: v.armor.armorBonus, maxDex: v.armor.maxDex >= 99 ? null : v.armor.maxDex, armorCheckPenalty: v.armor.acp, arcaneSpellFailure: v.armor.asf, speed: v.armor.speed };
      if (v.badges.length) out.tacticalBadges = v.badges.map((b) => b.replace(/^\S+\s/, ''));
    }
    if (en.blueprint === 'buff') out.buffKind = en.buffKind;
    if (has('delivery')) {
      const d = en.delivery, sys = en.spell ? (en.spell.system || 'spell') : 'spell';
      out.delivery = { action: d.action, range: d.range || null, area: d.area || null, attack: d.attackOn ? d.attack : 'none', spellResistance: en.blueprint === 'spell' && ['maneuver', 'soulmeld', 'vestige'].indexOf(sys) >= 0 ? null : d.sr };
      if (d.save.type !== 'None') out.delivery.save = { type: d.save.type, effect: d.save.effect, dc: dcText(en) };
      if (d.extras.length) out.delivery.rules = d.extras.map((x) => ({ kind: x.kind, text: x.text }));
    }
    if (has('lifecycle')) {
      const l = en.lifecycle;
      out.lifecycle = { usage: exportUse(l.use), duration: l.duration, durationText: durationText(l), dismissible: !!l.dismissible };
      if (l.stackable) out.lifecycle.maxStacks = num(l.maxStacks);
    }
    out.effects = (en.effects || []).map(exportBlock);
    if (has('powers') || (en.powers && en.powers.length)) out.powers = en.powers.map(exportPower);
    if (has('progression')) {
      const p = en.progression;
      if (p.mode === 'hd' || p.mode === 'legacy') {
        const milestones = p.levels.slice(0, p.maxLevel)
          .map((l, i) => ({ level: i + 1, features: l.features.map(exportFeature) }))
          .filter((r) => r.features.length > 0);
        out.progression = { mode: p.mode, maxLevel: p.maxLevel, milestones: milestones };
      } else {
        out.progression = {
          mode: p.mode, maxLevel: p.maxLevel, hitDie: 'd' + p.hitDie, bab: p.bab,
          goodSaves: ['fort', 'ref', 'will'].filter((s) => p.good[s]),
          skillPointsPerLevel: num(p.skillPts), classSkills: (p.classSkills || []).slice(),
          levels: p.levels.slice(0, p.maxLevel).map((l, i) => ({
            level: i + 1, bab: classBAB(p.bab, i + 1),
            fort: p.good.fort ? goodSave(i + 1) : poorSave(i + 1),
            ref: p.good.ref ? goodSave(i + 1) : poorSave(i + 1),
            will: p.good.will ? goodSave(i + 1) : poorSave(i + 1),
            features: l.features.map(exportFeature),
            spellcasting: l.spell ? '+1 level of existing spellcasting class' : null
          }))
        };
      }
      if (p.caster && p.caster.mode && p.caster.mode !== 'none') {
        out.progression.spellcastingChassis = {
          mode: p.caster.mode,
          clFormula: p.caster.clFormula || 'full',
          clCustom: p.caster.clFormula === 'custom' ? (p.caster.clCustom || '') : null,
          tradition: p.caster.tradition || 'Arcane',
          keyAbility: p.caster.ability || 'int',
          spellList: p.caster.spellList || 'Sor/Wiz',
          ignoreAsf: p.caster.ignoreAsf || 'none',
          ignoreShieldAsf: !!p.caster.ignoreShieldAsf,
          castInRage: !!p.caster.castInRage
        };
      }
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

  function parseUseObj(u) {
    if (!u || typeof u !== 'object') return blankUse('passive');
    return Object.assign(blankUse(u.mode || 'passive'), {
      n: u.uses != null ? num(u.uses, 1) : (u.n != null ? num(u.n, 1) : 1),
      slotLevel: num(u.slotLevel, 1),
      pool: u.pool || 'Turn Undead',
      poolCost: num(u.cost != null ? u.cost : u.poolCost, 1),
      cooldown: u.recharge || u.cooldown || '1d4'
    });
  }

  function parseBlockV3(ef) {
    if (!ef || typeof ef !== 'object') return null;
    const t = BLOCK_TYPES[ef.type] ? ef.type : 'effect';
    const b = BLK(t, ef);
    delete b.summary;
    delete b.effects;
    if (t === 'when' && Array.isArray(ef.branches)) {
      b.branches = ef.branches.map((br) => {
        const bo = blankBranch(br);
        delete bo.effects;
        bo.kids = Array.isArray(br.effects || br.kids) ? (br.effects || br.kids).map(parseBlockV3).filter(Boolean) : [];
        return bo;
      });
    }
    if (t === 'table' && Array.isArray(ef.rows)) {
      b.rows = ef.rows.map((r) => ({
        id: uid('r'),
        roll: String(r.roll || '1'),
        kids: Array.isArray(r.effects || r.kids) ? (r.effects || r.kids).map(parseBlockV3).filter(Boolean) : []
      }));
    }
    return b;
  }

  function fromCanonicalV3(raw) {
    const arr = (x) => (Array.isArray(x) ? x : []);
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('Expected a Canonical V3 JSON object.');
    }
    const bpId = obj.blueprint && BP_BY_ID[obj.blueprint] ? obj.blueprint
      : obj.kind && BP_BY_ID[obj.kind] ? obj.kind
      : obj.spell ? 'spell'
      : obj.armor ? 'armor'
      : obj.baseItemId || obj.weapon ? 'weapon'
      : obj.itemModifier ? 'item_mod'
      : obj.progression ? 'class'
      : obj.race ? 'race'
      : obj.grants && obj.grants.alignment ? 'deity'
      : obj.grants && (obj.grants.spellLadder || obj.grants.grantedPower) ? 'domain'
      : obj.featKind || obj.acf ? 'feat'
      : obj.buffKind ? 'buff'
      : obj.item ? 'wondrous'
      : 'feat';
    const en = blankEntry(bpId);
    en.id = obj.id || en.id;
    en.name = obj.name || '';
    en.source = obj.source || 'Homebrew';
    en.tags = arr(obj.tags).slice();
    if (Array.isArray(obj.facets) && obj.facets.length) en.facets = obj.facets.slice();
    if (obj.origin && typeof obj.origin === 'object') en.origin = Object.assign(en.origin, obj.origin);
    if (typeof obj.text === 'string') en.text = obj.text;
    else if (obj.text && typeof obj.text === 'object') en.text = obj.text.summary || '';
    if (obj.featKind) en.featKind = obj.featKind;
    if (obj.timesSelectable !== undefined) {
      if (obj.timesSelectable === 'perWeaponOrSchool' || obj.timesSelectable === 'perChoice') en.repeat = { mode: 'per', n: 2 };
      else if (typeof obj.timesSelectable === 'number' && obj.timesSelectable > 1) en.repeat = { mode: 'upto', n: obj.timesSelectable };
      else en.repeat = { mode: 'once', n: 2 };
    }
    if (obj.repeat && typeof obj.repeat === 'object') en.repeat = Object.assign(en.repeat, obj.repeat);
    if (obj.acf && typeof obj.acf === 'object') {
      en.acf = Object.assign(en.acf, { targetClass: obj.acf.targetClass || '', level: num(obj.acf.level, 1), replaces: obj.acf.replaces || '', race: obj.acf.race || '' });
    }
    if (obj.item && typeof obj.item === 'object') {
      en.item = Object.assign(en.item, {
        subtype: obj.item.subtype || en.item.subtype,
        slot: obj.item.slot || en.item.slot,
        price: obj.item.price !== undefined ? num(obj.item.price) : en.item.price,
        cl: obj.item.casterLevel !== undefined ? num(obj.item.casterLevel) : (obj.item.cl !== undefined ? num(obj.item.cl) : en.item.cl)
      });
    }
    if (obj.spell && typeof obj.spell === 'object') {
      const sp = obj.spell, sys = sp.system || 'spell';
      en.spell.system = sys;
      if (sp.descriptors) en.spell.descriptors = arr(sp.descriptors).slice();
      if (sys === 'maneuver') Object.assign(en.spell, { maneuverType: sp.maneuverType || 'Strike', discipline: sp.discipline || en.spell.discipline, maneuverLvl: num(sp.level, 1), prereqManeuvers: num(sp.prereqManeuvers, 0) });
      else if (sys === 'invocation') Object.assign(en.spell, { invGrade: sp.grade || 'Least', invKind: sp.kind || 'Invocation', maneuverLvl: num(sp.effectiveLevel, 1), school: sp.school || en.spell.school });
      else if (sys === 'psionic') Object.assign(en.spell, { discipline: sp.discipline || en.spell.discipline, maneuverLvl: num(sp.level, 1), ppCost: num(sp.ppCost, 1), augmentable: !!sp.augmentable });
      else if (sys === 'soulmeld') Object.assign(en.spell, { chakraSlots: sp.chakraSlots || 'Arms / Totem', meldshaperList: sp.meldshaperList || 'Totemist' });
      else if (sys === 'vestige') Object.assign(en.spell, { vestigeLvl: num(sp.level, 1), bindingDc: num(sp.bindingDc, 15), vestigeSign: sp.sign || '' });
      else if (sys === 'utterance') Object.assign(en.spell, { lexicon: sp.lexicon || 'Evolving Mind', maneuverLvl: num(sp.level, 1) });
      else if (sys === 'mystery') Object.assign(en.spell, { mysteryTier: sp.tier || 'Apprentice', mysteryPath: sp.path || '', maneuverLvl: num(sp.level, 1) });
      else {
        if (sp.school) en.spell.school = sp.school;
        if (Array.isArray(sp.classLevels)) en.spell.classes = sp.classLevels.map((c) => ({ cls: c.class || c.cls || 'Sor/Wiz', lvl: num(c.level != null ? c.level : c.lvl, 1) }));
        if (Array.isArray(sp.components)) {
          en.spell.comps = { V: false, S: false, M: false, F: false, DF: false, XP: false };
          sp.components.forEach((k) => { en.spell.comps[k] = true; });
        }
      }
    }
    if (obj.itemModifier && typeof obj.itemModifier === 'object') {
      const im = obj.itemModifier;
      Object.assign(en.itemMod, {
        kind: im.kind || en.itemMod.kind,
        on: im.appliesTo || im.on || en.itemMod.on,
        costMode: im.costMode || (num(im.flatGp) > 0 && !num(im.enhancementIncrease) ? 'gp' : 'plus'),
        plus: num(im.enhancementIncrease != null ? im.enhancementIncrease : im.plus, en.itemMod.plus),
        gp: num(im.flatGp != null ? im.flatGp : im.gp, en.itemMod.gp),
        keen: !!im.keen,
        badge: im.tacticalBadge || im.badge || ''
      });
      if (Array.isArray(im.tiers)) {
        en.itemMod.crystalCosts = im.tiers.map((t) => (t.cost == null ? null : num(t.cost)));
        en.itemMod.crystalTiers = im.tiers.map((t) => t.text || '');
      }
      if (im.material && typeof im.material === 'object') {
        en.itemMod.mat = Object.assign(en.itemMod.mat, im.material, { drBypass: im.material.drBypass || '' });
      }
    }
    if (obj.race && typeof obj.race === 'object') {
      const r = obj.race;
      Object.assign(en.race, {
        kind: r.kind || 'race', timing: r.timing || 'Inherited', size: r.size || 'Medium', creatureType: r.creatureType || 'Humanoid',
        subtype: r.subtype || '', speed: num(r.speed, 30), flySpeed: num(r.flySpeed, 0), flyMan: r.flyManeuverability || r.flyMan || 'Average',
        la: num(r.levelAdjustment != null ? r.levelAdjustment : r.la, 0),
        rhdCount: r.racialHitDice ? num(r.racialHitDice.count, 0) : num(r.rhdCount, 0),
        rhdDie: r.racialHitDice ? num(String(r.racialHitDice.die || 'd8').replace(/^d/i, ''), 8) : num(r.rhdDie, 8),
        favoredClass: r.favoredClass || 'Any',
        bonusFeat1: !!(r.bonusFeatAt1st != null ? r.bonusFeatAt1st : r.bonusFeat1),
        bonusSkillPts: !!(r.humanBonusSkillPoints != null ? r.humanBonusSkillPoints : r.bonusSkillPts)
      });
    }
    if (obj.buffKind) en.buffKind = obj.buffKind;
    if (obj.delivery && typeof obj.delivery === 'object') {
      const d = obj.delivery;
      Object.assign(en.delivery, {
        action: d.action || en.delivery.action, range: d.range || '', area: d.area || '',
        attackOn: !!(d.attack && d.attack !== 'none'), attack: d.attack && d.attack !== 'none' ? d.attack : en.delivery.attack,
        sr: d.spellResistance || d.sr || en.delivery.sr
      });
      if (d.save) {
        en.delivery.save.type = d.save.type || 'None';
        en.delivery.save.effect = d.save.effect || 'Negates';
        const dcStr = String(d.save.dc || '');
        const statM = dcStr.match(/\+\s*(STR|DEX|CON|INT|WIS|CHA)/i);
        if (/1\/2\s*HD/i.test(dcStr)) { en.delivery.save.dcMode = 'hd'; if (statM) en.delivery.save.stat = statM[1].toLowerCase(); }
        else if (/Spell Level/i.test(dcStr) || /\+\s*\d+\s*\+\s*(STR|DEX|CON|INT|WIS|CHA)/i.test(dcStr)) { en.delivery.save.dcMode = 'spell'; if (statM) en.delivery.save.stat = statM[1].toLowerCase(); }
        else { const flatM = dcStr.match(/DC\s*(\d+)/i); if (flatM) { en.delivery.save.dcMode = 'flat'; en.delivery.save.flat = num(flatM[1], 15); } }
      }
      if (Array.isArray(d.rules)) en.delivery.extras = d.rules.map((r) => ({ id: uid('x'), kind: r.kind || 'other', text: r.text || '' }));
    }
    if (obj.lifecycle && typeof obj.lifecycle === 'object') {
      const l = obj.lifecycle;
      const durM = String(l.durationText || '').match(/^(\d+)/);
      Object.assign(en.lifecycle, {
        duration: l.duration || en.lifecycle.duration,
        durValue: durM ? num(durM[1], 1) : en.lifecycle.durValue,
        durText: l.duration === 'text' ? (l.durationText || '') : en.lifecycle.durText,
        dismissible: !!l.dismissible,
        stackable: num(l.maxStacks) > 0,
        maxStacks: num(l.maxStacks, en.lifecycle.maxStacks)
      });
      if (l.usage) en.lifecycle.use = parseUseObj(l.usage);
    }
    if (obj.grants && typeof obj.grants === 'object') {
      const gr = obj.grants;
      if (gr.alignment) en.grants.deityAlign = gr.alignment;
      if (gr.favoredWeapon) en.grants.favoredWeapon = gr.favoredWeapon;
      if (gr.portfolio !== undefined) en.grants.portfolio = gr.portfolio || '';
      if (gr.dogma !== undefined) en.grants.dogma = gr.dogma || '';
      if (gr.grantedPower && typeof gr.grantedPower === 'object') {
        en.grants.grantedPowerName = gr.grantedPower.name || '';
        en.grants.grantedPower = gr.grantedPower.text || '';
        if (gr.grantedPower.usage) en.grants.gpUse = parseUseObj(gr.grantedPower.usage);
      }
      if (Array.isArray(gr.spellLadder)) {
        gr.spellLadder.forEach((sl) => { if (sl && sl.level >= 1 && sl.level <= 9) en.grants.ladder[sl.level - 1] = sl.spell || ''; });
      }
      if (Array.isArray(gr.domains)) {
        en.grants.domains = gr.domains.map((d) => {
          const srd = (d.refId || d.name) ? (CAT.domains || []).find((x) => (d.refId && x.id === d.refId) || (d.name && x.name.toLowerCase() === String(d.name).toLowerCase())) : null;
          if (d.kind === 'ref' || (srd && d.kind !== 'inline')) {
            return { id: uid('dm'), refId: d.refId || (srd && srd.id) || '', kind: 'ref', name: d.name || (srd && srd.name) || '', grantedPower: (srd && srd.grantedPower) || d.grantedPower || '', ladder: (srd && srd.spells) ? srd.spells.slice() : (Array.isArray(d.ladder) ? d.ladder.slice() : ['', '', '', '', '', '', '', '', '']) };
          }
          const sl = Array.isArray(d.spellLadder) ? ['', '', '', '', '', '', '', '', ''].map((_, i) => { const f = d.spellLadder.find((x) => x.level === i + 1); return f ? f.spell : ''; }) : (Array.isArray(d.ladder) ? d.ladder.slice() : ['', '', '', '', '', '', '', '', '']);
          return { id: d.id || uid('dm'), kind: 'inline', name: d.name || '', grantedPower: d.grantedPower || '', ladder: sl };
        });
      }
      if (Array.isArray(gr.deities)) {
        en.grants.deities = gr.deities.map((d) => ({ id: d.id || uid('dt'), kind: d.kind || 'inline', name: d.name || '', align: d.alignment || d.align || 'N', favoredWeapon: d.favoredWeapon || '' }));
      }
      if (Array.isArray(gr.bonusFeats)) {
        en.grants.featGrants = gr.bonusFeats.map((g) => ({ id: uid('g'), count: num(g.count, 1), pool: g.pool || '#General', level: num(g.level, 1) }));
      }
    }
    const parseAlt = (a) => {
      if (!a || typeof a !== 'object') return ALT({});
      if (a.kind === 'skill') return ALT({ kind: 'skill', skill: a.skill || 'skill.tumble', min: num(a.ranks != null ? a.ranks : a.min, 4) });
      if (a.kind === 'tagPool') return ALT({ kind: 'feat', feat: a.tag || '' });
      if (a.kind === 'feat') return ALT({ kind: 'feat', feat: a.name || a.feat || '' });
      if (a.kind === 'casterLevel' || a.kind === 'charLevel' || a.kind === 'classLevel') return ALT({ kind: 'level', levelKind: a.kind, cls: a.className || '', min: num(a.min, 1) });
      if (a.kind === 'alignment') return ALT({ kind: 'alignment', align: a.value || a.align || 'Any Good' });
      if (a.kind === 'spellcasting') return ALT({ kind: 'spellcasting', cls: a.tradition || a.cls || 'any', min: num(a.spellLevel != null ? a.spellLevel : a.min, 1) });
      if (a.kind === 'patronDeity') return ALT({ kind: 'deity', feat: a.name || '' });
      return ALT(a);
    };
    if (obj.prerequisites && Array.isArray(obj.prerequisites.all)) {
      en.prereqs = obj.prerequisites.all.map((g) => {
        const alts = Array.isArray(g) ? g : (g && Array.isArray(g.anyOf) ? g.anyOf : [g]);
        return { id: uid('p'), alts: alts.map(parseAlt) };
      });
    }
    en.effects = arr(obj.effects).map(parseBlockV3).filter(Boolean);
    if (obj.baseItemId || obj.weapon || obj.armor || (obj.chassis && typeof obj.chassis === 'object')) {
      const ch = obj.chassis || obj;
      const kind = ch.kind || (obj.armor ? 'armor' : 'weapon');
      const baseId = ch.baseId || ch.baseItemId || en.chassis.baseId;
      en.chassis = blankChassis(kind, baseId);
      en.chassis.material = ch.material || 'standard';
      en.chassis.enhancement = ch.enhancement != null ? num(ch.enhancement, 0) : num(ch.enhancementBonus, 0);
      en.chassis.enchantments = arr(ch.enhancements || ch.enchantments).slice();
      if (ch.augmentCrystal && ch.augmentCrystal.id) en.chassis.crystal = { id: ch.augmentCrystal.id, tier: ch.augmentCrystal.tier || 'least' };
      else if (ch.crystal && ch.crystal.id) en.chassis.crystal = { id: ch.crystal.id, tier: ch.crystal.tier || 'least' };
      const w = obj.weapon || ch.weapon;
      if (w && typeof w === 'object') {
        const dps = arr(obj.damageParts || w.damageParts);
        const rawPart = dps.find((d) => d && (d.raw || d.source === 'Base'));
        en.chassis.weapon = Object.assign(en.chassis.weapon, {
          category: w.category || en.chassis.weapon.category,
          handed: w.handedness || w.handed || en.chassis.weapon.handed,
          dice: (rawPart && rawPart.dice) || w.dice || en.chassis.weapon.dice,
          dmgType: (rawPart && rawPart.type) ? cap1(rawPart.type) : en.chassis.weapon.dmgType,
          critRange: w.baseCritRange !== undefined ? num(w.baseCritRange, en.chassis.weapon.critRange) : en.chassis.weapon.critRange,
          critMult: w.critMultiplier !== undefined ? num(w.critMultiplier, en.chassis.weapon.critMult) : en.chassis.weapon.critMult,
          rangeOn: w.rangeIncrement != null && num(w.rangeIncrement) > 0,
          range: w.rangeIncrement != null ? num(w.rangeIncrement, 0) : 0
        });
      }
      const a = obj.armor || ch.armor;
      if (a && typeof a === 'object') {
        const computed = chassisView(en.chassis, en).armor || {};
        const aMax = a.maxDex === null ? 99 : a.maxDex;
        if (a.armorType && a.armorType !== computed.type) en.chassis.armor.type = a.armorType;
        if (a.armorBonus !== undefined && num(a.armorBonus) !== num(computed.armorBonus)) en.chassis.armor.armorBonus = num(a.armorBonus);
        if (aMax !== undefined && num(aMax) !== num(computed.maxDex)) en.chassis.armor.maxDex = num(aMax);
        if (a.armorCheckPenalty !== undefined && num(a.armorCheckPenalty) !== num(computed.acp)) en.chassis.armor.acp = num(a.armorCheckPenalty);
        if (a.arcaneSpellFailure !== undefined && num(a.arcaneSpellFailure) !== num(computed.asf)) en.chassis.armor.asf = num(a.arcaneSpellFailure);
        if (a.speed !== undefined && num(a.speed) !== num(computed.speed)) en.chassis.armor.speed = num(a.speed);
      }
      if (en.name && en.name === chassisView(en.chassis, en).name) en.name = '';
    }
    if (Array.isArray(obj.powers)) {
      en.powers = obj.powers.map((pw) => {
        const refSpell = pw.refId ? (CAT.spells || []).find((s) => s.id === pw.refId) || null : null;
        return blankPower(pw.kind || 'inline', {
          id: pw.id || uid('pw'),
          name: pw.name || '',
          ref: refSpell ? spellRef(refSpell) : null,
          grantMode: pw.grantMode || 'cast',
          action: pw.action || 'Standard',
          use: parseUseObj(pw.usage || pw.use),
          cl: pw.casterLevel != null ? num(pw.casterLevel) : (pw.cl != null ? num(pw.cl) : 0),
          dc: num(pw.saveDC != null ? pw.saveDC : pw.dc, 0),
          duration: pw.duration || '',
          attackOn: !!(pw.attack && pw.attack !== 'none'),
          attack: pw.attack && pw.attack !== 'none' ? pw.attack : 'none',
          range: pw.range || '',
          area: pw.area || '',
          save: pw.save ? { type: pw.save.type || 'None', effect: pw.save.effect || 'Negates' } : { type: 'None', effect: 'Negates' },
          effects: arr(pw.effects).map(parseBlockV3).filter(Boolean),
          text: pw.text || '',
          exportStandalone: !!pw.exportStandalone
        });
      });
    }
    if (obj.progression && typeof obj.progression === 'object') {
      const pr = obj.progression;
      const sc = pr.spellcastingChassis || pr.caster;
      const goodSaves = Array.isArray(pr.goodSaves)
        ? { fort: pr.goodSaves.indexOf('fort') >= 0, ref: pr.goodSaves.indexOf('ref') >= 0, will: pr.goodSaves.indexOf('will') >= 0 }
        : en.progression.good;
      const levels = blankLevels();
      if (Array.isArray(pr.levels)) {
        pr.levels.forEach((lv, idx) => {
          const i = lv && lv.level ? num(lv.level, idx + 1) - 1 : idx;
          if (!levels[i]) return;
          levels[i].spell = !!(lv.spell || lv.spellcasting);
          levels[i].features = arr(lv.features).map((f) => FEATURE(f.name || '', { kind: f.kind || (f.refId ? 'ref' : 'inline'), refId: f.refId || '', abilityType: f.abilityType || 'Ex', text: f.text || '' }));
        });
      } else if (Array.isArray(pr.milestones)) {
        pr.milestones.forEach((ms) => {
          const i = num(ms.level, 1) - 1;
          if (!levels[i]) return;
          levels[i].features = arr(ms.features).map((f) => FEATURE(f.name || '', { kind: f.kind || (f.refId ? 'ref' : 'inline'), refId: f.refId || '', abilityType: f.abilityType || 'Ex', text: f.text || '' }));
        });
      }
      en.progression = Object.assign(en.progression, {
        mode: pr.mode || en.progression.mode,
        maxLevel: pr.maxLevel !== undefined ? num(pr.maxLevel, 20) : en.progression.maxLevel,
        hitDie: pr.hitDie ? num(String(pr.hitDie).replace(/^d/i, ''), 8) : en.progression.hitDie,
        bab: pr.bab || en.progression.bab,
        good: goodSaves,
        skillPts: pr.skillPointsPerLevel !== undefined ? num(pr.skillPointsPerLevel, 2) : (pr.skillPts !== undefined ? num(pr.skillPts, 2) : en.progression.skillPts),
        classSkills: arr(pr.classSkills).slice(),
        levels: levels,
        caster: sc ? Object.assign({}, en.progression.caster, {
          mode: sc.mode || 'none',
          clFormula: sc.clFormula || 'full',
          clCustom: sc.clCustom || '',
          tradition: sc.tradition || 'Arcane',
          ability: sc.keyAbility || sc.ability || 'int',
          spellList: sc.spellList || 'Sor/Wiz',
          ignoreAsf: sc.ignoreAsf || 'none',
          ignoreShieldAsf: !!sc.ignoreShieldAsf,
          castInRage: !!sc.castInRage
        }) : en.progression.caster
      });
    }
    return en;
  }

  function importFromJson(raw) {
    const en = fromCanonicalV3(raw);
    S.ui.importOpen = false;
    S.ui.importText = '';
    loadEntry(en, '');
    toast('Loaded "' + entryName(en) + '" into Scratch Lego Studio.', 'emerald');
    return en;
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
  function statBlocksFromSrd(list) {
    return (list || [])
      .filter((m) => m && m.target && Number.isFinite(Number(m.value)) && Number(m.value) !== 0)
      .map((m) => BLK('stat', { targets: [m.target], mode: 'flat', value: num(m.value), btype: bonusTypeName(m.type), condition: m.condition || '' }));
  }
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
      const mods = (e.modifiers || []).filter((m) => m && m.target && Number.isFinite(Number(m.value)) && Number(m.value) !== 0).map((m) => ({ target: m.target, value: num(m.value), type: bonusTypeName(m.type) }));
      CAT.enchants.push({ id: e.id, name: e.name, on: on, plus: num(e.enhIncrease), gp: num(e.flatCost), effect: { parts: parts.length ? parts : undefined, keen: !!(e.ruleFlags && e.ruleFlags.keen), mods: mods }, desc: e.shortDescription || stripHtml(e.description).slice(0, 160), src: e.source || 'SRD' });
      seenE.add(normName(e.name)); n++;
    });
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
  // 9. Hydration: SRD / MIC / Custom entry -> Studio V3 entry
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
  function rollBlockFromSrd(dps, descriptors) {
    const p = (dps || [])[0];
    if (!p || !p.dice) return null;
    let m = String(p.dice).match(/^\(min\((\d+),\s*@cl\)\)d(\d+)$/i);
    let type = cap1(String(p.type || 'Untyped').split(' ')[0]);
    if (type === 'Untyped' && descriptors.length && ENERGY.indexOf(descriptors[0]) >= 0) type = descriptors[0];
    if (m) return BLK('roll', { kind: 'Damage', count: 1, die: 'd' + m[2], dmgType: type, scaling: 'perCL', amount: 1, per: 1, start: 1, max: num(m[1], 10) });
    m = String(p.dice).match(/^(\d+)d(\d+)$/);
    if (m) return BLK('roll', { kind: 'Damage', count: num(m[1]), die: 'd' + m[2], dmgType: type, scaling: 'flat' });
    return null;
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
      e.effects = statBlocksFromSrd(x.modifiers);
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
      d.attackOn = d.attack !== 'none';
      d.save = Object.assign(d.save, parseSave(x.save));
      d.sr = x.sr === true ? 'Yes' : x.sr === false ? 'No' : String(x.sr || 'Yes');
      parseDuration(e.lifecycle, x.duration);
      const rb = rollBlockFromSrd(x.damageParts, e.spell.descriptors);
      if (rb) e.effects.push(rb);
      statBlocksFromSrd(x.modifiers).forEach((sb) => e.effects.push(sb));
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
      e.effects = statBlocksFromSrd(x.modifiers);
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
  function setPath(obj, path, val) { const ks = path.split('.').filter(Boolean); let o = obj; for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; } o[ks[ks.length - 1]] = val; }
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

  const NAT_WPN_LIST = ['Claw', 'Bite', 'Slam', 'Gore', 'Tail Slap', 'Tentacle', 'Wing', 'Talon', 'Sting', 'Hoof'];
  const BASE_CLASS_LIST = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard', 'Warblade', 'Crusader', 'Swordsage', 'Duskblade', 'Beguiler', 'Swashbuckler', 'Hexblade', 'Binder', 'Incarnate', 'Totemist', 'Psion', 'Psychic Warrior', 'Bloodrager', 'Magus', 'Ur-Priest', 'Spellthief', 'Truenamer', 'Shadowcaster'];
  const DEF_LIST = ['Fear', 'Poison', 'Sleep', 'Paralysis', 'Disease', 'Mind-Affecting', 'Death Effects', 'Low-Light Vision', 'Darkvision 60 ft.', 'Blindsense 30 ft.', 'Tremorsense 30 ft.', 'Uncanny Dodge', 'Pounce (Full Attack on Charge)', 'evil or good', 'magic', 'Fire', 'Cold', 'Acid', 'Electricity', 'Sonic'];
  const datalists = () => '<datalist id="fs-dice-list">' + opts(DIE_LIST.filter((d) => d !== 'flat'), '') + '</datalist><datalist id="fs-range-list">' + opts(RANGES, '') + '</datalist><datalist id="fs-area-list">' + opts(AREAS, '') + '</datalist>' +
    '<datalist id="fs-defense-list">' + opts(DEF_LIST, '') + '</datalist><datalist id="fs-deity-list">' + opts(CAT.deities.map((d) => d.name), '') + '</datalist><datalist id="fs-weapon-names">' + opts(CAT.weapons.map((w) => baseName(w)), '') + '</datalist><datalist id="fs-spell-names">' + opts(CAT.spells.slice(0, 800).map((s) => s.name), '') + '</datalist>' +
    '<datalist id="fs-pool-list">' + opts(allPools(), '') + '</datalist><datalist id="fs-natwpn-list">' + opts(NAT_WPN_LIST, '') + '</datalist>' +
    '<datalist id="fs-spellcls-list">' + opts(Array.from(new Set(SPELL_CLASSES.concat(BASE_CLASS_LIST))), '') + '</datalist>';

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
  const allTags = () => STANDARD_TAGS.flatMap((g) => g[1]).concat(S.livingTags.filter((t) => !STD_TAG_SET.has(t)));

  const SPOT = {
    load: {
      ph: '🔍 Load Example or Existing SRD / MIC / Custom Entry…',
      layers: ['All', 'Presets', 'SRD', 'MIC', 'Saved'],
      search(q, ctx, layer) {
        layer = layer || 'All';
        if (layer === 'Saved') return rank(S.templates, q, (t) => t.name, null, 30).map((t) => SI('📌 Saved Templates', t.id, t.name, (BP_BY_ID[t.base] || {}).name || 'Template', t.facets.length + ' sections', { tpl: t.id }));
        const pre = layer === 'All' || layer === 'Presets' ? rank(PRESETS, q, (p) => p.label, null, layer === 'Presets' ? 50 : 40).map((p) => SI('⭐ Curated Presets', p.id, p.icon + ' ' + p.label, 'Preset', '', { preset: p.id })) : [];
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
        const ch = S.entry.chassis, v = chassisView(ch, S.entry), L = layer || 'All';
        const lf = (e) => L === 'All' || (L === 'Flat GP' ? !e.plus : L === '+1..+5 Bonus' ? !!e.plus : L === 'MIC' ? /MIC|Magic Item Compendium/i.test(e.src) : !/MIC|Magic Item Compendium/i.test(e.src));
        return rank(allEnchs().filter((e) => enchApplies(e, v.kind) && ch.enchantments.indexOf(e.id) < 0 && lf(e)), q, (e) => e.name, (e) => e.desc, 40)
          .map((e) => SI(e.plus ? 'Bonus-Equivalent (+' + e.plus + ')' : 'Flat Price', e.id, e.name, e.plus ? '+' + e.plus + ' bonus' : gp(e.gp), short(e.desc, 120) + ' • ' + e.src, { id: e.id }));
      },
      pick(it) { addEnchantment(it.data.id); }
    },
    crystal: {
      ph: '🔍 + MIC Augment Crystal…',
      layers: ['All', 'Least', 'Lesser', 'Greater'],
      search(q, ctx, layer) {
        const v = chassisView(S.entry.chassis, S.entry), ti = CRYSTAL_TIERS.indexOf(String(layer || '').toLowerCase());
        return rank(allCrystals().filter((c) => crystalApplies(c, v.kind) && (ti < 0 || c.cost[ti] != null)), q, (c) => c.name, (c) => (c.tiers || []).join(' '), 40)
          .map((c) => SI(c.on === 'weapon' ? 'Weapon Crystals' : 'Armor / Shield Crystals', c.id, c.name, c.cost.map((x, i) => (x == null ? null : cap1(CRYSTAL_TIERS[i]) + ' ' + gp(x))).filter(Boolean).join(' / '), short((c.tiers || []).find(Boolean) || '', 120) + ' • ' + c.src, { id: c.id }));
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
        ensureFacet('powers');
        S.entry.powers.push(pw); S.ui.cardOpen['pw:' + pw.id] = true; toast('Attached ' + ref.name); renderAll();
      }
    },
    feature: {
      ph: '🔍 + Feature / SLA / Feat…',
      layers: ['All', 'Features', 'Spells (SLA)', 'Feats'],
      search(q, ctx, layer) {
        const L = layer || 'All', out = [];
        if (L === 'All' || L === 'Features') rank(CAT.classFeatures, q, (c) => c.name, (c) => c.desc, 12).forEach((c) => out.push(SI('Class Features', c.id, c.name, c.abilityType || 'Ex', short(c.desc), { name: c.name, refId: c.id, type: c.abilityType || 'Ex', desc: c.desc })));
        if (L === 'All' || L === 'Spells (SLA)') rank(CAT.spells, q, (s) => s.name, (s) => s.desc, 12).forEach((s) => out.push(SI('Spells (as Sp SLA)', s.id, s.name, 'Sp • ' + (s.levelText || 'Lvl ' + s.level), short(s.school + ' • ' + s.desc), { name: s.name + ' (1/day, Sp)', refId: s.id, type: 'Sp', desc: s.desc })));
        if (L === 'All' || L === 'Feats') rank(CAT.feats, q, (f) => f.name, (f) => f.desc, 8).forEach((f) => out.push(SI('Feats (granted)', f.id, f.name, 'Feat', short(f.desc), { name: f.name, refId: f.id, type: 'Ex', desc: f.desc })));
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
    },
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
      search(q) { return rank(allSkills().filter((s) => S.entry.progression.classSkills.indexOf(s.name) < 0), q, (s) => s.name, null, 36).map((s) => SI(s.custom ? 'Custom Skills' : '3.5e Skills', s.name, s.name, s.ability.toUpperCase() + (s.custom ? ' • Custom' : ''), '', { name: s.name })); },
      pick(it) { S.entry.progression.classSkills.push(it.data.name); renderAll(); }
    },
    favwpn: {
      ph: '🔍 Select Base Weapon',
      search(q) { return rank(CAT.weapons, q, (w) => w.name, null, 30).map((w) => SI(w.category + ' Weapons', w.id, baseName(w), w.dice, w.handed, { name: baseName(w) })); },
      pick(it) { S.entry.grants.favoredWeapon = it.data.name; renderAll(); }
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

  // --------------------------------------------------------------------------
  // 12. Live slots (refreshed on keystrokes without rebuilding inputs)
  // --------------------------------------------------------------------------
  const LIVE = {
    'prereq-row': (i) => { const r = S.entry.prereqs[num(i)]; return r ? esc(r.alts.map(altText).join(' OR ')) : ''; },
    'prereq-all': () => (S.entry.prereqs.length ? '<span class="fs-hint">Readable: ' + esc(prereqText(S.entry.prereqs)) + '</span>' : ''),
    'dc': () => esc(dcText(S.entry) || 'No saving throw'),
    'budget': () => budgetHtml(),
    'chassis-warn': () => chassisView(S.entry.chassis, S.entry).warnings.map((w) => '<div class="fs-warn" style="font-size:11px">⚠️ ' + esc(w) + '</div>').join(''),
    'gp-table': () => { const v = chassisView(S.entry.chassis, S.entry); return v.gpRows.map((r) => '<div class="fs-bd-row"><span class="src">' + esc(r[0]) + '</span><b>' + gp(r[1]) + '</b></div>').join('') + '<div class="fs-bd-row" style="border-top:1px solid var(--border-subtle);margin-top:3px;padding-top:3px"><span>Total Market Price</span><b class="fs-up">' + gp(v.gpTotal) + '</b></div>'; },
    'grant-sum': (i) => { const g = S.entry.grants.featGrants[num(i)]; return g ? esc('Level ' + g.level + ': Grant ' + g.count + ' Feat' + (g.count > 1 ? 's' : '') + ' from ' + g.pool) : ''; },
    'pw-sum': (i) => { const pw = S.entry.powers[num(i)]; return pw ? esc(powerSummary(pw)) : ''; },
    'feat-sum': (a) => { const p = a.split(':'); const f = (S.entry.progression.levels[num(p[0])] || { features: [] }).features[num(p[1])]; return f ? esc(f.name) : ''; },
    'dom-sum': (i) => { const d = S.entry.grants.domains[num(i)]; return d ? esc(d.name + (d.grantedPower ? ' — ' + short(d.grantedPower, 80) : '')) : ''; },
    'deity-sum': (i) => { const d = S.entry.grants.deities[num(i)]; return d ? esc(d.name + ' (' + d.align + ') • Favored Weapon: ' + d.favoredWeapon) : ''; },
    'roll-preview': (path) => {
      const b = getPath(S.entry, path);
      if (!b || b.type !== 'roll') return '';
      return esc(rollBlockText(b)) + (b.scaling === 'perCL' ? ' <span class="fs-hint">— CL 1: ' + rollAtCL(b, 1) + ' • CL 5: ' + rollAtCL(b, 5) + ' • CL 10: ' + rollAtCL(b, 10) + ' • CL 20: ' + rollAtCL(b, 20) + '</span>' : '');
    }
  };
  function budgetHtml() {
    const v = chassisView(S.entry.chassis, S.entry);
    const pct = Math.min(100, v.effective * 10);
    const color = v.effective > 10 ? 'var(--accent-rose)' : v.effective >= 8 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
    return '<div style="display:flex;align-items:center;gap:8px;font-size:11.5px;flex-wrap:wrap"><b style="color:var(--text-primary)">Effective Enhancement ' + sgn(v.effective) + ' / +10</b><span class="fs-hint">Base ' + sgn(v.enh) + ' + Special Abilities ' + sgn(v.plusSum) + ' — Remaining ' + sgn(Math.max(0, 10 - v.effective)) + '</span></div>' +
      '<div class="fs-bar"><div style="width:' + pct + '%;background:' + color + '"></div></div>';
  }

  // --------------------------------------------------------------------------
  // 13. Render: compact top bar & sticky object preview
  // --------------------------------------------------------------------------
  const ABIL_OPTS = ABILITIES.map((a) => [a[0], a[1]]);
  function customSkillPopover() {
    if (!S.ui.customSkillOpen) return '';
    const cs = S.ui.customSkill;
    const list = S.customSkills.length ? '<div class="fs-row" style="margin-top:8px">' + S.customSkills.map((c, i) => '<span class="fs-pill sky">' + esc(c.name) + ' (' + esc(c.ability.toUpperCase()) + ')<span class="fs-x" data-action="remove-custom-skill" data-i="' + i + '">×</span></span>').join('') + '</div>' : '';
    return '<div class="fs-pop"><div class="fs-section-label" style="margin-top:0">🎯 New Custom Skill</div>' +
      '<div class="fs-grid2">' + field('Skill Name', inp('customSkill.name', cs.name, { scope: 'ui', ph: 'e.g. Autohypnosis / Truespeak', enter: 'save-custom-skill' })) +
      field('Key Ability', sel('customSkill.ability', cs.ability, ABIL_OPTS, { scope: 'ui' })) + '</div>' +
      '<div class="fs-row" style="margin-top:8px">' + chk('customSkill.trainedOnly', cs.trainedOnly, 'Trained Only', { scope: 'ui' }) + chk('customSkill.acp', cs.acp, 'Armor Check Penalty', { scope: 'ui' }) + '</div>' +
      '<div class="fs-row" style="margin-top:10px">' + btn('save-custom-skill', 'Save Skill', 'fs-xs fs-emerald') + btn('toggle-custom-skill', 'Cancel', 'fs-xs fs-ghost') + '</div>' + list + '</div>';
  }
  function renderTopbar() {
    const curTpl = S.entry.templateId || '';
    const catSel = '<select class="fs-sel" data-topcat="1" style="width:auto;min-width:190px" title="Category / Template"><optgroup label="Category">' + opts(BLUEPRINTS.map((b) => [b.id, b.icon + ' ' + b.name]), curTpl ? '' : S.entry.blueprint) + '</optgroup>' +
      (S.templates.length ? '<optgroup label="📌 Saved Templates">' + opts(S.templates.map((t) => [t.id, t.name]), curTpl) + '</optgroup>' : '') + '</select>';
    const save = S.ui.tplSaveOpen ? '<span class="fs-row" style="gap:4px">' + inp('newTplName', S.ui.newTplName, { scope: 'ui', ph: 'Template name…', style: 'width:150px', enter: 'save-template' }) + btn('save-template', 'Save', 'fs-xs fs-emerald') + btn('toggle-tpl-save', '✕', 'fs-xs fs-ghost') + '</span>' : btn('toggle-tpl-save', '📌 Save Template', 'fs-xs');
    const skillPop = '<span class="fs-rel">' + btn('toggle-custom-skill', '+ 🎯 Custom Skill', 'fs-xs' + (S.ui.customSkillOpen ? ' fs-on' : '')) + customSkillPopover() + '</span>';
    const importBtn = btn('toggle-import-json', '📥 Import JSON', 'fs-xs' + (S.ui.importOpen ? ' fs-on' : ''));
    const status = CAT.srdLoaded ? '<span class="fs-pill emerald" title="SrdCompendium + master_db.json">📚 SRD ' + CAT.srdCount.toLocaleString('en-US') + (CAT.customCount ? ' + ' + CAT.customCount + ' custom' : '') + '</span>' : '<span class="fs-pill dim" title="Serve over http:// to load srd_compendium.js data">📚 Offline seed</span>';
    $('#fs-topbar').innerHTML = '<div class="fs-topbar-row"><div class="fs-title">' + DICE_SVG + ' Living Facet Studio</div>' + catSel +
      '<div class="fs-top-spot">' + spotHtml('load', 'top') + '</div>' + save + skillPop + importBtn + btn('new-entry', '✨ Blank', 'fs-xs') + status + '</div>';
  }
  function renderLiveHeader() {
    const en = S.entry, bp = BP_BY_ID[en.blueprint] || BLUEPRINTS[0], has = (k) => en.facets.indexOf(k) >= 0;
    const FEAT_KIND_NAMES = { feat: 'Feat', acf: 'Alternate Class Feature (ACF)', substitution: 'Racial Substitution Level', boon: 'Boon / Trait' };
    let sub = en.blueprint === 'feat' ? (FEAT_KIND_NAMES[en.featKind] || 'Feat') : bp.name.split(' /')[0];
    if (isItemBp(en.blueprint)) sub = (isConsumable(en) ? 'Consumable • ' : '') + en.item.subtype + (has('chassis') ? '' : ' • ' + en.item.slot.split(' /')[0]);
    if (en.blueprint === 'spell') {
      const sp = en.spell, sys = sp.system || 'spell';
      if (sys === 'maneuver') sub = 'Martial ' + sp.maneuverType + ' • ' + sp.discipline + ' ' + num(sp.maneuverLvl, 1);
      else if (sys === 'invocation') sub = (sp.invKind || 'Invocation') + ' • ' + sp.invGrade + ' (Lvl ' + num(sp.maneuverLvl, 1) + ')';
      else if (sys === 'psionic') sub = 'Psionic Power • ' + sp.discipline + ' ' + num(sp.maneuverLvl, 1);
      else if (sys === 'soulmeld') sub = 'Soulmeld • ' + (sp.meldshaperList || 'Totemist') + ' (' + (sp.chakraSlots || 'Arms / Totem') + ')';
      else if (sys === 'vestige') sub = 'Vestige Lvl ' + num(sp.vestigeLvl, 1) + ' • DC ' + num(sp.bindingDc, 15);
      else if (sys === 'utterance') sub = 'Utterance • ' + (sp.lexicon || 'Evolving Mind') + ' ' + num(sp.maneuverLvl, 1);
      else if (sys === 'mystery') sub = (sp.mysteryTier || 'Apprentice') + ' Mystery • Lvl ' + num(sp.maneuverLvl, 1);
      else sub = 'Spell' + (sp.classes.length ? ' • ' + spellLevelText(sp) : '');
    }
    if (en.blueprint === 'class') sub = en.progression.mode === 'prestige' ? 'Prestige Class' : en.progression.mode === 'base' ? 'Base Class' : en.progression.mode === 'hd' ? 'HD Scaling' : 'Legacy Progression';
    if (en.blueprint === 'item_mod') sub = (en.itemMod.kind === 'crystal' ? 'Augment Crystal' : en.itemMod.kind === 'material' ? 'Special Material' : 'Enchantment') + ' (' + en.itemMod.on + ')';
    if (en.blueprint === 'race') sub = (en.race.kind === 'template' ? en.race.timing + ' Template' : 'Base Race') + ' • ' + en.race.size + ' ' + en.race.creatureType;
    let l1 = '<span class="fs-live-icon">' + bp.icon + '</span><span class="fs-live-name">' + esc(entryName(en)) + '</span><span class="fs-pill indigo">' + esc(sub) + '</span>' +
      '<span class="fs-pill ' + (en.origin.mode === 'new' ? 'dim' : en.origin.mode === 'override' ? 'amber' : 'sky') + '">' + esc(ORIGIN_LABEL[en.origin.mode]) + (en.origin.srdName && en.origin.mode !== 'new' ? ': ' + esc(en.origin.srdName) : '') + '</span>' +
      en.tags.map((t) => '<span class="fs-pill purple">' + esc(t) + '</span>').join('');
    if (has('chassis')) { const v = chassisView(en.chassis, en); l1 += '<span class="fs-grow-gap"></span><span class="fs-pill ' + (v.effective > 10 ? 'rose' : 'emerald') + '">' + sgn(v.effective) + ' / +10</span><span class="fs-pill amber">💰 ' + gp(v.gpTotal) + '</span>'; }
    else if (isItemBp(en.blueprint) && num(en.item.price)) l1 += '<span class="fs-grow-gap"></span><span class="fs-pill amber">💰 ' + gp(en.item.price) + '</span>';
    const segs = rawHeaderLine(en);
    const l2 = segs.length ? segs.map(esc).join(' <span class="fs-sep">•</span> ') : '<span class="fs-hint">Configure the sections below — the clean RAW stat line renders here.</span>';
    const pills = summaryPills(en);
    const l3 = pills.length ? pills.map((p) => '<span class="fs-pill ' + p[0] + '">' + esc(p[1]) + '</span>').join('') : '<span class="fs-hint">Snap Lego Core V3 blocks below to compose resources, triggers, carriers, stats, rolls, attacks, defenses, and effects.</span>';
    const warns = has('chassis') ? chassisView(en.chassis, en).warnings : [];
    l1 += '<button type="button" class="fs-btn fs-xs fs-live-toggle" data-action="toggle-live">' + (S.ui.liveOpenMobile ? '▴ Hide' : '▾ Preview') + '</button>';
    $('#fs-live').innerHTML = '<div class="fs-live-line">' + l1 + '</div><div class="fs-live-more' + (S.ui.liveOpenMobile ? ' open' : '') + '"><div class="fs-live-line fs-live-card">' + l2 + '</div><div class="fs-live-line">' + l3 + '</div>' + (warns.length ? '<div class="fs-live-line" style="font-size:11px">' + warns.slice(0, 2).map((w) => '<span class="fs-down">⛔ ' + esc(w) + '</span>').join(' ') + '</div>' : '') + '</div>';
  }

  // --------------------------------------------------------------------------
  // 14. Render: Lego Core V3 Scratch blocks & 11 blueprints
  // --------------------------------------------------------------------------
  const L = (t) => '<span class="lego-lbl">' + t + '</span>';
  const hat = (color, inner) => '<div class="lego-hat lego-tab ' + color + '">' + inner + '</div>';
  const stack = (color, inner) => '<div class="lego-block lego-tab ' + color + '">' + inner + '</div>';
  const delBtn = (action, data) => '<button type="button" class="lego-del" data-action="' + action + '"' + Object.keys(data).map((k) => ' data-' + k + '="' + esc(data[k]) + '"').join('') + ' title="Remove">✕</button>';
  function cBlock(color, head, inner) { return '<div class="lego-c ' + color + '"><div class="c-top">' + head + '</div><div class="c-mouth"><div class="c-spine"></div><div class="c-inner">' + inner + '</div></div><div class="c-bot lego-tab"></div></div>'; }

  const USE_MODES = [['passive', 'Passive (Always On)'], ['atwill', '♾️ At-Will'], ['perDay', '🔄 X / Day (Resets Daily)'], ['perEncounter', '⚡ X / Encounter'], ['charges', '🧪 X Charges / Uses (Depletes — Potion/Scroll/Wand)'], ['spellSlot', '🔮 Expend Spell Slot'], ['resourcePool', '🔥 Expend Pool (Turn Undead / Bardic / Ki)'], ['cooldown', '⏳ Cooldown Rounds (e.g. 1d4)']];
  function usageEditor(p, u) {
    let param = '';
    if (['perDay', 'perEncounter', 'charges'].indexOf(u.mode) >= 0) param = inp(p + '.n', u.n, { num: true, min: 1, max: 50, style: 'width:70px' });
    else if (u.mode === 'spellSlot') param = sel(p + '.slotLevel', u.slotLevel, range(0, 9).map((n) => [n, 'Slot Level ' + n]), { narrow: true, num: true });
    else if (u.mode === 'resourcePool') param = '<input class="fs-in" style="width:130px" data-bind="' + p + '.pool" list="fs-pool-list" value="' + esc(u.pool) + '">' + inp(p + '.poolCost', u.poolCost, { num: true, min: 1, style: 'width:60px' }) + '<span class="fs-hint">use(s)</span>';
    else if (u.mode === 'cooldown') param = inp(p + '.cooldown', u.cooldown, { ph: '1d4+1', style: 'width:80px' }) + '<span class="fs-hint">rounds</span>';
    return '<span class="fs-row" style="gap:4px">' + sel(p + '.mode', u.mode, USE_MODES, { narrow: true }) + param + '</span>';
  }

  function altEditor(ri, ai, a) {
    const p = 'prereqs.' + ri + '.alts.' + ai + '.';
    let body = '';
    switch (a.kind) {
      case 'ability': body = sel(p + 'ability', a.ability, ABIL_OPTS, { narrow: true }) + sel(p + 'min', a.min, range(3, 30).map((n) => [n, 'Min ' + n]), { narrow: true, num: true }); break;
      case 'bab': body = sel(p + 'min', a.min, range(1, 20).map((n) => [n, 'Base Attack Bonus +' + n]), { narrow: true, num: true }); break;
      case 'skill': body = sel(p + 'skill', a.skill, allSkills().map((s) => [s.key, s.name]), { narrow: true }) + sel(p + 'min', a.min, range(1, 23).map((n) => [n, n + ' ranks']), { narrow: true, num: true }); break;
      case 'feat': body = (a.feat ? '<span class="fs-pill indigo">' + esc(altText(a)) + '</span>' : '') + spotHtml('prereq', ri + ':' + ai, { style: 'width:260px' }); break;
      case 'level': body = sel(p + 'levelKind', a.levelKind, [['casterLevel', 'Caster Level'], ['charLevel', 'Character Level'], ['classLevel', 'Class Level']], { narrow: true }) + (a.levelKind === 'classLevel' ? inp(p + 'cls', a.cls, { ph: 'Fighter', style: 'width:90px' }) : '') + sel(p + 'min', a.min, range(1, 20).map((n) => [n, '≥ ' + n]), { narrow: true, num: true }); break;
      case 'alignment': body = sel(p + 'align', a.align, ALIGN_REQS.map((x) => [x, ALIGN_NAMES[x] || x]), { narrow: true }); break;
      case 'custom': body = inp(p + 'text', a.text, { ph: 'e.g. Must have slain a dragon; DM approval', style: 'width:260px' }); break;
      case 'spellcasting': body = sel(p + 'cls', a.cls || 'any', [['any', 'Any'], ['arcane', 'Arcane'], ['divine', 'Divine']], { narrow: true }) + sel(p + 'min', a.min, range(0, 9).map((n) => [n, 'Spell Level ' + n]), { narrow: true, num: true }); break;
      case 'deity': body = inp(p + 'feat', a.feat, { list: 'fs-deity-list', ph: 'Pelor', style: 'width:180px' }); break;
    }
    return '<div class="fs-row" style="margin-top:4px">' + (ai > 0 ? '<span class="fs-or">OR</span>' : '') +
      sel(p + 'kind', a.kind, [['ability', 'Ability Score'], ['bab', 'Base Attack Bonus'], ['skill', 'Skill Ranks'], ['feat', 'Feat / Tag Pool / Ability'], ['level', 'Caster / Class Level'], ['alignment', 'Alignment'], ['spellcasting', 'Spellcasting'], ['deity', 'Patron Deity'], ['custom', 'Special / DM Requirement']], { narrow: true }) +
      body + btn('remove-alt', '×', 'fs-xs fs-ghost', { ri: ri, ai: ai }) + '</div>';
  }
  function bonusTypeOpts() { return allBonusTypes().map((b) => [b.id, b.id + (b.custom ? ' (custom)' : '') + (b.stacks ? ' — stacks' : '') + (b.lostFF ? ', lost Flat-Footed' : '') + (b.cap ? ' — max +' + b.cap : '')]); }
  function targetChips(list, p) {
    return (list || []).map((t, i) => '<span class="fs-pill indigo">' + esc(targetLabel(t)) + '<span class="fs-x" data-action="remove-target" data-p="' + p + '" data-i="' + i + '">×</span></span>').join('') +
      '<select class="fs-sel fs-narrow" data-push="' + p + '"><option value="">+ Target</option>' + allTargetGroups().map((g) => '<optgroup label="' + esc(g[0]) + '">' + opts(g[1], '') + '</optgroup>').join('') + '</select>';
  }

  function statControlsHtml(p, m) {
    const mode = modMode(m);
    const tgtHtml = targetChips(m.targets || ['atk.all'], p + '.targets');
    const modeSel = sel(p + '.mode', mode, [['flat', 'Flat (+/-)'], ['stat', '+ @Stat / @Resource'], ['replaceStat', '🔄 Replace Stat'], ['perCL', '+N per X CL/Lvl']], { narrow: true });
    let body = '';
    if (mode === 'stat') {
      body = inp(p + '.value', m.value == null ? 0 : m.value, { num: true, ph: '+Base', style: 'width:50px' }) +
        L('+') + sel(p + '.mult', m.mult == null ? 1 : m.mult, [[1, '×1'], [2, '×2'], [3, '×3'], [0.5, '×½'], [-1, '×-1']], { narrow: true, num: true }) +
        sel(p + '.stat', m.stat || 'chaMod', statFormulaOpts(S.entry), { narrow: true }) +
        sel(p + '.cap', m.cap || 'none', [['none', 'No Cap'], ['classLevel', 'Cap @Class Lvl'], ['flat', 'Cap Max N']], { narrow: true }) +
        (m.cap === 'flat' ? inp(p + '.capVal', m.capVal == null ? 5 : m.capVal, { num: true, style: 'width:48px' }) : '') +
        sel(p + '.btype', m.btype || 'Untyped', bonusTypeOpts().map((x) => [x[0], x[0]]), { narrow: true }) +
        inp(p + '.condition', m.condition || '', { ph: 'condition (vs Fear)', style: 'width:120px' });
    } else if (mode === 'replaceStat') {
      body = sel(p + '.subOp', m.subOp || 'replace', [['replace', 'Replace'], ['max', 'Higher Of']], { narrow: true }) +
        sel(p + '.fromStat', m.fromStat || 'wis', ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true }) +
        L('→') + sel(p + '.toStat', m.toStat || 'con', ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true }) +
        inp(p + '.condition', m.condition || '', { ph: 'condition (Light/Rapier)', style: 'width:130px' });
    } else if (mode === 'perCL') {
      body = L('+') + inp(p + '.value', m.value == null ? 1 : m.value, { num: true, style: 'width:48px' }) +
        L('every') + sel(p + '.per', m.per || 3, range(1, 10).map((n) => [n, n + ' CL/Lvl']), { narrow: true, num: true }) +
        L('min') + inp(p + '.min', m.min == null ? 0 : m.min, { num: true, style: 'width:46px' }) +
        L('max') + inp(p + '.max', m.max == null ? 5 : m.max, { num: true, style: 'width:46px' }) +
        sel(p + '.btype', m.btype || 'Untyped', bonusTypeOpts().map((x) => [x[0], x[0]]), { narrow: true }) +
        inp(p + '.condition', m.condition || '', { ph: 'condition (vs Fear)', style: 'width:120px' });
    } else {
      body = inp(p + '.value', m.value, { num: true, style: 'width:54px' }) +
        sel(p + '.btype', m.btype || 'Untyped', bonusTypeOpts().map((x) => [x[0], x[0]]), { narrow: true }) +
        inp(p + '.condition', m.condition || '', { ph: 'condition (vs Fear)', style: 'width:120px' });
    }
    return tgtHtml + modeSel + body;
  }

  function whenBranchControls(flow, br, bp) {
    if (flow === 'while') {
      return sel(bp + '.condKind', br.condKind || 'state', [
        ['state', 'While State Active'],
        ['bound', 'While Bound to Chakra / Pact'],
        ['levelTier', 'CL / Class / HD Tier'],
        ['synergy', 'Active #Tag / Synergy'],
        ['situational', 'Equipment / Combat State']
      ], { narrow: true }) +
      inp(bp + '.condText', br.condText || '', { ph: 'Bloodrage / Totem Chakra / CL ≤ 11', style: 'width:165px' });
    }
    const trig = br.trigger || 'activate';
    const ck = br.costKind || 'none';
    return sel(bp + '.trigger', trig, [
      ['activate', 'Activate Action'],
      ['enterState', 'On Enter State'],
      ['meleeHit', 'On Melee Hit'],
      ['critHit', 'On Critical Hit'],
      ['sneakHit', 'On Sneak Attack Hit'],
      ['takeDamage', 'On Taking Damage'],
      ['castSpell', 'When Casting Spell']
    ], { narrow: true }) +
    (trig === 'activate' ? sel(bp + '.action', br.action || 'Swift', ['Standard', 'Swift', 'Move', 'Immediate', 'Free', 'Full-Round'], { narrow: true }) : '') +
    (['enterState', 'castSpell'].indexOf(trig) >= 0 ? inp(bp + '.targetText', br.targetText || '', { ph: 'Bloodrage / Arcane Spell', style: 'width:120px' }) : '') +
    L('Cost') + sel(bp + '.costKind', ck, [
      ['none', 'Free / No Cost'],
      ['pool', 'Spend @Pool'],
      ['forgoSA', 'Forgo Nd6 Sneak Attack'],
      ['skillCheck', 'Skill Check DC'],
      ['expendFocus', 'Expend Psionic Focus'],
      ['cooldown', 'Cooldown Rounds'],
      ['perDay', 'N / Day']
    ], { narrow: true }) +
    (ck === 'pool' ? inp(bp + '.costFormula', br.costFormula || '1', { ph: '1 / Spell Level', style: 'width:90px' }) + '<input class="fs-in" style="width:115px" data-bind="' + bp + '.poolName" list="fs-pool-list" value="' + esc(br.poolName || 'Arcane Pool') + '">' : '') +
    (ck === 'forgoSA' ? inp(bp + '.costVal', br.costVal || 1, { num: true, min: 1, style: 'width:46px' }) + L('d6 SA') : '') +
    (ck === 'skillCheck' ? inp(bp + '.checkFormula', br.checkFormula || '', { ph: 'Truespeak DC 15 + 2×CR + 2×@uses_today', style: 'width:210px' }) : '') +
    (ck === 'cooldown' ? inp(bp + '.cooldownText', br.cooldownText || '5 rounds', { ph: '5 rounds / 1d4', style: 'width:90px' }) : '') +
    (ck === 'perDay' ? inp(bp + '.costVal', br.costVal || 1, { num: true, min: 1, style: 'width:46px' }) + L('/day') : '');
  }

  function blockControls(b, p) {
    switch (b.type) {
      case 'resource': {
        const rm = b.resMode || 'spend';
        const showScaling = ['spend', 'buffer'].indexOf(rm) >= 0;
        const showAbil = showScaling && ['plusMod', 'halfLvlPlusMod', 'twoPerLvlPlusMod'].indexOf(b.scaling) >= 0;
        return inp(p + '.name', b.name, { ph: 'Resource / Dial name', style: 'width:140px' }) +
          L('@') + inp(p + '.varKey', b.varKey, { ph: 'var_key', style: 'width:105px' }) +
          sel(p + '.resMode', rm, [
            ['spend', 'Spendable Pool'],
            ['invest', 'Investable (Essentia)'],
            ['dial', 'Tactical Dial (0..Max)'],
            ['focus', 'Binary Focus (0/1)'],
            ['buffer', 'Absorb / Steal Buffer']
          ], { narrow: true }) +
          (rm === 'invest' ? L('Cap') + sel(p + '.capMode', b.capMode || 'chakra', [['chakra', 'Chakra Capacity'], ['flat', 'Flat Max'], ['level', '@Level']], { narrow: true }) : '') +
          (rm === 'dial' ? L('0..') + sel(p + '.maxMode', b.maxMode || 'spellLvl', [['flat', 'Flat N'], ['bab', '@BAB'], ['level', '@Level'], ['spellLvl', 'Spell Slot (1–9)'], ['pool', 'Pool Remaining']], { narrow: true }) +
            (b.maxMode === 'flat' ? inp(p + '.max', b.max, { num: true, style: 'width:48px' }) : '') +
            L('Cost') + sel(p + '.dialCost', b.dialCost || 'free', [['free', 'Free Tradeoff'], ['spellSlot', 'Burn Spell Slot'], ['pool', 'Spend Pool']], { narrow: true }) +
            (b.dialCost === 'pool' ? '<input class="fs-in" style="width:115px" data-bind="' + p + '.costPool" list="fs-pool-list" value="' + esc(b.costPool || '') + '">' : '') : '') +
          (showScaling ? L('Max') + inp(p + '.max', b.max, { num: true, min: 0, style: 'width:50px' }) +
            sel(p + '.scaling', b.scaling || 'flat', [
              ['flat', 'Flat'], ['level', '@Level'], ['halfLevel', '½ @Level'],
              ['plusMod', 'Base + @Mod'], ['halfLvlPlusMod', 'Base + ½ @Level + @Mod'], ['twoPerLvlPlusMod', 'Base + 2/Lvl + @Mod']
            ], { narrow: true }) : '') +
          (showAbil ? sel(p + '.ability', b.ability || 'int', ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true }) : '') +
          sel(p + '.reset', b.reset || 'perDay', [['atWill', 'At-Will / Round'], ['cooldown', 'Cooldown Rounds'], ['perEncounter', 'Per Encounter'], ['perDay', 'Per Day']], { narrow: true }) +
          (b.reset === 'cooldown' ? inp(p + '.cooldownText', b.cooldownText || '5 rounds', { ph: '5 rounds', style: 'width:80px' }) : '');
      }
      case 'when': {
        return sel(p + '.flow', b.flow || 'while', [
          ['while', 'Continuous (While / Tier / Synergy)'],
          ['when', 'Event Trigger (When / Activate / On Hit)']
        ], { narrow: true });
      }
      case 'table': {
        return L('Roll') + inp(p + '.die', b.die, { list: 'fs-dice-list', style: 'width:66px' });
      }
      case 'carrier': {
        const cm = b.carrierMode || 'meleeChannel';
        const modeSel = sel(p + '.carrierMode', cm, [
          ['meleeChannel', '⚔️ Melee Spell Channel'],
          ['rangedChannel', '🏹 Ranged Spell Channel'],
          ['fullAttackCast', '⚔️🔮 Full-Attack + Cast (Spell Combat)'],
          ['metamagic', '✨ Spell / Power Envelope Transform']
        ], { narrow: true });
        if (cm === 'meleeChannel') {
          const st = b.channelStyle || 'spellstrikeFree';
          return modeSel +
            sel(p + '.channelStyle', st, [
              ['spellstrikeFree', 'Spellstrike (Free Melee Weapon Atk)'],
              ['standardSingle', 'Arcane Channel (Standard 1 Melee Atk)'],
              ['fullAttackEach', 'Full-Attack Channel (Hits Every Struck Foe)'],
              ['spellStoring', 'Spell Storing Weapon (≤ Lvl N)']
            ], { narrow: true }) +
            (st === 'spellStoring'
              ? L('Max Lvl') + sel(p + '.maxSpellLvl', b.maxSpellLvl || 3, range(1, 9), { narrow: true, num: true })
              : sel(p + '.critRule', b.critRule || 'weaponRangeX2', [
                  ['weaponRangeX2', 'Weapon Crit Range, Spell ×2'],
                  ['spell20x2', 'Spell Normal Crit (20/×2)'],
                  ['fullWeaponCrit', 'Full Weapon Crit Range & Mult']
                ], { narrow: true }) + chk(p + '.holdCharge', !!b.holdCharge, 'Hold Charge'));
        }
        if (cm === 'rangedChannel') {
          return modeSel + L('Imbue Arrow / Deliver Area or Touch Spell via Ranged Hit');
        }
        if (cm === 'fullAttackCast') {
          return modeSel + L('All Atk Δ') + inp(p + '.atkPenalty', b.atkPenalty, { num: true, style: 'width:50px' }) + chk(p + '.offHandFree', !!b.offHandFree, 'Off-Hand Free');
        }
        return modeSel +
          sel(p + '.costMode', b.costMode || 'slot', META_COST_MODES, { narrow: true }) +
          (b.costMode === 'slot' ? sel(p + '.slotAdj', b.slotAdj, range(0, 6).map((n) => [n, '+' + n + ' Slot']), { narrow: true, num: true }) : '') +
          (b.costMode === 'rod' ? inp(p + '.uses', b.uses, { num: true, style: 'width:48px' }) + L('/day • Max') + sel(p + '.maxSpellLvl', b.maxSpellLvl, [[3, 'Lvl 3 (Lesser)'], [6, 'Lvl 6 (Normal)'], [9, 'Lvl 9 (Greater)']], { narrow: true, num: true }) : '') +
          (b.costMode === 'sudden' ? inp(p + '.uses', b.uses, { num: true, style: 'width:48px' }) + L('/day') : '') +
          (b.costMode === 'pool' ? inp(p + '.poolCost', b.poolCost, { num: true, style: 'width:48px' }) + '<input class="fs-in" style="width:120px" data-bind="' + p + '.pool" list="fs-pool-list" value="' + esc(b.pool) + '">' : '') +
          (b.costMode === 'essenceShape' ? L('Eff. Lvl') + sel(p + '.maxSpellLvl', b.maxSpellLvl || 1, range(1, 9), { narrow: true, num: true }) : '') +
          L('→') + sel(p + '.transform', b.transform || 'empower', META_TRANSFORMS, { narrow: true }) +
          (b.transform === 'heighten' ? L('DC +') + inp(p + '.dcBonus', b.dcBonus, { num: true, style: 'width:48px' }) : '') +
          ((b.transform === 'energySub' || b.transform === 'pierceRes') ? sel(p + '.energy', b.energy, ['Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Any'], { narrow: true }) : '') +
          (b.transform === 'rider' ? inp(p + '.rider', b.rider, { ph: '+1 Negative Level (Fell Drain)', style: 'width:165px' }) : '') +
          inp(p + '.appliesTo', b.appliesTo, { ph: 'scope ([Fire] / ray / all)', style: 'width:135px' });
      }
      case 'stat': return statControlsHtml(p, b);
      case 'roll': {
        const sc = b.scaling || 'flat';
        return sel(p + '.kind', b.kind || 'Damage', ['Damage', 'Healing', 'Temp HP', 'Ongoing / Round', 'Fast Healing'], { narrow: true }) +
          inp(p + '.count', b.count, { num: true, min: 0, style: 'width:48px' }) +
          sel(p + '.die', b.die || 'd6', [['d4', 'd4'], ['d6', 'd6'], ['d8', 'd8'], ['d10', 'd10'], ['d12', 'd12'], ['2d6', '2d6'], ['flat', 'Flat']], { narrow: true }) +
          ((b.kind === 'Damage' || b.kind === 'Ongoing / Round') ? sel(p + '.dmgType', b.dmgType || 'Fire', DAMAGE_TYPES.slice(0, 16), { narrow: true }) : '') +
          sel(p + '.scaling', sc, [['flat', 'Flat'], ['perCL', '+ per CL'], ['perVar', '+ @Resource']], { narrow: true }) +
          (sc === 'perCL'
            ? L('+') + inp(p + '.amount', b.amount == null ? 1 : b.amount, { num: true, style: 'width:46px' }) +
              L('per') + sel(p + '.per', b.per || 1, range(1, 10).map((n) => [n, n + ' CL']), { narrow: true, num: true }) +
              L('from') + sel(p + '.start', b.start || 1, range(1, 20).map((n) => [n, 'CL ' + n]), { narrow: true, num: true }) +
              L('max +') + inp(p + '.max', b.max == null ? 10 : b.max, { num: true, style: 'width:48px' })
            : '') +
          (sc === 'perVar'
            ? sel(p + '.varKey', b.varKey || 'augment_pp', resourceVarOpts(S.entry), { narrow: true }) +
              sel(p + '.varMode', b.varMode || 'dice', [['dice', '+@X Dice'], ['flat', '+N×@X Flat']], { narrow: true }) +
              (b.varMode === 'flat' ? inp(p + '.amount', b.amount == null ? 1 : b.amount, { num: true, style: 'width:46px' }) : '')
            : '') +
          sel(p + '.crit', b.crit || 'normal', [['normal', 'Normal Crit'], ['multiply', '×Crit'], ['onCritOnly', 'On Crit Only']], { narrow: true }) +
          inp(p + '.save', b.save || '', { ph: 'save (Reflex half)', style: 'width:110px' }) +
          inp(p + '.condition', b.condition || '', { ph: 'condition (vs Undead)', style: 'width:120px' }) +
          '<span class="lego-desc">' + live('roll-preview', p) + '</span>';
      }
      case 'attack': {
        const am = b.attackMode || 'natural';
        const modeSel = sel(p + '.attackMode', am, [
          ['natural', '🦷 Natural Attack'],
          ['extra', '⚡ Extra Attack (Haste / Flurry)'],
          ['weaponImbue', '🗡️✨ Temporary Weapon Imbue']
        ], { narrow: true });
        if (am === 'natural') {
          return modeSel +
            sel(p + '.natKind', b.natKind || 'primary', [
              ['primary', 'Primary (Full BAB, 1× Str)'],
              ['secondary', 'Secondary (-5 Atk, ½ Str)'],
              ['primary2h', 'Single Primary (1.5× Str)']
            ], { narrow: true }) +
            inp(p + '.count', b.count, { num: true, min: 1, max: 12, style: 'width:46px' }) + L('×') +
            inp(p + '.weaponName', b.weaponName, { list: 'fs-natwpn-list', ph: 'Claw / Bite', style: 'width:96px' }) +
            inp(p + '.dice', b.dice, { list: 'fs-dice-list', style: 'width:62px' }) +
            sel(p + '.dmgType', b.dmgType, ['B/P/S', 'B & S', 'B, P & S', 'Slashing', 'Piercing', 'Bludgeoning', 'B & P'], { narrow: true }) +
            inp(p + '.rider', b.rider, { ph: 'rider (Rend / +1d6 Fire)', style: 'width:140px' });
        }
        if (am === 'extra') {
          return modeSel +
            sel(p + '.extraKind', b.extraKind || 'extraFull', [
              ['extraFull', 'Full BAB (Haste / Speed)'],
              ['flurry', 'With Penalty (Flurry / Rapid)']
            ], { narrow: true }) +
            inp(p + '.count', b.count, { num: true, min: 1, max: 6, style: 'width:46px' }) + L('×') +
            (b.extraKind === 'flurry' ? L('All Atk Δ') + inp(p + '.penalty', b.penalty, { num: true, style: 'width:50px' }) : '') +
            inp(p + '.rider', b.rider, { ph: 'notes…', style: 'width:130px' });
        }
        return modeSel +
          inp(p + '.duration', b.duration || '1 min', { ph: '1 min', style: 'width:72px' }) +
          sel(p + '.budgetScaling', b.budgetScaling || 'per4Lvl', [['per4Lvl', '+1 at L1, +1/4 Lvls (max +N)'], ['flat', 'Flat Budget +N']], { narrow: true }) +
          L('Max +') + sel(p + '.maxBudget', b.maxBudget || 5, range(1, 10), { narrow: true, num: true }) +
          inp(p + '.allowedEnchs', b.allowedEnchs || '', { ph: 'Flaming, Frost, Shock, Keen, Speed', style: 'width:190px' });
      }
      case 'defense': {
        const dm = b.mode || 'Immunity';
        const modeSel = sel(p + '.mode', dm, [
          'Immunity', 'Condition Immunity', 'DR', 'Energy Resistance',
          'Spell Resistance', 'Concealment %', 'Sense / Movement',
          'Vulnerability', 'Size Change', 'State Flag'
        ], { narrow: true });
        if (dm === 'Size Change') {
          return modeSel + sel(p + '.steps', b.steps, [[-2, SIZE_STEPS['-2']], [-1, SIZE_STEPS['-1']], [1, SIZE_STEPS['1']], [2, SIZE_STEPS['2']]], { narrow: true, num: true });
        }
        if (dm === 'State Flag') {
          return modeSel + sel(p + '.flag', b.flag || 'negLevel', Object.keys(LOCK_LABEL).map((k) => [k, LOCK_LABEL[k]]), { narrow: true });
        }
        if (dm === 'Spell Resistance') {
          return modeSel + sel(p + '.srMode', b.srMode || 'flat', [['flat', 'Flat SR'], ['level', '10 + @Level / HD']], { narrow: true }) +
            (b.srMode === 'level' ? '' : inp(p + '.value', b.value, { num: true, style: 'width:56px' }));
        }
        if (dm === 'Concealment %') {
          return modeSel + inp(p + '.value', b.value || 20, { num: true, min: 5, max: 100, style: 'width:56px' }) + L('% Miss Chance');
        }
        return modeSel +
          (['DR', 'Energy Resistance'].indexOf(dm) >= 0 ? inp(p + '.value', b.value, { num: true, style: 'width:56px' }) : '') +
          inp(p + '.what', b.what, { list: 'fs-defense-list', style: 'width:165px', ph: 'Fear / evil or good / Darkvision 60 ft.' });
      }
      case 'effect': {
        const ek = b.effectKind || 'rule';
        const modeSel = sel(p + '.effectKind', ek, [
          ['castSpell', '🔮 Cast Spell / Free Buff'],
          ['recoverSlot', '🔄 Recover Expended Slot / Maneuver'],
          ['stealStore', '⚡ Steal / Drain into @Buffer'],
          ['grantFeat', '🎯 Grant Bonus / Floating Feat'],
          ['castEvolution', '✨ Upgrade Cast Nature (Spell → Sp → Su)'],
          ['rule', '📜 Explicit RAW Rule Text']
        ], { narrow: true });
        if (ek === 'castSpell') {
          const cm = b.castMode || 'linkedSpell';
          return modeSel +
            sel(p + '.castMode', cm, [
              ['linkedSpell', 'Specific Spell / SLA'],
              ['ownSlotUpTo', 'Self Spell (Own Slot ≤ Lvl N)'],
              ['freeBuffList', 'Pick 1 Free Buff from List']
            ], { narrow: true }) +
            (cm === 'linkedSpell' ? inp(p + '.spellName', b.spellName || '', { list: 'fs-spell-names', ph: 'Command / Haste', style: 'width:150px' }) : '') +
            (cm === 'ownSlotUpTo' ? L('Max Lvl') + sel(p + '.maxSpellLvl', b.maxSpellLvl || 2, range(1, 9), { narrow: true, num: true }) : '') +
            (cm === 'freeBuffList' ? inp(p + '.spellOptions', b.spellOptions || '', { ph: 'Blur, Resist Energy, Haste…', style: 'width:200px' }) : '') +
            chk(p + '.tiedDuration', !!b.tiedDuration, 'Tied Duration');
        }
        if (ek === 'recoverSlot') {
          return modeSel + L('Max Lvl') + sel(p + '.maxSpellLvl', b.maxSpellLvl || 6, range(1, 9), { narrow: true, num: true }) +
            L('Class / Pool') + inp(p + '.targetPoolOrClass', b.targetPoolOrClass || 'Magus', { list: 'fs-spellcls-list', style: 'width:120px' });
        }
        if (ek === 'stealStore') {
          return modeSel + inp(p + '.maxLvlFormula', b.maxLvlFormula || '≤ ⅓ Class Lvl', { ph: '≤ ⅓ Class Lvl', style: 'width:140px' }) +
            L('→ @') + inp(p + '.bufferVar', b.bufferVar || 'stolen_lvl', { ph: 'stolen_lvl', style: 'width:110px' });
        }
        if (ek === 'grantFeat') {
          return modeSel + inp(p + '.featOrPool', b.featOrPool || '#FighterBonus', { ph: '#FighterBonus or Feat Name', style: 'width:165px' }) +
            chk(p + '.floatingDaily', !!b.floatingDaily, 'Floating (Reassign Daily)');
        }
        if (ek === 'castEvolution') {
          return modeSel + sel(p + '.castNature', b.castNature || 'Arcane Spell', [
            'Arcane Spell', 'Spell-Like (Sp)', 'Supernatural (Su, No SR/AoO)'
          ], { narrow: true });
        }
        return modeSel + inp(p + '.text', b.text || '', { ph: 'Explicit RAW rule effect text…', style: 'flex:1;min-width:200px' });
      }
      default: return '';
    }
  }

  function blockPalette(listPath, allowContainers, compact, extraHtml) {
    const types = allowContainers ? BLOCK_ORDER : ['stat', 'roll', 'attack', 'defense', 'effect', 'carrier'];
    return '<div class="lego-palette' + (compact ? ' compact' : '') + '">' +
      (compact ? '' : '<span class="lego-lbl">+ Snap Block:</span>') +
      types.map((t) => '<button type="button" class="lego-add ' + BLOCK_TYPES[t].color + '" data-action="add-block" data-p="' + listPath + '" data-t="' + t + '">+ ' + BLOCK_TYPES[t].icon + ' ' + esc(BLOCK_TYPES[t].shortLabel) + '</button>').join('') +
      (extraHtml || '') +
      '</div>';
  }

  function scratchBlocks(list, listPath) {
    return (list || []).map((b, i) => {
      const p = listPath + '.' + i, T = BLOCK_TYPES[b.type] || BLOCK_TYPES.effect;
      const head = '<span class="lego-lbl">' + T.icon + ' ' + esc(T.label) + ':</span>' + blockControls(b, p) + delBtn('remove-block', { p: listPath, i: i });
      if (!T.container) return '<div class="lego-block lego-tab ' + T.color + '">' + head + '</div>';
      let inner = '';
      if (T.container === 'branches') {
        const flow = b.flow || 'while';
        inner = (b.branches || []).map((br, bi) => {
          const bp = p + '.branches.' + bi;
          const bHead = '<span class="lego-lbl">' + (bi > 0 ? 'Else-If' : (flow === 'while' ? 'While' : 'When')) + '</span>' +
            whenBranchControls(flow, br, bp) +
            (b.branches.length > 1 ? delBtn('remove-branch', { p: p + '.branches', i: bi }) : '');
          return cBlock('c-sub', bHead, scratchBlocks(br.kids, bp + '.kids') + blockPalette(bp + '.kids', false, true));
        }).join('') + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-branch" data-p="' + p + '.branches">+ Else-If / Tier Branch</button>';
      }
      if (T.container === 'rows') {
        inner = (b.rows || []).map((r, ri) => cBlock('c-sub', '<span class="lego-lbl">On</span>' + inp(p + '.rows.' + ri + '.roll', r.roll, { style: 'width:52px' }) + delBtn('remove-row', { p: p + '.rows', i: ri }),
          scratchBlocks(r.kids, p + '.rows.' + ri + '.kids') + blockPalette(p + '.rows.' + ri + '.kids', false, true))).join('') + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-row" data-p="' + p + '.rows">+ Table Row</button>';
      }
      return cBlock(T.color, head, inner);
    }).join('');
  }

  function tagSockets(en) {
    return L('Tags') + en.tags.map((t, i) => '<span class="fs-pill purple">' + esc(t) + '<span class="fs-x" data-action="remove-tag" data-i="' + i + '">×</span></span>').join('') +
      spotHtml('tag', 'identity', { style: 'width:165px', ph: '🔍 + #Tag' }) + L('Source') + inp('source', en.source, { ph: 'Source (PHB, MIC, Homebrew)', style: 'width:130px' });
  }
  const hasFacet = (en, k) => en.facets.indexOf(k) >= 0;
  function ensureFacet(k) { if (S.entry.facets.indexOf(k) < 0) S.entry.facets.push(k); }

  function prereqCBlock(en, title) {
    const canDetach = en.blueprint !== 'feat' && en.blueprint !== 'class';
    const rows = en.prereqs.map((r, ri) => cBlock('c-sub', '<span class="lego-lbl">' + (ri ? 'AND' : 'Require') + '</span>' + delBtn('remove-prereq', { ri: ri }),
      r.alts.map((a, ai) => stack('b-slate', altEditor(ri, ai, a))).join('') + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-or" data-ri="' + ri + '">+Or</button>')).join('');
    return cBlock('c-amber', L('🏛️ ' + title) + '<span class="fs-hint" style="color:#fde68a">' + esc(prereqText(en.prereqs) || 'none — open to all') + '</span>' + (canDetach ? delBtn('detach-prereqs', {}) : ''), rows + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-prereq">+ Add Prerequisite (AND)</button>');
  }

  function progressionCBlock(en) {
    const p = en.progression;
    const isCls = en.blueprint === 'class';
    const showClassCols = isCls || p.mode === 'base' || p.mode === 'prestige';
    const maxLv = Math.max(1, Math.min(20, num(p.maxLevel, 20)));
    const hideEmpty = !isCls && S.ui.progHideEmpty;
    let levelIndices = range(0, maxLv - 1);
    if (hideEmpty) {
      const nonEmpty = levelIndices.filter((i) => p.levels[i].features.length > 0 || (showClassCols && p.levels[i].spell));
      levelIndices = nonEmpty.length ? nonEmpty : [0];
    }
    const rows = levelIndices.map((i) => {
      const l = p.levels[i], Lv = i + 1;
      const chips = l.features.map((f, fi) => '<span class="fs-pill ' + (f.kind === 'inline' ? 'amber' : f.kind === 'pattern' ? 'sky' : 'indigo') + '" data-action="toggle-card" data-key="ft:' + f.id + '" style="cursor:pointer">' + (f.kind === 'inline' ? '✨ ' : '') + live('feat-sum', i + ':' + fi) + '<span class="fs-x" data-action="remove-feature" data-l="' + i + '" data-f="' + fi + '">×</span></span>').join('');
      const editors = l.features.map((f, fi) => (S.ui.cardOpen['ft:' + f.id] ? '<div class="lego-sub">' + inp('progression.levels.' + i + '.features.' + fi + '.name', f.name, { style: 'width:170px' }) + sel('progression.levels.' + i + '.features.' + fi + '.abilityType', f.abilityType || 'Ex', ['Ex', 'Su', 'Sp', '—'], { narrow: true }) + inp('progression.levels.' + i + '.features.' + fi + '.text', f.text || '', { ph: 'Feature rules text…', style: 'flex:1;min-width:150px' }) + '</div>' : '')).join('');
      const prefix = showClassCols
        ? '<b class="lego-lvl">Lvl ' + Lv + '</b><span class="lego-desc">BAB ' + sgn(classBAB(p.bab, Lv)) + ' • F ' + sgn(p.good.fort ? goodSave(Lv) : poorSave(Lv)) + ' / R ' + sgn(p.good.ref ? goodSave(Lv) : poorSave(Lv)) + ' / W ' + sgn(p.good.will ? goodSave(Lv) : poorSave(Lv)) + '</span>'
        : '<b class="lego-lvl">' + (p.mode === 'hd' ? 'HD ' : 'Lvl ') + Lv + '</b>';
      const suffix = showClassCols ? chk('progression.levels.' + i + '.spell', l.spell, '✓ +1 Spellcasting') : '';
      return stack('b-slate', prefix + chips + spotHtml('feature', i, { style: 'width:165px', ph: '🔍 + Feature / SLA / Feat' }) + btn('add-feature-inline', '✨ + Inline', 'fs-xs fs-dashed', { l: i }) + suffix + editors);
    }).join('');
    const patBar = !isCls ? stack('b-blue', L('🔁 Every') + sel('progression.pattern.every', p.pattern.every, range(1, 10), { narrow: true, num: true }) + L((p.mode === 'hd' ? 'HD' : 'levels') + ' from ' + (p.mode === 'hd' ? 'HD' : 'Lvl')) + sel('progression.pattern.start', Math.min(p.pattern.start, maxLv), range(1, maxLv), { narrow: true, num: true }) + L('grant') + inp('progression.pattern.name', p.pattern.name, { style: 'width:140px' }) + L('scaling') + inp('progression.pattern.scale', p.pattern.scale, { style: 'width:70px' }) + btn('gen-pattern', '⚡ Apply', 'fs-xs fs-primary')) : '';
    const head = isCls
      ? L('📊 Level Progression (1–' + maxLv + ')')
      : L('📊 Level / HD Table (1–' + maxLv + ')') + sel('progression.mode', p.mode, PROGRESSION_MODES, { narrow: true }) + L('Max') + sel('progression.maxLevel', maxLv, [5, 10, 12, 15, 20].map((n) => [n, String(n)]), { narrow: true, num: true }) + btn('toggle-prog-empty', S.ui.progHideEmpty ? '👁️ Show All Rows' : '🗜️ Hide Empty Rows', 'fs-xs') + delBtn('detach-progression', {});
    return cBlock('c-teal', head, patBar + rows);
  }

  function powerCBlock(pw, i) {
    const p = 'powers.' + i;
    const head = L('⚡ Sub-Power:') + (pw.kind === 'inline' ? inp(p + '.name', pw.name, { style: 'width:160px' }) : '<span class="fs-pill purple">🔮 ' + esc(pw.ref ? pw.ref.name : pw.name) + '</span>') + usageEditor(p + '.use', pw.use) + sel(p + '.action', pw.action, ACTIONS, { narrow: true }) + L('CL') + inp(p + '.cl', pw.cl, { num: true, style: 'width:50px' }) +
      btn('move-power', '↑', 'fs-xs fs-ghost', { i: i, d: -1 }) + delBtn('remove-power', { i: i });
    let kids = '';
    if (pw.kind === 'attached') kids += stack('b-purple', L('🔮 Cast Spell:') + '<span class="fs-pill purple">' + esc(pw.ref ? pw.ref.name + ' (' + (pw.ref.levelText || 'Lvl ' + pw.ref.level) + ')' : pw.name) + '</span>' + sel(p + '.grantMode', pw.grantMode, [['cast', 'Cast from Item / SLA'], ['known', 'Add to Spells Known'], ['slot', 'Expend Own Slot (Runestaff)']], { narrow: true }));
    if (pw.attackOn) kids += stack('b-red', L('🎯 Attack & Save:') + sel(p + '.attack', pw.attack, Object.keys(ATTACK_LABEL).map((k) => [k, ATTACK_LABEL[k]]), { narrow: true }) + inp(p + '.range', pw.range, { list: 'fs-range-list', ph: 'Range', style: 'width:110px' }) +
      sel(p + '.save.type', pw.save.type, ['None', 'Fortitude', 'Reflex', 'Will'], { narrow: true }) + (pw.save.type !== 'None' ? sel(p + '.save.effect', pw.save.effect, ['Negates', 'Half', 'Partial', 'Negates (harmless)'], { narrow: true }) + L('DC') + inp(p + '.dc', pw.dc, { num: true, style: 'width:50px' }) : '') + delBtn('toggle-flag', { p: p + '.attackOn' }));
    kids += scratchBlocks(pw.effects || [], p + '.effects');
    if (pw.text) kids += stack('b-slate', L('📜 Sub-Power Note:') + inp(p + '.text', pw.text, { ph: 'What happens…', style: 'flex:1;min-width:200px' }));
    const extraBtns = (pw.attackOn ? '' : '<button type="button" class="lego-add b-red" data-action="toggle-flag" data-p="' + p + '.attackOn">+ 🎯 Attack & Save</button>');
    kids += blockPalette(p + '.effects', false, true, extraBtns);
    return cBlock('c-amber', head, kids);
  }

  function universalExtraStacks(en, o) {
    o = o || {};
    let h = '';
    if (!o.skipPrereqs && hasFacet(en, 'prereqs')) h += prereqCBlock(en, 'Prerequisites');
    h += scratchBlocks(en.effects, 'effects');
    h += en.powers.map(powerCBlock).join('');
    if (!o.skipProgression && hasFacet(en, 'progression')) h += progressionCBlock(en);
    return h;
  }

  function universalSnapPalette(en) {
    const d = en.delivery;
    const spellAttackToggle = en.blueprint === 'spell' && !d.attackOn
      ? '<button type="button" class="lego-add b-red" data-action="toggle-flag" data-p="delivery.attackOn">+ 🎯 Attack Roll</button>'
      : '';
    const extra = spellAttackToggle +
      '<button type="button" class="lego-add c-amber" data-action="add-power-inline">+ ⚡ Sub-Power</button>' +
      spotHtml('power', 'powers', { style: 'width:210px', ph: '🔍 + Attach Spell / SLA' }) +
      (hasFacet(en, 'progression') ? '' : '<button type="button" class="lego-add c-teal" data-action="attach-progression">+ 📊 Level / HD Table</button>') +
      (hasFacet(en, 'prereqs') ? '' : '<button type="button" class="lego-add c-amber" data-action="attach-prereqs">+ 🏛️ Prerequisites</button>');
    return blockPalette('effects', true, false, extra);
  }

  function enchCBlock(en) {
    const ch = en.chassis, v = chassisView(ch, en), cr = v.crystal;
    const enchs = v.enchs.map((e) => stack('b-green', L('✨ ' + esc(e.name)) + '<span class="fs-pill dim">' + (e.plus ? '+' + e.plus + ' bonus' : gp(e.gp)) + '</span><span class="lego-desc">' + esc(short(e.desc, 80)) + '</span>' + delBtn('remove-ench', { id: e.id }))).join('');
    const crystal = cr ? stack('b-purple', L('💎 ' + esc(cr.c.name)) + sel('chassis.crystal.tier', cr.tier, CRYSTAL_TIERS.map((t, i) => [t, cap1(t) + (cr.c.cost[i] == null ? ' — n/a' : ' — ' + gp(cr.c.cost[i]))]), { narrow: true }) + '<span class="lego-desc">' + esc(short(cr.text, 70)) + '</span>' + delBtn('remove-crystal', {})) : stack('b-purple', L('💎 Crystal') + spotHtml('crystal', 'chassis', { style: 'width:260px' }));
    return cBlock('c-amber', L('✨ Enchantments & Crystal') + '<span class="fs-pill ' + (v.effective > 10 ? 'rose' : 'emerald') + '">' + sgn(v.effective) + ' / +10</span><span class="fs-pill amber">💰 ' + gp(v.gpTotal) + '</span>',
      enchs + stack('b-green', L('✨ Enchantment') + spotHtml('ench', 'chassis', { style: 'width:280px' })) + crystal + v.warnings.map((w) => '<div class="fs-warn" style="font-size:12px">⚠️ ' + esc(w) + '</div>').join(''));
  }

  function scratchWeaponArmor(en) {
    const ch = en.chassis, v = chassisView(ch, en), isW = ch.kind === 'weapon';
    let h = hat('h-amber', L(isW ? '⚔️ Weapon' : '🛡️ Armor / Shield') + inp('name', en.name, { ph: v.name, style: 'width:220px' }) + L('Base') + spotHtml('base', 'chassis', { style: 'width:200px', ph: '🔍 ' + baseName(v.base) }) +
      L('Material') + sel('chassis.material', ch.material, allMaterials().map((m) => [m.id, m.name]), { narrow: true }) + L('Enh') + sel('chassis.enhancement', ch.enhancement, range(0, 5).map((n) => [n, sgn(n)]), { narrow: true, num: true }) + '<div class="lego-row">' + tagSockets(en) + '</div>');
    if (isW) {
      const w = ch.weapon;
      h += stack('b-blue', L('⚔️ Weapon Chassis:') + L('Damage') + inp('chassis.weapon.dice', w.dice, { list: 'fs-dice-list', style: 'width:70px' }) + sel('chassis.weapon.dmgType', w.dmgType, DAMAGE_TYPES.slice(0, 3), { narrow: true }) +
        L('Crit') + sel('chassis.weapon.critRange', w.critRange, [[20, '20'], [19, '19–20'], [18, '18–20'], [17, '17–20'], [15, '15–20']], { narrow: true, num: true }) + '<span>/</span>' + sel('chassis.weapon.critMult', w.critMult, [[2, '×2'], [3, '×3'], [4, '×4']], { narrow: true, num: true }) +
        sel('chassis.weapon.handed', w.handed, ['Light', 'One-Handed', 'Two-Handed'], { narrow: true }) + L('Range') + inp('chassis.weapon.range', w.range, { num: true, style: 'width:56px' }) + '<span class="fs-pill sky">' + esc(v.critText) + (v.keen ? ' (Keen)' : '') + '</span>');
    } else {
      const a = ch.armor;
      h += stack('b-blue', L('🛡️ Armor Stats:') + L('AC') + inp('chassis.armor.armorBonus', a.armorBonus, { num: true, style: 'width:50px' }) + L('Max Dex') + inp('chassis.armor.maxDex', a.maxDex, { num: true, style: 'width:50px' }) + L('ACP') + inp('chassis.armor.acp', a.acp, { num: true, style: 'width:50px' }) +
        L('ASF %') + inp('chassis.armor.asf', a.asf, { num: true, style: 'width:50px' }) + '<span class="lego-desc">After material: Max Dex ' + (v.armor.maxDex >= 99 ? '—' : sgn(v.armor.maxDex)) + ' • ACP ' + v.armor.acp + ' • ASF ' + v.armor.asf + '% • ' + v.armor.type + '</span>');
    }
    h += enchCBlock(en);
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchWondrous(en) {
    const kinds = ['Wondrous Item', 'Ring', 'Rod', 'Staff', 'Wand', 'Potion / Oil', 'Scroll', 'Artifact / Relic'];
    const h = hat('h-amber', L('💎 Item') + inp('name', en.name, { ph: 'Item name', style: 'width:210px' }) + L('Kind') + sel('item.subtype', en.item.subtype, kinds, { narrow: true }) + L('Slot') + sel('item.slot', en.item.slot, BODY_SLOTS, { narrow: true }) +
      L('Price') + inp('item.price', en.item.price, { num: true, style: 'width:90px' }) + L('gp • CL') + inp('item.cl', en.item.cl, { num: true, style: 'width:50px' }) + '<div class="lego-row">' + tagSockets(en) + '</div>');
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchSpell(en) {
    const sp = en.spell, sys = sp.system || 'spell', d = en.delivery, l = en.lifecycle;
    let sysHtml = '';
    if (sys === 'maneuver') {
      sysHtml = L('Type') + sel('spell.maneuverType', sp.maneuverType, MANEUVER_TYPES, { narrow: true }) +
        L('Discipline') + sel('spell.discipline', sp.discipline, TOB_DISCIPLINES, { narrow: true }) +
        L('Lvl') + sel('spell.maneuverLvl', sp.maneuverLvl, range(1, 9), { narrow: true, num: true }) +
        L('Prereq') + sel('spell.prereqManeuvers', sp.prereqManeuvers, range(0, 5), { narrow: true, num: true });
    } else if (sys === 'invocation') {
      sysHtml = L('Kind') + sel('spell.invKind', sp.invKind || 'Invocation', INV_KINDS, { narrow: true }) +
        L('Grade') + sel('spell.invGrade', sp.invGrade, INV_GRADES, { narrow: true }) +
        L('Eff. Lvl') + sel('spell.maneuverLvl', sp.maneuverLvl, range(1, 9), { narrow: true, num: true }) +
        L('School') + sel('spell.school', sp.school, SCHOOLS, { narrow: true });
    } else if (sys === 'psionic') {
      sysHtml = L('Discipline') + sel('spell.discipline', sp.discipline, PSIONIC_DISCIPLINES, { narrow: true }) +
        L('Lvl') + sel('spell.maneuverLvl', sp.maneuverLvl, range(1, 9), { narrow: true, num: true }) +
        L('PP') + inp('spell.ppCost', sp.ppCost, { num: true, min: 1, style: 'width:52px' }) +
        chk('spell.augmentable', sp.augmentable, 'Augmentable');
    } else if (sys === 'soulmeld') {
      sysHtml = L('Meldshaper') + sel('spell.meldshaperList', sp.meldshaperList || 'Totemist', MELDSHAPER_LISTS, { narrow: true }) +
        L('Chakra Slots') + inp('spell.chakraSlots', sp.chakraSlots || 'Arms / Totem', { ph: 'Arms / Totem', style: 'width:140px' });
    } else if (sys === 'vestige') {
      sysHtml = L('Vestige Lvl') + sel('spell.vestigeLvl', sp.vestigeLvl || 1, range(1, 8), { narrow: true, num: true }) +
        L('Binding DC') + inp('spell.bindingDc', sp.bindingDc || 15, { num: true, style: 'width:54px' }) +
        L('Sign') + inp('spell.vestigeSign', sp.vestigeSign || '', { ph: 'Sign & Influence note', style: 'width:150px' });
    } else if (sys === 'utterance') {
      sysHtml = L('Lexicon') + sel('spell.lexicon', sp.lexicon || 'Evolving Mind', TRUENAME_LEXICONS, { narrow: true }) +
        L('Lvl') + sel('spell.maneuverLvl', sp.maneuverLvl || 1, range(1, 6), { narrow: true, num: true });
    } else if (sys === 'mystery') {
      sysHtml = L('Tier') + sel('spell.mysteryTier', sp.mysteryTier || 'Apprentice', MYSTERY_TIERS, { narrow: true }) +
        L('Path') + inp('spell.mysteryPath', sp.mysteryPath || '', { ph: 'Shutters and Clouds', style: 'width:140px' }) +
        L('Lvl') + sel('spell.maneuverLvl', sp.maneuverLvl || 1, range(1, 9), { narrow: true, num: true });
    } else {
      sysHtml = L('Class/Lvl') + sp.classes.map((c, i) => '<span class="fs-pill indigo" style="padding:2px 4px"><input class="fs-in" style="width:70px" data-bind="spell.classes.' + i + '.cls" list="fs-spellcls-list" value="' + esc(c.cls) + '">' + sel('spell.classes.' + i + '.lvl', c.lvl, range(0, 9), { num: true, style: 'width:52px' }) + '<span class="fs-x" data-action="remove-spellcls" data-i="' + i + '">×</span></span>').join('') +
        '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-spellcls">+</button>' + L('School') + sel('spell.school', sp.school, SCHOOLS, { narrow: true });
    }
    const hatTitle = { maneuver: '⚔️ Maneuver', invocation: '✨ Invocation', psionic: '⚡ Psionic', soulmeld: '💎 Soulmeld', vestige: '🏛️ Vestige', utterance: '📜 Utterance', mystery: '🔮 Mystery' }[sys] || '🔮 Spell';
    let h = hat('h-violet', L(hatTitle) + sel('spell.system', sys, SPELL_SYSTEMS, { narrow: true }) + inp('name', en.name, { ph: 'Name', style: 'width:185px' }) + sysHtml +
      '<div class="lego-row">' + L('Descriptors') + sp.descriptors.map((x, i) => '<span class="fs-pill rose">[' + esc(x) + ']<span class="fs-x" data-action="remove-descriptor" data-i="' + i + '">×</span></span>').join('') + spotHtml('descriptor', 'spell', { style: 'width:170px', ph: '🔍 + Fire, Fear…' }) +
      (sys === 'spell' ? L('Components') + ['V', 'S', 'M', 'F', 'DF', 'XP'].map((k) => '<button type="button" class="lego-pill' + (sp.comps[k] ? ' on' : '') + '" data-action="toggle-comp" data-k="' + k + '">' + k + '</button>').join('') : '') +
      '</div><div class="lego-row">' + tagSockets(en) + '</div>');
    h += stack('b-teal', L('🎯 Execution Envelope:') + L('Action') + sel('delivery.action', d.action, ACTIONS, { narrow: true }) + L('Range') + inp('delivery.range', d.range, { list: 'fs-range-list', style: 'width:155px' }) + L('Target/Area') + inp('delivery.area', d.area, { list: 'fs-area-list', style: 'width:135px' }) +
      L('Duration') + sel('lifecycle.duration', l.duration, DURATIONS, { narrow: true }) + (['rounds', 'roundsPerLevel', 'minPerLevel', 'hourPerLevel'].indexOf(l.duration) >= 0 ? inp('lifecycle.durValue', l.durValue, { num: true, style: 'width:46px' }) : '') + (l.duration === 'text' ? inp('lifecycle.durText', l.durText, { style: 'width:110px' }) : '') + chk('lifecycle.dismissible', l.dismissible, '(D)') +
      L('Save') + sel('delivery.save.type', d.save.type, [['None', 'None'], 'Fortitude', 'Reflex', 'Will'], { narrow: true }) + (d.save.type !== 'None' ? sel('delivery.save.effect', d.save.effect, ['Negates', 'Half', 'Partial', 'Negates (harmless)', 'Disbelief'], { narrow: true }) : '') +
      (['maneuver', 'soulmeld', 'vestige'].indexOf(sys) >= 0 ? '' : L(sys === 'psionic' ? 'PR' : 'SR') + sel('delivery.sr', d.sr, ['Yes', 'No', 'Yes (harmless)', 'Yes (object)', 'See text'], { narrow: true })) +
      L('Usage') + usageEditor('lifecycle.use', l.use));
    if (d.attackOn) h += stack('b-red', L('🎯 Attack Roll:') + sel('delivery.attack', d.attack, Object.keys(ATTACK_LABEL).map((k) => [k, ATTACK_LABEL[k]]), { narrow: true }) + delBtn('toggle-flag', { p: 'delivery.attackOn' }));
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchFeat(en) {
    const fk = en.featKind || 'feat';
    let h = hat('h-emerald', L('📜') + sel('featKind', fk, [['feat', 'Feat'], ['acf', 'Alternate Class Feature (ACF)'], ['substitution', 'Racial Substitution Level'], ['boon', 'Boon / Trait']], { narrow: true }) +
      inp('name', en.name, { ph: 'Name', style: 'width:200px' }) + L('Repeatable') + sel('repeat.mode', en.repeat.mode, [['once', '1x Only'], ['upto', 'Up to N times'], ['per', 'Per Weapon / School']], { narrow: true }) + (en.repeat.mode === 'upto' ? sel('repeat.n', en.repeat.n, range(2, 20), { narrow: true, num: true }) : '') + '<div class="lego-row">' + tagSockets(en) + '</div>');
    if (fk === 'acf' || fk === 'substitution') {
      h += stack('b-teal', L('⚡ Class Replacement:') + L('Class') + '<input class="fs-in" style="width:120px" data-bind="acf.targetClass" list="fs-spellcls-list" placeholder="Barbarian / Wizard" value="' + esc(en.acf.targetClass) + '">' +
        L('At Lvl') + sel('acf.level', en.acf.level, range(1, 20).map((n) => [n, 'Lvl ' + n]), { narrow: true, num: true }) +
        L('Replaces') + inp('acf.replaces', en.acf.replaces, { ph: 'Fast Movement / Familiar', style: 'width:180px' }) +
        (fk === 'substitution' ? L('Race') + inp('acf.race', en.acf.race, { ph: 'Elf / Dwarf / Gnome', style: 'width:110px' }) : ''));
    }
    return h + (hasFacet(en, 'prereqs') ? prereqCBlock(en, 'Prerequisites') : '') + universalExtraStacks(en, { skipPrereqs: true }) + universalSnapPalette(en);
  }

  function scratchBuff(en) {
    const l = en.lifecycle;
    return hat('h-rose', L('✨') + sel('buffKind', en.buffKind, ['Buff', 'Condition', 'Curse'], { narrow: true }) + inp('name', en.name, { ph: 'Name', style: 'width:200px' }) + L('Duration') + sel('lifecycle.duration', l.duration, DURATIONS, { narrow: true }) +
      (['rounds', 'roundsPerLevel', 'minPerLevel', 'hourPerLevel'].indexOf(l.duration) >= 0 ? inp('lifecycle.durValue', l.durValue, { num: true, style: 'width:46px' }) : '') + chk('lifecycle.stackable', l.stackable, 'Stackable ×N') + (l.stackable ? sel('lifecycle.maxStacks', l.maxStacks, range(1, 20), { narrow: true, num: true }) : '') + '<div class="lego-row">' + tagSockets(en) + '</div>') +
      universalExtraStacks(en) + universalSnapPalette(en);
  }

  const SKILL_PACKAGES = { Martial: ['Climb', 'Intimidate', 'Jump', 'Ride', 'Swim'], Arcane: ['Concentration', 'Craft', 'Decipher Script', 'Knowledge', 'Spellcraft'], Divine: ['Concentration', 'Diplomacy', 'Heal', 'Knowledge', 'Spellcraft'], Skirmisher: ['Balance', 'Hide', 'Listen', 'Move Silently', 'Spot', 'Tumble'] };
  function scratchClass(en) {
    const p = en.progression;
    let h = hat('h-emerald', L('💎') + sel('progression.mode', p.mode, PROGRESSION_MODES, { narrow: true }) + inp('name', en.name, { ph: 'Class name', style: 'width:180px' }) + L('HD') + sel('progression.hitDie', p.hitDie, [4, 6, 8, 10, 12].map((n) => [n, 'd' + n]), { narrow: true, num: true }) +
      L('BAB') + sel('progression.bab', p.bab, [['full', 'Full 1/1'], ['3/4', 'Med 3/4'], ['1/2', 'Poor 1/2']], { narrow: true }) + L('Good Saves') + ['fort', 'ref', 'will'].map((s) => '<button type="button" class="lego-pill' + (p.good[s] ? ' on' : '') + '" data-action="toggle-flag" data-p="progression.good.' + s + '">' + { fort: 'Fort', ref: 'Ref', will: 'Will' }[s] + '</button>').join('') +
      L('Skill Pts') + sel('progression.skillPts', p.skillPts, [2, 4, 6, 8].map((n) => [n, n + ' + Int']), { narrow: true, num: true }) + '<div class="lego-row">' + tagSockets(en) + '</div>');
    if (hasFacet(en, 'prereqs')) h += prereqCBlock(en, 'Entry Prerequisites');
    h += stack('b-blue', L('🔁 Every') + sel('progression.pattern.every', p.pattern.every, range(1, 10), { narrow: true, num: true }) + L('levels from Lvl') + sel('progression.pattern.start', Math.min(p.pattern.start, p.maxLevel), range(1, p.maxLevel), { narrow: true, num: true }) + L('grant') + inp('progression.pattern.name', p.pattern.name, { style: 'width:140px' }) + L('scaling') + inp('progression.pattern.scale', p.pattern.scale, { style: 'width:70px' }) + btn('gen-pattern', '⚡ Apply to Levels', 'fs-xs fs-primary'));
    if (hasFacet(en, 'progression')) h += progressionCBlock(en);
    h += stack('b-green', L('📜 Class Skills:') + p.classSkills.map((s, i) => '<span class="fs-pill emerald">' + esc(s) + '<span class="fs-x" data-action="remove-skill" data-i="' + i + '">×</span></span>').join('') + spotHtml('skill', 'class', { style: 'width:165px', ph: '🔍 + Add Skill' }) +
      btn('toggle-custom-skill', '+ 🎯 Custom Skill', 'fs-xs fs-dashed') + Object.keys(SKILL_PACKAGES).map((k) => btn('skill-pkg', '+ ' + k, 'fs-xs', { k: k })).join(''));
    h += stack('b-purple', L('🎯 Bonus Feat Grants:') + en.grants.featGrants.map((x, i) => '<span class="fs-pill indigo">' + sel('grants.featGrants.' + i + '.level', x.level, range(1, 20).map((n) => [n, 'L' + n]), { num: true, style: 'width:56px' }) + ' ×' + x.count + ' from ' + sel('grants.featGrants.' + i + '.pool', x.pool, allTags(), { style: 'width:130px' }) + '<span class="fs-x" data-action="remove-grant" data-i="' + i + '">×</span></span>').join('') + btn('add-grant', '+ Grant', 'fs-xs fs-dashed'));
    const c = p.caster || { mode: 'none', clFormula: 'full', clCustom: '', tradition: 'Arcane', ability: 'int', spellList: '', ignoreAsf: 'none', ignoreShieldAsf: false, castInRage: false };
    h += stack('b-purple', L('🔮 Spellcasting / Subsystem:') + sel('progression.caster.mode', c.mode, CASTER_MODES, { narrow: true }) +
      (c.mode !== 'none' ? sel('progression.caster.tradition', c.tradition || 'Arcane', ['Arcane', 'Divine', 'Psionic', 'Incarnum', 'Pact', 'Truename', 'Shadow', 'Martial'], { narrow: true }) +
        L('Ability') + sel('progression.caster.ability', c.ability || 'int', ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true }) +
        L('CL Formula') + sel('progression.caster.clFormula', c.clFormula || 'full', CL_FORMULAS, { narrow: true }) +
        (c.clFormula === 'custom' ? inp('progression.caster.clCustom', c.clCustom || '', { ph: '@classLevel + 2', style: 'width:115px' }) : '') +
        L('List') + '<input class="fs-in" style="width:120px" data-bind="progression.caster.spellList" list="fs-spellcls-list" placeholder="Cleric / Magus" value="' + esc(c.spellList) + '">' +
        L('Ignore ASF') + sel('progression.caster.ignoreAsf', c.ignoreAsf || 'none', [['none', 'Normal ASF'], ['light', 'Light Armor'], ['medium', 'Up to Medium'], ['heavy', 'Up to Heavy']], { narrow: true }) +
        chk('progression.caster.ignoreShieldAsf', !!c.ignoreShieldAsf, '+ Shields') +
        chk('progression.caster.castInRage', !!c.castInRage, '🩸 Cast in Rage') : ''));
    return h + universalExtraStacks(en, { skipPrereqs: true, skipProgression: true }) + universalSnapPalette(en);
  }

  function scratchItemMod(en) {
    const im = en.itemMod;
    let h = hat('h-amber', L('✨') + sel('itemMod.kind', im.kind, [['enchantment', 'Enchantment'], ['crystal', 'Augment Crystal'], ['material', 'Special Material']], { narrow: true }) +
      inp('name', en.name, { ph: 'Modifier name (e.g. Magebane)', style: 'width:180px' }) + L('On') + sel('itemMod.on', im.on, [['weapon', 'Weapon'], ['armor', 'Armor'], ['shield', 'Shield'], ['armor+shield', 'Armor + Shield']], { narrow: true }) +
      btn('save-item-mod', '📌 Register in Item Catalog', 'fs-xs fs-emerald') + '<div class="lego-row">' + tagSockets(en) + '</div>');
    if (im.kind === 'enchantment') {
      h += stack('b-green', L('💎 Cost & Badge:') + sel('itemMod.costMode', im.costMode, [['plus', '+1..+5 Bonus'], ['gp', 'Flat +GP']], { narrow: true }) +
        (im.costMode === 'plus' ? sel('itemMod.plus', im.plus, range(1, 5).map((n) => [n, '+' + n + ' Bonus']), { narrow: true, num: true }) : L('GP') + inp('itemMod.gp', im.gp, { num: true, min: 0, style: 'width:84px' })) +
        chk('itemMod.keen', im.keen, 'Keen (Crit ×2)') + L('Badge') + inp('itemMod.badge', im.badge, { ph: '+2 Enh vs Arcane Casters', style: 'flex:1;min-width:150px' }));
    } else if (im.kind === 'crystal') {
      h += stack('b-purple', L('💎 Tiers:') + CRYSTAL_TIERS.map((t, i) => '<span class="fs-pill purple">' + cap1(t) + '</span>' +
        inp('itemMod.crystalCosts.' + i, im.crystalCosts[i] == null ? '' : im.crystalCosts[i], { num: true, min: 0, ph: 'GP', style: 'width:76px' }) +
        inp('itemMod.crystalTiers.' + i, im.crystalTiers[i] || '', { ph: cap1(t) + ' effect…', style: 'width:140px' })).join(''));
    } else if (im.kind === 'material') {
      const m = im.mat;
      h += stack('b-blue', L('🛡️ Material Rules:') + L('Max Dex Δ') + inp('itemMod.mat.maxDexDelta', m.maxDexDelta, { num: true, style: 'width:52px' }) +
        L('ACP Δ') + inp('itemMod.mat.acpDelta', m.acpDelta, { num: true, style: 'width:52px' }) +
        L('ASF % Δ') + inp('itemMod.mat.asfDelta', m.asfDelta, { num: true, style: 'width:52px' }) +
        L('Crit Mult') + sel('itemMod.mat.critMultOverride', m.critMultOverride, [[0, 'Keep (0)'], [2, '×2'], [3, '×3'], [4, '×4']], { narrow: true, num: true }) +
        L('DR Bypass') + inp('itemMod.mat.drBypass', m.drBypass, { ph: 'adamantine', style: 'width:100px' }) +
        L('Wpn +GP') + inp('itemMod.mat.weaponGp', m.weaponGp, { num: true, min: 0, style: 'width:76px' }) +
        L('L/M/H +GP') + inp('itemMod.mat.lightGp', m.lightGp, { num: true, min: 0, style: 'width:68px' }) +
        inp('itemMod.mat.medGp', m.medGp, { num: true, min: 0, style: 'width:68px' }) +
        inp('itemMod.mat.heavyGp', m.heavyGp, { num: true, min: 0, style: 'width:68px' }));
    }
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchRace(en) {
    const r = en.race;
    const h = hat('h-emerald', L('🧬') + sel('race.kind', r.kind, [['race', 'Base Race'], ['template', 'Creature Template']], { narrow: true }) +
      (r.kind === 'template' ? sel('race.timing', r.timing, ['Inherited', 'Acquired'], { narrow: true }) : '') +
      inp('name', en.name, { ph: 'Race / Template name', style: 'width:180px' }) +
      L('Size') + sel('race.size', r.size, CREATURE_SIZES, { narrow: true }) +
      L('Type') + sel('race.creatureType', r.creatureType, CREATURE_TYPES, { narrow: true }) +
      L('Subtype') + inp('race.subtype', r.subtype, { ph: 'Gnome, Augmented', style: 'width:120px' }) +
      L('Speed') + inp('race.speed', r.speed, { num: true, min: 0, style: 'width:52px' }) + L('ft.') +
      L('Fly') + inp('race.flySpeed', r.flySpeed, { num: true, min: 0, style: 'width:52px' }) + sel('race.flyMan', r.flyMan, FLY_MANEUVERABILITIES, { narrow: true }) +
      L('LA') + sel('race.la', r.la, range(0, 8).map((n) => [n, '+' + n]), { narrow: true, num: true }) +
      L('RHD') + sel('race.rhdCount', r.rhdCount, range(0, 20), { narrow: true, num: true }) + sel('race.rhdDie', r.rhdDie, [6, 8, 10, 12].map((n) => [n, 'd' + n]), { narrow: true, num: true }) +
      L('Favored') + inp('race.favoredClass', r.favoredClass, { ph: 'Any', style: 'width:90px' }) +
      chk('race.bonusFeat1', r.bonusFeat1, '1st-Lvl Bonus Feat') + chk('race.bonusSkillPts', r.bonusSkillPts, 'Human Skill Points (+4/+1)') +
      '<div class="lego-row">' + tagSockets(en) + '</div>');
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function alignGrid(g) { return '<div class="fs-align">' + ALIGNS.map((a) => '<button type="button" data-action="set-deity-align" data-a="' + a + '" class="' + (a === g.deityAlign ? 'deity' : clericLegal(g.deityAlign, a) ? 'legal' : '') + '" title="' + ALIGN_NAMES[a] + '">' + a + '</button>').join('') + '</div>'; }
  function scratchDeity(en) {
    const g = en.grants;
    let h = hat('h-amber', '<div class="lego-row">' + L('🏛️ Deity') + inp('name', en.name, { ph: 'Deity name', style: 'width:210px' }) + L('Favored Weapon') + spotHtml('favwpn', 'deity', { style: 'width:190px', ph: '🔍 ' + (g.favoredWeapon || 'Select Base Weapon') }) + '</div>' +
      '<div class="lego-row" style="align-items:flex-start">' + L('Alignment') + alignGrid(g) + '<span class="lego-desc">Legal Cleric alignments (1 step): ' + ALIGNS.filter((a) => clericLegal(g.deityAlign, a)).join(', ') + '</span></div><div class="lego-row">' + tagSockets(en) + '</div>');
    const doms = g.domains.map((d, i) => stack('b-purple', L('✨ Domain:') + (d.kind === 'inline' ? inp('grants.domains.' + i + '.name', d.name, { style: 'width:140px' }) + inp('grants.domains.' + i + '.grantedPower', d.grantedPower, { ph: 'Granted power…', style: 'flex:1;min-width:190px' }) : '<span class="fs-pill purple">' + esc(d.name) + '</span><span class="lego-desc">' + esc(short(d.grantedPower, 90)) + '</span>') + delBtn('remove-domain', { i: i }))).join('');
    let empty = ''; for (let k = 0; k < Math.max(1, 2 - g.domains.length); k++) empty += stack('b-purple', L('✨ Domain:') + spotHtml('domain', 'slot' + k, { style: 'width:240px', ph: '🔍 Pick SRD / Custom Domain' }));
    h += cBlock('c-amber', L('✨ Granted Domains'), doms + empty + btn('add-domain-inline', '✨ + Inline New Domain', 'fs-xs fs-dashed'));
    h += stack('b-slate', L('📜 Portfolio & Dogma:') + L('Portfolio') + inp('grants.portfolio', g.portfolio, { ph: 'Sun, light, strength, healing', style: 'width:200px' }) + L('Worshippers / Dogma') + inp('grants.dogma', g.dogma, { ph: 'Those who wish to see evil vanquished…', style: 'flex:1;min-width:200px' }));
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchDomain(en) {
    const g = en.grants;
    let h = hat('h-sky', L('✨ Domain') + inp('name', en.name, { ph: 'Domain name', style: 'width:210px' }) + '<div class="lego-row">' + tagSockets(en) + '</div>');
    h += stack('b-blue', L('⚡ Granted Power:') + inp('grants.grantedPowerName', g.grantedPowerName, { ph: 'Power name (e.g. Greater Turning)', style: 'width:190px' }) + L('Usage') + usageEditor('grants.gpUse', g.gpUse) + inp('grants.grantedPower', g.grantedPower, { ph: 'Rule summary…', style: 'flex:1;min-width:210px' }));
    h += cBlock('c-teal', L('🔮 Domain Spell Ladder (1st–9th)'), g.ladder.map((s, i) => stack('b-slate', '<b class="lego-lvl">Lvl ' + (i + 1) + '</b>' + (s ? '<span class="fs-pill purple">🔮 ' + esc(s) + '<span class="fs-x" data-action="clear-ladder" data-i="' + i + '">×</span></span>' : '') + spotHtml('ladder', i, { style: 'width:220px', ph: '🔍 Pick Spell (Lvl ' + (i + 1) + ')' }))).join(''));
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function renderScratch() {
    const en = S.entry;
    const originBar = (en.origin.mode !== 'new' || en.origin.srdId)
      ? '<div class="fs-origin"><span>📚 Loaded from <b>' + esc(en.origin.srdName) + '</b> <span class="fs-hint">(' + esc(en.origin.srdType) + ' • ' + esc(en.origin.srdId) + ')</span></span>' +
        sel('origin.mode', en.origin.mode, [['override', 'Override Official ID'], ['variant', 'Clone as Variant (new ID)'], ['new', 'Detach as New Entry']], { narrow: true }) + '</div>'
      : '';
    const fn = { weapon: scratchWeaponArmor, armor: scratchWeaponArmor, wondrous: scratchWondrous, spell: scratchSpell, feat: scratchFeat, buff: scratchBuff, class: scratchClass, deity: scratchDeity, domain: scratchDomain, item_mod: scratchItemMod, race: scratchRace }[en.blueprint] || scratchWondrous;
    return datalists() + '<div class="lego-canvas"><div class="lego-stack">' + originBar + fn(en) + '</div>' +
      '<div class="fs-row" style="margin-top:12px"><span class="fs-label-mini">Rules Text</span><input class="fs-in" data-bind="text" value="' + esc(en.text) + '" placeholder="Official / custom rules text…" style="flex:1;min-width:200px"></div></div>';
  }

  function renderFacets() { $('#fs-facets').innerHTML = renderScratch(); }
  function renderJson() {
    const open = S.ui.jsonOpen, imp = S.ui.importOpen;
    $('#fs-json-wrap').className = 'fs-glass fs-facet' + (open || imp ? ' open' : '');
    const headBtns = btn('toggle-import-json', '📥 Import JSON', 'fs-xs' + (imp ? ' fs-on' : '')) + (open ? btn('copy-json', 'Copy JSON', 'fs-xs') : '<span class="fs-hint">click to expand</span>');
    const importBox = imp ? '<div class="fs-import-box"><div class="fs-row" style="justify-content:space-between;margin-bottom:6px"><span class="fs-label-mini">📥 Paste Canonical V3 JSON Blueprint</span><span class="fs-hint">Reconstructs Lego Core V3 blocks, @Resource variables, C-Block branches, carriers & progressions</span></div>' +
      '<textarea class="fs-in" data-uibind="importText" placeholder="Paste exported Canonical V3 JSON here…">' + esc(S.ui.importText) + '</textarea>' +
      '<div class="fs-row" style="margin-top:8px">' + btn('run-import-json', '⚡ Load JSON into Lego Studio', 'fs-xs fs-emerald') + btn('toggle-import-json', 'Cancel', 'fs-xs fs-ghost') + '</div></div>' : '';
    $('#fs-json-wrap').innerHTML = '<div class="fs-facet-head" data-action="toggle-json"><span class="fs-chev">▶</span><span>📜</span><span class="fs-facet-title">Canonical V3 JSON Output Inspector</span><span class="fs-facet-meta">' + headBtns + '</span></div>' +
      '<div class="fs-facet-body">' + importBox + (open ? '<pre class="fs-json" id="fs-json-pre">' + esc(JSON.stringify(exportEntry(S.entry), null, 2)) + '</pre>' : '') + '</div>';
  }

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
    S.entry = en; S.activePreset = presetId || ''; S.ui.cardOpen = {}; S.ui.facetOpen = {}; S.spot = null;
  }
  function setEntry(path, v) { setPath(S.entry, path, v); onSet(path, v); }
  function onSet(path, v) {
    const en = S.entry;
    if (/^effects\.\d+\.name$/.test(path)) {
      const blk = getPath(en, path.replace(/\.name$/, ''));
      if (blk && blk.type === 'resource') {
        blk.varKey = slug(v || 'resource');
        const pn = String(v || '').trim();
        if (pn && S.customPools.indexOf(pn) < 0) { S.customPools.push(pn); saveLS(); }
      }
    }
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
      if (en.progression.pattern.start > en.progression.maxLevel) en.progression.pattern.start = 1;
    } else if (path === 'progression.maxLevel') {
      if (en.progression.pattern.start > num(v, 20)) en.progression.pattern.start = 1;
    } else if (/^prereqs\.\d+\.alts\.\d+\.kind$/.test(path)) {
      const alt = getPath(en, path.replace(/\.kind$/, ''));
      alt.min = { ability: 13, bab: 1, skill: 4, level: 1 }[v] || alt.min;
    } else if (path === 'origin.mode' && v === 'variant') {
      en.id = uid('custom');
    } else if (path === 'spell.system') {
      if (v === 'maneuver') { en.lifecycle.use.mode = en.spell.maneuverType === 'Stance' ? 'passive' : 'perEncounter'; en.lifecycle.use.n = 1; }
      else if (v === 'invocation' || v === 'utterance') { en.lifecycle.use.mode = 'atwill'; }
      else if (v === 'psionic') { en.lifecycle.use.mode = 'resourcePool'; en.lifecycle.use.pool = 'Psionic Power Points'; en.lifecycle.use.poolCost = Math.max(1, num(en.spell.ppCost, 1)); }
      else if (v === 'soulmeld') { en.lifecycle.use.mode = 'passive'; en.lifecycle.duration = 'permanent'; }
      else if (v === 'vestige') { en.lifecycle.use.mode = 'cooldown'; en.lifecycle.use.cooldown = '5'; en.lifecycle.duration = 'permanent'; }
      else if (v === 'mystery') { en.lifecycle.use.mode = 'perDay'; en.lifecycle.use.n = 1; }
    } else if (path === 'spell.maneuverType' && en.spell.system === 'maneuver') {
      en.lifecycle.use.mode = v === 'Stance' ? 'passive' : 'perEncounter'; en.lifecycle.use.n = 1;
    } else if (path === 'spell.ppCost' && en.spell.system === 'psionic') {
      en.lifecycle.use.poolCost = Math.max(1, num(v, 1));
    }
  }
  function addEnchantment(id) {
    const ch = S.entry.chassis, e = enchById(id), v = chassisView(ch, S.entry);
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
    if (en.blueprint === 'wondrous' && !en.powers.length) en.powers.push(blankPower('inline', { name: '', use: Object.assign(blankUse('perDay'), { n: 1 }) }));
    if ((en.blueprint === 'feat' || en.blueprint === 'class') && !en.prereqs.length) en.prereqs.push({ id: uid('p'), alts: [ALT({ kind: en.blueprint === 'class' ? 'bab' : 'ability', min: en.blueprint === 'class' ? 5 : 13 })] });
    if (en.blueprint === 'race' && !en.effects.length) en.effects.push(BLK('stat', { targets: ['dex'], value: 2, btype: 'Racial' }));
    return en;
  }
  function setBlueprint(id) {
    if (BP_BY_ID[id]) { loadEntry(scaffold(blankEntry(id))); renderAll(); return; }
    const t = S.templates.find((x) => x.id === id);
    if (t) { const en = clone(t.entry); en.id = uid('custom'); en.templateId = t.id; loadEntry(en); toast('Template loaded: ' + t.name); renderAll(); }
  }
  function progHasFeatures(p) { return (p.levels || []).some((l) => l.features && l.features.length > 0); }
  function attachProgression(en) {
    ensureFacet('progression');
    if (en.blueprint !== 'class' && !progHasFeatures(en.progression)) {
      en.progression.mode = isItemBp(en.blueprint) ? 'legacy' : 'hd';
      en.progression.maxLevel = 20;
    }
  }
  const ACT = {
    'toggle-card': (el) => { const k = el.dataset.key; S.ui.cardOpen[k] = !S.ui.cardOpen[k]; renderFacets(); },
    'attach-progression': () => { attachProgression(S.entry); toast('Attached: Level / HD Table'); renderAll(); },
    'detach-progression': () => { if (S.entry.blueprint === 'class') return; S.entry.facets = S.entry.facets.filter((f) => f !== 'progression'); toast('Detached: Level / HD Table', 'warn'); renderAll(); },
    'toggle-prog-empty': () => { S.ui.progHideEmpty = !S.ui.progHideEmpty; renderFacets(); },
    'attach-prereqs': () => { ensureFacet('prereqs'); toast('Attached: Prerequisites'); renderAll(); },
    'detach-prereqs': () => { if (S.entry.blueprint === 'feat' || S.entry.blueprint === 'class') return; S.entry.facets = S.entry.facets.filter((f) => f !== 'prereqs'); toast('Detached: Prerequisites', 'warn'); renderAll(); },
    'toggle-json': (el, ev) => { if (ev && ev.target && ev.target.closest && ev.target.closest('[data-action="copy-json"],[data-action="toggle-import-json"]')) return; S.ui.jsonOpen = !S.ui.jsonOpen; renderJson(); },
    'toggle-import-json': () => { S.ui.importOpen = !S.ui.importOpen; renderTopbar(); renderJson(); if (S.ui.importOpen) { const ta = document.querySelector('[data-uibind="importText"]'); if (ta) ta.focus(); } },
    'run-import-json': () => { try { importFromJson(S.ui.importText); renderAll(); } catch (e) { toast((e && e.message) || 'Invalid Canonical V3 JSON', 'err'); } },
    'copy-json': () => {
      const txt = JSON.stringify(exportEntry(S.entry), null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Canonical V3 JSON copied'), () => toast('Clipboard unavailable — select the JSON manually', 'warn'));
      else toast('Clipboard unavailable — select the JSON manually', 'warn');
    },
    'load-preset': (el) => { const p = PRESETS.find((x) => x.id === el.dataset.id); if (!p) return; loadEntry(p.build(), p.id); toast('Preset loaded: ' + p.label); renderAll(); },
    'new-entry': () => { loadEntry(scaffold(blankEntry(S.entry.blueprint))); renderAll(); },
    'toggle-live': () => { S.ui.liveOpenMobile = !S.ui.liveOpenMobile; renderLiveHeader(); },
    'add-block': (el) => {
      const list = getPath(S.entry, el.dataset.p);
      if (!Array.isArray(list)) return;
      const b = BLK(el.dataset.t, el.dataset.t === 'carrier' && S.entry.blueprint === 'wondrous' ? { carrierMode: 'metamagic', costMode: 'rod', transform: 'quicken' } : null);
      list.push(b);
      if ((el.dataset.p || '').indexOf('effects') === 0) ensureFacet('effects');
      S.ui.cardOpen['blk:' + b.id] = true;
      renderAll();
    },
    'remove-block': (el) => { getPath(S.entry, el.dataset.p).splice(num(el.dataset.i), 1); renderAll(); },
    'add-branch': (el) => { getPath(S.entry, el.dataset.p).push(blankBranch({ condKind: 'levelTier', condText: 'CL ≥ 15' })); renderAll(); },
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
    'add-prereq': () => { ensureFacet('prereqs'); const r = { id: uid('p'), alts: [ALT({})] }; S.entry.prereqs.push(r); S.ui.cardOpen['pr:' + r.id] = true; renderAll(); },
    'add-or': (el) => { const r = S.entry.prereqs[num(el.dataset.ri)]; r.alts.push(ALT({ kind: 'skill', skill: 'skill.tumble', min: 5 })); S.ui.cardOpen['pr:' + r.id] = true; renderAll(); },
    'remove-alt': (el) => { const ri = num(el.dataset.ri), r = S.entry.prereqs[ri]; r.alts.splice(num(el.dataset.ai), 1); if (!r.alts.length) S.entry.prereqs.splice(ri, 1); renderAll(); },
    'remove-prereq': (el) => { S.entry.prereqs.splice(num(el.dataset.ri), 1); renderAll(); },
    'remove-ench': (el) => { const a = S.entry.chassis.enchantments, i = a.indexOf(el.dataset.id); if (i >= 0) a.splice(i, 1); renderAll(); },
    'remove-crystal': () => { S.entry.chassis.crystal = { id: '', tier: 'least' }; renderAll(); },
    'toggle-custom-skill': () => { S.ui.customSkillOpen = !S.ui.customSkillOpen; renderTopbar(); const i = document.querySelector('[data-uibind="customSkill.name"]'); if (i) i.focus(); },
    'save-custom-skill': () => {
      const cs = S.ui.customSkill, name = String(cs.name || '').trim();
      if (!name) { toast('Name the skill first', 'warn'); return; }
      if (allSkills().some((s) => s.name.toLowerCase() === name.toLowerCase())) { toast('Skill "' + name + '" already exists', 'warn'); return; }
      const skSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || uid('sk');
      S.customSkills.push({ id: 'skill.custom_' + skSlug, name: name, ability: cs.ability || 'cha', trainedOnly: !!cs.trainedOnly, acp: !!cs.acp });
      if (S.entry.blueprint === 'class' && S.entry.progression.classSkills.indexOf(name) < 0) S.entry.progression.classSkills.push(name);
      saveLS(); S.ui.customSkill = { name: '', ability: 'cha', trainedOnly: true, acp: false }; S.ui.customSkillOpen = false;
      toast('🎯 Custom skill "' + name + '" registered'); renderAll();
    },
    'remove-custom-skill': (el) => { S.customSkills.splice(num(el.dataset.i), 1); saveLS(); renderAll(); },
    'save-item-mod': () => {
      const en = S.entry, im = en.itemMod, name = String(en.name || '').trim();
      if (!name) { toast('Name the item modifier first', 'warn'); return; }
      const modSlug = 'custom_' + (name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || uid('mod'));
      const cParts = topRollParts(en);
      const cMods = [];
      (en.effects || []).filter((b) => b && b.type === 'stat' && modMode(b) === 'flat').forEach((b) => {
        (b.targets || []).forEach((t) => cMods.push({ target: t, value: num(b.value), type: b.btype || 'Untyped', condition: b.condition || '' }));
      });
      let modObj;
      if (im.kind === 'material') {
        modObj = { id: modSlug, kind: 'material', name: name, on: im.on, desc: en.text || '', src: en.source || 'Custom', mat: clone(im.mat) };
      } else if (im.kind === 'crystal') {
        modObj = { id: modSlug, kind: 'crystal', name: name, on: im.on, cost: im.crystalCosts.map((c) => (c === '' || c == null ? null : num(c))), tiers: im.crystalTiers.slice(), src: en.source || 'Custom',
          customParts: cParts, customMods: cMods };
      } else {
        modObj = { id: modSlug, kind: 'enchantment', name: name, on: im.on, plus: im.costMode === 'plus' ? num(im.plus, 1) : 0, gp: im.costMode === 'gp' ? num(im.gp, 0) : 0,
          desc: en.text || im.badge || '', src: en.source || 'Custom',
          effect: { keen: !!im.keen, badge: im.badge || '', parts: cParts, mods: cMods } };
      }
      const idx = S.customItemMods.findIndex((x) => x.id === modObj.id || x.name.toLowerCase() === name.toLowerCase());
      if (idx >= 0) S.customItemMods[idx] = modObj; else S.customItemMods.push(modObj);
      saveLS(); toast('📌 Registered "' + name + '" in Item Catalog'); renderAll();
    },
    'add-power-inline': () => { ensureFacet('powers'); const pw = blankPower('inline', { name: 'New Power ' + (S.entry.powers.length + 1) }); S.entry.powers.push(pw); S.ui.cardOpen['pw:' + pw.id] = true; renderAll(); },
    'remove-power': (el) => { S.entry.powers.splice(num(el.dataset.i), 1); renderAll(); },
    'move-power': (el) => { const a = S.entry.powers, i = num(el.dataset.i), j = i + num(el.dataset.d); if (j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; renderAll(); },
    'gen-pattern': () => { const p = S.entry.progression; if (!String(p.pattern.name || '').trim()) { toast('Name the repeating feature first', 'warn'); return; } applyPattern(p, p.pattern); toast('Generated "' + p.pattern.name + '" rows'); renderAll(); },
    'add-feature-inline': (el) => { const mode = S.entry.progression.mode; const lbl = mode === 'hd' ? 'New Trait / SLA' : mode === 'legacy' ? 'New Legacy Ability' : 'New Class Feature'; const f = FEATURE(lbl, { kind: 'inline', abilityType: 'Ex' }); S.entry.progression.levels[num(el.dataset.l)].features.push(f); S.ui.cardOpen['ft:' + f.id] = true; renderAll(); },
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
    if (full || /^effects\.\d+\.name$/.test(el.dataset.bind || '')) renderAll(); else renderLive();
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
    if (!C || typeof C.init !== 'function' || !http) return;
    C.init({ basePath: 'database' }).then((ok) => {
      if (!ok) return;
      try { mergeSrd(C); } catch (e) { console.warn('[ForgeSandbox] SRD merge skipped:', e && e.message); }
      return fetch('./master_db.json').then((r) => (r.ok ? r.json() : [])).then((list) => { mergeMasterDb(Array.isArray(list) ? list : (list && list.entries) || []); }).catch(() => {});
    }).then(() => { if (CAT.srdLoaded) { toast('📚 SRD + MIC loaded: ' + CAT.srdCount.toLocaleString('en-US') + ' entries' + (CAT.customCount ? ' (+' + CAT.customCount + ' custom)' : '')); renderAll(); } })
      .catch((e) => console.warn('[ForgeSandbox] SrdCompendium unavailable:', e && e.message));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // Read-only QA hook (Lego Core V3 + V25 alias)
  window.ForgeSandbox = {
    state: S, catalog: CAT, chassisView: chassisView,
    exportEntry: exportEntry, fromCanonicalV3: fromCanonicalV3, fromCanonicalV25: fromCanonicalV3,
    importFromJson: importFromJson, rawHeaderLine: rawHeaderLine, damageAtCL: rollAtCL,
    presets: PRESETS.map((p) => p.id), presetList: PRESETS, blueprints: BLUEPRINTS, blockTypes: BLOCK_TYPES,
    setBlueprint: setBlueprint,
    loadPreset: (id) => ACT['load-preset']({ dataset: { id: id } }),
    act: (name, data) => { const el = document.createElement('div'); Object.keys(data || {}).forEach((k) => { el.dataset[k] = data[k]; }); ACT[name](el, { target: el }); }
  };
})();
