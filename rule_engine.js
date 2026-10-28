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

  // Canonical D&D 3.5e RAW Class Proficiencies (PHB Chapter 3, Complete & Tome of Battle)
  CLASS_PROFICIENCIES: {
    'fighter': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: true }
    },
    'barbarian': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: false },
      shields: { shield: true, tower: false }
    },
    'paladin': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: false }
    },
    'ranger': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: true, tower: false }
    },
    'cleric': {
      weapons: { simple: true, martial: false, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: false }
    },
    'druid': {
      weapons: { simple: false, martial: false, specific: ['club', 'dagger', 'dart', 'quarterstaff', 'scimitar', 'sickle', 'shortspear', 'sling', 'spear'] },
      armors: { light: true, medium: true, heavy: false },
      shields: { shield: true, tower: false }
    },
    'rogue': {
      weapons: { simple: true, martial: false, specific: ['hand crossbow', 'rapier', 'sap', 'shortbow', 'short sword'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'bard': {
      weapons: { simple: true, martial: false, specific: ['longsword', 'rapier', 'sap', 'short sword', 'shortbow', 'whip'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: true, tower: false }
    },
    'monk': {
      weapons: { simple: false, martial: false, specific: ['club', 'crossbow', 'light crossbow', 'heavy crossbow', 'dagger', 'handaxe', 'javelin', 'kama', 'nunchaku', 'quarterstaff', 'sai', 'shuriken', 'siangham', 'sling', 'unarmed strike'] },
      armors: { light: false, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'sorcerer': {
      weapons: { simple: true, martial: false, specific: [] },
      armors: { light: false, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'wizard': {
      weapons: { simple: false, martial: false, specific: ['club', 'dagger', 'heavy crossbow', 'light crossbow', 'quarterstaff'] },
      armors: { light: false, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'warlock': {
      weapons: { simple: true, martial: false, specific: [] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'crusader': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: false }
    },
    'swordsage': {
      weapons: { simple: true, martial: false, specific: ['light crossbow', 'heavy crossbow', 'shortbow', 'composite shortbow'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'warblade': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: false },
      shields: { shield: true, tower: false }
    },
    'duskblade': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: false },
      shields: { shield: true, tower: false }
    },
    'knight': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: true }
    },
    'warmage': {
      weapons: { simple: true, martial: false, specific: ['light repeating crossbow'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: true, tower: false }
    },
    'beguiler': {
      weapons: { simple: true, martial: false, specific: ['hand crossbow', 'rapier', 'shortbow', 'short sword'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'scout': {
      weapons: { simple: true, martial: false, specific: ['hand crossbow', 'sap', 'shortbow', 'short sword'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'swashbuckler': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'hexblade': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'favored soul': {
      weapons: { simple: true, martial: false, specific: [] },
      armors: { light: true, medium: true, heavy: false },
      shields: { shield: true, tower: false }
    },
    'spellthief': {
      weapons: { simple: true, martial: false, specific: ['hand crossbow', 'rapier', 'shortbow', 'short sword'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'psion': {
      weapons: { simple: false, martial: false, specific: ['club', 'dagger', 'heavy crossbow', 'light crossbow', 'quarterstaff', 'shortspear'] },
      armors: { light: false, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'psychic warrior': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: false }
    },
    'soulknife': {
      weapons: { simple: true, martial: false, specific: ['mind blade'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: true, tower: false }
    },
    'wilder': {
      weapons: { simple: true, martial: false, specific: [] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: true, tower: false }
    }
  },

  // Calculate D&D 3.5e Ability Modifier: floor((score - 10) / 2)
  getAbilityMod(score) {
    return Math.floor(((Number(score) || 10) - 10) / 2);
  },

  // Canonical V2 Formula Evaluator (evaluates @cl, @level, @bab, @strMod..@chaMod, min, max, floor, ceil)
  evaluateFormula(formula, context = {}) {
    if (formula === null || formula === undefined || formula === '') return 0;
    if (typeof formula === 'number') return formula;
    const raw = String(formula).trim();
    const directNum = Number(raw);
    if (!Number.isNaN(directNum)) return directNum;

    const cl = Number(context.cl ?? context.casterLevel ?? context.level ?? 1) || 1;
    const level = Number(context.level ?? cl) || 1;
    const bab = Number(context.bab ?? 0) || 0;
    const enh = Number(context.enhancement ?? context.enhancementBonus ?? 0) || 0;

    let expr = raw
      .replace(/@item\.level\b/gi, String(cl))
      .replace(/@cl\b/gi, String(cl))
      .replace(/@level\b/gi, String(level))
      .replace(/@bab\b/gi, String(bab))
      .replace(/@enhancement\b/gi, String(enh))
      .replace(/@strMod\b/gi, String(Number(context.strMod) || 0))
      .replace(/@dexMod\b/gi, String(Number(context.dexMod) || 0))
      .replace(/@conMod\b/gi, String(Number(context.conMod) || 0))
      .replace(/@intMod\b/gi, String(Number(context.intMod) || 0))
      .replace(/@wisMod\b/gi, String(Number(context.wisMod) || 0))
      .replace(/@chaMod\b/gi, String(Number(context.chaMod) || 0))
      .replace(/@classes\.([a-z0-9_]+)\.level/gi, (_, cName) => {
        const cLvl = (context.classLevels && context.classLevels[cName.toLowerCase()]) || level;
        return String(cLvl);
      });

    // If expression contains dice notation like "(min(10, 5))d6", evaluate parenthesized math sub-expressions
    if (/\d*d\d+/i.test(expr)) {
      return expr.replace(/\(([^()]+)\)(?=d\d+)/gi, (_, sub) => {
        const val = this.evaluateFormula(sub, context);
        return String(Math.max(1, Math.floor(Number(val) || 1)));
      });
    }

    // Safe arithmetic / Math function evaluation
    const safeExpr = expr
      .replace(/\bmin\s*\(/gi, 'Math.min(')
      .replace(/\bmax\s*\(/gi, 'Math.max(')
      .replace(/\bfloor\s*\(/gi, 'Math.floor(')
      .replace(/\bceil\s*\(/gi, 'Math.ceil(')
      .replace(/\bround\s*\(/gi, 'Math.round(');

    if (/^[0-9+\-*/%().,?:><=\sMathminaxflorceiund]+$/.test(safeExpr)) {
      try {
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${safeExpr});`)();
        return typeof res === 'number' && !Number.isNaN(res) ? res : 0;
      } catch (_) {
        return 0;
      }
    }
    return 0;
  },

  // Ensure an object is upgraded to Canonical V2 via SchemaMigrator if available
  ensureV2Entry(entry) {
    if (!entry || typeof entry !== 'object') return entry;
    if (entry.schemaVersion === 2 && Array.isArray(entry.modifiers)) return entry;
    if (typeof window !== 'undefined' && window.SchemaMigrator && typeof window.SchemaMigrator.upgradeEntryToV2 === 'function') {
      return window.SchemaMigrator.upgradeEntryToV2(entry);
    }
    return entry;
  },

  // Declarative Compendium & Master DB lookup helper (O(1) ID/BaseItemId priority per Rule #10.4)
  getMasterDbEntry(itemOrName, typeFilter = null) {
    if (!itemOrName) return null;
    const isObj = typeof itemOrName === 'object';
    const refId = isObj ? (itemOrName.baseItemId || itemOrName.id || null) : null;
    const rawName = String(isObj ? (itemOrName.masterDbName || itemOrName.name || '') : itemOrName).trim();

    if (typeof window !== 'undefined' && window.SrdCompendium) {
      if (refId) {
        const byId = window.SrdCompendium.getById(refId);
        if (byId) return byId;
      }
      if (rawName) {
        const byName = window.SrdCompendium.getByName(rawName, typeFilter || (isObj ? itemOrName.type : null));
        if (byName) return byName;
      }
    }

    const clean = rawName.toLowerCase();
    if (!clean) return null;
    const db = (typeof window !== 'undefined' && (window.masterDb || window.MASTER_DB_DATA || window.BUNDLED_MASTER_DB)) || (typeof masterDb !== 'undefined' ? masterDb : []);
    let found = Array.isArray(db) && db.length > 0
      ? db.find(m => m && ((refId && m.id === refId) || (m.name && m.name.toLowerCase().trim() === clean) || (m.masterDbName && m.masterDbName.toLowerCase().trim() === clean)))
      : null;
    if (!found && typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
      found = window.BUNDLED_SRD_CORE_CATALOG.find(m => m && ((refId && m.id === refId) || (m.name && m.name.toLowerCase().trim() === clean) || (m.masterDbName && m.masterDbName.toLowerCase().trim() === clean))) || null;
    }
    return found ? this.ensureV2Entry(found) : null;
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

  // Check if weapon is Martial according to D&D 3.5e RAW rules
  isMartialWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (this.isExoticWeapon(weapon)) return false;

    if (typeof weapon === 'object') {
      if (weapon.proficiency === 'Martial' || weapon.category === 'Martial' || (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'martial')) || (weapon.weaponType && weapon.weaponType.toLowerCase().includes('martial'))) {
        return true;
      }
    }

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      if (db.proficiency === 'Martial' || db.category === 'Martial' || (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'martial')) || (db.weaponType && db.weaponType.toLowerCase().includes('martial'))) {
        return true;
      }
    }

    const baseWepName = name.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const standardMartialWeapons = [
      'throwing axe', 'handaxe', 'light hammer', 'light pick', 'sap', 'short sword', 'spiked armor', 'armor spikes',
      'battleaxe', 'flail', 'heavy pick', 'longsword', 'rapier', 'scimitar', 'trident', 'warhammer',
      'falchion', 'glaive', 'greataxe', 'greatclub', 'greatsword', 'guisarme', 'halberd', 'heavy flail',
      'lance', 'ranseur', 'scythe', 'shortbow', 'composite shortbow', 'longbow', 'composite longbow',
      'büyük kılıç', 'büyük balta', 'savaş baltası', 'uzun kılıç', 'uzun yay', 'kısa yay'
    ];
    return standardMartialWeapons.some(mw => baseWepName.includes(mw) || name.includes(mw));
  },

  // Check if weapon is Simple according to D&D 3.5e RAW rules
  isSimpleWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (this.isExoticWeapon(weapon) || this.isMartialWeapon(weapon)) return false;

    if (typeof weapon === 'object') {
      if (weapon.proficiency === 'Simple' || weapon.category === 'Simple' || (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'simple')) || (weapon.weaponType && weapon.weaponType.toLowerCase().includes('simple'))) {
        return true;
      }
    }

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      if (db.proficiency === 'Simple' || db.category === 'Simple' || (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'simple')) || (db.weaponType && db.weaponType.toLowerCase().includes('simple'))) {
        return true;
      }
    }

    const baseWepName = name.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const standardSimpleWeapons = [
      'gauntlet', 'spiked gauntlet', 'unarmed strike', 'silahsız', 'dagger', 'punching dagger', 'light mace', 'sickle',
      'club', 'heavy mace', 'morningstar', 'shortspear', 'longspear', 'quarterstaff', 'spear',
      'crossbow', 'heavy crossbow', 'light crossbow', 'dart', 'javelin', 'sling',
      'hançer', 'asa', 'hafif arbalet', 'ağır arbalet', 'sapan', 'mızrak'
    ];
    return standardSimpleWeapons.some(sw => baseWepName.includes(sw) || name.includes(sw));
  },

  // Check if item is a Shield according to D&D 3.5e RAW rules
  isShieldItem(item) {
    if (!item) return false;
    const name = (typeof item === 'string' ? item : (item.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none' || name === 'yok' || name === 'boş') return false;
    if (typeof item === 'object') {
      if (item.category === 'Shield' || item.type === 'Shield' || (item.slot && item.slot.toLowerCase().includes('shield'))) return true;
    }
    return Object.keys(this.SRD_SHIELDS).some(k => name.includes(k)) || name.includes('shield') || name.includes('kalkan') || name.includes('buckler');
  },

  // Check if item is a Tower Shield according to D&D 3.5e RAW rules
  isTowerShield(item) {
    if (!item) return false;
    const name = (typeof item === 'string' ? item : (item.name || '')).toLowerCase().trim();
    return name.includes('tower shield') || name.includes('kule kalkan');
  },

  // Aggregate all character weapon, armor, and shield proficiencies from multiclasses and feats
  getCharacterProficiencies(character, targetLevelIdx = null) {
    const res = {
      weapons: {
        simple: false,
        martial: false,
        exoticAll: false,
        specific: new Set()
      },
      armors: {
        light: false,
        medium: false,
        heavy: false
      },
      shields: {
        shield: false,
        tower: false
      }
    };

    if (!character) return res;

    // 1. Collect classes up to targetLevelIdx (or full character)
    const prog = Array.isArray(character.levelProgression) ? character.levelProgression : [];
    const classNames = new Set();

    if (targetLevelIdx !== null && targetLevelIdx !== undefined) {
      const maxIdx = Math.max(0, Math.min(Number(targetLevelIdx), prog.length - 1));
      for (let i = 0; i <= maxIdx; i++) {
        if (prog[i] && prog[i].className && prog[i].active !== false) {
          classNames.add(prog[i].className.toLowerCase().trim());
        }
      }
    } else if (prog.length > 0) {
      prog.forEach(lvl => {
        if (lvl && lvl.className && lvl.active !== false) {
          classNames.add(lvl.className.toLowerCase().trim());
        }
      });
    }

    // In Level-up Wizard mode, if lvlup-class-select exists in DOM, add it too
    if (typeof document !== 'undefined') {
      const lvlSel = document.getElementById('lvlup-class-select');
      if (lvlSel && lvlSel.value && (targetLevelIdx === null || targetLevelIdx === undefined)) {
        classNames.add(lvlSel.value.toLowerCase().trim());
      }
    }

    // Fallback if classNames is still empty: parse character.classes string
    if (classNames.size === 0 && character.classes) {
      const parts = String(character.classes).split('/');
      parts.forEach(p => {
        const cName = p.replace(/\d+/g, '').trim().toLowerCase();
        if (cName) classNames.add(cName);
      });
    }

    // Default fallback if still empty
    if (classNames.size === 0) {
      classNames.add('fighter');
    }

    // Apply class proficiencies (Union across all multiclasses per RAW)
    classNames.forEach(cName => {
      const profData = this.CLASS_PROFICIENCIES[cName] || this.CLASS_PROFICIENCIES[cName.split(' ')[0]];
      if (profData) {
        if (profData.weapons.simple) res.weapons.simple = true;
        if (profData.weapons.martial) res.weapons.martial = true;
        (profData.weapons.specific || []).forEach(w => res.weapons.specific.add(w.toLowerCase().trim()));
        if (profData.armors.light) res.armors.light = true;
        if (profData.armors.medium) res.armors.medium = true;
        if (profData.armors.heavy) res.armors.heavy = true;
        if (profData.shields.shield) res.shields.shield = true;
        if (profData.shields.tower) res.shields.tower = true;
      } else {
        // Fallback for custom or unrecognized classes using BAB/role
        const def = (typeof DND35_CLASS_DEFS !== 'undefined' ? DND35_CLASS_DEFS[cName] : null) || {};
        if (def.bab === 1.0) {
          res.weapons.simple = true;
          res.weapons.martial = true;
          res.armors.light = true;
          res.armors.medium = true;
          res.armors.heavy = true;
          res.shields.shield = true;
        } else if (def.bab === 0.75) {
          res.weapons.simple = true;
          res.armors.light = true;
          res.armors.medium = true;
          res.shields.shield = true;
        } else {
          res.weapons.simple = true;
        }
      }
    });

    // 2. Collect learned feats and special abilities
    const learnedFeats = [];
    if (Array.isArray(character.feats)) {
      character.feats.forEach(f => learnedFeats.push(typeof f === 'string' ? f : f?.name || ''));
    }
    if (Array.isArray(character.specialAbilities)) {
      character.specialAbilities.forEach(a => learnedFeats.push(typeof a === 'string' ? a : a?.name || ''));
    }

    // In progression table mode, also collect feats learned up to targetLevelIdx
    if (targetLevelIdx !== null && targetLevelIdx !== undefined && prog.length > 0) {
      const maxIdx = Math.max(0, Math.min(Number(targetLevelIdx), prog.length - 1));
      for (let i = 0; i <= maxIdx; i++) {
        if (prog[i] && prog[i].active !== false && Array.isArray(prog[i].feats)) {
          prog[i].feats.forEach(f => learnedFeats.push(typeof f === 'string' ? f : f?.name || ''));
        }
      }
    }

    // In level up wizard, check prior slot feats if any
    if (typeof levelUpModalFeatSlots !== 'undefined' && Array.isArray(levelUpModalFeatSlots)) {
      levelUpModalFeatSlots.forEach(s => {
        if (s && s.name) learnedFeats.push(s.name);
      });
    }

    // Parse proficiency feats
    learnedFeats.forEach(featStr => {
      if (!featStr) return;
      const clean = featStr.toLowerCase().replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();

      if (clean.includes('armor proficiency (light)') || clean.includes('hafif zırh ustalığı')) {
        res.armors.light = true;
      }
      if (clean.includes('armor proficiency (medium)') || clean.includes('orta zırh ustalığı')) {
        res.armors.medium = true;
      }
      if (clean.includes('armor proficiency (heavy)') || clean.includes('ağır zırh ustalığı')) {
        res.armors.heavy = true;
      }
      if (clean.includes('tower shield proficiency') || clean.includes('kule kalkanı ustalığı')) {
        res.shields.tower = true;
      }
      if (clean.includes('shield proficiency') || clean.includes('kalkan ustalığı')) {
        res.shields.shield = true;
      }
      if (clean.includes('simple weapon proficiency') || clean.includes('basit silah ustalığı')) {
        res.weapons.simple = true;
      }
      if (clean.includes('martial weapon proficiency') || clean.includes('askeri silah ustalığı')) {
        const match = clean.match(/(?:martial weapon proficiency|askeri silah ustalığı)\s*\((.*?)\)/i);
        if (match && match[1]) {
          res.weapons.specific.add(match[1].trim().toLowerCase());
        } else if (clean.includes('all') || clean.includes('tümü')) {
          res.weapons.martial = true;
        } else {
          res.weapons.martial = true;
        }
      }
      if (clean.includes('exotic weapon proficiency') || clean.includes('egzotik silah ustalığı')) {
        const match = clean.match(/(?:exotic weapon proficiency|egzotik silah ustalığı)\s*\((.*?)\)/i);
        if (match && match[1]) {
          res.weapons.specific.add(match[1].trim().toLowerCase());
        }
      }
      if (clean.includes('weapon aptitude') || clean.includes('silah yatkınlığı')) {
        if (learnedFeats.some(f => f.toLowerCase().includes('exotic weapon proficiency'))) {
          res.weapons.exoticAll = true;
        }
      }
    });

    return res;
  },

  // Check weapon proficiency
  isProficientWithWeapon(character, weapon, targetLevelIdx = null) {
    if (!weapon) return true;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return true;

    const baseWepName = name.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const prof = this.getCharacterProficiencies(character, targetLevelIdx);

    // 1. Specific weapon proficiencies always qualify
    for (const spec of prof.weapons.specific) {
      if (baseWepName.includes(spec) || name.includes(spec) || spec.includes(baseWepName)) {
        return true;
      }
    }

    // 2. Check Exotic
    if (this.isExoticWeapon(weapon)) {
      return Boolean(prof.weapons.exoticAll);
    }

    // 3. Check Martial
    if (this.isMartialWeapon(weapon)) {
      if (prof.weapons.martial) return true;
      // Special Swordsage rule: proficient with all martial melee weapons per RAW
      const prog = Array.isArray(character?.levelProgression) ? character.levelProgression : [];
      const isSwordsage = (character?.classes || '').toLowerCase().includes('swordsage') || prog.some(l => (l.className || '').toLowerCase().includes('swordsage'));
      if (isSwordsage) {
        const isRanged = weapon.grip === 'Ranged' || weapon.isRanged || (weapon.tags && weapon.tags.includes('ranged'));
        if (!isRanged) return true;
      }
      return false;
    }

    // 4. Simple weapon
    if (prof.weapons.simple) return true;

    return false;
  },

  // Check armor proficiency
  isProficientWithArmor(character, armor, targetLevelIdx = null) {
    if (!armor) return true;
    const name = (typeof armor === 'string' ? armor : (armor.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none' || name === 'yok' || name === 'boş') return true;

    const mods = this.parseItemModifiers(armor, (typeof masterDb !== 'undefined' ? masterDb : []));
    let cat = (mods && mods.effectiveArmorCategory) || (typeof armor === 'object' ? (armor.effectiveArmorCategory || armor.armorCategory || armor.type) : null);

    if (!cat) {
      for (const [key, val] of Object.entries(this.SRD_ARMORS)) {
        if (name.includes(key)) {
          cat = val.type;
          break;
        }
      }
    }

    if (!cat || cat === 'None') return true; // Robes / unarmored

    const prof = this.getCharacterProficiencies(character, targetLevelIdx);
    const catLower = cat.toLowerCase();
    if (catLower === 'heavy') return Boolean(prof.armors.heavy);
    if (catLower === 'medium') return Boolean(prof.armors.medium);
    if (catLower === 'light') return Boolean(prof.armors.light);
    return true;
  },

  // Check shield proficiency
  isProficientWithShield(character, shield, targetLevelIdx = null) {
    if (!shield) return true;
    const name = (typeof shield === 'string' ? shield : (shield.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none' || name === 'yok' || name === 'boş') return true;

    const prof = this.getCharacterProficiencies(character, targetLevelIdx);
    if (this.isTowerShield(shield)) {
      return Boolean(prof.shields.tower);
    }
    return Boolean(prof.shields.shield);
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

  // Parse modifiers and stat bonuses from a Canonical V2 equipment item (zero heuristic regex guessing per Rule #10.3)
  parseItemModifiers(rawItem, masterDb = [], context = {}) {
    if (!rawItem || !rawItem.name || rawItem.name === '-') return null;

    const item = this.ensureV2Entry(rawItem);
    const dbEntry = this.getMasterDbEntry(item);

    const isArmor = item.type === 'Armor' || item.category === 'Armor' || dbEntry?.type === 'Armor';
    const isShield = item.type === 'Shield' || item.category === 'Shield' || dbEntry?.type === 'Shield';
    const baseCat = item.effectiveWeightCategory || item.armorCategory || (isArmor ? (item.category || dbEntry?.category || 'Light') : null);
    const isMithral = Boolean(
      item.material === 'mat-mithral' ||
      item.ruleFlags?.mithralHeavyAsMedium ||
      item.ruleFlags?.mithralMediumAsLight ||
      dbEntry?.material === 'mat-mithral'
    );

    let effectiveCat = baseCat;
    if (isArmor && isMithral && !item.effectiveWeightCategory) {
      if (effectiveCat === 'Heavy') effectiveCat = 'Medium';
      else if (effectiveCat === 'Medium') effectiveCat = 'Light';
    }

    const res = {
      id: item.id || dbEntry?.id || null,
      name: item.name,
      category: item.category || dbEntry?.category || 'Other',
      armorCategory: baseCat,
      effectiveArmorCategory: effectiveCat,
      isMithral,
      armor: 0,
      shield: 0,
      natural: 0,
      naturalBonusType: 'natural',
      deflection: 0,
      dodge: 0,
      maxDex: item.maxDex !== undefined && item.maxDex !== null && item.maxDex !== ''
        ? Number(item.maxDex)
        : (dbEntry?.maxDex !== undefined && dbEntry?.maxDex !== null && dbEntry?.maxDex !== '' ? Number(dbEntry.maxDex) : null),
      acp: item.checkPenalty !== undefined && item.checkPenalty !== null && item.checkPenalty !== ''
        ? Number(item.checkPenalty)
        : (dbEntry?.checkPenalty !== undefined && dbEntry?.checkPenalty !== null && dbEntry?.checkPenalty !== '' ? Number(dbEntry.checkPenalty) : 0),
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
      dr: 0,
      sr: 0,
      bonusType: 'enhancement',
      modifiers: [],
      ruleFlags: Object.assign({}, dbEntry?.ruleFlags || {}, item.ruleFlags || {})
    };

    const rawMods = (Array.isArray(item.modifiers) && item.modifiers.length > 0)
      ? item.modifiers
      : (Array.isArray(dbEntry?.modifiers) ? dbEntry.modifiers : []);

    const evalCtx = Object.assign({
      cl: item.casterLevel || dbEntry?.casterLevel || context.cl || 1,
      enhancement: item.enhancementBonus || dbEntry?.enhancementBonus || 0
    }, context);

    for (let i = 0; i < rawMods.length; i++) {
      const m = rawMods[i];
      if (!m || !m.target) continue;
      const val = this.evaluateFormula(m.formula !== undefined ? m.formula : m.value, evalCtx);
      if (!val) continue;
      const bType = String(m.type || 'untyped').toLowerCase();
      const target = String(m.target).trim();

      res.modifiers.push({
        target,
        value: val,
        type: bType,
        condition: m.condition || null,
        source: item.name
      });

      if (target === 'ac.armor' || target === 'armor') res.armor = Math.max(res.armor, val);
      else if (target === 'ac.shield' || target === 'shield') res.shield = Math.max(res.shield, val);
      else if (target === 'ac.natural' || target === 'natural') {
        res.natural = Math.max(res.natural, val);
        res.naturalBonusType = bType.includes('enh') ? 'Natural_Armor_Ench' : 'Natural';
      }
      else if (target === 'ac.deflection' || target === 'deflection' || ((target === 'ac.total' || target === 'ac') && bType === 'deflection')) res.deflection = Math.max(res.deflection, val);
      else if (target === 'ac.dodge' || target === 'dodge' || ((target === 'ac.total' || target === 'ac') && bType === 'dodge')) res.dodge += val;
      else if ((target === 'ac.total' || target === 'ac') && bType === 'armor') res.armor = Math.max(res.armor, val);
      else if ((target === 'ac.total' || target === 'ac') && bType === 'shield') res.shield = Math.max(res.shield, val);
      else if (target === 'ability.str' || target === 'str') { res.str = Math.max(res.str, val); res.bonusType = bType; }
      else if (target === 'ability.dex' || target === 'dex') { res.dex = Math.max(res.dex, val); res.bonusType = bType; }
      else if (target === 'ability.con' || target === 'con') { res.con = Math.max(res.con, val); res.bonusType = bType; }
      else if (target === 'ability.int' || target === 'int') { res.int = Math.max(res.int, val); res.bonusType = bType; }
      else if (target === 'ability.wis' || target === 'wis') { res.wis = Math.max(res.wis, val); res.bonusType = bType; }
      else if (target === 'ability.cha' || target === 'cha') { res.cha = Math.max(res.cha, val); res.bonusType = bType; }
      else if (target === 'save.all' || target === 'saves.all' || target === 'saves') {
        if (bType === 'resistance') res.resistance = Math.max(res.resistance, val);
        res.fort += val;
        res.ref += val;
        res.will += val;
      }
      else if (target === 'save.fort' || target === 'fort') res.fort += val;
      else if (target === 'save.ref' || target === 'ref') res.ref += val;
      else if (target === 'save.will' || target === 'will') res.will += val;
      else if (target.startsWith('attack') || target === 'meleeattack' || target === 'rangedattack') res.attBonus += val;
      else if (target.startsWith('damage') || target === 'meleedamage' || target === 'rangeddamage') res.dmgBonus += val;
      else if (target.startsWith('speed')) res.speed = Math.max(res.speed, val);
      else if (target === 'dr') res.dr = Math.max(res.dr, val);
      else if (target === 'sr') res.sr = Math.max(res.sr, val);
    }

    // If Armor or Shield has V2 `armorStats.baseAc` and no `ac.armor`/`ac.shield` modifier was present yet
    const baseArmorAc = Number(item.armorStats?.baseAc ?? dbEntry?.armorStats?.baseAc ?? 0) || 0;
    const enhBonus = Number(item.enhancementBonus ?? dbEntry?.enhancementBonus ?? 0) || 0;
    const totalArmorAc = baseArmorAc > 0 ? (baseArmorAc + enhBonus) : 0;
    if (totalArmorAc > 0) {
      if (isShield && res.shield === 0) {
        res.shield = totalArmorAc;
        res.modifiers.push({ target: 'ac.shield', value: totalArmorAc, type: 'shield', condition: null, source: item.name });
      } else if (isArmor && res.armor === 0) {
        res.armor = totalArmorAc;
        res.modifiers.push({ target: 'ac.armor', value: totalArmorAc, type: 'armor', condition: null, source: item.name });
      }
    }

    if (item.dailyCharges || dbEntry?.dailyCharges) {
      res.dailyCharges = JSON.parse(JSON.stringify(item.dailyCharges || dbEntry.dailyCharges));
    }
    if (item.chargeOptions || dbEntry?.chargeOptions) {
      res.chargeOptions = JSON.parse(JSON.stringify(item.chargeOptions || dbEntry.chargeOptions));
    }

    return res;
  },

  // Standard D&D 3.5e Canonical V2 default buffs catalog
  getDefaultBuffs() {
    return [
      {
        id: "buf-mage-armor",
        schemaVersion: 2,
        name: "Mage Armor",
        type: "Buff",
        source: "Spell (Büyü)",
        category: "AC",
        durationCategory: "hour",
        active: false,
        rounds: 50,
        durationText: "1 saat / CL (5 Saat)",
        notes: "+4 Zırh (Armor) AC bonusu (Zırhla stackleşmez, MAX alınır)",
        modifiers: [{ target: "ac.armor", value: 4, formula: "4", type: "armor", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-shield",
        schemaVersion: 2,
        name: "Shield (Büyü)",
        type: "Buff",
        source: "Spell (Büyü)",
        category: "AC",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL (5 Dk)",
        notes: "+4 Kalkan (Shield) AC bonusu, Magic Missile büyüsünü engeller",
        modifiers: [{ target: "ac.shield", value: 4, formula: "4", type: "shield", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: { immuneMagicMissile: true }
      },
      {
        id: "buf-bulls-strength",
        schemaVersion: 2,
        name: "Bull's Strength",
        type: "Buff",
        source: "Spell / Potion",
        category: "Stat",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL (5 Dk)",
        notes: "+4 Enhancement STR (Dev Kemeri ile stackleşmez, MAX alınır)",
        modifiers: [{ target: "ability.str", value: 4, formula: "4", type: "enhancement", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-cats-grace",
        schemaVersion: 2,
        name: "Cat's Grace",
        type: "Buff",
        source: "Spell / Potion",
        category: "Stat",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL (5 Dk)",
        notes: "+4 Enhancement DEX (Eldiven ile stackleşmez, MAX alınır)",
        modifiers: [{ target: "ability.dex", value: 4, formula: "4", type: "enhancement", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-bears-endurance",
        schemaVersion: 2,
        name: "Bear's Endurance",
        type: "Buff",
        source: "Spell / Potion",
        category: "Stat",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL",
        notes: "+4 Enhancement CON (+2 HP/seviye, Fortitude artışı)",
        modifiers: [{ target: "ability.con", value: 4, formula: "4", type: "enhancement", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-haste",
        schemaVersion: 2,
        name: "Haste (Acele)",
        type: "Buff",
        source: "Spell (Büyü)",
        category: "Combat",
        durationCategory: "short",
        active: false,
        rounds: 6,
        durationText: "1 tur / CL (6 Tur)",
        notes: "+1 Saldırı, +1 Dodge AC, +1 Refl, +30 ft Hız, Tam turda +1 ek saldırı",
        modifiers: [
          { target: "attack.all", value: 1, formula: "1", type: "untyped", condition: null },
          { target: "ac.dodge", value: 1, formula: "1", type: "dodge", condition: null },
          { target: "save.ref", value: 1, formula: "1", type: "dodge", condition: null },
          { target: "speed.all", value: 30, formula: "30", type: "enhancement", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: { hasted: true, extraAttackFullAttack: true }
      },
      {
        id: "buf-bless",
        schemaVersion: 2,
        name: "Bless (Kutsama)",
        type: "Buff",
        source: "Spell (Büyü)",
        category: "Morale",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL",
        notes: "+1 Morale saldırı zarlarına ve korku kurtarma zarlarına",
        modifiers: [{ target: "attack.all", value: 1, formula: "1", type: "morale", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-prayer-positive",
        schemaVersion: 2,
        name: "Prayer (Dua)",
        type: "Buff",
        source: "Spell (Büyü)",
        category: "Luck",
        durationCategory: "short",
        active: false,
        rounds: 6,
        durationText: "1 tur / CL",
        notes: "+1 Luck saldırı, hasar, kurtarma ve beceri zarlarına",
        modifiers: [
          { target: "attack.all", value: 1, formula: "1", type: "luck", condition: null },
          { target: "damage.weapon", value: 1, formula: "1", type: "luck", condition: null },
          { target: "save.all", value: 1, formula: "1", type: "luck", condition: null },
          { target: "skill.all", value: 1, formula: "1", type: "luck", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-barkskin",
        schemaVersion: 2,
        name: "Barkskin",
        type: "Buff",
        source: "Spell (Büyü)",
        category: "AC",
        durationCategory: "short",
        active: false,
        rounds: 50,
        durationText: "10 dk / CL",
        notes: "+2 Doğal Zırh (Natural Armor Enhancement) bonusu",
        modifiers: [{ target: "ac.natural", value: 2, formula: "min(5, 2 + max(0, floor((@cl - 3) / 3)))", type: "natural_enhancement", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-shield-of-faith",
        schemaVersion: 2,
        name: "Shield of Faith",
        type: "Buff",
        source: "Spell (Büyü)",
        category: "AC",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 dk / CL",
        notes: "+2 Saptırma (Deflection) AC bonusu",
        modifiers: [{ target: "ac.deflection", value: 2, formula: "2 + min(3, floor(@cl / 6))", type: "deflection", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-divine-favor",
        schemaVersion: 2,
        name: "Divine Favor",
        type: "Buff",
        source: "Spell (Büyü)",
        category: "Combat",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 dk (10 Tur)",
        notes: "+1..+3 Luck saldırı ve silah hasarı bonusu",
        modifiers: [
          { target: "attack.all", value: 2, formula: "min(3, 1 + floor(@cl / 3))", type: "luck", condition: null },
          { target: "damage.weapon", value: 2, formula: "min(3, 1 + floor(@cl / 3))", type: "luck", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-punishing-stance",
        schemaVersion: 2,
        name: "Punishing Stance",
        type: "Buff",
        source: "Stance (Duruş)",
        category: "Stance",
        durationCategory: "permanent",
        active: true,
        rounds: null,
        durationText: "Sürekli",
        dmgDice: "1d6",
        notes: "+1d6 yakın dövüş silah hasarı, -2 AC savunma cezası",
        modifiers: [{ target: "ac.total", value: -2, formula: "-2", type: "penalty", condition: null }],
        damageParts: [{ dice: "1d6", bonus: 0, type: "Physical", multiplyOnCrit: false, onCritOnly: false, source: "Punishing Stance" }],
        modes: [],
        ruleFlags: {}
      }
    ];
  },

  // Standard D&D 3.5e RAW Canonical V2 default debuffs & conditions catalog
  getDefaultDebuffs() {
    return [
      {
        id: "cnd-energy-drained",
        schemaVersion: 2,
        name: "Energy Drain (-4 Lvl)",
        type: "Condition",
        source: "Spell / Undead",
        category: "Debuff",
        durationCategory: "condition",
        isDebuff: true,
        active: false,
        rounds: null,
        durationText: "Kalıcı (Restoration gerektirir)",
        negativeLevels: 4,
        notes: "D&D 3.5e RAW: 4 Negatif Seviye! -4 Saldırı, -4 Kurtarma Zarları, -4 Beceri/Yetenek, -20 Max/Mevcut HP, -4 Efektif Caster Level.",
        modifiers: [
          { target: "attack.all", value: -4, formula: "-4", type: "penalty", condition: null },
          { target: "save.all", value: -4, formula: "-4", type: "penalty", condition: null },
          { target: "skill.all", value: -4, formula: "-4", type: "penalty", condition: null },
          { target: "hp.max", value: -20, formula: "-20", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: { actionRestriction: "Energy Drained (-4 Negative Levels): -4 on all attacks, saves, skills, ability checks, -20 Max HP, -4 effective Caster Level." }
      },
      {
        id: "cnd-sickened",
        schemaVersion: 2,
        name: "Sickened (Midesi Bulanmış)",
        type: "Condition",
        source: "Condition (Durum)",
        category: "Debuff",
        durationCategory: "condition",
        isDebuff: true,
        active: false,
        rounds: 10,
        durationText: "10 Tur",
        notes: "D&D 3.5e RAW: -2 saldırı zarları, silah hasar zarları, kurtarma zarları, beceri ve yetenek testleri",
        modifiers: [
          { target: "attack.all", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "damage.weapon", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "save.all", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "skill.all", value: -2, formula: "-2", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "cnd-shaken",
        schemaVersion: 2,
        name: "Shaken (Korkmuş)",
        type: "Condition",
        source: "Condition (Durum)",
        category: "Debuff",
        durationCategory: "condition",
        isDebuff: true,
        active: false,
        rounds: 10,
        durationText: "10 Tur",
        notes: "D&D 3.5e RAW: Korku durumu. -2 saldırı zarları, kurtarma zarları, beceri ve yetenek testleri",
        modifiers: [
          { target: "attack.all", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "save.all", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "skill.all", value: -2, formula: "-2", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "cnd-fatigued",
        schemaVersion: 2,
        name: "Fatigued (Yorgun)",
        type: "Condition",
        source: "Condition (Durum)",
        category: "Debuff",
        durationCategory: "condition",
        isDebuff: true,
        active: false,
        rounds: null,
        durationText: "8 Saat Dinlenme",
        notes: "D&D 3.5e RAW: Koşamaz veya şarj edemez. -2 STR ve -2 DEX cezası alır.",
        modifiers: [
          { target: "ability.str", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "ability.dex", value: -2, formula: "-2", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: { actionRestriction: "Cannot run or charge (-2 Str, -2 Dex). 8 hours complete rest removes Fatigue." }
      },
      {
        id: "cnd-entangled",
        schemaVersion: 2,
        name: "Entangled (Dolaşmış)",
        type: "Condition",
        source: "Condition (Durum)",
        category: "Debuff",
        durationCategory: "condition",
        isDebuff: true,
        active: false,
        rounds: 5,
        durationText: "5 Tur",
        notes: "D&D 3.5e RAW: Yarı hareket hızı, koşamaz/şarj edemez, saldırı zarlarına -2, DEX'e -4 (-2 AC ve -2 Refl)",
        modifiers: [
          { target: "attack.all", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "ability.dex", value: -4, formula: "-4", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: { halfSpeed: true, actionRestriction: "Ensnared: moves at half speed, cannot run or charge, Concentration DC 15 + spell level to cast." }
      },
      {
        id: "buf-slow",
        schemaVersion: 2,
        name: "Slow (Yavaşlatma Büyüsü)",
        type: "Condition",
        source: "Spell (Büyü)",
        category: "Debuff",
        durationCategory: "short",
        isDebuff: true,
        active: false,
        rounds: 6,
        durationText: "1 tur / CL (6 Tur)",
        notes: "D&D 3.5e RAW: Turda sadece tek bir eylem (Move veya Standard), -1 AC, -1 Saldırı, -1 Refl, Yarı Hız",
        modifiers: [
          { target: "ac.total", value: -1, formula: "-1", type: "penalty", condition: null },
          { target: "attack.all", value: -1, formula: "-1", type: "penalty", condition: null },
          { target: "save.ref", value: -1, formula: "-1", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: { halfSpeed: true, actionRestriction: "Slowed: Only a single Move or Standard action per turn, moves at half speed." }
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

    // 13. CANONICAL V2 DAMAGE PARTS EVALUATOR (spell.damageParts or Compendium entry)
    const dbSpell = (!Array.isArray(spell.damageParts) || spell.damageParts.length === 0)
      ? this.getMasterDbEntry(spell, 'Spell')
      : null;
    const v2DamageParts = (Array.isArray(spell.damageParts) && spell.damageParts.length > 0)
      ? spell.damageParts
      : (dbSpell && Array.isArray(dbSpell.damageParts) ? dbSpell.damageParts : []);

    if (v2DamageParts.length > 0) {
      const primaryPart = v2DamageParts[0];
      const rawDiceExpr = String(primaryPart.dice || '').trim();
      const evaluatedDice = String(this.evaluateFormula(rawDiceExpr, { cl, level: cl }) || rawDiceExpr).trim();
      const evaluatedBonus = Number(this.evaluateFormula(primaryPart.bonus || 0, { cl, level: cl })) || 0;
      const partType = primaryPart.type || dmgType;

      const parsed = evaluatedDice.match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
      if (parsed) {
        const diceCount = parseInt(parsed[1], 10) || 1;
        const dieSides = parseInt(parsed[2], 10) || 6;
        let staticBonus = evaluatedBonus;
        if (parsed[4]) {
          staticBonus += parsed[3] === '-' ? -parseInt(parsed[4], 10) : parseInt(parsed[4], 10);
        }
        const isScaled = rawDiceExpr.includes('@cl') || String(primaryPart.bonus || '').includes('@cl');
        const diceFormula = staticBonus !== 0
          ? `${diceCount}d${dieSides}${staticBonus > 0 ? '+' : ''}${staticBonus}`
          : `${diceCount}d${dieSides}`;
        return {
          scaled: isScaled,
          name: rawName,
          casterLevel: cl,
          projectiles: 1,
          diceCount,
          dieSides,
          staticBonus,
          diceFormula,
          dmgType: partType,
          damageParts: v2DamageParts,
          displayText: `${diceFormula} ${partType}`,
          descDetail: isScaled ? `CL ${cl}: ${diceFormula} ${partType}` : ''
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

  // Central Recalculation Engine for Character State (Abilities, AC, Saves, Speed, Buffs) - Canonical V2
  recalculateCharacter(character, masterDb = [], tacticalOptions = {}) {
    if (!character) return;
    const options = tacticalOptions || {};

    // 0. Gatekeeper: Ensure Character Data is Canonical V2
    if (character.schemaVersion !== 2 && typeof window !== 'undefined' && window.SchemaMigrator) {
      window.SchemaMigrator.upgradeCharacterToV2(character);
    }

    const charLvl = Number(character.level) || (Array.isArray(character.levelProgression) ? character.levelProgression.filter(l => l.active !== false).length : 1) || 1;
    const bab = Number(character.bab) || 0;
    const evalContext = { cl: charLvl, level: charLvl, bab };

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
      if (character.bodySlots?.belt?.active && character.bodySlots.belt.name?.toLowerCase().includes('+2')) {
        character.baseAbilities.str = Math.max(8, character.baseAbilities.str - 2);
      }
      if (character.bodySlots?.gloves?.active && character.bodySlots.gloves.name?.toLowerCase().includes('+2')) {
        character.baseAbilities.dex = Math.max(8, character.baseAbilities.dex - 2);
      }
    } else if (!character.hasCustomBaseAbilities) {
      if (character.bodySlots?.belt?.active && (character.bodySlots.belt.name || '').toLowerCase().includes('+2') && character.baseAbilities.str === 14) {
        character.baseAbilities.str = 12;
      }
      if (character.bodySlots?.gloves?.active && (character.bodySlots.gloves.name || '').toLowerCase().includes('+2') && character.baseAbilities.dex === 16) {
        character.baseAbilities.dex = 14;
      }
    }

    if (!Array.isArray(character.buffs)) {
      character.buffs = [];
    }

    // 2. Initialize Aggregation Buckets
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
    const abilityBuckets = {
      str: [],
      dex: [],
      con: [],
      int: [],
      wis: [],
      cha: []
    };

    let hasSteadfastDetermination = false;
    let minMaxDex = null;
    let totalAcp = 0;
    let resistBonus = 0;
    let itemSpeedBonus = 0;
    let buffSpeedBonus = 0;
    let buffSpeedPenalty = 0;
    let buffAcPenalty = 0;
    let buffSkillBonus = 0;
    let debuffHpPenalty = 0;
    let draconicToughnessHp = 0;
    let conditionLoseDexToAC = false;
    let conditionEffectiveDexZero = false;
    let conditionHalfSpeed = false;
    const activeConditionWarnings = [];

    // Universal Canonical V2 Modifiers Processor
    const applyV2Modifiers = (modifiers, sourceName, sourceCategory = 'item', customCtx = null) => {
      if (!Array.isArray(modifiers)) return;
      const ctx = customCtx || evalContext;

      modifiers.forEach(mod => {
        if (!mod || !mod.target) return;
        const target = String(mod.target).trim().toLowerCase();
        const rawExpr = mod.value !== undefined && mod.value !== null ? mod.value : mod.formula;
        const val = Number(this.evaluateFormula(rawExpr, ctx)) || 0;
        if (val === 0) return;

        const mType = String(mod.type || (val < 0 ? 'penalty' : 'untyped')).trim();
        const mTypeLower = mType.toLowerCase();

        // Ability Scores (both `ability.str` and `str`)
        const statKey = target.startsWith('ability.') ? target.slice(8) : target;
        if (['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(statKey)) {
          const statType = (mTypeLower === 'untyped' && sourceCategory === 'item') ? 'Enhancement' : mType;
          abilityBuckets[statKey].push({ val, type: statType, source: sourceName });
          return;
        }

        // Armor Class (both `ac.*` and `ac` / `armor` / `shield` / `natural` / `deflection` / `dodge`)
        const acSub = target.startsWith('ac.') ? target.slice(3) : target;
        if (target === 'ac' || target.startsWith('ac.') || ['armor', 'shield', 'natural', 'deflection', 'dodge'].includes(acSub)) {
          if (val < 0 || mTypeLower === 'penalty') {
            buffAcPenalty += Math.abs(val);
          } else if (acSub === 'shield' || mTypeLower === 'shield') {
            shieldBonuses.push({ val, source: sourceName, type: 'Shield' });
          } else if (acSub === 'deflection' || mTypeLower === 'deflection') {
            deflectionBonuses.push({ val, source: sourceName, type: 'Deflection' });
          } else if (acSub === 'natural' || mTypeLower === 'natural' || mTypeLower === 'natural_armor_ench' || mTypeLower === 'natural_enhancement') {
            const natType = (mTypeLower.includes('ench') || sourceName.toLowerCase().includes('barkskin') || sourceName.toLowerCase().includes('amulet of natural armor'))
              ? 'Natural_Armor_Ench'
              : 'Natural';
            naturalBonuses.push({ val, source: sourceName, type: natType });
          } else if (acSub === 'dodge' || mTypeLower === 'dodge' || mTypeLower === 'haste' || mTypeLower === 'insight' || mTypeLower === 'luck' || mTypeLower === 'sacred' || mTypeLower === 'profane') {
            dodgeBonuses.push({ val, source: sourceName, type: mTypeLower === 'dodge' ? 'Dodge' : mType });
          } else {
            armorBonuses.push({ val, source: sourceName, type: 'Armor' });
          }
          return;
        }

        // Saving Throws (`save.all`, `saves.all`, `save.fort`, `fort`, etc.)
        const saveSub = target.replace(/^saves?\./, '');
        if (saveSub === 'all' || target === 'saves' || target === 'all_saves') {
          saveBonusBuckets.fort.push({ val, type: mType, source: sourceName });
          saveBonusBuckets.ref.push({ val, type: mType, source: sourceName });
          saveBonusBuckets.will.push({ val, type: mType, source: sourceName });
          if (mTypeLower === 'resistance' && val > resistBonus) resistBonus = val;
          return;
        }
        if (saveSub === 'fort' || saveSub === 'ref' || saveSub === 'will') {
          saveBonusBuckets[saveSub].push({ val, type: mType, source: sourceName });
          return;
        }

        // Speed (`speed`, `speed.land`, `speed.all`)
        if (target === 'speed' || target.startsWith('speed.')) {
          if (val < 0 || mTypeLower === 'penalty') {
            buffSpeedPenalty += Math.abs(val);
          } else if (sourceCategory === 'item') {
            if (val > itemSpeedBonus) itemSpeedBonus = val;
          } else {
            if (val > buffSpeedBonus) buffSpeedBonus = val;
          }
          return;
        }

        // Global Skill Modifiers
        if (target === 'skill.all' || target === 'skills.all' || target === 'skills') {
          buffSkillBonus += val;
          return;
        }

        // Max HP / Negative Level HP Adjustment
        if (target === 'hp.max' || target === 'hp') {
          if (val < 0) debuffHpPenalty += Math.abs(val);
          else draconicToughnessHp += val;
        }
      });
    };

    // 2.5. Collect Equipment Bonuses from active bodySlots
    let twoHandedConflict = null;
    let offHandSuppressed = false;
    let equippedArmorCategory = 'None';

    if (character.bodySlots && typeof character.bodySlots === 'object') {
      const mh = character.bodySlots.mainHand;
      const oh = character.bodySlots.offHand;
      const isMhTwoHand = mh && mh.name && mh.name !== '-' && this.isTwoHandedWeapon(mh);
      const isOhOccupied = oh && oh.active !== false && oh.name && oh.name !== '-';

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

        const mods = this.parseItemModifiers(slotData, masterDb, evalContext);
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

        const abilityBonusType = (mods.bonusType && mods.bonusType.toLowerCase() !== 'untyped') ? mods.bonusType : 'Enhancement';
        if (mods.str !== 0) abilityBuckets.str.push({ val: mods.str, type: abilityBonusType, source: slotData.name });
        if (mods.dex !== 0) abilityBuckets.dex.push({ val: mods.dex, type: abilityBonusType, source: slotData.name });
        if (mods.con !== 0) abilityBuckets.con.push({ val: mods.con, type: abilityBonusType, source: slotData.name });
        if (mods.int !== 0) abilityBuckets.int.push({ val: mods.int, type: abilityBonusType, source: slotData.name });
        if (mods.wis !== 0) abilityBuckets.wis.push({ val: mods.wis, type: abilityBonusType, source: slotData.name });
        if (mods.cha !== 0) abilityBuckets.cha.push({ val: mods.cha, type: abilityBonusType, source: slotData.name });
      });
    }

    // 3. Collect Active Buffs & Debuffs / Conditions (Canonical V2 modifiers & ruleFlags)
    character.buffs.forEach(rawBuff => {
      if (!rawBuff || !rawBuff.active) return;
      const buff = this.ensureV2Entry(rawBuff);
      const buffCl = Number(buff.casterLevel || charLvl) || charLvl;
      const buffCtx = { ...evalContext, cl: buffCl };

      if (buff.negativeLevels) {
        const negLvls = Number(buff.negativeLevels) || 0;
        if (negLvls > 0 && (!Array.isArray(buff.modifiers) || buff.modifiers.length === 0)) {
          debuffHpPenalty += negLvls * 5;
          saveBonusBuckets.fort.push({ val: -negLvls, type: 'penalty', source: `${buff.name} (-${negLvls} Lvl)` });
          saveBonusBuckets.ref.push({ val: -negLvls, type: 'penalty', source: `${buff.name} (-${negLvls} Lvl)` });
          saveBonusBuckets.will.push({ val: -negLvls, type: 'penalty', source: `${buff.name} (-${negLvls} Lvl)` });
          buffSkillBonus -= negLvls;
        }
      }

      applyV2Modifiers(buff.modifiers, buff.name || 'Buff', 'buff', buffCtx);

      const rf = buff.ruleFlags || {};
      if (rf.loseDexToAC) conditionLoseDexToAC = true;
      if (rf.effectiveDexZero) {
        conditionEffectiveDexZero = true;
        conditionLoseDexToAC = true;
      }
      if (rf.halfSpeed) conditionHalfSpeed = true;
      if (rf.actionRestriction || buff.isCondition || buff.isDebuff) {
        activeConditionWarnings.push({
          id: buff.id || buff.name,
          name: buff.name,
          icon: buff.icon || '⚠️',
          actionRestriction: rf.actionRestriction || null,
          summary: buff.summary || ''
        });
      }
    });
    character.activeConditionWarnings = activeConditionWarnings;

    // 3.5. Evaluate Feats, Special Abilities & DM Boons (Canonical V2)
    const allAbilitiesAndFeats = [
      ...(character.feats || []),
      ...(character.specialAbilities || [])
    ];

    allAbilitiesAndFeats.forEach(rawFeat => {
      if (!rawFeat) return;
      const featObj = typeof rawFeat === 'string' ? { name: rawFeat, category: 'Feat' } : this.ensureV2Entry(rawFeat);
      const rawName = String(featObj.name || '').trim();
      if (!rawName || rawName.startsWith('↳')) return;

      const cleanName = rawName.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').toLowerCase().trim();
      const dbEntry = this.getMasterDbEntry(featObj) || this.getMasterDbEntry(cleanName);

      // Apply V2 modifiers from feat object or compendium entry
      const featMods = (Array.isArray(featObj.modifiers) && featObj.modifiers.length > 0)
        ? featObj.modifiers
        : (dbEntry && Array.isArray(dbEntry.modifiers) ? dbEntry.modifiers : []);
      applyV2Modifiers(featMods, rawName, 'feat', evalContext);

      const rf = { ...(dbEntry?.ruleFlags || {}), ...(featObj.ruleFlags || {}) };
      if (rf.conToWillSave || cleanName.includes('steadfast determination')) {
        hasSteadfastDetermination = true;
      }
      if (rf.hpPerLevel || cleanName.includes('draconic toughness')) {
        draconicToughnessHp = Math.max(draconicToughnessHp, charLvl);
      }

      // Dynamic scaling natural armor boons (e.g. "Nat AC 2+1/4lvl") if not already in V2 modifiers
      if (featMods.length === 0 && (cleanName.includes('nat ac') || cleanName.includes('natural armor') || cleanName.includes('doğal zırh'))) {
        const desc = String(featObj.benefit || featObj.desc || featObj.description || dbEntry?.benefit || dbEntry?.description || '').toLowerCase();
        let natVal = this.evaluateScalingBonus(cleanName, charLvl) || this.evaluateScalingBonus(desc, charLvl);
        if (natVal > 0) {
          naturalBonuses.push({ val: natVal, source: rawName, type: 'Natural' });
        }
      }
    });

    // 3.8. Collect Slotless or Wondrous Gear Pool Items (e.g. Stone of Good Luck, Pale Green Ioun Stone)
    if (Array.isArray(character.gearPool)) {
      character.gearPool.forEach(rawItem => {
        if (!rawItem || !rawItem.name) return;
        const item = this.ensureV2Entry(rawItem);
        const dbEntry = this.getMasterDbEntry(item);
        const isSlotless = (item.slot || dbEntry?.slot || '').toLowerCase().includes('slotless')
          || (item.category || '').toLowerCase() === 'other';
        if (!item.isEquipped && !isSlotless) return;

        const itemMods = (Array.isArray(item.modifiers) && item.modifiers.length > 0)
          ? item.modifiers
          : (dbEntry && Array.isArray(dbEntry.modifiers) ? dbEntry.modifiers : []);
        // Only apply save/ability/luck modifiers for slotless/gearPool items that aren't already in bodySlots
        const inBodySlot = character.bodySlots && Object.values(character.bodySlots).some(s => s && s.active !== false && (s.id === item.id || s.name === item.name));
        if (!inBodySlot && itemMods.length > 0) {
          applyV2Modifiers(itemMods, item.name, 'item', evalContext);
        }
      });
    }

    // 3.9. Collect Racial Modifiers from Canonical V2 Race Entry (D&D 3.5e RAW)
    if (character.race) {
      const raceObj = this.getMasterDbEntry(character.race, 'Race');
      if (raceObj && Array.isArray(raceObj.modifiers)) {
        const raceLabel = `${raceObj.name || character.race} (Irk)`;
        applyV2Modifiers(raceObj.modifiers, raceLabel, 'race', evalContext);
      }
    }

    // 4. Resolve Stacking for Abilities (RAW: Same types take Math.max, untyped/dodge/racial stack)
    if (!character.abilities) character.abilities = {};
    character.abilitySources = abilityBuckets;
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
      const base = character.baseAbilities[stat] || 10;
      const bonusItems = abilityBuckets[stat];
      const netBonus = this.resolveBonusStacking(bonusItems);
      character.abilities[stat] = base + netBonus;
    });

    // 4.5. Resolve Dynamic Hit Points (HP) based on Constitution Changes and Debuff Penalties
    const charFeatNames = (character.feats || []).map(f => (typeof f === 'string' ? f : (f.name || '')).toLowerCase().trim());
    const totalHD = Number(character.level) || (Array.isArray(character.levelProgression) ? character.levelProgression.length : 1);
    const hasFrail = charFeatNames.some(f => f.includes('flaw: frail') || f === 'frail');
    const flawHpPenalty = hasFrail ? totalHD : 0;

    if (character.hp) {
      const effectiveConMod = this.getAbilityMod(character.abilities?.con || 10);
      const newConBonusHp = effectiveConMod * totalHD;

      if (character.hp.baseMax === undefined || character.hp.baseMax === null) {
        character.hp.baseMax = Math.max(1, (Number(character.hp.max) || 45) - (Number(character.hp.conBonusHp) || 0) + flawHpPenalty + (Number(character.hp.debuffHpPenalty) || 0));
      }
      if (character.hp.conBonusHp === undefined || character.hp.conBonusHp === null) {
        character.hp.conBonusHp = newConBonusHp;
      }

      const prevConBonusHp = Number(character.hp.conBonusHp);
      const prevDebuffHp = Number(character.hp.debuffHpPenalty) || 0;
      const conHpDiff = newConBonusHp - prevConBonusHp;
      const debuffHpDiff = debuffHpPenalty - prevDebuffHp;

      if (conHpDiff !== 0 || debuffHpDiff !== 0 || character.hp._appliedFrail !== hasFrail || character.hp.max === undefined) {
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
    const combatExpertise = tacticalOptions.combatExpertise || 0;
    const fightingDefensively = tacticalOptions.fightingDefensively || false;
    const totalDefense = tacticalOptions.totalDefense || false;
    const charge = tacticalOptions.charge || false;

    if (charFeatNames.some(f => f === 'dodge') && !dodgeBonuses.some(d => (d.source || '').toLowerCase() === 'dodge')) {
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

    // Dex to AC capped by Max Dex & Condition Flags (Helpless / Paralyzed / Blinded / Stunned / Grappled)
    const fullDexMod = conditionEffectiveDexZero ? -5 : this.getAbilityMod(character.abilities.dex || 10);
    let effectiveDex = minMaxDex !== null ? Math.min(fullDexMod, minMaxDex) : fullDexMod;
    if (conditionLoseDexToAC) {
      effectiveDex = Math.min(0, effectiveDex);
      effectiveDodge = 0; // RAW D&D 3.5e: Any condition that makes you lose Dex bonus to AC also makes you lose Dodge bonuses
    }

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

    // Flat-footed AC (RAW: retain negative Dex penalty even when flat-footed; retain Dex & Dodge if Uncanny Dodge unless immobilized/helpless)
    const hasUncannyDodge = !conditionEffectiveDexZero && (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : a.name).toLowerCase().includes('uncanny dodge'));
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
      loseDexToAC: conditionLoseDexToAC,
      effectiveDexZero: conditionEffectiveDexZero,
      sources: {
        armor: armorBonuses,
        shield: shieldBonuses,
        natural: naturalBonuses,
        deflection: deflectionBonuses,
        dodge: dodgeBonuses
      }
    };

    if (character.isNpc && character.ac && character.ac.total) {
      character.acBreakdown.total = character.ac.total;
      character.acBreakdown.touch = character.ac.touch !== undefined ? character.ac.touch : character.ac.total;
      character.acBreakdown.flat = character.ac.flatFooted !== undefined ? character.ac.flatFooted : character.ac.total;
    }

    // 6. Resolve Saving Throws
    const conMod = this.getAbilityMod(character.abilities.con || 10);
    const dexMod = conditionEffectiveDexZero ? -5 : this.getAbilityMod(character.abilities.dex || 10);
    const wisMod = this.getAbilityMod(character.abilities.wis || 10);
    const intMod = this.getAbilityMod(character.abilities.int || 10);

    const baseFort = character.baseSaves?.fort || 0;
    const baseRef = character.baseSaves?.ref || 0;
    const baseWill = character.baseSaves?.will || 0;

    if (!character.saveBonuses) character.saveBonuses = {};
    character.saveBonuses.resistance = resistBonus;

    // Ensure Great Fortitude / Lightning Reflexes / Iron Will apply even if stored as plain strings
    if (charFeatNames.some(f => f.includes('great fortitude')) && !saveBonusBuckets.fort.some(b => (b.source || '').toLowerCase().includes('great fortitude'))) {
      saveBonusBuckets.fort.push({ val: 2, type: 'Untyped', source: 'Great Fortitude' });
    }
    if (charFeatNames.some(f => f.includes('lightning reflexes')) && !saveBonusBuckets.ref.some(b => (b.source || '').toLowerCase().includes('lightning reflexes'))) {
      saveBonusBuckets.ref.push({ val: 2, type: 'Untyped', source: 'Lightning Reflexes' });
    }
    if (charFeatNames.some(f => f.includes('iron will')) && !saveBonusBuckets.will.some(b => (b.source || '').toLowerCase().includes('iron will'))) {
      saveBonusBuckets.will.push({ val: 2, type: 'Untyped', source: 'Iron Will' });
    }
    if (charFeatNames.some(f => f.includes('flaw: poor reflexes') || f === 'poor reflexes')) {
      saveBonusBuckets.ref.push({ val: -2, type: 'penalty', source: 'Flaw: Poor Reflexes' });
    }

    const miscSaveBonus = (character.saveBonuses?.bonus || 0) + (character.saveBonuses?.misc || 0);
    if (miscSaveBonus > 0) {
      saveBonusBuckets.fort.push({ val: miscSaveBonus, type: 'Untyped', source: 'Misc Save Bonus' });
      saveBonusBuckets.ref.push({ val: miscSaveBonus, type: 'Untyped', source: 'Misc Save Bonus' });
      saveBonusBuckets.will.push({ val: miscSaveBonus, type: 'Untyped', source: 'Misc Save Bonus' });
    }

    // Battle Clarity (Warblade 1): Add INT modifier (max Warblade lvl) to Reflex saves when not flat-footed
    const charClassNames = (character.classes || '').toLowerCase();
    const isWarblade = charClassNames.includes('warblade') || (Array.isArray(character.levelProgression) && character.levelProgression.some(l => (l.className || '').toLowerCase().includes('warblade')));
    const hasBattleClarity = (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : (a.name || '')).toLowerCase().includes('battle clarity')) || isWarblade;
    const warbladeLvl = (Array.isArray(character.levelProgression) ? character.levelProgression.filter(l => (l.className || '').toLowerCase().includes('warblade')).length : 0) || (isWarblade ? 1 : 0);
    const battleClarityBonus = (hasBattleClarity && !conditionLoseDexToAC) ? Math.min(warbladeLvl, Math.max(0, intMod)) : 0;

    const netBonusFort = this.resolveBonusStacking(saveBonusBuckets.fort);
    const netBonusRef = this.resolveBonusStacking(saveBonusBuckets.ref) + battleClarityBonus;
    const netBonusWill = this.resolveBonusStacking(saveBonusBuckets.will);

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

    if (character.isNpc && character.saves) {
      if (character.saves.fort?.total !== undefined) character.evaluatedSaves.fort = character.saves.fort.total;
      if (character.saves.ref?.total !== undefined) character.evaluatedSaves.ref = character.saves.ref.total;
      if (character.saves.will?.total !== undefined) character.evaluatedSaves.will = character.saves.will.total;
    }

    // 7. Resolve Effective Speed (RAW D&D 3.5e Table 8-2: Armor and Speed + Condition Half-Speed)
    const baseSpeed = character.baseSpeed || 30;
    const isDwarf = (character.race || '').toLowerCase().includes('dwarf');
    let armorSpeedPenalty = 0;
    if (!isDwarf && (equippedArmorCategory === 'Medium' || equippedArmorCategory === 'Heavy')) {
      armorSpeedPenalty = (baseSpeed > 20) ? 10 : 5;
    }
    let calcSpeed = Math.max(5, baseSpeed - armorSpeedPenalty + itemSpeedBonus + buffSpeedBonus - buffSpeedPenalty);
    if (conditionHalfSpeed) {
      calcSpeed = Math.max(5, Math.floor(calcSpeed / 10) * 5 || 5);
    }
    character.effectiveSpeed = calcSpeed;
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
      actionEconomy: character.actionEconomy,
      activeConditionWarnings: character.activeConditionWarnings
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

  // Evaluate Passive / Rule Flags across feats, abilities and buffs (Canonical V2)
  evaluateRuleFlags(character) {
    if (!character) return {};
    const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());

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
      loseDexToAC: false,
      effectiveDexZero: false,
      halfSpeed: false,
      extraAttackFullAttack: false,
      actionRestriction: null,
      opposedCheckBonus: {
        trip: feats.some(f => f.includes('improved trip')) ? 4 : 0,
        disarm: feats.some(f => f.includes('improved disarm')) ? 4 : 0,
        sunder: feats.some(f => f.includes('improved sunder')) ? 4 : 0,
        grapple: feats.some(f => f.includes('improved grapple')) ? 4 : 0,
        bullrush: feats.some(f => f.includes('improved bull rush')) ? 4 : 0,
        overrun: feats.some(f => f.includes('improved overrun')) ? 4 : 0
      }
    };

    const mergeFlags = (rf) => {
      if (!rf || typeof rf !== 'object') return;
      Object.entries(rf).forEach(([k, v]) => {
        if (k === 'opposedCheckBonus' && typeof v === 'object') {
          Object.assign(flags.opposedCheckBonus, v);
        } else if (v !== undefined && v !== null && v !== false) {
          flags[k] = v;
        }
      });
    };

    // Merge declarative ruleFlags from character feats & Compendium entries
    (character.feats || []).forEach(f => {
      if (typeof f === 'object' && f && f.ruleFlags) mergeFlags(f.ruleFlags);
      const dbFeat = this.getMasterDbEntry(f, 'Feat');
      if (dbFeat && dbFeat.ruleFlags) mergeFlags(dbFeat.ruleFlags);
    });

    // Merge declarative ruleFlags from active buffs & conditions
    (character.buffs || []).forEach(b => {
      if (!b || !b.active) return;
      const v2Buff = this.ensureV2Entry(b);
      if (v2Buff.ruleFlags) mergeFlags(v2Buff.ruleFlags);
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

  // Evaluate Weapon Attack Modifiers, Embedded Modes & Canonical V2 DamageParts
  evaluateWeaponAttack(character, rawWeapon, options = {}) {
    if (!character || !rawWeapon) return {};

    // 0. Ensure Weapon is Canonical V2 & Resolve Active Embedded Mode
    const v2Weapon = this.ensureV2Entry(rawWeapon);
    const dbWeapon = this.getMasterDbEntry(v2Weapon, 'Weapon');
    const modes = Array.isArray(v2Weapon.modes) && v2Weapon.modes.length > 0
      ? v2Weapon.modes
      : (dbWeapon && Array.isArray(dbWeapon.modes) ? dbWeapon.modes : []);

    const activeModeId = options.modeId !== undefined ? options.modeId : v2Weapon.activeModeId;
    const activeMode = (activeModeId && modes.length > 0)
      ? (modes.find(m => m && (m.id === activeModeId || m.name === activeModeId)) || null)
      : null;

    // Effective weapon merges active mode overrides onto parent V2 weapon
    const weapon = activeMode ? {
      ...v2Weapon,
      grip: activeMode.grip || v2Weapon.grip,
      isRanged: activeMode.isRanged !== undefined ? activeMode.isRanged : v2Weapon.isRanged,
      range: activeMode.range !== undefined ? activeMode.range : v2Weapon.range,
      damageParts: (Array.isArray(activeMode.damageParts) && activeMode.damageParts.length > 0)
        ? activeMode.damageParts
        : v2Weapon.damageParts,
      modifiers: [
        ...(Array.isArray(v2Weapon.modifiers) ? v2Weapon.modifiers : []),
        ...(Array.isArray(activeMode.modifiers) ? activeMode.modifiers : [])
      ]
    } : v2Weapon;

    const isTwoHand = this.isTwoHandedWeapon(weapon);
    let resolvedGrip = options.grip || weapon.grip || (isTwoHand ? '2-Hand' : '1-Hand');

    // Two-handed weapon MUST be wielded with 2-Hand grip per D&D 3.5e RAW (unless in a thrown/ranged mode)
    if (isTwoHand && resolvedGrip !== '2-Hand' && resolvedGrip !== 'Ranged') {
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

    const charLvl = Number(character.level) || 1;
    const bab = Number(character.bab) || 0;
    const strMod = this.getAbilityMod(character.abilities?.str || 10);
    const dexMod = this.getAbilityMod(character.abilities?.dex || 10);
    const evalCtx = {
      cl: charLvl,
      level: charLvl,
      bab,
      strMod,
      dexMod,
      enhancement: Number(weapon.enhancementBonus) || 0
    };

    const houseRules = options.houseRules || character?.houseRules || {};
    const critData = this.evaluateCritThreatRange(weapon, character, houseRules);
    const chargeData = this.evaluateChargeDamage(weapon, character, options);
    const ruleFlags = this.evaluateRuleFlags(character);

    // Feat detections (match via baseItemId or stripped weapon name)
    const baseWepName = (weapon.baseItemId || weapon.name || '').toLowerCase().replace(/^wep_/, '').replace(/_/g, ' ').replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());
    const hasWeaponFinesse = feats.some(f => f.includes('weapon finesse'));
    const hasShadowBlade = feats.some(f => f.includes('shadow blade'));
    const hasWeaponFocus = feats.some(f => f.includes('weapon focus') && !f.includes('greater weapon focus') && ((baseWepName && f.includes(baseWepName)) || f.includes((weapon.name || '').toLowerCase()) || f.includes('all')));
    const hasGreaterWeaponFocus = feats.some(f => f.includes('greater weapon focus') && ((baseWepName && f.includes(baseWepName)) || f.includes((weapon.name || '').toLowerCase()) || f.includes('all')));
    const hasWeaponSpec = feats.some(f => f.includes('weapon specialization') && !f.includes('greater weapon specialization') && ((baseWepName && f.includes(baseWepName)) || f.includes((weapon.name || '').toLowerCase()) || f.includes('all')));
    const hasGreaterWeaponSpec = feats.some(f => f.includes('greater weapon specialization') && ((baseWepName && f.includes(baseWepName)) || f.includes((weapon.name || '').toLowerCase()) || f.includes('all')));

    const isRangedWep = grip === 'Ranged' || weapon.isRanged || (Array.isArray(weapon.tags) && weapon.tags.includes('ranged')) || (weapon.weaponStats && weapon.weaponStats.category === 'Ranged');

    // 1. Attack Stat Calculation
    let attackStatMod = isRangedWep ? dexMod : strMod;
    let attackStatName = isRangedWep ? 'DEX (Ranged)' : 'STR';

    if (!isRangedWep && hasWeaponFinesse && this.isFinessable(weapon) && dexMod > strMod) {
      attackStatMod = dexMod;
      attackStatName = 'DEX (Weapon Finesse)';
    }

    // Power attack penalty: cannot exceed BAB
    const effectivePA = Math.min(bab, Math.max(0, Number(powerAttack) || 0));

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

    // Weapon Proficiency Check (RAW D&D 3.5e: -4 attack penalty if non-proficient)
    const isWepProf = this.isProficientWithWeapon(character, weapon);
    if (!isWepProf) {
      attackBonusItems.push({ type: 'penalty', val: -4, source: 'Non-Proficient Weapon Penalty (-4 Att)' });
    }

    // Armor Non-Proficiency Check
    if (character.bodySlots && character.bodySlots.armor) {
      const armorItem = character.bodySlots.armor;
      if (armorItem && armorItem.name && armorItem.name !== '-' && armorItem.active !== false) {
        const isArmorProf = this.isProficientWithArmor(character, armorItem);
        if (!isArmorProf) {
          const armorMods = this.parseItemModifiers(armorItem, (typeof masterDb !== 'undefined' ? masterDb : []), evalCtx);
          const armorAcp = armorMods ? armorMods.acp : 0;
          if (armorAcp < 0) {
            attackBonusItems.push({
              type: 'penalty',
              val: armorAcp,
              source: `Non-Proficient Armor Penalty (${armorItem.name} ACP ${armorAcp})`
            });
          }
        }
      }
    }

    // Shield Non-Proficiency Check
    if (character.bodySlots && character.bodySlots.offHand) {
      const offHandItem = character.bodySlots.offHand;
      if (offHandItem && offHandItem.name && offHandItem.name !== '-' && offHandItem.active !== false) {
        if (this.isShieldItem(offHandItem)) {
          const isShieldProf = this.isProficientWithShield(character, offHandItem);
          if (!isShieldProf) {
            const shieldMods = this.parseItemModifiers(offHandItem, (typeof masterDb !== 'undefined' ? masterDb : []), evalCtx);
            const shieldAcp = shieldMods ? shieldMods.acp : 0;
            if (shieldAcp < 0) {
              attackBonusItems.push({
                type: 'penalty',
                val: shieldAcp,
                source: `Non-Proficient Shield Penalty (${offHandItem.name} ACP ${shieldAcp})`
              });
            }
          }
        }
      }
    }

    // Fighting Defensively penalty (-4 to all attack rolls)
    const fightingDefensively = options.fightingDefensively !== undefined ? options.fightingDefensively : (character.tactical?.fightingDefensively || false);
    if (fightingDefensively) {
      attackBonusItems.push({ type: 'untyped', val: -4, source: 'Fighting Defensively Penalty' });
    }

    // Monkey Grip penalty: -2 on attack rolls when wielding an oversized weapon
    const hasMonkeyGrip = feats.some(f => f.includes('monkey grip'));
    const isOversizedWeapon = weapon.isOversized || weapon.oversized || (Array.isArray(weapon.tags) && weapon.tags.includes('oversized'));
    if (isOversizedWeapon && hasMonkeyGrip) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Monkey Grip (-2 Att)' });
    }

    // Flaw: Noncombatant (-2 Melee) & Flaw: Shaky (-2 Ranged)
    if (!isRangedWep && feats.some(f => f.includes('flaw: noncombatant') || f === 'noncombatant')) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Flaw: Noncombatant (-2 Melee)' });
    }
    if (isRangedWep && feats.some(f => f.includes('flaw: shaky') || f === 'shaky')) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Flaw: Shaky (-2 Ranged)' });
    }

    // Manyshot penalty: 2 arrows -> -2, 3 arrows -> -4, 4 arrows -> -6
    const effectiveManyshotArrows = isRangedWep && manyshot ? Math.min(4, Math.max(2, Number(optManyshotArrows || manyshot) || 2)) : 0;
    if (effectiveManyshotArrows > 0) {
      const penalty = (effectiveManyshotArrows - 1) * 2;
      attackBonusItems.push({ type: 'untyped', val: -penalty, source: `Manyshot (${effectiveManyshotArrows} Ok / -${penalty} Atk)` });
    }

    const isAtkTargetMatch = (t) => (
      t === 'attack' || t === 'attack.all' ||
      ((t === 'meleeattack' || t === 'attack.melee') && !isRangedWep) ||
      ((t === 'rangedattack' || t === 'attack.ranged') && isRangedWep)
    );
    const isDmgTargetMatch = (t) => (
      t === 'damage' || t === 'damage.all' ||
      ((t === 'meleedamage' || t === 'damage.melee') && !isRangedWep) ||
      ((t === 'rangeddamage' || t === 'damage.ranged') && isRangedWep)
    );

    // Weapon V2 Attack Modifiers & Enhancement Bonus
    const wepMods = Array.isArray(weapon.modifiers) ? weapon.modifiers : [];
    let hasExplicitWepAtkMod = false;
    wepMods.forEach(m => {
      if (!m || !m.target) return;
      const t = String(m.target).toLowerCase();
      if (isAtkTargetMatch(t)) {
        const val = Number(this.evaluateFormula(m.value !== undefined ? m.value : m.formula, evalCtx)) || 0;
        if (val !== 0) {
          attackBonusItems.push({ type: (m.type || 'enhancement').toLowerCase(), val, source: m.source || 'Weapon Enhancement' });
          hasExplicitWepAtkMod = true;
        }
      }
    });
    if (!hasExplicitWepAtkMod && Number(weapon.enhancementBonus) > 0) {
      attackBonusItems.push({ type: 'enhancement', val: Number(weapon.enhancementBonus), source: 'Weapon Enhancement' });
    } else if (!hasExplicitWepAtkMod && weapon.isMasterwork) {
      attackBonusItems.push({ type: 'enhancement', val: 1, source: 'Masterwork Weapon' });
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

    // External custom modifiers
    customModifiers.forEach(m => {
      if (!m) return;
      if (Array.isArray(m.modifiers)) {
        m.modifiers.forEach(mod => {
          const t = String(mod.target || '').toLowerCase();
          if (isAtkTargetMatch(t)) {
            const v = Number(this.evaluateFormula(mod.value !== undefined ? mod.value : mod.formula, evalCtx)) || 0;
            if (v !== 0) attackBonusItems.push({ type: mod.type || 'untyped', val: v, source: m.name });
          }
        });
      } else if (m.bonusAtk) {
        attackBonusItems.push({ type: m.bonusType || 'untyped', val: m.bonusAtk, source: m.name });
      }
    });

    // Active Buffs & Conditions V2 Attack Modifiers
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(rawBuff => {
        if (!rawBuff || !rawBuff.active) return;
        const b = this.ensureV2Entry(rawBuff);
        const bCtx = { ...evalCtx, cl: Number(b.casterLevel || charLvl) || charLvl };
        let appliedNegLvlAtk = false;
        if (Array.isArray(b.modifiers)) {
          b.modifiers.forEach(mod => {
            if (!mod || !mod.target) return;
            const t = String(mod.target).toLowerCase();
            if (isAtkTargetMatch(t)) {
              const val = Number(this.evaluateFormula(mod.value !== undefined ? mod.value : mod.formula, bCtx)) || 0;
              if (val !== 0) {
                attackBonusItems.push({
                  type: mod.type || (b.isDebuff || val < 0 ? 'penalty' : 'untyped'),
                  val,
                  source: b.name
                });
                if (b.negativeLevels && val < 0) appliedNegLvlAtk = true;
              }
            }
          });
        }
        if (b.negativeLevels && !appliedNegLvlAtk) {
          attackBonusItems.push({ type: 'penalty', val: -Number(b.negativeLevels), source: `${b.name} (-${b.negativeLevels} Lvl)` });
        }
      });
    }

    const netAttackBonus = this.resolveBonusStacking(attackBonusItems);

    // 2. Damage Calculation (RAW D&D 3.5e + Canonical V2 damageParts)
    const isLightWep = this.isLightWeapon(weapon);
    const isCrossbow = baseWepName.includes('crossbow');
    const isBow = baseWepName.includes('bow') && !isCrossbow;
    const isRapier = baseWepName.includes('rapier');

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
      if (strMod < 0) {
        baseStrDmg = strMod;
        strDesc = `STR Penalty (${strMod})`;
      } else if (isRapier) {
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

    // Weapon V2 Damage Modifiers & Enhancement Bonus
    let hasExplicitWepDmgMod = false;
    wepMods.forEach(m => {
      if (!m || !m.target) return;
      const t = String(m.target).toLowerCase();
      if (isDmgTargetMatch(t)) {
        const val = Number(this.evaluateFormula(m.value !== undefined ? m.value : m.formula, evalCtx)) || 0;
        if (val !== 0) {
          damageBonusItems.push({ type: (m.type || 'enhancement').toLowerCase(), val, source: m.source || 'Weapon Enhancement' });
          hasExplicitWepDmgMod = true;
        }
      }
    });
    if (!hasExplicitWepDmgMod && Number(weapon.enhancementBonus) > 0) {
      damageBonusItems.push({ type: 'enhancement', val: Number(weapon.enhancementBonus), source: 'Weapon Enhancement' });
    }

    if (hasWeaponSpec) {
      damageBonusItems.push({ type: 'untyped', val: 2, source: 'Weapon Specialization' });
    }
    if (hasGreaterWeaponSpec) {
      damageBonusItems.push({ type: 'untyped', val: 2, source: 'Greater Weapon Specialization' });
    }

    // External custom modifiers for damage
    customModifiers.forEach(m => {
      if (!m) return;
      if (Array.isArray(m.modifiers)) {
        m.modifiers.forEach(mod => {
          const t = String(mod.target || '').toLowerCase();
          if (isDmgTargetMatch(t)) {
            const v = Number(this.evaluateFormula(mod.value !== undefined ? mod.value : mod.formula, evalCtx)) || 0;
            if (v !== 0) damageBonusItems.push({ type: mod.type || 'untyped', val: v, source: m.name });
          }
        });
      } else if (m.bonusDmg) {
        damageBonusItems.push({ type: m.bonusType || 'untyped', val: m.bonusDmg, source: m.name });
      }
    });

    // Active Buffs & Conditions V2 Damage Modifiers
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(rawBuff => {
        if (!rawBuff || !rawBuff.active) return;
        const b = this.ensureV2Entry(rawBuff);
        const bCtx = { ...evalCtx, cl: Number(b.casterLevel || charLvl) || charLvl };
        if (Array.isArray(b.modifiers)) {
          b.modifiers.forEach(mod => {
            if (!mod || !mod.target) return;
            const t = String(mod.target).toLowerCase();
            if (isDmgTargetMatch(t)) {
              const val = Number(this.evaluateFormula(mod.value !== undefined ? mod.value : mod.formula, bCtx)) || 0;
              if (val !== 0) {
                damageBonusItems.push({
                  type: mod.type || (b.isDebuff || val < 0 ? 'penalty' : 'untyped'),
                  val,
                  source: b.name
                });
              }
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
      iteratives = [netAttackBonus];
    } else {
      if (bab >= 6) iteratives.push(netAttackBonus - 5);
      if (bab >= 11) iteratives.push(netAttackBonus - 10);
      if (bab >= 16) iteratives.push(netAttackBonus - 15);

      // Haste or extraAttackFullAttack ruleFlag grants 1 extra full attack at highest BAB
      const hasHaste = ruleFlags.extraAttackFullAttack || (character.buffs || []).some(b => b && b.active && (b.ruleFlags?.extraAttackFullAttack || (b.name || '').toLowerCase().includes('haste')));
      if (hasHaste) {
        iteratives.unshift(netAttackBonus);
      }
    }

    const chargeMultiplier = chargeData.multiplier || 1;
    const chargeFlatDamage = netFlatDamage * chargeMultiplier;

    // 3. Weapon Size Steps (Enlarge Person, Lead Blades, Greater Mighty Wallop, etc.)
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

    // 4. Structured V2 damageParts Evaluation (Base Weapon + Enhancements + Active Buff DamageParts)
    const rawParts = (Array.isArray(weapon.damageParts) && weapon.damageParts.length > 0)
      ? weapon.damageParts
      : (dbWeapon && Array.isArray(dbWeapon.damageParts) && dbWeapon.damageParts.length > 0
          ? dbWeapon.damageParts
          : [{ dice: '1d8', bonus: 0, type: 'Slashing', multiplyOnCrit: true, onCritOnly: false, source: 'Base Weapon' }]);

    const combinedRawParts = [...rawParts];

    // Append damageParts from active buffs (e.g. Sneak Attack, Hunter's Mercy, Arcane Wrath)
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(rawBuff => {
        if (!rawBuff || !rawBuff.active) return;
        const b = this.ensureV2Entry(rawBuff);
        if (Array.isArray(b.damageParts) && b.damageParts.length > 0) {
          b.damageParts.forEach(bp => {
            if (bp && bp.dice) {
              combinedRawParts.push({
                ...bp,
                source: bp.source || b.name
              });
            }
          });
        }
      });
    }

    const evaluatedDamageParts = combinedRawParts.map((part, idx) => {
      const isPrimary = idx === 0;
      const rawDiceStr = String(this.evaluateFormula(part.dice || '1d8', evalCtx) || part.dice || '1d8').trim();
      const steppedDice = (isPrimary && effectiveSteps !== 0)
        ? this.stepDamageDice(rawDiceStr, effectiveSteps)
        : rawDiceStr;
      const partBonus = isPrimary
        ? netFlatDamage
        : (Number(this.evaluateFormula(part.bonus || 0, evalCtx)) || 0);
      return {
        dice: steppedDice,
        rawDice: rawDiceStr,
        bonus: partBonus,
        type: part.type || 'Slashing',
        multiplyOnCrit: part.multiplyOnCrit !== undefined ? !!part.multiplyOnCrit : isPrimary,
        onCritOnly: !!part.onCritOnly,
        source: part.source || (isPrimary ? (weapon.name || 'Base Weapon') : 'Extra'),
        isPrimary
      };
    });

    const primaryPart = evaluatedDamageParts[0] || { dice: '1d8', rawDice: '1d8', bonus: netFlatDamage, type: 'Slashing' };
    const normalDamageParts = evaluatedDamageParts.filter(p => !p.onCritOnly);
    const extraDamageParts = normalDamageParts.slice(1);
    const critOnlyDamageParts = evaluatedDamageParts.filter(p => p.onCritOnly);

    // Build ready-to-roll 3D Dice Engine formulas (normal & critical)
    const primaryFormula = `${primaryPart.dice}${netFlatDamage !== 0 ? (netFlatDamage > 0 ? `+${netFlatDamage}` : `${netFlatDamage}`) : ''}`;
    const extraDiceTerms = extraDamageParts.map(p => `${p.dice}${p.bonus ? (p.bonus > 0 ? `+${p.bonus}` : `${p.bonus}`) : ''}`);
    const diceFormula = [primaryFormula, ...extraDiceTerms].join(' + ');

    const critMult = Math.max(2, Number(critData.critMult) || 2);
    const critTerms = [];
    for (let i = 0; i < critMult; i++) {
      critTerms.push(primaryFormula);
    }
    extraDamageParts.forEach(p => {
      const term = `${p.dice}${p.bonus ? (p.bonus > 0 ? `+${p.bonus}` : `${p.bonus}`) : ''}`;
      if (p.multiplyOnCrit) {
        for (let i = 0; i < critMult; i++) critTerms.push(term);
      } else {
        critTerms.push(term);
      }
    });
    critOnlyDamageParts.forEach(p => {
      critTerms.push(`${p.dice}${p.bonus ? (p.bonus > 0 ? `+${p.bonus}` : `${p.bonus}`) : ''}`);
    });
    const critDiceFormula = critTerms.join(' + ');

    return {
      netAttackBonus,
      iteratives,
      attackStatName,
      attackStatMod,
      effectivePA,
      rawBaseDice: primaryPart.rawDice,
      baseDice: primaryPart.dice,
      effectiveDice: primaryPart.dice,
      sizeSteps: effectiveSteps,
      sizeBuffSources,
      netFlatDamage,
      damageParts: evaluatedDamageParts,
      normalDamageParts,
      extraDamageParts,
      critOnlyDamageParts,
      diceFormula,
      critDiceFormula,
      modes,
      activeMode,
      activeModeId: activeMode ? activeMode.id : null,
      tacticalBadges: Array.isArray(weapon.tacticalBadges) ? weapon.tacticalBadges : [],
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
      damageType: primaryPart.type || 'Slashing',
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

  // Canonical Consolidated Skill Mappings (Bridge between RAW 3.5e skills and Consolidated groups)
  DEFAULT_SKILL_MAPPING: {
    "stealth": ["hide", "move_silently", "move silently", "movesilently", "sessiz hareket", "gizlenme"],
    "perception": ["spot", "listen", "search", "fark etme", "dinleme", "arama"],
    "athletics": ["climb", "jump", "swim", "tırmanma", "zıplama", "yüzme"],
    "acrobatics": ["tumble", "balance", "escape_artist", "escape artist", "takla", "denge", "kurtulma"],
    "thievery": ["disable_device", "disable device", "open_lock", "open lock", "sleight_of_hand", "sleight of hand", "kilit açma", "tuzak bozma"],
    "diplomacy": ["diplomacy", "gather_information", "gather information", "sense_motive", "sense motive", "diplomasi", "bilgi toplama", "sezgi"],
    "linguistics": ["decipher_script", "decipher script", "forgery", "speak_language", "speak language", "yazı çözme", "sahtecilik"]
  },

  getSkillAliases(sKey, sName, character) {
    const aliases = new Set();
    const kNorm = (sKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nNorm = (sName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (kNorm) aliases.add(kNorm);
    if (nNorm) aliases.add(nNorm);

    const isMerged = character?.settings?.mergeSkills !== false;
    if (isMerged) {
      let mapping = null;
      const masterList = (typeof window !== 'undefined' && (window.masterDb || window.BUNDLED_MASTER_DB)) || [];
      if (Array.isArray(masterList)) {
        const ruleObj = masterList.find(m => m && (m.name || '').toLowerCase().includes('skilleri birleştir') || (m.name || '').toLowerCase().includes('skill consolidation'));
        if (ruleObj && ruleObj.skillMapping && typeof ruleObj.skillMapping === 'object') {
          mapping = ruleObj.skillMapping;
        }
      }

      if (!mapping) {
        mapping = character?.settings?.skillMapping || this.DEFAULT_SKILL_MAPPING;
      }

      if (mapping) {
        for (const [groupKey, comps] of Object.entries(mapping)) {
          const gNorm = groupKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (gNorm === kNorm || kNorm.includes(gNorm) || gNorm.includes(kNorm) || nNorm.includes(gNorm) || gNorm.includes(nNorm)) {
            if (Array.isArray(comps)) {
              comps.forEach(c => {
                const cNorm = String(c).toLowerCase().replace(/[^a-z0-9]/g, '');
                if (cNorm) aliases.add(cNorm);
              });
            }
          }
        }
      }
    }

    return Array.from(aliases);
  },

  /**
   * Evaluate specific skill bonus from equipped items, active buffs, feats, and race (Canonical V2 `modifiers` array).
   * Resolves D&D 3.5e stacking rules: same bonus types do not stack (take highest),
   * while different bonus types (Competence, Insight, Luck, Morale, Circumstance, Untyped, Racial) stack.
   * Zero heuristic description regexes.
   */
  evaluateSkillBonus(character, skillKey, skillName, statName) {
    if (!character) return { total: 0, breakdown: [] };
    const sName = (skillName || '').toLowerCase().trim();
    const sKey = (skillKey || '').toLowerCase().trim();
    const isKnowledge = sName.startsWith('knowledge') || sKey.startsWith('knowledge') || sName.includes('bilgi');
    const aliases = this.getSkillAliases(sKey, sName, character);
    const charLvl = Number(character.level) || 1;
    const evalCtx = { cl: charLvl, level: charLvl, bab: Number(character.bab) || 0 };

    const buckets = {};
    const addBonus = (sourceName, val, bType = 'untyped') => {
      const v = Number(val) || 0;
      if (v === 0) return;
      const type = (bType || 'untyped').toLowerCase().trim();
      if (!buckets[type]) buckets[type] = [];
      buckets[type].push({ name: sourceName, val: v });
    };

    // Helper to check if a V2 modifier target matches this skill
    const matchSkillModifiers = (modifiers, sourceTitle, defaultType = 'competence', ctx = evalCtx) => {
      if (!Array.isArray(modifiers)) return false;
      let matched = false;
      const baseKeyNorm = sKey.replace(/[^a-z0-9]/g, '');

      modifiers.forEach(mod => {
        if (!mod || !mod.target) return;
        const rawTarget = String(mod.target).trim().toLowerCase();
        if (!rawTarget.startsWith('skill.') && !rawTarget.startsWith('skills.') && rawTarget !== 'skills') return;

        const subTarget = rawTarget.replace(/^skills?\./, '').trim();
        const tNorm = subTarget.replace(/[^a-z0-9]/g, '');
        const val = Number(this.evaluateFormula(mod.value !== undefined ? mod.value : mod.formula, ctx)) || 0;
        if (val === 0) return;
        const mType = mod.type || (val < 0 ? 'penalty' : defaultType);

        let applies = false;
        if (subTarget === 'all' || subTarget === 'skills' || tNorm === 'allskills') {
          applies = true;
        } else if (isKnowledge && (subTarget === 'knowledge' || tNorm === 'allknowledge' || tNorm.includes('knowledge'))) {
          applies = true;
        } else if (tNorm && aliases.some(a => a && (a === tNorm || a.includes(tNorm) || tNorm.includes(a)))) {
          applies = true;
        }

        if (applies) {
          const label = (tNorm && tNorm !== 'all' && tNorm !== baseKeyNorm)
            ? `${sourceTitle} (${subTarget.replace(/_/g, ' ')})`
            : sourceTitle;
          addBonus(label, val, mType);
          matched = true;
        }
      });

      return matched;
    };

    // 1. Negative Level Skill Penalties (if any active buff has negativeLevels without explicit skill.all modifier)
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(rawBuff => {
        if (!rawBuff || !rawBuff.active) return;
        const buff = this.ensureV2Entry(rawBuff);
        const bCtx = { ...evalCtx, cl: Number(buff.casterLevel || charLvl) || charLvl };
        const hasSkillAllMod = matchSkillModifiers(buff.modifiers, buff.name || 'Buff', 'untyped', bCtx);
        if (buff.negativeLevels && !hasSkillAllMod) {
          addBonus(`${buff.name} (-${buff.negativeLevels} Lvl)`, -Number(buff.negativeLevels), 'penalty');
        }
      });
    }

    // 2. Body Slot Equipped Items (character.bodySlots)
    if (character.bodySlots && typeof character.bodySlots === 'object') {
      Object.entries(character.bodySlots).forEach(([slotKey, item]) => {
        if (!item || item.active === false || !item.name || item.name === '-') return;
        this._checkItemSkillBonus(item, sKey, sName, isKnowledge, addBonus, character, aliases);
      });
    }

    // 3. Gear Pool Items (Equipped or Slotless Wondrous Items)
    if (Array.isArray(character.gearPool)) {
      character.gearPool.forEach(item => {
        if (!item || !item.name) return;
        const inBodySlot = character.bodySlots && Object.values(character.bodySlots).some(s => s && s.active !== false && (s.id === item.id || s.name === item.name));
        if (inBodySlot) return;
        const isSlotless = (item.slot || '').toLowerCase().includes('slotless') || (item.category || '').toLowerCase() === 'other' || (item.category || '').toLowerCase() === 'wondrous item';
        if (item.isEquipped || isSlotless) {
          this._checkItemSkillBonus(item, sKey, sName, isKnowledge, addBonus, character, aliases);
        }
      });
    }

    // 4. Feats & Special Abilities (Canonical V2 modifiers + Compendium lookup)
    const featsList = [...(character.feats || []), ...(character.specialAbilities || [])];
    featsList.forEach(rawFeat => {
      if (!rawFeat) return;
      const featObj = typeof rawFeat === 'string' ? { name: rawFeat, category: 'Feat' } : this.ensureV2Entry(rawFeat);
      const fName = (featObj.name || '').trim();
      if (!fName) return;

      const dbFeat = this.getMasterDbEntry(featObj) || this.getMasterDbEntry(fName);
      const mods = (Array.isArray(featObj.modifiers) && featObj.modifiers.length > 0)
        ? featObj.modifiers
        : (dbFeat && Array.isArray(dbFeat.modifiers) ? dbFeat.modifiers : []);

      matchSkillModifiers(mods, fName, 'untyped', evalCtx);

      if (fName.toLowerCase().includes('collector of stories') && isKnowledge) {
        addBonus('Collector of Stories (Canavar Tanıma)', 5, 'competence');
      }
    });

    // 5. Racial Skill Modifiers from Compendium Race entry
    if (character.race) {
      const raceObj = this.getMasterDbEntry(character.race, 'Race');
      if (raceObj && Array.isArray(raceObj.modifiers)) {
        matchSkillModifiers(raceObj.modifiers, `${raceObj.name || character.race} (Irk)`, 'racial', evalCtx);
      }
    }

    // 6. Resolve Stacking Rules (D&D 3.5e RAW)
    let total = 0;
    const breakdown = [];

    Object.entries(buckets).forEach(([type, entries]) => {
      if (type === 'untyped' || type === 'circumstance' || type === 'penalty' || type === 'racial') {
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

  _checkItemSkillBonus(rawItem, sKey, sName, isKnowledge, addBonus, character = null, aliases = null) {
    if (!rawItem) return;
    const item = this.ensureV2Entry(rawItem);
    const skillAliases = aliases || this.getSkillAliases(sKey, sName, character);
    const baseKeyNorm = (sKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const charLvl = Number(character?.level) || 1;
    const evalCtx = { cl: charLvl, level: charLvl };

    const processV2SkillMods = (sourceObj, sourceTitle) => {
      if (!sourceObj || !Array.isArray(sourceObj.modifiers)) return false;
      let applied = false;
      sourceObj.modifiers.forEach(mod => {
        if (!mod || !mod.target) return;
        const rawTarget = String(mod.target).trim().toLowerCase();
        if (!rawTarget.startsWith('skill.') && !rawTarget.startsWith('skills.') && rawTarget !== 'skills') return;

        const subTarget = rawTarget.replace(/^skills?\./, '').trim();
        const tNorm = subTarget.replace(/[^a-z0-9]/g, '');
        const val = Number(this.evaluateFormula(mod.value !== undefined ? mod.value : mod.formula, evalCtx)) || 0;
        if (val === 0) return;
        const bType = mod.type || 'competence';

        let applies = false;
        if (subTarget === 'all' || subTarget === 'skills' || tNorm === 'allskills') applies = true;
        else if (isKnowledge && (subTarget === 'knowledge' || tNorm === 'allknowledge' || tNorm.includes('knowledge'))) applies = true;
        else if (tNorm && skillAliases.some(a => a && (a === tNorm || a.includes(tNorm) || tNorm.includes(a)))) applies = true;

        if (applies) {
          const label = (tNorm && tNorm !== 'all' && tNorm !== baseKeyNorm)
            ? `${sourceTitle} (${subTarget.replace(/_/g, ' ')})`
            : sourceTitle;
          addBonus(label, val, bType);
          applied = true;
        }
      });
      return applied;
    };

    // 1. Check V2 modifiers on item itself
    let itemHandled = processV2SkillMods(item, item.name || 'Equipped Item');

    // 2. Check matching gearPool item
    if (!itemHandled && character && Array.isArray(character.gearPool)) {
      const pItem = character.gearPool.find(p => p && ((item.id && p.id === item.id) || (p.name && p.name.toLowerCase().trim() === (item.name || '').toLowerCase().trim())));
      if (pItem) {
        itemHandled = processV2SkillMods(this.ensureV2Entry(pItem), item.name || pItem.name);
      }
    }

    // 3. Check Compendium / Master DB entry via O(1) lookup
    if (!itemHandled) {
      const dbEntry = this.getMasterDbEntry(item);
      if (dbEntry) {
        processV2SkillMods(dbEntry, item.name || dbEntry.name);
      }
    }
  },

  // D&D 3.5e Class Definitions with Base Stats & Class Features by Level
  DND35_CLASS_DEFS: {
    "Warblade": {
      hd: 12, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 4,
      bonusFeatLevels: [5, 9, 13, 17],
      bonusFeatContract: {
        mode: "exact_choices",
        choices: [
          "Blind-Fight", "Combat Reflexes", "Diehard", "Great Fortitude",
          "Improved Critical", "Improved Initiative", "Iron Will", "Ironheart Aura",
          "Lightning Reflexes", "Stone Power", "Tiger Blooded", "Unnerving Calm", "White Raven Defense"
        ],
        label: "Warblade Bonus Feati"
      },
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
      bonusFeatContract: { mode: "tag", tag: "isFighterBonusFeat", label: "Fighter SÄ±nÄ±f Bonus Feati", filter: "FIGHTER" },
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
      bonusFeatContracts: {
        1: { mode: "exact_choices", choices: ["Scribe Scroll"], bypassPrereqs: true, label: "Wizard 1. Seviye SeÃ§imi" },
        5: { mode: "category", categories: ["Metamagic", "Item Creation"], allowFeats: ["Spell Mastery"], label: "Wizard Bonus Feati" },
        10: { mode: "category", categories: ["Metamagic", "Item Creation"], allowFeats: ["Spell Mastery"], label: "Wizard Bonus Feati" },
        15: { mode: "category", categories: ["Metamagic", "Item Creation"], allowFeats: ["Spell Mastery"], label: "Wizard Bonus Feati" },
        20: { mode: "category", categories: ["Metamagic", "Item Creation"], allowFeats: ["Spell Mastery"], label: "Wizard Bonus Feati" }
      },
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
      bonusFeatContracts: {
        1: { mode: "exact_choices", choices: ["Improved Grapple", "Stunning Fist"], bypassPrereqs: true, label: "Monk 1. Seviye SeÃ§imi" },
        2: { mode: "exact_choices", choices: ["Combat Reflexes", "Deflect Arrows"], bypassPrereqs: true, label: "Monk 2. Seviye SeÃ§imi" },
        6: { mode: "exact_choices", choices: ["Improved Trip", "Snatch Arrows"], bypassPrereqs: true, label: "Monk 6. Seviye SeÃ§imi" }
      },
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
      hd: 10, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 4,
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
      hd: 12, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 4,
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

  // Get slot contract for bonus feats
  getClassBonusFeatContract(className, classLevel) {
    const def = this.DND35_CLASS_DEFS ? this.DND35_CLASS_DEFS[className] : null;
    if (!def) return null;
    const cl = Number(classLevel) || 1;
    if (def.bonusFeatContracts && def.bonusFeatContracts[cl]) return def.bonusFeatContracts[cl];
    if (def.bonusFeatContract) return def.bonusFeatContract;
    return null;
  },

  // Get granted class features, bonus feats and Slot Contract for a given class and level
  getClassLevelFeatures(className, classLevel) {
    const def = this.DND35_CLASS_DEFS ? this.DND35_CLASS_DEFS[className] : null;
    if (!def) return { features: [], featureObjects: [], hasBonusFeat: false, bonusFeatContract: null };
    const cl = Number(classLevel) || 1;
    const rawFeatures = (def.features && def.features[cl]) ? def.features[cl] : [];
    const features = rawFeatures.map(f => (typeof f === 'string' ? f : f.name));
    const featureObjects = rawFeatures.map(f => (typeof f === 'string' ? { name: f, benefit: '' } : f));
    const hasBonusFeat = Array.isArray(def.bonusFeatLevels) && def.bonusFeatLevels.includes(cl);

    let bonusFeatContract = null;
    if (hasBonusFeat) {
      bonusFeatContract = this.getClassBonusFeatContract(className, cl);
      if (!bonusFeatContract) {
        if (className === 'Fighter') {
          bonusFeatContract = {
            mode: 'tag',
            tag: 'isFighterBonusFeat',
            filter: 'FIGHTER',
            label: `Fighter SÄ±nÄ±f Bonus Feati (${cl}. Seviye)`,
            desc: 'Fighter sÄ±nÄ±f bonus listesinde yer alan bir muharebe hÃ¼neri seÃ§in.'
          };
        } else {
          bonusFeatContract = {
            mode: 'tag',
            tag: 'isFighterBonusFeat',
            filter: 'FIGHTER',
            label: `${className} SÄ±nÄ±f Bonus Feati`,
            desc: `${className} sÄ±nÄ±fÄ± iÃ§in geÃ§erli bonus hÃ¼ner.`
          };
        }
      }
    }

    return { features, featureObjects, hasBonusFeat, bonusFeatContract };
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
  },

  // D&D 3.5e PHB Table 1-1 Bonus Spells & Class Spells Per Day Calculator (Canonical V2)
  getClassSpellSlots(className, classLevel = 1, abilityScore = 10) {
    const cl = Math.max(1, Math.min(20, Number(classLevel) || 1));
    const score = Number(abilityScore) || 10;
    const mod = this.getAbilityMod(score);

    const classEntry = this.getMasterDbEntry(className, 'Class')
      || this.getMasterDbEntry(`class_${String(className || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, 'Class');

    const rawMatrix = classEntry?.classStats?.spellsPerDay || classEntry?.spellsPerDay || null;
    const baseRow = (rawMatrix && typeof rawMatrix === 'object')
      ? (rawMatrix[String(cl)] || rawMatrix[cl] || null)
      : null;

    const slotsByLevel = {};
    if (!baseRow || typeof baseRow !== 'object') {
      return {
        hasSpellcasting: false,
        className,
        classLevel: cl,
        abilityScore: score,
        abilityMod: mod,
        slotsByLevel
      };
    }

    Object.entries(baseRow).forEach(([lvlKey, baseSlots]) => {
      const sLvl = Number(lvlKey);
      if (isNaN(sLvl) || baseSlots === null || baseSlots === undefined || baseSlots === '-') return;
      const baseCount = Number(baseSlots);
      if (isNaN(baseCount) || baseCount < 0) return;

      // PHB p. 17: To cast a spell of level X, caster must have ability score >= 10 + X
      const canCastLevel = score >= (10 + sLvl);
      if (!canCastLevel) {
        slotsByLevel[sLvl] = { base: baseCount, bonus: 0, total: 0, lockedByAbilityScore: true };
        return;
      }

      // PHB Table 1-1: Bonus spells for spell levels 1–9 (0-level cantrips/orisons never get bonus spells)
      let bonusSlots = 0;
      if (sLvl >= 1 && mod >= sLvl) {
        // Only grant bonus spells if base slots > 0 (or if baseSlots === 0 for Rangers/Paladins who gain 0+bonus)
        bonusSlots = Math.floor((mod - sLvl + 4) / 4);
      }

      slotsByLevel[sLvl] = {
        base: baseCount,
        bonus: bonusSlots,
        total: baseCount + bonusSlots,
        lockedByAbilityScore: false
      };
    });

    return {
      hasSpellcasting: Object.keys(slotsByLevel).length > 0,
      className: classEntry?.name || className,
      classLevel: cl,
      abilityScore: score,
      abilityMod: mod,
      slotsByLevel
    };
  },

  // D&D 3.5e 8-Hour Long Rest & Daily Resource Recovery Engine (PHB p. 146 & p. 177)
  performLongRest(character, options = {}) {
    if (!character) return null;
    const fullBedRest = !!options.fullBedRest; // 24-hour full bed rest heals 2x level
    const healToFull = !!options.healToFull;   // Optional DM house rule toggle
    const charLvl = Math.max(1, Number(character.level) || 1);

    const summary = {
      hpHealed: 0,
      newHp: 0,
      maxHp: 0,
      spellsReset: 0,
      dailyChargesReset: 0,
      expiredBuffsDeactivated: []
    };

    // 1. Natural HP Healing (1 HP per character level per 8-hour rest, or 2 HP/lvl for full bed rest)
    if (character.hp) {
      const maxHp = Number(character.hp.max) || 10;
      const curHp = Number(character.hp.current) || 0;
      const healAmount = healToFull ? Math.max(0, maxHp - curHp) : (fullBedRest ? charLvl * 2 : charLvl);
      const nextHp = Math.min(maxHp, curHp + healAmount);
      summary.hpHealed = Math.max(0, nextHp - curHp);
      character.hp.current = nextHp;
      character.hp.temp = 0; // Temporary HP from short buffs expires overnight
      summary.newHp = nextHp;
      summary.maxHp = maxHp;
    }

    // 2. Deactivate Short-Duration Buffs (round, minute, hour); keep permanent/day/condition until manually cleared
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(b => {
        if (!b || !b.active) return;
        const durCat = String(b.durationCategory || '').toLowerCase();
        const isShortBuff = !b.isCondition && !b.isDebuff && (durCat === 'round' || durCat === 'minute' || durCat === 'hour');
        // Fatigue converts to normal after 8 hours of complete rest; Exhausted becomes Fatigued after 1 hour
        if (b.id === 'cond_fatigued' || (b.name || '').toLowerCase().includes('fatigued')) {
          b.active = false;
          summary.expiredBuffsDeactivated.push(b.name);
        } else if (isShortBuff) {
          b.active = false;
          summary.expiredBuffsDeactivated.push(b.name);
        }
      });
    }

    // 3. Reset Daily Spell Slots / Cast Counts & Martial Maneuvers
    if (Array.isArray(character.spells)) {
      character.spells.forEach(s => {
        if (!s) return;
        if (s.castCount) {
          s.castCount = 0;
          summary.spellsReset++;
        }
        if (s.expended) {
          s.expended = false;
          summary.spellsReset++;
        }
        if (s.usedSlots) {
          s.usedSlots = 0;
          summary.spellsReset++;
        }
      });
    }
    if (character.spellSlots && typeof character.spellSlots === 'object') {
      Object.values(character.spellSlots).forEach(slotObj => {
        if (slotObj && typeof slotObj === 'object') {
          if (slotObj.used !== undefined) slotObj.used = 0;
          if (slotObj.current !== undefined && slotObj.max !== undefined) slotObj.current = slotObj.max;
        }
      });
    }

    // 4. Reset Daily Charges on Special Abilities, Feats & Equipped Items
    const resetChargeList = (list) => {
      if (!Array.isArray(list)) return;
      list.forEach(entry => {
        if (!entry || typeof entry !== 'object') return;
        if (entry.maxCharges && entry.charges !== undefined && entry.rechargePeriod !== 'never') {
          entry.charges = entry.maxCharges;
          summary.dailyChargesReset++;
        }
        if (entry.usesPerDay && entry.usedToday !== undefined) {
          entry.usedToday = 0;
          summary.dailyChargesReset++;
        }
      });
    };
    resetChargeList(character.specialAbilities);
    resetChargeList(character.feats);
    resetChargeList(character.gearPool);
    if (character.bodySlots && typeof character.bodySlots === 'object') {
      resetChargeList(Object.values(character.bodySlots));
    }

    // 5. Reset Tactical Action Economy
    if (character.tactical) {
      character.tactical.spentActions = {
        standard: false,
        move: false,
        fullRound: false,
        swift: false,
        immediate: false
      };
    }

    // 6. Recalculate Character State
    this.recalculateCharacter(character, (typeof masterDb !== 'undefined' ? masterDb : []));
    return summary;
  }
};

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RuleEngine;
} else if (typeof window !== 'undefined') {
  window.RuleEngine = RuleEngine;
}
