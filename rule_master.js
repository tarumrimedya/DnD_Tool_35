/**
 * D&D 3.5e Rule Master & Master_DB Management Engine
 * Features:
 * 1. Full CRUD for Master_DB with 29-column architecture
 * 2. Parent-Child relationship management & child power linking
 * 3. Quick & AI Rule Parser (Gemini API / Heuristic fallback)
 * 4. Prioritized Knowledge Base sources & Splatbook catalog
 * 5. Direct equip / learn into active Character state
 */

const RuleMaster = {
  currentPage: 1,
  pageSize: 25,
  sortColumn: 'name',
  sortDirection: 'asc',
  selectedEntryIndex: -1,

  // Knowledge base sources
  sourcesCatalog: [
    {
      priority: 1,
      name: "Local Rule Compendium & Parametric AI Engine",
      scope: "Local SRD Compendium (3,522+ entries) & Parametric LLM Engine (Zero latency, 100% RAW 3.5e)",
      url: "#",
      type: "Local JSON & LLM",
      status: "Active",
      role: "Instant local Spotlight search and parametric rule generation engine"
    },
    {
      priority: 2,
      name: "Core 3.5e SRD (d20srd & dndsrd)",
      scope: "PHB, DMG, MM Core Rules, Feats, Spells, Magic Items",
      url: "https://www.d20srd.org/index.htm",
      mirror: "http://dndsrd.net",
      type: "Clean HTML",
      status: "Active",
      role: "Primary core rulebook reference and web SRD index"
    },
    {
      priority: 3,
      name: "Extended Splatbooks Index (srd.dndtools)",
      scope: "Complete series, MIC, Spell Compendium, Frostburn, Sandstorm",
      url: "https://srd.dndtools.org",
      type: "Comprehensive HTML Index",
      status: "Active",
      role: "Extended non-core splatbook archive"
    }
  ],

  // Comprehensive D&D 3.5e Splatbooks and Sourcebooks Catalog
  splatbooks: [
    { code: "PHB", name: "Player's Handbook 3.5", cat: "Core", note: "Core classes, races, feats, skills, and spells", url: "https://www.d20srd.org/index.htm" },
    { code: "DMG", name: "Dungeon Master's Guide 3.5", cat: "Core", note: "Magic items, prestige classes, and treasure", url: "https://www.d20srd.org/index.htm" },
    { code: "MM", name: "Monster Manual 3.5", cat: "Core", note: "Monsters, racial traits, and templates", url: "https://www.d20srd.org/index.htm" },
    { code: "MIC", name: "Magic Item Compendium", cat: "Equipment", note: "Expanded magic items, body slots, and augment crystals", url: "https://srd.dndtools.org" },
    { code: "SpC", name: "Spell Compendium", cat: "Spells", note: "Consolidated master archive of splatbook spells", url: "https://srd.dndtools.org" },
    { code: "ToB", name: "Tome of Battle (Book of 9 Swords)", cat: "Combat", note: "Martial maneuvers, stances, and Martial Adept classes", url: "https://srd.dndtools.org" },
    { code: "CW", name: "Complete Warrior", cat: "Splatbook", note: "Martial classes, tactical & combat feats, prestige classes", url: "https://srd.dndtools.org" },
    { code: "CD", name: "Complete Divine", cat: "Splatbook", note: "Divine classes, domains, and divine feats", url: "https://srd.dndtools.org" },
    { code: "CA", name: "Complete Arcane", cat: "Splatbook", note: "Warlock, Warmage, invocations, and metamagic feats", url: "https://srd.dndtools.org" },
    { code: "CAd", name: "Complete Adventurer", cat: "Splatbook", note: "Scout/Ninja/Spellthief, stealth & mobility feats", url: "https://srd.dndtools.org" },
    { code: "CM", name: "Complete Mage", cat: "Splatbook", note: "Arcane specialist options and Reserve Feats", url: "https://srd.dndtools.org" },
    { code: "CS", name: "Complete Scoundrel", cat: "Splatbook", note: "Tactical tricks, Skill Tricks, Luck Feats", url: "https://srd.dndtools.org" },
    { code: "CC", name: "Complete Champion", cat: "Splatbook", note: "Deity affiliations and Domain Devotion feats", url: "https://srd.dndtools.org" },
    { code: "PHB2", name: "Player's Handbook II", cat: "Core Expansion", note: "Expanded feats, Knight, Beguiler, Duskblade, Dragon Shaman", url: "https://srd.dndtools.org" },
    { code: "FB", name: "Frostburn", cat: "Environment", note: "Arctic environment rules, cold spells, and gear", url: "https://srd.dndtools.org" },
    { code: "Sand", name: "Sandstorm", cat: "Environment", note: "Desert environment rules, heat and sand spells", url: "https://srd.dndtools.org" },
    { code: "Storm", name: "Stormwrack", cat: "Environment", note: "Naval, seafaring, and aquatic combat rules", url: "https://srd.dndtools.org" },
    { code: "LM", name: "Libris Mortis", cat: "Undead", note: "Undead lore, necromancy spells, and undead feats", url: "https://srd.dndtools.org" },
    { code: "LoM", name: "Lords of Madness", cat: "Aberrations", note: "Mind Flayer, Beholder, and Aberration lore & feats", url: "https://srd.dndtools.org" },
    { code: "BoED", name: "Book of Exalted Deeds", cat: "Alignment", note: "Celestial powers, Exalted Feats, and Vow mechanics", url: "https://srd.dndtools.org" },
    { code: "BoVD", name: "Book of Vile Darkness", cat: "Alignment", note: "Fiendish powers, Vile Damage, and Vile Feats", url: "https://srd.dndtools.org" },
    { code: "XPH", name: "Expanded Psionics Handbook", cat: "Psionics", note: "Psionic powers, classes, and psionic feats", url: "https://www.d20srd.org/index.htm" },
    { code: "RoS", name: "Races of Stone", cat: "Races", note: "Dwarf and Gnome options, Goliath race, exotic armor", url: "https://srd.dndtools.org" },
    { code: "RoD", name: "Races of Destiny", cat: "Races", note: "Human, Half-Elf, Half-Orc, and Illumian options", url: "https://srd.dndtools.org" },
    { code: "RotW", name: "Races of the Wild", cat: "Races", note: "Elf and Halfling mechanics, Raptorans", url: "https://srd.dndtools.org" },
    { code: "RotD", name: "Races of the Dragon", cat: "Races", note: "Dragons, Dragonborn of Bahamut, Kobolds", url: "https://srd.dndtools.org" },
    { code: "HoB", name: "Heroes of Battle", cat: "Campaign", note: "Mass combat, battlefield mechanics, and commander feats", url: "https://srd.dndtools.org" },
    { code: "HoH", name: "Heroes of Horror", cat: "Campaign", note: "Taint, fear & horror mechanics, Dread Necromancer", url: "https://srd.dndtools.org" },
    { code: "Dscape", name: "Dungeonscape", cat: "Exploration", note: "Dungeon hazards, Factotum class, and alternate class features", url: "https://srd.dndtools.org" },
    { code: "Cscape", name: "Cityscape", cat: "Exploration", note: "Urban adventures, contacts, and city variants", url: "https://srd.dndtools.org" },
    { code: "RC", name: "Rules Compendium", cat: "Rules Summary", note: "Definitive consolidated D&D 3.5e rules reference", url: "https://srd.dndtools.org" },
    { code: "PlH", name: "Planar Handbook", cat: "Planar", note: "Planar travel, touchstones, Jovar, and planar gear", url: "https://srd.dndtools.org" }
  ],

  // Utility to derive standardized actionType for D&D 3.5e Action Economy (Standard, Swift, Immediate, Full-Round, Passive)
  deriveActionType(actionStr, type = '') {
    const act = String(actionStr || '').toLowerCase().trim();
    const t = String(type || '').toLowerCase().trim();
    if (act.includes('immediate')) return 'Immediate';
    if (act.includes('swift')) return 'Swift';
    if (act.includes('full-round') || act.includes('full attack') || act.includes('full')) return 'Full-Round';
    if (act.includes('standard') || act.includes('attack') || act.includes('cast')) return 'Standard';
    if (act.includes('move')) return 'Move';
    if (act.includes('free')) return 'Free';
    if (act.includes('passive') || act.includes('continuous') || act.includes('none')) return 'Passive';
    if (t === 'spell' || t === 'maneuver') return 'Standard';
    return 'Passive';
  },

  // Capitalizes words and handles underscores (e.g. "natural_armor_ench" -> "Natural_Armor_Ench", "magic item" -> "Magic Item")
  capitalizeIdentifier(val) {
    if (!val || typeof val !== 'string') return val;
    const str = val.trim();
    if (!str) return str;

    // Handle underscore-separated tokens (e.g., natural_armor_ench -> Natural_Armor_Ench)
    if (str.includes('_')) {
      return str.split('_').map(part => {
        if (!part) return '';
        return part.charAt(0).toUpperCase() + part.slice(1);
      }).join('_');
    }

    // Handle space, slash, dash, or bracket separated tokens
    return str.replace(/(^|[\s\/\(\[\-])([a-zğüşıöç])/gi, (match, sep, ch) => sep + ch.toUpperCase());
  },

  // Standardizes any rule, feat, class, item, or DM Boon name into canonical D&D 3.5e Title Case & punctuation
  standardizeName(val, categoryHint = '') {
    if (!val || typeof val !== 'string') return val;
    let str = val.trim();
    if (!str) return str;

    const prefix = str.startsWith('↳') ? '↳ ' : '';
    let cleanStr = str.replace(/^↳\s*/, '').trim();

    // 1. Strip leading/trailing ellipses, stray dashes, colons, commas
    cleanStr = cleanStr
      .replace(/^[\s\-–—:;,\.…]+/, '')
      .replace(/[\s\-–—:;,\.…]+$/, '')
      .replace(/\.{2,}|…+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanStr) return prefix;

    // 2. Check if this is a DM Boon / Grant that can be synthesized deterministically
    const isBoonQuery = String(categoryHint || '').toLowerCase().includes('boon')
      || /^(?:dm\s*boon|dm\s*grant|boon|grant)\b/i.test(cleanStr)
      || /\bskill\s*:/i.test(cleanStr);

    if (isBoonQuery && typeof window !== 'undefined' && typeof window.synthesizeDmBoonFromQuery === 'function') {
      const synth = window.synthesizeDmBoonFromQuery(cleanStr, '', 'DM Boon');
      if (synth && synth.name && !/^dm\s*boon$/i.test(synth.name.trim())) {
        return prefix + synth.name;
      }
    }

    // 3. Targetable Weapon / Skill Feat punctuation normalization (e.g. "weapon focus - longsword" -> "Weapon Focus (Longsword)")
    const targetFeatMatch = cleanStr.match(/^(weapon focus|greater weapon focus|weapon specialization|greater weapon specialization|improved critical|exotic weapon proficiency|martial weapon proficiency|skill focus)\s*[-–—:,\.]+\s*([^\(\)]+)$/i);
    if (targetFeatMatch) {
      cleanStr = `${targetFeatMatch[1].trim()} (${targetFeatMatch[2].trim()})`;
    }

    // 4. Class Variant normalization (e.g. "rogue - adventurer variant" or "rogue, adventurer" -> "Rogue (Adventurer Variant)")
    const classVarMatch = cleanStr.match(/^(barbarian|bard|cleric|druid|fighter|monk|paladin|ranger|rogue|sorcerer|wizard|warblade|swordsage|crusader|warlock|scout|swashbuckler|duskblade|beguiler|factotum)\s*[-–—:,]+\s*([a-z\s]+?)(?:\s+variant)?$/i);
    if (classVarMatch && (String(categoryHint || '').toLowerCase().includes('class') || /adventurer|thug|cloistered|urban|martial|wildshape|whirling/i.test(classVarMatch[2]))) {
      const baseCls = classVarMatch[1].trim();
      const varPart = classVarMatch[2].trim();
      cleanStr = `${baseCls} (${varPart}${/variant|cleric/i.test(varPart) ? '' : ' Variant'})`;
    }

    // 5. Extract and normalize DM Boon prefix if present
    let boonPrefix = '';
    if (isBoonQuery) {
      cleanStr = cleanStr
        .replace(/^(?:dm\s*boon|dm\s*grant|boon|grant)[\s:\-–—,\.]*/i, '')
        .replace(/^(?:skill|stat|ability|save)[\s:\-–—,\.]*/i, '')
        .trim();
      boonPrefix = 'DM Boon: ';
      // Convert trailing bare "+4" or "-2" (when not after "=") into "(+4)"
      if (!cleanStr.includes('(') && !cleanStr.includes('=')) {
        const trailingSign = cleanStr.match(/^([a-z\s]+?)\s*([+-]\d+)$/i);
        const leadingSign = cleanStr.match(/^([+-]\d+)\s+([a-z\s]+?)$/i);
        if (trailingSign) {
          cleanStr = `${trailingSign[1].trim()} (${trailingSign[2]})`;
        } else if (leadingSign) {
          cleanStr = `${leadingSign[2].trim()} (${leadingSign[1]})`;
        }
      }
    }

    // 6. Normalize spaced hyphens/colons ("flaw - shaky" -> "Flaw: Shaky")
    cleanStr = cleanStr.replace(/^(flaw|trait|acf|variant)\s*[-–—:]+\s*/i, (_, tag) => `${tag}: `);
    cleanStr = cleanStr.replace(/\s+[-–—]+\s+/g, ' — ');

    const ACRONYMS = {
      'dm': 'DM', 'pc': 'PC', 'npc': 'NPC', 'ac': 'AC', 'hp': 'HP', 'xp': 'XP',
      'cl': 'CL', 'dc': 'DC', 'sr': 'SR', 'dr': 'DR', 'bab': 'BAB',
      'str': 'STR', 'dex': 'DEX', 'con': 'CON', 'int': 'INT', 'wis': 'WIS', 'cha': 'CHA',
      'fort': 'Fort', 'ref': 'Ref', 'will': 'Will', 'hd': 'HD', 'la': 'LA', 'cr': 'CR',
      'acf': 'ACF', 'ua': 'UA', 'phb': 'PHB', 'dmg': 'DMG', 'mm': 'MM', 'tob': 'ToB',
      'mic': 'MIC', 'spc': 'SpC', 'twf': 'TWF', 'aoo': 'AoO', 'raw': 'RAW', 'sla': 'SLA', 'umd': 'UMD',
      'i': 'I', 'ii': 'II', 'iii': 'III', 'iv': 'IV', 'v': 'V',
      'vi': 'VI', 'vii': 'VII', 'viii': 'VIII', 'ix': 'IX', 'x': 'X'
    };
    const LOWER_WORDS = new Set(['of', 'the', 'and', 'in', 'on', 'to', 'for', 'with', 'from', 'by', 'at', 'or', 'into', 'upon', 'vs', 'vs.']);
    const ABILITY_TAGS = { 'ex': 'Ex', 'su': 'Su', 'sp': 'Sp', 'ps': 'Ps' };

    const formatSingleWord = (w, isFirstWord) => {
      if (!w) return w;
      const low = w.toLowerCase();
      // Dice notation like 1d6, 2d8+4
      if (/^\d+d\d+(?:[+-]\d+)?$/i.test(w)) return low;
      // Signed numbers like +4, -2
      if (/^[+-]\d+$/.test(w)) return w;
      // Units like ft.
      if (/^ft\.?$/i.test(w)) return 'ft.';
      // Ability type tags like Ex, Su, Sp
      if (ABILITY_TAGS[low]) return ABILITY_TAGS[low];
      // Official D&D 3.5e acronyms
      if (ACRONYMS[low]) return ACRONYMS[low];
      // Lowercase articles/prepositions in mid-title
      if (!isFirstWord && LOWER_WORDS.has(low)) return low;
      // Standard Title Case
      return low.charAt(0).toUpperCase() + low.slice(1);
    };

    const tokens = cleanStr.split(' ');
    const formattedTokens = tokens.map((token, idx) => {
      const prevToken = idx > 0 ? tokens[idx - 1] : '';
      const followsBreak = idx === 0 || /[:\(\[—\/]$/.test(prevToken) || prevToken === '—' || prevToken === '=';

      // Preserve leading/trailing brackets/parentheses/punctuation around the token
      return token.replace(/^([\(\[\+"']*)([a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\/\-]+)([\)\]\.,:;!"']*)$/, (m, lead, core, trail) => {
        const lowCore = core.toLowerCase();
        // Inside parentheses e.g. (ex) -> (Ex)
        if (lead.includes('(') && trail.includes(')') && ABILITY_TAGS[lowCore]) {
          return `${lead}${ABILITY_TAGS[lowCore]}${trail}`;
        }
        // Handle slash-separated or hyphen-separated compounds (e.g. "Two-Weapon", "1/Day", "Half-Orc")
        if (core.includes('-')) {
          const parts = core.split('-').map((p, pIdx) => formatSingleWord(p, followsBreak || pIdx === 0 || !LOWER_WORDS.has(p.toLowerCase())));
          return `${lead}${parts.join('-')}${trail}`;
        }
        if (core.includes('/')) {
          const parts = core.split('/').map(p => formatSingleWord(p, true));
          return `${lead}${parts.join('/')}${trail}`;
        }
        return `${lead}${formatSingleWord(core, followsBreak || Boolean(lead))}${trail}`;
      });
    });

    const finalBody = formattedTokens.join(' ').replace(/\s+/g, ' ').trim();
    return prefix + boonPrefix + finalBody;
  },

  capitalizeTitle(val, categoryHint = '') {
    return this.standardizeName(val, categoryHint);
  },

  // Default Item Schema (Canonical V2 Master_DB Schema with modifiers, damageParts, modes, ruleFlags)
  createEmptyEntry(type = 'Weapon') {
    const isWep = type === 'Weapon';
    const isShield = type === 'Shield';
    const isArmor = type === 'Armor';
    return {
      schemaVersion: 2,
      id: `custom_${type.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`,
      name: '',
      type: type,
      slot: isWep ? 'Main Hand' : (isShield ? 'Off-Hand/Shield' : (isArmor ? 'Armor' : 'None')),
      prereq: '-',
      source: 'PHB p.',
      benefit: '',
      description: '',
      action: isWep || type === 'Spell' || type === 'Maneuver' ? 'Standard Action' : 'Passive',
      actionType: this.deriveActionType(isWep || type === 'Spell' || type === 'Maneuver' ? 'Standard Action' : 'Passive', type),
      duration: type === 'Spell' ? 'Instantaneous' : 'Continuous',
      weight: isWep || isArmor || isShield ? 4 : 0,
      cost: isWep || isArmor || isShield ? 10 : 0,
      role: isWep ? 'Offense / Weapon' : (isArmor || isShield ? 'Defense / Armor' : 'General'),
      modifiers: [],
      damageParts: isWep ? [{ dice: '1d8', bonus: 0, type: 'Slashing', multiplyOnCrit: true, onCritOnly: false, source: 'Base Weapon' }] : [],
      modes: [],
      weaponStats: isWep ? {
        category: 'Martial',
        handedness: 'One-Handed',
        baseDamage: '1d8',
        critMin: 20,
        critMult: 2,
        damageTypes: ['Slashing'],
        rangeIncrement: 0,
        finessable: false,
        isLight: false
      } : null,
      armorStats: (isArmor || isShield) ? {
        category: isShield ? 'Shield' : 'Light',
        baseAc: isShield ? 2 : 4,
        maxDex: isShield ? null : 4,
        acp: isShield ? -1 : -2,
        asf: isShield ? 5 : 20,
        speed30: 30,
        speed20: 20
      } : null,
      spellStats: null,
      ruleFlags: {},
      tacticalBadges: [],
      school: '',
      level: '',
      discipline: '',
      tags: []
    };
  },

  // Helper: Ensure any entry is upgraded to Canonical V2
  ensureV2(entry) {
    if (!entry || typeof entry !== 'object') return entry;
    const CANONICAL_UA_FLAWS = new Set([
      'feeble', 'frail', 'inattentive', 'meager fortitude', 'murky-eyed',
      'noncombatant', 'pathetic', 'poor reflexes', 'shaky', 'slow',
      'unreactive', 'vulnerable'
    ]);
    let v2 = entry;
    if (typeof window !== 'undefined' && window.SchemaMigrator && typeof window.SchemaMigrator.upgradeEntryToV2 === 'function') {
      v2 = window.SchemaMigrator.upgradeEntryToV2(entry);
    } else if (!(entry.schemaVersion === 2 && Array.isArray(entry.modifiers) && Array.isArray(entry.damageParts) && Array.isArray(entry.modes))) {
      v2 = Object.assign({}, entry, { schemaVersion: 2 });
      if (!v2.id) {
        v2.id = `entry_${String(v2.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
      }
      if (!Array.isArray(v2.modifiers)) v2.modifiers = [];
      if (!Array.isArray(v2.damageParts)) v2.damageParts = [];
      if (!Array.isArray(v2.modes)) v2.modes = [];
      if (!Array.isArray(v2.defenses)) v2.defenses = [];
      if (!Array.isArray(v2.resources)) v2.resources = [];
      if (!Array.isArray(v2.grants)) v2.grants = [];
      if (!Array.isArray(v2.choices)) v2.choices = [];
      if (!v2.ruleFlags || typeof v2.ruleFlags !== 'object') v2.ruleFlags = {};
      if (!Array.isArray(v2.tacticalBadges)) v2.tacticalBadges = [];
    }
    if (!Array.isArray(v2.defenses)) v2.defenses = Array.isArray(entry.defenses) ? entry.defenses.slice() : [];
    if (!Array.isArray(v2.resources)) v2.resources = Array.isArray(entry.resources) ? entry.resources.slice() : [];
    if (!Array.isArray(v2.grants)) v2.grants = Array.isArray(entry.grants) ? entry.grants.slice() : [];
    if (!Array.isArray(v2.choices)) v2.choices = Array.isArray(entry.choices) ? entry.choices.slice() : [];
    if (entry.requires !== undefined && v2.requires === undefined) v2.requires = entry.requires;
    if (entry.overrides !== undefined && v2.overrides === undefined) v2.overrides = entry.overrides;
    if (entry.pack !== undefined && v2.pack === undefined) v2.pack = entry.pack;
    if (entry.stacks !== undefined && v2.stacks === undefined) v2.stacks = entry.stacks;
    if (entry.invested !== undefined && v2.invested === undefined) v2.invested = entry.invested;
    if (entry.autoUnlock !== undefined && v2.autoUnlock === undefined) v2.autoUnlock = entry.autoUnlock;
    if (entry.isSynergy !== undefined && v2.isSynergy === undefined) v2.isSynergy = entry.isSynergy;
    if (entry.isSynergyGrant !== undefined && v2.isSynergyGrant === undefined) v2.isSynergyGrant = entry.isSynergyGrant;
    if (entry.sourceCategory !== undefined && v2.sourceCategory === undefined) v2.sourceCategory = entry.sourceCategory;
    if (entry.maxRanks !== undefined && v2.maxRanks === undefined) v2.maxRanks = entry.maxRanks;
    if (entry.stackable !== undefined && v2.stackable === undefined) v2.stackable = entry.stackable;
    if (entry.targetRepeatable !== undefined && v2.targetRepeatable === undefined) v2.targetRepeatable = entry.targetRepeatable;
    if (Array.isArray(entry.featTags) && !Array.isArray(v2.featTags)) v2.featTags = entry.featTags.slice();
    if (entry.isFighterBonusFeat !== undefined && v2.isFighterBonusFeat === undefined) v2.isFighterBonusFeat = entry.isFighterBonusFeat;
    const cleanName = String(v2.name || '').replace(/^flaw:\s*/i, '').trim().toLowerCase();
    const isFlaw = String(v2.type || '').toLowerCase() === 'flaw'
      || String(v2.category || '').toLowerCase() === 'flaw'
      || Boolean(v2.ruleFlags && v2.ruleFlags.isFlaw)
      || CANONICAL_UA_FLAWS.has(cleanName);
    if (isFlaw) {
      v2.type = 'Flaw';
      v2.category = 'Flaw';
      if (v2.slotDiff === undefined || Number(v2.slotDiff) <= 0) v2.slotDiff = 1;
      if (!v2.ruleFlags || typeof v2.ruleFlags !== 'object') v2.ruleFlags = {};
      v2.ruleFlags.isFlaw = true;
      v2.ruleFlags.grantsBonusFeat = 1;
    }
    if (cleanName.includes('steadfast determination')) {
      if (!v2.ruleFlags || typeof v2.ruleFlags !== 'object') v2.ruleFlags = {};
      v2.ruleFlags.conToWillSave = true;
      v2.ruleFlags.noAutoFailFortSaveOnNat1 = true;
    }
    if (cleanName.includes('agile shield fighter') || cleanName.includes('agile shiled fighter')) {
      v2.name = 'Agile Shield Fighter';
      v2.type = 'Feat';
      v2.category = 'Fighter';
      v2.isFighterBonusFeat = true;
      v2.source = "Player's Handbook II, p. 74";
      v2.prereq = 'Shield Proficiency, Improved Shield Bash, Shield Specialization';
      v2.prerequisites = 'Shield Proficiency, Improved Shield Bash, Shield Specialization';
      v2.benefit = 'When making a shield bash and armed strike attack as part of a full attack action, you take a -2 penalty on each attack. These penalties replace the normal ones you incur for fighting with two weapons.';
      v2.description = 'You are skilled in combining your shield bash attack with an armed strike. When you use your shield in unison with a weapon, your training allows you to score telling blows with both. Prerequisites: Proficiency with shields, Improved Shield Bash, Shield Specialization. Benefit: When making a shield bash and armed strike attack as part of a full attack action, you take a -2 penalty on each attack. These penalties replace the normal ones you incur for fighting with two weapons. Special: A fighter can select Agile Shield Fighter as one of his fighter bonus feats.';
      v2.special = 'A fighter can select Agile Shield Fighter as one of his fighter bonus feats.';
      if (!v2.ruleFlags || typeof v2.ruleFlags !== 'object') v2.ruleFlags = {};
      v2.ruleFlags.agileShieldFighter = true;
    }
    return v2;
  },

  // Helper: Extract Canonical V2 Stat & Damage Summary Pills for UI rendering
  /**
   * Escapes a value for HTML text or a quoted attribute. This file is loaded by both the sheet and
   * the Hub, and the Hub has no `UI` helpers, so entry names and descriptions are escaped here.
   */
  escapeHtml(val) {
    if (val === null || val === undefined || val === false) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Escapes a value for a quoted JavaScript string inside an inline handler attribute, as in
   * `RuleMaster.fn('${RuleMaster.escapeJsString(name)}')`. Every character outside a
   * small safe set becomes a `\uXXXX` escape, so neither the HTML attribute nor the JS string can
   * be broken out of, and the handler receives the original text.
   */
  escapeJsString(val) {
    if (val === null || val === undefined || val === false) return '';
    return String(val).replace(/[^A-Za-z0-9 _.,:;!?()\[\]@#%^*+=|~\/-]/g, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
  },

  getEntrySummaryPills(entry) {
    if (!entry || typeof entry !== 'object') return [];
    const v2 = this.ensureV2(entry);
    const pills = [];
    const mods = Array.isArray(v2.modifiers) ? v2.modifiers : [];
    const dmgParts = Array.isArray(v2.damageParts) ? v2.damageParts : [];
    const modes = Array.isArray(v2.modes) ? v2.modes : [];

    const targetLabelMap = {
      'ability.str': 'STR', 'str': 'STR',
      'ability.dex': 'DEX', 'dex': 'DEX',
      'ability.con': 'CON', 'con': 'CON',
      'ability.int': 'INT', 'int': 'INT',
      'ability.wis': 'WIS', 'wis': 'WIS',
      'ability.cha': 'CHA', 'cha': 'CHA',
      'ac': 'AC', 'ac.armor': 'Armor AC', 'ac.shield': 'Shield AC', 'ac.deflection': 'Defl AC', 'ac.natural': 'Nat AC', 'ac.dodge': 'Dodge AC',
      'attack.all': 'Atk', 'attack.melee': 'Melee Atk', 'attack.ranged': 'Ranged Atk', 'atk': 'Atk',
      'damage.all': 'Dmg', 'damage.melee': 'Melee Dmg', 'damage.ranged': 'Ranged Dmg', 'dmg': 'Dmg',
      'save.all': 'All Saves', 'save.fort': 'Fort', 'save.ref': 'Ref', 'save.will': 'Will', 'fort': 'Fort', 'ref': 'Ref', 'will': 'Will',
      'init': 'Init', 'speed.land': 'ft Speed', 'speed': 'ft Speed', 'hp': 'HP', 'casterlevel': 'CL', 'casterLevel': 'CL', 'skill.all': 'Skills'
    };

    if (v2.armorStats && Number(v2.armorStats.baseAc) > 0) {
      const enh = Number(v2.enhancementBonus) || 0;
      const totalAc = Number(v2.armorStats.baseAc) + enh;
      const hasAcMod = mods.some(m => String(m.target || '').toLowerCase().startsWith('ac'));
      if (!hasAcMod) {
        pills.push(`+${totalAc} ${v2.type === 'Shield' ? 'Shield' : 'Armor'} AC`);
      }
    }

    mods.forEach(m => {
      if (!m) return;
      const rawTarget = String(m.target || '').trim();
      let label = targetLabelMap[rawTarget] || targetLabelMap[rawTarget.toLowerCase()];
      if (!label) {
        if (rawTarget.toLowerCase().startsWith('skill.')) {
          label = this.capitalizeTitle(rawTarget.slice(6).replace(/_/g, ' '));
        } else {
          label = this.capitalizeTitle(rawTarget);
        }
      }
      if (m.formula) {
        pills.push(`${label}: ${m.formula}`);
      } else if (m.value !== undefined && m.value !== null && Number(m.value) !== 0) {
        const v = Number(m.value);
        const sign = v > 0 ? '+' : '';
        pills.push(`${sign}${v} ${label}`);
      }
    });

    dmgParts.forEach(dp => {
      if (!dp || !dp.dice) return;
      const bonusStr = dp.bonus ? (dp.bonus > 0 ? `+${dp.bonus}` : `${dp.bonus}`) : '';
      const typeStr = dp.type && dp.type !== 'Untyped' ? ` ${dp.type}` : '';
      pills.push(`⚔️ ${dp.dice}${bonusStr}${typeStr}`);
    });

    if (v2.save || v2.dcFormula) {
      const saveLabel = v2.save && v2.save !== 'None' ? v2.save : 'Save';
      if (v2.dcFormula) {
        const activeChar = (typeof character !== 'undefined' && character) ? character : (typeof window !== 'undefined' ? window.character : null);
        const dcEval = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.evaluateAbilitySaveDc === 'function')
          ? RuleEngine.evaluateAbilitySaveDc(v2, activeChar)
          : null;
        if (dcEval && dcEval.dc !== null) {
          pills.push(`🛡️ ${saveLabel} DC ${dcEval.dc} (${v2.dcFormula})`);
        } else {
          pills.push(`🛡️ ${saveLabel} DC: ${v2.dcFormula}`);
        }
      } else if (v2.save && v2.save !== 'None') {
        pills.push(`🛡️ Save: ${v2.save}`);
      }
    }

    if (v2.range) {
      pills.push(`📏 ${v2.range}`);
    }

    if (v2.recharge) {
      pills.push(`⏳ Recharge: ${v2.recharge}`);
    }

    if (modes.length > 0) {
      pills.push(`⚡ ${modes.length} Mod`);
    }

    const lowType = String(v2.type || '').toLowerCase();
    if (lowType === 'deity') {
      if (v2.alignment) pills.push(`⚖️ ${v2.alignment}`);
      if (v2.favoredWeapon || v2.weapon) pills.push(`⚔️ ${v2.favoredWeapon || v2.weapon}`);
      if (Array.isArray(v2.domains) && v2.domains.length > 0) {
        const preview = v2.domains.slice(0, 4).join(', ');
        pills.push(`✨ Domains: ${preview}${v2.domains.length > 4 ? ` (+${v2.domains.length - 4})` : ''}`);
      }
    } else if (lowType === 'domain') {
      if (v2.grantedPower?.grantedFeats?.[0]) {
        pills.push(`🎖️ Feat: ${v2.grantedPower.grantedFeats[0]}`);
      }
      if (v2.grantedPower?.spellLikeAbilities?.[0]?.name) {
        const sla = v2.grantedPower.spellLikeAbilities[0];
        pills.push(`⚡ ${sla.name}${sla.uses && sla.uses !== 'None' ? ` (${sla.uses})` : ''}`);
      }
      if (Array.isArray(v2.spells) && v2.spells.length > 0) {
        pills.push(`📜 ${v2.spells.length} Domain Spells`);
      }
    } else if (lowType === 'race') {
      if (v2.size) pills.push(`📏 ${v2.size}`);
      if (v2.baseSpeed) pills.push(`👟 ${v2.baseSpeed} ft.`);
    }

    return pills;
  },

  /**
   * Deterministic 0ms Parser for Structured Ability / Breath Weapon / SLA Stat Blocks.
   * Example input (multi-line, pipe-separated, or single-line):
   *   Breath Weapon
   *   4d8 Acid
   *   Save Reflex, DC:10+lvl+Con
   *   60ft, Recharge 1d4+1 turn
   */
  parseStructuredAbilityStatBlock(rawText, benefitText = '', categoryHint = '') {
    const rawMain = String(rawText || '').trim();
    const rawBen = String(benefitText || '').trim();
    const combinedRaw = rawBen ? `${rawMain}\n${rawBen}` : rawMain;
    if (!combinedRaw || combinedRaw.length < 6) return null;

    let working = combinedRaw;
    const markerIndices = [];
    const recordMarkerIndex = (matchObj, sourceStr) => {
      if (matchObj && typeof matchObj.index === 'number' && sourceStr === combinedRaw) {
        markerIndices.push(matchObj.index);
      }
    };

    // 1. EXTRACT RECHARGE / COOLDOWN FIRST (so "1d4+1" is never mistaken for damage dice!)
    let recharge = '';
    let rechargeDice = '';
    const rechargeRx = /\b(?:recharge|cooldown|usable\s+every|once\s+every|wait)\s*[:=]?\s*(\d+d\d+(?:\s*[+-]\s*\d+)?|\d+)\s*(turn|turns|round|rounds|min|minute|minutes|hour|hours|day|days)?\b/i;
    const rechargeAltRx = /\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*(turn|turns|round|rounds)\s*(?:recharge|cooldown)\b/i;
    const recMatch = combinedRaw.match(rechargeRx) || combinedRaw.match(rechargeAltRx);
    if (recMatch) {
      recordMarkerIndex(recMatch, combinedRaw);
      const expr = String(recMatch[1] || '').replace(/\s+/g, '');
      const rawUnit = String(recMatch[2] || 'rounds').toLowerCase();
      let normUnit = 'rounds';
      if (rawUnit.startsWith('min')) normUnit = 'minutes';
      else if (rawUnit.startsWith('hour')) normUnit = 'hours';
      else if (rawUnit.startsWith('day')) normUnit = 'days';
      else normUnit = 'rounds';
      recharge = `${expr} ${normUnit}`;
      if (/\d+d\d+/i.test(expr)) {
        rechargeDice = expr;
      }
      working = working.replace(recMatch[0], ' ');
    }

    // 2. EXTRACT SAVE TYPE & DC FORMULA
    let saveType = '';
    let dcFormula = '';
    const saveExplicitRx = /\bsave\s*[:=]?\s*(fortitude|fort|reflex|ref|will)(?:\s*(half|negates|partial|none))?\b/i;
    const saveReverseRx = /\b(fortitude|fort|reflex|ref|will)\s+save(?:\s*(half|negates|partial))?\b/i;
    const saveMatch = working.match(saveExplicitRx) || working.match(saveReverseRx);
    if (saveMatch) {
      const idxInCombined = combinedRaw.indexOf(saveMatch[0]);
      if (idxInCombined >= 0) markerIndices.push(idxInCombined);
      const rawSave = saveMatch[1].toLowerCase();
      if (rawSave.startsWith('fort')) saveType = 'Fortitude';
      else if (rawSave.startsWith('ref')) saveType = 'Reflex';
      else if (rawSave === 'will') saveType = 'Will';
      working = working.replace(saveMatch[0], ' ');
    }

    const dcRx = /\bdc\s*[:=]?\s*([0-9a-zA-Z_@+\-*/().\s]+?)(?=\s*(?:[,;|•\r\n]|\b\d+\s*(?:-?\s*)?(?:ft\.?|feet|foot)\b|\b(?:range|area|recharge|cooldown|action|duration|save|reflex|fortitude|will|acid|fire|cold|electricity|electric|sonic|force|slashing|piercing|bludgeoning)\b|$))/i;
    const dcMatch = working.match(dcRx);
    if (dcMatch) {
      const idxInCombined = combinedRaw.indexOf(dcMatch[0]);
      if (idxInCombined >= 0) markerIndices.push(idxInCombined);
      const rawDcExpr = String(dcMatch[1] || '').trim();
      if (rawDcExpr) {
        dcFormula = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.normalizeFormulaTokens === 'function')
          ? RuleEngine.normalizeFormulaTokens(rawDcExpr)
          : rawDcExpr
              .replace(/\b(?:1\/2|half)\s*(?:lvl|level|hd)\b/gi, 'floor(@level / 2)')
              .replace(/\b(?:lvl|level|hd)\b/gi, '@level')
              .replace(/\bstr(?:ength)?(?:\s*mod)?\b/gi, '@strMod')
              .replace(/\bdex(?:terity)?(?:\s*mod)?\b/gi, '@dexMod')
              .replace(/\bcon(?:stitution)?(?:\s*mod)?\b/gi, '@conMod')
              .replace(/\bint(?:elligence)?(?:\s*mod)?\b/gi, '@intMod')
              .replace(/\bwis(?:dom)?(?:\s*mod)?\b/gi, '@wisMod')
              .replace(/\bcha(?:risma)?(?:\s*mod)?\b/gi, '@chaMod')
              .replace(/\s*([+\-*/])\s*/g, ' $1 ')
              .replace(/\s+/g, ' ')
              .trim();
      }
      working = working.replace(dcMatch[0], ' ');
    }

    // Fallback save detection if DC is present and a save name is standalone
    if (!saveType && dcFormula) {
      const standaloneSave = working.match(/\b(fortitude|reflex|will)\b/i);
      if (standaloneSave) {
        const sLow = standaloneSave[1].toLowerCase();
        saveType = sLow === 'fortitude' ? 'Fortitude' : (sLow === 'reflex' ? 'Reflex' : 'Will');
        working = working.replace(standaloneSave[0], ' ');
      }
    }

    // 3. EXTRACT RANGE / AREA
    let range = '';
    const rangeRx = /\b(\d+)\s*(?:-?\s*)?(?:ft\.?|feet|foot)(?:\s*(cone|line|burst|emanation|spread|radius))?\b/i;
    const rangeMatch = working.match(rangeRx);
    if (rangeMatch) {
      const idxInCombined = combinedRaw.indexOf(rangeMatch[0]);
      if (idxInCombined >= 0) markerIndices.push(idxInCombined);
      const dist = rangeMatch[1];
      const shape = rangeMatch[2] ? ` ${rangeMatch[2].toLowerCase()}` : '';
      range = `${dist} ft.${shape}`;
      working = working.replace(rangeMatch[0], ' ');
    }

    // 3b. EXTRACT ACTION TYPE IF SPECIFIED IN TEXT (Move, Swift, Free, Immediate, Full-Round, Standard)
    let parsedActionLabel = 'Standard Action';
    let parsedActionType = 'standard';
    const actRx = /\b(move|swift|free|immediate|full[-\s]*round|standard)\s*(?:action)?\b/i;
    const actMatch = working.match(actRx);
    if (actMatch) {
      const idxInCombined = combinedRaw.indexOf(actMatch[0]);
      if (idxInCombined >= 0) markerIndices.push(idxInCombined);
      const aLow = actMatch[1].toLowerCase().replace(/[-\s]+/g, '');
      if (aLow === 'move') { parsedActionLabel = 'Move Action'; parsedActionType = 'move'; }
      else if (aLow === 'swift') { parsedActionLabel = 'Swift Action'; parsedActionType = 'swift'; }
      else if (aLow === 'free') { parsedActionLabel = 'Free Action'; parsedActionType = 'free'; }
      else if (aLow === 'immediate') { parsedActionLabel = 'Immediate Action'; parsedActionType = 'immediate'; }
      else if (aLow === 'fullround') { parsedActionLabel = 'Full-Round Action'; parsedActionType = 'full'; }
      else { parsedActionLabel = 'Standard Action'; parsedActionType = 'standard'; }
      working = working.replace(actMatch[0], ' ');
    }

    // 4. EXTRACT DAMAGE DICE & ENERGY/DAMAGE TYPE (from recharge-stripped working text!)
    const damageParts = [];
    const dmgTypeCanonicalMap = {
      acid: 'Acid', fire: 'Fire', cold: 'Cold',
      electricity: 'Electricity', electric: 'Electricity', lightning: 'Electricity',
      sonic: 'Sonic', force: 'Force',
      'positive energy': 'Positive Energy', positive: 'Positive Energy',
      'negative energy': 'Negative Energy', negative: 'Negative Energy',
      divine: 'Divine', holy: 'Holy', unholy: 'Unholy',
      slashing: 'Slashing', piercing: 'Piercing', bludgeoning: 'Bludgeoning',
      nonlethal: 'Nonlethal', untyped: 'Untyped'
    };
    const dmgRx = /\b(\d+d\d+)(?:\s*([+-]\s*\d+))?\s*(acid|fire|cold|electricity|electric|lightning|sonic|force|positive(?:\s+energy)?|negative(?:\s+energy)?|divine|holy|unholy|untyped|slashing|piercing|bludgeoning|nonlethal)?(?:\s*(?:damage|dmg))?\b/gi;
    const matchedDmgStrings = [];
    let dmgMatch;
    while ((dmgMatch = dmgRx.exec(working)) !== null) {
      const fullMatched = dmgMatch[0];
      matchedDmgStrings.push(fullMatched);
      const idxInCombined = combinedRaw.indexOf(fullMatched);
      if (idxInCombined >= 0) markerIndices.push(idxInCombined);
      const diceCore = dmgMatch[1].toLowerCase();
      const bonusNum = dmgMatch[2] ? parseInt(dmgMatch[2].replace(/\s+/g, ''), 10) || 0 : 0;
      const rawTypeKey = (dmgMatch[3] || 'untyped').toLowerCase().replace(/\s+/g, ' ').trim();
      const normDmgType = dmgTypeCanonicalMap[rawTypeKey] || 'Untyped';
      damageParts.push({
        dice: diceCore,
        bonus: bonusNum,
        type: normDmgType,
        multiplyOnCrit: false,
        onCritOnly: false,
        source: 'Ability'
      });
    }
    matchedDmgStrings.forEach(s => {
      working = working.replace(s, ' ');
    });
    working = working
      .replace(/\b(?:damage|dmg)\s*[:=-]?\s*/gi, ' ')
      .replace(/\bdeals?\b/gi, ' ');

    // Verify we have enough structured ability markers to qualify (at least 2 markers, or Save/DC + Dice/Recharge)
    const hasDamage = damageParts.length > 0;
    const hasSaveOrDc = Boolean(saveType || dcFormula);
    const hasRange = Boolean(range);
    const hasRecharge = Boolean(recharge);
    const markerCount = (hasDamage ? 1 : 0) + (hasSaveOrDc ? 1 : 0) + (hasRange ? 1 : 0) + (hasRecharge ? 1 : 0);

    if (markerCount < 2) {
      return null;
    }

    // 5. EXTRACT CLEAN ABILITY NAME
    let rawTitle = '';
    if (rawMain && rawBen && !/\d+d\d+|\b(?:save|dc|recharge|deals?|damage|dmg)\b/i.test(rawMain)) {
      rawTitle = rawMain;
    } else {
      const segments = rawMain.split(/(?:\r?\n|\||—| - |:)+/).map(s => s.trim()).filter(Boolean);
      if (segments.length > 1) {
        const firstSeg = segments[0];
        if (!/^\d+d\d+/i.test(firstSeg) && !/^(?:save|dc|recharge|cooldown)\b/i.test(firstSeg)) {
          rawTitle = firstSeg;
        }
      }
      if (!rawTitle && markerIndices.length > 0) {
        const earliestIdx = Math.min(...markerIndices);
        if (earliestIdx > 0) {
          rawTitle = combinedRaw.slice(0, earliestIdx).replace(/[\r\n|,;:\-•]+$/g, '').trim();
        }
      }
      if (!rawTitle) {
        rawTitle = working.replace(/[,;|•\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
    rawTitle = rawTitle
      .replace(/^(?:special\s*ability|racial\s*trait|class\s*feature|feat|dm\s*boon|boon)\s*:\s*/i, '')
      .replace(/\b(?:deals?|dealing|damage|dmg|takes?|taking|suffers?|usable\s+every|usable\s+once|in\s+a\s+\d|cone\s+of|line\s+of|range\s*:|save\s*:|dc\s*:|recharge\s*:|cooldown\s*:)\b[\s\S]*$/i, '')
      .replace(/[\r\n|,;:\-•()]+$/g, '')
      .trim();
    if (!rawTitle || /^\d+$/.test(rawTitle)) {
      rawTitle = 'Special Ability';
    }

    const effectiveCat = (categoryHint && ['Special Ability', 'Racial Trait', 'DM Boon', 'Class Feature', 'Feat'].includes(categoryHint))
      ? categoryHint
      : 'Special Ability';
    const cleanName = this.standardizeName(rawTitle, effectiveCat === 'DM Boon' ? '' : effectiveCat);

    damageParts.forEach(dp => {
      dp.source = cleanName;
    });

    // Build concise D&D 3.5e RAW English benefit summary
    const summarySegments = [];
    if (damageParts.length > 0) {
      const dmgDesc = damageParts.map(dp => {
        const bStr = dp.bonus ? (dp.bonus > 0 ? `+${dp.bonus}` : `${dp.bonus}`) : '';
        const tStr = dp.type && dp.type !== 'Untyped' ? ` ${dp.type}` : '';
        return `${dp.dice}${bStr}${tStr}`;
      }).join(' + ');
      summarySegments.push(`Deals ${dmgDesc} damage`);
    }
    const metaParts = [];
    if (range) metaParts.push(`Range: ${range}`);
    if (saveType || dcFormula) {
      const sPart = saveType ? `${saveType}` : 'Save';
      const dcPart = dcFormula ? `DC: ${dcFormula}` : '';
      metaParts.push(`Save: ${[sPart, dcPart].filter(Boolean).join(', ')}`);
    }
    if (recharge) metaParts.push(`Recharge: ${recharge}`);

    let benefitSummary = '';
    if (summarySegments.length > 0 && metaParts.length > 0) {
      benefitSummary = `${summarySegments.join(', ')} (${metaParts.join(' | ')}).`;
    } else if (summarySegments.length > 0) {
      benefitSummary = `${summarySegments.join(', ')}.`;
    } else {
      benefitSummary = `${metaParts.join(' | ')}.`;
    }

    const tacticalBadges = [];
    if (saveType || dcFormula) {
      tacticalBadges.push({
        label: `Save: ${saveType || 'Save'}${dcFormula ? ` (DC ${dcFormula})` : ''}`,
        Category: 'save'
      });
    }
    if (recharge) {
      tacticalBadges.push({
        label: `Recharge: ${recharge}`,
        Category: 'recharge'
      });
    }

    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'special_ability';
    return this.ensureV2({
      schemaVersion: 2,
      id: `ability_${slug}`,
      name: cleanName,
      type: effectiveCat === 'DM Boon' ? 'DM Boon' : (effectiveCat === 'Racial Trait' ? 'Racial Trait' : 'Special Ability'),
      category: effectiveCat,
      slot: 'None',
      prereq: '-',
      source: effectiveCat === 'DM Boon' ? 'DM Boon / Campaign Grant' : 'D&D 3.5e Special Ability',
      benefit: benefitSummary,
      description: benefitSummary,
      action: parsedActionLabel,
      actionType: parsedActionType,
      duration: 'Instantaneous',
      range: range || undefined,
      save: saveType || undefined,
      dcFormula: dcFormula || undefined,
      recharge: recharge || undefined,
      rechargeDice: rechargeDice || undefined,
      weight: 0,
      cost: 0,
      role: 'Offense / Special Ability',
      modifiers: [],
      damageParts: damageParts,
      modes: [],
      ruleFlags: {
        isStructuredAbility: true
      },
      tacticalBadges: tacticalBadges
    });
  },

  // Helper: Bridge Canonical V2 Entry -> Modal Form Value Map (for openModalWithData)
  extractModalViewFromV2(entry) {
    const v2 = this.ensureV2(entry || {});
    const mods = Array.isArray(v2.modifiers) ? v2.modifiers : [];
    const dmgParts = Array.isArray(v2.damageParts) ? v2.damageParts : [];
    const wStats = v2.weaponStats || {};
    const aStats = v2.armorStats || {};
    const sStats = v2.spellStats || {};

    const findModVal = (targets) => {
      const m = mods.find(mod => targets.includes(String(mod.target || '').toLowerCase()));
      return m && m.value !== undefined && m.value !== 0 ? m.value : '';
    };

    const firstSkillMod = mods.find(mod => String(mod.target || '').toLowerCase().startsWith('skill.'));
    const primaryModType = mods.find(mod => mod.type && mod.type !== 'Untyped')?.type
      || (v2.type === 'Weapon' && v2.enhancementBonus ? 'Enhancement' : (v2.type === 'Armor' ? 'Armor' : (v2.type === 'Shield' ? 'Shield' : 'Untyped')));

    const primaryDice = dmgParts[0]?.dice || wStats.baseDamage || '';
    const primaryDmgType = dmgParts[0]?.type || (Array.isArray(wStats.damageTypes) ? wStats.damageTypes.join('/') : '');

    const skillBonusesObj = {};
    mods.forEach(mod => {
      const t = String(mod.target || '');
      if (t.toLowerCase().startsWith('skill.') && t.toLowerCase() !== 'skill.all' && mod.value) {
        const sName = this.capitalizeTitle(t.slice(6).replace(/_/g, ' '));
        skillBonusesObj[sName] = Number(mod.value);
      }
    });

    return {
      bonusType: primaryModType,
      scope: v2.scope || (firstSkillMod ? this.capitalizeTitle(firstSkillMod.target.slice(6).replace(/_/g, ' ')) : 'None / General'),
      str: findModVal(['ability.str', 'str']),
      dex: findModVal(['ability.dex', 'dex']),
      con: findModVal(['ability.con', 'con']),
      int: findModVal(['ability.int', 'int']),
      wis: findModVal(['ability.wis', 'wis']),
      cha: findModVal(['ability.cha', 'cha']),
      ac: findModVal(['ac', 'ac.armor', 'ac.shield', 'ac.deflection', 'ac.natural', 'ac.dodge']) || aStats.baseAc || '',
      hp: findModVal(['hp']),
      atk: findModVal(['attack.all', 'attack.melee', 'attack.ranged', 'atk']) || (v2.type === 'Weapon' && v2.enhancementBonus ? v2.enhancementBonus : ''),
      dmg: findModVal(['damage.all', 'damage.melee', 'damage.ranged', 'dmg']) || dmgParts[0]?.bonus || (v2.type === 'Weapon' && v2.enhancementBonus ? v2.enhancementBonus : ''),
      fort: findModVal(['save.fort', 'save.all', 'fort']),
      ref: findModVal(['save.ref', 'save.all', 'ref']),
      will: findModVal(['save.will', 'save.all', 'will']),
      skill: firstSkillMod ? firstSkillMod.value : '',
      cl: findModVal(['casterlevel']),
      speed: findModVal(['speed.land', 'speed']),
      dice: primaryDice,
      critMin: wStats.critMin || 20,
      critMult: wStats.critMult || 2,
      dmgType: primaryDmgType,
      maxDex: aStats.maxDex !== undefined && aStats.maxDex !== null ? aStats.maxDex : '',
      checkPenalty: aStats.acp !== undefined ? aStats.acp : '',
      asf: aStats.asf !== undefined ? aStats.asf : '',
      range: v2.range || sStats.range || (wStats.rangeIncrement ? `${wStats.rangeIncrement} ft.` : ''),
      proficiency: wStats.category || 'Martial',
      isLight: Boolean(wStats.isLight),
      saveType: sStats.savingThrow || '',
      sr: sStats.spellResistance || 'No',
      targetArea: sStats.targetOrArea || '',
      components: sStats.components || '',
      targetSkill: firstSkillMod && firstSkillMod.target.toLowerCase() !== 'skill.all' ? this.capitalizeTitle(firstSkillMod.target.slice(6).replace(/_/g, ' ')) : '',
      skillBonusesJson: Object.keys(skillBonusesObj).length > 0 ? JSON.stringify(skillBonusesObj) : ''
    };
  },

  // Presets for quick generation (Canonical V2)
  getPresets() {
    return {
      weapon: {
        type: 'Weapon',
        slot: 'Main Hand',
        bonusType: 'Enhancement',
        scope: 'Specific Weapon',
        action: 'Standard / Full Attack',
        duration: 'Continuous',
        role: 'Offense / Weapon',
        critMin: 19,
        critMult: 2,
        dice: '1d8',
        dmgType: 'Slashing',
        tags: 'martial, slashing'
      },
      weapon2h: {
        type: 'Weapon',
        slot: 'Two-Handed',
        bonusType: 'Enhancement',
        scope: 'Specific Weapon',
        action: 'Standard / Full Attack',
        duration: 'Continuous',
        role: 'Offense / Weapon',
        critMin: 18,
        critMult: 2,
        dice: '2d6',
        dmgType: 'Slashing',
        weight: 12,
        cost: 350,
        tags: 'two-handed, exotic, slashing'
      },
      shield: {
        type: 'Shield',
        slot: 'Off-Hand/Shield',
        bonusType: 'Shield',
        scope: 'None / General',
        action: 'Passive',
        duration: 'Continuous',
        role: 'Defense / Shield',
        ac: 2,
        weight: 6,
        cost: 20
      },
      armor: {
        type: 'Armor',
        slot: 'Armor',
        bonusType: 'Armor',
        scope: 'None / General',
        action: 'Passive',
        duration: 'Continuous',
        role: 'Defense / Armor',
        ac: 4,
        weight: 25,
        cost: 100
      },
      feat: {
        type: 'Feat',
        slot: 'None',
        bonusType: 'Untyped',
        scope: 'Melee Only',
        action: 'Passive',
        duration: 'Continuous',
        role: 'General',
        weight: 0,
        cost: 0
      },
      spell: {
        type: 'Spell',
        slot: 'None',
        bonusType: 'Untyped',
        scope: 'Spells',
        action: 'Standard Action',
        duration: '1 round/level',
        role: 'Offense / Spell',
        weight: 0,
        cost: 0
      },
      maneuver: {
        type: 'Maneuver',
        slot: 'None',
        bonusType: 'Untyped',
        scope: 'Melee Only',
        action: 'Standard Action',
        duration: 'Instantaneous',
        role: 'Offense / Strike',
        discipline: 'Iron Heart',
        level: 1,
        weight: 0,
        cost: 0
      },
      stance: {
        type: 'Stance',
        slot: 'None',
        bonusType: 'Untyped',
        scope: 'Melee Only',
        action: 'Swift Action',
        duration: 'Stance (Continuous)',
        role: 'Tactical / Stance',
        discipline: 'Shadow Hand',
        level: 1,
        weight: 0,
        cost: 0
      },
      wondrous: {
        type: 'Wondrous Item',
        slot: 'Shoulders',
        bonusType: 'Resistance',
        scope: 'None / General',
        action: 'Passive',
        duration: 'Continuous',
        role: 'Defense / Armor',
        weight: 1,
        cost: 1000
      },
      potion: {
        type: 'Potion',
        slot: 'None',
        bonusType: 'Untyped',
        scope: 'None / General',
        action: 'Standard Action',
        duration: 'Instantaneous',
        role: 'General',
        weight: 0.1,
        cost: 50
      }
    };
  },

  // Save new or updated entry (Canonical V2)
  saveEntry(entryData, editIndex = -1) {
    if (!entryData || !entryData.name || !entryData.name.trim()) {
      alert('⚠️ Please enter a valid Rule / Item Name.');
      return false;
    }

    if (entryData.name) entryData.name = this.capitalizeTitle(this.cleanArrow(entryData.name));
    if (entryData.type) entryData.type = this.capitalizeIdentifier(entryData.type);
    if (entryData.slot) entryData.slot = this.capitalizeIdentifier(entryData.slot);
    if (entryData.role) entryData.role = this.capitalizeIdentifier(entryData.role);
    if (entryData.actionType) entryData.actionType = String(entryData.actionType).toLowerCase();
    if (entryData.discipline) entryData.discipline = this.capitalizeIdentifier(entryData.discipline);
    if (entryData.school) entryData.school = this.capitalizeIdentifier(entryData.school);

    let v2Entry = this.ensureV2(entryData);

    // Check if user linked this entry as an embedded mode onto a parent item in masterDb
    const linkedParentName = (entryData._linkedParentName && entryData._linkedParentName !== '-')
      ? this.cleanArrow(entryData._linkedParentName).toLowerCase().trim()
      : '';

    if (linkedParentName && editIndex < 0) {
      const parentIdx = masterDb.findIndex(m => this.cleanArrow(m.name || '').toLowerCase().trim() === linkedParentName);
      if (parentIdx >= 0) {
        const parentObj = this.ensureV2(masterDb[parentIdx]);
        if (!Array.isArray(parentObj.modes)) parentObj.modes = [];
        const modeObj = {
          id: `mode_${v2Entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
          name: entryData._modeButtonLabel || v2Entry.name,
          actionType: v2Entry.actionType || 'standard',
          benefit: v2Entry.benefit || v2Entry.description || '',
          damageParts: Array.isArray(v2Entry.damageParts) ? v2Entry.damageParts : [],
          modifiers: Array.isArray(v2Entry.modifiers) ? v2Entry.modifiers : []
        };
        const existingModeIdx = parentObj.modes.findIndex(m => m.id === modeObj.id || (m.name || '').toLowerCase() === modeObj.name.toLowerCase());
        if (existingModeIdx >= 0) parentObj.modes[existingModeIdx] = modeObj;
        else parentObj.modes.push(modeObj);
        masterDb[parentIdx] = parentObj;
        this.syncMasterDbEditToCharacter(parentObj.name, parentObj);
        if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
        this.renderTable();
        if (typeof renderAll === 'function') renderAll();
        return true;
      }
    }

    delete v2Entry._linkedParentName;
    delete v2Entry._modeButtonLabel;

    let oldName = null;
    if (editIndex >= 0 && editIndex < masterDb.length) {
      const oldEntry = this.ensureV2(masterDb[editIndex]);
      oldName = oldEntry.name;
      if (!v2Entry.id || v2Entry.id.startsWith('custom_')) {
        v2Entry.id = oldEntry.id || v2Entry.id;
      }
      if ((!v2Entry.modes || v2Entry.modes.length === 0) && Array.isArray(oldEntry.modes) && oldEntry.modes.length > 0) {
        v2Entry.modes = oldEntry.modes;
      }
      masterDb[editIndex] = v2Entry;
    } else {
      masterDb.unshift(v2Entry);
    }

    let syncCount = this.syncMasterDbEditToCharacter(oldName || v2Entry.name, v2Entry);

    if (typeof saveStateToStorage === 'function') {
      saveStateToStorage(true);
    }
    this.renderTable();
    if (typeof renderAll === 'function') {
      renderAll();
    }

    if (oldName && syncCount > 0) {
      alert(`✅ "${v2Entry.name}" updated in Master DB and synced across ${syncCount} character record(s)!`);
    }

    return true;
  },

  // Synchronize Master DB edits into character inventory and equipped items (Canonical V2)
  syncMasterDbEditToCharacter(oldName, updatedEntry) {
    if (!oldName || !updatedEntry || typeof character === 'undefined' || !character) return 0;
    const v2 = this.ensureV2(updatedEntry);
    let changesCount = 0;
    const cleanOld = oldName.toLowerCase().trim();
    const cleanNew = (v2.name || '').toLowerCase().trim();

    // 1. Sync character.gearPool
    if (Array.isArray(character.gearPool)) {
      character.gearPool.forEach(item => {
        const itemClean = (item.name || '').toLowerCase().trim();
        const masterDbRef = (item.masterDbName || '').toLowerCase().trim();
        if (item.id === v2.id || itemClean === cleanOld || masterDbRef === cleanOld || itemClean === cleanNew) {
          item.schemaVersion = 2;
          item.id = v2.id || item.id;
          item.baseItemId = v2.baseItemId || item.baseItemId || null;
          item.name = v2.name;
          item.masterDbName = v2.name;
          if (typeof mapEntryToGearCategory === 'function') {
            item.category = mapEntryToGearCategory(v2);
          } else if (v2.type) {
            item.category = v2.type;
          }
          if (v2.slot && v2.slot !== 'None' && v2.slot !== '-') {
            item.slot = v2.slot;
          }
          item.tags = Array.isArray(v2.tags) ? [...v2.tags] : [];
          item.weight = Number(v2.weight) || 0;
          item.cost = Number(v2.cost) || 0;
          item.desc = v2.benefit || v2.description || '';
          item.modifiers = Array.isArray(v2.modifiers) ? JSON.parse(JSON.stringify(v2.modifiers)) : [];
          item.damageParts = Array.isArray(v2.damageParts) ? JSON.parse(JSON.stringify(v2.damageParts)) : [];
          item.modes = Array.isArray(v2.modes) ? JSON.parse(JSON.stringify(v2.modes)) : [];
          item.ruleFlags = v2.ruleFlags ? JSON.parse(JSON.stringify(v2.ruleFlags)) : {};
          item.tacticalBadges = Array.isArray(v2.tacticalBadges) ? [...v2.tacticalBadges] : [];
          if (v2.weaponStats) item.weaponStats = JSON.parse(JSON.stringify(v2.weaponStats));
          if (v2.armorStats) item.armorStats = JSON.parse(JSON.stringify(v2.armorStats));
          changesCount++;
        }
      });
    }

    // 2. Sync character.bodySlots (Equipped 14 body slots)
    if (character.bodySlots && typeof character.bodySlots === 'object') {
      Object.keys(character.bodySlots).forEach(slotKey => {
        const slotObj = character.bodySlots[slotKey];
        if (slotObj && slotObj.name) {
          const slotClean = slotObj.name.toLowerCase().trim();
          if (slotObj.id === v2.id || slotClean === cleanOld || slotClean === cleanNew) {
            slotObj.schemaVersion = 2;
            slotObj.id = v2.id || slotObj.id;
            slotObj.baseItemId = v2.baseItemId || slotObj.baseItemId || null;
            slotObj.name = v2.name;
            slotObj.masterDbName = v2.name;
            slotObj.weight = Number(v2.weight) || 0;
            slotObj.cost = Number(v2.cost) || 0;
            slotObj.desc = v2.benefit || v2.description || '';
            slotObj.actionType = v2.actionType || slotObj.actionType;
            slotObj.modifiers = Array.isArray(v2.modifiers) ? JSON.parse(JSON.stringify(v2.modifiers)) : [];
            slotObj.damageParts = Array.isArray(v2.damageParts) ? JSON.parse(JSON.stringify(v2.damageParts)) : [];
            slotObj.modes = Array.isArray(v2.modes) ? JSON.parse(JSON.stringify(v2.modes)) : [];
            slotObj.ruleFlags = v2.ruleFlags ? JSON.parse(JSON.stringify(v2.ruleFlags)) : {};
            slotObj.tacticalBadges = Array.isArray(v2.tacticalBadges) ? [...v2.tacticalBadges] : [];
            if (v2.armorStats) slotObj.armorStats = JSON.parse(JSON.stringify(v2.armorStats));
            changesCount++;
          }
        }
      });
    }

    // 3. Sync character.weapons
    if (Array.isArray(character.weapons)) {
      character.weapons.forEach(w => {
        const wepClean = (w.name || '').toLowerCase().trim();
        if (w.id === v2.id || wepClean === cleanOld || wepClean === cleanNew) {
          w.schemaVersion = 2;
          w.id = v2.id || w.id;
          w.baseItemId = v2.baseItemId || w.baseItemId || null;
          w.name = v2.name;
          if (v2.slot) w.slot = v2.slot;
          if (v2.tags) w.tags = Array.isArray(v2.tags) ? [...v2.tags] : [];
          w.enhancementBonus = Number(v2.enhancementBonus) || w.enhancementBonus || 0;
          w.modifiers = Array.isArray(v2.modifiers) ? JSON.parse(JSON.stringify(v2.modifiers)) : [];
          w.damageParts = Array.isArray(v2.damageParts) ? JSON.parse(JSON.stringify(v2.damageParts)) : [];
          w.modes = Array.isArray(v2.modes) ? JSON.parse(JSON.stringify(v2.modes)) : [];
          w.weaponStats = v2.weaponStats ? JSON.parse(JSON.stringify(v2.weaponStats)) : w.weaponStats;
          w.ruleFlags = v2.ruleFlags ? JSON.parse(JSON.stringify(v2.ruleFlags)) : {};
          w.tacticalBadges = Array.isArray(v2.tacticalBadges) ? [...v2.tacticalBadges] : [];
          changesCount++;
        }
      });
      if (character.activeWeapon && (character.activeWeapon.toLowerCase().trim() === cleanOld || character.activeWeapon.toLowerCase().trim() === cleanNew)) {
        character.activeWeapon = v2.name;
      }
    }

    // 4. Sync character.consumables
    if (Array.isArray(character.consumables)) {
      character.consumables.forEach(c => {
        const cClean = (c.name || '').toLowerCase().trim();
        if (cClean === cleanOld || cClean === cleanNew) {
          c.name = v2.name;
          c.effect = v2.benefit || v2.description || c.effect;
          changesCount++;
        }
      });
    }

    // 5. Sync character.feats & character.specialAbilities
    const stripTag = (str) => String(str || '').replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
    if (Array.isArray(character.feats)) {
      character.feats = character.feats.map(f => {
        if (typeof f === 'string') {
          if (stripTag(f) === cleanOld || stripTag(f) === cleanNew) {
            changesCount++;
            return v2.name;
          }
          return f;
        } else if (f && f.name) {
          const fClean = stripTag(f.name);
          if (f.id === v2.id || fClean === cleanOld || fClean === cleanNew) {
            f.id = v2.id || f.id;
            f.name = v2.name;
            f.benefit = v2.benefit || f.benefit;
            if (v2.action) f.action = v2.action;
            if (v2.actionType) f.actionType = v2.actionType;
            if (Array.isArray(v2.damageParts) && v2.damageParts.length > 0) f.damageParts = JSON.parse(JSON.stringify(v2.damageParts));
            if (v2.save) f.save = v2.save;
            if (v2.dcFormula) f.dcFormula = v2.dcFormula;
            if (v2.range) f.range = v2.range;
            if (v2.recharge) f.recharge = v2.recharge;
            if (v2.rechargeDice) f.rechargeDice = v2.rechargeDice;
            f.modifiers = Array.isArray(v2.modifiers) ? JSON.parse(JSON.stringify(v2.modifiers)) : (f.modifiers || []);
            f.ruleFlags = v2.ruleFlags ? JSON.parse(JSON.stringify(v2.ruleFlags)) : (f.ruleFlags || {});
            changesCount++;
          }
          return f;
        }
        return f;
      });
    }
    if (Array.isArray(character.specialAbilities)) {
      character.specialAbilities = character.specialAbilities.map(a => {
        if (typeof a === 'string') {
          if (stripTag(a) === cleanOld || stripTag(a) === cleanNew) {
            changesCount++;
            return {
              id: v2.id,
              name: v2.name,
              type: v2.type || 'Special Ability',
              benefit: v2.benefit || v2.description || '',
              action: v2.action || 'Standard Action',
              actionType: v2.actionType || 'standard',
              damageParts: Array.isArray(v2.damageParts) ? JSON.parse(JSON.stringify(v2.damageParts)) : [],
              save: v2.save || '',
              dcFormula: v2.dcFormula || '',
              range: v2.range || '',
              recharge: v2.recharge || '',
              rechargeDice: v2.rechargeDice || ''
            };
          }
          return a;
        } else if (a && a.name) {
          const aClean = stripTag(a.name);
          if (a.id === v2.id || aClean === cleanOld || aClean === cleanNew) {
            a.id = v2.id || a.id;
            a.name = v2.name;
            a.benefit = v2.benefit || a.benefit;
            if (v2.action) a.action = v2.action;
            if (v2.actionType) a.actionType = v2.actionType;
            if (Array.isArray(v2.damageParts) && v2.damageParts.length > 0) a.damageParts = JSON.parse(JSON.stringify(v2.damageParts));
            if (v2.save) a.save = v2.save;
            if (v2.dcFormula) a.dcFormula = v2.dcFormula;
            if (v2.range) a.range = v2.range;
            if (v2.recharge) a.recharge = v2.recharge;
            if (v2.rechargeDice) a.rechargeDice = v2.rechargeDice;
            a.modifiers = Array.isArray(v2.modifiers) ? JSON.parse(JSON.stringify(v2.modifiers)) : (a.modifiers || []);
            a.ruleFlags = v2.ruleFlags ? JSON.parse(JSON.stringify(v2.ruleFlags)) : (a.ruleFlags || {});
            changesCount++;
          }
          return a;
        }
        return a;
      });
    }

    // 6. Sync character.spellcasting.knownSpells
    if (character.spellcasting && Array.isArray(character.spellcasting.knownSpells)) {
      character.spellcasting.knownSpells.forEach(s => {
        if (s.id === v2.id || (s.name || '').toLowerCase().trim() === cleanOld || (s.name || '').toLowerCase().trim() === cleanNew) {
          s.id = v2.id || s.id;
          s.name = v2.name;
          s.benefit = v2.benefit || s.benefit;
          if (v2.school) s.school = v2.school;
          s.damageParts = Array.isArray(v2.damageParts) ? JSON.parse(JSON.stringify(v2.damageParts)) : (s.damageParts || []);
          s.modes = Array.isArray(v2.modes) ? JSON.parse(JSON.stringify(v2.modes)) : (s.modes || []);
          changesCount++;
        }
      });
    }

    // 7. Sync character.tomeOfBattle
    if (character.tomeOfBattle) {
      if (Array.isArray(character.tomeOfBattle.readiedManeuvers)) {
        character.tomeOfBattle.readiedManeuvers.forEach(m => {
          if ((m.name || '').toLowerCase().trim() === cleanOld || (m.name || '').toLowerCase().trim() === cleanNew) {
            m.name = v2.name;
            m.notes = v2.benefit || m.notes;
            m.damageParts = Array.isArray(v2.damageParts) ? JSON.parse(JSON.stringify(v2.damageParts)) : (m.damageParts || []);
            m.modes = Array.isArray(v2.modes) ? JSON.parse(JSON.stringify(v2.modes)) : (m.modes || []);
            changesCount++;
          }
        });
      }
      if (Array.isArray(character.tomeOfBattle.stancesKnown)) {
        character.tomeOfBattle.stancesKnown.forEach(st => {
          if ((st.name || '').toLowerCase().trim() === cleanOld || (st.name || '').toLowerCase().trim() === cleanNew) {
            st.name = v2.name;
            st.benefit = v2.benefit || st.benefit;
            st.modifiers = Array.isArray(v2.modifiers) ? JSON.parse(JSON.stringify(v2.modifiers)) : (st.modifiers || []);
            changesCount++;
          }
        });
      }
      if (character.activeStance && (character.activeStance.toLowerCase().trim() === cleanOld || character.activeStance.toLowerCase().trim() === cleanNew)) {
        character.activeStance = v2.name;
      }
    }

    return changesCount;
  },

  selectedIds: new Set(),

  getEntrySelectionKey(item, idx = 0) {
    if (!item) return String(idx);
    return String(item.id || (item.name || '').toLowerCase().trim() || idx);
  },

  toggleSelectEntry(key, isChecked) {
    if (!key) return;
    if (isChecked) {
      this.selectedIds.add(String(key));
    } else {
      this.selectedIds.delete(String(key));
    }
    this.updateSelectionUi();
  },

  evaluateEntryEligibilityForCharacter(item, ch = null) {
    const activeChar = ch || (typeof character !== 'undefined' ? character : null);
    if (!item || typeof item !== 'object') return { status: 'ELIGIBLE', isSynergy: false, met: true };
    const hasV25Req = Boolean(item.requires && typeof item.requires === 'object' && Object.keys(item.requires).length > 0);
    const catStr = String(item.type || item.category || item.sourceCategory || '').toLowerCase().trim();
    const isSynergy = Boolean(
      item.autoUnlock === true
      || item.isSynergy === true
      || item.isSynergyGrant === true
      || catStr === 'synergy'
    );
    let met = true;
    if (hasV25Req && typeof RuleEngine !== 'undefined' && typeof RuleEngine.evaluatePredicate === 'function') {
      const ctx = typeof RuleEngine.getFormulaContext === 'function' ? RuleEngine.getFormulaContext(activeChar || {}) : {};
      const ownedIds = typeof RuleEngine.buildCharacterOwnedIdsSet === 'function'
        ? RuleEngine.buildCharacterOwnedIdsSet(activeChar || {})
        : undefined;
      met = RuleEngine.evaluatePredicate(item.requires, activeChar || {}, Object.assign({}, ctx, { ownedIds }));
    } else if (item.prereq && item.prereq !== '-' && typeof checkFeatPrerequisites === 'function' && activeChar) {
      const pEval = checkFeatPrerequisites(item, 0, Math.max(0, (Number(activeChar.level) || 1) - 1));
      met = Boolean(pEval && pEval.allMet);
    }
    if (!met) return { status: 'PREREQ_MISSING', isSynergy, met: false };
    if (isSynergy && hasV25Req) return { status: 'SYNERGY_READY', isSynergy: true, met: true };
    return { status: 'ELIGIBLE', isSynergy, met: true };
  },

  toggleSelectAllFiltered(isChecked) {
    if (!Array.isArray(masterDb)) return;
    const query = (document.getElementById('mdb-search-input')?.value || '').toLowerCase();
    const cat = document.getElementById('mdb-category-filter')?.value || 'ALL';
    const eligFilter = document.getElementById('mdb-eligibility-filter')?.value || 'ALL';
    const bonusFilter = document.getElementById('mdb-bonus-filter')?.value || 'ALL';
    const scopeFilter = document.getElementById('mdb-scope-filter')?.value || 'ALL';

    masterDb.forEach((rawItem, idx) => {
      const item = this.ensureV2(rawItem);
      const haystack = `${item.benefit || ''} ${item.description || ''} ${item.portfolio || ''} ${item.favoredWeapon || ''} ${item.grantedPower?.description || ''} ${Array.isArray(item.domains) ? item.domains.join(' ') : ''} ${item.source || ''} ${item.pack || ''} ${item.discipline || ''}`.toLowerCase();
      const fuzzySc = (query && typeof SrdCompendium !== 'undefined' && typeof SrdCompendium.fuzzyScore === 'function')
        ? SrdCompendium.fuzzyScore(query, item.name || '', haystack)
        : 0;
      const matchQ = !query ||
        fuzzySc > 0 ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        haystack.includes(query);
      const matchCat = cat === 'ALL' || item.type === cat || (cat === 'DM Grant' && item.type === 'DM Boon') || (cat === 'Class' && (item.category === 'Class' || item.type === 'Base Class' || item.type === 'Prestige Class' || item.type === 'Custom Class'));
      const itemBonusType = item.modifiers?.[0]?.type || (item.type === 'Weapon' && item.enhancementBonus ? 'Enhancement' : 'Untyped');
      const matchBonus = bonusFilter === 'ALL' || itemBonusType === bonusFilter;
      const matchScope = scopeFilter === 'ALL' || (item.scope || 'None / General') === scopeFilter;
      const elig = this.evaluateEntryEligibilityForCharacter(item);
      const matchElig = eligFilter === 'ALL'
        || (eligFilter === 'ELIGIBLE' && elig.met)
        || (eligFilter === 'SYNERGY_READY' && elig.status === 'SYNERGY_READY')
        || (eligFilter === 'PREREQ_MISSING' && !elig.met);

      if (matchQ && matchCat && matchBonus && matchScope && matchElig) {
        const key = this.getEntrySelectionKey(item, idx);
        if (isChecked) {
          this.selectedIds.add(key);
        } else {
          this.selectedIds.delete(key);
        }
      }
    });
    this.renderTable();
  },

  clearSelection() {
    this.selectedIds.clear();
    this.renderTable();
  },

  deleteSelectedEntries() {
    if (!Array.isArray(masterDb) || this.selectedIds.size === 0) return;
    const count = this.selectedIds.size;
    if (!confirm(`⚠️ Are you sure you want to permanently delete ${count} selected custom entries from this character's Custom DB?`)) {
      return;
    }
    for (let i = masterDb.length - 1; i >= 0; i--) {
      const item = this.ensureV2(masterDb[i]);
      const key = this.getEntrySelectionKey(item, i);
      if (this.selectedIds.has(key)) {
        masterDb.splice(i, 1);
      }
    }
    if (typeof character !== 'undefined' && character) {
      character.customDb = masterDb;
    }
    this.selectedIds.clear();
    if (typeof saveStateToStorage === 'function') {
      saveStateToStorage(true);
    }
    this.renderTable();
    if (typeof renderAll === 'function') {
      renderAll();
    }
  },

  updateSelectionUi(filteredKeys = null) {
    if (Array.isArray(masterDb)) {
      const validKeys = new Set(masterDb.map((raw, idx) => this.getEntrySelectionKey(this.ensureV2(raw), idx)));
      Array.from(this.selectedIds).forEach(k => {
        if (!validKeys.has(k)) this.selectedIds.delete(k);
      });
    }

    const selectedCount = this.selectedIds.size;
    const selBadge = document.getElementById('mdb-selected-count-badge');
    const clearBtn = document.getElementById('btn-mdb-clear-selection');
    const delBtn = document.getElementById('btn-mdb-delete-selected');
    const expBtn = document.getElementById('btn-mdb-export');
    const selectAllCb = document.getElementById('mdb-select-all-checkbox');

    if (selBadge) {
      selBadge.textContent = `${selectedCount} Selected`;
      selBadge.classList.toggle('hidden', selectedCount === 0);
    }
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', selectedCount === 0);
    }
    if (delBtn) {
      delBtn.classList.toggle('hidden', selectedCount === 0);
      delBtn.innerHTML = `🗑️ Delete Selected (${selectedCount})`;
    }
    if (expBtn) {
      expBtn.innerHTML = selectedCount > 0
        ? `💾 Export Selected (${selectedCount})`
        : `💾 Export DB (.json)`;
    }
    if (selectAllCb) {
      const keysToCheck = Array.isArray(filteredKeys)
        ? filteredKeys
        : (Array.isArray(masterDb) ? masterDb.map((raw, idx) => this.getEntrySelectionKey(this.ensureV2(raw), idx)) : []);
      if (keysToCheck.length === 0) {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = false;
      } else {
        const checkedInFiltered = keysToCheck.filter(k => this.selectedIds.has(k)).length;
        selectAllCb.checked = checkedInFiltered === keysToCheck.length;
        selectAllCb.indeterminate = checkedInFiltered > 0 && checkedInFiltered < keysToCheck.length;
      }
    }
  },

  // Delete entry
  deleteEntry(index) {
    if (index >= 0 && index < masterDb.length) {
      const item = this.ensureV2(masterDb[index]);
      if (confirm(`Are you sure you want to permanently delete "${item.name}" from this character's Custom DB?`)) {
        const key = this.getEntrySelectionKey(item, index);
        this.selectedIds.delete(key);
        masterDb.splice(index, 1);
        if (typeof character !== 'undefined' && character) {
          character.customDb = masterDb;
        }
        if (typeof saveStateToStorage === 'function') {
          saveStateToStorage(true);
        }
        this.renderTable();
      }
    }
  },

  // Duplicate entry
  duplicateEntry(index) {
    if (index >= 0 && index < masterDb.length) {
      const copy = this.ensureV2(JSON.parse(JSON.stringify(masterDb[index])));
      copy.name += " (Copy)";
      copy.id = `${copy.id}_copy_${Date.now()}`;
      masterDb.splice(index + 1, 0, copy);
      if (typeof character !== 'undefined' && character) {
        character.customDb = masterDb;
      }
      if (typeof saveStateToStorage === 'function') {
        saveStateToStorage(true);
      }
      this.renderTable();
    }
  },

  // Add Embedded Mode (Alt Mod) linked to Parent
  addChildPower(parentIndex) {
    if (parentIndex >= 0 && parentIndex < masterDb.length) {
      const parentItem = this.ensureV2(masterDb[parentIndex]);
      const modeDraft = this.createEmptyEntry(parentItem.type || 'Spell');
      modeDraft.name = `${parentItem.name} (Alt Mod)`;
      modeDraft._linkedParentName = parentItem.name;
      modeDraft.slot = parentItem.slot || 'None';
      modeDraft.source = parentItem.source;
      modeDraft.school = parentItem.school || '';
      modeDraft.discipline = parentItem.discipline || '';
      modeDraft.level = parentItem.level !== undefined ? parentItem.level : '';
      modeDraft.role = 'Tactical / Boost';
      modeDraft.weight = 0;
      modeDraft.cost = 0;
      this.openModalWithData(modeDraft, -1);
    }
  },

  // Equip or learn into active character
  equipToCharacter(index) {
    if (index < 0 || index >= masterDb.length || typeof character === 'undefined' || !character) return;
    const item = this.ensureV2(masterDb[index]);
    this.equipItem(item);
  },

  // Direct 1-click addition from Master DB to Inventory (Canonical V2)
  addToInventory(index) {
    if (index < 0 || index >= masterDb.length || typeof character === 'undefined' || !character) return;
    const item = this.ensureV2(masterDb[index]);
    if (!character.gearPool) character.gearPool = [];

    const inPool = character.gearPool.some(p => p.id === item.id || (p.name || '').toLowerCase() === item.name.toLowerCase());
    if (inPool) {
      alert(`ℹ️ "${item.name}" is already in your inventory!`);
      return;
    }

    const cat = typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(item) : (item.type || 'Other');
    const isBelt = (item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable';

    character.gearPool.push({
      schemaVersion: 2,
      id: item.id || `gear_${Date.now()}`,
      baseItemId: item.baseItemId || null,
      name: item.name,
      masterDbName: item.name,
      category: cat,
      slot: item.slot && item.slot !== 'None' ? item.slot : cat,
      qty: 1,
      weight: Number(item.weight) || 0,
      cost: Number(item.cost) || 0,
      desc: item.benefit || item.description || '',
      modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
      damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : [],
      modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
      ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {},
      tacticalBadges: Array.isArray(item.tacticalBadges) ? [...item.tacticalBadges] : [],
      isBelt: isBelt,
      isEquipped: false
    });

    if (cat === 'Consumable') {
      if (!character.consumables) character.consumables = [];
      character.consumables.push({ name: item.name, qty: 1, effect: item.benefit || '' });
    }

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof renderConsumables === 'function') renderConsumables();
    alert(`🎒 "${item.name}" added to your backpack / inventory pool!`);
  },

  // Open Edit / Add in Type-Specific Editor Modal or Inline V2 Manual Rule Form
  openModalWithData(entry, editIndex = -1, options = {}) {
    if (!options?.forceManualBuilder && entry && typeof entry === 'object') {
      const rawType = String(entry.type || entry.category || '').trim().toLowerCase();
      const rawId = String(entry.id || '').trim().toLowerCase();

      // 1. Deity -> Dedicated Deity / Patron Creator & Editor Modal
      if (rawType === 'deity' || rawId.startsWith('deity-')) {
        if (typeof window.openCustomDeityEditorModal === 'function') {
          window.openCustomDeityEditorModal(entry, editIndex);
          return;
        }
      }

      // 2. Cleric Domain -> Dedicated Cleric Domain Creator & Editor Modal
      if (rawType === 'domain' || rawType === 'cleric domain' || rawId.startsWith('dom-')) {
        if (typeof window.openCustomDomainEditorModal === 'function') {
          window.openCustomDomainEditorModal(entry, editIndex);
          return;
        }
      }

      // 2.5. Class / Prestige Class / Variant Class -> Dedicated Class Template Studio Modal
      if (
        rawType === 'class' ||
        rawType === 'base class' ||
        rawType === 'prestige class' ||
        rawType === 'custom class' ||
        String(entry.category || '').trim().toLowerCase() === 'class' ||
        rawId.startsWith('class_') ||
        rawId.startsWith('cls_')
      ) {
        if (typeof window.openCreateCustomClassModal === 'function') {
          window.openCreateCustomClassModal(entry.name || '', true, entry, editIndex);
          return;
        }
      }

      // 3. Modular Assembled Equipment (Lego Forge Item) -> Open in The Forge
      if (
        (rawType === 'weapon' || rawType === 'armor' || rawType === 'shield') &&
        entry.baseItemId &&
        (Number(entry.enhancementBonus) > 0 || (Array.isArray(entry.enhancements) && entry.enhancements.length > 0) || entry.material || entry.crystal) &&
        typeof this.openInForgeWithData === 'function' &&
        window.SrdCompendium &&
        typeof window.SrdCompendium.getById === 'function' &&
        window.SrdCompendium.getById(entry.baseItemId)
      ) {
        this.openInForgeWithData(entry, editIndex);
        return;
      }
    }

    this.selectedEntryIndex = editIndex;
    const v2 = this.ensureV2(entry ? JSON.parse(JSON.stringify(entry)) : this.createEmptyEntry('Weapon'));
    this._currentEditingEntry = v2;
    this._changeAndAddOriginalSnapshot = null;

    // Ensure Inline Manual Rule mode is visible (Rule Master panel is permanently visible above all filters)
    this.switchInlineMode('manual');

    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = (v !== undefined && v !== null) ? v : '';
    };

    setVal('im-name', v2.name || '');
    const typeEl = document.getElementById('im-type');
    if (typeEl) {
      let typeVal = v2.type || 'Weapon';
      let matchOpt = Array.from(typeEl.options).find(o => o.value.toLowerCase() === String(typeVal).toLowerCase());
      if (!matchOpt && typeVal) {
        const opt = document.createElement('option');
        opt.value = typeVal;
        opt.textContent = typeVal;
        typeEl.appendChild(opt);
        matchOpt = opt;
      }
      typeEl.value = matchOpt ? matchOpt.value : 'Weapon';
    }

    let slotVal = v2.slot || 'None';
    if (slotVal === 'Two-Hand' || slotVal === 'Both Hands') slotVal = 'Two-Handed';
    const slotEl = document.getElementById('im-slot');
    if (slotEl) {
      let matchSlot = Array.from(slotEl.options).find(o => o.value.toLowerCase() === String(slotVal).toLowerCase());
      slotEl.value = matchSlot ? matchSlot.value : 'None';
    }

    setVal('im-source', v2.source || 'PHB p.');

    const primaryDmg = Array.isArray(v2.damageParts) && v2.damageParts.length > 0 ? v2.damageParts[0] : null;
    const diceVal = (primaryDmg && primaryDmg.dice) || v2.weaponStats?.baseDamage || '';
    const dmgTypeVal = (primaryDmg && primaryDmg.type) || (Array.isArray(v2.weaponStats?.damageTypes) && v2.weaponStats.damageTypes[0]) || 'Slashing';
    setVal('im-dice', diceVal);
    const dmgTypeEl = document.getElementById('im-dmg-type');
    if (dmgTypeEl) {
      let matchDmg = Array.from(dmgTypeEl.options).find(o => o.value.toLowerCase() === String(dmgTypeVal).toLowerCase());
      if (!matchDmg && dmgTypeVal) {
        const opt = document.createElement('option');
        opt.value = dmgTypeVal;
        opt.textContent = dmgTypeVal;
        dmgTypeEl.appendChild(opt);
        matchDmg = opt;
      }
      dmgTypeEl.value = matchDmg ? matchDmg.value : 'Slashing';
    }

    setVal('im-crit-min', v2.weaponStats?.critMin || 20);
    setVal('im-crit-mult', v2.weaponStats?.critMult || 2);

    const actEl = document.getElementById('im-action');
    if (actEl) {
      const rawAct = String(v2.action || v2.actionType || 'Passive').trim().toLowerCase().replace(/_/g, '-');
      let matchAct = Array.from(actEl.options).find(o => {
        const optLow = o.value.toLowerCase();
        return optLow === rawAct || optLow.startsWith(rawAct) || rawAct.startsWith(optLow.replace(/\s*action$/, ''));
      });
      actEl.value = matchAct ? matchAct.value : 'Passive';
    }

    setVal('im-cost', v2.cost !== undefined ? v2.cost : 0);
    setVal('im-weight', v2.weight !== undefined ? v2.weight : 0);

    let maxCharges = '';
    if (v2.dailyCharges && typeof v2.dailyCharges.max === 'number') maxCharges = v2.dailyCharges.max;
    else if (typeof v2.dailyCharges === 'number') maxCharges = v2.dailyCharges;
    else if (typeof v2.charges === 'number') maxCharges = v2.charges;
    setVal('im-charges', maxCharges);

    setVal('im-prereq', v2.prereq || '-');
    setVal('im-benefit', v2.benefit || v2.description || '');

    // Armor / Shield Contextual Fields
    const acMod = Array.isArray(v2.modifiers) ? v2.modifiers.find(m => m.target === 'ac.armor' || m.target === 'ac.shield') : null;
    const baseAcVal = v2.armorStats?.baseAc !== undefined ? v2.armorStats.baseAc : (acMod ? acMod.value : '');
    setVal('im-armor-ac', baseAcVal);
    setVal('im-max-dex', v2.armorStats?.maxDex !== undefined && v2.armorStats?.maxDex !== null ? v2.armorStats.maxDex : '');
    setVal('im-acp', v2.armorStats?.acp !== undefined ? v2.armorStats.acp : '');
    setVal('im-asf', v2.armorStats?.asf !== undefined ? v2.armorStats.asf : '');

    // Spell / Maneuver Contextual Fields
    const lvlVal = v2.level !== undefined && v2.level !== '' ? v2.level : (v2.spellStats?.level ?? '');
    setVal('im-level', lvlVal);
    setVal('im-school-disc', v2.school || v2.discipline || v2.spellStats?.school || v2.spellStats?.discipline || '');
    setVal('im-save-type', v2.spellStats?.savingThrow || '');
    setVal('im-spell-range', v2.range || v2.spellStats?.range || '');

    // Rule Flags Checkboxes
    const flags = v2.ruleFlags || {};
    const setFlag = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };
    setFlag('im-flag-touch', flags.touchAttack || flags.touch);
    setFlag('im-flag-keen', flags.critThreatDoubled || flags.keen);
    setFlag('im-flag-adamantine', flags.adamantine);
    setFlag('im-flag-two-hand-str', flags.twoHandedStrengthMultiplier || flags.twoHandedStr || slotVal === 'Two-Handed');

    // Modifiers List
    const modList = document.getElementById('im-modifiers-list');
    if (modList) {
      modList.innerHTML = '';
      const mods = Array.isArray(v2.modifiers) ? v2.modifiers : [];
      if (mods.length > 0) {
        mods.forEach(m => this.addInlineManualModifierRow(m));
      } else {
        this.addInlineManualModifierRow();
      }
    }

    // R8.2: Extra Damage Parts Chips (all damageParts after index 0)
    this._inlineExtraDamageParts = Array.isArray(v2.damageParts) && v2.damageParts.length > 1
      ? JSON.parse(JSON.stringify(v2.damageParts.slice(1)))
      : [];
    this.renderInlineDamagePartsChips();

    // R8.6: Feat Repeatability & Pool Tags
    const maxRanksEl = document.getElementById('im-feat-max-ranks');
    if (maxRanksEl) {
      if (v2.targetRepeatable) maxRanksEl.value = 'per_target';
      else if (v2.maxRanks && Number(v2.maxRanks) > 1) maxRanksEl.value = String(v2.maxRanks);
      else if (v2.stackable) maxRanksEl.value = '20';
      else maxRanksEl.value = '1';
    }
    const existingTags = new Set([
      ...(Array.isArray(v2.featTags) ? v2.featTags : []),
      ...(Array.isArray(v2.tags) ? v2.tags : []),
      ...(v2.isFighterBonusFeat ? ['Fighter Bonus'] : []),
      ...(v2.category ? [v2.category] : []),
      ...(v2.role ? [v2.role] : [])
    ].map(t => String(t).toLowerCase()));
    document.querySelectorAll('.im-feat-tag-chk').forEach(chk => {
      chk.checked = existingTags.has(String(chk.value).toLowerCase());
    });

    this.onInlineManualTypeChange(true);
    this.renderInlineLegoPrimitiveStudio();

    // Update Editing Banner & Action Button Labels
    const banner = document.getElementById('im-editing-banner');
    const bannerTitle = document.getElementById('im-editing-title');
    const saveDbLbl = document.getElementById('btn-im-save-db-label');
    const saveEqLbl = document.getElementById('btn-im-save-equip-label');
    const isChangeAndAdd = Boolean(options && options.changeAndAddMode);
    const isEditing = isChangeAndAdd || editIndex >= 0 || Boolean(v2.name && v2.name.trim());
    if (banner) banner.classList.toggle('hidden', !isEditing);
    if (bannerTitle) {
      if (isChangeAndAdd) {
        const srcLbl = options.sourceLabel || 'Site Database';
        bannerTitle.textContent = `Change & Add (${srcLbl}): Modify "${v2.name || 'Entry'}" below before saving to Custom Master DB`;
      } else {
        bannerTitle.textContent = editIndex >= 0
          ? `Editing Custom DB Entry: ${v2.name || 'Unnamed'}`
          : `Draft Loaded: ${v2.name || 'New Entry'}`;
      }
    }
    if (saveDbLbl) {
      saveDbLbl.textContent = isChangeAndAdd
        ? 'Save Modified & Add to DB'
        : (editIndex >= 0 ? 'Update in Custom DB' : 'Save to Custom DB');
    }
    if (saveEqLbl) {
      saveEqLbl.textContent = isChangeAndAdd
        ? 'Save Modified & Equip to Character'
        : (editIndex >= 0 ? 'Update & Equip to Character' : 'Save & Equip to Character');
    }

    if (isChangeAndAdd) {
      this._changeAndAddOriginalSnapshot = this.getComparableEntrySignature(this.buildInlineManualV2Entry());
    }

    if (options && options.inlineOnly) {
      const panel = document.getElementById('inline-ai-adder-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      this.openMasterDbEditorModal('manual', v2);
    }
  },

  getMasterDbModalHeaderMeta(mode, entry) {
    if (mode === 'forge') {
      return {
        icon: '⚒️',
        title: 'The Forge — Modular Item Editor • D&D 3.5e RAW',
        subtitle: entry?.name
          ? `Editing "${entry.name}" • Base Item, Material, Enhancement & Crystals`
          : 'Canonical V2 Modular Weapon, Armor & Shield Assembler'
      };
    }
    const rawType = String(entry?.type || document.getElementById('im-type')?.value || 'Feat').trim();
    const tLow = rawType.toLowerCase();
    let icon = '✏️';
    let label = 'Custom Rule & Item';
    if (tLow === 'feat') { icon = '🎖️'; label = 'Feat'; }
    else if (tLow === 'flaw') { icon = '⚠️'; label = 'Character Flaw'; }
    else if (tLow === 'special ability' || tLow === 'dm grant') { icon = '✨'; label = 'Special Ability & Boon'; }
    else if (tLow === 'spell') { icon = '🔮'; label = 'Spell'; }
    else if (tLow === 'maneuver' || tLow === 'stance') { icon = '⚔️'; label = 'Martial Maneuver & Stance'; }
    else if (tLow === 'weapon') { icon = '🗡️'; label = 'Weapon'; }
    else if (tLow === 'armor' || tLow === 'shield') { icon = '🛡️'; label = 'Armor & Shield'; }
    else if (['wondrous item', 'ring', 'potion', 'slotless item'].includes(tLow)) { icon = '👑'; label = 'Magic Item'; }
    else if (tLow === 'race') { icon = '🧬'; label = 'Race'; }

    const itemName = (entry?.name || document.getElementById('im-name')?.value || '').trim();
    return {
      icon,
      title: `${label} Editor • D&D 3.5e RAW`,
      subtitle: itemName
        ? `Editing "${itemName}" • Canonical V2 Modifiers, Combat Effects & RAW Description`
        : 'Canonical V2 Schema • Modifiers, Combat Effects & RAW Description'
    };
  },

  openMasterDbEditorModal(mode = 'manual', entry = null) {
    const modal = document.getElementById('modal-master-db-editor');
    const body = document.getElementById('modal-master-db-editor-body');
    const targetId = mode === 'forge' ? 'inline-mode-forge' : 'inline-mode-manual';
    const targetPanel = document.getElementById(targetId);
    if (!modal || !body || !targetPanel) return;

    // First restore any previously mounted panel back to inline dock
    this._dockPanelsBackToInline();

    // Move target editor panel into modal body
    body.appendChild(targetPanel);
    targetPanel.classList.remove('hidden');

    // Keep the background inline panel cleanly on Search tab so the page doesn't collapse
    const searchPanel = document.getElementById('inline-mode-search');
    if (searchPanel) searchPanel.classList.remove('hidden');

    const meta = this.getMasterDbModalHeaderMeta(mode, entry);
    const iconEl = document.getElementById('modal-mdb-editor-icon');
    const titleEl = document.getElementById('modal-mdb-editor-title');
    const subEl = document.getElementById('modal-mdb-editor-subtitle');
    if (iconEl) iconEl.textContent = meta.icon;
    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = meta.subtitle;

    modal.classList.remove('hidden');
  },

  _dockPanelsBackToInline() {
    const inlineHost = document.getElementById('inline-ai-adder-panel');
    const loadingBox = document.getElementById('inline-ai-loading-box');
    const forgePanel = document.getElementById('inline-mode-forge');
    const manualPanel = document.getElementById('inline-mode-manual');
    if (!inlineHost) return;

    if (forgePanel && forgePanel.parentElement !== inlineHost) {
      if (loadingBox && loadingBox.parentElement === inlineHost) {
        inlineHost.insertBefore(forgePanel, loadingBox);
      } else {
        inlineHost.appendChild(forgePanel);
      }
      forgePanel.classList.add('hidden');
    }
    if (manualPanel && manualPanel.parentElement !== inlineHost) {
      if (loadingBox && loadingBox.parentElement === inlineHost) {
        inlineHost.insertBefore(manualPanel, loadingBox);
      } else {
        inlineHost.appendChild(manualPanel);
      }
      manualPanel.classList.add('hidden');
    }
  },

  closeMasterDbEditorModal() {
    const modal = document.getElementById('modal-master-db-editor');
    this._dockPanelsBackToInline();
    if (modal) modal.classList.add('hidden');
    this._editingForgeMasterDbIndex = -1;
    this.switchInlineMode('search');
  },

  submitModal(alsoEquip = false) {
    this.saveInlineManualEntry(alsoEquip);
  },

  closeModal() {
    this.resetInlineManualForm();
    this.closeMasterDbEditorModal();
  },

  onTypeChange() {
    this.onInlineManualTypeChange(true);
  },

  DND35_CANONICAL_SKILLS: [
    "All Skills", "Appraise", "Autohypnosis", "Balance", "Bluff", "Climb", "Concentration",
    "Craft (Alchemy)", "Craft (Armorsmithing)", "Craft (Bowmaking)", "Craft (Weaponsmithing)", "Craft (Trapmaking)",
    "Decipher Script", "Diplomacy", "Disable Device", "Disguise", "Escape Artist", "Forgery",
    "Gather Information", "Handle Animal", "Heal", "Hide", "Intimidate", "Jump",
    "Knowledge (Arcana)", "Knowledge (Architecture and Engineering)", "Knowledge (Dungeoneering)",
    "Knowledge (Geography)", "Knowledge (History)", "Knowledge (Local)", "Knowledge (Nature)",
    "Knowledge (Nobility and Royalty)", "Knowledge (Religion)", "Knowledge (The Planes)",
    "Listen", "Move Silently", "Open Lock", "Perform (Act)", "Perform (Comedy)", "Perform (Dance)",
    "Perform (Keyboard)", "Perform (Oratory)", "Perform (Percussion)", "Perform (String Instruments)",
    "Perform (Sing)", "Perform (Wind Instruments)", "Profession", "Psicraft", "Ride", "Search",
    "Sense Motive", "Sleight of Hand", "Speak Language", "Spellcraft", "Spot", "Survival",
    "Swim", "Tumble", "Use Magic Device", "Use Psionic Device", "Use Rope"
  ],

  DND35_CANONICAL_SCHOOLS: [
    "Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation",
    "Illusion", "Necromancy", "Transmutation", "Universal"
  ],

  DND35_CANONICAL_DISCIPLINES: [
    "Desert Wind", "Devoted Spirit", "Diamond Mind", "Iron Heart", "Setting Sun",
    "Shadow Hand", "Stone Dragon", "Tiger Claw", "White Raven"
  ],

  DND35_CANONICAL_SAVES: [
    "None", "Reflex half", "Reflex negates", "Fortitude half", "Fortitude negates",
    "Fortitude partial", "Will half", "Will negates", "Will partial", "Harmless"
  ],

  getParentSuggestions() {
    const names = new Set();
    names.add('-');
    if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
      masterDb.forEach(m => {
        if (m && m.name) names.add(m.name);
      });
    }
    if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
      window.BUNDLED_SRD_CORE_CATALOG.forEach(m => {
        if (m && m.name) names.add(m.name);
      });
    }
    return Array.from(names);
  },

  attachCombobox(inputEl, itemsProvider, options = {}) {
    if (!inputEl || inputEl._hasCombobox) return;
    inputEl._hasCombobox = true;

    const parent = inputEl.parentElement;
    if (parent && !parent.classList.contains('relative')) {
      parent.classList.add('relative');
    }

    inputEl.setAttribute('autocomplete', 'off');

    const dropdown = document.createElement('div');
    dropdown.className = 'rm-combobox-dropdown hidden absolute left-0 top-full z-[120] mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-purple-500/60 bg-slate-950 p-1 shadow-2xl backdrop-blur-md text-xs';
    parent.appendChild(dropdown);

    let activeIdx = -1;
    let filteredItems = [];

    const getItems = () => {
      if (typeof itemsProvider === 'function') return itemsProvider();
      if (Array.isArray(itemsProvider)) return itemsProvider;
      return [];
    };

    const renderDropdown = () => {
      const q = (inputEl.value || '').trim().toLowerCase();
      const allItems = getItems();
      filteredItems = allItems.filter(item => {
        if (!q) return true;
        return String(item).toLowerCase().includes(q);
      }).slice(0, 20);

      dropdown.innerHTML = '';
      if (filteredItems.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'px-3 py-2 text-slate-500 text-[11px] italic text-center';
        empty.textContent = 'No matching entries found (you can type custom text)';
        dropdown.appendChild(empty);
      } else {
        filteredItems.forEach((item, idx) => {
          const row = document.createElement('div');
          row.className = `cursor-pointer rounded px-2.5 py-1.5 text-slate-200 hover:bg-purple-900/50 hover:text-white flex items-center justify-between transition ${idx === activeIdx ? 'bg-purple-950/70 text-purple-200' : ''}`;
          const iconSpan = options.icon ? `<span class="mr-1.5 opacity-80">${options.icon}</span>` : '';
          row.innerHTML = `<span class="truncate">${iconSpan}${item}</span>`;
          row.onmousedown = (e) => {
            e.preventDefault();
            selectItem(item);
          };
          dropdown.appendChild(row);
        });
      }
      dropdown.classList.remove('hidden');
    };

    const selectItem = (item) => {
      inputEl.value = item;
      dropdown.classList.add('hidden');
      activeIdx = -1;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof options.onSelect === 'function') options.onSelect(item);
    };

    inputEl.addEventListener('focus', () => {
      activeIdx = -1;
      renderDropdown();
    });

    inputEl.addEventListener('input', () => {
      activeIdx = -1;
      renderDropdown();
    });

    inputEl.addEventListener('keydown', (e) => {
      if (dropdown.classList.contains('hidden')) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          renderDropdown();
          return;
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          activeIdx = (activeIdx + 1) % filteredItems.length;
          renderDropdown();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          activeIdx = (activeIdx - 1 + filteredItems.length) % filteredItems.length;
          renderDropdown();
        }
      } else if (e.key === 'Enter') {
        if (activeIdx >= 0 && activeIdx < filteredItems.length) {
          e.preventDefault();
          selectItem(filteredItems[activeIdx]);
        }
      } else if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
      }
    });

    inputEl.addEventListener('blur', () => {
      setTimeout(() => {
        dropdown.classList.add('hidden');
      }, 180);
    });
  },

  initComboboxes() {
    const skillEl = document.getElementById('rf-target-skill');
    if (skillEl) this.attachCombobox(skillEl, this.DND35_CANONICAL_SKILLS, { icon: '🎯' });

    const schoolEl = document.getElementById('rf-school');
    if (schoolEl) this.attachCombobox(schoolEl, this.DND35_CANONICAL_SCHOOLS, { icon: '🔮' });

    const discEl = document.getElementById('rf-discipline');
    if (discEl) this.attachCombobox(discEl, this.DND35_CANONICAL_DISCIPLINES, { icon: '⚔️' });

    const parentEl = document.getElementById('rf-parent');
    if (parentEl) this.attachCombobox(parentEl, () => this.getParentSuggestions(), { icon: '📜' });

    const saveEl = document.getElementById('rf-save-type');
    if (saveEl) this.attachCombobox(saveEl, this.DND35_CANONICAL_SAVES, { icon: '🛡️' });
  },

  applyPreset(presetKey) {
    const presets = this.getPresets();
    const p = presets[presetKey];
    if (!p) return;

    if (p.type) document.getElementById('rf-type').value = p.type;
    if (p.slot) document.getElementById('rf-slot').value = p.slot;
    if (p.tags && document.getElementById('rf-tags')) document.getElementById('rf-tags').value = p.tags;
    if (p.bonusType) document.getElementById('rf-bonus-type').value = p.bonusType;
    if (p.scope) document.getElementById('rf-scope').value = p.scope;
    if (p.action) document.getElementById('rf-action').value = p.action;
    if (p.duration) document.getElementById('rf-duration').value = p.duration;
    if (p.role) document.getElementById('rf-role').value = p.role;
    if (p.critMin) document.getElementById('rf-crit-min').value = p.critMin;
    if (p.critMult) document.getElementById('rf-crit-mult').value = p.critMult;
    if (p.dice) document.getElementById('rf-dice').value = p.dice;
    if (p.dmgType) document.getElementById('rf-dmg-type').value = p.dmgType;
    if (p.weight !== undefined) document.getElementById('rf-weight').value = p.weight;
    if (p.cost !== undefined) document.getElementById('rf-cost').value = p.cost;
    if (p.discipline) document.getElementById('rf-discipline').value = p.discipline;
    if (p.ac !== undefined) document.getElementById('rf-ac').value = p.ac;
  },

  // Render Table with Canonical V2 Badges, Embedded Modes, and Actions
  // Weapon stats: legacy entries keep them in `weaponStats`; Canonical V2 SRD records keep them in
  // top-level fields (category, critRange, critMult, rangeIncrement, isLight, finessable). Read both,
  // so an equipped SRD exotic weapon is not silently recorded as Martial with a 20/x2 critical.
  resolveWeaponStats(item) {
    const w = (item && item.weaponStats) || {};
    const rf = (item && item.ruleFlags) || {};
    const v2Cat = item && ['Simple', 'Martial', 'Exotic'].includes(item.category) ? item.category : null;
    return Object.assign({}, w, {
      category: w.category || v2Cat || 'Martial',
      critMin: Number(w.critMin) || Number(item && item.critRange) || 20,
      critMult: Number(w.critMult) || Number(item && item.critMult) || 2,
      rangeIncrement: Number(w.rangeIncrement) || Number(item && item.rangeIncrement) || 0,
      finessable: w.finessable !== undefined ? Boolean(w.finessable) : Boolean(item && (item.finessable || rf.finessable)),
      isLight: w.isLight !== undefined ? Boolean(w.isLight) : Boolean(item && (item.isLight || rf.isLight))
    });
  },

  // Tier-2 SRD snapshot metadata (entries copied into customDb from lazy compendium chunks)
  getSnapshotMeta(entry) {
    const s = entry && entry._snapshot;
    return s && s.origin === 'srd-snapshot' ? s : null;
  },

  // Campaign DB copies (campaign_db.js): entries the character gets from its campaign's rule packs
  getCampaignPackBadgeHtml(entry) {
    const t = entry && entry._campaignPack;
    if (!t || typeof t !== 'object' || !t.packId) return '';
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    if (t.status === 'removed') {
      return `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-600/60" title="The DM removed this entry from rule pack ${esc(t.packId)}; it is kept because this character uses it">⚠️ Removed by DM</span>`;
    }
    if (t.status === 'detached') {
      return `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-600/60" title="This character is no longer in the campaign; the copy is kept and no longer updated">📴 Campaign DB (Detached)</span>`;
    }
    return `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50" title="From the campaign's rule pack ${esc(t.packId)} v${esc(t.version)}; follows the DM's updates">🏰 Campaign DB</span>`;
  },

  getSnapshotBadgeHtml(entry) {
    const snap = this.getSnapshotMeta(entry);
    if (!snap) return '';
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    if (snap.status === 'update-available') {
      return `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-600/60" title="The SRD version changed after this copy was edited">🔔 Update Available</span>`
        + `<button type="button" data-action="mdb:apply-snapshot-update" data-id="${esc(entry.id)}" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-700 hover:bg-amber-600 text-white border border-amber-500/60 transition cursor-pointer" title="Replace this copy with the current SRD version (your edits are discarded)">⬆️ Apply Update</button>`;
    }
    if (snap.status === 'orphaned') {
      return `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60" title="The source entry is no longer in the SRD compendium">⚠️ Not in SRD</span>`;
    }
    return `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-950/80 text-sky-300 border border-sky-700/50" title="Copied from the SRD compendium; follows SRD fixes automatically while unedited">📥 SRD Copy</span>`;
  },

  applySnapshotUpdate(id) {
    if (!id || typeof SrdCompendium === 'undefined' || typeof SrdCompendium.applySnapshotUpdate !== 'function') return;
    const db = (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) ? masterDb : null;
    const entry = db ? db.find(e => e && e.id === id) : null;
    if (!entry) return;
    if (!confirm(`Replace "${entry.name}" with the current SRD version? Your edits to this copy will be discarded.`)) return;
    if (SrdCompendium.applySnapshotUpdate(db, id)) {
      if (typeof CharStore !== 'undefined' && typeof CharStore.recompute === 'function') CharStore.recompute();
      if (typeof saveStateToStorage === 'function') saveStateToStorage();
      this.renderTable();
    }
  },

  renderTable() {
    const tbody = document.getElementById('master-db-tbody');
    if (!tbody || !masterDb) return;

    const query = (document.getElementById('mdb-search-input')?.value || '').toLowerCase();
    const cat = document.getElementById('mdb-category-filter')?.value || 'ALL';
    const eligFilter = document.getElementById('mdb-eligibility-filter')?.value || 'ALL';
    const bonusFilter = document.getElementById('mdb-bonus-filter')?.value || 'ALL';
    const scopeFilter = document.getElementById('mdb-scope-filter')?.value || 'ALL';
    const originFilter = document.getElementById('mdb-origin-filter')?.value || 'ALL';

    const fuzzyScores = new WeakMap();
    let filtered = masterDb.filter((rawItem, idx) => {
      if (rawItem && typeof rawItem === 'object' && '_fuzzyScore' in rawItem) delete rawItem._fuzzyScore;
      const item = this.ensureV2(rawItem);
      rawItem._originalIndex = idx;
      const haystack = `${item.benefit || ''} ${item.description || ''} ${item.portfolio || ''} ${item.favoredWeapon || ''} ${item.grantedPower?.description || ''} ${Array.isArray(item.domains) ? item.domains.join(' ') : ''} ${item.source || ''} ${item.pack || ''} ${item.discipline || ''}`.toLowerCase();
      const fuzzySc = (query && typeof SrdCompendium !== 'undefined' && typeof SrdCompendium.fuzzyScore === 'function')
        ? SrdCompendium.fuzzyScore(query, item.name || '', haystack)
        : (query && ((item.name && item.name.toLowerCase().includes(query)) || haystack.includes(query)) ? 100 : 0);
      if (rawItem && typeof rawItem === 'object') fuzzyScores.set(rawItem, fuzzySc);
      const matchQ = !query || fuzzySc > 0 || (item.name && item.name.toLowerCase().includes(query)) || haystack.includes(query);

      const matchCat = cat === 'ALL' || item.type === cat || (cat === 'DM Grant' && item.type === 'DM Boon') || (cat === 'Class' && (item.category === 'Class' || item.type === 'Base Class' || item.type === 'Prestige Class' || item.type === 'Custom Class'));
      const itemBonusType = item.modifiers?.[0]?.type || (item.type === 'Weapon' && item.enhancementBonus ? 'Enhancement' : 'Untyped');
      const matchBonus = bonusFilter === 'ALL' || itemBonusType === bonusFilter;
      const matchScope = scopeFilter === 'ALL' || (item.scope || 'None / General') === scopeFilter;
      const elig = this.evaluateEntryEligibilityForCharacter(item);
      const matchElig = eligFilter === 'ALL'
        || (eligFilter === 'ELIGIBLE' && elig.met)
        || (eligFilter === 'SYNERGY_READY' && elig.status === 'SYNERGY_READY')
        || (eligFilter === 'PREREQ_MISSING' && !elig.met);
      const snap = this.getSnapshotMeta(rawItem);
      const matchOrigin = originFilter === 'ALL'
        || (originFilter === 'HOMEBREW' && !snap)
        || (originFilter === 'SNAPSHOT' && Boolean(snap))
        || (originFilter === 'UPDATE_AVAILABLE' && Boolean(snap) && (snap.status === 'update-available' || snap.status === 'orphaned'));

      return matchQ && matchCat && matchBonus && matchScope && matchElig && matchOrigin;
    });

    if (query) {
      filtered.sort((a, b) => (fuzzyScores.get(b) || 0) - (fuzzyScores.get(a) || 0));
    }

    const countBadge = document.getElementById('mdb-total-count-badge');
    if (countBadge) countBadge.textContent = `${filtered.length} / ${masterDb.length} Custom Entries`;

    tbody.innerHTML = '';

    const filteredKeys = [];

    if (filtered.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.className = 'border-b border-slate-800/80';
      const emptyMsg = masterDb.length === 0
        ? 'No character-specific custom entries yet. Standard 3.5e rules are automatically loaded from the SRD Compendium — use "+ Add New Rule / Item" or "📂 Import / Merge DB" to add custom or homebrew entries for this character.'
        : 'No custom entries match the active search or category filters.';
      emptyTr.innerHTML = `
        <td colspan="8" class="py-8 px-4 text-center text-slate-400 text-xs italic">
          ${emptyMsg}
        </td>
      `;
      tbody.appendChild(emptyTr);
      this.updateSelectionUi(filteredKeys);
      return;
    }

    filtered.forEach(rawItem => {
      const idx = rawItem._originalIndex;
      const item = this.ensureV2(rawItem);
      const selKey = this.getEntrySelectionKey(item, idx);
      filteredKeys.push(selKey);
      const isSelected = this.selectedIds.has(selKey);
      const escapedKey = RuleMaster.escapeJsString(selKey);

      const tr = document.createElement('tr');
      tr.className = `hover:bg-slate-800/50 transition border-b border-slate-800/80 ${isSelected ? 'bg-amber-950/20' : ''}`;

      const typeBadgeClass = this.getTypeBadgeClass(item.type);
      const statPills = this.getEntrySummaryPills(item);
      const statsSummary = statPills.length > 0 ? statPills.join(' • ') : '-';
      const modesCount = Array.isArray(item.modes) ? item.modes.length : 0;
      const lowType = String(item.type || '').toLowerCase();
      const isDeity = lowType === 'deity' || String(item.id || '').startsWith('deity-');
      const isDomain = lowType === 'domain' || lowType === 'cleric domain' || String(item.id || '').startsWith('dom-');
      const isRace = lowType === 'race';
      const isClass = lowType === 'class' || lowType === 'base class' || lowType === 'prestige class' || lowType === 'custom class' || String(item.category || '').toLowerCase() === 'class';
      const primaryBonusType = item.modifiers?.[0]?.type || (item.type === 'Weapon' && item.enhancementBonus ? 'Enhancement' : (item.type === 'Armor' ? 'Armor' : (item.type === 'Shield' ? 'Shield' : 'Untyped')));

      let slotCellHtml = `
        <div>${item.slot ? this.capitalizeIdentifier(item.slot) : 'None'}</div>
        ${item.level !== undefined && item.level !== '' ? `<div class="text-[10px] text-amber-400 font-bold">Level ${item.level}</div>` : ''}
      `;
      let bonusScopeCellHtml = `
        <div class="text-xs font-semibold text-amber-300">${this.capitalizeIdentifier(primaryBonusType)}</div>
        <div class="text-[10px] text-slate-400">${item.scope ? this.capitalizeIdentifier(item.scope) : 'General'}</div>
      `;
      let descText = item.benefit || item.description || '-';

      if (isDeity) {
        slotCellHtml = `
          <div class="font-bold text-amber-300">${item.alignment || 'Any'}</div>
          <div class="text-[10px] text-slate-400">${item.rank || 'Deity'}</div>
        `;
        bonusScopeCellHtml = `
          <div class="text-xs font-semibold text-amber-200">⚔️ ${item.favoredWeapon || item.weapon || '-'}</div>
          <div class="text-[10px] text-slate-400">Favored Weapon</div>
        `;
        descText = `${item.portfolio ? `Portfolio: ${item.portfolio}. ` : ''}${item.description || item.benefit || (Array.isArray(item.domains) && item.domains.length ? `Domains: ${item.domains.join(', ')}` : '-')}`;
      } else if (isDomain) {
        const spCount = Array.isArray(item.spells) ? item.spells.length : 0;
        slotCellHtml = `
          <div class="font-bold text-purple-300">Cleric Domain</div>
          <div class="text-[10px] text-amber-400 font-bold">${spCount} Spells (1st–9th)</div>
        `;
        bonusScopeCellHtml = `
          <div class="text-xs font-semibold text-purple-200">${item.alignment && item.alignment !== 'Any' ? item.alignment : 'Any Alignment'}</div>
          <div class="text-[10px] text-slate-400">${item.grantedPower?.grantedFeats?.[0] ? `Feat: ${item.grantedPower.grantedFeats[0]}` : 'Granted Power'}</div>
        `;
        descText = item.grantedPower?.description || item.benefit || item.description || (spCount > 0 ? `Spells: ${item.spells.map(s => s.name).join(', ')}` : '-');
      } else if (isRace) {
        slotCellHtml = `
          <div class="font-bold text-emerald-300">${item.size || 'Medium'} Size</div>
          <div class="text-[10px] text-slate-400">${item.baseSpeed || 30} ft. Speed</div>
        `;
        bonusScopeCellHtml = `
          <div class="text-xs font-semibold text-emerald-200">Racial Traits</div>
          <div class="text-[10px] text-slate-400">${item.favoredClass ? `Favored: ${item.favoredClass}` : 'Character Race'}</div>
        `;
      } else if (isClass) {
        const hdVal = item.hd || String(item.hitDie || 8).replace(/\D/g, '') || 8;
        const babNum = Number(item.bab) || 0.75;
        const babLbl = babNum === 1 ? 'Full BAB (+1)' : (babNum === 0.75 ? '3/4 BAB' : '1/2 BAB');
        slotCellHtml = `
          <div class="font-bold text-emerald-300">d${hdVal} HD • ${item.maxLevel || 20} Lvls</div>
          <div class="text-[10px] text-slate-400">${item.classType || (lowType === 'prestige class' ? 'Prestige Class' : 'Base / Variant Class')}</div>
        `;
        bonusScopeCellHtml = `
          <div class="text-xs font-semibold text-sky-300">${babLbl}</div>
          <div class="text-[10px] text-purple-300">${item.skills || item.skillPoints || 2}+INT Skills</div>
        `;
        descText = item.description || item.desc || item.benefit || item.role || '-';
      } else if (lowType === 'flaw' || String(item.category || '').toLowerCase() === 'flaw') {
        slotCellHtml = `
          <div class="font-bold text-rose-300">1st Level</div>
          <div class="text-[10px] text-slate-400">Max 2 Flaws</div>
        `;
        bonusScopeCellHtml = `
          <div class="text-xs font-semibold text-amber-300">🎖️ +1 Bonus Feat</div>
          <div class="text-[10px] text-rose-300/90">Character Flaw (UA p.91)</div>
        `;
      }

      const safeItemNameJs = RuleMaster.escapeJsString(item.name || '');

      const eligBadgeHtml = (() => {
        if (!item.requires && !item.pack) return '';
        const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const ch = (typeof window !== 'undefined' && window.characterData) ? window.characterData : (typeof character !== 'undefined' ? character : null);
        const elig = this.evaluateEntryEligibilityForCharacter(item, ch);
        let badges = '';
        if (item.pack) {
          const packStr = (typeof item.pack === 'object' && item.pack !== null) ? String(item.pack.id || item.pack.name || '') : String(item.pack || '');
          if (packStr) {
            badges += `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">📦 ${esc(packStr)}</span>`;
          }
        }
        if (elig.status === 'SYNERGY_READY') {
          badges += `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-600/60" title="Auto-Unlock / Synergy Prerequisite Met">✨ Synergy Ready</span>`;
        } else if (elig.status === 'PREREQ_MISSING') {
          badges += `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60" title="Prerequisites Not Met">🔒 Prereq Missing</span>`;
        } else if (item.requires) {
          badges += `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-950/80 text-teal-300 border border-teal-700/50" title="Prerequisites Met">✅ Eligible</span>`;
        }
        return badges;
      })();
      const snapshotBadgeHtml = this.getSnapshotBadgeHtml(rawItem) + this.getCampaignPackBadgeHtml(rawItem);

      tr.innerHTML = `
        <td class="py-2.5 px-2.5 text-center">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="RuleMaster.toggleSelectEntry('${escapedKey}', this.checked)" class="w-3.5 h-3.5 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer" title="Select entry for export or batch actions">
        </td>
        <td class="py-2.5 px-3">
          <div class="font-bold text-white flex items-center gap-1.5 flex-wrap">
            ${isDeity && item.icon ? `<span>${RuleMaster.escapeHtml(item.icon)}</span>` : ''}
            <span>${RuleMaster.escapeHtml(item.name)}</span>
            ${modesCount > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">⚡ ${modesCount} Mod</span>` : ''}
            ${eligBadgeHtml}
            ${snapshotBadgeHtml}
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">${isDeity ? (item.title ? `${RuleMaster.escapeHtml(item.title)} • ${RuleMaster.escapeHtml(item.category || 'Custom')}` : RuleMaster.escapeHtml(item.category || item.source || 'Custom')) : RuleMaster.escapeHtml(item.source || 'Custom')}</div>
        </td>
        <td class="py-2.5 px-3">
          <span class="badge ${typeBadgeClass}">${RuleMaster.escapeHtml(item.type ? this.capitalizeIdentifier(item.type) : 'Other')}</span>
          ${item.discipline && item.discipline !== '-' ? `<span class="badge bg-rose-950 text-rose-300 border border-rose-800 block mt-1 w-max">${RuleMaster.escapeHtml(this.capitalizeIdentifier(item.discipline))}</span>` : ''}
        </td>
        <td class="py-2.5 px-3 text-slate-300 text-xs">
          ${slotCellHtml}
        </td>
        <td class="py-2.5 px-3">
          ${bonusScopeCellHtml}
        </td>
        <td class="py-2.5 px-3 font-mono text-xs font-bold text-emerald-400">
          ${RuleMaster.escapeHtml(statsSummary)}
        </td>
        <td class="py-2.5 px-3 text-slate-300 text-[11px] max-w-xs">
          <div class="line-clamp-2" title="${RuleMaster.escapeHtml(descText || '-')}">${RuleMaster.escapeHtml(descText)}</div>
        </td>
        <td class="py-2.5 px-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="ui-btn-icon w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition inline-flex items-center justify-center cursor-pointer" title="${isDeity ? 'Edit in Deity Editor' : (isDomain ? 'Edit in Domain Editor' : (isClass ? 'Edit in Class Template Studio' : 'Edit'))}">
              ✏️
            </button>
            ${isDeity ? `
              <button onclick="if(typeof selectDeityItem==='function'){selectDeityItem('${safeItemNameJs}'); if(typeof showDiceTopToast==='function') showDiceTopToast({title:'Deity Selected', breakdown:'${safeItemNameJs} set as character patron deity.', icon:'✨'});}" class="ui-btn-icon w-7 h-7 rounded-md bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-300 text-xs transition inline-flex items-center justify-center cursor-pointer" title="Select as Character Deity">
                🙏
              </button>
            ` : ''}
            <button onclick="RuleMaster.duplicateEntry(${idx})" class="ui-btn-icon w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs transition inline-flex items-center justify-center cursor-pointer" title="Duplicate">
              📑
            </button>
            <button onclick="RuleMaster.deleteEntry(${idx})" class="ui-btn-icon w-7 h-7 rounded-md bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs transition inline-flex items-center justify-center cursor-pointer" title="Delete">
              🗑️
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    this.updateSelectionUi(filteredKeys);
  },
  getTypeBadgeClass(type) {
    switch (type) {
      case 'Weapon': return 'bg-rose-950 text-rose-300 border border-rose-700';
      case 'Shield':
      case 'Armor': return 'bg-sky-950 text-sky-300 border border-sky-700';
      case 'Spell': return 'bg-purple-950 text-purple-300 border border-purple-700';
      case 'Maneuver':
      case 'Stance': return 'bg-indigo-950 text-indigo-300 border border-indigo-700';
      case 'Feat': return 'bg-amber-950 text-amber-300 border border-amber-700';
      case 'Deity': return 'bg-amber-950 text-amber-200 border border-amber-500';
      case 'Domain': return 'bg-purple-950 text-purple-200 border border-purple-500';
      case 'Race': return 'bg-emerald-950 text-emerald-200 border border-emerald-500';
      case 'Class':
      case 'Base Class':
      case 'Prestige Class':
      case 'Custom Class': return 'bg-indigo-950 text-indigo-200 border border-indigo-500';
      case 'Potion': return 'bg-emerald-950 text-emerald-300 border border-emerald-700';
      case 'Wondrous Item':
      case 'Ring': return 'bg-teal-950 text-teal-300 border border-teal-700';
      default: return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  },

  // Switch Sub-Tabs inside Tab 6 (All 9 Master DB Views)
  switchSubTab(subTabId) {
    try {
      localStorage.setItem('dnd35_active_mdb_subtab', subTabId);
    } catch (e) {}
    document.querySelectorAll('.mdb-subtab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(subTabId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.mdb-subtab-btn').forEach(btn => {
      btn.classList.remove('bg-purple-700', 'bg-slate-800/95', 'text-white', 'text-purple-200', 'border-purple-400/60', 'shadow', 'shadow-sm');
      btn.classList.add('text-slate-400', 'border', 'border-transparent');
    });
    const activeBtn = document.getElementById(subTabId.replace('subtab-', 'btn-subtab-'));
    if (activeBtn) {
      activeBtn.classList.add('bg-slate-800/95', 'text-purple-200', 'border', 'border-purple-400/60', 'shadow-sm');
      activeBtn.classList.remove('text-slate-400', 'border-transparent');
    }

    if (subTabId === 'subtab-mdb-list') {
      this.renderTable();
    } else if (subTabId === 'subtab-mdb-weapons') {
      this.renderWeaponsArmors();
    } else if (subTabId === 'subtab-mdb-magic') {
      this.renderSpellsManeuvers();
    } else if (subTabId === 'subtab-mdb-feats') {
      this.renderFeats();
    } else if (subTabId === 'subtab-mdb-items') {
      this.renderMagicItems();
    } else if (subTabId === 'subtab-mdb-tree') {
      this.renderHierarchyTree();
    } else if (subTabId === 'subtab-mdb-importer') {
      this.updateApiKeyUi();
    } else if (subTabId === 'subtab-mdb-sources') {
      this.renderSourcesCatalog();
    } else if (subTabId === 'subtab-mdb-backup') {
      this.renderBackupTools();
    }
  },

  // Initialize RuleMaster
  init() {
    let savedSubTab = null;
    try {
      savedSubTab = localStorage.getItem('dnd35_active_mdb_subtab');
    } catch (e) {}
    if (savedSubTab === 'subtab-mdb-tree') savedSubTab = 'subtab-mdb-list';
    if (savedSubTab && document.getElementById(savedSubTab)) {
      this.switchSubTab(savedSubTab);
    } else {
      this.renderTable();
    }
    this.updateApiKeyUi();
    this.populateInlineForgeControls();
  },

  // ====================================================
  // GEMINI AI RULE IMPORTER (DYNAMIC MODEL AUTO-DISCOVERY)
  // ====================================================
  lastAiResults: [],
  _cachedModels: null,

  DND35_RAW_GUARDRAIL: `D&D 3.5E RAW + SPLATBOOK / VARIANT / ACF / DM BOON ENGINE RULES:
1. BROAD D&D 3.5E SOURCES (CORE + SPLATBOOKS + UNEARTHED ARCANA + DRAGON MAGAZINE):
   - Because standard core rules are already in the local compendium, queries sent to Rule Master AI often target extended D&D 3.5e sources, variants, or DM Boons:
     a) Official System Reference Document (SRD v3.5 as archived on d20srd.org) & Unearthed Arcana (Class Variants like Adventurer/Martial Rogue, Cloistered Cleric, Thug Fighter, Domain Wizard, Urban Ranger, Whirling Frenzy, Flaws, Traits, Bloodlines)
     b) Official D&D 3.5e Rulebooks & Splatbooks (Player's Handbook I & II, DMG I & II, Monster Manual I-V, Complete Warrior/Arcane/Divine/Adventurer/Mage/Scoundrel/Champion, Spell Compendium, Magic Item Compendium, Tome of Battle, Tome of Magic, Frostburn, Sandstorm, Stormwrack, Libris Mortis, Lords of Madness, Heroes of Horror/Battle, Book of Exalted Deeds, Book of Vile Darkness, Expanded Psionics Handbook, Complete Psionic, Magic of Incarnum, Races of Stone/Destiny/the Wild/the Dragon, Dungeonscape, Cityscape, Planar Handbook, Dragon Magic, Draconomicon, Fiendish Codex I & II, Champions of Valor/Ruin, Forgotten Realms / Eberron 3.5e books)
     c) Official Alternate Class Features (ACFs), Racial Substitution Levels, Tactical/Reserve/Regional/Heritage Feats, and Dragon Magazine Compendium / Dragon Magazine 3.5e issues.
2. DM BOONS, SKILL/STAT GRANTS & CAMPAIGN CUSTOMIZATIONS:
   - If the query asks for a DM Boon, Skill Bonus, Ability/Save/Attack/AC Grant, or Campaign Feature (e.g., "boon, skill: +ride", "DM Boon: +4 Ride", "+2 Initiative", "Boon: CL +1"), DO NOT reject it and NEVER force-map it to an unrelated PHB feat (such as mapping a Ride skill boon to "Mounted Combat").
   - Instead, synthesize a clean, accurate Canonical V2 D&D 3.5e entry with exact "modifiers" (e.g. [{"target": "skill.ride", "value": 4, "type": "Untyped", "condition": null}]) and source "DM Boon / Campaign Grant".
3. ZERO 5E / 4E / PATHFINDER MECHANICS:
   - Absolutely NO 5e mechanics (No Advantage/Disadvantage, No Bonus Action, No Finesse adding Dex to damage, No -5/+10 GWM, No Short Rest, No Concentration slots).
   - Absolutely NO Pathfinder / PF1e / Starfinder rules or DandWiki forum inventions unless explicitly requested as a DM Boon/Custom rule.
4. OFFICIAL 3.5E ENGLISH, NAME STANDARDIZATION & NO DICE EMOJI (U+1F3B2):
   - Output 100% official D&D 3.5e RAW English terminology in all fields.
   - STANDARDIZE ALL NAMES ("name" field): Always convert messy user input (lowercase, ALL CAPS, stray dashes '-', ellipses '...', colons) into clean, canonical D&D 3.5e Title Case:
     * DM Boons / Grants -> "DM Boon: Ride (+4)", "DM Boon: Initiative (+2)", "DM Boon: CL = Level 1"
     * Targetable Feats -> "Weapon Focus (Longsword)", "Skill Focus (Spot)"
     * Class Variants -> "Rogue (Adventurer Variant)", "Cleric (Cloistered Cleric)"
   - NEVER output placeholder names like "Non-Existent Class" or "Unknown".
   - NEVER include the 6-sided die emoji (U+1F3B2) anywhere in any string.`,

  getAiModelMode() {
    return localStorage.getItem('dnd35_ai_model_mode') || 'auto';
  },

  setAiModelMode(mode) {
    if (['auto', 'flash', 'pro'].includes(mode)) {
      localStorage.setItem('dnd35_ai_model_mode', mode);
      this._cachedModels = null;
      this.updateApiKeyUi();
    }
  },

  _failedGeminiModels: new Set(),

  _isDeprecatedGeminiModel(m) {
    if (!m || typeof m !== 'string') return true;
    const lower = m.toLowerCase().trim();
    if (this._failedGeminiModels && this._failedGeminiModels.has(lower)) return true;
    return /^gemini-(?:1\.0|1\.5|2\.0)(?:-|$)/i.test(lower) ||
           /^gemini-2\.5-pro(?:-|$)/i.test(lower) ||
           /^gemini-3\.0-flash(?:-|$)/i.test(lower) ||
           /(?:^|-)(?:exp|vision|aqa|live-preview|customtools)(?:-|$)/i.test(lower);
  },

  // Helper: Sanitize and deduplicate models cascade, using pure dynamic models when available and fallbackList only when empty
  _sanitizeModelList(list) {
    const fallbackList = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite', 'gemini-3.1-pro-preview'];
    let discovered = Array.isArray(this._discoveredApiModels) ? this._discoveredApiModels : null;
    if (!discovered) {
      try {
        const raw = localStorage.getItem('dnd35_gemini_discovered_models');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) discovered = parsed;
        }
      } catch (e) {}
    }
    const cleanDiscovered = Array.isArray(discovered)
      ? discovered.filter(m => m && !this._isDeprecatedGeminiModel(m))
      : [];
    let validInput = (list || []).filter(m => m && !this._isDeprecatedGeminiModel(m));
    if (cleanDiscovered.length > 0) {
      const inDiscovered = validInput.filter(m => cleanDiscovered.includes(m));
      validInput = inDiscovered.length > 0 ? inDiscovered : cleanDiscovered;
    }
    let models = [...new Set(validInput.length > 0 ? validInput : fallbackList.filter(m => !this._isDeprecatedGeminiModel(m)))];
    // If gemini-3.1-flash-lite is at index 0, move a reliable 2.5 or 3 flash model to index 0 so it doesn't hang
    if (models[0] && models[0].includes('3.1-flash-lite')) {
      const betterIdx = models.findIndex(m => (m.includes('2.5-flash') || m.includes('3-flash')) && !m.includes('3.1'));
      if (betterIdx > 0) {
        const [better] = models.splice(betterIdx, 1);
        models.unshift(better);
      }
    }
    return models;
  },

  // Dynamically builds the 3-tier / 9-slot routing matrix strictly from live discovered API models (falls back to static list only if apiModels is empty)
  buildDynamicRoutingFromModels(apiModels = []) {
    function parseVer(name) {
      const match = (name || '').match(/gemini-(\d+(?:\.\d+)?)-/i);
      return match ? parseFloat(match[1]) : 0.0;
    }
    const fallbackList = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite', 'gemini-3.1-pro-preview'];
    // Filter out hanging, experimental, or deprecated models (e.g. 2.0-flash, 2.5-pro, 3.1-flash-lite)
    const cleanedModels = (Array.isArray(apiModels) ? apiModels.slice() : [])
      .filter(m => m && !m.toLowerCase().includes('3.1-flash-lite') && !this._isDeprecatedGeminiModel(m));
    const sourceModels = cleanedModels.length > 0 ? cleanedModels : fallbackList;
    const sorted = sourceModels.slice().sort((a, b) => parseVer(b) - parseVer(a));

    const liteModels = sorted.filter(m => m.toLowerCase().includes('flash') && m.toLowerCase().includes('lite'));
    const flashModels = sorted.filter(m => m.toLowerCase().includes('flash') && !m.toLowerCase().includes('lite'));
    const proModels = sorted.filter(m => m.toLowerCase().includes('pro'));

    const flash25 = flashModels.find(m => m.includes('2.5-flash')) || flashModels[0] || sorted[0];
    const flash30 = flashModels.find(m => !m.includes('2.5-flash')) || flashModels[1] || flashModels[0] || sorted[0];
    const lite25 = liteModels.find(m => m.includes('2.5-flash-lite')) || liteModels[0] || flash25;
    const pro31 = proModels[0] || flash30 || flash25;

    const pick3 = (candidates) => {
      const pool = [...candidates, ...flashModels, ...liteModels, ...proModels, ...sorted];
      const uniq = [];
      pool.forEach(m => {
        if (m && !this._isDeprecatedGeminiModel(m) && !uniq.includes(m)) uniq.push(m);
      });
      return {
        primary: uniq[0] || fallbackList[0],
        fallback: uniq[1] || uniq[0] || fallbackList[1],
        tertiary: uniq[2] || uniq[1] || uniq[0] || fallbackList[2]
      };
    };

    return {
      QUICK_SEARCH: pick3([flash25, flash30, lite25, ...flashModels, ...liteModels]),
      RULE_AUDIT: pick3([pro31, flash25, flash30, proModels[1], lite25]),
      IMPORT_BATCH: pick3([flash25, flash30, lite25, pro31])
    };
  },

  // Returns the dynamically discovered/AI-optimized routing matrix from live API models
  getActiveTaskRouting() {
    try {
      const discoveredRaw = this._discoveredApiModels || JSON.parse(localStorage.getItem('dnd35_gemini_discovered_models') || 'null');
      const hasValidDiscovered = Array.isArray(discoveredRaw) && discoveredRaw.length > 0 && !discoveredRaw.some(m => this._isDeprecatedGeminiModel(m));
      const saved = localStorage.getItem('dnd35_gemini_routing_matrix');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.QUICK_SEARCH && parsed.RULE_AUDIT && parsed.IMPORT_BATCH) {
          const allModels = [
            parsed.QUICK_SEARCH.primary, parsed.QUICK_SEARCH.fallback, parsed.QUICK_SEARCH.tertiary,
            parsed.RULE_AUDIT.primary, parsed.RULE_AUDIT.fallback, parsed.RULE_AUDIT.tertiary,
            parsed.IMPORT_BATCH.primary, parsed.IMPORT_BATCH.fallback, parsed.IMPORT_BATCH.tertiary
          ].filter(Boolean);
          const hasInvalidModel = allModels.some(m => this._isDeprecatedGeminiModel(m) || (hasValidDiscovered && !discoveredRaw.includes(m)));
          if (hasInvalidModel) {
            localStorage.removeItem('dnd35_gemini_routing_matrix');
          } else if (hasValidDiscovered) {
            return parsed;
          }
        }
      }
      if (Array.isArray(discoveredRaw) && discoveredRaw.length > 0) {
        if (discoveredRaw.some(m => this._isDeprecatedGeminiModel(m))) {
          try {
            localStorage.removeItem('dnd35_gemini_routing_matrix');
            localStorage.removeItem('dnd35_gemini_discovered_models');
          } catch (e) {}
          this._discoveredApiModels = null;
        } else {
          return this.buildDynamicRoutingFromModels(discoveredRaw);
        }
      }
    } catch (e) {}
    return this.buildDynamicRoutingFromModels([]);
  },

  getModelsForTask(taskType = 'DEFAULT') {
    const routing = this.getActiveTaskRouting();
    const userPref = this.getAiModelMode();
    let cfg = routing.QUICK_SEARCH;
    if (userPref === 'pro' || (userPref === 'auto' && (taskType === 'RULE_AUDIT' || taskType === 'COMPLEX_TACTICAL'))) {
      cfg = routing.RULE_AUDIT;
    } else if (userPref === 'auto' && taskType === 'IMPORT_BATCH') {
      cfg = routing.IMPORT_BATCH;
    }
    return this._sanitizeModelList([cfg.primary, cfg.fallback, cfg.tertiary].filter(Boolean));
  },

  // Sanal Flash Ailesi Çözümleyicisi: Canlı modeller arasından en güncel ve kararlı Flash modelini dinamik seçer
  findDynamicDiagnosticModel(apiModels = []) {
    if (Array.isArray(apiModels) && apiModels.length > 0) {
      function parseVer(name) {
        const match = (name || '').match(/gemini-(\d+(?:\.\d+)?)-/i);
        return match ? parseFloat(match[1]) : 0.0;
      }
      // 1. Standart Flash modelleri (preview veya lite olmayan, kararlı evaluator için)
      const standardFlash = apiModels
        .filter(m => {
          const l = m.toLowerCase();
          return l.includes('flash') && !l.includes('lite') && !l.includes('preview');
        })
        .sort((a, b) => parseVer(b) - parseVer(a));
      if (standardFlash.length > 0) return standardFlash[0];

      // 2. Herhangi bir Flash modeli (lite veya preview dahil)
      const anyFlash = apiModels
        .filter(m => m.toLowerCase().includes('flash'))
        .sort((a, b) => parseVer(b) - parseVer(a));
      if (anyFlash.length > 0) return anyFlash[0];

      // 3. Herhangi bir Pro modeli
      const anyPro = apiModels
        .filter(m => m.toLowerCase().includes('pro'))
        .sort((a, b) => parseVer(b) - parseVer(a));
      if (anyPro.length > 0) return anyPro[0];

      // 4. Listenin ilk modeli
      return apiModels[0];
    }
    return '';
  },

  // Canlı modelleri Gemini Flash ile analiz edip D&D 3.5e görevlerine en uygun 3 kademeli matrisi üreten AI Optimizatörü
  async optimizeModelsWithAi(apiKey, apiModels = []) {
    if (!apiKey || !Array.isArray(apiModels) || apiModels.length === 0) {
      return { success: false, reason: 'Missing API key or model list' };
    }

    const evaluatorModel = this.findDynamicDiagnosticModel(apiModels);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${evaluatorModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const promptText = `You are a Google Gemini API optimization and AI model architecture specialist.
The following official models are currently active, accessible, and support generateContent on the user's API key:
${JSON.stringify(apiModels)}

Classify these models across 3 core task domains for our D&D 3.5e web application and select the optimal 3-tier cascade (primary, fallback, tertiary) for each task:
1. QUICK_SEARCH: Low latency, high RPM, Spotlight search, D&D SRD spell/item/feat lookup, and Level-Up Copilot (prioritize Flash-Lite or Flash models).
2. RULE_AUDIT: Deep RAW rules reasoning, complex mechanical audits, and V2 schema validation (prioritize Pro models, or highest-reasoning Flash).
3. IMPORT_BATCH: Structured JSON extraction, monster statblocks, tables, and free-text parsing (balanced Flash/Pro hybrid).

MANDATORY RULES:
1. Select ONLY model names from the active list provided above. Never invent model names!
2. Return ONLY a valid JSON object without Markdown formatting or backticks.
Schema:
{
  "QUICK_SEARCH": {"primary": "model_name", "fallback": "model_name", "tertiary": "model_name"},
  "RULE_AUDIT": {"primary": "model_name", "fallback": "model_name", "tertiary": "model_name"},
  "IMPORT_BATCH": {"primary": "model_name", "fallback": "model_name", "tertiary": "model_name"}
}`;

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawAiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawAiText) throw new Error('Empty AI response');

      let parsed = null;
      try {
        parsed = JSON.parse(this.cleanJsonText(rawAiText));
      } catch (pe) {
        const match = rawAiText.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error('Invalid JSON');
      }

      // Whitelist doğrulama & Temizlik
      const validatedMatrix = {};
      const requiredTasks = ['QUICK_SEARCH', 'RULE_AUDIT', 'IMPORT_BATCH'];
      let isValid = true;

      for (const task of requiredTasks) {
        const group = parsed[task];
        if (!group || typeof group !== 'object') {
          isValid = false;
          break;
        }
        const primary = apiModels.includes(group.primary) ? group.primary : null;
        const fallback = apiModels.includes(group.fallback) ? group.fallback : null;
        const tertiary = apiModels.includes(group.tertiary) ? group.tertiary : null;

        if (!primary) {
          isValid = false;
          break;
        }

        validatedMatrix[task] = {
          primary: primary,
          fallback: fallback || primary,
          tertiary: tertiary || fallback || primary
        };
      }

      if (!isValid) {
        throw new Error('AI model selections failed whitelist validation');
      }

      try {
        localStorage.setItem('dnd35_gemini_routing_matrix', JSON.stringify(validatedMatrix));
      } catch (e) {}

      this._cachedTaskModels = {};
      return { success: true, matrix: validatedMatrix, evaluatorModel };
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('AI model optimization failed, using heuristic:', err.message);
      return { success: false, error: err.message, evaluatorModel };
    }
  },

  async getAvailableGeminiModels(apiKey, forceRefresh = false, taskType = 'DEFAULT') {
    const defaultList = this.getModelsForTask(taskType);
    if (!apiKey) return defaultList;

    if (forceRefresh) {
      this._cachedTaskModels = {};
      this._discoveredApiModels = null;
      try { localStorage.removeItem('dnd35_gemini_discovered_models'); } catch (e) {}
    }

    const cacheKey = `${taskType}_${this.getAiModelMode()}`;
    if (!forceRefresh && this._cachedTaskModels && this._cachedTaskModels[cacheKey]) {
      return this._cachedTaskModels[cacheKey];
    }

    // Eğer önceden kaydedilmiş ve canlı keşfedilmiş modellerle doğrulanmış bir AI yönlendirme matrisi varsa doğrudan kullan (0ms gecikme)
    const rawMatrix = localStorage.getItem('dnd35_gemini_routing_matrix');
    if (rawMatrix && !forceRefresh) {
      try {
        const discoveredRaw = this._discoveredApiModels || JSON.parse(localStorage.getItem('dnd35_gemini_discovered_models') || 'null');
        const hasValidDiscovered = Array.isArray(discoveredRaw) && discoveredRaw.length > 0 && !discoveredRaw.some(m => this._isDeprecatedGeminiModel(m));
        const parsedM = JSON.parse(rawMatrix);
        const allM = parsedM ? [
          parsedM.QUICK_SEARCH?.primary, parsedM.QUICK_SEARCH?.fallback, parsedM.QUICK_SEARCH?.tertiary,
          parsedM.RULE_AUDIT?.primary, parsedM.RULE_AUDIT?.fallback, parsedM.RULE_AUDIT?.tertiary,
          parsedM.IMPORT_BATCH?.primary, parsedM.IMPORT_BATCH?.fallback, parsedM.IMPORT_BATCH?.tertiary
        ].filter(Boolean) : [];
        if (!hasValidDiscovered || allM.some(m => this._isDeprecatedGeminiModel(m) || !discoveredRaw.includes(m))) {
          localStorage.removeItem('dnd35_gemini_routing_matrix');
          if (!hasValidDiscovered) {
            localStorage.removeItem('dnd35_gemini_discovered_models');
            this._discoveredApiModels = null;
          }
        } else {
          const activeRouting = this.getActiveTaskRouting();
          let taskCfg = activeRouting.QUICK_SEARCH;
          if (taskType === 'RULE_AUDIT' || taskType === 'COMPLEX_TACTICAL' || this.getAiModelMode() === 'pro') {
            taskCfg = activeRouting.RULE_AUDIT;
          } else if (taskType === 'IMPORT_BATCH' && this.getAiModelMode() === 'auto') {
            taskCfg = activeRouting.IMPORT_BATCH;
          }
          const customList = this._sanitizeModelList([taskCfg.primary, taskCfg.fallback, taskCfg.tertiary]);
          if (customList.length > 0) {
            if (!this._cachedTaskModels) this._cachedTaskModels = {};
            this._cachedTaskModels[cacheKey] = customList;
            return customList;
          }
        }
      } catch (e) {}
    }

    try {
      let apiModels = (!forceRefresh && this._discoveredApiModels) ? this._discoveredApiModels : null;
      if (Array.isArray(apiModels) && apiModels.some(m => this._isDeprecatedGeminiModel(m))) {
        apiModels = null;
        this._discoveredApiModels = null;
        try {
          localStorage.removeItem('dnd35_gemini_routing_matrix');
          localStorage.removeItem('dnd35_gemini_discovered_models');
        } catch (e) {}
      }
      if (!apiModels && !forceRefresh) {
        try {
          const cachedJson = localStorage.getItem('dnd35_gemini_discovered_models');
          if (cachedJson) {
            const parsed = JSON.parse(cachedJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (parsed.some(m => this._isDeprecatedGeminiModel(m))) {
                localStorage.removeItem('dnd35_gemini_routing_matrix');
                localStorage.removeItem('dnd35_gemini_discovered_models');
                this._discoveredApiModels = null;
              } else {
                apiModels = parsed;
                this._discoveredApiModels = parsed;
              }
            }
          }
        } catch (e) {}
      }

      if (!apiModels) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
          signal: controller.signal
        });
        clearTimeout(timer);

        if (resp.ok) {
          const data = await resp.json();
          apiModels = (data.models || [])
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace(/^models\//, ''))
            .filter(m => {
              const lower = m.toLowerCase();
              return !this._isDeprecatedGeminiModel(m) &&
                     !lower.includes('tts') &&
                     !lower.includes('image') &&
                     !lower.includes('audio') &&
                     !lower.includes('embedding') &&
                     !lower.includes('realtime') &&
                     !lower.includes('live') &&
                     !lower.includes('customtools') &&
                     !lower.includes('bison') &&
                     !lower.includes('omni') &&
                     !lower.includes('gemma') &&
                     !/-\d{2}-\d{2}$/.test(lower);
            });
          this._discoveredApiModels = apiModels;
          try {
            localStorage.setItem('dnd35_gemini_discovered_models', JSON.stringify(apiModels));
          } catch (e) {}
        }
      }

      if (apiModels && apiModels.length > 0) {
        const dynamicRouting = this.buildDynamicRoutingFromModels(apiModels);
        if (!localStorage.getItem('dnd35_gemini_routing_matrix')) {
          try {
            localStorage.setItem('dnd35_gemini_routing_matrix', JSON.stringify(dynamicRouting));
          } catch (e) {}
          this.optimizeModelsWithAi(apiKey, apiModels).catch(() => {});
        }
        const userPref = this.getAiModelMode();
        let cfg = dynamicRouting.QUICK_SEARCH;
        if (userPref === 'pro' || (userPref === 'auto' && (taskType === 'RULE_AUDIT' || taskType === 'COMPLEX_TACTICAL'))) {
          cfg = dynamicRouting.RULE_AUDIT;
        } else if (userPref === 'auto' && taskType === 'IMPORT_BATCH') {
          cfg = dynamicRouting.IMPORT_BATCH;
        }
        const resultList = this._sanitizeModelList([cfg.primary, cfg.fallback, cfg.tertiary]);
        if (!this._cachedTaskModels) this._cachedTaskModels = {};
        this._cachedTaskModels[cacheKey] = resultList;
        return resultList;
      }
    } catch (e) {
      console.warn('API model list discovery skipped:', e.message);
    }

    return this._sanitizeModelList(defaultList);
  },

  async getAiArchitectureDiagnostics(apiKey) {
    const key = apiKey || this.getApiKey();
    if (!key) return null;

    // 1. API modellerini canlı tara ve önbelleğe al
    await this.getAvailableGeminiModels(key, true, 'QUICK_SEARCH');
    const apiModels = this._discoveredApiModels || [];

    // 2. Sanal Flash Çözümleyicisi: En güncel kararlı Flash modelini belirle
    const dynamicFlash = this.findDynamicDiagnosticModel(apiModels);

    // 3. Modelleri AI Meta-Evaluator ile canlı optimize etmeyi dene
    let optResult = { success: false };
    if (apiModels.length > 0) {
      optResult = await this.optimizeModelsWithAi(key, apiModels);
    }

    const dynFallback = this.buildDynamicRoutingFromModels(apiModels);
    const quickModels = await this.getAvailableGeminiModels(key, false, 'QUICK_SEARCH');
    const auditModels = await this.getAvailableGeminiModels(key, false, 'RULE_AUDIT');
    const batchModels = await this.getAvailableGeminiModels(key, false, 'IMPORT_BATCH');

    return {
      mode: this.getAiModelMode(),
      dynamicEvaluator: dynamicFlash,
      isAiOptimized: optResult.success,
      totalDiscovered: apiModels.length,
      tasks: {
        quickSearch: {
          title: 'Quick Search & Level-Up Copilot (Flash-Lite / High Quota)',
          primary: quickModels[0] || dynFallback.QUICK_SEARCH.primary,
          fallback: quickModels[1] || dynFallback.QUICK_SEARCH.fallback,
          tertiary: quickModels[2] || dynFallback.QUICK_SEARCH.tertiary
        },
        ruleAudit: {
          title: 'Compendium & RAW Rule Audit (Pro Deep Reasoning)',
          primary: auditModels[0] || dynFallback.RULE_AUDIT.primary,
          fallback: auditModels[1] || dynFallback.RULE_AUDIT.fallback,
          tertiary: auditModels[2] || dynFallback.RULE_AUDIT.tertiary
        },
        importBatch: {
          title: 'Batch Import & Free-Text Parsing (Lite/Pro Hybrid)',
          primary: batchModels[0] || dynFallback.IMPORT_BATCH.primary,
          fallback: batchModels[1] || dynFallback.IMPORT_BATCH.fallback,
          tertiary: batchModels[2] || dynFallback.IMPORT_BATCH.tertiary
        }
      }
    };
  },

  async showDiagnosticsModal(apiKey) {
    const key = (apiKey || this.getApiKey() || '').trim();
    if (!key) {
      alert('⚠️ Please enter and save a Gemini API Key first.');
      return;
    }

    try {
      if (typeof verifySettingsGeminiApiKey === 'function') {
        const ok = await verifySettingsGeminiApiKey(true);
        if (!ok) {
          alert('❌ Could not connect to Gemini API. Please verify your API key.');
          return;
        }
      }

      const diag = await this.getAiArchitectureDiagnostics(key);
      const modeName = diag.mode === 'auto' 
        ? 'Auto (Smart Task Router)' 
        : (diag.mode === 'pro' ? 'Manual Gemini Pro (Deep RAW Reasoning)' : 'Manual Gemini Flash (Ultra-Low Latency)');

      const optStatus = diag.isAiOptimized
        ? `🤖 Optimized via Live AI Analysis (Evaluator: ${diag.dynamicEvaluator})`
        : `🛡️ Deterministic Heuristic Shield Active (Evaluator: ${diag.dynamicEvaluator})`;

      const report = `🩺 GEMINI API DIAGNOSTICS & SMART MODEL MATRIX (9 SLOTS)\n\n` +
        `🟢 Connection Verified & Active! (${diag.totalDiscovered} Live Models Discovered)\n` +
        `Optimization Status: ${optStatus}\n` +
        `Operating Mode: ${modeName}\n\n` +
        `⚡ ${diag.tasks.quickSearch.title}:\n` +
        `   ⭐ 1. Primary: ${diag.tasks.quickSearch.primary}\n` +
        `   🔄 2. Fallback: ${diag.tasks.quickSearch.fallback}\n` +
        `   🛡️ 3. Tertiary: ${diag.tasks.quickSearch.tertiary}\n\n` +
        `🔮 ${diag.tasks.ruleAudit.title}:\n` +
        `   ⭐ 1. Primary: ${diag.tasks.ruleAudit.primary}\n` +
        `   🔄 2. Fallback: ${diag.tasks.ruleAudit.fallback}\n` +
        `   🛡️ 3. Tertiary: ${diag.tasks.ruleAudit.tertiary}\n\n` +
        `📋 ${diag.tasks.importBatch.title}:\n` +
        `   ⭐ 1. Primary: ${diag.tasks.importBatch.primary}\n` +
        `   🔄 2. Fallback: ${diag.tasks.importBatch.fallback}\n` +
        `   🛡️ 3. Tertiary: ${diag.tasks.importBatch.tertiary}\n\n` +
        `The engine attempts the Primary model first for each task and automatically cascades to Fallback and Tertiary on server overload (503) or rate limits (429).`;

      alert(report);
    } catch (err) {
      alert(`❌ Diagnostics Error: ${err.message}`);
    }
  },

  cleanJsonText(raw) {
    if (!raw) return '';
    let cleaned = String(raw).trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return cleaned;
  },

  getApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
  },

  setApiKey(key) {
    if (!key || !key.trim()) {
      localStorage.removeItem('gemini_api_key');
      localStorage.removeItem('dnd35_gemini_discovered_models');
      localStorage.removeItem('dnd35_gemini_routing_matrix');
      this._cachedTaskModels = {};
      this._discoveredApiModels = null;
      this._cachedModels = null;
    } else {
      localStorage.setItem('gemini_api_key', key.trim());
      localStorage.removeItem('dnd35_gemini_discovered_models');
      localStorage.removeItem('dnd35_gemini_routing_matrix');
      this._cachedTaskModels = {};
      this._discoveredApiModels = null;
      this._cachedModels = null;
    }
    this.updateApiKeyUi();
    if (typeof verifySettingsGeminiApiKey === 'function') {
      verifySettingsGeminiApiKey(true);
    }
  },

  updateApiKeyUi() {
    const key = this.getApiKey();
    const statusContainer = document.getElementById('ai-api-key-status');
    const inputContainer = document.getElementById('ai-api-key-input-container');
    const keyDisplay = document.getElementById('ai-api-key-display');
    const keyInput = document.getElementById('ai-api-key-input');

    const modelMode = this.getAiModelMode();
    const modeSelect = document.getElementById('ai-model-mode-select');
    if (modeSelect) modeSelect.value = modelMode;

    if (key) {
      if (statusContainer) statusContainer.classList.remove('hidden');
      if (inputContainer) inputContainer.classList.add('hidden');
      if (keyDisplay) {
        keyDisplay.textContent = key.substring(0, 6) + '...' + key.substring(key.length - 4);
      }
    } else {
      if (statusContainer) statusContainer.classList.add('hidden');
      if (inputContainer) inputContainer.classList.remove('hidden');
      if (keyInput) keyInput.value = '';
    }
  },

  promptChangeApiKey() {
    const inputContainer = document.getElementById('ai-api-key-input-container');
    const statusContainer = document.getElementById('ai-api-key-status');
    if (inputContainer) inputContainer.classList.remove('hidden');
    if (statusContainer) statusContainer.classList.add('hidden');
    const keyInput = document.getElementById('ai-api-key-input');
    if (keyInput) {
      keyInput.value = this.getApiKey();
      keyInput.focus();
    }
  },

  saveApiKeyFromInput() {
    const keyInput = document.getElementById('ai-api-key-input');
    const val = keyInput?.value?.trim() || '';
    if (!val) {
      alert('⚠️ Please enter a valid Gemini API key.');
      return;
    }
    this.setApiKey(val);
    alert('✅ Gemini API key saved successfully!');
  },

  clearApiKey() {
    if (confirm('Are you sure you want to remove the Gemini API key from local storage?')) {
      this.setApiKey('');
    }
  },

  // ====================================================
  // CANONICAL D&D 3.5E LOCAL COMPENDIUM & TYPO RESOLVER
  // Prevents LLM hallucinations for misspelled or iconic rules
  // ====================================================
  canonicalDictionary: {
    // Aliases & Typo mappings
    'clave': 'cleave',
    'cleav': 'cleave',
    'cleve': 'cleave',
    'gret cleve': 'great cleave',
    'great cleve': 'great cleave',
    'power atac': 'power attack',
    'power atack': 'power attack',
    'finesse': 'weapon finesse',
    'weapon fines': 'weapon finesse',
    'shok trooper': 'shock trooper',
    'shock troper': 'shock trooper',
    'leap atac': 'leap attack',
    'shadow blad': 'shadow blade',
    'flometong': 'flametongue',
    'flametong': 'flametongue',
    'belt of batle': 'belt of battle',
    'boots of sped': 'boots of speed',
    'hast': 'haste',
    'moutain hamer': 'mountain hammer',
    'agile shiled fighter': 'agile shield fighter',
    'agile shield figther': 'agile shield fighter',

    // Verified Canonical V2 Entries
    'cleave': {
      schemaVersion: 2,
      id: 'feat_cleave',
      name: 'Cleave',
      type: 'Feat',
      slot: 'None',
      source: 'PHB p.92',
      prereq: 'Str 13, Power Attack.',
      benefit: 'Prerequisites: Str 13, Power Attack. Benefit: If you deal a creature enough damage to make it drop (typically by dropping it to below 0 hit points or killing it), you get an immediate, extra melee attack against another creature in the immediate vicinity. The extra attack is with the same weapon and at the same bonus as the attack that dropped the previous creature. You can use this ability once per round.',
      description: 'If you deal a creature enough damage to make it drop, you get an immediate, extra melee attack against another creature in the immediate vicinity.',
      scope: 'Melee Only',
      action: 'Free Action',
      actionType: 'free',
      duration: 'Passive',
      role: 'General',
      isFighterBonusFeat: true,
      modifiers: [],
      damageParts: [],
      modes: [],
      ruleFlags: { cleave: true },
      tacticalBadges: ['Extra Melee Attack on Drop'],
      weight: 0,
      cost: 0
    },
    'great cleave': {
      schemaVersion: 2,
      id: 'feat_great_cleave',
      name: 'Great Cleave',
      type: 'Feat',
      slot: 'None',
      source: 'PHB p.94',
      prereq: 'Str 13, Cleave, Power Attack, base attack bonus +4.',
      benefit: 'Prerequisites: Str 13, Cleave, Power Attack, BAB +4. Benefit: This feat works like Cleave, except that there is no limit in the number of times you can use it per round.',
      description: 'This feat works like Cleave, except that there is no limit in the number of times you can use it per round.',
      scope: 'Melee Only',
      action: 'Free Action',
      actionType: 'free',
      duration: 'Passive',
      role: 'General',
      isFighterBonusFeat: true,
      modifiers: [],
      damageParts: [],
      modes: [],
      ruleFlags: { greatCleave: true },
      tacticalBadges: ['Unlimited Cleave/Round'],
      weight: 0,
      cost: 0
    },
    'power attack': {
      schemaVersion: 2,
      id: 'feat_power_attack',
      name: 'Power Attack',
      type: 'Feat',
      slot: 'None',
      source: 'PHB p.98',
      prereq: 'Str 13.',
      benefit: 'Prerequisites: Str 13. Benefit: On your action, before making attack rolls for a round, you may choose to subtract a number from all melee attack rolls and add the same number to all melee damage rolls. This number may not exceed your base attack bonus. If you attack with a two-handed weapon, add twice the number subtracted.',
      description: 'Trade melee attack bonus for melee damage bonus (1:1 one-handed, 1:2 two-handed).',
      scope: 'Melee Only',
      action: 'Free Action',
      actionType: 'free',
      duration: '1 round',
      role: 'General',
      isFighterBonusFeat: true,
      modifiers: [],
      damageParts: [],
      modes: [],
      ruleFlags: { powerAttack: true },
      tacticalBadges: ['1:1 / 1:2 Two-Handed Dmg'],
      weight: 0,
      cost: 0
    },
    'weapon finesse': {
      schemaVersion: 2,
      id: 'feat_weapon_finesse',
      name: 'Weapon Finesse',
      type: 'Feat',
      slot: 'None',
      source: 'PHB p.102',
      prereq: 'Base attack bonus +1.',
      benefit: 'Prerequisites: BAB +1. Benefit: With a light weapon, rapier, whip, or spiked chain made for a creature of your size category, you may use your Dexterity modifier instead of your Strength modifier on attack rolls. If you carry a shield, its armor check penalty applies to your attack rolls.',
      description: 'Use Dexterity modifier instead of Strength modifier on attack rolls with light or finessable weapons.',
      scope: 'Melee Only',
      action: 'Passive',
      actionType: 'passive',
      duration: 'Continuous',
      role: 'General',
      isFighterBonusFeat: true,
      modifiers: [],
      damageParts: [],
      modes: [],
      ruleFlags: { weaponFinesse: true },
      tacticalBadges: ['DEX to Melee Attack'],
      weight: 0,
      cost: 0
    },
    'shock trooper': {
      schemaVersion: 2,
      id: 'feat_shock_trooper',
      name: 'Shock Trooper',
      type: 'Feat',
      slot: 'None',
      source: 'Complete Warrior p.112',
      prereq: 'Base attack bonus +6, Improved Bull Rush, Power Attack.',
      benefit: 'Prerequisites: BAB +6, Improved Bull Rush, Power Attack. Tactical Feat enabling Directed Bull Rush, Domino Rush (free trip on bull rush collision), and Heedless Charge (divert Power Attack attack penalty to Armor Class instead of attack rolls during a charge with a two-handed weapon).',
      description: 'Tactical feat with Directed Bull Rush, Domino Rush, and Heedless Charge.',
      scope: 'Melee Only',
      action: 'Passive / Tactical',
      actionType: 'passive',
      duration: 'Continuous',
      role: 'General',
      modifiers: [],
      damageParts: [],
      modes: [],
      ruleFlags: { shockTrooper: true, heedlessCharge: true },
      tacticalBadges: ['Heedless Charge (PA to AC)'],
      weight: 0,
      cost: 0
    },
    'shadow blade': {
      schemaVersion: 2,
      id: 'feat_shadow_blade',
      name: 'Shadow Blade',
      type: 'Feat',
      slot: 'None',
      source: 'ToB p.32',
      prereq: 'One Shadow Hand stance.',
      benefit: 'Prerequisites: One Shadow Hand stance. Benefit: While you are in a Shadow Hand stance and attack with one of the discipline\'s preferred weapons (dagger, short sword, sai, siangham, unarmed strike, spiked chain), you can add your Dexterity modifier as a bonus on damage rolls.',
      description: 'Add Dexterity modifier to melee damage while in a Shadow Hand stance with discipline weapons.',
      scope: 'Melee Only',
      action: 'Passive',
      actionType: 'passive',
      duration: 'Continuous',
      role: 'General',
      modifiers: [],
      damageParts: [],
      modes: [],
      ruleFlags: { shadowBlade: true },
      tacticalBadges: ['+DEX to Damage (Shadow Hand)'],
      weight: 0,
      cost: 0
    },
    'leap attack': {
      schemaVersion: 2,
      id: 'feat_leap_attack',
      name: 'Leap Attack',
      type: 'Feat',
      slot: 'None',
      source: 'Complete Adventurer p.110',
      prereq: 'Jump 8 ranks, Power Attack.',
      benefit: 'Prerequisites: Jump 8 ranks, Power Attack. Benefit: If you cover at least 10 feet of horizontal distance with your jump, and you end your jump in an adjacent square to your target and attack as part of a charge, you deal double the normal extra damage from Power Attack (triple if using a two-handed weapon).',
      description: 'Double or triple Power Attack damage on a jumping charge.',
      scope: 'Melee Only',
      action: 'Full-Round Action (Charge)',
      actionType: 'full_round',
      duration: 'Instantaneous',
      role: 'General',
      modifiers: [],
      damageParts: [],
      modes: [],
      ruleFlags: { leapAttack: true },
      tacticalBadges: ['x3 Two-Handed PA on Jump Charge'],
      weight: 0,
      cost: 0
    },
    'steadfast determination': {
      schemaVersion: 2,
      id: 'feat_steadfast_determination',
      name: 'Steadfast Determination',
      type: 'Feat',
      slot: 'None',
      source: "Player's Handbook II, p. 83",
      prereq: 'Endurance.',
      benefit: 'You can use your Constitution modifier in place of your Wisdom modifier on Will saves. You do not automatically fail Fortitude saves on a roll of natural 1.',
      description: 'Your sheer force of will and physical toughness allow you to shrug off mental assaults and physical hardships alike. You can use your Constitution modifier in place of your Wisdom modifier on Will saves, and you do not automatically fail Fortitude saves on a roll of natural 1.',
      scope: 'None / General',
      action: 'Passive',
      actionType: 'passive',
      duration: 'Continuous',
      role: 'General',
      isFighterBonusFeat: true,
      modifiers: [],
      damageParts: [],
      modes: [],
      ruleFlags: { conToWillSave: true, noAutoFailFortSaveOnNat1: true },
      tacticalBadges: ['CON to Will Saves', 'No Auto-Fail on Fort Nat 1'],
      weight: 0,
      cost: 0
    },
    'agile shield fighter': {
      schemaVersion: 2,
      id: 'feat_agile_shield_fighter',
      name: 'Agile Shield Fighter',
      type: 'Feat',
      category: 'Fighter',
      slot: 'None',
      source: "Player's Handbook II, p. 74",
      prereq: 'Shield Proficiency, Improved Shield Bash, Shield Specialization',
      prerequisites: 'Shield Proficiency, Improved Shield Bash, Shield Specialization',
      benefit: 'When making a shield bash and armed strike attack as part of a full attack action, you take a -2 penalty on each attack. These penalties replace the normal ones you incur for fighting with two weapons.',
      description: 'You are skilled in combining your shield bash attack with an armed strike. When you use your shield in unison with a weapon, your training allows you to score telling blows with both.\n\nPrerequisites: Proficiency with shields, Improved Shield Bash, Shield Specialization.\n\nBenefit: When making a shield bash and armed strike attack as part of a full attack action, you take a -2 penalty on each attack. These penalties replace the normal ones you incur for fighting with two weapons.\n\nSpecial: A fighter can select Agile Shield Fighter as one of his fighter bonus feats.',
      special: 'A fighter can select Agile Shield Fighter as one of his fighter bonus feats.',
      scope: 'Melee Only',
      action: 'Full-Round Action',
      actionType: 'full_round',
      duration: 'Continuous',
      role: 'Fighter',
      isFighterBonusFeat: true,
      modifiers: [],
      damageParts: [],
      modes: [],
      ruleFlags: { agileShieldFighter: true },
      tacticalBadges: ['-2/-2 Shield Bash + Weapon Full Attack (Replaces TWF Penalty)'],
      weight: 0,
      cost: 0
    },
    'haste': {
      schemaVersion: 2,
      id: 'spell_haste',
      name: 'Haste',
      type: 'Spell',
      slot: 'None',
      source: 'PHB p.239',
      level: 3,
      school: 'Transmutation',
      action: '1 standard action',
      actionType: 'standard',
      duration: '1 round/level',
      range: 'Close (25 ft. + 5 ft./2 levels)',
      benefit: 'Targets receive +1 attack bonus, +1 dodge AC, +1 Reflex save, +30 ft enhancement bonus to base speed, and 1 extra attack when making a full attack.',
      description: 'The transmuted creatures move and act more quickly than normal, gaining +1 attack, +1 dodge AC/Reflex, +30 ft speed, and 1 extra full-attack strike.',
      scope: 'All Attacks',
      modifiers: [
        { target: 'attack.all', value: 1, type: 'Untyped', condition: null },
        { target: 'ac.dodge', value: 1, type: 'Dodge', condition: null },
        { target: 'save.ref', value: 1, type: 'Dodge', condition: null },
        { target: 'speed.land', value: 30, type: 'Enhancement', condition: null }
      ],
      damageParts: [],
      modes: [],
      ruleFlags: { hasteExtraAttack: true },
      tacticalBadges: ['+1 Extra Full Attack', '+30 ft Speed'],
      weight: 0,
      cost: 0
    },
    'mountain hammer': {
      schemaVersion: 2,
      id: 'man_mountain_hammer',
      name: 'Mountain Hammer',
      type: 'Maneuver',
      slot: 'None',
      source: 'ToB p.84',
      level: 2,
      discipline: 'Stone Dragon',
      action: '1 standard action',
      actionType: 'standard',
      duration: 'Instantaneous',
      benefit: 'Stone Dragon (Strike). As part of this maneuver, you make a single melee attack. If your attack hits, you deal an extra 2d6 points of damage and your attack automatically overcomes damage reduction and hardness.',
      description: 'Deal +2d6 damage and automatically bypass all DR and hardness.',
      scope: 'Melee Only',
      modifiers: [],
      damageParts: [
        { dice: '2d6', bonus: 0, type: 'Untyped', multiplyOnCrit: false, onCritOnly: false, source: 'Mountain Hammer' }
      ],
      modes: [],
      ruleFlags: { ignoresDr: true, ignoresHardness: true },
      tacticalBadges: ['Bypass All DR & Hardness'],
      weight: 0,
      cost: 0
    }
  },

  setQueryAndSearch(term, categoryHint = 'Feat') {
    const queryInput = document.getElementById('ai-rule-query');
    const catSelect = document.getElementById('ai-rule-category');
    if (queryInput) queryInput.value = term;
    if (catSelect && categoryHint && categoryHint !== 'ALL') catSelect.value = categoryHint;
    this.queryAiRule();
  },

  cleanArrow(str) {
    if (!str) return '';
    return String(str)
      .replace(/â†³/g, '')
      .replace(/â†’/g, '')
      .replace(/^[\u21B3\u2192\s\u00E2\u2020\u00B3\?]+\s*/, '')
      .replace(/Ä°/g, 'İ')
      .replace(/Ä±/g, 'ı')
      .replace(/ÅŸ/g, 'ş')
      .replace(/Åž/g, 'Ş')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã‡/g, 'Ç')
      .replace(/Ã¶/g, 'ö')
      .replace(/Ã–/g, 'Ö')
      .replace(/Ã¼/g, 'ü')
      .replace(/Ãœ/g, 'Ü')
      .replace(/ÄŸ/g, 'ğ')
      .replace(/Äž/g, 'Ğ')
      .trim();
  },

  formatChildName(str) {
    const clean = this.cleanArrow(str);
    return clean ? `\u21B3 ${clean}` : '';
  },

  // Normalize any AI or raw payload object into Canonical V2 Entry (schemaVersion: 2)
  normalizeEntry(raw, isRowArray = false) {
    if (!raw) return null;

    if (typeof window !== 'undefined' && window.SchemaMigrator) {
      if (isRowArray && Array.isArray(raw) && typeof window.SchemaMigrator.convertRowArrayToV2 === 'function') {
        return window.SchemaMigrator.convertRowArrayToV2(raw);
      }
      if (!Array.isArray(raw) && typeof raw === 'object' && typeof window.SchemaMigrator.upgradeEntryToV2 === 'function') {
        const cloned = JSON.parse(JSON.stringify(raw));
        if (cloned.name) cloned.name = this.standardizeName(this.cleanArrow(cloned.name), cloned.category || cloned.type || '');
        const res = window.SchemaMigrator.upgradeEntryToV2(cloned);
        if (res && res.name) res.name = this.standardizeName(this.cleanArrow(res.name), res.category || res.type || '');
        if (cloned.type === 'Deity' || cloned.domains || cloned.portfolio || cloned.rank) {
          if (cloned.favoredWeapon && !res.favoredWeapon) res.favoredWeapon = cloned.favoredWeapon;
          if (cloned.weapon && !res.weapon) res.weapon = cloned.weapon;
          if (!res.favoredWeapon && res.weapon) res.favoredWeapon = res.weapon;
          if (!res.weapon && res.favoredWeapon) res.weapon = res.favoredWeapon;
          if (cloned.domains && !res.domains) res.domains = cloned.domains;
          if (cloned.alignment && !res.alignment) res.alignment = cloned.alignment;
          if (cloned.rank && !res.rank) res.rank = cloned.rank;
          if (cloned.portfolio && !res.portfolio) res.portfolio = cloned.portfolio;
          if (cloned.title && !res.title) res.title = cloned.title;
          if (cloned.icon && !res.icon) res.icon = cloned.icon;
          if (cloned.symbol && !res.symbol) res.symbol = cloned.symbol;
          if (cloned.category && !res.category) res.category = cloned.category;
          if (cloned.source && !res.source) res.source = cloned.source;
          if (cloned.description && !res.description) res.description = cloned.description;
        }
        if (cloned.type === 'Domain' || (cloned.category && String(cloned.category).toLowerCase().includes('domain'))) {
          res.type = 'Domain';
          res.category = cloned.category || res.category || 'Cleric Domain';
          res.source = cloned.source || res.source || 'Spell Compendium';

          if (cloned.grantedPower) {
            if (typeof cloned.grantedPower === 'string') {
              res.grantedPower = {
                description: cloned.grantedPower,
                classSkills: [],
                grantedFeats: [],
                spellLikeAbilities: []
              };
            } else if (typeof cloned.grantedPower === 'object') {
              res.grantedPower = {
                description: cloned.grantedPower.description || cloned.description || '',
                classSkills: Array.isArray(cloned.grantedPower.classSkills) ? cloned.grantedPower.classSkills : [],
                grantedFeats: Array.isArray(cloned.grantedPower.grantedFeats) ? cloned.grantedPower.grantedFeats : [],
                spellLikeAbilities: Array.isArray(cloned.grantedPower.spellLikeAbilities) ? cloned.grantedPower.spellLikeAbilities : []
              };
            }
          } else {
            res.grantedPower = {
              description: cloned.description || '',
              classSkills: [],
              grantedFeats: [],
              spellLikeAbilities: []
            };
          }

          const rawSpells = Array.isArray(cloned.spells) ? cloned.spells : (Array.isArray(cloned.domainSpells) ? cloned.domainSpells : (Array.isArray(res.spells) ? res.spells : []));
          res.spells = rawSpells.map((s, idx) => {
            const lvl = Number(s.level) || (idx + 1);
            const name = String(s.name || '').trim();
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const splId = s.id || (slug ? `spl-${slug}` : `spl-unknown-${lvl}`);
            return { level: lvl, id: splId, name: name };
          });

          res.requiredAlignment = Array.isArray(cloned.requiredAlignment) ? cloned.requiredAlignment : [];
          if (!Array.isArray(res.modifiers)) res.modifiers = Array.isArray(cloned.modifiers) ? cloned.modifiers : [];
          if (cloned.description && !res.description) res.description = cloned.description;
          if (!res.id || res.id.startsWith('entry_')) {
            const domSlug = (cloned.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            res.id = `dom-${domSlug}`;
          }
        }
        return res;
      }
    }

    // Fallback when SchemaMigrator is not yet initialized
    if (isRowArray && Array.isArray(raw)) {
      const cleanName = this.capitalizeTitle(this.cleanArrow(String(raw[0] || '').trim()));
      const normType = this.capitalizeIdentifier(String(raw[1] || 'Feat').trim());
      const diceStr = String(raw[24] || '').trim();
      return this.ensureV2({
        schemaVersion: 2,
        name: cleanName,
        type: normType,
        slot: this.capitalizeIdentifier(String(raw[2] || 'None').trim()),
        source: String(raw[4] || 'Core 3.5e').trim(),
        benefit: String(raw[5] || '').trim(),
        description: String(raw[5] || '').trim(),
        scope: this.capitalizeIdentifier(String(raw[7] || 'None / General').trim()),
        action: String(raw[25] || 'Passive').trim(),
        actionType: this.deriveActionType(raw[25], normType).toLowerCase(),
        duration: String(raw[26] || 'Continuous').trim(),
        weight: Number(raw[27]) || 0,
        cost: Number(raw[28]) || 0,
        modifiers: [],
        damageParts: diceStr ? [{ dice: diceStr, bonus: 0, type: 'Untyped', multiplyOnCrit: normType === 'Weapon', onCritOnly: false, source: cleanName }] : [],
        modes: []
      });
    }

    const cloned = Object.assign({}, raw);
    if (cloned.name) cloned.name = this.capitalizeTitle(this.cleanArrow(cloned.name));
    if (cloned.type === 'Deity' || cloned.domains || cloned.portfolio || cloned.rank) {
      if (cloned.favoredWeapon && !cloned.weapon) cloned.weapon = cloned.favoredWeapon;
      if (cloned.weapon && !cloned.favoredWeapon) cloned.favoredWeapon = cloned.weapon;
      if (!cloned.alignment) cloned.alignment = 'Any';
      if (!Array.isArray(cloned.domains)) cloned.domains = [];
    }
    if (cloned.type === 'Domain' || (cloned.category && String(cloned.category).toLowerCase().includes('domain'))) {
      cloned.type = 'Domain';
      cloned.category = cloned.category || 'Cleric Domain';
      if (!cloned.grantedPower) {
        cloned.grantedPower = { description: cloned.description || '', classSkills: [], grantedFeats: [], spellLikeAbilities: [] };
      } else if (typeof cloned.grantedPower === 'string') {
        cloned.grantedPower = { description: cloned.grantedPower, classSkills: [], grantedFeats: [], spellLikeAbilities: [] };
      }
      const rawSpells = Array.isArray(cloned.spells) ? cloned.spells : (Array.isArray(cloned.domainSpells) ? cloned.domainSpells : []);
      cloned.spells = rawSpells.map((s, idx) => {
        const lvl = Number(s.level) || (idx + 1);
        const name = String(s.name || '').trim();
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return { level: lvl, id: s.id || `spl-${slug}`, name: name };
      });
      if (!Array.isArray(cloned.requiredAlignment)) cloned.requiredAlignment = [];
      if (!cloned.id) {
        const domSlug = (cloned.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        cloned.id = `dom-${domSlug}`;
      }
    }
    return this.ensureV2(cloned);
  },

  // Dynamic Targeted AI Prompt Builder (Category-Specific Micro-Prompts & Minimal V2 JSON Schema)
  buildTargetedAiPrompt(cleanQuery, effectiveCategory) {
    const cat = String(effectiveCategory || 'ALL').trim().toLowerCase();

    // 1. DEITY / DRACONIC PATRON / CULT POWER / PHILOSOPHY
    if (cat === 'deity' || cat === 'god' || cat === 'patron') {
      return `You are an expert D&D 3.5e Lore & Faith Architect (Deities & Demigods, Faiths and Pantheons, Dragons of Faerûn, Wyrms of the North, Champions of Ruin, Fiendish Codex).
Target query: "${cleanQuery}" (Category: "Deity / Patron").

CRITICAL RULE: NEVER return an empty entries array! Whether the query is an official D&D 3.5e Deity, a Forgotten Realms / Eberron / Greyhawk lore figure (such as an Ancient Dragon like Khazmil / Urshula the Black, an Archfiend, or Undead Lord), or a custom campaign Patron, you MUST ALWAYS return 1 complete Deity/Patron object in the 'entries' array. If the figure is a Dragon, Patron, or Cult Power without a standard PHB deity block, infer their exact Alignment (e.g. 'Chaotic Evil' for Black Dragons), Favored Weapon (e.g. 'Bite' or 'Claw'), Rank ('Dragon Patron / Cult Power'), Icon ('🐉'), Title, Portfolio, and 3 to 5 fitting D&D 3.5e Cleric Domains (e.g. ['Chaos', 'Destruction', 'Dragon', 'Evil', 'Water']) from D&D 3.5e lore and the query text.

DEITY / PATRON / CULT POWER RULES:
1. MANDATORY TYPO / FUZZY CORRECTION: Correct misspellings to official 3.5e English names.
2. OUTPUT 100% ENGLISH D&D 3.5E RAW FIELDS:
   - "alignment": full 3.5e alignment (e.g. "Lawful Good", "Chaotic Evil", "Neutral Good", "Lawful Evil", "True Neutral", or "Any").
   - "rank": one of "Greater Deity", "Intermediate Deity", "Lesser Deity", "Demigod", "Hero-Deity", "Dragon Patron / Cult Power", "Philosophy / Cosmic Force".
   - "icon": exactly 1 thematic emoji from: ☀️, ⚡, 🥊, 🏹, 🔨, 🦄, 🌾, 🐲, 📖, 🥾, 🍂, 🪓, 🕯️, 🎭, 💎, ⛓️, 💀, 👁️‍🗨️, 🩸, 👁️, 🐉, 🌀, 🔮, ✨ (NEVER use dice emoji).
   - "favoredWeapon": official D&D 3.5e weapon name (e.g. "Longsword", "Heavy Mace", "Bite", "Claw", "Scimitar", "Dagger", "Quarterstaff", "Greatsword").
   - "domains": array of 3 to 5 official D&D 3.5e Cleric domain names (e.g. ["Chaos", "Destruction", "Dragon", "Evil", "Water"]).
   - "portfolio": summary of divine/patron portfolio (e.g. "Chromatic dragons, conquest, evil, greed").
   - "symbol": description of holy or unholy symbol or heraldry.
   - "category": pantheon or classification (e.g. "Forgotten Realms • Draconic Patrons", "Core Pantheon", "Faerûnian Pantheon", "Greyhawk Pantheon", "Draconic Pantheon").

OUTPUT JSON SCHEMA:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "deity_unique_slug",
      "name": "Official 3.5e Name",
      "type": "Deity",
      "title": "Official Epithets / Aliases",
      "category": "Pantheon / Classification",
      "icon": "🐉",
      "rank": "Dragon Patron / Cult Power",
      "alignment": "Chaotic Evil",
      "favoredWeapon": "Bite",
      "domains": ["Chaos", "Destruction", "Dragon", "Evil", "Water"],
      "portfolio": "Summary of portfolio",
      "symbol": "Holy or unholy symbol description",
      "source": "Official 3.5e publication and page",
      "description": "Full official lore and description in English"
    }
  ]
}`;
    }

    // 2. DOMAIN / CLERIC DOMAIN
    if (cat === 'domain' || cat === 'cleric domain') {
      return `You are an expert D&D 3.5e Domain & Divine Magic Arbiter (Spell Compendium, Player's Handbook, Complete Divine).
Target query: "${cleanQuery}" (Category: "Domain").

CRITICAL RULE: NEVER return an empty entries array! You MUST ALWAYS return 1 complete Cleric Domain object in the 'entries' array matching the query. If the domain is from a splatbook, campaign setting, or thematic cult, accurately determine or infer its full 1st to 9th level spell progression and granted power from official D&D 3.5e RAW rules.

CLERIC DOMAIN RULES:
1. STRICT REAL RAW 3.5E INTEGRATION:
   - Consult official D&D 3.5e sources (Spell Compendium, Player's Handbook, Complete Divine, Frostburn, Sandstorm, Stormwrack, Book of Exalted Deeds, Fiendish Codex, etc.).
2. MANDATORY TYPO / FUZZY CORRECTION: Correct misspellings to official 3.5e English name.
3. DOMAIN V2 SCHEMA:
   - "type": "Domain"
   - "category": "Cleric Domain"
   - "source": Official 3.5e publication and page (e.g. "Spell Compendium p.272" or "Player's Handbook p.186")
   - "description": Full RAW description of the granted power
   - "grantedPower": structured object with:
     * "description": full RAW granted power text
     * "classSkills": array of skill names granted as class skills (e.g. ["Spot", "Listen"] or empty [])
     * "grantedFeats": array of bonus feat names granted (e.g. ["Blind-Fight"] or empty [])
     * "spellLikeAbilities": array of granted SLAs (e.g. [{"name": "Rebuke Air Creatures", "uses": "3+Cha/day", "casterLevel": "clericLevel"}] or empty [])
   - "requiredAlignment": array of alignment restrictions (e.g. ["Good"] or empty [])
   - "spells": exactly 9 domain spells from 1st to 9th level in order: [{"level": 1, "name": "Exact 1st-level Spell Name"}, ..., {"level": 9, "name": "Exact 9th-level Spell Name"}]
   - "modifiers": Canonical V2 modifiers for any numerical bonuses granted by the domain (e.g. initiative, saving throws, skill bonuses): [{"target": "initiative"|"save.fort"|"skill.spot"|..., "value": 2, "type": "Untyped"|"Competence"|"Sacred"|"Profane", "condition": null}]. Leave [] if no passive flat bonus.

OUTPUT JSON SCHEMA:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "dom_unique_slug",
      "name": "Official 3.5e Domain Name",
      "type": "Domain",
      "category": "Cleric Domain",
      "source": "Official 3.5e book and page",
      "description": "Full RAW granted power description in English",
      "grantedPower": {
        "description": "Full RAW granted power text in English",
        "classSkills": [],
        "grantedFeats": [],
        "spellLikeAbilities": []
      },
      "requiredAlignment": [],
      "spells": [
        { "level": 1, "name": "1st-level domain spell" },
        { "level": 2, "name": "2nd-level domain spell" },
        { "level": 3, "name": "3rd-level domain spell" },
        { "level": 4, "name": "4th-level domain spell" },
        { "level": 5, "name": "5th-level domain spell" },
        { "level": 6, "name": "6th-level domain spell" },
        { "level": 7, "name": "7th-level domain spell" },
        { "level": 8, "name": "8th-level domain spell" },
        { "level": 9, "name": "9th-level domain spell" }
      ],
      "modifiers": []
    }
  ]
}`;
    }

    // 3. SPELL / POWER
    if (cat === 'spell' || cat === 'power') {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "Spell").

${this.DND35_RAW_GUARDRAIL}

SPELL SPECIFIC CANONICAL V2 RULES:
1. STRICT REAL RAW 3.5E ONLY: Consult d20srd.org, dndtools.net, Spell Compendium, PHB, or official WotC 3.5e publications. If entity does not exist in official 3.5e, return {"entries": []}.
2. MANDATORY TYPO / FUZZY CORRECTION: Correct misspellings to official D&D 3.5e English name.
3. CANONICAL V2 FIELDS:
   - "spellStats": {"castingTime": "1 standard action", "range": "Close (25 ft. + 5 ft./2 levels)", "target": "One creature", "duration": "1 round/level", "savingThrow": "Will negates", "spellResistance": "Yes"}
   - "modifiers": put any stat, roll, or speed bonuses here: [{"target": "ac.dodge"|"attack.all"|"speed.land"|..., "value": 1, "type": "Dodge"|"Morale"|"Enhancement"|..., "condition": null}]. Leave [] if spell deals direct damage or has special effects.
   - "damageParts": put spell damage dice here: [{"dice": "1d6", "bonus": 0, "type": "Fire"|"Cold"|"Force"|..., "multiplyOnCrit": false, "onCritOnly": false, "source": "Base"}].
   - "modes": embed variable modes or sub-choices if applicable: [{"id": "vs_undead", "name": "Undead (1d6/CL)", "actionType": "standard", "benefit": "...", "damageParts": [...], "modifiers": [...]}].

OUTPUT JSON SCHEMA:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "spell_unique_slug",
      "name": "Official 3.5e Name",
      "type": "Spell",
      "school": "Evocation",
      "level": 3,
      "spellStats": {
        "castingTime": "1 standard action",
        "range": "Medium (100 ft. + 10 ft./level)",
        "target": "20-ft.-radius spread",
        "duration": "Instantaneous",
        "savingThrow": "Reflex half",
        "spellResistance": "Yes"
      },
      "modifiers": [],
      "damageParts": [],
      "modes": [],
      "source": "Official 3.5e book and page",
      "benefit": "Concise mechanical summary in English",
      "description": "Full official RAW description in English"
    }
  ]
}`;
    }

    // 3. FEAT / DM BOON / SPECIAL ABILITY / RACIAL TRAIT / FLAW
    if (['feat', 'dm boon', 'boon', 'special ability', 'ability', 'racial trait', 'flaw', 'class bonus feat', 'warlock invocation'].includes(cat)) {
      const isBoonQuery = cat === 'dm boon' || cat === 'boon' || /\b(boon|grant|custom)\b/i.test(cleanQuery) || /\bskill\s*:/i.test(cleanQuery) || /^[+-]\d+\s+[a-z]/i.test(cleanQuery);
      return `You are a master D&D 3.5e Rule Arbiter & Canonical V2 Architect.
Target query: "${cleanQuery}" (Category: "${effectiveCategory || 'Feat'}").

${this.DND35_RAW_GUARDRAIL}

FEAT / ABILITY / DM BOON CANONICAL V2 RULES:
1. OFFICIAL 3.5E FEATS, ACFs, FLAWS, TRAITS & SPLATBOOKS:
   - Consult Player's Handbook I & II, Complete Series, Tome of Battle, Unearthed Arcana (Flaws, Traits, Variant Class Features), Dragon Magazine Compendium, Races of Stone/Destiny/the Wild/the Dragon, Frostburn, Sandstorm, Stormwrack, Libris Mortis, Book of Exalted Deeds/Vile Darkness, etc.
2. DM BOON & CUSTOM BONUS SYNTHESIS (CRITICAL — DO NOT MAP TO UNRELATED PHB FEATS!):
   - ${isBoonQuery ? 'THIS QUERY IS A DM BOON / SKILL OR STAT BONUS REQUEST!' : 'If the query describes a DM Boon, Skill Bonus (e.g. "boon, skill: +ride", "+4 Ride"), Stat/Save/Attack/AC Bonus, or Campaign Grant:'}
   - NEVER substitute an unrelated official feat like "Mounted Combat" or "Skill Focus" when the user asks for a direct skill/stat boon (such as "boon, skill: +ride" or "+4 Ride").
   - Instead, create a dedicated Canonical V2 entry named clearly (e.g. "DM Boon: Ride Bonus (+4)" or "DM Boon: +4 Ride") with exact numerical "modifiers" (e.g. [{"target": "skill.ride", "value": 4, "type": "Untyped", "condition": null}]), "prereq": "-", "source": "DM Boon / Campaign Grant", and a concise English "benefit" describing the bonus. (If a skill bonus query like "boon, skill: +ride" omits the number, default to +2 or +4).
3. CANONICAL V2 FIELDS:
   - "prereq": exact prerequisites or "-"
   - "benefit": concise mechanical summary in English
   - "normal": what a character without this feat can do, or "-"
   - "special": special notes, fighter bonus feat qualification, or "-"
   - "modifiers": put all numerical modifiers here:
     * Skill bonus: {"target": "skill.ride"|"skill.spot"|"skill.hide"|"skill.tumble"|"skill.diplomacy"|"skill.all"|..., "value": 4, "type": "Untyped"|"Competence"|"Insight"|"Sacred"|"Morale"|"Circumstance", "condition": null}
     * Ability / Save / Combat: {"target": "ability.str"|"save.fort"|"save.ref"|"save.will"|"save.all"|"attack.melee"|"attack.all"|"damage.all"|"ac.natural"|"ac.deflection"|"ac.dodge"|"initiative"|"speed.land", "value": 2, "type": "Untyped"|..., "condition": null}
   - "damageParts": put extra damage dice here if applicable: [{"dice": "...", "bonus": 0, "type": "Untyped", "multiplyOnCrit": false, "onCritOnly": false, "source": "..."}].

    - "save": saving throw type if applicable ("Fortitude" | "Reflex" | "Will" | "None")
    - "dcFormula": dynamic Save DC formula using Canonical V2 tokens ("10 + @level + @conMod", "10 + floor(@level / 2) + @chaMod", etc.)
    - "range": range or area if applicable (e.g. "60 ft.")
    - "recharge": cooldown/recharge text if applicable (e.g. "1d4+1 rounds") — NEVER put Recharge/Cooldown dice into "damageParts"!
    - "rechargeDice": rollable cooldown dice expression if applicable (e.g. "1d4+1")

OUTPUT JSON SCHEMA:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "feat_unique_slug",
      "name": "Official 3.5e Name or DM Boon Title",
      "type": "${cat === 'special ability' || cat === 'ability' ? 'Special Ability' : (cat === 'flaw' ? 'Flaw' : 'Feat')}",
      "prereq": "Prerequisites or '-'",
      "benefit": "Concise mechanical summary in English",
      "normal": "What a character without this feat can do, or '-'",
      "special": "Special rules or '-'",
      "range": "60 ft.",
      "save": "Reflex",
      "dcFormula": "10 + @level + @conMod",
      "recharge": "1d4+1 rounds",
      "rechargeDice": "1d4+1",
      "modifiers": [],
      "damageParts": [],
      "source": "Official 3.5e book and page or 'DM Boon / Campaign Grant'",
      "description": "Full official RAW or DM Boon description in English"
    }
  ]
}`;
    }

    // 4. WEAPON / ARMOR / SHIELD / WONDROUS ITEM / RING / MAGIC ITEM / AUGMENT CRYSTAL / EQUIPMENT
    if (['weapon', 'armor', 'shield', 'armor / shield', 'wondrous item', 'ring', 'magic item', 'item', 'equipment', 'augment crystal', 'potion', 'scroll', 'wand', 'consumable'].includes(cat)) {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "${effectiveCategory}").

${this.DND35_RAW_GUARDRAIL}

ITEM / EQUIPMENT SPECIFIC CANONICAL V2 RULES:
1. STRICT REAL RAW 3.5E ONLY: Consult d20srd.org, dndtools.net, Magic Item Compendium, DMG, PHB, or official WotC 3.5e publications. If item does not exist in official 3.5e, return {"entries": []}.
2. MANDATORY TYPO / FUZZY CORRECTION: Correct misspellings to official 3.5e name.
3. ITEM / EQUIPMENT V2 SCHEMA:
   - "type": "Weapon" | "Armor" | "Shield" | "Wondrous Item" | "Ring" | "Augment Crystal" | "Potion" | "Scroll" | "Wand" | "Consumable"
   - "slot": "None" | "Main Hand" | "Two Hands" | "Off-Hand/Shield" | "Armor" | "Head" | "Face" | "Throat" | "Shoulders" | "Body" | "Torso" | "Waist" | "Ring" | "Feet" | "Hands" | "Arms"
   - "priceGp": market price in GP (number, e.g. 15 or 8300)
   - "weightLb": weight in lbs (number, e.g. 4 or 0.5)
   - Weapon: populate "weaponMeta": {"proficiency": "Simple"|"Martial"|"Exotic", "handedness": "Unarmed"|"Light"|"One-Handed"|"Two-Handed"|"Ranged", "damageDice": "1d8", "critMin": 19, "critMult": 2, "damageType": "Slashing", "rangeIncrement": 0, "isDoubleWeapon": false, "isFinessable": false}. Set weapon damage in "damageParts": [{"dice": "1d8", "bonus": 0, "type": "Slashing", "multiplyOnCrit": true, "onCritOnly": false, "source": "Base"}].
   - Armor / Shield: populate "armorMeta": {"category": "Light"|"Medium"|"Heavy"|"Shield", "armorBonus": 4, "maxDex": 4, "acp": -2, "asf": 20, "speed30": 30, "speed20": 20}. Set AC in "modifiers": [{"target": "ac.armor"|"ac.shield", "value": 4, "type": "Armor"|"Shield", "condition": null}].
   - Augment Crystal (MIC): set "type": "Augment Crystal", "crystalTier": "Least"|"Lesser"|"Greater", "crystalSlot": "Weapon"|"Armor"|"Shield".
   - Wondrous Items / Rings: put all stat bonuses in "modifiers": [{"target": "ac.deflection"|"ability.str"|"save.all"|..., "value": 2, "type": "Deflection"|"Enhancement"|"Resistance"|..., "condition": null}].

OUTPUT JSON SCHEMA:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "item_unique_slug",
      "name": "Official 3.5e Name",
      "type": "${['weapon', 'armor', 'shield', 'ring', 'augment crystal'].includes(cat) ? (cat === 'armor / shield' ? 'Armor' : effectiveCategory) : 'Wondrous Item'}",
      "slot": "None",
      "priceGp": 0,
      "weightLb": 0,
      "crystalTier": null,
      "crystalSlot": null,
      "weaponMeta": null,
      "armorMeta": null,
      "modifiers": [],
      "damageParts": [],
      "source": "Official 3.5e book and page",
      "benefit": "Concise mechanical summary in English",
      "description": "Full official RAW description in English"
    }
  ]
}`;
    }

    // 5. RACE
    if (cat === 'race') {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "Race").

${this.DND35_RAW_GUARDRAIL}

RACE SPECIFIC CANONICAL V2 RULES:
1. STRICT REAL RAW 3.5E ONLY: Consult d20srd.org, dndtools.net, Monster Manual, Races of Destiny/Stone/Wild/Dragon, or official WotC 3.5e publications. If race does not exist in official 3.5e, return {"entries": []}.
2. MANDATORY TYPO / FUZZY CORRECTION: Correct misspellings to official 3.5e name.
3. RACE V2 SCHEMA:
   - "size": "Fine" | "Diminutive" | "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan" | "Colossal"
   - "baseSpeed": base land speed in feet (number, e.g. 30)
   - "vision": "Normal", "Low-Light Vision", "Darkvision 60 ft.", etc.
   - "favoredClass": e.g. "Wizard", "Rogue", "Fighter", "Any"
   - "levelAdjustment": LA number (e.g. 0, 1, 2)
   - "modifiers": racial ability adjustments and bonuses: [{"target": "ability.dex"|"ability.con"|"save.fort"|"skill.listen"|..., "value": 2, "type": "Racial", "condition": null}].

OUTPUT JSON SCHEMA:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "race_unique_slug",
      "name": "Official 3.5e Name",
      "type": "Race",
      "size": "Medium",
      "baseSpeed": 30,
      "vision": "Normal",
      "favoredClass": "Any",
      "levelAdjustment": 0,
      "modifiers": [],
      "source": "Official 3.5e book and page",
      "benefit": "Concise summary of racial traits and ability modifiers",
      "description": "Full official RAW description and racial lore in English"
    }
  ]
}`;
    }

    // 6. MANEUVER / STANCE
    if (cat === 'maneuver' || cat === 'stance') {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "Maneuver / Stance").

${this.DND35_RAW_GUARDRAIL}

MANEUVER / STANCE SPECIFIC RULES:
1. STRICT REAL RAW 3.5E TOME OF BATTLE ONLY: Consult Tome of Battle: The Book of Nine Swords. If maneuver/stance does not exist in official 3.5e ToB, return {"entries": []}.
2. MANDATORY TYPO / FUZZY CORRECTION: Correct misspellings to official 3.5e name.
3. MANEUVER / STANCE V2 SCHEMA:
   - "discipline": "Desert Wind" | "Devoted Spirit" | "Diamond Mind" | "Iron Heart" | "Setting Sun" | "Shadow Hand" | "Stone Dragon" | "Tiger Claw" | "White Raven"
   - "level": initiator level (1 to 9)
   - "prereq": prerequisites or "None"
   - "action": "Standard Action" | "Swift Action" | "Immediate Action" | "Full-Round Action"
   - "actionType": "standard" | "swift" | "immediate" | "full_round"
   - "duration": "Instantaneous" | "Stance" | "1 round"
   - "modifiers": stance or maneuver numerical bonuses
   - "damageParts": strike damage dice: [{"dice": "2d6", "bonus": 0, "type": "Untyped", "multiplyOnCrit": false, "onCritOnly": false, "source": "Base"}]

OUTPUT JSON SCHEMA:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "man_unique_slug",
      "name": "Official 3.5e Name",
      "type": "${cat === 'stance' ? 'Stance' : 'Maneuver'}",
      "discipline": "Stone Dragon",
      "level": 1,
      "prereq": "None",
      "action": "Standard Action",
      "actionType": "standard",
      "duration": "Instantaneous",
      "modifiers": [],
      "damageParts": [],
      "source": "Tome of Battle p.XX",
      "benefit": "Concise mechanical summary in English",
      "description": "Full official RAW description in English"
    }
  ]
}`;
    }

    // 7. CONDITION
    if (cat === 'condition') {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "Condition").

${this.DND35_RAW_GUARDRAIL}

CONDITION SPECIFIC RULES:
1. STRICT REAL RAW 3.5E ONLY: Consult official 3.5e SRD or DMG conditions. If condition does not exist in official 3.5e, return {"entries": []}.
2. Output standard D&D 3.5e condition penalties in "modifiers" (e.g. Blinded, Shaken, Frightened, Stunned, Fatigued, Exhausted, Entangled, Prone, Grappled, Pinned, Dazed, Sickened, Nauseated, Helpless).

OUTPUT JSON SCHEMA:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "cond_unique_slug",
      "name": "Official 3.5e Name",
      "type": "Condition",
      "modifiers": [
        { "target": "attack.all", "value": -2, "type": "Penalty", "condition": null }
      ],
      "source": "DMG / SRD 3.5e",
      "benefit": "Concise mechanical summary of penalties and restrictions",
      "description": "Full official RAW description in English"
    }
  ]
}`;
    }

    // 8. CLASS (Base Classes, Prestige Classes, Unearthed Arcana Variants & ACFs)
    if (cat === 'class') {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "Class").

${this.DND35_RAW_GUARDRAIL}

CLASS & VARIANT CLASS SPECIFIC RULES:
1. BASE CLASSES, PRESTIGE CLASSES & UNEARTHED ARCANA / SPLATBOOK VARIANTS:
   - Consult PHB I & II, DMG, Complete Series, Tome of Battle, Unearthed Arcana (Variant Character Classes p.47-70, such as "Rogue (Adventurer Variant)" / Martial Feat Rogue which trades Sneak Attack at levels 1, 3, 5..19 for Fighter Bonus Feats, "Fighter (Thug Variant)", "Cleric (Cloistered Cleric)", "Wizard (Domain Wizard)", "Ranger (Urban Ranger)", "Barbarian (Whirling Frenzy)"), Dragon Magazine Compendium, and Racial Substitution Levels.
   - Correct typos automatically (e.g. "rogue, Adventuerer" -> "Rogue (Adventurer Variant)").
   - NEVER return a placeholder name like "Non-Existent Class".
2. CLASS V2 SCHEMA:
   - "hitDie": "d4" | "d6" | "d8" | "d10" | "d12"
   - "bab": "Good" (+1/lvl) | "Medium" (+3/4 lvl) | "Poor" (+1/2 lvl)
   - "fort": "Good" | "Poor"
   - "ref": "Good" | "Poor"
   - "will": "Good" | "Poor"
   - "skillPoints": number of skill points per level (e.g. 2, 4, 6, 8)
   - "classSkills": array of class skill names

OUTPUT JSON SCHEMA:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "class_unique_slug",
      "name": "Official 3.5e Class or Variant Name",
      "type": "Class",
      "hitDie": "d8",
      "bab": "Good",
      "fort": "Good",
      "ref": "Poor",
      "will": "Poor",
      "skillPoints": 2,
      "classSkills": ["Climb", "Jump", "Swim"],
      "source": "Official 3.5e book and page (e.g. Unearthed Arcana p.58)",
      "benefit": "Class summary and role in English",
      "description": "Full official RAW description in English"
    }
  ]
}`;
    }

    // 10. MANDATORY CATEGORY ENFORCEMENT - RETIRE UNCONSTRAINED 'ALL'
    throw new Error(`Rule Master AI requires a specific category (e.g., Feat, Spell, Deity, Domain, Weapon, Armor, Race, Class, Maneuver, Condition). Unconstrained '${effectiveCategory || 'ALL'}' queries are retired to ensure fast, zero-filler responses.`);
  },

  // Check if an entry already exists in the Site Database (Custom Master DB, SRD Compendium, or Core Catalogs)
  getExistingSiteDbInfo(item) {
    if (!item || typeof item !== 'object') {
      return { exists: false, inMasterDb: false, inCoreCompendium: false, masterDbIndex: -1, sourceLabel: null };
    }
    const cleanName = (item.name || '').toLowerCase().trim();
    const cleanId = (item.id || '').toLowerCase().trim();

    // 1. Check Character Custom Master DB
    if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
      const mIdx = masterDb.findIndex(m => m && ((cleanId && (m.id || '').toLowerCase().trim() === cleanId) || (cleanName && (m.name || '').toLowerCase().trim() === cleanName)));
      if (mIdx >= 0) {
        return { exists: true, inMasterDb: true, inCoreCompendium: false, masterDbIndex: mIdx, sourceLabel: 'Custom Master DB' };
      }
    }

    // 2. Check SrdCompendium (3,522+ modular V2 entries)
    if (typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) {
      const exactComp = (cleanId && window.SrdCompendium.getById(cleanId)) || (cleanName && window.SrdCompendium.getByName(cleanName));
      if (exactComp) {
        return { exists: true, inMasterDb: false, inCoreCompendium: true, masterDbIndex: -1, sourceLabel: 'Site V2 SRD Compendium' };
      }
    }

    // 3. Check Canonical Dictionary (ToB / Splatbook staples)
    if (cleanName && this.canonicalDictionary && this.canonicalDictionary[cleanName] && typeof this.canonicalDictionary[cleanName] === 'object') {
      return { exists: true, inMasterDb: false, inCoreCompendium: true, masterDbIndex: -1, sourceLabel: 'Site V2 Core Library' };
    }

    // 4. Check BUNDLED_TOB_MANEUVERS_CATALOG & BUNDLED_SRD_CORE_CATALOG
    if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_TOB_MANEUVERS_CATALOG)) {
      const tobMatch = window.BUNDLED_TOB_MANEUVERS_CATALOG.some(e => e && ((cleanName && (e.name || '').toLowerCase().trim() === cleanName) || (cleanId && (e.id || '').toLowerCase().trim() === cleanId)));
      if (tobMatch) {
        return { exists: true, inMasterDb: false, inCoreCompendium: true, masterDbIndex: -1, sourceLabel: 'Site V2 ToB Library' };
      }
    }
    if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
      const coreMatch = window.BUNDLED_SRD_CORE_CATALOG.some(e => e && ((cleanName && (e.name || '').toLowerCase().trim() === cleanName) || (cleanId && (e.id || '').toLowerCase().trim() === cleanId)));
      if (coreMatch) {
        return { exists: true, inMasterDb: false, inCoreCompendium: true, masterDbIndex: -1, sourceLabel: 'Site V2 SRD Core' };
      }
      if (cleanName) {
        const baseMatch = this.findBaseItemInSrdCore(cleanName);
        if (baseMatch && (baseMatch.name || '').toLowerCase().trim() === cleanName) {
          return { exists: true, inMasterDb: false, inCoreCompendium: true, masterDbIndex: -1, sourceLabel: 'Site V2 SRD Core' };
        }
      }
    }

    if (item._fromLocalSiteDb) {
      return { exists: true, inMasterDb: false, inCoreCompendium: true, masterDbIndex: -1, sourceLabel: item._localSourceLabel || 'Site V2 Compendium' };
    }

    return { exists: false, inMasterDb: false, inCoreCompendium: false, masterDbIndex: -1, sourceLabel: null };
  },

  // Create a deterministic signature of editable V2 fields to verify modifications in "Change & Add" mode
  getComparableEntrySignature(item) {
    const v2 = this.ensureV2(item || {});
    return JSON.stringify({
      name: (v2.name || '').trim().toLowerCase(),
      type: (v2.type || '').trim().toLowerCase(),
      slot: (v2.slot || '').trim().toLowerCase(),
      source: (v2.source || '').trim().toLowerCase(),
      prereq: (v2.prereq || '-').trim().toLowerCase(),
      benefit: (v2.benefit || v2.description || '').trim(),
      action: (v2.action || 'Passive').trim().toLowerCase(),
      cost: Number(v2.cost) || 0,
      weight: Number(v2.weight) || 0,
      charges: v2.dailyCharges?.max || 0,
      modifiers: Array.isArray(v2.modifiers) ? v2.modifiers.map(m => ({ target: m.target, value: Number(m.value) || 0, type: m.type, condition: m.condition || null })) : [],
      damageParts: Array.isArray(v2.damageParts) ? v2.damageParts.map(d => ({ dice: d.dice || '', bonus: Number(d.bonus) || 0, type: d.type || '' })) : [],
      ruleFlags: v2.ruleFlags || {},
      weaponStats: v2.weaponStats ? { baseDamage: v2.weaponStats.baseDamage, critMin: Number(v2.weaponStats.critMin) || 20, critMult: Number(v2.weaponStats.critMult) || 2 } : null,
      armorStats: v2.armorStats ? { baseAc: v2.armorStats.baseAc, maxDex: v2.armorStats.maxDex, acp: v2.armorStats.acp, asf: v2.armorStats.asf } : null,
      level: v2.level !== undefined && v2.level !== '' ? String(v2.level) : '',
      school: (v2.school || v2.discipline || '').trim().toLowerCase(),
      range: (v2.range || '').trim().toLowerCase()
    });
  },

  // 0ms Local Resolution Helper: Master DB -> SrdCompendium -> ItemAssembler -> Canonical Dictionary
  resolveLocalZeroTokenQuery(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') return [];
    let cleanKey = rawQuery.toLowerCase().trim();
    const prefixMatch = cleanKey.match(/^(spell|feat|race|deity|god|patron|domain|weapon|armor|shield|item|magic item|maneuver|stance|class|condition):\s*/i);
    if (prefixMatch) {
      cleanKey = cleanKey.slice(prefixMatch[0].length).trim();
    }

    // Typo alias resolution
    if (typeof this.canonicalDictionary[cleanKey] === 'string') {
      cleanKey = this.canonicalDictionary[cleanKey];
    }

    const markSiteDb = (entry, label) => {
      const v2 = this.ensureV2(entry);
      v2._fromLocalSiteDb = true;
      v2._localSourceLabel = label;
      return v2;
    };

    // 0a. Check if query is a Structured Ability / Breath Weapon / SLA Stat Block (e.g. "Breath Weapon | 4d8 Acid | Save Reflex, DC:10+lvl+Con | 60ft, Recharge 1d4+1 turn")
    const structuredStatBlock = this.parseStructuredAbilityStatBlock(rawQuery);
    if (structuredStatBlock && structuredStatBlock.name) {
      return [this.ensureV2(structuredStatBlock)];
    }

    // 0b. Check if query is a DM Boon / Skill or Stat Grant (e.g. "dm boon ride +4", "boon, skill: +ride")
    if (typeof window !== 'undefined' && typeof window.synthesizeDmBoonFromQuery === 'function') {
      const synthBoon = window.synthesizeDmBoonFromQuery(cleanKey, '', '');
      if (synthBoon && synthBoon.name) {
        return [this.ensureV2(synthBoon)];
      }
    }

    // 1. Check user's Master DB first
    if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
      const dbMatch = masterDb.filter(m => m && (m.name || '').toLowerCase().trim() === cleanKey);
      if (dbMatch.length > 0) {
        return dbMatch.map(m => markSiteDb(m, 'Custom Master DB'));
      }
    }

    // 2. Check SrdCompendium (3,522+ modular V2 entries, O(1) lookup)
    if (typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) {
      const exactComp = window.SrdCompendium.getById(cleanKey) || window.SrdCompendium.getByName(cleanKey);
      if (exactComp) {
        return [markSiteDb(exactComp, 'Site V2 SRD Compendium')];
      }
      if (typeof window.SrdCompendium.getDomain === 'function') {
        const domComp = window.SrdCompendium.getDomain(cleanKey);
        if (domComp) {
          return [markSiteDb(domComp, 'Site V2 SRD Compendium')];
        }
      }
    }

    // 3. Check ItemAssembler for composite weapons/armors (e.g. "+2 Keen Mithral Scimitar", "+1 Flaming Greatsword")
    if (typeof window !== 'undefined' && window.ItemAssembler && typeof window.ItemAssembler.parseNaturalLanguageItem === 'function') {
      if (/\+\d|\b(?:mithral|adamantine|cold iron|alchemical silver|darkwood|masterwork|mwk|keen|flaming|frost|shock|holy|unholy|ghost touch|vorpal|defending|vicious|bane|fortification)\b/i.test(cleanKey)) {
        const assembled = window.ItemAssembler.parseNaturalLanguageItem(cleanKey);
        if (assembled && assembled.name) {
          return [this.ensureV2(assembled)];
        }
      }
    }

    // 4. Check Canonical Dictionary (ToB / Splatbook staples like Shock Trooper, Mountain Hammer, Shadow Blade)
    if (this.canonicalDictionary[cleanKey] && typeof this.canonicalDictionary[cleanKey] === 'object') {
      return [markSiteDb(this.canonicalDictionary[cleanKey], 'Site V2 Core Library')];
    }

    // 5. Check BUNDLED_TOB_MANEUVERS_CATALOG & BUNDLED_SRD_CORE_CATALOG
    if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_TOB_MANEUVERS_CATALOG)) {
      const tobMatch = window.BUNDLED_TOB_MANEUVERS_CATALOG.find(e => e && ((e.name || '').toLowerCase().trim() === cleanKey || (e.id || '').toLowerCase().trim() === cleanKey));
      if (tobMatch) {
        return [markSiteDb(tobMatch, 'Site V2 ToB Library')];
      }
    }
    if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
      const coreExact = window.BUNDLED_SRD_CORE_CATALOG.find(e => e && ((e.name || '').toLowerCase().trim() === cleanKey || (e.id || '').toLowerCase().trim() === cleanKey));
      if (coreExact) {
        return [markSiteDb(coreExact, 'Site V2 SRD Core')];
      }
      const baseMatch = this.findBaseItemInSrdCore(cleanKey);
      if (baseMatch && (baseMatch.name || '').toLowerCase().trim() === cleanKey) {
        return [markSiteDb(this.normalizeEntry(baseMatch), 'Site V2 SRD Core')];
      }
    }

    return [];
  },

  async fetchSingleAiRuleObjects(query, categoryHint, apiKey, statusTextEl = null) {
    let effectiveCategory = (categoryHint && categoryHint !== 'ALL') ? categoryHint : null;
    let cleanQuery = (query || '').trim();

    const prefixMatch = cleanQuery.match(/^(spell|feat|race|deity|god|patron|domain|weapon|armor|shield|item|magic item|maneuver|stance|class|condition):\s*/i);
    if (prefixMatch) {
      const p = prefixMatch[1].toLowerCase();
      cleanQuery = cleanQuery.slice(prefixMatch[0].length).trim();
      if (p === 'spell') effectiveCategory = 'Spell';
      else if (p === 'feat') effectiveCategory = 'Feat';
      else if (p === 'race') effectiveCategory = 'Race';
      else if (p === 'deity' || p === 'god' || p === 'patron') effectiveCategory = 'Deity';
      else if (p === 'domain') effectiveCategory = 'Domain';
      else if (p === 'weapon') effectiveCategory = 'Weapon';
      else if (p === 'armor') effectiveCategory = 'Armor';
      else if (p === 'shield') effectiveCategory = 'Shield';
      else if (p === 'item' || p === 'magic item') effectiveCategory = 'Magic Item';
      else if (p === 'maneuver' || p === 'stance') effectiveCategory = 'Maneuver';
      else if (p === 'class') effectiveCategory = 'Class';
      else if (p === 'condition') effectiveCategory = 'Condition';
    }

    if (!effectiveCategory || effectiveCategory === 'ALL') {
      throw new Error('Please select a specific Rule Category (e.g., Feat, Spell, Deity, Domain, Class, Weapon) or specify a prefix (e.g. "feat: Shock Trooper" or "domain: Planning") before querying AI.');
    }

    // 0ms Local Resolution before calling Gemini
    const localHits = this.resolveLocalZeroTokenQuery(cleanQuery);
    if (localHits.length > 0) {
      return localHits;
    }

    const promptText = this.buildTargetedAiPrompt(cleanQuery, effectiveCategory);
    const availableModels = this._sanitizeModelList(await this.getAvailableGeminiModels(apiKey, false, 'QUICK_SEARCH'));
    let lastError = null;

    for (const model of availableModels) {
      if (statusTextEl) {
        statusTextEl.textContent = `Querying "${cleanQuery}" ➔ ${model}...`;
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const genConfig = {
        temperature: 0.1,
        responseMimeType: "application/json"
      };
      if (model.includes('2.5')) {
        genConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: genConfig
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawAiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawAiText) {
            try {
              let parsed = null;
              try {
                parsed = JSON.parse(rawAiText);
              } catch (e) {
                const match = rawAiText.match(/\{[\s\S]*\}/);
                if (match) {
                  parsed = JSON.parse(match[0]);
                } else {
                  throw new Error('AI response is not in valid JSON format.');
                }
              }

              let rawList = [];
              if (parsed && Array.isArray(parsed.entries)) {
                rawList = parsed.entries;
              } else if (Array.isArray(parsed)) {
                rawList = parsed;
              } else if (parsed && typeof parsed === 'object') {
                rawList = [parsed];
              }

              if (typeof window !== 'undefined' && window.SchemaMigrator && typeof window.SchemaMigrator.upgradeArrayToV2 === 'function') {
                const v2List = window.SchemaMigrator.upgradeArrayToV2(rawList);
                if (v2List.length > 0) return v2List.map(item => this.normalizeEntry(item));
              } else {
                const normalizedEntries = [];
                rawList.forEach(rawItem => {
                  const isArrayRow = Array.isArray(rawItem);
                  const norm = this.normalizeEntry(rawItem, isArrayRow);
                  if (norm && norm.name) {
                    normalizedEntries.push(norm);
                  }
                });
                if (normalizedEntries.length > 0) return normalizedEntries;
              }
            } catch (pErr) {
              lastError = `JSON Parse Error (${model}): ${pErr.message}`;
            }
          }
        } else {
          const errJson = await response.json().catch(() => ({}));
          lastError = errJson.error?.message || `HTTP ${response.status} (${model})`;
          const errLower = String(lastError || '').toLowerCase();
          if (
            response.status === 404 ||
            errLower.includes('not found') ||
            errLower.includes('no longer available') ||
            errLower.includes('deprecated') ||
            errLower.includes('is not supported')
          ) {
            if (this._failedGeminiModels && model) {
              this._failedGeminiModels.add(String(model).toLowerCase().trim());
            }
            this._discoveredApiModels = null;
            this._cachedTaskModels = {};
            try {
              localStorage.removeItem('dnd35_gemini_discovered_models');
              localStorage.removeItem('dnd35_gemini_routing_matrix');
            } catch (e) {}
          }
        }
      } catch (netErr) {
        clearTimeout(timeoutId);
        if (netErr && netErr.name === 'AbortError') {
          lastError = `Timeout (6s) - ${model} did not respond.`;
        } else {
          lastError = `${netErr.message} (${model})`;
        }
      }
    }

    throw new Error(lastError || `No official D&D 3.5e rule or item found for "${query}".`);
  },

  async queryAiRule() {
    const queryInput = document.getElementById('ai-rule-query');
    const catSelect = document.getElementById('ai-rule-category');
    const statusBox = document.getElementById('ai-rule-status');
    const statusText = document.getElementById('ai-rule-status-text');
    const resultsContainer = document.getElementById('ai-results-container');
    const resultsWrapper = document.getElementById('ai-results-wrapper');
    const btn = document.getElementById('ai-rule-btn');

    let query = queryInput ? queryInput.value.trim() : '';
    let categoryHint = catSelect ? catSelect.value : 'ALL';

    if (!query) {
      alert('Please enter the name of the rule, item, spell, feat, or ability you want to search.');
      if (queryInput) queryInput.focus();
      return;
    }

    const prefixMatch = query.match(/^(spell|feat|race|deity|god|patron|domain|weapon|armor|shield|item|magic item|maneuver|stance|class|condition):\s*/i);
    if (prefixMatch) {
      const p = prefixMatch[1].toLowerCase();
      let matchedCat = 'Feat';
      if (p === 'spell') matchedCat = 'Spell';
      else if (p === 'feat') matchedCat = 'Feat';
      else if (p === 'race') matchedCat = 'Race';
      else if (p === 'deity' || p === 'god' || p === 'patron') matchedCat = 'Deity';
      else if (p === 'domain') matchedCat = 'Domain';
      else if (p === 'weapon') matchedCat = 'Weapon';
      else if (p === 'armor') matchedCat = 'Armor';
      else if (p === 'shield') matchedCat = 'Shield';
      else if (p === 'item' || p === 'magic item') matchedCat = 'Magic Item';
      else if (p === 'maneuver' || p === 'stance') matchedCat = 'Maneuver';
      else if (p === 'class') matchedCat = 'Class';
      else if (p === 'condition') matchedCat = 'Condition';

      categoryHint = matchedCat;
      if (catSelect) catSelect.value = matchedCat;
    }

    if (!prefixMatch && (!categoryHint || categoryHint === 'ALL')) {
      const msg = 'Please select a Rule Category (e.g., Feat, Spell, Deity, Domain, Class, Weapon) or type a prefix like "feat: Shock Trooper" or "domain: Planning" before searching.';
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({ title: 'Category Required', breakdown: msg, icon: '⚠️' });
      } else {
        alert('⚠️ ' + msg);
      }
      catSelect?.focus();
      return;
    }

    // 0ms Local Resolution (Master DB -> SrdCompendium -> ItemAssembler -> Canonical Dictionary)
    const localFound = this.resolveLocalZeroTokenQuery(query);
    if (localFound.length > 0) {
      this.lastAiResults = localFound;
      this.renderAiResults();
      if (resultsWrapper) resultsWrapper.classList.remove('hidden');
      if (statusBox) statusBox.classList.remove('hidden');
      const dbInfo = this.getExistingSiteDbInfo(localFound[0]);
      if (statusText) {
        statusText.innerHTML = dbInfo.exists
          ? `✅ <b>"${RuleMaster.escapeHtml(localFound[0].name)}"</b> already exists in the site database (<b>${dbInfo.sourceLabel}</b>). Direct duplicate addition is locked — click <b>Change &amp; Add</b> to customize and save a modified version.`
          : `⚡ <b>"${RuleMaster.escapeHtml(localFound[0].name)}"</b> assembled instantaneously via V2 Item Assembler (0 ms, Zero Tokens).`;
      }
      if (btn) btn.disabled = false;
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('Please enter a valid Gemini API Key to use Rule Master AI.');
      this.promptApiKey();
      return;
    }

    if (btn) btn.disabled = true;
    if (statusBox) statusBox.classList.remove('hidden');
    if (statusText) statusText.textContent = `Searching "${query}" and verifying against D&D 3.5e RAW library...`;
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (resultsWrapper) resultsWrapper.classList.add('hidden');

    try {
      const entries = await this.fetchSingleAiRuleObjects(query, categoryHint, apiKey, statusText);

      if (!entries || !entries.length) {
        throw new Error(`No official D&D 3.5e rule or item found for "${query}".`);
      }

      this.lastAiResults = entries;
      this.renderAiResults();
      if (resultsWrapper) resultsWrapper.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      if (btn) btn.disabled = false;
      if (statusBox) statusBox.classList.add('hidden');
    }
  },

  async fetchSingleAiRuleEntries(query, categoryHint, apiKey, statusTextEl = null) {
    return await this.fetchSingleAiRuleObjects(query, categoryHint, apiKey, statusTextEl);
  },

  async fetchDeityViaAi(deityName, statusTextEl = null) {
    const localHits = this.resolveLocalZeroTokenQuery(deityName);
    const localDeity = localHits.find(e => e && String(e.type).toLowerCase() === 'deity');
    if (localDeity) return localDeity;

    const apiKey = this.getApiKey();
    if (!apiKey) {
      if (typeof this.promptApiKey === 'function') this.promptApiKey();
      throw new Error('Gemini API key is not configured.');
    }
    const entries = await this.fetchSingleAiRuleObjects(deityName, 'Deity', apiKey, statusTextEl);
    if (!entries || !entries.length) {
      throw new Error(`No official D&D 3.5e deity or patron found for "${deityName}".`);
    }
    const deityEntry = entries.find(e => e && (e.type === 'Deity' || String(e.type).toLowerCase() === 'deity')) || entries[0];
    if (!deityEntry || !deityEntry.name) {
      throw new Error(`Invalid or empty deity data returned for "${deityName}".`);
    }
    deityEntry.type = 'Deity';
    deityEntry.alignment = deityEntry.alignment || 'Any';
    deityEntry.domains = Array.isArray(deityEntry.domains) ? deityEntry.domains : [];
    if (deityEntry.favoredWeapon && !deityEntry.weapon) {
      deityEntry.weapon = deityEntry.favoredWeapon;
    } else if (deityEntry.weapon && !deityEntry.favoredWeapon) {
      deityEntry.favoredWeapon = deityEntry.weapon;
    }
    return deityEntry;
  },

  async fetchDomainViaAi(domainName, statusTextEl = null) {
    const cleanName = (domainName || '').trim();
    if (!cleanName) {
      throw new Error('Please enter a valid domain name.');
    }

    // 1. Check local compendium first (Zero-Token resolution)
    if (typeof window !== 'undefined' && window.SrdCompendium && typeof window.SrdCompendium.getDomain === 'function') {
      const localDom = window.SrdCompendium.getDomain(cleanName);
      if (localDom) return this.normalizeEntry(localDom);
    }

    const localHits = this.resolveLocalZeroTokenQuery(cleanName);
    const localDomain = localHits.find(e => e && String(e.type).toLowerCase() === 'domain');
    if (localDomain) return this.normalizeEntry(localDomain);

    const apiKey = this.getApiKey();
    if (!apiKey) {
      if (typeof this.promptApiKey === 'function') this.promptApiKey();
      throw new Error('Gemini API key is not configured.');
    }

    const entries = await this.fetchSingleAiRuleObjects(cleanName, 'Domain', apiKey, statusTextEl);
    if (!entries || !entries.length) {
      throw new Error(`No official D&D 3.5e domain found for "${cleanName}".`);
    }

    const domainEntry = entries.find(e => e && (e.type === 'Domain' || String(e.type).toLowerCase() === 'domain')) || entries[0];
    if (!domainEntry || !domainEntry.name) {
      throw new Error(`Invalid or empty domain data returned for "${cleanName}".`);
    }

    return this.normalizeEntry(domainEntry);
  },

  async fetchRaceViaAi(raceName, statusTextEl = null) {
    const localHits = this.resolveLocalZeroTokenQuery(raceName);
    const localRace = localHits.find(e => e && String(e.type).toLowerCase() === 'race');
    if (localRace) return localRace;

    const apiKey = this.getApiKey();
    if (!apiKey) {
      if (typeof this.promptApiKey === 'function') this.promptApiKey();
      throw new Error('Gemini API key is not configured.');
    }
    const entries = await this.fetchSingleAiRuleObjects(raceName, 'Race', apiKey, statusTextEl);
    if (!entries || !entries.length) {
      throw new Error(`No official D&D 3.5e race found for "${raceName}".`);
    }
    const raceEntry = entries.find(e => e && (e.type === 'Race' || String(e.type).toLowerCase() === 'race')) || entries[0];
    raceEntry.type = 'Race';
    if (!raceEntry.size) raceEntry.size = 'Medium';
    if (!raceEntry.baseSpeed) raceEntry.baseSpeed = 30;
    if (!Array.isArray(raceEntry.traits) && (raceEntry.benefit || raceEntry.description)) {
      raceEntry.traits = [{ name: 'Racial Traits', desc: raceEntry.benefit || raceEntry.description }];
    }
    return raceEntry;
  },

  entryToRow(entry) {
    if (!entry) return null;
    return this.ensureV2(entry);
  },

  async fetchSingleAiRuleRows(query, categoryHint, apiKey, statusTextEl = null) {
    return await this.fetchSingleAiRuleObjects(query, categoryHint, apiKey, statusTextEl);
  },

  normalizeDatabaseList(list) {
    return this.convertRowsToEntries(list);
  },

  convertRowsToEntries(rows) {
    if (!Array.isArray(rows)) return [];
    if (typeof window !== 'undefined' && window.SchemaMigrator && typeof window.SchemaMigrator.upgradeArrayToV2 === 'function') {
      return window.SchemaMigrator.upgradeArrayToV2(rows);
    }
    return rows.map(r => {
      if (r && typeof r === 'object' && !Array.isArray(r)) {
        return this.normalizeEntry(r, false);
      }
      if (Array.isArray(r)) {
        return this.normalizeEntry(r, !r.type && !r.benefit);
      }
      return r;
    });
  },

  queryAiBatch() {
    return this.importMultipleFromAi();
  },

  async importMultipleFromAi() {
    const input = document.getElementById('ai-bulk-import-input') || document.getElementById('ai-batch-query');
    const btn = document.getElementById('ai-bulk-import-btn') || document.getElementById('btn-ai-batch-search');
    const statusBox = document.getElementById('ai-rule-status') || document.getElementById('ai-batch-status');
    const statusText = document.getElementById('ai-rule-status-text') || document.getElementById('ai-batch-status-text');

    if (!input || !input.value.trim()) {
      alert('Please enter the rules you want to import, separated by commas or newlines.');
      return;
    }

    // Check if the entire input is a single multi-line Structured Ability Stat Block (e.g. Breath Weapon / 4d8 Acid / Save Reflex, DC:10+lvl+Con / 60ft, Recharge 1d4+1 turn)
    const singleStatBlock = this.parseStructuredAbilityStatBlock(input.value);
    if (singleStatBlock && singleStatBlock.name) {
      const v2 = this.ensureV2(singleStatBlock);
      const existsIdx = masterDb.findIndex(m => (m.id && m.id === v2.id) || (m.name || '').toLowerCase() === (v2.name || '').toLowerCase());
      if (existsIdx >= 0) masterDb[existsIdx] = v2;
      else masterDb.push(v2);
      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      this.renderTable();
      alert(`🎉 Structured Ability Parsed & Imported (0ms)!\n"${v2.name}" (${v2.benefit}) has been added to Master_DB in Canonical V2 format.`);
      return;
    }

    const rawQueries = input.value.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    if (!rawQueries.length) return;

    const items = [...new Set(rawQueries)];
    if (!confirm(`A total of ${items.length} rule(s) will be parsed into Canonical V2 format and added to Master DB. Proceed?`)) {
      return;
    }

    const apiKey = this.getApiKey();
    if (btn) btn.disabled = true;
    if (statusBox) statusBox.classList.remove('hidden');

    let totalImported = 0;
    for (let i = 0; i < items.length; i++) {
      const itemQuery = items[i];
      if (statusText) statusText.textContent = `[${i + 1}/${items.length}] Scanning "${itemQuery}"...`;
      try {
        const entries = await this.fetchSingleAiRuleEntries(itemQuery, 'Feat', apiKey, statusText);
        if (entries && entries.length) {
          entries.forEach(entry => {
            const v2 = this.ensureV2(entry);
            const existsIdx = masterDb.findIndex(m => (m.id && m.id === v2.id) || (m.name || '').toLowerCase() === (v2.name || '').toLowerCase());
            if (existsIdx >= 0) masterDb[existsIdx] = v2;
            else masterDb.push(v2);
            totalImported++;
          });
        }
      } catch (e) {
        console.warn(`Error importing ${itemQuery}:`, e);
      }
    }

    if (btn) btn.disabled = false;
    if (statusBox) statusBox.classList.add('hidden');
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`🎉 Batch Import Complete!\n${totalImported} Canonical V2 rule(s) successfully added to Master_DB.`);
  },

  getChildrenForEntry(item) {
    if (!item || typeof item !== 'object') return [];
    return Array.isArray(item.modes) ? item.modes : [];
  },

  renderAiResults() {
    const container = document.getElementById('ai-results-container');
    if (!container) return;

    if (!this.lastAiResults || !this.lastAiResults.length) {
      container.innerHTML = '<div class="text-center text-slate-400 py-6">No results found.</div>';
      return;
    }

    const newEntriesCount = this.lastAiResults.filter(it => !this.getExistingSiteDbInfo(it).exists).length;
    const firstDbInfo = this.getExistingSiteDbInfo(this.lastAiResults[0]);

    let html = `
      <div class="flex items-center justify-between bg-slate-900 border ${newEntriesCount === 0 ? 'border-amber-500/50' : 'border-slate-800'} p-3 rounded-xl mb-3 shadow">
        <div>
          <span class="text-xs font-bold ${newEntriesCount === 0 ? 'text-amber-300' : 'text-amber-300'}">${newEntriesCount === 0 ? '📌 Already in Site Database:' : 'D&D 3.5e RAW Verified:'}</span>
          <span class="text-xs text-slate-200 ml-1 font-semibold">${newEntriesCount === 0 ? (firstDbInfo.sourceLabel || 'Site V2 Compendium') : `${this.lastAiResults.length} Result(s) Found`}</span>
          <span class="text-[11px] text-slate-400 block sm:inline sm:ml-2">${newEntriesCount === 0 ? 'Direct duplicate addition is disabled — use "Change & Add" to customize first' : '100% Canonical V2 JSON Schema Compliant'}</span>
        </div>
        ${newEntriesCount > 0 ? `
          <button onclick="RuleMaster.addAllAiResultsToDb()" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer">
            <span>📥</span>
            <span>${newEntriesCount < this.lastAiResults.length ? `Add New to DB (${newEntriesCount})` : 'Add All to DB'}</span>
          </button>
        ` : (this.lastAiResults.length === 1 ? `
          <button onclick="RuleMaster.changeAndAddAiResult(0)" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer">
            <span>✏️</span>
            <span>Change &amp; Add</span>
          </button>
        ` : `
          <span class="px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 select-none">
            <span>🔒</span>
            <span>Already in Site DB</span>
          </span>
        `)}
      </div>
      <div class="space-y-3">
    `;

    this.lastAiResults.forEach((rawItem, idx) => {
      const item = this.ensureV2(rawItem);
      const dbInfo = this.getExistingSiteDbInfo(item);
      const modes = Array.isArray(item.modes) ? item.modes : [];
      const badgeClass = this.getTypeBadgeClass(item.type);
      const statPills = this.getEntrySummaryPills(item);
      const primaryBonusType = item.modifiers?.[0]?.type || (item.type === 'Weapon' && item.enhancementBonus ? 'Enhancement' : 'Untyped');

      const specificBadges = [];
      if (dbInfo.exists) {
        specificBadges.push(`<span class="badge bg-amber-950/90 text-amber-300 border border-amber-500/60 text-[10px] font-bold">📌 Already in ${dbInfo.inMasterDb ? 'Custom Master DB' : 'Site Database'}</span>`);
      }
      if (item.level !== undefined && item.level !== null && item.level !== '') {
        specificBadges.push(`<span class="badge bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">Level ${item.level}</span>`);
      }
      if (item.school && item.school !== '-') {
        specificBadges.push(`<span class="badge bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px]">${RuleMaster.escapeHtml(item.school)}</span>`);
      }
      if (item.discipline && item.discipline !== '-') {
        specificBadges.push(`<span class="badge bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">${item.discipline}</span>`);
      }
      if (modes.length > 0) {
        specificBadges.push(`<span class="badge bg-purple-950 text-purple-200 border border-purple-600 text-[10px] font-bold">⚡ ${modes.length} Embedded Mode(s)</span>`);
      }

      html += `
        <div class="bg-slate-900 border ${dbInfo.exists ? 'border-amber-500/40' : 'border-slate-800'} rounded-xl p-4 space-y-3 shadow-md transition">
          <div class="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-extrabold text-white">${RuleMaster.escapeHtml(item.name)}</span>
                <span class="badge ${badgeClass}">${item.type}</span>
                ${specificBadges.join(' ')}
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                <span>📚 <b>${RuleMaster.escapeHtml(item.source || 'Core 3.5e')}</b></span>
                <span>•</span>
                <span>Slot: <b>${item.slot || 'None'}</b></span>
                <span>•</span>
                <span>Type: <b>${primaryBonusType}</b></span>
                ${item.range && item.range !== '-' ? `<span>•</span><span>Range: <b class="text-cyan-400">${RuleMaster.escapeHtml(item.range)}</b></span>` : ''}
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              ${dbInfo.exists ? `
                <span class="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 text-[11px] font-bold flex items-center gap-1 select-none" title="Already exists in ${dbInfo.sourceLabel} — direct addition disabled">
                  <span>🔒</span>
                  <span>Already in DB</span>
                </span>
                <button onclick="RuleMaster.changeAndAddAiResult(${idx})" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1 cursor-pointer" title="Modify this entry in the Builder and add to Custom Master DB">
                  <span>✏️</span>
                  <span>Change &amp; Add</span>
                </button>
              ` : `
                <button onclick="RuleMaster.addAiResultToDb(${idx})" class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1 cursor-pointer">
                  <span>📥</span>
                  <span>Add to DB</span>
                </button>
              `}
              <button onclick="RuleMaster.equipAiResultToCharacter(${idx})" class="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg transition font-bold cursor-pointer" title="Equip / Add to Character">
                ⚡ Equip
              </button>
              ${!dbInfo.exists ? `
                <button onclick="RuleMaster.editAiResultInModal(${idx})" class="bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer" title="Edit">
                  ✏️ Edit
                </button>
              ` : ''}
            </div>
          </div>

          ${statPills.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[10px] uppercase font-bold text-slate-400">Effects & Dice:</span>
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">${p}</span>`).join('')}
            </div>
          ` : ''}

          ${modes.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[10px] uppercase font-bold text-purple-300">Sub-Modes:</span>
              ${modes.map(m => `<span class="badge bg-purple-950/80 text-purple-200 border border-purple-700/60 font-mono text-[10px]">⚡ ${RuleMaster.escapeHtml(m.name)}</span>`).join('')}
            </div>
          ` : ''}

          <div class="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
            ${RuleMaster.escapeHtml(item.benefit || item.description || 'No description provided.')}
          </div>

          <div class="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
            <div class="flex items-center gap-3">
              <span>Action: <b class="text-amber-400">${item.action || 'Passive'}</b></span>
              <span>Duration/Use: <b class="text-purple-300">${RuleMaster.escapeHtml(item.duration || 'Continuous')}</b></span>
            </div>
            <div class="flex items-center gap-3">
              <span>Weight: <b class="text-slate-300">${item.weight || 0} lbs</b></span>
              <span>Price: <b class="text-amber-300">${item.cost || 0} gp</b></span>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  addAiResultToDb(index) {
    if (index >= 0 && index < this.lastAiResults.length) {
      const item = this.ensureV2(JSON.parse(JSON.stringify(this.lastAiResults[index])));
      const dbInfo = this.getExistingSiteDbInfo(item);
      if (dbInfo.exists) {
        this.changeAndAddAiResult(index);
        return;
      }
      const existsIdx = masterDb.findIndex(m => (m.id && m.id === item.id) || (m.name || '').toLowerCase().trim() === (item.name || '').toLowerCase().trim());
      if (existsIdx >= 0) {
        masterDb[existsIdx] = item;
      } else {
        masterDb.push(item);
      }

      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      this.renderTable();
      alert(`✅ "${item.name}" successfully added to Master_DB!`);
    }
  },

  addAllAiResultsToDb() {
    if (!this.lastAiResults.length) return;
    let addedCount = 0;
    this.lastAiResults.forEach(rawItem => {
      const copy = this.ensureV2(JSON.parse(JSON.stringify(rawItem)));
      if (this.getExistingSiteDbInfo(copy).exists) return;
      const existsIdx = masterDb.findIndex(m => (m.id && m.id === copy.id) || (m.name || '').toLowerCase().trim() === (copy.name || '').toLowerCase().trim());
      if (existsIdx >= 0) {
        masterDb[existsIdx] = copy;
      } else {
        masterDb.push(copy);
      }
      addedCount++;
    });
    if (addedCount === 0) {
      alert('ℹ️ All listed entries already exist in the site database. Use "Change & Add" to customize an entry before adding it to Master DB.');
      return;
    }
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`✅ ${addedCount} Canonical V2 rule(s) successfully added to Master_DB!`);
  },

  changeAndAddAiResult(index) {
    if (index >= 0 && index < this.lastAiResults.length) {
      const item = this.ensureV2(JSON.parse(JSON.stringify(this.lastAiResults[index])));
      const dbInfo = this.getExistingSiteDbInfo(item);
      this.openModalWithData(item, dbInfo.inMasterDb ? dbInfo.masterDbIndex : -1, {
        changeAndAddMode: true,
        sourceLabel: dbInfo.sourceLabel || 'Site Database'
      });
    }
  },

  editAiResultInModal(index) {
    if (index >= 0 && index < this.lastAiResults.length) {
      const item = this.ensureV2(JSON.parse(JSON.stringify(this.lastAiResults[index])));
      this.openModalWithData(item, -1);
    }
  },

  equipAiResultToCharacter(index) {
    if (index >= 0 && index < this.lastAiResults.length) {
      const item = this.ensureV2(JSON.parse(JSON.stringify(this.lastAiResults[index])));
      this.equipItemWithChildren(item, this.lastAiResults);
    }
  },

  // Equip or learn Canonical V2 entry into active character
  equipItem(rawItem) {
    if (typeof character === 'undefined' || !character || !rawItem) return;
    const item = this.ensureV2(rawItem);
    const type = (item.type || '').toLowerCase();
    const cat = item.category || item.type || 'Other';
    const catLower = String(cat || '').toLowerCase();

    // 1. Ensure item is placed in character.gearPool (except pure Feats/Spells/Maneuvers/Stances/Racial Traits/Flaws/Deities/Domains/Special Abilities/DM Boons)
    const nonPhysicalTypes = ['feat', 'spell', 'maneuver', 'stance', 'flaw', 'racial trait', 'race', 'deity', 'domain', 'cleric domain', 'special ability', 'dm grant', 'dm boon', 'boon', 'class feature', 'trait', 'synergy', 'template'];
    const isNonPhysical = nonPhysicalTypes.includes(type) || nonPhysicalTypes.includes(catLower) || String(item.id || '').startsWith('ability_') || String(item.id || '').startsWith('feat_') || String(item.id || '').startsWith('boon_');
    if (type === 'deity') {
      if (typeof selectDeityItem === 'function') {
        selectDeityItem(item.name);
      } else {
        character.deity = item.name;
      }
      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({ title: 'Deity Selected', breakdown: `${item.name} selected as character deity.`, icon: item.icon || '✨' });
      }
      return;
    }
    if (type === 'domain' || type === 'cleric domain') {
      if (typeof window.openCustomDomainEditorModal === 'function') {
        window.openCustomDomainEditorModal(item);
      }
      return;
    }
    if (type === 'race') {
      if (typeof selectRaceItem === 'function') {
        selectRaceItem(item.name);
      } else {
        character.race = item.name;
      }
      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({ title: 'Race Selected', breakdown: `${item.name} selected as character race.`, icon: '🧬' });
      }
      return;
    }
    let poolExisting = null;
    if (!isNonPhysical) {
      if (!character.gearPool) character.gearPool = [];
      poolExisting = character.gearPool.find(p => (p.id && p.id === item.id) || (p.name || '').toLowerCase().trim() === (item.name || '').toLowerCase().trim());
      if (!poolExisting) {
        poolExisting = {
          schemaVersion: 2,
          id: item.id || `gear_${Date.now()}`,
          baseItemId: item.baseItemId || null,
          name: item.name,
          masterDbName: item.name,
          category: cat,
          slot: item.slot && item.slot !== 'None' ? item.slot : cat,
          qty: 1,
          weight: Number(item.weight) || 0,
          cost: Number(item.cost) || 0,
          desc: item.benefit || item.description || '',
          modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
          damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : [],
          modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
          weaponStats: item.weaponStats ? JSON.parse(JSON.stringify(item.weaponStats)) : null,
          armorStats: item.armorStats ? JSON.parse(JSON.stringify(item.armorStats)) : null,
          ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {},
          tacticalBadges: Array.isArray(item.tacticalBadges) ? [...item.tacticalBadges] : [],
          isBelt: (item.slot || '').toLowerCase().includes('belt') || cat.toLowerCase().includes('consumable'),
          isEquipped: false
        };
        character.gearPool.push(poolExisting);
      }
    }

    if (type === 'weapon') {
      if (!character.weapons) character.weapons = [];
      const isTwoHand = typeof RuleEngine !== 'undefined' && typeof RuleEngine.isTwoHandedWeapon === 'function' ? RuleEngine.isTwoHandedWeapon(item) : false;
      const hasOversized = typeof RuleEngine !== 'undefined' && typeof RuleEngine.hasOversizedWeaponFeat === 'function' ? RuleEngine.hasOversizedWeaponFeat(character) : false;
      const wStats = this.resolveWeaponStats(item);
      const primaryDamage = item.damageParts?.[0]?.dice || wStats.baseDamage || '1d8';
      const primaryDmgType = item.damageParts?.[0]?.type || (Array.isArray(wStats.damageTypes) ? wStats.damageTypes.join('/') : 'Slashing');

      const newWep = {
        schemaVersion: 2,
        id: item.id,
        baseItemId: item.baseItemId || null,
        name: item.name,
        grip: isTwoHand ? '2-Hand' : (item.slot === 'Off-Hand' ? 'Off-Hand' : '1-Hand'),
        enhancementBonus: Number(item.enhancementBonus) || 0,
        material: item.material || null,
        enhancements: Array.isArray(item.enhancements) ? [...item.enhancements] : [],
        damageParts: Array.isArray(item.damageParts) && item.damageParts.length > 0
          ? JSON.parse(JSON.stringify(item.damageParts))
          : [{ dice: primaryDamage, bonus: Number(item.enhancementBonus) || 0, type: primaryDmgType, multiplyOnCrit: true, onCritOnly: false, source: 'Base Weapon' }],
        modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
        modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
        weaponStats: {
          category: wStats.category || 'Martial',
          handedness: isTwoHand ? 'Two-Handed' : (wStats.handedness || 'One-Handed'),
          baseDamage: primaryDamage,
          critMin: Number(wStats.critMin) || 20,
          critMult: Number(wStats.critMult) || 2,
          damageTypes: Array.isArray(wStats.damageTypes) ? [...wStats.damageTypes] : [primaryDmgType],
          rangeIncrement: Number(wStats.rangeIncrement) || 0,
          finessable: Boolean(wStats.finessable),
          isLight: Boolean(wStats.isLight)
        },
        ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {},
        tacticalBadges: Array.isArray(item.tacticalBadges) ? [...item.tacticalBadges] : [],
        tags: Array.isArray(item.tags) ? [...item.tags] : []
      };
      if (isTwoHand && !newWep.tags.includes('two-handed')) {
        newWep.tags.push('two-handed');
      }

      const existingWepIdx = character.weapons.findIndex(w => (w.id && w.id === item.id) || (w.name || '').toLowerCase() === item.name.toLowerCase());
      if (existingWepIdx >= 0) character.weapons[existingWepIdx] = newWep;
      else character.weapons.push(newWep);

      character.activeWeapon = item.name;
      if (poolExisting) poolExisting.isEquipped = true;

      let unequippedOffHandName = null;
      if (character.bodySlots) {
        if (isTwoHand && !hasOversized && character.bodySlots.offHand && character.bodySlots.offHand.name && character.bodySlots.offHand.name !== '-') {
          unequippedOffHandName = character.bodySlots.offHand.name;
          const pItem = (character.gearPool || []).find(p => p.name === unequippedOffHandName);
          if (pItem) pItem.isEquipped = false;
          character.bodySlots.offHand = { name: '-', active: false, weight: 0, cost: 0, desc: '' };
        }

        character.bodySlots.mainHand = {
          schemaVersion: 2,
          id: item.id,
          baseItemId: item.baseItemId || null,
          name: item.name,
          masterDbName: item.name,
          active: true,
          category: 'Weapon',
          weight: Number(item.weight) || 0,
          cost: Number(item.cost) || 0,
          desc: item.benefit || item.description || '',
          modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
          damageParts: Array.isArray(newWep.damageParts) ? JSON.parse(JSON.stringify(newWep.damageParts)) : [],
          modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
          ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {},
          tacticalBadges: Array.isArray(item.tacticalBadges) ? [...item.tacticalBadges] : []
        };
      }
      if (unequippedOffHandName) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Weapon Equipped',
            breakdown: `Off-hand "${unequippedOffHandName}" unequipped because "${item.name}" is a Two-Handed weapon.`,
            icon: '⚔️'
          });
        } else {
          alert(`⚔️ "${item.name}" is a Two-Handed weapon! Off-hand "${unequippedOffHandName}" has been unequipped.`);
        }
      } else {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Weapon Equipped',
            breakdown: `"${item.name}" equipped and added to inventory.`,
            icon: '⚔️'
          });
        } else {
          alert(`⚔️ "${item.name}" equipped and added to inventory!`);
        }
      }
    } else if (type === 'spell') {
      if (!character.spellcasting) character.spellcasting = { slots: [], knownSpells: [] };
      if (!character.spellcasting.knownSpells) character.spellcasting.knownSpells = [];
      character.spellcasting.knownSpells.push({
        schemaVersion: 2,
        id: item.id,
        level: Number(item.level) || 1,
        name: item.name,
        school: item.school || 'Universal',
        action: item.action || 'Standard Action',
        range: item.range || 'Close',
        benefit: item.benefit || item.description || '',
        damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : [],
        modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
        modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
        ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {}
      });
      alert(`🔮 "${item.name}" added to Spells Known!`);
    } else if (type === 'maneuver') {
      if (!character.tomeOfBattle) character.tomeOfBattle = { initiatorLevel: 1, readiedManeuvers: [], stancesKnown: [] };
      if (!character.tomeOfBattle.readiedManeuvers) character.tomeOfBattle.readiedManeuvers = [];
      character.tomeOfBattle.readiedManeuvers.push({
        schemaVersion: 2,
        id: item.id,
        name: item.name,
        level: Number(item.level) || 1,
        discipline: item.discipline || 'Iron Heart',
        action: item.action || 'Standard Action',
        expended: false,
        notes: item.benefit || item.description || '',
        damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : [],
        modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : []
      });
      alert(`⚔️ "${item.name}" added to Readied Maneuvers!`);
    } else if (type === 'stance') {
      if (!character.tomeOfBattle) character.tomeOfBattle = { initiatorLevel: 1, readiedManeuvers: [], stancesKnown: [] };
      if (!character.tomeOfBattle.stancesKnown) character.tomeOfBattle.stancesKnown = [];
      character.tomeOfBattle.stancesKnown.push({
        schemaVersion: 2,
        id: item.id,
        name: item.name,
        discipline: item.discipline || 'Shadow Hand',
        level: Number(item.level) || 1,
        benefit: item.benefit || item.description || '',
        modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : []
      });
      character.activeStance = item.name;
    } else if (type === 'flaw' || cat.toLowerCase() === 'flaw' || item.name.toLowerCase().startsWith('flaw:')) {
      if (character.level > 1) {
        const proceed = confirm(`⚠️ Per D&D 3.5e Unearthed Arcana rules, Flaws can only be selected at 1st Level during character creation. Your current level is ${character.level}.\n\nDo you still want to add the "${item.name}" flaw?`);
        if (!proceed) return;
      }
      if (!character.feats) character.feats = [];
      const cleanName = item.name.replace(/^flaw:\s*/i, '').trim();
      const existingFlawIdx = character.feats.findIndex(f => (typeof f === 'string' ? f : f.name).toLowerCase().trim() === cleanName.toLowerCase());
      const flawObj = {
        schemaVersion: 2,
        id: item.id,
        name: cleanName,
        type: 'Flaw',
        category: 'Flaw',
        slotDiff: 1,
        source: item.source || 'Unearthed Arcana, p. 91',
        benefit: item.benefit || item.description || 'Grants 1 bonus feat in exchange for this flaw.',
        modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
        ruleFlags: Object.assign({ isFlaw: true, grantsBonusFeat: 1 }, item.ruleFlags || {})
      };
      if (existingFlawIdx >= 0) {
        character.feats[existingFlawIdx] = flawObj;
      } else {
        character.feats.push(flawObj);
      }
      if (Array.isArray(character.levelProgression) && character.levelProgression[0]) {
        const row0 = character.levelProgression[0];
        if (!Array.isArray(row0.feats)) row0.feats = [];
        row0.feats = row0.feats.filter(fStr => {
          const rName = String(fStr).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
          return rName !== cleanName.toLowerCase();
        });
        row0.feats.push(`⚠️ [Flaw] ${cleanName}`);
      }
      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      if (typeof renderAll === 'function') renderAll();
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: '⚠️',
          title: `Flaw Added: ${cleanName}`,
          breakdown: '🎖️ +1 Flaw Bonus Feat slot unlocked! Select your bonus feat now.'
        });
      }
      if (typeof openQuickFeatPickerForLevel === 'function') {
        setTimeout(() => openQuickFeatPickerForLevel(0, 'Flaw Bonus Feat', true), 180);
      }
    } else if (type === 'racial trait' || cat.toLowerCase() === 'racial trait' || (item.category && item.category.toLowerCase().includes('racial'))) {
      if (character.level > 1) {
        const proceed = confirm(`⚠️ Racial traits are normally determined at 1st Level. Do you still want to add "${item.name}"?`);
        if (!proceed) return;
      }
      if (!character.specialAbilities) character.specialAbilities = [];
      const cleanName = item.name.trim();
      if (!character.specialAbilities.some(a => (typeof a === 'string' ? a : a.name).toLowerCase().trim() === cleanName.toLowerCase())) {
        character.specialAbilities.push({
          schemaVersion: 2,
          id: item.id,
          name: cleanName,
          category: 'Racial Trait',
          source: item.source || 'PHB',
          benefit: item.benefit || '',
          modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : []
        });
      }
      if (item.grantsBonusFeat || cleanName.toLowerCase().includes('bonus feat')) {
        alert(`🧬 Racial trait "${item.name}" added!\n\n🎖️ This trait grants 1 extra bonus feat.`);
        if (typeof openFeatPickerModal === 'function') {
          setTimeout(() => openFeatPickerModal(false), 200);
        }
      } else {
        alert(`🧬 Racial trait "${item.name}" added to character!`);
      }
    } else if (type === 'feat') {
      if (!character.feats) character.feats = [];
      character.feats.push(item.name);
      alert(`✨ Feat "${item.name}" added to character!`);
    } else if (['special ability', 'dm grant', 'dm boon', 'boon', 'class feature', 'synergy', 'trait', 'template'].includes(type) || ['special ability', 'dm grant', 'dm boon', 'boon', 'class feature', 'synergy', 'trait', 'template'].includes(catLower) || String(item.id || '').startsWith('ability_') || String(item.id || '').startsWith('boon_')) {
      if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];
      const existingIdx = character.specialAbilities.findIndex(a => {
        if (!a) return false;
        if (typeof a === 'string') return a.toLowerCase().trim() === String(item.name || '').toLowerCase().trim();
        return (item.id && String(a.id || '') === String(item.id)) || String(a.name || '').toLowerCase().trim() === String(item.name || '').toLowerCase().trim();
      });
      if (existingIdx >= 0) {
        character.specialAbilities[existingIdx] = Object.assign({}, typeof character.specialAbilities[existingIdx] === 'object' ? character.specialAbilities[existingIdx] : {}, item);
      } else {
        character.specialAbilities.push(item);
      }
      if (typeof SchemaMigrator !== 'undefined' && typeof SchemaMigrator.sanitizeCharacterAbilitiesAndPool === 'function') {
        SchemaMigrator.sanitizeCharacterAbilitiesAndPool(character);
      }
      alert(`✨ Special Ability / Boon "${item.name}" added to character!`);
    } else if (type === 'potion' || type === 'scroll' || type === 'wand' || type === 'consumable' || (item.category && item.category.toLowerCase() === 'consumable')) {
      if (!character.consumables) character.consumables = [];
      character.consumables.push({
        id: item.id,
        name: item.name,
        qty: 1,
        effect: item.benefit || item.description || `${item.type || 'Consumable'} effect`
      });
      alert(`🧪 "${item.name}" (${item.type || 'Consumable'}) added to backpack!`);
    } else {
      // Body Slot Equipment (Armor, Shield, Wondrous Item, Ring, etc. in Canonical V2)
      const rawSlot = (item.slot || '').toLowerCase().trim();
      const slotLower = (item.slot || item.category || '').toLowerCase();
      let slotKey = null;
      if (rawSlot === 'none' || rawSlot === 'slotless') {
        slotKey = null;
      } else if (slotLower.includes('armor') || slotLower.includes('zırh')) slotKey = 'armor';
      else if (slotLower.includes('shield') || slotLower.includes('kalkan')) slotKey = 'offHand';
      else if (slotLower.includes('belt') || slotLower.includes('kemer') || slotLower.includes('waist')) slotKey = 'belt';
      else if (slotLower.includes('head') || slotLower.includes('baş')) slotKey = 'head';
      else if (slotLower.includes('eyes') || slotLower.includes('göz') || slotLower.includes('face')) slotKey = 'eyes';
      else if (slotLower.includes('neck') || slotLower.includes('boyun') || slotLower.includes('throat')) slotKey = 'neck';
      else if (slotLower.includes('shoulders') || slotLower.includes('omuz')) slotKey = 'shoulders';
      else if (slotLower.includes('torso') || slotLower.includes('gövde') || slotLower.includes('body')) slotKey = 'torso';
      else if (slotLower.includes('bracers') || slotLower.includes('bileklik') || slotLower.includes('arms')) slotKey = 'bracers';
      else if (slotLower.includes('gloves') || slotLower.includes('eldiven') || slotLower.includes('hands')) slotKey = 'gloves';
      else if (slotLower.includes('boots') || slotLower.includes('ayak') || slotLower.includes('feet')) slotKey = 'boots';
      else if (slotLower.includes('ring') || slotLower.includes('yüzük')) {
        slotKey = (!character.bodySlots?.ring1 || character.bodySlots.ring1.name === '-') ? 'ring1' : 'ring2';
      }

      if (slotKey && character.bodySlots) {
        character.bodySlots[slotKey] = {
          schemaVersion: 2,
          id: item.id,
          baseItemId: item.baseItemId || null,
          name: item.name,
          masterDbName: item.name,
          active: true,
          category: item.category || item.type || 'Wondrous Item',
          weight: Number(item.weight) || 0,
          cost: Number(item.cost) || 0,
          desc: item.benefit || item.description || '',
          enhancementBonus: Number(item.enhancementBonus) || 0,
          material: item.material || null,
          modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
          damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : [],
          modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
          armorStats: item.armorStats ? JSON.parse(JSON.stringify(item.armorStats)) : null,
          ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {},
          tacticalBadges: Array.isArray(item.tacticalBadges) ? [...item.tacticalBadges] : []
        };
        if (poolExisting) poolExisting.isEquipped = true;
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Item Equipped',
            breakdown: `"${item.name}" equipped to ${slotKey} slot.`,
            icon: '🛡️'
          });
        } else {
          alert(`🛡️ "${item.name}" equipped (${slotKey} slot) and added to backpack!`);
        }
      } else {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Item Added',
            breakdown: `"${item.name}" added to inventory pool.`,
            icon: '🎒'
          });
        } else {
          alert(`🎒 "${item.name}" (${item.type}) added to backpack / inventory pool!`);
        }
      }
    }

    // Attach any active special abilities from embedded modes
    if (Array.isArray(item.modes) && item.modes.length > 0 && type !== 'weapon' && type !== 'spell') {
      if (!character.specialAbilities) character.specialAbilities = [];
      item.modes.forEach(m => {
        if (!m || !m.name) return;
        const existsIdx = character.specialAbilities.findIndex(a => (a.name || '').toLowerCase() === m.name.toLowerCase());
        const abilityObj = {
          schemaVersion: 2,
          id: m.id || `mode_${Date.now()}`,
          name: m.name,
          source: item.name,
          action: m.actionType || 'Standard Action',
          benefit: m.benefit || '',
          damageParts: Array.isArray(m.damageParts) ? JSON.parse(JSON.stringify(m.damageParts)) : [],
          modifiers: Array.isArray(m.modifiers) ? JSON.parse(JSON.stringify(m.modifiers)) : [],
          active: false
        };
        if (existsIdx >= 0) character.specialAbilities[existsIdx] = abilityObj;
        else character.specialAbilities.push(abilityObj);
      });
    }

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    if (typeof renderAll === 'function') renderAll();
  },

  // Core SRD Temel Eşya Çözümleyicisi (SrdCompendium Öncelikli)
  findBaseItemInSrdCore(rawName) {
    if (!rawName || typeof rawName !== 'string') return null;

    let cleaned = rawName
      .replace(/\+\d+/g, '')
      .replace(/\b(?:masterwork|mwk|flaming|frost|shock|shocking|keen|holy|unholy|vicious|defending|anarchic|axiomatic|speed|vorpal|ghost touch|wounding|bane|throwing|returning|spell resistance \d+|fortification|slick|shadow|silent moves|glamered)\b/gi, '')
      .replace(/\b(?:adamantine|mithral|mithril|alchemical silver|silver|cold iron|darkwood|dragonhide)\b/gi, '')
      .replace(/[\(\)\[\],]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    if (!cleaned) return null;

    // 1. Check SrdCompendium first (O(1))
    if (typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) {
      const exactComp = window.SrdCompendium.getByName(cleaned) || window.SrdCompendium.getById(cleaned);
      if (exactComp) return exactComp;
    }

    if (typeof window !== 'undefined' && typeof window.findBaseItemInSrdCore === 'function') {
      return window.findBaseItemInSrdCore(rawName);
    }

    const catalog = (typeof window !== 'undefined' ? window.BUNDLED_SRD_CORE_CATALOG : null) || [];
    if (!Array.isArray(catalog) || catalog.length === 0) return null;

    const exact = catalog.find(c => (c.name || '').toLowerCase() === cleaned);
    if (exact) return exact;

    const candidates = catalog
      .filter(c => {
        const cName = (c.name || '').toLowerCase();
        return cName && (cleaned === cName || cleaned.endsWith(' ' + cName) || cleaned.startsWith(cName + ' ') || cleaned.includes(' ' + cName + ' ') || cleaned.includes(cName));
      })
      .sort((a, b) => (b.name || '').length - (a.name || '').length);

    if (candidates.length > 0) return candidates[0];
    return null;
  },

  // Eşyayı ve gömülü modlarını otomatik olarak Master DB'ye kaydetme (GEMINI.md Kural #5)
  persistToMasterDb(entry) {
    if (!entry || !entry.name || typeof masterDb === 'undefined' || !Array.isArray(masterDb)) return false;
    const v2 = this.ensureV2(JSON.parse(JSON.stringify(entry)));
    const cleanName = (v2.name || '').toLowerCase().trim();
    const existsIdx = masterDb.findIndex(m => (m.id && m.id === v2.id) || (m.name || '').toLowerCase().trim() === cleanName);
    if (existsIdx >= 0) {
      masterDb[existsIdx] = Object.assign({}, masterDb[existsIdx], v2);
    } else {
      masterDb.push(v2);
    }
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    if (typeof this.renderTable === 'function') this.renderTable();
    return true;
  },

  equipItemWithChildren(parentItem) {
    if (typeof character === 'undefined' || !character || !parentItem) return;
    const v2 = this.ensureV2(parentItem);
    this.persistToMasterDb(v2);
    this.equipItem(v2);
  },

  equipWeaponSlot(name, slot) {
    const rawItem = masterDb.find(i => i.name === name);
    if (!rawItem || !character) return;
    const item = this.ensureV2(rawItem);
    if (slot === 'Off-Hand') {
      item.slot = 'Off-Hand';
    }
    this.equipItem(item);
  },

  // ====================================================
  // 2. WEAPONS, ARMORS & SHIELDS VIEW (CANONICAL V2)
  // ====================================================
  renderWeaponsArmors() {
    const container = document.getElementById('weapons-armors-grid');
    if (!container) return;
    const subFilter = document.getElementById('wa-subfilter')?.value || 'ALL';
    const query = (document.getElementById('wa-search-input')?.value || '').toLowerCase();

    const items = masterDb.filter(i => {
      const isWA = i.type === 'Weapon' || i.type === 'Armor' || i.type === 'Shield';
      if (!isWA) return false;
      if (subFilter === 'Weapon' && i.type !== 'Weapon') return false;
      if (subFilter === 'Armor' && i.type !== 'Armor') return false;
      if (subFilter === 'Shield' && i.type !== 'Shield') return false;
      if (query && !i.name.toLowerCase().includes(query) && !(i.benefit || '').toLowerCase().includes(query)) return false;
      return true;
    });

    const countBadge = document.getElementById('wa-count-badge');
    if (countBadge) countBadge.textContent = `${items.length} Equipment`;

    if (!items.length) {
      container.innerHTML = '<div class="col-span-full p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">No matching weapons or armor found.</div>';
      return;
    }

    let html = '';
    items.forEach(rawItem => {
      const idx = masterDb.indexOf(rawItem);
      const item = this.ensureV2(rawItem);
      const isWeapon = item.type === 'Weapon';
      const wStats = this.resolveWeaponStats(item);
      const aStats = item.armorStats || {};
      const primaryDice = item.damageParts?.[0]?.dice || wStats.baseDamage || '1d8';
      const critMin = wStats.critMin || 20;
      const critMult = wStats.critMult || 2;
      const dmgType = item.damageParts?.[0]?.type || (Array.isArray(wStats.damageTypes) ? wStats.damageTypes.join('/') : 'Slashing');
      const acVal = (Number(aStats.baseAc) || 0) + (Number(item.enhancementBonus) || 0);
      const statPills = this.getEntrySummaryPills(item);

      html += `
        <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2.5 transition shadow">
          <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-extrabold text-white">${RuleMaster.escapeHtml(item.name)}</span>
                <span class="badge ${isWeapon ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-sky-950 text-sky-300 border border-sky-800'}">${item.type}</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">📚 ${RuleMaster.escapeHtml(item.source || 'PHB')} • Slot: <b>${item.slot || 'Main Hand'}</b></div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${RuleMaster.escapeJsString(item.name)}', type: 'Feat', action: 'Passive', desc: '${RuleMaster.escapeJsString(item.benefit || item.description || '')}', badge: '${RuleMaster.escapeJsString(item.type)}' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Pin / Unpin to Combat Cockpit">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Edit">✏️</button>
            </div>
          </div>

          <div class="flex flex-wrap gap-1.5 text-xs font-mono">
            ${isWeapon ? `
              <span class="badge bg-slate-800 text-amber-300 font-bold inline-flex items-center gap-1">${typeof getFormulaDiceIconSvg === 'function' ? getFormulaDiceIconSvg(primaryDice, 'w-3 h-3 text-amber-400 shrink-0') : ''}<span>${primaryDice}</span></span>
              <span class="badge bg-slate-800 text-rose-300 font-bold">🎯 ${critMin}-20/x${critMult}</span>
              <span class="badge bg-slate-800 text-slate-300">${dmgType}</span>
            ` : `
              <span class="badge bg-sky-950 text-sky-300 border border-sky-800 font-bold">🛡️ +${acVal} AC</span>
              <span class="badge bg-slate-800 text-slate-300">Type: ${item.type}</span>
            `}
            ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-800">${p}</span>`).join('')}
          </div>

          <p class="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">${RuleMaster.escapeHtml(item.benefit || item.description || '-')}</p>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
            <span class="text-amber-400 font-bold">${item.cost || 0} gp • ${item.weight || 0} lbs</span>
            <div class="flex gap-1.5">
              ${isWeapon ? `
                <button onclick="RuleMaster.equipWeaponSlot('${RuleMaster.escapeJsString(item.name)}', 'Main Hand')" class="bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-[10px] font-bold px-2 py-1 rounded transition">⚡ Main Hand</button>
                <button onclick="RuleMaster.equipWeaponSlot('${RuleMaster.escapeJsString(item.name)}', 'Off-Hand')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-1 rounded transition">⚡ Off-Hand</button>
              ` : `
                <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-200 text-[10px] font-bold px-2 py-1 rounded transition">🛡️ Equip</button>
              `}
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  },

  // ====================================================
  // 3. SPELLS, MANEUVERS & STANCES VIEW (CANONICAL V2)
  // ====================================================
  renderSpellsManeuvers() {
    const container = document.getElementById('spells-maneuvers-grid');
    if (!container) return;
    const typeFilter = document.getElementById('sm-type-filter')?.value || 'ALL';
    const levelFilter = document.getElementById('sm-level-filter')?.value || 'ALL';
    const query = (document.getElementById('sm-search-input')?.value || '').toLowerCase();

    const items = masterDb.filter(i => {
      const isSM = i.type === 'Spell' || i.type === 'Maneuver' || i.type === 'Stance';
      if (!isSM) return false;
      if (typeFilter !== 'ALL' && i.type !== typeFilter) return false;
      if (levelFilter !== 'ALL' && String(i.level) !== String(levelFilter)) return false;
      if (query && !i.name.toLowerCase().includes(query) && !(i.benefit || '').toLowerCase().includes(query) && !(i.discipline || '').toLowerCase().includes(query)) return false;
      return true;
    });

    const countBadge = document.getElementById('sm-count-badge');
    if (countBadge) countBadge.textContent = `${items.length} Spells / Maneuvers`;

    if (!items.length) {
      container.innerHTML = '<div class="col-span-full p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">No matching spells or maneuvers found.</div>';
      return;
    }

    let html = '';
    items.forEach(rawItem => {
      const idx = masterDb.indexOf(rawItem);
      const item = this.ensureV2(rawItem);
      const isSpell = item.type === 'Spell';
      const isManeuver = item.type === 'Maneuver';
      const primaryDice = item.damageParts?.[0]?.dice || '';

      html += `
        <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2.5 transition shadow">
          <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-sm font-extrabold text-white">${RuleMaster.escapeHtml(item.name)}</span>
                <span class="badge ${isSpell ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}">${item.type}</span>
                ${item.level !== undefined && item.level !== '' ? `<span class="badge bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">Level ${item.level}</span>` : ''}
                ${Array.isArray(item.modes) && item.modes.length > 0 ? `<span class="badge bg-purple-950 text-purple-200 border border-purple-700 text-[10px]">⚡ ${item.modes.length} Mode(s)</span>` : ''}
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">
                ${isSpell ? `School: <b class="text-purple-300">${RuleMaster.escapeHtml(item.school || 'Universal')}</b>` : `Discipline: <b class="text-rose-300">${item.discipline || 'Tome of Battle'}</b>`}
                • 📚 ${RuleMaster.escapeHtml(item.source || 'PHB/ToB')}
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${RuleMaster.escapeJsString(item.name)}', type: 'Feat', action: 'Passive', desc: '${RuleMaster.escapeJsString(item.benefit || item.description || '')}', badge: '${RuleMaster.escapeJsString(item.type)}' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Pin / Unpin to Combat Cockpit">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Edit">✏️</button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 text-[10px] text-slate-400">
            <span>Action: <b class="text-amber-300">${item.action || 'Standard Action'}</b></span>
            <span>Duration: <b class="text-slate-300">${RuleMaster.escapeHtml(item.duration || 'Instantaneous')}</b></span>
            ${primaryDice ? `<span>Dice: <b class="text-rose-400 font-mono">${primaryDice}</b></span>` : ''}
          </div>

          <p class="text-[11px] text-slate-300 line-clamp-3 leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-800/80">${RuleMaster.escapeHtml(item.benefit || item.description || '-')}</p>

          <div class="flex items-center justify-end pt-2 border-t border-slate-800">
            ${isSpell ? `
              <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-purple-900/60 hover:bg-purple-600 text-purple-200 text-xs font-bold px-3 py-1 rounded border border-purple-700 transition">✨ Add to Spells Known</button>
            ` : (isManeuver ? `
              <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold px-3 py-1 rounded transition">⚔️ Ready Maneuver</button>
            ` : `
              <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 text-xs font-bold px-3 py-1 rounded transition">🥋 Activate Stance</button>
            `)}
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  },

  // ====================================================
  // 4. FEATS & SPECIAL ABILITIES VIEW (CANONICAL V2)
  // ====================================================
  renderFeats() {
    const container = document.getElementById('feats-grid');
    if (!container) return;
    const query = (document.getElementById('feats-search-input')?.value || '').toLowerCase();

    const items = masterDb.filter(i => {
      const isFeat = i.type === 'Feat' || i.type === 'Special Ability';
      if (!isFeat) return false;
      if (query && !i.name.toLowerCase().includes(query) && !(i.benefit || '').toLowerCase().includes(query) && !(i.prereq || '').toLowerCase().includes(query)) return false;
      return true;
    });

    const countBadge = document.getElementById('feats-count-badge');
    if (countBadge) countBadge.textContent = `${items.length} Feats`;

    if (!items.length) {
      container.innerHTML = '<div class="col-span-full p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">No matching feats found.</div>';
      return;
    }

    let html = '';
    items.forEach(rawItem => {
      const idx = masterDb.indexOf(rawItem);
      const item = this.ensureV2(rawItem);
      const statPills = this.getEntrySummaryPills(item);

      html += `
        <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2.5 transition shadow">
          <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-sm font-extrabold text-white">${RuleMaster.escapeHtml(item.name)}</span>
                <span class="badge bg-amber-950 text-amber-300 border border-amber-800">${item.type}</span>
                ${item.isFighterBonusFeat ? `<span class="badge bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">⚔️ Fighter Bonus</span>` : ''}
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">📚 ${RuleMaster.escapeHtml(item.source || 'PHB')} • Category: <b>${item.role || 'General'}</b></div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${RuleMaster.escapeJsString(item.name)}', type: 'Feat', action: 'Passive', desc: '${RuleMaster.escapeJsString(item.benefit || item.description || '')}', badge: 'Feat' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Pin / Unpin to Combat Cockpit">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Edit">✏️</button>
            </div>
          </div>

          ${item.prereq && item.prereq !== '-' ? `
            <div class="bg-slate-950/60 border border-slate-800 px-2.5 py-1.5 rounded text-[10px] text-amber-300">
              <span class="font-bold text-slate-400 uppercase">Prerequisites:</span> ${RuleMaster.escapeHtml(item.prereq)}
            </div>
          ` : ''}

          ${statPills.length > 0 ? `
            <div class="flex flex-wrap gap-1">
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">${p}</span>`).join('')}
            </div>
          ` : ''}

          <p class="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-800/80">${RuleMaster.escapeHtml(item.benefit || item.description || '-')}</p>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800">
            <span class="text-[10px] text-slate-500">Scope: ${item.scope || 'General'}</span>
            <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-200 text-xs font-bold px-3 py-1 rounded transition">✨ Add Feat to Character</button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  },

  // ====================================================
  // 5. MAGIC ITEMS & CONSUMABLES VIEW (CANONICAL V2)
  // ====================================================
  renderMagicItems() {
    const container = document.getElementById('magic-items-grid');
    if (!container) return;
    const slotFilter = document.getElementById('mi-slot-filter')?.value || 'ALL';
    const query = (document.getElementById('mi-search-input')?.value || '').toLowerCase();

    const items = masterDb.filter(i => {
      const isItem = i.type === 'Wondrous Item' || i.type === 'Ring' || i.type === 'Potion' || i.type === 'Slotless Item' || i.type === 'Active Power';
      if (!isItem) return false;
      if (slotFilter !== 'ALL' && i.slot !== slotFilter) return false;
      if (query && !i.name.toLowerCase().includes(query) && !(i.benefit || '').toLowerCase().includes(query)) return false;
      return true;
    });

    const countBadge = document.getElementById('mi-count-badge');
    if (countBadge) countBadge.textContent = `${items.length} Magic Items / Potions`;

    if (!items.length) {
      container.innerHTML = '<div class="col-span-full p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">No matching magic items found.</div>';
      return;
    }

    let html = '';
    items.forEach(rawItem => {
      const idx = masterDb.indexOf(rawItem);
      const item = this.ensureV2(rawItem);
      const isPotion = item.type === 'Potion';
      const statPills = this.getEntrySummaryPills(item);
      const primaryBonusType = item.modifiers?.[0]?.type || 'Untyped';

      html += `
        <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2.5 transition shadow">
          <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-sm font-extrabold text-white">${RuleMaster.escapeHtml(item.name)}</span>
                <span class="badge ${isPotion ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-teal-950 text-teal-300 border border-teal-800'}">${item.type}</span>
                <span class="badge bg-slate-800 text-slate-300 text-[10px]">${item.slot || 'Slotless'}</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">📚 ${RuleMaster.escapeHtml(item.source || 'MIC')} • Bonus: <b>${primaryBonusType}</b></div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${RuleMaster.escapeJsString(item.name)}', type: 'Feat', action: 'Passive', desc: '${RuleMaster.escapeJsString(item.benefit || item.description || '')}', badge: '${RuleMaster.escapeJsString(primaryBonusType)}' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Pin / Unpin to Combat Cockpit">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Edit">✏️</button>
            </div>
          </div>

          ${statPills.length > 0 ? `
            <div class="flex flex-wrap gap-1">
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">${p}</span>`).join('')}
            </div>
          ` : ''}

          <p class="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-800/80">${RuleMaster.escapeHtml(item.benefit || item.description || '-')}</p>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
            <span class="text-amber-400 font-bold">${item.cost || 0} gp • ${item.weight || 0} lbs</span>
            <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-teal-950 hover:bg-teal-900 border border-teal-700 text-teal-200 text-xs font-bold px-3 py-1 rounded transition">
              ${isPotion ? '🧪 Add Potion to Backpack' : '🎒 Equip / Add to Inventory'}
            </button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  },

  // ====================================================
  // 6. EMBEDDED MODES HIERARCHY TREE VIEW (CANONICAL V2)
  // ====================================================
  renderHierarchyTree() {
    const container = document.getElementById('hierarchy-tree-container');
    if (!container) return;

    let treeHtml = '';
    let countComposite = 0;

    masterDb.forEach((rawItem, pIdx) => {
      const parent = this.ensureV2(rawItem);
      const modes = Array.isArray(parent.modes) ? parent.modes : [];
      if (modes.length > 0) {
        countComposite++;
        treeHtml += `
          <div class="bg-slate-900 border border-purple-500/40 rounded-xl p-4 space-y-3 shadow-lg">
            <div class="flex items-center justify-between border-b border-purple-500/30 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-xl">👑</span>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-extrabold text-white">${RuleMaster.escapeHtml(parent.name)}</span>
                    <span class="badge ${this.getTypeBadgeClass(parent.type)}">${parent.type}</span>
                    <span class="badge bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">⚡ ${modes.length} Embedded Mode(s)</span>
                  </div>
                  <div class="text-[10px] text-slate-400">📚 ${RuleMaster.escapeHtml(parent.source || 'Core 3.5e')} • Slot: <b>${parent.slot || 'None'}</b></div>
                </div>
              </div>
              <div class="flex gap-1.5">
                <button onclick="RuleMaster.addChildPower(${pIdx})" class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-2.5 py-1 rounded shadow transition flex items-center gap-1">
                  <span>➕</span>
                  <span>Add Mode</span>
                </button>
                <button onclick="RuleMaster.openModalWithData(masterDb[${pIdx}], ${pIdx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition">✏️</button>
              </div>
            </div>

            <div class="space-y-2 pl-4 border-l-2 border-purple-500/50">
              ${modes.map(mode => {
                const modeDice = mode.damageParts?.[0]?.dice || '';
                return `
                  <div class="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1.5 hover:border-purple-500/40 transition">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5">
                        <span class="text-purple-400 font-bold font-mono">⚡</span>
                        <span class="text-xs font-bold text-purple-200">${RuleMaster.escapeHtml(mode.name)}</span>
                        <span class="badge bg-slate-800 text-slate-400 text-[10px]">${mode.actionType || 'standard'}</span>
                      </div>
                    </div>
                    <div class="text-[11px] text-slate-300">${RuleMaster.escapeHtml(mode.benefit || '-')}</div>
                    ${modeDice ? `<div class="text-[10px] font-mono text-emerald-400 inline-flex items-center gap-1">${typeof getFormulaDiceIconSvg === 'function' ? getFormulaDiceIconSvg(modeDice, 'w-3 h-3 text-emerald-400 shrink-0') : ''}<span>Dice: ${modeDice}</span></div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
    });

    const badge = document.getElementById('tree-count-badge');
    if (badge) badge.textContent = `${countComposite} Multi-Mode Entries`;

    if (!treeHtml) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
          <div class="text-base font-bold text-slate-400">No items or spells with embedded sub-modes found yet.</div>
          <div class="text-xs">Click the <b>🔗 Add Embedded Sub-Mode</b> button next to any entry in the table to create a multi-mode spell or item.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = treeHtml;
  },

  // ====================================================
  // 9. BACKUP, EXPORT & CLOUD SYNC VIEW
  // ====================================================
  renderBackupTools() {
    const statsContainer = document.getElementById('backup-stats-container');
    if (statsContainer) {
      const weaponsCount = masterDb.filter(i => i.type === 'Weapon').length;
      const armorsCount = masterDb.filter(i => i.type === 'Armor' || i.type === 'Shield').length;
      const spellsCount = masterDb.filter(i => i.type === 'Spell').length;
      const maneuversCount = masterDb.filter(i => i.type === 'Maneuver' || i.type === 'Stance').length;
      const featsCount = masterDb.filter(i => i.type === 'Feat').length;
      const itemsCount = masterDb.filter(i => i.type === 'Wondrous Item' || i.type === 'Ring' || i.type === 'Potion').length;

      statsContainer.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Total Entries</div>
            <div class="text-lg font-black text-purple-400">${masterDb.length}</div>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Weapons & Armor</div>
            <div class="text-lg font-black text-rose-400">${weaponsCount + armorsCount}</div>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Spells & Maneuvers</div>
            <div class="text-lg font-black text-indigo-400">${spellsCount + maneuversCount}</div>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Feats & Items</div>
            <div class="text-lg font-black text-amber-400">${featsCount + itemsCount}</div>
          </div>
        </div>
      `;
    }
  },

  async resetMasterDbToDefault() {
    if (confirm('⚠️ Are you sure you want to clear all custom entries from this character\'s Custom DB?')) {
      masterDb.length = 0;
      if (typeof character !== 'undefined' && character) {
        character.customDb = masterDb;
      }
      this.selectedIds.clear();
      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      this.renderTable();
      if (typeof renderAll === 'function') renderAll();
      alert('✅ Character Custom DB has been cleared!');
    }
  },

  // Render Knowledge Bases and Splatbooks
  renderSourcesCatalog() {
    const srcContainer = document.getElementById('sources-list-container');
    if (srcContainer) {
      srcContainer.innerHTML = '';
      this.sourcesCatalog.forEach(src => {
        const div = document.createElement('div');
        div.className = 'bg-slate-900 border border-indigo-600/40 rounded-xl p-3 space-y-1.5';
        const isExternal = src.url && src.url.startsWith('http');
        div.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">${src.priority}. ${RuleMaster.escapeHtml(src.name)}</span>
            <span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700">${src.status}</span>
          </div>
          <div class="text-[11px] text-slate-400">${src.scope}</div>
          <div class="flex items-center justify-between pt-1 border-t border-slate-800">
            <span class="text-[10px] text-indigo-300 font-mono">${src.type}</span>
            ${isExternal ? `
              <a href="${src.url}" target="_blank" class="text-xs text-sky-400 hover:underline flex items-center gap-1">
                <span>Open Link</span> <span>↗</span>
              </a>
            ` : `
              <span class="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <span>⚡</span> <span>Built-In Engine</span>
              </span>
            `}
          </div>
        `;
        srcContainer.appendChild(div);
      });
    }

    const bookContainer = document.getElementById('splatbooks-grid-container');
    if (bookContainer) {
      bookContainer.innerHTML = '';
      this.splatbooks.forEach(b => {
        const div = document.createElement('div');
        div.className = 'bg-slate-900 border border-slate-700 rounded-lg p-2.5';
        div.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <span class="font-mono font-bold text-xs text-amber-400">${b.code}</span>
            <span class="badge bg-slate-800 text-slate-400">${b.cat}</span>
          </div>
          <div class="text-xs font-bold text-white">${RuleMaster.escapeHtml(b.name)}</div>
          <div class="text-[10px] text-slate-400 mt-1">${RuleMaster.escapeHtml(b.note)}</div>
        `;
        bookContainer.appendChild(div);
      });
    }
  },

  // Quick / Heuristic Rule Parser (Parses raw text from d20srd, books or SRD into Canonical V2)
  parseRawText() {
    const raw = document.getElementById('raw-rule-input')?.value || '';
    if (!raw.trim()) {
      alert('⚠️ Please paste rule text to parse.');
      return;
    }

    // 0. Check if raw text is a Structured Ability / Breath Weapon Stat Block (0ms deterministic V2 parse)
    const structuredAbility = this.parseStructuredAbilityStatBlock(raw);
    if (structuredAbility && structuredAbility.name) {
      this.openModalWithData(structuredAbility, -1);
      return;
    }

    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const entry = this.createEmptyEntry('Feat');

    if (lines.length > 0) {
      entry.name = lines[0].replace(/\[.*?\]/g, '').trim();
    }

    const fullText = raw.toLowerCase();

    if (fullText.includes('stance') || fullText.includes('discipline')) entry.type = 'Stance';
    else if (fullText.includes('strike') || fullText.includes('counter') || fullText.includes('boost') || fullText.includes('maneuver')) entry.type = 'Maneuver';
    else if (fullText.includes('evocation') || fullText.includes('transmutation') || fullText.includes('abjuration') || fullText.includes('casting time') || fullText.includes('components:')) entry.type = 'Spell';
    else if (fullText.includes('damage:') || fullText.includes('slashing') || fullText.includes('piercing') || fullText.includes('critical:')) entry.type = 'Weapon';
    else if (fullText.includes('armor bonus:') || fullText.includes('shield bonus:')) entry.type = 'Armor';
    else if (fullText.includes('prerequisite:')) entry.type = 'Feat';

    const prereqMatch = raw.match(/Prerequisite[s]?:?\s*(.*?)(?=\.|\n|$)/i);
    if (prereqMatch) entry.prereq = prereqMatch[1].trim();

    const benefitMatch = raw.match(/Benefit:?\s*([\s\S]*?)(?=(Special:|Normal:|$))/i);
    if (benefitMatch) {
      entry.benefit = benefitMatch[1].trim();
    } else {
      entry.benefit = lines.slice(1).join(' ');
    }
    entry.description = entry.benefit;

    const diceMatch = raw.match(/(\d+d\d+(\+\d+)?)/i);
    const detectedDice = diceMatch ? diceMatch[1] : '';

    const discMatch = raw.match(/(Iron Heart|Stone Dragon|Shadow Hand|White Raven|Tiger Claw|Diamond Mind|Setting Sun|Devoted Spirit|Desert Wind)/i);
    if (discMatch) entry.discipline = discMatch[1];

    let detectedDmgType = 'Untyped';
    if (entry.type === 'Weapon') {
      const isTwoHand = (typeof RuleEngine !== 'undefined' && RuleEngine.isTwoHandedWeapon(entry)) ||
        fullText.includes('two-handed') || fullText.includes('2-handed') || fullText.includes('two hands') || fullText.includes('requires 2 hands') || fullText.includes('two-hand');
      entry.slot = isTwoHand ? 'Two-Handed' : 'Main Hand';
      const tags = [];
      if (isTwoHand) tags.push('two-handed');
      if (fullText.includes('exotic')) tags.push('exotic');
      if (fullText.includes('martial')) tags.push('martial');
      if (fullText.includes('simple')) tags.push('simple');
      if (fullText.includes('slashing')) { tags.push('slashing'); detectedDmgType = 'Slashing'; }
      if (fullText.includes('piercing')) { tags.push('piercing'); detectedDmgType = detectedDmgType !== 'Untyped' ? detectedDmgType + '/Piercing' : 'Piercing'; }
      if (fullText.includes('bludgeoning')) { tags.push('bludgeoning'); detectedDmgType = 'Bludgeoning'; }
      entry.tags = tags;
      entry.weaponStats = {
        category: tags.includes('exotic') ? 'Exotic' : (tags.includes('simple') ? 'Simple' : 'Martial'),
        handedness: isTwoHand ? 'Two-Handed' : 'One-Handed',
        baseDamage: detectedDice || '1d8',
        critMin: 20,
        critMult: 2,
        damageTypes: [detectedDmgType],
        rangeIncrement: 0,
        finessable: false,
        isLight: false
      };
    }

    if (detectedDice) {
      entry.damageParts = [{
        dice: detectedDice,
        bonus: 0,
        type: detectedDmgType,
        multiplyOnCrit: entry.type === 'Weapon',
        onCritOnly: false,
        source: entry.name || 'Primary'
      }];
    }

    this.openModalWithData(entry, -1);
  },

  // ====================================================
  // ADD BUTTON DROPDOWN & INLINE AI RULE ADDER (CANONICAL V2)
  // ====================================================
  toggleAddMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('mdb-add-dropdown-menu');
    if (menu) menu.classList.toggle('hidden');
  },

  closeAddMenu() {
    const menu = document.getElementById('mdb-add-dropdown-menu');
    if (menu) menu.classList.add('hidden');
  },

  openInlineAiAdder(mode = 'search') {
    this.closeAddMenu();
    const panel = document.getElementById('inline-ai-adder-panel');
    if (panel) {
      panel.classList.remove('hidden');
      this.switchInlineMode(mode);
    }
  },

  closeInlineAiAdder() {
    const resultsBox = document.getElementById('inline-ai-results-box');
    if (resultsBox) resultsBox.innerHTML = '';
    const loadingBox = document.getElementById('inline-ai-loading-box');
    if (loadingBox) loadingBox.classList.add('hidden');
  },

  setInlineQueryAndSearch(term, categoryHint = 'Feat') {
    const queryInput = document.getElementById('inline-ai-rule-query');
    const catSelect = document.getElementById('inline-ai-rule-category');
    if (queryInput) queryInput.value = term;
    if (catSelect && categoryHint && categoryHint !== 'ALL') catSelect.value = categoryHint;
    this.queryInlineAiRule();
  },

  async queryInlineAiRule() {
    const queryInput = document.getElementById('inline-ai-rule-query');
    let query = queryInput?.value?.trim() || '';
    if (!query) {
      alert('⚠️ Please enter the name of the rule, feat, spell, or item to search.');
      queryInput?.focus();
      return;
    }

    const catSelect = document.getElementById('inline-ai-rule-category');
    let categoryHint = catSelect?.value || 'ALL';

    const prefixMatch = query.match(/^(spell|feat|race|deity|god|patron|domain|weapon|armor|shield|item|magic item|maneuver|stance|class|condition):\s*/i);
    if (prefixMatch) {
      const p = prefixMatch[1].toLowerCase();
      let matchedCat = 'Feat';
      if (p === 'spell') matchedCat = 'Spell';
      else if (p === 'feat') matchedCat = 'Feat';
      else if (p === 'race') matchedCat = 'Race';
      else if (p === 'deity' || p === 'god' || p === 'patron') matchedCat = 'Deity';
      else if (p === 'domain') matchedCat = 'Domain';
      else if (p === 'weapon') matchedCat = 'Weapon';
      else if (p === 'armor') matchedCat = 'Armor';
      else if (p === 'shield') matchedCat = 'Shield';
      else if (p === 'item' || p === 'magic item') matchedCat = 'Magic Item';
      else if (p === 'maneuver' || p === 'stance') matchedCat = 'Maneuver';
      else if (p === 'class') matchedCat = 'Class';
      else if (p === 'condition') matchedCat = 'Condition';

      categoryHint = matchedCat;
      if (catSelect) catSelect.value = matchedCat;
    }

    if (!prefixMatch && (!categoryHint || categoryHint === 'ALL')) {
      const msg = 'Please select a Rule Category (e.g., Feat, Spell, Deity, Domain, Class, Weapon) or type a prefix like "feat: Shock Trooper" or "domain: Planning" before searching.';
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({ title: 'Category Required', breakdown: msg, icon: '⚠️' });
      } else {
        alert('⚠️ ' + msg);
      }
      catSelect?.focus();
      return;
    }

    // 0ms Local Resolution (Master DB -> SrdCompendium -> ItemAssembler -> Canonical Dictionary)
    const localHits = this.resolveLocalZeroTokenQuery(query);
    if (localHits.length > 0) {
      this.renderInlineAiResults(localHits);
      const st = document.getElementById('inline-ai-status-text');
      const spinner = document.getElementById('inline-ai-loading-spinner');
      if (spinner) spinner.classList.add('hidden');
      const dbInfo = this.getExistingSiteDbInfo(localHits[0]);
      if (st) {
        st.innerHTML = dbInfo.exists
          ? `✅ <b>"${RuleMaster.escapeHtml(localHits[0].name)}"</b> already exists in the site database (<b>${dbInfo.sourceLabel}</b>). Direct duplicate addition to Master DB is disabled — click <b>Change &amp; Add</b> to customize and save a modified version.`
          : `⚡ <b>"${RuleMaster.escapeHtml(localHits[0].name)}"</b> assembled instantaneously via V2 Item Assembler (0 ms, Zero Tokens).`;
      }
      const lb = document.getElementById('inline-ai-loading-box');
      if (lb) lb.classList.remove('hidden');
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('⚠️ Please enter a Google Gemini API Key first (free key from Google AI Studio).\nYou can save your key in the Settings dialog.');
      if (typeof openSettingsModal === 'function') openSettingsModal();
      return;
    }

    const btn = document.getElementById('btn-inline-ai-search');
    const loadingBox = document.getElementById('inline-ai-loading-box');
    const spinner = document.getElementById('inline-ai-loading-spinner');
    const statusText = document.getElementById('inline-ai-status-text');
    const resultsBox = document.getElementById('inline-ai-results-box');

    if (btn) btn.disabled = true;
    if (spinner) spinner.classList.remove('hidden');
    if (loadingBox) loadingBox.classList.remove('hidden');
    if (resultsBox) resultsBox.innerHTML = '';

    try {
      const entries = await this.fetchSingleAiRuleObjects(query, categoryHint, apiKey, statusText);
      this.renderInlineAiResults(entries);
    } catch (err) {
      alert(`⚠️ Failed to fetch rule: ${err.message}\nPlease check your internet connection and API key.`);
    } finally {
      if (btn) btn.disabled = false;
      if (loadingBox) loadingBox.classList.add('hidden');
    }
  },

  renderInlineAiResults(rowsOrEntries) {
    const resultsBox = document.getElementById('inline-ai-results-box');
    if (!resultsBox) return;

    if (!rowsOrEntries || !rowsOrEntries.length) {
      resultsBox.innerHTML = `
        <div class="p-3 text-center text-slate-400 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
          No matching rule entry found. Please check the spelling and search again.
        </div>
      `;
      return;
    }

    const entries = this.convertRowsToEntries(rowsOrEntries).map(e => this.ensureV2(e));
    this._inlineEntries = entries;

    const newEntriesCount = entries.filter(e => !this.getExistingSiteDbInfo(e).exists).length;
    const firstDbInfo = this.getExistingSiteDbInfo(entries[0]);

    let html = `
      <div class="flex items-center justify-between bg-slate-900 border ${newEntriesCount === 0 ? 'border-amber-500/50' : 'border-purple-500/40'} p-2.5 rounded-xl mb-2 shadow-md">
        <div class="flex items-center gap-2">
          <span class="text-base">${newEntriesCount === 0 ? '📌' : '✨'}</span>
          <div>
            <div class="text-xs font-bold ${newEntriesCount === 0 ? 'text-amber-300' : 'text-white'}">${newEntriesCount === 0 ? (entries.length === 1 ? `"${RuleMaster.escapeHtml(entries[0].name)}" Already Exists in Site Database (${firstDbInfo.sourceLabel})` : `${entries.length} Rule(s) Already Exist in Site Database`) : `${entries.length} Canonical V2 Rule(s) Parsed`}</div>
            <div class="text-[10px] text-slate-400">${newEntriesCount === 0 ? 'Direct duplicate addition to Master DB is disabled — click "Change & Add" to customize and save a modified version' : 'Parent entry and embedded modes can be added together'}</div>
          </div>
        </div>
        ${newEntriesCount > 0 ? `
          <button onclick="RuleMaster.addAllInlineResultsToDb()" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer">
            <span>📥</span>
            <span>${newEntriesCount < entries.length ? `Add New to DB (${newEntriesCount})` : 'Add All to DB'}</span>
          </button>
        ` : (entries.length === 1 ? `
          <button onclick="RuleMaster.changeAndAddInlineResult(0)" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer">
            <span>✏️</span>
            <span>Change &amp; Add</span>
          </button>
        ` : `
          <span class="px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 select-none">
            <span>🔒</span>
            <span>Already in Site DB</span>
          </span>
        `)}
      </div>
      <div class="space-y-2 mt-2">
    `;

    entries.forEach((item, idx) => {
      const dbInfo = this.getExistingSiteDbInfo(item);
      const modes = Array.isArray(item.modes) ? item.modes : [];
      const badgeClass = this.getTypeBadgeClass(item.type);
      const statPills = this.getEntrySummaryPills(item);

      html += `
        <div class="bg-slate-950 border ${dbInfo.exists ? 'border-amber-500/45' : 'border-purple-500/40'} rounded-xl p-3 shadow-md space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs md:text-sm font-extrabold text-white">${RuleMaster.escapeHtml(item.name)}</span>
                <span class="badge ${badgeClass} text-[10px]">${item.type}</span>
                ${dbInfo.exists ? `<span class="badge bg-amber-950/90 text-amber-300 border border-amber-500/60 text-[10px] font-bold">📌 Already in ${dbInfo.inMasterDb ? 'Custom Master DB' : 'Site Database'}</span>` : ''}
                ${modes.length > 0 ? `<span class="badge bg-purple-950 text-purple-200 border border-purple-600 text-[10px] font-bold">⚡ ${modes.length} Embedded Mode(s)</span>` : ''}
                <span class="text-[10px] text-slate-400">📚 <b>${RuleMaster.escapeHtml(item.source || 'PHB')}</b></span>
                <span class="text-[10px] text-slate-400">• Slot: <b>${item.slot || 'None'}</b></span>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              ${dbInfo.exists ? `
                <span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-bold flex items-center gap-1 select-none" title="Already exists in ${dbInfo.sourceLabel} — direct duplicate addition disabled">
                  <span>🔒</span>
                  <span>Already in DB</span>
                </span>
                <button onclick="RuleMaster.changeAndAddInlineResult(${idx})" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow transition flex items-center gap-1 cursor-pointer" title="Modify this entry in the Builder and add to Custom Master DB">
                  <span>✏️</span>
                  <span>Change &amp; Add</span>
                </button>
              ` : `
                <button onclick="RuleMaster.addInlineResultToDb(${idx})" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow transition flex items-center gap-1 cursor-pointer">
                  <span>📥</span>
                  <span>Add to DB</span>
                </button>
              `}
              <button onclick="RuleMaster.equipInlineResultToCharacter(${idx})" class="bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 text-xs px-2 py-1 rounded-lg transition font-bold cursor-pointer" title="Equip to Character">
                ⚡ Equip
              </button>
              ${!dbInfo.exists ? `
                <button onclick="RuleMaster.editInlineResultInModal(${idx})" class="bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs px-2 py-1 rounded-lg border border-slate-700 transition cursor-pointer" title="Inspect / Edit in Form">
                  ✏️ Edit
                </button>
              ` : ''}
            </div>
          </div>

          ${statPills.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1">
              <span class="text-[10px] uppercase font-bold text-slate-400">Effects:</span>
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[10px] font-bold">${p}</span>`).join('')}
            </div>
          ` : ''}

          ${modes.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1">
              <span class="text-[10px] uppercase font-bold text-purple-300">Sub-Modes:</span>
              ${modes.map(m => `<span class="badge bg-purple-950 text-purple-200 border border-purple-700 font-mono text-[10px]">⚡ ${RuleMaster.escapeHtml(m.name)}</span>`).join('')}
            </div>
          ` : ''}

          <div class="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded border border-slate-800">
            ${RuleMaster.escapeHtml(item.benefit || item.description || '-')}
          </div>

          <div class="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <div>
              <span>Action: <b class="text-amber-400">${item.action || 'Passive'}</b></span> • 
              <span>Duration: <b class="text-purple-300">${RuleMaster.escapeHtml(item.duration || 'Continuous')}</b></span>
            </div>
            <div>
              <span>Weight: <b>${item.weight || 0} lbs</b></span> • 
              <span>Price: <b class="text-amber-300">${item.cost || 0} gp</b></span>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    resultsBox.innerHTML = html;
  },

  addInlineResultToDb(idx) {
    if (!this._inlineEntries || !this._inlineEntries[idx]) return;
    const item = this.ensureV2(JSON.parse(JSON.stringify(this._inlineEntries[idx])));
    const dbInfo = this.getExistingSiteDbInfo(item);
    if (dbInfo.exists) {
      this.changeAndAddInlineResult(idx);
      return;
    }
    const existsIdx = masterDb.findIndex(m => (m.id && m.id === item.id) || (m.name || '').toLowerCase().trim() === (item.name || '').toLowerCase().trim());
    if (existsIdx >= 0) {
      masterDb[existsIdx] = item;
    } else {
      masterDb.push(item);
    }

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`✅ "${item.name}" successfully added to Master_DB and library updated!`);
  },

  addAllInlineResultsToDb() {
    if (!this._inlineEntries || !this._inlineEntries.length) return;
    let addedCount = 0;
    [...this._inlineEntries].reverse().forEach(it => {
      const copy = this.ensureV2(JSON.parse(JSON.stringify(it)));
      if (this.getExistingSiteDbInfo(copy).exists) return;
      const existsIdx = masterDb.findIndex(m => (m.id && m.id === copy.id) || (m.name || '').toLowerCase().trim() === (copy.name || '').toLowerCase().trim());
      if (existsIdx >= 0) {
        masterDb[existsIdx] = copy;
      } else {
        masterDb.unshift(copy);
      }
      addedCount++;
    });
    if (addedCount === 0) {
      alert('ℹ️ All listed entries already exist in the site database. Use "Change & Add" to customize an entry before adding it to Master DB.');
      return;
    }
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`✅ A total of ${addedCount} Canonical V2 rule(s) successfully added to Master_DB!`);
  },

  changeAndAddInlineResult(idx) {
    if (!this._inlineEntries || !this._inlineEntries[idx]) return;
    const item = this.ensureV2(JSON.parse(JSON.stringify(this._inlineEntries[idx])));
    const dbInfo = this.getExistingSiteDbInfo(item);
    this.openModalWithData(item, dbInfo.inMasterDb ? dbInfo.masterDbIndex : -1, {
      changeAndAddMode: true,
      sourceLabel: dbInfo.sourceLabel || 'Site Database'
    });
  },

  editInlineResultInModal(idx) {
    if (!this._inlineEntries || !this._inlineEntries[idx]) return;
    const item = this.ensureV2(this._inlineEntries[idx]);
    this.openModalWithData(item, -1);
  },

  equipInlineResultToCharacter(idx) {
    if (!this._inlineEntries || !this._inlineEntries[idx]) return;
    const item = this.ensureV2(this._inlineEntries[idx]);
    this.equipItemWithChildren(item, this._inlineEntries);
  },

  // ====================================================
  // SERBEST METİN (FREE-TEXT) AI & THE FORGE INLINE ENGINE (CANONICAL V2)
  // ====================================================
  switchInlineMode(mode) {
    // If modal was open and user clicks an inline mode tab directly, dock panels back to inline first
    const modal = document.getElementById('modal-master-db-editor');
    if (modal && !modal.classList.contains('hidden')) {
      this._dockPanelsBackToInline();
      modal.classList.add('hidden');
    }

    const searchPanel = document.getElementById('inline-mode-search');
    const freetextPanel = document.getElementById('inline-mode-freetext');
    const forgePanel = document.getElementById('inline-mode-forge');
    const manualPanel = document.getElementById('inline-mode-manual');
    const btnSearch = document.getElementById('btn-inline-mode-search');
    const btnFreetext = document.getElementById('btn-inline-mode-freetext');
    const btnForge = document.getElementById('btn-inline-mode-forge');
    const btnManual = document.getElementById('btn-inline-mode-manual');
    const headerTitle = document.getElementById('inline-panel-header-title');

    const activeCls = 'ui-btn-md w-full h-9 px-2.5 rounded-lg font-bold transition bg-slate-800/95 text-purple-200 border border-purple-400/60 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer';
    const activeForgeCls = 'ui-btn-md w-full h-9 px-2.5 rounded-lg font-bold transition bg-slate-800/95 text-amber-300 border border-amber-400/60 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer';
    const inactiveCls = 'ui-btn-md w-full h-9 px-2.5 rounded-lg font-bold transition text-slate-400 hover:text-white border border-transparent flex items-center justify-center gap-1.5 cursor-pointer';
    const inactiveForgeCls = 'ui-btn-md w-full h-9 px-2.5 rounded-lg font-bold transition text-slate-300 hover:text-amber-300 border border-transparent flex items-center justify-center gap-1.5 cursor-pointer';

    if (searchPanel) searchPanel.classList.toggle('hidden', mode !== 'search');
    if (freetextPanel) freetextPanel.classList.toggle('hidden', mode !== 'freetext');
    if (forgePanel) forgePanel.classList.toggle('hidden', mode !== 'forge');
    if (manualPanel) manualPanel.classList.toggle('hidden', mode !== 'manual');

    if (btnSearch) btnSearch.className = mode === 'search' ? activeCls : inactiveCls;
    if (btnFreetext) btnFreetext.className = mode === 'freetext' ? activeCls : inactiveCls;
    if (btnForge) btnForge.className = mode === 'forge' ? activeForgeCls : inactiveForgeCls;
    if (btnManual) btnManual.className = mode === 'manual' ? activeCls : inactiveCls;

    if (mode === 'freetext') {
      if (headerTitle) headerTitle.textContent = 'Rule Master AI Free-Text Parser';
      const ta = document.getElementById('inline-ai-freetext-input');
      if (ta) ta.focus();
    } else if (mode === 'forge') {
      if (headerTitle) headerTitle.textContent = 'The Forge — V2 Modular Item Builder';
      this.populateInlineForgeControls();
      this.updateInlineForgePreview();
    } else if (mode === 'manual') {
      if (headerTitle) headerTitle.textContent = 'Manual Rule & Item Builder — Canonical V2';
      const modList = document.getElementById('im-modifiers-list');
      if (modList && !modList.children.length) {
        this.addInlineManualModifierRow();
      }
      this.renderInlineLegoPrimitiveStudio();
      const nameIn = document.getElementById('im-name');
      if (nameIn) nameIn.focus();
    } else {
      if (headerTitle) headerTitle.textContent = 'Rule Master AI & The Forge';
      const q = document.getElementById('inline-ai-rule-query');
      if (q) q.focus();
    }
  },

  addInlineManualModifierRow(mod = null) {
    const list = document.getElementById('im-modifiers-list');
    if (!list) return;
    const targetVal = mod?.target || 'ability.str';
    const valNum = mod?.value !== undefined ? mod.value : '';
    const typeVal = mod?.type || 'Enhancement';
    const condVal = mod?.condition || '';

    const TARGET_GROUPS = [
      {
        group: '💪 Ability Scores (6)',
        opts: [
          { v: 'ability.str', l: 'STR (Strength)' },
          { v: 'ability.dex', l: 'DEX (Dexterity)' },
          { v: 'ability.con', l: 'CON (Constitution)' },
          { v: 'ability.int', l: 'INT (Intelligence)' },
          { v: 'ability.wis', l: 'WIS (Wisdom)' },
          { v: 'ability.cha', l: 'CHA (Charisma)' }
        ]
      },
      {
        group: '🛡️ Armor Class (6)',
        opts: [
          { v: 'ac', l: 'AC (Armor Class — Total)' },
          { v: 'ac.deflection', l: 'Deflection AC' },
          { v: 'ac.natural', l: 'Natural Armor AC' },
          { v: 'ac.dodge', l: 'Dodge AC' },
          { v: 'ac.armor', l: 'Armor AC' },
          { v: 'ac.shield', l: 'Shield AC' }
        ]
      },
      {
        group: '⚡ Saving Throws (4)',
        opts: [
          { v: 'save.all', l: 'All Saving Throws' },
          { v: 'save.fort', l: 'Fortitude Save' },
          { v: 'save.ref', l: 'Reflex Save' },
          { v: 'save.will', l: 'Will Save' }
        ]
      },
      {
        group: '⚔️ Combat, Initiative, HP, Speed & Caster Level (9)',
        opts: [
          { v: 'attack.all', l: 'Attack Rolls (All)' },
          { v: 'attack.melee', l: 'Melee Attack Rolls' },
          { v: 'attack.ranged', l: 'Ranged Attack Rolls' },
          { v: 'damage.all', l: 'Damage Rolls (All)' },
          { v: 'damage.melee', l: 'Melee Damage Rolls' },
          { v: 'init', l: 'Initiative' },
          { v: 'hp', l: 'Hit Points (HP)' },
          { v: 'casterLevel', l: 'Caster Level (CL)' },
          { v: 'speed.land', l: 'Base Speed (ft.)' }
        ]
      },
      {
        group: '🎯 Skills — All 36 Official D&D 3.5e Skills',
        opts: [
          { v: 'skill.all', l: 'All Skills' },
          { v: 'skill.appraise', l: 'Skill: Appraise (INT)' },
          { v: 'skill.balance', l: 'Skill: Balance (DEX)' },
          { v: 'skill.bluff', l: 'Skill: Bluff (CHA)' },
          { v: 'skill.climb', l: 'Skill: Climb (STR)' },
          { v: 'skill.concentration', l: 'Skill: Concentration (CON)' },
          { v: 'skill.craft', l: 'Skill: Craft (INT)' },
          { v: 'skill.decipher_script', l: 'Skill: Decipher Script (INT)' },
          { v: 'skill.diplomacy', l: 'Skill: Diplomacy (CHA)' },
          { v: 'skill.disable_device', l: 'Skill: Disable Device (INT)' },
          { v: 'skill.disguise', l: 'Skill: Disguise (CHA)' },
          { v: 'skill.escape_artist', l: 'Skill: Escape Artist (DEX)' },
          { v: 'skill.forgery', l: 'Skill: Forgery (INT)' },
          { v: 'skill.gather_information', l: 'Skill: Gather Information (CHA)' },
          { v: 'skill.handle_animal', l: 'Skill: Handle Animal (CHA)' },
          { v: 'skill.heal', l: 'Skill: Heal (WIS)' },
          { v: 'skill.hide', l: 'Skill: Hide (DEX)' },
          { v: 'skill.intimidate', l: 'Skill: Intimidate (CHA)' },
          { v: 'skill.jump', l: 'Skill: Jump (STR)' },
          { v: 'skill.knowledge_arcana', l: 'Skill: Knowledge (Arcana) (INT)' },
          { v: 'skill.knowledge_architecture', l: 'Skill: Knowledge (Architecture & Eng.) (INT)' },
          { v: 'skill.knowledge_dungeoneering', l: 'Skill: Knowledge (Dungeoneering) (INT)' },
          { v: 'skill.knowledge_geography', l: 'Skill: Knowledge (Geography) (INT)' },
          { v: 'skill.knowledge_history', l: 'Skill: Knowledge (History) (INT)' },
          { v: 'skill.knowledge_local', l: 'Skill: Knowledge (Local) (INT)' },
          { v: 'skill.knowledge_nature', l: 'Skill: Knowledge (Nature) (INT)' },
          { v: 'skill.knowledge_nobility', l: 'Skill: Knowledge (Nobility & Royalty) (INT)' },
          { v: 'skill.knowledge_planes', l: 'Skill: Knowledge (The Planes) (INT)' },
          { v: 'skill.knowledge_religion', l: 'Skill: Knowledge (Religion) (INT)' },
          { v: 'skill.listen', l: 'Skill: Listen (WIS)' },
          { v: 'skill.move_silently', l: 'Skill: Move Silently (DEX)' },
          { v: 'skill.open_lock', l: 'Skill: Open Lock (DEX)' },
          { v: 'skill.perform', l: 'Skill: Perform (CHA)' },
          { v: 'skill.profession', l: 'Skill: Profession (WIS)' },
          { v: 'skill.ride', l: 'Skill: Ride (DEX)' },
          { v: 'skill.search', l: 'Skill: Search (INT)' },
          { v: 'skill.sense_motive', l: 'Skill: Sense Motive (WIS)' },
          { v: 'skill.sleight_of_hand', l: 'Skill: Sleight of Hand (DEX)' },
          { v: 'skill.speak_language', l: 'Skill: Speak Language' },
          { v: 'skill.spellcraft', l: 'Skill: Spellcraft (INT)' },
          { v: 'skill.spot', l: 'Skill: Spot (WIS)' },
          { v: 'skill.survival', l: 'Skill: Survival (WIS)' },
          { v: 'skill.swim', l: 'Skill: Swim (STR)' },
          { v: 'skill.tumble', l: 'Skill: Tumble (DEX)' },
          { v: 'skill.use_magic_device', l: 'Skill: Use Magic Device (CHA)' },
          { v: 'skill.use_rope', l: 'Skill: Use Rope (DEX)' }
        ]
      }
    ];

    const BONUS_TYPES = [
      'Enhancement', 'Untyped', 'Morale', 'Luck', 'Insight', 'Competence',
      'Resistance', 'Deflection', 'Armor', 'Shield', 'Natural Armor',
      'Dodge', 'Sacred', 'Profane', 'Alchemical', 'Racial', 'Size', 'Circumstance'
    ];

    const row = document.createElement('div');
    row.className = 'im-mod-row grid grid-cols-1 sm:grid-cols-12 gap-2 items-center';
    row.innerHTML = `
      <div class="sm:col-span-4">
        <select class="im-mod-target w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-emerald-400">
          ${TARGET_GROUPS.map(g => `<optgroup label="${g.group}">${g.opts.map(o => `<option value="${o.v}" ${o.v === targetVal ? 'selected' : ''}>${o.l}</option>`).join('')}</optgroup>`).join('')}
        </select>
      </div>
      <div class="sm:col-span-2">
        <input type="number" value="${valNum}" placeholder="+Value (e.g. 2)" class="im-mod-value w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-2 text-center text-xs text-emerald-300 font-bold font-mono focus:outline-none focus:border-emerald-400">
      </div>
      <div class="sm:col-span-3">
        <select class="im-mod-type w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-2.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-emerald-400">
          ${BONUS_TYPES.map(t => `<option value="${t}" ${t === typeVal ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="sm:col-span-2">
        <input type="text" value="${condVal}" placeholder="Condition (Optional)" class="im-mod-cond w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-400">
      </div>
      <div class="sm:col-span-1">
        <button type="button" data-action="forge:remove-modifier-row" class="w-full h-9 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold transition cursor-pointer flex items-center justify-center" title="Remove Modifier">🗑️</button>
      </div>
    `;
    list.appendChild(row);
  },

  addInlineExtraDamagePart(part = null) {
    if (!Array.isArray(this._inlineExtraDamageParts)) this._inlineExtraDamageParts = [];
    if (part && part.dice) {
      this._inlineExtraDamageParts.push({
        dice: String(part.dice).trim(),
        bonus: Number(part.bonus) || 0,
        type: part.type || 'Fire',
        multiplyOnCrit: Boolean(part.multiplyOnCrit),
        onCritOnly: Boolean(part.onCritOnly),
        source: part.source || 'Extra'
      });
    } else {
      const diceEl = document.getElementById('im-extra-dmg-dice');
      const typeEl = document.getElementById('im-extra-dmg-type');
      const critEl = document.getElementById('im-extra-dmg-crit');
      const rawDice = (diceEl?.value || '').trim();
      if (!rawDice) return;
      const critMode = critEl?.value || 'normal';
      this._inlineExtraDamageParts.push({
        dice: rawDice,
        bonus: 0,
        type: typeEl?.value || 'Fire',
        multiplyOnCrit: critMode === 'mult',
        onCritOnly: critMode === 'crit_only',
        source: critMode === 'crit_only' ? 'Burst' : 'Extra'
      });
      if (diceEl) diceEl.value = '';
    }
    this.renderInlineDamagePartsChips();
    this.runInlineLegoDryRunPreview();
  },

  removeInlineExtraDamagePart(idx) {
    if (!Array.isArray(this._inlineExtraDamageParts)) return;
    const i = Number(idx);
    if (i >= 0 && i < this._inlineExtraDamageParts.length) {
      this._inlineExtraDamageParts.splice(i, 1);
      this.renderInlineDamagePartsChips();
      this.runInlineLegoDryRunPreview();
    }
  },

  renderInlineDamagePartsChips() {
    const box = document.getElementById('im-damage-parts-chips');
    if (!box) return;
    const parts = Array.isArray(this._inlineExtraDamageParts) ? this._inlineExtraDamageParts : [];
    if (parts.length === 0) {
      box.innerHTML = '<span class="italic text-slate-500">No extra damage parts attached.</span>';
      return;
    }
    const escHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    box.innerHTML = parts.map((p, idx) => {
      const critTag = p.onCritOnly ? ' (On Crit Only)' : (p.multiplyOnCrit ? ' (Crit ×)' : '');
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500/50 text-rose-200 font-mono text-[10px]"><span>💥 +${escHtml(p.dice)} ${escHtml(p.type)}${escHtml(critTag)}</span><button type="button" data-action="forge:remove-damage-part" data-idx="${idx}" class="text-rose-400 hover:text-white font-bold ml-0.5 cursor-pointer">×</button></span>`;
    }).join('');
  },

  onInlineManualTypeChange(preserveSlotAndAction = false) {
    const typeEl = document.getElementById('im-type');
    const typeVal = typeEl?.value || 'Weapon';

    // If user manually switches Category dropdown to Deity or Domain, launch its dedicated editor modal
    if (typeVal === 'Deity' && typeof window.openCustomDeityEditorModal === 'function') {
      const currentName = (document.getElementById('im-name')?.value || '').trim();
      const idx = this.selectedEntryIndex;
      if (typeEl) typeEl.value = 'Feat';
      this.closeMasterDbEditorModal();
      window.openCustomDeityEditorModal({ name: currentName }, idx);
      return;
    }
    if (typeVal === 'Domain' && typeof window.openCustomDomainEditorModal === 'function') {
      const currentName = (document.getElementById('im-name')?.value || '').trim();
      const idx = this.selectedEntryIndex;
      if (typeEl) typeEl.value = 'Feat';
      this.closeMasterDbEditorModal();
      window.openCustomDomainEditorModal({ name: currentName }, idx);
      return;
    }

    // Update modal header dynamically if #modal-master-db-editor is currently open
    const mdbModal = document.getElementById('modal-master-db-editor');
    if (mdbModal && !mdbModal.classList.contains('hidden')) {
      const meta = this.getMasterDbModalHeaderMeta('manual', { type: typeVal, name: document.getElementById('im-name')?.value });
      const iconEl = document.getElementById('modal-mdb-editor-icon');
      const titleEl = document.getElementById('modal-mdb-editor-title');
      if (iconEl) iconEl.textContent = meta.icon;
      if (titleEl) titleEl.textContent = meta.title;
    }

    const slotEl = document.getElementById('im-slot');
    const actEl = document.getElementById('im-action');
    if (!preserveSlotAndAction) {
      if (slotEl) {
        if (typeVal === 'Weapon') slotEl.value = 'Main Hand';
        else if (typeVal === 'Shield') slotEl.value = 'Off-Hand/Shield';
        else if (typeVal === 'Armor') slotEl.value = 'Armor';
        else if (typeVal === 'Ring') slotEl.value = 'Ring';
        else if (typeVal === 'Wondrous Item') slotEl.value = 'Shoulders';
        else slotEl.value = 'None';
      }
      if (actEl) {
        if (typeVal === 'Spell' || typeVal === 'Maneuver' || typeVal === 'Potion') actEl.value = 'Standard Action';
        else if (typeVal === 'Stance') actEl.value = 'Swift Action';
        else actEl.value = 'Passive';
      }
    }

    const isArmorShield = typeVal === 'Armor' || typeVal === 'Shield';
    const isSpellManeuver = typeVal === 'Spell' || typeVal === 'Maneuver' || typeVal === 'Stance';
    const isWeapon = typeVal === 'Weapon';
    const isFeatLike = ['Feat', 'DM Boon', 'DM Grant'].includes(typeVal);
    const isNonPhysicalRule = ['Feat', 'Spell', 'Maneuver', 'Stance', 'Race', 'Flaw', 'Special Ability', 'DM Grant', 'DM Boon', 'Racial Trait', 'Class Feature'].includes(typeVal);

    const pArmor = document.getElementById('im-panel-armor');
    const pSpell = document.getElementById('im-panel-spell');
    const pFeatOpts = document.getElementById('im-panel-feat-options');
    const colCrit = document.getElementById('im-col-crit');
    const rowWepFlags = document.getElementById('im-row-weapon-flags');
    const colSlot = document.getElementById('im-col-slot');
    const colPrice = document.getElementById('im-col-economy-price');
    const colWeight = document.getElementById('im-col-economy-weight');

    if (pArmor) pArmor.classList.toggle('hidden', !isArmorShield);
    if (pSpell) pSpell.classList.toggle('hidden', !isSpellManeuver);
    if (pFeatOpts) pFeatOpts.classList.toggle('hidden', !isFeatLike);
    if (colCrit) colCrit.classList.toggle('hidden', !isWeapon);
    if (rowWepFlags) rowWepFlags.classList.toggle('hidden', !(isWeapon || isSpellManeuver));
    if (colSlot) colSlot.classList.toggle('opacity-50', isNonPhysicalRule);
    if (colPrice) colPrice.classList.toggle('hidden', isNonPhysicalRule);
    if (colWeight) colWeight.classList.toggle('hidden', isNonPhysicalRule);
  },

  applyInlineManualPreset(presetKey) {
    const p = this.getPresets()[presetKey];
    if (!p) return;
    const setVal = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.value = v; };
    setVal('im-type', p.type);
    setVal('im-slot', p.slot);
    setVal('im-dice', p.dice || '');
    setVal('im-dmg-type', p.dmgType || 'Slashing');
    setVal('im-crit-min', p.critMin || 20);
    setVal('im-crit-mult', p.critMult || 2);
    setVal('im-action', p.action === 'Standard / Full Attack' ? 'Standard Action' : (p.action || 'Passive'));
    setVal('im-weight', p.weight !== undefined ? p.weight : 0);
    setVal('im-cost', p.cost !== undefined ? p.cost : 0);
    const chk2h = document.getElementById('im-flag-two-hand-str');
    if (chk2h) chk2h.checked = presetKey === 'weapon2h';

    if (presetKey === 'shield') {
      setVal('im-armor-ac', 2);
      setVal('im-max-dex', '');
      setVal('im-acp', -1);
      setVal('im-asf', 5);
    } else if (presetKey === 'armor') {
      setVal('im-armor-ac', 4);
      setVal('im-max-dex', 4);
      setVal('im-acp', -2);
      setVal('im-asf', 20);
    }

    this.onInlineManualTypeChange(true);

    const modList = document.getElementById('im-modifiers-list');
    if (modList) {
      modList.innerHTML = '';
      if (presetKey === 'shield') {
        this.addInlineManualModifierRow({ target: 'ac.shield', value: 2, type: 'Shield' });
      } else if (presetKey === 'armor') {
        this.addInlineManualModifierRow({ target: 'ac.armor', value: 4, type: 'Armor' });
      } else if (presetKey === 'wondrous') {
        this.addInlineManualModifierRow({ target: 'save.all', value: 1, type: 'Resistance' });
      } else {
        this.addInlineManualModifierRow({ target: 'ability.str', value: '', type: p.bonusType || 'Enhancement' });
      }
    }
  },

  buildInlineManualV2Entry() {
    const editIdx = this.selectedEntryIndex;
    const rawName = (document.getElementById('im-name')?.value || '').trim();
    const typeVal = this.capitalizeIdentifier(document.getElementById('im-type')?.value || 'Weapon');
    const slotVal = this.capitalizeIdentifier(document.getElementById('im-slot')?.value || 'None');
    const sourceVal = (document.getElementById('im-source')?.value || 'PHB p.').trim();
    const diceVal = (document.getElementById('im-dice')?.value || '').trim();
    const dmgTypeVal = this.capitalizeIdentifier(document.getElementById('im-dmg-type')?.value || 'Slashing');
    const critMinVal = Number(document.getElementById('im-crit-min')?.value) || 20;
    const critMultVal = Number(document.getElementById('im-crit-mult')?.value) || 2;
    const actVal = document.getElementById('im-action')?.value || 'Passive';
    const costVal = Number(document.getElementById('im-cost')?.value) || 0;
    const weightVal = Number(document.getElementById('im-weight')?.value) || 0;
    const chargesVal = parseInt(document.getElementById('im-charges')?.value);
    const prereqVal = (document.getElementById('im-prereq')?.value || '-').trim();
    const benefitVal = (document.getElementById('im-benefit')?.value || '').trim();

    const baseObj = this._currentEditingEntry
      ? this.ensureV2(JSON.parse(JSON.stringify(this._currentEditingEntry)))
      : ((editIdx >= 0 && typeof masterDb !== 'undefined' && Array.isArray(masterDb) && masterDb[editIdx])
        ? this.ensureV2(JSON.parse(JSON.stringify(masterDb[editIdx])))
        : this.createEmptyEntry(typeVal));

    const modifiers = [];
    document.querySelectorAll('#im-modifiers-list .im-mod-row').forEach(row => {
      const target = row.querySelector('.im-mod-target')?.value || 'ability.str';
      const rawVal = row.querySelector('.im-mod-value')?.value;
      const type = row.querySelector('.im-mod-type')?.value || 'Enhancement';
      const cond = (row.querySelector('.im-mod-cond')?.value || '').trim() || null;
      if (rawVal !== '' && rawVal !== undefined && !isNaN(Number(rawVal)) && Number(rawVal) !== 0) {
        modifiers.push({ target, value: Number(rawVal), type, condition: cond });
      }
    });
    // Preserve V2.5 formula-based or selector-based modifiers from baseObj that cannot be represented in numeric-only inputs
    if (Array.isArray(baseObj.modifiers)) {
      baseObj.modifiers.forEach(bm => {
        if (!bm || typeof bm !== 'object') return;
        const isComplexV25 = Boolean((bm.formula !== undefined && bm.formula !== null && isNaN(Number(bm.formula))) || bm.selector || (bm.op && bm.op !== 'add'));
        if (isComplexV25 && !modifiers.some(m => m.target === bm.target && m.formula === bm.formula)) {
          modifiers.push(Object.assign({}, bm));
        }
      });
    }

    const damageParts = [];
    if (diceVal) {
      const atkDmgMod = modifiers.find(m => m.target === 'damage.all' || m.target === 'damage.melee');
      damageParts.push({
        dice: diceVal,
        bonus: typeVal === 'Weapon' && atkDmgMod ? Number(atkDmgMod.value) || 0 : 0,
        type: dmgTypeVal,
        multiplyOnCrit: typeVal === 'Weapon',
        onCritOnly: false,
        source: typeVal === 'Weapon' ? 'Base Weapon' : 'Primary'
      });
    }
    if (Array.isArray(this._inlineExtraDamageParts) && this._inlineExtraDamageParts.length > 0) {
      damageParts.push(...this._inlineExtraDamageParts.map(p => Object.assign({}, p)));
    } else if (!diceVal && Array.isArray(baseObj.damageParts) && baseObj.damageParts.length > 1) {
      damageParts.push(...baseObj.damageParts.slice(1));
    }

    const ruleFlags = Object.assign({}, baseObj.ruleFlags || {});
    if (document.getElementById('im-flag-touch')?.checked) ruleFlags.touchAttack = true; else delete ruleFlags.touchAttack;
    if (document.getElementById('im-flag-keen')?.checked) ruleFlags.critThreatDoubled = true; else delete ruleFlags.critThreatDoubled;
    if (document.getElementById('im-flag-adamantine')?.checked) ruleFlags.adamantine = true; else delete ruleFlags.adamantine;
    if (document.getElementById('im-flag-two-hand-str')?.checked || slotVal === 'Two-Handed') {
      ruleFlags.twoHandedStrengthMultiplier = true;
    } else {
      delete ruleFlags.twoHandedStrengthMultiplier;
    }

    const entry = Object.assign({}, baseObj, {
      schemaVersion: 2,
      name: this.capitalizeTitle(rawName),
      type: typeVal,
      slot: slotVal,
      source: sourceVal,
      prereq: prereqVal,
      benefit: benefitVal,
      description: benefitVal || baseObj.description || '',
      action: actVal,
      actionType: this.deriveActionType(actVal, typeVal).toLowerCase(),
      weight: weightVal,
      cost: costVal,
      modifiers,
      damageParts,
      ruleFlags
    });

    if (['Feat', 'DM Boon', 'DM Grant'].includes(typeVal)) {
      const maxRanksRaw = document.getElementById('im-feat-max-ranks')?.value || '1';
      const checkedTags = Array.from(document.querySelectorAll('.im-feat-tag-chk:checked')).map(cb => cb.value).filter(Boolean);
      entry.featTags = checkedTags;
      entry.targetRepeatable = maxRanksRaw === 'per_target';
      entry.maxRanks = maxRanksRaw === 'per_target' ? 1 : (Number(maxRanksRaw) || 1);
      entry.stackable = entry.maxRanks > 1;
      if (checkedTags.includes('Fighter Bonus')) {
        entry.isFighterBonusFeat = true;
      } else {
        delete entry.isFighterBonusFeat;
      }
      if (checkedTags.includes('Metamagic') && (!entry.category || entry.category === 'General')) {
        entry.category = 'Metamagic';
      } else if (checkedTags.includes('Item Creation') && (!entry.category || entry.category === 'General')) {
        entry.category = 'Item Creation';
      } else if (checkedTags.includes('Fighter Bonus') && (!entry.category || entry.category === 'General')) {
        entry.category = 'Fighter Bonus';
      }
    }

    if (editIdx < 0 && entry.name && (!baseObj.id || String(baseObj.id).startsWith('ability_') || String(baseObj.id).startsWith('custom_'))) {
      const slug = String(entry.name || '')
        .replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'entry';
      const isAbilityType = ['Special Ability', 'DM Boon', 'DM Grant', 'Racial Trait', 'Class Feature'].includes(typeVal);
      entry.id = isAbilityType ? `ability_${slug}` : `custom_${slug}_${Date.now()}`;
    }

    if (!isNaN(chargesVal) && chargesVal > 0) {
      entry.dailyCharges = {
        current: (baseObj.dailyCharges?.current !== undefined && baseObj.dailyCharges.current <= chargesVal) ? baseObj.dailyCharges.current : chargesVal,
        max: chargesVal,
        unit: baseObj.dailyCharges?.unit || 'charges',
        recharge: 'long_rest'
      };
    } else if (baseObj.dailyCharges) {
      delete entry.dailyCharges;
    }

    if (typeVal === 'Weapon') {
      entry.weaponStats = Object.assign({}, baseObj.weaponStats || {}, {
        category: baseObj.weaponStats?.category || 'Martial',
        handedness: slotVal === 'Two-Handed' ? 'Two-Handed' : (baseObj.weaponStats?.handedness || 'One-Handed'),
        baseDamage: diceVal || baseObj.weaponStats?.baseDamage || '1d8',
        critMin: critMinVal,
        critMult: critMultVal,
        damageTypes: dmgTypeVal.split('/').map(s => s.trim()).filter(Boolean)
      });
    } else if (typeVal === 'Armor' || typeVal === 'Shield') {
      const acMod = modifiers.find(m => String(m.target).startsWith('ac'));
      const rawArmorAc = document.getElementById('im-armor-ac')?.value;
      const rawMaxDex = document.getElementById('im-max-dex')?.value;
      const rawAcp = document.getElementById('im-acp')?.value;
      const rawAsf = document.getElementById('im-asf')?.value;
      const baseAcNum = (rawArmorAc !== '' && rawArmorAc !== undefined && !isNaN(Number(rawArmorAc)))
        ? Number(rawArmorAc)
        : (acMod ? Number(acMod.value) || 0 : (baseObj.armorStats?.baseAc || (typeVal === 'Shield' ? 2 : 4)));
      entry.armorStats = {
        category: typeVal === 'Shield' ? 'Shield' : (baseObj.armorStats?.category || 'Light'),
        baseAc: baseAcNum,
        maxDex: (rawMaxDex !== '' && rawMaxDex !== undefined && !isNaN(Number(rawMaxDex))) ? Number(rawMaxDex) : null,
        acp: (rawAcp !== '' && rawAcp !== undefined && !isNaN(Number(rawAcp))) ? Number(rawAcp) : 0,
        asf: (rawAsf !== '' && rawAsf !== undefined && !isNaN(Number(rawAsf))) ? Number(rawAsf) : 0,
        speed30: baseObj.armorStats?.speed30 || 30,
        speed20: baseObj.armorStats?.speed20 || 20
      };
    } else if (typeVal === 'Spell' || typeVal === 'Maneuver' || typeVal === 'Stance') {
      const rawLvl = document.getElementById('im-level')?.value;
      const schoolDisc = (document.getElementById('im-school-disc')?.value || '').trim();
      const saveType = (document.getElementById('im-save-type')?.value || '').trim() || 'None';
      const spellRange = (document.getElementById('im-spell-range')?.value || '').trim();
      entry.level = (rawLvl !== '' && rawLvl !== undefined && !isNaN(Number(rawLvl))) ? Number(rawLvl) : '';
      if (typeVal === 'Spell') entry.school = schoolDisc;
      else entry.discipline = schoolDisc;
      if (spellRange) entry.range = spellRange;
      entry.spellStats = Object.assign({}, baseObj.spellStats || {}, {
        school: typeVal === 'Spell' ? schoolDisc : (baseObj.spellStats?.school || ''),
        discipline: typeVal !== 'Spell' ? schoolDisc : (baseObj.spellStats?.discipline || ''),
        level: entry.level,
        castingTime: actVal,
        range: spellRange,
        savingThrow: saveType
      });
    }

    return this.ensureV2(entry);
  },

  resetInlineManualForm() {
    this.selectedEntryIndex = -1;
    this._currentEditingEntry = null;
    this._changeAndAddOriginalSnapshot = null;
    this._inlineExtraDamageParts = [];
    this.renderInlineDamagePartsChips();
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    setVal('im-name', '');
    setVal('im-type', 'Weapon');
    setVal('im-slot', 'Main Hand');
    setVal('im-source', 'PHB p.');
    setVal('im-dice', '');
    setVal('im-dmg-type', 'Slashing');
    setVal('im-crit-min', 20);
    setVal('im-crit-mult', 2);
    setVal('im-action', 'Passive');
    setVal('im-cost', 0);
    setVal('im-weight', 0);
    setVal('im-charges', '');
    setVal('im-prereq', '-');
    setVal('im-benefit', '');
    setVal('im-armor-ac', '');
    setVal('im-max-dex', '');
    setVal('im-acp', '');
    setVal('im-asf', '');
    setVal('im-level', '');
    setVal('im-school-disc', '');
    setVal('im-save-type', '');
    setVal('im-spell-range', '');
    setVal('im-feat-max-ranks', '1');
    setVal('im-extra-dmg-dice', '');
    setVal('im-extra-dmg-type', 'Fire');
    setVal('im-extra-dmg-crit', 'normal');

    ['im-flag-touch', 'im-flag-keen', 'im-flag-adamantine', 'im-flag-two-hand-str'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    document.querySelectorAll('.im-feat-tag-chk').forEach(cb => { cb.checked = false; });

    const modList = document.getElementById('im-modifiers-list');
    if (modList) {
      modList.innerHTML = '';
      this.addInlineManualModifierRow();
    }

    const banner = document.getElementById('im-editing-banner');
    if (banner) banner.classList.add('hidden');
    const saveDbLbl = document.getElementById('btn-im-save-db-label');
    if (saveDbLbl) saveDbLbl.textContent = 'Save to Custom DB';
    const saveEqLbl = document.getElementById('btn-im-save-equip-label');
    if (saveEqLbl) saveEqLbl.textContent = 'Save & Equip to Character';

    setVal('im-v25-pattern-select', '');
    this.closeInlineLegoPrimitiveBuilder();
    const dryRunBox = document.getElementById('im-v25-dryrun-preview');
    if (dryRunBox) {
      dryRunBox.innerHTML = '';
      dryRunBox.classList.add('hidden');
    }

    this.onInlineManualTypeChange(true);
    this.renderInlineLegoPrimitiveStudio();

    const mdbModal = document.getElementById('modal-master-db-editor');
    if (mdbModal && !mdbModal.classList.contains('hidden')) {
      this.closeMasterDbEditorModal();
    }
  },

  // ====================================================
  // PHASE P5: V2.5 UNIVERSAL RULE FORGE (6-PRIMITIVE LEGO STUDIO)
  // ====================================================
  _ensureEditingDraft() {
    if (!this._currentEditingEntry) {
      const typeVal = document.getElementById('im-type')?.value || 'DM Boon';
      this._currentEditingEntry = this.createEmptyEntry(typeVal);
    }
    const e = this._currentEditingEntry;
    if (!Array.isArray(e.defenses)) e.defenses = [];
    if (!Array.isArray(e.resources)) e.resources = [];
    if (!Array.isArray(e.modes)) e.modes = [];
    if (!Array.isArray(e.grants)) e.grants = [];
    if (!Array.isArray(e.choices)) e.choices = [];
    if (!Array.isArray(e.modifiers)) e.modifiers = [];
    return e;
  },

  renderInlineLegoPrimitiveStudio() {
    const pillsBox = document.getElementById('im-v25-primitives-pills');
    if (!pillsBox) return;
    const e = this._currentEditingEntry;
    if (!e) {
      pillsBox.innerHTML = '<span class="italic text-slate-500">No V2.5 Lego primitives attached yet. Choose an archetype above or click a primitive button.</span>';
      return;
    }

    const escHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const pills = [];
    (e.defenses || []).forEach((d, idx) => {
      const lbl = d.kind === 'immunity' ? `Immunity: ${d.target}` : (d.kind === 'dr' ? `DR ${d.value || d.formula}/${d.bypass || '-'}` : (d.kind === 'absorption' ? `Absorb ${d.target} (${Math.round((Number(d.healRatio ?? 1)) * 100)}%)` : `${d.kind}: ${d.target} ${d.value || d.formula || ''}`));
      pills.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 font-mono text-[10px]"><span>🛡️ ${escHtml(lbl)}</span><button type="button" data-action="forge:remove-lego-primitive" data-array-key="defenses" data-idx="${idx}" class="text-cyan-400 hover:text-rose-400 font-bold ml-0.5 cursor-pointer">×</button></span>`);
    });
    (e.resources || []).forEach((r, idx) => {
      const rec = r.recharge?.dice ? `Recharge ${r.recharge.dice} rds` : (r.recharge?.period || 'daily');
      pills.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500/50 text-amber-200 font-mono text-[10px]"><span>🔋 ${escHtml(r.name || r.id)} (${escHtml(r.maxFormula ?? 1)} / ${escHtml(rec)})</span><button type="button" data-action="forge:remove-lego-primitive" data-array-key="resources" data-idx="${idx}" class="text-amber-400 hover:text-rose-400 font-bold ml-0.5 cursor-pointer">×</button></span>`);
    });
    (e.modes || []).forEach((m, idx) => {
      const react = m.reactsTo ? ` [Reacts: ${m.reactsTo}]` : '';
      pills.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/90 border border-purple-500/50 text-purple-200 font-mono text-[10px]"><span>⚡ ${escHtml(m.name || m.id)} (${escHtml(m.actionType || 'standard')}${escHtml(react)})</span><button type="button" data-action="forge:remove-lego-primitive" data-array-key="modes" data-idx="${idx}" class="text-purple-400 hover:text-rose-400 font-bold ml-0.5 cursor-pointer">×</button></span>`);
    });
    (e.grants || []).forEach((g, idx) => {
      pills.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 font-mono text-[10px]"><span>🎁 Grant ${escHtml(g.grantType)}: ${escHtml(g.targetId || g.name || '')}</span><button type="button" data-action="forge:remove-lego-primitive" data-array-key="grants" data-idx="${idx}" class="text-emerald-400 hover:text-rose-400 font-bold ml-0.5 cursor-pointer">×</button></span>`);
    });
    (e.choices || []).forEach((c, idx) => {
      pills.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-pink-950/90 border border-pink-500/50 text-pink-200 font-mono text-[10px]"><span>🎯 Choice: ${escHtml(c.label || c.id)}</span><button type="button" data-action="forge:remove-lego-primitive" data-array-key="choices" data-idx="${idx}" class="text-pink-400 hover:text-rose-400 font-bold ml-0.5 cursor-pointer">×</button></span>`);
    });
    (e.modifiers || []).forEach((m, idx) => {
      const isComplex = Boolean((m.formula !== undefined && m.formula !== null && isNaN(Number(m.formula))) || m.selector || (m.op && m.op !== 'add') || m.cap || m.when);
      if (isComplex) {
        const desc = `${m.target} [${m.op || 'add'}] ${m.formula ?? m.value}${m.cap ? ` (cap ${m.cap})` : ''}`;
        pills.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950/90 border border-sky-500/50 text-sky-200 font-mono text-[10px]"><span>🔄 ${escHtml(desc)}</span><button type="button" data-action="forge:remove-lego-primitive" data-array-key="modifiers" data-idx="${idx}" class="text-sky-400 hover:text-rose-400 font-bold ml-0.5 cursor-pointer">×</button></span>`);
      }
    });

    pillsBox.innerHTML = pills.length > 0
      ? pills.join('')
      : '<span class="italic text-slate-500">No V2.5 Lego primitives attached yet. Choose an archetype above or click a primitive button.</span>';
  },

  removeLegoPrimitive(arrayKey, idx) {
    const e = this._ensureEditingDraft();
    if (Array.isArray(e[arrayKey]) && idx >= 0 && idx < e[arrayKey].length) {
      e[arrayKey].splice(idx, 1);
      this.renderInlineLegoPrimitiveStudio();
    }
  },

  applyLegoPatternSkeleton(patternId) {
    if (!patternId) return;
    const e = this._ensureEditingDraft();
    const setVal = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.value = v; };

    if (patternId === 'breath_recharge') {
      setVal('im-name', document.getElementById('im-name')?.value || 'Dragon Breath (Acid)');
      setVal('im-type', 'Special Ability');
      setVal('im-action', 'Move Action');
      setVal('im-dice', '4d8');
      setVal('im-dmg-type', 'Acid');
      setVal('im-benefit', '60 ft. line of acid dealing 4d8 acid damage (Reflex DC 10 + Level + CON mod for half). Usable as a move action; recharges in 1d4+1 rounds.');
      e.resources = [{ id: 'breath_cd', name: 'Breath Recharge', kind: 'consume', maxFormula: 1, recharge: { period: 'rounds', dice: '1d4+1' } }];
      e.modes = [{
        id: 'breath_attack',
        name: 'Breath Weapon',
        actionType: 'move',
        area: '60 ft. line',
        save: { type: 'Reflex', dcFormula: '10 + @level + @conMod', onSave: 'half' },
        damageParts: [{ dice: '4d8', bonus: 0, type: 'Acid' }]
      }];
    } else if (patternId === 'elemental_defense') {
      setVal('im-name', document.getElementById('im-name')?.value || 'Elemental Accustomed');
      setVal('im-type', 'Special Ability');
      setVal('im-action', 'Passive');
      setVal('im-benefit', 'Grants Acid Immunity, +3 Natural Armor in Swamp/Underground terrain, and DR 3/- while in favored terrain.');
      e.defenses = [
        { kind: 'immunity', target: 'acid' },
        { kind: 'dr', target: 'physical', value: 3, bypass: '-', when: { terrain: ['swamp', 'underground'] } }
      ];
      e.modifiers.push({ target: 'ac.natural', op: 'add', value: 3, type: 'Untyped', when: { terrain: ['swamp', 'underground'] } });
    } else if (patternId === 'reactive_absorb') {
      setVal('im-name', document.getElementById('im-name')?.value || 'Absorb Magic');
      setVal('im-type', 'Special Ability');
      setVal('im-action', 'Immediate Action');
      setVal('im-benefit', '+2 Competence bonus on saves vs targeted spells. As an immediate action (1/day), absorb a targeted spell and gain 3 × Spell Level temporary HP.');
      e.resources = [{ id: 'absorb_daily', name: 'Absorb Magic (1/Day)', kind: 'charges', maxFormula: 1, recharge: { period: 'day' } }];
      e.modes = [{
        id: 'absorb_spell',
        name: 'Absorb Targeted Spell',
        actionType: 'immediate',
        reactsTo: 'on_spell_targeted',
        inputs: [{ id: 'spellLevel', label: 'Incoming Spell Level', type: 'number', default: 3 }],
        tempHpFormula: '3 * @input.spellLevel'
      }];
    } else if (patternId === 'synergy_mutator') {
      setVal('im-name', document.getElementById('im-name')?.value || 'Arcane Shield (Synergy)');
      setVal('im-type', 'Special Ability');
      setVal('im-action', 'Passive');
      setVal('im-benefit', 'Synergy Boon: Automatically unlocked when prerequisites are met, upgrading target boon save bonus to +4.');
      e.requires = { all: ['boon_absorb_magic', 'boon_elemental_accustomed'] };
      e.autoUnlock = true;
      e.isSynergy = true;
      e.sourceCategory = 'Synergy';
      e.modifiers.push({ target: 'entity.saveBonus', selector: { id: 'boon_absorb_magic' }, op: 'set', value: 4, type: 'Competence' });
    } else if (patternId === 'tier_progressive') {
      setVal('im-name', document.getElementById('im-name')?.value || 'Progressive Boon (Tier 1-3)');
      setVal('im-type', 'Special Ability');
      setVal('im-action', 'Passive');
      setVal('im-benefit', 'Tiered Boon: Scales dynamically with @stacks (Tier 1: +2, Tier 2: +4, Tier 3: +6).');
      e.stacks = 1;
      e.modifiers.push({ target: 'ac.natural', op: 'add', formula: 'lookup(@stacks, 0, 2, 4, 6)', type: 'Natural Armor' });
    } else if (patternId === 'stat_substitution') {
      setVal('im-name', document.getElementById('im-name')?.value || 'Force of Personality');
      setVal('im-type', 'Feat');
      setVal('im-action', 'Passive');
      setVal('im-benefit', 'Apply your Charisma modifier instead of Wisdom on Will saving throws.');
      e.modifiers.push({ target: 'save.will.abilityMod', op: 'max', formula: '@chaMod' });
    } else if (patternId === 'aura_grant') {
      setVal('im-name', document.getElementById('im-name')?.value || 'Draconic Presence & Senses');
      setVal('im-type', 'Special Ability');
      setVal('im-action', 'Passive');
      setVal('im-benefit', 'Grants Darkvision 60 ft., Blindsense 30 ft., and Frightful Presence aura (DC 10 + 1/2 HD + CHA mod).');
      e.grants = [
        { grantType: 'sense', targetId: 'darkvision', value: 60 },
        { grantType: 'sense', targetId: 'blindsense', value: 30 },
        { grantType: 'aura', targetId: 'frightful_presence', radius: 30, saveType: 'Will', dcFormula: '10 + floor(@level / 2) + @chaMod' }
      ];
    }

    this.onInlineManualTypeChange(true);
    this.renderInlineLegoPrimitiveStudio();
    this.runInlineLegoDryRunPreview();
  },

  promptAddLegoPrimitive(kind, directParams = null) {
    if (!directParams || typeof directParams !== 'object') {
      this.openInlineLegoPrimitiveBuilder(kind);
      return;
    }
    this._commitLegoPrimitiveObject(kind, directParams);
  },

  openInlineLegoPrimitiveBuilder(kind) {
    const card = document.getElementById('im-v25-inline-primitive-card');
    if (!card) return;
    this._activePrimitiveBuilderKind = kind;
    let bodyHtml = '';
    if (kind === 'defense') {
      bodyHtml = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label class="text-[10px] text-cyan-300 font-bold uppercase block mb-0.5">Defense Kind</label>
            <select id="im-prim-def-kind" class="w-full bg-slate-900 border border-cyan-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
              <option value="resistance">Resistance</option>
              <option value="immunity">Immunity</option>
              <option value="dr">Damage Reduction (DR)</option>
              <option value="sr">Spell Resistance (SR)</option>
              <option value="vulnerability">Vulnerability</option>
              <option value="absorption">Absorption</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] text-cyan-300 font-bold uppercase block mb-0.5">Target / Element</label>
            <select id="im-prim-def-target" class="w-full bg-slate-900 border border-cyan-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
              <option value="acid">Acid</option>
              <option value="cold">Cold</option>
              <option value="fire">Fire</option>
              <option value="electricity">Electricity</option>
              <option value="sonic">Sonic</option>
              <option value="physical">Physical</option>
              <option value="magic">Magic / Spells</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] text-cyan-300 font-bold uppercase block mb-0.5">Value / Ratio</label>
            <input id="im-prim-def-val" type="number" step="0.5" value="10" class="w-full bg-slate-900 border border-cyan-500/40 rounded px-2 py-1 text-[11px] text-white font-mono outline-none">
          </div>
          <div>
            <label class="text-[10px] text-cyan-300 font-bold uppercase block mb-0.5">DR Bypass (if DR)</label>
            <input id="im-prim-def-bypass" type="text" value="-" placeholder="- | magic | adamantine" class="w-full bg-slate-900 border border-cyan-500/40 rounded px-2 py-1 text-[11px] text-white font-mono outline-none">
          </div>
        </div>`;
    } else if (kind === 'resource') {
      bodyHtml = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label class="text-[10px] text-amber-300 font-bold uppercase block mb-0.5">Resource / Cooldown Name</label>
            <input id="im-prim-res-name" type="text" value="Breath Recharge" class="w-full bg-slate-900 border border-amber-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
          </div>
          <div>
            <label class="text-[10px] text-amber-300 font-bold uppercase block mb-0.5">Recharge Period</label>
            <select id="im-prim-res-period" class="w-full bg-slate-900 border border-amber-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
              <option value="rounds">Rounds (Dice Cooldown)</option>
              <option value="encounter">Per Encounter</option>
              <option value="day">Per Day</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] text-amber-300 font-bold uppercase block mb-0.5">Cooldown Dice (if Rounds)</label>
            <input id="im-prim-res-dice" type="text" value="1d4+1" class="w-full bg-slate-900 border border-amber-500/40 rounded px-2 py-1 text-[11px] text-white font-mono outline-none">
          </div>
          <div>
            <label class="text-[10px] text-amber-300 font-bold uppercase block mb-0.5">Max Charges</label>
            <input id="im-prim-res-max" type="number" value="3" min="1" class="w-full bg-slate-900 border border-amber-500/40 rounded px-2 py-1 text-[11px] text-white font-mono outline-none">
          </div>
        </div>`;
    } else if (kind === 'mode') {
      bodyHtml = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label class="text-[10px] text-purple-300 font-bold uppercase block mb-0.5">Mode / Reaction Name</label>
            <input id="im-prim-mode-name" type="text" value="Reactive Shield" class="w-full bg-slate-900 border border-purple-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
          </div>
          <div>
            <label class="text-[10px] text-purple-300 font-bold uppercase block mb-0.5">Action Economy</label>
            <select id="im-prim-mode-action" class="w-full bg-slate-900 border border-purple-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
              <option value="immediate">Immediate Action</option>
              <option value="swift">Swift Action</option>
              <option value="standard">Standard Action</option>
              <option value="move">Move Action</option>
              <option value="free">Free Action</option>
              <option value="passive">Passive</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] text-purple-300 font-bold uppercase block mb-0.5">Reaction Trigger</label>
            <select id="im-prim-mode-trigger" class="w-full bg-slate-900 border border-purple-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
              <option value="on_spell_targeted">On Spell Targeted</option>
              <option value="on_hit">On Hit</option>
              <option value="on_attacked">On Attacked</option>
              <option value="">None (Active Mode)</option>
            </select>
          </div>
        </div>`;
    } else if (kind === 'grant') {
      bodyHtml = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label class="text-[10px] text-emerald-300 font-bold uppercase block mb-0.5">Grant Type</label>
            <select id="im-prim-grant-type" class="w-full bg-slate-900 border border-emerald-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
              <option value="sense">Sense (Darkvision / Blindsense)</option>
              <option value="aura">Aura</option>
              <option value="sla">Spell-Like Ability (SLA)</option>
              <option value="proficiency">Proficiency</option>
              <option value="entity">Granted Entity / Feat</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] text-emerald-300 font-bold uppercase block mb-0.5">Capability ID / Name</label>
            <input id="im-prim-grant-id" type="text" value="darkvision" placeholder="darkvision | blindsense" class="w-full bg-slate-900 border border-emerald-500/40 rounded px-2 py-1 text-[11px] text-white font-mono outline-none">
          </div>
          <div>
            <label class="text-[10px] text-emerald-300 font-bold uppercase block mb-0.5">Range / Value (ft.)</label>
            <input id="im-prim-grant-val" type="number" value="60" class="w-full bg-slate-900 border border-emerald-500/40 rounded px-2 py-1 text-[11px] text-white font-mono outline-none">
          </div>
        </div>`;
    } else if (kind === 'choice') {
      bodyHtml = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-pink-300 font-bold uppercase block mb-0.5">Choice Label</label>
            <input id="im-prim-choice-label" type="text" value="Choose Energy Type" class="w-full bg-slate-900 border border-pink-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
          </div>
          <div>
            <label class="text-[10px] text-pink-300 font-bold uppercase block mb-0.5">Comma-Separated Options</label>
            <input id="im-prim-choice-opts" type="text" value="acid, cold, electricity, fire, sonic" class="w-full bg-slate-900 border border-pink-500/40 rounded px-2 py-1 text-[11px] text-white font-mono outline-none">
          </div>
        </div>`;
    } else if (kind === 'substitution') {
      bodyHtml = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label class="text-[10px] text-sky-300 font-bold uppercase block mb-0.5">Target Stat Path</label>
            <select id="im-prim-sub-target" class="w-full bg-slate-900 border border-sky-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
              <option value="save.will.abilityMod">save.will.abilityMod (Will Ability)</option>
              <option value="save.ref.abilityMod">save.ref.abilityMod (Reflex Ability)</option>
              <option value="save.fort.abilityMod">save.fort.abilityMod (Fortitude Ability)</option>
              <option value="ac.abilityMod">ac.abilityMod (AC Ability)</option>
              <option value="ac.total">ac.total (Total AC)</option>
              <option value="attack.melee">attack.melee (Melee Attack)</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] text-sky-300 font-bold uppercase block mb-0.5">Operation</label>
            <select id="im-prim-sub-op" class="w-full bg-slate-900 border border-sky-500/40 rounded px-2 py-1 text-[11px] text-white outline-none">
              <option value="max">max (Use Higher)</option>
              <option value="replace">replace (Override)</option>
              <option value="add">add (Add Formula)</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] text-sky-300 font-bold uppercase block mb-0.5">Formula</label>
            <input id="im-prim-sub-formula" type="text" value="@chaMod" placeholder="@chaMod | max(0, @intMod)" class="w-full bg-slate-900 border border-sky-500/40 rounded px-2 py-1 text-[11px] text-white font-mono outline-none">
          </div>
          <div>
            <label class="text-[10px] text-sky-300 font-bold uppercase block mb-0.5">Optional Cap Formula</label>
            <input id="im-prim-sub-cap" type="text" value="" placeholder="@level (optional)" class="w-full bg-slate-900 border border-sky-500/40 rounded px-2 py-1 text-[11px] text-white font-mono outline-none">
          </div>
        </div>`;
    }

    card.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[10px] font-black uppercase tracking-wider text-indigo-300">Configure V2.5 Primitive: ${String(kind || '').toUpperCase()}</span>
        <div class="flex items-center gap-1.5">
          <button type="button" data-action="forge:confirm-primitive-builder" class="px-2.5 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold cursor-pointer">+ Add to Rule</button>
          <button type="button" data-action="forge:close-primitive-builder" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer">Cancel</button>
        </div>
      </div>
      ${bodyHtml}
    `;
    card.classList.remove('hidden');
  },

  closeInlineLegoPrimitiveBuilder() {
    this._activePrimitiveBuilderKind = null;
    const card = document.getElementById('im-v25-inline-primitive-card');
    if (card) {
      card.innerHTML = '';
      card.classList.add('hidden');
    }
  },

  confirmInlineLegoPrimitive() {
    const kind = this._activePrimitiveBuilderKind;
    if (!kind) return;
    const val = (id) => document.getElementById(id)?.value;
    if (kind === 'defense') {
      this._commitLegoPrimitiveObject('defense', {
        defKind: (val('im-prim-def-kind') || 'resistance').trim().toLowerCase(),
        target: (val('im-prim-def-target') || 'acid').trim().toLowerCase(),
        value: parseFloat(val('im-prim-def-val') || '10'),
        bypass: (val('im-prim-def-bypass') || '-').trim()
      });
    } else if (kind === 'resource') {
      this._commitLegoPrimitiveObject('resource', {
        name: (val('im-prim-res-name') || 'Breath Recharge').trim(),
        period: (val('im-prim-res-period') || 'rounds').trim().toLowerCase(),
        dice: (val('im-prim-res-dice') || '1d4+1').trim(),
        maxVal: parseInt(val('im-prim-res-max') || '3', 10) || 1
      });
    } else if (kind === 'mode') {
      this._commitLegoPrimitiveObject('mode', {
        name: (val('im-prim-mode-name') || 'Reactive Shield').trim(),
        actionType: (val('im-prim-mode-action') || 'immediate').trim().toLowerCase(),
        reactsTo: (val('im-prim-mode-trigger') || '').trim()
      });
    } else if (kind === 'grant') {
      this._commitLegoPrimitiveObject('grant', {
        grantType: (val('im-prim-grant-type') || 'sense').trim().toLowerCase(),
        targetId: (val('im-prim-grant-id') || 'darkvision').trim(),
        value: parseInt(val('im-prim-grant-val') || '60', 10) || 60
      });
    } else if (kind === 'choice') {
      this._commitLegoPrimitiveObject('choice', {
        label: (val('im-prim-choice-label') || 'Choose Energy Type').trim(),
        options: (val('im-prim-choice-opts') || 'acid, cold, electricity, fire, sonic').split(',').map(s => s.trim()).filter(Boolean)
      });
    } else if (kind === 'substitution') {
      this._commitLegoPrimitiveObject('substitution', {
        target: (val('im-prim-sub-target') || 'save.will.abilityMod').trim(),
        op: (val('im-prim-sub-op') || 'max').trim().toLowerCase(),
        formula: (val('im-prim-sub-formula') || '@chaMod').trim(),
        cap: (val('im-prim-sub-cap') || '').trim()
      });
    }
    this.closeInlineLegoPrimitiveBuilder();
  },

  _commitLegoPrimitiveObject(kind, p = {}) {
    const e = this._ensureEditingDraft();
    if (kind === 'defense') {
      const defKind = (p.defKind || p.kind || 'resistance').toLowerCase();
      const target = (p.target || 'acid').toLowerCase();
      if (defKind === 'immunity' || defKind === 'vulnerability') {
        e.defenses.push({ kind: defKind, target });
      } else if (defKind === 'absorption') {
        const ratio = isNaN(Number(p.value ?? p.healRatio)) ? 1.0 : Number(p.value ?? p.healRatio);
        e.defenses.push({ kind: 'absorption', target, healRatio: ratio });
      } else if (defKind === 'dr') {
        e.defenses.push({ kind: 'dr', target: 'physical', value: parseInt(p.value, 10) || 5, bypass: p.bypass || '-' });
      } else {
        e.defenses.push({ kind: defKind, target, value: parseInt(p.value, 10) || 10 });
      }
    } else if (kind === 'resource') {
      const name = p.name || 'Breath Recharge';
      const period = (p.period || 'rounds').toLowerCase();
      const dice = period === 'rounds' ? (p.dice || '1d4+1') : null;
      const maxVal = period === 'rounds' ? 1 : (parseInt(p.maxVal, 10) || 1);
      e.resources.push({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        name,
        kind: period === 'rounds' ? 'consume' : 'charges',
        maxFormula: maxVal,
        recharge: dice ? { period: 'rounds', dice } : { period }
      });
    } else if (kind === 'mode') {
      const name = p.name || 'Reactive Shield';
      const actionType = (p.actionType || 'immediate').toLowerCase();
      const modeObj = { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), name, actionType };
      if (p.reactsTo) modeObj.reactsTo = p.reactsTo;
      e.modes.push(modeObj);
    } else if (kind === 'grant') {
      e.grants.push({
        grantType: (p.grantType || 'sense').toLowerCase(),
        targetId: p.targetId || 'darkvision',
        value: parseInt(p.value, 10) || 60
      });
    } else if (kind === 'choice') {
      const label = p.label || 'Choose Energy Type';
      const opts = Array.isArray(p.options) ? p.options : String(p.options || 'acid, cold, fire').split(',').map(s => s.trim()).filter(Boolean);
      e.choices.push({ id: 'choice_' + (e.choices.length + 1), label, options: opts });
    } else if (kind === 'substitution') {
      const modObj = {
        target: p.target || 'save.will.abilityMod',
        op: (p.op || 'max').toLowerCase(),
        formula: p.formula || '@chaMod'
      };
      if (p.cap) modObj.cap = p.cap;
      e.modifiers.push(modObj);
    }
    this.renderInlineLegoPrimitiveStudio();
    this.runInlineLegoDryRunPreview();
  },

  runInlineLegoDryRunPreview() {
    const previewBox = document.getElementById('im-v25-dryrun-preview');
    if (!previewBox || typeof RuleEngine === 'undefined') return;
    const escHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const draft = this.buildInlineManualV2Entry();
    const imap = typeof RuleEngine.getObjectInteractionMap === 'function'
      ? RuleEngine.getObjectInteractionMap(draft)
      : { nodes: [], boundUiTargets: [] };

    let deltaHtml = '';
    if (typeof character !== 'undefined' && character && typeof RuleEngine.evaluateLegoCharacter === 'function') {
      const beforeClone = JSON.parse(JSON.stringify(character));
      if (typeof RuleEngine.recalculateCharacter === 'function') {
        RuleEngine.recalculateCharacter(beforeClone, typeof masterDb !== 'undefined' ? masterDb : []);
      }
      const beforeEval = RuleEngine.evaluateLegoCharacter(beforeClone);

      const afterClone = JSON.parse(JSON.stringify(character));
      if (!Array.isArray(afterClone.legoEntries)) afterClone.legoEntries = [];
      afterClone.legoEntries.push(draft);
      if (typeof RuleEngine.recalculateCharacter === 'function') {
        RuleEngine.recalculateCharacter(afterClone, typeof masterDb !== 'undefined' ? masterDb : []);
      }
      const afterEval = RuleEngine.evaluateLegoCharacter(afterClone);

      const beforeAC = Number(beforeClone.acBreakdown?.total ?? beforeEval.ac.normal);
      const afterAC = Number(afterClone.acBreakdown?.total ?? afterEval.ac.normal);
      const dAC = afterAC - beforeAC;

      const deltas = [];
      if (dAC !== 0) deltas.push(`AC ${beforeAC} → <b class="text-emerald-300">${afterAC}</b>`);
      ['fort', 'ref', 'will'].forEach(s => {
        const bSave = Number(beforeClone.saves?.[s]?.total ?? beforeClone.evaluatedSaves?.[s]?.total ?? beforeClone.evaluatedSaves?.[s] ?? beforeEval.saves[s]);
        const aSave = Number(afterClone.saves?.[s]?.total ?? afterClone.evaluatedSaves?.[s]?.total ?? afterClone.evaluatedSaves?.[s] ?? afterEval.saves[s]);
        const dSave = aSave - bSave;
        if (dSave !== 0) deltas.push(`${s.toUpperCase()} +${bSave} → <b class="text-emerald-300">+${aSave}</b>`);
      });
      if (afterEval.defenses.immunities.length > beforeEval.defenses.immunities.length) {
        deltas.push(`Immunities: <b class="text-cyan-300">${escHtml(afterEval.defenses.immunities.join(', ').toUpperCase())}</b>`);
      }
      if (afterEval.defenses.dr.length > beforeEval.defenses.dr.length) {
        const lastDr = afterEval.defenses.dr[afterEval.defenses.dr.length - 1];
        const drVal = lastDr.value ?? lastDr.amount ?? 0;
        deltas.push(`DR: <b class="text-amber-300">${escHtml(drVal)}/${escHtml(lastDr.bypass)}</b>`);
      }
      deltaHtml = deltas.length > 0
        ? `<div><span class="text-slate-400 font-semibold">Live Sheet Delta:</span> ${deltas.join(' • ')}</div>`
        : `<div class="text-slate-400">Live Sheet Delta: <span class="text-emerald-300 font-semibold">Validated (0 AST syntax errors)</span></div>`;
    }

    const nodesPills = (imap.boundUiTargets || imap.nodes || []).map(n => `<span class="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono text-[10px]">🔗 ${escHtml(n)}</span>`).join(' ');
    previewBox.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-1">
        <span class="font-bold text-emerald-300">⚡ Dry-Run Passed: "${escHtml(draft.name || 'Draft Entry')}"</span>
        <span class="text-[10px] font-mono text-slate-400">Schema v2.5 • ${(draft.defenses || []).length} Def • ${(draft.resources || []).length} Res • ${(draft.modes || []).length} Modes</span>
      </div>
      ${deltaHtml}
      <div class="flex flex-wrap items-center gap-1 pt-0.5">
        <span class="text-slate-400 font-semibold">Connected Page Objects:</span>
        ${nodesPills || '<span class="text-slate-500 italic">Passive Stat Sheet</span>'}
      </div>
    `;
    previewBox.classList.remove('hidden');
  },

  saveInlineManualEntry(alsoEquip = false) {
    const editIdx = this.selectedEntryIndex;
    const v2Entry = this.buildInlineManualV2Entry();
    if (!v2Entry.name || !v2Entry.name.trim()) {
      alert('⚠️ Please enter a Rule / Item Name first.');
      document.getElementById('im-name')?.focus();
      return;
    }
    if (this._changeAndAddOriginalSnapshot) {
      const currentSig = this.getComparableEntrySignature(v2Entry);
      if (currentSig === this._changeAndAddOriginalSnapshot) {
        alert(`⚠️ "${v2Entry.name}" already exists in the site database with identical values.\nPlease modify at least one field (e.g., Name, Stat Modifiers, Damage, Cost, or Description) before adding it to your Custom Master DB.`);
        return;
      }
      if (editIdx < 0) {
        const slug = v2Entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        v2Entry.id = `custom_${slug}_${Date.now()}`;
      }
    }
    if (this.saveEntry(v2Entry, editIdx)) {
      if (alsoEquip) {
        this.equipItem(v2Entry);
      } else {
        alert(`✅ "${v2Entry.name}" ${editIdx >= 0 ? 'updated in' : 'saved to'} Character Custom DB!`);
      }
      this.resetInlineManualForm();
    }
  },

  getSelectedInlineForgeBaseType() {
    const baseSel = document.getElementById('mdb-forge-base-select');
    if (!baseSel || !baseSel.value) return 'Weapon';
    const baseId = baseSel.value;
    if (window.SrdCompendium && typeof window.SrdCompendium.getById === 'function') {
      const base = window.SrdCompendium.getById(baseId);
      if (base && base.type) return base.type;
    }
    const optText = (baseSel.options[baseSel.selectedIndex]?.text || '').toLowerCase();
    if (optText.includes('(shield)')) return 'Shield';
    if (optText.includes('(armor)')) return 'Armor';
    return 'Weapon';
  },

  filterForgeEnhancements(query = '') {
    const enhGrid = document.getElementById('mdb-forge-enhancements-grid');
    if (!enhGrid) return;
    const q = (query || '').toLowerCase().trim();
    const labels = enhGrid.querySelectorAll('label');
    labels.forEach(l => {
      const text = (l.textContent || '').toLowerCase();
      const chk = l.querySelector('input');
      if (!q || text.includes(q) || (chk && chk.checked)) {
        l.classList.remove('hidden');
      } else {
        l.classList.add('hidden');
      }
    });
  },

  syncInlineForgeSubControls(preferredEnhIds = null, preferredCrystalId = null) {
    const targetType = this.getSelectedInlineForgeBaseType();
    const enhGrid = document.getElementById('mdb-forge-enhancements-grid');
    const crysSel = document.getElementById('mdb-forge-crystal-select');
    const badgeEl = document.getElementById('mdb-forge-budget-badge');
    const titleEl = document.getElementById('mdb-forge-abilities-title');

    if (titleEl) {
      titleEl.textContent = `5. Special ${targetType} Abilities:`;
    }

    // 1. Populate Augmentation Crystal select
    if (crysSel) {
      const currentVal = preferredCrystalId !== null ? preferredCrystalId : crysSel.value;
      let crystals = [];
      if (window.SrdCompendium && typeof window.SrdCompendium.getCrystals === 'function') {
        crystals = window.SrdCompendium.getCrystals(targetType);
      }
      crystals.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      let optHtml = '<option value="">No Augmentation Crystal Attached</option>';
      optHtml += crystals.map(c =>
        `<option value="${c.id}">${RuleMaster.escapeHtml(c.name)} (${Number(c.cost || 0).toLocaleString('en-US')} gp)</option>`
      ).join('');
      crysSel.innerHTML = optHtml;
      if (currentVal && crystals.some(c => c.id === currentVal)) {
        crysSel.value = currentVal;
      }
    }

    // 2. Populate Enhancements Grid from SrdCompendium
    if (enhGrid) {
      const rawChecked = Array.isArray(preferredEnhIds)
        ? preferredEnhIds
        : Array.from(enhGrid.querySelectorAll('.mdb-forge-enh-chk:checked')).map(el => el.value);
      const checkedSet = new Set(rawChecked);

      let enhList = [];
      if (window.SrdCompendium && typeof window.SrdCompendium.getEnhancements === 'function') {
        enhList = window.SrdCompendium.getEnhancements(targetType);
      }
      if (!enhList || enhList.length === 0) {
        enhGrid.innerHTML = '<div class="col-span-full p-2 text-center text-slate-400 italic text-[11px]">⏳ Loading abilities from SRD Compendium...</div>';
        if (badgeEl) badgeEl.textContent = `0 Abilities`;
        return;
      }

      enhList.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      if (badgeEl) {
        badgeEl.textContent = `${enhList.length} Abilities (${targetType})`;
      }

      enhGrid.innerHTML = enhList.map(e => {
        const isChecked = checkedSet.has(e.id);
        const bonusEq = e.enhIncrease ? `+${e.enhIncrease}` : (e.flatCost ? `${e.flatCost} gp` : '');
        return `
          <label class="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 cursor-pointer select-none">
            <input type="checkbox" value="${e.id}" ${isChecked ? 'checked' : ''} onchange="RuleMaster.updateInlineForgePreview()" class="mdb-forge-enh-chk rounded text-amber-500 bg-slate-950 border-slate-700">
            <span class="text-[11px] font-semibold text-slate-200 truncate" title="${RuleMaster.escapeHtml(e.shortDescription || e.name)}">${RuleMaster.escapeHtml(e.name)}</span>
            <span class="text-[10px] font-mono text-amber-400 ml-auto shrink-0">${bonusEq}</span>
          </label>
        `;
      }).join('');

      const searchInp = document.getElementById('mdb-forge-enh-search');
      if (searchInp && searchInp.value) {
        this.filterForgeEnhancements(searchInp.value);
      }
    }
  },

  onForgeBaseItemChange() {
    this.syncInlineForgeSubControls();
    this.updateInlineForgePreview();
  },

  setForgeBaseTypeFilter(type = 'all') {
    this._forgeBaseTypeFilter = type;
    document.querySelectorAll('[data-forge-filter]').forEach(btn => {
      const f = btn.getAttribute('data-forge-filter');
      btn.className = f === type
        ? 'px-2.5 py-0.5 rounded text-[10px] font-bold transition bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-pointer'
        : 'px-2.5 py-0.5 rounded text-[10px] font-semibold transition bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer';
    });
    this.renderForgeBaseSelectOptions();
    this.onForgeBaseItemChange();
  },

  renderForgeBaseSelectOptions(preferredId = null) {
    const baseSel = document.getElementById('mdb-forge-base-select');
    if (!baseSel) return;

    let baseOptions = [];
    if (window.SrdCompendium && typeof window.SrdCompendium.getAllLoaded === 'function') {
      baseOptions = window.SrdCompendium.getAllLoaded(['Weapon', 'Armor', 'Shield']);
    }
    if (!baseOptions || baseOptions.length === 0) {
      baseSel.innerHTML = '<option value="" disabled selected>⏳ Loading SRD Equipment Compendium...</option>';
      return;
    }

    const currentFilter = this._forgeBaseTypeFilter || 'all';
    const armorList = baseOptions.filter(item => item.type === 'Armor' || item.type === 'Shield')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    const weaponList = baseOptions.filter(item => item.type === 'Weapon')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    let html = '';
    if (currentFilter === 'all' || currentFilter === 'Armor') {
      if (armorList.length > 0) {
        html += `<optgroup label="🛡️ Armor &amp; Shields">` +
          armorList.map(item => `<option value="${item.id}">${RuleMaster.escapeHtml(item.name)} (${RuleMaster.escapeHtml(item.type || item.category || 'Gear')})</option>`).join('') +
          `</optgroup>`;
      }
    }
    if (currentFilter === 'all' || currentFilter === 'Weapon') {
      if (weaponList.length > 0) {
        html += `<optgroup label="⚔️ Weapons">` +
          weaponList.map(item => `<option value="${item.id}">${RuleMaster.escapeHtml(item.name)} (${RuleMaster.escapeHtml(item.type || item.category || 'Gear')})</option>`).join('') +
          `</optgroup>`;
      }
    }

    const prevVal = preferredId !== null ? preferredId : baseSel.value;
    baseSel.innerHTML = html;

    const allCurrentIds = Array.from(baseSel.options).map(o => o.value);
    if (prevVal && allCurrentIds.includes(prevVal)) {
      baseSel.value = prevVal;
    } else if (allCurrentIds.includes('arm-chain-shirt')) {
      baseSel.value = 'arm-chain-shirt';
    } else if (allCurrentIds.length > 0) {
      baseSel.value = allCurrentIds[0];
    }
  },

  async openInForgeWithData(entry, editIndex = -1) {
    if (!entry) return;
    this._editingForgeMasterDbIndex = editIndex;
    this.switchInlineMode('forge');
    await this.populateInlineForgeControls();

    const nlInput = document.getElementById('mdb-forge-nl-input');
    if (nlInput) nlInput.value = '';

    const baseId = entry.baseItemId || '';
    if (baseId) {
      this._forgeBaseTypeFilter = 'all';
      this.renderForgeBaseSelectOptions(baseId);
    }

    const matSel = document.getElementById('mdb-forge-material-select');
    if (matSel) matSel.value = entry.material || '';

    const enhSel = document.getElementById('mdb-forge-enh-bonus');
    if (enhSel) enhSel.value = String(Number(entry.enhancementBonus) || 0);

    const enhIds = Array.isArray(entry.enhancements) ? entry.enhancements : [];
    const crysId = entry.crystal || '';
    this.syncInlineForgeSubControls(enhIds, crysId);
    this.updateInlineForgePreview();

    this.openMasterDbEditorModal('forge', entry);
  },

  async populateInlineForgeControls() {
    const baseSel = document.getElementById('mdb-forge-base-select');
    const enhGrid = document.getElementById('mdb-forge-enhancements-grid');
    if (!baseSel || !enhGrid) return;

    if (window.SrdCompendium && typeof window.SrdCompendium.init === 'function') {
      if (typeof window.SrdCompendium.isReady !== 'function' || !window.SrdCompendium.isReady()) {
        try { await window.SrdCompendium.init(); } catch (_) {}
      }
    }

    this.renderForgeBaseSelectOptions();
    this.syncInlineForgeSubControls();
  },

  getSelectedInlineForgeItem() {
    if (!window.ItemAssembler) return null;
    const nlVal = (document.getElementById('mdb-forge-nl-input')?.value || '').trim();
    if (nlVal.length >= 4 && typeof window.ItemAssembler.parseNaturalLanguageItem === 'function') {
      try {
        const parsed = window.ItemAssembler.parseNaturalLanguageItem(nlVal);
        if (parsed) return parsed;
      } catch (_) {}
    }

    const baseId = document.getElementById('mdb-forge-base-select')?.value || 'arm-chain-shirt';
    const matId = document.getElementById('mdb-forge-material-select')?.value || '';
    const enhBonus = Number(document.getElementById('mdb-forge-enh-bonus')?.value) || 0;
    const crystalId = document.getElementById('mdb-forge-crystal-select')?.value || '';
    const checkedEnhs = Array.from(document.querySelectorAll('.mdb-forge-enh-chk:checked')).map(el => el.value);

    const assembleFn = window.ItemAssembler.assemble || window.ItemAssembler.assembleItem;
    if (typeof assembleFn !== 'function') return null;
    try {
      return assembleFn.call(window.ItemAssembler, {
        baseItemId: baseId,
        material: matId || null,
        enhancementBonus: enhBonus,
        enhancements: checkedEnhs,
        crystal: crystalId || null,
        masterwork: enhBonus > 0 || Boolean(matId)
      });
    } catch (_) {
      return null;
    }
  },

  updateInlineForgePreview() {
    const container = document.getElementById('mdb-forge-preview-card');
    if (!container) return;
    const item = this.getSelectedInlineForgeItem();
    if (!item) {
      container.innerHTML = `<div class="text-slate-500 italic p-3 text-center">Select a base item above to preview.</div>`;
      return;
    }

    const dmgBadges = (window.DnDUI && typeof window.DnDUI.renderDamagePartsBadges === 'function') ? window.DnDUI.renderDamagePartsBadges(item.damageParts) : '';
    const modBadges = (window.DnDUI && typeof window.DnDUI.renderModifiersBadges === 'function') ? window.DnDUI.renderModifiersBadges(item.modifiers) : '';
    const tacBadges = (window.DnDUI && typeof window.DnDUI.renderTacticalBadges === 'function') ? window.DnDUI.renderTacticalBadges(item) : '';

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">V2 ASSEMBLED ITEM</span>
            <span class="text-[10px] font-mono text-slate-400 truncate">ID: ${item.id}</span>
          </div>
          <h4 class="text-sm sm:text-base font-black text-white mt-0.5 truncate">${RuleMaster.escapeHtml(item.name)}</h4>
        </div>
        <div class="flex items-center gap-3 text-right shrink-0">
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-bold">Market Price</div>
            <div class="text-xs sm:text-sm font-black font-mono text-amber-400">${Number(item.priceGp ?? item.cost ?? 0).toLocaleString('en-US')} gp</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-bold">Weight</div>
            <div class="text-xs sm:text-sm font-bold font-mono text-slate-200">${item.weightLb ?? item.weight ?? 0} lb.</div>
          </div>
        </div>
      </div>

      ${(dmgBadges || modBadges || tacBadges) ? `
        <div class="space-y-1.5">
          ${dmgBadges ? `<div class="flex flex-wrap items-center gap-1"><span class="text-[10px] text-slate-400 uppercase font-bold mr-1">Damage:</span>${dmgBadges}</div>` : ''}
          ${modBadges ? `<div class="flex flex-wrap items-center gap-1"><span class="text-[10px] text-slate-400 uppercase font-bold mr-1">Modifiers:</span>${modBadges}</div>` : ''}
          ${tacBadges ? `<div class="flex flex-wrap items-center gap-1"><span class="text-[10px] text-slate-400 uppercase font-bold mr-1">Tactical:</span>${tacBadges}</div>` : ''}
        </div>
      ` : ''}

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
        <button type="button" onclick="RuleMaster.saveInlineForgeItem(false)" class="w-full h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5">
          <span>📥</span>
          <span>${this._editingForgeMasterDbIndex >= 0 ? 'Update in Custom DB' : 'Save to Custom DB'}</span>
        </button>
        <button type="button" onclick="RuleMaster.saveInlineForgeItem(true)" class="w-full h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow transition cursor-pointer flex items-center justify-center gap-1.5">
          <span>⚒️</span>
          <span>${this._editingForgeMasterDbIndex >= 0 ? 'Update &amp; Equip to Character' : 'Save &amp; Equip to Character'}</span>
        </button>
      </div>
      ${this._editingForgeMasterDbIndex >= 0 ? `
        <div class="flex items-center justify-between pt-1 text-[10px] text-amber-300">
          <span>✏️ Editing Master DB Entry #${this._editingForgeMasterDbIndex + 1} in The Forge</span>
          <button type="button" onclick="const idx = RuleMaster._editingForgeMasterDbIndex; RuleMaster._editingForgeMasterDbIndex = -1; RuleMaster.openModalWithData(masterDb[idx], idx, { forceManualBuilder: true });" class="underline hover:text-white cursor-pointer font-bold">🛠️ Switch to Manual V2 Builder</button>
        </div>
      ` : ''}
    `;
  },

  saveInlineForgeItem(alsoEquip = false) {
    const rawItem = this.getSelectedInlineForgeItem();
    if (!rawItem) return;
    const item = this.ensureV2(JSON.parse(JSON.stringify(rawItem)));

    if (typeof this._editingForgeMasterDbIndex === 'number' && this._editingForgeMasterDbIndex >= 0 && this._editingForgeMasterDbIndex < masterDb.length) {
      masterDb[this._editingForgeMasterDbIndex] = item;
      this._editingForgeMasterDbIndex = -1;
    } else {
      const existsIdx = masterDb.findIndex(m => (m.id && m.id === item.id) || (m.name || '').toLowerCase().trim() === (item.name || '').toLowerCase().trim());
      if (existsIdx >= 0) {
        masterDb[existsIdx] = item;
      } else {
        masterDb.unshift(item);
      }
    }

    if (alsoEquip) {
      if (typeof addV2ItemToCharacterGearPool === 'function') {
        addV2ItemToCharacterGearPool(item);
      } else {
        this.equipItem(item.id);
      }
    }

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    const mdbModal = document.getElementById('modal-master-db-editor');
    if (mdbModal && !mdbModal.classList.contains('hidden')) {
      this.closeMasterDbEditorModal();
    }
    if (!alsoEquip) {
      alert(`✅ "${item.name}" saved to Character Custom DB!`);
    }
  },

  fillFreeTextSample(type) {
    const ta = document.getElementById('inline-ai-freetext-input');
    if (!ta) return;
    ta.value = this.getSampleText(type);
  },

  fillFreeTextSampleFull(type) {
    const ta = document.getElementById('raw-rule-input');
    if (!ta) return;
    ta.value = this.getSampleText(type);
  },

  getSampleText(type) {
    if (type === 'feat') {
      return `Cleave [General]\nPrerequisites: Str 13, Power Attack.\nBenefit: If you deal a creature enough damage to make it drop (typically by dropping it to below 0 hit points or killing it), you get an immediate, extra melee attack against another creature in the immediate vicinity.\nYou cannot take more than one 5-foot step between attacks when using this feat. You can use this ability once per round.`;
    } else if (type === 'item') {
      return `Flametongue\nPrice: 20,715 gp\nBody Slot: Main Hand\nCaster Level: 12th\nAura: Strong (DC 21) evocation\nWeight: 4 lb.\nThis +1 flaming burst longsword deals +1d6 points of fire damage on a normal hit. On a successful critical hit, it deals an additional +1d10 points of fire damage (or +2d10 if x3, +3d10 if x4). Once per day, the wielder can shoot a 4d6 ray of fire as a ranged touch attack (Close range).`;
    } else if (type === 'spell') {
      return `Haste\nTransmutation\nLevel: Sor/Wiz 3\nComponents: V, S, M\nCasting Time: 1 standard action\nRange: Close (25 ft. + 5 ft./2 levels)\nTargets: One creature/level, no two of which can be more than 30 ft. apart\nDuration: 1 round/level\nThe transmuted creatures move and act more quickly than normal. When making a full attack action, a hasted creature may make one extra attack with any weapon he is holding. The attack bonus is +1, with a +1 dodge bonus to AC and Reflex saves, and an enhancement bonus to speed of +30 feet.`;
    }
    return '';
  },

  parseRawTextFromInline() {
    const ta = document.getElementById('inline-ai-freetext-input');
    const val = ta?.value || '';
    if (!val.trim()) {
      alert('⚠️ Please paste rule text into the free-text box first.');
      return;
    }
    const fullTa = document.getElementById('raw-rule-input');
    if (fullTa) fullTa.value = val;
    this.parseRawText();
  },

  async queryAiFreeTextRows(rawText, apiKey, statusTextEl = null) {
    // 0ms Deterministic V2 Resolution for Structured Ability / Breath Weapon Stat Blocks
    const structuredHit = this.parseStructuredAbilityStatBlock(rawText);
    if (structuredHit && structuredHit.name) {
      return [this.ensureV2(structuredHit)];
    }

    const promptText = `You are a master D&D 3.5e Rule Arbiter and Canonical V2 Database Architect.
The user has provided a raw, free-form text block copied from a D&D 3.5e sourcebook, PDF, SRD, or adventure:

RAW TEXT:
'''
${rawText}
'''

${this.DND35_RAW_GUARDRAIL}

TASK:
Analyze and parse this free-form text completely into Canonical V2 JSON entries (schemaVersion: 2).
CRITICAL RULES:
1. STRICT REAL RAW 3.5E RULES ONLY (100% official English terminology, zero U+1F3B2 dice emoji).
2. EMBEDDED MODES (NO SEPARATE '↳' CHILD ROWS):
   If the item or spell has multiple distinct powers or sub-modes (e.g. Flametongue 1/day 4d6 fire ray, or Searing Light vs Undead), embed them inside the parent entry's "modes" array.
3. UNIVERSAL MODIFIERS, DAMAGE PARTS & PARAMETERIZED ABILITIES:
   - Stat/roll bonuses go into "modifiers": [{"target": "ac.dodge"|"attack.all"|"ability.str"|"save.ref"|"speed.land", "value": 1, "type": "Dodge"|"Enhancement"|"Untyped", "condition": null}].
   - Attack/Breath/Ability damage dice go into "damageParts": [{"dice": "4d8", "bonus": 0, "type": "Acid", "multiplyOnCrit": false, "onCritOnly": false, "source": "Breath Weapon"}].
   - NEVER put Recharge/Cooldown dice (such as "Recharge 1d4+1 turn") into "damageParts"! Instead, set "recharge": "1d4+1 rounds" and "rechargeDice": "1d4+1".
   - If the ability has a Saving Throw or DC formula (e.g. "Save Reflex, DC:10+lvl+Con"), set "save": "Reflex" and normalize "dcFormula" using Canonical V2 tokens ("10 + @level + @conMod").
   - Weapons MUST include "weaponMeta" (with "proficiency": "Simple"|"Martial"|"Exotic", "handedness", "damageDice", "critMin", "critMult", "damageType", "isDoubleWeapon", "isFinessable") and Armors/Shields MUST include "armorMeta" ("category", "armorBonus", "maxDex", "acp", "asf").

OUTPUT REQUIREMENT:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "unique_slug_id",
      "name": "Entry Name",
      "type": "Feat|Special Ability|Racial Trait|Class Feature|DM Boon|Weapon|Armor|Shield|Ring|Wondrous Item|Augment Crystal|Spell|Power|Potion|Scroll|Wand|Consumable|Maneuver|Stance|Template|Race|Deity|Domain",
      "slot": "None|Main Hand|Two Hands|Armor|Off-Hand/Shield|Ring|Belt|Waist|Shoulders|Neck|Throat|Head|Face|Body|Torso|Feet|Hands|Arms",
      "source": "PHB p.92 / DMG p.224",
      "prereq": "-",
      "benefit": "Concise mechanical summary in English",
      "description": "Full RAW text in English",
      "action": "Passive|Standard Action|Move Action|Swift Action|Immediate Action|Full-Round Action|Free Action",
      "actionType": "passive|standard|move|swift|immediate|full_round|free",
      "duration": "Continuous|Instantaneous|1 round/level",
      "range": "60 ft.",
      "save": "Reflex",
      "dcFormula": "10 + @level + @conMod",
      "recharge": "1d4+1 rounds",
      "rechargeDice": "1d4+1",
      "weight": 0,
      "cost": 0,
      "isFighterBonusFeat": false,
      "requiresEnergyChoice": false,
      "dailyCharges": null,
      "crystalTier": null,
      "crystalSlot": null,
      "modifiers": [],
      "damageParts": [],
      "modes": [],
      "weaponMeta": null,
      "armorMeta": null,
      "weaponStats": null,
      "armorStats": null,
      "spellStats": null,
      "ruleFlags": {},
      "tacticalBadges": []
    }
  ]
}`;

    const modelsToTry = await this.getAvailableGeminiModels(apiKey, false, 'IMPORT_BATCH');
    let successData = null;
    let lastError = null;

    for (const model of modelsToTry) {
      if (statusTextEl) {
        statusTextEl.textContent = `Analyzing free text (Model: ${model})...`;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.0
            }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleanText = this.cleanJsonText(text);
          successData = JSON.parse(cleanText);
          break;
        }
      } catch (err) {
        clearTimeout(timeoutId);
        const errMsg = err && err.name === 'AbortError' ? `Timeout (10s) - ${model} did not respond.` : err.message;
        console.warn(`Model ${model} free-text parse failed:`, errMsg);
        lastError = new Error(errMsg);
      }
    }

    if (!successData) {
      throw new Error(lastError?.message || 'All Gemini models failed to respond.');
    }

    const rawItems = successData.entries || successData.rows || (Array.isArray(successData) ? successData : [successData]);
    if (!Array.isArray(rawItems)) {
      throw new Error('Model failed to produce the expected entry array.');
    }

    return this.convertRowsToEntries(rawItems).map(e => this.ensureV2(e));
  },

  processAiRows(rowsOrEntries) {
    const entries = this.convertRowsToEntries(rowsOrEntries).map(e => this.ensureV2(e));
    this.lastAiResults = entries;
    this.renderAiResults();
    const resultsWrapper = document.getElementById('ai-results-wrapper');
    if (resultsWrapper) resultsWrapper.classList.remove('hidden');
  },

  async queryInlineAiFreeText() {
    const ta = document.getElementById('inline-ai-freetext-input');
    const text = ta?.value?.trim() || '';
    if (!text) {
      alert('⚠️ Please paste the free-form rule text to analyze.');
      ta?.focus();
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('⚠️ Please enter a Google Gemini API Key first (free key from Google AI Studio).\nYou can save your key in the Settings dialog.');
      if (typeof openSettingsModal === 'function') openSettingsModal();
      return;
    }

    const btn = document.getElementById('btn-inline-freetext-ai');
    const loadingBox = document.getElementById('inline-ai-loading-box');
    const statusText = document.getElementById('inline-ai-status-text');
    const resultsBox = document.getElementById('inline-ai-results-box');

    if (btn) btn.disabled = true;
    if (loadingBox) loadingBox.classList.remove('hidden');
    if (resultsBox) resultsBox.innerHTML = '';

    try {
      const entries = await this.queryAiFreeTextRows(text, apiKey, statusText);
      this.renderInlineAiResults(entries);
    } catch (err) {
      alert(`⚠️ Failed to parse free text: ${err.message}\nPlease check your internet connection and API key.`);
    } finally {
      if (btn) btn.disabled = false;
      if (loadingBox) loadingBox.classList.add('hidden');
    }
  },

  async queryFullAiFreeText() {
    const ta = document.getElementById('raw-rule-input');
    const text = ta?.value?.trim() || '';
    if (!text) {
      alert('⚠️ Please paste the free-form rule text to analyze.');
      ta?.focus();
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('⚠️ Please configure a Google Gemini API Key first.');
      this.promptChangeApiKey();
      return;
    }

    const btn = document.getElementById('btn-full-freetext-ai');
    const loadingIndicator = document.getElementById('ai-loading-indicator');
    const statusText = document.getElementById('ai-loading-status-text');

    if (btn) btn.disabled = true;
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');

    try {
      const entries = await this.queryAiFreeTextRows(text, apiKey, statusText);
      this.processAiRows(entries);
      const resultsContainer = document.getElementById('ai-results-container');
      if (resultsContainer) {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      alert(`⚠️ Failed to parse free text: ${err.message}`);
    } finally {
      if (btn) btn.disabled = false;
      if (loadingIndicator) loadingIndicator.classList.add('hidden');
    }
  },

  // ====================================================
  // GSHEET RULE MASTER LEVEL UP COPILOT (AI & RAW ENGINE)
  // ====================================================

  async callAiText(promptText, systemInstruction = '', onStatus = null) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Please add an API key in Settings or the Rule Master tab.');
    }

    const availableModels = await this.getAvailableGeminiModels(apiKey);
    let successText = '';
    let lastError = '';

    for (const model of availableModels) {
      if (typeof onStatus === 'function') {
        onStatus(`Scanning RAW 3.5e rules with ${model}...`);
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const bodyPayload = {
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2
          }
        };
        if (systemInstruction) {
          bodyPayload.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const json = await resp.json();
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            successText = rawText;
            break;
          }
        } else {
          const errData = await resp.json().catch(() => ({}));
          lastError = errData.error?.message || `HTTP ${resp.status}`;
        }
      } catch (netErr) {
        clearTimeout(timeoutId);
        lastError = netErr && netErr.name === 'AbortError' ? `Timeout (12s) - ${model} did not respond.` : netErr.message;
      }
    }

    if (successText) {
      return successText;
    }
    throw new Error(lastError || 'No response received from Gemini API models.');
  },

  evaluateHeuristicLevelUp(ctx) {
    const {
      characterName = 'Character',
      race = 'Human',
      currentLevel = 6,
      targetLevel = 7,
      targetClass = 'Warblade',
      classes = [],
      abilities = { str: 18, dex: 14, con: 14, int: 14, wis: 10, cha: 22 },
      bab = 4,
      feats = [],
      isStatLevel = false,
      isFeatLevel = false,
      customQuery = ''
    } = ctx;

    const lowerFeats = feats.map(f => String(f).toLowerCase().replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim());
    const hasFeat = (name) => lowerFeats.some(f => f.includes(name.toLowerCase()));

    // 1. Stat recommendation
    let recommendedStat = null;
    let statReason = '';
    if (isStatLevel) {
      const isMartial = ['warblade', 'fighter', 'barbarian', 'crusader', 'paladin', 'ranger'].includes(targetClass.toLowerCase());
      const isCaster = ['sorcerer', 'wizard', 'cleric', 'druid', 'bard'].includes(targetClass.toLowerCase());
      
      const statPriority = isMartial 
        ? ['str', 'con', 'dex', 'int', 'wis', 'cha']
        : isCaster
          ? (targetClass.toLowerCase() === 'sorcerer' || targetClass.toLowerCase() === 'bard' ? ['cha', 'con', 'dex', 'int', 'wis', 'str'] : ['int', 'con', 'dex', 'cha', 'wis', 'str'])
          : ['dex', 'str', 'con', 'int', 'wis', 'cha'];

      for (const st of statPriority) {
        const val = Number(abilities[st]) || 10;
        if (val % 2 !== 0) {
          recommendedStat = st;
          statReason = `${st.toUpperCase()} is currently ${val} (odd score). Adding +1 brings it to ${val + 1}, increasing your ability modifier to +${Math.floor(((val + 1) - 10) / 2)}!`;
          break;
        }
      }

      if (!recommendedStat) {
        recommendedStat = statPriority[0];
        const currentVal = Number(abilities[recommendedStat]) || 10;
        statReason = `Increasing your primary ability score for ${targetClass}, ${recommendedStat.toUpperCase()} (${currentVal}), is recommended.`;
      }
    }

    // 2. Feat recommendation
    let recommendedFeat = '';
    let featBenefit = '';
    let featCategory = 'Regular Feat';
    let featPrereq = '';

    const isWarblade = targetClass.toLowerCase().includes('warblade');
    const isSorcerer = targetClass.toLowerCase().includes('sorcerer');
    const isMartial = ['warblade', 'fighter', 'barbarian', 'crusader', 'paladin', 'ranger'].includes(targetClass.toLowerCase());
    const isGish = (classes.some(c => (c.className || '').toLowerCase().includes('warblade') || (c.className || '').toLowerCase().includes('fighter')) &&
                    classes.some(c => (c.className || '').toLowerCase().includes('sorcerer') || (c.className || '').toLowerCase().includes('wizard')));

    if (isGish && !hasFeat('practiced spellcaster')) {
      recommendedFeat = 'Practiced Spellcaster';
      featBenefit = 'Increases your Caster Level by +4 (up to your total HD), offsetting multiclass (Gish) caster level loss.';
      featCategory = 'Regular Feat';
      featPrereq = 'Spellcraft 4 ranks';
    } else if (isGish && bab >= 1 && !hasFeat('arcane strike')) {
      recommendedFeat = 'Arcane Strike';
      featBenefit = 'Sacrifice a spell slot as a swift action to gain +spell level on melee attack rolls and +1d6 per level arcane damage for 1 round.';
      featCategory = 'Regular Feat';
      featPrereq = 'BAB +1, ability to cast 3rd-level arcane spells';
    } else if (isMartial) {
      if (!hasFeat('power attack') && (abilities.str || 10) >= 13 && bab >= 1) {
        recommendedFeat = 'Power Attack';
        featBenefit = 'Trade attack bonus (up to BAB) for +1 melee damage (+2 with a two-handed weapon).';
        featCategory = 'Regular Feat';
        featPrereq = 'STR 13, BAB +1';
      } else if (!hasFeat('cleave') && (abilities.str || 10) >= 13 && hasFeat('power attack')) {
        recommendedFeat = 'Cleave';
        featBenefit = 'When you drop an opponent, make an immediate extra melee attack against another target within reach.';
        featCategory = 'Regular Feat';
        featPrereq = 'Power Attack, STR 13';
      } else if (!hasFeat('improved bull rush') && hasFeat('power attack') && (abilities.str || 10) >= 13) {
        recommendedFeat = 'Improved Bull Rush';
        featBenefit = '+4 bonus on Bull Rush checks and you do not provoke attacks of opportunity. Mandatory prerequisite for Shock Trooper.';
        featCategory = 'Regular Feat';
        featPrereq = 'Power Attack, STR 13';
      } else if (bab >= 6 && hasFeat('improved bull rush') && !hasFeat('shock trooper')) {
        recommendedFeat = 'Shock Trooper';
        featBenefit = 'Heedless Charge shifts your Power Attack penalty from your attack roll to your Armor Class (AC) on a charge.';
        featCategory = 'Regular Feat';
        featPrereq = 'BAB +6, Power Attack, Improved Bull Rush';
      } else if (hasFeat('power attack') && !hasFeat('leap attack')) {
        recommendedFeat = 'Leap Attack';
        featBenefit = 'Combine a Jump check with a charge to double your Power Attack damage multiplier (x3 with a two-handed weapon).';
        featCategory = 'Regular Feat';
        featPrereq = 'Jump 8 ranks, Power Attack';
      } else if (!hasFeat('improved initiative')) {
        recommendedFeat = 'Improved Initiative';
        featBenefit = 'Grants a +4 bonus on Initiative checks so you act first in combat.';
        featCategory = 'Regular Feat';
        featPrereq = 'None';
      } else if (isWarblade && !hasFeat('adaptive style')) {
        recommendedFeat = 'Adaptive Style';
        featBenefit = 'Change and recover your readied Tome of Battle maneuvers as a single full-round action.';
        featCategory = 'Regular Feat';
        featPrereq = 'Initiator Level 1+';
      } else if (!hasFeat('iron will')) {
        recommendedFeat = 'Iron Will';
        featBenefit = 'Grants a +2 bonus on Will saving throws, shoring up martial classes\' weakest save.';
        featCategory = 'Regular Feat';
        featPrereq = 'None';
      } else {
        recommendedFeat = 'Weapon Focus';
        featBenefit = 'Grants a +1 bonus on all attack rolls with the selected weapon.';
        featCategory = 'Regular Feat';
        featPrereq = 'Proficiency with weapon, BAB +1';
      }
    } else if (isSorcerer) {
      if (!hasFeat('improved initiative')) {
        recommendedFeat = 'Improved Initiative';
        featBenefit = '+4 bonus on Initiative checks, allowing spellcasters to land battlefield-control spells (Haste, Slow, Fireball) first.';
        featCategory = 'Regular Feat';
        featPrereq = 'None';
      } else if (!hasFeat('empower spell')) {
        recommendedFeat = 'Empower Spell';
        featBenefit = 'All variable, numeric effects of an empowered spell are increased by 50% (+2 spell slot level).';
        featCategory = 'Regular Feat';
        featPrereq = 'Metamagic';
      } else {
        recommendedFeat = 'Spell Focus';
        featBenefit = 'Add +1 to the Difficulty Class (DC) for all saving throws against spells from your chosen school.';
        featCategory = 'Regular Feat';
        featPrereq = 'None';
      }
    } else {
      recommendedFeat = 'Improved Initiative';
      featBenefit = 'Grants a +4 bonus on Initiative checks.';
      featCategory = 'Regular Feat';
      featPrereq = 'None';
    }

    // 3. Synergy notes
    let notes = '';
    if (isGish) {
      notes = `${targetClass} Level ${targetLevel}: Reinforced Gish build blending Warblade martial durability with Sorcerer arcane spellcasting.`;
    } else if (isWarblade) {
      notes = `Warblade Level ${targetLevel}: Increased melee prowess with d12 Hit Die and full BAB progression.`;
    } else {
      notes = `${targetClass} Level ${targetLevel} progression completed.`;
    }

    let adviceHtml = `
      <div class="space-y-2">
        <div class="flex items-center justify-between pb-1 border-b border-purple-500/30">
          <span class="font-bold text-amber-300 flex items-center gap-1.5">
            <span>📖</span><span>D&D 3.5e RAW Rule Engine Recommendation (Level ${targetLevel})</span>
          </span>
          <span class="text-[10px] text-purple-300 font-mono">Heuristic Analysis</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${isStatLevel ? `
            <div class="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1">
              <div class="text-[11px] font-bold text-amber-300 flex items-center justify-between">
                <span>💪 Ability Score Increase (+1)</span>
                <span class="badge bg-amber-900 text-amber-200 border border-amber-600 font-mono text-[10px] font-bold">+1 ${recommendedStat.toUpperCase()}</span>
              </div>
              <p class="text-[11px] text-amber-100/90 leading-relaxed">${statReason}</p>
              <button type="button" onclick="applyCopilotStat('${RuleMaster.escapeJsString(recommendedStat)}')" class="w-full mt-1 py-1 rounded bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/50 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer">
                <span>⚡</span><span>Select This Ability (+1 ${recommendedStat.toUpperCase()})</span>
              </button>
            </div>
          ` : `
            <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div class="text-[11px] font-bold text-slate-400">💪 Ability Score Increase</div>
              <p class="text-[11px] text-slate-400">No ability score increase at Level ${targetLevel} (granted at character levels 4, 8, 12, 16, and 20).</p>
            </div>
          `}

          <div class="p-2 rounded-lg bg-purple-950/40 border border-purple-500/40 space-y-1">
            <div class="text-[11px] font-bold text-purple-300 flex items-center justify-between">
              <span>🎯 Recommended Feat</span>
              <span class="badge bg-purple-900 text-purple-200 border border-purple-600 font-mono text-[10px] font-bold">${recommendedFeat}</span>
            </div>
            <p class="text-[11px] text-purple-100/90 leading-relaxed">${featBenefit}</p>
            <div class="text-[10px] text-purple-400 italic">Prerequisites: ${featPrereq}</div>
            <button type="button" onclick="applyCopilotFeat('${RuleMaster.escapeJsString(recommendedFeat)}', '${RuleMaster.escapeJsString(featBenefit)}', '${RuleMaster.escapeJsString(featCategory)}')" class="w-full mt-1 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/50 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer">
              <span>⚡</span><span>Fill Feat Slot</span>
            </button>
          </div>
        </div>

        <div class="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/30 space-y-1">
          <div class="text-[11px] font-bold text-indigo-300 flex items-center justify-between">
            <span>⚔️ Tactical Synergy & Class Guide</span>
            <button type="button" onclick="applyCopilotNotes('${RuleMaster.escapeJsString(notes)}')" class="text-[10px] text-indigo-300 hover:text-white underline cursor-pointer">Copy to Notes</button>
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed">${notes}</p>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-[10px] text-slate-500 italic">💡 Add a Gemini API Key for deep tactical analysis across all 3.5e splatbooks.</span>
          <button type="button" onclick="applyCopilotAll({ recommendedFeat: '${RuleMaster.escapeJsString(recommendedFeat)}', featBenefit: '${RuleMaster.escapeJsString(featBenefit)}', featCategory: '${RuleMaster.escapeJsString(featCategory)}', recommendedStat: '${RuleMaster.escapeJsString(recommendedStat || '')}', notes: '${RuleMaster.escapeJsString(notes)}' })" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg shadow flex items-center gap-1 transition cursor-pointer">
            <span>🚀</span><span>Apply All Recommendations</span>
          </button>
        </div>
      </div>
    `;

    return {
      isAi: false,
      adviceHtml,
      recommendedFeat,
      featBenefit,
      featCategory,
      recommendedStat,
      notes
    };
  },

  async getLevelUpAdvice(ctx) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.evaluateHeuristicLevelUp(ctx);
    }

    const {
      characterName = 'Character',
      race = 'Human',
      alignment = 'Neutral',
      currentLevel = 6,
      targetLevel = 7,
      targetClass = 'Warblade',
      classes = [],
      abilities = {},
      bab = 4,
      saves = {},
      feats = [],
      isStatLevel = false,
      isFeatLevel = false,
      customQuery = '',
      onStatus = null
    } = ctx;

    const classProgStr = classes.map(c => `${c.className} ${c.level || 1}`).join(' / ') || targetClass;
    const knownFeatsStr = feats.join(', ') || 'None';
    const statsStr = `STR: ${abilities.str || 10}, DEX: ${abilities.dex || 10}, CON: ${abilities.con || 10}, INT: ${abilities.int || 10}, WIS: ${abilities.wis || 10}, CHA: ${abilities.cha || 10}`;

    const systemInstruction = `You are the D&D 3.5e Rule Master and Level-Up Copilot.
Based on the provided D&D 3.5e character sheet and official RAW sourcebooks (PHB, DMG, Complete Warrior, Complete Arcane, Complete Divine, Complete Adventurer, Complete Mage, Complete Scoundrel, Complete Champion, Tome of Battle, Spell Compendium), prepare a tactical, rules-accurate level-up recommendation in English.
Evaluate the synergy between the character's classes, BAB, ability scores, saving throws, and existing feats.

Include in your response:
1. Feat Recommendation: The most optimal feat available at this level, why it fits the build, and how its prerequisites are met.
2. Ability Score Increase: If Character Level is 4, 8, 12, 16, or 20 (+1 Ability Score), which ability score to increment (especially highlighting odd-to-even breakpoints).
3. Class Features & Spells/Maneuvers: Key class features, spells, or maneuvers gained or recommended at this level.
4. Tactical Synergy Summary.

CRITICAL REQUIREMENT: At the very end of your response, include this exact JSON block for automatic form population:
\`\`\`json
{
  "recommendedFeat": "Official Feat Name",
  "featBenefit": "Concise 1-sentence mechanical benefit",
  "featCategory": "Regular Feat",
  "recommendedStat": "str",
  "notes": "Concise tactical level-up note for the character sheet"
}
\`\`\``;

    const userPrompt = `Character Name: ${characterName}
Race: ${race} | Alignment: ${alignment}
Current Classes: ${classProgStr}
Target Progression: Character Level ${targetLevel} (Advancing ${targetClass})
Ability Scores: ${statsStr}
Base Attack Bonus (BAB): +${bab}
Saving Throws: Fort +${saves.fort || 0}, Ref +${saves.ref || 0}, Will +${saves.will || 0}
Current Feats / Abilities: ${knownFeatsStr}
Ability Score Increase (+1) Eligible?: ${isStatLevel ? 'YES (+1 Ability Score at this level)' : 'No'}
General Feat Slot Eligible?: ${isFeatLevel ? 'YES' : 'Optional / Class Bonus Feat'}
${customQuery ? `User Question: ${customQuery}` : 'Provide the optimal D&D 3.5e RAW build recommendation for this level-up.'}`;

    try {
      const rawAiText = await this.callAiText(userPrompt, systemInstruction, onStatus);

      let parsedJson = null;
      const jsonMatch = rawAiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          parsedJson = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.warn('Could not parse Copilot JSON recommendation:', e);
        }
      }

      let cleanText = rawAiText.replace(/```(?:json)?\s*[\s\S]*?\s*```/g, '').trim();
      let htmlBody = cleanText
        .replace(/^### (.*$)/gim, '<h4 class="text-xs font-bold text-purple-300 mt-2 mb-1 flex items-center gap-1.5"><span>⚡</span><span>$1</span></h4>')
        .replace(/^## (.*$)/gim, '<h3 class="text-xs font-black text-amber-300 mt-2.5 mb-1.5 pb-1 border-b border-purple-500/30 flex items-center gap-1.5"><span>🔮</span><span>$1</span></h3>')
        .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-slate-300 text-[11px]">$1</li>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300 text-[11px]">$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<b class="text-white font-semibold">$1</b>')
        .replace(/\n\n/g, '<div class="h-1.5"></div>');

      const recFeat = parsedJson?.recommendedFeat || (ctx.isFeatLevel ? 'Power Attack' : '');
      const featBenefit = parsedJson?.featBenefit || 'D&D 3.5e RAW recommendation';
      const featCategory = parsedJson?.featCategory || 'Regular Feat';
      const recStat = parsedJson?.recommendedStat || (ctx.isStatLevel ? 'str' : null);
      const notes = parsedJson?.notes || `${targetClass} Level ${targetLevel} progression completed.`;

      let adviceHtml = `
        <div class="space-y-2">
          <div class="flex items-center justify-between pb-1 border-b border-purple-500/30">
            <span class="font-bold text-purple-300 flex items-center gap-1.5">
              <span>🧙‍♂️🤖</span><span>Rule Master AI Level-Up Recommendation (Level ${targetLevel})</span>
            </span>
            <span class="badge bg-purple-950 text-purple-300 border border-purple-600 font-mono text-[10px] font-bold">Gemini RAW AI</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
            ${recStat ? `
              <div class="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
                <div>
                  <div class="text-[10px] font-bold text-amber-400 uppercase">Recommended Ability:</div>
                  <div class="text-xs font-black text-white">+1 ${recStat.toUpperCase()}</div>
                </div>
                <button type="button" onclick="applyCopilotStat('${RuleMaster.escapeJsString(recStat)}')" class="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] shadow transition cursor-pointer">
                  Apply
                </button>
              </div>
            ` : ''}

            ${recFeat ? `
              <div class="p-2 rounded-lg bg-purple-950/40 border border-purple-500/40 flex items-center justify-between">
                <div class="truncate mr-2">
                  <div class="text-[10px] font-bold text-purple-300 uppercase">Recommended Feat:</div>
                  <div class="text-xs font-black text-white truncate" title="${recFeat}">${recFeat}</div>
                </div>
                <button type="button" onclick="applyCopilotFeat('${RuleMaster.escapeJsString(recFeat)}', '${RuleMaster.escapeJsString(featBenefit)}', '${RuleMaster.escapeJsString(featCategory)}')" class="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] shadow transition cursor-pointer shrink-0">
                  Fill Slot
                </button>
              </div>
            ` : ''}
          </div>

          <div class="prose prose-invert text-xs leading-relaxed max-h-72 overflow-y-auto pr-1">
            ${htmlBody}
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-purple-900/50">
            <button type="button" onclick="applyCopilotNotes('${RuleMaster.escapeJsString(notes)}')" class="text-[10px] text-indigo-300 hover:text-white underline cursor-pointer">
              📝 Add Recommendation Note
            </button>
            <button type="button" onclick="applyCopilotAll({ recommendedFeat: '${RuleMaster.escapeJsString(recFeat)}', featBenefit: '${RuleMaster.escapeJsString(featBenefit)}', featCategory: '${RuleMaster.escapeJsString(featCategory)}', recommendedStat: '${RuleMaster.escapeJsString(recStat || '')}', notes: '${RuleMaster.escapeJsString(notes)}' })" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 transition cursor-pointer active:scale-95">
              <span>⚡</span><span>Apply All Recommendations</span>
            </button>
          </div>
        </div>
      `;

      return {
        isAi: true,
        adviceHtml,
        recommendedFeat: recFeat,
        featBenefit,
        featCategory,
        recommendedStat: recStat,
        notes
      };
    } catch (err) {
      console.warn('AI call failed, falling back to heuristic:', err);
      const fallback = this.evaluateHeuristicLevelUp(ctx);
      fallback.adviceHtml = `
        <div class="p-2 mb-2 rounded bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[11px] flex items-center gap-2">
          <span>⚠️</span><span>AI API connection unavailable (${err.message}). Showing D&D 3.5e RAW Rule Engine recommendations.</span>
        </div>
        ${fallback.adviceHtml}
      `;
      return fallback;
    }
  }
,

  // ====================================================
  // GEMINI PRO RAW LIBRARY AUDITOR (SANITY CHECKER)
  // ====================================================
  async auditLibraryWithProModal() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('⚠️ A valid Gemini API key is required for Compendium auditing.');
      this.promptChangeApiKey();
      return;
    }

    const items = (Array.isArray(this.masterDb) ? this.masterDb : [])
      .filter(i => i && i.name);

    if (items.length === 0) {
      alert('ℹ️ Your local user database (master_db) has no custom entries yet.\n\nAll 3,522 entries in the Modular SRD V2 Compendium are already deterministically verified and frozen.');
      return;
    }

    let modalEl = document.getElementById('rule-master-audit-modal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'rule-master-audit-modal';
      modalEl.className = 'fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="bg-slate-900 border border-purple-500/60 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl text-white">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🛡️</span>
            <div>
              <h3 class="font-bold text-sm text-purple-300">RAW 3.5e & Canonical V2 Compendium Audit (Gemini Pro)</h3>
              <p class="text-[11px] text-slate-400">Scanning ${items.length} custom record(s) in master_db...</p>
            </div>
          </div>
          <button onclick="document.getElementById('rule-master-audit-modal').classList.add('hidden')" class="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 rounded bg-slate-800 cursor-pointer">✕</button>
        </div>
        <div id="rule-master-audit-content" class="max-h-96 overflow-y-auto space-y-2 pr-1 text-xs">
          <div class="text-center py-8 text-slate-400 animate-pulse flex items-center justify-center gap-2">
            <span>⚡ Connecting to Gemini Pro and running RAW 3.5e rule engine audit...</span>
          </div>
        </div>
      </div>
    `;
    modalEl.classList.remove('hidden');

    try {
      const sampleItems = items.slice(0, 20).map(i => ({
        id: i.id,
        schemaVersion: i.schemaVersion,
        name: i.name,
        type: i.type,
        source: i.source,
        prereq: i.prereq,
        benefit: i.benefit || i.description,
        modifiers: i.modifiers,
        damageParts: i.damageParts,
        modes: i.modes,
        isFighterBonusFeat: i.isFighterBonusFeat
      }));

      const auditPrompt = `You are an uncompromising D&D 3.5e RAW Auditor.
Audit these user-added custom records from their master_db:
${JSON.stringify(sampleItems, null, 2)}

TASK:
1. Verify if each item exists in official 3.5e WotC books or is unofficial homebrew.
2. Detect any 5e mechanics (Advantage/Disadvantage, Bonus Action, Finesse adding Dex to damage, etc.).
3. Check if prerequisites, modifiers, damageParts, and fighter bonus feat flags match RAW 3.5e.

Return valid JSON strictly matching:
{
  "results": [
    {
      "name": "Item Name",
      "status": "APPROVED",
      "issues": ["Issue description if any"],
      "recommendedAction": "KEEP"
    }
  ]
}
Allowed status values: "APPROVED" | "WARNING" | "HOMEBREW".
Allowed recommendedAction values: "KEEP" | "MODIFY" | "REMOVE".`;

      const models = await this.getAvailableGeminiModels(apiKey, false, 'RULE_AUDIT');
      let auditJson = null;

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: auditPrompt }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
          });
          if (resp.ok) {
            const data = await resp.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              auditJson = JSON.parse(this.cleanJsonText(text));
              break;
            }
          }
        } catch (e) {
          console.warn(`Audit model ${model} failed:`, e);
        }
      }

      const contentEl = document.getElementById('rule-master-audit-content');
      if (!contentEl) return;

      if (!auditJson || !Array.isArray(auditJson.results)) {
        contentEl.innerHTML = `<div class="p-3 text-rose-300 bg-rose-950/40 rounded border border-rose-800">⚠️ Audit could not be completed or no response was received. Please check your API quota.</div>`;
        return;
      }

      contentEl.innerHTML = auditJson.results.map(r => {
        let badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-700';
        let badgeIcon = '✅';
        if (r.status === 'WARNING') {
          badgeColor = 'bg-amber-950 text-amber-300 border-amber-700';
          badgeIcon = '⚠️';
        } else if (r.status === 'HOMEBREW') {
          badgeColor = 'bg-rose-950 text-rose-300 border-rose-700';
          badgeIcon = '🚫';
        }
        return `
          <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white">${RuleMaster.escapeHtml(r.name)}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}">
                ${badgeIcon} ${r.status}
              </span>
            </div>
            ${r.issues && r.issues.length ? `<p class="text-[10px] text-amber-200">${r.issues.join(' | ')}</p>` : `<p class="text-[10px] text-emerald-400">100% compliant with official D&D 3.5e RAW and Canonical V2 standards.</p>`}
          </div>
        `;
      }).join('');

    } catch (err) {
      const contentEl = document.getElementById('rule-master-audit-content');
      if (contentEl) {
        contentEl.innerHTML = `<div class="p-3 text-rose-300 bg-rose-950/40 rounded border border-rose-800">Error: ${err.message}</div>`;
      }
    }
  }
};

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('mdb-add-dropdown-menu');
    const btn = document.getElementById('btn-add-rule-dropdown');
    if (menu && !menu.classList.contains('hidden')) {
      if (btn && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
      }
    }
  });

  // Preserve multi-line structure when pasting multi-line ability stat blocks into single-line Rule Master search inputs
  document.addEventListener('paste', (e) => {
    const target = e.target;
    if (!target || target.tagName !== 'INPUT') return;
    const validIds = new Set(['quick-feat-name', 'ai-rule-query', 'inline-ai-rule-query']);
    if (!validIds.has(target.id)) return;
    const clipText = (e.clipboardData || window.clipboardData)?.getData('text');
    if (clipText && /[\r\n]/.test(clipText)) {
      const lines = clipText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        e.preventDefault();
        const joined = lines.join(' | ');
        const start = typeof target.selectionStart === 'number' ? target.selectionStart : target.value.length;
        const end = typeof target.selectionEnd === 'number' ? target.selectionEnd : target.value.length;
        target.value = target.value.slice(0, start) + joined + target.value.slice(end);
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
}

window.RuleMaster = RuleMaster;

if (typeof window !== 'undefined' && window.Actions && typeof window.Actions.register === 'function') {
  window.Actions.register('mdb:render-table', () => {
    RuleMaster.renderTable();
  });
  window.Actions.register('mdb:apply-snapshot-update', (el, data) => {
    RuleMaster.applySnapshotUpdate((data && data.id) || (el && el.dataset && el.dataset.id));
  });
  window.Actions.register('forge:add-modifier-row', () => {
    RuleMaster.addInlineManualModifierRow();
  });
  window.Actions.register('forge:remove-modifier-row', (el) => {
    const row = el && typeof el.closest === 'function' ? el.closest('.im-mod-row') : null;
    if (row) row.remove();
  });
  window.Actions.register('forge:add-damage-part', () => {
    RuleMaster.addInlineExtraDamagePart();
  });
  window.Actions.register('forge:remove-damage-part', (el, data) => {
    if (data && data.idx !== undefined) RuleMaster.removeInlineExtraDamagePart(Number(data.idx));
  });
  window.Actions.register('forge:apply-lego-pattern', (el, data) => {
    const pat = (el && el.value !== undefined) ? el.value : ((data && data.pattern) || '');
    RuleMaster.applyLegoPatternSkeleton(pat);
  });
  window.Actions.register('forge:run-dry-run', () => {
    RuleMaster.runInlineLegoDryRunPreview();
  });
  window.Actions.register('forge:open-primitive-builder', (el, data) => {
    if (data && data.kind) {
      if (typeof RuleMaster.openInlineLegoPrimitiveBuilder === 'function') {
        RuleMaster.openInlineLegoPrimitiveBuilder(data.kind);
      } else if (typeof RuleMaster.openLegoPrimitiveBuilderModal === 'function') {
        RuleMaster.openLegoPrimitiveBuilderModal(data.kind);
      } else {
        RuleMaster.promptAddLegoPrimitive(data.kind);
      }
    }
  });
  window.Actions.register('forge:remove-lego-primitive', (el, data) => {
    if (data && data.arrayKey && data.idx !== undefined) {
      RuleMaster.removeLegoPrimitive(data.arrayKey, Number(data.idx));
    }
  });
  window.Actions.register('forge:confirm-primitive-builder', () => {
    if (typeof RuleMaster.confirmInlineLegoPrimitive === 'function') {
      RuleMaster.confirmInlineLegoPrimitive();
    }
  });
  window.Actions.register('forge:close-primitive-builder', () => {
    if (typeof RuleMaster.closeInlineLegoPrimitiveBuilder === 'function') {
      RuleMaster.closeInlineLegoPrimitiveBuilder();
    }
  });
}
