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

  // Splatbooks catalog
  splatbooks: [
    { code: "PHB", name: "Player's Handbook 3.5", cat: "Core", note: "Temel sınıflar, ırklar, hünerler ve büyüler" },
    { code: "DMG", name: "Dungeon Master's Guide 3.5", cat: "Core", note: "Büyülü eşyalar, prestij sınıfları, hazine" },
    { code: "MM", name: "Monster Manual 3.5", cat: "Core", note: "Yaratıklar, ırksal özellikler ve şablonlar" },
    { code: "MIC", name: "Magic Item Compendium", cat: "Equipment", note: "Genişletilmiş büyülü eşyalar, vücut yuvaları" },
    { code: "SpC", name: "Spell Compendium", cat: "Spells", note: "Tüm ek kitapların birleşik büyü arşivi" },
    { code: "ToB", name: "Tome of Battle (Book of 9 Swords)", cat: "Combat", note: "Savaş manevraları, duruşlar (stances), Martial Adept" },
    { code: "CW", name: "Complete Warrior", cat: "Splatbook", note: "Savaşçı sınıfları, dövüş hünerleri, prestij" },
    { code: "CD", name: "Complete Divine", cat: "Splatbook", note: "İlahi sınıflar, domainler, ilahi hünerler" },
    { code: "CA", name: "Complete Arcane", cat: "Splatbook", note: "Warlock, Warmage, metamagic hünerleri" },
    { code: "CAd", name: "Complete Adventurer", cat: "Splatbook", note: "Rogue/Bard, Skill Tricks, gizlilik hünerleri" },
    { code: "PHB2", name: "Player's Handbook II", cat: "Core Expansion", note: "Yeni featler, Knight, Beguiler, Duskblade" }
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
      alert(`⚔️ "${item.name}" silahı karakterinizin aktif silahlarına eklendi ve kuşandı!`);
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
      alert(`🧪 "${item.name}" iksir çantanıza 1 adet olarak eklendi!`);
    } else {
      alert(`🎒 "${item.name}" eşyası karakterinizin kütüphanesine kaydedildi.`);
    }

    if (typeof saveStateToStorage === 'function') saveStateToStorage(true);
    if (typeof renderAll === 'function') renderAll();
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

  // Switch Sub-Tabs inside Tab 6
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

    if (subTabId === 'subtab-mdb-sources') {
      this.renderSourcesCatalog();
    } else if (subTabId === 'subtab-mdb-importer') {
      this.updateApiKeyUi();
    }
  },

  // Initialize RuleMaster
  init() {
    this.renderTable();
    this.updateApiKeyUi();
  },

  // ====================================================
  // GEMINI AI RULE IMPORTER (AI KURAL EKLEYİCİ)
  // ====================================================
  lastAiResults: [],

  getApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
  },

  setApiKey(key) {
    if (!key || !key.trim()) {
      localStorage.removeItem('gemini_api_key');
    } else {
      localStorage.setItem('gemini_api_key', key.trim());
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

  setQueryAndSearch(term, categoryHint = 'ALL') {
    const queryInput = document.getElementById('ai-rule-query');
    const catSelect = document.getElementById('ai-rule-category');
    if (queryInput) queryInput.value = term;
    if (catSelect) catSelect.value = categoryHint;
    this.queryAiRule();
  },

  async queryAiRule() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      alert('⚠️ Lütfen önce bir Google Gemini API Anahtarı girin (Google AI Studio ücretsiz anahtar).');
      this.promptChangeApiKey();
      return;
    }

    const queryInput = document.getElementById('ai-rule-query');
    const query = queryInput?.value?.trim() || '';
    if (!query) {
      alert('⚠️ Lütfen aranacak kural, hüner, büyü veya eşya adını yazın.');
      queryInput?.focus();
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
    if (statusText) statusText.textContent = `"${query}" aranıyor... (Core SRD, Splatbooks ve Foundry DB)`;

    const promptText = `You are a master D&D 3.5e Rule Arbiter and Database Architect.
User query: "${query}" (Category Hint: "${categoryHint}").

PRIORITIZED KNOWLEDGE BASES (Cascading Search Order):
1. Priority 1 (Core SRD): https://www.d20srd.org & http://dndsrd.net (PHB, DMG, MM Core 3.5e rules)
2. Priority 2 (Foundry JSON): D&D 3.5e structured JSON compendiums (spells, feats, items, maneuvers)
3. Priority 3 (Extended Splatbooks): Complete Warrior, Complete Arcane, Complete Divine, Complete Adventurer, Magic Item Compendium (MIC), Spell Compendium (SC), Tome of Battle (ToB), Frostburn, Sandstorm, etc.

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

    const fallbackModels = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash-lite'
    ];

    let successResponse = null;
    let lastError = null;

    for (const model of fallbackModels) {
      if (statusText) statusText.textContent = `Model sorgulanıyor: ${model}...`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.1
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

    if (btn) btn.disabled = false;
    if (loadingBox) loadingBox.classList.add('hidden');

    if (!successResponse || !successResponse.rows || !Array.isArray(successResponse.rows)) {
      alert(`⚠️ Kural getirilemedi: ${lastError || 'Bilinmeyen yanıt'}\nLütfen API anahtarınızı ve internet bağlantınızı kontrol edin.`);
      return;
    }

    this.processAiRows(successResponse.rows);
  },

  processAiRows(rows) {
    this.lastAiResults = [];
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

      this.lastAiResults.push(entry);
    });

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
  }
};

window.RuleMaster = RuleMaster;
