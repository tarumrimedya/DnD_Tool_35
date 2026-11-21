/* ============================================================================
 * RULE CRAFTER — V3 Rule Studio (D&D 3.5e)
 * Zero-Patchwork 5 Orthogonal Rule Block Primitives & 40 Benchmark Presets.
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
  const DEFAULT_SOURCE = 'Homebrew';
  const normSource = (v) => String(v == null ? '' : v).trim() || DEFAULT_SOURCE;
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const DICE_SVG = '<svg class="fs-dice-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 2 7.5 9.5h9zM3 7l4.5 2.5M21 7l-4.5 2.5M7.5 9.5 12 17l4.5-7.5M12 17v5M3 17l4.5-7.5M21 17l-4.5-7.5M3 17h18"/></svg>';

  // --------------------------------------------------------------------------
  // 1. Taxonomy & offline seed catalog (read from `rulesets/dnd35.js` plugin)
  // --------------------------------------------------------------------------
  const _RS = (typeof window !== 'undefined' && window.DnD35Ruleset) || null;
  const ABILITIES = (_RS && Array.isArray(_RS.abilities)) ? _RS.abilities : [['str', 'Strength'], ['dex', 'Dexterity'], ['con', 'Constitution'], ['int', 'Intelligence'], ['wis', 'Wisdom'], ['cha', 'Charisma']];
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
    ['Abilities', ABILITIES.map((a) => [a[0], a[1]]).concat([
      ['choice.ability.1', 'Chosen Ability #1 (Distinct)'],
      ['choice.ability.2', 'Chosen Ability #2 (Distinct)'],
      ['choice.ability.3', 'Chosen Ability #3 (Distinct)'],
      ['choice.ability.4', 'Chosen Ability #4 (Distinct)']
    ])],
    ['Armor Class', [['ac.total', 'AC (All)'], ['ac.touch', 'Touch AC only'], ['ac.flatFooted', 'Flat-Footed AC only'], ['ac.armor', 'Armor Bonus'], ['ac.shield', 'Shield Bonus'], ['ac.shieldBonus', 'Shield AC Bonus (Stacks w/ Base Shield)'], ['ac.natural', 'Natural Armor'], ['ac.deflection', 'Deflection'], ['ac.dodge', 'Dodge']]],
    ['Saving Throws', [['save.all', 'All Saving Throws'], ['save.fort', 'Fortitude'], ['save.ref', 'Reflex'], ['save.will', 'Will'], ['choice.save.1', 'Chosen Save (@Choice)']]],
    ['Combat', [['atk.all', 'Attack Rolls (All)'], ['atk.melee', 'Melee Attack'], ['atk.ranged', 'Ranged Attack'], ['atk.weapon', 'Chosen Weapon Attack (@Choice)'], ['dmg.all', 'Damage (All)'], ['dmg.melee', 'Melee Damage'], ['dmg.ranged', 'Ranged Damage'], ['dmg.weapon', 'Chosen Weapon Damage (@Choice)'], ['weapon.damageDieStep', 'Weapon Damage Die Step (Natural / Scoped)'], ['atk.critConfirm', 'Critical Confirmation'], ['initiative', 'Initiative'], ['speed.land', 'Land Speed (ft.)'], ['hp.max', 'Max Hit Points'], ['hp.temp', 'Temporary Hit Points'], ['hp.perLevel', 'HP per Level / HD'], ['grapple', 'Grapple'], ['cmd.stability', 'Stability (resist Bull Rush / Trip)'], ['size.effective', 'Effective Size (Powerful Build, scoped)'], ['healing.receivedMultiplier', 'Healing Received (multiplier: -0.5 = half effect)'], ['spell.asf', 'Arcane Spell Failure (+%, non-armor)']]],
    ['Spellcasting', [['casterLevel', 'Caster Level'], ['spell.dc', 'Spell Save DC'], ['spell.effectiveLevel', 'Effective Spell Level'], ['sr.penetration', 'Spell Penetration (vs SR)'], ['resource.pp', 'Bonus Power Points'], ['resource.essentia', 'Bonus Essentia']]],
    ['Companions & Entities', [['entity.animal_companion.levelBonus', 'Animal Companion Effective Level Bonus'], ['entity.familiar.levelBonus', 'Familiar Effective Level Bonus'], ['entity.special_mount.levelBonus', 'Special Mount Effective Level Bonus'], ['entity.fiendish_servant.levelBonus', 'Fiendish Servant Effective Level Bonus']]],
    ['Skills (36)', [['skill.all', 'All Skills'], ['choice.skill.1', 'Chosen Skill (@Choice)'], ['skill.knowledge', 'All Knowledge Skills']].concat(SKILLS.map((s) => [skillKey(s[0]), s[0]]))]
  ];
  const TARGET_LABEL = {}; TARGET_GROUPS.forEach((g) => g[1].forEach((t) => { TARGET_LABEL[t[0]] = t[1]; }));
  const BONUS_TYPES = (_RS && Array.isArray(_RS.bonusTypes)) ? _RS.bonusTypes : [
    { id: 'Untyped', stacks: true }, { id: 'Dodge', stacks: true, lostFF: true }, { id: 'Circumstance', stacks: true }, { id: 'Penalty', stacks: true },
    { id: 'Enhancement' }, { id: 'Luck' }, { id: 'Morale' }, { id: 'Sacred' }, { id: 'Profane' }, { id: 'Insight' }, { id: 'Competence' }, { id: 'Resistance' },
    { id: 'Deflection' }, { id: 'Alchemical' }, { id: 'Inherent', cap: 5 }, { id: 'Armor' }, { id: 'Armor Enhancement' }, { id: 'Shield' }, { id: 'Shield Enhancement' },
    { id: 'Natural Armor' }, { id: 'Natural Armor Enhancement' }, { id: 'Racial' }, { id: 'Size' }, { id: 'Exalted' }, { id: 'Perfection' }
  ];
  const DAMAGE_TYPES = (_RS && Array.isArray(_RS.damageTypes)) ? _RS.damageTypes : ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Force', 'Holy', 'Unholy', 'Positive', 'Negative', 'Precision', 'Vile', 'Nonlethal', 'Untyped', 'Healing'];
  const DIE_LIST = ['1', '1d2', '1d3', '1d4', '1d6', '1d8', '1d10', '1d12', '2d4', '2d6', '2d8', '2d10', '3d6', '4d6', '6d6', '6d8', 'd4', 'd6', 'd8', 'd10', 'd12', 'flat'];
  const ENERGY = (_RS && Array.isArray(_RS.energyTypes)) ? _RS.energyTypes : ['Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Force'];
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
  const AREAS = ['30-ft. Cone', '60-ft. Line', '20-ft.-radius Spread', '10-ft.-radius Burst', '30-ft.-radius Emanation', 'Cylinder (10-ft. radius, 40 ft. high)', 'One creature', 'One or more rays', 'You', 'One creature/level'];
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

  // Enhancements (special abilities) are NOT hardcoded: CAT.enchants is populated solely from SrdCompendium 'Enhancement' records (SRD + MIC) in mergeSrd().
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

  const CAT = { weapons: WEAPONS, armors: ARMORS, enchants: [], crystals: CRYSTALS, feats: FEATS, spells: SPELLS, domains: DOMAINS, deities: DEITIES, classFeatures: CLASS_FEATURES, homebrew: [], special: [], magicItems: [], classes: [], monsters: [], srdLoaded: false, srdCount: 0, customCount: 0 };
  const byId = (list, id) => list.find((x) => x.id === id);

  // --------------------------------------------------------------------------
  // 2. Categories (12 blueprints)
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
    { id: 'race', name: 'Race / Creature Template', icon: '🧬', facets: ['identity', 'effects', 'powers'] },
    { id: 'monster', name: 'Monster / Companion', icon: '👹', facets: ['identity', 'monster', 'effects', 'powers'] }
  ];
  const BP_BY_ID = {}; BLUEPRINTS.forEach((b) => { BP_BY_ID[b.id] = b; });
  BP_BY_ID.itemMod = BP_BY_ID.item_mod;
  BP_BY_ID.item = BP_BY_ID.wondrous;
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
  function shieldBashDefaults(a) {
    const rw = a && a.raw && a.raw.weapon ? a.raw.weapon : null;
    const idN = ((a && a.id) || '') + ' ' + ((a && a.name) || '');
    const noBash = /buckler|tower/i.test(idN) && !rw;
    const rawHand = rw ? String(rw.handedness || rw.handed || '') : '';
    const isLight = rw ? /light/i.test(rawHand) : /light|buckler/i.test(idN);
    const dDice = rw && (rw.damageDice || rw.dice) ? (rw.damageDice || rw.dice) : (isLight ? '1d3' : '1d4');
    const dType = rw && (rw.dmgType || rw.damageType) ? cap1(String(rw.dmgType || rw.damageType).split(/[\s/]/)[0]) : 'Bludgeoning';
    const cRng = rw && rw.baseCritRange != null ? num(rw.baseCritRange, 20) : 20;
    const cMult = rw && rw.critMultiplier != null ? num(rw.critMultiplier, 2) : 2;
    const rng = rw && rw.rangeIncrement != null ? num(rw.rangeIncrement, 0) : 0;
    return { canBash: !noBash, dice: dDice, critRange: cRng, critMult: cMult, rangeOn: rng > 0, range: rng, category: 'Shield', handed: isLight ? 'Light' : 'One-Handed', dmgType: dType };
  }
  function blankChassis(kind, baseId) {
    const isW = kind === 'weapon';
    const id = baseId || (isW ? 'longsword' : 'chain_shirt');
    const baseA = !isW ? (byId(CAT.armors, id) || ARMORS[3]) : null;
    const wep = isW ? weaponOverrides(id) : (baseA && baseA.kind === 'shield' ? shieldBashDefaults(baseA) : weaponOverrides('longsword'));
    return { kind: kind, baseId: id, material: 'standard', enhancement: 0, enchantments: [], crystal: { id: '', tier: 'least' }, weapon: wep, armor: armorOverrides(isW ? 'chain_shirt' : id) };
  }
  const blankUse = (mode) => ({ mode: mode || 'atwill', n: 3, slotLevel: 1, pool: 'Turn Undead', poolCost: 1, cooldown: '1d4+1' });
  function blankLevels() { const a = []; for (let i = 0; i < 20; i++) a.push({ features: [], spell: false }); return a; }
  function blankEntry(bpId) {
    const bp = BP_BY_ID[bpId] || BLUEPRINTS[0];
    return {
      schemaVersion: 3, id: uid('custom'), blueprint: bp.id, name: '', source: DEFAULT_SOURCE, text: '', tags: [], repeat: { mode: 'once', n: 2 },
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
      monster: {
        size: 'Medium', creatureType: 'Magical Beast', subtypes: '', alignment: 'Neutral', environment: 'Any',
        cr: '1', la: 0, hdCount: 2, hdDie: 8, hdBonus: 2, hitDice: '2d8+2', hp: 11, init: 2,
        speeds: { land: 30, fly: 0, flyMan: 'Average', swim: 0, climb: 0, burrow: 0 },
        ac: { total: 14, touch: 12, flatFooted: 12, naturalArmor: 2, armor: 0, shield: 0, deflection: 0 },
        bab: 2, grapple: 3, space: '5 ft.', reach: '5 ft.',
        abilities: { str: 13, dex: 15, con: 12, int: 2, wis: 12, cha: 6 },
        nonabilities: [],
        saves: { fort: 4, ref: 5, will: 1 },
        attacks: [], skills: [], feats: [], specialAbilities: []
      },
      prereqs: [],
      chassis: blankChassis(bp.id === 'armor' ? 'armor' : 'weapon'),
      powers: [], effects: [], buffKind: 'Buff',
      // modes[]: `modes` = editable activation modes; Off and weapon-grip modes are kept aside and written back untouched.
      modes: [], _modesOff: [], _modesWeapon: [],
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
      use: blankUse('perDay'), action: 'Standard', cl: '', dc: 0, dcFormula: '', spellLevel: '', gainedAt: '', duration: '',
      attack: 'none', attackOn: false, range: '', area: '',
      save: { type: 'None', effect: 'Negates' }, effects: [], text: '', exportStandalone: false
    }, o || {});
  }
  const FEATURE = (name, o) => Object.assign({ id: uid('f'), kind: 'ref', name: name, abilityType: 'Ex', branchPath: '', text: '', refId: '' }, o || {});
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
  const META_COST_MODES = [['slot', '+Slot Level'], ['passive', 'Passive / Free (+0 Slot)'], ['rod', 'Metamagic Rod (Uses/Day)'], ['sudden', 'Sudden (Uses/Day, +0 Slot)'], ['pool', 'Pool Cost (Divine Metamagic)'], ['essenceShape', 'Invocation Essence / Blast Shape']];
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
  const WHEN_COND_LABELS = {
    notFlatFooted: 'While Not Flat-Footed',
    wieldingChosenShield: 'While Wielding Chosen Shield',
    wieldingChosenWeapon: 'While Wielding Chosen Weapon',
    wieldingTwoWeapons: 'While Two-Weapon / Double Weapon Fighting',
    vsAoOFromMovement: 'vs. Attacks of Opportunity from Movement',
    castingChosenSchool: 'When Casting Chosen School (@Choice)'
  };
  const RULE_SWITCH_FLAGS = (_RS && Array.isArray(_RS.ruleSwitchFlags)) ? _RS.ruleSwitchFlags : [
    ['noAutoFailFortSaveOnNat1', 'Do Not Auto-Fail Fortitude Save on Natural 1'],
    ['shieldToTouchAc', 'Shield AC Bonus Applies to Touch AC'],
    ['monkeyGrip', 'Wield +1 Size Larger Weapons at -2 Attack (Monkey Grip)'],
    ['naturalSpell', 'Cast Spells While in Wild Shape (Natural Spell)'],
    ['uncannyDodge', 'Retain DEX Bonus to AC When Flat-Footed (Uncanny Dodge)'],
    ['ignoreArmorSpeedPenalty', 'Ignore Medium/Heavy Armor Speed Reduction'],
    ['oneHandedOffHandAsLight', 'Treat One-Handed Off-Hand Weapon as Light (Oversized TWF)'],
    ['tacticalSlider', 'Enable Tactical Combat Slider (Power Attack / Expertise / Manyshot)']
  ];
  const RULE_SWITCH_LABEL = {}; RULE_SWITCH_FLAGS.forEach((x) => { RULE_SWITCH_LABEL[x[0]] = x[1]; });

  const SWAP_TARGET_GROUPS = (_RS && Array.isArray(_RS.statSwapTargetGroups)) ? _RS.statSwapTargetGroups : [
    ['Attack Rolls', [
      ['atk.melee.abilityMod', 'Melee Attack Ability (Default: STR)', 'str'],
      ['atk.ranged.abilityMod', 'Ranged Attack Ability (Default: DEX)', 'dex'],
      ['atk.thrown.abilityMod', 'Thrown Weapon Attack Ability (Default: DEX)', 'dex'],
      ['atk.touch.abilityMod', 'Touch Attack Ability (Default: STR / DEX)', 'dex'],
      ['grapple.abilityMod', 'Grapple / Combat Maneuver Ability (Default: STR)', 'str']
    ]],
    ['Damage Rolls', [
      ['dmg.melee.abilityMod', 'Melee Damage Ability (Default: STR)', 'str'],
      ['dmg.ranged.abilityMod', 'Ranged / Thrown Damage Ability (Default: None / STR)', 'str']
    ]],
    ['Saving Throws', [
      ['save.fort.abilityMod', 'Fortitude Save Ability (Default: CON)', 'con'],
      ['save.ref.abilityMod', 'Reflex Save Ability (Default: DEX)', 'dex'],
      ['save.will.abilityMod', 'Will Save Ability (Default: WIS)', 'wis']
    ]],
    ['Defense & Vitals', [
      ['ac.abilityMod', 'Armor Class Ability (Default: DEX)', 'dex'],
      ['initiative.abilityMod', 'Initiative Ability (Default: DEX)', 'dex'],
      ['hp.abilityMod', 'Hit Points per HD Ability (Default: CON)', 'con']
    ]],
    ['Skills & Concentration', [
      ['concentration.abilityMod', 'Concentration Ability (Default: CON)', 'con'],
      ['choice.skill.1.abilityMod', 'Chosen Skill (@Choice) Key Ability', 'wis']
    ].concat(SKILLS.map((s) => ['skill.' + String(s[0]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.abilityMod', s[0] + ' Skill Ability (Default: ' + String(s[1]).toUpperCase() + ')', s[1]]))],
    ['Core Scaling & Spellcasting', [
      ['bab', 'Base Attack Bonus (Default: Class BAB)', 'bab'],
      ['spell.dc.abilityMod', 'Spell Save DC Key Ability', 'wis'],
      ['spell.bonusSlots.abilityMod', 'Bonus Spells Key Ability', 'wis']
    ]]
  ];
  const SWAP_TARGET_LABEL = {};
  const SWAP_DEFAULT_FROM = {};
  SWAP_TARGET_GROUPS.forEach((g) => g[1].forEach((t) => {
    SWAP_TARGET_LABEL[t[0]] = t[1];
    if (t[2]) SWAP_DEFAULT_FROM[t[0]] = t[2];
  }));
  const SWAP_SOURCES = (_RS && Array.isArray(_RS.statSwapSources)) ? _RS.statSwapSources : [
    ['str', 'STR Modifier (@strMod)'], ['dex', 'DEX Modifier (@dexMod)'], ['con', 'CON Modifier (@conMod)'],
    ['int', 'INT Modifier (@intMod)'], ['wis', 'WIS Modifier (@wisMod)'], ['cha', 'CHA Modifier (@chaMod)'],
    ['0.5*str', '½× STR Modifier'], ['0.5*dex', '½× DEX Modifier'], ['0.5*int', '½× INT Modifier'],
    ['0.5*wis', '½× WIS Modifier'], ['0.5*cha', '½× CHA Modifier'],
    ['1.5*str', '1.5× STR Modifier'], ['1.5*dex', '1.5× DEX Modifier'],
    ['choice.abilityMod', 'Chosen Ability Modifier (@Choice)'],
    ['@level', 'Character Level / Total HD (@level)'], ['@classLevel', 'Class Level (@classLevel)'], ['@cl', 'Caster Level (@cl)']
  ];
  const SWAP_SOURCE_LABEL = {}; SWAP_SOURCES.forEach((x) => { SWAP_SOURCE_LABEL[x[0]] = x[1]; });
  const SWAP_OPS = (_RS && Array.isArray(_RS.statSwapOps)) ? _RS.statSwapOps : [
    ['max', 'Higher Of A or B (May Use B Instead of A)'],
    ['replace', 'Replace A with B (Always Use B)'],
    ['add', 'Add B Alongside A (A + B)']
  ];
  const SWAP_SCOPES = (_RS && Array.isArray(_RS.statSwapScopes)) ? _RS.statSwapScopes : [
    ['all', 'All Applicable Rolls (Unconditional)'],
    ['finessable', 'Light & Finesse Weapons (Light, Rapier, Whip, Spiked Chain)'],
    ['simple_or_natural', 'Simple & Natural Weapons (Intuitive Attack)'],
    ['thrown', 'Thrown Weapons Only (Brutal / Power Throw)'],
    ['bow_or_crossbow', 'Bows & Crossbows Only'],
    ['chosen_weapon', 'Chosen Weapon (@Choice)'],
    ['discipline_weapons', 'Shadow Hand / Discipline Weapons (In Stance)'],
    ['light_or_no_armor', 'In Light or No Armor'],
    ['not_flat_footed', 'While Not Flat-Footed'],
    ['mind_affecting', 'vs. Mind-Affecting Effects Only']
  ];
  const SWAP_SCOPE_LABEL = {}; SWAP_SCOPES.forEach((x) => { SWAP_SCOPE_LABEL[x[0]] = x[1]; });

  const LEGACY_SWITCH_TO_SWAP = {
    weaponFinesse: { swapTarget: 'atk.melee.abilityMod', subOp: 'max', fromStat: 'str', toStat: 'dex', swapScope: 'finessable' },
    conToWillSave: { swapTarget: 'save.will.abilityMod', subOp: 'replace', fromStat: 'wis', toStat: 'con', swapScope: 'all' },
    babEqualsLevel: { swapTarget: 'bab', subOp: 'max', fromStat: 'bab', toStat: '@level', swapScope: 'all' },
    shadowBlade: { swapTarget: 'dmg.melee.abilityMod', subOp: 'add', fromStat: 'str', toStat: 'dex', swapScope: 'discipline_weapons' },
    'zen-archery': { swapTarget: 'atk.ranged.abilityMod', subOp: 'max', fromStat: 'dex', toStat: 'wis', swapScope: 'all' },
    'intuitive-attack': { swapTarget: 'atk.melee.abilityMod', subOp: 'max', fromStat: 'str', toStat: 'wis', swapScope: 'simple_or_natural' },
    'brutal-throw': { swapTarget: 'atk.thrown.abilityMod', subOp: 'max', fromStat: 'dex', toStat: 'str', swapScope: 'thrown' },
    'force-of-personality': { swapTarget: 'save.will.abilityMod', subOp: 'max', fromStat: 'wis', toStat: 'cha', swapScope: 'mind_affecting' },
    'insightful-reflexes': { swapTarget: 'save.ref.abilityMod', subOp: 'max', fromStat: 'dex', toStat: 'int', swapScope: 'all' },
    'charming-the-arrow': { swapTarget: 'atk.ranged.abilityMod', subOp: 'max', fromStat: 'dex', toStat: 'cha', swapScope: 'bow_or_crossbow' }
  };

  function normalizeSwapTargetKey(raw) {
    const k = String(raw || '').trim();
    const alias = {
      'atk.all': 'atk.melee.abilityMod', 'atk.melee': 'atk.melee.abilityMod', 'attack.melee': 'atk.melee.abilityMod',
      'atk.ranged': 'atk.ranged.abilityMod', 'attack.ranged': 'atk.ranged.abilityMod',
      'atk.touch': 'atk.touch.abilityMod', 'grapple': 'grapple.abilityMod', 'atk.grapple': 'grapple.abilityMod',
      'dmg.all': 'dmg.melee.abilityMod', 'dmg.melee': 'dmg.melee.abilityMod', 'damage.melee': 'dmg.melee.abilityMod',
      'dmg.ranged': 'dmg.ranged.abilityMod', 'damage.ranged': 'dmg.ranged.abilityMod',
      'save.will': 'save.will.abilityMod', 'save.ref': 'save.ref.abilityMod', 'save.fort': 'save.fort.abilityMod',
      'ac': 'ac.abilityMod', 'ac.total': 'ac.abilityMod', 'ac.all': 'ac.abilityMod',
      'init': 'initiative.abilityMod', 'initiative': 'initiative.abilityMod',
      'hp': 'hp.abilityMod', 'hp.perLevel': 'hp.abilityMod', 'hp.perLvl': 'hp.abilityMod',
      'skill.concentration': 'concentration.abilityMod', 'spell.dc': 'spell.dc.abilityMod'
    }[k];
    if (alias) return alias;
    if (/^skill\.[a-z0-9_-]+$/i.test(k)) return 'skill.' + k.slice(6).toLowerCase().replace(/_/g, '-') + '.abilityMod';
    if (k === 'choice.skill.1') return 'choice.skill.1.abilityMod';
    return SWAP_TARGET_LABEL[k] ? k : 'atk.melee.abilityMod';
  }
  function swapSourceFormula(src) {
    const s = String(src || 'wis').trim();
    if (s.startsWith('@')) return s;
    if (s === 'choice.abilityMod') return '@choice.abilityMod';
    const multM = s.match(/^([0-9.]+)\*([a-z]+)$/i);
    if (multM) return 'floor(@' + multM[2].toLowerCase() + 'Mod * ' + multM[1] + ')';
    if (/^(str|dex|con|int|wis|cha)$/i.test(s)) return '@' + s.toLowerCase() + 'Mod';
    return s;
  }

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
      condKind: 'activation', condText: 'Bloodrage',
      choiceVar: 'combat_path', choiceVal: 'Offense', minLvl: 5,
      oathRule: 'Zero Magic Items & Wealth Cap', onBreak: 'irrevocable',
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
        choiceUnlockLvl: 5, choiceOptions: 'Offense, Defense', defaultChoice: 'Offense',
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
        swapTarget: 'atk.melee.abilityMod', subOp: 'max', fromStat: 'str', toStat: 'wis', swapScope: 'all',
        per: 3, min: 0, max: 5, formula: '', condition: ''
      },
      roll: {
        kind: 'Damage', count: 1, die: 'd6', flat: 0, dmgType: 'Fire',
        scaling: 'flat', amount: 1, per: 1, start: 1, max: 10,
        varKey: 'augment_pp', varMode: 'dice', dice: '',
        crit: 'normal', save: '', condition: ''
      },
      attack: {
        attackMode: 'natural', natKind: 'primary', count: 2, weaponName: 'Claw', dice: '1d4', dmgType: 'B/P/S',
        extraKind: 'extraFull', penalty: -2, rider: '',
        duration: '1 min', budgetScaling: 'per4Lvl', maxBudget: 5, allowedEnchs: 'Flaming, Frost, Shock, Keen, Speed',
        unarmedProgression: 'monk', effLvlBonus: 0,
        appliesToWeapon: 'unarmed', enhEquivalent: 0, drBypassList: 'magic'
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
    if (type === 'resource' && !Object.prototype.hasOwnProperty.call(o || {}, 'varKey') && !out.varKey) out.varKey = slug(out.name || 'resource');
    return out;
  }

  // Blocks added from the palette start neutral (no target, 0, Untyped, no dice/energy, no dummy Bloodrage/Arcane Pool).
  // BLK() keeps its schema-shaped defaults for the built-in presets / importers; curated starting points live in QUICK_PRESETS.
  const NEUTRAL_BRANCH_OVERRIDES = {
    condKind: 'state', condText: '', choiceVar: '', choiceVal: '', minLvl: 1,
    oathRule: '', onBreak: 'suppress', trigger: 'activate', action: 'Swift', targetText: '',
    costKind: 'none', costVal: 1, costFormula: '1', poolName: '', checkFormula: '', cooldownText: ''
  };
  const NEUTRAL_BLOCK = {
    resource: { name: '', varKey: '', resMode: 'spend', scaling: 'flat', max: 1, reset: 'perDay', cooldownText: '', costPool: '', choiceOptions: '', defaultChoice: '' },
    when: { flow: 'while', branches: [Object.assign({}, NEUTRAL_BRANCH_OVERRIDES, { kids: [] })] },
    table: { die: '1d6', rows: [{ roll: '1', kids: [] }] },
    stat: { targets: [], mode: 'flat', value: 0, btype: 'Untyped', condition: '' },
    roll: { kind: 'Damage', count: 0, die: 'd6', flat: 0, dmgType: 'Untyped' },
    attack: { weaponName: '', dice: '', dmgType: '', count: 1, rider: '' },
    defense: { what: '', value: 0 },
    carrier: { atkPenalty: 0, dcBonus: 0, slotAdj: 0, rider: '', appliesTo: '' },
    effect: { effectKind: 'rule', spellName: '', spellOptions: '', maxSpellLvl: 1, text: '' }
  };
  const EDITABLE_EFFECT_KINDS = [
    ['ruleSwitch', '🔀 Rule Switch Flag (Boolean)'],
    ['castSpell', '🔮 Cast Spell / Free Buff'],
    ['recoverSlot', '🔄 Recover Expended Slot / Maneuver'],
    ['stealStore', '⚡ Steal / Drain into @Buffer'],
    ['grantFeat', '🎯 Grant Bonus / Floating Feat'],
    ['castEvolution', '✨ Upgrade Cast Nature (Spell → Sp → Su)'],
    ['proficiency', '🛡️ Grant Proficiency (weapon / armor / shield)'],
    ['familiarity', '⚔️ Weapon Familiarity (treat as Martial)'],
    ['feat', '🎖️ Grant Specific Bonus Feat (by feat id)'],
    ['rule', '📜 Rule Text (Unstructured Note)']
  ];
  const EDITABLE_EFFECT_SET = new Set(EDITABLE_EFFECT_KINDS.map((x) => x[0]));
  const PRESERVED_EFFECT_LABELS = {
    linkedSpell: 'Linked Spell (Continuous / Item)',
    bonusSlot: 'Bonus Spell Slot',
    trait: 'Racial / Character Trait',
    reroll: 'Reroll Effect',
    greater_turning: 'Greater Turning',
    grant: 'Entity / Domain Grant',
    flag: 'Engine State Flag',
    sense: 'Special Sense',
    movement: 'Movement Mode',
    condition: 'Condition Effect',
    summon: 'Summon / Companion',
    entity: 'Companion / Entity Grant'
  };
  const EDITABLE_DEFENSE_MODES = ['Immunity', 'Condition Immunity', 'DR', 'Energy Resistance', 'Spell Resistance', 'Concealment %', 'Sense / Movement', 'Vulnerability', 'Size Change', 'State Flag'];
  const EDITABLE_DEFENSE_SET = new Set(EDITABLE_DEFENSE_MODES);
  function isPreservedDefenseBlock(b) {
    return !!(b && b.type === 'defense' && b.mode && !EDITABLE_DEFENSE_SET.has(b.mode));
  }
  function defValOut(v, fallback) {
    if (typeof v === 'string' && v.trim() !== '' && isNaN(Number(v))) return v.trim();
    return num(v, fallback);
  }
  function isPreservedEffectBlock(b) {
    if (!b || b.type !== 'effect') return false;
    const ek = b.effectKind || ((b.flag || b.ruleFlag) ? 'ruleSwitch' : 'rule');
    return !EDITABLE_EFFECT_SET.has(ek);
  }
  function isUnstructuredBlock(b) {
    if (!b || b.type !== 'effect') return false;
    const ek = b.effectKind || ((b.flag || b.ruleFlag) ? 'ruleSwitch' : 'rule');
    return ek === 'rule' && !b.flag && !b.ruleFlag;
  }
  function isIncompleteBlock(b) {
    if (!b) return false;
    if (b.type === 'stat') return modMode(b) !== 'replaceStat' && !(b.targets && b.targets.length);
    if (b.type === 'resource') return !String(b.name || '').trim();
    if (b.type === 'defense') return !isPreservedDefenseBlock(b) && ['Size Change', 'State Flag', 'Spell Resistance', 'Concealment %'].indexOf(b.mode || 'Immunity') < 0 && !String(b.what || '').trim();
    if (b.type === 'effect') {
      if (isPreservedEffectBlock(b)) return false;
      const ek = b.effectKind || ((b.flag || b.ruleFlag) ? 'ruleSwitch' : 'rule');
      if (ek === 'rule') return !String(b.text || '').trim();
      if (ek === 'proficiency' || ek === 'feat' || ek === 'familiarity') return !String(b.targetId || '').trim();
    }
    if (b.type === 'when') return !(b.branches || []).some((br) => (br.kids || []).length > 0);
    if (b.type === 'table') return !(b.rows || []).some((r) => (r.kids || []).length > 0);
    return false;
  }
  function entryCoverageStats(en) {
    let mech = 0, total = 0;
    const walk = (arr) => (arr || []).forEach((b) => {
      if (!b || typeof b !== 'object') return;
      if (b.type === 'when') { (b.branches || []).forEach((br) => walk(br.kids)); return; }
      if (b.type === 'table') { (b.rows || []).forEach((r) => walk(r.kids)); return; }
      total++;
      if (!isUnstructuredBlock(b)) mech++;
    });
    walk(en.effects);
    (en.powers || []).forEach((pw) => walk(pw.effects));
    (en.modes || []).forEach((m) => walk(m.effects));
    return { mech: mech, total: total };
  }
  const QUICK_PRESETS = {
    stat: [
      { label: 'Morale +1 to all attack rolls', o: { targets: ['atk.all'], value: 1, btype: 'Morale' } },
      { label: 'Enhancement +2 natural armor', o: { targets: ['ac.natural'], value: 2, btype: 'Enhancement' } },
      { label: 'Enhancement +10 ft. land speed', o: { targets: ['speed.land'], value: 10, btype: 'Enhancement' } }
    ],
    roll: [
      { label: '1d6 fire damage', o: { kind: 'Damage', count: 1, die: 'd6', dmgType: 'Fire' } },
      { label: '1d8 healing', o: { kind: 'Healing', count: 1, die: 'd8' } }
    ],
    attack: [
      { label: 'Natural claws (2 × 1d4)', o: { attackMode: 'natural', natKind: 'primary', count: 2, weaponName: 'Claw', dice: '1d4', dmgType: 'B/P/S' } }
    ],
    defense: [
      { label: 'Immunity: Fear', o: { mode: 'Immunity', what: 'Fear' } },
      { label: 'Energy Resistance 10: Fire', o: { mode: 'Energy Resistance', what: 'Fire', value: 10 } }
    ],
    carrier: [
      { label: 'Spellstrike-style melee channel', o: { carrierMode: 'meleeChannel', channelStyle: 'spellstrikeFree', atkPenalty: -2, dcBonus: 1, slotAdj: 1 } }
    ],
    effect: [
      { label: 'Linked spell: Command', o: { effectKind: 'castSpell', castMode: 'linkedSpell', spellName: 'Command', maxSpellLvl: 2 } }
    ]
  };
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
    const nk = normalizeSwapTargetKey(k);
    return (SWAP_TARGET_LABEL[nk] || targetLabel(k)).replace(/\s*\(Default:.*?\)$/, '');
  }
  function replaceStatSummary(m, targetText) {
    const swapTgt = normalizeSwapTargetKey(m.swapTarget || (m.targets && m.targets[0]) || 'atk.melee.abilityMod');
    const lbl = replaceStatTargetLabel(swapTgt) || targetText;
    const from = String(m.fromStat || SWAP_DEFAULT_FROM[swapTgt] || 'str').toUpperCase();
    const toRaw = String(m.toStat || 'wis');
    const toLbl = (SWAP_SOURCE_LABEL[toRaw] || toRaw.toUpperCase()).replace(/\s*\(@.*?\)$/, '');
    const sc = m.swapScope && m.swapScope !== 'all' ? ' [' + (SWAP_SCOPE_LABEL[m.swapScope] || m.swapScope).replace(/\s*\(.*?\)$/, '') + ']' : '';
    const capTxt = m.subOp === 'add' && m.cap === 'classLevel' ? ' (cap @classLevel)' : (m.subOp === 'add' && m.cap === 'flat' ? ' (cap +' + num(m.capVal, 5) + ')' : '');
    const core = m.subOp === 'add'
      ? '+' + toLbl + capTxt + ' alongside ' + from + ' on ' + lbl
      : (m.subOp === 'replace' ? 'Replace ' + from + ' → ' + toLbl + ' on ' + lbl : 'Higher of ' + toLbl + ' / ' + from + ' on ' + lbl);
    return core + sc + (m.condition ? ' (' + m.condition + ')' : '');
  }
  function metamagicCostText(b) {
    if (b.costMode === 'passive') return 'Passive (+0 Slot)';
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
    const flat = die === 'flat' ? 0 : num(b.flat, 0);
    const flatStr = flat !== 0 ? (flat > 0 ? '+' + flat : String(flat)) : '';
    const unit = (b.scaling === 'formula' && b.dice)
      ? String(b.dice).trim()
      : (die === 'flat' ? (cnt > 0 ? String(cnt) : '') : ((/^\d+d\d+$/.test(die) ? die : (cnt > 0 ? cnt + die : '')) + flatStr));
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
    if (b.scaling === 'formula' && b.dice) return String(b.dice).trim();
    const cnt = num(b.count, 1), die = String(b.die || 'd6');
    const flat = die === 'flat' ? 0 : num(b.flat, 0);
    const flatStr = flat !== 0 ? (flat > 0 ? '+' + flat : String(flat)) : '';
    if (b.scaling !== 'perCL') return die === 'flat' ? String(cnt) : ((/^\d+d\d+$/.test(die) ? die : cnt + die) + flatStr);
    const start = num(b.start, 1), per = Math.max(1, num(b.per, 1)), maxSteps = Math.max(1, num(b.max, 10));
    const steps = cl < start ? 0 : Math.min(maxSteps, Math.floor((cl - start) / per) + 1);
    const total = (cnt > 0 && start > 1 ? cnt + (steps - 1) * num(b.amount, 1) : steps * num(b.amount, cnt || 1));
    if (die === 'flat') return String(total);
    return total + die.replace(/^\d+/, '') + flatStr;
  }
  function whenBranchHeadText(flow, br) {
    if (flow === 'while') {
      if (br.condKind === 'choicePath') {
        return 'Path @' + (br.choiceVar || 'combat_path') + ' = ' + (br.choiceVal || 'Offense') + ' (Lvl ≥ ' + num(br.minLvl, 1) + ')';
      }
      if (br.condKind === 'oath') {
        const brk = { suppress: 'Suppress', loss24h: '24h Loss', atonement: 'Needs Atonement', irrevocable: 'Irrevocable' }[br.onBreak || 'suppress'] || 'Suppress';
        return 'Oath (' + (br.oathRule || 'Unbroken') + ' — Break: ' + brk + ')';
      }
      if (WHEN_COND_LABELS[br.condKind]) {
        return WHEN_COND_LABELS[br.condKind] + (br.condText ? ' (' + br.condText + ')' : '');
      }
      if (WHEN_COND_LABELS[br.condText]) {
        return WHEN_COND_LABELS[br.condText];
      }
      const kindLbl = { state: 'While State', activation: 'While Activated', bound: 'While Bound', levelTier: 'Tier', synergy: 'Synergy', situational: 'When' }[br.condKind || 'state'] || 'While';
      return kindLbl + ': ' + (br.condText || 'Active');
    }
    const trigLbl = {
      activate: 'Activate (' + (br.action || 'Swift') + ')',
      enterState: 'On Enter ' + (br.targetText || 'State'),
      meleeHit: 'On Melee Hit',
      critHit: 'On Critical Hit',
      sneakHit: 'On Sneak Attack Hit',
      takeDamage: 'On Taking Damage',
      meleeStruck: 'When Struck in Melee',
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
        const vk = '@' + (b.varKey || slug(b.name || 'pool'));
        if (b.resMode === 'choice') {
          const optsTxt = String(b.choiceOptions || 'Offense, Defense').split(',').map((s) => s.trim()).filter(Boolean).join(' / ');
          return (b.name || 'Path Choice') + ' (' + vk + ' at Lvl ' + num(b.choiceUnlockLvl, 1) + ': ' + optsTxt + ')';
        }
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
          : mode === 'stat' ? statFormulaText(b)
          : mode === 'formula' ? (b.formula || sgn(num(b.value)))
          : sgn(num(b.value));
        const condTxt = b.condition && typeof b.condition === 'object' ? (b.condition.toggle ? 'toggle:' + b.condition.toggle : JSON.stringify(b.condition)) : b.condition;
        return v + ' ' + (b.btype || 'Untyped') + ' → ' + t + (condTxt ? ' (' + condTxt + ')' : '');
      }
      case 'roll': return rollBlockText(b);
      case 'attack': {
        const am = b.attackMode || 'natural';
        if (am === 'unarmedDie') {
          const rdr = b.rider ? ' • ' + b.rider : '';
          if (b.unarmedProgression === 'fixed') return 'Unarmed Base Die: ' + (b.dice || '1d6') + ' (Size-Scaled)' + rdr;
          const elb = num(b.effLvlBonus, 0);
          return 'Unarmed Base Die: Monk Scaling 1d6→2d10 (Size-Scaled' + (elb ? ', ' + sgn(elb) + ' Eff. Lvl' : '') + ')' + rdr;
        }
        if (am === 'strikeBypass') {
          const wLbl = { unarmed: 'Unarmed', wieldedSimple: 'Simple Weapons', allMelee: 'All Melee' }[b.appliesToWeapon || 'unarmed'] || 'Unarmed';
          const enh = num(b.enhEquivalent, 0);
          return 'Passive Strike (' + wLbl + '):' + (enh > 0 ? ' +' + enh + ' Enh &' : '') + ' Bypasses DR/' + (b.drBypassList || 'magic');
        }
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
        if (b.mode === 'Spell Resistance') return 'SR ' + (b.srMode === 'level' ? '10 + @level' : defValOut(b.value, 15));
        if (b.mode === 'Concealment %') return defValOut(b.value, 20) + '% Concealment Miss Chance';
        if (b.mode === 'DR') return 'DR ' + defValOut(b.value, 5) + '/' + (b.what || '-');
        if (b.mode === 'Energy Resistance') return 'Resist ' + (b.what || 'Fire') + ' ' + defValOut(b.value, 10);
        if (isPreservedDefenseBlock(b)) return b.mode + (b.value !== undefined && b.value !== '' ? ' ' + b.value : '') + (b.what ? ': ' + b.what : '');
        return b.mode + ': ' + (b.what || '');
      }
      case 'effect': {
        const ek = b.effectKind || ((b.flag || b.ruleFlag) ? 'ruleSwitch' : 'rule');
        const fk = b.flag || b.ruleFlag || '';
        if (ek === 'ruleSwitch' || (ek === 'flag' && fk && RULE_SWITCH_LABEL[fk])) {
          return 'Rule Switch: ' + (RULE_SWITCH_LABEL[fk] || fk || 'Flag');
        }
        if (ek === 'castSpell' || ek === 'linkedSpell') {
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
        if (ek === 'proficiency') return 'Proficiency: ' + (b.targetId || '?');
        if (ek === 'feat') return 'Bonus Feat: ' + (b.targetId || '?');
        if (ek === 'familiarity') return 'Weapon Familiarity: ' + (b.targetId || '?') + ' as ' + (b.treatAs || 'martial');
        if (ek === 'castEvolution') return 'Cast Nature → ' + (b.castNature || 'Supernatural (Su, No SR/AoO)');
        if (ek === 'bonusSlot') return 'Bonus Spell Slot (Lvl ' + num(b.slotLevel, 1) + ': ' + (b.count === 'double' ? '×2 Base Slots' : '+' + num(b.count, 1)) + ')';
        if (isPreservedEffectBlock(b)) {
          const tag = PRESERVED_EFFECT_LABELS[ek] || ek;
          return tag + (b.text ? ': ' + b.text : (b.targetId ? ': ' + b.targetId : (fk ? ': ' + fk : '')));
        }
        return b.text || 'Rule effect (empty)';
      }
      default: return b.type;
    }
  }

  // --------------------------------------------------------------------------
  // 4b. 40 Curated Benchmark Presets (Pure Lego Core V3)
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
    { id: 'hourglass', icon: '⏳', label: 'Chronos Hourglass (Homebrew Relic: 3/day Reroll + 1/day Replay Turn)', build() {
      const e = blankEntry('wondrous');
      Object.assign(e, { name: 'Chronos Hourglass', source: DEFAULT_SOURCE, tags: ['#DMGrant', '#Relic'], text: 'A palm-sized hourglass of star-glass whose sand flows upward. Bound to a single wielder by the DM.' });
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
          blankBranch({ condKind: 'activation', condText: 'Bloodrage', kids: [
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
      return e; } },
    { id: 'monk_ki', icon: '⚡', label: 'Monk Class 1–20 (Unarmed Scaling 1d6→2d10, Flurry Evolution, Unarmored WIS AC & Ki Pool)', build() {
      const e = blankEntry('class');
      Object.assign(e, {
        name: 'Monk', source: 'PHB p.39 / Ki Hybrid', tags: ['#CoreClass', '#Martial', '#Ki'],
        text: 'Ascetic martial artist channeling Ki through scaling unarmed strikes (1d6→2d10), Flurry of Blows, Evasion, Still Mind, and Unarmored AC.'
      });
      const p = e.progression;
      Object.assign(p, {
        mode: 'base', maxLevel: 20, hitDie: 8, bab: '3/4', skillPts: 4,
        good: { fort: true, ref: true, will: true },
        classSkills: ['Balance', 'Climb', 'Concentration', 'Craft', 'Diplomacy', 'Escape Artist', 'Hide', 'Jump', 'Knowledge', 'Listen', 'Move Silently', 'Perform', 'Profession', 'Sense Motive', 'Spot', 'Swim', 'Tumble']
      });
      const feat = (name, type, txt) => FEATURE(name, { kind: 'inline', abilityType: type || 'Ex', text: txt || '' });
      p.levels[0].features = [
        feat('Bonus Feat (Improved Unarmed Strike)', 'Ex', 'Unarmed strikes count as both manufactured and natural weapons and deal scaling lethal or nonlethal damage.'),
        feat('Flurry of Blows (-2)', 'Ex', 'Make one extra attack at highest BAB during a full attack (-2 penalty to all attacks).'),
        feat('AC Bonus (+WIS)', 'Ex', 'Add Wisdom modifier to AC and Touch AC when unarmored, unshielded, and carrying a light load.')
      ];
      p.levels[1].features = [feat('Evasion', 'Ex', 'Take no damage on a successful Reflex saving throw against effects allowing half damage.')];
      p.levels[2].features = [feat('Fast Movement (+10 ft.)', 'Ex', '+10 ft. enhancement bonus to land speed while unarmored and unencumbered.'), feat('Still Mind', 'Ex', '+2 bonus on saving throws against enchantment spells and effects.')];
      p.levels[3].features = [feat('Ki Strike (Magic)', 'Su', 'Unarmed strikes are treated as magic weapons for overcoming damage reduction.'), feat('Slow Fall 20 ft.', 'Ex', 'Reduce effective falling distance by 20 ft. when within arm’s reach of a wall.')];
      p.levels[4].features = [feat('Purity of Body', 'Ex', 'Immunity to all diseases except supernatural and magical diseases.'), feat('Flurry Penalty Reduced (-1)', 'Ex', 'Flurry of Blows penalty improves to -1.')];
      p.levels[5].features = [feat('Slow Fall 30 ft.', 'Ex', 'Slow Fall distance increases to 30 ft.')];
      p.levels[6].features = [feat('Wholeness of Body', 'Su', 'Heal a number of hit points equal to twice your monk level each day.')];
      p.levels[7].features = [feat('Slow Fall 40 ft.', 'Ex', 'Slow Fall distance increases to 40 ft.')];
      p.levels[8].features = [feat('Improved Evasion', 'Ex', 'Take only half damage on a failed Reflex save and no damage on a success.'), feat('Flurry Penalty Eliminated (+0)', 'Ex', 'Make Flurry of Blows attacks with no attack penalty.')];
      p.levels[9].features = [feat('Ki Strike (Lawful)', 'Su', 'Unarmed strikes bypass DR/lawful in addition to DR/magic.')];
      p.levels[10].features = [feat('Greater Flurry (+2 Attacks)', 'Ex', 'Gain a second extra attack at highest BAB when using Flurry of Blows.'), feat('Diamond Body', 'Su', 'Immunity to poisons of all kinds.')];
      p.levels[11].features = [feat('Abundant Step', 'Su', 'Slip magically between spaces once per day as dimension door.')];
      p.levels[12].features = [feat('Diamond Soul (SR 10 + Monk Lvl)', 'Ex', 'Gain spell resistance equal to current monk level + 10.')];
      p.levels[14].features = [feat('Quivering Palm', 'Su', 'Set fatal vibrations inside a target once per week (Fortitude negates).')];
      p.levels[15].features = [feat('Ki Strike (Adamantine)', 'Su', 'Unarmed strikes bypass DR/adamantine and hardness less than 20.')];
      p.levels[16].features = [feat('Timeless Body', 'Ex', 'No longer takes ability score penalties for aging.'), feat('Tongue of the Sun and Moon', 'Ex', 'Speak with any living creature.')];
      p.levels[18].features = [feat('Empty Body', 'Su', 'Become ethereal for up to 1 round per monk level per day.')];
      p.levels[19].features = [feat('Perfect Self (DR 10/magic)', 'Su', 'Treated as an outsider rather than humanoid and gain DR 10/magic.')];
      e.grants.featGrants = [1, 2, 6].map((lv) => ({ id: uid('g'), count: 1, pool: '#FighterBonus', level: lv }));
      e.effects = [
        BLK('resource', { name: 'Ki Pool', varKey: 'ki_pool', resMode: 'spend', scaling: 'halfLvlPlusMod', max: 0, ability: 'wis', reset: 'perDay' }),
        BLK('attack', { attackMode: 'unarmedDie', unarmedProgression: 'monk', effLvlBonus: 0, rider: 'Counts as both manufactured & natural weapon' }),
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'oath', oathRule: 'Unarmored, No Shield & Light Load', onBreak: 'suppress', kids: [
            BLK('stat', { targets: ['ac.total', 'ac.touch', 'ac.flatFooted'], mode: 'stat', stat: 'wisMod', mult: 1, value: 0, btype: 'Untyped' }),
            BLK('stat', { targets: ['ac.total', 'ac.touch', 'ac.flatFooted'], mode: 'perCL', value: 1, per: 5, min: 0, max: 4, btype: 'Untyped' }),
            BLK('stat', { targets: ['speed.land'], mode: 'perCL', value: 10, per: 3, min: 0, max: 60, btype: 'Enhancement' })
          ] })
        ] }),
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'levelTier', condText: 'Monk Lvl 1–4', kids: [
            BLK('attack', { attackMode: 'extra', extraKind: 'flurry', count: 1, penalty: -2, rider: 'Special Monk Weapons' })
          ] }),
          blankBranch({ condKind: 'levelTier', condText: 'Monk Lvl 5–8', kids: [
            BLK('attack', { attackMode: 'extra', extraKind: 'flurry', count: 1, penalty: -1, rider: 'Special Monk Weapons' }),
            BLK('attack', { attackMode: 'strikeBypass', appliesToWeapon: 'unarmed', enhEquivalent: 0, drBypassList: 'magic' })
          ] }),
          blankBranch({ condKind: 'levelTier', condText: 'Monk Lvl 9–10', kids: [
            BLK('attack', { attackMode: 'extra', extraKind: 'flurry', count: 1, penalty: 0, rider: 'Special Monk Weapons' }),
            BLK('attack', { attackMode: 'strikeBypass', appliesToWeapon: 'unarmed', enhEquivalent: 0, drBypassList: 'magic, lawful' })
          ] }),
          blankBranch({ condKind: 'levelTier', condText: 'Monk Lvl 11+', kids: [
            BLK('attack', { attackMode: 'extra', extraKind: 'flurry', count: 2, penalty: 0, rider: 'Greater Flurry' }),
            BLK('attack', { attackMode: 'strikeBypass', appliesToWeapon: 'unarmed', enhEquivalent: 0, drBypassList: 'magic, lawful, adamantine' })
          ] })
        ] }),
        BLK('when', { flow: 'when', branches: [
          blankBranch({ trigger: 'activate', action: 'Swift', costKind: 'pool', costFormula: '1', poolName: 'Ki Pool', kids: [
            BLK('attack', { attackMode: 'extra', extraKind: 'extraFull', count: 1, rider: '1 round (or +20 ft. Speed / +4 Dodge AC)' })
          ] })
        ] })
      ];
      return e; } },
    { id: 'vow_of_poverty', icon: '✨', label: 'Vow of Poverty (Exalted Feat: Irrevocable Oath, HD 1–20 Scaling, +8/+6/+4/+2 Chosen Abilities & 11 Exalted Feats)', build() {
      const e = blankEntry('feat');
      Object.assign(e, {
        name: 'Vow of Poverty', featKind: 'feat', source: 'Book of Exalted Deeds p.29–31', tags: ['#Exalted'],
        facets: ['identity', 'prereqs', 'effects', 'progression'],
        text: 'Renounce all material wealth and magic items permanently to gain exalted AC, chosen ability enhancements (+8/+6/+4/+2), DR 10/evil, energy resistance, exalted strike, and 11 bonus exalted feats.'
      });
      e.prereqs = [
        { id: uid('p'), alts: [ALT({ kind: 'alignment', align: 'Any Good' })] },
        { id: uid('p'), alts: [ALT({ kind: 'feat', feat: 'Sacred Vow' })] }
      ];
      const p = e.progression;
      Object.assign(p, { mode: 'hd', maxLevel: 20 });
      const ms = (name, type, txt) => FEATURE(name, { kind: 'inline', abilityType: type || 'Ex', text: txt || '' });
      p.levels[0].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain 1 bonus exalted feat at 1st level.'), ms('AC Bonus +4 (Exalted)', 'Ex', '+4 exalted bonus to Armor Class.')];
      p.levels[1].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain a bonus exalted feat.')];
      p.levels[2].features = [ms('AC Bonus +5 (Exalted)', 'Ex', 'Exalted AC bonus improves to +5.'), ms('Endure Elements', 'Ex', 'Immune to harmful effects of hot and cold environments.')];
      p.levels[3].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain a bonus exalted feat.'), ms('Exalted Strike +1 (Magic)', 'Su', 'Wielded simple weapons and natural/unarmed attacks gain +1 enhancement and bypass DR/magic.')];
      p.levels[4].features = [ms('DR 5/magic', 'Su', 'Gain damage reduction 5/magic.'), ms('Sustenance', 'Ex', 'No longer need to eat or drink.')];
      p.levels[5].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain a bonus exalted feat.'), ms('AC Bonus +6 (Exalted)', 'Ex', 'Exalted AC bonus improves to +6.'), ms('Deflection +1', 'Su', '+1 deflection bonus to AC.')];
      p.levels[6].features = [ms('Ability Score Enhancement +2', 'Ex', '+2 enhancement bonus to one chosen ability score.'), ms('Resistance +1', 'Ex', '+1 resistance bonus on all saving throws.'), ms('Mind Shielding', 'Ex', 'Immune to detect thoughts, discern lies, and alignment detection.')];
      p.levels[7].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain a bonus exalted feat.'), ms('Natural Armor +1', 'Ex', '+1 natural armor bonus to AC.')];
      p.levels[8].features = [ms('AC Bonus +7 (Exalted)', 'Ex', 'Exalted AC bonus improves to +7.')];
      p.levels[9].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain a bonus exalted feat.'), ms('Exalted Strike +2 (Good)', 'Su', '+2 enhancement bonus and attacks count as good-aligned.'), ms('DR 5/evil', 'Su', 'Damage reduction improves to 5/evil.')];
      p.levels[10].features = [ms('Ability Score Enhancement +4/+2', 'Ex', 'Primary chosen ability rises to +4; second chosen ability gains +2.')];
      p.levels[11].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain a bonus exalted feat.'), ms('AC Bonus +8 (Exalted)', 'Ex', 'Exalted AC bonus improves to +8.'), ms('Deflection +2', 'Su', 'Deflection bonus to AC rises to +2.'), ms('Greater Sustenance', 'Ex', 'No longer need to breathe.')];
      p.levels[12].features = [ms('Energy Resistance 5 (All 5)', 'Ex', 'Resistance 5 to acid, cold, electricity, fire, and sonic.'), ms('Resistance +2', 'Ex', 'Resistance bonus on all saves rises to +2.')];
      p.levels[13].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain a bonus exalted feat.'), ms('Freedom of Movement', 'Ex', 'Continuous freedom of movement.'), ms('Exalted Strike +3', 'Su', '+3 enhancement bonus on attacks and damage.')];
      p.levels[14].features = [ms('Ability Score Enhancement +6/+4/+2', 'Ex', 'Chosen abilities rise to +6/+4/+2.'), ms('AC Bonus +9 (Exalted)', 'Ex', 'Exalted AC bonus improves to +9.'), ms('DR 10/evil', 'Su', 'Damage reduction improves to 10/evil.')];
      p.levels[15].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain a bonus exalted feat.'), ms('Natural Armor +2', 'Ex', 'Natural armor bonus rises to +2.')];
      p.levels[16].features = [ms('Regeneration', 'Ex', 'Heal 1 HP per hour per character level and resist nonlethal damage.'), ms('Resistance +3', 'Ex', 'Resistance bonus on all saves rises to +3.'), ms('Exalted Strike +4', 'Su', '+4 enhancement bonus on attacks and damage.')];
      p.levels[17].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain a bonus exalted feat.'), ms('AC Bonus +10 (Exalted)', 'Ex', 'Exalted AC bonus improves to +10.'), ms('Deflection +3', 'Su', 'Deflection bonus to AC rises to +3.'), ms('True Seeing', 'Su', 'Continuous true seeing.')];
      p.levels[18].features = [ms('Ability Score Enhancement +8/+6/+4/+2', 'Ex', 'Four distinct chosen abilities reach +8, +6, +4, and +2 enhancement bonuses.'), ms('DR 10/evil', 'Su', 'Maintain DR 10/evil.')];
      p.levels[19].features = [ms('Bonus Exalted Feat', 'Ex', 'Gain 11th bonus exalted feat.'), ms('Exalted Strike +5 (Magic, Good)', 'Su', '+5 enhancement bonus and bypasses DR/magic and good.'), ms('Energy Resistance 15 (All 5)', 'Ex', 'Energy resistance rises to 15 against all five energy types.')];
      e.effects = [
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'oath', oathRule: 'Zero Magic Items & Simple Non-MW Gear Only', onBreak: 'irrevocable', kids: [
            BLK('stat', { targets: ['ac.total'], mode: 'perCL', value: 1, per: 3, min: 4, max: 10, btype: 'Exalted' }),
            BLK('stat', { targets: ['ac.deflection'], mode: 'perCL', value: 1, per: 6, min: 0, max: 3, btype: 'Deflection' }),
            BLK('stat', { targets: ['ac.natural'], mode: 'perCL', value: 1, per: 8, min: 0, max: 2, btype: 'Natural Armor' }),
            BLK('stat', { targets: ['save.all'], mode: 'perCL', value: 1, per: 6, min: 0, max: 3, btype: 'Resistance' }),
            BLK('stat', { targets: ['choice.ability.1'], mode: 'flat', value: 8, btype: 'Enhancement', condition: 'Progressive L7/L11/L15/L19' }),
            BLK('stat', { targets: ['choice.ability.2'], mode: 'flat', value: 6, btype: 'Enhancement', condition: 'Progressive L7/L11/L15/L19' }),
            BLK('stat', { targets: ['choice.ability.3'], mode: 'flat', value: 4, btype: 'Enhancement', condition: 'Progressive L7/L11/L15/L19' }),
            BLK('stat', { targets: ['choice.ability.4'], mode: 'flat', value: 2, btype: 'Enhancement', condition: 'Progressive L7/L11/L15/L19' }),
            BLK('attack', { attackMode: 'strikeBypass', appliesToWeapon: 'wieldedSimple', enhEquivalent: 5, drBypassList: 'magic, good' }),
            BLK('defense', { mode: 'DR', value: 10, what: 'evil' }),
            BLK('defense', { mode: 'Energy Resistance', value: 15, what: 'Acid, Cold, Electricity, Fire, Sonic' }),
            BLK('effect', { effectKind: 'grantFeat', featOrPool: '#Exalted', floatingDaily: false })
          ] })
        ] })
      ];
      return e; } },
    { id: 'vow_of_peace', icon: '🛡️', label: 'Vow of Peace (Exalted Feat: Calming Aura, +2 Exalted/Deflection/Nat AC & Manufactured Weapons Shatter on Hit)', build() {
      const e = blankEntry('feat');
      Object.assign(e, {
        name: 'Vow of Peace', featKind: 'feat', source: 'Book of Exalted Deeds p.48', tags: ['#Exalted'],
        text: 'Project a continuous 20-ft. calming aura, gain +2 exalted, +2 deflection, and +2 natural armor bonuses to AC, and shatter manufactured weapons that strike you.'
      });
      e.prereqs = [
        { id: uid('p'), alts: [ALT({ kind: 'alignment', align: 'Any Good' })] },
        { id: uid('p'), alts: [ALT({ kind: 'feat', feat: 'Sacred Vow' })] },
        { id: uid('p'), alts: [ALT({ kind: 'feat', feat: 'Vow of Nonviolence' })] }
      ];
      e.effects = [
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'oath', oathRule: 'Never Harm Living Creature / Nonlethal Only', onBreak: 'atonement', kids: [
            BLK('stat', { targets: ['ac.total'], mode: 'flat', value: 2, btype: 'Exalted' }),
            BLK('stat', { targets: ['ac.deflection'], mode: 'flat', value: 2, btype: 'Deflection' }),
            BLK('stat', { targets: ['ac.natural'], mode: 'flat', value: 2, btype: 'Natural Armor' }),
            BLK('effect', { effectKind: 'rule', text: 'Continuous 20-ft. Calming Aura (Calm Emotions, Will DC 10 + ½ HD + CHA negates).' })
          ] })
        ] }),
        BLK('when', { flow: 'when', branches: [
          blankBranch({ trigger: 'meleeStruck', costKind: 'none', kids: [
            BLK('effect', { effectKind: 'rule', text: 'Striking manufactured weapon must succeed on Fortitude DC 10 + ½ HD + CON or shatter harmlessly without dealing damage.' })
          ] })
        ] })
      ];
      return e; } },
    { id: 'shadowweave_ring', icon: '🔮', label: 'Ring of Shadowweave Mastery (Illusion Save DC +2 & Passive +1 Effective Spell Level without Higher Slot)', build() {
      const e = blankEntry('wondrous');
      Object.assign(e, {
        name: 'Ring of Shadowweave Mastery', source: 'Homebrew (Shadow Adept / Illusionist)', tags: ['#Arcane'],
        text: 'An obsidian band threaded with living shadow. Bolsters Illusion saving throw DCs by +2 and treats Illusion (Shadow) spells as 1 spell level higher for Save DC, Globe of Invulnerability, and dispel checks without using a higher-level slot.'
      });
      Object.assign(e.item, { subtype: 'Ring', slot: 'Ring', consumable: false, price: 24000, cl: 11 });
      e.effects = [
        BLK('stat', { targets: ['spell.dc'], mode: 'flat', value: 2, btype: 'Insight', condition: 'Illusion spells' }),
        BLK('stat', { targets: ['casterLevel'], mode: 'flat', value: 1, btype: 'Competence', condition: 'Illusion spells' }),
        BLK('carrier', { carrierMode: 'metamagic', costMode: 'passive', transform: 'heighten', dcBonus: 1, appliesTo: 'Illusion (Shadow) spells' })
      ];
      return e; } },
    { id: 'aegis_fang_relic', icon: '⚔️', label: 'Aegis-Fang, Twin-Aspect Relic (Branching Lvl 5 Offense/Defense Choice → Lvl 10 Tier-2 Path Evolution)', build() {
      const e = blankEntry('weapon');
      Object.assign(e, {
        name: 'Aegis-Fang, Twin-Aspect Relic', source: 'Weapons of Legacy (Branching Relic)', tags: ['#Relic', '#Weapon'],
        facets: ['identity', 'chassis', 'effects', 'progression'],
        text: 'Ancient mithral longsword that awakens along one of two mutually exclusive paths at 5th level (Offense or Defense), unlocking a specialized second-tier evolution at 10th level.'
      });
      e.chassis = blankChassis('weapon', 'longsword');
      Object.assign(e.chassis, { material: 'mithral', enhancement: 1 });
      const p = e.progression;
      Object.assign(p, { mode: 'legacy', maxLevel: 10 });
      const ms = (name, type, path, txt) => FEATURE(name, { kind: 'inline', abilityType: type || 'Su', branchPath: path || '', text: txt || '' });
      p.levels[0].features = [ms('Awakened Steel', 'Ex', '', 'The blade bonds with its wielder, resonating with latent solar and bastion runes.')];
      p.levels[4].features = [
        ms('Blazing Rend', 'Su', 'Offense', 'Offense Path (Lvl 5): Melee strikes deal +2d6 fire damage.'),
        ms('Bastion Ward', 'Su', 'Defense', 'Defense Path (Lvl 5): Gain +2 shield enhancement bonus to AC and DR 3/magic.')
      ];
      p.levels[9].features = [
        ms('Solar Execution', 'Su', 'Offense', 'Offense Path (Lvl 10): Gain 1 extra attack at full BAB on a Full Attack and +2 morale bonus on melee attack rolls.'),
        ms('Immortal Bulwark', 'Su', 'Defense', 'Defense Path (Lvl 10): Gain Spell Resistance 10 + character level and +3 sacred bonus on all saving throws.')
      ];
      e.effects = [
        BLK('resource', { name: 'Relic Aspect', varKey: 'relic_aspect', resMode: 'choice', choiceUnlockLvl: 5, choiceOptions: 'Offense, Defense', defaultChoice: 'Offense' }),
        BLK('when', { flow: 'while', branches: [
          blankBranch({ condKind: 'choicePath', choiceVar: 'relic_aspect', choiceVal: 'Offense', minLvl: 5, kids: [
            BLK('roll', { kind: 'Damage', count: 2, die: 'd6', dmgType: 'Fire', crit: 'normal' })
          ] }),
          blankBranch({ condKind: 'choicePath', choiceVar: 'relic_aspect', choiceVal: 'Defense', minLvl: 5, kids: [
            BLK('stat', { targets: ['ac.shield'], mode: 'flat', value: 2, btype: 'Shield Enhancement' }),
            BLK('defense', { mode: 'DR', value: 3, what: 'magic' })
          ] }),
          blankBranch({ condKind: 'choicePath', choiceVar: 'relic_aspect', choiceVal: 'Offense', minLvl: 10, kids: [
            BLK('attack', { attackMode: 'extra', extraKind: 'extraFull', count: 1, rider: 'Solar Execution' }),
            BLK('stat', { targets: ['atk.melee'], mode: 'flat', value: 2, btype: 'Morale' })
          ] }),
          blankBranch({ condKind: 'choicePath', choiceVar: 'relic_aspect', choiceVal: 'Defense', minLvl: 10, kids: [
            BLK('defense', { mode: 'Spell Resistance', srMode: 'level', value: 15 }),
            BLK('stat', { targets: ['save.all'], mode: 'flat', value: 3, btype: 'Sacred' })
          ] })
        ] })
      ];
      return e; } }
  ];

  // --------------------------------------------------------------------------
  // 5. App state & persistence
  // --------------------------------------------------------------------------
  const IS_EMBED = typeof window !== 'undefined' && typeof window.location === 'object' && new URLSearchParams(window.location.search).get('embed') === '1';
  const LS_KEY = 'forgeSandbox.v3';
  function loadLS() { try { return JSON.parse(window.localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveLS() {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify({ templates: S.templates, livingTags: S.livingTags, customBonusTypes: S.customBonusTypes, customItemMods: S.customItemMods, customPools: S.customPools, customSkills: S.customSkills, house: S.house })); } catch (e) { /* storage unavailable on some file:// contexts */ }
  }
  const persisted = loadLS();
  const S = {
    entry: blankEntry('weapon'),
    activePreset: '',
    embed: { context: {}, originalId: '', saveScope: 'character' },
    templates: Array.isArray(persisted.templates) ? persisted.templates : [],
    livingTags: Array.isArray(persisted.livingTags) ? persisted.livingTags : [],
    customBonusTypes: Array.isArray(persisted.customBonusTypes) ? persisted.customBonusTypes : [],
    customItemMods: Array.isArray(persisted.customItemMods) ? persisted.customItemMods : [],
    customPools: Array.isArray(persisted.customPools) ? persisted.customPools : [],
    customSkills: Array.isArray(persisted.customSkills) ? persisted.customSkills : [],
    house: { critCap: 0 },
    spot: null,
    history: { past: [], future: [], lastPath: '', lastTs: 0 },
    ui: {
      liveOpenMobile: false, liveWasScrolled: false, liveUserOverride: null, progHideEmpty: false, facetOpen: {}, cardOpen: {}, jsonOpen: false, importOpen: false, importText: '', tplSaveOpen: false, newTplName: '', houseOpen: false,
      customSkillOpen: false, customSkill: { name: '', ability: 'cha', trainedOnly: true, acp: false },
      craftOpen: false, craftText: '', craftBusy: false, craftStatus: '', craftNeedKey: false, craftApiKey: '', guideOpen: false,
      prevOpen: true, prevArch: 'fighter', prevLvl: 5, prevCharge: false, prevFlank: false
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
  const V2_TARGET_ALIASES = {
    'ability.str': 'str', 'ability.dex': 'dex', 'ability.con': 'con', 'ability.int': 'int', 'ability.wis': 'wis', 'ability.cha': 'cha',
    'ac': 'ac.total', 'ac.all': 'ac.total', 'ac.naturalarmor': 'ac.natural',
    'attack': 'atk.all', 'attack.all': 'atk.all', 'attack.weapon': 'atk.all', 'attack.melee': 'atk.melee', 'attack.ranged': 'atk.ranged',
    'damage': 'dmg.all', 'damage.all': 'dmg.all', 'damage.weapon': 'dmg.all', 'damage.melee': 'dmg.melee', 'damage.ranged': 'dmg.all',
    'saves': 'save.all', 'saves.all': 'save.all', 'saves.fort': 'save.fort', 'saves.ref': 'save.ref', 'saves.will': 'save.will',
    'skills': 'skill.all', 'skills.all': 'skill.all', 'skill.knowledge_all': 'skill.knowledge', 'skill.wilderness_lore': 'skill.survival',
    'init': 'initiative', 'speed': 'speed.land', 'speed.all': 'speed.land', 'speed.base': 'speed.land', 'cmb': 'grapple'
  };
  function normTargetKey(k) {
    const raw = String(k || '').trim();
    if (!raw) return 'atk.all';
    const low = raw.toLowerCase();
    if (V2_TARGET_ALIASES[low]) return V2_TARGET_ALIASES[low];
    if (TARGET_LABEL[raw]) return raw;
    if (TARGET_LABEL[low]) return low;
    return raw;
  }
  function targetLabel(k) {
    const nk = normTargetKey(k);
    if (TARGET_LABEL[nk]) return TARGET_LABEL[nk];
    const c = (S.customSkills || []).find((x) => x.id === nk || x.id === k);
    if (c) return c.name;
    const skSub = String(nk).match(/^skill\.(craft|knowledge|perform|profession)_(.+)$/i);
    if (skSub) return cap1(skSub[1].toLowerCase()) + ' (' + skSub[2].replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()) + ')';
    const skAny = String(nk).match(/^skill\.(.+)$/i);
    if (skAny) return skAny[1].replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
    const clSub = String(nk).match(/^casterlevel\.(.+)$/i);
    if (clSub) return 'Caster Level (' + cap1(clSub[1]) + ')';
    if (nk === 'hp.max') return 'Max Hit Points';
    if (nk === 'speed.fly') return 'Fly Speed (ft.)';
    if (nk === 'speed.swim') return 'Swim Speed (ft.)';
    if (nk === 'speed.climb') return 'Climb Speed (ft.)';
    return k;
  }
  function entryResourceBlocks(en) {
    return ((en && en.effects) || []).filter((b) => b && b.type === 'resource');
  }
  function allPools() {
    const base = ['Arcane Pool', 'Turn Undead', 'Rebuke Undead', 'Ki Pool', 'Ki', 'Bardic Music', 'Wild Shape', 'Psionic Power Points', 'Essentia', 'Bloodrage Rounds'];
    const seen = new Set(base);
    const out = base.slice();
    const add = (n) => { const s = String(n || '').trim(); if (s && !seen.has(s)) { seen.add(s); out.push(s); } };
    (S.customPools || []).forEach(add);
    entryResourceBlocks(S.entry).forEach((b) => add(b.name));
    return out;
  }
  // Authoring tokens / functions come from the engine (single source of truth), never a hand-kept list.
  const fxVars = () => (window.RuleEngine && Array.isArray(window.RuleEngine.FORMULA_VARS) ? window.RuleEngine.FORMULA_VARS : []);
  const fxFuncs = () => (window.RuleEngine && Array.isArray(window.RuleEngine.FORMULA_FUNCS) ? window.RuleEngine.FORMULA_FUNCS : []);
  function statFormulaOpts(en) {
    // Pattern rows (@<class>Level, @skill.<key>.total ...) are templates for the Formula Reference panel, not selectable tokens.
    const base = fxVars().filter((v) => !v.pattern).map((v) => { const k = String(v.token || '').replace(/^@/, ''); return [k, '@' + k + (v.label ? ' (' + v.label + ')' : '')]; }).filter((x) => x[0]);
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
    const all = fxVars().filter((v) => !v.pattern);
    const runtime = all.filter((v) => /resource|variable|runtime|feature|state|pool|dial/i.test(v.group || ''));
    (runtime.length ? runtime : all).forEach((v) => {
      const k = String(v.token || '').replace(/^@/, '');
      if (k && !seen.has(k)) { seen.add(k); out.push([k, '@' + k + (v.label ? ' (' + v.label + ')' : '')]); }
    });
    return out;
  }
  function entryChoiceBlocks(en) {
    return entryResourceBlocks(en || S.entry).filter((b) => b.resMode === 'choice');
  }
  function entryChoiceOptions(en) {
    const seen = new Set();
    const out = [];
    entryChoiceBlocks(en).forEach((b) => {
      String(b.choiceOptions || '').split(',').map((s) => s.trim()).filter(Boolean).forEach((o) => {
        if (!seen.has(o)) { seen.add(o); out.push(o); }
      });
    });
    ['Offense', 'Defense', 'Utility'].forEach((o) => { if (!seen.has(o)) { seen.add(o); out.push(o); } });
    return out;
  }
  function choiceVarOpts(en) {
    const out = [];
    const seen = new Set();
    entryChoiceBlocks(en).forEach((b) => {
      const k = b.varKey || slug(b.name || 'path');
      if (k && !seen.has(k)) { seen.add(k); out.push([k, '@' + k + ' (' + (b.name || k) + ')']); }
    });
    [['combat_path', '@combat_path'], ['relic_aspect', '@relic_aspect']].forEach((x) => {
      if (!seen.has(x[0])) { seen.add(x[0]); out.push(x); }
    });
    return out;
  }

  const baseName = (b) => String((b && b.name) || '').replace(/\s*\(.*\)$/, '');
  // Single applicability rule lives in SrdCompendium.enhancementApplies (DB records carry appliesTo). Only user-registered
  // custom item mods (localStorage, no DB record) carry their own `on` slot.
  function enchApplies(e, kind) {
    if (!e) return false;
    if (e.raw) return !!window.SrdCompendium.enhancementApplies(e.raw, kind);
    return e.on === kind || (e.on === 'armor+shield' && kind !== 'weapon');
  }
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
        critText: fmt(low) + (capped ? ' (Capped by House Rule)' : ''), rawCritText: fmt(rawLow), rangeText: num(w.range) > 0 ? num(w.range) + ' ft.' : '',
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
      let bash = null;
      if (kind === 'shield') {
        const bw = ch.weapon || shieldBashDefaults(base);
        const canBash = bw.canBash !== false;
        const bSize = Math.max(1, 21 - num(bw.critRange, 20));
        const bCapAt = num(S.house.critCap);
        const bRawLow = 21 - bSize;
        const bCapped = bCapAt > 0 && bRawLow < bCapAt;
        const bLow = bCapped ? bCapAt : bRawLow;
        const bMult = customMat && num(customMat.critMultOverride) >= 2 ? num(customMat.critMultOverride) : Math.max(2, num(bw.critMult, 2));
        const bFmt = (lo) => (lo < 20 ? lo + '–20' : '20') + '/×' + bMult;
        bash = {
          canBash: canBash,
          dice: bw.dice || '1d4',
          dmgType: bw.dmgType || 'Bludgeoning',
          handed: bw.handed === 'Light' ? 'Light' : 'One-Handed',
          critRange: num(bw.critRange, 20),
          critLow: bLow,
          capped: bCapped,
          critMult: bMult,
          critText: bFmt(bLow) + (bCapped ? ' (Capped by House Rule)' : ''),
          range: Math.max(0, num(bw.range, 0))
        };
      }
      Object.assign(view, { armor: { type: type, armorBonus: num(a.armorBonus), maxDex: maxDex, acp: acp, asf: asf, speed: speed }, sr: sr, bash: bash });
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
        else if (v.bash && v.bash.canBash) seg.push('Bash ' + v.bash.dice + ' ' + v.bash.dmgType + ' (' + v.bash.critText + (v.bash.range > 0 ? ', ' + v.bash.range + ' ft.' : '') + ')');
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
      const branchSet = new Set();
      p.levels.slice(0, p.maxLevel).forEach((l) => l.features.forEach((f) => { if (f.branchPath) branchSet.add(f.branchPath); }));
      const branchInfo = branchSet.size ? ' • ' + branchSet.size + ' branching paths (' + Array.from(branchSet).join(' / ') + ')' : '';
      if (p.mode === 'hd' || p.mode === 'legacy') {
        const mc = p.levels.slice(0, p.maxLevel).reduce((acc, l) => acc + l.features.length, 0);
        seg.push((p.mode === 'hd' ? 'HD Scaling' : 'Legacy Rituals') + ' (1–' + p.maxLevel + ' • ' + mc + ' milestone feature' + (mc === 1 ? '' : 's') + branchInfo + ')');
      } else {
        const spellLv = p.levels.slice(0, p.maxLevel).filter((l) => l.spell).length;
        seg.push('d' + p.hitDie + ' HD • ' + (p.bab === 'full' ? 'Full' : p.bab) + ' BAB • Good ' + (['fort', 'ref', 'will'].filter((s) => p.good[s]).map((s) => ({ fort: 'Fortitude', ref: 'Reflex', will: 'Will' }[s])).join('/') || 'none') + ' • ' + p.skillPts + ' + Int skill points • ' + p.maxLevel + ' levels' + (spellLv ? ' • +1 Spellcasting ×' + spellLv : '') + branchInfo);
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
    if (en.blueprint === 'monster') {
      const m = en.monster;
      const nonSet = new Set(m.nonabilities || []);
      const hdStr = num(m.hdCount, 1) + 'd' + num(m.hdDie, 8) + (num(m.hdBonus) ? sgn(num(m.hdBonus)) : '');
      seg.push('CR ' + (m.cr || '1') + ' • ' + m.size + ' ' + m.creatureType + (m.subtypes ? ' (' + m.subtypes + ')' : ''));
      seg.push('HD ' + hdStr + ' (' + num(m.hp, 1) + ' HP)');
      seg.push('AC ' + num(m.ac.total, 10) + ' (Touch ' + num(m.ac.touch, 10) + ', Flat-Footed ' + num(m.ac.flatFooted, 10) + ', Nat +' + num(m.ac.naturalArmor, 0) + ')');
      seg.push('Speed ' + num(m.speeds.land, 30) + ' ft.' + (num(m.speeds.fly) > 0 ? ', Fly ' + num(m.speeds.fly) + ' ft. (' + (m.speeds.flyMan || 'Average') + ')' : ''));
      seg.push(['str', 'dex', 'con', 'int', 'wis', 'cha'].map((k) => k.toUpperCase() + ' ' + (nonSet.has(k) ? '—' : num(m.abilities[k], 10))).join(' '));
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
    if (en.blueprint === 'monster') {
      const m = en.monster;
      pills.push(['amber', '🛡️ Saves Fort ' + sgn(num(m.saves.fort)) + ' / Ref ' + sgn(num(m.saves.ref)) + ' / Will ' + sgn(num(m.saves.will))]);
      pills.push(['sky', '⚔️ BAB ' + sgn(num(m.bab)) + ' • Grapple ' + sgn(num(m.grapple))]);
      if ((m.nonabilities || []).length) pills.push(['dim', '∅ Nonabilities: ' + m.nonabilities.map((k) => k.toUpperCase()).join(', ')]);
      (m.attacks || []).slice(0, 4).forEach((a) => pills.push(['rose', '⚔️ ' + a.name + ' ' + sgn(num(a.bonus)) + ' (' + (a.damage || '1d6') + ')']));
      if ((m.feats || []).length) pills.push(['indigo', '📜 ' + m.feats.length + ' Feats']);
      if ((m.specialAbilities || []).length) pills.push(['purple', '✨ ' + m.specialAbilities.length + ' Special Abilities']);
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
  function rollBaseExpr(b) {
    const cnt = num(b.count, 1), die = String(b.die || 'd6'), flatBonus = die === 'flat' ? 0 : num(b.flat, 0);
    const baseRaw = die === 'flat' ? (cnt > 0 ? String(cnt) : '') : (/^\d+d\d+$/.test(die) ? die : (cnt > 0 ? cnt + die : ''));
    return baseRaw && flatBonus ? (baseRaw + (flatBonus > 0 ? ' + ' + flatBonus : ' - ' + Math.abs(flatBonus))) : (baseRaw || (flatBonus ? String(flatBonus) : ''));
  }
  function rollPerCLExpr(b) {
    const per = Math.max(1, num(b.per, 1)), amt = num(b.amount, 1), mx = Math.max(1, num(b.max, 10));
    return per === 1
      ? (amt === 1 ? 'min(' + mx + ', @cl)' : 'min(' + mx + ', @cl * ' + amt + ')')
      : 'min(' + mx + ', floor(@cl / ' + per + ') * ' + amt + ')';
  }
  function seedStatFormula(b, prevMode) {
    const pm = prevMode || 'flat';
    if (pm === 'stat') return exportModFormula(b);
    if (pm === 'perCL') return exportPerCLFormula(b);
    if (pm === 'replaceStat') return swapSourceFormula(b.toStat || 'wis');
    return String(num(b.value, 0));
  }
  function seedRollFormula(b, prevScaling) {
    const base = rollBaseExpr(b);
    if (prevScaling === 'perCL') return base ? base + ' + ' + rollPerCLExpr(b) : rollPerCLExpr(b);
    return base;
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
  const SRC_STRIP_KEYS = new Set(['id', 'summary', 'effects', 'kids', 'branches', 'rows', 'scope', 'gainedAt', '_src', '_srcType', '_srcSub']);
  function activeBlockSub(b) {
    if (!b) return '';
    if (b.type === 'stat') return modMode(b);
    if (b.type === 'effect') return b.effectKind || ((b.flag || b.ruleFlag) ? 'ruleSwitch' : 'rule');
    if (b.type === 'attack') return b.attackMode || 'natural';
    if (b.type === 'defense') return b.mode || 'Immunity';
    if (b.type === 'carrier') return b.carrierMode || 'meleeChannel';
    if (b.type === 'resource') return b.resMode || 'spend';
    if (b.type === 'when') return b.flow === 'when' ? 'if' : (b.flow || 'while');
    if (b.type === 'roll') return (b.kind || 'Damage') + '|' + (b.scaling || 'flat');
    return '';
  }
  function copyDefined(src, dst, keys) {
    keys.forEach((k) => { if (src[k] !== undefined && src[k] !== null && src[k] !== '') dst[k] = clone(src[k]); });
  }
  function copyExact(src, dst, keys) {
    keys.forEach((k) => { if (src[k] !== undefined) dst[k] = clone(src[k]); });
  }
  function mergeAuthoredSrc(src, dst) {
    if (!src || typeof src !== 'object') return;
    Object.keys(src).forEach((k) => {
      if (SRC_STRIP_KEYS.has(k)) return;
      if (dst[k] === undefined) dst[k] = clone(src[k]);
    });
  }
  function projectSubtypeExtras(b, dst) {
    if (b.type === 'stat' && modMode(b) === 'stat') {
      copyDefined(b, dst, ['stat']);
      if (num(b.mult, 1) !== 1) copyExact(b, dst, ['mult']);
    } else if (b.type === 'roll') {
      if (b.scaling === 'perCL' && num(b.start, 1) !== 1) copyExact(b, dst, ['start']);
      if (b.scaling === 'perVar') copyDefined(b, dst, ['varMode']);
      if (b.crit && b.crit !== 'normal') copyDefined(b, dst, ['crit']);
    } else if (b.type === 'attack') {
      const am = b.attackMode || 'natural';
      if (am === 'extra') copyDefined(b, dst, ['extraKind']);
      else if (am === 'unarmedDie') {
        copyDefined(b, dst, ['unarmedProgression']);
        if ((b.unarmedProgression || 'monk') !== 'fixed') copyExact(b, dst, ['effLvlBonus']);
      } else if (am === 'strikeBypass') copyExact(b, dst, ['appliesToWeapon', 'enhEquivalent', 'drBypassList']);
      else if (am === 'weaponImbue') copyDefined(b, dst, ['duration', 'budgetScaling', 'maxBudget', 'allowedEnchs']);
    } else if (b.type === 'resource') {
      const rm = b.resMode || 'spend';
      if (rm === 'choice') copyExact(b, dst, ['choiceUnlockLvl', 'defaultChoice', 'choiceOptions']);
      else if (rm === 'invest') copyDefined(b, dst, ['capMode']);
      else if (rm === 'dial') {
        copyDefined(b, dst, ['dialCost']);
        if (b.dialCost === 'pool') copyDefined(b, dst, ['costPool']);
      }
    } else if (b.type === 'carrier') {
      const cm = b.carrierMode || 'meleeChannel';
      if (cm === 'meleeChannel') {
        copyDefined(b, dst, ['channelStyle']);
        if ((b.channelStyle || 'spellstrikeFree') !== 'spellStoring') copyExact(b, dst, ['critRule', 'holdCharge']);
      } else if (cm === 'fullAttackCast') copyExact(b, dst, ['atkPenalty', 'offHandFree']);
      else if (cm === 'metamagic') {
        if (b.transform === 'heighten') copyExact(b, dst, ['dcBonus']);
        if (b.transform === 'rider') copyDefined(b, dst, ['rider']);
        if (b.costMode === 'slot') copyExact(b, dst, ['slotAdj']);
        else if (b.costMode === 'rod' || b.costMode === 'sudden') copyExact(b, dst, ['uses']);
        else if (b.costMode === 'pool') copyExact(b, dst, ['poolCost', 'pool']);
        copyDefined(b, dst, ['appliesTo']);
      }
    } else if (b.type === 'effect' && !isPreservedEffectBlock(b)) {
      const ek = b.effectKind || ((b.flag || b.ruleFlag) ? 'ruleSwitch' : 'rule');
      if (ek === 'castSpell') {
        const cm = b.castMode || 'linkedSpell';
        copyDefined(b, dst, ['castMode']);
        if (cm === 'linkedSpell') copyDefined(b, dst, ['spellName']);
        else if (cm === 'ownSlotUpTo') copyExact(b, dst, ['maxSpellLvl']);
        else copyDefined(b, dst, ['spellOptions']);
        copyExact(b, dst, ['tiedDuration']);
      } else if (ek === 'recoverSlot') copyExact(b, dst, ['maxSpellLvl', 'targetPoolOrClass']);
      else if (ek === 'stealStore') copyDefined(b, dst, ['maxLvlFormula', 'bufferVar']);
      else if (ek === 'grantFeat') {
        copyDefined(b, dst, ['featOrPool']);
        copyExact(b, dst, ['floatingDaily']);
      } else if (ek === 'castEvolution') copyDefined(b, dst, ['castNature']);
    }
  }
  function exportWhenBranch(flow, br) {
    const bo = {};
    if (flow === 'while' || (br._src && br._src.condKind && !br._src.trigger && flow === 'if')) {
      const ck = br.condKind || 'state';
      bo.condKind = ck;
      if (ck === 'choicePath') {
        if (br.condText) bo.condText = String(br.condText);
        copyExact(br, bo, ['minLvl', 'choiceVar', 'choiceVal']);
      } else if (ck === 'oath') {
        if (br.condText) bo.condText = String(br.condText);
        copyDefined(br, bo, ['onBreak', 'oathRule']);
      } else {
        bo.condText = String(br.condText == null ? '' : br.condText);
      }
      if (br._src && br._src.condKind === ck) mergeAuthoredSrc(br._src, bo);
    } else {
      const trig = br.trigger || 'activate';
      const costK = br.costKind || 'none';
      bo.condKind = br.condKind || 'activation';
      bo.condText = String(br.condText == null ? '' : br.condText);
      copyDefined(br, bo, ['trigger']);
      if (trig === 'activate') copyDefined(br, bo, ['action']);
      if (trig === 'enterState' || trig === 'castSpell') copyDefined(br, bo, ['targetText']);
      copyDefined(br, bo, ['costKind']);
      if (costK === 'pool') copyDefined(br, bo, ['costFormula', 'poolName']);
      else if (costK === 'forgoSA' || costK === 'perDay') copyExact(br, bo, ['costVal']);
      else if (costK === 'skillCheck') copyDefined(br, bo, ['checkFormula']);
      else if (costK === 'cooldown') copyDefined(br, bo, ['cooldownText']);
      if (br._src && br._src.trigger === trig) mergeAuthoredSrc(br._src, bo);
    }
    bo.effects = (br.kids || []).map(exportBlock);
    return bo;
  }
  function exportBlock(b) {
    const o = { type: b.type };
    if (b.recipient && (b.recipient !== 'self' || (b._src && b._src.recipient === 'self'))) o.recipient = b.recipient;
    if (b.type === 'stat') {
      const mode = modMode(b);
      o.mode = mode;
      o.btype = b.btype || 'Untyped';
      if (mode === 'replaceStat') {
        const swapTgt = normalizeSwapTargetKey(b.swapTarget || (b.targets && b.targets[0]) || 'atk.melee.abilityMod');
        o.targets = [swapTgt];
        o.swapTarget = swapTgt;
        o.subOp = b.subOp || 'max';
        o.fromStat = b.fromStat || SWAP_DEFAULT_FROM[swapTgt] || 'str';
        o.toStat = b.toStat || 'wis';
        o.swapScope = b.swapScope || b.scope || 'all';
        o.formula = swapSourceFormula(o.toStat);
        const repCap = o.subOp === 'add' ? exportModCap(b) : null;
        if (repCap !== null || (b._src && b._src.cap !== undefined)) o.cap = repCap;
      } else {
        o.targets = clone(b.targets || []);
        if ((o.targets || []).indexOf('size.effective') >= 0) {
          const ap = Array.isArray(b.appliesTo) ? b.appliesTo.slice() : String(b.appliesTo || '').split(',').map((x) => x.trim()).filter(Boolean);
          if (ap.length) o.appliesTo = ap;
        }
        if (b.weaponFilter) o.weaponFilter = String(b.weaponFilter).trim();
        if (mode === 'flat') {
          o.value = num(b.value, 0);
        } else if (mode === 'stat') {
          o.value = num(b.value, 0);
          o.formula = exportModFormula(b);
          const stCap = exportModCap(b);
          if (stCap !== null || (b._src && b._src.cap !== undefined)) o.cap = stCap;
        } else if (mode === 'perCL') {
          o.value = num(b.value, 1);
          o.per = num(b.per, 3);
          o.min = num(b.min, 0);
          o.max = num(b.max, 5);
          o.formula = exportPerCLFormula(b);
        } else if (mode === 'formula') {
          o.formula = String(b.formula || '').trim();
        }
      }
      if (b.condition && typeof b.condition === 'object') {
        o.condition = clone(b.condition);
      } else if (typeof b.condition === 'string' && b.condition.trim()) {
        const cTrim = b.condition.trim();
        o.condition = /^toggle:([A-Za-z0-9_.-]+)$/.test(cTrim) ? { toggle: RegExp.$1 } : cTrim;
      }
    } else if (b.type === 'roll') {
      const sc = b.scaling || 'flat';
      o.kind = b.kind || 'Damage';
      o.scaling = sc;
      if (sc === 'formula') {
        o.dice = String(b.dice || '').trim();
      } else {
        o.count = num(b.count, 0);
        o.die = b.die || 'd6';
        o.flat = b.die === 'flat' ? 0 : num(b.flat, 0);
      }
      if (o.kind === 'Damage' || o.kind === 'Ongoing / Round') o.dmgType = b.dmgType || 'Untyped';
      if (sc === 'perCL') {
        o.amount = num(b.amount, 1);
        o.per = num(b.per, 1);
        o.max = num(b.max, 10);
      } else if (sc === 'perVar') {
        o.varKey = b.varKey || '';
        if (b.varMode === 'flat') o.amount = num(b.amount, 1);
      }
      if (typeof b.save === 'string' && b.save.trim()) o.save = b.save.trim();
      if (b.condition && (typeof b.condition === 'object' || String(b.condition).trim())) o.condition = typeof b.condition === 'string' ? b.condition.trim() : clone(b.condition);
      if (o.kind === 'Temp HP') {
        const baseExpr = rollBaseExpr(b);
        if (sc === 'perCL') {
          const clPart = rollPerCLExpr(b);
          o.tempHpFormula = baseExpr ? (baseExpr + ' + ' + clPart) : clPart;
        } else if (baseExpr) {
          o.tempHpFormula = baseExpr;
        }
      }
    } else if (b.type === 'attack') {
      const am = b.attackMode || 'natural';
      o.attackMode = am;
      if (am === 'natural') {
        o.natKind = b.natKind || 'primary';
        o.count = num(b.count, 1);
        o.weaponName = b.weaponName || '';
        o.dice = b.dice || '';
        o.dmgType = b.dmgType || '';
        if (b.usesHands) o.usesHands = true;
        if (b.rider) o.rider = b.rider;
      } else if (am === 'extra') {
        o.count = num(b.count, 1);
        if (b.extraKind === 'flurry') o.penalty = num(b.penalty, -2);
        if (b.rider) o.rider = b.rider;
      } else if (am === 'unarmedDie') {
        if ((b.unarmedProgression || 'monk') === 'fixed') o.dice = b.dice || '1d6';
        if (b.rider) o.rider = b.rider;
      }
    } else if (b.type === 'defense') {
      const dm = b.mode || 'Immunity';
      o.mode = dm;
      if (isPreservedDefenseBlock(b)) {
        mergeAuthoredSrc(b._src || b, o);
      } else if (dm === 'Size Change') o.steps = num(b.steps, 1);
      else if (dm === 'State Flag') o.flag = b.flag || 'negLevel';
      else if (dm === 'Spell Resistance') {
        o.srMode = b.srMode || 'flat';
        if (o.srMode !== 'level') o.value = defValOut(b.value, 10);
      } else if (dm === 'Concealment %') {
        o.value = defValOut(b.value, 20);
      } else if (dm === 'DR' || dm === 'Energy Resistance') {
        o.value = defValOut(b.value, 0);
        o.what = b.what || '';
      } else {
        o.what = b.what || '';
      }
    } else if (b.type === 'effect') {
      if (isPreservedEffectBlock(b)) {
        mergeAuthoredSrc(b._src || b, o);
        if (b.effectKind) o.effectKind = b.effectKind;
      } else {
        const ek = b.effectKind || ((b.flag || b.ruleFlag) ? 'ruleSwitch' : 'rule');
        o.effectKind = ek;
        if (ek === 'ruleSwitch') o.flag = b.flag || b.ruleFlag || 'noAutoFailFortSaveOnNat1';
        else if (ek === 'proficiency' || ek === 'feat') o.targetId = b.targetId || '';
        else if (ek === 'familiarity') { o.targetId = b.targetId || ''; o.treatAs = b.treatAs || 'martial'; }
        else if (ek === 'rule') o.text = b.text || '';
        if (ek !== 'rule' && b.text) o.text = b.text;
        if (b.label) o.label = b.label;
      }
    } else if (b.type === 'resource') {
      const rm = b.resMode || 'spend';
      o.name = b.name || '';
      o.varKey = b.varKey || (b.name ? slug(b.name) : 'pool');
      o.resMode = rm;
      if (rm === 'dial') {
        o.maxMode = b.maxMode || 'spellLvl';
        if (o.maxMode === 'flat' || (b._src && b._src.max !== undefined)) o.max = num(b.max, 0);
        o.reset = b.reset || 'perDay';
      } else if (rm === 'spend' || rm === 'buffer') {
        o.max = num(b.max, 0);
        o.scaling = b.scaling || 'flat';
        if (['plusMod', 'halfLvlPlusMod', 'twoPerLvlPlusMod'].indexOf(o.scaling) >= 0) o.ability = b.ability || 'int';
        o.reset = b.reset || 'perDay';
      } else if (rm !== 'choice') {
        o.reset = b.reset || 'perDay';
      }
      if (o.reset === 'cooldown' && b.cooldownText) o.cooldownText = b.cooldownText;
    } else if (b.type === 'carrier') {
      const cm = b.carrierMode || 'meleeChannel';
      o.carrierMode = cm;
      if (cm === 'meleeChannel' && (b.channelStyle || 'spellstrikeFree') === 'spellStoring') {
        o.maxSpellLvl = num(b.maxSpellLvl, 3);
      } else if (cm === 'metamagic') {
        o.transform = b.transform || 'empower';
        o.costMode = b.costMode || 'slot';
        if (b.transform === 'energySub' || b.transform === 'pierceRes') o.energy = b.energy || 'Fire';
        if (b.costMode === 'rod' || b.costMode === 'essenceShape') o.maxSpellLvl = num(b.maxSpellLvl, 3);
      }
    } else if (b.type === 'when') {
      const fl = b.flow === 'when' ? 'if' : (b.flow || 'while');
      o.flow = fl;
      o.branches = (b.branches || []).map((br) => exportWhenBranch(fl, br));
    } else if (b.type === 'table') {
      if (b.die) o.die = b.die;
      if (b.key) o.key = b.key;
      o.rows = (b.rows || []).map((r) => ({ roll: String(r.roll || '1'), effects: (r.kids || []).map(exportBlock) }));
    }
    projectSubtypeExtras(b, o);
    if (b._src && b._srcType === b.type && b._srcSub === activeBlockSub(b)) mergeAuthoredSrc(b._src, o);
    o.summary = blockText(b);
    // Race / template progression: only a real later level is kept.
    if (num(b.gainedAt) > 1 && levelTableOn()) o.gainedAt = Math.floor(num(b.gainedAt));
    return o;
  }
  function exportPower(pw) {
    const o = { id: pw.id, kind: pw.kind, name: pw.kind === 'attached' && pw.ref ? pw.ref.name : pw.name, action: pw.action, usage: exportUse(pw.use) };
    if (pw.kind === 'attached') { o.refId = pw.ref ? pw.ref.id : null; o.grantMode = pw.grantMode; }
    if (num(pw.cl)) o.casterLevel = num(pw.cl);
    else if (pw.clFormula) o.casterLevelFormula = String(pw.clFormula); // kept on round trip; no UI field yet
    // Save DC: a plain number exports as saveDC, anything else as dcFormula ("10 + 1/2 HD + Con").
    const dcRaw = String(pw.dcFormula || '').trim() || (num(pw.dc) ? String(num(pw.dc)) : '');
    if (/^\d+$/.test(dcRaw)) o.saveDC = Number(dcRaw);
    else if (dcRaw) o.dcFormula = dcRaw;
    if (pw.spellLevel !== '' && pw.spellLevel !== null && pw.spellLevel !== undefined && Number.isFinite(Number(pw.spellLevel))) o.spellLevel = Number(pw.spellLevel);
    if (num(pw.gainedAt) > 1 && levelTableOn()) o.gainedAt = Math.floor(num(pw.gainedAt));
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
  // modes[] (ADR-056, schema ModeV3). Three kinds of mode share the array:
  //  - weapon-grip modes (handedness / damageDice / ...): never edited here, written back untouched;
  //  - Off modes (no blocks, "Inactive"): hidden, kept as authored, auto-created when an entry has active modes;
  //  - activation modes (Rage, Smite, Bardic ...): edited as Mode cards; id and every key the card does not edit
  //    (`activation`, ...) ride along in `_extra` so a round trip never loses them.
  const WEAPON_MODE_KEYS = ['handedness', 'damageDice', 'dmgType', 'critRange', 'critMult', 'strMult', 'rangeIncrement', 'weapon', 'proficiency'];
  const MODE_EDITED_KEYS = ['id', 'name', 'label', 'combatScope', 'effects', 'blocks'];
  function splitModesV3(raw) {
    const res = { modes: [], off: [], weapon: [] };
    (Array.isArray(raw) ? raw : []).forEach((m) => {
      if (!m || typeof m !== 'object' || Array.isArray(m)) return;
      if (WEAPON_MODE_KEYS.some((k) => m[k] !== undefined)) { res.weapon.push(clone(m)); return; }
      const kids = Array.isArray(m.effects) ? m.effects : (Array.isArray(m.blocks) ? m.blocks : []);
      if (!kids.length) { res.off.push(clone(m)); return; }
      const extra = clone(m);
      MODE_EDITED_KEYS.forEach((k) => { delete extra[k]; });
      res.modes.push({ id: m.id || ('mode-' + uid('m').slice(2)), name: m.name || '', label: m.label || '', combatScope: m.combatScope || '', effects: kids.map(parseBlockV3).filter(Boolean), _extra: extra });
    });
    return res;
  }
  function exportModesV3(en) {
    const edited = (en.modes || []).filter((m) => (m.effects || []).length > 0).map((m, i) => {
      const o = { id: m.id, name: m.name || m.label || ('Mode ' + (i + 1)), label: m.label || m.name || ('Mode ' + (i + 1)) };
      if (m.combatScope) o.combatScope = m.combatScope;
      Object.assign(o, clone(m._extra || {}));
      o.effects = m.effects.map(exportBlock);
      return o;
    });
    const weapon = clone(en._modesWeapon || []);
    if (!edited.length) return weapon; // no active mode left: the Off state goes with it
    const off = (en._modesOff && en._modesOff.length) ? clone(en._modesOff) : [{ id: 'mode-off', name: 'Inactive', label: 'Inactive', effects: [] }];
    return off.concat(edited, weapon);
  }
  const PASSTHROUGH_V3_KEYS = [
    'type', 'category', 'subCategory', 'role', 'edition', 'contentLevel', 'verification', 'provenance',
    'bonusFeatContract', 'bonusFeatContracts', 'spellcasting', 'spellcastingProgression', 'castingProgression', 'dualProgression',
    'variantOf', 'replaces', 'proficiencies', 'meldshaping', 'pactProgression', 'mysteryProgression', 'utteranceProgression',
    'abilityType', 'associations', 'isFighterBonusFeat', 'bonusFeatFor', 'featTypes', 'slotDiff', 'drawback',
    'chakraBinds', 'shapedEffect', 'essentiaEffect', 'augment', 'title', 'weight', 'charges', 'maxCharges',
    'crIncrease', 'hitDieOverride', 'templateAcquisition', 'specialAttacks', 'specialQualities',
    'vision', 'immunities', 'resistances', 'fastHealing', 'turnResistance', 'requiredAlignment',
    'ruleFlags', 'shortDescription', 'aliases', 'rankFrom'
  ];
  function exportFeature(f) { const o = { kind: f.kind, name: f.name }; if (f.refId) o.refId = f.refId; if (f.branchPath) o.branchPath = f.branchPath; o.abilityType = f.abilityType || 'Ex'; if (f.text) o.text = f.text; if (f.category) o.category = f.category; return o; }

  function exportEntry(en) {
    en = en || S.entry;
    const F = en.facets, has = (k) => F.indexOf(k) >= 0;
    const out = { schemaVersion: 3, id: en.origin.mode === 'override' && en.origin.srdId ? en.origin.srdId : en.id, blueprint: en.blueprint, name: entryName(en), source: normSource(en.source), tags: en.tags.slice(), facets: F.slice() };
    if (en.origin.mode !== 'new') out.origin = { mode: en.origin.mode, srdId: en.origin.srdId, srdName: en.origin.srdName };
    if (en.text) out.text = en.text;
    if (Array.isArray(en.choices) && en.choices.length > 0) out.choices = clone(en.choices);
    if (en.blueprint === 'feat') {
      out.featKind = en.featKind || 'feat';
      if (en.featKind === 'acf' || en.featKind === 'substitution') {
        const a = en.acf || {};
        out.acf = { targetClass: a.targetClass || '', level: num(a.level, 1), replaces: a.replaces || '', race: en.featKind === 'substitution' ? (a.race || null) : null };
      } else {
        out.timesSelectable = en.repeat.mode === 'upto' ? num(en.repeat.n) : en.repeat.mode === 'per' ? 'perWeaponOrSchool' : 1;
      }
    }
    if (isItemBp(en.blueprint)) { out.item = { subtype: en.item.subtype, slot: en.item.slot, consumable: isConsumable(en), price: num(en.item.price), casterLevel: num(en.item.cl) }; }
    if (en.blueprint === 'spell') {
      const sp = en.spell, sys = sp.system || 'spell';
      if (sys === 'maneuver') out.spell = { system: 'maneuver', maneuverType: sp.maneuverType, discipline: sp.discipline, level: num(sp.maneuverLvl, 1), prereqManeuvers: num(sp.prereqManeuvers, 0), descriptors: sp.descriptors.slice() };
      else if (sys === 'invocation') out.spell = { system: 'invocation', grade: sp.invGrade, kind: sp.invKind || 'Invocation', effectiveLevel: num(sp.maneuverLvl, 1), school: sp.school, descriptors: sp.descriptors.slice() };
      else if (sys === 'psionic') out.spell = { system: 'psionic', discipline: sp.discipline, level: num(sp.maneuverLvl, 1), ppCost: num(sp.ppCost, 1), augmentable: !!sp.augmentable, descriptors: sp.descriptors.slice() };
      else if (sys === 'soulmeld') out.spell = { system: 'soulmeld', chakraSlots: sp.chakraSlots || 'Arms / Totem', meldshaperList: sp.meldshaperList || 'Totemist', descriptors: sp.descriptors.slice() };
      else if (sys === 'vestige') {
        out.spell = { system: 'vestige', level: num(sp.vestigeLvl, 1), bindingDc: num(sp.bindingDc, 15), sign: sp.vestigeSign || '', descriptors: sp.descriptors.slice() };
        if (en._spellExtra && en._spellExtra.vestigeInfluence) out.spell.vestigeInfluence = en._spellExtra.vestigeInfluence;
        if (en._spellExtra && en._spellExtra.specialRequirement) out.spell.specialRequirement = en._spellExtra.specialRequirement;
      }
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
        if (num(im.gp) > 0) imOut.flatGp = num(im.gp);
      } else if (im.kind === 'material') {
        imOut.material = { acpDelta: num(im.mat.acpDelta), maxDexDelta: num(im.mat.maxDexDelta), asfDelta: num(im.mat.asfDelta), critMultOverride: num(im.mat.critMultOverride), drBypass: im.mat.drBypass || null, weaponGp: num(im.mat.weaponGp), lightGp: num(im.mat.lightGp), medGp: num(im.mat.medGp), heavyGp: num(im.mat.heavyGp) };
      }
      out.itemModifier = imOut;
    }
    if (en.blueprint === 'race') {
      const r = en.race;
      out.type = r.kind === 'template' ? 'Template' : 'Race';
      out.race = { kind: r.kind, timing: r.kind === 'template' ? r.timing : null, size: r.size, creatureType: r.creatureType, subtype: r.subtype || null, speed: num(r.speed, 30), flySpeed: num(r.flySpeed, 0), flyManeuverability: num(r.flySpeed, 0) > 0 ? r.flyMan : null, levelAdjustment: num(r.la, 0), racialHitDice: num(r.rhdCount, 0) > 0 ? { count: num(r.rhdCount), die: 'd' + num(r.rhdDie, 8) } : null, favoredClass: r.favoredClass || null, bonusFeatAt1st: !!r.bonusFeat1, humanBonusSkillPoints: !!r.bonusSkillPts };
    }
    if (en.blueprint === 'monster') {
      const m = en.monster;
      const nonSet = new Set(m.nonabilities || []);
      const hdStr = num(m.hdCount, 1) + 'd' + num(m.hdDie, 8) + (num(m.hdBonus) ? sgn(num(m.hdBonus)) : '');
      const abilOut = {};
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((k) => { abilOut[k] = nonSet.has(k) ? null : num(m.abilities[k], 10); });
      const acOut = { total: num(m.ac.total, 10), touch: num(m.ac.touch, 10), flatFooted: num(m.ac.flatFooted, 10), naturalArmor: num(m.ac.naturalArmor, 0), armor: num(m.ac.armor, 0), shield: num(m.ac.shield, 0), deflection: num(m.ac.deflection, 0) };
      const spdOut = { land: num(m.speeds.land, 30), fly: num(m.speeds.fly, 0), flyManeuverability: num(m.speeds.fly, 0) > 0 ? (m.speeds.flyMan || 'Average') : null, swim: num(m.speeds.swim, 0), climb: num(m.speeds.climb, 0), burrow: num(m.speeds.burrow, 0) };
      const savOut = { fort: num(m.saves.fort, 0), ref: num(m.saves.ref, 0), will: num(m.saves.will, 0) };
      out.type = 'Monster';
      out.cr = String(m.cr || '1');
      out.size = m.size;
      out.category = m.creatureType;
      out.hitDice = hdStr;
      out.hp = num(m.hp, 1);
      out.init = num(m.init, 0);
      out.bab = num(m.bab, 0);
      out.grapple = num(m.grapple, 0);
      out.space = m.space || '5 ft.';
      out.reach = m.reach || '5 ft.';
      out.ac = clone(acOut);
      out.speed = clone(spdOut);
      out.abilities = clone(abilOut);
      out.nonabilities = (m.nonabilities || []).slice();
      out.saves = clone(savOut);
      out.attacks = clone(m.attacks || []);
      out.skills = clone(m.skills || []);
      out.feats = clone(m.feats || []);
      out.specialAbilities = clone(m.specialAbilities || []);
      out.monster = {
        size: m.size, creatureType: m.creatureType,
        subtypes: m.subtypes ? String(m.subtypes).split(',').map((s) => s.trim()).filter(Boolean) : [],
        alignment: m.alignment || 'Neutral', environment: m.environment || 'Any',
        cr: String(m.cr || '1'), levelAdjustment: m.la == null ? null : num(m.la, 0),
        hitDice: hdStr, hdCount: num(m.hdCount, 1), hdDie: num(m.hdDie, 8), hdBonus: num(m.hdBonus, 0),
        hp: num(m.hp, 1), init: num(m.init, 0),
        speeds: clone(spdOut), ac: clone(acOut),
        bab: out.bab, grapple: out.grapple, space: out.space, reach: out.reach,
        abilities: clone(abilOut), nonabilities: out.nonabilities.slice(), saves: clone(savOut),
        attacks: clone(out.attacks), skills: clone(out.skills), feats: clone(out.feats), specialAbilities: clone(out.specialAbilities)
      };
    }
    if (has('prereqs')) out.prerequisites = { all: en.prereqs.map((r) => ({ anyOf: r.alts.map(cleanAlt) })), text: prereqText(en.prereqs) };
    if (has('chassis')) {
      const ch = en.chassis, v = chassisView(ch, en);
      const customPrice = num(en.item.price) > v.gpTotal ? num(en.item.price) : (num(en.item.price) > 0 && v.enh === 0 && !ch.enchantments.length && ch.material === 'standard' ? num(en.item.price) : v.gpTotal);
      Object.assign(out, { baseItemId: ch.baseId, material: ch.material, enhancementBonus: v.enh, enhancements: ch.enchantments.slice(), effectiveEnhancement: v.effective, gpValue: customPrice });
      if (out.item) out.item.price = customPrice;
      if (v.crystal) out.augmentCrystal = { id: v.crystal.c.id, tier: v.crystal.tier };
      if (v.isW) {
        out.weapon = { category: ch.weapon.category, handedness: ch.weapon.handed, damageDice: v.dice, dmgType: v.dmgType, baseCritRange: num(ch.weapon.critRange), keen: v.keen, effectiveCritRange: v.critLow, critCappedByHouseRule: v.capped, critMultiplier: v.critMult, rangeIncrement: num(ch.weapon.range) > 0 ? num(ch.weapon.range) : null };
      } else {
        out.armor = { armorType: v.armor.type, armorBonus: v.armor.armorBonus, maxDex: v.armor.maxDex >= 99 ? null : v.armor.maxDex, armorCheckPenalty: v.armor.acp, arcaneSpellFailure: v.armor.asf, speed: v.armor.speed };
        if (v.kind === 'shield' && v.bash) {
          const bwc = ch.weapon || {};
          const indep = bwc.bashMode === 'independent';
          const bashObj = { mode: indep ? 'independent' : 'linked', enhancementBonus: indep ? Math.max(0, Math.min(5, num(bwc.bashEnh, 0))) : v.enh };
          if (out.item) out.item.bash = bashObj; else out.bash = bashObj;
          if (v.bash.canBash) {
            out.weapon = { category: 'Shield', handedness: v.bash.handed, damageDice: v.bash.dice, dmgType: v.bash.dmgType, baseCritRange: v.bash.critRange, keen: false, effectiveCritRange: v.bash.critLow, critCappedByHouseRule: v.bash.capped, critMultiplier: v.bash.critMult, rangeIncrement: v.bash.range > 0 ? v.bash.range : null };
          } else {
            out.canShieldBash = false;
          }
        }
      }
      if (v.badges.length) out.tacticalBadges = v.badges.map((b) => b.replace(/^\S+\s/, ''));
    }
    if (en.blueprint === 'buff') out.buffKind = en.buffKind;
    if (has('delivery')) {
      const d = en.delivery, sys = en.spell ? (en.spell.system || 'spell') : 'spell';
      out.delivery = { action: d.action, range: d.range || null, area: d.area || null, attack: d.attackOn ? d.attack : 'none', spellResistance: en.blueprint === 'spell' && ['maneuver', 'soulmeld', 'vestige'].indexOf(sys) >= 0 ? null : d.sr };
      if (d.target) out.delivery.target = d.target;
      if (d.save.type !== 'None') out.delivery.save = { type: d.save.type, effect: d.save.effect, dc: dcText(en), dcMode: d.save.dcMode || 'spell', stat: d.save.stat || 'int', flat: num(d.save.flat, 15) };
      if (d.extras.length) out.delivery.rules = d.extras.map((x) => ({ kind: x.kind, text: x.text }));
    }
    if (has('lifecycle')) {
      const l = en.lifecycle;
      out.lifecycle = { usage: exportUse(l.use), duration: l.duration, durationText: durationText(l), dismissible: !!l.dismissible };
      if (l.stackable) out.lifecycle.maxStacks = num(l.maxStacks);
    }
    out.effects = (en.effects || []).map(exportBlock);
    if (has('powers') || (en.powers && en.powers.length)) out.powers = en.powers.map(exportPower);
    const modesOut = exportModesV3(en);
    if (modesOut.length) out.modes = modesOut;
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
      if (en.blueprint === 'domain') {
        const gpObj = g.grantedPower || g.grantedPowerName ? { name: g.grantedPowerName || null, text: g.grantedPower, usage: exportUse(g.gpUse) } : null;
        if (gpObj && en._domainGpExtra) {
          if (en._domainGpExtra.classSkills) gpObj.classSkills = clone(en._domainGpExtra.classSkills);
          if (en._domainGpExtra.grantedFeats) gpObj.grantedFeats = clone(en._domainGpExtra.grantedFeats);
          if (en._domainGpExtra.spellLikeAbilities) gpObj.spellLikeAbilities = clone(en._domainGpExtra.spellLikeAbilities);
        }
        const ladderOut = g.ladder.map((s, i) => {
          if (!s) return null;
          const spRef = (CAT.spells || []).find((x) => normName(x.name) === normName(s));
          const prevRef = en._domainLadderRefs && en._domainLadderRefs[i];
          return { level: i + 1, spell: s, refId: (spRef && spRef.id) || prevRef || null };
        }).filter(Boolean);
        Object.assign(o, { grantedPower: gpObj, spellLadder: ladderOut });
      }
      if (g.domains.length) o.domains = g.domains.map((d) => (d.kind === 'ref' ? { kind: 'ref', name: d.name, refId: d.refId || null } : { kind: 'inline', name: d.name, grantedPower: d.grantedPower, spellLadder: d.ladder.map((s, i) => ({ level: i + 1, spell: s || null })).filter((x) => x.spell) }));
      if (g.deities.length) o.deities = g.deities.map((d) => ({ kind: d.kind, name: d.name, alignment: d.align, favoredWeapon: d.favoredWeapon }));
      if (g.featGrants.length) o.bonusFeats = g.featGrants.map((x) => ({ count: num(x.count), pool: x.pool, level: num(x.level) }));
      out.grants = o;
    }
    if (en._passthrough && typeof en._passthrough === 'object') {
      Object.keys(en._passthrough).forEach((k) => {
        if (!(k in out)) out[k] = clone(en._passthrough[k]);
      });
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
    if ((ef.type === 'effect' || !ef.type) && (ef.flag || ef.ruleFlag)) {
      const rawFlag = String(ef.flag || ef.ruleFlag).trim();
      if (LEGACY_SWITCH_TO_SWAP[rawFlag]) {
        const sw = LEGACY_SWITCH_TO_SWAP[rawFlag];
        return BLK('stat', {
          mode: 'replaceStat',
          swapTarget: sw.swapTarget,
          targets: [sw.swapTarget],
          subOp: sw.subOp,
          fromStat: sw.fromStat,
          toStat: sw.toStat,
          swapScope: sw.swapScope || 'all',
          condition: ef.condition || ''
        });
      }
    }
    const t = BLOCK_TYPES[ef.type] ? ef.type : 'effect';
    const normalized = Object.assign({}, ef);
    if (t === 'stat') {
      if (normalized.mode === 'replaceStat') {
        const swapTgt = normalizeSwapTargetKey(normalized.swapTarget || (Array.isArray(normalized.targets) && normalized.targets[0]) || normalized.target || 'atk.melee.abilityMod');
        normalized.swapTarget = swapTgt;
        normalized.targets = [swapTgt];
        normalized.subOp = normalized.subOp || normalized.op || 'max';
        normalized.fromStat = normalized.fromStat || SWAP_DEFAULT_FROM[swapTgt] || 'str';
        normalized.toStat = normalized.toStat || 'wis';
        normalized.swapScope = normalized.swapScope || normalized.scope || 'all';
        delete normalized.scope;
      } else if (Array.isArray(normalized.targets)) {
        normalized.targets = normalized.targets.map(normTargetKey);
      } else if (normalized.target) {
        normalized.targets = [normTargetKey(normalized.target)];
      }
      if (normalized.btype || normalized.bonusType) {
        normalized.btype = bonusTypeName(normalized.btype || normalized.bonusType);
      }
      if (normalized.condition && typeof normalized.condition === 'object') {
        normalized.condition = normalized.condition.toggle ? ('toggle:' + normalized.condition.toggle) : JSON.stringify(normalized.condition);
      }
      if (normalized.mode === 'stat' && normalized.value === undefined) normalized.value = 0;
      if (normalized.mode === 'formula') {
        const fStr = String(normalized.formula == null ? '' : normalized.formula).trim();
        if (fStr !== '' && !isNaN(Number(fStr))) {
          normalized.mode = 'flat';
          normalized.value = Number(fStr);
        } else {
          const parsedScale = parseStatFormulaSrd(fStr, normalized.value);
          if (parsedScale) Object.assign(normalized, parsedScale);
          else {
            normalized.mode = 'formula';
            normalized.formula = fStr;
          }
        }
      }
    }
    if (t === 'roll') {
      if (normalized.rollType || normalized.rollKind) {
        normalized.kind = normalized.rollType || normalized.rollKind;
      }
      if (/^heal(ing)?$/i.test(String(normalized.kind || ''))) normalized.kind = 'Healing';
      else if (/^damage$/i.test(String(normalized.kind || ''))) normalized.kind = 'Damage';
      if (normalized.dice && typeof normalized.dice === 'string') {
        const dStr = normalized.dice.trim();
        const simpleM = dStr.match(/^(\d+)\s*d(\d+)(?:\s*([+-]\s*\d+))?$/i);
        if (simpleM) {
          normalized.count = parseInt(simpleM[1], 10) || 1;
          normalized.die = 'd' + simpleM[2];
          if (simpleM[3] && normalized.flat === undefined) {
            normalized.flat = parseInt(simpleM[3].replace(/\s+/g, ''), 10) || 0;
          }
          delete normalized.dice;
          if (normalized.scaling === 'formula') normalized.scaling = 'flat';
        } else if (/^\d+$/.test(dStr)) {
          normalized.count = parseInt(dStr, 10) || 0;
          normalized.die = 'flat';
          normalized.flat = 0;
          delete normalized.dice;
          if (normalized.scaling === 'formula') normalized.scaling = 'flat';
        } else {
          const leadM = dStr.match(/^(\d+)\s*d(\d+)/i);
          if (leadM) {
            normalized.count = parseInt(leadM[1], 10) || 1;
            normalized.die = 'd' + leadM[2];
          }
          normalized.scaling = 'formula';
          normalized.dice = dStr;
        }
      }
      if (normalized.bonus !== undefined && normalized.flat === undefined) {
        if (normalized.die === 'flat' || (!normalized.dice && !normalized.die && !normalized.count)) {
          normalized.die = 'flat';
          normalized.count = Number(normalized.bonus) || 0;
          normalized.flat = 0;
        } else {
          normalized.flat = Number(normalized.bonus) || 0;
        }
        delete normalized.bonus;
      }
    }
    if (t === 'defense' && normalized.what === undefined) {
      normalized.what = ef.bypass || ef.target || '';
    }
    if (t === 'effect' && (normalized.flag || normalized.ruleFlag) && !normalized.effectKind) {
      normalized.effectKind = 'ruleSwitch';
      normalized.flag = normalized.flag || normalized.ruleFlag;
    }
    const b = BLK(t, normalized);
    delete b.summary;
    delete b.effects;
    b._src = clone(ef);
    b._srcType = t;
    if (t === 'when' && Array.isArray(ef.branches)) {
      b.branches = ef.branches.map((br) => {
        const bo = blankBranch(Object.assign({}, NEUTRAL_BRANCH_OVERRIDES, br));
        const rawWhen = (typeof br.when === 'string' && br.when) || (typeof br.condition === 'string' && br.condition) || '';
        if (!br.condKind && WHEN_COND_LABELS[rawWhen]) {
          bo.condKind = rawWhen;
          if (!br.condText) bo.condText = '';
        } else if ((br.condKind === 'state' || br.condKind === 'situational') && br.condText && WHEN_COND_LABELS[br.condText]) {
          bo.condKind = br.condText;
          bo.condText = '';
        }
        delete bo.effects;
        bo._src = clone(br);
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
    b._srcSub = activeBlockSub(b);
    return b;
  }

  const DUR_V3_ALIAS = { rdLvl: 'roundsPerLevel', minLvl: 'minPerLevel', '10minLvl': 'tenMinPerLevel', hrLvl: 'hourPerLevel', perm: 'permanent' };
  const SAVE_V3_ALIAS = { Fort: 'Fortitude', Ref: 'Reflex' };

  function fromCanonicalV3(raw) {
    const arr = (x) => (Array.isArray(x) ? x : []);
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('Expected a Canonical V3 JSON object.');
    }
    const bpId = obj.blueprint && BP_BY_ID[obj.blueprint] ? BP_BY_ID[obj.blueprint].id
      : obj.kind && BP_BY_ID[obj.kind] ? BP_BY_ID[obj.kind].id
      : (obj.monster || obj.type === 'Monster') ? 'monster'
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
    en._passthrough = {};
    PASSTHROUGH_V3_KEYS.forEach((k) => {
      if (obj[k] !== undefined) en._passthrough[k] = clone(obj[k]);
    });
    en.id = obj.id || en.id;
    en.name = obj.name || '';
    en.source = normSource(obj.source);
    en.tags = arr(obj.tags).slice();
    if (Array.isArray(obj.facets) && obj.facets.length) en.facets = obj.facets.slice();
    if (obj.origin && typeof obj.origin === 'object') en.origin = Object.assign(en.origin, obj.origin);
    if (typeof obj.text === 'string') en.text = obj.text;
    else if (obj.text && typeof obj.text === 'object') en.text = obj.text.summary || '';
    if (Array.isArray(obj.choices) && obj.choices.length > 0) en.choices = clone(obj.choices);
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
      const rawSub = String(obj.item.subtype || en.item.subtype || '').trim();
      const normSub = /^(potion|oil)s?$/i.test(rawSub) ? 'Potion / Oil' : (rawSub || en.item.subtype);
      en.item = Object.assign(en.item, {
        subtype: normSub,
        slot: obj.item.slot || en.item.slot,
        price: obj.item.price !== undefined ? num(obj.item.price) : (obj.gpValue !== undefined ? num(obj.gpValue) : en.item.price),
        cl: obj.item.casterLevel !== undefined ? num(obj.item.casterLevel) : (obj.item.cl !== undefined ? num(obj.item.cl) : en.item.cl)
      });
    }
    if (obj.spell && typeof obj.spell === 'object') {
      const sp = obj.spell, sys = sp.system || 'spell';
      en.spell.system = sys;
      if (sp.descriptors) en.spell.descriptors = arr(sp.descriptors).slice();
      if (sys === 'maneuver') Object.assign(en.spell, { maneuverType: sp.maneuverType || 'Strike', discipline: sp.discipline || en.spell.discipline, maneuverLvl: num(sp.level != null ? sp.level : sp.maneuverLvl, 1), prereqManeuvers: num(sp.prereqManeuvers, 0) });
      else if (sys === 'invocation') Object.assign(en.spell, { invGrade: sp.grade || sp.invGrade || 'Least', invKind: sp.kind || sp.invKind || 'Invocation', maneuverLvl: num(sp.effectiveLevel != null ? sp.effectiveLevel : sp.maneuverLvl, 1), school: sp.school || en.spell.school });
      else if (sys === 'psionic') Object.assign(en.spell, { discipline: sp.discipline || en.spell.discipline, maneuverLvl: num(sp.level != null ? sp.level : sp.maneuverLvl, 1), ppCost: num(sp.ppCost, 1), augmentable: !!sp.augmentable });
      else if (sys === 'soulmeld') Object.assign(en.spell, { chakraSlots: sp.chakraSlots || 'Arms / Totem', meldshaperList: sp.meldshaperList || 'Totemist' });
      else if (sys === 'vestige') {
        Object.assign(en.spell, { vestigeLvl: num(sp.level != null ? sp.level : sp.vestigeLvl, 1), bindingDc: num(sp.bindingDc, 15), vestigeSign: sp.sign != null ? sp.sign : (sp.vestigeSign || '') });
        if (sp.vestigeInfluence || sp.specialRequirement) en._spellExtra = { vestigeInfluence: sp.vestigeInfluence || null, specialRequirement: sp.specialRequirement || null };
      }
      else if (sys === 'utterance') Object.assign(en.spell, { lexicon: sp.lexicon || 'Evolving Mind', maneuverLvl: num(sp.level != null ? sp.level : sp.maneuverLvl, 1) });
      else if (sys === 'mystery') Object.assign(en.spell, { mysteryTier: sp.tier || sp.mysteryTier || 'Apprentice', mysteryPath: sp.path != null ? sp.path : (sp.mysteryPath || ''), maneuverLvl: num(sp.level != null ? sp.level : sp.maneuverLvl, 1) });
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
      } else if (im.kind === 'crystal' && num(im.flatGp) > 0) {
        const tierM = String(obj.name || '').match(/\b(Least|Lesser|Greater)\b/i);
        const ti = tierM ? Math.max(0, CRYSTAL_TIERS.indexOf(tierM[1].toLowerCase())) : 0;
        en.itemMod.crystalCosts = [null, null, null];
        en.itemMod.crystalTiers = ['', '', ''];
        en.itemMod.crystalCosts[ti] = num(im.flatGp);
        en.itemMod.crystalTiers[ti] = en.text || obj.shortDescription || '';
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
    if (obj.monster || obj.type === 'Monster' || bpId === 'monster') {
      const m = (obj.monster && typeof obj.monster === 'object') ? obj.monster : obj;
      const hdM = String(m.hitDice || obj.hitDice || '2d8+2').match(/(\d+)d(\d+)\s*(?:([+-]\s*\d+))?/i);
      const nonArr = Array.isArray(m.nonabilities) ? m.nonabilities.slice() : (Array.isArray(obj.nonabilities) ? obj.nonabilities.slice() : []);
      const rawAb = m.abilities || obj.abilities || {};
      const abilClean = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((k) => {
        if (rawAb[k] === null || rawAb[k] === '—' || rawAb[k] === '-') {
          if (nonArr.indexOf(k) < 0) nonArr.push(k);
          abilClean[k] = 10;
        } else if (rawAb[k] !== undefined) {
          abilClean[k] = num(rawAb[k], 10);
        }
      });
      const spObj = (m.speeds && typeof m.speeds === 'object') ? m.speeds : ((obj.speed && typeof obj.speed === 'object') ? obj.speed : {});
      const acObj = (m.ac && typeof m.ac === 'object') ? m.ac : ((obj.ac && typeof obj.ac === 'object') ? obj.ac : { total: num(obj.ac, 14) });
      const savObj = m.saves || obj.saves || {};
      Object.assign(en.monster, {
        size: m.size || obj.size || 'Medium',
        creatureType: m.creatureType || obj.category || 'Magical Beast',
        subtypes: Array.isArray(m.subtypes) ? m.subtypes.join(', ') : (m.subtypes || ''),
        alignment: m.alignment || obj.alignment || 'Neutral',
        environment: m.environment || obj.environment || 'Any',
        cr: String(m.cr != null ? m.cr : (obj.cr != null ? obj.cr : '1')),
        la: num(m.levelAdjustment != null ? m.levelAdjustment : m.la, 0),
        hdCount: m.hdCount != null ? num(m.hdCount, 1) : (hdM ? num(hdM[1], 1) : 2),
        hdDie: m.hdDie != null ? num(m.hdDie, 8) : (hdM ? num(hdM[2], 8) : 8),
        hdBonus: m.hdBonus != null ? num(m.hdBonus, 0) : (hdM && hdM[3] ? num(hdM[3].replace(/\s+/g, ''), 0) : 0),
        hitDice: m.hitDice || obj.hitDice || '2d8+2',
        hp: num(m.hp != null ? m.hp : obj.hp, 11),
        init: num(m.init != null ? m.init : (obj.init != null ? obj.init : obj.initiative), 0),
        speeds: {
          land: num(spObj.land, 30),
          fly: num(spObj.fly, 0),
          flyMan: spObj.flyManeuverability || spObj.flyMan || 'Average',
          swim: num(spObj.swim, 0),
          climb: num(spObj.climb, 0),
          burrow: num(spObj.burrow, 0)
        },
        ac: {
          total: num(acObj.total, 14),
          touch: num(acObj.touch, 12),
          flatFooted: num(acObj.flatFooted, 12),
          naturalArmor: num(acObj.naturalArmor, 0),
          armor: num(acObj.armor, 0),
          shield: num(acObj.shield, 0),
          deflection: num(acObj.deflection, 0)
        },
        bab: num(m.bab != null ? m.bab : obj.bab, 1),
        grapple: num(m.grapple != null ? m.grapple : obj.grapple, 1),
        space: m.space || obj.space || '5 ft.',
        reach: m.reach || obj.reach || '5 ft.',
        abilities: abilClean,
        nonabilities: nonArr,
        saves: { fort: num(savObj.fort, 0), ref: num(savObj.ref, 0), will: num(savObj.will, 0) },
        attacks: clone(arr(m.attacks || obj.attacks)),
        skills: clone(arr(m.skills || obj.skills)),
        feats: clone(arr(m.feats || obj.feats)),
        specialAbilities: clone(arr(m.specialAbilities || obj.specialAbilities))
      });
    }
    if (obj.buffKind) en.buffKind = obj.buffKind;
    if (obj.delivery && typeof obj.delivery === 'object') {
      const d = obj.delivery;
      Object.assign(en.delivery, {
        action: d.action || en.delivery.action, range: d.range || '', area: d.area || '', target: d.target || '',
        attackOn: !!(d.attack && d.attack !== 'none'), attack: d.attack && d.attack !== 'none' ? d.attack : en.delivery.attack,
        sr: d.spellResistance || d.sr || en.delivery.sr
      });
      if (d.save) {
        const rawSv = d.save.type || 'None';
        en.delivery.save.type = SAVE_V3_ALIAS[rawSv] || rawSv;
        en.delivery.save.effect = d.save.effect || 'Negates';
        if (d.save.dcMode) {
          en.delivery.save.dcMode = d.save.dcMode;
          if (d.save.stat) en.delivery.save.stat = String(d.save.stat).toLowerCase();
          if (d.save.flat != null) en.delivery.save.flat = num(d.save.flat, 15);
        } else {
          const dcStr = String(d.save.dc || '');
          const statM = dcStr.match(/\+\s*(STR|DEX|CON|INT|WIS|CHA)/i);
          if (/1\/2\s*HD/i.test(dcStr)) { en.delivery.save.dcMode = 'hd'; if (statM) en.delivery.save.stat = statM[1].toLowerCase(); }
          else if (/Spell Level/i.test(dcStr) || /\+\s*\d+\s*\+\s*(STR|DEX|CON|INT|WIS|CHA)/i.test(dcStr)) { en.delivery.save.dcMode = 'spell'; if (statM) en.delivery.save.stat = statM[1].toLowerCase(); }
          else { const flatM = dcStr.match(/DC\s*(\d+)/i); if (flatM) { en.delivery.save.dcMode = 'flat'; en.delivery.save.flat = num(flatM[1], 15); } }
        }
      }
      if (Array.isArray(d.rules)) en.delivery.extras = d.rules.map((r) => ({ id: uid('x'), kind: r.kind || 'other', text: r.text || '' }));
    }
    if (obj.lifecycle && typeof obj.lifecycle === 'object') {
      const l = obj.lifecycle;
      const durCode = DUR_V3_ALIAS[l.duration] || l.duration || en.lifecycle.duration;
      const rawDurTxt = l.durationText != null ? String(l.durationText) : (l.durText != null ? String(l.durText) : '');
      const durM = rawDurTxt.match(/^(\d+)/);
      Object.assign(en.lifecycle, {
        duration: durCode,
        durValue: durM ? num(durM[1], 1) : en.lifecycle.durValue,
        durText: durCode === 'text' ? rawDurTxt : en.lifecycle.durText,
        dismissible: !!l.dismissible,
        stackable: num(l.maxStacks) > 0,
        maxStacks: num(l.maxStacks, en.lifecycle.maxStacks)
      });
      const uObj = l.usage || l.use;
      if (uObj) en.lifecycle.use = parseUseObj(uObj);
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
        if (gr.grantedPower.classSkills || gr.grantedPower.grantedFeats || gr.grantedPower.spellLikeAbilities) {
          en._domainGpExtra = {
            classSkills: gr.grantedPower.classSkills ? clone(gr.grantedPower.classSkills) : undefined,
            grantedFeats: gr.grantedPower.grantedFeats ? clone(gr.grantedPower.grantedFeats) : undefined,
            spellLikeAbilities: gr.grantedPower.spellLikeAbilities ? clone(gr.grantedPower.spellLikeAbilities) : undefined
          };
        }
      }
      if (Array.isArray(gr.spellLadder)) {
        en._domainLadderRefs = {};
        gr.spellLadder.forEach((sl) => {
          if (sl && sl.level >= 1 && sl.level <= 9) {
            en.grants.ladder[sl.level - 1] = sl.spell || '';
            if (sl.refId) en._domainLadderRefs[sl.level - 1] = sl.refId;
          }
        });
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
    } else if (obj.prereqStruct && typeof obj.prereqStruct === 'object') {
      const ps = obj.prereqStruct;
      const rows = [];
      if (ps.abilities && typeof ps.abilities === 'object') {
        Object.entries(ps.abilities).forEach(([ab, val]) => rows.push({ id: uid('p'), alts: [ALT({ kind: 'ability', ability: ab.toLowerCase(), min: num(val, 13) })] }));
      }
      if (ps.bab) rows.push({ id: uid('p'), alts: [ALT({ kind: 'bab', min: num(ps.bab, 1) })] });
      if (ps.skills && typeof ps.skills === 'object') {
        Object.entries(ps.skills).forEach(([sk, val]) => rows.push({ id: uid('p'), alts: [ALT({ kind: 'skill', skill: sk.startsWith('skill.') ? sk : `skill.${sk}`, min: num(val, 4) })] }));
      }
      if (Array.isArray(ps.feats)) {
        ps.feats.forEach((fn) => rows.push({ id: uid('p'), alts: [ALT({ kind: 'feat', feat: String(fn) })] }));
      }
      if (ps.casterLevel) rows.push({ id: uid('p'), alts: [ALT({ kind: 'level', levelKind: 'casterLevel', min: num(ps.casterLevel, 1) })] });
      if (ps.charLevel) rows.push({ id: uid('p'), alts: [ALT({ kind: 'level', levelKind: 'charLevel', min: num(ps.charLevel, 1) })] });
      if (rows.length > 0) en.prereqs = rows;
    } else if (Array.isArray(obj.prerequisites) && obj.prerequisites.length > 0) {
      en.prereqs = obj.prerequisites.map((r) => {
        if (!r || typeof r !== 'object') return { id: uid('p'), alts: [ALT({ kind: 'custom', text: String(r || '') })] };
        if (r.key === 'bab') return { id: uid('p'), alts: [ALT({ kind: 'bab', min: num(r.min, 1) })] };
        if (r.key === 'skill') return { id: uid('p'), alts: [ALT({ kind: 'skill', skill: String(r.skill || 'tumble').startsWith('skill.') ? r.skill : ('skill.' + r.skill), min: num(r.ranks, 4) })] };
        if (r.key === 'feat') return { id: uid('p'), alts: [ALT({ kind: 'feat', feat: r.name || r.val || r.text || '' })] };
        if (r.key === 'alignment') {
          const al = Array.isArray(r.allowed) && r.allowed.length ? r.allowed.join(', ') : (r.text || 'Any');
          return { id: uid('p'), alts: [ALT({ kind: 'alignment', align: al })] };
        }
        if (r.key === 'arcane' || r.key === 'divine' || r.key === 'spells') {
          return { id: uid('p'), alts: [ALT({ kind: 'spellcasting', cls: r.key === 'arcane' ? 'arcane' : (r.key === 'divine' ? 'divine' : 'any'), min: num(r.minSpellLevel || r.level, 1) })] };
        }
        return { id: uid('p'), alts: [ALT({ kind: 'custom', text: r.text || (r.key === 'race' && r.val ? ('Race: ' + r.val) : JSON.stringify(r)) })] };
      });
    } else if (typeof obj.prerequisites === 'string' && obj.prerequisites.trim() && obj.prerequisites.trim().toLowerCase() !== 'none') {
      en.prereqs = obj.prerequisites.split(',').map((s) => s.trim()).filter(Boolean).map((s) => ({ id: uid('p'), alts: [ALT({ kind: 'custom', text: s })] }));
    }
    en.effects = arr(obj.effects).map(parseBlockV3).filter(Boolean);
    if (obj.baseItemId || obj.weapon || obj.armor || (obj.chassis && typeof obj.chassis === 'object')) {
      const ch = obj.chassis || obj;
      const kind = ch.kind || (obj.armor ? 'armor' : 'weapon');
      let baseId = ch.baseId || ch.baseItemId || obj.id || en.chassis.baseId;
      if (kind === 'weapon' && !byId(CAT.weapons, baseId)) {
        const matchW = CAT.weapons.find((y) => normName(baseName(y)) === normName(obj.name || ''));
        if (matchW) baseId = matchW.id;
      } else if (kind === 'armor' && !byId(CAT.armors, baseId)) {
        const matchA = CAT.armors.find((y) => normName(y.name) === normName(obj.name || ''));
        if (matchA) baseId = matchA.id;
      }
      en.chassis = blankChassis(kind, baseId);
      const rawMat = String(ch.material || 'standard').trim().replace(/^mat-/i, '').replace(/-/g, '_');
      en.chassis.material = MATERIALS.some((m) => m.id === rawMat) ? rawMat : (ch.material || 'standard');
      en.chassis.enhancement = ch.enhancement != null ? num(ch.enhancement, 0) : num(ch.enhancementBonus, 0);
      en.chassis.enchantments = arr(ch.enhancements || ch.enchantments).map((eid) => {
        const rawE = String(eid || '').trim();
        if (byId(CAT.enchants, rawE)) return rawE;
        const byNm = CAT.enchants.find((x) => normName(x.name) === normName(rawE.replace(/^enh-/i, '').replace(/[-_]/g, ' ')));
        return byNm ? byNm.id : rawE;
      }).filter(Boolean);
      if (ch.augmentCrystal && ch.augmentCrystal.id) en.chassis.crystal = { id: ch.augmentCrystal.id, tier: ch.augmentCrystal.tier || 'least' };
      else if (ch.crystal && ch.crystal.id) en.chassis.crystal = { id: ch.crystal.id, tier: ch.crystal.tier || 'least' };
      const w = obj.weapon || ch.weapon;
      const bashIn = (obj.item && obj.item.bash) || obj.bash;
      if (bashIn && typeof bashIn === 'object' && kind === 'armor') {
        en.chassis.weapon.bashMode = bashIn.mode === 'independent' ? 'independent' : 'linked';
        if (en.chassis.weapon.bashMode === 'independent') en.chassis.weapon.bashEnh = Math.max(0, Math.min(5, num(bashIn.enhancementBonus, 0)));
      }
      if (obj.canShieldBash === false) {
        en.chassis.weapon.canBash = false;
      } else if (w && typeof w === 'object') {
        const dps = arr(obj.damageParts || w.damageParts);
        const rawPart = dps.find((d) => d && (d.raw || d.source === 'Base')) || dps[0];
        const v3Dice = w.damageDice || w.dice || (rawPart && rawPart.dice) || en.chassis.weapon.dice;
        const v3DmgType = w.dmgType || w.damageType || ((rawPart && rawPart.type) ? cap1(rawPart.type) : en.chassis.weapon.dmgType);
        const normHand = HANDED[w.handedness || w.handed] || w.handedness || w.handed || en.chassis.weapon.handed;
        en.chassis.weapon = Object.assign(en.chassis.weapon, {
          canBash: w.canBash !== false,
          category: w.category || en.chassis.weapon.category,
          handed: normHand,
          dice: v3Dice,
          dmgType: v3DmgType,
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
        if (a.armorCheckPenalty !== undefined && num(a.armorCheckPenalty) !== num(computed.acp)) {
          const mwApplies = (en.chassis.enhancement > 0 || en.chassis.material === 'masterwork') && en.chassis.material !== 'mithral' && en.chassis.material !== 'darkwood';
          const targetAcp = num(a.armorCheckPenalty);
          en.chassis.armor.acp = (mwApplies && targetAcp < 0) ? (targetAcp - 1) : targetAcp;
        }
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
          clFormula: typeof pw.casterLevelFormula === 'string' ? pw.casterLevelFormula : '',
          dc: num(pw.saveDC != null ? pw.saveDC : pw.dc, 0),
          dcFormula: String(pw.dcFormula || (num(pw.saveDC != null ? pw.saveDC : pw.dc, 0) ? num(pw.saveDC != null ? pw.saveDC : pw.dc, 0) : '')),
          spellLevel: pw.spellLevel != null ? pw.spellLevel : '',
          gainedAt: num(pw.gainedAt) > 1 ? Math.floor(num(pw.gainedAt)) : '',
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
    if (Array.isArray(obj.modes)) {
      const sm = splitModesV3(obj.modes);
      en.modes = sm.modes; en._modesOff = sm.off; en._modesWeapon = sm.weapon;
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
          levels[i].features = arr(lv.features).map((f) => FEATURE(f.name || '', { kind: f.kind || (f.refId ? 'ref' : 'inline'), refId: f.refId || '', abilityType: f.abilityType || 'Ex', branchPath: f.branchPath || '', text: f.text || '' }));
        });
      } else if (Array.isArray(pr.milestones)) {
        pr.milestones.forEach((ms) => {
          const i = num(ms.level, 1) - 1;
          if (!levels[i]) return;
          levels[i].features = arr(ms.features).map((f) => FEATURE(f.name || '', { kind: f.kind || (f.refId ? 'ref' : 'inline'), refId: f.refId || '', abilityType: f.abilityType || 'Ex', branchPath: f.branchPath || '', text: f.text || '', category: f.category || '' }));
        });
      } else if (obj.features && typeof obj.features === 'object') {
        Object.keys(obj.features).forEach((lvlKey) => {
          const i = num(lvlKey, 0) - 1;
          if (i < 0 || !levels[i]) return;
          levels[i].features = arr(obj.features[lvlKey]).map((f) => {
            if (typeof f === 'string') return FEATURE(f, { kind: 'inline', abilityType: 'Ex' });
            const refId = f.refId || f.id || '';
            return FEATURE(f.name || '', { kind: refId ? 'ref' : 'inline', refId, abilityType: f.abilityType || f.type || 'Ex', text: f.text || f.summary || f.benefit || '' });
          });
        });
      }
      if (!en.grants.featGrants.length && Array.isArray(obj.bonusFeatLevels) && obj.bonusFeatLevels.length > 0) {
        const pool = (obj.bonusFeatContract && obj.bonusFeatContract.tag === 'isFighterBonusFeat') ? '#FighterBonus' : (obj.name === 'Wizard' ? '#Metamagic / #ItemCreation' : 'Class List');
        en.grants.featGrants = obj.bonusFeatLevels.map((lvl) => ({ id: uid('g'), count: 1, pool, level: num(lvl, 1) }));
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
    renderAll();
    toast('Loaded "' + entryName(en) + '" into Rule Crafter.', 'emerald');
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
  const BONUS_TYPE_ALIASES = {
    natural: 'Natural Armor',
    natural_armor: 'Natural Armor',
    natural_enhancement: 'Natural Armor Enhancement',
    armor_enhancement: 'Armor Enhancement',
    shield_enhancement: 'Shield Enhancement',
    divine: 'Sacred',
    haste: 'Untyped',
    trait: 'Untyped',
    domain: 'Untyped',
    cover: 'Circumstance'
  };
  function bonusTypeName(t) {
    const raw = String(t || '').trim();
    if (!raw) return 'Untyped';
    const low = raw.toLowerCase();
    if (BONUS_TYPE_ALIASES[low]) return BONUS_TYPE_ALIASES[low];
    const b = BONUS_TYPES.find((x) => x.id.toLowerCase() === low);
    return b ? b.id : 'Untyped';
  }
  function parseStatFormulaSrd(formula, fallbackVal) {
    const f = String(formula || '').trim();
    if (!f) return null;
    if (!isNaN(Number(f))) return { mode: 'flat', value: Number(f) };
    let m;
    // e.g. min(3, max(1, floor(@cl / 3))) or min(5, max(1, floor(@cl / 4)))
    if ((m = f.match(/^min\(\s*(\d+)\s*,\s*max\(\s*(\d+)\s*,\s*floor\(\s*@cl\s*\/\s*(\d+)\s*\)\s*(?:\*\s*(\d+))?\s*\)\s*\)$/i))) {
      return { mode: 'perCL', value: m[4] ? num(m[4], 1) : 1, per: num(m[3], 1), min: num(m[2], 0), max: num(m[1], 5) };
    }
    // `2 + min(3, floor(@cl / 6))` (Shield of Faith) and `2 + min(3, max(0, floor((@cl - 3) / 3)))` (Barkskin) are NOT
    // `perCL`: perCL is clamp(floor(@cl / per) * value, min, max), where `min` is a floor, not an additive base.
    // Returning null keeps the exact text as a `formula` block (see statBlocksFromSrd / normalizeBlock).
    // e.g. floor(@cl / 2)
    if ((m = f.match(/^floor\(\s*@cl\s*\/\s*(\d+)\s*\)$/i))) {
      return { mode: 'perCL', value: 1, per: num(m[1], 2), min: 0, max: 20 };
    }
    // e.g. 1 + @cl or 2 + @cl * 2
    if ((m = f.match(/^(?:(\d+)\s*\+\s*)?@cl(?:\s*\*\s*(\d+))?$/i))) {
      const base = m[1] ? num(m[1], 0) : 0, mult = m[2] ? num(m[2], 1) : 1;
      return { mode: 'perCL', value: mult, per: 1, min: base + mult, max: base + mult * 20 };
    }
    // e.g. @abilities.cha.mod or max(1, @chaMod)
    if ((m = f.match(/@(?:abilities\.)?(str|dex|con|int|wis|cha)(?:\.mod|Mod)/i))) {
      return { mode: 'stat', stat: m[1].toLowerCase() + 'Mod', mult: 1, value: num(fallbackVal, 0), cap: 'none' };
    }
    if (/@level\b/i.test(f) && !/[+*\/-]/.test(f.replace(/@level\b/i, ''))) {
      return { mode: 'stat', stat: 'level', mult: 1, value: 0, cap: 'none' };
    }
    return null;
  }
  function statBlocksFromSrd(list) {
    const out = [];
    const groups = new Map();
    (list || []).forEach((m) => {
      if (!m || !m.target) return;
      const tgt = normTargetKey(m.target);
      const btype = bonusTypeName(m.type);
      const cond = m.condition ? String(m.condition) : '';
      const fStr = m.formula != null ? String(m.formula).trim() : '';
      const hasDynamicFormula = fStr !== '' && isNaN(Number(fStr));
      let spec = null;
      if (hasDynamicFormula) {
        const parsed = parseStatFormulaSrd(fStr, m.value);
        if (parsed) spec = Object.assign({ btype: btype, condition: cond }, parsed);
        else spec = { mode: 'formula', value: 0, formula: fStr, btype: btype, condition: cond };
      } else {
        const v = Number.isFinite(Number(m.value)) && Number(m.value) !== 0
          ? num(m.value)
          : (!isNaN(Number(fStr)) && Number(fStr) !== 0 ? num(fStr) : 0);
        if (v !== 0) spec = { mode: 'flat', value: v, btype: btype, condition: cond };
      }
      if (!spec) return;
      const gKey = [spec.mode, spec.value, spec.btype, spec.stat || '', spec.mult || '', spec.per || '', spec.min || '', spec.max || '', spec.formula || '', spec.condition || ''].join('|');
      if (groups.has(gKey)) {
        const existing = groups.get(gKey);
        if (existing.targets.indexOf(tgt) < 0) existing.targets.push(tgt);
      } else {
        const blk = BLK('stat', Object.assign({ targets: [tgt] }, spec));
        groups.set(gKey, blk);
        out.push(blk);
      }
    });
    return out;
  }
  function tempHpBlockFromSrd(formula) {
    const f = String(formula || '').trim();
    if (!f) return null;
    if (!isNaN(Number(f)) && Number(f) > 0) {
      return BLK('roll', { kind: 'Temp HP', count: num(f), die: 'flat', scaling: 'flat' });
    }
    let m;
    // e.g. 1d8 + min(10, @cl) or 1d10 + min(10, @cl)
    if ((m = f.match(/^(\d+)d(\d+)\s*\+\s*min\(\s*(\d+)\s*,\s*@cl(?:\s*\*\s*(\d+))?\s*\)$/i))) {
      return BLK('roll', { kind: 'Temp HP', count: num(m[1], 1), die: 'd' + m[2], scaling: 'perCL', amount: m[4] ? num(m[4], 1) : 1, per: 1, start: 1, max: num(m[3], 10) });
    }
    // e.g. min(20, @cl) or min(30, @cl * 2)
    if ((m = f.match(/^min\(\s*(\d+)\s*,\s*@cl(?:\s*\*\s*(\d+))?\s*\)$/i))) {
      return BLK('roll', { kind: 'Temp HP', count: 0, die: 'flat', scaling: 'perCL', amount: m[2] ? num(m[2], 1) : 1, per: 1, start: 1, max: num(m[1], 20) });
    }
    // e.g. @cl or 5 * @cl or @cl * 5
    if ((m = f.match(/^(?:(\d+)\s*\*\s*)?@cl(?:\s*\*\s*(\d+))?$/i))) {
      const amt = m[1] ? num(m[1], 1) : (m[2] ? num(m[2], 1) : 1);
      return BLK('roll', { kind: 'Temp HP', count: 0, die: 'flat', scaling: 'perCL', amount: amt, per: 1, start: 1, max: amt * 20 });
    }
    return null;
  }
  function ruleFlagBlocksFromSrd(rf) {
    if (!rf || typeof rf !== 'object') return [];
    const out = [];
    const immMap = [
      ['immuneFear', 'Fear'],
      ['immuneMindAffecting', 'Mind-Affecting'],
      ['immuneDeathEffects', 'Death Effects'],
      ['immunePoison', 'Poison'],
      ['immuneDisease', 'Disease'],
      ['immuneParalysis', 'Paralysis'],
      ['immuneSleep', 'Sleep'],
      ['immuneNegativeEnergy', 'Negative Energy & Energy Drain'],
      ['immuneMagicMissile', 'Magic Missile'],
      ['immuneMentalControl', 'Mental Control']
    ];
    immMap.forEach((pair) => {
      if (rf[pair[0]]) out.push(BLK('defense', { mode: 'Immunity', what: pair[1] }));
    });
    if (rf.freedomOfMovement) out.push(BLK('defense', { mode: 'Condition Immunity', what: 'Grapple, Paralysis & Movement Impediments (Freedom of Movement)' }));
    if (rf.extraAttackFullAttack) out.push(BLK('attack', { attackMode: 'extra', extraKind: 'extraFull', count: 1, rider: 'Extra attack on Full Attack (Haste)' }));
    if (rf.concealment || rf.missChance) out.push(BLK('defense', { mode: 'Concealment %', value: num(rf.concealment || rf.missChance, 20) }));
    if (rf.dr) {
      const dm = String(rf.dr).match(/^(\d+)\s*\/\s*(.+)$/);
      if (dm) out.push(BLK('defense', { mode: 'DR', value: num(dm[1], 5), what: dm[2].trim() }));
    } else if (rf.drAdamantine) {
      out.push(BLK('defense', { mode: 'DR', value: num(rf.drAdamantine, 10), what: 'adamantine' }));
    }
    if (typeof rf.sr === 'number' && rf.sr > 0) out.push(BLK('defense', { mode: 'Spell Resistance', srMode: 'flat', value: num(rf.sr, 15) }));
    else if (rf.srFormula) out.push(BLK('defense', { mode: 'Spell Resistance', srMode: 'level', value: 12 }));
    if (rf.darkvision || rf.darkvisionFt) out.push(BLK('defense', { mode: 'Sense / Movement', what: 'Darkvision ' + num(rf.darkvision || rf.darkvisionFt, 60) + ' ft.' }));
    if (rf.lowLightVision) out.push(BLK('defense', { mode: 'Sense / Movement', what: 'Low-Light Vision' }));
    if (rf.seeInvisibility) out.push(BLK('defense', { mode: 'Sense / Movement', what: 'See Invisibility' }));
    if (rf.trueSeeing) out.push(BLK('defense', { mode: 'Sense / Movement', what: 'True Seeing (120 ft.)' }));
    if (rf.uncannyDodge) out.push(BLK('defense', { mode: 'Sense / Movement', what: 'Uncanny Dodge' }));
    if (rf.flySpeed) out.push(BLK('defense', { mode: 'Sense / Movement', what: 'Fly ' + num(rf.flySpeed, 60) + ' ft.' }));
    if (rf.airWalk) out.push(BLK('defense', { mode: 'Sense / Movement', what: 'Air Walk' }));
    if (rf.waterBreathing) out.push(BLK('defense', { mode: 'Sense / Movement', what: 'Water Breathing' }));
    if (rf.waterWalk) out.push(BLK('defense', { mode: 'Sense / Movement', what: 'Water Walk' }));
    if (rf.actionRestriction) out.push(BLK('effect', { effectKind: 'rule', text: String(rf.actionRestriction) }));
    return out;
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
      const wObj = w.weapon || {};
      const handRaw = wObj.handedness || w.handedness;
      const wCost = (w.item && w.item.price != null) ? w.item.price : (w.gpValue != null ? w.gpValue : w.cost);
      const wDice = wObj.damageDice || wObj.dice || w.damage || '1d6';
      const wDmgType = cap1(String(wObj.dmgType || wObj.damageType || w.dmgType || 'Slashing').split(/[\s/]/)[0]);
      CAT.weapons.push({ id: w.id, name: w.name, cost: num(wCost), dice: wDice, critRange: num(wObj.baseCritRange != null ? wObj.baseCritRange : w.critRange, 20), critMult: num(wObj.critMultiplier != null ? wObj.critMultiplier : w.critMult, 2), category: /exotic/i.test(wObj.category || w.category) ? 'Exotic' : /martial/i.test(wObj.category || w.category) ? 'Martial' : 'Simple', handed: HANDED[handRaw] || handRaw || 'One-Handed', dmgType: wDmgType, weight: num(w.weight, 1), range: num(wObj.rangeIncrement != null ? wObj.rangeIncrement : w.rangeIncrement), wooden: /wood|staff|club|bow/i.test(w.name), ranged: /ranged/i.test(handRaw || ''), src: w.source || 'SRD', desc: w.shortDescription || '', raw: w });
      n++;
    });
    C.getByType('Armor').concat(C.getByType('Shield')).forEach((a) => {
      if (seenA.has(normName(a.name))) return;
      const aObj = a.armor || {};
      const isS = a.type === 'Shield' || aObj.armorType === 'Shield';
      const v3AcBlk = (a.effects || []).find((ef) => ef && ef.type === 'stat' && Array.isArray(ef.targets) && ef.targets.some((t) => /^ac\.(armor|shield)$/.test(t)));
      const aBonus = aObj.armorBonus != null ? num(aObj.armorBonus) : (v3AcBlk ? num(v3AcBlk.value) : 0);
      const aMaxDex = aObj.maxDex !== undefined ? (aObj.maxDex == null ? 99 : num(aObj.maxDex)) : (a.maxDex == null ? 99 : num(a.maxDex));
      const aAcp = aObj.armorCheckPenalty != null ? num(aObj.armorCheckPenalty) : num(a.checkPenalty);
      const aAsf = aObj.arcaneSpellFailure != null ? num(aObj.arcaneSpellFailure) : num(a.spellFailure);
      const aCost = (a.item && a.item.price != null) ? a.item.price : (a.gpValue != null ? a.gpValue : a.cost);
      CAT.armors.push({ id: a.id, name: a.name, cost: num(aCost), armorBonus: aBonus, maxDex: aMaxDex, acp: aAcp, asf: aAsf, type: isS ? 'Shield' : (aObj.armorType || a.category || 'Light'), speed: parseInt(aObj.speed || a.speed30, 10) || 30, kind: isS ? 'shield' : 'armor', weight: num(a.weight), wooden: /wood/i.test(a.name), src: a.source || 'SRD', desc: a.shortDescription || '', raw: a });
      n++;
    });
    const seenE = new Set(CAT.enchants.map((e) => normName(e.name)));
    (C.getEnhancements ? C.getEnhancements() : C.getByType('Enhancement')).forEach((e) => {
      if (seenE.has(normName(e.name)) || /Misc/.test(e.category || '')) return;
      const im = e.itemModifier || {};
      const effs = e.effects || [];
      const v3RollParts = effs.filter((b) => b && b.type === 'roll' && (!b.kind || b.kind === 'Damage')).map((b) => ({
        count: b.die === 'flat' ? num(b.count || b.flat, 1) : num(b.count, 1),
        die: b.die || 'd6',
        type: cap1(String(b.dmgType || 'Untyped')),
        crit: b.critRule || b.crit || 'normal',
        cond: b.condition || ''
      }));
      const v3StatMods = [];
      effs.forEach((b) => {
        if (b && b.type === 'stat' && Number.isFinite(Number(b.value)) && Number(b.value) !== 0) {
          (Array.isArray(b.targets) ? b.targets : (b.target ? [b.target] : [])).forEach((t) => v3StatMods.push({ target: t, value: num(b.value), type: cap1(b.btype || b.bonusType || 'Untyped') }));
        }
      });
      // Defensive riders come straight from the record's V3 defense blocks (no per-ability code).
      const eff = { parts: v3RollParts.length ? v3RollParts : undefined, keen: !!(im.keen || (e.ruleFlags && e.ruleFlags.keen)), mods: v3StatMods };
      effs.forEach((b) => {
        if (!b || b.type !== 'defense') return;
        if (b.mode === 'Energy Resistance') eff.energy = { type: cap1(String(b.what || '')), value: num(b.value) };
        else if (b.mode === 'Damage Reduction') eff.dr = { value: num(b.value), bypass: String(b.what || b.bypass || 'magic').replace(/^[\/]/, '') };
        else if (b.mode === 'Spell Resistance') eff.sr = num(b.value);
      });
      const sw = effs.find((b) => b && b.type === 'effect' && (b.label || b.text) && !(b.flag === 'keen'));
      const hasMech = eff.parts || eff.keen || v3StatMods.length || eff.energy || eff.dr || eff.sr;
      if (sw) eff.badge = String(sw.label || sw.text);
      else if (!hasMech) eff.badge = short(e.shortDescription || e.text || '', 80);
      CAT.enchants.push({ id: e.id, name: e.name, raw: e, plus: num(im.enhancementIncrease != null ? im.enhancementIncrease : e.enhIncrease), gp: num(im.flatGp != null ? im.flatGp : e.flatCost), effect: eff, desc: e.shortDescription || stripHtml(e.text || e.description).slice(0, 160), src: e.source || 'SRD' });
      seenE.add(normName(e.name)); n++;
    });
    const groups = {};
    (C.getCrystals ? C.getCrystals() : C.getByType('AugmentationCrystal')).forEach((c) => {
      const m = String(c.name).match(/^(.*?),\s*(Least|Lesser|Greater)$/i);
      const baseN = m ? m[1] : c.name, tier = m ? m[2].toLowerCase() : 'least';
      const cSlot = (c.item && c.item.slot) || (c.itemModifier && c.itemModifier.appliesTo) || c.slot || '';
      const g = groups[baseN] = groups[baseN] || { id: 'crys-' + slug(baseN), name: baseN, on: /Weapon/i.test(cSlot) ? 'weapon' : /Shield/i.test(cSlot) ? 'shield' : 'armor+shield', cost: [null, null, null], tiers: ['', '', ''], parts: [null, null, null], src: c.source || 'MIC' };
      const ti = CRYSTAL_TIERS.indexOf(tier);
      g.cost[ti] = num((c.item && c.item.price != null) ? c.item.price : (c.itemModifier && c.itemModifier.flatGp != null ? c.itemModifier.flatGp : c.cost)); g.tiers[ti] = c.shortDescription || stripHtml(c.text || c.description).slice(0, 140);
      const rBlk = (c.effects || []).find((b) => b && b.type === 'roll' && (!b.kind || b.kind === 'Damage'));
      if (rBlk) { g.parts[ti] = [rBlk.die === 'flat' ? 0 : num(rBlk.count, 1), rBlk.die === 'flat' ? num(rBlk.count || rBlk.flat, 1) : (rBlk.die || 'd6')]; g.ptype = cap1(String(rBlk.dmgType || 'Untyped')); g.cond = rBlk.condition || ''; }
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
      const sp = s.spell || {}, dl = s.delivery || {};
      const lvlTxt = Array.isArray(sp.classLevels) && sp.classLevels.length
        ? sp.classLevels.map((cl) => (CLASS_ABBR[cl.class] || cl.class) + ' ' + cl.level).join(', ')
        : levelTextFromLearned(s.learnedAt);
      const firstLvl = Array.isArray(sp.classLevels) && sp.classLevels[0] ? num(sp.classLevels[0].level, 1) : num(s.level, 1);
      const svTxt = (dl.save && dl.save.type && dl.save.type !== 'None') ? (dl.save.type + ' ' + (dl.save.effect || '')).trim() : (s.save || '');
      const row = { id: s.id, name: s.name, levelText: lvlTxt, level: firstLvl, school: sp.school || s.category || s.school || 'Universal', action: cap1(String(dl.action || s.castingTime || 'standard').split(' ')[0]), range: dl.range || s.range || '', save: svTxt, desc: s.shortDescription || '', src: s.source || 'SRD', raw: s };
      const i = CAT.spells.findIndex((x) => normName(x.name) === normName(s.name));
      if (i >= 0) CAT.spells[i] = Object.assign(row, { id: CAT.spells[i].id, levelText: row.levelText || CAT.spells[i].levelText }); else if (!seenS.has(normName(s.name))) CAT.spells.push(row);
      n++;
    });
    const seenF = new Set(CAT.feats.map((f) => normName(f.name)));
    (C.getAllFeats ? C.getAllFeats() : C.getByType('Feat')).forEach((f) => {
      if (seenF.has(normName(f.name))) return;
      const tags = Array.isArray(f.tags) ? f.tags.slice() : [];
      if (f.isFighterBonusFeat && tags.indexOf('#FighterBonus') < 0) tags.push('#FighterBonus');
      if (f.category === 'Metamagic' && tags.indexOf('#Metamagic') < 0) tags.push('#Metamagic');
      if (f.category === 'Item Creation' && tags.indexOf('#ItemCreation') < 0) tags.push('#ItemCreation');
      const prTxt = (f.prerequisites && f.prerequisites.text) || (typeof f.prerequisites === 'string' ? f.prerequisites : '') || f.prereq || '';
      CAT.feats.push({ id: f.id, name: f.name, tags: tags, prereq: prTxt, desc: f.shortDescription || '', src: f.source || 'SRD', raw: f });
      n++;
    });
    C.getByType('SpecialAbility').forEach((x) => { CAT.special.push({ id: x.id, name: x.name, desc: x.shortDescription || '', src: x.source || 'SRD', cat: x.category || 'Special Ability' }); n++; });
    C.getByType('ClassAbility').forEach((x) => { if (!CAT.classFeatures.some((c) => normName(c.name) === normName(x.name))) { CAT.classFeatures.push({ id: x.id, name: x.name, abilityType: cap1(x.abilityType || 'ex').replace(/^(Ex|Su|Sp).*/i, (m) => m.slice(0, 2)), desc: x.shortDescription || '', src: x.source || 'SRD' }); n++; } });
    (C.getAllDomains ? C.getAllDomains() : C.getByType('Domain')).forEach((d) => {
      const gr = d.grants || {};
      const gpTxt = (gr.grantedPower && gr.grantedPower.text) || (d.grantedPower && d.grantedPower.description) || d.shortDescription || '';
      const spList = Array.isArray(gr.spellLadder) ? gr.spellLadder.slice().sort((a, b) => a.level - b.level).map((s) => s.spell).filter(Boolean) : (d.spells || []).sort((a, b) => a.level - b.level).map((s) => s.name);
      const row = { id: d.id, name: d.name, grantedPower: gpTxt, spells: spList, src: d.source || 'SRD', raw: d };
      const i = CAT.domains.findIndex((x) => normName(x.name) === normName(d.name));
      if (i >= 0) CAT.domains[i] = row; else CAT.domains.push(row);
      n++;
    });
    C.getByType('MagicItem').concat(C.getByType('Consumable')).concat(C.getByType('Gear')).concat(C.getByType('Ammo')).forEach((x) => { CAT.magicItems.push(x); n++; });
    C.getByType('Class').forEach((x) => { CAT.classes.push(x); n++; });
    CAT.races = C.getByType('Race').concat(C.getByType('Template')); n += CAT.races.length;
    CAT.subsystems = C.getByType('Maneuver').concat(C.getByType('Power')).concat(C.getByType('Soulmeld')).concat(C.getByType('Vestige')).concat(C.getByType('Mystery')).concat(C.getByType('Utterance')); n += CAT.subsystems.length;
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
    const raw = String(d || '').trim();
    const dismiss = /\(\s*D\s*\)/i.test(raw);
    const t = raw.replace(/\s*\(\s*D\s*\)\s*/gi, '').trim();
    if (dismiss) l.dismissible = true;
    let m;
    if (!t || /instant/i.test(t)) l.duration = 'instant';
    else if (/permanent/i.test(t)) l.duration = 'permanent';
    else if (/10 min\.?\s*\/\s*level/i.test(t)) l.duration = 'tenMinPerLevel';
    else if ((m = t.match(/^(\d+)?\s*rounds?\s*\/\s*level/i))) { l.duration = 'roundsPerLevel'; l.durValue = num(m[1], 1); }
    else if ((m = t.match(/^(\d+)?\s*min(ute)?s?\.?\s*\/\s*level/i))) { l.duration = 'minPerLevel'; l.durValue = num(m[1], 1); }
    else if ((m = t.match(/^(\d+)?\s*hours?\s*\/\s*level/i))) { l.duration = 'hourPerLevel'; l.durValue = num(m[1], 1); }
    else if ((m = t.match(/^(\d+)\s*rounds?$/i))) { l.duration = 'rounds'; l.durValue = num(m[1], 1); }
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
  function hydrate(x, kindHint) {
    if (!x || typeof x !== 'object') return null;
    const kh = String(kindHint || '').toLowerCase();
    const rawT = x.type || (x.learnedAt ? 'Spell' : '');
    const t = rawT || (kh === 'spell' ? 'Spell' : kh === 'maneuver' ? 'Maneuver' : (kh === 'psionic' || kh === 'psionics') ? 'Power' : kh === 'incarnum' ? 'Soulmeld' : kh === 'pactmagic' ? 'Vestige' : kh === 'shadowmagic' ? 'Mystery' : kh === 'truenaming' ? 'Utterance' : kh === 'feat' ? 'Feat' : kh === 'boon' ? 'Feat' : kh === 'class' ? 'Class' : kh === 'race' ? 'Race' : kh === 'monster' ? 'Monster' : '');
    if (x.schemaVersion === 3 && (x.blueprint || x.monster || x.spell || x.weapon || x.armor || x.itemModifier || x.progression || x.race || x.grants || Array.isArray(x.effects))) {
      if (t === 'Weapon' || x.blueprint === 'weapon') {
        let w = byId(CAT.weapons, x.id || x.baseItemId) || CAT.weapons.find((y) => normName(baseName(y)) === normName(x.name));
        if (!w && x.name) {
          const dp = (x.damageParts || [])[0] || {};
          const wObj = x.weapon || {};
          const handRaw = wObj.handedness || x.handedness;
          w = { id: x.id || ('wpn-' + slug(x.name)), name: x.name, cost: num((x.item && x.item.price != null) ? x.item.price : (x.gpValue != null ? x.gpValue : x.cost)), dice: wObj.damageDice || wObj.dice || dp.dice || x.damage || '1d6', critRange: num(wObj.baseCritRange != null ? wObj.baseCritRange : x.critRange, 20), critMult: num(wObj.critMultiplier != null ? wObj.critMultiplier : x.critMult, 2), category: /exotic/i.test(wObj.category || x.category) ? 'Exotic' : /martial/i.test(wObj.category || x.category) ? 'Martial' : 'Simple', handed: HANDED[handRaw] || handRaw || 'One-Handed', dmgType: cap1(String(wObj.dmgType || wObj.damageType || dp.type || x.dmgType || 'Slashing').split(/[\s/]/)[0]), weight: num(x.weight, 1), range: num(wObj.rangeIncrement != null ? wObj.rangeIncrement : (x.rangeIncrement || x.range)), wooden: /wood|staff|club|bow/i.test(x.name), ranged: /ranged/i.test(handRaw || ''), src: x.source || 'SRD', desc: x.shortDescription || '', raw: x };
          CAT.weapons.push(w);
        }
      } else if (t === 'Armor' || t === 'Shield' || x.blueprint === 'armor') {
        let a = byId(CAT.armors, x.id || x.baseItemId) || CAT.armors.find((y) => normName(y.name) === normName(x.name));
        if (!a && x.name) {
          const aObj = x.armor || {};
          const isS = t === 'Shield' || aObj.armorType === 'Shield';
          a = { id: x.id || ('arm-' + slug(x.name)), name: x.name, cost: num((x.item && x.item.price != null) ? x.item.price : x.cost), armorBonus: num(aObj.armorBonus != null ? aObj.armorBonus : x.armorBonus, 0), maxDex: aObj.maxDex !== undefined ? (aObj.maxDex == null ? 99 : num(aObj.maxDex)) : (x.maxDex == null ? 99 : num(x.maxDex)), acp: num(aObj.armorCheckPenalty != null ? aObj.armorCheckPenalty : (x.checkPenalty != null ? x.checkPenalty : x.acp)), asf: num(aObj.arcaneSpellFailure != null ? aObj.arcaneSpellFailure : (x.spellFailure != null ? x.spellFailure : x.asf)), type: isS ? 'Shield' : (aObj.armorType || x.category || 'Light'), speed: parseInt(aObj.speed || x.speed30, 10) || 30, kind: isS ? 'shield' : 'armor', weight: num(x.weight), wooden: /wood/i.test(x.name), src: x.source || 'SRD', desc: x.shortDescription || '', raw: x };
          CAT.armors.push(a);
        }
      }
      const v3En = fromCanonicalV3(x);
      setOrigin(v3En, x, t || x.type || v3En.blueprint);
      return v3En;
    }
    let e;
    if (t === 'Weapon') {
      e = blankEntry('weapon');
      e.name = x.name || '';
      e.text = stripHtml(x.description || x.shortDescription || '');
      let w = byId(CAT.weapons, x.id || x.baseItemId) || CAT.weapons.find((y) => normName(baseName(y)) === normName(x.name));
      if (!w && x.name) {
        const dp = (x.damageParts || [])[0] || {};
        w = { id: x.id || ('wpn-' + slug(x.name)), name: x.name, cost: num(x.cost), dice: dp.dice || x.damage || '1d6', critRange: num(x.critRange, 20), critMult: num(x.critMult, 2), category: /exotic/i.test(x.category) ? 'Exotic' : /martial/i.test(x.category) ? 'Martial' : 'Simple', handed: HANDED[x.handedness] || x.handedness || 'One-Handed', dmgType: cap1(String(dp.type || x.dmgType || 'Slashing').split(/[\s/]/)[0]), weight: num(x.weight, 1), range: num(x.rangeIncrement || x.range), wooden: /wood|staff|club|bow/i.test(x.name), ranged: x.handedness === 'ranged', src: x.source || 'SRD', desc: x.shortDescription || '' };
        CAT.weapons.push(w);
      }
      e.chassis = blankChassis('weapon', w ? w.id : 'longsword');
      if (x.enhancementBonus) e.chassis.enhancement = num(x.enhancementBonus, 0);
      e.effects = statBlocksFromSrd(x.modifiers).concat(ruleFlagBlocksFromSrd(x.ruleFlags));
    } else if (t === 'Armor' || t === 'Shield') {
      e = blankEntry('armor');
      e.name = x.name || '';
      e.text = stripHtml(x.description || x.shortDescription || '');
      let a = byId(CAT.armors, x.id || x.baseItemId) || CAT.armors.find((y) => normName(y.name) === normName(x.name));
      if (!a && x.name) {
        const isS = t === 'Shield', ab = (x.modifiers || []).find((m) => /^ac\.(armor|shield)$/.test(m.target));
        a = { id: x.id || ('arm-' + slug(x.name)), name: x.name, cost: num(x.cost), armorBonus: ab ? num(ab.value) : num(x.armorBonus, 0), maxDex: x.maxDex == null ? 99 : num(x.maxDex), acp: num(x.checkPenalty != null ? x.checkPenalty : x.acp), asf: num(x.spellFailure != null ? x.spellFailure : x.asf), type: isS ? 'Shield' : (x.category || 'Light'), speed: parseInt(x.speed30, 10) || 30, kind: isS ? 'shield' : 'armor', weight: num(x.weight), wooden: /wood/i.test(x.name), src: x.source || 'SRD', desc: x.shortDescription || '' };
        CAT.armors.push(a);
      }
      e.chassis = blankChassis('armor', a ? a.id : 'chain_shirt');
      if (x.enhancementBonus) e.chassis.enhancement = num(x.enhancementBonus, 0);
      e.item.subtype = t;
      e.effects = statBlocksFromSrd(x.modifiers).concat(ruleFlagBlocksFromSrd(x.ruleFlags));
    }
    else if (t === 'MagicItem' || t === 'Consumable') {
      e = blankEntry('wondrous');
      e.name = x.name; e.text = stripHtml(x.description) || x.shortDescription || '';
      const nm = String(x.name);
      e.item.subtype = x.category === 'Rod' ? 'Rod' : x.category === 'Staff' ? 'Staff' : x.slot === 'Ring' ? 'Ring' : /potion|oil/i.test(nm) ? 'Potion / Oil' : /scroll/i.test(nm) ? 'Scroll' : /wand/i.test(nm) ? 'Wand' : 'Wondrous Item';
      e.item.slot = SLOT_MAP[x.slot] || (BODY_SLOTS.indexOf(x.slot) >= 0 ? x.slot : 'Slotless');
      e.item.consumable = t === 'Consumable' || /Potion|Scroll|Wand/.test(e.item.subtype);
      e.item.price = num(x.cost != null ? x.cost : x.gpValue); e.item.cl = num(x.casterLevel != null ? x.casterLevel : x.cl);
      e.effects = statBlocksFromSrd(x.modifiers).concat(ruleFlagBlocksFromSrd(x.ruleFlags));
    } else if (['Spell', 'Power', 'Maneuver', 'Invocation', 'Soulmeld', 'Vestige', 'Mystery', 'Utterance'].indexOf(t) >= 0) {
      e = blankEntry('spell');
      e.name = x.name;
      e.text = stripHtml(x.description || x.benefit || '') || x.shortDescription || '';
      if (t === 'Power') {
        e.spell.system = 'psionic';
        e.spell.discipline = PSIONIC_DISCIPLINES.find((k) => k.toLowerCase() === String(x.discipline || x.category || '').toLowerCase()) || 'Psychokinesis';
        e.spell.maneuverLvl = num(x.level, 1);
        e.spell.ppCost = num(x.powerPointsCost != null ? x.powerPointsCost : (x.ppCost != null ? x.ppCost : Math.max(1, num(x.level, 1) * 2 - 1)), 1);
        e.spell.augmentable = !!(x.augment || /augment/i.test(e.text));
      } else if (t === 'Maneuver') {
        e.spell.system = 'maneuver';
        e.spell.discipline = TOB_DISCIPLINES.find((k) => k.toLowerCase() === String(x.discipline || x.category || '').toLowerCase()) || 'Iron Heart';
        e.spell.maneuverType = MANEUVER_TYPES.find((k) => k.toLowerCase() === String(x.maneuverType || x.subschool || 'Strike').toLowerCase()) || 'Strike';
        e.spell.maneuverLvl = num(x.level, 1);
      } else if (t === 'Invocation') {
        e.spell.system = 'invocation';
        e.spell.invGrade = INV_GRADES.find((k) => k.toLowerCase() === String(x.grade || 'Least').toLowerCase()) || 'Least';
        e.spell.maneuverLvl = num(x.level, 1);
      } else if (t === 'Soulmeld') {
        e.spell.system = 'soulmeld';
        e.spell.chakraSlots = Array.isArray(x.chakras) ? x.chakras.join(' / ') : (x.chakraSlots || 'Arms / Totem');
      } else if (t === 'Vestige') {
        e.spell.system = 'vestige';
        e.spell.vestigeLvl = num(x.level, 1);
        e.spell.bindingDc = num(x.bindingDC || x.bindingDc, 15);
      } else if (t === 'Utterance') {
        e.spell.system = 'utterance';
        e.spell.lexicon = TRUENAME_LEXICONS.find((k) => k.toLowerCase() === String(x.lexicon || '').toLowerCase()) || 'Evolving Mind';
        e.spell.maneuverLvl = num(x.level, 1);
      } else if (t === 'Mystery') {
        e.spell.system = 'mystery';
        e.spell.mysteryTier = MYSTERY_TIERS.find((k) => k.toLowerCase() === String(x.tier || '').toLowerCase()) || 'Apprentice';
        e.spell.mysteryPath = x.path || '';
        e.spell.maneuverLvl = num(x.level, 1);
      } else {
        const lt = levelTextFromLearned(x.learnedAt) || x.levelText || '';
        e.spell.classes = lt ? lt.split(', ').map((s) => { const m = s.match(/^(.*) (\d+)$/); return { cls: m ? m[1] : s, lvl: m ? num(m[2]) : 1 }; }) : [{ cls: 'Sor/Wiz', lvl: num(x.level, 1) }];
        e.spell.school = SCHOOLS.indexOf(x.category || x.school) >= 0 ? (x.category || x.school) : 'Universal';
        const comps = Array.isArray(x.components) ? x.components : [];
        e.spell.comps = { V: comps.indexOf('V') >= 0, S: comps.indexOf('S') >= 0, M: comps.indexOf('M') >= 0, F: comps.indexOf('F') >= 0, DF: comps.indexOf('DF') >= 0, XP: comps.indexOf('XP') >= 0 };
        const firstLvl = e.spell.classes[0] ? num(e.spell.classes[0].lvl, 1) : num(x.level, 1);
        e.lifecycle.use = Object.assign(blankUse('spellSlot'), { slotLevel: firstLvl });
      }
      const descRaw = Array.isArray(x.descriptors) ? x.descriptors.join(', ') : String(x.descriptors || '');
      e.spell.descriptors = descRaw.split(/,\s*|\s+or\s+/).map((d) => DESCRIPTORS.find((k) => k.toLowerCase() === d.trim().toLowerCase())).filter(Boolean);
      const d = e.delivery;
      d.action = ACTION_MAP[String(x.castingTime || x.initiationAction || 'standard').toLowerCase().split(/[\s-]/)[0]] || 'Standard';
      d.range = RANGE_MAP[String(x.range || '').toLowerCase()] || x.range || '';
      d.area = x.area || x.target || '';
      d.attack = { rsak: 'ranged-touch', msak: 'melee-touch', rwak: 'weapon', mwak: 'weapon' }[x.actionType] || 'none';
      d.attackOn = d.attack !== 'none';
      d.save = Object.assign(d.save, parseSave(x.save || x.savingThrow));
      d.sr = x.sr === true ? (/harmless/i.test(String(x.save || '')) ? 'Yes (harmless)' : 'Yes') : x.sr === false ? 'No' : String(x.sr || x.spellResistance || 'Yes');
      parseDuration(e.lifecycle, x.duration);
      const rb = rollBlockFromSrd(x.damageParts, e.spell.descriptors);
      if (rb) e.effects.push(rb);
      statBlocksFromSrd(x.modifiers).forEach((sb) => e.effects.push(sb));
      ruleFlagBlocksFromSrd(x.ruleFlags).forEach((fb) => e.effects.push(fb));
      const thp = tempHpBlockFromSrd(x.tempHpFormula);
      if (thp) e.effects.push(thp);
    } else if (t === 'Feat' || t === 'Flaw') {
      e = blankEntry('feat');
      if (kh === 'boon') e.featKind = 'boon';
      e.name = x.name; e.text = stripHtml(x.benefit || x.description || x.shortDescription || '').slice(0, 600);
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
      e.effects = statBlocksFromSrd(x.modifiers).concat(ruleFlagBlocksFromSrd(x.ruleFlags));
    } else if (t === 'Race' || t === 'Template') {
      e = blankEntry('race');
      e.name = x.name;
      e.race.kind = t === 'Template' || kh === 'template' ? 'template' : 'race';
      e.race.size = CREATURE_SIZES.indexOf(x.size) >= 0 ? x.size : 'Medium';
      e.race.speed = num(x.speed || x.baseSpeed, 30);
      e.race.la = num(x.levelAdjustment != null ? x.levelAdjustment : x.la, 0);
      e.text = stripHtml(x.description || x.shortDescription || '');
      e.effects = statBlocksFromSrd(x.modifiers).concat(ruleFlagBlocksFromSrd(x.ruleFlags));
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
      e.text = stripHtml(x.description || x.shortDescription || '');
    } else if (t === 'Domain') {
      e = blankEntry('domain');
      e.name = x.name + ' Domain';
      e.grants.grantedPower = (x.grantedPower && x.grantedPower.description) || x.grantedPower || x.shortDescription || '';
      const sp = (x.spells || []).slice().sort((a, b) => num(a.level) - num(b.level)).map((s) => (typeof s === 'string' ? s : s.name));
      e.grants.ladder = sp.concat(['', '', '', '', '', '', '', '', '']).slice(0, 9);
    } else return null;
    setOrigin(e, x, t || 'Entry');
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
      (o.enter ? ' data-enter="' + o.enter + '"' : '') + (o.fx ? ' data-fx="1"' : '') + ' value="' + esc(val) + '">' +
      (o.fx && !o.scope ? '<div class="fs-hint" style="margin-top:3px">' + live('fx-preview', path) + '</div>' : '');
  }
  function opts(list, val) { return list.map((x) => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join(''); }
  function sel(path, val, list, o) { o = o || {}; return '<select class="fs-sel' + (o.narrow ? ' fs-narrow' : '') + '" ' + bindAttr(o.scope) + '="' + path + '"' + (o.num ? ' data-t="num"' : '') + (o.style ? ' style="' + o.style + '"' : '') + '>' + opts(list, val) + '</select>'; }
  function selGroups(path, val, groups) { return '<select class="fs-sel" data-bind="' + path + '">' + groups.map((g) => '<optgroup label="' + esc(g[0]) + '">' + opts(g[1], val) + '</optgroup>').join('') + '</select>'; }
  function chk(path, val, label, o) { o = o || {}; return '<label class="fs-check' + (val ? ' on' : '') + '"><input type="checkbox" ' + bindAttr(o.scope) + '="' + path + '" data-t="bool"' + (val ? ' checked' : '') + '>' + label + '</label>'; }
  const field = (label, html, style) => '<label class="fs-field"' + (style ? ' style="' + style + '"' : '') + '><span>' + esc(label) + '</span>' + html + '</label>';
  const btn = (action, label, cls, data) => '<button type="button" class="fs-btn ' + (cls || '') + '" data-action="' + action + '"' + Object.keys(data || {}).map((k) => ' data-' + k + '="' + esc(data[k]) + '"').join('') + '>' + label + '</button>';
  const live = (kind, args) => '<span data-live="' + kind + '" data-args="' + esc(args == null ? '' : args) + '">' + (LIVE[kind] ? LIVE[kind](String(args == null ? '' : args)) : '') + '</span>';

  const NAT_WPN_LIST = ['Claw', 'Bite', 'Slam', 'Gore', 'Tail Slap', 'Tentacle', 'Wing', 'Talon', 'Sting', 'Hoof'];
  const OATH_RULES = ['Unarmored, No Shield & Light Load', 'No Metal Armor or Shields', 'Zero Magic Items & Wealth Cap (VoP)', 'Nonlethal / Never Harm Living Foe (VoPeace)', 'Paladin Code of Conduct'];
  const BASE_CLASS_LIST = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard', 'Warblade', 'Crusader', 'Swordsage', 'Duskblade', 'Beguiler', 'Swashbuckler', 'Hexblade', 'Binder', 'Incarnate', 'Totemist', 'Psion', 'Psychic Warrior', 'Bloodrager', 'Magus', 'Ur-Priest', 'Spellthief', 'Truenamer', 'Shadowcaster'];
  const DEF_LIST = ['Fear', 'Poison', 'Sleep', 'Paralysis', 'Disease', 'Mind-Affecting', 'Death Effects', 'Low-Light Vision', 'Darkvision 60 ft.', 'Blindsense 30 ft.', 'Tremorsense 30 ft.', 'Uncanny Dodge', 'Pounce (Full Attack on Charge)', 'evil or good', 'magic', 'Fire', 'Cold', 'Acid', 'Electricity', 'Sonic'];
  const CONDITION_VOCAB_GROUPS = [
    ['Auto-Evaluated Tactical Toggles', [
      ['charging', 'charging — On a Charge'],
      ['flanking', 'flanking — While Flanking'],
      ['fightingDefensively', 'fightingDefensively — Fighting Defensively'],
      ['totalDefense', 'totalDefense — Total Defense'],
      ['powerAttack', 'powerAttack — Power Attack Active'],
      ['combatExpertise', 'combatExpertise — Combat Expertise Active'],
      ['higherGround', 'higherGround — Higher Ground'],
      ['pointBlankShot', 'pointBlankShot — Within 30 ft. (PBS)'],
      ['rapidShot', 'rapidShot — Rapid Shot'],
      ['manyshot', 'manyshot — Manyshot'],
      ['sneakAttack', 'sneakAttack — Sneak Attack']
    ]],
    ['Auto-Evaluated Combat & Gear State', [
      ['notFlatFooted', 'notFlatFooted — While Not Flat-Footed'],
      ['unarmored', 'unarmored — Wearing No Armor'],
      ['lightArmor', 'lightArmor — Wearing Light Armor'],
      ['lightOrNoArmor', 'lightOrNoArmor — Light or No Armor'],
      ['notHeavyArmor', 'notHeavyArmor — Not Wearing Heavy Armor'],
      ['noShield', 'noShield — Carrying No Shield'],
      ['unarmoredNoShield', 'unarmoredNoShield — Unarmored & No Shield'],
      ['unencumbered', 'unencumbered — Light Load Only'],
      ['wieldingMeleeWeapon', 'wieldingMeleeWeapon — Wielding Melee Weapon'],
      ['wieldingTwoWeapons', 'wieldingTwoWeapons — Two-Weapon / Double Weapon'],
      ['hp <= 50%', 'hp <= 50% — Bloodied / Half HP or Less']
    ]],
    ['@Choice & Weapon / School Qualifiers', [
      ['wieldingChosenWeapon', 'wieldingChosenWeapon — Wielding Chosen Weapon'],
      ['wieldingChosenShield', 'wieldingChosenShield — Wielding Chosen Shield'],
      ['castingChosenSchool', 'castingChosenSchool — Casting Chosen School'],
      ['vsAoOFromMovement', 'vsAoOFromMovement — vs. AoO from Movement']
    ]],
    ['Auto-Evaluated Alignment Atoms', [
      ['Good Alignment', 'Good Alignment'],
      ['Evil Alignment', 'Evil Alignment'],
      ['Lawful Alignment', 'Lawful Alignment'],
      ['Chaotic Alignment', 'Chaotic Alignment']
    ]],
    ['Situational Notes (Shown on Sheet, Not Added to Base Total)', [
      ['vs. Fear', 'vs. Fear'],
      ['vs. Poison', 'vs. Poison'],
      ['vs. Mind-Affecting', 'vs. Mind-Affecting'],
      ['vs. Enchantment', 'vs. Enchantment'],
      ['vs. Undead', 'vs. Undead'],
      ['vs. Evil', 'vs. Evil'],
      ['vs. Traps', 'vs. Traps'],
      ['vs. Giants', 'vs. Giants']
    ]]
  ];
  const KNOWN_AUTO_COND_ATOMS = CONDITION_VOCAB_GROUPS.slice(0, 4).reduce((acc, g) => acc.concat(g[1].map((x) => x[0])), []);
  function editDistance(a, b) {
    const s = String(a || '').toLowerCase(), t = String(b || '').toLowerCase();
    if (s === t) return 0;
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    const prev = [];
    for (let j = 0; j <= t.length; j++) prev[j] = j;
    for (let i = 1; i <= s.length; i++) {
      let diag = prev[0]; prev[0] = i;
      for (let j = 1; j <= t.length; j++) {
        const tmp = prev[j];
        prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (s[i - 1] === t[j - 1] ? 0 : 1));
        diag = tmp;
      }
    }
    return prev[t.length];
  }
  function closestAutoCondAtom(raw) {
    const q = String(raw || '').trim();
    if (!q || q.length < 3 || q.length > 28) return '';
    let best = '', bestD = 99;
    KNOWN_AUTO_COND_ATOMS.forEach((atom) => {
      const d = editDistance(q, atom);
      if (d > 0 && d <= 2 && d < bestD) { bestD = d; best = atom; }
    });
    return best;
  }
  function getRE() {
    return (typeof window !== 'undefined' && window.RuleEngine) || (typeof globalThis !== 'undefined' && globalThis.RuleEngine) || null;
  }
  function classifyConditionStatus(rawCond, blockType, condKind) {
    if (condKind === 'activation') return { kind: 'situational', cls: 'amber', label: '⚠ Activation Note', tip: 'Listed as a situational reminder unless moved into a selectable Combat Mode.' };
    if (condKind === 'situational') return { kind: 'situational', cls: 'amber', label: '⚠ Situational Note', tip: 'Displayed on the sheet as a situational modifier; never added to always-on totals.' };
    if (!rawCond || (typeof rawCond === 'string' && !rawCond.trim())) {
      if (condKind && WHEN_COND_LABELS[condKind]) return { kind: 'context', cls: 'sky', label: '🎯 Auto Context', tip: 'Automatically checked against ' + WHEN_COND_LABELS[condKind] + '.' };
      if (condKind === 'state') return { kind: 'empty', cls: 'amber', label: '⚠ Enter State', tip: 'Pick a vocabulary condition (e.g. charging, unarmored) or switch Condition Kind to Situational.' };
      return { kind: 'always', cls: 'dim', label: 'Always On', tip: 'Unconditional — always included in character totals.' };
    }
    if (typeof rawCond === 'object' || /^toggle:[A-Za-z0-9_.-]+$/i.test(String(rawCond).trim())) {
      return { kind: 'auto', cls: 'emerald', label: '✅ Auto (Toggle)', tip: 'Evaluated automatically when this toggle is active.' };
    }
    const txt = String(rawCond).trim();
    const RE = getRE();
    const evalRes = (RE && typeof RE._evalV3Condition === 'function') ? RE._evalV3Condition(txt, 'when', {}, {}, S.entry) : 'unrecognized';
    if (blockType === 'roll') {
      if (evalRes === true || evalRes === false || evalRes === 'qualifier') {
        return { kind: 'rollSituationalAuto', cls: 'amber', label: '⚠ Situational Rider', wrapHint: true, tip: 'Inline Roll conditions are always listed as situational riders. Click Wrap in When to apply this roll automatically while ' + txt + '.' };
      }
      const rTypo = closestAutoCondAtom(txt);
      if (rTypo) return { kind: 'unrecognized', cls: 'rose', label: '❓ Unrecognized ("' + rTypo + '"?)', tip: 'Looks like a typo for "' + rTypo + '". Roll conditions stay situational unless wrapped in a When block.' };
      return { kind: 'situational', cls: 'amber', label: '⚠ Situational Rider', tip: 'Kept out of base weapon/spell dice; shown as a situational damage/roll note.' };
    }
    if (evalRes === true || evalRes === false) {
      return { kind: 'auto', cls: 'emerald', label: '✅ Auto-Evaluated', tip: 'Closed-vocabulary condition: automatically evaluated by RuleEngine against sheet state & tactical toggles.' };
    }
    if (evalRes === 'qualifier') {
      return { kind: 'context', cls: 'sky', label: '🎯 Context / @Choice', tip: 'Automatically applied to the matching weapon, shield, spell school, or AoO context.' };
    }
    const typo = closestAutoCondAtom(txt);
    if (condKind === 'state' || condKind === 'bound' || condKind === 'levelTier') {
      return {
        kind: 'unrecognized', cls: 'rose',
        label: typo ? '❓ Unrecognized (Did you mean "' + typo + '"?)' : '❓ Unrecognized in Vocabulary',
        tip: 'Not in the closed condition vocabulary (ADR-055). Pick a known state atom or change Condition Kind to Equipment / Combat State (Situational).'
      };
    }
    if (typo) {
      return { kind: 'unrecognized', cls: 'rose', label: '❓ Unrecognized (Did you mean "' + typo + '"?)', tip: 'Not recognized as an auto-evaluated state; treated as a situational note unless corrected to "' + typo + '".' };
    }
    if (/^(vs\.?|against|on\s|while\s|when\s|against\s|in\s|during\s|until\s)/i.test(txt)) {
      return { kind: 'situational', cls: 'amber', label: '⚠ Situational Note', tip: 'Listed separately as a situational modifier badge on the sheet; not added to base totals.' };
    }
    return { kind: 'unrecognized', cls: 'amber', label: '❓ Unrecognized → Situational', tip: 'Outside the closed auto-condition vocabulary; safely listed as a situational note rather than always-on.' };
  }
  function condBadgeHtml(rawCond, blockType, condKind, blockPath) {
    const st = classifyConditionStatus(rawCond, blockType, condKind);
    const wrapBtn = (st.wrapHint && blockPath && !/\.(kids)\.\d+$/.test(blockPath))
      ? ' <button type="button" class="fs-btn fs-xs fs-ghost" data-action="wrap-cond-when" data-bp="' + esc(blockPath) + '" title="Wrap this Roll block in a When container so it triggers automatically">🔶 Wrap in When</button>'
      : '';
    return '<span class="fs-pill ' + st.cls + '" title="' + esc(st.tip) + '">' + esc(st.label) + '</span>' + wrapBtn;
  }
  function condFieldHtml(path, val, blockType, spanCls) {
    const strVal = val && typeof val === 'object' ? (val.toggle ? 'toggle:' + val.toggle : JSON.stringify(val)) : String(val || '');
    const blkPath = path.replace(/\.condition$/, '');
    const pickSel = '<select class="fs-sel fs-narrow" data-cond-pick="' + esc(path) + '" title="Pick from Condition Vocabulary" style="max-width:145px"><option value="">+ Vocabulary…</option>' +
      '<option value="__clear__">— Clear (Always On) —</option>' +
      CONDITION_VOCAB_GROUPS.map((g) => '<optgroup label="' + esc(g[0]) + '">' + opts(g[1], '') + '</optgroup>').join('') + '</select>';
    return F(
      blockType === 'roll' ? 'Condition / Rider' : 'Condition',
      inp(path, strVal, { list: 'fs-cond-vocab', ph: blockType === 'roll' ? 'vs. Undead / charging…' : 'charging / notFlatFooted / vs. Fear…' }) +
      pickSel +
      live('cond-badge', path + '|' + blockType + '|' + blkPath),
      spanCls
    );
  }

  const datalists = () => '<datalist id="fs-dice-list">' + opts(DIE_LIST.filter((d) => d !== 'flat'), '') + '</datalist><datalist id="fs-range-list">' + opts(RANGES, '') + '</datalist><datalist id="fs-area-list">' + opts(AREAS, '') + '</datalist>' +
    '<datalist id="fs-defense-list">' + opts(DEF_LIST, '') + '</datalist><datalist id="fs-deity-list">' + opts(CAT.deities.map((d) => d.name), '') + '</datalist><datalist id="fs-weapon-names">' + opts(CAT.weapons.map((w) => baseName(w)), '') + '</datalist><datalist id="fs-spell-names">' + opts(CAT.spells.slice(0, 800).map((s) => s.name), '') + '</datalist>' +
    '<datalist id="fs-pool-list">' + opts(allPools(), '') + '</datalist><datalist id="fs-natwpn-list">' + opts(NAT_WPN_LIST, '') + '</datalist><datalist id="fs-oath-list">' + opts(OATH_RULES, '') + '</datalist>' +
    '<datalist id="fs-branch-opts">' + opts(entryChoiceOptions(S.entry), '') + '</datalist>' +
    '<datalist id="fs-cond-vocab">' + opts(CONDITION_VOCAB_GROUPS.reduce((a, g) => a.concat(g[1].map((x) => x[0])), []), '') + '</datalist>' +
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
  const short = (s, n) => { const t = stripHtml(s); return t.length > (n || 260) ? t.slice(0, n || 260) + '…' : t; };
  const allTags = () => STANDARD_TAGS.flatMap((g) => g[1]).concat(S.livingTags.filter((t) => !STD_TAG_SET.has(t)));
  function presetSpotMeta(p) {
    if (p._spotMeta) return p._spotMeta;
    const en = p.build();
    const name = entryName(en);
    const mParen = p.label.match(/\(([^()]+)\)\s*$/);
    const mColon = !mParen && p.label.indexOf(':') >= 0 ? p.label.slice(p.label.indexOf(':') + 1).trim() : '';
    const sub = mParen ? mParen[1].trim() : mColon;
    const hdr = rawHeaderLine(en).join(' • ');
    const txt = stripHtml(en.text || '');
    const parts = [];
    [sub, hdr, txt].forEach((seg) => { if (seg && !parts.some((x) => x.toLowerCase().indexOf(seg.toLowerCase()) >= 0)) parts.push(seg); });
    p._spotMeta = { title: p.icon + ' ' + name, desc: short(parts.join(' — '), 280) };
    return p._spotMeta;
  }

  const SPOT = {
    load: {
      ph: '🔍 Open Existing SRD / Example Entry…',
      layers: ['All', 'Examples', 'SRD', 'MIC', 'Saved'],
      search(q, ctx, layer) {
        layer = layer || 'All';
        if (layer === 'Saved') return rank(S.templates, q, (t) => t.name, (t) => (t.facets || []).join(' '), 30).map((t) => SI('📌 Saved Templates', t.id, t.name, (BP_BY_ID[t.base] || {}).name || 'Template', 'Saved custom layout (' + t.facets.length + ' sections: ' + t.facets.join(', ') + '). Click to start a new entry from this template.', { tpl: t.id }));
        const guides = (layer === 'All' || layer === 'Examples')
          ? rank(GUIDE_RECIPES.map((g, gi) => ({ g: g, gi: gi })), q, (x) => x.g.title + ' ' + (x.g.entry && x.g.entry.name || ''), (x) => x.g.sub + ' ' + x.g.code, 10)
              .map((x) => SI('📖 Step-by-Step Archetype Examples', 'guide-' + x.gi, '📖 ' + x.g.title, 'Guide', x.g.sub + ' • ' + x.g.code, { guideIdx: x.gi }))
          : [];
        const pre = (layer === 'All' || layer === 'Examples')
          ? rank(PRESETS, q, (p) => p.label, (p) => presetSpotMeta(p).desc, layer === 'Examples' ? 50 : 36).map((p) => { const m = presetSpotMeta(p); return SI('⭐ Curated Example Entries', p.id, m.title, 'Example', m.desc, { preset: p.id }); })
          : [];
        if (layer === 'Examples' || (!String(q || '').trim() && layer === 'All')) return guides.concat(pre);
        const sNorm = String(q || '').trim().toLowerCase();
        const scoreName = (nm) => { const n = String(nm || '').toLowerCase(); return !sNorm ? 50 : n === sNorm ? 100 : n.indexOf(sNorm) === 0 ? 80 : n.indexOf(' ' + sNorm) >= 0 ? 60 : n.indexOf(sNorm) >= 0 ? 45 : 15; };
        const srdBuckets = [];
        const isMic = (x) => /Magic Item Compendium|MIC/i.test(String(x.src || x.source || ''));
        const add = (group, list, badgeFn, descFn, type, lim) => {
          const hits = rank(list.filter((x) => layer === 'All' || (layer === 'MIC' ? isMic(x) : !isMic(x))), q, (x) => x.name, descFn, lim || 6);
          if (!hits.length) return;
          srdBuckets.push({ best: scoreName(hits[0].name), items: hits.map((x) => SI(group, x.id, x.name, badgeFn(x), short(descFn(x), 280), { srd: x, type: type })) });
        };
        add('⚔️ Weapons', CAT.weapons, (x) => gp(x.cost), (x) => [x.category + ' ' + x.handed + (x.ranged ? ' Ranged (' + x.range + ' ft.)' : ' Melee'), x.dice + ' ' + x.dmgType + ' (' + (x.critRange < 20 ? x.critRange + '–20/' : '') + '×' + x.critMult + ')', stripHtml(x.desc || (x.raw && x.raw.description) || ''), x.src].filter(Boolean).join(' • '), 'Weapon');
        add('🛡️ Armor & Shields', CAT.armors, (x) => gp(x.cost), (x) => [x.type === 'Shield' ? 'Shield' : x.type + ' Armor', '+' + x.armorBonus + ' AC', 'Max Dex ' + (x.maxDex >= 99 ? '—' : '+' + x.maxDex), 'ACP ' + x.acp, 'ASF ' + x.asf + '%', stripHtml(x.desc || (x.raw && x.raw.description) || ''), x.src].filter(Boolean).join(' • '), 'Armor');
        add('💎 Magic Items (SRD / MIC)', CAT.magicItems, (x) => { const pr = (x.item && x.item.price != null) ? x.item.price : x.cost; return num(pr) > 0 ? gp(pr) : ((x.item && x.item.slot) || x.slot || x.category || 'Item'); }, (x) => [(x.item && x.item.slot) || x.slot || x.category || 'Item', ((x.item && x.item.casterLevel) || x.casterLevel) ? 'CL ' + ((x.item && x.item.casterLevel) || x.casterLevel) : '', stripHtml(x.shortDescription || x.text || x.description || ''), x.source || 'SRD'].filter(Boolean).join(' • '), 'MagicItem', 8);
        add('🔮 Spells', CAT.spells, (x) => x.levelText || 'Spell', (x) => [x.school, x.action ? x.action + ' Action' : '', x.range, x.save && x.save !== 'None' ? 'Save: ' + x.save : '', stripHtml(x.desc || (x.raw && (x.raw.text || x.raw.description)) || ''), x.src].filter(Boolean).join(' • '), 'Spell', 8);
        add('⚔️ Maneuvers, Powers & Subsystems', CAT.subsystems || [], (x) => x.type || 'Power', (x) => [x.spell && x.spell.discipline ? x.spell.discipline : (x.category || ''), x.spell && x.spell.level != null ? 'Lv ' + x.spell.level : '', stripHtml(x.shortDescription || x.text || ''), x.source || 'SRD'].filter(Boolean).join(' • '), 'Spell', 6);
        add('📜 Feats', CAT.feats, (x) => (x.custom ? 'Custom' : x.src || 'Feat'), (x) => [x.prereq ? 'Prerequisites: ' + x.prereq : '', stripHtml(x.desc || (x.raw && (x.raw.benefit || x.raw.text || x.raw.description)) || ''), x.src].filter(Boolean).join(' • '), 'Feat', 6);
        add('💎 Classes', CAT.classes, (x) => x.category || 'Class', (x) => [(x.progression && x.progression.hitDie) ? x.progression.hitDie + ' HD' : (x.hitDie ? 'd' + String(x.hitDie).replace(/^d/i, '') + ' HD' : ''), (x.progression && x.progression.bab) ? 'BAB ' + x.progression.bab : (x.babProgression ? 'BAB ' + x.babProgression : ''), stripHtml(x.shortDescription || x.text || x.description || ''), x.source || 'SRD'].filter(Boolean).join(' • '), 'Class', 4);
        add('🧬 Races & Templates', CAT.races || [], (x) => x.type || 'Race', (x) => [(x.race && x.race.size) || x.size || 'Medium', (x.race && x.race.speed) ? x.race.speed + ' ft.' : '', (x.race && x.race.levelAdjustment) ? 'LA +' + x.race.levelAdjustment : '', stripHtml(x.shortDescription || x.text || ''), x.source || 'SRD'].filter(Boolean).join(' • '), 'Race', 4);
        add('✨ Domains', CAT.domains, () => 'Domain', (x) => ['Granted Power: ' + stripHtml(x.grantedPower || ''), x.spells && x.spells.length ? 'Spells: ' + x.spells.join(', ') : '', x.src].filter(Boolean).join(' • '), 'Domain', 4);
        add('👹 Monsters & Bestiary', CAT.monsters || [], (x) => 'CR ' + (x.cr || '1'), (x) => [(x.size || 'Medium') + ' ' + (x.category || (x.monster && x.monster.creatureType) || 'Monster'), x.hitDice ? 'HD ' + x.hitDice : '', x.hp ? 'HP ' + x.hp : '', stripHtml(x.shortDescription || x.text || ''), x.source || 'SRD'].filter(Boolean).join(' • '), 'Monster', 6);
        if (sNorm) srdBuckets.sort((a, b) => b.best - a.best);
        const out = guides.concat(pre);
        srdBuckets.forEach((b) => b.items.forEach((it) => out.push(it)));
        if (sNorm.length >= 3 && out.length === 0) {
          const rawQ = String(q || '').trim();
          out.push(SI('✨ Craft with Rule Master', '__craft__', '✨ Craft "' + short(rawQ, 44) + '" with Rule Master', 'Rule Master', 'Automatically scribes pasted D&D 3.5e rule text or crafts the rule via Rule Master.', { craftQuery: rawQ }));
        }
        return out;
      },
      pick(it) {
        if (it.data.craftQuery) { S.ui.craftOpen = true; S.ui.craftText = it.data.craftQuery; renderTopbar(); renderCraftDrawer(); ACT['run-craft-rm'](); return; }
        if (it.data.guideIdx !== undefined) { ACT['load-guide-example']({ dataset: { idx: it.data.guideIdx } }); return; }
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
        return rank(allEnchs().filter((e) => enchApplies(e, v.kind) && ch.enchantments.indexOf(e.id) < 0 && lf(e)), q, (e) => e.name, (e) => e.desc, Infinity)
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
        if (L === 'All' || L === 'Abilities') rank(CAT.special, q, (f) => f.name, (f) => f.desc, 6).forEach((f) => out.push(SI('Special Abilities / Homebrew', f.id, f.name, f.cat, short(f.desc), { feat: f.name })));
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
        STANDARD_TAGS.filter((g) => L === 'All' || L === g[0]).forEach((g) => g[1].filter((t) => S.entry.tags.indexOf(t) < 0 && (!s || t.toLowerCase().indexOf(norm.toLowerCase()) >= 0)).forEach((t) => out.push(SI(g[0], t, t, 'Standard', g[0] + ' taxonomy tag — selectable in Prerequisites, Bonus Feat Grants, and Synergy C-Blocks.', { tag: t }))));
        S.livingTags.filter((t) => (L === 'All' || L === 'Custom') && S.entry.tags.indexOf(t) < 0 && (!s || t.toLowerCase().indexOf(norm.toLowerCase()) >= 0)).forEach((t) => out.push(SI('Custom Pools', t, t, 'Custom', 'Custom campaign tag pool — reusable across Prerequisites and Bonus Feat Grants.', { tag: t })));
        if (norm && norm.length > 1 && !allTags().some((t) => t.toLowerCase() === norm.toLowerCase())) out.push(SI('Create', 'new', '+ Create Custom Pool ' + norm, 'New', 'Reusable living tag pool, selectable in Prerequisites & Bonus Feat Grants', { tag: norm, create: true }));
        return out;
      },
      pick(it) { addTag(it.data.tag); }
    },
    descriptor: {
      ph: '🔍 Add descriptor: [Fire], [Mind-Affecting], [Fear]…',
      search(q) { return rank(DESCRIPTORS.filter((d) => S.entry.spell.descriptors.indexOf(d) < 0).map((d) => ({ name: d })), q, (d) => d.name, null, 25).map((d) => SI('Descriptors', d.name, '[' + d.name + ']', 'Descriptor', 'D&D 3.5e [' + d.name + '] descriptor — interacts with resistances, immunities, and descriptor-specific rules.', { d: d.name })); },
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
      layers: ['All', 'Homebrew', 'Features', 'Spells (SLA)', 'Feats'],
      search(q, ctx, layer) {
        const L = layer || 'All', out = [];
        // The character's own homebrew entries (sent by the sheet with crafter:loadEntry).
        if (L === 'All' || L === 'Homebrew') rank(CAT.homebrew || [], q, (h) => h.name, (h) => h.desc, 12).forEach((h) => out.push(SI('Homebrew', h.id, h.name, h.kindLabel || 'Homebrew', short(h.desc), { name: h.name, refId: h.id, type: h.abilityType || 'Ex', desc: h.desc })));
        if (L === 'All' || L === 'Features') rank(CAT.classFeatures, q, (c) => c.name, (c) => c.desc, 12).forEach((c) => out.push(SI('Class Features', c.id, c.name, c.abilityType || 'Ex', short(c.desc), { name: c.name, refId: c.id, type: c.abilityType || 'Ex', desc: c.desc })));
        if (L === 'All' || L === 'Spells (SLA)') rank(CAT.spells, q, (s) => s.name, (s) => s.desc, 12).forEach((s) => out.push(SI('Spells (as Sp SLA)', s.id, s.name, 'Sp • ' + (s.levelText || 'Lvl ' + s.level), short(s.school + ' • ' + s.desc), { name: s.name + ' (1/day, Sp)', refId: s.id, type: 'Sp', desc: s.desc })));
        if (L === 'All' || L === 'Feats') rank(CAT.feats.filter((f) => !f.custom), q, (f) => f.name, (f) => f.desc, 8).forEach((f) => out.push(SI('Feats (granted)', f.id, f.name, 'Feat', short(f.desc), { name: f.name, refId: f.id, type: 'Ex', desc: f.desc })));
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
      search(q) { return rank(allSkills().filter((s) => S.entry.progression.classSkills.indexOf(s.name) < 0), q, (s) => s.name, null, 36).map((s) => SI(s.custom ? 'Custom Skills' : '3.5e Skills', s.name, s.name, s.ability.toUpperCase() + (s.custom ? ' • Custom' : ''), (s.custom ? 'Custom campaign skill' : 'Core D&D 3.5e class skill') + ' keyed to ' + s.ability.toUpperCase() + (s.trainedOnly ? ' • Trained Only' : '') + (s.acp ? ' • Armor Check Penalty' : '') + '.', { name: s.name })); },
      pick(it) { S.entry.progression.classSkills.push(it.data.name); renderAll(); }
    },
    favwpn: {
      ph: '🔍 Select Base Weapon',
      search(q) { return rank(CAT.weapons, q, (w) => w.name, (w) => w.desc, 30).map((w) => SI(w.category + ' Weapons', w.id, baseName(w), w.dice, w.category + ' ' + w.handed + (w.ranged ? ' Ranged' : ' Melee') + ' • ' + w.dmgType + ' (' + (w.critRange < 20 ? w.critRange + '–20/' : '') + '×' + w.critMult + ') • ' + gp(w.cost) + ' • ' + w.src, { name: baseName(w) })); },
      pick(it) { S.entry.grants.favoredWeapon = it.data.name; renderAll(); }
    },
    intent: {
      ph: '+ Add Mechanic / Effect… (darkvision, immune fear, +2 save, weapon finesse…)',
      layers: ['All', 'Bonuses', 'Defenses', 'Attacks & Dice', 'Switches & Grants'],
      search(q, ctx, layer) {
        const parts = String(ctx || 'effects|1').split('|');
        const allowCont = parts[1] !== '0';
        const L = layer || 'All';
        const pool = INTENT_CATALOG.filter((it) => (allowCont || !it.container) && (L === 'All' || it.cat === L));
        return rank(pool, q, (it) => it.title + ' ' + it.kw, (it) => it.desc, 36).map((it) =>
          SI(it.group, it.id, it.icon + ' ' + it.title, BLOCK_TYPES[it.type].shortLabel, it.desc, { intent: it, listPath: parts[0] || 'effects' })
        );
      },
      pick(it) {
        const spec = it.data.intent;
        addPaletteBlock(it.data.listPath || 'effects', spec.type, spec.preset);
      }
    }
  };
  const INTENT_CATALOG = [
    { id: 'int-abil', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '💪', title: 'Ability Score Bonus (+STR / DEX / CON / INT / WIS / CHA)', kw: 'strength dexterity constitution intelligence wisdom charisma stat ability enhancement racial', desc: 'Adds a typed or untyped bonus to one or more ability scores (e.g. +4 Enhancement to STR).', type: 'stat', preset: { targets: ['str'], mode: 'flat', value: 2, btype: 'Enhancement' } },
    { id: 'int-ac-def', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '🛡️', title: 'Armor Class Bonus (Deflection / Natural / Dodge / Sacred)', kw: 'ac armor class deflection natural dodge shield sacred profane insight', desc: 'Adds a typed bonus to AC (Deflection, Natural Armor, Dodge, Sacred, Insight…).', type: 'stat', preset: { targets: ['ac.deflection'], mode: 'flat', value: 2, btype: 'Deflection' } },
    { id: 'int-atk', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '⚔️', title: 'Attack Roll Bonus (+Melee / Ranged / All Attacks)', kw: 'attack roll hit morale luck competence weapon focus', desc: 'Adds a bonus to melee, ranged, or all attack rolls.', type: 'stat', preset: { targets: ['atk.all'], mode: 'flat', value: 1, btype: 'Morale' } },
    { id: 'int-dmg-flat', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '🗡️', title: 'Weapon Damage Bonus (Flat +N)', kw: 'damage bonus weapon specialization morale luck melee ranged', desc: 'Adds a flat bonus to weapon damage rolls.', type: 'stat', preset: { targets: ['dmg.melee'], mode: 'flat', value: 2, btype: 'Untyped' } },
    { id: 'int-save', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '✨', title: 'Saving Throw Bonus (All / Fortitude / Reflex / Will)', kw: 'save saving throw fortitude reflex will resistancecloak morale luck', desc: 'Adds a bonus to Fortitude, Reflex, Will, or all saving throws.', type: 'stat', preset: { targets: ['save.all'], mode: 'flat', value: 2, btype: 'Resistance' } },
    { id: 'int-save-cond', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '🦁', title: 'Conditional Save Bonus (vs. Fear / Poison / Spells)', kw: 'save vs fear poison enchantment mind-affecting situational dwarven', desc: 'Situational bonus on saves against specific effects (e.g. +2 Morale vs. Fear, +2 Racial vs. Poison).', type: 'stat', preset: { targets: ['save.all'], mode: 'flat', value: 2, btype: 'Morale', condition: 'vs. Fear' } },
    { id: 'int-skill', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '🎯', title: 'Skill Check Bonus (+Competence / Racial / Synergy)', kw: 'skill check spot listen hide move silently tumble diplomacy competence', desc: 'Adds a bonus to one or more skills.', type: 'stat', preset: { targets: ['skill.spot', 'skill.listen'], mode: 'flat', value: 2, btype: 'Competence' } },
    { id: 'int-speed', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '💨', title: 'Land Speed Bonus (+10 ft. / Fast Movement)', kw: 'speed fast movement land feet stride haste', desc: 'Increases base or enhancement land speed.', type: 'stat', preset: { targets: ['speed.land'], mode: 'flat', value: 10, btype: 'Untyped' } },
    { id: 'int-init', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '⚡', title: 'Initiative Bonus (Improved Initiative)', kw: 'initiative improved combat reflexes', desc: 'Adds a bonus on Initiative checks.', type: 'stat', preset: { targets: ['initiative'], mode: 'flat', value: 4, btype: 'Untyped' } },
    { id: 'int-hp', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '❤️', title: 'Max Hit Points Bonus (Toughness / Improved Toughness)', kw: 'hit points hp max toughness health', desc: 'Increases maximum hit points (flat or @level formula).', type: 'stat', preset: { targets: ['hp.max'], mode: 'flat', value: 3, btype: 'Untyped' } },
    { id: 'int-cl', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '🔮', title: 'Caster Level Bonus (+CL)', kw: 'caster level practiced spellcaster arcane divine power', desc: 'Increases effective Caster Level.', type: 'stat', preset: { targets: ['spell.cl'], mode: 'flat', value: 1, btype: 'Untyped' } },
    { id: 'int-percl', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '📈', title: 'Scaling Bonus by Caster / Class Level (+1 per N Levels)', kw: 'scale per caster level divine favor barkskin shield of faith progression', desc: 'Scales a bonus automatically every N caster/class levels between a floor and cap.', type: 'stat', preset: { targets: ['atk.all', 'dmg.all'], mode: 'perCL', value: 1, per: 3, min: 1, max: 3, btype: 'Luck' } },
    { id: 'int-stat-add', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '🌟', title: 'Add @Ability Modifier to Stat (Divine Grace / Battle Clarity)', kw: 'divine grace charisma to saves paladin add stat modifier', desc: 'Adds an ability modifier (e.g. +@chaMod) or @resource pool to any target.', type: 'stat', preset: { targets: ['save.all'], mode: 'stat', stat: 'chaMod', mult: 1, value: 0, cap: 'none', btype: 'Untyped' } },
    { id: 'int-swap-finesse', cat: 'Bonuses', group: '🔄 Stat / Formula Swaps (A → B)', icon: '🔄', title: 'Weapon Finesse / Ability Swap on Attack (DEX or WIS instead of STR)', kw: 'weapon finesse zen archery intuitive attack replace stat swap melee ranged wisdom dexterity', desc: 'Substitutes or takes max(A, B) ability modifier on attack rolls (Weapon Finesse, Zen Archery, Intuitive Attack).', type: 'stat', preset: { mode: 'replaceStat', swapTarget: 'atk.melee.abilityMod', targets: ['atk.melee.abilityMod'], subOp: 'max', fromStat: 'str', toStat: 'dex', swapScope: 'finessable', btype: 'Untyped' } },
    { id: 'int-swap-save', cat: 'Bonuses', group: '🔄 Stat / Formula Swaps (A → B)', icon: '🔄', title: 'Swap Ability on Saving Throw (CON or CHA to Will / INT to Reflex)', kw: 'steadfast determination force of personality insightful reflexes save swap ability', desc: 'Uses CON, CHA, or INT in place of the default ability on a saving throw.', type: 'stat', preset: { mode: 'replaceStat', swapTarget: 'save.will.abilityMod', targets: ['save.will.abilityMod'], subOp: 'max', fromStat: 'wis', toStat: 'con', swapScope: 'all', btype: 'Untyped' } },
    { id: 'int-swap-dmg', cat: 'Bonuses', group: '🔄 Stat / Formula Swaps (A → B)', icon: '🔄', title: 'Add / Swap Ability on Weapon Damage (Shadow Blade)', kw: 'shadow blade dex to damage melee swap add', desc: 'Adds or substitutes another ability modifier on melee or ranged weapon damage.', type: 'stat', preset: { mode: 'replaceStat', swapTarget: 'dmg.melee.abilityMod', targets: ['dmg.melee.abilityMod'], subOp: 'add', fromStat: 'str', toStat: 'dex', swapScope: 'discipline_weapons', btype: 'Untyped' } },
    { id: 'int-powerful-build', cat: 'Bonuses', group: '📊 Bonuses & Stats', icon: '🏔️', title: 'Powerful Build (Count as +1 Size Larger)', kw: 'powerful build goliath half-giant grapple weapon size', desc: 'Counts as 1 size category larger for grapple, bull rush, trip, and weapon size without AC/attack penalties.', type: 'stat', preset: { targets: ['size.effective'], mode: 'flat', value: 1, btype: 'Untyped', appliesTo: ['grapple', 'bullRush', 'trip', 'overrun', 'opposedSize', 'weaponSize'] } },
    { id: 'int-darkvision', cat: 'Defenses', group: '🛡️ Defenses, Senses & Movement', icon: '👁️', title: 'Darkvision / Special Sense (60 ft., Blindsense, Low-Light)', kw: 'darkvision low-light vision blindsense blindsight tremorsense scent see invisibility sense', desc: 'Grants Darkvision, Low-Light Vision, Blindsense, Tremorsense, or Scent.', type: 'defense', preset: { mode: 'Sense / Movement', what: 'Darkvision 60 ft.' } },
    { id: 'int-fly', cat: 'Defenses', group: '🛡️ Defenses, Senses & Movement', icon: '🦅', title: 'Fly / Swim / Climb / Burrow Speed', kw: 'fly flight swim climb burrow movement speed wings', desc: 'Grants a special movement mode (e.g. Fly 60 ft. (Good), Swim 30 ft.).', type: 'defense', preset: { mode: 'Sense / Movement', what: 'Fly 60 ft. (Good)' } },
    { id: 'int-immune', cat: 'Defenses', group: '🛡️ Defenses, Senses & Movement', icon: '🛡️', title: 'Immunity (Fear, Poison, Mind-Affecting, Fire, Critical Hits…)', kw: 'immune immunity fear poison sleep paralysis disease mind-affecting fire undead paladin', desc: 'Grants complete immunity to an energy type, hazard, or effect.', type: 'defense', preset: { mode: 'Immunity', what: 'Fear' } },
    { id: 'int-cond-imm', cat: 'Defenses', group: '🛡️ Defenses, Senses & Movement', icon: '🧱', title: 'Condition Immunity (Stunned, Dazed, Fatigued, Exhausted)', kw: 'condition immunity stunned dazed nauseated fatigued exhausted paralyzed', desc: 'Grants immunity to a specific D&D 3.5e condition.', type: 'defense', preset: { mode: 'Condition Immunity', what: 'Stunned' } },
    { id: 'int-dr', cat: 'Defenses', group: '🛡️ Defenses, Senses & Movement', icon: '🪨', title: 'Damage Reduction (DR X / magic, adamantine, evil, —)', kw: 'damage reduction dr adamantine cold iron silver magic alignment barbarian', desc: 'Reduces physical weapon damage unless bypassed (e.g. DR 5/magic, DR 3/—).', type: 'defense', preset: { mode: 'DR', value: 5, what: 'magic' } },
    { id: 'int-eres', cat: 'Defenses', group: '🛡️ Defenses, Senses & Movement', icon: '🔥', title: 'Energy Resistance (Fire, Cold, Acid, Electricity, Sonic)', kw: 'energy resistance resist fire cold acid electricity sonic', desc: 'Reduces damage taken from an energy type (or @Choice).', type: 'defense', preset: { mode: 'Energy Resistance', value: 10, what: 'Fire' } },
    { id: 'int-sr', cat: 'Defenses', group: '🛡️ Defenses, Senses & Movement', icon: '💠', title: 'Spell Resistance (Flat SR or 10 + @Level)', kw: 'spell resistance sr drow monk', desc: 'Grants flat or level-scaling Spell Resistance.', type: 'defense', preset: { mode: 'Spell Resistance', srMode: 'level', value: 15 } },
    { id: 'int-conceal', cat: 'Defenses', group: '🛡️ Defenses, Senses & Movement', icon: '🌫️', title: 'Concealment / Miss Chance (20% Blur / 50% Displacement)', kw: 'concealment miss chance blur displacement blink invisible', desc: 'Grants a percentage miss chance against incoming attacks.', type: 'defense', preset: { mode: 'Concealment %', value: 20 } },
    { id: 'int-size', cat: 'Defenses', group: '🛡️ Defenses, Senses & Movement', icon: '📐', title: 'Actual Size Category Change (Enlarge Person / Reduce Person)', kw: 'size change enlarge reduce large small', desc: 'Changes actual creature size category (+1 Large, -1 Small, etc.).', type: 'defense', preset: { mode: 'Size Change', steps: 1 } },
    { id: 'int-stateflag', cat: 'Defenses', group: '🛡️ Defenses, Senses & Movement', icon: '⛓️', title: 'Condition / State Penalty Flag (Flat-Footed, Entangled, Neg Level)', kw: 'state flag condition entangled blinded stunned flat-footed negative level lose dex', desc: 'Applies a D&D 3.5e state lock or debuff penalty.', type: 'defense', preset: { mode: 'State Flag', flag: 'entangled' } },
    { id: 'int-dmg-dice', cat: 'Attacks & Dice', group: '💥 Dice, Attacks & Natural Weapons', icon: '💥', title: 'Damage Dice / Energy Rider (1d6 Fire, 6d6 Blast…)', kw: 'damage dice roll fire cold shock acid sonic blast', desc: 'Adds rolled damage dice (flat or scaling by Caster Level).', type: 'roll', preset: { kind: 'Damage', count: 1, die: 'd6', flat: 0, dmgType: 'Fire', scaling: 'flat' } },
    { id: 'int-sneak', cat: 'Attacks & Dice', group: '💥 Dice, Attacks & Natural Weapons', icon: '🗡️', title: 'Precision / Sneak Attack Dice (+Nd6 Precision)', kw: 'sneak attack skirmish sudden strike precision dice', desc: 'Adds precision damage dice (not multiplied on critical hits).', type: 'roll', preset: { kind: 'Damage', count: 1, die: 'd6', flat: 0, dmgType: 'Precision', crit: 'normal', condition: 'Sneak Attack / Flanking or Flat-Footed' } },
    { id: 'int-heal', cat: 'Attacks & Dice', group: '💥 Dice, Attacks & Natural Weapons', icon: '💚', title: 'Healing Roll (Cure / Lay on Hands)', kw: 'heal healing cure hit points restore', desc: 'Rolls or calculates hit point healing.', type: 'roll', preset: { kind: 'Healing', count: 1, die: 'd8', flat: 0, scaling: 'perCL', amount: 1, per: 1, max: 5 } },
    { id: 'int-temphp', cat: 'Attacks & Dice', group: '💥 Dice, Attacks & Natural Weapons', icon: '💛', title: 'Temporary Hit Points (Aid / False Life)', kw: 'temporary hit points temp hp false life aid', desc: 'Grants temporary hit points.', type: 'roll', preset: { kind: 'Temp HP', count: 1, die: 'd10', flat: 0, scaling: 'perCL', amount: 1, per: 1, max: 10 } },
    { id: 'int-fastheal', cat: 'Attacks & Dice', group: '💥 Dice, Attacks & Natural Weapons', icon: '♻️', title: 'Fast Healing N (Per Round)', kw: 'fast healing regeneration vigor per round', desc: 'Restores N hit points automatically each round.', type: 'roll', preset: { kind: 'Fast Healing', count: 2, die: 'flat', flat: 0, scaling: 'flat' } },
    { id: 'int-extra-atk', cat: 'Attacks & Dice', group: '💥 Dice, Attacks & Natural Weapons', icon: '⚡', title: 'Extra Attack at Full BAB (Haste / Speed)', kw: 'extra attack full attack haste speed', desc: 'Grants an extra attack at full Base Attack Bonus during a Full Attack.', type: 'attack', preset: { attackMode: 'extra', extraKind: 'extraFull', count: 1 } },
    { id: 'int-flurry', cat: 'Attacks & Dice', group: '💥 Dice, Attacks & Natural Weapons', icon: '🌪️', title: 'Extra Attack with Penalty (Flurry of Blows / Rapid Shot)', kw: 'flurry of blows rapid shot whirling frenzy extra attack penalty', desc: 'Grants extra attack(s) while applying an attack roll penalty to all attacks.', type: 'attack', preset: { attackMode: 'extra', extraKind: 'flurry', count: 1, penalty: -2 } },
    { id: 'int-nat-atk', cat: 'Attacks & Dice', group: '💥 Dice, Attacks & Natural Weapons', icon: '🦷', title: 'Natural Weapon (Claw / Bite / Gore / Slam / Tentacle)', kw: 'natural attack weapon claw bite gore slam tail tentacle primary secondary', desc: 'Grants primary or secondary natural weapon attacks.', type: 'attack', preset: { attackMode: 'natural', natKind: 'primary', count: 2, weaponName: 'Claw', dice: '1d4', dmgType: 'B/P/S', usesHands: true } },
    { id: 'int-unarmed', cat: 'Attacks & Dice', group: '💥 Dice, Attacks & Natural Weapons', icon: '🥋', title: 'Unarmed Damage Die Progression (Monk / Superior Unarmed Strike)', kw: 'unarmed strike monk damage die progression belt', desc: 'Scales unarmed strike base damage die.', type: 'attack', preset: { attackMode: 'unarmedDie', unarmedProgression: 'monk', effLvlBonus: 0 } },
    { id: 'int-dr-bypass', cat: 'Attacks & Dice', group: '💥 Dice, Attacks & Natural Weapons', icon: '✨', title: 'Passive DR Bypass on Strikes (Ki Strike: magic / lawful / adamantine)', kw: 'bypass dr ki strike magic lawful adamantine unarmed', desc: 'Treats unarmed or melee attacks as magic/aligned/material for overcoming DR.', type: 'attack', preset: { attackMode: 'strikeBypass', appliesToWeapon: 'unarmed', enhEquivalent: 0, drBypassList: 'magic' } },
    { id: 'int-prof', cat: 'Switches & Grants', group: '🎖️ Proficiencies, Feats, Switches & Pools', icon: '🛡️', title: 'Grant Weapon / Armor / Shield Proficiency', kw: 'proficiency martial simple exotic weapon armor light medium heavy shield tower', desc: 'Grants proficiency (e.g. weapon:martial, weapon:wpn-longbow, armor:heavy, shield:tower).', type: 'effect', preset: { effectKind: 'proficiency', targetId: 'weapon:martial' } },
    { id: 'int-fam', cat: 'Switches & Grants', group: '🎖️ Proficiencies, Feats, Switches & Pools', icon: '🪓', title: 'Weapon Familiarity (Treat Exotic Weapon as Martial)', kw: 'weapon familiarity dwarven waraxe urgosh gnome hooked hammer exotic martial', desc: 'Treats a specific exotic weapon as a martial weapon (racial familiarity).', type: 'effect', preset: { effectKind: 'familiarity', targetId: 'wpn-dwarven-waraxe', treatAs: 'martial' } },
    { id: 'int-bonus-feat', cat: 'Switches & Grants', group: '🎖️ Proficiencies, Feats, Switches & Pools', icon: '🎖️', title: 'Grant Specific Bonus Feat (by Feat ID)', kw: 'grant bonus feat dodge mobility alertness track endurance', desc: 'Directly grants a specific bonus feat (e.g. feat-dodge, feat-track).', type: 'effect', preset: { effectKind: 'feat', targetId: 'feat-dodge' } },
    { id: 'int-pool-feat', cat: 'Switches & Grants', group: '🎖️ Proficiencies, Feats, Switches & Pools', icon: '🎯', title: 'Grant Bonus Feat Choice from #Tag Pool', kw: 'fighter bonus feat choice pool metamagic floating', desc: 'Grants a player-chosen bonus feat from a #Tag pool.', type: 'effect', preset: { effectKind: 'grantFeat', featOrPool: '#FighterBonus', floatingDaily: false } },
    { id: 'int-uncanny', cat: 'Switches & Grants', group: '🎖️ Proficiencies, Feats, Switches & Pools', icon: '🔀', title: 'Uncanny Dodge (Retain DEX Bonus When Flat-Footed)', kw: 'uncanny dodge flat-footed dex ac barbarian rogue', desc: 'Retains DEX bonus to AC even while flat-footed.', type: 'effect', preset: { effectKind: 'ruleSwitch', flag: 'uncannyDodge' } },
    { id: 'int-switch', cat: 'Switches & Grants', group: '🎖️ Proficiencies, Feats, Switches & Pools', icon: '🔀', title: 'Engine Rule Switch (Natural Spell, Shield to Touch AC, Oversized TWF…)', kw: 'rule switch flag natural spell wild shape monkey grip oversized twf armor speed nat 1 fort', desc: 'Toggles a built-in D&D 3.5e rule law switch.', type: 'effect', preset: { effectKind: 'ruleSwitch', flag: 'noAutoFailFortSaveOnNat1' } },
    { id: 'int-channel', cat: 'Switches & Grants', group: '🎖️ Proficiencies, Feats, Switches & Pools', icon: '⚔️', title: 'Channel Spell / Metamagic Carrier (Duskblade / Rod / Sudden)', kw: 'channel touch spell melee duskblade spellstrike metamagic rod empower quicken', desc: 'Delivers spells through weapon attacks or applies metamagic transforms.', type: 'carrier', preset: { carrierMode: 'meleeChannel', channelStyle: 'standardSingle', critRule: 'spell20x2', holdCharge: true } },
    { id: 'int-resource', cat: 'Switches & Grants', group: '🎖️ Proficiencies, Feats, Switches & Pools', icon: '🔋', title: 'Resource Pool / Tactical Dial (@Uses per Day or Encounter)', kw: 'resource pool uses per day encounter charges rage ki inspiration essentia dial', desc: 'Declares a tracked @resource pool or tactical dial.', type: 'resource', preset: { name: '', varKey: '', resMode: 'spend', scaling: 'flat', max: 3, reset: 'perDay' } },
    { id: 'int-when', cat: 'Switches & Grants', group: '🔶 Conditional & Narrative', icon: '🔶', title: 'Conditional Rule (While Charging / Flanking / Wielding / Level Tier…)', kw: 'when while if condition charging flanking unarmored level tier choice', desc: 'Applies inner blocks only when a condition or level tier is met.', type: 'when', container: true, preset: { flow: 'while', branches: [Object.assign({}, NEUTRAL_BRANCH_OVERRIDES, { condKind: 'state', condText: 'charging', kids: [] })] } },
    { id: 'int-ruletext', cat: 'Switches & Grants', group: '🔶 Conditional & Narrative', icon: '📜', title: 'Unstructured Rule Text Note (Narrative / Manual)', kw: 'rule text narrative note description flavor manual', desc: 'Adds a human-readable rule note shown on the sheet (not auto-calculated).', type: 'effect', preset: { effectKind: 'rule', text: '' } }
  ];
  function spotHtml(key, ctx, o) {
    o = o || {};
    const open = S.spot && S.spot.key === key && S.spot.ctx === String(ctx || '');
    return '<div class="fs-spot' + (o.cls ? ' ' + o.cls : '') + '" style="' + (o.style || '') + '"><input class="fs-in fs-spot-in" type="text" autocomplete="off" spellcheck="false" data-spot-input="' + key + '" data-ctx="' + esc(ctx || '') + '" placeholder="' + esc(o.ph || SPOT[key].ph) + '" value="' + esc(open ? S.spot.q : '') + '">' +
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
      return head + '<div class="fs-spot-item' + (i === S.spot.idx ? ' active' : '') + '" data-spot-pick="' + i + '"><div class="fs-spot-row"><b class="fs-spot-name">' + esc(it.label) + '</b>' + (it.badge ? '<span class="fs-pill dim">' + esc(it.badge) + '</span>' : '') + (it.data && it.data.tpl ? '<span class="fs-spot-del" data-spot-del="' + esc(it.data.tpl) + '" title="Delete saved template">✕</span>' : '') + '</div><div class="fs-spot-desc">' + esc(it.desc || '—') + '</div></div>';
    }).join('') : '<div class="fs-spot-empty">No matches' + (CAT.srdLoaded ? '' : ' in the offline seed catalog (serve over http:// to search the full SRD)') + '.</div>');
    dd.classList.add('open');
    if (window.innerWidth <= 640) {
      const inpEl = dd.parentElement && dd.parentElement.querySelector('[data-spot-input]');
      if (inpEl) {
        const ir = inpEl.getBoundingClientRect();
        const topPx = Math.max(8, Math.min(Math.round(ir.bottom + 4), Math.round(window.innerHeight * 0.52)));
        dd.style.top = topPx + 'px';
        dd.style.maxHeight = Math.max(180, window.innerHeight - topPx - 12) + 'px';
      }
    } else {
      dd.style.top = ''; dd.style.maxHeight = '';
      dd.style.left = ''; dd.style.right = '';
      const rc = dd.getBoundingClientRect();
      if (rc.right > window.innerWidth - 8) { dd.style.left = 'auto'; dd.style.right = '0'; }
    }
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
    'feat-sum': (a) => { const p = a.split(':'); const f = (S.entry.progression.levels[num(p[0])] || { features: [] }).features[num(p[1])]; return f ? (f.branchPath ? '🔀 ' + esc(f.branchPath) + ': ' : '') + esc(f.name) : ''; },
    'dom-sum': (i) => { const d = S.entry.grants.domains[num(i)]; return d ? esc(d.name + (d.grantedPower ? ' — ' + short(d.grantedPower, 80) : '')) : ''; },
    'deity-sum': (i) => { const d = S.entry.grants.deities[num(i)]; return d ? esc(d.name + ' (' + d.align + ') • Favored Weapon: ' + d.favoredWeapon) : ''; },
    // How the engine reads a formula field: normalized form + sample values, or the unknown terms.
    'fx-preview': (path) => {
      const raw = getPath(S.entry, path);
      const v = String(raw == null ? '' : raw).trim();
      if (!v || /^-?\d+(\.\d+)?$/.test(v) || !window.RuleEngine || typeof window.RuleEngine.inspectFormula !== 'function') return '';
      // Sample @spellLevel: the sub-power's Spell Level (or its attached spell), the spell entry's level, else 3.
      const pwMatch = path.match(/^powers\.\d+/);
      const pw = pwMatch ? getPath(S.entry, pwMatch[0]) : null;
      const slRaw = pw && pw.spellLevel !== undefined && pw.spellLevel !== '' ? Number(pw.spellLevel)
        : (pw && pw.ref ? Number(pw.ref.level) : (S.entry.blueprint === 'spell' ? Number(S.entry.level) : NaN));
      const sl = Number.isFinite(slRaw) ? slRaw : 3;
      const r = window.RuleEngine.inspectFormula(v, { spellLevel: sl });
      if (r.unknown.length) return '<span class="fs-warn" style="font-size:11px">⚠️ Unknown term' + (r.unknown.length > 1 ? 's' : '') + ': ' + esc(r.unknown.join(', ')) + '. Click ! Formula help for the terms you can use.</span>';
      const usesSl = /@spellLevel\b/.test(r.normalized);
      return '<div class="fs-fxprev"><div><span class="fs-fxprev-k">Reads as</span> <code>' + esc(r.normalized) + '</code></div>' +
        '<div>' + r.samples.map((x) => '<span class="fs-fxprev-lv">Lvl ' + x.level + ' <b>' + esc(String(x.value)) + '</b></span>').join('') +
        '<span class="fs-fxprev-k">ability mods +2' + (usesSl ? ', spell level ' + sl : '') + '</span></div></div>';
    },
    'roll-preview': (path) => {
      const b = getPath(S.entry, path);
      if (!b || b.type !== 'roll') return '';
      return esc(rollBlockText(b)) + (b.scaling === 'perCL' ? ' <span class="fs-hint">— CL 1: ' + rollAtCL(b, 1) + ' • CL 5: ' + rollAtCL(b, 5) + ' • CL 10: ' + rollAtCL(b, 10) + ' • CL 20: ' + rollAtCL(b, 20) + '</span>' : '');
    },
    'cond-badge': (args) => {
      const parts = String(args || '').split('|');
      const raw = getPath(S.entry, parts[0]);
      return condBadgeHtml(raw, parts[1] || 'stat', '', parts[2] || '');
    },
    'when-cond-badge': (bp) => {
      const br = getPath(S.entry, bp);
      if (!br) return '';
      return condBadgeHtml(br.condText, 'when', br.condKind || 'state', '');
    },
    'sheet-diff': () => renderSheetDiffBody()
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
    const catSel = '<select class="fs-sel" data-topcat="1" style="width:auto;min-width:170px" title="Category / Template"><optgroup label="Category">' + opts(BLUEPRINTS.map((b) => [b.id, b.icon + ' ' + b.name]), curTpl ? '' : S.entry.blueprint) + '</optgroup>' +
      (S.templates.length ? '<optgroup label="📌 Saved Templates">' + opts(S.templates.map((t) => [t.id, t.name]), curTpl) + '</optgroup>' : '') + '</select>';
    const craftBtn = btn('toggle-craft-rm', '✨ Craft with Rule Master', 'fs-xs ' + (S.ui.craftOpen ? 'fs-on' : 'fs-primary'));
    const canUndo = S.history.past.length > 0, canRedo = S.history.future.length > 0;
    const histBtns = '<button type="button" class="fs-btn fs-xs fs-ghost" data-action="undo"' + (canUndo ? '' : ' disabled style="opacity:.4;cursor:default"') + ' title="Undo (Ctrl+Z)">↶ Undo</button>' +
      '<button type="button" class="fs-btn fs-xs fs-ghost" data-action="redo"' + (canRedo ? '' : ' disabled style="opacity:.4;cursor:default"') + ' title="Redo (Ctrl+Y)">↷</button>';
    if (IS_EMBED) {
      const ctx = S.embed && S.embed.context ? S.embed.context : {};
      const allowChar = ctx.allowCharacterScope !== false;
      const scope = allowChar ? ((S.embed && S.embed.saveScope) || 'character') : 'campaign';
      const scopeSel = '<select class="fs-sel fs-embed-scope" data-embed-scope="1" title="Save Target">' +
        (allowChar ? '<option value="character"' + (scope === 'character' ? ' selected' : '') + '>This Character Only</option>' : '') +
        '<option value="campaign"' + (scope === 'campaign' ? ' selected' : '') + '>Campaign Rule Crafter Library</option></select>';
      $('#fs-topbar').innerHTML = '<div class="fs-topbar-row"><div class="fs-title">⚒️ Rule Crafter</div>' + scopeSel + catSel +
        '<span class="fs-grow-gap"></span>' + histBtns + craftBtn + btn('embed-save', '💾 Save & Apply', 'fs-xs fs-emerald') + btn('embed-cancel', '✕ Cancel', 'fs-xs fs-ghost') + '</div>' +
        '<div class="fs-topbar-row fs-topbar-spot-row"><div class="fs-top-spot">' + spotHtml('load', 'top') + '</div></div>';
      return;
    }
    const save = S.ui.tplSaveOpen ? '<span class="fs-row" style="gap:4px">' + inp('newTplName', S.ui.newTplName, { scope: 'ui', ph: 'Template name…', style: 'width:150px', enter: 'save-template' }) + btn('save-template', 'Save', 'fs-xs fs-emerald') + btn('toggle-tpl-save', '✕', 'fs-xs fs-ghost') + '</span>' : btn('toggle-tpl-save', '📌 Save Template', 'fs-xs');
    const skillPop = '<span class="fs-rel">' + btn('toggle-custom-skill', '+ 🎯 Custom Skill', 'fs-xs' + (S.ui.customSkillOpen ? ' fs-on' : '')) + customSkillPopover() + '</span>';
    const importBtn = btn('toggle-import-json', '📥 Import JSON', 'fs-xs' + (S.ui.importOpen ? ' fs-on' : ''));
    const status = CAT.srdLoaded ? '<span class="fs-pill emerald" title="SrdCompendium V3 Corpus">📚 SRD ' + CAT.srdCount.toLocaleString('en-US') + (CAT.customCount ? ' + ' + CAT.customCount + ' custom' : '') + '</span>' : '<span class="fs-pill dim" title="Serve over http:// to load srd_compendium.js data">📚 Offline seed</span>';
    $('#fs-topbar').innerHTML = '<div class="fs-topbar-row"><div class="fs-title">' + DICE_SVG + ' Rule Crafter</div>' + catSel +
      '<span class="fs-grow-gap"></span>' + histBtns + craftBtn + save + skillPop + importBtn + btn('new-entry', '✨ Blank', 'fs-xs') + status + '</div>' +
      '<div class="fs-topbar-row fs-topbar-spot-row"><div class="fs-top-spot">' + spotHtml('load', 'top') + '</div></div>';
  }
  function renderCraftDrawer() {
    const wrap = document.getElementById('fs-craft-drawer');
    if (!wrap) return;
    if (!S.ui.craftOpen) { wrap.innerHTML = ''; return; }
    const keyRow = S.ui.craftNeedKey
      ? '<div class="fs-row" style="margin-top:6px;padding:6px 8px;border-radius:8px;background:rgba(30,27,75,.55);border:1px solid rgba(99,102,241,.45)">' +
        '<span class="fs-hint" style="color:#c7d2fe">🔑 Enter Gemini API Key to consult Rule Master:</span>' +
        '<input type="password" class="fs-in" data-uibind="craftApiKey" placeholder="AIza…" style="flex:1 1 180px;width:auto">' +
        btn('save-craft-apikey', 'Save Key & Craft', 'fs-xs fs-primary') +
        '</div>'
      : '';
    const statusSpan = S.ui.craftStatus ? '<span class="fs-hint" style="color:#a5b4fc">' + esc(S.ui.craftStatus) + '</span>' : '';
    wrap.innerHTML = '<div class="fs-glass fs-import-box" style="border-radius:14px;margin-bottom:10px;border:1px solid rgba(99,102,241,.45)">' +
      '<div class="fs-row" style="justify-content:space-between;margin-bottom:4px">' +
      '<span class="fs-label-mini" style="color:#c7d2fe">✨ Craft with Rule Master</span>' +
      '<span class="fs-hint">Paste D&amp;D 3.5e rule text (instant local craft) or name any splatbook/homebrew rule</span>' +
      '</div>' +
      '<textarea class="fs-in" data-uibind="craftText" placeholder="e.g. &quot;Alertness: You get a +2 bonus on all Listen checks and Spot checks.&quot; or &quot;Zen Archery&quot; or &quot;Planning Domain&quot;…">' + esc(S.ui.craftText) + '</textarea>' +
      keyRow +
      '<div class="fs-row" style="margin-top:6px">' +
      btn('run-craft-rm', S.ui.craftBusy ? '⏳ Crafting…' : '✨ Craft with Rule Master', 'fs-xs fs-primary') +
      btn('toggle-craft-rm', 'Cancel', 'fs-xs fs-ghost') +
      statusSpan +
      '</div></div>';
  }
  const liveMetrics = { y0: 96, moreH: 0, pillsCount: 0 };
  function measureLiveMetrics() {
    const topEl = $('#fs-topbar'), mainEl = document.querySelector('.fs-main'), moreInner = document.querySelector('#fs-live .fs-live-more-inner');
    if (topEl && mainEl) liveMetrics.y0 = topEl.offsetHeight + (parseFloat(getComputedStyle(mainEl).paddingTop) || 0);
    if (moreInner) liveMetrics.moreH = moreInner.offsetHeight;
  }
  function syncLiveScroll(animate) {
    const liveEl = $('#fs-live'), spacerEl = $('#fs-live-spacer');
    if (!liveEl) return;
    const moreEl = liveEl.querySelector('.fs-live-more');
    const btnEl = liveEl.querySelector('[data-action="toggle-live"]');
    if (!moreEl) return;
    const y = typeof window !== 'undefined' ? (window.scrollY || window.pageYOffset || 0) : 0;
    const mobile = typeof window !== 'undefined' && window.innerWidth <= 640;
    const y0 = liveMetrics.y0, moreH = liveMetrics.moreH;
    if (y > y0 + 6) S.ui.liveWasScrolled = true;
    else if (y <= 8 && S.ui.liveWasScrolled) {
      S.ui.liveWasScrolled = false;
      S.ui.liveUserOverride = null;
    }
    let shrink = 0;
    if (S.ui.liveUserOverride === 'open') shrink = 0;
    else if (S.ui.liveUserOverride === 'closed') shrink = moreH;
    else if (mobile) shrink = S.ui.liveOpenMobile ? 0 : moreH;
    else shrink = Math.max(0, Math.min(moreH, y - y0));

    const spacerH = Math.min(shrink, Math.max(0, y - y0));
    liveEl.classList.toggle('manual-anim', !!animate);
    const visH = Math.max(0, moreH - shrink);
    moreEl.style.height = visH + 'px';
    moreEl.style.opacity = moreH > 0 ? String(Math.max(0, Math.min(1, 1 - shrink / Math.max(1, moreH * 0.85)))) : '1';
    moreEl.style.pointerEvents = visH < 8 ? 'none' : '';
    if (spacerEl) spacerEl.style.height = spacerH + 'px';

    const collapsed = moreH > 0 && shrink >= moreH - 1;
    liveEl.classList.toggle('collapsed', collapsed);
    if (btnEl) {
      const nextTxt = collapsed ? ('▾ Details' + (liveMetrics.pillsCount ? ' (' + liveMetrics.pillsCount + ')' : '')) : '▴ Collapse';
      if (btnEl.textContent !== nextTxt) btnEl.textContent = nextTxt;
    }
  }
  const PREVIEW_ARCHETYPES = {
    fighter: { label: '⚔️ Fighter', cls: 'Fighter', hd: 10, babRate: 1, good: { fort: true, ref: false, will: false }, abil: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 10 }, armor: true, shield: true },
    cleric: { label: '☀️ Cleric', cls: 'Cleric', hd: 8, babRate: 0.75, good: { fort: true, ref: false, will: true }, abil: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 14 }, armor: true, shield: true },
    rogue: { label: '🗡️ Rogue', cls: 'Rogue', hd: 6, babRate: 0.75, good: { fort: false, ref: true, will: false }, abil: { str: 12, dex: 16, con: 14, int: 14, wis: 12, cha: 10 }, armor: 'light', shield: false },
    wizard: { label: '🔮 Wizard', cls: 'Wizard', hd: 4, babRate: 0.5, good: { fort: false, ref: false, will: true }, abil: { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 }, armor: false, shield: false }
  };
  function getParentSheetChar() {
    if (!IS_EMBED || typeof window === 'undefined' || !window.parent || window.parent === window) return null;
    try {
      const ps = window.parent.CharStore;
      const st = ps && typeof ps.getState === 'function' ? ps.getState() : null;
      return st && st.doc && typeof st.doc === 'object' ? st.doc : null;
    } catch (e) { return null; }
  }
  function buildPreviewChar(archKey, lvl) {
    const lv = Math.max(1, Math.min(20, num(lvl, 5)));
    if (archKey === 'sheet') {
      const doc = getParentSheetChar();
      if (doc) {
        const c = clone(doc);
        c.tactical = Object.assign({}, c.tactical || {}, {
          charging: !!S.ui.prevCharge, charge: !!S.ui.prevCharge,
          flanking: !!S.ui.prevFlank
        });
        return c;
      }
    }
    const a = PREVIEW_ARCHETYPES[archKey] || PREVIEW_ARCHETYPES.fighter;
    const saveProg = (good) => (good ? 2 + Math.floor(lv / 2) : Math.floor(lv / 3));
    const bab = Math.floor(lv * a.babRate);
    const conMod = Math.floor((a.abil.con - 10) / 2);
    const avgDie = Math.floor(a.hd / 2) + 1;
    const baseMax = a.hd + (lv - 1) * avgDie;
    const hpMax = Math.max(lv, baseMax + lv * conMod);
    const prog = [];
    for (let i = 1; i <= lv; i++) prog.push({ level: i, className: a.cls, hpRoll: i === 1 ? a.hd : avgDie });
    const bodySlots = {
      mainHand: {
        id: 'wpn-longsword', baseItemId: 'Longsword', name: 'Longsword', type: 'Weapon', category: 'Martial',
        handedness: 'One-Handed', grip: '1-Hand', dice: '1d8', crit: '19-20/x2', critMin: 19, critMult: 2, dmgType: 'Slashing',
        equipped: true, schemaVersion: 3,
        weapon: { category: 'Martial', handedness: 'One-Handed', damageDice: '1d8', dmgType: 'Slashing', baseCritRange: 19, critMultiplier: 2 },
        effects: []
      }
    };
    if (a.armor === true) {
      bodySlots.armor = { id: 'arm-chainmail', name: 'Chainmail', type: 'Armor', category: 'Medium', armorBonus: 5, maxDex: 2, acp: -5, checkPenalty: -5, spellFailure: 30, equipped: true, schemaVersion: 3, armor: { armorType: 'Medium', armorBonus: 5, enhancementBonus: 0, maxDex: 2, armorCheckPenalty: -5, arcaneSpellFailure: 30 }, effects: [] };
    } else if (a.armor === 'light') {
      bodySlots.armor = { id: 'arm-studded-leather', name: 'Studded Leather', type: 'Armor', category: 'Light', armorBonus: 3, maxDex: 5, acp: -1, checkPenalty: -1, spellFailure: 15, equipped: true, schemaVersion: 3, armor: { armorType: 'Light', armorBonus: 3, enhancementBonus: 0, maxDex: 5, armorCheckPenalty: -1, arcaneSpellFailure: 15 }, effects: [] };
    }
    if (a.shield) {
      bodySlots.offHand = { id: 'shd-heavy-steel-shield', name: 'Heavy Steel Shield', type: 'Shield', category: 'Shield', shieldBonus: 2, acp: -2, checkPenalty: -2, spellFailure: 15, equipped: true, schemaVersion: 3, armor: { armorType: 'Shield', armorBonus: 2, enhancementBonus: 0, maxDex: null, armorCheckPenalty: -2, arcaneSpellFailure: 15 }, effects: [] };
    }
    const clsKey = a.cls.toLowerCase();
    const classLevels = {}; classLevels[clsKey] = lv;
    return {
      schemaVersion: 3, name: a.cls + ' L' + lv, race: 'Human', size: 'Medium', alignment: 'Lawful Good',
      level: lv, bab: bab, baseSpeed: 30,
      baseAbilities: clone(a.abil), abilities: clone(a.abil),
      baseSaves: { fort: saveProg(a.good.fort), ref: saveProg(a.good.ref), will: saveProg(a.good.will) },
      hp: { baseMax: baseMax, conBonusHp: lv * conMod, max: hpMax, current: hpMax, temp: 0 },
      classLevels: classLevels, progression: prog,
      feats: [], specialAbilities: [], activeBuffs: [], inventory: [], bodySlots: bodySlots,
      tactical: { charging: !!S.ui.prevCharge, charge: !!S.ui.prevCharge, flanking: !!S.ui.prevFlank },
      customDb: [], customEntries: {}
    };
  }
  function attachEntryToPreviewChar(ch, exported, lv) {
    const e = clone(exported);
    e.id = e.id || 'crafter-preview-entry';
    e.name = e.name || 'Preview Rule';
    e.casterLevel = num(e.casterLevel, lv) || lv;
    ch.customDb = (ch.customDb || []).filter((x) => x && x.id !== e.id).concat([e]);
    ch.customEntries = Object.assign({}, ch.customEntries || {});
    ch.customEntries[e.id] = e;
    const bp = e.blueprint || 'feat';
    if (bp === 'spell' || bp === 'buff') {
      const bf = Object.assign({}, e, { active: true, enabled: true, casterLevel: lv, chosenEnergy: 'fire' });
      ch.activeBuffs = (ch.activeBuffs || []).concat([bf]);
    } else if (bp === 'weapon') {
      ch.bodySlots = ch.bodySlots || {};
      ch.bodySlots.mainHand = Object.assign({}, e, { equipped: true, type: 'Weapon' });
    } else if (bp === 'armor') {
      ch.bodySlots = ch.bodySlots || {};
      const isShd = (e.armor && e.armor.armorType === 'Shield') || e.type === 'Shield';
      ch.bodySlots[isShd ? 'offHand' : 'armor'] = Object.assign({}, e, { equipped: true });
    } else if (bp === 'wondrous') {
      const it = Object.assign({}, e, { equipped: true, active: true });
      ch.inventory = (ch.inventory || []).concat([it]);
    } else if (bp === 'race') {
      if (e.race && e.race.kind === 'template') ch.templates = (ch.templates || []).concat([{ id: e.id, name: e.name }]);
      else { ch.race = e.name; ch.raceId = e.id; }
      ch.specialAbilities = (ch.specialAbilities || []).concat([Object.assign({}, e, { active: true })]);
    } else {
      const ft = Object.assign({}, e, { active: true, chosenWeapon: 'Longsword', chosenEnergy: 'fire', choice: 'Longsword' });
      ch.feats = (ch.feats || []).concat([ft]);
    }
    if (Array.isArray(e.modes) && e.modes.length) {
      const firstActive = e.modes.find((m) => m && Array.isArray(m.effects) && m.effects.length > 0);
      if (firstActive) {
        ch.activeModes = Object.assign({}, ch.activeModes || {});
        ch.activeModes[e.id] = firstActive.id;
      }
    }
    return e;
  }
  function computeEntrySheetDiff(enInput, archKey, lvl) {
    const RE = getRE();
    if (!RE || typeof RE.deriveSheet !== 'function') return { diffs: [], notes: [], ready: false };
    const lv = Math.max(1, Math.min(20, num(lvl, 5)));
    const exported = enInput && enInput.schemaVersion === 3 && !enInput.origin ? enInput : exportEntry(enInput || S.entry);
    const ch0 = buildPreviewChar(archKey || 'fighter', lv);
    const ch1 = buildPreviewChar(archKey || 'fighter', lv);
    const attached = attachEntryToPreviewChar(ch1, exported, lv);
    let v0, v1;
    try {
      v0 = RE.deriveSheet(ch0, []);
      v1 = RE.deriveSheet(ch1, [attached]);
    } catch (e) {
      return { diffs: [], notes: ['Preview error: ' + ((e && e.message) || 'failed')], ready: false };
    }
    const diffs = [], notes = [];
    const pushNum = (lbl, a, b, fmt) => {
      const na = num(a, 0), nb = num(b, 0);
      if (na === nb) return;
      const d = nb - na;
      const f = fmt || ((x) => String(x));
      diffs.push({ label: lbl, from: f(na), to: f(nb), delta: (d > 0 ? '+' : '') + d, up: d > 0 });
    };
    const sFmt = (x) => (x >= 0 ? '+' + x : String(x));
    ABILITIES.forEach((ab) => { const k = ab[0]; pushNum(k.toUpperCase(), v0.abilities && v0.abilities[k], v1.abilities && v1.abilities[k]); });
    pushNum('AC', v0.ac && v0.ac.total, v1.ac && v1.ac.total);
    pushNum('Touch AC', v0.ac && v0.ac.touch, v1.ac && v1.ac.touch);
    pushNum('Flat-Footed AC', v0.ac && v0.ac.flatFooted, v1.ac && v1.ac.flatFooted);
    pushNum('Fort', v0.saves && v0.saves.fort, v1.saves && v1.saves.fort, sFmt);
    pushNum('Ref', v0.saves && v0.saves.ref, v1.saves && v1.saves.ref, sFmt);
    pushNum('Will', v0.saves && v0.saves.will, v1.saves && v1.saves.will, sFmt);
    pushNum('Max HP', v0.hp && v0.hp.max, v1.hp && v1.hp.max);
    if (num(v0.hp && v0.hp.temp) !== num(v1.hp && v1.hp.temp)) pushNum('Temp HP', v0.hp && v0.hp.temp, v1.hp && v1.hp.temp);
    pushNum('BAB', v0.combat && v0.combat.bab, v1.combat && v1.combat.bab, sFmt);
    pushNum('Init', v0.combat && v0.combat.initiative, v1.combat && v1.combat.initiative, sFmt);
    pushNum('Grapple', v0.combat && v0.combat.grapple, v1.combat && v1.combat.grapple, sFmt);
    pushNum('Speed', v0.combat && v0.combat.speed && v0.combat.speed.land, v1.combat && v1.combat.speed && v1.combat.speed.land, (x) => x + ' ft.');
    ['fly', 'swim', 'climb', 'burrow'].forEach((mv) => {
      const s0 = num(v0.combat && v0.combat.speed && v0.combat.speed[mv]), s1 = num(v1.combat && v1.combat.speed && v1.combat.speed[mv]);
      if (s0 !== s1) pushNum(cap1(mv), s0, s1, (x) => x + ' ft.');
    });
    const w0 = v0.combat && v0.combat.weapons && v0.combat.weapons[0];
    const w1 = v1.combat && v1.combat.weapons && v1.combat.weapons[0];
    if (w0 && w1) {
      pushNum('Melee Atk', w0.attackBonus !== undefined ? w0.attackBonus : w0.totalAttack, w1.attackBonus !== undefined ? w1.attackBonus : w1.totalAttack, sFmt);
      if (w0.damageFormula && w1.damageFormula && w0.damageFormula !== w1.damageFormula) {
        diffs.push({ label: 'Weapon Dmg', from: w0.damageFormula, to: w1.damageFormula, delta: '', up: true });
      }
    }
    const sk0 = v0.skillsBonusMap || {}, sk1 = v1.skillsBonusMap || {};
    Object.keys(sk1).forEach((sk) => {
      const a = num(sk0[sk] && sk0[sk].total !== undefined ? sk0[sk].total : sk0[sk], 0);
      const b = num(sk1[sk] && sk1[sk].total !== undefined ? sk1[sk].total : sk1[sk], 0);
      if (a !== b && diffs.length < 12) pushNum(cap1(sk.replace(/^skill\./, '')), a, b, sFmt);
    });
    const d0 = v0.defenses || {}, d1 = v1.defenses || {};
    if (num(d0.sr) !== num(d1.sr)) pushNum('SR', d0.sr, d1.sr);
    if (num(d0.fastHealing) !== num(d1.fastHealing)) pushNum('Fast Healing', d0.fastHealing, d1.fastHealing);
    (d1.immunities || []).filter((x) => (d0.immunities || []).indexOf(x) < 0).forEach((im) => notes.push('Immune: ' + cap1(im)));
    (d1.dr || []).filter((x) => !(d0.dr || []).some((y) => JSON.stringify(y) === JSON.stringify(x))).forEach((dr) => notes.push('DR ' + (typeof dr === 'string' ? dr : (dr.amount || dr.value) + '/' + (dr.bypass || '—'))));
    Object.keys(d1.resistances || {}).forEach((el) => { if (num(d1.resistances[el]) > num((d0.resistances || {})[el])) notes.push('Resist ' + cap1(el) + ' ' + d1.resistances[el]); });
    const conds0 = ((v0.ac && v0.ac.conditionalBonuses) || []).concat((v0.saves && v0.saves.conditionalBonuses) || []);
    const conds1 = ((v1.ac && v1.ac.conditionalBonuses) || []).concat((v1.saves && v1.saves.conditionalBonuses) || []);
    conds1.slice(conds0.length).forEach((c) => notes.push('Situational: ' + sFmt(num(c.val || c.value, 0)) + ' ' + (c.target || c.save || 'Bonus') + ' (' + c.condition + ')'));
    return { diffs: diffs, notes: notes, ready: true, charName: ch0.name || 'Sample' };
  }
  function renderSheetDiffBody() {
    if (!S.ui.prevOpen) return '';
    const hasParent = !!getParentSheetChar();
    const arch = (!hasParent && S.ui.prevArch === 'sheet') ? 'fighter' : (S.ui.prevArch || (hasParent ? 'sheet' : 'fighter'));
    const res = computeEntrySheetDiff(S.entry, arch, S.ui.prevLvl);
    if (!res.ready) return '';
    const pills = res.diffs.map((d) =>
      '<span class="fs-preview-diff' + (d.up ? '' : ' down') + '">' + esc(d.label) + ' ' + esc(d.from) + ' → ' + esc(d.to) + (d.delta ? ' (' + esc(d.delta) + ')' : '') + '</span>'
    ).concat(res.notes.map((n) => '<span class="fs-preview-diff info">' + esc(n) + '</span>'));
    if (!pills.length) {
      const cov = entryCoverageStats(S.entry);
      return cov.mech > 0
        ? '<span class="fs-hint">No net stat change on ' + esc(res.charName) + ' (check target selection, active condition toggles, or non-stacking bonus overlap).</span>'
        : '<span class="fs-hint">Add a mechanical Rule Block to preview live character stat changes (AC, Saves, Attack, HP, Defenses…).</span>';
    }
    return pills.join('');
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
    if (en.blueprint === 'monster') sub = en.monster.size + ' ' + en.monster.creatureType + (en.monster.subtypes ? ' (' + en.monster.subtypes + ')' : '');
    const cov = entryCoverageStats(en);
    const covPill = cov.total > 0
      ? '<span class="fs-pill ' + (cov.mech === cov.total ? 'emerald' : cov.mech > 0 ? 'amber' : 'dim') + '" title="Mechanical vs. narrative blocks in this entry">' + cov.mech + '/' + cov.total + ' Mechanical</span>'
      : '';
    let l1 = '<span class="fs-live-icon">' + bp.icon + '</span><span class="fs-live-name">' + esc(entryName(en)) + '</span><span class="fs-pill indigo">' + esc(sub) + '</span>' +
      '<span class="fs-pill ' + (en.origin.mode === 'new' ? 'dim' : en.origin.mode === 'override' ? 'amber' : 'sky') + '">' + esc(ORIGIN_LABEL[en.origin.mode]) + (en.origin.srdName && en.origin.mode !== 'new' ? ': ' + esc(en.origin.srdName) : '') + '</span>' +
      covPill +
      en.tags.map((t) => '<span class="fs-pill purple">' + esc(t) + '</span>').join('');
    let hasGrow = false;
    if (has('chassis')) { const v = chassisView(en.chassis, en); l1 += '<span class="fs-grow-gap"></span><span class="fs-pill ' + (v.effective > 10 ? 'rose' : 'emerald') + '">' + sgn(v.effective) + ' / +10</span><span class="fs-pill amber">💰 ' + gp(v.gpTotal) + '</span>'; hasGrow = true; }
    else if (isItemBp(en.blueprint) && num(en.item.price)) { l1 += '<span class="fs-grow-gap"></span><span class="fs-pill amber">💰 ' + gp(en.item.price) + '</span>'; hasGrow = true; }
    else if (en.blueprint === 'monster') { l1 += '<span class="fs-grow-gap"></span><span class="fs-pill amber">⚔️ CR ' + esc(en.monster.cr || '1') + '</span><span class="fs-pill emerald">💚 ' + num(en.monster.hp, 1) + ' HP</span>'; hasGrow = true; }
    const segs = rawHeaderLine(en);
    const l2 = segs.length ? segs.map(esc).join(' <span class="fs-sep">•</span> ') : '<span class="fs-hint">Configure the sections below — the clean RAW stat line renders here.</span>';
    const pills = summaryPills(en);
    const l3 = pills.length ? pills.map((p) => '<span class="fs-pill ' + p[0] + '">' + esc(p[1]) + '</span>').join('') : '<span class="fs-hint">Snap Rule Blocks below to compose resources, triggers, carriers, stats, rolls, attacks, defenses, and effects.</span>';
    const warns = has('chassis') ? chassisView(en.chassis, en).warnings : [];
    liveMetrics.pillsCount = pills.length;
    if (!hasGrow) l1 += '<span class="fs-grow-gap"></span>';
    l1 += '<button type="button" class="fs-btn fs-xs fs-live-toggle" data-action="toggle-live">▴ Collapse</button>';
    const hasParent = !!getParentSheetChar();
    const curArch = (!hasParent && S.ui.prevArch === 'sheet') ? 'fighter' : (S.ui.prevArch || (hasParent ? 'sheet' : 'fighter'));
    const archOpts = (hasParent ? [['sheet', '🧙 Active Sheet Character']] : []).concat(Object.keys(PREVIEW_ARCHETYPES).map((k) => [k, PREVIEW_ARCHETYPES[k].label]));
    const lvlCtrl = curArch === 'sheet'
      ? ''
      : '<label class="fs-row" style="gap:4px;font-size:11px;color:var(--text-secondary)"><span>Lvl <b>' + num(S.ui.prevLvl, 5) + '</b></span><input type="range" min="1" max="20" value="' + num(S.ui.prevLvl, 5) + '" data-uibind="prevLvl" data-t="num" style="width:80px;accent-color:#818cf8"></label>';
    const tacBtns = '<button type="button" class="lego-pill' + (S.ui.prevCharge ? ' on' : '') + '" data-action="prev-toggle-tac" data-k="prevCharge" title="Simulate Charge in Live Preview">Charge</button>' +
      '<button type="button" class="lego-pill' + (S.ui.prevFlank ? ' on' : '') + '" data-action="prev-toggle-tac" data-k="prevFlank" title="Simulate Flanking in Live Preview">Flank</button>';
    const prevStrip = '<div class="fs-preview-strip"><span class="fs-label-mini" style="margin:0">⚡ Sheet Diff:</span>' +
      sel('prevArch', curArch, archOpts, { scope: 'ui', narrow: true, style: 'height:24px;font-size:11px;padding:0 22px 0 7px' }) +
      lvlCtrl + tacBtns + '<span style="display:inline-flex;flex-wrap:wrap;gap:5px;align-items:center">' + live('sheet-diff', '') + '</span></div>';
    const liveEl = $('#fs-live');
    liveEl.innerHTML = '<div class="fs-live-line">' + l1 + '</div><div class="fs-live-more"><div class="fs-live-more-inner"><div class="fs-live-line fs-live-card">' + l2 + '</div><div class="fs-live-line">' + l3 + '</div>' + (warns.length ? '<div class="fs-live-line" style="font-size:11px">' + warns.slice(0, 2).map((w) => '<span class="fs-down">⛔ ' + esc(w) + '</span>').join(' ') + '</div>' : '') + prevStrip + '</div></div>';
    measureLiveMetrics();
    syncLiveScroll(false);
  }

  // --------------------------------------------------------------------------
  // 14. Render: Lego Core V3 Scratch blocks & 11 blueprints
  // --------------------------------------------------------------------------
  const L = (t) => '<span class="lego-lbl">' + t + '</span>';
  const F = (lbl, body, span) => '<div class="lego-field' + (span ? ' ' + span : '') + '">' + (lbl ? '<span class="lego-field-lbl">' + lbl + '</span>' : '') + '<div class="lego-field-body">' + body + '</div></div>';
  const G = (cols, inner) => '<div class="lego-grid lego-cols-' + cols + '">' + inner + '</div>';
  const H = (titleHtml, extraHtml) => '<div class="lego-head">' + titleHtml + (extraHtml || '') + '</div>';
  const hat = (color, inner) => '<div class="lego-hat lego-tab ' + color + '">' + inner + '</div>';
  const stack = (color, inner) => '<div class="lego-block lego-tab ' + color + '">' + inner + '</div>';
  const delBtn = (action, data) => '<button type="button" class="lego-del" data-action="' + action + '"' + Object.keys(data).map((k) => ' data-' + k + '="' + esc(data[k]) + '"').join('') + ' title="Remove">✕</button>';
  function cBlock(color, head, inner) { return '<div class="lego-c ' + color + '"><div class="c-top">' + head + '</div><div class="c-mouth"><div class="c-spine"></div><div class="c-inner">' + inner + '</div></div><div class="c-bot lego-tab"></div></div>'; }

  const USE_MODES = [['passive', 'Passive (Always On)'], ['atwill', '♾️ At-Will'], ['perDay', '🔄 X / Day (Resets Daily)'], ['perEncounter', '⚡ X / Encounter'], ['charges', '🧪 X Charges / Uses (Depletes)'], ['spellSlot', '🔮 Expend Spell Slot'], ['resourcePool', '🔥 Expend Resource Pool'], ['cooldown', '⏳ Cooldown Rounds (e.g. 1d4)']];
  function usageFields(p, u, cols) {
    const modeSel = sel(p + '.mode', u.mode, USE_MODES, { narrow: true });
    const wideSpan = cols === 4 ? 'lego-span-3' : cols === 3 ? 'lego-span-2' : '';
    if (['perDay', 'perEncounter', 'charges'].indexOf(u.mode) >= 0) {
      const lbl = u.mode === 'charges' ? 'Charges / Uses' : u.mode === 'perEncounter' ? 'Uses / Encounter' : 'Uses / Day';
      return F('Usage Mode', modeSel, wideSpan) + F(lbl, inp(p + '.n', u.n, { num: true, min: 1, max: 50 }));
    }
    if (u.mode === 'spellSlot') {
      return F('Usage Mode', modeSel, wideSpan) + F('Slot Level', sel(p + '.slotLevel', u.slotLevel, range(0, 9).map((n) => [n, 'Slot Level ' + n]), { narrow: true, num: true }));
    }
    if (u.mode === 'resourcePool') {
      return F('Usage Mode', modeSel, cols === 2 ? 'lego-span-full' : cols === 4 ? 'lego-span-2' : '') +
        F('Resource Pool', '<input class="fs-in" data-bind="' + p + '.pool" list="fs-pool-list" value="' + esc(u.pool) + '">') +
        F('Pool Cost', inp(p + '.poolCost', u.poolCost, { num: true, min: 1 }));
    }
    if (u.mode === 'cooldown') {
      return F('Usage Mode', modeSel, wideSpan) + F('Cooldown (Rounds)', inp(p + '.cooldown', u.cooldown, { ph: '1d4+1' }));
    }
    return F('Usage Mode', modeSel, 'lego-span-full');
  }

  function altEditor(ri, ai, a) {
    const p = 'prereqs.' + ri + '.alts.' + ai + '.';
    const head = H(L(ai > 0 ? 'OR Alternative' : 'Requirement'), '<button type="button" class="lego-del" data-action="remove-alt" data-ri="' + ri + '" data-ai="' + ai + '" title="Remove">✕</button>');
    const kindF = F('Requirement Kind', sel(p + 'kind', a.kind, [['ability', 'Ability Score'], ['bab', 'Base Attack Bonus'], ['skill', 'Skill Ranks'], ['feat', 'Feat / Tag Pool / Ability'], ['level', 'Caster / Class Level'], ['alignment', 'Alignment'], ['spellcasting', 'Spellcasting'], ['deity', 'Patron Deity'], ['custom', 'Special / DM Requirement']], { narrow: true }));
    switch (a.kind) {
      case 'ability':
        return head + G(3, kindF + F('Ability Score', sel(p + 'ability', a.ability, ABIL_OPTS, { narrow: true })) + F('Minimum Score', sel(p + 'min', a.min, range(3, 30).map((n) => [n, 'Min ' + n]), { narrow: true, num: true })));
      case 'bab':
        return head + G(2, kindF + F('Minimum BAB', sel(p + 'min', a.min, range(1, 20).map((n) => [n, 'Base Attack Bonus +' + n]), { narrow: true, num: true })));
      case 'skill':
        return head + G(3, kindF + F('Skill', sel(p + 'skill', a.skill, allSkills().map((s) => [s.key, s.name]), { narrow: true })) + F('Minimum Ranks', sel(p + 'min', a.min, range(1, 23).map((n) => [n, n + ' ranks']), { narrow: true, num: true })));
      case 'feat':
        return head + G(2, kindF + F('Required Feat / Ability', spotHtml('prereq', ri + ':' + ai, { ph: a.feat ? '🔍 ' + altText(a) : '🔍 Pick Feat / Tag Pool…' })));
      case 'level':
        return head + G(a.levelKind === 'classLevel' ? 4 : 3,
          kindF +
          F('Level Kind', sel(p + 'levelKind', a.levelKind, [['casterLevel', 'Caster Level'], ['charLevel', 'Character Level'], ['classLevel', 'Class Level']], { narrow: true })) +
          (a.levelKind === 'classLevel' ? F('Class Name', inp(p + 'cls', a.cls, { ph: 'Fighter' })) : '') +
          F('Minimum Level', sel(p + 'min', a.min, range(1, 20).map((n) => [n, '≥ ' + n]), { narrow: true, num: true }))
        );
      case 'alignment':
        return head + G(2, kindF + F('Allowed Alignment', sel(p + 'align', a.align, ALIGN_REQS.map((x) => [x, ALIGN_NAMES[x] || x]), { narrow: true })));
      case 'custom':
        return head + G(2, kindF + F('Special Requirement', inp(p + 'text', a.text, { ph: 'e.g. Must have slain a dragon; DM approval' })));
      case 'spellcasting':
        return head + G(3, kindF + F('Tradition', sel(p + 'cls', a.cls || 'any', [['any', 'Any'], ['arcane', 'Arcane'], ['divine', 'Divine']], { narrow: true })) + F('Minimum Spell Level', sel(p + 'min', a.min, range(0, 9).map((n) => [n, 'Spell Level ' + n]), { narrow: true, num: true })));
      case 'deity':
        return head + G(2, kindF + F('Patron Deity', inp(p + 'feat', a.feat, { list: 'fs-deity-list', ph: 'Pelor' })));
      default:
        return head + G(1, kindF);
    }
  }
  function bonusTypeOpts() { return allBonusTypes().map((b) => [b.id, b.id + (b.custom ? ' (custom)' : '') + (b.stacks ? ' — stacks' : '') + (b.lostFF ? ', lost Flat-Footed' : '') + (b.cap ? ' — max +' + b.cap : '')]); }
  function targetChips(list, p) {
    return (list || []).map((t, i) => '<span class="fs-pill indigo">' + esc(targetLabel(t)) + '<span class="fs-x" data-action="remove-target" data-p="' + p + '" data-i="' + i + '">×</span></span>').join('') +
      '<select class="fs-sel fs-narrow" data-push="' + p + '"><option value="">+ Target</option>' + allTargetGroups().map((g) => '<optgroup label="' + esc(g[0]) + '">' + opts(g[1], '') + '</optgroup>').join('') + '</select>';
  }

  function statControlsHtml(p, m) {
    const mode = modMode(m);
    const modeF = F('Modifier Mode', sel(p + '.mode', mode, [['flat', 'Flat (+/-)'], ['stat', '+ @Stat / @Resource'], ['replaceStat', '🔄 Stat / Formula Swap (A → B)'], ['perCL', 'Scale by Level'], ['formula', '∑ Custom Formula']], { narrow: true }));
    if (mode === 'replaceStat') {
      const swapTgt = normalizeSwapTargetKey(m.swapTarget || (m.targets && m.targets[0]) || 'atk.melee.abilityMod');
      const isAdd = m.subOp === 'add';
      const hasFlatCap = isAdd && m.cap === 'flat';
      return G(3,
        modeF +
        F('Component to Swap (A)', selGroups(p + '.swapTarget', swapTgt, SWAP_TARGET_GROUPS), 'lego-span-2') +
        F('Swap Rule', sel(p + '.subOp', m.subOp || 'max', SWAP_OPS, { narrow: true })) +
        F('With Source (B)', sel(p + '.toStat', m.toStat || 'wis', SWAP_SOURCES, { narrow: true })) +
        F('Weapon / Roll Scope', sel(p + '.swapScope', m.swapScope || 'all', SWAP_SCOPES, { narrow: true })) +
        (isAdd ? F('Cap Mode', sel(p + '.cap', m.cap || 'none', [['none', 'No Cap'], ['classLevel', 'Cap @Class Lvl'], ['flat', 'Cap Max N']], { narrow: true })) : '') +
        (hasFlatCap ? F('Max Cap', inp(p + '.capVal', m.capVal == null ? 5 : m.capVal, { num: true })) : '') +
        condFieldHtml(p + '.condition', m.condition || '', 'stat', 'lego-span-full')
      );
    }
    const tgtRow = F('Target', targetChips(m.targets || [], p + '.targets') + ((m.targets || []).length ? '' : '<div class="fs-hint" style="color:#fbbf24;margin-top:4px">⚠ No target selected. Pick at least one target or this bonus will not apply.</div>'), 'lego-span-full');
    const btypeF = F('Bonus Type', sel(p + '.btype', m.btype || 'Untyped', bonusTypeOpts().map((x) => [x[0], x[0]]), { narrow: true }));
    if (mode === 'formula') {
      return G(4,
        tgtRow +
        modeF +
        F('Formula Expression', inp(p + '.formula', m.formula || '', { ph: '2 + min(3, floor(@cl / 6))', fx: true }) + fxRefBtn('value', p + '.formula'), 'lego-span-2') +
        btypeF +
        condFieldHtml(p + '.condition', m.condition || '', 'stat', 'lego-span-full')
      );
    }
    if (mode === 'stat') {
      const hasFlatCap = m.cap === 'flat';
      return G(3,
        tgtRow +
        modeF +
        F('Source @Stat / @Pool', sel(p + '.stat', m.stat || 'chaMod', statFormulaOpts(S.entry), { narrow: true })) +
        F('Multiplier', sel(p + '.mult', m.mult == null ? 1 : m.mult, [[1, '×1'], [2, '×2'], [3, '×3'], [0.5, '×½'], [-1, '×-1']], { narrow: true, num: true })) +
        F('Base Offset', inp(p + '.value', m.value == null ? 0 : m.value, { num: true, ph: '0' })) +
        F('Cap Mode', sel(p + '.cap', m.cap || 'none', [['none', 'No Cap'], ['classLevel', 'Cap @Class Lvl'], ['flat', 'Cap Max N']], { narrow: true })) +
        (hasFlatCap ? F('Max Cap', inp(p + '.capVal', m.capVal == null ? 5 : m.capVal, { num: true })) : '') +
        btypeF +
        condFieldHtml(p + '.condition', m.condition || '', 'stat', 'lego-span-full')
      );
    }
    if (mode === 'perCL') {
      return G(3,
        tgtRow +
        modeF +
        F('Step Bonus (+)', inp(p + '.value', m.value == null ? 1 : m.value, { num: true })) +
        F('Every N Levels', sel(p + '.per', m.per || 3, range(1, 10).map((n) => [n, n + ' CL/Lvl']), { narrow: true, num: true })) +
        F('Minimum Bonus', inp(p + '.min', m.min == null ? 0 : m.min, { num: true })) +
        F('Maximum Cap', inp(p + '.max', m.max == null ? 5 : m.max, { num: true })) +
        btypeF +
        condFieldHtml(p + '.condition', m.condition || '', 'stat', 'lego-span-full')
      );
    }
    if ((m.targets || []).includes('size.effective')) {
      return G(4,
        tgtRow +
        modeF +
        F('Size Categories Larger', inp(p + '.value', m.value, { num: true })) +
        btypeF +
        F('Scopes (comma list)', inp(p + '.appliesTo', Array.isArray(m.appliesTo) ? m.appliesTo.join(', ') : (m.appliesTo || ''), { ph: 'grapple, bullRush, trip, overrun, opposedSize, weaponSize' }), 'lego-span-full')
      );
    }
    return G(3,
      tgtRow +
      modeF +
      F('Bonus Value', inp(p + '.value', m.value, { num: true })) +
      btypeF +
      condFieldHtml(p + '.condition', m.condition || '', 'stat', 'lego-span-full')
    );
  }

  function whenBranchControls(flow, br, bp) {
    if (flow === 'while') {
      const ck = br.condKind || 'state';
      const kindSel = sel(bp + '.condKind', ck, [
        ['state', 'While State Active (Vocabulary)'],
        ['activation', 'While Ability Activated (Note)'],
        ['bound', 'While Bound to Chakra / Pact'],
        ['levelTier', 'CL / Class / HD Tier'],
        ['choicePath', '🔀 Chosen Path (@Choice)'],
        ['synergy', 'Active #Tag / Synergy'],
        ['situational', 'Equipment / Combat State (Situational)'],
        ['notFlatFooted', 'While Not Flat-Footed'],
        ['wieldingChosenShield', 'While Wielding Chosen Shield'],
        ['wieldingChosenWeapon', 'While Wielding Chosen Weapon'],
        ['wieldingTwoWeapons', 'While Two-Weapon / Double Weapon Fighting'],
        ['vsAoOFromMovement', 'vs. Attacks of Opportunity from Movement'],
        ['castingChosenSchool', 'When Casting Chosen School (@Choice)'],
        ['oath', '⚖️ Oath / Taboo Unbroken']
      ], { narrow: true });
      if (WHEN_COND_LABELS[ck]) {
        return G(2, F('Condition Kind', kindSel) + F('Condition Note (Optional)', inp(bp + '.condText', br.condText || '', { ph: WHEN_COND_LABELS[ck] }) + live('when-cond-badge', bp)));
      }
      if (ck === 'choicePath') {
        return G(2,
          F('Condition Kind', kindSel) +
          F('Unlock Level / HD', sel(bp + '.minLvl', num(br.minLvl, 5), range(1, 20).map((n) => [n, 'Lvl / HD ≥ ' + n]), { narrow: true, num: true })) +
          F('Path Variable (@Choice)', sel(bp + '.choiceVar', br.choiceVar || 'combat_path', choiceVarOpts(S.entry), { narrow: true })) +
          F('Chosen Branch', inp(bp + '.choiceVal', br.choiceVal || 'Offense', { list: 'fs-branch-opts', ph: 'Offense / Defense' }))
        );
      }
      if (ck === 'oath') {
        return G(2,
          F('Condition Kind', kindSel) +
          F('On Break', sel(bp + '.onBreak', br.onBreak || 'suppress', [
            ['suppress', 'Suppressed While Violated'],
            ['loss24h', 'Lost for 24 Hours'],
            ['atonement', 'Lost Until Atonement'],
            ['irrevocable', 'Irrevocably Lost']
          ], { narrow: true })) +
          F('Oath / Taboo', inp(bp + '.oathRule', br.oathRule || '', { list: 'fs-oath-list', ph: 'Oath / Taboo condition…' }), 'lego-span-full')
        );
      }
      return G(2, F('Condition Kind', kindSel) + F('Condition / Tier', inp(bp + '.condText', br.condText || '', { list: 'fs-cond-vocab', ph: ck === 'state' ? 'charging / flanking / unarmored…' : 'Totem Chakra / @cl >= 11 / situational note…' }) + live('when-cond-badge', bp)));
    }
    const trig = br.trigger || 'activate';
    const ck = br.costKind || 'none';
    const cells = [
      F('Trigger', sel(bp + '.trigger', trig, [
        ['activate', 'Activate Action'],
        ['enterState', 'On Enter State'],
        ['meleeHit', 'On Melee Hit'],
        ['critHit', 'On Critical Hit'],
        ['sneakHit', 'On Sneak Attack Hit'],
        ['takeDamage', 'On Taking Damage'],
        ['meleeStruck', 'When Struck in Melee'],
        ['castSpell', 'When Casting Spell']
      ], { narrow: true }))
    ];
    if (trig === 'activate') cells.push(F('Action', sel(bp + '.action', br.action || 'Swift', ['Standard', 'Swift', 'Move', 'Immediate', 'Free', 'Full-Round'], { narrow: true })));
    if (['enterState', 'castSpell'].indexOf(trig) >= 0) cells.push(F('State / Spell Filter', inp(bp + '.targetText', br.targetText || '', { ph: 'Bloodrage / Arcane Spell' })));
    cells.push(F('Cost Mode', sel(bp + '.costKind', ck, [
      ['none', 'Free / No Cost'],
      ['pool', 'Spend @Pool'],
      ['forgoSA', 'Forgo Nd6 Sneak Attack'],
      ['skillCheck', 'Skill Check DC'],
      ['expendFocus', 'Expend Psionic Focus'],
      ['cooldown', 'Cooldown Rounds'],
      ['perDay', 'N / Day']
    ], { narrow: true })));
    if (ck === 'pool') {
      cells.push(F('Pool Cost', inp(bp + '.costFormula', br.costFormula || '1', { ph: '1 / Spell Level', fx: true }) + fxRefBtn('value', bp + '.costFormula')));
      cells.push(F('Resource Pool', '<input class="fs-in" data-bind="' + bp + '.poolName" list="fs-pool-list" value="' + esc(br.poolName || 'Arcane Pool') + '">'));
    } else if (ck === 'forgoSA') {
      cells.push(F('Sacrificed SA Dice (d6)', inp(bp + '.costVal', br.costVal || 1, { num: true, min: 1 })));
    } else if (ck === 'skillCheck') {
      cells.push(F('Skill Check Formula', inp(bp + '.checkFormula', br.checkFormula || '', { ph: 'Truespeak DC 15 + 2×CR + 2×@uses_today', fx: true }) + fxRefBtn('dc', bp + '.checkFormula'), 'lego-span-full'));
    } else if (ck === 'cooldown') {
      cells.push(F('Cooldown', inp(bp + '.cooldownText', br.cooldownText || '5 rounds', { ph: '5 rounds / 1d4' })));
    } else if (ck === 'perDay') {
      cells.push(F('Uses / Day', inp(bp + '.costVal', br.costVal || 1, { num: true, min: 1 })));
    }
    const gCols = cells.length === 2 || cells.length === 4 ? 2 : 3;
    return G(gCols, cells.join(''));
  }

  function blockControls(b, p) {
    switch (b.type) {
      case 'resource': {
        const rm = b.resMode || 'spend';
        const showScaling = ['spend', 'buffer'].indexOf(rm) >= 0;
        const showAbil = showScaling && ['plusMod', 'halfLvlPlusMod', 'twoPerLvlPlusMod'].indexOf(b.scaling) >= 0;
        const nameF = F('Resource Name', inp(p + '.name', b.name, { ph: 'Resource / Dial name' }));
        const keyF = F('Variable @Key', inp(p + '.varKey', b.varKey, { ph: 'var_key' }));
        const modeF = F('Resource Mode', sel(p + '.resMode', rm, [
          ['spend', 'Spendable Pool'],
          ['invest', 'Investable (Essentia)'],
          ['dial', 'Tactical Dial (0..Max)'],
          ['choice', '🔀 Branching Path / Choice'],
          ['focus', 'Binary Focus (0/1)'],
          ['buffer', 'Absorb / Steal Buffer']
        ], { narrow: true }));
        if (rm === 'choice') {
          return G(3,
            nameF + keyF + modeF +
            F('Unlock Level', sel(p + '.choiceUnlockLvl', num(b.choiceUnlockLvl, 5), range(1, 20).map((n) => [n, 'Lvl ' + n]), { narrow: true, num: true })) +
            F('Default Path', inp(p + '.defaultChoice', b.defaultChoice || 'Offense', { list: 'fs-branch-opts', ph: 'Default path' })) +
            F('Branch Options (Comma-Separated)', inp(p + '.choiceOptions', b.choiceOptions || 'Offense, Defense', { ph: 'Offense, Defense' }))
          );
        }
        const cells = [nameF, keyF, modeF];
        if (rm === 'invest') {
          cells.push(F('Capacity Rule', sel(p + '.capMode', b.capMode || 'chakra', [['chakra', 'Chakra Capacity'], ['flat', 'Flat Max'], ['level', '@Level']], { narrow: true })));
        } else if (rm === 'dial') {
          cells.push(F('Dial Ceiling', sel(p + '.maxMode', b.maxMode || 'spellLvl', [['flat', 'Flat N'], ['bab', '@BAB'], ['level', '@Level'], ['spellLvl', 'Spell Slot (1–9)'], ['pool', 'Pool Remaining']], { narrow: true })));
          if (b.maxMode === 'flat') cells.push(F('Max Dial Value', inp(p + '.max', b.max, { num: true })));
        } else if (showScaling) {
          cells.push(F('Base Max', inp(p + '.max', b.max, { num: true, min: 0 })));
          cells.push(F('Max Scaling', sel(p + '.scaling', b.scaling || 'flat', [
            ['flat', 'Flat'], ['level', '@Level'], ['halfLevel', '½ @Level'],
            ['plusMod', 'Base + @Mod'], ['halfLvlPlusMod', 'Base + ½ @Level + @Mod'], ['twoPerLvlPlusMod', 'Base + 2/Lvl + @Mod']
          ], { narrow: true })));
          if (showAbil) cells.push(F('Key Ability', sel(p + '.ability', b.ability || 'int', ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true })));
        }
        cells.push(F('Reset Cadence', sel(p + '.reset', b.reset || 'perDay', [['atWill', 'At-Will / Round'], ['cooldown', 'Cooldown Rounds'], ['perEncounter', 'Per Encounter'], ['perDay', 'Per Day']], { narrow: true })));
        if (b.reset === 'cooldown') cells.push(F('Cooldown', inp(p + '.cooldownText', b.cooldownText || '5 rounds', { ph: '5 rounds' })));
        if (rm === 'dial') {
          cells.push(F('Dial Cost', sel(p + '.dialCost', b.dialCost || 'free', [['free', 'Free Tradeoff'], ['spellSlot', 'Burn Spell Slot'], ['pool', 'Spend Pool']], { narrow: true })));
          if (b.dialCost === 'pool') cells.push(F('Cost Pool', '<input class="fs-in" data-bind="' + p + '.costPool" list="fs-pool-list" value="' + esc(b.costPool || '') + '">'));
        }
        return G(3, cells.join(''));
      }
      case 'when': {
        return G(1, F('Flow Mode', sel(p + '.flow', b.flow || 'while', [
          ['while', 'Continuous (While / Tier / Synergy)'],
          ['when', 'Event Trigger (When / Activate / On Hit)']
        ], { narrow: true })));
      }
      case 'table': {
        return G(1, F('Table Die', inp(p + '.die', b.die, { list: 'fs-dice-list', style: 'width:88px' })));
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
          const styleSel = sel(p + '.channelStyle', st, [
            ['spellstrikeFree', 'Spellstrike (Free Melee Weapon Atk)'],
            ['standardSingle', 'Arcane Channel (Standard 1 Melee Atk)'],
            ['fullAttackEach', 'Full-Attack Channel (Hits Every Struck Foe)'],
            ['spellStoring', 'Spell Storing Weapon (≤ Lvl N)']
          ], { narrow: true });
          if (st === 'spellStoring') {
            return G(3, F('Carrier Mode', modeSel) + F('Channel Style', styleSel) + F('Max Stored Spell Level', sel(p + '.maxSpellLvl', b.maxSpellLvl || 3, range(1, 9), { narrow: true, num: true })));
          }
          return G(2,
            F('Carrier Mode', modeSel) +
            F('Channel Style', styleSel) +
            F('Critical Rule', sel(p + '.critRule', b.critRule || 'weaponRangeX2', [
              ['weaponRangeX2', 'Weapon Crit Range, Spell ×2'],
              ['spell20x2', 'Spell Normal Crit (20/×2)'],
              ['fullWeaponCrit', 'Full Weapon Crit Range & Mult']
            ], { narrow: true })) +
            F('Touch Charge', chk(p + '.holdCharge', !!b.holdCharge, 'Hold Charge on Miss'))
          );
        }
        if (cm === 'rangedChannel') {
          return G(2, F('Carrier Mode', modeSel) + F('Delivery Rule', L('Imbue Arrow / Deliver Area or Touch Spell via Ranged Hit')));
        }
        if (cm === 'fullAttackCast') {
          return G(3, F('Carrier Mode', modeSel) + F('Attack Penalty', inp(p + '.atkPenalty', b.atkPenalty, { num: true })) + F('Hand Requirement', chk(p + '.offHandFree', !!b.offHandFree, 'Off-Hand Free')));
        }
        const cells = [
          F('Carrier Mode', modeSel),
          F('Transform', sel(p + '.transform', b.transform || 'empower', META_TRANSFORMS, { narrow: true }))
        ];
        if (b.transform === 'heighten') cells.push(F('DC / Level Bonus (+)', inp(p + '.dcBonus', b.dcBonus, { num: true })));
        if (b.transform === 'energySub' || b.transform === 'pierceRes') cells.push(F('Energy Type', sel(p + '.energy', b.energy, ['Fire', 'Cold', 'Acid', 'Electricity', 'Sonic', 'Any'], { narrow: true })));
        if (b.transform === 'rider') cells.push(F('Rider Effect', inp(p + '.rider', b.rider, { ph: '+1 Negative Level (Fell Drain)' })));
        cells.push(F('Metamagic Cost', sel(p + '.costMode', b.costMode || 'slot', META_COST_MODES, { narrow: true })));
        if (b.costMode === 'slot') cells.push(F('Slot Adjustment', sel(p + '.slotAdj', b.slotAdj, range(0, 6).map((n) => [n, '+' + n + ' Slot']), { narrow: true, num: true })));
        else if (b.costMode === 'rod') {
          cells.push(F('Uses / Day', inp(p + '.uses', b.uses, { num: true })));
          cells.push(F('Rod Tier (Max Spell Lvl)', sel(p + '.maxSpellLvl', b.maxSpellLvl, [[3, 'Lvl 3 (Lesser)'], [6, 'Lvl 6 (Normal)'], [9, 'Lvl 9 (Greater)']], { narrow: true, num: true })));
        } else if (b.costMode === 'sudden') {
          cells.push(F('Uses / Day', inp(p + '.uses', b.uses, { num: true })));
        } else if (b.costMode === 'pool') {
          cells.push(F('Pool Cost', inp(p + '.poolCost', b.poolCost, { num: true })));
          cells.push(F('Resource Pool', '<input class="fs-in" data-bind="' + p + '.pool" list="fs-pool-list" value="' + esc(b.pool) + '">'));
        } else if (b.costMode === 'essenceShape') {
          cells.push(F('Effective Spell Level', sel(p + '.maxSpellLvl', b.maxSpellLvl || 1, range(1, 9), { narrow: true, num: true })));
        }
        cells.push(F('Applies To Scope', inp(p + '.appliesTo', b.appliesTo, { ph: 'scope ([Fire] / ray / all)' })));
        return G(cells.length === 4 ? 2 : 3, cells.join(''));
      }
      case 'stat': return statControlsHtml(p, b);
      case 'roll': {
        const sc = b.scaling || 'flat';
        const hasDmg = b.kind === 'Damage' || b.kind === 'Ongoing / Round';
        const showFlat = b.die !== 'flat' && sc !== 'formula';
        let h = G((hasDmg || showFlat) ? 4 : 3,
          F('Roll Kind', sel(p + '.kind', b.kind || 'Damage', ['Damage', 'Healing', 'Temp HP', 'Ongoing / Round', 'Fast Healing'], { narrow: true })) +
          (sc === 'formula'
            ? F('Dice Formula', inp(p + '.dice', b.dice || '1d8+min(5,@cl)', { ph: '1d8+min(5,@cl)', fx: true }) + fxRefBtn('dice', p + '.dice'), 'lego-span-2')
            : F(b.die === 'flat' ? 'Flat Value' : 'Dice Count', inp(p + '.count', b.count, { num: true, min: 0 })) +
              F('Die / Unit', sel(p + '.die', b.die || 'd6', [['d4', 'd4'], ['d6', 'd6'], ['d8', 'd8'], ['d10', 'd10'], ['d12', 'd12'], ['2d6', '2d6'], ['flat', 'Flat']], { narrow: true })) +
              (showFlat ? F('Flat Bonus (+)', inp(p + '.flat', num(b.flat, 0), { num: true })) : '')
          ) +
          (hasDmg ? F('Damage Type', sel(p + '.dmgType', b.dmgType || 'Fire', DAMAGE_TYPES.slice(0, 16), { narrow: true })) : '')
        );
        if (sc === 'perCL') {
          h += G(4,
            F('Step Bonus (+)', inp(p + '.amount', b.amount == null ? 1 : b.amount, { num: true })) +
            F('Every N CL', sel(p + '.per', b.per || 1, range(1, 10).map((n) => [n, n + ' CL']), { narrow: true, num: true })) +
            F('Starting CL', sel(p + '.start', b.start || 1, range(1, 20).map((n) => [n, 'CL ' + n]), { narrow: true, num: true })) +
            F('Max Bonus (+)', inp(p + '.max', b.max == null ? 10 : b.max, { num: true }))
          );
        } else if (sc === 'perVar') {
          h += G(b.varMode === 'flat' ? 3 : 2,
            F('Resource @Key', sel(p + '.varKey', b.varKey || 'augment_pp', resourceVarOpts(S.entry), { narrow: true })) +
            F('Scaling Unit', sel(p + '.varMode', b.varMode || 'dice', [['dice', '+@X Dice'], ['flat', '+N×@X Flat']], { narrow: true })) +
            (b.varMode === 'flat' ? F('Per-Point Bonus', inp(p + '.amount', b.amount == null ? 1 : b.amount, { num: true })) : '')
          );
        }
        h += G(3,
          F('Scaling Mode', sel(p + '.scaling', sc, [['flat', 'Flat'], ['perCL', 'Scale by Level'], ['perVar', '+ @Resource'], ['formula', 'Formula']], { narrow: true })) +
          F('Critical Rule', sel(p + '.crit', b.crit || 'normal', [['normal', 'Normal Crit'], ['multiply', '×Crit'], ['onCritOnly', 'On Crit Only']], { narrow: true })) +
          F('Save Note', inp(p + '.save', b.save || '', { ph: 'save (Reflex half)' })) +
          condFieldHtml(p + '.condition', b.condition || '', 'roll', 'lego-span-full')
        );
        return h;
      }
      case 'attack': {
        const am = b.attackMode || 'natural';
        const modeSel = sel(p + '.attackMode', am, [
          ['natural', '🦷 Natural Attack'],
          ['extra', '⚡ Extra Attack (Haste / Flurry)'],
          ['weaponImbue', '⚔️✨ Temporary Weapon Imbue'],
          ['unarmedDie', '💥 Unarmed Base Die Scaling'],
          ['strikeBypass', '✨ Passive Strike / DR Bypass']
        ], { narrow: true });
        if (am === 'unarmedDie') {
          const up = b.unarmedProgression || 'monk';
          return G(2,
            F('Attack Mode', modeSel) +
            F('Die Progression', sel(p + '.unarmedProgression', up, [
              ['monk', 'Monk 1d6→2d10 Table (Size-Scaled)'],
              ['fixed', 'Set Base Unarmed Die (Size-Scaled)']
            ], { narrow: true })) +
            F(up === 'fixed' ? 'Base Unarmed Die' : 'Effective Monk Level Δ', up === 'fixed' ? inp(p + '.dice', b.dice || '1d6', { list: 'fs-dice-list' }) : inp(p + '.effLvlBonus', b.effLvlBonus == null ? 0 : b.effLvlBonus, { num: true })) +
            F('Notes', inp(p + '.rider', b.rider || '', { ph: 'note (manufactured & natural)' }))
          );
        }
        if (am === 'strikeBypass') {
          return G(2,
            F('Attack Mode', modeSel) +
            F('Applies To', sel(p + '.appliesToWeapon', b.appliesToWeapon || 'unarmed', [
              ['unarmed', 'Unarmed Strike'],
              ['wieldedSimple', 'Any Wielded Simple Weapon'],
              ['allMelee', 'All Melee / Natural Attacks']
            ], { narrow: true })) +
            F('Enhancement Equivalent', sel(p + '.enhEquivalent', num(b.enhEquivalent, 0), range(0, 5).map((n) => [n, n === 0 ? '+0 (DR Bypass Only)' : '+' + n + ' Enh']), { narrow: true, num: true })) +
            F('DR Bypass', inp(p + '.drBypassList', b.drBypassList || '', { ph: 'magic, lawful, adamantine' }))
          );
        }
        if (am === 'natural') {
          return G(3,
            F('Attack Mode', modeSel) +
            F('Priority', sel(p + '.natKind', b.natKind || 'primary', [
              ['primary', 'Primary (Full BAB, 1× Str)'],
              ['secondary', 'Secondary (-5 Atk, ½ Str)'],
              ['primary2h', 'Single Primary (1.5× Str)']
            ], { narrow: true })) +
            F('Attack Count', inp(p + '.count', b.count, { num: true, min: 1, max: 12 })) +
            F('Natural Weapon', inp(p + '.weaponName', b.weaponName, { list: 'fs-natwpn-list', ph: 'Claw / Bite' })) +
            F('Base Die', inp(p + '.dice', b.dice, { list: 'fs-dice-list' })) +
            F('Damage Type', sel(p + '.dmgType', b.dmgType, ['B/P/S', 'B & S', 'B, P & S', 'Slashing', 'Piercing', 'Bludgeoning', 'B & P'], { narrow: true })) +
            F('Limb', chk(p + '.usesHands', !!b.usesHands, 'Uses hands / arms (not with a wielded weapon)')) +
            F('Rider / Special', inp(p + '.rider', b.rider, { ph: 'Rend / +1d6 Fire' }), 'lego-span-full')
          );
        }
        if (am === 'extra') {
          const isFlurry = b.extraKind === 'flurry';
          return G(isFlurry ? 3 : 2,
            F('Attack Mode', modeSel) +
            F('Extra Attack Kind', sel(p + '.extraKind', b.extraKind || 'extraFull', [
              ['extraFull', 'Full BAB (Haste / Speed)'],
              ['flurry', 'With Penalty (Flurry / Rapid)']
            ], { narrow: true })) +
            F('Extra Attacks', inp(p + '.count', b.count, { num: true, min: 1, max: 6 })) +
            (isFlurry ? F('All Attacks Penalty (Δ)', inp(p + '.penalty', b.penalty, { num: true })) : '') +
            F('Notes', inp(p + '.rider', b.rider, { ph: 'notes…' }), isFlurry ? 'lego-span-2' : '')
          );
        }
        return G(4,
          F('Attack Mode', modeSel) +
          F('Duration', inp(p + '.duration', b.duration || '1 min', { ph: '1 min' })) +
          F('Budget Scaling', sel(p + '.budgetScaling', b.budgetScaling || 'per4Lvl', [['per4Lvl', '+1 at L1, +1/4 Lvls (max +N)'], ['flat', 'Flat Budget +N']], { narrow: true })) +
          F('Max Enhancement (+)', sel(p + '.maxBudget', b.maxBudget || 5, range(1, 10), { narrow: true, num: true })) +
          F('Allowed Properties', inp(p + '.allowedEnchs', b.allowedEnchs || '', { ph: 'Flaming, Frost, Shock, Keen, Speed' }), 'lego-span-full')
        );
      }
      case 'defense': {
        const dm = b.mode || 'Immunity';
        if (isPreservedDefenseBlock(b)) {
          return G(1, F('🔒 Preserved Defense Mechanic (Read-Only)',
            '<span class="fs-pill sky">mode: ' + esc(dm) + '</span> ' +
            (b.value !== undefined && b.value !== '' ? '<span class="fs-pill dim">value: <b>' + esc(String(b.value)) + '</b></span> ' : '') +
            (b.what ? '<span class="fs-pill dim">what: <b>' + esc(b.what) + '</b></span>' : '') +
            '<div class="fs-hint" style="width:100%;margin-top:4px">Preserved intact on Save &amp; Export so corpus mechanics are never lost.</div>'
          ));
        }
        const modeSel = sel(p + '.mode', dm, EDITABLE_DEFENSE_MODES, { narrow: true });
        if (dm === 'Size Change') {
          return G(2, F('Defense Kind', modeSel) + F('Size Step', sel(p + '.steps', b.steps, [[-2, SIZE_STEPS['-2']], [-1, SIZE_STEPS['-1']], [1, SIZE_STEPS['1']], [2, SIZE_STEPS['2']]], { narrow: true, num: true })));
        }
        if (dm === 'State Flag') {
          return G(2, F('Defense Kind', modeSel) + F('Condition / Lock', sel(p + '.flag', b.flag || 'negLevel', Object.keys(LOCK_LABEL).map((k) => [k, LOCK_LABEL[k]]), { narrow: true })));
        }
        if (dm === 'Spell Resistance') {
          const isLvl = b.srMode === 'level';
          return G(isLvl ? 2 : 3, F('Defense Kind', modeSel) + F('SR Formula', sel(p + '.srMode', b.srMode || 'flat', [['flat', 'Flat SR'], ['level', '10 + @Level / HD']], { narrow: true })) + (isLvl ? '' : F('SR Value', inp(p + '.value', b.value, { num: true }))));
        }
        if (dm === 'Concealment %') {
          return G(2, F('Defense Kind', modeSel) + F('Miss Chance (%)', inp(p + '.value', b.value || 20, { num: true, min: 5, max: 100 })));
        }
        if (['DR', 'Energy Resistance'].indexOf(dm) >= 0) {
          return G(3, F('Defense Kind', modeSel) + F('Amount', inp(p + '.value', b.value, { num: true })) + F('Bypass / Energy Type', inp(p + '.what', b.what, { list: 'fs-defense-list', ph: 'evil or good / Fire' })));
        }
        return G(2, F('Defense Kind', modeSel) + F('Trait / Scope', inp(p + '.what', b.what, { list: 'fs-defense-list', ph: 'Fear / Darkvision 60 ft. / Pounce' })));
      }
      case 'effect': {
        const ek = b.effectKind || ((b.flag || b.ruleFlag) ? 'ruleSwitch' : 'rule');
        if (isPreservedEffectBlock(b)) {
          const srcObj = b._src || b;
          const detailPairs = Object.keys(srcObj).filter((k) => ['id', 'type', 'effectKind', 'summary', '_src', '_srcType', '_srcSub'].indexOf(k) < 0 && srcObj[k] !== undefined && srcObj[k] !== '')
            .map((k) => '<span class="fs-pill dim">' + esc(k) + ': <b>' + esc(typeof srcObj[k] === 'object' ? JSON.stringify(srcObj[k]) : String(srcObj[k])) + '</b></span>').join(' ');
          return G(1, F('🔒 Preserved Engine Effect (Read-Only)',
            '<span class="fs-pill sky">effectKind: ' + esc(ek) + ' (' + esc(PRESERVED_EFFECT_LABELS[ek] || 'Corpus Mechanic') + ')</span> ' +
            (detailPairs || '') +
            '<div class="fs-hint" style="width:100%;margin-top:4px">This specialized corpus mechanic is preserved intact on Save &amp; Export so its engine behavior cannot be accidentally overwritten.</div>'
          ));
        }
        const modeSel = sel(p + '.effectKind', ek, EDITABLE_EFFECT_KINDS, { narrow: true });
        if (ek === 'ruleSwitch') {
          const curFlag = b.flag || b.ruleFlag || 'noAutoFailFortSaveOnNat1';
          const switchOpts = RULE_SWITCH_LABEL[curFlag] ? RULE_SWITCH_FLAGS : RULE_SWITCH_FLAGS.concat([[curFlag, curFlag + ' (Custom Switch)']]);
          return G(2, F('Effect Kind', modeSel) + F('Rule Switch Flag', sel(p + '.flag', curFlag, switchOpts, { narrow: true })));
        }
        if (ek === 'castSpell') {
          const cm = b.castMode || 'linkedSpell';
          const spellLbl = cm === 'ownSlotUpTo' ? 'Max Spell Level' : 'Spell / Buff Options';
          const spellInput = cm === 'linkedSpell'
            ? inp(p + '.spellName', b.spellName || '', { list: 'fs-spell-names', ph: 'Command / Haste' })
            : cm === 'ownSlotUpTo'
              ? sel(p + '.maxSpellLvl', b.maxSpellLvl || 2, range(1, 9), { narrow: true, num: true })
              : inp(p + '.spellOptions', b.spellOptions || '', { ph: 'Blur, Resist Energy, Haste…' });
          return G(2,
            F('Effect Kind', modeSel) +
            F('Cast Mode', sel(p + '.castMode', cm, [['linkedSpell', 'Specific Spell / SLA'], ['ownSlotUpTo', 'Self Spell (Own Slot ≤ Lvl N)'], ['freeBuffList', 'Pick 1 Free Buff from List']], { narrow: true })) +
            F(spellLbl, spellInput) +
            F('Duration Link', chk(p + '.tiedDuration', !!b.tiedDuration, 'Tied Duration'))
          );
        }
        if (ek === 'recoverSlot') {
          return G(3, F('Effect Kind', modeSel) + F('Max Level', sel(p + '.maxSpellLvl', b.maxSpellLvl || 6, range(1, 9), { narrow: true, num: true })) + F('Class / Pool', inp(p + '.targetPoolOrClass', b.targetPoolOrClass || 'Magus', { list: 'fs-spellcls-list' })));
        }
        if (ek === 'stealStore') {
          return G(3, F('Effect Kind', modeSel) + F('Max Level Formula', inp(p + '.maxLvlFormula', b.maxLvlFormula || '≤ ⅓ Class Lvl', { ph: '≤ ⅓ Class Lvl' })) + F('Store into @Buffer', inp(p + '.bufferVar', b.bufferVar || 'stolen_lvl', { ph: 'stolen_lvl' })));
        }
        if (ek === 'grantFeat') {
          return G(3, F('Effect Kind', modeSel) + F('Feat or #Tag Pool', inp(p + '.featOrPool', b.featOrPool || '#FighterBonus', { ph: '#FighterBonus or Feat Name' })) + F('Reassignment', chk(p + '.floatingDaily', !!b.floatingDaily, 'Floating (Reassign Daily)')));
        }
        if (ek === 'proficiency') {
          return G(2, F('Effect Kind', modeSel) + F('Proficiency Token', inp(p + '.targetId', b.targetId || 'weapon:simple', { ph: 'weapon:simple / weapon:wpn-longbow / armor:light / shield:shield' })));
        }
        if (ek === 'feat') {
          return G(2, F('Effect Kind', modeSel) + F('Feat Id (granted as a bonus feat)', inp(p + '.targetId', b.targetId || '', { ph: 'feat-dodge' })));
        }
        if (ek === 'familiarity') {
          return G(2, F('Effect Kind', modeSel) + F('Weapon Id (treated as Martial)', inp(p + '.targetId', b.targetId || '', { ph: 'wpn-dwarven-waraxe' })));
        }
        if (ek === 'castEvolution') {
          return G(2, F('Effect Kind', modeSel) + F('Upgraded Nature', sel(p + '.castNature', b.castNature || 'Arcane Spell', ['Arcane Spell', 'Spell-Like (Sp)', 'Supernatural (Su, No SR/AoO)'], { narrow: true })));
        }
        return G(2,
          F('Effect Kind', modeSel) +
          F('Rule Text (Unstructured Note)', inp(p + '.text', b.text || '', { ph: 'Narrative / table rule note…' }) + '<div class="fs-hint" style="width:100%;margin-top:3px">📜 Shown as text on the character sheet; not auto-calculated into numeric stats.</div>')
        );
      }
      default: return '';
    }
  }

  // "!" help next to a formula field. kind picks the ready-made examples (RuleEngine.FORMULA_RECIPES: dc, dice, value, cl);
  // path lets an example fill this exact field without clicking into it first.
  const fxRefBtn = (kind, path) => '<button type="button" class="fs-btn fs-xs fs-ghost" data-fx-keep="1" data-action="toggle-fxref" data-kind="' + esc(kind || 'value') + '"' +
    (path ? ' data-fxpath="' + esc(path) + '"' : '') + ' title="Formula help: examples and terms you can use" aria-label="Formula help" style="margin-top:4px">' +
    '<b style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;border:1px solid currentColor;font-size:10px;margin-right:4px">!</b>Formula help</button>';
  const GUIDE_RECIPES = [
    {
      title: '1. Flat & CL-Scaling Bonus (Shield of Faith)',
      sub: 'Use Stat Modifier with plural targets and RAW bonus types (Deflection, Sacred, Enhancement). For base + caster-level caps, use Formula mode.',
      code: 'mode: "formula" • 2 + min(3, floor(@cl / 6))',
      entry: {
        schemaVersion: 3, id: 'spl-guide-shield-of-faith', blueprint: 'spell', name: 'Shield of Faith', type: 'Spell', source: 'Player\'s Handbook p.278',
        text: '+2 deflection bonus to AC, with an additional +1 to the bonus for every six caster levels you have (maximum +5 deflection bonus at 18th level).',
        effects: [{ type: 'stat', targets: ['ac.deflection'], mode: 'formula', formula: '2 + min(3, floor(@cl / 6))', btype: 'Deflection' }]
      }
    },
    {
      title: '2. Player @Choice Binding (Weapon Focus)',
      sub: 'Attach a Choice (Weapon, Skill, Spell School, or Energy) and pair it with a closed when branch (wieldingChosenWeapon / castingChosenSchool).',
      code: 'choices[] + when: wieldingChosenWeapon -> atk.weapon +1',
      entry: {
        schemaVersion: 3, id: 'feat-guide-weapon-focus', blueprint: 'feat', name: 'Weapon Focus', type: 'Feat', source: 'Player\'s Handbook p.102',
        text: 'Choose one type of weapon. You gain a +1 bonus on all attack rolls you make using the selected weapon.',
        choices: [{ id: 'ch-weapon', key: 'weapon', label: 'Chosen Weapon', count: 1 }],
        effects: [{ type: 'when', flow: 'while', branches: [{ condKind: 'wieldingChosenWeapon', condText: '', effects: [{ type: 'stat', targets: ['atk.weapon'], mode: 'flat', value: 1, btype: 'Untyped' }] }] }]
      }
    },
    {
      title: '3. A -> B Ability Substitution (Zen Archery)',
      sub: 'Swap or add ability modifiers cleanly via Stat / Formula Swap (mode: "replaceStat") with a deterministic swapScope.',
      code: 'atk.ranged.abilityMod: max(DEX, WIS) • swapScope: "all"',
      entry: {
        schemaVersion: 3, id: 'feat-guide-zen-archery', blueprint: 'feat', name: 'Zen Archery', type: 'Feat', source: 'Complete Warrior p.106',
        text: 'You can use your Wisdom modifier instead of your Dexterity modifier on ranged attack rolls.',
        effects: [{ type: 'stat', mode: 'replaceStat', swapTarget: 'atk.ranged.abilityMod', targets: ['atk.ranged.abilityMod'], subOp: 'max', fromStat: 'dex', toStat: 'wis', swapScope: 'all', btype: 'Untyped' }]
      }
    },
    {
      title: '4. Closed when & Combat modes[] (Battle Fury)',
      sub: 'Use modes[] for mutually exclusive Combat toggle chips on the sheet, and when ("state" for charging/flanking, "situational" for target notes).',
      code: 'modes[] chip + when(state: "charging" | situational)',
      entry: {
        schemaVersion: 3, id: 'feat-guide-battle-fury', blueprint: 'feat', name: 'Battle Fury', type: 'Feat', source: 'Homebrew Guide',
        text: 'Toggleable combat stance granting +2 morale to melee damage, plus +2 melee attack while charging.',
        effects: [{ type: 'when', flow: 'while', branches: [{ condKind: 'state', condText: 'charging', effects: [{ type: 'stat', targets: ['atk.melee'], mode: 'flat', value: 2, btype: 'Morale' }] }] }],
        modes: [
          { id: 'mode-fury-off', name: 'Inactive', label: 'Inactive', effects: [] },
          { id: 'mode-fury-on', name: 'Battle Fury', label: 'Battle Fury (+2 melee dmg, -2 AC)', combatScope: 'melee', effects: [{ type: 'stat', targets: ['dmg.melee'], mode: 'flat', value: 2, btype: 'Morale' }, { type: 'stat', targets: ['ac.total'], mode: 'flat', value: -2, btype: 'Penalty' }] }
        ]
      }
    },
    {
      title: '5. Activated powers[] & Daily Pool (Dragon Breath)',
      sub: 'Pair a Resource Pool (perDay or cooldown) with a Sub-Power carrying action economy, scaling dcFormula, save, and Damage roll.',
      code: 'resource(perDay) + powers[]: 6d8 Fire, DC 10 + 1/2 HD + Con',
      entry: {
        schemaVersion: 3, id: 'race-guide-half-dragon', blueprint: 'race', name: 'Half-Dragon (Red)', type: 'Template', source: 'Monster Manual p.146',
        text: '+8 Str, +2 Con, +4 natural armor, fire immunity, darkvision 60 ft., and 1/day 30-ft. cone of fire (6d8, Reflex DC 10 + 1/2 HD + Con half).',
        race: { kind: 'template', size: 'Medium', speed: 30, favoredClass: 'Any', levelAdjustment: 3 },
        effects: [
          { type: 'stat', targets: ['str'], mode: 'flat', value: 8, btype: 'Racial' },
          { type: 'stat', targets: ['ac.natural'], mode: 'flat', value: 4, btype: 'Natural Armor' },
          { type: 'defense', mode: 'Immunity', what: 'Fire' },
          { type: 'resource', name: 'Breath Weapon', varKey: 'breath_weapon', resMode: 'spend', scaling: 'flat', max: 1, reset: 'perDay' }
        ],
        powers: [{
          id: 'pw-guide-breath', kind: 'inline', name: 'Breath Weapon (Su)', action: 'Standard',
          usage: { mode: 'resourcePool', pool: 'Breath Weapon', cost: 1 }, area: '30-ft. Cone', dcFormula: '10 + 1/2 HD + Con',
          save: { type: 'Reflex', effect: 'Half' },
          effects: [{ type: 'roll', kind: 'Damage', count: 6, die: 'd8', flat: 0, dmgType: 'Fire', scaling: 'flat', save: 'Reflex half' }]
        }]
      }
    },
    {
      title: '6. Cleric Domain & Spell Ladder (Sun Domain)',
      sub: 'Craft Cleric Domains with a 1st–9th Spell Ladder and granted power resource blocks so Cleric sheets auto-populate domain slots.',
      code: 'blueprint: "domain" • grants.spellLadder (1st–9th)',
      entry: {
        schemaVersion: 3, id: 'dom-guide-sun', blueprint: 'domain', name: 'Sun', type: 'Domain', category: 'Cleric Domain', source: 'Player\'s Handbook p.188',
        text: 'Once per day, perform a greater turning against undead in place of a regular turning.',
        grants: {
          grantedPower: { name: 'Sun Domain Power', text: 'Once per day, perform a greater turning against undead.', usage: { mode: 'passive' } },
          spellLadder: [
            { level: 1, spell: 'Endure Elements', refId: 'spl-endure-elements' }, { level: 2, spell: 'Heat Metal', refId: 'spl-heat-metal' },
            { level: 3, spell: 'Searing Light', refId: 'spl-searing-light' }, { level: 4, spell: 'Fire Shield', refId: 'spl-fire-shield' },
            { level: 5, spell: 'Flame Strike', refId: 'spl-flame-strike' }, { level: 6, spell: 'Fire Seeds', refId: 'spl-fire-seeds' },
            { level: 7, spell: 'Sunbeam', refId: 'spl-sunbeam' }, { level: 8, spell: 'Sunburst', refId: 'spl-sunburst' },
            { level: 9, spell: 'Prismatic Sphere', refId: 'spl-prismatic-sphere' }
          ]
        },
        effects: [{ type: 'resource', name: 'Greater Turning', varKey: 'greater_turning', resMode: 'spend', scaling: 'flat', max: 1, reset: 'perDay' }]
      }
    }
  ];

  function renderFxRef() {
    const el = document.getElementById('fs-fxref');
    if (!el) return;
    if (S.ui.guideOpen) {
      el.style.display = 'flex';
      el.setAttribute('aria-label', 'Rule Crafter Quick Guide');
      const cards = GUIDE_RECIPES.map((g, i) =>
        '<div class="fs-fxrow" style="gap:4px;margin-bottom:6px">' +
        '<b>' + esc(g.title) + '</b>' +
        '<span>' + esc(g.sub) + '</span>' +
        '<code>' + esc(g.code) + '</code>' +
        '<div class="fs-row" style="margin-top:3px">' + btn('load-guide-example', '⚡ Load Example onto Canvas', 'fs-xs fs-emerald', { idx: i }) + '</div>' +
        '</div>'
      ).join('');
      el.innerHTML = '<div class="fs-fxhead"><span>❓ Rule Crafter Quick Guide</span><button type="button" class="fs-btn fs-xs fs-ghost" data-action="toggle-guide">Close</button></div>' +
        '<div class="fs-hint" style="padding:0 10px 6px">Rule Crafter builds Pure Canonical V3 entries from modular blocks. Use <b>✨ Craft with Rule Master</b> in the top bar to scribe RAW text instantly, or load any archetype below to explore:</div>' +
        '<div class="fs-fxbody">' + cards + '</div>';
      return;
    }
    if (!S.ui.fxRefOpen) { el.style.display = 'none'; el.innerHTML = ''; return; }
    el.setAttribute('aria-label', 'Formula Reference');
    const vars = fxVars(), funcs = fxFuncs(), groups = {};
    vars.forEach((v) => { (groups[v.group || 'Variables'] = groups[v.group || 'Variables'] || []).push(v); });
    const item = (ins, title, sub, ex) => '<button type="button" class="fs-fxitem" data-fx-keep="1" data-action="fx-insert" data-ins="' + esc(ins) + '"><b>' + esc(title) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + (ex ? '<code>' + esc(ex) + '</code>' : '') + '</button>';
    const RE = window.RuleEngine || {};
    const recipes = ((RE.FORMULA_RECIPES || {})[S.ui.fxKind || 'value']) || (RE.FORMULA_RECIPES || {}).value || [];
    const recipe = (r) => '<button type="button" class="fs-fxitem" data-fx-keep="1" data-action="fx-apply" data-ins="' + esc(r.formula) + '"><b>' + esc(r.label) + '</b>' +
      (r.desc ? '<span>' + esc(r.desc) + '</span>' : '') + '<code>' + esc(r.formula) + '</code></button>';
    // One card per plain word: what you type, what it means, the term it becomes.
    const shorthand = (RE.FORMULA_SHORTHAND || []).map((s) => '<div class="fs-fxrow"><b>' + esc(s.words) + '</b><span>' + esc(s.desc) + '</span>' +
      (s.means ? '<code>= ' + esc(s.means) + '</code>' : '') + '</div>').join('');
    const ops = [
      ['+  -  *  /', 'Add, subtract, multiply, divide'],
      ['( )', 'Group terms: 10 + (2 * @bab)'],
      ['NdX', 'Dice, e.g. 2d6 or (1 + floor(@hd / 4))d8'],
      ['floor(x)', 'Round down, as D&D 3.5e does. Division alone can leave a fraction.']
    ].map((o) => '<div class="fs-fxrow fs-fxrow-inline"><code>' + esc(o[0]) + '</code><span>' + esc(o[1]) + '</span></div>').join('');
    el.style.display = 'flex';
    el.innerHTML = '<div class="fs-fxhead"><span>! Formula help</span><button type="button" class="fs-btn fs-xs fs-ghost" data-action="toggle-fxref">Close</button></div>' +
      '<div class="fs-hint" style="padding:0 10px 6px">Pick an example to fill the field, then adjust the numbers. The line under the field shows how it is read and its value at levels 1, 5, 10 and 20.</div>' +
      '<div class="fs-fxbody">' +
        (recipes.length ? '<div class="fs-section-label">Examples for this field</div>' + recipes.map(recipe).join('') : '') +
        (shorthand ? '<div class="fs-section-label">Plain words you can type</div>' + shorthand : '') +
        '<div class="fs-section-label">Operators</div>' + ops +
        '<details style="margin-top:6px"><summary class="fs-section-label" style="cursor:pointer">All terms &amp; functions (click to insert at the cursor)</summary>' +
        (vars.length || funcs.length ? Object.keys(groups).map((g) => '<div class="fs-section-label">' + esc(g) + '</div>' + groups[g].map((v) => item(v.token, v.token + (v.label ? ' — ' + v.label : ''), v.desc, v.example)).join('')).join('') +
          (funcs.length ? '<div class="fs-section-label">Functions</div>' + funcs.map((f) => item(f.name + '()', f.signature || f.name, f.desc, '')).join('') : '') : '<div class="fs-hint">Rule Engine formula catalog is not loaded.</div>') +
        '</details></div>';
  }
  function fxTarget() {
    const a = document.activeElement;
    if (a && a.dataset && a.dataset.fx) return a;
    return S.fxPath ? document.querySelector('[data-fx][data-bind="' + S.fxPath + '"]') : null;
  }
  function blockPalette(listPath, allowContainers, compact, extraHtml) {
    const types = allowContainers
      ? ['stat', 'roll', 'attack', 'defense', 'effect', 'resource', 'when', 'table', 'carrier']
      : ['stat', 'roll', 'attack', 'defense', 'effect', 'carrier'];
    const intentSpot = spotHtml('intent', listPath + '|' + (allowContainers ? '1' : '0'), {
      cls: 'fs-spot-add',
      style: compact ? 'flex:1 1 210px;max-width:340px' : 'flex:0 1 440px;width:440px;max-width:100%',
      ph: compact ? '+ Add Mechanic / Effect… (darkvision, +2 save…)' : '+ Add Mechanic / Effect… (darkvision, immune fear, +2 save, weapon finesse…)'
    });
    const btns = types.map((t) =>
      '<button type="button" class="lego-add ' + BLOCK_TYPES[t].color + '" data-action="add-block" data-p="' + esc(listPath) + '" data-t="' + t + '">+ ' + BLOCK_TYPES[t].icon + ' ' + esc(BLOCK_TYPES[t].shortLabel) + '</button>'
    ).join('');
    if (compact) {
      return '<div class="lego-palette compact">' + intentSpot + btns + (extraHtml || '') + '</div>';
    }
    return '<div class="lego-palette">' +
      '<div class="lego-pal-row"><span class="lego-pal-tag">SEARCH</span><div class="lego-pal-items">' + intentSpot + '</div></div>' +
      '<div class="lego-pal-row"><span class="lego-pal-tag">BLOCKS</span><div class="lego-pal-items">' + btns + '</div></div>' +
      (extraHtml ? '<div class="lego-pal-row"><span class="lego-pal-tag">EXTRAS</span><div class="lego-pal-items">' + extraHtml + '</div></div>' : '') +
      '</div>';
  }

  // Race / template entries grow with character level: their sub-powers and top-level blocks carry "Gained at Level / HD".
  function isLevelGainEntry() { return S.entry && S.entry.blueprint === 'race'; }
  const levelOf = (x) => Math.max(1, Math.floor(num(x && x.gainedAt, 1)) || 1);
  // With the Level / HD Table attached, every gain (level 1 included) renders inside its row, up to the table's Max Level.
  function inLevelRow(x) {
    if (!isLevelGainEntry() || !hasFacet(S.entry, 'progression') || !S.entry.progression) return false;
    const lv = levelOf(x);
    return lv <= Math.max(1, Math.min(20, num(S.entry.progression.maxLevel, 20)));
  }
  // The Level / HD Table is the only place a level is set: an item's level is the row it sits in.
  const levelTableOn = () => isLevelGainEntry() && hasFacet(S.entry, 'progression') && !!S.entry.progression;
  // Row control that moves a block / sub-power to another row of the table (shown only inside a row).
  function levelMoveSel(path, x) {
    if (!inLevelRow(x)) return '';
    const p = S.entry.progression;
    const maxLv = Math.max(1, Math.min(20, num(p.maxLevel, 20)));
    const unit = p.mode === 'hd' ? 'HD ' : 'Lvl ';
    return '<span title="Move to another level of the table" style="display:inline-flex;margin-left:8px">' +
      sel(path + '.gainedAt', levelOf(x), range(1, maxLv).map((n) => [n, unit + n]), { narrow: true, num: true }) + '</span>';
  }
  function levelGainChip(b, p, listPath) {
    return listPath === 'effects' ? levelMoveSel(p, b) : '';
  }
  // { level: [{ kind: 'power' | 'effect', html }] } from the gainedAt fields of the sub-powers and top-level blocks.
  function levelGainItems() {
    const en = S.entry, rows = {};
    const at = (x) => Math.max(1, Math.floor(num(x && x.gainedAt, 1)) || 1);
    const add = (lv, kind, html) => { (rows[lv] = rows[lv] || []).push({ kind: kind, html: html }); };
    (en.powers || []).forEach((pw) => add(at(pw), 'power', '⚡ ' + esc(pw.kind === 'attached' && pw.ref ? pw.ref.name : (pw.name || 'Power'))));
    (en.effects || []).forEach((b) => add(at(b), 'effect', (BLOCK_TYPES[b.type] || BLOCK_TYPES.effect).icon + ' ' + esc(blockText(b) || (BLOCK_TYPES[b.type] || BLOCK_TYPES.effect).label)));
    return rows;
  }
  // "+ Rule Block" menu in a Level / HD Table row: the new block is gained at that level.
  function levelBlockMenu(lv) {
    const types = ['stat', 'roll', 'attack', 'defense', 'effect', 'resource'];
    return '<details class="lego-qp" style="position:relative;display:inline-block"><summary class="fs-btn fs-xs fs-dashed" style="cursor:pointer;list-style:none">+ Rule Block</summary>' +
      '<div class="fs-glass" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;display:flex;flex-direction:column;gap:3px;padding:6px;min-width:200px;border-radius:10px">' +
      types.map((t) => '<button type="button" class="fs-btn fs-xs fs-ghost" style="justify-content:flex-start" data-action="add-block-at-level" data-t="' + t + '" data-lv="' + lv + '">' + BLOCK_TYPES[t].icon + ' ' + esc(BLOCK_TYPES[t].shortLabel) + '</button>').join('') +
      '</div></details>';
  }

  function blockActionBar(b, listPath, i, totalLen) {
    const isChild = /\.(branches|rows)\.\d+\.kids$/.test(listPath);
    const branchMatch = listPath.match(/^(.*)\.branches\.(\d+)\.kids$/);
    let siblingBtn = '';
    if (branchMatch) {
      const whenBlk = getPath(S.entry, branchMatch[1]);
      const bi = num(branchMatch[2]);
      if (whenBlk && Array.isArray(whenBlk.branches) && whenBlk.branches.length > 1) {
        const nextBi = (bi + 1) % whenBlk.branches.length;
        siblingBtn = '<button type="button" class="lego-act-btn" data-action="move-kid-branch" data-wp="' + esc(branchMatch[1]) + '" data-bi="' + bi + '" data-to="' + nextBi + '" data-i="' + i + '" title="Move to Branch ' + (nextBi + 1) + '">⇄B' + (nextBi + 1) + '</button>';
      }
    }
    const wrapOrLift = isChild
      ? '<button type="button" class="lego-act-btn" data-action="lift-block-out" data-p="' + esc(listPath) + '" data-i="' + i + '" title="Lift block out of container">⤴</button>'
      : (b.type === 'when'
        ? '<button type="button" class="lego-act-btn" data-action="unwrap-when" data-p="' + esc(listPath) + '" data-i="' + i + '" title="Unwrap When (keep inner blocks)">⤴</button>'
        : '<button type="button" class="lego-act-btn" data-action="wrap-block-when" data-p="' + esc(listPath) + '" data-i="' + i + '" title="Wrap block inside a When / While condition">🔶</button>');
    return '<span class="lego-act-bar">' +
      '<button type="button" class="lego-act-btn" data-action="move-block" data-p="' + esc(listPath) + '" data-i="' + i + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + ' title="Move Up">↑</button>' +
      '<button type="button" class="lego-act-btn" data-action="move-block" data-p="' + esc(listPath) + '" data-i="' + i + '" data-d="1"' + (i >= totalLen - 1 ? ' disabled' : '') + ' title="Move Down">↓</button>' +
      '<button type="button" class="lego-act-btn" data-action="dup-block" data-p="' + esc(listPath) + '" data-i="' + i + '" title="Duplicate Block">⧉</button>' +
      siblingBtn +
      wrapOrLift +
      '<button type="button" class="lego-act-btn danger" data-action="remove-block" data-p="' + esc(listPath) + '" data-i="' + i + '" title="Remove Block">✕</button>' +
      '</span>';
  }
  function blockStatusPills(b, p, open) {
    let pills = '';
    if (isIncompleteBlock(b)) pills += '<span class="fs-pill amber" title="Complete the missing field(s) so this block takes effect">⚠ Incomplete</span>';
    if (isUnstructuredBlock(b)) pills += '<span class="fs-pill dim" title="Narrative text — not auto-calculated">📜 Unstructured</span>';
    else if (isPreservedEffectBlock(b)) pills += '<span class="fs-pill sky" title="Preserved corpus mechanic">🔒 ' + esc(b.effectKind) + '</span>';
    if (b.type === 'stat' && b.condition && !open) pills += condBadgeHtml(b.condition, 'stat', '', '');
    if (b.type === 'roll' && open) pills += '<span class="fs-pill amber">' + live('roll-preview', p) + '</span>';
    if (b.type === 'when') {
      const bCnt = (b.branches || []).length;
      const kCnt = (b.branches || []).reduce((s, br) => s + ((br.kids || []).length), 0);
      pills += '<span class="fs-pill dim">' + bCnt + ' branch' + (bCnt === 1 ? '' : 'es') + ' • ' + kCnt + ' block' + (kCnt === 1 ? '' : 's') + '</span>';
    } else if (b.type === 'table') {
      const rCnt = (b.rows || []).length;
      pills += '<span class="fs-pill dim">' + rCnt + ' row' + (rCnt === 1 ? '' : 's') + '</span>';
    }
    return pills;
  }
  function scratchBlocks(list, listPath, keep) {
    const arr = list || [];
    const visibleCount = keep ? arr.filter((b, i) => keep(b, i)).length : arr.length;
    const bulkBar = (listPath === 'effects' && visibleCount >= 2)
      ? '<div class="fs-row" style="justify-content:flex-end;gap:4px;margin-top:6px">' +
          '<button type="button" class="fs-btn fs-xs fs-ghost" data-action="expand-all-blocks">▾ Expand All (' + visibleCount + ')</button>' +
          '<button type="button" class="fs-btn fs-xs fs-ghost" data-action="collapse-all-blocks">▸ Collapse All</button>' +
        '</div>'
      : '';
    return bulkBar + arr.map((b, i) => {
      if (keep && !keep(b, i)) return '';
      const p = listPath + '.' + i, T = BLOCK_TYPES[b.type] || BLOCK_TYPES.effect;
      const key = 'blk:' + b.id;
      const open = !!S.ui.cardOpen[key];
      const sumTxt = blockText(b) || T.label;
      const toggleBtn = '<button type="button" class="lego-head-toggle" data-action="toggle-card" data-key="' + esc(key) + '" aria-expanded="' + (open ? 'true' : 'false') + '">' +
        '<span class="lego-chev">' + (open ? '▾' : '▸') + '</span>' +
        '<span>' + T.icon + '</span>' +
        (open
          ? '<span class="lego-lbl" style="color:#e2e8f0;font-weight:700">' + esc(T.label) + '</span><span class="lego-sum" style="color:#94a3b8;font-weight:500">— ' + esc(sumTxt) + '</span>'
          : '<span class="lego-sum">' + esc(sumTxt) + '</span>') +
        '</button>';
      const headHtml = H(toggleBtn + blockStatusPills(b, p, open) + levelGainChip(b, p, listPath), blockActionBar(b, listPath, i, arr.length));
      const recipHtml = (open && ['stat', 'roll', 'defense', 'effect', 'carrier'].indexOf(b.type) >= 0)
        ? '<div class="fs-row" style="margin-top:6px;gap:8px;align-items:center">' +
            '<span class="fs-muted" style="font-size:11px;font-weight:600">Recipient</span>' +
            sel(p + '.recipient', b.recipient || 'self', [
              ['self', 'Self (default)'],
              ['allies', 'Allies'],
              ['target', 'Target'],
              ['area', 'Area']
            ], { narrow: true }) +
          '</div>'
        : '';
      if (!T.container) {
        const cls = 'lego-block lego-tab ' + T.color + (open ? '' : ' is-collapsed') + (isUnstructuredBlock(b) ? ' is-unstructured' : '');
        return '<div class="' + cls + '">' + headHtml + (open ? blockControls(b, p) + recipHtml : '') + '</div>';
      }
      if (!open) {
        return '<div class="lego-c ' + T.color + ' is-collapsed"><div class="c-top">' + headHtml + '</div></div>';
      }
      const head = headHtml + blockControls(b, p) + recipHtml;
      let inner = '';
      if (T.container === 'branches') {
        const flow = b.flow || 'while';
        const brLen = (b.branches || []).length;
        inner = (b.branches || []).map((br, bi) => {
          const bp = p + '.branches.' + bi;
          const brActs = brLen > 1
            ? '<span class="lego-act-bar">' +
                '<button type="button" class="lego-act-btn" data-action="move-branch" data-p="' + esc(p + '.branches') + '" data-i="' + bi + '" data-d="-1"' + (bi === 0 ? ' disabled' : '') + ' title="Move Branch Up">↑</button>' +
                '<button type="button" class="lego-act-btn" data-action="move-branch" data-p="' + esc(p + '.branches') + '" data-i="' + bi + '" data-d="1"' + (bi >= brLen - 1 ? ' disabled' : '') + ' title="Move Branch Down">↓</button>' +
                '<button type="button" class="lego-act-btn danger" data-action="remove-branch" data-p="' + esc(p + '.branches') + '" data-i="' + bi + '" title="Remove Branch">✕</button>' +
              '</span>'
            : '';
          const bHead = H('<span class="lego-lbl">' + (bi > 0 ? 'Else-If (Branch ' + (bi + 1) + ')' : (flow === 'while' ? 'While (Branch 1)' : 'When (Branch 1)')) + '</span>', brActs) +
            whenBranchControls(flow, br, bp);
          return cBlock('c-sub', bHead, scratchBlocks(br.kids, bp + '.kids') + blockPalette(bp + '.kids', false, true));
        }).join('') + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-branch" data-p="' + p + '.branches">+ Else-If / Tier Branch</button>';
      }
      if (T.container === 'rows') {
        inner = (b.rows || []).map((r, ri) => cBlock('c-sub', H('<span class="lego-lbl">Table Row</span>', delBtn('remove-row', { p: p + '.rows', i: ri })) + G(1, F('Roll Result / Range', inp(p + '.rows.' + ri + '.roll', r.roll, { style: 'width:88px' }))),
          scratchBlocks(r.kids, p + '.rows.' + ri + '.kids') + blockPalette(p + '.rows.' + ri + '.kids', false, true))).join('') + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-row" data-p="' + p + '.rows">+ Table Row</button>';
      }
      return cBlock(T.color, head, inner);
    }).join('');
  }

  function srcField(en, span) { return F('Source', inp('source', normSource(en.source), { ph: 'Source (PHB, MIC, Homebrew)' }), span); }
  function tagSockets(en) {
    return G(1, F('Tags', en.tags.map((t, i) => '<span class="fs-pill purple">' + esc(t) + '<span class="fs-x" data-action="remove-tag" data-i="' + i + '">×</span></span>').join('') + spotHtml('tag', 'identity', { ph: '🔍 + #Tag' })));
  }
  const hasFacet = (en, k) => en.facets.indexOf(k) >= 0;
  function ensureFacet(k) { if (S.entry.facets.indexOf(k) < 0) S.entry.facets.push(k); }

  function prereqCBlock(en, title) {
    const canDetach = en.blueprint !== 'feat' && en.blueprint !== 'class';
    const rows = en.prereqs.map((r, ri) => cBlock('c-sub', H('<span class="lego-lbl">' + (ri ? 'AND' : 'Require') + '</span>', delBtn('remove-prereq', { ri: ri })),
      r.alts.map((a, ai) => stack('b-slate', altEditor(ri, ai, a))).join('') + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-or" data-ri="' + ri + '">+Or</button>')).join('');
    const pTxt = prereqText(en.prereqs) || 'none — open to all';
    return cBlock('c-amber', H(L('🏛️ ' + title) + '<span class="fs-hint" title="' + esc(pTxt) + '" style="color:#fde68a;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(pTxt) + '</span>', canDetach ? delBtn('detach-prereqs', {}) : ''), rows + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-prereq">+ Add Prerequisite (AND)</button>');
  }

  function patternGeneratorStack(p, maxLv, unitLbl) {
    return stack('b-blue',
      H(L('🔁 Repeating Feature Generator'), '<span class="fs-row" style="margin-left:auto;gap:6px">' + btn('gen-pattern', '⚡ Apply to Levels', 'fs-xs fs-primary') + delBtn('toggle-prog-pattern', {}) + '</span>') +
      G(3,
        F('Every N ' + unitLbl + 's', sel('progression.pattern.every', p.pattern.every, range(1, 10), { narrow: true, num: true })) +
        F('Start ' + unitLbl, sel('progression.pattern.start', Math.min(p.pattern.start, maxLv), range(1, maxLv), { narrow: true, num: true })) +
        F('Scaling Token', inp('progression.pattern.scale', p.pattern.scale, { ph: '+1d6 / +1' })) +
        F('Feature Name', inp('progression.pattern.name', p.pattern.name, { ph: 'Sneak Attack / Bonus Feat' }), 'lego-span-full')
      ));
  }

  function progressionCBlock(en) {
    const p = en.progression;
    const isCls = en.blueprint === 'class';
    const showClassCols = isCls || p.mode === 'base' || p.mode === 'prestige';
    const maxLv = Math.max(1, Math.min(20, num(p.maxLevel, 20)));
    const hideEmpty = !isCls && S.ui.progHideEmpty;
    let levelIndices = range(0, maxLv - 1);
    // Race / template: the rule blocks and sub-powers gained at each level ("Gained at Level / HD") show in their row.
    const gainRows = isLevelGainEntry() ? levelGainItems() : {};
    if (hideEmpty) {
      const nonEmpty = levelIndices.filter((i) => p.levels[i].features.length > 0 || (showClassCols && p.levels[i].spell) || (gainRows[i + 1] || []).length > 0);
      levelIndices = nonEmpty.length ? nonEmpty : [0];
    }
    const rows = levelIndices.map((i) => {
      const l = p.levels[i], Lv = i + 1;
      const chips = l.features.map((f, fi) => '<span class="fs-pill ' + (f.branchPath ? 'purple' : f.kind === 'inline' ? 'amber' : f.kind === 'pattern' ? 'sky' : 'indigo') + '" data-action="toggle-card" data-key="ft:' + f.id + '" style="cursor:pointer">' + (f.kind === 'inline' ? '✨ ' : '') + live('feat-sum', i + ':' + fi) + '<span class="fs-x" data-action="remove-feature" data-l="' + i + '" data-f="' + fi + '">×</span></span>').join('');
      const editors = l.features.map((f, fi) => (S.ui.cardOpen['ft:' + f.id] ? '<div class="lego-sub">' + G(3,
        F('Feature Name', inp('progression.levels.' + i + '.features.' + fi + '.name', f.name, { ph: 'Feature name' })) +
        F('Ability Type', sel('progression.levels.' + i + '.features.' + fi + '.abilityType', f.abilityType || 'Ex', ['Ex', 'Su', 'Sp', '—'], { narrow: true })) +
        F('Branch Path (Optional)', inp('progression.levels.' + i + '.features.' + fi + '.branchPath', f.branchPath || '', { list: 'fs-branch-opts', ph: 'Offense / Defense' })) +
        F('Rule Text', inp('progression.levels.' + i + '.features.' + fi + '.text', f.text || '', { ph: 'Feature rules text…' }), 'lego-span-full')
      ) + '</div>' : '')).join('');
      const prefix = showClassCols
        ? '<b class="lego-lvl">Lvl ' + Lv + '</b><span class="lego-desc">BAB ' + sgn(classBAB(p.bab, Lv)) + ' • F ' + sgn(p.good.fort ? goodSave(Lv) : poorSave(Lv)) + ' / R ' + sgn(p.good.ref ? goodSave(Lv) : poorSave(Lv)) + ' / W ' + sgn(p.good.will ? goodSave(Lv) : poorSave(Lv)) + '</span>'
        : '<b class="lego-lvl">' + (p.mode === 'hd' ? 'HD ' : 'Lvl ') + Lv + '</b>';
      const suffix = showClassCols ? chk('progression.levels.' + i + '.spell', l.spell, '✓ +1 Spellcasting') : '';
      const rowEditors = isLevelGainEntry()
        ? scratchBlocks(en.effects, 'effects', (b) => inLevelRow(b) && levelOf(b) === Lv) + (en.powers || []).map((pw, pi) => (inLevelRow(pw) && levelOf(pw) === Lv ? powerCBlock(pw, pi) : '')).join('')
        : '';
      const gainChips = (isLevelGainEntry() ? [] : (gainRows[Lv] || [])).map((g) => '<span class="fs-pill ' + (g.kind === 'power' ? 'amber' : 'sky') + '" title="Gained at ' + (p.mode === 'hd' ? 'HD ' : 'Level ') + Lv + '">' + g.html + '</span>').join('');
      const topRow = '<div class="lego-lvl-top">' + prefix + chips + gainChips + '</div>';
      const actRow = '<div class="lego-lvl-actions">' +
        spotHtml('feature', i, { style: 'width:210px', ph: '🔍 + Feature / SLA / Feat' }) +
        btn('add-feature-inline', '✨ + Inline', 'fs-xs fs-dashed', { l: i }) +
        (isLevelGainEntry() ? levelBlockMenu(Lv) + btn('add-power-at-level', '+ ⚡ Sub-Power', 'fs-xs fs-dashed', { lv: Lv }) : '') +
        suffix +
        '</div>';
      return stack('b-slate', '<div class="lego-lvl-stack">' + topRow + actRow + editors + (rowEditors ? '<div class="lego-lvl-gains" style="margin-top:6px">' + rowEditors + '</div>' : '') + '</div>');
    }).join('');
    // Optional tool, closed by default: opened from the table header, closed with its own ✕.
    const patBar = !isCls && S.ui.progPatternOpen ? patternGeneratorStack(p, maxLv, p.mode === 'hd' ? 'HD' : 'Lvl') : '';
    const head = isCls
      ? H(L('📊 Level Progression (1–' + maxLv + ')'))
      : H(L('📊 Level / HD Table (1–' + maxLv + ')'), '<span class="fs-row" style="margin-left:auto;gap:6px">' + (S.ui.progPatternOpen ? '' : btn('toggle-prog-pattern', '+ 🔁 Repeating Feature', 'fs-xs fs-dashed')) + btn('toggle-prog-empty', S.ui.progHideEmpty ? '👁️ Show All Rows' : '🗜️ Hide Empty Rows', 'fs-xs') + delBtn('detach-progression', {}) + '</span>') +
        G(2,
          F('Progression Mode', sel('progression.mode', p.mode, PROGRESSION_MODES, { narrow: true })) +
          F('Max Level / HD', sel('progression.maxLevel', maxLv, [5, 10, 12, 15, 20].map((n) => [n, String(n)]), { narrow: true, num: true }))
        );
    return cBlock('c-teal', head, patBar + rows);
  }

  function powerCBlock(pw, i) {
    const p = 'powers.' + i;
    const head = H(
      L('⚡ Sub-Power') + levelMoveSel(p, pw),
      '<span class="fs-row" style="margin-left:auto;gap:4px">' + btn('move-power', '↑', 'fs-xs fs-ghost', { i: i, d: -1 }) + delBtn('remove-power', { i: i }) + '</span>'
    ) + G(3,
      F('Power Name', pw.kind === 'inline' ? inp(p + '.name', pw.name, { ph: 'Sub-power name' }) : '<span class="fs-pill purple">🔮 ' + esc(pw.ref ? pw.ref.name : pw.name) + '</span>') +
      F('Action', sel(p + '.action', pw.action, ACTIONS, { narrow: true })) +
      F('Caster Level', inp(p + '.cl', num(pw.cl) || '', { num: true, ph: 'Character CL' })) +
      usageFields(p + '.use', pw.use, 3)
    );
    let kids = '';
    if (pw.kind === 'attached') {
      kids += stack('b-purple',
        H(L('🔮 Cast Spell')) +
        G(2,
          F('Attached Spell', '<span class="fs-pill purple">' + esc(pw.ref ? pw.ref.name + ' (' + (pw.ref.levelText || 'Lvl ' + pw.ref.level) + ')' : pw.name) + '</span>') +
          F('Grant Mode', sel(p + '.grantMode', pw.grantMode, [['cast', 'Cast from Item / SLA'], ['known', 'Add to Spells Known'], ['slot', 'Expend Own Slot (Runestaff)']], { narrow: true }))
        ));
    }
    if (pw.attackOn) {
      const hasSave = pw.save.type !== 'None';
      kids += stack('b-red',
        H(L('🎯 Attack & Save'), delBtn('toggle-flag', { p: p + '.attackOn' })) +
        G(hasSave ? 3 : 3,
          F('Attack Type', sel(p + '.attack', pw.attack, Object.keys(ATTACK_LABEL).map((k) => [k, ATTACK_LABEL[k]]), { narrow: true })) +
          F('Range', inp(p + '.range', pw.range, { list: 'fs-range-list', ph: 'Range' })) +
          F('Area', inp(p + '.area', pw.area, { list: 'fs-area-list', ph: 'e.g. 30-ft. Cone' })) +
          F('Saving Throw', sel(p + '.save.type', pw.save.type, ['None', 'Fortitude', 'Reflex', 'Will'], { narrow: true })) +
          (hasSave
            ? F('Save Outcome', sel(p + '.save.effect', pw.save.effect, ['Negates', 'Half', 'Partial', 'Negates (harmless)'], { narrow: true })) +
              F('Save DC (number or formula)', inp(p + '.dcFormula', pw.dcFormula || (num(pw.dc) ? String(num(pw.dc)) : ''), { ph: '10 + 1/2 HD + Con', fx: true }) + fxRefBtn('dc', p + '.dcFormula'))
            : '') +
          F('Spell Level', inp(p + '.spellLevel', pw.spellLevel === undefined || pw.spellLevel === null ? '' : pw.spellLevel,
            { num: true, min: 0, max: 9, ph: pw.ref ? 'Spell: ' + num(pw.ref.level) : 'Spell-like ability' }))
        ));
    }
    kids += scratchBlocks(pw.effects || [], p + '.effects');
    if (pw.text) kids += stack('b-slate', H(L('📜 Sub-Power Note')) + G(1, F('Rule Text', inp(p + '.text', pw.text, { ph: 'What happens…' }))));
    const extraBtns = (pw.attackOn ? '' : '<button type="button" class="lego-add b-red" data-action="toggle-flag" data-p="' + p + '.attackOn">+ 🎯 Attack & Save</button>');
    kids += blockPalette(p + '.effects', false, true, extraBtns);
    return cBlock('c-amber', head, kids);
  }

  // Activation mode (Rage, Smite, Bardic ...): its blocks apply only while the mode chip is selected on the sheet.
  // The Off state and weapon-grip modes are not shown; they are kept and written back automatically.
  function modeCBlock(m, i) {
    const p = 'modes.' + i, act = m._extra && m._extra.activation;
    const actText = act ? [act.action, act.costKind && act.costKind !== 'none' ? act.costKind : ''].filter(Boolean).join(' · ') : '';
    const head = H(
      L('🎚️ Mode') + (actText ? '<span class="fs-pill dim">' + esc(actText) + '</span>' : ''),
      '<span class="fs-row" style="margin-left:auto;gap:4px">' + btn('move-mode', '↑', 'fs-xs fs-ghost', { i: i, d: -1 }) + delBtn('remove-mode', { i: i }) + '</span>'
    ) + G(3,
      F('Mode Name', inp(p + '.name', m.name, { ph: 'e.g. Battle Stance' })) +
      F('Chip Label', inp(p + '.label', m.label, { ph: 'Text shown on the sheet chip' })) +
      F('Combat Scope', sel(p + '.combatScope', m.combatScope || '', [['', 'Auto'], ['melee', 'Melee'], ['ranged', 'Ranged'], ['both', 'Both']], { narrow: true }))
    );
    let kids = scratchBlocks(m.effects || [], p + '.effects');
    if (!(m.effects || []).length) kids += '<div class="fs-warn" style="font-size:12px">⚠️ No blocks: a mode without blocks acts as Off and is not exported.</div>';
    kids += blockPalette(p + '.effects', false, true);
    return cBlock('c-teal', head, kids);
  }

  function universalExtraStacks(en, o) {
    o = o || {};
    let h = '';
    if (!o.skipPrereqs && hasFacet(en, 'prereqs')) h += prereqCBlock(en, 'Prerequisites');
    h += scratchBlocks(en.effects, 'effects', (b) => !inLevelRow(b));
    h += en.powers.map((pw, i) => (inLevelRow(pw) ? '' : powerCBlock(pw, i))).join('');
    h += (en.modes || []).map(modeCBlock).join('');
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
      '<button type="button" class="lego-add c-teal" data-action="add-mode">+ 🎚️ Mode</button>' +
      spotHtml('power', 'powers', { style: 'width:210px', ph: '🔍 + Attach Spell / SLA' }) +
      (hasFacet(en, 'progression') ? '' : '<button type="button" class="lego-add c-teal" data-action="attach-progression">+ 📊 Level / HD Table</button>') +
      (hasFacet(en, 'prereqs') ? '' : '<button type="button" class="lego-add c-amber" data-action="attach-prereqs">+ 🏛️ Prerequisites</button>');
    return blockPalette('effects', true, false, extra);
  }

  function enchCBlock(en) {
    const ch = en.chassis, v = chassisView(ch, en), cr = v.crystal;
    const enchs = v.enchs.map((e) => stack('b-green', H(L('✨ ' + esc(e.name)) + '<span class="fs-pill dim">' + (e.plus ? '+' + e.plus + ' bonus' : gp(e.gp)) + '</span><span class="lego-desc">' + esc(short(e.desc, 80)) + '</span>', delBtn('remove-ench', { id: e.id })))).join('');
    const crystal = cr
      ? stack('b-purple', H(L('💎 ' + esc(cr.c.name)) + '<span class="lego-desc">' + esc(short(cr.text, 70)) + '</span>', delBtn('remove-crystal', {})) + G(1, F('Crystal Tier', sel('chassis.crystal.tier', cr.tier, CRYSTAL_TIERS.map((t, i) => [t, cap1(t) + (cr.c.cost[i] == null ? ' — n/a' : ' — ' + gp(cr.c.cost[i]))]), { narrow: true }))))
      : stack('b-purple', G(1, F('💎 Augment Crystal', spotHtml('crystal', 'chassis'))));
    return cBlock('c-amber', H(L('✨ Enchantments & Crystal'), '<span class="fs-row" style="margin-left:auto;gap:6px"><span class="fs-pill ' + (v.effective > 10 ? 'rose' : 'emerald') + '">' + sgn(v.effective) + ' / +10</span><span class="fs-pill amber">💰 ' + gp(v.gpTotal) + '</span></span>'),
      enchs + stack('b-green', G(1, F('✨ Add Enchantment', spotHtml('ench', 'chassis')))) + crystal + v.warnings.map((w) => '<div class="fs-warn" style="font-size:12px">⚠️ ' + esc(w) + '</div>').join(''));
  }

  function scratchWeaponArmor(en) {
    const ch = en.chassis, v = chassisView(ch, en), isW = ch.kind === 'weapon';
    let h = hat('h-amber',
      H(L(isW ? '⚔️ Weapon' : '🛡️ Armor / Shield')) +
      G(2,
        F('Item Name', inp('name', en.name, { ph: v.name })) +
        F('Base Chassis', spotHtml('base', 'chassis', { ph: '🔍 ' + baseName(v.base) })) +
        F('Special Material', sel('chassis.material', ch.material, allMaterials().map((m) => [m.id, m.name]), { narrow: true })) +
        F('Enhancement Bonus', sel('chassis.enhancement', ch.enhancement, range(0, 5).map((n) => [n, sgn(n)]), { narrow: true, num: true })) +
        srcField(en, 'lego-span-full')
      ) + tagSockets(en));
    if (isW) {
      const w = ch.weapon;
      h += stack('b-blue',
        H(L('⚔️ Weapon Chassis'), '<span class="fs-pill sky">' + esc(v.critText) + (v.keen ? ' (Keen)' : '') + '</span>') +
        G(3,
          F('Base Damage', inp('chassis.weapon.dice', w.dice, { list: 'fs-dice-list' })) +
          F('Damage Type', sel('chassis.weapon.dmgType', w.dmgType, DAMAGE_TYPES.slice(0, 3), { narrow: true })) +
          F('Handedness', sel('chassis.weapon.handed', w.handed, ['Light', 'One-Handed', 'Two-Handed'], { narrow: true })) +
          F('Threat Range', sel('chassis.weapon.critRange', w.critRange, [[20, '20'], [19, '19–20'], [18, '18–20'], [17, '17–20'], [15, '15–20']], { narrow: true, num: true })) +
          F('Crit Multiplier', sel('chassis.weapon.critMult', w.critMult, [[2, '×2'], [3, '×3'], [4, '×4']], { narrow: true, num: true })) +
          F('Range Increment (ft.)', inp('chassis.weapon.range', w.range, { num: true }))
        ));
    } else {
      const a = ch.armor;
      h += stack('b-blue',
        H(L('🛡️ Armor Stats'), '<span class="lego-desc">After material: Max Dex ' + (v.armor.maxDex >= 99 ? '—' : sgn(v.armor.maxDex)) + ' • ACP ' + v.armor.acp + ' • ASF ' + v.armor.asf + '% • ' + v.armor.type + '</span>') +
        G(4,
          F('Armor / Shield Bonus', inp('chassis.armor.armorBonus', a.armorBonus, { num: true })) +
          F('Max Dex Bonus', inp('chassis.armor.maxDex', a.maxDex, { num: true })) +
          F('Armor Check Penalty', inp('chassis.armor.acp', a.acp, { num: true })) +
          F('Arcane Spell Failure (%)', inp('chassis.armor.asf', a.asf, { num: true }))
        ));
      if (v.kind === 'shield') {
        const bw = ch.weapon || shieldBashDefaults(v.base);
        const canBash = bw.canBash !== false;
        h += stack('b-red',
          H(L('⚔️ Shield Bash'),
            chk('chassis.weapon.canBash', canBash, 'Shield Bash Capable') +
            (canBash ? sel('chassis.weapon.bashMode', bw.bashMode || 'linked', [['linked', 'Linked to Shield Enhancement'], ['independent', 'Independent Enhancement']], { narrow: true }) + (bw.bashMode === 'independent' ? '<span class="fs-field" style="display:inline-flex;align-items:center;gap:4px">' + inp('chassis.weapon.bashEnh', num(bw.bashEnh, 0), { num: true, min: 0, max: 5, narrow: true, style: 'width:64px' }) + '<span class="fs-hint">Bash Enhancement (+)</span></span>' : '') : '') +
            (canBash && v.bash ? '<span class="fs-pill sky">' + esc(v.bash.dice + ' ' + v.bash.dmgType + ' • ' + v.bash.critText) + '</span>' : '<span class="lego-desc">Cannot make Shield Bash attacks (e.g. Buckler / Tower Shield)</span>')) +
          (canBash ? G(3,
            F('Bash Damage', inp('chassis.weapon.dice', bw.dice, { list: 'fs-dice-list' })) +
            F('Damage Type', sel('chassis.weapon.dmgType', bw.dmgType, DAMAGE_TYPES.slice(0, 3), { narrow: true })) +
            F('Bash Handedness', sel('chassis.weapon.handed', bw.handed === 'Light' ? 'Light' : 'One-Handed', ['Light', 'One-Handed'], { narrow: true })) +
            F('Threat Range', sel('chassis.weapon.critRange', bw.critRange, [[20, '20'], [19, '19–20'], [18, '18–20'], [17, '17–20'], [15, '15–20']], { narrow: true, num: true })) +
            F('Crit Multiplier', sel('chassis.weapon.critMult', bw.critMult, [[2, '×2'], [3, '×3'], [4, '×4']], { narrow: true, num: true })) +
            F('Throw Range (ft.)', inp('chassis.weapon.range', bw.range, { num: true }))
          ) : ''));
      }
    }
    h += enchCBlock(en);
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchWondrous(en) {
    const kinds = ['Wondrous Item', 'Ring', 'Rod', 'Staff', 'Wand', 'Potion / Oil', 'Scroll', 'Artifact / Relic'];
    const h = hat('h-amber',
      H(L('💎 Wondrous / Magic Item')) +
      G(3,
        F('Item Name', inp('name', en.name, { ph: 'Item name' })) +
        F('Item Kind', sel('item.subtype', en.item.subtype, kinds, { narrow: true })) +
        F('Body Slot', sel('item.slot', en.item.slot, BODY_SLOTS, { narrow: true })) +
        F('Market Price (gp)', inp('item.price', en.item.price, { num: true })) +
        F('Caster Level', inp('item.cl', en.item.cl, { num: true })) +
        srcField(en)
      ) + tagSockets(en));
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchSpell(en) {
    const sp = en.spell, sys = sp.system || 'spell', d = en.delivery, l = en.lifecycle;
    const hatTitle = { maneuver: '⚔️ Maneuver', invocation: '✨ Invocation', psionic: '⚡ Psionic', soulmeld: '💎 Soulmeld', vestige: '🏛️ Vestige', utterance: '📜 Utterance', mystery: '🔮 Mystery' }[sys] || '🔮 Spell';
    const sysField = F('System', sel('spell.system', sys, SPELL_SYSTEMS, { narrow: true }));
    const descRow = G(1, F('Descriptors', sp.descriptors.map((x, i) => '<span class="fs-pill rose">[' + esc(x) + ']<span class="fs-x" data-action="remove-descriptor" data-i="' + i + '">×</span></span>').join('') + spotHtml('descriptor', 'spell', { ph: '🔍 + Fire, Fear…' })));
    let idGrid = '';
    if (sys === 'spell') {
      const comps = ['V', 'S', 'M', 'F', 'DF', 'XP'].map((k) => '<button type="button" class="lego-pill' + (sp.comps[k] ? ' on' : '') + '" data-action="toggle-comp" data-k="' + k + '">' + k + '</button>').join('');
      const clsChips = sp.classes.map((c, i) => '<span class="fs-pill indigo" style="padding:2px 4px"><input class="fs-in" style="width:86px" data-bind="spell.classes.' + i + '.cls" list="fs-spellcls-list" value="' + esc(c.cls) + '">' + sel('spell.classes.' + i + '.lvl', c.lvl, range(0, 9), { num: true, style: 'width:52px' }) + '<span class="fs-x" data-action="remove-spellcls" data-i="' + i + '">×</span></span>').join('') + '<button type="button" class="fs-btn fs-xs fs-dashed" data-action="add-spellcls">+</button>';
      idGrid = G(3,
        F('Name', inp('name', en.name, { ph: 'Name' })) +
        sysField +
        srcField(en) +
        F('School', sel('spell.school', sp.school, SCHOOLS, { narrow: true })) +
        F('Components', comps, 'lego-span-2')
      ) + G(1, F('Class & Level', clsChips));
    } else {
      let sysCells = '';
      if (sys === 'maneuver') {
        sysCells =
          F('Maneuver Type', sel('spell.maneuverType', sp.maneuverType, MANEUVER_TYPES, { narrow: true })) +
          F('Discipline', sel('spell.discipline', sp.discipline, TOB_DISCIPLINES, { narrow: true })) +
          F('Initiator Level', sel('spell.maneuverLvl', sp.maneuverLvl, range(1, 9), { narrow: true, num: true })) +
          F('Prerequisite Maneuvers', sel('spell.prereqManeuvers', sp.prereqManeuvers, range(0, 5), { narrow: true, num: true }));
      } else if (sys === 'invocation') {
        sysCells =
          F('Invocation Kind', sel('spell.invKind', sp.invKind || 'Invocation', INV_KINDS, { narrow: true })) +
          F('Grade', sel('spell.invGrade', sp.invGrade, INV_GRADES, { narrow: true })) +
          F('Effective Spell Level', sel('spell.maneuverLvl', sp.maneuverLvl, range(1, 9), { narrow: true, num: true })) +
          F('School', sel('spell.school', sp.school, SCHOOLS, { narrow: true }));
      } else if (sys === 'psionic') {
        sysCells =
          F('Discipline', sel('spell.discipline', sp.discipline, PSIONIC_DISCIPLINES, { narrow: true })) +
          F('Power Level', sel('spell.maneuverLvl', sp.maneuverLvl, range(1, 9), { narrow: true, num: true })) +
          F('Power Points', inp('spell.ppCost', sp.ppCost, { num: true, min: 1 })) +
          F('Augmentation', chk('spell.augmentable', sp.augmentable, 'Augmentable'));
      } else if (sys === 'soulmeld') {
        sysCells =
          F('Meldshaper List', sel('spell.meldshaperList', sp.meldshaperList || 'Totemist', MELDSHAPER_LISTS, { narrow: true })) +
          F('Chakra Slots', inp('spell.chakraSlots', sp.chakraSlots || 'Arms / Totem', { ph: 'Arms / Totem' }), 'lego-span-2');
      } else if (sys === 'vestige') {
        sysCells =
          F('Vestige Level', sel('spell.vestigeLvl', sp.vestigeLvl || 1, range(1, 8), { narrow: true, num: true })) +
          F('Binding DC', inp('spell.bindingDc', sp.bindingDc || 15, { num: true })) +
          F('Sign & Influence', inp('spell.vestigeSign', sp.vestigeSign || '', { ph: 'Sign & Influence note' }));
      } else if (sys === 'utterance') {
        sysCells =
          F('Lexicon', sel('spell.lexicon', sp.lexicon || 'Evolving Mind', TRUENAME_LEXICONS, { narrow: true })) +
          F('Utterance Level', sel('spell.maneuverLvl', sp.maneuverLvl || 1, range(1, 6), { narrow: true, num: true }), 'lego-span-2');
      } else {
        sysCells =
          F('Mystery Tier', sel('spell.mysteryTier', sp.mysteryTier || 'Apprentice', MYSTERY_TIERS, { narrow: true })) +
          F('Mystery Level', sel('spell.maneuverLvl', sp.maneuverLvl || 1, range(1, 9), { narrow: true, num: true })) +
          F('Path', inp('spell.mysteryPath', sp.mysteryPath || '', { ph: 'Shutters and Clouds' }));
      }
      idGrid = G(3, F('Name', inp('name', en.name, { ph: 'Name' })) + sysField + srcField(en) + sysCells);
    }
    let h = hat('h-violet', H(L(hatTitle)) + idGrid + descRow + tagSockets(en));
    const hasRes = ['maneuver', 'soulmeld', 'vestige'].indexOf(sys) < 0;
    const resLbl = sys === 'psionic' ? 'Power Resistance' : 'Spell Resistance';
    const envCells = [F('Duration', sel('lifecycle.duration', l.duration, DURATIONS, { narrow: true }))];
    if (['rounds', 'roundsPerLevel', 'minPerLevel', 'hourPerLevel'].indexOf(l.duration) >= 0) {
      envCells.push(F('Duration Amount', inp('lifecycle.durValue', l.durValue, { num: true })));
    } else if (l.duration === 'text') {
      envCells.push(F('Custom Duration', inp('lifecycle.durText', l.durText, { ph: 'Custom duration…' })));
    }
    envCells.push(F('Dismissible', chk('lifecycle.dismissible', l.dismissible, 'Dismissible (D)')));
    envCells.push(F('Saving Throw', sel('delivery.save.type', d.save.type, [['None', 'None'], 'Fortitude', 'Reflex', 'Will'], { narrow: true })));
    if (d.save.type !== 'None') envCells.push(F('Save Outcome', sel('delivery.save.effect', d.save.effect, ['Negates', 'Half', 'Partial', 'Negates (harmless)', 'Disbelief'], { narrow: true })));
    if (hasRes) envCells.push(F(resLbl, sel('delivery.sr', d.sr, ['Yes', 'No', 'Yes (harmless)', 'Yes (object)', 'See text'], { narrow: true })));
    h += stack('b-teal',
      H(L('🎯 Execution Envelope')) +
      G(3,
        F('Action', sel('delivery.action', d.action, ACTIONS, { narrow: true })) +
        F('Range', inp('delivery.range', d.range, { list: 'fs-range-list' })) +
        F('Target / Area', inp('delivery.area', d.area, { list: 'fs-area-list' }))
      ) +
      G(envCells.length === 4 ? 2 : 3, envCells.join('')) +
      G(3, usageFields('lifecycle.use', l.use, 3)));
    if (d.attackOn) h += stack('b-red', H(L('🎯 Attack Roll'), delBtn('toggle-flag', { p: 'delivery.attackOn' })) + G(1, F('Attack Delivery', sel('delivery.attack', d.attack, Object.keys(ATTACK_LABEL).map((k) => [k, ATTACK_LABEL[k]]), { narrow: true }))));
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchFeat(en) {
    const fk = en.featKind || 'feat';
    const isUpto = en.repeat.mode === 'upto';
    let h = hat('h-emerald',
      H(L('📜 Feat / Feature')) +
      G(isUpto ? 3 : 2,
        F('Category', sel('featKind', fk, [['feat', 'Feat'], ['acf', 'Alternate Class Feature (ACF)'], ['substitution', 'Racial Substitution Level'], ['boon', 'Boon / Trait']], { narrow: true })) +
        F('Name', inp('name', en.name, { ph: 'Name' })) +
        F('Repeatable', sel('repeat.mode', en.repeat.mode, [['once', '1x Only'], ['upto', 'Up to N times'], ['per', 'Per Weapon / School']], { narrow: true })) +
        (isUpto ? F('Max Selections', sel('repeat.n', en.repeat.n, range(2, 20), { narrow: true, num: true })) : '') +
        srcField(en, isUpto ? 'lego-span-2' : '')
      ) + tagSockets(en));
    if (fk === 'acf' || fk === 'substitution') {
      h += stack('b-teal',
        H(L('⚡ Class Replacement')) +
        G(fk === 'substitution' ? 2 : 3,
          F('Class', '<input class="fs-in" data-bind="acf.targetClass" list="fs-spellcls-list" placeholder="Barbarian / Wizard" value="' + esc(en.acf.targetClass) + '">') +
          F('At Level', sel('acf.level', en.acf.level, range(1, 20).map((n) => [n, 'Lvl ' + n]), { narrow: true, num: true })) +
          F('Replaces Feature', inp('acf.replaces', en.acf.replaces, { ph: 'Fast Movement / Familiar' })) +
          (fk === 'substitution' ? F('Required Race', inp('acf.race', en.acf.race, { ph: 'Elf / Dwarf / Gnome' })) : '')
        ));
    }
    return h + (hasFacet(en, 'prereqs') ? prereqCBlock(en, 'Prerequisites') : '') + universalExtraStacks(en, { skipPrereqs: true }) + universalSnapPalette(en);
  }

  function scratchBuff(en) {
    const l = en.lifecycle;
    const hasDurVal = ['rounds', 'roundsPerLevel', 'minPerLevel', 'hourPerLevel'].indexOf(l.duration) >= 0;
    const cells = [
      F('State Kind', sel('buffKind', en.buffKind, ['Buff', 'Condition', 'Curse'], { narrow: true })),
      F('Name', inp('name', en.name, { ph: 'Name' })),
      srcField(en),
      F('Duration', sel('lifecycle.duration', l.duration, DURATIONS, { narrow: true }))
    ];
    if (hasDurVal) cells.push(F('Duration Amount', inp('lifecycle.durValue', l.durValue, { num: true })));
    cells.push(F('Stacking', chk('lifecycle.stackable', l.stackable, 'Stackable ×N')));
    if (l.stackable) cells.push(F('Maximum Stacks', sel('lifecycle.maxStacks', l.maxStacks, range(1, 20), { narrow: true, num: true })));
    return hat('h-rose', H(L('✨ Buff / Condition')) + G(3, cells.join('')) + tagSockets(en)) +
      universalExtraStacks(en) + universalSnapPalette(en);
  }

  const SKILL_PACKAGES = { Martial: ['Climb', 'Intimidate', 'Jump', 'Ride', 'Swim'], Arcane: ['Concentration', 'Craft', 'Decipher Script', 'Knowledge', 'Spellcraft'], Divine: ['Concentration', 'Diplomacy', 'Heal', 'Knowledge', 'Spellcraft'], Skirmisher: ['Balance', 'Hide', 'Listen', 'Move Silently', 'Spot', 'Tumble'] };
  function scratchClass(en) {
    const p = en.progression;
    let h = hat('h-emerald',
      H(L('💎 Class Chassis')) +
      G(3,
        F('Class Name', inp('name', en.name, { ph: 'Class name' })) +
        F('Progression Mode', sel('progression.mode', p.mode, PROGRESSION_MODES, { narrow: true })) +
        srcField(en) +
        F('Hit Die', sel('progression.hitDie', p.hitDie, [4, 6, 8, 10, 12].map((n) => [n, 'd' + n]), { narrow: true, num: true })) +
        F('Skill Points / Level', sel('progression.skillPts', p.skillPts, [2, 4, 6, 8].map((n) => [n, n + ' + Int']), { narrow: true, num: true })) +
        F('Base Attack Bonus', sel('progression.bab', p.bab, [['full', 'Full 1/1'], ['3/4', 'Med 3/4'], ['1/2', 'Poor 1/2']], { narrow: true })) +
        F('Good Saving Throws', ['fort', 'ref', 'will'].map((s) => '<button type="button" class="lego-pill' + (p.good[s] ? ' on' : '') + '" data-action="toggle-flag" data-p="progression.good.' + s + '">' + { fort: 'Fortitude', ref: 'Reflex', will: 'Will' }[s] + '</button>').join(''), 'lego-span-full')
      ) + tagSockets(en));
    if (hasFacet(en, 'prereqs')) h += prereqCBlock(en, 'Entry Prerequisites');
    h += patternGeneratorStack(p, p.maxLevel, 'Lvl');
    if (hasFacet(en, 'progression')) h += progressionCBlock(en);
    h += stack('b-green',
      H(L('📜 Class Skills'), btn('toggle-custom-skill', '+ 🎯 Custom Skill', 'fs-xs fs-dashed') + Object.keys(SKILL_PACKAGES).map((k) => btn('skill-pkg', '+ ' + k, 'fs-xs', { k: k })).join('')) +
      G(1, F('Trained Class Skills', p.classSkills.map((s, i) => '<span class="fs-pill emerald">' + esc(s) + '<span class="fs-x" data-action="remove-skill" data-i="' + i + '">×</span></span>').join('') + spotHtml('skill', 'class', { ph: '🔍 + Add Skill' }))));
    h += stack('b-purple',
      H(L('🎯 Bonus Feat Grants'), btn('add-grant', '+ Grant', 'fs-xs fs-dashed')) +
      G(1, F('Level & Pool Grants', en.grants.featGrants.map((x, i) => '<span class="fs-pill indigo">' + sel('grants.featGrants.' + i + '.level', x.level, range(1, 20).map((n) => [n, 'L' + n]), { num: true, style: 'width:56px' }) + ' ×' + x.count + ' from ' + sel('grants.featGrants.' + i + '.pool', x.pool, allTags(), { style: 'width:130px' }) + '<span class="fs-x" data-action="remove-grant" data-i="' + i + '">×</span></span>').join('') || '<span class="fs-hint">No bonus feat grants configured</span>')));
    const c = p.caster || { mode: 'none', clFormula: 'full', clCustom: '', tradition: 'Arcane', ability: 'int', spellList: '', ignoreAsf: 'none', ignoreShieldAsf: false, castInRage: false };
    const casterModeF = F('Casting Mode', sel('progression.caster.mode', c.mode, CASTER_MODES, { narrow: true }));
    h += stack('b-purple',
      H(L('🔮 Spellcasting / Subsystem')) +
      (c.mode === 'none'
        ? G(1, casterModeF)
        : G(3,
            casterModeF +
            F('Tradition', sel('progression.caster.tradition', c.tradition || 'Arcane', ['Arcane', 'Divine', 'Psionic', 'Incarnum', 'Pact', 'Truename', 'Shadow', 'Martial'], { narrow: true })) +
            F('Key Ability', sel('progression.caster.ability', c.ability || 'int', ABIL_KEYS.map((k) => [k, k.toUpperCase()]), { narrow: true })) +
            F('Spell / Power List', '<input class="fs-in" data-bind="progression.caster.spellList" list="fs-spellcls-list" placeholder="Cleric / Magus" value="' + esc(c.spellList) + '">') +
            F('Caster Level Progression', sel('progression.caster.clFormula', c.clFormula || 'full', CL_FORMULAS, { narrow: true })) +
            (c.clFormula === 'custom' ? F('Custom CL Formula', inp('progression.caster.clCustom', c.clCustom || '', { ph: '@classLevel + 2', fx: true }) + fxRefBtn('cl', 'progression.caster.clCustom')) : '') +
            F('Armored Casting (Ignore ASF)', sel('progression.caster.ignoreAsf', c.ignoreAsf || 'none', [['none', 'Normal ASF'], ['light', 'Light Armor'], ['medium', 'Up to Medium'], ['heavy', 'Up to Heavy']], { narrow: true })) +
            F('Shield ASF', chk('progression.caster.ignoreShieldAsf', !!c.ignoreShieldAsf, 'Ignore Shield ASF')) +
            F('Rage Casting', chk('progression.caster.castInRage', !!c.castInRage, '🩸 Cast in Rage'))
          )));
    return h + universalExtraStacks(en, { skipPrereqs: true, skipProgression: true }) + universalSnapPalette(en);
  }

  function scratchItemMod(en) {
    const im = en.itemMod;
    let h = hat('h-amber',
      H(L('✨ Item Modifier'), btn('save-item-mod', '📌 Register in Item Catalog', 'fs-xs fs-emerald')) +
      G(2,
        F('Modifier Kind', sel('itemMod.kind', im.kind, [['enchantment', 'Enchantment'], ['crystal', 'Augment Crystal'], ['material', 'Special Material']], { narrow: true })) +
        F('Applies To', sel('itemMod.on', im.on, [['weapon', 'Weapon'], ['armor', 'Armor'], ['shield', 'Shield'], ['armor+shield', 'Armor + Shield']], { narrow: true })) +
        F('Modifier Name', inp('name', en.name, { ph: 'Modifier name (e.g. Magebane)' })) +
        srcField(en)
      ) + tagSockets(en));
    if (im.kind === 'enchantment') {
      h += stack('b-green',
        H(L('💎 Cost & Badge')) +
        G(3,
          F('Pricing Mode', sel('itemMod.costMode', im.costMode, [['plus', '+1..+5 Bonus'], ['gp', 'Flat +GP']], { narrow: true })) +
          (im.costMode === 'plus'
            ? F('Bonus Equivalent', sel('itemMod.plus', im.plus, range(1, 5).map((n) => [n, '+' + n + ' Bonus']), { narrow: true, num: true }))
            : F('Flat Cost (gp)', inp('itemMod.gp', im.gp, { num: true, min: 0 }))) +
          F('Crit Flag', chk('itemMod.keen', im.keen, 'Keen (Crit ×2)')) +
          F('Tactical Badge', inp('itemMod.badge', im.badge, { ph: '+2 Enh vs Arcane Casters' }), 'lego-span-full')
        ));
    } else if (im.kind === 'crystal') {
      h += stack('b-purple',
        H(L('💎 Augment Crystal Tiers')) +
        G(2, CRYSTAL_TIERS.map((t, i) =>
          F(cap1(t) + ' Cost (gp)', inp('itemMod.crystalCosts.' + i, im.crystalCosts[i] == null ? '' : im.crystalCosts[i], { num: true, min: 0, ph: 'GP' })) +
          F(cap1(t) + ' Effect', inp('itemMod.crystalTiers.' + i, im.crystalTiers[i] || '', { ph: cap1(t) + ' effect…' }))
        ).join('')));
    } else if (im.kind === 'material') {
      const m = im.mat;
      h += stack('b-blue',
        H(L('🛡️ Material Rules')) +
        G(3,
          F('Max Dex Δ', inp('itemMod.mat.maxDexDelta', m.maxDexDelta, { num: true })) +
          F('Armor Check Penalty Δ', inp('itemMod.mat.acpDelta', m.acpDelta, { num: true })) +
          F('Arcane Spell Failure (%) Δ', inp('itemMod.mat.asfDelta', m.asfDelta, { num: true })) +
          F('Crit Multiplier Override', sel('itemMod.mat.critMultOverride', m.critMultOverride, [[0, 'Keep (0)'], [2, '×2'], [3, '×3'], [4, '×4']], { narrow: true, num: true })) +
          F('DR Bypass', inp('itemMod.mat.drBypass', m.drBypass, { ph: 'adamantine' }), 'lego-span-2')
        ) +
        G(4,
          F('Weapon +GP', inp('itemMod.mat.weaponGp', m.weaponGp, { num: true, min: 0, ph: '0' })) +
          F('Light Armor +GP', inp('itemMod.mat.lightGp', m.lightGp, { num: true, min: 0, ph: '0' })) +
          F('Medium Armor +GP', inp('itemMod.mat.medGp', m.medGp, { num: true, min: 0, ph: '0' })) +
          F('Heavy Armor +GP', inp('itemMod.mat.heavyGp', m.heavyGp, { num: true, min: 0, ph: '0' }))
        ));
    }
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchRace(en) {
    const r = en.race;
    const isTpl = r.kind === 'template';
    const h = hat('h-emerald',
      H(L('🧬 Race / Creature Template')) +
      G(3,
        F('Name', inp('name', en.name, { ph: 'Race / Template name' })) +
        F('Kind', sel('race.kind', r.kind, [['race', 'Base Race'], ['template', 'Creature Template']], { narrow: true })) +
        (isTpl ? F('Template Timing', sel('race.timing', r.timing, ['Inherited', 'Acquired'], { narrow: true })) : srcField(en)) +
        (isTpl ? srcField(en) : '') +
        F('Size', sel('race.size', r.size, CREATURE_SIZES, { narrow: true })) +
        F('Creature Type', sel('race.creatureType', r.creatureType, CREATURE_TYPES, { narrow: true })) +
        F('Subtypes', inp('race.subtype', r.subtype, { ph: 'Gnome, Augmented' })) +
        F('Favored Class', inp('race.favoredClass', r.favoredClass, { ph: 'Favored (Any)' })) +
        F('Land Speed (ft.)', inp('race.speed', r.speed, { num: true, min: 0 })) +
        F('Fly Speed (ft.)', inp('race.flySpeed', r.flySpeed, { num: true, min: 0 })) +
        F('Fly Maneuverability', sel('race.flyMan', r.flyMan, FLY_MANEUVERABILITIES, { narrow: true })) +
        F('Level Adjustment', sel('race.la', r.la, range(0, 8).map((n) => [n, '+' + n]), { narrow: true, num: true })) +
        F('Racial Hit Dice', sel('race.rhdCount', r.rhdCount, range(0, 20), { narrow: true, num: true })) +
        F('RHD Die Size', sel('race.rhdDie', r.rhdDie, [6, 8, 10, 12].map((n) => [n, 'd' + n]), { narrow: true, num: true })) +
        F('Bonus Feat', chk('race.bonusFeat1', r.bonusFeat1, '1st-Lvl Bonus Feat')) +
        F('Skill Point Bonus', chk('race.bonusSkillPts', r.bonusSkillPts, 'Human Skill Points (+4/+1)'), isTpl ? 'lego-span-full' : 'lego-span-2')
      ) + tagSockets(en));
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function alignGrid(g) { return '<div class="fs-align">' + ALIGNS.map((a) => '<button type="button" data-action="set-deity-align" data-a="' + a + '" class="' + (a === g.deityAlign ? 'deity' : clericLegal(g.deityAlign, a) ? 'legal' : '') + '" title="' + ALIGN_NAMES[a] + '">' + a + '</button>').join('') + '</div>'; }
  function scratchDeity(en) {
    const g = en.grants;
    let h = hat('h-amber',
      H(L('🏛️ Deity')) +
      G(2,
        F('Deity Name', inp('name', en.name, { ph: 'Deity name' })) +
        F('Favored Weapon', spotHtml('favwpn', 'deity', { ph: '🔍 ' + (g.favoredWeapon || 'Select Base Weapon') })) +
        srcField(en, 'lego-span-full') +
        F('Alignment Matrix', alignGrid(g) + '<span class="lego-desc">Legal Cleric alignments (1 step): ' + ALIGNS.filter((a) => clericLegal(g.deityAlign, a)).join(', ') + '</span>', 'lego-span-full')
      ) + tagSockets(en));
    const doms = g.domains.map((d, i) => (d.kind === 'inline'
      ? stack('b-purple', H(L('✨ Inline Domain'), delBtn('remove-domain', { i: i })) + G(2, F('Domain Name', inp('grants.domains.' + i + '.name', d.name, { ph: 'Domain name' })) + F('Granted Power', inp('grants.domains.' + i + '.grantedPower', d.grantedPower, { ph: 'Granted power…' }))))
      : stack('b-purple', H(L('✨ Domain:') + '<span class="fs-pill purple">' + esc(d.name) + '</span><span class="lego-desc">' + esc(short(d.grantedPower, 90)) + '</span>', delBtn('remove-domain', { i: i })))
    )).join('');
    let empty = ''; for (let k = 0; k < Math.max(1, 2 - g.domains.length); k++) empty += stack('b-purple', G(1, F('✨ Attach Domain', spotHtml('domain', 'slot' + k, { ph: '🔍 Pick SRD / Custom Domain' }))));
    h += cBlock('c-amber', H(L('✨ Granted Domains')), doms + empty + btn('add-domain-inline', '✨ + Inline New Domain', 'fs-xs fs-dashed'));
    h += stack('b-slate',
      H(L('📜 Portfolio & Dogma')) +
      G(2,
        F('Portfolio', inp('grants.portfolio', g.portfolio, { ph: 'Sun, light, strength, healing' })) +
        F('Worshippers / Dogma', inp('grants.dogma', g.dogma, { ph: 'Those who wish to see evil vanquished…' }))
      ));
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchDomain(en) {
    const g = en.grants;
    let h = hat('h-sky',
      H(L('✨ Cleric Domain')) +
      G(2, F('Domain Name', inp('name', en.name, { ph: 'Domain name' })) + srcField(en)) +
      tagSockets(en));
    h += stack('b-blue',
      H(L('⚡ Granted Power')) +
      G(2,
        F('Power Name', inp('grants.grantedPowerName', g.grantedPowerName, { ph: 'Power name (e.g. Greater Turning)' }), 'lego-span-full') +
        usageFields('grants.gpUse', g.gpUse, 2) +
        F('Rule Summary', inp('grants.grantedPower', g.grantedPower, { ph: 'Rule summary…' }), 'lego-span-full')
      ));
    h += cBlock('c-teal', H(L('🔮 Domain Spell Ladder (1st–9th)')), g.ladder.map((s, i) => stack('b-slate', G(1, F('Level ' + (i + 1) + ' Domain Spell', (s ? '<span class="fs-pill purple">🔮 ' + esc(s) + '<span class="fs-x" data-action="clear-ladder" data-i="' + i + '">×</span></span>' : '') + spotHtml('ladder', i, { ph: s ? '🔍 Replace Lvl ' + (i + 1) + ' Spell…' : '🔍 Pick Spell (Lvl ' + (i + 1) + ')' }))))).join(''));
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function scratchMonster(en) {
    const m = en.monster;
    const nonSet = new Set(m.nonabilities || []);
    let h = hat('h-rose',
      H(L('👹 Monster / Companion Statblock')) +
      G(4,
        F('Name', inp('name', en.name, { ph: 'Adult Red Dragon / Wolf Companion' }), 'lego-span-2') +
        F('Challenge Rating (CR)', inp('monster.cr', m.cr, { ph: '1/2, 1, 15' })) +
        srcField(en) +
        F('Size', sel('monster.size', m.size, CREATURE_SIZES, { narrow: true })) +
        F('Creature Type', sel('monster.creatureType', m.creatureType, CREATURE_TYPES, { narrow: true })) +
        F('Subtypes', inp('monster.subtypes', m.subtypes, { ph: 'Fire, Extraplanar' })) +
        F('Alignment', inp('monster.alignment', m.alignment, { ph: 'Always Chaotic Evil' })) +
        F('Hit Dice Count', inp('monster.hdCount', m.hdCount, { num: true, min: 1 })) +
        F('HD Die Size', sel('monster.hdDie', m.hdDie, [4, 6, 8, 10, 12].map((n) => [n, 'd' + n]), { narrow: true, num: true })) +
        F('HD Flat Bonus', inp('monster.hdBonus', m.hdBonus, { num: true })) +
        F('Average HP', inp('monster.hp', m.hp, { num: true, min: 1 })) +
        F('Initiative', inp('monster.init', m.init, { num: true })) +
        F('Base Attack Bonus', inp('monster.bab', m.bab, { num: true })) +
        F('Grapple Modifier', inp('monster.grapple', m.grapple, { num: true })) +
        F('Level Adjustment', inp('monster.la', m.la == null ? 0 : m.la, { num: true })) +
        F('Space', inp('monster.space', m.space, { ph: '5 ft.' })) +
        F('Reach', inp('monster.reach', m.reach, { ph: '5 ft.' })) +
        F('Environment', inp('monster.environment', m.environment, { ph: 'Warm mountains' }), 'lego-span-2')
      ) + tagSockets(en));
    h += stack('b-blue',
      H(L('🛡️ Armor Class, Movement & Saving Throws')) +
      G(4,
        F('Total AC', inp('monster.ac.total', m.ac.total, { num: true })) +
        F('Touch AC', inp('monster.ac.touch', m.ac.touch, { num: true })) +
        F('Flat-Footed AC', inp('monster.ac.flatFooted', m.ac.flatFooted, { num: true })) +
        F('Natural Armor (+)', inp('monster.ac.naturalArmor', m.ac.naturalArmor, { num: true })) +
        F('Land Speed (ft.)', inp('monster.speeds.land', m.speeds.land, { num: true, min: 0 })) +
        F('Fly Speed (ft.)', inp('monster.speeds.fly', m.speeds.fly, { num: true, min: 0 })) +
        F('Fly Maneuverability', sel('monster.speeds.flyMan', m.speeds.flyMan || 'Average', FLY_MANEUVERABILITIES, { narrow: true })) +
        F('Swim / Climb / Burrow', '<div class="fs-row">' + inp('monster.speeds.swim', m.speeds.swim, { num: true, ph: 'Swim' }) + inp('monster.speeds.climb', m.speeds.climb, { num: true, ph: 'Climb' }) + inp('monster.speeds.burrow', m.speeds.burrow, { num: true, ph: 'Burrow' }) + '</div>') +
        F('Fortitude Save', inp('monster.saves.fort', m.saves.fort, { num: true })) +
        F('Reflex Save', inp('monster.saves.ref', m.saves.ref, { num: true })) +
        F('Will Save', inp('monster.saves.will', m.saves.will, { num: true }))
      ));
    h += stack('b-amber',
      H(L('💪 Ability Scores & Nonabilities (—)')) +
      G(3, ['str', 'dex', 'con', 'int', 'wis', 'cha'].map((k) => {
        const isNon = nonSet.has(k);
        const toggleBtn = '<button type="button" class="fs-btn fs-xs ' + (isNon ? 'fs-on' : 'fs-ghost') + '" data-action="toggle-nonability" data-k="' + k + '">' + (isNon ? '∅ Nonability (—)' : 'Active') + '</button>';
        return F(k.toUpperCase() + ' Score', '<div class="fs-row">' + (isNon ? '<span class="fs-pill dim">— (Nonability)</span>' : inp('monster.abilities.' + k, m.abilities[k], { num: true, min: 1 })) + toggleBtn + '</div>');
      }).join('')));
    const atkCards = (m.attacks || []).map((a, i) => stack('b-red',
      H(L('⚔️ Attack #' + (i + 1) + ': ' + esc(a.name || 'Strike')), delBtn('remove-mon-atk', { i: i })) +
      G(4,
        F('Attack Name', inp('monster.attacks.' + i + '.name', a.name || 'Claw', { ph: 'Bite / 2 Claws' })) +
        F('Attack Bonus (+)', inp('monster.attacks.' + i + '.bonus', a.bonus != null ? a.bonus : 0, { num: true })) +
        F('Damage Expression', inp('monster.attacks.' + i + '.damage', a.damage || '1d6+1', { ph: '2d6+8' })) +
        F('Crit / Type', inp('monster.attacks.' + i + '.crit', a.crit || '20/x2', { ph: '19-20/x2' }))
      )
    )).join('');
    h += cBlock('c-amber', H(L('⚔️ Natural & Manufactured Attacks (' + (m.attacks || []).length + ')')), atkCards + btn('add-mon-atk', '⚔️ + Add Attack Line', 'fs-xs fs-dashed'));
    const featPills = (m.feats || []).map((f) => '<span class="fs-pill indigo">📜 ' + esc(typeof f === 'string' ? f : f.name) + '</span>').join('');
    const saCards = (m.specialAbilities || []).map((sa, i) => stack('b-purple',
      H(L('✨ ' + esc(sa.name || 'Special Ability') + ' (' + esc(sa.type || 'Ex') + ')'), delBtn('remove-mon-sa', { i: i })) +
      G(3,
        F('Trait Name', inp('monster.specialAbilities.' + i + '.name', sa.name || '', { ph: 'Frightful Presence' })) +
        F('Ability Type', sel('monster.specialAbilities.' + i + '.type', sa.type || 'Ex', ['Ex', 'Su', 'Sp'], { narrow: true })) +
        F('Rule Summary', inp('monster.specialAbilities.' + i + '.description', sa.description || sa.benefit || '', { ph: 'Trait mechanics…' }), 'lego-span-full')
      )
    )).join('');
    h += cBlock('c-teal',
      H(L('✨ Racial Feats (' + (m.feats || []).length + ') & Special Qualities (' + (m.specialAbilities || []).length + ')')),
      (featPills ? '<div class="fs-row" style="margin-bottom:8px;flex-wrap:wrap">' + featPills + '</div>' : '') +
      saCards + btn('add-mon-sa', '✨ + Add Special Quality (Ex/Su/Sp)', 'fs-xs fs-dashed')
    );
    return h + universalExtraStacks(en) + universalSnapPalette(en);
  }

  function renderScratch() {
    const en = S.entry;
    const originBar = (en.origin.mode !== 'new' || en.origin.srdId)
      ? stack('b-slate',
          H(L('📚 Loaded from ' + esc(en.origin.srdName)), '<span class="fs-hint">(' + esc(en.origin.srdType) + ' • ' + esc(en.origin.srdId) + ')</span>') +
          G(1, F('Origin Mode', sel('origin.mode', en.origin.mode, [['override', 'Override Official ID'], ['variant', 'Clone as Variant (new ID)'], ['new', 'Detach as New Entry']], { narrow: true })))
        )
      : '';
    const fn = { weapon: scratchWeaponArmor, armor: scratchWeaponArmor, wondrous: scratchWondrous, spell: scratchSpell, feat: scratchFeat, buff: scratchBuff, class: scratchClass, deity: scratchDeity, domain: scratchDomain, item_mod: scratchItemMod, race: scratchRace, monster: scratchMonster }[en.blueprint] || scratchWondrous;
    const ruleFooter = stack('b-slate', G(1, F('Rule Text', inp('text', en.text, { ph: 'Official / custom rule text…' }))));
    return datalists() + '<div class="lego-canvas"><div class="lego-stack">' + originBar + fn(en) + ruleFooter + '</div></div>';
  }

  function renderFacets() { if (typeof document === 'undefined') return; $('#fs-facets').innerHTML = renderScratch(); }
  function renderJson() {
    const open = S.ui.jsonOpen, imp = S.ui.importOpen;
    $('#fs-json-wrap').className = 'fs-glass fs-facet' + (open || imp ? ' open' : '');
    const headBtns = btn('toggle-import-json', '📥 Import JSON', 'fs-xs' + (imp ? ' fs-on' : '')) + (open ? btn('copy-json', 'Copy JSON', 'fs-xs') : '<span class="fs-hint">click to expand</span>');
    const importBox = imp ? '<div class="fs-import-box"><div class="fs-row" style="justify-content:space-between;margin-bottom:6px"><span class="fs-label-mini">📥 Paste Canonical V3 JSON Blueprint</span><span class="fs-hint">Reconstructs Rule Blocks, @Resource variables, C-Block branches, carriers & progressions</span></div>' +
      '<textarea class="fs-in" data-uibind="importText" placeholder="Paste exported Canonical V3 JSON here…">' + esc(S.ui.importText) + '</textarea>' +
      '<div class="fs-row" style="margin-top:8px">' + btn('run-import-json', '⚡ Load JSON into Rule Crafter', 'fs-xs fs-emerald') + btn('toggle-import-json', 'Cancel', 'fs-xs fs-ghost') + '</div></div>' : '';
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
  function renderAll() { if (typeof document === 'undefined') return; S.spot = null; renderTopbar(); renderCraftDrawer(); renderLiveHeader(); renderFacets(); renderJson(); renderFxRef(); }
  function toast(msg, kind) {
    if (typeof document === 'undefined') return;
    const wrap = $('#fs-toasts'); if (!wrap) return;
    while (wrap.children.length >= 2) wrap.firstElementChild.remove();
    const el = document.createElement('div');
    el.className = 'fs-toast ' + (kind || 'ok'); el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.remove(); }, 3200);
  }

  // --------------------------------------------------------------------------
  // 16. Actions (delegated data-action routing)
  // --------------------------------------------------------------------------
  const MAX_HISTORY = 50;
  function pushUndo(coalescePath) {
    const now = Date.now();
    const h = S.history;
    if (coalescePath && h.lastPath === coalescePath && (now - h.lastTs) < 600) {
      h.lastTs = now;
      return;
    }
    h.past.push(clone(S.entry));
    if (h.past.length > MAX_HISTORY) h.past.shift();
    h.future = [];
    h.lastPath = coalescePath || '';
    h.lastTs = now;
  }
  function undoEntry() {
    const h = S.history;
    if (!h.past.length) { toast('Nothing to undo', 'warn'); return false; }
    h.future.push(clone(S.entry));
    S.entry = h.past.pop();
    h.lastPath = ''; h.lastTs = 0;
    renderAll();
    return true;
  }
  function redoEntry() {
    const h = S.history;
    if (!h.future.length) { toast('Nothing to redo', 'warn'); return false; }
    h.past.push(clone(S.entry));
    S.entry = h.future.pop();
    h.lastPath = ''; h.lastTs = 0;
    renderAll();
    return true;
  }
  function rekeyBlockIds(b) {
    const c = clone(b);
    c.id = uid('b');
    if (Array.isArray(c.branches)) c.branches = c.branches.map((br) => Object.assign({}, br, { id: uid('br'), kids: (br.kids || []).map(rekeyBlockIds) }));
    if (Array.isArray(c.rows)) c.rows = c.rows.map((r) => Object.assign({}, r, { id: uid('r'), kids: (r.kids || []).map(rekeyBlockIds) }));
    return c;
  }
  function setAllBlocksOpen(flag) {
    const walk = (arr) => (arr || []).forEach((b) => {
      if (!b || !b.id) return;
      if (flag) S.ui.cardOpen['blk:' + b.id] = true; else delete S.ui.cardOpen['blk:' + b.id];
      if (b.branches) b.branches.forEach((br) => walk(br.kids));
      if (b.rows) b.rows.forEach((r) => walk(r.kids));
    });
    walk(S.entry.effects);
    (S.entry.powers || []).forEach((pw) => walk(pw.effects));
    (S.entry.modes || []).forEach((m) => walk(m.effects));
  }
  function loadEntry(en, presetId) {
    en.source = normSource(en.source);
    S.entry = en; S.activePreset = presetId || ''; S.ui.cardOpen = {}; S.ui.facetOpen = {}; S.spot = null;
    S.history = { past: [], future: [], lastPath: '', lastTs: 0 };
    if (!presetId && en.origin && en.origin.mode === 'new' && !en.name && (en.effects || []).length === 1) {
      S.ui.cardOpen['blk:' + en.effects[0].id] = true;
    }
    S.ui.liveUserOverride = null;
    S.ui.liveWasScrolled = false;
  }
  function addPaletteBlock(listPath, type, preset) {
    const list = getPath(S.entry, listPath);
    if (!Array.isArray(list)) return;
    pushUndo();
    const wondrousCarrier = type === 'carrier' && S.entry.blueprint === 'wondrous' ? { carrierMode: 'metamagic', costMode: 'rod', transform: 'quicken' } : null;
    const b = BLK(type, Object.assign({}, NEUTRAL_BLOCK[type] ? clone(NEUTRAL_BLOCK[type]) : {}, wondrousCarrier, preset ? clone(preset) : null));
    list.push(b);
    if ((listPath || '').indexOf('effects') === 0) ensureFacet('effects');
    S.ui.cardOpen['blk:' + b.id] = true;
    renderAll();
  }
  function summarizeV3Block(b) {
    if (!b || typeof b !== 'object') return 'block';
    if (b.type === 'roll') {
      const expr = b.scaling === 'formula' && b.dice ? String(b.dice) : (b.die === 'flat' ? String(num(b.count, 0)) : `${num(b.count, 1)}${b.die || 'd6'}${num(b.flat, 0) ? (num(b.flat, 0) > 0 ? `+${num(b.flat, 0)}` : String(num(b.flat, 0))) : ''}`);
      const kind = b.kind || 'Damage';
      return kind === 'Healing' ? `roll: ${expr} Healing` : `roll: ${expr}${b.dmgType ? ' ' + b.dmgType : ''} ${kind}`.trim();
    }
    if (b.type === 'stat') {
      const tgt = Array.isArray(b.targets) && b.targets.length ? b.targets.join(', ') : (b.swapTarget || 'stat');
      if (b.mode === 'replaceStat') return `stat swap: ${b.fromStat || '?'} -> ${b.toStat || '?'} (${tgt})`;
      const val = b.mode === 'formula' ? (b.formula || 'formula') : (num(b.value, 0) >= 0 ? `+${num(b.value, 0)}` : String(num(b.value, 0)));
      const bt = b.btype && b.btype !== 'Untyped' ? ` ${b.btype}` : '';
      return `stat: ${val}${bt} ${tgt}`;
    }
    if (b.type === 'defense') {
      const dm = b.mode || 'Immunity';
      if (dm === 'DR') return `defense: DR ${b.value || 0}/${b.what || '—'}`;
      if (dm === 'Spell Resistance') return `defense: SR ${b.srMode === 'level' ? 'Level-based' : (b.value || 10)}`;
      if (dm === 'Energy Resistance') return `defense: ${b.what || 'Energy'} Resistance ${b.value || 0}`;
      if (dm === 'Concealment %') return `defense: Concealment ${b.value || 20}%`;
      return `defense: ${dm}${b.what ? ' (' + b.what + ')' : ''}`;
    }
    if (b.type === 'resource') {
      const resetMap = { perDay: '/day', perEncounter: '/encounter', perWeek: '/week', cooldown: ' cooldown' };
      return `resource: ${b.max || 0}${resetMap[b.reset] || '/day'}${b.name ? ' ' + b.name : ''}`;
    }
    return `${b.type || 'effect'} block`;
  }
  function applyV3Patch(patch, opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    const dryRun = !!o.dryRun;
    const mode = o.mode === 'replace' ? 'replace' : 'append';
    if (!patch || typeof patch !== 'object') {
      return { ok: false, dryRun, mode, addedIds: [], counts: { effects: 0, modes: 0, powers: 0, choices: 0 }, items: [], summary: 'Invalid V3 patch.' };
    }
    const normPatch = (patch.type && BLOCK_TYPES[patch.type] && !Array.isArray(patch.effects))
      ? { effects: [patch] }
      : patch;
    const curBp = (S.entry && S.entry.blueprint) || 'feat';
    const wrapper = {
      schemaVersion: 3,
      blueprint: normPatch.blueprint || curBp,
      effects: Array.isArray(normPatch.effects) ? normPatch.effects : [],
      modes: Array.isArray(normPatch.modes) ? normPatch.modes : [],
      powers: Array.isArray(normPatch.powers) ? normPatch.powers : [],
      choices: Array.isArray(normPatch.choices) ? normPatch.choices : []
    };
    const imported = fromCanonicalV3(wrapper);
    const newEffects = (imported.effects || []).map(rekeyBlockIds);
    const newPowers = (imported.powers || []).map((pw) => Object.assign({}, clone(pw), {
      id: uid('pw'),
      effects: (pw.effects || []).map(rekeyBlockIds)
    }));
    const newModes = (imported.modes || []).map((m) => Object.assign({}, clone(m), {
      id: 'mode-' + uid('m').slice(2),
      effects: (m.effects || []).map(rekeyBlockIds)
    }));
    const newModesOff = (imported._modesOff || []).map((m) => Object.assign({}, clone(m), {
      id: 'mode-' + uid('m').slice(2),
      effects: (m.effects || []).map(rekeyBlockIds)
    }));
    const newModesWeapon = (imported._modesWeapon || []).map((m) => Object.assign({}, clone(m), {
      id: 'mode-' + uid('m').slice(2),
      effects: (m.effects || []).map(rekeyBlockIds)
    }));
    const newChoices = Array.isArray(imported.choices) ? clone(imported.choices) : [];

    const items = [];
    newEffects.forEach((b) => items.push(`+1 ${summarizeV3Block(b)}`));
    newModes.concat(newModesOff, newModesWeapon).forEach((m) => items.push(`+1 mode: ${m.name || m.label || 'Mode'}`));
    newPowers.forEach((pw) => items.push(`+1 power: ${pw.name || (pw.ref && pw.ref.name) || 'Power'}`));
    newChoices.forEach((ch) => items.push(`+1 choice: ${ch.label || ch.kind || ch.id || 'Choice'}`));

    const counts = {
      effects: newEffects.length,
      modes: newModes.length + newModesOff.length + newModesWeapon.length,
      powers: newPowers.length,
      choices: newChoices.length
    };
    const total = counts.effects + counts.modes + counts.powers + counts.choices;
    if (total === 0) {
      return { ok: false, dryRun, mode, addedIds: [], counts, items: [], summary: 'No V3 blocks in patch.' };
    }
    const summary = items.join(', ');
    if (dryRun) {
      return { ok: true, dryRun: true, mode, addedIds: [], counts, items, summary };
    }
    if (!S.entry) loadEntry(scaffold(blankEntry(curBp)), '');
    pushUndo();
    if (mode === 'replace') {
      if (Array.isArray(normPatch.effects)) S.entry.effects = newEffects;
      if (Array.isArray(normPatch.powers)) S.entry.powers = newPowers;
      if (Array.isArray(normPatch.modes)) {
        S.entry.modes = newModes;
        S.entry._modesOff = newModesOff;
        S.entry._modesWeapon = newModesWeapon;
      }
      if (Array.isArray(normPatch.choices)) S.entry.choices = newChoices;
    } else {
      if (!Array.isArray(S.entry.effects)) S.entry.effects = [];
      if (!Array.isArray(S.entry.powers)) S.entry.powers = [];
      if (!Array.isArray(S.entry.modes)) S.entry.modes = [];
      if (!Array.isArray(S.entry._modesOff)) S.entry._modesOff = [];
      if (!Array.isArray(S.entry._modesWeapon)) S.entry._modesWeapon = [];
      if (!Array.isArray(S.entry.choices)) S.entry.choices = [];
      newEffects.forEach((b) => S.entry.effects.push(b));
      newPowers.forEach((pw) => S.entry.powers.push(pw));
      newModes.forEach((m) => S.entry.modes.push(m));
      newModesOff.forEach((m) => S.entry._modesOff.push(m));
      newModesWeapon.forEach((m) => S.entry._modesWeapon.push(m));
      newChoices.forEach((ch) => {
        if (!S.entry.choices.some((x) => x && ch && x.id && x.id === ch.id)) S.entry.choices.push(ch);
      });
    }
    if (typeof document !== 'undefined') {
      if (counts.effects > 0) ensureFacet('effects');
      if (counts.powers > 0) ensureFacet('powers');
    }
    if (o.openAdded !== false) {
      newEffects.forEach((b) => { if (b && b.id) S.ui.cardOpen['blk:' + b.id] = true; });
    }
    renderAll();
    return { ok: true, dryRun: false, mode, addedIds: newEffects.map((b) => b.id), counts, items, summary };
  }
  function updateBlockField(blockId, patchFields) {
    if (!S.entry || !blockId || !patchFields || typeof patchFields !== 'object') return false;
    const blk = (S.entry.effects || []).find((b) => b && b.id === blockId);
    if (!blk) return false;
    pushUndo('chip:' + blockId);
    if (blk.type === 'roll' && typeof patchFields.dice === 'string') {
      const m = patchFields.dice.trim().match(/^(\d+)\s*d(\d+)(?:\s*([+-]\s*\d+))?$/i);
      if (m) {
        blk.count = parseInt(m[1], 10) || 1;
        blk.die = 'd' + m[2];
        blk.flat = m[3] ? (parseInt(m[3].replace(/\s+/g, ''), 10) || 0) : 0;
        blk.scaling = 'flat';
        delete blk.dice;
      }
    } else {
      Object.assign(blk, patchFields);
    }
    delete blk._src;
    delete blk._srcSub;
    renderAll();
    return true;
  }
  function setEntry(path, v) { const prev = getPath(S.entry, path); if (prev === v) return; pushUndo(path); setPath(S.entry, path, v); onSet(path, v, prev); }
  function onSet(path, v, prev) {
    const en = S.entry;
    // Switching a block into formula mode converts the current selection of the previous mode into its formula,
    // so nothing has to be retyped (a stale formula from an earlier formula session is replaced).
    if (/\.mode$/.test(path) && v === 'formula' && prev !== 'formula') {
      const blk = getPath(en, path.replace(/\.mode$/, ''));
      const seeded = blk && blk.type === 'stat' ? seedStatFormula(blk, prev) : '';
      if (String(seeded || '').trim()) blk.formula = seeded;
    }
    if (/\.scaling$/.test(path) && v === 'formula' && prev !== 'formula') {
      const blk = getPath(en, path.replace(/\.scaling$/, ''));
      const seeded = blk && blk.type === 'roll' ? seedRollFormula(blk, prev) : '';
      if (String(seeded || '').trim()) blk.dice = seeded;
    }
    if (/\.effectKind$/.test(path) && v === 'statSwap') {
      const blk = getPath(en, path.replace(/\.effectKind$/, ''));
      if (blk) {
        delete blk.effectKind;
        delete blk.flag;
        delete blk.ruleFlag;
        Object.assign(blk, {
          type: 'stat', mode: 'replaceStat', swapTarget: 'atk.ranged.abilityMod',
          targets: ['atk.ranged.abilityMod'], subOp: 'max', fromStat: 'dex', toStat: 'wis',
          swapScope: 'all', cap: 'none', capVal: 5, condition: blk.condition || ''
        });
        S.ui.cardOpen['blk:' + blk.id] = true;
      }
      return;
    }
    if (/\.mode$/.test(path) && v === 'replaceStat') {
      const blk = getPath(en, path.replace(/\.mode$/, ''));
      if (blk && blk.type === 'stat') {
        const swapTgt = normalizeSwapTargetKey(blk.swapTarget || (blk.targets && blk.targets[0]) || 'atk.melee.abilityMod');
        blk.swapTarget = swapTgt;
        blk.targets = [swapTgt];
        blk.subOp = blk.subOp || 'max';
        blk.fromStat = SWAP_DEFAULT_FROM[swapTgt] || blk.fromStat || 'str';
        blk.toStat = blk.toStat || 'wis';
        blk.swapScope = blk.swapScope || blk.scope || 'all'; delete blk.scope;
      }
    }
    if (/\.swapTarget$/.test(path)) {
      const blk = getPath(en, path.replace(/\.swapTarget$/, ''));
      if (blk && blk.type === 'stat') {
        const swapTgt = normalizeSwapTargetKey(v);
        blk.swapTarget = swapTgt;
        blk.targets = [swapTgt];
        blk.fromStat = SWAP_DEFAULT_FROM[swapTgt] || blk.fromStat || 'str';
      }
    }
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
        const baseArm = byId(CAT.armors, v) || {};
        const k = baseArm.kind;
        if (k === 'shield') en.chassis.weapon = shieldBashDefaults(baseArm);
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
    } else if (path === 'origin.mode' && (v === 'variant' || v === 'new')) {
      if (v === 'variant') en.id = uid('custom');
      if (prev === 'override') en.source = DEFAULT_SOURCE;
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
    if (en.blueprint === 'race' && !en.effects.length) en.effects.push(BLK('stat', { targets: ['dex'], value: 0, btype: 'Racial' }));
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
    'toggle-prog-pattern': () => { S.ui.progPatternOpen = !S.ui.progPatternOpen; renderFacets(); },
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
    'embed-save': () => {
      const exported = exportEntry(S.entry);
      if (!exported.name || !String(exported.name).trim()) { toast('Please enter a name before saving.', 'warn'); return; }
      const ctx = S.embed && S.embed.context ? S.embed.context : {};
      const allowChar = ctx.allowCharacterScope !== false;
      const saveScope = allowChar ? ((S.embed && S.embed.saveScope) || 'character') : 'campaign';
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'crafter:saveEntry',
          entry: exported,
          saveScope: saveScope,
          originalId: (S.embed && S.embed.originalId) || exported.id || '',
          context: ctx
        }, '*');
      }
    },
    'embed-cancel': () => {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'crafter:close' }, '*');
      }
    },
    'toggle-live': () => {
      const liveEl = $('#fs-live');
      const next = !!(liveEl && liveEl.classList.contains('collapsed'));
      S.ui.liveUserOverride = next ? 'open' : 'closed';
      S.ui.liveOpenMobile = next;
      syncLiveScroll(true);
    },
    'toggle-fxref': (el) => {
      const kind = el && el.dataset ? el.dataset.kind : '';
      if (el && el.dataset && el.dataset.fxpath) S.fxPath = el.dataset.fxpath;
      // A "!" button for another field switches the examples instead of closing the panel.
      S.ui.fxRefOpen = kind && S.ui.fxRefOpen && S.ui.fxKind !== kind ? true : !S.ui.fxRefOpen;
      if (S.ui.fxRefOpen) S.ui.guideOpen = false;
      if (kind) S.ui.fxKind = kind;
      renderTopbar();
      renderFxRef();
    },
    'toggle-guide': () => {
      S.ui.guideOpen = !S.ui.guideOpen;
      if (S.ui.guideOpen) S.ui.fxRefOpen = false;
      renderTopbar();
      renderFxRef();
    },
    'load-guide-example': (el) => {
      const g = GUIDE_RECIPES[num(el && el.dataset ? el.dataset.idx : -1, -1)];
      if (!g || !g.entry) return;
      loadEntry(fromCanonicalV3(clone(g.entry)), '');
      toast('📖 Guide example loaded: ' + g.entry.name);
      renderAll();
    },
    'toggle-craft-rm': () => {
      S.ui.craftOpen = !S.ui.craftOpen;
      S.ui.craftStatus = '';
      S.ui.craftNeedKey = false;
      renderTopbar();
      renderCraftDrawer();
      if (S.ui.craftOpen) {
        const ta = document.querySelector('[data-uibind="craftText"]');
        if (ta) ta.focus();
      }
    },
    'save-craft-apikey': () => {
      const key = String(S.ui.craftApiKey || '').trim();
      if (!key) { toast('Please enter a valid Gemini API key.', 'warn'); return; }
      try {
        window.localStorage.setItem('dnd35_gemini_api_key', key);
        const parentRm = (typeof window !== 'undefined' && window.parent && window.parent !== window && window.parent.RuleMaster) ? window.parent.RuleMaster : null;
        if (parentRm && typeof parentRm.setApiKey === 'function') parentRm.setApiKey(key);
      } catch (e) { /* ignore storage error */ }
      S.ui.craftApiKey = '';
      S.ui.craftNeedKey = false;
      ACT['run-craft-rm']();
    },
    'run-craft-rm': async () => {
      if (S.ui.craftBusy) return;
      const raw = String(S.ui.craftText || '').trim();
      if (!raw) { toast('Paste D&D 3.5e rule text or enter a rule name to craft.', 'warn'); return; }

      let parentRm = null;
      try {
        if (typeof window !== 'undefined' && window.parent && window.parent !== window && window.parent.RuleMaster) parentRm = window.parent.RuleMaster;
      } catch (e) { parentRm = null; }
      let apiKey = '';
      try {
        apiKey = (parentRm && typeof parentRm.getApiKey === 'function' && parentRm.getApiKey()) || window.localStorage.getItem('dnd35_gemini_api_key') || window.localStorage.getItem('gemini_api_key') || '';
      } catch (e) { apiKey = ''; }

      // Layer 1 (0-Token, <0.3ms): Unified deterministic V3 Scriber with clause-level coverage check
      const RE0 = typeof window !== 'undefined' ? window.RuleEngine : null;
      let partialScribe = null;
      if (RE0 && (typeof RE0.scribeRuleText === 'function' || typeof RE0.parseRuleTextToV3 === 'function')) {
        try {
          const curName = String(S.entry.name || '').trim();
          const hasDefaultBlank = !curName || /^New\s+/i.test(curName);
          const scribeOpts = {
            blueprint: S.entry.blueprint || 'feat',
            name: hasDefaultBlank ? '' : curName,
            id: S.entry.id || undefined,
            source: S.entry.source || undefined,
            preserveUnparsedAsRuleBlocks: !apiKey
          };
          const sRes = typeof RE0.scribeRuleText === 'function'
            ? RE0.scribeRuleText(raw, scribeOpts)
            : (() => {
                const e = RE0.parseRuleTextToV3(raw, scribeOpts);
                const hasMech = e && ((Array.isArray(e.powers) && e.powers.length > 0) || (Array.isArray(e.choices) && e.choices.length > 0) || (Array.isArray(e.effects) && e.effects.some(b => b && !(b.type === 'effect' && b.effectKind === 'rule'))));
                return { entry: e, hasRealMech: Boolean(hasMech), coverage: hasMech ? 'full' : 'none', mechanicalUnparsedClauses: [] };
              })();
          if (sRes && sRes.hasRealMech) {
            if (sRes.coverage === 'full' || !apiKey) {
              const scribed = sRes.entry;
              loadEntry(fromCanonicalV3(scribed), '');
              S.ui.craftOpen = false;
              S.ui.craftStatus = '';
              S.ui.craftNeedKey = false;
              renderAll();
              const totalBlocks = (scribed.effects ? scribed.effects.length : 0) + (scribed.powers ? scribed.powers.length : 0) + (scribed.choices ? scribed.choices.length : 0);
              const partialHint = sRes.coverage === 'partial'
                ? ' • ' + sRes.mechanicalUnparsedClauses.length + ' complex clause(s) kept as rule text'
                : '';
              toast('✨ Crafted "' + scribed.name + '" (' + totalBlocks + ' block' + (totalBlocks === 1 ? '' : 's') + ')' + partialHint);
              return;
            }
            partialScribe = sRes;
          }
        } catch (e) { /* fall through to Rule Master API */ }
      }

      const BP_TO_CAT = {
        weapon: 'Weapon', armor: 'Armor', wondrous: 'Wondrous Item', spell: 'Spell', feat: 'Feat',
        buff: 'Condition', class: 'Class', item_mod: 'Augment Crystal', race: 'Race', deity: 'Deity', domain: 'Domain', monster: 'Feat'
      };
      const catHint = BP_TO_CAT[S.entry.blueprint] || 'Feat';
      if (!apiKey) {
        S.ui.craftNeedKey = true;
        renderCraftDrawer();
        const ki = document.querySelector('[data-uibind="craftApiKey"]');
        if (ki) ki.focus();
        return;
      }
      S.ui.craftBusy = true;
      S.ui.craftStatus = partialScribe
        ? 'Refining remaining clause(s) with Rule Master (' + catHint + ')…'
        : 'Consulting Rule Master (' + catHint + ')…';
      renderCraftDrawer();

      // Standalone dynamic Gemini model discovery + retired model shield
      const discoverStandaloneModels = async (key) => {
        let retired = {};
        try { retired = JSON.parse(window.localStorage.getItem('dnd35_retired_gemini_models') || '{}') || {}; } catch (_) { retired = {}; }
        const isUsable = (id) => {
          if (!id || retired[id]) return false;
          if (/^(gemini-1\.|gemini-pro|gemini-2\.0-flash-exp|.*-(vision|embedding|tts|image|audio|live|aqa))/i.test(id)) return false;
          return /^gemini-(2\.5|3|4)/i.test(id);
        };
        try {
          const cached = JSON.parse(window.localStorage.getItem('dnd35_standalone_models_v1') || 'null');
          if (cached && cached.ts && (Date.now() - cached.ts < 3600000) && Array.isArray(cached.models)) {
            const valid = cached.models.filter(isUsable);
            if (valid.length) return valid;
          }
        } catch (_) { /* ignore cache parse error */ }
        try {
          const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + encodeURIComponent(key));
          if (r.ok) {
            const j = await r.json();
            const found = (j.models || [])
              .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.indexOf('generateContent') >= 0)
              .map(m => String(m.name || '').replace(/^models\//, ''))
              .filter(isUsable)
              .sort((a, b) => (/flash/i.test(b) - /flash/i.test(a)) || b.localeCompare(a));
            if (found.length) {
              try { window.localStorage.setItem('dnd35_standalone_models_v1', JSON.stringify({ ts: Date.now(), models: found.slice(0, 6) })); } catch (_) { /* ignore */ }
              return found.slice(0, 4);
            }
          }
        } catch (_) { /* fallback below */ }
        return ['gemini-2.5-flash', 'gemini-2.5-pro'].filter(isUsable);
      };

      const callStandaloneGeminiJson = async (promptText, models, key) => {
        let lastErr = null;
        for (let mi = 0; mi < models.length; mi++) {
          const mName = models[mi];
          try {
            const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + mName + ':generateContent?key=' + encodeURIComponent(key);
            const genCfg = { temperature: 0.1, responseMimeType: 'application/json' };
            if (mName.indexOf('2.5') >= 0) genCfg.thinkingConfig = { thinkingBudget: 0 };
            const resp = await fetch(url, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: genCfg })
            });
            if (!resp.ok) {
              const ej = await resp.json().catch(() => ({}));
              const msg = (ej.error && ej.error.message) || ('HTTP ' + resp.status);
              if (resp.status === 404 || /not\s+found|deprecated|retired/i.test(msg)) {
                try {
                  const ret = JSON.parse(window.localStorage.getItem('dnd35_retired_gemini_models') || '{}') || {};
                  ret[mName] = Date.now();
                  window.localStorage.setItem('dnd35_retired_gemini_models', JSON.stringify(ret));
                } catch (_) { /* ignore */ }
              }
              throw new Error(msg);
            }
            const data = await resp.json();
            const txt = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
            if (txt) {
              const mJson = txt.match(/\{[\s\S]*\}/);
              return { parsed: JSON.parse(mJson ? mJson[0] : txt), model: mName };
            }
          } catch (e) { lastErr = e; }
        }
        throw (lastErr || new Error('Rule Master could not craft a response.'));
      };

      try {
        let entries = null;
        if (parentRm) {
          if (partialScribe && typeof parentRm.refinePartialScribeWithAi === 'function') {
            entries = await parentRm.refinePartialScribeWithAi(raw, partialScribe, catHint, apiKey, null);
          } else {
            const isLongProse = raw.length > 100 && /\s/.test(raw) && !/^(spell|feat|race|deity|domain|weapon|armor|shield|item|class|maneuver|stance|condition):/i.test(raw);
            entries = (isLongProse && typeof parentRm.queryAiFreeTextRows === 'function')
              ? await parentRm.queryAiFreeTextRows(raw, apiKey, null)
              : await parentRm.fetchSingleAiRuleObjects(raw, catHint, apiKey, null);
          }
        } else {
          const RE = typeof window !== 'undefined' ? window.RuleEngine : null;
          const lockedJson = partialScribe ? JSON.stringify({
            effects: partialScribe.entry.effects || [],
            powers: partialScribe.entry.powers || [],
            choices: partialScribe.entry.choices || []
          }) : '';
          const reqBody = partialScribe
            ? (raw + '\n\nTarget Blueprint: "' + (S.entry.blueprint || 'feat') + '" (Category: "' + catHint + '")\nLocked 0-Token V3 Blocks (KEEP INTACT): ' + lockedJson + '\nRemaining Unparsed Clauses to Translate into V3 `effects[]` / `powers[]` / `modes[]`: ' + JSON.stringify(partialScribe.mechanicalUnparsedClauses))
            : (raw + '\nTarget Blueprint: "' + (S.entry.blueprint || 'feat') + '" (Category: "' + catHint + '")');
          const prompt = (RE && typeof RE.buildLegoAssemblyPrompt === 'function')
            ? RE.buildLegoAssemblyPrompt(reqBody, [])
            : reqBody;
          const models = await discoverStandaloneModels(apiKey);
          let callRes = await callStandaloneGeminiJson(prompt, models, apiKey);
          let parsed = callRes.parsed;
          let rawList = Array.isArray(parsed.entries) ? parsed.entries : (Array.isArray(parsed) ? parsed : [parsed]);
          if (RE && typeof RE.validateV3Entry === 'function' && rawList[0]) {
            const vCheck = RE.validateV3Entry(rawList[0], { checkRawFirst: true, defaultBlueprint: S.entry.blueprint || 'feat' });
            if (!vCheck.rawOk && vCheck.rawErrors.length > 0) {
              try {
                const repairPrompt = 'Fix the following Pure Canonical V3 validation errors in your JSON response and return ONLY valid `{"entries":[...]}` (schemaVersion: 3, zero modifiers/damageParts, closed `when` conditions or condKind:"situational"):\nErrors:\n- ' + vCheck.rawErrors.join('\n- ') + '\n\nOriginal JSON:\n' + JSON.stringify(rawList[0]);
                const repaired = await callStandaloneGeminiJson(repairPrompt, [callRes.model].concat(models), apiKey);
                const repList = Array.isArray(repaired.parsed.entries) ? repaired.parsed.entries : (Array.isArray(repaired.parsed) ? repaired.parsed : [repaired.parsed]);
                if (repList[0]) rawList = repList;
              } catch (_) { /* sanitizeV3Entry fallback below */ }
            }
          }
          entries = rawList.map((it) => {
            const san = (RE && typeof RE.sanitizeV3Entry === 'function') ? RE.sanitizeV3Entry(it, { defaultBlueprint: S.entry.blueprint || 'feat' }) : it;
            if (partialScribe && san) {
              const seen = new Set((partialScribe.entry.effects || []).map(b => JSON.stringify(b)));
              san.effects = (partialScribe.entry.effects || []).concat((san.effects || []).filter(b => !seen.has(JSON.stringify(b))));
              if ((partialScribe.entry.powers || []).length && !(san.powers || []).length) san.powers = partialScribe.entry.powers;
              if ((partialScribe.entry.choices || []).length && !(san.choices || []).length) san.choices = partialScribe.entry.choices;
            }
            return san;
          }).filter(Boolean);
        }
        if (!entries || !entries.length) throw new Error('No matching D&D 3.5e rule returned for "' + raw + '".');
        const RE2 = typeof window !== 'undefined' ? window.RuleEngine : null;
        const crafted = (RE2 && typeof RE2.sanitizeV3Entry === 'function') ? RE2.sanitizeV3Entry(entries[0], { defaultBlueprint: S.entry.blueprint || 'feat' }) : entries[0];
        loadEntry(fromCanonicalV3(crafted), '');
        S.ui.craftBusy = false;
        S.ui.craftOpen = false;
        S.ui.craftStatus = '';
        renderAll();
        toast('✨ Crafted "' + crafted.name + '" onto the Rule Crafter canvas');
      } catch (err) {
        if (partialScribe && partialScribe.entry) {
          const fallback = JSON.parse(JSON.stringify(partialScribe.entry));
          if (partialScribe.mechanicalUnparsedClauses.length) {
            fallback.effects = (fallback.effects || []).concat([{ type: 'effect', effectKind: 'rule', label: 'Additional Rule Clause', text: partialScribe.mechanicalUnparsedClauses.join(' ').slice(0, 280) }]);
          }
          loadEntry(fromCanonicalV3(fallback), '');
          S.ui.craftBusy = false;
          S.ui.craftOpen = false;
          S.ui.craftStatus = '';
          renderAll();
          toast('✨ Loaded local V3 blocks (Rule Master API unavailable: ' + ((err && err.message) || 'offline') + ')', 'warn');
          return;
        }
        S.ui.craftBusy = false;
        S.ui.craftStatus = '';
        renderCraftDrawer();
        toast('Rule Master Error: ' + ((err && err.message) || 'failed to craft'), 'err');
      }
    },
    'fx-apply': (el) => {
      const t = fxTarget();
      if (!t) { toast('Click a formula field first', 'warn'); return; }
      t.value = el.dataset.ins || '';
      t.focus(); t.setSelectionRange(t.value.length, t.value.length);
      handleBind(t, false);
    },
    'fx-insert': (el) => {
      const t = fxTarget();
      if (!t) { toast('Click a formula field first', 'warn'); return; }
      const ins = el.dataset.ins || '';
      const a = t === document.activeElement || !S.fxSel ? (t.selectionStart == null ? t.value.length : t.selectionStart) : S.fxSel[0];
      const b = t === document.activeElement || !S.fxSel ? (t.selectionEnd == null ? a : t.selectionEnd) : S.fxSel[1];
      t.value = t.value.slice(0, a) + ins + t.value.slice(b);
      const caret = a + ins.length - (/\(\)$/.test(ins) ? 1 : 0);
      t.focus(); t.setSelectionRange(caret, caret);
      handleBind(t, false);
    },
    'undo': () => { undoEntry(); },
    'redo': () => { redoEntry(); },
    'expand-all-blocks': () => { setAllBlocksOpen(true); renderFacets(); },
    'collapse-all-blocks': () => { setAllBlocksOpen(false); renderFacets(); },
    'prev-toggle-tac': (el) => { const k = el.dataset.k; S.ui[k] = !S.ui[k]; renderLiveHeader(); },
    'add-block': (el) => { addPaletteBlock(el.dataset.p, el.dataset.t, null); },
    'add-block-preset': (el) => { const q = (QUICK_PRESETS[el.dataset.t] || [])[num(el.dataset.k)]; if (q) addPaletteBlock(el.dataset.p, el.dataset.t, q.o); },
    'remove-block': (el) => { pushUndo(); getPath(S.entry, el.dataset.p).splice(num(el.dataset.i), 1); renderAll(); },
    'move-block': (el) => {
      const a = getPath(S.entry, el.dataset.p), i = num(el.dataset.i), j = i + num(el.dataset.d);
      if (!Array.isArray(a) || j < 0 || j >= a.length) return;
      pushUndo();
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      renderAll();
    },
    'dup-block': (el) => {
      const a = getPath(S.entry, el.dataset.p), i = num(el.dataset.i);
      if (!Array.isArray(a) || !a[i]) return;
      pushUndo();
      const copy = rekeyBlockIds(a[i]);
      a.splice(i + 1, 0, copy);
      S.ui.cardOpen['blk:' + copy.id] = true;
      renderAll();
    },
    'wrap-block-when': (el) => {
      const a = getPath(S.entry, el.dataset.p), i = num(el.dataset.i);
      if (!Array.isArray(a) || !a[i]) return;
      pushUndo();
      const inner = a[i];
      let initKind = 'state', initText = '';
      if (inner.condition && typeof inner.condition === 'string' && inner.condition.trim()) {
        const rawC = inner.condition.trim();
        if (WHEN_COND_LABELS[rawC]) { initKind = rawC; initText = ''; delete inner.condition; }
        else {
          const st = classifyConditionStatus(rawC, 'stat', 'state');
          if (st.kind === 'auto') { initKind = 'state'; initText = rawC; delete inner.condition; }
          else { initKind = 'situational'; initText = rawC; delete inner.condition; }
        }
      }
      const w = BLK('when', { flow: 'while', branches: [Object.assign({}, NEUTRAL_BRANCH_OVERRIDES, { condKind: initKind, condText: initText, kids: [inner] })] });
      a[i] = w;
      S.ui.cardOpen['blk:' + w.id] = true;
      renderAll();
    },
    'wrap-cond-when': (el) => {
      const bp = el.dataset.bp || '';
      const m = bp.match(/^(.*)\.(\d+)$/);
      if (!m) return;
      ACT['wrap-block-when']({ dataset: { p: m[1], i: m[2] } });
    },
    'unwrap-when': (el) => {
      const a = getPath(S.entry, el.dataset.p), i = num(el.dataset.i);
      if (!Array.isArray(a) || !a[i] || a[i].type !== 'when') return;
      pushUndo();
      const kids = [];
      (a[i].branches || []).forEach((br) => (br.kids || []).forEach((k) => kids.push(k)));
      a.splice.apply(a, [i, 1].concat(kids));
      renderAll();
    },
    'lift-block-out': (el) => {
      const listPath = el.dataset.p || '', i = num(el.dataset.i);
      const m = listPath.match(/^(.*)\.(\d+)\.(branches|rows)\.(\d+)\.kids$/);
      if (!m) return;
      const parentList = getPath(S.entry, m[1]), contIdx = num(m[2]), kids = getPath(S.entry, listPath);
      if (!Array.isArray(parentList) || !Array.isArray(kids) || !kids[i]) return;
      pushUndo();
      const moved = kids.splice(i, 1)[0];
      parentList.splice(contIdx + 1, 0, moved);
      S.ui.cardOpen['blk:' + moved.id] = true;
      renderAll();
    },
    'move-kid-branch': (el) => {
      const w = getPath(S.entry, el.dataset.wp), bi = num(el.dataset.bi), to = num(el.dataset.to), i = num(el.dataset.i);
      if (!w || !w.branches || !w.branches[bi] || !w.branches[to]) return;
      const src = w.branches[bi].kids || [];
      if (!src[i]) return;
      pushUndo();
      const moved = src.splice(i, 1)[0];
      w.branches[to].kids = w.branches[to].kids || [];
      w.branches[to].kids.push(moved);
      renderAll();
    },
    'add-branch': (el) => { pushUndo(); getPath(S.entry, el.dataset.p).push(blankBranch(Object.assign({}, NEUTRAL_BRANCH_OVERRIDES))); renderAll(); },
    'remove-branch': (el) => { pushUndo(); getPath(S.entry, el.dataset.p).splice(num(el.dataset.i), 1); renderAll(); },
    'move-branch': (el) => {
      const a = getPath(S.entry, el.dataset.p), i = num(el.dataset.i), j = i + num(el.dataset.d);
      if (!Array.isArray(a) || j < 0 || j >= a.length) return;
      pushUndo();
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      renderAll();
    },
    'add-row': (el) => { pushUndo(); const rows = getPath(S.entry, el.dataset.p); rows.push({ id: uid('r'), roll: String(rows.length + 1), kids: [] }); renderAll(); },
    'remove-row': (el) => { pushUndo(); getPath(S.entry, el.dataset.p).splice(num(el.dataset.i), 1); renderAll(); },
    'remove-target': (el) => { pushUndo(); getPath(S.entry, el.dataset.p).splice(num(el.dataset.i), 1); renderAll(); },
    'toggle-flag': (el) => { setEntry(el.dataset.p, !getPath(S.entry, el.dataset.p)); renderAll(); },
    'skill-pkg': (el) => { pushUndo(); const cs = S.entry.progression.classSkills; SKILL_PACKAGES[el.dataset.k].forEach((s) => { if (cs.indexOf(s) < 0) cs.push(s); }); renderAll(); },
    'remove-skill': (el) => { pushUndo(); S.entry.progression.classSkills.splice(num(el.dataset.i), 1); renderAll(); },
    'clear-ladder': (el) => { pushUndo(); S.entry.grants.ladder[num(el.dataset.i)] = ''; renderAll(); },
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
    'remove-tag': (el) => { pushUndo(); S.entry.tags.splice(num(el.dataset.i), 1); renderAll(); },
    'add-spellcls': () => { pushUndo(); S.entry.spell.classes.push({ cls: 'Sor/Wiz', lvl: 1 }); renderAll(); },
    'remove-spellcls': (el) => { pushUndo(); S.entry.spell.classes.splice(num(el.dataset.i), 1); renderAll(); },
    'remove-descriptor': (el) => { pushUndo(); S.entry.spell.descriptors.splice(num(el.dataset.i), 1); renderAll(); },
    'toggle-comp': (el) => { pushUndo(); const c = S.entry.spell.comps; c[el.dataset.k] = !c[el.dataset.k]; renderAll(); },
    'add-prereq': () => { pushUndo(); ensureFacet('prereqs'); const r = { id: uid('p'), alts: [ALT({})] }; S.entry.prereqs.push(r); S.ui.cardOpen['pr:' + r.id] = true; renderAll(); },
    'add-or': (el) => { pushUndo(); const r = S.entry.prereqs[num(el.dataset.ri)]; r.alts.push(ALT({})); S.ui.cardOpen['pr:' + r.id] = true; renderAll(); },
    'remove-alt': (el) => { pushUndo(); const ri = num(el.dataset.ri), r = S.entry.prereqs[ri]; r.alts.splice(num(el.dataset.ai), 1); if (!r.alts.length) S.entry.prereqs.splice(ri, 1); renderAll(); },
    'remove-prereq': (el) => { pushUndo(); S.entry.prereqs.splice(num(el.dataset.ri), 1); renderAll(); },
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
        modObj = { id: modSlug, kind: 'material', name: name, on: im.on, desc: en.text || '', src: normSource(en.source), mat: clone(im.mat) };
      } else if (im.kind === 'crystal') {
        modObj = { id: modSlug, kind: 'crystal', name: name, on: im.on, cost: im.crystalCosts.map((c) => (c === '' || c == null ? null : num(c))), tiers: im.crystalTiers.slice(), src: normSource(en.source),
          customParts: cParts, customMods: cMods };
      } else {
        modObj = { id: modSlug, kind: 'enchantment', name: name, on: im.on, plus: im.costMode === 'plus' ? num(im.plus, 1) : 0, gp: im.costMode === 'gp' ? num(im.gp, 0) : 0,
          desc: en.text || im.badge || '', src: normSource(en.source),
          effect: { keen: !!im.keen, badge: im.badge || '', parts: cParts, mods: cMods } };
      }
      const idx = S.customItemMods.findIndex((x) => x.id === modObj.id || x.name.toLowerCase() === name.toLowerCase());
      if (idx >= 0) S.customItemMods[idx] = modObj; else S.customItemMods.push(modObj);
      saveLS(); toast('📌 Registered "' + name + '" in Item Catalog'); renderAll();
    },
    // Level / HD Table rows (race / template): the new block or sub-power is gained at that level.
    'add-block-at-level': (el) => { const lv = num(el.dataset.lv, 1); addPaletteBlock('effects', el.dataset.t, lv > 1 ? { gainedAt: lv } : null); },
    'add-power-at-level': (el) => {
      ensureFacet('powers');
      const lv = num(el.dataset.lv, 1);
      const pw = blankPower('inline', { name: 'New Power ' + (S.entry.powers.length + 1), gainedAt: lv > 1 ? lv : '' });
      S.entry.powers.push(pw);
      S.ui.cardOpen['pw:' + pw.id] = true;
      renderAll();
    },
    'add-power-inline': () => { ensureFacet('powers'); const pw = blankPower('inline', { name: 'New Power ' + (S.entry.powers.length + 1) }); S.entry.powers.push(pw); S.ui.cardOpen['pw:' + pw.id] = true; renderAll(); },
    'remove-power': (el) => { S.entry.powers.splice(num(el.dataset.i), 1); renderAll(); },
    'move-power': (el) => { const a = S.entry.powers, i = num(el.dataset.i), j = i + num(el.dataset.d); if (j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; renderAll(); },
    'add-mode': () => {
      const en = S.entry; en.modes = en.modes || [];
      const n = en.modes.length + 1;
      const m = { id: 'mode-' + uid('m').slice(2), name: 'New Mode ' + n, label: 'New Mode ' + n, combatScope: '', effects: [], _extra: {} };
      en.modes.push(m); S.ui.cardOpen['md:' + m.id] = true; renderAll();
    },
    'remove-mode': (el) => { S.entry.modes.splice(num(el.dataset.i), 1); renderAll(); },
    'move-mode': (el) => { const a = S.entry.modes, i = num(el.dataset.i), j = i + num(el.dataset.d); if (j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; renderAll(); },
    'gen-pattern': () => { const p = S.entry.progression; if (!String(p.pattern.name || '').trim()) { toast('Name the repeating feature first', 'warn'); return; } applyPattern(p, p.pattern); toast('Generated "' + p.pattern.name + '" rows'); renderAll(); },
    'add-feature-inline': (el) => { const mode = S.entry.progression.mode; const lbl = mode === 'hd' ? 'New Trait / SLA' : mode === 'legacy' ? 'New Legacy Ability' : 'New Class Feature'; const f = FEATURE(lbl, { kind: 'inline', abilityType: 'Ex' }); S.entry.progression.levels[num(el.dataset.l)].features.push(f); S.ui.cardOpen['ft:' + f.id] = true; renderAll(); },
    'remove-feature': (el) => { S.entry.progression.levels[num(el.dataset.l)].features.splice(num(el.dataset.f), 1); renderAll(); },
    'set-deity-align': (el) => { S.entry.grants.deityAlign = el.dataset.a; renderAll(); },
    'add-domain-inline': () => { const d = { id: uid('dm'), kind: 'inline', name: 'New Domain', grantedPower: '', ladder: ['', '', '', '', '', '', '', '', ''] }; S.entry.grants.domains.push(d); S.ui.cardOpen['dm:' + d.id] = true; renderAll(); },
    'remove-domain': (el) => { S.entry.grants.domains.splice(num(el.dataset.i), 1); renderAll(); },
    'add-deity-inline': () => { const d = { id: uid('dt'), kind: 'inline', name: 'New Deity', align: 'N', favoredWeapon: 'Quarterstaff' }; S.entry.grants.deities.push(d); S.ui.cardOpen['dt:' + d.id] = true; renderAll(); },
    'remove-deity': (el) => { S.entry.grants.deities.splice(num(el.dataset.i), 1); renderAll(); },
    'add-grant': () => { const g = { id: uid('g'), count: 1, pool: allTags()[0], level: 1 }; S.entry.grants.featGrants.push(g); S.ui.cardOpen['g:' + g.id] = true; renderAll(); },
    'remove-grant': (el) => { S.entry.grants.featGrants.splice(num(el.dataset.i), 1); renderAll(); },
    'toggle-nonability': (el) => {
      const k = el.dataset.k, arr = S.entry.monster.nonabilities || (S.entry.monster.nonabilities = []);
      const idx = arr.indexOf(k);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(k);
      renderAll();
    },
    'add-mon-atk': () => {
      S.entry.monster.attacks.push({ name: 'Claw', type: 'Natural', bonus: num(S.entry.monster.bab, 1), damage: '1d6+1', damageType: 'Slashing', crit: '20/x2', range: '-' });
      renderAll();
    },
    'remove-mon-atk': (el) => { S.entry.monster.attacks.splice(num(el.dataset.i), 1); renderAll(); },
    'add-mon-sa': () => {
      S.entry.monster.specialAbilities.push({ name: 'Special Quality', type: 'Ex', description: '' });
      renderAll();
    },
    'remove-mon-sa': (el) => { S.entry.monster.specialAbilities.splice(num(el.dataset.i), 1); renderAll(); }
  };

  // --------------------------------------------------------------------------
  // 17. Event wiring (single delegated root)
  // --------------------------------------------------------------------------
  function handleBind(el, full) {
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.t === 'num') v = num(v);
    if (el.dataset.bind) { setEntry(el.dataset.bind, v); renderTopbar(); }
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
    if (IS_EMBED && typeof document !== 'undefined' && document.body) {
      document.body.classList.add('is-embed');
    }
    const root = document.getElementById('fs-app');
    root.addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-action]');
      if (!el || !root.contains(el)) return;
      const fn = ACT[el.dataset.action];
      if (fn) fn(el, ev);
    });
    root.addEventListener('mousedown', (ev) => {
      if (ev.target.closest('[data-fx-keep]')) { ev.preventDefault(); if (ev.target.closest('[data-action="fx-insert"]') || ev.target.closest('[data-action="fx-apply"]') || ev.target.closest('[data-action="toggle-fxref"]')) return; }
      const del = ev.target.closest('[data-spot-del]');
      if (del && S.spot) { ev.preventDefault(); ev.stopPropagation(); const t = S.templates.find((x) => x.id === del.dataset.spotDel); S.templates = S.templates.filter((x) => x.id !== del.dataset.spotDel); saveLS(); toast('Template deleted: ' + (t ? t.name : ''), 'warn'); renderSpotDD(); return; }
      const lay = ev.target.closest('[data-spot-layer]');
      if (lay && S.spot) { ev.preventDefault(); S.spot.layer = lay.dataset.spotLayer; S.spot.idx = 0; renderSpotDD(); return; }
      const it = ev.target.closest('[data-spot-pick]');
      if (!it) return;
      ev.preventDefault();
      spotPick(num(it.dataset.spotPick));
    });
    root.addEventListener('focusin', (ev) => { if (ev.target.dataset && ev.target.dataset.fx) S.fxPath = ev.target.dataset.bind; });
    root.addEventListener('focusout', (ev) => { const t = ev.target; if (t.dataset && t.dataset.fx) S.fxSel = [t.selectionStart, t.selectionEnd]; });
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
      if (el.dataset.embedScope) { S.embed.saveScope = el.value; return; }
      if (el.dataset.topcat) { setBlueprint(el.value); return; }
      if (el.dataset.condPick) {
        if (el.value) {
          setEntry(el.dataset.condPick, el.value === '__clear__' ? '' : el.value);
          el.value = '';
          renderAll();
        }
        return;
      }
      if (el.dataset.push) { if (el.value) { pushUndo(); getPath(S.entry, el.dataset.push).push(el.value); renderAll(); } return; }
      if (el.type === 'checkbox' || el.tagName === 'SELECT') handleBind(el, true);
    });
    root.addEventListener('keydown', (ev) => {
      const el = ev.target;
      if ((ev.ctrlKey || ev.metaKey) && !ev.altKey) {
        const kLow = String(ev.key || '').toLowerCase();
        if (kLow === 'z' && !ev.shiftKey) {
          if (S.history.past.length) { ev.preventDefault(); undoEntry(); }
          return;
        }
        if (kLow === 'y' || (kLow === 'z' && ev.shiftKey)) {
          if (S.history.future.length) { ev.preventDefault(); redoEntry(); }
          return;
        }
      }
      if (el.dataset && el.dataset.spotInput && S.spot) {
        const n = (S.spot.items || []).length;
        if (ev.key === 'ArrowDown') { ev.preventDefault(); S.spot.idx = n ? (S.spot.idx + 1) % n : 0; renderSpotDD(); return; }
        if (ev.key === 'ArrowUp') { ev.preventDefault(); S.spot.idx = n ? (S.spot.idx - 1 + n) % n : 0; renderSpotDD(); return; }
        if (ev.key === 'Enter') { ev.preventDefault(); spotPick(S.spot.idx); return; }
        if (ev.key === 'Escape') { ev.preventDefault(); S.spot = null; renderSpotDD(); el.blur(); return; }
        return;
      }
      if (ev.key === 'Escape' && IS_EMBED) {
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          ev.preventDefault();
          window.parent.postMessage({ type: 'crafter:close' }, '*');
        }
        return;
      }
      if (ev.key !== 'Enter' || !el.dataset || !el.dataset.enter) return;
      ev.preventDefault();
      const fn = ACT[el.dataset.enter];
      if (fn) fn(el, ev);
    });
    if (IS_EMBED && typeof window !== 'undefined') {
      window.addEventListener('message', (ev) => {
        const msg = ev && ev.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'crafter:loadEntry') {
          const ctx = (msg.context && typeof msg.context === 'object') ? msg.context : {};
          S.embed.context = ctx;
          if (Array.isArray(msg.homebrew)) {
            CAT.homebrew = msg.homebrew.filter((h) => h && h.id && h.name);
            mergeMasterDb(msg.homebrew.map((h) => h.raw || h));
          }
          const allowChar = ctx.allowCharacterScope !== false;
          S.embed.saveScope = allowChar ? (ctx.defaultScope || 'character') : 'campaign';
          if (msg.rawEntry && msg.rawEntry.schemaVersion !== 3) {
            const hydrated = hydrate(msg.rawEntry, ctx.kind);
            if (hydrated) {
              S.embed.originalId = msg.rawEntry.id || (msg.entry && msg.entry.id) || hydrated.id || '';
              loadEntry(hydrated, '');
              renderAll();
              return;
            }
          }
          if (msg.entry) {
            try {
              const en = fromCanonicalV3(msg.entry);
              S.embed.originalId = msg.entry.id || en.id || '';
              loadEntry(en, '');
            } catch (err) {
              toast('Could not load entry: ' + ((err && err.message) || 'invalid format'), 'err');
            }
          } else {
            const bp = (ctx.blueprint && BP_BY_ID[ctx.blueprint]) ? ctx.blueprint : 'feat';
            const en = scaffold(blankEntry(bp));
            S.embed.originalId = '';
            loadEntry(en, '');
          }
          renderAll();
        }
      });
    }
    window.addEventListener('scroll', () => { syncLiveScroll(false); }, { passive: true });
    window.addEventListener('resize', () => { measureLiveMetrics(); syncLiveScroll(false); }, { passive: true });
    // Start on a blank Homebrew feat; demo presets are opt-in from the Presets menu.
    loadEntry(scaffold(blankEntry('feat')), '');
    renderAll();
    bootCompendium();
    if (IS_EMBED && typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'crafter:ready' }, '*');
    }
  }
  function bootCompendium() {
    const C = window.SrdCompendium;
    const http = /^https?:$/.test(location.protocol);
    if (!C || typeof C.init !== 'function' || !http) return;
    C.init({ basePath: 'database', preloadAll: true }).then((ok) => {
      if (!ok) return false;
      return typeof C.ensureAllLoaded === 'function' ? C.ensureAllLoaded().then(() => true) : true;
    }).then((ok) => {
      if (!ok) return;
      try { mergeSrd(C); } catch (e) { console.warn('[ForgeSandbox] SRD merge skipped:', e && e.message); }
      return typeof C.loadMonsters === 'function'
        ? C.loadMonsters().then((mons) => { if (Array.isArray(mons)) { CAT.monsters = mons; CAT.srdCount += mons.length; } }).catch(() => {})
        : Promise.resolve();
    }).then(() => { if (CAT.srdLoaded) { toast('📚 SRD + Bestiary loaded: ' + CAT.srdCount.toLocaleString('en-US') + ' entries' + (CAT.customCount ? ' (+' + CAT.customCount + ' custom)' : '')); renderAll(); } })
      .catch((e) => console.warn('[ForgeSandbox] SrdCompendium unavailable:', e && e.message));
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }

  // Read-only QA hook (Lego Core V3 + V25 alias)
  const forgeApi = {
    state: S, catalog: CAT, chassisView: chassisView, hydrate: hydrate,
    exportEntry: exportEntry, exportBlock: exportBlock, fromCanonicalV3: fromCanonicalV3, fromCanonicalV25: fromCanonicalV3,
    statBlocksFromSrd: statBlocksFromSrd, neutralBlock: NEUTRAL_BLOCK, intentCatalog: INTENT_CATALOG,
    classifyConditionStatus: classifyConditionStatus, computeEntrySheetDiff: computeEntrySheetDiff, entryCoverageStats: entryCoverageStats,
    isPreservedEffectBlock: isPreservedEffectBlock, isUnstructuredBlock: isUnstructuredBlock,
    undoEntry: undoEntry, redoEntry: redoEntry, addPaletteBlock: addPaletteBlock, setEntry: setEntry,
    applyV3Patch: applyV3Patch, updateBlockField: updateBlockField,
    importFromJson: importFromJson, rawHeaderLine: rawHeaderLine, damageAtCL: rollAtCL,
    presets: PRESETS.map((p) => p.id), presetList: PRESETS, blueprints: BLUEPRINTS, blockTypes: BLOCK_TYPES, guideRecipes: GUIDE_RECIPES, spotConfigs: SPOT,
    setBlueprint: setBlueprint, renderAll: renderAll, renderScratch: renderScratch,
    loadPreset: (id) => ACT['load-preset']({ dataset: { id: id } }),
    act: (name, data) => {
      const el = typeof document !== 'undefined' ? document.createElement('div') : { dataset: {} };
      Object.keys(data || {}).forEach((k) => { el.dataset[k] = String(data[k]); });
      ACT[name](el, { target: el });
    }
  };
  if (typeof window !== 'undefined') window.ForgeSandbox = forgeApi;
  if (typeof module !== 'undefined' && module.exports) module.exports = forgeApi;
})();
