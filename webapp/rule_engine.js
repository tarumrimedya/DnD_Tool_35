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

  // Check if weapon qualifies for Weapon Finesse
  isFinessable(weapon) {
    if (!weapon) return false;
    const name = (weapon.name || '').toLowerCase();
    const type = (weapon.type || '').toLowerCase();
    const tags = Array.isArray(weapon.tags) ? weapon.tags.map(t => t.toLowerCase()) : [];
    
    // Light weapons or explicitly finessable weapons
    if (weapon.isLight || tags.includes('light') || tags.includes('finessable')) return true;
    if (name.includes('rapier') || name.includes('whip') || name.includes('spiked chain') || name.includes('dagger') || name.includes('short sword')) return true;
    return false;
  },

  // Check if weapon belongs to Shadow Hand discipline
  isShadowHandWeapon(weapon) {
    if (!weapon) return false;
    const name = (weapon.name || '').toLowerCase();
    const discipline = (weapon.discipline || '').toLowerCase();
    if (discipline === 'shadow hand') return true;
    const shadowWeapons = ['dagger', 'short sword', 'sai', 'siangham', 'unarmed strike', 'spiked chain'];
    return shadowWeapons.some(sw => name.includes(sw));
  },

  // Check if weapon is Two-Handed according to D&D 3.5e RAW rules
  isTwoHandedWeapon(weapon) {
    if (!weapon) return false;
    const name = (weapon.name || '').toLowerCase();
    const type = (weapon.type || weapon.category || '').toLowerCase();
    const slot = (weapon.slot || '').toLowerCase();
    const tags = Array.isArray(weapon.tags) ? weapon.tags.map(t => t.toLowerCase()) : [];
    const desc = (weapon.desc || weapon.benefit || weapon.description || '').toLowerCase();

    if (weapon.isTwoHanded || weapon.twoHanded || weapon.grip === '2-Hand') return true;
    if (tags.some(t => t.includes('two-hand') || t.includes('2-hand') || t.includes('two handed'))) return true;
    if (slot.includes('two-hand') || slot.includes('2-hand') || slot.includes('two handed')) return true;
    if (desc.includes('2-handed') || desc.includes('two-handed') || desc.includes('two hands') || desc.includes('requires 2 hands') || desc.includes('massive 2-handed')) return true;

    // Standard D&D 3.5e Two-Handed Weapons (including Planar Handbook Jovar)
    const twoHandedWeapons = [
      'jovar', 'greatsword', 'greataxe', 'falchion', 'scythe', 'halberd',
      'heavy flail', 'guisarme', 'glaive', 'ranseur', 'spiked chain',
      'orc double axe', 'gnome hooked hammer', 'two-bladed sword', 'dire flail',
      'longspear', 'quarterstaff', 'longbow', 'composite longbow',
      'shortbow', 'composite shortbow', 'heavy crossbow', 'light crossbow'
    ];

    return twoHandedWeapons.some(w => name.includes(w));
  },

  // Check if character possesses feat/trait allowing two-handed weapons or oversized weapons in one hand
  hasOversizedWeaponFeat(character) {
    if (!character) return false;
    const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());
    return feats.some(f => 
      f.includes('oversized two-weapon fighting') || 
      f.includes('oversized weapon fighting') || 
      f.includes('oversized weapon') || 
      f.includes('monkey grip') || 
      f.includes('powerful build')
    );
  },

  // Resolve bonus stacking according to D&D 3.5e RAW rules
  resolveBonusStacking(bonusList) {
    const stackingTypes = ['dodge', 'untyped', 'circumstance', 'synergy'];
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
      armor: 0,
      shield: 0,
      natural: 0,
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
        } else if (bType.includes('dodge')) {
          res.dodge = acVal;
        } else {
          res.armor = acVal;
        }
      }
      if (dbEntry.naturalBonus) res.natural = Math.max(res.natural, Number(dbEntry.naturalBonus) || 0);
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
    }

    // 2. Direct item properties
    if (item.acBonus) {
      const acVal = Number(item.acBonus) || 0;
      const bType = (item.bonusType || item.category || '').toLowerCase();
      if (bType.includes('shield')) res.shield = acVal;
      else if (bType.includes('deflection')) res.deflection = acVal;
      else if (bType.includes('natural')) res.natural = acVal;
      else if (bType.includes('dodge')) res.dodge = acVal;
      else res.armor = acVal;
    }
    if (item.naturalBonus) res.natural = Math.max(res.natural, Number(item.naturalBonus) || 0);
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

    // Check SRD Armors
    if (res.armor === 0 && (item.category === 'Armor' || (item.slot && item.slot.toLowerCase().includes('armor')))) {
      for (const [key, val] of Object.entries(this.SRD_ARMORS)) {
        if (cleanName.includes(key)) {
          let baseArmor = val.armor;
          let mDex = val.maxDex;
          let checkPen = val.acp;

          // Mithral modifier: +2 maxDex, ACP reduced by 2 (towards 0)
          if (cleanName.includes('mithral') || fullText.includes('mithral')) {
            mDex = Math.min(8, mDex + 2);
            checkPen = Math.min(0, checkPen + 2);
          }

          // Check enhancement bonus like +1, +2, +3...
          const enhMatch = cleanName.match(/\+(\d+)/);
          if (enhMatch) {
            baseArmor += Number(enhMatch[1]);
          }

          res.armor = baseArmor;
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

  // Central Recalculation Engine for Character State (Abilities, AC, Saves, Speed, Buffs)
  recalculateCharacter(character, masterDb = [], tacticalOptions = {}) {
    if (!character) return;

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
      // Re-calibrate if baseAbilities was saved uncalibrated in localStorage
      if (character.bodySlots?.belt?.active && (character.bodySlots.belt.name || '').toLowerCase().includes('+2') && character.baseAbilities.str === 14) {
        character.baseAbilities.str = 12;
      }
      if (character.bodySlots?.gloves?.active && (character.bodySlots.gloves.name || '').toLowerCase().includes('+2') && character.baseAbilities.dex === 16) {
        character.baseAbilities.dex = 14;
      }
    }

    // Ensure buffs array
    if (!Array.isArray(character.buffs) || character.buffs.length === 0) {
      character.buffs = this.getDefaultBuffs();
    }

    // 2. Collect Equipment Bonuses from active bodySlots
    const armorBonuses = [];
    const shieldBonuses = [];
    const naturalBonuses = [];
    const deflectionBonuses = [];
    const dodgeBonuses = [];
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

    if (character.bodySlots && typeof character.bodySlots === 'object') {
      const mh = character.bodySlots.mainHand;
      const oh = character.bodySlots.offHand;
      const isMhTwoHand = mh && mh.name && mh.name !== '-' && this.isTwoHandedWeapon(mh);
      const isOhOccupied = oh && oh.active !== false && oh.name && oh.name !== '-';
      const hasOversized = this.hasOversizedWeaponFeat(character);

      if (isMhTwoHand && isOhOccupied && !hasOversized) {
        offHandSuppressed = true;
        twoHandedConflict = {
          mainHand: mh.name,
          offHand: oh.name,
          message: `⚠️ "${mh.name}" iki elli (Two-Handed) bir silahtır! 'Oversized Two-Weapon Fighting' veya 'Monkey Grip' feat'i olmadan aynı anda ikinci el eşyası ("${oh.name}") kullanılamaz. İkinci el etkileri devre dışı bırakıldı.`
        };
      }
      character.twoHandedConflict = twoHandedConflict;

      Object.entries(character.bodySlots).forEach(([slotKey, slotData]) => {
        if (!slotData || slotData.active === false || !slotData.name || slotData.name === '-') return;
        if (slotKey === 'offHand' && offHandSuppressed) return;

        const mods = this.parseItemModifiers(slotData, masterDb);
        if (!mods) return;

        if (mods.armor > 0) armorBonuses.push({ val: mods.armor, source: slotData.name, type: 'Armor' });
        if (mods.shield > 0) shieldBonuses.push({ val: mods.shield, source: slotData.name, type: 'Shield' });
        if (mods.natural > 0) naturalBonuses.push({ val: mods.natural, source: slotData.name, type: 'Natural' });
        if (mods.deflection > 0) deflectionBonuses.push({ val: mods.deflection, source: slotData.name, type: 'Deflection' });
        if (mods.dodge > 0) dodgeBonuses.push({ val: mods.dodge, source: slotData.name, type: 'Dodge' });

        if (mods.maxDex !== null && mods.maxDex !== undefined) {
          if (minMaxDex === null || mods.maxDex < minMaxDex) minMaxDex = mods.maxDex;
        }
        if (mods.acp) totalAcp += mods.acp;
        if (mods.resistance > 0 && mods.resistance > resistBonus) resistBonus = mods.resistance;
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
        buffSaveFort -= buff.negativeLevels;
        buffSaveRef -= buff.negativeLevels;
        buffSaveWill -= buff.negativeLevels;
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
            naturalBonuses.push({ val: item.acBonus, source: item.name, type: 'Natural' });
          } else {
            armorBonuses.push({ val: item.acBonus, source: item.name, type: 'Armor' });
          }
        }
        if (item.acBonus < 0) {
          buffAcPenalty += Math.abs(item.acBonus);
        }
        if (item.acPenalty > 0) buffAcPenalty += item.acPenalty;

        if (item.naturalBonus > 0) naturalBonuses.push({ val: item.naturalBonus, source: item.name, type: 'Natural' });
        if (item.deflectionBonus > 0) deflectionBonuses.push({ val: item.deflectionBonus, source: item.name, type: 'Deflection' });
        if (item.dodgeBonus > 0) dodgeBonuses.push({ val: item.dodgeBonus, source: item.name, type: 'Dodge' });

        // Stat Bonuses & Penalties
        if (item.strBonus) abilityBuckets.str.push({ val: item.strBonus, type: item.bonusType || (item.strBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });
        if (item.dexBonus) abilityBuckets.dex.push({ val: item.dexBonus, type: item.bonusType || (item.dexBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });
        if (item.conBonus) abilityBuckets.con.push({ val: item.conBonus, type: item.bonusType || (item.conBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });
        if (item.intBonus) abilityBuckets.int.push({ val: item.intBonus, type: item.bonusType || (item.intBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });
        if (item.wisBonus) abilityBuckets.wis.push({ val: item.wisBonus, type: item.bonusType || (item.wisBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });
        if (item.chaBonus) abilityBuckets.cha.push({ val: item.chaBonus, type: item.bonusType || (item.chaBonus < 0 ? 'penalty' : 'Enhancement'), source: item.name });

        // Saves
        if (item.fortBonus) buffSaveFort += item.fortBonus;
        if (item.refBonus) buffSaveRef += item.refBonus;
        if (item.willBonus) buffSaveWill += item.willBonus;
        if (item.saveBonus) {
          buffSaveFort += item.saveBonus;
          buffSaveRef += item.saveBonus;
          buffSaveWill += item.saveBonus;
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
        character.hp.max = Math.max(1, Number(character.hp.baseMax) + newConBonusHp - flawHpPenalty - debuffHpPenalty);
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
    const combatExpertise = tacticalOptions.combatExpertise || 0;
    const fightingDefensively = tacticalOptions.fightingDefensively || false;
    const totalDefense = tacticalOptions.totalDefense || false;
    const charge = tacticalOptions.charge || false;

    if (charFeatNames.some(f => f === 'dodge')) {
      effectiveDodge += 1;
    }

    if (combatExpertise > 0) effectiveDodge += Math.min(5, combatExpertise);
    if (fightingDefensively) effectiveDodge += 2;
    if (totalDefense) effectiveDodge += 4;

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
    
    // Flat-footed AC (no Dex, no Dodge, unless Uncanny Dodge)
    const hasUncannyDodge = (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : a.name).toLowerCase().includes('uncanny dodge'));
    const flatAC = baseAC + effectiveArmor + effectiveShield + effectiveNatural + effectiveDeflection + sizeBonus + (hasUncannyDodge ? effectiveDex : 0) - totalPenalty;

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
      sources: {
        armor: armorBonuses,
        shield: shieldBonuses,
        natural: naturalBonuses,
        deflection: deflectionBonuses,
        dodge: dodgeBonuses
      }
    };

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
    const draconicSaveBonus = charFeatNames.some(f => f.includes('save magic') || f.includes('draconic save')) ? 1 : 0;
    const miscSaveBonus = (character.saveBonuses?.bonus || 0) + (character.saveBonuses?.misc || 0);

    // Battle Clarity (Warblade 1): Add INT modifier (max Warblade lvl) to Reflex saves
    const charClassNames = (character.classes || '').toLowerCase();
    const isWarblade = charClassNames.includes('warblade') || (Array.isArray(character.levelProgression) && character.levelProgression.some(l => (l.className || '').toLowerCase().includes('warblade')));
    const hasBattleClarity = (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : (a.name || '')).toLowerCase().includes('battle clarity')) || isWarblade;
    const warbladeLvl = (Array.isArray(character.levelProgression) ? character.levelProgression.filter(l => (l.className || '').toLowerCase().includes('warblade')).length : 0) || (isWarblade ? 1 : 0);
    const battleClarityBonus = hasBattleClarity ? Math.min(warbladeLvl, Math.max(0, intMod)) : 0;

    const bonusFort = buffSaveFort + featFortBonus + draconicSaveBonus + miscSaveBonus + (character.saveBonuses?.fortBonus || 0);
    const bonusRef = buffSaveRef + featRefBonus - flawRefPenalty + draconicSaveBonus + miscSaveBonus + (character.saveBonuses?.refBonus || 0) + battleClarityBonus;
    const bonusWill = buffSaveWill + featWillBonus + draconicSaveBonus + miscSaveBonus + (character.saveBonuses?.willBonus || 0);

    const finalFort = baseFort + conMod + resistBonus + bonusFort;
    const finalRef = baseRef + dexMod + resistBonus + bonusRef;
    const finalWill = baseWill + wisMod + resistBonus + bonusWill;

    character.evaluatedSaves = {
      fort: finalFort,
      ref: finalRef,
      will: finalWill,
      bonusFort: bonusFort,
      bonusRef: bonusRef,
      bonusWill: bonusWill,
      battleClarityBonus: Math.min(1, Math.max(0, intMod))
    };

    // 7. Resolve Effective Speed
    const baseSpeed = character.baseSpeed || 30;
    character.effectiveSpeed = baseSpeed + itemSpeedBonus + buffSpeedBonus;
    character.buffSkillBonus = buffSkillBonus;

    return {
      ac: character.acBreakdown,
      abilities: character.abilities,
      saves: character.evaluatedSaves
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

  // Evaluate Weapon Attack Modifiers & Damage
  evaluateWeaponAttack(character, weapon, options = {}) {
    const isTwoHand = this.isTwoHandedWeapon(weapon);
    const hasOversized = this.hasOversizedWeaponFeat(character);
    let resolvedGrip = options.grip || weapon.grip || (isTwoHand ? '2-Hand' : '1-Hand');

    // Two-handed weapon without oversized feat MUST be wielded with 2-Hand grip
    if (isTwoHand && !hasOversized && resolvedGrip !== '2-Hand') {
      resolvedGrip = '2-Hand';
    }

    const {
      grip = resolvedGrip,
      powerAttack = 0,
      flanking = false,
      charge = false,
      higherGround = false,
      activeStance = character.activeStance || 'None',
      customModifiers = []
    } = options;

    const bab = Number(character.bab) || 0;
    const strMod = this.getAbilityMod(character.abilities?.str || 10);
    const dexMod = this.getAbilityMod(character.abilities?.dex || 10);

    // Feat detections (strip "+N" enhancement or "(...)" suffixes from weapon name when matching Weapon Focus)
    const baseWepName = (weapon.name || '').toLowerCase().replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : f.name).toLowerCase());
    const hasWeaponFinesse = feats.some(f => f.includes('weapon finesse'));
    const hasShadowBlade = feats.some(f => f.includes('shadow blade'));
    const hasWeaponFocus = feats.some(f => f.includes('weapon focus') && ((baseWepName && f.includes(baseWepName)) || f.includes(weapon.name.toLowerCase()) || f.includes('all')));
    const hasWeaponSpec = feats.some(f => f.includes('weapon specialization') && ((baseWepName && f.includes(baseWepName)) || f.includes(weapon.name.toLowerCase()) || f.includes('all')));

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

    // Monkey Grip penalty: -2 on attack rolls when wielding an oversized or 2-handed weapon in 1 hand
    if (isTwoHand && grip === '1-Hand' && hasOversized) {
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

    if (weapon.attBonus) {
      attackBonusItems.push({ type: weapon.bonusType || 'enhancement', val: weapon.attBonus, source: 'Weapon Enhancement' });
    }
    if (hasWeaponFocus) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Weapon Focus' });
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

    // 2. Damage Calculation
    let strDamageMultiplier = 1.0;
    let paDamageMultiplier = 1;

    if (grip === '2-Hand') {
      strDamageMultiplier = 1.5;
      paDamageMultiplier = 2;
    } else if (grip === 'Off-Hand') {
      strDamageMultiplier = 0.5;
      paDamageMultiplier = 0;
    }

    const baseStrDmg = Math.floor(strMod * strDamageMultiplier);
    const paDmg = effectivePA * paDamageMultiplier;

    const damageBonusItems = [
      { type: 'untyped', val: baseStrDmg, source: `STR (${grip})` },
      { type: 'untyped', val: paDmg, source: `Power Attack (${paDamageMultiplier}x)` }
    ];

    if (weapon.dmgBonus) {
      damageBonusItems.push({ type: weapon.bonusType || 'enhancement', val: weapon.dmgBonus, source: 'Weapon Enhancement' });
    }
    if (hasWeaponSpec) {
      damageBonusItems.push({ type: 'untyped', val: 2, source: 'Weapon Specialization' });
    }

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
    const iteratives = [netAttackBonus];
    if (bab >= 6) iteratives.push(netAttackBonus - 5);
    if (bab >= 11) iteratives.push(netAttackBonus - 10);
    if (bab >= 16) iteratives.push(netAttackBonus - 15);

    // Haste grants 1 extra full attack at highest BAB
    const hasHaste = (character.buffs || []).some(b => b.active && b.name.toLowerCase().includes('haste'));
    if (hasHaste) {
      iteratives.unshift(netAttackBonus); // duplicate primary attack
    }

    return {
      netAttackBonus,
      iteratives,
      attackStatName,
      attackStatMod,
      effectivePA,
      baseDice: weapon.extraDmg || weapon.dice || '1d8',
      netFlatDamage,
      critMin: weapon.critMin || 20,
      critMult: weapon.critMult || 2,
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
    const iName = (item.name || '').toLowerCase();
    const scope = (item.scope || '').toLowerCase();
    const targetSkill = (item.targetSkill || item.skill || '').toLowerCase();
    const bVal = Number(item.skillBonus || item.bonus) || 0;
    const bType = item.bonusType || 'competence';

    if (bVal !== 0) {
      let applies = false;
      if (scope === 'all skills' || scope === 'skills') applies = true;
      else if (isKnowledge && (scope === 'knowledge' || scope.includes('knowledge'))) applies = true;
      else if (targetSkill && (sKey === targetSkill || sName.includes(targetSkill))) applies = true;
      else if (scope && (sKey.includes(scope) || sName.includes(scope))) applies = true;

      if (applies) {
        addBonus(item.name, bVal, bType);
        return;
      }
    }

    if (iName.includes('tome of worldly memory') && isKnowledge) {
      addBonus('Tome of Worldly Memory', 5, 'competence');
    } else if (iName.includes('stone of good luck') || iName.includes('luckstone')) {
      addBonus('Stone of Good Luck', 1, 'luck');
    } else if (iName.includes('pale green ioun stone')) {
      addBonus('Pale Green Ioun Stone', 1, 'competence');
    } else if (iName.includes('vest of escape')) {
      if (sKey === 'disable_device' || sName.includes('disable device') || sName.includes('thievery')) {
        addBonus('Vest of Escape', 2, 'competence');
      }
      if (sKey === 'escape_artist' || sName.includes('escape artist') || sName.includes('acrobatics')) {
        addBonus('Vest of Escape', 10, 'competence');
      }
    } else if (iName.includes('striding and springing') || iName.includes('boots of springing')) {
      if (sKey === 'jump' || sName.includes('jump') || sName.includes('athletics')) {
        addBonus('Boots of Striding and Springing', 5, 'competence');
      }
    } else if (iName.includes('goggles of minute seeing')) {
      if (sKey === 'search' || sName.includes('search')) {
        addBonus('Goggles of Minute Seeing', 5, 'competence');
      }
    } else if (iName.includes('eyes of the eagle')) {
      if (sKey === 'spot' || sName.includes('spot') || sName.includes('perception')) {
        addBonus('Eyes of the Eagle', 5, 'competence');
      }
    } else if (iName.includes('cloak of elvenkind')) {
      if (sKey === 'hide' || sName.includes('hide') || sName.includes('stealth')) {
        addBonus('Cloak of Elvenkind', 5, 'competence');
      }
    } else if (iName.includes('boots of elvenkind')) {
      if (sKey === 'move_silently' || sName.includes('move silently') || sName.includes('stealth')) {
        addBonus('Boots of Elvenkind', 5, 'competence');
      }
    }
  }
};

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RuleEngine;
} else if (typeof window !== 'undefined') {
  window.RuleEngine = RuleEngine;
}
