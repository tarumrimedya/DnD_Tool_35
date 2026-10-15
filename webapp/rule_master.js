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
      name: "Core 3.5e SRD (d20srd & dndsrd)",
      scope: "PHB, DMG, MM Core Kuralları, Featler, Büyüler, Eşyalar",
      url: "https://www.d20srd.org/index.html",
      mirror: "http://dndsrd.net",
      type: "Temiz HTML",
      status: "Aktif",
      role: "İlk taranacak temel kural kaynağı"
    },
    {
      priority: 2,
      name: "Foundry VTT D35E Packs (Rughalt)",
      scope: "Yapılandırılmış JSON: Eşyalar, büyüler, manevralar, hasar mekanikleri",
      url: "https://github.com/Rughalt/D35E/tree/master/packs",
      type: "Yapılandırılmış JSON",
      status: "Aktif",
      role: "Mekanik ayrıştırma (dice, DC, duration) için referans veri"
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

  // Default Item Schema (29 fields)
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
      duration: 'Continuous',
      weight: 1,
      cost: 10,
      role: 'Offense / Attack',
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
        dmgType: 'Slashing'
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

    if (editIndex >= 0 && editIndex < masterDb.length) {
      masterDb[editIndex] = entryData;
    } else {
      masterDb.push(entryData);
    }

    // Persist and sync
    if (typeof saveStateToStorage === 'function') {
      saveStateToStorage(true);
    }
    this.renderTable();
    return true;
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
      const child = this.createEmptyEntry('Active Power');
      child.name = `↳ ${parentItem.name}: Özel Güç`;
      child.parent = parentItem.name;
      child.slot = parentItem.slot;
      child.source = parentItem.source;
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
    const type = (item.type || '').toLowerCase();

    if (type === 'weapon') {
      if (!character.weapons) character.weapons = [];
      const newWep = {
        name: item.name,
        grip: item.slot === 'Main Hand' ? '1-Hand' : '2-Hand',
        dice: item.dice || item.extraDmg || '1d8',
        critMin: item.critMin || 20,
        critMult: item.critMult || 2,
        attBonus: Number(item.attBonus) || 0,
        dmgBonus: Number(item.dmgBonus) || 0,
        dmgType: item.dmgType || 'Slashing',
        bonusType: item.bonusType || 'Enhancement',
        tags: item.tags || []
      };
      character.weapons.push(newWep);
      character.activeWeapon = item.name;

      // Also ensure item is added to gearPool
      if (!character.gearPool) character.gearPool = [];
      const inPool = character.gearPool.some(p => (p.name || '').toLowerCase() === item.name.toLowerCase());
      if (!inPool) {
        character.gearPool.push({
          id: Date.now(),
          name: item.name,
          category: 'Weapon',
          slot: item.slot || 'Main Hand',
          qty: 1,
          weight: Number(item.weight) || 1,
          cost: Number(item.cost) || 10,
          desc: item.benefit || item.description || '',
          isBelt: false,
          isEquipped: true
        });
      }
      alert(`⚔️ "${item.name}" silahı aktif silahlarınıza ve çantanıza eklendi!`);
    } else if (type === 'spell') {
      if (!character.spellcasting) character.spellcasting = { slots: [], knownSpells: [] };
      if (!character.spellcasting.knownSpells) character.spellcasting.knownSpells = [];
      character.spellcasting.knownSpells.push({
        level: Number(item.level) || 1,
        name: item.name,
        school: item.school || 'Universal',
        action: item.action || 'Standard Action',
        range: item.range || 'Close',
        benefit: item.benefit || ''
      });
      alert(`🔮 "${item.name}" büyüsü karakterin bilinen büyülerine (Spells Known) eklendi!`);
    } else if (type === 'maneuver') {
      if (!character.tomeOfBattle) character.tomeOfBattle = { initiatorLevel: 1, readiedManeuvers: [], stancesKnown: [] };
      if (!character.tomeOfBattle.readiedManeuvers) character.tomeOfBattle.readiedManeuvers = [];
      character.tomeOfBattle.readiedManeuvers.push({
        name: item.name,
        level: Number(item.level) || 1,
        discipline: item.discipline || 'Iron Heart',
        action: item.action || 'Standard Action',
        expended: false,
        notes: item.benefit || ''
      });
      alert(`⚔️ "${item.name}" manevrası kuşanılan manevralara (Readied Maneuvers) eklendi!`);
    } else if (type === 'stance') {
      if (!character.tomeOfBattle) character.tomeOfBattle = { initiatorLevel: 1, readiedManeuvers: [], stancesKnown: [] };
      if (!character.tomeOfBattle.stancesKnown) character.tomeOfBattle.stancesKnown = [];
      character.tomeOfBattle.stancesKnown.push({
        name: item.name,
        discipline: item.discipline || 'Shadow Hand',
        level: Number(item.level) || 1,
        benefit: item.benefit || ''
      });
      character.activeStance = item.name;
      alert(`⚡ "${item.name}" duruşu (Stance) bilinen duruşlara eklendi ve aktif duruş yapıldı!`);
    } else if (type === 'feat') {
      if (!character.feats) character.feats = [];
      character.feats.push(item.name);
      alert(`✨ "${item.name}" hüneri (Feat) karaktere eklendi!`);
    } else if (type === 'potion') {
      if (!character.consumables) character.consumables = [];
      character.consumables.push({
        name: item.name,
        qty: 1,
        effect: item.benefit || 'Potion effect'
      });
      // Also ensure in gearPool
      if (!character.gearPool) character.gearPool = [];
      const inPool = character.gearPool.some(p => (p.name || '').toLowerCase() === item.name.toLowerCase());
      if (!inPool) {
        character.gearPool.push({
          id: Date.now(),
          name: item.name,
          category: 'Consumable',
          slot: 'Belt',
          qty: 1,
          weight: Number(item.weight) || 0.1,
          cost: Number(item.cost) || 50,
          desc: item.benefit || item.description || '',
          isBelt: true,
          isEquipped: false
        });
      }
      alert(`🧪 "${item.name}" iksiri çantanıza ve kemerinize eklendi!`);
    } else {
      if (!character.gearPool) character.gearPool = [];
      const cat = typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(item) : (item.type || 'Other');
      const isBelt = (item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable';
      const newPoolItem = {
        id: Date.now(),
        name: item.name,
        category: cat,
        slot: item.slot || cat,
        qty: 1,
        weight: Number(item.weight) || 1,
        cost: Number(item.cost) || 10,
        desc: item.benefit || item.description || '',
        isBelt: isBelt,
        isEquipped: false
      };
      character.gearPool.push(newPoolItem);
      alert(`🎒 "${item.name}" eşyası çantanıza / envanter havuzunuza eklendi!`);
    }

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    if (typeof renderAll === 'function') renderAll();
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
      category: cat,
      slot: item.slot && item.slot !== 'None' ? item.slot : cat,
      qty: 1,
      weight: Number(item.weight) || 0,
      cost: Number(item.cost) || 0,
      desc: item.benefit || item.description || '',
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

  // Open Edit / Add Modal
  openModalWithData(entry, editIndex = -1) {
    this.selectedEntryIndex = editIndex;
    const modal = document.getElementById('rule-crud-modal');
    if (!modal) return;

    // Title
    document.getElementById('rule-modal-title').textContent = editIndex >= 0 ? `✏️ Düzenle: ${entry.name}` : '➕ Yeni Kural / Eşya Ekle';

    // Populate fields
    document.getElementById('rf-name').value = entry.name || '';
    document.getElementById('rf-type').value = entry.type || 'Weapon';
    document.getElementById('rf-slot').value = entry.slot || 'None';
    document.getElementById('rf-parent').value = entry.parent || '-';
    document.getElementById('rf-prereq').value = entry.prereq || '-';
    document.getElementById('rf-source').value = entry.source || 'PHB p.';
    document.getElementById('rf-benefit').value = entry.benefit || '';
    document.getElementById('rf-bonus-type').value = entry.bonusType || 'Untyped';
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

    modal.classList.remove('hidden');
  },

  // Save Modal Action
  submitModal() {
    const entry = {
      name: document.getElementById('rf-name').value.trim(),
      type: document.getElementById('rf-type').value,
      slot: document.getElementById('rf-slot').value,
      parent: document.getElementById('rf-parent').value.trim() || '-',
      prereq: document.getElementById('rf-prereq').value.trim() || '-',
      source: document.getElementById('rf-source').value.trim() || 'PHB p.',
      benefit: document.getElementById('rf-benefit').value.trim(),
      bonusType: document.getElementById('rf-bonus-type').value,
      scope: document.getElementById('rf-scope').value,
      role: document.getElementById('rf-role').value,

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
      dmgType: document.getElementById('rf-dmg-type').value.trim(),
      action: document.getElementById('rf-action').value,
      duration: document.getElementById('rf-duration').value.trim(),
      weight: Number(document.getElementById('rf-weight').value) || 0,
      cost: Number(document.getElementById('rf-cost').value) || 0,

      // Specifics
      school: document.getElementById('rf-school').value.trim(),
      level: document.getElementById('rf-level').value ? Number(document.getElementById('rf-level').value) : '',
      discipline: document.getElementById('rf-discipline').value.trim()
    };

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

    // Update count badge
    const countBadge = document.getElementById('mdb-total-count-badge');
    if (countBadge) countBadge.textContent = `${filtered.length} / ${masterDb.length} Kayıt`;

    tbody.innerHTML = '';

    filtered.forEach(item => {
      const idx = item._originalIndex;
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/50 transition border-b border-slate-800/80';

      const isChild = item.parent && item.parent !== '-' && item.parent !== '';
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
        <td class="py-2.5 px-3">
          <div class="font-bold text-white flex items-center gap-1.5 flex-wrap">
            <span>${item.name}</span>
            ${isChild ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800">↳ Parent: ${item.parent}</span>` : ''}
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">${item.source || 'PHB'}</div>
        </td>
        <td class="py-2.5 px-3">
          <span class="badge ${typeBadgeClass}">${item.type}</span>
          ${item.discipline ? `<span class="badge bg-rose-950 text-rose-300 border border-rose-800 block mt-1 w-max">${item.discipline}</span>` : ''}
        </td>
        <td class="py-2.5 px-3 text-slate-300 text-xs">
          <div>${item.slot || 'None'}</div>
          ${item.level !== undefined && item.level !== '' ? `<div class="text-[10px] text-amber-400 font-bold">${item.level}. Seviye</div>` : ''}
        </td>
        <td class="py-2.5 px-3">
          <div class="text-xs font-semibold text-amber-300">${item.bonusType || 'Untyped'}</div>
          <div class="text-[10px] text-slate-400">${item.scope || 'General'}</div>
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
            <button onclick="RuleMaster.equipToCharacter(${idx})" class="p-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs transition" title="Karaktere Ekle / Kuşan">
              ⚡
            </button>
            <button onclick="RuleMaster.addToInventory(${idx})" class="p-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 text-xs transition" title="Çantaya / Envantere Ekle">
              🎒
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
    this.renderTable();
    this.updateApiKeyUi();
  },

  // ====================================================
  // GEMINI AI RULE IMPORTER (DYNAMIC MODEL AUTO-DISCOVERY)
  // ====================================================
  lastAiResults: [],
  _cachedModels: null,

  async getAvailableGeminiModels(apiKey) {
    if (this._cachedModels && this._cachedModels.length > 0) {
      return this._cachedModels;
    }
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
      if (resp.ok) {
        const data = await resp.json();
        const available = (data.models || [])
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''));

        // Preferred order of modern non-deprecated flash models:
        const candidatePreferences = [
          'gemini-3.5-flash-lite',
          'gemini-2.5-flash',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-flash-latest',
          'gemini-flash-lite-latest',
          'gemini-1.5-flash-8b',
          'gemini-2.5-pro',
          'gemini-1.5-pro'
        ];

        const selected = [];
        for (const pref of candidatePreferences) {
          if (available.includes(pref)) selected.push(pref);
        }
        for (const m of available) {
          if (!selected.includes(m) && m.includes('flash')) selected.push(m);
        }
        for (const m of available) {
          if (!selected.includes(m)) selected.push(m);
        }

        if (selected.length > 0) {
          this._cachedModels = selected;
          return selected;
        }
      }
    } catch (e) {
      console.warn('Could not query dynamic Gemini models list:', e);
    }

    // Default safe fallback if list request fails
    return [
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest'
    ];
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
  },

  updateApiKeyUi() {
    const key = this.getApiKey();
    const statusContainer = document.getElementById('ai-api-key-status');
    const inputContainer = document.getElementById('ai-api-key-input-container');
    const keyDisplay = document.getElementById('ai-api-key-display');
    const keyInput = document.getElementById('ai-api-key-input');

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

  async fetchSingleAiRuleRows(query, categoryHint, apiKey, statusTextEl = null) {
    const promptText = `You are a master D&D 3.5e Rule Arbiter and Database Architect.
User query: "${query}" (Category Hint: "${categoryHint}").

CRITICAL D&D 3.5E ANTI-HALLUCINATION & CANONICAL VERIFICATION RULES:
1. STRICT REAL RAW 3.5E RULES ONLY:
NEVER fabricate, invent, or hallucinate a rule, feat, spell, magic item, or book source. Every result MUST exist in official Wizards of the Coast D&D 3.5e publications.
2. MANDATORY TYPO / FUZZY SPELLING CORRECTION:
User input frequently contains typos or phonetic misspellings (e.g. "clave" -> "Cleave", "gret cleve" -> "Great Cleave", "power atac" -> "Power Attack", "shok trooper" -> "Shock Trooper", "flometong" -> "Flametongue", "hast" -> "Haste", "moutain hamer" -> "Mountain Hammer").
You MUST recognize the intended canonical element and output the real, correct official D&D 3.5e element!
For example:
- Query "clave" -> Entry Name MUST BE "Cleave", Source: "PHB p.92", Prerequisites: "Str 13, Power Attack.", Benefit: "If you deal a creature enough damage to make it drop (below 0 hp or killed), you get an immediate extra melee attack against another creature in immediate vicinity. Once per round."
DO NOT INVENT A FAKE FEAT CALLED "CLAVE" FROM "COMPLETE DIVINE"!
3. SOURCE INTEGRITY:
In Col 4, cite the exact real book and page (e.g. 'PHB p.92', 'MIC p.128', 'DMG p.224', 'CW p.112', 'ToB p.84'). Never cite a book that doesn't contain that rule.

PRIORITIZED KNOWLEDGE BASES (Cascading Search Order):
1. Priority 1 (Core SRD): https://www.d20srd.org & http://dndsrd.net (PHB, DMG, MM Core 3.5e rules)
2. Priority 2 (Foundry JSON): D&D 3.5e structured JSON compendiums (spells, feats, items, maneuvers)
3. Priority 3 (Extended Splatbooks): Complete series, Magic Item Compendium (MIC), Spell Compendium (SC), Tome of Battle (ToB), Frostburn, Sandstorm, etc.

TASK:
Resolve the target D&D 3.5e game element into an array of rows adhering strictly to the Master_DB 29-column schema.
If the item has multiple distinct powers (e.g. passive weapon/item stats + on-hit damage + 1/day active spell power), produce 1 Parent row and 1 or more Child rows starting with '↳ ' and setting Col 3 (Parent Entry) to the exact parent entry name.

MASTER_DB 29-COLUMN SCHEMA (Every row MUST contain exactly 29 elements in this order):
0: Entry Name (string, child begins with '↳ ')
1: Category ('Feat', 'Weapon', 'Armor / Shield', 'Ring', 'Wondrous Item', 'Slotless Item', 'Spell', 'Maneuver', 'Stance', 'Potion', 'Special Ability')
2: Slot ('Armor', 'Shield', 'Main Hand', 'Off Hand', 'Both Hands', 'Head', 'Eyes', 'Neck', 'Torso', 'Body', 'Waist', 'Shoulders', 'Arms', 'Hands', 'Ring', 'Feet', 'Slotless', 'None')
3: Parent Entry (string; '-' if none, or exact parent name if child)
4: Source (e.g. 'PHB p.98', 'MIC p.128', 'DMG p.224', 'ToB p.68')
5: Description / Rules Mechanics (string, concise mechanics text)
6: Bonus Type ('Alchemical', 'Armor', 'Circumstance', 'Competence', 'Deflection', 'Dodge', 'Enhancement', 'Inherent', 'Insight', 'Luck', 'Morale', 'Natural Armor', 'Resistance', 'Sacred', 'Shield', 'Size', 'Untyped')
7: Applies To / Scope ('All Attacks', 'Melee Only', 'Ranged Only', 'Thrown Only', 'Slashing', 'Piercing', 'Bludgeoning', 'Spells', 'None / General')
8: Str (number or 0)
9: Dex (number or 0)
10: Con (number or 0)
11: Int (number or 0)
12: Wis (number or 0)
13: Cha (number or 0)
14: AC (number or 0)
15: HP (number or 0)
16: Att (number or 0)
17: Dmg (number or 0)
18: Fort (number or 0)
19: Ref (number or 0)
20: Will (number or 0)
21: Skill (number or 0)
22: Init (number or 0)
23: Speed (number or 0)
24: On-Hit Dmg / Dice Expression (string, e.g. '+1d6 Fire', '3d8', or '')
25: Action ('-', 'Passive', 'Free Action', 'Swift Action', 'Immediate Action', 'Move Action', 'Standard Action', 'Full-Round Action')
26: Duration / Uses (string, e.g. 'Passive', 'Continuous', '1 round/lvl', '1/day', 'At Will', 'Instantaneous')
27: Weight (lbs) (number or 0)
28: Cost (gp) (number or 0)

OUTPUT REQUIREMENT:
Return valid JSON only matching this schema:
{ "rows": [ [col0, col1, ... col28], ... ] }`;

    const availableModels = await this.getAvailableGeminiModels(apiKey);
    let successResponse = null;
    let lastError = null;

    for (const model of availableModels) {
      if (statusTextEl) statusTextEl.textContent = `"${query}" ➔ ${model} sorgulanıyor...`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.0
            }
          })
        });

        if (resp.ok) {
          const json = await resp.json();
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            try {
              successResponse = JSON.parse(rawText);
              break;
            } catch (pErr) {
              lastError = 'JSON Çözümleme hatası: ' + pErr.message;
            }
          }
        } else {
          const errData = await resp.json().catch(() => ({}));
          lastError = errData.error?.message || `HTTP ${resp.status}`;
        }
      } catch (netErr) {
        lastError = netErr.message;
      }
    }

    if (successResponse && Array.isArray(successResponse.rows)) {
      return successResponse.rows;
    }
    throw new Error(lastError || 'Bilinmeyen API yanıtı');
  },

  async queryAiRule() {
    const queryInput = document.getElementById('ai-rule-query');
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
      this.processAiRows([row]);
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('⚠️ Lütfen önce bir Google Gemini API Anahtarı girin (Google AI Studio ücretsiz anahtar).');
      this.promptChangeApiKey();
      return;
    }

    const catSelect = document.getElementById('ai-rule-category');
    const categoryHint = catSelect?.value || 'ALL';

    const btn = document.getElementById('btn-ai-search');
    const loadingBox = document.getElementById('ai-loading-indicator');
    const resultsBox = document.getElementById('ai-results-container');
    const statusText = document.getElementById('ai-loading-status-text');

    if (btn) btn.disabled = true;
    if (loadingBox) loadingBox.classList.remove('hidden');
    if (resultsBox) resultsBox.innerHTML = '';

    try {
      const rows = await this.fetchSingleAiRuleRows(query, categoryHint, apiKey, statusText);
      this.processAiRows(rows);
    } catch (err) {
      alert(`⚠️ Kural getirilemedi: ${err.message}\nLütfen internet bağlantınızı ve API anahtarınızı kontrol edin.`);
    } finally {
      if (btn) btn.disabled = false;
      if (loadingBox) loadingBox.classList.add('hidden');
    }
  },

  async queryAiBatch() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('⚠️ Lütfen önce bir Google Gemini API Anahtarı girin.');
      this.promptChangeApiKey();
      return;
    }
    const text = document.getElementById('ai-batch-query')?.value || '';
    const items = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (!items.length) {
      alert('⚠️ Lütfen her satıra bir kural adı yazın (Örn: Shock Trooper, Boots of Speed, Haste...).');
      return;
    }

    const btn = document.getElementById('btn-ai-batch-search');
    const statusBox = document.getElementById('ai-batch-status');
    const statusText = document.getElementById('ai-batch-status-text');

    if (btn) btn.disabled = true;
    if (statusBox) statusBox.classList.remove('hidden');

    let totalImported = 0;
    for (let i = 0; i < items.length; i++) {
      const itemQuery = items[i];
      if (statusText) statusText.textContent = `[${i + 1}/${items.length}] "${itemQuery}" taranıyor...`;
      try {
        const rows = await this.fetchSingleAiRuleRows(itemQuery, 'ALL', apiKey, statusText);
        if (rows && rows.length) {
          const parsed = this.convertRowsToEntries(rows);
          parsed.forEach(entry => {
            masterDb.push(entry);
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

  convertRowsToEntries(rows) {
    const list = [];
    rows.forEach(row => {
      const rawName = String(row[0] || '').trim();
      const isChild = rawName.startsWith('↳');

      const cat = String(row[1] || 'Feat').trim();
      let normType = 'Feat';
      if (cat.toLowerCase().includes('weapon')) normType = 'Weapon';
      else if (cat.toLowerCase().includes('shield')) normType = 'Shield';
      else if (cat.toLowerCase().includes('armor')) normType = 'Armor';
      else if (cat.toLowerCase().includes('spell')) normType = 'Spell';
      else if (cat.toLowerCase().includes('maneuver')) normType = 'Maneuver';
      else if (cat.toLowerCase().includes('stance')) normType = 'Stance';
      else if (cat.toLowerCase().includes('potion')) normType = 'Potion';
      else if (cat.toLowerCase().includes('wondrous')) normType = 'Wondrous Item';
      else if (cat.toLowerCase().includes('ring')) normType = 'Ring';
      else normType = cat;

      const entry = {
        name: rawName,
        type: normType,
        slot: String(row[2] || 'None').trim(),
        parent: String(row[3] || '-').trim(),
        source: String(row[4] || 'Core 3.5e').trim(),
        benefit: String(row[5] || '').trim(),
        description: String(row[5] || '').trim(),
        bonusType: String(row[6] || 'Untyped').trim(),
        scope: String(row[7] || 'None / General').trim(),
        strBonus: Number(row[8]) || '',
        dexBonus: Number(row[9]) || '',
        conBonus: Number(row[10]) || '',
        intBonus: Number(row[11]) || '',
        wisBonus: Number(row[12]) || '',
        chaBonus: Number(row[13]) || '',
        acBonus: Number(row[14]) || '',
        hpBonus: Number(row[15]) || '',
        attBonus: Number(row[16]) || '',
        dmgBonus: Number(row[17]) || '',
        fortBonus: Number(row[18]) || '',
        refBonus: Number(row[19]) || '',
        willBonus: Number(row[20]) || '',
        skillBonus: Number(row[21]) || '',
        clBonus: '',
        speedBonus: Number(row[23]) || '',
        extraDmg: String(row[24] || '').trim(),
        dice: String(row[24] || (normType === 'Weapon' ? '1d8' : '')).trim(),
        critMin: 20,
        critMult: 2,
        dmgType: '',
        action: String(row[25] || 'Passive').trim(),
        duration: String(row[26] || 'Continuous').trim(),
        weight: Number(row[27]) || 0,
        cost: Number(row[28]) || 0,
        role: isChild ? 'Secondary Power' : 'General',
        prereq: '',
        discipline: '',
        level: '',
        isChild: isChild
      };
      list.push(entry);
    });
    return list;
  },

  processAiRows(rows) {
    this.lastAiResults = this.convertRowsToEntries(rows);
    this.renderAiResults();
  },

  renderAiResults() {
    const container = document.getElementById('ai-results-container');
    if (!container) return;

    if (!this.lastAiResults.length) {
      container.innerHTML = `
        <div class="p-6 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
          Sonuç bulunamadı. Lütfen kural adını kontrol edip tekrar arayın.
        </div>
      `;
      return;
    }

    let html = `
      <div class="flex items-center justify-between bg-slate-900 border border-purple-500/40 p-3 rounded-xl mb-3">
        <div class="flex items-center gap-2">
          <span class="text-base">✨</span>
          <span class="text-xs font-bold text-white">${this.lastAiResults.length} Kural / Alt Güç Üretildi</span>
          <span class="text-[11px] text-slate-400">Master_DB 29 sütunlu şemasıyla tam uyumlu</span>
        </div>
        <button onclick="RuleMaster.addAllAiResultsToDb()" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow transition flex items-center gap-1.5">
          <span>📥</span>
          <span>Tümünü DB'ye Ekle</span>
        </button>
      </div>
      <div class="space-y-3">
    `;

    this.lastAiResults.forEach((item, idx) => {
      const isChild = item.isChild || (item.parent && item.parent !== '-');
      const badgeClass = this.getTypeBadgeClass(item.type);

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
      if (item.extraDmg) statPills.push(`${item.extraDmg}`);

      html += `
        <div class="${isChild ? 'ml-6 border-l-4 border-l-purple-500 bg-slate-900/60' : 'bg-slate-900'} border border-slate-800 rounded-xl p-4 space-y-3 shadow-md">
          <div class="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-2">
                ${isChild ? '<span class="text-purple-400 font-bold">↳</span>' : ''}
                <span class="text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge ${badgeClass}">${item.type}</span>
                ${isChild ? `<span class="badge bg-purple-950 text-purple-300 border border-purple-800 font-mono text-[10px]">Bağlı: ${item.parent}</span>` : ''}
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span>📚 <b>${item.source || 'Core 3.5e'}</b></span>
                <span>•</span>
                <span>Yuva: <b>${item.slot || 'None'}</b></span>
                <span>•</span>
                <span>Tür: <b>${item.bonusType || 'Untyped'}</b></span>
                <span>•</span>
                <span>Kapsam: <b>${item.scope || 'None / General'}</b></span>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <button onclick="RuleMaster.addAiResultToDb(${idx})" class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1">
                <span>📥</span>
                <span>DB'ye Ekle</span>
              </button>
              <button onclick="RuleMaster.editAiResultInModal(${idx})" class="bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition" title="29 Sütunlu Formda Aç">
                ✏️ Düzenle
              </button>
              <button onclick="RuleMaster.equipAiResultToCharacter(${idx})" class="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg transition" title="Karaktere Kuşan / Ekle">
                ⚡ Kuşan
              </button>
            </div>
          </div>

          <!-- Modifiers Row -->
          ${statPills.length > 0 ? `
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[10px] uppercase font-bold text-slate-400">Bonuslar:</span>
              ${statPills.map(p => `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">${p}</span>`).join('')}
            </div>
          ` : ''}

          <!-- Mechanics & Benefit Description -->
          <div class="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            ${item.benefit || item.description || '-'}
          </div>

          <!-- Extra details: Action, Duration, Cost, Weight -->
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
      const item = JSON.parse(JSON.stringify(this.lastAiResults[index]));
      masterDb.push(item);
      if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
      this.renderTable();
      alert(`✅ "${item.name}" başarıyla Master_DB kütüphanesine eklendi!`);
    }
  },

  addAllAiResultsToDb() {
    if (!this.lastAiResults.length) return;
    this.lastAiResults.forEach(item => {
      masterDb.push(JSON.parse(JSON.stringify(item)));
    });
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`✅ ${this.lastAiResults.length} kural başarıyla Master_DB kütüphanesine eklendi!`);
  },

  editAiResultInModal(index) {
    if (index >= 0 && index < this.lastAiResults.length) {
      const item = JSON.parse(JSON.stringify(this.lastAiResults[index]));
      this.openModalWithData(item, -1);
    }
  },

  equipAiResultToCharacter(index) {
    if (index >= 0 && index < this.lastAiResults.length) {
      const item = JSON.parse(JSON.stringify(this.lastAiResults[index]));
      this.equipItem(item);
    }
  },

  equipItem(item) {
    if (typeof character === 'undefined' || !character) return;
    const type = (item.type || '').toLowerCase();

    if (type === 'weapon') {
      if (!character.weapons) character.weapons = [];
      const newWep = {
        name: item.name,
        grip: item.slot === 'Main Hand' ? '1-Hand' : '2-Hand',
        dice: item.dice || item.extraDmg || '1d8',
        critMin: item.critMin || 20,
        critMult: item.critMult || 2,
        attBonus: Number(item.attBonus) || 0,
        dmgBonus: Number(item.dmgBonus) || 0,
        dmgType: item.dmgType || 'Slashing',
        bonusType: item.bonusType || 'Enhancement',
        tags: item.tags || []
      };
      character.weapons.push(newWep);
      character.activeWeapon = item.name;
      alert(`⚔️ "${item.name}" silahı karakterin aktif silahlarına eklendi ve kuşandı!`);
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
      alert(`⚡ "${item.name}" duruşu aktif duruş olarak seçildi!`);
    } else if (type === 'feat') {
      if (!character.feats) character.feats = [];
      character.feats.push(item.name);
      alert(`✨ "${item.name}" hüneri (Feat) karaktere eklendi!`);
    } else if (type === 'potion') {
      if (!character.consumables) character.consumables = [];
      character.consumables.push({
        name: item.name,
        qty: 1,
        effect: item.benefit || item.description || 'Potion effect'
      });
      alert(`🧪 "${item.name}" iksir çantanıza 1 adet olarak eklendi!`);
    } else {
      if (!character.inventory) character.inventory = [];
      character.inventory.push({
        name: item.name,
        slot: item.slot || 'Slotless',
        benefit: item.benefit || item.description || '',
        weight: item.weight || 0,
        cost: item.cost || 0
      });
      alert(`🎒 "${item.name}" (${item.type}) envantere eklendi!`);
    }

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    if (typeof renderAll === 'function') renderAll();
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
            <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
          </div>

          <!-- Combat Stats Pills -->
          <div class="flex flex-wrap gap-1.5 text-xs font-mono">
            ${isWeapon ? `
              <span class="badge bg-slate-800 text-amber-300 font-bold">🎲 ${item.dice || item.extraDmg || '1d8'}</span>
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
            <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
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
            <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
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
            <button onclick="RuleMaster.openModalWithData(masterDb[${idx}], ${idx})" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition" title="Düzenle">✏️</button>
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
                        <span class="text-purple-400 font-bold">↳</span>
                        <span class="text-xs font-bold text-purple-200">${child.name}</span>
                        <span class="badge bg-slate-800 text-slate-400 text-[10px]">${child.action || 'Passive'}</span>
                        <span class="badge bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">${child.bonusType || 'Untyped'}</span>
                      </div>
                      ${cIdx >= 0 ? `<button onclick="RuleMaster.openModalWithData(masterDb[${cIdx}], ${cIdx})" class="text-[11px] text-sky-400 hover:underline">Düzenle ✏️</button>` : ''}
                    </div>
                    <div class="text-[11px] text-slate-300">${child.benefit || child.description || '-'}</div>
                    ${child.extraDmg || child.dice ? `<div class="text-[10px] font-mono text-emerald-400">🎲 Ek Zar/Hasar: ${child.extraDmg || child.dice}</div>` : ''}
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
        div.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">${src.priority}. ${src.name}</span>
            <span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700">${src.status}</span>
          </div>
          <div class="text-[11px] text-slate-400">${src.scope}</div>
          <div class="flex items-center justify-between pt-1 border-t border-slate-800">
            <span class="text-[10px] text-indigo-300 font-mono">${src.type}</span>
            <a href="${src.url}" target="_blank" class="text-xs text-sky-400 hover:underline flex items-center gap-1">
              <span>Bağlantıyı Aç</span> <span>↗</span>
            </a>
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
      <div class="space-y-2 mt-2">
    `;

    entries.forEach((item, idx) => {
      const isChild = item.isChild || (item.parent && item.parent !== '-');
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
        <div class="bg-slate-950 border border-purple-500/40 rounded-xl p-3 shadow-md space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div class="flex items-center gap-2">
                ${isChild ? '<span class="text-purple-400 font-bold">↳</span>' : ''}
                <span class="text-xs md:text-sm font-extrabold text-white">${item.name}</span>
                <span class="badge ${badgeClass} text-[10px]">${item.type}</span>
                <span class="text-[10px] text-slate-400">📚 <b>${item.source || 'PHB'}</b></span>
                <span class="text-[10px] text-slate-400">• Slot: <b>${item.slot || 'None'}</b></span>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button onclick="RuleMaster.addInlineResultToDb(${idx})" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-3 py-1 rounded-lg shadow transition flex items-center gap-1">
                <span>📥</span>
                <span>DB'ye Ekle</span>
              </button>
              <button onclick="RuleMaster.editInlineResultInModal(${idx})" class="bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs px-2 py-1 rounded-lg border border-slate-700 transition" title="29 Sütunlu Formda İncele/Düzenle">
                ✏️ Düzenle
              </button>
              <button onclick="RuleMaster.equipInlineResultToCharacter(${idx})" class="bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 text-xs px-2 py-1 rounded-lg transition" title="Karaktere Kuşan">
                ⚡ Kuşan
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

  addInlineResultToDb(idx) {
    if (!this._inlineEntries || !this._inlineEntries[idx]) return;
    const item = this._inlineEntries[idx];
    masterDb.unshift(item);
    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    this.renderTable();
    alert(`✅ "${item.name}" başarıyla Master_DB'ye eklendi ve kütüphane tablosu güncellendi!`);
  },

  editInlineResultInModal(idx) {
    if (!this._inlineEntries || !this._inlineEntries[idx]) return;
    const item = this._inlineEntries[idx];
    this.openModalWithData(item, -1);
  },

  equipInlineResultToCharacter(idx) {
    if (!this._inlineEntries || !this._inlineEntries[idx]) return;
    const item = this._inlineEntries[idx];
    this.equipEntry(item);
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
      if (headerTitle) headerTitle.textContent = 'Serbest Metin AI Kural Ayrıştırıcı';
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
      if (headerTitle) headerTitle.textContent = 'Hızlı AI Kural Ekleyici (WotC 3.5e)';
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

MASTER_DB 29-COLUMN SCHEMA (Every row MUST contain exactly 29 elements):
0: Entry Name (string, child begins with '↳ ')
1: Category ('Feat', 'Weapon', 'Armor / Shield', 'Ring', 'Wondrous Item', 'Slotless Item', 'Spell', 'Special Ability', 'Potion', 'Maneuver', 'Stance')
2: Slot ('Armor', 'Shield', 'Main Hand', 'Off Hand', 'Both Hands', 'Head', 'Eyes', 'Neck', 'Torso', 'Body', 'Waist', 'Shoulders', 'Arms', 'Hands', 'Ring', 'Feet', 'Slotless', 'None')
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

    const modelsToTry = await this.getAvailableGeminiModels(apiKey);
    let successData = null;
    let lastError = null;

    for (const model of modelsToTry) {
      if (statusTextEl) {
        statusTextEl.textContent = `Serbest metin analiz ediliyor (Model: ${model})...`;
      }
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
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          successData = JSON.parse(text);
          break;
        }
      } catch (err) {
        console.warn(`Model ${model} free-text parse failed:`, err.message);
        lastError = err;
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


