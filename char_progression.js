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

      // 1. Canonical V2 SrdCompendium (464 SRD Feats & UA Flaws with structured prerequisites)
      if (typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) {
        window.SrdCompendium.getAllLoaded(['Feat', 'Flaw']).forEach(f => {
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
      // 2. Fallback from BUNDLED_SRD_CORE_CATALOG only if SrdCompendium is not ready
      if (!(typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) && typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        window.BUNDLED_SRD_CORE_CATALOG.filter(i => i && (i.type === 'Feat' || i.type === 'Flaw')).forEach(f => {
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
          const isKnownFlaw = t === 'flaw' || String(m.category || '').toLowerCase() === 'flaw' || Boolean(m.ruleFlags && m.ruleFlags.isFlaw) || Number(m.slotDiff) > 0;
          map.set(key, {
            ...m,
            name: m.name,
            type: isKnownFlaw ? 'Flaw' : (m.type || 'Feat'),
            category: isInv
              ? 'Warlock Invocation'
              : (t === 'special ability' ? 'Special Ability' : (t === 'dm grant' ? 'DM Boon' : (isKnownFlaw ? 'Flaw' : (m.category || 'General')))),
            slotDiff: isKnownFlaw ? (Number(m.slotDiff) || 1) : (m.slotDiff || 0),
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

      const totalFiltered = filtered.length;
      const displayFiltered = (!query && totalFiltered > 60) ? filtered.slice(0, 60) : filtered;

      displayFiltered.forEach(f => {
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

      if (!query && totalFiltered > 60) {
        const foot = document.createElement('div');
        foot.className = 'p-3 text-center text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl my-2 font-mono';
        foot.textContent = `Showing top 60 of ${totalFiltered} entries — use search or filters above to narrow results`;
        listEl.appendChild(foot);
      }
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
      const filterFn = (typeof isBaseMundaneWeaponEntry === 'function')
        ? isBaseMundaneWeaponEntry
        : (window.isBaseMundaneWeaponEntry || (() => true));
      const resolveFn = (typeof resolveBaseWeaponName === 'function')
        ? resolveBaseWeaponName
        : (window.resolveBaseWeaponName || (w => (w.name || '').replace(/^↳\s*/, '').replace(/\(.*?\)/g, '').trim()));

      if (window.SrdCompendium && typeof window.SrdCompendium.getByType === 'function') {
        window.SrdCompendium.getByType('Weapon').forEach(item => {
          if (item && filterFn(item)) {
            const cat = String(item.category || '').toLowerCase();
            const sub = String(item.subcategory || item.proficiency || '').toLowerCase();
            if (cat === 'exotic' || sub.includes('exotic')) {
              const baseName = resolveFn(item);
              if (baseName && filterFn(baseName)) set.add(baseName);
            }
          }
        });
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        masterDb.forEach(item => {
          if (item && (item.type === 'Weapon' || item.category === 'Weapon') && filterFn(item)) {
            const sub = (item.subcategory || item.proficiency || item.slot || '').toLowerCase();
            const desc = (item.desc || item.description || item.benefit || '').toLowerCase();
            const cat = String(item.category || '').toLowerCase();
            if (cat === 'exotic' || sub.includes('exotic') || desc.includes('exotic weapon')) {
              const baseName = resolveFn(item);
              if (baseName && filterFn(baseName)) set.add(baseName);
            }
          }
        });
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    function getAvailableTargetWeapons(isExoticOnly = false) {
      if (isExoticOnly) return getAvailableExoticWeapons();
      const getSrdFn = (typeof getSrdWeaponNames === 'function')
        ? getSrdWeaponNames
        : (window.getSrdWeaponNames || (() => []));
      const filterFn = (typeof isBaseMundaneWeaponEntry === 'function')
        ? isBaseMundaneWeaponEntry
        : (window.isBaseMundaneWeaponEntry || (() => true));
      const resolveFn = (typeof resolveBaseWeaponName === 'function')
        ? resolveBaseWeaponName
        : (window.resolveBaseWeaponName || (w => (w.name || '').replace(/^↳\s*/, '').replace(/\(.*?\)/g, '').trim()));

      const set = new Set(getSrdFn());
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        masterDb.forEach(item => {
          if (item && (item.type === 'Weapon' || item.category === 'Weapon') && filterFn(item)) {
            const baseName = resolveFn(item);
            if (baseName && filterFn(baseName)) set.add(baseName);
          }
        });
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    function getWeaponDisplayMeta(wName) {
      if (!wName) return '';
      const lower = String(wName).toLowerCase().trim();
      let found = null;
      if (window.SrdCompendium && typeof window.SrdCompendium.getByType === 'function') {
        const list = window.SrdCompendium.getByType('Weapon') || [];
        found = list.find(w => w && String(w.name || '').toLowerCase().trim() === lower);
      }
      if (!found && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        found = window.BUNDLED_SRD_CORE_CATALOG.find(w => w && w.type === 'Weapon' && String(w.name || '').toLowerCase().trim() === lower);
      }
      if (!found && typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        found = masterDb.find(w => w && (w.type === 'Weapon' || w.category === 'Weapon') && String(w.name || '').toLowerCase().trim() === lower);
      }
      if (!found) return '';
      const parts = [];
      if (found.category) parts.push(found.category);
      const dmg = found.damage || (found.damageParts && found.damageParts[0] && found.damageParts[0].dice);
      if (dmg) parts.push(dmg);
      const critR = found.critRange && found.critRange < 20 ? `${found.critRange}-20` : '20';
      const critM = found.critMult ? `x${found.critMult}` : 'x2';
      if (found.critRange || found.critMult) parts.push(`${critR}/${critM}`);
      return parts.join(' • ');
    }
    window.getWeaponDisplayMeta = getWeaponDisplayMeta;

    function renderQuickFeatTargetSpotlightResults(filterText = '', isExotic = false, currentTarget = '') {
      const resultsEl = document.getElementById('quick-feat-target-spotlight-results');
      const badgeContainer = document.getElementById('quick-feat-target-active-badge-container');
      if (!resultsEl) return;

      const q = String(filterText || '').toLowerCase().trim();
      const resolveFn = (typeof resolveBaseWeaponName === 'function')
        ? resolveBaseWeaponName
        : (window.resolveBaseWeaponName || (w => (w.name || '').replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim()));

      const allWeapons = isExotic ? getAvailableExoticWeapons() : getAvailableTargetWeapons(false);
      const charWeps = (character.weapons || []).map(w => resolveFn(w)).filter(Boolean);
      const equippedWeapons = [...new Set(charWeps.filter(cw => allWeapons.some(aw => aw.toLowerCase() === cw.toLowerCase())))];
      const compendiumWeapons = allWeapons.filter(aw => !equippedWeapons.some(ew => ew.toLowerCase() === aw.toLowerCase()));

      const filteredEquipped = q ? equippedWeapons.filter(w => w.toLowerCase().includes(q)) : equippedWeapons;
      const filteredCompendium = q ? compendiumWeapons.filter(w => w.toLowerCase().includes(q)) : compendiumWeapons;

      // Render Selected Weapon Badge
      if (badgeContainer) {
        if (currentTarget) {
          const meta = getWeaponDisplayMeta(currentTarget);
          badgeContainer.innerHTML = `
            <div class="flex items-center justify-between px-2.5 py-1.5 bg-amber-950/70 border border-amber-600/70 rounded-lg text-xs text-amber-200 shadow-sm">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-amber-400 font-bold text-[10px] uppercase tracking-wide">Selected:</span>
                <span class="font-extrabold text-white truncate">${currentTarget}</span>
                ${meta ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-900/80 text-amber-300 font-mono">${meta}</span>` : ''}
              </div>
              <button type="button" onclick="window.clearQuickFeatTargetSelection()" class="text-[10px] text-amber-400 hover:text-white underline cursor-pointer ml-2 shrink-0">Change</button>
            </div>
          `;
        } else {
          badgeContainer.innerHTML = `
            <div class="px-2 py-1 text-[10px] text-amber-400/80 italic flex items-center gap-1">
              <span>⚠️</span>
              <span>Please pick a weapon below to apply this feat to.</span>
            </div>
          `;
        }
      }

      if (filteredEquipped.length === 0 && filteredCompendium.length === 0) {
        resultsEl.innerHTML = `
          <div class="p-3 text-center text-slate-400 text-xs">
            No matching base weapon found for "<strong>${q}</strong>".
          </div>
        `;
        return;
      }

      let html = '';

      if (filteredEquipped.length > 0) {
        html += `
          <div class="px-2 py-1 text-[9px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between bg-slate-900/90 rounded">
            <span>⚔️ Equipped / Inventory Weapons</span>
            <span class="text-slate-400 font-mono">${filteredEquipped.length}</span>
          </div>
        `;
        filteredEquipped.forEach(w => {
          const isSel = (currentTarget || '').toLowerCase() === w.toLowerCase();
          const meta = getWeaponDisplayMeta(w);
          const safeW = w.replace(/'/g, "\\'");
          html += `
            <button type="button" onclick="window.selectQuickFeatTargetWeapon('${safeW}')" class="w-full text-left p-1.5 rounded-lg ${isSel ? 'bg-amber-950/90 border border-amber-500 text-amber-200' : 'bg-slate-900/50 hover:bg-amber-950/40 border border-transparent hover:border-amber-600/50 text-slate-200'} transition flex items-center justify-between gap-2 group cursor-pointer active:scale-[0.99]">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="font-bold text-white text-xs group-hover:text-amber-200 truncate">${w}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold shrink-0">Equipped</span>
                ${meta ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono shrink-0">${meta}</span>` : ''}
              </div>
              ${isSel ? '<span class="text-xs text-amber-400 font-bold shrink-0">Selected ✓</span>' : '<span class="text-xs text-slate-500 group-hover:text-amber-300 font-bold shrink-0">Select ➔</span>'}
            </button>
          `;
        });
      }

      if (filteredCompendium.length > 0) {
        html += `
          <div class="px-2 py-1 text-[9px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between bg-slate-900/90 rounded mt-1">
            <span>${isExotic ? '🗡️ D&D 3.5e Exotic Weapon Compendium' : '📚 All D&D 3.5e Base Weapons'}</span>
            <span class="text-slate-400 font-mono">${filteredCompendium.length}</span>
          </div>
        `;
        filteredCompendium.forEach(w => {
          const isSel = (currentTarget || '').toLowerCase() === w.toLowerCase();
          const meta = getWeaponDisplayMeta(w);
          const safeW = w.replace(/'/g, "\\'");
          html += `
            <button type="button" onclick="window.selectQuickFeatTargetWeapon('${safeW}')" class="w-full text-left p-1.5 rounded-lg ${isSel ? 'bg-amber-950/90 border border-amber-500 text-amber-200' : 'bg-slate-900/50 hover:bg-purple-950/40 border border-transparent hover:border-purple-600/50 text-slate-200'} transition flex items-center justify-between gap-2 group cursor-pointer active:scale-[0.99]">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="font-bold text-white text-xs group-hover:text-purple-200 truncate">${w}</span>
                ${meta ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono shrink-0">${meta}</span>` : ''}
              </div>
              ${isSel ? '<span class="text-xs text-amber-400 font-bold shrink-0">Selected ✓</span>' : '<span class="text-xs text-slate-500 group-hover:text-purple-300 font-bold shrink-0">Select ➔</span>'}
            </button>
          `;
        });
      }

      resultsEl.innerHTML = html;
    }
    window.renderQuickFeatTargetSpotlightResults = renderQuickFeatTargetSpotlightResults;

    window.selectQuickFeatTargetWeapon = function(wName) {
      const select = document.getElementById('quick-feat-target-select');
      if (select) {
        let opt = Array.from(select.options).find(o => o.value.toLowerCase() === (wName || '').toLowerCase());
        if (!opt && wName) {
          opt = document.createElement('option');
          opt.value = wName;
          opt.textContent = wName;
          select.appendChild(opt);
        }
        select.value = wName || '';
      }
      const clearBtn = document.getElementById('quick-feat-target-spotlight-clear-btn');
      if (clearBtn) clearBtn.classList.toggle('hidden', !wName);

      onQuickFeatTargetSelectChange(wName);

      const isExotic = /exotic weapon proficiency/i.test(document.getElementById('quick-feat-name')?.value || '');
      const searchInput = document.getElementById('quick-feat-target-spotlight-input');
      renderQuickFeatTargetSpotlightResults(searchInput ? searchInput.value : '', isExotic, wName);
    };

    window.clearQuickFeatTargetSelection = function() {
      window.selectQuickFeatTargetWeapon('');
      const searchInput = document.getElementById('quick-feat-target-spotlight-input');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
    };

    function updateQuickFeatTargetSelector(featName) {
      const container = document.getElementById('quick-feat-target-container');
      const select = document.getElementById('quick-feat-target-select');
      const titleEl = document.getElementById('quick-feat-target-title');
      const iconEl = document.getElementById('quick-feat-target-icon');
      if (!container || !select) return;

      const t = String(featName || '').trim();
      const lower = t.toLowerCase();
      const isWeaponFeat = /^(weapon focus|greater weapon focus|weapon specialization|greater weapon specialization|improved critical|exotic weapon proficiency|martial weapon proficiency)/i.test(lower);

      if (!isWeaponFeat) {
        container.classList.add('hidden');
        return;
      }

      const isExotic = /exotic weapon proficiency/i.test(lower);
      const match = t.match(/\((.*?)\)/);
      const currentTarget = match ? match[1].trim() : (select.value || '');

      if (titleEl) titleEl.textContent = isExotic ? 'Spotlight: Select Exotic Weapon' : 'Spotlight: Select Target Weapon';
      if (iconEl) iconEl.textContent = isExotic ? '🗡️' : '⚔️';

      // Hide legacy select while keeping options populated for 100% backward compatibility
      select.style.display = 'none';
      select.classList.add('hidden');
      select.innerHTML = '<option value="">-- Select a Weapon --</option>';

      const allWeapons = isExotic ? getAvailableExoticWeapons() : getAvailableTargetWeapons(false);
      allWeapons.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        if (currentTarget.toLowerCase() === w.toLowerCase()) opt.selected = true;
        select.appendChild(opt);
      });
      select.value = currentTarget;

      // Mount or update Spotlight search UI inside container
      let spotlightWrapper = document.getElementById('quick-feat-target-spotlight-wrapper');
      if (!spotlightWrapper) {
        spotlightWrapper = document.createElement('div');
        spotlightWrapper.id = 'quick-feat-target-spotlight-wrapper';
        spotlightWrapper.className = 'space-y-2 mt-1.5';
        container.appendChild(spotlightWrapper);
      }

      spotlightWrapper.innerHTML = `
        <div class="relative flex items-center">
          <span class="absolute left-2.5 text-slate-400 text-xs pointer-events-none">🔍</span>
          <input type="text" id="quick-feat-target-spotlight-input"
            placeholder="Type weapon name (e.g. Longsword, Greatsword, Scimitar)..."
            class="w-full bg-slate-950 border border-amber-500/70 focus:border-amber-400 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium transition"
            autocomplete="off">
          <button type="button" id="quick-feat-target-spotlight-clear-btn" onclick="window.clearQuickFeatTargetSelection()" class="absolute right-2 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer ${currentTarget ? '' : 'hidden'}" title="Clear selection">&times;</button>
        </div>
        <div id="quick-feat-target-active-badge-container"></div>
        <div id="quick-feat-target-spotlight-results" class="max-h-52 overflow-y-auto space-y-1 p-1 bg-slate-950/70 border border-slate-800 rounded-lg custom-scroll text-xs"></div>
      `;

      const searchInput = document.getElementById('quick-feat-target-spotlight-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          renderQuickFeatTargetSpotlightResults(e.target.value, isExotic, select.value);
        });
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const firstBtn = document.querySelector('#quick-feat-target-spotlight-results button');
            if (firstBtn) firstBtn.click();
          }
        });
      }

      renderQuickFeatTargetSpotlightResults('', isExotic, currentTarget);
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

    const CANONICAL_UA_FLAW_NAMES = new Set([
      'feeble', 'frail', 'inattentive', 'meager fortitude', 'murky-eyed',
      'noncombatant', 'pathetic', 'poor reflexes', 'shaky', 'slow',
      'unreactive', 'vulnerable'
    ]);

    function isFlawFeatString(fStr) {
      const str = String(fStr || '');
      if (str.includes('[Flaw Bonus]')) return false;
      if (str.includes('[Flaw]') || str.includes('Flaw:')) return true;
      const rawName = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
      if (!rawName) return false;
      if (CANONICAL_UA_FLAW_NAMES.has(rawName)) return true;
      if (Array.isArray(masterDb)) {
        const m = masterDb.find(e => (e.name || '').toLowerCase().trim() === rawName);
        if (m && (String(m.type || '').toLowerCase() === 'flaw' || String(m.category || '').toLowerCase() === 'flaw' || Number(m.slotDiff) === 1 || m.ruleFlags?.isFlaw)) {
          return true;
        }
      }
      return false;
    }

    function isFlawFeat(f) {
      if (!f) return false;
      if (typeof f === 'string') return isFlawFeatString(f);
      const name = String(f.name || '').trim().toLowerCase();
      const rawName = name.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim();
      if (CANONICAL_UA_FLAW_NAMES.has(name) || CANONICAL_UA_FLAW_NAMES.has(rawName)) return true;
      const cat = String(f.category || '').toLowerCase();
      const type = String(f.type || '').toLowerCase();
      if (cat === 'flaw' || type === 'flaw' || name.startsWith('flaw:')) return true;
      if (f.ruleFlags && f.ruleFlags.isFlaw) return true;
      if (Number(f.slotDiff) === 1 && (cat === 'flaw' || type === 'flaw')) return true;
      return false;
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
      const flawsAtLevel = [];
      const flawBonusFeatsAtLevel = [];
      ((lvlObj && lvlObj.feats) || []).forEach(fStr => {
        const str = String(fStr);
        if (str.includes('+1 Stat') || str.includes('Stat:')) return;
        if (str.includes('[Flaw Bonus]')) {
          otherBonusFeats.push(fStr);
          flawBonusFeatsAtLevel.push(fStr);
        } else if (isFlawFeatString(fStr)) {
          otherBonusFeats.push(fStr);
          flawsAtLevel.push(fStr);
        } else if (str.includes('[Bonus]') || str.includes('[Extra Bonus]') || str.includes('Bonus')) {
          classBonusFeats.push(fStr);
        } else if (str.includes('[DM Boon]') || str.includes('Boon') || str.includes('DM Grant')) {
          otherBonusFeats.push(fStr);
        } else if (str.includes('[Racial]') || str.includes('[Extra Racial]') ||
            str.includes('[Invocation]') || str.includes('[Extra Invocation]') || str.includes('Invocation') ||
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
      const hasSlotRegularFeat = regularFeats.some(f => !String(f).includes('[Extra]'));
      const hasSlotClassBonusFeat = classBonusFeats.some(f => !String(f).includes('[Extra'));
      const hasRacialBonus = otherBonusFeats.some(f => String(f).includes('[Racial]'));
      const unfilledFlawBonusCount = Math.max(0, flawsAtLevel.length - flawBonusFeatsAtLevel.length);

      // If preferredCategory is not explicitly passed (from the row ➕ button), open in Extra Addition mode
      // so unselected level feat slots (+ Select Feat, + Human Bonus Feat, + Class Bonus Feat) remain untouched:
      if (!preferredCategory) {
        preferredCategory = 'Regular Feat';
        if (isTargetLocked === null) isTargetLocked = false;
        activeQuickFeatTargetSlot = null;
      } else {
        if (isTargetLocked === null) isTargetLocked = true;
        activeQuickFeatTargetSlot = isTargetLocked ? preferredCategory : null;
      }

      isQuickFeatTargetLocked = Boolean(isTargetLocked);

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
        const optFlawBonus = document.getElementById('quick-feat-opt-flaw-bonus');

        if (optRegular) {
          const isRegFull = qualifiesForRegularFeat && hasSlotRegularFeat;
          optRegular.textContent = isRegFull ? '🎖️ Regular Feat (Slot Filled at This Level)' : '🎖️ Regular Feat';
        }
        if (optClass) {
          const isClassFull = qualifiesForClassBonus && hasSlotClassBonusFeat;
          optClass.textContent = isClassFull ? `⚔️ ${className} Bonus Feat (Slot Filled at This Level)` : `⚔️ ${className} Bonus Feat (Class Bonus Feat)`;
        }
        if (optRacial) {
          optRacial.textContent = hasRacialBonus ? '🧬 Human Bonus Feat (Slot Filled at This Level)' : '🧬 Human Bonus Feat (Racial Bonus)';
        }
        if (optFlawBonus) {
          optFlawBonus.textContent = unfilledFlawBonusCount > 0
            ? `🎖️ Flaw Bonus Feat (${unfilledFlawBonusCount} Open Slot${unfilledFlawBonusCount > 1 ? 's' : ''} Granted by Flaw)`
            : '🎖️ Flaw Bonus Feat (Granted by Flaw)';
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
            if (titleNoticeEl) titleNoticeEl.textContent = `Target Slot: ${contractLabel}`;
            if (descNoticeEl) descNoticeEl.textContent = contractDesc;
          } else if (preferredCategory === 'Regular Feat') {
            banner.className = 'p-2.5 rounded-xl border border-purple-500/70 bg-purple-950/70 text-xs flex items-center justify-between gap-2 shadow-md transition';
            if (iconNoticeEl) iconNoticeEl.textContent = '🎖️';
            if (titleNoticeEl) titleNoticeEl.textContent = `Target Slot: Standard Feat (Level ${lvlNum})`;
            if (descNoticeEl) descNoticeEl.textContent = `Standard character feat slot gained via D&D 3.5e RAW level progression (Levels 1, 3, 6, 9, 12, 15, 18).`;
          } else if (preferredCategory === 'Racial Trait') {
            banner.className = 'p-2.5 rounded-xl border border-teal-500/70 bg-teal-950/70 text-xs flex items-center justify-between gap-2 shadow-md transition';
            if (iconNoticeEl) iconNoticeEl.textContent = '🧬';
            if (titleNoticeEl) titleNoticeEl.textContent = `Target Slot: Human Racial Bonus Feat`;
            if (descNoticeEl) descNoticeEl.textContent = `Bonus feat slot granted to Humans at 1st level (any feat for which you meet the prerequisites).`;
          } else if (preferredCategory === 'Flaw Bonus Feat') {
            banner.className = 'p-2.5 rounded-xl border border-emerald-500/70 bg-emerald-950/70 text-xs flex items-center justify-between gap-2 shadow-md transition';
            if (iconNoticeEl) iconNoticeEl.textContent = '🎖️';
            if (titleNoticeEl) titleNoticeEl.textContent = `Target Slot: Flaw Bonus Feat (Unearthed Arcana p. 91)`;
            if (descNoticeEl) descNoticeEl.textContent = `Bonus feat slot granted by taking a Character Flaw at 1st level (select any feat for which you meet the prerequisites).`;
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
          // Extra Feat / Free Addition Mode (from ➕ button or unlocked)
          banner.className = 'p-2.5 rounded-xl border border-emerald-500/60 bg-emerald-950/50 text-xs flex items-center justify-between gap-2 shadow-sm transition';
          if (iconNoticeEl) iconNoticeEl.textContent = '➕';
          if (titleNoticeEl) titleNoticeEl.textContent = `Extra Feat / Bonus Addition (Level ${lvlNum} — Unselected Slots Preserved)`;
          if (descNoticeEl) descNoticeEl.textContent = 'Adds a separate feat, boon, flaw, or ability to this level without consuming any unselected level feat slots.';
          if (unlockBtn) unlockBtn.classList.add('hidden');
        }
      }

      // Initial filter based on preferredCategory (default to QUALIFIED for Regular, Human Bonus & Flaw Bonus Feats)
      if (preferredCategory === 'Class Bonus Feat') {
        quickFeatSearchFilter = 'FIGHTER';
      } else if (preferredCategory === 'DM Boon') {
        quickFeatSearchFilter = 'BOON';
      } else if (preferredCategory === 'Flaw') {
        quickFeatSearchFilter = 'FLAW';
      } else if (preferredCategory === 'Warlock Invocation') {
        quickFeatSearchFilter = 'INVOCATION';
      } else if (preferredCategory === 'Regular Feat' || preferredCategory === 'Racial Trait' || preferredCategory === 'Flaw Bonus Feat') {
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
      if (toggleText) toggleText.textContent = 'Close ▲';
      renderQuickFeatSearchResults();
    }

    function closeQuickFeatCatalogConsole() {
      isQuickFeatCatalogOpen = false;
      const consoleEl = document.getElementById('quick-feat-search-console');
      if (consoleEl) consoleEl.classList.add('hidden');
      const toggleText = document.getElementById('quick-feat-catalog-toggle-text');
      if (toggleText) toggleText.textContent = 'Catalog ▼';
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

      // Warlock Invocations are ONLY allowed when the slot is explicitly 'Warlock Invocation' or 'DM Boon' (NEVER in Regular Feat, Human Bonus Feat / Racial Trait, Flaw Bonus Feat, or Class Bonus Feat)
      let invocationsList = [];
      const isStandardFeatSlot = ['Regular Feat', 'Racial Trait', 'Flaw Bonus Feat', 'Class Bonus Feat', 'Flaw'].includes(categoryVal);
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
        invocationsList = (typeof getAllWarlockInvocations === 'function' ? getAllWarlockInvocations() : []).filter(inv => {
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
        baseList = (activeFilter === 'BOON') ? combined.filter(isBoonFeat) : combined;
      } else if (categoryVal === 'Flaw') {
        baseList = combined.filter(isFlawFeat);
      } else if (categoryVal === 'Flaw Bonus Feat') {
        baseList = (activeFilter === 'FLAW') ? combined.filter(isFlawFeat) : combined.filter(f => !isFlawFeat(f));
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

      // If the user is typing a DM Boon / Skill or Stat Grant (e.g. "dm boon ride +4", "boon, skill: +ride"), synthesize an instant V2 option at the top of the Spotlight list
      const liveSynthBoon = query ? synthesizeDmBoonFromQuery(query, '', categoryVal) : null;
      if (liveSynthBoon && !evaluatedItems.some(e => (e.item.name || '').toLowerCase() === liveSynthBoon.name.toLowerCase())) {
        evaluatedItems.unshift({
          item: liveSynthBoon,
          pEval: {
            allMet: true,
            hasPrereqs: false,
            rawPrereq: '-',
            checks: [],
            isAlreadyKnownFromClass: false,
            isAlreadyTaken: false
          }
        });
      }

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
                       title="${(pEval.alreadyKnownReason || 'Already Owned').replace(/"/g, '&quot;')}"
                       class="px-2.5 py-1 rounded text-[11px] font-bold shadow shrink-0 opacity-50 cursor-not-allowed bg-slate-800 text-slate-400 flex items-center gap-1">
                 <span>🔒</span>
                 <span>Already Owned</span>
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
              ⚠️ Flaws (${countFlaw})
            </button>
            ${invocationsList.length > 0 ? `
              <button type="button" onclick="setQuickFeatSearchFilter('INVOCATION')" class="${filterPillClass('INVOCATION')}">
                🔮 Invocation (${countInvocation})
              </button>
            ` : ''}
          </div>
          <button type="button" onclick="closeQuickFeatCatalogConsole()" class="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition font-bold cursor-pointer">
            ▲ Close
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
            desc: pEvalPre.alreadyKnownReason || `You already possess the "${featName}" feat.`,
            type: 'warning'
          });
        } else {
          console.warn(pEvalPre.alreadyKnownReason || `You already possess the "${featName}" feat.`);
        }
        return;
      }
      const catalog = getCombinedFeatCatalog();
      let found = catalog.find(f => f.name.toLowerCase() === featName.toLowerCase() || f.name.toLowerCase() === featName.toLowerCase().replace(/\(.*?\)/g, '').trim());
      if (!found) {
        const synthMatch = synthesizeDmBoonFromQuery(featName, '', document.getElementById('quick-feat-category')?.value || '');
        if (synthMatch) {
          found = synthMatch;
          window._lastQuickFeatAiV2Entry = synthMatch;
          featName = synthMatch.name;
        }
      }

      if (!found && typeof getAllWarlockInvocations === 'function') {
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
      if (catSel) {
        // If locked to a specific target slot, preserve target category so it fills the right slot!
        if ((found && isFlawFeat(found)) || CANONICAL_UA_FLAW_NAMES.has(String(featName || '').toLowerCase().trim())) {
          // A Flaw must NEVER consume a Regular Feat, Human Bonus Feat, or Class Bonus Feat slot!
          catSel.value = 'Flaw';
        } else if (!isQuickFeatTargetLocked && found) {
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
        const spotlightInput = document.getElementById('quick-feat-target-spotlight-input');
        if (spotlightInput) {
          setTimeout(() => {
            spotlightInput.focus();
            spotlightInput.select();
          }, 60);
        } else {
          const targetSelect = document.getElementById('quick-feat-target-select');
          if (targetSelect) targetSelect.focus();
        }
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

      if (!found && typeof getAllWarlockInvocations === 'function') {
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

      // Standardize name formatting (case, punctuation, DM Boon syntax) before saving
      const initialCatHint = document.getElementById('quick-feat-category')?.value || 'Regular Feat';
      const initialBenefitHint = document.getElementById('quick-feat-benefit')?.value.trim() || '';
      const preSynthesizedBoon = synthesizeDmBoonFromQuery(featName, initialBenefitHint, initialCatHint);
      if (preSynthesizedBoon && preSynthesizedBoon.name) {
        featName = preSynthesizedBoon.name;
        window._lastQuickFeatAiV2Entry = preSynthesizedBoon;
      } else if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.standardizeName === 'function') {
        const exactCat = getCombinedFeatCatalog(true).find(f => (f.name || '').toLowerCase().trim() === featName.toLowerCase().trim());
        if (exactCat && exactCat.name) {
          featName = exactCat.name;
        } else {
          featName = RuleMaster.standardizeName(featName, initialCatHint);
        }
      }
      if (nameInput) nameInput.value = featName;

      // Defensive RAW duplicate check
      const pEvalConfirm = (typeof checkFeatPrerequisites === 'function')
        ? checkFeatPrerequisites({ name: featName }, 0, activeQuickLevelIndex)
        : null;
      if (pEvalConfirm && pEvalConfirm.isAlreadyTaken) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Duplicate Feat Blocked',
            desc: pEvalConfirm.alreadyKnownReason || `You already possess the "${featName}" feat.`,
            type: 'warning'
          });
        } else {
          console.warn(pEvalConfirm.alreadyKnownReason || `You already possess the "${featName}" feat.`);
        }
        return;
      }

      let category = document.getElementById('quick-feat-category')?.value || 'Regular Feat';
      const benefit = document.getElementById('quick-feat-benefit')?.value.trim() || '';

      const catalogMatch = getCombinedFeatCatalog(true).find(f => (f.name || '').toLowerCase().trim() === featName.toLowerCase().trim());
      if ((catalogMatch && isFlawFeat(catalogMatch)) || CANONICAL_UA_FLAW_NAMES.has(featName.toLowerCase().trim())) {
        category = 'Flaw';
      }

      if (category === 'Flaw') {
        // D&D 3.5e Unearthed Arcana p.91 RAW: Up to 2 Flaws max across character
        const totalFlaws = (character.levelProgression || []).reduce((acc, lRow) => {
          return acc + ((lRow && Array.isArray(lRow.feats)) ? lRow.feats.filter(f => isFlawFeatString(f)).length : 0);
        }, 0);
        if (totalFlaws >= 2) {
          if (typeof showDiceTopToast === 'function') {
            showDiceTopToast({
              icon: '⚠️',
              title: 'Maximum 2 Flaws Reached (3.5e RAW)',
              desc: 'Per Unearthed Arcana (p. 91), a character may select at most two Character Flaws.'
            });
          }
          return;
        }
      }

      const isInvEntry = (typeof getAllWarlockInvocations === 'function')
        ? getAllWarlockInvocations().some(i => (i.name || '').toLowerCase() === featName.toLowerCase())
        : false;
      if (isInvEntry && category !== 'Warlock Invocation' && category !== 'DM Boon') {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Warlock Invocation Restricted',
            desc: `"${featName}" is a Warlock Invocation and cannot be selected in a Human Bonus Feat, Standard Feat, Flaw Bonus Feat, or Class Bonus Feat slot.`,
            type: 'warning'
          });
        }
        return;
      }
      if (category !== 'DM Boon' && category !== 'Flaw' && pEvalConfirm && !pEvalConfirm.allMet) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Prerequisites Not Met',
            desc: `Prerequisites not met for "${featName}" (${pEvalConfirm.rawPrereq || 'Missing Prerequisite'}).`,
            type: 'warning'
          });
        }
        return;
      }

      const targetLvlIdx = activeQuickLevelIndex;
      const row = character.levelProgression[activeQuickLevelIndex];
      if (!Array.isArray(row.feats)) row.feats = [];
      if (!Array.isArray(row.specialAbilities)) row.specialAbilities = [];

      const isExtraAddition = !isQuickFeatTargetLocked || !activeQuickFeatTargetSlot;
      let prefix = '';
      if (category === 'Class Bonus Feat') prefix = isExtraAddition ? '⚔️ [Extra Bonus] ' : '⚔️ [Bonus] ';
      else if (category === 'DM Boon') prefix = '🌟 [DM Boon] ';
      else if (category === 'Flaw') prefix = '⚠️ [Flaw] ';
      else if (category === 'Flaw Bonus Feat') prefix = '🎖️ [Flaw Bonus] ';
      else if (category === 'Racial Trait') prefix = isExtraAddition ? '🧬 [Extra Racial] ' : '🧬 [Racial] ';
      else if (category === 'Special Ability') prefix = '✨ ';
      else if (category === 'Warlock Invocation') prefix = isExtraAddition ? '🔮 [Extra Invocation] ' : '🔮 [Invocation] ';
      else prefix = isExtraAddition ? '🎖️ [Extra] ' : '🎖️ ';

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
        // If adding a Flaw, remove any stale regular-feat tag for the same flaw at this level
        if (category === 'Flaw') {
          row.feats = row.feats.filter(fStr => {
            const raw = String(fStr || '').replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
            return raw !== featName.toLowerCase().trim();
          });
        }
        row.feats.push(formattedName);
        if (!Array.isArray(character.feats)) character.feats = [];
        const existingIdx = character.feats.findIndex(f => (typeof f === 'string' ? f : f.name).toLowerCase().trim() === featName.toLowerCase().trim());
        const synthesizedBoon = synthesizeDmBoonFromQuery(featName, benefit, category);
        const aiCached = (window._lastQuickFeatAiV2Entry && (window._lastQuickFeatAiV2Entry.name || '').toLowerCase().trim() === featName.toLowerCase().trim())
          ? window._lastQuickFeatAiV2Entry
          : null;
        const resolvedModifiers = (catalogMatch && Array.isArray(catalogMatch.modifiers) && catalogMatch.modifiers.length > 0)
          ? JSON.parse(JSON.stringify(catalogMatch.modifiers))
          : (aiCached && Array.isArray(aiCached.modifiers) && aiCached.modifiers.length > 0
              ? JSON.parse(JSON.stringify(aiCached.modifiers))
              : (synthesizedBoon && Array.isArray(synthesizedBoon.modifiers) ? JSON.parse(JSON.stringify(synthesizedBoon.modifiers)) : []));
        const resolvedDamageParts = (catalogMatch && Array.isArray(catalogMatch.damageParts) && catalogMatch.damageParts.length > 0)
          ? JSON.parse(JSON.stringify(catalogMatch.damageParts))
          : (aiCached && Array.isArray(aiCached.damageParts) ? JSON.parse(JSON.stringify(aiCached.damageParts)) : []);
        const resolvedTacticalBadges = (catalogMatch && Array.isArray(catalogMatch.tacticalBadges) && catalogMatch.tacticalBadges.length > 0)
          ? JSON.parse(JSON.stringify(catalogMatch.tacticalBadges))
          : (aiCached && Array.isArray(aiCached.tacticalBadges) ? JSON.parse(JSON.stringify(aiCached.tacticalBadges)) : []);
        const featEntryPayload = {
          ...(catalogMatch ? {
            id: catalogMatch.id,
            ruleFlags: catalogMatch.ruleFlags ? JSON.parse(JSON.stringify(catalogMatch.ruleFlags)) : undefined,
            slotDiff: catalogMatch.slotDiff
          } : (aiCached ? {
            id: aiCached.id,
            ruleFlags: aiCached.ruleFlags ? JSON.parse(JSON.stringify(aiCached.ruleFlags)) : undefined
          } : {})),
          modifiers: resolvedModifiers,
          damageParts: resolvedDamageParts,
          tacticalBadges: resolvedTacticalBadges,
          name: featName,
          type: category === 'Flaw' ? 'Flaw' : 'Feat',
          category: category,
          benefit: benefit || (catalogMatch ? catalogMatch.benefit : (synthesizedBoon ? synthesizedBoon.benefit : '')),
          source: category === 'Flaw'
            ? (catalogMatch?.source || 'Unearthed Arcana, page 91')
            : (category === 'Flaw Bonus Feat' ? `Level ${row.level} (Flaw Bonus Feat)` : (category === 'DM Boon' ? `Level ${row.level} (DM Boon)` : `Level ${row.level} (${row.className})`))
        };
        if (existingIdx === -1) {
          character.feats.push(featEntryPayload);
          if (featName.toLowerCase() === 'toughness' && character.hp) {
            if (character.hp.baseMax === undefined) character.hp.baseMax = (Number(character.hp.max) || 44) - (Number(character.hp.conBonusHp) || 0);
            character.hp.baseMax = (Number(character.hp.baseMax) || 0) + 3;
            character.hp.max = (Number(character.hp.baseMax) || 0) + (Number(character.hp.conBonusHp) || 0);
            character.hp.current = (Number(character.hp.current) || 0) + 3;
          }
        } else if (typeof character.feats[existingIdx] === 'object') {
          character.feats[existingIdx] = { ...character.feats[existingIdx], ...featEntryPayload };
        }
      }

      if (Array.isArray(masterDb)) {
        const clean = featName.toLowerCase().trim();
        const synthesizedBoonDb = synthesizeDmBoonFromQuery(featName, benefit, category);
        const aiCachedDb = (window._lastQuickFeatAiV2Entry && (window._lastQuickFeatAiV2Entry.name || '').toLowerCase().trim() === clean)
          ? window._lastQuickFeatAiV2Entry
          : null;
        const dbModifiers = (aiCachedDb && Array.isArray(aiCachedDb.modifiers) && aiCachedDb.modifiers.length > 0)
          ? aiCachedDb.modifiers
          : (synthesizedBoonDb && Array.isArray(synthesizedBoonDb.modifiers) ? synthesizedBoonDb.modifiers : []);
        const existingDbIdx = masterDb.findIndex(m => m && (m.name || '').toLowerCase().trim() === clean);
        if (existingDbIdx >= 0) {
          if (dbModifiers.length > 0 && (!Array.isArray(masterDb[existingDbIdx].modifiers) || masterDb[existingDbIdx].modifiers.length === 0)) {
            masterDb[existingDbIdx].modifiers = dbModifiers;
          }
          if (benefit) {
            masterDb[existingDbIdx].benefit = benefit;
            masterDb[existingDbIdx].description = benefit;
          }
        } else {
          const inCanonical = getCombinedFeatCatalog(true).some(f => (f.name || '').toLowerCase().trim() === clean);
          if (!inCanonical) {
            masterDb.push({
              schemaVersion: 2,
              id: 'feat_' + clean.replace(/[^a-z0-9]+/g, '_'),
              name: featName,
              type: (category === 'Special Ability') ? 'Special Ability' : (category === 'Flaw' ? 'Flaw' : 'Feat'),
              category: category,
              slot: 'None',
              slotDiff: category === 'Flaw' ? 1 : 0,
              prereq: (pEvalConfirm && pEvalConfirm.rawPrereq) ? pEvalConfirm.rawPrereq : '-',
              source: category === 'DM Boon' ? `Level ${row.level} (DM Boon)` : `Level ${row.level} (${row.className})`,
              benefit: benefit || (synthesizedBoonDb ? synthesizedBoonDb.benefit : ''),
              description: benefit || (synthesizedBoonDb ? synthesizedBoonDb.benefit : ''),
              modifiers: dbModifiers,
              damageParts: []
            });
          }
        }
      }

      closeQuickLevelFeatModal();
      recalculateCharacterClassSummary();
      saveStateToStorage(true);
      renderLevelProgression();
      renderAll();

      // D&D 3.5e RAW (Unearthed Arcana p.91): Selecting a Flaw immediately grants +1 Bonus Feat!
      if (category === 'Flaw') {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            icon: '🎖️',
            title: `Flaw Taken: ${featName} (+1 Bonus Feat Unlocked)`,
            desc: 'Per D&D 3.5e Unearthed Arcana (p. 91), select your bonus feat now!'
          });
        }
        setTimeout(() => {
          openQuickFeatPickerForLevel(targetLvlIdx, 'Flaw Bonus Feat', true);
        }, 120);
      }
    }

    function synthesizeDmBoonFromQuery(queryStr, benefitStr = '', categoryHint = '') {
      const q = String(queryStr || '').trim();
      const b = String(benefitStr || '').trim();
      if (!q && !b) return null;

      const isExplicitBoon = categoryHint === 'DM Boon' || /\b(dm\s*boon|boon|grant)\b/i.test(q) || /\bskill\s*:/i.test(q) || /^[+-]\d+\s+[a-z]/i.test(q);
      if (!isExplicitBoon) return null;

      const combined = `${q} ${b}`;
      const numMatch = q.match(/([+-]?\d+)/) || b.match(/([+-]?\d+)/);
      const val = numMatch ? (parseInt(numMatch[1], 10) || 4) : 4;
      const signStr = val >= 0 ? `+${val}` : `${val}`;

      const skillList = [
        { slug: 'appraise', label: 'Appraise', rx: /\bappraise\b/i },
        { slug: 'balance', label: 'Balance', rx: /\bbalance\b/i },
        { slug: 'bluff', label: 'Bluff', rx: /\bbluff\b/i },
        { slug: 'climb', label: 'Climb', rx: /\bclimb\b/i },
        { slug: 'concentration', label: 'Concentration', rx: /\bconcentration\b/i },
        { slug: 'decipher_script', label: 'Decipher Script', rx: /\bdecipher\s*script\b/i },
        { slug: 'diplomacy', label: 'Diplomacy', rx: /\bdiplomacy\b/i },
        { slug: 'disable_device', label: 'Disable Device', rx: /\bdisable\s*device\b/i },
        { slug: 'disguise', label: 'Disguise', rx: /\bdisguise\b/i },
        { slug: 'escape_artist', label: 'Escape Artist', rx: /\bescape\s*artist\b/i },
        { slug: 'forgery', label: 'Forgery', rx: /\bforgery\b/i },
        { slug: 'gather_information', label: 'Gather Information', rx: /\bgather\s*info(rmation)?\b/i },
        { slug: 'handle_animal', label: 'Handle Animal', rx: /\bhandle\s*animal\b/i },
        { slug: 'heal', label: 'Heal', rx: /\bheal\b/i },
        { slug: 'hide', label: 'Hide', rx: /\bhide\b/i },
        { slug: 'intimidate', label: 'Intimidate', rx: /\bintimidate\b/i },
        { slug: 'jump', label: 'Jump', rx: /\bjump\b/i },
        { slug: 'knowledge', label: 'Knowledge', rx: /\bknowledge\b/i },
        { slug: 'listen', label: 'Listen', rx: /\blisten\b/i },
        { slug: 'move_silently', label: 'Move Silently', rx: /\bmove\s*silently\b/i },
        { slug: 'open_lock', label: 'Open Lock', rx: /\bopen\s*lock\b/i },
        { slug: 'ride', label: 'Ride', rx: /\bride\b/i },
        { slug: 'search', label: 'Search', rx: /\bsearch\b/i },
        { slug: 'sense_motive', label: 'Sense Motive', rx: /\bsense\s*motive\b/i },
        { slug: 'sleight_of_hand', label: 'Sleight of Hand', rx: /\bsleight\s*of\s*hand\b/i },
        { slug: 'spellcraft', label: 'Spellcraft', rx: /\bspellcraft\b/i },
        { slug: 'spot', label: 'Spot', rx: /\bspot\b/i },
        { slug: 'survival', label: 'Survival', rx: /\bsurvival\b/i },
        { slug: 'swim', label: 'Swim', rx: /\bswim\b/i },
        { slug: 'tumble', label: 'Tumble', rx: /\btumble\b/i },
        { slug: 'use_magic_device', label: 'Use Magic Device', rx: /\b(use\s*magic\s*device|umd)\b/i },
        { slug: 'use_rope', label: 'Use Rope', rx: /\buse\s*rope\b/i }
      ];

      for (const sk of skillList) {
        if (sk.rx.test(combined)) {
          return {
            schemaVersion: 2,
            id: `boon_skill_${sk.slug}_${Math.abs(val)}`,
            name: `DM Boon: ${sk.label} (${signStr})`,
            type: 'Feat',
            category: 'DM Boon',
            prereq: '-',
            source: 'DM Boon / Campaign Grant',
            benefit: b || `Grants a ${signStr} bonus on ${sk.label} skill checks (DM Boon).`,
            description: b || `Grants a ${signStr} bonus on ${sk.label} skill checks (DM Boon).`,
            modifiers: [{ target: `skill.${sk.slug}`, value: val, type: 'untyped', condition: null }],
            damageParts: []
          };
        }
      }

      const statMap = [
        { target: 'ability.str', label: 'Strength', rx: /\b(str|strength)\b/i },
        { target: 'ability.dex', label: 'Dexterity', rx: /\b(dex|dexterity)\b/i },
        { target: 'ability.con', label: 'Constitution', rx: /\b(con|constitution)\b/i },
        { target: 'ability.int', label: 'Intelligence', rx: /\b(int|intelligence)\b/i },
        { target: 'ability.wis', label: 'Wisdom', rx: /\b(wis|wisdom)\b/i },
        { target: 'ability.cha', label: 'Charisma', rx: /\b(cha|charisma)\b/i },
        { target: 'save.fort', label: 'Fortitude Save', rx: /\bfort(itude)?\b/i },
        { target: 'save.ref', label: 'Reflex Save', rx: /\bref(lex)?\b/i },
        { target: 'save.will', label: 'Will Save', rx: /\bwill(\s*save)?\b/i },
        { target: 'save.all', label: 'All Saving Throws', rx: /\ball\s*saves\b/i },
        { target: 'initiative', label: 'Initiative', rx: /\binit(iative)?\b/i },
        { target: 'ac.natural', label: 'Natural Armor AC', rx: /\bnatural\s*armor\b/i },
        { target: 'ac.deflection', label: 'Deflection AC', rx: /\bdeflection\b/i },
        { target: 'ac', label: 'Armor Class (AC)', rx: /\b(armor\s*class|ac)\b/i },
        { target: 'attack.all', label: 'Attack Rolls', rx: /\battack(\s*rolls?)?\b/i },
        { target: 'damage.all', label: 'Weapon Damage', rx: /\bdamage(\s*rolls?)?\b/i },
        { target: 'hp', label: 'Hit Points (HP)', rx: /\b(hit\s*points|hp)\b/i },
        { target: 'casterLevel', label: 'Caster Level (CL)', rx: /\b(caster\s*level|cl)\b/i }
      ];
      for (const st of statMap) {
        if (st.rx.test(combined) && !/=/.test(q)) {
          return {
            schemaVersion: 2,
            id: `boon_${st.target.replace(/\./g, '_')}_${Math.abs(val)}`,
            name: `DM Boon: ${st.label} (${signStr})`,
            type: 'Feat',
            category: 'DM Boon',
            prereq: '-',
            source: 'DM Boon / Campaign Grant',
            benefit: b || `Grants a ${signStr} bonus to ${st.label} (DM Boon).`,
            description: b || `Grants a ${signStr} bonus to ${st.label} (DM Boon).`,
            modifiers: [{ target: st.target, value: val, type: 'untyped', condition: null }],
            damageParts: []
          };
        }
      }

      return null;
    }
    window.synthesizeDmBoonFromQuery = synthesizeDmBoonFromQuery;

    function findInLocalCatalogsOrMasterDb(query) {
      if (!query) return null;
      const qLower = query.toLowerCase().trim();
      // Do not fuzzy-hijack explicit DM Boon / skill grant queries with unrelated catalog entries
      if (/\b(dm\s*boon|boon|grant)\b/i.test(qLower) || /\bskill\s*:/i.test(qLower) || /^[+-]\d+\s+[a-z]/i.test(qLower)) {
        if (Array.isArray(masterDb)) {
          const exactBoon = masterDb.find(item => (item.name || '').toLowerCase().trim() === qLower);
          if (exactBoon) {
            return {
              ...exactBoon,
              name: exactBoon.name,
              category: exactBoon.category || 'DM Boon',
              benefit: exactBoon.benefit || exactBoon.description || '',
              source: exactBoon.source || 'DM Boon'
            };
          }
        }
        return null;
      }

      if (typeof RuleMaster !== 'undefined' && RuleMaster.canonicalDictionary) {
        let cleanKey = qLower;
        if (typeof RuleMaster.canonicalDictionary[cleanKey] === 'string') {
          cleanKey = RuleMaster.canonicalDictionary[cleanKey];
        }
        const entry = RuleMaster.canonicalDictionary[cleanKey];
        if (entry && typeof entry === 'object') {
          return {
            ...entry,
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
            ...m,
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
            ...f,
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

      // 0. Check if query is a direct DM Boon / Skill or Stat Grant (e.g. "boon, skill: +ride" or "dm boon ride +4")
      const instantBoon = synthesizeDmBoonFromQuery(query, benefitInput?.value || '', catSel?.value || '');
      if (instantBoon) {
        window._lastQuickFeatAiV2Entry = instantBoon;
        if (nameInput) nameInput.value = instantBoon.name;
        if (benefitInput) benefitInput.value = instantBoon.benefit;
        if (catSel) catSel.value = 'DM Boon';
        quickFeatSearchQuery = instantBoon.name;
        updateQuickFeatTargetSelector(instantBoon.name);
        updateQuickFeatPrereqBadge();
        renderQuickFeatSearchResults();
        const refreshedStatusEl = document.getElementById('quick-feat-ai-status') || statusEl;
        if (refreshedStatusEl) {
          const modSummary = (instantBoon.modifiers || []).map(m => `${m.target} ${m.value >= 0 ? '+' : ''}${m.value}`).join(', ');
          refreshedStatusEl.className = 'mt-1.5 text-[11px] p-2 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 block';
          refreshedStatusEl.innerHTML = `<span>🌟</span> Standardized &amp; Synthesized Canonical V2 DM Boon: <b>${instantBoon.name}</b> <span class="font-mono text-amber-300">[${modSummary}]</span>`;
        }
        return;
      }

      // 1. Önce yerel veritabanları ve katalogları kontrol et
      const localMatch = findInLocalCatalogsOrMasterDb(query);
      if (localMatch) {
        window._lastQuickFeatAiV2Entry = localMatch;
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
        const selectedCat = catSel?.value || 'Regular Feat';
        const categoryHint = selectedCat === 'Special Ability'
          ? 'Special Ability'
          : (selectedCat === 'DM Boon' || /\b(boon|grant)\b/i.test(query)
              ? 'DM Boon'
              : (selectedCat === 'Flaw' ? 'Flaw' : (selectedCat === 'Racial Trait' ? 'Racial Trait' : 'Feat')));
        const statusProxy = {
          set textContent(val) {
            if (statusEl) statusEl.innerHTML = `<span>⏳</span> <span>${val}</span>`;
          }
        };
        const rows = await RuleMaster.fetchSingleAiRuleRows(query, categoryHint, apiKey, statusProxy);
        if (rows && rows.length > 0) {
          const rawTop = rows[0];
          const v2Entry = (typeof RuleMaster !== 'undefined' && typeof RuleMaster.ensureV2 === 'function')
            ? RuleMaster.ensureV2(Array.isArray(rawTop) ? RuleMaster.normalizeEntry(rawTop, true) : rawTop)
            : rawTop;
          const rawFeatName = (Array.isArray(rawTop) ? rawTop[0] : v2Entry?.name) || query;
          const featName = (typeof RuleMaster !== 'undefined' && typeof RuleMaster.standardizeName === 'function')
            ? RuleMaster.standardizeName(rawFeatName, categoryHint)
            : rawFeatName;
          const featType = (Array.isArray(rawTop) ? rawTop[1] : v2Entry?.type) || 'Feat';
          const featPrereq = (Array.isArray(rawTop) ? rawTop[2] : v2Entry?.prereq) || '-';
          const featSource = (Array.isArray(rawTop) ? rawTop[4] : v2Entry?.source) || 'D&D 3.5e';
          const featBenefit = (Array.isArray(rawTop) ? rawTop[5] : (v2Entry?.benefit || v2Entry?.description)) || '';

          window._lastQuickFeatAiV2Entry = v2Entry && typeof v2Entry === 'object' ? { ...v2Entry, name: featName, benefit: featBenefit } : null;

          if (nameInput) nameInput.value = featName;
          if (benefitInput) benefitInput.value = featBenefit;
          if (catSel) {
            if (categoryHint === 'DM Boon' || /dm\s*boon/i.test(featName) || /dm\s*boon/i.test(featSource)) {
              catSel.value = 'DM Boon';
            } else if (featType === 'Special Ability' || categoryHint === 'Special Ability') {
              catSel.value = 'Special Ability';
            } else if (catSel.value !== 'Class Bonus Feat' && catSel.value !== 'DM Boon' && catSel.value !== 'Flaw') {
              catSel.value = 'Regular Feat';
            }
          }

          if (Array.isArray(masterDb)) {
            const clean = featName.toLowerCase().trim();
            if (!masterDb.some(m => (m.name || '').toLowerCase().trim() === clean)) {
              masterDb.push(v2Entry && typeof v2Entry === 'object' && !Array.isArray(v2Entry) ? {
                ...v2Entry,
                schemaVersion: 2,
                name: featName,
                type: featType,
                slot: v2Entry.slot || 'None',
                prereq: featPrereq,
                source: featSource,
                benefit: featBenefit,
                description: v2Entry.description || featBenefit
              } : {
                schemaVersion: 2,
                id: 'feat_' + clean.replace(/[^a-z0-9]+/g, '_'),
                name: featName,
                type: featType,
                slot: 'None',
                prereq: featPrereq,
                source: featSource,
                benefit: featBenefit,
                description: featBenefit,
                modifiers: [],
                damageParts: [],
                modes: []
              });
              saveStateToStorage();
            }
          }

          quickFeatSearchQuery = featName;
          updateQuickFeatTargetSelector(featName);
          updateQuickFeatPrereqBadge();
          renderQuickFeatSearchResults();

          const refreshedStatusEl = document.getElementById('quick-feat-ai-status') || statusEl;
          if (refreshedStatusEl) {
            refreshedStatusEl.className = 'mt-1.5 text-[11px] p-2 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 block';
            refreshedStatusEl.innerHTML = `<span>✨</span> Standardized &amp; Fetched <b>${featName}</b> [${featSource}] via Rule Master AI!`;
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
          statusEl.innerHTML = `<span>⚠️</span> Error: ${err.message || err}`;
        }
      }
    }
    // Official D&D 3.5e Base & Prestige Classes are hydrated from database/srd_classes_races.json via SrdCompendium
    const DND35_EXTRA_CLASSES = {};

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

      // 1. Mevcut tanımlı sınıfları kontrol et (Exact, Multi-Token veya Fuzzy)
      const allDefs = getAvailableClassDefs();
      const matchedKey = Object.keys(allDefs).find(k => k.toLowerCase() === qLower)
        || Object.keys(allDefs).find(k => matchesClassSearchQuery(k, allDefs[k], qLower));

      if (matchedKey) {
        populateChangeClassSelect(matchedKey);
        onChangeClassSelectChange();
        if (typeof filterChangeClassSearch === 'function') filterChangeClassSearch();
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
        if (typeof filterChangeClassSearch === 'function') filterChangeClassSearch();

        const babDisplay = foundExtra.bab === 1.0 ? 'Full BAB (+1/lvl)' : (foundExtra.bab === 0.75 ? '3/4 BAB (+0.75/lvl)' : '1/2 BAB (+0.5/lvl)');
        if (statusEl) {
          statusEl.className = 'text-[11px] p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 block';
          statusEl.innerHTML = `<span>✨</span> Added and selected <b>${extraName}</b> from D&D 3.5e compendium! (HD: d${foundExtra.hd} • ${babDisplay} • Source: ${foundExtra.source})`;
        }
        return;
      }

      // 3. Rule Master (AI / Gemini) ile resmi 3.5e kitaplarından ve Unearthed Arcana varyantlarından getir
      const apiKey = (typeof RuleMaster !== 'undefined' && RuleMaster.getApiKey)
        ? RuleMaster.getApiKey()
        : (localStorage.getItem('gemini_api_key') || '');

      if (apiKey && typeof RuleMaster !== 'undefined' && typeof RuleMaster.getAvailableGeminiModels === 'function') {
        try {
          const availableModels = await RuleMaster.getAvailableGeminiModels(apiKey);
          const prompt = `You are a D&D 3.5e RAW & Variant Class expert and database builder.
D&D 3.5E RAW + UNEARTHED ARCANA VARIANTS + SPLATBOOKS + ACFs:
- Consult official D&D 3.5e publications (PHB I & II, DMG, Complete Series, Tome of Battle, Unearthed Arcana Variant Classes p.47-70 such as "Rogue (Adventurer Variant)" / Martial Feat Rogue which trades Sneak Attack at levels 1, 3, 5..19 for Fighter Bonus Feats, "Fighter (Thug Variant)", "Cleric (Cloistered Cleric)", "Wizard (Domain Wizard)", "Ranger (Urban Ranger)", "Barbarian (Whirling Frenzy)", Dragon Magazine Compendium, Racial Substitution Levels).
- Correct typos and comma-separated variant queries automatically (e.g. "rogue, Adventuerer" -> "Rogue (Adventurer Variant)").
- NEVER output placeholder names like "Non-Existent Class" or "Unknown".

User wants to add this D&D 3.5e class or class variant: "${query}".
Output ONLY a single valid JSON object strictly matching this schema:
{
  "name": "Canonical Class or Variant Name (e.g. Rogue (Adventurer Variant))",
  "type": "Base Class" or "Prestige Class",
  "maxLevel": 20,
  "hd": 6, // integer: 4, 6, 8, 10, or 12
  "bab": 0.75, // float: 1.0 (Full BAB: +1/lvl), 0.75 (Average: 3/4), or 0.5 (Poor: 1/2)
  "fort": "poor", // "good" or "poor"
  "ref": "good", // "good" or "poor"
  "will": "poor", // "good" or "poor"
  "skills": 8, // integer: 2, 4, 6, or 8 (base skill points per level)
  "source": "Book Name and page (e.g. Unearthed Arcana p.58, Complete Warrior p.10)",
  "role": "Role summary in English",
  "bonusFeatLevels": [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
  "featuresSummary": "Key features e.g. Trapfinding, Evasion, Fighter Bonus Feats (in place of Sneak Attack)"
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
                const cName = (parsed?.name || '').trim();
                if (!cName || /^(null|none|unknown|non-existent|nonexistent|invalid|n\/a)/i.test(cName)) {
                  break;
                }
                const newClassDef = {
                  name: cName,
                  type: (parsed.type || '').toLowerCase().includes('prestige') ? 'Prestige Class' : 'Base Class',
                  maxLevel: Number(parsed.maxLevel) || 20,
                  hd: Number(parsed.hd) || 8,
                  bab: Number(parsed.bab) || 0.75,
                  fort: parsed.fort === 'good' ? 'good' : 'poor',
                  ref: parsed.ref === 'good' ? 'good' : 'poor',
                  will: parsed.will === 'good' ? 'good' : 'poor',
                  skills: Number(parsed.skills) || 2,
                  source: parsed.source || 'Rule Master AI',
                  role: parsed.role || '',
                  bonusFeatLevels: Array.isArray(parsed.bonusFeatLevels) ? parsed.bonusFeatLevels : [],
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
                    const summaryText = parsed.featuresSummary || `${cName} (${newClassDef.source})`;
                    masterDb.push({
                      schemaVersion: 2,
                      id: 'cls_' + cName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
                      name: cName,
                      type: 'Class',
                      category: 'Class',
                      slot: 'None',
                      hd: newClassDef.hd,
                      bab: newClassDef.bab,
                      fort: newClassDef.fort,
                      ref: newClassDef.ref,
                      will: newClassDef.will,
                      skills: newClassDef.skills,
                      source: newClassDef.source,
                      benefit: summaryText,
                      description: summaryText,
                      desc: summaryText,
                      modifiers: [],
                      damageParts: [],
                      modes: []
                    });
                  }
                }

                syncCustomClassesToRuleEngine();
                saveStateToStorage(true);
                populateChangeClassSelect(cName);
                onChangeClassSelectChange();

                const babDisplay = newClassDef.bab === 1.0 ? 'Full BAB (+1/lvl)' : (newClassDef.bab === 0.75 ? '3/4 BAB (+0.75/lvl)' : '1/2 BAB (+0.5/lvl)');
                if (statusEl) {
                  statusEl.className = 'text-[11px] p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 block';
                  statusEl.innerHTML = `<span>✨</span> Fetched and added <b>${cName}</b> via Rule Master AI with D&D 3.5e RAW stats! (HD: d${newClassDef.hd} • ${babDisplay} • Source: ${newClassDef.source})`;
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
        let prospectiveBaseSaves = { fort: 0, ref: 0, will: 0 };
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
            prospectiveBaseSaves = calc?.baseSaves ?? { fort: Number(character.savingThrows?.fortitude?.base) || 0, ref: Number(character.savingThrows?.reflex?.base) || 0, will: Number(character.savingThrows?.will?.base) || 0 };
          } else {
            prospectiveBab = Number(character.bab) || 0;
            prospectiveBaseSaves = { fort: Number(character.savingThrows?.fortitude?.base) || 0, ref: Number(character.savingThrows?.reflex?.base) || 0, will: Number(character.savingThrows?.will?.base) || 0 };
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
            prospectiveBaseSaves = calc?.baseSaves ?? { fort: Number(character.savingThrows?.fortitude?.base) || 0, ref: Number(character.savingThrows?.reflex?.base) || 0, will: Number(character.savingThrows?.will?.base) || 0 };
          } else {
            prospectiveBab = Number(character.bab) || 0;
            prospectiveBaseSaves = { fort: Number(character.savingThrows?.fortitude?.base) || 0, ref: Number(character.savingThrows?.reflex?.base) || 0, will: Number(character.savingThrows?.will?.base) || 0 };
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

          // 0.a) 1st Level Only / Character Creation Flaw (e.g. "1st level only", "1st-level only", "first level only")
          if (/\b(?:1st|first)\s*-?\s*level\s*only\b/i.test(partLow) || (partLow === '1st level' && (resolvedFeat.category === 'Flaw' || resolvedFeat.type === 'Flaw'))) {
            met = (totalCharacterLevel === 1);
            info = met ? '(1st Level Character: Eligible)' : `(Current Level: ${totalCharacterLevel}, Req: 1st level only)`;
            if (!met) allMet = false;
            checks.push({ type: 'charLevel', label, met, info });
            continue;
          }

          // 0.b) Character Level Check: e.g. "Character level 6th", "Character level 21st"
          const charLvlMatch = part.match(/character\s*level\s*(\d+)/i);
          if (charLvlMatch) {
            const reqLvl = parseInt(charLvlMatch[1], 10);
            met = totalCharacterLevel >= reqLvl;
            info = met ? `(Level: ${totalCharacterLevel} ≥ ${reqLvl})` : `(Current: ${totalCharacterLevel}, Req: ${reqLvl})`;
            if (!met) allMet = false;
            checks.push({ type: 'charLevel', label, met, info });
            continue;
          }

          // 0.c) Base Saving Throw Bonus Check: e.g. "base Fortitude save bonus +0 or +1", "base Reflex save bonus +2"
          const saveMatch = part.match(/base\s*(fortitude|fort|reflex|ref|will)\s*(?:save)?\s*(?:bonus)?\s*\+?(\d+)(?:\s*or\s*\+?(\d+))?/i);
          if (saveMatch) {
            const saveType = saveMatch[1].toLowerCase().startsWith('fort') ? 'fort' : (saveMatch[1].toLowerCase().startsWith('ref') ? 'ref' : 'will');
            const saveName = saveType === 'fort' ? 'Fortitude' : (saveType === 'ref' ? 'Reflex' : 'Will');
            const curSave = prospectiveBaseSaves[saveType] ?? 0;
            const val1 = parseInt(saveMatch[2], 10);
            if (saveMatch[3] !== undefined) {
              const val2 = parseInt(saveMatch[3], 10);
              const minVal = Math.min(val1, val2);
              const isFrailFeat = Boolean(resolvedFeat.name && resolvedFeat.name.toLowerCase().includes('frail'));
              met = isFrailFeat ? true : (curSave >= minVal);
              info = met ? `(Base ${saveName}: +${curSave} ≥ +${minVal})` : `(Base ${saveName}: +${curSave}, Req: +${minVal})`;
            } else {
              met = curSave >= val1;
              info = met ? `(Base ${saveName}: +${curSave} ≥ +${val1})` : `(Base ${saveName}: +${curSave}, Req: +${val1})`;
            }
            if (!met) allMet = false;
            checks.push({ type: 'saveBonus', label, met, info });
            continue;
          }

          // 0.d) Total Ability Modifiers Check: e.g. "total ability modifiers +3 or lower"
          const totModMatch = part.match(/total\s*ability\s*modifiers?\s*\+?(-?\d+)\s*(?:or\s*(?:lower|less|below)|and\s*lower)/i);
          if (totModMatch) {
            const maxAllowed = parseInt(totModMatch[1], 10);
            const totalAbilityMods = ['str', 'dex', 'con', 'int', 'wis', 'cha'].reduce((acc, k) => acc + Math.floor(((abilities[k] || 10) - 10) / 2), 0);
            met = totalAbilityMods <= maxAllowed;
            info = met ? `(Total Modifiers: +${totalAbilityMods} ≤ +${maxAllowed})` : `(Total Modifiers: +${totalAbilityMods}, Max: +${maxAllowed})`;
            if (!met) allMet = false;
            checks.push({ type: 'totalAbilityMods', label, met, info });
            continue;
          }

          // 0.e) Base Land Speed Check: e.g. "base land speed at least 20 ft."
          const speedMatch = part.match(/(?:base\s*land\s*speed|speed)\s*(?:at\s*least)?\s*(\d+)\s*(?:ft|feet)?/i);
          if (speedMatch) {
            const reqSpeed = parseInt(speedMatch[1], 10);
            const curSpeed = Number(character.baseSpeed || character.speed?.base || character.speed?.land || character.speed || 30) || 30;
            met = curSpeed >= reqSpeed;
            info = met ? `(Speed: ${curSpeed} ft. ≥ ${reqSpeed} ft.)` : `(Current Speed: ${curSpeed} ft., Req: ${reqSpeed} ft.)`;
            if (!met) allMet = false;
            checks.push({ type: 'speed', label, met, info });
            continue;
          }

          // A) BAB Check: e.g. "BAB +1", "base attack bonus +6", "melee attack bonus +1"
          const babMatch = part.match(/(?:bab|base attack bonus|melee attack bonus)\s*\+?(\d+)/i);
          if (babMatch) {
            const reqBab = parseInt(babMatch[1], 10);
            met = prospectiveBab >= reqBab;
            info = met ? `(Current: +${prospectiveBab} ≥ +${reqBab})` : `(Current: +${prospectiveBab}, Req: +${reqBab})`;
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
            info = met ? `(Current: ${curScore} ≥ ${reqScore})` : `(Current: ${curScore}, Req: ${reqScore})`;
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
            info = met ? `(Ranks: ${curRanks} ≥ ${reqRanks})` : `(Current: ${curRanks}, Req: ${reqRanks})`;
            if (!met) allMet = false;
            checks.push({ type: 'skill', label, met, info });
            continue;
          }

          // D.1) Manifester Level / Psionic Check
          const mlMatch = part.match(/manifester\s*level\s*(\d+)/i);
          if (mlMatch) {
            const reqMl = parseInt(mlMatch[1], 10);
            met = isPsionic && effectiveManifesterLevel >= reqMl;
            info = met ? `(ML: ${effectiveManifesterLevel} ≥ ${reqMl})` : `(Psionic ML: ${effectiveManifesterLevel}, Req: ${reqMl})`;
            if (!met) allMet = false;
            checks.push({ type: 'psionic', label, met, info });
            continue;
          }
          if (partLow.includes('psionic ability') || partLow.includes('psionic focus') || partLow.includes('reserve of power points')) {
            met = isPsionic;
            info = met ? '(Psionic Character)' : '(No Psionic Ability / Wild Talent)';
            if (!met) allMet = false;
            checks.push({ type: 'psionic', label, met, info });
            continue;
          }

          // D.2) Spell-Like Ability (SLA) Check: e.g. "Spell-like ability at CL 6th or higher", "Spell-like ability"
          if (partLow.includes('spell-like ability')) {
            const slaClMatch = part.match(/(?:caster\s*level|cl)\s*(\d+)/i);
            const reqSlaCl = slaClMatch ? parseInt(slaClMatch[1], 10) : 1;
            met = hasSpellLikeAbility && slaCasterLevel >= reqSlaCl;
            info = met ? `(SLA CL: ${slaCasterLevel} ≥ ${reqSlaCl})` : '(Insufficient SLA / Warlock Level)';
            if (!met) allMet = false;
            checks.push({ type: 'sla', label, met, info });
            continue;
          }

          // D.3) Caster Level Check: e.g. "Caster level 3rd", "CL 5"
          const clMatch = part.match(/(?:caster\s*level|cl)\s*(\d+)/i);
          if (clMatch) {
            const reqCl = parseInt(clMatch[1], 10);
            met = isCaster && effectiveCasterLevel >= reqCl;
            info = met ? `(CL: ${effectiveCasterLevel} ≥ ${reqCl})` : `(Current CL: ${effectiveCasterLevel}, Req: ${reqCl})`;
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
            info = met ? `(${clsLvlMatch[1]} ${curClsLvl} ≥ ${reqLvl})` : `(Requires: ${clsLvlMatch[1]} Level ${reqLvl})`;
            if (!met) allMet = false;
            checks.push({ type: 'classLevel', label, met, info });
            continue;
          }

          // D.5) Warlock Invocations & Eldritch Blast Prerequisite Check
          if (partLow.includes('eldritch blast')) {
            met = hasEldritchBlast;
            info = met ? '(Has Eldritch Blast)' : '(Requires Eldritch Blast / Warlock)';
            if (!met) allMet = false;
            checks.push({ type: 'warlock', label, met, info });
            continue;
          }
          const invTierMatch = partLow.match(/use\s+(least|lesser|greater|dark)\s+invocations/i);
          if (invTierMatch) {
            const tierName = invTierMatch[1].toLowerCase();
            const reqWarlockLvl = tierName === 'dark' ? 16 : (tierName === 'greater' ? 11 : (tierName === 'lesser' ? 6 : 1));
            met = isWarlock && warlockLevel >= reqWarlockLvl;
            info = met ? `(Warlock Level ${warlockLevel} ≥ ${reqWarlockLvl})` : `(Requires Warlock Level ${reqWarlockLvl})`;
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
            info = met ? '(Has Wild Shape)' : '(Requires Wild Shape / Druid 5)';
            if (!met) allMet = false;
            checks.push({ type: 'feature', label, met, info });
            continue;
          }
          if (partLow.includes('turn or rebuke') || partLow.includes('rebuke or command')) {
            met = (classCounts['cleric'] || 0) >= 1 || (classCounts['paladin'] || 0) >= 4 || (classCounts['dread necromancer'] || 0) >= 1 || knownFeats.has('turnundead') || knownFeats.has('rebukeundead');
            info = met ? '(Has Turn/Rebuke)' : '(Requires Turn/Rebuke Undead)';
            if (!met) allMet = false;
            checks.push({ type: 'feature', label, met, info });
            continue;
          }
          if (partLow.includes('bardic music')) {
            met = (classCounts['bard'] || 0) >= 1 || knownFeats.has('bardicmusic');
            info = met ? '(Has Bardic Music)' : '(Requires Bardic Music)';
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
            info = met ? '(Martial Adept / Has Maneuvers)' : '(Requires Martial Maneuver / Stance)';
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
          info = met ? '(Has Feat)' : '(Missing Feat)';
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
            <!-- Slot Header with Inline Category Selector -->
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🎖️</span>
                  <span>${slot.title || `Feat Slot #${idx + 1}`}</span>
                </span>
              </div>
              <div class="flex items-center gap-2">
                <select onchange="onLevelUpSlotCategoryChange(${idx}, this.value)" class="h-7 bg-slate-900 border border-slate-700 hover:border-purple-500/60 rounded-lg px-2 text-[11px] text-amber-300 font-bold focus:outline-none focus:border-purple-500 cursor-pointer" title="Feat / Ability Category">
                  <option value="Regular Feat" ${slot.category === 'Regular Feat' ? 'selected' : ''}>🎖️ Regular Feat</option>
                  <option value="Class Bonus Feat" ${slot.category === 'Class Bonus Feat' ? 'selected' : ''}>⚔️ Class Bonus Feat</option>
                  <option value="Flaw Bonus Feat" ${slot.category === 'Flaw Bonus Feat' ? 'selected' : ''}>🎖️ Flaw Bonus Feat</option>
                  <option value="DM Boon" ${slot.category === 'DM Boon' ? 'selected' : ''}>🌟 DM Boon</option>
                  <option value="Flaw" ${slot.category === 'Flaw' ? 'selected' : ''}>⚠️ Flaw</option>
                  <option value="Racial Trait" ${slot.category === 'Racial Trait' ? 'selected' : ''}>🧬 Racial Bonus Feat</option>
                  <option value="Special Ability" ${slot.category === 'Special Ability' ? 'selected' : ''}>✨ Special Ability</option>
                </select>
                ${hasFeat ? `
                  <button type="button" onclick="clearLevelUpFeatSlot(${idx})" class="h-7 text-[10px] font-semibold text-slate-400 hover:text-amber-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-lg px-2 transition flex items-center gap-1 cursor-pointer" title="Clear selection">
                    <span>🗑️</span>
                    <span>Clear</span>
                  </button>
                ` : ''}
                ${levelUpModalFeatSlots.length > 1 ? `
                  <button type="button" onclick="removeLevelUpFeatSlot(${idx})" class="text-slate-400 hover:text-rose-400 p-1 text-xs transition cursor-pointer" title="Remove this slot">
                    ✕
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Full-Width Spotlight & AI Feat Search Bar -->
            <div>
              <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                <span>🔮 Spotlight &amp; Rule Master AI</span>
                <span class="text-[9px] text-purple-300 font-normal">Compendium + 3.5e RAW Validation</span>
              </label>
              <div class="ui-spotlight-well ui-spotlight-purple rounded-xl p-1.5 flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 border border-purple-400/75">
                <div class="flex items-center gap-2 flex-1 min-w-[160px] w-full sm:w-auto">
                  <div class="w-8 h-8 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow">
                    🔍
                  </div>
                  <input type="text"
                         id="lvlup-feat-search-input-${idx}"
                         value="${(currentQuery || '').replace(/"/g, '&quot;')}"
                         placeholder="Search feats, pick from catalog, or enter custom name..."
                         onfocus="openLevelUpFeatSearchConsole(${idx})"
                         oninput="onLevelUpFeatSearchInput(${idx}, this.value)"
                         onkeydown="if(event.key==='Enter'){event.preventDefault();triggerRuleMasterForLevelUpSlot(${idx});}"
                         class="flex-1 min-w-0 h-8 bg-transparent text-xs sm:text-sm text-white placeholder-slate-200 font-semibold focus:outline-none">
                </div>
                <div class="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                  <button type="button"
                          onclick="triggerRuleMasterForLevelUpSlot(${idx})"
                          class="flex-1 sm:flex-initial justify-center h-8 px-2.5 sm:px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/60 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow cursor-pointer"
                          title="Search Compendium or Fetch via Rule Master AI">
                    <span>🔮</span>
                    <span>Rule Master AI</span>
                  </button>
                  <button type="button"
                          onclick="toggleLevelUpFeatSearchConsole(${idx})"
                          class="flex-1 sm:flex-initial justify-center h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-200 hover:text-white text-xs font-bold border border-purple-500/40 transition flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Toggle feat catalog">
                    <span>📜</span>
                    <span>${isOpen ? 'Close ▲' : 'Catalog ▼'}</span>
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
                    <span>${isExotic ? 'Exotic Weapon:' : 'Target Weapon:'}</span>
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
                ⚠️ Flaw (${countFlaw})
              </button>
            </div>
            <button type="button" onclick="closeLevelUpFeatSearchConsole()" class="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition font-bold cursor-pointer">
              ▲ Close
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
        const isInvEntry = (typeof getAllWarlockInvocations === 'function')
        ? getAllWarlockInvocations().some(i => (i.name || '').toLowerCase() === featName.toLowerCase())
        : false;
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
              desc: pEvalSlot.alreadyKnownReason || `You already possess the "${featName}" feat.`,
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
          } else if (lcat.includes('flaw') || isFlawFeat(found) || CANONICAL_UA_FLAW_NAMES.has(String(found.name || '').toLowerCase().trim())) {
            const prevCat = levelUpModalFeatSlots[idx].category;
            levelUpModalFeatSlots[idx].category = 'Flaw';
            // If the user picked a Flaw inside a Regular Feat slot, preserve the Regular Feat slot AND add the Flaw Bonus Feat slot!
            if (prevCat === 'Regular Feat' && !levelUpModalFeatSlots.some((s, i) => i !== idx && s.category === 'Regular Feat')) {
              levelUpModalFeatSlots.push({
                title: 'Standard Character Feat',
                category: 'Regular Feat',
                name: '',
                benefit: '',
                prereq: '-'
              });
            }
            const flawCount = levelUpModalFeatSlots.filter(s => s.category === 'Flaw').length;
            const flawBonusCount = levelUpModalFeatSlots.filter(s => s.category === 'Flaw Bonus Feat').length;
            if (flawBonusCount < flawCount) {
              levelUpModalFeatSlots.push({
                title: `Flaw Bonus Feat (${ featName })`,
                category: 'Flaw Bonus Feat',
                name: '',
                benefit: '',
                prereq: '-'
              });
            }
          } else if (lcat.includes('fighter') || lcat.includes('martial') || found.isFighterBonusFeat === true) {
            if (levelUpModalFeatSlots[idx].category === 'Class Bonus Feat' || levelUpModalFeatSlots[idx].category === 'Regular Feat' || levelUpModalFeatSlots[idx].category === 'Racial Trait' || levelUpModalFeatSlots[idx].category === 'Flaw Bonus Feat') {
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

          const rawTop = rows[0];
          const v2Entry = (typeof RuleMaster !== 'undefined' && typeof RuleMaster.ensureV2 === 'function')
            ? RuleMaster.ensureV2(Array.isArray(rawTop) ? RuleMaster.normalizeEntry(rawTop, true) : rawTop)
            : rawTop;
          const featName = (Array.isArray(rawTop) ? rawTop[0] : v2Entry?.name) || query;
          const featType = (Array.isArray(rawTop) ? rawTop[1] : v2Entry?.type) || 'Feat';
          const featPrereq = (Array.isArray(rawTop) ? rawTop[2] : v2Entry?.prereq) || '-';
          const featSource = (Array.isArray(rawTop) ? rawTop[4] : v2Entry?.source) || 'D&D 3.5e';
          const featBenefit = (Array.isArray(rawTop) ? rawTop[5] : (v2Entry?.benefit || v2Entry?.description)) || '';

          if (Array.isArray(masterDb)) {
            const clean = featName.toLowerCase().trim();
            if (!masterDb.some(m => (m.name || '').toLowerCase().trim() === clean)) {
              masterDb.push(v2Entry && typeof v2Entry === 'object' && !Array.isArray(v2Entry) ? {
                ...v2Entry,
                schemaVersion: 2,
                name: featName,
                type: featType,
                slot: v2Entry.slot || 'None',
                prereq: featPrereq,
                source: featSource,
                benefit: featBenefit,
                description: v2Entry.description || featBenefit
              } : {
                schemaVersion: 2,
                id: 'feat_' + clean.replace(/[^a-z0-9]+/g, '_'),
                name: featName,
                type: featType,
                slot: 'None',
                prereq: featPrereq,
                source: featSource,
                benefit: featBenefit,
                description: featBenefit,
                modifiers: [],
                damageParts: [],
                modes: []
              });
              saveStateToStorage();
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
        const prevCat = levelUpModalFeatSlots[idx].category;
        levelUpModalFeatSlots[idx].category = newCategory;
        if (newCategory === 'Flaw') {
          if (prevCat === 'Regular Feat' && !levelUpModalFeatSlots.some((s, i) => i !== idx && s.category === 'Regular Feat')) {
            levelUpModalFeatSlots.push({
              title: 'Standard Character Feat',
              category: 'Regular Feat',
              name: '',
              benefit: '',
              prereq: '-'
            });
          }
          const flawCount = levelUpModalFeatSlots.filter(s => s.category === 'Flaw').length;
          const flawBonusCount = levelUpModalFeatSlots.filter(s => s.category === 'Flaw Bonus Feat').length;
          if (flawBonusCount < flawCount) {
            levelUpModalFeatSlots.push({
              title: `Flaw Bonus Feat #${flawCount} (Granted by Flaw)`,
              category: 'Flaw Bonus Feat',
              name: '',
              benefit: '',
              prereq: '-'
            });
          }
        }
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
      const isPrestige = Boolean(def.isPrestige || def.type === 'prestige' || def.type === 'Prestige Class');

      const descLower = (def.description || '').toLowerCase();
      const hasSpellProgInPrestige = isPrestige && (
        (def.spellcastingProgression && def.spellcastingProgression !== 'none') ||
        descLower.includes('spell') ||
        descLower.includes('caster level') ||
        ['eldritch knight', 'arcane trickster', 'mystic theurge', 'archmage', 'hierophant', 'loremaster', 'dragon disciple', 'red wizard', 'thaumaturgist', 'cerebremancer', 'slayer'].some(p => (className || '').toLowerCase().includes(p))
      );

      const curCl = Number(character.spellcasting?.cl) || 0;
      const hasExistingCaster = Boolean(character.spellcasting && (curCl > 0 || (character.spellcasting.slots && character.spellcasting.slots.length > 0)));
      const hasAnyBoon = typeof getCharacterBoonDisciplines === 'function' && getCharacterBoonDisciplines(character).length > 0;

      // Always keep the card visible in Level Up / Plan so users can toggle Multi-Caster & DM Boon disciplines for any class
      card.classList.remove('hidden');

      const progControls = document.getElementById('lvlup-caster-prog-controls');
      const hintEl = document.getElementById('lvlup-caster-hint');
      const isBaseCaster = ['Sorcerer', 'Wizard', 'Cleric', 'Druid', 'Bard', 'Warlock', 'Duskblade', 'Beguiler', 'Warmage', 'Dread Necromancer', 'Favored Soul', 'Paladin', 'Ranger', 'Hexblade', 'Spellthief'].includes(className);
      const showProgDropdown = isBaseCaster || (hasSpellProgInPrestige && hasExistingCaster) || isBoonCl || hasAnyBoon;

      if (progControls) progControls.classList.toggle('hidden', !showProgDropdown);
      if (hintEl) hintEl.classList.toggle('hidden', !showProgDropdown);

      if (typeof renderCasterBoonUI === 'function') {
        renderCasterBoonUI();
      }

      if (badge) {
        const casterClass = character.spellcasting?.className || (isBaseCaster ? className : 'Caster');
        badge.textContent = `${casterClass} CL: ${curCl}`;
      }

      if (progSel) {
        if (isBaseCaster || hasSpellProgInPrestige) {
          progSel.value = 'primary';
        } else if (hasAnyBoon || isBoonCl) {
          progSel.value = 'cl_boon';
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
          hint.innerHTML = `🔮 <b>Primary Caster Advancing:</b> New CL: <b class="text-white">${newCl}</b>. Spell slots and spells per day advance per RAW rules.`;
        }
      } else if (val === 'cl_boon') {
        clInput.value = nextLvl;
        if (hint) {
          hint.innerHTML = `🌟 <b>DM Boon Active:</b> Caster Level (CL) scales with total character level (<b class="text-white">${nextLvl}</b>) across all classes!`;
        }
      } else if (val === 'secondary') {
        clInput.value = currentCl;
        if (hint) {
          hint.innerHTML = `✨ <b>Secondary Caster Advancing:</b> +1 Secondary Caster Level increase applied.`;
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
          badge.textContent = '✨ Gemini AI Active';
          badge.className = 'text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/50';
        } else {
          badge.textContent = '📖 RAW Rule Engine';
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
            btn.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 shadow-sm cursor-pointer';
          } else {
            btn.className = 'px-2.5 py-1 rounded-md text-[10px] font-semibold transition bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white cursor-pointer';
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
          badgeEl.textContent = '👑 Prestige';
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
            ? 'px-2.5 py-1 rounded-md text-[10px] font-bold transition bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 shadow-sm cursor-pointer'
            : 'px-2.5 py-1 rounded-md text-[10px] font-semibold transition bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white cursor-pointer';
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

      // 3. Known / Arcane & Divine classes
      const classesStr = (character.classes || '').toLowerCase();
      const hasArcane = classesStr.includes('sorcerer') || classesStr.includes('wizard') || classesStr.includes('duskblade') || classesStr.includes('bard') || classesStr.includes('warlock');
      const hasDivine = classesStr.includes('cleric') || classesStr.includes('druid') || classesStr.includes('paladin') || classesStr.includes('ranger') || (Array.isArray(character?.spellcasting?.divineSlots) && character.spellcasting.divineSlots.some(s => (Number(s.daily) || 0) > 0));

      // 4. Race & Alignment
      const raceStr = (character.race || '').toLowerCase();
      const alignStr = String(character.alignment || '').toUpperCase().trim();

      let allMet = true;
      const checks = def.prerequisites.map(req => {
        let met = true;
        let info = '';

        if (req.key === 'bab') {
          met = currentBab >= (req.min || 0);
          info = `(Current: +${currentBab})`;
        } else if (req.key === 'feat') {
          const reqName = (req.name || '').toLowerCase();
          met = Array.from(featNames).some(f => f.includes(reqName) || reqName.includes(f));
          info = met ? '(Has Feat)' : '(Missing Feat)';
        } else if (req.key === 'arcane') {
          met = hasArcane;
          info = met ? '(Arcane Caster)' : '(No Arcane Spells)';
        } else if (req.key === 'divine') {
          met = hasDivine;
          info = met ? '(Divine Caster)' : '(No Divine Spells)';
        } else if (req.key === 'spells') {
          const isDual = (def.spellcastingProgression === 'dual_arcane_divine' || (className || '').toLowerCase().includes('mystic theurge'));
          met = isDual ? (hasArcane && hasDivine) : (hasArcane || hasDivine);
          info = met ? '(Spellcaster Eligible)' : (isDual ? '(Requires Arcane & Divine)' : '(Requires Spellcasting)');
        } else if (req.key === 'alignment') {
          if (alignStr) {
            const ALIGN_CODE_MAP = {
              'LAWFUL GOOD': 'LG', 'NEUTRAL GOOD': 'NG', 'CHAOTIC GOOD': 'CG',
              'LAWFUL NEUTRAL': 'LN', 'TRUE NEUTRAL': 'TN', 'NEUTRAL': 'TN', 'N': 'TN', 'CHAOTIC NEUTRAL': 'CN',
              'LAWFUL EVIL': 'LE', 'NEUTRAL EVIL': 'NE', 'CHAOTIC EVIL': 'CE'
            };
            const userAbbr = ALIGN_CODE_MAP[alignStr] || alignStr;
            if (Array.isArray(req.allowed) && req.allowed.length > 0) {
              met = req.allowed.some(a => {
                const code = String(a).toUpperCase().trim();
                return code === userAbbr || code === alignStr || ALIGN_CODE_MAP[code] === userAbbr || (code === 'N' && userAbbr === 'TN') || (code === 'TN' && userAbbr === 'N');
              });
            } else if (Array.isArray(req.forbidden) && req.forbidden.length > 0) {
              met = !req.forbidden.some(f => {
                const code = String(f).toUpperCase().trim();
                return code === userAbbr || code === alignStr || ALIGN_CODE_MAP[code] === userAbbr || (code === 'N' && userAbbr === 'TN') || (code === 'TN' && userAbbr === 'N');
              });
            }
            info = met ? `(${alignStr} Eligible)` : `(Current: ${alignStr})`;
          }
        } else if (req.key === 'skill' && req.skill && req.ranks) {
          const skObj = character.skills ? character.skills[req.skill] : null;
          const curRanks = Number(typeof skObj === 'object' ? skObj?.ranks : skObj) || 0;
          met = curRanks >= Number(req.ranks);
          info = `(Ranks: ${curRanks}/${req.ranks})`;
        } else if (req.key === 'race') {
          if (req.val) {
            met = raceStr.includes((req.val || '').toLowerCase());
            info = met ? '(Race Eligible)' : `(Requires ${req.val})`;
          } else {
            met = !raceStr.includes('dragon');
            info = met ? '(Race Eligible)' : '(Cannot be Dragon)';
          }
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
            <td class="px-2.5 py-1.5 text-center font-mono font-bold text-amber-300 text-[11px] whitespace-nowrap">Level ${lvl}</td>
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
                  <span class="text-[9px] font-mono text-purple-300 bg-purple-950/90 px-1.5 py-0.5 rounded border border-purple-600/50">Levels 1 - ${maxLvl} RAW</span>
                </h4>
                <div class="text-[10px] text-slate-400">${def.source || 'D&D 3.5e'} • Hit Die: <strong class="text-amber-300 font-mono">d${def.hd}</strong> • Skills: <strong class="text-purple-300 font-mono">${def.skills || 2}+INT</strong>/level</div>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              ${!hasFeatures ? `
                <button type="button" onclick="fetchClassFromRuleMasterAi('${safeName}')" class="text-[10px] text-purple-300 hover:text-white bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer" title="Fetch full progression details from sourcebooks via Rule Master AI">
                  <span>✨</span>
                  <span>Fetch Features</span>
                </button>
              ` : ''}
              <button type="button" onclick="toggleClassProgression('${safeName}')" class="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer" title="Close table">✕ Close</button>
            </div>
          </div>

          <div class="overflow-x-auto max-h-80 overflow-y-auto pr-1 rounded-lg border border-slate-800 custom-scroll">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-purple-950/80 text-[10px] uppercase tracking-wider text-purple-200 font-bold border-b border-purple-500/40 sticky top-0 z-10 backdrop-blur">
                  <th class="px-2.5 py-1.5 text-center w-20">Level</th>
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
      if (typeof filterChangeClassSearch === 'function') {
        filterChangeClassSearch();
      }
    }

    function matchesClassSearchQuery(cName, def, qRaw) {
      const q = String(qRaw || '').trim().toLowerCase();
      if (!q) return true;
      const nameLow = (cName || '').toLowerCase();
      const sourceLow = (def?.source || '').toLowerCase();
      const roleLow = (def?.role || '').toLowerCase();
      const descLow = (def?.description || '').toLowerCase();
      const prereqLow = Array.isArray(def?.prerequisites) ? def.prerequisites.map(p => (p.text || '').toLowerCase()).join(' ') : '';
      const haystack = `${nameLow} ${sourceLow} ${roleLow} ${descLow} ${prereqLow}`;

      if (haystack.includes(q)) return true;

      // Multi-token & typo-normalized search (e.g. "rogue, Adventuerer" -> ["rogue", "adventurer"])
      const typoMap = {
        'adventuerer': 'adventurer',
        'adventuer': 'adventurer',
        'rougue': 'rogue',
        'rouge': 'rogue',
        'figther': 'fighter',
        'wizzard': 'wizard',
        'cloister': 'cloistered',
        'martialrogue': 'adventurer',
        'featrogue': 'adventurer'
      };
      const tokens = q
        .split(/[\s,\/\(\)\-\:\;]+/)
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => typoMap[t] || t);

      if (tokens.length === 0) return true;
      return tokens.every(tok => {
        if (haystack.includes(tok)) return true;
        // 1-char prefix/substring tolerance for tokens >= 5 chars (e.g. "adventuerer" vs "adventurer")
        if (tok.length >= 5) {
          const prefix4 = tok.slice(0, 5);
          if (nameLow.includes(prefix4) || roleLow.includes(prefix4)) return true;
        }
        return false;
      });
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

        // Search text (supports multi-word, comma-separated variants & typos)
        if (q && !matchesClassSearchQuery(cName, def, q)) {
          return;
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
                  <span>🔮</span>
                  <span>Fetch "${safeQuery}" via Rule Master AI</span>
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
          ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/50">👑 Prestige Class</span>'
          : (isCustom 
              ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-600/50">⚙️ Custom</span>'
              : '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">🛡️ Base Class</span>');

        const babText = def.bab === 1.0 ? 'Full BAB (+1.0)' : (def.bab === 0.75 ? '3/4 BAB (+0.75)' : '1/2 BAB (+0.5)');
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

        const cleanDesc = (def.description || def.shortDescription || '').replace(/<img[^>]*>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

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

              <div class="flex items-center gap-1.5 flex-wrap" onclick="event.stopPropagation()">
                ${isCustom ? `
                  <button type="button" onclick="openCreateCustomClassModal('${safeName}', true)" class="px-2 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 hover:text-white font-bold text-[10px] shadow flex items-center gap-1 transition active:scale-95 cursor-pointer" title="Edit ${cName} template & level features">
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button type="button" onclick="deleteCustomClass('${safeName}')" class="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 hover:text-white font-bold text-[10px] shadow flex items-center gap-1 transition active:scale-95 cursor-pointer" title="Delete custom class ${cName}">
                    <span>🗑️</span>
                  </button>
                ` : `
                  <button type="button" onclick="openCreateCustomClassModal('${safeName}', false)" class="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-[10px] shadow flex items-center gap-1 transition active:scale-95 cursor-pointer" title="Clone ${cName} as a template and customize its level features / bonus feats">
                    <span>📋</span>
                    <span>Clone / Variant</span>
                  </button>
                `}
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
                  <button type="button" onclick="selectClassFromSearch('${safeName}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow flex items-center gap-1 transition active:scale-95 cursor-pointer">
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

            ${cleanDesc ? `<p class="text-[10px] text-slate-400 leading-relaxed">${cleanDesc.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
            ${prereqHtml}
            ${isProgExpanded ? `<div onclick="event.stopPropagation()">${generateClassProgressionHtml(cName, def)}</div>` : ''}
          </div>
        `;
      });

      if (q) {
        const safeQuery = q.replace(/"/g, '&quot;').replace(/'/g, "\\'");
        htmlOutput += `
          <div class="mt-2 p-2.5 rounded-xl bg-slate-950/90 border border-purple-500/30 flex flex-wrap items-center justify-between gap-2">
            <div class="text-[10px] text-slate-300">
              <span>🔮 Looking for another splatbook / variant class matching <b class="text-amber-300">"${q}"</b>?</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" onclick="openCreateCustomClassModal()" class="bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer">
                <span>📋</span>
                <span>Clone / Edit Class Template</span>
              </button>
              <button type="button" onclick="fetchClassFromRuleMasterAi('${safeQuery}')" class="bg-purple-700 hover:bg-purple-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer border border-purple-400/40">
                <span>🔮</span>
                <span>Fetch "${safeQuery}" via AI</span>
              </button>
            </div>
          </div>
        `;
      }

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
        alert('⚠️ 🔮 Please save a valid Google Gemini API key in Settings (⚙️) to search classes via Rule Master AI.');
        if (typeof openSettingsModal === 'function') openSettingsModal();
        return;
      }

      const statusBox = document.getElementById('lvlup-class-ai-status');
      const statusText = document.getElementById('lvlup-class-ai-status-text');
      const fetchBtn = document.getElementById('btn-fetch-class-ai');

      if (statusBox) statusBox.classList.remove('hidden');
      if (statusText) statusText.textContent = `Scanning D&D 3.5e Sourcebooks & Variants: "${q}"...`;
      if (fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }

      const systemPrompt = `You are Rule Master AI, the supreme D&D 3.5e RAW (Rules As Written) & Variant Class encyclopedia and character building engine.
D&D 3.5E RAW + UNEARTHED ARCANA VARIANTS + SPLATBOOKS + ACFs:
1. BROAD D&D 3.5E SOURCES (CORE + SPLATBOOKS + UNEARTHED ARCANA + DRAGON MAGAZINE):
   You must consult official D&D 3.5e sourcebooks, variant rules, and canonical indexes:
   - Official System Reference Document (SRD v3.5 as archived on d20srd.org)
   - Unearthed Arcana (Variant Character Classes p.47-70, such as "Rogue (Adventurer Variant)" / Martial Feat Rogue which trades Sneak Attack at levels 1, 3, 5, 7, 9, 11, 13, 15, 17, 19 for Fighter Bonus Feats; "Fighter (Thug Variant)"; "Cleric (Cloistered Cleric)"; "Wizard (Domain Wizard)"; "Ranger (Urban Ranger)"; "Barbarian (Whirling Frenzy)")
   - Official Wizards of the Coast 3.5e Publications:
     * Player's Handbook (PHB) & Player's Handbook II, Dungeon Master's Guide (DMG)
     * Complete Series (Warrior, Arcane, Divine, Adventurer, Mage, Scoundrel, Champion)
     * Tome of Battle: The Book of Nine Swords, Tome of Magic, Magic of Incarnum
     * Frostburn, Stormwrack, Sandstorm, Libris Mortis, Lords of Madness, Heroes of Horror/Battle, Book of Exalted Deeds, Book of Vile Darkness, Expanded Psionics Handbook, Races of Stone/Destiny/the Wild/the Dragon, Dungeonscape, Cityscape, Dragon Magazine Compendium.
   - Alternate Class Features (ACFs) and Racial Substitution Levels.
2. TYPO & VARIANT QUERY RESOLUTION:
   - Automatically resolve comma-separated or misspelled variant queries (e.g. "rogue, Adventuerer" or "martial rogue" -> "Rogue (Adventurer Variant)").
   - NEVER output placeholder names like "Non-Existent Class", "Unknown Class", or "None". If a class genuinely cannot be identified as a 3.5e class or variant, set "name": "".
3. ZERO 5E / 4E / PATHFINDER:
   - DO NOT USE D&D 4e, D&D 5e, or Pathfinder rules.

STRICT OUTPUT FORMAT:
You MUST output ONLY a single valid JSON object with NO markdown formatting, NO backticks, NO commentary. Use 100% official D&D 3.5e RAW English terminology.
Format:
{
  "name": "Exact Official Class or Variant Name in English (e.g. Rogue (Adventurer Variant))",
  "type": "Prestige Class" or "Base Class",
  "maxLevel": 5 or 10 or 20,
  "source": "Official 3.5e Book Name (e.g. Unearthed Arcana p.58, Complete Scoundrel)",
  "role": "Role summary in English (e.g. Martial Feat Rogue • Trades Sneak Attack for Fighter Bonus Feats)",
  "hd": 4 or 6 or 8 or 10 or 12,
  "bab": 1.0 or 0.75 or 0.5,
  "fort": "good" or "poor",
  "ref": "good" or "poor",
  "will": "good" or "poor",
  "skills": 2 or 4 or 6 or 8,
  "bonusFeatLevels": [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
  "description": "Short informative English description explaining what the class or variant specializes in and its playstyle.",
  "prerequisites": [
    { "text": "Official English prerequisite (e.g. Base Attack Bonus +5)", "key": "bab", "min": 5 }
  ],
  "features": {
    "1": [{ "name": "Feature Name (Ex/Su/Sp)", "summary": "Concise mechanical summary in English" }],
    "2": [{ "name": "Feature Name (Ex/Su/Sp)", "summary": "Concise mechanical summary in English" }]
  }
}
STRICT RULE: Do NOT include standard 6-sided dice emoji (U+1F3B2) anywhere in any field. Use plain notation like "d10 HD", "1d6", "2d8".`;

      const userPrompt = `Extract the exact official D&D 3.5e RAW class or class variant parameters for: "${q}". (If the query contains typos or variant keywords such as "rogue, Adventuerer" for "Rogue (Adventurer Variant)" from Unearthed Arcana p.58, or "bloodstarm blade" for "Bloodstorm Blade", automatically resolve to the canonical D&D 3.5e class or variant name).
Provide complete maxLevel (5 or 10 for prestige class, 20 for base class/variant), hit die, bab, fort, ref, will, skill points per level, bonusFeatLevels array (levels that grant a selectable bonus feat), prerequisites, description in English, and level-by-level features for every level from 1 up to maxLevel (keys "1", "2", ...).`;

      let modelsToTry = [];
      if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.getAvailableGeminiModels === 'function') {
        try {
          modelsToTry = await RuleMaster.getAvailableGeminiModels(apiKey);
        } catch (e) {
          console.warn('getAvailableGeminiModels failed:', e);
        }
      }
      if (!Array.isArray(modelsToTry) || modelsToTry.length === 0) {
        if (statusBox) statusBox.classList.add('hidden');
        if (fetchBtn) {
          fetchBtn.disabled = false;
          fetchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        alert('⚠️ Could not discover active Gemini models for your API key. Please check your internet connection and API key in Settings.');
        return;
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
            const parsed = JSON.parse(rawText);
            const candName = String(parsed?.name || '').trim();
            if (candName && !/^(null|none|unknown|non-existent|nonexistent|invalid|n\/a)/i.test(candName)) {
              classData = parsed;
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

      if (!classData || !classData.name || /^(null|none|unknown|non-existent|nonexistent|invalid|n\/a)/i.test(String(classData.name).trim())) {
        alert(`⚠️ Rule Master could not find class "${q}" in official D&D 3.5e sourcebooks.\n${lastErr ? lastErr.message : ''}\n\nTip: You can clone an existing class template (e.g. Rogue) and customize its features using the "+ Add Custom Class" (Class Template Studio) button!`);
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

        const statText = getLevelStatIncrease(lvlObj) ? `+1 ${getLevelStatIncrease(lvlObj).toUpperCase()}` : 'None';

        infoBox.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span class="font-extrabold text-amber-400 text-sm">Level ${lvlObj.level} • ${lvlObj.className}</span>
              <div class="text-[10px] text-slate-400 mt-0.5">Your next planned character level</div>
            </div>
            <span class="badge bg-amber-950/80 text-amber-300 border border-amber-600/70 text-[10px] px-2 py-0.5 font-bold">📋 Planned Level</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[11px] pt-1.5 text-slate-300 font-mono">
            <div><span class="text-slate-400 font-sans">Hit Points (HP):</span> <b class="text-emerald-400">+${lvlObj.hpGain}</b> (${lvlObj.hd || 'd8'})</div>
            <div><span class="text-slate-400 font-sans">BAB Gain:</span> <b class="text-sky-400">+${lvlObj.bab}</b></div>
            <div><span class="text-slate-400 font-sans">Saves:</span> F+${lvlObj.fort} R+${lvlObj.ref} W+${lvlObj.will}</div>
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
      if (typeof window.ensureModalsMounted === 'function') window.ensureModalsMounted();
      const modal = document.getElementById('level-up-modal');
      if (!modal || !character) return;

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
          badge.textContent = `Level ${nextLvl}`;
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
          title: 'Standard Feat (Level 1)',
          category: 'Regular Feat',
          name: '',
          benefit: ''
        });
        if (isHuman) {
          levelUpModalFeatSlots.push({
            title: 'Racial Bonus Feat (Human Bonus Feat)',
            category: 'Racial Trait',
            name: '',
            benefit: ''
          });
        }
      } else if (qualifies) {
        levelUpModalFeatSlots.push({
          title: `Standard Feat (Level ${nextLvl})`,
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
          statHint.textContent = 'At Levels 4, 8, 12, 16, 20';
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
        else if (slot.category === 'Flaw Bonus Feat') prefix = '🎖️ [Flaw Bonus] ';
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
        const levelDisc = (typeof classifyClassToMagicDiscipline === 'function')
          ? (classifyClassToMagicDiscipline(className) || 'spontaneous')
          : 'spontaneous';
        const discLvls = (typeof getMagicDisciplineClassLevels === 'function')
          ? ((getMagicDisciplineClassLevels(character)[levelDisc] || 0) + 1)
          : ((prog.filter(p => p.className === className && p.active !== false).length || 0) + 1);
        const effCl = (character.settings.clMode === 'Character Level (DM Boon)') ? nextLvl : discLvls;
        if (character.spellcasting && isActive) {
          character.spellcasting.cl = effCl;
          if (levelDisc === 'spontaneous' && typeof calculateSorcererSlots === 'function') {
            character.spellcasting.slots = calculateSorcererSlots(effCl, character.abilities?.cha || 22, character.spellcasting.slots);
          } else if (levelDisc === 'divine' && typeof calculateDivineSlots === 'function') {
            character.spellcasting.divineSlots = calculateDivineSlots(effCl, character.abilities?.wis || 14, character.spellcasting.divineSlots);
          } else if (levelDisc === 'prepared' && typeof calculateWizardSlots === 'function') {
            character.spellcasting.preparedSlots = calculateWizardSlots(effCl, character.abilities?.int || 14, character.spellcasting.preparedSlots);
          }
        }
        rowFeats.push(`🔮 +1 Caster Lvl (CL: ${effCl})`);
      } else if (casterProg === 'cl_boon') {
        character.settings.clMode = 'Character Level (DM Boon)';
        const existingBoons = (typeof getCharacterBoonDisciplines === 'function')
          ? getCharacterBoonDisciplines(character)
          : [];
        const classDisc = (typeof classifyClassToMagicDiscipline === 'function')
          ? classifyClassToMagicDiscipline(className)
          : null;
        const boonDisc = existingBoons[0] || (classDisc && classDisc !== 'martial' ? classDisc : null) || character.settings.casterType || 'spontaneous';
        if (!Array.isArray(character.settings.boonDisciplines)) {
          character.settings.boonDisciplines = [...existingBoons];
        }
        if (boonDisc && !character.settings.boonDisciplines.includes(boonDisc)) {
          character.settings.boonDisciplines.push(boonDisc);
        }
        if (character.spellcasting && isActive) {
          character.spellcasting.cl = nextLvl;
          const allActiveBoons = character.settings.boonDisciplines;
          if ((boonDisc === 'spontaneous' || allActiveBoons.includes('spontaneous')) && typeof calculateSorcererSlots === 'function') {
            character.spellcasting.slots = calculateSorcererSlots(nextLvl, character.abilities?.cha || 22, character.spellcasting.slots);
          }
          if ((boonDisc === 'divine' || allActiveBoons.includes('divine')) && typeof calculateDivineSlots === 'function') {
            character.spellcasting.divineSlots = calculateDivineSlots(nextLvl, character.abilities?.wis || 14, character.spellcasting.divineSlots);
          }
          if ((boonDisc === 'prepared' || allActiveBoons.includes('prepared')) && typeof calculateWizardSlots === 'function') {
            character.spellcasting.preparedSlots = calculateWizardSlots(nextLvl, character.abilities?.int || 14, character.spellcasting.preparedSlots);
          }
        }
        rowFeats.push(`🌟 DM Boon: CL = Level ${nextLvl}`);
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
        notes: notes || (autoFeatures.length > 0 ? autoFeatures.join(', ') : `${className} level added`)
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

      // Check RuleEngine / Compendium class features
      const allClassDefs = (typeof getAvailableClassDefs === 'function')
        ? getAvailableClassDefs()
        : ((typeof RuleEngine !== 'undefined' && RuleEngine.DND35_CLASS_DEFS) ? RuleEngine.DND35_CLASS_DEFS : {});
      for (const [cName, cDef] of Object.entries(allClassDefs)) {
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
      const statOptions = (typeof STAT_KEYS_TWO_COL !== 'undefined' && Array.isArray(STAT_KEYS_TWO_COL))
        ? STAT_KEYS_TWO_COL
        : [STAT_KEYS[0], STAT_KEYS[3], STAT_KEYS[1], STAT_KEYS[4], STAT_KEYS[2], STAT_KEYS[5]];

      grid.innerHTML = statOptions.map(s => {
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
        const babText = def.bab === 1.0 ? 'Full BAB' : (def.bab === 0.75 ? '3/4 BAB' : '1/2 BAB');
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
      if (typeof window.ensureModalsMounted === 'function') window.ensureModalsMounted();
      const prog = character.levelProgression || [];
      if (idx < 0 || idx >= prog.length) return;
      currentChangeClassLevelIndex = idx;
      const row = prog[idx];

      const modal = document.getElementById('change-level-class-modal');
      if (!modal) return;

      const titleEl = document.getElementById('change-class-modal-title');
      const targetBadge = document.getElementById('change-class-target-badge');
      const subEl = document.getElementById('change-class-modal-subtitle');
      if (titleEl) titleEl.textContent = 'Edit Level / Plan';
      if (targetBadge) {
        if (row.active === false) {
          targetBadge.textContent = `Level ${row.level} (Planned)`;
          targetBadge.className = 'badge bg-purple-950 text-purple-300 border border-purple-600 text-xs font-bold';
        } else {
          targetBadge.textContent = `Level ${row.level}`;
          targetBadge.className = 'badge bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-bold';
        }
      }
      if (subEl) subEl.textContent = `Current Class: ${row.className} • D&D 3.5e Class, Hit Die (HD), BAB, Saves & Ability (+1)`;

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
          statBadge.className = 'badge text-[9px] px-2 py-0.5 font-bold bg-amber-950 text-amber-300 border border-amber-500 animate-pulse';
          statBadge.textContent = `🌟 Level ${row.level}: +1 Ability Score Increase Available!`;
        } else {
          statBadge.className = 'badge text-[9px] px-2 py-0.5 font-bold bg-slate-800 text-slate-400 border border-slate-700';
          statBadge.textContent = 'At Levels 4, 8, 12, 16, 20';
        }
      }
      if (statHint) {
        statHint.textContent = (row.level % 4 === 0)
          ? `Level ${row.level} grants a permanent +1 ability score increase per D&D 3.5e RAW (every 4th character level).`
          : `D&D 3.5e RAW: At levels 4, 8, 12, 16, and 20, add +1 to one ability score (or assign as a DM boon).`;
      }

      const searchInp = document.getElementById('change-class-search-input');
      if (searchInp) searchInp.value = '';
      const searchStat = document.getElementById('change-class-search-status');
      if (searchStat) { searchStat.classList.add('hidden'); searchStat.innerHTML = ''; }

      currentChangeClassFilterTab = 'all';
      ['all', 'base', 'prestige', 'custom'].forEach(t => {
        const btn = document.getElementById(`change-class-filter-tab-${t}`);
        if (btn) {
          if (t === 'all') {
            btn.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 shadow-sm cursor-pointer';
          } else {
            btn.className = 'px-2.5 py-1 rounded-md text-[10px] font-semibold transition bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white cursor-pointer';
          }
        }
      });

      filterChangeClassSearch();
      const resultsBox = document.getElementById('change-class-search-results');
      if (resultsBox) resultsBox.scrollTop = 0;
      onChangeClassSelectChange(false);
      if (typeof renderCasterBoonUI === 'function') {
        renderCasterBoonUI();
      }
      modal.classList.remove('hidden');
      const modalBody = modal.querySelector('.overflow-y-auto.flex-1');
      if (modalBody) modalBody.scrollTop = 0;
    }

    function closeChangeLevelClassModal() {
      const modal = document.getElementById('change-level-class-modal');
      if (modal) modal.classList.add('hidden');
      currentChangeClassLevelIndex = null;
    }

    let currentChangeClassFilterTab = 'all';

    function setChangeClassFilterTab(tab) {
      currentChangeClassFilterTab = tab;
      ['all', 'base', 'prestige', 'custom'].forEach(t => {
        const btn = document.getElementById(`change-class-filter-tab-${t}`);
        if (btn) {
          if (t === tab) {
            btn.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 shadow-sm cursor-pointer';
          } else {
            btn.className = 'px-2.5 py-1 rounded-md text-[10px] font-semibold transition bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white cursor-pointer';
          }
        }
      });
      filterChangeClassSearch();
    }

    function selectChangeClassFromSearch(className) {
      const select = document.getElementById('change-class-select');
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

      onChangeClassSelectChange(true);
      filterChangeClassSearch();

      const preview = document.getElementById('change-class-preview-card');
      if (preview) {
        preview.classList.add('ring-2', 'ring-emerald-400');
        setTimeout(() => preview.classList.remove('ring-2', 'ring-emerald-400'), 1500);
        preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (typeof showToast === 'function') {
        showToast(`🎯 Class Selected: ${className}. Level parameters updated.`, 'success');
      }
    }

    function filterChangeClassSearch() {
      const resultsContainer = document.getElementById('change-class-search-results');
      const countBadge = document.getElementById('change-class-count-badge');
      if (!resultsContainer) return;
      const prevScroll = resultsContainer.scrollTop;

      const q = (document.getElementById('change-class-search-input')?.value || '').trim().toLowerCase();
      const allDefs = getAvailableClassDefs();
      const selectedClass = document.getElementById('change-class-select')?.value || '';

      const matched = [];

      Object.keys(allDefs).forEach(cName => {
        const def = allDefs[cName];
        const isPrestige = def.type === 'Prestige Class';
        const isCustom = def.isCustom === true;
        const isBase = !isPrestige && !isCustom;

        // Filter tab
        if (currentChangeClassFilterTab === 'base' && !isBase) return;
        if (currentChangeClassFilterTab === 'prestige' && !isPrestige) return;
        if (currentChangeClassFilterTab === 'custom' && !isCustom) return;

        // Search text (supports multi-word, comma-separated variants & typos)
        if (q && !matchesClassSearchQuery(cName, def, q)) {
          return;
        }

        const prereqResult = checkClassPrerequisites(cName, def);

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
          resultsContainer.innerHTML = `
            <div class="p-3.5 text-center space-y-2.5 bg-slate-950/80 rounded-xl border border-purple-500/40 shadow-xl">
              <div class="text-slate-200 text-xs font-semibold">
                🔍 Class &quot;<span class="text-amber-300 font-bold">${q}</span>&quot; not found in local compendium.
              </div>
              <p class="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed">
                Scan official D&D 3.5e RAW sourcebooks (PHB, Complete series, Tome of Battle, DMG, etc.) to automatically fetch this class and save it to Master DB.
              </p>
              <div class="pt-1 flex items-center justify-center gap-2">
                <button type="button" onclick="searchOrAddClassWithRuleMaster()" class="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-purple-400/40">
                  <span>🔮</span>
                  <span>Fetch "${q}" via Rule Master AI</span>
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

        // Group Header Divider (Identical to Level Up / Plan)
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
          ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/50">👑 Prestige Class</span>'
          : (isCustom 
              ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-600/50">⚙️ Custom</span>'
              : '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">🛡️ Base Class</span>');

        const babText = def.bab === 1.0 ? 'Full BAB (+1.0)' : (def.bab === 0.75 ? '3/4 BAB (+0.75)' : '1/2 BAB (+0.5)');
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

        const cleanDesc = (def.description || def.shortDescription || '').replace(/<img[^>]*>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        htmlOutput += `
          <div onclick="selectChangeClassFromSearch('${safeName}')" class="bg-slate-950/70 hover:bg-slate-900/90 border ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700'} rounded-lg p-2.5 transition space-y-1.5 cursor-pointer group">
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

              <div class="flex items-center gap-1.5 flex-wrap" onclick="event.stopPropagation()">
                ${isCustom ? `
                  <button type="button" onclick="openCreateCustomClassModal('${safeName}', true)" class="px-2 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 hover:text-white font-bold text-[10px] shadow flex items-center gap-1 transition active:scale-95 cursor-pointer" title="Edit ${cName} template & level features">
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button type="button" onclick="deleteCustomClass('${safeName}')" class="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 hover:text-white font-bold text-[10px] shadow flex items-center gap-1 transition active:scale-95 cursor-pointer" title="Delete custom class ${cName}">
                    <span>🗑️</span>
                  </button>
                ` : `
                  <button type="button" onclick="openCreateCustomClassModal('${safeName}', false)" class="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-[10px] shadow flex items-center gap-1 transition active:scale-95 cursor-pointer" title="Clone ${cName} as a template and customize its level features / bonus feats">
                    <span>📋</span>
                    <span>Clone / Variant</span>
                  </button>
                `}
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
                  <button type="button" onclick="selectChangeClassFromSearch('${safeName}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow flex items-center gap-1 transition active:scale-95 cursor-pointer">
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

            ${cleanDesc ? `<p class="text-[10px] text-slate-400 leading-relaxed">${cleanDesc.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
            ${prereqHtml}
            ${isProgExpanded ? `<div onclick="event.stopPropagation()">${generateClassProgressionHtml(cName, def)}</div>` : ''}
          </div>
        `;
      });

      resultsContainer.innerHTML = htmlOutput;
      resultsContainer.scrollTop = prevScroll;
    }

    window.setChangeClassFilterTab = setChangeClassFilterTab;
    window.selectChangeClassFromSearch = selectChangeClassFromSearch;
    window.filterChangeClassSearch = filterChangeClassSearch;

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

      const featBadges = featList.length > 0 
        ? featList.map(fName => {
            const safe = fName.replace(/'/g, "\\'");
            const cornerBadge = typeof getFeatPinCornerBadgeHtml === 'function' ? getFeatPinCornerBadgeHtml(fName) : '';
            return `<button type="button" onclick="showFeatDetail('${safe}')" class="relative inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/80 hover:bg-emerald-900 transition cursor-pointer" title="View rule details"><span>✨</span><span class="pr-2">${fName}</span>${cornerBadge}</button>`;
          }).join(' ')
        : '<span class="text-slate-500 italic text-[10px]">No special class features or bonus feat selection.</span>';

      const fortLetter = (def.fort || 'poor')[0].toUpperCase();
      const refLetter = (def.ref || 'poor')[0].toUpperCase();
      const willLetter = (def.will || 'poor')[0].toUpperCase();
      const babLabel = def.bab === 1.0 ? 'Full (+1)' : (def.bab === 0.75 ? '3/4 Medium' : '1/2 Poor');

      preview.innerHTML = `
        <div class="flex items-center justify-between text-amber-300 font-bold border-b border-slate-800 pb-1">
          <span>${newClass} (Level ${targetClassLvl})</span>
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

      const def = (typeof getAvailableClassDefs === 'function' ? getAvailableClassDefs()[targetClass] : null)
        || (typeof RuleEngine !== 'undefined' && RuleEngine.getClassDef ? RuleEngine.getClassDef(targetClass) : null)
        || (typeof DND35_CLASS_DEFS !== 'undefined' && DND35_CLASS_DEFS[targetClass] ? DND35_CLASS_DEFS[targetClass] : null)
        || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4 };

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
        total: cleanType ? `[${cleanType}]` : 'Saved'
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
              source: `Level ${p.level || '?'}`
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

      // Check for Companion Capability or Existing Companion (Madde D)
      let companionCardHtml = '';
      const hasCompanion = Boolean(character.companion && character.companion.baseMonsterId);
      const isEligible = typeof window.isCharacterCompanionEligible === 'function'
        ? window.isCharacterCompanionEligible(character)
        : false;

      if (hasCompanion) {
        const stats = (window.SrdCompendium && typeof window.SrdCompendium.calculateCompanionStats === 'function')
          ? window.SrdCompendium.calculateCompanionStats(character, character.companion)
          : null;

        if (stats) {
          const typeLabel = stats.type === 'familiar' ? 'Familiar' : (stats.type === 'special_mount' ? 'Special Mount' : 'Animal Companion');
          const icon = stats.type === 'familiar' ? '🦉' : (stats.type === 'special_mount' ? '🐎' : '🐺');

          companionCardHtml = `
            <div class="mt-3.5 border border-amber-500/40 rounded-xl bg-slate-900/90 p-3 shadow-md space-y-2">
              <!-- Header: 🐾 Name & Animal (Type) - [Manage] [Dismiss] -->
              <div class="flex items-center justify-between border-b border-slate-800 pb-2 gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-base shrink-0">${icon}</span>
                  <div class="flex items-center gap-2 flex-wrap min-w-0">
                    <span class="text-xs font-black text-amber-300 truncate">${safeEscapeHtml(stats.customName)}</span>
                    <span class="text-[10px] text-slate-400 font-mono truncate">(${safeEscapeHtml(stats.baseName)} • ${typeLabel})</span>
                    <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60">${stats.totalHd} HD</span>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button type="button" onclick="openCompanionModal()" class="ui-btn-xs h-6 px-2 text-[10px] font-bold text-amber-300 hover:text-white bg-slate-950 hover:bg-slate-800 rounded border border-amber-600/50 transition cursor-pointer">
                    <span>⚙️</span>
                    <span>Manage</span>
                  </button>
                  <button type="button" onclick="dismissCompanion()" class="ui-btn-xs h-6 px-2 text-[10px] font-bold text-rose-400 hover:text-white bg-slate-950 hover:bg-rose-900/70 rounded border border-rose-800/60 transition cursor-pointer" title="Dismiss companion">
                    <span>✕</span>
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>

              <!-- Line 1: HP, AC, Speed, Initiative/BAB -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div class="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">Hit Points</span>
                  <span class="font-bold text-emerald-400">${stats.hp.current} / ${stats.hp.max}</span>
                </div>
                <div class="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">Armor Class</span>
                  <span class="font-bold text-amber-300">${stats.ac.total}</span>
                  <span class="text-[8px] text-slate-500 font-normal">T ${stats.ac.touch} • FF ${stats.ac.flatFooted}</span>
                </div>
                <div class="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">Speed &amp; BAB</span>
                  <span class="font-bold text-sky-300">${stats.speed.land} ft</span>
                  <span class="text-[8px] text-slate-500 font-normal">BAB +${stats.bab}</span>
                </div>
                <div class="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">Saves (F / R / W)</span>
                  <span class="font-bold text-purple-300">+${stats.saves.fort} / +${stats.saves.ref} / +${stats.saves.will}</span>
                </div>
              </div>

              <!-- Line 2: Ability Scores -->
              <div class="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-[11px] font-mono flex-wrap gap-2">
                <div><strong class="text-slate-400">STR</strong> <span class="text-white font-bold">${stats.abilities.str}</span> <span class="text-amber-400 font-semibold">(+${stats.abilityMods.str})</span></div>
                <div><strong class="text-slate-400">DEX</strong> <span class="text-white font-bold">${stats.abilities.dex}</span> <span class="text-amber-400 font-semibold">(+${stats.abilityMods.dex})</span></div>
                <div><strong class="text-slate-400">CON</strong> <span class="text-white font-bold">${stats.abilities.con}</span> <span class="text-amber-400 font-semibold">(+${stats.abilityMods.con})</span></div>
                <div><strong class="text-slate-400">INT</strong> <span class="text-white font-bold">${stats.abilities.int}</span></div>
                <div><strong class="text-slate-400">WIS</strong> <span class="text-white font-bold">${stats.abilities.wis}</span> <span class="text-amber-400 font-semibold">(+${stats.abilityMods.wis})</span></div>
                <div><strong class="text-slate-400">CHA</strong> <span class="text-white font-bold">${stats.abilities.cha}</span></div>
              </div>

              <!-- Line 3: Attacks & Damage -->
              <div class="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs flex-wrap gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] font-bold text-amber-400 uppercase">Natural Attacks:</span>
                  ${stats.attacks.map(atk => `<span class="font-mono text-white font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">${safeEscapeHtml(atk.name)} ${atk.formattedAttack} (${atk.formattedDamage})</span>`).join(' ')}
                </div>
              </div>

              <!-- Line 4: Special Qualities & Tricks -->
              <div class="flex items-center gap-1.5 text-[10px] text-slate-300 flex-wrap pt-0.5">
                <span class="text-[9px] font-bold text-purple-400 uppercase">Traits &amp; Tricks:</span>
                ${[...stats.specialAbilities, ...stats.monsterFeats, stats.bonusTricks ? `${stats.bonusTricks} Bonus Tricks` : null, stats.masterBonusText].filter(Boolean).map(t => `<span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-medium">${safeEscapeHtml(t)}</span>`).join('')}
              </div>
            </div>
          `;
        }
      } else if (isEligible) {
        companionCardHtml = `
          <div class="mt-3.5 border border-dashed border-amber-600/50 rounded-xl bg-slate-950/40 p-2.5 flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-lg">🐾</span>
              <div>
                <span class="text-xs font-bold text-amber-300 block">Animal Companion / Familiar / Mount Available</span>
                <span class="text-[10px] text-slate-400">Character is eligible to bind an animal companion, summon a familiar, or call a paladin war mount.</span>
              </div>
            </div>
            <button type="button" onclick="openCompanionModal()" class="ui-btn-xs h-7 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition shadow flex items-center gap-1.5 cursor-pointer">
              <span>➕</span>
              <span>Select Companion</span>
            </button>
          </div>
        `;
      } else {
        companionCardHtml = `
          <div class="mt-3.5 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 p-2.5 flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-base">🔒</span>
              <div>
                <span class="text-xs font-bold text-slate-400 block">Companion &amp; Mount Locked (Prerequisites Not Met)</span>
                <span class="text-[10px] text-slate-500">Add a required feat or class feature (<strong class="text-amber-400/90">Animal Companion</strong>, <strong class="text-purple-400/90">Summon Familiar</strong>, <strong class="text-sky-400/90">Special Mount</strong>, <strong class="text-amber-300/90">Obtain Familiar</strong>, or <strong class="text-emerald-400/90">Wild Cohort</strong>) first to bind a companion.</span>
              </div>
            </div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow mt-4">
          <!-- Akordeon Başlık Çubuğu -->
          <div onclick="toggleCoreFeatsAccordion()" class="bg-slate-900 hover:bg-slate-800/80 px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition select-none">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="text-base">🎖️</span>
              <span class="text-xs font-black text-amber-400 uppercase tracking-wide">FEATS &amp; SPECIAL ABILITIES SHOWCASE</span>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60">${featsList.length} Feats</span>
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/60">${abilitiesList.length} Abilities</span>
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
                    <span class="text-[10px] text-slate-400 font-normal">Ex, Su, Sp &amp; Racial</span>
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
            ${companionCardHtml}
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
                <span class="font-bold text-indigo-300">Monster / NPC Statblock Mode:</span>
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
        clModeSel.value = character.settings?.clMode || 'Class Level';
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
              <span>✅ Active Level:</span>
              <strong class="text-white text-sm">${summary.activeLevels}</strong>
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-600/80 text-sky-300 font-bold">
              <span>📋 Planned Total:</span>
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
          statBadgeItem = `<button type="button" onclick="openStatPickerForLevel(${idx})" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold bg-sky-950/80 hover:bg-sky-900 active:scale-95 text-sky-300 hover:text-white border border-sky-600/70 shadow-sm transition text-left cursor-pointer" title="Level ${lvl.level} Ability Score Increase: +1 ${sDef.name}. Click to change or remove."><span class="shrink-0">💪</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2">+1 Stat: ${sDef.label}</span></button>`;
        } else if (isStatInterval) {
          statBadgeItem = `<button type="button" onclick="openStatPickerForLevel(${idx})" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold bg-sky-950/90 hover:bg-sky-900 active:scale-95 text-sky-300 hover:text-white border border-dashed border-sky-500 shadow-sm animate-pulse transition text-left cursor-pointer" title="Select +1 Ability Score Increase for Level ${lvl.level}"><span class="shrink-0">💪</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2">+ Select Ability (+1)</span></button>`;
        }

        // Filtered and partitioned feats for 3-column split:
        // 1. Regular Feats (Beceriler)
        // 2. Class Bonus Feats (Sınıf Özellikleri)
        // 3. Other Bonus Feats / Boons / Invocations / Flaws (Bonus)
        const regularFeats = [];
        const classBonusFeats = [];
        const otherBonusFeats = [];
        const flawsAtLevel = [];
        const flawBonusFeatsAtLevel = [];
        (lvl.feats || []).forEach(fStr => {
          const str = String(fStr);
          if (str.includes('+1 Stat') || str.includes('Stat:')) return; // handled by statBadgeItem
          if (str.includes('[Flaw Bonus]')) {
            otherBonusFeats.push(fStr);
            flawBonusFeatsAtLevel.push(fStr);
          } else if (isFlawFeatString(fStr)) {
            otherBonusFeats.push(fStr);
            flawsAtLevel.push(fStr);
          } else if (str.includes('[Bonus]') || str.includes('[Extra Bonus]') || str.includes('Bonus')) {
            classBonusFeats.push(fStr);
          } else if (str.includes('[DM Boon]') || str.includes('Boon') || str.includes('DM Grant')) {
            otherBonusFeats.push(fStr);
          } else if (str.includes('[Racial]') || str.includes('[Extra Racial]') ||
              str.includes('[Invocation]') || str.includes('[Extra Invocation]') || str.includes('Invocation') ||
              str.includes('Caster Lvl') || str.includes('+1 Primary CL') || str.includes('🔮')) {
            otherBonusFeats.push(fStr);
          } else {
            regularFeats.push(fStr);
          }
        });

        // 1. Sınıf Özellikleri (Core Class Abilities + Class Bonus Feats)
        const abilityBadgeItems = (lvl.specialAbilities || []).filter(aStr => {
          const str = String(aStr).trim();
          // Hide generic "Domains (2)" or "[Domain: ...]" strings on Cleric 1 because we render dedicated interactive Domain badges
          if ( /^(\[[^\]]+\]\s*)?Domains\s*\(2\)/i.test(str) || /^⚜️\s*Domain:/i.test(str) || /^\[Domain:/i.test(str) ) {
            return false;
          }
          return true;
        }).map(aStr => {
          const str = String(aStr);
          const rawName = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim();
          const safeA = rawName.replace(/'/g, "\\'");
          const tip = getFeatTooltipText(aStr);
          const safeTip = tip.replace(/"/g, '&quot;');
          const cleanStr = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+/, '').trim();
          const cornerBadge = getFeatPinCornerBadgeHtml(rawName);
          return `<button onclick="showFeatDetail('${safeA}', ${idx}, 'ability')" title="${safeTip}" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="relative min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-600/70 shadow-sm transition text-left cursor-pointer"><span class="shrink-0">✨</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2.5">${cleanStr}</span>${cornerBadge}</button>`;
        });

        const classBonusBadgeItems = classBonusFeats.map(fStr => {
          const str = String(fStr);
          const rawName = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          const safeF = rawName.replace(/'/g, "\\'");
          const tip = getFeatTooltipText(fStr);
          const safeTip = tip.replace(/"/g, '&quot;');
          const cleanStr = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+/, '').replace(/^\[Extra Bonus\]/i, '[Bonus]').trim();
          const cornerBadge = getFeatPinCornerBadgeHtml(rawName);
          return `<button onclick="showFeatDetail('${safeF}', ${idx}, 'feat')" title="${safeTip}" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="relative min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-600/70 shadow-sm transition text-left cursor-pointer"><span class="shrink-0">⚔️</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2.5">${cleanStr}</span>${cornerBadge}</button>`;
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

        // Cleric 1st Level: 2 Domain Selections (PHB p. 32)
        const isClericLvl1 = ['cleric', 'rahip'].includes(String(lvl.className || '').toLowerCase().trim()) && classLevelSoFar === 1;
        if (isClericLvl1) {
          const chosenDomains = (typeof getCharacterClericDomains === 'function')
            ? getCharacterClericDomains(character)
            : (Array.isArray(character?.spellcasting?.domains) ? character.spellcasting.domains.filter(Boolean) : []);
          const deityMeta = (typeof getCharacterDeityMeta === 'function') ? getCharacterDeityMeta(character) : null;
          const favWep = (deityMeta && deityMeta.weapon && deityMeta.weapon !== '-') ? deityMeta.weapon : null;
          for (let dSlot = 0; dSlot < 2; dSlot++) {
            const domName = chosenDomains[dSlot];
            if (domName) {
              const domDef = (window.SrdCompendium && typeof window.SrdCompendium.getDomain === 'function')
                ? window.SrdCompendium.getDomain(domName)
                : (typeof DND35_CLERIC_DOMAINS === 'object' ? DND35_CLERIC_DOMAINS[domName] : null);
              const elig = (typeof checkClericDomainEligibility === 'function') ? checkClericDomainEligibility(domName, character) : { eligible: true, reason: '' };
              const gPower = domDef ? (domDef.grantedPower?.description || domDef.grantedPower || domDef.description || 'Cleric Domain Granted Power') : 'Cleric Domain Granted Power';
              const warSuffix = (domName === 'War' && favWep) ? ` [WF: ${favWep}]` : '';
              const warnPrefix = !elig.eligible ? `⚠️ RAW Conflict: ${elig.reason} — ` : '';
              const safeTip = `${warnPrefix}Cleric Domain (${dSlot + 1}/2): ${domName}${warSuffix} — ${gPower} (Click to change domain)`.replace(/"/g, '&quot;');
              const badgeColorCls = elig.eligible
                ? 'bg-amber-950/90 hover:bg-amber-900 text-yellow-300 border-yellow-500/80'
                : 'bg-rose-950/90 hover:bg-rose-900 text-rose-200 border-rose-500/80';
              classBonusBadgeItems.push(
                `<button onclick="openClericDomainPickerModal(${idx}, ${dSlot})" title="${safeTip}" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="relative min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold ${badgeColorCls} border shadow-sm transition text-left cursor-pointer"><span class="shrink-0">${elig.eligible ? '⚜️' : '⚠️'}</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2">Domain: ${domName}${warSuffix}</span></button>`
              );
            } else {
              pendingClassBonusButtons.push(
                `<button onclick="openClericDomainPickerModal(${idx}, ${dSlot})" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold bg-amber-950/90 hover:bg-amber-900 text-yellow-300 border border-dashed border-yellow-500 shadow-sm animate-pulse transition text-left cursor-pointer" title="Select Cleric Domain (${dSlot + 1}/2) — Grants a Domain Power and +1 Domain Spell Slot per spell level (1st–9th)"><span class="shrink-0">⚜️</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2">+ Select Cleric Domain (${dSlot + 1}/2)</span></button>`
              );
            }
          }
        }

        const hasSlotClassBonusFeat = classBonusFeats.some(f => !String(f).includes('[Extra'));
        if (qualifiesForClassBonus && !hasSlotClassBonusFeat) {
          const contract = classFeats.bonusFeatContract;
          let btnText = '+ Select Bonus Feat';
          let btnIcon = '⚔️';
          let btnCls = 'bg-amber-950/90 hover:bg-amber-900 text-amber-300 border-amber-500';
          let btnTitle = `Select ${lvl.className} Bonus Feat for this level`;
          if (contract && contract.mode === 'exact_choices') {
            if (Array.isArray(contract.choices) && contract.choices.length > 2) {
              btnText = `+ ${lvl.className} Bonus Feat`;
              btnIcon = '⚔️';
              btnCls = 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-500';
              btnTitle = `Select ${lvl.className} Bonus Feat (${contract.choices.join(', ')})`;
            } else if (Array.isArray(contract.choices) && contract.choices.length > 0) {
              btnText = `+ ${lvl.className} Feat (${contract.choices.join(' / ')})`;
              btnIcon = '🥋';
              btnCls = 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-500';
              btnTitle = `Select ${lvl.className} Bonus Feat (${contract.choices.join(' / ')})`;
            } else {
              btnText = `+ ${lvl.className} Bonus Feat`;
              btnIcon = '⚔️';
              btnCls = 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-500';
              btnTitle = `Select ${lvl.className} Bonus Feat for this level`;
            }
          } else if (lvl.className === 'Monk') {
            btnText = '+ Monk Bonus Feat';
            btnIcon = '🥋';
            btnCls = 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-500';
          } else if (lvl.className === 'Wizard') {
            btnText = '+ Wizard Bonus Feat';
            btnIcon = '🔮';
            btnCls = 'bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border-indigo-500';
          }
          pendingClassBonusButtons.push(`<button onclick="openQuickFeatPickerForLevel(${idx}, 'Class Bonus Feat', true)" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold ${btnCls} border border-dashed shadow-sm animate-pulse transition text-left cursor-pointer" title="${btnTitle.replace(/"/g, '&quot;')}"><span class="shrink-0">${btnIcon}</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2">${btnText}</span></button>`);
        }

        // 2. Beceriler (Regular Feats) badges
        const regularFeatBadgeItems = regularFeats.map(fStr => {
          const str = String(fStr);
          const rawName = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          const safeF = rawName.replace(/'/g, "\\'");
          const tip = getFeatTooltipText(fStr);
          const safeTip = tip.replace(/"/g, '&quot;');
          const cleanStr = str.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[Extra\]\s*)?/i, '').trim();
          const cornerBadge = getFeatPinCornerBadgeHtml(rawName);
          return `<button onclick="showFeatDetail('${safeF}', ${idx}, 'feat')" title="${safeTip}" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="relative min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/70 shadow-sm transition text-left cursor-pointer"><span class="shrink-0">🎖️</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2.5">${cleanStr}</span>${cornerBadge}</button>`;
        });

        // Check regular feat eligibility
        const featMode = character.settings?.featMode || 'Standard 3.5e (1, 3, 6, 9, 12, 15, 18)';
        const qualifiesForRegularFeat = isLevelQualifiesForFeat(lvl.level, featMode);
        const hasSlotRegularFeat = regularFeats.some(f => !String(f).includes('[Extra]'));
        const regularPromptButtons = [];
        if (qualifiesForRegularFeat && !hasSlotRegularFeat) {
          regularPromptButtons.push(`<button onclick="openQuickFeatPickerForLevel(${idx}, 'Regular Feat', true)" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold bg-purple-950/90 hover:bg-purple-900 text-purple-300 border border-dashed border-purple-500 shadow-sm animate-pulse transition text-left cursor-pointer" title="Select Character Feat for this level"><span class="shrink-0">🎖️</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2.5">+ Select Feat</span></button>`);
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
          if (str.includes('[Flaw Bonus]')) {
            bgCls = 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-600/70';
            icon = '🎖️';
          } else if (isFlawFeatString(str)) {
            bgCls = 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-600/70';
            icon = '⚠️';
            if (!labelText.toLowerCase().includes('flaw')) {
              labelText = `[Flaw] ${rawName}`;
            }
          } else if (str.includes('[DM Boon]') || str.includes('Boon') || str.includes('DM Grant')) {
            bgCls = 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-600/70';
            icon = '🌟';
          } else if (str.includes('[Invocation]') || str.includes('[Extra Invocation]') || str.includes('Invocation') || str.includes('🔮')) {
            bgCls = 'bg-purple-950/80 hover:bg-purple-900 text-purple-300 border-purple-600/70';
            icon = '🔮';
            labelText = labelText.replace(/^\[Extra Invocation\]/i, '[Invocation]');
          } else if (str.includes('[Racial]') || str.includes('[Extra Racial]')) {
            bgCls = 'bg-teal-950/80 hover:bg-teal-900 text-teal-300 border-teal-600/70';
            icon = '🧬';
            const featOnly = labelText.replace(/^\[(Extra\s+)?Racial\]\s*/i, '').trim();
            labelText = `[Human Bonus] ${featOnly}`;
          }
          const cleanStr = labelText;
          const cornerBadge = getFeatPinCornerBadgeHtml(rawName);
          return `<button onclick="showFeatDetail('${safeF}', ${idx}, 'feat')" title="${safeTip}" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="relative min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold ${bgCls} border shadow-sm transition text-left cursor-pointer"><span class="shrink-0">${icon}</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2.5">${cleanStr}</span>${cornerBadge}</button>`;
        });

        const qualifiesForHumanBonus = (lvl.level === 1 && isHuman);
        const hasSlotRacialBonus = otherBonusFeats.some(f => String(f).includes('[Racial]'));
        const pendingBonusButtons = [];
        if (qualifiesForHumanBonus && !hasSlotRacialBonus) {
          pendingBonusButtons.push(`<button onclick="openQuickFeatPickerForLevel(${idx}, 'Racial Trait', true)" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold bg-teal-950/90 hover:bg-teal-900 text-teal-300 border border-dashed border-teal-500 shadow-sm animate-pulse transition text-left cursor-pointer" title="Select Human racial bonus feat (1st-Level RAW: Extra bonus feat)"><span class="shrink-0">🧬</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2.5">+ Human Bonus Feat</span></button>`);
        }

        // D&D 3.5e Unearthed Arcana (p. 91) RAW: Each Flaw at this level grants +1 Bonus Feat slot
        const unfilledFlawBonusSlots = Math.max(0, flawsAtLevel.length - flawBonusFeatsAtLevel.length);
        for (let fbIdx = 0; fbIdx < unfilledFlawBonusSlots; fbIdx++) {
          const flawRaw = String(flawsAtLevel[flawBonusFeatsAtLevel.length + fbIdx] || 'Flaw').replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim();
          const safeFlawRaw = flawRaw.replace(/"/g, '&quot;');
          pendingBonusButtons.push(`<button onclick="openQuickFeatPickerForLevel(${idx}, 'Flaw Bonus Feat', true)" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-dashed border-emerald-500 shadow-sm animate-pulse transition text-left cursor-pointer" title="Select Bonus Feat granted by Flaw: ${safeFlawRaw} (Unearthed Arcana p. 91)"><span class="shrink-0">🎖️</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2.5">+ Flaw Bonus Feat (${safeFlawRaw})</span></button>`);
        }

        // Warlock Invocation Progression Check (Warlock Boon or Warlock Class Level)
        const isWarlockActive = (typeof isWarlockEnabledForLevel === 'function')
          ? isWarlockEnabledForLevel(idx)
          : Boolean(character.settings?.warlockBoon || (character.settings?.clMode && String(character.settings.clMode).includes('Warlock Boon')));
        
        if (isWarlockActive && typeof isWarlockInvocationLevel === 'function' && isWarlockInvocationLevel(lvl.level)) {
          const hasInvocation = otherBonusFeats.some(f => (String(f).includes('[Invocation]') || (String(f).toLowerCase().includes('invocation') && !String(f).includes('[Extra Invocation]'))));
          if (!hasInvocation) {
            const tier = (typeof getWarlockMaxTierForLevel === 'function') ? getWarlockMaxTierForLevel(lvl.level) : 'Least';
            pendingBonusButtons.push(`<button onclick="openQuickFeatPickerForLevel(${idx}, 'Warlock Invocation', true)" style="width: 168px; min-width: 168px; max-width: 168px; box-sizing: border-box; overflow: hidden;" class="min-h-5 h-auto py-0.5 inline-flex items-center justify-start gap-1 px-1.5 rounded text-[9px] font-bold bg-purple-950/90 hover:bg-purple-900 text-purple-300 border border-dashed border-purple-500 shadow-sm animate-pulse transition text-left cursor-pointer" title="Select Level ${lvl.level} Warlock Invocation (${tier})"><span class="shrink-0">🔮</span><span class="line-clamp-2 break-words text-left flex-1 min-w-0 leading-tight pr-2.5">+ Select Invocation (${tier})</span></button>`);
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
          <td class="py-2 pl-3 pr-1 align-top text-center" style="width: 5%;">
            <div class="h-6 flex items-center justify-center font-bold text-amber-400 text-xs">${lvl.level}</div>
          </td>
          <td class="py-2 px-1.5 align-top text-center" style="width: 8.5%;">
            <div class="h-6 flex items-center justify-center">
              <label class="inline-flex items-center gap-1 ${isToggleDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}" title="${toggleTitle}">
                <input type="checkbox" onchange="toggleLevelActive(${idx})" ${isActive ? 'checked' : ''} ${isToggleDisabled ? 'disabled' : ''} class="w-3.5 h-3.5 rounded text-emerald-500 m-0 ${isToggleDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}">
                <span class="badge ${isActive ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-slate-800 text-slate-400 border-slate-700'} text-[8px] px-1 py-0.5 leading-none font-bold whitespace-nowrap">
                  ${isActive ? 'ACTIVE' : 'PLAN'}
                </span>
              </label>
            </div>
          </td>
          <td class="py-2 px-2 align-top text-left whitespace-nowrap" style="width: 11.5%;">
            <div class="h-6 flex items-center font-sans font-bold text-white text-xs truncate" title="${lvl.className}-${classLevelSoFar}">${lvl.className}-${classLevelSoFar}</div>
          </td>
          <td class="py-2 px-1 align-top text-center" style="width: 5%;">
            <div class="h-6 flex items-center justify-center text-slate-400 font-bold text-xs">${lvl.hd}</div>
          </td>
          <td class="py-2 px-1 align-top text-center" style="width: 5%;">
            <div class="h-6 flex items-center justify-center text-emerald-400 font-bold text-xs" title="Level Hit Die: +${lvl.hpGain} | Con: ${conModStr} (This Level: +${Math.max(1, (Number(lvl.hpGain) || 0) + conMod)})">+${lvl.hpGain}</div>
          </td>
          <td class="py-2 px-1 align-top text-center" style="width: 5%;">
            <div class="h-6 flex items-center justify-center text-sky-400 font-bold text-xs">+${rowBab}</div>
          </td>
          <td class="py-2 px-1 align-top text-center" style="width: 5%;">
            <div class="h-6 flex items-center justify-center text-slate-300 font-bold text-xs">+${rowFort}</div>
          </td>
          <td class="py-2 px-1 align-top text-center" style="width: 5%;">
            <div class="h-6 flex items-center justify-center text-slate-300 font-bold text-xs">+${rowRef}</div>
          </td>
          <td class="py-2 px-1 align-top text-center" style="width: 5%;">
            <div class="h-6 flex items-center justify-center text-slate-300 font-bold text-xs">+${rowWill}</div>
          </td>
          <td class="py-2 px-1 align-top text-center" style="width: 5%;">
            <div class="h-6 flex items-center justify-center text-indigo-300 font-bold text-xs">${lvl.skillPts || 4}</div>
          </td>
          <td class="py-2 font-sans align-top text-center" style="width: 176px; min-width: 176px; max-width: 176px; padding-left: 4px; padding-right: 4px;">
            <div class="flex flex-col gap-1.5 items-stretch mx-auto min-w-0" style="width: 168px; min-width: 168px; max-width: 168px;">
              ${(abilityBadgeItems.length > 0 || classBonusBadgeItems.length > 0 || pendingClassBonusButtons.length > 0) ? (abilityBadgeItems.join('') + classBonusBadgeItems.join('') + pendingClassBonusButtons.join('')) : '<span class="text-slate-600 text-[10px] italic leading-none py-1">-</span>'}
            </div>
          </td>
          <td class="py-2 font-sans align-top text-center" style="width: 176px; min-width: 176px; max-width: 176px; padding-left: 4px; padding-right: 4px;">
            <div class="flex flex-col gap-1.5 items-stretch mx-auto min-w-0" style="width: 168px; min-width: 168px; max-width: 168px;">
              ${(regularFeatBadgeItems.length > 0 || regularPromptButtons.length > 0) ? (regularFeatBadgeItems.join('') + regularPromptButtons.join('')) : '<span class="text-slate-600 text-[10px] italic leading-none py-1">-</span>'}
            </div>
          </td>
          <td class="py-2 font-sans align-top text-center" style="width: 176px; min-width: 176px; max-width: 176px; padding-left: 4px; padding-right: 4px;">
            <div class="flex flex-col gap-1.5 items-stretch mx-auto min-w-0" style="width: 168px; min-width: 168px; max-width: 168px;">
              ${(statBadgeItem || otherBonusBadgeItems.length > 0 || pendingBonusButtons.length > 0) ? ((statBadgeItem || '') + otherBonusBadgeItems.join('') + pendingBonusButtons.join('')) : '<span class="text-slate-600 text-[10px] italic leading-none py-1">-</span>'}
            </div>
          </td>
          <td class="py-2 align-top text-center whitespace-nowrap shrink-0" style="width: 56px; min-width: 56px; max-width: 56px; padding-left: 4px; padding-right: 4px;">
            <div class="h-6 flex items-center justify-center gap-0.5">
              <button onclick="openQuickFeatPickerForLevel(${idx})" class="text-emerald-400 hover:text-emerald-300 p-0.5 text-xs transition font-bold" title="Add Feat, Ability, Invocation, or Bonus to this level">
                ➕
              </button>
              <button onclick="openChangeLevelClassModal(${idx})" class="text-slate-400 hover:text-amber-400 p-0.5 text-xs transition" title="Edit class & stats for this level">
                ✏️
              </button>
              ${idx > 0 ? `
                <button onclick="deleteLevelRow(${idx})" class="text-slate-500 hover:text-rose-400 p-0.5 text-xs transition" title="Delete this level">
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

    // Consolidated Skills House Rule Definition (7 Default Merged Groups)
    const DEFAULT_CONSOLIDATED_SKILL_GROUPS = [
      {
        key: "athletics",
        name: "Athletics",
        stat: "str",
        acp: true,
        icon: "🏃",
        components: ["climb", "jump", "swim"],
        compLabels: "Climb + Jump + Swim",
        desc: "Combines Climb, Jump, and Swim into a single physical athletics skill."
      },
      {
        key: "stealth",
        name: "Stealth",
        stat: "dex",
        acp: true,
        icon: "🥷",
        components: ["hide", "move_silently"],
        compLabels: "Hide + Move Silently",
        desc: "Combines visual concealment (Hide) and silent movement (Move Silently)."
      },
      {
        key: "perception",
        name: "Perception",
        stat: "wis",
        acp: false,
        icon: "👁️",
        components: ["spot", "listen"],
        compLabels: "Spot + Listen",
        desc: "Combines visual awareness (Spot) and auditory awareness (Listen)."
      },
      {
        key: "acrobatics",
        name: "Acrobatics",
        stat: "dex",
        acp: true,
        icon: "🤸",
        components: ["tumble", "balance", "escape_artist"],
        compLabels: "Tumble + Balance + Escape Artist",
        desc: "Combines Tumble, Balance, and Escape Artist."
      },
      {
        key: "thievery",
        name: "Thievery",
        stat: "dex",
        acp: false,
        icon: "🗝️",
        components: ["open_lock", "disable_device", "sleight_of_hand"],
        compLabels: "Open Lock + Disable Device + Sleight of Hand",
        desc: "Combines lockpicking, disabling traps, and legerdemain."
      },
      {
        key: "diplomacy_merged",
        name: "Persuasion & Social",
        stat: "cha",
        acp: false,
        icon: "🗣️",
        components: ["diplomacy", "gather_information"],
        compLabels: "Diplomacy + Gather Information",
        desc: "Combines social persuasion (Diplomacy) and urban rumor gathering (Gather Information)."
      },
      {
        key: "linguistics",
        name: "Linguistics",
        stat: "int",
        acp: false,
        icon: "📜",
        components: ["decipher_script", "forgery"],
        compLabels: "Decipher Script + Forgery",
        desc: "Combines deciphering ancient scripts and creating/detecting forgeries."
      }
    ];

    function getConsolidatedSkillGroups() {
      if (character?.settings?.consolidatedSkillGroups && Array.isArray(character.settings.consolidatedSkillGroups) && character.settings.consolidatedSkillGroups.length > 0) {
        return character.settings.consolidatedSkillGroups;
      }
      return JSON.parse(JSON.stringify(DEFAULT_CONSOLIDATED_SKILL_GROUPS));
    }
    const DND35_CONSOLIDATED_SKILLS = DEFAULT_CONSOLIDATED_SKILL_GROUPS;
    if (typeof window !== 'undefined') {
      window.DEFAULT_CONSOLIDATED_SKILL_GROUPS = DEFAULT_CONSOLIDATED_SKILL_GROUPS;
      window.getConsolidatedSkillGroups = getConsolidatedSkillGroups;
      window.DND35_CONSOLIDATED_SKILLS = DND35_CONSOLIDATED_SKILLS;
    }

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
      if (btnAll) btnAll.className = filterMode === 'all' ? 'ui-btn-sm h-7 px-2.5 rounded-lg text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer inline-flex items-center' : 'ui-btn-sm h-7 px-2.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer inline-flex items-center';
      if (btnClass) btnClass.className = filterMode === 'class' ? 'ui-btn-sm h-7 px-2.5 rounded-lg text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer inline-flex items-center' : 'ui-btn-sm h-7 px-2.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer inline-flex items-center';
      if (btnTrained) btnTrained.className = filterMode === 'trained' ? 'ui-btn-sm h-7 px-2.5 rounded-lg text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer inline-flex items-center' : 'ui-btn-sm h-7 px-2.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer inline-flex items-center';
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
        if (btnAll) btnAll.className = savedFilter === 'all' ? 'ui-btn-sm h-7 px-2.5 rounded-md text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer inline-flex items-center justify-center' : 'ui-btn-sm h-7 px-2.5 rounded-md text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer inline-flex items-center justify-center';
        if (btnClass) btnClass.className = savedFilter === 'class' ? 'ui-btn-sm h-7 px-2.5 rounded-md text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer inline-flex items-center justify-center' : 'ui-btn-sm h-7 px-2.5 rounded-md text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer inline-flex items-center justify-center';
        if (btnTrained) btnTrained.className = savedFilter === 'trained' ? 'ui-btn-sm h-7 px-2.5 rounded-md text-[11px] font-bold bg-amber-600 text-white transition cursor-pointer inline-flex items-center justify-center' : 'ui-btn-sm h-7 px-2.5 rounded-md text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer inline-flex items-center justify-center';

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
            const cDef = (typeof getAvailableClassDefs === 'function' ? getAvailableClassDefs()[cName] : null)
              || (typeof RuleEngine !== 'undefined' && RuleEngine.getClassDef ? RuleEngine.getClassDef(cName) : null)
              || (typeof DND35_CLASS_DEFS !== 'undefined' && DND35_CLASS_DEFS[cName] ? DND35_CLASS_DEFS[cName] : null)
              || { skills: 2 };
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
        getConsolidatedSkillGroups().forEach(conDef => {
          const compSkills = char.skills.filter(s => (conDef.components || []).includes(s.key));
          (conDef.components || []).forEach(k => handledKeys.add(k));
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
      const conGroups = getConsolidatedSkillGroups();
      const consolidated = isMerged ? conGroups.find(c => c.key === skillKey) : null;

      if (consolidated) {
        // Toggle all components
        const compSkills = (character.skills || []).filter(s => (consolidated.components || []).includes(s.key));
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
      const conGroups = getConsolidatedSkillGroups();
      const consolidated = isMerged ? conGroups.find(c => c.key === skillKey) : null;

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
    let _scmWorkingGroups = [];

    function _recalcConsolidatedGroupFlags(group) {
      if (!group) return;
      const comps = group.components || [];
      group.acp = comps.some(k => {
        const c = DND35_CORE_SKILLS.find(s => s.key === k);
        return c ? Boolean(c.acp) : false;
      });
      const names = comps.map(k => {
        const c = DND35_CORE_SKILLS.find(s => s.key === k);
        return c ? c.name : k;
      });
      group.compLabels = names.join(' + ');
    }

    function renderConsolidatedSkillGroupsEditor() {
      const container = document.getElementById('consolidated-groups-editor-list');
      const countBadge = document.getElementById('scm-groups-count-badge');
      if (countBadge) countBadge.textContent = String(_scmWorkingGroups.length);
      if (!container) return;

      if (_scmWorkingGroups.length === 0) {
        container.innerHTML = `
          <div class="p-4 text-center text-xs text-slate-400 bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
            No skill groups defined. Click <strong>+ Add Skill Group</strong> or <strong>Reset Defaults</strong> to create groups.
          </div>
        `;
        return;
      }

      const statOptions = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

      container.innerHTML = _scmWorkingGroups.map((group, gIdx) => {
        const compKeys = new Set(group.components || []);
        const compBadges = (group.components || []).map(cKey => {
          const core = DND35_CORE_SKILLS.find(s => s.key === cKey);
          const name = core ? core.name : cKey;
          return `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 shadow-xs">
              <span>${name}</span>
              <button type="button" onclick="removeSkillFromConsolidatedGroup(${gIdx}, '${cKey}')" class="text-rose-400 hover:text-rose-200 font-bold ml-0.5 text-xs cursor-pointer" title="Remove ${name} from this group">&times;</button>
            </span>
          `;
        }).join('');

        const availableSkills = DND35_CORE_SKILLS.filter(s => !compKeys.has(s.key));
        const selectOptions = availableSkills.map(s => {
          const inOther = _scmWorkingGroups.findIndex((og, ogIdx) => ogIdx !== gIdx && (og.components || []).includes(s.key));
          const hint = inOther !== -1 ? ` (in ${_scmWorkingGroups[inOther].name})` : '';
          return `<option value="${s.key}">${s.name}${hint}</option>`;
        }).join('');

        const statSelectHtml = statOptions.map(st => `
          <option value="${st}" ${group.stat === st ? 'selected' : ''}>${st.toUpperCase()}</option>
        `).join('');

        return `
          <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 flex-1 min-w-0">
                <span class="text-sm shrink-0 cursor-default">${group.icon || '🔗'}</span>
                <input type="text"
                       value="${(group.name || '').replace(/"/g, '&quot;')}"
                       oninput="updateConsolidatedGroupName(${gIdx}, this.value)"
                       placeholder="Group Name..."
                       class="bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded px-2 py-0.5 text-xs text-white font-bold flex-1 min-w-[100px]" />
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <select onchange="updateConsolidatedGroupStat(${gIdx}, this.value)"
                        class="bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-[10px] rounded px-1.5 py-1 focus:outline-none focus:border-amber-500 cursor-pointer">
                  ${statSelectHtml}
                </select>
                <button type="button"
                        onclick="deleteConsolidatedSkillGroup(${gIdx})"
                        class="p-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white text-xs transition cursor-pointer"
                        title="Delete Group">
                  🗑️
                </button>
              </div>
            </div>

            <!-- Member skills badges -->
            <div class="flex flex-wrap items-center gap-1 min-h-[24px]">
              ${compBadges || '<span class="text-[10px] text-slate-500 italic">No skills in this group. Add skills below.</span>'}
            </div>

            <!-- Add Skill dropdown -->
            <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[10px]">
              <span class="text-slate-400">
                ACP: <strong class="${group.acp ? 'text-rose-400' : 'text-emerald-400'}">${group.acp ? 'Yes (-ACP)' : 'No'}</strong>
              </span>
              <select onchange="addSkillToConsolidatedGroup(${gIdx}, this.value); this.value='';"
                      class="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded px-2 py-0.5 text-[10px] text-slate-300 font-semibold focus:outline-none cursor-pointer max-w-[190px]">
                <option value="">+ Add Skill...</option>
                ${selectOptions}
              </select>
            </div>
          </div>
        `;
      }).join('');
    }

    function updateConsolidatedGroupName(idx, val) {
      if (_scmWorkingGroups[idx]) {
        _scmWorkingGroups[idx].name = val.trim() || 'Custom Group';
        _scmWorkingGroups[idx].key = val.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32) || `group_${idx}`;
      }
    }

    function updateConsolidatedGroupStat(idx, val) {
      if (_scmWorkingGroups[idx]) {
        _scmWorkingGroups[idx].stat = val.toLowerCase();
      }
    }

    function removeSkillFromConsolidatedGroup(gIdx, skillKey) {
      if (!_scmWorkingGroups[gIdx]) return;
      _scmWorkingGroups[gIdx].components = (_scmWorkingGroups[gIdx].components || []).filter(k => k !== skillKey);
      _recalcConsolidatedGroupFlags(_scmWorkingGroups[gIdx]);
      renderConsolidatedSkillGroupsEditor();
    }

    function addSkillToConsolidatedGroup(gIdx, skillKey) {
      if (!skillKey || !_scmWorkingGroups[gIdx]) return;
      _scmWorkingGroups.forEach((g, idx) => {
        if (idx !== gIdx && Array.isArray(g.components)) {
          g.components = g.components.filter(k => k !== skillKey);
          _recalcConsolidatedGroupFlags(g);
        }
      });
      if (!Array.isArray(_scmWorkingGroups[gIdx].components)) {
        _scmWorkingGroups[gIdx].components = [];
      }
      if (!_scmWorkingGroups[gIdx].components.includes(skillKey)) {
        _scmWorkingGroups[gIdx].components.push(skillKey);
      }
      _recalcConsolidatedGroupFlags(_scmWorkingGroups[gIdx]);
      renderConsolidatedSkillGroupsEditor();
    }

    function deleteConsolidatedSkillGroup(idx) {
      _scmWorkingGroups.splice(idx, 1);
      renderConsolidatedSkillGroupsEditor();
    }

    function addNewConsolidatedSkillGroup() {
      const newIdx = _scmWorkingGroups.length + 1;
      _scmWorkingGroups.push({
        key: `custom_group_${Date.now()}`,
        name: `Custom Group ${newIdx}`,
        stat: "dex",
        acp: false,
        icon: "✨",
        components: [],
        compLabels: "",
        desc: "Custom consolidated skill group."
      });
      renderConsolidatedSkillGroupsEditor();
      const container = document.getElementById('consolidated-groups-editor-list');
      if (container) container.scrollTop = container.scrollHeight;
    }

    function resetConsolidatedSkillGroupsToDefault() {
      _scmWorkingGroups = JSON.parse(JSON.stringify(DEFAULT_CONSOLIDATED_SKILL_GROUPS));
      renderConsolidatedSkillGroupsEditor();
    }

    function setScmMode(isMerged) {
      _scmSelectedMode = !!isMerged;
      const btnMerge = document.getElementById('scm-btn-mode-merge');
      const btnSplit = document.getElementById('scm-btn-mode-split');
      const badgeMerge = document.getElementById('scm-badge-merge');
      const badgeSplit = document.getElementById('scm-badge-split');
      const gCount = (_scmWorkingGroups && _scmWorkingGroups.length > 0) ? _scmWorkingGroups.length : getConsolidatedSkillGroups().length;

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
            badgeMerge.textContent = `${gCount} Groups`;
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
      _scmWorkingGroups = JSON.parse(JSON.stringify(getConsolidatedSkillGroups()));
      setScmMode(isMerged);
      renderConsolidatedSkillGroupsEditor();
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
      character.settings.consolidatedSkillGroups = JSON.parse(JSON.stringify(_scmWorkingGroups));

      const groups = _scmWorkingGroups;
      const groupCount = groups.length;

      if (saveDb && typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const ruleName = `Skill Consolidation (${groupCount} Groups)`;
        const existingIdx = masterDb.findIndex(m => (m.name || '').toLowerCase().startsWith('skill consolidation'));
        const ruleData = {
          name: ruleName,
          type: "House Rule",
          slot: "None",
          parent: "Alternative Rules",
          prereq: "-",
          source: "Unearthed Arcana / Pathfinder 1e",
          benefit: isEnabled ? `Skills consolidated into ${groupCount} groups (${groups.map(g => g.name).join(', ')}).` : "Standard 46 D&D 3.5e RAW skills active.",
          bonusType: "Rule",
          scope: "Skills",
          action: "Passive",
          actionType: "Passive",
          role: "House Rule",
          tags: ["skills", "consolidation", "houserule"],
          consolidatedSkillGroups: JSON.parse(JSON.stringify(groups)),
          skillMapping: groups.reduce((acc, g) => {
            acc[g.key] = g.components || [];
            return acc;
          }, {})
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
        breakdown: isEnabled ? `Consolidated Skills (${groupCount} Groups) enabled!` : 'Switched back to Standard D&D 3.5e RAW (46 Skills)!',
        total: isEnabled ? 'Consolidated' : 'RAW'
      });
    }

    if (typeof window !== 'undefined') {
      window.renderConsolidatedSkillGroupsEditor = renderConsolidatedSkillGroupsEditor;
      window.updateConsolidatedGroupName = updateConsolidatedGroupName;
      window.updateConsolidatedGroupStat = updateConsolidatedGroupStat;
      window.removeSkillFromConsolidatedGroup = removeSkillFromConsolidatedGroup;
      window.addSkillToConsolidatedGroup = addSkillToConsolidatedGroup;
      window.deleteConsolidatedSkillGroup = deleteConsolidatedSkillGroup;
      window.addNewConsolidatedSkillGroup = addNewConsolidatedSkillGroup;
      window.resetConsolidatedSkillGroupsToDefault = resetConsolidatedSkillGroupsToDefault;
      window.openSkillConsolidationModal = openSkillConsolidationModal;
      window.closeSkillConsolidationModal = closeSkillConsolidationModal;
      window.saveSkillConsolidationSettings = saveSkillConsolidationSettings;
      window.setScmMode = setScmMode;
      window.toggleSkillConsolidation = toggleSkillConsolidation;
    }

    // ====================================================
    // CLERIC DOMAIN PICKER MODAL (D&D 3.5e RAW PHB p. 32)
    // ====================================================
    window._activeClericDomainPickerCtx = { levelIdx: 0, slotIdx: 0 };

    function getDomainSpellsByDomainMap() {
      const domainSpellsMap = {};
      if (typeof window !== 'undefined' && window.SrdCompendium && typeof window.SrdCompendium.getAllDomains === 'function') {
        const domains = window.SrdCompendium.getAllDomains();
        if (Array.isArray(domains) && domains.length > 0) {
          domains.forEach(d => {
            if (!d || !d.name) return;
            domainSpellsMap[d.name] = (d.spells || []).map(s => ({ level: s.level, name: s.name, id: s.id }));
          });
          return domainSpellsMap;
        }
      }
      const allSpells = typeof getCombinedSpellManeuverCatalog === 'function'
        ? getCombinedSpellManeuverCatalog()
        : (window.SrdCompendium && typeof window.SrdCompendium.getAllLoaded === 'function' ? window.SrdCompendium.getAllLoaded(['Spell']) : []);
      allSpells.forEach(sp => {
        const domObj = sp?.learnedAt?.domain;
        if (!domObj || typeof domObj !== 'object') return;
        Object.entries(domObj).forEach(([domName, lvl]) => {
          const numLvl = Number(lvl);
          if (isNaN(numLvl)) return;
          if (!domainSpellsMap[domName]) domainSpellsMap[domName] = [];
          if (!domainSpellsMap[domName].some(x => x.level === numLvl && x.name === sp.name)) {
            domainSpellsMap[domName].push({ level: numLvl, name: sp.name });
          }
        });
      });
      Object.values(domainSpellsMap).forEach(arr => arr.sort((a, b) => a.level - b.level));
      return domainSpellsMap;
    }

    function ensureClericDomainModalDom() {
      let modal = document.getElementById('cleric-domain-picker-modal');
      if (modal) return modal;
      modal = document.createElement('div');
      modal.id = 'cleric-domain-picker-modal';
      modal.className = 'hidden fixed inset-0 z-[180] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3';
      modal.innerHTML = `
        <div class="bg-slate-900 border border-yellow-600/70 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
          <div class="px-4 py-3 bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 border-b border-yellow-700/50 flex items-center justify-between gap-2">
            <div>
              <h3 id="cleric-domain-modal-title" class="text-sm font-extrabold text-yellow-300 flex items-center gap-2">
                <span>⚜️</span>
                <span>Select Cleric Domain (D&D 3.5e RAW)</span>
              </h3>
              <p class="text-[11px] text-slate-400">Choose one of your deity's two domains to gain its Granted Power and +1 Domain Spell Slot per spell level (1st–9th).</p>
            </div>
            <button type="button" onclick="closeClericDomainPickerModal()" class="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer">✕</button>
          </div>
          <div id="cleric-domain-deity-banner" class="px-3.5 py-2 bg-slate-950/90 border-b border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-2"></div>
          <div class="p-3 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2">
            <div class="relative flex-1 min-w-[200px]">
              <input id="cleric-domain-search-input" type="text" oninput="renderClericDomainPickerList()" placeholder="Search domains, granted powers, or domain spells..." class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white font-bold focus:border-yellow-500 focus:outline-none placeholder-slate-500">
              <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            </div>
            <button type="button" onclick="if(typeof openCustomDomainEditorModal==='function') openCustomDomainEditorModal();" class="text-xs bg-purple-950/80 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-600/70 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer">
              <span>⚜️</span>
              <span>+ Create / Rule Master AI Domain</span>
            </button>
            <label class="inline-flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-yellow-600/60" title="Allow selecting domains outside your Deity's portfolio or Alignment restrictions (House Rule / DM Override)">
              <input id="cleric-domain-dm-override" type="checkbox" onchange="window._clericDomainDmOverride = this.checked; renderClericDomainPickerList();" class="accent-amber-500 rounded cursor-pointer">
              <span>DM Override (Unlock All)</span>
            </label>
            <div id="cleric-domain-current-summary" class="text-[11px] text-yellow-300 font-bold"></div>
          </div>
          <div id="cleric-domain-picker-list" class="p-3 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-800/80"></div>
        </div>
      `;
      document.body.appendChild(modal);
      return modal;
    }

    function openClericDomainPickerModal(levelIdx = 0, slotIdx = 0) {
      window._activeClericDomainPickerCtx = { levelIdx: Number(levelIdx) || 0, slotIdx: Number(slotIdx) || 0 };
      const modal = ensureClericDomainModalDom();
      const titleEl = document.getElementById('cleric-domain-modal-title');
      if (titleEl) {
        titleEl.innerHTML = `<span>⚜️</span><span>Select Cleric Domain (${slotIdx + 1}/2) — D&D 3.5e SRD</span>`;
      }
      const searchEl = document.getElementById('cleric-domain-search-input');
      if (searchEl) searchEl.value = '';
      const dmToggle = document.getElementById('cleric-domain-dm-override');
      if (dmToggle) dmToggle.checked = Boolean(window._clericDomainDmOverride);
      modal.classList.remove('hidden');
      renderClericDomainPickerList();

      if (window.SrdCompendium && typeof window.SrdCompendium.ensureChunkLoaded === 'function') {
        window.SrdCompendium.ensureChunkLoaded('srd_spells.json').then(() => {
          renderClericDomainPickerList();
        }).catch(() => {});
      }
    }

    function closeClericDomainPickerModal() {
      const modal = document.getElementById('cleric-domain-picker-modal');
      if (modal) modal.classList.add('hidden');
    }

    function renderClericDomainPickerList() {
      const listEl = document.getElementById('cleric-domain-picker-list');
      if (!listEl) return;
      const ctx = window._activeClericDomainPickerCtx || { levelIdx: 0, slotIdx: 0 };
      const chosen = (typeof getCharacterClericDomains === 'function')
        ? getCharacterClericDomains(character)
        : (Array.isArray(character?.spellcasting?.domains) ? character.spellcasting.domains.filter(Boolean) : []);
      const currentSlotDomain = chosen[ctx.slotIdx] || null;
      const otherSlotDomain = chosen[ctx.slotIdx === 0 ? 1 : 0] || null;
      const dmOverride = Boolean(window._clericDomainDmOverride);

      const deityMeta = (typeof getCharacterDeityMeta === 'function')
        ? getCharacterDeityMeta(character)
        : { found: false, isPhilosophical: true, name: character?.deity || 'None', alignment: 'Any', weapon: '-', domains: [], icon: '🌀' };
      const charAlign = character?.alignment || 'Unspecified';
      const alignCompat = (typeof checkClericDeityAlignmentCompatibility === 'function')
        ? checkClericDeityAlignmentCompatibility(charAlign, deityMeta)
        : { compatible: true, reason: '' };

      // Render Deity & Alignment Banner
      const bannerEl = document.getElementById('cleric-domain-deity-banner');
      if (bannerEl) {
        const hasSpecificDeity = deityMeta.found && !deityMeta.isPhilosophical && Array.isArray(deityMeta.domains) && deityMeta.domains.length > 0;
        const portfolioText = hasSpecificDeity
          ? `<span class="text-yellow-300 font-bold">${deityMeta.domains.join(', ')}</span>`
          : `<span class="text-slate-400 italic">All Alignment-Compatible Domains (Philosophical / No Deity Selected)</span>`;
        const favWepText = (deityMeta.weapon && deityMeta.weapon !== '-')
          ? `<span class="text-sky-300 font-mono">⚔️ Favored Weapon: ${deityMeta.weapon}</span>`
          : '';
        const alignWarnHtml = (!alignCompat.compatible)
          ? `<div class="w-full mt-1 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-600/70 text-rose-200 text-[10px] font-bold flex items-center justify-between gap-2">
               <span>⚠️ ${alignCompat.reason}</span>
               <button type="button" onclick="closeClericDomainPickerModal(); if(typeof openStatDistributionModal==='function') openStatDistributionModal();" class="underline text-rose-100 hover:text-white cursor-pointer shrink-0">Edit Alignment / Deity</button>
             </div>`
          : '';

        bannerEl.innerHTML = `
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="text-slate-300">⚖️ <strong>Alignment:</strong> <span class="text-white font-bold">${charAlign}</span></span>
            <span class="text-slate-300">${deityMeta.icon || '☀️'} <strong>Deity:</strong> <span class="text-amber-300 font-bold">${deityMeta.name}</span> ${deityMeta.alignment && deityMeta.alignment !== 'Any' ? `<span class="text-slate-400">(${deityMeta.alignment})</span>` : ''}</span>
            ${favWepText}
            <span class="text-slate-300">⚜️ <strong>Deity Portfolio:</strong> ${portfolioText}</span>
          </div>
          <button type="button" onclick="closeClericDomainPickerModal(); if(typeof openStatDistributionModal==='function') openStatDistributionModal();" class="text-[10px] text-amber-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-0.5 rounded cursor-pointer shrink-0">Change Deity / Alignment</button>
          ${alignWarnHtml}
        `;
      }

      const summaryEl = document.getElementById('cleric-domain-current-summary');
      if (summaryEl) {
        if (currentSlotDomain) {
          summaryEl.innerHTML = `Slot ${ctx.slotIdx + 1}: <span class="text-white">${currentSlotDomain}</span> <button type="button" onclick="clearClericDomainSlot(${ctx.slotIdx})" class="ml-2 text-[10px] text-rose-300 hover:text-white bg-rose-950/80 border border-rose-700 px-2 py-0.5 rounded cursor-pointer">Clear Slot</button>`;
        } else {
          summaryEl.textContent = `Slot ${ctx.slotIdx + 1}: Empty`;
        }
      }

      const query = (document.getElementById('cleric-domain-search-input')?.value || '').toLowerCase().trim();
      
      // Load Compendium + Custom Domains (character.customDb, masterDb, localStorage)
      let customDomainsList = [];
      if (typeof character !== 'undefined' && Array.isArray(character.customDb)) {
        customDomainsList.push(...character.customDb.filter(e => e && (e.type === 'Domain' || e.category === 'Cleric Domain')));
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        customDomainsList.push(...masterDb.filter(e => e && (e.type === 'Domain' || e.category === 'Cleric Domain')));
      }
      try {
        const stored = localStorage.getItem('dnd35_custom_domains');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) customDomainsList.push(...parsed);
        }
      } catch (e) {}

      const compendiumDomains = (window.SrdCompendium && typeof window.SrdCompendium.getAllDomains === 'function')
        ? window.SrdCompendium.getAllDomains()
        : [];

      const domainMap = new Map();
      compendiumDomains.forEach(d => {
        if (d && d.name) domainMap.set(d.name.toLowerCase(), d);
      });
      customDomainsList.forEach(d => {
        if (d && d.name) domainMap.set(d.name.toLowerCase(), d);
      });
      const allDomains = Array.from(domainMap.values());
      const domainSpellsMap = getDomainSpellsByDomainMap();

      const entries = allDomains.filter(d => {
        if (!d || !d.name) return false;
        if (!query) return true;
        const gp = String(d.grantedPower?.description || d.description || '').toLowerCase();
        const spList = (domainSpellsMap[d.name] || d.spells || []).map(s => (s.name || '').toLowerCase()).join(' ');
        return d.name.toLowerCase().includes(query) || gp.includes(query) || spList.includes(query);
      }).map(d => {
        const domName = d.name;
        const meta = {
          grantedPower: d.grantedPower?.description || d.description || '',
          classSkills: d.grantedPower?.classSkills || d.classSkills || [],
          spells: d.spells || [],
          source: d.source || (d.isCustom ? 'Custom Domain' : 'PHB / SRD')
        };
        const elig = (typeof checkClericDomainEligibility === 'function')
          ? checkClericDomainEligibility(domName, character)
          : { eligible: true, alignmentBlocked: false, deityBlocked: false, inDeityPortfolio: false, reason: '' };
        return { domName, meta, elig };
      });

      if (entries.length === 0) {
        const safeQ = query.replace(/"/g, '&quot;').replace(/'/g, "\\'");
        listEl.innerHTML = `
          <div class="py-10 text-center space-y-3">
            <span class="text-3xl block">⚜️</span>
            <p class="text-xs text-slate-300">No domain matching "<strong>${query}</strong>" found in compendium.</p>
            <button type="button" onclick="if(typeof openCustomDomainEditorModal==='function') openCustomDomainEditorModal({ name: '${safeQ}' });" class="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition inline-flex items-center gap-2 cursor-pointer active:scale-95">
              <span>🔮</span>
              <span>Create / Rule Master AI "${query}" Domain</span>
            </button>
          </div>
        `;
        return;
      }

      // Sort: 1. Currently selected in this slot, 2. Eligible & in Deity Portfolio, 3. Eligible, 4. Restricted
      entries.sort((a, b) => {
        const aCur = a.domName === currentSlotDomain ? 1 : 0;
        const bCur = b.domName === currentSlotDomain ? 1 : 0;
        if (aCur !== bCur) return bCur - aCur;
        const aElig = a.elig.eligible ? 1 : 0;
        const bElig = b.elig.eligible ? 1 : 0;
        if (aElig !== bElig) return bElig - aElig;
        const aPort = a.elig.inDeityPortfolio ? 1 : 0;
        const bPort = b.elig.inDeityPortfolio ? 1 : 0;
        if (aPort !== bPort) return bPort - aPort;
        return a.domName.localeCompare(b.domName);
      });

      listEl.innerHTML = entries.map(({ domName, meta, elig }) => {
        const isCurrent = domName === currentSlotDomain;
        const isOther = domName === otherSlotDomain;
        const canSelect = elig.eligible || dmOverride;
        const spells = domainSpellsMap[domName] || [];
        const spellsBadges = spells.length > 0
          ? spells.map(s => `<span class="text-[10px] bg-slate-950 text-amber-200/90 border border-slate-800 px-1.5 py-0.5 rounded font-mono"><strong class="text-yellow-400">${s.level}:</strong> ${s.name}</span>`).join(' ')
          : `<span class="text-[10px] text-slate-500 italic">Loading domain spells...</span>`;

        let statusBadges = '';
        if (elig.inDeityPortfolio) {
          statusBadges += `<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/90 text-yellow-300 border border-yellow-600/80 font-bold">${deityMeta.icon || '☀️'} ${deityMeta.name}'s Portfolio</span>`;
        }
        if (domName === 'War' && deityMeta.weapon && deityMeta.weapon !== '-') {
          statusBadges += `<span class="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/90 text-sky-300 border border-sky-600/80 font-bold">⚔️ Grants Weapon Focus (${deityMeta.weapon})</span>`;
        }
        if (!elig.eligible) {
          statusBadges += `<span class="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-700/80 font-bold" title="${elig.reason}">🔒 ${elig.alignmentBlocked ? 'Alignment Restricted' : `Not in ${deityMeta.name}'s Domains`}</span>`;
        }

        let btnHtml = '';
        if (isCurrent) {
          btnHtml = `<span class="text-[11px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-600 px-2.5 py-1 rounded-lg">✓ Selected</span>`;
        } else if (isOther) {
          btnHtml = `<span class="text-[11px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg" title="Already selected in your other Domain slot">Other Slot</span>`;
        } else if (canSelect) {
          btnHtml = `<button type="button" onclick="selectClericDomain('${domName.replace(/'/g, "\\'")}')" class="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-lg border border-yellow-400 shadow transition cursor-pointer">⚜️ Select</button>`;
        } else {
          btnHtml = `<span class="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg cursor-not-allowed" title="${elig.reason}">🔒 Locked</span>`;
        }

        return `
          <div class="pt-2.5 pb-2.5 flex items-start justify-between gap-3 ${isCurrent ? 'bg-amber-950/20 px-2 rounded-lg' : (!canSelect ? 'opacity-55' : '')}">
            <div class="space-y-1.5 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-extrabold text-yellow-300 flex items-center gap-1">⚜️ ${domName} Domain</span>
                <span class="text-[10px] text-slate-500 font-mono">${meta.source || 'PHB / SRD'}</span>
                ${statusBadges}
              </div>
              <p class="text-[11px] text-slate-200"><strong class="text-amber-300">Granted Power:</strong> ${meta.grantedPower}</p>
              ${!elig.eligible ? `<p class="text-[10px] text-rose-300/90 font-semibold">${elig.reason}</p>` : ''}
              <div class="flex flex-wrap gap-1 pt-0.5">${spellsBadges}</div>
            </div>
            <div class="shrink-0 pt-1">${btnHtml}</div>
          </div>
        `;
      }).join('');
    }

    function syncClericDomainsToCharacterSpecialAbilities() {
      if (!character) return;
      const chosen = (typeof getCharacterClericDomains === 'function')
        ? getCharacterClericDomains(character)
        : (Array.isArray(character?.spellcasting?.domains) ? character.spellcasting.domains.filter(Boolean) : []);
      const deityMeta = (typeof getCharacterDeityMeta === 'function') ? getCharacterDeityMeta(character) : null;
      const favWeapon = (deityMeta && deityMeta.weapon && deityMeta.weapon !== '-') ? deityMeta.weapon : "Deity's Favored Weapon";

      const resolveDomainDef = (domName) => {
        if (!domName) return null;
        const lower = String(domName).toLowerCase().trim();
        let dDef = null;
        if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
          dDef = masterDb.find(e => e && (e.type === 'Domain' || e.category === 'Cleric Domain') && String(e.name || '').toLowerCase().trim() === lower);
        }
        if (!dDef && typeof character !== 'undefined' && Array.isArray(character.customDb)) {
          dDef = character.customDb.find(e => e && (e.type === 'Domain' || e.category === 'Cleric Domain') && String(e.name || '').toLowerCase().trim() === lower);
        }
        if (!dDef && window.SrdCompendium && typeof window.SrdCompendium.getDomain === 'function') {
          dDef = window.SrdCompendium.getDomain(domName);
        }
        if (!dDef && typeof DND35_CLERIC_DOMAINS === 'object') {
          dDef = DND35_CLERIC_DOMAINS[domName];
        }
        return dDef;
      };

      const resolveFeatDef = (featName) => {
        if (!featName) return null;
        const cleanFull = String(featName).replace(/^\[Domain Bonus\]\s*/i, '').trim();
        const baseName = cleanFull.replace(/\s*\([^)]*\)$/, '').trim();
        const fullLow = cleanFull.toLowerCase();
        const baseLow = baseName.toLowerCase();

        if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
          const m = masterDb.find(e => e && (e.type === 'Feat' || e.category === 'Feat') && (String(e.name || '').toLowerCase() === fullLow || String(e.name || '').toLowerCase() === baseLow));
          if (m) return m;
        }
        if (typeof character !== 'undefined' && Array.isArray(character.customDb)) {
          const c = character.customDb.find(e => e && (e.type === 'Feat' || e.category === 'Feat') && (String(e.name || '').toLowerCase() === fullLow || String(e.name || '').toLowerCase() === baseLow));
          if (c) return c;
        }
        if (window.SrdCompendium && typeof window.SrdCompendium.getByName === 'function') {
          const s = window.SrdCompendium.getByName(cleanFull, 'Feat') || window.SrdCompendium.getByName(baseName, 'Feat');
          if (s) return s;
        }
        if (Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
          const b = window.BUNDLED_SRD_CORE_CATALOG.find(i => i && i.type === 'Feat' && (String(i.name || '').toLowerCase() === fullLow || String(i.name || '').toLowerCase() === baseLow));
          if (b) return b;
        }
        return null;
      };

      // Domain-granted bonus feats (War -> Weapon Focus & Martial Weapon Proficiency; Darkness -> Blind-Fight; Rune -> Scribe Scroll; or custom domain grantedFeats)
      const domainGrantedFeatSpecs = [];
      const addGrantedFeatSpec = (rawFeatName, domName) => {
        const cleanName = String(rawFeatName || '').replace(/^\[Domain Bonus\]\s*/i, '').trim();
        if (!cleanName) return;
        let finalName = cleanName;
        if (/^(weapon focus|martial weapon proficiency|exotic weapon proficiency)$/i.test(cleanName) && favWeapon && favWeapon !== "Deity's Favored Weapon") {
          finalName = `${cleanName} (${favWeapon})`;
        }
        if (domainGrantedFeatSpecs.some(x => x.name.toLowerCase() === finalName.toLowerCase())) return;
        const featDef = resolveFeatDef(finalName);
        domainGrantedFeatSpecs.push({
          id: featDef?.id || ('feat-' + finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
          name: finalName,
          type: 'Feat',
          category: featDef?.category || 'Domain Bonus',
          source: `${domName} Domain (Bonus Feat)`,
          benefit: featDef?.shortDescription || featDef?.benefit || featDef?.description || `Granted bonus feat from ${domName} Domain.`,
          prereq: featDef?.prerequisites || featDef?.prereq || '-',
          prerequisites: featDef?.prerequisites || featDef?.prereq || '-',
          modifiers: Array.isArray(featDef?.modifiers) ? JSON.parse(JSON.stringify(featDef.modifiers)) : [],
          ruleFlags: featDef?.ruleFlags ? JSON.parse(JSON.stringify(featDef.ruleFlags)) : {},
          slotDiff: featDef?.slotDiff ?? featDef?.levelAdjustment,
          active: true,
          isDomainBonus: true,
          domainSource: domName
        });
      };

      if (chosen.includes('War')) {
        addGrantedFeatSpec(`Martial Weapon Proficiency (${favWeapon})`, 'War');
        addGrantedFeatSpec(`Weapon Focus (${favWeapon})`, 'War');
      }
      if (chosen.includes('Darkness')) {
        addGrantedFeatSpec('Blind-Fight', 'Darkness');
      }
      if (chosen.includes('Rune')) {
        addGrantedFeatSpec('Scribe Scroll', 'Rune');
      }

      // Check dynamic domain definitions for granted bonus feats (e.g., Planning -> Extend Spell, Undeath -> Extra Turning, or custom domains)
      chosen.forEach(domName => {
        const dDef = resolveDomainDef(domName);
        if (dDef) {
          const gFeats = dDef.grantedPower?.grantedFeats || dDef.grantedFeats || (dDef.grantedFeat ? [dDef.grantedFeat] : []);
          if (Array.isArray(gFeats)) {
            gFeats.forEach(featName => {
              if (featName && typeof featName === 'string') {
                addGrantedFeatSpec(featName, domName);
              }
            });
          }
        }
      });

      // Update specialAbilities and feats on Cleric 1 row
      if (Array.isArray(character.levelProgression)) {
        let clericSeen = 0;
        character.levelProgression.forEach(row => {
          if (!row) return;
          if (['cleric', 'rahip'].includes(String(row.className || '').toLowerCase().trim())) {
            clericSeen++;
            if (clericSeen === 1) {
              if (!Array.isArray(row.specialAbilities)) row.specialAbilities = [];
              row.specialAbilities = row.specialAbilities.filter(a => !/^⚜️\s*Domain:/i.test(String(a)) && !/^\[Domain:/i.test(String(a)));
              chosen.forEach(d => {
                row.specialAbilities.push(`⚜️ Domain: ${d}`);
              });
              if (!Array.isArray(row.feats)) row.feats = [];
              row.feats = row.feats.filter(f => {
                const fn = typeof f === 'string' ? f : (f?.name || '');
                return !fn.startsWith('[Domain Bonus]') && !(typeof f === 'object' && f?.isDomainBonus);
              });
              domainGrantedFeatSpecs.forEach(df => {
                row.feats.push(`[Domain Bonus] ${df.name}`);
              });
            }
          }
        });
      }

      // Sync top-level character.feats with full V2 Feat objects for RuleEngine, Metamagic, Prerequisites & Feat Cards
      if (!Array.isArray(character.feats)) character.feats = [];
      character.feats = character.feats.filter(f => {
        if (!f) return false;
        if (typeof f === 'object' && f.isDomainBonus) return false;
        const fName = typeof f === 'string' ? f : (f?.name || '');
        return !fName.startsWith('[Domain Bonus]');
      });
      domainGrantedFeatSpecs.forEach(df => {
        character.feats.push(df);
      });

      if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];
      character.specialAbilities = character.specialAbilities.filter(a => {
        if (!a) return false;
        if (typeof a === 'object' && a.isDomainBonus) return false;
        const n = typeof a === 'string' ? a : (a?.name || '');
        return !/^⚜️\s*Domain:/i.test(n) && !/\bDomain\s*\(Granted Power\)/i.test(n) && !/\bDomain\s*SLA\)/i.test(n);
      });
      chosen.forEach(d => {
        const meta = resolveDomainDef(d);
        const benefitText = (d === 'War' && favWeapon)
          ? `Free Martial Weapon Proficiency (${favWeapon}) and Weapon Focus (${favWeapon}).`
          : (meta?.grantedPower?.description || (typeof meta?.grantedPower === 'string' ? meta.grantedPower : '') || meta?.description || `${d} Domain Granted Power`);
        character.specialAbilities.push({
          name: `⚜️ ${d} Domain (Granted Power)`,
          source: 'Cleric Domain',
          category: 'Special Ability',
          benefit: benefitText,
          modifiers: Array.isArray(meta?.modifiers) ? JSON.parse(JSON.stringify(meta.modifiers)) : [],
          ruleFlags: meta?.ruleFlags ? JSON.parse(JSON.stringify(meta.ruleFlags)) : {},
          isDomainBonus: true,
          domainSource: d,
          active: true
        });

        // Also sync any explicit Domain Active SLA / Power into character.specialAbilities with full V2 relationships
        const slas = meta?.grantedPower?.spellLikeAbilities || meta?.spellLikeAbilities || [];
        if (Array.isArray(slas)) {
          slas.forEach(sla => {
            const slaName = typeof sla === 'string' ? sla : (sla?.name || '');
            const slaUses = (typeof sla === 'object' && sla?.uses) ? sla.uses : '1/day';
            if (!slaName || slaUses === 'None') return;
            let slaDef = null;
            if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
              slaDef = masterDb.find(e => e && String(e.name || '').toLowerCase() === slaName.toLowerCase());
            }
            if (!slaDef && window.SrdCompendium && typeof window.SrdCompendium.getByName === 'function') {
              slaDef = window.SrdCompendium.getByName(slaName, 'Spell') || window.SrdCompendium.getByName(slaName, 'Feat');
            }
            const slaDesc = sla?.desc || slaDef?.shortDescription || slaDef?.benefit || slaDef?.description || benefitText;
            character.specialAbilities.push({
              name: `⚜️ ${slaName} (${d} Domain SLA)`,
              source: `${d} Domain`,
              category: 'Spell-Like Ability',
              action: slaDef?.action || 'Standard Action',
              uses: slaUses,
              benefit: `[${slaUses}] ${slaDesc}`,
              modifiers: Array.isArray(slaDef?.modifiers) ? JSON.parse(JSON.stringify(slaDef.modifiers)) : [],
              damageParts: Array.isArray(slaDef?.damageParts) ? JSON.parse(JSON.stringify(slaDef.damageParts)) : [],
              ruleFlags: slaDef?.ruleFlags ? JSON.parse(JSON.stringify(slaDef.ruleFlags)) : {},
              isDomainBonus: true,
              domainSource: d,
              active: true
            });
          });
        }
      });

      if (typeof resolveClericEnergyPolicy === 'function' && character.spellcasting) {
        const policy = resolveClericEnergyPolicy(character);
        if (policy.forcedMode) {
          character.spellcasting.clericSpontaneousMode = policy.forcedMode;
        }
      }

      if (typeof autoSyncCharacterClassSkills === 'function') {
        autoSyncCharacterClassSkills(character, false);
      }
    }

    function selectClericDomain(domainName) {
      if (!character) return;
      if (!character.spellcasting) character.spellcasting = {};
      const ctx = window._activeClericDomainPickerCtx || { levelIdx: 0, slotIdx: 0 };
      const current = Array.isArray(character.spellcasting.domains) ? [...character.spellcasting.domains] : [];
      current[ctx.slotIdx] = domainName;
      character.spellcasting.domains = current.filter((d, idx) => idx < 2);

      syncClericDomainsToCharacterSpecialAbilities();
      if (typeof calculateDivineSlots === 'function') {
        calculateDivineSlots();
      }
      saveStateToStorage(true);
      closeClericDomainPickerModal();
      renderAll();

      const meta = (window.SrdCompendium && typeof window.SrdCompendium.getDomain === 'function')
        ? window.SrdCompendium.getDomain(domainName)
        : (typeof DND35_CLERIC_DOMAINS === 'object' ? DND35_CLERIC_DOMAINS[domainName] : null);
      showDiceTopToast({
        icon: '⚜️',
        title: `${domainName} Domain Selected`,
        breakdown: meta?.grantedPower?.description || meta?.grantedPower || meta?.description || `Granted Power & Domain Spells unlocked.`,
        total: `Domain ${ctx.slotIdx + 1}/2`
      });
    }

    function clearClericDomainSlot(slotIdx) {
      if (!character || !character.spellcasting || !Array.isArray(character.spellcasting.domains)) return;
      character.spellcasting.domains.splice(slotIdx, 1);
      syncClericDomainsToCharacterSpecialAbilities();
      if (typeof calculateDivineSlots === 'function') {
        calculateDivineSlots();
      }
      saveStateToStorage(true);
      renderClericDomainPickerList();
      renderAll();
    }

    // ====================================================
    // 🐾 COMPANION & MOUNT MANAGEMENT MODAL (Madde D)
    // ====================================================
    let _activeCompanionModalType = 'animal_companion';
    let _activeCompanionModalAnimalId = null;

    function isCharacterCompanionEligible(charObj) {
      const c = charObj || character;
      if (!c) return false;
      if (c.companion && c.companion.baseMonsterId) return true;

      const companionRegex = /animal companion|summon familiar|familiar|special mount|wild cohort|obtain familiar|improved familiar|draconic familiar|celestial familiar|dragonfamiliar|bonded mount/i;

      // Check feats
      const feats = Array.isArray(c.feats) ? c.feats : [];
      for (const f of feats) {
        const name = typeof f === 'string' ? f : (f?.name || '');
        if (companionRegex.test(name)) return true;
      }

      // Check specialAbilities
      const abilities = Array.isArray(c.specialAbilities) ? c.specialAbilities : [];
      for (const a of abilities) {
        const name = typeof a === 'string' ? a : (a?.name || '');
        if (companionRegex.test(name)) return true;
      }

      // Check levelProgression feats & classFeatures
      const prog = Array.isArray(c.levelProgression) ? c.levelProgression : [];
      for (const p of prog) {
        const pFeats = Array.isArray(p?.feats) ? p.feats : [];
        for (const fn of pFeats) {
          if (typeof fn === 'string' && companionRegex.test(fn)) return true;
        }
        const pFeatures = Array.isArray(p?.classFeatures) ? p.classFeatures : [];
        for (const cf of pFeatures) {
          if (typeof cf === 'string' && companionRegex.test(cf)) return true;
        }
      }

      return false;
    }

    function ensureCompanionModalDom() {
      let modal = document.getElementById('companion-modal');
      if (modal) return modal;

      modal = document.createElement('div');
      modal.id = 'companion-modal';
      modal.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto hidden';
      modal.innerHTML = `
        <div class="bg-[#0b1329] border border-amber-500/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
          <!-- Modal Header -->
          <div class="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-xl">🐾</span>
              <div>
                <h3 class="text-sm sm:text-base font-black text-white">Companion &amp; Mount Management</h3>
                <p class="text-[10px] text-slate-400">D&amp;D 3.5e RAW Template &amp; Progression System</p>
              </div>
            </div>
            <button type="button" onclick="closeCompanionModal()" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer">
              ✕
            </button>
          </div>

          <!-- Modal Scrollable Body -->
          <div id="companion-modal-body" class="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
            <!-- Dynamically populated by renderCompanionModalContent() -->
          </div>

          <!-- Modal Footer -->
          <div class="bg-slate-900/90 px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div>
              <button type="button" id="btn-companion-modal-dismiss" onclick="dismissCompanion()" class="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-xs transition cursor-pointer hidden">
                ✕ Dismiss Companion
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" onclick="closeCompanionModal()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer">
                Cancel
              </button>
              <button type="button" onclick="saveCompanionSelection()" class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs shadow transition cursor-pointer">
                ✓ Bind / Save Companion
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      return modal;
    }

    function openCompanionModal() {
      if (!isCharacterCompanionEligible(character)) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            icon: '🐾',
            title: 'Prerequisite Not Met',
            breakdown: 'Add the required feat or class feature (Animal Companion, Summon Familiar, Special Mount, Obtain Familiar, Wild Cohort) first.',
            total: 'Locked'
          });
        }
        return;
      }
      const modal = ensureCompanionModalDom();
      if (character && character.companion) {
        _activeCompanionModalType = character.companion.type || 'animal_companion';
        _activeCompanionModalAnimalId = character.companion.baseMonsterId || null;
      } else {
        // Auto-select based on classes
        const classesLower = String(character?.classes || '').toLowerCase();
        if (/wizard|sorcerer/.test(classesLower) && !/druid|ranger/.test(classesLower)) {
          _activeCompanionModalType = 'familiar';
        } else if (/paladin/.test(classesLower) && !/druid|ranger/.test(classesLower)) {
          _activeCompanionModalType = 'special_mount';
        } else {
          _activeCompanionModalType = 'animal_companion';
        }
      }

      // Ensure srd_monsters is loaded
      if (window.SrdCompendium && typeof window.SrdCompendium.ensureChunkLoaded === 'function') {
        window.SrdCompendium.ensureChunkLoaded('srd_monsters.json').then(() => {
          renderCompanionModalContent();
        }).catch(() => {});
      }

      modal.classList.remove('hidden');
      renderCompanionModalContent();
    }

    function closeCompanionModal() {
      const modal = document.getElementById('companion-modal');
      if (modal) modal.classList.add('hidden');
    }

    function onCompanionTypeChange(newType) {
      _activeCompanionModalType = newType;
      _activeCompanionModalAnimalId = null;
      renderCompanionModalContent();
    }

    function onCompanionAnimalChange(animalId) {
      _activeCompanionModalAnimalId = animalId;
      renderCompanionModalContent();
    }

    function renderCompanionModalContent() {
      const bodyEl = document.getElementById('companion-modal-body');
      if (!bodyEl || !character) return;

      const compData = (window.SrdCompendium && typeof window.SrdCompendium.getCompanionsData === 'function')
        ? window.SrdCompendium.getCompanionsData()
        : null;

      const allowedAnimals = (window.SrdCompendium && typeof window.SrdCompendium.getAllowedAnimals === 'function')
        ? window.SrdCompendium.getAllowedAnimals(_activeCompanionModalType)
        : [];

      if (!_activeCompanionModalAnimalId && allowedAnimals.length > 0) {
        _activeCompanionModalAnimalId = allowedAnimals[0].id;
      }

      // Calculate Effective Level
      const classesStr = String(character.classes || '');
      let effectiveLevel = 1;
      let levelNote = '';
      if (_activeCompanionModalType === 'animal_companion') {
        let lvl = 0;
        const dM = classesStr.match(/druid\s*(\d+)/i);
        const rM = classesStr.match(/ranger\s*(\d+)/i);
        if (dM) lvl += parseInt(dM[1], 10);
        if (rM) {
          const rLvl = parseInt(rM[1], 10);
          if (rLvl >= 4) lvl += Math.floor(rLvl / 2);
        }
        if (lvl === 0) lvl = parseInt(character.level || 1, 10);
        const curAnimal = allowedAnimals.find(a => a.id === _activeCompanionModalAnimalId);
        const adj = (curAnimal && curAnimal.levelAdj) ? curAnimal.levelAdj : 0;
        effectiveLevel = Math.max(1, lvl + adj);
        levelNote = `Class Level: ${lvl}${adj !== 0 ? ` • Animal Level Adj: ${adj}` : ''} ➔ Effective Druid Level: ${effectiveLevel}`;
      } else if (_activeCompanionModalType === 'familiar') {
        let lvl = 0;
        const wM = classesStr.match(/wizard\s*(\d+)/i);
        const sM = classesStr.match(/sorcerer\s*(\d+)/i);
        if (wM) lvl += parseInt(wM[1], 10);
        if (sM) lvl += parseInt(sM[1], 10);
        if (lvl === 0) lvl = parseInt(character.level || 1, 10);
        effectiveLevel = Math.max(1, lvl);
        levelNote = `Master Caster Level: ${effectiveLevel}`;
      } else if (_activeCompanionModalType === 'special_mount') {
        let lvl = 0;
        const pM = classesStr.match(/paladin\s*(\d+)/i);
        if (pM) lvl += parseInt(pM[1], 10);
        if (lvl === 0) lvl = parseInt(character.level || 5, 10);
        effectiveLevel = Math.max(5, lvl);
        levelNote = `Paladin Level: ${effectiveLevel}`;
      }

      // Existing Companion Name fallback
      const existingName = (character.companion && character.companion.name)
        ? character.companion.name
        : (allowedAnimals.find(a => a.id === _activeCompanionModalAnimalId)?.name || 'Companion');

      // Dismiss button visibility
      const dismissBtn = document.getElementById('btn-companion-modal-dismiss');
      if (dismissBtn) {
        dismissBtn.classList.toggle('hidden', !(character.companion && character.companion.baseMonsterId));
      }

      // Calculate preview stats
      const previewConfig = {
        type: _activeCompanionModalType,
        baseMonsterId: _activeCompanionModalAnimalId,
        name: existingName,
        gear: character.companion?.gear || {}
      };
      const stats = (window.SrdCompendium && typeof window.SrdCompendium.calculateCompanionStats === 'function')
        ? window.SrdCompendium.calculateCompanionStats(character, previewConfig)
        : null;

      bodyEl.innerHTML = `
        <!-- Type Selection Tabs -->
        <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button type="button" onclick="onCompanionTypeChange('animal_companion')" class="py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${_activeCompanionModalType === 'animal_companion' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'}">
            <span>🐺</span>
            <span>Animal Companion</span>
          </button>
          <button type="button" onclick="onCompanionTypeChange('familiar')" class="py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${_activeCompanionModalType === 'familiar' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'}">
            <span>🦉</span>
            <span>Familiar</span>
          </button>
          <button type="button" onclick="onCompanionTypeChange('special_mount')" class="py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${_activeCompanionModalType === 'special_mount' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'}">
            <span>🐎</span>
            <span>Special Mount</span>
          </button>
        </div>

        <!-- Level Banner -->
        <div class="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="text-base text-amber-400">📈</span>
            <span class="font-mono text-slate-300 text-xs">${safeEscapeHtml(levelNote)}</span>
          </div>
          <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800">
            Bracket: Lvl ${effectiveLevel}
          </span>
        </div>

        <!-- Creature Selection & Name Controls -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Creature / Animal</label>
              <button type="button" onclick="toggleCompanionSpotlight(true)" class="text-[10px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer">
                <span>🔮 Spotlight &amp; Rule Master AI</span>
              </button>
            </div>
            <select id="companion-select-animal" onchange="onCompanionAnimalChange(this.value)" class="ui-input-md w-full h-9 bg-slate-950 text-amber-200 border border-slate-700 rounded-lg px-2.5 text-xs font-bold cursor-pointer">
              ${allowedAnimals.map(a => {
                const isSelected = a.id === _activeCompanionModalAnimalId;
                const reqText = a.minLevel ? ` (Req Lvl ${a.minLevel})` : (a.levelAdj ? ` (Adj ${a.levelAdj})` : '');
                const bonusText = a.masterBonusText ? ` • [${a.masterBonusText}]` : '';
                return `<option value="${a.id}" ${isSelected ? 'selected' : ''}>${a.name}${reqText}${bonusText}</option>`;
              }).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Companion Custom Name</label>
            <input type="text" id="companion-input-name" value="${safeEscapeHtml(existingName)}" placeholder="e.g., Ghost, Fang, Shadow..." class="ui-input-md w-full h-9 bg-slate-950 text-white border border-slate-700 rounded-lg px-2.5 text-xs font-semibold focus:border-amber-500">
          </div>
        </div>

        <!-- Live Companion Stats Preview -->
        ${stats ? `
          <div class="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3 space-y-2.5 shadow-inner">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span class="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <span>⚡</span> LIVE CALCULATED STATS PREVIEW (D&amp;D 3.5E RAW)
              </span>
              <span class="text-[10px] font-mono text-emerald-400 font-bold">${stats.totalHd} Hit Dice</span>
            </div>

            <!-- Preview 4-Cell Defensive Strip -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div class="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center">
                <span class="text-[9px] uppercase font-bold text-slate-400 block">HP</span>
                <span class="font-black text-emerald-400 text-sm">${stats.hp.max}</span>
              </div>
              <div class="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center">
                <span class="text-[9px] uppercase font-bold text-slate-400 block">Armor Class</span>
                <span class="font-black text-amber-300 text-sm">${stats.ac.total}</span>
                <span class="text-[8px] text-slate-500 block">Nat +${stats.ac.naturalArmor}</span>
              </div>
              <div class="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center">
                <span class="text-[9px] uppercase font-bold text-slate-400 block">Base Attack</span>
                <span class="font-black text-sky-300 text-sm">+${stats.bab}</span>
              </div>
              <div class="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center">
                <span class="text-[9px] uppercase font-bold text-slate-400 block">Fort / Ref / Will</span>
                <span class="font-black text-purple-300 text-xs">+${stats.saves.fort} / +${stats.saves.ref} / +${stats.saves.will}</span>
              </div>
            </div>

            <!-- Preview Abilities Strip -->
            <div class="bg-slate-900/70 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono flex-wrap gap-2">
              <div><strong class="text-slate-400">STR</strong> <span class="text-white">${stats.abilities.str}</span> <span class="text-amber-400">(+${stats.abilityMods.str})</span></div>
              <div><strong class="text-slate-400">DEX</strong> <span class="text-white">${stats.abilities.dex}</span> <span class="text-amber-400">(+${stats.abilityMods.dex})</span></div>
              <div><strong class="text-slate-400">CON</strong> <span class="text-white">${stats.abilities.con}</span> <span class="text-amber-400">(+${stats.abilityMods.con})</span></div>
              <div><strong class="text-slate-400">INT</strong> <span class="text-white">${stats.abilities.int}</span></div>
              <div><strong class="text-slate-400">WIS</strong> <span class="text-white">${stats.abilities.wis}</span> <span class="text-amber-400">(+${stats.abilityMods.wis})</span></div>
              <div><strong class="text-slate-400">CHA</strong> <span class="text-white">${stats.abilities.cha}</span></div>
            </div>

            <!-- Attacks & Abilities Preview -->
            <div class="text-xs space-y-1">
              <div class="text-[11px] text-slate-300">
                <strong class="text-amber-300">Attacks:</strong> ${stats.attacks.map(a => `${a.name} ${a.formattedAttack} (${a.formattedDamage})`).join(', ') || 'None'}
              </div>
              <div class="text-[11px] text-slate-400">
                <strong class="text-purple-300">Special:</strong> ${[...stats.specialAbilities, ...stats.monsterFeats, stats.masterBonusText].filter(Boolean).join(' • ') || 'Standard'}
              </div>
            </div>
          </div>
        ` : `
          <div class="p-3 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-slate-800">
            Select a creature to preview scaled companion stats.
          </div>
        `}
      `;
    }

    function saveCompanionSelection() {
      if (!character) return;
      const nameInput = document.getElementById('companion-input-name');
      const nameVal = (nameInput ? nameInput.value.trim() : '') || 'Companion';
      const animalId = _activeCompanionModalAnimalId;

      if (!animalId) {
        alert('Please select a valid creature or animal.');
        return;
      }

      const prevGear = character.companion?.gear || {};
      character.companion = {
        type: _activeCompanionModalType,
        baseMonsterId: animalId,
        name: nameVal,
        gear: prevGear
      };

      // Calculate initial HP
      const stats = (window.SrdCompendium && typeof window.SrdCompendium.calculateCompanionStats === 'function')
        ? window.SrdCompendium.calculateCompanionStats(character, character.companion)
        : null;
      if (stats) {
        character.companion.currentHp = stats.hp.max;
      }

      // Sync into specialAbilities array
      if (!Array.isArray(character.specialAbilities)) character.specialAbilities = [];
      character.specialAbilities = character.specialAbilities.filter(a => {
        const n = typeof a === 'string' ? a : (a?.name || '');
        return !/^🐾\s*(Animal Companion|Familiar|Special Mount)/i.test(n);
      });

      const typeLabel = _activeCompanionModalType === 'familiar' ? 'Familiar' : (_activeCompanionModalType === 'special_mount' ? 'Special Mount' : 'Animal Companion');
      const icon = _activeCompanionModalType === 'familiar' ? '🦉' : (_activeCompanionModalType === 'special_mount' ? '🐎' : '🐺');
      character.specialAbilities.push({
        name: `🐾 ${typeLabel}: ${nameVal} (${stats?.baseName || animalId})`,
        source: typeLabel,
        benefit: `${stats ? `${stats.totalHd} HD, HP ${stats.hp.max}, AC ${stats.ac.total}, Attacks: ${stats.attacks.map(a => a.name).join('/')}` : 'Bound Companion'}`
      });

      saveStateToStorage(true);
      closeCompanionModal();
      renderAll();

      showDiceTopToast({
        icon: icon,
        title: `${nameVal} Bound`,
        breakdown: `${typeLabel} (${stats?.baseName || animalId}) configured.`,
        total: 'Bound'
      });
    }

    function dismissCompanion() {
      if (!character || !character.companion) return;
      if (!confirm(`Are you sure you want to dismiss ${character.companion.name || 'your companion'}?`)) return;

      character.companion = null;
      if (Array.isArray(character.specialAbilities)) {
        character.specialAbilities = character.specialAbilities.filter(a => {
          const n = typeof a === 'string' ? a : (a?.name || '');
          return !/^🐾\s*(Animal Companion|Familiar|Special Mount)/i.test(n);
        });
      }

      saveStateToStorage(true);
      closeCompanionModal();
      renderAll();

      showDiceTopToast({
        icon: '🐾',
        title: 'Companion Dismissed',
        breakdown: 'Companion has been unbound from the character sheet.',
        total: 'Dismissed'
      });
    }

    function ensureCompanionSpotlightDom() {
      let overlay = document.getElementById('companion-spotlight-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'companion-spotlight-overlay';
        overlay.className = 'hidden';
        Object.assign(overlay.style, {
          position: 'fixed',
          top: '10vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(92vw, 640px)',
          maxHeight: '75vh',
          zIndex: '10060',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)',
          padding: '1rem'
        });
        document.body.appendChild(overlay);

        document.addEventListener('mousedown', (ev) => {
          if (overlay && !overlay.classList.contains('hidden') && !overlay.contains(ev.target)) {
            const triggerBtn = ev.target.closest('button[onclick*="toggleCompanionSpotlight"]');
            if (!triggerBtn) overlay.classList.add('hidden');
          }
        });
      }
      return overlay;
    }

    function toggleCompanionSpotlight(forceOpen = null) {
      const overlay = ensureCompanionSpotlightDom();
      const isHidden = overlay.classList.contains('hidden');
      const open = forceOpen !== null ? forceOpen : isHidden;
      if (open) {
        overlay.classList.remove('hidden');
        renderCompanionSpotlightContent('');
        const inp = overlay.querySelector('#companion-spotlight-input');
        if (inp) inp.focus();
      } else {
        overlay.classList.add('hidden');
      }
    }
    window.toggleCompanionSpotlight = toggleCompanionSpotlight;

    function renderCompanionSpotlightContent(query = '') {
      const overlay = ensureCompanionSpotlightDom();
      const q = String(query || '').trim().toLowerCase();

      const allowedAnimals = (window.SrdCompendium && typeof window.SrdCompendium.getAllowedAnimals === 'function')
        ? window.SrdCompendium.getAllowedAnimals(_activeCompanionModalType)
        : [];

      // Filter matches
      const matches = allowedAnimals.filter(a => {
        if (!q) return true;
        const name = (a.name || '').toLowerCase();
        const bonus = (a.masterBonusText || '').toLowerCase();
        return name.includes(q) || bonus.includes(q);
      });

      const typeLabel = _activeCompanionModalType === 'familiar' ? 'Familiar' : (_activeCompanionModalType === 'special_mount' ? 'Special Mount' : 'Animal Companion');
      const icon = _activeCompanionModalType === 'familiar' ? '🦉' : (_activeCompanionModalType === 'special_mount' ? '🐎' : '🐺');

      let html = `
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">${icon}</span>
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>${typeLabel} Spotlight</span>
                <span class="text-[10px] text-amber-300 font-mono font-normal">Canonical RAW 3.5e</span>
              </h3>
              <p class="text-[10px] text-slate-400">Search SRD creatures or fetch custom splatbook beasts via Rule Master AI</p>
            </div>
          </div>
          <button type="button" onclick="toggleCompanionSpotlight(false)" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm cursor-pointer">✕</button>
        </div>

        <div class="my-3">
          <div class="ui-spotlight-well ui-spotlight-amber rounded-xl p-1.5 flex items-center gap-2 border border-amber-500/50 bg-slate-900/90">
            <span class="text-amber-400 pl-2">🔍</span>
            <input type="text" id="companion-spotlight-input" value="${safeEscapeHtml(query)}" oninput="renderCompanionSpotlightContent(this.value)" placeholder="Search companion creature, animal, or vermin..." class="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none py-1">
            ${query ? `<button type="button" onclick="renderCompanionSpotlightContent('')" class="text-xs text-slate-400 hover:text-white px-2">✕</button>` : ''}
          </div>
        </div>

        <div class="overflow-y-auto space-y-1.5 flex-1 pr-1" style="max-height: 48vh;">
      `;

      if (matches.length > 0) {
        html += matches.map(a => {
          const isSelected = a.id === _activeCompanionModalAnimalId;
          const reqText = a.minLevel ? ` (Req Lvl ${a.minLevel})` : (a.levelAdj ? ` (Adj ${a.levelAdj})` : '');
          const bonusText = a.masterBonusText ? ` • [${a.masterBonusText}]` : '';
          return `
            <div onclick="selectCompanionFromSpotlight('${safeEscapeHtml(a.id)}')" class="p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${isSelected ? 'bg-amber-950/70 border-amber-500/60 text-white' : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-200'}">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-amber-300 truncate">${a.name}</span>
                  ${reqText ? `<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-700 text-slate-400">${reqText}</span>` : ''}
                </div>
                ${bonusText ? `<div class="text-[10px] text-purple-300 mt-0.5 truncate">${bonusText}</div>` : ''}
              </div>
              <button type="button" class="shrink-0 text-[11px] font-bold px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white shadow">
                ${isSelected ? 'Selected' : 'Select'}
              </button>
            </div>
          `;
        }).join('');
      } else {
        html += `
          <div class="p-6 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
            <div class="text-xl mb-1.5">🐾</div>
            <div class="text-xs font-semibold text-slate-300 mb-1">No canonical creature found matching "${safeEscapeHtml(query)}".</div>
            <div class="text-[11px] text-slate-500 mb-3">Looking for a splatbook companion, exotic mount, or homebrew familiar?</div>
          </div>
        `;
      }

      if (query) {
        html += `
          <div class="pt-2 mt-2 border-t border-slate-800 text-center">
            <button type="button" onclick="fetchCompanionViaAi('${safeEscapeHtml(query)}')" class="w-full py-2 px-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-purple-400/40">
              <span>🔮</span>
              <span>Fetch "${safeEscapeHtml(query)}" via Rule Master AI</span>
            </button>
          </div>
        `;
      }

      html += `</div>`;
      overlay.innerHTML = html;
    }
    window.renderCompanionSpotlightContent = renderCompanionSpotlightContent;

    function selectCompanionFromSpotlight(animalId) {
      onCompanionAnimalChange(animalId);
      toggleCompanionSpotlight(false);
    }
    window.selectCompanionFromSpotlight = selectCompanionFromSpotlight;

    async function fetchCompanionViaAi(creatureName) {
      const q = String(creatureName || '').trim();
      if (!q) return;

      const apiKey = typeof RuleMaster !== 'undefined' ? RuleMaster.getApiKey() : (localStorage.getItem('gemini_api_key') || '');
      if (!apiKey) {
        alert('⚠️ 🔮 Please configure a valid Google Gemini API key in Settings ⚙️ (top right) to search via Rule Master AI.');
        if (typeof openSettingsModal === 'function') openSettingsModal();
        return;
      }

      const overlay = ensureCompanionSpotlightDom();
      overlay.innerHTML = `
        <div class="p-8 text-center space-y-3">
          <div class="inline-block w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <div class="text-xs font-bold text-amber-300">🔮 Rule Master AI fetching D&D 3.5e RAW data for "${safeEscapeHtml(q)}"...</div>
          <p class="text-[11px] text-slate-400">Scanning official D&D 3.5e Monster Manual, Frostburn, Sandstorm, Stormwrack, and Eberron sourcebooks...</p>
        </div>
      `;

      try {
        let entries = null;
        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchSingleAiRuleObjects === 'function') {
          entries = await RuleMaster.fetchSingleAiRuleObjects(q, 'Race', apiKey);
        }

        const creature = (entries && entries.length > 0) ? entries[0] : null;
        if (!creature || !creature.name) {
          throw new Error(`Could not find D&D 3.5e creature statistics for "${q}".`);
        }

        // Add to masterDb as Monster/Companion if not already present
        const compEntry = {
          id: creature.id || ('mon_' + String(creature.name).toLowerCase().replace(/[^a-z0-9]+/g, '_')),
          name: creature.name,
          type: 'Monster',
          category: _activeCompanionModalType,
          description: creature.benefit || creature.description || '',
          source: creature.source || 'Rule Master AI',
          masterBonusText: creature.masterBonusText || null,
          minLevel: 1
        };

        if (Array.isArray(masterDb)) {
          const ex = masterDb.find(m => (m.name || '').toLowerCase() === creature.name.toLowerCase());
          if (!ex) {
            masterDb.push(compEntry);
            saveStateToStorage();
          }
        }

        _activeCompanionModalAnimalId = compEntry.id;
        toggleCompanionSpotlight(false);
        renderCompanionModalContent();

        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            icon: '🐾',
            title: `${creature.name} Fetched!`,
            breakdown: `D&D 3.5e creature added via 🔮 Rule Master AI.`,
            total: '+1 Creature'
          });
        }
      } catch (err) {
        alert(`Rule Master AI Error: ${err.message || 'Could not fetch creature.'}`);
        renderCompanionSpotlightContent(q);
      }
    }
    window.fetchCompanionViaAi = fetchCompanionViaAi;

    // Attach to global window
    window.isCharacterCompanionEligible = isCharacterCompanionEligible;
    window.openCompanionModal = openCompanionModal;
    window.closeCompanionModal = closeCompanionModal;
    window.onCompanionTypeChange = onCompanionTypeChange;
    window.onCompanionAnimalChange = onCompanionAnimalChange;
    window.saveCompanionSelection = saveCompanionSelection;
    window.dismissCompanion = dismissCompanion;



