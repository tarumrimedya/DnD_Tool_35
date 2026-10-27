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

  // Default Item Schema (Declarative Master_DB Schema with actionType, ruleFlags, combatModifiers, skillBonuses)
  createEmptyEntry(type = 'Weapon') {
    return {
      name: '',
      type: type,
      slot: type === 'Weapon' ? 'Main Hand' : (type === 'Shield' ? 'Off-Hand/Shield' : (type === 'Armor' ? 'Armor' : 'None')),
      parent: '-',
      prereq: '-',
      source: 'PHB p.',
      benefit: '',
      bonusType: 'Untyped',
      scope: 'None / General',
      // 16 Stat buffs
      strBonus: '',
      dexBonus: '',
      conBonus: '',
      intBonus: '',
      wisBonus: '',
      chaBonus: '',
      acBonus: '',
      hpBonus: '',
      attBonus: '',
      dmgBonus: '',
      fortBonus: '',
      refBonus: '',
      willBonus: '',
      skillBonus: '',
      clBonus: '',
      speedBonus: '',
      // Combat & Action
      extraDmg: '',
      dice: type === 'Weapon' ? '1d8' : '',
      critMin: 20,
      critMult: 2,
      dmgType: type === 'Weapon' ? 'Slashing' : '',
      action: 'Standard Action',
      actionType: this.deriveActionType('Standard Action', type),
      duration: 'Continuous',
      weight: 1,
      cost: 10,
      role: 'Offense / Attack',
      // Declarative Rules Engine Extensions (Commit fbfbf1c+)
      ruleFlags: null,
      combatModifiers: null,
      skillBonuses: null,
      // Magic/Maneuver specifics
      school: '',
      level: '',
      discipline: '',
      tags: []
    };
  },

  // Presets for quick generation
  getPresets() {
    return {
      weapon: {
        type: 'Weapon',
        slot: 'Main Hand',
        bonusType: 'Enhancement',
        scope: 'Specific Weapon',
        action: 'Standard / Full Attack',
        duration: 'Continuous',
        role: 'Offense / Attack',
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
        role: 'Offense / Attack',
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
        role: 'Defense / Counter',
        acBonus: 2,
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
        role: 'Defense / Counter',
        acBonus: 4,
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
        role: 'Offense / Attack',
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
        role: 'Defense / Counter',
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
        role: 'Defense / Consumable',
        weight: 0.1,
        cost: 50
      }
    };
  },

  // Save new or updated entry
  saveEntry(entryData, editIndex = -1) {
    if (!entryData.name || !entryData.name.trim()) {
      alert('⚠️ Lütfen geçerli bir Kural / Eşya Adı giriniz.');
      return false;
    }

    // Auto-capitalize first letters and identifiers (e.g. natural_armor_ench -> Natural_Armor_Ench)
    if (entryData.name) entryData.name = this.capitalizeTitle(entryData.name);
    if (entryData.bonusType) entryData.bonusType = this.capitalizeIdentifier(entryData.bonusType);
    if (entryData.type) entryData.type = this.capitalizeIdentifier(entryData.type);
    if (entryData.slot) entryData.slot = this.capitalizeIdentifier(entryData.slot);
    if (entryData.role) entryData.role = this.capitalizeIdentifier(entryData.role);
    if (entryData.scope) entryData.scope = this.capitalizeIdentifier(entryData.scope);
    if (entryData.actionType) entryData.actionType = this.capitalizeIdentifier(entryData.actionType);
    if (entryData.discipline) entryData.discipline = this.capitalizeIdentifier(entryData.discipline);
    if (entryData.school) entryData.school = this.capitalizeIdentifier(entryData.school);
    if (entryData.dmgType) entryData.dmgType = this.capitalizeIdentifier(entryData.dmgType);

    let oldName = null;
    let oldEntry = null;
    if (editIndex >= 0 && editIndex < masterDb.length) {
      oldEntry = JSON.parse(JSON.stringify(masterDb[editIndex]));
      oldName = oldEntry.name;

      // Safe Merge: Preserve modern declarative fields (ruleFlags, combatModifiers, skillBonuses, actionType, proficiency)
      const mergedEntry = Object.assign({}, oldEntry, entryData);
      if (!entryData.actionType) {
        mergedEntry.actionType = oldEntry.actionType || this.deriveActionType(mergedEntry.action, mergedEntry.type);
      }
      if (entryData.ruleFlags === undefined && oldEntry.ruleFlags !== undefined) {
        mergedEntry.ruleFlags = oldEntry.ruleFlags;
      }
      if (entryData.combatModifiers === undefined && oldEntry.combatModifiers !== undefined) {
        mergedEntry.combatModifiers = oldEntry.combatModifiers;
      }
      if (entryData.skillBonuses === undefined && oldEntry.skillBonuses !== undefined) {
        mergedEntry.skillBonuses = oldEntry.skillBonuses;
      }
      if (entryData.isLight === undefined && oldEntry.isLight !== undefined) {
        mergedEntry.isLight = oldEntry.isLight;
      }
      if (entryData.proficiency === undefined && oldEntry.proficiency !== undefined) {
        mergedEntry.proficiency = oldEntry.proficiency;
      }

      masterDb[editIndex] = mergedEntry;
      entryData = mergedEntry;
    } else {
      if (!entryData.actionType) {
        entryData.actionType = this.deriveActionType(entryData.action, entryData.type);
      }
      const parentName = (entryData.parent && entryData.parent !== '-') ? entryData.parent.replace(/^↳\s*/, '').trim().toLowerCase() : '';
      const parentIdx = parentName ? masterDb.findIndex(m => (m.name || '').replace(/^↳\s*/, '').trim().toLowerCase() === parentName) : -1;
      if (parentIdx >= 0) {
        let insertAt = parentIdx + 1;
        while (insertAt < masterDb.length && (masterDb[insertAt].parent || '').replace(/^↳\s*/, '').trim().toLowerCase() === parentName) {
          insertAt++;
        }
        masterDb.splice(insertAt, 0, entryData);
      } else {
        masterDb.unshift(entryData);
      }
    }

    // Cascade changes into character state (inventory, body slots, weapons, consumables)
    let syncCount = 0;
    if (oldName) {
      syncCount = this.syncMasterDbEditToCharacter(oldName, entryData);
    }

    // Persist and sync
    if (typeof saveStateToStorage === 'function') {
      saveStateToStorage(true);
    }
    this.renderTable();
    if (typeof renderAll === 'function') {
      renderAll();
    }

    if (oldName && syncCount > 0) {
      alert(`✅ "${entryData.name}" Master DB'de güncellendi ve çantanızdaki / karakterinizdeki ${syncCount} kayda anında yansıtıldı!`);
    }

    return true;
  },

  // Synchronize Master DB edits into character inventory and equipped items
  syncMasterDbEditToCharacter(oldName, updatedEntry) {
    if (!oldName || !updatedEntry || typeof character === 'undefined' || !character) return 0;
    let changesCount = 0;
    const cleanOld = oldName.toLowerCase().trim();
    const cleanNew = (updatedEntry.name || '').toLowerCase().trim();

    // 1. Sync character.gearPool
    if (Array.isArray(character.gearPool)) {
      character.gearPool.forEach(item => {
        const itemClean = (item.name || '').toLowerCase().trim();
        const masterDbRef = (item.masterDbName || '').toLowerCase().trim();
        if (itemClean === cleanOld || masterDbRef === cleanOld || itemClean === cleanNew) {
          item.name = updatedEntry.name;
          item.masterDbName = updatedEntry.name;
          if (typeof mapEntryToGearCategory === 'function') {
            item.category = mapEntryToGearCategory(updatedEntry);
          } else if (updatedEntry.type) {
            item.category = updatedEntry.type;
          }
          if (updatedEntry.slot && updatedEntry.slot !== 'None' && updatedEntry.slot !== '-') {
            item.slot = updatedEntry.slot;
          }
          if (updatedEntry.tags) {
            item.tags = Array.isArray(updatedEntry.tags) ? [...updatedEntry.tags] : updatedEntry.tags;
          }
          item.weight = Number(updatedEntry.weight) || 0;
          item.cost = Number(updatedEntry.cost) || 0;
          item.desc = updatedEntry.benefit || updatedEntry.description || '';
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
          if (slotClean === cleanOld || slotClean === cleanNew) {
            slotObj.name = updatedEntry.name;
            slotObj.weight = Number(updatedEntry.weight) || 0;
            slotObj.cost = Number(updatedEntry.cost) || 0;
            slotObj.desc = updatedEntry.benefit || updatedEntry.description || '';
            if (updatedEntry.actionType) slotObj.actionType = updatedEntry.actionType;
            if (updatedEntry.skillBonuses) slotObj.skillBonuses = updatedEntry.skillBonuses;
            if (updatedEntry.ruleFlags) slotObj.ruleFlags = updatedEntry.ruleFlags;
            if (updatedEntry.combatModifiers) slotObj.combatModifiers = updatedEntry.combatModifiers;
            changesCount++;
          }
        }
      });
    }

    // 3. Sync character.weapons
    if (Array.isArray(character.weapons)) {
      character.weapons.forEach(w => {
        const wepClean = (w.name || '').toLowerCase().trim();
        if (wepClean === cleanOld || wepClean === cleanNew) {
          w.name = updatedEntry.name;
          if (updatedEntry.slot) w.slot = updatedEntry.slot;
          if (updatedEntry.tags) w.tags = Array.isArray(updatedEntry.tags) ? [...updatedEntry.tags] : updatedEntry.tags;
          if (updatedEntry.dice || updatedEntry.extraDmg) w.dice = updatedEntry.dice || updatedEntry.extraDmg;
          if (updatedEntry.critMin) w.critMin = Number(updatedEntry.critMin);
          if (updatedEntry.critMult) w.critMult = Number(updatedEntry.critMult);
          if (updatedEntry.attBonus !== undefined && updatedEntry.attBonus !== '') w.attBonus = Number(updatedEntry.attBonus);
          if (updatedEntry.dmgBonus !== undefined && updatedEntry.dmgBonus !== '') w.dmgBonus = Number(updatedEntry.dmgBonus);
          if (updatedEntry.dmgType) w.dmgType = updatedEntry.dmgType;
          if (updatedEntry.bonusType) w.bonusType = updatedEntry.bonusType;
          if (updatedEntry.actionType) w.actionType = updatedEntry.actionType;
          if (updatedEntry.ruleFlags) w.ruleFlags = updatedEntry.ruleFlags;
          if (updatedEntry.combatModifiers) w.combatModifiers = updatedEntry.combatModifiers;
          changesCount++;
        }
      });
      if (character.activeWeapon && (character.activeWeapon.toLowerCase().trim() === cleanOld || character.activeWeapon.toLowerCase().trim() === cleanNew)) {
        character.activeWeapon = updatedEntry.name;
      }
    }

    // 4. Sync character.consumables
    if (Array.isArray(character.consumables)) {
      character.consumables.forEach(c => {
        const cClean = (c.name || '').toLowerCase().trim();
        if (cClean === cleanOld || cClean === cleanNew) {
          c.name = updatedEntry.name;
          c.effect = updatedEntry.benefit || updatedEntry.description || c.effect;
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
            return updatedEntry.name;
          }
          return f;
        } else if (f && f.name) {
          if (f.name.toLowerCase().trim() === cleanOld) {
            f.name = updatedEntry.name;
            f.benefit = updatedEntry.benefit || f.benefit;
            if (updatedEntry.actionType) f.actionType = updatedEntry.actionType;
            if (updatedEntry.ruleFlags) f.ruleFlags = updatedEntry.ruleFlags;
            if (updatedEntry.combatModifiers) f.combatModifiers = updatedEntry.combatModifiers;
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
        if ((s.name || '').toLowerCase().trim() === cleanOld || (s.name || '').toLowerCase().trim() === cleanNew) {
          s.name = updatedEntry.name;
          s.benefit = updatedEntry.benefit || s.benefit;
          if (updatedEntry.school) s.school = updatedEntry.school;
          changesCount++;
        }
      });
    }

    // 7. Sync character.tomeOfBattle
    if (character.tomeOfBattle) {
      if (Array.isArray(character.tomeOfBattle.readiedManeuvers)) {
        character.tomeOfBattle.readiedManeuvers.forEach(m => {
          if ((m.name || '').toLowerCase().trim() === cleanOld || (m.name || '').toLowerCase().trim() === cleanNew) {
            m.name = updatedEntry.name;
            m.notes = updatedEntry.benefit || m.notes;
            changesCount++;
          }
        });
      }
      if (Array.isArray(character.tomeOfBattle.stancesKnown)) {
        character.tomeOfBattle.stancesKnown.forEach(st => {
          if ((st.name || '').toLowerCase().trim() === cleanOld || (st.name || '').toLowerCase().trim() === cleanNew) {
            st.name = updatedEntry.name;
            st.benefit = updatedEntry.benefit || st.benefit;
            changesCount++;
          }
        });
      }
      if (character.activeStance && (character.activeStance.toLowerCase().trim() === cleanOld || character.activeStance.toLowerCase().trim() === cleanNew)) {
        character.activeStance = updatedEntry.name;
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
      const copy = JSON.parse(JSON.stringify(masterDb[index]));
      copy.name += " (Kopya)";
      masterDb.splice(index + 1, 0, copy);
      if (typeof saveStateToStorage === 'function') {
        saveStateToStorage(true);
      }
      this.renderTable();
    }
  },

  // Add Child Power linked to Parent
  addChildPower(parentIndex) {
    if (parentIndex >= 0 && parentIndex < masterDb.length) {
      const parentItem = masterDb[parentIndex];
      const child = this.createEmptyEntry(parentItem.type || 'Active Power');
      child.name = `↳ ${parentItem.name} (Alt Etki)`;
      child.parent = parentItem.name;
      child.isChild = true;
      child.slot = parentItem.slot || 'None';
      child.source = parentItem.source;
      child.school = parentItem.school || '';
      child.discipline = parentItem.discipline || '';
      child.level = parentItem.level !== undefined ? parentItem.level : '';
      child.role = 'Tactical / Power';
      child.weight = 0;
      child.cost = 0;
      this.openModalWithData(child, -1);
    }
  },

  // Equip or learn into active character
  equipToCharacter(index) {
    if (index < 0 || index >= masterDb.length || typeof character === 'undefined' || !character) return;
    const item = masterDb[index];
    this.equipItem(item);
  },

  // Direct 1-click addition from Master DB to Inventory
  addToInventory(index) {
    if (index < 0 || index >= masterDb.length || typeof character === 'undefined' || !character) return;
    const item = masterDb[index];
    if (!character.gearPool) character.gearPool = [];

    const inPool = character.gearPool.some(p => (p.name || '').toLowerCase() === item.name.toLowerCase());
    if (inPool) {
      alert(`ℹ️ "${item.name}" zaten çantanızda mevcut!`);
      return;
    }

    const cat = typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(item) : (item.type || 'Other');
    const isBelt = (item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable';

    character.gearPool.push({
      id: Date.now(),
      name: item.name,
      masterDbName: item.name,
      category: cat,
      slot: item.slot && item.slot !== 'None' ? item.slot : cat,
      qty: 1,
      weight: Number(item.weight) || 0,
      cost: Number(item.cost) || 0,
      desc: item.benefit || item.description || '',
      isBelt: isBelt,
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

  // Open Edit / Add Modal
  openModalWithData(entry, editIndex = -1) {
    this.selectedEntryIndex = editIndex;
    this._currentEditingEntry = entry ? JSON.parse(JSON.stringify(entry)) : null;
    const modal = document.getElementById('rule-crud-modal');
    if (!modal) return;

    // Title
    document.getElementById('rule-modal-title').textContent = editIndex >= 0 ? `✏️ Düzenle: ${entry.name}` : '➕ Yeni Kural / Eşya Ekle';

    // Populate fields
    document.getElementById('rf-name').value = entry.name || '';
    document.getElementById('rf-type').value = entry.type || 'Weapon';
    let slotVal = entry.slot || 'None';
    if (slotVal === 'Two-Hand' || slotVal === 'Both Hands') slotVal = 'Two-Handed';
    const slotEl = document.getElementById('rf-slot');
    if (slotEl) {
      slotEl.value = slotVal;
      if (!slotEl.value) slotEl.value = 'None';
    }
    const tagsEl = document.getElementById('rf-tags');
    if (tagsEl) {
      tagsEl.value = Array.isArray(entry.tags) ? entry.tags.join(', ') : (entry.tags || '');
    }
    document.getElementById('rf-parent').value = entry.parent || '-';
    document.getElementById('rf-prereq').value = entry.prereq || '-';
    document.getElementById('rf-source').value = entry.source || 'PHB p.';
    document.getElementById('rf-benefit').value = entry.benefit || '';
    const bonusTypeSelect = document.getElementById('rf-bonus-type');
    if (bonusTypeSelect) {
      const rawBonus = this.capitalizeIdentifier(entry.bonusType || 'Untyped');
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
    document.getElementById('rf-scope').value = entry.scope || 'None / General';
    document.getElementById('rf-role').value = entry.role || 'Offense / Attack';

    // Stat Buffs
    document.getElementById('rf-str').value = entry.strBonus || '';
    document.getElementById('rf-dex').value = entry.dexBonus || '';
    document.getElementById('rf-con').value = entry.conBonus || '';
    document.getElementById('rf-int').value = entry.intBonus || '';
    document.getElementById('rf-wis').value = entry.wisBonus || '';
    document.getElementById('rf-cha').value = entry.chaBonus || '';
    document.getElementById('rf-ac').value = entry.acBonus || '';
    document.getElementById('rf-hp').value = entry.hpBonus || '';
    document.getElementById('rf-atk').value = entry.attBonus || '';
    document.getElementById('rf-dmg').value = entry.dmgBonus || '';
    document.getElementById('rf-fort').value = entry.fortBonus || '';
    document.getElementById('rf-ref').value = entry.refBonus || '';
    document.getElementById('rf-will').value = entry.willBonus || '';
    document.getElementById('rf-skill').value = entry.skillBonus || '';
    document.getElementById('rf-cl').value = entry.clBonus || '';
    document.getElementById('rf-speed').value = entry.speedBonus || '';

    // Combat & Action
    document.getElementById('rf-dice').value = entry.dice || entry.extraDmg || '';
    document.getElementById('rf-crit-min').value = entry.critMin || 20;
    document.getElementById('rf-crit-mult').value = entry.critMult || 2;
    document.getElementById('rf-dmg-type').value = entry.dmgType || '';
    document.getElementById('rf-action').value = entry.action || 'Standard Action';
    document.getElementById('rf-duration').value = entry.duration || 'Continuous';
    document.getElementById('rf-weight').value = entry.weight !== undefined ? entry.weight : 1;
    document.getElementById('rf-cost').value = entry.cost !== undefined ? entry.cost : 10;

    // Specifics
    document.getElementById('rf-school').value = entry.school || '';
    document.getElementById('rf-level').value = entry.level || '';
    document.getElementById('rf-discipline').value = entry.discipline || '';

    // Daily Charges / Uses
    const dcInput = document.getElementById('rf-daily-charges');
    const unitInput = document.getElementById('rf-charge-unit');
    if (dcInput) {
      let maxVal = '';
      let unit = 'charges';
      if (entry.dailyCharges && typeof entry.dailyCharges.max === 'number') {
        maxVal = entry.dailyCharges.max;
        unit = entry.dailyCharges.unit || 'charges';
      } else if (typeof entry.dailyCharges === 'number') {
        maxVal = entry.dailyCharges;
      } else if (entry.charges && typeof entry.charges === 'number') {
        maxVal = entry.charges;
      } else {
        const fullDesc = `${entry.name || ''} ${entry.benefit || ''} ${entry.description || ''} ${entry.duration || ''}`;
        const match = fullDesc.match(/(?:(\d+)\s*(?:charges?|rounds?|uses?|times?|kullanım|şarj|defa)?\s*(?:\/|\s*per\s*|\s*x\s*|\s*a\s*)\s*(?:day|gün|günde|günlük))|(?:(?:günde|günlük)\s*(\d+)\s*(?:şarj|kullanım|tur|round|defa)?)/i);
        if (match) {
          maxVal = parseInt(match[1] || match[2]) || '';
          if (/round|tur/i.test(match[0])) unit = 'rounds';
          else if (/use|kullanım|times|defa/i.test(match[0])) unit = 'uses';
        }
      }
      dcInput.value = maxVal;
      if (unitInput) unitInput.value = unit;
    }

    modal.classList.remove('hidden');
  },

  // Save Modal Action
  submitModal() {
    const editIdx = this.selectedEntryIndex;
    const baseObj = (editIdx >= 0 && masterDb && masterDb[editIdx])
      ? JSON.parse(JSON.stringify(masterDb[editIdx]))
      : (this._currentEditingEntry ? JSON.parse(JSON.stringify(this._currentEditingEntry)) : {});

    const actVal = document.getElementById('rf-action').value;
    const typeVal = document.getElementById('rf-type').value;
    const derivedActType = this.deriveActionType(actVal, typeVal);

    const formData = {
      name: this.capitalizeTitle(document.getElementById('rf-name').value.trim()),
      type: this.capitalizeIdentifier(typeVal),
      slot: this.capitalizeIdentifier(document.getElementById('rf-slot').value),
      action: actVal,
      actionType: baseObj.actionType || derivedActType,
      tags: (() => {
        const rawTags = document.getElementById('rf-tags')?.value || '';
        const tagsArr = rawTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        const sl = document.getElementById('rf-slot')?.value || '';
        if ((sl === 'Two-Handed' || sl === 'Two-Hand' || sl === 'Both Hands') && !tagsArr.includes('two-handed')) {
          tagsArr.push('two-handed');
        }
        return tagsArr;
      })(),
      parent: document.getElementById('rf-parent').value.trim() || '-',
      prereq: document.getElementById('rf-prereq').value.trim() || '-',
      source: document.getElementById('rf-source').value.trim() || 'PHB p.',
      benefit: document.getElementById('rf-benefit').value.trim(),
      bonusType: this.capitalizeIdentifier(document.getElementById('rf-bonus-type').value),
      scope: this.capitalizeIdentifier(document.getElementById('rf-scope').value),
      role: this.capitalizeIdentifier(document.getElementById('rf-role').value),

      // Stats
      strBonus: document.getElementById('rf-str').value ? Number(document.getElementById('rf-str').value) : '',
      dexBonus: document.getElementById('rf-dex').value ? Number(document.getElementById('rf-dex').value) : '',
      conBonus: document.getElementById('rf-con').value ? Number(document.getElementById('rf-con').value) : '',
      intBonus: document.getElementById('rf-int').value ? Number(document.getElementById('rf-int').value) : '',
      wisBonus: document.getElementById('rf-wis').value ? Number(document.getElementById('rf-wis').value) : '',
      chaBonus: document.getElementById('rf-cha').value ? Number(document.getElementById('rf-cha').value) : '',
      acBonus: document.getElementById('rf-ac').value ? Number(document.getElementById('rf-ac').value) : '',
      hpBonus: document.getElementById('rf-hp').value ? Number(document.getElementById('rf-hp').value) : '',
      attBonus: document.getElementById('rf-atk').value ? Number(document.getElementById('rf-atk').value) : '',
      dmgBonus: document.getElementById('rf-dmg').value ? Number(document.getElementById('rf-dmg').value) : '',
      fortBonus: document.getElementById('rf-fort').value ? Number(document.getElementById('rf-fort').value) : '',
      refBonus: document.getElementById('rf-ref').value ? Number(document.getElementById('rf-ref').value) : '',
      willBonus: document.getElementById('rf-will').value ? Number(document.getElementById('rf-will').value) : '',
      skillBonus: document.getElementById('rf-skill').value ? Number(document.getElementById('rf-skill').value) : '',
      clBonus: document.getElementById('rf-cl').value ? Number(document.getElementById('rf-cl').value) : '',
      speedBonus: document.getElementById('rf-speed').value ? Number(document.getElementById('rf-speed').value) : '',

      // Combat
      dice: document.getElementById('rf-dice').value.trim(),
      extraDmg: document.getElementById('rf-dice').value.trim(),
      critMin: Number(document.getElementById('rf-crit-min').value) || 20,
      critMult: Number(document.getElementById('rf-crit-mult').value) || 2,
      dmgType: this.capitalizeIdentifier(document.getElementById('rf-dmg-type').value.trim()),
      duration: document.getElementById('rf-duration').value.trim(),
      weight: Number(document.getElementById('rf-weight').value) || 0,
      cost: Number(document.getElementById('rf-cost').value) || 0,

      // Specifics
      school: this.capitalizeIdentifier(document.getElementById('rf-school').value.trim()),
      level: document.getElementById('rf-level').value ? Number(document.getElementById('rf-level').value) : '',
      discipline: this.capitalizeIdentifier(document.getElementById('rf-discipline').value.trim())
    };

    // Process Daily Charges
    const dailyChargesVal = parseInt(document.getElementById('rf-daily-charges')?.value);
    const chargeUnitVal = document.getElementById('rf-charge-unit')?.value || 'charges';
    if (!isNaN(dailyChargesVal) && dailyChargesVal > 0) {
      formData.dailyCharges = {
        current: (baseObj.dailyCharges?.current !== undefined && baseObj.dailyCharges.current <= dailyChargesVal) ? baseObj.dailyCharges.current : dailyChargesVal,
        max: dailyChargesVal,
        unit: chargeUnitVal,
        recharge: 'long_rest'
      };
    } else if (baseObj.dailyCharges) {
      delete formData.dailyCharges;
    }

    // Deep Merge with baseObj to guarantee ruleFlags, combatModifiers, and skillBonuses are preserved
    const entry = Object.assign({}, baseObj, formData);

    if (this.saveEntry(entry, this.selectedEntryIndex)) {
      this.closeModal();
    }
  },

  closeModal() {
    const modal = document.getElementById('rule-crud-modal');
    if (modal) modal.classList.add('hidden');
    this.selectedEntryIndex = -1;
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
    if (p.acBonus) document.getElementById('rf-ac').value = p.acBonus;
  },

  // Render Table with Badges, Actions, and Pagination
  renderTable() {
    const tbody = document.getElementById('master-db-tbody');
    if (!tbody || !masterDb) return;

    const query = (document.getElementById('mdb-search-input')?.value || '').toLowerCase();
    const cat = document.getElementById('mdb-category-filter')?.value || 'ALL';
    const bonusFilter = document.getElementById('mdb-bonus-filter')?.value || 'ALL';
    const scopeFilter = document.getElementById('mdb-scope-filter')?.value || 'ALL';

    // Filter
    let filtered = masterDb.filter((item, idx) => {
      item._originalIndex = idx; // keep track of array index for edits/deletes
      const matchQ = !query || 
        item.name.toLowerCase().includes(query) || 
        (item.benefit && item.benefit.toLowerCase().includes(query)) ||
        (item.source && item.source.toLowerCase().includes(query)) ||
        (item.discipline && item.discipline.toLowerCase().includes(query));

      const matchCat = cat === 'ALL' || item.type === cat;
      const matchBonus = bonusFilter === 'ALL' || item.bonusType === bonusFilter;
      const matchScope = scopeFilter === 'ALL' || item.scope === scopeFilter;

      return matchQ && matchCat && matchBonus && matchScope;
    });

    // Group parent and child entries so parents always render above their children
    const getCleanName = (str) => (str || '').replace(/^↳\s*/, '').trim().toLowerCase();
    const isChildItem = (it) => Boolean((it.parent && it.parent !== '-' && it.parent !== '') || (it.name && it.name.trim().startsWith('↳')));
    const getParentKey = (it) => {
      if (it.parent && it.parent !== '-' && it.parent !== '') return getCleanName(it.parent);
      if (it.name && it.name.trim().startsWith('↳')) {
        const clean = it.name.replace(/^↳\s*/, '').trim();
        return clean.split(':')[0].trim().toLowerCase();
      }
      return '';
    };

    const parentSet = new Set();
    filtered.forEach(it => {
      if (!isChildItem(it)) {
        parentSet.add(getCleanName(it.name));
      }
    });

    const childrenByParent = new Map();
    filtered.forEach(it => {
      if (isChildItem(it)) {
        const pKey = getParentKey(it);
        if (pKey && parentSet.has(pKey)) {
          if (!childrenByParent.has(pKey)) childrenByParent.set(pKey, []);
          childrenByParent.get(pKey).push(it);
        }
      }
    });

    const orderedFiltered = [];
    filtered.forEach(it => {
      if (isChildItem(it)) {
        const pKey = getParentKey(it);
        if (pKey && parentSet.has(pKey)) {
          // Will be rendered immediately below its parent
          return;
        }
      }
      orderedFiltered.push(it);
      if (!isChildItem(it)) {
        const pKey = getCleanName(it.name);
        if (childrenByParent.has(pKey)) {
          childrenByParent.get(pKey).forEach(child => orderedFiltered.push(child));
          childrenByParent.delete(pKey);
        }
      }
    });

    // Update count badge
    const countBadge = document.getElementById('mdb-total-count-badge');
    if (countBadge) countBadge.textContent = `${orderedFiltered.length} / ${masterDb.length} Kayıt`;

    tbody.innerHTML = '';

    orderedFiltered.forEach(item => {
      const idx = item._originalIndex;
      const tr = document.createElement('tr');
      const isChild = isChildItem(item);
      tr.className = isChild
        ? 'bg-purple-950/15 hover:bg-slate-800/50 transition border-b border-slate-800/80'
        : 'hover:bg-slate-800/50 transition border-b border-slate-800/80';

      const typeBadgeClass = this.getTypeBadgeClass(item.type);

      // Stat summary string
      const statParts = [];
      if (item.attBonus) statParts.push(`Atk +${item.attBonus}`);
      if (item.dmgBonus) statParts.push(`Dmg +${item.dmgBonus}`);
      if (item.acBonus) statParts.push(`AC +${item.acBonus}`);
      if (item.extraDmg || item.dice) statParts.push(`Zar: ${item.extraDmg || item.dice}`);
      if (item.strBonus) statParts.push(`STR +${item.strBonus}`);
      if (item.dexBonus) statParts.push(`DEX +${item.dexBonus}`);
      if (item.conBonus) statParts.push(`CON +${item.conBonus}`);
      if (item.fortBonus) statParts.push(`Fort +${item.fortBonus}`);
      if (item.refBonus) statParts.push(`Ref +${item.refBonus}`);
      if (item.willBonus) statParts.push(`Will +${item.willBonus}`);
      const statsSummary = statParts.length > 0 ? statParts.join(' • ') : '-';

      tr.innerHTML = `
        <td class="py-2.5 px-3 ${isChild ? 'pl-7 border-l-2 border-purple-500/60' : ''}">
          <div class="font-bold text-white flex items-center gap-1.5 flex-wrap">
            <span>${item.name}</span>
            ${isChild && item.parent && item.parent !== '-' ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800">↳ Parent: ${item.parent}</span>` : ''}
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">${item.source || 'PHB'}</div>
        </td>
        <td class="py-2.5 px-3">
          <span class="badge ${typeBadgeClass}">${item.type ? this.capitalizeIdentifier(item.type) : 'Other'}</span>
          ${item.discipline ? `<span class="badge bg-rose-950 text-rose-300 border border-rose-800 block mt-1 w-max">${this.capitalizeIdentifier(item.discipline)}</span>` : ''}
        </td>
        <td class="py-2.5 px-3 text-slate-300 text-xs">
          <div>${item.slot ? this.capitalizeIdentifier(item.slot) : 'None'}</div>
          ${item.level !== undefined && item.level !== '' ? `<div class="text-[10px] text-amber-400 font-bold">${item.level}. Seviye</div>` : ''}
        </td>
        <td class="py-2.5 px-3">
          <div class="text-xs font-semibold text-amber-300">${item.bonusType ? this.capitalizeIdentifier(item.bonusType) : 'Untyped'}</div>
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
            <button onclick="RuleMaster.addChildPower(${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs transition" title="Alt Yetenek Ekle (Child Power)">
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

  DND35_RAW_GUARDRAIL: `STRICT D&D 3.5E RAW ONLY (ZERO 5E / PATHFINDER / HOMEBREW):
- You are strictly operating under official Wizards of the Coast D&D 3.5e RAW (Rules As Written).
- ABSOLUTELY NEVER apply 5e mechanics (No Advantage/Disadvantage, No Bonus Action, No Finesse adding Dex to damage, No -5/+10 GWM, No Short Rest).
- ABSOLUTELY NEVER accept unofficial community Homebrew (such as Extra Readied Maneuver). Only official WotC D&D 3.5e publications.
- Adhere strictly to Player's Handbook (PHB), Dungeon Master's Guide (DMG), and official 3.5e splatbooks (Complete series, Tome of Battle, etc.).`,

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

  // 3 Temel AI Kullanım Alanı İçin Dinamik Model Çözümleyicisi (En Yüksek Kararlı Sürüm Matrisi)
  AI_TASK_ROUTING: {
    // 1. Hızlı Arama & Seviye Atlama (En Yüksek Kararlı Flash Motoru)
    QUICK_SEARCH: {
      primary: 'gemini-3.8-flash',
      fallback: 'gemini-3.7-flash'
    },
    // 2. Kütüphane & Kural Denetimi (En Yüksek Kararlı Pro Muhakeme Motoru)
    RULE_AUDIT: {
      primary: 'gemini-3.8-pro',
      fallback: 'gemini-3.5-pro'
    },
    // 3. Toplu İçe Aktarım & Serbest Metin Ayrıştırma (Yapısal JSON)
    IMPORT_BATCH: {
      primary: 'gemini-3.8-flash',
      fallback: 'gemini-3.8-pro'
    }
  },

  getModelsForTask(taskType = 'DEFAULT') {
    const userPref = this.getAiModelMode();
    if (userPref === 'pro') {
      return [this.AI_TASK_ROUTING.RULE_AUDIT.primary, this.AI_TASK_ROUTING.RULE_AUDIT.fallback];
    }
    if (userPref === 'flash') {
      return [this.AI_TASK_ROUTING.QUICK_SEARCH.primary, this.AI_TASK_ROUTING.QUICK_SEARCH.fallback];
    }
    // 'auto' (Smart Task Router):
    if (taskType === 'RULE_AUDIT' || taskType === 'COMPLEX_TACTICAL') {
      const cfg = this.AI_TASK_ROUTING.RULE_AUDIT;
      return [cfg.primary, cfg.fallback];
    }
    if (taskType === 'IMPORT_BATCH') {
      const cfg = this.AI_TASK_ROUTING.IMPORT_BATCH;
      return [cfg.primary, cfg.fallback];
    }
    // Default fast retrieval (QUICK_SEARCH, LEVEL_UP, etc.)
    const cfg = this.AI_TASK_ROUTING.QUICK_SEARCH;
    return [cfg.primary, cfg.fallback];
  },

  async getAvailableGeminiModels(apiKey, forceRefresh = false, taskType = 'DEFAULT') {
    const defaultPair = this.getModelsForTask(taskType);
    if (!apiKey) return defaultPair;

    const cacheKey = `${taskType}_${this.getAiModelMode()}`;
    if (!forceRefresh && this._cachedTaskModels && this._cachedTaskModels[cacheKey]) {
      return this._cachedTaskModels[cacheKey];
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
        signal: controller.signal
      });
      clearTimeout(timer);

      if (resp.ok) {
        const data = await resp.json();
        const apiModels = (data.models || [])
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
                   !lower.includes('lite') &&
                   !lower.includes('omni') &&
                   !lower.includes('gemma');
          });

        function parseVersion(name) {
          const match = (name || '').match(/gemini-(\d+(?:\.\d+)?)-/i);
          return match ? parseFloat(match[1]) : 0.0;
        }

        const isPro = (this.getAiModelMode() === 'pro') || 
          (this.getAiModelMode() === 'auto' && (taskType === 'RULE_AUDIT' || taskType === 'COMPLEX_TACTICAL'));

        if (taskType === 'IMPORT_BATCH' && this.getAiModelMode() === 'auto') {
          const flashModels = apiModels.filter(m => m.toLowerCase().includes('flash')).sort((a, b) => parseVersion(b) - parseVersion(a));
          const proModels = apiModels.filter(m => m.toLowerCase().includes('pro')).sort((a, b) => parseVersion(b) - parseVersion(a));
          const primary = flashModels[0] || defaultPair[0];
          const fallback = proModels[0] || defaultPair[1];
          const resultPair = [primary, fallback];
          if (!this._cachedTaskModels) this._cachedTaskModels = {};
          this._cachedTaskModels[cacheKey] = resultPair;
          return resultPair;
        }

        const relevant = isPro
          ? apiModels.filter(m => m.toLowerCase().includes('pro'))
          : apiModels.filter(m => m.toLowerCase().includes('flash'));

        // Sürüm numarasına göre büyükten küçüğe sırala (Örn: 3.8 > 3.7 > 3.5 > ...)
        relevant.sort((a, b) => parseVersion(b) - parseVersion(a));

        const primary = relevant[0] || defaultPair[0];
        const fallback = relevant[1] || relevant.find(m => m !== primary) || defaultPair[1];

        const resultPair = [primary, fallback];
        if (!this._cachedTaskModels) this._cachedTaskModels = {};
        this._cachedTaskModels[cacheKey] = resultPair;
        return resultPair;
      }
    } catch (e) {
      console.warn('API model list discovery skipped:', e.message);
    }

    return defaultPair;
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
      this._cachedModels = null;
    } else {
      localStorage.setItem('gemini_api_key', key.trim());
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

    // Verified Canonical Entries
    'cleave': {
      name: 'Cleave',
      type: 'Feat',
      slot: 'None',
      parent: '-',
      source: 'PHB p.92',
      prereq: 'Str 13, Power Attack.',
      benefit: 'Prerequisites: Str 13, Power Attack. Benefit: If you deal a creature enough damage to make it drop (typically by dropping it to below 0 hit points or killing it), you get an immediate, extra melee attack against another creature in the immediate vicinity. The extra attack is with the same weapon and at the same bonus as the attack that dropped the previous creature. You can use this ability once per round.',
      bonusType: 'Untyped',
      scope: 'Melee Only',
      action: 'Free Action',
      duration: 'Passive',
      role: 'Offense / Cleave',
      weight: 0,
      cost: 0
    },
    'great cleave': {
      name: 'Great Cleave',
      type: 'Feat',
      slot: 'None',
      parent: '-',
      source: 'PHB p.94',
      prereq: 'Str 13, Cleave, Power Attack, base attack bonus +4.',
      benefit: 'Prerequisites: Str 13, Cleave, Power Attack, BAB +4. Benefit: This feat works like Cleave, except that there is no limit in the number of times you can use it per round.',
      bonusType: 'Untyped',
      scope: 'Melee Only',
      action: 'Free Action',
      duration: 'Passive',
      role: 'Offense / Cleave',
      weight: 0,
      cost: 0
    },
    'power attack': {
      name: 'Power Attack',
      type: 'Feat',
      slot: 'None',
      parent: '-',
      source: 'PHB p.98',
      prereq: 'Str 13.',
      benefit: 'Prerequisites: Str 13. Benefit: On your action, before making attack rolls for a round, you may choose to subtract a number from all melee attack rolls and add the same number to all melee damage rolls. This number may not exceed your base attack bonus. The penalty on attacks and bonus on damage apply until your next turn. If you attack with a two-handed weapon, add twice the number subtracted.',
      bonusType: 'Untyped',
      scope: 'Melee Only',
      action: 'Free Action',
      duration: '1 round',
      role: 'Offense / Power Attack',
      weight: 0,
      cost: 0
    },
    'weapon finesse': {
      name: 'Weapon Finesse',
      type: 'Feat',
      slot: 'None',
      parent: '-',
      source: 'PHB p.102',
      prereq: 'Base attack bonus +1.',
      benefit: 'Prerequisites: BAB +1. Benefit: With a light weapon, rapier, whip, or spiked chain made for a creature of your size category, you may use your Dexterity modifier instead of your Strength modifier on attack rolls. If you carry a shield, its armor check penalty applies to your attack rolls.',
      bonusType: 'Untyped',
      scope: 'Melee Only',
      action: 'Passive',
      duration: 'Continuous',
      role: 'Offense / Attack',
      weight: 0,
      cost: 0
    },
    'shock trooper': {
      name: 'Shock Trooper',
      type: 'Feat',
      slot: 'None',
      parent: '-',
      source: 'Complete Warrior p.112',
      prereq: 'Base attack bonus +6, Improved Bull Rush, Power Attack.',
      benefit: 'Prerequisites: BAB +6, Improved Bull Rush, Power Attack. Tactical Feat enabling Directed Bull Rush, Domino Rush (free trip on bull rush collision), and Heedless Charge (divert Power Attack attack penalty to Armor Class instead of attack rolls during a charge with a two-handed weapon).',
      bonusType: 'Untyped',
      scope: 'Melee Only',
      action: 'Passive / Tactical',
      duration: 'Continuous',
      role: 'Offense / Tactical',
      weight: 0,
      cost: 0
    },
    'shadow blade': {
      name: 'Shadow Blade',
      type: 'Feat',
      slot: 'None',
      parent: '-',
      source: 'ToB p.32',
      prereq: 'One Shadow Hand stance.',
      benefit: 'Prerequisites: One Shadow Hand stance. Benefit: While you are in a Shadow Hand stance and attack with one of the discipline\'s preferred weapons (dagger, short sword, sai, siangham, unarmed strike, spiked chain), you can add your Dexterity modifier as a bonus on damage rolls.',
      bonusType: 'Untyped',
      scope: 'Melee Only',
      action: 'Passive',
      duration: 'Continuous',
      role: 'Offense / Damage',
      weight: 0,
      cost: 0
    },
    'leap attack': {
      name: 'Leap Attack',
      type: 'Feat',
      slot: 'None',
      parent: '-',
      source: 'Complete Adventurer p.110',
      prereq: 'Jump 8 ranks, Power Attack.',
      benefit: 'Prerequisites: Jump 8 ranks, Power Attack. Benefit: If you cover at least 10 feet of horizontal distance with your jump, and you end your jump in an adjacent square to your target and attack as part of a charge, you deal double the normal extra damage from Power Attack (triple if using a two-handed weapon).',
      bonusType: 'Untyped',
      scope: 'Melee Only',
      action: 'Full-Round Action (Charge)',
      duration: 'Instantaneous',
      role: 'Offense / Charge',
      weight: 0,
      cost: 0
    },
    'haste': {
      name: 'Haste',
      type: 'Spell',
      slot: 'None',
      parent: '-',
      source: 'PHB p.239',
      level: 3,
      school: 'Transmutation',
      action: '1 standard action',
      duration: '1 round/level',
      range: 'Close (25 ft. + 5 ft./2 levels)',
      benefit: 'Targets receive +1 attack bonus, +1 dodge AC, +1 Reflex save, +30 ft enhancement bonus to base speed, and 1 extra attack when making a full attack.',
      bonusType: 'Dodge',
      scope: 'All Attacks',
      attBonus: 1,
      acBonus: 1,
      refBonus: 1,
      speedBonus: 30,
      weight: 0,
      cost: 0
    },
    'mountain hammer': {
      name: 'Mountain Hammer',
      type: 'Maneuver',
      slot: 'None',
      parent: '-',
      source: 'ToB p.84',
      level: 2,
      discipline: 'Stone Dragon',
      action: '1 standard action',
      duration: 'Instantaneous',
      extraDmg: '+2d6',
      dice: '+2d6',
      benefit: 'Stone Dragon (Strike). As part of this maneuver, you make a single melee attack. If your attack hits, you deal an extra 2d6 points of damage and your attack automatically overcomes damage reduction and hardness.',
      bonusType: 'Untyped',
      scope: 'Melee Only',
      weight: 0,
      cost: 0
    }
  },

  entryToRow(entry) {
    return [
      entry.name || '',
      entry.type || 'Feat',
      entry.slot || 'None',
      entry.parent || '-',
      entry.source || 'PHB',
      entry.benefit || entry.description || '',
      entry.bonusType || 'Untyped',
      entry.scope || 'None / General',
      entry.strBonus || 0,
      entry.dexBonus || 0,
      entry.conBonus || 0,
      entry.intBonus || 0,
      entry.wisBonus || 0,
      entry.chaBonus || 0,
      entry.acBonus || 0,
      entry.hpBonus || 0,
      entry.attBonus || 0,
      entry.dmgBonus || 0,
      entry.fortBonus || 0,
      entry.refBonus || 0,
      entry.willBonus || 0,
      entry.skillBonus || 0,
      entry.initBonus || 0,
      entry.speedBonus || 0,
      entry.extraDmg || entry.dice || '',
      entry.action || 'Passive',
      entry.duration || 'Continuous',
      entry.weight || 0,
      entry.cost || 0
    ];
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

  // Normalize any AI or raw payload object into canonical Master_DB 29-column + child entry
  normalizeEntry(raw, isRowArray = false) {
    if (!raw) return null;
    let entry = {};

    if (isRowArray && Array.isArray(raw)) {
      // Legacy 29-column row fallback
      let rawName = String(raw[0] || '').trim();
      let parentVal = String(raw[3] || '-').trim();
      if (parentVal === '-' || parentVal === '') parentVal = '-';
      else parentVal = this.cleanArrow(parentVal);

      const isChild = (parentVal !== '-') || /^[\u21B3\u2192\u00E2\u2020\u00B3\?]/.test(rawName);
      const cleanName = this.cleanArrow(rawName);
      rawName = isChild ? this.formatChildName(cleanName) : cleanName;

      const cat = String(raw[1] || 'Feat').trim();
      let normType = cat;
      const catLower = cat.toLowerCase();
      if (catLower.includes('weapon')) normType = 'Weapon';
      else if (catLower.includes('shield')) normType = 'Shield';
      else if (catLower.includes('armor')) normType = 'Armor';
      else if (catLower.includes('spell')) normType = 'Spell';
      else if (catLower.includes('maneuver')) normType = 'Maneuver';
      else if (catLower.includes('stance')) normType = 'Stance';
      else if (catLower.includes('potion')) normType = 'Potion';
      else if (catLower.includes('scroll')) normType = 'Scroll';
      else if (catLower.includes('wand')) normType = 'Wand';
      else if (catLower.includes('consumable')) normType = 'Consumable';
      else if (catLower.includes('wondrous')) normType = 'Wondrous Item';
      else if (catLower.includes('ring')) normType = 'Ring';

      let diceVal = String(raw[24] || '').trim();
      const cleanDiceMatch = diceVal.match(/(\d+d\d+(?:\s*[\+\-]\s*\d+)?)/i);
      const cleanDice = cleanDiceMatch ? cleanDiceMatch[1].replace(/\s+/g, '') : (diceVal || (normType === 'Weapon' ? '1d8' : ''));

      entry = {
        name: this.capitalizeTitle(rawName),
        type: this.capitalizeIdentifier(normType),
        slot: this.capitalizeIdentifier(String(raw[2] || 'None').trim()),
        parent: parentVal,
        source: String(raw[4] || 'Core 3.5e').trim(),
        benefit: String(raw[5] || '').trim(),
        description: String(raw[5] || '').trim(),
        bonusType: this.capitalizeIdentifier(String(raw[6] || 'Untyped').trim()),
        scope: this.capitalizeIdentifier(String(raw[7] || 'None / General').trim()),
        strBonus: Number(raw[8]) || '',
        dexBonus: Number(raw[9]) || '',
        conBonus: Number(raw[10]) || '',
        intBonus: Number(raw[11]) || '',
        wisBonus: Number(raw[12]) || '',
        chaBonus: Number(raw[13]) || '',
        acBonus: Number(raw[14]) || '',
        hpBonus: Number(raw[15]) || '',
        attBonus: Number(raw[16]) || '',
        dmgBonus: Number(raw[17]) || '',
        fortBonus: Number(raw[18]) || '',
        refBonus: Number(raw[19]) || '',
        willBonus: Number(raw[20]) || '',
        skillBonus: Number(raw[21]) || '',
        clBonus: '',
        speedBonus: Number(raw[23]) || '',
        extraDmg: cleanDice,
        dice: cleanDice,
        damageDice: cleanDice,
        critMin: 20,
        critMult: 2,
        dmgType: '',
        action: String(raw[25] || 'Passive').trim(),
        actionType: this.deriveActionType(raw[25], normType),
        duration: String(raw[26] || 'Continuous').trim(),
        weight: Number(raw[27]) || 0,
        cost: Number(raw[28]) || 0,
        role: isChild ? 'Secondary Power' : 'General',
        prereq: '-',
        discipline: '-',
        school: '-',
        level: '',
        tags: [normType.toLowerCase()],
        isChild: isChild
      };
    } else {
      // Full JSON Object from Gemini
      let rawName = String(raw.name || '').trim();
      let parentVal = String(raw.parent || '-').trim();
      if (parentVal === '-' || parentVal === '') parentVal = '-';
      else parentVal = this.cleanArrow(parentVal);

      const isChild = Boolean(raw.isChild) || (parentVal !== '-') || /^[\u21B3\u2192\u00E2\u2020\u00B3\?]/.test(rawName);
      const cleanName = this.cleanArrow(rawName);
      rawName = isChild ? this.formatChildName(cleanName) : cleanName;

      const rawType = String(raw.type || raw.category || 'Feat').trim();
      let normType = rawType;
      const typeLower = rawType.toLowerCase();
      if (typeLower.includes('weapon')) normType = 'Weapon';
      else if (typeLower.includes('shield')) normType = 'Shield';
      else if (typeLower.includes('armor')) normType = 'Armor';
      else if (typeLower.includes('spell')) normType = 'Spell';
      else if (typeLower.includes('maneuver')) normType = 'Maneuver';
      else if (typeLower.includes('stance')) normType = 'Stance';
      else if (typeLower.includes('potion')) normType = 'Potion';
      else if (typeLower.includes('scroll')) normType = 'Scroll';
      else if (typeLower.includes('wand')) normType = 'Wand';
      else if (typeLower.includes('consumable')) normType = 'Consumable';
      else if (typeLower.includes('wondrous')) normType = 'Wondrous Item';
      else if (typeLower.includes('ring')) normType = 'Ring';

      let diceVal = String(raw.dice || raw.damageDice || raw.extraDmg || '').trim();
      const cleanDiceMatch = diceVal.match(/(\d+d\d+(?:\s*[\+\-]\s*\d+)?)/i);
      const cleanDice = cleanDiceMatch ? cleanDiceMatch[1].replace(/\s+/g, '') : (diceVal || (normType === 'Weapon' ? '1d8' : ''));

      let critMinVal = Number(raw.critMin);
      if (isNaN(critMinVal) || critMinVal < 10 || critMinVal > 20) critMinVal = 20;

      let critMultVal = Number(raw.critMult);
      if (isNaN(critMultVal) || critMultVal < 2 || critMultVal > 5) critMultVal = 2;

      let levelVal = raw.level;
      if (levelVal !== undefined && levelVal !== null && String(levelVal).trim() !== '' && String(levelVal).trim() !== '-') {
        levelVal = Number(levelVal);
        if (isNaN(levelVal)) levelVal = '';
      } else {
        levelVal = '';
      }

      const tags = Array.isArray(raw.tags) ? raw.tags.map(t => String(t).trim().toLowerCase()) : [normType.toLowerCase()];
      if (isChild && !tags.includes('child')) tags.push('child');
      if (normType && !tags.includes(normType.toLowerCase())) tags.push(normType.toLowerCase());

      const rawAction = String(raw.action || 'Passive').trim();
      const rawActionType = raw.actionType || this.deriveActionType(rawAction, normType);

      entry = {
        name: this.capitalizeTitle(rawName),
        type: this.capitalizeIdentifier(normType),
        slot: this.capitalizeIdentifier(String(raw.slot || 'None').trim()),
        parent: parentVal,
        source: String(raw.source || 'Core 3.5e').trim(),
        benefit: String(raw.benefit || raw.description || '').trim(),
        description: String(raw.description || raw.benefit || '').trim(),
        bonusType: this.capitalizeIdentifier(String(raw.bonusType || 'Untyped').trim()),
        scope: this.capitalizeIdentifier(String(raw.scope || 'None / General').trim()),
        strBonus: Number(raw.strBonus) || '',
        dexBonus: Number(raw.dexBonus) || '',
        conBonus: Number(raw.conBonus) || '',
        intBonus: Number(raw.intBonus) || '',
        wisBonus: Number(raw.wisBonus) || '',
        chaBonus: Number(raw.chaBonus) || '',
        acBonus: Number(raw.acBonus) || '',
        hpBonus: Number(raw.hpBonus) || '',
        attBonus: Number(raw.attBonus) || '',
        dmgBonus: Number(raw.dmgBonus) || '',
        fortBonus: Number(raw.fortBonus) || '',
        refBonus: Number(raw.refBonus) || '',
        willBonus: Number(raw.willBonus) || '',
        skillBonus: Number(raw.skillBonus) || '',
        clBonus: Number(raw.clBonus) || '',
        speedBonus: Number(raw.speedBonus) || '',
        extraDmg: cleanDice,
        dice: cleanDice,
        damageDice: cleanDice,
        critMin: critMinVal,
        critMult: critMultVal,
        dmgType: String(raw.dmgType || '').trim(),
        action: rawAction,
        actionType: rawActionType,
        duration: String(raw.duration || 'Continuous').trim(),
        weight: Number(raw.weight) || 0,
        cost: Number(raw.cost) || 0,
        role: String(raw.role || (isChild ? 'Secondary Power' : (normType === 'Spell' ? 'Offense / Spell' : (normType === 'Maneuver' ? 'Offense / Strike' : (normType === 'Stance' ? 'Tactical / Stance' : 'General'))))).trim(),
        prereq: String(raw.prereq || '-').trim(),
        discipline: String(raw.discipline || '-').trim(),
        school: String(raw.school || '-').trim(),
        level: levelVal,
        tags: tags,
        range: String(raw.range || '-').trim(),
        isChild: isChild,
        effectType: raw.effectType || (isChild ? 'damage' : undefined),
        childButtonLabel: raw.childButtonLabel ? String(raw.childButtonLabel).trim() : undefined,
        selfHpCost: Number(raw.selfHpCost) || undefined,
        unitLabel: raw.unitLabel ? String(raw.unitLabel).trim() : undefined,
        // Modern declarative rule engine fields
        ruleFlags: (raw.ruleFlags && typeof raw.ruleFlags === 'object') ? JSON.parse(JSON.stringify(raw.ruleFlags)) : undefined,
        combatModifiers: (raw.combatModifiers && typeof raw.combatModifiers === 'object') ? JSON.parse(JSON.stringify(raw.combatModifiers)) : undefined,
        skillBonuses: (raw.skillBonuses && typeof raw.skillBonuses === 'object') ? JSON.parse(JSON.stringify(raw.skillBonuses)) : undefined,
        sizeModifier: (raw.sizeModifier && typeof raw.sizeModifier === 'object') ? JSON.parse(JSON.stringify(raw.sizeModifier)) : undefined,
        isLight: raw.isLight !== undefined ? Boolean(raw.isLight) : undefined,
        proficiency: raw.proficiency ? String(raw.proficiency).trim() : undefined,
        size: raw.size ? String(raw.size).trim() : (normType === 'Race' ? 'Medium' : undefined),
        baseSpeed: Number(raw.baseSpeed) || (normType === 'Race' ? 30 : undefined),
        favoredClass: raw.favoredClass ? String(raw.favoredClass).trim() : (normType === 'Race' ? 'Any' : undefined),
        traits: Array.isArray(raw.traits) ? JSON.parse(JSON.stringify(raw.traits)) : (normType === 'Race' && (raw.benefit || raw.description) ? [{ name: 'Racial Traits', desc: String(raw.benefit || raw.description) }] : undefined),
        languages: Array.isArray(raw.languages) ? JSON.parse(JSON.stringify(raw.languages)) : (normType === 'Race' ? ['Common'] : undefined),
        bonusFeats: raw.bonusFeats !== undefined ? Number(raw.bonusFeats) : undefined,
        isFighterBonusFeat: raw.isFighterBonusFeat !== undefined ? Boolean(raw.isFighterBonusFeat) : (raw.category === 'Fighter' ? true : undefined),
        finessable: raw.finessable !== undefined ? Boolean(raw.finessable) : undefined,
        pantheon: raw.pantheon ? String(raw.pantheon).trim() : undefined,
        alignment: raw.alignment ? String(raw.alignment).trim() : undefined,
        favoredWeapon: raw.favoredWeapon ? String(raw.favoredWeapon).trim() : undefined,
        domains: Array.isArray(raw.domains) ? JSON.parse(JSON.stringify(raw.domains)) : undefined,
        symbol: raw.symbol ? String(raw.symbol).trim() : undefined
      };
    }

    if (entry.isChild) {
      if (!entry.role || entry.role === 'General') entry.role = 'Secondary Power';
      if (!entry.childButtonLabel && entry.name) {
        const afterArrow = this.cleanArrow(entry.name);
        const parenMatch = afterArrow.match(/\(([^)]+)\)/);
        entry.childButtonLabel = parenMatch ? parenMatch[1].trim() : afterArrow;
      }
    }

    return entry;
  },

  async fetchSingleAiRuleObjects(query, categoryHint, apiKey, statusTextEl = null) {
    const promptText = `You are a master D&D 3.5e Rule Arbiter and Database Architect.
User query: "${query}" (Category Hint: "${categoryHint}").

${this.DND35_RAW_GUARDRAIL}

CRITICAL D&D 3.5E ANTI-HALLUCINATION & CANONICAL VERIFICATION RULES:
0. RACE SCHEMA (FOR D&D 3.5E RACES / RACIAL TEMPLATES):
If categoryHint is 'Race' or querying a Race (e.g. Warforged, Goliath, Drow, Catfolk, Thri-Kreen, Kenku, Illumian), return canonical D&D 3.5e Race object with type: "Race", size ("Medium"|"Small"|"Large"), baseSpeed (number, e.g. 30), strBonus/dexBonus/conBonus/intBonus/wisBonus/chaBonus (numbers), favoredClass, source (official 3.5e book and page), benefit, description, and traits: [{"name": "Trait Name", "desc": "Detailed mechanics"}], languages: ["Common", ...], bonusFeats (number).
0.1 DEITY SCHEMA (FOR D&D 3.5E DEITIES / GODS / PANTEONS):
If categoryHint is 'Deity' or querying a Deity/God/Pantheon (e.g. Kelemvor, Mystra, Tempus, Bane, Lolth, Asmodeus, Helm, Sune, Morwel, Pelor, Kord, Moradin):
Return canonical D&D 3.5e Deity object with type: "Deity", name, title (e.g. "Lord of the Dead"), pantheon ("Faerûn / Forgotten Realms", "Greyhawk", "Eberron", etc.), alignment (e.g. "Lawful Neutral"), favoredWeapon (e.g. "Bastard sword"), domains: ["Death", "Fate", "Law"], symbol, description (canonical 3.5e lore and dogma summary), source (official 3.5e book and page, e.g. "Complete Divine p.120" or "Player's Handbook p.106").

0.2 FEAT SCHEMA (FOR D&D 3.5E FEATS):
If categoryHint is 'Feat' or querying a Feat:
Return canonical D&D 3.5e Feat object with type: "Feat", name, prereq, benefit, description, source (official 3.5e book and page), featType ("General"|"Item Creation"|"Metamagic"|"Special"), and boolean "isFighterBonusFeat": true if the feat can be selected as a Fighter bonus feat according to D&D 3.5e RAW (PHB Table 5-1 / p.90).

1. STRICT REAL RAW 3.5E RULES ONLY:
NEVER fabricate, invent, or hallucinate a rule, feat, spell, magic item, or book source. Every result MUST exist in official Wizards of the Coast D&D 3.5e publications.
2. MANDATORY TYPO / FUZZY SPELLING CORRECTION:
User input frequently contains typos or phonetic misspellings (e.g. "clave" -> "Cleave", "gret cleve" -> "Great Cleave", "power atac" -> "Power Attack", "shok trooper" -> "Shock Trooper", "flometong" -> "Flametongue", "hast" -> "Haste", "moutain hamer" -> "Mountain Hammer").
You MUST recognize the intended canonical element and output the real, correct official D&D 3.5e element!
3. PARENT & CONDITIONAL CHILD VARIANTS (CRITICAL FOR COMBAT / TOAST / SPELL VARIATIONS):
When querying an item, spell, maneuver, or feat with conditional variants, sub-effects, or multi-modes (e.g. Searing Light vs Undead / Construct, Blade of Blood with self-damage, Pyrotechnics fireworks vs smoke, Energy Substitution elements, Boots of Speed active mode), return BOTH:
- The primary parent item with all base attributes
- 1 or more Child objects starting with '\\u21B3 ' (e.g. '\\u21B3 Searing Light (Undead)') with "parent" set to the exact parent entry name, "isChild": true, "dice": clean condition dice formula, and appropriate "effectType" ('damage', 'heal', 'duration', 'status', 'blood_sacrifice_roll') and "childButtonLabel" (e.g. 'Undead (6d6)').
4. SIZE MODIFIERS & WEAPON/CREATURE SCALING (CRITICAL FOR D&D 3.5E RAW):
If a spell, feat, or item alters weapon damage size category or creature size (e.g. Greater Mighty Wallop, Mighty Wallop, Lead Blades, Enlarge Person, Righteous Might, Impact property), include the declarative 'sizeModifier' object:
"sizeModifier": {
  "targetType": "weapon" | "creature",
  "targetFilter": { "meleeOnly": true, "allowedDmgTypes": ["Bludgeoning"] },
  "scaling": { "type": "per_caster_level" | "flat", "clDivisor": 4, "maxSteps": 5, "capSize": "Colossal", "steps": 1 }
}

JSON OUTPUT SPECIFICATION:
Return valid JSON only matching this schema:
{
  "entries": [
    {
      "name": "Searing Light",
      "type": "Spell",
      "level": 3,
      "school": "Evocation",
      "discipline": "-",
      "slot": "None",
      "parent": "-",
      "source": "Player's Handbook v.3.5, p. 275",
      "benefit": "Ray deals 1d8/2 levels (max 5d8) to living creatures; 1d6/level (max 10d6) to undead; 1d8/level (max 10d8) to undead vulnerable to bright light; 1d6/2 levels (max 5d6) to constructs.",
      "description": "Ray deals 1d8/2 levels (max 5d8) to living creatures; 1d6/level (max 10d6) to undead; 1d8/level (max 10d8) to undead vulnerable to bright light; 1d6/2 levels (max 5d6) to constructs.",
      "bonusType": "Untyped",
      "scope": "Target: Ray",
      "range": "Medium (100 ft. + 10 ft./level)",
      "strBonus": 0,
      "dexBonus": 0,
      "conBonus": 0,
      "intBonus": 0,
      "wisBonus": 0,
      "chaBonus": 0,
      "acBonus": 0,
      "hpBonus": 0,
      "attBonus": 0,
      "dmgBonus": 0,
      "fortBonus": 0,
      "refBonus": 0,
      "willBonus": 0,
      "skillBonus": 0,
      "clBonus": 0,
      "speedBonus": 0,
      "dice": "3d8",
      "damageDice": "3d8",
      "critMin": 20,
      "critMult": 2,
      "dmgType": "Untyped / Divine Light",
      "action": "Standard Action",
      "duration": "Instantaneous",
      "weight": 0,
      "cost": 0,
      "role": "Offense / Spell",
      "prereq": "-",
      "tags": ["spell", "evocation", "divine"],
      "isChild": false
    },
    {
      "name": "\\u21B3 Searing Light (Undead)",
      "type": "Spell",
      "level": 3,
      "school": "Evocation",
      "discipline": "-",
      "slot": "None",
      "parent": "Searing Light",
      "source": "Player's Handbook v.3.5, p. 275",
      "benefit": "Deals 1d6 per caster level (max 10d6) to undead creatures.",
      "description": "Deals 1d6 per caster level (max 10d6) to undead creatures.",
      "bonusType": "Untyped",
      "scope": "Target: Undead",
      "range": "Medium (100 ft. + 10 ft./level)",
      "dice": "6d6",
      "damageDice": "6d6",
      "critMin": 20,
      "critMult": 2,
      "dmgType": "Untyped / Divine Light",
      "action": "Standard Action",
      "duration": "Instantaneous",
      "role": "Secondary Power",
      "isChild": true,
      "effectType": "damage",
      "childButtonLabel": "Undead (6d6)"
    }
  ]
}`;

    const availableModels = await this.getAvailableGeminiModels(apiKey, false, 'QUICK_SEARCH');
    let lastError = null;

    for (const model of availableModels) {
      if (statusTextEl) {
        statusTextEl.textContent = `"${query}" ➔ ${model} sorgulanıyor...`;
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7500);

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

              const normalizedEntries = [];
              rawList.forEach(rawItem => {
                const isArrayRow = Array.isArray(rawItem);
                const norm = this.normalizeEntry(rawItem, isArrayRow);
                if (norm && norm.name) {
                  normalizedEntries.push(norm);
                }
              });

              if (normalizedEntries.length > 0) {
                return normalizedEntries;
              }
            } catch (pErr) {
              lastError = `JSON Çözümleme hatası (${model}): ${pErr.message}`;
            }
          }
        } else {
          const errJson = await response.json().catch(() => ({}));
          lastError = errJson.error?.message || `HTTP ${response.status} (${model})`;
        }
      } catch (netErr) {
        clearTimeout(timeoutId);
        if (netErr && netErr.name === 'AbortError') {
          lastError = `Zaman aşımı (7.5s) - ${model} yanıt vermedi.`;
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
    if (!entry) return [];
    if (Array.isArray(entry) && entry.name) return entry;
    // Map canonical 29-column row array
    const row = [
      entry.name || '',                             // 0
      entry.type || 'Feat',                         // 1
      entry.slot || 'None',                         // 2
      entry.parent || '-',                          // 3
      entry.source || 'Core 3.5e',                  // 4
      entry.benefit || entry.description || '',     // 5
      entry.bonusType || 'Untyped',                 // 6
      entry.scope || 'None / General',              // 7
      entry.strBonus ?? '',                         // 8
      entry.dexBonus ?? '',                         // 9
      entry.conBonus ?? '',                         // 10
      entry.intBonus ?? '',                         // 11
      entry.wisBonus ?? '',                         // 12
      entry.chaBonus ?? '',                         // 13
      entry.acBonus ?? '',                          // 14
      entry.hpBonus ?? '',                          // 15
      entry.attBonus ?? '',                         // 16
      entry.dmgBonus ?? '',                         // 17
      entry.fortBonus ?? '',                        // 18
      entry.refBonus ?? '',                         // 19
      entry.willBonus ?? '',                        // 20
      entry.skillBonus ?? '',                       // 21
      entry.clBonus ?? '',                          // 22
      entry.speedBonus ?? '',                       // 23
      entry.dice || entry.extraDmg || '',           // 24
      entry.action || 'Passive',                    // 25
      entry.duration || 'Continuous',               // 26
      entry.weight ?? 0,                            // 27
      entry.cost ?? 0                               // 28
    ];
    // Attach all object properties directly onto the array row for complete compatibility
    Object.assign(row, entry);
    return row;
  },

  async fetchSingleAiRuleRows(query, categoryHint, apiKey, statusTextEl = null) {
    const entries = await this.fetchSingleAiRuleObjects(query, categoryHint, apiKey, statusTextEl);
    return (entries || []).map(e => this.entryToRow(e));
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

    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('Gemini API Anahtarı bulunamadı.');
      this.promptApiKey();
      return;
    }

    const rawQueries = input.value.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    if (!rawQueries.length) return;

    const items = [...new Set(rawQueries)];
    if (!confirm(`Toplam ${items.length} adet farklı kural tek tek Gemini AI ile aranıp Master DB'ye eklenecek. Devam edilsin mi?`)) {
      return;
    }

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
            const parentName = (entry.parent && entry.parent !== '-') ? this.cleanArrow(entry.parent).toLowerCase() : '';
            const parentIdx = parentName ? masterDb.findIndex(m => this.cleanArrow(m.name).toLowerCase() === parentName) : -1;
            if (parentIdx >= 0) {
              let insertAt = parentIdx + 1;
              while (insertAt < masterDb.length && this.cleanArrow(masterDb[insertAt].parent).toLowerCase() === parentName) {
                insertAt++;
              }
              masterDb.splice(insertAt, 0, entry);
            } else {
              masterDb.push(entry);
            }
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
    alert(`🎉 Toplu İçe Aktarma Tamamlandı!\n${totalImported} adet kural ve alt güç başarıyla Master_DB'ye eklendi.`);
  },

  getChildrenForEntry(item, sourceList = null) {
    if (!item || !item.name) return [];
    const list = Array.isArray(sourceList) ? sourceList : (Array.isArray(masterDb) ? masterDb : []);
    const cleanPName = this.cleanArrow(item.name).toLowerCase();
    const seenTitles = new Set();

    return list.filter(other => {
      if (!other || other === item) return false;
      const otherParent = this.cleanArrow(other.parent || '').toLowerCase();
      let isMatch = false;
      if (otherParent && otherParent !== '-' && otherParent === cleanPName) {
        isMatch = true;
      }
      if (!isMatch) {
        const otherName = this.cleanArrow(other.name || '').toLowerCase();
        const isOtherChild = other.isChild || (other.parent && other.parent !== '-') || this.cleanArrow(other.name) !== (other.name || '').trim();
        if (isOtherChild && (otherName.startsWith(cleanPName) || (other.parent && this.cleanArrow(other.parent).toLowerCase() === cleanPName))) {
          isMatch = true;
        }
      }
      if (!isMatch) return false;
      const childKey = this.cleanArrow(other.name || '').toLowerCase();
      if (seenTitles.has(childKey)) return false;
      seenTitles.add(childKey);
      return true;
    });
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
          <span class="text-[11px] text-slate-400 block sm:inline sm:ml-2">Master_DB 29 sütunlu JSON şemasıyla tam uyumlu</span>
        </div>
        <button onclick="RuleMaster.addAllAiResultsToDb()" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow transition flex items-center gap-1.5">
          <span>📥</span>
          <span>Tümünü DB'ye Ekle</span>
        </button>
      </div>
      <div class="space-y-3">
    `;

    this.lastAiResults.forEach((item, idx) => {
      const isChild = item.isChild || (item.parent && item.parent !== '-');
      const children = this.getChildrenForEntry(item, this.lastAiResults);
      const isParent = !isChild && children.length > 0;
      const badgeClass = this.getTypeBadgeClass(item.type);
      const displayName = isChild ? this.cleanArrow(item.name) : item.name;

      // Stat badges
      const statPills = [];
      if (item.strBonus) statPills.push(`+${item.strBonus} STR`);
      if (item.dexBonus) statPills.push(`+${item.dexBonus} DEX`);
      if (item.conBonus) statPills.push(`+${item.conBonus} CON`);
      if (item.intBonus) statPills.push(`+${item.intBonus} INT`);
      if (item.wisBonus) statPills.push(`+${item.wisBonus} WIS`);
      if (item.chaBonus) statPills.push(`+${item.chaBonus} CHA`);
      if (item.acBonus) statPills.push(`+${item.acBonus} AC`);
      if (item.attBonus) statPills.push(`+${item.attBonus} Atk`);
      if (item.dmgBonus) statPills.push(`+${item.dmgBonus} Dmg`);
      if (item.speedBonus) statPills.push(`+${item.speedBonus} ft Hız`);
      if (item.extraDmg || item.dice) statPills.push(`⚔️ ${item.extraDmg || item.dice}`);

      // Specific badges (Level, School, Discipline, Child Button)
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
      if (item.childButtonLabel) {
        specificBadges.push(`<span class="badge bg-purple-900 text-purple-200 border border-purple-600 text-[10px] font-mono">Toast: ${item.childButtonLabel}</span>`);
      }
      html += `
        <div class="${isChild ? 'ml-6 border-l-4 border-l-purple-500 bg-slate-900/60' : (isParent ? 'bg-slate-900 border-purple-500/50 shadow-purple-950/20' : 'bg-slate-900')} border border-slate-800 rounded-xl p-4 space-y-3 shadow-md transition">
          <div class="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                ${isChild ? '<span class="text-purple-400 font-bold font-mono">↳</span>' : ''}
                <span class="text-sm font-extrabold text-white">${displayName}</span>
                <span class="badge ${badgeClass}">${item.type}</span>
                ${specificBadges.join(' ')}
                ${isParent ? `<span class="badge bg-purple-950 text-purple-200 border border-purple-600 text-[10px] font-bold">👑 Ana Eşya (${children.length} Alt Güç)</span>` : ''}
                ${isChild && item.parent && item.parent !== '-' ? `<span class="badge bg-purple-950 text-purple-300 border border-purple-800 font-mono text-[10px]">Bağlı: ${item.parent}</span>` : ''}
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                <span>📚 <b>${item.source || 'Core 3.5e'}</b></span>
                <span>•</span>
                <span>Yuva: <b>${item.slot || 'None'}</b></span>
                <span>•</span>
                <span>Tür: <b>${item.bonusType || 'Untyped'}</b></span>
                <span>•</span>
                <span>Kapsam: <b>${item.scope || 'None / General'}</b></span>
                ${item.range && item.range !== '-' ? `<span>•</span><span>Menzil: <b class="text-cyan-400">${item.range}</b></span>` : ''}
                ${item.dmgType ? `<span>•</span><span>Hasar Türü: <b class="text-rose-400">${item.dmgType}</b></span>` : ''}
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              ${isParent ? `
                <button onclick="RuleMaster.addAiResultToDb(${idx}, true)" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1" title="Ana eşyayı ve tüm ${children.length} alt gücünü tek seferde Master DB'ye ekler">
                  <span>📥</span>
                  <span>Tümünü DB'ye Ekle</span>
                </button>
                <button onclick="RuleMaster.equipAiResultToCharacter(${idx})" class="bg-purple-900 hover:bg-purple-800 border border-purple-600 text-purple-200 text-xs px-2.5 py-1.5 rounded-lg transition font-bold" title="Ana eşyayı ve alt güçlerini tek seferde kuşanır">
                  ⚡ Hepsini Kuşan
                </button>
              ` : (isChild ? `
                <span class="text-[11px] text-purple-300 bg-purple-950/80 border border-purple-700/60 rounded-lg px-2.5 py-1.5 font-medium flex items-center gap-1.5 shadow-sm" title="Alt güçler ana öğe (${item.parent || 'Parent'}) ile bir bütün olarak eklenir ve kuşanılır.">
                  <span>🔗</span>
                  <span>Ana Öğe ile Birlikte Eklenir</span>
                </span>
              ` : `
                <button onclick="RuleMaster.addAiResultToDb(${idx}, false)" class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1">
                  <span>📥</span>
                  <span>DB'ye Ekle</span>
                </button>
                <button onclick="RuleMaster.equipAiResultToCharacter(${idx})" class="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg transition" title="Karaktere Kuşan / Ekle">
                  ⚡ Kuşan
                </button>
              `)}
              <button onclick="RuleMaster.editAiResultInModal(${idx})" class="bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition" title="29 Sütunlu Formda Aç">
                ✏️ Düzenle
              </button>
            </div>
          </div>

          <!-- Modifiers Row -->
          ${statPills.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[10px] uppercase font-bold text-slate-400">Bonuslar & Zar:</span>
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">${p}</span>`).join('')}
            </div>
          ` : ''}

          <!-- Benefit / Description -->
          <div class="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
            ${item.benefit || item.description || 'Açıklama belirtilmemiş.'}
          </div>

          <!-- Footer Specs -->
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

  addAiResultToDb(index, includeChildren = true) {
    if (index >= 0 && index < this.lastAiResults.length) {
      let item = this.lastAiResults[index];
      const isChild = item.isChild || (item.parent && item.parent !== '-');

      // Parent-Child ilişkileri bütün olarak eklensin: Eğer bir alt güç (child) seçildiyse,
      // otomatik olarak ana öğesi bulunup tüm aile birlikte eklenir!
      if (isChild) {
        const pName = this.cleanArrow(item.parent || '').toLowerCase().trim();
        const pIdx = this.lastAiResults.findIndex(entry => this.cleanArrow(entry.name).toLowerCase().trim() === pName);
        if (pIdx >= 0) {
          index = pIdx;
          item = this.lastAiResults[pIdx];
        }
      }

      const itemsToAdd = [item];
      const children = this.getChildrenForEntry(item, this.lastAiResults);
      children.forEach(c => itemsToAdd.push(c));

      itemsToAdd.forEach(it => {
        const copy = JSON.parse(JSON.stringify(it));
        const existsIdx = masterDb.findIndex(m => (m.name || '').toLowerCase().trim() === (copy.name || '').toLowerCase().trim());
        if (existsIdx >= 0) {
          masterDb[existsIdx] = copy;
        } else {
          // If child, insert directly below parent in masterDb
          const parentName = (copy.parent && copy.parent !== '-') ? this.cleanArrow(copy.parent).toLowerCase() : '';
          const parentIdx = parentName ? masterDb.findIndex(m => this.cleanArrow(m.name).toLowerCase() === parentName) : -1;
          if (parentIdx >= 0) {
            let insertAt = parentIdx + 1;
            while (insertAt < masterDb.length && this.cleanArrow(masterDb[insertAt].parent).toLowerCase() === parentName) {
              insertAt++;
            }
            masterDb.splice(insertAt, 0, copy);
          } else {
            masterDb.push(copy);
          }
        }
      });

      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      this.renderTable();
      if (itemsToAdd.length > 1) {
        alert(`✅ "${item.name}" ve ${itemsToAdd.length - 1} alt gücü tek seferde başarıyla Master_DB kütüphanesine eklendi!`);
      } else {
        alert(`✅ "${item.name}" başarıyla Master_DB kütüphanesine eklendi!`);
      }
    }
  },

  addAllAiResultsToDb() {
    if (!this.lastAiResults.length) return;
    this.lastAiResults.forEach(item => {
      const copy = JSON.parse(JSON.stringify(item));
      const existsIdx = masterDb.findIndex(m => (m.name || '').toLowerCase().trim() === (copy.name || '').toLowerCase().trim());
      if (existsIdx >= 0) {
        masterDb[existsIdx] = copy;
      } else {
        const parentName = (copy.parent && copy.parent !== '-') ? this.cleanArrow(copy.parent).toLowerCase() : '';
        const parentIdx = parentName ? masterDb.findIndex(m => this.cleanArrow(m.name).toLowerCase() === parentName) : -1;
        if (parentIdx >= 0) {
          let insertAt = parentIdx + 1;
          while (insertAt < masterDb.length && this.cleanArrow(masterDb[insertAt].parent).toLowerCase() === parentName) {
            insertAt++;
          }
          masterDb.splice(insertAt, 0, copy);
        } else {
          masterDb.push(copy);
        }
      }
    });
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`✅ ${this.lastAiResults.length} kural ve alt güç tek seferde Master_DB kütüphanesine eklendi!`);
  },
  editAiResultInModal(index) {
    if (index >= 0 && index < this.lastAiResults.length) {
      const item = JSON.parse(JSON.stringify(this.lastAiResults[index]));
      this.openModalWithData(item, -1);
    }
  },

  equipAiResultToCharacter(index) {
    if (index >= 0 && index < this.lastAiResults.length) {
      let item = JSON.parse(JSON.stringify(this.lastAiResults[index]));
      const isChild = item.isChild || (item.parent && item.parent !== '-');
      if (isChild) {
        const pName = this.cleanArrow(item.parent || '').toLowerCase().trim();
        const pParent = this.lastAiResults.find(entry => this.cleanArrow(entry.name).toLowerCase().trim() === pName);
        if (pParent) item = JSON.parse(JSON.stringify(pParent));
      }
      this.equipItemWithChildren(item, this.lastAiResults);
    }
  },

  equipItem(item) {
    if (typeof character === 'undefined' || !character) return;
    const type = (item.type || '').toLowerCase();
    const cat = item.category || item.type || 'Other';

    // 1. Ensure item is placed in character.gearPool
    if (!character.gearPool) character.gearPool = [];
    let poolExisting = character.gearPool.find(p => (p.name || '').toLowerCase().trim() === (item.name || '').toLowerCase().trim());
    if (!poolExisting) {
      poolExisting = {
        id: Date.now(),
        name: item.name,
        masterDbName: item.name,
        category: cat,
        slot: item.slot && item.slot !== 'None' ? item.slot : cat,
        qty: 1,
        weight: Number(item.weight) || 0,
        cost: Number(item.cost) || 0,
        desc: item.benefit || item.description || '',
        isBelt: (item.slot || '').toLowerCase().includes('belt') || cat.toLowerCase().includes('consumable'),
        isEquipped: false
      };
      character.gearPool.push(poolExisting);
    }

    if (type === 'weapon') {
      if (!character.weapons) character.weapons = [];
      const isTwoHand = typeof RuleEngine !== 'undefined' && typeof RuleEngine.isTwoHandedWeapon === 'function' ? RuleEngine.isTwoHandedWeapon(item) : false;
      const hasOversized = typeof RuleEngine !== 'undefined' && typeof RuleEngine.hasOversizedWeaponFeat === 'function' ? RuleEngine.hasOversizedWeaponFeat(character) : false;

      const newWep = {
        name: item.name,
        grip: isTwoHand ? '2-Hand' : (item.slot === 'Off-Hand' ? 'Off-Hand' : '1-Hand'),
        dice: item.dice || item.extraDmg || '1d8',
        critMin: Number(item.critMin) || 20,
        critMult: Number(item.critMult) || 2,
        attBonus: Number(item.attBonus) || 0,
        dmgBonus: Number(item.dmgBonus) || 0,
        dmgType: item.dmgType || 'Slashing',
        bonusType: item.bonusType || 'Enhancement',
        extraDmg: item.extraDmg || '',
        tags: Array.isArray(item.tags) ? [...item.tags] : []
      };
      if (isTwoHand && !newWep.tags.includes('two-handed')) {
        newWep.tags.push('two-handed');
      }

      const existingWepIdx = character.weapons.findIndex(w => (w.name || '').toLowerCase() === item.name.toLowerCase());
      if (existingWepIdx >= 0) character.weapons[existingWepIdx] = newWep;
      else character.weapons.push(newWep);

      character.activeWeapon = item.name;
      if (poolExisting) poolExisting.isEquipped = true;

      let unequippedOffHandName = null;
      // Also equip to mainHand slot if available
      if (character.bodySlots) {
        if (isTwoHand && !hasOversized && character.bodySlots.offHand && character.bodySlots.offHand.name && character.bodySlots.offHand.name !== '-') {
          unequippedOffHandName = character.bodySlots.offHand.name;
          const pItem = (character.gearPool || []).find(p => p.name === unequippedOffHandName);
          if (pItem) pItem.isEquipped = false;
          character.bodySlots.offHand = { name: '-', active: false, weight: 0, cost: 0, desc: '' };
        }

        character.bodySlots.mainHand = {
          name: item.name,
          masterDbName: item.name,
          active: true,
          category: 'Weapon',
          weight: Number(item.weight) || 0,
          cost: Number(item.cost) || 0,
          desc: item.benefit || item.description || ''
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
          alert(`⚔️ "${item.name}" iki elli (Two-Handed) bir silahtır! 'Oversized Two-Weapon Fighting' veya 'Monkey Grip' feat'iniz olmadığı için iki elinizi de kaplar. İkinci elinizdeki "${unequippedOffHandName}" çıkarıldı.`);
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
        level: Number(item.level) || 1,
        name: item.name,
        school: item.school || 'Universal',
        action: item.action || 'Standard Action',
        range: item.range || 'Close',
        benefit: item.benefit || item.description || ''
      });
      alert(`🔮 "${item.name}" büyüsü bilinen büyülere (Spells Known) eklendi!`);
    } else if (type === 'maneuver') {
      if (!character.tomeOfBattle) character.tomeOfBattle = { initiatorLevel: 1, readiedManeuvers: [], stancesKnown: [] };
      if (!character.tomeOfBattle.readiedManeuvers) character.tomeOfBattle.readiedManeuvers = [];
      character.tomeOfBattle.readiedManeuvers.push({
        name: item.name,
        level: Number(item.level) || 1,
        discipline: item.discipline || 'Iron Heart',
        action: item.action || 'Standard Action',
        expended: false,
        notes: item.benefit || item.description || ''
      });
      alert(`⚔️ "${item.name}" manevrası kuşanılan manevralara eklendi!`);
    } else if (type === 'stance') {
      if (!character.tomeOfBattle) character.tomeOfBattle = { initiatorLevel: 1, readiedManeuvers: [], stancesKnown: [] };
      if (!character.tomeOfBattle.stancesKnown) character.tomeOfBattle.stancesKnown = [];
      character.tomeOfBattle.stancesKnown.push({
        name: item.name,
        discipline: item.discipline || 'Shadow Hand',
        level: Number(item.level) || 1,
        benefit: item.benefit || item.description || ''
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
          name: cleanName,
          category: 'Flaw',
          source: item.source || 'Unearthed Arcana',
          benefit: item.benefit || 'Kusur karşılığında 1 bonus feat kazandırır.'
        });
      }
      alert(`⚠️ "${item.name}" kusuru karaktere eklendi!\n\n🎖️ D&D 3.5e Unearthed Arcana kuralı gereğince bu kusur karşılığında 1 adet EKSTRA BONUS FEAT KAZANDINIZ!\n\nŞimdi bonus hünerinizi (Feat) seçmek için Feat Kütüphanesi açılıyor...`);
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
          name: cleanName,
          category: 'Racial Trait',
          source: item.source || 'PHB',
          benefit: item.benefit || ''
        });
      }
      if (item.grantsBonusFeat || cleanName.toLowerCase().includes('bonus feat')) {
        alert(`🧬 "${item.name}" ırksal yeteneği eklendi!\n\n🎖️ Bu yetenek 1 adet ekstra bonus feat kazandırmaktadır. Şimdi bonus featinizi seçebilirsiniz.`);
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
        name: item.name,
        qty: 1,
        effect: item.benefit || item.description || `${item.type || 'Consumable'} effect`
      });
      alert(`🧪 "${item.name}" (${item.type || 'Sarf Malzemesi'}) çantanıza eklendi!`);
    } else {
      // Body Slot Equipment (Armor, Shield, Wondrous Item, Ring, etc.)
      const rawSlot = (item.slot || '').toLowerCase().trim();
      const slotLower = (item.slot || item.category || '').toLowerCase();
      let slotKey = null;
      if (rawSlot === 'none' || rawSlot === 'slotless') {
        slotKey = null;
      } else if (slotLower.includes('armor') || slotLower.includes('zırh')) slotKey = 'armor';
      else if (slotLower.includes('shield') || slotLower.includes('kalkan')) slotKey = 'offHand';
      else if (slotLower.includes('belt') || slotLower.includes('kemer') || slotLower.includes('waist')) slotKey = 'belt';
      else if (slotLower.includes('head') || slotLower.includes('baş')) slotKey = 'head';
      else if (slotLower.includes('eyes') || slotLower.includes('göz')) slotKey = 'eyes';
      else if (slotLower.includes('neck') || slotLower.includes('boyun')) slotKey = 'neck';
      else if (slotLower.includes('shoulders') || slotLower.includes('omuz')) slotKey = 'shoulders';
      else if (slotLower.includes('torso') || slotLower.includes('gövde')) slotKey = 'torso';
      else if (slotLower.includes('bracers') || slotLower.includes('bileklik') || slotLower.includes('arms')) slotKey = 'bracers';
      else if (slotLower.includes('gloves') || slotLower.includes('eldiven') || slotLower.includes('hands')) slotKey = 'gloves';
      else if (slotLower.includes('boots') || slotLower.includes('ayak') || slotLower.includes('feet')) slotKey = 'boots';
      else if (slotLower.includes('ring') || slotLower.includes('yüzük')) {
        slotKey = (!character.bodySlots?.ring1 || character.bodySlots.ring1.name === '-') ? 'ring1' : 'ring2';
      }

      if (slotKey && character.bodySlots) {
        character.bodySlots[slotKey] = {
          name: item.name,
          masterDbName: item.name,
          active: true,
          category: item.category || 'Wondrous Item',
          weight: Number(item.weight) || 0,
          cost: Number(item.cost) || 0,
          desc: item.benefit || item.description || '',
          acBonus: item.acBonus,
          bonusType: item.bonusType,
          strBonus: item.strBonus,
          dexBonus: item.dexBonus,
          conBonus: item.conBonus,
          intBonus: item.intBonus,
          wisBonus: item.wisBonus,
          chaBonus: item.chaBonus
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

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    if (typeof renderAll === 'function') renderAll();
  },

  equipItemWithChildren(parentItem, sourceList = null) {
    if (typeof character === 'undefined' || !character) return;
    if (!parentItem) return;

    // 1. Equip Primary/Parent Item
    this.equipItem(parentItem);

    // 2. Discover and attach all child powers
    const children = this.getChildrenForEntry(parentItem, sourceList);
    if (!children.length) return;

    let attachedCount = 0;
    children.forEach(child => {
      const childName = (child.name || '').replace(/^↳\s*/, '').trim();
      const cat = (child.type || child.category || '').toLowerCase();

      // A. Special Active Power / Spell / Command (e.g. 1/day Ray of Fire)
      if (cat.includes('spell') || child.action?.toLowerCase().includes('action') || (child.duration && child.duration !== 'Continuous')) {
        if (!character.specialAbilities) character.specialAbilities = [];
        const existsIdx = character.specialAbilities.findIndex(a => (a.name || '').toLowerCase() === childName.toLowerCase());
        const abilityObj = {
          name: childName,
          source: `${parentItem.name}`,
          action: child.action || 'Standard Action',
          duration: child.duration || 'Special',
          benefit: child.benefit || child.description || '',
          dice: child.extraDmg || child.dice || '',
          active: false
        };
        if (existsIdx >= 0) character.specialAbilities[existsIdx] = abilityObj;
        else character.specialAbilities.push(abilityObj);
        attachedCount++;
      }

      // B. Weapon Extra Damage / On-Hit Energy (e.g. Flaming Burst +1d6 Fire)
      if (child.extraDmg || (child.attBonus && Number(child.attBonus) > 0) || (child.dmgBonus && Number(child.dmgBonus) > 0)) {
        if (!character.activeModifiers) character.activeModifiers = [];
        const modIdx = character.activeModifiers.findIndex(m => (m.name || '').toLowerCase() === childName.toLowerCase());
        const modObj = {
          name: childName,
          source: parentItem.name,
          bonusAtk: Number(child.attBonus) || 0,
          dice: child.extraDmg || child.dice || '',
          type: child.dmgType || 'Energy',
          active: true,
          notes: child.benefit || child.description || ''
        };
        if (modIdx >= 0) character.activeModifiers[modIdx] = modObj;
        else character.activeModifiers.push(modObj);
        attachedCount++;

        if (Array.isArray(character.weapons)) {
          const wep = character.weapons.find(w => (w.name || '').toLowerCase() === (parentItem.name || '').toLowerCase());
          if (wep && child.extraDmg) {
            if (!wep.extraDmg || wep.extraDmg === '-') wep.extraDmg = child.extraDmg;
            else if (!wep.extraDmg.includes(child.extraDmg)) wep.extraDmg += `, ${child.extraDmg}`;
          }
        }
      }

      // C. Tome of Battle (Maneuver / Stance)
      if (cat.includes('maneuver')) {
        if (!character.tomeOfBattle) character.tomeOfBattle = { initiatorLevel: 1, readiedManeuvers: [], stancesKnown: [] };
        if (!character.tomeOfBattle.readiedManeuvers) character.tomeOfBattle.readiedManeuvers = [];
        character.tomeOfBattle.readiedManeuvers.push({
          name: childName,
          level: Number(child.level) || 1,
          discipline: child.discipline || 'Stone Dragon',
          action: child.action || 'Standard Action',
          expended: false,
          notes: child.benefit || child.description || ''
        });
        attachedCount++;
      } else if (cat.includes('stance')) {
        if (!character.tomeOfBattle) character.tomeOfBattle = { initiatorLevel: 1, readiedManeuvers: [], stancesKnown: [] };
        if (!character.tomeOfBattle.stancesKnown) character.tomeOfBattle.stancesKnown = [];
        character.tomeOfBattle.stancesKnown.push({
          name: childName,
          discipline: child.discipline || 'Iron Heart',
          level: Number(child.level) || 1,
          benefit: child.benefit || child.description || ''
        });
        attachedCount++;
      }
    });

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    if (typeof renderAll === 'function') renderAll();

    alert(`⚡ "${parentItem.name}" ve ${children.length} alt gücü (${attachedCount} özel yetenek/saldırı modifiyesi) karaktere tek seferde eklendi ve kuşandı!`);
  },

  equipWeaponSlot(name, slot) {
    const item = masterDb.find(i => i.name === name);
    if (!item || !character) return;
    if (!character.weapons) character.weapons = [];
    let existing = character.weapons.find(w => w.name === item.name);
    if (!existing) {
      existing = {
        name: item.name,
        grip: slot === 'Main Hand' ? '1-Hand' : '2-Hand',
        dice: item.dice || item.extraDmg || '1d8',
        critMin: item.critMin || 20,
        critMult: item.critMult || 2,
        attBonus: Number(item.attBonus) || 0,
        dmgBonus: Number(item.dmgBonus) || 0,
        dmgType: item.dmgType || 'Slashing',
        bonusType: item.bonusType || 'Enhancement',
        tags: item.tags || []
      };
      character.weapons.push(existing);
    }
    character.activeWeapon = item.name;
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    if (typeof renderAll === 'function') renderAll();
    alert(`⚔️ "${item.name}" başarıyla ${slot} olarak kuşandı ve aktif saldırı rotatörüne atandı!`);
  },

  // ====================================================
  // 2. WEAPONS, ARMORS & SHIELDS VIEW
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
    items.forEach(item => {
      const idx = masterDb.indexOf(item);
      const isWeapon = item.type === 'Weapon';

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
              <button onclick="toggleUniversalPin({ name: '${item.name.replace(/'/g, "\\'")}', type: 'Feat', action: 'Passive', desc: '${(item.benefit || item.description || '').replace(/'/g, "\\'")}', badge: '${item.bonusType || 'Feat'}' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Savaş Kokpitine Sabitle / Çıkar">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
            </div>
          </div>

          <!-- Combat Stats Pills -->
          <div class="flex flex-wrap gap-1.5 text-xs font-mono">
            ${isWeapon ? `
              <span class="badge bg-slate-800 text-amber-300 font-bold inline-flex items-center gap-1">${typeof getFormulaDiceIconSvg === 'function' ? getFormulaDiceIconSvg(item.dice || item.extraDmg || '1d8', 'w-3 h-3 text-amber-400 shrink-0') : ''}<span>${item.dice || item.extraDmg || '1d8'}</span></span>
              <span class="badge bg-slate-800 text-rose-300 font-bold">🎯 ${item.critMin || 20}-20/x${item.critMult || 2}</span>
              ${item.attBonus ? `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-800">Atk +${item.attBonus}</span>` : ''}
              ${item.dmgBonus ? `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-800">Dmg +${item.dmgBonus}</span>` : ''}
              <span class="badge bg-slate-800 text-slate-300">${item.dmgType || 'Slashing'}</span>
            ` : `
              <span class="badge bg-sky-950 text-sky-300 border border-sky-800 font-bold">🛡️ +${item.acBonus || 0} AC</span>
              <span class="badge bg-slate-800 text-slate-300">Tür: ${item.bonusType || 'Armor'}</span>
            `}
          </div>

          <p class="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">${item.benefit || item.description || '-'}</p>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
            <span class="text-amber-400 font-bold">${item.cost || 0} gp • ${item.weight || 0} lbs</span>
            <div class="flex gap-1.5">
              ${isWeapon ? `
                <button onclick="RuleMaster.equipWeaponSlot('${item.name}', 'Main Hand')" class="bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-[10px] font-bold px-2 py-1 rounded transition">⚡ Ana El</button>
                <button onclick="RuleMaster.equipWeaponSlot('${item.name}', 'Off-Hand')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-1 rounded transition">⚡ İkinci El</button>
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
  // 3. SPELLS, MANEUVERS & STANCES VIEW
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
    items.forEach(item => {
      const idx = masterDb.indexOf(item);
      const isSpell = item.type === 'Spell';
      const isManeuver = item.type === 'Maneuver';

      html += `
        <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2.5 transition shadow">
          <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge ${isSpell ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}">${item.type}</span>
                ${item.level !== undefined && item.level !== '' ? `<span class="badge bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">${item.level}. Seviye</span>` : ''}
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">
                ${isSpell ? `Okul: <b class="text-purple-300">${item.school || 'Universal'}</b>` : `Disiplin: <b class="text-rose-300">${item.discipline || 'Tome of Battle'}</b>`}
                • 📚 ${item.source || 'PHB/ToB'}
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${item.name.replace(/'/g, "\\'")}', type: 'Feat', action: 'Passive', desc: '${(item.benefit || item.description || '').replace(/'/g, "\\'")}', badge: '${item.bonusType || 'Feat'}' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Savaş Kokpitine Sabitle / Çıkar">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 text-[10px] text-slate-400">
            <span>Aksiyon: <b class="text-amber-300">${item.action || 'Standard Action'}</b></span>
            <span>Süre: <b class="text-slate-300">${item.duration || 'Instantaneous'}</b></span>
            ${item.dice || item.extraDmg ? `<span>Zar: <b class="text-rose-400 font-mono">${item.dice || item.extraDmg}</b></span>` : ''}
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
  // 4. FEATS & SPECIAL ABILITIES VIEW
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
    items.forEach(item => {
      const idx = masterDb.indexOf(item);
      html += `
        <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2.5 transition shadow">
          <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge bg-amber-950 text-amber-300 border border-amber-800">${item.type}</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">📚 ${item.source || 'PHB'} • Tür: <b>${item.bonusType || 'Untyped'}</b></div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${item.name.replace(/'/g, "\\'")}', type: 'Feat', action: 'Passive', desc: '${(item.benefit || item.description || '').replace(/'/g, "\\'")}', badge: '${item.bonusType || 'Feat'}' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Savaş Kokpitine Sabitle / Çıkar">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
            </div>
          </div>

          ${item.prereq && item.prereq !== '-' ? `
            <div class="bg-slate-950/60 border border-slate-800 px-2.5 py-1.5 rounded text-[10px] text-amber-300">
              <span class="font-bold text-slate-400 uppercase">Önkoşullar:</span> ${item.prereq}
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
  // 5. MAGIC ITEMS & CONSUMABLES VIEW
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
    items.forEach(item => {
      const idx = masterDb.indexOf(item);
      const isPotion = item.type === 'Potion';

      html += `
        <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2.5 transition shadow">
          <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge ${isPotion ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-teal-950 text-teal-300 border border-teal-800'}">${item.type}</span>
                <span class="badge bg-slate-800 text-slate-300 text-[10px]">${item.slot || 'Slotless'}</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">📚 ${item.source || 'MIC'} • Bonus: <b>${item.bonusType || 'Untyped'}</b></div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="toggleUniversalPin({ name: '${item.name.replace(/'/g, "\\'")}', type: 'Feat', action: 'Passive', desc: '${(item.benefit || item.description || '').replace(/'/g, "\\'")}', badge: '${item.bonusType || 'Feat'}' })" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition" title="Savaş Kokpitine Sabitle / Çıkar">📌</button>
              <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
            </div>
          </div>

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
  // 6. PARENT-CHILD HIERARCHY TREE VIEW
  // ====================================================
  renderHierarchyTree() {
    const container = document.getElementById('hierarchy-tree-container');
    if (!container) return;

    const parentMap = new Map();
    const childrenList = [];

    masterDb.forEach(item => {
      const isChild = (item.parent && item.parent !== '-' && item.parent !== '') || item.name.startsWith('↳');
      if (isChild) {
        childrenList.push(item);
      } else {
        parentMap.set(item.name, { parent: item, children: [] });
      }
    });

    childrenList.forEach(child => {
      let pName = child.parent;
      if (!pName || pName === '-') {
        const clean = child.name.replace('↳', '').trim();
        const split = clean.split(':');
        pName = split[0].trim();
      }
      if (parentMap.has(pName)) {
        parentMap.get(pName).children.push(child);
      } else {
        parentMap.set(pName, { parent: { name: pName, type: 'Composite Item', source: child.source, benefit: 'Birden fazla alt güce sahip ana eşya' }, children: [child] });
      }
    });

    let treeHtml = '';
    let countComposite = 0;

    parentMap.forEach(({ parent, children }) => {
      if (children.length > 0) {
        countComposite++;
        const pIdx = masterDb.indexOf(parent);
        treeHtml += `
          <div class="bg-slate-900 border border-purple-500/40 rounded-xl p-4 space-y-3 shadow-lg">
            <div class="flex items-center justify-between border-b border-purple-500/30 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-xl">👑</span>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-extrabold text-white">${parent.name}</span>
                    <span class="badge ${this.getTypeBadgeClass(parent.type)}">${parent.type}</span>
                    <span class="badge bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">${children.length} Alt Güç</span>
                  </div>
                  <div class="text-[10px] text-slate-400">📚 ${parent.source || 'Core 3.5e'} • Yuva: <b>${parent.slot || 'None'}</b></div>
                </div>
              </div>
              <div class="flex gap-1.5">
                <button onclick="RuleMaster.addChildPower(${pIdx >= 0 ? pIdx : 0})" class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-2.5 py-1 rounded shadow transition flex items-center gap-1">
                  <span>➕</span>
                  <span>Alt Güç Bağla</span>
                </button>
                ${pIdx >= 0 ? `<button onclick="RuleMaster.openModalWithData(masterDb[${pIdx}], ${pIdx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition">✏️</button>` : ''}
              </div>
            </div>

            <div class="space-y-2 pl-4 border-l-2 border-purple-500/50">
              ${children.map(child => {
                const cIdx = masterDb.indexOf(child);
                return `
                  <div class="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1.5 hover:border-purple-500/40 transition">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5">
                        <span class="text-purple-400 font-bold font-mono">↳</span>
                        <span class="text-xs font-bold text-purple-200">${RuleMaster.cleanArrow(child.name)}</span>
                        <span class="badge bg-slate-800 text-slate-400 text-[10px]">${child.action || 'Passive'}</span>
                        <span class="badge bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">${child.bonusType || 'Untyped'}</span>
                      </div>
                      ${cIdx >= 0 ? `<button onclick="RuleMaster.openModalWithData(masterDb[${cIdx}], ${cIdx})" class="text-[11px] text-sky-400 hover:underline">Düzenle ✏️</button>` : ''}
                    </div>
                    <div class="text-[11px] text-slate-300">${child.benefit || child.description || '-'}</div>
                    ${child.extraDmg || child.dice ? `<div class="text-[10px] font-mono text-emerald-400 inline-flex items-center gap-1">${typeof getFormulaDiceIconSvg === 'function' ? getFormulaDiceIconSvg(child.extraDmg || child.dice, 'w-3 h-3 text-emerald-400 shrink-0') : ''}<span>Ek Zar/Hasar: ${child.extraDmg || child.dice}</span></div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
    });

    const badge = document.getElementById('tree-count-badge');
    if (badge) badge.textContent = `${countComposite} Çoklu Güçlü Eşya`;

    if (!treeHtml) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
          <div class="text-base font-bold text-slate-400">Henüz çoklu alt güce bağlı eşya bulunmuyor.</div>
          <div class="text-xs">Tablodaki herhangi bir eşyanın yanındaki <b>🔗 Alt Yetenek Ekle</b> butonuna tıklayarak ilk kompozit eşyanızı oluşturabilirsiniz.</div>
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

  // Quick / Heuristic Rule Parser (Parses raw text from d20srd, books or SRD)
  parseRawText() {
    const raw = document.getElementById('raw-rule-input')?.value || '';
    if (!raw.trim()) {
      alert('⚠️ Lütfen ayrıştırılacak bir kural metni yapıştırın.');
      return;
    }

    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const entry = this.createEmptyEntry('Feat');

    // First line is often title
    if (lines.length > 0) {
      entry.name = lines[0].replace(/\[.*?\]/g, '').trim();
    }

    const fullText = raw.toLowerCase();

    // Type detection
    if (fullText.includes('stance') || fullText.includes('discipline')) entry.type = 'Stance';
    else if (fullText.includes('strike') || fullText.includes('counter') || fullText.includes('boost') || fullText.includes('maneuver')) entry.type = 'Maneuver';
    else if (fullText.includes('evocation') || fullText.includes('transmutation') || fullText.includes('abjuration') || fullText.includes('casting time') || fullText.includes('components:')) entry.type = 'Spell';
    else if (fullText.includes('damage:') || fullText.includes('slashing') || fullText.includes('piercing') || fullText.includes('critical:')) entry.type = 'Weapon';
    else if (fullText.includes('armor bonus:') || fullText.includes('shield bonus:')) entry.type = 'Armor';
    else if (fullText.includes('prerequisite:')) entry.type = 'Feat';

    // Prereq
    const prereqMatch = raw.match(/Prerequisite[s]?:?\s*(.*?)(?=\.|\n|$)/i);
    if (prereqMatch) entry.prereq = prereqMatch[1].trim();

    // Benefit
    const benefitMatch = raw.match(/Benefit:?\s*([\s\S]*?)(?=(Special:|Normal:|$))/i);
    if (benefitMatch) {
      entry.benefit = benefitMatch[1].trim();
    } else {
      entry.benefit = lines.slice(1).join(' ');
    }

    // Damage dice
    const diceMatch = raw.match(/(\d+d\d+(\+\d+)?)/i);
    if (diceMatch) entry.dice = diceMatch[1];

    // Discipline
    const discMatch = raw.match(/(Iron Heart|Stone Dragon|Shadow Hand|White Raven|Tiger Claw|Diamond Mind|Setting Sun|Devoted Spirit|Desert Wind)/i);
    if (discMatch) entry.discipline = discMatch[1];

    // Weapon details (Slot, Two-Handed detection, damage type, tags)
    if (entry.type === 'Weapon') {
      const isTwoHand = (typeof RuleEngine !== 'undefined' && RuleEngine.isTwoHandedWeapon(entry)) ||
        fullText.includes('two-handed') || fullText.includes('2-handed') || fullText.includes('two hands') || fullText.includes('requires 2 hands') || fullText.includes('two-hand');
      entry.slot = isTwoHand ? 'Two-Handed' : 'Main Hand';
      const tags = [];
      if (isTwoHand) tags.push('two-handed');
      if (fullText.includes('exotic')) tags.push('exotic');
      if (fullText.includes('martial')) tags.push('martial');
      if (fullText.includes('simple')) tags.push('simple');
      if (fullText.includes('slashing')) { tags.push('slashing'); entry.dmgType = 'Slashing'; }
      if (fullText.includes('piercing')) { tags.push('piercing'); entry.dmgType = entry.dmgType ? entry.dmgType + '/Piercing' : 'Piercing'; }
      if (fullText.includes('bludgeoning')) { tags.push('bludgeoning'); entry.dmgType = 'Bludgeoning'; }
      entry.tags = tags;
    }

    // Open Modal with parsed draft
    this.openModalWithData(entry, -1);
  },

  // ====================================================
  // ADD BUTTON DROPDOWN & INLINE AI RULE ADDER
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

    // Check Local Canonical Compendium & Typo Resolver First!
    let cleanKey = query.toLowerCase().trim();
    if (typeof this.canonicalDictionary[cleanKey] === 'string') {
      cleanKey = this.canonicalDictionary[cleanKey];
    }
    const matchedCanonical = this.canonicalDictionary[cleanKey];
    if (matchedCanonical && typeof matchedCanonical === 'object') {
      if (queryInput) queryInput.value = matchedCanonical.name;
      const row = this.entryToRow(matchedCanonical);
      this.renderInlineAiResults([row]);
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
      const rows = await this.fetchSingleAiRuleRows(query, categoryHint, apiKey, statusText);
      this.renderInlineAiResults(rows);
    } catch (err) {
      alert(`⚠️ Kural getirilemedi: ${err.message}\nLütfen internet bağlantınızı ve API anahtarınızı kontrol edin.`);
    } finally {
      if (btn) btn.disabled = false;
      if (loadingBox) loadingBox.classList.add('hidden');
    }
  },

  renderInlineAiResults(rows) {
    const resultsBox = document.getElementById('inline-ai-results-box');
    if (!resultsBox) return;

    if (!rows || !rows.length) {
      resultsBox.innerHTML = `
        <div class="p-3 text-center text-slate-400 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
          Uygun kural kaydı bulunamadı. Lütfen kural adını kontrol edip tekrar arayın.
        </div>
      `;
      return;
    }

    const entries = this.convertRowsToEntries(rows);
    this._inlineEntries = entries;

    let html = `
      <div class="flex items-center justify-between bg-slate-900 border border-purple-500/40 p-2.5 rounded-xl mb-2 shadow-md">
        <div class="flex items-center gap-2">
          <span class="text-base">✨</span>
          <div>
            <div class="text-xs font-bold text-white">${entries.length} Kural / Alt Güç Ayrıştırıldı</div>
            <div class="text-[10px] text-slate-400">Ana eşya ve bağlı tüm alt yetenekler tek seferde eklenebilir</div>
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
      const isChild = item.isChild || (item.parent && item.parent !== '-');
      const children = this.getChildrenForEntry(item, entries);
      const isParent = !isChild && children.length > 0;
      const badgeClass = this.getTypeBadgeClass(item.type);

      const statPills = [];
      if (item.strBonus) statPills.push(`+${item.strBonus} STR`);
      if (item.dexBonus) statPills.push(`+${item.dexBonus} DEX`);
      if (item.conBonus) statPills.push(`+${item.conBonus} CON`);
      if (item.intBonus) statPills.push(`+${item.intBonus} INT`);
      if (item.wisBonus) statPills.push(`+${item.wisBonus} WIS`);
      if (item.chaBonus) statPills.push(`+${item.chaBonus} CHA`);
      if (item.acBonus) statPills.push(`+${item.acBonus} AC`);
      if (item.attBonus) statPills.push(`+${item.attBonus} Atk`);
      if (item.dmgBonus) statPills.push(`+${item.dmgBonus} Dmg`);
      if (item.extraDmg) statPills.push(`${item.extraDmg}`);

      html += `
        <div class="${isChild ? 'ml-5 border-l-4 border-l-purple-500 bg-slate-950/70' : (isParent ? 'bg-slate-950 border-2 border-purple-500/60 shadow-purple-950/30' : 'bg-slate-950 border border-purple-500/40')} rounded-xl p-3 shadow-md space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-2">
                ${isChild ? '<span class="text-purple-400 font-bold font-mono">↳</span>' : ''}
                <span class="text-xs md:text-sm font-extrabold text-white">${isChild ? RuleMaster.cleanArrow(item.name) : item.name}</span>
                <span class="badge ${badgeClass} text-[10px]">${item.type}</span>
                ${isParent ? `<span class="badge bg-purple-950 text-purple-200 border border-purple-600 text-[10px] font-bold">👑 Ana Eşya (${children.length} Alt Güç)</span>` : ''}
                ${isChild ? `<span class="badge bg-purple-950 text-purple-300 border border-purple-800 font-mono text-[9px]">Bağlı: ${item.parent}</span>` : ''}
                <span class="text-[10px] text-slate-400">📚 <b>${item.source || 'PHB'}</b></span>
                <span class="text-[10px] text-slate-400">• Slot: <b>${item.slot || 'None'}</b></span>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              ${isParent ? `
                <button onclick="RuleMaster.addInlineResultToDb(${idx}, true)" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3 py-1 rounded-lg shadow transition flex items-center gap-1" title="Ana eşya ve tüm ${children.length} alt gücünü tek seferde Master DB'ye ekler">
                  <span>📥</span>
                  <span>Tümünü DB'ye Ekle</span>
                </button>
                <button onclick="RuleMaster.equipInlineResultToCharacter(${idx})" class="bg-purple-900 hover:bg-purple-800 border border-purple-600 text-purple-200 text-xs px-2.5 py-1 rounded-lg transition font-bold" title="Ana eşya ve tüm alt güçlerini tek seferde kuşanır">
                  ⚡ Hepsini Kuşan
                </button>
              ` : (isChild ? `
                <span class="text-[10px] text-purple-300 bg-purple-950/80 border border-purple-700/60 rounded-lg px-2.5 py-1 font-medium flex items-center gap-1.5 shadow-sm" title="Alt güçler ana öğe (${item.parent || 'Parent'}) ile bir bütün olarak eklenir ve kuşanılır.">
                  <span>🔗</span>
                  <span>Ana Öğe ile Birlikte Eklenir</span>
                </span>
              ` : `
                <button onclick="RuleMaster.addInlineResultToDb(${idx}, false)" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow transition flex items-center gap-1">
                  <span>📥</span>
                  <span>DB'ye Ekle</span>
                </button>
                <button onclick="RuleMaster.equipInlineResultToCharacter(${idx})" class="bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 text-xs px-2 py-1 rounded-lg transition" title="Karaktere Kuşan">
                  ⚡ Kuşan
                </button>
              `)}
              <button onclick="RuleMaster.editInlineResultInModal(${idx})" class="bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs px-2 py-1 rounded-lg border border-slate-700 transition" title="29 Sütunlu Formda İncele/Düzenle">
                ✏️ Düzenle
              </button>
            </div>
          </div>

          ${statPills.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1">
              <span class="text-[9px] uppercase font-bold text-slate-400">Bonuslar:</span>
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[9px] font-bold">${p}</span>`).join('')}
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

  addInlineResultToDb(idx, includeChildren = true) {
    if (!this._inlineEntries || !this._inlineEntries[idx]) return;
    let item = this._inlineEntries[idx];
    const isChild = item.isChild || (item.parent && item.parent !== '-');

    // Parent-Child ilişkileri bütün olarak eklensin: Eğer bir alt güç (child) seçildiyse,
    // otomatik olarak ana öğesi bulunup tüm aile birlikte eklenir!
    if (isChild) {
      const pName = RuleMaster.cleanArrow(item.parent || '').toLowerCase().trim();
      const pIdx = this._inlineEntries.findIndex(entry => RuleMaster.cleanArrow(entry.name).toLowerCase().trim() === pName);
      if (pIdx >= 0) {
        idx = pIdx;
        item = this._inlineEntries[pIdx];
      }
    }

    const itemsToAdd = [item];
    const children = this.getChildrenForEntry(item, this._inlineEntries);
    children.forEach(c => itemsToAdd.push(c));

    itemsToAdd.forEach(it => {
      const copy = JSON.parse(JSON.stringify(it));
      const existsIdx = masterDb.findIndex(m => (m.name || '').toLowerCase().trim() === (copy.name || '').toLowerCase().trim());
      if (existsIdx >= 0) {
        masterDb[existsIdx] = copy;
      } else {
        const parentName = (copy.parent && copy.parent !== '-') ? RuleMaster.cleanArrow(copy.parent).toLowerCase() : '';
        const parentIdx = parentName ? masterDb.findIndex(m => RuleMaster.cleanArrow(m.name).toLowerCase() === parentName) : -1;
        if (parentIdx >= 0) {
          let insertAt = parentIdx + 1;
          while (insertAt < masterDb.length && RuleMaster.cleanArrow(masterDb[insertAt].parent).toLowerCase() === parentName) {
            insertAt++;
          }
          masterDb.splice(insertAt, 0, copy);
        } else {
          masterDb.push(copy);
        }
      }
    });

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();

    if (itemsToAdd.length > 1) {
      alert(`✅ "${item.name}" ve ${itemsToAdd.length - 1} alt gücü başarıyla Master_DB'ye eklendi ve kütüphane güncellendi!`);
    } else {
      alert(`✅ "${item.name}" başarıyla Master_DB'ye eklendi ve kütüphane güncellendi!`);
    }
  },

  addAllInlineResultsToDb() {
    if (!this._inlineEntries || !this._inlineEntries.length) return;
    [...this._inlineEntries].reverse().forEach(it => {
      const copy = JSON.parse(JSON.stringify(it));
      const existsIdx = masterDb.findIndex(m => (m.name || '').toLowerCase().trim() === (copy.name || '').toLowerCase().trim());
      if (existsIdx >= 0) {
        masterDb[existsIdx] = copy;
      } else {
        masterDb.unshift(copy);
      }
    });
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`✅ Toplam ${this._inlineEntries.length} kural ve alt güç tek seferde Master_DB'ye eklendi!`);
  },

  editInlineResultInModal(idx) {
    if (!this._inlineEntries || !this._inlineEntries[idx]) return;
    const item = this._inlineEntries[idx];
    this.openModalWithData(item, -1);
  },

  equipInlineResultToCharacter(idx) {
    if (!this._inlineEntries || !this._inlineEntries[idx]) return;
    let item = this._inlineEntries[idx];
    const isChild = item.isChild || (item.parent && item.parent !== '-');
    if (isChild) {
      const pName = RuleMaster.cleanArrow(item.parent || '').toLowerCase().trim();
      const pParent = this._inlineEntries.find(entry => RuleMaster.cleanArrow(entry.name).toLowerCase().trim() === pName);
      if (pParent) item = pParent;
    }
    this.equipItemWithChildren(item, this._inlineEntries);
  },

  // ====================================================
  // SERBEST METİN (FREE-TEXT) AI AYRIŞTIRICI ENGINE
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
      if (btnSearch) {
        btnSearch.className = 'px-2.5 py-1 rounded font-bold transition text-slate-400 hover:text-white';
      }
      if (btnFreetext) {
        btnFreetext.className = 'px-2.5 py-1 rounded font-bold transition bg-purple-600 text-white shadow';
      }
      if (headerTitle) headerTitle.textContent = '🧙‍♂️🤖 Rule Master (AI) Serbest Metin Ayrıştırıcı';
      const ta = document.getElementById('inline-ai-freetext-input');
      if (ta) ta.focus();
    } else {
      if (searchPanel) searchPanel.classList.remove('hidden');
      if (freetextPanel) freetextPanel.classList.add('hidden');
      if (btnSearch) {
        btnSearch.className = 'px-2.5 py-1 rounded font-bold transition bg-purple-600 text-white shadow';
      }
      if (btnFreetext) {
        btnFreetext.className = 'px-2.5 py-1 rounded font-bold transition text-slate-400 hover:text-white';
      }
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
    const promptText = `You are a master D&D 3.5e Rule Arbiter and Database Architect.
The user has provided a raw, free-form text block copied from a D&D 3.5e sourcebook, PDF, SRD, or adventure:

RAW TEXT:
"""
${rawText}
"""

TASK:
Analyze and parse this free-form text completely. Extract and map every mechanic strictly adhering to the Master_DB 29-column schema.
CRITICAL RULES:
1. STRICT REAL RAW 3.5E RULES ONLY:
Do not hallucinate fake rules. Extract accurate numbers, bonuses, slots, actions, durations, and sources based on official WotC D&D 3.5e rules.
2. PARENT-CHILD DECOMPOSITION:
If the item or rule has multiple distinct powers (e.g. passive weapon stats + on-hit energy damage + 1/day command spell; or stat enhancement + saving throw resistance), produce:
- 1 Parent row for the primary element (Col 3 = '-')
- 1 or more Child rows starting with '↳ ' in Col 0, setting Col 3 to the exact parent name.
3. TWO-HANDED WEAPONS:
Any weapon requiring two hands to wield (e.g. Greatsword, Greataxe, Jovar, Halberd, Polearm, Bow) MUST set Slot (Col 2) to 'Two-Handed'.

MASTER_DB 29-COLUMN SCHEMA (Every row MUST contain exactly 29 elements):
0: Entry Name (string, child begins with '↳ ')
1: Category ('Feat', 'Weapon', 'Armor / Shield', 'Ring', 'Wondrous Item', 'Slotless Item', 'Spell', 'Special Ability', 'Potion', 'Maneuver', 'Stance')
2: Slot ('Armor', 'Shield', 'Main Hand', 'Off Hand', 'Two-Handed', 'Both Hands', 'Head', 'Eyes', 'Neck', 'Torso', 'Body', 'Waist', 'Shoulders', 'Arms', 'Hands', 'Ring', 'Feet', 'Slotless', 'None')
3: Parent Entry (string; '-' if none, or exact parent name if child)
4: Source (e.g. 'PHB p.92', 'MIC p.128', 'DMG p.224', 'CW p.112', 'ToB p.84')
5: Description / Rules Mechanics (string, full prerequisite and mechanical benefit)
6: Bonus Type ('Untyped', 'Enhancement', 'Deflection', 'Dodge', 'Resistance', 'Morale', 'Competence', 'Insight', 'Luck', 'Natural Armor', 'Shield', 'Armor', 'Alchemical', 'Inherent')
7: Applies To / Scope ('All Attacks', 'Melee Only', 'Ranged Only', 'Thrown Only', 'Spells', 'None / General')
8: Str (number or '')
9: Dex (number or '')
10: Con (number or '')
11: Int (number or '')
12: Wis (number or '')
13: Cha (number or '')
14: AC (number or '')
15: HP (number or '')
16: Att (number or '')
17: Dmg (number or '')
18: Fort (number or '')
19: Ref (number or '')
20: Will (number or '')
21: Skill (number or '')
22: Init (number or '')
23: Speed (number or '')
24: On-Hit Dmg / Dice Expression (string, e.g. '+1d6 Fire', '1d8', or '')
25: Action ('Passive', 'Free Action', 'Swift Action', 'Immediate Action', 'Move Action', 'Standard Action', 'Full-Round Action')
26: Duration / Uses (string, e.g. 'Continuous', '1 round/lvl', '10 rounds/day', '1/day', 'At Will')
27: Weight (lbs) (number or 0)
28: Cost (gp) (number or 0)

OUTPUT REQUIREMENT:
Return valid JSON only matching this schema:
{ "rows": [ [col0, col1, ... col28], ... ] }`;

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

    let rows = successData.rows || successData;
    if (!Array.isArray(rows)) {
      throw new Error('Model beklenen satır dizisini üretemedi.');
    }

    // Sanitize to 29 columns
    rows = rows.map(r => {
      while (r.length < 29) r.push('');
      return r.slice(0, 29);
    });

    return rows;
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
      const rows = await this.queryAiFreeTextRows(text, apiKey, statusText);
      this.renderInlineAiResults(rows);
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
      const rows = await this.queryAiFreeTextRows(text, apiKey, statusText);
      this.processAiRows(rows);
      // Scroll to results
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
      alert('âš ï¸ KÃ¼tÃ¼phane denetimi iÃ§in geÃ§erli bir Gemini API anahtarÄ± gereklidir.');
      this.promptChangeApiKey();
      return;
    }

    const items = (Array.isArray(this.masterDb) ? this.masterDb : [])
      .filter(i => i && i.name && !String(i.name).startsWith('â†³'));

    if (items.length === 0) {
      alert('â„¹ï¸ Yerel kullanÄ±cÄ± veri tabanÄ±nÄ±zda (master_db) henÃ¼z Ã¶zel kayÄ±t bulunmamaktadÄ±r.\n\nSRD Core kataloÄŸundaki 267 kayÄ±t zaten resmi Gemini 3.1 Pro denetiminden geÃ§miÅŸ ve dondurulmuÅŸtur.');
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
            <span class="text-xl">ğŸ›¡ï¸</span>
            <div>
              <h3 class="font-bold text-sm text-purple-300">Gemini Pro ile RAW 3.5e KÃ¼tÃ¼phane Denetimi</h3>
              <p class="text-[11px] text-slate-400">master_db iÃ§indeki ${items.length} Ã¶zel kayÄ±t taranÄ±yor...</p>
            </div>
          </div>
          <button onclick="document.getElementById('rule-master-audit-modal').classList.add('hidden')" class="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 rounded bg-slate-800 cursor-pointer">âœ•</button>
        </div>
        <div id="rule-master-audit-content" class="max-h-96 overflow-y-auto space-y-2 pr-1 text-xs">
          <div class="text-center py-8 text-slate-400 animate-pulse flex items-center justify-center gap-2">
            <span>âš¡ Gemini Pro modeline baÄŸlanÄ±lÄ±yor ve RAW kural motoru denetimi baÅŸlatÄ±lÄ±yor...</span>
          </div>
        </div>
      </div>
    `;
    modalEl.classList.remove('hidden');

    try {
      const sampleItems = items.slice(0, 20).map(i => ({
        name: i.name,
        type: i.type,
        source: i.source,
        prereq: i.prereq,
        benefit: i.benefit || i.description,
        isFighterBonusFeat: i.isFighterBonusFeat
      }));

      const auditPrompt = `You are an uncompromising D&D 3.5e RAW Auditor.
Audit these user-added custom records from their master_db:
${JSON.stringify(sampleItems, null, 2)}

TASK:
1. Verify if each item exists in official 3.5e WotC books or is unofficial homebrew.
2. Detect any 5e mechanics (Advantage/Disadvantage, Bonus Action, Finesse adding Dex to damage, etc.).
3. Check if prerequisites and fighter bonus feat flags match RAW 3.5e.

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
        contentEl.innerHTML = `<div class="p-3 text-rose-300 bg-rose-950/40 rounded border border-rose-800">âš ï¸ Denetim gerÃ§ekleÅŸtirilemedi veya yanÄ±t alÄ±namadÄ±. LÃ¼tfen API kotanÄ±zÄ± kontrol edin.</div>`;
        return;
      }

      contentEl.innerHTML = auditJson.results.map(r => {
        let badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-700';
        let badgeIcon = 'âœ…';
        if (r.status === 'WARNING') {
          badgeColor = 'bg-amber-950 text-amber-300 border-amber-700';
          badgeIcon = 'âš ï¸';
        } else if (r.status === 'HOMEBREW') {
          badgeColor = 'bg-rose-950 text-rose-300 border-rose-700';
          badgeIcon = 'ğŸš«';
        }
        return `
          <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white">${r.name}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}">
                ${badgeIcon} ${r.status}
              </span>
            </div>
            ${r.issues && r.issues.length ? `<p class="text-[10px] text-amber-200">${r.issues.join(' | ')}</p>` : `<p class="text-[10px] text-emerald-400">Resmi 3.5e RAW standartlarÄ±na tam uyumlu.</p>`}
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