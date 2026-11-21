/** Central sink for errors that a catch block deliberately survives. Logs; never throws. */
function reportError(context, err) {
  try {
    const log = (reportError._log = reportError._log || []);
    log.push({ context: String(context), message: err && err.message ? String(err.message) : String(err), at: Date.now() });
    if (log.length > 50) log.shift();
    if (typeof console !== 'undefined' && console.warn) console.warn('[reportError] ' + context, err);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const last = log[log.length - 1];
        const stored = readStoredErrorLog();
        stored.push({ context: last.context, message: last.message, at: last.at, page: (typeof location !== 'undefined' && location.pathname) || '' });
        localStorage.setItem('dnd_error_log', JSON.stringify(stored.slice(-50)));
      }
    } catch (_) { /* storage may be full or blocked */ }
  } catch (_) { /* reporting must never throw */ }
}
/** Persisted error entries (survive reloads, shared by the sheet and the Hub). */
function readStoredErrorLog() {
  try {
    const raw = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('dnd_error_log') : null;
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}
function errorLogAsText() {
  return readStoredErrorLog().map(e => [new Date(e.at).toISOString(), e.page || '', e.context, e.message].join(' | ')).join('\n');
}
/** Renders the Settings "Error Log" list; all entry text goes through textContent. */
function renderErrorLog() {
  const section = document.getElementById('error-log-section');
  if (!section) return;
  const list = section.querySelector('[data-error-log-list]');
  const entries = readStoredErrorLog().slice().reverse();
  list.textContent = '';
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'text-[10px] text-slate-400';
    empty.textContent = 'No errors recorded.';
    list.appendChild(empty);
  }
  entries.forEach(e => {
    const row = document.createElement('div');
    row.className = 'text-[10px] text-slate-300 border-b border-slate-800 pb-1.5';
    row.style.overflowWrap = 'anywhere';
    const d = new Date(e.at);
    const time = document.createElement('span');
    time.className = 'text-slate-400 font-mono';
    time.textContent = d.toLocaleTimeString([], { hour12: false }) + ' ' + d.toLocaleDateString() + ' ';
    const ctx = document.createElement('b');
    ctx.className = 'text-white';
    ctx.textContent = String(e.context);
    row.appendChild(time);
    row.appendChild(ctx);
    row.appendChild(document.createElement('br'));
    row.appendChild(document.createTextNode(String(e.message)));
    list.appendChild(row);
  });
  if (section.dataset.wired) return;
  section.dataset.wired = '1';
  section.querySelector('[data-error-log-copy]').addEventListener('click', () => {
    const text = errorLogAsText();
    const done = () => notify('Error log copied', 'success');
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => copyErrorLogFallback(text, done));
    } else copyErrorLogFallback(text, done);
  });
  section.querySelector('[data-error-log-clear]').addEventListener('click', async () => {
    const ok = typeof DnDUI !== 'undefined' && DnDUI.confirm ? await DnDUI.confirm('Clear the error log?') : true;
    if (!ok) return;
    try { localStorage.removeItem('dnd_error_log'); } catch (_) { /* storage blocked */ }
    reportError._log = [];
    renderErrorLog();
  });
}
function copyErrorLogFallback(text, done) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    done();
  } catch (_) { notify('Could not copy the error log', 'error'); }
}
/** Short user message: sheet toast, shared DnDUI/Hub toast, or non-blocking inline banner (never native alert). */
function notify(message, type) {
  const text = String(message == null ? '' : message).replace(/^(?:[\u26A0\u274C\u2705\u2139]\uFE0F?\s*)+/, '');
  if (typeof showToast === 'function') {
    showToast(text, type || 'info', { wrap: true });
    return;
  }
  if (typeof showHubToast === 'function') {
    showHubToast(text, type || 'info');
    return;
  }
  if (typeof DnDUI !== 'undefined' && DnDUI && typeof DnDUI.toast === 'function') {
    DnDUI.toast(text, type || 'info');
    return;
  }
  if (typeof document !== 'undefined' && document.body) {
    const banner = document.createElement('div');
    banner.setAttribute('role', 'status');
    banner.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:10080;max-width:420px;padding:10px 14px;border-radius:10px;background:#0f172a;border:1px solid rgba(139,92,246,.55);color:#f8fafc;font-size:12px;box-shadow:0 12px 28px rgba(0,0,0,.5);white-space:pre-line';
    banner.textContent = text;
    document.body.appendChild(banner);
    setTimeout(() => { try { banner.remove(); } catch (_) { /* ignore */ } }, 4200);
  }
}
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

  // Standardizes any rule, feat, class, item, or Homebrew name into canonical D&D 3.5e Title Case & punctuation
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

    // 2. Check if this is a Homebrew entry / Grant that can be synthesized deterministically
    const isBoonQuery = String(categoryHint || '').toLowerCase().includes('boon')
      || /^(?:homebrew|dm\s*grant|boon|grant)\b/i.test(cleanStr)
      || /\bskill\s*:/i.test(cleanStr);

    if (isBoonQuery && typeof window !== 'undefined' && typeof window.synthesizeHomebrewFromQuery === 'function') {
      const synth = window.synthesizeHomebrewFromQuery(cleanStr, '', 'Homebrew');
      if (synth && synth.name && !/^homebrew$/i.test(synth.name.trim())) {
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

    // 5. Extract and normalize Homebrew prefix if present
    let boonPrefix = '';
    if (isBoonQuery) {
      cleanStr = cleanStr
        .replace(/^(?:homebrew|dm\s*grant|boon|grant)[\s:\-–—,\.]*/i, '')
        .replace(/^(?:skill|stat|ability|save)[\s:\-–—,\.]*/i, '')
        .trim();
      boonPrefix = 'Homebrew: ';
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

  // Default Item Schema (Pure Canonical V3 Schema: effects[], powers[], choices[], modes[])
  createEmptyEntry(type = 'Weapon') {
    const isWep = type === 'Weapon';
    const isShield = type === 'Shield';
    const isArmor = type === 'Armor';
    const tLow = String(type || 'Feat').toLowerCase();
    const bp = isWep ? 'weapon'
      : ((isArmor || isShield) ? 'armor'
      : (tLow === 'spell' || tLow === 'maneuver' || tLow === 'stance' ? 'spell'
      : (tLow === 'race' || tLow === 'template' ? 'race'
      : (tLow === 'deity' ? 'deity'
      : (tLow === 'domain' ? 'domain'
      : (tLow === 'condition' ? 'buff'
      : (tLow === 'class' ? 'class'
      : (['wondrous item', 'ring', 'potion', 'scroll', 'wand', 'slotless item', 'magic item'].includes(tLow) ? 'wondrous' : 'feat'))))))));
    return {
      schemaVersion: 3,
      id: `custom_${tLow.replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`,
      blueprint: bp,
      name: '',
      type: type,
      slot: isWep ? 'Main Hand' : (isShield ? 'Off-Hand/Shield' : (isArmor ? 'Armor' : 'None')),
      prereq: '-',
      source: 'Homebrew',
      benefit: '',
      text: '',
      description: '',
      action: isWep || type === 'Spell' || type === 'Maneuver' ? 'Standard Action' : 'Passive',
      actionType: this.deriveActionType(isWep || type === 'Spell' || type === 'Maneuver' ? 'Standard Action' : 'Passive', type),
      duration: type === 'Spell' ? 'Instantaneous' : 'Continuous',
      weight: isWep || isArmor || isShield ? 4 : 0,
      cost: isWep || isArmor || isShield ? 10 : 0,
      priceGp: isWep || isArmor || isShield ? 10 : 0,
      weightLb: isWep || isArmor || isShield ? 4 : 0,
      role: isWep ? 'Offense / Weapon' : (isArmor || isShield ? 'Defense / Armor' : 'General'),
      choices: [],
      effects: [],
      powers: [],
      modes: [],
      weapon: isWep ? {
        category: 'Martial',
        handedness: 'One-Handed',
        damageDice: '1d8',
        dmgType: 'Slashing',
        baseCritRange: 20,
        critMultiplier: 2,
        rangeIncrement: null
      } : null,
      armor: (isArmor || isShield) ? {
        armorType: isShield ? 'Shield' : 'Light',
        armorBonus: isShield ? 2 : 4,
        maxDex: isShield ? null : 4,
        acp: isShield ? -1 : -2,
        arcaneSpellFailure: isShield ? 5 : 20,
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

  // Helper: Ensure any external/AI entry is upgraded to Pure Canonical V3 (schemaVersion: 3)
  ensureV2(entry) {
    if (!entry || typeof entry !== 'object') return entry;
    const CANONICAL_UA_FLAWS = new Set([
      'feeble', 'frail', 'inattentive', 'meager fortitude', 'murky-eyed',
      'noncombatant', 'pathetic', 'poor reflexes', 'shaky', 'slow',
      'unreactive', 'vulnerable'
    ]);
    let v2 = entry;
    if (typeof RuleEngine !== 'undefined' && typeof RuleEngine.sanitizeV3Entry === 'function' && (entry.schemaVersion === 3 || Array.isArray(entry.effects))) {
      v2 = RuleEngine.sanitizeV3Entry(entry);
    } else if (typeof window !== 'undefined' && window.SchemaMigrator && typeof window.SchemaMigrator.migrateEntryToV3 === 'function') {
      v2 = window.SchemaMigrator.migrateEntryToV3(entry);
    } else if (entry.schemaVersion !== 3) {
      v2 = Object.assign({}, entry, { schemaVersion: 3 });
      if (!v2.id) {
        v2.id = `entry_${String(v2.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
      }
      if (!Array.isArray(v2.effects)) v2.effects = [];
      if (!Array.isArray(v2.modes)) v2.modes = [];
      if (!Array.isArray(v2.choices)) v2.choices = [];
      if (!v2.ruleFlags || typeof v2.ruleFlags !== 'object') v2.ruleFlags = {};
      delete v2.modifiers;
      delete v2.damageParts;
    }
    if (!Array.isArray(v2.effects)) v2.effects = [];
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

  _cloneV3Mechanics(src) {
    const v3 = this.ensureV2(src) || {};
    const deep = (val, fallback) => {
      if (val === undefined || val === null) return fallback;
      try { return JSON.parse(JSON.stringify(val)); } catch (_) { return fallback; }
    };
    return {
      schemaVersion: 3,
      effects: Array.isArray(v3.effects) ? deep(v3.effects, []) : [],
      powers: Array.isArray(v3.powers) ? deep(v3.powers, []) : [],
      choices: Array.isArray(v3.choices) ? deep(v3.choices, []) : [],
      modes: Array.isArray(v3.modes) ? deep(v3.modes, []) : [],
      ruleFlags: (v3.ruleFlags && typeof v3.ruleFlags === 'object') ? deep(v3.ruleFlags, {}) : {}
    };
  },

  _collectV3Blocks(entry, out = []) {
    if (!entry || typeof entry !== 'object') return out;
    const walk = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const b of arr) {
        if (!b || typeof b !== 'object') continue;
        if (b.type === 'when' && Array.isArray(b.branches)) {
          for (const br of b.branches) {
            if (br && Array.isArray(br.effects)) walk(br.effects);
          }
        } else {
          out.push(b);
        }
      }
    };
    walk(entry.effects);
    if (Array.isArray(entry.powers)) {
      for (const p of entry.powers) {
        if (p && Array.isArray(p.effects)) walk(p.effects);
      }
    }
    return out;
  },

  _getPrimaryBonusType(item, fallback = 'Untyped') {
    if (!item || typeof item !== 'object') return fallback;
    const blocks = this._collectV3Blocks(item);
    const statBlk = blocks.find(b => b.type === 'stat' && b.btype);
    if (statBlk && statBlk.btype) return statBlk.btype;
    if (item.type === 'Weapon' && item.enhancementBonus) return 'Enhancement';
    if (item.type === 'Armor') return 'Armor';
    if (item.type === 'Shield') return 'Shield';
    return fallback;
  },

  _getPrimaryRollSummary(item) {
    if (!item || typeof item !== 'object') return { dice: '', dmgType: '' };
    const blocks = this._collectV3Blocks(item);
    const rollBlk = blocks.find(b => b.type === 'roll' && (b.count || b.die || b.dice || b.formula));
    if (rollBlk) {
      let dice = '';
      if (rollBlk.formula) {
        dice = String(rollBlk.formula);
      } else if (rollBlk.dice) {
        dice = String(rollBlk.dice);
      } else if (rollBlk.count && rollBlk.die) {
        const dieStr = String(rollBlk.die).startsWith('d') ? String(rollBlk.die) : `d${rollBlk.die}`;
        const flatNum = Number(rollBlk.flat) || 0;
        const flatStr = flatNum ? (flatNum > 0 ? `+${flatNum}` : `${flatNum}`) : '';
        dice = `${rollBlk.count}${dieStr}${flatStr}`;
      }
      return { dice, dmgType: rollBlk.dmgType || rollBlk.type || 'Untyped' };
    }
    const wObj = item.weapon || item.weaponStats || {};
    const baseDmg = wObj.damage || wObj.baseDamage || '';
    const dTypes = Array.isArray(wObj.damageType) ? wObj.damageType.join('/')
      : (Array.isArray(wObj.damageTypes) ? wObj.damageTypes.join('/') : (wObj.damageType || ''));
    return { dice: baseDmg, dmgType: dTypes };
  },

  getEntrySummaryPills(entry) {
    if (!entry || typeof entry !== 'object') return [];
    const v3 = this.ensureV2(entry);
    const pills = [];
    const blocks = this._collectV3Blocks(v3);
    const statBlocks = blocks.filter(b => b.type === 'stat');
    const rollBlocks = blocks.filter(b => b.type === 'roll');
    const defBlocks = blocks.filter(b => b.type === 'defense');
    const modes = Array.isArray(v3.modes) ? v3.modes : [];

    const targetLabelMap = {
      'ability.str': 'STR', 'str': 'STR',
      'ability.dex': 'DEX', 'dex': 'DEX',
      'ability.con': 'CON', 'con': 'CON',
      'ability.int': 'INT', 'int': 'INT',
      'ability.wis': 'WIS', 'wis': 'WIS',
      'ability.cha': 'CHA', 'cha': 'CHA',
      'ac': 'AC', 'ac.total': 'AC', 'ac.armor': 'Armor AC', 'ac.shield': 'Shield AC', 'ac.deflection': 'Defl AC', 'ac.natural': 'Nat AC', 'ac.dodge': 'Dodge AC', 'ac.insight': 'Insight AC', 'ac.sacred': 'Sacred AC',
      'attack.all': 'Atk', 'atk.all': 'Atk', 'attack.melee': 'Melee Atk', 'atk.melee': 'Melee Atk', 'attack.ranged': 'Ranged Atk', 'atk.ranged': 'Ranged Atk', 'atk.weapon': 'Weapon Atk', 'atk': 'Atk',
      'damage.all': 'Dmg', 'dmg.all': 'Dmg', 'damage.melee': 'Melee Dmg', 'dmg.melee': 'Melee Dmg', 'damage.ranged': 'Ranged Dmg', 'dmg.ranged': 'Ranged Dmg', 'dmg': 'Dmg',
      'save.all': 'All Saves', 'save.fort': 'Fort', 'save.ref': 'Ref', 'save.will': 'Will', 'fort': 'Fort', 'ref': 'Ref', 'will': 'Will',
      'init': 'Init', 'initiative': 'Init', 'speed.land': 'ft Speed', 'speed': 'ft Speed', 'hp': 'HP', 'hp.max': 'Max HP', 'casterlevel': 'CL', 'casterLevel': 'CL', 'skill.all': 'Skills', 'grapple': 'Grapple'
    };

    const armorBaseAc = Number((v3.armor && v3.armor.ac) || (v3.armorStats && v3.armorStats.baseAc)) || 0;
    if (armorBaseAc > 0) {
      const enh = Number(v3.enhancementBonus) || 0;
      const totalAc = armorBaseAc + enh;
      const hasAcMod = statBlocks.some(b => (Array.isArray(b.targets) ? b.targets : [b.target]).some(t => String(t || '').toLowerCase().startsWith('ac')));
      if (!hasAcMod) {
        pills.push(`+${totalAc} ${v3.type === 'Shield' ? 'Shield' : 'Armor'} AC`);
      }
    }

    statBlocks.forEach(b => {
      const targets = Array.isArray(b.targets) && b.targets.length ? b.targets : (b.target ? [b.target] : []);
      if (b.mode === 'replaceStat' && b.toStat) {
        const tgt = targets[0] || b.swapTarget || 'Stat';
        const lbl = targetLabelMap[tgt] || targetLabelMap[String(tgt).toLowerCase()] || this.capitalizeTitle(String(tgt).replace(/\.abilityMod$/i, ''));
        pills.push(`${String(b.toStat).toUpperCase()} ➔ ${lbl}`);
        return;
      }
      targets.forEach(rawT => {
        const rawTarget = String(rawT || '').trim();
        if (!rawTarget) return;
        let label = targetLabelMap[rawTarget] || targetLabelMap[rawTarget.toLowerCase()];
        if (!label) {
          if (rawTarget.toLowerCase().startsWith('skill.')) {
            label = this.capitalizeTitle(rawTarget.slice(6).replace(/[_-]/g, ' '));
          } else {
            label = this.capitalizeTitle(rawTarget);
          }
        }
        if (b.mode === 'formula' && b.formula) {
          pills.push(`${label}: ${b.formula}`);
        } else if (b.mode === 'perCL' && b.value) {
          pills.push(`+${b.value}/${b.per || 1} CL ${label}`);
        } else if (b.value !== undefined && b.value !== null && Number(b.value) !== 0) {
          const v = Number(b.value);
          const sign = v > 0 ? '+' : '';
          pills.push(`${sign}${v} ${label}`);
        }
      });
    });

    rollBlocks.forEach(rb => {
      const diePart = rb.formula
        ? String(rb.formula)
        : (rb.count && rb.die ? `${rb.count}${String(rb.die).startsWith('d') ? rb.die : 'd' + rb.die}` : (rb.dice || ''));
      if (!diePart) return;
      const flatNum = Number(rb.flat) || 0;
      const bonusStr = flatNum ? (flatNum > 0 ? `+${flatNum}` : `${flatNum}`) : '';
      const typeStr = rb.dmgType && rb.dmgType !== 'Untyped' ? ` ${rb.dmgType}` : '';
      const kindIcon = rb.kind === 'Healing' || rb.kind === 'Fast Healing' ? '💚' : '⚔️';
      pills.push(`${kindIcon} ${diePart}${bonusStr}${typeStr}`);
    });

    defBlocks.forEach(db => {
      if (!db.mode) return;
      const valStr = db.value ? ` ${db.value}` : '';
      const whatStr = db.what ? ` (${db.what})` : '';
      pills.push(`🛡️ ${db.mode}${valStr}${whatStr}`);
    });

    const v2 = v3;

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
      .replace(/^(?:special\s*ability|racial\s*trait|class\s*feature|feat|homebrew|boon)\s*:\s*/i, '')
      .replace(/\b(?:deals?|dealing|damage|dmg|takes?|taking|suffers?|usable\s+every|usable\s+once|in\s+a\s+\d|cone\s+of|line\s+of|range\s*:|save\s*:|dc\s*:|recharge\s*:|cooldown\s*:)\b[\s\S]*$/i, '')
      .replace(/[\r\n|,;:\-•()]+$/g, '')
      .trim();
    if (!rawTitle || /^\d+$/.test(rawTitle)) {
      rawTitle = 'Special Ability';
    }

    const effectiveCat = (categoryHint && ['Special Ability', 'Racial Trait', 'Homebrew', 'Class Feature', 'Feat'].includes(categoryHint))
      ? categoryHint
      : 'Special Ability';
    const cleanName = this.standardizeName(rawTitle, effectiveCat === 'Homebrew' ? '' : effectiveCat);

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

    const v3Effects = damageParts.map(dp => {
      const m = String(dp.dice || '').match(/^(\d+)d(\d+)$/i);
      if (m) {
        return {
          type: 'roll',
          kind: 'Damage',
          count: parseInt(m[1], 10) || 1,
          die: `d${parseInt(m[2], 10) || 6}`,
          flat: Number(dp.bonus) || 0,
          dmgType: dp.type || 'Untyped',
          scaling: 'flat'
        };
      }
      return {
        type: 'roll',
        kind: 'Damage',
        formula: dp.dice + (dp.bonus ? (dp.bonus > 0 ? `+${dp.bonus}` : `${dp.bonus}`) : ''),
        dmgType: dp.type || 'Untyped',
        scaling: 'flat'
      };
    });

    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'special_ability';
    return this.ensureV2({
      schemaVersion: 3,
      blueprint: 'feat',
      id: `ability_${slug}`,
      name: cleanName,
      type: effectiveCat === 'Homebrew' ? 'Homebrew' : (effectiveCat === 'Racial Trait' ? 'Racial Trait' : 'Special Ability'),
      category: effectiveCat,
      slot: 'None',
      prereq: '-',
      source: effectiveCat === 'Homebrew' ? 'Homebrew / Campaign Grant' : 'D&D 3.5e Special Ability',
      benefit: benefitSummary,
      description: benefitSummary,
      text: benefitSummary,
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
      effects: v3Effects,
      powers: [],
      choices: [],
      modes: [],
      ruleFlags: {
        isStructuredAbility: true
      },
      tacticalBadges: tacticalBadges
    });
  },

  // Save new or updated entry (Pure Canonical V3)
  saveEntry(entryData, editIndex = -1) {
    if (!entryData || !entryData.name || !entryData.name.trim()) {
      notify('⚠️ Please enter a valid Rule / Item Name.', 'error');
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
        const modeMech = this._cloneV3Mechanics(v2Entry);
        const modeObj = {
          id: `mode_${v2Entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
          name: entryData._modeButtonLabel || v2Entry.name,
          label: entryData._modeButtonLabel || v2Entry.name,
          actionType: v2Entry.actionType || 'standard',
          benefit: v2Entry.benefit || v2Entry.description || '',
          effects: modeMech.effects
        };
        if (modeMech.powers.length) modeObj.powers = modeMech.powers;
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
      notify(`✅ "${v2Entry.name}" updated in Master DB and synced across ${syncCount} character record(s)!`, 'success');
    }

    return true;
  },

  // Synchronize Master DB edits into character inventory and equipped items (Pure Canonical V3)
  syncMasterDbEditToCharacter(oldName, updatedEntry) {
    if (!oldName || !updatedEntry || typeof character === 'undefined' || !character) return 0;
    const v3 = this.ensureV2(updatedEntry);
    const applyV3Fields = (target) => {
      const mech = this._cloneV3Mechanics(v3);
      target.schemaVersion = 3;
      if (v3.blueprint) target.blueprint = v3.blueprint;
      target.effects = mech.effects;
      target.powers = mech.powers;
      target.choices = mech.choices;
      target.modes = mech.modes;
      target.ruleFlags = mech.ruleFlags;
      delete target.modifiers;
      delete target.damageParts;
    };
    let changesCount = 0;
    const cleanOld = oldName.toLowerCase().trim();
    const cleanNew = (v3.name || '').toLowerCase().trim();

    // 1. Sync character.gearPool
    if (Array.isArray(character.gearPool)) {
      character.gearPool.forEach(item => {
        const itemClean = (item.name || '').toLowerCase().trim();
        const masterDbRef = (item.masterDbName || '').toLowerCase().trim();
        if (item.id === v3.id || itemClean === cleanOld || masterDbRef === cleanOld || itemClean === cleanNew) {
          applyV3Fields(item);
          item.id = v3.id || item.id;
          item.baseItemId = v3.baseItemId || item.baseItemId || null;
          item.name = v3.name;
          item.masterDbName = v3.name;
          if (typeof mapEntryToGearCategory === 'function') {
            item.category = mapEntryToGearCategory(v3);
          } else if (v3.type) {
            item.category = v3.type;
          }
          if (v3.slot && v3.slot !== 'None' && v3.slot !== '-') {
            item.slot = v3.slot;
          }
          item.tags = Array.isArray(v3.tags) ? [...v3.tags] : [];
          item.weight = Number(v3.weight) || 0;
          item.cost = Number(v3.cost) || 0;
          item.desc = v3.benefit || v3.description || '';
          item.tacticalBadges = Array.isArray(v3.tacticalBadges) ? [...v3.tacticalBadges] : [];
          if (v3.weapon) item.weapon = JSON.parse(JSON.stringify(v3.weapon));
          if (v3.armor) item.armor = JSON.parse(JSON.stringify(v3.armor));
          if (v3.weaponStats) item.weaponStats = JSON.parse(JSON.stringify(v3.weaponStats));
          if (v3.armorStats) item.armorStats = JSON.parse(JSON.stringify(v3.armorStats));
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
          if (slotObj.id === v3.id || slotClean === cleanOld || slotClean === cleanNew) {
            applyV3Fields(slotObj);
            slotObj.id = v3.id || slotObj.id;
            slotObj.baseItemId = v3.baseItemId || slotObj.baseItemId || null;
            slotObj.name = v3.name;
            slotObj.masterDbName = v3.name;
            slotObj.weight = Number(v3.weight) || 0;
            slotObj.cost = Number(v3.cost) || 0;
            slotObj.desc = v3.benefit || v3.description || '';
            slotObj.actionType = v3.actionType || slotObj.actionType;
            slotObj.tacticalBadges = Array.isArray(v3.tacticalBadges) ? [...v3.tacticalBadges] : [];
            if (v3.armor) slotObj.armor = JSON.parse(JSON.stringify(v3.armor));
            if (v3.armorStats) slotObj.armorStats = JSON.parse(JSON.stringify(v3.armorStats));
            changesCount++;
          }
        }
      });
    }

    // 3. Sync character.weapons
    if (Array.isArray(character.weapons)) {
      character.weapons.forEach(w => {
        const wepClean = (w.name || '').toLowerCase().trim();
        if (w.id === v3.id || wepClean === cleanOld || wepClean === cleanNew) {
          applyV3Fields(w);
          w.id = v3.id || w.id;
          w.baseItemId = v3.baseItemId || w.baseItemId || null;
          w.name = v3.name;
          if (v3.slot) w.slot = v3.slot;
          if (v3.tags) w.tags = Array.isArray(v3.tags) ? [...v3.tags] : [];
          w.enhancementBonus = Number(v3.enhancementBonus) || w.enhancementBonus || 0;
          if (v3.weapon) w.weapon = JSON.parse(JSON.stringify(v3.weapon));
          w.weaponStats = v3.weaponStats ? JSON.parse(JSON.stringify(v3.weaponStats)) : w.weaponStats;
          w.tacticalBadges = Array.isArray(v3.tacticalBadges) ? [...v3.tacticalBadges] : [];
          changesCount++;
        }
      });
      if (character.activeWeapon && (character.activeWeapon.toLowerCase().trim() === cleanOld || character.activeWeapon.toLowerCase().trim() === cleanNew)) {
        character.activeWeapon = v3.name;
      }
    }

    // 4. Sync character.consumables
    if (Array.isArray(character.consumables)) {
      character.consumables.forEach(c => {
        const cClean = (c.name || '').toLowerCase().trim();
        if (cClean === cleanOld || cClean === cleanNew) {
          c.name = v3.name;
          c.effect = v3.benefit || v3.description || c.effect;
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
            return v3.name;
          }
          return f;
        } else if (f && f.name) {
          const fClean = stripTag(f.name);
          if (f.id === v3.id || fClean === cleanOld || fClean === cleanNew) {
            applyV3Fields(f);
            f.id = v3.id || f.id;
            f.name = v3.name;
            f.benefit = v3.benefit || f.benefit;
            if (v3.action) f.action = v3.action;
            if (v3.actionType) f.actionType = v3.actionType;
            if (v3.save) f.save = v3.save;
            if (v3.dcFormula) f.dcFormula = v3.dcFormula;
            if (v3.range) f.range = v3.range;
            if (v3.recharge) f.recharge = v3.recharge;
            if (v3.rechargeDice) f.rechargeDice = v3.rechargeDice;
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
            const mech = this._cloneV3Mechanics(v3);
            return {
              schemaVersion: 3,
              blueprint: v3.blueprint || 'feat',
              id: v3.id,
              name: v3.name,
              type: v3.type || 'Special Ability',
              benefit: v3.benefit || v3.description || '',
              action: v3.action || 'Standard Action',
              actionType: v3.actionType || 'standard',
              effects: mech.effects,
              powers: mech.powers,
              choices: mech.choices,
              modes: mech.modes,
              ruleFlags: mech.ruleFlags,
              save: v3.save || '',
              dcFormula: v3.dcFormula || '',
              range: v3.range || '',
              recharge: v3.recharge || '',
              rechargeDice: v3.rechargeDice || ''
            };
          }
          return a;
        } else if (a && a.name) {
          const aClean = stripTag(a.name);
          if (a.id === v3.id || aClean === cleanOld || aClean === cleanNew) {
            applyV3Fields(a);
            a.id = v3.id || a.id;
            a.name = v3.name;
            a.benefit = v3.benefit || a.benefit;
            if (v3.action) a.action = v3.action;
            if (v3.actionType) a.actionType = v3.actionType;
            if (v3.save) a.save = v3.save;
            if (v3.dcFormula) a.dcFormula = v3.dcFormula;
            if (v3.range) a.range = v3.range;
            if (v3.recharge) a.recharge = v3.recharge;
            if (v3.rechargeDice) a.rechargeDice = v3.rechargeDice;
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
        if (s.id === v3.id || (s.name || '').toLowerCase().trim() === cleanOld || (s.name || '').toLowerCase().trim() === cleanNew) {
          applyV3Fields(s);
          s.id = v3.id || s.id;
          s.name = v3.name;
          s.benefit = v3.benefit || s.benefit;
          if (v3.school) s.school = v3.school;
          changesCount++;
        }
      });
    }

    // 7. Sync character.tomeOfBattle
    if (character.tomeOfBattle) {
      if (Array.isArray(character.tomeOfBattle.readiedManeuvers)) {
        character.tomeOfBattle.readiedManeuvers.forEach(m => {
          if ((m.name || '').toLowerCase().trim() === cleanOld || (m.name || '').toLowerCase().trim() === cleanNew) {
            applyV3Fields(m);
            m.name = v3.name;
            m.notes = v3.benefit || m.notes;
            changesCount++;
          }
        });
      }
      if (Array.isArray(character.tomeOfBattle.stancesKnown)) {
        character.tomeOfBattle.stancesKnown.forEach(st => {
          if ((st.name || '').toLowerCase().trim() === cleanOld || (st.name || '').toLowerCase().trim() === cleanNew) {
            applyV3Fields(st);
            st.name = v3.name;
            st.benefit = v3.benefit || st.benefit;
            changesCount++;
          }
        });
      }
      if (character.activeStance && (character.activeStance.toLowerCase().trim() === cleanOld || character.activeStance.toLowerCase().trim() === cleanNew)) {
        character.activeStance = v3.name;
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
      const matchCat = cat === 'ALL' || item.type === cat || (cat === 'DM Grant' && item.type === 'Homebrew') || (cat === 'Class' && (item.category === 'Class' || item.type === 'Base Class' || item.type === 'Prestige Class' || item.type === 'Custom Class'));
      const itemBonusType = this._getPrimaryBonusType(item, 'Untyped');
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

  async deleteSelectedEntries() {
    if (!Array.isArray(masterDb) || this.selectedIds.size === 0) return;
    const count = this.selectedIds.size;
    if (!(await DnDUI.confirm(`⚠️ Are you sure you want to permanently delete ${count} selected custom entries from this character's Custom DB?`, { tone: 'danger' }))) {
      return;
    }
    if (!Array.isArray(masterDb)) return;
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
  async deleteEntry(index) {
    if (index >= 0 && index < masterDb.length) {
      const rawEntry = masterDb[index];
      const item = this.ensureV2(rawEntry);
      if ((await DnDUI.confirm(`Are you sure you want to permanently delete "${item.name}" from this character's Custom DB?`, { tone: 'danger' }))) {
        // The list may have changed while the dialog was open: delete the entry the player saw, not whatever now sits at that index.
        const currentIndex = Array.isArray(masterDb) ? masterDb.indexOf(rawEntry) : -1;
        if (currentIndex < 0) return;
        const key = this.getEntrySelectionKey(item, currentIndex);
        this.selectedIds.delete(key);
        masterDb.splice(currentIndex, 1);
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

  // Direct 1-click addition from Master DB to Inventory (Pure Canonical V3)
  addToInventory(index) {
    if (index < 0 || index >= masterDb.length || typeof character === 'undefined' || !character) return;
    const item = this.ensureV2(masterDb[index]);
    if (!character.gearPool) character.gearPool = [];

    const inPool = character.gearPool.some(p => p.id === item.id || (p.name || '').toLowerCase() === item.name.toLowerCase());
    if (inPool) {
      notify(`ℹ️ "${item.name}" is already in your inventory!`, 'info');
      return;
    }

    const cat = typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(item) : (item.type || 'Other');
    const isBelt = (item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable';

    character.gearPool.push({
      schemaVersion: 3,
      id: item.id || `gear_${Date.now()}`,
      blueprint: item.blueprint || 'wondrous',
      baseItemId: item.baseItemId || null,
      name: item.name,
      masterDbName: item.name,
      category: cat,
      slot: item.slot && item.slot !== 'None' ? item.slot : cat,
      qty: 1,
      weight: Number(item.weight ?? item.weightLb) || 0,
      cost: Number(item.cost ?? item.priceGp) || 0,
      desc: item.benefit || item.description || '',
      choices: Array.isArray(item.choices) ? JSON.parse(JSON.stringify(item.choices)) : [],
      effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : [],
      powers: Array.isArray(item.powers) ? JSON.parse(JSON.stringify(item.powers)) : [],
      modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
      weapon: item.weapon ? JSON.parse(JSON.stringify(item.weapon)) : undefined,
      armor: item.armor ? JSON.parse(JSON.stringify(item.armor)) : undefined,
      ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {},
      tacticalBadges: Array.isArray(item.tacticalBadges) ? [...item.tacticalBadges] : [],
      isBelt: isBelt,
      isEquipped: false
    });

    if (cat === 'Consumable') {
      if (!character.consumables) character.consumables = [];
      character.consumables.push({ id: item.id, name: item.name, qty: 1, effect: item.benefit || '' });
    }

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof renderConsumables === 'function') renderConsumables();
    notify(`🎒 "${item.name}" added to your backpack / inventory pool!`, 'success');
  },

  // Open Edit / Add in Type-Specific Studio Modal or Pure Canonical V3 Rule Crafter
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

      // 3. Class / Prestige Class / Variant Class -> Dedicated Class Template Studio Modal
      if (
        rawType === 'class' ||
        rawType === 'base class' ||
        rawType === 'prestige class' ||
        rawType === 'custom class' ||
        String(entry.category || '').trim().toLowerCase() === 'class' ||
        rawId.startsWith('class_') ||
        rawId.startsWith('cls_') ||
        rawId.startsWith('cls-')
      ) {
        if (typeof window.openCreateCustomClassModal === 'function') {
          window.openCreateCustomClassModal(entry.name || '', true, entry, editIndex);
          return;
        }
      }
    }

    const v3 = this.ensureV2(entry ? JSON.parse(JSON.stringify(entry)) : this.createEmptyEntry('Feat'));
    if (options && options.changeAndAddMode) {
      const baseSlug = String(v3.name || 'custom').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom';
      v3.id = `${v3.blueprint || 'feat'}-${baseSlug}-custom`;
      delete v3._fromLocalSiteDb;
      delete v3._localSourceLabel;
    }
    this.selectedEntryIndex = editIndex;
    this._currentEditingEntry = v3;
    this.openMasterDbRuleCrafter(v3);
  },

  // Master DB → Rule Crafter launcher. Every save lands in Master DB (character.customDb)
  // in addition to the scope chosen inside the Crafter (character override / campaign library).
  openMasterDbRuleCrafter(entry = null) {
    if (!window.DnDUI || typeof window.DnDUI.openRuleCrafter !== 'function') return false;
    const originalId = entry && entry.id ? entry.id : undefined;
    window.DnDUI.openRuleCrafter({
      entry: entry || undefined,
      originalId,
      allowCharacterScope: true,
      context: { allowCharacterScope: true },
      onSave: (msg) => this.saveCrafterEntryToMasterDb(msg, originalId)
    });
    return true;
  },

  saveCrafterEntryToMasterDb(msg, originalId = null) {
    if (!msg || !msg.entry || !msg.entry.name) return false;
    const origId = msg.originalId || originalId || null;
    let saved = null;
    const bridge = window.CharStore && window.CharStore.StudioBridge;
    if (bridge && typeof bridge.saveFromCrafter === 'function') {
      const res = bridge.saveFromCrafter(msg.entry, {
        saveScope: msg.saveScope,
        originalId: origId,
        context: Object.assign({ allowCharacterScope: true }, msg.context || {})
      });
      if (res && res.ok && res.entry) saved = res.entry;
    }
    if (!saved) {
      saved = JSON.parse(JSON.stringify(msg.entry));
      saved.schemaVersion = 3;
      if (!saved.id) saved.id = origId || ('crafted_' + String(saved.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''));
    }
    if (typeof masterDb === 'undefined' || !Array.isArray(masterDb)) return false;
    const db = masterDb;
    const idx = db.findIndex(m => m && (m.id === saved.id || (origId && m.id === origId)));
    if (idx >= 0) db[idx] = saved;
    else db.unshift(saved);
    if (typeof character !== 'undefined' && character && character.customDb !== db) character.customDb = db;
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    if (typeof renderAll === 'function') renderAll();
    notify(`✅ "${saved.name}" saved to Master DB.`, 'success');
    return true;
  },

  closeMasterDbEditorModal() {
    const modal = document.getElementById('modal-master-db-editor');
    if (modal) modal.classList.add('hidden');
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
    if (typeof window !== 'undefined' && window.SrdCompendium && typeof window.SrdCompendium.getAllLoaded === 'function') {
      window.SrdCompendium.getAllLoaded().forEach(m => {
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
          row.addEventListener('mousedown', (e) => {
            e.preventDefault();
            selectItem(item);
          });
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

  async applySnapshotUpdate(id) {
    if (!id || typeof SrdCompendium === 'undefined' || typeof SrdCompendium.applySnapshotUpdate !== 'function') return;
    const db = (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) ? masterDb : null;
    const entry = db ? db.find(e => e && e.id === id) : null;
    if (!entry) return;
    if (!(await DnDUI.confirm(`Replace "${entry.name}" with the current SRD version? Your edits to this copy will be discarded.`, { tone: 'danger' }))) return;
    if (masterDb !== db) return;
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

      const matchCat = cat === 'ALL' || item.type === cat || (cat === 'DM Grant' && item.type === 'Homebrew') || (cat === 'Class' && (item.category === 'Class' || item.type === 'Base Class' || item.type === 'Prestige Class' || item.type === 'Custom Class'));
      const itemBonusType = this._getPrimaryBonusType(item, 'Untyped');
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
      const primaryBonusType = this._getPrimaryBonusType(item, 'Untyped');

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
          <input type="checkbox" ${isSelected ? 'checked' : ''} data-change-action="rm:toggle-select-entry" data-key="${RuleMaster.escapeHtml(selKey)}" class="w-3.5 h-3.5 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer" title="Select entry for export or batch actions">
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
            <button data-action="rm:open-modal" data-idx="${idx}" class="ui-btn-icon w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition inline-flex items-center justify-center cursor-pointer" title="${isDeity ? 'Edit in Deity Editor' : (isDomain ? 'Edit in Domain Editor' : (isClass ? 'Edit in Class Template Studio' : 'Edit'))}">
              ✏️
            </button>
            ${isDeity ? `
              <button data-action="rm:select-deity" data-deity-name="${RuleMaster.escapeHtml(item.name || '')}" class="ui-btn-icon w-7 h-7 rounded-md bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-300 text-xs transition inline-flex items-center justify-center cursor-pointer" title="Select as Character Deity">
                🙏
              </button>
            ` : ''}
            <button data-action="rm:duplicate-entry" data-idx="${idx}" class="ui-btn-icon w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs transition inline-flex items-center justify-center cursor-pointer" title="Duplicate">
              📑
            </button>
            <button data-action="rm:delete-entry" data-idx="${idx}" class="ui-btn-icon w-7 h-7 rounded-md bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs transition inline-flex items-center justify-center cursor-pointer" title="Delete">
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
    } catch (e) { reportError('rule_master:switchSubTab', e); }
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
    } catch (e) { reportError('rule_master:init', e); }
    if (savedSubTab === 'subtab-mdb-tree') savedSubTab = 'subtab-mdb-list';
    if (savedSubTab && document.getElementById(savedSubTab)) {
      this.switchSubTab(savedSubTab);
    } else {
      this.renderTable();
    }
    this.updateApiKeyUi();
  },

  // ====================================================
  // GEMINI AI RULE IMPORTER (DYNAMIC MODEL AUTO-DISCOVERY)
  // ====================================================
  lastAiResults: [],
  _cachedModels: null,

  DND35_RAW_GUARDRAIL: `D&D 3.5E RAW + SPLATBOOK / VARIANT / ACF / HOMEBREW ENGINE RULES:
1. BROAD D&D 3.5E SOURCES (CORE + SPLATBOOKS + UNEARTHED ARCANA + DRAGON MAGAZINE):
   - Because standard core rules are already in the local compendium, queries sent to Rule Master often target extended D&D 3.5e sources, variants, or Homebrew:
     a) Official System Reference Document (SRD v3.5) & Unearthed Arcana (Class Variants like Adventurer/Martial Rogue, Cloistered Cleric, Thug Fighter, Domain Wizard, Urban Ranger, Whirling Frenzy, Flaws, Traits, Bloodlines)
     b) Official D&D 3.5e Rulebooks & Splatbooks (Player's Handbook I & II, DMG I & II, Monster Manual I-V, Complete Warrior/Arcane/Divine/Adventurer/Mage/Scoundrel/Champion, Spell Compendium, Magic Item Compendium, Tome of Battle, Tome of Magic, Frostburn, Sandstorm, Stormwrack, Libris Mortis, Lords of Madness, Heroes of Horror/Battle, Book of Exalted Deeds, Book of Vile Darkness, Expanded Psionics Handbook, Complete Psionic, Magic of Incarnum, Races of Stone/Destiny/the Wild/the Dragon, Dungeonscape, Cityscape, Planar Handbook, Dragon Magic, Draconomicon, Fiendish Codex I & II, Champions of Valor/Ruin, Forgotten Realms / Eberron 3.5e books)
     c) Official Alternate Class Features (ACFs), Racial Substitution Levels, Tactical/Reserve/Regional/Heritage Feats, and Dragon Magazine Compendium / Dragon Magazine 3.5e issues.
2. HOMEBREW, SKILL/STAT GRANTS & CAMPAIGN CUSTOMIZATIONS:
   - If the query asks for a Homebrew, Skill Bonus, Ability/Save/Attack/AC Grant, or Campaign Feature (e.g., "boon, skill: +ride", "Homebrew: +4 Ride", "+2 Initiative", "Boon: CL +1"), DO NOT reject it and NEVER force-map it to an unrelated PHB feat (such as mapping a Ride skill boon to "Mounted Combat").
   - Instead, synthesize a clean Pure Canonical V3 (schemaVersion: 3) entry with exact "effects" blocks (e.g. [{"type": "stat", "targets": ["skill.ride"], "mode": "flat", "value": 4, "btype": "Untyped"}]) and source "Homebrew / Campaign Grant".
3. ZERO 5E / 4E / PATHFINDER MECHANICS:
   - Absolutely NO 5e mechanics (No Advantage/Disadvantage, No Bonus Action, No Finesse adding Dex to damage, No -5/+10 GWM, No Short Rest, No Concentration slots).
   - Absolutely NO Pathfinder / PF1e / Starfinder rules or DandWiki forum inventions unless explicitly requested as a Homebrew/Custom rule.
4. OFFICIAL 3.5E ENGLISH, NAME STANDARDIZATION & NO DICE EMOJI (U+1F3B2):
   - Output 100% official D&D 3.5e RAW English terminology in all fields.
   - STANDARDIZE ALL NAMES ("name" field): Always convert messy user input into clean, canonical D&D 3.5e Title Case:
     * Homebrew / Grants -> "Homebrew: Ride (+4)", "Homebrew: Initiative (+2)"
     * Targetable Feats -> "Weapon Focus", "Skill Focus" (use choices[] for player selection)
     * Class Variants -> "Rogue (Adventurer Variant)", "Cleric (Cloistered Cleric)"
   - NEVER output placeholder names like "Non-Existent Class" or "Unknown".
   - NEVER include the 6-sided die emoji (U+1F3B2) anywhere in any string.`,

  V3_MECHANICS_CONTRACT: `PURE CANONICAL V3 MECHANICS CONTRACT (schemaVersion: 3 — STRICT):
- BANNED V2 KEYS: NEVER emit "modifiers", "damageParts", "defenses", or "resources" anywhere! All mechanics live ONLY in "effects", "choices", "powers", and "modes".
- "effects" block types:
  1. Stat bonus/penalty: {"type": "stat", "targets": ["ac.deflection"|"ac.natural"|"ac.dodge"|"ac.armor"|"ac.shield"|"ac.sacred"|"ac.insight"|"ac.total"|"atk.all"|"atk.melee"|"atk.ranged"|"atk.weapon"|"dmg.all"|"dmg.melee"|"dmg.ranged"|"save.fort"|"save.ref"|"save.will"|"save.all"|"str"|"dex"|"con"|"int"|"wis"|"cha"|"initiative"|"grapple"|"cmd.stability"|"speed.land"|"casterLevel"|"caster.spellPenetration"|"spell.dc"|"hp.max"|"skill.spot"|"skill.move-silently"|"skill.use-magic-device"|...], "mode": "flat", "value": 2, "btype": "Untyped"|"Enhancement"|"Deflection"|"Natural Armor"|"Dodge"|"Resistance"|"Morale"|"Luck"|"Insight"|"Sacred"|"Profane"|"Competence"|"Circumstance"|"Alchemical"|"Racial"|"Size"|"Armor"|"Shield"|"Inherent"|"Penalty", "recipient": "self"|"ally"|"enemy"} (omit "recipient" or set "self" for bearer/caster buffs; set "ally" or "enemy" for party auras / enemy debuffs like Prayer or Aura of Despair so enemy/ally effects never pollute self totals).
     * CLamped per-CL scaling: {"type": "stat", "targets": ["atk.all", "dmg.all"], "mode": "perCL", "value": 1, "per": 3, "min": 1, "max": 3, "btype": "Luck"}
     * Base + capped formula (Shield of Faith style): {"type": "stat", "targets": ["ac.deflection"], "mode": "formula", "formula": "2 + min(3, floor(@cl / 6))", "btype": "Deflection"}
     * Ability / Stat Swap (A -> B): {"type": "stat", "mode": "replaceStat", "swapTarget": "atk.ranged.abilityMod"|"atk.melee.abilityMod"|"atk.thrown.abilityMod"|"dmg.melee.abilityMod"|"save.will.abilityMod"|"save.ref.abilityMod"|"save.fort.abilityMod"|"ac.abilityMod"|"initiative.abilityMod"|"hp.abilityMod"|"grapple.abilityMod"|"skill.<slug>.abilityMod", "targets": ["<same as swapTarget>"], "subOp": "max"|"replace"|"add", "fromStat": "str"|"dex"|"con"|"int"|"wis"|"cha", "toStat": "str"|"dex"|"con"|"int"|"wis"|"cha"|"@level"|"@classLevel"|"@cl", "swapScope": "all"|"finessable"|"simple_or_natural"|"thrown"|"bow_or_crossbow"|"chosen_weapon"|"discipline_weapons"|"light_or_no_armor"|"not_flat_footed"|"mind_affecting", "btype": "Untyped"}
  2. Dice / Damage / Healing / Fast Healing: {"type": "roll", "kind": "Damage"|"Healing"|"Temp HP"|"Fast Healing", "count": 2, "die": "d6", "flat": 0, "dmgType": "Fire"|"Cold"|"Acid"|"Electricity"|"Sonic"|"Force"|"Holy"|"Unholy"|"Precision"|"Slashing"|"Piercing"|"Bludgeoning"|"Untyped", "scaling": "flat"|"perCL", "per": 1, "max": 10}
  3. Defenses & Senses: {"type": "defense", "mode": "DR"|"Spell Resistance"|"Energy Resistance"|"Immunity"|"Condition Immunity"|"Sense / Movement"|"Concealment %", "what": "cold iron"|"Fire"|"Sleep"|"Darkvision 60 ft.", "value": 10}
  4. Pool / Daily Resource: {"type": "resource", "name": "Ability Uses", "varKey": "ability_uses", "resMode": "spend", "scaling": "flat", "max": 3, "reset": "perDay"|"perEncounter"|"cooldown"}
  5. Metamagic / Spell Carrier: {"type": "carrier", "carrierMode": "metamagic", "maxSpellLvl": 2, "costMode": "slot"|"sudden"|"passive", "transform": "empower"|"maximize"|"extend"|"quicken"|"enlarge"|"widen"|"custom"}
  6. Rule Switch / Narrative Rule: {"type": "effect", "effectKind": "ruleSwitch", "flag": "noAutoFailFortSaveOnNat1"|"shieldToTouchAc"|"monkeyGrip"|"naturalSpell"|"uncannyDodge"|"ignoreArmorSpeedPenalty"|"oneHandedOffHandAsLight"} OR {"type": "effect", "effectKind": "rule", "label": "Rule Summary", "text": "..."}
  7. Conditional "when" (CLOSED VOCABULARY!): {"type": "when", "flow": "while", "branches": [{"condKind": "state"|"situational"|"wieldingChosenWeapon"|"wieldingChosenShield"|"castingChosenSchool"|"notFlatFooted", "condText": "...", "effects": [...]}]}
     * CRITICAL: Use condKind "state" ONLY when condText is in the closed vocabulary ("charging", "flanking", "fightingDefensively", "totalDefense", "powerAttack", "combatExpertise", "higherGround", "pointBlankShot", "toggle:<key>", "stance:<name>", "@level >= N", "alignment:evil", "alignment:good", "alignment:lawful", "alignment:chaotic", "unarmored & noShield"). For ANY other condition ("vs. poison", "against giants", "in shadowy illumination"), you MUST set "condKind": "situational"!
- "choices": [{"id": "ch-weapon", "key": "weapon"|"skill"|"ability"|"energy"|"school"|"custom", "label": "Chosen Weapon", "count": 1}]
- "powers": [{"id": "pw-slug", "kind": "inline"|"attached", "name": "Breath Weapon (Su)", "action": "Standard"|"Move"|"Swift"|"Immediate"|"Free"|"Full-Round", "usage": {"mode": "perDay"|"perEncounter"|"atwill"|"cooldown"|"resourcePool", "uses": 3, "recharge": "1d4"}, "area": "30-ft. Cone", "dcFormula": "10 + 1/2 HD + Con", "save": {"type": "Reflex", "effect": "Half"}, "effects": [...]}]
- "modes": [{"id": "mode-off", "name": "Inactive", "label": "Inactive", "effects": []}, {"id": "mode-slug", "name": "Mode Label", "label": "Mode Label", "effects": [...]}] (for mutually exclusive selectable combat sheet modes).`,

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
  _busyGeminiModels: new Map(),
  _BUSY_GEMINI_MODEL_TTL_MS: 3 * 60 * 1000,
  _ROUTING_MATRIX_VERSION: 2,
  _retiredGeminiModelsLoaded: false,
  _RETIRED_GEMINI_MODELS_KEY: 'dnd35_gemini_retired_models',
  _RETIRED_GEMINI_MODEL_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  // Used only when the live model list cannot be fetched.
  _fallbackGeminiModels: ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'],

  markGeminiModelBusy(model) {
    const lower = String(model || '').toLowerCase().trim();
    if (!lower) return;
    this._busyGeminiModels.set(lower, Date.now() + this._BUSY_GEMINI_MODEL_TTL_MS);
  },

  isGeminiModelBusy(model) {
    const lower = String(model || '').toLowerCase().trim();
    if (!lower || !this._busyGeminiModels.has(lower)) return false;
    const exp = this._busyGeminiModels.get(lower);
    if (Date.now() >= exp) {
      this._busyGeminiModels.delete(lower);
      return false;
    }
    return true;
  },

  isGeminiModelBusyError(status, message) {
    const lower = String(message || '').toLowerCase();
    return status === 503 || status === 429 ||
      lower.includes('high demand') ||
      lower.includes('overloaded') ||
      lower.includes('resource_exhausted') ||
      lower.includes('unavailable') ||
      lower.includes('timeout') ||
      lower.includes('aborterror');
  },

  // Models the API refused as retired are remembered for a week, so they are not tried first again
  // after every reload. The API can still list a model it no longer serves to this key.
  _loadRetiredGeminiModels() {
    if (this._retiredGeminiModelsLoaded) return;
    this._retiredGeminiModelsLoaded = true;
    try {
      const saved = JSON.parse(localStorage.getItem(this._RETIRED_GEMINI_MODELS_KEY) || '{}');
      const now = Date.now();
      Object.keys(saved || {}).forEach(model => {
        if (now - Number(saved[model]) < this._RETIRED_GEMINI_MODEL_TTL_MS) this._failedGeminiModels.add(model);
      });
    } catch (e) {
      console.warn('Could not read the retired Gemini model list:', e.message);
    }
  },

  markGeminiModelRetired(model) {
    const lower = String(model || '').toLowerCase().trim();
    if (!lower) return;
    this._loadRetiredGeminiModels();
    this._failedGeminiModels.add(lower);
    this._discoveredApiModels = null;
    this._cachedTaskModels = {};
    try {
      const saved = JSON.parse(localStorage.getItem(this._RETIRED_GEMINI_MODELS_KEY) || '{}') || {};
      saved[lower] = Date.now();
      localStorage.setItem(this._RETIRED_GEMINI_MODELS_KEY, JSON.stringify(saved));
      localStorage.removeItem('dnd35_gemini_discovered_models');
      localStorage.removeItem('dnd35_gemini_routing_matrix');
    } catch (e) {
      console.warn('Could not save the retired Gemini model list:', e.message);
    }
  },

  isGeminiModelRetiredError(status, message) {
    const lower = String(message || '').toLowerCase();
    return status === 404 ||
      lower.includes('not found') ||
      lower.includes('no longer available') ||
      lower.includes('deprecated') ||
      lower.includes('is not supported');
  },

  // Task models first, then the other usable models of the live list (flash/lite before unknown families, newest first),
  // pushing temporarily busy/overloaded models to the back without deleting them.
  _expandGeminiCandidates(taskModels, maxModels = 6) {
    const verOf = (name) => {
      const match = String(name || '').match(/gemini-(\d+(?:\.\d+)?)-/i);
      return match ? parseFloat(match[1]) : 0;
    };
    const familyRank = (name) => {
      const l = String(name || '').toLowerCase();
      if (l.includes('flash')) return 2;
      if (l.includes('pro')) return 1;
      return 0;
    };
    const isLite = (name) => (String(name || '').toLowerCase().includes('lite') ? 1 : 0);
    const out = [];
    (taskModels || []).forEach(m => { if (m && !this._isDeprecatedGeminiModel(m) && !out.includes(m)) out.push(m); });
    let discovered = Array.isArray(this._discoveredApiModels) ? this._discoveredApiModels : null;
    if (!discovered) {
      try {
        const parsed = JSON.parse(localStorage.getItem('dnd35_gemini_discovered_models') || 'null');
        if (Array.isArray(parsed)) discovered = parsed;
      } catch (e) {
        discovered = null;
      }
    }
    (discovered || [])
      .filter(m => m && !this._isDeprecatedGeminiModel(m) && !out.includes(m))
      .sort((a, b) => (familyRank(b) - familyRank(a)) || (verOf(b) - verOf(a)) || (isLite(b) - isLite(a)))
      .forEach(m => out.push(m));
    const fresh = [];
    const busy = [];
    out.forEach(m => {
      if (this.isGeminiModelBusy(m)) busy.push(m);
      else fresh.push(m);
    });
    return fresh.concat(busy).slice(0, maxModels);
  },

  // One readable message for a failed query: the real failure first, retired models as a note.
  _summarizeGeminiErrors(attempts) {
    const list = Array.isArray(attempts) ? attempts : [];
    if (list.length === 0) return '';
    const norm = list.map(a => (typeof a === 'string'
      ? { model: '', message: a, retired: false }
      : { model: a?.model || '', message: a?.message || String(a || ''), retired: Boolean(a?.retired) }
    ));
    const retired = norm.filter(a => a.retired).map(a => a.model).filter(Boolean);
    const other = norm.filter(a => !a.retired);
    if (other.length === 0) {
      return `Every model that was tried is retired for this API key (${retired.join(', ')}). Open Settings and refresh the Gemini model list.`;
    }
    const last = other[other.length - 1];
    const note = retired.length > 0 ? ` Skipped retired models: ${retired.join(', ')}.` : '';
    return `${last.message || 'Unknown Gemini API error'}${note}`;
  },

  _isDeprecatedGeminiModel(m) {
    if (!m || typeof m !== 'string') return true;
    const lower = m.toLowerCase().trim();
    this._loadRetiredGeminiModels();
    if (this._failedGeminiModels && this._failedGeminiModels.has(lower)) return true;
    return /^gemini-(?:1\.0|1\.5|2\.0)(?:-|$)/i.test(lower) ||
           /^gemini-2\.5-pro(?:-|$)/i.test(lower) ||
           /^gemini-3\.0-flash(?:-|$)/i.test(lower) ||
           /(?:^|-)(?:exp|vision|aqa|live-preview|customtools)(?:-|$)/i.test(lower);
  },

  // Helper: Sanitize and deduplicate models cascade, using pure dynamic models when available and fallbackList only when empty
  _sanitizeModelList(list) {
    const fallbackList = this._fallbackGeminiModels;
    let discovered = Array.isArray(this._discoveredApiModels) ? this._discoveredApiModels : null;
    if (!discovered) {
      try {
        const raw = localStorage.getItem('dnd35_gemini_discovered_models');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) discovered = parsed;
        }
      } catch (e) { reportError('rule_master:_sanitizeModelList', e); }
    }
    const cleanDiscovered = Array.isArray(discovered)
      ? discovered.filter(m => m && !this._isDeprecatedGeminiModel(m))
      : [];
    let validInput = (list || []).filter(m => m && !this._isDeprecatedGeminiModel(m));
    if (cleanDiscovered.length > 0) {
      const inDiscovered = validInput.filter(m => cleanDiscovered.includes(m));
      validInput = inDiscovered.length > 0 ? inDiscovered : cleanDiscovered;
    }
    return [...new Set(validInput.length > 0 ? validInput : fallbackList.filter(m => !this._isDeprecatedGeminiModel(m)))];
  },

  // Dynamically builds the 3-tier / 9-slot routing matrix strictly from live discovered API models (falls back to static list only if apiModels is empty)
  buildDynamicRoutingFromModels(apiModels = []) {
    function parseVer(name) {
      const match = (name || '').match(/gemini-(\d+(?:\.\d+)?)-/i);
      return match ? parseFloat(match[1]) : 0.0;
    }
    const fallbackList = this._fallbackGeminiModels;
    const cleanedModels = (Array.isArray(apiModels) ? apiModels.slice() : [])
      .filter(m => m && !this._isDeprecatedGeminiModel(m));
    const sourceModels = cleanedModels.length > 0 ? cleanedModels : fallbackList;
    const sorted = sourceModels.slice().sort((a, b) => parseVer(b) - parseVer(a));

    const liteModels = sorted.filter(m => m.toLowerCase().includes('flash') && m.toLowerCase().includes('lite'));
    const flashModels = sorted.filter(m => m.toLowerCase().includes('flash') && !m.toLowerCase().includes('lite'));
    const proModels = sorted.filter(m => m.toLowerCase().includes('pro'));

    // Newest generation first in every family.
    // Within one generation: QUICK_SEARCH prefers flash-lite -> flash; IMPORT_BATCH prefers flash -> flash-lite.
    const isLite = (m) => (m.toLowerCase().includes('lite') ? 1 : 0);
    const quickModels = [...liteModels, ...flashModels].sort((a, b) => (parseVer(b) - parseVer(a)) || (isLite(b) - isLite(a)));
    const batchModels = [...flashModels, ...liteModels].sort((a, b) => (parseVer(b) - parseVer(a)) || (isLite(a) - isLite(b)));
    const proNewest = proModels[0] || batchModels[0] || sorted[0];

    const pick3 = (candidates) => {
      const pool = [...candidates, ...liteModels, ...flashModels, ...proModels, ...sorted];
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
      routingVersion: this._ROUTING_MATRIX_VERSION,
      QUICK_SEARCH: pick3(quickModels),
      RULE_AUDIT: pick3([proNewest, ...batchModels.slice(0, 2), proModels[1], ...batchModels.slice(2)]),
      IMPORT_BATCH: pick3([...batchModels.slice(0, 3), proNewest])
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
        if (parsed && typeof parsed === 'object' && parsed.routingVersion === this._ROUTING_MATRIX_VERSION && parsed.QUICK_SEARCH && parsed.RULE_AUDIT && parsed.IMPORT_BATCH) {
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
          } catch (e) { reportError('rule_master:getActiveTaskRouting', e); }
          this._discoveredApiModels = null;
        } else {
          return this.buildDynamicRoutingFromModels(discoveredRaw);
        }
      }
    } catch (e) { reportError('rule_master:getActiveTaskRouting', e); }
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

      // Enforce deterministic flash-lite -> flash ordering for QUICK_SEARCH & stamp routingVersion
      validatedMatrix.routingVersion = this._ROUTING_MATRIX_VERSION;
      validatedMatrix.QUICK_SEARCH = this.buildDynamicRoutingFromModels(apiModels).QUICK_SEARCH;

      try {
        localStorage.setItem('dnd35_gemini_routing_matrix', JSON.stringify(validatedMatrix));
      } catch (e) { reportError('rule_master:optimizeModelsWithAi', e); }

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
      try { localStorage.removeItem('dnd35_gemini_discovered_models'); } catch (e) { reportError('rule_master:getAvailableGeminiModels', e); }
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
      } catch (e) { reportError('rule_master:getAvailableGeminiModels', e); }
    }

    try {
      let apiModels = (!forceRefresh && this._discoveredApiModels) ? this._discoveredApiModels : null;
      if (Array.isArray(apiModels) && apiModels.some(m => this._isDeprecatedGeminiModel(m))) {
        apiModels = null;
        this._discoveredApiModels = null;
        try {
          localStorage.removeItem('dnd35_gemini_routing_matrix');
          localStorage.removeItem('dnd35_gemini_discovered_models');
        } catch (e) { reportError('rule_master:getAvailableGeminiModels', e); }
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
        } catch (e) { reportError('rule_master:getAvailableGeminiModels', e); }
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
          } catch (e) { reportError('rule_master:getAvailableGeminiModels', e); }
        }
      }

      if (apiModels && apiModels.length > 0) {
        const dynamicRouting = this.buildDynamicRoutingFromModels(apiModels);
        if (!localStorage.getItem('dnd35_gemini_routing_matrix')) {
          try {
            localStorage.setItem('dnd35_gemini_routing_matrix', JSON.stringify(dynamicRouting));
          } catch (e) { reportError('rule_master:getAvailableGeminiModels', e); }
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
      notify('⚠️ Please enter and save a Gemini API Key first.', 'error');
      return;
    }

    try {
      if (typeof verifySettingsGeminiApiKey === 'function') {
        const ok = await verifySettingsGeminiApiKey(true);
        if (!ok) {
          notify('❌ Could not connect to Gemini API. Please verify your API key.', 'error');
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

      if (typeof document !== 'undefined' && document.body) {
        let diagModal = document.getElementById('rule-master-diag-modal');
        if (!diagModal) {
          diagModal = document.createElement('div');
          diagModal.id = 'rule-master-diag-modal';
          diagModal.setAttribute('role', 'dialog');
          diagModal.setAttribute('aria-modal', 'true');
          diagModal.className = 'fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm';
          document.body.appendChild(diagModal);
        }
        diagModal.innerHTML = `
          <div class="bg-slate-900 border border-purple-500/60 rounded-2xl max-w-xl w-full p-5 space-y-3 shadow-2xl text-white">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 class="font-bold text-sm text-purple-300">🩺 Gemini API Diagnostics &amp; Smart Model Matrix</h3>
              <button type="button" data-action="rm:close-diag-modal" class="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 rounded bg-slate-800 cursor-pointer">✕ Close</button>
            </div>
            <pre class="text-xs text-slate-200 font-mono max-h-96 overflow-y-auto bg-slate-950/90 p-3 rounded-xl border border-slate-800" style="white-space: pre-wrap;">${RuleMaster.escapeHtml(report)}</pre>
          </div>
        `;
        diagModal.classList.remove('hidden');
      } else {
        notify(report, 'info');
      }
    } catch (err) {
      notify(`❌ Diagnostics Error: ${err.message}`, 'error');
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
      notify('⚠️ Please enter a valid Gemini API key.', 'error');
      return;
    }
    this.setApiKey(val);
    notify('✅ Gemini API key saved successfully!', 'success');
  },

  async clearApiKey() {
    if ((await DnDUI.confirm('Are you sure you want to remove the Gemini API key from local storage?', { tone: 'danger' }))) {
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

    // Canonical Name Aliases (resolved directly from Pure V3 SrdCompendium)
    'cleave': 'Cleave',
    'great cleave': 'Great Cleave',
    'power attack': 'Power Attack',
    'weapon finesse': 'Weapon Finesse',
    'shock trooper': 'Shock Trooper',
    'shadow blade': 'Shadow Blade',
    'leap attack': 'Leap Attack',
    'steadfast determination': 'Steadfast Determination',
    'agile shield fighter': 'Agile Shield Fighter',
    'haste': 'Haste',
    'mountain hammer': 'Mountain Hammer'
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

    if (isRowArray && Array.isArray(raw)) {
      if (typeof window !== 'undefined' && window.SchemaMigrator && typeof window.SchemaMigrator.convertRowArrayToV2 === 'function') {
        return this.ensureV2(window.SchemaMigrator.convertRowArrayToV2(raw));
      }
      const cleanName = this.capitalizeTitle(this.cleanArrow(String(raw[0] || '').trim()));
      const normType = this.capitalizeIdentifier(String(raw[1] || 'Feat').trim());
      const diceStr = String(raw[24] || '').trim();
      const rowEffects = [];
      if (diceStr) {
        const dm = diceStr.match(/^(\d+)d(\d+)(?:\s*([+-]\s*\d+))?$/i);
        if (dm) {
          rowEffects.push({
            type: 'roll',
            kind: 'Damage',
            count: parseInt(dm[1], 10) || 1,
            die: `d${parseInt(dm[2], 10) || 6}`,
            flat: dm[3] ? parseInt(dm[3].replace(/\s+/g, ''), 10) || 0 : 0,
            dmgType: 'Untyped',
            scaling: 'flat'
          });
        } else {
          rowEffects.push({ type: 'roll', kind: 'Damage', formula: diceStr, dmgType: 'Untyped', scaling: 'flat' });
        }
      }
      return this.ensureV2({
        schemaVersion: 3,
        name: cleanName,
        type: normType,
        slot: this.capitalizeIdentifier(String(raw[2] || 'None').trim()),
        source: String(raw[4] || 'Core 3.5e').trim(),
        benefit: String(raw[5] || '').trim(),
        description: String(raw[5] || '').trim(),
        text: String(raw[5] || '').trim(),
        scope: this.capitalizeIdentifier(String(raw[7] || 'None / General').trim()),
        action: String(raw[25] || 'Passive').trim(),
        actionType: this.deriveActionType(raw[25], normType).toLowerCase(),
        duration: String(raw[26] || 'Continuous').trim(),
        weight: Number(raw[27]) || 0,
        cost: Number(raw[28]) || 0,
        effects: rowEffects,
        powers: [],
        choices: [],
        modes: []
      });
    }

    const cloned = JSON.parse(JSON.stringify(raw));
    if (cloned.name) {
      cloned.name = this.standardizeName(this.cleanArrow(cloned.name), cloned.category || cloned.type || '');
    }

    let res = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.sanitizeV3Entry === 'function')
      ? RuleEngine.sanitizeV3Entry(cloned)
      : this.ensureV2(cloned);

    if (res && res.name) {
      res.name = this.standardizeName(this.cleanArrow(res.name), res.category || res.type || '');
    }

    if (cloned.type === 'Deity' || res.blueprint === 'deity' || cloned.domains || cloned.portfolio || cloned.rank) {
      res.type = 'Deity';
      res.blueprint = 'deity';
      if (cloned.favoredWeapon && !res.favoredWeapon) res.favoredWeapon = cloned.favoredWeapon;
      if (cloned.weapon && !res.weapon) res.weapon = cloned.weapon;
      if (!res.favoredWeapon && res.weapon) res.favoredWeapon = res.weapon;
      if (!res.weapon && res.favoredWeapon) res.weapon = res.favoredWeapon;
      if (cloned.domains && !res.domains) res.domains = cloned.domains;
      if (!Array.isArray(res.domains) && res.grants && Array.isArray(res.grants.domains)) {
        res.domains = res.grants.domains.map(d => typeof d === 'string' ? d : (d && d.name) || '').filter(Boolean);
      }
      if (!Array.isArray(res.domains)) res.domains = [];
      res.alignment = res.alignment || cloned.alignment || 'Any';
      if (cloned.rank && !res.rank) res.rank = cloned.rank;
      if (cloned.portfolio && !res.portfolio) res.portfolio = cloned.portfolio;
      if (cloned.title && !res.title) res.title = cloned.title;
      if (cloned.icon && !res.icon) res.icon = cloned.icon;
      if (cloned.symbol && !res.symbol) res.symbol = cloned.symbol;
      if (cloned.category && !res.category) res.category = cloned.category;
      if (cloned.source && !res.source) res.source = cloned.source;
      if (cloned.description && !res.description) res.description = cloned.description;
    }

    if (cloned.type === 'Domain' || res.blueprint === 'domain' || (cloned.category && String(cloned.category).toLowerCase().includes('domain'))) {
      res.type = 'Domain';
      res.blueprint = 'domain';
      res.category = cloned.category || res.category || 'Cleric Domain';
      res.source = cloned.source || res.source || 'Spell Compendium';

      const gpFromV3 = res.grants && res.grants.grantedPower;
      if (cloned.grantedPower && typeof cloned.grantedPower === 'object') {
        res.grantedPower = {
          description: cloned.grantedPower.description || (gpFromV3 && gpFromV3.text) || cloned.description || '',
          classSkills: Array.isArray(cloned.grantedPower.classSkills) ? cloned.grantedPower.classSkills : ((gpFromV3 && gpFromV3.classSkills) || []),
          grantedFeats: Array.isArray(cloned.grantedPower.grantedFeats) ? cloned.grantedPower.grantedFeats : ((gpFromV3 && gpFromV3.grantedFeats) || []),
          spellLikeAbilities: Array.isArray(cloned.grantedPower.spellLikeAbilities) ? cloned.grantedPower.spellLikeAbilities : ((gpFromV3 && gpFromV3.spellLikeAbilities) || [])
        };
      } else {
        const descStr = typeof cloned.grantedPower === 'string'
          ? cloned.grantedPower
          : ((gpFromV3 && gpFromV3.text) || cloned.description || (typeof res.text === 'string' ? res.text : '') || '');
        res.grantedPower = {
          description: descStr,
          classSkills: (gpFromV3 && Array.isArray(gpFromV3.classSkills)) ? gpFromV3.classSkills : [],
          grantedFeats: (gpFromV3 && Array.isArray(gpFromV3.grantedFeats)) ? gpFromV3.grantedFeats : [],
          spellLikeAbilities: (gpFromV3 && Array.isArray(gpFromV3.spellLikeAbilities)) ? gpFromV3.spellLikeAbilities : []
        };
      }

      const ladder = (res.grants && Array.isArray(res.grants.spellLadder) && res.grants.spellLadder.length)
        ? res.grants.spellLadder
        : (Array.isArray(cloned.spells) ? cloned.spells : (Array.isArray(cloned.domainSpells) ? cloned.domainSpells : []));
      res.spells = ladder.map((s, idx) => {
        const lvl = Number(s && s.level) || (idx + 1);
        const name = String((s && (s.spell || s.name)) || '').trim();
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return { level: lvl, id: (s && (s.refId || s.id)) || (slug ? `spl-${slug}` : `spl-unknown-${lvl}`), name };
      });
      if (!res.grants || typeof res.grants !== 'object') res.grants = {};
      if (!Array.isArray(res.grants.spellLadder) || res.grants.spellLadder.length === 0) {
        res.grants.spellLadder = res.spells.map(s => ({ level: s.level, spell: s.name, refId: s.id }));
      }
      if (!res.grants.grantedPower) {
        res.grants.grantedPower = {
          name: `${res.name.replace(/\s+Domain$/i, '')} Domain Power`,
          text: res.grantedPower.description || '',
          usage: { mode: 'passive' }
        };
      }
      res.requiredAlignment = Array.isArray(cloned.requiredAlignment) ? cloned.requiredAlignment : [];
      if (cloned.description && !res.description) res.description = cloned.description;
      if (!res.id || res.id.startsWith('entry_')) {
        const domSlug = (res.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        res.id = `dom-${domSlug}`;
      }
      delete res.modifiers;
      delete res.damageParts;
    }

    return res;
  },

  // Dynamic Targeted AI Prompt Builder (Category-Specific Micro-Prompts & Pure Canonical V3 Schema)
  buildTargetedAiPrompt(cleanQuery, effectiveCategory) {
    const cat = String(effectiveCategory || 'ALL').trim().toLowerCase();

    // 1. DEITY / DRACONIC PATRON / CULT POWER / PHILOSOPHY
    if (cat === 'deity' || cat === 'god' || cat === 'patron') {
      return `You are an expert D&D 3.5e Lore & Faith Architect (Deities & Demigods, Faiths and Pantheons, Dragons of Faerûn, Wyrms of the North, Champions of Ruin, Fiendish Codex).
Target query: "${cleanQuery}" (Category: "Deity / Patron").

CRITICAL RULE: NEVER return an empty entries array! Always return 1 complete Pure Canonical V3 Deity/Patron entry in "entries". Infer exact D&D 3.5e Alignment, Favored Weapon, Rank, Icon, Portfolio, and 3 to 5 official Cleric Domains if the figure is a Dragon, Archfiend, or campaign Patron.
NEVER include the 6-sided die emoji (U+1F3B2) anywhere. NEVER emit "modifiers" or "damageParts".

OUTPUT JSON SCHEMA (Pure Canonical V3):
{
  "entries": [
    {
      "schemaVersion": 3,
      "id": "deity-unique-slug",
      "blueprint": "deity",
      "name": "Official 3.5e Name",
      "type": "Deity",
      "title": "Official Epithets / Aliases",
      "category": "Pantheon / Classification",
      "icon": "🐉",
      "rank": "Greater Deity | Intermediate Deity | Lesser Deity | Demigod | Dragon Patron / Cult Power",
      "alignment": "Lawful Good | Chaotic Evil | Neutral Good | Lawful Evil | True Neutral | Any",
      "favoredWeapon": "Longsword",
      "domains": ["Chaos", "Destruction", "Dragon", "Evil", "Water"],
      "grants": {
        "favoredWeapon": "Longsword",
        "domains": [
          { "kind": "ref", "name": "Chaos", "refId": "dom-chaos" }
        ]
      },
      "portfolio": "Summary of portfolio",
      "symbol": "Holy or unholy symbol description",
      "source": "Official 3.5e publication and page",
      "effects": [],
      "description": "Full official lore and description in English"
    }
  ]
}`;
    }

    // 2. DOMAIN / CLERIC DOMAIN
    if (cat === 'domain' || cat === 'cleric domain') {
      return `You are an expert D&D 3.5e Domain & Divine Magic Arbiter (Spell Compendium, Player's Handbook, Complete Divine).
Target query: "${cleanQuery}" (Category: "Domain").

CRITICAL RULE: NEVER return an empty entries array! Return 1 complete Pure Canonical V3 Cleric Domain entry in "entries" with its full 1st–9th spell ladder and granted power mechanics.

${this.V3_MECHANICS_CONTRACT}

OUTPUT JSON SCHEMA (Pure Canonical V3):
{
  "entries": [
    {
      "schemaVersion": 3,
      "id": "dom-unique-slug",
      "blueprint": "domain",
      "name": "Official 3.5e Domain Name",
      "type": "Domain",
      "category": "Cleric Domain",
      "source": "Official 3.5e book and page",
      "text": "Full RAW granted power description in English",
      "description": "Full RAW granted power description in English",
      "requiredAlignment": [],
      "grants": {
        "grantedPower": {
          "name": "Domain Power Name",
          "text": "Full RAW granted power text in English",
          "classSkills": [],
          "grantedFeats": [],
          "spellLikeAbilities": [],
          "usage": { "mode": "passive" }
        },
        "spellLadder": [
          { "level": 1, "spell": "1st-level domain spell", "refId": "spl-1st-spell" },
          { "level": 2, "spell": "2nd-level domain spell", "refId": "spl-2nd-spell" },
          { "level": 3, "spell": "3rd-level domain spell", "refId": "spl-3rd-spell" },
          { "level": 4, "spell": "4th-level domain spell", "refId": "spl-4th-spell" },
          { "level": 5, "spell": "5th-level domain spell", "refId": "spl-5th-spell" },
          { "level": 6, "spell": "6th-level domain spell", "refId": "spl-6th-spell" },
          { "level": 7, "spell": "7th-level domain spell", "refId": "spl-7th-spell" },
          { "level": 8, "spell": "8th-level domain spell", "refId": "spl-8th-spell" },
          { "level": 9, "spell": "9th-level domain spell", "refId": "spl-9th-spell" }
        ]
      },
      "effects": []
    }
  ]
}`;
    }

    // 3. SPELL / POWER
    if (cat === 'spell' || cat === 'power') {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "Spell").

${this.DND35_RAW_GUARDRAIL}

${this.V3_MECHANICS_CONTRACT}

SPELL V3 RULES:
1. Consult d20srd.org, Spell Compendium, PHB, XPH, or official WotC 3.5e publications. Correct misspellings to official D&D 3.5e English names.
2. Put buff/debuff bonuses, defenses, or direct spell dice inside "effects" (and selectable cast variants inside "modes" or energy pickers inside "choices"). Purely narrative utility spells (like Teleport) keep "effects": [].

OUTPUT JSON SCHEMA (Pure Canonical V3):
{
  "entries": [
    {
      "schemaVersion": 3,
      "id": "spl-unique-slug",
      "blueprint": "spell",
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
      "choices": [],
      "effects": [],
      "modes": [],
      "source": "Official 3.5e book and page",
      "benefit": "Concise mechanical summary in English",
      "text": "Full official RAW description in English",
      "description": "Full official RAW description in English"
    }
  ]
}`;
    }

    // 4. FEAT / HOMEBREW / SPECIAL ABILITY / RACIAL TRAIT / FLAW
    if (['feat', 'homebrew', 'boon', 'special ability', 'ability', 'racial trait', 'flaw', 'class bonus feat', 'warlock invocation'].includes(cat)) {
      const isBoonQuery = cat === 'homebrew' || cat === 'boon' || /\b(boon|grant|custom)\b/i.test(cleanQuery) || /\bskill\s*:/i.test(cleanQuery) || /^[+-]\d+\s+[a-z]/i.test(cleanQuery);
      return `You are a master D&D 3.5e Rule Arbiter & Pure Canonical V3 Architect.
Target query: "${cleanQuery}" (Category: "${effectiveCategory || 'Feat'}").

${this.DND35_RAW_GUARDRAIL}

${this.V3_MECHANICS_CONTRACT}

FEAT / ABILITY / HOMEBREW V3 RULES:
1. Consult PHB I & II, Complete Series, Tome of Battle, Unearthed Arcana (Flaws, Traits, ACFs), Races series, Frostburn, Sandstorm, Stormwrack, Libris Mortis, BoED/BoVD, Dragon Magazine Compendium.
2. ${isBoonQuery ? 'THIS IS A HOMEBREW / CUSTOM GRANT REQUEST:' : 'If the query describes a Homebrew, Skill/Stat Grant, or custom feature:'} NEVER map it to an unrelated PHB feat. Build exact V3 "effects" / "powers" / "choices" / "modes" blocks for every benefit described.
3. For weapon/skill/school choice feats (e.g. Weapon Focus), emit "choices" + a "when" block using "wieldingChosenWeapon" or "castingChosenSchool". For ability substitutions (e.g. Zen Archery, Force of Personality, Intuitive Attack), emit a "stat" block with "mode": "replaceStat" and "swapScope". For activated breath weapons or per-day SLAs, emit "powers" (with "dcFormula", "save", "usage", and "effects").

OUTPUT JSON SCHEMA (Pure Canonical V3):
{
  "entries": [
    {
      "schemaVersion": 3,
      "id": "feat-unique-slug",
      "blueprint": "feat",
      "name": "Official 3.5e Name or Homebrew Title",
      "type": "${cat === 'special ability' || cat === 'ability' ? 'Special Ability' : (cat === 'flaw' ? 'Flaw' : (isBoonQuery ? 'Homebrew' : 'Feat'))}",
      "prereq": "Prerequisites or '-'",
      "benefit": "Concise mechanical summary in English",
      "normal": "What a character without this feat can do, or '-'",
      "special": "Special rules or '-'",
      "choices": [],
      "effects": [],
      "powers": [],
      "modes": [],
      "source": "Official 3.5e book and page or 'Homebrew / Campaign Grant'",
      "text": "Full official RAW or Homebrew description in English",
      "description": "Full official RAW or Homebrew description in English"
    }
  ]
}`;
    }

    // 5. WEAPON / ARMOR / SHIELD / WONDROUS ITEM / RING / MAGIC ITEM / AUGMENT CRYSTAL / EQUIPMENT
    if (['weapon', 'armor', 'shield', 'armor / shield', 'wondrous item', 'ring', 'magic item', 'item', 'equipment', 'augment crystal', 'potion', 'scroll', 'wand', 'consumable'].includes(cat)) {
      const bp = cat === 'weapon' ? 'weapon' : ((cat === 'armor' || cat === 'shield' || cat === 'armor / shield') ? 'armor' : (cat === 'augment crystal' ? 'item_mod' : 'wondrous'));
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "${effectiveCategory}").

${this.DND35_RAW_GUARDRAIL}

${this.V3_MECHANICS_CONTRACT}

ITEM / EQUIPMENT V3 RULES:
1. Consult SRD 3.5e, Magic Item Compendium, DMG, PHB, Arms & Equipment Guide, or splatbooks. Correct misspellings to official D&D 3.5e English names.
2. Weapon ("blueprint": "weapon"): populate "weapon": {"category": "Simple"|"Martial"|"Exotic", "handedness": "Unarmed"|"Light"|"One-Handed"|"Two-Handed"|"Ranged", "damageDice": "1d8", "dmgType": "Slashing", "baseCritRange": 19, "critMultiplier": 2, "rangeIncrement": null} plus "weaponMeta" for legacy display; put extra magic riders in "effects" / "powers".
3. Armor / Shield ("blueprint": "armor"): populate "armor": {"armorType": "Light"|"Medium"|"Heavy"|"Shield", "armorBonus": 4, "maxDex": 4, "acp": -2, "arcaneSpellFailure": 20, "speed30": 30, "speed20": 20}; put special magic properties in "effects" / "powers".
4. Wondrous Items / Rings / Crystals / Scrolls / Wands / Potions:
   - Put all continuous bonuses and defenses in "effects" and activated abilities in "powers". NEVER emit "modifiers" or "damageParts".
   - Scrolls, Wands, Potions & Oils (DMG Table 7-17 / 7-23 / p.285): ALWAYS craft official spell-completion / spell-trigger items (e.g. "Scroll of Fireball", "Wand of Cure Light Wounds", "Potion of Haste") using exact DMG 3.5e RAW formulas: Scroll priceGp = (spellLevel || 0.5) * minCasterLevel * 25, Wand priceGp = (spellLevel || 0.5) * minCasterLevel * 750 (50 charges), Potion priceGp = (spellLevel || 0.5) * minCasterLevel * 50. Set "type": "Scroll"|"Wand"|"Potion", "slot": "Consumable", and attach the spell in "powers": [{"id": "pw-item-cast", "kind": "attached", "name": "<Spell Name>", "refId": "spl-<slug>", "action": "Standard", "casterLevel": 5, "saveDC": 14, "usage": {"mode": "charges", "uses": 1}}].

OUTPUT JSON SCHEMA (Pure Canonical V3):
{
  "entries": [
    {
      "schemaVersion": 3,
      "id": "item-unique-slug",
      "blueprint": "${bp}",
      "name": "Official 3.5e Name",
      "type": "${['weapon', 'armor', 'shield', 'ring', 'augment crystal'].includes(cat) ? (cat === 'armor / shield' ? 'Armor' : effectiveCategory) : 'Wondrous Item'}",
      "slot": "None",
      "priceGp": 0,
      "weightLb": 0,
      "crystalTier": null,
      "crystalSlot": null,
      "weapon": null,
      "armor": null,
      "choices": [],
      "effects": [],
      "powers": [],
      "modes": [],
      "source": "Official 3.5e book and page",
      "benefit": "Concise mechanical summary in English",
      "text": "Full official RAW description in English",
      "description": "Full official RAW description in English"
    }
  ]
}`;
    }

    // 6. RACE / TEMPLATE
    if (cat === 'race' || cat === 'template') {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "Race").

${this.DND35_RAW_GUARDRAIL}

${this.V3_MECHANICS_CONTRACT}

RACE / TEMPLATE V3 RULES:
1. Consult Monster Manual, PHB, Races of Stone/Destiny/the Wild/the Dragon, Frostburn, Sandstorm, Stormwrack, Planar Handbook, or Forgotten Realms/Eberron 3.5e books.
2. Put racial ability adjustments ("targets": ["dex"], "btype": "Racial"), skill bonuses, natural armor, Darkvision/Low-Light ("defense" mode "Sense / Movement"), immunities, resistances, and SLA resource pools inside "effects", and activated breath weapons / SLAs inside "powers".

OUTPUT JSON SCHEMA (Pure Canonical V3):
{
  "entries": [
    {
      "schemaVersion": 3,
      "id": "race-unique-slug",
      "blueprint": "race",
      "name": "Official 3.5e Name",
      "type": "${cat === 'template' ? 'Template' : 'Race'}",
      "size": "Medium",
      "baseSpeed": 30,
      "vision": "Normal",
      "favoredClass": "Any",
      "levelAdjustment": 0,
      "race": {
        "kind": "${cat === 'template' ? 'template' : 'race'}",
        "size": "Medium",
        "speed": 30,
        "favoredClass": "Any",
        "levelAdjustment": 0
      },
      "choices": [],
      "effects": [],
      "powers": [],
      "source": "Official 3.5e book and page",
      "benefit": "Concise summary of racial traits and ability modifiers",
      "text": "Full official RAW description and racial lore in English",
      "description": "Full official RAW description and racial lore in English"
    }
  ]
}`;
    }

    // 7. MANEUVER / STANCE
    if (cat === 'maneuver' || cat === 'stance') {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "Maneuver / Stance").

${this.DND35_RAW_GUARDRAIL}

${this.V3_MECHANICS_CONTRACT}

MANEUVER / STANCE V3 RULES:
1. Consult Tome of Battle: The Book of Nine Swords. Correct misspellings to official D&D 3.5e English names.
2. Put stance bonuses or strike extra damage dice ("roll" block) inside "effects". NEVER emit "modifiers" or "damageParts".

OUTPUT JSON SCHEMA (Pure Canonical V3):
{
  "entries": [
    {
      "schemaVersion": 3,
      "id": "man-unique-slug",
      "blueprint": "spell",
      "name": "Official 3.5e Name",
      "type": "${cat === 'stance' ? 'Stance' : 'Maneuver'}",
      "discipline": "Stone Dragon",
      "level": 1,
      "prereq": "None",
      "action": "Standard Action",
      "actionType": "standard",
      "duration": "${cat === 'stance' ? 'Stance' : 'Instantaneous'}",
      "effects": [],
      "modes": [],
      "source": "Tome of Battle p.XX",
      "benefit": "Concise mechanical summary in English",
      "text": "Full official RAW description in English",
      "description": "Full official RAW description in English"
    }
  ]
}`;
    }

    // 8. CONDITION / BUFF
    if (cat === 'condition') {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "Condition").

${this.DND35_RAW_GUARDRAIL}

${this.V3_MECHANICS_CONTRACT}

CONDITION V3 RULES:
1. Consult official D&D 3.5e SRD or DMG conditions (Blinded, Shaken, Frightened, Stunned, Fatigued, Exhausted, Entangled, Prone, Grappled, Sickened, Nauseated, etc.).
2. Express all numerical penalties as V3 "stat" blocks in "effects" with "btype": "Penalty" and negative "value". NEVER emit "modifiers".

OUTPUT JSON SCHEMA (Pure Canonical V3):
{
  "entries": [
    {
      "schemaVersion": 3,
      "id": "cond-unique-slug",
      "blueprint": "buff",
      "name": "Official 3.5e Name",
      "type": "Condition",
      "effects": [
        { "type": "stat", "targets": ["atk.all"], "mode": "flat", "value": -2, "btype": "Penalty" }
      ],
      "source": "DMG / SRD 3.5e",
      "benefit": "Concise mechanical summary of penalties and restrictions",
      "text": "Full official RAW description in English",
      "description": "Full official RAW description in English"
    }
  ]
}`;
    }

    // 9. CLASS (Base Classes, Prestige Classes, Unearthed Arcana Variants & ACFs)
    if (cat === 'class') {
      return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "Class").

${this.DND35_RAW_GUARDRAIL}

${this.V3_MECHANICS_CONTRACT}

CLASS & VARIANT CLASS V3 RULES:
1. Consult PHB I & II, DMG, Complete Series, Tome of Battle, Unearthed Arcana (Variant Character Classes p.47-70), and official 3.5e splatbooks.
2. Correct typos automatically and populate chassis fields ("hitDie", "bab", "fort", "ref", "will", "skillPoints", "classSkills") plus any passive V3 "effects".

OUTPUT JSON SCHEMA (Pure Canonical V3):
{
  "entries": [
    {
      "schemaVersion": 3,
      "id": "cls-unique-slug",
      "blueprint": "class",
      "name": "Official 3.5e Class or Variant Name",
      "type": "Class",
      "hitDie": "d8",
      "bab": "Good",
      "fort": "Good",
      "ref": "Poor",
      "will": "Poor",
      "skillPoints": 4,
      "classSkills": ["Climb", "Jump", "Swim"],
      "effects": [],
      "source": "Official 3.5e book and page (e.g. Unearthed Arcana p.58)",
      "benefit": "Class summary and role in English",
      "text": "Full official RAW description in English",
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

    // 2. Check SrdCompendium (7,987+ Pure V3 entries)
    if (typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) {
      const exactComp = (cleanId && window.SrdCompendium.getById(cleanId)) || (cleanName && window.SrdCompendium.getByName(cleanName));
      if (exactComp) {
        return { exists: true, inMasterDb: false, inCoreCompendium: true, masterDbIndex: -1, sourceLabel: 'SRD V3 Compendium' };
      }
    }

    // 3. Check Canonical Dictionary (ToB / Splatbook staples)
    if (cleanName && this.canonicalDictionary && this.canonicalDictionary[cleanName] && typeof this.canonicalDictionary[cleanName] === 'object') {
      return { exists: true, inMasterDb: false, inCoreCompendium: true, masterDbIndex: -1, sourceLabel: 'SRD V3 Core Library' };
    }

    // 4. Check Base Item Match in SrdCompendium
    if (cleanName) {
      const baseMatch = this.findBaseItemInSrdCore(cleanName);
      if (baseMatch && (baseMatch.name || '').toLowerCase().trim() === cleanName) {
        return { exists: true, inMasterDb: false, inCoreCompendium: true, masterDbIndex: -1, sourceLabel: 'SRD V3 Compendium' };
      }
    }

    if (item._fromLocalSiteDb) {
      return { exists: true, inMasterDb: false, inCoreCompendium: true, masterDbIndex: -1, sourceLabel: item._localSourceLabel || 'SRD V3 Compendium' };
    }

    return { exists: false, inMasterDb: false, inCoreCompendium: false, masterDbIndex: -1, sourceLabel: null };
  },

  // Create a deterministic signature of editable V3 fields to verify modifications in "Change & Add" mode
  getComparableEntrySignature(item) {
    const v3 = this.ensureV2(item || {});
    return JSON.stringify({
      name: (v3.name || '').trim().toLowerCase(),
      type: (v3.type || '').trim().toLowerCase(),
      blueprint: (v3.blueprint || '').trim().toLowerCase(),
      slot: (v3.slot || '').trim().toLowerCase(),
      source: (v3.source || '').trim().toLowerCase(),
      prereq: (v3.prereq || '-').trim().toLowerCase(),
      benefit: (v3.benefit || v3.description || '').trim(),
      action: (v3.action || 'Passive').trim().toLowerCase(),
      cost: Number(v3.cost ?? v3.priceGp) || 0,
      weight: Number(v3.weight ?? v3.weightLb) || 0,
      effects: Array.isArray(v3.effects) ? v3.effects : [],
      powers: Array.isArray(v3.powers) ? v3.powers : [],
      choices: Array.isArray(v3.choices) ? v3.choices : [],
      modes: Array.isArray(v3.modes) ? v3.modes : [],
      ruleFlags: v3.ruleFlags || {},
      weapon: v3.weapon || null,
      armor: v3.armor || null,
      level: v3.level !== undefined && v3.level !== '' ? String(v3.level) : '',
      school: (v3.school || v3.discipline || '').trim().toLowerCase(),
      range: (v3.range || '').trim().toLowerCase()
    });
  },

  // 0ms Local Resolution Helper: Master DB -> SrdCompendium -> ItemAssembler -> Canonical Dictionary
  // Search-by-Name category (dropdown value or "feat:" prefix) -> lowercased entry types / blueprints it covers
  SEARCH_CATEGORY_TYPES: {
    'Feat': { types: ['feat', 'homebrew'], blueprints: ['feat'] },
    'Flaw': { types: ['flaw'], blueprints: [] },
    'Spell': { types: ['spell'], blueprints: ['spell'] },
    'Weapon': { types: ['weapon'], blueprints: ['weapon'] },
    'Armor / Shield': { types: ['armor', 'shield'], blueprints: ['armor', 'shield'] },
    'Armor': { types: ['armor'], blueprints: ['armor'] },
    'Shield': { types: ['shield'], blueprints: ['shield'] },
    'Wondrous Item': { types: ['wondrous item'], blueprints: [] },
    'Ring': { types: ['ring'], blueprints: [] },
    'Magic Item': { types: ['wondrous item', 'ring', 'magic item', 'rod', 'staff', 'wand', 'potion', 'scroll', 'item'], blueprints: ['item'] },
    'Maneuver': { types: ['maneuver', 'stance'], blueprints: ['maneuver'] },
    'Deity': { types: ['deity'], blueprints: ['deity'] },
    'Domain': { types: ['domain'], blueprints: ['domain'] },
    'Race': { types: ['race', 'template'], blueprints: ['race', 'template'] },
    'Class': { types: ['class', 'base class', 'prestige class', 'custom class'], blueprints: ['class'] },
    'Condition': { types: ['condition'], blueprints: ['condition'] }
  },

  entryMatchesSearchCategory(entry, categoryHint) {
    const spec = this.SEARCH_CATEGORY_TYPES[categoryHint];
    if (!spec) return true;
    const t = String(entry.type || '').toLowerCase();
    const c = String(entry.category || '').toLowerCase();
    const bp = String(entry.blueprint || '').toLowerCase();
    return spec.types.includes(t) || spec.types.includes(c) || (bp !== '' && spec.blueprints.includes(bp));
  },

  // The character's stored copy of an entry (Crafter override layer first, then Master DB / customDb)
  getStoredCustomEntry(id) {
    if (!id) return null;
    const ce = (typeof character !== 'undefined' && character && character.customEntries && typeof character.customEntries === 'object' && !Array.isArray(character.customEntries)) ? character.customEntries : null;
    if (ce && ce[id]) return ce[id];
    if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
      return masterDb.find(m => m && m.id === id) || null;
    }
    return null;
  },

  // 'homebrew' | 'override' | 'campaign' | null (null = unmodified SRD snapshot copy, i.e. core data)
  classifyCustomEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;
    if (entry._campaignPack && entry._campaignPack.packId) return 'campaign';
    const SC = (typeof window !== 'undefined') ? window.SrdCompendium : null;
    if (this.getSnapshotMeta(entry) && !(SC && typeof SC.isUserCustomizedEntry === 'function' && SC.isUserCustomizedEntry(entry))) return null;
    const baseId = entry.baseEntryId || (entry._snapshot && entry._snapshot.srcId) || entry.id;
    return (SC && typeof SC.isCoreId === 'function' && SC.isCoreId(baseId)) ? 'override' : 'homebrew';
  },

  getCustomKindBadgeHtml(item) {
    const stored = item && this.getStoredCustomEntry(item.id);
    const kind = this.classifyCustomEntry(stored);
    if (kind === 'campaign') return this.getCampaignPackBadgeHtml(stored);
    if (kind === 'override') return '<span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50 text-[10px] font-bold">⚒️ Crafted Override</span>';
    if (kind === 'homebrew') return '<span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50 text-[10px] font-bold">⚒️ Homebrew</span>';
    return '';
  },

  // Partial / fuzzy name search over the character's own entries (homebrew, Crafter overrides, campaign packs),
  // filtered by the selected category. Unmodified SRD snapshot copies are core data and are left to the SRD lookup.
  searchCustomEntries(rawQuery, categoryHint = 'ALL', limit = 12) {
    const q = String(rawQuery || '').trim()
      .replace(/^(spell|feat|race|deity|god|patron|domain|weapon|armor|shield|item|magic item|maneuver|stance|class|condition):\s*/i, '')
      .trim();
    if (!q) return [];
    const pool = new Map();
    const add = (e) => {
      if (!e || typeof e !== 'object' || !e.name) return;
      const key = String(e.id || e.name).toLowerCase();
      if (!pool.has(key)) pool.set(key, e);
    };
    const ce = (typeof character !== 'undefined' && character && character.customEntries && typeof character.customEntries === 'object' && !Array.isArray(character.customEntries)) ? character.customEntries : null;
    if (ce) Object.values(ce).forEach(add);
    if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) masterDb.forEach(add);

    const SC = (typeof window !== 'undefined') ? window.SrdCompendium : null;
    const qLow = q.toLowerCase();
    const scored = [];
    pool.forEach((e) => {
      if (!this.classifyCustomEntry(e)) return;
      if (!this.entryMatchesSearchCategory(e, categoryHint)) return;
      const name = String(e.name || '');
      const haystack = `${e.shortDescription || ''} ${e.benefit || ''} ${e.description || ''}`;
      const score = (SC && typeof SC.fuzzyScore === 'function')
        ? SC.fuzzyScore(q, name, haystack)
        : (name.toLowerCase().includes(qLow) ? 350 : 0);
      if (score > 0) scored.push({ e, score });
    });
    scored.sort((a, b) => (b.score - a.score) || String(a.e.name).localeCompare(String(b.e.name)));
    return scored.slice(0, limit).map(({ e }) => this.ensureV2(JSON.parse(JSON.stringify(e))));
  },

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

    // 0b. Check if query is a Homebrew entry / Skill or Stat Grant (e.g. "homebrew ride +4", "boon, skill: +ride")
    if (typeof window !== 'undefined' && typeof window.synthesizeHomebrewFromQuery === 'function') {
      const synthBoon = window.synthesizeHomebrewFromQuery(cleanKey, '', '');
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

    // 2. Check SrdCompendium (7,987+ Pure V3 entries, O(1) lookup)
    if (typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) {
      const exactComp = window.SrdCompendium.getById(cleanKey) || window.SrdCompendium.getByName(cleanKey);
      if (exactComp) {
        return [markSiteDb(exactComp, 'SRD V3 Compendium')];
      }
      if (typeof window.SrdCompendium.getDomain === 'function') {
        const domComp = window.SrdCompendium.getDomain(cleanKey);
        if (domComp) {
          return [markSiteDb(domComp, 'SRD V3 Compendium')];
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

    // 3b. DMG 3.5e RAW Scroll / Wand / Potion / Oil Synthesizer (0 Tokens, O(1) SrdCompendium spell lookup)
    const spellItemMatch = cleanKey.match(/^(arcane\s+scroll|divine\s+scroll|scroll|wand|potion|oil)\s+of\s+(.+?)(?:\s*\(\s*cl\s*(\d+)\s*\))?$/i);
    if (spellItemMatch && typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) {
      const itemKindRaw = spellItemMatch[1].toLowerCase().replace(/\s+/g, ' ');
      const spellQuery = spellItemMatch[2].trim();
      const customCl = spellItemMatch[3] ? Math.max(1, parseInt(spellItemMatch[3], 10)) : null;
      const spSlug = spellQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const spEntry = window.SrdCompendium.getById('spl-' + spSlug) || window.SrdCompendium.getByName(spellQuery);
      if (spEntry && (spEntry.blueprint === 'spell' || String(spEntry.type || '').toLowerCase() === 'spell')) {
        const clsLvls = Array.isArray(spEntry.spell && spEntry.spell.classLevels) ? spEntry.spell.classLevels : [];
        let sl = Number(spEntry.level ?? (spEntry.lifecycle && spEntry.lifecycle.usage && spEntry.lifecycle.usage.slotLevel));
        let minCl = 1;
        if (clsLvls.length > 0) {
          const candidates = clsLvls.map((clObj) => {
            const cName = String(clObj.class || '').toLowerCase();
            const lv = Math.max(0, Number(clObj.level) || 0);
            let reqCl = Math.max(1, 2 * lv - 1);
            if (/sorcerer/.test(cName)) reqCl = lv <= 1 ? 1 : 2 * lv;
            else if (/bard/.test(cName)) reqCl = lv === 0 ? 1 : (lv === 1 ? 2 : (3 * lv - 2));
            else if (/paladin|ranger/.test(cName)) reqCl = lv === 1 ? 2 : (lv === 2 ? 4 : (lv === 3 ? 5 : 7));
            return { lv, reqCl, costFactor: (lv === 0 ? 0.5 : lv) * reqCl };
          }).sort((a, b) => a.costFactor - b.costFactor);
          sl = candidates[0].lv;
          minCl = candidates[0].reqCl;
        } else if (Number.isFinite(sl)) {
          minCl = Math.max(1, 2 * sl - 1);
        } else {
          sl = 1;
          minCl = 1;
        }
        const effCl = customCl ? Math.max(minCl, customCl) : minCl;
        const effSl = sl === 0 ? 0.5 : sl;
        const isWand = itemKindRaw === 'wand';
        const isPot = itemKindRaw === 'potion' || itemKindRaw === 'oil';
        const unitMult = isWand ? 750 : (isPot ? 50 : 25);
        const priceGp = Math.round(effSl * effCl * unitMult * 100) / 100;
        const minSaveDc = 10 + sl + Math.floor(sl / 2);
        const kindTitle = itemKindRaw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const displayType = isWand ? 'Wand' : (isPot ? 'Potion' : 'Scroll');
        const fullTitle = `${kindTitle} of ${spEntry.name}${customCl ? ` (CL ${effCl})` : ''}`;
        const itemId = `mi-${itemKindRaw.replace(/\s+/g, '-')}-of-${spSlug}${customCl ? '-cl' + effCl : ''}`;
        const charges = isWand ? 50 : 1;
        const rawSummary = String(spEntry.shortDescription || spEntry.benefit || spEntry.text || spEntry.description || '').replace(/\s+/g, ' ').trim();
        const dmgRef = isWand ? 'DMG p.245' : (isPot ? 'DMG p.229' : 'DMG p.238');
        return [this.normalizeEntry({
          schemaVersion: 3,
          id: itemId,
          blueprint: 'wondrous',
          name: fullTitle,
          type: displayType,
          category: 'Consumable',
          slot: 'Consumable',
          priceGp,
          cost: priceGp,
          weightLb: isPot ? 0.1 : 0,
          weight: isPot ? 0.1 : 0,
          casterLevel: effCl,
          source: `${dmgRef} (${spEntry.source || 'SRD 3.5e'})`,
          item: { subtype: displayType, slot: 'Consumable', consumable: true, price: priceGp, casterLevel: effCl },
          benefit: `${kindTitle} of ${spEntry.name} (Spell Level ${sl}, CL ${effCl}, Save DC ${minSaveDc}${isWand ? ', 50 charges' : ', single-use'}): ${rawSummary.slice(0, 180)}`,
          text: `${kindTitle} of ${spEntry.name} (Spell Level ${sl}, Caster Level ${effCl}, Save DC ${minSaveDc}). ${rawSummary}`,
          description: `${kindTitle} of ${spEntry.name} (Spell Level ${sl}, Caster Level ${effCl}, Save DC ${minSaveDc}). ${rawSummary}`,
          effects: [],
          powers: [{
            id: `pw-${itemId}`,
            kind: 'attached',
            name: spEntry.name,
            refId: spEntry.id,
            action: 'Standard',
            casterLevel: effCl,
            saveDC: minSaveDc,
            spellLevel: sl,
            usage: { mode: 'charges', uses: charges }
          }]
        })];
      }
    }
    if (this.canonicalDictionary[cleanKey] && typeof this.canonicalDictionary[cleanKey] === 'object') {
      return [markSiteDb(this.canonicalDictionary[cleanKey], 'Site V2 Core Library')];
    }

    // 5. Check Base Item Fallback in SrdCompendium
    const baseMatch = this.findBaseItemInSrdCore(cleanKey);
    if (baseMatch && (baseMatch.name || '').toLowerCase().trim() === cleanKey) {
      return [markSiteDb(this.normalizeEntry(baseMatch), 'SRD V3 Compendium')];
    }

    // 6. Layer 1 Deterministic Text Scriber (0 Tokens, <0.3 ms) — returns immediately ONLY when coverage === 'full'
    //    (when coverage === 'partial' and an API key is present, callers route to Hybrid Partial Scribe -> AI Refine)
    if (typeof RuleEngine !== 'undefined' && (typeof RuleEngine.scribeRuleText === 'function' || typeof RuleEngine.parseRuleTextToV3 === 'function') && rawQuery.trim().length >= 8) {
      const catHint = prefixMatch ? prefixMatch[1].toLowerCase() : 'feat';
      const bpHint = catHint === 'spell' ? 'spell' : (catHint === 'race' ? 'race' : (catHint === 'domain' ? 'domain' : (catHint === 'weapon' ? 'weapon' : (catHint === 'armor' || catHint === 'shield' ? 'armor' : 'feat'))));
      if (typeof RuleEngine.scribeRuleText === 'function') {
        const sRes = RuleEngine.scribeRuleText(rawQuery, { blueprint: bpHint });
        if (sRes && sRes.hasRealMech && sRes.coverage === 'full') {
          return [this.normalizeEntry(sRes.entry)];
        }
      } else {
        const scribed = RuleEngine.parseRuleTextToV3(rawQuery, { blueprint: bpHint });
        const hasRealMech = scribed && (
          (Array.isArray(scribed.powers) && scribed.powers.length > 0) ||
          (Array.isArray(scribed.choices) && scribed.choices.length > 0) ||
          (Array.isArray(scribed.effects) && scribed.effects.some(b => b && !(b.type === 'effect' && b.effectKind === 'rule')))
        );
        if (hasRealMech) {
          return [this.normalizeEntry(scribed)];
        }
      }
    }

    return [];
  },

  // Shared 1-Step V3 Validation & Repair Helper for LLM JSON outputs (validates ALL items & re-checks repaired output)
  async _validateAndRepairAiItems(rawItems, defaultBp, modelUsed, fallbackModels, apiKey, statusTextEl = null) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) return [];
    if (typeof RuleEngine === 'undefined' || typeof RuleEngine.validateV3Entry !== 'function') {
      return rawItems;
    }
    const collectErrors = (list) => {
      const errs = [];
      list.forEach((item, idx) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return;
        const vCheck = RuleEngine.validateV3Entry(item, { checkRawFirst: true, defaultBlueprint: defaultBp || 'feat' });
        if (!vCheck.rawOk && vCheck.rawErrors.length) {
          vCheck.rawErrors.forEach(e => errs.push(`[entry ${idx}] ${e}`));
        }
      });
      return errs;
    };
    const initialErrors = collectErrors(rawItems);
    if (!initialErrors.length || !apiKey) return rawItems;

    const repairModels = [modelUsed].concat((fallbackModels || []).filter(m => m && m !== modelUsed && !this._isDeprecatedGeminiModel(m))).slice(0, 2);
    const repairPrompt = `You returned D&D 3.5e JSON entries that violated the Pure Canonical V3 contract (schemaVersion: 3).\nFix ONLY the following errors and return valid JSON matching {"entries": [...]} (NEVER emit modifiers/damageParts/defenses/resources; use condKind:"situational" for any non-closed when condition):\n\nValidation Errors:\n- ${initialErrors.join('\n- ')}\n\nOriginal JSON:\n${JSON.stringify({ entries: rawItems })}`;
    for (const rModel of repairModels) {
      if (!rModel) continue;
      if (statusTextEl) statusTextEl.textContent = `Repairing V3 schema (${rModel})...`;
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), 9000);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${rModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const genConfig = { temperature: 0.0, responseMimeType: 'application/json' };
        if (rModel.includes('2.5')) genConfig.thinkingConfig = { thinkingBudget: 0 };
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: repairPrompt }] }], generationConfig: genConfig }),
          signal: controller.signal
        });
        clearTimeout(tId);
        if (resp.ok) {
          const d = await resp.json();
          const txt = d.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const cleaned = this.cleanJsonText(txt);
            const parsed = JSON.parse(cleaned);
            const repList = Array.isArray(parsed.entries) ? parsed.entries : (Array.isArray(parsed) ? parsed : [parsed]);
            if (repList.length > 0) {
              const repErrors = collectErrors(repList);
              if (repErrors.length === 0 || repErrors.length < initialErrors.length) {
                return repList;
              }
            }
          }
        }
      } catch (_) {
        clearTimeout(tId);
      }
    }
    return rawItems;
  },

  // Hybrid Partial Scribe -> AI Refine: preserves 0-token deterministic blocks and asks Gemini to translate ONLY unparsed complex clauses
  async refinePartialScribeWithAi(rawText, partialScribe, categoryHint = 'Feat', apiKey = '', statusTextEl = null) {
    const baseEntry = partialScribe && partialScribe.entry ? JSON.parse(JSON.stringify(partialScribe.entry)) : null;
    if (!baseEntry) return this.queryAiFreeTextRows(rawText, apiKey, statusTextEl);
    if (!apiKey) {
      if (partialScribe.mechanicalUnparsedClauses && partialScribe.mechanicalUnparsedClauses.length > 0) {
        baseEntry.effects = (baseEntry.effects || []).concat([{
          type: 'effect',
          effectKind: 'rule',
          label: 'Additional Rule Clause',
          text: partialScribe.mechanicalUnparsedClauses.join(' ').slice(0, 280)
        }]);
      }
      return [this.normalizeEntry(baseEntry)];
    }

    const lockedBlocks = {
      effects: baseEntry.effects || [],
      powers: baseEntry.powers || [],
      choices: baseEntry.choices || []
    };
    const promptText = `You are a master D&D 3.5e Rule Arbiter & Pure Canonical V3 Architect.
Our deterministic 0-token V3 Scriber already extracted verified blocks from part of this rule text, leaving ${partialScribe.mechanicalUnparsedClauses.length} complex clause(s) unparsed.

FULL RULE TEXT:
'''
${rawText}
'''

LOCKED 0-TOKEN V3 BLOCKS (KEEP THESE SEMANTICALLY INTACT):
${JSON.stringify(lockedBlocks)}

REMAINING UNPARSED COMPLEX CLAUSE(S) TO TRANSLATE:
${JSON.stringify(partialScribe.mechanicalUnparsedClauses)}

${this.DND35_RAW_GUARDRAIL}

${this.V3_MECHANICS_CONTRACT}

TASK:
Return 1 complete Pure Canonical V3 entry inside {"entries": [...]} (blueprint: "${baseEntry.blueprint || 'feat'}", category: "${categoryHint}") that retains the locked blocks AND translates the remaining unparsed clause(s) into canonical V3 "effects", "powers", "choices", or "modes" (with proper "swapScope", "recipient", and closed "when" conditions).`;

    const modelsToTry = this._expandGeminiCandidates(this._sanitizeModelList(await this.getAvailableGeminiModels(apiKey, false, 'QUICK_SEARCH')));
    for (const model of modelsToTry) {
      if (this._isDeprecatedGeminiModel(model)) continue;
      if (statusTextEl) statusTextEl.textContent = `Refining complex clause(s) ➔ ${model}...`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 11000);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const genConfig = { temperature: 0.1, responseMimeType: 'application/json' };
        if (model.includes('2.5')) genConfig.thinkingConfig = { thinkingBudget: 0 };
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: genConfig }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = await resp.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = JSON.parse(this.cleanJsonText(txt));
            let rawList = Array.isArray(parsed.entries) ? parsed.entries : (Array.isArray(parsed) ? parsed : [parsed]);
            rawList = await this._validateAndRepairAiItems(rawList, baseEntry.blueprint || 'feat', model, modelsToTry, apiKey, statusTextEl);
            const norm = this.normalizeEntry(rawList[0]);
            if (norm) {
              const seen = new Set((norm.effects || []).map(b => JSON.stringify(b)));
              (lockedBlocks.effects || []).forEach((lb) => {
                const sig = JSON.stringify(lb);
                if (!seen.has(sig)) {
                  norm.effects = [lb].concat(norm.effects || []);
                  seen.add(sig);
                }
              });
              if ((lockedBlocks.powers || []).length && !(norm.powers || []).length) norm.powers = lockedBlocks.powers;
              if ((lockedBlocks.choices || []).length && !(norm.choices || []).length) norm.choices = lockedBlocks.choices;
              return [this.ensureV2(norm)];
            }
          }
        } else {
          const ej = await resp.json().catch(() => ({}));
          if (this.isGeminiModelRetiredError(resp.status, ej.error?.message || '')) this.markGeminiModelRetired(model);
        }
      } catch (_) {
        clearTimeout(timeoutId);
      }
    }
    // Graceful fallback: return deterministic blocks + rule note if API is unreachable
    if (partialScribe.mechanicalUnparsedClauses && partialScribe.mechanicalUnparsedClauses.length > 0) {
      baseEntry.effects = (baseEntry.effects || []).concat([{
        type: 'effect',
        effectKind: 'rule',
        label: 'Additional Rule Clause',
        text: partialScribe.mechanicalUnparsedClauses.join(' ').slice(0, 280)
      }]);
    }
    return [this.normalizeEntry(baseEntry)];
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

    // Check for Partial Scribe hit -> Hybrid Partial Scribe + AI Refine
    const catLow = String(effectiveCategory || 'feat').toLowerCase();
    const bpHint = catLow === 'spell' || catLow === 'maneuver' ? 'spell'
      : (catLow === 'race' ? 'race'
      : (catLow === 'domain' ? 'domain'
      : (catLow === 'deity' ? 'deity'
      : (catLow === 'weapon' ? 'weapon'
      : (catLow.includes('armor') || catLow.includes('shield') ? 'armor'
      : (catLow === 'condition' ? 'buff' : 'feat'))))));
    if (typeof RuleEngine !== 'undefined' && typeof RuleEngine.scribeRuleText === 'function' && cleanQuery.length >= 16) {
      const sRes = RuleEngine.scribeRuleText(cleanQuery, { blueprint: bpHint });
      if (sRes && sRes.hasRealMech && sRes.coverage === 'partial') {
        return await this.refinePartialScribeWithAi(cleanQuery, sRes, effectiveCategory, apiKey, statusTextEl);
      }
    }

    const promptText = this.buildTargetedAiPrompt(cleanQuery, effectiveCategory);
    this.emitPersonaEvent({ persona: 'rulemaster', state: 'thinking', message: `Crafting "${cleanQuery}"...` });
    try {
      const taskModels = this._sanitizeModelList(await this.getAvailableGeminiModels(apiKey, false, 'QUICK_SEARCH'));
      const availableModels = this._expandGeminiCandidates(taskModels);
      let lastError = null;
      const attemptErrors = [];

      for (const model of availableModels) {
        if (this._isDeprecatedGeminiModel(model)) continue;
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

                rawList = await this._validateAndRepairAiItems(rawList, bpHint, model, availableModels, apiKey, statusTextEl);

                const normalizedEntries = [];
                rawList.forEach(rawItem => {
                  const isArrayRow = Array.isArray(rawItem);
                  const norm = this.normalizeEntry(rawItem, isArrayRow);
                  if (norm && norm.name) {
                    normalizedEntries.push(norm);
                  }
                });
                if (normalizedEntries.length > 0) return normalizedEntries;
              } catch (pErr) {
                lastError = `JSON Parse Error (${model}): ${pErr.message}`;
                attemptErrors.push({ model, message: lastError, retired: false });
              }
            }
          } else {
            const errJson = await response.json().catch(() => ({}));
            lastError = errJson.error?.message || `HTTP ${response.status} (${model})`;
            const retired = this.isGeminiModelRetiredError(response.status, lastError);
            attemptErrors.push({ model, message: lastError, retired });
            if (retired) this.markGeminiModelRetired(model);
          }
        } catch (netErr) {
          clearTimeout(timeoutId);
          if (netErr && netErr.name === 'AbortError') {
            lastError = `Timeout (12s) - ${model} did not respond.`;
          } else {
            lastError = `${netErr.message} (${model})`;
          }
          attemptErrors.push({ model, message: lastError, retired: false });
        }
      }

      throw new Error(this._summarizeGeminiErrors(attemptErrors) || lastError || `No official D&D 3.5e rule or item found for "${query}".`);
    } finally {
      this.emitPersonaEvent({ persona: 'rulemaster', state: 'idle', message: '' });
    }
  },

  async queryAiRule() {
    const queryInput = document.getElementById('ai-rule-query');
    const catSelect = document.getElementById('ai-rule-category');
    const resultsContainer = document.getElementById('ai-results-container');

    let query = queryInput ? queryInput.value.trim() : '';
    let categoryHint = catSelect ? catSelect.value : 'ALL';

    if (!query) {
      notify('Please enter the name of the rule, item, spell, feat, or ability you want to search.', 'error');
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
        notify(msg, 'error');
      }
      catSelect?.focus();
      return;
    }

    // 0ms Local Resolution (Master DB -> SrdCompendium -> ItemAssembler -> DMG Synthesizer -> Full Scriber)
    const localFound = this.resolveLocalZeroTokenQuery(query);
    if (localFound.length > 0) {
      this.lastAiResults = localFound;
      this.renderAiResults();
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      if (typeof RuleEngine !== 'undefined' && typeof RuleEngine.scribeRuleText === 'function' && query.length >= 12) {
        const sRes = RuleEngine.scribeRuleText(query, { blueprint: 'feat', preserveUnparsedAsRuleBlocks: true });
        if (sRes && sRes.hasRealMech) {
          this.lastAiResults = [this.normalizeEntry(sRes.entry)];
          this.renderAiResults();
          return;
        }
      }
      notify('⚠️ Please enter a valid Gemini API Key to use Rule Master AI.', 'error');
      this.promptChangeApiKey();
      return;
    }

    if (resultsContainer) resultsContainer.innerHTML = '';

    try {
      const entries = await this.fetchSingleAiRuleObjects(query, categoryHint, apiKey, null);

      if (!entries || !entries.length) {
        throw new Error(`No official D&D 3.5e rule or item found for "${query}".`);
      }

      this.lastAiResults = entries;
      this.renderAiResults();
    } catch (err) {
      console.error(err);
      notify(`Error: ${err.message}`, 'error');
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
    return rows.map(r => {
      if (r && typeof r === 'object' && !Array.isArray(r)) {
        return this.normalizeEntry(r, false);
      }
      if (Array.isArray(r)) {
        return this.normalizeEntry(r, !r.type && !r.benefit);
      }
      return r;
    }).filter(Boolean);
  },

  queryAiBatch() {
    return this.importMultipleFromAi();
  },

  async importMultipleFromAi() {
    const input = document.getElementById('ai-batch-query');
    const btn = document.getElementById('btn-ai-batch-search');
    const statusBox = document.getElementById('ai-batch-status');
    const statusText = document.getElementById('ai-batch-status-text');

    if (!input || !input.value.trim()) {
      notify('Please enter the rules you want to import, separated by commas or newlines.', 'error');
      return;
    }

    // Check if the entire input is a single multi-line Structured Ability Stat Block (e.g. Breath Weapon / 4d8 Acid / Save Reflex, DC:10+lvl+Con / 60ft, Recharge 1d4+1 turn)
    const singleStatBlock = this.parseStructuredAbilityStatBlock(input.value);
    if (singleStatBlock && singleStatBlock.name) {
      const v3 = this.normalizeEntry(singleStatBlock);
      const existsIdx = masterDb.findIndex(m => (m.id && m.id === v3.id) || (m.name || '').toLowerCase() === (v3.name || '').toLowerCase());
      if (existsIdx >= 0) masterDb[existsIdx] = v3;
      else masterDb.push(v3);
      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      this.renderTable();
      notify(`🎉 Structured Ability Scribed & Imported (0ms)!\n"${v3.name}" (${v3.benefit}) has been added to Master DB in Pure Canonical V3 format.`, 'success');
      return;
    }

    const rawQueries = input.value.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    if (!rawQueries.length) return;

    const items = [...new Set(rawQueries)];
    if (!(await DnDUI.confirm(`A total of ${items.length} rule(s) will be crafted into Pure Canonical V3 format and added to Master DB. Proceed?`))) {
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
            const v3 = this.normalizeEntry(entry);
            const existsIdx = masterDb.findIndex(m => (m.id && m.id === v3.id) || (m.name || '').toLowerCase() === (v3.name || '').toLowerCase());
            if (existsIdx >= 0) masterDb[existsIdx] = v3;
            else masterDb.push(v3);
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
    notify(`🎉 Batch Import Complete!\n${totalImported} Pure Canonical V3 rule(s) successfully added to Master DB.`, 'success');
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
          <span class="text-xs text-slate-200 ml-1 font-semibold">${newEntriesCount === 0 ? (firstDbInfo.sourceLabel || 'Site V3 Compendium') : `${this.lastAiResults.length} Result(s) Found`}</span>
          <span class="text-[11px] text-slate-400 block sm:inline sm:ml-2">${newEntriesCount === 0 ? 'Direct duplicate addition is disabled — use "Change & Add" to customize first' : '100% Pure Canonical V3 Schema Compliant'}</span>
        </div>
        ${newEntriesCount > 0 ? `
          <button data-action="rm:add-all-ai" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer">
            <span>📥</span>
            <span>${newEntriesCount < this.lastAiResults.length ? `Add New to DB (${newEntriesCount})` : 'Add All to DB'}</span>
          </button>
        ` : (this.lastAiResults.length === 1 ? `
          <button data-action="rm:change-add-ai" data-idx="0" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer">
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
      const primaryBonusType = this._getPrimaryBonusType(item, 'Untyped');

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
                <button data-action="rm:change-add-ai" data-idx="${idx}" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1 cursor-pointer" title="Modify this entry in the Builder and add to Custom Master DB">
                  <span>✏️</span>
                  <span>Change &amp; Add</span>
                </button>
              ` : `
                <button data-action="rm:add-ai" data-idx="${idx}" class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1 cursor-pointer">
                  <span>📥</span>
                  <span>Add to DB</span>
                </button>
              `}
              <button data-action="rm:equip-ai" data-idx="${idx}" class="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg transition font-bold cursor-pointer" title="Equip / Add to Character">
                ⚡ Equip
              </button>
              ${!dbInfo.exists ? `
                <button data-action="rm:edit-ai" data-idx="${idx}" class="bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer" title="Edit">
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
      notify(`✅ "${item.name}" successfully added to Master_DB!`, 'success');
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
      notify('ℹ️ All listed entries already exist in the site database. Use "Change & Add" to customize an entry before adding it to Master DB.', 'info');
      return;
    }
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    notify(`✅ ${addedCount} Canonical V3 rule(s) successfully added to Master_DB!`, 'success');
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
  async equipItem(rawItem) {
    if (typeof character === 'undefined' || !character || !rawItem) return;
    const item = this.ensureV2(rawItem);
    const type = (item.type || '').toLowerCase();
    const cat = item.category || item.type || 'Other';
    const catLower = String(cat || '').toLowerCase();

    // 1. Ensure item is placed in character.gearPool (except pure Feats/Spells/Maneuvers/Stances/Racial Traits/Flaws/Deities/Domains/Special Abilities/Homebrew)
    const nonPhysicalTypes = ['feat', 'spell', 'maneuver', 'stance', 'flaw', 'racial trait', 'race', 'deity', 'domain', 'cleric domain', 'special ability', 'dm grant', 'homebrew', 'boon', 'class feature', 'trait', 'synergy', 'template'];
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
          schemaVersion: 3,
          id: item.id || `gear_${Date.now()}`,
          blueprint: item.blueprint || 'wondrous',
          baseItemId: item.baseItemId || null,
          name: item.name,
          masterDbName: item.name,
          category: cat,
          slot: item.slot && item.slot !== 'None' ? item.slot : cat,
          qty: 1,
          weight: Number(item.weight ?? item.weightLb) || 0,
          cost: Number(item.cost ?? item.priceGp) || 0,
          desc: item.benefit || item.description || '',
          choices: Array.isArray(item.choices) ? JSON.parse(JSON.stringify(item.choices)) : [],
          effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : [],
          powers: Array.isArray(item.powers) ? JSON.parse(JSON.stringify(item.powers)) : [],
          modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
          weapon: item.weapon ? JSON.parse(JSON.stringify(item.weapon)) : undefined,
          armor: item.armor ? JSON.parse(JSON.stringify(item.armor)) : undefined,
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
      const primaryDamage = wStats.baseDamage || item.weapon?.damageDice || '1d8';
      const primaryDmgType = (Array.isArray(wStats.damageTypes) && wStats.damageTypes.length ? wStats.damageTypes.join('/') : (item.weapon?.dmgType || 'Slashing'));

      const newWep = {
        schemaVersion: 3,
        id: item.id,
        blueprint: 'weapon',
        baseItemId: item.baseItemId || null,
        name: item.name,
        grip: isTwoHand ? '2-Hand' : (item.slot === 'Off-Hand' ? 'Off-Hand' : '1-Hand'),
        enhancementBonus: Number(item.enhancementBonus) || 0,
        material: item.material || null,
        enhancements: Array.isArray(item.enhancements) ? [...item.enhancements] : [],
        choices: Array.isArray(item.choices) ? JSON.parse(JSON.stringify(item.choices)) : [],
        effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : [],
        powers: Array.isArray(item.powers) ? JSON.parse(JSON.stringify(item.powers)) : [],
        modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
        weapon: item.weapon ? JSON.parse(JSON.stringify(item.weapon)) : {
          category: wStats.category || 'Martial',
          handedness: isTwoHand ? 'Two-Handed' : (wStats.handedness || 'One-Handed'),
          damageDice: primaryDamage,
          dmgType: primaryDmgType,
          baseCritRange: Number(wStats.critMin) || 20,
          critMultiplier: Number(wStats.critMult) || 2,
          rangeIncrement: Number(wStats.rangeIncrement) || null
        },
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
          schemaVersion: 3,
          id: item.id,
          blueprint: 'weapon',
          baseItemId: item.baseItemId || null,
          name: item.name,
          masterDbName: item.name,
          active: true,
          category: 'Weapon',
          weight: Number(item.weight ?? item.weightLb) || 0,
          cost: Number(item.cost ?? item.priceGp) || 0,
          desc: item.benefit || item.description || '',
          choices: Array.isArray(item.choices) ? JSON.parse(JSON.stringify(item.choices)) : [],
          effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : [],
          powers: Array.isArray(item.powers) ? JSON.parse(JSON.stringify(item.powers)) : [],
          modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
          weapon: JSON.parse(JSON.stringify(newWep.weapon)),
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
          notify(`⚔️ "${item.name}" is a Two-Handed weapon! Off-hand "${unequippedOffHandName}" has been unequipped.`, 'info');
        }
      } else {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Weapon Equipped',
            breakdown: `"${item.name}" equipped and added to inventory.`,
            icon: '⚔️'
          });
        } else {
          notify(`⚔️ "${item.name}" equipped and added to inventory!`, 'success');
        }
      }
    } else if (type === 'spell') {
      if (!character.spellcasting) character.spellcasting = { slots: [], knownSpells: [] };
      if (!character.spellcasting.knownSpells) character.spellcasting.knownSpells = [];
      character.spellcasting.knownSpells.push({
        schemaVersion: 3,
        id: item.id,
        blueprint: 'spell',
        level: Number(item.level) || 1,
        name: item.name,
        school: item.school || 'Universal',
        action: item.action || 'Standard Action',
        range: item.range || 'Close',
        benefit: item.benefit || item.description || '',
        choices: Array.isArray(item.choices) ? JSON.parse(JSON.stringify(item.choices)) : [],
        effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : [],
        powers: Array.isArray(item.powers) ? JSON.parse(JSON.stringify(item.powers)) : [],
        modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
        ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {}
      });
      notify(`🔮 "${item.name}" added to Spells Known!`, 'success');
    } else if (type === 'maneuver') {
      if (!character.tomeOfBattle) character.tomeOfBattle = { initiatorLevel: 1, readiedManeuvers: [], stancesKnown: [] };
      if (!character.tomeOfBattle.readiedManeuvers) character.tomeOfBattle.readiedManeuvers = [];
      character.tomeOfBattle.readiedManeuvers.push({
        schemaVersion: 3,
        id: item.id,
        blueprint: 'spell',
        name: item.name,
        level: Number(item.level) || 1,
        discipline: item.discipline || 'Iron Heart',
        action: item.action || 'Standard Action',
        expended: false,
        notes: item.benefit || item.description || '',
        effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : [],
        modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : []
      });
      notify(`⚔️ "${item.name}" added to Readied Maneuvers!`, 'success');
    } else if (type === 'stance') {
      if (!character.tomeOfBattle) character.tomeOfBattle = { initiatorLevel: 1, readiedManeuvers: [], stancesKnown: [] };
      if (!character.tomeOfBattle.stancesKnown) character.tomeOfBattle.stancesKnown = [];
      character.tomeOfBattle.stancesKnown.push({
        schemaVersion: 3,
        id: item.id,
        blueprint: 'spell',
        name: item.name,
        discipline: item.discipline || 'Shadow Hand',
        level: Number(item.level) || 1,
        benefit: item.benefit || item.description || '',
        effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : []
      });
      character.activeStance = item.name;
    } else if (type === 'flaw' || cat.toLowerCase() === 'flaw' || item.name.toLowerCase().startsWith('flaw:')) {
      if (character.level > 1) {
        const proceed = (await DnDUI.confirm(`⚠️ Per D&D 3.5e Unearthed Arcana rules, Flaws can only be selected at 1st Level during character creation. Your current level is ${character.level}.\n\nDo you still want to add the "${item.name}" flaw?`));
        if (!proceed) return;
        if (typeof character === 'undefined' || !character) return;
      }
      if (!character.feats) character.feats = [];
      const cleanName = item.name.replace(/^flaw:\s*/i, '').trim();
      const existingFlawIdx = character.feats.findIndex(f => (typeof f === 'string' ? f : f.name).toLowerCase().trim() === cleanName.toLowerCase());
      const flawObj = {
        schemaVersion: 3,
        id: item.id,
        blueprint: 'feat',
        name: cleanName,
        type: 'Flaw',
        category: 'Flaw',
        slotDiff: 1,
        source: item.source || 'Unearthed Arcana, p. 91',
        benefit: item.benefit || item.description || 'Grants 1 bonus feat in exchange for this flaw.',
        effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : [],
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
        const proceed = (await DnDUI.confirm(`⚠️ Racial traits are normally determined at 1st Level. Do you still want to add "${item.name}"?`));
        if (!proceed) return;
        if (typeof character === 'undefined' || !character) return;
      }
      if (!character.specialAbilities) character.specialAbilities = [];
      const cleanName = item.name.trim();
      if (!character.specialAbilities.some(a => (typeof a === 'string' ? a : a.name).toLowerCase().trim() === cleanName.toLowerCase())) {
        character.specialAbilities.push({
          schemaVersion: 3,
          id: item.id,
          blueprint: 'feat',
          name: cleanName,
          category: 'Racial Trait',
          source: item.source || 'PHB',
          benefit: item.benefit || '',
          effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : [],
          powers: Array.isArray(item.powers) ? JSON.parse(JSON.stringify(item.powers)) : []
        });
      }
      if (item.grantsBonusFeat || cleanName.toLowerCase().includes('bonus feat')) {
        notify(`🧬 Racial trait "${item.name}" added! This trait grants 1 extra bonus feat.`, 'success');
        if (typeof openFeatPickerModal === 'function') {
          setTimeout(() => openFeatPickerModal(false), 200);
        }
      } else {
        notify(`🧬 Racial trait "${item.name}" added to character!`, 'success');
      }
    } else if (type === 'feat') {
      if (!character.feats) character.feats = [];
      character.feats.push(item.name);
      notify(`✨ Feat "${item.name}" added to character!`, 'success');
    } else if (['special ability', 'dm grant', 'homebrew', 'boon', 'class feature', 'synergy', 'trait', 'template'].includes(type) || ['special ability', 'dm grant', 'homebrew', 'boon', 'class feature', 'synergy', 'trait', 'template'].includes(catLower) || String(item.id || '').startsWith('ability_') || String(item.id || '').startsWith('boon_')) {
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
      notify(`✨ Special Ability / Boon "${item.name}" added to character!`, 'success');
    } else if (type === 'potion' || type === 'scroll' || type === 'wand' || type === 'consumable' || (item.category && item.category.toLowerCase() === 'consumable')) {
      if (!character.consumables) character.consumables = [];
      character.consumables.push({
        id: item.id,
        name: item.name,
        qty: 1,
        effect: item.benefit || item.description || `${item.type || 'Consumable'} effect`
      });
      notify(`🧪 "${item.name}" (${item.type || 'Consumable'}) added to backpack!`, 'success');
    } else {
      // Body Slot Equipment (Armor, Shield, Wondrous Item, Ring, etc. in Pure Canonical V3)
      const rawSlot = (item.slot || '').toLowerCase().trim();
      const slotLower = (item.slot || item.category || '').toLowerCase();
      let slotKey = null;
      if (rawSlot === 'none' || rawSlot === 'slotless') {
        slotKey = null;
      } else if (slotLower.includes('armor')) slotKey = 'armor';
      else if (slotLower.includes('shield')) slotKey = 'offHand';
      else if (slotLower.includes('belt') || slotLower.includes('waist')) slotKey = 'belt';
      else if (slotLower.includes('head')) slotKey = 'head';
      else if (slotLower.includes('eyes') || slotLower.includes('face')) slotKey = 'eyes';
      else if (slotLower.includes('neck') || slotLower.includes('throat')) slotKey = 'neck';
      else if (slotLower.includes('shoulders')) slotKey = 'shoulders';
      else if (slotLower.includes('torso') || slotLower.includes('body')) slotKey = 'torso';
      else if (slotLower.includes('bracers') || slotLower.includes('arms')) slotKey = 'bracers';
      else if (slotLower.includes('gloves') || slotLower.includes('hands')) slotKey = 'gloves';
      else if (slotLower.includes('boots') || slotLower.includes('feet')) slotKey = 'boots';
      else if (slotLower.includes('ring')) {
        slotKey = (!character.bodySlots?.ring1 || character.bodySlots.ring1.name === '-') ? 'ring1' : 'ring2';
      }

      if (slotKey && character.bodySlots) {
        character.bodySlots[slotKey] = {
          schemaVersion: 3,
          id: item.id,
          blueprint: item.blueprint || ((slotKey === 'armor' || slotKey === 'offHand') ? 'armor' : 'wondrous'),
          baseItemId: item.baseItemId || null,
          name: item.name,
          masterDbName: item.name,
          active: true,
          category: item.category || item.type || 'Wondrous Item',
          weight: Number(item.weight ?? item.weightLb) || 0,
          cost: Number(item.cost ?? item.priceGp) || 0,
          desc: item.benefit || item.description || '',
          enhancementBonus: Number(item.enhancementBonus) || 0,
          material: item.material || null,
          choices: Array.isArray(item.choices) ? JSON.parse(JSON.stringify(item.choices)) : [],
          effects: Array.isArray(item.effects) ? JSON.parse(JSON.stringify(item.effects)) : [],
          powers: Array.isArray(item.powers) ? JSON.parse(JSON.stringify(item.powers)) : [],
          modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
          armor: item.armor ? JSON.parse(JSON.stringify(item.armor)) : undefined,
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
          notify(`🛡️ "${item.name}" equipped (${slotKey} slot) and added to backpack!`, 'success');
        }
      } else {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Item Added',
            breakdown: `"${item.name}" added to inventory pool.`,
            icon: '🎒'
          });
        } else {
          notify(`🎒 "${item.name}" (${item.type}) added to backpack / inventory pool!`, 'success');
        }
      }
    }

    // Attach any active special abilities from embedded modes (Pure Canonical V3)
    if (Array.isArray(item.modes) && item.modes.length > 0 && type !== 'weapon' && type !== 'spell') {
      if (!character.specialAbilities) character.specialAbilities = [];
      item.modes.forEach(m => {
        if (!m || !m.name || /^inactive|off$/i.test(m.name)) return;
        const existsIdx = character.specialAbilities.findIndex(a => (a.name || '').toLowerCase() === m.name.toLowerCase());
        const abilityObj = {
          schemaVersion: 3,
          id: m.id || `mode_${Date.now()}`,
          blueprint: 'feat',
          name: m.name,
          source: item.name,
          action: m.actionType || 'Standard Action',
          benefit: m.benefit || '',
          effects: Array.isArray(m.effects) ? JSON.parse(JSON.stringify(m.effects)) : [],
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

    const catalog = (typeof window !== 'undefined' && window.SrdCompendium && typeof window.SrdCompendium.getAllLoaded === 'function' ? window.SrdCompendium.getAllLoaded() : null) || [];
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
    return this.equipItem(v2);
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
      const rollSum = this._getPrimaryRollSummary(item);
      const primaryDice = rollSum.dice || wStats.baseDamage || '1d8';
      const critMin = wStats.critMin || 20;
      const critMult = wStats.critMult || 2;
      const dmgType = rollSum.dmgType || (Array.isArray(wStats.damageTypes) ? wStats.damageTypes.join('/') : 'Slashing');
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
              <button data-action="rm:toggle-pin" data-idx="${idx}" data-pin-badge="${RuleMaster.escapeHtml(item.type)}" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Pin / Unpin to Combat Cockpit">📌</button>
              <button data-action="rm:open-modal" data-idx="${idx}" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Edit">✏️</button>
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
                <button data-action="rm:equip-weapon-slot" data-weapon-name="${RuleMaster.escapeHtml(item.name)}" data-hand="Main Hand" class="bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-[10px] font-bold px-2 py-1 rounded transition">⚡ Main Hand</button>
                <button data-action="rm:equip-weapon-slot" data-weapon-name="${RuleMaster.escapeHtml(item.name)}" data-hand="Off-Hand" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-1 rounded transition">⚡ Off-Hand</button>
              ` : `
                <button data-action="rm:equip-to-char" data-idx="${idx}" class="bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-200 text-[10px] font-bold px-2 py-1 rounded transition">🛡️ Equip</button>
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
      const primaryDice = this._getPrimaryRollSummary(item).dice || '';

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
              <button data-action="rm:toggle-pin" data-idx="${idx}" data-pin-badge="${RuleMaster.escapeHtml(item.type)}" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Pin / Unpin to Combat Cockpit">📌</button>
              <button data-action="rm:open-modal" data-idx="${idx}" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Edit">✏️</button>
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
              <button data-action="rm:equip-to-char" data-idx="${idx}" class="bg-purple-900/60 hover:bg-purple-600 text-purple-200 text-xs font-bold px-3 py-1 rounded border border-purple-700 transition">✨ Add to Spells Known</button>
            ` : (isManeuver ? `
              <button data-action="rm:equip-to-char" data-idx="${idx}" class="bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold px-3 py-1 rounded transition">⚔️ Ready Maneuver</button>
            ` : `
              <button data-action="rm:equip-to-char" data-idx="${idx}" class="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 text-xs font-bold px-3 py-1 rounded transition">🥋 Activate Stance</button>
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
              <button data-action="rm:toggle-pin" data-idx="${idx}" data-pin-badge="Feat" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Pin / Unpin to Combat Cockpit">📌</button>
              <button data-action="rm:open-modal" data-idx="${idx}" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Edit">✏️</button>
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
            <button data-action="rm:equip-to-char" data-idx="${idx}" class="bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-200 text-xs font-bold px-3 py-1 rounded transition">✨ Add Feat to Character</button>
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
      const primaryBonusType = this._getPrimaryBonusType(item, 'Untyped');

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
              <button data-action="rm:toggle-pin" data-idx="${idx}" data-pin-badge="${RuleMaster.escapeHtml(primaryBonusType)}" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Pin / Unpin to Combat Cockpit">📌</button>
              <button data-action="rm:open-modal" data-idx="${idx}" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Edit">✏️</button>
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
            <button data-action="rm:equip-to-char" data-idx="${idx}" class="bg-teal-950 hover:bg-teal-900 border border-teal-700 text-teal-200 text-xs font-bold px-3 py-1 rounded transition">
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
                <button data-action="rm:add-child-power" data-idx="${pIdx}" class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-2.5 py-1 rounded shadow transition flex items-center gap-1">
                  <span>➕</span>
                  <span>Add Mode</span>
                </button>
                <button data-action="rm:open-modal" data-idx="${pIdx}" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition">✏️</button>
              </div>
            </div>

            <div class="space-y-2 pl-4 border-l-2 border-purple-500/50">
              ${modes.map(mode => {
                const modeDice = this._getPrimaryRollSummary(mode).dice || '';
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
    if ((await DnDUI.confirm('⚠️ Are you sure you want to clear all custom entries from this character\'s Custom DB?', { tone: 'danger' }))) {
      masterDb.length = 0;
      if (typeof character !== 'undefined' && character) {
        character.customDb = masterDb;
      }
      this.selectedIds.clear();
      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      this.renderTable();
      if (typeof renderAll === 'function') renderAll();
      notify('✅ Character Custom DB has been cleared!', 'success');
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

  // 0-Token Deterministic Rule Parser (Parses raw text from d20srd, books or SRD into Pure Canonical V3)
  parseRawText() {
    const raw = document.getElementById('raw-rule-input')?.value || '';
    if (!raw.trim()) {
      notify('⚠️ Please paste rule text to parse.', 'error');
      return;
    }

    // 0. Check if raw text is a Structured Ability / Breath Weapon Stat Block
    const structuredAbility = this.parseStructuredAbilityStatBlock(raw);
    if (structuredAbility && structuredAbility.name) {
      this.openModalWithData(this.normalizeEntry(structuredAbility), -1);
      return;
    }

    // 1. Unified 16-family V3 Scriber (preserves any unparsed complex clauses as rule notes)
    const fullText = raw.toLowerCase();
    const bp = (fullText.includes('evocation') || fullText.includes('transmutation') || fullText.includes('abjuration') || fullText.includes('casting time') || fullText.includes('stance') || fullText.includes('discipline'))
      ? 'spell'
      : ((fullText.includes('damage:') || fullText.includes('critical:')) ? 'weapon'
      : ((fullText.includes('armor bonus:') || fullText.includes('shield bonus:')) ? 'armor'
      : ((fullText.includes('price:') || fullText.includes('body slot:')) ? 'wondrous' : 'feat')));

    if (typeof RuleEngine !== 'undefined' && typeof RuleEngine.scribeRuleText === 'function') {
      const sRes = RuleEngine.scribeRuleText(raw, { blueprint: bp, preserveUnparsedAsRuleBlocks: true });
      if (sRes && sRes.entry) {
        const entry = this.normalizeEntry(sRes.entry);
        const prereqMatch = raw.match(/Prerequisite[s]?:?\s*(.*?)(?=\.|\n|$)/i);
        if (prereqMatch) entry.prereq = prereqMatch[1].trim();
        this.openModalWithData(entry, -1);
        return;
      }
    }

    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const entry = this.createEmptyEntry('Feat');
    if (lines.length > 0) entry.name = lines[0].replace(/\[.*?\]/g, '').trim();
    entry.benefit = lines.slice(1).join(' ');
    entry.description = entry.benefit;
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
      notify('⚠️ Please enter the name of the rule, feat, spell, or item to search.', 'error');
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
        notify(msg, 'error');
      }
      catSelect?.focus();
      return;
    }

    // 0ms Local Resolution: the character's own entries (partial match, category-filtered) first,
    // then exact core lookup (Master DB -> SrdCompendium -> ItemAssembler -> DMG Synthesizer -> Full Scriber)
    const customHits = this.searchCustomEntries(query, categoryHint);
    const customIds = new Set(customHits.map(e => String(e.id || e.name).toLowerCase()));
    const localHits = customHits.concat(
      this.resolveLocalZeroTokenQuery(query).filter(e => !customIds.has(String(e.id || e.name).toLowerCase()))
    );
    if (localHits.length > 0) {
      this.renderInlineAiResults(localHits);
      const st = document.getElementById('inline-ai-status-text');
      const spinner = document.getElementById('inline-ai-loading-spinner');
      if (spinner) spinner.classList.add('hidden');
      const dbInfo = this.getExistingSiteDbInfo(localHits[0]);
      if (st) {
        st.innerHTML = dbInfo.exists
          ? `✅ <b>"${RuleMaster.escapeHtml(localHits[0].name)}"</b> already exists in the site database (<b>${dbInfo.sourceLabel}</b>). Direct duplicate addition to Master DB is disabled — click <b>Change &amp; Add</b> to customize and save a modified version.`
          : `⚡ <b>"${RuleMaster.escapeHtml(localHits[0].name)}"</b> crafted instantaneously in Pure Canonical V3 (0 ms, Zero Tokens).`;
      }
      const lb = document.getElementById('inline-ai-loading-box');
      if (lb) lb.classList.remove('hidden');
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      // Offline Partial Scriber fallback (0 tokens, preserves remaining clauses as rule notes)
      if (typeof RuleEngine !== 'undefined' && typeof RuleEngine.scribeRuleText === 'function' && query.length >= 12) {
        const sRes = RuleEngine.scribeRuleText(query, { blueprint: 'feat', preserveUnparsedAsRuleBlocks: true });
        if (sRes && sRes.hasRealMech) {
          this.renderInlineAiResults([this.normalizeEntry(sRes.entry)]);
          return;
        }
      }
      notify('⚠️ Please enter a Google Gemini API Key first (free key from Google AI Studio).\nYou can save your key in the Settings dialog.', 'error');
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
      notify(`⚠️ Failed to fetch rule: ${err.message}\nPlease check your internet connection and API key.`, 'error');
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
            <div class="text-xs font-bold ${newEntriesCount === 0 ? 'text-amber-300' : 'text-white'}">${newEntriesCount === 0 ? (entries.length === 1 ? `"${RuleMaster.escapeHtml(entries[0].name)}" Already Exists in Site Database (${firstDbInfo.sourceLabel})` : `${entries.length} Rule(s) Already Exist in Site Database`) : `${entries.length} Pure Canonical V3 Rule(s) Crafted`}</div>
            <div class="text-[10px] text-slate-400">${newEntriesCount === 0 ? 'Direct duplicate addition to Master DB is disabled — click "Change & Add" to customize and save a modified version' : 'Parent entry and embedded modes can be added together'}</div>
          </div>
        </div>
        ${newEntriesCount > 0 ? `
          <button data-action="rm:add-all-inline" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer">
            <span>📥</span>
            <span>${newEntriesCount < entries.length ? `Add New to DB (${newEntriesCount})` : 'Add All to DB'}</span>
          </button>
        ` : (entries.length === 1 ? `
          <button data-action="rm:change-add-inline" data-idx="0" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer">
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
                ${this.getCustomKindBadgeHtml(item)}
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
                <button data-action="rm:change-add-inline" data-idx="${idx}" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow transition flex items-center gap-1 cursor-pointer" title="Modify this entry in the Builder and add to Custom Master DB">
                  <span>✏️</span>
                  <span>Change &amp; Add</span>
                </button>
              ` : `
                <button data-action="rm:add-inline" data-idx="${idx}" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow transition flex items-center gap-1 cursor-pointer">
                  <span>📥</span>
                  <span>Add to DB</span>
                </button>
              `}
              <button data-action="rm:equip-inline" data-idx="${idx}" class="bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 text-xs px-2 py-1 rounded-lg transition font-bold cursor-pointer" title="Equip to Character">
                ⚡ Equip
              </button>
              ${!dbInfo.exists ? `
                <button data-action="rm:edit-inline" data-idx="${idx}" class="bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs px-2 py-1 rounded-lg border border-slate-700 transition cursor-pointer" title="Inspect / Edit in Form">
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
    notify(`✅ "${item.name}" successfully added to Master_DB and library updated!`, 'success');
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
      notify('ℹ️ All listed entries already exist in the site database. Use "Change & Add" to customize an entry before adding it to Master DB.', 'info');
      return;
    }
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    notify(`✅ A total of ${addedCount} Pure Canonical V3 rule(s) successfully added to Master_DB!`, 'success');
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
  // FREE-TEXT HYBRID V3 SCRIBER & RULE MASTER ENGINE
  // ====================================================
  switchInlineMode(mode) {
    if (mode === 'forge' || mode === 'manual') {
      if (this.openMasterDbRuleCrafter()) return;
      mode = 'search';
    }
    const modal = document.getElementById('modal-master-db-editor');
    if (modal && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
    }

    const searchPanel = document.getElementById('inline-mode-search');
    const freetextPanel = document.getElementById('inline-mode-freetext');
    const btnSearch = document.getElementById('btn-inline-mode-search');
    const btnFreetext = document.getElementById('btn-inline-mode-freetext');
    const headerTitle = document.getElementById('inline-panel-header-title');

    const activeCls = 'ui-btn-md w-full h-9 px-2.5 rounded-lg font-bold transition bg-slate-800/95 text-purple-200 border border-purple-400/60 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer';
    const inactiveCls = 'ui-btn-md w-full h-9 px-2.5 rounded-lg font-bold transition text-slate-400 hover:text-white border border-transparent flex items-center justify-center gap-1.5 cursor-pointer';

    if (searchPanel) searchPanel.classList.toggle('hidden', mode !== 'search');
    if (freetextPanel) freetextPanel.classList.toggle('hidden', mode !== 'freetext');

    if (btnSearch) btnSearch.className = mode === 'search' ? activeCls : inactiveCls;
    if (btnFreetext) btnFreetext.className = mode === 'freetext' ? activeCls : inactiveCls;

    if (mode === 'freetext') {
      if (headerTitle) headerTitle.textContent = 'Rule Master Free-Text Parser';
      const ta = document.getElementById('inline-ai-freetext-input');
      if (ta) ta.focus();
    } else {
      if (headerTitle) headerTitle.textContent = 'Rule Master & Rule Crafter';
      const q = document.getElementById('inline-ai-rule-query');
      if (q) q.focus();
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
      notify('⚠️ Please paste rule text into the free-text box first.', 'error');
      return;
    }
    const fullTa = document.getElementById('raw-rule-input');
    if (fullTa) fullTa.value = val;
    this.parseRawText();
  },

  async queryAiFreeTextRows(rawText, apiKey, statusTextEl = null) {
    // 0a. 0ms Deterministic V3 Resolution for Structured Ability / Breath Weapon Stat Blocks
    const structuredHit = this.parseStructuredAbilityStatBlock(rawText);
    if (structuredHit && structuredHit.name) {
      return [this.normalizeEntry(structuredHit)];
    }

    // 0b. Unified 16-Family V3 Scriber:
    //     - `coverage === 'full'`: 0-token instant completion
    //     - `coverage === 'partial'`: Hybrid Partial Scribe -> AI Refine (or 0-token offline preservation if no API key)
    const low = String(rawText || '').toLowerCase();
    const bpGuess = (low.includes('casting time') || low.includes('transmutation') || low.includes('evocation') || low.includes('abjuration') || low.includes('conjuration'))
      ? 'spell'
      : ((low.includes('price:') || low.includes('body slot:')) ? 'wondrous' : 'feat');
    if (typeof RuleEngine !== 'undefined' && typeof RuleEngine.scribeRuleText === 'function') {
      const sRes = RuleEngine.scribeRuleText(rawText, { blueprint: bpGuess, preserveUnparsedAsRuleBlocks: !apiKey });
      if (sRes && sRes.hasRealMech) {
        if (sRes.coverage === 'full' || !apiKey) {
          return [this.normalizeEntry(sRes.entry)];
        }
        if (sRes.coverage === 'partial') {
          return await this.refinePartialScribeWithAi(rawText, sRes, bpGuess === 'spell' ? 'Spell' : (bpGuess === 'wondrous' ? 'Wondrous Item' : 'Feat'), apiKey, statusTextEl);
        }
      }
    }

    if (!apiKey) {
      throw new Error('Please configure a Google Gemini API Key to parse unstructured free-text rules.');
    }

    const promptText = `You are a master D&D 3.5e Rule Arbiter and Pure Canonical V3 Architect.
The user has provided a raw, free-form text block copied from a D&D 3.5e sourcebook, PDF, SRD, or homebrew note:

RAW TEXT:
'''
${rawText}
'''

${this.DND35_RAW_GUARDRAIL}

${this.V3_MECHANICS_CONTRACT}

TASK:
Analyze and craft this free-form text completely into Pure Canonical V3 JSON entries (schemaVersion: 3).
CRITICAL RULES:
1. STRICT REAL RAW 3.5E RULES ONLY (100% official English terminology, zero U+1F3B2 dice emoji).
2. NEVER emit "modifiers", "damageParts", "defenses", or "resources"! Put passive bonuses, formulas, and stat swaps in "effects", activated abilities / breath weapons / SLAs in "powers", player choices in "choices", and mutually exclusive selectable modes in "modes".
3. Weapons ("blueprint": "weapon") populate "weapon", Armors/Shields ("blueprint": "armor") populate "armor", Domains ("blueprint": "domain") populate "grants.grantedPower" + "grants.spellLadder", Races ("blueprint": "race") populate "race".

OUTPUT REQUIREMENT:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 3,
      "id": "feat-unique-slug",
      "blueprint": "feat",
      "name": "Entry Name",
      "type": "Feat|Special Ability|Racial Trait|Class Feature|Homebrew|Weapon|Armor|Shield|Ring|Wondrous Item|Augment Crystal|Spell|Power|Potion|Scroll|Wand|Consumable|Maneuver|Stance|Template|Race|Deity|Domain|Condition",
      "slot": "None",
      "source": "PHB p.92 / DMG p.224",
      "prereq": "-",
      "benefit": "Concise mechanical summary in English",
      "text": "Full RAW text in English",
      "description": "Full RAW text in English",
      "choices": [],
      "effects": [],
      "powers": [],
      "modes": []
    }
  ]
}`;

    const modelsToTry = this._expandGeminiCandidates(this._sanitizeModelList(await this.getAvailableGeminiModels(apiKey, false, 'IMPORT_BATCH')));
    let successData = null;
    let usedModel = null;
    let lastError = null;

    for (const model of modelsToTry) {
      if (this._isDeprecatedGeminiModel(model)) continue;
      if (statusTextEl) {
        statusTextEl.textContent = `Analyzing free text (Model: ${model})...`;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 11000);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const genConfig = {
          responseMimeType: 'application/json',
          temperature: 0.0
        };
        if (model.includes('2.5')) genConfig.thinkingConfig = { thinkingBudget: 0 };
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: genConfig
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const msg = errData.error?.message || `HTTP ${response.status}`;
          if (this.isGeminiModelRetiredError(response.status, msg)) this.markGeminiModelRetired(model);
          throw new Error(msg);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleanText = this.cleanJsonText(text);
          successData = JSON.parse(cleanText);
          usedModel = model;
          break;
        }
      } catch (err) {
        clearTimeout(timeoutId);
        const errMsg = err && err.name === 'AbortError' ? `Timeout (11s) - ${model} did not respond.` : err.message;
        console.warn(`Model ${model} free-text parse failed:`, errMsg);
        lastError = new Error(errMsg);
      }
    }

    if (!successData) {
      throw new Error(lastError?.message || 'All Gemini models failed to respond.');
    }

    let rawItems = successData.entries || successData.rows || (Array.isArray(successData) ? successData : [successData]);
    if (!Array.isArray(rawItems)) {
      throw new Error('Model failed to produce the expected entry array.');
    }

    rawItems = await this._validateAndRepairAiItems(rawItems, bpGuess, usedModel, modelsToTry, apiKey, statusTextEl);
    return this.convertRowsToEntries(rawItems).map(e => this.ensureV2(e));
  },

  processAiRows(rowsOrEntries) {
    const entries = this.convertRowsToEntries(rowsOrEntries).map(e => this.ensureV2(e));
    this.lastAiResults = entries;
    this.renderAiResults();
  },

  async queryInlineAiFreeText() {
    const ta = document.getElementById('inline-ai-freetext-input');
    const text = ta?.value?.trim() || '';
    if (!text) {
      notify('⚠️ Please paste the free-form rule text to analyze.', 'error');
      ta?.focus();
      return;
    }

    const apiKey = this.getApiKey();
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
      if (!apiKey) {
        notify('⚠️ Please enter a Google Gemini API Key first (free key from Google AI Studio).\nYou can save your key in the Settings dialog.', 'error');
        if (typeof openSettingsModal === 'function') openSettingsModal();
      } else {
        notify(`⚠️ Failed to parse free text: ${err.message}\nPlease check your internet connection and API key.`, 'error');
      }
    } finally {
      if (btn) btn.disabled = false;
      if (loadingBox) loadingBox.classList.add('hidden');
    }
  },

  async queryFullAiFreeText() {
    const ta = document.getElementById('raw-rule-input');
    const text = ta?.value?.trim() || '';
    if (!text) {
      notify('⚠️ Please paste the free-form rule text to analyze.', 'error');
      ta?.focus();
      return;
    }

    const apiKey = this.getApiKey();
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
      if (!apiKey) {
        notify('⚠️ Please configure a Google Gemini API Key first.', 'error');
        this.promptChangeApiKey();
      } else {
        notify(`⚠️ Failed to parse free text: ${err.message}`, 'error');
      }
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
              <button type="button" data-action="rm:copilot-stat" data-stat="${RuleMaster.escapeHtml(recommendedStat)}" class="w-full mt-1 py-1 rounded bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/50 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer">
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
            <button type="button" data-action="rm:copilot-feat" data-feat="${RuleMaster.escapeHtml(recommendedFeat)}" data-benefit="${RuleMaster.escapeHtml(featBenefit)}" data-category="${RuleMaster.escapeHtml(featCategory)}" class="w-full mt-1 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/50 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer">
              <span>⚡</span><span>Fill Feat Slot</span>
            </button>
          </div>
        </div>

        <div class="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/30 space-y-1">
          <div class="text-[11px] font-bold text-indigo-300 flex items-center justify-between">
            <span>⚔️ Tactical Synergy & Class Guide</span>
            <button type="button" data-action="rm:copilot-notes" data-notes="${RuleMaster.escapeHtml(notes)}" class="text-[10px] text-indigo-300 hover:text-white underline cursor-pointer">Copy to Notes</button>
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed">${notes}</p>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-[10px] text-slate-500 italic">💡 Add a Gemini API Key for deep tactical analysis across all 3.5e splatbooks.</span>
          <button type="button" data-action="rm:copilot-all" data-feat="${RuleMaster.escapeHtml(recommendedFeat)}" data-benefit="${RuleMaster.escapeHtml(featBenefit)}" data-category="${RuleMaster.escapeHtml(featCategory)}" data-stat="${RuleMaster.escapeHtml(recommendedStat || '')}" data-notes="${RuleMaster.escapeHtml(notes)}" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg shadow flex items-center gap-1 transition cursor-pointer">
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
                <button type="button" data-action="rm:copilot-stat" data-stat="${RuleMaster.escapeHtml(recStat)}" class="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] shadow transition cursor-pointer">
                  Apply
                </button>
              </div>
            ` : ''}

            ${recFeat ? `
              <div class="p-2 rounded-lg bg-purple-950/40 border border-purple-500/40 flex items-center justify-between">
                <div class="truncate mr-2">
                  <div class="text-[10px] font-bold text-purple-300 uppercase">Recommended Feat:</div>
                  <div class="text-xs font-black text-white truncate" title="${RuleMaster.escapeHtml(recFeat)}">${RuleMaster.escapeHtml(recFeat)}</div>
                </div>
                <button type="button" data-action="rm:copilot-feat" data-feat="${RuleMaster.escapeHtml(recFeat)}" data-benefit="${RuleMaster.escapeHtml(featBenefit)}" data-category="${RuleMaster.escapeHtml(featCategory)}" class="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] shadow transition cursor-pointer shrink-0">
                  Fill Slot
                </button>
              </div>
            ` : ''}
          </div>

          <div class="prose prose-invert text-xs leading-relaxed max-h-72 overflow-y-auto pr-1">
            ${htmlBody}
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-purple-900/50">
            <button type="button" data-action="rm:copilot-notes" data-notes="${RuleMaster.escapeHtml(notes)}" class="text-[10px] text-indigo-300 hover:text-white underline cursor-pointer">
              📝 Add Recommendation Note
            </button>
            <button type="button" data-action="rm:copilot-all" data-feat="${RuleMaster.escapeHtml(recFeat)}" data-benefit="${RuleMaster.escapeHtml(featBenefit)}" data-category="${RuleMaster.escapeHtml(featCategory)}" data-stat="${RuleMaster.escapeHtml(recStat || '')}" data-notes="${RuleMaster.escapeHtml(notes)}" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 transition cursor-pointer active:scale-95">
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
      notify('⚠️ A valid Gemini API key is required for Compendium auditing.', 'error');
      this.promptChangeApiKey();
      return;
    }

    const items = (Array.isArray(this.masterDb) ? this.masterDb : [])
      .filter(i => i && i.name);

    if (items.length === 0) {
      notify('ℹ️ Your local user database has no custom entries yet.\n\nAll 7,987 entries in the Modular SRD V3 Compendium are already deterministically verified.', 'info');
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
              <h3 class="font-bold text-sm text-purple-300">RAW 3.5e &amp; Pure Canonical V3 Compendium Audit (Gemini Pro)</h3>
              <p class="text-[11px] text-slate-400">Scanning ${items.length} custom record(s) in master_db...</p>
            </div>
          </div>
          <button data-action="rm:close-audit-modal" class="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 rounded bg-slate-800 cursor-pointer">✕</button>
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
        blueprint: i.blueprint,
        name: i.name,
        type: i.type,
        source: i.source,
        prereq: i.prereq,
        benefit: i.benefit || i.description,
        effects: Array.isArray(i.effects) ? i.effects : [],
        powers: Array.isArray(i.powers) ? i.powers : [],
        choices: Array.isArray(i.choices) ? i.choices : [],
        modes: Array.isArray(i.modes) ? i.modes : [],
        isFighterBonusFeat: i.isFighterBonusFeat
      }));

      const auditPrompt = `You are an uncompromising D&D 3.5e RAW & Pure Canonical V3 Auditor.
Audit these user-added custom records from their master_db:
${JSON.stringify(sampleItems, null, 2)}

TASK:
1. Verify if each item exists in official 3.5e WotC books or is unofficial homebrew.
2. Detect any 5e mechanics (Advantage/Disadvantage, Bonus Action, Finesse adding Dex to damage, etc.).
3. Check if prerequisites, V3 effects[], powers[], choices[], modes[], and fighter bonus feat flags match RAW 3.5e and Pure Canonical V3 (schemaVersion: 3, zero legacy modifiers/damageParts).

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
        const safeStatus = RuleMaster.escapeHtml(r.status || 'APPROVED');
        const safeIssuesHtml = Array.isArray(r.issues) && r.issues.length
          ? `<p class="text-[10px] text-amber-200">${r.issues.map(iss => RuleMaster.escapeHtml(iss)).join(' | ')}</p>`
          : `<p class="text-[10px] text-emerald-400">100% compliant with official D&D 3.5e RAW and Pure Canonical V3 standards.</p>`;
        return `
          <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white">${RuleMaster.escapeHtml(r.name)}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}">
                ${badgeIcon} ${safeStatus}
              </span>
            </div>
            ${safeIssuesHtml}
          </div>
        `;
      }).join('');

    } catch (err) {
      const contentEl = document.getElementById('rule-master-audit-content');
      if (contentEl) {
        contentEl.innerHTML = `<div class="p-3 text-rose-300 bg-rose-950/40 rounded border border-rose-800">Error: ${RuleMaster.escapeHtml(err.message)}</div>`;
      }
    }
  },

  /**
   * Emit a reactive persona lifecycle event so the corner Rule Master / Chronicler
   * companion visibly reacts when Craft with Rule Master or AI tasks run.
   */
  emitPersonaEvent(detail) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    try {
      window.dispatchEvent(new CustomEvent('rulemaster:persona', {
        detail: Object.assign({ persona: 'rulemaster', state: 'idle', message: '' }, detail || {})
      }));
    } catch (e) {
      reportError('rule_master:emitPersonaEvent', e);
    }
  },

  /**
   * Shared dynamic-router Gemini chat/text caller for the Corner Assistant
   * (Rule Master & Chronicler) and Hub Notes AI synthesis.
   * Uses the user's BYOK key and 9-slot failover routing matrix.
   */
  async askAssistantChat({ systemPrompt = '', messages = [], userPrompt = '', temperature = 0.2, taskType = 'QUICK_SEARCH', responseMimeType = 'application/json', timeoutMs = 20000, totalTimeoutMs = 25000, onProgress = null } = {}) {
    const apiKey = (this.getApiKey() || '').trim();
    if (!apiKey) {
      throw new Error('NO_API_KEY');
    }

    const deadline = Date.now() + Math.max(1000, Number(totalTimeoutMs) || 25000);
    const taskModels = this._sanitizeModelList(await this.getAvailableGeminiModels(apiKey, false, taskType));
    const candidates = this._expandGeminiCandidates(taskModels);
    const rawTurns = Array.isArray(messages) && messages.length > 0
      ? messages
          .map(m => ({ role: m.role === 'model' ? 'model' : 'user', text: String(m.text || '').trim() }))
          .filter(m => m.text.length > 0)
      : [{ role: 'user', text: String(userPrompt || '').trim() }].filter(m => m.text.length > 0);
    // Gemini API requires contents to start with 'user' and strictly alternate user/model turns
    while (rawTurns.length > 0 && rawTurns[0].role !== 'user') rawTurns.shift();
    const contents = [];
    for (const turn of rawTurns) {
      const prev = contents[contents.length - 1];
      if (prev && prev.role === turn.role) {
        prev.parts[0].text += '\n' + turn.text;
      } else {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
      }
    }
    if (contents.length === 0) {
      throw new Error('Empty prompt.');
    }

    let lastErr = null;
    const attemptErrors = [];

    for (const model of candidates) {
      if (this._isDeprecatedGeminiModel(model)) continue;
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 500) {
        attemptErrors.push({ model, message: `Total timeout (${Math.round(totalTimeoutMs / 1000)}s) reached`, retired: false });
        break;
      }
      if (typeof onProgress === 'function') {
        try { onProgress(model); } catch (e) { reportError('rule_master:askAssistantChat:onProgress', e); }
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const genConfig = { temperature };
      if (responseMimeType) genConfig.responseMimeType = responseMimeType;
      if (model.includes('2.5-flash')) {
        genConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const payload = { contents, generationConfig: genConfig };
      if (systemPrompt) {
        payload.systemInstruction = { parts: [{ text: String(systemPrompt) }] };
      }

      const controller = new AbortController();
      const attemptTimeout = Math.min(timeoutMs, remainingMs);
      const timer = setTimeout(() => controller.abort(), attemptTimeout);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (rawText.trim()) {
            return { text: rawText.trim(), model };
          }
          attemptErrors.push({ model, message: `${model}: empty response`, retired: false });
        } else {
          const errJson = await res.json().catch(() => ({}));
          const msg = errJson?.error?.message || `HTTP ${res.status}`;
          const isRetired = typeof this.isGeminiModelRetiredError === 'function'
            && this.isGeminiModelRetiredError(res.status, msg);
          if (isRetired && typeof this.markGeminiModelRetired === 'function') {
            this.markGeminiModelRetired(model);
          } else if (typeof this.isGeminiModelBusyError === 'function' && this.isGeminiModelBusyError(res.status, msg)) {
            this.markGeminiModelBusy(model);
          }
          attemptErrors.push({ model, message: `${model}: ${msg}`, retired: isRetired });
          lastErr = new Error(msg);
          if (res.status === 401 || res.status === 403) break;
        }
      } catch (err) {
        clearTimeout(timer);
        const msg = err?.name === 'AbortError' ? 'timeout' : (err?.message || 'network error');
        if (err?.name === 'AbortError' || (typeof this.isGeminiModelBusyError === 'function' && this.isGeminiModelBusyError(0, msg))) {
          this.markGeminiModelBusy(model);
        }
        attemptErrors.push({ model, message: `${model}: ${msg}`, retired: false });
        lastErr = err;
      }
    }

    throw new Error(this._summarizeGeminiErrors(attemptErrors) || lastErr?.message || 'Gemini API did not respond.');
  }
};

if (typeof document !== 'undefined') {
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

  // --- Static index.html Rule Master controls (inline modes, AI query, Master DB sub-tabs, editor modal) ---
  window.Actions.register('mdb:switch-inline-mode', (el, data) => {
    RuleMaster.switchInlineMode(data.mode);
  });
  window.Actions.register('mdb:open-rule-crafter', () => {
    RuleMaster.openMasterDbRuleCrafter();
  });
  window.Actions.register('mdb:inline-ai-rule-keydown', (el, data, event) => {
    if (event && event.key === 'Enter') RuleMaster.queryInlineAiRule();
  });
  window.Actions.register('mdb:query-inline-ai-rule', () => {
    RuleMaster.queryInlineAiRule();
  });
  window.Actions.register('mdb:set-inline-query-and-search', (el, data) => {
    RuleMaster.setInlineQueryAndSearch(data.query, data.categoryHint);
  });
  window.Actions.register('mdb:fill-free-text-sample', (el, data) => {
    RuleMaster.fillFreeTextSample(data.sampleType);
  });
  window.Actions.register('mdb:parse-raw-text-inline', () => {
    RuleMaster.parseRawTextFromInline();
  });
  window.Actions.register('mdb:query-inline-ai-free-text', () => {
    RuleMaster.queryInlineAiFreeText();
  });
  window.Actions.register('mdb:switch-sub-tab', (el, data) => {
    RuleMaster.switchSubTab(data.subTab);
  });
  window.Actions.register('mdb:clear-selection', () => {
    RuleMaster.clearSelection();
  });
  window.Actions.register('mdb:delete-selected-entries', () => {
    RuleMaster.deleteSelectedEntries();
  });
  window.Actions.register('mdb:toggle-select-all-filtered', (el) => {
    RuleMaster.toggleSelectAllFiltered(el.checked);
  });
  window.Actions.register('mdb:render-weapons-armors', () => {
    RuleMaster.renderWeaponsArmors();
  });
  window.Actions.register('mdb:render-spells-maneuvers', () => {
    RuleMaster.renderSpellsManeuvers();
  });
  window.Actions.register('mdb:render-feats', () => {
    RuleMaster.renderFeats();
  });
  window.Actions.register('mdb:render-magic-items', () => {
    RuleMaster.renderMagicItems();
  });
  window.Actions.register('mdb:new-entry', (el, data) => {
    RuleMaster.openModalWithData(RuleMaster.createEmptyEntry(data.entryType), -1);
  });
  window.Actions.register('mdb:set-ai-model-mode', (el) => {
    RuleMaster.setAiModelMode(el.value);
  });
  window.Actions.register('mdb:audit-library-pro', () => {
    RuleMaster.auditLibraryWithProModal();
  });
  window.Actions.register('mdb:prompt-change-api-key', () => {
    RuleMaster.promptChangeApiKey();
  });
  window.Actions.register('mdb:clear-api-key', () => {
    RuleMaster.clearApiKey();
  });
  window.Actions.register('mdb:save-api-key-from-input', () => {
    RuleMaster.saveApiKeyFromInput();
  });
  window.Actions.register('mdb:ai-rule-keydown', (el, data, event) => {
    if (event && event.key === 'Enter') RuleMaster.queryAiRule();
  });
  window.Actions.register('mdb:query-ai-rule', () => {
    RuleMaster.queryAiRule();
  });
  window.Actions.register('mdb:set-query-and-search', (el, data) => {
    RuleMaster.setQueryAndSearch(data.query, data.categoryHint);
  });
  window.Actions.register('mdb:query-ai-batch', () => {
    RuleMaster.queryAiBatch();
  });
  window.Actions.register('mdb:fill-free-text-sample-full', (el, data) => {
    RuleMaster.fillFreeTextSampleFull(data.sampleType);
  });
  window.Actions.register('mdb:parse-raw-text', () => {
    RuleMaster.parseRawText();
  });
  window.Actions.register('mdb:query-full-ai-free-text', () => {
    RuleMaster.queryFullAiFreeText();
  });
  window.Actions.register('mdb:reset-master-db-to-default', () => {
    RuleMaster.resetMasterDbToDefault();
  });
  // Backdrop click closes the editor only when the overlay itself (not its panel) was clicked.
  window.Actions.register('mdb:editor-backdrop-click', (el, data, event) => {
    if (event && event.target === el) RuleMaster.closeMasterDbEditorModal();
  });
  window.Actions.register('mdb:close-editor-modal', () => {
    RuleMaster.closeMasterDbEditorModal();
  });

  // --- Dynamic Rule Master UI delegated actions (table, AI cards, Forge, Copilot, Audit) ---
  window.Actions.register('rm:toggle-select-entry', (el, data) => {
    RuleMaster.toggleSelectEntry(data.key, Boolean(el && el.checked));
  });
  window.Actions.register('rm:open-modal', (el, data) => {
    const idx = Number(data.idx);
    RuleMaster.openModalWithData(masterDb[idx], idx);
  });
  window.Actions.register('rm:select-deity', (el, data) => {
    const deityName = data.deityName || '';
    if (typeof selectDeityItem === 'function') {
      selectDeityItem(deityName);
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({ title: 'Deity Selected', breakdown: `${deityName} set as character patron deity.`, icon: '✨' });
      }
    }
  });
  window.Actions.register('rm:duplicate-entry', (el, data) => {
    RuleMaster.duplicateEntry(Number(data.idx));
  });
  window.Actions.register('rm:delete-entry', (el, data) => {
    RuleMaster.deleteEntry(Number(data.idx));
  });
  window.Actions.register('rm:add-all-ai', () => {
    RuleMaster.addAllAiResultsToDb();
  });
  window.Actions.register('rm:change-add-ai', (el, data) => {
    RuleMaster.changeAndAddAiResult(Number(data.idx));
  });
  window.Actions.register('rm:add-ai', (el, data) => {
    RuleMaster.addAiResultToDb(Number(data.idx));
  });
  window.Actions.register('rm:equip-ai', (el, data) => {
    RuleMaster.equipAiResultToCharacter(Number(data.idx));
  });
  window.Actions.register('rm:edit-ai', (el, data) => {
    RuleMaster.editAiResultInModal(Number(data.idx));
  });
  window.Actions.register('rm:toggle-pin', (el, data) => {
    const item = typeof masterDb !== 'undefined' ? masterDb[Number(data.idx)] : null;
    if (item && typeof toggleUniversalPin === 'function') {
      toggleUniversalPin({
        name: item.name,
        type: 'Feat',
        action: 'Passive',
        desc: item.benefit || item.description || '',
        badge: data.pinBadge || item.type || 'Feat'
      });
    }
  });
  window.Actions.register('rm:equip-weapon-slot', (el, data) => {
    RuleMaster.equipWeaponSlot(data.weaponName, data.hand);
  });
  window.Actions.register('rm:equip-to-char', (el, data) => {
    RuleMaster.equipToCharacter(Number(data.idx));
  });
  window.Actions.register('rm:add-child-power', (el, data) => {
    RuleMaster.addChildPower(Number(data.idx));
  });
  window.Actions.register('rm:add-all-inline', () => {
    RuleMaster.addAllInlineResultsToDb();
  });
  window.Actions.register('rm:change-add-inline', (el, data) => {
    RuleMaster.changeAndAddInlineResult(Number(data.idx));
  });
  window.Actions.register('rm:add-inline', (el, data) => {
    RuleMaster.addInlineResultToDb(Number(data.idx));
  });
  window.Actions.register('rm:equip-inline', (el, data) => {
    RuleMaster.equipInlineResultToCharacter(Number(data.idx));
  });
  window.Actions.register('rm:edit-inline', (el, data) => {
    RuleMaster.editInlineResultInModal(Number(data.idx));
  });
  window.Actions.register('rm:copilot-stat', (el, data) => {
    if (typeof window.applyCopilotStat === 'function') window.applyCopilotStat(data.stat);
  });
  window.Actions.register('rm:copilot-feat', (el, data) => {
    if (typeof window.applyCopilotFeat === 'function') window.applyCopilotFeat(data.feat, data.benefit, data.category);
  });
  window.Actions.register('rm:copilot-notes', (el, data) => {
    if (typeof window.applyCopilotNotes === 'function') window.applyCopilotNotes(data.notes);
  });
  window.Actions.register('rm:copilot-all', (el, data) => {
    if (typeof window.applyCopilotAll === 'function') {
      window.applyCopilotAll({
        recommendedFeat: data.feat,
        featBenefit: data.benefit,
        featCategory: data.category,
        recommendedStat: data.stat || '',
        notes: data.notes
      });
    }
  });
  window.Actions.register('rm:close-audit-modal', () => {
    const modal = document.getElementById('rule-master-audit-modal');
    if (modal) modal.classList.add('hidden');
  });
  window.Actions.register('rm:close-diag-modal', () => {
    const modal = document.getElementById('rule-master-diag-modal');
    if (modal) modal.classList.add('hidden');
  });
}
