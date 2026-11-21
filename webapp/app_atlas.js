/**
 * Joyful-Fermi — Single-Source 0-Token App Atlas & Natural-Language Matcher (English-Only)
 *
 * Powers three consumers from one verified manifest:
 *   1. ai_assistant.js 0-token natural-language UI locator & instant runner
 *   2. Interactive User Guide modal ("Show me" + "Run Now")
 *   3. Auto-generated LLM APP_GUIDE_KNOWLEDGE prompt summary
 *
 * Every #id and [data-action="..."] selector in ENTRIES is statically verified
 * by Gate 6f in tools/verify_and_sync.js (no wildcard *= or ^= selectors).
 */
(function (root) {
  'use strict';

  const ENTRIES = [
    // =========================================================================
    // 1. CHARACTER SHEET — TOP HUD & VITALS
    // =========================================================================
    {
      key: 'hud.long_rest',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Long Rest (8-Hour Rest)',
      summary: 'Restores Hit Points, daily spell slots, Turn Undead / Domain uses, and clears short-duration buffs.',
      steps: [
        'Locate the Long Rest button in the top HUD bar (available from any tab).',
        'Click Long Rest to complete an 8-hour rest and reset daily resources.'
      ],
      keywords: ['long rest', 'rest', 'sleep', 'camp', 'overnight', 'full rest', 'reset daily', 'restore slots', 'recover spells', '8 hours'],
      aliases: ['how to long rest', 'take a long rest', 'refresh daily uses', 'reset spell slots'],
      selectors: ['[data-action="hud:long-rest"]'],
      runCommand: { command: 'long_rest', label: 'Run Long Rest' }
    },
    {
      key: 'hud.short_rest',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Short Rest / Encounter Recovery',
      summary: 'Recovers encounter-based abilities (such as Tome of Battle maneuvers and short-cooldown powers) without resetting daily slots.',
      steps: [
        'Locate the Short Rest button in the top HUD bar.',
        'Click Short Rest between encounters to refresh encounter powers.'
      ],
      keywords: ['short rest', 'recover', 'encounter', 'breather', 'refresh maneuvers'],
      aliases: ['how to short rest', 'take a short rest', 'between encounters'],
      selectors: ['[data-action="hud:short-rest"]'],
      runCommand: { command: 'short_rest', label: 'Run Short Rest' }
    },
    {
      key: 'hud.hp',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Hit Points, Damage, Healing & Temp HP',
      summary: 'Apply damage, heal Hit Points, or manage Temporary HP directly in the top HUD vitals bar.',
      steps: [
        'Enter a number in the HP input field and click Damage or Heal.',
        'Or type "hp -15", "hp +10", or "hp +12 temp" directly in Rule Master.'
      ],
      keywords: ['hp', 'hit points', 'health', 'damage', 'heal', 'healing', 'temp hp', 'temporary hp', 'wounded', 'dying'],
      aliases: ['take damage', 'heal hp', 'add temp hp', 'change hp'],
      selectors: ['#hp-adjust-input', '[data-action="hud:apply-damage"]', '[data-action="hud:apply-heal"]']
    },
    {
      key: 'hud.periodic_hp',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Periodic HP Effects (Bleed, Regeneration, Fast Healing)',
      summary: 'Track recurring per-round HP changes like Fast Healing, Regeneration, Bleed, or Poison that tick on Next Round.',
      steps: [
        'Click the Periodic HP button near the Hit Points bar.',
        'Pick a preset (Fast Healing, Bleed, Regeneration) or enter a custom per-round delta.'
      ],
      keywords: ['periodic', 'bleed', 'bleeding', 'regeneration', 'fast healing', 'poison', 'damage over time', 'dot'],
      aliases: ['add bleed', 'fast healing tracker', 'regen per round'],
      selectors: ['[data-action="hud:open-periodic-hp"]']
    },
    {
      key: 'hud.initiative',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Roll Initiative',
      summary: 'Rolls 1d20 + your derived Initiative modifier (Dexterity, Improved Initiative, and active buffs) with 3D dice.',
      steps: [
        'Click the Initiative badge in the top HUD bar to roll immediately.'
      ],
      keywords: ['initiative', 'init', 'turn order', 'start combat'],
      aliases: ['roll initiative', 'check initiative'],
      selectors: ['[data-action="hud:roll-initiative"]'],
      runCommand: { command: 'roll_init', label: 'Roll Initiative' }
    },
    {
      key: 'hud.saves',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Saving Throws (Fortitude, Reflex, Will)',
      summary: 'Click Fortitude, Reflex, or Will in the top HUD to roll a saving throw with full V3 stacking bonuses and situational notes.',
      steps: [
        'Click Fortitude, Reflex, or Will in the top HUD bar to roll the save.'
      ],
      keywords: ['save', 'saves', 'saving throw', 'fortitude', 'reflex', 'will', 'fort', 'ref'],
      aliases: ['roll fortitude', 'roll reflex', 'roll will', 'make a saving throw'],
      selectors: ['[data-action="hud:roll-save"]']
    },
    {
      key: 'hud.level_up',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Level Up / Character Progression',
      summary: 'Add a new class level (Base, Prestige, UA Variant, or Custom Class), roll HP, pick ability increases, and assign feats.',
      steps: [
        'Click the green Level Up button in the top header.',
        'Search for your class, choose HP roll/average, and pick any new feats or domains.'
      ],
      keywords: ['level up', 'level', 'class', 'prestige class', 'multiclass', 'progression', 'gain level'],
      aliases: ['add a level', 'how to level up', 'change class'],
      selectors: ['#btn-header-level-up', '[data-action="hud:open-level-up-modal"]'],
      runCommand: { command: 'open_level_up', label: 'Open Level Up' }
    },
    {
      key: 'hud.profile_identity',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Profile, Race, Size, Alignment, Deity & Templates',
      summary: 'Edit character name, Race, Templates (LA/ECL), Size, Alignment, Gender, and Deity / Faith.',
      steps: [
        'Click the character profile/race area in the top HUD header.',
        'Use the Spotlight pickers to change Race, add Templates, or set Deity and Alignment.'
      ],
      keywords: ['race', 'template', 'alignment', 'deity', 'faith', 'god', 'size', 'gender', 'profile', 'identity', 'name', 'la', 'ecl'],
      aliases: ['change race', 'add template', 'pick deity', 'edit profile'],
      selectors: ['[data-action="hud:open-profile-edit"]', '#core-race']
    },
    {
      key: 'hud.mode_toggle',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Play / Build / Both View Mode',
      summary: 'Switch between Play (clean table cockpit), Build (editing controls), or Both views at any time.',
      steps: [
        'Use the Play / Build / Both segmented switcher in the top header.'
      ],
      keywords: ['play mode', 'build mode', 'both mode', 'view mode', 'edit mode', 'layout toggle'],
      aliases: ['switch to play mode', 'switch to build mode'],
      selectors: ['#sheet-mode-toggle-group', '#btn-sheet-mode-play', '#btn-sheet-mode-build']
    },
    {
      key: 'hud.quest_notebook',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Quest Logs & Character Notebook',
      summary: 'Open the full Quest Logs modal with Tag Mindmap and AI Chronicler, synced bidirectionally with your Campaign Hub.',
      steps: [
        'Click the Quest Logs button in the top HUD bar.',
        'Create logs, add #quest/#npc/#location tags, or use AI Chronicler.'
      ],
      keywords: ['notes', 'quest logs', 'notebook', 'journal', 'chronicler', 'session notes', 'log'],
      aliases: ['open notes', 'take a note', 'where are my notes'],
      selectors: ['[data-action="hud:open-quest-notebook"]']
    },
    {
      key: 'hud.settings',
      page: 'sheet',
      tab: null,
      category: 'HUD & Vitals',
      label: 'Settings, Gemini API Key & Master DB',
      summary: 'Configure your Gemini BYOK API key, open Custom Entries / Rule Crafter, or manage character settings.',
      steps: [
        'Click the Settings gear button in the top HUD bar.',
        'Enter your Gemini API key or click Open Master DB / Rule Crafter.'
      ],
      keywords: ['settings', 'api key', 'gemini', 'config', 'options', 'preferences', 'master db'],
      aliases: ['set api key', 'open settings', 'where is api key'],
      selectors: ['[data-action="hud:open-settings-modal"]']
    },

    // =========================================================================
    // 2. CHARACTER SHEET — COMBAT COCKPIT (tab-combat)
    // =========================================================================
    {
      key: 'combat.next_round',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Next Round (Advance Turn & Buff Clocks)',
      summary: 'Advances combat by 1 round: decrements active buff durations, ticks periodic HP effects, resets action economy, and recharges cooldowns.',
      steps: [
        'Open the Combat Cockpit tab.',
        'Click Next Round (or type "nr" in Rule Master).'
      ],
      keywords: ['next round', 'end turn', 'new round', 'turn clock', 'advance round', 'tick buffs', 'nr'],
      aliases: ['pass turn', 'advance turn', 'decrease buff duration'],
      selectors: ['[data-action="combat:next-round"]'],
      runCommand: { command: 'next_round', label: 'Advance Next Round' }
    },
    {
      key: 'combat.action_economy',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Action Economy Tracker (Standard / Move / Swift / Immediate)',
      summary: 'Track spent Standard, Move, Swift, and Immediate actions during your turn; resets automatically on Next Round.',
      steps: [
        'In Combat Cockpit, toggle Standard, Move, Swift, or Immediate pills as you spend actions.'
      ],
      keywords: ['action economy', 'standard action', 'move action', 'swift action', 'immediate action', 'full round'],
      aliases: ['track actions', 'spend swift action'],
      selectors: ['#btn-action-std', '#btn-action-move', '#btn-action-swift', '#btn-action-immediate']
    },
    {
      key: 'combat.offense_mode',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Melee vs Ranged Offense Switch',
      summary: 'Toggle your combat attack panel between Melee weapons and Ranged weapons (with ammunition and range increments).',
      steps: [
        'In Combat Cockpit, click Melee or Ranged at the top of the Offense card.'
      ],
      keywords: ['melee', 'ranged', 'bow', 'archery', 'switch weapon mode', 'offense mode'],
      aliases: ['switch to ranged', 'switch to melee'],
      selectors: ['#btn-mode-melee', '#btn-mode-ranged']
    },
    {
      key: 'combat.offhand',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Off-Hand Weapon, Grip & Two-Weapon Fighting (TWF)',
      summary: 'Assign an Off-Hand weapon or Shield, switch One-Handed vs Two-Handed grip, and activate Two-Weapon Fighting penalties/bonuses.',
      steps: [
        'In Combat Cockpit, click Edit Sets on the Weapon Sets bar.',
        'Select your Off-Hand weapon and Grip (One-Handed, Two-Handed, or TWF).'
      ],
      keywords: ['offhand', 'off-hand', 'two-weapon fighting', 'twf', 'dual wield', 'grip', 'two handed', 'shield bash'],
      aliases: ['how to dual wield', 'equip offhand', 'change weapon grip', 'two weapon fighting'],
      beforeHighlight: 'openWeaponSetsEditor',
      selectors: ['#active-offhand-select', '#active-grip-select', '#btn-toggle-weapon-sets-edit']
    },
    {
      key: 'combat.weapons',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Weapon Sets & Quick Loadout',
      summary: 'Switch between saved Weapon Sets (e.g., Sword & Board, Greatsword, Longbow) in a single click.',
      steps: [
        'In Combat Cockpit, click a saved Weapon Set card or click Edit Sets to customize loadouts.'
      ],
      keywords: ['weapon sets', 'loadout', 'switch weapon', 'equip weapon', 'main hand'],
      aliases: ['change weapon', 'edit weapon sets'],
      selectors: ['#weapon-sets-cards-container', '#btn-toggle-weapon-sets-edit']
    },
    {
      key: 'combat.add_weapon',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Quick Add SRD Weapon or Shield',
      summary: 'Search the SRD compendium directly from Combat to add a weapon or shield to your sheet immediately.',
      steps: [
        'Click Add SRD Weapon in Combat Cockpit.',
        'Type the weapon name and click to add it (or use Item Forge in Inventory for magic enhancements).'
      ],
      keywords: ['add weapon', 'srd weapon', 'new weapon', 'add shield', 'weapon search'],
      aliases: ['buy a weapon', 'how to add a sword'],
      beforeHighlight: 'openSrdSpotlight',
      selectors: ['#srd-spotlight-input', '#btn-toggle-srd-spotlight']
    },
    {
      key: 'combat.attacks',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Attack, Full Attack & AoO Rolls',
      summary: 'Roll single attacks, iterative Full Attacks (BAB +6/+1, Haste, TWF), or Attacks of Opportunity with 3D dice and crit confirmation.',
      steps: [
        'In Combat Cockpit, click Attack, Full Attack, or AoO to roll with all active modifiers.'
      ],
      keywords: ['attack', 'full attack', 'aoo', 'attack of opportunity', 'roll attack', 'hit', 'damage roll', 'crit'],
      aliases: ['roll full attack', 'how to attack'],
      selectors: ['#attack-buttons-row-container', '[data-action="combat:roll-aoo"]']
    },
    {
      key: 'combat.power_attack',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Power Attack & Combat Expertise Sliders',
      summary: 'Dial Power Attack (trade attack bonus for 1:1 or 1:2 two-handed damage) or Combat Expertise (trade attack for Dodge AC).',
      steps: [
        'In Combat Cockpit, adjust the Power Attack or Combat Expertise controls before rolling.'
      ],
      keywords: ['power attack', 'combat expertise', 'trade bab', 'two handed damage'],
      aliases: ['use power attack', 'set combat expertise'],
      selectors: ['[data-action="combat:power-attack"]', '[data-action="combat:combat-expertise"]']
    },
    {
      key: 'combat.tactical_mods',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Tactical Modifiers & Activation Modes (Rage, Flank, Smite)',
      summary: 'Toggle situational combat modifiers (Flanking, Charge, High Ground) and class activation modes (Rage, Bardic Music, Smite, Stances).',
      steps: [
        'In Combat Cockpit, click any modifier or activation chip (click Show More to expand all modifiers).'
      ],
      keywords: ['tactical', 'modifiers', 'flanking', 'charge', 'rage', 'smite', 'bardic music', 'inspire courage', 'mode', 'activation'],
      aliases: ['turn on rage', 'toggle flanking', 'enable charge', 'class modes'],
      selectors: ['#btn-toggle-expand-mods', '#btn-toggle-expand-ranged-mods']
    },
    {
      key: 'combat.saved_profiles',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Saved Combat Profiles (Preset Buff/Mod Loadouts)',
      summary: 'Save your current combination of active buffs and tactical modifiers into a 1-click preset profile (e.g., "Boss Fight", "Stealth").',
      steps: [
        'Toggle your desired buffs and modifiers, then click the Save Profile icon in Combat Cockpit.'
      ],
      keywords: ['profile', 'combat profile', 'preset', 'saved loadout', 'buff preset'],
      aliases: ['save buff preset', 'combat presets'],
      selectors: ['#combat-profile-save-btn', '[data-action="combat:open-save-profile-modal"]']
    },
    {
      key: 'combat.buffs',
      page: 'sheet',
      tab: 'tab-defense',
      category: 'Defense & Buffs',
      label: 'Active Buffs & Defense Strip',
      summary: 'Add, toggle, pin, or edit spell/item buffs (Haste, Mage Armor, Divine Favor, Resist Energy) with automatic 3.5e bonus stacking.',
      steps: [
        'Open the Defense & Buffs tab (or click Add Buff).',
        'Pick a spell buff from Spotlight or type "buff: Haste" in Rule Master.'
      ],
      keywords: ['buff', 'buffs', 'add buff', 'haste', 'mage armor', 'shield of faith', 'resist energy', 'defense', 'ac', 'armor class', 'dr', 'sr'],
      aliases: ['how to add a buff', 'where are buffs', 'toggle buff', 'check armor class'],
      selectors: ['[data-action="combat:open-add-buff"]', '#buffs-view-grid-btn', '#tab-btn-defense']
    },
    {
      key: 'combat.shield_block',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Shield Block Reaction',
      summary: 'Trigger a Shield Block reaction from the Combat Defense controls.',
      steps: [
        'In Combat Cockpit, click the Shield Block reaction button when defending.'
      ],
      keywords: ['shield block', 'reaction', 'block'],
      aliases: ['use shield block'],
      selectors: ['[data-action="combat:shield-block-reaction"]']
    },
    {
      key: 'combat.spells',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Combat Spell Strip & Quick Cast',
      summary: 'Filter prepared/known spells by Offense, Control, or Support and cast them directly from Combat Cockpit with Save DC and attack rolls.',
      steps: [
        'In Combat Cockpit, switch Offense / Control / Support and click CAST (or type "cast: Fireball").'
      ],
      keywords: ['cast', 'cast spell', 'spell strip', 'offense spell', 'control spell', 'support spell', 'save dc'],
      aliases: ['how to cast a spell', 'quick cast'],
      selectors: ['#main-spell-cast-btn', '#btn-spell-tab-offense_spell']
    },
    {
      key: 'combat.companions',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Companion, Familiar, Special Mount & Wild Shape',
      summary: 'Manage Animal Companions, Familiars, Paladin Mounts, Fiendish Servants, and Druid Wild Shape forms from Combat Cockpit.',
      steps: [
        'In Combat Cockpit, expand the Companion card to roll companion attacks, track HP, or manage Wild Shape.'
      ],
      keywords: ['companion', 'animal companion', 'familiar', 'mount', 'fiendish servant', 'pet', 'wild shape', 'wildshape', 'alternate form', 'druid form'],
      aliases: ['add animal companion', 'how to wild shape', 'open familiar'],
      selectors: ['#btn-collapse-companion', '[data-action="combat:open-companion-modal"]', '[data-action="combat:open-wild-shape-modal"]']
    },
    {
      key: 'combat.pinned_skills',
      page: 'sheet',
      tab: 'tab-combat',
      category: 'Combat Cockpit',
      label: 'Pinned Combat Skills',
      summary: 'Quickly roll your most-used combat skills (Concentration, Tumble, Spot, Listen, Intimidate) without leaving Combat.',
      steps: [
        'In Combat Cockpit, click Show Pinned Skills to expand and roll pinned checks.'
      ],
      keywords: ['pinned skills', 'combat skills', 'tumble', 'concentration', 'spot', 'listen'],
      aliases: ['roll skill in combat'],
      selectors: ['#btn-toggle-expand-combat-skills']
    },

    // =========================================================================
    // 3. DEFENSE & DICE TABS (tab-defense, tab-dice)
    // =========================================================================
    {
      key: 'dice.tray',
      page: 'sheet',
      tab: 'tab-dice',
      category: 'Dice Tray',
      label: '3D Dice Tray & Custom Roll Formulas',
      summary: 'Roll polyhedral 3D dice pools (d4-d20), custom roll formulas (e.g. 8d6+4), save roll templates, and customize dice colors.',
      steps: [
        'Open the Dice Tray tab.',
        'Click dice buttons to build a pool or enter a custom formula and click ROLL DICE.'
      ],
      keywords: ['dice', 'dice tray', '3d dice', 'roll dice', 'custom roll', 'formula', 'd20', 'd6', 'dice color'],
      aliases: ['how to roll dice', 'change dice color', 'custom dice formula'],
      selectors: ['#tab-btn-dice', '#dice-roll-pool-btn', '#dice-color-btn']
    },

    // =========================================================================
    // 4. SPELLS, MANEUVERS & 9 DISCIPLINES (tab-spells)
    // =========================================================================
    {
      key: 'spells.manage',
      page: 'sheet',
      tab: 'tab-spells',
      category: 'Spells & Maneuvers',
      label: 'Spells, Maneuvers & 9-Discipline Command Center',
      summary: 'Manage Arcane, Divine, Spontaneous spells, Cleric Domains, Tome of Battle maneuvers, and 5 official 3.5e subsystems.',
      steps: [
        'Open the Spells & Maneuvers tab.',
        'Use the top discipline bar to switch between Arcane, Divine, Martial, and other subsystems.'
      ],
      keywords: ['spells', 'spellbook', 'prepared spells', 'known spells', 'divine spells', 'arcane', 'cleric domain', 'domains'],
      aliases: ['add a spell', 'prepare spells', 'manage spells', 'choose domain'],
      selectors: ['#tab-btn-spells', '#tab-spells']
    },
    {
      key: 'spells.slots',
      page: 'sheet',
      tab: 'tab-spells',
      category: 'Spells & Maneuvers',
      label: 'Manage Spell Slots & Restore All Spells',
      summary: 'Adjust daily spell slots per level or restore all expended spell slots in one click.',
      steps: [
        'In Spells & Maneuvers, click Manage Slots to customize quotas, or click Restore All to refill slots.'
      ],
      keywords: ['spell slots', 'restore spells', 'refill slots', 'daily slots', 'slots per day'],
      aliases: ['edit spell slots', 'restore all spell slots'],
      selectors: ['[data-action="spells:open-slots-modal"]', '[data-action="spells:restore-all"]']
    },
    {
      key: 'spells.maneuvers',
      page: 'sheet',
      tab: 'tab-spells',
      category: 'Spells & Maneuvers',
      label: 'Tome of Battle Maneuvers & Stances',
      summary: 'Learn martial maneuvers and stances, ready your encounter deck, and recover expended maneuvers.',
      steps: [
        'Open Spells & Maneuvers and select Martial Maneuvers.',
        'Pick known maneuvers/stances, toggle Readied, or click Recover All.'
      ],
      keywords: ['maneuver', 'maneuvers', 'stance', 'stances', 'tome of battle', 'warblade', 'crusader', 'swordsage', 'martial'],
      aliases: ['ready maneuvers', 'recover maneuvers', 'change stance'],
      selectors: ['[data-action="maneuver:open-picker"]', '[data-action="maneuver:recover-all"]']
    },
    {
      key: 'spells.subsystems',
      page: 'sheet',
      tab: 'tab-spells',
      category: 'Spells & Maneuvers',
      label: 'Other 5 Subsystems (Psionics, Binding, Incarnum, Shadow, Truenaming)',
      summary: 'Access Psionic Powers (PP), Pact Magic Vestiges, Incarnum Soulmelds & Essentia, Shadow Mysteries, and Truenaming Utterances.',
      steps: [
        'In Spells & Maneuvers, click Other Disciplines to open the 5 subsystem panels.'
      ],
      keywords: ['psionics', 'power points', 'binding', 'vestige', 'incarnum', 'soulmeld', 'essentia', 'shadow magic', 'mystery', 'truenaming', 'utterance', 'subsystems'],
      aliases: ['open psionics', 'bind vestige', 'shape soulmeld'],
      selectors: ['#btn-toggle-discipline-drawer']
    },

    // =========================================================================
    // 5. INVENTORY & GEAR (tab-inventory)
    // =========================================================================
    {
      key: 'inventory.gear',
      page: 'sheet',
      tab: 'tab-inventory',
      category: 'Inventory & Gear',
      label: 'Inventory, Body Slots & Companion Gear',
      summary: 'Equip magic items on body slots (Silhouette or List view), manage Companion Gear, and toggle Wilding Clasps.',
      steps: [
        'Open the Inventory & Gear tab.',
        'Switch between Silhouette View, List View, or Companion Gear.'
      ],
      keywords: ['inventory', 'gear', 'equipment', 'body slots', 'silhouette', 'armor', 'ring', 'amulet', 'belt', 'cloak', 'companion gear', 'wilding clasp'],
      aliases: ['equip armor', 'equip magic item', 'where is inventory'],
      selectors: ['#tab-btn-inventory', '#btn-body-view-silhouette', '#btn-body-view-list', '#btn-body-view-companion']
    },
    {
      key: 'inventory.add_item',
      page: 'sheet',
      tab: 'tab-inventory',
      category: 'Inventory & Gear',
      label: 'Add Item / Magic Item / Consumable & Item Forge',
      summary: 'Search the SRD + Magic Item Compendium to add gear, potions, wands, scrolls, or forge custom +1 to +10 magic weapons and armor.',
      steps: [
        'In Inventory & Gear, click Add Item to open the Compendium & Item Forge drawer.',
        'Pick a base item or switch to Item Forge to add enhancement bonuses, materials (Mithral, Adamantine), and MIC Augmentation Crystals.'
      ],
      keywords: ['add item', 'buy item', 'magic item', 'item forge', 'potion', 'scroll', 'wand', 'mithral', 'adamantine', 'crystal', 'enhancement', 'consumable'],
      aliases: ['how to add an item', 'forge magic weapon', 'add potion', 'add crystal'],
      selectors: ['[data-action="inventory:open-compendium-drawer"]', '#tab-btn-inventory']
    },

    // =========================================================================
    // 6. CHARACTER CORE, FEATS, SKILLS & CUSTOM RULES (tab-core, tab-database)
    // =========================================================================
    {
      key: 'core.feats_skills',
      page: 'sheet',
      tab: 'tab-core',
      category: 'Character & Core',
      label: 'Ability Scores, Feats & Level Progression Table',
      summary: 'View and edit Ability Scores, review all character Feats and Flaws, and inspect or edit your Level 1-20 progression rows.',
      steps: [
        'Open the Character & Logs tab.',
        'Use the Level Progression table to add/edit levels, or click Quick Feat Picker (or type "feat: Power Attack").'
      ],
      keywords: ['feats', 'feat', 'add feat', 'flaw', 'flaws', 'ability scores', 'str', 'dex', 'con', 'int', 'wis', 'cha', 'progression table'],
      aliases: ['how to add a feat', 'where are feats', 'edit ability scores', 'add flaw'],
      selectors: ['#tab-btn-core', '[data-action="prog:add-level-row"]']
    },
    {
      key: 'core.skills',
      page: 'sheet',
      tab: 'tab-core',
      category: 'Character & Core',
      label: 'Skills, Ranks, Filters & Custom Skills',
      summary: 'Allocate skill ranks, filter by Class Skills or Trained skills, roll skill checks, or add a Custom Skill.',
      steps: [
        'In Character & Logs, scroll to the Skills table.',
        'Filter by All / Class Skills / Trained, or click Add Custom Skill.'
      ],
      keywords: ['skills', 'skill ranks', 'class skills', 'trained', 'custom skill', 'roll skill', 'skill points'],
      aliases: ['spend skill points', 'add custom skill', 'where are skills'],
      selectors: ['#btn-skill-filter-all', '#btn-skill-filter-class', '#btn-skill-filter-trained', '#btn-open-custom-skill']
    },
    {
      key: 'settings.rule_crafter',
      page: 'sheet',
      tab: 'tab-database',
      category: 'Custom Rules & Homebrew',
      label: 'Rule Crafter & Custom V3 Homebrew Entries',
      summary: 'Create, edit, or parse custom 3.5e feats, spells, magic items, classes, buffs, and monsters using Pure V3 Rule Blocks or Craft with Rule Master.',
      steps: [
        'Open Settings -> Master DB / Rule Crafter (or type "craft: <name>" in Rule Master).',
        'Click Rule Crafter for visual V3 blocks, or Search / Free Text (AI) to craft automatically.'
      ],
      keywords: ['rule crafter', 'homebrew', 'custom rule', 'custom feat', 'custom spell', 'custom item', 'create rule', 'v3 blocks', 'master db', 'parse text'],
      aliases: ['how to make homebrew', 'open rule crafter', 'edit a feat', 'craft custom item'],
      selectors: ['#btn-inline-open-rule-crafter', '#btn-inline-ai-search', '#btn-mdb-export']
    },

    // =========================================================================
    // 7. CAMPAIGN HUB & QUEST LOGS (hub.html)
    // =========================================================================
    {
      key: 'hub.new_character',
      page: 'hub',
      tab: null,
      category: 'Campaign Hub',
      label: 'Create Character or Import Bestiary Monster',
      summary: 'Create a new PC sheet from a blank template or import any of 649 official D&D 3.5e Bestiary monsters/NPCs.',
      steps: [
        'Click New Character / Monster in the Hub header.',
        'Choose Blank Template (Manual) for a PC or Rule Master Bestiary to import an NPC/monster.'
      ],
      keywords: ['new character', 'create character', 'monster', 'bestiary', 'npc', 'import monster'],
      aliases: ['how to create a character', 'add a monster'],
      selectors: ['[data-action="hub:open-new-char"]']
    },
    {
      key: 'hub.view_mode',
      page: 'hub',
      tab: null,
      category: 'Campaign Hub',
      label: 'Card View vs DM Table View',
      summary: 'Switch between visual Party Cards and a compact DM Encounter Table for fast HP/Initiative tracking.',
      steps: [
        'Click Card View or DM Table in the Hub toolbar.'
      ],
      keywords: ['card view', 'dm table', 'party table', 'encounter view', 'view mode'],
      aliases: ['switch to dm table', 'party overview'],
      selectors: ['#view-mode-card-btn', '#view-mode-dm-btn']
    },
    {
      key: 'hub.campaigns',
      page: 'hub',
      tab: null,
      category: 'Campaign Hub',
      label: 'Campaigns & Multiplayer Invites',
      summary: 'Create or edit campaigns, organize sub-campaigns, and generate invite links/codes for your players.',
      steps: [
        'Use the Campaign buttons in the Hub header to create, edit, or invite players to your table.'
      ],
      keywords: ['campaign', 'invite', 'multiplayer', 'invite link', 'join campaign', 'players', 'party'],
      aliases: ['invite players', 'create campaign', 'share campaign'],
      selectors: ['[data-action="hub:open-invite"]', '[data-action="hub:open-new-campaign"]', '[data-action="hub:open-edit-campaign"]']
    },
    {
      key: 'hub.notes',
      page: 'hub',
      tab: null,
      category: 'Campaign Hub',
      label: 'Campaign Quest Logs, Tag Mindmap & Chronicler',
      summary: 'Write quick session notes, browse pinned logs, explore the relational Tag Mindmap, or run AI Chronicler synthesis.',
      steps: [
        'Use the inline Quest Logs panel on the right, or click Expand to open the full Quest Logs & Tag Mindmap modal.'
      ],
      keywords: ['notes', 'quest logs', 'mindmap', 'chronicler', 'session log', 'campaign notes', 'lore'],
      aliases: ['open campaign notes', 'where are quest logs', 'tag mindmap'],
      selectors: ['#hub-inline-notes-panel', '#hub-notes-tab-write', '[data-action="notes:open-modal"]']
    },
    {
      key: 'hub.dice_tray',
      page: 'hub',
      tab: null,
      category: 'Campaign Hub',
      label: 'Hub 3D Dice Tray & Custom Formulas',
      summary: 'Roll 3D dice pools or custom DM formulas directly from the Campaign Hub.',
      steps: [
        'Use the Custom Dice Tray card on the Hub or expand Custom Formula & Targeted Roll.'
      ],
      keywords: ['dice', 'dice tray', 'roll dice', 'formula', '3d dice'],
      aliases: ['roll dice in hub'],
      selectors: ['#hub-inline-dice-panel', '#hub-formula-drawer-toggle']
    },
    {
      key: 'hub.settings',
      page: 'hub',
      tab: null,
      category: 'Campaign Hub',
      label: 'Hub Settings, Skill Consolidation, API Key & Campaign Rule Crafter',
      summary: 'Configure Standard RAW (46 Skills) vs Consolidated Skills (7 Groups), set your Gemini API key, export campaign bundles, or open DM Rule Crafter.',
      steps: [
        'Click Settings in the Hub header for skill rules, API key, and bundle export, or click Rule Crafter for shared Campaign Packs.'
      ],
      keywords: ['settings', 'api key', 'skill consolidation', 'export', 'import', 'campaign pack', 'rule crafter'],
      aliases: ['hub settings', 'export campaign', 'consolidated skills'],
      selectors: ['[data-action="hub:open-settings"]', '[data-action="hub:open-rule-crafter"]']
    },

    // =========================================================================
    // 8. RULE CRAFTER STUDIO (forge_sandbox.html)
    // =========================================================================
    {
      key: 'crafter.blocks',
      page: 'crafter',
      tab: null,
      category: 'Rule Crafter',
      label: 'Add, Wrap & Reorder V3 Rule Blocks',
      summary: 'Snap together Pure V3 mechanical blocks (Stat, Roll, Attack, Defense, Resource, Modes, Powers) and wrap conditional branches with When.',
      steps: [
        'Pick a blueprint at the top, then click block pills in the palette to add or wrap rules.'
      ],
      keywords: ['blocks', 'rule blocks', 'add block', 'when', 'condition', 'modes', 'powers', 'v3'],
      aliases: ['how to add a block', 'conditional bonus'],
      selectors: ['[data-action="add-block"]', '[data-action="wrap-block-when"]', '[data-action="add-mode"]']
    },
    {
      key: 'crafter.undo_redo',
      page: 'crafter',
      tab: null,
      category: 'Rule Crafter',
      label: 'Undo / Redo & Live Character Diff Preview',
      summary: 'Step backward/forward through up to 50 edits and preview live deriveSheet stat changes before saving.',
      steps: [
        'Use Undo / Redo in the toolbar or toggle Live Preview to inspect real stat changes.'
      ],
      keywords: ['undo', 'redo', 'preview', 'live preview', 'diff', 'test rule'],
      aliases: ['preview rule changes', 'undo edit'],
      selectors: ['[data-action="undo"]', '[data-action="redo"]', '[data-action="toggle-live"]']
    },
    {
      key: 'crafter.examples_json',
      page: 'crafter',
      tab: null,
      category: 'Rule Crafter',
      label: 'Examples Library & JSON Import / Copy',
      summary: 'Load official 3.5e V3 rule examples as templates, or import/copy raw V3 JSON directly.',
      steps: [
        'Click Examples to browse ready-made V3 patterns, or Import JSON / Copy JSON in the toolbar.'
      ],
      keywords: ['examples', 'templates', 'json', 'import json', 'copy json', 'guide'],
      aliases: ['show rule examples', 'export json'],
      selectors: ['[data-action="toggle-guide"]', '[data-action="toggle-import-json"]', '[data-action="copy-json"]']
    }
  ];

  // ---------------------------------------------------------------------------
  // 0-Token English Natural-Language Matcher (Zero LLM calls, <1ms)
  // ---------------------------------------------------------------------------
  const STOPWORDS = new Set([
    'a', 'an', 'the', 'how', 'do', 'does', 'did', 'i', 'we', 'you', 'my', 'our',
    'where', 'is', 'are', 'was', 'can', 'could', 'should', 'would', 'to', 'in',
    'on', 'at', 'of', 'for', 'with', 'from', 'by', 'it', 'this', 'that', 'me',
    'show', 'find', 'open', 'go', 'get', 'make', 'button', 'menu', 'panel',
    'tab', 'screen', 'section', 'please', 'help', 'what', 'which'
  ]);

  const SYNONYM_MAP = {
    'sleep': 'long rest',
    'camp': 'long rest',
    'overnight': 'long rest',
    'breather': 'short rest',
    'dual': 'offhand',
    'twf': 'offhand',
    'wield': 'offhand',
    'health': 'hp',
    'wounded': 'hp',
    'hurt': 'hp',
    'dying': 'hp',
    'init': 'initiative',
    'fort': 'fortitude',
    'ref': 'reflex',
    'wildshape': 'wild shape',
    'shapeshift': 'wild shape',
    'pet': 'companion',
    'animal': 'companion',
    'ac': 'buff',
    'armor': 'inventory',
    'gear': 'inventory',
    'bag': 'inventory',
    'backpack': 'inventory',
    'homebrew': 'rule crafter',
    'custom': 'rule crafter',
    'journal': 'notes',
    'diary': 'notes',
    'lore': 'notes',
    'roll': 'dice',
    'god': 'deity',
    'faith': 'deity',
    'multiclass': 'level up',
    'prestige': 'level up'
  };

  function _stem(word) {
    let w = word;
    if (w.length > 4 && w.endsWith('ing')) w = w.slice(0, -3);
    else if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
    else if (w.length > 3 && w.endsWith('es')) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
    return w;
  }

  function _tokenize(text) {
    const clean = String(text || '').toLowerCase().replace(/[^a-z0-9+#\-\s]/g, ' ').trim();
    if (!clean) return { raw: '', tokens: [], expanded: [] };
    const rawTokens = clean.split(/\s+/).filter(Boolean);
    const tokens = [];
    for (const t of rawTokens) {
      if (STOPWORDS.has(t)) continue;
      tokens.push(t);
    }
    const expanded = new Set();
    for (const t of tokens) {
      expanded.add(t);
      const st = _stem(t);
      if (st.length >= 2) expanded.add(st);
      if (SYNONYM_MAP[t]) {
        SYNONYM_MAP[t].split(/\s+/).forEach(x => expanded.add(x));
      } else if (SYNONYM_MAP[st]) {
        SYNONYM_MAP[st].split(/\s+/).forEach(x => expanded.add(x));
      }
    }
    return { raw: clean, tokens, expanded: [...expanded] };
  }

  function _editDist1(a, b) {
    if (a === b) return true;
    const la = a.length;
    const lb = b.length;
    if (Math.abs(la - lb) > 1 || Math.min(la, lb) < 4) return false;
    let i = 0, j = 0, diff = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; }
      else {
        diff++;
        if (diff > 1) return false;
        if (la > lb) i++;
        else if (lb > la) j++;
        else { i++; j++; }
      }
    }
    return true;
  }

  function getByKey(key) {
    return ENTRIES.find(e => e.key === key) || null;
  }

  function getForPage(pageType) {
    if (!pageType || pageType === 'all') return ENTRIES.slice();
    return ENTRIES.filter(e => e.page === pageType);
  }

  function matchQuery(rawQuery, pageType, limit = 5) {
    const { raw, tokens, expanded } = _tokenize(rawQuery);
    if (!raw || expanded.length === 0) return [];

    const scored = [];
    for (const entry of ENTRIES) {
      const samePage = !pageType || pageType === 'all' || entry.page === pageType;
      const labelLow = entry.label.toLowerCase();
      const summaryLow = entry.summary.toLowerCase();
      const keyLow = entry.key.toLowerCase();
      const kws = (entry.keywords || []).map(k => k.toLowerCase());
      const als = (entry.aliases || []).map(a => a.toLowerCase());

      let score = 0;

      // Exact phrase boosts
      if (als.some(a => raw.includes(a) || a.includes(raw))) score += 42;
      if (kws.some(k => k.includes(' ') && raw.includes(k))) score += 36;
      if (labelLow.includes(raw) && raw.length >= 3) score += 30;
      if (keyLow.includes(raw) && raw.length >= 3) score += 24;

      // Token-level weighted matching
      let matchedTokens = 0;
      for (const tok of expanded) {
        if (tok.length < 2) continue;
        let tokBest = 0;
        for (const k of kws) {
          if (k === tok) tokBest = Math.max(tokBest, 22);
          else if (k.split(/\s+/).some(p => p === tok || _stem(p) === tok)) tokBest = Math.max(tokBest, 18);
          else if (k.includes(tok) && tok.length >= 3) tokBest = Math.max(tokBest, 12);
          else if (_editDist1(k, tok)) tokBest = Math.max(tokBest, 10);
        }
        if (labelLow.includes(tok)) tokBest = Math.max(tokBest, 14);
        else if (summaryLow.includes(tok) && tok.length >= 3) tokBest = Math.max(tokBest, 6);

        if (tokBest > 0) {
          score += tokBest;
          matchedTokens++;
        }
      }

      if (score <= 0) continue;
      if (samePage) score += 6;
      else score = Math.max(1, score - 12);

      // High-confidence threshold: resolves naturally without spending LLM tokens
      const confident = samePage && (score >= 28 || (score >= 22 && matchedTokens >= 1 && tokens.length <= 4));
      scored.push({ entry, score, confident, samePage });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  function buildPromptSummary(pageType) {
    const list = getForPage(pageType);
    return list.map(e => `${e.key} (${e.tab || e.page}): ${e.label} — ${e.summary}`).join('\n');
  }

  const api = {
    ENTRIES,
    getByKey,
    getForPage,
    matchQuery,
    buildPromptSummary
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AppAtlas = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
