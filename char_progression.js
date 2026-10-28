/**
 * Joyful-Fermi D&D 3.5e — Feat Picker, Prerequisite Engine, Level-Up Wizard (1-30), Class Search & Skill Consolidation
 */
    // ====================================================
    // 🎖️ FEAT PICKER MODAL FUNCTIONS
    // ====================================================
    // Helper: Calculate search relevance score for feats / abilities
    function getFeatSearchRelevance(item, query) {
      if (!query || !item) return 0;
      const name = (item.name || '').toLowerCase().trim();
      const cleanQ = query.toLowerCase().trim();
      if (!cleanQ) return 0;
      if (name === cleanQ) return 10000;
      if (name.startsWith(cleanQ)) return 5000;
      const words = name.split(/\s+/);
      if (words.some(w => w.startsWith(cleanQ))) return 3000;
      if (name.includes(cleanQ)) return 1000;
      const benefit = (item.benefit || item.desc || '').toLowerCase();
      if (benefit.includes(cleanQ)) return 100;
      const prereq = (item.prereq || '').toLowerCase();
      if (prereq.includes(cleanQ)) return 50;
      const source = (item.source || '').toLowerCase();
      if (source.includes(cleanQ)) return 20;
      return 10;
    }

    function getCombinedFeatCatalog(includeInvocations = false) {
      const map = new Map();
      const skipPlaceholders = new Set([
        'weapon proficiency (no weapon selected)',
        'spell focus (no spell school selected)',
        'greater spell focus (no spell school selected)',
        'skill focus (not set)',
        'improved natural attack (no weapon set)'
      ]);
      const allInvs = (typeof getAllWarlockInvocations === 'function') ? getAllWarlockInvocations() : [];
      const invocationByName = new Map();
      allInvs.forEach(inv => {
        if (inv && inv.name) {
          invocationByName.set(inv.name.toLowerCase().trim(), inv);
        }
      });

      DND35_FEAT_CATALOG.forEach(f => {
        const k = (f.name || '').toLowerCase().trim();
        if (!includeInvocations && (f.category === 'Warlock Invocation' || invocationByName.has(k))) return;
        map.set(k, { ...f });
      });
      // 1. Canonical V2 SrdCompendium (452 SRD Feats with structured prerequisites)
      if (typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) {
        window.SrdCompendium.getAllLoaded('Feat').forEach(f => {
          if (!f || !f.name) return;
          const k = f.name.toLowerCase().trim();
          if (!k || skipPlaceholders.has(k)) return;
          if (f.category === 'Warlock Invocation' || invocationByName.has(k)) return;
          map.set(k, {
            ...f,
            prereq: f.prerequisites || f.prereq || '-',
            benefit: f.shortDescription || f.benefit || f.description || '',
            prereqStruct: f.prereqStruct || {}
          });
        });
      }
      // 2. Fallback / Supplement from BUNDLED_SRD_CORE_CATALOG
      if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        window.BUNDLED_SRD_CORE_CATALOG.filter(i => i && i.type === 'Feat').forEach(f => {
          const k = (f.name || '').toLowerCase().trim();
          if (k && !skipPlaceholders.has(k) && f.category !== 'Warlock Invocation' && !invocationByName.has(k)) {
            const existing = map.get(k);
            if (!existing) {
              map.set(k, { ...f, prereq: f.prerequisites || f.prereq || '-' });
            } else if ((!existing.prereq || existing.prereq === '-') && (f.prerequisites || f.prereq) && (f.prerequisites || f.prereq) !== '-') {
              existing.prereq = f.prerequisites || f.prereq;
              existing.prerequisites = f.prerequisites || f.prereq;
            }
          }
        });
      }
      DND35_DM_BOONS_CATALOG.forEach(b => map.set(b.name.toLowerCase(), { ...b }));
      DND35_FLAWS_CATALOG.forEach(fl => map.set(fl.name.toLowerCase(), { ...fl }));
      (masterDb || []).forEach(m => {
        if (!m || !m.name) return;
        const nameStr = String(m.name).trim();
        const key = nameStr.toLowerCase();
        if (!key || skipPlaceholders.has(key)) return;

        // STRICT FILTER: Exclude equipment child items, attachments, gems, socketed enhancements, and secondary powers
        const isChildItem = m.isChild === true 
          || (m.parent && m.parent !== '-' && m.parent !== '')
          || nameStr.startsWith('↳') 
          || nameStr.includes('↳')
          || (m.role && m.role.toLowerCase().includes('secondary power'));
        if (isChildItem) return;

        // Exclude parent equipment items (items that go into body slots or physical gear)
        const isEquipSlot = m.slot && m.slot !== 'None' && m.slot !== '-' && m.slot !== '';
        if (isEquipSlot) return;

        const t = (m.type || '').toLowerCase();
        // Exclude physical equipment types and item-only active powers
        if (['weapon', 'armor', 'shield', 'ring', 'wondrous item', 'potion', 'scroll', 'wand', 'staff', 'active power'].includes(t)) {
          return;
        }

        // Strict Warlock Invocation check (even if saved in masterDb with lost category)
        const isInv = m.category === 'Warlock Invocation' || invocationByName.has(key);
        if (isInv && !includeInvocations) return;

        if (t === 'feat' || t === 'special ability' || t === 'dm grant' || t === 'flaw' || t === 'racial trait') {
          const existingCanonical = map.get(key);
          if (existingCanonical) {
            // Preserve canonical SRD prerequisites, category, scope, and fighter bonus flag!
            if (!existingCanonical.benefit && (m.shortDescription || m.benefit || m.description)) {
              existingCanonical.benefit = m.shortDescription || m.benefit || m.description;
            }
            return;
          }
          const canonicalInv = invocationByName.get(key);
          map.set(key, {
            ...m,
            name: m.name,
            category: isInv
              ? 'Warlock Invocation'
              : (t === 'special ability' ? 'Special Ability' : (t === 'dm grant' ? 'DM Boon' : (t === 'flaw' ? 'Flaw' : (m.category || 'General')))),
            prereq: (canonicalInv ? (canonicalInv.prerequisites || canonicalInv.prereq || `Warlock Level ${canonicalInv.minLevel || 1}`) : null) || m.prerequisites || m.prereq || '-',
            source: m.source || 'Master DB',
            benefit: m.shortDescription || m.benefit || m.description || ''
          });
        }
      });
      if (includeInvocations) {
        allInvs.forEach(inv => {
          const k = (inv.name || '').toLowerCase().trim();
          if (k && !map.has(k)) {
            map.set(k, {
              ...inv,
              category: 'Warlock Invocation',
              prereq: inv.prerequisites || inv.prereq || (`Warlock Level ${inv.minLevel || 1}`)
            });
          }
        });
      }
      return Array.from(map.values());
    }

    function openFeatPickerModal(forLevelUp = false) {
      isFeatPickerForLevelUp = !!forLevelUp;
      const modal = document.getElementById('feat-picker-modal');
      if (!modal) return;
      const titleEl = document.getElementById('feat-picker-modal-title');
      if (titleEl) {
        titleEl.textContent = isFeatPickerForLevelUp ? 'Select Feat for Level Up' : 'Select & Learn Feat';
      }
      const searchEl = document.getElementById('feat-picker-search');
      if (searchEl) searchEl.value = '';
      renderFeatPickerList();
      modal.classList.remove('hidden');
    }

    function closeFeatPickerModal() {
      const modal = document.getElementById('feat-picker-modal');
      if (modal) modal.classList.add('hidden');
    }

    function renderFeatPickerList() {
      const listEl = document.getElementById('feat-picker-list');
      if (!listEl) return;
      listEl.innerHTML = '';

      const query = (document.getElementById('feat-picker-search')?.value || '').toLowerCase().trim();
      const cat = document.getElementById('feat-picker-category')?.value || 'All';
      const catalog = getCombinedFeatCatalog();

      const ownedSet = new Set([
        ...(character.feats || []).map(f => (typeof f === 'string' ? f : f.name).toLowerCase().trim()),
        ...(character.specialAbilities || []).map(a => (typeof a === 'string' ? a : a.name).toLowerCase().trim())
      ]);

      const filtered = catalog.filter(f => {
        const matchQuery = !query || f.name.toLowerCase().includes(query) || (f.benefit || '').toLowerCase().includes(query) || (f.prereq || '').toLowerCase().includes(query);
        const matchCat = cat === 'All' || (f.category || '').toLowerCase().includes(cat.toLowerCase());
        return matchQuery && matchCat;
      });

      if (filtered.length === 0) {
        listEl.innerHTML = `<div class="p-4 text-center text-slate-400 italic bg-slate-950/60 rounded-xl border border-slate-800">No feats matched your search. You can define a custom feat below or fetch via Rule Master AI.</div>`;
        return;
      }

      filtered.forEach(f => {
        const isOwned = ownedSet.has(f.name.toLowerCase().trim());
        const pEval = typeof checkFeatPrerequisites === 'function' ? checkFeatPrerequisites(f) : { allMet: true, isAlreadyKnownFromClass: false };
        const isClassKnown = Boolean(pEval && pEval.isAlreadyKnownFromClass);
        const isQualified = Boolean(pEval.allMet !== false && !isClassKnown);
        const isFlaw = (f.category === 'Flaw' || f.name.toLowerCase().startsWith('flaw:'));
        const isRacial = (f.category === 'Racial Trait' || (f.type && f.type.toLowerCase().includes('racial')));
        const lvl1Only = (isFlaw || isRacial || (f.prereq && f.prereq.toLowerCase().includes('1st level')));
        const charLvl = character ? (character.level || 1) : 1;

        const itemDiv = document.createElement('div');
        itemDiv.className = `p-3 rounded-xl border transition flex items-start justify-between gap-3 ${isOwned ? 'bg-slate-900/40 border-emerald-800/50' : (isQualified ? 'bg-slate-950/80 border-slate-800 hover:border-purple-500/60' : 'bg-slate-950/40 border-slate-800/70 opacity-75')}`;
        const safeName = f.name.replace(/'/g, "\\'");
        itemDiv.innerHTML = `
          <div class="space-y-1 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-bold text-white text-xs">${f.name}</span>
              <span class="badge ${isFlaw ? 'bg-rose-950 text-rose-300 border border-rose-800' : (isRacial ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-purple-950 text-purple-300 border border-purple-800')} text-[9px]">${f.category || 'General'}</span>
              <span class="text-[10px] text-slate-400 font-mono">📚 ${f.source || 'PHB'}</span>
              ${lvl1Only ? `<span class="badge bg-amber-950 text-amber-300 border border-amber-700/80 text-[9px] font-bold">⚠️ 1st Level Only</span>` : ''}
              ${f.prereq && f.prereq !== '-' ? `<span class="text-[10px] ${isQualified ? 'text-emerald-400' : 'text-rose-400 font-bold'} font-mono">Prereq: ${f.prereq} ${isQualified ? '✓' : '✗'}</span>` : ''}
            </div>
            <p class="text-[11px] text-slate-300 leading-relaxed">${f.benefit || ''}</p>
          </div>
          <div class="shrink-0">
            ${isOwned && !isFeatPickerForLevelUp
              ? `<span class="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold inline-block">✅ Owned</span>`
              : (!isQualified
                ? `<button disabled type="button" title="Prerequisites not met" class="px-3 py-1.5 rounded-lg bg-slate-800 text-rose-300/80 border border-rose-800/50 font-bold text-xs opacity-60 cursor-not-allowed whitespace-nowrap">🔒 Prereqs Not Met</button>`
                : `<button onclick="selectFeatFromPicker('${safeName}')" class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition whitespace-nowrap">
                    ${isFeatPickerForLevelUp ? '⬆️ Select for Level' : '➕ Learn'}
                  </button>`)
            }
          </div>
        `;
        listEl.appendChild(itemDiv);
      });
    }

    function selectFeatFromPicker(featName) {
      const catalog = getCombinedFeatCatalog();
      const entry = catalog.find(c => c.name.toLowerCase() === featName.toLowerCase()) || {
        name: featName,
        category: 'General',
        source: 'D&D 3.5e',
        benefit: ''
      };
      const isBoonEntry = (entry.category === 'DM Boon' || entry.category === 'DM Grant');
      if (!isBoonEntry && typeof checkFeatPrerequisites === 'function') {
        const pEval = checkFeatPrerequisites(entry);
        if (pEval && !pEval.allMet) {
          if (typeof showDiceTopToast === 'function') {
            showDiceTopToast({
              title: 'Prerequisites Not Met',
              desc: `Prerequisites not met for "${entry.name}" (${pEval.rawPrereq || 'Missing Prerequisite'}).`,
              type: 'warning'
            });
          }
          return;
        }
      }

      const isFlaw = (entry.category === 'Flaw' || entry.name.toLowerCase().startsWith('flaw:'));
      const isRacial = (entry.category === 'Racial Trait' || (entry.type && entry.type.toLowerCase().includes('racial')));

      if (isFeatPickerForQuickLevel) {
        const nameInput = document.getElementById('quick-feat-name');
        if (nameInput) nameInput.value = entry.name;
        const benefitInput = document.getElementById('quick-feat-benefit');
        if (benefitInput) benefitInput.value = entry.benefit || '';
        const catSel = document.getElementById('quick-feat-category');
        if (catSel) {
          if (entry.category === 'DM Boon' || entry.category === 'DM Grant') {
            catSel.value = 'DM Boon';
          } else if (entry.category === 'Flaw') {
            catSel.value = 'Flaw';
          } else if (entry.category === 'Special Ability') {
            catSel.value = 'Special Ability';
          } else if (entry.category === 'Racial Trait') {
            catSel.value = 'Racial Trait';
          } else if (entry.category === 'Fighter' || entry.category === 'Martial' || (entry.category || '').toLowerCase().includes('bonus')) {
            if (catSel.value !== 'Racial Trait') {
              catSel.value = 'Class Bonus Feat';
            }
          }
        }
        isFeatPickerForQuickLevel = false;
        closeFeatPickerModal();
        return;
      }

      if (isFeatPickerForLevelUp) {
        if (typeof levelUpModalFeatSlots !== 'undefined' && levelUpModalFeatSlots[activeFeatPickerSlotIndex]) {
          levelUpModalFeatSlots[activeFeatPickerSlotIndex].name = entry.name;
          levelUpModalFeatSlots[activeFeatPickerSlotIndex].benefit = entry.benefit || '';
          if (entry.category === 'DM Boon' || entry.category === 'DM Grant') {
            levelUpModalFeatSlots[activeFeatPickerSlotIndex].category = 'DM Boon';
          } else if (entry.category === 'Flaw') {
            levelUpModalFeatSlots[activeFeatPickerSlotIndex].category = 'Flaw';
          } else if (entry.category === 'Fighter' || entry.category === 'Martial') {
            if (levelUpModalFeatSlots[activeFeatPickerSlotIndex].category !== 'Racial Trait') {
              levelUpModalFeatSlots[activeFeatPickerSlotIndex].category = 'Class Bonus Feat';
            }
          } else if (entry.category === 'Special Ability') {
            levelUpModalFeatSlots[activeFeatPickerSlotIndex].category = 'Special Ability';
          } else if (entry.category === 'Racial Trait') {
            levelUpModalFeatSlots[activeFeatPickerSlotIndex].category = 'Racial Trait';
          }
          if (typeof renderLevelUpFeatSlots === 'function') renderLevelUpFeatSlots();
        }
        closeFeatPickerModal();
        return;
      }

      if (character.level > 1 && isFlaw) {
        const proceed = confirm(`⚠️ Per D&D 3.5e Unearthed Arcana RAW, Flaws may only be selected at 1st level during character creation. Your current character level is ${character.level}.\n\nDo you still want to add the flaw "${entry.name}"?`);
        if (!proceed) return;
      }

      if (character.level > 1 && isRacial) {
        const proceed = confirm(`⚠️ Racial traits are normally determined at 1st level. Your current level is ${character.level}.\n\nDo you still want to add "${entry.name}"?`);
        if (!proceed) return;
      }

      learnFeatObject(entry);
      renderFeatPickerList();
      saveStateToStorage(true);
      renderAll();

      if (isFlaw) {
        alert(`⚠️ Flaw "${entry.name}" added to character!\n\n🎖️ Per D&D 3.5e Unearthed Arcana rules, taking this flaw grants you 1 EXTRA BONUS FEAT!\n\nPlease select your bonus feat from the list now.`);
      } else if (isRacial && (entry.grantsBonusFeat || entry.name.toLowerCase().includes('bonus feat'))) {
        alert(`🧬 Racial trait "${entry.name}" added!\n\n🎖️ This trait grants 1 extra bonus feat. Please select your bonus feat from the list.`);
      }
    }

    function learnFeatObject(entry) {
      if (!entry || !entry.name) return;
      const clean = entry.name.toLowerCase().trim();
      if ((entry.category || '').toLowerCase() === 'special ability') {
        if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];
        const exists = character.specialAbilities.some(a => (typeof a === 'string' ? a : a.name).toLowerCase().trim() === clean);
        if (!exists) {
          character.specialAbilities.push({
            name: entry.name,
            source: entry.source || 'D&D 3.5e',
            category: 'Special Ability',
            benefit: entry.benefit || ''
          });
        }
      } else {
        if (!Array.isArray(character.feats)) character.feats = [];
        const exists = character.feats.some(f => (typeof f === 'string' ? f : f.name).toLowerCase().trim() === clean);
        if (!exists) {
          character.feats.push({
            name: entry.name,
            source: entry.source || 'D&D 3.5e',
            category: entry.category || 'General',
            benefit: entry.benefit || ''
          });
          // Toughness immediate +3 HP support
          if (clean === 'toughness' && character.hp) {
            if (character.hp.baseMax === undefined) character.hp.baseMax = (Number(character.hp.max) || 44) - (Number(character.hp.conBonusHp) || 0);
            character.hp.baseMax = (Number(character.hp.baseMax) || 0) + 3;
            character.hp.max = (Number(character.hp.baseMax) || 0) + (Number(character.hp.conBonusHp) || 0);
            character.hp.current = (Number(character.hp.current) || 0) + 3;
          }
        }
      }

      // Also ensure it is present in Master DB for universal reference
      if (Array.isArray(masterDb)) {
        const inDb = masterDb.some(m => (m.name || '').toLowerCase().trim() === clean);
        if (!inDb) {
          masterDb.push({
            name: entry.name,
            type: (entry.category === 'Special Ability') ? 'Special Ability' : 'Feat',
            slot: 'None',
            prereq: entry.prereq || '-',
            source: entry.source || 'D&D 3.5e',
            benefit: entry.benefit || '',
            bonusType: 'Untyped',
            role: 'Offense / Feat'
          });
        }
      }
    }

    function addCustomFeatFromPicker() {
      const name = (document.getElementById('custom-feat-name')?.value || '').trim();
      const category = document.getElementById('custom-feat-cat')?.value || 'General';
      const source = (document.getElementById('custom-feat-source')?.value || 'D&D 3.5e').trim();
      const benefit = (document.getElementById('custom-feat-benefit')?.value || '').trim();
      if (!name) {
        alert('⚠️ Please enter a Feat or Ability name.');
        return;
      }
      const entry = { name, category, source, benefit, prereq: '-' };

      if (isFeatPickerForQuickLevel) {
        const nameInput = document.getElementById('quick-feat-name');
        if (nameInput) nameInput.value = name;
        const benefitInput = document.getElementById('quick-feat-benefit');
        if (benefitInput) benefitInput.value = benefit;
        const catSel = document.getElementById('quick-feat-category');
        if (catSel) {
          if (category === 'DM Boon' || category === 'DM Grant') {
            catSel.value = 'DM Boon';
          } else if (category === 'Flaw') {
            catSel.value = 'Flaw';
          } else if (category === 'Special Ability') {
            catSel.value = 'Special Ability';
          } else if (category === 'Racial Trait') {
            catSel.value = 'Racial Trait';
          } else if (category === 'Fighter' || category === 'Martial' || (category || '').toLowerCase().includes('bonus')) {
            catSel.value = 'Class Bonus Feat';
          }
        }
        document.getElementById('custom-feat-name').value = '';
        document.getElementById('custom-feat-benefit').value = '';
        isFeatPickerForQuickLevel = false;
        closeFeatPickerModal();
        return;
      }

      if (isFeatPickerForLevelUp) {
        if (typeof levelUpModalFeatSlots !== 'undefined' && levelUpModalFeatSlots[activeFeatPickerSlotIndex]) {
          levelUpModalFeatSlots[activeFeatPickerSlotIndex].name = name;
          levelUpModalFeatSlots[activeFeatPickerSlotIndex].benefit = benefit;
          if (typeof renderLevelUpFeatSlots === 'function') renderLevelUpFeatSlots();
        }
        closeFeatPickerModal();
        return;
      }
      learnFeatObject(entry);
      document.getElementById('custom-feat-name').value = '';
      document.getElementById('custom-feat-benefit').value = '';
      renderFeatPickerList();
      saveStateToStorage(true);
      renderAll();
    }

    // ====================================================
    // 🎖️ QUICK LEVEL FEAT & ABILITY ADDER (Masaüstü & Tablo Desteği)
    // ====================================================
    function getAvailableExoticWeapons() {
      const set = new Set([
        "Bastard Sword", "Dwarven Waraxe", "Whip", "Spiked Chain", "Dire Flail", "Two-Bladed Sword", 
        "Orc Double Axe", "Gnome Hooked Hammer", "Bolas", "Hand Crossbow", "Repeating Heavy Crossbow", 
        "Repeating Light Crossbow", "Shuriken", "Net", "Jovar", "Kusari-Gama", "Kama", "Nunchaku", "Sai", "Siangham"
      ]);
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        masterDb.forEach(item => {
          if (item && (item.type === 'Weapon' || item.category === 'Weapon')) {
            const sub = (item.subcategory || item.proficiency || item.slot || '').toLowerCase();
            const desc = (item.desc || item.description || item.benefit || '').toLowerCase();
            if (sub.includes('exotic') || desc.includes('exotic weapon')) {
              set.add(item.name.replace(/^↳\s*/, '').replace(/\(.*?\)/g, '').trim());
            }
          }
        });
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    function getAvailableTargetWeapons(isExoticOnly = false) {
      if (isExoticOnly) return getAvailableExoticWeapons();
      const set = new Set(getSrdWeaponNames());
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        masterDb.forEach(item => {
          if (item && (item.type === 'Weapon' || item.category === 'Weapon')) {
            set.add(item.name.replace(/^↳\s*/, '').replace(/\(.*?\)/g, '').trim());
          }
        });
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    function updateQuickFeatTargetSelector(featName) {
      const container = document.getElementById('quick-feat-target-container');
      const select = document.getElementById('quick-feat-target-select');
      const titleEl = document.getElementById('quick-feat-target-title');
      const iconEl = document.getElementById('quick-feat-target-icon');
      if (!container || !select) return;

      const t = String(featName || '').trim();
      const lower = t.toLowerCase();
      const isWeaponFeat = /^(weapon focus|greater weapon focus|weapon specialization|greater weapon specialization|improved critical|exotic weapon proficiency)/i.test(lower);

      if (!isWeaponFeat) {
        container.classList.add('hidden');
        return;
      }

      const isExotic = /exotic weapon proficiency/i.test(lower);
      const match = t.match(/\((.*?)\)/);
      const currentTarget = match ? match[1].trim() : '';

      if (titleEl) titleEl.textContent = isExotic ? 'Select Exotic Weapon' : 'Select Target Weapon';
      if (iconEl) iconEl.textContent = isExotic ? '🗡️' : '⚔️';

      select.innerHTML = '<option value="">-- Select a Weapon --</option>';

      if (isExotic) {
        const exoticWeapons = getAvailableExoticWeapons();
        const charWeps = (character.weapons || []).map(w => (w.name || '').replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim()).filter(Boolean);
        const charExotics = charWeps.filter(cw => exoticWeapons.some(ew => ew.toLowerCase() === cw.toLowerCase()));
        if (charExotics.length > 0) {
          const grpChar = document.createElement('optgroup');
          grpChar.label = '⚔️ Equipped / Inventory Exotic Weapons';
          [...new Set(charExotics)].forEach(w => {
            const opt = document.createElement('option');
            opt.value = w;
            opt.textContent = `${w} (Equipped)`;
            if (currentTarget.toLowerCase() === w.toLowerCase()) opt.selected = true;
            grpChar.appendChild(opt);
          });
          select.appendChild(grpChar);
        }

        const grpAll = document.createElement('optgroup');
        grpAll.label = '🗡️ D&D 3.5e Exotic Weapon Compendium';
        exoticWeapons.forEach(w => {
          const opt = document.createElement('option');
          opt.value = w;
          opt.textContent = w;
          if (currentTarget.toLowerCase() === w.toLowerCase()) opt.selected = true;
          grpAll.appendChild(opt);
        });
        select.appendChild(grpAll);
      } else {
        const charWeps = (character.weapons || []).map(w => (w.name || '').replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim()).filter(Boolean);
        const uniqueCharWeps = [...new Set(charWeps)];
        if (uniqueCharWeps.length > 0) {
          const grpChar = document.createElement('optgroup');
          grpChar.label = '⚔️ Equipped / Inventory Weapons';
          uniqueCharWeps.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w;
            opt.textContent = `${w} (Equipped)`;
            if (currentTarget.toLowerCase() === w.toLowerCase()) opt.selected = true;
            grpChar.appendChild(opt);
          });
          select.appendChild(grpChar);
        }

        const allWeapons = getAvailableTargetWeapons(false);
        const grpAll = document.createElement('optgroup');
        grpAll.label = '📚 All D&D 3.5e Weapons';
        allWeapons.forEach(w => {
          const opt = document.createElement('option');
          opt.value = w;
          opt.textContent = w;
          if (currentTarget.toLowerCase() === w.toLowerCase()) opt.selected = true;
          grpAll.appendChild(opt);
        });
        select.appendChild(grpAll);
      }

      container.classList.remove('hidden');
    }

    function onQuickFeatTargetSelectChange(targetWeapon) {
      const nameInput = document.getElementById('quick-feat-name');
      if (!nameInput) return;
      const currentVal = nameInput.value.trim();
      const baseName = currentVal.replace(/\(.*?\)/g, '').trim() || 'Exotic Weapon Proficiency';

      if (targetWeapon) {
        nameInput.value = `${baseName} (${targetWeapon})`;
        const benefitInput = document.getElementById('quick-feat-benefit');
        if (benefitInput) {
          if (/exotic weapon proficiency/i.test(baseName)) {
            benefitInput.value = `You make attack rolls with the ${targetWeapon} normally (without the -4 nonproficiency penalty).`;
          } else if (/weapon focus/i.test(baseName)) {
            benefitInput.value = `You gain a +1 bonus on all attack rolls you make using the selected weapon (${targetWeapon}).`;
          } else if (/improved critical/i.test(baseName)) {
            benefitInput.value = `Doubles the critical threat range of the selected weapon (${targetWeapon}).`;
          }
        }
      } else {
        nameInput.value = baseName;
      }
      quickFeatSearchQuery = nameInput.value;
      updateQuickFeatPrereqBadge();
    }

    let isQuickFeatTargetLocked = false;
    let activeQuickFeatTargetSlot = null;
    let activeQuickFeatSlotContract = null;

    function unlockQuickFeatCategorySelection() {
      isQuickFeatTargetLocked = false;
      activeQuickFeatTargetSlot = null;
      const catSel = document.getElementById('quick-feat-category');
      if (catSel) {
        catSel.disabled = false;
        catSel.classList.remove('opacity-60', 'cursor-not-allowed');
      }
      const banner = document.getElementById('quick-feat-target-notice-banner');
      if (banner) {
        banner.className = 'p-2 rounded-xl border border-slate-700/80 bg-slate-900/60 text-xs flex items-center justify-between gap-2 shadow-sm transition';
        const titleEl = document.getElementById('quick-feat-target-notice-title');
        const descEl = document.getElementById('quick-feat-target-notice-desc');
        const iconEl = document.getElementById('quick-feat-target-notice-icon');
        const unlockBtn = document.getElementById('quick-feat-unlock-btn');
        if (iconEl) iconEl.textContent = '🔓';
        if (titleEl) titleEl.textContent = 'Unlocked Category Mode';
        if (descEl) descEl.textContent = 'You may freely choose any category from the dropdown menu below.';
        if (unlockBtn) unlockBtn.classList.add('hidden');
      }
    }

    function openQuickFeatPickerForLevel(levelIdx, preferredCategory = null, isTargetLocked = null) {
      activeQuickLevelIndex = Number(levelIdx);
      const modal = document.getElementById('quick-level-feat-modal');
      if (!modal) return;

      const lvlObj = character.levelProgression && character.levelProgression[activeQuickLevelIndex];
      const lvlNum = lvlObj ? lvlObj.level : (activeQuickLevelIndex + 1);
      const className = lvlObj ? lvlObj.className : 'Class';

      const titleEl = document.getElementById('quick-feat-modal-title');
      if (titleEl) titleEl.textContent = `Add Feat for Level ${lvlNum} (${className})`;
      const subtitleEl = document.getElementById('quick-feat-modal-subtitle');
      if (subtitleEl) subtitleEl.textContent = `Spotlight Search, RAW Prerequisite Validation & Rule Master AI`;

      // Update Warlock category state for this level
      if (typeof updateQuickFeatCategoryWarlockState === 'function') {
        updateQuickFeatCategoryWarlockState(activeQuickLevelIndex);
      }
      const isWarlockAllowed = (typeof isWarlockEnabledForLevel === 'function')
        ? isWarlockEnabledForLevel(activeQuickLevelIndex)
        : false;

      // Check current level progression slots status to auto-detect unfilled slot if needed
      let classLevelSoFar = 0;
      const prog = character.levelProgression || [];
      for (let i = 0; i <= activeQuickLevelIndex; i++) {
        if (prog[i] && prog[i].className === className) classLevelSoFar++;
      }
      const classFeats = (typeof RuleEngine !== 'undefined' && RuleEngine.getClassLevelFeatures)
        ? RuleEngine.getClassLevelFeatures(className, classLevelSoFar)
        : { hasBonusFeat: false, bonusFeatContract: null };
      const qualifiesForClassBonus = Boolean(classFeats.hasBonusFeat);
      const slotContract = classFeats.bonusFeatContract || null;
      activeQuickFeatSlotContract = (preferredCategory === 'Class Bonus Feat') ? slotContract : null;

      const regularFeats = [];
      const classBonusFeats = [];
      const otherBonusFeats = [];
      ((lvlObj && lvlObj.feats) || []).forEach(fStr => {
        const str = String(fStr);
        if (str.includes('+1 Stat') || str.includes('Stat:')) return;
        if (str.includes('[Bonus]') || str.includes('Bonus')) {
          classBonusFeats.push(fStr);
        } else if (str.includes('[DM Boon]') || str.includes('Boon') || str.includes('DM Grant')) {
          otherBonusFeats.push(fStr);
        } else if (str.includes('[Flaw]') || str.includes('Flaw:') ||
            str.includes('[Racial]') ||
            str.includes('[Invocation]') || str.includes('Invocation') ||
            str.includes('Caster Lvl') || str.includes('+1 Primary CL') || str.includes('🔮')) {
          otherBonusFeats.push(fStr);
        } else {
          regularFeats.push(fStr);
        }
      });

      const featMode = character.settings?.featMode || 'Standard 3.5e (1, 3, 6, 9, 12, 15, 18)';
      const qualifiesForRegularFeat = isLevelQualifiesForFeat(lvlNum, featMode);
      const isHuman = (character.race || '').toLowerCase().includes('human');
      const qualifiesForHumanBonus = (lvlNum === 1 && isHuman);
      const hasRacialBonus = otherBonusFeats.some(f => String(f).includes('[Racial]'));

      // If preferredCategory is not explicitly passed (e.g. from general row ➕ button), auto-detect first unfilled slot:
      if (!preferredCategory) {
        if (qualifiesForClassBonus && classBonusFeats.length === 0) {
          preferredCategory = 'Class Bonus Feat';
          if (isTargetLocked === null) isTargetLocked = true;
        } else if (qualifiesForRegularFeat && regularFeats.length === 0) {
          preferredCategory = 'Regular Feat';
          if (isTargetLocked === null) isTargetLocked = true;
        } else if (qualifiesForHumanBonus && !hasRacialBonus) {
          preferredCategory = 'Racial Trait';
          if (isTargetLocked === null) isTargetLocked = true;
        } else {
          // All standard slots for this level are already filled -> DM Boon / Campaign Grant
          preferredCategory = 'DM Boon';
          if (isTargetLocked === null) isTargetLocked = false;
        }
      } else {
        if (isTargetLocked === null) isTargetLocked = true;
      }

      isQuickFeatTargetLocked = Boolean(isTargetLocked);
      activeQuickFeatTargetSlot = preferredCategory;

      const catSel = document.getElementById('quick-feat-category');
      if (catSel) {
        if (preferredCategory === 'Warlock Invocation' && !isWarlockAllowed) {
          catSel.value = 'Regular Feat';
        } else {
          catSel.value = preferredCategory || 'Regular Feat';
        }

        // Configure options text & notice regarding slot fullness
        const optRegular = document.getElementById('quick-feat-opt-regular');
        const optClass = document.getElementById('quick-feat-opt-class');
        const optRacial = document.getElementById('quick-feat-opt-racial');

        if (optRegular) {
          const isRegFull = qualifiesForRegularFeat && regularFeats.length > 0;
          optRegular.textContent = isRegFull ? '🎖️ Normal Feat (Bu Seviyede Yuva Dolu)' : '🎖️ Normal Feat (Regular Feat)';
        }
        if (optClass) {
          const isClassFull = qualifiesForClassBonus && classBonusFeats.length > 0;
          optClass.textContent = isClassFull ? `⚔️ ${className} Bonus Feati (Bu Seviyede Yuva Dolu)` : `⚔️ ${className} Bonus Feati (Class Bonus Feat)`;
        }
        if (optRacial) {
          optRacial.textContent = hasRacialBonus ? '🧬 Human Bonus Feat (Slot Filled at This Level)' : '🧬 Human Bonus Feat (Racial Bonus)';
        }

        if (isQuickFeatTargetLocked) {
          catSel.disabled = true;
          catSel.classList.add('opacity-60', 'cursor-not-allowed');
        } else {
          catSel.disabled = false;
          catSel.classList.remove('opacity-60', 'cursor-not-allowed');
        }
      }

      // Configure Target Notice Banner UI
      const banner = document.getElementById('quick-feat-target-notice-banner');
      const titleNoticeEl = document.getElementById('quick-feat-target-notice-title');
      const descNoticeEl = document.getElementById('quick-feat-target-notice-desc');
      const iconNoticeEl = document.getElementById('quick-feat-target-notice-icon');
      const unlockBtn = document.getElementById('quick-feat-unlock-btn');

      if (banner) {
        banner.classList.remove('hidden');
        if (isQuickFeatTargetLocked) {
          if (unlockBtn) unlockBtn.classList.remove('hidden');

          if (preferredCategory === 'Class Bonus Feat') {
            const contractLabel = activeQuickFeatSlotContract?.label || `${className} Class Bonus Feat`;
            const contractDesc = activeQuickFeatSlotContract?.desc || `Select an eligible class bonus feat for ${className}. The slot will be filled automatically.`;
            const isExact = activeQuickFeatSlotContract?.mode === 'exact_choices';
            banner.className = `p-2.5 rounded-xl border ${isExact ? 'border-emerald-500/70 bg-emerald-950/70' : 'border-amber-500/70 bg-amber-950/70'} text-xs flex items-center justify-between gap-2 shadow-md transition`;
            if (iconNoticeEl) iconNoticeEl.textContent = isExact ? '🥋' : '⚔️';
            if (titleNoticeEl) titleNoticeEl.textContent = `Hedef Yuva: ${contractLabel}`;
            if (descNoticeEl) descNoticeEl.textContent = contractDesc;
          } else if (preferredCategory === 'Regular Feat') {
            banner.className = 'p-2.5 rounded-xl border border-purple-500/70 bg-purple-950/70 text-xs flex items-center justify-between gap-2 shadow-md transition';
            if (iconNoticeEl) iconNoticeEl.textContent = '🎖️';
            if (titleNoticeEl) titleNoticeEl.textContent = `Hedef Yuva: Standart Feat (${lvlNum}. Seviye)`;
            if (descNoticeEl) descNoticeEl.textContent = `Standard character feat slot gained via D&D 3.5e RAW level progression (Levels 1, 3, 6, 9, 12, 15, 18).`;
          } else if (preferredCategory === 'Racial Trait') {
            banner.className = 'p-2.5 rounded-xl border border-teal-500/70 bg-teal-950/70 text-xs flex items-center justify-between gap-2 shadow-md transition';
            if (iconNoticeEl) iconNoticeEl.textContent = '🧬';
            if (titleNoticeEl) titleNoticeEl.textContent = `Target Slot: Human Racial Bonus Feat`;
            if (descNoticeEl) descNoticeEl.textContent = `Bonus feat slot granted to Humans at 1st level (any feat for which you meet the prerequisites).`;
          } else if (preferredCategory === 'Warlock Invocation') {
            banner.className = 'p-2.5 rounded-xl border border-indigo-500/70 bg-indigo-950/70 text-xs flex items-center justify-between gap-2 shadow-md transition';
            if (iconNoticeEl) iconNoticeEl.textContent = '🔮';
            if (titleNoticeEl) titleNoticeEl.textContent = `Target Slot: Warlock Invocation`;
            if (descNoticeEl) descNoticeEl.textContent = `Warlock Invocation slot for Level ${lvlNum}.`;
          } else if (preferredCategory === 'Special Ability') {
            banner.className = 'p-2.5 rounded-xl border border-sky-500/70 bg-sky-950/70 text-xs flex items-center justify-between gap-2 shadow-md transition';
            if (iconNoticeEl) iconNoticeEl.textContent = '✨';
            if (titleNoticeEl) titleNoticeEl.textContent = `Target Slot: Special Ability / Class Feature`;
            if (descNoticeEl) descNoticeEl.textContent = `Class feature, racial trait, or special rule note for this level.`;
          } else {
            banner.className = 'p-2.5 rounded-xl border border-amber-500/70 bg-amber-950/70 text-xs flex items-center justify-between gap-2 shadow-md transition';
            if (iconNoticeEl) iconNoticeEl.textContent = '🌟';
            if (titleNoticeEl) titleNoticeEl.textContent = `Target Slot: DM Boon / Grant`;
            if (descNoticeEl) descNoticeEl.textContent = `Special campaign boon or bonus feat granted by the DM.`;
          }
        } else {
          // Free mode
          banner.className = 'p-2 rounded-xl border border-slate-700/80 bg-slate-900/60 text-xs flex items-center justify-between gap-2 shadow-sm transition';
          if (iconNoticeEl) iconNoticeEl.textContent = '🔓';
          if (titleNoticeEl) titleNoticeEl.textContent = 'Serbest Kategori Modu (Kilit Yok)';
          if (descNoticeEl) descNoticeEl.textContent = 'Select any category from the dropdown below to add to this level.';
          if (unlockBtn) unlockBtn.classList.add('hidden');
        }
      }

      // Initial filter based on preferredCategory (default to QUALIFIED for Regular & Human Bonus Feats)
      if (preferredCategory === 'Class Bonus Feat') {
        quickFeatSearchFilter = 'FIGHTER';
      } else if (preferredCategory === 'DM Boon') {
        quickFeatSearchFilter = 'BOON';
      } else if (preferredCategory === 'Flaw') {
        quickFeatSearchFilter = 'FLAW';
      } else if (preferredCategory === 'Warlock Invocation') {
        quickFeatSearchFilter = 'INVOCATION';
      } else if (preferredCategory === 'Regular Feat' || preferredCategory === 'Racial Trait') {
        quickFeatSearchFilter = 'QUALIFIED';
      } else {
        quickFeatSearchFilter = 'ALL';
      }

      const nameInput = document.getElementById('quick-feat-name');
      if (nameInput) nameInput.value = '';
      quickFeatSearchQuery = '';

      const benefitInput = document.getElementById('quick-feat-benefit');
      if (benefitInput) benefitInput.value = '';

      updateQuickFeatTargetSelector('');
      updateQuickFeatPrereqBadge();
      openQuickFeatCatalogConsole();

      modal.classList.remove('hidden');
    }

    let quickFeatSearchFilter = 'ALL';
    let quickFeatSearchQuery = '';
    let isQuickFeatCatalogOpen = false;

    function openQuickAbilityPickerForLevel(levelIdx) {
      openQuickFeatPickerForLevel(levelIdx, 'Special Ability');
      const lvlObj = character.levelProgression && character.levelProgression[Number(levelIdx)];
      const lvlNum = lvlObj ? lvlObj.level : (Number(levelIdx) + 1);
      const className = lvlObj ? lvlObj.className : 'Class';
      const titleEl = document.getElementById('quick-feat-modal-title');
      if (titleEl) titleEl.textContent = `Add Special Ability / Feature for Level ${lvlNum} (${className})`;
      const subtitleEl = document.getElementById('quick-feat-modal-subtitle');
      if (subtitleEl) subtitleEl.textContent = `Add a class feature, special maneuver, DM boon, or rule note`;
    }

    function closeQuickLevelFeatModal() {
      const modal = document.getElementById('quick-level-feat-modal');
      if (modal) modal.classList.add('hidden');
      activeQuickLevelIndex = null;
      isFeatPickerForQuickLevel = false;
      closeQuickFeatCatalogConsole();
    }

    function openQuickFeatCatalogConsole() {
      isQuickFeatCatalogOpen = true;
      const consoleEl = document.getElementById('quick-feat-search-console');
      if (consoleEl) consoleEl.classList.remove('hidden');
      const toggleText = document.getElementById('quick-feat-catalog-toggle-text');
      if (toggleText) toggleText.textContent = 'Kapat ▲';
      renderQuickFeatSearchResults();
    }

    function closeQuickFeatCatalogConsole() {
      isQuickFeatCatalogOpen = false;
      const consoleEl = document.getElementById('quick-feat-search-console');
      if (consoleEl) consoleEl.classList.add('hidden');
      const toggleText = document.getElementById('quick-feat-catalog-toggle-text');
      if (toggleText) toggleText.textContent = 'Katalog ▼';
    }

    function toggleQuickFeatCatalogConsole() {
      if (isQuickFeatCatalogOpen) {
        closeQuickFeatCatalogConsole();
      } else {
        openQuickFeatCatalogConsole();
      }
    }

    function onQuickFeatSearchInput(val) {
      quickFeatSearchQuery = (val || '').trim();
      updateQuickFeatTargetSelector(val);
      if (!isQuickFeatCatalogOpen) {
        openQuickFeatCatalogConsole();
      } else {
        renderQuickFeatSearchResults();
      }
      updateQuickFeatPrereqBadge();
    }

    function setQuickFeatSearchFilter(filterType) {
      quickFeatSearchFilter = filterType;
      renderQuickFeatSearchResults();
    }

    function onQuickFeatCategoryChange() {
      const catVal = document.getElementById('quick-feat-category')?.value || 'Regular Feat';
      if (catVal === 'Class Bonus Feat') {
        quickFeatSearchFilter = 'FIGHTER';
      } else if (catVal === 'DM Boon') {
        quickFeatSearchFilter = 'BOON';
      } else if (catVal === 'Flaw') {
        quickFeatSearchFilter = 'FLAW';
      } else if (catVal === 'Warlock Invocation') {
        quickFeatSearchFilter = 'INVOCATION';
      } else {
        quickFeatSearchFilter = 'ALL';
      }
      renderQuickFeatSearchResults();
    }

    function clearQuickLevelFeatSelection() {
      const nameInput = document.getElementById('quick-feat-name');
      if (nameInput) nameInput.value = '';
      const benefitInput = document.getElementById('quick-feat-benefit');
      if (benefitInput) benefitInput.value = '';
      quickFeatSearchQuery = '';
      updateQuickFeatTargetSelector('');
      updateQuickFeatPrereqBadge();
      renderQuickFeatSearchResults();
    }

    function renderQuickFeatSearchResults() {
      const consoleEl = document.getElementById('quick-feat-search-console');
      if (!consoleEl) return;

      const query = (quickFeatSearchQuery || document.getElementById('quick-feat-name')?.value || '').toLowerCase().trim();
      const activeFilter = quickFeatSearchFilter || 'ALL';
      const categoryVal = document.getElementById('quick-feat-category')?.value || 'Regular Feat';

      const combined = getCombinedFeatCatalog();

      // Parametric classification predicates
      const isFighterFeat = f => Boolean(f.isFighterBonusFeat === true || f.category === 'Fighter' || f.category === 'Martial');
      const isBoonFeat = f => Boolean(f.category === 'DM Boon' || f.category === 'DM Grant' || f.type === 'DM Grant' || (f.source && f.source.toLowerCase().includes('campaign')));
      const isFlawFeat = f => Boolean(f.category === 'Flaw' || f.type === 'Flaw' || (f.name || '').toLowerCase().startsWith('flaw:'));

      // Warlock Invocations are ONLY allowed when the slot is explicitly 'Warlock Invocation' or 'DM Boon' (NEVER in Regular Feat, Human Bonus Feat / Racial Trait, or Class Bonus Feat)
      let invocationsList = [];
      const isStandardFeatSlot = ['Regular Feat', 'Racial Trait', 'Class Bonus Feat', 'Flaw'].includes(categoryVal);
      const warlockAllowedHere = !isStandardFeatSlot && ((typeof isWarlockEnabledForLevel === 'function') ? isWarlockEnabledForLevel(activeQuickLevelIndex) : false);
      if (warlockAllowedHere) {
        const prog = character.levelProgression || [];
        const limitIdx = (activeQuickLevelIndex !== null && activeQuickLevelIndex !== undefined) ? Number(activeQuickLevelIndex) : (prog.length - 1);
        let warlockClassLvl = 0;
        for (let i = 0; i <= limitIdx && i < prog.length; i++) {
          if (prog[i] && prog[i].active !== false && (prog[i].className || '').toLowerCase() === 'warlock') {
            warlockClassLvl++;
          }
        }
        if (warlockClassLvl === 0 && warlockAllowedHere) {
          // Warlock Boon active on non-Warlock class: use character level at limitIdx
          warlockClassLvl = Math.max(1, limitIdx + 1);
        }
        const maxTier = (typeof getWarlockMaxTierForLevel === 'function') ? getWarlockMaxTierForLevel(warlockClassLvl) : 'Least';
        const tierHierarchy = ['Least', 'Lesser', 'Greater', 'Dark'];
        const maxIdx = tierHierarchy.indexOf(maxTier);
        invocationsList = getAllWarlockInvocations().filter(inv => {
          const invIdx = tierHierarchy.indexOf(inv.tier);
          return invIdx !== -1 && invIdx <= maxIdx;
        }).map(inv => ({
          name: inv.name,
          category: 'Warlock Invocation',
          type: 'Warlock Invocation',
          tier: inv.tier,
          minLevel: inv.minLevel || (inv.tier === 'Dark' ? 16 : (inv.tier === 'Greater' ? 11 : (inv.tier === 'Lesser' ? 6 : 1))),
          benefit: inv.desc || inv.benefit || inv.shortDescription || '',
          source: inv.source || 'Complete Arcane',
          prereq: inv.prerequisites || inv.prereq || (`Warlock Level ${inv.minLevel || 1}`)
        }));
      }

      // Base candidate pool
      let baseList = combined;
      if (categoryVal === 'Warlock Invocation' || activeFilter === 'INVOCATION') {
        baseList = invocationsList.length > 0 ? invocationsList : combined;
      } else if (categoryVal === 'DM Boon') {
        baseList = combined.filter(isBoonFeat);
      } else if (categoryVal === 'Flaw') {
        baseList = combined.filter(isFlawFeat);
      } else if (categoryVal === 'Class Bonus Feat') {
        if (activeQuickFeatSlotContract && activeQuickFeatSlotContract.mode === 'exact_choices') {
          const choiceSet = new Set(activeQuickFeatSlotContract.choices.map(c => c.toLowerCase()));
          baseList = combined.filter(f => choiceSet.has((f.name || '').toLowerCase()));
          // If any exact choices are missing from combined catalog, synthesize them cleanly
          activeQuickFeatSlotContract.choices.forEach(cName => {
            if (!baseList.some(item => (item.name || '').toLowerCase() === cName.toLowerCase())) {
              baseList.push({
                name: cName,
                category: 'Class Bonus Feat',
                type: 'Feat',
                prereq: 'RAW Class Exemption',
                benefit: `${cName} (Official D&D 3.5e RAW class bonus feat).`,
                source: 'PHB'
              });
            }
          });
        } else if (activeQuickFeatSlotContract && activeQuickFeatSlotContract.mode === 'category') {
          const allowedCats = new Set((activeQuickFeatSlotContract.categories || []).map(c => c.toLowerCase()));
          const allowedNames = new Set((activeQuickFeatSlotContract.allowFeats || []).map(n => n.toLowerCase()));
          baseList = combined.filter(f => {
            const c = (f.category || f.type || '').toLowerCase();
            const n = (f.name || '').toLowerCase();
            return allowedCats.has(c) || allowedNames.has(n);
          });
        } else {
          baseList = combined.filter(isFighterFeat);
        }
      } else if (categoryVal === 'Special Ability') {
        baseList = combined.filter(f => f.category === 'Special Ability' || f.type === 'Special Ability');
        if (baseList.length === 0) baseList = combined;
      } else if (categoryVal === 'Racial Trait') {
        // D&D 3.5e RAW (PHB p.12-13): Human and racial bonus feats have NO category restrictions (can choose any qualified feat)
        baseList = combined;
      }

      // Filter by query
      let queryFiltered = [...baseList];
      if (query) {
        queryFiltered = baseList.filter(f => {
          const n = (f.name || '').toLowerCase();
          const b = (f.benefit || f.desc || '').toLowerCase();
          const s = (f.source || '').toLowerCase();
          const p = (f.prereq || '').toLowerCase();
          return n.includes(query) || b.includes(query) || s.includes(query) || p.includes(query);
        });

        // Dynamic exotic weapon suggestion if query matches an exotic weapon
        const exoticWeapons = getAvailableExoticWeapons();
        const matchedExotics = exoticWeapons.filter(w => w.toLowerCase().includes(query));
        matchedExotics.forEach(ew => {
          const synthName = `Exotic Weapon Proficiency (${ew})`;
          if (!queryFiltered.some(item => item.name.toLowerCase() === synthName.toLowerCase())) {
            queryFiltered.unshift({
              name: synthName,
              category: 'Fighter',
              type: 'Feat',
              isFighterBonusFeat: true,
              prereq: 'BAB +1',
              source: 'PHB p.94 / RAW',
              benefit: `You make attack rolls with the ${ew} normally (without the -4 nonproficiency penalty).`
            });
          }
        });
      }

      // Prerequisite evaluation with targetLevelIdx
      const evaluatedItems = queryFiltered.map(item => {
        const pEval = checkFeatPrerequisites(item, 0, activeQuickLevelIndex);
        return { item, pEval };
      });

      // Filter counts (excluding already known feats from class from the Qualified count)
      const countAll = evaluatedItems.length;
      const countQualified = evaluatedItems.filter(e => e.pEval.allMet && !e.pEval.isAlreadyKnownFromClass).length;
      const countFighter = evaluatedItems.filter(e => isFighterFeat(e.item)).length;
      const countBoon = evaluatedItems.filter(e => isBoonFeat(e.item)).length;
      const countFlaw = evaluatedItems.filter(e => isFlawFeat(e.item)).length;
      const countInvocation = evaluatedItems.filter(e => e.item.category === 'Warlock Invocation').length;

      // Apply active filter pill
      let filteredItems = evaluatedItems;
      if (activeFilter === 'QUALIFIED') {
        filteredItems = evaluatedItems.filter(e => e.pEval.allMet && !e.pEval.isAlreadyKnownFromClass);
      } else if (activeFilter === 'FIGHTER') {
        filteredItems = evaluatedItems.filter(e => isFighterFeat(e.item));
      } else if (activeFilter === 'BOON') {
        filteredItems = evaluatedItems.filter(e => isBoonFeat(e.item));
      } else if (activeFilter === 'FLAW') {
        filteredItems = evaluatedItems.filter(e => isFlawFeat(e.item));
      } else if (activeFilter === 'INVOCATION') {
        filteredItems = evaluatedItems.filter(e => e.item.category === 'Warlock Invocation');
      }

      // Sort: Truly eligible first, then already known from class, then unqualified, then search relevance, then alphabetically
      filteredItems.sort((a, b) => {
        const aQual = a.pEval.allMet && !a.pEval.isAlreadyKnownFromClass;
        const bQual = b.pEval.allMet && !b.pEval.isAlreadyKnownFromClass;
        if (aQual && !bQual) return -1;
        if (!aQual && bQual) return 1;
        if (a.pEval.isAlreadyKnownFromClass && !b.pEval.isAlreadyKnownFromClass) return 1;
        if (!a.pEval.isAlreadyKnownFromClass && b.pEval.isAlreadyKnownFromClass) return -1;

        if (query) {
          const aScore = getFeatSearchRelevance(a.item, query);
          const bScore = getFeatSearchRelevance(b.item, query);
          if (aScore !== bScore) {
            return bScore - aScore;
          }
        }

        return (a.item.name || '').localeCompare(b.item.name || '');
      });

      const filterPillClass = (tab) => activeFilter === tab
        ? 'px-2 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-white shadow'
        : 'px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer';

      let listHtml = '';
      if (filteredItems.length === 0) {
        listHtml = `
          <div class="p-3 text-center text-xs text-slate-400 bg-slate-950/60 rounded-lg border border-slate-800">
            <span>No matching feat found in local compendium for "${query || 'Filter'}".</span>
          </div>
        `;
      } else {
        listHtml = filteredItems.map(({ item, pEval }) => {
          const isAlreadyKnown = Boolean(pEval.isAlreadyKnownFromClass);
          const isQualified = pEval.allMet && !isAlreadyKnown;
          const safeName = (item.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
          let badgeClass = 'bg-rose-950/80 text-rose-300 border-rose-600/60';
          let badgeText = '⚠️ Prereqs Not Met';
          if (isAlreadyKnown) {
            badgeClass = 'bg-blue-950/80 text-blue-300 border-blue-600/60';
            badgeText = pEval.alreadyKnownBadgeText || (pEval.isAlreadyTaken ? '🔒 Already Owned' : '🔒 Class Proficiency (Owned)');
          } else if (isQualified) {
            badgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';
            badgeText = '✅ Qualified';
          }

          const prereqSummary = isAlreadyKnown
            ? `<div class="text-[9px] text-blue-300 pt-0.5">ℹ️ ${pEval.alreadyKnownReason || 'Your character already possesses this proficiency through class or existing feats.'}</div>`
            : (pEval.hasPrereqs
              ? `<div class="flex flex-wrap items-center gap-1 text-[9px] pt-1">
                   <span class="text-slate-400 font-semibold">Prereq:</span>
                   ${pEval.checks.map(c => `
                     <span class="px-1 py-0.2 rounded font-mono ${c.met ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/40' : 'bg-rose-950 text-rose-200 border border-rose-600 font-bold'}">
                       ${c.label} ${c.met ? '✓' : '✗'}
                     </span>
                   `).join('')}
                 </div>`
              : `<div class="text-[9px] text-slate-400 pt-0.5">No Prerequisites</div>`);

          const allowUnqualifiedOverride = (categoryVal === 'DM Boon');
          const buttonHtml = isAlreadyKnown
            ? `<button disabled type="button"
                       title="${(pEval.alreadyKnownReason || 'Zaten Sahipsiniz').replace(/"/g, '&quot;')}"
                       class="px-2.5 py-1 rounded text-[11px] font-bold shadow shrink-0 opacity-50 cursor-not-allowed bg-slate-800 text-slate-400 flex items-center gap-1">
                 <span>🔒</span>
                 <span>Zaten Sahipsiniz</span>
               </button>`
            : ((!isQualified && !allowUnqualifiedOverride)
              ? `<button disabled type="button"
                         title="D&D 3.5e RAW: Cannot select this feat because prerequisites are not met"
                         class="px-2.5 py-1 rounded text-[11px] font-bold shadow shrink-0 opacity-50 cursor-not-allowed bg-slate-800 text-rose-300/80 border border-rose-800/50 flex items-center gap-1">
                   <span>🔒</span>
                   <span>Prereqs Not Met</span>
                 </button>`
              : `<button type="button"
                         onclick="selectFeatForQuickLevel('${safeName}', true)"
                         title="${isQualified ? 'Add this feat to the level' : 'Add as DM Boon (bypasses prerequisites)'}"
                         class="px-2.5 py-1 rounded text-[11px] font-bold shadow transition shrink-0 cursor-pointer flex items-center gap-1 ${isQualified ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95' : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/40'}">
                   <span>${isQualified ? '🎯' : '🌟'}</span>
                   <span>${isQualified ? 'Select & Add' : 'Add as Boon'}</span>
                 </button>`);

          return `
            <div class="p-2.5 rounded-lg border transition ${isAlreadyKnown ? 'bg-slate-950/40 border-slate-800/80' : (isQualified ? 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/60' : 'bg-slate-950/50 hover:bg-slate-900/60 border-slate-800/80 hover:border-rose-600/40 opacity-85 hover:opacity-100')} space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-white text-xs">${item.name}</span>
                  <span class="text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeClass}">
                    ${badgeText}
                  </span>
                  <span class="text-[9px] text-indigo-300 bg-indigo-950/70 border border-indigo-700/50 px-1.5 py-0.2 rounded">
                    ${item.tier ? `${item.tier} Invocation` : (item.category || 'Feat')}
                  </span>
                  <span class="text-[9px] text-slate-400 font-mono">
                    ${item.source || '3.5e RAW'}
                  </span>
                </div>
                ${buttonHtml}
              </div>
              ${prereqSummary}
              ${item.benefit ? `<p class="text-[10px] text-slate-300 leading-relaxed line-clamp-2">${item.benefit}</p>` : ''}
            </div>
          `;
        }).join('');
      }

      consoleEl.innerHTML = `
        <!-- Filter Tabs -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-1.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" onclick="setQuickFeatSearchFilter('ALL')" class="${filterPillClass('ALL')}">
              📋 All (${countAll})
            </button>
            <button type="button" onclick="setQuickFeatSearchFilter('QUALIFIED')" class="${filterPillClass('QUALIFIED')}">
              ✅ Qualified (${countQualified})
            </button>
            <button type="button" onclick="setQuickFeatSearchFilter('FIGHTER')" class="${filterPillClass('FIGHTER')}">
              ⚔️ Fighter (${countFighter})
            </button>
            <button type="button" onclick="setQuickFeatSearchFilter('BOON')" class="${filterPillClass('BOON')}">
              🌟 DM Boon (${countBoon})
            </button>
            <button type="button" onclick="setQuickFeatSearchFilter('FLAW')" class="${filterPillClass('FLAW')}">
              ⚠️ Kusur (${countFlaw})
            </button>
            ${invocationsList.length > 0 ? `
              <button type="button" onclick="setQuickFeatSearchFilter('INVOCATION')" class="${filterPillClass('INVOCATION')}">
                🔮 Invocation (${countInvocation})
              </button>
            ` : ''}
          </div>
          <button type="button" onclick="closeQuickFeatCatalogConsole()" class="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition font-bold cursor-pointer">
            ▲ Kapat
          </button>
        </div>

        <!-- Feat Cards List -->
        <div class="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
          ${listHtml}
        </div>

        <!-- Rule Master AI Fallback -->
        <div class="pt-2 border-t border-slate-800/80 space-y-1.5">
          <button type="button"
                  onclick="triggerRuleMasterForQuickFeat()"
                  class="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-purple-400/40 shadow transition cursor-pointer active:scale-98">
            <span>⚡</span>
            <span>Fetch via Rule Master AI: "${query || 'New 3.5e Feat'}" (3.5e Compendium)</span>
          </button>
          <div id="quick-feat-ai-status" class="hidden text-xs p-2 rounded-lg"></div>
        </div>
      `;
    }

    function selectFeatForQuickLevel(featName, autoConfirm = true) {
      // Defensive RAW duplicate check
      const pEvalPre = (typeof checkFeatPrerequisites === 'function')
        ? checkFeatPrerequisites({ name: featName }, 0, activeQuickLevelIndex)
        : null;
      if (pEvalPre && pEvalPre.isAlreadyTaken) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Duplicate Feat Blocked',
            desc: pEvalPre.alreadyKnownReason || `"${featName}" featine zaten sahipsiniz.`,
            type: 'warning'
          });
        } else {
          console.warn(pEvalPre.alreadyKnownReason || `"${featName}" featine zaten sahipsiniz.`);
        }
        return;
      }
      const catalog = getCombinedFeatCatalog();
      let found = catalog.find(f => f.name.toLowerCase() === featName.toLowerCase() || f.name.toLowerCase() === featName.toLowerCase().replace(/\(.*?\)/g, '').trim());

      if (!found) {
        const inv = getAllWarlockInvocations().find(i => i.name.toLowerCase() === featName.toLowerCase());
        if (inv) {
          found = {
            name: inv.name,
            category: 'Warlock Invocation',
            benefit: inv.desc || inv.benefit || '',
            source: inv.source || 'Complete Arcane',
            prereq: inv.prerequisites || inv.prereq || (`Warlock Level ${inv.minLevel || 1}`)
          };
        }
      }

      const currentCatVal = document.getElementById('quick-feat-category')?.value || 'Regular Feat';
      if (found && found.category === 'Warlock Invocation' && currentCatVal !== 'Warlock Invocation' && currentCatVal !== 'DM Boon') {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Warlock Invocation Restricted',
            desc: `"${featName}" is a Warlock Invocation and cannot be selected in a Human Bonus Feat, Standard Feat, or Class Bonus Feat slot.`,
            type: 'warning'
          });
        }
        return;
      }
      if (currentCatVal !== 'DM Boon' && pEvalPre && !pEvalPre.allMet) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Prerequisites Not Met',
            desc: `Prerequisites not met for "${featName}" (${pEvalPre.rawPrereq || 'Missing Prerequisite'}).`,
            type: 'warning'
          });
        }
        return;
      }

      const nameInput = document.getElementById('quick-feat-name');
      if (nameInput) nameInput.value = featName;

      const benefitInput = document.getElementById('quick-feat-benefit');
      if (benefitInput) benefitInput.value = found ? (found.benefit || '') : '';

      const catSel = document.getElementById('quick-feat-category');
      if (catSel && found) {
        // If locked to a specific target slot, preserve target category so it fills the right slot!
        if (!isQuickFeatTargetLocked) {
          if (found.category === 'Warlock Invocation') {
            catSel.value = 'Warlock Invocation';
          } else if (found.category === 'DM Boon' || found.category === 'DM Grant') {
            catSel.value = 'DM Boon';
          } else if (found.category === 'Flaw') {
            catSel.value = 'Flaw';
          } else if (found.category === 'Special Ability') {
            catSel.value = 'Special Ability';
          } else if (found.category === 'Racial Trait') {
            catSel.value = 'Racial Trait';
          }
        }
      }

      quickFeatSearchQuery = featName;
      updateQuickFeatTargetSelector(featName);
      updateQuickFeatPrereqBadge();

      // Check if this feat requires choosing a target weapon
      const lower = String(featName || '').toLowerCase().trim();
      const isWeaponFeat = /^(weapon focus|greater weapon focus|weapon specialization|greater weapon specialization|improved critical|exotic weapon proficiency|martial weapon proficiency)/i.test(lower);
      const hasTargetInParentheses = featName.includes('(') && featName.includes(')');
      const needsTargetSelection = isWeaponFeat && !hasTargetInParentheses;

      if (needsTargetSelection) {
        // Needs target weapon selection: keep modal open and highlight target selector
        closeQuickFeatCatalogConsole();
        const targetSelect = document.getElementById('quick-feat-target-select');
        if (targetSelect) targetSelect.focus();
        const targetContainer = document.getElementById('quick-feat-target-container');
        if (targetContainer) {
          targetContainer.classList.add('ring-2', 'ring-amber-400');
          setTimeout(() => targetContainer.classList.remove('ring-2', 'ring-amber-400'), 2000);
        }
      } else if (autoConfirm) {
        // Option 1: Direct 1-click addition into the level row!
        confirmQuickLevelFeat(featName);
      } else {
        closeQuickFeatCatalogConsole();
      }
    }

    function updateQuickFeatPrereqBadge() {
      const badgeEl = document.getElementById('quick-feat-prereq-badge');
      if (!badgeEl) return;

      const featName = (document.getElementById('quick-feat-name')?.value || '').trim();
      if (!featName) {
        badgeEl.innerHTML = '';
        return;
      }

      const catalog = getCombinedFeatCatalog();
      let found = catalog.find(f => f.name.toLowerCase() === featName.toLowerCase());
      if (!found) {
        found = catalog.find(f => f.name.toLowerCase() === featName.toLowerCase().replace(/\(.*?\)/g, '').trim());
      }

      if (!found) {
        const inv = getAllWarlockInvocations().find(i => i.name.toLowerCase() === featName.toLowerCase());
        if (inv) {
          found = {
            name: inv.name,
            category: 'Warlock Invocation',
            prereq: inv.prerequisites || inv.prereq || (`Warlock Level ${inv.minLevel || 1}`),
            benefit: inv.desc || inv.benefit || ''
          };
        }
      }

      if (!found) {
        found = { name: featName, prereq: '-', benefit: '' };
      }

      const pEval = checkFeatPrerequisites(found, 0, activeQuickLevelIndex);

      if (!pEval.hasPrereqs) {
        badgeEl.innerHTML = `
          <div class="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1">
            <span>ℹ️</span>
            <span>No Prerequisites: Can be selected freely by any eligible character.</span>
          </div>
        `;
      } else if (pEval.allMet) {
        badgeEl.innerHTML = `
          <div class="flex flex-wrap items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-950/50 border border-emerald-700/60 rounded-lg px-2.5 py-1.5">
            <span class="font-bold flex items-center gap-1 shrink-0"><span>✅</span> <span>Prerequisites Met:</span></span>
            <div class="flex flex-wrap items-center gap-1">
              ${pEval.checks.map(c => `
                <span class="bg-emerald-900/60 text-emerald-200 border border-emerald-600/50 rounded px-1.5 py-0.5 font-mono text-[9px] flex items-center gap-0.5">
                  <span>${c.label}</span>
                  <span class="font-bold text-emerald-400">✓</span>
                  <span class="text-emerald-300/80 text-[8px]">${c.info}</span>
                </span>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        badgeEl.innerHTML = `
          <div class="flex flex-wrap items-center gap-1.5 text-[10px] text-rose-300 bg-rose-950/60 border border-rose-700/70 rounded-lg px-2.5 py-1.5">
            <span class="font-bold flex items-center gap-1 shrink-0"><span>⚠️</span> <span>Prerequisite Warning:</span></span>
            <div class="flex flex-wrap items-center gap-1">
              ${pEval.checks.map(c => `
                <span class="rounded px-1.5 py-0.5 font-mono text-[9px] flex items-center gap-0.5 ${c.met ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50' : 'bg-rose-950 text-rose-200 border border-rose-600 font-bold'}">
                  <span>${c.label}</span>
                  <span>${c.met ? '✓' : '✗'}</span>
                  <span class="text-[8px] opacity-90">${c.info}</span>
                </span>
              `).join('')}
            </div>
          </div>
        `;
      }
    }

    function populateQuickFeatCatalogSelect() {
      // Legacy compatibility stub
    }

    function onQuickFeatSelectChange() {
      // Legacy compatibility stub
    }

    function openFeatPickerForQuickModal() {
      isFeatPickerForQuickLevel = true;
      isFeatPickerForLevelUp = false;
      const modal = document.getElementById('feat-picker-modal');
      if (!modal) return;
      const titleEl = document.getElementById('feat-picker-modal-title');
      if (titleEl) {
        titleEl.textContent = 'Select Feat for Level Table';
      }
      renderFeatPickerList();
      modal.classList.remove('hidden');
    }

    function confirmQuickLevelFeat(explicitFeatName = null) {
      if (activeQuickLevelIndex === null || activeQuickLevelIndex === undefined) {
        console.warn("No valid level selected!");
        return;
      }
      if (!Array.isArray(character.levelProgression)) {
        character.levelProgression = [];
      }
      if (!character.levelProgression[activeQuickLevelIndex]) {
        character.levelProgression[activeQuickLevelIndex] = {
          level: Number(activeQuickLevelIndex) + 1,
          className: (character.classes ? character.classes.split(' ')[0] : 'Fighter'),
          hd: 'd10',
          hpGain: 10,
          feats: [],
          specialAbilities: [],
          active: true
        };
      }
      const nameInput = document.getElementById('quick-feat-name');
      let featName = explicitFeatName || (nameInput ? nameInput.value.trim() : '');
      if (!featName) {
        console.warn("Please enter a feat or ability name!");
        return;
      }

      // If targetable weapon feat without chosen target but target select has a value
      const targetSelect = document.getElementById('quick-feat-target-select');
      const isWeaponFeat = /^(weapon focus|greater weapon focus|weapon specialization|greater weapon specialization|improved critical|exotic weapon proficiency)/i.test(featName);
      if (isWeaponFeat && !featName.includes('(') && targetSelect && targetSelect.value) {
        featName = `${featName} (${targetSelect.value})`;
      }

      // Defensive RAW duplicate check
      const pEvalConfirm = (typeof checkFeatPrerequisites === 'function')
        ? checkFeatPrerequisites({ name: featName }, 0, activeQuickLevelIndex)
        : null;
      if (pEvalConfirm && pEvalConfirm.isAlreadyTaken) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Duplicate Feat Blocked',
            desc: pEvalConfirm.alreadyKnownReason || `"${featName}" featine zaten sahipsiniz.`,
            type: 'warning'
          });
        } else {
          console.warn(pEvalConfirm.alreadyKnownReason || `"${featName}" featine zaten sahipsiniz.`);
        }
        return;
      }

      const category = document.getElementById('quick-feat-category')?.value || 'Regular Feat';
      const benefit = document.getElementById('quick-feat-benefit')?.value.trim() || '';

      const isInvEntry = getAllWarlockInvocations().some(i => (i.name || '').toLowerCase() === featName.toLowerCase());
      if (isInvEntry && category !== 'Warlock Invocation' && category !== 'DM Boon') {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Warlock Invocation Restricted',
            desc: `"${featName}" is a Warlock Invocation and cannot be selected in a Human Bonus Feat, Standard Feat, or Class Bonus Feat slot.`,
            type: 'warning'
          });
        }
        return;
      }
      if (category !== 'DM Boon' && pEvalConfirm && !pEvalConfirm.allMet) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Prerequisites Not Met',
            desc: `Prerequisites not met for "${featName}" (${pEvalConfirm.rawPrereq || 'Missing Prerequisite'}).`,
            type: 'warning'
          });
        }
        return;
      }

      const row = character.levelProgression[activeQuickLevelIndex];
      if (!Array.isArray(row.feats)) row.feats = [];
      if (!Array.isArray(row.specialAbilities)) row.specialAbilities = [];

      let prefix = '';
      if (category === 'Class Bonus Feat') prefix = '⚔️ [Bonus] ';
      else if (category === 'DM Boon') prefix = '🌟 [DM Boon] ';
      else if (category === 'Flaw') prefix = '⚠️ [Flaw] ';
      else if (category === 'Racial Trait') prefix = '🧬 [Racial] ';
      else if (category === 'Special Ability') prefix = '✨ ';
      else if (category === 'Warlock Invocation') prefix = '🔮 [Invocation] ';
      else prefix = '🎖️ ';

      const formattedName = `${prefix}${featName}`;

      if (category === 'Special Ability') {
        row.specialAbilities.push(formattedName);
        if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];
        if (!character.specialAbilities.some(a => (typeof a === 'string' ? a : a.name).toLowerCase().trim() === featName.toLowerCase())) {
          character.specialAbilities.push({
            name: featName,
            category: 'Special Ability',
            benefit: benefit,
            source: `Level ${row.level} (${row.className})`
          });
        }
      } else if (category === 'Warlock Invocation') {
        row.feats.push(formattedName);
        if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];
        if (!character.specialAbilities.some(a => (typeof a === 'string' ? a : a.name).toLowerCase().trim() === featName.toLowerCase())) {
          character.specialAbilities.push({
            name: `${featName} (Invocation)`,
            category: 'Warlock Invocation',
            benefit: benefit,
            source: `Level ${row.level} (Warlock Boon)`
          });
        }
        if (!Array.isArray(character.feats)) character.feats = [];
        if (!character.feats.some(f => (typeof f === 'string' ? f : f.name).toLowerCase().trim() === featName.toLowerCase())) {
          character.feats.push({
            name: featName,
            category: 'Warlock Invocation',
            benefit: benefit,
            source: `Level ${row.level} (Warlock Boon)`
          });
        }
      } else {
        row.feats.push(formattedName);
        if (!Array.isArray(character.feats)) character.feats = [];
        if (!character.feats.some(f => (typeof f === 'string' ? f : f.name).toLowerCase().trim() === featName.toLowerCase())) {
          character.feats.push({
            name: featName,
            category: category,
            benefit: benefit,
            source: `Level ${row.level} (${row.className})`
          });
          if (featName.toLowerCase() === 'toughness' && character.hp) {
            if (character.hp.baseMax === undefined) character.hp.baseMax = (Number(character.hp.max) || 44) - (Number(character.hp.conBonusHp) || 0);
            character.hp.baseMax = (Number(character.hp.baseMax) || 0) + 3;
            character.hp.max = (Number(character.hp.baseMax) || 0) + (Number(character.hp.conBonusHp) || 0);
            character.hp.current = (Number(character.hp.current) || 0) + 3;
          }
        }
      }

      if (Array.isArray(masterDb)) {
        const clean = featName.toLowerCase().trim();
        const inCanonical = getCombinedFeatCatalog(true).some(f => (f.name || '').toLowerCase().trim() === clean);
        if (!inCanonical && !masterDb.some(m => (m.name || '').toLowerCase().trim() === clean)) {
          masterDb.push({
            name: featName,
            type: (category === 'Special Ability') ? 'Special Ability' : 'Feat',
            category: category,
            slot: 'None',
            prereq: (pEvalConfirm && pEvalConfirm.rawPrereq) ? pEvalConfirm.rawPrereq : '-',
            source: `Level ${row.level} (${row.className})`,
            benefit: benefit,
            description: benefit
          });
        }
      }

      closeQuickLevelFeatModal();
      recalculateCharacterClassSummary();
      saveStateToStorage(true);
      renderLevelProgression();
      renderAll();
    }

    function findInLocalCatalogsOrMasterDb(query) {
      if (!query) return null;
      const qLower = query.toLowerCase().trim();

      if (typeof RuleMaster !== 'undefined' && RuleMaster.canonicalDictionary) {
        let cleanKey = qLower;
        if (typeof RuleMaster.canonicalDictionary[cleanKey] === 'string') {
          cleanKey = RuleMaster.canonicalDictionary[cleanKey];
        }
        const entry = RuleMaster.canonicalDictionary[cleanKey];
        if (entry && typeof entry === 'object') {
          return {
            name: entry.name || cleanKey,
            category: entry.type || entry.category || 'Feat',
            benefit: entry.benefit || entry.description || '',
            source: entry.source || 'PHB'
          };
        }
      }

      if (Array.isArray(masterDb)) {
        const m = masterDb.find(item => (item.name || '').toLowerCase().trim() === qLower)
          || masterDb.find(item => (item.name || '').toLowerCase().includes(qLower));
        if (m) {
          return {
            name: m.name,
            category: m.type || m.category || 'Feat',
            benefit: m.benefit || m.description || '',
            source: m.source || 'Master DB'
          };
        }
      }

      if (typeof getCombinedFeatCatalog === 'function') {
        const cat = getCombinedFeatCatalog();
        const f = cat.find(item => (item.name || '').toLowerCase().trim() === qLower)
          || cat.find(item => (item.name || '').toLowerCase().includes(qLower));
        if (f) {
          return {
            name: f.name,
            category: f.category || 'Feat',
            benefit: f.benefit || '',
            source: f.source || 'Feat Catalog'
          };
        }
      }

      return null;
    }

    async function triggerRuleMasterForQuickFeat() {
      const nameInput = document.getElementById('quick-feat-name');
      const catSel = document.getElementById('quick-feat-category');
      const benefitInput = document.getElementById('quick-feat-benefit');
      const statusEl = document.getElementById('quick-feat-ai-status');

      const query = (nameInput?.value || '').trim();
      if (!query) {
        if (statusEl) {
          statusEl.className = 'mt-1.5 text-[11px] p-2 rounded-lg bg-amber-950/80 border border-amber-600/60 text-amber-200 block';
          statusEl.innerHTML = '⚠️ Please enter a feat or ability name to search.';
        } else {
          alert('⚠️ Please enter a feat or ability name to search.');
        }
        nameInput?.focus();
        return;
      }

      if (statusEl) {
        statusEl.className = 'mt-1.5 text-[11px] p-2 rounded-lg bg-indigo-950/80 border border-indigo-600/60 text-indigo-200 block animate-pulse';
        statusEl.innerHTML = `<span>⏳</span> <span>Searching "${query}"...</span>`;
      }

      // 1. Önce yerel veritabanları ve katalogları kontrol et
      const localMatch = findInLocalCatalogsOrMasterDb(query);
      if (localMatch) {
        if (nameInput) nameInput.value = localMatch.name;
        if (benefitInput) benefitInput.value = localMatch.benefit || '';
        if (catSel && localMatch.category) {
          const lcat = localMatch.category.toLowerCase();
          if (lcat.includes('special ability') || localMatch.category === 'Special Ability') {
            catSel.value = 'Special Ability';
          } else if (lcat.includes('flaw')) {
            catSel.value = 'Flaw';
          } else if (lcat.includes('boon')) {
            catSel.value = 'DM Boon';
          } else if (lcat.includes('racial')) {
            catSel.value = 'Racial Trait';
          }
        }
        updateQuickFeatTargetSelector(localMatch.name);
        updateQuickFeatPrereqBadge();
        if (statusEl) {
          statusEl.className = 'mt-1.5 text-[11px] p-2 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 block';
          statusEl.innerHTML = `<span>✅</span> Loaded <b>${localMatch.name}</b> (${localMatch.source || 'D&D 3.5e'}) from local compendium!`;
        }
        return;
      }

      // 2. Rule Master AI sorgusu
      const apiKey = (typeof RuleMaster !== 'undefined' && RuleMaster.getApiKey)
        ? RuleMaster.getApiKey()
        : (localStorage.getItem('gemini_api_key') || '');

      if (!apiKey) {
        if (statusEl) {
          statusEl.className = 'mt-1.5 text-[11px] p-2 rounded-lg bg-amber-950/80 border border-amber-600/60 text-amber-200 block';
          statusEl.innerHTML = `<span>⚠️</span> Not found in local compendium. Enter your Gemini API Key in Rule Master (top bar) to search via AI.`;
        }
        return;
      }

      try {
        const categoryHint = (catSel?.value === 'Special Ability') ? 'Special Ability' : 'Feat';
        const statusProxy = {
          set textContent(val) {
            if (statusEl) statusEl.innerHTML = `<span>⏳</span> <span>${val}</span>`;
          }
        };
        const rows = await RuleMaster.fetchSingleAiRuleRows(query, categoryHint, apiKey, statusProxy);
        if (rows && rows.length > 0) {
          const topRow = rows[0];
          const featName = topRow[0] || query;
          const featType = topRow[1] || 'Feat';
          const featSource = topRow[4] || 'D&D 3.5e';
          const featBenefit = topRow[5] || '';

          if (nameInput) nameInput.value = featName;
          if (benefitInput) benefitInput.value = featBenefit;
          if (catSel) {
            if (featType === 'Special Ability' || categoryHint === 'Special Ability') {
              catSel.value = 'Special Ability';
            } else if (catSel.value !== 'Class Bonus Feat' && catSel.value !== 'DM Boon' && catSel.value !== 'Flaw') {
              catSel.value = 'Regular Feat';
            }
          }

          if (Array.isArray(masterDb)) {
            const clean = featName.toLowerCase().trim();
            if (!masterDb.some(m => (m.name || '').toLowerCase().trim() === clean)) {
              masterDb.push({
                name: featName,
                type: featType,
                slot: 'None',
                prereq: topRow[2] || '-',
                source: featSource,
                benefit: featBenefit,
                description: featBenefit
              });
            }
          }

          updateQuickFeatTargetSelector(featName);
          updateQuickFeatPrereqBadge();

          if (statusEl) {
            statusEl.className = 'mt-1.5 text-[11px] p-2 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 block';
            statusEl.innerHTML = `<span>✨</span> Fetched <b>${featName}</b> [${featSource}] via Rule Master AI!`;
          }
        } else {
          if (statusEl) {
            statusEl.className = 'mt-1.5 text-[11px] p-2 rounded-lg bg-rose-950/80 border border-rose-600/60 text-rose-200 block';
            statusEl.innerHTML = `<span>❌</span> No official D&D 3.5e rule found for "${query}".`;
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.className = 'mt-1.5 text-[11px] p-2 rounded-lg bg-rose-950/80 border border-rose-600/60 text-rose-200 block';
          statusEl.innerHTML = `<span>⚠️</span> Hata: ${err.message || err}`;
        }
      }
    }const DND35_EXTRA_CLASSES = {
      "Duskblade": { hd: 8, bab: 1.0, fort: 'good', ref: 'poor', will: 'good', skills: 2, source: "Player's Handbook II p.19", features: "Arcane Attunement, Armored Mage (Light/Medium/Shield), Arcane Channeling, Quick Cast" },
      "Warblade": { hd: 12, bab: 1.0, fort: 'good', ref: 'poor', will: 'poor', skills: 4, source: "Tome of Battle p.20", features: "Battle Clarity, Weapon Aptitude, Uncanny Dodge, Battle Ardor" },
      "Crusader": { hd: 10, bab: 1.0, fort: 'good', ref: 'poor', will: 'poor', skills: 2, source: "Tome of Battle p.8", features: "Furious Counterstrike, Steely Resolve, Indomitable Soul, Zealous Surge" },
      "Swordsage": { hd: 8, bab: 0.75, fort: 'poor', ref: 'good', will: 'good', skills: 6, source: "Tome of Battle p.15", features: "Quick to Act, AC Bonus (Wis), Discipline Focus, Sense Magic" },
      "Beguiler": { hd: 6, bab: 0.5, fort: 'poor', ref: 'poor', will: 'good', skills: 6, source: "Player's Handbook II p.6", features: "Armored Mage, Trapfinding, Cloaked Casting, Surprise Casting" },
      "Factotum": { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'poor', skills: 6, source: "Dungeonscape p.14", features: "Inspiration, Cunning Insight, Cunning Knowledge, Trapfinding" },
      "Warlock": { hd: 6, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 2, source: "Complete Arcane p.5", features: "Eldritch Blast, Invocations, Detect Magic, Damage Reduction" },
      "Scout": { hd: 8, bab: 0.75, fort: 'poor', ref: 'good', will: 'poor', skills: 8, source: "Complete Adventurer p.10", features: "Skirmish, Trapfinding, Battle Fortitude, Uncanny Dodge, Fast Movement" },
      "Swashbuckler": { hd: 10, bab: 1.0, fort: 'good', ref: 'poor', will: 'poor', skills: 4, source: "Complete Warrior p.11", features: "Weapon Finesse, Grace, Insightful Strike, Dodge Bonus" },
      "Hexblade": { hd: 10, bab: 1.0, fort: 'poor', ref: 'poor', will: 'good', skills: 2, source: "Complete Warrior p.5", features: "Hexblade's Curse, Arcane Resistance, Mettle, Dark Companion" },
      "Spellthief": { hd: 6, bab: 0.75, fort: 'poor', ref: 'good', will: 'good', skills: 6, source: "Complete Adventurer p.13", features: "Sneak Attack, Steal Spell, Trapfinding, Steal Spell Effect" },
      "Warmage": { hd: 6, bab: 0.5, fort: 'poor', ref: 'poor', will: 'good', skills: 2, source: "Complete Arcane p.10", features: "Armored Mage, Warmage Edge, Advanced Learning" },
      "Favored Soul": { hd: 8, bab: 0.75, fort: 'good', ref: 'good', will: 'good', skills: 2, source: "Complete Divine p.6", features: "Deity's Weapon Focus, Energy Resistance, Wings" },
      "Dread Necromancer": { hd: 6, bab: 0.5, fort: 'poor', ref: 'poor', will: 'good', skills: 2, source: "Heroes of Horror p.84", features: "Charnel Touch, Rebuke Undead, Lich Body, Advanced Learning" },
      "Dragon Shaman": { hd: 10, bab: 0.75, fort: 'good', ref: 'poor', will: 'good', skills: 2, source: "Player's Handbook II p.11", features: "Draconic Aura, Totem Dragon, Touch of Vitality, Breath Weapon" },
      "Knight": { hd: 12, bab: 1.0, fort: 'good', ref: 'poor', will: 'good', skills: 2, source: "Player's Handbook II p.24", features: "Knight's Challenge, Knight's Code, Shield Block, Bulwark of Defense" },
      "Ninja": { hd: 6, bab: 0.75, fort: 'poor', ref: 'good', will: 'poor', skills: 6, source: "Complete Adventurer p.5", features: "Ki Power, Sudden Strike, Trapfinding, Ghost Step, Poison Use" },
      "Psion": { hd: 4, bab: 0.5, fort: 'poor', ref: 'poor', will: 'good', skills: 2, source: "XPH p.19", features: "Psicrystal, Psionic Feats, Powers" },
      "Psychic Warrior": { hd: 8, bab: 0.75, fort: 'good', ref: 'poor', will: 'poor', skills: 2, source: "XPH p.24", features: "Bonus Psionic Feats, Powers" },
      "Soulknife": { hd: 10, bab: 0.75, fort: 'poor', ref: 'good', will: 'good', skills: 4, source: "XPH p.26", features: "Mind Blade, Weapon Focus (Mind Blade), Wild Talent, Throw Mind Blade" },
      "Wilder": { hd: 6, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4, source: "XPH p.29", features: "Wild Surge, Psychic Enervation, Elation, Volatile Mind" },
      "Archmage": { hd: 4, bab: 0.5, fort: 'poor', ref: 'poor', will: 'good', skills: 2, source: "DMG p.178", features: "High Arcana, Arcane Fire, Mastery of Counterspelling, Mastery of Elements" },
      "Arcane Archer": { hd: 8, bab: 1.0, fort: 'good', ref: 'good', will: 'poor', skills: 4, source: "DMG p.176", features: "Enhance Arrow, Imbue Arrow, Seeker Arrow, Phase Arrow, Arrow of Death" },
      "Arcane Trickster": { hd: 4, bab: 0.5, fort: 'poor', ref: 'good', will: 'good', skills: 4, source: "DMG p.177", features: "Ranged Legerdemain, Sneak Attack, Impromptu Sneak Attack" },
      "Assassin": { hd: 6, bab: 0.75, fort: 'poor', ref: 'good', will: 'poor', skills: 4, source: "DMG p.180", features: "Sneak Attack, Death Attack, Poison Use, Uncanny Dodge" },
      "Blackguard": { hd: 10, bab: 1.0, fort: 'good', ref: 'poor', will: 'poor', skills: 2, source: "DMG p.181", features: "Smite Good, Dark Blessing, Command Undead, Aura of Despair, Sneak Attack" },
      "Dragon Disciple": { hd: 12, bab: 0.75, fort: 'good', ref: 'poor', will: 'good', skills: 2, source: "DMG p.183", features: "Natural Armor, Breath Weapon, Ability Boosts (Str/Con/Int/Cha), Wings, Dragon Apotheosis" },
      "Duelist": { hd: 10, bab: 1.0, fort: 'poor', ref: 'good', will: 'poor', skills: 4, source: "DMG p.185", features: "Canny Defense, Improved Reaction, Enhanced Mobility, Precise Strike, Acrobatic Charge" },
      "Eldritch Knight": { hd: 6, bab: 1.0, fort: 'good', ref: 'poor', will: 'poor', skills: 2, source: "DMG p.187", features: "Bonus Combat Feat, Spellcasting Progression" },
      "Hierophant": { hd: 8, bab: 0.5, fort: 'good', ref: 'poor', will: 'good', skills: 2, source: "DMG p.188", features: "Special Abilities, Blast Infidel, Divine Reach, Faith Healing, Spell Power" },
      "Horizon Walker": { hd: 8, bab: 1.0, fort: 'good', ref: 'poor', will: 'poor', skills: 4, source: "DMG p.189", features: "Terrain Mastery, Planar Terrain Mastery (Shifting: Dimension Door)" },
      "Loremaster": { hd: 4, bab: 0.5, fort: 'poor', ref: 'poor', will: 'good', skills: 4, source: "DMG p.191", features: "Secret, Lore, Greater Lore, True Lore" },
      "Mystic Theurge": { hd: 4, bab: 0.5, fort: 'poor', ref: 'poor', will: 'good', skills: 2, source: "DMG p.192", features: "Combined Arcane and Divine Spellcasting" },
      "Shadowdancer": { hd: 8, bab: 0.75, fort: 'poor', ref: 'good', will: 'poor', skills: 6, source: "DMG p.194", features: "Hide in Plain Sight, Evasion, Shadow Illusion, Summon Shadow, Shadow Jump, Defensive Roll" },
      "Abjurant Champion": { hd: 10, bab: 1.0, fort: 'poor', ref: 'poor', will: 'good', skills: 2, source: "Complete Mage p.50", features: "Abjurant Armor, Extended Abjuration, Swift Abjuration, Arcane Boost, Martial Arcanist" },
      "Dervish": { hd: 10, bab: 1.0, fort: 'poor', ref: 'good', will: 'poor', skills: 4, source: "Complete Warrior p.25", features: "Dervish Dance, Movement Mastery, Slashing Blades, Fast Movement, Spring Attack" },
      "Frenzied Berserker": { hd: 12, bab: 1.0, fort: 'good', ref: 'poor', will: 'poor', skills: 2, source: "Complete Warrior p.34", features: "Frenzy, Die Hard, Supreme Cleave, Deathless Frenzy, Greater Frenzy, Inspire Frenzy" },
      "Invisible Blade": { hd: 6, bab: 1.0, fort: 'poor', ref: 'good', will: 'poor', skills: 4, source: "Complete Warrior p.44", features: "Dagger Sneak Attack, Uncanny Feint, Bleeding Wound, Feint Mastery" },
      "Ur-Priest": { hd: 8, bab: 0.75, fort: 'good', ref: 'poor', will: 'good', skills: 2, source: "Complete Divine p.70", features: "Fast Divine Spellcasting (up to 9th level in 10 levels), Rebuke Undead, Steal Spell-Like Ability" }
    };

    function focusChangeClassRuleMasterSearch() {
      const input = document.getElementById('change-class-search-input');
      if (input) {
        input.focus();
        input.select();
      }
    }

    async function searchOrAddClassWithRuleMaster() {
      const input = document.getElementById('change-class-search-input');
      const statusEl = document.getElementById('change-class-search-status');
      const query = (input?.value || '').trim();
      if (!query) {
        if (statusEl) {
          statusEl.className = 'text-[11px] p-2.5 rounded-lg bg-amber-950/80 border border-amber-600/60 text-amber-200 block';
          statusEl.innerHTML = '⚠️ Please enter a class name to search.';
        } else {
          alert('⚠️ Please enter a class name to search.');
        }
        input?.focus();
        return;
      }

      if (statusEl) {
        statusEl.className = 'text-[11px] p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-600/60 text-indigo-200 block animate-pulse';
        statusEl.innerHTML = `<span>⏳</span> <span>Searching class "${query}"...</span>`;
      }

      const qLower = query.toLowerCase();

      // 1. Mevcut tanımlı sınıfları kontrol et (Exact veya Contains)
      const allDefs = getAvailableClassDefs();
      const matchedKey = Object.keys(allDefs).find(k => k.toLowerCase() === qLower)
        || Object.keys(allDefs).find(k => k.toLowerCase().includes(qLower));

      if (matchedKey) {
        populateChangeClassSelect(matchedKey);
        onChangeClassSelectChange();
        if (statusEl) {
          statusEl.className = 'text-[11px] p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 block';
          statusEl.innerHTML = `<span>✅</span> Found and selected <b>${matchedKey}</b> in your class list!`;
        }
        return;
      }

      // 2. Yerleşik resmi D&D 3.5e ek sınıflar ve prestij sınıfları kütüphanesini kontrol et
      let foundExtra = null;
      let extraName = null;
      for (const [eName, eDef] of Object.entries(DND35_EXTRA_CLASSES)) {
        if (eName.toLowerCase() === qLower || eName.toLowerCase().includes(qLower)) {
          foundExtra = eDef;
          extraName = eName;
          break;
        }
      }

      if (foundExtra) {
        const newClassDef = {
          name: extraName,
          hd: foundExtra.hd,
          bab: foundExtra.bab,
          fort: foundExtra.fort,
          ref: foundExtra.ref,
          will: foundExtra.will,
          skills: foundExtra.skills,
          source: foundExtra.source,
          isCustom: true,
          features: foundExtra.features ? { 1: [{ name: foundExtra.features, category: 'Special Ability', type: 'Ex', summary: foundExtra.features }] } : {}
        };

        if (!Array.isArray(character.customClasses)) character.customClasses = [];
        const exIdx = character.customClasses.findIndex(c => c.name.toLowerCase() === extraName.toLowerCase());
        if (exIdx >= 0) {
          character.customClasses[exIdx] = newClassDef;
        } else {
          character.customClasses.push(newClassDef);
        }

        if (Array.isArray(masterDb)) {
          const inDb = masterDb.find(m => m && (m.name || '').toLowerCase() === extraName.toLowerCase() && (m.type === 'Class' || m.category === 'Class'));
          if (!inDb) {
            masterDb.push({
              name: extraName,
              type: 'Class',
              category: 'Class',
              hd: foundExtra.hd,
              bab: foundExtra.bab,
              fort: foundExtra.fort,
              ref: foundExtra.ref,
              will: foundExtra.will,
              skills: foundExtra.skills,
              source: foundExtra.source,
              desc: foundExtra.features || `${extraName} (${foundExtra.source})`
            });
          }
        }

        syncCustomClassesToRuleEngine();
        saveStateToStorage(true);
        populateChangeClassSelect(extraName);
        onChangeClassSelectChange();

        const babDisplay = foundExtra.bab === 1.0 ? 'Tam BAB (+1/lvl)' : (foundExtra.bab === 0.75 ? '3/4 BAB (+0.75/lvl)' : '1/2 BAB (+0.5/lvl)');
        if (statusEl) {
          statusEl.className = 'text-[11px] p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 block';
          statusEl.innerHTML = `<span>✨</span> Added and selected <b>${extraName}</b> from D&D 3.5e compendium! (HD: d${foundExtra.hd} • ${babDisplay} • Source: ${foundExtra.source})`;
        }
        return;
      }

      // 3. Rule Master (AI / Gemini) ile resmi 3.5e kitaplarından getir
      const apiKey = (typeof RuleMaster !== 'undefined' && RuleMaster.getApiKey)
        ? RuleMaster.getApiKey()
        : (localStorage.getItem('gemini_api_key') || '');

      if (apiKey && typeof RuleMaster !== 'undefined' && typeof RuleMaster.getAvailableGeminiModels === 'function') {
        try {
          const availableModels = await RuleMaster.getAvailableGeminiModels(apiKey);
          const prompt = `You are a strict D&D 3.5e RAW rules expert and database builder.
STRICT D&D 3.5E RAW ONLY (ZERO TOLERANCE FOR FORUMS / HOMEBREW / 5E / PATHFINDER):
- Verify strictly against official D&D 3.5e publications, d20srd.org, or dndtools.net.
- ABSOLUTELY NEVER use DandWiki (dandwiki.com), Giant in the Playground (GitP), ENWorld, Reddit, or homebrew blogs/wikis.
- ABSOLUTELY NO 5e / 4e / Pathfinder rules.
- If "${query}" is not an official D&D 3.5e RAW class, return null.

User wants to add this official D&D 3.5e class: "${query}".
Output ONLY a single valid JSON object strictly matching this schema:
{
  "name": "Canonical Class Name",
  "hd": 8, // integer: 4, 6, 8, 10, or 12
  "bab": 1.0, // float: 1.0 (Full BAB: +1/lvl), 0.75 (Average: 3/4), or 0.5 (Poor: 1/2)
  "fort": "good", // "good" or "poor"
  "ref": "poor", // "good" or "poor"
  "will": "good", // "good" or "poor"
  "skills": 2, // integer: 2, 4, 6, or 8 (base skill points per level)
  "source": "Book Name and page (e.g. Complete Warrior p.10, PHB II p.19)",
  "featuresSummary": "Key features e.g. Sneak attack, Armored mage"
}
Output raw JSON only. Do not wrap in markdown quotes.`;

          for (const model of availableModels) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
            const resp = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  response_mime_type: 'application/json',
                  temperature: 0.1
                }
              })
            });

            if (resp.ok) {
              const json = await resp.json();
              const replyText = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (replyText) {
                const parsed = JSON.parse(replyText);
                const cName = parsed.name || query;
                const newClassDef = {
                  name: cName,
                  hd: Number(parsed.hd) || 8,
                  bab: Number(parsed.bab) || 0.75,
                  fort: parsed.fort === 'good' ? 'good' : 'poor',
                  ref: parsed.ref === 'good' ? 'good' : 'poor',
                  will: parsed.will === 'good' ? 'good' : 'poor',
                  skills: Number(parsed.skills) || 2,
                  source: parsed.source || 'Rule Master AI',
                  isCustom: true,
                  features: parsed.featuresSummary ? { 1: [{ name: parsed.featuresSummary, category: 'Special Ability', type: 'Ex', summary: parsed.featuresSummary }] } : {}
                };

                if (!Array.isArray(character.customClasses)) character.customClasses = [];
                const exIdx = character.customClasses.findIndex(c => c.name.toLowerCase() === cName.toLowerCase());
                if (exIdx >= 0) {
                  character.customClasses[exIdx] = newClassDef;
                } else {
                  character.customClasses.push(newClassDef);
                }

                if (Array.isArray(masterDb)) {
                  const inDb = masterDb.find(m => m && (m.name || '').toLowerCase() === cName.toLowerCase() && (m.type === 'Class' || m.category === 'Class'));
                  if (!inDb) {
                    masterDb.push({
                      name: cName,
                      type: 'Class',
                      category: 'Class',
                      hd: newClassDef.hd,
                      bab: newClassDef.bab,
                      fort: newClassDef.fort,
                      ref: newClassDef.ref,
                      will: newClassDef.will,
                      skills: newClassDef.skills,
                      source: newClassDef.source,
                      desc: parsed.featuresSummary || `${cName} (${newClassDef.source})`
                    });
                  }
                }

                syncCustomClassesToRuleEngine();
                saveStateToStorage(true);
                populateChangeClassSelect(cName);
                onChangeClassSelectChange();

                const babDisplay = newClassDef.bab === 1.0 ? 'Tam BAB (+1/lvl)' : (newClassDef.bab === 0.75 ? '3/4 BAB (+0.75/lvl)' : '1/2 BAB (+0.5/lvl)');
                if (statusEl) {
                  statusEl.className = 'text-[11px] p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 block';
                  statusEl.innerHTML = `<span>✨</span> Fetched and added <b>${cName}</b> via Rule Master (AI) with D&D 3.5e RAW stats! (HD: d${newClassDef.hd} • ${babDisplay} • Source: ${newClassDef.source})`;
                }
                return;
              }
            }
          }
        } catch (e) {
          console.warn("Rule Master class AI search error:", e);
        }
      }

      // 4. API anahtarı yoksa veya bulunamazsa dengeli temel kurguyla listeye ekle
      const fallbackDef = {
        name: query,
        hd: 8,
        bab: 0.75,
        fort: 'poor',
        ref: 'poor',
        will: 'good',
        skills: 4,
        source: 'Custom / 3.5e',
        isCustom: true,
        features: {}
      };

      if (!Array.isArray(character.customClasses)) character.customClasses = [];
      character.customClasses.push(fallbackDef);
      syncCustomClassesToRuleEngine();
      saveStateToStorage(true);
      populateChangeClassSelect(query);
      onChangeClassSelectChange();

      if (statusEl) {
        statusEl.className = 'text-[11px] p-2.5 rounded-lg bg-amber-950/80 border border-amber-600/60 text-amber-200 block';
        statusEl.innerHTML = `<span>⚠️</span> "${query}" was not found in the local compendium and no Gemini API key is configured; added with balanced default stats (d8 HD, 3/4 BAB). You can customize it via "Add Custom / Prestige Class".`;
      }
    }

    // ====================================================
      // ⬆️ LEVEL UP WIZARD & LEVEL PLANNING (1-30) FUNCTIONS
    // ====================================================
    // â¬†ï¸ LEVEL UP WIZARD & LEVEL PLANNING (1-30) FUNCTIONS
    // ====================================================
      let levelUpModalFeatSlots = [];
      let activeFeatPickerSlotIndex = 0;
      let activeLevelUpFeatSearchSlot = null;
      let levelUpFeatSearchFilters = {};
      let levelUpFeatSearchQueries = {};

      /**
       * D&D 3.5e RAW Feat Prerequisite Engine
       * Evaluates prospective BAB, ability scores (including Level Up +1 stat increase),
       * known feats (character feats, active progression, earlier slots in current level up),
       * caster level, and skill ranks in a fully parametric manner.
       */

    // ====================================================
    // ⚔️ D&D 3.5e RAW FEAT DUPLICATE & RETAKE VALIDATION
    // ====================================================
    const UNLIMITED_REPEATABLE_FEATS = new Set([
      'toughness',
      'extra turning',
      'improved natural armor'
    ]);

    const TARGETED_REPEATABLE_FEATS = new Set([
      'weapon focus',
      'greater weapon focus',
      'weapon specialization',
      'greater weapon specialization',
      'improved critical',
      'exotic weapon proficiency',
      'martial weapon proficiency',
      'simple weapon proficiency',
      'spell focus',
      'greater spell focus',
      'skill focus',
      'extra spell',
      'extra slot',
      'extra invocation'
    ]);

    function cleanFeatNameString(str) {
      if (!str) return '';
      return String(str).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
    }

    function isFeatAlreadyTakenByCharacter(featName, excludeContext = {}) {
      if (!featName) return { isTaken: false, reason: '' };

      const cleanCandidate = cleanFeatNameString(featName);
      const candBase = cleanCandidate.replace(/\(.*?\)/g, '').trim().toLowerCase();
      const candFull = cleanCandidate.toLowerCase();
      const hasParens = cleanCandidate.includes('(') && cleanCandidate.includes(')');

      // 1. Unlimited repeatable feats (e.g. Toughness, Extra Turning)
      if (UNLIMITED_REPEATABLE_FEATS.has(candBase)) {
        return { isTaken: false, reason: '' };
      }

      // 2. Collect all taken feats across build
      const takenFullSet = new Set();
      const takenBaseSet = new Set();

      // From character.feats
      if (typeof character !== 'undefined' && Array.isArray(character.feats)) {
        character.feats.forEach(f => {
          const raw = typeof f === 'string' ? f : (f?.name || '');
          const c = cleanFeatNameString(raw);
          if (!c || c.startsWith('+1 Stat') || c.includes('Stat:') || c.includes('Primary CL')) return;
          takenFullSet.add(c.toLowerCase());
          takenBaseSet.add(c.replace(/\(.*?\)/g, '').trim().toLowerCase());
        });
      }

      // From character.levelProgression
      if (typeof character !== 'undefined' && Array.isArray(character.levelProgression)) {
        character.levelProgression.forEach((lvl, lIdx) => {
          if (!lvl || lvl.active === false || !Array.isArray(lvl.feats)) return;
          lvl.feats.forEach((fStr, fIdx) => {
            if (excludeContext.levelIdx !== undefined && excludeContext.levelIdx === lIdx && excludeContext.featIdx !== undefined && excludeContext.featIdx === fIdx) {
              return;
            }
            const c = cleanFeatNameString(fStr);
            if (!c || c.startsWith('+1 Stat') || c.includes('Stat:') || c.includes('Primary CL') || c.includes('Caster Lvl')) return;
            takenFullSet.add(c.toLowerCase());
            takenBaseSet.add(c.replace(/\(.*?\)/g, '').trim().toLowerCase());
          });
        });
      }

      // From Level-Up Wizard active slots
      if (typeof levelUpModalFeatSlots !== 'undefined' && Array.isArray(levelUpModalFeatSlots)) {
        levelUpModalFeatSlots.forEach((slot, sIdx) => {
          if (excludeContext.slotIdx !== undefined && excludeContext.slotIdx === sIdx) return;
          const c = cleanFeatNameString(slot.name || '');
          if (!c) return;
          takenFullSet.add(c.toLowerCase());
          takenBaseSet.add(c.replace(/\(.*?\)/g, '').trim().toLowerCase());
        });
      }

      // 3. Targeted repeatable feats (e.g. Weapon Focus, Spell Focus)
      if (TARGETED_REPEATABLE_FEATS.has(candBase)) {
        if (hasParens) {
          if (takenFullSet.has(candFull)) {
            return {
              isTaken: true,
              reason: `Your character already has "${cleanCandidate}" (cannot be taken twice for the same target weapon/school).`
            };
          }
          return { isTaken: false, reason: '' };
        } else {
          // Generic targeted feat without target yet
          return { isTaken: false, reason: '' };
        }
      }

      // 4. Standard non-repeatable feats
      if (takenBaseSet.has(candBase) || takenFullSet.has(candFull)) {
        return {
          isTaken: true,
          reason: `Your character already has "${cleanCandidate}" (per D&D 3.5e RAW, a non-stacking feat can only be taken once).`
        };
      }

      return { isTaken: false, reason: '' };
    }

      function checkFeatPrerequisites(feat, slotIdx = 0, targetLevelIdx = null) {
        if (!feat) return { hasPrereqs: false, allMet: true, checks: [], rawPrereq: '', isAlreadyKnownFromClass: false, alreadyKnownReason: '', isAlreadyTaken: false, alreadyKnownBadgeText: '' };

        // Hydrate full feat definition from catalog if only { name } was passed
        let resolvedFeat = feat;
        const featName = (feat.name || '').trim();
        if (!feat.prereq && !feat.prerequisites && !feat.category && featName) {
          const baseClean = featName.replace(/\(.*?\)/g, '').trim().toLowerCase();
          const catPool = getCombinedFeatCatalog(true);
          const match = catPool.find(f => (f.name || '').toLowerCase() === featName.toLowerCase()) || catPool.find(f => (f.name || '').toLowerCase() === baseClean);
          if (match) resolvedFeat = { ...match, ...feat, name: featName };
        }

        // Slot Contract RAW Prerequisite Bypass (e.g. Monk 1st/2nd/6th level bonus feats, Ranger combat style feats)
        if (typeof activeQuickFeatSlotContract !== 'undefined' && activeQuickFeatSlotContract && activeQuickFeatSlotContract.bypassPrereqs === true) {
          const fn = featName.toLowerCase();
          if (Array.isArray(activeQuickFeatSlotContract.choices) && activeQuickFeatSlotContract.choices.some(c => c.toLowerCase() === fn || fn.includes(c.toLowerCase()))) {
            return {
              hasPrereqs: true,
              allMet: true,
              checks: [{ label: 'RAW Class Exemption', met: true, info: 'Granted without prerequisites per D&D 3.5e RAW class feature rules' }],
              rawPrereq: resolvedFeat.prereq || resolvedFeat.prerequisites || '-',
              isAlreadyKnownFromClass: false,
              alreadyKnownReason: '',
              isAlreadyTaken: false,
              alreadyKnownBadgeText: ''
            };
          }
        }

        const featNameNorm = featName.toLowerCase().replace(/[^a-z0-9]/g, '');
        let isAlreadyKnownFromClass = false;
        let alreadyKnownReason = '';
        let isAlreadyTaken = false;

        // 1. Unified D&D 3.5e Proficiencies lookup via RuleEngine
        let prof = null;
        if (typeof RuleEngine !== 'undefined' && RuleEngine.getCharacterProficiencies) {
          prof = RuleEngine.getCharacterProficiencies(character, targetLevelIdx);
        } else {
          prof = {
            weapons: { simple: true, martial: false, exoticAll: false, specific: new Set() },
            armors: { light: true, medium: false, heavy: false },
            shields: { shield: false, tower: false }
          };
        }

        if (featNameNorm.includes('armorproficiencyheavy') || featNameNorm.includes('heavyarmorproficiency')) {
          if (prof.armors.heavy) {
            isAlreadyKnownFromClass = true;
            alreadyKnownReason = 'Your character already has Heavy Armor Proficiency through class or existing feats.';
          }
        } else if (featNameNorm.includes('armorproficiencymedium') || featNameNorm.includes('mediumarmorproficiency')) {
          if (prof.armors.medium) {
            isAlreadyKnownFromClass = true;
            alreadyKnownReason = 'Your character already has Medium Armor Proficiency through class or existing feats.';
          }
        } else if (featNameNorm.includes('armorproficiencylight') || featNameNorm.includes('lightarmorproficiency')) {
          if (prof.armors.light) {
            isAlreadyKnownFromClass = true;
            alreadyKnownReason = 'Your character already has Light Armor Proficiency through class or existing feats.';
          }
        } else if (featNameNorm.includes('towershieldproficiency')) {
          if (prof.shields.tower) {
            isAlreadyKnownFromClass = true;
            alreadyKnownReason = 'Your character already has Tower Shield Proficiency through class or existing feats.';
          }
        } else if (featNameNorm.includes('shieldproficiency')) {
          if (prof.shields.shield || prof.shields.tower) {
            isAlreadyKnownFromClass = true;
            alreadyKnownReason = 'Your character already has Shield Proficiency through class or existing feats.';
          }
        } else if (featNameNorm.includes('martialweaponproficiency') || featNameNorm.includes('askerisilah')) {
          const match = featName.match(/(?:martial weapon proficiency|askeri silah ustalığı)\s*\((.*?)\)/i);
          if (match && match[1]) {
            const wep = match[1].toLowerCase().trim();
            if (prof.weapons.martial || prof.weapons.specific.has(wep)) {
              isAlreadyKnownFromClass = true;
              alreadyKnownReason = `Your character is already proficient with ${match[1]}.`;
            }
          } else if (prof.weapons.martial) {
            isAlreadyKnownFromClass = true;
            alreadyKnownReason = 'Your character is already proficient with all Martial Weapons through class.';
          }
        } else if (featNameNorm.includes('simpleweaponproficiency') || featNameNorm.includes('basitsilah')) {
          if (prof.weapons.simple) {
            isAlreadyKnownFromClass = true;
            alreadyKnownReason = 'Your character is already proficient with all Simple Weapons through class.';
          }
        } else if (featNameNorm.includes('exoticweaponproficiency')) {
          const match = featName.match(/(?:exotic weapon proficiency|egzotik silah ustalığı)\s*\((.*?)\)/i);
          if (match && match[1]) {
            const wep = match[1].toLowerCase().trim();
            if (prof.weapons.exoticAll || prof.weapons.specific.has(wep)) {
              isAlreadyKnownFromClass = true;
              alreadyKnownReason = `Your character is already proficient with the exotic weapon ${match[1]}.`;
            }
          }
        }

        // 2. D&D 3.5e RAW Duplicate Feat Evaluation
        if (!isAlreadyKnownFromClass) {
          const takenCheck = isFeatAlreadyTakenByCharacter(featName, {
            slotIdx: (targetLevelIdx === null || targetLevelIdx === undefined) ? slotIdx : undefined,
            levelIdx: (targetLevelIdx !== null && targetLevelIdx !== undefined) ? targetLevelIdx : undefined
          });
          if (takenCheck.isTaken) {
            isAlreadyTaken = true;
            alreadyKnownReason = takenCheck.reason;
          }
        }

        const isAlreadyKnown = isAlreadyKnownFromClass || isAlreadyTaken;
        const alreadyKnownBadgeText = isAlreadyTaken
          ? '🔒 Already Owned'
          : (isAlreadyKnownFromClass ? '🔒 Class Proficiency (Owned)' : '');

        // 3. Determine effective rawPrereq (including implicit Metamagic / Caster Only / Warlock Invocation rules)
        let rawPrereq = String(resolvedFeat.prerequisites || resolvedFeat.prereq || '').trim();
        const catLow = String(resolvedFeat.category || '').toLowerCase();
        const scopeLow = String(resolvedFeat.scope || '').toLowerCase();
        const pStruct = resolvedFeat.prereqStruct || {};

        if (catLow === 'warlock invocation' && (!rawPrereq || rawPrereq === '-')) {
          rawPrereq = `Warlock Level ${resolvedFeat.minLevel || 1}`;
        } else if ((catLow === 'metamagic' || scopeLow === 'caster only' || pStruct.requiresSpellcasting) && (!rawPrereq || rawPrereq === '-' || rawPrereq.toLowerCase() === 'none')) {
          rawPrereq = 'Ability to cast spells';
        } else if (pStruct.requiresPsionics && (!rawPrereq || rawPrereq === '-' || rawPrereq.toLowerCase() === 'none')) {
          rawPrereq = 'Psionic ability (Manifester or Wild Talent)';
        }

        if (!rawPrereq || rawPrereq === '-' || rawPrereq.toLowerCase() === 'none') {
          return {
            hasPrereqs: false,
            allMet: true,
            checks: [],
            rawPrereq: '',
            isAlreadyKnownFromClass: isAlreadyKnown,
            isClassGranted: isAlreadyKnownFromClass,
            isAlreadyTaken,
            alreadyKnownReason,
            alreadyKnownBadgeText
          };
        }

        // 4. Compute Character Progression State up to targetLevelIdx (or upcoming Level-Up Wizard level)
        const isTableMode = (targetLevelIdx !== null && targetLevelIdx !== undefined);
        const prog = character.levelProgression || [];
        const allDefs = (typeof getAvailableClassDefs === 'function') ? getAvailableClassDefs() : {};
        const statKeys = (typeof STAT_KEYS !== 'undefined' && Array.isArray(STAT_KEYS)) ? STAT_KEYS.map(s => s.key) : ['str', 'dex', 'con', 'int', 'wis', 'cha'];

        let prospectiveBab = 0;
        let selectedClassName = '';
        let def = null;
        let prospectiveProg = [];
        const abilities = {};

        if (isTableMode) {
          const rowIdx = Math.max(0, Math.min(Number(targetLevelIdx), Math.max(0, prog.length - 1)));
          const targetRow = prog[rowIdx] || {};
          selectedClassName = targetRow.className || (character.classes?.split(' ')[0]) || 'Fighter';
          def = allDefs[selectedClassName] || (typeof DND35_CLASS_DEFS !== 'undefined' ? DND35_CLASS_DEFS[selectedClassName] : null) || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4 };

          prospectiveProg = prog.length > 0 ? prog.slice(0, rowIdx + 1) : [{ className: selectedClassName, hd: `d${def.hd || 8}`, hpGain: 0, active: true }];
          if (typeof RuleEngine !== 'undefined' && RuleEngine.calculateProgression) {
            const sys = character.settings?.progressionSystem || 'standard';
            const isHuman = (character.race || '').toLowerCase().includes('human');
            const intMod = (typeof RuleEngine.getAbilityMod === 'function') ? RuleEngine.getAbilityMod(character.abilities?.int || 10) : Math.floor(((character.abilities?.int || 10) - 10) / 2);
            const calc = RuleEngine.calculateProgression(prospectiveProg, { system: sys, isHuman, intMod });
            prospectiveBab = calc?.baseBab ?? (Number(character.bab) || 0);
          } else {
            prospectiveBab = Number(character.bab) || 0;
          }

          statKeys.forEach(stat => {
            let val = Number(character.baseAbilities?.[stat] ?? character.abilities?.[stat] ?? 10);
            for (let i = 0; i <= rowIdx && i < prog.length; i++) {
              const r = prog[i];
              if (r && r.statIncrease && r.statIncrease.toLowerCase() === stat) {
                val += 1;
              }
            }
            abilities[stat] = val;
          });
        } else {
          const defaultClass = (character.classes?.split(' ')[0]) || (prog[0]?.className) || 'Fighter';
          selectedClassName = document.getElementById('lvlup-class-select')?.value || defaultClass;
          def = allDefs[selectedClassName] || (typeof DND35_CLASS_DEFS !== 'undefined' ? DND35_CLASS_DEFS[selectedClassName] : null) || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4 };

          prospectiveProg = [...prog, { className: selectedClassName, hd: `d${def.hd || 8}`, hpGain: 0, active: true }];
          const babInputVal = parseInt(document.getElementById('lvlup-bab-input')?.value, 10);
          if (!isNaN(babInputVal)) {
            prospectiveBab = babInputVal;
          } else if (typeof RuleEngine !== 'undefined' && RuleEngine.calculateProgression) {
            const sys = character.settings?.progressionSystem || 'standard';
            const isHuman = (character.race || '').toLowerCase().includes('human');
            const intMod = (typeof RuleEngine.getAbilityMod === 'function') ? RuleEngine.getAbilityMod(character.abilities?.int || 10) : Math.floor(((character.abilities?.int || 10) - 10) / 2);
            const calc = RuleEngine.calculateProgression(prospectiveProg, { system: sys, isHuman, intMod });
            prospectiveBab = calc?.baseBab ?? (Number(character.bab) || 0);
          } else {
            prospectiveBab = Number(character.bab) || 0;
          }

          const chosenStat = (document.getElementById('lvlup-stat-select')?.value || '').toLowerCase().trim();
          statKeys.forEach(stat => {
            let base = Number(character.abilities?.[stat] ?? character.baseAbilities?.[stat] ?? 10);
            if (chosenStat === stat) base += 1;
            abilities[stat] = base;
          });
        }

        // Count active levels per class & total character level
        const classCounts = {};
        let totalCharacterLevel = 0;
        prospectiveProg.forEach(r => {
          if (!r || r.active === false) return;
          const cKey = String(r.className || selectedClassName || 'Fighter').trim().toLowerCase();
          classCounts[cKey] = (classCounts[cKey] || 0) + 1;
          totalCharacterLevel++;
        });
        if (totalCharacterLevel === 0) {
          totalCharacterLevel = Math.max(1, Number(character.level) || 1);
          const cKey = String(selectedClassName || 'Fighter').trim().toLowerCase();
          classCounts[cKey] = totalCharacterLevel;
        }

        // 5. Known Feats & Special Abilities Set
        const knownFeats = new Set();
        const normalizeFeatName = str => (str || '').toLowerCase().replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').replace(/[^a-z0-9]/g, '');

        if (Array.isArray(character.feats)) {
          character.feats.forEach(f => {
            const name = typeof f === 'string' ? f : f?.name;
            if (name) {
              knownFeats.add(normalizeFeatName(name));
              knownFeats.add(normalizeFeatName(name.replace(/\(.*?\)/g, '')));
            }
          });
        }
        if (Array.isArray(character.specialAbilities)) {
          character.specialAbilities.forEach(s => {
            const name = typeof s === 'string' ? s : s?.name;
            if (name) {
              knownFeats.add(normalizeFeatName(name));
              knownFeats.add(normalizeFeatName(name.replace(/\(.*?\)/g, '')));
            }
          });
        }

        const progSliceForFeats = isTableMode ? prog.slice(0, Number(targetLevelIdx)) : prog;
        if (Array.isArray(progSliceForFeats)) {
          progSliceForFeats.forEach(lvl => {
            if (lvl && lvl.active !== false) {
              (lvl.feats || []).forEach(f => {
                const name = typeof f === 'string' ? f : f?.name;
                if (name) {
                  knownFeats.add(normalizeFeatName(name));
                  knownFeats.add(normalizeFeatName(name.replace(/\(.*?\)/g, '')));
                }
              });
              (lvl.specialAbilities || []).forEach(s => {
                const name = typeof s === 'string' ? s : s?.name;
                if (name) {
                  knownFeats.add(normalizeFeatName(name));
                  knownFeats.add(normalizeFeatName(name.replace(/\(.*?\)/g, '')));
                }
              });
            }
          });
        }
        if (!isTableMode && Array.isArray(levelUpModalFeatSlots)) {
          for (let i = 0; i < slotIdx; i++) {
            const priorSlot = levelUpModalFeatSlots[i];
            if (priorSlot && priorSlot.name) {
              knownFeats.add(normalizeFeatName(priorSlot.name));
              knownFeats.add(normalizeFeatName(priorSlot.name.replace(/\(.*?\)/g, '')));
            }
          }
        }

        // 6. Strict D&D 3.5e RAW Spellcasting, Warlock, SLA, Psionic & Class Feature Capabilities
        const FULL_CASTER_CLASSES = new Set([
          'wizard', 'sorcerer', 'cleric', 'druid', 'bard', 'duskblade',
          'warmage', 'beguiler', 'dread necromancer', 'favored soul',
          'spirit shaman', 'archivist', 'wu jen', 'shugenja', 'healer', 'adept'
        ]);
        const HALF_CASTER_MIN4_CLASSES = new Set(['paladin', 'ranger', 'hexblade', 'spellthief', 'sohei']);
        const PRESTIGE_CASTER_CLASSES = new Set([
          'abjurant champion', 'eldritch knight', 'arcane archer', 'mystic theurge',
          'spellsword', 'jade phoenix mage', 'archmage', 'hierophant', 'loremaster',
          'thaumaturgist', 'red wizard', 'assassin', 'blackguard'
        ]);
        const PSIONIC_CLASSES = new Set([
          'psion', 'psychic warrior', 'soulknife', 'wilder', 'erudite', 'ardent', 'lurk', 'divine mind'
        ]);
        const MARTIAL_ADEPT_CLASSES = new Set(['crusader', 'swordsage', 'warblade', 'bloodstorm blade', 'jade phoenix mage']);

        let calculatedCasterLevel = 0;
        let hasTrueSpellcastingClass = false;
        let calculatedManifesterLevel = 0;
        let hasPsionicClass = false;

        Object.entries(classCounts).forEach(([cName, cLvl]) => {
          if (FULL_CASTER_CLASSES.has(cName) || PRESTIGE_CASTER_CLASSES.has(cName)) {
            hasTrueSpellcastingClass = true;
            calculatedCasterLevel += cLvl;
          } else if (HALF_CASTER_MIN4_CLASSES.has(cName) && cLvl >= 4) {
            hasTrueSpellcastingClass = true;
            calculatedCasterLevel += Math.max(1, Math.floor(cLvl / 2));
          } else if (typeof RuleEngine !== 'undefined' && typeof RuleEngine.getClassSpellSlots === 'function') {
            const slotCheck = RuleEngine.getClassSpellSlots(cName, cLvl, 20);
            if (slotCheck && slotCheck.hasSpellcasting) {
              hasTrueSpellcastingClass = true;
              calculatedCasterLevel += cLvl;
            }
          }
          if (PSIONIC_CLASSES.has(cName)) {
            hasPsionicClass = true;
            calculatedManifesterLevel += cLvl;
          }
        });

        const explicitCl = Number(character.spellcasting?.cl) || 0;
        const hasCharacterSpells = Array.isArray(character.spells) && character.spells.length > 0;
        const isCaster = hasTrueSpellcastingClass || (explicitCl > 0 && hasCharacterSpells);
        const effectiveCasterLevel = isCaster ? Math.max(calculatedCasterLevel, explicitCl, 1) : 0;

        // Warlock & Eldritch Blast capability
        const warlockBoonEnabled = (typeof isWarlockEnabledForLevel === 'function') ? isWarlockEnabledForLevel(targetLevelIdx) : false;
        const warlockLevel = (classCounts['warlock'] || 0) > 0
          ? classCounts['warlock']
          : (warlockBoonEnabled ? totalCharacterLevel : 0);
        const isWarlock = warlockLevel > 0;
        const hasEldritchBlast = isWarlock || knownFeats.has('eldritchblast');

        // Spell-Like Ability (SLA) capability
        const raceLow = String(character.race || '').toLowerCase();
        const hasRacialSla = ['gnome', 'drow', 'tiefling', 'aasimar', 'duergar', 'svirfneblin'].some(r => raceLow.includes(r));
        const hasAbilitySla = Array.isArray(character.specialAbilities) && character.specialAbilities.some(a => {
          const n = String(typeof a === 'string' ? a : (a?.name || '')).toLowerCase();
          return n.includes('(sp)') || n.includes('spell-like') || n.includes('invocation');
        });
        const hasSpellLikeAbility = isWarlock || isCaster || hasRacialSla || hasAbilitySla;
        const slaCasterLevel = hasSpellLikeAbility ? Math.max(effectiveCasterLevel, warlockLevel, totalCharacterLevel) : 0;

        // Psionics capability
        const isPsionic = hasPsionicClass || knownFeats.has('wildtalent') || knownFeats.has('hiddentalent');
        const effectiveManifesterLevel = isPsionic ? Math.max(calculatedManifesterLevel, 1) : 0;

        // Martial Adept capability
        const isMartialAdept = Object.keys(classCounts).some(c => MARTIAL_ADEPT_CLASSES.has(c)) || knownFeats.has('martialstudy');

        // Skills list
        const skillsList = Array.isArray(character.skills) ? character.skills : [];

        // Split prereq string into comma or semicolon separated parts
        const parts = rawPrereq.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
        const checks = [];
        let allMet = true;

        for (const part of parts) {
          let met = true;
          let label = part;
          let info = '';
          const partLow = part.toLowerCase().trim();

          // 0) Character Level Check: e.g. "Character level 6th", "Character level 21st"
          const charLvlMatch = part.match(/character\s*level\s*(\d+)/i);
          if (charLvlMatch) {
            const reqLvl = parseInt(charLvlMatch[1], 10);
            met = totalCharacterLevel >= reqLvl;
            info = met ? `(Seviye: ${totalCharacterLevel} ≥ ${reqLvl})` : `(Mevcut: ${totalCharacterLevel}, Gereken: ${reqLvl})`;
            if (!met) allMet = false;
            checks.push({ type: 'charLevel', label, met, info });
            continue;
          }

          // A) BAB Check: e.g. "BAB +1", "base attack bonus +6"
          const babMatch = part.match(/(?:bab|base attack bonus)\s*\+?(\d+)/i);
          if (babMatch) {
            const reqBab = parseInt(babMatch[1], 10);
            met = prospectiveBab >= reqBab;
            info = met ? `(Mevcut: +${prospectiveBab} ≥ +${reqBab})` : `(Mevcut: +${prospectiveBab}, Gereken: +${reqBab})`;
            if (!met) allMet = false;
            checks.push({ type: 'bab', label, met, info });
            continue;
          }

          // B) Ability Score Check: Str 13, Dex 15, Int 13, Cha 25, etc.
          const statMatch = part.match(/^\s*(str|strength|dex|dexterity|con|constitution|int|intelligence|wis|wisdom|cha|charisma)\s+(\d+)\b/i);
          if (statMatch) {
            const statKey = statMatch[1].toLowerCase().slice(0, 3);
            const reqScore = parseInt(statMatch[2], 10);
            const curScore = abilities[statKey] || 10;
            met = curScore >= reqScore;
            info = met ? `(Mevcut: ${curScore} ≥ ${reqScore})` : `(Mevcut: ${curScore}, Gereken: ${reqScore})`;
            if (!met) allMet = false;
            checks.push({ type: 'stat', label, met, info });
            continue;
          }

          // C) Skill Ranks Check: e.g. "Spellcraft 4 ranks", "Jump 8 ranks"
          const skillMatch = part.match(/(.+?)\s+(\d+)\s+ranks?/i);
          if (skillMatch) {
            const skillQuery = skillMatch[1].trim().toLowerCase();
            const reqRanks = parseInt(skillMatch[2], 10);
            const sk = skillsList.find(s => {
              const sName = (s.name || '').toLowerCase();
              const sKey = (s.key || '').toLowerCase();
              return sName.includes(skillQuery) || skillQuery.includes(sName) || sKey.includes(skillQuery);
            });
            const curRanks = sk ? (Number(sk.ranks) || 0) : 0;
            met = curRanks >= reqRanks;
            info = met ? `(Kademe: ${curRanks} ≥ ${reqRanks})` : `(Mevcut: ${curRanks}, Gereken: ${reqRanks})`;
            if (!met) allMet = false;
            checks.push({ type: 'skill', label, met, info });
            continue;
          }

          // D.1) Manifester Level / Psionic Check
          const mlMatch = part.match(/manifester\s*level\s*(\d+)/i);
          if (mlMatch) {
            const reqMl = parseInt(mlMatch[1], 10);
            met = isPsionic && effectiveManifesterLevel >= reqMl;
            info = met ? `(ML: ${effectiveManifesterLevel} ≥ ${reqMl})` : `(Psionik ML: ${effectiveManifesterLevel}, Gereken: ${reqMl})`;
            if (!met) allMet = false;
            checks.push({ type: 'psionic', label, met, info });
            continue;
          }
          if (partLow.includes('psionic ability') || partLow.includes('psionic focus') || partLow.includes('reserve of power points')) {
            met = isPsionic;
            info = met ? '(Psionik Karakter)' : '(Psionik Yetenek / Wild Talent Yok)';
            if (!met) allMet = false;
            checks.push({ type: 'psionic', label, met, info });
            continue;
          }

          // D.2) Spell-Like Ability (SLA) Check: e.g. "Spell-like ability at CL 6th or higher", "Spell-like ability"
          if (partLow.includes('spell-like ability')) {
            const slaClMatch = part.match(/(?:caster\s*level|cl)\s*(\d+)/i);
            const reqSlaCl = slaClMatch ? parseInt(slaClMatch[1], 10) : 1;
            met = hasSpellLikeAbility && slaCasterLevel >= reqSlaCl;
            info = met ? `(SLA CL: ${slaCasterLevel} ≥ ${reqSlaCl})` : '(SLA / Warlock Seviyesi Yetersiz)';
            if (!met) allMet = false;
            checks.push({ type: 'sla', label, met, info });
            continue;
          }

          // D.3) Caster Level Check: e.g. "Caster level 3rd", "CL 5"
          const clMatch = part.match(/(?:caster\s*level|cl)\s*(\d+)/i);
          if (clMatch) {
            const reqCl = parseInt(clMatch[1], 10);
            met = isCaster && effectiveCasterLevel >= reqCl;
            info = met ? `(CL: ${effectiveCasterLevel} ≥ ${reqCl})` : `(Mevcut CL: ${effectiveCasterLevel}, Gereken: ${reqCl})`;
            if (!met) allMet = false;
            checks.push({ type: 'cl', label, met, info });
            continue;
          }

          // D.4) Specific Class Level Check: e.g. "Warlock Level 6", "Fighter level 4th", "Wizard level 1st"
          const clsLvlMatch = part.match(/\b(fighter|wizard|cleric|druid|sorcerer|bard|paladin|ranger|rogue|monk|barbarian|warlock|crusader|swordsage|warblade|duskblade)\s*level\s*(\d+)/i);
          if (clsLvlMatch) {
            const reqCls = clsLvlMatch[1].toLowerCase();
            const reqLvl = parseInt(clsLvlMatch[2], 10);
            let curClsLvl = classCounts[reqCls] || 0;
            if (reqCls === 'warlock') {
              curClsLvl = warlockLevel;
            } else if (reqCls === 'fighter' && (classCounts['warblade'] || 0) >= 1) {
              // Tome of Battle p.22: Warblade levels count as Fighter levels - 2 for feat prerequisites
              curClsLvl = Math.max(curClsLvl, (classCounts['fighter'] || 0) + Math.max(0, (classCounts['warblade'] || 0) - 2));
            }
            met = curClsLvl >= reqLvl;
            info = met ? `(${clsLvlMatch[1]} ${curClsLvl} ≥ ${reqLvl})` : `(Gereken: ${clsLvlMatch[1]} Seviye ${reqLvl})`;
            if (!met) allMet = false;
            checks.push({ type: 'classLevel', label, met, info });
            continue;
          }

          // D.5) Warlock Invocations & Eldritch Blast Prerequisite Check
          if (partLow.includes('eldritch blast')) {
            met = hasEldritchBlast;
            info = met ? '(Eldritch Blast Mevcut)' : '(Eldritch Blast / Warlock Gerekli)';
            if (!met) allMet = false;
            checks.push({ type: 'warlock', label, met, info });
            continue;
          }
          const invTierMatch = partLow.match(/use\s+(least|lesser|greater|dark)\s+invocations/i);
          if (invTierMatch) {
            const tierName = invTierMatch[1].toLowerCase();
            const reqWarlockLvl = tierName === 'dark' ? 16 : (tierName === 'greater' ? 11 : (tierName === 'lesser' ? 6 : 1));
            met = isWarlock && warlockLevel >= reqWarlockLvl;
            info = met ? `(Warlock Seviye ${warlockLevel} ≥ ${reqWarlockLvl})` : `(Warlock Seviye ${reqWarlockLvl} Gerekli)`;
            if (!met) allMet = false;
            checks.push({ type: 'warlock', label, met, info });
            continue;
          }

          // D.6) True Spellcasting Capability Check (ONLY for explicit casting clauses, NEVER matching feat names like "Spell Focus")
          if (/ability to cast|cast\s+.*spells|büyü\s*yapabilme|arcane\s*spell|divine\s*spell|spellcasting\s*class/i.test(partLow)) {
            const spellLvlMatch = partLow.match(/(\d+)(?:st|nd|rd|th|\.)\s*(?:-?level|seviye)/i);
            if (spellLvlMatch) {
              const reqSpellLvl = parseInt(spellLvlMatch[1], 10);
              const reqMinCl = Math.max(1, (reqSpellLvl * 2) - 1);
              met = isCaster && effectiveCasterLevel >= reqMinCl;
              info = met ? `(Level ${reqSpellLvl} Spells / CL ${effectiveCasterLevel})` : `(Requires Level ${reqSpellLvl} Spells)`;
            } else {
              met = isCaster;
              info = met ? '(Spellcaster)' : '(Requires Spellcasting Ability)';
            }
            if (!met) allMet = false;
            checks.push({ type: 'spell', label, met, info });
            continue;
          }

          // D.7) Special Class Feature Checks (Wild Shape, Turn/Rebuke Undead, Bardic Music, Smite, Martial Maneuvers)
          if (partLow.includes('wild shape')) {
            met = (classCounts['druid'] || 0) >= 5 || knownFeats.has('wildshape');
            info = met ? '(Wild Shape Mevcut)' : '(Wild Shape / Druid 5 Gerekli)';
            if (!met) allMet = false;
            checks.push({ type: 'feature', label, met, info });
            continue;
          }
          if (partLow.includes('turn or rebuke') || partLow.includes('rebuke or command')) {
            met = (classCounts['cleric'] || 0) >= 1 || (classCounts['paladin'] || 0) >= 4 || (classCounts['dread necromancer'] || 0) >= 1 || knownFeats.has('turnundead') || knownFeats.has('rebukeundead');
            info = met ? '(Turn/Rebuke Mevcut)' : '(Turn/Rebuke Undead Gerekli)';
            if (!met) allMet = false;
            checks.push({ type: 'feature', label, met, info });
            continue;
          }
          if (partLow.includes('bardic music')) {
            met = (classCounts['bard'] || 0) >= 1 || knownFeats.has('bardicmusic');
            info = met ? '(Bardic Music Mevcut)' : '(Bardic Music Gerekli)';
            if (!met) allMet = false;
            checks.push({ type: 'feature', label, met, info });
            continue;
          }
          if (partLow.includes('smite')) {
            met = (classCounts['paladin'] || 0) >= 1 || (classCounts['crusader'] || 0) >= 1 || (classCounts['cleric'] || 0) >= 1 || knownFeats.has('smite') || knownFeats.has('smiteevil');
            info = met ? '(Has Smite)' : '(Requires Smite Ability)';
            if (!met) allMet = false;
            checks.push({ type: 'feature', label, met, info });
            continue;
          }
          if (partLow.includes('maneuver') || partLow.includes('stance')) {
            met = isMartialAdept;
            info = met ? '(Martial Adept / Manevra Mevcut)' : '(Martial Manevra / Stance Gerekli)';
            if (!met) allMet = false;
            checks.push({ type: 'maneuver', label, met, info });
            continue;
          }

          // E.1) Armor & Shield Proficiency Prerequisite Check
          if (partLow.includes('armor proficiency') || partLow.includes('shield proficiency') || partLow.includes('zırh ustalığı') || partLow.includes('kalkan ustalığı')) {
            const pNorm = partLow.replace(/[^a-z0-9]/g, '');
            if (pNorm.includes('heavy')) {
              met = Boolean(prof.armors.heavy);
              info = met ? '(Has Heavy Armor Prof.)' : '(Missing Heavy Armor Prof.)';
            } else if (pNorm.includes('medium')) {
              met = Boolean(prof.armors.medium);
              info = met ? '(Has Medium Armor Prof.)' : '(Missing Medium Armor Prof.)';
            } else if (pNorm.includes('light')) {
              met = Boolean(prof.armors.light);
              info = met ? '(Has Light Armor Prof.)' : '(Missing Light Armor Prof.)';
            } else if (pNorm.includes('towershield')) {
              met = Boolean(prof.shields.tower);
              info = met ? '(Has Tower Shield Prof.)' : '(Missing Tower Shield Prof.)';
            } else if (pNorm.includes('shield')) {
              met = Boolean(prof.shields.shield || prof.shields.tower);
              info = met ? '(Has Shield Prof.)' : '(Missing Shield Prof.)';
            }
            if (!met) allMet = false;
            checks.push({ type: 'proficiency', label, met, info });
            continue;
          }

          // E.2) Weapon Proficiency Prerequisite Check
          if (partLow.includes('proficiency') || partLow.includes('ustalığı') || partLow.includes('weapon prof')) {
            const pNorm = partLow.replace(/[^a-z0-9]/g, '');
            if (pNorm.includes('martial')) {
              met = Boolean(prof.weapons.martial || (prof.weapons.specific && prof.weapons.specific.size > 0));
              info = met ? '(Has Martial Weapon Prof.)' : '(Missing Martial Weapon Prof.)';
            } else if (pNorm.includes('simple')) {
              met = Boolean(prof.weapons.simple);
              info = met ? '(Has Simple Weapon Prof.)' : '(Missing Simple Weapon Prof.)';
            } else if (pNorm.includes('exotic')) {
              const match = part.match(/exotic weapon proficiency\s*\((.*?)\)/i);
              if (match) {
                const wep = match[1].toLowerCase().trim();
                met = Boolean(prof.weapons.exoticAll || (prof.weapons.specific && prof.weapons.specific.has(wep)));
                info = met ? `(Proficient: ${match[1]})` : `(Missing Prof.: ${match[1]})`;
              } else {
                met = Boolean(prof.weapons.exoticAll || Array.from(knownFeats).some(kf => kf.includes('exoticweaponproficiency')));
                info = met ? '(Has Exotic Weapon Prof.)' : '(Missing Exotic Weapon Prof.)';
              }
            } else {
              met = Boolean(prof.weapons.martial || prof.weapons.simple || (prospectiveBab >= 1));
              info = met ? '(Weapon Proficient)' : '(Missing Proficiency)';
            }
            if (!met) allMet = false;
            checks.push({ type: 'proficiency', label, met, info });
            continue;
          }

          // F) Class Option Check (e.g. "Crusader, Swordsage veya Warblade 1")
          if (part.includes('veya') || part.includes(' or ')) {
            const options = part.split(/\s*(?:veya|or)\s*/i);
            met = options.some(opt => {
              const optClean = opt.toLowerCase().replace(/\d+/g, '').trim();
              return Boolean(classCounts[optClean]) || selectedClassName.toLowerCase().includes(optClean);
            });
            info = met ? '(Class Eligible)' : '(Missing Required Class)';
            if (!met) allMet = false;
            checks.push({ type: 'class', label, met, info });
            continue;
          }

          // G) Specific Feat Requirement (e.g. "Power Attack", "Spell Focus (conjuration)", "Point Blank Shot")
          const normPart = normalizeFeatName(part);
          const normPartBase = normalizeFeatName(part.replace(/\(.*?\)/g, ''));
          met = Array.from(knownFeats).some(kf => kf === normPart || kf === normPartBase || (normPart.length >= 4 && kf.includes(normPart)));
          info = met ? '(Feat Mevcut)' : '(Feat Eksik)';
          if (!met) allMet = false;
          checks.push({ type: 'feat', label, met, info });
        }

        return {
          hasPrereqs: true,
          allMet,
          checks,
          rawPrereq,
          isAlreadyKnownFromClass: isAlreadyKnown,
          isClassGranted: isAlreadyKnownFromClass,
          isAlreadyTaken,
          alreadyKnownReason,
          alreadyKnownBadgeText
        };
      }

      function getFeatCategoryBadgeStyle(cat) {
        if (!cat) return 'bg-slate-800 text-slate-300 border-slate-700';
        const l = cat.toLowerCase();
        if (l.includes('fighter') || l.includes('martial') || l.includes('bonus')) return 'bg-amber-950/80 text-amber-300 border-amber-600/60';
        if (l.includes('boon') || l.includes('grant')) return 'bg-purple-950/80 text-purple-300 border-purple-600/60';
        if (l.includes('flaw')) return 'bg-rose-950/80 text-rose-300 border-rose-600/60';
        if (l.includes('racial')) return 'bg-sky-950/80 text-sky-300 border-sky-600/60';
        if (l.includes('special')) return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-600/60';
      }

      function renderLevelUpFeatSlots() {
        const container = document.getElementById('lvlup-feat-slots-container');
        if (!container) return;
        container.innerHTML = '';

        levelUpModalFeatSlots.forEach((slot, idx) => {
          const card = document.createElement('div');
          card.className = 'bg-slate-950 border border-slate-800 hover:border-purple-600/50 rounded-xl p-3.5 space-y-3 transition shadow-sm';

          const hasFeat = Boolean(slot.name && slot.name.trim());
          const isOpen = (activeLevelUpFeatSearchSlot === idx);
          const currentQuery = (levelUpFeatSearchQueries[idx] !== undefined) ? levelUpFeatSearchQueries[idx] : (slot.name || '');

          // Prerequisite evaluation for selected feat
          let prereqHtml = '';
          if (hasFeat) {
            const catalog = getCombinedFeatCatalog();
            const found = catalog.find(f => f.name.toLowerCase() === slot.name.toLowerCase()) || {
              name: slot.name,
              prereq: slot.prereq || '-',
              benefit: slot.benefit || ''
            };
            const pEval = checkFeatPrerequisites(found, idx);

            if (pEval.isAlreadyKnownFromClass) {
              prereqHtml = `
                <div class="flex items-center gap-1.5 text-[10px] text-blue-300 bg-blue-950/60 border border-blue-700/60 rounded-lg px-2.5 py-1">
                  <span>🔒</span>
                  <span><b>${pEval.isAlreadyTaken ? 'Already Owned:' : 'Class Proficiency:'}</b> ${pEval.alreadyKnownReason || 'Your character already possesses this ability.'}</span>
                </div>
              `;
            } else if (!pEval.hasPrereqs) {
              prereqHtml = `
                <div class="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1">
                  <span>ℹ️</span>
                  <span>No Prerequisites: Can be selected freely by any eligible character.</span>
                </div>
              `;
            } else if (pEval.allMet) {
              prereqHtml = `
                <div class="flex flex-wrap items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-950/50 border border-emerald-700/60 rounded-lg px-2.5 py-1.5">
                  <span class="font-bold flex items-center gap-1 shrink-0"><span>✅</span> <span>Prerequisites Met:</span></span>
                  <div class="flex flex-wrap items-center gap-1">
                    ${pEval.checks.map(c => `
                      <span class="bg-emerald-900/60 text-emerald-200 border border-emerald-600/50 rounded px-1.5 py-0.5 font-mono text-[9px] flex items-center gap-0.5">
                        <span>${c.label}</span>
                        <span class="font-bold text-emerald-400">✓</span>
                        <span class="text-emerald-300/80 text-[8px]">${c.info}</span>
                      </span>
                    `).join('')}
                  </div>
                </div>
              `;
            } else {
              prereqHtml = `
                <div class="flex flex-wrap items-center gap-1.5 text-[10px] text-rose-300 bg-rose-950/60 border border-rose-700/70 rounded-lg px-2.5 py-1.5">
                  <span class="font-bold flex items-center gap-1 shrink-0"><span>⚠️</span> <span>Prerequisite Warning:</span></span>
                  <div class="flex flex-wrap items-center gap-1">
                    ${pEval.checks.map(c => `
                      <span class="rounded px-1.5 py-0.5 font-mono text-[9px] flex items-center gap-0.5 ${c.met ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50' : 'bg-rose-900/90 text-rose-100 border border-rose-500 font-bold'}">
                        <span>${c.label}</span>
                        <span>${c.met ? '✓' : '✗'}</span>
                        <span class="text-[8px] opacity-90">${c.info}</span>
                      </span>
                    `).join('')}
                  </div>
                </div>
              `;
            }
          }

          card.innerHTML = `
            <!-- Slot Header -->
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🎖️</span>
                  <span>${slot.title || `Feat Slot #${idx + 1}`}</span>
                </span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${getFeatCategoryBadgeStyle(slot.category)}">
                  ${slot.category || 'Regular Feat'}
                </span>
              </div>
              <div class="flex items-center gap-2">
                ${hasFeat ? `
                  <button type="button" onclick="clearLevelUpFeatSlot(${idx})" class="text-[10px] font-semibold text-slate-400 hover:text-amber-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded px-2 py-0.5 transition flex items-center gap-1" title="Clear selection">
                    <span>🗑️</span>
                    <span>Clear</span>
                  </button>
                ` : ''}
                ${levelUpModalFeatSlots.length > 1 ? `
                  <button type="button" onclick="removeLevelUpFeatSlot(${idx})" class="text-slate-400 hover:text-rose-400 p-0.5 text-xs transition" title="Remove this slot">
                    ✕
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Category & Spotlight Search Bar -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Category / Type *</label>
                <select onchange="onLevelUpSlotCategoryChange(${idx}, this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-purple-500">
                  <option value="Regular Feat" ${slot.category === 'Regular Feat' ? 'selected' : ''}>🎖️ Normal Feat</option>
                  <option value="Class Bonus Feat" ${slot.category === 'Class Bonus Feat' ? 'selected' : ''}>⚔️ Class Bonus Feat</option>
                  <option value="DM Boon" ${slot.category === 'DM Boon' ? 'selected' : ''}>🌟 DM Boon</option>
                  <option value="Flaw" ${slot.category === 'Flaw' ? 'selected' : ''}>⚠️ Kusur / Flaw</option>
                  <option value="Racial Trait" ${slot.category === 'Racial Trait' ? 'selected' : ''}>🧬 Irksal Bonus Feat</option>
                  <option value="Special Ability" ${slot.category === 'Special Ability' ? 'selected' : ''}>✨ Special Ability</option>
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                  <span>Spotlight & AI Feat Arama</span>
                  <span class="text-[9px] text-purple-300 font-normal">Compendium + 3.5e RAW Validation</span>
                </label>
                <div class="relative flex items-center">
                  <div class="absolute left-2.5 text-slate-400 text-xs pointer-events-none">🔍</div>
                  <input type="text"
                         id="lvlup-feat-search-input-${idx}"
                         value="${(currentQuery || '').replace(/"/g, '&quot;')}"
                         placeholder="Search feats, pick from catalog, or enter custom name..."
                         onfocus="openLevelUpFeatSearchConsole(${idx})"
                         oninput="onLevelUpFeatSearchInput(${idx}, this.value)"
                         class="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-lg pl-8 pr-24 py-1.5 text-xs text-white font-bold focus:outline-none transition">
                  <button type="button"
                          onclick="toggleLevelUpFeatSearchConsole(${idx})"
                          class="absolute right-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-[10px] font-bold border border-slate-600 transition flex items-center gap-1 cursor-pointer"
                          title="Toggle feat catalog">
                    <span>📜</span>
                    <span>${isOpen ? 'Kapat ▲' : 'Katalog ▼'}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Inline Target Selector if Weapon Feat -->
            ${(() => {
              const lowerName = (slot.name || '').toLowerCase();
              const isWeapon = /^(weapon focus|greater weapon focus|weapon specialization|greater weapon specialization|improved critical|exotic weapon proficiency)/i.test(lowerName);
              if (!isWeapon) return '';
              const isExotic = /exotic weapon proficiency/i.test(lowerName);
              const match = (slot.name || '').match(/\((.*?)\)/);
              const curTarget = match ? match[1].trim() : '';
              const targetList = isExotic ? getAvailableExoticWeapons() : getAvailableTargetWeapons(false);
              return `
                <div class="bg-slate-900 border border-amber-600/60 rounded-lg p-2 flex items-center justify-between gap-2 shadow-sm">
                  <span class="text-[10px] font-bold text-amber-300 flex items-center gap-1 shrink-0">
                    <span>${isExotic ? '🗡️' : '⚔️'}</span>
                    <span>${isExotic ? 'Egzotik Silah:' : 'Hedef Silah:'}</span>
                  </span>
                  <select onchange="onLevelUpFeatTargetChange(${idx}, this.value)" class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-amber-500">
                    <option value="">-- Select a Weapon --</option>
                    ${targetList.map(w => `<option value="${w}" ${curTarget.toLowerCase() === w.toLowerCase() ? 'selected' : ''}>${w}</option>`).join('')}
                  </select>
                </div>
              `;
            })()}

            <!-- Prerequisite Evaluation & Warning Badge -->
            <div id="lvlup-feat-prereq-badge-${idx}">
              ${prereqHtml}
            </div>

            <!-- Benefit / Description Field -->
            <div>
              <label class="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Benefit Summary</label>
              <input type="text"
                     id="lvlup-feat-benefit-input-${idx}"
                     value="${(slot.benefit || '').replace(/"/g, '&quot;')}"
                     oninput="levelUpModalFeatSlots[${idx}].benefit = this.value"
                     placeholder="e.g., +2 Dodge AC, +1 attack, extra readied maneuver..."
                     class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500">
            </div>

            <!-- Expandable Spotlight & Rule Master AI Search Console -->
            <div id="lvlup-feat-search-console-${idx}" class="${isOpen ? '' : 'hidden'} bg-slate-900/95 border border-purple-500/50 rounded-xl p-3 space-y-2.5 shadow-xl transition">
              <!-- Dynamically populated by renderLevelUpFeatSearchResults -->
            </div>
          `;

          container.appendChild(card);

          if (isOpen) {
            renderLevelUpFeatSearchResults(idx);
          }
        });
      }

      function onLevelUpFeatTargetChange(slotIdx, targetWeapon) {
        if (!levelUpModalFeatSlots[slotIdx]) return;
        const currentName = levelUpModalFeatSlots[slotIdx].name || '';
        const baseName = currentName.replace(/\(.*?\)/g, '').trim() || 'Exotic Weapon Proficiency';
        if (targetWeapon) {
          levelUpModalFeatSlots[slotIdx].name = `${baseName} (${targetWeapon})`;
          if (/exotic weapon proficiency/i.test(baseName)) {
            levelUpModalFeatSlots[slotIdx].benefit = `You make attack rolls with the ${targetWeapon} normally (without the -4 nonproficiency penalty).`;
          } else if (/weapon focus/i.test(baseName)) {
            levelUpModalFeatSlots[slotIdx].benefit = `You gain a +1 bonus on all attack rolls you make using the selected weapon (${targetWeapon}).`;
          } else if (/improved critical/i.test(baseName)) {
            levelUpModalFeatSlots[slotIdx].benefit = `Doubles the critical threat range of the selected weapon (${targetWeapon}).`;
          }
        } else {
          levelUpModalFeatSlots[slotIdx].name = baseName;
        }
        levelUpFeatSearchQueries[slotIdx] = levelUpModalFeatSlots[slotIdx].name;
        renderLevelUpFeatSlots();
      }

      function openLevelUpFeatSearchConsole(slotIdx) {
        if (activeLevelUpFeatSearchSlot === slotIdx) return;
        activeLevelUpFeatSearchSlot = slotIdx;
        const consoleEl = document.getElementById(`lvlup-feat-search-console-${slotIdx}`);
        if (consoleEl) {
          consoleEl.classList.remove('hidden');
          renderLevelUpFeatSearchResults(slotIdx);
        } else {
          renderLevelUpFeatSlots();
        }
      }

      function closeLevelUpFeatSearchConsole() {
        activeLevelUpFeatSearchSlot = null;
        renderLevelUpFeatSlots();
      }

      function toggleLevelUpFeatSearchConsole(slotIdx) {
        if (activeLevelUpFeatSearchSlot === slotIdx) {
          activeLevelUpFeatSearchSlot = null;
        } else {
          activeLevelUpFeatSearchSlot = slotIdx;
        }
        renderLevelUpFeatSlots();
      }

      function onLevelUpFeatSearchInput(slotIdx, query) {
        levelUpFeatSearchQueries[slotIdx] = query;
        if (levelUpModalFeatSlots[slotIdx]) {
          levelUpModalFeatSlots[slotIdx].name = query;
        }
        if (activeLevelUpFeatSearchSlot !== slotIdx) {
          activeLevelUpFeatSearchSlot = slotIdx;
          const consoleEl = document.getElementById(`lvlup-feat-search-console-${slotIdx}`);
          if (consoleEl) consoleEl.classList.remove('hidden');
        }
        renderLevelUpFeatSearchResults(slotIdx);
      }

      function setLevelUpFeatSearchFilter(filterType, slotIdx) {
        levelUpFeatSearchFilters[slotIdx] = filterType;
        renderLevelUpFeatSearchResults(slotIdx);
      }

      function renderLevelUpFeatSearchResults(slotIdx) {
        const consoleEl = document.getElementById(`lvlup-feat-search-console-${slotIdx}`);
        if (!consoleEl) return;

        const slot = levelUpModalFeatSlots[slotIdx] || {};
        const query = (levelUpFeatSearchQueries[slotIdx] !== undefined ? levelUpFeatSearchQueries[slotIdx] : (slot.name || '')).toLowerCase().trim();
        const activeFilter = levelUpFeatSearchFilters[slotIdx] || ((slot.category === 'Regular Feat' || slot.category === 'Racial Trait') ? 'QUALIFIED' : 'ALL');

        const combined = getCombinedFeatCatalog();

        // Parametric classification predicates
        const isFighterFeat = f => Boolean(f.isFighterBonusFeat === true || f.category === 'Fighter' || f.category === 'Martial');
        const isBoonFeat = f => Boolean(f.category === 'DM Boon' || f.category === 'DM Grant' || f.type === 'DM Grant' || (f.source && f.source.toLowerCase().includes('campaign')));
        const isFlawFeat = f => Boolean(f.category === 'Flaw' || f.type === 'Flaw' || (f.name || '').toLowerCase().startsWith('flaw:'));

        // 1. Filter by category
        let baseList = combined;
        if (slot.category === 'DM Boon') {
          baseList = combined.filter(isBoonFeat);
        } else if (slot.category === 'Flaw') {
          baseList = combined.filter(isFlawFeat);
        } else if (slot.category === 'Class Bonus Feat') {
          baseList = combined.filter(isFighterFeat);
        } else if (slot.category === 'Special Ability') {
          baseList = combined.filter(f => f.category === 'Special Ability' || f.type === 'Special Ability');
        } else if (slot.category === 'Racial Trait') {
          // D&D 3.5e RAW (PHB p.12-13): Human and racial bonus feats have NO category restrictions (can choose any qualified feat)
          baseList = combined;
        }

        // 2. Filter by search query
        let queryFiltered = [...baseList];
        if (query) {
          queryFiltered = baseList.filter(f => {
            const n = (f.name || '').toLowerCase();
            const b = (f.benefit || '').toLowerCase();
            const s = (f.source || '').toLowerCase();
            const p = (f.prereq || '').toLowerCase();
            return n.includes(query) || b.includes(query) || s.includes(query) || p.includes(query);
          });

          // Dynamic exotic weapon suggestion if query matches an exotic weapon
          const exoticWeapons = (typeof getAvailableExoticWeapons === 'function') ? getAvailableExoticWeapons() : [];
          const matchedExotics = exoticWeapons.filter(w => w.toLowerCase().includes(query));
          matchedExotics.forEach(ew => {
            const synthName = `Exotic Weapon Proficiency (${ew})`;
            if (!queryFiltered.some(item => item.name.toLowerCase() === synthName.toLowerCase())) {
              queryFiltered.unshift({
                name: synthName,
                category: 'Fighter',
                type: 'Feat',
                isFighterBonusFeat: true,
                prereq: 'BAB +1',
                source: 'PHB p.94 / RAW',
                benefit: `You make attack rolls with the ${ew} normally (without the -4 nonproficiency penalty).`
              });
            }
          });
        }

        // 3. Evaluate prerequisites for all candidates
        const evaluatedItems = queryFiltered.map(item => {
          const pEval = checkFeatPrerequisites(item, slotIdx);
          return { item, pEval };
        });

        // Counts for filter pills (excluding already known feats from class from the Qualified count)
        const countAll = evaluatedItems.length;
        const countQualified = evaluatedItems.filter(e => e.pEval.allMet && !e.pEval.isAlreadyKnownFromClass).length;
        const countFighter = evaluatedItems.filter(e => isFighterFeat(e.item)).length;
        const countBoon = evaluatedItems.filter(e => isBoonFeat(e.item)).length;
        const countFlaw = evaluatedItems.filter(e => isFlawFeat(e.item)).length;

        // Apply active filter pill
        let filteredItems = evaluatedItems;
        if (activeFilter === 'QUALIFIED') {
          filteredItems = evaluatedItems.filter(e => e.pEval.allMet && !e.pEval.isAlreadyKnownFromClass);
        } else if (activeFilter === 'FIGHTER') {
          filteredItems = evaluatedItems.filter(e => isFighterFeat(e.item));
        } else if (activeFilter === 'BOON') {
          filteredItems = evaluatedItems.filter(e => isBoonFeat(e.item));
        } else if (activeFilter === 'FLAW') {
          filteredItems = evaluatedItems.filter(e => isFlawFeat(e.item));
        }

        // 4. Sort: Eligible first, then already known from class, then unqualified, then search relevance, then alphabetical
        filteredItems.sort((a, b) => {
          const aQual = a.pEval.allMet && !a.pEval.isAlreadyKnownFromClass;
          const bQual = b.pEval.allMet && !b.pEval.isAlreadyKnownFromClass;
          if (aQual && !bQual) return -1;
          if (!aQual && bQual) return 1;
          if (a.pEval.isAlreadyKnownFromClass && !b.pEval.isAlreadyKnownFromClass) return 1;
          if (!a.pEval.isAlreadyKnownFromClass && b.pEval.isAlreadyKnownFromClass) return -1;

          if (query) {
            const aScore = getFeatSearchRelevance(a.item, query);
            const bScore = getFeatSearchRelevance(b.item, query);
            if (aScore !== bScore) {
              return bScore - aScore;
            }
          }

          return (a.item.name || '').localeCompare(b.item.name || '');
        });

        // Build HTML
        const filterPillClass = (tab) => activeFilter === tab
          ? 'px-2 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-white shadow'
          : 'px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition';

        let listHtml = '';
        if (filteredItems.length === 0) {
          listHtml = `
            <div class="p-3 text-center text-xs text-slate-400 bg-slate-950/60 rounded-lg border border-slate-800">
              <span>No matching feat found in local compendium for "${query || 'Filter'}".</span>
            </div>
          `;
        } else {
          listHtml = filteredItems.map(({ item, pEval }) => {
            const isAlreadyKnown = Boolean(pEval.isAlreadyKnownFromClass);
            const isQualified = pEval.allMet && !isAlreadyKnown;
            const safeName = (item.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            let badgeClass = 'bg-rose-950/80 text-rose-300 border-rose-600/60';
            let badgeText = '⚠️ Prereqs Not Met';
            if (isAlreadyKnown) {
              badgeClass = 'bg-blue-950/80 text-blue-300 border-blue-600/60';
              badgeText = pEval.alreadyKnownBadgeText || (pEval.isAlreadyTaken ? '🔒 Already Owned' : '🔒 Class Proficiency (Owned)');
            } else if (isQualified) {
              badgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';
              badgeText = '✅ Qualified';
            }

            const prereqSummary = isAlreadyKnown
              ? `<div class="text-[9px] text-blue-300 pt-0.5">ℹ️ ${pEval.alreadyKnownReason || 'Your character already possesses this proficiency through class or existing feats.'}</div>`
              : (pEval.hasPrereqs
                ? `<div class="flex flex-wrap items-center gap-1 text-[9px] pt-1">
                     <span class="text-slate-400 font-semibold">Prereq:</span>
                     ${pEval.checks.map(c => `
                       <span class="px-1 py-0.2 rounded font-mono ${c.met ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/40' : 'bg-rose-950 text-rose-300 border border-rose-600/50'}">
                         ${c.label} ${c.met ? '✓' : '✗'}
                       </span>
                     `).join('')}
                   </div>`
                : `<div class="text-[9px] text-slate-400 pt-0.5">No Prerequisites</div>`);

            const allowBoonOverride = (slot.category === 'DM Boon');
            const buttonHtml = isAlreadyKnown
              ? `<button disabled type="button"
                         title="${(pEval.alreadyKnownReason || 'Zaten Sahipsiniz').replace(/"/g, '&quot;')}"
                         class="px-2.5 py-1 rounded text-[11px] font-bold shadow shrink-0 opacity-50 cursor-not-allowed bg-slate-800 text-slate-400 flex items-center gap-1">
                   <span>🔒</span>
                   <span>Zaten Sahipsiniz</span>
                 </button>`
              : ((!isQualified && !allowBoonOverride)
                ? `<button disabled type="button"
                           title="D&D 3.5e RAW: Cannot select this feat because prerequisites are not met"
                           class="px-2.5 py-1 rounded text-[11px] font-bold shadow shrink-0 opacity-50 cursor-not-allowed bg-slate-800 text-rose-300/80 border border-rose-800/50 flex items-center gap-1">
                     <span>🔒</span>
                     <span>Prereqs Not Met</span>
                   </button>`
                : `<button type="button"
                           onclick="selectFeatForLevelUpSlot(${slotIdx}, '${safeName}')"
                           class="px-2.5 py-1 rounded text-[11px] font-bold shadow transition shrink-0 cursor-pointer flex items-center gap-1 ${isQualified ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95' : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/40'}">
                     <span>${isQualified ? '🎯' : '🌟'}</span>
                     <span>${isQualified ? 'Select' : 'Select Boon'}</span>
                   </button>`);

            return `
              <div class="p-2.5 rounded-lg border transition ${isAlreadyKnown ? 'bg-slate-950/40 border-slate-800/80' : (isQualified ? 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/60' : 'bg-slate-950/50 hover:bg-slate-900/60 border-slate-800/80 hover:border-rose-600/40 opacity-85 hover:opacity-100')} space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-white text-xs">${item.name}</span>
                    <span class="text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeClass}">
                      ${badgeText}
                    </span>
                    <span class="text-[9px] text-indigo-300 bg-indigo-950/70 border border-indigo-700/50 px-1.5 py-0.2 rounded">
                      ${item.category || 'Feat'}
                    </span>
                    <span class="text-[9px] text-slate-400 font-mono">
                      ${item.source || '3.5e RAW'}
                    </span>
                  </div>
                  ${buttonHtml}
                </div>
                ${prereqSummary}
                ${item.benefit ? `<p class="text-[10px] text-slate-300 leading-relaxed line-clamp-2">${item.benefit}</p>` : ''}
              </div>
            `;
          }).join('');
        }

        consoleEl.innerHTML = `
          <!-- Spotlight Filter Tabs -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-1.5">
            <div class="flex items-center gap-1.5 flex-wrap">
              <button type="button" onclick="setLevelUpFeatSearchFilter('ALL', ${slotIdx})" class="${filterPillClass('ALL')}">
                📋 All (${countAll})
              </button>
              <button type="button" onclick="setLevelUpFeatSearchFilter('QUALIFIED', ${slotIdx})" class="${filterPillClass('QUALIFIED')}">
                ✅ Qualified (${countQualified})
              </button>
              <button type="button" onclick="setLevelUpFeatSearchFilter('FIGHTER', ${slotIdx})" class="${filterPillClass('FIGHTER')}">
                ⚔️ Fighter (${countFighter})
              </button>
              <button type="button" onclick="setLevelUpFeatSearchFilter('BOON', ${slotIdx})" class="${filterPillClass('BOON')}">
                🌟 DM Boon (${countBoon})
              </button>
              <button type="button" onclick="setLevelUpFeatSearchFilter('FLAW', ${slotIdx})" class="${filterPillClass('FLAW')}">
                ⚠️ Kusur (${countFlaw})
              </button>
            </div>
            <button type="button" onclick="closeLevelUpFeatSearchConsole()" class="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition font-bold cursor-pointer">
              ▲ Kapat
            </button>
          </div>

          <!-- Feat List -->
          <div class="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
            ${listHtml}
          </div>

          <!-- Rule Master AI Fallback -->
          <div class="pt-2 border-t border-slate-800/80 space-y-1.5">
            <button type="button"
                    onclick="triggerRuleMasterForLevelUpSlot(${slotIdx})"
                    class="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-purple-400/40 shadow transition cursor-pointer active:scale-98">
              <span>⚡</span>
              <span>Fetch via Rule Master AI: "${query || 'New 3.5e Feat'}" (3.5e Compendium)</span>
            </button>
            <div id="lvlup-feat-ai-status-${slotIdx}" class="hidden text-xs p-2 rounded-lg"></div>
          </div>
        `;
      }

      function selectFeatForLevelUpSlot(idx, featName) {
        if (!levelUpModalFeatSlots[idx]) return;
        const slotCat = levelUpModalFeatSlots[idx].category || 'Regular Feat';
        const isInvEntry = getAllWarlockInvocations().some(i => (i.name || '').toLowerCase() === featName.toLowerCase());
        if (isInvEntry && slotCat !== 'Warlock Invocation' && slotCat !== 'DM Boon') {
          if (typeof showDiceTopToast === 'function') {
            showDiceTopToast({
              title: 'Warlock Invocation Restricted',
              desc: `"${featName}" is a Warlock Invocation and cannot be selected in a ${slotCat} slot.`,
              type: 'warning'
            });
          }
          return;
        }
        const pEvalSlot = (typeof checkFeatPrerequisites === 'function')
          ? checkFeatPrerequisites({ name: featName }, idx)
          : null;
        if (pEvalSlot && pEvalSlot.isAlreadyTaken) {
          if (typeof showDiceTopToast === 'function') {
            showDiceTopToast({
              title: 'Duplicate Feat Blocked',
              desc: pEvalSlot.alreadyKnownReason || `"${featName}" featine zaten sahipsiniz.`,
              type: 'warning'
            });
          }
          return;
        }
        if (slotCat !== 'DM Boon' && pEvalSlot && !pEvalSlot.allMet) {
          if (typeof showDiceTopToast === 'function') {
            showDiceTopToast({
              title: 'Prerequisites Not Met',
              desc: `Prerequisites not met for "${featName}" (${pEvalSlot.rawPrereq || 'Missing Prerequisite'}).`,
              type: 'warning'
            });
          }
          return;
        }
        const catalog = getCombinedFeatCatalog();
        const baseName = featName.replace(/\(.*?\)/g, '').trim();
        const found = catalog.find(f => f.name.toLowerCase() === featName.toLowerCase()) || catalog.find(f => f.name.toLowerCase() === baseName.toLowerCase());

        levelUpModalFeatSlots[idx].name = featName;
        levelUpModalFeatSlots[idx].benefit = found ? (found.benefit || '') : '';
        levelUpModalFeatSlots[idx].prereq = found ? (found.prereq || '-') : '-';

        if (found) {
          const lcat = (found.category || '').toLowerCase();
          if (lcat.includes('boon') || lcat.includes('grant')) {
            levelUpModalFeatSlots[idx].category = 'DM Boon';
          } else if (lcat.includes('flaw')) {
            levelUpModalFeatSlots[idx].category = 'Flaw';
          } else if (lcat.includes('fighter') || lcat.includes('martial') || found.isFighterBonusFeat === true) {
            if (levelUpModalFeatSlots[idx].category === 'Class Bonus Feat' || levelUpModalFeatSlots[idx].category === 'Regular Feat' || levelUpModalFeatSlots[idx].category === 'Racial Trait') {
              // Maintain slot context
            }
          } else if (lcat.includes('special')) {
            levelUpModalFeatSlots[idx].category = 'Special Ability';
          }
        }
        levelUpFeatSearchQueries[idx] = featName;
        activeLevelUpFeatSearchSlot = null;
        renderLevelUpFeatSlots();
      }

      function clearLevelUpFeatSlot(idx) {
        if (!levelUpModalFeatSlots[idx]) return;
        levelUpModalFeatSlots[idx].name = '';
        levelUpModalFeatSlots[idx].benefit = '';
        levelUpModalFeatSlots[idx].prereq = '-';
        levelUpFeatSearchQueries[idx] = '';
        renderLevelUpFeatSlots();
      }


      async function triggerRuleMasterForLevelUpSlot(idx) {
        const input = document.getElementById(`lvlup-feat-search-input-${idx}`);
        const query = (input?.value || levelUpModalFeatSlots[idx]?.name || '').trim();
        const statusEl = document.getElementById(`lvlup-feat-ai-status-${idx}`);

        if (!query) {
          if (statusEl) {
            statusEl.className = 'text-xs p-2 rounded-lg bg-amber-950/80 border border-amber-500/80 text-amber-200 block';
            statusEl.innerHTML = '⚠️ Please enter a feat or ability name to search.';
          } else {
            alert('⚠️ Please enter a feat or ability name to search.');
          }
          input?.focus();
          return;
        }

        if (statusEl) {
          statusEl.className = 'text-xs p-2.5 rounded-lg bg-indigo-950/90 border border-indigo-500/80 text-indigo-200 block animate-pulse';
          statusEl.innerHTML = `<span>⚡</span> <span>Scanning D&D 3.5e sourcebooks for "${query}"...</span>`;
        }

        const apiKey = (typeof RuleMaster !== 'undefined' && RuleMaster.getApiKey)
          ? RuleMaster.getApiKey()
          : (localStorage.getItem('gemini_api_key') || '');

        if (!apiKey) {
          if (statusEl) {
            statusEl.className = 'text-xs p-2.5 rounded-lg bg-amber-950/90 border border-amber-500/80 text-amber-200 block';
            statusEl.innerHTML = `<span>⚠️</span> Not found in local compendium. Please configure your Gemini API key in Settings to search via Rule Master AI.`;
          }
          if (typeof openSettingsModal === 'function') openSettingsModal();
          return;
        }

        try {
          const slot = levelUpModalFeatSlots[idx] || {};
          const catHint = slot.category === 'Special Ability' ? 'Special Ability' : 'Feat';
          const statusProxy = {
            set textContent(val) {
              if (statusEl) statusEl.innerHTML = `<span>⚡</span> <span>${val}</span>`;
            }
          };

          let rows = null;
          if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchSingleAiRuleRows === 'function') {
            rows = await RuleMaster.fetchSingleAiRuleRows(query, catHint, apiKey, statusProxy);
          } else {
            throw new Error('RuleMaster search engine is not ready.');
          }

          if (!rows || !rows.length) {
            throw new Error(`No D&D 3.5e rule entry found for "${query}".`);
          }

          const topRow = rows[0];
          const featName = topRow[0] || query;
          const featType = topRow[1] || 'Feat';
          const featPrereq = topRow[2] || '-';
          const featSource = topRow[4] || 'D&D 3.5e';
          const featBenefit = topRow[5] || '';

          if (Array.isArray(masterDb)) {
            const clean = featName.toLowerCase().trim();
            if (!masterDb.some(m => (m.name || '').toLowerCase().trim() === clean)) {
              masterDb.push({
                name: featName,
                type: featType,
                slot: 'None',
                prereq: featPrereq,
                source: featSource,
                benefit: featBenefit,
                description: featBenefit
              });
              localStorage.setItem('dnd35_master_db', JSON.stringify(masterDb));
            }
          }

          levelUpModalFeatSlots[idx].name = featName;
          levelUpModalFeatSlots[idx].benefit = featBenefit;
          levelUpModalFeatSlots[idx].prereq = featPrereq;
          activeLevelUpFeatSearchSlot = null;
          renderLevelUpFeatSlots();

          if (typeof showDiceTopToast === 'function') {
            showDiceTopToast({
              icon: '✨',
              title: 'Feat Added to Compendium',
              breakdown: `${featName} (${featSource}) fetched and assigned to slot.`
            });
          }
        } catch (err) {
          if (statusEl) {
            statusEl.className = 'text-xs p-2.5 rounded-lg bg-rose-950/90 border border-rose-500/80 text-rose-200 block';
            statusEl.innerHTML = `<span>✕</span> Lookup error: ${err.message}`;
          }
        }
      }

      function onLevelUpSlotCategoryChange(idx, newCategory) {
        if (!levelUpModalFeatSlots[idx]) return;
        levelUpModalFeatSlots[idx].category = newCategory;
        renderLevelUpFeatSlots();
      }

      function onLevelUpSlotSelectChange(idx, featName) {
        if (!featName) return;
        selectFeatForLevelUpSlot(idx, featName);
      }


      function openFeatPickerForSlot(idx) {
        activeFeatPickerSlotIndex = idx;
        openLevelUpFeatSearchConsole(idx);
      }

      function addLevelUpFeatSlot(initialData = {}) {
        levelUpModalFeatSlots.push({
          title: initialData.title || `Extra Feat / Boon Slot #${levelUpModalFeatSlots.length + 1}`,
          category: initialData.category || 'Regular Feat',
          name: initialData.name || '',
          benefit: initialData.benefit || '',
          prereq: initialData.prereq || '-'
        });
        renderLevelUpFeatSlots();
      }

      function removeLevelUpFeatSlot(idx) {
        if (levelUpModalFeatSlots.length <= 1) return;
        levelUpModalFeatSlots.splice(idx, 1);
        renderLevelUpFeatSlots();
      }


    function updateLevelUpCasterProgVisibility(className) {
      const card = document.getElementById('lvlup-caster-prog-card');
      const progSel = document.getElementById('lvlup-caster-prog');
      const badge = document.getElementById('lvlup-caster-badge');
      if (!card) return;

      const clMode = character.settings?.clMode || 'Class Level';
      const isBoonCl = clMode === 'Character Level (DM Boon)' || clMode.includes('Warlock Boon');
      const allDefs = (typeof getAvailableClassDefs === 'function') ? getAvailableClassDefs() : {};
      const def = allDefs[className] || {};
      const isPrestige = Boolean(def.isPrestige || def.type === 'prestige');

      const descLower = (def.description || '').toLowerCase();
      const hasSpellProgInPrestige = isPrestige && (
        descLower.includes('spell') ||
        descLower.includes('bÃ¼yÃ¼') ||
        descLower.includes('caster level') ||
        ['eldritch knight', 'arcane trickster', 'mystic theurge', 'archmage', 'hierophant', 'loremaster', 'dragon disciple'].some(p => (className || '').toLowerCase().includes(p))
      );

      const curCl = Number(character.spellcasting?.cl) || 0;
      const hasExistingCaster = Boolean(character.spellcasting && (curCl > 0 || (character.spellcasting.slots && character.spellcasting.slots.length > 0)));

      // YalnÄ±zca BÃ¼yÃ¼ Ä°lerleten Prestij SÄ±nÄ±flarÄ±nda veya DM Boon etkinse gÃ¶sterilir
      const shouldShow = (hasSpellProgInPrestige && hasExistingCaster) || (isBoonCl && (hasExistingCaster || ['sorcerer', 'wizard', 'cleric', 'druid', 'bard', 'warlock'].includes((className || '').toLowerCase())));

      if (shouldShow) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }

      if (badge) {
        const casterClass = character.spellcasting?.className || (['Sorcerer', 'Wizard', 'Cleric', 'Druid', 'Bard', 'Warlock'].includes(className) ? className : 'Caster');
        badge.textContent = `${casterClass} CL: ${curCl}`;
      }

      if (progSel) {
        const isBaseCaster = ['Sorcerer', 'Wizard', 'Cleric', 'Druid', 'Bard', 'Warlock'].includes(className);
        if (isBaseCaster || hasSpellProgInPrestige) {
          progSel.value = 'primary';
        } else {
          progSel.value = 'none';
        }
      }

      if (typeof onLevelUpCasterProgChange === 'function') {
        onLevelUpCasterProgChange();
      }
    }

    function onLevelUpCasterProgChange() {
      const progSel = document.getElementById('lvlup-caster-prog');
      const clInput = document.getElementById('lvlup-cl-preview');
      const hint = document.getElementById('lvlup-caster-hint');
      if (!progSel || !clInput) return;

      const prog = character.levelProgression || [];
      const nextLvl = prog.length + 1;
      const currentCl = Number(character.spellcasting?.cl) || 0;
      const isBoonCl = character.settings?.clMode === 'Character Level (DM Boon)' || (character.settings?.clMode || '').includes('Warlock Boon');

      const val = progSel.value;
      if (val === 'primary') {
        const newCl = isBoonCl ? nextLvl : currentCl + 1;
        clInput.value = newCl;
        if (hint) {
          hint.innerHTML = `🔮 <b>Primary Caster Ä°lerletiliyor:</b> Yeni CL: <b class="text-white">${newCl}</b>. BÃ¼yÃ¼ yuvalarÄ± ve seviye baÅŸÄ± bÃ¼yÃ¼ gÃ¼cÃ¼ RAW kurallarÄ±na gÃ¶re artÄ±rÄ±lÄ±r.`;
        }
      } else if (val === 'cl_boon') {
        clInput.value = nextLvl;
        if (hint) {
          hint.innerHTML = `🌟 <b>DM Boon Etkin:</b> Caster Level (CL) tÃ¼m sÄ±nÄ±flarÄ±nÄ±z dahil toplam karakter seviyesine (<b class="text-white">${nextLvl}</b>) eÅŸitlenir!`;
        }
      } else if (val === 'secondary') {
        clInput.value = currentCl;
        if (hint) {
          hint.innerHTML = `✨ <b>Ä°kincil BÃ¼yÃ¼cÃ¼ Ä°lerletiliyor:</b> +1 Secondary Caster Level artÄ±ÅŸÄ± uygulanÄ±r.`;
        }
      } else {
        clInput.value = isBoonCl ? nextLvl : currentCl;
        if (hint) {
          hint.innerHTML = `No spellcasting class level will be advanced at this level.`;
        }
      }
    }

    function onLevelUpClassChange() {
      const defaultClass = (character.classes?.split(' ')[0]) || (character.levelProgression?.[0]?.className) || 'Fighter';
      const className = document.getElementById('lvlup-class-select')?.value || defaultClass;
      const allDefs = getAvailableClassDefs();
      const def = allDefs[className] || DND35_CLASS_DEFS[className] || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4 };

      const hdInput = document.getElementById('lvlup-hd-input');
      if (hdInput) hdInput.value = `d${def.hd}`;

      const prog = character.levelProgression || [];
      const classLvlsSoFar = prog.filter(p => p.className === className).length;
      const targetClassLvl = classLvlsSoFar + 1;

      // 1. Auto-Populate Class Features from RuleEngine
      const autoData = (typeof RuleEngine !== 'undefined' && RuleEngine.getClassLevelFeatures)
        ? RuleEngine.getClassLevelFeatures(className, targetClassLvl)
        : { features: [], hasBonusFeat: false };

      const featList = autoData.features || [];

      // Render Class Stats Preview Card (matching change-class-preview-card)
      const preview = document.getElementById('lvlup-class-preview-card');
      if (preview) {
        const featBadges = featList.length > 0 
          ? featList.map(fName => {
              const safe = fName.replace(/'/g, "\\'");
              const cornerBadge = getFeatPinCornerBadgeHtml(fName);
              return `<button type="button" onclick="showFeatDetail('${safe}')" class="relative inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/80 hover:bg-emerald-900 transition" title="View rule details"><span>✨</span><span class="pr-2">${fName}</span>${cornerBadge}</button>`;
            }).join(' ')
          : '<span class="text-slate-500 italic text-[10px]">No special class features or bonus feat selection.</span>';

        const fortLetter = (def.fort || 'poor')[0].toUpperCase();
        const refLetter = (def.ref || 'poor')[0].toUpperCase();
        const willLetter = (def.will || 'poor')[0].toUpperCase();
        const babLabel = def.bab === 1.0 ? 'Full (+1)' : (def.bab === 0.75 ? '3/4 Medium' : '1/2 Poor');

        preview.innerHTML = `
          <div class="flex items-center justify-between text-amber-300 font-bold border-b border-slate-800 pb-1">
            <span>${className} (Level ${targetClassLvl})</span>
            <span class="text-[10px] text-slate-400">HD: d${def.hd} | Skills: ${def.skills || 2}+INT</span>
          </div>
          <div class="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-300">
            <div>BAB: <strong class="text-sky-300">${babLabel}</strong></div>
            <div>Saves: <strong class="text-emerald-300">F:${fortLetter} R:${refLetter} W:${willLetter}</strong></div>
          </div>
          <div class="pt-1 text-[10px]">
            <span class="text-slate-400 font-bold">Features Gained:</span>
            <div class="flex flex-wrap gap-1 mt-1">${featBadges}</div>
          </div>
        `;
      }

      // If class level grants a bonus feat, ensure slot exists
      if (autoData.hasBonusFeat) {
        const hasBonusSlot = levelUpModalFeatSlots.some(s => s.category === 'Class Bonus Feat');
        if (!hasBonusSlot) {
          addLevelUpFeatSlot({
            title: `${className} Class Bonus Feat (Level ${targetClassLvl})`,
            category: 'Class Bonus Feat'
          });
        }
      }

      // 2. Calculate BAB, Saves, HD, Skill points using RuleEngine
      const sys = character.settings?.babSaveSystem || 'standard';
      const isHuman = (character.race || '').toLowerCase().includes('human');
      const intMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.int || 10)
        : Math.floor(((character.abilities?.int || 10) - 10) / 2);

      const prospectiveProg = [...prog, { className, hd: `d${def.hd}`, hpGain: 0, active: true }];
      const prospectiveSummary = (typeof RuleEngine !== 'undefined' && RuleEngine.calculateProgression)
        ? RuleEngine.calculateProgression(prospectiveProg, { system: sys, isHuman, intMod })
        : null;

      if (prospectiveSummary) {
        const babIn = document.getElementById('lvlup-bab-input');
        if (babIn) babIn.value = prospectiveSummary.baseBab;
        const fortIn = document.getElementById('lvlup-fort-input');
        if (fortIn) fortIn.value = prospectiveSummary.baseSaves.fort;
        const refIn = document.getElementById('lvlup-ref-input');
        if (refIn) refIn.value = prospectiveSummary.baseSaves.ref;
        const willIn = document.getElementById('lvlup-will-input');
        if (willIn) willIn.value = prospectiveSummary.baseSaves.will;
      }

      const baseSkill = def.skills || 2;
      const skillPtsThisLvl = (prospectiveProg.length === 1)
        ? Math.max(4, (baseSkill + intMod + (isHuman ? 1 : 0)) * 4)
        : Math.max(1, baseSkill + intMod + (isHuman ? 1 : 0));
      const skillIn = document.getElementById('lvlup-skill-input');
      if (skillIn) skillIn.value = skillPtsThisLvl;

      // Adjust Caster progression recommendation & contextual visibility
      if (typeof updateLevelUpCasterProgVisibility === 'function') {
        updateLevelUpCasterProgVisibility(className);
      }

      const isFirstLvl = (prospectiveProg.length === 1);
      rollLevelUpHp(isFirstLvl ? 'max' : 'roll');
    }

    function rollLevelUpHp(mode = 'avg') {
      const defaultClass = (character.classes?.split(' ')[0]) || (character.levelProgression?.[0]?.className) || 'Fighter';
      const className = document.getElementById('lvlup-class-select')?.value || defaultClass;
      const allDefs = (typeof getAvailableClassDefs === 'function') ? getAvailableClassDefs() : {};
      const def = allDefs[className] || DND35_CLASS_DEFS[className] || { hd: 8 };
      const conMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.con || 10)
        : Math.floor(((character.abilities?.con || 10) - 10) / 2);

      let dieRoll = Math.floor(def.hd / 2) + 1;
      if (mode === 'roll') {
        dieRoll = Math.floor(Math.random() * def.hd) + 1;
      } else if (mode === 'max') {
        dieRoll = def.hd;
      }
      const hpInput = document.getElementById('lvlup-hp-gain-input');
      if (hpInput) hpInput.value = dieRoll;
      const hint = document.getElementById('lvlup-hp-formula-hint');
      if (hint) {
        hint.textContent = `Hit Die (d${def.hd}): ${dieRoll} (+ CON Mod ${conMod >= 0 ? '+' + conMod : conMod} = Total Max HP Gain: +${Math.max(1, dieRoll + conMod)})`;
      }
    }

    // ====================================================
    // GSHEET RULE MASTER LEVEL UP COPILOT CONTROLLER
    // ====================================================

    let lastCopilotAdviceData = null;

    function initLevelUpCopilot() {
      const badge = document.getElementById('lvlup-copilot-engine-badge');
      const headerBadge = document.getElementById('lvlup-copilot-header-badge');
      const hasKey = typeof RuleMaster !== 'undefined' && RuleMaster.getApiKey && !!RuleMaster.getApiKey();
      if (badge) {
        if (hasKey) {
          badge.textContent = '✨ Gemini AI Aktif';
          badge.className = 'text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/50';
        } else {
          badge.textContent = '📖 RAW Kural Motoru';
          badge.className = 'text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700';
        }
      }
      if (headerBadge) {
        headerBadge.textContent = hasKey ? 'AI' : 'RAW';
      }
      const loadingBox = document.getElementById('lvlup-copilot-loading');
      if (loadingBox) loadingBox.classList.add('hidden');
    }

    // ====================================================
    // 🔍 RULE MASTER: SINIF & PRESTİJ SINIFI ARAMA KONSOLU
    // ====================================================
    let currentClassFilterTab = 'all';

    function setClassFilterTab(tab) {
      currentClassFilterTab = tab;
      ['all', 'base', 'prestige', 'custom'].forEach(t => {
        const btn = document.getElementById(`class-filter-tab-${t}`);
        if (btn) {
          if (t === tab) {
            btn.className = 'px-2 py-1 rounded text-[10px] font-bold transition bg-purple-700 text-white shadow';
          } else {
            btn.className = 'px-2 py-1 rounded text-[10px] font-bold transition bg-slate-800 text-slate-400 hover:text-white';
          }
        }
      });
      filterLevelUpClassSearch();
    }

    let _lvlupClassSpotlightOpen = false;

    function toggleLevelUpClassSpotlightDropdown() {
      if (_lvlupClassSpotlightOpen) {
        closeLevelUpClassSpotlightDropdown();
      } else {
        openLevelUpClassSpotlightDropdown();
      }
    }

    // Geriye dönük uyumluluk için alias
    function toggleLevelUpClassSearchConsole() {
      toggleLevelUpClassSpotlightDropdown();
    }

    function openLevelUpClassSpotlightDropdown() {
      const panel = document.getElementById('lvlup-class-spotlight-dropdown');
      const chevron = document.getElementById('lvlup-class-trigger-chevron');
      const input = document.getElementById('lvlup-class-search-input');
      if (!panel) return;

      panel.classList.remove('hidden');
      if (chevron) chevron.textContent = '▲';
      _lvlupClassSpotlightOpen = true;

      filterLevelUpClassSearch();

      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);
      }
    }

    function closeLevelUpClassSpotlightDropdown() {
      const panel = document.getElementById('lvlup-class-spotlight-dropdown');
      const chevron = document.getElementById('lvlup-class-trigger-chevron');
      if (!panel) return;

      panel.classList.add('hidden');
      if (chevron) chevron.textContent = '▼';
      _lvlupClassSpotlightOpen = false;
    }

    function clearLevelUpClassSearch() {
      const input = document.getElementById('lvlup-class-search-input');
      if (input) {
        input.value = '';
        input.focus();
        filterLevelUpClassSearch();
      }
    }

    function updateLevelUpClassTriggerUI(className) {
      if (!className) return;
      const allDefs = (typeof getAvailableClassDefs === 'function') ? getAvailableClassDefs() : {};
      const def = allDefs[className] || (typeof DND35_CLASS_DEFS !== 'undefined' ? DND35_CLASS_DEFS[className] : null) || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'poor', skillPoints: 2 };

      const iconEl = document.getElementById('lvlup-class-trigger-icon');
      const titleEl = document.getElementById('lvlup-class-trigger-title');
      const badgeEl = document.getElementById('lvlup-class-trigger-badge');
      const subEl = document.getElementById('lvlup-class-trigger-sub');

      const isPrestige = def.type === 'Prestige Class';
      const isCustom = def.isCustom === true;

      if (iconEl) {
        iconEl.textContent = isPrestige ? '👑' : (isCustom ? '⚙️' : '🛡️');
      }
      if (titleEl) {
        titleEl.textContent = className;
      }
      if (badgeEl) {
        if (isPrestige) {
          badgeEl.className = 'text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/50';
          badgeEl.textContent = '👑 Prestij';
        } else if (isCustom) {
          badgeEl.className = 'text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-600/50';
          badgeEl.textContent = '⚙️ Custom Class';
        } else {
          badgeEl.className = 'text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50';
          badgeEl.textContent = '🛡️ Base Class';
        }
      }

      if (subEl) {
        const hdText = `d${def.hd || 8} HD`;
        const babRate = Number(def.bab) || 0.75;
        const babText = babRate === 1.0 ? 'Full BAB (+1.0)' : (babRate === 0.75 ? '3/4 BAB (+0.75)' : '1/2 BAB (+0.5)');
        const goodSaves = [];
        if (def.fort === 'good') goodSaves.push('Fort');
        if (def.ref === 'good') goodSaves.push('Ref');
        if (def.will === 'good') goodSaves.push('Will');
        const saveText = goodSaves.length === 3 ? 'All Good Saves' : (goodSaves.length > 0 ? `Good: ${goodSaves.join('/')}` : 'Poor Saves');
        const skillsText = `${def.skills || def.skillPoints || 2}+INT Skills`;

        subEl.textContent = `${hdText} • ${babText} • ${saveText} • ${skillsText}`;
      }
    }

    function initLevelUpClassSearch() {
      const input = document.getElementById('lvlup-class-search-input');
      if (input) input.value = '';
      currentClassFilterTab = 'all';
      ['all', 'base', 'prestige', 'custom'].forEach(t => {
        const btn = document.getElementById(`class-filter-tab-${t}`);
        if (btn) {
          btn.className = t === 'all' 
            ? 'px-2 py-1 rounded text-[10px] font-bold transition bg-purple-700 text-white shadow'
            : 'px-2 py-1 rounded text-[10px] font-bold transition bg-slate-800 text-slate-400 hover:text-white';
        }
      });
      filterLevelUpClassSearch();
    }

    function checkClassPrerequisites(className, def) {
      if (!def || !Array.isArray(def.prerequisites) || def.prerequisites.length === 0) {
        return { hasPrereqs: false, allMet: true, checks: [] };
      }

      // 1. Current BAB
      let currentBab = 0;
      if (typeof RuleEngine !== 'undefined' && RuleEngine.calculateProgression) {
        const progCalc = RuleEngine.calculateProgression(character.levelProgression || []);
        currentBab = progCalc.baseBab || 0;
      } else {
        currentBab = parseInt(character.bab) || 0;
      }

      // 2. Known Feats
      const featNames = new Set();
      if (Array.isArray(character.feats)) {
        character.feats.forEach(f => {
          const n = (typeof f === 'string' ? f : f?.name || '').trim().toLowerCase();
          if (n) featNames.add(n);
        });
      }
      if (Array.isArray(character.levelProgression)) {
        character.levelProgression.forEach(lvl => {
          if (lvl.active !== false && Array.isArray(lvl.feats)) {
            lvl.feats.forEach(f => {
              const n = (typeof f === 'string' ? f : f?.name || '').trim().toLowerCase();
              if (n) featNames.add(n);
            });
          }
        });
      }

      // 3. Known / Arcane classes
      const classesStr = (character.classes || '').toLowerCase();
      const hasArcane = classesStr.includes('sorcerer') || classesStr.includes('wizard') || classesStr.includes('duskblade') || classesStr.includes('bard') || classesStr.includes('warlock');

      // 4. Race
      const raceStr = (character.race || '').toLowerCase();

      let allMet = true;
      const checks = def.prerequisites.map(req => {
        let met = true;
        let info = '';

        if (req.key === 'bab') {
          met = currentBab >= (req.min || 0);
          info = `(Mevcut: +${currentBab})`;
        } else if (req.key === 'feat') {
          const reqName = (req.name || '').toLowerCase();
          met = Array.from(featNames).some(f => f.includes(reqName) || reqName.includes(f));
          info = met ? '(Feat Var)' : '(Feat Eksik)';
        } else if (req.key === 'arcane') {
          met = hasArcane;
          info = met ? '(Arcane Caster)' : '(No Arcane Spells)';
        } else if (req.key === 'race') {
          met = raceStr.includes((req.val || '').toLowerCase());
          info = met ? '(Irk Uygun)' : `(${req.val} gerekli)`;
        } else {
          met = true;
        }

        if (!met) allMet = false;
        return { text: req.text, met, info };
      });

      return { hasPrereqs: true, allMet, checks };
    }

    const _expandedClassProgressions = new Set();

    function getClassMaxLevel(def) {
      if (!def) return 10;
      if (Number(def.maxLevel) > 0) return Number(def.maxLevel);
      if (def.features && typeof def.features === 'object') {
        const keys = Object.keys(def.features).map(Number).filter(n => !isNaN(n) && n > 0);
        if (keys.length > 0) {
          const maxK = Math.max(...keys);
          if (maxK <= 5 && def.type === 'Prestige Class') return 5;
          if (def.type === 'Prestige Class') return Math.max(10, maxK);
          return Math.max(20, maxK);
        }
      }
      return (def.type === 'Prestige Class') ? 10 : 20;
    }

    function getClassLevelStats(def, lvl) {
      const babRate = Number(def.bab) || 0.75;
      let bab = 0;
      if (babRate === 1.0) bab = lvl;
      else if (babRate === 0.75) bab = Math.floor(lvl * 0.75);
      else bab = Math.floor(lvl * 0.5);

      const isGoodFort = def.fort === 'good';
      const isGoodRef = def.ref === 'good';
      const isGoodWill = def.will === 'good';

      const fort = isGoodFort ? Math.floor(2 + (lvl / 2)) : Math.floor(lvl / 3);
      const ref = isGoodRef ? Math.floor(2 + (lvl / 2)) : Math.floor(lvl / 3);
      const will = isGoodWill ? Math.floor(2 + (lvl / 2)) : Math.floor(lvl / 3);

      return {
        bab: `+${bab}`,
        fort: `+${fort}`,
        ref: `+${ref}`,
        will: `+${will}`,
        isGoodFort,
        isGoodRef,
        isGoodWill
      };
    }

    function getClassFeaturesForLevel(def, lvl) {
      if (!def) return [];
      const res = [];

      if (def.features && typeof def.features === 'object') {
        const raw = def.features[lvl] || def.features[String(lvl)];
        if (Array.isArray(raw)) {
          raw.forEach(item => {
            if (typeof item === 'string' && item.trim()) {
              res.push({ name: item.trim(), summary: '' });
            } else if (item && typeof item === 'object') {
              res.push({
                name: item.name || item.title || 'Class Feature',
                summary: item.summary || item.description || item.desc || ''
              });
            }
          });
        } else if (typeof raw === 'string' && raw.trim()) {
          res.push({ name: raw.trim(), summary: '' });
        } else if (raw && typeof raw === 'object') {
          res.push({
            name: raw.name || raw.title || 'Class Feature',
            summary: raw.summary || raw.description || raw.desc || ''
          });
        }
      }

      if (Array.isArray(def.bonusFeatLevels) && def.bonusFeatLevels.includes(lvl)) {
        if (!res.some(r => r.name.toLowerCase().includes('bonus feat'))) {
          res.push({ name: 'Bonus Feat', summary: 'Selectable bonus class/combat feat' });
        }
      }

      return res;
    }

    function generateClassProgressionHtml(className, def) {
      const maxLvl = getClassMaxLevel(def);
      const safeName = className.replace(/'/g, "\\'");
      const hasFeatures = def.features && Object.keys(def.features).length > 0;

      let rows = '';
      for (let lvl = 1; lvl <= maxLvl; lvl++) {
        const stats = getClassLevelStats(def, lvl);
        const feats = getClassFeaturesForLevel(def, lvl);

        let featsHtml = '';
        if (feats.length > 0) {
          featsHtml = feats.map(f => {
            const lower = f.name.toLowerCase();
            const isSpell = lower.includes('spell') || lower.includes('büyü');
            const isFeat = lower.includes('feat');
            const badgeBg = isSpell 
              ? 'bg-purple-950/80 border-purple-500/50 text-purple-200' 
              : (isFeat 
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' 
                  : 'bg-slate-900 border-slate-700 text-slate-200');
            const icon = isSpell ? '🔮' : (isFeat ? '🎖️' : '⚡');

            return `
              <div class="inline-flex flex-wrap items-baseline gap-1 text-[10px] ${badgeBg} border px-2 py-0.5 rounded shadow-sm">
                <span class="font-bold text-white">${icon} ${f.name}</span>
                ${f.summary ? `<span class="text-slate-300 text-[9px]">(${f.summary})</span>` : ''}
              </div>
            `;
          }).join(' ');
        } else {
          featsHtml = '<span class="text-slate-500 text-[10px] italic">—</span>';
        }

        const rowBg = lvl % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-950/50';

        rows += `
          <tr class="${rowBg} hover:bg-purple-950/40 transition border-b border-slate-800/80">
            <td class="px-2.5 py-1.5 text-center font-mono font-bold text-amber-300 text-[11px] whitespace-nowrap">${lvl}. Seviye</td>
            <td class="px-2.5 py-1.5 text-center font-mono font-bold text-sky-300 text-[11px] whitespace-nowrap">${stats.bab}</td>
            <td class="px-2.5 py-1.5 text-center font-mono text-[10px] whitespace-nowrap ${stats.isGoodFort ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${stats.fort}</td>
            <td class="px-2.5 py-1.5 text-center font-mono text-[10px] whitespace-nowrap ${stats.isGoodRef ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${stats.ref}</td>
            <td class="px-2.5 py-1.5 text-center font-mono text-[10px] whitespace-nowrap ${stats.isGoodWill ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${stats.will}</td>
            <td class="px-3 py-1.5 text-[11px] leading-relaxed">
              <div class="flex flex-wrap gap-1 items-center">
                ${featsHtml}
              </div>
            </td>
          </tr>
        `;
      }

      return `
        <div class="mt-2 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-purple-500/40 rounded-xl p-3 shadow-2xl space-y-2.5 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-2">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded bg-purple-950 border border-purple-500/40 flex items-center justify-center text-xs">📊</div>
              <div>
                <h4 class="font-extrabold text-white text-xs flex items-center gap-2">
                  <span>${className} Class Progression Table</span>
                  <span class="text-[9px] font-mono text-purple-300 bg-purple-950/90 px-1.5 py-0.5 rounded border border-purple-600/50">1 - ${maxLvl}. Seviye RAW</span>
                </h4>
                <div class="text-[10px] text-slate-400">${def.source || 'D&D 3.5e'} • Hit Die: <strong class="text-amber-300 font-mono">d${def.hd}</strong> • Skills: <strong class="text-purple-300 font-mono">${def.skills || 2}+INT</strong>/level</div>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              ${!hasFeatures ? `
                <button type="button" onclick="fetchClassFromRuleMasterAi('${safeName}')" class="text-[10px] text-purple-300 hover:text-white bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer" title="Fetch full progression details from sourcebooks via Rule Master AI">
                  <span>✨</span>
                  <span>Yetenekleri Getir</span>
                </button>
              ` : ''}
              <button type="button" onclick="toggleClassProgression('${safeName}')" class="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer" title="Tabloyu kapat">✕ Kapat</button>
            </div>
          </div>

          <div class="overflow-x-auto max-h-80 overflow-y-auto pr-1 rounded-lg border border-slate-800 custom-scroll">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-purple-950/80 text-[10px] uppercase tracking-wider text-purple-200 font-bold border-b border-purple-500/40 sticky top-0 z-10 backdrop-blur">
                  <th class="px-2.5 py-1.5 text-center w-20">Seviye</th>
                  <th class="px-2.5 py-1.5 text-center w-16">BAB</th>
                  <th class="px-2 py-1.5 text-center w-14">Fort</th>
                  <th class="px-2 py-1.5 text-center w-14">Ref</th>
                  <th class="px-2 py-1.5 text-center w-14">Will</th>
                  <th class="px-3 py-1.5">Class Features &amp; Spellcasting Progression</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    function toggleClassProgression(className, forceOpen = false) {
      if (forceOpen) {
        _expandedClassProgressions.add(className);
      } else if (_expandedClassProgressions.has(className)) {
        _expandedClassProgressions.delete(className);
      } else {
        _expandedClassProgressions.add(className);
      }
      filterLevelUpClassSearch();
    }

    function filterLevelUpClassSearch() {
      const resultsContainer = document.getElementById('lvlup-class-search-results');
      const countBadge = document.getElementById('lvlup-class-count-badge');
      if (!resultsContainer) return;
      const prevScroll = resultsContainer.scrollTop;

      const q = (document.getElementById('lvlup-class-search-input')?.value || '').trim().toLowerCase();
      const allDefs = getAvailableClassDefs();
      const selectedClass = document.getElementById('lvlup-class-select')?.value || '';

      const matched = [];

      Object.keys(allDefs).forEach(cName => {
        const def = allDefs[cName];
        const isPrestige = def.type === 'Prestige Class';
        const isCustom = def.isCustom === true;
        const isBase = !isPrestige && !isCustom;

        // Filter tab
        if (currentClassFilterTab === 'base' && !isBase) return;
        if (currentClassFilterTab === 'prestige' && !isPrestige) return;
        if (currentClassFilterTab === 'custom' && !isCustom) return;

        // Search text
        if (q) {
          const matchName = cName.toLowerCase().includes(q);
          const matchSource = (def.source || '').toLowerCase().includes(q);
          const matchRole = (def.role || '').toLowerCase().includes(q);
          const matchDesc = (def.description || '').toLowerCase().includes(q);
          const matchPrereq = Array.isArray(def.prerequisites) && def.prerequisites.some(p => (p.text || '').toLowerCase().includes(q));
          if (!matchName && !matchSource && !matchRole && !matchDesc && !matchPrereq) {
            return;
          }
        }

        const prereqResult = checkClassPrerequisites(cName, def);

        // Sorting Priority (Kullanıcı İsteği: 1. Temel, 2. Alınabilir Prestij, 3. Diğerleri):
        // Priority 1: Temel Sınıflar (Base Classes)
        // Priority 2: Alınabilecek Prestij Sınıfları (Önkoşulları eksiksiz sağlananlar)
        // Priority 3: Diğerleri (Önkoşulları henüz eksik olan prestij sınıfları)
        let priority = 1;
        if (isPrestige) {
          priority = (prereqResult.hasPrereqs && !prereqResult.allMet) ? 3 : 2;
        }

        matched.push({ 
          name: cName, 
          def, 
          isPrestige, 
          isCustom, 
          prereqResult, 
          priority 
        });
      });

      // Sort: Priority 1 (Base) -> Priority 2 (Eligible Prestige) -> Priority 3 (Ineligible Prestige)
      // Within same priority: Selected class first, then alphabetically
      matched.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        const aSelected = (a.name.toLowerCase() === selectedClass.toLowerCase());
        const bSelected = (b.name.toLowerCase() === selectedClass.toLowerCase());
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return a.name.localeCompare(b.name);
      });

      if (countBadge) {
        countBadge.textContent = `${matched.length} Classes`;
      }

      if (matched.length === 0) {
        if (q) {
          const safeQuery = q.replace(/"/g, '&quot;').replace(/'/g, "\\'");
          resultsContainer.innerHTML = `
            <div class="p-3.5 text-center space-y-2.5 bg-slate-950/80 rounded-xl border border-purple-500/40 shadow-xl">
              <div class="text-slate-200 text-xs font-semibold">
                🔍 Class &quot;<span class="text-amber-300 font-bold">${q}</span>&quot; not found in local compendium.
              </div>
              <p class="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed">
                Scan official D&D 3.5e RAW sourcebooks (PHB, Complete series, Tome of Battle, DMG, etc.) to automatically fetch this class and save it to Master DB.
              </p>
              <div class="pt-1 flex items-center justify-center gap-2">
                <button type="button" onclick="fetchClassFromRuleMasterAi('${safeQuery}')" id="btn-fetch-class-ai" class="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-purple-400/40">
                  <span>✨</span>
                  <span>Fetch from D&D 3.5e Sourcebooks via Rule Master (AI)</span>
                </button>
              </div>
            </div>
          `;
        } else {
          resultsContainer.innerHTML = `
            <div class="p-4 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800">
              🔍 No classes matched your search. You can create a custom base or prestige class using the <strong>"Add Custom Class"</strong> button above.
            </div>
          `;
        }
        return;
      }

      let lastPriority = null;
      let htmlOutput = '';

      matched.forEach(item => {
        const cName = item.name;
        const def = item.def;
        const isSelected = (cName.toLowerCase() === selectedClass.toLowerCase());
        const isPrestige = item.isPrestige;
        const isCustom = item.isCustom;
        const isProgExpanded = _expandedClassProgressions.has(cName);
        const prereqResult = item.prereqResult;

        // Group Header Divider
        if (item.priority !== lastPriority) {
          lastPriority = item.priority;
          let headerTitle = '';
          if (item.priority === 1) {
            const count = matched.filter(m => m.priority === 1).length;
            headerTitle = `
              <div class="flex items-center justify-between py-1.5 px-2 text-[11px] font-bold text-slate-300 border-b border-purple-500/30 sticky top-0 bg-slate-950/95 z-10 backdrop-blur-sm shadow-sm rounded-lg mb-1">
                <span class="flex items-center gap-1.5 text-purple-300">
                  <span>🛡️</span>
                  <span>Base Classes</span>
                </span>
                <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-700/50">${count} Classes</span>
              </div>
            `;
          } else if (item.priority === 2) {
            const count = matched.filter(m => m.priority === 2).length;
            headerTitle = `
              <div class="flex items-center justify-between py-1.5 px-2 text-[11px] font-bold text-emerald-300 border-b border-emerald-600/40 sticky top-0 bg-slate-950/95 z-10 backdrop-blur-sm shadow-sm rounded-lg mt-2.5 mb-1">
                <span class="flex items-center gap-1.5 text-emerald-300">
                  <span>👑</span>
                  <span>Qualified Prestige Classes (Prerequisites Met)</span>
                </span>
                <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/60">${count} Classes</span>
              </div>
            `;
          } else if (item.priority === 3) {
            const count = matched.filter(m => m.priority === 3).length;
            headerTitle = `
              <div class="flex items-center justify-between py-1.5 px-2 text-[11px] font-bold text-amber-400 border-b border-amber-600/40 sticky top-0 bg-slate-950/95 z-10 backdrop-blur-sm shadow-sm rounded-lg mt-2.5 mb-1">
                <span class="flex items-center gap-1.5 text-amber-400">
                  <span>🔒</span>
                  <span>Other Prestige Classes (Prerequisites Not Met)</span>
                </span>
                <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">${count} Classes</span>
              </div>
            `;
          }
          htmlOutput += headerTitle;
        }

        const typeBadge = isPrestige
          ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/50">👑 Prestij</span>'
          : (isCustom 
              ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-600/50">⚙️ Custom</span>'
              : '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">🛡️ Base Class</span>');

        const babText = def.bab === 1.0 ? 'Tam BAB (+1.0)' : (def.bab === 0.75 ? '3/4 BAB (+0.75)' : '1/2 BAB (+0.5)');
        const goodSaves = [];
        if (def.fort === 'good') goodSaves.push('Fort');
        if (def.ref === 'good') goodSaves.push('Ref');
        if (def.will === 'good') goodSaves.push('Will');
        const savesText = goodSaves.length === 3 ? 'All Good Saves' : (goodSaves.length > 0 ? `Good: ${goodSaves.join('/')}` : 'Poor Saves');

        const safeName = cName.replace(/'/g, "\\'");

        let prereqHtml = '';
        if (prereqResult.hasPrereqs) {
          const prereqPills = prereqResult.checks.map(c => `
            <span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border ${c.met ? 'border-emerald-600/40 text-emerald-300' : 'border-amber-600/40 text-amber-300'}">
              <span>${c.met ? '✅' : '⚠️'}</span>
              <span>${c.text}</span>
              ${c.info ? `<span class="text-[9px] text-slate-400 font-mono">${c.info}</span>` : ''}
            </span>
          `).join('');

          prereqHtml = `
            <div class="mt-1 pt-1 border-t border-slate-800/80 space-y-1">
              <div class="flex items-center justify-between text-[10px]">
                <span class="font-bold text-slate-400">Prerequisites:</span>
                <span class="${prereqResult.allMet ? 'text-emerald-400 font-bold' : 'text-amber-400 font-semibold'} text-[9px]">
                  ${prereqResult.allMet ? '✅ Qualified' : '⚠️ Prereqs Missing'}
                </span>
              </div>
              <div class="flex flex-wrap gap-1">
                ${prereqPills}
              </div>
            </div>
          `;
        }

        htmlOutput += `
          <div onclick="selectClassFromSearch('${safeName}')" class="bg-slate-950/70 hover:bg-slate-900/90 border ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700'} rounded-lg p-2.5 transition space-y-1.5 cursor-pointer group">
            <div class="flex flex-wrap items-center justify-between gap-1.5">
              <div class="flex items-center gap-2">
                <span class="text-base">${isPrestige ? '👑' : (isCustom ? '⚙️' : '🛡️')}</span>
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-bold text-white text-xs group-hover:text-emerald-300 transition">${cName}</span>
                    ${typeBadge}
                    ${def.source ? `<span class="text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800 font-mono">${def.source}</span>` : ''}
                  </div>
                  ${def.role ? `<div class="text-[10px] text-indigo-300">${def.role}</div>` : ''}
                </div>
              </div>

              <div class="flex items-center gap-1.5" onclick="event.stopPropagation()">
                <button type="button" onclick="toggleClassProgression('${safeName}')" class="px-2.5 py-1 rounded-lg ${isProgExpanded ? 'bg-indigo-900 border-indigo-400 text-white ring-1 ring-indigo-400/50' : 'bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 hover:text-white'} font-bold text-[11px] shadow flex items-center gap-1 transition active:scale-95 cursor-pointer" title="Show / hide ${cName} level progression table">
                  <span>📜</span>
                  <span>${isProgExpanded ? 'Hide Progression' : 'Show Progression'}</span>
                </button>
                ${isSelected ? `
                  <span class="text-[11px] font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-600/70 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm select-none">
                    <span>✓</span>
                    <span>Selected Class</span>
                  </span>
                ` : `
                  <button type="button" onclick="selectClassFromSearch('${safeName}')" class="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-[11px] shadow flex items-center gap-1 transition active:scale-95 cursor-pointer">
                    <span>🎯</span>
                    <span>Select Class</span>
                  </button>
                `}
              </div>
            </div>

            <!-- Stats Bar -->
            <div class="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-300 pt-0.5 font-mono">
              <span class="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-amber-300 font-bold">d${def.hd} HD</span>
              <span class="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-sky-300">${babText}</span>
              <span class="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-emerald-300">${savesText}</span>
              <span class="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-purple-300">${def.skills || 2}+INT Skills</span>
            </div>

            ${def.description ? `<p class="text-[10px] text-slate-400 leading-relaxed">${def.description}</p>` : ''}
            ${prereqHtml}
            ${isProgExpanded ? `<div onclick="event.stopPropagation()">${generateClassProgressionHtml(cName, def)}</div>` : ''}
          </div>
        `;
      });

      resultsContainer.innerHTML = htmlOutput;
      resultsContainer.scrollTop = prevScroll;
    }

    function onClassSearchEnterKey() {
      const q = (document.getElementById('lvlup-class-search-input')?.value || '').trim();
      if (!q) return;

      const allDefs = getAvailableClassDefs();
      const directMatch = Object.keys(allDefs).find(c => c.toLowerCase() === q.toLowerCase());
      if (directMatch) {
        selectClassFromSearch(directMatch);
        return;
      }

      const resultsContainer = document.getElementById('lvlup-class-search-results');
      const firstSelectBtn = resultsContainer?.querySelector('button[onclick*="selectClassFromSearch"]') || resultsContainer?.querySelector('[onclick*="selectClassFromSearch"]');
      if (firstSelectBtn) {
        firstSelectBtn.click();
      } else {
        fetchClassFromRuleMasterAi(q);
      }
    }

    async function fetchClassFromRuleMasterAi(className) {
      const q = (className || document.getElementById('lvlup-class-search-input')?.value || '').trim();
      if (!q) return;

      const apiKey = typeof RuleMaster !== 'undefined' ? RuleMaster.getApiKey() : (localStorage.getItem('gemini_api_key') || '');
      if (!apiKey) {
        alert('⚠️ 🧙‍♂️🤖 Please save a valid Google Gemini API key in Settings (⚙️) to search classes via Rule Master (AI).');
        if (typeof openSettingsModal === 'function') openSettingsModal();
        return;
      }

      const statusBox = document.getElementById('lvlup-class-ai-status');
      const statusText = document.getElementById('lvlup-class-ai-status-text');
      const fetchBtn = document.getElementById('btn-fetch-class-ai');

      if (statusBox) statusBox.classList.remove('hidden');
      if (statusText) statusText.textContent = `Scanning D&D 3.5e Sourcebooks: "${q}"...`;
      if (fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }

      const systemPrompt = `You are Rule Master AI, the supreme D&D 3.5e RAW (Rules As Written) encyclopedia and character building engine.
STRICT D&D 3.5E RAW ONLY (ZERO TOLERANCE FOR FORUMS / HOMEBREW / 5E / PATHFINDER):
1. CANONICAL D&D 3.5E SOURCES ONLY:
   You must consult ONLY official D&D 3.5e sourcebooks and canonical indexes:
   - Official System Reference Document (SRD v3.5 as archived on d20srd.org)
   - Official D&D 3.5e Rulebooks and Splatbooks (as indexed on dndtools.net / danddtools)
   - Official Wizards of the Coast 3.5e Publications:
     * Player's Handbook (PHB) & Player's Handbook II, Dungeon Master's Guide (DMG)
     * Complete Series (Warrior, Arcane, Divine, Adventurer, Mage, Scoundrel, Champion)
     * Tome of Battle: The Book of Nine Swords, Tome of Magic
     * Spell Compendium, Magic Item Compendium
     * Frostburn, Stormwrack, Sandstorm, Libris Mortis, Book of Exalted Deeds, Book of Vile Darkness, Expanded Psionics Handbook, Races of Stone/Destiny/the Wild/the Dragon, Dungeonscape.
2. ABSOLUTE FORUM & HOMEBREW BLACKLIST:
   - NEVER use, cite, or draw information from DandWiki (dandwiki.com), Giant in the Playground forums (GitP), ENWorld, Reddit, or homebrew blogs/wikis.
   - If a class only exists as homebrew, third-party content, or a forum discussion, IT DOES NOT EXIST.
3. ZERO 5E / 4E / PATHFINDER:
   - DO NOT USE D&D 4e, D&D 5e, Pathfinder, or homebrew. If class originated in 3.0 (e.g. Sword and Fist), use official 3.5e revision (e.g. Complete Warrior).
4. STRICT NON-EXISTENCE / NO-HALLUCINATION POLICY:
   - If "${q}" is not an official D&D 3.5e RAW class, DO NOT invent or fabricate it.

STRICT OUTPUT FORMAT:
You MUST output ONLY a single valid JSON object with NO markdown formatting, NO backticks, NO commentary.
Format:
{
  "name": "Exact Official Class Name in English",
  "type": "Prestige Class" or "Base Class",
  "maxLevel": 5 or 10 or 20,
  "source": "Official 3.5e Book Name (e.g. Complete Scoundrel, Complete Mage, DMG)",
  "role": "Role summary in Turkish (e.g. Gish / Arcane Melee Channeler)",
  "hd": 4 or 6 or 8 or 10 or 12,
  "bab": 1.0 or 0.75 or 0.5,
  "fort": "good" or "poor",
  "ref": "good" or "poor",
  "will": "good" or "poor",
  "skills": 2 or 4 or 6 or 8,
  "description": "Short informative Turkish description explaining what the class specializes in and its playstyle.",
  "prerequisites": [
    { "text": "Turkish explanation of prereq (e.g. Base Attack Bonus: +5)", "key": "bab", "min": 5 },
    { "text": "Feat: Combat Casting", "key": "feat", "name": "Combat Casting" }
  ],
  "features": {
    "1": [{ "name": "Feature Name (Ex/Su/Sp)", "summary": "Turkish explanation" }],
    "2": [{ "name": "Feature Name (Ex/Su/Sp)", "summary": "Turkish explanation" }]
  }
}
STRICT RULE: Do NOT include standard 6-sided dice emoji (U+1F3B2) anywhere in any field. Use plain notation like "d10 HD", "1d6", "2d8".`;

      const userPrompt = `Extract the exact official D&D 3.5e RAW class parameters for: "${q}". (If the query contains typos such as "bloodstarm blade" for "Bloodstorm Blade", automatically correct to the official D&D 3.5e class name).
Provide complete maxLevel (5 or 10 for prestige class, 20 for base class), hit die, bab, fort, ref, will, skill points per level, prerequisites, description in Turkish, and level-by-level features for every level from 1 up to maxLevel (keys "1", "2", ...). If a level grants spell advancement e.g. "+1 level of existing spellcasting class" or bonus feats, list that in the level's features.`;

      let modelsToTry = [];
      if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.getAvailableGeminiModels === 'function') {
        try {
          modelsToTry = await RuleMaster.getAvailableGeminiModels(apiKey);
        } catch (e) {
          console.warn('getAvailableGeminiModels failed:', e);
        }
      }
      if (!Array.isArray(modelsToTry) || modelsToTry.length === 0) {
        modelsToTry = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
      }

      let classData = null;
      let lastErr = null;

      for (const model of modelsToTry) {
        const cleanModel = String(model).replace(/^models\//, '');
        if (statusText) statusText.textContent = `Scanning D&D 3.5e compendiums (${cleanModel}): "${q}"...`;
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: 0.0,
              response_mime_type: 'application/json'
            }
          };

          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!resp.ok) {
            const errJson = await resp.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `HTTP ${resp.status}`);
          }

          const resData = await resp.json();
          let rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            rawText = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            classData = JSON.parse(rawText);
            if (classData && classData.name) {
              break;
            }
          }
        } catch (err) {
          console.warn(`Model ${model} fetch failed for class "${q}":`, err.message);
          lastErr = err;
        }
      }

      if (statusBox) statusBox.classList.add('hidden');
      if (fetchBtn) {
        fetchBtn.disabled = false;
        fetchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }

      if (!classData || !classData.name) {
        alert(`⚠️ Rule Master could not find class "${q}" in official D&D 3.5e sourcebooks or encountered an API error.\n${lastErr ? lastErr.message : ''}\n\nYou can define this class manually using the "Add Custom Class" button.`);
        return;
      }

      // Sanitize fields
      const cleanName = String(classData.name).trim();
      const validHd = [4, 6, 8, 10, 12].includes(Number(classData.hd)) ? Number(classData.hd) : 8;
      const validBab = [1.0, 0.75, 0.5].includes(Number(classData.bab)) ? Number(classData.bab) : (classData.bab >= 1 ? 1.0 : (classData.bab >= 0.7 ? 0.75 : 0.5));
      const validFort = classData.fort === 'good' ? 'good' : 'poor';
      const validRef = classData.ref === 'good' ? 'good' : 'poor';
      const validWill = classData.will === 'good' ? 'good' : 'poor';
      const validSkills = Number(classData.skills) || 2;
      const classType = (classData.type || '').toLowerCase().includes('base') ? 'Base Class' : 'Prestige Class';
      const validMaxLevel = Number(classData.maxLevel) || (classType === 'Prestige Class' ? 10 : 20);

      const newEntry = {
        id: 'class_' + Date.now(),
        name: cleanName,
        type: classType,
        maxLevel: validMaxLevel,
        category: 'Class',
        source: classData.source || 'Official D&D 3.5e',
        role: classData.role || '',
        hd: validHd,
        bab: validBab,
        fort: validFort,
        ref: validRef,
        will: validWill,
        skills: validSkills,
        description: classData.description || `${cleanName} (${classData.source || 'D&D 3.5e'})`,
        prerequisites: Array.isArray(classData.prerequisites) ? classData.prerequisites : [],
        features: (classData.features && typeof classData.features === 'object') ? classData.features : {},
        bonusFeatLevels: Array.isArray(classData.bonusFeatLevels) ? classData.bonusFeatLevels : [],
        isCustom: true
      };

      // 1. Add to masterDb
      if (Array.isArray(masterDb)) {
        const existingIdx = masterDb.findIndex(m => m && m.name && m.name.toLowerCase() === cleanName.toLowerCase());
        if (existingIdx !== -1) {
          masterDb[existingIdx] = Object.assign(masterDb[existingIdx], newEntry);
        } else {
          masterDb.push(newEntry);
        }
      }

      // 2. Add to character.customClasses
      if (!Array.isArray(character.customClasses)) character.customClasses = [];
      const customIdx = character.customClasses.findIndex(c => c && c.name && c.name.toLowerCase() === cleanName.toLowerCase());
      if (customIdx !== -1) {
        character.customClasses[customIdx] = newEntry;
      } else {
        character.customClasses.push(newEntry);
      }

      // 3. Sync to RuleEngine, cache to storage, populate select and select class
      syncCustomClassesToRuleEngine();
      saveStateToStorage(true);

      populateLevelUpClassSelect(cleanName);
      selectClassFromSearch(cleanName);

      // 4. Automatically expand progression table for newly found class
      _expandedClassProgressions.add(cleanName);

      // 5. Update search input to match clean name and re-filter
      const searchInput = document.getElementById('lvlup-class-search-input');
      if (searchInput) searchInput.value = cleanName;
      filterLevelUpClassSearch();

      if (typeof showToast === 'function') {
        showToast(`✨ Rule Master: Fetched "${cleanName}" and its progression table!`, 'success');
      }
    }

    function selectClassFromSearch(className) {
      const select = document.getElementById('lvlup-class-select');
      if (!select) return;

      let found = false;
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase() === className.toLowerCase()) {
          select.selectedIndex = i;
          found = true;
          break;
        }
      }

      if (!found) {
        const opt = document.createElement('option');
        opt.value = className;
        opt.textContent = className;
        opt.selected = true;
        select.appendChild(opt);
      }

      // Update level-up stats and class preview
      onLevelUpClassChange();

      // Refresh search results to show selected state
      filterLevelUpClassSearch();

      // Highlight preview card
      const preview = document.getElementById('lvlup-class-preview-card');
      if (preview) {
        preview.classList.add('ring-2', 'ring-emerald-400');
        setTimeout(() => preview.classList.remove('ring-2', 'ring-emerald-400'), 1500);
        preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (typeof showToast === 'function') {
        showToast(`🎯 Class Selected: ${className}. Level parameters updated.`, 'success');
      }
    }

    let currentPendingPlannedLevel = null;

    function showPlannedLevelChoiceModal(lvlObj) {
      currentPendingPlannedLevel = lvlObj;
      const modal = document.getElementById('planned-level-choice-modal');
      const infoBox = document.getElementById('planned-level-choice-info');
      if (!modal) return;

      if (infoBox && lvlObj) {
        const featsText = (lvlObj.feats && lvlObj.feats.length > 0) 
          ? lvlObj.feats.map(f => typeof f === 'string' ? f : f.name).join(', ')
          : 'Unspecified';

        const statText = getLevelStatIncrease(lvlObj) ? `+1 ${getLevelStatIncrease(lvlObj).toUpperCase()}` : 'Yok';

        infoBox.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span class="font-extrabold text-amber-400 text-sm">Seviye ${lvlObj.level} • ${lvlObj.className}</span>
              <div class="text-[10px] text-slate-400 mt-0.5">Your next planned character level</div>
            </div>
            <span class="badge bg-amber-950/80 text-amber-300 border border-amber-600/70 text-[10px] px-2 py-0.5 font-bold">📋 Planlanan Seviye</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[11px] pt-1.5 text-slate-300 font-mono">
            <div><span class="text-slate-400 font-sans">Hit Points (HP):</span> <b class="text-emerald-400">+${lvlObj.hpGain}</b> (${lvlObj.hd || 'd8'})</div>
            <div><span class="text-slate-400 font-sans">BAB Gain:</span> <b class="text-sky-400">+${lvlObj.bab}</b></div>
            <div><span class="text-slate-400 font-sans">Kurtarmalar:</span> F+${lvlObj.fort} R+${lvlObj.ref} W+${lvlObj.will}</div>
            <div><span class="text-slate-400 font-sans">Ability Score:</span> <b class="text-amber-300">${statText}</b></div>
          </div>
          <div class="mt-2 text-[11px] bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-purple-200">
            <span class="font-bold text-purple-300">Feats / Features:</span> ${featsText}
          </div>
        `;
      }

      modal.classList.remove('hidden');
    }

    function closePlannedLevelChoiceModal() {
      const modal = document.getElementById('planned-level-choice-modal');
      if (modal) modal.classList.add('hidden');
      currentPendingPlannedLevel = null;
    }

    function confirmActivatePlannedLevel() {
      const prog = character.levelProgression || [];
      const firstInactive = currentPendingPlannedLevel || prog.find(p => p.active === false);
      if (!firstInactive) {
        closePlannedLevelChoiceModal();
        return;
      }

      const idx = prog.indexOf(firstInactive);
      if (idx !== -1) {
        // Enforce sequential progression: all previous levels must be active
        for (let i = 0; i < idx; i++) {
          if (prog[i].active === false) {
            alert(`⚠️ Sequential Progression Rule: Level ${i + 1} must be activated before Level ${idx + 1}.\nYou cannot skip levels!`);
            closePlannedLevelChoiceModal();
            return;
          }
        }

        firstInactive.active = true;

        // Apply stat increase if specified
        const statKey = getLevelStatIncrease(firstInactive);
        if (statKey && character.baseAbilities && character.baseAbilities[statKey] !== undefined) {
          character.baseAbilities[statKey] = Number(character.baseAbilities[statKey]) + 1;
        }

        sanitizeLevelProgressionActiveGaps();
        recalculateCharacterClassSummary();
        saveStateToStorage(true);
        renderLevelProgression();
        renderAll();

        closePlannedLevelChoiceModal();

        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            icon: '⭐',
            title: 'Level Up Applied',
            breakdown: `Level ${firstInactive.level} (${firstInactive.className}) is now active.`
          });
        }
      }
    }

    function openLevelUpModalForPlanningOnly() {
      closePlannedLevelChoiceModal();
      openLevelUpModal(true);
    }

    function openLevelUpModal(forPlanningOnly = false) {
      const modal = document.getElementById('level-up-modal');
      if (!modal) return;

      const prog = character.levelProgression || [];

      // Check if there is an inactive/planned level waiting to be activated
      const firstInactive = prog.find(p => p.active === false);
      if (firstInactive && !forPlanningOnly) {
        showPlannedLevelChoiceModal(firstInactive);
        return;
      }

      const nextLvl = prog.length + 1;
      const badge = document.getElementById('lvlup-target-badge');
      if (badge) {
        if (forPlanningOnly || firstInactive) {
          badge.textContent = `Level ${nextLvl} (Planned)`;
          badge.className = 'badge bg-purple-950 text-purple-300 border border-purple-600 text-xs font-bold';
        } else {
          badge.textContent = `Seviye ${nextLvl}`;
          badge.className = 'badge bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-bold';
        }
      }

      // Default class to last taken class
      const defaultClass = (character.classes?.split(' ')[0]) || (character.levelProgression?.[0]?.className) || 'Fighter';
      const lastClass = prog.length > 0 ? prog[prog.length - 1].className : defaultClass;
      populateLevelUpClassSelect(lastClass);
      onLevelUpClassChange();
      if (typeof initLevelUpClassSearch === 'function') {
        initLevelUpClassSearch();
      }

      // Check feat qualification based on featMode
      const featMode = character.settings?.featMode || 'Standard 3.5e (1, 3, 6, 9, 12, 15, 18)';
      const qualifies = isLevelQualifiesForFeat(nextLvl, featMode);
      const featBadge = document.getElementById('lvlup-feat-status-badge');
      const featHint = document.getElementById('lvlup-feat-hint');

      if (qualifies) {
        if (featBadge) {
          featBadge.textContent = `🎖️ Feat Gained (Level ${nextLvl})`;
          featBadge.className = 'badge bg-emerald-950 text-emerald-300 border border-emerald-600 text-[9px] font-bold';
        }
        if (featHint) featHint.textContent = `You gain a new character feat at this level per the ${featMode} progression rule.`;
      } else {
        if (featBadge) {
          featBadge.textContent = 'Optional Feat / DM Boon';
          featBadge.className = 'badge bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold';
        }
        if (featHint) featHint.textContent = 'Not a standard feat level. You may still add a class bonus feat or DM Boon.';
      }

      // Initialize levelUpModalFeatSlots
      levelUpModalFeatSlots = [];
      activeLevelUpFeatSearchSlot = null;
      levelUpFeatSearchFilters = {};
      levelUpFeatSearchQueries = {};
      const isHuman = (character.race || '').toLowerCase().includes('human');
      if (nextLvl === 1) {
        levelUpModalFeatSlots.push({
          title: 'Standart Feat (1. Seviye)',
          category: 'Regular Feat',
          name: '',
          benefit: ''
        });
        if (isHuman) {
          levelUpModalFeatSlots.push({
            title: 'Irk Bonusu Feat (Human Bonus Feat)',
            category: 'Racial Trait',
            name: '',
            benefit: ''
          });
        }
      } else if (qualifies) {
        levelUpModalFeatSlots.push({
          title: `Standart Feat (Seviye ${nextLvl})`,
          category: 'Regular Feat',
          name: '',
          benefit: ''
        });
      }

      // Ability score increase highlight at levels 4, 8, 12, 16, 20
      const statHint = document.getElementById('lvlup-stat-hint-badge');
      const statSelect = document.getElementById('lvlup-stat-select');
      if (statSelect) statSelect.value = '';
      if (statHint) {
        if (nextLvl % 4 === 0) {
          statHint.textContent = `🌟 Level ${nextLvl}: +1 Ability Score Increase Available!`;
          statHint.className = 'badge bg-amber-950 text-amber-300 border border-amber-500 animate-pulse';
        } else {
          statHint.textContent = '4, 8, 12, 16, 20. Seviyelerde';
          statHint.className = 'badge bg-slate-800 text-slate-400 border border-slate-700';
        }
      }

      // Configure Spellcaster Progression step & contextual visibility
      const ignoreAsfChk = document.getElementById('lvlup-ignore-asf');
      if (ignoreAsfChk) {
        ignoreAsfChk.checked = character.settings?.ignoreAsf !== false;
      }
      if (typeof updateLevelUpCasterProgVisibility === 'function') {
        updateLevelUpCasterProgVisibility(lastClass);
      }

      const notesInput = document.getElementById('lvlup-notes-input');
      if (notesInput) notesInput.value = '';

      const activeChk = document.getElementById('lvlup-is-active');
      const submitBtn = document.getElementById('lvlup-submit-btn');

      if (forPlanningOnly || firstInactive) {
        if (activeChk) {
          activeChk.checked = false;
          activeChk.disabled = true;
          if (activeChk.parentElement) {
            activeChk.parentElement.title = "Previous planned levels must be activated before this level can be made active.";
          }
        }
        if (submitBtn) {
          submitBtn.innerHTML = '<span>📝</span><span>Save Planned Level</span>';
        }
      } else {
        if (activeChk) {
          activeChk.checked = true;
          activeChk.disabled = false;
          if (activeChk.parentElement) {
            activeChk.parentElement.title = "Apply this level to character stats immediately or save it as a planned level.";
          }
        }
        if (submitBtn) {
          submitBtn.innerHTML = '<span>✅</span><span>Complete Level Up & Save</span>';
        }
      }

      onLevelUpClassChange();

      if (levelUpModalFeatSlots.length === 0) {
        addLevelUpFeatSlot({ title: 'Optional Feat / Boon', category: 'Regular Feat' });
      } else {
        renderLevelUpFeatSlots();
      }

      initLevelUpCopilot();
      modal.classList.remove('hidden');
    }

    function closeLevelUpModal() {
      closeLevelUpClassSpotlightDropdown();
      const modal = document.getElementById('level-up-modal');
      if (modal) modal.classList.add('hidden');
    }

    function confirmLevelUp() {
      if (!Array.isArray(character.levelProgression)) character.levelProgression = [];
      const prog = character.levelProgression;
      const nextLvl = prog.length + 1;

      const defaultClass = (character.classes?.split(' ')[0]) || (character.levelProgression?.[0]?.className) || 'Fighter';
      const className = document.getElementById('lvlup-class-select')?.value || defaultClass;
      const hd = document.getElementById('lvlup-hd-input')?.value || 'd8';
      const hpGain = Math.max(1, parseInt(document.getElementById('lvlup-hp-gain-input')?.value) || 1);
      const bab = parseInt(document.getElementById('lvlup-bab-input')?.value) || 0;
      const fort = parseInt(document.getElementById('lvlup-fort-input')?.value) || 0;
      const ref = parseInt(document.getElementById('lvlup-ref-input')?.value) || 0;
      const will = parseInt(document.getElementById('lvlup-will-input')?.value) || 0;
      const skillPts = parseInt(document.getElementById('lvlup-skill-input')?.value) || 4;
      const statChoice = document.getElementById('lvlup-stat-select')?.value || '';
      let isActive = document.getElementById('lvlup-is-active')?.checked !== false;

      // Sequential progression rule: Cannot activate a level if any previous level is inactive
      const hasInactiveBefore = prog.some(p => p.active === false);
      if (isActive && hasInactiveBefore) {
        alert('⚠️ Sequential Progression Rule: Earlier planned levels are still inactive.\nLevels cannot be skipped; this level will be saved as a planned level.');
        isActive = false;
      }

      const casterProg = document.getElementById('lvlup-caster-prog')?.value || 'none';
      const ignoreAsfChecked = document.getElementById('lvlup-ignore-asf')?.checked || false;
      const notes = (document.getElementById('lvlup-notes-input')?.value || '').trim();

      const rowFeats = [];
      let flawDetected = false;

      // 1. Permanent +1 Ability Score
      if (statChoice && character.baseAbilities && character.baseAbilities[statChoice] !== undefined && isActive) {
        character.baseAbilities[statChoice] = Number(character.baseAbilities[statChoice]) + 1;
        rowFeats.push(`+1 Stat: ${statChoice.toUpperCase()}`);
      }

      // 2. Process all Feat Slots
      levelUpModalFeatSlots.forEach(slot => {
        const fName = (slot.name || '').trim();
        if (!fName) return;

        let prefix = '';
        if (slot.category === 'DM Boon') prefix = '🌟 [DM Boon] ';
        else if (slot.category === 'Class Bonus Feat') prefix = '⚔️ [Bonus] ';
        else if (slot.category === 'Flaw') { prefix = '⚠️ [Flaw] '; flawDetected = true; }
        else if (slot.category === 'Racial Trait') prefix = '🧬 [Racial] ';
        else if (slot.category === 'Special Ability') prefix = '✨ [Special] ';
        else prefix = '🎖️ [Feat] ';

        rowFeats.push(`${prefix}${fName}`);

        if (isActive) {
          if (slot.category === 'DM Boon') {
            if (!Array.isArray(character.feats)) character.feats = [];
            character.feats.push({
              name: fName,
              source: 'Campaign Boon',
              category: 'DM Grant',
              benefit: slot.benefit || 'Special ability granted via DM Boon.'
            });
          } else if (slot.category === 'Special Ability') {
            if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];
            character.specialAbilities.push({
              name: fName,
              source: `${className} Level ${nextLvl}`,
              category: 'Special Ability',
              benefit: slot.benefit || 'Class feature gained via level progression.'
            });
          } else {
            const catalog = getCombinedFeatCatalog();
            const found = catalog.find(c => c.name.toLowerCase() === fName.toLowerCase()) || {
              name: fName,
              category: slot.category,
              source: `Level ${nextLvl}`,
              benefit: slot.benefit || notes || 'Feat gained via level progression.'
            };
            learnFeatObject(found);
          }
        }
      });

      // 3. Auto Class Features
      const classLvlsSoFar = prog.filter(p => p.className === className).length;
      const targetClassLvl = classLvlsSoFar + 1;
      const autoData = (typeof RuleEngine !== 'undefined' && RuleEngine.getClassLevelFeatures)
        ? RuleEngine.getClassLevelFeatures(className, targetClassLvl)
        : { features: [] };
      const autoFeatures = autoData.features || [];

      if (isActive && autoFeatures.length > 0) {
        if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];
        autoFeatures.forEach(featName => {
          if (!character.specialAbilities.some(a => (typeof a === 'string' ? a : a.name).toLowerCase() === featName.toLowerCase())) {
            character.specialAbilities.push({
              name: featName,
              source: `${className} Level ${targetClassLvl}`,
              category: 'Class Feature',
              benefit: `Class feature automatically gained at ${className} Level ${targetClassLvl}.`
            });
          }
        });
      }

      // 4. Caster Progression
      if (!character.settings) character.settings = {};
      character.settings.ignoreAsf = ignoreAsfChecked;

      if (casterProg === 'primary') {
        const sorcLvls = (prog.filter(p => p.className === 'Sorcerer' && p.active !== false).length || 0) + (className === 'Sorcerer' ? 1 : 1);
        if (character.settings.clMode === 'Character Level (DM Boon)') {
          if (character.spellcasting && isActive) character.spellcasting.cl = nextLvl;
        } else {
          if (character.spellcasting && isActive) character.spellcasting.cl = sorcLvls;
        }
        if (character.spellcasting && isActive) {
          character.spellcasting.slots = calculateSorcererSlots(sorcLvls, character.abilities?.cha || 22, character.spellcasting.slots);
        }
        rowFeats.push(`🔮 +1 Caster Lvl (CL: ${character.spellcasting?.cl || nextLvl})`);
      } else if (casterProg === 'cl_boon') {
        character.settings.clMode = 'Character Level (DM Boon)';
        if (character.spellcasting && isActive) {
          character.spellcasting.cl = nextLvl;
          character.spellcasting.slots = calculateSorcererSlots(nextLvl, character.abilities?.cha || 22, character.spellcasting.slots);
        }
        rowFeats.push(`🌟 DM Boon: CL = Seviye ${nextLvl}`);
      }

      // 5. HP Gain (User Rule: Toplam HP artar, o anki HP sabit kalır)
      if (isActive) {
        if (!character.hp) character.hp = { current: 44, max: 44, temp: 0, nonlethal: 0 };
        const curHpBefore = Number(character.hp.current);
        if (character.hp.baseMax === undefined) character.hp.baseMax = (Number(character.hp.max) || 44) - (Number(character.hp.conBonusHp) || 0);
        character.hp.baseMax = (Number(character.hp.baseMax) || 0) + hpGain;
        character.hp.max = (Number(character.hp.baseMax) || 0) + (Number(character.hp.conBonusHp) || 0);
        // Strict: O anki mevcut can (current HP) sabit kalır, artırılmaz veya düşürülmez
        if (!isNaN(curHpBefore)) {
          character.hp.current = curHpBefore;
        }
      }

      // 6. Push Row
      prog.push({
        level: nextLvl,
        active: isActive,
        className,
        hd,
        hpGain,
        bab,
        fort,
        ref,
        will,
        skillPts,
        feats: rowFeats,
        specialAbilities: autoFeatures,
        statIncreased: statChoice || null,
        casterProg,
        notes: notes || (autoFeatures.length > 0 ? autoFeatures.join(', ') : `${className} seviyesi eklendi`)
      });

      recalculateCharacterClassSummary();
      closeLevelUpModal();
      saveStateToStorage(true);
      renderAll();

      if (flawDetected) {
        setTimeout(() => {
          alert(`⚠️ 1st-Level Flaw added!\n\n🎖️ Per D&D 3.5e Unearthed Arcana rules, taking a flaw grants 1 EXTRA BONUS FEAT!\n\nOpening the Feat Compendium now to select your bonus feat.`);
          openFeatPickerModal(false);
        }, 300);
      }
    }

    function undoLastLevel() {
      const prog = character.levelProgression || [];
      if (prog.length <= 1) {
        alert('⚠️ Character level cannot be reduced below Level 1.');
        return;
      }
      const last = prog[prog.length - 1];
      if (!confirm(`Are you sure you want to undo Level ${last.level} (${last.className})?`)) return;

      prog.pop();

      // Revert HP
      if (character.hp && last.hpGain && last.active !== false) {
        const gain = Number(last.hpGain) || 0;
        if (character.hp.baseMax === undefined) character.hp.baseMax = (Number(character.hp.max) || 44) - (Number(character.hp.conBonusHp) || 0);
        character.hp.baseMax = Math.max(1, (Number(character.hp.baseMax) || 1) - gain);
        character.hp.max = Math.max(1, (Number(character.hp.baseMax) || 1) + (Number(character.hp.conBonusHp) || 0));
        character.hp.current = Math.min(character.hp.max, Math.max(1, (Number(character.hp.current) || 1) - gain));
      }

      // Revert Stat increase if recorded
      const statToRevert = getLevelStatIncrease(last);
      if (statToRevert && last.active !== false && character.baseAbilities && character.baseAbilities[statToRevert] !== undefined) {
        character.baseAbilities[statToRevert] = Number(character.baseAbilities[statToRevert]) - 1;
      }

      // Revert Caster Level
      if ((last.casterProg === 'primary' || last.casterProg === 'cl_boon') && last.active !== false && character.spellcasting) {
        const sorcLvls = prog.filter(p => p.className === 'Sorcerer' && p.active !== false).length;
        if (character.settings?.clMode === 'Character Level (DM Boon)') {
          character.spellcasting.cl = prog.filter(p => p.active !== false).length;
        } else {
          character.spellcasting.cl = sorcLvls;
        }
        character.spellcasting.slots = calculateSorcererSlots(sorcLvls, character.abilities?.cha || 22, character.spellcasting.slots);
      }

      recalculateCharacterClassSummary();
      saveStateToStorage(true);
      renderAll();
    }

    function toggleLevelActive(idx) {
      const prog = character.levelProgression || [];
      if (idx < 0 || idx >= prog.length) return;
      if (idx === 0 && prog[idx].active !== false) {
        alert('⚠️ Level 1 is the starting character level and cannot be deactivated.');
        return;
      }

      if (prog[idx].active === false) {
        // Enforce sequential progression: all previous levels must be active
        for (let i = 0; i < idx; i++) {
          if (prog[i].active === false) {
            alert(`⚠️ Sequential Progression Rule: Level ${i + 1} must be activated before Level ${idx + 1}.\nYou cannot skip levels!`);
            renderLevelProgression();
            return;
          }
        }
        prog[idx].active = true;

        // Apply stat increase if recorded
        const statKey = getLevelStatIncrease(prog[idx]);
        if (statKey && character.baseAbilities && character.baseAbilities[statKey] !== undefined) {
          character.baseAbilities[statKey] = Number(character.baseAbilities[statKey]) + 1;
        }
      } else {
        // Enforce sequential deactivation: all subsequent levels must be inactive
        for (let i = idx + 1; i < prog.length; i++) {
          if (prog[i].active !== false) {
            alert(`⚠️ Sequential Progression Rule: Later active levels (Level ${i + 1}, etc.) must be deactivated before Level ${idx + 1}.`);
            renderLevelProgression();
            return;
          }
        }
        prog[idx].active = false;

        // Revert stat increase if recorded
        const statKey = getLevelStatIncrease(prog[idx]);
        if (statKey && character.baseAbilities && character.baseAbilities[statKey] !== undefined) {
          character.baseAbilities[statKey] = Math.max(1, Number(character.baseAbilities[statKey]) - 1);
        }
      }

      sanitizeLevelProgressionActiveGaps();
      recalculateCharacterClassSummary();
      saveStateToStorage(true);
      renderLevelProgression();
      renderAll();
    }

    function deleteLevelRow(idx) {
      const prog = character.levelProgression || [];
      if (idx < 0 || idx >= prog.length) return;
      if (prog.length <= 1) {
        alert('⚠️ Character level cannot be reduced below Level 1.');
        return;
      }
      const row = prog[idx];
      if (!confirm(`Are you sure you want to delete Level ${row.level} (${row.className})?`)) return;

      prog.splice(idx, 1);
      // Re-number levels
      prog.forEach((p, i) => { p.level = i + 1; });

      recalculateCharacterClassSummary();
      saveStateToStorage(true);
      renderLevelProgression();
      renderAll();
    }

    // Level Progression Tooltip Helper (Master DB, Catalogs, Class Features)
    function getFeatTooltipText(featName) {
      if (!featName) return '';
      const clean = String(featName).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
      const lower = clean.toLowerCase();

      // Check masterDb first
      if (Array.isArray(masterDb)) {
        const m = masterDb.find(item => item && item.name && (item.name.toLowerCase() === lower || item.name.toLowerCase().includes(lower)));
        if (m) {
          const cat = m.category || m.type || '';
          const prereq = m.prereq && m.prereq !== '-' ? `\nPrerequisite: ${m.prereq}` : '';
          const desc = m.benefit || m.description || '';
          return `${m.name}${cat ? ' [' + cat + ']' : ''}${prereq}${desc ? '\n' + desc : ''}`;
        }
      }

      // Check combined catalog
      if (typeof getCombinedFeatCatalog === 'function') {
        const catalog = getCombinedFeatCatalog();
        const found = catalog.find(f => f.name && (f.name.toLowerCase() === lower || f.name.toLowerCase().includes(lower) || lower.includes(f.name.toLowerCase())));
        if (found) {
          const cat = found.category || '';
          const prereq = (found.prereq && found.prereq !== '-') ? `\nPrerequisite: ${found.prereq}` : '';
          const desc = found.benefit || found.description || '';
          return `${found.name}${cat ? ' [' + cat + ']' : ''}${prereq}${desc ? '\n' + desc : ''}`;
        }
      }

      // Check RuleEngine class features
      if (typeof RuleEngine !== 'undefined' && RuleEngine.DND35_CLASS_DEFS) {
        for (const [cName, cDef] of Object.entries(RuleEngine.DND35_CLASS_DEFS)) {
          if (cDef && cDef.features) {
            for (const [lvl, fList] of Object.entries(cDef.features)) {
              if (Array.isArray(fList)) {
                const match = fList.find(f => {
                  const n = (typeof f === 'string' ? f : f.name || '').toLowerCase();
                  return n === lower || n.includes(lower) || lower.includes(n);
                });
                if (match) {
                  const n = typeof match === 'string' ? match : match.name;
                  const sum = (typeof match === 'object' && match.summary) ? `\nSummary: ${match.summary}` : '';
                  return `${n} [${cName} Level ${lvl} Feature]${sum}`;
                }
              }
            }
          }
        }
      }

      return clean;
    }

    // Stat Increase Helper & Level Stat Picker Modal
    let activeStatPickerLevelIndex = null;

    function getLevelStatIncrease(lvl) {
      if (!lvl) return null;
      if (lvl.statIncreased) {
        const s = String(lvl.statIncreased).toLowerCase().trim();
        if (STAT_KEYS.some(k => k.key === s)) return s;
        if (s.startsWith('str')) return 'str';
        if (s.startsWith('dex')) return 'dex';
        if (s.startsWith('con')) return 'con';
        if (s.startsWith('int')) return 'int';
        if (s.startsWith('wis')) return 'wis';
        if (s.startsWith('cha')) return 'cha';
      }
      // Check in feats array
      if (Array.isArray(lvl.feats)) {
        for (const f of lvl.feats) {
          const str = String(f).toLowerCase();
          if (str.includes('+1 stat') || str.includes('stat:')) {
            if (str.includes('str') || str.includes('strength') || str.includes('güç')) return 'str';
            if (str.includes('dex') || str.includes('dexterity') || str.includes('çevik')) return 'dex';
            if (str.includes('con') || str.includes('constitution') || str.includes('dayan')) return 'con';
            if (str.includes('int') || str.includes('intelligence') || str.includes('zeka')) return 'int';
            if (str.includes('wis') || str.includes('wisdom') || str.includes('irade')) return 'wis';
            if (str.includes('cha') || str.includes('charisma') || str.includes('karizma')) return 'cha';
          }
        }
      }
      return null;
    }

    function openStatPickerForLevel(idx) {
      const prog = character.levelProgression || [];
      if (idx < 0 || idx >= prog.length) return;
      activeStatPickerLevelIndex = idx;
      const row = prog[idx];

      const modal = document.getElementById('level-stat-picker-modal');
      const title = document.getElementById('stat-picker-modal-title');
      const subtitle = document.getElementById('stat-picker-modal-subtitle');
      const grid = document.getElementById('stat-picker-options-grid');
      if (!modal || !grid) return;

      if (title) title.textContent = `Level ${row.level} Ability Score Increase (+1)`;
      if (subtitle) subtitle.textContent = `${row.className} (Level ${row.level}) • Permanent +1 Ability Score`;

      const currentStat = getLevelStatIncrease(row);

      grid.innerHTML = STAT_KEYS.map(s => {
        const isSelected = (currentStat === s.key);
        const baseScore = Number(character.baseAbilities?.[s.key]) || 10;
        const totalScore = Number(character.abilities?.[s.key]) || baseScore;
        const nextBase = isSelected ? baseScore : (baseScore + 1);
        const nextTotal = isSelected ? totalScore : (totalScore + 1);

        return `
          <button type="button" onclick="selectStatForLevel(${idx}, '${s.key}')" class="p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer active:scale-95 ${
            isSelected 
              ? 'bg-sky-950/80 border-sky-400 text-white shadow-lg ring-1 ring-sky-400' 
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-sky-500 hover:bg-slate-800/80'
          }">
            <div class="flex items-center justify-between w-full">
              <span class="font-mono font-black text-xs px-1.5 py-0.5 rounded ${isSelected ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-sky-300'}">${s.label}</span>
              ${isSelected ? '<span class="text-[9px] font-bold text-sky-300 bg-sky-900/60 px-1 rounded border border-sky-500/60">SELECTED</span>' : ''}
            </div>
            <div class="mt-1 font-bold text-[11px] text-white">${s.name}</div>
            <div class="mt-1 text-[10px] text-slate-400 font-mono">
              Current: <strong class="text-white">${totalScore}</strong> 
              ➔ <strong class="text-emerald-400 font-black">+1 (${isSelected ? totalScore : nextTotal})</strong>
            </div>
          </button>
        `;
      }).join('');

      modal.classList.remove('hidden');
    }

    function closeStatPickerModal() {
      const modal = document.getElementById('level-stat-picker-modal');
      if (modal) modal.classList.add('hidden');
      activeStatPickerLevelIndex = null;
    }

    function clearStatForActivePickerLevel() {
      if (activeStatPickerLevelIndex === null) return;
      selectStatForLevel(activeStatPickerLevelIndex, null);
    }

    function selectStatForLevel(idx, newStatKey) {
      const prog = character.levelProgression || [];
      if (idx < 0 || idx >= prog.length) return;
      const row = prog[idx];
      const oldStat = getLevelStatIncrease(row);

      if (oldStat !== newStatKey) {
        if (row.active !== false && character.baseAbilities) {
          if (oldStat && typeof character.baseAbilities[oldStat] === 'number') {
            character.baseAbilities[oldStat] = Math.max(1, character.baseAbilities[oldStat] - 1);
          }
          if (newStatKey && typeof character.baseAbilities[newStatKey] === 'number') {
            character.baseAbilities[newStatKey] = character.baseAbilities[newStatKey] + 1;
          }
        }

        row.statIncreased = newStatKey || null;

        if (!Array.isArray(row.feats)) row.feats = [];
        row.feats = row.feats.filter(f => {
          const str = String(f).toLowerCase();
          return !str.includes('+1 stat') && !str.includes('stat:');
        });

        if (newStatKey) {
          const statDef = STAT_KEYS.find(k => k.key === newStatKey);
          row.feats.push(`+1 Stat: ${statDef ? statDef.label : newStatKey.toUpperCase()}`);
        }

        recalculateCharacterClassSummary();
        saveStateToStorage(true);
        renderLevelProgression();
        renderAll();
      }

      closeStatPickerModal();

      if (typeof showDiceTopToast === 'function') {
        const statDef = newStatKey ? STAT_KEYS.find(k => k.key === newStatKey) : null;
        showDiceTopToast({
          icon: '💪',
          title: newStatKey ? 'Ability Score Increase Set' : 'Ability Score Increase Cleared',
          breakdown: newStatKey 
            ? `Level ${row.level}: +1 ${statDef ? statDef.name : newStatKey.toUpperCase()} applied.`
            : `Level ${row.level} ability score increase cleared.`
        });
      }
    }

    // Modal: Change Level Class (Sınıf & Seviye Değiştirme)
    let currentChangeClassLevelIndex = null;

    function populateChangeClassSelect(selectedClassName = null) {
      const sel = document.getElementById('change-class-select');
      if (!sel) return;
      sel.innerHTML = '';
      const allDefs = getAvailableClassDefs();
      const officialGroup = document.createElement('optgroup');
      officialGroup.label = "Official D&D 3.5e Classes";
      const customGroup = document.createElement('optgroup');
      customGroup.label = "Custom / Prestige Classes";

      const targetSelected = (selectedClassName || '').toLowerCase();

      Object.keys(allDefs).sort((a, b) => a.localeCompare(b)).forEach(cName => {
        const opt = document.createElement('option');
        opt.value = cName;
        const def = allDefs[cName];
        const hdText = `d${def.hd} HD`;
        const babText = def.bab === 1.0 ? 'Tam BAB' : (def.bab === 0.75 ? '3/4 BAB' : '1/2 BAB');
        opt.textContent = `${cName} (${hdText} • ${babText})`;
        if (cName.toLowerCase() === targetSelected) opt.selected = true;
        if (def.isCustom) {
          customGroup.appendChild(opt);
        } else {
          officialGroup.appendChild(opt);
        }
      });

      sel.appendChild(officialGroup);
      if (customGroup.children.length > 0) {
        sel.appendChild(customGroup);
      }
    }

    function openChangeLevelClassModal(idx) {
      const prog = character.levelProgression || [];
      if (idx < 0 || idx >= prog.length) return;
      currentChangeClassLevelIndex = idx;
      const row = prog[idx];

      const modal = document.getElementById('change-level-class-modal');
      if (!modal) return;

      const titleEl = document.getElementById('change-class-modal-title');
      const subEl = document.getElementById('change-class-modal-subtitle');
      if (titleEl) titleEl.textContent = `Edit Level ${row.level} Class & Stats`;
      if (subEl) subEl.textContent = `Current class: ${row.className}`;

      populateChangeClassSelect(row.className);

      // Populate current HP gain from the row
      const hpInput = document.getElementById('change-class-hp-input');
      const hpHint = document.getElementById('change-class-hp-hint');
      const allDefs = getAvailableClassDefs();
      const classDef = allDefs[row.className] || DND35_CLASS_DEFS[row.className] || { hd: 8 };
      const currentHpGain = Number(row.hpGain) || 0;
      const initialHpVal = currentHpGain > 0 ? currentHpGain : (idx === 0 ? classDef.hd : Math.floor(Math.random() * classDef.hd) + 1);

      const conMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.con || 14)
        : Math.floor(((character.abilities?.con || 14) - 10) / 2);

      if (hpInput) {
        hpInput.value = initialHpVal;
      }
      if (hpHint) {
        const totalGain = Math.max(1, initialHpVal + conMod);
        hpHint.innerHTML = `Level ${row.level} Hit Die (d${classDef.hd}): <b>${initialHpVal}</b> + CON Mod (<b>${conMod >= 0 ? '+' + conMod : conMod}</b>) = <b class="text-emerald-400">+${totalGain} Total HP</b>`;
      }

      // Populate current stat increase
      const statSel = document.getElementById('change-class-stat-select');
      const statBadge = document.getElementById('change-class-stat-badge');
      const statHint = document.getElementById('change-class-stat-hint');
      const currentStat = getLevelStatIncrease(row);
      if (statSel) {
        statSel.value = currentStat || '';
      }
      if (statBadge) {
        if (row.level % 4 === 0) {
          statBadge.className = 'badge text-[9px] px-2 py-0.5 font-bold bg-amber-950 text-amber-300 border border-amber-600 animate-pulse';
          statBadge.textContent = 'Every 4th Level (+1 Ability)';
        } else {
          statBadge.className = 'badge text-[9px] px-2 py-0.5 font-bold bg-slate-800 text-slate-400 border border-slate-700';
          statBadge.textContent = 'Optional / DM';
        }
      }
      if (statHint) {
        statHint.textContent = (row.level % 4 === 0)
          ? `Level ${row.level} grants a permanent +1 ability score increase per D&D 3.5e RAW (every 4th character level).`
          : `You may optionally assign a +1 ability score increase to this level as a DM boon.`;
      }

      const searchInp = document.getElementById('change-class-search-input');
      if (searchInp) searchInp.value = '';
      const searchStat = document.getElementById('change-class-search-status');
      if (searchStat) { searchStat.classList.add('hidden'); searchStat.innerHTML = ''; }

      onChangeClassSelectChange(false);
      modal.classList.remove('hidden');
    }

    function closeChangeLevelClassModal() {
      const modal = document.getElementById('change-level-class-modal');
      if (modal) modal.classList.add('hidden');
      currentChangeClassLevelIndex = null;
    }

    function rollChangeClassHp(mode = 'avg') {
      const sel = document.getElementById('change-class-select');
      const hpInput = document.getElementById('change-class-hp-input');
      const hint = document.getElementById('change-class-hp-hint');
      if (!sel || !hpInput || currentChangeClassLevelIndex === null) return;

      const newClass = sel.value;
      const allDefs = getAvailableClassDefs();
      const def = allDefs[newClass] || DND35_CLASS_DEFS[newClass] || { hd: 8 };

      const conMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.con || 14)
        : Math.floor(((character.abilities?.con || 14) - 10) / 2);

      let dieRoll = Math.floor(def.hd / 2) + 1;

      if (mode === 'roll') {
        dieRoll = Math.floor(Math.random() * def.hd) + 1;
      } else if (mode === 'max') {
        dieRoll = def.hd;
      } else if (mode === 'avg') {
        dieRoll = Math.floor(def.hd / 2) + 1;
      }

      hpInput.value = dieRoll;
      const totalHpGain = Math.max(1, dieRoll + conMod);

      if (hint) {
        hint.innerHTML = `Hit Die (d${def.hd}): <b>${dieRoll}</b> + CON Mod (<b>${conMod >= 0 ? '+' + conMod : conMod}</b>) = <b class="text-emerald-400">+${totalHpGain} Total HP Gain</b>`;
      }

      if (mode === 'roll' && typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: '⚡',
          title: `Rolled Hit Die (d${def.hd})`,
          breakdown: `Rolled ${newClass} Hit Die (d${def.hd}) ➔ Result: ${dieRoll} (CON: ${conMod >= 0 ? '+' + conMod : conMod})`,
          total: `+${totalHpGain} HP`
        });
      }
    }

    function onChangeClassHpManualInput() {
      const hint = document.getElementById('change-class-hp-hint');
      const hpInput = document.getElementById('change-class-hp-input');
      const sel = document.getElementById('change-class-select');
      const val = parseInt(hpInput?.value, 10);
      if (!sel || isNaN(val)) return;

      const newClass = sel.value;
      const allDefs = getAvailableClassDefs();
      const def = allDefs[newClass] || DND35_CLASS_DEFS[newClass] || { hd: 8 };

      const conMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.con || 14)
        : Math.floor(((character.abilities?.con || 14) - 10) / 2);

      const totalHpGain = Math.max(1, val + conMod);
      if (hint) {
        hint.innerHTML = `Manual Hit Die: <b>${val}</b> (d${def.hd}) + CON Mod (<b>${conMod >= 0 ? '+' + conMod : conMod}</b>) = <b class="text-emerald-400">+${totalHpGain} Total HP Gain</b>`;
      }
    }

    function onChangeClassSelectChange(rerollHp = true) {
      const sel = document.getElementById('change-class-select');
      const preview = document.getElementById('change-class-preview-card');
      if (!sel || !preview || currentChangeClassLevelIndex === null) return;

      const newClass = sel.value;
      const allDefs = getAvailableClassDefs();
      const def = allDefs[newClass] || DND35_CLASS_DEFS[newClass] || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4 };
      const prog = character.levelProgression || [];

      // Calculate what class level this would be
      let classLvlCount = 0;
      for (let i = 0; i < currentChangeClassLevelIndex; i++) {
        if (prog[i].className === newClass) classLvlCount++;
      }
      const targetClassLvl = classLvlCount + 1;

      const autoData = (typeof RuleEngine !== 'undefined' && RuleEngine.getClassLevelFeatures)
        ? RuleEngine.getClassLevelFeatures(newClass, targetClassLvl)
        : { features: [] };
      const featList = autoData.features || [];

      preview.innerHTML = `
        <div class="flex items-center justify-between text-amber-300 font-bold border-b border-slate-800 pb-1">
          <span>${newClass} (Level ${targetClassLvl})</span>
          <span class="text-[10px] text-slate-400">HD: d${def.hd} | Skills: ${def.skills || 2}+INT</span>
        </div>
        <div class="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-300">
          <div>BAB: <strong class="text-sky-300">${def.bab === 1.0 ? 'Full (+1)' : (def.bab === 0.75 ? '3/4 Medium' : '1/2 Poor')}</strong></div>
          <div>Saves: <strong class="text-emerald-300">F:${def.fort[0].toUpperCase()} R:${def.ref[0].toUpperCase()} W:${def.will[0].toUpperCase()}</strong></div>
        </div>
        <div class="pt-1 text-[10px]">
          <span class="text-slate-400 font-bold">Features Gained:</span>
          <div class="text-amber-200/90 font-sans mt-0.5">${featList.length > 0 ? featList.join(', ') : 'No special class features or bonus feat selection.'}</div>
        </div>
      `;

      if (rerollHp) {
        const isFirstLvl = (currentChangeClassLevelIndex === 0);
        rollChangeClassHp(isFirstLvl ? 'max' : 'roll');
      }
    }

    function confirmChangeLevelClass() {
      if (currentChangeClassLevelIndex === null) return;
      const prog = character.levelProgression || [];
      const idx = currentChangeClassLevelIndex;
      if (idx < 0 || idx >= prog.length) return;

      const sel = document.getElementById('change-class-select');
      const autoChk = document.getElementById('change-class-auto-features');
      if (!sel) return;

      const newClass = sel.value;
      const allDefs = getAvailableClassDefs();
      const def = allDefs[newClass] || DND35_CLASS_DEFS[newClass] || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4 };

      const conMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.con || 14)
        : Math.floor(((character.abilities?.con || 14) - 10) / 2);
      const intMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.int || 10)
        : Math.floor(((character.abilities?.int || 10) - 10) / 2);
      const isHuman = (character.race || '').toLowerCase().includes('human') ? 1 : 0;

      // Calculate old vs new HP difference if active (using pure die roll without double-counting CON)
      const oldHp = Number(prog[idx].hpGain) || 0;
      const manualHp = parseInt(document.getElementById('change-class-hp-input')?.value, 10);
      const rollHp = (idx === 0) ? def.hd : (Math.floor(Math.random() * def.hd) + 1);
      const fallbackHp = rollHp;
      const newHp = (!isNaN(manualHp) && manualHp > 0) ? manualHp : fallbackHp;
      const hpDiff = newHp - oldHp;

      prog[idx].className = newClass;
      prog[idx].hd = `d${def.hd}`;
      prog[idx].hpGain = newHp;
      prog[idx].skillPts = (idx === 0)
        ? Math.max(4, ((def.skills || 2) + intMod + isHuman) * 4)
        : Math.max(1, (def.skills || 2) + intMod + isHuman);
      prog[idx].bab = def.bab >= 1.0 ? 1 : 0;
      prog[idx].fort = (def.fort === 'good') ? 1 : 0;
      prog[idx].ref = (def.ref === 'good') ? 1 : 0;
      prog[idx].will = (def.will === 'good') ? 1 : 0;

      // If active, update character HP
      if (prog[idx].active !== false && character.hp) {
        if (character.hp.baseMax === undefined) character.hp.baseMax = (Number(character.hp.max) || 44) - (Number(character.hp.conBonusHp) || 0);
        character.hp.baseMax = Math.max(1, (Number(character.hp.baseMax) || 1) + hpDiff);
        character.hp.max = Math.max(1, (Number(character.hp.baseMax) || 1) + (Number(character.hp.conBonusHp) || 0));
        character.hp.current = Math.min(character.hp.max, Math.max(1, (Number(character.hp.current) || 1) + hpDiff));
      }

      // Update features if auto is checked
      if (autoChk && autoChk.checked) {
        let classLvlCount = 0;
        for (let i = 0; i <= idx; i++) {
          if (prog[i].className === newClass) classLvlCount++;
        }
        const autoData = (typeof RuleEngine !== 'undefined' && RuleEngine.getClassLevelFeatures)
          ? RuleEngine.getClassLevelFeatures(newClass, classLvlCount)
          : { features: [] };
        const autoFeatures = autoData.features || [];
        prog[idx].specialAbilities = [...autoFeatures];
        prog[idx].notes = autoFeatures.length > 0 ? autoFeatures.join(', ') : `Updated to ${newClass}`;
      }

      // Handle Stat increase change
      const statSel = document.getElementById('change-class-stat-select');
      const newStatChoice = (statSel?.value || '').trim() || null;
      const oldStatChoice = getLevelStatIncrease(prog[idx]);

      if (newStatChoice !== oldStatChoice) {
        if (prog[idx].active !== false && character.baseAbilities) {
          if (oldStatChoice && typeof character.baseAbilities[oldStatChoice] === 'number') {
            character.baseAbilities[oldStatChoice] = Math.max(1, character.baseAbilities[oldStatChoice] - 1);
          }
          if (newStatChoice && typeof character.baseAbilities[newStatChoice] === 'number') {
            character.baseAbilities[newStatChoice] = character.baseAbilities[newStatChoice] + 1;
          }
        }
        prog[idx].statIncreased = newStatChoice;
        if (!Array.isArray(prog[idx].feats)) prog[idx].feats = [];
        prog[idx].feats = prog[idx].feats.filter(f => {
          const str = String(f).toLowerCase();
          return !str.includes('+1 stat') && !str.includes('stat:');
        });
        if (newStatChoice) {
          const statDef = STAT_KEYS.find(k => k.key === newStatChoice);
          prog[idx].feats.push(`+1 Stat: ${statDef ? statDef.label : newStatChoice.toUpperCase()}`);
        }
      }

      closeChangeLevelClassModal();
      recalculateCharacterClassSummary();
      saveStateToStorage(true);
      renderLevelProgression();
      renderAll();
    }

    // Add new planned level row to progression table via Rule Master / AI Level Up rules
    function addNewLevelRowToProgression(chosenClass = null) {
      const prog = character.levelProgression || [];
      const nextLvl = prog.length + 1;
      const defaultClass = (character.classes?.split(' ')[0]) || (character.levelProgression?.[0]?.className) || 'Fighter';
      const lastClass = prog.length > 0 ? prog[prog.length - 1].className : defaultClass;
      const targetClass = chosenClass || lastClass;

      const def = (typeof DND35_CLASS_DEFS !== 'undefined' && DND35_CLASS_DEFS[targetClass])
        ? DND35_CLASS_DEFS[targetClass]
        : { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4 };

      const conMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.con || 14)
        : Math.floor(((character.abilities?.con || 14) - 10) / 2);
      const intMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.int || 10)
        : Math.floor(((character.abilities?.int || 10) - 10) / 2);
      const isHuman = (character.race || '').toLowerCase().includes('human') ? 1 : 0;

      let classLvlSoFar = 0;
      prog.forEach(p => { if (p.className === targetClass) classLvlSoFar++; });
      const targetClassLvl = classLvlSoFar + 1;

      // D&D 3.5e RAW: 1. Seviye maksimum Can Zarı alır (PHB s. 22); sonraki seviyelerde yeni can zarı yuvarlanır
      const rollHp = (nextLvl === 1) ? def.hd : (Math.floor(Math.random() * def.hd) + 1);
      const hpGain = rollHp;
      const skillPts = (nextLvl === 1)
        ? Math.max(4, ((def.skills || 2) + intMod + isHuman) * 4)
        : Math.max(1, (def.skills || 2) + intMod + isHuman);

      const prospectiveProg = [...prog, { className: targetClass, hd: `d${def.hd}`, hpGain, active: true }];
      const prospectiveSummary = (typeof RuleEngine !== 'undefined' && RuleEngine.calculateProgression)
        ? RuleEngine.calculateProgression(prospectiveProg, { system: character.settings?.babSaveSystem || 'standard', isHuman: (character.race || '').toLowerCase().includes('human'), intMod })
        : null;

      const bab = prospectiveSummary ? prospectiveSummary.baseBab : (def.bab >= 1.0 ? 1 : 0);
      const fort = prospectiveSummary ? prospectiveSummary.baseSaves.fort : (def.fort === 'good' ? 2 : 0);
      const ref = prospectiveSummary ? prospectiveSummary.baseSaves.ref : (def.ref === 'good' ? 2 : 0);
      const will = prospectiveSummary ? prospectiveSummary.baseSaves.will : (def.will === 'good' ? 2 : 0);

      const autoData = (typeof RuleEngine !== 'undefined' && RuleEngine.getClassLevelFeatures)
        ? RuleEngine.getClassLevelFeatures(targetClass, targetClassLvl)
        : { features: [] };
      const autoFeatures = autoData.features || [];

      const rowFeats = [];
      let statIncreased = null;

      prog.push({
        level: nextLvl,
        active: false,
        className: targetClass,
        hd: `d${def.hd}`,
        hpGain,
        bab,
        fort,
        ref,
        will,
        skillPts,
        feats: rowFeats,
        specialAbilities: [...autoFeatures],
        statIncreased: statIncreased,
        notes: autoFeatures.length > 0 ? autoFeatures.join(', ') : `Planned ${targetClass} level`
      });

      recalculateCharacterClassSummary();
      saveStateToStorage(true);
      renderLevelProgression();
      renderAll();
    }

    function safeEscapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function toggleNpcLevelProgression() {
      window._showNpcLevelProgression = !window._showNpcLevelProgression;
      renderLevelProgression();
      renderCoreFeatsAndSpecialAbilities();
    }

    function openAddSpecialAbilityPrompt() {
      const name = prompt('Special Ability or Racial Trait Name (e.g., Breath Weapon, Darkvision, Frightful Presence):');
      if (!name || !name.trim()) return;
      const cleanName = name.trim();
      const typeChoice = prompt('Ability Type: Ex (Extraordinary), Su (Supernatural), Sp (Spell-Like), or General:', 'Ex');
      const cleanType = (typeChoice || '').trim();
      const benefit = prompt(`Rule description or effect for "${cleanName}":`, '');
      
      if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];
      const existing = character.specialAbilities.find(a => (typeof a === 'string' ? a : (a?.name || '')).toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        if (typeof existing === 'object') {
          existing.type = cleanType || existing.type;
          existing.benefit = benefit || existing.benefit;
        }
      } else {
        character.specialAbilities.push({
          name: cleanName,
          type: cleanType || 'Ex',
          benefit: benefit || ''
        });
      }
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '⚡',
        title: 'Special Ability Added',
        breakdown: `"${cleanName}" saved to character.`,
        total: cleanType ? `[${cleanType}]` : 'Kaydedildi'
      });
    }

    let _coreFeatsAccordionOpen = false; // Closed by default

    function toggleCoreFeatsAccordion() {
      _coreFeatsAccordionOpen = !_coreFeatsAccordionOpen;
      renderCoreFeatsAndSpecialAbilities();
    }

    function renderCoreFeatsAndSpecialAbilities() {
      const container = document.getElementById('core-feats-abilities-container');
      if (!container) return;

      if (!character) {
        container.innerHTML = '';
        return;
      }

      // Collect all feats
      const featMap = new Map();
      (character.feats || []).forEach(f => {
        if (!f) return;
        const name = typeof f === 'string' ? f : (f.name || '');
        if (!name.trim()) return;
        const clean = name.trim();
        const lower = clean.toLowerCase();
        if (!featMap.has(lower)) {
          featMap.set(lower, {
            name: clean,
            category: typeof f === 'object' ? (f.category || 'Feat') : 'Feat',
            benefit: typeof f === 'object' ? (f.benefit || f.desc || '') : '',
            source: typeof f === 'object' ? (f.source || '') : ''
          });
        }
      });

      // Also harvest feats from levelProgression if any
      (character.levelProgression || []).forEach(p => {
        (p.feats || []).forEach(fn => {
          if (!fn || typeof fn !== 'string' || !fn.trim()) return;
          const clean = fn.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          const lower = clean.toLowerCase();
          if (lower && !featMap.has(lower)) {
            featMap.set(lower, {
              name: clean,
              category: 'Level Feat',
              benefit: '',
              source: `Seviye ${p.level || '?'}`
            });
          }
        });
      });

      const featsList = Array.from(featMap.values());

      // Collect all special abilities
      const abilityMap = new Map();
      (character.specialAbilities || []).forEach(a => {
        if (!a) return;
        const name = typeof a === 'string' ? a : (a.name || '');
        if (!name.trim()) return;
        const clean = name.trim();
        const lower = clean.toLowerCase();
        if (!abilityMap.has(lower)) {
          abilityMap.set(lower, {
            name: clean,
            type: typeof a === 'object' ? (a.type || '') : '',
            benefit: typeof a === 'object' ? (a.benefit || a.desc || '') : '',
            source: typeof a === 'object' ? (a.source || '') : ''
          });
        }
      });

      // Also harvest class features from levelProgression if any
      (character.levelProgression || []).forEach(p => {
        (p.classFeatures || []).forEach(cf => {
          if (!cf || typeof cf !== 'string' || !cf.trim()) return;
          const clean = cf.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          const lower = clean.toLowerCase();
          if (lower && !abilityMap.has(lower)) {
            abilityMap.set(lower, {
              name: clean,
              type: 'Ex',
              benefit: '',
              source: `${p.className || 'Class'} Level ${p.level || '?'}`
            });
          }
        });
      });

      const abilitiesList = Array.from(abilityMap.values());
      const isOpen = _coreFeatsAccordionOpen === true;

      container.innerHTML = `
        <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow mt-4">
          <!-- Akordeon Başlık Çubuğu -->
          <div onclick="toggleCoreFeatsAccordion()" class="bg-slate-900 hover:bg-slate-800/80 px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition select-none">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="text-base">🎖️</span>
              <span class="text-xs font-black text-amber-400 uppercase tracking-wide">FEATS &amp; SPECIAL ABILITIES SHOWCASE</span>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60">${featsList.length} Feats</span>
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/60">${abilitiesList.length} Yetenek</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${character?.isNpc ? `
                <button type="button" onclick="event.stopPropagation(); openNpcStatblockModal('feats')" class="text-[11px] font-bold bg-amber-600/90 hover:bg-amber-500 text-white px-2.5 py-0.5 rounded-lg transition shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer" title="Edit in Statblock Studio">
                  <span>⚡</span>
                  <span>Studio</span>
                </button>
              ` : ''}
              <span class="text-xs text-slate-400 font-mono transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}">▼</span>
            </div>
          </div>

          <!-- Akordeon Gövdesi (Açılır / Kapanır) -->
          <div class="${isOpen ? 'block' : 'hidden'} p-3.5 border-t border-slate-800/80 bg-slate-950/60">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <!-- SOL: FEATS SHOWCASE -->
              <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm">🎖️</span>
                      <span class="text-xs font-bold text-amber-300 uppercase tracking-wide">Acquired Feats</span>
                    </div>
                    <span class="text-[10px] text-slate-400 font-normal">From levels and race</span>
                  </div>
                  <div class="flex flex-wrap gap-1.5 min-h-[40px] items-start">
                    ${featsList.length > 0 ? featsList.map(f => {
                      const safeName = f.name.replace(/'/g, "\\'");
                      const safeTip = (f.benefit || f.source || 'View rule details').replace(/"/g, '&quot;');
                      const catBadge = f.category && f.category !== 'Feat' ? `<span class="text-[9px] opacity-75 font-normal">(${safeEscapeHtml(f.category)})</span>` : '';
                      return `
                        <button type="button" onclick="showFeatDetail('${safeName}', null, 'feat')" title="${safeTip}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-600/60 hover:border-indigo-400 shadow-sm transition active:scale-95 cursor-pointer text-left">
                          <span class="text-amber-400 shrink-0">🎖️</span>
                          <span class="truncate max-w-[170px]">${safeEscapeHtml(f.name)}</span>
                          ${catBadge}
                        </button>
                      `;
                    }).join('') : `
                      <div class="py-3 text-center text-slate-500 text-xs italic w-full">
                        No feats recorded.
                      </div>
                    `}
                  </div>
                </div>
              </div>

              <!-- SAĞ: SPECIAL ABILITIES SHOWCASE -->
              <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm">⚡</span>
                      <span class="text-xs font-bold text-purple-300 uppercase tracking-wide">Special Abilities &amp; Racial Traits</span>
                    </div>
                    <span class="text-[10px] text-slate-400 font-normal">Ex, Su, Sp ve Irksal</span>
                  </div>
                  <div class="flex flex-wrap gap-1.5 min-h-[40px] items-start">
                    ${abilitiesList.length > 0 ? abilitiesList.map(a => {
                      const safeName = a.name.replace(/'/g, "\\'");
                      const safeTip = (a.benefit || a.source || 'View rule details').replace(/"/g, '&quot;');
                      let typeBadge = '';
                      let borderCls = 'border-purple-600/60 hover:border-purple-400 text-purple-200 bg-purple-950/80 hover:bg-purple-900';
                      const tUpper = (a.type || '').toUpperCase();
                      if (tUpper === 'EX') {
                        typeBadge = '<span class="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-amber-900/80 text-amber-300 border border-amber-600/50">Ex</span>';
                        borderCls = 'border-amber-600/50 hover:border-amber-400 text-amber-200 bg-amber-950/60 hover:bg-amber-900/80';
                      } else if (tUpper === 'SU') {
                        typeBadge = '<span class="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-purple-900/80 text-purple-300 border border-purple-600/50">Su</span>';
                        borderCls = 'border-purple-600/50 hover:border-purple-400 text-purple-200 bg-purple-950/70 hover:bg-purple-900/80';
                      } else if (tUpper === 'SP') {
                        typeBadge = '<span class="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-sky-900/80 text-sky-300 border border-sky-600/50">Sp</span>';
                        borderCls = 'border-sky-600/50 hover:border-sky-400 text-sky-200 bg-sky-950/70 hover:bg-sky-900/80';
                      } else if (a.type) {
                        typeBadge = `<span class="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-600/50">${safeEscapeHtml(a.type)}</span>`;
                      }
                      return `
                        <button type="button" onclick="showFeatDetail('${safeName}', null, 'ability')" title="${safeTip}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm transition active:scale-95 cursor-pointer text-left ${borderCls}">
                          <span class="shrink-0">⚡</span>
                          <span class="truncate max-w-[170px]">${safeEscapeHtml(a.name)}</span>
                          ${typeBadge}
                        </button>
                      `;
                    }).join('') : `
                      <div class="py-3 text-center text-slate-500 text-xs italic w-full">
                        No special abilities recorded.
                      </div>
                    `}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Check if character is NPC: manage level-progression-block
      const progBlock = document.getElementById('level-progression-block');
      if (progBlock) {
        let npcBanner = document.getElementById('npc-progression-banner');
        if (character.isNpc) {
          if (!npcBanner) {
            npcBanner = document.createElement('div');
            npcBanner.id = 'npc-progression-banner';
            progBlock.parentNode.insertBefore(npcBanner, progBlock);
          }
          const showTable = Boolean(window._showNpcLevelProgression);
          npcBanner.className = 'bg-slate-900/90 border border-indigo-500/50 rounded-xl p-3 shadow flex flex-wrap items-center justify-between gap-2 text-xs mb-2 mt-4';
          npcBanner.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="text-base">🐲</span>
              <div>
                <span class="font-bold text-indigo-300">Canavar / NPC Statblock Modu:</span>
                <span class="text-slate-400 block sm:inline text-[11px]">This creature uses D&D 3.5e monster statblock rules (Exempt from 1-20 Level Progression Table).</span>
              </div>
            </div>
            <button type="button" onclick="toggleNpcLevelProgression()" class="text-xs font-bold text-amber-400 hover:text-amber-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500 transition cursor-pointer">
              ${showTable ? '▲ Hide Level Table' : '▼ Show Level Table'}
            </button>
          `;
          progBlock.style.display = showTable ? '' : 'none';
        } else {
          if (npcBanner) npcBanner.remove();
          progBlock.style.display = '';
        }
      }
    }

    // Level Progression Rendering (lvl_up - Madde 1, 2, 12, Unearthed Arcana Fractional & Level Planning)
    function renderLevelProgression() {
      try { renderCoreFeatsAndSpecialAbilities(); } catch (e) { console.error('renderCoreFeatsAndSpecialAbilities error:', e); }
      const tbody = document.getElementById('level-progression-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      // Sync settings toolbar UI
      const featModeSel = document.getElementById('setting-feat-mode');
      if (featModeSel && character.settings?.featMode) {
        featModeSel.value = character.settings.featMode;
      }
      const clModeSel = document.getElementById('setting-cl-mode');
      if (clModeSel) {
        clModeSel.value = character.settings?.clMode || 'Character Level (DM Boon)';
      }
      const casterTypeSel = document.getElementById('setting-caster-type');
      if (casterTypeSel) {
        casterTypeSel.value = character.settings?.casterType || 'spontaneous';
      }
      if (typeof updateCasterTypeUIState === 'function') updateCasterTypeUIState();
      const asfChk = document.getElementById('setting-ignore-asf');
      if (asfChk) {
        asfChk.checked = character.settings?.ignoreAsf !== false;
      }
      const babSaveSel = document.getElementById('setting-bab-save-system');
      if (babSaveSel) {
        babSaveSel.value = character.settings?.babSaveSystem || 'standard';
      }

      const prog = character.levelProgression || [];
      const sys = character.settings?.babSaveSystem || 'standard';
      const isHuman = (character.race || '').toLowerCase().includes('human');
      const intMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.int || 10)
        : Math.floor(((character.abilities?.int || 10) - 10) / 2);
      const conVal = Number(character.abilities?.con) || 10;
      const conMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(conVal)
        : Math.floor((conVal - 10) / 2);
      const conModStr = conMod >= 0 ? `+${conMod}` : `${conMod}`;

      const summary = (typeof RuleEngine !== 'undefined' && RuleEngine.calculateProgression)
        ? RuleEngine.calculateProgression(prog, { system: sys, isHuman, intMod })
        : null;

      // Render Level Progression HUD Summary Bar
      const hud = document.getElementById('level-progression-hud');
      if (hud && summary) {
        const isFrac = (sys === 'fractional');
        const totalConHp = summary.activeLevels * conMod;
        const totalMaxHp = Math.max(summary.activeLevels, summary.baseHp + totalConHp);
        const conSignStr = totalConHp >= 0 ? `+${totalConHp}` : `${totalConHp}`;
        hud.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/80 text-emerald-300 font-bold">
              <span>✅ Aktif Seviye:</span>
              <strong class="text-white text-sm">${summary.activeLevels}</strong>
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-600/80 text-sky-300 font-bold">
              <span>📋 Toplam Plan:</span>
              <strong class="text-white text-sm">${summary.plannedLevels}</strong>
            </span>
            <span class="badge ${isFrac ? 'bg-sky-950 text-sky-300 border-sky-600' : 'bg-slate-800 text-slate-300 border-slate-700'} text-[9px] font-bold">
              ${isFrac ? '📐 Unearthed Arcana Fractional' : '📖 Core 3.5e Standard'}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <span class="text-emerald-400 font-bold" title="Base Hit Dice: ${summary.baseHp} + CON Bonus: ${conSignStr} (${summary.activeLevels} Levels x ${conModStr}) = Total ${totalMaxHp} HP">HP: +${summary.baseHp} <span class="text-emerald-300/90 font-medium text-[10px]">(${conSignStr} Con = ${totalMaxHp})</span></span>
            <span class="text-slate-600">•</span>
            <span class="text-sky-400 font-bold">BAB: +${summary.baseBab}${isFrac && summary.fractional ? ` (${summary.fractional.bab.toFixed(2)})` : ''}</span>
            <span class="text-slate-600">•</span>
            <span class="text-slate-300 font-bold">Saves: Fort +${summary.baseSaves.fort} / Ref +${summary.baseSaves.ref} / Will +${summary.baseSaves.will}</span>
            <span class="text-slate-600">•</span>
            <span class="text-indigo-300 font-bold">Skill Pool: ${summary.totalSkillPoints} Pts</span>
          </div>
        `;
      }

      // Render Table Rows
      prog.forEach((lvl, idx) => {
        const isActive = lvl.active !== false;
        const tr = document.createElement('tr');
        tr.className = isActive 
          ? 'hover:bg-slate-900/60 transition' 
          : 'hover:bg-slate-900/40 transition opacity-50 bg-slate-950/50 border-dashed border-b border-slate-800/80 italic';

        // Stat Bonus Badge (Every 4 levels or if level has a stat increase)
        const currentStatKey = getLevelStatIncrease(lvl);
        const isStatInterval = (lvl.level % 4 === 0);

        let statBadgeItem = '';
        if (currentStatKey) {
          const sDef = STAT_KEYS.find(k => k.key === currentStatKey) || { key: currentStatKey, label: currentStatKey.toUpperCase(), name: currentStatKey.toUpperCase() };
          statBadgeItem = `<button type="button" onclick="openStatPickerForLevel(${idx})" class="w-full min-h-6 h-auto py-0.5 inline-flex items-center justify-start gap-1.5 px-2 rounded text-[10px] font-bold bg-sky-950/80 hover:bg-sky-900 active:scale-95 text-sky-300 hover:text-white border border-sky-600/70 shadow-sm transition text-left cursor-pointer" title="Level ${lvl.level} Ability Score Increase: +1 ${sDef.name}. Click to change or remove."><span class="shrink-0">💪</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight">+1 Stat: ${sDef.label}</span></button>`;
        } else if (isStatInterval) {
          statBadgeItem = `<button type="button" onclick="openStatPickerForLevel(${idx})" class="w-full min-h-6 h-auto py-0.5 inline-flex items-center justify-start gap-1.5 px-2 rounded text-[10px] font-bold bg-sky-950/90 hover:bg-sky-900 active:scale-95 text-sky-300 hover:text-white border border-dashed border-sky-500 shadow-sm animate-pulse transition text-left cursor-pointer" title="Select +1 Ability Score Increase for Level ${lvl.level}"><span class="shrink-0">💪</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight">+ Select Ability (+1)</span></button>`;
        }

        // Filtered and partitioned feats for 3-column split:
        // 1. Regular Feats (Beceriler)
        // 2. Class Bonus Feats (Sınıf Özellikleri)
        // 3. Other Bonus Feats / Boons / Invocations / Flaws (Bonus)
        const regularFeats = [];
        const classBonusFeats = [];
        const otherBonusFeats = [];
        (lvl.feats || []).forEach(fStr => {
          const str = String(fStr);
          if (str.includes('+1 Stat') || str.includes('Stat:')) return; // handled by statBadgeItem
          if (str.includes('[Bonus]') || str.includes('Bonus')) {
            classBonusFeats.push(fStr);
          } else if (str.includes('[DM Boon]') || str.includes('Boon') || str.includes('DM Grant')) {
            otherBonusFeats.push(fStr);
          } else if (str.includes('[Flaw]') || str.includes('Flaw:') ||
              str.includes('[Racial]') ||
              str.includes('[Invocation]') || str.includes('Invocation') ||
              str.includes('Caster Lvl') || str.includes('+1 Primary CL') || str.includes('🔮')) {
            otherBonusFeats.push(fStr);
          } else {
            regularFeats.push(fStr);
          }
        });

        // 1. Sınıf Özellikleri (Core Class Abilities + Class Bonus Feats)
        const abilityBadgeItems = (lvl.specialAbilities || []).map(aStr => {
          const str = String(aStr);
          const rawName = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          const safeA = rawName.replace(/'/g, "\\'");
          const tip = getFeatTooltipText(aStr);
          const safeTip = tip.replace(/"/g, '&quot;');
          const cleanStr = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+/, '').trim();
          const cornerBadge = getFeatPinCornerBadgeHtml(rawName);
          return `<button onclick="showFeatDetail('${safeA}', ${idx}, 'ability')" title="${safeTip}" class="relative w-full min-h-6 h-auto py-0.5 inline-flex items-center justify-start gap-1.5 px-2 rounded text-[10px] font-bold bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-600/70 shadow-sm transition text-left cursor-pointer"><span class="shrink-0">✨</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-3">${cleanStr}</span>${cornerBadge}</button>`;
        });

        const classBonusBadgeItems = classBonusFeats.map(fStr => {
          const str = String(fStr);
          const rawName = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          const safeF = rawName.replace(/'/g, "\\'");
          const tip = getFeatTooltipText(fStr);
          const safeTip = tip.replace(/"/g, '&quot;');
          const cleanStr = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+/, '').trim();
          const cornerBadge = getFeatPinCornerBadgeHtml(rawName);
          return `<button onclick="showFeatDetail('${safeF}', ${idx}, 'feat')" title="${safeTip}" class="relative w-full min-h-6 h-auto py-0.5 inline-flex items-center justify-start gap-1.5 px-2 rounded text-[10px] font-bold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-600/70 shadow-sm transition text-left cursor-pointer"><span class="shrink-0">⚔️</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-3">${cleanStr}</span>${cornerBadge}</button>`;
        });

        let classLevelSoFar = 0;
        for (let i = 0; i <= idx; i++) {
          if (prog[i].className === lvl.className) classLevelSoFar++;
        }
        const classFeats = (typeof RuleEngine !== 'undefined' && RuleEngine.getClassLevelFeatures)
          ? RuleEngine.getClassLevelFeatures(lvl.className, classLevelSoFar)
          : { hasBonusFeat: false };
        const qualifiesForClassBonus = classFeats.hasBonusFeat;

        const pendingClassBonusButtons = [];
        if (qualifiesForClassBonus && classBonusFeats.length === 0) {
          const contract = classFeats.bonusFeatContract;
          let btnText = '+ Select Bonus Feat';
          let btnIcon = '⚔️';
          let btnCls = 'bg-amber-950/90 hover:bg-amber-900 text-amber-300 border-amber-500';
          if (contract && contract.mode === 'exact_choices') {
            btnText = `+ ${lvl.className} Feati (${contract.choices.join(' / ')})`;
            btnIcon = '🥋';
            btnCls = 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-500';
          } else if (lvl.className === 'Monk') {
            btnText = '+ Monk Bonus Feati';
            btnIcon = '🥋';
            btnCls = 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-500';
          } else if (lvl.className === 'Wizard') {
            btnText = '+ Wizard Bonus Feat';
            btnIcon = '🔮';
            btnCls = 'bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border-indigo-500';
          }
          pendingClassBonusButtons.push(`<button onclick="openQuickFeatPickerForLevel(${idx}, 'Class Bonus Feat', true)" class="w-full min-h-6 h-auto py-0.5 inline-flex items-center justify-start gap-1.5 px-2 rounded text-[10px] font-bold ${btnCls} border border-dashed shadow-sm animate-pulse transition text-left cursor-pointer" title="Select ${lvl.className} Bonus Feat for this level"><span class="shrink-0">${btnIcon}</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2">${btnText}</span></button>`);
        }

        // 2. Beceriler (Regular Feats) badges
        const regularFeatBadgeItems = regularFeats.map(fStr => {
          const str = String(fStr);
          const rawName = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          const safeF = rawName.replace(/'/g, "\\'");
          const tip = getFeatTooltipText(fStr);
          const safeTip = tip.replace(/"/g, '&quot;');
          const cleanStr = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+/, '').trim();
          const cornerBadge = getFeatPinCornerBadgeHtml(rawName);
          return `<button onclick="showFeatDetail('${safeF}', ${idx}, 'feat')" title="${safeTip}" class="relative w-full min-h-6 h-auto py-0.5 inline-flex items-center justify-start gap-1.5 px-2 rounded text-[10px] font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/70 shadow-sm transition text-left cursor-pointer"><span class="shrink-0">🎖️</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-3">${cleanStr}</span>${cornerBadge}</button>`;
        });

        // Check regular feat eligibility
        const featMode = character.settings?.featMode || 'Standard 3.5e (1, 3, 6, 9, 12, 15, 18)';
        const qualifiesForRegularFeat = isLevelQualifiesForFeat(lvl.level, featMode);
        const regularPromptButtons = [];
        if (qualifiesForRegularFeat && regularFeats.length === 0) {
          regularPromptButtons.push(`<button onclick="openQuickFeatPickerForLevel(${idx}, 'Regular Feat')" class="w-full min-h-6 h-auto py-0.5 inline-flex items-center justify-start gap-1.5 px-2 rounded text-[10px] font-bold bg-purple-950/90 hover:bg-purple-900 text-purple-300 border border-dashed border-purple-500 shadow-sm animate-pulse transition text-left cursor-pointer" title="Select Character Feat for this level"><span class="shrink-0">🎖️</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight">+ Select Feat</span></button>`);
        }

        // 3. Bonus badges (DM Boons, Invocations, Flaws, Racial, CL Boons)
        const otherBonusBadgeItems = otherBonusFeats.map(fStr => {
          const str = String(fStr);
          const rawName = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          const safeF = rawName.replace(/'/g, "\\'");
          const tip = getFeatTooltipText(fStr);
          const safeTip = tip.replace(/"/g, '&quot;');
          let bgCls = 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-600/70';
          let icon = '🌟';
          let labelText = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+/, '').trim();
          if (str.includes('[DM Boon]') || str.includes('Boon') || str.includes('DM Grant')) {
            bgCls = 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-600/70';
            icon = '🌟';
          } else if (str.includes('[Invocation]') || str.includes('Invocation') || str.includes('🔮')) {
            bgCls = 'bg-purple-950/80 hover:bg-purple-900 text-purple-300 border-purple-600/70';
            icon = '🔮';
          } else if (str.includes('[Flaw]') || str.includes('Flaw:')) {
            bgCls = 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-600/70';
            icon = '⚠️';
          } else if (str.includes('[Racial]')) {
            bgCls = 'bg-teal-950/80 hover:bg-teal-900 text-teal-300 border-teal-600/70';
            icon = '🧬';
            const featOnly = labelText.replace(/^\[Racial\]\s*/i, '').trim();
            labelText = `[Human Bonus] ${featOnly}`;
          }
          const cleanStr = labelText;
          const cornerBadge = getFeatPinCornerBadgeHtml(rawName);
          return `<button onclick="showFeatDetail('${safeF}', ${idx}, 'feat')" title="${safeTip}" class="relative w-full min-h-6 h-auto py-0.5 inline-flex items-center justify-start gap-1.5 px-2 rounded text-[10px] font-bold ${bgCls} border shadow-sm transition text-left cursor-pointer"><span class="shrink-0">${icon}</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-3">${cleanStr}</span>${cornerBadge}</button>`;
        });

        const qualifiesForHumanBonus = (lvl.level === 1 && isHuman);
        const pendingBonusButtons = [];
        if (qualifiesForHumanBonus && !otherBonusFeats.some(f => String(f).includes('[Racial]'))) {
          pendingBonusButtons.push(`<button onclick="openQuickFeatPickerForLevel(${idx}, 'Racial Trait', true)" class="w-full min-h-6 h-auto py-0.5 inline-flex items-center justify-start gap-1.5 px-2 rounded text-[10px] font-bold bg-teal-950/90 hover:bg-teal-900 text-teal-300 border border-dashed border-teal-500 shadow-sm animate-pulse transition text-left cursor-pointer" title="Select Human racial bonus feat (1st-Level RAW: Extra bonus feat)"><span class="shrink-0">🧬</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-3">+ Human Bonus Feat</span></button>`);
        }

        // Warlock Invocation Progression Check (Warlock Boon or Warlock Class Level)
        const isWarlockActive = (typeof isWarlockEnabledForLevel === 'function')
          ? isWarlockEnabledForLevel(idx)
          : Boolean(character.settings?.warlockBoon || (character.settings?.clMode && String(character.settings.clMode).includes('Warlock Boon')));
        
        if (isWarlockActive && typeof isWarlockInvocationLevel === 'function' && isWarlockInvocationLevel(lvl.level)) {
          const hasInvocation = otherBonusFeats.some(f => String(f).includes('[Invocation]') || String(f).toLowerCase().includes('invocation'));
          if (!hasInvocation) {
            const tier = (typeof getWarlockMaxTierForLevel === 'function') ? getWarlockMaxTierForLevel(lvl.level) : 'Least';
            pendingBonusButtons.push(`<button onclick="openQuickFeatPickerForLevel(${idx}, 'Warlock Invocation')" class="w-full min-h-6 h-auto py-0.5 inline-flex items-center justify-start gap-1.5 px-2 rounded text-[10px] font-bold bg-purple-950/90 hover:bg-purple-900 text-purple-300 border border-dashed border-purple-500 shadow-sm animate-pulse transition text-left cursor-pointer" title="Select Level ${lvl.level} Warlock Invocation (${tier})"><span class="shrink-0">🔮</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight">+ Select Invocation (${tier})</span></button>`);
          }
        }

        // Sequential progression check for checkbox:
        let canActivate = true;
        for (let i = 0; i < idx; i++) {
          if (prog[i].active === false) {
            canActivate = false;
            break;
          }
        }

        let canDeactivate = (idx > 0);
        if (canDeactivate) {
          for (let i = idx + 1; i < prog.length; i++) {
            if (prog[i].active !== false) {
              canDeactivate = false;
              break;
            }
          }
        }

        const isToggleDisabled = (idx === 0) || (isActive ? !canDeactivate : !canActivate);

        let toggleTitle = "";
        if (idx === 0) {
          toggleTitle = "Level 1 is the starting character level and cannot be deactivated.";
        } else if (isActive) {
          toggleTitle = canDeactivate 
            ? "Active Level (Applied to character stats). Click to set as planned/inactive."
            : "Deactivate later active levels first before deactivating this level.";
        } else {
          toggleTitle = canActivate
            ? "Planned Level (Not yet applied to stats). Click to activate now."
            : "Sequential Progression Rule: Activate earlier planned levels first.";
        }

        // Calculate cumulative BAB and Saves up to this level per D&D 3.5e RAW
        const rowSlice = prog.slice(0, idx + 1).map(p => ({ ...p, active: true }));
        const rowSummary = (typeof RuleEngine !== 'undefined' && RuleEngine.calculateProgression)
          ? RuleEngine.calculateProgression(rowSlice, { system: sys, isHuman, intMod })
          : null;
        const rowBab = rowSummary ? rowSummary.baseBab : (lvl.bab || 0);
        const rowFort = rowSummary ? rowSummary.baseSaves.fort : (lvl.fort || 0);
        const rowRef = rowSummary ? rowSummary.baseSaves.ref : (lvl.ref || 0);
        const rowWill = rowSummary ? rowSummary.baseSaves.will : (lvl.will || 0);

        lvl.bab = rowBab;
        lvl.fort = rowFort;
        lvl.ref = rowRef;
        lvl.will = rowWill;

        tr.innerHTML = `
          <td class="pt-2.5 pb-2.5 px-1 align-top text-center w-[32px] min-w-[32px]">
            <div class="h-6 flex items-center justify-center font-bold text-amber-400 text-xs">${lvl.level}</div>
          </td>
          <td class="pt-2.5 pb-2.5 px-1 align-top text-center w-[76px] min-w-[76px]">
            <div class="h-6 flex items-center justify-center">
              <label class="inline-flex items-center gap-1.5 ${isToggleDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}" title="${toggleTitle}">
                <input type="checkbox" onchange="toggleLevelActive(${idx})" ${isActive ? 'checked' : ''} ${isToggleDisabled ? 'disabled' : ''} class="w-3.5 h-3.5 rounded text-emerald-500 m-0 ${isToggleDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}">
                <span class="badge ${isActive ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-slate-800 text-slate-400 border-slate-700'} text-[9px] px-1.5 py-0.5 leading-none font-bold whitespace-nowrap">
                  ${isActive ? '✅ Aktif' : '📋 Plan'}
                </span>
              </label>
            </div>
          </td>
          <td class="pt-2.5 pb-2.5 px-2 align-top text-left w-[110px] min-w-[100px]">
            <div class="h-6 flex items-center font-sans font-bold text-white text-xs whitespace-nowrap">${lvl.className}-${classLevelSoFar}</div>
          </td>
          <td class="pt-2.5 pb-2.5 px-0.5 align-top text-center w-[36px] min-w-[36px]">
            <div class="h-6 flex items-center justify-center text-slate-400 font-bold text-xs">${lvl.hd}</div>
          </td>
          <td class="pt-2.5 pb-2.5 px-0.5 align-top text-center w-[38px] min-w-[38px]">
            <div class="h-6 flex items-center justify-center text-emerald-400 font-bold text-xs" title="Level Hit Die: +${lvl.hpGain} | Con: ${conModStr} (This Level: +${Math.max(1, (Number(lvl.hpGain) || 0) + conMod)})">+${lvl.hpGain}</div>
          </td>
          <td class="pt-2.5 pb-2.5 px-0.5 align-top text-center w-[38px] min-w-[38px]">
            <div class="h-6 flex items-center justify-center text-sky-400 font-bold text-xs">+${rowBab}</div>
          </td>
          <td class="pt-2.5 pb-2.5 px-0.5 align-top text-center w-[38px] min-w-[38px]">
            <div class="h-6 flex items-center justify-center text-slate-300 font-bold text-xs">+${rowFort}</div>
          </td>
          <td class="pt-2.5 pb-2.5 px-0.5 align-top text-center w-[38px] min-w-[38px]">
            <div class="h-6 flex items-center justify-center text-slate-300 font-bold text-xs">+${rowRef}</div>
          </td>
          <td class="pt-2.5 pb-2.5 px-0.5 align-top text-center w-[38px] min-w-[38px]">
            <div class="h-6 flex items-center justify-center text-slate-300 font-bold text-xs">+${rowWill}</div>
          </td>
          <td class="pt-2.5 pb-2.5 px-0.5 align-top text-center w-[44px] min-w-[44px]">
            <div class="h-6 flex items-center justify-center text-indigo-300 font-bold text-xs">${lvl.skillPts || 4}</div>
          </td>
          <td class="pt-2.5 pb-2.5 px-1 font-sans align-top text-center w-[160px] min-w-[145px] max-w-[175px]">
            <div class="flex flex-col gap-1.5 items-stretch w-full">
              ${(abilityBadgeItems.length > 0 || classBonusBadgeItems.length > 0 || pendingClassBonusButtons.length > 0) ? (abilityBadgeItems.join('') + classBonusBadgeItems.join('') + pendingClassBonusButtons.join('')) : '<span class="text-slate-600 text-[10px] italic leading-none py-1">-</span>'}
            </div>
          </td>
          <td class="pt-2.5 pb-2.5 px-1 font-sans align-top text-center w-[160px] min-w-[145px] max-w-[175px]">
            <div class="flex flex-col gap-1.5 items-stretch w-full">
              ${(regularFeatBadgeItems.length > 0 || regularPromptButtons.length > 0) ? (regularFeatBadgeItems.join('') + regularPromptButtons.join('')) : '<span class="text-slate-600 text-[10px] italic leading-none py-1">-</span>'}
            </div>
          </td>
          <td class="pt-2.5 pb-2.5 px-1 font-sans align-top text-center w-[160px] min-w-[145px] max-w-[175px]">
            <div class="flex flex-col gap-1.5 items-stretch w-full">
              ${(statBadgeItem || otherBonusBadgeItems.length > 0 || pendingBonusButtons.length > 0) ? ((statBadgeItem || '') + otherBonusBadgeItems.join('') + pendingBonusButtons.join('')) : '<span class="text-slate-600 text-[10px] italic leading-none py-1">-</span>'}
            </div>
          </td>
          <td class="pt-2.5 pb-2.5 px-1 align-top text-center w-[58px] min-w-[58px] max-w-[58px] whitespace-nowrap shrink-0">
            <div class="h-6 flex items-center justify-center gap-1">
              <button onclick="openQuickFeatPickerForLevel(${idx})" class="text-emerald-400 hover:text-emerald-300 p-0.5 text-xs transition font-bold" title="Bu seviyeye Feat, Yetenek, Invocation veya Bonus Ekle">
                ➕
              </button>
              <button onclick="openChangeLevelClassModal(${idx})" class="text-slate-400 hover:text-amber-400 p-0.5 text-xs transition" title="Edit class & stats for this level">
                ✏️
              </button>
              ${idx > 0 ? `
                <button onclick="deleteLevelRow(${idx})" class="text-slate-500 hover:text-rose-400 p-0.5 text-xs transition" title="Bu seviyeyi sil">
                  🗑️
                </button>
              ` : '<span class="invisible p-0.5 text-xs select-none pointer-events-none" aria-hidden="true">🗑️</span>'}
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // D&D 3.5e RAW Core Skills Catalog (46 Official Skills)
    const DND35_CORE_SKILLS = [
      { key: "appraise", name: "Appraise", stat: "int", acp: false, untrained: true },
      { key: "autohypnosis", name: "Autohypnosis", stat: "wis", acp: false, untrained: false },
      { key: "balance", name: "Balance", stat: "dex", acp: true, untrained: true },
      { key: "bluff", name: "Bluff", stat: "cha", acp: false, untrained: true },
      { key: "climb", name: "Climb", stat: "str", acp: true, untrained: true },
      { key: "concentration", name: "Concentration", stat: "con", acp: false, untrained: true },
      { key: "craft_alchemy", name: "Craft (Alchemy)", stat: "int", acp: false, untrained: false, note: "Creating alchemical items requires being trained and a spellcaster (CL 1+, PHB p.70)." },
      { key: "craft_armor", name: "Craft (Armorsmithing)", stat: "int", acp: false, untrained: true },
      { key: "craft_weapon", name: "Craft (Weaponsmithing)", stat: "int", acp: false, untrained: true },
      { key: "decipher_script", name: "Decipher Script", stat: "int", acp: false, untrained: false },
      { key: "diplomacy", name: "Diplomacy", stat: "cha", acp: false, untrained: true },
      { key: "disable_device", name: "Disable Device", stat: "int", acp: false, untrained: false },
      { key: "disguise", name: "Disguise", stat: "cha", acp: false, untrained: true },
      { key: "escape_artist", name: "Escape Artist", stat: "dex", acp: true, untrained: true },
      { key: "forgery", name: "Forgery", stat: "int", acp: false, untrained: true },
      { key: "gather_information", name: "Gather Information", stat: "cha", acp: false, untrained: true },
      { key: "handle_animal", name: "Handle Animal", stat: "cha", acp: false, untrained: false },
      { key: "heal", name: "Heal", stat: "wis", acp: false, untrained: true },
      { key: "hide", name: "Hide", stat: "dex", acp: true, untrained: true },
      { key: "intimidate", name: "Intimidate", stat: "cha", acp: false, untrained: true },
      { key: "jump", name: "Jump", stat: "str", acp: true, untrained: true },
      { key: "k_arcana", name: "Knowledge (Arcana)", stat: "int", acp: false, untrained: false },
      { key: "k_arch", name: "Knowledge (Architecture & Engineering)", stat: "int", acp: false, untrained: false },
      { key: "k_dungeon", name: "Knowledge (Dungeoneering)", stat: "int", acp: false, untrained: false },
      { key: "k_geo", name: "Knowledge (Geography)", stat: "int", acp: false, untrained: false },
      { key: "k_history", name: "Knowledge (History)", stat: "int", acp: false, untrained: false },
      { key: "k_local", name: "Knowledge (Local)", stat: "int", acp: false, untrained: false },
      { key: "k_nature", name: "Knowledge (Nature)", stat: "int", acp: false, untrained: false },
      { key: "k_nobility", name: "Knowledge (Nobility & Royalty)", stat: "int", acp: false, untrained: false },
      { key: "k_religion", name: "Knowledge (Religion)", stat: "int", acp: false, untrained: false },
      { key: "k_planes", name: "Knowledge (The Planes)", stat: "int", acp: false, untrained: false },
      { key: "listen", name: "Listen", stat: "wis", acp: false, untrained: true },
      { key: "martial_lore", name: "Martial Lore", stat: "int", acp: false, untrained: false },
      { key: "move_silently", name: "Move Silently", stat: "dex", acp: true, untrained: true },
      { key: "open_lock", name: "Open Lock", stat: "dex", acp: false, untrained: false },
      { key: "perform", name: "Perform", stat: "cha", acp: false, untrained: true },
      { key: "profession", name: "Profession", stat: "wis", acp: false, untrained: false },
      { key: "ride", name: "Ride", stat: "dex", acp: false, untrained: true },
      { key: "search", name: "Search", stat: "int", acp: false, untrained: true },
      { key: "sense_motive", name: "Sense Motive", stat: "wis", acp: false, untrained: true },
      { key: "sleight_of_hand", name: "Sleight of Hand", stat: "dex", acp: true, untrained: false },
      { key: "spellcraft", name: "Spellcraft", stat: "int", acp: false, untrained: false },
      { key: "spot", name: "Spot", stat: "wis", acp: false, untrained: true },
      { key: "survival", name: "Survival", stat: "wis", acp: false, untrained: true },
      { key: "swim", name: "Swim", stat: "str", acp: true, untrained: true },
      { key: "tumble", name: "Tumble", stat: "dex", acp: true, untrained: false },
      { key: "umd", name: "Use Magic Device", stat: "cha", acp: false, untrained: false },
      { key: "use_rope", name: "Use Rope", stat: "dex", acp: false, untrained: true }
    ];

    // Consolidated Skills House Rule Definition (7 Merged Groups)
    const DND35_CONSOLIDATED_SKILLS = [
      {
        key: "athletics",
        name: "Athletics",
        stat: "str",
        acp: true,
        components: ["climb", "jump", "swim"],
        compLabels: "Climb + Jump + Swim",
        desc: "Combines Climb, Jump, and Swim into a single physical athletics skill."
      },
      {
        key: "stealth",
        name: "Stealth",
        stat: "dex",
        acp: true,
        components: ["hide", "move_silently"],
        compLabels: "Hide + Move Silently",
        desc: "Combines visual concealment (Hide) and silent movement (Move Silently)."
      },
      {
        key: "perception",
        name: "Perception",
        stat: "wis",
        acp: false,
        components: ["spot", "listen"],
        compLabels: "Spot + Listen",
        desc: "Combines visual awareness (Spot) and auditory awareness (Listen)."
      },
      {
        key: "acrobatics",
        name: "Acrobatics",
        stat: "dex",
        acp: true,
        components: ["tumble", "balance", "escape_artist"],
        compLabels: "Tumble + Balance + Escape Artist",
        desc: "Combines Tumble, Balance, and Escape Artist."
      },
      {
        key: "thievery",
        name: "Thievery",
        stat: "dex",
        acp: false,
        components: ["open_lock", "disable_device", "sleight_of_hand"],
        compLabels: "Open Lock + Disable Device + Sleight of Hand",
        desc: "Combines lockpicking, disabling traps, and legerdemain."
      },
      {
        key: "diplomacy_merged",
        name: "Persuasion & Social",
        stat: "cha",
        acp: false,
        components: ["diplomacy", "gather_information"],
        compLabels: "Diplomacy + Gather Information",
        desc: "Combines social persuasion (Diplomacy) and urban rumor gathering (Gather Information)."
      },
      {
        key: "linguistics",
        name: "Linguistics",
        stat: "int",
        acp: false,
        components: ["decipher_script", "forgery"],
        compLabels: "Decipher Script + Forgery",
        desc: "Combines deciphering ancient scripts and creating/detecting forgeries."
      }
    ];

    let activeSkillFilter = localStorage.getItem('dnd35_skill_filter') || 'class'; // 'all' | 'class' | 'trained'
    let activeSkillStatFilter = localStorage.getItem('dnd35_skill_stat_filter') || 'all'; // 'all' | 'str' | 'dex' ...

    function setSkillFilter(filterMode) {
      activeSkillFilter = filterMode;
      try {
        localStorage.setItem('dnd35_skill_filter', filterMode);
      } catch (e) {}
      const btnAll = document.getElementById('btn-skill-filter-all');
      const btnClass = document.getElementById('btn-skill-filter-class');
      const btnTrained = document.getElementById('btn-skill-filter-trained');
      if (btnAll) btnAll.className = filterMode === 'all' ? 'px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer' : 'px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer';
      if (btnClass) btnClass.className = filterMode === 'class' ? 'px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer' : 'px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer';
      if (btnTrained) btnTrained.className = filterMode === 'trained' ? 'px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer' : 'px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer';
      renderSkills();
    }

    function setSkillStatFilter(stat) {
      activeSkillStatFilter = (stat || 'all').toLowerCase();
      try {
        localStorage.setItem('dnd35_skill_stat_filter', activeSkillStatFilter);
      } catch (e) {}
      renderSkills();
    }

    function onSkillSearchInput(val) {
      try {
        if (val && val.trim()) {
          localStorage.setItem('dnd35_skill_search', val.trim());
        } else {
          localStorage.removeItem('dnd35_skill_search');
        }
      } catch (e) {}
      renderSkills();
    }

    function clearSkillSearch() {
      const input = document.getElementById('skill-search-input');
      if (input) {
        input.value = '';
        try { localStorage.removeItem('dnd35_skill_search'); } catch (e) {}
        renderSkills();
      }
    }

    function initSkillFilters() {
      try {
        const savedFilter = localStorage.getItem('dnd35_skill_filter') || 'class';
        activeSkillFilter = savedFilter;
        const btnAll = document.getElementById('btn-skill-filter-all');
        const btnClass = document.getElementById('btn-skill-filter-class');
        const btnTrained = document.getElementById('btn-skill-filter-trained');
        if (btnAll) btnAll.className = savedFilter === 'all' ? 'px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer' : 'px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer';
        if (btnClass) btnClass.className = savedFilter === 'class' ? 'px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer' : 'px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer';
        if (btnTrained) btnTrained.className = savedFilter === 'trained' ? 'px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer' : 'px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer';

        const savedStat = localStorage.getItem('dnd35_skill_stat_filter') || 'all';
        activeSkillStatFilter = savedStat;
        const statSel = document.getElementById('skill-stat-filter');
        if (statSel) statSel.value = savedStat;

        const savedSearch = localStorage.getItem('dnd35_skill_search');
        const searchInput = document.getElementById('skill-search-input');
        if (searchInput && savedSearch !== null && savedSearch !== undefined) {
          searchInput.value = savedSearch;
        }
      } catch (e) {}
    }

    function stripTurkishSkillParen(rawName) {
      if (!rawName || typeof rawName !== 'string') return '';
      let s = rawName.trim();
      // Remove trailing parenthetical Turkish translations e.g. "(Değer Biçme)", "(Otohipnoz)", "(Simya)", "(Tarih)", "(Tuzak & Mekanizma)"
      s = s.replace(/\s*\((?:[^)]*[çğıöşüÇĞİÖŞÜ][^)]*|Otohipnoz|Blöf|Simya|Diplomasi|Tuzak\s*&\s*Mekanizma|Sahtecilik|Bilgi\s*Toplama|Tarih|Zindan|Performans|Meslek|Binicilik|Niyet\s*Sezme|Hayatta\s*Kalma|Soy\s*&\s*Hanedan)\)\s*$/i, '').trim();
      // Convert legacy colon subskill format "Knowledge: Arcana" or "Craft: Alchemy" -> "Knowledge (Arcana)" / "Craft (Alchemy)"
      const colonMatch = s.match(/^(Knowledge|Craft|Profession|Perform)\s*:\s*(.+)$/i);
      if (colonMatch) {
        const prefix = colonMatch[1].charAt(0).toUpperCase() + colonMatch[1].slice(1).toLowerCase();
        let sub = colonMatch[2].trim();
        if (prefix === 'Knowledge' && /^architecture$/i.test(sub)) sub = 'Architecture & Engineering';
        if (prefix === 'Knowledge' && /^nobility$/i.test(sub)) sub = 'Nobility & Royalty';
        s = `${prefix} (${sub})`;
      }
      return s;
    }
    window.stripTurkishSkillParen = stripTurkishSkillParen;

    function ensureAllSkills(char) {
      if (!char) return;
      if (!Array.isArray(char.skills)) char.skills = [];

      const classSkillsSet = (typeof getCharacterClassSkillsSet === 'function')
        ? getCharacterClassSkillsSet(char)
        : new Set();

      // Normalize all existing skill names first (strip Turkish parenthetical additions)
      char.skills.forEach(s => {
        if (s && s.name) {
          s.name = stripTurkishSkillParen(s.name);
        }
      });

      const consumedIndices = new Set();
      const canonicalSkills = [];

      DND35_CORE_SKILLS.forEach(core => {
        const cName = core.name.toLowerCase().trim();
        const cRaw = core.key.replace(/_/g, ' ');
        const matchedIndices = [];

        char.skills.forEach((s, idx) => {
          if (!s || consumedIndices.has(idx)) return;
          if (s.key && s.key === core.key) {
            matchedIndices.push(idx);
            return;
          }
          const sName = stripTurkishSkillParen(s.name || '').toLowerCase().trim();
          if (sName && (sName === cName || sName === cRaw)) {
            matchedIndices.push(idx);
          }
        });

        const isOfficialClass = classSkillsSet.has(core.key);

        if (matchedIndices.length === 0) {
          canonicalSkills.push({
            key: core.key,
            name: core.name,
            stat: core.stat,
            ranks: 0,
            misc: 0,
            acp: core.acp,
            untrained: core.untrained,
            isClass: isOfficialClass
          });
        } else {
          matchedIndices.forEach(idx => consumedIndices.add(idx));
          const primary = char.skills[matchedIndices[0]];
          let maxRanks = 0;
          let maxMisc = 0;
          let anyClass = false;
          let hasExplicitClass = false;

          matchedIndices.forEach(idx => {
            const entry = char.skills[idx];
            const r = Number(entry.ranks) || 0;
            const m = Number(entry.misc) || 0;
            if (r > maxRanks) maxRanks = r;
            if (m > maxMisc || (maxMisc === 0 && m !== 0)) maxMisc = m;
            if (entry.isClass !== undefined) {
              hasExplicitClass = true;
              if (entry.isClass) anyClass = true;
            }
          });

          primary.key = core.key;
          primary.name = core.name;
          if (primary.stat === undefined) primary.stat = core.stat;
          if (primary.acp === undefined) primary.acp = core.acp;
          if (primary.untrained === undefined) primary.untrained = core.untrained;
          primary.ranks = maxRanks;
          primary.misc = maxMisc;

          if (!hasExplicitClass) {
            primary.isClass = isOfficialClass;
          } else if (isOfficialClass && !char._classSkillsInitialized) {
            primary.isClass = true;
          } else {
            primary.isClass = anyClass;
          }

          canonicalSkills.push(primary);
        }
      });

      // Preserve any custom non-core skills (with Turkish parentheticals stripped)
      char.skills.forEach((s, idx) => {
        if (!s || consumedIndices.has(idx)) return;
        s.name = stripTurkishSkillParen(s.name || s.key || 'Custom Skill');
        canonicalSkills.push(s);
      });

      char.skills = canonicalSkills;

      if (classSkillsSet.size > 0 && !char._classSkillsInitialized) {
        char._classSkillsInitialized = true;
      }
    }

    // Explicit User Action: Auto-Sync Class Skills from Toolbar
    function autoSyncClassSkills(showToast = true) {
      if (!character) return;
      const classSkillsSet = (typeof getCharacterClassSkillsSet === 'function')
        ? getCharacterClassSkillsSet(character)
        : new Set();

      if (classSkillsSet.size === 0) {
        if (showToast && typeof showDiceToast === 'function') {
          showDiceToast({
            title: 'No Class Found',
            text: 'Please assign a valid class (Fighter, Rogue, etc.) to your character first.',
            color: 'amber'
          });
        }
        return;
      }

      if (!Array.isArray(character.skills)) ensureAllSkills(character);

      let syncedCount = 0;
      character.skills.forEach(sk => {
        if (classSkillsSet.has(sk.key)) {
          if (!sk.isClass) {
            sk.isClass = true;
            syncedCount++;
          }
        }
      });
      character._classSkillsInitialized = true;
      saveStateToStorage(true);
      renderSkills();

      if (showToast && typeof showDiceToast === 'function') {
        showDiceToast({
          title: '⭐ Class Skills Synced',
          text: `Synced ${classSkillsSet.size} official class skills (⭐) for ${character.classes || 'Class'}.`,
          color: 'emerald'
        });
      }
    }

    // Total Skill Points Calculation from Classes & Levels
    function calculateTotalSkillPoints(char) {
      if (!char) return 0;
      const prog = char.levelProgression;
      if (Array.isArray(prog) && prog.length > 0) {
        const totalFromProg = prog.reduce((sum, row) => sum + (Number(row.skillPts) || 0), 0);
        if (totalFromProg > 0) return totalFromProg;
      }

      const intMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(char.abilities?.int || 10)
        : Math.floor(((char.abilities?.int || 10) - 10) / 2);
      const isHuman = (char.race || '').toLowerCase().includes('human') ? 1 : 0;

      let totalPts = 0;
      let currentLevelIndex = 1;
      const classStr = char.classes || '';
      const classParts = classStr.split('/').map(s => s.trim()).filter(Boolean);

      if (classParts.length > 0) {
        classParts.forEach(cp => {
          const match = cp.match(/^([A-Za-z\s]+?)\s*(\d+)$/);
          if (match) {
            const cName = match[1].trim();
            const cLvl = parseInt(match[2], 10) || 1;
            const cDef = (typeof DND35_CLASS_DEFS !== 'undefined' && DND35_CLASS_DEFS[cName])
              ? DND35_CLASS_DEFS[cName]
              : { skills: 2 };
            const baseSkill = cDef.skills || 2;

            for (let l = 0; l < cLvl; l++) {
              if (currentLevelIndex === 1) {
                totalPts += Math.max(4, (baseSkill + intMod + isHuman) * 4);
              } else {
                totalPts += Math.max(1, baseSkill + intMod + isHuman);
              }
              currentLevelIndex++;
            }
          }
        });
      }

      if (totalPts > 0) return totalPts;

      const charLvl = Number(char.level) || 1;
      totalPts = Math.max(4, (2 + intMod + isHuman) * 4);
      if (charLvl > 1) {
        totalPts += (charLvl - 1) * Math.max(1, 2 + intMod + isHuman);
      }
      return totalPts;
    }

    // Spent Skill Points Calculation based on current mode
    function calculateSpentSkillPoints(char, isMerged) {
      if (!char || !Array.isArray(char.skills)) return 0;
      let totalSpent = 0;

      if (isMerged) {
        const handledKeys = new Set();
        DND35_CONSOLIDATED_SKILLS.forEach(conDef => {
          const compSkills = char.skills.filter(s => conDef.components.includes(s.key));
          conDef.components.forEach(k => handledKeys.add(k));
          const ranks = Math.max(0, ...compSkills.map(s => Number(s.ranks) || 0));
          const isClass = compSkills.some(s => s.isClass);
          totalSpent += ranks * (isClass ? 1 : 2);
        });

        char.skills.forEach(sk => {
          if (!handledKeys.has(sk.key)) {
            const ranks = Number(sk.ranks) || 0;
            totalSpent += ranks * (sk.isClass ? 1 : 2);
          }
        });
      } else {
        char.skills.forEach(sk => {
          const ranks = Number(sk.ranks) || 0;
          totalSpent += ranks * (sk.isClass ? 1 : 2);
        });
      }

      return totalSpent;
    }

    // Toggle Class Skill for a given skill key
    function toggleSkillClass(skillKey) {
      ensureAllSkills(character);
      const isMerged = character.settings?.mergeSkills !== false;
      const consolidated = isMerged ? DND35_CONSOLIDATED_SKILLS.find(c => c.key === skillKey) : null;

      if (consolidated) {
        // Toggle all components
        const compSkills = (character.skills || []).filter(s => consolidated.components.includes(s.key));
        const anyClass = compSkills.some(s => s.isClass);
        const newState = !anyClass;
        compSkills.forEach(s => { s.isClass = newState; });
      } else {
        const sk = (character.skills || []).find(s => s.key === skillKey || s.name === skillKey);
        if (sk) {
          sk.isClass = !sk.isClass;
        }
      }
      saveStateToStorage(true);
      renderSkills();
    }

    // Interactive Rank Adjustment with strict Skill Points Pool limit
    function adjustSkillRank(skillKey, delta) {
      ensureAllSkills(character);
      const isMerged = character.settings?.mergeSkills !== false;
      const consolidated = isMerged ? DND35_CONSOLIDATED_SKILLS.find(c => c.key === skillKey) : null;

      const charLevel = Number(character.level) || 1;
      const maxClassRank = charLevel + 3;
      const maxCrossRank = Math.floor((charLevel + 3) / 2 * 10) / 10;

      let currentRanks = 0;
      let isClass = false;

      if (consolidated) {
        const compSkills = (character.skills || []).filter(s => consolidated.components.includes(s.key));
        currentRanks = Math.max(0, ...compSkills.map(s => Number(s.ranks) || 0));
        isClass = compSkills.some(s => s.isClass);
      } else {
        const sk = (character.skills || []).find(s => s.key === skillKey || s.name === skillKey);
        if (sk) {
          currentRanks = Number(sk.ranks) || 0;
          isClass = !!sk.isClass;
        }
      }

      const maxAllowedRank = isClass ? maxClassRank : maxCrossRank;

      if (delta > 0) {
        // Check max rank cap
        if (currentRanks + delta > maxAllowedRank) {
          showDiceTopToast({
            icon: '⚠️',
            title: 'Maximum Rank Cap',
            breakdown: `Maximum ranks allowed at this level: ${maxAllowedRank} (${isClass ? 'Class Skill' : 'Cross-Class'})`,
            total: `${currentRanks}/${maxAllowedRank}`
          });
          return;
        }

        // Check skill points budget (Informative warning; does not hard-block to support Fazla Harcama / DM Boons)
        const totalPts = calculateTotalSkillPoints(character);
        const spentPts = calculateSpentSkillPoints(character, isMerged);
        const pointCost = isClass ? 1 : 2;

        if (spentPts + pointCost > totalPts) {
          const excess = (spentPts + pointCost) - totalPts;
          showDiceTopToast({
            icon: '⚠️',
            title: 'Skill Point Budget Exceeded',
            breakdown: `Official skill point budget: ${totalPts} (Spent: ${spentPts + pointCost}). Over budget by +${excess} pts.`,
            total: `+${excess}`
          });
        }
      }

      const newRanks = Math.max(0, currentRanks + delta);

      if (consolidated) {
        const compSkills = (character.skills || []).filter(s => consolidated.components.includes(s.key));
        compSkills.forEach(s => { s.ranks = newRanks; });
      } else {
        const sk = (character.skills || []).find(s => s.key === skillKey || s.name === skillKey);
        if (sk) {
          sk.ranks = newRanks;
        }
      }
      saveStateToStorage(true);
      renderSkills();
    }

    // Toggle Skill Consolidation mode directly from Skills card
    function toggleSkillConsolidation() {
      if (!character.settings) character.settings = {};
      character.settings.mergeSkills = character.settings.mergeSkills === false ? true : false;
      saveStateToStorage(true);
      renderSkills();
      showDiceTopToast({
        icon: '🔗',
        title: 'Skill Mode Changed',
        breakdown: character.settings.mergeSkills ? 'Consolidated Skills (7 Groups) enabled!' : 'Standard D&D 3.5e RAW (46 Skills) enabled!',
        total: character.settings.mergeSkills ? 'Consolidated' : 'RAW'
      });
    }

    // Open/Close/Save Skill Consolidation Modal (Master DB linked)
    let _scmSelectedMode = true;

    function setScmMode(isMerged) {
      _scmSelectedMode = !!isMerged;
      const btnMerge = document.getElementById('scm-btn-mode-merge');
      const btnSplit = document.getElementById('scm-btn-mode-split');
      const badgeMerge = document.getElementById('scm-badge-merge');
      const badgeSplit = document.getElementById('scm-badge-split');

      if (btnMerge && btnSplit) {
        if (_scmSelectedMode) {
          btnMerge.className = 'text-left p-3 rounded-xl border-2 transition relative flex flex-col justify-between bg-emerald-950/60 border-emerald-500 shadow-md';
          btnSplit.className = 'text-left p-3 rounded-xl border-2 transition relative flex flex-col justify-between bg-slate-900 border-slate-700 hover:border-slate-500';
          if (badgeMerge) {
            badgeMerge.textContent = '✓ Active';
            badgeMerge.className = 'text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded';
          }
          if (badgeSplit) {
            badgeSplit.textContent = '46 Skills';
            badgeSplit.className = 'text-[9px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded';
          }
        } else {
          btnMerge.className = 'text-left p-3 rounded-xl border-2 transition relative flex flex-col justify-between bg-slate-900 border-slate-700 hover:border-slate-500';
          btnSplit.className = 'text-left p-3 rounded-xl border-2 transition relative flex flex-col justify-between bg-sky-950/60 border-sky-500 shadow-md';
          if (badgeMerge) {
            badgeMerge.textContent = '7 Groups';
            badgeMerge.className = 'text-[9px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded';
          }
          if (badgeSplit) {
            badgeSplit.textContent = '✓ Active (RAW)';
            badgeSplit.className = 'text-[9px] bg-sky-600 text-white font-bold px-1.5 py-0.5 rounded';
          }
        }
      }
    }

    function openSkillConsolidationModal() {
      const modal = document.getElementById('skill-consolidation-modal');
      if (!modal) return;
      const isMerged = character?.settings?.mergeSkills !== false;
      setScmMode(isMerged);
      modal.classList.remove('hidden');
    }

    function closeSkillConsolidationModal() {
      const modal = document.getElementById('skill-consolidation-modal');
      if (modal) modal.classList.add('hidden');
    }

    function saveSkillConsolidationSettings() {
      const saveDb = document.getElementById('scm-save-master-db')?.checked !== false;
      const isEnabled = _scmSelectedMode;

      if (!character.settings) character.settings = {};
      character.settings.mergeSkills = isEnabled;

      if (saveDb && typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const ruleName = "Skill Consolidation (7 Groups)";
        const existingIdx = masterDb.findIndex(m => (m.name || '').toLowerCase() === ruleName.toLowerCase());
        const ruleData = {
          name: ruleName,
          type: "House Rule",
          slot: "None",
          parent: "Alternative Rules",
          prereq: "-",
          source: "Unearthed Arcana / Pathfinder 1e",
          benefit: isEnabled ? "Skills consolidated into 7 groups (Athletics, Stealth, Perception, Acrobatics, Thievery, Persuasion, Linguistics)." : "Standard 46 D&D 3.5e RAW skills active.",
          bonusType: "Rule",
          scope: "Skills",
          action: "Passive",
          actionType: "Passive",
          role: "House Rule",
          tags: ["skills", "consolidation", "houserule"],
          skillMapping: (typeof RuleEngine !== 'undefined' && RuleEngine.DEFAULT_SKILL_MAPPING) ? RuleEngine.DEFAULT_SKILL_MAPPING : {
            "stealth": ["hide", "move_silently", "move silently", "movesilently", "sessiz hareket", "gizlenme"],
            "perception": ["spot", "listen", "search", "fark etme", "dinleme", "arama"],
            "athletics": ["climb", "jump", "swim", "tırmanma", "zıplama", "yüzme"],
            "acrobatics": ["tumble", "balance", "escape_artist", "escape artist", "takla", "denge", "kurtulma"],
            "thievery": ["disable_device", "disable device", "open_lock", "open lock", "sleight_of_hand", "sleight of hand", "kilit açma", "tuzak bozma"],
            "diplomacy": ["diplomacy", "gather_information", "gather information", "sense_motive", "sense motive", "diplomasi", "bilgi toplama", "sezgi"],
            "linguistics": ["decipher_script", "decipher script", "forgery", "speak_language", "speak language", "yazı çözme", "sahtecilik"]
          }
        };
        if (existingIdx >= 0) {
          masterDb[existingIdx] = Object.assign({}, masterDb[existingIdx], ruleData);
        } else {
          masterDb.push(ruleData);
        }
        if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
          RuleMaster.renderTable();
        }
      }

      closeSkillConsolidationModal();
      saveStateToStorage(true);
      if (typeof updateHouseRuleSkillConsolidationUI === 'function') {
        updateHouseRuleSkillConsolidationUI();
      }
      renderSkills();
      showDiceTopToast({
        icon: '🔗',
        title: 'Skill Mode Updated',
        breakdown: isEnabled ? 'Consolidated Skills (7 Groups) enabled!' : 'Switched back to Standard D&D 3.5e RAW (46 Skills)!',
        total: isEnabled ? 'Consolidated' : 'RAW'
      });
    }

