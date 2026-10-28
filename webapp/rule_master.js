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
      name: "Yerel Kural Kataloğu & Parametrik AI Motoru",
      scope: "Yerel SRD Kataloğu (140+ kayıt) & Parametrik LLM Motoru (Sıfır ağ gecikmesi, %100 RAW 3.5e)",
      url: "#",
      type: "Yerel JSON & LLM",
      status: "Aktif",
      role: "Anında yerel Spotlight araması ve parametrik kural üretim motoru"
    },
    {
      priority: 2,
      name: "Core 3.5e SRD (d20srd & dndsrd)",
      scope: "PHB, DMG, MM Core Kuralları, Featler, Büyüler, Eşyalar",
      url: "https://www.d20srd.org/index.html",
      mirror: "http://dndsrd.net",
      type: "Temiz HTML",
      status: "Aktif",
      role: "İlk taranacak temel kural kaynağı ve web referansı"
    },
    {
      priority: 3,
      name: "Extended Splatbooks Index (srd.dndtools)",
      scope: "Complete serisi, MIC, Spell Compendium, Frostburn, Sandstorm",
      url: "https://srd.dndtools.org",
      type: "Geniş HTML İndeksi",
      status: "Aktif",
      role: "Core dışı genişletilmiş ek kitap arşivi"
    }
  ],

  // Comprehensive D&D 3.5e Splatbooks and Sourcebooks Catalog
  splatbooks: [
    { code: "PHB", name: "Player's Handbook 3.5", cat: "Core", note: "Temel sınıflar, ırklar, hünerler ve büyüler", url: "https://www.d20srd.org" },
    { code: "DMG", name: "Dungeon Master's Guide 3.5", cat: "Core", note: "Büyülü eşyalar, prestij sınıfları, hazine", url: "https://www.d20srd.org" },
    { code: "MM", name: "Monster Manual 3.5", cat: "Core", note: "Yaratıklar, ırksal özellikler ve şablonlar", url: "https://www.d20srd.org" },
    { code: "MIC", name: "Magic Item Compendium", cat: "Equipment", note: "Genişletilmiş büyülü eşyalar, vücut yuvaları ve kristaller", url: "https://srd.dndtools.org" },
    { code: "SpC", name: "Spell Compendium", cat: "Spells", note: "Tüm ek kitapların birleşik devasa büyü arşivi", url: "https://srd.dndtools.org" },
    { code: "ToB", name: "Tome of Battle (Book of 9 Swords)", cat: "Combat", note: "Savaş manevraları, duruşlar (stances), Martial Adept sınıfları", url: "https://srd.dndtools.org" },
    { code: "CW", name: "Complete Warrior", cat: "Splatbook", note: "Savaşçı sınıfları, dövüş hünerleri, prestij sınıfları", url: "https://srd.dndtools.org" },
    { code: "CD", name: "Complete Divine", cat: "Splatbook", note: "İlahi sınıflar, domainler, ilahi featler", url: "https://srd.dndtools.org" },
    { code: "CA", name: "Complete Arcane", cat: "Splatbook", note: "Warlock, Warmage, metamagic hünerleri", url: "https://srd.dndtools.org" },
    { code: "CAd", name: "Complete Adventurer", cat: "Splatbook", note: "Rogue/Bard, Skill Tricks, gizlilik ve hareket hünerleri", url: "https://srd.dndtools.org" },
    { code: "CM", name: "Complete Mage", cat: "Splatbook", note: "Büyücü arşivi, yedek büyü featleri (Reserve Feats)", url: "https://srd.dndtools.org" },
    { code: "CS", name: "Complete Scoundrel", cat: "Splatbook", note: "Taktiksel hileler, Skill Tricks, Luck Feats", url: "https://srd.dndtools.org" },
    { code: "CC", name: "Complete Champion", cat: "Splatbook", note: "Tanrı bağları, Holy Devotion featleri", url: "https://srd.dndtools.org" },
    { code: "PHB2", name: "Player's Handbook II", cat: "Core Expansion", note: "Yeni featler, Knight, Beguiler, Duskblade", url: "https://srd.dndtools.org" },
    { code: "FB", name: "Frostburn", cat: "Environment", note: "Buz ve soğuk iklim mekanikleri, soğuk büyüler ve ekipman", url: "https://srd.dndtools.org" },
    { code: "Sand", name: "Sandstorm", cat: "Environment", note: "Çöl ve kuraklık mekanikleri, ateş ve kum büyüleri", url: "https://srd.dndtools.org" },
    { code: "Storm", name: "Stormwrack", cat: "Environment", note: "Deniz, gemi ve sualtı savaş kuralları", url: "https://srd.dndtools.org" },
    { code: "LM", name: "Libris Mortis", cat: "Undead", note: "Ölümsüz yaratıklar, nekromansi kuralları ve featler", url: "https://srd.dndtools.org" },
    { code: "LoM", name: "Lords of Madness", cat: "Aberrations", note: "Mind Flayer, Beholder ve Aberration arşivleri", url: "https://srd.dndtools.org" },
    { code: "BoED", name: "Book of Exalted Deeds", cat: "Alignment", note: "Kutsal güçler, Exalted Featler ve Melekler", url: "https://srd.dndtools.org" },
    { code: "BoVD", name: "Book of Vile Darkness", cat: "Alignment", note: "Karanlık güçler, Vile Damage ve İblisler", url: "https://srd.dndtools.org" },
    { code: "XPH", name: "Expanded Psionics Handbook", cat: "Psionics", note: "Zihin güçleri, psiyonik sınıflar ve psionics combat", url: "https://www.d20srd.org" },
    { code: "RoS", name: "Races of Stone", cat: "Races", note: "Cüce ve Gnome mekanikleri, Goliath ırkı", url: "https://srd.dndtools.org" },
    { code: "RoD", name: "Races of Destiny", cat: "Races", note: "İnsan, Yarım-elf ve Illumian ırkı", url: "https://srd.dndtools.org" },
    { code: "RotW", name: "Races of the Wild", cat: "Races", note: "Elf ve Halfling mekanikleri, Raptorans", url: "https://srd.dndtools.org" },
    { code: "RotD", name: "Races of the Dragon", cat: "Races", note: "Ejderhalar, Dragonborn of Bahamut, Koboldlar", url: "https://srd.dndtools.org" },
    { code: "HoB", name: "Heroes of Battle", cat: "Campaign", note: "Büyük meydan savaşları ve ordu komutanlığı", url: "https://srd.dndtools.org" },
    { code: "HoH", name: "Heroes of Horror", cat: "Campaign", note: "Korku, delilik kuralları, Dread Necromancer", url: "https://srd.dndtools.org" },
    { code: "Dscape", name: "Dungeonscape", cat: "Exploration", note: "Zindan tuzakları, Factotum sınıfı", url: "https://srd.dndtools.org" },
    { code: "Cscape", name: "Cityscape", cat: "Exploration", note: "Şehir içi maceralar ve Urban Ranger", url: "https://srd.dndtools.org" },
    { code: "RC", name: "Rules Compendium", cat: "Rules Summary", note: "D&D 3.5e'nin tüm nihai resmi kural açıklamaları", url: "https://srd.dndtools.org" },
    { code: "PlH", name: "Planar Handbook", cat: "Planar", note: "Düzlemler arası seyahat, Jovar ve egzotik silahlar", url: "https://srd.dndtools.org" }
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

  capitalizeTitle(val) {
    if (!val || typeof val !== 'string') return val;
    const str = val.trim();
    if (!str) return str;
    const prefix = str.startsWith('↳') ? '↳ ' : '';
    const cleanStr = str.replace(/^↳\s*/, '');
    const capitalized = cleanStr.replace(/(^|[\s\/\(\[\-])([a-zğüşıöç])/gi, (match, sep, ch) => sep + ch.toUpperCase());
    return prefix + capitalized;
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
    if (typeof window !== 'undefined' && window.SchemaMigrator && typeof window.SchemaMigrator.upgradeEntryToV2 === 'function') {
      return window.SchemaMigrator.upgradeEntryToV2(entry);
    }
    if (entry.schemaVersion === 2 && Array.isArray(entry.modifiers) && Array.isArray(entry.damageParts) && Array.isArray(entry.modes)) {
      return entry;
    }
    const v2 = Object.assign({}, entry, { schemaVersion: 2 });
    if (!v2.id) {
      v2.id = `entry_${String(v2.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
    }
    if (!Array.isArray(v2.modifiers)) v2.modifiers = [];
    if (!Array.isArray(v2.damageParts)) v2.damageParts = [];
    if (!Array.isArray(v2.modes)) v2.modes = [];
    if (!v2.ruleFlags || typeof v2.ruleFlags !== 'object') v2.ruleFlags = {};
    if (!Array.isArray(v2.tacticalBadges)) v2.tacticalBadges = [];
    return v2;
  },

  // Helper: Extract Canonical V2 Stat & Damage Summary Pills for UI rendering
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
      'init': 'Init', 'speed.land': 'ft Hız', 'speed': 'ft Hız', 'hp': 'HP', 'casterlevel': 'CL', 'casterLevel': 'CL', 'skill.all': 'Skills'
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

    if (modes.length > 0) {
      pills.push(`⚡ ${modes.length} Mod`);
    }

    return pills;
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
      alert('⚠️ Lütfen geçerli bir Kural / Eşya Adı giriniz.');
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

    let syncCount = 0;
    if (oldName) {
      syncCount = this.syncMasterDbEditToCharacter(oldName, v2Entry);
    }

    if (typeof saveStateToStorage === 'function') {
      saveStateToStorage(true);
    }
    this.renderTable();
    if (typeof renderAll === 'function') {
      renderAll();
    }

    if (oldName && syncCount > 0) {
      alert(`✅ "${v2Entry.name}" Master DB'de güncellendi ve karakterinizdeki ${syncCount} kayda anında yansıtıldı!`);
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

    // 5. Sync character.feats
    if (Array.isArray(character.feats)) {
      character.feats = character.feats.map(f => {
        if (typeof f === 'string') {
          if (f.toLowerCase().trim() === cleanOld) {
            changesCount++;
            return v2.name;
          }
          return f;
        } else if (f && f.name) {
          if (f.id === v2.id || f.name.toLowerCase().trim() === cleanOld) {
            f.id = v2.id || f.id;
            f.name = v2.name;
            f.benefit = v2.benefit || f.benefit;
            f.actionType = v2.actionType || f.actionType;
            f.modifiers = Array.isArray(v2.modifiers) ? JSON.parse(JSON.stringify(v2.modifiers)) : [];
            f.ruleFlags = v2.ruleFlags ? JSON.parse(JSON.stringify(v2.ruleFlags)) : {};
            changesCount++;
          }
          return f;
        }
        return f;
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

  // Delete entry
  deleteEntry(index) {
    if (index >= 0 && index < masterDb.length) {
      const item = masterDb[index];
      if (confirm(`"${item.name}" kaydını Master DB'den kalıcı olarak silmek istediğinize emin misiniz?`)) {
        masterDb.splice(index, 1);
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
      copy.name += " (Kopya)";
      copy.id = `${copy.id}_copy_${Date.now()}`;
      masterDb.splice(index + 1, 0, copy);
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
      alert(`ℹ️ "${item.name}" zaten çantanızda mevcut!`);
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
    alert(`🎒 "${item.name}" çantanıza / envanter havuzunuza eklendi!`);
  },

  // Open Edit / Add Modal (Bridges Canonical V2 Entry -> Modal Form)
  openModalWithData(entry, editIndex = -1) {
    this.selectedEntryIndex = editIndex;
    const v2 = this.ensureV2(entry ? JSON.parse(JSON.stringify(entry)) : this.createEmptyEntry('Weapon'));
    this._currentEditingEntry = v2;
    const modal = document.getElementById('rule-crud-modal');
    if (!modal) return;

    const view = this.extractModalViewFromV2(v2);

    document.getElementById('rule-modal-title').textContent = editIndex >= 0 ? `✏️ Düzenle: ${v2.name}` : '➕ Yeni Kural / Eşya Ekle';

    document.getElementById('rf-name').value = v2.name || '';
    document.getElementById('rf-type').value = v2.type || 'Weapon';
    let slotVal = v2.slot || 'None';
    if (slotVal === 'Two-Hand' || slotVal === 'Both Hands') slotVal = 'Two-Handed';
    const slotEl = document.getElementById('rf-slot');
    if (slotEl) {
      slotEl.value = slotVal;
      if (!slotEl.value) slotEl.value = 'None';
    }
    const tagsEl = document.getElementById('rf-tags');
    if (tagsEl) {
      tagsEl.value = Array.isArray(v2.tags) ? v2.tags.join(', ') : (v2.tags || '');
    }
    document.getElementById('rf-parent').value = entry?._linkedParentName || '-';
    document.getElementById('rf-prereq').value = v2.prereq || '-';
    document.getElementById('rf-source').value = v2.source || 'PHB p.';
    document.getElementById('rf-benefit').value = v2.benefit || v2.description || '';
    const bonusTypeSelect = document.getElementById('rf-bonus-type');
    if (bonusTypeSelect) {
      const rawBonus = this.capitalizeIdentifier(view.bonusType || 'Untyped');
      let matchingOpt = Array.from(bonusTypeSelect.options).find(o => o.value.toLowerCase() === rawBonus.toLowerCase());
      if (!matchingOpt && rawBonus) {
        const newOpt = document.createElement('option');
        newOpt.value = rawBonus;
        newOpt.textContent = rawBonus;
        bonusTypeSelect.appendChild(newOpt);
        matchingOpt = newOpt;
      }
      bonusTypeSelect.value = matchingOpt ? matchingOpt.value : 'Untyped';
    }
    document.getElementById('rf-scope').value = view.scope || 'None / General';
    document.getElementById('rf-role').value = v2.role || 'General';

    // Populate Stat Buff inputs from V2 modifiers
    document.getElementById('rf-str').value = view.str;
    document.getElementById('rf-dex').value = view.dex;
    document.getElementById('rf-con').value = view.con;
    document.getElementById('rf-int').value = view.int;
    document.getElementById('rf-wis').value = view.wis;
    document.getElementById('rf-cha').value = view.cha;
    document.getElementById('rf-ac').value = view.ac;
    document.getElementById('rf-hp').value = view.hp;
    document.getElementById('rf-atk').value = view.atk;
    document.getElementById('rf-dmg').value = view.dmg;
    document.getElementById('rf-fort').value = view.fort;
    document.getElementById('rf-ref').value = view.ref;
    document.getElementById('rf-will').value = view.will;
    document.getElementById('rf-skill').value = view.skill;
    document.getElementById('rf-cl').value = view.cl;
    document.getElementById('rf-speed').value = view.speed;

    // Combat & Action from V2 damageParts / weaponStats
    document.getElementById('rf-dice').value = view.dice;
    document.getElementById('rf-crit-min').value = view.critMin;
    document.getElementById('rf-crit-mult').value = view.critMult;
    document.getElementById('rf-dmg-type').value = view.dmgType;
    document.getElementById('rf-action').value = v2.action || 'Standard Action';
    document.getElementById('rf-duration').value = v2.duration || 'Continuous';
    document.getElementById('rf-weight').value = v2.weight !== undefined ? v2.weight : 0;
    document.getElementById('rf-cost').value = v2.cost !== undefined ? v2.cost : 0;

    // Specifics
    document.getElementById('rf-school').value = v2.school || v2.spellStats?.school || '';
    document.getElementById('rf-level').value = v2.level !== undefined && v2.level !== '' ? v2.level : (v2.spellStats?.level ?? '');
    document.getElementById('rf-discipline').value = v2.discipline || v2.spellStats?.discipline || '';

    // Daily Charges / Uses
    const dcInput = document.getElementById('rf-daily-charges');
    const unitInput = document.getElementById('rf-charge-unit');
    if (dcInput) {
      let maxVal = '';
      let unit = 'charges';
      if (v2.dailyCharges && typeof v2.dailyCharges.max === 'number') {
        maxVal = v2.dailyCharges.max;
        unit = v2.dailyCharges.unit || 'charges';
      } else if (typeof v2.dailyCharges === 'number') {
        maxVal = v2.dailyCharges;
      } else if (v2.charges && typeof v2.charges === 'number') {
        maxVal = v2.charges;
      }
      dcInput.value = maxVal;
      if (unitInput) unitInput.value = unit;
    }

    // Target Skill & Multiple Skill Bonuses
    const targetSkillEl = document.getElementById('rf-target-skill');
    if (targetSkillEl) targetSkillEl.value = view.targetSkill;
    const skillBonusesEl = document.getElementById('rf-skill-bonuses');
    if (skillBonusesEl) skillBonusesEl.value = view.skillBonusesJson;

    // Armor / Shield Contextual Fields
    const maxDexEl = document.getElementById('rf-max-dex');
    if (maxDexEl) maxDexEl.value = view.maxDex;
    const checkPenaltyEl = document.getElementById('rf-check-penalty');
    if (checkPenaltyEl) checkPenaltyEl.value = view.checkPenalty;
    const asfEl = document.getElementById('rf-asf');
    if (asfEl) asfEl.value = view.asf;

    // Weapon Contextual Fields
    const rangeEl = document.getElementById('rf-range');
    if (rangeEl) rangeEl.value = view.range;
    const profEl = document.getElementById('rf-proficiency');
    if (profEl) profEl.value = view.proficiency;
    const isLightEl = document.getElementById('rf-is-light');
    if (isLightEl) isLightEl.value = view.isLight ? 'true' : 'false';
    const sizeStepsEl = document.getElementById('rf-size-steps');
    if (sizeStepsEl) sizeStepsEl.value = v2.sizeModifier?.scaling?.steps || 0;

    // Spell / Maneuver Contextual Fields
    const saveTypeEl = document.getElementById('rf-save-type');
    if (saveTypeEl) saveTypeEl.value = view.saveType;
    const srEl = document.getElementById('rf-sr');
    if (srEl) srEl.value = view.sr;
    const spellRangeEl = document.getElementById('rf-spell-range');
    if (spellRangeEl) spellRangeEl.value = view.range;
    const targetAreaEl = document.getElementById('rf-target-area');
    if (targetAreaEl) targetAreaEl.value = view.targetArea;
    const compEl = document.getElementById('rf-components');
    if (compEl) compEl.value = view.components;

    // Race Contextual Fields
    const raceSizeEl = document.getElementById('rf-race-size');
    if (raceSizeEl) raceSizeEl.value = v2.size || 'Medium';
    const baseSpeedEl = document.getElementById('rf-base-speed');
    if (baseSpeedEl) baseSpeedEl.value = v2.baseSpeed !== undefined ? v2.baseSpeed : 30;
    const favClassEl = document.getElementById('rf-favored-class');
    if (favClassEl) favClassEl.value = v2.favoredClass || 'Any';
    const langEl = document.getElementById('rf-languages');
    if (langEl) langEl.value = Array.isArray(v2.languages) ? v2.languages.join(', ') : (v2.languages || 'Common');

    // Advanced / Mode Action Fields
    const childLabelEl = document.getElementById('rf-child-label');
    if (childLabelEl) childLabelEl.value = entry?._modeButtonLabel || '';
    const effectTypeEl = document.getElementById('rf-effect-type');
    if (effectTypeEl) effectTypeEl.value = v2.effectType || '';
    const selfHpCostEl = document.getElementById('rf-self-hp-cost');
    if (selfHpCostEl) selfHpCostEl.value = v2.selfHpCost || '';

    // Rule Flags Checkboxes
    const flags = v2.ruleFlags || {};
    const setFlag = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };
    setFlag('rf-flag-touch', flags.touchAttack || flags.touch);
    setFlag('rf-flag-ignore-armor', flags.ignoreArmor);
    setFlag('rf-flag-keen', flags.critThreatDoubled || flags.keen);
    setFlag('rf-flag-reach', flags.reach);
    setFlag('rf-flag-silver', flags.silver);
    setFlag('rf-flag-cold-iron', flags.coldIron);
    setFlag('rf-flag-adamantine', flags.adamantine);
    setFlag('rf-flag-two-hand-str', flags.twoHandedStrengthMultiplier || flags.twoHandedStr);

    this.onTypeChange();
    this.initComboboxes();

    modal.classList.remove('hidden');
  },

  // Save Modal Action (Builds Canonical V2 Entry from Form Inputs)
  submitModal() {
    const editIdx = this.selectedEntryIndex;
    const baseObj = (editIdx >= 0 && masterDb && masterDb[editIdx])
      ? this.ensureV2(JSON.parse(JSON.stringify(masterDb[editIdx])))
      : (this._currentEditingEntry ? this.ensureV2(JSON.parse(JSON.stringify(this._currentEditingEntry))) : this.createEmptyEntry('Weapon'));

    const actVal = document.getElementById('rf-action').value;
    const typeVal = this.capitalizeIdentifier(document.getElementById('rf-type').value);
    const slotVal = this.capitalizeIdentifier(document.getElementById('rf-slot').value);
    const bonusTypeVal = this.capitalizeIdentifier(document.getElementById('rf-bonus-type').value || 'Untyped');
    const scopeVal = this.capitalizeIdentifier(document.getElementById('rf-scope').value || 'None / General');

    // Build V2 modifiers array from modal inputs
    const modifiers = [];
    const addMod = (target, rawVal, overrideType = null) => {
      if (rawVal === '' || rawVal === null || rawVal === undefined) return;
      const num = Number(rawVal);
      if (isNaN(num) || num === 0) return;
      modifiers.push({
        target,
        value: num,
        type: overrideType || bonusTypeVal || 'Untyped',
        condition: null
      });
    };

    addMod('ability.str', document.getElementById('rf-str').value);
    addMod('ability.dex', document.getElementById('rf-dex').value);
    addMod('ability.con', document.getElementById('rf-con').value);
    addMod('ability.int', document.getElementById('rf-int').value);
    addMod('ability.wis', document.getElementById('rf-wis').value);
    addMod('ability.cha', document.getElementById('rf-cha').value);

    const acInputVal = document.getElementById('rf-ac').value;
    if (acInputVal !== '' && Number(acInputVal) !== 0 && typeVal !== 'Armor' && typeVal !== 'Shield') {
      const acTarget = bonusTypeVal === 'Deflection' ? 'ac.deflection' : (bonusTypeVal === 'Natural Armor' ? 'ac.natural' : (bonusTypeVal === 'Dodge' ? 'ac.dodge' : 'ac'));
      addMod(acTarget, acInputVal);
    }

    addMod('hp', document.getElementById('rf-hp').value);
    addMod(typeVal === 'Weapon' ? 'attack.melee' : 'attack.all', document.getElementById('rf-atk').value);
    if (typeVal !== 'Weapon') {
      addMod('damage.all', document.getElementById('rf-dmg').value);
    }
    addMod('save.fort', document.getElementById('rf-fort').value);
    addMod('save.ref', document.getElementById('rf-ref').value);
    addMod('save.will', document.getElementById('rf-will').value);
    addMod('casterLevel', document.getElementById('rf-cl').value);
    addMod('speed.land', document.getElementById('rf-speed').value);

    // Skill modifiers
    const targetSkillVal = document.getElementById('rf-target-skill')?.value.trim();
    const skillInputVal = document.getElementById('rf-skill').value;
    const skillBonusesRaw = document.getElementById('rf-skill-bonuses')?.value.trim();
    if (skillBonusesRaw) {
      try {
        const parsedSkills = JSON.parse(skillBonusesRaw);
        Object.entries(parsedSkills).forEach(([sName, sVal]) => {
          const slug = String(sName).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          addMod(`skill.${slug}`, sVal, bonusTypeVal === 'Untyped' ? 'Competence' : bonusTypeVal);
        });
      } catch (e) {
        console.warn('Could not parse skillBonuses JSON:', e);
      }
    } else if (skillInputVal !== '' && Number(skillInputVal) !== 0) {
      const sTarget = targetSkillVal
        ? `skill.${targetSkillVal.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`
        : 'skill.all';
      addMod(sTarget, skillInputVal, bonusTypeVal === 'Untyped' ? 'Competence' : bonusTypeVal);
    }

    // Build V2 damageParts array
    const diceVal = document.getElementById('rf-dice').value.trim();
    const dmgBonusVal = Number(document.getElementById('rf-dmg').value) || 0;
    const dmgTypeVal = this.capitalizeIdentifier(document.getElementById('rf-dmg-type').value.trim()) || (typeVal === 'Weapon' ? 'Slashing' : 'Untyped');
    const damageParts = [];
    if (diceVal) {
      damageParts.push({
        dice: diceVal,
        bonus: typeVal === 'Weapon' ? dmgBonusVal : 0,
        type: dmgTypeVal,
        multiplyOnCrit: typeVal === 'Weapon',
        onCritOnly: false,
        source: typeVal === 'Weapon' ? 'Base Weapon' : 'Primary'
      });
    }

    const critMinVal = Number(document.getElementById('rf-crit-min').value) || 20;
    const critMultVal = Number(document.getElementById('rf-crit-mult').value) || 2;

    const tagsArr = (() => {
      const rawTags = document.getElementById('rf-tags')?.value || '';
      const arr = rawTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if ((slotVal === 'Two-Handed' || slotVal === 'Two-Hand' || slotVal === 'Both Hands') && !arr.includes('two-handed')) {
        arr.push('two-handed');
      }
      return arr;
    })();

    const v2Entry = Object.assign({}, baseObj, {
      schemaVersion: 2,
      name: this.capitalizeTitle(document.getElementById('rf-name').value.trim()),
      type: typeVal,
      slot: slotVal,
      action: actVal,
      actionType: this.deriveActionType(actVal, typeVal).toLowerCase(),
      tags: tagsArr,
      prereq: document.getElementById('rf-prereq').value.trim() || '-',
      source: document.getElementById('rf-source').value.trim() || 'PHB p.',
      benefit: document.getElementById('rf-benefit').value.trim(),
      description: document.getElementById('rf-benefit').value.trim() || baseObj.description || '',
      scope: scopeVal,
      role: this.capitalizeIdentifier(document.getElementById('rf-role').value),
      duration: document.getElementById('rf-duration').value.trim(),
      weight: Number(document.getElementById('rf-weight').value) || 0,
      cost: Number(document.getElementById('rf-cost').value) || 0,
      school: this.capitalizeIdentifier(document.getElementById('rf-school').value.trim()),
      level: document.getElementById('rf-level').value ? Number(document.getElementById('rf-level').value) : '',
      discipline: this.capitalizeIdentifier(document.getElementById('rf-discipline').value.trim()),
      modifiers,
      damageParts,
      modes: Array.isArray(baseObj.modes) ? baseObj.modes : []
    });

    const parentInputVal = document.getElementById('rf-parent').value.trim();
    if (parentInputVal && parentInputVal !== '-') {
      v2Entry._linkedParentName = parentInputVal;
    }
    const childLabelVal = document.getElementById('rf-child-label')?.value.trim();
    if (childLabelVal) {
      v2Entry._modeButtonLabel = childLabelVal;
    }

    // Daily Charges
    const dailyChargesVal = parseInt(document.getElementById('rf-daily-charges')?.value);
    const chargeUnitVal = document.getElementById('rf-charge-unit')?.value || 'charges';
    if (!isNaN(dailyChargesVal) && dailyChargesVal > 0) {
      v2Entry.dailyCharges = {
        current: (baseObj.dailyCharges?.current !== undefined && baseObj.dailyCharges.current <= dailyChargesVal) ? baseObj.dailyCharges.current : dailyChargesVal,
        max: dailyChargesVal,
        unit: chargeUnitVal,
        recharge: 'long_rest'
      };
    } else if (baseObj.dailyCharges) {
      delete v2Entry.dailyCharges;
    }

    // Armor / Shield Contextual Fields -> armorStats
    if (typeVal === 'Armor' || typeVal === 'Shield') {
      const maxDexRaw = document.getElementById('rf-max-dex')?.value;
      const acpRaw = document.getElementById('rf-check-penalty')?.value;
      const asfRaw = document.getElementById('rf-asf')?.value;
      v2Entry.armorStats = {
        category: typeVal === 'Shield' ? 'Shield' : (baseObj.armorStats?.category || 'Light'),
        baseAc: Number(acInputVal) || baseObj.armorStats?.baseAc || 0,
        maxDex: (maxDexRaw !== '' && !isNaN(Number(maxDexRaw))) ? Number(maxDexRaw) : null,
        acp: (acpRaw !== '' && !isNaN(Number(acpRaw))) ? Number(acpRaw) : 0,
        asf: (asfRaw !== '' && !isNaN(Number(asfRaw))) ? Number(asfRaw) : 0,
        speed30: baseObj.armorStats?.speed30 || 30,
        speed20: baseObj.armorStats?.speed20 || 20
      };
    }

    // Weapon Contextual Fields -> weaponStats
    if (typeVal === 'Weapon') {
      const rangeVal = document.getElementById('rf-range')?.value.trim() || '';
      const profVal = document.getElementById('rf-proficiency')?.value || 'Martial';
      const isLightBool = document.getElementById('rf-is-light')?.value === 'true';
      const isTwoHandBool = slotVal === 'Two-Handed' || tagsArr.includes('two-handed');
      v2Entry.enhancementBonus = Math.max(Number(document.getElementById('rf-atk').value) || 0, dmgBonusVal, 0);
      v2Entry.weaponStats = {
        category: profVal,
        handedness: isTwoHandBool ? 'Two-Handed' : (isLightBool ? 'Light' : 'One-Handed'),
        baseDamage: diceVal || '1d8',
        critMin: critMinVal,
        critMult: critMultVal,
        damageTypes: dmgTypeVal.split('/').map(s => s.trim()).filter(Boolean),
        rangeIncrement: parseInt(rangeVal) || 0,
        finessable: isLightBool,
        isLight: isLightBool
      };
      if (rangeVal) v2Entry.range = rangeVal;
      const sizeStepsVal = Number(document.getElementById('rf-size-steps')?.value) || 0;
      if (sizeStepsVal > 0) {
        v2Entry.sizeModifier = { targetType: 'weapon', scaling: { steps: sizeStepsVal } };
      }
    }

    // Spell / Maneuver Contextual Fields -> spellStats
    if (typeVal === 'Spell' || typeVal === 'Maneuver' || typeVal === 'Stance') {
      const saveTypeVal = document.getElementById('rf-save-type')?.value.trim() || 'None';
      const srVal = document.getElementById('rf-sr')?.value || 'No';
      const spellRangeVal = document.getElementById('rf-spell-range')?.value.trim() || '';
      const targetAreaVal = document.getElementById('rf-target-area')?.value.trim() || '';
      const compVal = document.getElementById('rf-components')?.value.trim() || '';
      if (spellRangeVal) v2Entry.range = spellRangeVal;
      v2Entry.spellStats = {
        school: v2Entry.school || '',
        discipline: v2Entry.discipline || '',
        level: v2Entry.level,
        components: compVal,
        castingTime: actVal,
        range: spellRangeVal,
        targetOrArea: targetAreaVal,
        duration: v2Entry.duration,
        savingThrow: saveTypeVal,
        spellResistance: srVal
      };
    }

    // Race Contextual Fields
    if (typeVal === 'Race') {
      v2Entry.size = document.getElementById('rf-race-size')?.value || 'Medium';
      const baseSpeedVal = Number(document.getElementById('rf-base-speed')?.value);
      if (!isNaN(baseSpeedVal)) v2Entry.baseSpeed = baseSpeedVal;
      v2Entry.favoredClass = document.getElementById('rf-favored-class')?.value.trim() || 'Any';
      const langVal = document.getElementById('rf-languages')?.value.trim();
      if (langVal) v2Entry.languages = langVal.split(',').map(l => l.trim()).filter(Boolean);
    }

    const effectTypeVal = document.getElementById('rf-effect-type')?.value;
    if (effectTypeVal) v2Entry.effectType = effectTypeVal;
    const selfHpCostVal = Number(document.getElementById('rf-self-hp-cost')?.value);
    if (!isNaN(selfHpCostVal) && selfHpCostVal > 0) v2Entry.selfHpCost = selfHpCostVal;

    // Rule Flags
    const ruleFlags = Object.assign({}, baseObj.ruleFlags || {});
    const getFlag = id => document.getElementById(id)?.checked;
    if (getFlag('rf-flag-touch')) ruleFlags.touchAttack = true; else delete ruleFlags.touchAttack;
    if (getFlag('rf-flag-ignore-armor')) ruleFlags.ignoreArmor = true; else delete ruleFlags.ignoreArmor;
    if (getFlag('rf-flag-keen')) ruleFlags.critThreatDoubled = true; else delete ruleFlags.critThreatDoubled;
    if (getFlag('rf-flag-reach')) ruleFlags.reach = true; else delete ruleFlags.reach;
    if (getFlag('rf-flag-silver')) ruleFlags.silver = true; else delete ruleFlags.silver;
    if (getFlag('rf-flag-cold-iron')) ruleFlags.coldIron = true; else delete ruleFlags.coldIron;
    if (getFlag('rf-flag-adamantine')) ruleFlags.adamantine = true; else delete ruleFlags.adamantine;
    if (getFlag('rf-flag-two-hand-str')) ruleFlags.twoHandedStrengthMultiplier = true; else delete ruleFlags.twoHandedStrengthMultiplier;
    v2Entry.ruleFlags = ruleFlags;

    if (this.saveEntry(v2Entry, this.selectedEntryIndex)) {
      this.closeModal();
    }
  },
  closeModal() {
    const modal = document.getElementById('rule-crud-modal');
    if (modal) modal.classList.add('hidden');
    this.selectedEntryIndex = -1;
  },

  onTypeChange() {
    const typeVal = document.getElementById('rf-type')?.value || 'Weapon';
    const isArmorShield = typeVal === 'Armor' || typeVal === 'Shield';
    const isWeapon = typeVal === 'Weapon';
    const isSpellManeuver = typeVal === 'Spell' || typeVal === 'Maneuver' || typeVal === 'Stance';
    const isRace = typeVal === 'Race';

    const pArmor = document.getElementById('rf-panel-armor');
    const pWeapon = document.getElementById('rf-panel-weapon');
    const pSpell = document.getElementById('rf-panel-spell');
    const pRace = document.getElementById('rf-panel-race');

    if (pArmor) pArmor.classList.toggle('hidden', !isArmorShield);
    if (pWeapon) pWeapon.classList.toggle('hidden', !isWeapon);
    if (pSpell) pSpell.classList.toggle('hidden', !isSpellManeuver);
    if (pRace) pRace.classList.toggle('hidden', !isRace);
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
        empty.textContent = 'Eşleşen sonuç bulunamadı (serbest metin yazabilirsiniz)';
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
  renderTable() {
    const tbody = document.getElementById('master-db-tbody');
    if (!tbody || !masterDb) return;

    const query = (document.getElementById('mdb-search-input')?.value || '').toLowerCase();
    const cat = document.getElementById('mdb-category-filter')?.value || 'ALL';
    const bonusFilter = document.getElementById('mdb-bonus-filter')?.value || 'ALL';
    const scopeFilter = document.getElementById('mdb-scope-filter')?.value || 'ALL';

    let filtered = masterDb.filter((rawItem, idx) => {
      const item = this.ensureV2(rawItem);
      rawItem._originalIndex = idx;
      const matchQ = !query ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.benefit && item.benefit.toLowerCase().includes(query)) ||
        (item.source && item.source.toLowerCase().includes(query)) ||
        (item.discipline && item.discipline.toLowerCase().includes(query));

      const matchCat = cat === 'ALL' || item.type === cat;
      const itemBonusType = item.modifiers?.[0]?.type || (item.type === 'Weapon' && item.enhancementBonus ? 'Enhancement' : 'Untyped');
      const matchBonus = bonusFilter === 'ALL' || itemBonusType === bonusFilter;
      const matchScope = scopeFilter === 'ALL' || (item.scope || 'None / General') === scopeFilter;

      return matchQ && matchCat && matchBonus && matchScope;
    });

    const countBadge = document.getElementById('mdb-total-count-badge');
    if (countBadge) countBadge.textContent = `${filtered.length} / ${masterDb.length} Kayıt`;

    tbody.innerHTML = '';

    filtered.forEach(rawItem => {
      const idx = rawItem._originalIndex;
      const item = this.ensureV2(rawItem);
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/50 transition border-b border-slate-800/80';

      const typeBadgeClass = this.getTypeBadgeClass(item.type);
      const statPills = this.getEntrySummaryPills(item);
      const statsSummary = statPills.length > 0 ? statPills.join(' • ') : '-';
      const modesCount = Array.isArray(item.modes) ? item.modes.length : 0;
      const primaryBonusType = item.modifiers?.[0]?.type || (item.type === 'Weapon' && item.enhancementBonus ? 'Enhancement' : (item.type === 'Armor' ? 'Armor' : (item.type === 'Shield' ? 'Shield' : 'Untyped')));

      tr.innerHTML = `
        <td class="py-2.5 px-3">
          <div class="font-bold text-white flex items-center gap-1.5 flex-wrap">
            <span>${item.name}</span>
            ${modesCount > 0 ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800">⚡ ${modesCount} Mod</span>` : ''}
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">${item.source || 'PHB'}</div>
        </td>
        <td class="py-2.5 px-3">
          <span class="badge ${typeBadgeClass}">${item.type ? this.capitalizeIdentifier(item.type) : 'Other'}</span>
          ${item.discipline && item.discipline !== '-' ? `<span class="badge bg-rose-950 text-rose-300 border border-rose-800 block mt-1 w-max">${this.capitalizeIdentifier(item.discipline)}</span>` : ''}
        </td>
        <td class="py-2.5 px-3 text-slate-300 text-xs">
          <div>${item.slot ? this.capitalizeIdentifier(item.slot) : 'None'}</div>
          ${item.level !== undefined && item.level !== '' ? `<div class="text-[10px] text-amber-400 font-bold">${item.level}. Seviye</div>` : ''}
        </td>
        <td class="py-2.5 px-3">
          <div class="text-xs font-semibold text-amber-300">${this.capitalizeIdentifier(primaryBonusType)}</div>
          <div class="text-[10px] text-slate-400">${item.scope ? this.capitalizeIdentifier(item.scope) : 'General'}</div>
        </td>
        <td class="py-2.5 px-3 font-mono text-xs font-bold text-emerald-400">
          ${statsSummary}
        </td>
        <td class="py-2.5 px-3 text-slate-300 text-[11px] max-w-xs">
          <div class="line-clamp-2" title="${item.benefit || ''}">${item.benefit || '-'}</div>
        </td>
        <td class="py-2.5 px-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">
              ✏️
            </button>
            <button onclick="RuleMaster.addChildPower(${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs transition" title="Gömülü Alt Mod Ekle (Mode)">
              🔗
            </button>
            <button onclick="RuleMaster.duplicateEntry(${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs transition" title="Kopyala">
              📑
            </button>
            <button onclick="RuleMaster.deleteEntry(${idx})" class="p-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs transition" title="Sil">
              🗑️
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
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
      btn.classList.remove('bg-purple-700', 'text-white', 'shadow');
      btn.classList.add('text-slate-400');
    });
    const activeBtn = document.getElementById(subTabId.replace('subtab-', 'btn-subtab-'));
    if (activeBtn) {
      activeBtn.classList.add('bg-purple-700', 'text-white', 'shadow');
      activeBtn.classList.remove('text-slate-400');
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

  DND35_RAW_GUARDRAIL: `STRICT D&D 3.5E RAW ONLY (ZERO TOLERANCE FOR FORUMS / HOMEBREW / 5E / PATHFINDER):
1. CANONICAL D&D 3.5E SOURCES ONLY:
   - You MUST consult and verify strictly against:
     a) Official System Reference Document (SRD v3.5 as archived on d20srd.org)
     b) Official D&D 3.5e Rulebooks and Splatbooks (as indexed on dndtools.net / danddtools)
     c) Official Wizards of the Coast 3.5e Publications (Player's Handbook, Dungeon Master's Guide, Monster Manual, Complete Series, Spell Compendium, Magic Item Compendium, Tome of Battle, Frostburn, Sandstorm, Libris Mortis, Book of Exalted Deeds, Expanded Psionics Handbook, Races of Stone/Destiny/Wild/Dragon, Dungeonscape, Fiend Folio, etc.)
2. ABSOLUTE FORUM & HOMEBREW BLACKLIST:
   - NEVER use, cite, or draw information from DandWiki (dandwiki.com), Giant in the Playground forums (GitP), ENWorld, Reddit, or homebrew blogs/wikis.
   - If an element only exists as homebrew, third-party content, or a forum discussion, IT DOES NOT EXIST.
3. ZERO 5E / 4E / PATHFINDER MECHANICS:
   - Absolutely NO 5e mechanics (No Advantage/Disadvantage, No Bonus Action, No Finesse adding Dex to damage, No -5/+10 GWM, No Short Rest, No Concentration slots).
   - Absolutely NO Pathfinder / PF1e / Starfinder rules.
4. STRICT NON-EXISTENCE / NO-HALLUCINATION POLICY:
   - If the queried element is NOT an official D&D 3.5e RAW entity, DO NOT adapt, balance, or fabricate it. Return an empty array: {"entries": []}.`,

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

  // 3 Temel AI Kullanım Alanı İçin Dinamik Model Çözümleyicisi (3 Kademeli / 9 Yuvalı Dayanıklılık Matrisi)
  AI_TASK_ROUTING: {
    // 1. Hızlı Arama & Seviye Atlama (1. Asıl: Lite 2.0, 2. Yedek: Flash 2.0, 3. Kalkan: Flash 1.5)
    QUICK_SEARCH: {
      primary: 'gemini-2.0-flash-lite',
      fallback: 'gemini-2.0-flash',
      tertiary: 'gemini-1.5-flash'
    },
    // 2. Kütüphane & Kural Denetimi (En Yüksek Kararlı Pro Muhakeme Motoru)
    RULE_AUDIT: {
      primary: 'gemini-1.5-pro',
      fallback: 'gemini-2.0-flash',
      tertiary: 'gemini-1.5-flash'
    },
    // 3. Toplu İçe Aktarım & Serbest Metin Ayrıştırma (Yapısal JSON)
    IMPORT_BATCH: {
      primary: 'gemini-2.0-flash-lite',
      fallback: 'gemini-2.0-flash',
      tertiary: 'gemini-1.5-pro'
    }
  },

  // Dinamik olarak kaydedilmiş AI model yönlendirme matrisini döndürür; yoksa varsayılanı kullanır
  getActiveTaskRouting() {
    try {
      const saved = localStorage.getItem('dnd35_gemini_routing_matrix');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.QUICK_SEARCH && parsed.RULE_AUDIT && parsed.IMPORT_BATCH) {
          return parsed;
        }
      }
    } catch (e) {}
    return this.AI_TASK_ROUTING;
  },

  getModelsForTask(taskType = 'DEFAULT') {
    const routing = this.getActiveTaskRouting();
    const userPref = this.getAiModelMode();
    if (userPref === 'pro') {
      const cfg = routing.RULE_AUDIT;
      return [cfg.primary, cfg.fallback, cfg.tertiary];
    }
    if (userPref === 'flash') {
      const cfg = routing.QUICK_SEARCH;
      return [cfg.primary, cfg.fallback, cfg.tertiary];
    }
    // 'auto' (Smart Task Router):
    if (taskType === 'RULE_AUDIT' || taskType === 'COMPLEX_TACTICAL') {
      const cfg = routing.RULE_AUDIT;
      return [cfg.primary, cfg.fallback, cfg.tertiary];
    }
    if (taskType === 'IMPORT_BATCH') {
      const cfg = routing.IMPORT_BATCH;
      return [cfg.primary, cfg.fallback, cfg.tertiary];
    }
    // Default fast retrieval (QUICK_SEARCH, LEVEL_UP, etc.)
    const cfg = routing.QUICK_SEARCH;
    return [cfg.primary, cfg.fallback, cfg.tertiary];
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
    return 'gemini-2.0-flash';
  },

  // Canlı modelleri Gemini Flash ile analiz edip D&D 3.5e görevlerine en uygun 3 kademeli matrisi üreten AI Optimizatörü
  async optimizeModelsWithAi(apiKey, apiModels = []) {
    if (!apiKey || !Array.isArray(apiModels) || apiModels.length === 0) {
      return { success: false, reason: 'Eksik API anahtarı veya model listesi' };
    }

    const evaluatorModel = this.findDynamicDiagnosticModel(apiModels);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${evaluatorModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const promptText = `Sen Google Gemini API optimizasyon ve yapay zeka model mimarisi uzmanısın.
Kullanıcının API anahtarında şu anda aktif, erişilebilir ve generateContent destekleyen resmi modeller şunlardır:
${JSON.stringify(apiModels)}

Bu modelleri D&D 3.5e web uygulamamız için 3 temel görev alanına göre sınıflandır ve her görev için en uygun 3 kademeli (primary, fallback, tertiary) seçimleri belirle:
1. QUICK_SEARCH: Hızlı yanıt, yüksek RPM, arama, D&D SRD büyü/eşya/feat listeleme ve seviye atlama (Flash-Lite veya Flash modelleri öncelikli).
2. RULE_AUDIT: Derin RAW kural muhakemesi, karmaşık denetimler ve mekanik kural çözümleri (Pro modelleri öncelikli, yoksa en yüksek akıl yürütmeli Flash).
3. IMPORT_BATCH: Yapısal JSON çıktısı, canavar stat blokları, tablo ve serbest metin ayrıştırma (Dengeli Flash/Pro hibriti).

ZORUNLU KURALLAR:
1. SADECE yukarıda verilen aktif modeller listesinden isimler seç. Listede olmayan veya hayali model adı yazma!
2. SADECE geçerli bir JSON nesnesi döndür. Markdown formatı, backtick (\`\`\`json) veya fazladan açıklama ekleme.
Şema:
{
  "QUICK_SEARCH": {"primary": "model_adi", "fallback": "model_adi", "tertiary": "model_adi"},
  "RULE_AUDIT": {"primary": "model_adi", "fallback": "model_adi", "tertiary": "model_adi"},
  "IMPORT_BATCH": {"primary": "model_adi", "fallback": "model_adi", "tertiary": "model_adi"}
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
      if (!rawAiText) throw new Error('Boş AI yanıtı');

      let parsed = null;
      try {
        parsed = JSON.parse(this.cleanJsonText(rawAiText));
      } catch (pe) {
        const match = rawAiText.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error('Geçersiz JSON');
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
        throw new Error('AI model seçimleri whitelist doğrulamadan geçemedi');
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

    // Eğer önceden kaydedilmiş bir dinamik AI yönlendirme matrisi varsa doğrudan kullan (0ms gecikme)
    const hasCustomMatrix = Boolean(localStorage.getItem('dnd35_gemini_routing_matrix'));
    if (hasCustomMatrix && !forceRefresh) {
      const activeRouting = this.getActiveTaskRouting();
      let taskCfg = activeRouting.QUICK_SEARCH;
      if (taskType === 'RULE_AUDIT' || taskType === 'COMPLEX_TACTICAL' || this.getAiModelMode() === 'pro') {
        taskCfg = activeRouting.RULE_AUDIT;
      } else if (taskType === 'IMPORT_BATCH' && this.getAiModelMode() === 'auto') {
        taskCfg = activeRouting.IMPORT_BATCH;
      }
      const customList = [taskCfg.primary, taskCfg.fallback, taskCfg.tertiary].filter(Boolean);
      if (customList.length > 0) {
        if (!this._cachedTaskModels) this._cachedTaskModels = {};
        this._cachedTaskModels[cacheKey] = customList;
        return customList;
      }
    }

    try {
      let apiModels = (!forceRefresh && this._discoveredApiModels) ? this._discoveredApiModels : null;
      if (!apiModels && !forceRefresh) {
        try {
          const cachedJson = localStorage.getItem('dnd35_gemini_discovered_models');
          if (cachedJson) {
            const parsed = JSON.parse(cachedJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              apiModels = parsed;
              this._discoveredApiModels = parsed;
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
              return !lower.includes('tts') &&
                     !lower.includes('image') &&
                     !lower.includes('audio') &&
                     !lower.includes('embedding') &&
                     !lower.includes('realtime') &&
                     !lower.includes('bison') &&
                     !lower.includes('preview') &&
                     !lower.includes('omni') &&
                     !lower.includes('gemma');
            });
          this._discoveredApiModels = apiModels;
          try {
            localStorage.setItem('dnd35_gemini_discovered_models', JSON.stringify(apiModels));
          } catch (e) {}
        }
      }

      if (apiModels && apiModels.length > 0) {
        function parseVersion(name) {
          const match = (name || '').match(/gemini-(\d+(?:\.\d+)?)-/i);
          return match ? parseFloat(match[1]) : 0.0;
        }

        const isPro = (this.getAiModelMode() === 'pro') || 
          (this.getAiModelMode() === 'auto' && (taskType === 'RULE_AUDIT' || taskType === 'COMPLEX_TACTICAL'));

        // 1. Hızlı Arama & Seviye Atlama: 3 Kademeli Havuz
        if (taskType === 'QUICK_SEARCH' || taskType === 'DEFAULT') {
          const liteModels = apiModels
            .filter(m => m.toLowerCase().includes('flash') && m.toLowerCase().includes('lite'))
            .sort((a, b) => parseVersion(b) - parseVersion(a));
          const standardFlashModels = apiModels
            .filter(m => m.toLowerCase().includes('flash') && !m.toLowerCase().includes('lite'))
            .sort((a, b) => parseVersion(b) - parseVersion(a));

          const primary = liteModels[0] || standardFlashModels[0] || defaultList[0];
          const fallback = standardFlashModels[1] || liteModels[1] || standardFlashModels[0] || defaultList[1];
          const tertiary = standardFlashModels[0] || liteModels[2] || defaultList[2];

          const resultList = [];
          [primary, fallback, tertiary].forEach(m => {
            if (m && !resultList.includes(m)) resultList.push(m);
          });
          while (resultList.length < 3 && defaultList[resultList.length]) {
            const defM = defaultList[resultList.length];
            if (!resultList.includes(defM)) resultList.push(defM);
            else break;
          }

          if (!this._cachedTaskModels) this._cachedTaskModels = {};
          this._cachedTaskModels[cacheKey] = resultList;
          return resultList;
        }

        // 3. Toplu İçe Aktarım: Lite Asıl, Standart Flash Yedek, Pro Kalkan
        if (taskType === 'IMPORT_BATCH' && this.getAiModelMode() === 'auto') {
          const liteModels = apiModels
            .filter(m => m.toLowerCase().includes('flash') && m.toLowerCase().includes('lite'))
            .sort((a, b) => parseVersion(b) - parseVersion(a));
          const standardFlashModels = apiModels
            .filter(m => m.toLowerCase().includes('flash') && !m.toLowerCase().includes('lite'))
            .sort((a, b) => parseVersion(b) - parseVersion(a));
          const proModels = apiModels
            .filter(m => m.toLowerCase().includes('pro'))
            .sort((a, b) => parseVersion(b) - parseVersion(a));

          const primary = liteModels[0] || standardFlashModels[0] || defaultList[0];
          const fallback = standardFlashModels[0] || proModels[0] || defaultList[1];
          const tertiary = proModels[0] || defaultList[2];

          const resultList = [];
          [primary, fallback, tertiary].forEach(m => {
            if (m && !resultList.includes(m)) resultList.push(m);
          });
          while (resultList.length < 3 && defaultList[resultList.length]) {
            const defM = defaultList[resultList.length];
            if (!resultList.includes(defM)) resultList.push(defM);
            else break;
          }

          if (!this._cachedTaskModels) this._cachedTaskModels = {};
          this._cachedTaskModels[cacheKey] = resultList;
          return resultList;
        }

        // 2. Kütüphane & RAW Kural Denetimi: Pro Modelleri + Hızlı Kalkan
        const relevant = isPro
          ? apiModels.filter(m => m.toLowerCase().includes('pro'))
          : apiModels.filter(m => m.toLowerCase().includes('flash'));

        relevant.sort((a, b) => parseVersion(b) - parseVersion(a));

        const primary = relevant[0] || defaultList[0];
        const fallback = relevant[1] || defaultList[1];
        const tertiary = relevant[2] || defaultList[2];

        const resultList = [];
        [primary, fallback, tertiary].forEach(m => {
          if (m && !resultList.includes(m)) resultList.push(m);
        });
        while (resultList.length < 3 && defaultList[resultList.length]) {
          const defM = defaultList[resultList.length];
          if (!resultList.includes(defM)) resultList.push(defM);
          else break;
        }

        if (!this._cachedTaskModels) this._cachedTaskModels = {};
        this._cachedTaskModels[cacheKey] = resultList;
        return resultList;
      }
    } catch (e) {
      console.warn('API model list discovery skipped:', e.message);
    }

    return defaultList;
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
          title: 'Hızlı Arama & Seviye Atlama (Flash-Lite / Yüksek Kota)',
          primary: quickModels[0] || this.AI_TASK_ROUTING.QUICK_SEARCH.primary,
          fallback: quickModels[1] || this.AI_TASK_ROUTING.QUICK_SEARCH.fallback,
          tertiary: quickModels[2] || this.AI_TASK_ROUTING.QUICK_SEARCH.tertiary
        },
        ruleAudit: {
          title: 'Kütüphane & RAW Kural Denetimi (Pro Derin Muhakeme)',
          primary: auditModels[0] || this.AI_TASK_ROUTING.RULE_AUDIT.primary,
          fallback: auditModels[1] || this.AI_TASK_ROUTING.RULE_AUDIT.fallback,
          tertiary: auditModels[2] || this.AI_TASK_ROUTING.RULE_AUDIT.tertiary
        },
        importBatch: {
          title: 'Toplu İçe Aktarım & Tablo Ayrıştırma (Lite/Pro Hibrit)',
          primary: batchModels[0] || this.AI_TASK_ROUTING.IMPORT_BATCH.primary,
          fallback: batchModels[1] || this.AI_TASK_ROUTING.IMPORT_BATCH.fallback,
          tertiary: batchModels[2] || this.AI_TASK_ROUTING.IMPORT_BATCH.tertiary
        }
      }
    };
  },

  async showDiagnosticsModal(apiKey) {
    const key = (apiKey || this.getApiKey() || '').trim();
    if (!key) {
      alert('⚠️ Lütfen önce bir Gemini API Anahtarı girin ve kaydedin.');
      return;
    }

    try {
      if (typeof verifySettingsGeminiApiKey === 'function') {
        const ok = await verifySettingsGeminiApiKey(true);
        if (!ok) {
          alert('❌ Gemini API bağlantısı kurulamadı. Lütfen API anahtarınızın doğruluğunu kontrol edin.');
          return;
        }
      }

      const diag = await this.getAiArchitectureDiagnostics(key);
      const modeName = diag.mode === 'auto' 
        ? 'Otomatik (Akıllı Görev Yönlendirici)' 
        : (diag.mode === 'pro' ? 'Manuel Gemini Pro (Derin RAW Muhakeme)' : 'Manuel Gemini Flash (Ultra Hızlı Gecikme)');

      const optStatus = diag.isAiOptimized
        ? `🤖 Yapay Zeka Canlı Analiziyle Optimize Edildi (Sanal Çözümleyici: ${diag.dynamicEvaluator})`
        : `🛡️ Deterministik Heuristic Kalkanı Devrede (Sanal Çözümleyici: ${diag.dynamicEvaluator})`;

      const report = `🩺 GEMINI API TANI & AKILLI MODEL MATRİSİ (9 YUVA)\n\n` +
        `🟢 Bağlantı Başarılı ve Aktif! (${diag.totalDiscovered} Canlı Model Keşfedildi)\n` +
        `Optimizasyon Durumu: ${optStatus}\n` +
        `Çalışma Modu: ${modeName}\n\n` +
        `⚡ ${diag.tasks.quickSearch.title}:\n` +
        `   ⭐ 1. Asıl: ${diag.tasks.quickSearch.primary}\n` +
        `   🔄 2. Yedek: ${diag.tasks.quickSearch.fallback}\n` +
        `   🛡️ 3. Kalkan: ${diag.tasks.quickSearch.tertiary}\n\n` +
        `🔮 ${diag.tasks.ruleAudit.title}:\n` +
        `   ⭐ 1. Asıl: ${diag.tasks.ruleAudit.primary}\n` +
        `   🔄 2. Yedek: ${diag.tasks.ruleAudit.fallback}\n` +
        `   🛡️ 3. Kalkan: ${diag.tasks.ruleAudit.tertiary}\n\n` +
        `📋 ${diag.tasks.importBatch.title}:\n` +
        `   ⭐ 1. Asıl: ${diag.tasks.importBatch.primary}\n` +
        `   🔄 2. Yedek: ${diag.tasks.importBatch.fallback}\n` +
        `   🛡️ 3. Kalkan: ${diag.tasks.importBatch.tertiary}\n\n` +
        `Sistem her görevde önce 1. Asıl modeli kullanır; sunucu yoğunluğu (503) veya kota durumunda (429) otomatik olarak sırasıyla 2. ve 3. modellere geçer. Gelecekte yeni modeller çıktığında tanı çalıştırılarak matris otomatik olarak güncellenebilir.`;

      alert(report);
    } catch (err) {
      alert(`❌ Tanı Hatası: ${err.message}`);
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
      alert('⚠️ Lütfen geçerli bir Gemini API anahtarı girin.');
      return;
    }
    this.setApiKey(val);
    alert('✅ Gemini API anahtarı başarıyla kaydedildi!');
  },

  clearApiKey() {
    if (confirm('Gemini API anahtarını yerel hafızadan silmek istediğinize emin misiniz?')) {
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

  setQueryAndSearch(term, categoryHint = 'ALL') {
    const queryInput = document.getElementById('ai-rule-query');
    const catSelect = document.getElementById('ai-rule-category');
    if (queryInput) queryInput.value = term;
    if (catSelect) catSelect.value = categoryHint;
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
        if (cloned.name) cloned.name = this.capitalizeTitle(this.cleanArrow(cloned.name));
        return window.SchemaMigrator.upgradeEntryToV2(cloned);
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
    return this.ensureV2(cloned);
  },

  // Dinamik Hedefli AI Prompt Üreticisi (Kanonik V2 JSON Şeması)
  buildTargetedAiPrompt(cleanQuery, effectiveCategory) {
    return `You are a master D&D 3.5e Rule Arbiter.
Target query: "${cleanQuery}" (Category: "${effectiveCategory}").

${this.DND35_RAW_GUARDRAIL}

CRITICAL CANONICAL V2 SCHEMA RULES:
1. STRICT REAL RAW 3.5E ONLY: Consult d20srd.org, dndtools.net, or official WotC 3.5e publications. If entity does not exist in official 3.5e, return {"entries": []}.
2. MANDATORY TYPO / FUZZY CORRECTION: Correct misspellings to the official D&D 3.5e name.
3. ZERO LEGACY COLUMNS & ZERO SEPARATE CHILD ROWS:
   - NEVER use legacy flat bonus columns (strBonus, acBonus, attBonus, extraDmg, isChild, parent).
   - Put all stat/roll bonuses inside "modifiers": [{"target": "ac.deflection"|"ability.str"|"attack.melee"|"save.all"|"skill.move_silently" etc., "value": 2, "type": "Deflection"|"Enhancement"|"Competence"|"Resistance"|"Dodge"|"Untyped", "condition": null}].
   - Put all weapon/spell/maneuver dice inside "damageParts": [{"dice": "1d8", "bonus": 0, "type": "Slashing"|"Fire"|"Untyped", "multiplyOnCrit": true|false, "onCritOnly": false, "source": "Base"}].
   - If the spell, weapon, or item has conditional sub-modes or secondary powers (e.g. Searing Light vs Undead, Blade of Blood sacrifice, Two-Handed grip, Flametongue 1/day ray), embed them inside "modes": [{"id": "vs_undead", "name": "Undead (1d6/CL)", "actionType": "standard", "benefit": "...", "damageParts": [...], "modifiers": [...]}].

OUTPUT JSON SCHEMA:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "unique_slug_id",
      "name": "Official 3.5e Name",
      "type": "${effectiveCategory === 'ALL' ? 'Feat|Spell|Weapon|Armor|Shield|Wondrous Item|Ring|Maneuver|Stance|Race|Deity' : (effectiveCategory === 'Item' || effectiveCategory === 'Magic Item' ? 'Wondrous Item' : effectiveCategory)}",
      "slot": "None|Main Hand|Two-Handed|Off-Hand/Shield|Armor|Head|Neck|Shoulders|Belt|Ring|Feet|Hands|Arms|Torso",
      "source": "Official 3.5e book and page",
      "prereq": "Prerequisites or '-'",
      "benefit": "Concise mechanical summary",
      "description": "Full official RAW description",
      "action": "Passive|Standard Action|Swift Action|Immediate Action|Full-Round Action|Free Action",
      "actionType": "passive|standard|swift|immediate|full_round|free",
      "duration": "Continuous|Instantaneous|1 round/level",
      "range": "Personal|Touch|Close|Medium|Long",
      "school": "Spell school if Spell",
      "discipline": "ToB discipline if Maneuver/Stance",
      "level": 1,
      "cost": 0,
      "weight": 0,
      "isFighterBonusFeat": false,
      "modifiers": [],
      "damageParts": [],
      "modes": [],
      "weaponStats": null,
      "armorStats": null,
      "spellStats": null,
      "ruleFlags": {},
      "tacticalBadges": [],
      "tags": []
    }
  ]
}`;
  },

  // 0ms Local Resolution Helper: Master DB -> SrdCompendium -> ItemAssembler -> Canonical Dictionary
  resolveLocalZeroTokenQuery(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') return [];
    let cleanKey = rawQuery.toLowerCase().trim();
    const prefixMatch = cleanKey.match(/^(spell|feat|race|deity|god|weapon|armor|shield|item|magic item|maneuver|stance|class):\s*/i);
    if (prefixMatch) {
      cleanKey = cleanKey.slice(prefixMatch[0].length).trim();
    }

    // Typo alias resolution
    if (typeof this.canonicalDictionary[cleanKey] === 'string') {
      cleanKey = this.canonicalDictionary[cleanKey];
    }

    // 1. Check user's Master DB first
    if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
      const dbMatch = masterDb.filter(m => m && (m.name || '').toLowerCase().trim() === cleanKey);
      if (dbMatch.length > 0) {
        return dbMatch.map(m => this.ensureV2(m));
      }
    }

    // 2. Check SrdCompendium (3,522+ modular V2 entries, O(1) lookup)
    if (typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) {
      const exactComp = window.SrdCompendium.getById(cleanKey) || window.SrdCompendium.getByName(cleanKey);
      if (exactComp) {
        return [this.ensureV2(exactComp)];
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
      return [this.ensureV2(this.canonicalDictionary[cleanKey])];
    }

    // 5. Fallback to BUNDLED_SRD_CORE_CATALOG if SrdCompendium isn't loaded yet
    if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
      const baseMatch = this.findBaseItemInSrdCore(cleanKey);
      if (baseMatch && (baseMatch.name || '').toLowerCase().trim() === cleanKey) {
        return [this.normalizeEntry(baseMatch)];
      }
    }

    return [];
  },

  async fetchSingleAiRuleObjects(query, categoryHint, apiKey, statusTextEl = null) {
    let effectiveCategory = (categoryHint && categoryHint !== 'ALL') ? categoryHint : 'ALL';
    let cleanQuery = (query || '').trim();

    const prefixMatch = cleanQuery.match(/^(spell|feat|race|deity|god|weapon|armor|shield|item|magic item|maneuver|stance|class):\s*/i);
    if (prefixMatch) {
      const p = prefixMatch[1].toLowerCase();
      cleanQuery = cleanQuery.slice(prefixMatch[0].length).trim();
      if (p === 'spell') effectiveCategory = 'Spell';
      else if (p === 'feat') effectiveCategory = 'Feat';
      else if (p === 'race') effectiveCategory = 'Race';
      else if (p === 'deity' || p === 'god') effectiveCategory = 'Deity';
      else if (p === 'weapon') effectiveCategory = 'Weapon';
      else if (p === 'armor') effectiveCategory = 'Armor';
      else if (p === 'shield') effectiveCategory = 'Shield';
      else if (p === 'item' || p === 'magic item') effectiveCategory = 'Magic Item';
      else if (p === 'maneuver' || p === 'stance') effectiveCategory = 'Maneuver';
    }

    // 0ms Local Resolution before calling Gemini
    const localHits = this.resolveLocalZeroTokenQuery(cleanQuery);
    if (localHits.length > 0) {
      return localHits;
    }

    const promptText = this.buildTargetedAiPrompt(cleanQuery, effectiveCategory);
    const availableModels = await this.getAvailableGeminiModels(apiKey, false, 'QUICK_SEARCH');
    let lastError = null;

    for (const model of availableModels) {
      if (statusTextEl) {
        statusTextEl.textContent = `"${cleanQuery}" ➔ ${model} sorgulanıyor...`;
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const genConfig = {
        temperature: 0.1,
        responseMimeType: "application/json"
      };
      if (model.includes('2.0') || model.includes('2.5') || model.includes('thinking')) {
        genConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: genConfig
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

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
                  throw new Error('Yapay zeka yanıtı geçerli JSON formatında değil.');
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
                if (v2List.length > 0) return v2List;
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
              lastError = `JSON Çözümleme hatası (${model}): ${pErr.message}`;
            }
          }
        } else {
          const errJson = await response.json().catch(() => ({}));
          lastError = errJson.error?.message || `HTTP ${response.status} (${model})`;
          if (response.status === 404 || (lastError && lastError.toLowerCase().includes('not found'))) {
            this._discoveredApiModels = null;
            this._cachedTaskModels = {};
            try { localStorage.removeItem('dnd35_gemini_discovered_models'); } catch (e) {}
          }
        }
      } catch (netErr) {
        clearTimeout(timeoutId);
        if (netErr && netErr.name === 'AbortError') {
          lastError = `Zaman aşımı (4.5s) - ${model} yanıt vermedi.`;
        } else {
          lastError = `${netErr.message} (${model})`;
        }
      }
    }

    throw new Error(lastError || `"${query}" ile ilgili resmi bir D&D 3.5e kuralı veya eşyası bulunamadı.`);
  },

  async queryAiRule() {
    const queryInput = document.getElementById('ai-rule-query');
    const catSelect = document.getElementById('ai-rule-category');
    const statusBox = document.getElementById('ai-rule-status');
    const statusText = document.getElementById('ai-rule-status-text');
    const resultsContainer = document.getElementById('ai-results-container');
    const resultsWrapper = document.getElementById('ai-results-wrapper');
    const btn = document.getElementById('ai-rule-btn');

    const query = queryInput ? queryInput.value.trim() : '';
    const categoryHint = catSelect ? catSelect.value : 'ALL';

    if (!query) {
      alert('Lütfen aramak istediğiniz kural, eşya, büyü, hüner veya yeteneğin adını yazın.');
      if (queryInput) queryInput.focus();
      return;
    }

    // 0ms Local Resolution (Master DB -> SrdCompendium -> ItemAssembler -> Canonical Dictionary)
    const localFound = this.resolveLocalZeroTokenQuery(query);
    if (localFound.length > 0) {
      this.lastAiResults = localFound;
      this.renderAiResults();
      if (resultsWrapper) resultsWrapper.classList.remove('hidden');
      if (statusBox) statusBox.classList.remove('hidden');
      if (statusText) statusText.innerHTML = `⚡ <b>"${localFound[0].name}"</b> yerel V2 kütüphanesinden / montaj motorundan anında yüklendi (0 ms, Sıfır Token).`;
      if (btn) btn.disabled = false;
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('Rule Master AI özelliğini kullanmak için geçerli bir Gemini API Anahtarı girmeniz gerekmektedir.');
      this.promptApiKey();
      return;
    }

    if (btn) btn.disabled = true;
    if (statusBox) statusBox.classList.remove('hidden');
    if (statusText) statusText.textContent = `"${query}" aranıyor ve D&D 3.5e RAW kütüphanesinden doğrulanıyor...`;
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (resultsWrapper) resultsWrapper.classList.add('hidden');

    try {
      const entries = await this.fetchSingleAiRuleObjects(query, categoryHint, apiKey, statusText);

      if (!entries || !entries.length) {
        throw new Error(`"${query}" ile ilgili resmi bir D&D 3.5e kuralı veya eşyası bulunamadı.`);
      }

      this.lastAiResults = entries;
      this.renderAiResults();
      if (resultsWrapper) resultsWrapper.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      alert(`Hata: ${err.message}`);
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
      throw new Error('Gemini API anahtarı ayarlanmamış.');
    }
    const entries = await this.fetchSingleAiRuleObjects(deityName, 'Deity', apiKey, statusTextEl);
    if (!entries || !entries.length) {
      throw new Error(`"${deityName}" ile ilgili resmi bir D&D 3.5e tanrısı bulunamadı.`);
    }
    const deityEntry = entries.find(e => e && (e.type === 'Deity' || String(e.type).toLowerCase() === 'deity')) || entries[0];
    deityEntry.type = 'Deity';
    if (!deityEntry.alignment) deityEntry.alignment = 'Neutral';
    if (!deityEntry.favoredWeapon) deityEntry.favoredWeapon = 'Quarterstaff';
    if (!Array.isArray(deityEntry.domains)) deityEntry.domains = ['Magic', 'Knowledge'];
    return deityEntry;
  },

  async fetchRaceViaAi(raceName, statusTextEl = null) {
    const localHits = this.resolveLocalZeroTokenQuery(raceName);
    const localRace = localHits.find(e => e && String(e.type).toLowerCase() === 'race');
    if (localRace) return localRace;

    const apiKey = this.getApiKey();
    if (!apiKey) {
      if (typeof this.promptApiKey === 'function') this.promptApiKey();
      throw new Error('Gemini API anahtarı ayarlanmamış.');
    }
    const entries = await this.fetchSingleAiRuleObjects(raceName, 'Race', apiKey, statusTextEl);
    if (!entries || !entries.length) {
      throw new Error(`"${raceName}" ile ilgili resmi bir D&D 3.5e ırkı bulunamadı.`);
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

  async importMultipleFromAi() {
    const input = document.getElementById('ai-bulk-import-input');
    const btn = document.getElementById('ai-bulk-import-btn');
    const statusBox = document.getElementById('ai-rule-status');
    const statusText = document.getElementById('ai-rule-status-text');

    if (!input || !input.value.trim()) {
      alert('Lütfen içe aktarmak istediğiniz kuralları virgülle veya satır satır ayırarak yazın.');
      return;
    }

    const rawQueries = input.value.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    if (!rawQueries.length) return;

    const items = [...new Set(rawQueries)];
    if (!confirm(`Toplam ${items.length} adet kural taranıp Kanonik V2 formatında Master DB'ye eklenecek. Devam edilsin mi?`)) {
      return;
    }

    const apiKey = this.getApiKey();
    if (btn) btn.disabled = true;
    if (statusBox) statusBox.classList.remove('hidden');

    let totalImported = 0;
    for (let i = 0; i < items.length; i++) {
      const itemQuery = items[i];
      if (statusText) statusText.textContent = `[${i + 1}/${items.length}] "${itemQuery}" taranıyor...`;
      try {
        const entries = await this.fetchSingleAiRuleEntries(itemQuery, 'ALL', apiKey, statusText);
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
    alert(`🎉 Toplu İçe Aktarma Tamamlandı!\n${totalImported} adet Kanonik V2 kural başarıyla Master_DB'ye eklendi.`);
  },

  getChildrenForEntry(item) {
    if (!item || typeof item !== 'object') return [];
    return Array.isArray(item.modes) ? item.modes : [];
  },

  renderAiResults() {
    const container = document.getElementById('ai-results-container');
    if (!container) return;

    if (!this.lastAiResults || !this.lastAiResults.length) {
      container.innerHTML = '<div class="text-center text-slate-400 py-6">Sonuç bulunamadı.</div>';
      return;
    }

    let html = `
      <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl mb-3 shadow">
        <div>
          <span class="text-xs font-bold text-amber-300">D&D 3.5e RAW Doğrulandı:</span>
          <span class="text-xs text-slate-200 ml-1 font-semibold">${this.lastAiResults.length} Sonuç Bulundu</span>
          <span class="text-[11px] text-slate-400 block sm:inline sm:ml-2">Kanonik V2 JSON şemasıyla tam uyumlu</span>
        </div>
        <button onclick="RuleMaster.addAllAiResultsToDb()" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow transition flex items-center gap-1.5">
          <span>📥</span>
          <span>Tümünü DB'ye Ekle</span>
        </button>
      </div>
      <div class="space-y-3">
    `;

    this.lastAiResults.forEach((rawItem, idx) => {
      const item = this.ensureV2(rawItem);
      const modes = Array.isArray(item.modes) ? item.modes : [];
      const badgeClass = this.getTypeBadgeClass(item.type);
      const statPills = this.getEntrySummaryPills(item);
      const primaryBonusType = item.modifiers?.[0]?.type || (item.type === 'Weapon' && item.enhancementBonus ? 'Enhancement' : 'Untyped');

      const specificBadges = [];
      if (item.level !== undefined && item.level !== null && item.level !== '') {
        specificBadges.push(`<span class="badge bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">${item.level}. Seviye</span>`);
      }
      if (item.school && item.school !== '-') {
        specificBadges.push(`<span class="badge bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px]">${item.school}</span>`);
      }
      if (item.discipline && item.discipline !== '-') {
        specificBadges.push(`<span class="badge bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">${item.discipline}</span>`);
      }
      if (modes.length > 0) {
        specificBadges.push(`<span class="badge bg-purple-950 text-purple-200 border border-purple-600 text-[10px] font-bold">⚡ ${modes.length} Gömülü Mod</span>`);
      }

      html += `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md transition">
          <div class="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge ${badgeClass}">${item.type}</span>
                ${specificBadges.join(' ')}
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                <span>📚 <b>${item.source || 'Core 3.5e'}</b></span>
                <span>•</span>
                <span>Yuva: <b>${item.slot || 'None'}</b></span>
                <span>•</span>
                <span>Tür: <b>${primaryBonusType}</b></span>
                ${item.range && item.range !== '-' ? `<span>•</span><span>Menzil: <b class="text-cyan-400">${item.range}</b></span>` : ''}
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <button onclick="RuleMaster.addAiResultToDb(${idx})" class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1">
                <span>📥</span>
                <span>DB'ye Ekle</span>
              </button>
              <button onclick="RuleMaster.equipAiResultToCharacter(${idx})" class="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg transition font-bold" title="Karaktere Kuşan / Ekle">
                ⚡ Kuşan
              </button>
              <button onclick="RuleMaster.editAiResultInModal(${idx})" class="bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition" title="Düzenle">
                ✏️ Düzenle
              </button>
            </div>
          </div>

          ${statPills.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[10px] uppercase font-bold text-slate-400">Etkiler & Zar:</span>
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">${p}</span>`).join('')}
            </div>
          ` : ''}

          ${modes.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[10px] uppercase font-bold text-purple-300">Alt Modlar:</span>
              ${modes.map(m => `<span class="badge bg-purple-950/80 text-purple-200 border border-purple-700/60 font-mono text-[10px]">⚡ ${m.name}</span>`).join('')}
            </div>
          ` : ''}

          <div class="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
            ${item.benefit || item.description || 'Açıklama belirtilmemiş.'}
          </div>

          <div class="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
            <div class="flex items-center gap-3">
              <span>Aksiyon: <b class="text-amber-400">${item.action || 'Passive'}</b></span>
              <span>Süre/Kullanım: <b class="text-purple-300">${item.duration || 'Continuous'}</b></span>
            </div>
            <div class="flex items-center gap-3">
              <span>Ağırlık: <b class="text-slate-300">${item.weight || 0} lbs</b></span>
              <span>Fiyat: <b class="text-amber-300">${item.cost || 0} gp</b></span>
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
      const existsIdx = masterDb.findIndex(m => (m.id && m.id === item.id) || (m.name || '').toLowerCase().trim() === (item.name || '').toLowerCase().trim());
      if (existsIdx >= 0) {
        masterDb[existsIdx] = item;
      } else {
        masterDb.push(item);
      }

      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      this.renderTable();
      alert(`✅ "${item.name}" başarıyla Master_DB kütüphanesine eklendi!`);
    }
  },

  addAllAiResultsToDb() {
    if (!this.lastAiResults.length) return;
    this.lastAiResults.forEach(rawItem => {
      const copy = this.ensureV2(JSON.parse(JSON.stringify(rawItem)));
      const existsIdx = masterDb.findIndex(m => (m.id && m.id === copy.id) || (m.name || '').toLowerCase().trim() === (copy.name || '').toLowerCase().trim());
      if (existsIdx >= 0) {
        masterDb[existsIdx] = copy;
      } else {
        masterDb.push(copy);
      }
    });
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`✅ ${this.lastAiResults.length} Kanonik V2 kural başarıyla Master_DB kütüphanesine eklendi!`);
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

    // 1. Ensure item is placed in character.gearPool (except pure Feats/Spells/Maneuvers/Stances/Racial Traits/Flaws)
    const isNonPhysical = ['feat', 'spell', 'maneuver', 'stance', 'flaw', 'racial trait', 'race', 'deity'].includes(type);
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
      const wStats = item.weaponStats || {};
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
            title: 'Silah Kuşanıldı',
            breakdown: `"${item.name}" iki elli silah olduğu için ikinci eldeki "${unequippedOffHandName}" çıkarıldı.`,
            icon: '⚔️'
          });
        } else {
          alert(`⚔️ "${item.name}" iki elli (Two-Handed) bir silahtır! İkinci elinizdeki "${unequippedOffHandName}" çıkarıldı.`);
        }
      } else {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Silah Kuşanıldı',
            breakdown: `"${item.name}" kuşanıldı ve envantere eklendi.`,
            icon: '⚔️'
          });
        } else {
          alert(`⚔️ "${item.name}" silahı kuşanıldı ve çantaya eklendi!`);
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
      alert(`🔮 "${item.name}" büyüsü bilinen büyülere (Spells Known) eklendi!`);
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
      alert(`⚔️ "${item.name}" manevrası kuşanılan manevralara eklendi!`);
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
        const proceed = confirm(`⚠️ D&D 3.5e Unearthed Arcana kuralına göre Flaw (Kusur) yalnızca 1. Seviyede karakter yaratılırken seçilebilir. Mevcut karakter seviyeniz ${character.level}.\n\nYine de "${item.name}" kusurunu eklemek istiyor musunuz?`);
        if (!proceed) return;
      }
      if (!character.feats) character.feats = [];
      const cleanName = item.name.trim();
      if (!character.feats.some(f => (typeof f === 'string' ? f : f.name).toLowerCase().trim() === cleanName.toLowerCase())) {
        character.feats.push({
          schemaVersion: 2,
          id: item.id,
          name: cleanName,
          category: 'Flaw',
          source: item.source || 'Unearthed Arcana',
          benefit: item.benefit || 'Kusur karşılığında 1 bonus feat kazandırır.',
          modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : []
        });
      }
      alert(`⚠️ "${item.name}" kusuru karaktere eklendi!\n\n🎖️ D&D 3.5e Unearthed Arcana kuralı gereğince bu kusur karşılığında 1 adet EKSTRA BONUS FEAT KAZANDINIZ!`);
      if (typeof openFeatPickerModal === 'function') {
        setTimeout(() => openFeatPickerModal(false), 200);
      }
    } else if (type === 'racial trait' || cat.toLowerCase() === 'racial trait' || (item.category && item.category.toLowerCase().includes('racial'))) {
      if (character.level > 1) {
        const proceed = confirm(`⚠️ Irksal yetenekler normalde yalnızca 1. Seviyede belirlenir. Yine de "${item.name}" yeteneğini eklemek istiyor musunuz?`);
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
        alert(`🧬 "${item.name}" ırksal yeteneği eklendi!\n\n🎖️ Bu yetenek 1 adet ekstra bonus feat kazandırmaktadır.`);
        if (typeof openFeatPickerModal === 'function') {
          setTimeout(() => openFeatPickerModal(false), 200);
        }
      } else {
        alert(`🧬 "${item.name}" ırksal yeteneği karaktere eklendi!`);
      }
    } else if (type === 'feat') {
      if (!character.feats) character.feats = [];
      character.feats.push(item.name);
      alert(`✨ "${item.name}" hüneri (Feat) karaktere eklendi!`);
    } else if (type === 'potion' || type === 'scroll' || type === 'wand' || type === 'consumable' || (item.category && item.category.toLowerCase() === 'consumable')) {
      if (!character.consumables) character.consumables = [];
      character.consumables.push({
        id: item.id,
        name: item.name,
        qty: 1,
        effect: item.benefit || item.description || `${item.type || 'Consumable'} effect`
      });
      alert(`🧪 "${item.name}" (${item.type || 'Sarf Malzemesi'}) çantanıza eklendi!`);
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
            title: 'Eşya Kuşanıldı',
            breakdown: `"${item.name}" (${slotKey} yuvasına) kuşanıldı.`,
            icon: '🛡️'
          });
        } else {
          alert(`🛡️ "${item.name}" kuşanıldı (${slotKey} yuvasına yerleştirildi) ve çantaya eklendi!`);
        }
      } else {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Eşya Eklendi',
            breakdown: `"${item.name}" envanter havuzuna eklendi.`,
            icon: '🎒'
          });
        } else {
          alert(`🎒 "${item.name}" (${item.type}) çantanıza / envanter havuzunuza eklendi!`);
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
    if (countBadge) countBadge.textContent = `${items.length} Ekipman`;

    if (!items.length) {
      container.innerHTML = '<div class="col-span-full p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">Eşleşen silah veya zırh bulunamadı.</div>';
      return;
    }

    let html = '';
    items.forEach(rawItem => {
      const idx = masterDb.indexOf(rawItem);
      const item = this.ensureV2(rawItem);
      const isWeapon = item.type === 'Weapon';
      const wStats = item.weaponStats || {};
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
                <span class="text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge ${isWeapon ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-sky-950 text-sky-300 border border-sky-800'}">${item.type}</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">📚 ${item.source || 'PHB'} • Yuva: <b>${item.slot || 'Main Hand'}</b></div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${item.name.replace(/'/g, "\\'")}', type: 'Feat', action: 'Passive', desc: '${(item.benefit || item.description || '').replace(/'/g, "\\'")}', badge: '${item.type}' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Savaş Kokpitine Sabitle / Çıkar">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
            </div>
          </div>

          <div class="flex flex-wrap gap-1.5 text-xs font-mono">
            ${isWeapon ? `
              <span class="badge bg-slate-800 text-amber-300 font-bold inline-flex items-center gap-1">${typeof getFormulaDiceIconSvg === 'function' ? getFormulaDiceIconSvg(primaryDice, 'w-3 h-3 text-amber-400 shrink-0') : ''}<span>${primaryDice}</span></span>
              <span class="badge bg-slate-800 text-rose-300 font-bold">🎯 ${critMin}-20/x${critMult}</span>
              <span class="badge bg-slate-800 text-slate-300">${dmgType}</span>
            ` : `
              <span class="badge bg-sky-950 text-sky-300 border border-sky-800 font-bold">🛡️ +${acVal} AC</span>
              <span class="badge bg-slate-800 text-slate-300">Tür: ${item.type}</span>
            `}
            ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-800">${p}</span>`).join('')}
          </div>

          <p class="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">${item.benefit || item.description || '-'}</p>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
            <span class="text-amber-400 font-bold">${item.cost || 0} gp • ${item.weight || 0} lbs</span>
            <div class="flex gap-1.5">
              ${isWeapon ? `
                <button onclick="RuleMaster.equipWeaponSlot('${item.name.replace(/'/g, "\\'")}', 'Main Hand')" class="bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-[10px] font-bold px-2 py-1 rounded transition">⚡ Ana El</button>
                <button onclick="RuleMaster.equipWeaponSlot('${item.name.replace(/'/g, "\\'")}', 'Off-Hand')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-1 rounded transition">⚡ İkinci El</button>
              ` : `
                <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-200 text-[10px] font-bold px-2 py-1 rounded transition">🛡️ Kuşan</button>
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
    if (countBadge) countBadge.textContent = `${items.length} Büyü / Manevra`;

    if (!items.length) {
      container.innerHTML = '<div class="col-span-full p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">Eşleşen büyü veya manevra bulunamadı.</div>';
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
                <span class="text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge ${isSpell ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}">${item.type}</span>
                ${item.level !== undefined && item.level !== '' ? `<span class="badge bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">${item.level}. Seviye</span>` : ''}
                ${Array.isArray(item.modes) && item.modes.length > 0 ? `<span class="badge bg-purple-950 text-purple-200 border border-purple-700 text-[10px]">⚡ ${item.modes.length} Mod</span>` : ''}
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">
                ${isSpell ? `Okul: <b class="text-purple-300">${item.school || 'Universal'}</b>` : `Disiplin: <b class="text-rose-300">${item.discipline || 'Tome of Battle'}</b>`}
                • 📚 ${item.source || 'PHB/ToB'}
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${item.name.replace(/'/g, "\\'")}', type: 'Feat', action: 'Passive', desc: '${(item.benefit || item.description || '').replace(/'/g, "\\'")}', badge: '${item.type}' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Savaş Kokpitine Sabitle / Çıkar">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 text-[10px] text-slate-400">
            <span>Aksiyon: <b class="text-amber-300">${item.action || 'Standard Action'}</b></span>
            <span>Süre: <b class="text-slate-300">${item.duration || 'Instantaneous'}</b></span>
            ${primaryDice ? `<span>Zar: <b class="text-rose-400 font-mono">${primaryDice}</b></span>` : ''}
          </div>

          <p class="text-[11px] text-slate-300 line-clamp-3 leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-800/80">${item.benefit || item.description || '-'}</p>

          <div class="flex items-center justify-end pt-2 border-t border-slate-800">
            ${isSpell ? `
              <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-purple-900/60 hover:bg-purple-600 text-purple-200 text-xs font-bold px-3 py-1 rounded border border-purple-700 transition">✨ Bilinen Büyülere Ekle</button>
            ` : (isManeuver ? `
              <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold px-3 py-1 rounded transition">⚔️ Hazırla (Readied)</button>
            ` : `
              <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 text-xs font-bold px-3 py-1 rounded transition">🥋 Aktif Duruş Yap</button>
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
    if (countBadge) countBadge.textContent = `${items.length} Hüner`;

    if (!items.length) {
      container.innerHTML = '<div class="col-span-full p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">Eşleşen hüner (feat) bulunamadı.</div>';
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
                <span class="text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge bg-amber-950 text-amber-300 border border-amber-800">${item.type}</span>
                ${item.isFighterBonusFeat ? `<span class="badge bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">⚔️ Fighter Bonus</span>` : ''}
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">📚 ${item.source || 'PHB'} • Rol: <b>${item.role || 'General'}</b></div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${item.name.replace(/'/g, "\\'")}', type: 'Feat', action: 'Passive', desc: '${(item.benefit || item.description || '').replace(/'/g, "\\'")}', badge: 'Feat' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Savaş Kokpitine Sabitle / Çıkar">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
            </div>
          </div>

          ${item.prereq && item.prereq !== '-' ? `
            <div class="bg-slate-950/60 border border-slate-800 px-2.5 py-1.5 rounded text-[10px] text-amber-300">
              <span class="font-bold text-slate-400 uppercase">Önkoşullar:</span> ${item.prereq}
            </div>
          ` : ''}

          ${statPills.length > 0 ? `
            <div class="flex flex-wrap gap-1">
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">${p}</span>`).join('')}
            </div>
          ` : ''}

          <p class="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-800/80">${item.benefit || item.description || '-'}</p>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800">
            <span class="text-[10px] text-slate-500">Kapsam: ${item.scope || 'General'}</span>
            <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-200 text-xs font-bold px-3 py-1 rounded transition">✨ Hüneri Karaktere Ekle</button>
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
    if (countBadge) countBadge.textContent = `${items.length} Büyülü Eşya / İksir`;

    if (!items.length) {
      container.innerHTML = '<div class="col-span-full p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">Eşleşen büyülü eşya bulunamadı.</div>';
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
                <span class="text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge ${isPotion ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-teal-950 text-teal-300 border border-teal-800'}">${item.type}</span>
                <span class="badge bg-slate-800 text-slate-300 text-[10px]">${item.slot || 'Slotless'}</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">📚 ${item.source || 'MIC'} • Bonus: <b>${primaryBonusType}</b></div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${item.name.replace(/'/g, "\\'")}', type: 'Feat', action: 'Passive', desc: '${(item.benefit || item.description || '').replace(/'/g, "\\'")}', badge: '${primaryBonusType}' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Savaş Kokpitine Sabitle / Çıkar">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
            </div>
          </div>

          ${statPills.length > 0 ? `
            <div class="flex flex-wrap gap-1">
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">${p}</span>`).join('')}
            </div>
          ` : ''}

          <p class="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-800/80">${item.benefit || item.description || '-'}</p>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
            <span class="text-amber-400 font-bold">${item.cost || 0} gp • ${item.weight || 0} lbs</span>
            <button onclick="RuleMaster.equipToCharacter(${idx})" class="bg-teal-950 hover:bg-teal-900 border border-teal-700 text-teal-200 text-xs font-bold px-3 py-1 rounded transition">
              ${isPotion ? '🧪 Çantaya İksir Olarak Ekle' : '🎒 Envantere Kuşan / Ekle'}
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
                    <span class="text-sm font-extrabold text-white">${parent.name}</span>
                    <span class="badge ${this.getTypeBadgeClass(parent.type)}">${parent.type}</span>
                    <span class="badge bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">⚡ ${modes.length} Gömülü Mod</span>
                  </div>
                  <div class="text-[10px] text-slate-400">📚 ${parent.source || 'Core 3.5e'} • Yuva: <b>${parent.slot || 'None'}</b></div>
                </div>
              </div>
              <div class="flex gap-1.5">
                <button onclick="RuleMaster.addChildPower(${pIdx})" class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-2.5 py-1 rounded shadow transition flex items-center gap-1">
                  <span>➕</span>
                  <span>Mod Ekle</span>
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
                        <span class="text-xs font-bold text-purple-200">${mode.name}</span>
                        <span class="badge bg-slate-800 text-slate-400 text-[10px]">${mode.actionType || 'standard'}</span>
                      </div>
                    </div>
                    <div class="text-[11px] text-slate-300">${mode.benefit || '-'}</div>
                    ${modeDice ? `<div class="text-[10px] font-mono text-emerald-400 inline-flex items-center gap-1">${typeof getFormulaDiceIconSvg === 'function' ? getFormulaDiceIconSvg(modeDice, 'w-3 h-3 text-emerald-400 shrink-0') : ''}<span>Zar: ${modeDice}</span></div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
    });

    const badge = document.getElementById('tree-count-badge');
    if (badge) badge.textContent = `${countComposite} Çoklu Modlu Kayıt`;

    if (!treeHtml) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
          <div class="text-base font-bold text-slate-400">Henüz gömülü alt moda (modes) sahip eşya veya büyü bulunmuyor.</div>
          <div class="text-xs">Tablodaki herhangi bir kaydın yanındaki <b>🔗 Gömülü Alt Mod Ekle</b> butonuna tıklayarak çoklu modlu büyü veya eşya oluşturabilirsiniz.</div>
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
            <div class="text-[10px] text-slate-400 font-bold uppercase">Toplam Kayıt</div>
            <div class="text-lg font-black text-purple-400">${masterDb.length}</div>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Silah & Zırh</div>
            <div class="text-lg font-black text-rose-400">${weaponsCount + armorsCount}</div>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Büyü & Manevra</div>
            <div class="text-lg font-black text-indigo-400">${spellsCount + maneuversCount}</div>
          </div>
          <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Hüner & Eşya</div>
            <div class="text-lg font-black text-amber-400">${featsCount + itemsCount}</div>
          </div>
        </div>
      `;
    }
  },

  async resetMasterDbToDefault() {
    if (confirm('⚠️ Master DB veritabanını Core 3.5e varsayılan başlangıç kütüphanesine sıfırlamak istediğinize emin misiniz?')) {
      try {
        const resp = await fetch('master_db.json');
        if (resp.ok) {
          masterDb = await resp.json();
          if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
          this.renderTable();
          alert(`✅ Master DB başarıyla varsayılana sıfırlandı (${masterDb.length} kayıt)!`);
        } else {
          alert('❌ master_db.json dosyası yüklenemedi.');
        }
      } catch (e) {
        alert('❌ Sıfırlama hatası: ' + e.message);
      }
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
            <span class="text-xs font-bold text-white">${src.priority}. ${src.name}</span>
            <span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700">${src.status}</span>
          </div>
          <div class="text-[11px] text-slate-400">${src.scope}</div>
          <div class="flex items-center justify-between pt-1 border-t border-slate-800">
            <span class="text-[10px] text-indigo-300 font-mono">${src.type}</span>
            ${isExternal ? `
              <a href="${src.url}" target="_blank" class="text-xs text-sky-400 hover:underline flex items-center gap-1">
                <span>Bağlantıyı Aç</span> <span>↗</span>
              </a>
            ` : `
              <span class="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <span>⚡</span> <span>Dahili Motor</span>
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
          <div class="text-xs font-bold text-white">${b.name}</div>
          <div class="text-[10px] text-slate-400 mt-1">${b.note}</div>
        `;
        bookContainer.appendChild(div);
      });
    }
  },

  // Quick / Heuristic Rule Parser (Parses raw text from d20srd, books or SRD into Canonical V2)
  parseRawText() {
    const raw = document.getElementById('raw-rule-input')?.value || '';
    if (!raw.trim()) {
      alert('⚠️ Lütfen ayrıştırılacak bir kural metni yapıştırın.');
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
    const panel = document.getElementById('inline-ai-adder-panel');
    if (panel) panel.classList.add('hidden');
  },

  setInlineQueryAndSearch(term, categoryHint = 'ALL') {
    const queryInput = document.getElementById('inline-ai-rule-query');
    const catSelect = document.getElementById('inline-ai-rule-category');
    if (queryInput) queryInput.value = term;
    if (catSelect) catSelect.value = categoryHint;
    this.queryInlineAiRule();
  },

  async queryInlineAiRule() {
    const queryInput = document.getElementById('inline-ai-rule-query');
    let query = queryInput?.value?.trim() || '';
    if (!query) {
      alert('⚠️ Lütfen aranacak kural, hüner, büyü veya eşya adını yazın.');
      queryInput?.focus();
      return;
    }

    // 0ms Local Resolution (Master DB -> SrdCompendium -> ItemAssembler -> Canonical Dictionary)
    const localHits = this.resolveLocalZeroTokenQuery(query);
    if (localHits.length > 0) {
      this.renderInlineAiResults(localHits);
      const st = document.getElementById('inline-ai-status-text');
      if (st) st.innerHTML = `⚡ <b>"${localHits[0].name}"</b> yerel V2 kütüphanesinden / montaj motorundan anında yüklendi (0 ms, Sıfır Token).`;
      const lb = document.getElementById('inline-ai-loading-box');
      if (lb) lb.classList.remove('hidden');
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('⚠️ Lütfen önce bir Google Gemini API Anahtarı girin (Google AI Studio ücretsiz anahtar).\nAyarlar penceresinden anahtarınızı kolayca kaydedebilirsiniz.');
      if (typeof openSettingsModal === 'function') openSettingsModal();
      return;
    }

    const catSelect = document.getElementById('inline-ai-rule-category');
    const categoryHint = catSelect?.value || 'ALL';

    const btn = document.getElementById('btn-inline-ai-search');
    const loadingBox = document.getElementById('inline-ai-loading-box');
    const statusText = document.getElementById('inline-ai-status-text');
    const resultsBox = document.getElementById('inline-ai-results-box');

    if (btn) btn.disabled = true;
    if (loadingBox) loadingBox.classList.remove('hidden');
    if (resultsBox) resultsBox.innerHTML = '';

    try {
      const entries = await this.fetchSingleAiRuleObjects(query, categoryHint, apiKey, statusText);
      this.renderInlineAiResults(entries);
    } catch (err) {
      alert(`⚠️ Kural getirilemedi: ${err.message}\nLütfen internet bağlantınızı ve API anahtarınızı kontrol edin.`);
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
          Uygun kural kaydı bulunamadı. Lütfen kural adını kontrol edip tekrar arayın.
        </div>
      `;
      return;
    }

    const entries = this.convertRowsToEntries(rowsOrEntries).map(e => this.ensureV2(e));
    this._inlineEntries = entries;

    let html = `
      <div class="flex items-center justify-between bg-slate-900 border border-purple-500/40 p-2.5 rounded-xl mb-2 shadow-md">
        <div class="flex items-center gap-2">
          <span class="text-base">✨</span>
          <div>
            <div class="text-xs font-bold text-white">${entries.length} Kanonik V2 Kural Ayrıştırıldı</div>
            <div class="text-[10px] text-slate-400">Ana kayıt ve gömülü modları tek seferde eklenebilir</div>
          </div>
        </div>
        <button onclick="RuleMaster.addAllInlineResultsToDb()" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5">
          <span>📥</span>
          <span>Tümünü DB'ye Ekle</span>
        </button>
      </div>
      <div class="space-y-2 mt-2">
    `;

    entries.forEach((item, idx) => {
      const modes = Array.isArray(item.modes) ? item.modes : [];
      const badgeClass = this.getTypeBadgeClass(item.type);
      const statPills = this.getEntrySummaryPills(item);

      html += `
        <div class="bg-slate-950 border border-purple-500/40 rounded-xl p-3 shadow-md space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs md:text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge ${badgeClass} text-[10px]">${item.type}</span>
                ${modes.length > 0 ? `<span class="badge bg-purple-950 text-purple-200 border border-purple-600 text-[10px] font-bold">⚡ ${modes.length} Gömülü Mod</span>` : ''}
                <span class="text-[10px] text-slate-400">📚 <b>${item.source || 'PHB'}</b></span>
                <span class="text-[10px] text-slate-400">• Slot: <b>${item.slot || 'None'}</b></span>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button onclick="RuleMaster.addInlineResultToDb(${idx})" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow transition flex items-center gap-1">
                <span>📥</span>
                <span>DB'ye Ekle</span>
              </button>
              <button onclick="RuleMaster.equipInlineResultToCharacter(${idx})" class="bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 text-xs px-2 py-1 rounded-lg transition font-bold" title="Karaktere Kuşan">
                ⚡ Kuşan
              </button>
              <button onclick="RuleMaster.editInlineResultInModal(${idx})" class="bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs px-2 py-1 rounded-lg border border-slate-700 transition" title="Formda İncele/Düzenle">
                ✏️ Düzenle
              </button>
            </div>
          </div>

          ${statPills.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1">
              <span class="text-[9px] uppercase font-bold text-slate-400">Etkiler:</span>
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[9px] font-bold">${p}</span>`).join('')}
            </div>
          ` : ''}

          ${modes.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1">
              <span class="text-[9px] uppercase font-bold text-purple-300">Alt Modlar:</span>
              ${modes.map(m => `<span class="badge bg-purple-950 text-purple-200 border border-purple-700 font-mono text-[9px]">⚡ ${m.name}</span>`).join('')}
            </div>
          ` : ''}

          <div class="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded border border-slate-800">
            ${item.benefit || item.description || '-'}
          </div>

          <div class="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <div>
              <span>Aksiyon: <b class="text-amber-400">${item.action || 'Passive'}</b></span> • 
              <span>Süre: <b class="text-purple-300">${item.duration || 'Continuous'}</b></span>
            </div>
            <div>
              <span>Ağırlık: <b>${item.weight || 0} lbs</b></span> • 
              <span>Fiyat: <b class="text-amber-300">${item.cost || 0} gp</b></span>
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
    const existsIdx = masterDb.findIndex(m => (m.id && m.id === item.id) || (m.name || '').toLowerCase().trim() === (item.name || '').toLowerCase().trim());
    if (existsIdx >= 0) {
      masterDb[existsIdx] = item;
    } else {
      masterDb.push(item);
    }

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`✅ "${item.name}" başarıyla Master_DB'ye eklendi ve kütüphane güncellendi!`);
  },

  addAllInlineResultsToDb() {
    if (!this._inlineEntries || !this._inlineEntries.length) return;
    [...this._inlineEntries].reverse().forEach(it => {
      const copy = this.ensureV2(JSON.parse(JSON.stringify(it)));
      const existsIdx = masterDb.findIndex(m => (m.id && m.id === copy.id) || (m.name || '').toLowerCase().trim() === (copy.name || '').toLowerCase().trim());
      if (existsIdx >= 0) {
        masterDb[existsIdx] = copy;
      } else {
        masterDb.unshift(copy);
      }
    });
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`✅ Toplam ${this._inlineEntries.length} Kanonik V2 kural başarıyla Master_DB'ye eklendi!`);
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
  // SERBEST METİN (FREE-TEXT) AI AYRIŞTIRICI ENGINE (CANONICAL V2)
  // ====================================================
  switchInlineMode(mode) {
    const searchPanel = document.getElementById('inline-mode-search');
    const freetextPanel = document.getElementById('inline-mode-freetext');
    const btnSearch = document.getElementById('btn-inline-mode-search');
    const btnFreetext = document.getElementById('btn-inline-mode-freetext');
    const headerTitle = document.getElementById('inline-panel-header-title');

    if (mode === 'freetext') {
      if (searchPanel) searchPanel.classList.add('hidden');
      if (freetextPanel) freetextPanel.classList.remove('hidden');
      if (btnSearch) btnSearch.className = 'px-2.5 py-1 rounded font-bold transition text-slate-400 hover:text-white';
      if (btnFreetext) btnFreetext.className = 'px-2.5 py-1 rounded font-bold transition bg-purple-600 text-white shadow';
      if (headerTitle) headerTitle.textContent = '🧙‍♂️🤖 Rule Master (AI) Serbest Metin Ayrıştırıcı';
      const ta = document.getElementById('inline-ai-freetext-input');
      if (ta) ta.focus();
    } else {
      if (searchPanel) searchPanel.classList.remove('hidden');
      if (freetextPanel) freetextPanel.classList.add('hidden');
      if (btnSearch) btnSearch.className = 'px-2.5 py-1 rounded font-bold transition bg-purple-600 text-white shadow';
      if (btnFreetext) btnFreetext.className = 'px-2.5 py-1 rounded font-bold transition text-slate-400 hover:text-white';
      if (headerTitle) headerTitle.textContent = 'Hızlı 🧙‍♂️🤖 Rule Master (AI) Kural Ekleyici';
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
      alert('⚠️ Lütfen önce serbest metin kutusuna kural metni yapıştırın.');
      return;
    }
    const fullTa = document.getElementById('raw-rule-input');
    if (fullTa) fullTa.value = val;
    this.parseRawText();
  },

  async queryAiFreeTextRows(rawText, apiKey, statusTextEl = null) {
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
1. STRICT REAL RAW 3.5E RULES ONLY.
2. EMBEDDED MODES (NO SEPARATE '↳' CHILD ROWS):
   If the item or spell has multiple distinct powers or sub-modes (e.g. Flametongue 1/day 4d6 fire ray, or Searing Light vs Undead), embed them inside the parent entry's "modes" array.
3. UNIVERSAL MODIFIERS & DAMAGE PARTS:
   - Stat/roll bonuses go into "modifiers": [{"target": "ac.dodge"|"attack.all"|"ability.str"|"save.ref"|"speed.land", "value": 1, "type": "Dodge"|"Enhancement"|"Untyped", "condition": null}].
   - Dice expressions go into "damageParts": [{"dice": "1d8", "bonus": 1, "type": "Slashing", "multiplyOnCrit": true, "onCritOnly": false, "source": "Base Weapon"}, {"dice": "1d6", "bonus": 0, "type": "Fire", "multiplyOnCrit": false, "onCritOnly": false, "source": "Flaming"}].

OUTPUT REQUIREMENT:
Return valid JSON only matching:
{
  "entries": [
    {
      "schemaVersion": 2,
      "id": "unique_slug_id",
      "name": "Entry Name",
      "type": "Feat|Weapon|Armor|Shield|Ring|Wondrous Item|Spell|Potion|Maneuver|Stance",
      "slot": "None|Main Hand|Two-Handed|Armor|Off-Hand/Shield|Ring|Belt|Shoulders|Neck|Head|Feet|Hands|Arms",
      "source": "PHB p.92 / DMG p.224",
      "prereq": "-",
      "benefit": "Concise mechanical summary",
      "description": "Full text",
      "action": "Passive|Standard Action|Swift Action|Immediate Action|Full-Round Action",
      "actionType": "passive|standard|swift|immediate|full_round",
      "duration": "Continuous|Instantaneous|1 round/level",
      "weight": 0,
      "cost": 0,
      "modifiers": [],
      "damageParts": [],
      "modes": [],
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
        statusTextEl.textContent = `Serbest metin analiz ediliyor (Model: ${model})...`;
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
        const errMsg = err && err.name === 'AbortError' ? `Zaman aşımı (10s) - ${model} yanıt vermedi.` : err.message;
        console.warn(`Model ${model} free-text parse failed:`, errMsg);
        lastError = new Error(errMsg);
      }
    }

    if (!successData) {
      throw new Error(lastError?.message || 'Tüm Gemini modelleri yanıt vermedi.');
    }

    const rawItems = successData.entries || successData.rows || (Array.isArray(successData) ? successData : [successData]);
    if (!Array.isArray(rawItems)) {
      throw new Error('Model beklenen kayıt dizisini üretemedi.');
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
      alert('⚠️ Lütfen analiz edilecek serbest kural metnini yapıştırın.');
      ta?.focus();
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('⚠️ Lütfen önce bir Google Gemini API Anahtarı girin (Google AI Studio ücretsiz anahtar).\nAyarlar penceresinden anahtarınızı kolayca kaydedebilirsiniz.');
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
      alert(`⚠️ Serbest metin ayrıştırılamadı: ${err.message}\nLütfen internet bağlantınızı ve API anahtarınızı kontrol edin.`);
    } finally {
      if (btn) btn.disabled = false;
      if (loadingBox) loadingBox.classList.add('hidden');
    }
  },

  async queryFullAiFreeText() {
    const ta = document.getElementById('raw-rule-input');
    const text = ta?.value?.trim() || '';
    if (!text) {
      alert('⚠️ Lütfen analiz edilecek serbest kural metnini yapıştırın.');
      ta?.focus();
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('⚠️ Lütfen önce bir Google Gemini API Anahtarı tanımlayın.');
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
      alert(`⚠️ Serbest metin ayrıştırılamadı: ${err.message}`);
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
      throw new Error('Gemini API anahtarı tanımlanmamış. Lütfen Ayarlar veya Rule Master sekmesinden API anahtarı ekleyin.');
    }

    const availableModels = await this.getAvailableGeminiModels(apiKey);
    let successText = '';
    let lastError = '';

    for (const model of availableModels) {
      if (typeof onStatus === 'function') {
        onStatus(`${model} ile RAW kuralları taranıyor...`);
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
        lastError = netErr && netErr.name === 'AbortError' ? `Zaman aşımı (12s) - ${model} yanıt vermedi.` : netErr.message;
      }
    }

    if (successText) {
      return successText;
    }
    throw new Error(lastError || 'Gemini API modellerinden yanıt alınamadı.');
  },

  evaluateHeuristicLevelUp(ctx) {
    const {
      characterName = 'Karakter',
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
          statReason = `${st.toUpperCase()} değeri ${val} (tek sayı). +1 ekleyerek ${val + 1} yapmak modifiyerinizi +${Math.floor(((val + 1) - 10) / 2)} seviyesine yükseltir!`;
          break;
        }
      }

      if (!recommendedStat) {
        recommendedStat = statPriority[0];
        const currentVal = Number(abilities[recommendedStat]) || 10;
        statReason = `${targetClass} için birincil stat olan ${recommendedStat.toUpperCase()} (${currentVal}) artırımı tavsiye edilir.`;
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
      featBenefit = 'Caster Level\'ınızı +4 artırır (toplam HD\'yi geçemez). Çoklu sınıf (Gish) büyü gücü kaybını telafi eder.';
      featCategory = 'Regular Feat';
      featPrereq = 'Spellcraft 4 ranks';
    } else if (isGish && bab >= 1 && !hasFeat('arcane strike')) {
      recommendedFeat = 'Arcane Strike';
      featBenefit = 'Büyü yuvası harcayarak tüm yakın dövüş saldırılarınıza +büyü seviyesi kadar saldırı ve +1d6 ekstra büyü hasarı kazandırır.';
      featCategory = 'Regular Feat';
      featPrereq = 'BAB +1, 3. seviye arcane büyü atabilme';
    } else if (isMartial) {
      if (!hasFeat('power attack') && (abilities.str || 10) >= 13 && bab >= 1) {
        recommendedFeat = 'Power Attack';
        featBenefit = 'BAB kadar saldırı zarından feda edip iki elli silahla x2 hasar elde etmenizi sağlar.';
        featCategory = 'Regular Feat';
        featPrereq = 'STR 13, BAB +1';
      } else if (!hasFeat('cleave') && (abilities.str || 10) >= 13 && hasFeat('power attack')) {
        recommendedFeat = 'Cleave';
        featBenefit = 'Bir rakibi düşürdüğünüzde veya öldürdüğünüzde yakındaki başka bir hedefe anında ekstra ücretsiz saldırı yaparsınız.';
        featCategory = 'Regular Feat';
        featPrereq = 'Power Attack, STR 13';
      } else if (!hasFeat('improved bull rush') && hasFeat('power attack') && (abilities.str || 10) >= 13) {
        recommendedFeat = 'Improved Bull Rush';
        featBenefit = 'Bull Rush yaparken fırsat saldırısı almazsınız ve +4 karşı koyma bonusu alırsınız. Shock Trooper için zorunlu önkoşuldur.';
        featCategory = 'Regular Feat';
        featPrereq = 'Power Attack, STR 13';
      } else if (bab >= 6 && hasFeat('improved bull rush') && !hasFeat('shock trooper')) {
        recommendedFeat = 'Shock Trooper';
        featBenefit = 'Heedless Charge ile Power Attack cezasını saldırı zarına değil Zırh Sınıfına (AC) yansıtarak %100 isabetle devasa hasar verirsiniz.';
        featCategory = 'Regular Feat';
        featPrereq = 'BAB +6, Power Attack, Improved Bull Rush';
      } else if (hasFeat('power attack') && !hasFeat('leap attack')) {
        recommendedFeat = 'Leap Attack';
        featBenefit = 'Hücum (Charge) sırasında Jump yaparak Power Attack hasar bonusunu x3 katlarsınız.';
        featCategory = 'Regular Feat';
        featPrereq = 'Jump 8 ranks, Power Attack';
      } else if (!hasFeat('improved initiative')) {
        recommendedFeat = 'Improved Initiative';
        featBenefit = 'İnisiyatif kontrollerine kalıcı +4 bonus kazandırır. Savaşta her zaman ilk hamleyi yapmanızı sağlar.';
        featCategory = 'Regular Feat';
        featPrereq = 'Yok';
      } else if (isWarblade && !hasFeat('adaptive style')) {
        recommendedFeat = 'Adaptive Style';
        featBenefit = 'Tüm Tome of Battle manevralarınızı 1 tam turda (full-round action) anında yeniden hazırlamanızı sağlar.';
        featCategory = 'Regular Feat';
        featPrereq = 'Initiator Level 1+';
      } else if (!hasFeat('iron will')) {
        recommendedFeat = 'Iron Will';
        featBenefit = 'İrade (Will) kurtarma zarlarına kalıcı +2 bonus sağlar. Savaşçıların en zayıf kurtarma zarını korur.';
        featCategory = 'Regular Feat';
        featPrereq = 'Yok';
      } else {
        recommendedFeat = 'Weapon Focus';
        featBenefit = 'Seçilen silahta tüm saldırı zarlarına kalıcı +1 bonus sağlar.';
        featCategory = 'Regular Feat';
        featPrereq = 'Proficiency with weapon, BAB +1';
      }
    } else if (isSorcerer) {
      if (!hasFeat('improved initiative')) {
        recommendedFeat = 'Improved Initiative';
        featBenefit = 'İnisiyatif zarına +4 bonus. Büyücülerin savaşı ilk turda bitirecek büyüleri (Haste, Slow, Fireball) önce atmasını sağlar.';
        featCategory = 'Regular Feat';
        featPrereq = 'Yok';
      } else if (!hasFeat('empower spell')) {
        recommendedFeat = 'Empower Spell';
        featBenefit = 'Büyünün tüm değişken sayısal etkilerini %50 artırır (+2 büyü yuvası).';
        featCategory = 'Regular Feat';
        featPrereq = 'Metamagic';
      } else {
        recommendedFeat = 'Spell Focus';
        featBenefit = 'Seçilen büyü okulundaki büyülerin Kurtarma DC değerine kalıcı +1 bonus kazandırır.';
        featCategory = 'Regular Feat';
        featPrereq = 'Yok';
      }
    } else {
      recommendedFeat = 'Improved Initiative';
      featBenefit = 'İnisiyatif zarına kalıcı +4 bonus kazandırır.';
      featCategory = 'Regular Feat';
      featPrereq = 'Yok';
    }

    // 3. Synergy notes
    let notes = '';
    if (isGish) {
      notes = `${targetClass} Seviye ${targetLevel}: Warblade yakın dövüş dayanıklılığı ile Sorcerer büyü havuzunu harmanlayan Gish yapısı güçlendirildi.`;
    } else if (isWarblade) {
      notes = `Warblade Seviye ${targetLevel}: Yüksek Hit Die ve BAB artışı ile yakın dövüş etkinliği artırıldı.`;
    } else {
      notes = `${targetClass} Seviye ${targetLevel} ilerlemesi tamamlandı.`;
    }

    let adviceHtml = `
      <div class="space-y-2">
        <div class="flex items-center justify-between pb-1 border-b border-purple-500/30">
          <span class="font-bold text-amber-300 flex items-center gap-1.5">
            <span>📖</span><span>D&D 3.5e RAW Kural Motoru Tavsiyesi (Seviye ${targetLevel})</span>
          </span>
          <span class="text-[10px] text-purple-300 font-mono">Heuristic Analysis</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${isStatLevel ? `
            <div class="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1">
              <div class="text-[11px] font-bold text-amber-300 flex items-center justify-between">
                <span>💪 Stat Artışı (+1)</span>
                <span class="badge bg-amber-900 text-amber-200 border border-amber-600 font-mono text-[9px] font-bold">+1 ${recommendedStat.toUpperCase()}</span>
              </div>
              <p class="text-[11px] text-amber-100/90 leading-relaxed">${statReason}</p>
              <button type="button" onclick="applyCopilotStat('${recommendedStat}')" class="w-full mt-1 py-1 rounded bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/50 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer">
                <span>⚡</span><span>Bu Statı Seç (+1 ${recommendedStat.toUpperCase()})</span>
              </button>
            </div>
          ` : `
            <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div class="text-[11px] font-bold text-slate-400">💪 Stat Artışı</div>
              <p class="text-[11px] text-slate-400">Bu seviyede (${targetLevel}) temel stat artışı bulunmuyor (4, 8, 12, 16, 20. seviyelerde verilir).</p>
            </div>
          `}

          <div class="p-2 rounded-lg bg-purple-950/40 border border-purple-500/40 space-y-1">
            <div class="text-[11px] font-bold text-purple-300 flex items-center justify-between">
              <span>🎯 Önerilen Feat</span>
              <span class="badge bg-purple-900 text-purple-200 border border-purple-600 font-mono text-[9px] font-bold">${recommendedFeat}</span>
            </div>
            <p class="text-[11px] text-purple-100/90 leading-relaxed">${featBenefit}</p>
            <div class="text-[10px] text-purple-400 italic">Önkoşul: ${featPrereq}</div>
            <button type="button" onclick="applyCopilotFeat('${recommendedFeat}', '${featBenefit.replace(/'/g, "\\'")}', '${featCategory}')" class="w-full mt-1 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/50 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer">
              <span>⚡</span><span>Bu Feat'i Yuvaya Doldur</span>
            </button>
          </div>
        </div>

        <div class="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/30 space-y-1">
          <div class="text-[11px] font-bold text-indigo-300 flex items-center justify-between">
            <span>⚔️ Taktiksel Sinerji & Sınıf Rehberi</span>
            <button type="button" onclick="applyCopilotNotes('${notes.replace(/'/g, "\\'")}')" class="text-[10px] text-indigo-300 hover:text-white underline cursor-pointer">Notlara Aktar</button>
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed">${notes}</p>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-[10px] text-slate-500 italic">💡 Gemini API Anahtarı ile sınırsız ek kitap (splatbook) ve derin taktiksel analiz alabilirsiniz.</span>
          <button type="button" onclick="applyCopilotAll({ recommendedFeat: '${recommendedFeat}', featBenefit: '${featBenefit.replace(/'/g, "\\'")}', featCategory: '${featCategory}', recommendedStat: '${recommendedStat || ''}', notes: '${notes.replace(/'/g, "\\'")}' })" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg shadow flex items-center gap-1 transition cursor-pointer">
            <span>🚀</span><span>Tüm Önerileri Tek Tıkla Uygula</span>
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
      characterName = 'Karakter',
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
    const knownFeatsStr = feats.join(', ') || 'Yok';
    const statsStr = `STR: ${abilities.str || 10}, DEX: ${abilities.dex || 10}, CON: ${abilities.con || 10}, INT: ${abilities.int || 10}, WIS: ${abilities.wis || 10}, CHA: ${abilities.cha || 10}`;

    const systemInstruction = `Sen D&D 3.5e Rule Master ve akıllı Seviye Atlama Danışmanısın (Level Up Copilot).
Verilen D&D 3.5e karakter bilgilerini ve resmi RAW kaynaklarını (PHB, DMG, Complete Warrior, Complete Arcane, Complete Divine, Complete Adventurer, Complete Mage, Complete Scoundrel, Complete Champion, Tome of Battle, Spell Compendium) temel alarak son derece yetkin, taktiksel ve kural hatasız bir seviye atlama tavsiyesi hazırla.
Karakterin mevcut sınıfları, BAB değeri, statları, kurtarma zarları ve mevcut featleri arasındaki sinerjiyi derinlemesine değerlendir.

Cevabında:
1. Feat Önerisi: Karakterin bu seviyede alabileceği en optimal feat, neden seçildiği ve önkoşullarının nasıl karşılandığı.
2. Stat Artışı: Eğer Seviye 4, 8, 12, 16, 20 ise (+1 Ability Score), hangi statın artırılması gerektiği (özellikle tek sayıdan çift sayıya geçerek modifiyer kazandıran statları belirt).
3. Sınıf Özellikleri & Büyüler/Manevralar: Bu seviyede kazanılan veya seçilmesi gereken büyü / manevralar.
4. Taktiksel Sinerji Özeti.

ÖNEMLİ KURAL: Yanıtının en sonunda SİSTEMİN OTOMATİK DOLDURABİLMESİ İÇİN kesinlikle şu JSON bloğunu yerleştir:
\`\`\`json
{
  "recommendedFeat": "Feat Adı",
  "featBenefit": "Kısa faydası (1 cümle)",
  "featCategory": "Regular Feat",
  "recommendedStat": "str",
  "notes": "Karakter sayfasına eklenecek kısa taktiksel seviye notu"
}
\`\`\``;

    const userPrompt = `Karakter Adı: ${characterName}
Irk: ${race} | Uyum: ${alignment}
Mevcut Sınıflar: ${classProgStr}
Hedef İlerleme: Seviye ${targetLevel} (${targetClass} Seviyesi Alınıyor)
Statlar: ${statsStr}
Temel Saldırı Bonusu (BAB): +${bab}
Kurtarma Zarları: Fort +${saves.fort || 0}, Ref +${saves.ref || 0}, Will +${saves.will || 0}
Mevcut Featler / Yetenekler: ${knownFeatsStr}
Stat Artışı (+1) Hakkı Var mı?: ${isStatLevel ? 'EVET (+1 Stat seçilmeli)' : 'Hayır'}
Feat Seçim Hakkı Var mı?: ${isFeatLevel ? 'EVET' : 'İsteğe Bağlı / Bonus Feat'}
${customQuery ? `Kullanıcının Özel Sorusu: ${customQuery}` : 'Bu seviye atlama için en iyi build optimizasyonunu ve D&D 3.5e RAW kural tavsiyelerini ver.'}`;

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
      const featBenefit = parsedJson?.featBenefit || 'D&D 3.5e RAW tavsiyesi';
      const featCategory = parsedJson?.featCategory || 'Regular Feat';
      const recStat = parsedJson?.recommendedStat || (ctx.isStatLevel ? 'str' : null);
      const notes = parsedJson?.notes || `${targetClass} Seviye ${targetLevel} ilerlemesi yapıldı.`;

      let adviceHtml = `
        <div class="space-y-2">
          <div class="flex items-center justify-between pb-1 border-b border-purple-500/30">
            <span class="font-bold text-purple-300 flex items-center gap-1.5">
              <span>🧙‍♂️🤖</span><span>Rule Master (AI) Seviye Tavsiyesi (Seviye ${targetLevel})</span>
            </span>
            <span class="badge bg-purple-950 text-purple-300 border border-purple-600 font-mono text-[9px] font-bold">Gemini RAW AI</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
            ${recStat ? `
              <div class="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
                <div>
                  <div class="text-[10px] font-bold text-amber-400 uppercase">Önerilen Stat:</div>
                  <div class="text-xs font-black text-white">+1 ${recStat.toUpperCase()}</div>
                </div>
                <button type="button" onclick="applyCopilotStat('${recStat}')" class="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] shadow transition cursor-pointer">
                  Uygula
                </button>
              </div>
            ` : ''}

            ${recFeat ? `
              <div class="p-2 rounded-lg bg-purple-950/40 border border-purple-500/40 flex items-center justify-between">
                <div class="truncate mr-2">
                  <div class="text-[10px] font-bold text-purple-300 uppercase">Önerilen Feat:</div>
                  <div class="text-xs font-black text-white truncate" title="${recFeat}">${recFeat}</div>
                </div>
                <button type="button" onclick="applyCopilotFeat('${recFeat}', '${featBenefit.replace(/'/g, "\\'")}', '${featCategory}')" class="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] shadow transition cursor-pointer shrink-0">
                  Yuvaya Doldur
                </button>
              </div>
            ` : ''}
          </div>

          <div class="prose prose-invert text-xs leading-relaxed max-h-72 overflow-y-auto pr-1">
            ${htmlBody}
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-purple-900/50">
            <button type="button" onclick="applyCopilotNotes('${notes.replace(/'/g, "\\'")}')" class="text-[10px] text-indigo-300 hover:text-white underline cursor-pointer">
              📝 Tavsiye Notunu Ekle
            </button>
            <button type="button" onclick="applyCopilotAll({ recommendedFeat: '${recFeat}', featBenefit: '${featBenefit.replace(/'/g, "\\'")}', featCategory: '${featCategory}', recommendedStat: '${recStat || ''}', notes: '${notes.replace(/'/g, "\\'")}' })" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 transition cursor-pointer active:scale-95">
              <span>⚡</span><span>Tüm Önerileri Tek Tıkla Uygula</span>
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
          <span>⚠️</span><span>Yapay Zeka API bağlantısı sağlanamadı (${err.message}). D&D 3.5e RAW Kural Motoru tavsiyeleri gösteriliyor.</span>
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
      alert('⚠️ Kütüphane denetimi için geçerli bir Gemini API anahtarı gereklidir.');
      this.promptChangeApiKey();
      return;
    }

    const items = (Array.isArray(this.masterDb) ? this.masterDb : [])
      .filter(i => i && i.name);

    if (items.length === 0) {
      alert('ℹ️ Yerel kullanıcı veri tabanınızda (master_db) henüz özel kayıt bulunmamaktadır.\n\nModüler SRD V2 kütüphanesindeki 3.522 kayıt zaten deterministik olarak doğrulanmış ve dondurulmuştur.');
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
              <h3 class="font-bold text-sm text-purple-300">Gemini Pro ile RAW 3.5e & Kanonik V2 Kütüphane Denetimi</h3>
              <p class="text-[11px] text-slate-400">master_db içindeki ${items.length} özel kayıt taranıyor...</p>
            </div>
          </div>
          <button onclick="document.getElementById('rule-master-audit-modal').classList.add('hidden')" class="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 rounded bg-slate-800 cursor-pointer">✕</button>
        </div>
        <div id="rule-master-audit-content" class="max-h-96 overflow-y-auto space-y-2 pr-1 text-xs">
          <div class="text-center py-8 text-slate-400 animate-pulse flex items-center justify-center gap-2">
            <span>⚡ Gemini Pro modeline bağlanılıyor ve RAW kural motoru denetimi başlatılıyor...</span>
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

      const models = this.getModelsForTask('RULE_AUDIT');
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
        contentEl.innerHTML = `<div class="p-3 text-rose-300 bg-rose-950/40 rounded border border-rose-800">⚠️ Denetim gerçekleştirilemedi veya yanıt alınamadı. Lütfen API kotanızı kontrol edin.</div>`;
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
              <span class="font-bold text-white">${r.name}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}">
                ${badgeIcon} ${r.status}
              </span>
            </div>
            ${r.issues && r.issues.length ? `<p class="text-[10px] text-amber-200">${r.issues.join(' | ')}</p>` : `<p class="text-[10px] text-emerald-400">Resmi 3.5e RAW ve Kanonik V2 standartlarına tam uyumlu.</p>`}
          </div>
        `;
      }).join('');

    } catch (err) {
      const contentEl = document.getElementById('rule-master-audit-content');
      if (contentEl) {
        contentEl.innerHTML = `<div class="p-3 text-rose-300 bg-rose-950/40 rounded border border-rose-800">Hata: ${err.message}</div>`;
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
}

window.RuleMaster = RuleMaster;
