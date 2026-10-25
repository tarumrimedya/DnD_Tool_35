/**
 * D&D 3.5e Declarative Rule, Modifier & Stacking Engine
 * Handles ability modifiers, RAW stacking rules, dynamic feat mechanics,
 * 14 body slot equipment bonuses, active buffs with round countdowns,
 * Armor Class evaluation (Normal, Touch, Flat-Footed), and saving throws.
 */

const RuleEngine = {
  // Built-in SRD Armor reference catalog
  SRD_ARMORS: {
    'padded': { armor: 1, maxDex: 8, acp: 0, type: 'Light' },
    'leather': { armor: 2, maxDex: 6, acp: 0, type: 'Light' },
    'leather armor': { armor: 2, maxDex: 6, acp: 0, type: 'Light' },
    'studded leather': { armor: 3, maxDex: 5, acp: -1, type: 'Light' },
    'studded leather armor': { armor: 3, maxDex: 5, acp: -1, type: 'Light' },
    'chain shirt': { armor: 4, maxDex: 4, acp: -2, type: 'Light' },
    'hide': { armor: 3, maxDex: 4, acp: -3, type: 'Medium' },
    'hide armor': { armor: 3, maxDex: 4, acp: -3, type: 'Medium' },
    'scale mail': { armor: 4, maxDex: 3, acp: -4, type: 'Medium' },
    'chainmail': { armor: 5, maxDex: 2, acp: -5, type: 'Medium' },
    'breastplate': { armor: 5, maxDex: 3, acp: -4, type: 'Medium' },
    'splint mail': { armor: 6, maxDex: 0, acp: -7, type: 'Heavy' },
    'banded mail': { armor: 6, maxDex: 1, acp: -6, type: 'Heavy' },
    'half-plate': { armor: 7, maxDex: 0, acp: -7, type: 'Heavy' },
    'full plate': { armor: 8, maxDex: 1, acp: -6, type: 'Heavy' }
  },

  // Built-in SRD Shield reference catalog
  SRD_SHIELDS: {
    'buckler': { shield: 1, maxDex: null, acp: -1 },
    'light wooden shield': { shield: 1, maxDex: null, acp: -1 },
    'light steel shield': { shield: 1, maxDex: null, acp: -1 },
    'light shield': { shield: 1, maxDex: null, acp: -1 },
    'heavy wooden shield': { shield: 2, maxDex: null, acp: -2 },
    'heavy steel shield': { shield: 2, maxDex: null, acp: -2 },
    'heavy shield': { shield: 2, maxDex: null, acp: -2 },
    'tower shield': { shield: 4, maxDex: 2, acp: -10 }
  },

  // Calculate D&D 3.5e Ability Modifier: floor((score - 10) / 2)
  getAbilityMod(score) {
    return Math.floor(((Number(score) || 10) - 10) / 2);
  },

  // Declarative Master DB lookup helper
  getMasterDbEntry(weapon) {
    if (!weapon) return null;
    const clean = String(typeof weapon === 'object' ? (weapon.masterDbName || weapon.name || '') : weapon).toLowerCase().trim();
    if (!clean) return null;
    const db = (typeof window !== 'undefined' && (window.masterDb || window.MASTER_DB_DATA || window.BUNDLED_MASTER_DB)) || (typeof masterDb !== 'undefined' ? masterDb : []);
    if (!Array.isArray(db) || db.length === 0) return null;
    return db.find(m => m && ((m.name && m.name.toLowerCase().trim() === clean) || (m.masterDbName && m.masterDbName.toLowerCase().trim() === clean))) || null;
  },

  // Check if weapon is Light according to D&D 3.5e RAW rules
  isLightWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (typeof weapon === 'object') {
      if (weapon.isLight || weapon.grip === 'Light' || weapon.category === 'Light' || (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'light'))) {
        return true;
      }
    }

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      if (db.isLight || db.grip === 'Light' || db.category === 'Light' || (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'light'))) {
        return true;
      }
    }

    const standardLightWeapons = [
      'dagger', 'punching dagger', 'gauntlet', 'spiked gauntlet', 'light mace', 'sickle',
      'club', 'short sword', 'kukri', 'handaxe', 'light hammer', 'sap', 'light pick',
      'kama', 'nunchaku', 'sai', 'siangham', 'unarmed strike', 'silahsız'
    ];
    return standardLightWeapons.some(lw => name.includes(lw));
  },

  // Check if weapon is Exotic according to D&D 3.5e RAW rules
  isExoticWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (typeof weapon === 'object') {
      if (weapon.proficiency === 'Exotic' || weapon.category === 'Exotic' || (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'exotic'))) {
        return true;
      }
    }

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      if (db.proficiency === 'Exotic' || db.category === 'Exotic' || (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'exotic'))) {
        return true;
      }
    }

    const baseWepName = name.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const exoticWeapons = [
      'spiked chain', 'bastard sword', 'dwarven waraxe', 'kama', 'nunchaku', 'sai', 'siangham',
      'shuriken', 'whip', 'orc double axe', 'two-bladed sword', 'gnome hooked hammer', 'dire flail',
      'bolas', 'kusari-gama'
    ];
    return exoticWeapons.some(ew => baseWepName.includes(ew) || name.includes(ew));
  },

  // Check if weapon qualifies for Weapon Finesse
  isFinessable(weapon) {
    if (!weapon) return false;
    const name = (weapon.name || '').toLowerCase();
    const tags = Array.isArray(weapon.tags) ? weapon.tags.map(t => t.toLowerCase()) : [];
    const cat = (weapon.category || weapon.type || '').toLowerCase();
    
    // 1. Any Light weapon qualifies for Weapon Finesse per D&D 3.5e RAW (PHB p. 102)
    if (this.isLightWeapon(weapon) || weapon.isLight || tags.includes('light') || tags.includes('finessable') || cat === 'light' || cat.includes('light')) {
      return true;
    }

    // 2. Canonical D&D 3.5e RAW exceptions (usable with Weapon Finesse despite not being light)
    if (name.includes('rapier') || name.includes('whip') || name.includes('spiked chain')) {
      return true;
    }

    // 3. Fallback catalog of standard D&D 3.5e light weapons for untagged / legacy items
    const standardLightWeapons = [
      'dagger', 'punching dagger', 'gauntlet', 'spiked gauntlet', 'light mace', 'sickle',
      'club', 'short sword', 'kukri', 'handaxe', 'light hammer', 'sap', 'light pick',
      'kama', 'nunchaku', 'sai', 'siangham', 'unarmed strike'
    ];
    return standardLightWeapons.some(lw => name.includes(lw));
  },

  // Check if weapon belongs to Shadow Hand discipline
  isShadowHandWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (typeof weapon === 'object') {
      const discipline = (weapon.discipline || '').toLowerCase();
      if (discipline === 'shadow hand') return true;
      if (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'shadow hand')) return true;
    }

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      const discipline = (db.discipline || '').toLowerCase();
      if (discipline === 'shadow hand') return true;
      if (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'shadow hand')) return true;
    }

    const shadowWeapons = ['dagger', 'short sword', 'sai', 'siangham', 'unarmed strike', 'spiked chain'];
    return shadowWeapons.some(sw => name.includes(sw));
  },

  // Check if weapon is Two-Handed according to D&D 3.5e RAW rules
  isTwoHandedWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    const type = (typeof weapon === 'object' ? (weapon.type || weapon.category || '') : '').toLowerCase();
    const slot = (typeof weapon === 'object' ? (weapon.slot || '') : '').toLowerCase();
    const tags = (typeof weapon === 'object' && Array.isArray(weapon.tags)) ? weapon.tags.map(t => String(t).toLowerCase()) : [];
    const desc = (typeof weapon === 'object' ? (weapon.desc || weapon.benefit || weapon.description || '') : '').toLowerCase();

    if (typeof weapon === 'object') {
      if (weapon.isTwoHanded || weapon.twoHanded || weapon.grip === '2-Hand' || weapon.category === 'Two-Handed') return true;
    }
    if (tags.some(t => t.includes('two-hand') || t.includes('2-hand') || t.includes('two handed') || t.includes('çift el') || t.includes('iki el'))) return true;
    if (slot.includes('two-hand') || slot.includes('2-hand') || slot.includes('two handed') || slot.includes('çift el') || slot.includes('iki el')) return true;
    if (desc.includes('2-handed') || desc.includes('two-handed') || desc.includes('two hands') || desc.includes('requires 2 hands') || desc.includes('massive 2-handed') || desc.includes('çift el') || desc.includes('iki el')) return true;

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      if (db.isTwoHanded || db.twoHanded || db.grip === '2-Hand' || db.category === 'Two-Handed') return true;
      if (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase().includes('two-hand') || String(t).toLowerCase().includes('2-hand'))) return true;
    }

    // Standard D&D 3.5e Two-Handed Weapons (including Turkish names and SRD weapons)
    const twoHandedWeapons = [
      'jovar', 'greatsword', 'greataxe', 'greatclub', 'falchion', 'scythe', 'halberd',
      'heavy flail', 'guisarme', 'glaive', 'ranseur', 'spiked chain',
      'orc double axe', 'gnome hooked hammer', 'two-bladed sword', 'dire flail',
      'longspear', 'quarterstaff', 'longbow', 'composite longbow',
      'shortbow', 'composite shortbow', 'heavy crossbow', 'light crossbow',
      'yay', 'arbalet', 'kundak', 'büyük kılıç', 'büyük balta', 'tırpan', 'asa'
    ];

    if (twoHandedWeapons.some(w => name.includes(w))) {
      return true;
    }

    // Spear is two-handed in 3.5e; shortspear is one-handed
    if ((name.includes('spear') && !name.includes('shortspear')) || (name.includes('mızrak') && !name.includes('kısa mızrak'))) {
      return true;
    }

    return false;
  },

  // Check if character possesses feat/trait allowing two-handed weapons or oversized weapons in one hand
  hasOversizedWeaponFeat(character) {
    if (!character) return false;
    const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());
    const abilities = (character.specialAbilities || []).map(a => (typeof a === 'string' ? a : a.name || '').toLowerCase());
    const all = [...feats, ...abilities];
    return all.some(f => 
      f.includes('monkey grip') || 
      f.includes('oversized two-weapon fighting') || 
      f.includes('oversized weapon fighting') || 
      f.includes('oversized weapon') || 
      f.includes('powerful build') ||
      f.includes('jotunbrud') ||
      f.includes('tek elle çift el')
    );
  },

  // Resolve bonus stacking according to D&D 3.5e RAW rules
  resolveBonusStacking(bonusList) {
    const stackingTypes = ['dodge', 'untyped', 'circumstance', 'synergy', 'racial'];
    const buckets = {};
    let total = 0;

    bonusList.forEach(item => {
      const type = (item.type || 'untyped').toLowerCase();
      const val = Number(item.val) || 0;

      // Penalties always stack in D&D 3.5e
      if (val < 0) {
        total += val;
        return;
      }

      if (stackingTypes.includes(type)) {
        total += val;
      } else {
        if (!buckets[type] || val > buckets[type]) {
          buckets[type] = val;
        }
      }
    });

    Object.values(buckets).forEach(v => {
      total += v;
    });

    return total;
  },

  // Parse modifiers and stat bonuses from an equipment item (body slot or gear pool)
  parseItemModifiers(item, masterDb = []) {
    if (!item || !item.name || item.name === '-') return null;

    const res = {
      name: item.name,
      category: item.category || 'Other',
      armorCategory: null,
      effectiveArmorCategory: null,
      isMithral: false,
      armor: 0,
      shield: 0,
      natural: 0,
      naturalBonusType: 'natural',
      deflection: 0,
      dodge: 0,
      maxDex: null,
      acp: 0,
      resistance: 0,
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0,
      attBonus: 0,
      dmgBonus: 0,
      fort: 0,
      ref: 0,
      will: 0,
      speed: 0,
      bonusType: item.bonusType || 'Untyped'
    };

    const cleanName = item.name.toLowerCase().trim();
    const cleanRef = (item.masterDbName || '').toLowerCase().trim();

    // 1. Look up in Master DB
    let dbEntry = null;
    if (Array.isArray(masterDb) && masterDb.length > 0) {
      dbEntry = masterDb.find(m => {
        const mClean = (m.name || '').toLowerCase().trim();
        return mClean === cleanName || (cleanRef && mClean === cleanRef);
      });
    }

    if (dbEntry) {
      if (dbEntry.acBonus !== undefined && dbEntry.acBonus !== '') {
        const acVal = Number(dbEntry.acBonus) || 0;
        const bType = (dbEntry.bonusType || dbEntry.type || '').toLowerCase();
        if (bType.includes('shield') || (dbEntry.slot && dbEntry.slot.toLowerCase().includes('shield'))) {
          res.shield = acVal;
        } else if (bType.includes('deflection') || (dbEntry.slot && dbEntry.slot.toLowerCase().includes('ring'))) {
          res.deflection = acVal;
        } else if (bType.includes('natural') || (dbEntry.slot && dbEntry.slot.toLowerCase().includes('neck'))) {
          res.natural = acVal;
          res.naturalBonusType = dbEntry.bonusType || 'natural';
        } else if (bType.includes('dodge')) {
          res.dodge = acVal;
        } else {
          res.armor = acVal;
        }
      }
      if (dbEntry.naturalBonus) {
        res.natural = Math.max(res.natural, Number(dbEntry.naturalBonus) || 0);
        if (dbEntry.bonusType) res.naturalBonusType = dbEntry.bonusType;
      }
      if (dbEntry.deflection || dbEntry.deflectionBonus) res.deflection = Math.max(res.deflection, Number(dbEntry.deflection || dbEntry.deflectionBonus) || 0);
      if (dbEntry.dodgeBonus) res.dodge = Math.max(res.dodge, Number(dbEntry.dodgeBonus) || 0);
      if (dbEntry.resistance) res.resistance = Math.max(res.resistance, Number(dbEntry.resistance) || 0);
      if (dbEntry.maxDex !== undefined && dbEntry.maxDex !== '') res.maxDex = Number(dbEntry.maxDex);
      if (dbEntry.checkPenalty !== undefined && dbEntry.checkPenalty !== '') res.acp = Number(dbEntry.checkPenalty);
      if (dbEntry.strBonus) { res.str = Number(dbEntry.strBonus) || 0; res.bonusType = dbEntry.bonusType || 'Enhancement'; }
      if (dbEntry.dexBonus) { res.dex = Number(dbEntry.dexBonus) || 0; res.bonusType = dbEntry.bonusType || 'Enhancement'; }
      if (dbEntry.conBonus) { res.con = Number(dbEntry.conBonus) || 0; res.bonusType = dbEntry.bonusType || 'Enhancement'; }
      if (dbEntry.intBonus) { res.int = Number(dbEntry.intBonus) || 0; res.bonusType = dbEntry.bonusType || 'Enhancement'; }
      if (dbEntry.wisBonus) { res.wis = Number(dbEntry.wisBonus) || 0; res.bonusType = dbEntry.bonusType || 'Enhancement'; }
      if (dbEntry.chaBonus) { res.cha = Number(dbEntry.chaBonus) || 0; res.bonusType = dbEntry.bonusType || 'Enhancement'; }
      if (dbEntry.attBonus) res.attBonus = Number(dbEntry.attBonus) || 0;
      if (dbEntry.dmgBonus) res.dmgBonus = Number(dbEntry.dmgBonus) || 0;
      if (dbEntry.fortBonus) res.fort = Number(dbEntry.fortBonus) || 0;
      if (dbEntry.refBonus) res.ref = Number(dbEntry.refBonus) || 0;
      if (dbEntry.willBonus) res.will = Number(dbEntry.willBonus) || 0;
      if (dbEntry.speedBonus) res.speed = Number(dbEntry.speedBonus) || 0;
      if (dbEntry.bonusType) res.bonusType = dbEntry.bonusType;
      if (dbEntry.dailyCharges) res.dailyCharges = JSON.parse(JSON.stringify(dbEntry.dailyCharges));
      if (dbEntry.chargeOptions) res.chargeOptions = JSON.parse(JSON.stringify(dbEntry.chargeOptions));
    }

    // 2. Direct item properties
    if (item.acBonus) {
      const acVal = Number(item.acBonus) || 0;
      const bType = (item.bonusType || item.category || '').toLowerCase();
      if (bType.includes('shield')) res.shield = acVal;
      else if (bType.includes('deflection')) res.deflection = acVal;
      else if (bType.includes('natural')) {
        res.natural = acVal;
        res.naturalBonusType = item.bonusType || 'natural';
      }
      else if (bType.includes('dodge')) res.dodge = acVal;
      else res.armor = acVal;
    }
    if (item.naturalBonus) {
      res.natural = Math.max(res.natural, Number(item.naturalBonus) || 0);
      if (item.bonusType) res.naturalBonusType = item.bonusType;
    }
    if (item.deflection || item.deflectionBonus) res.deflection = Math.max(res.deflection, Number(item.deflection || item.deflectionBonus) || 0);
    if (item.resistance) res.resistance = Math.max(res.resistance, Number(item.resistance) || 0);
    if (item.maxDex !== undefined && item.maxDex !== null) res.maxDex = Number(item.maxDex);
    if (item.checkPenalty !== undefined && item.checkPenalty !== null) res.acp = Number(item.checkPenalty);
    if (item.strBonus) { res.str = Number(item.strBonus) || 0; res.bonusType = item.bonusType || 'Enhancement'; }
    if (item.dexBonus) { res.dex = Number(item.dexBonus) || 0; res.bonusType = item.bonusType || 'Enhancement'; }
    if (item.conBonus) { res.con = Number(item.conBonus) || 0; res.bonusType = item.bonusType || 'Enhancement'; }
    if (item.intBonus) { res.int = Number(item.intBonus) || 0; res.bonusType = item.bonusType || 'Enhancement'; }
    if (item.wisBonus) { res.wis = Number(item.wisBonus) || 0; res.bonusType = item.bonusType || 'Enhancement'; }
    if (item.chaBonus) { res.cha = Number(item.chaBonus) || 0; res.bonusType = item.bonusType || 'Enhancement'; }
    if (item.dailyCharges) res.dailyCharges = JSON.parse(JSON.stringify(item.dailyCharges));
    if (item.chargeOptions) res.chargeOptions = JSON.parse(JSON.stringify(item.chargeOptions));

    // 3. Fallback to SRD Catalogs & Intelligent Heuristics if AC/stat is still 0
    const fullText = `${item.name} ${item.desc || ''} ${dbEntry?.benefit || ''}`.toLowerCase();
    const isWeaponOrShieldOrArmor = (
      item.category === 'Weapon' ||
      item.category === 'Armor' ||
      item.category === 'Shield' ||
      dbEntry?.type === 'Weapon' ||
      dbEntry?.type === 'Armor' ||
      dbEntry?.type === 'Shield'
    );

    // Check SRD Armors (sort keys by length descending so compound names like 'studded leather' match before 'leather')
    if (res.armor === 0 && (item.category === 'Armor' || (item.slot && item.slot.toLowerCase().includes('armor')))) {
      const sortedArmorKeys = Object.keys(this.SRD_ARMORS).sort((a, b) => b.length - a.length);
      for (const key of sortedArmorKeys) {
        if (cleanName.includes(key)) {
          const val = this.SRD_ARMORS[key];
          let baseArmor = val.armor;
          let mDex = val.maxDex;
          let checkPen = val.acp;
          let armorType = val.type; // 'Light', 'Medium', 'Heavy'

          // Mithral modifier (RAW SRD / DMG p. 284): +2 maxDex, ACP reduced by 3 (towards 0), category reduced by 1 step
          const isMithral = cleanName.includes('mithral') || fullText.includes('mithral');
          if (isMithral) {
            res.isMithral = true;
            mDex = mDex !== null ? mDex + 2 : null;
            checkPen = Math.min(0, checkPen + 3);
            if (armorType === 'Heavy') armorType = 'Medium';
            else if (armorType === 'Medium') armorType = 'Light';
          }

          // Check enhancement bonus like +1, +2, +3...
          const enhMatch = cleanName.match(/\+(\d+)/);
          if (enhMatch) {
            baseArmor += Number(enhMatch[1]);
          }

          res.armor = baseArmor;
          res.armorCategory = val.type;
          res.effectiveArmorCategory = armorType;
          if (res.maxDex === null) res.maxDex = mDex;
          if (res.acp === 0) res.acp = checkPen;
          res.bonusType = 'Armor';
          break;
        }
      }
    }

    // Check SRD Shields
    if (res.shield === 0 && (item.category === 'Shield' || cleanName.includes('shield') || cleanName.includes('buckler'))) {
      for (const [key, val] of Object.entries(this.SRD_SHIELDS)) {
        if (cleanName.includes(key)) {
          let baseShield = val.shield;
          let mDex = val.maxDex;
          let checkPen = val.acp;

          if (cleanName.includes('darkwood') || fullText.includes('darkwood')) {
            checkPen = Math.min(0, checkPen + 2);
          }
          const enhMatch = cleanName.match(/\+(\d+)/);
          if (enhMatch) {
            baseShield += Number(enhMatch[1]);
          }

          res.shield = baseShield;
          if (val.maxDex !== null && res.maxDex === null) res.maxDex = mDex;
          if (res.acp === 0) res.acp = checkPen;
          res.bonusType = 'Shield';
          break;
        }
      }
    }

    // Heuristic regex parsers for Wondrous Items & Accessories
    // Deflection
    if (res.deflection === 0 && (cleanName.includes('protection') || fullText.includes('deflection bonus'))) {
      const match = fullText.match(/\+(\d+)\s*(?:deflection|saptırma)/i) || (cleanName.includes('protection') ? cleanName.match(/\+(\d+)/) : null);
      if (match) {
        res.deflection = Number(match[1]);
        res.bonusType = 'Deflection';
      }
    }

    // Natural Armor
    if (res.natural === 0 && (cleanName.includes('natural armor') || fullText.includes('natural armor bonus') || cleanName.includes('amulet of natural armor'))) {
      const match = fullText.match(/\+(\d+)\s*(?:natural|doğal)/i) || (cleanName.includes('natural armor') ? cleanName.match(/\+(\d+)/) : null);
      if (match) {
        res.natural = Number(match[1]);
        res.bonusType = 'Natural';
      }
    }

    // Bracers of Armor
    if (res.armor === 0 && cleanName.includes('bracers of armor')) {
      const match = cleanName.match(/\+(\d+)/);
      if (match) {
        res.armor = Number(match[1]);
        res.bonusType = 'Armor';
      }
    }

    // Resistance bonus to saves (Cloak of Resistance)
    if (res.resistance === 0 && (cleanName.includes('resistance') || fullText.includes('resistance bonus'))) {
      const match = fullText.match(/\+(\d+)\s*resistance/i) || (cleanName.includes('resistance') ? cleanName.match(/\+(\d+)/) : null);
      if (match) {
        res.resistance = Number(match[1]);
      }
    }

    // Ability Enhancements (Belt of Giant Strength, Gloves of Dexterity, etc.)
    // Only match explicit "+X [enhancement] bonus to <Stat>" in text, or "+X" in item name if the item name itself is a stat-enhancing item (never on weapons/armors like Rapier +2!)
    if (!isWeaponOrShieldOrArmor) {
      if (res.str === 0) {
        const match = fullText.match(/\+(\d+)\s*(?:enhancement\s*)?bonus\s+to\s+(?:strength|str|kuvvet)\b/i)
          || fullText.match(/bonus\s+to\s+(?:strength|str)\s+of\s+\+(\d+)/i)
          || ((cleanName.includes('giant strength') || cleanName.includes('ogre power') || cleanName.includes('strength')) ? cleanName.match(/\+(\d+)/) : null);
        if (match) { res.str = Number(match[1]); res.bonusType = 'Enhancement'; }
      }
      if (res.dex === 0) {
        const match = fullText.match(/\+(\d+)\s*(?:enhancement\s*)?bonus\s+to\s+(?:dexterity|dex|çeviklik)\b/i)
          || fullText.match(/bonus\s+to\s+(?:dexterity|dex)\s+of\s+\+(\d+)/i)
          || (cleanName.includes('dexterity') ? cleanName.match(/\+(\d+)/) : null);
        if (match) { res.dex = Number(match[1]); res.bonusType = 'Enhancement'; }
      }
      if (res.con === 0) {
        const match = fullText.match(/\+(\d+)\s*(?:enhancement\s*)?bonus\s+to\s+(?:constitution|con|dayanıklılık)\b/i)
          || fullText.match(/bonus\s+to\s+(?:constitution|con)\s+of\s+\+(\d+)/i)
          || ((cleanName.includes('health') || cleanName.includes('constitution')) ? cleanName.match(/\+(\d+)/) : null);
        if (match) { res.con = Number(match[1]); res.bonusType = 'Enhancement'; }
      }
      if (res.int === 0) {
        const match = fullText.match(/\+(\d+)\s*(?:enhancement\s*)?bonus\s+to\s+(?:intelligence|int|zeka)\b/i)
          || fullText.match(/bonus\s+to\s+(?:intelligence|int)\s+of\s+\+(\d+)/i)
          || ((cleanName.includes('intellect') || cleanName.includes('intelligence')) ? cleanName.match(/\+(\d+)/) : null);
        if (match) { res.int = Number(match[1]); res.bonusType = 'Enhancement'; }
      }
      if (res.wis === 0) {
        const match = fullText.match(/\+(\d+)\s*(?:enhancement\s*)?bonus\s+to\s+(?:wisdom|wis|bilgelik)\b/i)
          || fullText.match(/bonus\s+to\s+(?:wisdom|wis)\s+of\s+\+(\d+)/i)
          || ((cleanName.includes('wisdom') || cleanName.includes('periapt')) ? cleanName.match(/\+(\d+)/) : null);
        if (match) { res.wis = Number(match[1]); res.bonusType = 'Enhancement'; }
      }
      if (res.cha === 0) {
        const match = fullText.match(/\+(\d+)\s*(?:enhancement\s*)?bonus\s+to\s+(?:charisma|cha|karizma)\b/i)
          || fullText.match(/bonus\s+to\s+(?:charisma|cha)\s+of\s+\+(\d+)/i)
          || (cleanName.includes('charisma') ? cleanName.match(/\+(\d+)/) : null);
        if (match) { res.cha = Number(match[1]); res.bonusType = 'Enhancement'; }
      }
    }

    // Speed bonus (Boots of Striding and Springing)
    if (res.speed === 0 && (cleanName.includes('striding') || fullText.includes('speed'))) {
      const match = fullText.match(/\+(\d+)\s*ft(?:\s*land)?\s*speed/i);
      if (match) res.speed = Number(match[1]);
    }

    // Max Dex & ACP in description
    if (res.maxDex === null) {
      const mDexMatch = fullText.match(/max dex\s*\+?(\d+)/i);
      if (mDexMatch) res.maxDex = Number(mDexMatch[1]);
    }
    if (res.acp === 0) {
      const acpMatch = fullText.match(/check penalty\s*(-?\d+)/i) || fullText.match(/acp\s*(-?\d+)/i);
      if (acpMatch) res.acp = Number(acpMatch[1]);
    }

    return res;
  },

  // Standard D&D 3.5e default buffs catalog
  getDefaultBuffs() {
    return [
      {
        id: "buff_mage_armor",
        name: "Mage Armor",
        source: "Spell (Büyü)",
        category: "AC",
        active: false,
        rounds: 50,
        durationText: "1 saat / CL (5 Saat)",
        bonusType: "Armor",
        acBonus: 4,
        notes: "+4 Zırh (Armor) AC bonusu (Zırhla stackleşmez, MAX alınır)"
      },
      {
        id: "buff_shield",
        name: "Shield (Büyü)",
        source: "Spell (Büyü)",
        category: "AC",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL (5 Dk)",
        bonusType: "Shield",
        acBonus: 4,
        notes: "+4 Kalkan (Shield) AC bonusu, Magic Missile büyüsünü engeller"
      },
      {
        id: "buff_bulls_str",
        name: "Bull's Strength",
        source: "Spell / Potion",
        category: "Stat",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL (5 Dk)",
        bonusType: "Enhancement",
        strBonus: 4,
        notes: "+4 Enhancement STR (Dev Kemeri ile stackleşmez, MAX alınır)"
      },
      {
        id: "buff_cats_grace",
        name: "Cat's Grace",
        source: "Spell / Potion",
        category: "Stat",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL (5 Dk)",
        bonusType: "Enhancement",
        dexBonus: 4,
        notes: "+4 Enhancement DEX (Eldiven ile stackleşmez, MAX alınır)"
      },
      {
        id: "buff_bears_endurance",
        name: "Bear's Endurance",
        source: "Spell / Potion",
        category: "Stat",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL",
        bonusType: "Enhancement",
        conBonus: 4,
        notes: "+4 Enhancement CON (+2 HP/seviye, Fortitude artışı)"
      },
      {
        id: "buff_haste",
        name: "Haste (Acele)",
        source: "Spell (Büyü)",
        category: "Combat",
        active: false,
        rounds: 6,
        durationText: "1 tur / CL (6 Tur)",
        bonusType: "Dodge",
        attBonus: 1,
        dodgeBonus: 1,
        refBonus: 1,
        speedBonus: 30,
        notes: "+1 Saldırı, +1 Dodge AC, +1 Refl, +30 ft Hız, Tam turda +1 ek saldırı"
      },
      {
        id: "buff_bless",
        name: "Bless (Kutsama)",
        source: "Spell (Büyü)",
        category: "Morale",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL",
        bonusType: "Morale",
        attBonus: 1,
        notes: "+1 Morale saldırı zarlarına ve korku kurtarma zarlarına"
      },
      {
        id: "buff_prayer",
        name: "Prayer (Dua)",
        source: "Spell (Büyü)",
        category: "Luck",
        active: false,
        rounds: 6,
        durationText: "1 tur / CL",
        bonusType: "Luck",
        attBonus: 1,
        dmgBonus: 1,
        fortBonus: 1,
        refBonus: 1,
        willBonus: 1,
        skillBonus: 1,
        notes: "+1 Luck saldırı, hasar, kurtarma ve beceri zarlarına"
      },
      {
        id: "buff_barkskin",
        name: "Barkskin",
        source: "Spell (Büyü)",
        category: "AC",
        active: false,
        rounds: 50,
        durationText: "10 dk / CL",
        bonusType: "Natural",
        naturalBonus: 2,
        notes: "+2 Doğal Zırh (Natural Armor) bonusu"
      },
      {
        id: "buff_shield_of_faith",
        name: "Shield of Faith",
        source: "Spell (Büyü)",
        category: "AC",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL",
        bonusType: "Deflection",
        deflectionBonus: 2,
        notes: "+2 Saptırma (Deflection) AC bonusu"
      },
      {
        id: "buff_divine_favor",
        name: "Divine Favor",
        source: "Spell (Büyü)",
        category: "Combat",
        active: false,
        rounds: 10,
        durationText: "1 dk (10 Tur)",
        bonusType: "Luck",
        attBonus: 2,
        dmgBonus: 2,
        notes: "+2 Luck saldırı ve silah hasarı bonusu"
      },
      {
        id: "buff_punishing_stance",
        name: "Punishing Stance",
        source: "Stance (Duruş)",
        category: "Stance",
        active: true,
        rounds: null,
        durationText: "Sürekli",
        bonusType: "Untyped",
        acPenalty: 2,
        dmgDice: "1d6",
        notes: "+1d6 yakın dövüş silah hasarı, -2 AC savunma cezası"
      }
    ];
  },

  // Standard D&D 3.5e RAW default debuffs catalog with Parent-Child relationships
  getDefaultDebuffs() {
    return [
      {
        id: "debuff_energy_drain_4",
        name: "Energy Drain (-4 Lvl)",
        source: "Spell / Undead",
        category: "Debuff",
        isDebuff: true,
        active: false,
        rounds: null,
        durationText: "Kalıcı (Restoration gerektirir)",
        bonusType: "Penalty",
        negativeLevels: 4,
        notes: "D&D 3.5e RAW: 4 Negatif Seviye! -4 Saldırı, -4 Kurtarma Zarları, -4 Beceri/Yetenek, -20 Max/Mevcut HP, -4 Efektif Caster Level.",
        children: [
          { id: "child_ed_att", name: "↳ -4 Saldırı Zarları (All Attacks)", attBonus: -4, bonusType: "Penalty" },
          { id: "child_ed_saves", name: "↳ -4 Kurtarma Zarları (Fort, Ref, Will)", fortBonus: -4, refBonus: -4, willBonus: -4, bonusType: "Penalty" },
          { id: "child_ed_skills", name: "↳ -4 Beceri & Yetenek Testleri", skillBonus: -4, bonusType: "Penalty" },
          { id: "child_ed_hp", name: "↳ -20 Can Puanı (-5 HP / Seviye)", hpPenalty: 20, bonusType: "Penalty" },
          { id: "child_ed_cl", name: "↳ -4 Caster Level (Efektif Seviye)", clPenalty: 4, bonusType: "Penalty" }
        ]
      },
      {
        id: "debuff_sickened",
        name: "Sickened (Midesi Bulanmış)",
        source: "Condition (Durum)",
        category: "Debuff",
        isDebuff: true,
        active: false,
        rounds: 10,
        durationText: "10 Tur",
        bonusType: "Penalty",
        notes: "D&D 3.5e RAW: -2 saldırı zarları, silah hasar zarları, kurtarma zarları, beceri ve yetenek testleri",
        children: [
          { id: "child_sick_att", name: "↳ -2 Saldırı & Hasar Zarları", attBonus: -2, dmgBonus: -2, bonusType: "Penalty" },
          { id: "child_sick_saves", name: "↳ -2 Tüm Kurtarma Zarları", fortBonus: -2, refBonus: -2, willBonus: -2, bonusType: "Penalty" },
          { id: "child_sick_skills", name: "↳ -2 Beceri & Yetenek Testleri", skillBonus: -2, bonusType: "Penalty" }
        ]
      },
      {
        id: "debuff_shaken",
        name: "Shaken (Korkmuş)",
        source: "Condition (Durum)",
        category: "Debuff",
        isDebuff: true,
        active: false,
        rounds: 10,
        durationText: "10 Tur",
        bonusType: "Morale Penalty",
        notes: "D&D 3.5e RAW: Korku durumu. -2 saldırı zarları, kurtarma zarları, beceri ve yetenek testleri",
        children: [
          { id: "child_shaken_att", name: "↳ -2 Saldırı Zarları", attBonus: -2, bonusType: "Penalty" },
          { id: "child_shaken_saves", name: "↳ -2 Kurtarma Zarları", fortBonus: -2, refBonus: -2, willBonus: -2, bonusType: "Penalty" },
          { id: "child_shaken_skills", name: "↳ -2 Beceri & Yetenek Testleri", skillBonus: -2, bonusType: "Penalty" }
        ]
      },
      {
        id: "debuff_fatigued",
        name: "Fatigued (Yorgun)",
        source: "Condition (Durum)",
        category: "Debuff",
        isDebuff: true,
        active: false,
        rounds: null,
        durationText: "8 Saat Dinlenme",
        bonusType: "Penalty",
        notes: "D&D 3.5e RAW: Koşamaz veya şarj edemez. -2 STR ve -2 DEX cezası alır.",
        children: [
          { id: "child_fatigue_str", name: "↳ -2 STR (-1 Saldırı & Hasar)", strBonus: -2, bonusType: "Penalty" },
          { id: "child_fatigue_dex", name: "↳ -2 DEX (-1 Refl & AC)", dexBonus: -2, bonusType: "Penalty" }
        ]
      },
      {
        id: "debuff_entangled",
        name: "Entangled (Dolaşmış)",
        source: "Condition (Durum)",
        category: "Debuff",
        isDebuff: true,
        active: false,
        rounds: 5,
        durationText: "5 Tur",
        bonusType: "Penalty",
        notes: "D&D 3.5e RAW: Yarı hareket hızı, koşamaz/şarj edemez, saldırı zarlarına -2, DEX'e -4 (-2 AC ve -2 Refl)",
        children: [
          { id: "child_entangled_att", name: "↳ -2 Saldırı Zarları", attBonus: -2, bonusType: "Penalty" },
          { id: "child_entangled_dex", name: "↳ -4 DEX (-2 AC & -2 Refl)", dexBonus: -4, bonusType: "Penalty" },
          { id: "child_entangled_speed", name: "↳ Yarı Hareket Hızı (Max 15 ft)", speedPenalty: 15, bonusType: "Penalty" }
        ]
      },
      {
        id: "debuff_slow",
        name: "Slow (Yavaşlatma Büyüsü)",
        source: "Spell (Büyü)",
        category: "Debuff",
        isDebuff: true,
        active: false,
        rounds: 6,
        durationText: "1 tur / CL (6 Tur)",
        bonusType: "Penalty",
        notes: "D&D 3.5e RAW: Turda sadece tek bir eylem (Move veya Standard), -1 AC, -1 Saldırı, -1 Refl, Yarı Hız",
        children: [
          { id: "child_slow_ac", name: "↳ -1 AC Cezası", acBonus: -1, bonusType: "Penalty" },
          { id: "child_slow_att", name: "↳ -1 Saldırı Zarları", attBonus: -1, bonusType: "Penalty" },
          { id: "child_slow_ref", name: "↳ -1 Reflex Kurtarma Zarı", refBonus: -1, bonusType: "Penalty" },
          { id: "child_slow_speed", name: "↳ Yarı Hareket Hızı (Max 15 ft)", speedPenalty: 15, bonusType: "Penalty" }
        ]
      }
    ];
  },

  // Evaluate dynamic scaling bonuses based on character level (e.g. "2+1/4lvl", "+1 per 3 levels", "lvl*2")
  evaluateScalingBonus(formulaOrText, charLvl = 1) {
    if (!formulaOrText) return 0;
    const str = String(formulaOrText).toLowerCase().trim();
    const lvl = Number(charLvl) || 1;

    // 1. "X + 1/Ylvl" or "X + lvl/Y" or "X + 1/Y level" (e.g. "2+1/4lvl", "2 + 1/4 character level")
    const basePlusFraction = str.match(/(\d+)\s*\+\s*(?:1\/(\d+)|(?:lvl|level)\/(\d+))\s*(?:lvl|level)?/i);
    if (basePlusFraction) {
      const base = parseInt(basePlusFraction[1], 10);
      const divisor = parseInt(basePlusFraction[2] || basePlusFraction[3], 10) || 1;
      return base + Math.floor(lvl / divisor);
    }

    // 2. "+N every/per Y levels" or "1/Ylvl" or "1/Y level" (e.g. "1 per 3 levels", "1 every 2 levels", "1/3lvl")
    const fractionOnly = str.match(/(?:(?:\+?(\d+)\s*(?:every|her|per)\s*(\d+)\s*(?:lvl|level|seviye))|1\/(\d+)\s*(?:lvl|level)?)/i);
    if (fractionOnly) {
      const step = parseInt(fractionOnly[1], 10) || 1;
      const divisor = parseInt(fractionOnly[2] || fractionOnly[3], 10) || 1;
      return Math.floor(lvl / divisor) * step;
    }

    // 3. "lvl*X" or "X per level" (e.g. "lvl*2", "1 per level", "equal to character level")
    const perLvl = str.match(/(?:(?:lvl|level)\s*\*\s*(\d+)|(\d+)\s*per\s*level|equal\s*to\s*(?:character\s*)?level)/i);
    if (perLvl) {
      if (str.includes('equal to')) return lvl;
      const mult = parseInt(perLvl[1] || perLvl[2], 10) || 1;
      return lvl * mult;
    }

    // 4. Direct integer "+N" or "N"
    const directInt = str.match(/^\+?(\d+)$/);
    if (directInt) {
      return parseInt(directInt[1], 10);
    }

    return 0;
  },

  // Central Dynamic Spell Scaling Resolver (D&D 3.5e RAW)
  // Calculates dynamic dice formula, projectile counts (missiles/rays), static bonuses, and display tags based on Caster Level (CL)
  resolveSpellDynamicScaling(spell, casterLevel = 1) {
    if (!spell) {
      return {
        scaled: false,
        name: '',
        casterLevel: 1,
        projectiles: 0,
        projectileName: '',
        diceCount: 0,
        dieSides: 0,
        staticBonus: 0,
        diceFormula: '',
        dmgType: '',
        displayText: '',
        descDetail: ''
      };
    }

    const cl = Math.max(1, Number(casterLevel) || 1);
    const rawName = (spell.name || '').trim();
    const cleanName = rawName.toLowerCase();
    const dmgType = spell.dmgType || (cleanName.includes('fire') ? 'Fire' : (cleanName.includes('frost') || cleanName.includes('cold') ? 'Cold' : (cleanName.includes('acid') ? 'Acid' : (cleanName.includes('shock') || cleanName.includes('lightning') ? 'Electricity' : (cleanName.includes('magic missile') ? 'Force' : 'Büyü Hasarı')))));

    // 1. MAGIC MISSILE (PHB p.251): 1 missile at CL 1, +1 missile per 2 levels beyond 1st, max 5 missiles at CL 9+ (1d4+1 per missile)
    if (cleanName.includes('magic missile') || cleanName.includes('büyü füzesi')) {
      const missiles = Math.min(5, Math.max(1, Math.floor((cl + 1) / 2)));
      const diceCount = missiles;
      const dieSides = 4;
      const staticBonus = missiles;
      const diceFormula = `${diceCount}d4+${staticBonus}`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: missiles,
        projectileName: 'Füze',
        diceCount,
        dieSides,
        staticBonus,
        diceFormula,
        dmgType: 'Force',
        displayText: `${missiles} Füze (${diceFormula} Force)`,
        descDetail: `CL ${cl}: ${missiles} adet füze fırlatılır (her biri 1d4+1 Force)`
      };
    }

    // 2. SCORCHING RAY (PHB p.274): 1 ray (4d6 fire), +1 ray per 4 levels above 3rd (2 rays at 7th, 3 rays at 11th, max 3 rays)
    if (cleanName.includes('scorching ray') || cleanName.includes('yakıcı ışın')) {
      const rays = Math.min(3, Math.max(1, 1 + Math.floor(Math.max(0, cl - 3) / 4)));
      const diceCount = rays * 4;
      const dieSides = 6;
      const staticBonus = 0;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: rays,
        projectileName: 'Işın',
        diceCount,
        dieSides,
        staticBonus,
        diceFormula,
        dmgType: 'Fire',
        displayText: `${rays} Işın (${diceFormula} Fire)`,
        descDetail: `CL ${cl}: ${rays} adet ışın (her biri 4d6 Fire)`
      };
    }

    // 3. SHOCKING GRASP (PHB p.279): 1d6 per level (max 5d6 electricity)
    if (cleanName.includes('shocking grasp')) {
      const diceCount = Math.min(5, Math.max(1, cl));
      const dieSides = 6;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Dokunuş',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Electricity',
        displayText: `${diceFormula} Electricity (+3 vs Metal)`,
        descDetail: `CL ${cl}: ${diceCount}d6 elektrik hasarı (tavan 5d6)`
      };
    }

    // 4. FIREBALL (PHB p.231) & LIGHTNING BOLT (PHB p.248): 1d6 per level (max 10d6)
    if (cleanName === 'fireball' || cleanName.includes('lightning bolt') || cleanName === 'alevtoptu') {
      const isWand = (spell.source || '').toLowerCase().includes('wand') || cleanName.includes('wand') || (spell.parent || '').toLowerCase().includes('wand');
      const effectiveCl = isWand ? Math.min(cl, 5) : cl;
      const diceCount = Math.min(10, Math.max(1, effectiveCl));
      const dieSides = 6;
      const fDmgType = cleanName.includes('lightning') ? 'Electricity' : 'Fire';
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Patlama',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: fDmgType,
        displayText: `${diceFormula} ${fDmgType}`,
        descDetail: `CL ${cl}: ${diceCount}d6 ${fDmgType} (Reflex yarısı)`
      };
    }

    // 5. CONE OF COLD (PHB p.212): 1d6 per level (max 15d6 cold)
    if (cleanName.includes('cone of cold')) {
      const diceCount = Math.min(15, Math.max(1, cl));
      const dieSides = 6;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Koni',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Cold',
        displayText: `${diceFormula} Cold`,
        descDetail: `CL ${cl}: ${diceCount}d6 soğuk hasarı`
      };
    }

    // 6. CHAIN LIGHTNING (PHB p.208): 1d6 per level (max 20d6)
    if (cleanName.includes('chain lightning')) {
      const diceCount = Math.min(20, Math.max(1, cl));
      const dieSides = 6;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Yıldırım',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Electricity',
        displayText: `${diceFormula} Electricity`,
        descDetail: `CL ${cl}: ${diceCount}d6 elektrik hasarı`
      };
    }

    // 7. DISINTEGRATE (PHB p.222): 2d6 per level (max 40d6)
    if (cleanName.includes('disintegrate')) {
      const diceCount = Math.min(40, Math.max(2, cl * 2));
      const dieSides = 6;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Işın',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Untyped',
        displayText: `${diceFormula} Ayrışma Hasarı`,
        descDetail: `CL ${cl}: ${diceCount}d6 ayrışma hasarı (Fort kurtulursa 5d6)`
      };
    }

    // 8. POLAR RAY (PHB p.262): 1d6 per level (max 25d6 cold)
    if (cleanName.includes('polar ray')) {
      const diceCount = Math.min(25, Math.max(1, cl));
      const dieSides = 6;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Kutup Işını',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Cold',
        displayText: `${diceFormula} Cold`,
        descDetail: `CL ${cl}: ${diceCount}d6 soğuk hasarı`
      };
    }

    // 9. SEARING LIGHT (PHB p.275):
    // Living: 1d8 / 2 CL (max 5d8), Undead: 1d6 / CL (max 10d6) or 1d8 / CL (max 10d8) if light vulnerable, Construct: 1d6 / 2 CL (max 5d6)
    if (cleanName.includes('searing light') || cleanName.includes('kavurucu ışık')) {
      let diceCount = 1, dieSides = 8, capDesc = '';
      if (cleanName.includes('ışığa hassas') || cleanName.includes('vulnerable')) {
        diceCount = Math.min(10, Math.max(1, cl));
        dieSides = 8;
        capDesc = `${diceCount}d8 (Işığa Hassas Undead)`;
      } else if (cleanName.includes('undead')) {
        diceCount = Math.min(10, Math.max(1, cl));
        dieSides = 6;
        capDesc = `${diceCount}d6 (Undead)`;
      } else if (cleanName.includes('construct') || cleanName.includes('cansız')) {
        diceCount = Math.min(5, Math.max(1, Math.floor(cl / 2)));
        dieSides = 6;
        capDesc = `${diceCount}d6 (Construct / Cansız)`;
      } else {
        diceCount = Math.min(5, Math.max(1, Math.floor(cl / 2)));
        dieSides = 8;
        capDesc = `${diceCount}d8 (Canlı Hedef)`;
      }
      const diceFormula = `${diceCount}d${dieSides}`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'İlahi Işın',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Divine / Light',
        displayText: `${diceFormula} İlahi Işık`,
        descDetail: `CL ${cl}: ${capDesc}`
      };
    }

    // 10. CURE / INFLICT SPELLS (Cure Light/Moderate/Serious/Critical)
    if (cleanName.includes('cure light') || cleanName.includes('inflict light')) {
      const bonus = Math.min(5, cl);
      const diceFormula = `1d8+${bonus}`;
      const isCure = cleanName.includes('cure');
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount: 1,
        dieSides: 8,
        staticBonus: bonus,
        diceFormula,
        dmgType: isCure ? 'Şifa / Pozitif' : 'Negatif Enerji',
        displayText: `${diceFormula} ${isCure ? 'Şifa' : 'Hasar'}`,
        descDetail: `CL ${cl}: 1d8+${bonus} (tavan +5)`
      };
    }
    if (cleanName.includes('cure moderate') || cleanName.includes('inflict moderate')) {
      const bonus = Math.min(10, cl);
      const diceFormula = `2d8+${bonus}`;
      const isCure = cleanName.includes('cure');
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount: 2,
        dieSides: 8,
        staticBonus: bonus,
        diceFormula,
        dmgType: isCure ? 'Şifa / Pozitif' : 'Negatif Enerji',
        displayText: `${diceFormula} ${isCure ? 'Şifa' : 'Hasar'}`,
        descDetail: `CL ${cl}: 2d8+${bonus} (tavan +10)`
      };
    }
    if (cleanName.includes('cure serious') || cleanName.includes('inflict serious')) {
      const bonus = Math.min(15, cl);
      const diceFormula = `3d8+${bonus}`;
      const isCure = cleanName.includes('cure');
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount: 3,
        dieSides: 8,
        staticBonus: bonus,
        diceFormula,
        dmgType: isCure ? 'Şifa / Pozitif' : 'Negatif Enerji',
        displayText: `${diceFormula} ${isCure ? 'Şifa' : 'Hasar'}`,
        descDetail: `CL ${cl}: 3d8+${bonus} (tavan +15)`
      };
    }
    if (cleanName.includes('cure critical') || cleanName.includes('inflict critical')) {
      const bonus = Math.min(20, cl);
      const diceFormula = `4d8+${bonus}`;
      const isCure = cleanName.includes('cure');
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount: 4,
        dieSides: 8,
        staticBonus: bonus,
        diceFormula,
        dmgType: isCure ? 'Şifa / Pozitif' : 'Negatif Enerji',
        displayText: `${diceFormula} ${isCure ? 'Şifa' : 'Hasar'}`,
        descDetail: `CL ${cl}: 4d8+${bonus} (tavan +20)`
      };
    }

    // 11. RAY OF ENFEEBLEMENT (PHB p.269): 1d6 + 1 per 2 levels (max +5)
    if (cleanName.includes('ray of enfeeblement') || cleanName.includes('güçsüzleştirme')) {
      const bonus = Math.min(5, Math.floor(cl / 2));
      const diceFormula = bonus > 0 ? `1d6+${bonus}` : `1d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Işın',
        diceCount: 1,
        dieSides: 6,
        staticBonus: bonus,
        diceFormula,
        dmgType: 'STR Cezası',
        displayText: `${diceFormula} STR Azaltma`,
        descDetail: `CL ${cl}: 1d6 + ${bonus} Güç Cezası (tavan +5)`
      };
    }

    // 12. VAMPIRIC TOUCH (PHB p.298): 1d6 per 2 levels (max 10d6)
    if (cleanName.includes('vampiric touch')) {
      const diceCount = Math.min(10, Math.max(1, Math.floor(cl / 2)));
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Dokunuş',
        diceCount,
        dieSides: 6,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Negatif / Geçici Can',
        displayText: `${diceFormula} Negatif Hasar & Can`,
        descDetail: `CL ${cl}: ${diceCount}d6 (tavan 10d6)`
      };
    }

    // 13. GENERIC PATTERN MATCHER (e.g. "1d6/level (max 10d6)", "1d8+1/level (max +5)")
    const fullText = `${spell.dice || ''} ${spell.damageDice || ''} ${spell.benefit || ''} ${spell.description || ''}`;

    // Pattern A: "XdY/level (max MdY)" or "XdY per level (max MdY)"
    const perLvlMatch = fullText.match(/(\d+)d(\d+)\s*(?:\/|\s*per\s*)\s*(?:cl|level|seviye)(?:\s*\(?max\s*(\d+)d\d+\)?)?/i);
    if (perLvlMatch) {
      const perCl = parseInt(perLvlMatch[1], 10) || 1;
      const dieSides = parseInt(perLvlMatch[2], 10) || 6;
      const maxCap = perLvlMatch[3] ? parseInt(perLvlMatch[3], 10) : (perCl * 20);
      const diceCount = Math.min(maxCap, Math.max(perCl, cl * perCl));
      const diceFormula = `${diceCount}d${dieSides}`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType,
        displayText: `${diceFormula} ${dmgType}`,
        descDetail: `CL ${cl}: ${diceCount}d${dieSides} (tavan ${maxCap}d${dieSides})`
      };
    }

    // Pattern B: "XdY/2 levels (max MdY)"
    const per2LvlMatch = fullText.match(/(\d+)d(\d+)\s*(?:\/|\s*per\s*)\s*2\s*(?:cl|level|seviye|levels)(?:\s*\(?max\s*(\d+)d\d+\)?)?/i);
    if (per2LvlMatch) {
      const per2Cl = parseInt(per2LvlMatch[1], 10) || 1;
      const dieSides = parseInt(per2LvlMatch[2], 10) || 6;
      const maxCap = per2LvlMatch[3] ? parseInt(per2LvlMatch[3], 10) : (per2Cl * 10);
      const diceCount = Math.min(maxCap, Math.max(per2Cl, Math.floor(cl / 2) * per2Cl));
      const diceFormula = `${diceCount}d${dieSides}`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType,
        displayText: `${diceFormula} ${dmgType}`,
        descDetail: `CL ${cl}: ${diceCount}d${dieSides} (tavan ${maxCap}d${dieSides})`
      };
    }

    // Pattern C: "XdY + 1/level (max +Z)"
    const bonusLvlMatch = fullText.match(/(\d+)d(\d+)\s*\+\s*(?:1\s*(?:\/|\s*per\s*)\s*(?:cl|level)|cl)(?:\s*\(?max\s*\+(\d+)\)?)?/i);
    if (bonusLvlMatch) {
      const diceCount = parseInt(bonusLvlMatch[1], 10) || 1;
      const dieSides = parseInt(bonusLvlMatch[2], 10) || 8;
      const maxBonus = bonusLvlMatch[3] ? parseInt(bonusLvlMatch[3], 10) : 5;
      const staticBonus = Math.min(maxBonus, cl);
      const diceFormula = `${diceCount}d${dieSides}+${staticBonus}`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount,
        dieSides,
        staticBonus,
        diceFormula,
        dmgType,
        displayText: `${diceFormula} ${dmgType}`,
        descDetail: `CL ${cl}: ${diceFormula} (tavan +${maxBonus})`
      };
    }

    // 14. FALLBACK / STATIC DICE (e.g. "1d6", "2d4+2", "3d6")
    const diceStr = spell.dice || spell.damageDice || (spell.benefit && spell.benefit.match(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/i) ? spell.benefit.match(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/i)[0] : '');
    if (diceStr) {
      const parsed = diceStr.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
      if (parsed) {
        const diceCount = parseInt(parsed[1], 10) || 1;
        const dieSides = parseInt(parsed[2], 10) || 6;
        let staticBonus = 0;
        if (parsed[4]) {
          staticBonus = parsed[3] === '-' ? -parseInt(parsed[4], 10) : parseInt(parsed[4], 10);
        }
        const cleanFormula = staticBonus !== 0 ? `${diceCount}d${dieSides}${staticBonus > 0 ? '+' : ''}${staticBonus}` : `${diceCount}d${dieSides}`;
        return {
          scaled: false,
          name: rawName,
          casterLevel: cl,
          projectiles: 1,
          diceCount,
          dieSides,
          staticBonus,
          diceFormula: cleanFormula,
          dmgType,
          displayText: `${cleanFormula} ${dmgType}`,
          descDetail: ''
        };
      }
    }

    return {
      scaled: false,
      name: rawName,
      casterLevel: cl,
      projectiles: 0,
      diceCount: 0,
      dieSides: 0,
      staticBonus: 0,
      diceFormula: '',
      dmgType,
      displayText: '',
      descDetail: ''
    };
  },

  // Central Recalculation Engine for Character State (Abilities, AC, Saves, Speed, Buffs)
  recalculateCharacter(character, masterDb = [], tacticalOptions = {}) {
    if (!character) return;
    const options = tacticalOptions || {};

    // 1. Ensure Base Abilities
    if (!character.baseAbilities) {
      character.baseAbilities = {
        str: character.abilities?.str || 10,
        dex: character.abilities?.dex || 10,
        con: character.abilities?.con || 10,
        int: character.abilities?.int || 10,
        wis: character.abilities?.wis || 10,
        cha: character.abilities?.cha || 10
      };
      // If default character has +2 Belt and +2 Gloves active in initial state, calibrate base scores
      if (character.bodySlots?.belt?.active && character.bodySlots.belt.name?.toLowerCase().includes('+2')) {
        character.baseAbilities.str = Math.max(8, character.baseAbilities.str - 2);
      }
      if (character.bodySlots?.gloves?.active && character.bodySlots.gloves.name?.toLowerCase().includes('+2')) {
        character.baseAbilities.dex = Math.max(8, character.baseAbilities.dex - 2);
      }
    } else {
      if (!character.hasCustomBaseAbilities) {
        // Re-calibrate if baseAbilities was saved uncalibrated in localStorage
        if (character.bodySlots?.belt?.active && (character.bodySlots.belt.name || '').toLowerCase().includes('+2') && character.baseAbilities.str === 14) {
          character.baseAbilities.str = 12;
        }
        if (character.bodySlots?.gloves?.active && (character.bodySlots.gloves.name || '').toLowerCase().includes('+2') && character.baseAbilities.dex === 16) {
          character.baseAbilities.dex = 14;
        }
      }
    }

    // Ensure buffs array
    if (!Array.isArray(character.buffs)) {
      character.buffs = [];
    }

    // 2. Collect Equipment Bonuses from active bodySlots
    const armorBonuses = [];
    const shieldBonuses = [];
    const naturalBonuses = [];
    const deflectionBonuses = [];
    const dodgeBonuses = [];
    const saveBonusBuckets = {
      fort: [],
      ref: [],
      will: []
    };
    let hasSteadfastDetermination = false;
    let minMaxDex = null;
    let totalAcp = 0;
    let resistBonus = 0;
    let itemSpeedBonus = 0;

    // Ability bonus buckets by type for RAW stacking
    const abilityBuckets = {
      str: [],
      dex: [],
      con: [],
      int: [],
      wis: [],
      cha: []
    };

    let twoHandedConflict = null;
    let offHandSuppressed = false;
    let equippedArmorCategory = 'None';

    if (character.bodySlots && typeof character.bodySlots === 'object') {
      const mh = character.bodySlots.mainHand;
      const oh = character.bodySlots.offHand;
      const isMhTwoHand = mh && mh.name && mh.name !== '-' && this.isTwoHandedWeapon(mh);
      const isOhOccupied = oh && oh.active !== false && oh.name && oh.name !== '-';

      // RAW D&D 3.5e: Two-handed weapons require both hands. Neither Monkey Grip nor Oversized TWF permits
      // wielding a two-handed weapon in one hand alongside an off-hand weapon or shield.
      if (isMhTwoHand && isOhOccupied) {
        offHandSuppressed = true;
        twoHandedConflict = {
          mainHand: mh.name,
          offHand: oh.name,
          message: `⚠️ "${mh.name}" iki elli (Two-Handed) bir silahtır! D&D 3.5e RAW kurallarına göre iki elli silahlar her iki eli birden gerektirdiğinden aynı anda ikinci el eşyası ("${oh.name}") kullanılamaz. İkinci el etkileri devre dışı bırakıldı.`
        };
      }
      character.twoHandedConflict = twoHandedConflict;

      Object.entries(character.bodySlots).forEach(([slotKey, slotData]) => {
        if (!slotData || slotData.active === false || !slotData.name || slotData.name === '-') return;
        if (slotKey === 'offHand' && offHandSuppressed) return;

        const mods = this.parseItemModifiers(slotData, masterDb);
        if (!mods) return;

        if (slotKey === 'armor' || (mods.armor > 0 && mods.effectiveArmorCategory)) {
          equippedArmorCategory = mods.effectiveArmorCategory || 'Light';
        }

        if (mods.armor > 0) armorBonuses.push({ val: mods.armor, source: slotData.name, type: 'Armor' });
        if (mods.shield > 0) shieldBonuses.push({ val: mods.shield, source: slotData.name, type: 'Shield' });
        if (mods.natural > 0) naturalBonuses.push({ val: mods.natural, source: slotData.name, type: mods.naturalBonusType || mods.bonusType || 'Natural' });
        if (mods.deflection > 0) deflectionBonuses.push({ val: mods.deflection, source: slotData.name, type: 'Deflection' });
        if (mods.dodge > 0) dodgeBonuses.push({ val: mods.dodge, source: slotData.name, type: 'Dodge' });

        if (mods.maxDex !== null && mods.maxDex !== undefined) {
          if (minMaxDex === null || mods.maxDex < minMaxDex) minMaxDex = mods.maxDex;
        }
        if (mods.acp) totalAcp += mods.acp;
        if (mods.resistance > 0) {
          saveBonusBuckets.fort.push({ val: mods.resistance, source: slotData.name, type: 'Resistance' });
          saveBonusBuckets.ref.push({ val: mods.resistance, source: slotData.name, type: 'Resistance' });
          saveBonusBuckets.will.push({ val: mods.resistance, source: slotData.name, type: 'Resistance' });
          if (mods.resistance > resistBonus) resistBonus = mods.resistance;
        }
        if (mods.speed > 0 && mods.speed > itemSpeedBonus) itemSpeedBonus = mods.speed;

        // Ability mods - RAW D&D 3.5e: standard item bonuses to ability scores are Enhancement
        const abilityBonusType = (mods.bonusType && mods.bonusType.toLowerCase() !== 'untyped') ? mods.bonusType : 'Enhancement';
        if (mods.str > 0) abilityBuckets.str.push({ val: mods.str, type: abilityBonusType, source: slotData.name });
        if (mods.dex > 0) abilityBuckets.dex.push({ val: mods.dex, type: abilityBonusType, source: slotData.name });
        if (mods.con > 0) abilityBuckets.con.push({ val: mods.con, type: abilityBonusType, source: slotData.name });
        if (mods.int > 0) abilityBuckets.int.push({ val: mods.int, type: abilityBonusType, source: slotData.name });
        if (mods.wis > 0) abilityBuckets.wis.push({ val: mods.wis, type: abilityBonusType, source: slotData.name });
        if (mods.cha > 0) abilityBuckets.cha.push({ val: mods.cha, type: abilityBonusType, source: slotData.name });
      });
    }

    // 3. Collect Active Buff Bonuses & Debuffs / Conditions (Parent-Child Aware)
    let buffSpeedBonus = 0;
    let buffAcPenalty = 0;
    let buffSaveFort = 0;
    let buffSaveRef = 0;
    let buffSaveWill = 0;
    let buffSkillBonus = 0;
    let debuffHpPenalty = 0;
    const suppressedWarnings = [];

    character.buffs.forEach(buff => {
      if (!buff || !buff.active) return;

      const itemsToProcess = [buff];
      const hasChildren = Array.isArray(buff.children) && buff.children.length > 0;
      if (hasChildren) {
        itemsToProcess.push(...buff.children);
      }

      // If parent has negativeLevels without explicit children handling it
      if (buff.negativeLevels && !hasChildren) {
        debuffHpPenalty += buff.negativeLevels * 5;
        saveBonusBuckets.fort.push({ val: -buff.negativeLevels, type: 'penalty', source: `${buff.name} (-${buff.negativeLevels} Lvl)` });
        saveBonusBuckets.ref.push({ val: -buff.negativeLevels, type: 'penalty', source: `${buff.name} (-${buff.negativeLevels} Lvl)` });
        saveBonusBuckets.will.push({ val: -buff.negativeLevels, type: 'penalty', source: `${buff.name} (-${buff.negativeLevels} Lvl)` });
        buffSkillBonus -= buff.negativeLevels;
      }

      itemsToProcess.forEach(item => {
        if (!item) return;
        // When parent has children, skip container-level values that are superseded by children
        if (item === buff && hasChildren) return;

        const bType = (item.bonusType || (item.isDebuff || (item.attBonus < 0 || item.acBonus < 0 || item.strBonus < 0) ? 'penalty' : 'untyped')).toLowerCase();

        // AC Bonuses & Penalties
        if (item.acBonus > 0) {
          if (bType.includes('shield')) {
            shieldBonuses.push({ val: item.acBonus, source: item.name, type: 'Shield' });
          } else if (bType.includes('deflection')) {
            deflectionBonuses.push({ val: item.acBonus, source: item.name, type: 'Deflection' });
          } else if (bType.includes('natural')) {
            const natType = (bType.includes('ench') || item.name.toLowerCase().includes('barkskin') || item.name.toLowerCase().includes('amulet of natural armor')) ? 'Natural_Armor_Ench' : 'Natural';
            naturalBonuses.push({ val: item.acBonus, source: item.name, type: natType });
          } else {
            armorBonuses.push({ val: item.acBonus, source: item.name, type: 'Armor' });
          }
        }
        if (item.acBonus < 0) {
          buffAcPenalty += Math.abs(item.acBonus);
        }
        if (item.acPenalty > 0) buffAcPenalty += item.acPenalty;

        if (item.naturalBonus > 0) {
          const natType = (bType.includes('ench') || item.name.toLowerCase().includes('barkskin') || item.name.toLowerCase().includes('amulet of natural armor')) ? 'Natural_Armor_Ench' : 'Natural';
          naturalBonuses.push({ val: item.naturalBonus, source: item.name, type: natType });
        }
        if (item.deflectionBonus > 0) deflectionBonuses.push({ val: item.deflectionBonus, source: item.name, type: 'Deflection' });
        if (item.dodgeBonus > 0) dodgeBonuses.push({ val: item.dodgeBonus, source: item.name, type: 'Dodge' });

        // Stat Bonuses & Penalties
        if (item.strBonus) abilityBuckets.str.push({ val: item.strBonus, type: item.bonusType || (item.strBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });
        if (item.dexBonus) abilityBuckets.dex.push({ val: item.dexBonus, type: item.bonusType || (item.dexBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });
        if (item.conBonus) abilityBuckets.con.push({ val: item.conBonus, type: item.bonusType || (item.conBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });
        if (item.intBonus) abilityBuckets.int.push({ val: item.intBonus, type: item.bonusType || (item.intBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });
        if (item.wisBonus) abilityBuckets.wis.push({ val: item.wisBonus, type: item.bonusType || (item.wisBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });
        if (item.chaBonus) abilityBuckets.cha.push({ val: item.chaBonus, type: item.bonusType || (item.chaBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });

        // Saves (parent-child aware, bonusType aware stacking)
        const saveType = item.bonusType || (item.isDebuff || item.saveBonus < 0 || item.fortBonus < 0 ? 'penalty' : 'Resistance');
        if (item.fortBonus) saveBonusBuckets.fort.push({ val: item.fortBonus, type: saveType, source: item.name });
        if (item.refBonus) saveBonusBuckets.ref.push({ val: item.refBonus, type: saveType, source: item.name });
        if (item.willBonus) saveBonusBuckets.will.push({ val: item.willBonus, type: saveType, source: item.name });
        if (item.saveBonus) {
          saveBonusBuckets.fort.push({ val: item.saveBonus, type: saveType, source: item.name });
          saveBonusBuckets.ref.push({ val: item.saveBonus, type: saveType, source: item.name });
          saveBonusBuckets.will.push({ val: item.saveBonus, type: saveType, source: item.name });
        }

        // Speed
        if (item.speedBonus) buffSpeedBonus = Math.max(buffSpeedBonus, item.speedBonus);
        if (item.speedPenalty) buffSpeedBonus -= item.speedPenalty;

        // HP Penalty (Energy Drain: 5 HP per level)
        if (item.hpPenalty) debuffHpPenalty += Number(item.hpPenalty) || 0;

        // Skill Modifiers
        if (item.skillBonus) buffSkillBonus += Number(item.skillBonus) || 0;
      });
    });

    // 3.5. Evaluate Feats, Special Abilities, DM Grants & Dynamic Scaling Bonuses (e.g. "Nat AC 2+1/4lvl", "Every X levels +Y", Ability Boosts, Saves)
    const charLvl = Number(character.level) || (Array.isArray(character.levelProgression) ? character.levelProgression.filter(l => l.active !== false).length : 1) || 1;
    const allAbilitiesAndFeats = [
      ...(character.feats || []),
      ...(character.specialAbilities || [])
    ];

    let draconicToughnessHp = 0;

    allAbilitiesAndFeats.forEach(featItem => {
      if (!featItem) return;
      const rawName = String(typeof featItem === 'string' ? featItem : (featItem.name || '')).trim();
      // Skip equipment child items if any were saved here
      if (rawName.startsWith('↳') || (featItem.isChild && featItem.isChild !== false)) return;

      const cleanName = rawName.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').toLowerCase().trim();
      const dbEntry = Array.isArray(masterDb) ? masterDb.find(m => (m.name || '').toLowerCase().trim() === cleanName) : null;
      const desc = String(featItem.benefit || featItem.desc || featItem.description || (dbEntry ? (dbEntry.benefit || dbEntry.description) : '') || '').toLowerCase();
      const combinedText = `${cleanName} ${desc}`;

      // 1. Natural Armor & Dynamic Scaling Formulas (e.g. "Nat AC 2+1/4lvl", "1 per 4 levels")
      if (combinedText.includes('nat ac') || combinedText.includes('natural armor') || combinedText.includes('doğal zırh')) {
        let natVal = this.evaluateScalingBonus(cleanName, charLvl);
        if (natVal === 0) {
          natVal = this.evaluateScalingBonus(desc, charLvl);
        }
        if (natVal === 0 && dbEntry && (dbEntry.naturalBonus || dbEntry.acBonus)) {
          natVal = Number(dbEntry.naturalBonus || dbEntry.acBonus) || 0;
        }
        if (natVal === 0) {
          const direct = combinedText.match(/(?:nat(?:ural)?\s*(?:ac|armor)|doğal\s*zırh)\s*[:\+]?\s*(\d+)/i) || cleanName.match(/\+(\d+)\s*nat/i);
          if (direct) natVal = parseInt(direct[1], 10);
        }
        if (natVal > 0) {
          naturalBonuses.push({ val: natVal, source: featItem.name || rawName, type: 'Natural' });
        }
      }

      // 2. Inherent / DM Boon / Feat Ability Boosts (e.g. "Ability Boost (+2 Con, +2 Cha)", "+2 Dex")
      if (combinedText.includes('ability boost') || combinedText.includes('inherent bonus') || (featItem.category === 'DM Boon' && combinedText.includes('boost'))) {
        const bType = featItem.bonusType || (dbEntry ? dbEntry.bonusType : null) || 'Inherent';
        
        if (dbEntry && (dbEntry.strBonus || dbEntry.dexBonus || dbEntry.conBonus || dbEntry.intBonus || dbEntry.wisBonus || dbEntry.chaBonus)) {
          if (dbEntry.strBonus) abilityBuckets.str.push({ val: Number(dbEntry.strBonus), type: bType, source: featItem.name || rawName });
          if (dbEntry.dexBonus) abilityBuckets.dex.push({ val: Number(dbEntry.dexBonus), type: bType, source: featItem.name || rawName });
          if (dbEntry.conBonus) abilityBuckets.con.push({ val: Number(dbEntry.conBonus), type: bType, source: featItem.name || rawName });
          if (dbEntry.intBonus) abilityBuckets.int.push({ val: Number(dbEntry.intBonus), type: bType, source: featItem.name || rawName });
          if (dbEntry.wisBonus) abilityBuckets.wis.push({ val: Number(dbEntry.wisBonus), type: bType, source: featItem.name || rawName });
          if (dbEntry.chaBonus) abilityBuckets.cha.push({ val: Number(dbEntry.chaBonus), type: bType, source: featItem.name || rawName });
        } else {
          const strMatch = combinedText.match(/\+(\d+)\s*(?:str|güç)/i);
          const dexMatch = combinedText.match(/\+(\d+)\s*(?:dex|çeviklik)/i);
          const conMatch = combinedText.match(/\+(\d+)\s*(?:con|dayanıklılık)/i);
          const intMatch = combinedText.match(/\+(\d+)\s*(?:int|zeka)/i);
          const wisMatch = combinedText.match(/\+(\d+)\s*(?:wis|akıl|irade)/i);
          const chaMatch = combinedText.match(/\+(\d+)\s*(?:cha|karizma)/i);

          if (strMatch) abilityBuckets.str.push({ val: parseInt(strMatch[1], 10), type: bType, source: featItem.name || rawName });
          if (dexMatch) abilityBuckets.dex.push({ val: parseInt(dexMatch[1], 10), type: bType, source: featItem.name || rawName });
          if (conMatch) abilityBuckets.con.push({ val: parseInt(conMatch[1], 10), type: bType, source: featItem.name || rawName });
          if (intMatch) abilityBuckets.int.push({ val: parseInt(intMatch[1], 10), type: bType, source: featItem.name || rawName });
          if (wisMatch) abilityBuckets.wis.push({ val: parseInt(wisMatch[1], 10), type: bType, source: featItem.name || rawName });
          if (chaMatch) abilityBuckets.cha.push({ val: parseInt(chaMatch[1], 10), type: bType, source: featItem.name || rawName });
        }
      }

      // 3. Save Bonuses from Feats & Boons (e.g. "Save Magic +1 draconic", "+2 Iron Will")
      if (cleanName.includes('save magic') || cleanName.includes('draconic save') || combinedText.includes('bonus on saving throws') || combinedText.includes('kurtarma zarlar')) {
        const insMatch = combinedText.match(/\+(\d+)\s*(?:(insight|draconic|luck|morale|resistance|competence|sacred|profane)\s*)?bonus/i) || cleanName.match(/\+(\d+)/);
        const bType = (insMatch && insMatch[2]) ? insMatch[2] : (featItem.bonusType || dbEntry?.bonusType || 'Untyped');
        const val = insMatch ? parseInt(insMatch[1], 10) : (Number(dbEntry?.fortBonus || dbEntry?.saveBonus) || 0);
        if (val > 0) {
          saveBonusBuckets.fort.push({ val, type: bType, source: featItem.name || rawName });
          saveBonusBuckets.ref.push({ val, type: bType, source: featItem.name || rawName });
          saveBonusBuckets.will.push({ val, type: bType, source: featItem.name || rawName });
        }
      }

      // 4. Draconic Toughness (Gain extra maximum HP equal to character level)
      if (cleanName.includes('draconic toughness') || combinedText.includes('extra maximum hit points equal to character level')) {
        draconicToughnessHp = charLvl;
      }

      // 5. Steadfast Determination (PHB II p.83): Use CON modifier instead of WIS modifier on Will saves
      if (cleanName.includes('steadfast determination') || combinedText.includes('constitution modifier instead of wisdom modifier for will')) {
        hasSteadfastDetermination = true;
      }

      // 6. Dodge Bonus from Feats / Boons (e.g. Boon of Elusiveness +2 Dodge AC, Dodge feat)
      const dodgeMatch = combinedText.match(/\+(\d+)\s*dodge\s*(?:bonus\s*to\s*)?(?:ac|armor class)?/i) || combinedText.match(/gain\s*\+(\d+)\s*dodge/i);
      if (dodgeMatch) {
        const dVal = parseInt(dodgeMatch[1], 10);
        if (dVal > 0) {
          dodgeBonuses.push({ val: dVal, source: featItem.name || rawName, type: 'Dodge' });
        }
      }
    });

    // 3.8. Collect slotless or wondrous gear pool items with saveBonus or skillBonuses (e.g. Luckstone, Pale Green Ioun Stone)
    if (Array.isArray(character.gearPool)) {
      character.gearPool.forEach(item => {
        if (!item || !item.name) return;
        const cleanItemName = item.name.toLowerCase().trim();
        const dbEntry = Array.isArray(masterDb) ? masterDb.find(m => (m.name || '').toLowerCase().trim() === cleanItemName) : null;
        const saveVal = item.saveBonus || dbEntry?.saveBonus;
        const bType = item.bonusType || dbEntry?.bonusType || 'Luck';
        if (saveVal) {
          saveBonusBuckets.fort.push({ val: Number(saveVal), type: bType, source: item.name });
          saveBonusBuckets.ref.push({ val: Number(saveVal), type: bType, source: item.name });
          saveBonusBuckets.will.push({ val: Number(saveVal), type: bType, source: item.name });
        }
      });
    }

    // 3.9. Collect Racial Ability Modifiers from canonical Race (D&D 3.5e RAW)
    if (character.race) {
      const curRaceName = String(character.race).toLowerCase().trim();
      const raceCatalog = (Array.isArray(masterDb) && masterDb.length) ? masterDb : ((typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) ? window.BUNDLED_SRD_CORE_CATALOG : []);
      const raceObj = raceCatalog.find(m => m && (m.type === 'Race' || String(m.type).toLowerCase() === 'race') && (m.name || '').toLowerCase().trim() === curRaceName);

      if (raceObj) {
        const raceLabel = raceObj.name || character.race;
        if (raceObj.strBonus) abilityBuckets.str.push({ val: Number(raceObj.strBonus), type: 'Racial', source: `${raceLabel} (Irk)` });
        if (raceObj.dexBonus) abilityBuckets.dex.push({ val: Number(raceObj.dexBonus), type: 'Racial', source: `${raceLabel} (Irk)` });
        if (raceObj.conBonus) abilityBuckets.con.push({ val: Number(raceObj.conBonus), type: 'Racial', source: `${raceLabel} (Irk)` });
        if (raceObj.intBonus) abilityBuckets.int.push({ val: Number(raceObj.intBonus), type: 'Racial', source: `${raceLabel} (Irk)` });
        if (raceObj.wisBonus) abilityBuckets.wis.push({ val: Number(raceObj.wisBonus), type: 'Racial', source: `${raceLabel} (Irk)` });
        if (raceObj.chaBonus) abilityBuckets.cha.push({ val: Number(raceObj.chaBonus), type: 'Racial', source: `${raceLabel} (Irk)` });
      }
    }

    // 4. Resolve Stacking for Abilities (RAW: Same types take Math.max, untyped/dodge stack)
    if (!character.abilities) character.abilities = {};
    character.abilitySources = abilityBuckets;
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
      const base = character.baseAbilities[stat] || 10;
      const bonusItems = abilityBuckets[stat];
      const netBonus = this.resolveBonusStacking(bonusItems);
      character.abilities[stat] = base + netBonus;
    });

    // 4.5. Resolve Dynamic Hit Points (HP) based on Constitution Changes and Debuff Penalties
    // In D&D 3.5e RAW:
    // - Con modifier alters maximum and current HP by 1 HP per Hit Die / Level
    // - Energy Drain / Negative Levels decrease maximum and current HP by 5 HP per level!
    const charFeatNames = (character.feats || []).map(f => (typeof f === 'string' ? f : (f.name || '')).toLowerCase().trim());
    const totalHD = Number(character.level) || (Array.isArray(character.levelProgression) ? character.levelProgression.length : 1);
    const hasFrail = charFeatNames.some(f => f.includes('flaw: frail') || f === 'frail');
    const flawHpPenalty = hasFrail ? totalHD : 0;

    if (character.hp) {
      if (character.hp.baseMax === undefined || character.hp.baseMax === null) {
        // If baseMax not yet set, initialize it from current max (subtracting any previous conBonusHp)
        character.hp.baseMax = Math.max(1, (Number(character.hp.max) || 45) - (Number(character.hp.conBonusHp) || 0) + flawHpPenalty + (Number(character.hp.debuffHpPenalty) || 0));
      }
      if (character.hp.conBonusHp === undefined || character.hp.conBonusHp === null) {
        character.hp.conBonusHp = 0;
      }

      const baseConMod = this.getAbilityMod(character.baseAbilities?.con || 10);
      const effectiveConMod = this.getAbilityMod(character.abilities?.con || 10);
      const conModDiff = effectiveConMod - baseConMod;
      const newConBonusHp = conModDiff * totalHD;

      const prevConBonusHp = Number(character.hp.conBonusHp) || 0;
      const prevDebuffHp = Number(character.hp.debuffHpPenalty) || 0;
      const conHpDiff = newConBonusHp - prevConBonusHp;
      const debuffHpDiff = debuffHpPenalty - prevDebuffHp;

      if (conHpDiff !== 0 || debuffHpDiff !== 0 || character.hp._appliedFrail !== hasFrail) {
        character.hp.conBonusHp = newConBonusHp;
        character.hp.debuffHpPenalty = debuffHpPenalty;
        character.hp._appliedFrail = hasFrail;
        character.hp.max = Math.max(1, Number(character.hp.baseMax) + newConBonusHp + draconicToughnessHp - flawHpPenalty - debuffHpPenalty);
        character.hp.current = Math.min(character.hp.max, (Number(character.hp.current) || character.hp.max) + conHpDiff - debuffHpDiff);
        if (character.hp.current < -10) {
          character.hp.current = -10;
        }
      }
    }

    // 5. Resolve AC Stacking
    const effectiveArmor = this.resolveBonusStacking(armorBonuses);
    const effectiveShield = this.resolveBonusStacking(shieldBonuses);
    const effectiveNatural = this.resolveBonusStacking(naturalBonuses);
    const effectiveDeflection = this.resolveBonusStacking(deflectionBonuses);
    let effectiveDodge = this.resolveBonusStacking(dodgeBonuses);

    // Tactical stance / combat mode dodge bonuses
    const bab = Number(character.bab) || 0;
    const combatExpertise = tacticalOptions.combatExpertise || 0;
    const fightingDefensively = tacticalOptions.fightingDefensively || false;
    const totalDefense = tacticalOptions.totalDefense || false;
    const charge = tacticalOptions.charge || false;

    if (charFeatNames.some(f => f === 'dodge')) {
      effectiveDodge += 1;
    }

    // D&D 3.5e RAW (PHB p. 84, Tumble): 5+ ranks in Tumble increases Fighting Defensively dodge bonus to +3 and Total Defense to +6
    const skillList = Array.isArray(character.skills) ? character.skills : Object.values(character.skills || {});
    const tumbleSkill = skillList.find(s => s && s.name && s.name.toLowerCase() === 'tumble');
    const tumbleRanks = tumbleSkill ? (Number(tumbleSkill.ranks) || 0) : 0;
    const fightingDefDodge = tumbleRanks >= 5 ? 3 : 2;
    const totalDefDodge = tumbleRanks >= 5 ? 6 : 4;

    const maxAllowedCE = Math.min(5, bab);
    const effectiveCE = Math.min(maxAllowedCE, Math.max(0, combatExpertise));
    if (effectiveCE > 0) effectiveDodge += effectiveCE;
    if (fightingDefensively) effectiveDodge += fightingDefDodge;
    if (totalDefense) effectiveDodge += totalDefDodge;

    // Dex to AC capped by Max Dex
    const fullDexMod = this.getAbilityMod(character.abilities.dex || 10);
    const effectiveDex = minMaxDex !== null ? Math.min(fullDexMod, minMaxDex) : fullDexMod;

    // AC Penalties
    let totalPenalty = buffAcPenalty;
    if (charge) totalPenalty += 2;
    if (charFeatNames.some(f => f.includes('flaw: vulnerable') || f === 'vulnerable')) {
      totalPenalty += 1;
    }

    const baseAC = 10;
    const sizeBonus = character.acBreakdown?.size || 0;

    const totalAC = baseAC + effectiveArmor + effectiveShield + effectiveNatural + effectiveDeflection + sizeBonus + effectiveDex + effectiveDodge - totalPenalty;
    const touchAC = baseAC + effectiveDeflection + sizeBonus + effectiveDex + effectiveDodge - totalPenalty;
    
    // Flat-footed AC (RAW: retain negative Dex penalty even when flat-footed; retain Dex & Dodge if Uncanny Dodge)
    const hasUncannyDodge = (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : a.name).toLowerCase().includes('uncanny dodge'));
    const flatDex = hasUncannyDodge ? effectiveDex : Math.min(0, fullDexMod);
    const flatDodge = hasUncannyDodge ? effectiveDodge : 0;
    const flatAC = baseAC + effectiveArmor + effectiveShield + effectiveNatural + effectiveDeflection + sizeBonus + flatDex + flatDodge - totalPenalty;

    character.acBreakdown = {
      armor: effectiveArmor,
      shield: effectiveShield,
      natural: effectiveNatural,
      deflection: effectiveDeflection,
      size: sizeBonus,
      dodge: effectiveDodge,
      effectiveDex: effectiveDex,
      maxDex: minMaxDex,
      acp: totalAcp,
      penalty: totalPenalty,
      total: totalAC,
      touch: touchAC,
      flat: flatAC,
      armorCategory: equippedArmorCategory,
      sources: {
        armor: armorBonuses,
        shield: shieldBonuses,
        natural: naturalBonuses,
        deflection: deflectionBonuses,
        dodge: dodgeBonuses
      }
    };

    // If character is an NPC with explicit statblock AC, preserve it
    if (character.isNpc && character.ac && character.ac.total) {
      character.acBreakdown.total = character.ac.total;
      character.acBreakdown.touch = character.ac.touch !== undefined ? character.ac.touch : character.ac.total;
      character.acBreakdown.flat = character.ac.flatFooted !== undefined ? character.ac.flatFooted : character.ac.total;
    }

    // 6. Resolve Saving Throws
    const conMod = this.getAbilityMod(character.abilities.con || 10);
    const dexMod = this.getAbilityMod(character.abilities.dex || 10);
    const wisMod = this.getAbilityMod(character.abilities.wis || 10);
    const intMod = this.getAbilityMod(character.abilities.int || 10);

    const baseFort = character.baseSaves?.fort || 0;
    const baseRef = character.baseSaves?.ref || 0;
    const baseWill = character.baseSaves?.will || 0;

    if (!character.saveBonuses) character.saveBonuses = {};
    character.saveBonuses.resistance = resistBonus;

    const featFortBonus = charFeatNames.some(f => f.includes('great fortitude')) ? 2 : 0;
    const featRefBonus = charFeatNames.some(f => f.includes('lightning reflexes')) ? 2 : 0;
    const featWillBonus = charFeatNames.some(f => f.includes('iron will')) ? 2 : 0;
    const flawRefPenalty = charFeatNames.some(f => f.includes('flaw: poor reflexes') || f === 'poor reflexes') ? 2 : 0;
    const miscSaveBonus = (character.saveBonuses?.bonus || 0) + (character.saveBonuses?.misc || 0);

    // Battle Clarity (Warblade 1): Add INT modifier (max Warblade lvl) to Reflex saves
    const charClassNames = (character.classes || '').toLowerCase();
    const isWarblade = charClassNames.includes('warblade') || (Array.isArray(character.levelProgression) && character.levelProgression.some(l => (l.className || '').toLowerCase().includes('warblade')));
    const hasBattleClarity = (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : (a.name || '')).toLowerCase().includes('battle clarity')) || isWarblade;
    const warbladeLvl = (Array.isArray(character.levelProgression) ? character.levelProgression.filter(l => (l.className || '').toLowerCase().includes('warblade')).length : 0) || (isWarblade ? 1 : 0);
    const battleClarityBonus = hasBattleClarity ? Math.min(warbladeLvl, Math.max(0, intMod)) : 0;

    if (featFortBonus > 0) saveBonusBuckets.fort.push({ val: featFortBonus, type: 'Untyped', source: 'Great Fortitude' });
    if (featRefBonus > 0) saveBonusBuckets.ref.push({ val: featRefBonus, type: 'Untyped', source: 'Lightning Reflexes' });
    if (featWillBonus > 0) saveBonusBuckets.will.push({ val: featWillBonus, type: 'Untyped', source: 'Iron Will' });
    if (flawRefPenalty > 0) saveBonusBuckets.ref.push({ val: -flawRefPenalty, type: 'penalty', source: 'Flaw: Poor Reflexes' });
    if (miscSaveBonus > 0) {
      saveBonusBuckets.fort.push({ val: miscSaveBonus, type: 'Untyped', source: 'Misc Save Bonus' });
      saveBonusBuckets.ref.push({ val: miscSaveBonus, type: 'Untyped', source: 'Misc Save Bonus' });
      saveBonusBuckets.will.push({ val: miscSaveBonus, type: 'Untyped', source: 'Misc Save Bonus' });
    }
    if (character.saveBonuses?.fortBonus) saveBonusBuckets.fort.push({ val: character.saveBonuses.fortBonus, type: 'Untyped', source: 'Manual Fort Bonus' });
    if (character.saveBonuses?.refBonus) saveBonusBuckets.ref.push({ val: character.saveBonuses.refBonus, type: 'Untyped', source: 'Manual Ref Bonus' });
    if (character.saveBonuses?.willBonus) saveBonusBuckets.will.push({ val: character.saveBonuses.willBonus, type: 'Untyped', source: 'Manual Will Bonus' });

    const netBonusFort = this.resolveBonusStacking(saveBonusBuckets.fort);
    const netBonusRef = this.resolveBonusStacking(saveBonusBuckets.ref) + battleClarityBonus;
    const netBonusWill = this.resolveBonusStacking(saveBonusBuckets.will);

    // Steadfast Determination (PHB II p.83): Use CON modifier instead of WIS modifier on Will saves
    const willStatMod = hasSteadfastDetermination ? conMod : wisMod;

    const finalFort = baseFort + conMod + netBonusFort;
    const finalRef = baseRef + dexMod + netBonusRef;
    const finalWill = baseWill + willStatMod + netBonusWill;

    character.evaluatedSaves = {
      fort: finalFort,
      ref: finalRef,
      will: finalWill,
      bonusFort: netBonusFort,
      bonusRef: netBonusRef,
      bonusWill: netBonusWill,
      battleClarityBonus: battleClarityBonus
    };

    // If character is an NPC with explicit statblock saves, preserve them
    if (character.isNpc && character.saves) {
      if (character.saves.fort?.total !== undefined) character.evaluatedSaves.fort = character.saves.fort.total;
      if (character.saves.ref?.total !== undefined) character.evaluatedSaves.ref = character.saves.ref.total;
      if (character.saves.will?.total !== undefined) character.evaluatedSaves.will = character.saves.will.total;
    }

    // 7. Resolve Effective Speed (RAW D&D 3.5e Table 8-2: Armor and Speed)
    const baseSpeed = character.baseSpeed || 30;
    const isDwarf = (character.race || '').toLowerCase().includes('dwarf');
    let armorSpeedPenalty = 0;
    if (!isDwarf && (equippedArmorCategory === 'Medium' || equippedArmorCategory === 'Heavy')) {
      armorSpeedPenalty = (baseSpeed > 20) ? 10 : 5;
    }
    character.effectiveSpeed = Math.max(5, baseSpeed - armorSpeedPenalty + itemSpeedBonus + buffSpeedBonus);
    character.effectiveArmorCategory = equippedArmorCategory;
    character.buffSkillBonus = buffSkillBonus;

    // 8. Resolve Rule Flags & Action Economy
    character.ruleFlags = this.evaluateRuleFlags(character);
    character.actionEconomy = this.evaluateActionEconomy(character, options);

    return {
      ac: character.acBreakdown,
      abilities: character.abilities,
      saves: character.evaluatedSaves,
      ruleFlags: character.ruleFlags,
      actionEconomy: character.actionEconomy
    };
  },

  // D&D 3.5e & DM House Rules Dynamic Threat Range Calculator
  evaluateCritThreatRange(weapon, character = null, houseRules = null) {
    if (!weapon) return { critMin: 20, critMult: 2, threatRangeCount: 1, threatRangeDisplay: '20', isKeen: false, hasImpCrit: false };

    const hr = houseRules || character?.houseRules || {};
    const critCapMin = Number(hr.critCapMin) || 15;
    const stackingMode = hr.keenImpCritStacking || 'stack_diminishing'; // 'none' (RAW), 'stack_diminishing', 'full'

    let baseMin = Number(weapon.baseCritMin !== undefined ? weapon.baseCritMin : weapon.critMin);
    let critMult = Number(weapon.critMult);

    // Parse from string like "18-20/x2" or "19-20" if baseMin or critMult is missing
    const critStr = String(weapon.crit || weapon.critical || '');
    if ((isNaN(baseMin) || baseMin <= 0) && critStr) {
      const match = critStr.match(/(\d+)(?:-(\d+))?(?:\/x(\d+))?/i);
      if (match) {
        baseMin = match[2] ? parseInt(match[1], 10) : (match[1] ? parseInt(match[1], 10) : 20);
        if (match[3] && (isNaN(critMult) || critMult <= 0)) {
          critMult = parseInt(match[3], 10);
        }
      }
    }
    if (isNaN(baseMin) || baseMin <= 0 || baseMin > 20) baseMin = 20;
    if (isNaN(critMult) || critMult <= 0) critMult = 2;

    // Base threat range span: 20 -> 1, 19-20 -> 2, 18-20 -> 3
    const baseSpan = Math.max(1, 21 - baseMin);

    // Check Keen property
    const wepName = (weapon.name || '').toLowerCase();
    const wepTags = Array.isArray(weapon.tags) ? weapon.tags.map(t => String(t).toLowerCase()) : [];
    const wepDesc = (weapon.benefit || weapon.desc || weapon.summary || '').toLowerCase();
    const isKeen = !!weapon.isKeen || wepTags.includes('keen') || wepName.includes('keen') || wepDesc.includes('keen');

    // Check Improved Critical Feat
    let hasImpCrit = false;
    if (character && Array.isArray(character.feats)) {
      const cleanWepName = wepName.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
      hasImpCrit = character.feats.some(f => {
        const fn = (typeof f === 'string' ? f : f.name || '').toLowerCase();
        if (!fn.includes('improved critical')) return false;
        if (fn.includes('all') || fn === 'improved critical') return true;
        const targetWep = fn.replace('improved critical', '').replace(/[\(\)]/g, '').trim();
        return cleanWepName.includes(targetWep) || targetWep.includes(cleanWepName);
      });
    }

    let finalSpan = baseSpan;
    if (isKeen && hasImpCrit) {
      if (stackingMode === 'none') {
        // RAW D&D 3.5e: Does not stack
        finalSpan = baseSpan * 2;
      } else if (stackingMode === 'stack_diminishing') {
        // DM House Rule: Keen doubles threat span, Improved Critical adds +1
        finalSpan = (baseSpan * 2) + 1;
      } else if (stackingMode === 'full') {
        // Full stacking: 4x base span
        finalSpan = baseSpan * 4;
      }
    } else if (isKeen || hasImpCrit) {
      finalSpan = baseSpan * 2;
    }

    let calculatedMin = 21 - finalSpan;

    // Apply House Rule Crit Cap (e.g. min 15)
    let capped = false;
    if (calculatedMin < critCapMin) {
      calculatedMin = critCapMin;
      capped = true;
    }

    const threatRangeCount = 21 - calculatedMin;
    const threatRangeDisplay = calculatedMin === 20 ? '20' : `${calculatedMin}-20`;

    return {
      critMin: calculatedMin,
      critMult,
      baseMin,
      baseSpan,
      finalSpan,
      threatRangeCount,
      threatRangeDisplay,
      isKeen,
      hasImpCrit,
      stackingMode,
      critCapMin,
      capped
    };
  },

  // Evaluate Passive / Rule Flags across feats, abilities and buffs
  evaluateRuleFlags(character) {
    if (!character) return {};
    const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());
    const buffs = (character.buffs || []).filter(b => b && b.active).map(b => (b.name || '').toLowerCase());
    
    const flags = {
      allowFlatFootedAoO: feats.some(f => f.includes('combat reflexes')),
      disabledAtNegativeHp: feats.some(f => f.includes('diehard')),
      castInWildShape: feats.some(f => f.includes('natural spell')),
      hasMultiattack: feats.some(f => f.includes('multiattack')),
      hasImprovedMultiattack: feats.some(f => f.includes('improved multiattack')),
      hasCombatReflexes: feats.some(f => f.includes('combat reflexes')),
      hasDiehard: feats.some(f => f.includes('diehard')),
      hasManyshot: feats.some(f => f.includes('manyshot')),
      hasSpiritedCharge: feats.some(f => f.includes('spirited charge')),
      hasRideByAttack: feats.some(f => f.includes('ride-by attack') || f.includes('ride by attack')),
      hasMountedCombat: feats.some(f => f.includes('mounted combat')),
      opposedCheckBonus: {
        trip: feats.some(f => f.includes('improved trip')) ? 4 : 0,
        disarm: feats.some(f => f.includes('improved disarm')) ? 4 : 0,
        sunder: feats.some(f => f.includes('improved sunder')) ? 4 : 0,
        grapple: feats.some(f => f.includes('improved grapple')) ? 4 : 0,
        bullrush: feats.some(f => f.includes('improved bull rush')) ? 4 : 0,
        overrun: feats.some(f => f.includes('improved overrun')) ? 4 : 0
      }
    };

    // Merge explicit declarative ruleFlags from character feat objects if present
    (character.feats || []).forEach(f => {
      if (typeof f === 'object' && f && f.ruleFlags) {
        Object.entries(f.ruleFlags).forEach(([k, v]) => {
          if (k === 'opposedCheckBonus' && typeof v === 'object') {
            Object.assign(flags.opposedCheckBonus, v);
          } else {
            flags[k] = v;
          }
        });
      }
    });

    return flags;
  },

  // Evaluate Action Economy Budget (Standard, Move, Full-Round, Swift, Immediate, Free)
  evaluateActionEconomy(character, options = {}) {
    const tactical = character?.tactical || {};
    const spentActions = options.spentActions || tactical.spentActions || {};
    
    const standardSpent = !!spentActions.standard;
    const moveSpent = !!spentActions.move;
    const fullRoundSpent = !!spentActions.fullRound || (standardSpent && moveSpent);
    const swiftSpent = !!spentActions.swift;
    const immediateSpent = !!spentActions.immediate;

    return {
      standard: standardSpent ? 'spent' : 'available',
      move: moveSpent ? 'spent' : 'available',
      fullRound: fullRoundSpent ? 'spent' : (standardSpent || moveSpent ? 'unavailable' : 'available'),
      swift: swiftSpent ? 'spent' : (immediateSpent ? 'consumed_by_immediate' : 'available'),
      immediate: immediateSpent ? 'spent' : (swiftSpent ? 'consumed_by_swift' : 'available'),
      free: 'unlimited',
      spentActions: {
        standard: standardSpent,
        move: moveSpent,
        fullRound: fullRoundSpent,
        swift: swiftSpent,
        immediate: immediateSpent
      }
    };
  },

  // Evaluate Charge & Spirited Charge Multipliers
  evaluateChargeDamage(weapon, character, options = {}) {
    const isCharge = !!(options.charge !== undefined ? options.charge : character?.tactical?.charge);
    if (!isCharge) return { isCharge: false, multiplier: 1, isLance: false, hasSpiritedCharge: false, desc: 'Normal' };

    const wepName = (weapon?.name || '').toLowerCase();
    const wepTags = Array.isArray(weapon?.tags) ? weapon.tags.map(t => String(t).toLowerCase()) : [];
    const isLance = wepName.includes('lance') || wepName.includes('kargı') || wepTags.includes('lance');

    const feats = (character?.feats || []).map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());
    const hasSpiritedCharge = feats.some(f => f.includes('spirited charge'));

    let multiplier = 1;
    if (hasSpiritedCharge) {
      multiplier = isLance ? 3 : 2;
    } else if (isLance && (options.mounted || wepTags.includes('mounted'))) {
      multiplier = 2;
    }

    return {
      isCharge: true,
      multiplier,
      isLance,
      hasSpiritedCharge,
      desc: multiplier > 1 ? `Charge ${multiplier}x (${hasSpiritedCharge ? 'Spirited Charge' : 'Mounted Lance'})` : 'Charge (+2 Atk / -2 AC)'
    };
  },

  // Calculate Armor Class (Normal, Touch, Flat-Footed)
  evaluateAC(character, options = {}) {
    if (!character) return { total: 10, touch: 10, flat: 10, dodgeBonus: 0, effectiveDex: 0, breakdown: {} };
    
    // Always trigger dynamic recalculation
    this.recalculateCharacter(character, (typeof masterDb !== 'undefined' ? masterDb : []), options);

    const bd = character.acBreakdown || {};
    return {
      total: bd.total ?? 10,
      touch: bd.touch ?? 10,
      flat: bd.flat ?? 10,
      dodgeBonus: bd.dodge ?? 0,
      effectiveDex: bd.effectiveDex ?? 0,
      breakdown: {
        armor: bd.armor || 0,
        shield: bd.shield || 0,
        dex: bd.effectiveDex ?? 0,
        natural: bd.natural || 0,
        deflection: bd.deflection || 0,
        dodge: bd.dodge || 0,
        penalty: bd.penalty ? -Math.abs(bd.penalty) : 0
      }
    };
  },

  // Calculate Saving Throws
  evaluateSaves(character) {
    if (!character) return { fort: 0, ref: 0, will: 0, bonusFort: 0, bonusRef: 0, bonusWill: 0, battleClarityBonus: 0 };
    if (!character.evaluatedSaves) {
      this.recalculateCharacter(character, (typeof masterDb !== 'undefined' ? masterDb : []));
    }
    return character.evaluatedSaves || { fort: 0, ref: 0, will: 0, bonusFort: 0, bonusRef: 0, bonusWill: 0, battleClarityBonus: 0 };
  },

  // D&D 3.5e RAW Damage Dice Stepping Progression (DMG p. 28, FAQ & Rules Compendium)
  stepDamageDice(baseDiceStr, steps = 0) {
    if (!baseDiceStr || steps === 0) return baseDiceStr;
    const cleanStr = String(baseDiceStr).trim().toLowerCase().replace(/\s+/g, '');

    // Canonical D&D 3.5e Size Damage Progression Ladders
    const ladders = [
      // Standard d6/d8 ladder: 1d2 -> 1d3 -> 1d4 -> 1d6 -> 1d8 -> 2d6 -> 3d6 -> 4d6 -> 6d6 -> 8d6 -> 12d6 -> 16d6
      ['1', '1d2', '1d3', '1d4', '1d6', '1d8', '2d6', '3d6', '4d6', '6d6', '8d6', '12d6', '16d6'],
      // d10 / d8 ladder: 1d10 -> 2d8 -> 3d8 -> 4d8 -> 6d8 -> 8d8 -> 12d8
      ['1d10', '2d8', '3d8', '4d8', '6d8', '8d8', '12d8'],
      // 1d12 ladder
      ['1d12', '3d6', '4d6', '6d6', '8d6', '12d6', '16d6'],
      // 2d4 ladder (e.g., Spiked Chain)
      ['2d4', '2d6', '3d6', '4d6', '6d6', '8d6', '12d6', '16d6'],
      // 2d6 ladder (e.g., Greatsword, Jovar)
      ['2d6', '3d6', '4d6', '6d6', '8d6', '12d6', '16d6'],
      // 2d8 ladder
      ['2d8', '3d8', '4d8', '6d8', '8d8', '12d8'],
      // 2d10 ladder
      ['2d10', '4d8', '6d8', '8d8', '12d8']
    ];

    for (const ladder of ladders) {
      const idx = ladder.indexOf(cleanStr);
      if (idx !== -1) {
        const targetIdx = Math.max(0, Math.min(ladder.length - 1, idx + steps));
        return ladder[targetIdx];
      }
    }

    // Generic fallback for any unrecognized die formula
    const match = cleanStr.match(/^(\d+)d(\d+)$/);
    if (match) {
      let count = parseInt(match[1], 10);
      const die = parseInt(match[2], 10);
      count = Math.max(1, count + steps);
      return `${count}d${die}`;
    }

    return baseDiceStr;
  },

  // Evaluate Weapon Attack Modifiers & Damage
  evaluateWeaponAttack(character, weapon, options = {}) {
    const isTwoHand = this.isTwoHandedWeapon(weapon);
    let resolvedGrip = options.grip || weapon.grip || (isTwoHand ? '2-Hand' : '1-Hand');

    // Two-handed weapon MUST be wielded with 2-Hand grip per D&D 3.5e RAW
    if (isTwoHand && resolvedGrip !== '2-Hand') {
      resolvedGrip = '2-Hand';
    }

    const {
      grip = resolvedGrip,
      powerAttack = 0,
      flanking = false,
      charge = false,
      higherGround = false,
      activeStance = character.activeStance || 'None',
      customModifiers = [],
      manyshot = false,
      manyshotArrows: optManyshotArrows = 0
    } = options;

    const houseRules = options.houseRules || character?.houseRules || {};
    const critData = this.evaluateCritThreatRange(weapon, character, houseRules);
    const chargeData = this.evaluateChargeDamage(weapon, character, options);
    const ruleFlags = this.evaluateRuleFlags(character);

    const bab = Number(character.bab) || 0;
    const strMod = this.getAbilityMod(character.abilities?.str || 10);
    const dexMod = this.getAbilityMod(character.abilities?.dex || 10);

    // Feat detections (strip "+N" enhancement or "(...)" suffixes from weapon name when matching Weapon Focus)
    const baseWepName = (weapon.name || '').toLowerCase().replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : f.name).toLowerCase());
    const hasWeaponFinesse = feats.some(f => f.includes('weapon finesse'));
    const hasShadowBlade = feats.some(f => f.includes('shadow blade'));
    const hasWeaponFocus = feats.some(f => f.includes('weapon focus') && ((baseWepName && f.includes(baseWepName)) || f.includes(weapon.name.toLowerCase()) || f.includes('all')));
    const hasGreaterWeaponFocus = feats.some(f => f.includes('greater weapon focus') && ((baseWepName && f.includes(baseWepName)) || f.includes(weapon.name.toLowerCase()) || f.includes('all')));
    const hasWeaponSpec = feats.some(f => f.includes('weapon specialization') && ((baseWepName && f.includes(baseWepName)) || f.includes(weapon.name.toLowerCase()) || f.includes('all')));
    const hasGreaterWeaponSpec = feats.some(f => f.includes('greater weapon specialization') && ((baseWepName && f.includes(baseWepName)) || f.includes(weapon.name.toLowerCase()) || f.includes('all')));

    // 1. Attack Stat Calculation
    let attackStatMod = strMod;
    let attackStatName = 'STR';

    if (hasWeaponFinesse && this.isFinessable(weapon) && dexMod > strMod) {
      attackStatMod = dexMod;
      attackStatName = 'DEX (Weapon Finesse)';
    }

    // Power attack penalty: cannot exceed BAB
    const effectivePA = Math.min(bab, Math.max(0, Number(powerAttack) || 0));

    // Attack bonuses list
    const attackBonusItems = [
      { type: 'untyped', val: bab, source: 'BAB' },
      { type: 'untyped', val: attackStatMod, source: attackStatName },
      { type: 'untyped', val: -effectivePA, source: 'Power Attack Penalty' }
    ];

    // Combat Expertise penalty (cannot exceed BAB and cannot exceed 5 per RAW D&D 3.5e)
    const maxAllowedCE = Math.min(5, bab);
    const combatExpertise = Math.min(maxAllowedCE, Math.max(0, Number(options.combatExpertise !== undefined ? options.combatExpertise : (character.tactical?.combatExpertise || 0))));
    if (combatExpertise > 0) {
      attackBonusItems.push({ type: 'untyped', val: -combatExpertise, source: 'Combat Expertise Penalty' });
    }

    // Exotic Weapon Proficiency Check (RAW D&D 3.5e: -4 attack penalty if non-proficient)
    const isExotic = this.isExoticWeapon(weapon);
    if (isExotic) {
      const hasEWP = feats.some(f => {
        const cleanF = f.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
        return cleanF.includes('exotic weapon proficiency') && (cleanF.includes(baseWepName) || cleanF.includes('all'));
      });
      const hasWeaponAptitude = (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : a.name).toLowerCase().includes('weapon aptitude'));
      const hasAnyEWP = feats.some(f => f.toLowerCase().includes('exotic weapon proficiency'));
      
      if (!hasEWP && !(hasWeaponAptitude && hasAnyEWP)) {
        attackBonusItems.push({ type: 'penalty', val: -4, source: 'Non-Proficient Exotic Weapon (-4 Att)' });
      }
    }

    // Fighting Defensively penalty (-4 to all attack rolls)
    const fightingDefensively = options.fightingDefensively !== undefined ? options.fightingDefensively : (character.tactical?.fightingDefensively || false);
    if (fightingDefensively) {
      attackBonusItems.push({ type: 'untyped', val: -4, source: 'Fighting Defensively Penalty' });
    }

    // Monkey Grip penalty: -2 on attack rolls when wielding an oversized weapon
    const hasMonkeyGrip = feats.some(f => f.includes('monkey grip'));
    const isOversizedWeapon = weapon.isOversized || weapon.oversized || (weapon.tags && weapon.tags.includes('oversized'));
    if (isOversizedWeapon && hasMonkeyGrip) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Monkey Grip (-2 Att)' });
    }

    // Flaw: Noncombatant (-2 penalty on all melee attack rolls)
    const isRangedWep = grip === 'Ranged' || weapon.isRanged || (weapon.tags && weapon.tags.includes('ranged'));
    if (!isRangedWep && feats.some(f => f.includes('flaw: noncombatant') || f === 'noncombatant')) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Flaw: Noncombatant (-2 Melee)' });
    }
    // Flaw: Shaky (-2 penalty on all ranged attack rolls)
    if (isRangedWep && feats.some(f => f.includes('flaw: shaky') || f === 'shaky')) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Flaw: Shaky (-2 Ranged)' });
    }

    // Manyshot penalty: 2 arrows -> -2, 3 arrows -> -4, 4 arrows -> -6
    const effectiveManyshotArrows = isRangedWep && manyshot ? Math.min(4, Math.max(2, Number(optManyshotArrows || manyshot) || 2)) : 0;
    if (effectiveManyshotArrows > 0) {
      const penalty = (effectiveManyshotArrows - 1) * 2;
      attackBonusItems.push({ type: 'untyped', val: -penalty, source: `Manyshot (${effectiveManyshotArrows} Ok / -${penalty} Atk)` });
    }

    if (weapon.attBonus) {
      attackBonusItems.push({ type: weapon.bonusType || 'enhancement', val: weapon.attBonus, source: 'Weapon Enhancement' });
    }
    if (hasWeaponFocus) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Weapon Focus' });
    }
    if (hasGreaterWeaponFocus) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Greater Weapon Focus' });
    }
    if (flanking) {
      attackBonusItems.push({ type: 'untyped', val: 2, source: 'Flanking' });
    }
    if (charge) {
      attackBonusItems.push({ type: 'untyped', val: 2, source: 'Charge' });
    }
    if (higherGround) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Higher Ground' });
    }

    // Add active external attack modifiers from tactical list
    customModifiers.forEach(m => {
      if (m.bonusAtk) {
        attackBonusItems.push({ type: m.bonusType || 'untyped', val: m.bonusAtk, source: m.name });
      }
    });

    // Add bonuses from active buffs and child debuffs (Bless, Haste, Prayer, Energy Drain, Sickened, etc.)
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(b => {
        if (!b || !b.active) return;
        const hasChildren = Array.isArray(b.children) && b.children.length > 0;
        if (!hasChildren) {
          if (b.attBonus) {
            attackBonusItems.push({ type: b.bonusType || (b.isDebuff || b.attBonus < 0 ? 'penalty' : 'untyped'), val: b.attBonus, source: b.name });
          }
          if (b.negativeLevels) {
            attackBonusItems.push({ type: 'penalty', val: -b.negativeLevels, source: `${b.name} (-${b.negativeLevels} Lvl)` });
          }
        } else {
          b.children.forEach(c => {
            if (c.attBonus) {
              attackBonusItems.push({ type: c.bonusType || 'penalty', val: c.attBonus, source: `${b.name} → ${c.name}` });
            }
          });
        }
      });
    }

    const netAttackBonus = this.resolveBonusStacking(attackBonusItems);

    // 2. Damage Calculation (RAW D&D 3.5e)
    const isLightWep = this.isLightWeapon(weapon);
    const isCrossbow = baseWepName.includes('crossbow');
    const isBow = baseWepName.includes('bow') && !isCrossbow;
    const isRapier = baseWepName.includes('rapier');

    // Power Attack Multiplier: 0 for light or ranged weapons; 1 for 1-hand; 2 for 2-hand (except rapier: strictly 1 per RAW)
    let paDamageMultiplier = 1;
    if (isLightWep || isRangedWep) {
      paDamageMultiplier = 0;
    } else if (isRapier) {
      paDamageMultiplier = (grip === 'Off-Hand') ? 0 : 1;
    } else if (grip === '2-Hand') {
      paDamageMultiplier = 2;
    } else if (grip === 'Off-Hand') {
      paDamageMultiplier = 0;
    } else {
      paDamageMultiplier = 1;
    }

    // STR Damage Calculation per RAW D&D 3.5e:
    // - Negative STR: applied in full to all melee/thrown/bow attacks; NOT multiplied by 1.5 or halved to 0.5. Crossbows ignore even negative STR.
    // - Crossbow: No STR bonus or penalty to damage.
    // - Regular Bow: No STR bonus; full negative STR penalty.
    // - Composite Bow: STR bonus capped by composite rating; full negative STR penalty.
    // - Rapier: Cannot benefit from 1.5x STR when wielded two-handed (strictly 1.0x).
    let baseStrDmg = 0;
    let strDesc = `STR (${grip})`;

    if (isCrossbow) {
      baseStrDmg = 0;
      strDesc = 'Crossbow (No STR to Dmg)';
    } else if (isBow) {
      if (strMod < 0) {
        baseStrDmg = strMod;
        strDesc = 'Bow (Low STR Penalty)';
      } else if (baseWepName.includes('composite')) {
        const ratingMatch = (weapon.name || '').match(/\(\s*\+(\d+)\s*str\s*\)/i) || (weapon.desc || '').match(/composite\s*\(\s*\+(\d+)/i);
        const compRating = ratingMatch ? parseInt(ratingMatch[1], 10) : (weapon.compositeRating || 0);
        baseStrDmg = Math.min(compRating, strMod);
        strDesc = `Composite Bow (Max +${compRating} STR)`;
      } else {
        baseStrDmg = 0;
        strDesc = 'Regular Bow (No STR Bonus)';
      }
    } else {
      // Melee & Thrown Weapons
      if (strMod < 0) {
        // Negative STR is applied in full without multiplication or reduction
        baseStrDmg = strMod;
        strDesc = `STR Penalty (${strMod})`;
      } else if (isRapier) {
        // Rapier wielded two-handed does NOT get 1.5x STR
        baseStrDmg = (grip === 'Off-Hand') ? Math.floor(strMod * 0.5) : strMod;
        strDesc = (grip === 'Off-Hand') ? 'STR (Off-Hand 0.5x)' : 'STR (Rapier 1.0x)';
      } else if (grip === '2-Hand') {
        baseStrDmg = Math.floor(strMod * 1.5);
        strDesc = 'STR (2-Hand 1.5x)';
      } else if (grip === 'Off-Hand') {
        baseStrDmg = Math.floor(strMod * 0.5);
        strDesc = 'STR (Off-Hand 0.5x)';
      } else {
        baseStrDmg = strMod;
        strDesc = 'STR (1-Hand 1.0x)';
      }
    }

    const paDmg = effectivePA * paDamageMultiplier;

    const damageBonusItems = [
      { type: 'untyped', val: baseStrDmg, source: strDesc },
      { type: 'untyped', val: paDmg, source: `Power Attack (${paDamageMultiplier}x)` }
    ];

    if (weapon.dmgBonus) {
      damageBonusItems.push({ type: weapon.bonusType || 'enhancement', val: weapon.dmgBonus, source: 'Weapon Enhancement' });
    }
    if (hasWeaponSpec) {
      damageBonusItems.push({ type: 'untyped', val: 2, source: 'Weapon Specialization' });
    }
    if (hasGreaterWeaponSpec) {
      damageBonusItems.push({ type: 'untyped', val: 2, source: 'Greater Weapon Specialization' });
    }

    // Add damage bonuses from customModifiers (e.g. Enhance Arrow, active ability buffs)
    customModifiers.forEach(m => {
      if (m.bonusDmg) {
        damageBonusItems.push({ type: m.bonusType || 'untyped', val: m.bonusDmg, source: m.name });
      }
    });

    // Add damage bonuses from active buffs and child debuffs (Prayer, Divine Favor, Sickened, etc.)
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(b => {
        if (!b || !b.active) return;
        const hasChildren = Array.isArray(b.children) && b.children.length > 0;
        if (!hasChildren) {
          if (b.dmgBonus) {
            damageBonusItems.push({ type: b.bonusType || (b.isDebuff || b.dmgBonus < 0 ? 'penalty' : 'untyped'), val: b.dmgBonus, source: b.name });
          }
        } else {
          b.children.forEach(c => {
            if (c.dmgBonus) {
              damageBonusItems.push({ type: c.bonusType || 'penalty', val: c.dmgBonus, source: `${b.name} → ${c.name}` });
            }
          });
        }
      });
    }

    // Shadow Blade: Add DEX mod to damage if in Shadow Hand stance and using Shadow Hand weapon
    const isShadowStance = (activeStance.toLowerCase().includes('shadow') || activeStance.toLowerCase().includes('island of blades') || activeStance.toLowerCase().includes('child of shadow') || activeStance.toLowerCase().includes('assassin'));
    if (hasShadowBlade && isShadowStance && this.isShadowHandWeapon(weapon)) {
      damageBonusItems.push({ type: 'untyped', val: dexMod, source: 'Shadow Blade (DEX)' });
    }

    const netFlatDamage = this.resolveBonusStacking(damageBonusItems);

    // Iterative attacks for 3.5e: BAB >= 16 -> 4 attacks (+0/-5/-10/-15), BAB >= 11 -> 3, BAB >= 6 -> 2, otherwise 1
    let iteratives = [netAttackBonus];
    if (effectiveManyshotArrows > 0) {
      // Manyshot is a single Standard Action attack firing multiple arrows at once
      iteratives = [netAttackBonus];
    } else {
      if (bab >= 6) iteratives.push(netAttackBonus - 5);
      if (bab >= 11) iteratives.push(netAttackBonus - 10);
      if (bab >= 16) iteratives.push(netAttackBonus - 15);

      // Haste grants 1 extra full attack at highest BAB
      const hasHaste = (character.buffs || []).some(b => b.active && b.name.toLowerCase().includes('haste'));
      if (hasHaste) {
        iteratives.unshift(netAttackBonus); // duplicate primary attack
      }
    }

    const chargeMultiplier = chargeData.multiplier || 1;
    const chargeFlatDamage = netFlatDamage * chargeMultiplier;

    // Check for weapon size modifications from options, weapon properties, or active character buffs
    let effectiveSteps = Number(options.sizeSteps || weapon.sizeSteps || 0);
    const sizeBuffSources = [];

    if (Array.isArray(character?.buffs)) {
      character.buffs.forEach(b => {
        if (!b || !b.active) return;
        const targetWepName = (b.targetWeapon || '').toLowerCase().trim();
        const wepName = (weapon.name || '').toLowerCase().trim();
        const matchesWeapon = targetWepName && (
          targetWepName === wepName ||
          (weapon.id && b.targetWeaponId === weapon.id) ||
          wepName.includes(targetWepName) ||
          targetWepName.includes(wepName)
        );
        const isCreatureSizeBuff = (b.targetType === 'creature' || b.scope === 'creature' || (b.name && b.name.toLowerCase().includes('enlarge person'))) && b.sizeSteps;

        if (matchesWeapon && b.sizeSteps) {
          effectiveSteps += Number(b.sizeSteps) || 0;
          sizeBuffSources.push(`${b.name} (+${b.sizeSteps} basamak)`);
        } else if (isCreatureSizeBuff) {
          effectiveSteps += Number(b.sizeSteps) || 0;
          sizeBuffSources.push(`${b.name} (+${b.sizeSteps} yaratık boyutu)`);
        }
      });
    }

    const rawBaseDice = weapon.extraDmg || weapon.dice || '1d8';
    const effectiveDice = effectiveSteps !== 0 ? this.stepDamageDice(rawBaseDice, effectiveSteps) : rawBaseDice;

    return {
      netAttackBonus,
      iteratives,
      attackStatName,
      attackStatMod,
      effectivePA,
      rawBaseDice,
      baseDice: effectiveDice,
      effectiveDice,
      sizeSteps: effectiveSteps,
      sizeBuffSources,
      netFlatDamage,
      critMin: critData.critMin,
      critMult: critData.critMult,
      critThreatRangeCount: critData.threatRangeCount,
      critThreatRangeDisplay: critData.threatRangeDisplay,
      isKeen: critData.isKeen,
      hasImpCrit: critData.hasImpCrit,
      critData,
      chargeData,
      chargeMultiplier,
      chargeFlatDamage,
      ruleFlags,
      manyshotArrows: effectiveManyshotArrows,
      damageType: weapon.dmgType || 'Slashing',
      attackBonusItems,
      damageBonusItems
    };
  },

  // D&D 3.5e Carrying Capacity table based on STR
  getCarryingCapacity(strScore, charObj = null) {
    let rawStr = Number(strScore) || 10;
    const targetChar = charObj || (typeof character !== 'undefined' ? character : null);
    if (targetChar && Array.isArray(targetChar.feats)) {
      const feats = targetChar.feats.map(f => (typeof f === 'string' ? f : (f.name || '')).toLowerCase().trim());
      if (feats.some(f => f.includes('flaw: meager heft') || f.includes('meager heft'))) {
        rawStr = Math.max(1, rawStr - 3);
      }
    }
    const s = Math.max(1, Math.min(29, rawStr));
    const table = {
      1: [3, 6, 10], 2: [6, 13, 20], 3: [10, 20, 30], 4: [13, 26, 40],
      5: [16, 33, 50], 6: [20, 40, 60], 7: [23, 46, 70], 8: [26, 53, 80],
      9: [30, 60, 90], 10: [33, 66, 100], 11: [38, 76, 115], 12: [43, 86, 130],
      13: [50, 100, 150], 14: [58, 116, 175], 15: [66, 133, 200], 16: [76, 153, 230],
      17: [86, 173, 260], 18: [100, 200, 300], 19: [116, 233, 350], 20: [133, 266, 400],
      21: [153, 306, 460], 22: [173, 346, 520], 23: [200, 400, 600], 24: [233, 466, 700],
      25: [266, 533, 800], 26: [306, 613, 920], 27: [346, 693, 1040], 28: [400, 800, 1200],
      29: [466, 933, 1400]
    };
    const row = table[s] || [33, 66, 100];
    return {
      light: row[0],
      medium: row[1],
      heavy: row[2],
      lift: row[2],
      ground: row[2] * 2,
      drag: row[2] * 5
    };
  },

  // Calculate load status given current weight and STR
  getLoadStatus(currentWeight, strScore) {
    const caps = this.getCarryingCapacity(strScore);
    const wt = Number(currentWeight) || 0;
    if (wt <= caps.light) return { status: 'Hafif Yük (Light Load)', color: 'emerald', maxDex: null, checkPenalty: 0, speed30: 30, speed20: 20 };
    if (wt <= caps.medium) return { status: 'Orta Yük (Medium Load)', color: 'amber', maxDex: 3, checkPenalty: -3, speed30: 20, speed20: 15 };
    if (wt <= caps.heavy) return { status: 'Ağır Yük (Heavy Load)', color: 'orange', maxDex: 1, checkPenalty: -6, speed30: 20, speed20: 15 };
    return { status: 'Aşırı Yük / Hareketsiz (Overloaded)', color: 'rose', maxDex: 0, checkPenalty: -10, speed30: 5, speed20: 5 };
  },

  /**
   * Evaluate specific skill bonus from equipped items, active buffs, feats, and masterwork tools.
   * Resolves D&D 3.5e stacking rules: same bonus types do not stack (take highest),
   * while different bonus types (Competence, Insight, Luck, Morale, Circumstance, Untyped) stack.
   */
  evaluateSkillBonus(character, skillKey, skillName, statName) {
    if (!character) return { total: 0, breakdown: [] };
    const sName = (skillName || '').toLowerCase().trim();
    const sKey = (skillKey || '').toLowerCase().trim();
    const isKnowledge = sName.startsWith('knowledge') || sKey.startsWith('knowledge') || sName.includes('bilgi');

    // Buckets for typed bonuses: competence, insight, luck, morale, enhancement, circumstance, untyped, penalty
    const buckets = {};
    const addBonus = (sourceName, val, bType = 'untyped') => {
      const v = Number(val) || 0;
      if (v === 0) return;
      const type = (bType || 'untyped').toLowerCase().trim();
      if (!buckets[type]) buckets[type] = [];
      buckets[type].push({ name: sourceName, val: v });
    };

    // 1. General Buffs & Debuffs (character.buffSkillBonus, negative levels)
    if (character.buffSkillBonus) {
      addBonus('Genel Buff/Debuff', character.buffSkillBonus, 'untyped');
    }

    // 2. Active Buffs in character.buffs
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(buff => {
        if (!buff || !buff.active) return;
        const items = [buff];
        if (Array.isArray(buff.children)) items.push(...buff.children);

        items.forEach(b => {
          const scope = (b.scope || b.target || '').toLowerCase().trim();
          const targetSkill = (b.targetSkill || b.skill || '').toLowerCase().trim();
          const bVal = Number(b.skillBonus || b.bonus || b.bonusVal) || 0;
          const bType = b.bonusType || 'untyped';

          if (bVal !== 0) {
            let applies = false;
            if (scope === 'all skills' || scope === 'skills' || scope === 'all') applies = true;
            else if (isKnowledge && (scope === 'knowledge' || scope === 'all knowledge' || scope.includes('knowledge'))) applies = true;
            else if (targetSkill && (sKey === targetSkill || sName.includes(targetSkill))) applies = true;
            else if (scope && (sKey.includes(scope) || sName.includes(scope))) applies = true;

            if (applies) {
              addBonus(b.name || buff.name, bVal, bType);
            }
          }
        });
      });
    }

    // 3. Body Slot Equipped Items (character.bodySlots)
    if (character.bodySlots && typeof character.bodySlots === 'object') {
      Object.entries(character.bodySlots).forEach(([slotKey, item]) => {
        if (!item || !item.active || !item.name || item.name === '-') return;
        this._checkItemSkillBonus(item, sKey, sName, isKnowledge, addBonus);
      });
    }

    // 4. Gear Pool Items (Equipped items or Slotless wonderous items like Luckstone / Tome / Ioun Stone)
    if (Array.isArray(character.gearPool)) {
      character.gearPool.forEach(item => {
        if (!item) return;
        const isSlotless = (item.slot || '').toLowerCase().includes('slotless') || (item.category || '').toLowerCase() === 'other' || (item.category || '').toLowerCase() === 'wondrous item';
        if (item.isEquipped || isSlotless) {
          this._checkItemSkillBonus(item, sKey, sName, isKnowledge, addBonus);
        }
      });
    }

    // 5. Feats & Special Abilities (e.g. Collector of Stories, Draconic Knowledge)
    const featsList = [...(character.feats || []), ...(character.specialAbilities || [])];
    featsList.forEach(feat => {
      if (!feat) return;
      const fName = (typeof feat === 'string' ? feat : feat.name || '').toLowerCase();
      const scope = (feat.scope || '').toLowerCase();
      const bVal = Number(feat.skillBonus || feat.bonus) || 0;
      const bType = feat.bonusType || 'competence';

      if (bVal !== 0) {
        if (scope === 'all skills' || (isKnowledge && scope.includes('knowledge'))) {
          addBonus(feat.name || fName, bVal, bType);
        }
      }

      // Built-in recognition for Collector of Stories (+5 Competence to Knowledge monster checks)
      if (fName.includes('collector of stories') && isKnowledge) {
        addBonus('Collector of Stories (Canavar Tanıma)', 5, 'competence');
      }
    });

    // 6. Resolve Stacking Rules (D&D 3.5e RAW)
    let total = 0;
    const breakdown = [];

    Object.entries(buckets).forEach(([type, entries]) => {
      if (type === 'untyped' || type === 'circumstance' || type === 'penalty') {
        entries.forEach(e => {
          total += e.val;
          breakdown.push(`${e.name}: ${e.val >= 0 ? '+' : ''}${e.val} (${type})`);
        });
      } else {
        let highest = entries[0];
        entries.forEach(e => {
          if (e.val > highest.val) highest = e;
        });
        total += highest.val;
        breakdown.push(`${highest.name}: +${highest.val} (${type})`);
      }
    });

    return { total, breakdown };
  },

  _checkItemSkillBonus(item, sKey, sName, isKnowledge, addBonus) {
    if (!item) return;

    // Declarative helper to evaluate item or masterDb entry bonuses
    const processSkillData = (sourceObj, sourceTitle) => {
      let applied = false;
      const bType = sourceObj.bonusType || 'competence';

      // 1. Multiple skill bonuses map (e.g. { "Open Lock": 4, "Escape Artist": 6, "Jump": 5 })
      if (sourceObj.skillBonuses && typeof sourceObj.skillBonuses === 'object') {
        Object.entries(sourceObj.skillBonuses).forEach(([target, val]) => {
          const tNorm = target.toLowerCase().replace(/[^a-z0-9]/g, '');
          const kNorm = sKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          const nNorm = sName.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (kNorm.includes(tNorm) || nNorm.includes(tNorm) || tNorm.includes(kNorm) || tNorm.includes(nNorm)) {
            addBonus(sourceTitle, Number(val) || 0, bType);
            applied = true;
          }
        });
      }

      // 2. Single skillBonus with scope or targetSkill
      const bVal = Number(sourceObj.skillBonus || sourceObj.bonus) || 0;
      if (bVal !== 0) {
        const scope = (sourceObj.scope || '').toLowerCase().trim();
        const targetSkill = (sourceObj.targetSkill || sourceObj.skill || '').toLowerCase().trim();

        let applies = false;
        if (scope === 'all skills' || scope === 'skills' || scope === 'all') applies = true;
        else if (isKnowledge && (scope === 'knowledge' || scope === 'all knowledge' || scope.includes('knowledge'))) applies = true;
        else if (targetSkill && (sKey === targetSkill || sName.includes(targetSkill))) applies = true;
        else if (scope && (sKey.includes(scope) || sName.includes(scope))) applies = true;

        if (applies) {
          addBonus(sourceTitle, bVal, bType);
          applied = true;
        }
      }
      return applied;
    };

    // First check the item itself
    const itemHandled = processSkillData(item, item.name || 'Equipped Item');

    // If not handled directly, check masterDb catalog declaratively
    if (!itemHandled) {
      const iName = (item.name || '').toLowerCase().trim();
      const masterList = (typeof window !== 'undefined' && (window.masterDb || window.BUNDLED_MASTER_DB)) || [];
      if (Array.isArray(masterList) && iName) {
        const dbEntry = masterList.find(dbItem => {
          const dbName = (dbItem.name || '').toLowerCase().trim();
          return dbName === iName || (iName.length >= 4 && (iName.includes(dbName) || dbName.includes(iName)));
        });
        if (dbEntry) {
          processSkillData(dbEntry, item.name || dbEntry.name);
        }
      }
    }
  },

  // D&D 3.5e Class Definitions with Base Stats & Class Features by Level
  DND35_CLASS_DEFS: {
    "Warblade": {
      hd: 12, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 4,
      bonusFeatLevels: [5, 9, 13, 17],
      features: {
        1: [
          { name: "Battle Clarity (Ex)", category: "Special Ability", type: "Ex", summary: "INT modifier to Reflex saves (max Warblade lvl)" },
          { name: "Weapon Aptitude (Ex)", category: "Special Ability", type: "Ex", summary: "Adjust weapon feats to different weapons with 1 hour practice" }
        ],
        2: [{ name: "Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", summary: "Retain Dex bonus to AC even if caught flat-footed" }],
        3: [{ name: "Battle Ardor (Ex)", category: "Special Ability", type: "Ex", summary: "INT modifier on rolls made to confirm critical hits" }],
        6: [{ name: "Improved Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", summary: "Can no longer be flanked unless attacker is 4+ levels higher" }],
        7: [{ name: "Battle Cunning (Ex)", category: "Special Ability", type: "Ex", summary: "INT modifier to damage rolls against flat-footed or flanked foes" }],
        11: [{ name: "Battle Skill (Ex)", category: "Special Ability", type: "Ex", summary: "INT modifier on checks to resist combat maneuvers" }],
        15: [{ name: "Battle Mastery (Ex)", category: "Special Ability", type: "Ex", summary: "INT modifier on melee attack rolls and damage rolls on AoO" }],
        20: [{ name: "Stance Mastery (Ex)", category: "Special Ability", type: "Ex", summary: "Can have two stances active simultaneously" }]
      }
    },
    "Fighter": {
      hd: 10, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 2,
      bonusFeatLevels: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
      features: {}
    },
    "Barbarian": {
      hd: 12, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 4,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Fast Movement (Ex)", category: "Special Ability", type: "Ex", summary: "+10 ft to base land speed in light or medium armor" },
          { name: "Rage 1/day (Ex)", category: "Special Ability", type: "Ex", summary: "+4 Str, +4 Con, +2 morale to Will saves, -2 AC for 3+Con rounds" }
        ],
        2: [{ name: "Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", summary: "Retain Dex bonus to AC if flat-footed" }],
        3: [{ name: "Trap Sense +1 (Ex)", category: "Special Ability", type: "Ex", summary: "+1 on Reflex saves and AC vs traps" }],
        4: [{ name: "Rage 2/day (Ex)", category: "Special Ability", type: "Ex", summary: "Can rage 2 times per day" }],
        5: [{ name: "Improved Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", summary: "Can no longer be flanked unless attacker is 4+ levels higher" }],
        6: [{ name: "Trap Sense +2 (Ex)", category: "Special Ability", type: "Ex", summary: "+2 on Reflex saves and AC vs traps" }],
        7: [{ name: "Damage Reduction 1/- (Ex)", category: "Special Ability", type: "Ex", summary: "Ignore 1 point of damage from each melee or ranged attack" }]
      }
    },
    "Rogue": {
      hd: 6, bab: 0.75, fort: "poor", ref: "good", will: "poor", skills: 8,
      bonusFeatLevels: [10, 13, 16, 19],
      features: {
        1: [
          { name: "Sneak Attack +1d6", category: "Special Ability", type: "Ex", summary: "+1d6 precision damage vs flanked or flat-footed target" },
          { name: "Trapfinding (Ex)", category: "Special Ability", type: "Ex", summary: "Can use Search skill to locate traps with DC > 20" }
        ],
        2: [{ name: "Evasion (Ex)", category: "Special Ability", type: "Ex", summary: "Take no damage on successful Reflex save against area attacks" }],
        3: [
          { name: "Sneak Attack +2d6", category: "Special Ability", type: "Ex", summary: "+2d6 precision damage vs flanked or flat-footed target" },
          { name: "Trap Sense +1 (Ex)", category: "Special Ability", type: "Ex", summary: "+1 on Reflex saves and AC vs traps" }
        ],
        4: [{ name: "Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", summary: "Retain Dex bonus to AC if flat-footed" }],
        5: [{ name: "Sneak Attack +3d6", category: "Special Ability", type: "Ex", summary: "+3d6 precision damage vs flanked or flat-footed target" }],
        6: [{ name: "Trap Sense +2 (Ex)", category: "Special Ability", type: "Ex", summary: "+2 on Reflex saves and AC vs traps" }],
        7: [{ name: "Sneak Attack +4d6", category: "Special Ability", type: "Ex", summary: "+4d6 precision damage vs flanked or flat-footed target" }],
        8: [{ name: "Improved Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", summary: "Cannot be flanked except by rogue 4+ levels higher" }],
        9: [
          { name: "Sneak Attack +5d6", category: "Special Ability", type: "Ex", summary: "+5d6 precision damage vs flanked or flat-footed target" },
          { name: "Trap Sense +3 (Ex)", category: "Special Ability", type: "Ex", summary: "+3 on Reflex saves and AC vs traps" }
        ]
      }
    },
    "Wizard": {
      hd: 4, bab: 0.5, fort: "poor", ref: "poor", will: "good", skills: 2,
      bonusFeatLevels: [1, 5, 10, 15, 20],
      features: {
        1: [
          { name: "Scribe Scroll", category: "Special Ability", type: "Ex", summary: "Create spell scrolls" },
          { name: "Summon Familiar", category: "Special Ability", type: "Sp", summary: "Summon a magical animal companion" }
        ]
      }
    },
    "Sorcerer": {
      hd: 4, bab: 0.5, fort: "poor", ref: "poor", will: "good", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [{ name: "Summon Familiar", category: "Special Ability", type: "Sp", summary: "Summon a magical animal companion" }]
      }
    },
    "Cleric": {
      hd: 8, bab: 0.75, fort: "good", ref: "poor", will: "good", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [{ name: "Turn Undead (Su)", category: "Special Ability", type: "Su", summary: "Channel positive energy to turn or destroy undead 3+Cha times/day" }]
      }
    },
    "Paladin": {
      hd: 10, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Aura of Good (Ex)", category: "Special Ability", type: "Ex", summary: "Aura of good equal to paladin level" },
          { name: "Detect Evil (Sp)", category: "Special Ability", type: "Sp", summary: "At will, detect evil as the spell" },
          { name: "Smite Evil (Su)", category: "Special Ability", type: "Su", summary: "Add Cha bonus to attack and +1 damage per Paladin level against evil (1/day)" }
        ],
        2: [
          { name: "Divine Grace (Su)", category: "Special Ability", type: "Su", summary: "Gain bonus equal to Charisma bonus on all saving throws" },
          { name: "Lay on Hands (Su)", category: "Special Ability", type: "Su", summary: "Heal each day hit points equal to Paladin level x Charisma bonus" }
        ],
        3: [
          { name: "Aura of Courage (Su)", category: "Special Ability", type: "Su", summary: "Immune to fear; allies within 10 ft gain +4 on saves vs fear" },
          { name: "Divine Health (Ex)", category: "Special Ability", type: "Ex", summary: "Immunity to all diseases" }
        ],
        4: [{ name: "Turn Undead (Su)", category: "Special Ability", type: "Su", summary: "Turn undead as cleric of level - 3" }],
        5: [{ name: "Special Mount (Sp)", category: "Special Ability", type: "Sp", summary: "Call an intelligent, loyal war steed" }]
      }
    },
    "Monk": {
      hd: 8, bab: 0.75, fort: "good", ref: "good", will: "good", skills: 4,
      bonusFeatLevels: [1, 2, 6],
      features: {
        1: [
          { name: "Flurry of Blows (Ex)", category: "Special Ability", type: "Ex", summary: "One extra attack during full attack (-2 all attacks)" },
          { name: "Unarmed Strike", category: "Special Ability", type: "Ex", summary: "Lethal or nonlethal unarmed strike damage without penalty" }
        ],
        2: [{ name: "Evasion (Ex)", category: "Special Ability", type: "Ex", summary: "Take no damage on successful Reflex save vs area attacks" }],
        3: [
          { name: "Fast Movement +10 ft (Ex)", category: "Special Ability", type: "Ex", summary: "+10 ft monk land speed bonus" },
          { name: "Still Mind (Ex)", category: "Special Ability", type: "Ex", summary: "+2 on saves vs enchantment spells/effects" }
        ],
        4: [{ name: "Ki Strike (Magic) (Su)", category: "Special Ability", type: "Su", summary: "Unarmed strikes overcome DR as magic weapons" }],
        5: [{ name: "Purity of Body (Ex)", category: "Special Ability", type: "Ex", summary: "Immunity to all normal diseases" }]
      }
    },
    "Ranger": {
      hd: 8, bab: 1.0, fort: "good", ref: "good", will: "poor", skills: 6,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "1st Favored Enemy", category: "Special Ability", type: "Ex", summary: "+2 on Bluff, Listen, Sense Motive, Spot, Survival and damage vs chosen type" },
          { name: "Track", category: "Feat", type: "Ex", summary: "Use Survival to follow tracks" },
          { name: "Wild Empathy (Ex)", category: "Special Ability", type: "Ex", summary: "Improve the attitude of an animal" }
        ],
        2: [{ name: "Combat Style (Ex)", category: "Special Ability", type: "Ex", summary: "Gain Rapid Shot or Two-Weapon Fighting" }],
        3: [{ name: "Endurance", category: "Feat", type: "Ex", summary: "Gain Endurance as a bonus feat" }],
        4: [{ name: "Animal Companion (Ex)", category: "Special Ability", type: "Ex", summary: "Gain an animal companion" }]
      }
    },
    "Bard": {
      hd: 6, bab: 0.75, fort: "poor", ref: "good", will: "good", skills: 6,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Bardic Music (Su)", category: "Special Ability", type: "Su", summary: "Perform magical songs 1/day per bard level" },
          { name: "Bardic Knowledge (Ex)", category: "Special Ability", type: "Ex", summary: "Ancient lore check (1d20 + Bard level + Int)" },
          { name: "Countersong (Su)", category: "Special Ability", type: "Su", summary: "Counter sonic magical attacks with perform check" },
          { name: "Fascinate (Sp)", category: "Special Ability", type: "Sp", summary: "Entrall creatures within 90 ft" },
          { name: "Inspire Courage +1 (Su)", category: "Special Ability", type: "Su", summary: "+1 morale on saves vs charm/fear and attack/damage" }
        ]
      }
    },
    "Druid": {
      hd: 8, bab: 0.75, fort: "good", ref: "poor", will: "good", skills: 4,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Animal Companion (Ex)", category: "Special Ability", type: "Ex", summary: "Gain a loyal animal companion" },
          { name: "Nature Sense (Ex)", category: "Special Ability", type: "Ex", summary: "+2 on Knowledge (nature) and Survival checks" },
          { name: "Wild Empathy (Ex)", category: "Special Ability", type: "Ex", summary: "Improve attitude of animals" }
        ],
        2: [{ name: "Woodland Stride (Ex)", category: "Special Ability", type: "Ex", summary: "Move through natural thorns/briars at normal speed" }],
        3: [{ name: "Trackless Step (Ex)", category: "Special Ability", type: "Ex", summary: "Leaves no trail in natural surroundings" }],
        4: [{ name: "Resist Nature's Lure (Ex)", category: "Special Ability", type: "Ex", summary: "+4 on saves vs spell-like abilities of fey" }],
        5: [{ name: "Wild Shape (1/day) (Su)", category: "Special Ability", type: "Su", summary: "Assume animal shape for 1 hr/level" }]
      }
    },
    "Crusader": {
      hd: 10, bab: 1.0, fort: "good", ref: "poor", will: "good", skills: 4,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Steely Resolve 5 (Ex)", category: "Special Ability", type: "Ex", summary: "Delayed damage pool of 5 points" },
          { name: "Furious Counterstrike (Ex)", category: "Special Ability", type: "Ex", summary: "Gain +1 to +6 morale to attack/damage from delayed damage" }
        ],
        2: [{ name: "Indomitable Soul (Ex)", category: "Special Ability", type: "Ex", summary: "Add Cha modifier as an insight bonus to Will saves" }]
      }
    },
    "Swordsage": {
      hd: 8, bab: 0.75, fort: "poor", ref: "good", will: "good", skills: 6,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Quick to Act +1 (Ex)", category: "Special Ability", type: "Ex", summary: "+1 bonus on initiative checks" },
          { name: "Discipline Focus (Weapon Focus)", category: "Special Ability", type: "Ex", summary: "Weapon Focus in discipline weapons" }
        ],
        2: [{ name: "AC Bonus (Ex)", category: "Special Ability", type: "Ex", summary: "Add Wis modifier to AC in light armor" }]
      }
    },
    "Duskblade": {
      hd: 8, bab: 1.0, fort: "good", ref: "poor", will: "good", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [{ name: "Arcane Attunement (Sp)", category: "Special Ability", type: "Sp", summary: "Cast Dancing Lights, Detect Magic, Flare, Ghost Sound, Read Magic 3+Int/day" }],
        2: [{ name: "Combat Casting", category: "Feat", type: "Ex", summary: "Gain Combat Casting as a bonus feat" }],
        3: [{ name: "Arcane Channeling (Su)", category: "Special Ability", type: "Su", summary: "Channel touch spells through melee weapon attack" }]
      }
    },
    "Abjurant Champion": {
      hd: 10, bab: 1.0, fort: "poor", ref: "poor", will: "good", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Abjurant Armor (Su)", category: "Special Ability", type: "Su", summary: "Add Abjurant Champion level to armor/shield bonus of abjuration spells" },
          { name: "Extended Abjuration (Su)", category: "Special Ability", type: "Su", summary: "Abjuration spells automatically have doubled duration" }
        ],
        2: [{ name: "Swift Abjuration (Su)", category: "Special Ability", type: "Su", summary: "Cast abjuration spells as swift actions" }],
        4: [{ name: "Arcane Boost (Su)", category: "Special Ability", type: "Su", summary: "Burn spell slot for swift attack, damage, AC or save bonus" }],
        5: [{ name: "Martial Arcanist (Ex)", category: "Special Ability", type: "Ex", summary: "Arcane Caster Level equals Base Attack Bonus (BAB)" }]
      }
    },
    "Eldritch Knight": {
      hd: 6, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 2,
      bonusFeatLevels: [1],
      features: {
        1: [{ name: "Diverse Training (Ex)", category: "Special Ability", type: "Ex", summary: "Levels stack with fighter and caster levels for prerequisites" }]
      }
    },
    "Bloodstorm Blade": {
      hd: 12, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Returning Attacks (Ex)", category: "Special Ability", type: "Ex", summary: "Thrown weapons return to your hand just before your next attack" },
          { name: "Weapon Aptitude (Ex)", category: "Special Ability", type: "Ex", summary: "Reassign weapon-specific feats to other weapons with 1 hour practice" }
        ],
        2: [
          { name: "Throw Anything (Ex)", category: "Special Ability", type: "Ex", summary: "Throw any melee weapon with 10 ft range increment without penalty" },
          { name: "Iron Wind (Ex)", category: "Special Ability", type: "Ex", summary: "Swift action: hit two adjacent foes with a single thrown weapon" }
        ],
        3: [{ name: "Thunderous Throw (Ex)", category: "Special Ability", type: "Ex", summary: "Swift action: treat thrown attacks as melee attacks for Power Attack and feats" }],
        4: [{ name: "Lightning Ricochet (Ex)", category: "Special Ability", type: "Ex", summary: "Thrown weapon returns immediately after attack, enabling full iterative attacks" }],
        5: [{ name: "Blood Wind (Ex)", category: "Special Ability", type: "Ex", summary: "Ricochet thrown weapon to an additional foe within range" }]
      }
    },
    "Arcane Archer": {
      hd: 8, bab: 1.0, fort: "good", ref: "good", will: "poor", skills: 4,
      bonusFeatLevels: [],
      features: {
        1: [{ name: "Enhance Arrow +1 (Su)", category: "Special Ability", type: "Su", summary: "Fired arrows receive +1 enhancement bonus" }],
        2: [{ name: "Imbue Arrow (Sp)", category: "Special Ability", type: "Sp", summary: "Place area spell upon an arrow; spell detonates where arrow lands" }],
        4: [{ name: "Seeker Arrow (Sp)", category: "Special Ability", type: "Sp", summary: "Arrow shoots around corners and ignores cover" }]
      }
    },
    "Assassin": {
      hd: 6, bab: 0.75, fort: "poor", ref: "good", will: "poor", skills: 4,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Sneak Attack +1d6", category: "Special Ability", type: "Ex", summary: "+1d6 precision damage" },
          { name: "Death Attack (Ex)", category: "Special Ability", type: "Ex", summary: "Kill or paralyze studied target" },
          { name: "Poison Use", category: "Special Ability", type: "Ex", summary: "Never risk poisoning self when applying poison" }
        ],
        2: [{ name: "+1 Save vs Poison", category: "Special Ability", type: "Ex", summary: "+1 bonus on saving throws against poison" }]
      }
    },
    "Shadowdancer": {
      hd: 8, bab: 0.75, fort: "poor", ref: "good", will: "poor", skills: 6,
      bonusFeatLevels: [],
      features: {
        1: [{ name: "Hide in Plain Sight (Su)", category: "Special Ability", type: "Su", summary: "Hide while observed as long as within 10 ft of a shadow" }],
        2: [
          { name: "Evasion (Ex)", category: "Special Ability", type: "Ex", summary: "Take no damage on successful Reflex save" },
          { name: "Uncanny Dodge (Ex)", category: "Special Ability", type: "Ex", summary: "Retain Dex bonus to AC even when flat-footed" }
        ],
        4: [{ name: "Shadow Jump (Su)", category: "Special Ability", type: "Su", summary: "Travel between shadows like Dimension Door" }]
      }
    },
    "Dragon Disciple": {
      hd: 12, bab: 0.75, fort: "good", ref: "poor", will: "good", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [{ name: "Natural Armor Increase +1 (Ex)", category: "Special Ability", type: "Ex", summary: "+1 natural armor bonus to AC" }],
        2: [{ name: "Ability Boost (+2 Str) (Ex)", category: "Special Ability", type: "Ex", summary: "Permanent +2 racial bonus to Strength" }],
        3: [{ name: "Breath Weapon (Su)", category: "Special Ability", type: "Su", summary: "Line or cone breath weapon dealing energy damage" }]
      }
    },
    "Mystic Theurge": {
      hd: 4, bab: 0.5, fort: "poor", ref: "poor", will: "good", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [{ name: "Combined Spellcasting (Arcane & Divine)", category: "Special Ability", type: "Ex", summary: "Advance both arcane and divine spellcasting progression" }]
      }
    },
    "Dervish": {
      hd: 10, bab: 1.0, fort: "good", ref: "good", will: "poor", skills: 4,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Dervish Dance 1/day (Ex)", category: "Special Ability", type: "Ex", summary: "Take full attack action while moving up to speed" },
          { name: "AC Bonus +1 (Ex)", category: "Special Ability", type: "Ex", summary: "+1 dodge bonus to AC while wearing light or no armor" }
        ],
        2: [{ name: "Fast Movement +5 ft (Ex)", category: "Special Ability", type: "Ex", summary: "+5 ft speed bonus" }]
      }
    },
    "Spellsword": {
      hd: 8, bab: 1.0, fort: "good", ref: "poor", will: "good", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [{ name: "Ignore Spell Failure 10% (Ex)", category: "Special Ability", type: "Ex", summary: "Reduce arcane spell failure chance of armor by 10%" }],
        2: [{ name: "Multiple Spell Channeling (Su)", category: "Special Ability", type: "Su", summary: "Store a spell in melee weapon to release upon hit" }]
      }
    },
    "Jade Phoenix Mage": {
      hd: 6, bab: 1.0, fort: "good", ref: "poor", will: "good", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Arcane Wrath (Su)", category: "Special Ability", type: "Su", summary: "Expend spell slot for +4 attack and +1d10 energy damage per spell level" },
          { name: "Rite of Waking (Ex)", category: "Special Ability", type: "Ex", summary: "+2 on Knowledge checks and advance arcane CL & martial IL" }
        ],
        2: [{ name: "Mystic Phoenix Stance (Su)", category: "Special Ability", type: "Su", summary: "Stance: +2 CL on fire spells, DR 2/evil, and +1 CL" }]
      }
    },
    "Warlock": {
      hd: 6, bab: 0.75, fort: "poor", ref: "poor", will: "good", skills: 2,
      bonusFeatLevels: [],
      features: {
        1: [
          { name: "Eldritch Blast 1d6 (Sp)", category: "Special Ability", type: "Sp", summary: "At will ranged touch attack dealing 1d6 untyped magical damage" },
          { name: "Least Invocations", category: "Special Ability", type: "Sp", summary: "Cast least warlock invocations at will" }
        ],
        2: [{ name: "Detect Magic (Sp)", category: "Special Ability", type: "Sp", summary: "At will Detect Magic" }],
        3: [
          { name: "Damage Reduction 1/cold iron (Su)", category: "Special Ability", type: "Su", summary: "DR 1/cold iron" },
          { name: "Eldritch Blast 2d6 (Sp)", category: "Special Ability", type: "Sp", summary: "Eldritch blast damage increases to 2d6" }
        ]
      }
    }
  },

  // Get granted class features and bonus feats for a given class and level
  getClassLevelFeatures(className, classLevel) {
    const def = this.DND35_CLASS_DEFS[className];
    if (!def) return { features: [], featureObjects: [], hasBonusFeat: false };
    const cl = Number(classLevel) || 1;
    const rawFeatures = (def.features && def.features[cl]) ? def.features[cl] : [];
    const features = rawFeatures.map(f => (typeof f === 'string' ? f : f.name));
    const featureObjects = rawFeatures.map(f => (typeof f === 'string' ? { name: f, benefit: '' } : f));
    const hasBonusFeat = Array.isArray(def.bonusFeatLevels) && def.bonusFeatLevels.includes(cl);
    return { features, featureObjects, hasBonusFeat };
  },

  // D&D 3.5e Fractional BAB & Save Progression Calculator (Unearthed Arcana)
  calculateProgression(levelProgression = [], options = {}) {
    const system = options.system || 'fractional'; // 'fractional' or 'standard'
    const isHuman = options.isHuman ?? true;
    const intMod = Number(options.intMod) || 0;

    let activeLevels = 0;
    let plannedLevels = levelProgression.length;
    let baseHp = 0;
    let totalBabFractional = 0;
    let totalFortFractional = 0;
    let totalRefFractional = 0;
    let totalWillFractional = 0;

    let goodFortGranted = false;
    let goodRefGranted = false;
    let goodWillGranted = false;

    const classCounts = {};
    let totalSkillPts = 0;
    const activeFeats = [];
    const activeSpecialAbilities = [];

    levelProgression.forEach((lvl, index) => {
      const isActive = lvl.active !== false;
      if (!isActive) return;

      activeLevels++;
      baseHp += Number(lvl.hpGain) || 0;

      const cName = lvl.className || 'Warblade';
      const cDef = this.DND35_CLASS_DEFS[cName] || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4 };
      classCounts[cName] = (classCounts[cName] || 0) + 1;

      // Fractional BAB
      totalBabFractional += cDef.bab;

      // Fractional Saves
      if (cDef.fort === 'good') {
        totalFortFractional += (goodFortGranted ? 0.5 : 2.5);
        goodFortGranted = true;
      } else {
        totalFortFractional += (1 / 3);
      }

      if (cDef.ref === 'good') {
        totalRefFractional += (goodRefGranted ? 0.5 : 2.5);
        goodRefGranted = true;
      } else {
        totalRefFractional += (1 / 3);
      }

      if (cDef.will === 'good') {
        totalWillFractional += (goodWillGranted ? 0.5 : 2.5);
        goodWillGranted = true;
      } else {
        totalWillFractional += (1 / 3);
      }

      // Skill Points
      const baseSkill = cDef.skills || 2;
      if (activeLevels === 1) {
        totalSkillPts += Math.max(4, (baseSkill + intMod) * 4) + (isHuman ? 4 : 0);
      } else {
        totalSkillPts += Math.max(1, baseSkill + intMod) + (isHuman ? 1 : 0);
      }

      // Collect active feats & abilities
      if (Array.isArray(lvl.feats)) {
        lvl.feats.forEach(f => activeFeats.push(f));
      }
      if (Array.isArray(lvl.specialAbilities)) {
        lvl.specialAbilities.forEach(a => activeSpecialAbilities.push(a));
      }
    });

    let finalBab = 0;
    let finalFort = 0;
    let finalRef = 0;
    let finalWill = 0;

    if (system === 'fractional') {
      finalBab = Math.floor(totalBabFractional + 1e-6);
      finalFort = Math.floor(totalFortFractional + 1e-6);
      finalRef = Math.floor(totalRefFractional + 1e-6);
      finalWill = Math.floor(totalWillFractional + 1e-6);
    } else {
      // Standard Core 3.5e: sum table values for each class
      Object.entries(classCounts).forEach(([cName, count]) => {
        const cDef = this.DND35_CLASS_DEFS[cName] || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good' };
        if (cDef.bab === 1.0) finalBab += count;
        else if (cDef.bab === 0.75) finalBab += Math.floor(count * 0.75);
        else finalBab += Math.floor(count * 0.5);

        finalFort += (cDef.fort === 'good' ? 2 + Math.floor(count * 0.5) : Math.floor(count / 3));
        finalRef += (cDef.ref === 'good' ? 2 + Math.floor(count * 0.5) : Math.floor(count / 3));
        finalWill += (cDef.will === 'good' ? 2 + Math.floor(count * 0.5) : Math.floor(count / 3));
      });
    }

    return {
      activeLevels,
      plannedLevels,
      baseHp,
      baseBab: finalBab,
      baseSaves: { fort: finalFort, ref: finalRef, will: finalWill },
      totalSkillPoints: totalSkillPts,
      fractional: {
        bab: totalBabFractional,
        fort: totalFortFractional,
        ref: totalRefFractional,
        will: totalWillFractional
      },
      classCounts,
      activeFeats,
      activeSpecialAbilities
    };
  }
};

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RuleEngine;
} else if (typeof window !== 'undefined') {
  window.RuleEngine = RuleEngine;
}
