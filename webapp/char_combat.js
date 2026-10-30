/**
 * Joyful-Fermi D&D 3.5e — Combat Cockpit, Weapons, Spell Offense Cards, 3-Column Tactical Dashboard & Dice Pool
 */
    // ====================================================
    // 🔮 SPELLCASTING COCKPIT
    // ====================================================
    window.currentActiveCombatSpellCategory = 'offense_spell';

    function classifySpellRole(spell) {
      if (!spell) return 'spell_support';
      const name = (spell.name || '').toLowerCase().trim();
      const desc = (spell.desc || spell.benefit || spell.description || spell.notes || '').toLowerCase();
      const school = (spell.school || '').toLowerCase();
      const attackType = (spell.attackType || '').toLowerCase();
      const target = (spell.target || '').toLowerCase();

      // 1. Weapon Buffs (strictly Melee)
      if (attackType === 'weapon_buff' || /(blade of blood|keen edge|holy sword|magic weapon|greater magic weapon|align weapon|shillelagh|flame blade)/i.test(name)) {
        return 'offense_melee';
      }

      // Clean desc of defensive phrases like 'negates magic missile' or 'immune to ...' so they don't false-trigger damage
      const cleanDesc = desc.replace(/negates\s+[^.]+/gi, '').replace(/immune\s+to\s+[^.]+/gi, '').replace(/resistance\s+to\s+[^.]+/gi, '');

      // 2. Offense Spell (Direct Damage / Damage Dice / Touch Attacks with damage)
      const hasDamageDice = !!spell.dice || !!spell.damageDice || /\b\d+d\d+\b.*?(damage|hasar|fire|cold|acid|electricity|sonic|force)/i.test(cleanDesc) || /(deals?|vuran|hasar\s+veren)\s+\d+d\d+/i.test(cleanDesc);
      const isDirectDamageSpell = /(magic missile|scorching ray|fireball|lightning bolt|acid arrow|disintegrate|cone of cold|polar ray|flame strike|finger of death|horrid wilting|sound burst|shatter|shocking grasp|chill touch|ray of frost|searing light|produce flame|flaming sphere|ice storm|chain lightning|meteor swarm|sunbeam|sunburst|prismatic spray|implosion)/i.test(name);
      const isTouchAttackDmg = (attackType === 'ranged_touch' || attackType === 'melee_touch') && /(damage|hasar)/i.test(cleanDesc);
      const isHealing = /(cure|heal|vigor|restoration)/i.test(cleanDesc);

      const isDirectDamage = (hasDamageDice || isDirectDamageSpell || isTouchAttackDmg) && !isHealing;

      // 3. Control Spell (Debuffs, Battlefield Control, Crowd Control, Disabling saves, Figments)
      const isControl = /(grease|web|entangle|sleep|hold person|hold monster|slow|glitterdust|blindness|deafness|fog cloud|solid fog|stinking cloud|black tentacles|gust of wind|color spray|hypnotic pattern|confusion|fear|scare|cause fear|ray of enfeeblement|ray of exhaustion|ghoul touch|touch of fatigue|bestow curse|silence|halt undead|deep slumber|hideous laughter|tasha|daze|command|wall of fire|wall of ice|wall of iron|wall of stone|forcecage|ghost sound)/i.test(name) ||
                        /(entangle|paralyz|sleep|slow|blind|deaf|daze|stun|nausea|sickened|prone|frightened|panicked|shaken|curse|enfeebl|distraction|auditory sound|phantom sound)/i.test(cleanDesc);

      // 4. Support Spell (Buffs, Defense, Utility, Healing, Movement, Utility Cantrips)
      const isSupport = /(shield|mage armor|barkskin|protection|resist|endure elements|bull's strength|cat's grace|bear's endurance|fox's cunning|owl's wisdom|eagle's splendor|haste|fly|invisibility|blur|mirror image|displacement|stoneskin|cure|heal|vigor|restoration|remove|cleanse|detect|read magic|light|dancing lights|prestidigitation|mending|teleport|dimension door|expeditious retreat|feather fall|see invisibility|true seeing|heroism|bless|prayer|aid|divine favor|sanctuary|mage hand|open\/close|message|arcane mark)/i.test(name) ||
                        /(armor bonus|shield bonus|enhancement bonus|teleport|speed|heal|cure|hp|temp hp|aura|detect|torch|trick|telekinesis)/i.test(cleanDesc) ||
                        /(personal|ally|you\b|touched creature)/i.test(target);

      if (isDirectDamage) {
        return 'offense_spell';
      }
      if (isControl) {
        return 'spell_control';
      }
      if (isSupport) {
        return 'spell_support';
      }

      // Default fallback for non-damage spells: Utility & Support
      return 'spell_support';
    }

    function getSpellEffectiveCategory(spell) {
      if (!spell) return 'offense_spell';
      const allPins = typeof getAllCombatPins === 'function' ? getAllCombatPins() : [];
      const pinned = allPins.find(p => (p.name || '').toLowerCase().trim() === (spell.name || '').toLowerCase().trim());
      if (pinned && pinned.pinTarget && pinned.pinTarget !== 'auto') {
        return pinned.pinTarget;
      }
      return classifySpellRole(spell);
    }

    window.currentActiveCombatSpellCategory = 'offense_spell';
    window.currentSelectedCombatSpellName = null;
    window.spellReorderModeActive = false;
    window.spellModifiersExpanded = false;
    window.meleeReorderModeActive = false;
    window.rangedReorderModeActive = false;

    function switchCombatSpellCategory(category) {
      if (!['offense_spell', 'spell_control', 'spell_support'].includes(category)) {
        category = 'offense_spell';
      }
      window.currentActiveCombatSpellCategory = category;

      // Update Sub-Tab Buttons UI
      const tabs = [
        { id: 'btn-spell-tab-offense_spell', cat: 'offense_spell', activeClass: 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow' },
        { id: 'btn-spell-tab-spell_control', cat: 'spell_control', activeClass: 'bg-gradient-to-r from-amber-700 to-yellow-600 text-white shadow' },
        { id: 'btn-spell-tab-spell_support', cat: 'spell_support', activeClass: 'bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow' }
      ];

      tabs.forEach(t => {
        const btn = document.getElementById(t.id);
        if (!btn) return;
        if (t.cat === category) {
          btn.className = `py-1.5 px-1 sm:px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${t.activeClass}`;
        } else {
          btn.className = 'py-1.5 px-1 sm:px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800';
        }
      });

      // Update Category Title Header
      const titleEl = document.getElementById('combat-spell-category-title');
      if (titleEl) {
        if (category === 'offense_spell') {
          titleEl.textContent = 'OFFENSIVE SPELLS';
          titleEl.className = 'uppercase tracking-wider text-purple-300 font-bold';
        } else if (category === 'spell_control') {
          titleEl.textContent = 'CONTROL SPELLS';
          titleEl.className = 'uppercase tracking-wider text-amber-300 font-bold';
        } else {
          titleEl.textContent = 'SUPPORT SPELLS';
          titleEl.className = 'uppercase tracking-wider text-emerald-300 font-bold';
        }
      }

      // Automatically pick first spell in this category if current selected is not in it
      const allSpells = getAllCharacterCombatSpells();
      const categorySpells = allSpells.filter(sp => getSpellEffectiveCategory(sp) === category);
      const curSelected = window.currentSelectedCombatSpellName;
      const curSource = window.currentSelectedCombatSpellSource;
      const isCurInCategory = categorySpells.some(sp => sp.name === curSelected && (!curSource || sp._spellSource === curSource));
      if (!isCurInCategory && categorySpells.length > 0) {
        window.currentSelectedCombatSpellName = categorySpells[0].name;
        window.currentSelectedCombatSpellSource = categorySpells[0]._spellSource;
      }

      populateCombatSpells();
      if (typeof renderSpellSlotsStrip === 'function') renderSpellSlotsStrip();
      renderCombatCategorySpells();
      if (typeof renderSpellTacticalModifiers === 'function') renderSpellTacticalModifiers();
      recalculateCombatSpell();
    }

    // --- 1. DAILY SPELL SLOTS TRACKER & MULTI-SOURCE ENGINE (TIER 1 - MIN 2 ROWS, 6 CELLS & SPONTANEOUS, PREPARED, DIVINE) ---
    window.currentActiveCombatSpellSlotsSourceFilter = 'all';
    window.currentSpellSlotsModalSource = 'spontaneous';

    function getAvailableSpellSlotSources(onlyActive = false) {
      const sc = (typeof character !== 'undefined' && character && character.spellcasting) ? character.spellcasting : {};
      const tob = (typeof character !== 'undefined' && character && character.tomeOfBattle) ? character.tomeOfBattle : {};

      const toSlotsArray = (raw) => {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object') {
          return Object.entries(raw).map(([lvl, val]) => {
            if (val && typeof val === 'object') {
              return {
                level: Number(val.level ?? lvl),
                daily: Number(val.daily ?? val.max ?? 0),
                used: Number(val.used ?? 0),
                dmBonus: Number(val.dmBonus ?? 0)
              };
            }
            return { level: Number(lvl), daily: Number(val) || 0, used: 0 };
          });
        }
        return [];
      };

      // 1. Spontaneous (Sorcerer/Bard)
      const spontSlots = toSlotsArray(sc.slots);
      // 2. Prepared (Wizard/Wu Jen)
      const prepSlots = toSlotsArray(sc.preparedSlots);
      // 3. Divine (Cleric/Druid)
      const divSlots = toSlotsArray(sc.divineSlots);
      // 4. Martial (Martial Maneuvers - Warblade/Swordsage/Crusader)
      const martialReadied = Array.isArray(tob.readiedManeuvers) ? tob.readiedManeuvers : [];

      const all = [
        {
          key: 'spontaneous',
          label: 'Spontaneous Spell Slots',
          shortLabel: 'Spont.',
          subText: 'Sorcerer / Spontaneous',
          icon: '⚡',
          themeColor: 'purple',
          borderClass: 'border-purple-800/80 bg-slate-900/90 hover:border-purple-500 text-purple-200',
          depletedClass: 'border-rose-900/60 bg-rose-950/40 hover:border-rose-700 text-rose-300',
          textClass: 'text-purple-300',
          tagClass: 'bg-purple-950/70 border-purple-700/60 text-purple-300',
          slots: spontSlots
        },
        {
          key: 'prepared',
          label: 'Prepared Spell Slots',
          shortLabel: 'Prep.',
          subText: 'Wizard / Prepared',
          icon: '📖',
          themeColor: 'sky',
          borderClass: 'border-sky-800/80 bg-slate-900/90 hover:border-sky-500 text-sky-200',
          depletedClass: 'border-rose-900/60 bg-rose-950/40 hover:border-rose-700 text-rose-300',
          textClass: 'text-sky-300',
          tagClass: 'bg-sky-950/70 border-sky-700/60 text-sky-300',
          slots: prepSlots
        },
        {
          key: 'divine',
          label: 'Divine Spell Slots',
          shortLabel: 'Divine',
          subText: 'Cleric / Divine',
          icon: '🔮',
          themeColor: 'amber',
          borderClass: 'border-amber-800/80 bg-slate-900/90 hover:border-amber-500 text-amber-200',
          depletedClass: 'border-rose-900/60 bg-rose-950/40 hover:border-rose-700 text-rose-300',
          textClass: 'text-amber-300',
          tagClass: 'bg-amber-950/70 border-amber-700/60 text-amber-300',
          slots: divSlots
        },
        {
          key: 'martial',
          label: 'Martial Maneuvers',
          shortLabel: 'Maneuver',
          subText: 'Tome of Battle / Martial',
          icon: '⚔️',
          themeColor: 'rose',
          borderClass: 'border-rose-800/80 bg-slate-900/90 hover:border-rose-500 text-rose-200',
          depletedClass: 'border-rose-900/60 bg-rose-950/40 hover:border-rose-700 text-rose-300',
          textClass: 'text-rose-300',
          tagClass: 'bg-rose-950/70 border-rose-700/60 text-rose-300',
          slots: martialReadied
        }
      ];

      if (onlyActive) {
        const activeOnly = all.filter(s => s.key !== 'martial' && Array.isArray(s.slots) && s.slots.some(sl => (Number(sl.daily) || 0) > 0));
        return activeOnly.length > 0 ? activeOnly : [all[0]];
      }

      return all;
    }

    function getSpellSlotsArrayBySource(sourceKey) {
      if (!character) return [];
      if (!character.spellcasting || typeof character.spellcasting !== 'object') character.spellcasting = {};
      if (sourceKey === 'prepared') {
        if (!Array.isArray(character.spellcasting.preparedSlots)) character.spellcasting.preparedSlots = [];
        return character.spellcasting.preparedSlots;
      }
      if (sourceKey === 'divine') {
        if (!Array.isArray(character.spellcasting.divineSlots)) character.spellcasting.divineSlots = [];
        return character.spellcasting.divineSlots;
      }
      if (!Array.isArray(character.spellcasting.slots)) character.spellcasting.slots = [];
      return character.spellcasting.slots;
    }

    function getAllCharacterCombatSpells() {
      const sc = (typeof character !== 'undefined' && character && character.spellcasting) ? character.spellcasting : {};
      const spont = Array.isArray(sc.knownSpells) ? sc.knownSpells : [];
      const prep = Array.isArray(sc.preparedSpells) ? sc.preparedSpells : [];
      const div = Array.isArray(sc.divineSpells) ? sc.divineSpells : [];
      const list = [];
      const seen = new Set();
      const add = (sp, srcKey) => {
        if (!sp) return;
        const name = typeof sp === 'string' ? sp : sp.name;
        if (!name) return;
        const lvl = typeof sp === 'object' && sp.level !== undefined ? Number(sp.level) : 0;
        const key = `${name.toLowerCase().trim()}__${lvl}__${srcKey}`;
        if (seen.has(key)) return;

        // Check: Does this source (Spontaneous, Prepared, Divine) have an active daily spell slot for this level?
        // If the level is locked (daily <= 0) or no remaining daily spell slots exist (remaining <= 0), hide it on the combat page
        let slotsArr = [];
        if (srcKey === 'prepared') {
          slotsArr = sc.preparedSlots || [];
        } else if (srcKey === 'divine') {
          slotsArr = sc.divineSlots || [];
        } else {
          slotsArr = sc.slots || character?.spellSlots || [];
        }

        const slot = slotsArr.find(s => Number(s.level) === lvl);
        const daily = slot ? (Number(slot.daily) || 0) : 0;
        if (daily <= 0) return; // Level locked / no slot at this level for this discipline

        const used = slot ? (Number(slot.used) || 0) : 0;
        const remaining = Math.max(0, daily - used);
        if (remaining <= 0) return; // No remaining daily spell slots

        seen.add(key);
        const master = (typeof masterDb !== 'undefined' && Array.isArray(masterDb))
          ? masterDb.find(m => m && m.name && m.name.toLowerCase().trim() === name.toLowerCase().trim())
          : null;
        const obj = Object.assign({}, master || {}, typeof sp === 'object' ? sp : { name: sp, level: lvl });
        obj._spellSource = srcKey;
        list.push(obj);
      };
      spont.forEach(s => add(s, 'spontaneous'));
      if (spont.length === 0 && Array.isArray(character?.spells)) {
        character.spells.forEach(s => add(s, 'spontaneous'));
      }
      prep.forEach(s => add(s, 'prepared'));
      div.forEach(s => add(s, 'divine'));
      return list;
    }

    function getSpellSlotSource(spell) {
      if (!spell) return 'spontaneous';
      if (spell._spellSource) return spell._spellSource;
      const nameClean = (spell.name || '').toLowerCase().trim();
      const sourceClean = (spell.source || '').toLowerCase();
      const tags = (spell.tags || []).map(t => String(t).toLowerCase());

      const isDivine = (character?.spellcasting?.divineSpells || []).some(s => (s.name || '').toLowerCase().trim() === nameClean)
        || tags.includes('divine') || sourceClean.includes('cleric') || sourceClean.includes('druid') || sourceClean.includes('divine');

      const isPrepared = (character?.spellcasting?.preparedSpells || []).some(s => (s.name || '').toLowerCase().trim() === nameClean)
        || tags.includes('prepared') || tags.includes('wizard') || sourceClean.includes('wizard');

      if (isDivine && (character?.spellcasting?.divineSlots || []).some(s => (Number(s.daily) || 0) > 0)) {
        return 'divine';
      }
      if (isPrepared && (character?.spellcasting?.preparedSlots || []).some(s => (Number(s.daily) || 0) > 0)) {
        return 'prepared';
      }
      return 'spontaneous';
    }

    function setCombatSpellSlotsSourceFilter(filterKey) {
      window.currentActiveCombatSpellSlotsSourceFilter = filterKey;
      renderSpellSlotsStrip();
    }

    function renderSpellSlotsStrip() {
      const container = document.getElementById('combat-spell-slots-strip');
      if (!container) return;

      const sources = getAvailableSpellSlotSources(true);
      const activeFilter = window.currentActiveCombatSpellLevelFilter ?? 'all';

      // Update indicator in header if present
      const indicatorEl = document.getElementById('combat-spell-level-filter-indicator');
      if (indicatorEl) {
        if (activeFilter === 'all' || activeFilter === null || activeFilter === undefined) {
          indicatorEl.textContent = 'All';
          indicatorEl.className = 'text-[9px] font-mono text-purple-300 font-bold';
        } else {
          indicatorEl.textContent = activeFilter === 0 ? '0 (Cantrip)' : `Level ${activeFilter}`;
          indicatorEl.className = 'text-[9px] font-mono text-amber-300 font-extrabold';
        }
      }

      // Determine max spell level (standard 9 for D&D 3.5e, or higher if epic)
      const allKnown = getAllCharacterCombatSpells();
      const presentLevels = new Set();
      allKnown.forEach(sp => {
        const l = Number(sp.level);
        if (!isNaN(l)) presentLevels.add(l);
      });
      sources.forEach(src => {
        (Array.isArray(src.slots) ? src.slots : []).forEach(s => {
          if (Number(s.daily) > 0) {
            presentLevels.add(Number(s.level));
          }
        });
      });

      const maxLevel = Math.max(9, ...presentLevels);
      const displayLevels = [];
      for (let lvl = 0; lvl <= maxLevel; lvl++) {
        displayLevels.push(lvl);
      }

      // 1. "All" button
      const isAllActive = activeFilter === 'all' || activeFilter === null || activeFilter === undefined;
      const allBtnClass = isAllActive
        ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-black border border-purple-400 shadow-md ring-1 ring-purple-300'
        : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80';

      // 2. Numbered Level buttons (0, 1, 2, 3...)
      const buttonsHtml = displayLevels.map(lvl => {
        const isActive = !isAllActive && Number(activeFilter) === lvl;

        // Calculate slot availability at this level across all sources
        let totalDaily = 0;
        let totalUsed = 0;
        sources.forEach(src => {
          const sList = Array.isArray(src.slots) ? src.slots : [];
          const s = sList.find(item => Number(item.level) === lvl);
          if (s) {
            totalDaily += Number(s.daily) || 0;
            totalUsed += Number(s.used) || 0;
          }
        });

        const remaining = Math.max(0, totalDaily - totalUsed);
        const isDepleted = totalDaily > 0 && remaining <= 0;
        const lvlLabel = lvl === 10 ? '10' : (lvl >= 11 ? '+10' : String(lvl));
        const fullLvlTitle = lvl === 0 ? 'Level 0 (Cantrips)' : `Level ${lvl} Spells`;

        let btnClass = '';
        let titleTip = '';

        if (isActive) {
          btnClass = 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-black border border-purple-400 shadow-md ring-2 ring-purple-400/40 scale-[1.02]';
          titleTip = `${fullLvlTitle} (Active Filter • Click to clear)`;
        } else if (isDepleted) {
          btnClass = 'bg-rose-950/40 text-rose-300/80 hover:bg-rose-900/50 border border-rose-900/60 opacity-60';
          titleTip = `${fullLvlTitle}: 0/${totalDaily} (Slots expended)`;
        } else if (totalDaily > 0) {
          btnClass = 'bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 border border-purple-900/50 hover:border-purple-600/80';
          titleTip = `${fullLvlTitle}: ${remaining}/${totalDaily} Slots Remaining`;
        } else {
          btnClass = 'bg-slate-900/40 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border border-slate-800/80';
          titleTip = `${fullLvlTitle} (No Slots)`;
        }

        return `
          <button type="button" onclick="setCombatSpellLevelFilter(${lvl})" class="w-full h-8 rounded-lg text-xs font-mono font-bold transition cursor-pointer select-none flex items-center justify-center ${btnClass}" title="${titleTip}">
            ${lvlLabel}
          </button>
        `;
      }).join('');

      const numCols = Math.ceil(displayLevels.length / 2);

      container.className = 'flex flex-col sm:flex-row gap-1.5 w-full items-stretch';
      container.innerHTML = `
        <button type="button" onclick="setCombatSpellLevelFilter('all')" class="w-full sm:w-16 h-8 sm:h-auto py-1 sm:py-0 px-2 rounded-lg text-xs font-bold transition cursor-pointer select-none flex items-center justify-center shrink-0 ${allBtnClass}" title="Show All Spell Levels">
          All
        </button>
        <div class="grid gap-1.5 flex-1 w-full" style="grid-template-columns: repeat(${numCols}, minmax(0, 1fr));">
          ${buttonsHtml}
        </div>
      `;
    }

    function setCombatSpellLevelFilter(lvl) {
      if (lvl === 'all' || window.currentActiveCombatSpellLevelFilter === lvl) {
        window.currentActiveCombatSpellLevelFilter = 'all';
      } else {
        window.currentActiveCombatSpellLevelFilter = Number(lvl);
      }
      renderSpellSlotsStrip();
      renderCombatCategorySpells();
    }

    // Modal: Spell Slots Manager
    function openSpellSlotsModal(focusLvl, sourceKey) {
      if (sourceKey) window.currentSpellSlotsModalSource = sourceKey;
      renderSpellSlotsModalRows();
      const modal = document.getElementById('modal-spell-slots-manager');
      if (modal) {
        modal.classList.remove('hidden');
        if (focusLvl !== undefined) {
          setTimeout(() => {
            const row = document.getElementById(`modal-slot-row-${focusLvl}`);
            if (row) {
              row.scrollIntoView({ behavior: 'smooth', block: 'center' });
              row.classList.add('ring-2', 'ring-purple-400');
              setTimeout(() => row.classList.remove('ring-2', 'ring-purple-400'), 1500);
            }
          }, 60);
        }
      }
    }

    function closeSpellSlotsModal() {
      const modal = document.getElementById('modal-spell-slots-manager');
      if (modal) modal.classList.add('hidden');
    }

    function switchModalSlotSource(sourceKey) {
      window.currentSpellSlotsModalSource = sourceKey;
      renderSpellSlotsModalRows();
    }

    function renderSpellSlotsModalRows() {
      const container = document.getElementById('modal-spell-slots-rows');
      if (!container) return;

      const sources = getAvailableSpellSlotSources();
      let activeSourceKey = window.currentSpellSlotsModalSource || 'spontaneous';
      let activeSource = sources.find(s => s.key === activeSourceKey) || sources[0];
      window.currentSpellSlotsModalSource = activeSource.key;

      // Render Modal Source Tabs if multiple sources exist
      const tabsContainer = document.getElementById('modal-spell-slots-source-tabs');
      if (tabsContainer) {
        if (sources.length > 1) {
          tabsContainer.innerHTML = sources.map(s => {
            const isAct = s.key === activeSource.key;
            return `
              <button type="button" onclick="switchModalSlotSource('${s.key}')" class="text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${isAct ? `${s.tagClass} border shadow-sm` : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}">
                <span>${s.icon}</span>
                <span>${s.shortLabel}</span>
              </button>
            `;
          }).join('');
          tabsContainer.classList.remove('hidden');
        } else {
          tabsContainer.innerHTML = '';
          tabsContainer.classList.add('hidden');
        }
      }

      // Special Dedicated View for Tome of Battle Martial Maneuvers
      if (activeSource.key === 'martial') {
        const initInfo = getInitiatorInfo();
        const readied = character?.tomeOfBattle?.readiedManeuvers || [];
        const maneuvers = character?.tomeOfBattle?.maneuversKnown || [];
        const stances = character?.tomeOfBattle?.stancesKnown || [];

        const readiedCount = readied.length;
        const maxReadied = initInfo.maxReadied || 3;

        container.innerHTML = `
          <div class="space-y-3">
            <!-- Initiator Summary Card -->
            <div class="bg-slate-900/90 border border-rose-900/60 rounded-xl p-3 shadow-sm space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-rose-300 flex items-center gap-1.5">
                  <span>⚔️</span>
                  <span>${initInfo.adeptClass || 'Martial Adept'} (IL: ${initInfo.il})</span>
                </span>
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  Max Maneuver: Level ${initInfo.maxManeuverLvl}
                </span>
              </div>
              <p class="text-[11px] text-slate-400">
                Tome of Battle RAW: Maneuvers are readied into your active deck and recovered in combat via a Swift/Full-Round Action.
              </p>
            </div>

            <!-- Capacity & DM Bonus Controls -->
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <div class="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                <span>⚙️</span>
                <span>Deck Capacities &amp; DM Bonuses</span>
              </div>

              <!-- Readied Maneuvers Quota -->
              <div class="flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-white">Readied Maneuver Capacity</span>
                  <span class="text-[10px] font-mono text-slate-400">
                    Base: ${initInfo.baseReadied || 3}${initInfo.dmReadiedBonus ? ` <span class="text-amber-400 font-semibold">(+${initInfo.dmReadiedBonus} DM)</span>` : ''}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-0.5">
                    <button type="button" onclick="modifyMartialReadiedQuota(-1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-bold flex items-center justify-center border border-slate-700 text-xs cursor-pointer" title="Decrease Capacity by -1">-</button>
                    <span class="w-8 text-center font-mono font-bold text-xs text-rose-300">${maxReadied}</span>
                    <button type="button" onclick="modifyMartialReadiedQuota(1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 font-bold flex items-center justify-center border border-slate-700 text-xs cursor-pointer" title="DM Bonus: Increase Capacity by +1">+</button>
                  </div>
                </div>
              </div>

              <!-- Known Maneuvers Quota -->
              <div class="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-slate-300">Maneuvers Known Quota</span>
                  <span class="text-[10px] font-mono text-slate-400">
                    Current: ${maneuvers.length} / ${initInfo.maxKnownManeuvers}${initInfo.dmKnownBonus ? ` <span class="text-amber-400 font-semibold">(+${initInfo.dmKnownBonus} DM)</span>` : ''}
                  </span>
                </div>
                <div class="flex items-center gap-0.5">
                  <button type="button" onclick="modifyMartialKnownQuota('maneuver', -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-bold flex items-center justify-center border border-slate-700 text-xs cursor-pointer" title="Decrease Quota by -1">-</button>
                  <span class="w-8 text-center font-mono font-bold text-xs text-slate-200">${initInfo.maxKnownManeuvers}</span>
                  <button type="button" onclick="modifyMartialKnownQuota('maneuver', 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 font-bold flex items-center justify-center border border-slate-700 text-xs cursor-pointer" title="DM Bonus: Increase Quota by +1">+</button>
                </div>
              </div>

              <!-- Known Stances Quota -->
              <div class="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-slate-300">Stances Known Quota</span>
                  <span class="text-[10px] font-mono text-slate-400">
                    Current: ${stances.length} / ${initInfo.maxKnownStances}${initInfo.dmStanceBonus ? ` <span class="text-amber-400 font-semibold">(+${initInfo.dmStanceBonus} DM)</span>` : ''}
                  </span>
                </div>
                <div class="flex items-center gap-0.5">
                  <button type="button" onclick="modifyMartialKnownQuota('stance', -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-bold flex items-center justify-center border border-slate-700 text-xs cursor-pointer" title="Decrease Quota by -1">-</button>
                  <span class="w-8 text-center font-mono font-bold text-xs text-teal-300">${initInfo.maxKnownStances}</span>
                  <button type="button" onclick="modifyMartialKnownQuota('stance', 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 font-bold flex items-center justify-center border border-slate-700 text-xs cursor-pointer" title="DM Bonus: Increase Quota by +1">+</button>
                </div>
              </div>
            </div>

            <!-- Quick Deck Readying Checklist -->
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span class="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Readied Maneuver Deck (${readiedCount} / ${maxReadied})</span>
                </span>
                <button type="button" onclick="recoverAllManeuvers(); renderSpellSlotsModalRows();" class="text-[9px] px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 font-bold transition cursor-pointer flex items-center gap-1" title="Recover all expended maneuvers">
                  <span>🔄</span>
                  <span>Recover All</span>
                </button>
              </div>

              ${maneuvers.length === 0 ? `
                <div class="py-4 text-center text-slate-500 text-xs italic">
                  No maneuvers known yet. You can add maneuvers from the Maneuvers tab.
                </div>
              ` : `
                <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  ${maneuvers.map(m => {
                    const isReadied = readied.some(rm => (rm.name || '').toLowerCase().trim() === (m.name || '').toLowerCase().trim());
                    const readiedObj = readied.find(rm => (rm.name || '').toLowerCase().trim() === (m.name || '').toLowerCase().trim());
                    const isExpended = readiedObj ? readiedObj.expended : false;
                    const actionLabel = typeof formatActionShort === 'function' ? formatActionShort(m.action) : (m.action || 'Standard');
                    return `
                      <div class="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border ${isReadied ? (isExpended ? 'border-rose-900/60 bg-rose-950/20' : 'border-rose-700/80 bg-rose-950/40') : 'border-slate-800/80'} transition">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="badge bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-bold font-mono px-1.5 py-0.5 shrink-0">${m.discipline || 'Iron Heart'} ${m.level || 1}</span>
                          <div class="flex flex-col min-w-0">
                            <span class="text-xs font-bold ${isExpended ? 'line-through text-slate-400' : 'text-white'} truncate">${m.name}</span>
                            <span class="text-[9px] text-slate-400 font-mono">${actionLabel}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                          ${isReadied && isExpended ? `
                            <span class="text-[9px] font-mono text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800">Expended</span>
                          ` : ''}
                          ${isReadied ? `
                            <button type="button" onclick="toggleManeuverReadiedInModal('${escape(m.name)}')" class="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-rose-950 text-emerald-300 hover:text-rose-300 border border-emerald-700 hover:border-rose-700 text-[10px] font-bold cursor-pointer transition">
                              ✓ Readied
                            </button>
                          ` : `
                            <button type="button" onclick="toggleManeuverReadiedInModal('${escape(m.name)}')" ${readiedCount >= maxReadied ? 'disabled' : ''} class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-900 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-600 text-[10px] font-bold cursor-pointer transition">
                              + Ready
                            </button>
                          `}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          </div>
        `;
        return;
      }

      const slots = activeSource.slots;
      const rowsHtml = [];

      for (let lvl = 0; lvl <= 11; lvl++) {
        const s = slots.find(item => Number(item.level) === lvl);
        const daily = s ? (Number(s.daily) || 0) : 0;
        const used = s ? (Number(s.used) || 0) : 0;
        const remaining = Math.max(0, daily - used);
        const isUnlocked = daily > 0;
        const dmBonus = s ? (Number(s.dmBonus) || 0) : 0;

        let lvlHeader = `Level ${lvl} Spells`;
        if (lvl === 0) lvlHeader = `Level 0 (Cantrips)`;
        else if (lvl === 10) lvlHeader = `Level 10 (Epic / Metamagic)`;
        else if (lvl === 11) lvlHeader = `Epic (10+) Spell Slot`;

        let lvlSub = `${activeSource.shortLabel} Spell Pool`;
        if (dmBonus > 0) {
          lvlSub += ` • <span class="text-amber-400 font-bold">+${dmBonus} DM Slot</span>`;
        }

        if (isUnlocked) {
          const placeholderSpacer = dmBonus > 0 ? `<span class="w-7 h-7 shrink-0 inline-block"></span>` : '';
          let secondRowHtml = '';
          if (activeSource.key === 'spontaneous') {
            const curKnown = (character.spellcasting?.knownSpells || []).filter(sp => Number(sp.level) === lvl).length;
            const quota = s.known !== undefined ? s.known : getSpellsKnownQuota(lvl);
            secondRowHtml = `
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-[10px] text-purple-300 font-mono w-12 text-right shrink-0">Known:</span>
                <button type="button" onclick="modifySpellsKnownQuota(${lvl}, -1)" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-bold flex items-center justify-center border border-slate-700 cursor-pointer text-xs transition" title="Decrease Spells Known Quota by -1">-1</button>
                <span class="text-xs font-mono font-black text-purple-300 w-14 text-center">${curKnown} / ${quota}</span>
                <button type="button" onclick="modifySpellsKnownQuota(${lvl}, 1)" class="w-7 h-7 rounded-lg bg-purple-950 hover:bg-purple-800 text-purple-200 font-bold flex items-center justify-center border border-purple-700 cursor-pointer text-xs transition" title="DM Bonus: Increase Spells Known Quota by +1">+1</button>
                ${placeholderSpacer}
              </div>
            `;
          } else if (activeSource.key === 'prepared') {
            const curPrep = (character.spellcasting?.preparedSpells || []).filter(sp => Number(sp.level) === lvl).length;
            secondRowHtml = `
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-[10px] text-sky-300 font-mono w-12 text-right shrink-0">Prep:</span>
                <button type="button" onclick="unprepareSpellForLevel(${lvl})" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-bold flex items-center justify-center border border-slate-700 cursor-pointer text-xs transition" title="Unprepare Last Spell">-1</button>
                <span class="text-xs font-mono font-black text-sky-300 w-14 text-center">${curPrep} / ${daily}</span>
                <button type="button" onclick="openPreparedSpellPickerForLevel(${lvl})" class="w-7 h-7 rounded-lg bg-sky-950 hover:bg-sky-800 text-sky-200 font-bold flex items-center justify-center border border-sky-700 cursor-pointer text-xs transition" title="Prepare Spell">+1</button>
                ${placeholderSpacer}
              </div>
            `;
          } else if (activeSource.key === 'divine') {
            const curDiv = (character.spellcasting?.divineSpells || []).filter(sp => Number(sp.level) === lvl).length;
            secondRowHtml = `
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-[10px] text-amber-300 font-mono w-12 text-right shrink-0">Prayer:</span>
                <button type="button" onclick="unprepareDivineSpellForLevel(${lvl})" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-bold flex items-center justify-center border border-slate-700 cursor-pointer text-xs transition" title="Unprepare Last Divine Spell">-1</button>
                <span class="text-xs font-mono font-black text-amber-300 w-14 text-center">${curDiv} / ${daily}</span>
                <button type="button" onclick="openDivineSpellPickerForLevel(${lvl})" class="w-7 h-7 rounded-lg bg-amber-950 hover:bg-amber-800 text-amber-200 font-bold flex items-center justify-center border border-amber-700 cursor-pointer text-xs transition" title="Prepare Divine Spell">+1</button>
                ${placeholderSpacer}
              </div>
            `;
          }

          rowsHtml.push(`
            <div id="modal-slot-row-${lvl}" class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 shadow-sm transition">
              <div class="flex flex-col min-w-0 w-full sm:w-auto pr-0 sm:pr-2">
                <span class="text-xs font-bold text-white leading-tight">${lvlHeader}</span>
                <span class="text-[10px] text-slate-400 font-mono mt-0.5 leading-tight">${lvlSub}</span>
              </div>
              <div class="flex flex-col gap-1 items-end w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t border-slate-800/40 sm:border-0">
                <!-- 1. Slot Expenditure Row -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-[10px] text-slate-400 font-mono w-12 text-right shrink-0">Slots:</span>
                  <button type="button" onclick="modifySpellSlotUsed(${lvl}, 1, '${activeSource.key}')" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold flex items-center justify-center border border-slate-700 cursor-pointer text-xs transition" title="Spend 1 Slot">-1</button>
                  <span class="text-xs font-mono font-black ${remaining > 0 ? 'text-emerald-400' : 'text-rose-400'} w-14 text-center">${remaining} / ${daily}</span>
                  <button type="button" onclick="modifySpellSlotUsed(${lvl}, -1, '${activeSource.key}')" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold flex items-center justify-center border border-slate-700 cursor-pointer text-xs transition" title="Restore 1 Slot (+1 DM Slot if full)">+1</button>
                  ${dmBonus > 0 ? `
                    <button type="button" onclick="revokeSpellSlotLevel(${lvl}, '${activeSource.key}')" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-bold cursor-pointer transition flex items-center justify-center shrink-0" title="Remove / Lock DM Slot Level">
                      🗑️
                    </button>
                  ` : ''}
                </div>
                <!-- 2. Known / Prepared / Selected Second Row -->
                ${secondRowHtml}
              </div>
            </div>
          `);
        } else {
          rowsHtml.push(`
            <div id="modal-slot-row-${lvl}" class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60 border border-slate-800/70 rounded-xl px-3 py-2 opacity-70 transition">
              <div class="flex flex-col min-w-0 w-full sm:w-auto pr-0 sm:pr-2">
                <span class="text-xs font-bold text-slate-400 leading-tight">${lvlHeader}</span>
                <span class="text-[10px] text-slate-500 font-mono mt-0.5 leading-tight">0 / 0 (Locked / None)</span>
              </div>
              <div class="flex justify-end w-full sm:w-auto shrink-0 pt-0.5 sm:pt-0">
                <button type="button" onclick="modifySpellSlotDaily(${lvl}, 1, '${activeSource.key}')" class="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-700/70 text-[10px] font-bold cursor-pointer transition flex items-center gap-1" title="DM Bonus: Unlock 1 Slot for This Level">
                  <span>+</span>
                  <span>Unlock DM Slot</span>
                </button>
              </div>
            </div>
          `);
        }
      }

      container.innerHTML = rowsHtml.join('');
    }

    function modifySpellSlotDaily(lvl, delta, sourceKey) {
      if (!character) return;
      const key = sourceKey || window.currentCompactSlotsSource || window.currentSpellSlotsModalSource || 'spontaneous';
      const slots = getSpellSlotsArrayBySource(key);

      let s = slots.find(item => Number(item.level) === Number(lvl));
      if (!s) {
        if (delta > 0) {
          s = { level: Number(lvl), daily: delta, used: 0, dmBonus: delta, known: delta };
          if (key === 'spontaneous') {
            s.knownBonus = delta;
          }
          slots.push(s);
          slots.sort((a, b) => Number(a.level) - Number(b.level));
        } else {
          return;
        }
      } else {
        s.dmBonus = Math.max(0, (Number(s.dmBonus) || 0) + delta);
        s.daily = Math.max(0, (Number(s.daily) || 0) + delta);
        if (key === 'spontaneous') {
          s.knownBonus = Math.max(0, (Number(s.knownBonus) || 0) + delta);
          s.known = Math.max(0, (Number(s.known) || 0) + delta);
        } else {
          s.known = s.daily;
        }
        if (s.used > s.daily) s.used = s.daily;

        // If daily capacity drops to 0, completely delete the slot entry so it relocks cleanly
        if (s.daily <= 0) {
          const sIdx = slots.indexOf(s);
          if (sIdx >= 0) slots.splice(sIdx, 1);
          s = null;
        }
      }

      saveStateToStorage(false);
      renderSpellSlotsStrip();
      renderSpellSlotsModalRows();
      renderCombatCategorySpells();
      recalculateCombatSpell();
      if (typeof renderSpellSlots === 'function') renderSpellSlots();
      if (typeof renderPreparedSpells === 'function') renderPreparedSpells();
      if (typeof renderDivineSpells === 'function') renderDivineSpells();
      if (typeof renderAll === 'function') renderAll();

      showDiceTopToast({
        icon: '✨',
        title: s && s.daily > 0 ? 'Daily Slot Updated' : 'DM Slot Removed',
        breakdown: s && s.daily > 0 
          ? `Level ${lvl} slot capacity adjusted by ${delta > 0 ? '+' + delta : delta} (DM Bonus).`
          : `Level ${lvl} DM slot removed and locked.`,
        total: s && s.daily > 0 ? `${s.daily} Slots` : 'Locked'
      });
    }

    function revokeSpellSlotLevel(lvl, sourceKey) {
      if (!character) return;
      const key = sourceKey || window.currentCompactSlotsSource || window.currentSpellSlotsModalSource || 'spontaneous';
      const slots = getSpellSlotsArrayBySource(key);
      const sIdx = slots.findIndex(item => Number(item.level) === Number(lvl));
      if (sIdx >= 0) {
        slots.splice(sIdx, 1);
        saveStateToStorage(false);
        renderSpellSlotsStrip();
        renderSpellSlotsModalRows();
        renderCombatCategorySpells();
        recalculateCombatSpell();
        if (typeof renderSpellSlots === 'function') renderSpellSlots();
        if (typeof renderPreparedSpells === 'function') renderPreparedSpells();
        if (typeof renderDivineSpells === 'function') renderDivineSpells();
        if (typeof renderAll === 'function') renderAll();
        showDiceTopToast({
          icon: '🗑️',
          title: 'DM Slot Removed',
          breakdown: `Level ${lvl} ${key === 'prepared' ? 'prepared' : (key === 'divine' ? 'divine' : 'spontaneous')} spell slot removed and locked.`,
          total: 'Locked'
        });
      }
    }

    function modifySpellsKnownQuota(lvl, delta) {
      if (!character) return;
      if (!character.spellcasting) character.spellcasting = {};
      if (!Array.isArray(character.spellcasting.slots)) character.spellcasting.slots = [];
      const slots = character.spellcasting.slots;

      let s = slots.find(item => Number(item.level) === Number(lvl));
      if (!s) {
        s = { level: Number(lvl), daily: 0, used: 0, known: Math.max(0, delta), knownBonus: delta };
        slots.push(s);
        slots.sort((a, b) => Number(a.level) - Number(b.level));
      } else {
        s.knownBonus = (Number(s.knownBonus) || 0) + delta;
        const curKnown = s.known !== undefined ? s.known : getSpellsKnownQuota(lvl);
        s.known = Math.max(0, curKnown + delta);
      }

      saveStateToStorage(false);
      renderAll();
      showDiceTopToast({
        icon: '✨',
        title: 'Spells Known Quota',
        breakdown: `Level ${lvl} spells known quota adjusted by ${delta > 0 ? '+' + delta : delta} (DM Bonus).`,
        total: `${s.known} Quota`
      });
    }

    function modifyMartialReadiedQuota(delta) {
      if (!character) return;
      if (!character.tomeOfBattle) character.tomeOfBattle = {};
      const curBonus = Number(character.tomeOfBattle.dmReadiedBonus) || 0;
      character.tomeOfBattle.dmReadiedBonus = curBonus + delta;
      saveStateToStorage(false);
      renderManeuvers();
      renderSpellSlotsModalRows();
      if (typeof showDiceTopToast === 'function') {
        const info = getInitiatorInfo();
        showDiceTopToast({
          icon: '⚔️',
          title: 'Readied Maneuver Quota',
          breakdown: `Readied maneuver capacity adjusted by ${delta > 0 ? '+' + delta : delta} (DM Bonus).`,
          total: `${info.maxReadied} Readied Deck`
        });
      }
    }

    function modifyMartialKnownQuota(type, delta) {
      if (!character) return;
      if (!character.tomeOfBattle) character.tomeOfBattle = {};
      if (type === 'stance') {
        const curBonus = Number(character.tomeOfBattle.dmStanceBonus) || 0;
        character.tomeOfBattle.dmStanceBonus = curBonus + delta;
      } else {
        const curBonus = Number(character.tomeOfBattle.dmKnownBonus) || 0;
        character.tomeOfBattle.dmKnownBonus = curBonus + delta;
      }
      saveStateToStorage(false);
      renderManeuvers();
      renderSpellSlotsModalRows();
      if (typeof showDiceTopToast === 'function') {
        const info = getInitiatorInfo();
        showDiceTopToast({
          icon: '🥋',
          title: type === 'stance' ? 'Stances Known Quota' : 'Maneuvers Known Quota',
          breakdown: `${type === 'stance' ? 'Stances' : 'Maneuvers'} known quota adjusted by ${delta > 0 ? '+' + delta : delta} (DM Bonus).`,
          total: type === 'stance' ? `${info.maxKnownStances} Stances` : `${info.maxKnownManeuvers} Maneuvers`
        });
      }
    }

    function toggleManeuverReadiedInModal(escapedName) {
      toggleManeuverReadied(escapedName);
      renderSpellSlotsModalRows();
    }

    function unlockSpellSlotLevel(lvl, sourceKey) {
      if (!character) return;
      const key = sourceKey || window.currentSpellSlotsModalSource || 'spontaneous';
      const slots = getSpellSlotsArrayBySource(key);

      let s = slots.find(item => Number(item.level) === Number(lvl));
      if (!s) {
        s = { level: lvl, daily: 1, used: 0 };
        slots.push(s);
      } else {
        s.daily = Math.max(1, (Number(s.daily) || 0) + 1);
      }

      saveStateToStorage(false);
      renderSpellSlotsStrip();
      renderSpellSlotsModalRows();
      renderCombatCategorySpells();
      recalculateCombatSpell();
      if (typeof renderSpellSlots === 'function') renderSpellSlots();
      if (key === 'prepared' && typeof renderPreparedSpells === 'function') renderPreparedSpells();
      if (key === 'divine' && typeof renderDivineSpells === 'function') renderDivineSpells();
    }

    function modifySpellSlotUsed(lvl, delta, sourceKey) {
      if (!character) return;
      const key = sourceKey || window.currentSpellSlotsModalSource || 'spontaneous';
      const slots = getSpellSlotsArrayBySource(key);

      let s = slots.find(item => Number(item.level) === Number(lvl));
      if (!s) return;

      const daily = Number(s.daily) || 0;
      let used = Number(s.used) || 0;

      // If user clicks +1 (delta = -1) when all slots are full, increase daily capacity by +1 (DM Slot Bonusu)
      if (delta < 0 && used <= 0) {
        modifySpellSlotDaily(lvl, 1, key);
        return;
      }

      used = Math.max(0, Math.min(daily, used + delta));
      s.used = used;

      saveStateToStorage(false);
      renderSpellSlotsStrip();
      renderSpellSlotsModalRows();
      renderCombatCategorySpells();
      recalculateCombatSpell();
      if (typeof renderSpellSlots === 'function') renderSpellSlots();
      if (key === 'prepared' && typeof renderPreparedSpells === 'function') renderPreparedSpells();
      if (key === 'divine' && typeof renderDivineSpells === 'function') renderDivineSpells();
    }

    function unprepareSpellForLevel(lvl) {
      if (!character?.spellcasting?.preparedSpells) return;
      const list = character.spellcasting.preparedSpells;
      for (let i = list.length - 1; i >= 0; i--) {
        if (Number(list[i].level) === Number(lvl)) {
          deletePreparedSpell(i);
          return;
        }
      }
    }

    function unprepareDivineSpellForLevel(lvl) {
      if (!character?.spellcasting?.divineSpells) return;
      const list = character.spellcasting.divineSpells;
      for (let i = list.length - 1; i >= 0; i--) {
        if (Number(list[i].level) === Number(lvl)) {
          deleteDivineSpell(i);
          return;
        }
      }
    }

    function replenishSpellSlotLevel(lvl, sourceKey) {
      const key = sourceKey || window.currentSpellSlotsModalSource || 'spontaneous';
      const slots = getSpellSlotsArrayBySource(key);
      const s = slots.find(item => Number(item.level) === Number(lvl));
      if (!s) return;
      s.used = 0;
      if (key === 'divine') s.domainUsed = 0;

      saveStateToStorage(false);
      renderSpellSlotsStrip();
      renderSpellSlotsModalRows();
      renderCombatCategorySpells();
      recalculateCombatSpell();
      if (typeof renderSpellSlots === 'function') renderSpellSlots();
      if (key === 'prepared' && typeof renderPreparedSpells === 'function') renderPreparedSpells();
      if (key === 'divine' && typeof renderDivineSpells === 'function') renderDivineSpells();
    }

    function replenishSourceSlots(sourceKey) {
      if (sourceKey === 'martial') {
        recoverAllManeuvers();
        renderSpellSlotsModalRows();
        return;
      }
      const slots = getSpellSlotsArrayBySource(sourceKey);
      slots.forEach(s => {
        s.used = 0;
        if (sourceKey === 'divine') s.domainUsed = 0;
      });
      saveStateToStorage(false);
      renderSpellSlotsStrip();
      renderSpellSlotsModalRows();
      renderCombatCategorySpells();
      recalculateCombatSpell();
      if (typeof renderSpellSlots === 'function') renderSpellSlots();
      if (sourceKey === 'prepared' && typeof renderPreparedSpells === 'function') renderPreparedSpells();
      if (sourceKey === 'divine' && typeof renderDivineSpells === 'function') renderDivineSpells();

      const sourceLabels = { spontaneous: 'Spontaneous Spell', prepared: 'Prepared Spell', divine: 'Divine Spell' };
      showDiceTopToast({
        icon: '✨',
        title: 'Slots Refreshed',
        breakdown: `All ${sourceLabels[sourceKey] || sourceKey} slots refreshed.`,
        total: 'Refreshed'
      });
    }

    function replenishAllSpellSlots() {
      (character?.spellcasting?.slots || []).forEach(s => s.used = 0);
      (character?.spellcasting?.preparedSlots || []).forEach(s => s.used = 0);
      (character?.spellcasting?.divineSlots || []).forEach(s => {
        s.used = 0;
        s.domainUsed = 0;
      });
      (character?.tomeOfBattle?.readiedManeuvers || []).forEach(m => m.expended = false);

      saveStateToStorage(false);
      renderSpellSlotsStrip();
      renderSpellSlotsModalRows();
      renderCombatCategorySpells();
      recalculateCombatSpell();
      if (typeof renderSpellSlots === 'function') renderSpellSlots();
      if (typeof renderPreparedSpells === 'function') renderPreparedSpells();
      if (typeof renderDivineSpells === 'function') renderDivineSpells();
      if (typeof renderManeuvers === 'function') renderManeuvers();
      closeSpellSlotsModal();

      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: '🌙',
          title: 'All Spell Slots & Maneuvers Refreshed',
          breakdown: 'All spell slots and Tome of Battle readied maneuvers have been refreshed.',
          total: 'Yenilendi'
        });
      }
    }

    function getEffectiveSpellCasterLevel(spell = null) {
      if (spell) {
        const spellNameLower = (spell.name || '').toLowerCase();
        const isDivineSpell = (spell._spellSource === 'divine') || (Array.isArray(character?.spellcasting?.divineSpells) && character.spellcasting.divineSpells.some(s => (s.name || '').toLowerCase() === spellNameLower));
        const isPreparedSpell = (spell._spellSource === 'prepared') || (Array.isArray(character?.spellcasting?.preparedSpells) && character.spellcasting.preparedSpells.some(s => (s.name || '').toLowerCase() === spellNameLower));

        if (isDivineSpell && typeof getDivineCasterInfo === 'function') {
          const dCl = Number(getDivineCasterInfo().cl);
          if (dCl > 0) return dCl;
        }
        if (isPreparedSpell && typeof getPreparedCasterInfo === 'function') {
          const pCl = Number(getPreparedCasterInfo().cl);
          if (pCl > 0) return pCl;
        }
      }

      if (typeof getCasterInfo === 'function') {
        const cCl = Number(getCasterInfo()?.cl);
        if (cCl > 0) return cCl;
      }

      return Number(character?.spellcasting?.cl) || Number(character?.spellcasting?.caster_level) || Number(character?.casterLevel) || Number(character?.level) || 1;
    }

    // --- SPELL CRITICAL PARAMETERS & HOVER TOOLTIP ENGINE ---
    function getSpellCriticalParams(spell) {
      if (!spell) {
        return {
          dice: '',
          effect: 'None',
          save: 'None',
          saveDC: null,
          sr: 'No',
          school: 'Universal',
          descriptor: '',
          fullSchool: 'Universal',
          action: 'Standard',
          range: 'Close',
          duration: 'Instantaneous',
          target: '1 Target',
          components: 'V, S',
          benefit: ''
        };
      }

      // Master DB lookup fallback for missing fields
      const masterSpell = (typeof findMasterItem === 'function' ? findMasterItem(spell.name) : null) || {};

      const cl = getEffectiveSpellCasterLevel(spell);
      const scaling = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.resolveSpellDynamicScaling === 'function')
        ? RuleEngine.resolveSpellDynamicScaling(spell, cl)
        : null;

      // 1. Damage / Dice expression (V2 damageParts primary lookup + fallback)
      const v2PrimaryPart = (Array.isArray(spell.damageParts) && spell.damageParts[0]) || (Array.isArray(masterSpell.damageParts) && masterSpell.damageParts[0]) || null;
      let diceExpr = (scaling && scaling.diceFormula) ? scaling.diceFormula : ((v2PrimaryPart && v2PrimaryPart.dice) || spell.dice || spell.damageDice || masterSpell.dice || '');
      if (!diceExpr && (spell.benefit || masterSpell.benefit)) {
        const text = spell.benefit || masterSpell.benefit || '';
        const m = text.match(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/i);
        if (m) diceExpr = m[0];
      }
      let effectText = (scaling && scaling.displayText)
        ? scaling.displayText
        : (diceExpr ? `${diceExpr} ${spell.dmgType || masterSpell.dmgType || ''}`.trim() : (spell.effect || spell.target || masterSpell.effect || 'Effect / Benefit'));

      // 2. Saving Throw & Dynamic DC
      let saveText = spell.save || spell.savingThrow || masterSpell.save || '';
      if (!saveText) {
        if (spell.attackType === 'saving_throw' || masterSpell.attackType === 'saving_throw') {
          saveText = 'Reflex / Will / Fort';
        } else if ((spell.benefit || masterSpell.benefit) && /save|saving throw|reflex|fortitude|will/i.test(spell.benefit || masterSpell.benefit)) {
          const sm = (spell.benefit || masterSpell.benefit).match(/(reflex|fortitude|will)\s*(?:half|negates|partial)?/i);
          if (sm) saveText = sm[0];
        }
      }

      let saveDC = null;
      let formattedSave = 'None';
      const isSaveNone = !saveText || /^(none|no|harmless)$/i.test(saveText.trim());
      if (!isSaveNone) {
        const baseLvl = Number(spell.level) || 0;
        const src = spell._spellSource || (typeof getSpellSlotSource === 'function' ? getSpellSlotSource(spell) : 'spontaneous');
        let statMod = 0;
        if (src === 'divine') {
          statMod = RuleEngine ? RuleEngine.getAbilityMod(character?.abilities?.wis || 10) : 0;
        } else if (src === 'prepared') {
          statMod = RuleEngine ? RuleEngine.getAbilityMod(character?.abilities?.int || 10) : 0;
        } else {
          statMod = RuleEngine ? RuleEngine.getAbilityMod(character?.abilities?.cha || 10) : 0;
        }

        // Spell Focus Feat Check
        const schoolLower = (spell.school || masterSpell.school || '').toLowerCase();
        let featDcBonus = 0;
        const featsList = character?.feats || [];
        if (featsList.some(f => (f.name || '').toLowerCase().includes('greater spell focus') && (f.name || '').toLowerCase().includes(schoolLower))) {
          featDcBonus = 2;
        } else if (featsList.some(f => (f.name || '').toLowerCase().includes('spell focus') && (f.name || '').toLowerCase().includes(schoolLower))) {
          featDcBonus = 1;
        }

        saveDC = 10 + baseLvl + statMod + featDcBonus;
        let cleanSaveLabel = saveText;
        if (/reflex/i.test(saveText)) cleanSaveLabel = /half/i.test(saveText) ? 'Reflex Half' : (/negates/i.test(saveText) ? 'Reflex Negates' : 'Reflex');
        else if (/will/i.test(saveText)) cleanSaveLabel = /half/i.test(saveText) ? 'Will Half' : (/negates/i.test(saveText) ? 'Will Negates' : 'Will');
        else if (/fortitude/i.test(saveText)) cleanSaveLabel = /half/i.test(saveText) ? 'Fort Half' : (/negates/i.test(saveText) ? 'Fort Negates' : 'Fort');

        formattedSave = `DC ${saveDC} ${cleanSaveLabel}`;
      }

      // 3. Spell Resistance (SR)
      let srText = spell.spellResistance || spell.sr || masterSpell.spellResistance || masterSpell.sr || '';
      if (!srText) {
        const noSrSpells = /(acid arrow|acid splash|orb of|glitterdust|grease|web|solid fog|fog cloud|stinking cloud|black tentacles|teleport|dimension door)/i;
        if (noSrSpells.test(spell.name)) {
          srText = 'No';
        } else if (spell.level === 0 && (spell.name || '').toLowerCase().includes('light')) {
          srText = 'No';
        } else {
          srText = 'Yes';
        }
      } else {
        srText = /yes/i.test(srText) ? 'Yes' : 'No';
      }

      // 4. Descriptor / Subschool
      let descriptor = '';
      const tags = (spell.tags || masterSpell.tags || []).map(t => String(t).toLowerCase());
      const dmgType = (spell.dmgType || masterSpell.dmgType || '').toLowerCase();
      const rawText = `${spell.name} ${spell.benefit || ''} ${masterSpell.benefit || ''} ${tags.join(' ')}`.toLowerCase();
      
      if (tags.includes('force') || dmgType.includes('force') || /force\s+damage/i.test(rawText)) descriptor = '[Force]';
      else if (tags.includes('fire') || dmgType.includes('fire')) descriptor = '[Fire]';
      else if (tags.includes('cold') || dmgType.includes('cold')) descriptor = '[Cold]';
      else if (tags.includes('acid') || dmgType.includes('acid')) descriptor = '[Acid]';
      else if (tags.includes('electricity') || dmgType.includes('electricity')) descriptor = '[Electricity]';
      else if (tags.includes('sonic') || dmgType.includes('sonic')) descriptor = '[Sonic]';
      else if (tags.includes('mind-affecting') || /mind-affecting/i.test(rawText)) descriptor = '[Mind-Affecting]';
      else if (tags.includes('light') || /light/i.test(spell.name)) descriptor = '[Light]';
      else if (tags.includes('darkness') || /darkness/i.test(spell.name)) descriptor = '[Darkness]';
      else if (tags.includes('death') || /death/i.test(rawText)) descriptor = '[Death]';

      const baseSchool = spell.school || masterSpell.school || 'Universal';
      const fullSchool = descriptor ? `${baseSchool} ${descriptor}` : baseSchool;

      // 5. Action
      const rawAction = spell.action || spell.castTime || masterSpell.action || 'Standard Action';
      let actionFormatted = '1 Standard';
      if (/swift/i.test(rawAction)) actionFormatted = '1 Swift';
      else if (/immediate/i.test(rawAction)) actionFormatted = '1 Immediate';
      else if (/full/i.test(rawAction)) actionFormatted = 'Full-Round';
      else if (/round/i.test(rawAction)) actionFormatted = '1 Round';
      else if (/min/i.test(rawAction)) actionFormatted = rawAction;

      // 6. Range (Formatted with CL feet)
      function formatSpellRangeExact(rangeStr, casterLvl) {
        if (!rangeStr) return 'Close (25 ft + 5 ft/2 lvl)';
        const rLower = rangeStr.toLowerCase();
        if (rLower.includes('personal')) return 'Personal';
        if (rLower.includes('touch')) return 'Touch';
        if (rLower.includes('close')) {
          const feet = 25 + Math.floor(casterLvl / 2) * 5;
          return `Close (${feet} ft)`;
        }
        if (rLower.includes('medium')) {
          const feet = 100 + casterLvl * 10;
          return `Medium (${feet} ft)`;
        }
        if (rLower.includes('long')) {
          const feet = 400 + casterLvl * 40;
          return `Long (${feet} ft)`;
        }
        return rangeStr;
      }
      const rangeFormatted = formatSpellRangeExact(spell.range || masterSpell.range, cl);

      // 7. Duration (Formatted with CL calculation)
      const rawDur = spell.duration || masterSpell.duration || 'Instantaneous';
      let durationFormatted = 'Instantaneous';
      if (/instantaneous/i.test(rawDur)) {
        durationFormatted = 'Instantaneous';
      } else if (/round/i.test(rawDur)) {
        durationFormatted = `${cl} Rounds`;
      } else if (/min/i.test(rawDur)) {
        if (/level|lvl/i.test(rawDur)) {
          durationFormatted = `${cl} Min (1 min/lvl)`;
        } else {
          durationFormatted = rawDur;
        }
      } else if (/hour/i.test(rawDur)) {
        if (/level|lvl/i.test(rawDur)) {
          durationFormatted = `${cl} Hours (1 hr/lvl)`;
        } else {
          durationFormatted = rawDur;
        }
      } else if (/concentration/i.test(rawDur)) {
        durationFormatted = 'Concentration';
      } else {
        durationFormatted = rawDur;
      }

      // 8. Target / Area
      let targetFormatted = spell.target || masterSpell.target || '';
      if (!targetFormatted) {
        const sName = (spell.name || '').toLowerCase();
        if (sName === 'magic missile') targetFormatted = 'Up to 5 Creatures';
        else if (sName === 'shield' || rangeFormatted.includes('Personal')) targetFormatted = 'Personal';
        else if (rangeFormatted.includes('Touch')) targetFormatted = '1 Creature / Object';
        else if (/ray|scorching ray|searing light|disintegrate/i.test(sName)) targetFormatted = '1 Target (Ray)';
        else if (/fireball/i.test(sName)) targetFormatted = '20-ft. Radius Spread';
        else if (/lightning bolt/i.test(sName)) targetFormatted = '120-ft. Line';
        else if (/cone/i.test(sName)) targetFormatted = 'Cone-Shaped Burst';
        else if (/bless/i.test(sName)) targetFormatted = 'Allies within 50 ft.';
        else targetFormatted = '1 Creature / Target';
      }

      // 9. Components
      let componentsFormatted = spell.components || masterSpell.components || '';
      if (!componentsFormatted) {
        const src = spell._spellSource || (typeof getSpellSlotSource === 'function' ? getSpellSlotSource(spell) : 'spontaneous');
        const sName = (spell.name || '').toLowerCase();
        if (src === 'divine') {
          componentsFormatted = 'V, S, DF';
        } else if (/feather fall/i.test(sName) || /blindness/i.test(sName) || /dimension door/i.test(sName)) {
          componentsFormatted = 'V';
        } else if (/mage armor/i.test(sName) || /read magic/i.test(sName)) {
          componentsFormatted = 'V, S, F';
        } else if (/fireball/i.test(sName) || /bull's strength/i.test(sName) || /lightning bolt/i.test(sName) || /reciprocal gyre/i.test(sName)) {
          componentsFormatted = 'V, S, M';
        } else {
          componentsFormatted = 'V, S';
        }
      }

      return {
        dice: diceExpr,
        effect: effectText,
        save: formattedSave,
        saveDC: saveDC,
        sr: srText,
        school: baseSchool,
        descriptor: descriptor,
        fullSchool: fullSchool,
        action: actionFormatted,
        range: rangeFormatted,
        duration: durationFormatted,
        target: targetFormatted,
        components: componentsFormatted,
        benefit: spell.benefit || spell.desc || spell.description || masterSpell.benefit || masterSpell.description || ''
      };
    }

    function showSpellHoverTooltip(event, spellName, sourceKey) {
      // On mobile / touch devices, disable hover popup as selecting the spell directly displays all details in Tier 5
      if (window.innerWidth < 768) return;
      if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;
      if (event && (event.pointerType === 'touch' || ('sourceCapabilities' in event && event.sourceCapabilities?.firesTouchEvents))) return;

      const tooltip = document.getElementById('combat-spell-hover-tooltip');
      if (!tooltip) return;

      const allSpells = getAllCharacterCombatSpells();
      let spell = null;
      if (sourceKey) {
        spell = allSpells.find(s => s.name === spellName && (s._spellSource === sourceKey || getSpellSlotSource(s) === sourceKey));
      }
      if (!spell) {
        spell = allSpells.find(s => s.name === spellName);
      }
      if (!spell) return;

      const params = getSpellCriticalParams(spell);
      const cl = getEffectiveSpellCasterLevel(spell);
      const scaling = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.resolveSpellDynamicScaling === 'function')
        ? RuleEngine.resolveSpellDynamicScaling(spell, cl)
        : null;

      const src = spell._spellSource || (typeof getSpellSlotSource === 'function' ? getSpellSlotSource(spell) : 'spontaneous');

      // Theme colors based on spell source
      let sourceLabel = 'Spontaneous • Sorcerer';
      let themeBorder = 'border-purple-500/80';
      let schoolBadgeClass = 'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800';
      let iconColor = 'text-purple-400';

      if (src === 'prepared') {
        sourceLabel = 'Prepared • Wizard';
        themeBorder = 'border-sky-500/80';
        schoolBadgeClass = 'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800';
        iconColor = 'text-sky-400';
      } else if (src === 'divine') {
        sourceLabel = 'Divine • Cleric';
        themeBorder = 'border-amber-500/80';
        schoolBadgeClass = 'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800';
        iconColor = 'text-amber-400';
      }

      // Update tooltip container styling
      tooltip.className = `hidden fixed z-[200] pointer-events-auto bg-slate-950/95 border ${themeBorder} rounded-xl p-3 shadow-2xl w-[340px] max-w-[92vw] text-xs space-y-2 backdrop-blur-md transition-opacity duration-150 text-slate-200 cursor-pointer select-none`;

      // Header Elements
      const iconEl = document.getElementById('spell-tooltip-icon');
      if (iconEl) iconEl.className = `${iconColor} text-sm`;

      const titleEl = document.getElementById('spell-tooltip-title');
      if (titleEl) titleEl.textContent = spell.name;

      const schoolEl = document.getElementById('spell-tooltip-school');
      if (schoolEl) {
        schoolEl.className = schoolBadgeClass;
        schoolEl.textContent = `${spell.level === 0 ? 'Cantrip' : 'Lvl ' + spell.level} • ${params.fullSchool}`;
      }

      const srcClassEl = document.getElementById('spell-tooltip-source-class');
      if (srcClassEl) srcClassEl.textContent = sourceLabel;

      const clBadgeEl = document.getElementById('spell-tooltip-cl-badge');
      if (clBadgeEl) clBadgeEl.textContent = `CL ${cl}`;

      // Stat Boxes
      const effectEl = document.getElementById('spell-tooltip-effect');
      if (effectEl) effectEl.textContent = params.effect || 'No Damage';

      const saveEl = document.getElementById('spell-tooltip-save');
      if (saveEl) {
        saveEl.textContent = params.save;
        saveEl.className = params.save.includes('DC')
          ? 'font-mono font-extrabold text-amber-300 text-[11px] block mt-0.5 truncate'
          : 'font-mono font-extrabold text-emerald-400 text-[11px] block mt-0.5 truncate';
      }

      // Middle Grid Elements
      const actionEl = document.getElementById('spell-tooltip-action');
      if (actionEl) actionEl.textContent = params.action;

      const durationEl = document.getElementById('spell-tooltip-duration');
      if (durationEl) durationEl.textContent = params.duration;

      const rangeEl = document.getElementById('spell-tooltip-range');
      if (rangeEl) rangeEl.textContent = params.range;

      const targetEl = document.getElementById('spell-tooltip-target');
      if (targetEl) targetEl.textContent = params.target;

      const srEl = document.getElementById('spell-tooltip-sr');
      if (srEl) srEl.textContent = params.sr;

      const compEl = document.getElementById('spell-tooltip-components');
      if (compEl) compEl.textContent = params.components;

      // Description & Scaling Detail
      const descEl = document.getElementById('spell-tooltip-desc');
      if (descEl) {
        let fullDesc = params.benefit || 'No description available.';
        if (scaling && scaling.descDetail) {
          fullDesc = `${fullDesc} \n[⚡ CL ${cl}: ${scaling.descDetail}]`;
        }
        descEl.innerText = fullDesc;
      }

      updateSpellHoverTooltipPos(event);
      tooltip.classList.remove('hidden');
    }

    function hideSpellHoverTooltip() {
      const tooltip = document.getElementById('combat-spell-hover-tooltip');
      if (tooltip) tooltip.classList.add('hidden');
    }

    function showActiveSpellHoverTooltip(event) {
      const activeSpell = typeof getSelectedCombatSpell === 'function' ? getSelectedCombatSpell() : null;
      if (activeSpell && activeSpell.name && typeof showSpellHoverTooltip === 'function') {
        showSpellHoverTooltip(event, activeSpell.name, activeSpell._spellSource);
      }
    }

    // Dismiss floating hover tooltips on tap or click anywhere outside
    document.addEventListener('pointerdown', (e) => {
      const tooltip = document.getElementById('combat-spell-hover-tooltip');
      if (tooltip && !tooltip.classList.contains('hidden')) {
        if (!tooltip.contains(e.target)) {
          hideSpellHoverTooltip();
        }
      }
      const modTooltip = document.getElementById('combat-modifier-hover-tooltip');
      if (modTooltip && !modTooltip.classList.contains('hidden')) {
        if (!modTooltip.contains(e.target)) {
          hideCombatModifierHoverTooltip();
        }
      }
    });

    function updateSpellHoverTooltipPos(event) {
      const tooltip = document.getElementById('combat-spell-hover-tooltip');
      if (!tooltip || tooltip.classList.contains('hidden')) return;

      const pad = 12;
      let x = event.clientX + pad;
      let y = event.clientY + pad;

      const tipRect = tooltip.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      if (x + tipRect.width > winW - pad) {
        x = event.clientX - tipRect.width - pad;
      }
      if (y + tipRect.height > winH - pad) {
        y = event.clientY - tipRect.height - pad;
      }

      tooltip.style.left = `${Math.max(pad, x)}px`;
      tooltip.style.top = `${Math.max(pad, y)}px`;
    }

    // --- COMBAT TACTICAL MODIFIERS HOVER TOOLTIP ENGINE ---
    function getCombatModifierTooltipData(identifier, category) {
      if (!character) return null;
      const idClean = String(identifier || '').toLowerCase().trim();

      // 1. Check Defense modifiers
      if (idClean === 'fightingdefensively' || idClean === 'fighting def.' || idClean === 'fighting def') {
        const tumbleSkill = (character.skills || []).find(s => s && s.name && s.name.toLowerCase() === 'tumble');
        const tumbleRanks = tumbleSkill ? (Number(tumbleSkill.ranks) || 0) : 0;
        const fdDodge = tumbleRanks >= 5 ? 3 : 2;
        return {
          title: 'Fighting Defensively',
          type: 'Combat Action',
          color: 'indigo',
          val1: `+${fdDodge} Dodge AC`,
          val2: '-4 Attack Penalty',
          source: 'D&D 3.5e RAW',
          action: 'Standard / Full Atk',
          desc: `Fight cautiously while attacking. You take a -4 penalty on all attacks in a round to gain a +${fdDodge} dodge bonus to AC until your next turn${tumbleRanks >= 5 ? ' (+3 Dodge AC with 5+ ranks in Tumble)' : ''}. Cannot be combined with Total Defense.`
        };
      }

      if (idClean === 'totaldefense' || idClean === 'total defense') {
        const tumbleSkill = (character.skills || []).find(s => s && s.name && s.name.toLowerCase() === 'tumble');
        const tumbleRanks = tumbleSkill ? (Number(tumbleSkill.ranks) || 0) : 0;
        const tdDodge = tumbleRanks >= 5 ? 6 : 4;
        return {
          title: 'Total Defense',
          type: 'Standard Action',
          color: 'indigo',
          val1: `+${tdDodge} Dodge AC`,
          val2: 'No Attacks / AoO',
          source: 'D&D 3.5e RAW',
          action: 'Standard Action',
          desc: `Dedicate your standard action entirely to defending yourself. You gain a +${tdDodge} dodge bonus to AC for 1 round${tumbleRanks >= 5 ? ' (+6 Dodge AC with 5+ ranks in Tumble)' : ''}. You cannot attack or make Attacks of Opportunity (AoO).`
        };
      }

      if (idClean === 'shieldblock' || idClean === 'shield block') {
        return {
          title: 'Shield Block',
          type: 'Counter (Maneuver)',
          color: 'indigo',
          val1: '+4 Shield AC',
          val2: 'Devoted Spirit 2',
          source: 'Tome of Battle',
          action: 'Immediate Action',
          desc: 'As an Immediate Action when an enemy attacks you or an adjacent ally, interpose your shield to grant an additional +4 shield bonus to AC against that attack.'
        };
      }

      // 2. Check Melee Fixed modifiers
      if (idClean === 'flanking') {
        return {
          title: 'Flanking',
          type: 'Positional',
          color: 'sky',
          val1: '+2 Melee Attack Bonus',
          val2: 'Enables Sneak Attack',
          source: 'D&D 3.5e RAW',
          action: 'Passive (Positional)',
          desc: 'When you and an ally threaten a defender from opposite borders or corners, you flank that opponent, gaining a +2 flanking bonus on melee attack rolls and enabling Sneak Attack damage.'
        };
      }

      if (idClean === 'charge') {
        return {
          title: 'Charge',
          type: 'Special Action',
          color: 'rose',
          val1: '+2 Attack Bonus',
          val2: '-2 AC Penalty (1 Rd)',
          source: 'D&D 3.5e RAW',
          action: 'Full-Round Action',
          desc: 'Move at least 10 ft. in a straight line toward an opponent and make a single melee attack with a +2 bonus on the attack roll and a -2 penalty to your AC until the start of your next turn.'
        };
      }

      if (idClean === 'higherground' || idClean === 'higher gr.' || idClean === 'higher gr') {
        return {
          title: 'Higher Ground',
          type: 'Positional',
          color: 'amber',
          val1: '+1 Melee Attack Bonus',
          val2: 'Elevation Advantage',
          source: 'D&D 3.5e RAW',
          action: 'Passive (Elevation)',
          desc: 'When attacking from a higher elevation than your target (such as a slope, stairs, or mount), you gain a +1 bonus on melee attack rolls.'
        };
      }

      // 3. Check Spell Fixed modifiers
      if (idClean === 'defensivecast' || idClean === 'defensive casting' || idClean === 'defensive cast') {
        const currentSpell = typeof getSelectedCombatSpell === 'function' ? getSelectedCombatSpell() : null;
        const currentLvl = currentSpell ? (Number(currentSpell.level) || 0) : 0;
        return {
          title: 'Defensive Casting',
          type: 'Concentration',
          color: 'indigo',
          val1: `DC ${15 + currentLvl} Check`,
          val2: 'Prevents AoO',
          source: 'D&D 3.5e RAW',
          action: 'Casting a Spell',
          desc: 'Cast a spell on the defensive (DC 15 + Spell Level Concentration check) to avoid provoking an Attack of Opportunity. If the check fails, the spell is lost and the slot is expended.'
        };
      }

      if (idClean === 'srcheck' || idClean === 'spell resistance') {
        const currentSpell = typeof getSelectedCombatSpell === 'function' ? getSelectedCombatSpell() : null;
        const cl = typeof getEffectiveSpellCasterLevel === 'function' ? getEffectiveSpellCasterLevel(currentSpell) : (character.casterLevel || 1);
        const featsList = character?.feats || [];
        const hasSpellPen = featsList.some(f => (f.name || '').toLowerCase().includes('spell penetration') && !(f.name || '').toLowerCase().includes('greater'));
        const hasGrtSpellPen = featsList.some(f => (f.name || '').toLowerCase().includes('greater spell penetration'));
        const srBonusFromFeats = hasGrtSpellPen ? 4 : (hasSpellPen ? 2 : 0);
        const totalSrBonus = cl + srBonusFromFeats;
        return {
          title: 'Spell Resistance (SR) Check',
          type: 'Caster Level Check',
          color: 'purple',
          val1: `1d20 + ${totalSrBonus} vs SR`,
          val2: `CL ${cl} ${srBonusFromFeats > 0 ? '(+Feat: +' + srBonusFromFeats + ')' : ''}`,
          source: 'D&D 3.5e RAW',
          action: 'Upon Spell Cast',
          desc: 'To overcome a creature\'s Spell Resistance (SR), roll 1d20 + Caster Level (+ Spell Penetration bonuses). If the result equals or exceeds the target\'s SR, the spell takes effect.'
        };
      }

      // 4. Check Metamagic definitions
      const metaMap = {
        'meta_empower': { title: 'Empower Spell', type: 'Metamagic Feat', color: 'purple', val1: '+50% Variable Effect (x1.5)', val2: '+2 Spell Slot', action: 'Casting a Spell', desc: 'All variable, numeric effects of an empowered spell are increased by one-half (x1.5). Saving throws and opposed rolls are not affected. An empowered spell uses up a spell slot two levels higher.' },
        'meta_maximize': { title: 'Maximize Spell', type: 'Metamagic Feat', color: 'amber', val1: 'Maximum Variable Dice', val2: '+3 Spell Slot', action: 'Casting a Spell', desc: 'All variable, numeric effects of a spell modified by this feat are maximized (e.g., 5d4+5 deals 20+5 = 25). A maximized spell uses up a spell slot three levels higher.' },
        'meta_enlarge': { title: 'Enlarge Spell', type: 'Metamagic Feat', color: 'sky', val1: 'Range x2 (Doubled)', val2: '+1 Spell Slot', action: 'Casting a Spell', desc: 'Doubles the range of a Close, Medium, or Long-range spell (+100%). An enlarged spell uses up a spell slot one level higher.' },
        'meta_extend': { title: 'Extend Spell', type: 'Metamagic Feat', color: 'emerald', val1: 'Duration x2 (Doubled)', val2: '+1 Spell Slot', action: 'Casting a Spell', desc: 'An extended spell lasts twice as long as normal. Spells with a concentration, instantaneous, or permanent duration are not affected. Uses up a spell slot one level higher.' },
        'meta_quicken': { title: 'Quicken Spell', type: 'Metamagic Feat', color: 'rose', val1: 'Swift Action Cast', val2: '+4 Spell Slot', action: 'Swift Action', desc: 'Casting a quickened spell is a swift action. You can perform another action, even casting another spell, in the same round. A quickened spell uses up a spell slot four levels higher.' },
        'meta_silent': { title: 'Silent Spell', type: 'Metamagic Feat', color: 'indigo', val1: 'No Verbal Component', val2: '+1 Spell Slot', action: 'Casting a Spell', desc: 'A silent spell can be cast with no verbal components. Uses up a spell slot one level higher.' },
        'meta_still': { title: 'Still Spell', type: 'Metamagic Feat', color: 'cyan', val1: 'No Somatic Component', val2: '+1 Spell Slot', action: 'Casting a Spell', desc: 'A stilled spell can be cast with no somatic components (ignores Arcane Spell Failure from armor). Uses up a spell slot one level higher.' },
        'meta_widen': { title: 'Widen Spell', type: 'Metamagic Feat', color: 'teal', val1: 'Area x2 (Doubled)', val2: '+3 Spell Slot', action: 'Casting a Spell', desc: 'Increases the numeric area of a burst, emanation, line, or spread spell by 100%. Uses up a spell slot three levels higher.' },
        'meta_heighten': { title: 'Heighten Spell', type: 'Metamagic Feat', color: 'purple', val1: 'Increases Effective Level & DC', val2: '+1 or Higher Slot', action: 'Casting a Spell', desc: 'A heightened spell has a higher spell level than normal (up to 9th level), increasing all level-dependent effects including Saving Throw DC.' }
      };

      if (metaMap[idClean]) {
        const m = metaMap[idClean];
        return {
          title: m.title,
          type: m.type,
          color: m.color,
          val1: m.val1,
          val2: m.val2,
          source: 'Metamagic RAW',
          action: m.action,
          desc: m.desc
        };
      }

      // Check if it starts with 'meta_' by looking in spell tactical modifiers
      if (typeof getSpellTacticalModifiers === 'function') {
        const spellMods = getSpellTacticalModifiers();
        const foundSm = spellMods.find(m => m && (m.id === identifier || m.key === identifier || (m.name && m.name.toLowerCase().trim() === idClean)));
        if (foundSm) {
          return {
            title: foundSm.name,
            type: foundSm.isRod ? 'Metamagic Rod' : (foundSm.isMetamagic ? 'Metamagic' : (foundSm.sourceType || 'Caster Modifier')),
            color: foundSm.color || 'purple',
            val1: foundSm.badge || (foundSm.slotDiff ? `+${foundSm.slotDiff} Slot` : 'Active'),
            val2: foundSm.desc || 'Spell modifier',
            source: foundSm.isRod ? 'Item / Rod' : 'Spell Tactic',
            action: foundSm.action || 'Casting a Spell',
            desc: foundSm.desc || `Applies the ${foundSm.name} tactical modifier to the active spell.`
          };
        }
      }

      // 5. Check Melee dynamic modifiers (character.activeModifiers, pins, stances, maneuvers, masterDb)
      const allActive = (character.activeModifiers || []);
      const activeMatch = allActive.find(m => m && m.name && m.name.toLowerCase().trim() === idClean);

      // Check masterDb for description / details
      let dbMatch = null;
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        dbMatch = masterDb.find(m => m && (
          (m.name && m.name.toLowerCase().trim() === idClean) ||
          (m.masterDbName && m.masterDbName.toLowerCase().trim() === idClean)
        ));
      }

      // Check maneuvers
      const mnvMatch = (character.maneuvers || []).find(m => m && m.name && m.name.toLowerCase().trim() === idClean);
      // Check stances
      const stnMatch = (character.stances || []).find(s => s && s.name && s.name.toLowerCase().trim() === idClean);
      // Check feats
      const featMatch = (character.feats || []).find(f => f && f.name && f.name.toLowerCase().trim() === idClean);
      // Check gear/inventory
      const itemMatch = [...(character.inventory || []), ...(character.gearPool || [])].find(i => {
        const iname = typeof i === 'string' ? i : (i.name || '');
        return iname.toLowerCase().trim() === idClean;
      });

      const title = activeMatch?.name || dbMatch?.name || mnvMatch?.name || stnMatch?.name || featMatch?.name || identifier;
      const type = dbMatch?.type || dbMatch?.category || (stnMatch ? 'Stance' : (mnvMatch ? 'Maneuver' : (featMatch ? 'Feat' : (activeMatch?.source || 'Tactic'))));
      
      let val1 = activeMatch?.dice ? `${activeMatch.dice} Damage` : (activeMatch?.bonusDmg ? `+${activeMatch.bonusDmg} Dmg` : (activeMatch?.bonusAtk ? `+${activeMatch.bonusAtk} Atk` : (dbMatch?.dice ? `${dbMatch.dice} Damage` : 'Active Effect')));
      let val2 = dbMatch?.school || dbMatch?.discipline || (mnvMatch?.discipline || (stnMatch?.discipline || (featMatch ? 'Passive / Feat' : (itemMatch ? 'Item / Consumable' : 'Tactical'))));

      let action = dbMatch?.action || mnvMatch?.action || (stnMatch ? 'Swift Action (Stance)' : 'Free Action');
      let desc = dbMatch?.description || dbMatch?.desc || dbMatch?.benefit || mnvMatch?.desc || stnMatch?.desc || featMatch?.desc || activeMatch?.desc || 'This tactical modifier applies directly to your combat attack or damage profile.';

      return {
        title,
        type,
        color: category === 'melee' ? 'rose' : (category === 'spell' ? 'purple' : 'amber'),
        val1,
        val2,
        source: activeMatch?.source || type,
        action,
        desc
      };
    }

    function showCombatModifierHoverTooltip(event, identifier, category) {
      if (window.innerWidth < 768) return;
      if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;
      if (event && (event.pointerType === 'touch' || ('sourceCapabilities' in event && event.sourceCapabilities?.firesTouchEvents))) return;

      const tooltip = document.getElementById('combat-modifier-hover-tooltip');
      if (!tooltip) return;

      const data = getCombatModifierTooltipData(identifier, category);
      if (!data) return;

      const titleEl = document.getElementById('mod-tooltip-title');
      const typeEl = document.getElementById('mod-tooltip-type');
      const val1El = document.getElementById('mod-tooltip-val-1');
      const val2El = document.getElementById('mod-tooltip-val-2');
      const srcEl = document.getElementById('mod-tooltip-source');
      const actEl = document.getElementById('mod-tooltip-action');
      const descEl = document.getElementById('mod-tooltip-desc');

      if (titleEl) titleEl.textContent = data.title;
      if (typeEl) {
        typeEl.textContent = data.type;
        if (data.color === 'indigo') {
          typeEl.className = 'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 shrink-0';
          tooltip.className = 'fixed z-[200] pointer-events-auto bg-slate-950/95 border border-indigo-500/80 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-1.5 backdrop-blur-md transition-opacity duration-150 text-slate-200 cursor-pointer select-none';
        } else if (data.color === 'purple') {
          typeEl.className = 'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 shrink-0';
          tooltip.className = 'fixed z-[200] pointer-events-auto bg-slate-950/95 border border-purple-500/80 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-1.5 backdrop-blur-md transition-opacity duration-150 text-slate-200 cursor-pointer select-none';
        } else if (data.color === 'rose') {
          typeEl.className = 'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 shrink-0';
          tooltip.className = 'fixed z-[200] pointer-events-auto bg-slate-950/95 border border-rose-500/80 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-1.5 backdrop-blur-md transition-opacity duration-150 text-slate-200 cursor-pointer select-none';
        } else if (data.color === 'sky') {
          typeEl.className = 'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 shrink-0';
          tooltip.className = 'fixed z-[200] pointer-events-auto bg-slate-950/95 border border-sky-500/80 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-1.5 backdrop-blur-md transition-opacity duration-150 text-slate-200 cursor-pointer select-none';
        } else {
          typeEl.className = 'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 shrink-0';
          tooltip.className = 'fixed z-[200] pointer-events-auto bg-slate-950/95 border border-amber-500/80 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-1.5 backdrop-blur-md transition-opacity duration-150 text-slate-200 cursor-pointer select-none';
        }
      }

      if (val1El) val1El.textContent = data.val1;
      if (val2El) val2El.textContent = data.val2;
      if (srcEl) srcEl.textContent = data.source;
      if (actEl) actEl.textContent = data.action;
      if (descEl) descEl.textContent = data.desc;

      updateCombatModifierHoverTooltipPos(event);
      tooltip.classList.remove('hidden');
    }

    function hideCombatModifierHoverTooltip() {
      const tooltip = document.getElementById('combat-modifier-hover-tooltip');
      if (tooltip) tooltip.classList.add('hidden');
    }

    function updateCombatModifierHoverTooltipPos(event) {
      const tooltip = document.getElementById('combat-modifier-hover-tooltip');
      if (!tooltip || tooltip.classList.contains('hidden')) return;

      const pad = 12;
      let x = event.clientX + pad;
      let y = event.clientY + pad;

      const tipRect = tooltip.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      if (x + tipRect.width > winW - pad) {
        x = event.clientX - tipRect.width - pad;
      }
      if (y + tipRect.height > winH - pad) {
        y = event.clientY - tipRect.height - pad;
      }

      tooltip.style.left = `${Math.max(pad, x)}px`;
      tooltip.style.top = `${Math.max(pad, y)}px`;
    }

    // --- 4. LEVEL-GROUPED 3x2 SPELL CARDS REPERTOIRE (TIER 4) ---
    function renderCombatCategorySpells() {
      const container = document.getElementById('combat-category-spells-container');
      if (!container) return;

      const activeCat = window.currentActiveCombatSpellCategory || 'offense_spell';
      const allSpells = getAllCharacterCombatSpells();
      let categorySpells = allSpells.filter(sp => getSpellEffectiveCategory(sp) === activeCat);

      // Apply custom order if defined
      const customOrder = character?.tactical?.spellOrder?.[activeCat];
      if (Array.isArray(customOrder)) {
        categorySpells.sort((a, b) => {
          const idxA = customOrder.indexOf(a.name);
          const idxB = customOrder.indexOf(b.name);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return (Number(a.level) || 0) - (Number(b.level) || 0);
        });
      } else {
        categorySpells.sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));
      }

      // Update spell count badge
      const countBadge = document.getElementById('combat-spell-count-badge');
      if (countBadge) countBadge.textContent = `${categorySpells.length} Spells`;

      if (categorySpells.length === 0) {
        const catLabels = { offense_spell: 'Offensive', spell_control: 'Control', spell_support: 'Support' };
        container.innerHTML = `
          <div class="p-3 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
            No known spells found in this category (${catLabels[activeCat] || activeCat}).
          </div>
        `;
        return;
      }

      const activeSpell = getSelectedCombatSpell();
      const activeName = activeSpell ? activeSpell.name : (categorySpells[0]?.name || '');
      const activeSource = activeSpell ? (activeSpell._spellSource || getSpellSlotSource(activeSpell)) : (categorySpells[0]?._spellSource || '');

      // Group spells by level
      const spellsByLevel = {};
      categorySpells.forEach(sp => {
        const lvl = Number(sp.level) || 0;
        if (!spellsByLevel[lvl]) spellsByLevel[lvl] = [];
        spellsByLevel[lvl].push(sp);
      });

      const sortedLevels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);
      const activeLvlFilter = window.currentActiveCombatSpellLevelFilter;
      const filteredLevels = (activeLvlFilter !== undefined && activeLvlFilter !== null && activeLvlFilter !== 'all')
        ? sortedLevels.filter(l => l === Number(activeLvlFilter))
        : sortedLevels;

      if (filteredLevels.length === 0) {
        container.innerHTML = `
          <div class="p-3 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
            No known spells found for ${activeLvlFilter === 0 ? 'Level 0 (Cantrips)' : `Level ${activeLvlFilter}`}.
          </div>
        `;
        return;
      }

      const sources = getAvailableSpellSlotSources(true);

      container.innerHTML = filteredLevels.map(lvl => {
        const lvlSpells = spellsByLevel[lvl];
        const lvlTitle = lvl === 0 ? 'Level 0 (Cantrips)' : `Level ${lvl} Spells`;
        const theme = typeof getSpellLevelTheme === 'function' ? getSpellLevelTheme(lvl) : null;
        const dc = typeof getSpellDc === 'function' ? getSpellDc(lvl) : (10 + lvl);

        // Multi-source slot breakdown for this level: e.g. Spont. 4/4 • Prep. 3/5 • Divine 1/3
        const sourceBadges = [];
        sources.forEach(src => {
          const s = (src.slots || []).find(item => Number(item.level) === lvl);
          const daily = s ? Number(s.daily) || 0 : 0;
          if (daily > 0) {
            const used = s ? Number(s.used) || 0 : 0;
            const remaining = Math.max(0, daily - used);
            let textColor = 'text-purple-300';
            if (src.key === 'prepared') textColor = 'text-sky-300';
            else if (src.key === 'divine') textColor = 'text-amber-300';

            const remColor = remaining > 0 ? textColor : 'text-rose-400 opacity-60';

            sourceBadges.push(`
              <span class="inline-flex items-center gap-1 font-mono text-[9px] font-bold ${remColor}">
                <span>${src.shortLabel}</span>
                <span>${remaining}/${daily}</span>
              </span>
            `);
          }
        });

        const slotBadgeHtml = sourceBadges.length > 0
          ? `<div class="flex items-center gap-1.5 flex-wrap">${sourceBadges.join('<span class="text-slate-600 font-normal">•</span>')}</div>`
          : `<span class="font-mono text-[9px] text-slate-500">No Slots</span>`;

        const cardsHtml = lvlSpells.map(sp => {
          const srcKey = sp._spellSource || (typeof getSpellSlotSource === 'function' ? getSpellSlotSource(sp) : 'spontaneous');
          const isActive = (sp.name === activeName) && (!activeSource || srcKey === activeSource);
          const params = getSpellCriticalParams(sp);

          let srcBadgeLabel = 'Spont.';
          let srcBadgeClass = 'bg-purple-950/80 text-purple-300 border-purple-700/60';
          let badgeColor = 'text-purple-400';
          let activeBorder = isActive
            ? 'border-purple-500 bg-purple-950/70 shadow-md shadow-purple-950/50 ring-1 ring-purple-500/60'
            : 'border-slate-800 bg-slate-900/80 hover:border-purple-700/80';

          if (srcKey === 'prepared') {
            srcBadgeLabel = 'Prep.';
            srcBadgeClass = 'bg-sky-950/80 text-sky-300 border-sky-700/60';
            badgeColor = 'text-sky-400';
            activeBorder = isActive
              ? 'border-sky-500 bg-sky-950/70 shadow-md shadow-sky-950/50 ring-1 ring-sky-500/60'
              : 'border-slate-800 bg-slate-900/80 hover:border-sky-700/80';
          } else if (srcKey === 'divine') {
            srcBadgeLabel = 'Divine';
            srcBadgeClass = 'bg-amber-950/80 text-amber-300 border-amber-700/60';
            badgeColor = 'text-amber-400';
            activeBorder = isActive
              ? 'border-amber-500 bg-amber-950/70 shadow-md shadow-amber-950/50 ring-1 ring-amber-500/60'
              : 'border-slate-800 bg-slate-900/80 hover:border-amber-700/80';
          }

          const activeTitleColor = isActive ? 'text-white font-extrabold' : 'text-slate-300';
          const safeName = sp.name.replace(/'/g, "\\'");
          const reorderControls = window.spellReorderModeActive ? `
            <div class="flex items-center gap-1 shrink-0" onclick="event.stopPropagation()">
              <button type="button" onclick="moveCategorySpellOrder('${activeCat}', '${safeName}', -1, event)" class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold flex items-center justify-center text-[10px] cursor-pointer">◀</button>
              <button type="button" onclick="moveCategorySpellOrder('${activeCat}', '${safeName}', 1, event)" class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold flex items-center justify-center text-[10px] cursor-pointer">▶</button>
            </div>
          ` : '';

          return `
            <div onclick="selectCombatSpellDirect('${safeName}', '${srcKey}')"
                 onmouseenter="showSpellHoverTooltip(event, '${safeName}', '${srcKey}')"
                 onmouseleave="hideSpellHoverTooltip()"
                 onmousemove="updateSpellHoverTooltipPos(event)"
                 class="p-2 rounded-xl border ${activeBorder} transition flex flex-col justify-between cursor-pointer min-h-[58px] group relative select-none">
              <div class="flex items-center justify-between w-full gap-1">
                <div class="flex items-center gap-1 min-w-0">
                  <span class="text-[7px] font-mono font-bold px-1 py-0.2 rounded border uppercase tracking-wider shrink-0 ${srcBadgeClass}">${srcBadgeLabel}</span>
                  <span class="text-[8px] font-mono ${badgeColor} font-bold uppercase truncate">${params.school || (sp.level === 0 ? 'Cantrip' : 'Lvl ' + sp.level)}</span>
                </div>
                <span class="text-[9px] text-amber-300 font-mono font-bold shrink-0 truncate">${params.dice || params.effect || ''}</span>
              </div>
              <div class="text-[11px] font-bold ${activeTitleColor} group-hover:text-white truncate my-0.5">
                ${sp.name}
              </div>
              <div class="flex items-center justify-between w-full text-[8px] text-slate-400 mt-0.5">
                <span class="truncate">${params.action}</span>
                ${reorderControls ? reorderControls : `<span class="truncate shrink-0 font-mono text-[8px] text-slate-500">${params.save !== 'None' ? params.save : params.sr}</span>`}
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="space-y-1.5">
            <div class="bg-gradient-to-r ${theme ? theme.headerGradient : 'from-slate-900 via-slate-950 to-transparent'} border-y ${theme ? theme.border : 'border-slate-800'} px-2 py-1 rounded-md flex items-center justify-between text-[10px] font-black select-none">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full ${theme ? theme.dot : 'bg-purple-400'} shrink-0"></span>
                <span class="${theme ? theme.text : 'text-slate-200'} uppercase tracking-wider font-extrabold text-[10px] truncate">${lvlTitle}</span>
                <span class="text-[9px] text-slate-400 font-normal shrink-0">DC ${dc}</span>
              </div>
              <div class="shrink-0 ml-1.5">
                ${slotBadgeHtml}
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              ${cardsHtml}
            </div>
          </div>
        `;
      }).join('');
    }

    function selectCombatSpellDirect(spellName, sourceKey) {
      window.currentSelectedCombatSpellName = spellName;
      if (sourceKey) window.currentSelectedCombatSpellSource = sourceKey;
      hideSpellHoverTooltip();
      const select = document.getElementById('combat-active-spell-select');
      if (select) select.value = spellName;
      renderCombatCategorySpells();
      recalculateCombatSpell();
    }

    // Aliases for backward compatibility
    function renderCombatQuickSpells() {
      renderCombatCategorySpells();
    }

    function selectQuickCombatSpell(spellName) {
      selectCombatSpellDirect(spellName);
    }

    function toggleCombatSpellLibraryDrawer() {
      const drawer = document.getElementById('combat-spell-library-drawer');
      if (drawer) drawer.classList.toggle('hidden');
    }

    function populateCombatSpells() {
      const select = document.getElementById('combat-active-spell-select');
      if (!select) return;

      const currentVal = window.currentSelectedCombatSpellName || select.value;
      select.innerHTML = '';

      const activeCat = window.currentActiveCombatSpellCategory || 'offense_spell';
      const allSpells = getAllCharacterCombatSpells();
      const categorySpells = allSpells.filter(sp => getSpellEffectiveCategory(sp) === activeCat);

      if (categorySpells.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        const catLabels = { offense_spell: 'Offensive Spells', spell_control: 'Control Spells', spell_support: 'Support Spells' };
        opt.textContent = `-- No Spells in Category (${catLabels[activeCat] || activeCat}) --`;
        select.appendChild(opt);
        return;
      }

      let hasMatch = false;
      const srcLabels = { spontaneous: 'Spont.', prepared: 'Prep.', divine: 'Divine' };
      categorySpells.forEach(sp => {
        const opt = document.createElement('option');
        opt.value = sp.name;
        const srcTag = srcLabels[sp._spellSource] || 'Spell';
        opt.textContent = `[${srcTag} Lvl ${sp.level}] ${sp.name} (${sp.school || 'Spell'})`;
        if (sp.name === currentVal) {
          opt.selected = true;
          hasMatch = true;
        }
        select.appendChild(opt);
      });

      if (!hasMatch && categorySpells.length > 0) {
        select.value = categorySpells[0].name;
        window.currentSelectedCombatSpellName = categorySpells[0].name;
        window.currentSelectedCombatSpellSource = categorySpells[0]._spellSource;
      }
    }

    function onCombatSpellChange() {
      const select = document.getElementById('combat-active-spell-select');
      if (select && select.value) {
        window.currentSelectedCombatSpellName = select.value;
      }
      renderCombatCategorySpells();
      recalculateCombatSpell();
    }

    function getSelectedCombatSpell() {
      const activeCat = window.currentActiveCombatSpellCategory || 'offense_spell';
      const allSpells = getAllCharacterCombatSpells();
      const categorySpells = allSpells.filter(sp => getSpellEffectiveCategory(sp) === activeCat);

      const selName = window.currentSelectedCombatSpellName || (document.getElementById('combat-active-spell-select')?.value);
      const selSrc = window.currentSelectedCombatSpellSource;
      if (selName) {
        if (selSrc) {
          const match = allSpells.find(s => s.name === selName && (s._spellSource === selSrc || getSpellSlotSource(s) === selSrc));
          if (match) return match;
        }
        const found = allSpells.find(s => s.name === selName);
        if (found) return found;
      }
      return categorySpells[0] || allSpells[0] || null;
    }

    function toggleSpellReorderMode() {
      window.spellReorderModeActive = !window.spellReorderModeActive;
      const btnText = document.getElementById('spell-reorder-btn-text');
      const btn = document.getElementById('btn-spell-reorder-toggle');
      if (btnText) btnText.textContent = window.spellReorderModeActive ? 'Done ✓' : 'Reorder';
      if (btn) {
        if (window.spellReorderModeActive) {
          btn.className = 'text-[9px] text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 font-bold flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded border border-emerald-600 transition';
        } else {
          btn.className = 'text-[9px] text-amber-400 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 transition';
        }
      }
      renderCombatCategorySpells();
    }

    function moveCategorySpellOrder(category, spellName, delta, event) {
      if (event && event.stopPropagation) event.stopPropagation();
      if (!character) return;
      if (!character.tactical) character.tactical = {};
      if (!character.tactical.spellOrder) character.tactical.spellOrder = {};

      const allSpells = getAllCharacterCombatSpells();
      let categorySpells = allSpells.filter(sp => getSpellEffectiveCategory(sp) === category);

      let orderList = Array.isArray(character.tactical.spellOrder[category])
        ? character.tactical.spellOrder[category].slice()
        : categorySpells.map(s => s.name);

      categorySpells.forEach(s => {
        if (!orderList.includes(s.name)) orderList.push(s.name);
      });

      const idx = orderList.indexOf(spellName);
      if (idx === -1) return;
      const targetIdx = idx + delta;
      if (targetIdx < 0 || targetIdx >= orderList.length) return;

      const item = orderList.splice(idx, 1)[0];
      orderList.splice(targetIdx, 0, item);

      character.tactical.spellOrder[category] = orderList;
      saveStateToStorage(false);
      renderCombatCategorySpells();
    }

    // --- 2. SPELL TACTICAL MODIFIERS ENGINE (TIER 2 - 3x3 GRID) ---
    function getSpellTacticalModifiers() {
      if (!character) return [];
      const modifiers = [];
      const seen = new Set();

      // Metamagic feat definitions lookup
      const metamagicDefs = {
        'empower spell': { name: 'Empower Spell', key: 'empower', slotDiff: 2, desc: '+50% Effect / +2 Slot', badge: '+2 Slot', color: 'purple', tag: 'Empower (+50%)' },
        'maximize spell': { name: 'Maximize Spell', key: 'maximize', slotDiff: 3, desc: 'Max Dice / +3 Slot', badge: '+3 Slot', color: 'amber', tag: 'Maximize (Max)' },
        'enlarge spell': { name: 'Enlarge Spell', key: 'enlarge', slotDiff: 1, desc: 'Range x2 / +1 Slot', badge: '+1 Slot', color: 'sky', tag: 'Enlarge (Range x2)' },
        'extend spell': { name: 'Extend Spell', key: 'extend', slotDiff: 1, desc: 'Duration x2 / +1 Slot', badge: '+1 Slot', color: 'emerald', tag: 'Extend (Dur x2)' },
        'quicken spell': { name: 'Quicken Spell', key: 'quicken', slotDiff: 4, desc: 'Swift Action / +4 Slot', badge: '+4 Slot', color: 'rose', tag: 'Quicken (Swift)' },
        'silent spell': { name: 'Silent Spell', key: 'silent', slotDiff: 1, desc: 'No Verbal / +1 Slot', badge: '+1 Slot', color: 'indigo', tag: 'Silent (No V)' },
        'still spell': { name: 'Still Spell', key: 'still', slotDiff: 1, desc: 'No Somatic / +1 Slot', badge: '+1 Slot', color: 'cyan', tag: 'Still (No S)' },
        'widen spell': { name: 'Widen Spell', key: 'widen', slotDiff: 3, desc: 'Area x2 / +3 Slot', badge: '+3 Slot', color: 'teal', tag: 'Widen (Area x2)' },
        'heighten spell': { name: 'Heighten Spell', key: 'heighten', slotDiff: 1, desc: 'DC +1 / +1 Slot', badge: '+1 Slot', color: 'purple', tag: 'Heighten (DC +1)', dcBonus: 1 },
        'chain spell': { name: 'Chain Spell', key: 'chain', slotDiff: 3, desc: 'Secondary Targets / +3 Slot', badge: '+3 Slot', color: 'amber', tag: 'Chain Spell' },
        'split ray': { name: 'Split Ray', key: 'split_ray', slotDiff: 2, desc: 'Extra Ray / +2 Slot', badge: '+2 Slot', color: 'sky', tag: 'Split Ray (+1 Ray)' },
        'twin spell': { name: 'Twin Spell', key: 'twin', slotDiff: 4, desc: 'Cast Twice / +4 Slot', badge: '+4 Slot', color: 'rose', tag: 'Twin Spell' },
        'sculpt spell': { name: 'Sculpt Spell', key: 'sculpt', slotDiff: 1, desc: 'Reshape Area / +1 Slot', badge: '+1 Slot', color: 'emerald', tag: 'Sculpt Area' },
        'persistent spell': { name: 'Persistent Spell', key: 'persistent', slotDiff: 6, desc: '24 Hours / +6 Slot', badge: '+6 Slot', color: 'purple', tag: 'Persistent (24h)' },
        'repeat spell': { name: 'Repeat Spell', key: 'repeat', slotDiff: 3, desc: 'Repeats Next Round / +3 Slot', badge: '+3 Slot', color: 'amber', tag: 'Repeat Spell' },
        'transdimensional spell': { name: 'Transdimensional Spell', key: 'transdimensional', slotDiff: 1, desc: 'Hits Ethereal/Incorporeal / +1 Slot', badge: '+1 Slot', color: 'cyan', tag: 'Transdimensional' },
        'energy substitution': { name: 'Energy Substitution', key: 'energy_sub', slotDiff: 0, desc: 'Substitute Energy / +0 Slot', badge: '+0 Slot', color: 'cyan', tag: 'Energy Sub' },
        'energy admixture': { name: 'Energy Admixture', key: 'energy_admix', slotDiff: 4, desc: 'Dual Energy / +4 Slot', badge: '+4 Slot', color: 'amber', tag: 'Energy Admixture' },
        'born of the three thunders': { name: 'Born of the Three Thunders', key: 'three_thunders', slotDiff: 0, desc: 'Electricity/Sonic / +0 Slot', badge: '+0 Slot', color: 'indigo', tag: 'Three Thunders' }
      };

      // 1. Only include Metamagic feats actually owned by the character in character.feats
      (character.feats || []).forEach(f => {
        if (!f) return;
        const fName = typeof f === 'string' ? f : (f.name || '');
        const low = fName.toLowerCase().trim();
        if (seen.has(low)) return;

        if (metamagicDefs[low]) {
          seen.add(low);
          const def = metamagicDefs[low];
          modifiers.push({
            id: `meta_${def.key}`,
            elementId: `mod-${def.key}-spell`,
            key: def.key,
            name: def.name,
            slotDiff: def.slotDiff,
            dcBonus: def.dcBonus || 0,
            desc: def.desc,
            badge: def.badge,
            color: def.color,
            tag: def.tag,
            isMetamagic: true
          });
        } else if (f.type === 'Metamagic' || f.category === 'Metamagic' || (Array.isArray(f.tags) && f.tags.includes('metamagic'))) {
          seen.add(low);
          const sDiff = Number(f.slotDiff ?? f.levelAdjustment ?? 0) || 0;
          modifiers.push({
            id: `meta_${low.replace(/\s+/g, '_')}`,
            elementId: `mod-${low.replace(/\s+/g, '_')}-spell`,
            key: low.replace(/\s+/g, '_'),
            name: f.name || fName,
            slotDiff: sDiff,
            dcBonus: Number(f.dcBonus) || 0,
            desc: f.benefit || f.desc || (sDiff ? `+${sDiff} Slot` : 'Metamagic'),
            badge: f.badge || (sDiff ? `+${sDiff} Slot` : 'Metamagic'),
            color: f.color || 'purple',
            tag: `${f.name || fName} (Feat)`,
            isMetamagic: true
          });
        }
      });

      // 3. Metamagic Rods in body slots / inventory
      const allItems = [...(character.inventory || []), ...(character.gearPool || [])];
      if (character.bodySlots) {
        Object.values(character.bodySlots).forEach(item => { if (item) allItems.push(item); });
      }
      allItems.forEach(item => {
        if (!item) return;
        const iName = typeof item === 'string' ? item : (item.name || '');
        const low = iName.toLowerCase();
        if (low.includes('metamagic rod') || low.includes('rod of empower') || low.includes('rod of extend') || low.includes('rod of maximize') || low.includes('rod of quicken')) {
          if (!seen.has(low)) {
            seen.add(low);
            let rodKey = 'empower';
            if (low.includes('maximize')) rodKey = 'maximize';
            else if (low.includes('extend')) rodKey = 'extend';
            else if (low.includes('quicken')) rodKey = 'quicken';
            modifiers.push({
              id: `rod_${iName.replace(/\s+/g, '_')}`,
              key: `rod_${rodKey}`,
              name: iName,
              sourceType: 'Item',
              slotDiff: 0,
              desc: 'Metamagic Rod (+0 Slot Level, 3/day)',
              badge: 'Rod',
              color: 'amber',
              tag: `${iName} (Rod)`,
              isRod: true
            });
          }
        }
      });

      // 4. Any Feat, Special Ability, or Buff pinned with ANY spell pin
      const spellCatKeys = ['offense_spell', 'spell_control', 'spell_support'];
      const allPins = typeof getAllCombatPins === 'function' ? getAllCombatPins() : [];

      allPins.forEach(p => {
        if (!p || !p.name) return;
        const low = p.name.toLowerCase().trim();
        if (seen.has(low)) return;

        const target = typeof resolvePinTarget === 'function' ? resolvePinTarget(p) : (p.pinTarget || '');
        if (!spellCatKeys.includes(target)) return;
        if (p.sourceType === 'Spell' || p.type === 'Spell') return;

        seen.add(low);
        const catBadge = target === 'offense_spell' ? '⚔️ Offense' : (target === 'spell_control' ? '🕸️ Control' : '✨ Support');
        const badgeText = p.badge || catBadge;
        const descText = p.desc || p.benefit || p.notes || `${p.sourceType || 'Ability'} Modifier`;

        modifiers.push({
          id: `pin_${p.name.replace(/\s+/g, '_')}`,
          key: `pin_${low}`,
          name: p.name,
          sourceType: p.sourceType || 'Feat',
          slotDiff: Number(p.slotDiff) || 0,
          desc: descText,
          badge: badgeText,
          color: target === 'offense_spell' ? 'purple' : (target === 'spell_control' ? 'amber' : 'emerald'),
          tag: `${p.name} (Active)`,
          pinTarget: target,
          rawPin: p
        });
      });

      return modifiers;
    }

    function isSpellCockpitModifierActive(mod) {
      if (!character) return false;
      if (!character.tactical) character.tactical = {};
      if (!character.tactical.activeSpellModifiers) character.tactical.activeSpellModifiers = {};
      const activeDict = character.tactical.activeSpellModifiers;

      if (activeDict[mod.id] !== undefined) return Boolean(activeDict[mod.id]);
      if (mod.key && activeDict[mod.key] !== undefined) return Boolean(activeDict[mod.key]);
      if (activeDict[mod.name] !== undefined) return Boolean(activeDict[mod.name]);
      if (mod.rawPin && mod.rawPin.active !== undefined) return Boolean(mod.rawPin.active);
      if (mod.elementId) {
        const el = document.getElementById(mod.elementId);
        if (el) return Boolean(el.checked);
      }
      return false;
    }

    function getActiveSpellTacticalModifiers() {
      const all = getSpellTacticalModifiers();
      return all.filter(m => isSpellCockpitModifierActive(m));
    }

    function toggleSpellCockpitModifier(modId, event) {
      if (event && event.stopPropagation) event.stopPropagation();
      if (!character) return;
      if (!character.tactical) character.tactical = {};
      if (!character.tactical.activeSpellModifiers) character.tactical.activeSpellModifiers = {};

      const allMods = getSpellTacticalModifiers();
      const mod = allMods.find(m => m.id === modId || m.key === modId || m.name === modId);
      if (!mod) return;

      const currentActive = isSpellCockpitModifierActive(mod);
      const nextActive = !currentActive;

      character.tactical.activeSpellModifiers[mod.id] = nextActive;
      if (mod.key) character.tactical.activeSpellModifiers[mod.key] = nextActive;
      character.tactical.activeSpellModifiers[mod.name] = nextActive;

      if (mod.elementId) {
        const el = document.getElementById(mod.elementId);
        if (el) el.checked = nextActive;
      }

      if (mod.rawPin) {
        mod.rawPin.active = nextActive;
      }
      const allPins = typeof getAllCombatPins === 'function' ? getAllCombatPins() : [];
      const matchingPin = allPins.find(p => p && (p.name.toLowerCase().trim() === mod.name.toLowerCase().trim() || p.id === mod.id));
      if (matchingPin) {
        matchingPin.active = nextActive;
      }

      if (Array.isArray(character.activeModifiers)) {
        const matchingActiveMod = character.activeModifiers.find(m => m && m.name && m.name.toLowerCase().trim() === mod.name.toLowerCase().trim());
        if (matchingActiveMod) {
          matchingActiveMod.active = nextActive;
        }
      }

      saveStateToStorage(false);
      renderSpellTacticalModifiers();
      recalculateCombatSpell();
    }

    function toggleSpellModifiersGridExpanded() {
      window.spellModifiersExpanded = !window.spellModifiersExpanded;
      renderSpellTacticalModifiers();
    }

    function renderSpellTacticalModifiers() {
      const container = document.getElementById('combat-spell-modifiers-dynamic-grid');
      if (!container) return;

      const modifiers = getSpellTacticalModifiers();
      const currentSpell = getSelectedCombatSpell();
      const currentLvl = currentSpell ? (Number(currentSpell.level) || 0) : 0;

      // Calculate SR bonus for SR check card
      const cl = getEffectiveSpellCasterLevel(currentSpell);
      const featsList = character?.feats || [];
      const hasSpellPen = featsList.some(f => (f.name || '').toLowerCase().includes('spell penetration') && !(f.name || '').toLowerCase().includes('greater'));
      const hasGrtSpellPen = featsList.some(f => (f.name || '').toLowerCase().includes('greater spell penetration'));
      const srBonusFromFeats = hasGrtSpellPen ? 4 : (hasSpellPen ? 2 : 0);
      const totalSrBonus = cl + srBonusFromFeats;

      // 1. Defensive Casting Checkbox State
      const isDefensiveActive = Boolean(character?.tactical?.defensiveCastingActive);

      // Card 1: Defensive Casting (Fixed Item 1 - Glow Card Toggle)
      const defCardHtml = `
        <div onclick="toggleDefensiveCastingModifier()"
             onmouseenter="showCombatModifierHoverTooltip(event, 'defensiveCast', 'spell')"
             onmouseleave="hideCombatModifierHoverTooltip()"
             onmousemove="updateCombatModifierHoverTooltipPos(event)"
             class="relative ${isDefensiveActive ? 'border-2 border-indigo-400 bg-indigo-950 text-white shadow-[0_0_12px_rgba(129,140,248,0.35)] ring-1 ring-indigo-400/30' : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500/60'} rounded-lg p-1.5 transition flex flex-col justify-between text-center select-none min-h-[64px] group cursor-pointer">
          <div class="flex items-center justify-center px-0.5 text-[9px] leading-none shrink-0 w-full">
            <span class="text-[8px] font-mono ${isDefensiveActive ? 'text-indigo-300 font-bold' : 'text-slate-500'} truncate max-w-[75px]">Action</span>
          </div>
          <div class="flex-1 flex flex-col justify-center items-center px-0.5 my-auto">
            <div class="text-[10px] ${isDefensiveActive ? 'font-black text-white' : 'font-bold text-indigo-400'} leading-tight truncate w-full">Defensive Cast</div>
            <div class="text-[9px] ${isDefensiveActive ? 'text-indigo-200 font-bold' : 'text-slate-400'} font-mono mt-1" id="defensive-casting-dc-hint">DC ${15 + currentLvl} • No AoO</div>
          </div>
        </div>
      `;

      // Card 2: Spell Resistance Check Button (Fixed Item 2 - Aligned 64px)
      const srCardHtml = `
        <button type="button" onclick="rollSpellResistanceCheck()"
                onmouseenter="showCombatModifierHoverTooltip(event, 'srCheck', 'spell')"
                onmouseleave="hideCombatModifierHoverTooltip()"
                onmousemove="updateCombatModifierHoverTooltipPos(event)"
                class="relative border border-slate-800 bg-slate-900 text-slate-300 hover:border-purple-500/60 rounded-lg p-1.5 transition flex flex-col justify-between text-center select-none min-h-[64px] group cursor-pointer w-full">
          <div class="flex items-center justify-center px-0.5 text-[9px] leading-none shrink-0 w-full">
            <span class="text-[8px] font-mono text-purple-400 font-bold truncate max-w-[75px]">Check</span>
          </div>
          <div class="flex-1 flex flex-col justify-center items-center px-0.5 my-auto">
            <div class="text-[10px] font-bold text-purple-300 group-hover:text-white leading-tight truncate w-full">
              <span class="mr-0.5 text-[9px]">⚡</span>Roll SR Check
            </div>
            <div class="text-[9px] text-amber-400 font-mono font-bold mt-1">1d20 + ${totalSrBonus} vs SR</div>
          </div>
        </button>
      `;

      // Build modifier cards (Glow Card Toggle)
      const modCards = modifiers.map(mod => {
        const isActive = isSpellCockpitModifierActive(mod);

        let activeBorder = 'border-2 border-purple-400 bg-purple-950 text-white shadow-[0_0_12px_rgba(192,132,252,0.35)] ring-1 ring-purple-400/30';
        let badgeColor = 'text-purple-300';
        let valueColor = 'text-purple-200';

        if (mod.color === 'amber') {
          activeBorder = 'border-2 border-amber-400 bg-amber-950 text-white shadow-[0_0_12px_rgba(251,191,36,0.35)] ring-1 ring-amber-400/30';
          badgeColor = 'text-amber-300';
          valueColor = 'text-amber-200';
        } else if (mod.color === 'sky' || mod.color === 'cyan') {
          activeBorder = 'border-2 border-sky-400 bg-sky-950 text-white shadow-[0_0_12px_rgba(56,189,248,0.35)] ring-1 ring-sky-400/30';
          badgeColor = 'text-sky-300';
          valueColor = 'text-sky-200';
        } else if (mod.color === 'emerald') {
          activeBorder = 'border-2 border-emerald-400 bg-emerald-950 text-white shadow-[0_0_12px_rgba(52,211,153,0.35)] ring-1 ring-emerald-400/30';
          badgeColor = 'text-emerald-300';
          valueColor = 'text-emerald-200';
        } else if (mod.color === 'rose') {
          activeBorder = 'border-2 border-rose-400 bg-rose-950 text-white shadow-[0_0_12px_rgba(251,113,133,0.35)] ring-1 ring-rose-400/30';
          badgeColor = 'text-rose-300';
          valueColor = 'text-rose-200';
        }

        const icon = mod.isRod ? '🪄' : (mod.isMetamagic ? '✨' : (mod.sourceType === 'Feat' ? '⚡' : '🔮'));
        const badgeLabel = mod.badge || (mod.isRod ? 'Rod' : (mod.isMetamagic ? 'Metamagic' : (mod.sourceType || 'Spell')));
        const safeId = (mod.id || '').replace(/'/g, "\\'");

        return `
          <div onclick="toggleSpellCockpitModifier('${mod.id}', event)"
               onmouseenter="showCombatModifierHoverTooltip(event, '${safeId}', 'spell')"
               onmouseleave="hideCombatModifierHoverTooltip()"
               onmousemove="updateCombatModifierHoverTooltipPos(event)"
               class="relative ${isActive ? activeBorder : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-purple-500/60'} rounded-lg p-1.5 transition flex flex-col justify-between text-center select-none min-h-[64px] group cursor-pointer">
            <div class="flex items-center justify-center px-0.5 text-[9px] leading-none shrink-0 w-full">
              <span class="text-[8px] font-mono ${isActive ? `${badgeColor} font-bold` : 'text-slate-500'} truncate max-w-[75px]">${badgeLabel}</span>
            </div>

            <div class="flex-1 flex flex-col justify-center items-center px-0.5 my-auto">
              <div class="text-[10px] ${isActive ? 'font-black text-white' : 'font-bold text-slate-200'} leading-tight truncate w-full">
                <span class="mr-0.5 text-[9px]">${icon}</span>${mod.name}
              </div>
              <div class="text-[9px] ${isActive ? `${valueColor} font-bold` : 'text-slate-400'} font-mono mt-1 truncate w-full">${mod.desc}</div>
            </div>
          </div>
        `;
      });

      const allItems = [defCardHtml, srCardHtml, ...modCards];
      const totalCount = allItems.length;

      // Update badge
      const countBadge = document.getElementById('spell-modifiers-count-badge');
      if (countBadge) countBadge.textContent = totalCount;

      // 3x3 Drawer Collapse/Expand Logic
      const toggleBtn = document.getElementById('toggle-spell-modifiers-btn');
      let displayItems = allItems;

      if (totalCount > 6) {
        if (toggleBtn) {
          toggleBtn.classList.remove('hidden');
          toggleBtn.textContent = window.spellModifiersExpanded ? 'Collapse ▴' : `Show More (${totalCount - 6}) ▾`;
        }
        if (!window.spellModifiersExpanded) {
          displayItems = allItems.slice(0, 6);
        }
      } else {
        if (toggleBtn) toggleBtn.classList.add('hidden');
      }

      container.innerHTML = displayItems.join('');
    }

    // --- 5. SELECTED SPELL COCKPIT & RECALCULATION ENGINE (TIER 5) ---
    function recalculateCombatSpell() {
      const spell = getSelectedCombatSpell();
      if (!spell) {
        const spellBtn = document.getElementById('main-spell-cast-btn');
        if (spellBtn) {
          const btnText = document.getElementById('main-spell-btn-text');
          if (btnText) btnText.textContent = 'No Spells';
          spellBtn.disabled = true;
        }
        const titleEl = document.getElementById('combat-selected-spell-title');
        if (titleEl) titleEl.textContent = 'No Spell Selected';
        return;
      }

      const baseLvl = Number(spell.level) || 0;
      const activeSpellMods = typeof getActiveSpellTacticalModifiers === 'function' ? getActiveSpellTacticalModifiers() : [];
      let slotDiff = 0;
      let dcBonus = 0;
      const metamagicTags = [];
      let isEmpower = false;
      let isMaximize = false;
      let isEnlarge = false;
      let isExtend = false;
      let isQuicken = false;

      activeSpellMods.forEach(mod => {
        if (!mod) return;
        if (mod.key === 'empower' || mod.id === 'meta_empower') isEmpower = true;
        if (mod.key === 'maximize' || mod.id === 'meta_maximize') isMaximize = true;
        if (mod.key === 'enlarge' || mod.id === 'meta_enlarge') isEnlarge = true;
        if (mod.key === 'extend' || mod.id === 'meta_extend') isExtend = true;
        if (mod.key === 'quicken' || mod.id === 'meta_quicken') isQuicken = true;

        if (Number(mod.slotDiff)) {
          slotDiff += Number(mod.slotDiff);
        }
        if (Number(mod.dcBonus)) {
          dcBonus += Number(mod.dcBonus);
        }
        metamagicTags.push(mod.tag || mod.badge || mod.name);
      });

      // Fallback check on checkboxes if dynamic grid rendered them with those IDs
      if (!isEmpower && document.getElementById('mod-empower-spell')?.checked) { isEmpower = true; slotDiff += 2; metamagicTags.push('Empower (+50%)'); }
      if (!isMaximize && document.getElementById('mod-maximize-spell')?.checked) { isMaximize = true; slotDiff += 3; metamagicTags.push('Maximize (Max)'); }
      if (!isEnlarge && document.getElementById('mod-enlarge-spell')?.checked) { isEnlarge = true; slotDiff += 1; metamagicTags.push('Enlarge (Range x2)'); }
      if (!isExtend && document.getElementById('mod-extend-spell')?.checked) { isExtend = true; slotDiff += 1; metamagicTags.push('Extend (Dur x2)'); }

      const finalLvl = baseLvl + slotDiff;
      const isMetamagicActive = metamagicTags.length > 0;

      const metaNote = document.getElementById('metamagic-action-note');
      if (metaNote) {
        if (isQuicken) {
          metaNote.textContent = '(Quicken: Swift Action)';
          metaNote.className = 'text-[9px] text-rose-400 font-bold';
        } else if (isMetamagicActive) {
          metaNote.textContent = '(Spontaneous: Full-Round)';
          metaNote.className = 'text-[9px] text-amber-400 font-bold';
        } else {
          metaNote.textContent = '(Standard Action)';
          metaNote.className = 'text-[9px] text-slate-400';
        }
      }

      // Caster Level & Spell Dynamic Scaling (D&D 3.5e RAW)
      const cl = getEffectiveSpellCasterLevel(spell);
      const scaling = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.resolveSpellDynamicScaling === 'function')
        ? RuleEngine.resolveSpellDynamicScaling(spell, cl)
        : null;

      // Update Selected Spell Title & School/Level Badges
      const titleEl = document.getElementById('combat-selected-spell-title');
      if (titleEl) titleEl.textContent = spell.name;

      const sourceIcon = document.getElementById('combat-selected-spell-source-icon');
      if (sourceIcon) {
        const effSrc = spell._spellSource || (typeof getSpellSlotSource === 'function' ? getSpellSlotSource(spell) : 'spontaneous');
        if (effSrc === 'prepared') sourceIcon.className = 'text-sky-400 text-xs';
        else if (effSrc === 'divine') sourceIcon.className = 'text-amber-400 text-xs';
        else sourceIcon.className = 'text-purple-400 text-xs';
      }

      const schoolBadge = document.getElementById('combat-selected-spell-school-badge');
      if (schoolBadge) schoolBadge.textContent = spell.school || 'Universal';

      const lvlBadge = document.getElementById('combat-selected-spell-level-badge');
      if (lvlBadge) lvlBadge.textContent = baseLvl === 0 ? 'Cantrip (0)' : `Level ${baseLvl}`;

      const metaDescEl = document.getElementById('combat-selected-spell-meta-desc');
      if (metaDescEl) {
        let descStr = spell.benefit || spell.desc || spell.description || 'No description available.';
        if (scaling && scaling.descDetail) {
          descStr = `${descStr} [⚡ ${scaling.descDetail}]`;
        }
        metaDescEl.textContent = descStr;
      }

      // Update Action Display
      const actionEl = document.getElementById('combat-spell-action-display');
      if (actionEl) {
        if (isQuicken) {
          actionEl.textContent = 'Swift Action (Quicken)';
          actionEl.className = 'text-[9px] font-mono font-bold text-rose-400';
        } else if (isMetamagicActive) {
          actionEl.textContent = 'Full-Round (Spontaneous)';
          actionEl.className = 'text-[9px] font-mono font-bold text-amber-400';
        } else {
          actionEl.textContent = spell.action || 'Standard Action';
          actionEl.className = 'text-[9px] font-mono font-bold text-amber-400';
        }
      }

      // Check slot capacity according to spell's source (Spontaneous, Prepared, Divine)
      const slotSource = typeof getSpellSlotSource === 'function' ? getSpellSlotSource(spell) : 'spontaneous';
      const slots = typeof getSpellSlotsArrayBySource === 'function' ? getSpellSlotsArrayBySource(slotSource) : (character?.spellcasting?.slots || []);
      const targetSlot = slots.find(s => Number(s.level) === finalLvl);
      const remaining = targetSlot ? Math.max(0, targetSlot.daily - targetSlot.used) : 0;
      const totalDaily = targetSlot ? targetSlot.daily : 0;

      const sourceLabels = { spontaneous: 'Spont.', prepared: 'Prep.', divine: 'Divine' };
      const sourceTag = sourceLabels[slotSource] || 'Spell';

      const slotReqEl = document.getElementById('combat-spell-slot-req-display');
      if (slotReqEl) {
        if (targetSlot) {
          slotReqEl.textContent = `Level ${finalLvl} ${sourceTag} Slot (${remaining}/${totalDaily} Left)`;
          slotReqEl.className = remaining > 0 ? 'text-xs font-mono font-bold text-purple-300' : 'text-xs font-mono font-bold text-rose-400';
        } else {
          slotReqEl.textContent = `Level ${finalLvl} ${sourceTag} Slot (Locked / Unavailable)`;
          slotReqEl.className = 'text-xs font-mono font-bold text-rose-500';
        }
      }

      // Attack roll & DC calculation
      const bab = Number(character?.bab) || 0;
      const dexMod = RuleEngine ? RuleEngine.getAbilityMod(character?.abilities?.dex || 10) : 0;
      const strMod = RuleEngine ? RuleEngine.getAbilityMod(character?.abilities?.str || 10) : 0;
      const chaMod = RuleEngine ? RuleEngine.getAbilityMod(character?.abilities?.cha || 10) : 0;

      const rangedTouchAtk = bab + dexMod;
      const meleeTouchAtk = bab + strMod;
      const saveDc = 10 + finalLvl + chaMod + dcBonus;

      const dcEl = document.getElementById('combat-spell-dc-display');
      if (dcEl) {
        const isRanged = (spell.attackType || '').toLowerCase().includes('ranged') || (spell.range || '').toLowerCase().includes('ft');
        const atkText = isRanged ? `Ranged Touch +${rangedTouchAtk}` : `Melee Touch +${meleeTouchAtk}`;
        dcEl.textContent = `DC ${saveDc} • ${atkText}`;
      }

      // SR & Target / Range display
      // Helper: Format Spell Range with exact calculated feet (D&D 3.5e RAW)
      function formatSpellRangeWithFeet(rangeStr, casterLvl) {
        if (!rangeStr) return 'Close';
        const rLower = rangeStr.toLowerCase();
        if (rLower.includes('personal')) return 'Personal';
        if (rLower.includes('touch')) return 'Touch';
        if (rLower.includes('close')) {
          const feet = 25 + Math.floor(casterLvl / 2) * 5;
          return `Close (${feet} ft)`;
        }
        if (rLower.includes('medium')) {
          const feet = 100 + casterLvl * 10;
          return `Medium (${feet} ft)`;
        }
        if (rLower.includes('long')) {
          const feet = 400 + casterLvl * 40;
          return `Long (${feet} ft)`;
        }
        return rangeStr;
      }

      // SR & Target / Range display
      const params = getSpellCriticalParams(spell);
      const srTargetEl = document.getElementById('combat-spell-sr-target-display');
      if (srTargetEl) {
        const srClean = (params.sr || '').toLowerCase().includes('yes') ? 'Yes' : 'No';
        const rangeClean = formatSpellRangeWithFeet(params.range, cl);
        srTargetEl.textContent = `SR: ${srClean} • ${rangeClean}`;
      }

      // Damage / effect preview (Dynamic Spell Scaling D&D 3.5e RAW)
      const activeCat = window.currentActiveCombatSpellCategory || 'offense_spell';
      const hasDamageDice = (scaling && scaling.diceCount > 0) || !!spell.dice || (spell.benefit && /\b\d+d\d+\b/i.test(spell.benefit));
      let baseDice = scaling?.diceFormula || spell.dice || (spell.benefit && spell.benefit.match(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/i) ? spell.benefit.match(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/i)[0] : '');

      let previewText = '';
      if (hasDamageDice && baseDice) {
        const typeLabel = scaling?.dmgType || spell.dmgType || 'Damage';
        const projPrefix = (scaling && scaling.projectiles > 1 && scaling.projectileName) ? `${scaling.projectiles}x ` : '';
        if (isEmpower && isMaximize) {
          previewText = `${projPrefix}${baseDice} Max + 50% (${typeLabel})`;
        } else if (isEmpower) {
          previewText = `${projPrefix}${baseDice} x1.5 (+50%) (${typeLabel})`;
        } else if (isMaximize) {
          previewText = `${projPrefix}${baseDice} (Max) (${typeLabel})`;
        } else if (scaling?.displayText) {
          previewText = scaling.displayText;
        } else {
          previewText = `${projPrefix}${baseDice} ${typeLabel}`;
        }
      } else if (activeCat === 'spell_control' || spell.save) {
        previewText = `DC ${saveDc} ${spell.save || 'Save'}`;
      } else {
        previewText = `No Damage (${spell.duration || 'Support / Benefit'})`;
      }

      const dmgPreviewEl = document.getElementById('combat-spell-damage-preview');
      if (dmgPreviewEl) dmgPreviewEl.textContent = previewText;

      const metaBadgeEl = document.getElementById('combat-spell-metamagic-badge');
      if (metaBadgeEl) {
        if (isMetamagicActive) {
          metaBadgeEl.textContent = `✨ ${metamagicTags.join(' • ')}`;
          metaBadgeEl.className = 'text-[8px] text-purple-300 font-bold truncate';
        } else {
          metaBadgeEl.textContent = 'Metamagic: None';
          metaBadgeEl.className = 'text-[8px] text-slate-500 truncate';
        }
      }

      // Top CL & Slot Badges and Collapsed Bar Summary
      const clBadge = document.getElementById('combat-spell-cl-slot-badge');
      const allSources = typeof getAvailableSpellSlotSources === 'function' ? getAvailableSpellSlotSources() : [];
      let totalDailySlots = 0, totalUsedSlots = 0;
      allSources.forEach(src => {
        totalDailySlots += src.slots.reduce((acc, s) => acc + (Number(s.daily) || 0), 0);
        totalUsedSlots += src.slots.reduce((acc, s) => acc + (Number(s.used) || 0), 0);
      });
      const totalRemainingSlots = Math.max(0, totalDailySlots - totalUsedSlots);
      if (clBadge) clBadge.textContent = `CL: ${cl} • Slots: ${totalRemainingSlots}/${totalDailySlots}`;
      const spellSummary = document.getElementById('combat-spell-collapsed-summary');
      if (spellSummary) spellSummary.textContent = `CL: ${cl} • Slots Left: ${totalRemainingSlots}/${totalDailySlots}`;

      // Spell Penetration feats calculation for SR check badge
      const featsList = character?.feats || [];
      const hasSpellPen = featsList.some(f => (f.name || '').toLowerCase().includes('spell penetration') && !(f.name || '').toLowerCase().includes('greater'));
      const hasGrtSpellPen = featsList.some(f => (f.name || '').toLowerCase().includes('greater spell penetration'));
      const srBonusFromFeats = hasGrtSpellPen ? 4 : (hasSpellPen ? 2 : 0);
      const totalSrBonus = cl + srBonusFromFeats;
      const srBadge = document.getElementById('sr-check-bonus-badge');
      if (srBadge) srBadge.textContent = `+${totalSrBonus}`;
      const concDcHint = document.getElementById('defensive-casting-dc-hint');
      if (concDcHint) concDcHint.textContent = `DC ${15 + finalLvl} • No AoO`;

      // Smart Adaptive Action Button
      const castBtn = document.getElementById('main-spell-cast-btn');
      const btnIcon = document.getElementById('main-spell-btn-icon');
      const btnText = document.getElementById('main-spell-btn-text');
      const btnSub = document.getElementById('main-spell-btn-sub');
      if (castBtn && btnText) {
        castBtn.disabled = false;
        if (btnIcon) btnIcon.textContent = '⚡';
        btnText.textContent = 'CAST';
        if (btnSub) {
          if (isQuicken) {
            btnSub.innerHTML = '<span class="block">Swift</span><span class="block">Action</span>';
            btnSub.className = 'text-[8px] font-mono text-rose-300 font-bold leading-tight mt-0.5 text-center';
          } else if (isMetamagicActive && slotSource === 'spontaneous') {
            btnSub.innerHTML = '<span class="block">Full-Round</span><span class="block">Action</span>';
            btnSub.className = 'text-[8px] font-mono text-amber-300 font-bold leading-tight mt-0.5 text-center';
          } else {
            const actStr = (spell.action || '').toLowerCase().includes('swift') ? 'Swift' : 'Standard';
            btnSub.innerHTML = `<span class="block">${actStr}</span><span class="block">Action</span>`;
            btnSub.className = 'text-[8px] font-mono text-purple-200/90 font-bold leading-tight mt-0.5 text-center';
          }
        }
      }
    }

    function getSpellAttackType(spell) {
      if (!spell) return null;
      const master = typeof findMasterItem === 'function' ? findMasterItem(spell.name) : null;
      const rawType = (spell.attackType || master?.attackType || '').toLowerCase().trim();
      if (rawType.includes('ranged_touch') || rawType.includes('ranged touch')) return 'ranged_touch';
      if (rawType.includes('melee_touch') || rawType.includes('melee touch')) return 'melee_touch';
      if (rawType.includes('touch')) return 'melee_touch';
      if (rawType.includes('ranged')) return 'ranged_touch';

      const textToScan = `${spell.name} ${spell.benefit || ''} ${spell.desc || ''} ${spell.description || ''}`.toLowerCase();
      if (textToScan.includes('ranged touch attack') || textToScan.includes('ranged touch')) {
        return 'ranged_touch';
      }
      if (textToScan.includes('melee touch attack') || textToScan.includes('melee touch')) {
        return 'melee_touch';
      }
      return null;
    }

    function getSpellHasSpellResistance(spell) {
      if (!spell) return false;
      const params = typeof getSpellCriticalParams === 'function' ? getSpellCriticalParams(spell) : {};
      const master = typeof findMasterItem === 'function' ? findMasterItem(spell.name) : null;
      const srVal = (params.sr || spell.sr || master?.sr || '').toString().toLowerCase();
      if (srVal.includes('yes') || srVal === 'true') {
        return true;
      }
      return false;
    }

    function renderSpellCastResults(spell, castData) {
      const card = document.getElementById('attack-results-card');
      if (!card) return;
      card.classList.remove('hidden');

      const sourceLabels = { spontaneous: 'Spont.', prepared: 'Prep.', divine: 'Divine' };
      const iconEl = document.getElementById('result-card-icon');
      if (iconEl) iconEl.textContent = '🔮';
      const titleEl = document.getElementById('result-card-title');
      if (titleEl) titleEl.textContent = `${spell.name} — Spell Resolution`;
      const subEl = document.getElementById('result-card-subtitle');
      if (subEl) subEl.textContent = `Level ${castData.finalLvl} Slot (${sourceLabels[castData.slotSource] || 'Spell'}) • CL ${castData.cl} • ${spell.school || 'Universal'}`;
      const grandLabel = document.getElementById('result-grand-total-label');
      if (grandLabel) grandLabel.textContent = castData.hasDamageDice ? 'Total Spell Damage:' : 'Spell Effect:';

      const summaryGrid = document.getElementById('result-summary-grid');
      if (summaryGrid) {
        summaryGrid.innerHTML = '';

        // 1. Attack Roll Card (If Applicable)
        if (castData.hasAtk) {
          const atkDiv = document.createElement('div');
          const isCrit = castData.isAtkCrit;
          atkDiv.className = `p-3 rounded-lg border ${isCrit ? 'bg-rose-950/40 border-rose-500' : 'border-amber-700/60 bg-slate-900'}`;
          atkDiv.innerHTML = `
            <div class="flex justify-between items-center mb-1">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-white">${castData.atkType === 'ranged_touch' ? 'Ranged Touch' : 'Melee Touch'}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-600/50 font-bold uppercase">Atk</span>
              </div>
              ${isCrit ? '<span class="badge bg-amber-500 text-black font-black">NAT 20 / CRITICAL</span>' : ''}
            </div>
            <div class="flex justify-between items-baseline font-mono border-t border-slate-800 pt-1.5 mt-1">
              <span class="text-xs text-slate-400">Atk: <strong class="text-amber-400 text-base font-black">${castData.totalAtk >= 0 ? '+' : ''}${castData.totalAtk}</strong></span>
              <span class="text-xs text-slate-400">(d20: <strong class="text-white">${castData.d20Atk}</strong> + ${castData.atkBonus})</span>
            </div>
            <div class="text-[10px] text-amber-300 truncate mt-1">Against target's Touch AC</div>
          `;
          summaryGrid.appendChild(atkDiv);
        }

        // 2. Spell Resistance (SR) Check Card (If Applicable)
        if (castData.hasSr) {
          const srDiv = document.createElement('div');
          srDiv.className = 'p-3 rounded-lg border border-purple-700/60 bg-slate-900';
          srDiv.innerHTML = `
            <div class="flex justify-between items-center mb-1">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-white">Spell Resistance (SR)</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-600/50 font-bold uppercase">SR</span>
              </div>
              <span class="text-[9px] font-mono text-purple-300 font-bold">CL ${castData.cl}</span>
            </div>
            <div class="flex justify-between items-baseline font-mono border-t border-slate-800 pt-1.5 mt-1">
              <span class="text-xs text-slate-400">SR: <strong class="text-purple-400 text-base font-black">${castData.totalSr}</strong></span>
              <span class="text-xs text-slate-400">(d20: <strong class="text-white">${castData.d20Sr}</strong> + ${castData.totalSrBonus})</span>
            </div>
            <div class="text-[10px] text-purple-300 truncate mt-1">Caster Level check to overcome target's SR</div>
          `;
          summaryGrid.appendChild(srDiv);
        }

        // 3. Defensive Casting Card (if active)
        if (castData.isDefensive) {
          const concDiv = document.createElement('div');
          concDiv.className = `p-3 rounded-lg border ${castData.concPassed ? 'border-indigo-700/60 bg-slate-900' : 'border-rose-700/60 bg-rose-950/30'}`;
          concDiv.innerHTML = `
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-white">Defensive Casting</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${castData.concPassed ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-rose-950 text-rose-300 border border-rose-600'}">${castData.concPassed ? 'Passed ✓' : 'Failed ✗'}</span>
            </div>
            <div class="flex justify-between items-baseline font-mono border-t border-slate-800 pt-1.5 mt-1">
              <span class="text-xs text-slate-400">Concentration: <strong class="text-indigo-300 text-base font-black">${castData.totalConc}</strong></span>
              <span class="text-xs text-slate-400">(d20: <strong class="text-white">${castData.d20Conc}</strong> vs DC ${castData.targetConcDc})</span>
            </div>
            <div class="text-[10px] text-slate-400 truncate mt-1">Concentration check to avoid AoO</div>
          `;
          summaryGrid.appendChild(concDiv);
        }

        // 4. Saving Throw (Save DC) Card
        const saveDiv = document.createElement('div');
        const hasSave = castData.saveType && !castData.saveType.toLowerCase().includes('none');
        saveDiv.className = 'p-3 rounded-lg border border-emerald-700/60 bg-slate-900';
        saveDiv.innerHTML = `
          <div class="flex justify-between items-center mb-1">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-white">Saving Throw</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-600/50 font-bold uppercase">DC</span>
            </div>
            <span class="text-[9px] font-mono font-bold text-emerald-300 truncate">${hasSave ? castData.saveType : 'None'}</span>
          </div>
          <div class="flex justify-between items-baseline font-mono border-t border-slate-800 pt-1.5 mt-1">
            <span class="text-xs text-slate-400">DC: <strong class="text-emerald-400 text-base font-black">DC ${castData.saveDc}</strong></span>
            <span class="text-xs text-slate-400">${hasSave ? castData.saveType : 'Auto-Effect'}</span>
          </div>
          <div class="text-[10px] text-slate-400 truncate mt-1">${hasSave ? 'Target rolls a saving throw against this DC' : 'No saving throw required, takes effect directly'}</div>
        `;
        summaryGrid.appendChild(saveDiv);

        // 5. Weapon Size Enhancement Card (if applicable)
        if (castData.isSizeModifier && castData.targetWeaponName) {
          const sizeDiv = document.createElement('div');
          sizeDiv.className = 'p-3 rounded-lg border border-purple-500/80 bg-purple-950/40 col-span-1 sm:col-span-2';
          sizeDiv.innerHTML = `
            <div class="flex justify-between items-center mb-1">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-white">✨ Effective Weapon Size Increase (RAW D&D 3.5e)</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-600/60 font-bold uppercase">+${castData.sizeSteps} Size Step(s)</span>
              </div>
              <span class="text-[10px] font-mono font-bold text-amber-300">${castData.targetWeaponName}</span>
            </div>
            <div class="flex justify-between items-baseline font-mono border-t border-purple-900/60 pt-1.5 mt-1">
              <span class="text-xs text-slate-300">Base Damage Dice Progression: <span class="line-through text-slate-500">${castData.oldDice}</span> ➔ <strong class="text-amber-300 text-sm font-black">${castData.newDice}</strong></span>
              <span class="text-xs text-purple-300 font-bold">Duration: ${castData.durationText}</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-1">Effective weapon damage size increased by ${castData.sizeSteps} step(s) at CL ${castData.cl}. Automatically applied in the Combat Cockpit.</div>
          `;
          summaryGrid.insertBefore(sizeDiv, summaryGrid.firstChild);
        }
      }

      // Grand Total Damage / Effect Banner
      const grandTotalEl = document.getElementById('result-grand-total-damage');
      if (grandTotalEl) {
        if (castData.isSizeModifier && castData.targetWeaponName) {
          grandTotalEl.textContent = `${castData.targetWeaponName}: ${castData.oldDice} ➔ ${castData.newDice} (+${castData.sizeSteps} Step(s))`;
        } else if (castData.hasDamageDice) {
          grandTotalEl.textContent = `${castData.finalDmg} HP (${castData.dmgType})`;
        } else {
          grandTotalEl.textContent = `Effect Active (${castData.durationText})`;
        }
      }

      // Detailed Breakdown Container
      const breakdownContainer = document.getElementById('result-breakdown-container');
      if (breakdownContainer) {
        breakdownContainer.innerHTML = `
          <div class="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs space-y-2 font-mono">
            <div class="flex items-center justify-between text-slate-300 border-b border-slate-800/80 pb-1.5">
              <span>🔮 Spell & Slot Level:</span>
              <span class="font-bold text-white">${spell.name} (Level ${castData.finalLvl} ${sourceLabels[castData.slotSource] || ''} Slot)</span>
            </div>
            ${(castData.isSizeModifier && castData.targetWeaponName) ? `
            <div class="flex items-center justify-between text-purple-300 border-b border-slate-800/80 pb-1.5">
              <span>🔮 Target Weapon & Damage Dice:</span>
              <span class="font-bold text-amber-300">${castData.targetWeaponName}: ${castData.oldDice} ➔ ${castData.newDice} (+${castData.sizeSteps} Size)</span>
            </div>` : ''}
            ${castData.hasDamageDice ? `
            <div class="flex items-center justify-between text-amber-300 border-b border-slate-800/80 pb-1.5">
              <span>⚡ Damage / Effect Dice:</span>
              <span class="font-bold">${castData.calcNotice}</span>
            </div>` : ''}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div><span class="text-slate-500">Range:</span> <span class="text-slate-200 font-semibold">${castData.rangeText}</span></div>
              <div><span class="text-slate-500">Target:</span> <span class="text-slate-200 font-semibold">${castData.targetText}</span></div>
              <div><span class="text-slate-500">Duration:</span> <span class="text-slate-200 font-semibold">${castData.durationText}</span></div>
              <div><span class="text-slate-500">Components:</span> <span class="text-slate-200 font-semibold">${castData.componentsText}</span></div>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-1.5 text-[11px]">
              ${castData.hasAtk ? `<span class="text-amber-300">⚔️ Attack Roll: <strong>Atk: +${castData.totalAtk}</strong> (d20:${castData.d20Atk}+${castData.atkBonus})</span>` : '<span class="text-slate-500">⚔️ Attack Roll: None (Auto-Hit)</span>'}
              ${castData.hasSr ? `<span class="text-purple-300">✨ Spell Resistance (SR): <strong>SR: ${castData.totalSr}</strong> (d20:${castData.d20Sr}+CL:${castData.totalSrBonus})</span>` : '<span class="text-slate-500">✨ Spell Resistance (SR): No</span>'}
            </div>
          </div>
        `;
      }

      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function closeSpellWeaponTargetModal() {
      const modal = document.getElementById('modal-spell-weapon-target');
      if (modal) modal.classList.add('hidden');
    }

    function confirmSpellCastOnWeapon(weaponName) {
      closeSpellWeaponTargetModal();
      initiateCombatSpellCast(weaponName);
    }

    function showSpellWeaponTargetModal(spell, cl, eligibleWeapons) {
      const modal = document.getElementById('modal-spell-weapon-target');
      if (!modal) return;

      const titleEl = document.getElementById('spell-target-modal-title');
      if (titleEl) titleEl.textContent = `${spell.name} — Select Target Weapon`;

      const subEl = document.getElementById('spell-target-modal-subtitle');
      if (subEl) subEl.textContent = `Caster Level ${cl} • Level ${spell.level} ${spell.school || 'Spell'}`;

      let steps = 1;
      if (spell.sizeModifier?.scaling?.type === 'per_caster_level') {
        const clDiv = spell.sizeModifier.scaling.clDivisor || 4;
        const maxSteps = spell.sizeModifier.scaling.maxSteps || 5;
        steps = Math.min(maxSteps, Math.floor(cl / clDiv));
      } else if (spell.sizeModifier?.scaling?.type === 'flat') {
        steps = spell.sizeModifier.scaling.steps || 1;
      }

      const descEl = document.getElementById('spell-target-modal-desc');
      if (descEl) {
        descEl.innerHTML = `
          <strong>${spell.name}</strong> applies to a touched bludgeoning melee weapon. 
          At your current Caster Level (<strong>CL ${cl}</strong>), the weapon's effective damage size increases by <strong>+${steps} step(s)</strong>. 
          Please select the weapon you want to imbue:
        `;
      }

      const listEl = document.getElementById('spell-target-weapons-list');
      if (listEl) {
        listEl.innerHTML = eligibleWeapons.map(w => {
          const rawDice = w.dice || '1d8';
          const steppedDice = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.stepDamageDice === 'function')
            ? RuleEngine.stepDamageDice(rawDice, steps)
            : rawDice;

          const isCurrentActive = character.activeWeapon === w.name;

          const escapedName = (w.name || '').replace(/'/g, "\\'");
          return `
            <div onclick="confirmSpellCastOnWeapon('${escapedName}')" class="p-3 rounded-xl border border-slate-700 bg-slate-900/90 hover:border-purple-500 hover:bg-purple-950/40 transition cursor-pointer flex items-center justify-between group">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-xs group-hover:text-purple-300 transition">${safeEscapeHtml(w.name)}</span>
                  ${isCurrentActive ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/50 font-bold">Equipped</span>' : ''}
                </div>
                <div class="text-[10px] text-slate-400 font-mono">Type: ${safeEscapeHtml(w.dmgType || 'Bludgeoning')} • Grip: ${safeEscapeHtml(w.grip || '1-Hand')}</div>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right font-mono">
                  <div class="text-[10px] text-slate-400 line-through">${rawDice}</div>
                  <div class="text-xs font-black text-amber-300 group-hover:text-amber-200">➔ ${steppedDice}</div>
                </div>
                <button type="button" class="px-3 py-1.5 rounded-lg bg-purple-600 group-hover:bg-purple-500 text-white font-bold text-xs shadow-md transition shrink-0">
                  Apply
                </button>
              </div>
            </div>
          `;
        }).join('');
      }

      modal.classList.remove('hidden');
    }

    function initiateCombatSpellCast(targetWeaponName = null) {
      const spell = getSelectedCombatSpell();
      if (!spell) return;

      const cl = getEffectiveSpellCasterLevel(spell);

      // Check for sizeModifier targetType: weapon (e.g. Greater Mighty Wallop, Mighty Wallop)
      if (spell.sizeModifier?.targetType === 'weapon' && !targetWeaponName) {
        const eligibleWeapons = (character.weapons || []).filter(w => {
          if (!w) return false;
          if (spell.sizeModifier.targetFilter?.meleeOnly) {
            const isRanged = w.isRanged || w.grip === 'Ranged' || (w.tags && w.tags.includes('ranged'));
            if (isRanged) return false;
          }
          if (Array.isArray(spell.sizeModifier.targetFilter?.allowedDmgTypes) && spell.sizeModifier.targetFilter.allowedDmgTypes.length > 0) {
            const dt = (w.dmgType || '').toLowerCase();
            const tags = (w.tags || []).map(t => String(t).toLowerCase());
            const matchesType = spell.sizeModifier.targetFilter.allowedDmgTypes.some(type => {
              const tLower = type.toLowerCase();
              return dt.includes(tLower) || tags.includes(tLower);
            });
            if (!matchesType) return false;
          }
          return true;
        });

        if (eligibleWeapons.length === 0) {
          showDiceTopToast({
            icon: '⚠️',
            title: 'No Eligible Weapon Found!',
            breakdown: `${spell.name} can only be cast on bludgeoning melee weapons. No eligible weapon found!`,
            total: 'Invalid Target'
          });
          return;
        }

        showSpellWeaponTargetModal(spell, cl, eligibleWeapons);
        return;
      }

      const baseLvl = Number(spell.level) || 0;
      const activeSpellMods = typeof getActiveSpellTacticalModifiers === 'function' ? getActiveSpellTacticalModifiers() : [];
      let slotDiff = 0;
      let dcBonus = 0;
      let isEmpower = false;
      let isMaximize = false;
      let isEnlarge = false;
      let isExtend = false;
      let isQuicken = false;

      activeSpellMods.forEach(mod => {
        if (!mod) return;
        if (mod.key === 'empower' || mod.id === 'meta_empower') isEmpower = true;
        if (mod.key === 'maximize' || mod.id === 'meta_maximize') isMaximize = true;
        if (mod.key === 'enlarge' || mod.id === 'meta_enlarge') isEnlarge = true;
        if (mod.key === 'extend' || mod.id === 'meta_extend') isExtend = true;
        if (mod.key === 'quicken' || mod.id === 'meta_quicken') isQuicken = true;
        if (Number(mod.slotDiff)) slotDiff += Number(mod.slotDiff);
      });

      // Fallback check on checkboxes if present
      if (!isEmpower && document.getElementById('mod-empower-spell')?.checked) { isEmpower = true; slotDiff += 2; }
      if (!isMaximize && document.getElementById('mod-maximize-spell')?.checked) { isMaximize = true; slotDiff += 3; }
      if (!isEnlarge && document.getElementById('mod-enlarge-spell')?.checked) { isEnlarge = true; slotDiff += 1; }
      if (!isExtend && document.getElementById('mod-extend-spell')?.checked) { isExtend = true; slotDiff += 1; }

      const finalLvl = baseLvl + slotDiff;
      const isMetamagicActive = slotDiff > 0 || isEmpower || isMaximize || isEnlarge || isExtend || isQuicken;

      // Defensive Casting Check (D&D 3.5e RAW: Concentration DC 15 + Spell Level)
      const isDefensive = Boolean(character?.tactical?.defensiveCastingActive || document.getElementById('mod-defensive-casting')?.checked);
      let d20Conc = 0, totalConc = 0, targetConcDc = 15 + finalLvl, concPassed = true;
      if (isDefensive) {
        const concSkill = (character.skills || []).find(s => s && s.name && s.name.toLowerCase() === 'concentration');
        const concRanks = Number(concSkill?.ranks) || 0;
        const concMisc = Number(concSkill?.misc) || 0;
        const conMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.con || 10) : 0;
        const concBonus = concRanks + conMod + concMisc;
        d20Conc = Math.floor(Math.random() * 20) + 1;
        totalConc = d20Conc + concBonus;
        concPassed = totalConc >= targetConcDc;

        if (typeof addDiceHistoryEntry === 'function') {
          addDiceHistoryEntry({
            icon: '🛡️',
            title: 'Defensive Casting (Concentration)',
            formula: `1d20 + ${concBonus} vs DC ${targetConcDc}`,
            breakdown: `d20: ${d20Conc} + ${concBonus} = ${totalConc} vs DC ${targetConcDc}`,
            total: concPassed ? 'Passed (No AoO)' : 'Failed (Spell Lost)',
            isCrit: d20Conc === 20
          });
        }

        if (!concPassed) {
          showDiceTopToast({
            icon: '⚠️',
            title: 'Concentration Failed!',
            breakdown: `d20:${d20Conc} + ${concBonus} = ${totalConc} (Required: DC ${targetConcDc}). The spell fizzles!`,
            total: 'Fizzled'
          });
          // Consume slot on failure (RAW 3.5e)
          const slotSource = typeof getSpellSlotSource === 'function' ? getSpellSlotSource(spell) : 'spontaneous';
          const slots = typeof getSpellSlotsArrayBySource === 'function' ? getSpellSlotsArrayBySource(slotSource) : (character?.spellcasting?.slots || []);
          const targetSlot = slots.find(s => Number(s.level) === finalLvl);
          if (targetSlot) {
            targetSlot.used++;
            if (typeof renderSpellSlots === 'function') renderSpellSlots();
            if (slotSource === 'prepared' && typeof renderPreparedSpells === 'function') renderPreparedSpells();
            if (slotSource === 'divine' && typeof renderDivineSpells === 'function') renderDivineSpells();
            renderSpellSlotsStrip();
            renderCombatCategorySpells();
            saveStateToStorage(false);
          }
          recalculateCombatSpell();
          return;
        }
      }

      // Consume slot
      const slotSource = typeof getSpellSlotSource === 'function' ? getSpellSlotSource(spell) : 'spontaneous';
      const slots = typeof getSpellSlotsArrayBySource === 'function' ? getSpellSlotsArrayBySource(slotSource) : (character?.spellcasting?.slots || []);
      const targetSlot = slots.find(s => Number(s.level) === finalLvl);
      const sourceLabels = { spontaneous: 'Spont.', prepared: 'Prep.', divine: 'Divine' };

      if (!targetSlot || Number(targetSlot.daily) <= 0) {
        showDiceTopToast({
          icon: '⚠️',
          title: 'Spell Slot Unavailable!',
          breakdown: `Level ${finalLvl} ${sourceLabels[slotSource] || ''} spell slot is locked or unavailable on this character!`,
          total: 'Error'
        });
        return;
      }

      if (targetSlot.used >= targetSlot.daily) {
        showDiceTopToast({
          icon: '⚠️',
          title: 'No Spell Slots Remaining!',
          breakdown: `You have no Level ${finalLvl} ${sourceLabels[slotSource] || ''} spell slots remaining (${targetSlot.used}/${targetSlot.daily}).`,
          total: 'Error'
        });
        return;
      }

      targetSlot.used++;
      if (typeof renderSpellSlots === 'function') renderSpellSlots();
      if (slotSource === 'prepared' && typeof renderPreparedSpells === 'function') renderPreparedSpells();
      if (slotSource === 'divine' && typeof renderDivineSpells === 'function') renderDivineSpells();
      renderSpellSlotsStrip();
      renderCombatCategorySpells();
      saveStateToStorage(false);

      // If Quicken, consume Swift Action; if spontaneous metamagic, consume Full-Round Action in Action Economy!
      if (isQuicken) {
        if (!character.tactical) character.tactical = {};
        if (!character.tactical.spentActions) character.tactical.spentActions = {};
        character.tactical.spentActions.swift = true;
        if (typeof updateActionEconomyUI === 'function') updateActionEconomyUI();
      } else if (isMetamagicActive) {
        if (!character.tactical) character.tactical = {};
        if (!character.tactical.spentActions) character.tactical.spentActions = {};
        character.tactical.spentActions.standard = true;
        character.tactical.spentActions.move = true;
        if (typeof updateActionEconomyUI === 'function') updateActionEconomyUI();
      } else {
        if (!character.tactical) character.tactical = {};
        if (!character.tactical.spentActions) character.tactical.spentActions = {};
        character.tactical.spentActions.standard = true;
        if (typeof updateActionEconomyUI === 'function') updateActionEconomyUI();
      }

      // Dynamic Spell Scaling (D&D 3.5e RAW)
      const params = typeof getSpellCriticalParams === 'function' ? getSpellCriticalParams(spell) : {};
      const scaling = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.resolveSpellDynamicScaling === 'function')
        ? RuleEngine.resolveSpellDynamicScaling(spell, cl)
        : null;

      // 1. Attack Roll Check (if touch/ranged touch)
      const atkType = getSpellAttackType(spell);
      const hasAtk = Boolean(atkType);
      let d20Atk = 0, atkBonus = 0, totalAtk = 0, isAtkCrit = false;
      if (hasAtk) {
        const bab = Number(character?.bab) || 0;
        const dexMod = RuleEngine ? RuleEngine.getAbilityMod(character?.abilities?.dex || 10) : 0;
        const strMod = RuleEngine ? RuleEngine.getAbilityMod(character?.abilities?.str || 10) : 0;
        atkBonus = (atkType === 'ranged_touch') ? (bab + dexMod) : (bab + strMod);
        d20Atk = Math.floor(Math.random() * 20) + 1;
        totalAtk = d20Atk + atkBonus;
        isAtkCrit = (d20Atk === 20);
      }

      // 2. Spell Resistance Check (if subject to SR)
      const hasSr = getSpellHasSpellResistance(spell);
      let d20Sr = 0, totalSrBonus = 0, totalSr = 0;
      if (hasSr) {
        const featsList = character.feats || [];
        const hasSpellPen = featsList.some(f => (f.name || '').toLowerCase().includes('spell penetration') && !(f.name || '').toLowerCase().includes('greater'));
        const hasGrtSpellPen = featsList.some(f => (f.name || '').toLowerCase().includes('greater spell penetration'));
        const srBonusFromFeats = hasGrtSpellPen ? 4 : (hasSpellPen ? 2 : 0);
        totalSrBonus = cl + srBonusFromFeats;
        d20Sr = Math.floor(Math.random() * 20) + 1;
        totalSr = d20Sr + totalSrBonus;
      }

      // 3. Save DC Check
      const chaMod = RuleEngine ? RuleEngine.getAbilityMod(character?.abilities?.cha || 10) : 0;
      const saveDc = 10 + finalLvl + chaMod + dcBonus;

      // 4. Damage Dice / Effect
      const hasDamageDice = (scaling && scaling.diceCount > 0) || !!spell.dice || (spell.benefit && /\d+d\d+/i.test(spell.benefit));
      let count = 1, sides = 6, staticBonus = 0;
      let diceStr = '';

      if (scaling && scaling.diceCount > 0) {
        count = scaling.diceCount;
        sides = scaling.dieSides;
        staticBonus = scaling.staticBonus || 0;
        diceStr = scaling.diceFormula;
      } else if (hasDamageDice) {
        const rawDice = spell.dice || (spell.benefit && spell.benefit.match(/\d+d\d+(?:\s*[+-]\s*\d+)?/i) ? spell.benefit.match(/\d+d\d+(?:\s*[+-]\s*\d+)?/i)[0] : '');
        const dMatch = (rawDice || '').match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
        if (dMatch) {
          count = parseInt(dMatch[1], 10) || 1;
          sides = parseInt(dMatch[2], 10) || 6;
          if (dMatch[4]) {
            staticBonus = dMatch[3] === '-' ? -parseInt(dMatch[4], 10) : parseInt(dMatch[4], 10);
          }
          diceStr = rawDice;
        }
      }

      const diceToRoll3D = [];
      const rolls = [];
      let rawSum = 0;

      if (hasAtk) diceToRoll3D.push({ type: 'd20', value: d20Atk });
      if (hasSr) diceToRoll3D.push({ type: 'd20', value: d20Sr });
      if (isDefensive) diceToRoll3D.push({ type: 'd20', value: d20Conc });

      if (hasDamageDice) {
        for (let i = 0; i < count; i++) {
          const r = Math.floor(Math.random() * sides) + 1;
          rolls.push(r);
          rawSum += r;
          diceToRoll3D.push({ type: 'd' + sides, value: r });
        }
      } else if (diceToRoll3D.length === 0) {
        diceToRoll3D.push({ type: 'd20', value: 20 });
      }

      let finalDmg = rawSum + staticBonus;
      let calcNotice = '';
      const bonusStr = staticBonus > 0 ? ` + ${staticBonus}` : (staticBonus < 0 ? ` - ${Math.abs(staticBonus)}` : '');
      const projLabel = (scaling && scaling.projectiles > 1 && scaling.projectileName) ? `${scaling.projectiles} ${scaling.projectileName}` : '';

      if (hasDamageDice) {
        if (isEmpower && isMaximize) {
          const maxVal = count * sides + staticBonus;
          const empowerBonus = Math.floor((rawSum + staticBonus) * 0.5);
          finalDmg = maxVal + empowerBonus;
          calcNotice = `Max (${maxVal}) + Empowered (+${empowerBonus}) = ${finalDmg}${projLabel ? ` (${projLabel})` : ''}`;
        } else if (isEmpower) {
          const totalBase = rawSum + staticBonus;
          finalDmg = Math.floor(totalBase * 1.5);
          calcNotice = `Roll [${rolls.join('+')}]${bonusStr} = ${totalBase} × 1.5 = ${finalDmg}${projLabel ? ` (${projLabel})` : ''}`;
        } else if (isMaximize) {
          finalDmg = count * sides + staticBonus;
          calcNotice = `Max Roll = ${finalDmg}${projLabel ? ` (${projLabel})` : ''}`;
        } else {
          calcNotice = `Roll [${rolls.join('+')}]${bonusStr} = ${finalDmg}${projLabel ? ` (${projLabel})` : ''}`;
        }
      } else {
        calcNotice = spell.duration || 'Effect active';
      }

      // Helper for Range text
      function formatSpellRangeWithFeet(rangeStr, casterLvl) {
        if (!rangeStr) return 'Close';
        const rLower = rangeStr.toLowerCase();
        if (rLower.includes('personal')) return 'Personal';
        if (rLower.includes('touch')) return 'Touch';
        if (rLower.includes('close')) {
          const feet = 25 + Math.floor(casterLvl / 2) * 5;
          return `Close (${feet} ft)`;
        }
        if (rLower.includes('medium')) {
          const feet = 100 + casterLvl * 10;
          return `Medium (${feet} ft)`;
        }
        if (rLower.includes('long')) {
          const feet = 400 + casterLvl * 40;
          return `Long (${feet} ft)`;
        }
        return rangeStr;
      }

      // Size modifier buff processing (Data-driven: weapon size or creature size scaling)
      let isSizeModifier = false;
      let targetWeaponObj = null;
      let oldDice = '';
      let newDice = '';
      let calculatedSteps = 0;

      if (spell.sizeModifier?.targetType === 'weapon' && targetWeaponName) {
        isSizeModifier = true;
        targetWeaponObj = (character.weapons || []).find(w => w && w.name === targetWeaponName);
        oldDice = targetWeaponObj?.dice || '1d8';

        if (spell.sizeModifier.scaling?.type === 'per_caster_level') {
          const clDiv = spell.sizeModifier.scaling.clDivisor || 4;
          const maxSteps = spell.sizeModifier.scaling.maxSteps || 5;
          calculatedSteps = Math.min(maxSteps, Math.floor(cl / clDiv));
        } else if (spell.sizeModifier.scaling?.type === 'flat') {
          calculatedSteps = spell.sizeModifier.scaling.steps || 1;
        }

        newDice = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.stepDamageDice === 'function')
          ? RuleEngine.stepDamageDice(oldDice, calculatedSteps)
          : oldDice;

        if (!Array.isArray(character.buffs)) character.buffs = [];
        const existingIdx = character.buffs.findIndex(b => b.name === spell.name && b.targetWeapon === targetWeaponName);
        const buffObj = {
          name: spell.name,
          active: true,
          source: 'Spell',
          targetWeapon: targetWeaponName,
          sizeSteps: calculatedSteps,
          baseDice: oldDice,
          effectiveDice: newDice,
          cl: cl,
          duration: `${cl} hours`,
          description: `${targetWeaponName} damage dice increased by ${calculatedSteps} size step(s) (${oldDice} ➔ ${newDice}).`
        };

        if (existingIdx !== -1) {
          character.buffs[existingIdx] = buffObj;
        } else {
          character.buffs.push(buffObj);
        }

        saveStateToStorage(true);
      } else if (spell.sizeModifier?.targetType === 'creature') {
        isSizeModifier = true;
        calculatedSteps = spell.sizeModifier.scaling?.steps || 1;
        if (!Array.isArray(character.buffs)) character.buffs = [];
        const existingIdx = character.buffs.findIndex(b => b.name === spell.name);
        const buffObj = {
          name: spell.name,
          active: true,
          source: 'Spell',
          targetType: 'creature',
          sizeSteps: calculatedSteps,
          strBonus: spell.strBonus || 2,
          dexBonus: spell.dexBonus || -2,
          acBonus: spell.acBonus || -1,
          attBonus: spell.attBonus || -1,
          cl: cl,
          duration: `${cl} min`,
          description: `Creature and its weapons increase by ${calculatedSteps} size category.`
        };
        if (existingIdx !== -1) {
          character.buffs[existingIdx] = buffObj;
        } else {
          character.buffs.push(buffObj);
        }
        saveStateToStorage(true);
      }

      const castData = {
        finalLvl,
        cl,
        slotSource,
        hasAtk,
        atkType,
        atkBonus,
        d20Atk,
        totalAtk,
        isAtkCrit,
        hasSr,
        totalSrBonus,
        d20Sr,
        totalSr,
        isDefensive,
        d20Conc,
        totalConc,
        targetConcDc,
        concPassed,
        saveDc,
        saveType: spell.save,
        hasDamageDice,
        damageDiceStr: diceStr,
        rolls,
        staticBonus,
        finalDmg,
        dmgType: scaling?.dmgType || spell.dmgType || 'Force',
        calcNotice,
        isEmpower,
        isMaximize,
        isQuicken,
        isEnlarge,
        isExtend,
        isSizeModifier,
        targetWeaponName,
        oldDice,
        newDice,
        sizeSteps: calculatedSteps,
        rangeText: formatSpellRangeWithFeet(params.range, cl),
        durationText: params.duration || spell.duration || 'Instantaneous',
        targetText: params.target || spell.target || (targetWeaponName ? `Weapon: ${targetWeaponName}` : '1 Target'),
        componentsText: params.components || spell.components || 'V, S'
      };

      // Summary string for Toast and History
      const summaryList = [];
      if (isSizeModifier && targetWeaponName) {
        summaryList.push(`${targetWeaponName}: ${oldDice} ➔ ${newDice}`);
      }
      if (hasAtk) summaryList.push(`Atk: ${totalAtk >= 0 ? '+' : ''}${totalAtk}`);
      if (hasSr) summaryList.push(`SR: ${totalSr}`);
      if (hasDamageDice) summaryList.push(`${finalDmg} Damage`);
      else if (!isSizeModifier) summaryList.push(`DC ${saveDc}`);
      const summaryText = summaryList.join(', ');

      const onComplete = () => {
        // 1. Render in attack results card at the bottom of the Combat page
        renderSpellCastResults(spell, castData);

        // 2. Toast notification
        if (castData.isSizeModifier && castData.targetWeaponName) {
          showDiceTopToast({
            icon: '🔮',
            title: `${spell.name} Active!`,
            breakdown: `${castData.targetWeaponName}: ${castData.oldDice} ➔ ${castData.newDice} (+${castData.sizeSteps} size steps). Duration: ${castData.durationText}`,
            total: castData.newDice
          });
        } else {
          showDiceTopToast({
            icon: '🔮',
            title: `Cast ${spell.name}`,
            breakdown: `Level ${finalLvl} Slot • ${summaryText}`,
            total: hasDamageDice ? `${finalDmg} Damage` : (hasAtk ? `Atk: +${totalAtk}` : `SR: ${totalSr}`)
          });
        }

        // 3. Add to dice history
        if (typeof addDiceHistoryEntry === 'function') {
          addDiceHistoryEntry({
            icon: '🔮',
            title: `Casting ${spell.name}`,
            formula: summaryText,
            breakdown: [
              (castData.isSizeModifier && castData.targetWeaponName) ? `${castData.targetWeaponName}: ${castData.oldDice} ➔ ${castData.newDice} (+${castData.sizeSteps} Size)` : null,
              hasAtk ? `Atk: ${totalAtk} (d20:${d20Atk}+${atkBonus}${isAtkCrit ? ' ⚡' : ''})` : null,
              hasSr ? `SR: ${totalSr} (d20:${d20Sr}+CL:${totalSrBonus})` : null,
              hasDamageDice ? calcNotice : `DC ${saveDc} ${spell.save || ''}`
            ].filter(Boolean).join(' • '),
            total: (castData.isSizeModifier && castData.targetWeaponName) ? `${castData.newDice} (+${castData.sizeSteps})` : (hasDamageDice ? `${finalDmg} Damage` : `DC ${saveDc}`),
            isCrit: isAtkCrit
          });
        }

        if (typeof renderAll === 'function') renderAll();
        if (typeof recalculateOffense === 'function') recalculateOffense();
        recalculateCombatSpell();
        renderSpellSlotsStrip();
        renderCombatCategorySpells();
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function') {
        try {
          Dice3D.roll(diceToRoll3D.slice(0, 10), onComplete);
        } catch (e) {
          onComplete();
        }
      } else {
        onComplete();
      }
    }

    function rollSpellResistanceCheck() {
      const cl = Number(character.casterLevel) || (character.classes ? Object.values(character.classes)[0]?.level : 1) || 1;
      const featsList = character.feats || [];
      const hasSpellPen = featsList.some(f => (f.name || '').toLowerCase().includes('spell penetration') && !(f.name || '').toLowerCase().includes('greater'));
      const hasGrtSpellPen = featsList.some(f => (f.name || '').toLowerCase().includes('greater spell penetration'));
      const srBonusFromFeats = hasGrtSpellPen ? 4 : (hasSpellPen ? 2 : 0);
      const totalBonus = cl + srBonusFromFeats;
      const d20 = Math.floor(Math.random() * 20) + 1;
      const totalCheck = d20 + totalBonus;

      const formulaStr = srBonusFromFeats > 0 ? `1d20 + ${cl} (CL) + ${srBonusFromFeats} (Feat)` : `1d20 + ${cl} (CL)`;
      const breakdownStr = srBonusFromFeats > 0 ? `d20:${d20} + CL:${cl} + Feat:${srBonusFromFeats} = ${totalCheck}` : `d20:${d20} + CL:${cl} = ${totalCheck}`;

      const onComplete = () => {
        showDiceTopToast({
          icon: '🔮',
          title: 'Spell Resistance (SR) Check',
          breakdown: breakdownStr,
          total: `SR Check: ${totalCheck}`
        });
        if (typeof addDiceHistoryEntry === 'function') {
          addDiceHistoryEntry({
            icon: '🔮',
            title: 'Spell Resistance (SR) Check',
            formula: formulaStr,
            breakdown: breakdownStr,
            total: `${totalCheck}`,
            isCrit: d20 === 20
          });
        }
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function') {
        try {
          Dice3D.roll([{ type: 'd20', value: d20 }], onComplete);
        } catch (e) {
          onComplete();
        }
      } else {
        onComplete();
      }
    }

    function onWeaponChange() {
      character.activeWeapon = document.getElementById('active-weapon-select').value;
      const wep = (character.weapons || []).find(w => w.name === character.activeWeapon) || (typeof findWeaponEverywhere === 'function' ? findWeaponEverywhere(character.activeWeapon) : null);
      const isTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(character.activeWeapon) : false;
      const hasOversized = typeof RuleEngine !== 'undefined' ? RuleEngine.hasOversizedWeaponFeat(character) : false;

      if (isTwoHand && !hasOversized) {
        if (wep) wep.grip = '2-Hand';
        const gripSelect = document.getElementById('active-grip-select');
        if (gripSelect) gripSelect.value = '2-Hand';

        // Rule 3: Clear off-hand slot when a two-handed weapon is selected in main hand
        character.activeOffHand = 'None';
        if (character.tactical?.weaponSets) {
          character.tactical.weaponSets.set1.mainWeapon = character.activeWeapon;
          character.tactical.weaponSets.set1.grip = '2-Hand';
          character.tactical.weaponSets.set2.mainWeapon = 'None';
          character.tactical.weaponSets.set2.grip = 'Off-Hand';
          character.tactical.weaponSets.activeSets = [1];
          character.tactical.weaponSets.activeSet = 1;
        }
        syncWeaponSetToBodySlot('offHand', 'None');
        const offSelect = document.getElementById('active-offhand-select');
        if (offSelect) offSelect.value = 'None';

        let twfMod = (character.activeModifiers || []).find(m => m && m.name && (m.name.includes('TWF') || m.name.includes('Two-Weapon')));
        if (twfMod) twfMod.active = false;

        if (typeof showToast === 'function') {
          showToast(`"${character.activeWeapon}" is a two-handed weapon. Off-hand slot cleared automatically.`, 'info');
        }
      } else if (wep) {
        if (wep.grip) {
          const gripSelect = document.getElementById('active-grip-select');
          if (gripSelect) gripSelect.value = wep.grip;
        } else if (isTwoHand) {
          const gripSelect = document.getElementById('active-grip-select');
          if (gripSelect) gripSelect.value = '2-Hand';
        }
      }
      syncCombatGripUI();
      renderWeaponSetsUI();
      recalculateOffense();
      saveStateToStorage();
    }

    function setCombatGrip(grip) {
      const gripSelect = document.getElementById('active-grip-select');
      if (gripSelect) {
        gripSelect.value = grip;
      }
      const wep = (character.weapons || []).find(w => w.name === character.activeWeapon);
      if (wep) {
        wep.grip = grip;
      }
      syncCombatGripUI();
      recalculateOffense();
      saveStateToStorage(false);
    }

    function syncCombatGripUI() {
      const gripSelect = document.getElementById('active-grip-select');
      const grip = gripSelect?.value || '1-Hand';
      const btn1h = document.getElementById('grip-btn-1h');
      const btn2h = document.getElementById('grip-btn-2h');
      
      if (btn1h && btn2h) {
        if (grip === '2-Hand') {
          btn2h.className = 'px-2.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer bg-amber-500/30 text-amber-200 border border-amber-500/50 shadow-sm';
          btn1h.className = 'px-2.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer text-slate-400 hover:text-white border border-transparent';
        } else {
          btn1h.className = 'px-2.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer bg-amber-500/30 text-amber-200 border border-amber-500/50 shadow-sm';
          btn2h.className = 'px-2.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer text-slate-400 hover:text-white border border-transparent';
        }
      }
    }

    // --- WEAPON SETS SYSTEM (CARD 1 MAIN HAND, CARD 2 OFF-HAND) ---
    function enrichWeaponStats(item, wepName) {
      if (!item) item = {};
      const targetName = wepName || item.name || '';
      item.name = targetName;
      const lower = targetName.toLowerCase();

      // Ensure dice
      if (!item.dice) {
        if (lower.includes('unarmed')) {
          const monkLvl = (character?.levelProgression || []).filter(l => (l.className || '').toLowerCase().includes('monk')).length;
          const isSmall = (character?.size || '').toLowerCase() === 'small';
          if (monkLvl >= 1) item.dice = isSmall ? '1d4' : '1d6';
          else item.dice = isSmall ? '1d2' : '1d3';
        }
        else if (lower.includes('dagger')) item.dice = '1d4';
        else if (lower.includes('rapier')) item.dice = '1d6';
        else if (lower.includes('spiked chain')) item.dice = '2d4';
        else if (lower.includes('shortsword')) item.dice = '1d6';
        else if (lower.includes('longsword')) item.dice = '1d8';
        else if (lower.includes('greatsword')) item.dice = '2d6';
        else if (lower.includes('heavy shield')) item.dice = '1d4';
        else if (lower.includes('light shield') || lower.includes('buckler')) item.dice = '1d3';
        else item.dice = '1d4';
      }

      // Ensure critMin
      if (!item.critMin) {
        if (lower.includes('rapier')) item.critMin = 18;
        else if (lower.includes('dagger') || lower.includes('shortsword') || lower.includes('kukri') || lower.includes('scimitar')) item.critMin = 19;
        else item.critMin = 20;
      }

      // Ensure critMult
      if (!item.critMult) {
        if (lower.includes('scythe') || lower.includes('pick')) item.critMult = 4;
        else if (lower.includes('axe') || lower.includes('spear') || lower.includes('bow')) item.critMult = 3;
        else item.critMult = 2;
      }

      // Ensure dmgType
      if (!item.dmgType) {
        if (lower.includes('unarmed') || lower.includes('mace') || lower.includes('flail') || lower.includes('club') || lower.includes('hammer') || lower.includes('shield')) {
          item.dmgType = 'Bludgeoning';
        } else if (lower.includes('rapier') || lower.includes('dagger') || lower.includes('chain') || lower.includes('spear') || lower.includes('bow')) {
          item.dmgType = 'Piercing';
        } else {
          item.dmgType = 'Slashing';
        }
      }

      // Ensure attBonus
      if (item.attBonus === undefined) {
        if (lower.includes('+5')) item.attBonus = 5;
        else if (lower.includes('+4')) item.attBonus = 4;
        else if (lower.includes('+3')) item.attBonus = 3;
        else if (lower.includes('+2')) item.attBonus = 2;
        else if (lower.includes('+1')) item.attBonus = 1;
        else if (lower.includes('masterwork') || lower.includes('mwk')) item.attBonus = 1;
        else item.attBonus = 0;
      }

      // Ensure dmgBonus
      if (item.dmgBonus === undefined) {
        if (lower.includes('+5')) item.dmgBonus = 5;
        else if (lower.includes('+4')) item.dmgBonus = 4;
        else if (lower.includes('+3')) item.dmgBonus = 3;
        else if (lower.includes('+2')) item.dmgBonus = 2;
        else if (lower.includes('+1')) item.dmgBonus = 1;
        else item.dmgBonus = 0;
      }

      if (item.isLight === undefined) {
        item.isLight = lower.includes('dagger') || lower.includes('shortsword') || lower.includes('kukri') || lower.includes('light') || lower.includes('unarmed');
      }

      return item;
    }

    function findWeaponEverywhere(wepName) {
      if (!wepName || wepName === 'None' || wepName === '-') return null;

      // 1. Check character.weapons
      let found = (character.weapons || []).find(w => w && w.name === wepName);
      if (!found) {
        found = (character.weapons || []).find(w => w && w.name && w.name.toLowerCase().trim() === wepName.toLowerCase().trim());
      }
      if (found) return enrichWeaponStats({ ...found }, wepName);

      // 2. Check bodySlots.mainHand / offHand
      if (character.bodySlots?.mainHand?.name === wepName) {
        return enrichWeaponStats({ ...character.bodySlots.mainHand }, wepName);
      }
      if (character.bodySlots?.offHand?.name === wepName) {
        return enrichWeaponStats({ ...character.bodySlots.offHand }, wepName);
      }

      // 3. Check gearPool
      found = (character.gearPool || []).find(g => g && g.name === wepName);
      if (found) return enrichWeaponStats({ ...found }, wepName);

      // 4. Check masterDb if available
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        found = masterDb.find(item => item && (item.name === wepName || item.masterDbName === wepName));
        if (found) return enrichWeaponStats({ ...found }, wepName);
      }

      // 4.5 Check window.BUNDLED_SRD_CORE_CATALOG (Ghost Core SRD)
      if (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        found = window.BUNDLED_SRD_CORE_CATALOG.find(item => item && item.name && item.name.toLowerCase().trim() === wepName.toLowerCase().trim());
        if (found) return enrichWeaponStats({ ...found }, wepName);
      }

      // 5. Parametric D&D 3.5e standard weapon fallback
      return enrichWeaponStats({}, wepName);
    }

    // Helper to determine if a weapon is strictly a ranged-only projectile weapon (e.g. Longbow, Crossbow, Sling)
    // Melee weapons and versatile/thrown weapons (Dagger, Unarmed Strike, Spiked Chain, etc.) return false.
    function isRangedOnlyWeapon(item) {
      if (!item) return false;
      const name = typeof item === 'string' ? item : (item.name || '');
      if (!name || name === '-' || name === 'None') return false;
      const low = name.toLowerCase().trim();

      // Versatile / thrown / melee exceptions that can ALWAYS be used in melee
      if (low.includes('unarmed') || low.includes('dagger') || low.includes('spiked chain') || low.includes('rapier') || low.includes('jovar')) {
        return false;
      }

      // 1. Direct item property check
      if (typeof item === 'object') {
        if (item.combatScope === 'ranged') return true;
        if (item.combatScope === 'both' || item.combatScope === 'melee') return false;
      }

      // 2. Lookup in masterDb (if available)
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const m = masterDb.find(entry => entry && (
          (entry.name && entry.name.toLowerCase().trim() === low) ||
          (entry.masterDbName && entry.masterDbName.toLowerCase().trim() === low)
        ));
        if (m) {
          if (m.combatScope === 'ranged') return true;
          if (m.combatScope === 'both' || m.combatScope === 'melee') return false;
        }
      }

      // 3. Keyword heuristic for projectile / purely ranged weapons
      if (
        low.includes('longbow') || 
        low.includes('shortbow') || 
        low.includes('crossbow') || 
        low.includes('composite') || 
        low.includes('sling') || 
        low.includes('bow')
      ) {
        return true;
      }

      return false;
    }

    // Helper to determine if an item is a Shield (Buckler, Light Shield, Heavy Shield, Tower Shield)
    function isShieldItem(item) {
      if (!item) return false;
      const name = typeof item === 'string' ? item : (item.name || '');
      if (!name || name === '-' || name === 'None') return false;

      // 1. Direct object properties
      if (typeof item === 'object') {
        if (item.category === 'Shield' || item.type === 'Shield' || item.slot === 'Shield' || item.slot === 'Off-Hand Shield' || item.dmgType === 'Shield' || item.isShield) {
          return true;
        }
      }

      // 2. Master DB check
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const clean = name.toLowerCase().trim();
        const m = masterDb.find(entry => entry && ((entry.name && entry.name.toLowerCase().trim() === clean) || (entry.masterDbName && entry.masterDbName.toLowerCase().trim() === clean)));
        if (m && (m.type === 'Shield' || m.category === 'Shield' || m.slot === 'Shield' || (Array.isArray(m.tags) && m.tags.includes('shield')))) {
          return true;
        }
      }

      // 3. Fallback string check
      const low = name.toLowerCase().trim();
      return low.includes('shield') || low.includes('buckler');
    }

    // Helper to determine if a shield is a Buckler
    function isBucklerItem(item) {
      if (!item) return false;
      const name = typeof item === 'string' ? item : (item.name || '');
      if (!name) return false;

      if (typeof item === 'object') {
        if (item.shieldType === 'Buckler' || (Array.isArray(item.tags) && item.tags.some(t => String(t).toLowerCase() === 'buckler'))) {
          return true;
        }
      }

      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const clean = name.toLowerCase().trim();
        const m = masterDb.find(entry => entry && ((entry.name && entry.name.toLowerCase().trim() === clean) || (entry.masterDbName && entry.masterDbName.toLowerCase().trim() === clean)));
        if (m && (m.shieldType === 'Buckler' || (Array.isArray(m.tags) && m.tags.some(t => String(t).toLowerCase() === 'buckler')))) {
          return true;
        }
      }

      return name.toLowerCase().includes('buckler');
    }

    // Helper to determine if an item is strictly ammunition or a spell (Arrows, Bolts, Sling Bullets, Spells)
    function isAmmunitionItem(item) {
      if (!item) return false;
      const name = typeof item === 'string' ? item : (item.name || '');
      if (!name) return false;
      const low = name.toLowerCase().trim();

      // 1. Direct object properties
      if (typeof item === 'object') {
        if (item.category === 'Ammunition' || item.type === 'Ammunition' || item.slot === 'Ammunition' || item.isAmmunition) return true;
        if (item.category === 'Spell' || item.type === 'Spell') return true;
        if (item.ammoVal) return true; // Standard ammunition items created with ammoVal
      }

      // 2. Master DB check
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const m = masterDb.find(entry => entry && (
          (entry.name && entry.name.toLowerCase().trim() === low) ||
          (entry.masterDbName && entry.masterDbName.toLowerCase().trim() === low)
        ));
        if (m) {
          if (m.category === 'Ammunition' || m.type === 'Ammunition' || m.slot === 'Ammunition') return true;
          if (m.type === 'Spell' || m.category === 'Spell') return true;
        }
      }

      // 3. Fallback semantic check for ammunition
      if (low.endsWith(' arrow') || low.endsWith(' bolt') || low.endsWith(' bullet') || low.endsWith(' bullets') || low.endsWith(' arrows') || low.endsWith(' bolts')) {
        return true;
      }

      return false;
    }

    // Helper to determine if an item is a thrown weapon (Dagger, Dart, Shuriken, Javelin, Throwing Axe, etc.)
    function isThrownWeapon(item) {
      if (!item) return false;
      if (isAmmunitionItem(item)) return false;

      const name = typeof item === 'string' ? item : (item.name || '');
      if (!name) return false;
      const low = name.toLowerCase().trim();

      // 1. Direct object properties
      if (typeof item === 'object') {
        if (item.attackType === 'thrown' || item.ammoType === 'thrown') return true;
        if (Array.isArray(item.tags) && item.tags.some(t => String(t).toLowerCase() === 'thrown')) return true;
      }

      // 2. Master DB check
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const m = masterDb.find(entry => entry && (
          (entry.name && entry.name.toLowerCase().trim() === low) ||
          (entry.masterDbName && entry.masterDbName.toLowerCase().trim() === low)
        ));
        if (m) {
          if (m.attackType === 'thrown' || m.ammoType === 'thrown') return true;
          if (Array.isArray(m.tags) && m.tags.some(t => String(t).toLowerCase() === 'thrown')) return true;
        }
      }

      // 3. Fallback heuristics for classic D&D 3.5e thrown weapons if tags missing
      return (
        low.includes('dagger') ||
        low.includes('dart') ||
        low.includes('shuriken') ||
        low.includes('javelin') ||
        low.includes('throwing axe') ||
        low.includes('thrown')
      );
    }

    // Helper to determine if an item is a ranged launcher or thrown weapon (Bows, Crossbows, Slings, Blowguns, Thrown Daggers, etc.)
    function isRangedOrThrownWeapon(item) {
      if (!item) return false;
      if (isAmmunitionItem(item)) return false; // Strict D&D 3.5e RAW: Ammunition is NEVER a weapon!
      if (isThrownWeapon(item)) return true;

      const name = typeof item === 'string' ? item : (item.name || '');
      if (!name || name === '-' || name === 'None') return false;
      const low = name.toLowerCase().trim();

      // Explicit property checks
      if (typeof item === 'object') {
        if (item.combatScope === 'ranged' || item.combatScope === 'both') {
          if (item.category === 'Weapon' || item.type === 'Weapon' || !item.category) return true;
        }
        if (item.category === 'Ranged' || item.weaponType === 'Ranged') return true;
      }

      // Lookup in masterDb
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const m = masterDb.find(entry => entry && (
          (entry.name && entry.name.toLowerCase().trim() === low) ||
          (entry.masterDbName && entry.masterDbName.toLowerCase().trim() === low)
        ));
        if (m) {
          if (m.type === 'Weapon' && (m.combatScope === 'ranged' || m.category === 'Ranged' || (Array.isArray(m.tags) && m.tags.includes('ranged')))) {
            return true;
          }
        }
      }

      // Keyword heuristic for actual ranged launcher weapons (Bows, Crossbows, Slings, Blowguns)
      return (
        low.includes('bow') || 
        low.includes('crossbow') || 
        low.includes('sling') || 
        low.includes('blowgun')
      );
    }

    function ensureWeaponSetsData() {
      if (!character) return;
      if (!character.tactical) character.tactical = {};

      const isRangedMode = window._combatOffenseMode === 'ranged';

      const getValidMainWeapon = () => {
        if (isRangedMode) {
          const equippedMain = character.bodySlots?.mainHand?.name && character.bodySlots.mainHand.name !== '-' ? character.bodySlots.mainHand.name : null;
          if (equippedMain && equippedMain !== 'None' && isRangedOrThrownWeapon(equippedMain)) return equippedMain;
          if (character.tactical.selectedRangedWeapon && isRangedOrThrownWeapon(character.tactical.selectedRangedWeapon)) return character.tactical.selectedRangedWeapon;
          const firstRanged = (character.weapons || []).find(w => w && w.name && isRangedOrThrownWeapon(w));
          if (firstRanged && firstRanged.name) return firstRanged.name;
          const gearRanged = (character.gearPool || []).find(g => g && g.name && isRangedOrThrownWeapon(g));
          if (gearRanged && gearRanged.name) return gearRanged.name;
          return 'Composite Longbow';
        } else {
          const equippedMain = character.bodySlots?.mainHand?.name && character.bodySlots.mainHand.name !== '-' ? character.bodySlots.mainHand.name : null;
          if (equippedMain && equippedMain !== 'None' && !isRangedOnlyWeapon(equippedMain)) return equippedMain;
          if (character.activeWeapon && character.activeWeapon !== 'None' && !isRangedOnlyWeapon(character.activeWeapon)) return character.activeWeapon;
          const firstMelee = (character.weapons || []).find(w => w && w.name && !isRangedOnlyWeapon(w));
          if (firstMelee && firstMelee.name) return firstMelee.name;
          return 'Unarmed Strike';
        }
      };

      const getValidOffWeapon = (mainWep) => {
        if (isRangedMode) {
          const isTwoHanded = isRangedOnlyWeapon(mainWep);
          if (isTwoHanded) {
            const equippedOff = character.bodySlots?.offHand?.name;
            if (equippedOff && equippedOff.toLowerCase().includes('buckler')) return equippedOff;
            return 'None';
          }
          const otherWep = (character.weapons || []).find(w => w && w.name && isRangedOrThrownWeapon(w) && !isRangedOnlyWeapon(w))?.name;
          if (otherWep) return otherWep;
          return 'None';
        } else {
          const equippedOff = character.bodySlots?.offHand?.name && character.bodySlots.offHand.name !== '-' ? character.bodySlots.offHand.name : null;
          if (equippedOff && equippedOff !== 'None' && !isRangedOnlyWeapon(equippedOff)) return equippedOff;
          const otherWep = (character.weapons || []).find(w => w && w.name && w.name !== mainWep && !isRangedOnlyWeapon(w))?.name;
          if (otherWep) return otherWep;
          return 'None';
        }
      };

      if (!character.tactical.weaponSets) {
        const mainWep = getValidMainWeapon();
        const secondWep = getValidOffWeapon(mainWep);
        const autoGrip = (isRangedMode && isRangedOnlyWeapon(mainWep)) ? '2-Hand' : '1-Hand';

        character.tactical.weaponSets = {
          activeSets: [1],
          activeSet: 1,
          set1: {
            name: 'Main Hand',
            mainWeapon: mainWep,
            grip: autoGrip
          },
          set2: {
            name: 'Off-Hand',
            mainWeapon: secondWep,
            grip: 'Off-Hand'
          }
        };
      } else {
        if (!Array.isArray(character.tactical.weaponSets.activeSets)) {
          const prev = character.tactical.weaponSets.activeSet;
          character.tactical.weaponSets.activeSets = prev === 'both' ? [1, 2] : (prev === 2 ? [2] : [1]);
        }
        if (!character.tactical.weaponSets.set1) {
          character.tactical.weaponSets.set1 = { name: 'Main Hand', mainWeapon: getValidMainWeapon(), grip: isRangedMode ? '2-Hand' : '1-Hand' };
        }
        if (!character.tactical.weaponSets.set2) {
          character.tactical.weaponSets.set2 = { name: 'Off-Hand', mainWeapon: getValidOffWeapon(character.tactical.weaponSets.set1.mainWeapon), grip: 'Off-Hand' };
        }

        const s1Wep = character.tactical.weaponSets.set1.mainWeapon;
        if (isRangedMode) {
          if (!s1Wep || s1Wep === 'None' || !isRangedOrThrownWeapon(s1Wep)) {
            character.tactical.weaponSets.set1.mainWeapon = getValidMainWeapon();
            if (isRangedOnlyWeapon(character.tactical.weaponSets.set1.mainWeapon)) {
              character.tactical.weaponSets.set1.grip = '2-Hand';
            }
          }
        } else {
          if (isRangedOnlyWeapon(s1Wep) || !s1Wep || s1Wep === 'None') {
            character.tactical.weaponSets.set1.mainWeapon = getValidMainWeapon();
          }
        }

        const currentMainWep = character.tactical.weaponSets.set1.mainWeapon;
        const mainIsTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(currentMainWep) : isRangedOnlyWeapon(currentMainWep);
        const hasOversized = typeof RuleEngine !== 'undefined' ? RuleEngine.hasOversizedWeaponFeat(character) : false;

        if (mainIsTwoHand && !hasOversized) {
          // Rule 1, 2, 3: Two-handed weapon without oversized feat forces 2-Hand grip, empties Set 2, and limits to single weapon
          character.tactical.weaponSets.set1.grip = '2-Hand';
          character.tactical.weaponSets.set2.mainWeapon = 'None';
          character.tactical.weaponSets.set2.grip = 'Off-Hand';
          character.tactical.weaponSets.activeSets = [1];
          character.tactical.weaponSets.activeSet = 1;
          character.activeOffHand = 'None';
        } else {
          const s2Wep = character.tactical.weaponSets.set2.mainWeapon;
          if (isRangedMode) {
            if (s2Wep && s2Wep !== 'None' && !isRangedOrThrownWeapon(s2Wep) && !s2Wep.toLowerCase().includes('buckler')) {
              character.tactical.weaponSets.set2.mainWeapon = 'None';
            }
          } else {
            if (s2Wep && s2Wep !== 'None' && isRangedOnlyWeapon(s2Wep)) {
              character.tactical.weaponSets.set2.mainWeapon = getValidOffWeapon(character.tactical.weaponSets.set1.mainWeapon);
            }
          }
        }

        if (!character.tactical.weaponSets.set1.name || character.tactical.weaponSets.set1.name.includes('Buckler') || character.tactical.weaponSets.set1.name.includes('Set I') || character.tactical.weaponSets.set1.name === 'Ana El' || character.tactical.weaponSets.set1.name === 'Menzilli Silah') {
          character.tactical.weaponSets.set1.name = 'Main Hand';
        }
        if (!character.tactical.weaponSets.set2.name || character.tactical.weaponSets.set2.name.includes('Set II') || character.tactical.weaponSets.set2.name === 'İkinci El' || character.tactical.weaponSets.set2.name === 'Ikinci El' || character.tactical.weaponSets.set2.name === 'Ana El') {
          character.tactical.weaponSets.set2.name = 'Off-Hand';
        }
        if (character.tactical.weaponSets.set1.mainWeapon === 'Yumruk (Unarmed)') character.tactical.weaponSets.set1.mainWeapon = 'Unarmed Strike';
        if (character.tactical.weaponSets.set1.mainWeapon === 'Yok') character.tactical.weaponSets.set1.mainWeapon = 'None';
        if (character.tactical.weaponSets.set2.mainWeapon === 'Yumruk (Unarmed)') character.tactical.weaponSets.set2.mainWeapon = 'Unarmed Strike';
        if (character.tactical.weaponSets.set2.mainWeapon === 'Yok') character.tactical.weaponSets.set2.mainWeapon = 'None';
        if (character.tactical.weaponSets.set1.grip === 'Tek El') character.tactical.weaponSets.set1.grip = '1-Hand';
        if (character.tactical.weaponSets.set1.grip === 'Çift El') character.tactical.weaponSets.set1.grip = '2-Hand';
        if (character.tactical.weaponSets.set2.grip === 'İkinci El' || character.tactical.weaponSets.set2.grip === 'Ikinci El') character.tactical.weaponSets.set2.grip = 'Off-Hand';
      }
    }

    // Helper function to calculate combat display stats for a weapon / shield
    function getWeaponCombatDisplayStats(wepName, grip = '1-Hand', isOffHand = false) {
      if (!character || !wepName || wepName === 'None' || wepName === '-') {
        if (isOffHand) {
          return {
            dmgStr: '-',
            critStr: '-',
            dmgType: 'Empty Hand',
            isShield: false,
            isWeapon: false
          };
        }
        return {
          dmgStr: '1d3+0 (Unarmed)',
          critStr: '20 / x2',
          dmgType: 'Bludgeoning',
          isWeapon: false
        };
      }

      const lower = wepName.toLowerCase();
      const offItem = character.bodySlots?.offHand;
      const isShieldItemMatch = isShieldItem(offItem && offItem.name === wepName ? offItem : wepName);

      if (isShieldItemMatch) {
        const isBuckler = isBucklerItem(wepName);
        const isHeavy = lower.includes('heavy');
        const shieldAc = offItem?.shieldBonus || offItem?.acBonus || (isHeavy ? 2 : 1);
        if (isBuckler) {
          return {
            dmgStr: 'No Attack',
            critStr: '-',
            dmgType: 'Shield',
            shieldAcText: `+${shieldAc} Shield AC`,
            isShield: true,
            isBuckler: true
          };
        }
        return {
          dmgStr: isHeavy ? '1d4' : '1d3',
          critStr: '20 / x2',
          dmgType: 'Bludgeoning',
          shieldAcText: `+${shieldAc} Shield AC`,
          isShield: true,
          isWeapon: true
        };
      }

      let wep = findWeaponEverywhere(wepName);
      if (!wep) {
        return {
          dmgStr: '1d6',
          critStr: '20 / x2',
          dmgType: 'Physical',
          isWeapon: true
        };
      }

      // Ranged combat mode calculation for cards (Unified with RuleEngine)
      if (window._combatOffenseMode === 'ranged' && !isShieldItemMatch) {
        const at = getRequiredAmmunitionType(wepName);
        const t = character.tactical || {};

        // 1. Collect all active qualified ranged modifiers
        const activeRangedMods = [];
        const qualifiedRanged = typeof getQualifiedRangedModifiersList === 'function' ? getQualifiedRangedModifiersList() : [];
        qualifiedRanged.forEach(m => {
          if (m && m.active) {
            activeRangedMods.push({
              name: m.name,
              bonusAtk: m.bonusAtk || 0,
              bonusDmg: m.bonusDmg || 0,
              dice: m.dice || '',
              bonusType: m.bonusType || 'untyped',
              combatScope: 'ranged'
            });
          }
        });

        // 2. Collect selected ammunition modifier
        const selArrow = t.selectedArrow || 'standard';
        let arrowAtk = 0;
        let arrowDmg = 0;
        let arrowDice = '';
        let arrowBonusType = 'enhancement';
        if (selArrow === 'masterwork') { arrowAtk = 1; }
        else if (selArrow === 'plus1') { arrowAtk = 1; arrowDmg = 1; }
        else if (selArrow === 'plus2') { arrowAtk = 2; arrowDmg = 2; }
        else if (selArrow === 'silver') { arrowDmg = -1; arrowBonusType = 'penalty'; }
        else if (selArrow === 'fire') { arrowDice = '1d6 (Fire)'; }
        else if (selArrow === 'acid') { arrowDice = '1d6 (Acid)'; }
        else if (selArrow === 'shock') { arrowDice = '1d6 (Electricity)'; }

        if (arrowAtk || arrowDmg || arrowDice) {
          activeRangedMods.push({
            name: `Ammo (${selArrow})`,
            bonusAtk: arrowAtk,
            bonusDmg: arrowDmg,
            dice: arrowDice,
            bonusType: arrowBonusType,
            combatScope: 'ranged'
          });
        }

        if (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateWeaponAttack) {
          try {
            const evalRes = RuleEngine.evaluateWeaponAttack(character, wep, {
              grip: isOffHand ? 'Off-Hand' : 'Ranged',
              higherGround: !!t.rangedHigherGround,
              customModifiers: activeRangedMods,
              manyshot: !!t.manyshot
            });

            const activeDiceMods = activeRangedMods.filter(m => m.dice);
            let extraDiceStr = '';
            if (activeDiceMods.length > 0) {
              extraDiceStr = ' + ' + activeDiceMods.map(m => m.dice).join(' + ');
            }

            const flatDmg = evalRes.netFlatDamage;
            const flatStr = flatDmg !== 0 ? (flatDmg > 0 ? `+${flatDmg}` : `${flatDmg}`) : '';
            const dmgStr = `${evalRes.baseDice}${flatStr}${extraDiceStr}`;
            const critRange = evalRes.critMin === 20 ? '20' : `${evalRes.critMin}-20`;
            const critStr = `${critRange} / x${evalRes.critMult}`;

            let dmgType = evalRes.damageType || (at === 'bullet' ? 'Bludgeoning' : 'Piercing');

            return {
              dmgStr,
              critStr,
              dmgType,
              finesseMod: evalRes.attackStatMod,
              isFinesse: false,
              isWeapon: true,
              hasExtraMods: flatDmg !== 0 || extraDiceStr !== '' || activeRangedMods.length > 0
            };
          } catch (e) {
            console.warn('Ranged evaluateWeaponAttack error:', e);
          }
        }
      }

      if (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateWeaponAttack) {
        try {
          const paVal = parseInt(document.getElementById('power-attack-val')?.value) || 0;
          const flanking = document.getElementById('mod-flanking')?.checked ?? false;
          const charge = document.getElementById('mod-charge')?.checked ?? false;
          const hg = document.getElementById('mod-higher-ground')?.checked ?? (character.tactical?.higherGround ?? false);
          const activeMods = (character.activeModifiers || []).filter(m => m && m.active);
          const nonChainMods = activeMods.filter(m => {
        if (!m || !m.name) return false;
        if (m.name.includes('TWF') || m.name.includes('Two-Weapon') || m.name.includes('Flurry')) return false;
        if (m.combatScope === 'ranged' || m.scope === 'Ranged Only') return false;
        return true;
      });

          const evalRes = RuleEngine.evaluateWeaponAttack(character, wep, {
            grip: isOffHand ? 'Off-Hand' : grip,
            powerAttack: isOffHand ? 0 : paVal,
            flanking,
            charge,
            higherGround: hg,
            activeStance: character.activeStance || 'None',
            customModifiers: nonChainMods
          });

          const activeDiceMods = activeMods.filter(m => m.dice);
          let extraDiceStr = '';
          if (activeDiceMods.length > 0) {
            extraDiceStr = ' + ' + activeDiceMods.map(m => m.dice).join(' + ');
          }
          if (Array.isArray(wep.elementalMods) && wep.elementalMods.length > 0) {
            extraDiceStr += ' + ' + wep.elementalMods.map(em => `${em.dice} (${em.name || em.type})`).join(' + ');
          }

          const flatDmg = evalRes.netFlatDamage;
          let basePart = `${evalRes.baseDice}${flatDmg >= 0 ? '+' : ''}${flatDmg}`;
          if (evalRes.chargeMultiplier > 1) {
            basePart += ` (Charge: x${evalRes.chargeMultiplier})`;
          }
          const dmgStr = `${basePart}${extraDiceStr}`;
          const critRange = evalRes.critMin === 20 ? '20' : `${evalRes.critMin}-20`;
          const critStr = `${critRange} / x${evalRes.critMult}`;

          let dmgType = evalRes.damageType || 'Piercing';

          const hasExtraMods = (paVal > 0 && !isOffHand) || activeDiceMods.length > 0 || (Array.isArray(wep.elementalMods) && wep.elementalMods.length > 0) || nonChainMods.some(m => m.bonusDmg);

          return {
            dmgStr,
            critStr,
            dmgType,
            finesseMod: evalRes.attackStatMod,
            isFinesse: evalRes.attackStatName && evalRes.attackStatName.includes('Weapon Finesse'),
            isWeapon: true,
            hasExtraMods,
            elementalMods: wep.elementalMods || [],
            keen: !!wep.keen,
            enhancementBonus: wep.attBonus || 0
          };
        } catch (e) {
          console.warn('getWeaponCombatDisplayStats error:', e);
        }
      }

      return {
        dmgStr: wep?.dice || '1d6',
        critStr: '20 / x2',
        dmgType: 'Physical',
        isWeapon: true
      };
    }

    function renderWeaponSetsUI() {
      const container = document.getElementById('weapon-sets-cards-container');
      if (!container) return;
      try {
        ensureWeaponSetsData();
        const sets = character?.tactical?.weaponSets || {};
        const s1 = sets.set1 || { name: 'Main Hand', mainWeapon: character?.activeWeapon || 'Rapier +2', grip: '1-Hand' };
        const s2 = sets.set2 || { name: 'Off-Hand', mainWeapon: '+1 Buckler', grip: 'Off-Hand' };
        const activeSets = Array.isArray(sets.activeSets) ? sets.activeSets : [1];
        const is1 = activeSets.includes(1);
        const is2 = activeSets.includes(2);
        const isDual = is1 && is2;

        const mainIsTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(s1.mainWeapon) : false;
        const hasOversized = typeof RuleEngine !== 'undefined' ? RuleEngine.hasOversizedWeaponFeat(character) : false;
        const isTwoHandLocked = mainIsTwoHand && !hasOversized;

        // Stats for Card 1: STRICTLY Main Hand only
        const s1MainStats = getWeaponCombatDisplayStats(s1.mainWeapon, isTwoHandLocked ? '2-Hand' : (s1.grip || '1-Hand'), false);

        // Stats for Card 2: STRICTLY Off-Hand / Shield only
        const s2OffStats = isTwoHandLocked ? null : getWeaponCombatDisplayStats(s2.mainWeapon, 'Off-Hand', true);
        const isCard2Shield = s2OffStats?.isShield;

      // Card 1 UI (Main Hand)
      const card1Html = `
        <!-- CARD 1: MAIN HAND -->
        <div onclick="activateWeaponSet(1)" class="p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${is1 ? 'bg-gradient-to-r from-amber-950/60 to-slate-900/90 border-amber-500 text-amber-200 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/40' : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'}">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-xs ${is1 ? 'text-amber-400' : 'text-slate-500'}">⚔️</span>
              <span class="text-xs font-black truncate ${is1 ? 'text-white' : 'text-slate-300'}">${s1.name || 'Main Hand'}</span>
              ${is1 ? `<span class="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50">ACTIVE</span>` : ''}
              ${s1MainStats?.enhancementBonus ? `<span class="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50">+${s1MainStats.enhancementBonus} Magic</span>` : ''}
              ${s1MainStats?.keen ? `<span class="text-[8px] font-bold px-1.5 py-0.2 rounded bg-red-950/60 text-red-300 border border-red-500/50">🩸 Keen</span>` : ''}
              ${isTwoHandLocked ? `<span class="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-900/40 text-amber-400 border border-amber-700/50">2H Weapon</span>` : ''}
            </div>
            <!-- Equipment & Grip -->
            <div class="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
              <span class="${is1 ? 'text-amber-300 font-bold' : 'text-slate-400 font-bold'}">${s1.mainWeapon || 'None'}</span>
              <span class="text-slate-500">(${s1MainStats?.isShield ? 'Shield' : (isTwoHandLocked ? '2-Hand' : (s1.grip || '1-Hand'))})</span>
            </div>
            <!-- Row 1: Modified Weapon Damage or Shield Defense -->
            <div class="text-[10px] font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
              ${s1MainStats?.isShield ? `
                <span class="text-slate-400 font-sans text-[9px] uppercase tracking-wider">Defense:</span>
                <span class="font-bold text-emerald-400">${s1MainStats?.shieldAcText || '+1 Shield AC'}</span>
              ` : `
                <span class="text-slate-400 font-sans text-[9px] uppercase tracking-wider">Damage:</span>
                <span class="font-bold ${is1 ? 'text-amber-300' : 'text-slate-300'}">${s1MainStats?.dmgStr || '1d6+3'}</span>
                ${s1MainStats?.hasExtraMods ? `<span class="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">⚡ Modified</span>` : ''}
                ${s1MainStats?.isFinesse ? `<span class="text-emerald-400 text-[9px] font-sans font-bold">• DEX (+${s1MainStats.finesseMod}) Finesse</span>` : ''}
              `}
            </div>
            <!-- Row 2: Critical & Damage Type -->
            <div class="text-[9px] font-mono flex items-center gap-1.5 flex-wrap">
              ${s1MainStats?.isShield ? `
                <span class="text-slate-500 font-sans uppercase text-[8px] tracking-wider">Type:</span>
                <span class="text-slate-300 font-medium">Shield Defense</span>
              ` : `
                <span class="text-slate-500 font-sans uppercase text-[8px] tracking-wider">Crit &amp; Type:</span>
                <span class="${is1 ? 'text-white' : 'text-slate-300'} font-semibold font-mono">${s1MainStats?.critStr || '18-20 / x2'}</span>
                <span class="text-slate-600">•</span>
                <span class="${is1 ? 'text-amber-200/90' : 'text-slate-400'}">${s1MainStats?.dmgType || 'Piercing'}</span>
              `}
            </div>
          </div>
          <div class="shrink-0 text-right">
            <span class="text-[9px] font-bold px-2.5 py-1 rounded-lg ${is1 ? 'bg-amber-500 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}">
              ${is1 ? 'Equipped' : 'Equip'}
            </span>
          </div>
        </div>
      `;

      // Card 2 UI (Off-Hand / Shield) - Disabled if main weapon is two-handed
      let card2Html = '';
      if (isTwoHandLocked) {
        card2Html = `
        <!-- CARD 2: OFF-HAND (LOCKED - TWO-HANDED WEAPON) -->
        <div onclick="activateWeaponSet(2)" class="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-500 cursor-not-allowed select-none flex items-center justify-between gap-2 opacity-70">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-slate-600">🔒</span>
              <span class="text-xs font-bold text-slate-400">Off-Hand (Locked)</span>
              <span class="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-950/50 text-amber-500 border border-amber-900/50">2-Hand Required</span>
            </div>
            <!-- Equipment Info -->
            <div class="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
              <span>Main-hand "${s1.mainWeapon || 'Weapon'}" requires two hands</span>
            </div>
            <!-- Description -->
            <div class="text-[9px] text-slate-600 mt-0.5 font-mono">
              <span>* Off-hand &amp; TWF unavailable with 2H weapon without Monkey Grip</span>
            </div>
          </div>
          <div class="shrink-0 text-right">
            <span class="text-[9px] font-bold px-2 py-1 rounded-lg bg-slate-900 text-slate-600 border border-slate-800">
              Disabled
            </span>
          </div>
        </div>
        `;
      } else {
        card2Html = `
        <!-- CARD 2: OFF-HAND -->
        <div onclick="activateWeaponSet(2)" class="p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${is2 ? 'bg-gradient-to-r from-sky-950/60 to-slate-900/90 border-sky-500 text-sky-200 shadow-md shadow-sky-950/40 ring-1 ring-sky-500/40' : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'}">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-xs ${is2 ? 'text-sky-400' : 'text-slate-500'}">${isCard2Shield ? '🛡️' : '🗡️'}</span>
              <span class="text-xs font-black truncate ${is2 ? 'text-white' : 'text-slate-300'}">${s2.name || 'Off-Hand'}</span>
              ${is2 ? `<span class="text-[8px] font-black px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-300 border border-sky-500/50">${isDual ? (isCard2Shield ? 'ACTIVE (Shield)' : 'ACTIVE (TWF)') : 'ACTIVE'}</span>` : ''}
              ${s2OffStats?.enhancementBonus ? `<span class="text-[8px] font-black px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-300 border border-sky-500/50">+${s2OffStats.enhancementBonus} Magic</span>` : ''}
              ${s2OffStats?.keen ? `<span class="text-[8px] font-bold px-1.5 py-0.2 rounded bg-red-950/60 text-red-300 border border-red-500/50">🩸 Keen</span>` : ''}
            </div>
            <!-- Equipment & Type -->
            <div class="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
              <span class="${is2 ? 'text-sky-300 font-bold' : 'text-slate-400 font-bold'}">${s2.mainWeapon || 'None'}</span>
              <span class="text-slate-500">(${isCard2Shield ? 'Shield' : (!s2.mainWeapon || s2.mainWeapon === 'None' || s2.mainWeapon === '-' ? 'Empty' : 'Off-Hand')})</span>
            </div>
            <!-- Row 1: Weapon Damage or Shield Defense -->
            <div class="text-[10px] font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
              ${isCard2Shield ? `
                <span class="text-slate-400 font-sans text-[9px] uppercase tracking-wider">Defense:</span>
                <span class="font-bold text-emerald-400">${s2OffStats?.shieldAcText || '+1 Shield AC'}</span>
              ` : `
                <span class="text-slate-400 font-sans text-[9px] uppercase tracking-wider">Damage:</span>
                <span class="font-bold ${is2 ? 'text-sky-300' : 'text-slate-300'}">${s2OffStats?.dmgStr || '1d4'}</span>
                ${s2OffStats?.hasExtraMods ? `<span class="text-[8px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">⚡ Modified</span>` : ''}
              `}
            </div>
            <!-- Row 2: Critical & Damage Type -->
            <div class="text-[9px] font-mono flex items-center gap-1.5 flex-wrap">
              ${isCard2Shield ? `
                <span class="text-slate-500 font-sans uppercase text-[8px] tracking-wider">Type:</span>
                <span class="text-slate-300 font-medium">Shield Defense</span>
              ` : `
                <span class="text-slate-500 font-sans uppercase text-[8px] tracking-wider">Crit &amp; Type:</span>
                <span class="${is2 ? 'text-white' : 'text-slate-300'} font-semibold font-mono">${s2OffStats?.critStr || '19-20 / x2'}</span>
                <span class="text-slate-600">•</span>
                <span class="${is2 ? 'text-sky-200/90' : 'text-slate-400'}">${s2OffStats?.dmgType || 'Piercing'}</span>
              `}
            </div>
          </div>
          <div class="shrink-0 text-right">
            <span class="text-[9px] font-bold px-2.5 py-1 rounded-lg ${is2 ? 'bg-sky-500 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}">
              ${is2 ? 'Equipped' : 'Equip'}
            </span>
          </div>
        </div>
        `;
      }

      container.innerHTML = card1Html + card2Html;
      populateWeaponSetsEditorDropdowns();
    } catch (err) {
      console.error('renderWeaponSetsUI execution error:', err);
      if (container && !container.innerHTML) {
        container.innerHTML = `
          <div class="p-2.5 rounded-xl border border-amber-500/50 bg-slate-900/90 text-amber-200 text-xs flex items-center justify-between">
            <div>
              <div class="font-bold">⚔️ Main Hand: ${character?.activeWeapon || 'Rapier +2'}</div>
              <div class="text-[10px] text-slate-400 font-mono">1d6+3 • 18-20/x2 • Piercing</div>
            </div>
            <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/30 text-amber-300">ACTIVE</span>
          </div>
        `;
      }
    }
  }

    function toggleWeaponSet(setNum) {
      ensureWeaponSetsData();
      const sets = character.tactical.weaponSets;
      if (!Array.isArray(sets.activeSets)) {
        sets.activeSets = [sets.activeSet === 2 ? 2 : 1];
      }

      const s1Main = sets.set1?.mainWeapon;
      const mainIsTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(s1Main) : false;
      const hasOversized = typeof RuleEngine !== 'undefined' ? RuleEngine.hasOversizedWeaponFeat(character) : false;

      // Rule 1: If main hand is two-handed and oversized feat is missing, off-hand cannot be activated
      if (setNum === 2 && mainIsTwoHand && !hasOversized) {
        if (typeof showToast === 'function') {
          showToast(`Your main-hand weapon "${s1Main}" is two-handed! Off-hand and TWF cannot be used without the 'Monkey Grip' feat.`, 'warning');
        }
        return;
      }

      const idx = sets.activeSets.indexOf(setNum);
      if (idx >= 0) {
        if (sets.activeSets.length > 1) {
          // If both were active, toggle off this set
          sets.activeSets.splice(idx, 1);
        } else {
          if (typeof showToast === 'function') {
            showToast(setNum === 1 ? 'Main Hand active. Click the Off-Hand card to enable Two-Weapon Fighting (TWF) or equip a shield.' : 'Off-Hand active solo.', 'info');
          }
        }
      } else {
        // Toggle on: both are now active!
        sets.activeSets.push(setNum);
      }

      sets.activeSet = (sets.activeSets.includes(1) && sets.activeSets.includes(2)) ? 'both' : (sets.activeSets.includes(2) ? 2 : 1);
      applyWeaponSetsConfiguration();
    }

    function activateWeaponSet(setNum) {
      toggleWeaponSet(setNum);
    }

    function applyWeaponSetsConfiguration() {
      ensureWeaponSetsData();
      const sets = character.tactical.weaponSets;

      const s1Main = sets.set1?.mainWeapon;
      const mainIsTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(s1Main) : false;
      const hasOversized = typeof RuleEngine !== 'undefined' ? RuleEngine.hasOversizedWeaponFeat(character) : false;
      const isTwoHandLocked = mainIsTwoHand && !hasOversized;

      if (!character.activeModifiers) character.activeModifiers = [];
      let twfMod = character.activeModifiers.find(m => m && m.name && (m.name.includes('TWF') || m.name.includes('Two-Weapon')));
      if (!twfMod) {
        twfMod = {
          name: 'Two-Weapon Fighting (TWF)',
          source: 'Combat',
          bonusAtk: 0,
          dice: '',
          type: 'TWF',
          active: false,
          notes: 'Extra Off-Hand Attack (RAW TWF)'
        };
        character.activeModifiers.push(twfMod);
      }

      // Rule 1, 2, 3: Two-handed weapon enforcement
      if (isTwoHandLocked) {
        sets.set1.grip = '2-Hand';
        sets.set2.mainWeapon = 'None';
        sets.set2.grip = 'Off-Hand';
        sets.activeSets = [1];
        sets.activeSet = 1;

        character.activeWeapon = sets.set1.mainWeapon;
        character.activeOffHand = 'None';
        twfMod.active = false;

        const gripSelect = document.getElementById('active-grip-select');
        if (gripSelect) gripSelect.value = '2-Hand';

        const wepSelect = document.getElementById('active-weapon-select');
        if (wepSelect) wepSelect.value = character.activeWeapon;

        const offSelect = document.getElementById('active-offhand-select');
        if (offSelect) offSelect.value = 'None';

        saveStateToStorage(false);
        renderWeaponSetsUI();
        recalculateOffense();
        if (typeof renderOffenseModifiersGrid === 'function') renderOffenseModifiersGrid();
        renderHUD();
        if (typeof renderCombatCockpit === 'function') renderCombatCockpit();
        return;
      }

      const is1 = sets.activeSets.includes(1);
      const is2 = sets.activeSets.includes(2);
      const isDual = is1 && is2;

      if (isDual) {
        // BOTH ACTIVE: Main Hand (Card 1) + Off Hand (Card 2)
        character.activeWeapon = sets.set1.mainWeapon;
        character.activeOffHand = sets.set2.mainWeapon;

        const gripSelect = document.getElementById('active-grip-select');
        if (gripSelect) gripSelect.value = '1-Hand';
        if (sets.set1) sets.set1.grip = '1-Hand';

        // Check if Card 2 is a weapon (not pure shield)
        const offItemStats = getWeaponCombatDisplayStats(sets.set2.mainWeapon, 'Off-Hand', true);
        const isOffWeapon = offItemStats && !offItemStats.isBuckler && offItemStats.dmgType !== 'Shield';

        twfMod.active = isOffWeapon;
      } else if (is1) {
        // ONLY CARD 1 ACTIVE: Single weapon combat, Off-Hand is None
        character.activeWeapon = sets.set1.mainWeapon;
        character.activeOffHand = 'None';

        const gripSelect = document.getElementById('active-grip-select');
        if (gripSelect) gripSelect.value = sets.set1.grip || '1-Hand';

        twfMod.active = false;
      } else if (is2) {
        // ONLY CARD 2 ACTIVE AS PRIMARY WEAPON
        character.activeWeapon = sets.set2.mainWeapon;
        character.activeOffHand = 'None';

        const gripSelect = document.getElementById('active-grip-select');
        if (gripSelect) gripSelect.value = sets.set2.grip || '1-Hand';

        twfMod.active = false;
      }

      const wepSelect = document.getElementById('active-weapon-select');
      if (wepSelect) wepSelect.value = character.activeWeapon;

      const offSelect = document.getElementById('active-offhand-select');
      if (offSelect) offSelect.value = character.activeOffHand;

      saveStateToStorage(false);
      renderWeaponSetsUI();
      recalculateOffense();
      if (typeof renderOffenseModifiersGrid === 'function') renderOffenseModifiersGrid();
      renderHUD();
      if (typeof renderCombatCockpit === 'function') renderCombatCockpit();
    }

    function toggleWeaponSetsEditor(forceState) {
      const editor = document.getElementById('weapon-sets-editor');
      if (!editor) return;
      if (typeof forceState === 'boolean') {
        if (forceState) editor.classList.remove('hidden');
        else editor.classList.add('hidden');
      } else {
        editor.classList.toggle('hidden');
      }
      if (!editor.classList.contains('hidden')) {
        populateWeaponSetsEditorDropdowns();
      }
    }

    function syncWeaponSetToBodySlot(slotKey, itemName) {
      if (!character || !slotKey) return;
      if (!character.bodySlots) character.bodySlots = {};

      if (!itemName || itemName === 'None' || itemName === '-') {
        if (character.bodySlots[slotKey] && character.bodySlots[slotKey].name !== '-') {
          unequipSlot(slotKey, true);
        }
        return;
      }

      // If already equipped with exact name, ensure active
      if (character.bodySlots[slotKey]?.name === itemName) {
        character.bodySlots[slotKey].active = true;
        return;
      }

      // Unequip currently equipped item if different
      if (character.bodySlots[slotKey] && character.bodySlots[slotKey].name && character.bodySlots[slotKey].name !== '-') {
        unequipSlot(slotKey, true);
      }

      // Check if item is in gearPool
      let poolItem = (character.gearPool || []).find(p => p && p.name === itemName);
      if (poolItem) {
        poolItem.isEquipped = true;
      }

      // Check masterDb or character.weapons or enrich
      let fromDb = (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) ? masterDb.find(m => m && (m.name === itemName || m.masterDbName === itemName)) : null;
      let fromWep = (character.weapons || []).find(w => w && w.name === itemName);
      const isShieldItem = (fromDb && fromDb.category === 'Shield') || itemName.toLowerCase().includes('shield') || itemName.toLowerCase().includes('buckler');
      const enriched = enrichWeaponStats({ ...(fromDb || fromWep || {}) }, itemName);

      character.bodySlots[slotKey] = {
        name: itemName,
        masterDbName: fromDb?.name || itemName,
        category: isShieldItem ? 'Shield' : 'Weapon',
        active: true,
        weight: fromDb?.weight || fromWep?.weight || (isShieldItem ? 1.5 : 2),
        cost: fromDb?.cost || fromWep?.cost || 1000,
        desc: fromDb?.desc || `${enriched.dice} ${enriched.critMin}-20/x${enriched.critMult} ${enriched.dmgType}`,
        acBonus: fromDb?.acBonus || (itemName.toLowerCase().includes('buckler') ? 1 : (itemName.toLowerCase().includes('heavy') ? 2 : 0)),
        bonusType: fromDb?.bonusType || (isShieldItem ? 'Shield' : 'Enhancement')
      };

      if (!isShieldItem) {
        if (!character.weapons) character.weapons = [];
        let wExists = character.weapons.find(w => w && w.name === itemName);
        if (!wExists) {
          character.weapons.push({
            name: itemName,
            grip: slotKey === 'offHand' ? 'Off-Hand' : '1-Hand',
            dice: enriched.dice,
            critMin: enriched.critMin,
            critMult: enriched.critMult,
            attBonus: enriched.attBonus,
            dmgBonus: enriched.dmgBonus,
            dmgType: enriched.dmgType,
            isLight: enriched.isLight,
            tags: enriched.isLight ? ['light', 'finessable'] : []
          });
        }
      }
    }

    function populateWeaponSetsEditorDropdowns() {
      ensureWeaponSetsData();
      const sets = character.tactical.weaponSets;
      if (!sets) return;

      const isRangedMode = window._combatOffenseMode === 'ranged';
      const availableItems = [];

      if (isRangedMode) {
        // Collect ONLY ranged & thrown weapons for Ranged mode
        (character.weapons || []).forEach(w => {
          if (w && w.name && w.name !== 'None') {
            if (isRangedOrThrownWeapon(w) && !availableItems.some(i => i.name === w.name)) {
              availableItems.push({
                name: w.name,
                category: 'Weapon'
              });
            }
          }
        });

        const mh = character.bodySlots?.mainHand;
        if (mh && mh.name && mh.name !== '-' && mh.name !== 'None') {
          if (isRangedOrThrownWeapon(mh) && !availableItems.some(i => i.name === mh.name)) {
            availableItems.push({ name: mh.name, category: 'Weapon' });
          }
        }
        const oh = character.bodySlots?.offHand;
        if (oh && oh.name && oh.name !== '-' && oh.name !== 'None') {
          if (isRangedOrThrownWeapon(oh) && !availableItems.some(i => i.name === oh.name)) {
            availableItems.push({ name: oh.name, category: 'Weapon' });
          } else if (isBucklerItem(oh) && !availableItems.some(i => i.name === oh.name)) {
            availableItems.push({ name: oh.name, category: 'Shield' });
          }
        }

        (character.gearPool || []).forEach(item => {
          if (item && item.name) {
            if (isRangedOrThrownWeapon(item) && !availableItems.some(i => i.name === item.name)) {
              availableItems.push({ name: item.name, category: 'Weapon' });
            } else if (isBucklerItem(item) && !availableItems.some(i => i.name === item.name)) {
              availableItems.push({ name: item.name, category: 'Shield' });
            }
          }
        });

        (character.inventory || []).forEach(item => {
          if (item && item.name) {
            if (isRangedOrThrownWeapon(item) && !availableItems.some(i => i.name === item.name)) {
              availableItems.push({ name: item.name, category: 'Weapon' });
            } else if (isBucklerItem(item) && !availableItems.some(i => i.name === item.name)) {
              availableItems.push({ name: item.name, category: 'Shield' });
            }
          }
        });

        // Fallback: if character has no ranged weapons equipped or in inventory, provide Unarmed Strike fallback
        if (!availableItems.some(i => i.category === 'Weapon')) {
          availableItems.push({ name: 'Unarmed Strike', category: 'Weapon' });
        }
      } else {
        // 1. From character.weapons (excluding ranged-only weapons)
        (character.weapons || []).forEach(w => {
          if (w && w.name && w.name !== 'None') {
            if (!isRangedOnlyWeapon(w) && !availableItems.some(i => i.name === w.name)) {
              availableItems.push({
                name: w.name,
                category: isShieldItem(w) ? 'Shield' : 'Weapon'
              });
            }
          }
        });

        // 2. From bodySlots (mainHand and offHand, excluding ranged-only weapons)
        const mh = character.bodySlots?.mainHand;
        if (mh && mh.name && mh.name !== '-' && mh.name !== 'None') {
          if (!isRangedOnlyWeapon(mh) && !availableItems.some(i => i.name === mh.name)) {
            availableItems.push({
              name: mh.name,
              category: isShieldItem(mh) ? 'Shield' : 'Weapon'
            });
          }
        }
        const oh = character.bodySlots?.offHand;
        if (oh && oh.name && oh.name !== '-' && oh.name !== 'None') {
          if (!isRangedOnlyWeapon(oh) && !availableItems.some(i => i.name === oh.name)) {
            availableItems.push({
              name: oh.name,
              category: isShieldItem(oh) ? 'Shield' : 'Weapon'
            });
          }
        }

        // 3. From gearPool (excluding ranged-only weapons)
        (character.gearPool || []).forEach(item => {
          if (item && item.name && (isShieldItem(item) || item.category === 'Weapon' || item.type === 'Weapon')) {
            if (!isRangedOnlyWeapon(item) && !availableItems.some(i => i.name === item.name)) {
              availableItems.push({
                name: item.name,
                category: isShieldItem(item) ? 'Shield' : 'Weapon'
              });
            }
          }
        });

        // 4. From character.inventory (dynamically discover weapons/shields in backpack/inventory)
        (character.inventory || []).forEach(item => {
          if (item && item.name && (isShieldItem(item) || item.category === 'Weapon' || item.type === 'Weapon')) {
            if (!isRangedOnlyWeapon(item) && !availableItems.some(i => i.name === item.name)) {
              availableItems.push({
                name: item.name,
                category: isShieldItem(item) ? 'Shield' : 'Weapon'
              });
            }
          }
        });

        // 5. Shields are sourced strictly from inventory & bodySlots (no dummy shields)

        // 6. Always ensure Unarmed Strike is available in melee weapon selection
        if (!availableItems.some(i => (i.name || '').toLowerCase().includes('unarmed'))) {
          availableItems.unshift({
            name: 'Unarmed Strike',
            category: 'Weapon'
          });
        }
      }

      // Build unified options HTML for both Main Hand and Off-Hand
      let optionsHtml = '<option value="None">None / Empty</option>';
      const wepsList = availableItems.filter(i => i.category === 'Weapon');
      const shieldsList = availableItems.filter(i => i.category === 'Shield');

      if (wepsList.length > 0) {
        optionsHtml += '<optgroup label="⚔️ Weapons">';
        wepsList.forEach(w => {
          optionsHtml += `<option value="${w.name}">${w.name} (Weapon)</option>`;
        });
        optionsHtml += '</optgroup>';
      }

      if (shieldsList.length > 0) {
        optionsHtml += '<optgroup label="🛡️ Shields">';
        shieldsList.forEach(s => {
          optionsHtml += `<option value="${s.name}">${s.name} (Shield)</option>`;
        });
        optionsHtml += '</optgroup>';
      }

      // Populate Set 1 (Main Hand) dropdown
      const s1Main = document.getElementById('set1-main-select');
      if (s1Main) {
        s1Main.innerHTML = optionsHtml;
        if (sets.set1?.mainWeapon && Array.from(s1Main.options).some(o => o.value === sets.set1.mainWeapon)) {
          s1Main.value = sets.set1.mainWeapon;
        } else if (wepsList.length > 0) {
          s1Main.value = wepsList[0].name;
          sets.set1.mainWeapon = s1Main.value;
        }
      }
      const s1Grip = document.getElementById('set1-grip-select');
      if (s1Grip && sets.set1?.grip) {
        s1Grip.value = sets.set1.grip;
      }

      // Populate Set 2 (Off-Hand) dropdown
      const s2Main = document.getElementById('set2-main-select');
      const s2Hint = document.getElementById('set2-weapon-editor-hint');
      const mainWep = sets.set1?.mainWeapon;
      const mainIsTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(mainWep) : false;
      const hasOversized = typeof RuleEngine !== 'undefined' ? RuleEngine.hasOversizedWeaponFeat(character) : false;
      const isTwoHandLocked = mainIsTwoHand && !hasOversized;

      if (s2Main) {
        if (isTwoHandLocked) {
          s2Main.innerHTML = '<option value="None" selected>None / Empty (Main Hand 2H Weapon)</option>';
          s2Main.value = 'None';
          s2Main.disabled = true;
          sets.set2.mainWeapon = 'None';
          if (s2Hint) {
            s2Hint.innerHTML = `<span class="text-amber-400 font-medium">⚠️ Your main-hand weapon "${mainWep}" is two-handed. Cannot equip an off-hand weapon or shield without Monkey Grip.</span>`;
          }
        } else {
          s2Main.disabled = false;
          s2Main.innerHTML = optionsHtml;
          if (s2Hint) {
            s2Hint.textContent = '* Equipped in your off-hand for Two-Weapon Fighting (TWF) or shield defense.';
          }
          if (sets.set2?.mainWeapon && Array.from(s2Main.options).some(o => o.value === sets.set2.mainWeapon)) {
            s2Main.value = sets.set2.mainWeapon;
          } else {
            s2Main.value = 'None';
            sets.set2.mainWeapon = 'None';
          }
        }
      }

      updateWeaponEditorEnhancementBadges();
      renderWeaponSetModifierChips(1);
      renderWeaponSetModifierChips(2);
    }

    function saveWeaponSetConfig(setNum) {
      ensureWeaponSetsData();
      const sets = character.tactical.weaponSets;
      if (!sets) return;

      const hasOversized = typeof RuleEngine !== 'undefined' ? RuleEngine.hasOversizedWeaponFeat(character) : false;

      if (setNum === 1) {
        sets.set1.name = 'Main Hand';
        const chosen = document.getElementById('set1-main-select')?.value || sets.set1.mainWeapon;
        sets.set1.mainWeapon = chosen;

        const isChosenTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(chosen) : isRangedOnlyWeapon(chosen);

        if (isChosenTwoHand && !hasOversized) {
          // Rule 1, 2, 3: Two-handed weapon without oversized feat
          sets.set1.grip = '2-Hand';
          const s1Grip = document.getElementById('set1-grip-select');
          if (s1Grip) s1Grip.value = '2-Hand';

          // Rule 3: Clear off-hand slot when a two-handed weapon is selected in main hand
          sets.set2.mainWeapon = 'None';
          sets.set2.grip = 'Off-Hand';
          sets.activeSets = [1];
          sets.activeSet = 1;
          character.activeOffHand = 'None';
          syncWeaponSetToBodySlot('offHand', 'None');

          if (window._combatOffenseMode === 'ranged') {
            character.tactical.selectedRangedWeapon = chosen;
          }

          if (typeof showToast === 'function') {
            showToast(`"${chosen}" is a two-handed weapon. Off-hand slot cleared and switched to single-weapon mode.`, 'info');
          }
        } else {
          if (window._combatOffenseMode === 'ranged') {
            if (isRangedOnlyWeapon(chosen)) {
              sets.set1.grip = '2-Hand';
              const s1Grip = document.getElementById('set1-grip-select');
              if (s1Grip) s1Grip.value = '2-Hand';
            } else {
              sets.set1.grip = document.getElementById('set1-grip-select')?.value || '1-Hand';
            }
            character.tactical.selectedRangedWeapon = chosen;
          } else {
            sets.set1.grip = document.getElementById('set1-grip-select')?.value || '1-Hand';
          }
        }
        syncWeaponSetToBodySlot('mainHand', chosen);
      } else {
        // setNum === 2 (Off-Hand)
        const mainWep = sets.set1?.mainWeapon;
        const mainIsTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(mainWep) : false;

        // Rule 1: Cannot equip another weapon in off-hand
        if (mainIsTwoHand && !hasOversized) {
          sets.set2.mainWeapon = 'None';
          sets.set2.grip = 'Off-Hand';
          syncWeaponSetToBodySlot('offHand', 'None');
          if (typeof showToast === 'function') {
            showToast(`Your main-hand weapon "${mainWep}" is two-handed! Cannot equip an off-hand weapon or shield without Monkey Grip.`, 'warning');
          }
          populateWeaponSetsEditorDropdowns();
          return;
        }

        sets.set2.name = 'Off-Hand';
        const chosen = document.getElementById('set2-main-select')?.value || sets.set2.mainWeapon;
        sets.set2.mainWeapon = chosen;
        sets.set2.grip = 'Off-Hand';
        syncWeaponSetToBodySlot('offHand', chosen);
      }

      applyWeaponSetsConfiguration();
      if (typeof populateRangedWeaponAndAmmoUI === 'function') populateRangedWeaponAndAmmoUI();
      if (typeof renderBodySlotsSilhouette === 'function') renderBodySlotsSilhouette();
      if (typeof renderGearPoolTable === 'function') renderGearPoolTable();
      updateWeaponEditorEnhancementBadges();
      renderWeaponSetModifierChips(1);
      renderWeaponSetModifierChips(2);
    }

    // =========================================================================
    // 📚 SPOTLIGHT TYPEAHEAD & PROGRESSIVE DISCLOSURE WEAPON SYSTEM (FAZ 4)
    // =========================================================================
    const SRD_WEAPON_PROPERTIES = [
      { id: 'flaming', name: 'Flaming', dice: '1d6', type: 'Fire', icon: '🔥', activeClass: 'bg-rose-600/30 border-rose-500 text-rose-300 ring-1 ring-rose-500/50' },
      { id: 'frost', name: 'Frost', dice: '1d6', type: 'Cold', icon: '❄️', activeClass: 'bg-sky-600/30 border-sky-500 text-sky-300 ring-1 ring-sky-500/50' },
      { id: 'shock', name: 'Shock', dice: '1d6', type: 'Electricity', icon: '⚡', activeClass: 'bg-amber-600/30 border-amber-500 text-amber-300 ring-1 ring-amber-500/50' },
      { id: 'holy', name: 'Holy', dice: '2d6', type: 'Holy (Good)', icon: '✨', activeClass: 'bg-yellow-600/30 border-yellow-500 text-yellow-300 ring-1 ring-yellow-500/50' },
      { id: 'unholy', name: 'Unholy', dice: '2d6', type: 'Unholy (Evil)', icon: '💀', activeClass: 'bg-purple-600/30 border-purple-500 text-purple-300 ring-1 ring-purple-500/50' },
      { id: 'keen', name: 'Keen', dice: '', type: 'Crit Range 2x', icon: '🩸', activeClass: 'bg-red-600/40 border-red-500 text-red-200 ring-1 ring-red-500/60', isKeen: true }
    ];

    function toggleSrdSpotlight(forceState = null) {
      const container = document.getElementById('srd-spotlight-container');
      const input = document.getElementById('srd-spotlight-input');
      if (!container) return;
      const isHidden = container.classList.contains('hidden');
      const open = forceState !== null ? forceState : isHidden;
      if (open) {
        container.classList.remove('hidden');
        if (input) {
          input.focus();
          onSrdSpotlightInput(input.value || '');
        }
      } else {
        container.classList.add('hidden');
      }
    }

    function clearSrdSpotlightInput() {
      const input = document.getElementById('srd-spotlight-input');
      if (input) input.value = '';
      const clearBtn = document.getElementById('btn-clear-srd-spotlight');
      if (clearBtn) clearBtn.classList.add('hidden');
      onSrdSpotlightInput('');
    }

    function onSrdSpotlightInput(query) {
      const resultsEl = document.getElementById('srd-spotlight-results');
      const clearBtn = document.getElementById('btn-clear-srd-spotlight');
      if (!resultsEl) return;

      const q = (query || '').toLowerCase().trim();
      if (clearBtn) {
        if (q.length > 0) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }

      const catalog = (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
        ? window.BUNDLED_SRD_CORE_CATALOG
        : [];

      // Filter catalog for weapons and shields (prioritizing weapons)
      let matches = catalog.filter(item => {
        if (!item || !item.name) return false;
        const type = (item.type || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        if (type !== 'weapon' && cat !== 'shield' && type !== 'armor') return false;
        if (!q) {
          // Default popular items when search is empty
          const pop = ['longsword', 'greatsword', 'dagger', 'shortbow', 'composite longbow', 'light crossbow', 'spiked chain', 'heavy wooden shield', 'darkwood buckler', 'rapier'];
          return pop.some(p => item.name.toLowerCase().includes(p));
        }
        const nameMatch = item.name.toLowerCase().includes(q);
        const tagMatch = Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q));
        const catMatch = cat.includes(q) || (item.weaponType && item.weaponType.toLowerCase().includes(q));
        return nameMatch || tagMatch || catMatch;
      });

      if (matches.length === 0) {
        resultsEl.innerHTML = `
          <div class="p-3 text-center text-xs text-slate-500 italic">
            No D&D 3.5e RAW SRD weapon or shield found matching "${query}".
          </div>
        `;
        return;
      }

      // Limit results to 15 for lightning fast DOM performance
      const displayMatches = matches.slice(0, 15);

      resultsEl.innerHTML = displayMatches.map(item => {
        const isShield = (item.category || '').toLowerCase() === 'shield';
        const isTwoHand = (item.weaponType || '').includes('Two-Handed') || (typeof RuleEngine !== 'undefined' && RuleEngine.isTwoHandedWeapon(item));
        const diceStr = item.dice || item.damage || (isShield ? '1d3/1d4' : '1d8');
        const critStr = item.crit || `${item.critMin || 20}/x${item.critMult || 2}`;
        const dmgType = item.dmgType || (isShield ? 'Bludgeoning' : 'Physical');
        const badgeColor = isShield ? 'border-sky-500/40 text-sky-300 bg-sky-950/40' : (isTwoHand ? 'border-amber-500/40 text-amber-300 bg-amber-950/40' : 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40');
        const escapedName = (item.name || '').replace(/'/g, "\\'");

        return `
          <div class="flex items-center justify-between p-2 hover:bg-slate-800/80 rounded transition gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs">${isShield ? '🛡️' : (isTwoHand ? '⚔️' : '🗡️')}</span>
                <span class="text-xs font-bold text-white truncate">${item.name}</span>
                <span class="text-[9px] font-semibold px-1.5 py-0.2 rounded border ${badgeColor}">
                  ${item.weaponType || item.category || 'Weapon'}
                </span>
              </div>
              <div class="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <span>Dice: <strong class="text-amber-300 font-bold">${diceStr}</strong></span>
                <span>Crit: <strong class="text-slate-300">${critStr}</strong></span>
                <span>Type: <strong class="text-slate-300">${dmgType}</strong></span>
                ${item.weight ? `<span class="text-slate-500">(${item.weight} lbs)</span>` : ''}
              </div>
            </div>
            <div class="shrink-0">
              <button type="button" onclick="addSrdCatalogItemToCharacter('${escapedName}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-[11px] rounded-lg shadow transition flex items-center gap-1 cursor-pointer">
                <span>➕</span>
                <span>Add to Character</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function addSrdCatalogItemToCharacter(itemName) {
      if (!character) return;
      const catalog = (typeof window.BUNDLED_SRD_CORE_CATALOG !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
        ? window.BUNDLED_SRD_CORE_CATALOG
        : [];

      const rawItem = catalog.find(i => i && i.name && i.name.toLowerCase().trim() === itemName.toLowerCase().trim());
      if (!rawItem) {
        console.warn('SRD Catalog item not found:', itemName);
        return;
      }

      const item = JSON.parse(JSON.stringify(rawItem));
      const cat = mapEntryToGearCategory(item);
      const isBeltItem = (item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable';
      const newId = Date.now();

      // 1. Add to character.gearPool
      if (!character.gearPool) character.gearPool = [];
      const alreadyInPool = character.gearPool.find(g => g && g.name && g.name.toLowerCase().trim() === item.name.toLowerCase().trim());
      if (!alreadyInPool) {
        character.gearPool.push({
          id: newId,
          name: item.name,
          masterDbName: item.name,
          category: cat,
          slot: item.slot && item.slot !== 'None' ? item.slot : (cat === 'Shield' ? 'Off-Hand' : cat),
          qty: 1,
          weight: Number(item.weight) || 0,
          cost: Number(item.cost) || 0,
          desc: item.benefit || item.description || '',
          isBelt: isBeltItem,
          isEquipped: false
        });
      }

      // 2. If Weapon, add to character.weapons
      if (cat === 'Weapon') {
        if (!character.weapons) character.weapons = [];
        let existingWep = character.weapons.find(w => w && w.name && w.name.toLowerCase().trim() === item.name.toLowerCase().trim());
        const isTwoHand = (item.weaponType || '').includes('Two-Handed') || (typeof RuleEngine !== 'undefined' && RuleEngine.isTwoHandedWeapon(item));

        if (!existingWep) {
          const primaryPart = Array.isArray(item.damageParts) && item.damageParts.length > 0 ? item.damageParts[0] : null;
          const secondaryParts = Array.isArray(item.damageParts) && item.damageParts.length > 1 ? item.damageParts.slice(1) : [];
          const wMeta = item.weaponMeta || {};
          existingWep = {
            id: item.id || ('wep_' + String(item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')),
            baseItemId: item.baseItemId || item.id || null,
            name: item.name,
            grip: isTwoHand ? '2-Hand' : (item.slot === 'Main Hand' ? '1-Hand' : '1-Hand'),
            dice: (primaryPart && primaryPart.dice) || item.dice || '1d8',
            damageParts: Array.isArray(item.damageParts) && item.damageParts.length > 0
              ? JSON.parse(JSON.stringify(item.damageParts))
              : [{ dice: item.dice || '1d8', bonus: Number(item.dmgBonus) || 0, type: item.dmgType || 'Slashing', multiplyOnCrit: true }],
            modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
            modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
            critMin: Number(wMeta.critMin || item.critMin) || 20,
            rawCritMin: Number(wMeta.critMin || item.critMin) || 20,
            critMult: Number(wMeta.critMult || item.critMult) || 2,
            attBonus: Number(item.enhancementBonus || item.attBonus) || 0,
            dmgBonus: Number(item.enhancementBonus || item.dmgBonus) || 0,
            dmgType: (primaryPart && primaryPart.type) || item.dmgType || 'Slashing',
            bonusType: 'enhancement',
            tags: item.tags || [],
            elementalMods: secondaryParts.map(sp => ({ name: sp.source || sp.type, dice: sp.dice, type: sp.type })),
            keen: Boolean(item.ruleFlags && item.ruleFlags.keen)
          };
          character.weapons.push(existingWep);
        }

        // Auto equip if character active weapon is empty or Unarmed Strike
        ensureWeaponSetsData();
        const curActive = character.activeWeapon;
        if (!curActive || curActive === 'Unarmed Strike' || curActive === 'None') {
          character.activeWeapon = item.name;
          if (character.tactical?.weaponSets?.set1) {
            character.tactical.weaponSets.set1.mainWeapon = item.name;
            character.tactical.weaponSets.set1.grip = isTwoHand ? '2-Hand' : '1-Hand';
          }
        }
      }

      // 3. If Shield, make sure it's selected in set2 if set2 is empty
      if (cat === 'Shield') {
        ensureWeaponSetsData();
        if (!character.tactical?.weaponSets?.set2?.mainWeapon || character.tactical?.weaponSets?.set2?.mainWeapon === 'None') {
          character.tactical.weaponSets.set2.mainWeapon = item.name;
        }
      }

      // Close spotlight dropdown
      toggleSrdSpotlight(false);

      // Refresh UI components
      try { populateWeaponSetsEditorDropdowns(); } catch (e) {}
      try { renderWeaponSetsUI(); } catch (e) {}
      try { renderInventory(); } catch (e) {}
      try { recalculateOffense(); } catch (e) {}
      saveStateToStorage(true);

      if (typeof showDiceTopToast === 'function') {
        const icon = cat === 'Shield' ? '🛡️' : (cat === 'Armor' ? '🛡️' : '⚔️');
        showDiceTopToast({
          title: `${item.name} Added to Character!`,
          breakdown: `D&D 3.5e RAW SRD: "${item.name}" added to equipment pool.`,
          icon: icon
        });
      }
    }

    function getWeaponOrPoolItem(itemName) {
      if (!character || !itemName || itemName === 'None') return null;
      let wep = (character.weapons || []).find(w => w && w.name === itemName);
      let poolItem = (character.gearPool || []).find(g => g && g.name === itemName);
      return { wep, poolItem };
    }

    function stepWeaponEnhancement(setNum, delta) {
      ensureWeaponSetsData();
      const sets = character?.tactical?.weaponSets;
      if (!sets) return;
      const setObj = setNum === 1 ? sets.set1 : sets.set2;
      const wepName = setObj?.mainWeapon;
      if (!wepName || wepName === 'None') return;

      let wep = (character.weapons || []).find(w => w && w.name === wepName);
      let poolItem = (character.gearPool || []).find(g => g && g.name === wepName);

      if (!wep && poolItem && poolItem.category === 'Weapon') {
        if (!character.weapons) character.weapons = [];
        wep = {
          name: poolItem.name,
          grip: setObj?.grip || '1-Hand',
          dice: poolItem.dice || '1d8',
          critMin: poolItem.critMin || 20,
          rawCritMin: poolItem.critMin || 20,
          critMult: poolItem.critMult || 2,
          attBonus: 0,
          dmgBonus: 0,
          bonusType: 'Enhancement',
          elementalMods: [],
          keen: false
        };
        character.weapons.push(wep);
      }

      if (wep) {
        const cur = Number(wep.attBonus) || 0;
        const next = Math.max(0, Math.min(5, cur + delta));
        wep.attBonus = next;
        wep.dmgBonus = next;
        wep.bonusType = 'Enhancement';
        if (poolItem) {
          poolItem.attBonus = next;
          poolItem.dmgBonus = next;
        }
      } else if (poolItem && (poolItem.category === 'Shield' || poolItem.category === 'Armor')) {
        const cur = Number(poolItem.enhancementAc || poolItem.attBonus || 0);
        const next = Math.max(0, Math.min(5, cur + delta));
        poolItem.enhancementAc = next;
        poolItem.acBonus = (poolItem.baseAc || poolItem.acBonus || 1) + next;
      }

      updateWeaponEditorEnhancementBadges();
      try { renderWeaponSetsUI(); } catch (e) {}
      try { recalculateOffense(); } catch (e) {}
      saveStateToStorage(true);
    }

    function toggleWeaponElementalProperty(setNum, propId) {
      ensureWeaponSetsData();
      const sets = character?.tactical?.weaponSets;
      if (!sets) return;
      const setObj = setNum === 1 ? sets.set1 : sets.set2;
      const wepName = setObj?.mainWeapon;
      if (!wepName || wepName === 'None') return;

      let wep = (character.weapons || []).find(w => w && w.name === wepName);
      if (!wep) {
        stepWeaponEnhancement(setNum, 0); // initialize weapon object
        wep = (character.weapons || []).find(w => w && w.name === wepName);
      }
      if (!wep) return;

      const propDef = SRD_WEAPON_PROPERTIES.find(p => p.id === propId);
      if (!propDef) return;

      if (propDef.isKeen) {
        wep.keen = !wep.keen;
        const rawMin = Number(wep.rawCritMin) || Number(wep.critMin) || 20;
        wep.rawCritMin = rawMin;
        if (wep.keen) {
          // Double threat range per RAW: 20 -> 19-20 (range 2), 19-20 -> 17-20 (range 4), 18-20 -> 15-20 (range 6)
          const range = 21 - rawMin;
          wep.critMin = Math.max(12, 21 - (range * 2));
        } else {
          wep.critMin = rawMin;
        }
      } else {
        if (!Array.isArray(wep.elementalMods)) wep.elementalMods = [];
        const existingIdx = wep.elementalMods.findIndex(m => m.id === propId);
        if (existingIdx >= 0) {
          wep.elementalMods.splice(existingIdx, 1);
        } else {
          wep.elementalMods.push({
            id: propDef.id,
            name: propDef.name,
            dice: propDef.dice,
            type: propDef.type,
            icon: propDef.icon
          });
        }
      }

      renderWeaponSetModifierChips(setNum);
      try { renderWeaponSetsUI(); } catch (e) {}
      try { recalculateOffense(); } catch (e) {}
      saveStateToStorage(true);
    }

    function updateWeaponEditorEnhancementBadges() {
      const sets = character?.tactical?.weaponSets;
      if (!sets) return;

      const s1Name = sets.set1?.mainWeapon;
      const s2Name = sets.set2?.mainWeapon;

      const s1Wep = (character.weapons || []).find(w => w && w.name === s1Name);
      const s1Pool = (character.gearPool || []).find(g => g && g.name === s1Name);
      const s1Bonus = s1Wep ? (s1Wep.attBonus || 0) : (s1Pool?.enhancementAc || s1Pool?.attBonus || 0);

      const s2Wep = (character.weapons || []).find(w => w && w.name === s2Name);
      const s2Pool = (character.gearPool || []).find(g => g && g.name === s2Name);
      const s2Bonus = s2Wep ? (s2Wep.attBonus || 0) : (s2Pool?.enhancementAc || s2Pool?.attBonus || 0);

      const b1 = document.getElementById('set1-enhancement-badge');
      if (b1) b1.textContent = s1Bonus > 0 ? `+${s1Bonus}` : '+0';

      const b2 = document.getElementById('set2-enhancement-badge');
      if (b2) b2.textContent = s2Bonus > 0 ? `+${s2Bonus}` : '+0';
    }

    function renderWeaponSetModifierChips(setNum) {
      const containerId = setNum === 1 ? 'set1-elemental-chips-container' : 'set2-elemental-chips-container';
      const container = document.getElementById(containerId);
      if (!container) return;

      const sets = character?.tactical?.weaponSets;
      const setObj = setNum === 1 ? sets?.set1 : sets?.set2;
      const wepName = setObj?.mainWeapon;

      if (!wepName || wepName === 'None') {
        container.innerHTML = '<span class="text-[9px] text-slate-500 italic">No equipment selected.</span>';
        return;
      }

      const wep = (character.weapons || []).find(w => w && w.name === wepName);
      const activeMods = Array.isArray(wep?.elementalMods) ? wep.elementalMods : [];
      const isKeen = !!wep?.keen;

      container.innerHTML = SRD_WEAPON_PROPERTIES.map(prop => {
        let isActive = false;
        if (prop.isKeen) {
          isActive = isKeen;
        } else {
          isActive = activeMods.some(m => m.id === prop.id);
        }

        const badgeClass = isActive
          ? prop.activeClass
          : 'bg-slate-950/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600';

        const label = prop.dice ? `${prop.icon} ${prop.name} (+${prop.dice})` : `${prop.icon} ${prop.name}`;

        return `
          <button type="button" onclick="toggleWeaponElementalProperty(${setNum}, '${prop.id}')" class="px-2 py-0.5 rounded text-[9px] font-bold border transition flex items-center gap-1 cursor-pointer select-none ${badgeClass}">
            <span>${label}</span>
          </button>
        `;
      }).join('');
    }

    function hasFlurryAbility(char) {
      if (!char) return false;
      let hasMonk = false;
      if (typeof char.classes === 'string') {
        hasMonk = char.classes.toLowerCase().includes('monk');
      } else if (Array.isArray(char.classes)) {
        hasMonk = char.classes.some(c => c && (typeof c === 'string' ? c : (c.name || '')).toLowerCase().includes('monk'));
      }
      if (!hasMonk && Array.isArray(char.levelProgression)) {
        hasMonk = char.levelProgression.some(p => p && (p.className || '').toLowerCase().includes('monk') && p.active !== false);
      }
      const hasSpecial = (char.specialAbilities || []).some(a => {
        if (!a) return false;
        const name = typeof a === 'string' ? a : (a.name || '');
        return name.toLowerCase().includes('flurry');
      });
      const hasFeat = (char.feats || []).some(f => {
        if (!f) return false;
        const name = typeof f === 'string' ? f : (f.name || '');
        return name.toLowerCase().includes('flurry');
      });
      return hasMonk || hasSpecial || hasFeat;
    }

    // --- ABILITY & FEAT QUALIFICATION HELPERS ---
    function characterHasFeat(char, featName) {
      if (!char || !char.feats) return false;
      const target = featName.toLowerCase().trim();
      return char.feats.some(f => {
        if (!f) return false;
        const n = (typeof f === 'string' ? f : (f.name || '')).toLowerCase().trim();
        return n === target || n.includes(target);
      });
    }

    function characterHasSpecialAbility(char, abilityName) {
      if (!char) return false;
      const target = abilityName.toLowerCase().trim();
      const pool = [
        ...(char.specialAbilities || []),
        ...(char.classFeatures || []),
        ...(char.traits || [])
      ];
      return pool.some(a => {
        if (!a) return false;
        const n = (typeof a === 'string' ? a : (a.name || '')).toLowerCase().trim();
        return n === target || n.includes(target);
      });
    }

    function characterHasSpell(char, spellName) {
      if (!char) return false;
      const target = spellName.toLowerCase().trim();
      const pool = [
        ...(char.spells || []),
        ...(char.knownSpells || []),
        ...(char.preparedSpells || []),
        ...(char.spellbook || [])
      ];
      return pool.some(s => {
        if (!s) return false;
        const n = (typeof s === 'string' ? s : (s.name || '')).toLowerCase().trim();
        return n === target || n.includes(target);
      });
    }

    function characterHasManeuver(char, manName) {
      if (!char) return false;
      const target = manName.toLowerCase().trim();
      const pool = [
        ...(char.martialManeuvers || []),
        ...(char.knownManeuvers || []),
        ...(char.readiedManeuvers || []),
        ...(char.martialStances || []),
        ...(char.stances || []),
        ...(char.tomeOfBattle?.maneuversKnown || []),
        ...(char.tomeOfBattle?.readiedManeuvers || []),
        ...(char.tomeOfBattle?.stancesKnown || [])
      ];
      return pool.some(m => {
        if (!m) return false;
        const n = (typeof m === 'string' ? m : (m.name || '')).toLowerCase().trim();
        return n === target || n.includes(target);
      });
    }

    function characterHasItem(char, itemName) {
      if (!char) return false;
      const target = itemName.toLowerCase().trim();
      const pool = [
        ...(char.gearPool || []),
        ...(char.inventory || []),
        ...(char.equipment ? Object.values(char.equipment) : [])
      ];
      return pool.some(item => {
        if (!item) return false;
        const n = (typeof item === 'string' ? item : (item.name || '')).toLowerCase().trim();
        return n === target || n.includes(target);
      });
    }

    function characterHasBuff(char, buffName) {
      if (!char) return false;
      const target = buffName.toLowerCase().trim();
      const pool = [
        ...(char.activeBuffs || []),
        ...(char.buffs || [])
      ];
      return pool.some(b => {
        if (!b) return false;
        if (typeof b === 'object' && b.active !== undefined && !b.active) return false;
        const n = (typeof b === 'string' ? b : (b.name || '')).toLowerCase().trim();
        return n === target || n.includes(target);
      });
    }

    function characterHasSneakAttack(char) {
      if (!char) return false;
      if (characterHasFeat(char, 'sneak attack') || characterHasSpecialAbility(char, 'sneak attack')) return true;
      const classes = typeof char.classes === 'string' ? char.classes.toLowerCase() : '';
      if (classes.includes('rogue') || classes.includes('ninja') || classes.includes('assassin') || classes.includes('scout')) return true;
      if (Array.isArray(char.classes)) {
        if (char.classes.some(c => {
          const n = (typeof c === 'string' ? c : (c.name || '')).toLowerCase();
          return n.includes('rogue') || n.includes('ninja') || n.includes('assassin') || n.includes('scout');
        })) return true;
      }
      return false;
    }

    function ensureActiveModifiersPool() {
      if (!character) return;
      if (!Array.isArray(character.activeModifiers)) {
        character.activeModifiers = [];
      }

      // Sanitize: filter out any null, string, or malformed entries
      character.activeModifiers = character.activeModifiers.filter(m => m && typeof m === 'object' && typeof m.name === 'string');

      // Qualified pool: ONLY modifiers the character actually qualifies for
      const qualifiedPool = [
        { name: 'Two-Weapon Fighting (TWF)', source: 'Combat', bonusAtk: 0, dice: '', type: 'TWF', combatScope: 'melee', active: false, notes: 'Extra Off-Hand Attack (RAW TWF)' }
      ];

      // Flurry (Monk)
      if (hasFlurryAbility(character)) {
        qualifiedPool.push({
          name: 'Flurry of Blows',
          source: 'Monk',
          bonusAtk: 0,
          dice: '',
          type: 'Flurry',
          combatScope: 'melee',
          active: false,
          notes: 'Full Attack: +1 Extra Attack (-2 Penalty)'
        });
      }

      // Stances
      if (characterHasManeuver(character, 'Punishing Stance')) {
        qualifiedPool.push({ name: 'Punishing Stance', source: 'Stance', bonusAtk: 0, dice: '1d6', type: 'Slashing', combatScope: 'melee', active: false, notes: '+1d6 Damage, -2 AC' });
      }

      // Strike Maneuvers
      if (characterHasManeuver(character, 'Mountain Hammer')) {
        qualifiedPool.push({ name: 'Mountain Hammer', source: 'Maneuver', bonusAtk: 0, dice: '2d6', type: 'Slashing', combatScope: 'melee', active: false, notes: 'Bypasses DR and Hardness' });
      }
      if (characterHasManeuver(character, 'Steel Wind')) {
        qualifiedPool.push({ name: 'Steel Wind', source: 'Maneuver', bonusAtk: 0, dice: '', type: 'Martial', combatScope: 'melee', active: false, notes: 'Attack 2 Adjacent Targets' });
      }

      // Spells
      if (characterHasSpell(character, 'Blade of Blood')) {
        qualifiedPool.push({ name: 'Blade of Blood', source: 'Spell', bonusAtk: 0, dice: '3d6', type: 'Negative Energy', combatScope: 'melee', active: false, notes: '+3d6 Damage' });
      }

      // Items
      if (characterHasItem(character, 'Witchlight')) {
        qualifiedPool.push({ name: 'Witchlight (+2 Damage)', source: 'Item', bonusAtk: 0, bonusDmg: 2, dice: '', type: 'Untyped', combatScope: 'melee', active: false, notes: '+2 Melee Damage (1 Round)' });
        qualifiedPool.push({ name: 'Witchlight (+4 Damage)', source: 'Item', bonusAtk: 0, bonusDmg: 4, dice: '', type: 'Untyped', combatScope: 'melee', active: false, notes: '+4 Melee Damage (1 Round)' });
      }
      if (characterHasItem(character, 'Boots of Speed')) {
        qualifiedPool.push({ name: 'Boots of Speed', source: 'Item', bonusAtk: 1, dice: '', type: 'Untyped', combatScope: 'both', active: false, notes: '+1 Attack, +1 AC, Extra Attack' });
      }
      if (characterHasBuff(character, 'Haste')) {
        qualifiedPool.push({ name: 'Haste (Spell)', source: 'Spell', bonusAtk: 1, dice: '', type: 'Untyped', combatScope: 'both', active: true, notes: '+1 Attack, +1 AC, Extra Attack' });
      }

      // Sneak Attack
      if (characterHasSneakAttack(character)) {
        qualifiedPool.push({ name: 'Sneak Attack', source: 'Feat', bonusAtk: 0, dice: '1d6', type: 'Precision', combatScope: 'both', active: false, notes: '+1d6 Precision Damage' });
      }

      // CLEANUP: Strictly remove unowned modifiers, spell attacks, skills, and non-melee items lingering from prior storage/dummy data
      const isSkillItemName = (rawName) => {
        const clean = String(rawName || '').toLowerCase().trim();
        if (!clean) return false;
        if ((character.skills || []).some(sk => sk && sk.name && sk.name.toLowerCase().trim() === clean)) return true;
        if (typeof DND35_CONSOLIDATED_SKILLS !== 'undefined' && Array.isArray(DND35_CONSOLIDATED_SKILLS)) {
          if (DND35_CONSOLIDATED_SKILLS.some(c => c.name.toLowerCase().trim() === clean)) return true;
        }
        return false;
      };

      character.activeModifiers = character.activeModifiers.filter(m => {
        if (!m || !m.name) return false;
        const n = m.name.toLowerCase().trim();
        // Never allow Skills inside attack/damage modifier toggles
        if (m.source === 'Skill' || isSkillItemName(n)) return false;
        // Disallow spell attacks, saving throw spells, and direct ammunition from melee active modifiers
        if (n.includes('acid arrow') || n.includes('fireball') || n.includes('scorching ray') || n.includes('magic missile') || n.includes('ray of frost') || n.includes('disintegrate')) return false;
        if (n.includes('arrow') && !n.includes('enhance arrow') && !n.includes('blade of blood')) return false;
        const dbEntry = typeof findMasterItem === 'function' ? findMasterItem(m.name) : null;
        if (dbEntry) {
          if (dbEntry.type === 'Skill') return false;
          if (['ranged_touch', 'melee_touch', 'spell_auto', 'saving_throw', 'ammunition', 'weapon', 'shield'].includes(dbEntry.attackType)) {
            return false;
          }
          if (dbEntry.combatScope === 'ranged' || dbEntry.scope === 'Ranged Only') return false;
        }
        if (n.includes('twf') || n.includes('two-weapon')) return true;
        if (n.includes('flurry')) return hasFlurryAbility(character);
        if (n.includes('punishing stance')) return characterHasManeuver(character, 'Punishing Stance');
        if (n.includes('mountain hammer')) return characterHasManeuver(character, 'Mountain Hammer');
        if (n.includes('steel wind')) return characterHasManeuver(character, 'Steel Wind');
        if (n.includes('blade of blood')) return characterHasSpell(character, 'Blade of Blood');
        if (n.includes('witchlight')) return characterHasItem(character, 'Witchlight');
        if (n.includes('boots of speed')) return characterHasItem(character, 'Boots of Speed');
        if (n.includes('haste')) return characterHasBuff(character, 'Haste');
        if (n.includes('sneak attack')) return characterHasSneakAttack(character);
        if (typeof getPinsForDrawer === 'function') {
          const isPinnedMelee = getPinsForDrawer('offense_melee').some(p => p && p.name && p.name.toLowerCase().trim() === n && p.sourceType !== 'Skill' && p.type !== 'Skill');
          if (isPinnedMelee) return true;
        }
        if (m.combatScope === 'ranged' || m.scope === 'Ranged Only') return false;
        return qualifiedPool.some(q => q.name.toLowerCase().trim() === n);
      });

      // Also include any pinned items in offense_melee (excluding Skills) into qualifiedPool
      if (typeof getPinsForDrawer === 'function') {
        const meleePins = getPinsForDrawer('offense_melee');
        meleePins.forEach(p => {
          if (!p || !p.name) return;
          if (p.sourceType === 'Skill' || p.type === 'Skill' || p.action === 'Check' || isSkillItemName(p.name)) return;
          const pNameLower = p.name.toLowerCase().trim();
          if (!qualifiedPool.some(q => q.name.toLowerCase().trim() === pNameLower)) {
            const dmgExpr = p.badge || (typeof findDiceExpression === 'function' ? findDiceExpression(p.desc) : '');
            qualifiedPool.push({
              name: p.name,
              source: p.sourceType || 'Combat',
              bonusAtk: 0,
              dice: dmgExpr,
              type: 'Melee',
              combatScope: 'melee',
              active: Boolean(p.active),
              notes: p.desc || ''
            });
          }
        });
      }

      // Synchronize qualified items into character.activeModifiers
      qualifiedPool.forEach(def => {
        const existing = character.activeModifiers.find(m => m && m.name && m.name.toLowerCase() === def.name.toLowerCase());
        if (!existing) {
          character.activeModifiers.push({ ...def });
        } else {
          if (def.combatScope && !existing.combatScope) existing.combatScope = def.combatScope;
          if (def.bonusDmg && !existing.bonusDmg) existing.bonusDmg = def.bonusDmg;
          if (def.dice && !existing.dice) existing.dice = def.dice;
          if (def.notes && !existing.notes) existing.notes = def.notes;
        }
      });
    }

    function onTWFModifierToggle() {
      const isChecked = document.getElementById('mod-twf')?.checked ?? false;
      const mainWep = character.activeWeapon || character.tactical?.weaponSets?.set1?.mainWeapon;
      const mainIsTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(mainWep) : false;
      const hasOversized = typeof RuleEngine !== 'undefined' ? RuleEngine.hasOversizedWeaponFeat(character) : false;

      // Rule 2: TWF unavailable if main hand is two-handed without oversized weapon feat
      if (isChecked && mainIsTwoHand && !hasOversized) {
        if (typeof showToast === 'function') {
          showToast(`Your main-hand weapon "${mainWep}" is two-handed! Two-Weapon Fighting (TWF) requires Monkey Grip.`, 'warning');
        }
        const twfCb = document.getElementById('mod-twf');
        if (twfCb) twfCb.checked = false;
        return;
      }

      let mod = (character.activeModifiers || []).find(m => m && m.name && (m.name.includes('TWF') || m.name.includes('Two-Weapon')));
      if (mod) {
        mod.active = isChecked;
      } else {
        if (!character.activeModifiers) character.activeModifiers = [];
        character.activeModifiers.push({
          name: 'Two-Weapon Fighting (TWF)',
          source: 'Combat',
          bonusAtk: 0,
          dice: '',
          type: 'TWF',
          active: isChecked,
          notes: 'Extra Off-Hand Attack (RAW TWF)'
        });
      }
      recalculateOffense();
      renderOffenseModifiersGrid();
      saveStateToStorage(false);
    }

    function renderOffenseModifiersGrid() {
      const grid = document.getElementById('combat-modifiers-3x3-grid');
      if (!grid) return;

      ensureActiveModifiersPool();

      const flanking = !!character.tactical?.flanking;
      const charge = !!character.tactical?.charge;
      const hg = !!character.tactical?.higherGround;
      const twfMod = (character.activeModifiers || []).find(m => m && m.name && (m.name.includes('TWF') || m.name.includes('Two-Weapon')));
      const isTWF = twfMod?.active ?? false;

      // Row 1: Fixed 3 items: 1. Flanking, 2. Charge, 3. Higher Ground (Glow Card Toggle)
      const fixedCardsHtml = [
        `
        <div onclick="toggleFixedMeleeModifier('flanking')"
             onmouseenter="showCombatModifierHoverTooltip(event, 'flanking', 'melee')"
             onmouseleave="hideCombatModifierHoverTooltip()"
             onmousemove="updateCombatModifierHoverTooltipPos(event)"
             class="relative ${flanking ? 'border-2 border-sky-400 bg-sky-950 text-white shadow-[0_0_12px_rgba(56,189,248,0.35)] ring-1 ring-sky-400/30' : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-sky-500/60'} rounded-lg p-1.5 transition flex flex-col justify-between text-center select-none min-h-[64px] group cursor-pointer">
          <div class="flex items-center justify-center px-0.5 text-[9px] leading-none shrink-0 w-full">
            <span class="text-[8px] font-mono ${flanking ? 'text-sky-300 font-bold' : 'text-slate-500'} truncate max-w-[75px]">Positional</span>
          </div>
          <div class="flex-1 flex flex-col justify-center items-center px-0.5 my-auto">
            <div class="text-[10px] ${flanking ? 'font-black text-white' : 'font-bold text-sky-400'} leading-tight truncate w-full">Flanking</div>
            <div class="text-[9px] ${flanking ? 'text-sky-200 font-bold' : 'text-slate-400'} font-mono mt-1">+2 Melee</div>
          </div>
        </div>
        `,
        `
        <div onclick="toggleFixedMeleeModifier('charge')"
             onmouseenter="showCombatModifierHoverTooltip(event, 'charge', 'melee')"
             onmouseleave="hideCombatModifierHoverTooltip()"
             onmousemove="updateCombatModifierHoverTooltipPos(event)"
             class="relative ${charge ? 'border-2 border-rose-400 bg-rose-950 text-white shadow-[0_0_12px_rgba(251,113,133,0.35)] ring-1 ring-rose-400/30' : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-rose-500/60'} rounded-lg p-1.5 transition flex flex-col justify-between text-center select-none min-h-[64px] group cursor-pointer">
          <div class="flex items-center justify-center px-0.5 text-[9px] leading-none shrink-0 w-full">
            <span class="text-[8px] font-mono ${charge ? 'text-rose-300 font-bold' : 'text-slate-500'} truncate max-w-[75px]">Action</span>
          </div>
          <div class="flex-1 flex flex-col justify-center items-center px-0.5 my-auto">
            <div class="text-[10px] ${charge ? 'font-black text-white' : 'font-bold text-rose-400'} leading-tight truncate w-full">Charge</div>
            <div class="text-[9px] ${charge ? 'text-rose-200 font-bold' : 'text-slate-400'} font-mono mt-1">+2 Atk / -2 AC</div>
          </div>
        </div>
        `,
        `
        <div onclick="toggleFixedMeleeModifier('higherGround')"
             onmouseenter="showCombatModifierHoverTooltip(event, 'higherGround', 'melee')"
             onmouseleave="hideCombatModifierHoverTooltip()"
             onmousemove="updateCombatModifierHoverTooltipPos(event)"
             class="relative ${hg ? 'border-2 border-amber-400 bg-amber-950 text-white shadow-[0_0_12px_rgba(251,191,36,0.35)] ring-1 ring-amber-400/30' : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-amber-500/60'} rounded-lg p-1.5 transition flex flex-col justify-between text-center select-none min-h-[64px] group cursor-pointer">
          <div class="flex items-center justify-center px-0.5 text-[9px] leading-none shrink-0 w-full">
            <span class="text-[8px] font-mono ${hg ? 'text-amber-300 font-bold' : 'text-slate-500'} truncate max-w-[75px]">Positional</span>
          </div>
          <div class="flex-1 flex flex-col justify-center items-center px-0.5 my-auto">
            <div class="text-[10px] ${hg ? 'font-black text-white' : 'font-bold text-amber-400'} leading-tight truncate w-full">Higher Gr.</div>
            <div class="text-[9px] ${hg ? 'text-amber-200 font-bold' : 'text-slate-400'} font-mono mt-1">+1 Melee</div>
          </div>
        </div>
        `
      ];

      // Rows 2+ : Dynamic modifiers (strictly melee & both modifiers, excluding TWF which is managed by weapon sets)
      const isExpanded = !!window.combatModifiersGridExpanded;
      const dynamicMods = getMeleeDynamicModifiers();
      // In 3x3 layout when collapsed: 3 top (Flanking, Charge, Higher Ground) + 6 dynamic = 9 cards total!
      const visibleCount = isExpanded ? dynamicMods.length : Math.min(6, dynamicMods.length);
      const visibleMods = dynamicMods.slice(0, visibleCount);

      // Sync Melee Reorder Toggle UI
      const meleeBtn = document.getElementById('btn-melee-reorder-toggle');
      const meleeBtnText = document.getElementById('melee-reorder-btn-text');
      if (meleeBtnText) meleeBtnText.textContent = window.meleeReorderModeActive ? 'Done ✓' : 'Reorder';
      if (meleeBtn) {
        if (window.meleeReorderModeActive) {
          meleeBtn.className = 'text-[9px] text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 font-bold flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded border border-emerald-600 transition';
        } else {
          meleeBtn.className = 'text-[9px] text-amber-400 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 transition';
        }
      }

      const dynamicCardsHtml = visibleMods.map((mod, idx) => {
        if (!mod || !mod.name) return '';
        let bonusStr = mod.dice ? mod.dice : (mod.bonusDmg ? `+${mod.bonusDmg} Dmg` : (mod.bonusAtk ? `+${mod.bonusAtk} Atk` : 'Active'));
        let cardBorderActive = 'border border-rose-500 bg-rose-950/60 text-white shadow-md shadow-rose-950/50 ring-1 ring-rose-500/40';
        let bonusColor = 'text-amber-300';

        if (mod.name.includes('Flurry')) {
          bonusStr = '+1 Attack';
          bonusColor = 'text-rose-300';
        }

        const actualIdx = character.activeModifiers.indexOf(mod);

        const reorderControls = window.meleeReorderModeActive ? `
          <div class="flex items-center justify-between px-0.5 text-[9px] text-slate-500 leading-none shrink-0 w-full" onclick="event.stopPropagation()">
            <button type="button" onclick="moveMeleeModifierOrder(${idx}, -1, event)" class="hover:text-amber-400 p-0.5 disabled:opacity-20 cursor-pointer" ${idx <= 0 ? 'disabled' : ''} title="Move Left">◀</button>
            <span class="text-[8px] text-slate-400 font-mono truncate max-w-[45px]">${mod.source || ''}</span>
            <button type="button" onclick="moveMeleeModifierOrder(${idx}, 1, event)" class="hover:text-amber-400 p-0.5 disabled:opacity-20 cursor-pointer" ${idx >= dynamicMods.length - 1 ? 'disabled' : ''} title="Move Right">▶</button>
          </div>
        ` : `
          <div class="flex items-center justify-center px-0.5 text-[9px] leading-none shrink-0 w-full">
            <span class="text-[8px] font-mono ${mod.active ? 'text-rose-400 font-bold' : 'text-slate-500'} truncate max-w-[75px]">${mod.source || ''}</span>
          </div>
        `;

        const safeName = (mod.name || '').replace(/'/g, "\\'");
        return `
        <div onclick="toggleModifier(${actualIdx})"
             onmouseenter="showCombatModifierHoverTooltip(event, '${safeName}', 'melee')"
             onmouseleave="hideCombatModifierHoverTooltip()"
             onmousemove="updateCombatModifierHoverTooltipPos(event)"
             class="relative ${mod.active ? cardBorderActive : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-rose-500/60'} rounded-lg p-1.5 transition flex flex-col justify-between text-center select-none min-h-[64px] group cursor-pointer">
          <!-- Reorder Mini Controls -->
          ${reorderControls}

          <div class="flex-1 flex flex-col justify-center items-center px-0.5 my-auto">
            <div class="text-[10px] font-bold ${mod.active ? 'text-white font-extrabold' : 'text-slate-200'} leading-tight truncate w-full">${mod.name}</div>
            <div class="text-[9px] ${mod.active ? 'text-amber-300 font-bold' : bonusColor} font-mono mt-1">${bonusStr}</div>
          </div>
        </div>
        `;
      });

      grid.innerHTML = fixedCardsHtml.join('') + dynamicCardsHtml.join('');

      // Show/hide expand button if dynamic mods > 6
      const expandBar = document.getElementById('combat-modifiers-expand-bar');
      const expandBtn = document.getElementById('btn-toggle-expand-mods');
      if (expandBar && expandBtn) {
        if (dynamicMods.length > 6) {
          expandBar.classList.remove('hidden');
          expandBtn.innerHTML = isExpanded 
            ? '<span>▴ Show Less (Collapse 3x3)</span>' 
            : `<span>▾ Show More (+${dynamicMods.length - 6} Modifiers)</span>`;
        } else {
          expandBar.classList.add('hidden');
        }
      }
    }

    function renderActiveModifiers() {
      if (typeof renderOffenseModifiersGrid === 'function') {
        renderOffenseModifiersGrid();
      }
    }

    function toggleExpandModifiersGrid() {
      window.combatModifiersGridExpanded = !window.combatModifiersGridExpanded;
      renderOffenseModifiersGrid();
    }

    // --- TACTICAL DEFENSE GRID ENGINE ---
    function renderDefenseModifiersGrid() {
      const grid = document.getElementById('combat-modifiers-defense-3x3-grid');
      if (!grid) return;

      if (!character.tactical) character.tactical = {};

      const fd = Boolean(character.tactical.fightingDefensively);
      const td = Boolean(character.tactical.totalDefense);
      const sb = Boolean(character.tactical.shieldBlockActive);

      const tumbleSkill = (character.skills || []).find(s => s && s.name && s.name.toLowerCase() === 'tumble');
      const tumbleRanks = tumbleSkill ? (Number(tumbleSkill.ranks) || 0) : 0;
      const fdDodge = tumbleRanks >= 5 ? 3 : 2;
      const tdDodge = tumbleRanks >= 5 ? 6 : 4;

      const activeClass = 'relative border-2 border-indigo-400 bg-indigo-950 text-white shadow-[0_0_12px_rgba(129,140,248,0.35)] ring-1 ring-indigo-400/30 rounded-lg p-1.5 transition flex flex-col justify-between text-center select-none min-h-[64px] group cursor-pointer';
      const inactiveClass = 'relative border border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500/60 rounded-lg p-1.5 transition flex flex-col justify-between text-center select-none min-h-[64px] group cursor-pointer';

      const cards = [
        {
          id: 'fightingDefensively',
          name: 'Fighting Def.',
          source: 'Action',
          bonusStr: `+${fdDodge} AC / -4 Atk`,
          active: fd,
          onclick: 'onToggleFightingDefensively()'
        },
        {
          id: 'totalDefense',
          name: 'Total Defense',
          source: 'Standard',
          bonusStr: `+${tdDodge} AC • Passive`,
          active: td,
          onclick: 'onToggleTotalDefense()'
        },
        {
          id: 'shieldBlock',
          name: 'Shield Block',
          source: 'Counter',
          bonusStr: '+4 Shield AC',
          active: sb,
          onclick: 'triggerShieldBlockReaction()'
        }
      ];

      grid.innerHTML = cards.map(c => `
        <div onclick="${c.onclick}"
             onmouseenter="showCombatModifierHoverTooltip(event, '${c.id}', 'defense')"
             onmouseleave="hideCombatModifierHoverTooltip()"
             onmousemove="updateCombatModifierHoverTooltipPos(event)"
             class="${c.active ? activeClass : inactiveClass}">
          <div class="flex items-center justify-center px-0.5 text-[9px] leading-none shrink-0 w-full">
            <span class="text-[8px] font-mono ${c.active ? 'text-indigo-300 font-bold' : 'text-slate-500'} truncate max-w-[75px]">${c.source}</span>
          </div>

          <div class="flex-1 flex flex-col justify-center items-center px-0.5 my-auto">
            <div class="text-[10px] ${c.active ? 'font-black text-white' : 'font-bold text-slate-200'} leading-tight truncate w-full">${c.name}</div>
            <div class="text-[9px] ${c.active ? 'text-indigo-200 font-bold' : 'text-indigo-400'} font-mono mt-1">${c.bonusStr}</div>
          </div>
        </div>
      `).join('');

      // Hide pin badge and expand bar since pins are disabled for this grid per user instruction
      const badgeEl = document.getElementById('defense-pins-badge');
      if (badgeEl) badgeEl.classList.add('hidden');
      const expandBar = document.getElementById('combat-defense-expand-bar');
      if (expandBar) expandBar.classList.add('hidden');
    }

    function toggleDefenseCardActive(name) {
      if (!character) return;
      const clean = (name || '').toLowerCase().trim();

      const allPins = getAllCombatPins();
      const pin = allPins.find(p => (p.name || '').toLowerCase().trim() === clean);
      if (pin) {
        pin.active = !pin.active;
      }

      if (Array.isArray(character.activeModifiers)) {
        const mod = character.activeModifiers.find(m => (m.name || '').toLowerCase().trim() === clean);
        if (mod) {
          mod.active = pin ? pin.active : !mod.active;
        }
      }

      if (clean.includes('punishing stance') && character.tomeOfBattle?.stances) {
        const stance = character.tomeOfBattle.stances.find(s => (s.name || '').toLowerCase().trim() === clean);
        if (stance) {
          stance.active = pin ? pin.active : true;
        }
      }

      if (typeof recalculateDefense === 'function') recalculateDefense();
      if (typeof recalculateOffense === 'function') recalculateOffense();
      renderDefenseModifiersGrid();
      saveStateToStorage(false);
    }

    function moveDefenseCardOrder(idx, delta, event) {
      if (event) event.stopPropagation();
      if (!character || !character.combatPins) return;
      const pins = character.combatPins.defense || [];
      const targetIdx = idx + delta;
      if (targetIdx < 0 || targetIdx >= pins.length) return;
      const temp = pins[idx];
      pins[idx] = pins[targetIdx];
      pins[targetIdx] = temp;
      renderDefenseModifiersGrid();
      saveStateToStorage(false);
    }

    function toggleExpandDefenseGrid() {
      window.combatDefenseGridExpanded = !window.combatDefenseGridExpanded;
      renderDefenseModifiersGrid();
    }

    // --- RANGED WEAPONS & AMMUNITION REPERTOIRE ENGINE ---
    function getRequiredAmmunitionType(weaponName) {
      if (!weaponName) return 'none';
      if (typeof isThrownWeapon === 'function' && isThrownWeapon(weaponName)) {
        return 'thrown';
      }
      const w = weaponName.toLowerCase();
      if (w.includes('longbow') || w.includes('shortbow') || w.includes('bow') || w.includes('composite')) {
        return 'arrow';
      }
      if (w.includes('crossbow')) {
        return 'bolt';
      }
      if (w.includes('sling')) {
        return 'bullet';
      }
      if (w.includes('blowgun')) {
        return 'needle';
      }
      return 'none';
    }

    function findAvailableRangedWeapons(char) {
      if (!char) return [];
      const list = [];
      const seen = new Set();

      function getRangedWeaponDefaultDice(item, low) {
        if (item && item.dice) return item.dice;
        const dbEntry = typeof findMasterItem === 'function' ? findMasterItem(item?.name || low) : null;
        if (dbEntry && dbEntry.dice) return dbEntry.dice;
        if (low.includes('heavy crossbow')) return '1d10';
        if (low.includes('shortbow')) return '1d6';
        if (low.includes('sling') || low.includes('dagger')) return '1d4';
        return '1d8';
      }

      function getRangedWeaponDefaultCrit(item, low) {
        if (item && item.crit) return item.crit;
        if (item && item.critMin) return `${item.critMin}-20 / x${item.critMult || 2}`;
        const dbEntry = typeof findMasterItem === 'function' ? findMasterItem(item?.name || low) : null;
        if (dbEntry && dbEntry.crit) return dbEntry.crit;
        if (dbEntry && dbEntry.critMin) return `${dbEntry.critMin}-20 / x${dbEntry.critMult || 2}`;
        if (low.includes('crossbow') || low.includes('dagger')) return '19-20 / x2';
        if (low.includes('sling')) return '20 / x2';
        return '20 / x3';
      }

      function getRangedWeaponDefaultRange(item, low) {
        if (item && item.rangeIncrement && item.rangeIncrement > 0) return `${item.rangeIncrement} ft`;
        if (item && item.range) return item.range;
        const dbEntry = typeof findMasterItem === 'function' ? findMasterItem(item?.name || low) : null;
        if (dbEntry && dbEntry.rangeIncrement) return `${dbEntry.rangeIncrement} ft`;
        if (dbEntry && dbEntry.range) return dbEntry.range;
        if (low.includes('heavy crossbow')) return '120 ft';
        if (low.includes('composite longbow')) return '110 ft';
        if (low.includes('longbow')) return '100 ft';
        if (low.includes('light crossbow')) return '80 ft';
        if (low.includes('shortbow')) return '60 ft';
        if (low.includes('sling')) return '50 ft';
        return '10 ft';
      }

      function checkAndAdd(item, source) {
        if (!item) return;
        const name = typeof item === 'string' ? item : (item.name || '');
        if (!name || name === '-' || name === 'None' || seen.has(name)) return;

        if (typeof isAmmunitionItem === 'function' && isAmmunitionItem(item)) return;
        const isRanged = typeof isRangedOrThrownWeapon === 'function' ? isRangedOrThrownWeapon(item) : true;

        if (isRanged) {
          const low = name.toLowerCase();
          seen.add(name);
          list.push({
            name: name,
            source: source,
            dice: getRangedWeaponDefaultDice(item, low),
            crit: getRangedWeaponDefaultCrit(item, low),
            range: getRangedWeaponDefaultRange(item, low),
            dmgType: low.includes('sling') ? 'Bludgeoning' : 'Piercing',
            ammoType: getRequiredAmmunitionType(name)
          });
        }
      }

      // 1. Check weapon sets
      const s1 = char.tactical?.weaponSets?.set1?.mainWeapon;
      const s2 = char.tactical?.weaponSets?.set2?.mainWeapon;
      checkAndAdd(s1, 'Equipped (Main Hand)');
      checkAndAdd(s2, 'Equipped (Off-Hand)');

      // 2. Check gearPool and inventory
      (char.gearPool || []).forEach(it => checkAndAdd(it, 'Inventory'));
      (char.inventory || []).forEach(it => checkAndAdd(it, 'Inventory'));
      (char.weapons || []).forEach(it => checkAndAdd(it, 'Weapon List'));

      // 3. Fallback removed per Rule #5 (only owned ranged weapons listed)
      return list;
    }

    function getActiveCombatRangedWeapon(char) {
      if (!char) return null;
      if (!char.tactical) char.tactical = {};
      const allRanged = findAvailableRangedWeapons(char);

      // 1. First priority: Check weapon sets Set 1 (Main Hand)
      const s1Wep = char.tactical?.weaponSets?.set1?.mainWeapon;
      if (s1Wep && s1Wep !== 'None' && s1Wep !== '-') {
        const foundInRanged = allRanged.find(w => w.name.toLowerCase().trim() === s1Wep.toLowerCase().trim());
        if (foundInRanged) {
          char.tactical.selectedRangedWeapon = foundInRanged.name;
          return foundInRanged;
        }
        if (isRangedOrThrownWeapon(s1Wep)) {
          const anyWep = findWeaponEverywhere(s1Wep);
          const low = s1Wep.toLowerCase();
          const constructed = {
            name: s1Wep,
            source: 'Equipped (Main Hand)',
            dice: anyWep?.dice || getRangedWeaponDefaultDice(anyWep, low),
            crit: anyWep?.critMin ? `${anyWep.critMin}-20/x${anyWep.critMult || 2}` : getRangedWeaponDefaultCrit(anyWep, low),
            range: anyWep?.range || getRangedWeaponDefaultRange(anyWep, low),
            dmgType: low.includes('sling') ? 'Bludgeoning' : 'Piercing',
            ammoType: getRequiredAmmunitionType(s1Wep)
          };
          char.tactical.selectedRangedWeapon = s1Wep;
          return constructed;
        }
      }

      let chosenName = char.tactical.selectedRangedWeapon;
      let matched = allRanged.find(w => w.name === chosenName);

      if (!matched) {
        matched = allRanged[0] || { name: 'Composite Longbow', source: 'SRD Standard', dice: '1d8', crit: '20 / x3', range: '100 ft', dmgType: 'Piercing', ammoType: 'arrow' };
        char.tactical.selectedRangedWeapon = matched.name;
      }
      return matched;
    }

    // --- AMMUNITION STOCK & INVENTORY SYNC ENGINE ---
    function ensureAmmunitionInventory() {
      if (!character) return;
      if (!Array.isArray(character.gearPool)) character.gearPool = [];
    }

    function getAmmunitionItemByName(chosenName) {
      if (!character || !chosenName) return null;
      ensureAmmunitionInventory();
      const allGear = [...(character.gearPool || []), ...(character.inventory || [])];
      const low = chosenName.toLowerCase().trim();

      // 1. Direct match
      let item = allGear.find(g => g && g.name && g.name.toLowerCase().trim() === low);
      if (item) return item;

      // 2. AmmoVal match (e.g. 'masterwork', 'plus1', etc.)
      item = allGear.find(g => g && g.ammoVal && g.ammoVal.toLowerCase() === low);
      if (item) return item;

      // 3. Substring match
      if (low.includes('masterwork')) return allGear.find(g => (g.name || '').toLowerCase().includes('masterwork'));
      if (low.includes('+2')) return allGear.find(g => (g.name || '').includes('+2'));
      if (low.includes('+1')) return allGear.find(g => (g.name || '').includes('+1'));
      if (low.includes('fire')) return allGear.find(g => (g.name || '').toLowerCase().includes('fire'));
      if (low.includes('silver')) return allGear.find(g => (g.name || '').toLowerCase().includes('silver'));
      if (low.includes('acid')) return allGear.find(g => (g.name || '').toLowerCase().includes('acid'));

      const activeWep = getActiveCombatRangedWeapon(character);
      const at = activeWep ? activeWep.ammoType : 'arrow';
      if (at === 'arrow') return allGear.find(g => (g.name || '').toLowerCase().includes('arrow'));
      if (at === 'bolt') return allGear.find(g => (g.name || '').toLowerCase().includes('bolt'));
      if (at === 'bullet') return allGear.find(g => (g.name || '').toLowerCase().includes('bullet') || (g.name || '').toLowerCase().includes('sling'));

      return allGear[0] || null;
    }

    function consumeEquippedAmmunition(count = 1) {
      if (window._combatOffenseMode !== 'ranged') return true;
      const arrowSel = document.getElementById('combat-ranged-arrow-select');
      const chosenName = arrowSel?.value || character.tactical?.selectedArrow || 'Standard Arrow';
      const item = getAmmunitionItemByName(chosenName);

      if (!item) {
        if (typeof showToast === 'function') {
          showToast('⚠️ Selected ammunition not found in inventory!', 'warning');
        }
        return false;
      }

      const currentQty = Number(item.qty !== undefined ? item.qty : (item.count !== undefined ? item.count : 0));
      if (currentQty <= 0) {
        if (typeof showToast === 'function') {
          showToast(`⚠️ Selected ammunition ("${item.name}") is depleted! Select another ammunition or restock in inventory.`, 'warning');
        }
        return false;
      }

      const toConsume = Math.min(currentQty, count);
      const remaining = currentQty - toConsume;
      item.qty = remaining;
      item.count = remaining;

      saveStateToStorage(false);
      populateRangedWeaponAndAmmoUI();
      updateRangedArrowDescription();
      if (typeof renderGearPoolTable === 'function') renderGearPoolTable();

      if (remaining === 0) {
        if (typeof showToast === 'function') {
          showToast(`⚠️ "${item.name}" depleted! (0 remaining)`, 'warning');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast(`🏹 Expended ${toConsume}x "${item.name}". Remaining: ${remaining}`, 'info');
        }
      }

      return true;
    }

    function populateRangedWeaponAndAmmoUI() {
      if (!character) return;
      if (!character.tactical) character.tactical = {};
      ensureAmmunitionInventory();

      const weaponSelect = document.getElementById('combat-active-ranged-weapon-select');
      const weaponIcon = document.getElementById('combat-ranged-weapon-icon');
      const ammoSelect = document.getElementById('combat-ranged-arrow-select');
      const ammoIcon = document.getElementById('combat-ammo-icon');
      const ammoTitle = document.getElementById('combat-ammo-title');

      const allRanged = findAvailableRangedWeapons(character);
      const activeWep = getActiveCombatRangedWeapon(character);

      // Populate Ranged Weapon Dropdown
      if (weaponSelect) {
        weaponSelect.innerHTML = allRanged.map(w => {
          const isSel = w.name === activeWep.name;
          const badge = w.source.includes('Inventory') || w.source.includes('Equipped') ? '🎒 ' : '';
          return `<option value="${w.name}" ${isSel ? 'selected' : ''}>${badge}${w.name} (${w.dice} • ${w.range})</option>`;
        }).join('');
      }

      if (weaponIcon) {
        const at = activeWep.ammoType;
        weaponIcon.textContent = at === 'thrown' ? '🗡️' : (at === 'bullet' ? '🪨' : '🏹');
      }

      // Determine Ammunition Type
      const ammoType = activeWep.ammoType || 'arrow';
      if (ammoIcon) {
        ammoIcon.textContent = ammoType === 'bullet' ? '🪨' : (ammoType === 'thrown' ? '🗡️' : '🏹');
      }
      if (ammoTitle) {
        if (ammoType === 'arrow') ammoTitle.textContent = 'Arrows & Ammunition (Bow)';
        else if (ammoType === 'bolt') ammoTitle.textContent = 'Crossbow Bolts';
        else if (ammoType === 'bullet') ammoTitle.textContent = 'Sling Bullets / Stones';
        else if (ammoType === 'thrown') ammoTitle.textContent = 'Thrown Weapons';
        else ammoTitle.textContent = 'Ammunition';
      }

      // Collect matching ammunitions directly from character.gearPool and character.inventory
      const allGear = [...(character.gearPool || []), ...(character.inventory || [])];
      const seenNames = new Set();
      const matchingAmmo = [];

      allGear.forEach(item => {
        if (!item || !item.name) return;
        const low = item.name.toLowerCase().trim();
        if (seenNames.has(low)) return;

        let matches = false;
        if (ammoType === 'thrown') {
          matches = (typeof isThrownWeapon === 'function' && isThrownWeapon(item)) || low.includes('thrown') || (item.tags && item.tags.includes('thrown'));
        } else if (ammoType === 'arrow') {
          const isBolt = low.includes('bolt') || item.weaponType === 'Crossbow';
          const isBullet = low.includes('bullet') || item.weaponType === 'Sling';
          matches = !isBolt && !isBullet && (low.includes('arrow') || item.weaponType === 'Bow');
        } else if (ammoType === 'bolt') {
          const isArrow = low.includes('arrow') || item.weaponType === 'Bow';
          const isBullet = low.includes('bullet') || item.weaponType === 'Sling';
          matches = !isArrow && !isBullet && (low.includes('bolt') || item.weaponType === 'Crossbow');
        } else if (ammoType === 'bullet') {
          const isArrow = low.includes('arrow') || item.weaponType === 'Bow';
          const isBolt = low.includes('bolt') || item.weaponType === 'Crossbow';
          matches = !isArrow && !isBolt && (low.includes('bullet') || low.includes('sling') || low.includes('stone') || item.weaponType === 'Sling');
        }

        // Exclude weapons from ammo list unless it is a thrown weapon for thrown mode
        if (item.category === 'Weapon' && ammoType !== 'thrown') {
          matches = false;
        }

        if (matches) {
          seenNames.add(low);
          matchingAmmo.push(item);
        }
      });

      if (ammoSelect) {
        let curSel = character.tactical.selectedArrow;
        if (!curSel || !matchingAmmo.some(a => a.name === curSel || a.ammoVal === curSel)) {
          curSel = matchingAmmo[0]?.name || 'Standard Arrow';
          character.tactical.selectedArrow = curSel;
        }

        ammoSelect.innerHTML = matchingAmmo.map(item => {
          const qty = Number(item.qty !== undefined ? item.qty : (item.count !== undefined ? item.count : 0));
          const isSelected = (curSel === item.name || curSel === item.ammoVal || curSel === `inv_${item.name}`);
          const isDepleted = qty <= 0;
          const icon = isDepleted ? '⚠️' : '🏹';
          return `<option value="${item.name}" ${isSelected ? 'selected' : ''} ${isDepleted ? 'class="text-rose-400 font-bold"' : ''}>${icon} ${item.name}</option>`;
        }).join('');
      }

      updateRangedArrowDescription();
    }

    function updateRangedArrowDescription() {
      const arrowSel = document.getElementById('combat-ranged-arrow-select');
      const qtyBadge = document.getElementById('combat-ammo-qty-badge');
      if (!arrowSel) return;
      const chosenName = arrowSel.value || character.tactical?.selectedArrow || 'Standard Arrow';
      const item = getAmmunitionItemByName(chosenName);
      const qty = item ? Number(item.qty !== undefined ? item.qty : (item.count !== undefined ? item.count : 0)) : 0;

      if (qtyBadge) {
        if (qty <= 0) {
          qtyBadge.className = 'shrink-0 font-mono font-bold text-xs px-2.5 py-1 rounded bg-rose-950/60 border border-rose-500/60 text-rose-300 whitespace-nowrap shadow-sm';
          qtyBadge.textContent = '0 Left';
          qtyBadge.title = 'Ammunition depleted!';
        } else {
          qtyBadge.className = 'shrink-0 font-mono font-bold text-xs px-2.5 py-1 rounded bg-slate-950 border border-amber-500/40 text-emerald-400 whitespace-nowrap shadow-sm';
          qtyBadge.textContent = `${qty} Left`;
          qtyBadge.title = `Remaining: ${qty}`;
        }
      }
    }

    function onRangedArrowChange() {
      const arrowSel = document.getElementById('combat-ranged-arrow-select');
      if (!arrowSel) return;
      if (!character.tactical) character.tactical = {};
      character.tactical.selectedArrow = arrowSel.value;
      updateRangedArrowDescription();
      recalculateOffense();
      saveStateToStorage(false);
    }

    function selectCombatAmmoPin(ammoName, explicitVal) {
      if (!character) return;
      if (!character.tactical) character.tactical = {};

      const val = explicitVal || ammoName;
      character.tactical.selectedArrow = val;

      const arrowSel = document.getElementById('combat-ranged-arrow-select');
      if (arrowSel) {
        if (Array.from(arrowSel.options).some(o => o.value === val)) {
          arrowSel.value = val;
        }
      }

      updateRangedArrowDescription();
      recalculateOffense();
      saveStateToStorage(false);

      showDiceTopToast({
        icon: '🏹',
        title: 'Ammunition Equipped: ' + ammoName,
        breakdown: 'Active ammunition updated for ranged attacks.',
        total: 'Equipped'
      });
    }

    function getAmmoValFromName(name) {
      if (!name) return 'standard';
      const low = name.toLowerCase();
      if (low.includes('masterwork')) return 'masterwork';
      if (low.includes('+2')) return 'plus2';
      if (low.includes('+1')) return 'plus1';
      if (low.includes('fire')) return 'fire';
      if (low.includes('acid')) return 'acid';
      if (low.includes('shock')) return 'shock';
      if (low.includes('silver')) return 'silver';
      if (low.includes('cold iron')) return 'cold_iron';
      if (low.includes('adamantine')) return 'adamantine';
      if (low.includes('blunt')) return 'blunt';
      if (low.includes('stone')) return 'stone';
      return name;
    }

    function onCombatRangedWeaponChange() {
      const weaponSelect = document.getElementById('combat-active-ranged-weapon-select');
      if (!weaponSelect) return;
      if (!character.tactical) character.tactical = {};
      character.tactical.selectedRangedWeapon = weaponSelect.value;
      character.tactical.selectedArrow = 'Standard Arrow';
      populateRangedWeaponAndAmmoUI();
      recalculateOffense();
      saveStateToStorage(false);
    }

    // --- RANGED COMBAT & TACTICAL MODIFIERS ENGINE (AREA 2) ---
    function renderRangedModifiersGrid() {
      const grid = document.getElementById('combat-modifiers-ranged-3x3-grid');
      if (!grid) return;

      if (!character.tactical) character.tactical = {};
      const t = character.tactical;

      const hasPBS = characterHasFeat(character, 'Point Blank');
      const hasRapid = characterHasFeat(character, 'Rapid Shot');
      const hasMany = characterHasFeat(character, 'Manyshot');
      const hasPrecise = characterHasFeat(character, 'Precise Shot');
      const hasFar = characterHasFeat(character, 'Far Shot');
      const hasTrueStrike = characterHasSpell(character, 'True Strike');
      const hasBootsHaste = characterHasItem(character, 'Boots of Speed') || characterHasBuff(character, 'Haste');
      const hasWitchlight = characterHasItem(character, 'Witchlight');
      const hasSneak = characterHasSneakAttack(character);
      const hasEnhanceArrow = (character.specialAbilities || []).some(a => {
        const name = typeof a === 'string' ? a : (a.name || '');
        return name.toLowerCase().includes('enhance arrow');
      });

      const hg = !!t.rangedHigherGround;
      const tinM = !!t.targetInMelee;
      const cvr = !!t.coverPenalty;

      // Base Situational Cards: Rules every ranged combatant can use (Glow Card Toggle)
      const baseCardsHtml = [
        `
        <div onclick="onRangedModifierToggle('rangedHigherGround')" class="relative ${hg ? 'border border-amber-500 bg-amber-950/60 text-white shadow-md shadow-amber-950/50 ring-1 ring-amber-500/40' : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-amber-500/60'} rounded-lg p-2 cursor-pointer transition flex flex-col justify-center items-center text-center select-none min-h-[64px]">
          <div class="text-[11px] font-bold ${hg ? 'text-white font-black' : 'text-amber-400'} leading-tight">Higher Gr.</div>
          <div class="text-[9px] ${hg ? 'text-amber-200 font-bold' : 'text-slate-400'} mt-1">+1 Ranged</div>
        </div>
        `,
        `
        <div onclick="onRangedModifierToggle('targetInMelee')" class="relative ${tinM ? 'border border-rose-500 bg-rose-950/60 text-white shadow-md shadow-rose-950/50 ring-1 ring-rose-500/40' : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-rose-500/60'} rounded-lg p-2 cursor-pointer transition flex flex-col justify-center items-center text-center select-none min-h-[64px]">
          <div class="text-[11px] font-bold ${tinM ? 'text-white font-black' : 'text-rose-400'} leading-tight">Firing into Melee</div>
          <div class="text-[9px] ${tinM ? 'text-rose-200 font-bold' : 'text-slate-400'} mt-1">${hasPrecise ? '⚡ No Penalty (Precise)' : '-4 Atk (Melee)'}</div>
        </div>
        `,
        `
        <div onclick="onRangedModifierToggle('coverPenalty')" class="relative ${cvr ? 'border border-slate-400 bg-slate-800/80 text-white shadow-md shadow-slate-900/50 ring-1 ring-slate-400/40' : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-500/60'} rounded-lg p-2 cursor-pointer transition flex flex-col justify-center items-center text-center select-none min-h-[64px]">
          <div class="text-[11px] font-bold ${cvr ? 'text-white font-black' : 'text-slate-300'} leading-tight">Target in Cover</div>
          <div class="text-[9px] ${cvr ? 'text-slate-100 font-bold' : 'text-slate-400'} mt-1">-4 Atk (Cover)</div>
        </div>
        `
      ];

      // Sync Ranged Reorder Toggle UI
      const rangedBtn = document.getElementById('btn-ranged-reorder-toggle');
      const rangedBtnText = document.getElementById('ranged-reorder-btn-text');
      if (rangedBtnText) rangedBtnText.textContent = window.rangedReorderModeActive ? 'Done ✓' : 'Reorder';
      if (rangedBtn) {
        if (window.rangedReorderModeActive) {
          rangedBtn.className = 'text-[9px] text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 font-bold flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded border border-emerald-600 transition';
        } else {
          rangedBtn.className = 'text-[9px] text-amber-400 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 transition';
        }
      }

      // Qualified Ranged Modifiers Pool: Feats, Abilities, Spells & Pinned items
      const qualifiedRangedList = getQualifiedRangedModifiersList();

      const isExpanded = !!window.combatRangedModifiersGridExpanded;
      const visibleCount = isExpanded ? qualifiedRangedList.length : Math.min(6, qualifiedRangedList.length);
      const visibleMods = qualifiedRangedList.slice(0, visibleCount);

      const dynamicCardsHtml = visibleMods.map((mod, idx) => {
        const reorderControls = window.rangedReorderModeActive ? `
          <div class="flex items-center justify-between px-0.5 text-[9px] text-slate-500 leading-none shrink-0 w-full" onclick="event.stopPropagation()">
            <button type="button" onclick="moveRangedModifierOrder(${idx}, -1, event)" class="hover:text-amber-400 p-0.5 disabled:opacity-20 cursor-pointer" ${idx <= 0 ? 'disabled' : ''} title="Move Left">◀</button>
            <span class="text-[8px] text-slate-400 font-mono truncate max-w-[45px]">${mod.source}</span>
            <button type="button" onclick="moveRangedModifierOrder(${idx}, 1, event)" class="hover:text-amber-400 p-0.5 disabled:opacity-20 cursor-pointer" ${idx >= qualifiedRangedList.length - 1 ? 'disabled' : ''} title="Move Right">▶</button>
          </div>
        ` : `
          <div class="flex items-center justify-center px-0.5 text-[9px] leading-none shrink-0 w-full">
            <span class="text-[8px] font-mono ${mod.active ? 'text-amber-400 font-bold' : 'text-slate-500'} truncate max-w-[75px]">${mod.source}</span>
          </div>
        `;

        const activeBorder = 'border border-amber-500 bg-amber-950/60 text-white shadow-md shadow-amber-950/50 ring-1 ring-amber-500/40';

        return `
        <div onclick="onRangedModifierToggle('${mod.id}')" class="relative ${mod.active ? activeBorder : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-amber-500/60'} rounded-lg p-1.5 transition flex flex-col justify-between text-center select-none min-h-[64px] group cursor-pointer">
          ${reorderControls}

          <div class="flex-1 flex flex-col justify-center items-center px-0.5 my-auto">
            <div class="text-[10px] font-bold ${mod.active ? 'text-white font-extrabold' : 'text-slate-200'} leading-tight truncate w-full">${mod.name}</div>
            <div class="text-[9px] ${mod.active ? 'text-amber-300 font-bold' : 'text-amber-400'} font-mono mt-1">${mod.bonusStr}</div>
          </div>
        </div>
        `;
      });

      grid.innerHTML = baseCardsHtml.join('') + dynamicCardsHtml.join('');

      // Show/hide expand button if dynamic mods > 6
      const expandBar = document.getElementById('combat-modifiers-ranged-expand-bar');
      const expandBtn = document.getElementById('btn-toggle-expand-ranged-mods');
      if (expandBar && expandBtn) {
        if (qualifiedRangedList.length > 6) {
          expandBar.classList.remove('hidden');
          expandBtn.innerHTML = isExpanded 
            ? '<span>▴ Show Less (Collapse 3x3)</span>' 
            : `<span>▾ Show More (+${qualifiedRangedList.length - 6} Modifiers)</span>`;
        } else {
          expandBar.classList.add('hidden');
        }
      }

      populateRangedWeaponAndAmmoUI();
    }

    function onRangedModifierToggle(modKey) {
      if (!character.tactical) character.tactical = {};
      if (modKey.startsWith('pin_')) {
        const pinName = modKey.replace('pin_', '');
        const allPins = getAllCombatPins();
        const pin = allPins.find(p => p.name === pinName);
        if (pin) {
          pin.active = !pin.active;
        }
      } else {
        character.tactical[modKey] = !character.tactical[modKey];
      }
      renderRangedModifiersGrid();
      recalculateOffense();
      if (typeof renderWeaponSetsUI === 'function') {
        try { renderWeaponSetsUI(); } catch (e) {}
      }
      saveStateToStorage(false);
    }

    function toggleExpandRangedModifiersGrid() {
      window.combatRangedModifiersGridExpanded = !window.combatRangedModifiersGridExpanded;
      renderRangedModifiersGrid();
    }

    function toggleFixedMeleeModifier(key) {
      if (!character) return;
      if (!character.tactical) character.tactical = {};
      character.tactical[key] = !character.tactical[key];
      recalculateOffense();
      renderOffenseModifiersGrid();
      renderHUD();
      if (typeof renderCombatCockpit === 'function') renderCombatCockpit();
      saveStateToStorage(false);
    }

    function toggleDefensiveCastingModifier() {
      if (!character) return;
      if (!character.tactical) character.tactical = {};
      character.tactical.defensiveCastingActive = !character.tactical.defensiveCastingActive;
      saveStateToStorage(false);
      renderSpellTacticalModifiers();
      if (typeof recalculateCombatSpell === 'function') recalculateCombatSpell();
    }

    function onFixedModifierToggle() {
      recalculateOffense();
      renderOffenseModifiersGrid();
      renderHUD();
      if (typeof renderCombatCockpit === 'function') renderCombatCockpit();
      saveStateToStorage(false);
    }

    function getMeleeDynamicModifiers() {
      if (!character || !character.activeModifiers) return [];
      return (character.activeModifiers || []).filter(m => {
        if (!m || !m.name) return false;
        if (m.name.includes('TWF')) return false;
        if (m.combatScope === 'ranged' || m.scope === 'Ranged Only') return false;
        const n = m.name.toLowerCase();
        if (n.includes('acid arrow') || n.includes('fireball') || n.includes('scorching ray') || n.includes('magic missile') || n.includes('ray of frost') || n.includes('disintegrate')) return false;
        if (n.includes('arrow') && !n.includes('enhance arrow') && !n.includes('blade of blood')) return false;
        const dbEntry = typeof findMasterItem === 'function' ? findMasterItem(m.name) : null;
        if (dbEntry) {
          if (['ranged_touch', 'melee_touch', 'spell_auto', 'saving_throw', 'ammunition', 'weapon', 'shield'].includes(dbEntry.attackType)) {
            return false;
          }
          if (dbEntry.combatScope === 'ranged' || dbEntry.scope === 'Ranged Only') return false;
        }
        return (m.combatScope === 'melee' || m.combatScope === 'both' || !m.combatScope);
      });
    }

    function toggleMeleeReorderMode() {
      window.meleeReorderModeActive = !window.meleeReorderModeActive;
      const btnText = document.getElementById('melee-reorder-btn-text');
      const btn = document.getElementById('btn-melee-reorder-toggle');
      if (btnText) btnText.textContent = window.meleeReorderModeActive ? 'Done ✓' : 'Reorder';
      if (btn) {
        if (window.meleeReorderModeActive) {
          btn.className = 'text-[9px] text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 font-bold flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded border border-emerald-600 transition';
        } else {
          btn.className = 'text-[9px] text-amber-400 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 transition';
        }
      }
      renderOffenseModifiersGrid();
    }

    function moveMeleeModifierOrder(idx, delta, event) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (!character || !character.activeModifiers) return;

      const dynamicMods = getMeleeDynamicModifiers();
      const currentMod = dynamicMods[idx];
      const targetMod = dynamicMods[idx + delta];
      if (!currentMod || !targetMod) return;

      const idxA = character.activeModifiers.indexOf(currentMod);
      const idxB = character.activeModifiers.indexOf(targetMod);
      if (idxA === -1 || idxB === -1) return;

      const temp = character.activeModifiers[idxA];
      character.activeModifiers[idxA] = character.activeModifiers[idxB];
      character.activeModifiers[idxB] = temp;

      saveStateToStorage(true);
      renderOffenseModifiersGrid();
    }

    function getQualifiedRangedModifiersList() {
      if (!character) return [];
      if (!character.tactical) character.tactical = {};
      const t = character.tactical;
      const featsList = character.feats || [];
      const hasPBS = featsList.some(f => {
        const n = (typeof f === 'string' ? f : f.name || '').toLowerCase();
        return n.includes('point blank') || (Array.isArray(f.tags) && f.tags.includes('point blank'));
      });
      const hasFar = featsList.some(f => {
        const n = (typeof f === 'string' ? f : f.name || '').toLowerCase();
        return n.includes('far shot') || (Array.isArray(f.tags) && f.tags.includes('far shot'));
      });
      const hasRapid = featsList.some(f => {
        const n = (typeof f === 'string' ? f : f.name || '').toLowerCase();
        return n.includes('rapid shot') || (Array.isArray(f.tags) && f.tags.includes('rapid shot'));
      });
      const hasMany = featsList.some(f => {
        const n = (typeof f === 'string' ? f : f.name || '').toLowerCase();
        return n.includes('manyshot') || (Array.isArray(f.tags) && f.tags.includes('manyshot'));
      });

      const specials = (character.specialAbilities || []).concat(character.classFeatures || []);
      const hasEnhanceArrow = specials.some(s => {
        const n = (typeof s === 'string' ? s : s.name || '').toLowerCase();
        return n.includes('enhance arrow') || (Array.isArray(s.tags) && s.tags.includes('enhance arrow'));
      });
      const hasSneak = specials.some(s => {
        const n = (typeof s === 'string' ? s : s.name || '').toLowerCase();
        return n.includes('sneak attack') || (Array.isArray(s.tags) && s.tags.includes('sneak attack'));
      });

      const knownSpells = character.spellcasting?.knownSpells || [];
      const hasTrueStrike = knownSpells.some(s => {
        const n = (typeof s === 'string' ? s : s.name || '').toLowerCase();
        return n.includes('true strike') || (Array.isArray(s.tags) && s.tags.includes('true strike'));
      });

      const inv = (character.inventory || []).concat(character.gearPool || []);
      const hasBootsHaste = inv.some(i => {
        const n = (typeof i === 'string' ? i : i.name || '').toLowerCase();
        const tags = Array.isArray(i.tags) ? i.tags.map(t => String(t).toLowerCase()) : [];
        return tags.includes('haste') || tags.includes('speed') || n.includes('boots of speed') || n.includes('haste');
      });
      const hasWitchlight = inv.some(i => {
        const n = (typeof i === 'string' ? i : i.name || '').toLowerCase();
        const tags = Array.isArray(i.tags) ? i.tags.map(t => String(t).toLowerCase()) : [];
        return tags.includes('witchlight') || n.includes('witchlight');
      });

      const qualifiedRangedList = [];

      if (hasPBS) {
        const dbPBS = typeof findMasterItem === 'function' ? findMasterItem('Point Blank Shot') : null;
        const pbsAtk = Number(dbPBS?.attBonus ?? 1);
        const pbsDmg = Number(dbPBS?.dmgBonus ?? 1);
        qualifiedRangedList.push({
          id: 'pointBlankShot',
          name: 'Point Blank',
          source: 'Feat',
          bonusStr: `+${pbsAtk} Atk / +${pbsDmg} Dmg`,
          bonusAtk: pbsAtk,
          bonusDmg: pbsDmg,
          bonusType: dbPBS?.bonusType || 'untyped',
          combatScope: 'ranged',
          active: !!t.pointBlankShot,
          activeClass: 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-sm'
        });
      }

      // Situational: Range Increment (Distance penalty)
      qualifiedRangedList.push({
        id: 'rangePenalty',
        name: 'Range Increment',
        source: 'Distance',
        bonusStr: hasFar ? '-1 Atk (Far Shot)' : '-2 Atk / Increment',
        bonusAtk: hasFar ? -1 : -2,
        bonusDmg: 0,
        bonusType: 'penalty',
        combatScope: 'ranged',
        active: !!t.rangePenalty,
        activeClass: 'border-orange-500 bg-orange-950/40 text-orange-200 shadow-sm'
      });

      if (hasRapid) {
        qualifiedRangedList.push({
          id: 'rapidShot',
          name: 'Rapid Shot',
          source: 'Feat',
          bonusStr: '-2 Atk / +1 Shot',
          bonusAtk: -2,
          bonusDmg: 0,
          bonusType: 'penalty',
          combatScope: 'ranged',
          active: !!t.rapidShot,
          activeClass: 'border-rose-500 bg-rose-950/40 text-rose-200 shadow-sm'
        });
      }

      if (hasMany) {
        qualifiedRangedList.push({
          id: 'manyshot',
          name: 'Manyshot',
          source: 'Feat',
          bonusStr: '-4 Atk / 2x Arrows',
          bonusAtk: -4,
          bonusDmg: 0,
          bonusType: 'penalty',
          combatScope: 'ranged',
          active: !!t.manyshot,
          activeClass: 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-sm'
        });
      }

      if (hasEnhanceArrow) {
        const eaObj = specials.find(s => (s.name || '').toLowerCase().includes('enhance arrow'));
        const dbEA = typeof findMasterItem === 'function' ? findMasterItem('Enhance Arrow +1 (Su)') : null;
        const eaAtk = Number(eaObj?.attBonus ?? dbEA?.attBonus ?? 1);
        const eaDmg = Number(eaObj?.dmgBonus ?? dbEA?.dmgBonus ?? 1);
        const eaType = eaObj?.bonusType || dbEA?.bonusType || 'enhancement';

        qualifiedRangedList.push({
          id: 'enhanceArrow',
          name: 'Enhance Arrow',
          source: 'Ability',
          bonusStr: `+${eaAtk} Atk / +${eaDmg} Dmg`,
          bonusAtk: eaAtk,
          bonusDmg: eaDmg,
          bonusType: eaType,
          combatScope: 'ranged',
          active: !!t.enhanceArrow,
          activeClass: 'border-emerald-500 bg-emerald-950/40 text-emerald-200 shadow-sm'
        });
      }

      if (hasTrueStrike) {
        qualifiedRangedList.push({
          id: 'trueStrike',
          name: 'True Strike',
          source: 'Spell',
          bonusStr: '+20 Atk',
          bonusAtk: 20,
          bonusDmg: 0,
          bonusType: 'insight',
          combatScope: 'ranged',
          active: !!t.trueStrike,
          activeClass: 'border-sky-500 bg-sky-950/40 text-sky-200 shadow-sm'
        });
      }

      if (hasSneak) {
        const dbSA = typeof findMasterItem === 'function' ? findMasterItem('Sneak Attack') : null;
        const saPart = Array.isArray(dbSA?.damageParts) && dbSA.damageParts[0] ? dbSA.damageParts[0].dice : null;
        const saDice = saPart || dbSA?.dice || '1d6';
        qualifiedRangedList.push({
          id: 'sneakAttack',
          name: 'Sneak Attack',
          source: 'Precision',
          bonusStr: `+${saDice} Damage`,
          bonusAtk: 0,
          bonusDmg: 0,
          dice: saDice,
          bonusType: 'precision',
          combatScope: 'ranged',
          active: !!t.sneakAttack,
          activeClass: 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-sm'
        });
      }

      if (hasBootsHaste) {
        qualifiedRangedList.push({
          id: 'bootsHaste',
          name: 'Boots (Haste)',
          source: 'Item',
          bonusStr: '+1 Atk / Extra Shot',
          bonusAtk: 1,
          bonusDmg: 0,
          bonusType: 'untyped',
          combatScope: 'ranged',
          active: !!t.bootsHaste,
          activeClass: 'border-purple-500 bg-purple-950/40 text-purple-200 shadow-sm'
        });
      }

      if (hasWitchlight) {
        qualifiedRangedList.push({
          id: 'witchlightSpeed',
          name: 'Witchlight Speed',
          source: 'Item',
          bonusStr: '+20 ft Speed',
          bonusAtk: 0,
          bonusDmg: 0,
          bonusType: 'untyped',
          combatScope: 'ranged',
          active: !!t.witchlightSpeed,
          activeClass: 'border-indigo-500 bg-indigo-950/40 text-indigo-200 shadow-sm'
        });
      }

      // Also include any pinned items in offense_ranged (excluding ammunitions)
      if (typeof getPinsForDrawer === 'function') {
        const rangedPins = getPinsForDrawer('offense_ranged');
        rangedPins.forEach(pin => {
          if (!pin || !pin.name) return;
          const pNameLower = pin.name.toLowerCase().trim();
          if (pNameLower.includes('arrow') || pNameLower.includes('bolt') || pNameLower.includes('bullet') || pin.sourceType === 'Ammunition' || pin.attackType === 'ammunition') {
            return;
          }
          if (qualifiedRangedList.some(q => q.name.toLowerCase().trim() === pNameLower)) return;

          const dbEntry = typeof findMasterItem === 'function' ? findMasterItem(pin.name) : null;
          const dbPartDice = (Array.isArray(dbEntry?.damageParts) && dbEntry.damageParts[0]?.dice) || '';
          qualifiedRangedList.push({
            id: `pin_${pin.name}`,
            pinRef: pin,
            name: pin.name,
            source: pin.sourceType || dbEntry?.type || 'Pin',
            bonusStr: pin.badge || dbEntry?.benefit || '+ Pin',
            bonusAtk: Number(dbEntry?.attBonus ?? pin.bonusAtk ?? 0),
            bonusDmg: Number(dbEntry?.dmgBonus ?? pin.bonusDmg ?? 0),
            dice: dbPartDice || dbEntry?.dice || pin.dice || '',
            bonusType: dbEntry?.bonusType || pin.bonusType || 'untyped',
            combatScope: 'ranged',
            active: Boolean(pin.active),
            activeClass: 'border-sky-500 bg-sky-950/40 text-sky-200 shadow-sm'
          });
        });
      }

      // Apply Custom Order Sort
      if (Array.isArray(character.tactical?.rangedModifierOrder) && character.tactical.rangedModifierOrder.length > 0) {
        const orderMap = character.tactical.rangedModifierOrder;
        qualifiedRangedList.sort((a, b) => {
          const idxA = orderMap.indexOf(a.id);
          const idxB = orderMap.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });
      }

      return qualifiedRangedList;
    }

    function toggleRangedReorderMode() {
      window.rangedReorderModeActive = !window.rangedReorderModeActive;
      const btnText = document.getElementById('ranged-reorder-btn-text');
      const btn = document.getElementById('btn-ranged-reorder-toggle');
      if (btnText) btnText.textContent = window.rangedReorderModeActive ? 'Done ✓' : 'Reorder';
      if (btn) {
        if (window.rangedReorderModeActive) {
          btn.className = 'text-[9px] text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 font-bold flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded border border-emerald-600 transition';
        } else {
          btn.className = 'text-[9px] text-amber-400 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 transition';
        }
      }
      renderRangedModifiersGrid();
    }

    function moveRangedModifierOrder(idx, delta, event) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (!character) return;
      if (!character.tactical) character.tactical = {};

      const list = getQualifiedRangedModifiersList();
      const targetIdx = idx + delta;
      if (idx < 0 || idx >= list.length || targetIdx < 0 || targetIdx >= list.length) return;

      const orderList = list.map(m => m.id);
      const item = orderList.splice(idx, 1)[0];
      orderList.splice(targetIdx, 0, item);

      character.tactical.rangedModifierOrder = orderList;
      saveStateToStorage(false);
      renderRangedModifiersGrid();
    }

    function moveModifierOrder(idx, delta, event) {
      moveMeleeModifierOrder(idx, delta, event);
    }

    function getResolvedOffHandWeapon(character) {
      const currentOffHandName = character.activeOffHand;
      if (!currentOffHandName || currentOffHandName === 'None') {
        return null;
      }

      const fromWeps = (character.weapons || []).find(w => w.name === currentOffHandName);
      if (fromWeps) return { ...fromWeps, grip: 'Off-Hand' };

      const offHandItem = character.bodySlots?.offHand;
      if (offHandItem && offHandItem.name === currentOffHandName) {
        const isShield = offHandItem.category === 'Shield' || (offHandItem.desc && offHandItem.desc.toLowerCase().includes('shield'));
        const isHeavy = (offHandItem.name || '').toLowerCase().includes('heavy');
        const isBuckler = (offHandItem.name || '').toLowerCase().includes('buckler');
        return {
          name: offHandItem.name + (isShield ? ' (Shield Bash)' : ''),
          grip: 'Off-Hand',
          dice: isShield ? (isHeavy ? '1d4' : (isBuckler ? '1d3' : '1d3')) : (offHandItem.dice || '1d4'),
          critMin: 20,
          critMult: 2,
          attBonus: offHandItem.attBonus || 0,
          dmgBonus: offHandItem.dmgBonus || 0,
          dmgType: isShield ? 'Bludgeoning' : (offHandItem.dmgType || 'Piercing'),
          isLight: !isHeavy,
          isBuckler,
          tags: ['off-hand', isShield ? 'shield-bash' : 'light']
        };
      }

      const everywhere = findWeaponEverywhere(currentOffHandName);
      if (everywhere) {
        return { ...everywhere, grip: 'Off-Hand' };
      }

      return null;
    }

    function computeCombatAttackChain(character) {
      if (window._combatOffenseMode === 'ranged') {
        const bab = Number(character.bab) || 0;
        const dexMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.dex || 10) : 3;
        const strMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.str || 10) : 0;
        const t = character.tactical || {};

        const activeRangedWep = getActiveCombatRangedWeapon(character);
        const at = activeRangedWep.ammoType || 'arrow';

        const hasPBS = characterHasFeat(character, 'Point Blank');
        const hasRapid = characterHasFeat(character, 'Rapid Shot');
        const hasMany = characterHasFeat(character, 'Manyshot');
        const hasPrecise = characterHasFeat(character, 'Precise Shot');
        const hasTrue = characterHasSpell(character, 'True Strike');
        const hasHaste = characterHasItem(character, 'Boots of Speed') || characterHasBuff(character, 'Haste');
        const hasSneak = characterHasSneakAttack(character);

        let arrowAtk = 0;
        let arrowDmgBonus = 0;
        let arrowExtraDice = '';
        let arrowType = activeRangedWep.dmgType || 'Piercing';
        const selArrow = t.selectedArrow || 'standard';

        if (selArrow === 'masterwork') {
          arrowAtk = 1;
        } else if (selArrow === 'plus1') {
          arrowAtk = 1;
          arrowDmgBonus = 1;
        } else if (selArrow === 'plus2') {
          arrowAtk = 2;
          arrowDmgBonus = 2;
        } else if (selArrow === 'silver') {
          arrowDmgBonus = -1;
        } else if (selArrow === 'stone') {
          arrowAtk = -1;
        } else if (selArrow === 'fire') {
          arrowExtraDice = '1d6';
        } else if (selArrow === 'acid') {
          arrowExtraDice = '1d6';
        } else if (selArrow === 'shock') {
          arrowExtraDice = '1d6';
        } else if (selArrow === 'blunt') {
          arrowType = 'Bludgeoning';
        }

        let netRangedMod = 0;
        if (t.rangedHigherGround) netRangedMod += 1;
        if (t.targetInMelee && !hasPrecise) netRangedMod -= 4;
        if (t.coverPenalty) netRangedMod -= 4;

        let flatDmg = arrowDmgBonus;

        const qualifiedRanged = typeof getQualifiedRangedModifiersList === 'function' ? getQualifiedRangedModifiersList() : [];
        qualifiedRanged.forEach(m => {
          if (m && m.active) {
            if (m.bonusAtk) netRangedMod += Number(m.bonusAtk);
            if (m.bonusDmg) flatDmg += Number(m.bonusDmg);
            if (m.dice) arrowExtraDice = arrowExtraDice ? `${arrowExtraDice} + ${m.dice}` : m.dice;
          }
        });
        if (at === 'thrown' && strMod > 0) flatDmg += strMod;

        let rawDice = activeRangedWep.dice || '1d8';
        if (selArrow === 'stone' && at === 'bullet') rawDice = '1d3';

        let baseDice = rawDice;
        if (t.manyshot && hasMany) {
          if (rawDice === '1d8') baseDice = '2d8';
          else if (rawDice === '1d6') baseDice = '2d6';
          else if (rawDice === '1d10') baseDice = '2d10';
          else if (rawDice === '1d4') baseDice = '2d4';
        }

        const critStr = (typeof activeRangedWep?.crit === 'string')
          ? activeRangedWep.crit
          : (activeRangedWep?.critMin ? `${activeRangedWep.critMin}-20 / x${activeRangedWep.critMult || 2}` : '20 / x3');
        let critMin = activeRangedWep?.critMin || 20;
        let critMult = activeRangedWep?.critMult || 3;
        if (critStr.includes('19-20')) {
          critMin = 19;
          critMult = 2;
        } else if (critStr.includes('x2')) {
          critMin = 20;
          critMult = 2;
        }

        const rangedEval = {
          critMin: critMin,
          critMult: critMult,
          chargeMultiplier: 1,
          baseDice: baseDice,
          netFlatDamage: flatDmg,
          chargeFlatDamage: flatDmg,
          damageType: arrowType,
          extraDice: arrowExtraDice
        };

        const firstAtk = bab + dexMod + arrowAtk + netRangedMod;
        const chain = [
          {
            id: 'ranged-1',
            label: 'Shot 1',
            hand: 'ranged',
            handLabel: 'Ranged',
            weapon: { name: activeRangedWep.name, dice: baseDice },
            bonus: firstAtk,
            evalResult: rangedEval,
            isMain: true,
            badgeColor: 'amber'
          }
        ];

        if (bab >= 6) {
          chain.push({
            id: 'ranged-2',
            label: 'Shot 2',
            hand: 'ranged',
            handLabel: 'Ranged',
            weapon: { name: activeRangedWep.name, dice: baseDice },
            bonus: firstAtk - 5,
            evalResult: rangedEval,
            isMain: true,
            badgeColor: 'amber'
          });
        }

        if (bab >= 11) {
          chain.push({
            id: 'ranged-3',
            label: 'Shot 3',
            hand: 'ranged',
            handLabel: 'Ranged',
            weapon: { name: activeRangedWep.name, dice: baseDice },
            bonus: firstAtk - 10,
            evalResult: rangedEval,
            isMain: true,
            badgeColor: 'amber'
          });
        }

        if (bab >= 16) {
          chain.push({
            id: 'ranged-4',
            label: 'Shot 4',
            hand: 'ranged',
            handLabel: 'Ranged',
            weapon: { name: activeRangedWep.name, dice: baseDice },
            bonus: firstAtk - 15,
            evalResult: rangedEval,
            isMain: true,
            badgeColor: 'amber'
          });
        }

        if (t.rapidShot && hasRapid) {
          chain.push({
            id: 'ranged-rapid',
            label: 'Rapid Shot',
            hand: 'ranged',
            handLabel: 'Extra Shot',
            weapon: { name: activeRangedWep.name, dice: baseDice },
            bonus: firstAtk,
            evalResult: rangedEval,
            isMain: false,
            badgeColor: 'cyan'
          });
        }

        if (t.bootsHaste && hasHaste) {
          chain.push({
            id: 'ranged-haste',
            label: 'Haste Shot',
            hand: 'ranged',
            handLabel: 'Extra Shot',
            weapon: { name: activeRangedWep.name, dice: baseDice },
            bonus: firstAtk,
            evalResult: rangedEval,
            isMain: false,
            badgeColor: 'purple'
          });
        }

        return chain;
      }

      const wepName = character.activeWeapon || character.tactical?.weaponSets?.set1?.mainWeapon || 'Unarmed Strike';
      const wep = (character.weapons || []).find(w => w && w.name === wepName) || findWeaponEverywhere(wepName) || { name: 'Unarmed Strike', dice: '1d3', critMin: 20, critMult: 2, dmgType: 'Bludgeoning', isLight: true };
      if (!wep) return [];

      const isTwoHand = RuleEngine.isTwoHandedWeapon(wep);
      const hasOversizedWeaponFeat = RuleEngine ? RuleEngine.hasOversizedWeaponFeat(character) : false;
      const effectiveTwoHand = isTwoHand && !hasOversizedWeaponFeat;
      const gripSelect = document.getElementById('active-grip-select');
      const grip = (effectiveTwoHand ? '2-Hand' : (gripSelect?.value || '1-Hand'));
      const paVal = parseInt(document.getElementById('power-attack-val')?.value) || 0;
      const flanking = document.getElementById('mod-flanking')?.checked ?? false;
      const charge = document.getElementById('mod-charge')?.checked ?? false;
      const hg = document.getElementById('mod-higher-ground') ? document.getElementById('mod-higher-ground').checked : (character.tactical?.higherGround ?? false);

      const activeMods = (character.activeModifiers || []).filter(m => m && m.active);
      const sets = character.tactical?.weaponSets;
      const isDualFromSets = sets && Array.isArray(sets.activeSets) && sets.activeSets.includes(1) && sets.activeSets.includes(2);
      const offHandWep = getResolvedOffHandWeapon(character);
      const hasOffHandWeapon = !!(offHandWep && offHandWep.name && offHandWep.name !== 'None' && !offHandWep.isBuckler && offHandWep.dmgType !== 'Shield');

      // Rule 2: If main hand is two-handed and there is no oversized weapon feat, TWF cannot be active
      const isTWF = !effectiveTwoHand && ((isDualFromSets && hasOffHandWeapon) || (activeMods.some(m => (m.name || '').includes('TWF')) && hasOffHandWeapon));
      const isFlurry = activeMods.some(m => (m.name || '').includes('Flurry'));

      const nonChainMods = activeMods.filter(m => {
        if (!m || !m.name) return false;
        if (m.name.includes('TWF') || m.name.includes('Flurry')) return false;
        if (m.combatScope === 'ranged' || m.scope === 'Ranged Only') return false;
        return true;
      });

      const mainEval = RuleEngine.evaluateWeaponAttack(character, wep, {
        grip,
        powerAttack: paVal,
        flanking,
        charge,
        higherGround: hg,
        activeStance: character.activeStance || 'None',
        customModifiers: nonChainMods
      });

      const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : (f?.name || '')).toLowerCase());
      const hasTWF = feats.some(f => f.includes('two-weapon fighting') && !f.includes('oversized') && !f.includes('shield'));
      const hasITWF = feats.some(f => f.includes('improved two-weapon fighting'));
      const hasGTWF = feats.some(f => f.includes('greater two-weapon fighting'));
      const hasOversized = feats.some(f => f.includes('oversized two-weapon fighting'));

      const isOffHandLight = offHandWep ? (offHandWep.isLight || hasOversized) : false;

      let twfMainPenalty = 0;
      let twfOffPenalty = 0;
      if (isTWF && grip !== '2-Hand' && offHandWep) {
        if (hasTWF) {
          twfMainPenalty = isOffHandLight ? -2 : -4;
          twfOffPenalty = isOffHandLight ? -2 : -4;
        } else {
          twfMainPenalty = isOffHandLight ? -4 : -6;
          twfOffPenalty = isOffHandLight ? -8 : -10;
        }
      }

      let flurryPenalty = 0;
      let flurryExtraCount = 0;
      if (isFlurry) {
        let monkLvl = 0;
        if (Array.isArray(character.levelProgression)) {
          monkLvl = character.levelProgression.filter(p => p && (p.className || '').toLowerCase().includes('monk') && p.active !== false).length;
        } else if (Array.isArray(character.classes)) {
          const m = character.classes.find(c => c && (typeof c === 'string' ? c : (c.name || '')).toLowerCase().includes('monk'));
          monkLvl = m ? (Number(m.level) || 1) : 0;
        } else if (typeof character.classes === 'string') {
          const match = character.classes.match(/monk\s*(\d+)/i);
          monkLvl = match ? parseInt(match[1], 10) : (character.classes.toLowerCase().includes('monk') ? 1 : 0);
        }

        if (monkLvl >= 11) {
          flurryPenalty = 0;
          flurryExtraCount = 2;
        } else if (monkLvl >= 9) {
          flurryPenalty = 0;
          flurryExtraCount = 1;
        } else if (monkLvl >= 5) {
          flurryPenalty = -1;
          flurryExtraCount = 1;
        } else {
          flurryPenalty = -2;
          flurryExtraCount = 1;
        }
      }

      const mainPenalty = twfMainPenalty + flurryPenalty;
      const offPenalty = twfOffPenalty + flurryPenalty;

      let offEval = null;
      if (isTWF && grip !== '2-Hand') {
        offEval = RuleEngine.evaluateWeaponAttack(character, offHandWep, {
          grip: 'Off-Hand',
          powerAttack: paVal,
          flanking,
          charge,
          higherGround: hg,
          activeStance: character.activeStance || 'None',
          customModifiers: nonChainMods
        });
      }

      const attackChain = [];
      const bab = Number(character.bab) || 0;

      // 1. Primary Main-Hand Attack
      const primaryBonus = mainEval.netAttackBonus + mainPenalty;
      attackChain.push({
        id: 'main-1',
        label: isTWF ? 'Main 1' : 'Strike 1',
        hand: 'main',
        handLabel: 'Main Hand',
        weapon: wep,
        bonus: primaryBonus,
        evalResult: mainEval,
        badgeColor: 'amber'
      });

      // 2. Flurry Extra Attacks
      for (let f = 0; f < flurryExtraCount; f++) {
        attackChain.push({
          id: `flurry-${f + 1}`,
          label: flurryExtraCount > 1 ? `Flurry ${f + 1}` : 'Flurry',
          hand: 'flurry',
          handLabel: 'Flurry',
          weapon: wep,
          bonus: primaryBonus,
          evalResult: mainEval,
          badgeColor: 'purple'
        });
      }

      // 3. Primary Off-Hand Attack
      if (isTWF && offEval && grip !== '2-Hand') {
        const offPrimaryBonus = offEval.netAttackBonus + offPenalty;
        attackChain.push({
          id: 'off-1',
          label: 'Off 1',
          hand: 'offhand',
          handLabel: 'Off-Hand',
          weapon: offHandWep,
          bonus: offPrimaryBonus,
          evalResult: offEval,
          badgeColor: 'cyan'
        });
      }

      // 4. Secondary Iterative Attacks (BAB >= 6)
      if (bab >= 6) {
        const secBonus = primaryBonus - 5;
        attackChain.push({
          id: 'main-2',
          label: isTWF ? 'Main 2' : 'Strike 2',
          hand: 'main',
          handLabel: 'Main Hand',
          weapon: wep,
          bonus: secBonus,
          evalResult: mainEval,
          badgeColor: 'amber'
        });

        if (isTWF && offEval && hasITWF && grip !== '2-Hand') {
          const offSecBonus = offEval.netAttackBonus - 5 + offPenalty;
          attackChain.push({
            id: 'off-2',
            label: 'Off 2',
            hand: 'offhand',
            handLabel: 'Off-Hand',
            weapon: offHandWep,
            bonus: offSecBonus,
            evalResult: offEval,
            badgeColor: 'cyan'
          });
        }
      }

      // 5. Tertiary Iterative Attacks (BAB >= 11)
      if (bab >= 11) {
        const tertBonus = primaryBonus - 10;
        attackChain.push({
          id: 'main-3',
          label: isTWF ? 'Main 3' : 'Strike 3',
          hand: 'main',
          handLabel: 'Main Hand',
          weapon: wep,
          bonus: tertBonus,
          evalResult: mainEval,
          badgeColor: 'amber'
        });

        if (isTWF && offEval && hasGTWF && grip !== '2-Hand') {
          const offTertBonus = offEval.netAttackBonus - 10 + offPenalty;
          attackChain.push({
            id: 'off-3',
            label: 'Off 3',
            hand: 'offhand',
            handLabel: 'Off-Hand',
            weapon: offHandWep,
            bonus: offTertBonus,
            evalResult: offEval,
            badgeColor: 'cyan'
          });
        }
      }

      // 6. Quaternary Iterative Attacks (BAB >= 16)
      if (bab >= 16) {
        const quatBonus = primaryBonus - 15;
        attackChain.push({
          id: 'main-4',
          label: isTWF ? 'Main 4' : 'Strike 4',
          hand: 'main',
          handLabel: 'Main Hand',
          weapon: wep,
          bonus: quatBonus,
          evalResult: mainEval,
          badgeColor: 'amber'
        });
      }

      return attackChain;
    }

    function recalculateOffense() {
      if (window._combatOffenseMode === 'ranged') {
        const t = character.tactical || {};
        const selArrow = t.selectedArrow || 'standard';
        const activeRangedWep = getActiveCombatRangedWeapon(character);
        const at = activeRangedWep.ammoType || 'arrow';
        const strMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.str || 10) : 0;
        const dexMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.dex || 10) : 3;

        const hasPBS = characterHasFeat(character, 'Point Blank');
        const hasMany = characterHasFeat(character, 'Manyshot');
        const hasSneak = characterHasSneakAttack(character);

        let arrowDmgBonus = 0;
        let arrowExtraDice = '';
        let arrowType = activeRangedWep.dmgType || 'Piercing';

        if (selArrow === 'plus1') arrowDmgBonus = 1;
        else if (selArrow === 'plus2') arrowDmgBonus = 2;
        else if (selArrow === 'silver') arrowDmgBonus = -1;
        else if (selArrow === 'fire') arrowExtraDice = ' + 1d6 (Fire)';
        else if (selArrow === 'acid') arrowExtraDice = ' + 1d6 (Acid)';
        else if (selArrow === 'shock') arrowExtraDice = ' + 1d6 (Electricity)';
        else if (selArrow === 'blunt') arrowType = 'Bludgeoning';

        let flatDmg = arrowDmgBonus;
        const qualifiedRanged = typeof getQualifiedRangedModifiersList === 'function' ? getQualifiedRangedModifiersList() : [];
        qualifiedRanged.forEach(m => {
          if (m && m.active) {
            if (m.bonusDmg) flatDmg += Number(m.bonusDmg);
            if (m.dice) arrowExtraDice = arrowExtraDice ? `${arrowExtraDice} + ${m.dice}` : ` + ${m.dice}`;
          }
        });
        if (at === 'thrown' && strMod > 0) flatDmg += strMod;

        let extraDice = arrowExtraDice;

        let rawDice = activeRangedWep.dice || '1d8';
        if (selArrow === 'stone' && at === 'bullet') rawDice = '1d3';

        let baseDice = rawDice;
        if (t.manyshot && hasMany) {
          if (rawDice === '1d8') baseDice = '2d8';
          else if (rawDice === '1d6') baseDice = '2d6';
          else if (rawDice === '1d10') baseDice = '2d10';
          else if (rawDice === '1d4') baseDice = '2d4';
        }

        const flatStr = flatDmg !== 0 ? (flatDmg > 0 ? `+${flatDmg}` : `${flatDmg}`) : '';
        const dmgText = `${baseDice}${flatStr}${extraDice}`;

        const dmgDisplayEl = document.getElementById('weapon-damage-formula-display');
        if (dmgDisplayEl) dmgDisplayEl.textContent = dmgText;

        const critDisplayEl = document.getElementById('weapon-crit-display');
        const critText = activeRangedWep.crit || (activeRangedWep.critMin ? `${activeRangedWep.critMin}-20 / x${activeRangedWep.critMult || 2}` : '20 / x3');
        if (critDisplayEl) {
          critDisplayEl.textContent = critText;
          critDisplayEl.title = `Critical Threat: ${critText} (${activeRangedWep.name || 'Ranged'})`;
        }

        const typeDisplayEl = document.getElementById('weapon-type-display');
        if (typeDisplayEl) typeDisplayEl.textContent = arrowType;

        const badge = document.getElementById('weapon-stat-override-badge');
        if (badge) {
          badge.textContent = `🏹 DEX (+${dexMod}) • ${activeRangedWep.name} (${activeRangedWep.range || 'Ranged'})`;
          badge.className = 'text-[10px] font-semibold text-amber-400 text-right truncate max-w-[260px]';
        }

        const attackChain = computeCombatAttackChain(character);
        window.currentCombatAttackChain = attackChain;

        const iterDisplayEl = document.getElementById('iteratives-display');
        if (iterDisplayEl) {
          iterDisplayEl.textContent = attackChain.map(b => `${b.label}: ${b.bonus >= 0 ? '+' : ''}${b.bonus}`).join(' / ');
        }

        const atkRowContainer = document.getElementById('attack-buttons-row-container');
        if (atkRowContainer) {
          const isLocked = !!character.tactical?.totalDefense;
          const totalBtns = attackChain.length + 1;
          const btnBasisClass = (totalBtns >= 4) ? 'basis-[calc(25%-5px)] flex-1 min-w-[58px]' : 'flex-1 min-w-[58px]';

          const buttonsHtml = attackChain.map((item, idx) => {
            let colorBorder = 'border-amber-500/70 hover:border-amber-400';
            let textColor = 'text-amber-400';
            let subtitleColor = 'text-amber-300/80 group-hover:text-amber-200';
            let bgClass = 'bg-amber-950/20 hover:bg-amber-950/40';

            if (item.badgeColor === 'cyan') {
              colorBorder = 'border-cyan-500/70 hover:border-cyan-400';
              textColor = 'text-cyan-400';
              subtitleColor = 'text-cyan-300/80 group-hover:text-cyan-200';
              bgClass = 'bg-cyan-950/20 hover:bg-cyan-950/40';
            } else if (item.badgeColor === 'purple') {
              colorBorder = 'border-purple-500/70 hover:border-purple-400';
              textColor = 'text-purple-400';
              subtitleColor = 'text-purple-300/80 group-hover:text-purple-200';
              bgClass = 'bg-purple-950/20 hover:bg-purple-950/40';
            }

            return `
              <button type="button" onclick="rollAttackChainItemByIndex(${idx})" class="${btnBasisClass} min-h-[58px] py-1 px-1.5 ${bgClass} active:scale-95 border ${isLocked ? 'border-slate-800 opacity-50 cursor-not-allowed' : colorBorder + ' cursor-pointer'} rounded-lg flex flex-col items-center justify-center text-center font-mono transition shadow group shrink-0">
                <div class="text-[9px] uppercase tracking-wider ${subtitleColor} font-sans font-bold truncate leading-tight">${item.label}</div>
                <div class="text-xs sm:text-sm md:text-base font-black ${textColor} font-mono leading-tight my-0.5">${item.bonus >= 0 ? '+' : ''}${item.bonus}</div>
                <div class="text-[8px] font-sans text-slate-400 group-hover:text-slate-300 font-bold truncate leading-tight">${item.handLabel || 'Ranged'}</div>
              </button>
            `;
          }).join('');

          const fullAttackBtnHtml = `
            <button type="button" onclick="executeFullAttackRoll(false)" class="${btnBasisClass} min-h-[58px] py-1 px-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 active:scale-95 text-white rounded-lg shadow-md border border-red-400/50 flex flex-col items-center justify-center transition cursor-pointer text-center shrink-0 group">
              <div class="text-[9px] uppercase tracking-wider text-red-100/90 font-sans font-bold truncate flex items-center justify-center gap-0.5 leading-tight">
                <span>🏹</span>
                <span class="truncate">Full</span>
              </div>
              <div class="text-xs sm:text-sm md:text-base font-black text-white font-mono leading-tight my-0.5 truncate">Attack</div>
              <div class="text-[8px] font-sans text-red-200/90 font-bold truncate leading-tight">Full Round</div>
            </button>
          `;

          atkRowContainer.innerHTML = buttonsHtml + fullAttackBtnHtml;
        }

        // Live update weapon set cards so damage, extra dice & crit modifiers immediately reflect in ranged mode!
        if (typeof renderWeaponSetsUI === 'function') {
          try {
            renderWeaponSetsUI();
          } catch (err) {
            console.warn('recalculateOffense ranged renderWeaponSetsUI error:', err);
          }
        }

        return;
      }

      const wepName = character.activeWeapon || character.tactical?.weaponSets?.set1?.mainWeapon || 'Unarmed Strike';
      const wep = (character.weapons || []).find(w => w && w.name === wepName) || findWeaponEverywhere(wepName) || { name: 'Unarmed Strike', dice: '1d3', critMin: 20, critMult: 2, dmgType: 'Bludgeoning', isLight: true };
      if (!wep) return;

      const isTwoHand = RuleEngine.isTwoHandedWeapon(wep);
      const hasOversized = RuleEngine.hasOversizedWeaponFeat(character);
      const gripSelect = document.getElementById('active-grip-select');

      if (isTwoHand && !hasOversized && gripSelect && gripSelect.value !== '2-Hand') {
        gripSelect.value = '2-Hand';
      }
      if (typeof syncCombatGripUI === 'function') syncCombatGripUI();

      const grip = gripSelect?.value || '1-Hand';
      const paVal = parseInt(document.getElementById('power-attack-val')?.value) || 0;
      const flanking = document.getElementById('mod-flanking')?.checked ?? false;
      const charge = document.getElementById('mod-charge')?.checked ?? false;
      const hg = document.getElementById('mod-higher-ground') ? document.getElementById('mod-higher-ground').checked : (character.tactical?.higherGround ?? false);

      const activeMods = (character.activeModifiers || []).filter(m => m && m.active);
      const nonChainMods = activeMods.filter(m => {
        if (!m || !m.name) return false;
        if (m.name.includes('TWF') || m.name.includes('Flurry')) return false;
        if (m.combatScope === 'ranged' || m.scope === 'Ranged Only') return false;
        return true;
      });

      const evalResult = RuleEngine.evaluateWeaponAttack(character, wep, {
        grip,
        powerAttack: paVal,
        flanking,
        charge,
        higherGround: hg,
        activeStance: character.activeStance || 'None',
        customModifiers: nonChainMods
      });

      // Update Weapon Base Stats (Base Damage + V2 damageParts + Stance/Maneuver extra dice)
      const dmgDisplayEl = document.getElementById('weapon-damage-formula-display');
      if (dmgDisplayEl) {
        const activeDiceMods = (character.activeModifiers || []).filter(m => m.active && m.dice && m.combatScope !== 'ranged' && m.scope !== 'Ranged Only');
        let extraDiceStr = '';
        if (activeDiceMods.length > 0) {
          extraDiceStr = ' + ' + activeDiceMods.map(m => `${m.dice} (${m.name})`).join(' + ');
        }
        const v2SecondaryParts = Array.isArray(evalResult.damageParts) && evalResult.damageParts.length > 1
          ? evalResult.damageParts.slice(1).filter(p => p && p.dice && !p.onCritOnly)
          : [];
        if (v2SecondaryParts.length > 0) {
          extraDiceStr += ' + ' + v2SecondaryParts.map(p => `${p.dice} (${p.source || p.type || 'Element'})`).join(' + ');
        } else if (Array.isArray(wep.elementalMods) && wep.elementalMods.length > 0) {
          extraDiceStr += ' + ' + wep.elementalMods.map(em => `${em.dice} (${em.name || em.type})`).join(' + ');
        }
        const baseDmgStr = evalResult.baseDice + (evalResult.netFlatDamage >= 0 ? '+' : '') + evalResult.netFlatDamage;
        if (evalResult.chargeMultiplier > 1) {
          dmgDisplayEl.textContent = `${evalResult.baseDice}+${evalResult.netFlatDamage} (Charge: x${evalResult.chargeMultiplier})${extraDiceStr}`;
        } else {
          dmgDisplayEl.textContent = baseDmgStr + extraDiceStr;
        }
      }

      // Render V2 Embedded Weapon Modes Strip if the active weapon has modes[]
      const modesStripEl = document.getElementById('combat-weapon-modes-strip');
      if (modesStripEl) {
        const dbWep = typeof findMasterItem === 'function' ? findMasterItem(wep.name) : null;
        const modesList = (Array.isArray(wep.modes) && wep.modes.length > 0)
          ? wep.modes
          : (Array.isArray(dbWep?.modes) ? dbWep.modes : []);
        if (modesList.length > 0 && window.DnDUI && typeof window.DnDUI.renderModesPills === 'function') {
          modesStripEl.classList.remove('hidden');
          modesStripEl.innerHTML = window.DnDUI.renderModesPills(
            { ...wep, modes: modesList },
            wep.activeModeId || modesList[0]?.id,
            "selectActiveWeaponMode('__MODE_ID__')"
          );
        } else {
          modesStripEl.classList.add('hidden');
          modesStripEl.innerHTML = '';
        }
      }

      const critDisplayEl = document.getElementById('weapon-crit-display');
      if (critDisplayEl) {
        let critText = (evalResult.critMin === 20 ? '20' : evalResult.critMin + '-20') + ' / x' + evalResult.critMult;
        if (evalResult.critData?.capped) {
          critText += ' (Cap)';
        }
        critDisplayEl.textContent = critText;
        critDisplayEl.title = `Critical Threat: ${evalResult.critThreatRangeDisplay} / x${evalResult.critMult}`;
      }

      const typeDisplayEl = document.getElementById('weapon-type-display');
      if (typeDisplayEl) typeDisplayEl.textContent = evalResult.damageType;

      const attackChain = computeCombatAttackChain(character);
      window.currentCombatAttackChain = attackChain;

      const iterDisplayEl = document.getElementById('iteratives-display');
      if (iterDisplayEl) {
        iterDisplayEl.textContent = attackChain.map(b => `${b.label}: ${b.bonus >= 0 ? '+' : ''}${b.bonus}`).join(' / ');
      }

      // Weapon Stat & Size Override indicator
      const badge = document.getElementById('weapon-stat-override-badge');
      if (badge) {
        if (evalResult.sizeSteps > 0) {
          const sourcesText = evalResult.sizeBuffSources?.join(', ') || `+${evalResult.sizeSteps} Size`;
          badge.textContent = `✨ Size Increase: ${evalResult.rawBaseDice} ➔ ${evalResult.baseDice} (${sourcesText})`;
          badge.className = 'text-[10px] font-semibold text-purple-400 text-right';
        } else if (evalResult.attackStatName.includes('Weapon Finesse')) {
          badge.textContent = `✨ Weapon Finesse: DEX (+${evalResult.attackStatMod}) active`;
          badge.className = 'text-[10px] font-semibold text-emerald-400 text-right';
        } else {
          badge.textContent = `⚔️ Using ${evalResult.attackStatName} (+${evalResult.attackStatMod})`;
          badge.className = 'text-[10px] font-semibold text-slate-400 text-right';
        }
      }

      // PA explanation
      const paExplanation = document.getElementById('pa-explanation');
      if (paExplanation) {
        if (grip === '2-Hand') paExplanation.textContent = '(-BAB Att / +2x Dmg)';
        else if (grip === 'Off-Hand') paExplanation.textContent = '(-BAB Att / +0x Dmg)';
        else paExplanation.textContent = '(-BAB Att / +1x Dmg)';
      }

      // Dynamic Attack Buttons Row (Interactive iterative attack buttons + Full Attack button on far right)
      const atkRowContainer = document.getElementById('attack-buttons-row-container');
      if (atkRowContainer) {
        const isLocked = !!character.tactical?.totalDefense;
        const count = attackChain.length;
        const totalBtns = count + 1;
        // All buttons including Full Attack share the exact same width basis and padding!
        const btnBasisClass = (totalBtns >= 4) ? 'basis-[calc(25%-5px)] flex-1 min-w-[58px]' : 'flex-1 min-w-[58px]';

        const buttonsHtml = attackChain.map((item, idx) => {
          let colorBorder = 'border-emerald-500/50 hover:border-emerald-400';
          let textColor = 'text-emerald-400';
          let subtitleColor = 'text-slate-400 group-hover:text-emerald-300';
          let bgClass = 'bg-slate-900 hover:bg-slate-800';

          if (item.badgeColor === 'amber') {
            colorBorder = 'border-amber-500/70 hover:border-amber-400';
            textColor = 'text-amber-400';
            subtitleColor = 'text-amber-300/80 group-hover:text-amber-200';
            bgClass = 'bg-amber-950/20 hover:bg-amber-950/40';
          } else if (item.badgeColor === 'cyan') {
            colorBorder = 'border-cyan-500/70 hover:border-cyan-400';
            textColor = 'text-cyan-400';
            subtitleColor = 'text-cyan-300/80 group-hover:text-cyan-200';
            bgClass = 'bg-cyan-950/20 hover:bg-cyan-950/40';
          } else if (item.badgeColor === 'purple') {
            colorBorder = 'border-purple-500/70 hover:border-purple-400';
            textColor = 'text-purple-400';
            subtitleColor = 'text-purple-300/80 group-hover:text-purple-200';
            bgClass = 'bg-purple-950/20 hover:bg-purple-950/40';
          }

          return `
            <button type="button" onclick="rollAttackChainItemByIndex(${idx})" class="${btnBasisClass} min-h-[58px] py-1 px-1.5 ${bgClass} active:scale-95 border ${isLocked ? 'border-slate-800 opacity-50 cursor-not-allowed' : colorBorder + ' cursor-pointer'} rounded-lg flex flex-col items-center justify-center text-center font-mono transition shadow group shrink-0">
              <div class="text-[9px] uppercase tracking-wider ${subtitleColor} font-sans font-bold truncate leading-tight">${item.label}</div>
              <div class="text-xs sm:text-sm md:text-base font-black ${textColor} font-mono leading-tight my-0.5">${item.bonus >= 0 ? '+' : ''}${item.bonus}</div>
              <div class="text-[8px] font-sans text-slate-400 group-hover:text-slate-300 font-bold truncate leading-tight">${item.handLabel || 'Standard'}</div>
            </button>
          `;
        }).join('');

        const fullAttackBtn = `
          <button type="button" onclick="executeFullAttackRoll(false)" class="${btnBasisClass} min-h-[58px] py-1 px-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 active:scale-95 text-white rounded-lg shadow-md border border-red-400/50 flex flex-col items-center justify-center transition cursor-pointer text-center shrink-0 group">
            <div class="text-[9px] uppercase tracking-wider text-red-100/90 font-sans font-bold truncate flex items-center justify-center gap-0.5 leading-tight">
              <span>⚔️</span>
              <span class="truncate">Full</span>
            </div>
            <div class="text-xs sm:text-sm md:text-base font-black text-white font-mono leading-tight my-0.5 truncate">Attack</div>
            <div class="text-[8px] font-sans text-red-200/90 font-bold truncate leading-tight">Full Round</div>
          </button>
        `;

        atkRowContainer.innerHTML = buttonsHtml + fullAttackBtn;
      }

      renderSavedProfiles();

      if (typeof updateActionEconomyUI === 'function') {
        updateActionEconomyUI();
      }

      // Live update weapon set cards so damage, extra dice & crit modifiers immediately reflect!
      try {
        renderWeaponSetsUI();
      } catch (err) {
        console.warn('recalculateOffense renderWeaponSetsUI error:', err);
      }
    }

    function toggleModifier(idx) {
      if (!character.activeModifiers || !character.activeModifiers[idx]) return;
      character.activeModifiers[idx].active = !character.activeModifiers[idx].active;
      recalculateOffense();
      renderOffenseModifiersGrid();
      saveStateToStorage(false);
    }

    // Single Iterative Attack Roll (Handles Main Hand, Off-Hand, and Flurry individually)
    function rollAttackChainItemByIndex(targetIdx) {
      if (character.tactical?.totalDefense) {
        showDiceTopToast({
          icon: '🛡️',
          title: 'Total Defense Active!',
          breakdown: 'You cannot attack this round while in Total Defense.',
          total: 'Attack Locked'
        });
        return;
      }

      if (window._combatOffenseMode === 'ranged') {
        const canShoot = consumeEquippedAmmunition(1);
        if (!canShoot) return;
      }

      const chain = window.currentCombatAttackChain || computeCombatAttackChain(character);
      const item = chain[targetIdx] || chain[0];
      if (!item) return;

      const noCritConfirm = document.getElementById('house-no-crit-confirm') ? document.getElementById('house-no-crit-confirm').checked : (character.houseRules?.noCritConfirm ?? true);
      const maneuverCrit = document.getElementById('house-maneuver-crit') ? document.getElementById('house-maneuver-crit').checked : (character.houseRules?.maneuverCrit ?? false);

      const evalResult = item.evalResult;
      const bonus = item.bonus;
      const d20 = Math.floor(Math.random() * 20) + 1;
      const diceToRoll3D = [{ type: 'd20', value: d20 }];

      const isThreat = (d20 >= evalResult.critMin);
      const isCrit = isThreat && noCritConfirm;
      const mult = isCrit ? evalResult.critMult : 1;
      const chargeMult = evalResult.chargeMultiplier || 1;
      const totalDiceMult = mult * chargeMult;

      let diceSides = 6;
      let diceCount = 1;
      const match = (evalResult.baseDice || item.weapon?.dice || '1d6').match(/(\d+)d(\d+)/i);
      if (match) {
        diceCount = parseInt(match[1]) || 1;
        diceSides = parseInt(match[2]) || 6;
      }

      const weaponRolls = [];
      let weaponRollSum = 0;
      for (let b = 0; b < diceCount * totalDiceMult; b++) {
        const r = Math.floor(Math.random() * diceSides) + 1;
        weaponRolls.push(r);
        weaponRollSum += r;
        diceToRoll3D.push({ type: 'd' + diceSides, value: r });
      }

      const attackPlans = [{
        idx: targetIdx + 1,
        label: `${item.label} (${item.handLabel})`,
        hand: item.hand,
        badgeColor: item.badgeColor,
        d20,
        bonus,
        totalAtk: d20 + bonus,
        isThreat,
        isCrit,
        mult,
        chargeMult,
        weaponRollSum,
        flatDmg: (evalResult.chargeFlatDamage || evalResult.netFlatDamage) * mult,
        breakdown: []
      }];

      const activeMods = (character.activeModifiers || []).filter(m => m.active);

      const strikeManeuversUsed = [];
      let bladeOfBloodUsed = false;
      activeMods.forEach(m => {
        if (m.source === 'Maneuver') strikeManeuversUsed.push(m.name);
        if (m.name === 'Blade of Blood') bladeOfBloodUsed = true;
      });

      const onRollComplete = () => {
        renderAttackResults(attackPlans, evalResult, activeMods, maneuverCrit);
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function') {
        try {
          Dice3D.roll(diceToRoll3D.slice(0, 6), onRollComplete);
        } catch (err) {
          onRollComplete();
        }
      } else {
        onRollComplete();
      }

      // Auto-expend strike maneuvers
      if (strikeManeuversUsed.length > 0 && character.tomeOfBattle?.readiedManeuvers) {
        strikeManeuversUsed.forEach(strikeName => {
          const m = character.tomeOfBattle.readiedManeuvers.find(rm => rm.name.toLowerCase() === strikeName.toLowerCase());
          if (m) m.expended = true;
          const mod = character.activeModifiers.find(am => am.name.toLowerCase() === strikeName.toLowerCase());
          if (mod) mod.active = false;
        });
      }
      if (bladeOfBloodUsed) {
        const slot = character.spellcasting?.slots?.[1];
        if (slot) slot.used = Math.min(slot.daily || 8, (slot.used || 0) + 1);
        const mod = character.activeModifiers.find(am => am.name === 'Blade of Blood');
        if (mod) mod.active = false;
      }
      if (strikeManeuversUsed.length > 0 || bladeOfBloodUsed) {
        saveStateToStorage(true);
        setTimeout(() => {
          renderAll();
          if (strikeManeuversUsed.length > 0) {
            showDiceTopToast({
              icon: '⚡',
              title: 'Maneuver Expended!',
              breakdown: `${strikeManeuversUsed.join(', ')} executed with the strike and expended.`,
              total: 'Maneuver Expended'
            });
          }
        }, 1200);
      }
    }

    // Single Iterative legacy bridge (aliases targetIdx to rollAttackChainItemByIndex)
    function rollSingleAttackWith3D(targetIdx) {
      rollAttackChainItemByIndex(targetIdx);
    }

    // [d20] 3D TACTICAL ROLL ATTACK (Full Attack Sequence)
    function rollFullAttackWith3D() {
      const chain = computeCombatAttackChain(character);
      if (!chain || chain.length === 0) return;

      if (window._combatOffenseMode === 'ranged') {
        const canShoot = consumeEquippedAmmunition(chain.length);
        if (!canShoot) return;
      }

      const noCritConfirm = document.getElementById('house-no-crit-confirm') ? document.getElementById('house-no-crit-confirm').checked : (character.houseRules?.noCritConfirm ?? true);
      const maneuverCrit = document.getElementById('house-maneuver-crit') ? document.getElementById('house-maneuver-crit').checked : (character.houseRules?.maneuverCrit ?? false);
      const activeMods = (character.activeModifiers || []).filter(m => m.active);

      const diceToRoll3D = [];
      const attackPlans = [];

      chain.forEach((item, idx) => {
        const evalResult = item.evalResult;
        const d20 = Math.floor(Math.random() * 20) + 1;
        diceToRoll3D.push({ type: 'd20', value: d20 });

        const isThreat = (d20 >= evalResult.critMin);
        const isCrit = isThreat && noCritConfirm;
        const mult = isCrit ? evalResult.critMult : 1;
        const chargeMult = evalResult.chargeMultiplier || 1;
        const totalDiceMult = mult * chargeMult;

        let diceSides = 6;
        let diceCount = 1;
        const match = (evalResult.baseDice || item.weapon?.dice || '1d6').match(/(\d+)d(\d+)/i);
        if (match) {
          diceCount = parseInt(match[1]) || 1;
          diceSides = parseInt(match[2]) || 6;
        }

        const weaponRolls = [];
        let weaponRollSum = 0;
        for (let b = 0; b < diceCount * totalDiceMult; b++) {
          const r = Math.floor(Math.random() * diceSides) + 1;
          weaponRolls.push(r);
          weaponRollSum += r;
          diceToRoll3D.push({ type: 'd' + diceSides, value: r });
        }

        attackPlans.push({
          idx: idx + 1,
          label: `${item.label} (${item.handLabel})`,
          hand: item.hand,
          badgeColor: item.badgeColor,
          d20,
          bonus: item.bonus,
          totalAtk: d20 + item.bonus,
          isThreat,
          isCrit,
          mult,
          chargeMult,
          weaponRollSum,
          flatDmg: (evalResult.chargeFlatDamage || evalResult.netFlatDamage) * mult,
          breakdown: []
        });
      });

      const onRollComplete = () => {
        renderAttackResults(attackPlans, chain[0].evalResult, activeMods, maneuverCrit);
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function') {
        try {
          Dice3D.roll(diceToRoll3D.slice(0, 10), onRollComplete);
        } catch (err) {
          onRollComplete();
        }
      } else {
        onRollComplete();
      }
    }

    function renderAttackResults(attackPlans, evalResult, activeMods, maneuverCrit) {
      const card = document.getElementById('attack-results-card');
      if (!card) return;
      card.classList.remove('hidden');

      const iconEl = document.getElementById('result-card-icon');
      if (iconEl) iconEl.textContent = '⚔️';
      const titleEl = document.getElementById('result-card-title');
      if (titleEl) titleEl.textContent = 'Attack Resolution';
      const subEl = document.getElementById('result-card-subtitle');
      if (subEl) subEl.textContent = 'Result card stays open until dismissed.';
      const grandLabel = document.getElementById('result-grand-total-label');
      if (grandLabel) grandLabel.textContent = 'Total Potential Damage:';

      let grandTotalDmg = 0;
      const summaryGrid = document.getElementById('result-summary-grid');
      if (summaryGrid) summaryGrid.innerHTML = '';

      attackPlans.forEach(atk => {
        let extraDiceSum = 0;
        const extraDetails = [];

        activeMods.forEach(mod => {
          if (mod.dice) {
            const isPrecision = (mod.name || '').toLowerCase().includes('sneak') || (mod.name || '').toLowerCase().includes('skirmish') || (mod.tags && mod.tags.includes('precision'));
            const precisionRule = character.houseRules?.precisionDamageRule || 'once_per_turn';
            if (isPrecision && precisionRule === 'once_per_turn' && atk.idx > 1) {
              return;
            }

            const mMatch = mod.dice.match(/(\d+)d(\d+)/i);
            if (mMatch) {
              let mCount = parseInt(mMatch[1]) || 1;
              const mSides = parseInt(mMatch[2]) || 6;
              if (mod.source === 'Maneuver' && maneuverCrit && atk.isCrit) mCount *= atk.mult;

              let mSum = 0;
              for (let c = 0; c < mCount; c++) {
                mSum += Math.floor(Math.random() * mSides) + 1;
              }
              extraDiceSum += mSum;
              extraDetails.push(`${mod.name}: +${mSum} ${mod.type}${isPrecision && precisionRule === 'once_per_turn' ? ' (First Hit)' : ''}`);
            }
          }
        });

        // Weapon Elemental Mods (Flaming, Frost, Shock, Holy, Unholy)
        const wepElementalMods = atk.weapon?.elementalMods || (atk.hand === 'offHand' ? getResolvedOffHandWeapon(character)?.elementalMods : (character.weapons || []).find(w => w.name === (character.activeWeapon || character.tactical?.weaponSets?.set1?.mainWeapon))?.elementalMods) || [];
        if (Array.isArray(wepElementalMods) && wepElementalMods.length > 0) {
          wepElementalMods.forEach(em => {
            if (em.dice) {
              const eMatch = em.dice.match(/(\d+)d(\d+)/i);
              if (eMatch) {
                const count = parseInt(eMatch[1]) || 1;
                const sides = parseInt(eMatch[2]) || 6;
                let eSum = 0;
                for (let k = 0; k < count; k++) {
                  eSum += Math.floor(Math.random() * sides) + 1;
                }
                extraDiceSum += eSum;
                extraDetails.push(`${em.name || 'Element'}: +${eSum} ${em.type || ''}`);
              }
            }
          });
        }

        const totalAttackDmg = atk.weaponRollSum + atk.flatDmg + extraDiceSum;
        grandTotalDmg += totalAttackDmg;

        if (summaryGrid) {
          const div = document.createElement('div');
          let borderClass = 'border-slate-700 bg-slate-900';
          let tagBadge = '<span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-600/50 font-bold">Main Hand</span>';

          if (atk.badgeColor === 'cyan') {
            borderClass = 'border-cyan-800/60 bg-cyan-950/20';
            tagBadge = '<span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-600/50 font-bold">Off-Hand</span>';
          } else if (atk.badgeColor === 'purple') {
            borderClass = 'border-purple-800/60 bg-purple-950/20';
            tagBadge = '<span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-600/50 font-bold">Flurry</span>';
          }

          if (atk.isCrit) {
            borderClass = 'bg-rose-950/40 border-rose-500';
          }

          div.className = `p-3 rounded-lg border ${borderClass}`;
          div.innerHTML = `
            <div class="flex justify-between items-center mb-1">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-white">${atk.label || ('Strike ' + atk.idx)}</span>
                ${tagBadge}
              </div>
              ${atk.isCrit ? '<span class="badge bg-rose-600 text-white animate-pulse inline-flex items-center gap-1">' + getD20IconSvg('w-3.5 h-3.5') + '<span>CRITICAL</span></span>' : (atk.d20 === 20 ? '<span class="badge bg-amber-500 text-black">NAT 20</span>' : '')}
            </div>
            <div class="flex justify-between items-baseline font-mono border-t border-slate-800 pt-1.5 mt-1">
              <span class="text-xs text-slate-400">Atk: <strong class="${atk.badgeColor === 'cyan' ? 'text-cyan-400' : (atk.badgeColor === 'amber' ? 'text-amber-400' : 'text-emerald-400')} text-base">${atk.totalAtk >= 0 ? '+' : ''}${atk.totalAtk}</strong> (d20:${atk.d20})</span>
              <span class="text-xs text-slate-400">DMG: <strong class="text-rose-400 text-base">${totalAttackDmg}</strong></span>
            </div>
            <div class="text-[10px] text-amber-300 truncate mt-1">Weapon: ${atk.weaponRollSum + atk.flatDmg} ${extraDetails.length ? '• ' + extraDetails.join(', ') : ''}</div>
          `;
          summaryGrid.appendChild(div);
        }
      });

      const grandTotalEl = document.getElementById('result-grand-total-damage');
      if (grandTotalEl) grandTotalEl.textContent = grandTotalDmg + ' HP';
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Add to dice history and trigger top toast notification
      addDiceHistoryEntry({
        icon: '⚔️',
        title: 'Full Attack Resolution',
        formula: attackPlans.map(a => `${a.idx}. Atk: ${a.totalAtk}`).join(' | '),
        breakdown: attackPlans.map(a => `${a.idx}. Atk: ${a.totalAtk} (d20:${a.d20}${a.isCrit ? ' ⚡' : ''})`).join(' • '),
        total: `${grandTotalDmg} Damage`,
        isCrit: attackPlans.some(a => a.isCrit)
      });
    }

    function dismissAttackResult() {
      const card = document.getElementById('attack-results-card');
      if (card) card.classList.add('hidden');
    }

    // ====================================================
    // ⚔️ TACTICAL COMBAT COCKPIT ENGINE (3-COLUMN DASHBOARD)
    // ====================================================
    window.combatDrawerExpanded = { offense: false, defense: false, offense_melee: false, offense_ranged: false, offense_spell: false, spell_control: false, spell_support: false };
    window.combatPinReorderMode = { offense: false, defense: false, offense_melee: false, offense_ranged: false, offense_spell: false, spell_control: false, spell_support: false };
    window.pendingCombatPinItem = null;
    window.currentActivePinModal = null;

    // --- PIN DRAWER ROUTING & CATEGORIZATION MOTORU ---
    function resolvePinTarget(pin) {
      if (!pin) return 'offense_melee';
      if (pin.pinTarget && pin.pinTarget !== 'auto') {
        if (['offense_melee', 'offense_ranged', 'offense_spell', 'spell_control', 'spell_support', 'defense', 'combat_skills'].includes(pin.pinTarget)) {
          return pin.pinTarget;
        }
      }

      const name = (pin.name || '').toLowerCase().trim();
      const desc = (pin.desc || pin.benefit || pin.notes || '').toLowerCase();
      const fullText = name + ' ' + desc;
      const dbItem = typeof findMasterItem === 'function' ? findMasterItem(pin.name) : null;
      const attackType = pin.attackType || dbItem?.attackType || '';
      const combatScope = pin.combatScope || dbItem?.combatScope || '';
      const sourceType = pin.sourceType || pin.type || dbItem?.type || '';

      // 0. Skills always route to Combat Skills (1-click d20 roller)
      if (sourceType === 'Skill' || pin.category === 'combat_skills' || pin.action === 'Check') {
        return 'combat_skills';
      }
      if ((character?.skills || []).some(sk => sk && sk.name && sk.name.toLowerCase().trim() === name)) {
        return 'combat_skills';
      }

      // Direct category override
      if (pin.category === 'spell_control') return 'spell_control';
      if (pin.category === 'spell_support') return 'spell_support';
      if (pin.category === 'offense_spell') return 'offense_spell';

      // GENERAL ARCHITECTURAL RULE (Offense vs Defense Routing):
      // Stances, maneuvers, feats, or abilities whose primary identity is offensive damage or attack,
      // but which inflict an AC/Defense penalty (e.g., -2 AC, -4 AC, penalty to AC), are OFFENSE abilities, NOT defense abilities,
      // unless they provide a genuine positive defensive benefit (positive AC bonus, dodge, saving throws, shield, counter reaction).
      const hasOffenseIdentity = /(damage|\+\d+d\d+|\bmelee\b|strike|attack\b|weapon)/i.test(fullText) ||
                                 attackType === 'weapon_buff' ||
                                 ((sourceType === 'Stance' || sourceType === 'Maneuver') && /(damage|\+\d+d\d+|strike|slash|pierce|bludgeon)/i.test(fullText));
      const hasAcPenaltyOnly = /(-\d+\s*(?:to\s*)?ac\b|penalty to ac)/i.test(fullText) &&
                               !/(\+\d+\s*(?:to\s*)?(?:ac|dodge|armor|shield|deflect)|counter|\bblock\b|\bwall of blades\b|\broots of the mountain\b|\bpearl of black doubt\b|\biron heart focus\b)/i.test(fullText);

      // If it's an offensive ability with AC penalty (e.g., Punishing Stance), route strictly to offense_melee
      if (hasOffenseIdentity && hasAcPenaltyOnly) {
        return 'offense_melee';
      }

      // 1. Spells Classification (Offense / Control / Support / Melee Weapon Buff)
      if (sourceType === 'Spell' || dbItem?.type === 'Spell') {
        if (attackType === 'weapon_buff' || /(blade of blood|keen edge|holy sword|magic weapon|align weapon)/i.test(name)) {
          return 'offense_melee';
        }
        return typeof classifySpellRole === 'function' ? classifySpellRole(pin) : 'offense_spell';
      }

      // 2. Defense checks
      if (combatScope === 'defense' || pin.category === 'defense') return 'defense';
      if (!hasAcPenaltyOnly && /(shield|armor|ac\b|defense|dodge|deflect|resist|ward|saving throw|save\b|counter|wall of blades|shield block|roots of the mountain)/i.test(fullText)) {
        if (!/(acid arrow|scorching ray|fireball|ray of frost|disintegrate|magic missile|blade of blood)/i.test(name)) {
          return 'defense';
        }
      }

      // 3. Spell-like attack types
      if (attackType === 'ranged_touch' || attackType === 'spell_auto' || attackType === 'saving_throw') {
        return typeof classifySpellRole === 'function' ? classifySpellRole(pin) : 'offense_spell';
      }

      // 4. Ranged checks
      if (attackType === 'ammunition' || combatScope === 'ranged' || sourceType === 'Ammunition' || dbItem?.type === 'Ammunition') {
        return 'offense_ranged';
      }
      if (/(arrow|bow\b|crossbow|sling|dart|shuriken|point blank|precise shot|rapid shot|many shot|far shot|enhance arrow)/i.test(name)) {
        if (!/(acid arrow)/i.test(name)) {
          return 'offense_ranged';
        }
      }

      // 5. Melee checks (Maneuver, Stance, Melee Touch, Weapon Buff)
      if (attackType === 'melee_touch' || attackType === 'weapon_buff') {
        return 'offense_melee';
      }
      if (sourceType === 'Maneuver' || sourceType === 'Stance') {
        return 'offense_melee';
      }

      return 'offense_melee';
    }

    function getAllCombatPins() {
      if (!character) return [];
      if (!character.combatPins) character.combatPins = { offense_melee: [], offense_ranged: [], offense_spell: [], spell_control: [], spell_support: [], defense: [], combat_skills: [] };
      const all = [];
      const seenNames = new Set();
      const keys = ['offense_melee', 'offense_ranged', 'offense_spell', 'spell_control', 'spell_support', 'defense', 'combat_skills', 'offense'];
      keys.forEach(k => {
        (character.combatPins[k] || []).forEach(p => {
          if (!p || !p.name) return;
          const lower = p.name.toLowerCase().trim();
          if (!seenNames.has(lower)) {
            seenNames.add(lower);
            all.push(p);
          }
        });
      });
      return all;
    }

    function getPinsForDrawer(drawerKey) {
      const all = getAllCombatPins();
      return all.filter(p => resolvePinTarget(p) === drawerKey);
    }

    function changePinTargetDirect(pinName, newTarget) {
      if (!character) return;
      const all = getAllCombatPins();
      const cleanTarget = String(pinName).toLowerCase().trim();
      const pin = all.find(p => (p.name || '').toLowerCase().trim() === cleanTarget);
      if (!pin) return;

      pin.pinTarget = newTarget;

      const targetBuckets = { offense_melee: [], offense_ranged: [], offense_spell: [], spell_control: [], spell_support: [], defense: [], combat_skills: [] };
      all.forEach(p => {
        const t = resolvePinTarget(p);
        if (!targetBuckets[t]) targetBuckets[t] = [];
        targetBuckets[t].push(p);
      });
      character.combatPins = targetBuckets;

      saveStateToStorage(true);
      try { renderOffenseModifiersGrid(); } catch (e) {}
      try { if (typeof renderRangedModifiersGrid === 'function') renderRangedModifiersGrid(); } catch (e) {}
      try { if (typeof renderCombatSkillsCard === 'function') renderCombatSkillsCard(); } catch (e) {}
      ['offense_spell', 'spell_control', 'spell_support', 'defense'].forEach(cat => {
        try { renderCombatPins(cat); } catch (e) {}
      });
      try { if (typeof renderSpellTacticalModifiers === 'function') renderSpellTacticalModifiers(); } catch (e) {}
      try { if (typeof recalculateCombatSpell === 'function') recalculateCombatSpell(); } catch (e) {}

      const labelMap = {
        auto: '🎯 Auto (Rule Engine)',
        offense_spell: '⚔️ Spell: Offense',
        spell_control: '🕸️ Spell: Control',
        spell_support: '✨ Spell: Support',
        offense_melee: '⚔️ Physical: Melee',
        offense_ranged: '🏹 Physical: Ranged',
        defense: '🛡️ Physical: Defense',
        combat_skills: '🎯 Combat Skills'
      };
      showDiceTopToast({
        icon: '📌',
        title: 'Drawer Reassigned',
        breakdown: `"${pin.name}" moved to ${labelMap[newTarget] || newTarget}.`,
        total: 'Moved'
      });
    }

    function onPinModalDrawerChange() {
      const select = document.getElementById('pin-modal-drawer-select');
      if (!select || !window.currentActivePinModal) return;
      changePinTargetDirect(window.currentActivePinModal.name, select.value);
    }

    function removeCombatPinByName(pinName) {
      if (!character || !character.combatPins) return;
      const clean = (pinName || '').toLowerCase().trim();
      ['offense_melee', 'offense_ranged', 'offense_spell', 'spell_control', 'spell_support', 'defense', 'combat_skills', 'offense'].forEach(k => {
        if (Array.isArray(character.combatPins[k])) {
          character.combatPins[k] = character.combatPins[k].filter(p => (p.name || '').toLowerCase().trim() !== clean);
        }
      });
      if (Array.isArray(character.activeModifiers)) {
        character.activeModifiers = character.activeModifiers.filter(m => !m || !m.name || m.name.toLowerCase().trim() !== clean);
      }
    }

    // --- SPELL TOUCH ATTACK ROLLER (BAB + DEX/STR vs TOUCH AC + DAMAGE) ---
    function rollSpellTouchAttack(spellOrIdx) {
      let s = null;
      if (typeof spellOrIdx === 'number' || (!isNaN(spellOrIdx) && typeof spellOrIdx === 'string' && /^\d+$/.test(spellOrIdx))) {
        s = character?.spellcasting?.knownSpells?.[parseInt(spellOrIdx, 10)];
      } else if (typeof spellOrIdx === 'object' && spellOrIdx !== null) {
        s = spellOrIdx;
      } else if (typeof spellOrIdx === 'string') {
        const clean = spellOrIdx.toLowerCase().trim();
        s = (character?.spellcasting?.knownSpells || []).find(sp => (sp.name || '').toLowerCase().trim() === clean)
          || (typeof findMasterItem === 'function' ? findMasterItem(spellOrIdx) : null)
          || { name: spellOrIdx };
      }
      if (!s) return;

      const dbItem = typeof findMasterItem === 'function' ? findMasterItem(s.name) : null;
      const attackType = s.attackType || dbItem?.attackType || 'ranged_touch';
      const isRanged = attackType === 'ranged_touch';

      const bab = Number(character.bab) || 0;
      const dexMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.dex || 10) : 0;
      const strMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.str || 10) : 0;
      const touchAtkBonus = isRanged ? (bab + dexMod) : (bab + strMod);

      const d20 = Math.floor(Math.random() * 20) + 1;
      const totalAtk = d20 + touchAtkBonus;
      const isCrit = d20 === 20;

      const { cl } = typeof getCasterInfo === 'function' ? getCasterInfo() : { cl: 1 };
      const dmgExpr = typeof resolveSpellEffectiveFormula === 'function' ? resolveSpellEffectiveFormula(s, cl) : (s.dice || s.damageDice || (dbItem && dbItem.dice) || '');

      let diceSides = 6;
      let diceCount = 0;
      const rolls = [];
      let dmgSum = 0;

      if (dmgExpr) {
        const match = String(dmgExpr).match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
        if (match) {
          diceCount = parseInt(match[1], 10) || 1;
          diceSides = parseInt(match[2], 10) || 6;
          const sign = match[3] || '+';
          const mod = match[4] ? parseInt(match[4], 10) * (sign === '-' ? -1 : 1) : 0;
          for (let i = 0; i < diceCount; i++) {
            const r = Math.floor(Math.random() * diceSides) + 1;
            rolls.push(r);
            dmgSum += r;
          }
          dmgSum += mod;
        }
      }

      const dice3dList = [{ type: 'd20', value: d20 }];
      rolls.forEach(r => {
        if (dice3dList.length < 6) dice3dList.push({ type: 'd' + diceSides, value: r });
      });

      const onDone = () => {
        const critText = isCrit ? ' 💥 CRITICAL THREAT! (20/x2)' : '';
        const typeLabel = isRanged ? 'Ranged Touch Attack' : 'Melee Touch Attack';
        const dmgText = dmgExpr ? ` • Damage: ${dmgSum} (${dmgExpr} [${rolls.join('+')}])` : '';

        showDiceTopToast({
          icon: '⚡',
          title: `${s.name} - ${typeLabel}`,
          breakdown: `Touch Attack: d20 [${d20}] + ${touchAtkBonus} = ${totalAtk} (vs. Target Touch AC)${critText}${dmgText}`,
          total: `${totalAtk} Touch Attack`
        });

        addDiceHistoryEntry({
          icon: '⚡',
          title: `${s.name} Touch Attack`,
          formula: `d20+${touchAtkBonus}${dmgExpr ? ` & ${dmgExpr}` : ''}`,
          breakdown: `Atk: ${totalAtk} (d20:${d20})${dmgText}`,
          total: `${totalAtk} to Hit`
        });
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function') {
        try {
          Dice3D.roll(dice3dList, onDone);
        } catch (e) {
          onDone();
        }
      } else {
        onDone();
      }
    }

    // --- AUTOMATED COMBAT PINS SYNCHRONIZATION ---
    // Readied maneuvers, known stances, equipped items with active abilities route automatically.
    function syncAutomatedCombatPins(char) {
      if (!char) return;
      if (!char.combatPins) char.combatPins = { offense_melee: [], offense_ranged: [], offense_spell: [], spell_control: [], spell_support: [], defense: [], combat_skills: [] };
      if (!char.combatPins.offense_melee) char.combatPins.offense_melee = [];
      if (!char.combatPins.offense_ranged) char.combatPins.offense_ranged = [];
      if (!char.combatPins.offense_spell) char.combatPins.offense_spell = [];
      if (!char.combatPins.spell_control) char.combatPins.spell_control = [];
      if (!char.combatPins.spell_support) char.combatPins.spell_support = [];
      if (!char.combatPins.defense) char.combatPins.defense = [];
      if (!char.combatPins.combat_skills) char.combatPins.combat_skills = [];

      // Migrate any Skill pins that were previously routed into offense_melee or other drawers into combat_skills
      ['offense_melee', 'offense_ranged', 'offense_spell', 'spell_control', 'spell_support', 'defense'].forEach(cat => {
        if (!Array.isArray(char.combatPins[cat])) return;
        const keep = [];
        char.combatPins[cat].forEach(p => {
          if (!p || !p.name) return;
          const pNameLower = p.name.toLowerCase().trim();
          const isSkill = p.sourceType === 'Skill' || p.type === 'Skill' || p.action === 'Check' ||
            (char.skills || []).some(sk => sk && sk.name && sk.name.toLowerCase().trim() === pNameLower);
          if (isSkill) {
            p.pinTarget = 'combat_skills';
            p.sourceType = 'Skill';
            if (!char.combatPins.combat_skills.some(existing => (existing.name || '').toLowerCase().trim() === pNameLower)) {
              char.combatPins.combat_skills.push(p);
            }
          } else {
            keep.push(p);
          }
        });
        char.combatPins[cat] = keep;
      });

      // Migration: Clean up or migrate any legacy utility/offense pins
      if (Array.isArray(char.combatPins.utility) && char.combatPins.utility.length > 0) {
        char.combatPins.utility.forEach(pin => {
          if (!pin || !pin.name) return;
          const isConsumable = pin.sourceType === 'Consumable' || /potion|scroll|wand/i.test(pin.name);
          if (!isConsumable) {
            const targetCat = resolvePinTarget(pin);
            if (!char.combatPins[targetCat].some(p => (p.name || '').toLowerCase() === (pin.name || '').toLowerCase())) {
              char.combatPins[targetCat].push(pin);
            }
          }
        });
        delete char.combatPins.utility;
      }

      if (Array.isArray(char.combatPins.offense) && char.combatPins.offense.length > 0) {
        char.combatPins.offense.forEach(pin => {
          if (!pin || !pin.name) return;
          const target = resolvePinTarget(pin);
          if (!char.combatPins[target]) char.combatPins[target] = [];
          if (!char.combatPins[target].some(p => (p.name || '').toLowerCase() === (pin.name || '').toLowerCase())) {
            char.combatPins[target].push(pin);
          }
        });
        delete char.combatPins.offense;
      }

      // Helper: detect active ability or spell effect in an equipped item
      function inspectItemActiveAbility(item) {
        if (!item || !item.name || item.name === '-') return null;
        const name = (item.name || '').toLowerCase();
        const desc = (item.desc || item.benefit || item.description || '').toLowerCase();
        const fullText = name + ' ' + desc;

        const hasDailyCharges = item.dailyCharges || (item.charges !== undefined && item.charges !== null && item.charges > 0) || (item.maxCharges && item.maxCharges > 0);
        const mentionsActivation = /(\d+)\s*\/\s*day|per day|command word|use-activated|at will|casts?\b|activat/i.test(fullText);
        const mentionsSpellOrPower = /(fireball|lightning bolt|magic missile|scorching ray|cure|heal|shield|dimension door|teleport|haste|invisibility|fly|true seeing|blur|mirror image|barkskin|protection from|flame blade|flaming|frost|shock|shocking grasp|vampiric touch|cone of cold|disintegrate|chain lightning|sound burst)/i.test(fullText);

        const isPurePassiveStat = /^(cloak of resistance|belt of giant strength|ring of protection|amulet of natural armor|bracers of armor|headband of intellect|periapt of wisdom|gloves of dexterity)/i.test(name.trim());
        if (isPurePassiveStat && !hasDailyCharges && !mentionsActivation) {
          return null;
        }

        const isActive = hasDailyCharges || mentionsActivation || mentionsSpellOrPower;
        if (!isActive) return null;

        const isDefense = /(shield|protection|resist|saving|counter|ac\b|dodge|deflect|ward|barrier|fortification|displacement|stoneskin|endure)/i.test(fullText);
        const isRanged = /(arrow|bow|crossbow|sling|dart|shuriken|quiver)/i.test(fullText);
        const isSpellAtk = /(acid arrow|scorching ray|fireball|ray of frost|magic missile|disintegrate|orb of|lightning bolt)/i.test(fullText);

        let cat = isDefense ? 'defense' : (isSpellAtk ? 'offense_spell' : (isRanged ? 'offense_ranged' : 'offense_melee'));

        const dmgExpr = typeof findDiceExpression === 'function' ? findDiceExpression(item.desc || item.benefit || '') : '';
        let badge = dmgExpr || '';
        if (!badge) {
          if (hasDailyCharges) {
            badge = `${item.charges || item.dailyCharges}/day`;
          } else {
            badge = item.category || 'Active';
          }
        }

        return {
          isActive: true,
          category: cat,
          badge: badge,
          action: 'Standard',
          desc: item.desc || item.benefit || 'Equipped item active property.'
        };
      }

      // 1. Gather all current target auto-items
      const currentAutoPins = [];

      // A. Readied maneuvers
      const readiedManeuvers = char.tomeOfBattle?.readiedManeuvers || [];
      readiedManeuvers.forEach(m => {
        if (!m || !m.name) return;
        const mName = (m.name || '').toLowerCase();
        const mDesc = (m.notes || m.benefit || '').toLowerCase();
        const mDisc = (m.discipline || '').toLowerCase();
        const mAction = (m.action || 'Standard').toLowerCase();
        const fullText = mName + ' ' + mDesc + ' ' + mDisc;

        let cat = 'offense_melee';
        if (mDisc.includes('setting sun') || mAction.includes('immediate') || /(counter|block|wall of blades|shield|save|ac\b|dodge|defense|mind over body|moment of perfect mind|action before thought|iron heart focus)/i.test(fullText)) {
          cat = 'defense';
        }

        const dmgExpr = m.damageDice || (typeof findDiceExpression === 'function' ? findDiceExpression(m.notes || m.benefit) : '');
        currentAutoPins.push({
          autoKey: `maneuver_${m.name.toLowerCase()}`,
          autoType: 'readied_maneuver',
          category: cat,
          name: m.name,
          sourceType: 'Maneuver',
          action: m.action || 'Standard',
          badge: dmgExpr || m.discipline || 'Maneuver',
          desc: m.notes || m.benefit || ''
        });
      });

      // B. Known stances
      const stancesKnown = char.tomeOfBattle?.stancesKnown || [];
      stancesKnown.forEach(st => {
        if (!st || !st.name) return;
        const stName = (st.name || '').toLowerCase();
        const stDesc = (st.benefit || '').toLowerCase();
        const fullText = stName + ' ' + stDesc;

        let cat = 'offense_melee';
        const hasPositiveDef = /(\+\d+\s*(?:to\s*)?(?:ac|dodge|armor|shield|deflect)|counter|\bblock\b|roots of the mountain|bolstering|clarity|pearl of black doubt|iron heart focus)/i.test(fullText);
        const hasAcPenaltyOnly = /(-\d+\s*(?:to\s*)?ac\b|penalty to ac)/i.test(fullText) && !hasPositiveDef;

        if (!hasAcPenaltyOnly && (hasPositiveDef || /(dodge|defense|saving throw|save\b|shield)/i.test(fullText))) {
          cat = 'defense';
        }

        const dmgExpr = st.damageDice || (typeof findDiceExpression === 'function' ? findDiceExpression(st.benefit) : '');
        currentAutoPins.push({
          autoKey: `stance_${st.name.toLowerCase()}`,
          autoType: 'known_stance',
          category: cat,
          name: st.name,
          sourceType: 'Stance',
          action: 'Swift',
          badge: dmgExpr || 'Stance',
          desc: st.benefit || ''
        });
      });

      // C. Equipped items with active abilities
      if (char.bodySlots) {
        Object.entries(char.bodySlots).forEach(([slotKey, item]) => {
          const activeData = inspectItemActiveAbility(item);
          if (activeData) {
            currentAutoPins.push({
              autoKey: `equipped_${slotKey}_${item.name.toLowerCase()}`,
              autoType: 'equipped_item',
              category: activeData.category,
              name: item.name,
              sourceType: item.category || 'Item',
              action: activeData.action,
              badge: activeData.badge,
              desc: activeData.desc
            });
          }
        });
      }

      // D. Belt items from gearPool
      if (Array.isArray(char.gearPool)) {
        char.gearPool.filter(g => g && g.isBelt && !g.isEquipped && g.category !== 'Consumable' && !/potion|scroll|wand/i.test(g.name || '')).forEach(item => {
          const name = (item.name || '').toLowerCase();
          const desc = (item.desc || '').toLowerCase();
          const fullText = name + ' ' + desc;

          let cat = /(shield|barkskin|armor|defense|protection|dodge|save|resist)/i.test(fullText) ? 'defense' : 'offense_melee';
          const badge = item.qty ? `${item.qty} Left` : (item.category || 'Belt');
          currentAutoPins.push({
            autoKey: `belt_${item.id || item.name.toLowerCase()}`,
            autoType: 'belt_item',
            category: cat,
            name: item.name,
            sourceType: item.category || 'Item',
            action: 'Standard',
            badge: badge,
            desc: item.desc || 'Quick-access belt item.'
          });
        });
      }

      // E. Special Abilities (Monster breath weapons, active offensive strikes, fear aura, counters)
      if (Array.isArray(char.specialAbilities)) {
        char.specialAbilities.forEach(a => {
          if (!a || !a.name) return;
          const aName = (a.name || '').toLowerCase();
          const aBenefit = (a.benefit || a.desc || '').toLowerCase();
          const fullText = aName + ' ' + aBenefit;

          // Exclude pure passive DR/SR from attack pin drawers (they are displayed in special defense card)
          const isPureDrSr = /^(damage reduction|spell resistance)\s*\d+/i.test(aName.trim()) && !/breath|attack|aura|burst/i.test(fullText);
          if (isPureDrSr) return;

          const isBreath = /breath weapon|cone of|line of/i.test(fullText);
          const isAttack = isBreath || /gaze|frightful|fear|swallow|rend|constrict|trample|pounce|rake|poison|spit|tail sweep|crush|roar|smite/i.test(fullText);
          const isDefensive = /aura|ward|counter|shield|resistance|immunity|fortification/i.test(fullText) && !isBreath && !isAttack;

          if (isAttack || isDefensive) {
            let cat = isDefensive ? 'defense' : (isBreath ? 'offense_melee' : 'offense_melee');
            if (/ranged|ray|bolt|spit/i.test(fullText) && !isBreath) cat = 'offense_ranged';

            const dmgExpr = typeof findDiceExpression === 'function' ? findDiceExpression(a.benefit || a.desc || '') : '';
            const badge = dmgExpr || (a.type ? `[${a.type}]` : 'Special');

            currentAutoPins.push({
              autoKey: `special_${a.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              autoType: 'special_ability',
              category: cat,
              name: a.name,
              sourceType: a.type ? `Special Ability (${a.type})` : 'Special Ability',
              action: isBreath ? 'Standard' : (a.action || 'Standard'),
              badge: badge,
              desc: a.benefit || a.desc || ''
            });
          }
        });
      }

      // Seamlessly tag existing pins matching current auto-pins if they don't have autoType yet
      const allCategories = ['offense_melee', 'offense_ranged', 'offense_spell', 'spell_control', 'spell_support', 'defense', 'offense'];
      currentAutoPins.forEach(autoPin => {
        if (!autoPin || !autoPin.name) return;
        const autoNameLower = (autoPin.name || '').toLowerCase();
        allCategories.forEach(c => {
          const match = (char.combatPins[c] || []).find(p => (p && p.name ? p.name : '').toLowerCase() === autoNameLower);
          if (match && !match.autoType) {
            match.autoType = autoPin.autoType;
            match.autoKey = autoPin.autoKey;
            if (!match.badge && autoPin.badge) match.badge = autoPin.badge;
          }
        });
      });

      // 2. Reconcile with character.combatPins:
      // Remove outdated auto-pins that no longer match any current auto-item
      const validAutoKeys = new Set(currentAutoPins.map(p => p.autoKey));
      allCategories.forEach(c => {
        if (Array.isArray(char.combatPins[c])) {
          char.combatPins[c] = char.combatPins[c].filter(p => {
            if (!p) return false;
            if (!p.autoType) return true; // Keep manual pins
            return validAutoKeys.has(p.autoKey);
          });
        }
      });

      // 3. Migrate auto-pins to updated category if not manually overridden by user
      currentAutoPins.forEach(autoPin => {
        if (!autoPin || !autoPin.name) return;
        const autoNameLower = (autoPin.name || '').toLowerCase();
        allCategories.forEach(c => {
          if (c !== autoPin.category && Array.isArray(char.combatPins[c])) {
            const wrongIdx = char.combatPins[c].findIndex(p => p && p.autoType && (p.name || '').toLowerCase() === autoNameLower && (!p.pinTarget || p.pinTarget === 'auto'));
            if (wrongIdx !== -1) {
              const [moved] = char.combatPins[c].splice(wrongIdx, 1);
              moved.category = autoPin.category;
              if (!char.combatPins[autoPin.category]) char.combatPins[autoPin.category] = [];
              if (!char.combatPins[autoPin.category].some(p => (p && p.name ? p.name : '').toLowerCase() === autoNameLower)) {
                char.combatPins[autoPin.category].push(moved);
              }
            }
          }
        });
      });

      // 4. Add missing auto-pins
      currentAutoPins.forEach(autoPin => {
        if (!autoPin || !autoPin.name) return;
        const autoNameLower = (autoPin.name || '').toLowerCase();
        let exists = false;
        allCategories.forEach(c => {
          if ((char.combatPins[c] || []).some(p => (p && p.name ? p.name : '').toLowerCase() === autoNameLower)) {
            exists = true;
          }
        });

        if (!exists) {
          if (!char.combatPins[autoPin.category]) char.combatPins[autoPin.category] = [];
          char.combatPins[autoPin.category].push({
            id: 'auto_' + autoPin.autoKey + '_' + Date.now(),
            autoKey: autoPin.autoKey,
            autoType: autoPin.autoType,
            name: autoPin.name,
            sourceType: autoPin.sourceType,
            action: autoPin.action,
            badge: autoPin.badge,
            desc: autoPin.desc
          });
        }
      });
    }

    function renderSpecialDefenses() {
      const card = document.getElementById('cockpit-special-defenses-card');
      const list = document.getElementById('cockpit-special-def-list');
      const countBadge = document.getElementById('cockpit-special-def-count');
      if (!card || !list) return;

      if (!character) {
        card.classList.add('hidden');
        return;
      }

      const items = [];

      // 1. Direct fields: character.dr, character.sr, character.immunities
      if (character.dr) {
        const val = String(character.dr);
        const label = val.toLowerCase().startsWith('dr') ? val : `DR ${val}`;
        items.push({
          type: 'dr',
          name: label,
          label: label,
          icon: '🛡️',
          bgClass: 'bg-amber-950/80 text-amber-300 border-amber-500/60 hover:border-amber-400',
          benefit: `Damage Reduction (DR): ${val}`
        });
      }
      if (character.sr) {
        const val = String(character.sr);
        const label = val.toLowerCase().startsWith('sr') ? val : `SR ${val}`;
        items.push({
          type: 'sr',
          name: label,
          label: label,
          icon: '🔮',
          bgClass: 'bg-purple-950/80 text-purple-300 border-purple-500/60 hover:border-purple-400',
          benefit: `Spell Resistance (SR): ${val}`
        });
      }
      if (Array.isArray(character.immunities)) {
        character.immunities.forEach(imm => {
          if (!imm) return;
          const label = String(imm);
          items.push({
            type: 'immunity',
            name: label,
            label: `${label} (Immune)`,
            icon: '✨',
            bgClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:border-emerald-400',
            benefit: `Immunity: ${label}`
          });
        });
      } else if (typeof character.immunities === 'string' && character.immunities) {
        items.push({
          type: 'immunity',
          name: character.immunities,
          label: `${character.immunities} (Immune)`,
          icon: '✨',
          bgClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:border-emerald-400',
          benefit: `Immunity: ${character.immunities}`
        });
      }

      // 2. Scan character.specialAbilities for DR, SR, Immunities, Subtypes, Resistances
      (character.specialAbilities || []).forEach(a => {
        if (!a) return;
        const name = typeof a === 'string' ? a : (a.name || '');
        const benefit = typeof a === 'object' ? (a.benefit || a.desc || '') : '';
        const full = (name + ' ' + benefit).toLowerCase();

        // Avoid duplicating if already captured via direct field
        if (items.some(it => it.name.toLowerCase() === name.toLowerCase())) return;

        if (/damage reduction|\bdr\s*\d+/i.test(full)) {
          items.push({
            type: 'dr',
            name: name,
            label: name,
            icon: '🛡️',
            bgClass: 'bg-amber-950/80 text-amber-300 border-amber-500/60 hover:border-amber-400',
            benefit: benefit || `Damage Reduction: ${name}`
          });
        } else if (/spell resistance|\bsr\s*\d+/i.test(full)) {
          items.push({
            type: 'sr',
            name: name,
            label: name,
            icon: '🔮',
            bgClass: 'bg-purple-950/80 text-purple-300 border-purple-500/60 hover:border-purple-400',
            benefit: benefit || `Spell Resistance: ${name}`
          });
        } else if (/immunit|immune\b|subtype.*\(immunit/i.test(full)) {
          items.push({
            type: 'immunity',
            name: name,
            label: name,
            icon: '✨',
            bgClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:border-emerald-400',
            benefit: benefit || `Immunity: ${name}`
          });
        } else if (/resistance\s*\d+|\bresist\b/i.test(full) && !/spell resistance/i.test(full)) {
          items.push({
            type: 'resistance',
            name: name,
            label: name,
            icon: '🛡️',
            bgClass: 'bg-sky-950/80 text-sky-300 border-sky-500/60 hover:border-sky-400',
            benefit: benefit || `Resistance: ${name}`
          });
        }
      });

      if (items.length === 0) {
        card.classList.add('hidden');
        return;
      }

      card.classList.remove('hidden');
      if (countBadge) countBadge.textContent = items.length;

      list.innerHTML = items.map(it => {
        const safeName = (it.name || '').replace(/'/g, "\\'");
        const safeTip = (it.benefit || '').replace(/"/g, '&quot;');
        return `
          <button type="button" onclick="showFeatDetail('${safeName}', null, 'ability')" title="${safeTip}" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border ${it.bgClass} shadow-sm transition active:scale-95 cursor-pointer">
            <span>${it.icon}</span>
            <span class="truncate max-w-[150px]">${it.label}</span>
          </button>
        `;
      }).join('');
    }

    function renderCombatCockpit() {
      if (!character) return;
      if (!character.tactical) {
        character.tactical = {
          powerAttack: 0, flanking: false, charge: false, higherGround: false,
          combatExpertise: 0, fightingDefensively: false, totalDefense: false,
          shieldBlockActive: false, round: 1
        };
      }
      if (!character.combatPins) {
        character.combatPins = { offense_melee: [], offense_ranged: [], offense_spell: [], spell_control: [], spell_support: [], defense: [], combat_skills: [] };
      }
      if (!character.weaponAttackProfiles) {
        character.weaponAttackProfiles = {};
      }

      // Automated Pin Sync: Readied maneuvers, known stances, equipped active items, belt items, monster abilities & Skill pin migration
      try {
        syncAutomatedCombatPins(character);
      } catch (err) {
        console.warn('syncAutomatedCombatPins error:', err);
      }

      // Ensure qualified modifiers pool & clean unowned entries
      try {
        ensureActiveModifiersPool();
      } catch (err) {
        console.warn('ensureActiveModifiersPool error:', err);
      }

      // Live Special Defenses & V2 Active Condition Blocker Banner
      try {
        renderSpecialDefenses();
        if (window.DnDUI && typeof window.DnDUI.renderConditionWarningBanner === 'function') {
          window.DnDUI.renderConditionWarningBanner(character, 'combat-condition-warning-banner');
        }
      } catch (err) {
        console.warn('renderSpecialDefenses error:', err);
      }

      // 1. Round Tracker
      const roundEl = document.getElementById('combat-round-val');
      if (roundEl) roundEl.textContent = character.tactical.round || 1;

      // 2. Defense Column Live AC & Vitals
      const acNormal = document.getElementById('cockpit-ac-normal');
      const acTouch = document.getElementById('cockpit-ac-touch');
      const acFlat = document.getElementById('cockpit-ac-flat');

      const ce = character.tactical.combatExpertise || 0;
      const fd = character.tactical.fightingDefensively || false;
      const td = character.tactical.totalDefense || false;
      const sb = character.tactical.shieldBlockActive || false;

      const skillList = Array.isArray(character.skills) ? character.skills : Object.values(character.skills || {});
      const tumbleSkill = skillList.find(s => s && s.name && s.name.toLowerCase() === 'tumble');
      const tumbleRanks = tumbleSkill ? (Number(tumbleSkill.ranks) || 0) : 0;
      const fdDodge = tumbleRanks >= 5 ? 3 : 2;
      const tdDodge = tumbleRanks >= 5 ? 6 : 4;

      let extraDodge = 0;
      if (ce > 0) extraDodge += ce;
      if (fd) extraDodge += fdDodge;
      if (td) extraDodge += tdDodge;
      if (sb) extraDodge += 4;

      const bd = character.acBreakdown || {};
      if (acNormal) acNormal.textContent = bd.total || 21;
      if (acTouch) acTouch.textContent = bd.touch || 16;
      if (acFlat) acFlat.textContent = bd.flat || 18;

      // Collapsed Bar Summaries
      const defSummary = document.getElementById('combat-defense-collapsed-summary');
      if (defSummary && acNormal && acTouch && acFlat) {
        defSummary.textContent = `AC: ${acNormal.textContent} | Touch: ${acTouch.textContent} | Flat: ${acFlat.textContent}`;
      }
      const physSummary = document.getElementById('combat-physical-collapsed-summary');
      if (physSummary) {
        physSummary.textContent = `${character.activeWeapon || 'No Weapon'}`;
      }
      const consSummary = document.getElementById('combat-consumables-collapsed-summary');
      if (consSummary) {
        const beltItems = (character.gearPool || []).filter(g => g && g.isBelt && !g.isEquipped);
        consSummary.textContent = `${beltItems.length} Belt / Consumable Items`;
      }

      // Stepper & Toggles
      const ceValEl = document.getElementById('combat-expertise-val');
      if (ceValEl) ceValEl.textContent = ce;
      const fdInput = document.getElementById('toggle-fighting-defensively');
      if (fdInput) fdInput.checked = fd;
      const tdInput = document.getElementById('toggle-total-defense');
      if (tdInput) tdInput.checked = td;

      // Update Tumble synergy label notes
      const fdExp = document.getElementById('fd-explanation');
      if (fdExp) fdExp.textContent = `-4 Atk / +${fdDodge} AC ${tumbleRanks >= 5 ? '(Tumble 5+)' : ''}`;
      const tdExp = document.getElementById('td-explanation');
      if (tdExp) tdExp.textContent = `+${tdDodge} AC ${tumbleRanks >= 5 ? '(Tumble 5+)' : ''} • No Attacks`;

      // Attack Button Locked State if Total Defense
      const atkBtn = document.getElementById('main-attack-roll-btn');
      const atkBtnText = document.getElementById('main-attack-btn-text');
      if (atkBtn && atkBtnText) {
        if (td) {
          atkBtn.disabled = true;
          atkBtn.className = 'w-full py-3 bg-slate-800 text-slate-400 font-bold text-xs md:text-sm rounded-xl border border-slate-700 cursor-not-allowed opacity-75';
          atkBtnText.textContent = '🛡️ ATTACK LOCKED (TOTAL DEFENSE ACTIVE)';
        } else {
          atkBtn.disabled = false;
          atkBtn.className = 'w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm md:text-base rounded-xl shadow-lg border border-red-400/40 flex items-center justify-center gap-2 transition transform active:scale-[0.98]';
          atkBtnText.textContent = 'ROLL ATTACK';
        }
      }

      // Combat Skills card (4 Core Defaults + User-Pinned Skills)
      try { renderCombatSkillsCard(); } catch (e) { console.error('renderCombatSkillsCard error:', e); }

      // AoO Bonus Badge
      const aooBadge = document.getElementById('aoo-bonus-badge');
      if (aooBadge) {
        const wep = (character.weapons || []).find(w => w.name === character.activeWeapon) || character.weapons?.[0];
        if (wep && RuleEngine) {
          const evalResult = RuleEngine.evaluateWeaponAttack(character, wep, { grip: '1-Hand' });
          const firstAtk = evalResult.iteratives?.[0] || 0;
          aooBadge.textContent = (firstAtk >= 0 ? '+' : '') + firstAtk;
        }
      }

      // 3. Offense Column: Weapon Sets, Off-Hand Selector & TWF
      try { renderWeaponSetsUI(); } catch (e) { console.error('renderWeaponSetsUI error:', e); }
      try { renderOffHandSelector(); } catch (e) { console.error('renderOffHandSelector error:', e); }
      try { syncCombatGripUI(); } catch (e) { console.error('syncCombatGripUI error:', e); }
      try { renderSavedProfiles(); } catch (e) { console.error('renderSavedProfiles error:', e); }
      try { renderOffenseModifiersGrid(); } catch (e) { console.error('renderOffenseModifiersGrid error:', e); }
      try { recalculateOffense(); } catch (e) { console.error('recalculateOffense error:', e); }

      // 4. Utility Column: Quick Consumables
      try { renderCockpitConsumables(); } catch (e) { console.error('renderCockpitConsumables error:', e); }

      // 5. Pin Drawers (Spell, Defense, and Ranged Ammunition Drawers)
      try { renderCombatPins('offense_spell'); } catch (e) { console.error("renderCombatPins('offense_spell') error:", e); }
      try { renderCombatPins('spell_control'); } catch (e) { console.error("renderCombatPins('spell_control') error:", e); }
      try { renderCombatPins('spell_support'); } catch (e) { console.error("renderCombatPins('spell_support') error:", e); }
      try { renderCombatPins('offense_ranged'); } catch (e) { console.error("renderCombatPins('offense_ranged') error:", e); }
      try { renderCombatPins('defense'); } catch (e) { console.error("renderCombatPins('defense') error:", e); }
      try { renderDefenseModifiersGrid(); } catch (e) { console.error("renderDefenseModifiersGrid error:", e); }
      try { if (typeof populateRangedWeaponAndAmmoUI === 'function') populateRangedWeaponAndAmmoUI(); } catch (e) {}

      // 6. Spellcasting Cockpit & Panels State
      try { initCockpitPanelsState(); } catch (e) { console.error('initCockpitPanelsState error:', e); }
      try { renderSpellSlotsStrip(); } catch (e) { console.error('renderSpellSlotsStrip error:', e); }
      try { populateCombatSpells(); } catch (e) { console.error('populateCombatSpells error:', e); }
      try { renderCombatCategorySpells(); } catch (e) { console.error('renderCombatCategorySpells error:', e); }
      try { if (typeof renderSpellTacticalModifiers === 'function') renderSpellTacticalModifiers(); } catch (e) { console.error('renderSpellTacticalModifiers error:', e); }
      try { recalculateCombatSpell(); } catch (e) { console.error('recalculateCombatSpell error:', e); }
    }

    // --- OFF-HAND & TWF SELECTOR ---
    function renderOffHandSelector() {
      const select = document.getElementById('active-offhand-select');
      if (!select) return;

      const currentMainWep = character.activeWeapon || character.tactical?.weaponSets?.set1?.mainWeapon;
      const mainIsTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(currentMainWep) : false;
      const hasOversized = typeof RuleEngine !== 'undefined' ? RuleEngine.hasOversizedWeaponFeat(character) : false;

      if (mainIsTwoHand && !hasOversized) {
        select.innerHTML = '<option value="None" selected>None / Empty (Main Hand 2H Weapon)</option>';
        select.value = 'None';
        select.disabled = true;
        character.activeOffHand = 'None';

        const modeBadge = document.getElementById('offhand-slot-mode-badge');
        const statusMain = document.getElementById('offhand-status-main');
        const statusDetail = document.getElementById('offhand-status-detail');
        if (modeBadge) {
          modeBadge.textContent = '🔒 Two-Handed Weapon';
          modeBadge.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800';
        }
        if (statusMain) statusMain.textContent = 'Off-Hand Locked';
        if (statusDetail) {
          statusDetail.textContent = `🔒 Main-hand "${currentMainWep}" is wielded two-handed`;
          statusDetail.className = 'text-[10px] font-semibold text-slate-400';
        }
        const twfBadge = document.getElementById('twf-bonus-badge');
        if (twfBadge) twfBadge.classList.add('hidden');
        return;
      }

      select.disabled = false;
      const currentVal = character.activeOffHand || 'None';
      select.innerHTML = '<option value="None">None / Empty (Single Weapon)</option>';

      // Equipped shield
      const offHandItem = character.bodySlots?.offHand;
      if (offHandItem && offHandItem.name && offHandItem.name !== '-') {
        const isShield = offHandItem.category === 'Shield' || (offHandItem.desc && offHandItem.desc.toLowerCase().includes('shield'));
        const opt = document.createElement('option');
        opt.value = offHandItem.name;
        opt.textContent = `${offHandItem.name} ${isShield ? '(Shield Bash)' : '(Off-Hand)'}`;
        if (currentVal === offHandItem.name) opt.selected = true;
        select.appendChild(opt);
      }

      // Other light weapons in gearPool or weapons
      (character.weapons || []).forEach(w => {
        if (w.name !== character.activeWeapon) {
          const opt = document.createElement('option');
          opt.value = w.name;
          opt.textContent = `${w.name} (Off-Hand Weapon)`;
          if (currentVal === w.name) opt.selected = true;
          select.appendChild(opt);
        }
      });

      // Update Slot 2 Status Cards (Dual Equip Slots)
      const modeBadge = document.getElementById('offhand-slot-mode-badge');
      const statusMain = document.getElementById('offhand-status-main');
      const statusDetail = document.getElementById('offhand-status-detail');

      if (currentVal === 'None' || !currentVal) {
        if (modeBadge) {
          modeBadge.textContent = 'Free Hand';
          modeBadge.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800';
        }
        if (statusMain) statusMain.textContent = 'None / Empty';
        if (statusDetail) {
          statusDetail.textContent = '🖐️ Free Hand (Spell & Maneuver Ready)';
          statusDetail.className = 'text-[10px] font-semibold text-slate-400';
        }
      } else {
        const offHandItem = character.bodySlots?.offHand;
        const isShield = offHandItem && offHandItem.name === currentVal && (offHandItem.category === 'Shield' || (offHandItem.desc && offHandItem.desc.toLowerCase().includes('shield')));
        if (isShield) {
          if (modeBadge) {
            modeBadge.textContent = '🛡️ Shield Equipped';
            modeBadge.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/50';
          }
          if (statusMain) statusMain.textContent = `Shield: ${offHandItem.name}`;
          const acBonus = offHandItem.armorBonus || offHandItem.shieldBonus || (offHandItem.name.includes('+1') ? 2 : 1);
          if (statusDetail) {
            statusDetail.textContent = `🛡️ +${acBonus} AC Shield Bonus Active`;
            statusDetail.className = 'text-[10px] font-semibold text-emerald-400';
          }
        } else {
          // Off-hand weapon
          const secondWep = (character.weapons || []).find(w => w.name === currentVal);
          if (modeBadge) {
            modeBadge.textContent = '⚔️ Off-Hand Weapon (TWF)';
            modeBadge.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-700/50';
          }
          if (statusMain) statusMain.textContent = `Weapon: ${currentVal}`;
          const dmgDice = secondWep?.damage || '1d4';
          const crit = secondWep?.crit || '19-20/x2';
          if (statusDetail) {
            statusDetail.textContent = `⚔️ Off-Hand: ${dmgDice} (${crit})`;
            statusDetail.className = 'text-[10px] font-semibold text-cyan-300';
          }
        }
      }

      // TWF Summary Badge
      const twfBadge = document.getElementById('twf-bonus-badge');
      if (twfBadge) {
        const isTWFActive = (character.activeModifiers || []).some(m => m.active && m.name.includes('TWF'));
        if (isTWFActive) {
          twfBadge.classList.remove('hidden');
          const offHandItem = character.bodySlots?.offHand;
          const isShield = offHandItem && offHandItem.name === currentVal && (offHandItem.category === 'Shield' || (offHandItem.desc && offHandItem.desc.toLowerCase().includes('shield')));
          const hasImpShieldBash = (character.feats || []).some(f => (typeof f === 'string' ? f : f.name).toLowerCase().includes('improved shield bash'));
          let shieldWarning = '';
          if (isShield && !hasImpShieldBash) {
            shieldWarning = ' • ⚠️ Shield AC temporarily suppressed this round when bashing (RAW PHB p.125)';
          }
          twfBadge.innerHTML = `⚔️ Two-Weapon Fighting Active: Main Hand (Gold) • Off-Hand (Cyan)${shieldWarning}`;
        } else {
          twfBadge.classList.add('hidden');
        }
      }
    }

    function onOffHandChange() {
      const select = document.getElementById('active-offhand-select');
      if (!select) return;

      const currentMainWep = character.activeWeapon || character.tactical?.weaponSets?.set1?.mainWeapon;
      const mainIsTwoHand = typeof RuleEngine !== 'undefined' ? RuleEngine.isTwoHandedWeapon(currentMainWep) : false;
      const hasOversized = typeof RuleEngine !== 'undefined' ? RuleEngine.hasOversizedWeaponFeat(character) : false;

      // Rule 1: Prevent equipping another weapon in the off-hand
      if (mainIsTwoHand && !hasOversized && select.value !== 'None') {
        select.value = 'None';
        character.activeOffHand = 'None';
        if (typeof showToast === 'function') {
          showToast(`Your main-hand weapon "${currentMainWep}" is two-handed! Cannot equip an off-hand weapon or shield without Monkey Grip.`, 'warning');
        }
        return;
      }

      character.activeOffHand = select.value;
      saveStateToStorage(false);
      renderCombatCockpit();
      recalculateOffense();
    }

    // --- TACTICAL DEFENSE CONTROLS ---
    function adjustCombatExpertise(delta) {
      if (!character.tactical) character.tactical = {};
      const bab = character.bab || 3;
      const cur = character.tactical.combatExpertise || 0;
      character.tactical.combatExpertise = Math.max(0, Math.min(bab, cur + delta));
      saveStateToStorage(false);
      renderAll();
    }

    function onToggleFightingDefensively() {
      if (!character.tactical) character.tactical = {};
      character.tactical.fightingDefensively = !character.tactical.fightingDefensively;
      if (character.tactical.fightingDefensively) {
        character.tactical.totalDefense = false;
      }
      saveStateToStorage(false);
      renderDefenseModifiersGrid();
      if (typeof recalculateDefense === 'function') recalculateDefense();
      if (typeof recalculateOffense === 'function') recalculateOffense();
      renderHUD();
      if (typeof renderCombatCockpit === 'function') renderCombatCockpit();
    }

    function onToggleTotalDefense() {
      if (!character.tactical) character.tactical = {};
      character.tactical.totalDefense = !character.tactical.totalDefense;
      if (character.tactical.totalDefense) {
        character.tactical.fightingDefensively = false;
      }
      saveStateToStorage(false);
      renderDefenseModifiersGrid();
      if (typeof recalculateDefense === 'function') recalculateDefense();
      if (typeof recalculateOffense === 'function') recalculateOffense();
      renderHUD();
      if (typeof renderCombatCockpit === 'function') renderCombatCockpit();
    }

    function adjustPowerAttack(delta) {
      const input = document.getElementById('power-attack-val');
      if (!input) return;
      const bab = character.bab || 3;
      const cur = parseInt(input.value) || 0;
      input.value = Math.max(0, Math.min(bab, cur + delta));
      recalculateOffense();
    }

    // --- REACTIVE MANEUVERS & COUNTERS ---
    function triggerShieldBlockReaction() {
      if (!character.tactical) character.tactical = {};
      const nextState = !character.tactical.shieldBlockActive;
      character.tactical.shieldBlockActive = nextState;
      saveStateToStorage(false);
      renderDefenseModifiersGrid();
      if (typeof recalculateDefense === 'function') recalculateDefense();
      renderHUD();
      if (typeof renderCombatCockpit === 'function') renderCombatCockpit();
      if (nextState) {
        showDiceTopToast({
          icon: '🛡️',
          title: 'Shield Block Triggered!',
          breakdown: 'Devoted Spirit: Immediate +4 Shield AC active until next turn.',
          total: '+4 Shield AC'
        });
        addDiceHistoryEntry({
          icon: '🛡️',
          title: 'Shield Block Reaction',
          formula: '+4 Shield AC',
          breakdown: 'Immediate Action counter defense triggered',
          total: '+4 AC'
        });
      }
    }

    function rollAttackOfOpportunity() {
      const wepName = character.activeWeapon || character.tactical?.weaponSets?.set1?.mainWeapon || 'Unarmed Strike';
      const wep = (character.weapons || []).find(w => w && w.name === wepName) || findWeaponEverywhere(wepName) || { name: 'Unarmed Strike', dice: '1d3', critMin: 20, critMult: 2, dmgType: 'Bludgeoning', isLight: true };
      if (!wep) return;
      const d20 = Math.floor(Math.random() * 20) + 1;
      const evalResult = RuleEngine.evaluateWeaponAttack(character, wep, { grip: '1-Hand' });
      const firstAtk = evalResult.iteratives?.[0] || 0;
      const totalAtk = d20 + firstAtk;

      // Damage roll
      let diceSides = 6;
      let diceCount = 1;
      const match = evalResult.baseDice.match(/(\d+)d(\d+)/i);
      if (match) {
        diceCount = parseInt(match[1]) || 1;
        diceSides = parseInt(match[2]) || 6;
      }
      let dmgRollSum = 0;
      const rolls = [];
      for (let i = 0; i < diceCount; i++) {
        const r = Math.floor(Math.random() * diceSides) + 1;
        rolls.push(r);
        dmgRollSum += r;
      }
      const totalDmg = dmgRollSum + evalResult.netFlatDamage;

      const diceList = [{ type: 'd20', value: d20 }];
      rolls.forEach(r => diceList.push({ type: 'd' + diceSides, value: r }));

      const finalizeAoO = () => {
        showDiceTopToast({
          icon: '⚔️',
          title: `Attack of Opportunity (AoO): ${wep.name}`,
          breakdown: `Atk: ${totalAtk} (d20:${d20}) • Damage: ${totalDmg} (${evalResult.baseDice}[${rolls.join('+')}]+${evalResult.netFlatDamage})`,
          total: `${totalDmg} HP Damage`
        });
        addDiceHistoryEntry({
          icon: '⚔️',
          title: `Attack of Opportunity: ${wep.name}`,
          formula: `d20+${firstAtk} & ${evalResult.baseDice}+${evalResult.netFlatDamage}`,
          breakdown: `Atk: ${totalAtk} (d20:${d20}) • Dmg: ${totalDmg}`,
          total: `${totalDmg} Damage`
        });
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function') {
        try {
          Dice3D.roll(diceList, finalizeAoO);
        } catch (e) { finalizeAoO(); }
      } else {
        finalizeAoO();
      }
    }

    function getCombatSkillInfo(skillName) {
      if (!character || !skillName) return { name: skillName || 'Skill', total: 0, formatted: '+0' };
      const target = String(skillName).toLowerCase().trim();
      const isMerged = character.settings?.mergeSkills !== false;

      // 1. Check Consolidated Skills if active or explicitly named
      if (typeof DND35_CONSOLIDATED_SKILLS !== 'undefined' && Array.isArray(DND35_CONSOLIDATED_SKILLS)) {
        const conDef = DND35_CONSOLIDATED_SKILLS.find(c =>
          c.name.toLowerCase() === target ||
          c.key.toLowerCase() === target ||
          (isMerged && c.components.some(comp => comp === target))
        );
        if (conDef && (isMerged || conDef.name.toLowerCase() === target)) {
          const compSkills = (character.skills || []).filter(s => conDef.components.includes(s.key));
          const ranks = Math.max(0, ...compSkills.map(s => Number(s.ranks) || 0));
          const misc = Math.max(0, ...compSkills.map(s => Number(s.misc) || 0));
          const statMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.[conDef.stat] || 10) : 0;
          const acpVal = conDef.acp ? (character.acBreakdown?.acp || 0) : 0;
          const evalSkillObj = (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateSkillBonus)
            ? RuleEngine.evaluateSkillBonus(character, conDef.key, conDef.name, conDef.stat)
            : { total: Number(character.buffSkillBonus) || 0 };
          const total = ranks + statMod + misc - acpVal + (Number(evalSkillObj.total) || 0);
          return {
            name: skillName,
            total,
            formatted: (total >= 0 ? '+' : '') + total
          };
        }
      }

      // 2. Check Standard Character Skills (exact match first, then includes)
      const skills = character.skills || [];
      let sk = skills.find(s => s && s.name && s.name.toLowerCase().trim() === target);
      if (!sk) {
        sk = skills.find(s => s && s.name && s.name.toLowerCase().includes(target));
      }
      if (!sk) {
        return { name: skillName, total: 0, formatted: '+0' };
      }

      const statMod = RuleEngine ? RuleEngine.getAbilityMod(character.abilities?.[sk.stat] || 10) : 0;
      const acpVal = sk.acp ? (character.acBreakdown?.acp || 0) : 0;
      const evalSkillObj = (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateSkillBonus)
        ? RuleEngine.evaluateSkillBonus(character, sk.key || sk.name, sk.name, sk.stat)
        : { total: Number(character.buffSkillBonus) || 0 };
      const total = (Number(sk.ranks) || 0) + statMod + (Number(sk.misc) || 0) - acpVal + (Number(evalSkillObj.total) || 0);
      return {
        name: sk.name || skillName,
        total,
        formatted: (total >= 0 ? '+' : '') + total
      };
    }

    function renderCombatSkillsCard() {
      const grid = document.getElementById('combat-skills-grid');
      if (!grid || !character) return;

      const coreSkills = [
        { name: 'Concentration', label: 'Concentration' },
        { name: 'Tumble', label: 'Tumble' },
        { name: 'Jump', label: 'Jump' },
        { name: 'Spot', label: 'Spot / Listen' }
      ];

      const coreLowerSet = new Set(['concentration', 'tumble', 'jump', 'spot', 'spot / listen']);
      const pinnedSkills = (typeof getPinsForDrawer === 'function' ? getPinsForDrawer('combat_skills') : [])
        .filter(p => p && p.name && !coreLowerSet.has(p.name.toLowerCase().trim()));

      const countBadge = document.getElementById('combat-skills-pins-badge');
      if (countBadge) {
        countBadge.textContent = String(coreSkills.length + pinnedSkills.length);
      }

      const coreHtml = coreSkills.map(cs => {
        const info = getCombatSkillInfo(cs.name);
        const safeName = cs.name.replace(/'/g, "\\'");
        const modColor = info.total >= 0 ? 'text-emerald-400' : 'text-rose-400';
        return `
          <button type="button" onclick="rollCombatSkill('${safeName}')" class="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 rounded px-2 py-1.5 text-left text-xs text-slate-200 hover:text-white flex items-center justify-between gap-1.5 transition cursor-pointer" title="Roll 1d20${info.formatted} ${cs.label} Check">
            <span class="truncate">${cs.label}</span>
            <span class="font-mono font-bold ${modColor} text-xs shrink-0">${info.formatted}</span>
          </button>
        `;
      }).join('');

      const pinnedHtml = pinnedSkills.map(pin => {
        const info = getCombatSkillInfo(pin.name);
        const safeName = String(pin.name).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const modColor = info.total >= 0 ? 'text-sky-300' : 'text-rose-400';
        return `
          <div onclick="rollCombatSkill('${safeName}')" class="bg-sky-950/35 hover:bg-sky-900/50 border border-sky-800/70 hover:border-sky-400 rounded px-2 py-1.5 text-left text-xs text-sky-100 hover:text-white flex items-center justify-between gap-1 transition cursor-pointer group" title="Roll 1d20${info.formatted} ${pin.name} Check">
            <span class="truncate font-medium">${pin.name}</span>
            <div class="flex items-center gap-1 shrink-0">
              <span class="font-mono font-bold ${modColor} text-xs">${info.formatted}</span>
              <button type="button" onclick="event.stopPropagation(); unpinCombatSkill('${safeName}')" class="text-slate-500 hover:text-rose-400 text-[11px] font-bold px-0.5 leading-none transition cursor-pointer" title="Unpin ${pin.name} from Combat Skills">×</button>
            </div>
          </div>
        `;
      }).join('');

      grid.innerHTML = coreHtml + pinnedHtml;
    }

    function unpinCombatSkill(skillName) {
      if (!character || !skillName) return;
      removeCombatPinByName(skillName);
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '📌',
        title: 'Skill Unpinned',
        breakdown: `"${skillName}" removed from 🎯 Combat Skills.`,
        total: 'Removed'
      });
    }

    function rollCombatSkill(skillName) {
      const info = getCombatSkillInfo(skillName);
      const bonus = info.total;
      const d20 = Math.floor(Math.random() * 20) + 1;
      const total = d20 + bonus;
      const signStr = bonus >= 0 ? `+ ${bonus}` : `- ${Math.abs(bonus)}`;
      const formulaSign = bonus >= 0 ? `+${bonus}` : `${bonus}`;

      const finalizeSkill = () => {
        showDiceTopToast({
          icon: '🎯',
          title: `${skillName} Check`,
          breakdown: `Roll: d20 (${d20}) ${signStr} = ${total}`,
          total: `${total}`
        });
        addDiceHistoryEntry({
          icon: '🎯',
          title: `${skillName} Roll`,
          formula: `d20${formulaSign}`,
          breakdown: `d20 (${d20}) ${signStr} = ${total}`,
          total: `${total}`
        });
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function') {
        try {
          Dice3D.roll([{ type: 'd20', value: d20 }], finalizeSkill);
        } catch (e) { finalizeSkill(); }
      } else {
        finalizeSkill();
      }
    }

    // --- QUICK CONSUMABLES BELT ---
    function renderCockpitConsumables() {
      const listEl = document.getElementById('cockpit-consumables-list');
      if (!listEl) return;

      // 1. Daily-charge items from equipped body slots or inventory (Witchlight Reservoir, Healing Belt, Boots of Speed, etc.)
      const dailyItems = [];
      if (character.bodySlots) {
        Object.entries(character.bodySlots).forEach(([slotKey, item]) => {
          if (!item) return;
          const dc = ensureItemDailyCharges(item);
          if (dc) {
            dailyItems.push({
              item,
              slotKey,
              isSlot: true,
              dailyCharges: dc
            });
          }
        });
      }
      if (Array.isArray(character.gearPool)) {
        character.gearPool.forEach(g => {
          if (!g) return;
          const dc = ensureItemDailyCharges(g);
          if (dc && !dailyItems.some(x => x.item.name === g.name)) {
            dailyItems.push({
              item: g,
              slotKey: null,
              isSlot: false,
              dailyCharges: dc
            });
          }
        });
      }

      // 2. Standard consumables (Potions, Scrolls, Wands)
      const normalConsumables = (character.gearPool || []).filter(g =>
        (g.category === 'Consumable' || (g.name && (g.name.includes('Potion') || g.name.includes('Wand') || g.name.includes('Scroll')))) &&
        !ensureItemDailyCharges(g)
      );

      if (dailyItems.length === 0 && normalConsumables.length === 0) {
        listEl.innerHTML = '<div class="text-[11px] text-slate-500 italic p-2 text-center">No quick-access consumables or daily-charge items on belt.</div>';
        return;
      }

      let html = '';

      // Daily-Charge Items
      if (dailyItems.length > 0) {
        html += dailyItems.map(({ item, slotKey, isSlot, dailyCharges: dc }) => {
          const lower = (item.name || '').toLowerCase();
          const isHeal = lower.includes('heal');
          const isSpeed = lower.includes('speed') || lower.includes('boot');
          const icon = isHeal ? '💚' : (isSpeed ? '🏃' : '⚡');
          const isRoundUnit = (dc.unit === 'rounds' || dc.unit === 'tur' || dc.unit === 'turn');
          const active = isRoundUnit && isItemBuffActive(item);

          if (isRoundUnit) {
            return `
              <div class="bg-slate-900/90 border ${active ? 'border-cyan-500/80 shadow-cyan-950/50 shadow-md ring-1 ring-cyan-500/30' : 'border-amber-900/50 hover:border-amber-500/50'} rounded-lg p-2 flex items-center justify-between gap-2 shadow-sm transition">
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-bold text-amber-200 flex items-center gap-1.5 truncate">
                    <span>${icon}</span>
                    <span class="truncate">${item.name}</span>
                    ${isSlot ? `<span class="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700 uppercase">${slotKey}</span>` : ''}
                    ${active ? `<span class="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-sm animate-pulse">⚡ ACTIVE</span>` : ''}
                  </div>
                  <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span class="text-slate-500">Daily:</span>
                    <span class="font-mono font-bold text-amber-400 bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-600/50 shadow-inner">⚡ ${dc.current}/${dc.max}</span>
                    <span class="text-slate-500">${dc.unit || 'rounds'}</span>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button type="button" onclick="castDailyRoundItem('${encodeURIComponent(item.name)}', '${slotKey || ''}')"
                          class="py-1 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] rounded-lg shadow transition active:scale-95 flex items-center gap-1 cursor-pointer"
                          title="Spend 1 Round & Activate" ${dc.current <= 0 ? 'disabled' : ''}>
                    <span>✨</span>
                    <span>Cast (+1)</span>
                  </button>
                  <button type="button" onclick="dischargeDailyRoundItem('${encodeURIComponent(item.name)}', '${slotKey || ''}')"
                          class="py-1 px-2.5 bg-gradient-to-r from-rose-800 to-red-700 hover:from-rose-700 hover:to-red-600 text-white font-extrabold text-[11px] rounded-lg shadow transition active:scale-95 flex items-center gap-1 cursor-pointer ${!active ? 'opacity-40 cursor-not-allowed' : ''}"
                          title="End Effect" ${!active ? 'disabled' : ''}>
                    <span>🛑</span>
                    <span>End</span>
                  </button>
                </div>
              </div>
            `;
          }

          const opts = getItemDailyOptions(item);
          const hasMultipleOpts = opts.length > 1;
          const btnLabel = hasMultipleOpts ? 'Select & Use' : 'Use (-1)';

          return `
            <div class="bg-slate-900/90 border border-amber-900/50 hover:border-amber-500/50 rounded-lg p-2 flex items-center justify-between gap-2 shadow-sm transition">
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-amber-200 flex items-center gap-1.5 truncate">
                  <span>${icon}</span>
                  <span class="truncate">${item.name}</span>
                  ${isSlot ? `<span class="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700 uppercase">${slotKey}</span>` : ''}
                </div>
                <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span class="text-slate-500">Daily:</span>
                  <span class="font-mono font-bold text-amber-400 bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-600/50 shadow-inner">⚡ ${dc.current}/${dc.max}</span>
                  <span class="text-slate-500">${dc.unit || 'charges'}</span>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                ${isSlot ? `
                  <div class="inline-flex items-center rounded border border-slate-700 bg-slate-800 text-[10px] font-mono overflow-hidden">
                    <button type="button" onclick="event.stopPropagation(); spendSlotCharge('${slotKey}', 1)" title="Spend 1 Charge" class="px-1.5 py-0.5 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer" ${dc.current <= 0 ? 'disabled' : ''}>-</button>
                    <button type="button" onclick="event.stopPropagation(); restoreSlotCharge('${slotKey}', 1)" title="Restore 1 Charge" class="px-1.5 py-0.5 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer" ${dc.current >= dc.max ? 'disabled' : ''}>+</button>
                  </div>
                ` : ''}
                <button type="button" onclick="consumeCockpitDailyItem('${encodeURIComponent(item.name)}', '${slotKey || ''}')"
                        class="py-1 px-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-extrabold text-[11px] rounded-lg shadow transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        ${dc.current <= 0 ? 'disabled' : ''}>
                  <span>${icon}</span>
                  <span>${btnLabel}</span>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }

      // Standard Consumables (Potions, Scrolls, etc.)
      if (normalConsumables.length > 0) {
        html += normalConsumables.map((item) => {
          const isPotion = item.name.toLowerCase().includes('potion');
          const isWand = item.name.toLowerCase().includes('wand');
          const isScroll = item.name.toLowerCase().includes('scroll');
          const icon = isPotion ? '🧪' : (isWand ? '✨' : '📜');
          const btnColor = isPotion ? 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500' : 'from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500';

          let actionLabel = 'Use';
          if (item.name.includes('Cure Serious')) actionLabel = 'Drink (+3d8+5 HP)';
          else if (item.name.includes('Cure')) actionLabel = 'Drink (Heal)';
          else if (item.name.includes('Bull')) actionLabel = 'Drink (+4 STR)';
          else if (isWand) actionLabel = 'Activate (2d4+2)';
          else if (isPotion) actionLabel = 'Drink';
          else if (isScroll) actionLabel = 'Read';

          return `
            <div class="bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex items-center justify-between gap-2 shadow-sm">
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                  <span>${icon}</span>
                  <span class="truncate">${item.name}</span>
                </div>
                <div class="text-[10px] text-slate-400">Qty: <strong class="text-amber-400 font-mono">${item.qty || 1}</strong> • ${item.desc ? item.desc.slice(0, 32) + '...' : ''}</div>
              </div>
              <button onclick="consumeCockpitItem('${encodeURIComponent(item.name)}')" class="shrink-0 py-1 px-2.5 bg-gradient-to-r ${btnColor} text-white font-extrabold text-[11px] rounded-lg shadow transition active:scale-95 flex items-center gap-1 cursor-pointer" ${(item.qty || 1) <= 0 ? 'disabled' : ''}>
                <span>${icon}</span>
                <span>${actionLabel}</span>
              </button>
            </div>
          `;
        }).join('');
      }

      listEl.innerHTML = html;
    }

    function consumeCockpitItem(encodedName) {
      const name = decodeURIComponent(encodedName);

      // If it is a daily-charge item, automatically route to consumeCockpitDailyItem
      let dailyItem = null;
      let dailySlotKey = null;
      if (character.bodySlots) {
        for (const [sk, sItem] of Object.entries(character.bodySlots)) {
          if (sItem && sItem.name === name && ensureItemDailyCharges(sItem)) {
            dailyItem = sItem;
            dailySlotKey = sk;
            break;
          }
        }
      }
      if (!dailyItem && Array.isArray(character.gearPool)) {
        const gItem = character.gearPool.find(g => g && g.name === name);
        if (gItem && ensureItemDailyCharges(gItem)) {
          dailyItem = gItem;
        }
      }
      if (dailyItem) {
        consumeCockpitDailyItem(encodedName, dailySlotKey);
        return;
      }

      const item = (character.gearPool || []).find(g => g.name === name);
      if (!item || (item.qty || 1) <= 0) {
        showDiceTopToast({ icon: '⚠️', title: 'Depleted', breakdown: `No ${name} remaining in inventory.`, total: '0 Left' });
        return;
      }

      item.qty = (item.qty || 1) - 1;

      // Healing Potion
      if (name.toLowerCase().includes('cure serious')) {
        let sum = 0;
        const rolls = [];
        for (let i = 0; i < 3; i++) {
          const r = Math.floor(Math.random() * 8) + 1;
          rolls.push(r);
          sum += r;
        }
        const totalHeal = sum + 5;
        const prevHp = character.hp.current || 0;
        character.hp.current = Math.min(character.hp.max || 44, prevHp + totalHeal);
        const actualGain = character.hp.current - prevHp;

        showDiceTopToast({
          icon: '💚',
          title: `Drank ${name}!`,
          breakdown: `3d8+5 [${rolls.join('+')}]+5 = +${totalHeal} HP • HP: ${prevHp} ➔ ${character.hp.current}/${character.hp.max} (Remaining: ${item.qty})`,
          total: `+${actualGain} HP`
        });
        addDiceHistoryEntry({
          icon: '💚',
          title: `Consumed ${name}`,
          formula: '3d8+5',
          breakdown: `[${rolls.join('+')}]+5 = ${totalHeal} HP Healed`,
          total: `+${totalHeal} HP`
        });
      } else if (name.toLowerCase().includes('bull')) {
        showDiceTopToast({
          icon: '🧪',
          title: `Drank ${name}!`,
          breakdown: `+4 Enhancement STR (Active for 30 rounds) • Remaining: ${item.qty}`,
          total: '+4 STR'
        });
      } else if (name.toLowerCase().includes('wand of magic missile')) {
        const r1 = Math.floor(Math.random() * 4) + 1;
        const r2 = Math.floor(Math.random() * 4) + 1;
        const dmg = r1 + r2 + 2;
        showDiceTopToast({
          icon: '✨',
          title: `Activated ${name}!`,
          breakdown: `2 Missiles [${r1}+1, ${r2}+1] = ${dmg} Force Damage • Charges Left: ${item.qty}`,
          total: `${dmg} Damage`
        });
        addDiceHistoryEntry({
          icon: '✨',
          title: 'Wand of Magic Missile',
          formula: '2d4+2',
          breakdown: `2 Missiles [${r1}+1, ${r2}+1] = ${dmg} Force Damage`,
          total: `${dmg} Damage`
        });
      } else {
        showDiceTopToast({
          icon: '🧪',
          title: `Used ${name}!`,
          breakdown: `1 consumed. Remaining: ${item.qty}`,
          total: 'Used'
        });
      }

      saveStateToStorage(true);
      renderAll();
    }

    // --- MINI SLOTS & MANEUVERS ---
    function renderCockpitMiniSpellSlots() {
      const container = document.getElementById('cockpit-mini-spell-slots');
      if (!container) return;
      const slots = character.spellcasting?.slots || [];
      if (slots.length === 0) {
        container.innerHTML = '<div class="text-[10px] text-slate-500 italic">No spell slots.</div>';
        return;
      }
      container.innerHTML = slots.map((s, idx) => {
        const remaining = Math.max(0, (s.daily || 0) - (s.used || 0));
        return `
          <div class="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded px-2 py-1 text-xs">
            <span class="font-bold text-purple-300 text-[11px]">${s.name}: <strong class="font-mono text-white">${remaining}/${s.daily}</strong></span>
            <button onclick="spendMiniSpellSlot(${idx})" class="text-[10px] font-bold text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900 border border-purple-800/80 px-2 py-0.5 rounded transition" ${remaining <= 0 ? 'disabled' : ''}>
              ✨ Expend (-1)
            </button>
          </div>
        `;
      }).join('');
    }

    function spendMiniSpellSlot(idx) {
      const s = character.spellcasting?.slots?.[idx];
      if (!s) return;
      s.used = Math.min(s.daily || 0, (s.used || 0) + 1);
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({ icon: '🔮', title: `${s.name} Slot Expended`, breakdown: `Remaining: ${(s.daily || 0) - s.used}/${s.daily}`, total: '-1 Slot' });
    }

    function renderCockpitMiniManeuvers() {
      const container = document.getElementById('cockpit-mini-maneuvers');
      if (!container) return;
      const readied = character.tomeOfBattle?.readiedManeuvers || [];
      if (readied.length === 0) {
        container.innerHTML = '<div class="text-[10px] text-slate-500 italic">No readied maneuvers.</div>';
        return;
      }
      container.innerHTML = readied.map(m => {
        const isExpended = m.expended;
        return `
          <div class="px-2 py-1 rounded text-[11px] font-bold border flex items-center gap-1 ${isExpended ? 'bg-slate-900/40 border-slate-800 text-slate-500 line-through' : 'bg-indigo-950/50 border-indigo-500/60 text-indigo-300'}">
            <span>${isExpended ? '🔄' : '⚡'}</span>
            <span>${m.name}</span>
          </div>
        `;
      }).join('');
    }

    // --- ROUND ADVANCEMENT & REST ---
    function advanceCombatRound() {
      if (!character.tactical) character.tactical = {};
      character.tactical.round = (character.tactical.round || 1) + 1;

      // Reset 1-round temporary reactions
      let notes = [];
      if (character.tactical.shieldBlockActive) {
        character.tactical.shieldBlockActive = false;
        notes.push('Shield Block reset');
      }
      if (character.tactical.charge) {
        character.tactical.charge = false;
        const cBox = document.getElementById('mod-charge');
        if (cBox) cBox.checked = false;
        notes.push('Charge AC penalty cleared');
      }

      saveStateToStorage(false);
      renderAll();
      showDiceTopToast({
        icon: '⏱️',
        title: `Round ${character.tactical.round} Started!`,
        breakdown: notes.length > 0 ? notes.join(' • ') : 'All 1-round reactions refreshed.',
        total: `Round ${character.tactical.round}`
      });
    }

    function triggerCockpitShortRest() {
      if (character.tomeOfBattle && Array.isArray(character.tomeOfBattle.readiedManeuvers)) {
        character.tomeOfBattle.readiedManeuvers.forEach(m => m.expended = false);
      }
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '⚡',
        title: 'Short Rest Complete',
        breakdown: 'Martial Adept: All readied maneuvers recovered!',
        total: 'Maneuvers Ready'
      });
    }

    function triggerCockpitLongRest() {
      if (confirm('🌙 Take a Long Rest (8 Hours) and restore HP, all daily spell slots, and maneuvers?')) {
        // Refill HP
        if (character.hp) character.hp.current = character.hp.max || 44;
        // Refill spell slots
        if (character.spellcasting && Array.isArray(character.spellcasting.slots)) {
          character.spellcasting.slots.forEach(s => s.used = 0);
        }
        // Refill maneuvers
        if (character.tomeOfBattle && Array.isArray(character.tomeOfBattle.readiedManeuvers)) {
          character.tomeOfBattle.readiedManeuvers.forEach(m => m.expended = false);
        }
        // Reset tactical
        if (character.tactical) {
          character.tactical.combatExpertise = 0;
          character.tactical.fightingDefensively = false;
          character.tactical.totalDefense = false;
          character.tactical.shieldBlockActive = false;
          character.tactical.round = 1;
        }
        saveStateToStorage(true);
        renderAll();
        showDiceTopToast({
          icon: '🌙',
          title: 'Long Rest Complete!',
          breakdown: 'HP, daily spell slots, and maneuvers restored.',
          total: 'All Resources Restored'
        });
      }
    }

    // --- ACTIVE PROFILE PREVIEW PILLS ---
    // --- SAVED COMBAT PROFILES ENGINE ---
    function renderSavedProfiles() {
      const container = document.getElementById('active-profile-pills-preview');
      const countEl = document.getElementById('active-profile-count');
      const titleEl = document.getElementById('active-profile-box-title');
      if (!container) return;

      const currentMode = window._combatOffenseMode || 'melee';
      const isRanged = currentMode === 'ranged';

      if (titleEl) {
        titleEl.textContent = isRanged ? 'SAVED ATTACK PROFILES (RANGED)' : 'SAVED ATTACK PROFILES (MELEE)';
      }

      if (!character.tactical) character.tactical = {};
      if (!Array.isArray(character.tactical.savedProfiles)) {
        character.tactical.savedProfiles = [
          {
            id: 'prof_default_1',
            name: 'Punishing Stance',
            mode: 'melee',
            powerAttack: 0,
            flanking: false,
            charge: false,
            higherGround: false,
            activeModifiers: ['Punishing Stance'],
            summary: '1d6'
          }
        ];
      }

      // Filter by active mode (melee vs ranged)
      const profiles = character.tactical.savedProfiles.filter(p => (p.mode || 'melee') === currentMode);

      if (countEl) countEl.textContent = `${profiles.length} Saved`;

      if (profiles.length === 0) {
        container.innerHTML = `<span class="text-[10px] text-slate-500 italic">No saved ${isRanged ? 'ranged' : 'melee'} profiles yet. Click "💾 Save" above to create one.</span>`;
        return;
      }

      const icon = isRanged ? '🏹' : '⚔️';
      container.innerHTML = profiles.map(prof => `
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 hover:border-amber-500/80 text-xs text-amber-300 transition group shadow-sm select-none">
          <button type="button" onclick="applySavedProfile('${prof.id}')" class="font-bold flex items-center gap-1 cursor-pointer text-left" title="Apply Profile: ${prof.name}">
            <span>${icon}</span>
            <span class="hover:underline">${prof.name}</span>
            <span class="text-[10px] text-slate-400 font-mono">(${prof.summary || 'Mod'})</span>
          </button>
          <button type="button" onclick="deleteSavedProfile('${prof.id}', event)" class="w-4 h-4 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center text-[11px] font-bold transition ml-0.5 cursor-pointer" title="Delete Profile">×</button>
        </div>
      `).join('');
    }

    function renderActiveProfilePills() {
      renderSavedProfiles();
    }

    function openSaveProfileModal() {
      const modal = document.getElementById('modal-weapon-profile-settings');
      if (!modal) return;

      const currentMode = window._combatOffenseMode || 'melee';
      const isRanged = currentMode === 'ranged';

      const titleEl = document.getElementById('profile-modal-weapon-name');
      if (titleEl) {
        titleEl.textContent = `Save ${isRanged ? '🏹 Ranged' : '⚔️ Melee'} Attack Profile`;
      }

      const nameInput = document.getElementById('save-profile-name-input');
      if (nameInput) {
        nameInput.value = '';
        setTimeout(() => nameInput.focus(), 60);
      }

      const previewEl = document.getElementById('save-profile-summary-preview');
      if (previewEl) {
        if (!isRanged) {
          const pa = parseInt(document.getElementById('power-attack-val')?.value) || 0;
          const fl = document.getElementById('mod-flanking')?.checked ?? false;
          const ch = document.getElementById('mod-charge')?.checked ?? false;
          const hg = document.getElementById('mod-higher-ground') ? document.getElementById('mod-higher-ground').checked : (character.tactical?.higherGround ?? false);
          const activeMods = (character.activeModifiers || []).filter(m => m.active);

          const summary = buildProfileSummary(pa, fl, ch, hg, activeMods);
          previewEl.innerHTML = `
            <div><b class="text-white">Type:</b> ⚔️ Melee Combat</div>
            <div><b class="text-white">Weapon:</b> ${character.activeWeapon || 'Unarmed Strike'} (${document.getElementById('active-grip-select')?.value || '1-Hand'})</div>
            <div><b class="text-white">Modifiers:</b> ${summary}</div>
          `;
        } else {
          const t = character.tactical || {};
          const rangedParts = [];
          if (t.pointBlank) rangedParts.push('Point Blank (+1/+1)');
          if (t.rapidShot) rangedParts.push('Rapid Shot (+1 Shot/-2 Atk)');
          if (t.manyshot) rangedParts.push('Manyshot');
          if (t.preciseShot) rangedParts.push('Precise Shot');
          if (t.farShot) rangedParts.push('Far Shot');
          const activeMods = (character.activeModifiers || []).filter(m => m.active);
          activeMods.forEach(m => rangedParts.push(m.dice || m.name));
          const summary = rangedParts.join(', ') || 'Base Shot';
          previewEl.innerHTML = `
            <div><b class="text-white">Type:</b> 🏹 Ranged Combat</div>
            <div><b class="text-white">Weapon:</b> ${character.activeWeapon || 'Ranged Weapon'}</div>
            <div><b class="text-white">Modifiers:</b> ${summary}</div>
          `;
        }
      }

      modal.classList.remove('hidden');
    }

    function openWeaponProfileModal() {
      openSaveProfileModal();
    }

    function closeSaveProfileModal() {
      const modal = document.getElementById('modal-weapon-profile-settings');
      if (modal) modal.classList.add('hidden');
    }

    function closeWeaponProfileModal() {
      closeSaveProfileModal();
    }

    function confirmSaveProfile() {
      const currentMode = window._combatOffenseMode || 'melee';
      const isRanged = currentMode === 'ranged';
      const nameInput = document.getElementById('save-profile-name-input');
      const name = (nameInput?.value || '').trim() || `${isRanged ? 'Ranged' : 'Melee'} Profile ` + ((character.tactical?.savedProfiles?.length || 0) + 1);

      if (!character.tactical) character.tactical = {};
      if (!Array.isArray(character.tactical.savedProfiles)) character.tactical.savedProfiles = [];

      let newProf = {
        id: 'prof_' + Date.now(),
        name: name,
        mode: currentMode,
        weapon: character.activeWeapon || (isRanged ? 'Ranged Weapon' : 'Unarmed Strike')
      };

      if (!isRanged) {
        const pa = parseInt(document.getElementById('power-attack-val')?.value) || 0;
        const fl = document.getElementById('mod-flanking')?.checked ?? false;
        const ch = document.getElementById('mod-charge')?.checked ?? false;
        const hg = document.getElementById('mod-higher-ground') ? document.getElementById('mod-higher-ground').checked : (character.tactical?.higherGround ?? false);
        const activeMods = (character.activeModifiers || []).filter(m => m.active);
        newProf.powerAttack = pa;
        newProf.flanking = fl;
        newProf.charge = ch;
        newProf.higherGround = hg;
        newProf.activeModifiers = activeMods.map(m => m.name);
        newProf.summary = buildProfileSummary(pa, fl, ch, hg, activeMods);
      } else {
        const t = character.tactical || {};
        const rangedMods = {
          pointBlank: !!t.pointBlank,
          rapidShot: !!t.rapidShot,
          manyshot: !!t.manyshot,
          preciseShot: !!t.preciseShot,
          farShot: !!t.farShot
        };
        const activeMods = (character.activeModifiers || []).filter(m => m.active);
        newProf.rangedMods = rangedMods;
        newProf.activeModifiers = activeMods.map(m => m.name);
        const rangedParts = [];
        if (t.pointBlank) rangedParts.push('Point Blank (+1/+1)');
        if (t.rapidShot) rangedParts.push('Rapid Shot');
        if (t.manyshot) rangedParts.push('Manyshot');
        if (t.preciseShot) rangedParts.push('Precise Shot');
        if (t.farShot) rangedParts.push('Far Shot');
        activeMods.forEach(m => rangedParts.push(m.dice || m.name));
        newProf.summary = rangedParts.join(', ') || 'Base Shot';
      }

      character.tactical.savedProfiles.push(newProf);
      saveStateToStorage(true);
      closeSaveProfileModal();
      renderSavedProfiles();

      showDiceTopToast({
        icon: '💾',
        title: 'Profile Saved',
        breakdown: `"${name}" (${isRanged ? 'Ranged' : 'Melee'}) profile saved successfully.`,
        total: 'Saved'
      });
    }

    function applySavedProfile(profId) {
      const prof = (character.tactical?.savedProfiles || []).find(p => p.id === profId);
      if (!prof) return;

      const profMode = prof.mode || 'melee';
      const isRanged = profMode === 'ranged';

      // If user is currently in the other mode, switch to the profile's mode first
      if (window._combatOffenseMode !== profMode) {
        switchCombatOffenseMode(profMode);
      }

      if (!isRanged) {
        const paInput = document.getElementById('power-attack-val');
        if (paInput) paInput.value = prof.powerAttack || 0;

        const flInput = document.getElementById('mod-flanking');
        if (flInput) flInput.checked = !!prof.flanking;

        const chInput = document.getElementById('mod-charge');
        if (chInput) chInput.checked = !!prof.charge;

        const hgInput = document.getElementById('mod-higher-ground');
        if (hgInput) hgInput.checked = !!prof.higherGround;

        (character.activeModifiers || []).forEach(m => {
          m.active = (prof.activeModifiers || []).includes(m.name);
        });

        recalculateOffense();
        renderOffenseModifiersGrid();
      } else {
        if (!character.tactical) character.tactical = {};
        const rm = prof.rangedMods || {};
        character.tactical.pointBlank = !!rm.pointBlank;
        character.tactical.rapidShot = !!rm.rapidShot;
        character.tactical.manyshot = !!rm.manyshot;
        character.tactical.preciseShot = !!rm.preciseShot;
        character.tactical.farShot = !!rm.farShot;

        (character.activeModifiers || []).forEach(m => {
          m.active = (prof.activeModifiers || []).includes(m.name);
        });

        if (typeof renderRangedModifiersGrid === 'function') renderRangedModifiersGrid();
        recalculateOffense();
      }

      renderSavedProfiles();

      showDiceTopToast({
        icon: isRanged ? '🏹' : '⚔️',
        title: 'Profile Loaded: ' + prof.name,
        breakdown: `${isRanged ? 'Ranged' : 'Melee'} attack and damage modifiers applied.`,
        total: 'Ready'
      });
    }

    function deleteSavedProfile(profId, event) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (!character.tactical?.savedProfiles) return;
      character.tactical.savedProfiles = character.tactical.savedProfiles.filter(p => p.id !== profId);
      saveStateToStorage(true);
      renderSavedProfiles();
      showDiceTopToast({
        icon: '🗑️',
        title: 'Profile Deleted',
        breakdown: 'Saved attack profile removed.',
        total: 'Deleted'
      });
    }

    function buildProfileSummary(pa, fl, ch, hg, activeMods) {
      const parts = [];
      if (pa > 0) parts.push(`PA -${pa}`);
      if (fl) parts.push('Flank');
      if (ch) parts.push('Charge');
      if (hg) parts.push('Higher');
      activeMods.forEach(m => parts.push(m.dice || m.name));
      return parts.join(', ') || 'Base';
    }

    // --- ATTACK DECISION TOAST & STRIKE AUTO-EXPEND ---
    function initiateCombatAttack() {
      if (character.tactical?.totalDefense) {
        showDiceTopToast({
          icon: '🛡️',
          title: 'Total Defense Active!',
          breakdown: 'You spent your standard action on Total Defense and cannot attack this turn.',
          total: 'Attack Locked'
        });
        return;
      }

      const toast = document.getElementById('attack-decision-toast');
      if (!toast) return;

      const subWep = document.getElementById('decision-toast-weapon-sub');
      if (subWep) subWep.textContent = `${character.activeWeapon || 'Weapon'} • BAB: +${character.bab || 3}`;

      const summaryEl = document.getElementById('decision-toast-active-summary');
      const activeMods = (character.activeModifiers || []).filter(m => m.active);
      if (summaryEl) {
        if (activeMods.length > 0) {
          summaryEl.textContent = activeMods.map(m => `${m.name} (${m.dice || '+0'})`).join(' • ');
        } else {
          summaryEl.textContent = 'Base weapon damage only (No active modifiers)';
        }
      }

      // Hide custom drawer by default
      const customDrawer = document.getElementById('decision-toast-custom-drawer');
      if (customDrawer) customDrawer.classList.add('hidden');

      toast.classList.remove('hidden');
    }

    function dismissAttackDecisionToast() {
      const toast = document.getElementById('attack-decision-toast');
      if (toast) toast.classList.add('hidden');
    }

    function toggleCustomizeAttackDrawer() {
      const drawer = document.getElementById('decision-toast-custom-drawer');
      if (!drawer) return;
      drawer.classList.toggle('hidden');

      if (!drawer.classList.contains('hidden')) {
        const listEl = document.getElementById('decision-toast-custom-modifiers-list');
        if (listEl) {
          listEl.innerHTML = (character.activeModifiers || []).map((mod, idx) => `
            <label class="flex items-center justify-between p-1.5 rounded bg-slate-950/80 border border-slate-800 cursor-pointer">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="decision-mod-check-${idx}" ${mod.active ? 'checked' : ''} class="w-3.5 h-3.5 rounded text-rose-500 border-slate-700 focus:ring-0">
                <span class="text-xs font-bold text-white">${mod.name}</span>
              </div>
              <span class="font-mono text-[10px] text-amber-300 font-bold">${mod.dice || '-'}</span>
            </label>
          `).join('');
        }
      }
    }

    function executeFullAttackRoll(isCustom) {
      dismissAttackDecisionToast();

      if (isCustom) {
        (character.activeModifiers || []).forEach((mod, idx) => {
          const cbox = document.getElementById(`decision-mod-check-${idx}`);
          if (cbox) mod.active = cbox.checked;
        });
        saveStateToStorage(false);
      }

      // Record which strike maneuvers and single-cast spells were active before roll
      const strikeManeuversUsed = [];
      let bladeOfBloodUsed = false;

      (character.activeModifiers || []).forEach(m => {
        if (m.active && m.source === 'Maneuver') {
          strikeManeuversUsed.push(m.name);
        }
        if (m.active && m.name === 'Blade of Blood') {
          bladeOfBloodUsed = true;
        }
      });

      // Execute 3D roll
      rollFullAttackWith3D();

      // Auto-expend strike maneuvers
      if (strikeManeuversUsed.length > 0 && character.tomeOfBattle?.readiedManeuvers) {
        strikeManeuversUsed.forEach(strikeName => {
          const m = character.tomeOfBattle.readiedManeuvers.find(rm => rm.name.toLowerCase() === strikeName.toLowerCase());
          if (m) m.expended = true;
          // Uncheck from activeModifiers so it doesn't apply to subsequent rolls until readied
          const mod = character.activeModifiers.find(am => am.name.toLowerCase() === strikeName.toLowerCase());
          if (mod) mod.active = false;
        });
      }

      // Auto-deduct Blade of Blood if used
      if (bladeOfBloodUsed) {
        const slot = character.spellcasting?.slots?.[1];
        if (slot) slot.used = Math.min(slot.daily || 8, (slot.used || 0) + 1);
        const mod = character.activeModifiers.find(am => am.name === 'Blade of Blood');
        if (mod) mod.active = false;
      }

      if (strikeManeuversUsed.length > 0 || bladeOfBloodUsed) {
        saveStateToStorage(true);
        setTimeout(() => {
          renderAll();
          if (strikeManeuversUsed.length > 0) {
            showDiceTopToast({
              icon: '⚡',
              title: 'Maneuver Expended!',
              breakdown: `${strikeManeuversUsed.join(', ')} executed and expended. Can be recovered via Swift Action.`,
              total: 'Maneuver Expended'
            });
          }
        }, 1200);
      }
    }

    // --- PIN DRAWERS (5 SLOTS EXPANDABLE) & GESTURES ---
    function togglePinDrawer(category) {
      window.combatDrawerExpanded[category] = !window.combatDrawerExpanded[category];
      const btn = document.getElementById(`toggle-${category}-pins-btn`);
      if (btn) {
        btn.textContent = window.combatDrawerExpanded[category] ? 'Collapse' : 'Show All';
      }
      renderCombatPins(category);
    }

    function renderCombatPins(category) {
      if (category === 'offense_ranged') return;
      if (category === 'defense') {
        renderDefenseModifiersGrid();
        return;
      }
      if (category === 'offense') {
        renderCombatPins('offense_melee');
        renderCombatPins('offense_spell');
        renderCombatPins('spell_control');
        renderCombatPins('spell_support');
        return;
      }

      const container = document.getElementById(`combat-pins-${category}`);
      const badge = document.getElementById(`${category}-pins-badge`);
      if (!container) return;

      let pins = getPinsForDrawer(category);
      if (!character.combatPins) character.combatPins = {};

      if (category === 'offense_ranged') {
        const activeRangedWep = getActiveCombatRangedWeapon(character);
        const at = activeRangedWep?.ammoType || 'arrow';
        if (pins.length === 0) {
          if (at === 'arrow') {
            pins.push(
              { name: 'Standard Arrow', sourceType: 'Ammunition', action: 'Free', badge: '1d8 Piercing • Normal', ammoVal: 'standard' },
              { name: 'Masterwork Arrow', sourceType: 'Ammunition', action: 'Free', badge: '+1 Attack', ammoVal: 'masterwork' },
              { name: '+1 Magic Arrow', sourceType: 'Ammunition', action: 'Free', badge: '+1 Atk & +1 Dmg', ammoVal: 'plus1' },
              { name: '+2 Magic Arrow', sourceType: 'Ammunition', action: 'Free', badge: '+2 Atk & +2 Dmg', ammoVal: 'plus2' },
              { name: 'Flaming Arrow', sourceType: 'Ammunition', action: 'Free', badge: '+1d6 Fire Damage', ammoVal: 'fire' },
              { name: 'Alchemical Silver Arrow', sourceType: 'Ammunition', action: 'Free', badge: 'Bypasses DR/Silver (-1 Dmg)', ammoVal: 'silver' },
              { name: 'Adamantine Arrow', sourceType: 'Ammunition', action: 'Free', badge: 'Bypasses DR/Adamantine & Hardness', ammoVal: 'adamantine' }
            );
          } else if (at === 'bolt') {
            pins.push(
              { name: 'Standard Bolt', sourceType: 'Ammunition', action: 'Free', badge: '1d8 Piercing • Normal', ammoVal: 'standard' },
              { name: 'Masterwork Bolt', sourceType: 'Ammunition', action: 'Free', badge: '+1 Attack', ammoVal: 'masterwork' },
              { name: '+1 Magic Bolt', sourceType: 'Ammunition', action: 'Free', badge: '+1 Atk & +1 Dmg', ammoVal: 'plus1' },
              { name: 'Flaming Bolt', sourceType: 'Ammunition', action: 'Free', badge: '+1d6 Fire Damage', ammoVal: 'fire' }
            );
          } else if (at === 'bullet') {
            pins.push(
              { name: 'Standard Bullet', sourceType: 'Ammunition', action: 'Free', badge: '1d4 Bludgeoning • Normal', ammoVal: 'standard' },
              { name: '+1 Magic Sling Bullet', sourceType: 'Ammunition', action: 'Free', badge: '+1 Atk & +1 Dmg', ammoVal: 'plus1' }
            );
          }
          const gearPool = [...(character.gearPool || []), ...(character.inventory || [])];
          gearPool.forEach(it => {
            if (!it) return;
            const iName = typeof it === 'string' ? it : (it.name || '');
            const low = iName.toLowerCase();
            if (low.includes('arrow') || low.includes('bolt') || low.includes('bullet') || it.attackType === 'ammunition' || it.category === 'Ammunition') {
              if (!pins.some(p => p.name.toLowerCase() === iName.toLowerCase())) {
                pins.push({
                  name: iName,
                  sourceType: 'Ammunition',
                  action: 'Free',
                  badge: `🎒 Inventory (${it.count || it.quantity || 1} Left)`,
                  ammoVal: `inv_${iName}`
                });
              }
            }
          });
        }
      }
      character.combatPins[category] = pins;

      if (badge) badge.textContent = pins.length;

      if (pins.length === 0) {
        container.innerHTML = `<div class="text-[11px] text-slate-500 italic p-3 text-center border border-dashed border-slate-800 rounded-lg">No items pinned to this drawer yet. (You can pin spells/abilities or change their target drawer.)</div>`;
        return;
      }

      const drawerLimit = Math.max(1, Math.min(9, Number(character.settings?.pinDrawerLimit) || 5));
      const isExpanded = window.combatDrawerExpanded[category];
      const visiblePins = isExpanded ? pins : pins.slice(0, drawerLimit);
      const isReorder = window.combatPinReorderMode[category];

      // Update drawer expand/collapse toggle button visibility and label
      const toggleBtn = document.getElementById(`toggle-${category}-pins-btn`);
      if (toggleBtn) {
        if (pins.length > drawerLimit) {
          toggleBtn.classList.remove('hidden');
          toggleBtn.textContent = isExpanded ? 'Collapse' : `Show All (${pins.length})`;
        } else {
          toggleBtn.classList.add('hidden');
        }
      }

      container.innerHTML = visiblePins.map((pin, idx) => {
        const dbItem = typeof findMasterItem === 'function' ? findMasterItem(pin.name) : null;
        const attackType = pin.attackType || dbItem?.attackType || '';
        const isTouchAttack = (attackType === 'ranged_touch' || attackType === 'melee_touch');

        let actionBtns = [];

        // If it's a touch attack spell (e.g. Melf's Acid Arrow, Scorching Ray, Vampiric Touch)
        if (isTouchAttack) {
          actionBtns.push(`<button type="button" onclick="event.stopPropagation(); rollSpellTouchAttack('${pin.name.replace(/'/g, "\\'")}')" class="py-1 px-2 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 text-amber-300 font-bold text-[10px] transition shrink-0 inline-flex items-center gap-1 cursor-pointer shadow-sm" title="Roll Touch Attack (BAB + DEX/STR)"><span>⚡</span><span>Touch</span></button>`);
        }

        const isAmmoPin = pin.sourceType === 'Ammunition' || pin.attackType === 'ammunition' || dbItem?.attackType === 'ammunition' || (category === 'offense_ranged' && (pin.ammoVal || pin.name.toLowerCase().includes('arrow') || pin.name.toLowerCase().includes('bolt') || pin.name.toLowerCase().includes('bullet')));
        if (isAmmoPin) {
          const selArrow = character.tactical?.selectedArrow || 'standard';
          const pinAmmoVal = pin.ammoVal || getAmmoValFromName(pin.name);
          const isSelected = (selArrow === pinAmmoVal) || (selArrow === `inv_${pin.name}`) || (selArrow.toLowerCase().includes(pin.name.toLowerCase()));
          actionBtns.push(`<button type="button" onclick="event.stopPropagation(); selectCombatAmmoPin('${pin.name.replace(/'/g, "\\'")}', '${pinAmmoVal}')" class="py-1 px-2.5 rounded font-bold text-[10px] transition shrink-0 flex items-center gap-1 cursor-pointer ${isSelected ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}">${isSelected ? '🏹 Equipped' : '🏹 Equip'}</button>`);
        } else if (pin.sourceType === 'Maneuver' || pin.sourceType === 'Stance') {
          actionBtns.push(`<button type="button" onclick="event.stopPropagation(); executePinAction('${category}', ${idx})" class="py-1 px-2 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-700/70 text-rose-300 font-bold text-[10px] transition shrink-0 cursor-pointer">⚡ Ready</button>`);
        } else if (pin.sourceType === 'Spell') {
          actionBtns.push(`<button type="button" onclick="event.stopPropagation(); executePinAction('${category}', ${idx})" class="py-1 px-2 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-700/70 text-purple-300 font-bold text-[10px] transition shrink-0 cursor-pointer">🔮 Cast</button>`);
        } else if (pin.sourceType === 'Consumable' || pin.autoType === 'belt_item') {
          actionBtns.push(`<button type="button" onclick="event.stopPropagation(); executePinAction('${category}', ${idx})" class="py-1 px-2 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/70 text-emerald-300 font-bold text-[10px] transition shrink-0 cursor-pointer">🧪 Use</button>`);
        } else if (pin.sourceType === 'Skill') {
          actionBtns.push(`<button type="button" onclick="event.stopPropagation(); executePinAction('${category}', ${idx})" class="py-1 px-2 rounded bg-sky-950/60 hover:bg-sky-900 border border-sky-700/70 text-sky-300 font-bold text-[10px] transition shrink-0 cursor-pointer">🎯 Roll</button>`);
        } else {
          // Feats, Special Abilities, Buffs: Interactive Active / Passive Toggle Button
          const isActive = Boolean(pin.active);
          actionBtns.push(`<button type="button" onclick="event.stopPropagation(); toggleCombatPinActive('${category}', ${idx})" class="py-1 px-2.5 rounded font-bold text-[10px] transition shrink-0 flex items-center gap-1 cursor-pointer ${isActive ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'}">${isActive ? '✓ Active' : '⚪ Passive'}</button>`);
        }

        const autoResolved = resolvePinTarget({ ...pin, pinTarget: 'auto' });
        const autoShortMap = {
          offense_spell: 'Spell: Offense',
          spell_control: 'Spell: Control',
          spell_support: 'Spell: Support',
          offense_melee: 'Martial: Melee',
          offense_ranged: 'Physical: Ranged',
          defense: 'Physical: Defense'
        };
        const autoShort = autoShortMap[autoResolved] || 'Auto';

        const quickDrawerSelect = `
          <select onclick="event.stopPropagation()" onchange="changePinTargetDirect('${pin.name.replace(/'/g, "\\'")}', this.value)" class="text-[9px] font-mono bg-slate-950 text-slate-300 border border-slate-700/80 rounded px-1.5 py-0.5 cursor-pointer hover:border-amber-500 transition shrink-0" title="Change Combat Drawer">
            <option value="auto" ${pin.pinTarget === 'auto' || !pin.pinTarget ? 'selected' : ''}>🎯 Auto (Rule Engine)</option>
            <option value="offense_spell" ${pin.pinTarget === 'offense_spell' ? 'selected' : ''}>⚔️ Spell: Offense</option>
            <option value="spell_control" ${pin.pinTarget === 'spell_control' ? 'selected' : ''}>🕸️ Spell: Control</option>
            <option value="spell_support" ${pin.pinTarget === 'spell_support' ? 'selected' : ''}>✨ Spell: Support</option>
            <option value="offense_melee" ${pin.pinTarget === 'offense_melee' ? 'selected' : ''}>⚔️ Physical: Melee</option>
            <option value="offense_ranged" ${pin.pinTarget === 'offense_ranged' ? 'selected' : ''}>🏹 Physical: Ranged</option>
            <option value="defense" ${pin.pinTarget === 'defense' ? 'selected' : ''}>🛡️ Physical: Defense</option>
          </select>
        `;

        const activeCardBorder = pin.active ? 'border-emerald-500/80 ring-1 ring-emerald-500/60 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900/90 hover:bg-slate-850';

        const reorderControls = isReorder ? `
          <div class="flex items-center gap-1 shrink-0">
            <button onclick="movePinItem('${category}', ${idx}, -1)" class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer" title="Move Up">▲</button>
            <button onclick="movePinItem('${category}', ${idx}, 1)" class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer" title="Move Down">▼</button>
          </div>
        ` : '';

        const iconSymbol = category === 'offense_melee' ? '⚔️' : (category === 'offense_ranged' ? '🏹' : (category === 'offense_spell' ? '⚔️' : (category === 'spell_control' ? '🕸️' : (category === 'spell_support' ? '✨' : '🛡️'))));
        const iconColor = category === 'offense_melee' ? 'text-rose-400' : (category === 'offense_ranged' ? 'text-amber-400' : (category === 'offense_spell' ? 'text-purple-400' : (category === 'spell_control' ? 'text-amber-400' : (category === 'spell_support' ? 'text-emerald-400' : 'text-indigo-400'))));

        return `
          <div id="pin-card-${category}-${idx}" class="pin-card relative group ${activeCardBorder} rounded-lg p-2 flex items-center justify-between gap-2 transition select-none cursor-pointer" onclick="onPinCardClick(event, '${category}', ${idx})">
            <!-- Pin Info -->
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="text-xs ${iconColor} shrink-0">
                ${iconSymbol}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-white truncate">${pin.name}</span>
                  <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">${formatActionShort(pin.action)}</span>
                </div>
                <div class="text-[10px] text-amber-300/80 font-mono truncate">${pin.badge || pin.desc || ''}</div>
              </div>
            </div>

            <!-- Drawer Switcher & Reorder & Action -->
            <div class="flex items-center gap-1.5 shrink-0" onclick="event.stopPropagation()">
              ${quickDrawerSelect}
              ${reorderControls}
              ${actionBtns.join('')}
            </div>

            <!-- Desktop Floating Tooltip -->
            <div class="pin-tooltip pointer-events-none absolute left-0 bottom-full mb-1.5 z-40 hidden group-hover:block bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-2xl max-w-xs w-64 text-xs text-slate-200 backdrop-blur-md">
              <div class="font-extrabold text-white text-xs mb-1 flex items-center justify-between">
                <span>${pin.name}</span>
                <span class="text-[10px] font-mono text-purple-300">${pin.sourceType || ''}</span>
              </div>
              <p class="text-[11px] text-slate-300 leading-snug">${pin.desc || 'No detailed description available.'}</p>
              <div class="text-[9px] text-slate-500 mt-1 italic">Mobile: Tap &amp; hold = Details • Long press = Reorder</div>
            </div>
          </div>
        `;
      }).join('');

      // Add "Done Reordering" toggle button if in reorder mode
      if (isReorder) {
        container.innerHTML += `
          <div class="pt-1 text-center">
            <button onclick="togglePinReorderMode('${category}')" class="py-1 px-3 bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold text-xs rounded-lg shadow transition cursor-pointer">
              ✓ Done Reordering
            </button>
          </div>
        `;
      }

      // Attach mobile touch gesture listeners
      visiblePins.forEach((pin, idx) => {
        const el = document.getElementById(`pin-card-${category}-${idx}`);
        if (el) attachPinMobileGestures(el, category, idx);
      });
    }

    // --- MOBILE GESTURES: ~500ms LONG PRESS FOR DETAIL, ~1200ms DEEP PRESS FOR REORDER ---
    function attachPinMobileGestures(el, category, idx) {
      let touchTimerShort = null;
      let touchTimerLong = null;
      let startX = 0, startY = 0;
      let progressRing = null;

      el.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;

        // Visual progress indicator ring
        progressRing = document.createElement('div');
        progressRing.className = 'absolute right-2 top-2 pointer-events-none w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin';
        el.appendChild(progressRing);

        // Timer 1: 500ms for Detail Modal
        touchTimerShort = setTimeout(() => {
          if (progressRing && progressRing.parentNode) progressRing.parentNode.removeChild(progressRing);
          openPinDetailsModalById(category, idx);
        }, 500);

        // Timer 2: 1200ms for Reorder Mode
        touchTimerLong = setTimeout(() => {
          clearTimeout(touchTimerShort);
          if (progressRing && progressRing.parentNode) progressRing.parentNode.removeChild(progressRing);
          togglePinReorderMode(category);
          showDiceTopToast({
            icon: '📌',
            title: 'Reorder Mode Active',
            breakdown: 'Use the ▲ / ▼ buttons to reorder pinned items.',
            total: 'Reordering'
          });
        }, 1200);
      }, { passive: true });

      const clearAll = () => {
        if (touchTimerShort) clearTimeout(touchTimerShort);
        if (touchTimerLong) clearTimeout(touchTimerLong);
        if (progressRing && progressRing.parentNode) progressRing.parentNode.removeChild(progressRing);
      };

      el.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (Math.abs(touch.clientX - startX) > 10 || Math.abs(touch.clientY - startY) > 10) {
          clearAll();
        }
      }, { passive: true });

      el.addEventListener('touchend', clearAll, { passive: true });
      el.addEventListener('touchcancel', clearAll, { passive: true });
    }

    function togglePinReorderMode(category) {
      window.combatPinReorderMode[category] = !window.combatPinReorderMode[category];
      renderCombatPins(category);
    }

    function movePinItem(category, idx, direction) {
      const pins = getPinsForDrawer(category);
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= pins.length) return;
      const temp = pins[idx];
      pins[idx] = pins[targetIdx];
      pins[targetIdx] = temp;
      if (!character.combatPins) character.combatPins = {};
      character.combatPins[category] = pins;
      saveStateToStorage(true);
      renderCombatPins(category);
    }

    function onPinCardClick(event, category, idx) {
      openPinDetailsModalById(category, idx);
    }

    function executePinAction(category, idx) {
      const pins = getPinsForDrawer(category);
      const pin = pins[idx] || character.combatPins?.[category]?.[idx];
      if (!pin) return;

      if (pin.sourceType === 'Maneuver' || pin.sourceType === 'Stance') {
        const mod = (character.activeModifiers || []).find(m => m.name.toLowerCase() === pin.name.toLowerCase());
        if (mod) {
          mod.active = !mod.active;
          showDiceTopToast({
            icon: '⚡',
            title: `${pin.name} ${mod.active ? 'Added to' : 'Removed from'} Rotation`,
            breakdown: `Damage: ${mod.dice || '-'} (${mod.type || ''})`,
            total: mod.active ? 'Active' : 'Passive'
          });
        } else {
          const formula = pin.badge || (typeof findDiceExpression === 'function' ? findDiceExpression(pin.desc) : '');
          if (formula && typeof rollSpellOrManeuverFormula === 'function') {
            rollSpellOrManeuverFormula(formula, `${pin.name} Damage`);
          } else {
            showDiceTopToast({
              icon: '⚡',
              title: `${pin.name} Readied`,
              breakdown: pin.desc || '',
              total: 'Ready'
            });
          }
        }
        saveStateToStorage(false);
        renderAll();
      } else if (pin.sourceType === 'Spell') {
        const formula = pin.badge || (typeof findDiceExpression === 'function' ? findDiceExpression(pin.desc) : '');
        if (formula && typeof rollSpellOrManeuverFormula === 'function') {
          rollSpellOrManeuverFormula(formula, `${pin.name} Effect`);
        } else {
          showDiceTopToast({
            icon: '🔮',
            title: `${pin.name} Readied`,
            breakdown: pin.desc || 'Spell readied.',
            total: 'Spell'
          });
        }
      } else if (pin.sourceType === 'Consumable' || pin.autoType === 'belt_item') {
        consumeCockpitItem(encodeURIComponent(pin.name));
      } else if (pin.sourceType === 'Skill') {
        rollCombatSkill(pin.name);
      } else {
        toggleCombatPinActive(category, idx);
      }
    }

    // --- TOGGLE PIN ACTIVE STATE (FOR FEATS & SPECIAL ABILITIES & BUFFS) ---
    function toggleCombatPinActive(category, idx) {
      const pins = getPinsForDrawer(category);
      const pin = pins[idx] || character.combatPins?.[category]?.[idx];
      if (!pin) return;

      pin.active = !pin.active;
      if (!character.tactical) character.tactical = {};
      if (!character.tactical.activeSpellModifiers) character.tactical.activeSpellModifiers = {};
      character.tactical.activeSpellModifiers[pin.name] = pin.active;
      character.tactical.activeSpellModifiers[`pin_${pin.name.replace(/\s+/g, '_')}`] = pin.active;
      character.tactical.activeSpellModifiers[`pin_${pin.name.toLowerCase().trim()}`] = pin.active;

      syncPinWithActiveModifiers(pin);
      saveStateToStorage(false);
      renderAll();

      showDiceTopToast({
        icon: '⚡',
        title: `${pin.name} ${pin.active ? 'Activated' : 'Deactivated'}`,
        breakdown: pin.active ? (pin.desc || 'Bonus included in combat rotation.') : 'Modifier deactivated.',
        total: pin.active ? 'Active' : 'Passive'
      });
    }

    function syncPinWithActiveModifiers(pin) {
      if (!character.activeModifiers) character.activeModifiers = [];
      const cleanName = String(pin.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
      const lower = cleanName.toLowerCase();

      const pinNameLower = (pin.name || '').toLowerCase();
      let mod = (character.activeModifiers || []).find(m => m && m.name && (m.name.toLowerCase() === lower || m.name.toLowerCase() === pinNameLower));

      if (pin.active) {
        if (!mod) {
          let bAtk = 0;
          let bDmg = 0;
          let bType = 'enhancement';
          let dice = '';

          // Enhance Arrow (+1, +2, +3, +4, +5)
          const enhanceMatch = lower.match(/enhance arrow\s*\+(\d+)/i) || (lower.includes('enhance arrow') ? [null, '1'] : null);
          if (enhanceMatch) {
            const val = parseInt(enhanceMatch[1]) || 1;
            bAtk = val;
            bDmg = val;
            bType = 'enhancement';
          } else if (lower.includes('point blank shot')) {
            bAtk = 1;
            bDmg = 1;
            bType = 'untyped';
          } else {
            // General parser for +N bonus in name or description
            const plusMatch = (pin.name + ' ' + (pin.desc || '')).match(/\+(\d+)\s*(attack|damage|enhancement|bonus)/i);
            if (plusMatch) {
              const val = parseInt(plusMatch[1]) || 1;
              bAtk = val;
              bDmg = val;
            }
            const diceMatch = (pin.name + ' ' + (pin.desc || '')).match(/(\d+d\d+)/i);
            if (diceMatch) {
              dice = diceMatch[1];
            }
          }

          mod = {
            name: cleanName,
            source: pin.sourceType || 'Feat',
            active: true,
            bonusAtk: bAtk,
            bonusDmg: bDmg,
            bonusType: bType,
            dice: dice,
            desc: pin.desc || ''
          };
          character.activeModifiers.push(mod);
        } else {
          mod.active = true;
        }
      } else {
        if (mod) {
          mod.active = false;
        }
      }
    }

    function toggleFeatPinActiveState(featName) {
      if (!character || !character.combatPins || !featName) return;
      const cleanTarget = String(featName).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();

      let foundPin = null;
      let foundCategory = null;
      ['offense_melee', 'offense_ranged', 'offense_spell', 'spell_control', 'spell_support', 'defense', 'offense'].forEach(cat => {
        const list = character.combatPins[cat] || [];
        const p = list.find(item => {
          const pName = (item.name || '').toLowerCase().trim();
          const pClean = pName.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          return pName === cleanTarget || pClean === cleanTarget;
        });
        if (p) {
          foundPin = p;
          foundCategory = cat;
        }
      });

      if (foundPin) {
        toggleCombatPinActive(foundCategory, character.combatPins[foundCategory].indexOf(foundPin));
      }
    }

    // --- PIN DETAILS MODAL ---
    function openPinDetailsModalById(category, idx) {
      const pins = getPinsForDrawer(category);
      const pin = pins[idx] || character.combatPins?.[category]?.[idx];
      if (!pin) return;
      const modal = document.getElementById('modal-pin-details');
      if (!modal) return;

      window.currentActivePinModal = { category, idx, name: pin.name };

      document.getElementById('pin-modal-title').textContent = pin.name;
      const typeLabel = pin.autoType 
        ? (pin.autoType === 'readied_maneuver' ? 'Readied Maneuver' : (pin.autoType === 'known_stance' ? 'Known Stance' : (pin.autoType === 'belt_item' ? 'Belt Item' : (pin.autoType === 'equipped_item' ? 'Equipped Active Item' : pin.sourceType))))
        : (pin.sourceType || 'Combat Item');
      document.getElementById('pin-modal-type-badge').textContent = typeLabel;
      document.getElementById('pin-modal-action-badge').textContent = pin.action || 'Standard Action';
      document.getElementById('pin-modal-desc').textContent = pin.desc || 'No description available.';

      const drawerSelect = document.getElementById('pin-modal-drawer-select');
      if (drawerSelect) {
        drawerSelect.value = pin.pinTarget || 'auto';
      }

      const unpinBtn = document.getElementById('pin-modal-unpin-btn');
      if (unpinBtn) {
        if (pin.autoType === 'readied_maneuver') {
          unpinBtn.textContent = 'Unready Maneuver';
          unpinBtn.onclick = () => {
            toggleManeuverReadied(escape(pin.name));
            closePinDetailsModal();
          };
        } else if (pin.autoType === 'belt_item') {
          unpinBtn.textContent = 'Remove from Belt';
          unpinBtn.onclick = () => {
            const bItem = (character.gearPool || []).find(g => (g.name || '').toLowerCase() === (pin.name || '').toLowerCase() && g.isBelt);
            if (bItem) togglePoolBelt(bItem.id);
            closePinDetailsModal();
          };
        } else if (pin.autoType === 'known_stance') {
          unpinBtn.textContent = 'Stance (Known)';
          unpinBtn.onclick = () => {
            closePinDetailsModal();
            showDiceTopToast({
              icon: '🥋',
              title: 'Known Stance',
              breakdown: `${pin.name} is one of your known stances. Manage it in the Maneuvers tab.`,
              total: 'Info'
            });
          };
        } else if (pin.autoType === 'equipped_item') {
          unpinBtn.textContent = 'Item (Equipped)';
          unpinBtn.onclick = () => {
            closePinDetailsModal();
            showDiceTopToast({
              icon: '✨',
              title: 'Equipped Item',
              breakdown: `"${pin.name}" is equipped in a body slot. Unequip it in the Body Slots tab.`,
              total: 'Info'
            });
          };
        } else {
          unpinBtn.textContent = 'Unpin';
          unpinBtn.onclick = () => {
            removeCombatPinByName(pin.name);
            saveStateToStorage(true);
            closePinDetailsModal();
            renderAll();
            showDiceTopToast({
              icon: '📌',
              title: 'Unpinned',
              breakdown: `${pin.name} removed from the Combat Cockpit.`,
              total: 'Removed'
            });
          };
        }
      }

      modal.classList.remove('hidden');
    }

    function closePinDetailsModal() {
      const modal = document.getElementById('modal-pin-details');
      if (modal) modal.classList.add('hidden');
      window.currentActivePinModal = null;
    }

    // --- UNIVERSAL PINNING DIALOG (📌) ---
    function openPinCategoryPicker(item) {
      window.pendingCombatPinItem = item;
      const modal = document.getElementById('modal-pin-category-picker');
      if (!modal) return;
      const nameEl = document.getElementById('pin-picker-item-name');
      if (nameEl) nameEl.textContent = item.name;
      modal.classList.remove('hidden');
    }

    function closePinCategoryPicker() {
      const modal = document.getElementById('modal-pin-category-picker');
      if (modal) modal.classList.add('hidden');
      window.pendingCombatPinItem = null;
    }

    function confirmPinToCategory(category) {
      const item = window.pendingCombatPinItem;
      if (!item) return;

      if (!character.combatPins) character.combatPins = { offense_melee: [], offense_ranged: [], offense_spell: [], spell_control: [], spell_support: [], defense: [] };

      // Check if already pinned: if clicked on same category, remove it; otherwise set/move it
      const allPins = getAllCombatPins();
      const existing = allPins.find(p => (p.name || '').toLowerCase().trim() === item.name.toLowerCase().trim());

      removeCombatPinByName(item.name);

      const targetCategory = category === 'auto' ? resolvePinTarget(item) : category;
      const pinTargetSetting = category; // 'auto', 'offense_melee', 'offense_ranged', 'offense_spell', 'spell_control', 'spell_support', or 'defense'

      if (!character.combatPins[targetCategory]) character.combatPins[targetCategory] = [];

      character.combatPins[targetCategory].push({
        id: 'pin_' + Date.now(),
        name: item.name,
        pinTarget: pinTargetSetting,
        sourceType: item.type || item.sourceType || 'Item',
        action: item.action || 'Standard',
        badge: item.badge || item.damageDice || item.dice || item.benefit?.slice(0, 16) || '',
        desc: item.desc || item.benefit || item.description || ''
      });

      const labelMap = {
        auto: '🎯 Auto (Rule Engine)',
        offense_spell: '⚔️ Spell: Offense',
        spell_control: '🕸️ Spell: Control',
        spell_support: '✨ Spell: Support',
        offense_melee: '⚔️ Physical: Melee',
        offense_ranged: '🏹 Physical: Ranged',
        defense: '🛡️ Physical: Defense'
      };

      showDiceTopToast({
        icon: '📌',
        title: 'Pinned to Cockpit!',
        breakdown: `"${item.name}" pinned to ${labelMap[category] || category}.`,
        total: 'Added'
      });

      saveStateToStorage(true);
      closePinCategoryPicker();
      renderAll();
      if (typeof updateFeatModalPinButton === 'function') updateFeatModalPinButton();
    }

    function getPinToastIconSvg(category) {
      const cat = (category || '').toLowerCase();
      if (cat === 'offense_melee') {
        return `<svg class="w-6 h-6 text-rose-400 fill-current drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (cat === 'offense_ranged') {
        return `<svg class="w-6 h-6 text-amber-400 fill-current drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (cat === 'offense_spell') {
        return `<svg class="w-6 h-6 text-purple-400 fill-current drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (cat === 'spell_control') {
        return `<svg class="w-6 h-6 text-amber-400 fill-current drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (cat === 'spell_support') {
        return `<svg class="w-6 h-6 text-emerald-400 fill-current drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (cat === 'defense') {
        return `<svg class="w-6 h-6 text-indigo-400 fill-current drop-shadow-[0_0_8px_rgba(99,102,241,0.7)]" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      }
      return `<svg class="w-6 h-6 text-amber-400 fill-current drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
    }

    function formatActionShort(action) {
      if (!action) return 'Std';
      const a = String(action).trim();
      if (/^standard/i.test(a)) return 'Std';
      if (/^swift/i.test(a)) return 'Swift';
      if (/^immediate/i.test(a)) return 'Immed';
      if (/^full/i.test(a)) return 'Full';
      if (/^move/i.test(a)) return 'Move';
      if (/^free/i.test(a)) return 'Free';
      return a.replace(/Action/i, '').trim() || a;
    }

    function getUniversalPinButtonHtml(item, options = {}) {
      if (!character) return '';
      if (!character.combatPins) character.combatPins = { offense_melee: [], offense_ranged: [], offense_spell: [], spell_control: [], spell_support: [], defense: [] };
      const itemName = item.name || '';
      const cleanName = itemName.trim().toLowerCase();

      let category = null;
      const allPins = getAllCombatPins();
      const match = allPins.find(p => (p.name || '').trim().toLowerCase() === cleanName);
      if (match) {
        category = resolvePinTarget(match);
      }

      const isPinned = category !== null;
      const safeName = itemName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const safeType = (item.type || item.sourceType || 'Item').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const safeAction = (item.action || 'Standard').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const safeDesc = (item.desc || item.benefit || item.notes || '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, ' ')
        .replace(/\r/g, '');
      const safeBadge = (item.badge || item.damageDice || '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");

      let colorClasses = '';
      let tooltip = '';
      let iconSvg = '';

      if (category === 'offense_melee') {
        colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.45)] hover:bg-rose-900 hover:border-rose-400 ring-1 ring-rose-500/40';
        tooltip = `📌 Combat Cockpit: Pinned to MELEE Drawer (${itemName}) - Click to unpin`;
        iconSvg = `<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (category === 'offense_ranged') {
        colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.45)] hover:bg-amber-900 hover:border-amber-400 ring-1 ring-amber-500/40';
        tooltip = `📌 Combat Cockpit: Pinned to RANGED Drawer (${itemName}) - Click to unpin`;
        iconSvg = `<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (category === 'offense_spell') {
        colorClasses = 'bg-purple-950/80 text-purple-300 border-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.45)] hover:bg-purple-900 hover:border-purple-400 ring-1 ring-purple-500/40';
        tooltip = `📌 Combat Cockpit: Pinned to SPELL OFFENSE Drawer (${itemName}) - Click to unpin`;
        iconSvg = `<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (category === 'spell_control') {
        colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.45)] hover:bg-amber-900 hover:border-amber-400 ring-1 ring-amber-500/40';
        tooltip = `📌 Combat Cockpit: Pinned to SPELL CONTROL Drawer (${itemName}) - Click to unpin`;
        iconSvg = `<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (category === 'spell_support') {
        colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.45)] hover:bg-emerald-900 hover:border-emerald-400 ring-1 ring-emerald-500/40';
        tooltip = `📌 Combat Cockpit: Pinned to SPELL SUPPORT Drawer (${itemName}) - Click to unpin`;
        iconSvg = `<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (category === 'defense') {
        colorClasses = 'bg-indigo-950/80 text-indigo-300 border-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.45)] hover:bg-indigo-900 hover:border-indigo-400 ring-1 ring-indigo-500/40';
        tooltip = `📌 Combat Cockpit: Pinned to DEFENSE Drawer (${itemName}) - Click to unpin`;
        iconSvg = `<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else if (category === 'combat_skills') {
        colorClasses = 'bg-sky-950/80 text-sky-300 border-sky-500/80 shadow-[0_0_8px_rgba(14,165,233,0.45)] hover:bg-sky-900 hover:border-sky-400 ring-1 ring-sky-500/40';
        tooltip = `📌 Combat Cockpit: Pinned to COMBAT SKILLS (${itemName}) - Click to unpin`;
        iconSvg = `<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      } else {
        colorClasses = 'bg-slate-900/50 text-slate-500 hover:text-slate-200 border-slate-700/60 hover:border-slate-500 opacity-35 hover:opacity-100 hover:bg-slate-800';
        tooltip = `📌 Pin to Combat Cockpit (${itemName})`;
        iconSvg = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;
      }

      const extraClass = options.extraClass || 'w-6 h-6';

      return `
        <button type="button" onclick="event.stopPropagation(); toggleUniversalPin({ name: '${safeName}', type: '${safeType}', action: '${safeAction}', desc: '${safeDesc}', badge: '${safeBadge}' })" class="${extraClass} inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer shrink-0 ${colorClasses}" title="${tooltip}">
          ${iconSvg}
        </button>
      `;
    }

    function toggleUniversalPin(item) {
      if (!character) return;
      if (!character.combatPins) character.combatPins = { offense_melee: [], offense_ranged: [], offense_spell: [], spell_control: [], spell_support: [], defense: [], combat_skills: [] };
      const allPins = getAllCombatPins();
      const match = allPins.find(p => (p.name || '').trim().toLowerCase() === (item.name || '').trim().toLowerCase());

      if (match) {
        removeCombatPinByName(item.name);
        saveStateToStorage(true);
        renderAll();
        showDiceTopToast({
          icon: '📌',
          title: 'Unpinned',
          breakdown: `"${item.name}" removed from cockpit.`,
          total: 'Removed'
        });
      } else if (item.type === 'Skill' || item.sourceType === 'Skill' || item.action === 'Check') {
        if (!Array.isArray(character.combatPins.combat_skills)) character.combatPins.combat_skills = [];
        character.combatPins.combat_skills.push({
          id: 'pin_' + Date.now(),
          name: item.name,
          pinTarget: 'combat_skills',
          sourceType: 'Skill',
          action: 'Check',
          badge: item.badge || '',
          desc: item.desc || `${item.name} skill check`
        });
        saveStateToStorage(true);
        renderAll();
        showDiceTopToast({
          icon: '🎯',
          title: 'Pinned to Combat Skills!',
          breakdown: `"${item.name}" added to 🎯 Combat Skills for 1-click d20 rolls.`,
          total: 'Added'
        });
      } else {
        openPinCategoryPicker(item);
      }
    }

    // ====================================================
    // [d20] DICE HUB: FREE DICE, FORMULA & ROLL HISTORY ENGINE
    // ====================================================
    window.activeDicePool = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };
    window.diceRollHistory = [];

    function loadDiceHistory() {
      try {
        const saved = localStorage.getItem('dnd_dice_history');
        if (saved) {
          window.diceRollHistory = JSON.parse(saved);
        }
      } catch (e) {
        window.diceRollHistory = [];
      }
    }

    // Toast Color Palette Generator Based on Dice Color
    function getDiceColorPalette() {
      let diceColor = '#851316';
      try {
        if (typeof localStorage !== 'undefined') {
          diceColor = localStorage.getItem('dnd_dice_color') || '#851316';
        }
      } catch (e) {}

      let r = 133, g = 19, b = 22; // default Ruby Red
      if (diceColor.startsWith('#') && diceColor.length >= 7) {
        r = parseInt(diceColor.slice(1, 3), 16) || 0;
        g = parseInt(diceColor.slice(3, 5), 16) || 0;
        b = parseInt(diceColor.slice(5, 7), 16) || 0;
      }

      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      let textR, textG, textB;
      if (r < 40 && g < 40 && b < 40) {
        // Obsidian Black / Very dark: silvery light gray text
        textR = 226; textG = 232; textB = 240;
      } else if (lum > 0.65) {
        // Light color (ivory white, amber yellow, etc.): keep bright
        textR = Math.max(220, r);
        textG = Math.max(220, g);
        textB = Math.max(220, b);
      } else {
        // Dark / mid tones: lighten by 60% for vivid readability on dark backgrounds
        textR = Math.min(255, Math.round(r + (255 - r) * 0.60));
        textG = Math.min(255, Math.round(g + (255 - g) * 0.60));
        textB = Math.min(255, Math.round(b + (255 - b) * 0.60));
      }

      const accent = `rgb(${textR}, ${textG}, ${textB})`;
      const border = `rgba(${Math.max(50, r)}, ${Math.max(50, g)}, ${Math.max(50, b)}, 0.85)`;
      const glow = `0 10px 28px -5px rgba(0, 0, 0, 0.85), 0 0 24px rgba(${r}, ${g}, ${b}, 0.5)`;
      const iconBg = `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.35), rgba(${r}, ${g}, ${b}, 0.12))`;
      const iconBorder = `rgba(${Math.max(80, r)}, ${Math.max(80, g)}, ${Math.max(80, b)}, 0.65)`;
      const textShadow = `0 0 10px rgba(${r}, ${g}, ${b}, 0.65)`;

      return {
        hex: diceColor,
        r, g, b,
        lum,
        accent,
        border,
        glow,
        iconBg,
        iconBorder,
        textShadow
      };
    }

    let _diceToastTimer = null;
    function showDiceTopToast(entry, options = {}) {
      if (!entry) return null;
      if (typeof entry === 'string') {
        entry = { title: 'Notification', breakdown: entry, total: '' };
      }

      let container = document.getElementById('dice-top-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'dice-top-toast-container';
        container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-2 pointer-events-none transition-all duration-300 max-w-[94vw] sm:max-w-md w-max';
        document.body.appendChild(container);
      } else {
        container.classList.add('gap-2');
      }

      const shouldStack = options.stack === true || entry.stack === true;
      const replaceId = options.replaceId || entry.replaceId;

      let replaceTarget = replaceId ? document.getElementById(replaceId) : null;
      if (replaceTarget && replaceTarget.parentNode !== container) {
        replaceTarget = null;
      }

      if (!shouldStack && !replaceTarget) {
        const items = container.querySelectorAll('.dice-toast-item');
        items.forEach(it => {
          if (it._dismissTimer) clearTimeout(it._dismissTimer);
          it.remove();
        });
      } else if (shouldStack) {
        const items = container.querySelectorAll('.dice-toast-item');
        if (items.length >= 4) {
          const oldest = items[0];
          if (oldest._dismissTimer) clearTimeout(oldest._dismissTimer);
          oldest.remove();
        }
      }

      const palette = getDiceColorPalette();

      const hasActions = Array.isArray(entry.actions) && entry.actions.length > 0;

      const toast = document.createElement('div');
      const toastId = options.toastId || entry.toastId || (replaceId || 'dice-top-toast');
      toast.id = toastId;
      toast.className = `dice-toast-item pointer-events-auto transform -translate-y-8 opacity-0 transition-all duration-300 ease-out bg-slate-900/95 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 backdrop-blur-md flex items-center gap-3 sm:gap-4 text-white max-w-[94vw] sm:max-w-md w-full select-none ${hasActions ? 'cursor-default' : 'cursor-pointer'} shadow-xl`;
      toast.style.border = `2px solid ${palette.border}`;
      toast.style.boxShadow = palette.glow;
      if (!hasActions) {
        toast.title = 'Click to dismiss';
      }

      const isCrit = !!entry.isCrit;
      let defaultToastIcon = '\u26A1';
      if (!isCrit) {
        const str = ((entry.formula || '') + ' ' + (entry.title || '') + ' ' + (entry.breakdown || '')).toLowerCase();
        let dieType = '20';
        if (str.includes('d4')) dieType = '4';
        else if (str.includes('d6')) dieType = '6';
        else if (str.includes('d8')) dieType = '8';
        else if (str.includes('d100')) dieType = '100';
        else if (str.includes('d10')) dieType = '10';
        else if (str.includes('d12')) dieType = '12';
        else if (str.includes('d20')) dieType = '20';

        defaultToastIcon = getDiceIconSvg(dieType, 'w-6 h-6');
      }

      // Auto-detect pin category if not explicitly provided
      if (!entry.pinCategory && (entry.icon === '📌' || String(entry.icon || '').includes('M16 3a1 1 0 0 1'))) {
        const text = ((entry.title || '') + ' ' + (entry.breakdown || '')).toLowerCase();
        if (text.includes('offense')) entry.pinCategory = 'offense';
        else if (text.includes('defense')) entry.pinCategory = 'defense';
      }

      let icon = entry.icon;
      if (entry.pinCategory || entry.icon === '📌') {
        icon = getPinToastIconSvg(entry.pinCategory);
      } else if (!icon) {
        icon = defaultToastIcon;
      }

      let iconBoxStyle = `background: ${palette.iconBg}; border: 1px solid ${palette.iconBorder};`;
      let titleColor = palette.accent;
      if (entry.pinCategory === 'offense') {
        iconBoxStyle = 'background: rgba(76, 5, 25, 0.85); border: 1px solid rgba(244, 63, 94, 0.8); box-shadow: 0 0 12px rgba(244, 63, 94, 0.4);';
        titleColor = '#fb7185';
      } else if (entry.pinCategory === 'defense') {
        iconBoxStyle = 'background: rgba(30, 27, 75, 0.85); border: 1px solid rgba(99, 102, 241, 0.8); box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);';
        titleColor = '#818cf8';
      }

      const title = entry.title || 'Dice Roll';
      const breakdown = entry.breakdown || entry.formula || '';
      const totalRaw = entry.total !== undefined ? String(entry.total).trim() : '';

      let formattedTotal = '';
      if (totalRaw !== '') {
        if (totalRaw.startsWith('=') || totalRaw.startsWith('+') || totalRaw.startsWith('-') || isNaN(Number(totalRaw))) {
          formattedTotal = totalRaw;
        } else {
          formattedTotal = `= ${totalRaw}`;
        }
      }

      toast.innerHTML = `
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner" style="${iconBoxStyle}">
          ${icon}
        </div>
        <div class="flex flex-col min-w-0 flex-1 pr-1">
          <div class="text-sm font-black truncate flex items-center gap-1.5" style="color: ${titleColor};">
            <span class="truncate">${title}</span>
            ${isCrit ? '<span class="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black shrink-0 animate-pulse">CRITICAL!</span>' : ''}
          </div>
          <div class="text-xs text-slate-300 font-mono truncate" title="${breakdown.replace(/"/g, '&quot;')}">
            ${breakdown}
          </div>
          ${hasActions ? `<div id="dice-toast-actions-bar" class="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-700/80"></div>` : ''}
        </div>
        ${formattedTotal ? `
        <div class="shrink-0 flex items-center pl-3 border-l border-slate-700/80">
          <div class="text-xl sm:text-2xl font-extrabold font-mono" style="color: ${palette.accent}; text-shadow: ${palette.textShadow};">
            ${formattedTotal}
          </div>
        </div>
        ` : ''}
      `;

      let cleanupOutsideClick = null;
      if (hasActions) {
        const actionsBar = toast.querySelector('#dice-toast-actions-bar');
        if (actionsBar) {
          entry.actions.forEach(act => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = (act.className || 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-500 transition shadow cursor-pointer') + ' touch-manipulation active:scale-95';
            btn.innerHTML = act.label || 'Apply';
            btn.onclick = (ev) => {
              ev.stopPropagation();
              if (toast._dismissTimer) clearTimeout(toast._dismissTimer);
              if (typeof cleanupOutsideClick === 'function') {
                cleanupOutsideClick();
                cleanupOutsideClick = null;
              }
              toast.classList.remove('translate-y-0', 'opacity-100');
              toast.classList.add('-translate-y-6', 'opacity-0');
              setTimeout(() => {
                if (toast.parentNode) toast.remove();
              }, 200);
              if (typeof act.onClick === 'function') {
                try {
                  act.onClick();
                } catch (err) {
                  console.error('Error executing toast action:', err);
                }
              }
            };
            actionsBar.appendChild(btn);
          });
        }
      }

      // Click to dismiss immediately (only for informational toasts without action buttons)
      if (!hasActions) {
        toast.onclick = () => {
          if (toast._dismissTimer) clearTimeout(toast._dismissTimer);
          toast.classList.remove('translate-y-0', 'opacity-100');
          toast.classList.add('-translate-y-6', 'opacity-0');
          setTimeout(() => {
            if (toast.parentNode) toast.remove();
          }, 300);
        };
      }

      if (replaceTarget) {
        if (replaceTarget._dismissTimer) clearTimeout(replaceTarget._dismissTimer);
        container.replaceChild(toast, replaceTarget);
      } else {
        container.appendChild(toast);
      }

      // Trigger slide down
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toast.classList.remove('-translate-y-8', 'opacity-0');
          toast.classList.add('translate-y-0', 'opacity-100');
        });
      });

      // Auto dismiss (30s for interactive decision toasts, 3.5s for standard notifications)
      if (options.autoDismiss !== false) {
        const dismissMs = options.dismissMs || (hasActions ? 30000 : 3500);
        toast._dismissTimer = setTimeout(() => {
          if (hasActions && typeof entry.onCancel === 'function') {
            try { entry.onCancel(); } catch (err) {}
          }
          toast.classList.remove('translate-y-0', 'opacity-100');
          toast.classList.add('-translate-y-6', 'opacity-0');
          setTimeout(() => {
            if (toast.parentNode) toast.remove();
          }, 350);
        }, dismissMs);
      }

      // Dismiss and treat as unspent when clicking outside interactive decision toasts
      if (hasActions) {
        const onOutsideClick = (e) => {
          if (!toast.parentNode) {
            document.removeEventListener('click', onOutsideClick);
            return;
          }
          if (e.target && e.target.closest && e.target.closest('#' + toast.id)) return;
          document.removeEventListener('click', onOutsideClick);
          cleanupOutsideClick = null;
          if (toast._dismissTimer) clearTimeout(toast._dismissTimer);
          if (typeof entry.onCancel === 'function') {
            try { entry.onCancel(); } catch (err) {}
          }
          toast.classList.remove('translate-y-0', 'opacity-100');
          toast.classList.add('-translate-y-6', 'opacity-0');
          setTimeout(() => {
            if (toast.parentNode) toast.remove();
          }, 300);
        };
        cleanupOutsideClick = () => {
          document.removeEventListener('click', onOutsideClick);
        };
        setTimeout(() => {
          document.addEventListener('click', onOutsideClick);
        }, 80);
      }

      return toast;
    }
    window.showDiceTopToast = showDiceTopToast;

    function addDiceHistoryEntry(entry) {
      if (!Array.isArray(window.diceRollHistory)) {
        loadDiceHistory();
      }
      let detectedHistoryIcon = '⚡';
      if (!entry.isCrit) {
        const str = ((entry.formula || '') + ' ' + (entry.title || '') + ' ' + (entry.breakdown || '')).toLowerCase();
        let dieType = '20';
        if (str.includes('d4')) dieType = '4';
        else if (str.includes('d6')) dieType = '6';
        else if (str.includes('d8')) dieType = '8';
        else if (str.includes('d100')) dieType = '100';
        else if (str.includes('d10')) dieType = '10';
        else if (str.includes('d12')) dieType = '12';
        else if (str.includes('d20')) dieType = '20';

        let colorCls = 'text-amber-400';
        if (dieType === '4') colorCls = 'text-emerald-400';
        else if (dieType === '6') colorCls = 'text-sky-400';
        else if (dieType === '8') colorCls = 'text-indigo-400';
        else if (dieType === '10') colorCls = 'text-purple-400';
        else if (dieType === '12') colorCls = 'text-rose-400';
        else if (dieType === '100') colorCls = 'text-teal-400';
        detectedHistoryIcon = getDiceIconSvg(dieType, `w-4 h-4 ${colorCls}`);
      }

      const record = {
        id: 'roll_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        timestamp: entry.timestamp || new Date().toLocaleTimeString('tr-TR'),
        title: entry.title || 'Dice Roll',
        formula: entry.formula || '',
        breakdown: entry.breakdown || '',
        total: entry.total !== undefined ? entry.total : 0,
        isCrit: !!entry.isCrit,
        critDamage: entry.critDamage || null,
        critInfo: entry.critInfo || '',
        icon: entry.icon || detectedHistoryIcon
      };
      window.diceRollHistory.unshift(record);
      if (window.diceRollHistory.length > 100) {
        window.diceRollHistory = window.diceRollHistory.slice(0, 100);
      }
      try {
        localStorage.setItem('dnd_dice_history', JSON.stringify(window.diceRollHistory));
      } catch (e) {}

      updateLastResultCard(record);
      renderDiceHistory();
      showDiceTopToast(record);
    }

    function clearDiceHistory() {
      if (!confirm('Are you sure you want to clear the entire roll history?')) return;
      window.diceRollHistory = [];
      try {
        localStorage.removeItem('dnd_dice_history');
      } catch (e) {}
      renderDiceHistory();
    }

    function updateLastResultCard(record) {
      const labelEl = document.getElementById('dice-last-label');
      const breakdownEl = document.getElementById('dice-last-breakdown');
      const totalEl = document.getElementById('dice-last-total');
      const critBadge = document.getElementById('dice-last-crit-badge');
      const iconEl = document.getElementById('dice-last-icon');

      if (labelEl) labelEl.textContent = `${record.title} [${record.timestamp}]`;
      if (breakdownEl) breakdownEl.textContent = `${record.formula ? record.formula + ': ' : ''}${record.breakdown} ${record.critInfo || ''}`;
      if (totalEl) totalEl.textContent = record.total;

      if (iconEl) {
        const str = ((record.formula || '') + ' ' + (record.title || '') + ' ' + (record.breakdown || '')).toLowerCase();
        let dieType = '20';
        if (str.includes('d4')) dieType = '4';
        else if (str.includes('d6')) dieType = '6';
        else if (str.includes('d8')) dieType = '8';
        else if (str.includes('d100')) dieType = '100';
        else if (str.includes('d10')) dieType = '10';
        else if (str.includes('d12')) dieType = '12';
        else if (str.includes('d20')) dieType = '20';

        if (dieType === '100') {
          iconEl.style.color = '';
          iconEl.innerHTML = getDiceIconSvg('100', 'w-7 h-7 inline-block text-teal-300');
        } else if (dieType === '20') {
          iconEl.style.color = '';
          iconEl.innerHTML = getDiceIconSvg(20, 'w-7 h-7 inline-block text-amber-300');
        } else {
          let colorCls = 'text-amber-300';
          if (dieType === '4') colorCls = 'text-emerald-300';
          else if (dieType === '6') colorCls = 'text-sky-300';
          else if (dieType === '8') colorCls = 'text-indigo-300';
          else if (dieType === '10') colorCls = 'text-purple-300';
          else if (dieType === '12') colorCls = 'text-rose-300';
          iconEl.style.color = '';
          iconEl.innerHTML = getDiceIconSvg(dieType, `w-7 h-7 inline-block ${colorCls}`);
        }
      }

      if (critBadge) {
        if (record.isCrit) {
          critBadge.classList.remove('hidden');
          critBadge.textContent = record.critDamage ? `⚡ CRITICAL! (${record.critDamage} Damage)` : '⚡ CRITICAL THREAT!';
        } else {
          critBadge.classList.add('hidden');
        }
      }
    }

    function renderDiceHistory() {
      const listEl = document.getElementById('dice-history-list');
      const countEl = document.getElementById('dice-history-count');
      if (!listEl) return;

      if (!Array.isArray(window.diceRollHistory) || window.diceRollHistory.length === 0) {
        loadDiceHistory();
      }

      const list = window.diceRollHistory || [];
      if (countEl) countEl.textContent = `${list.length} Rolls`;

      if (list.length === 0) {
        listEl.innerHTML = `
          <div class="text-center py-8 text-slate-500 text-xs font-medium">
            No dice rolls recorded yet. Use the roller above to roll custom dice.
          </div>
        `;
        return;
      }

      listEl.innerHTML = list.map(item => {
        const critClass = item.isCrit ? 'border-rose-500/70 bg-rose-950/20' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900';
        const critBadge = item.isCrit
          ? `<span class="badge bg-rose-600 text-white font-black text-[10px] animate-pulse">⚡ CRITICAL ${item.critDamage ? '(' + item.critDamage + ' Dmg)' : ''}</span>`
          : '';
        const safeFormula = (item.formula || '').replace(/'/g, "\\'");

        return `
          <div class="p-2.5 sm:p-3 rounded-xl border ${critClass} flex flex-wrap items-center justify-between gap-2.5 transition">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold text-white">${item.title}</span>
                <span class="text-[10px] text-slate-400 font-mono">${item.timestamp}</span>
                ${critBadge}
              </div>
              <div class="text-[11px] text-slate-300 font-mono mt-0.5 break-words">
                ${item.formula ? `<span class="text-amber-400 font-bold">${item.formula}</span> ➔ ` : ''}${item.breakdown}
              </div>
            </div>
            <div class="flex items-center gap-2.5 shrink-0">
              <div class="text-right">
                <div class="text-lg md:text-xl font-black ${item.isCrit ? 'text-rose-400' : 'text-amber-400'} font-mono leading-none">
                  ${item.total}
                </div>
              </div>
              ${item.formula ? `
                <button onclick="applyFormulaTemplate('${safeFormula}'); rollCustomFormula();"
                        title="Reroll this formula"
                        class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 text-xs transition active:scale-95 cursor-pointer">
                  🔄
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    function handleDieClick(sides) {
      const instant = document.getElementById('dice-instant-mode')?.checked;
      if (instant) {
        rollSingleDie(sides);
        return;
      }
      window.activeDicePool[sides] = (window.activeDicePool[sides] || 0) + 1;
      updateDicePoolDisplay();
    }

    function updateDicePoolDisplay() {
      const summaryEl = document.getElementById('dice-pool-summary');
      const mod = parseInt(document.getElementById('dice-pool-mod')?.value) || 0;

      const activeParts = [];
      [4, 6, 8, 10, 12, 20, 100].forEach(s => {
        const count = window.activeDicePool[s] || 0;
        const countBadge = document.getElementById('die-count-' + s);
        if (countBadge) {
          countBadge.textContent = count > 0 ? `×${count}` : '';
        }
        if (count > 0) {
          activeParts.push(`${count}d${s}`);
        }
      });

      if (summaryEl) {
        if (activeParts.length === 0) {
          summaryEl.textContent = 'No dice selected (Click dice buttons above)';
          summaryEl.className = 'text-xs text-slate-500 font-mono';
        } else {
          let formula = activeParts.join(' + ');
          if (mod !== 0) {
            formula += ` ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)}`;
          }
          summaryEl.textContent = formula;
          summaryEl.className = 'text-sm md:text-base font-extrabold text-amber-300 font-mono truncate';
        }
      }
    }

    function resetDicePool() {
      window.activeDicePool = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };
      const modEl = document.getElementById('dice-pool-mod');
      if (modEl) modEl.value = 0;
      updateDicePoolDisplay();
    }

    // ====================================================
    // 🎨 DICE COLOR & BUTTON COORDINATION SYSTEM
    // ====================================================
    function toggleDiceColorPopover(event) {
      if (event) event.stopPropagation();
      const popover = document.getElementById('dice-color-popover');
      if (popover) {
        popover.classList.toggle('hidden');
      }
    }

    function selectDiceColor(color, colorName) {
      if (!color) return;
      color = color.trim();
      if (!color.startsWith('#')) color = '#' + color;

      try {
        localStorage.setItem('dnd_dice_color', color);
      } catch (e) {}

      if (window.Dice3D && typeof window.Dice3D.setDiceColor === 'function') {
        window.Dice3D.setDiceColor(color);
      }

      updateDiceColorUI(color);

      const popover = document.getElementById('dice-color-popover');
      if (popover) {
        popover.classList.add('hidden');
      }

      showDiceTopToast({
        icon: '🎨',
        title: 'Dice Theme Updated',
        breakdown: colorName ? `${colorName} (${color})` : `Selected Color: ${color}`,
        total: 'Synced'
      });
    }

    function updateDiceColorUI(hexColor) {
      if (!hexColor) return;
      if (!hexColor.startsWith('#')) hexColor = '#' + hexColor;

      // 1. Dice color preview dot
      const dot = document.getElementById('dice-color-preview-dot');
      if (dot) dot.style.backgroundColor = hexColor;

      // 2. Custom color picker input
      const customInput = document.getElementById('dice-custom-color-input');
      if (customInput) customInput.value = hexColor;

      // 3. Coordinate Roll Dice button with dice color
      const rollBtn = document.getElementById('dice-roll-pool-btn');
      if (rollBtn) {
        let r = 133, g = 19, b = 22; // Default Ruby Resin #851316
        if (hexColor.length >= 7) {
          r = parseInt(hexColor.slice(1, 3), 16) || 0;
          g = parseInt(hexColor.slice(3, 5), 16) || 0;
          b = parseInt(hexColor.slice(5, 7), 16) || 0;
        }

        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const isLight = lum > 0.62;

        const lighter = `rgb(${Math.min(255, Math.round(r * 1.35 + 25))}, ${Math.min(255, Math.round(g * 1.35 + 25))}, ${Math.min(255, Math.round(b * 1.35 + 25))})`;
        const darker = `rgb(${Math.max(0, Math.round(r * 0.7 - 20))}, ${Math.max(0, Math.round(g * 0.7 - 20))}, ${Math.max(0, Math.round(b * 0.7 - 20))})`;

        rollBtn.style.background = `linear-gradient(135deg, ${lighter}, ${hexColor} 50%, ${darker})`;
        rollBtn.style.borderColor = lighter;
        rollBtn.style.boxShadow = `0 4px 18px rgba(${r}, ${g}, ${b}, 0.45)`;

        if (isLight) {
          rollBtn.style.color = '#0f172a';
          rollBtn.style.textShadow = 'none';
        } else {
          rollBtn.style.color = '#ffffff';
          rollBtn.style.textShadow = '0 1px 2px rgba(0,0,0,0.6)';
        }
      }

      // Keep d20 die icon and button fixed yellow/amber like other d20 icons
      const d20Btn = document.getElementById('die-btn-20');
      const d20Icon = document.getElementById('die-icon-20');
      const d20Label = document.getElementById('die-label-20');
      const d20Count = document.getElementById('die-count-20');
      if (d20Btn) { d20Btn.style.borderColor = ''; d20Btn.style.boxShadow = ''; }
      if (d20Icon) { d20Icon.style.color = ''; d20Icon.style.filter = ''; }
      if (d20Label) { d20Label.style.color = ''; }
      if (d20Count) { d20Count.style.color = ''; }
    }

    function initDiceColor() {
      let savedColor = '#851316';
      try {
        if (typeof localStorage !== 'undefined') {
          savedColor = localStorage.getItem('dnd_dice_color') || '#851316';
        }
      } catch (e) {}
      if (window.Dice3D && typeof window.Dice3D.setDiceColor === 'function') {
        window.Dice3D.setDiceColor(savedColor);
      }
      updateDiceColorUI(savedColor);
    }

    // Close menu when clicking outside popover
    document.addEventListener('click', function(e) {
      const popover = document.getElementById('dice-color-popover');
      const btn = document.getElementById('dice-color-btn');
      if (popover && !popover.classList.contains('hidden')) {
        if (!popover.contains(e.target) && (!btn || !btn.contains(e.target))) {
          popover.classList.add('hidden');
        }
      }
    });

    function rollSingleDie(sides) {
      const r = Math.floor(Math.random() * sides) + 1;
      const isCrit = (sides === 20 && r === 20) || (sides === 100 && r === 100);

      const onDone = () => {
        addDiceHistoryEntry({
          title: `Custom 1d${sides}`,
          formula: `1d${sides}`,
          breakdown: `d${sides}: [${r}]`,
          total: r,
          isCrit: isCrit,
          critInfo: (sides === 20 && r === 20) ? '• Natural 20!' : ((sides === 100 && r === 100) ? '• Perfect 100!' : '')
        });
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function' && [4, 6, 8, 10, 12, 20, 100].includes(sides)) {
        try {
          Dice3D.roll([{ type: 'd' + sides, value: r }], onDone);
        } catch (e) {
          onDone();
        }
      } else {
        onDone();
      }
    }

    function rollDicePool() {
      const mod = parseInt(document.getElementById('dice-pool-mod')?.value) || 0;
      const parts = [];
      const dice3dList = [];
      const rollBreakdown = [];
      let sumOfDice = 0;
      let totalDiceCount = 0;
      let hasD20Crit = false;

      [4, 6, 8, 10, 12, 20, 100].forEach(s => {
        const count = window.activeDicePool[s] || 0;
        if (count > 0) {
          parts.push(`${count}d${s}`);
          const rolls = [];
          for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * s) + 1;
            rolls.push(r);
            sumOfDice += r;
            totalDiceCount++;
            if (s === 20 && r === 20) hasD20Crit = true;
            if ([4, 6, 8, 10, 12, 20, 100].includes(s) && dice3dList.length < 6) {
              dice3dList.push({ type: 'd' + s, value: r });
            }
          }
          rollBreakdown.push(`${count}d${s} [${rolls.join(', ')}]`);
        }
      });

      // If pool was empty, roll 1d20
      if (parts.length === 0) {
        rollSingleDie(20);
        return;
      }

      let formulaStr = parts.join(' + ');
      if (mod !== 0) formulaStr += ` ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)}`;
      const grandTotal = sumOfDice + mod;

      let breakdownStr = rollBreakdown.join(' + ');
      if (mod !== 0) breakdownStr += ` ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)}`;

      const onDone = () => {
        addDiceHistoryEntry({
          title: `Dice Pool (${parts.join('+')})`,
          formula: formulaStr,
          breakdown: breakdownStr,
          total: grandTotal,
          isCrit: hasD20Crit,
          critInfo: hasD20Crit ? '• Natural 20!' : ''
        });
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function' && dice3dList.length > 0) {
        showDiceTopToast({
          icon: getFormulaDiceIconSvg(formulaStr, 'w-6 h-6 text-amber-400') || '⚡',
          title: `Dice Pool (${parts.join('+')})`,
          breakdown: `Rolling dice... [${formulaStr}]`,
          total: '...'
        }, { toastId: 'dice-roll-active-toast', autoDismiss: false });

        try {
          Dice3D.roll(dice3dList, onDone);
        } catch (e) {
          onDone();
        }
      } else {
        onDone();
      }
    }

    // ====================================================
    // 📝 CUSTOM FORMULA, TARGETED ROLL & TEMPLATE MANAGEMENT
    // ====================================================
    const DEFAULT_FORMULA_TEMPLATES = [
      { name: 'Target:21 B:+4 (1d6+3 19-20x2)', formula: 'Target:21 Bonus:4 Dice:1d6+3 19-20x2' },
      { name: 'Fireball (8d6)', formula: '8d6' },
      { name: 'D20 Check (+8)', formula: '1d20+8' },
      { name: 'Percentile (1d100)', formula: '1d100' }
    ];

    function escapeFormulaHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function loadFormulaTemplates() {
      try {
        const saved = localStorage.getItem('dnd_custom_dice_templates');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Clean up legacy excess target presets and migrate legacy default labels
            let changed = false;
            const cleaned = parsed
              .filter(t => !/:(?:18 B:\+6|15 B:\+8|24 B:\+11)/i.test(t.name || ''))
              .map(t => {
                if (/:21 B:\+4 \(1d6\+3 19-20x2\)/i.test(t.name || '') && t.name !== 'Target:21 B:+4 (1d6+3 19-20x2)') {
                  changed = true;
                  return { ...t, name: 'Target:21 B:+4 (1d6+3 19-20x2)', formula: 'Target:21 Bonus:4 Dice:1d6+3 19-20x2' };
                }
                if (t.name === 'D20 Testi (+8)') {
                  changed = true;
                  return { ...t, name: 'D20 Check (+8)' };
                }
                return t;
              });
            if (cleaned.length !== parsed.length || changed) {
              localStorage.setItem('dnd_custom_dice_templates', JSON.stringify(cleaned));
            }
            return cleaned;
          }
        }
      } catch (e) {}
      const initial = [...DEFAULT_FORMULA_TEMPLATES];
      try {
        localStorage.setItem('dnd_custom_dice_templates', JSON.stringify(initial));
      } catch (e) {}
      return initial;
    }

    function saveFormulaTemplates(templates) {
      try {
        localStorage.setItem('dnd_custom_dice_templates', JSON.stringify(templates));
      } catch (e) {}
      renderCustomTemplates();
    }

    function resetFormulaTemplates() {
      saveFormulaTemplates([...DEFAULT_FORMULA_TEMPLATES]);
    }

    function renderCustomTemplates() {
      const container = document.getElementById('dice-custom-templates-container');
      if (!container) return;

      const templates = loadFormulaTemplates();
      if (templates.length === 0) {
        container.innerHTML = `
          <div class="text-xs text-slate-500 py-1 flex items-center gap-2">
            <span>No saved templates.</span>
            <button type="button" onclick="resetFormulaTemplates()" class="text-indigo-400 hover:text-indigo-200 underline cursor-pointer text-xs font-medium">Restore Defaults</button>
          </div>
        `;
        return;
      }

      container.innerHTML = templates.map((t, idx) => {
        const lowerFormula = (t.formula || '').toLowerCase();
        const isTarget = lowerFormula.includes('target') || lowerFormula.includes('hedef');
        const badgeColor = isTarget
          ? 'border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/60'
          : 'border-indigo-500/50 text-indigo-300 hover:bg-indigo-950/60';

        return `
          <div class="inline-flex items-center rounded bg-slate-900 border ${badgeColor} text-xs font-mono transition group shadow-sm">
            <button type="button" onclick="applyFormulaTemplate('${escapeFormulaHtml(t.formula)}')" class="px-2 py-1 text-left truncate hover:underline cursor-pointer" title="${escapeFormulaHtml(t.formula)}">
              ${escapeFormulaHtml(t.name || t.formula)}
            </button>
            <button type="button" onclick="deleteFormulaTemplate(${idx})" class="pr-1.5 pl-0.5 text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition cursor-pointer text-xs font-bold" title="Delete Template">
              &times;
            </button>
          </div>
        `;
      }).join('');
    }

    function applyFormulaTemplate(str) {
      const input = document.getElementById('dice-custom-formula-input');
      if (input) {
        input.value = str;
        input.focus();
      }
    }

    function saveCurrentFormulaTemplate() {
      const input = document.getElementById('dice-custom-formula-input');
      const formula = (input?.value || '').trim();
      if (!formula) {
        alert('Please enter a dice expression in the formula field first.\ne.g., Target:21 Bonus:4 Dice:1d6+3 19-20x2');
        return;
      }

      const defaultName = formula.length > 28 ? formula.slice(0, 25) + '...' : formula;
      const name = prompt('Enter a name for this dice template:', defaultName);
      if (!name || !name.trim()) return;

      const templates = loadFormulaTemplates();
      templates.push({
        name: name.trim(),
        formula: formula,
        isCustom: true
      });
      saveFormulaTemplates(templates);
    }

    function deleteFormulaTemplate(index) {
      const templates = loadFormulaTemplates();
      if (index >= 0 && index < templates.length) {
        templates.splice(index, 1);
        saveFormulaTemplates(templates);
      }
    }

    // Executes Target:, Bonus:, Dice: expressions according to D&D 3.5e attack, threat, confirmation, and damage rules
    function executeTargetAttackRoll(rawInput, hedefMatch) {
      const hedef = parseInt(hedefMatch[1]);

      const bonusMatch = rawInput.match(/(?:bonus|atk|mod)\s*[:=]\s*([+-]?\s*\d+)/i);
      const bonusVal = bonusMatch ? parseInt(bonusMatch[1].replace(/\s+/g, '')) : 0;

      const zarMatch = rawInput.match(/(?:zar|dice|dmg|hasar)\s*[:=]\s*([^;,\n]+)/i);
      let rawDamageStr = '';
      if (zarMatch) {
        rawDamageStr = zarMatch[1]
          .replace(/(?:hedef|target|dc|ac)\s*[:=]\s*\d+/ig, '')
          .replace(/(?:bonus|atk|mod)\s*[:=]\s*[+-]?\s*\d+/ig, '')
          .trim();
      } else {
        rawDamageStr = rawInput
          .replace(/(?:hedef|target|dc|ac)\s*[:=]\s*\d+/ig, '')
          .replace(/(?:bonus|atk|mod)\s*[:=]\s*[+-]?\s*\d+/ig, '')
          .trim();
      }
      if (!rawDamageStr) rawDamageStr = '1d6';

      // Critical threat range and multiplier (e.g. 19-20x2, 18-20x2, 20x3)
      let threatMin = 20, threatMax = 20, critMult = 2;
      let damageDiceStr = rawDamageStr;

      const critRangeMatch = damageDiceStr.match(/(\d+)\s*-\s*(\d+)\s*(?:[xX*\/]\s*(\d+))?/);
      if (critRangeMatch) {
        threatMin = parseInt(critRangeMatch[1]);
        threatMax = parseInt(critRangeMatch[2]);
        if (critRangeMatch[3]) critMult = parseInt(critRangeMatch[3]);
        damageDiceStr = damageDiceStr.replace(critRangeMatch[0], '').trim();
      } else {
        const critMultMatch = damageDiceStr.match(/(?:[xX*\/]\s*(\d+))/);
        if (critMultMatch) {
          critMult = parseInt(critMultMatch[1]);
          damageDiceStr = damageDiceStr.replace(critMultMatch[0], '').trim();
        }
      }
      if (!damageDiceStr) damageDiceStr = '1d6';

      // 1. Primary d20 Attack Roll
      const d20 = Math.floor(Math.random() * 20) + 1;
      const attackTotal = d20 + bonusVal;
      const isNat1 = (d20 === 1);
      const isNat20 = (d20 === 20);

      let isHit = false;
      if (isNat1) {
        isHit = false; // Natural 1 always misses
      } else if (isNat20) {
        isHit = true; // Natural 20 always hits
      } else {
        isHit = (attackTotal >= hedef);
      }

      // 2. Critical Threat & Confirmation Roll
      const isThreat = isHit && (d20 >= threatMin && d20 <= threatMax);
      let isCritConfirmed = false;
      let confirmD20 = null;
      let confirmTotal = null;
      let confirmDetails = '';

      if (isThreat) {
        const noConfirmRule = document.getElementById('settings-no-crit-confirm')?.checked || false;
        if (noConfirmRule) {
          isCritConfirmed = true;
          confirmDetails = ' (Auto-Crit)';
        } else {
          // Standard D&D 3.5e confirmation roll
          confirmD20 = Math.floor(Math.random() * 20) + 1;
          confirmTotal = confirmD20 + bonusVal;
          if (confirmD20 === 20 || confirmTotal >= hedef) {
            isCritConfirmed = true;
            confirmDetails = ` • Confirm: d20 [${confirmD20}] ${bonusVal >= 0 ? '+' : ''}${bonusVal} = ${confirmTotal} >= ${hedef} (CONFIRMED!)`;
          } else {
            isCritConfirmed = false;
            confirmDetails = ` • Confirm: d20 [${confirmD20}] ${bonusVal >= 0 ? '+' : ''}${bonusVal} = ${confirmTotal} < ${hedef} (Unconfirmed, Normal Hit)`;
          }
        }
      }

      // 3. Damage Roll Calculation
      const dmgRegex = /([+-]?\s*\d*d\d+|[+-]?\s*\d+)/gi;
      const dmgMatches = damageDiceStr.match(dmgRegex) || ['1d6'];
      let baseDmgTotal = 0;
      const dmgBreakdownList = [];
      const dmg3dDice = [];

      dmgMatches.forEach(token => {
        const cleanToken = token.replace(/\s+/g, '');
        const sign = cleanToken.startsWith('-') ? -1 : 1;
        const unsigned = cleanToken.replace(/^[+-]/, '');
        if (unsigned.includes('d') || unsigned.includes('D')) {
          const parts = unsigned.toLowerCase().split('d');
          const count = parts[0] === '' ? 1 : Math.min(50, Math.max(1, parseInt(parts[0]) || 1));
          const sides = Math.max(1, parseInt(parts[1]) || 6);
          const rolls = [];
          let gSum = 0;
          for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * sides) + 1;
            rolls.push(r);
            gSum += r;
            if (isHit && [4, 6, 8, 10, 12, 20].includes(sides) && dmg3dDice.length < 5) {
              dmg3dDice.push({ type: 'd' + sides, value: r });
            }
          }
          baseDmgTotal += gSum * sign;
          dmgBreakdownList.push(`${sign < 0 ? '-' : ''}${count}d${sides} [${rolls.join(', ')}]`);
        } else {
          const val = parseInt(unsigned) || 0;
          baseDmgTotal += val * sign;
          dmgBreakdownList.push(`${val * sign >= 0 ? '+' : ''}${val * sign}`);
        }
      });

      const baseDmgBreakdown = dmgBreakdownList.join(' ');
      let finalDamage = 0;
      if (!isHit) {
        finalDamage = 0;
      } else if (isHit && !isCritConfirmed) {
        finalDamage = Math.max(0, baseDmgTotal);
      } else if (isHit && isCritConfirmed) {
        // Multiply total damage by critical multiplier
        finalDamage = Math.max(0, baseDmgTotal) * critMult;
      }

      // 4. 3D Dice to roll on tray
      const dice3dList = [{ type: 'd20', value: d20 }];
      if (confirmD20 !== null) {
        dice3dList.push({ type: 'd20', value: confirmD20 });
      }
      if (isHit && dmg3dDice.length > 0) {
        dice3dList.push(...dmg3dDice);
      }

      const bonusStr = (bonusVal >= 0 ? '+' : '') + bonusVal;

      const onDone = () => {
        if (!isHit) {
          addDiceHistoryEntry({
            icon: getD20IconSvg('w-5 h-5 text-amber-400'),
            title: `Targeted Attack: Miss (vs AC ${hedef})`,
            formula: `d20${bonusStr} vs Target ${hedef} (${rawDamageStr})`,
            breakdown: `Attack: d20 [${d20}] ${bonusStr} = ${attackTotal} vs AC ${hedef} ❌ MISS${isNat1 ? ' (Natural 1!)' : ''}`,
            total: 0,
            isCrit: false,
            critInfo: '• Miss (0 Damage)'
          });
        } else if (isHit && !isCritConfirmed) {
          addDiceHistoryEntry({
            icon: getD20IconSvg('w-5 h-5 text-amber-400'),
            title: `Targeted Attack: Hit (${finalDamage} Damage)`,
            formula: `d20${bonusStr} vs Target ${hedef} (${rawDamageStr})`,
            breakdown: `Attack: d20 [${d20}] ${bonusStr} = ${attackTotal} vs AC ${hedef} (Hit)${confirmDetails} • Damage: ${baseDmgBreakdown} = ${finalDamage} Damage`,
            total: finalDamage,
            isCrit: false,
            critInfo: '• Hit'
          });
        } else {
          // Confirmed critical hit
          addDiceHistoryEntry({
            title: `⚡ CRITICAL HIT! (${finalDamage} Damage)`,
            formula: `d20${bonusStr} vs Target ${hedef} (${rawDamageStr})`,
            breakdown: `Attack: d20 [${d20}] ${bonusStr} = ${attackTotal} vs AC ${hedef} (Threat: ${threatMin}-${threatMax})${confirmDetails} • Damage: (${baseDmgBreakdown}) x ${critMult} = ${finalDamage} Damage!`,
            total: finalDamage,
            isCrit: true,
            critDamage: finalDamage,
            critInfo: `• ⚡ Critical (${threatMin}-${threatMax}x${critMult}): ${finalDamage} Damage!`
          });
        }
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function' && dice3dList.length > 0) {
        showDiceTopToast({
          icon: getFormulaDiceIconSvg(damageDiceStr, 'w-6 h-6 text-amber-400') || '⚡',
          title: 'Targeted Attack Roll',
          breakdown: `Rolling dice... [${rawInput}]`,
          total: '...'
        }, { toastId: 'dice-roll-active-toast', autoDismiss: false });

        try {
          Dice3D.roll(dice3dList, onDone);
        } catch (e) {
          onDone();
        }
      } else {
        onDone();
      }
    }

    // Standard custom formula parser (e.g. 12d46+45 18-20x2, 8d6, 3d6+5)
    function parseAndRollDiceFormula(inputStr) {
      const raw = (inputStr || '').trim();
      if (!raw) return null;

      let critThreatStart = 20;
      let critThreatEnd = 20;
      let critMultiplier = 2;
      let hasCritNotation = false;

      let cleanStr = raw;
      const critRangeMatch = cleanStr.match(/(\d+)\s*-\s*(\d+)\s*(?:[xX*\/]\s*(\d+))?/);
      if (critRangeMatch) {
        hasCritNotation = true;
        critThreatStart = parseInt(critRangeMatch[1]);
        critThreatEnd = parseInt(critRangeMatch[2]);
        if (critRangeMatch[3]) critMultiplier = parseInt(critRangeMatch[3]);
        cleanStr = cleanStr.replace(critRangeMatch[0], '');
      } else {
        const critMultMatch = cleanStr.match(/(?:[xX*\/]\s*(\d+))/);
        if (critMultMatch) {
          hasCritNotation = true;
          critMultiplier = parseInt(critMultMatch[1]);
          cleanStr = cleanStr.replace(critMultMatch[0], '');
        }
      }

      cleanStr = cleanStr.trim();
      if (!cleanStr) {
        cleanStr = '1d20';
      }

      const regex = /([+-]?\s*\d*d\d+|[+-]?\s*\d+)/gi;
      const matches = cleanStr.match(regex);
      if (!matches || matches.length === 0) return null;

      let grandTotal = 0;
      const diceGroups = [];
      const modifiers = [];
      let primaryCheckVal = null;

      matches.forEach(token => {
        const cleanToken = token.replace(/\s+/g, '');
        const sign = cleanToken.startsWith('-') ? -1 : 1;
        const unsigned = cleanToken.replace(/^[+-]/, '');

        if (unsigned.includes('d') || unsigned.includes('D')) {
          const parts = unsigned.toLowerCase().split('d');
          const count = parts[0] === '' ? 1 : Math.min(100, Math.max(1, parseInt(parts[0]) || 1));
          const sides = Math.max(1, parseInt(parts[1]) || 6);

          const rolls = [];
          let groupSum = 0;
          for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * sides) + 1;
            rolls.push(r);
            groupSum += r;
            if (sides === 20 && primaryCheckVal === null) {
              primaryCheckVal = r;
            }
          }
          if (primaryCheckVal === null && rolls.length > 0) {
            primaryCheckVal = rolls[0];
          }

          const signedSum = groupSum * sign;
          grandTotal += signedSum;
          diceGroups.push({
            notation: `${sign < 0 ? '-' : ''}${count}d${sides}`,
            count,
            sides,
            rolls,
            sum: groupSum,
            sign
          });
        } else {
          const val = parseInt(unsigned) || 0;
          grandTotal += val * sign;
          modifiers.push(val * sign);
        }
      });

      let isCrit = false;
      if (hasCritNotation && primaryCheckVal !== null) {
        if (primaryCheckVal >= critThreatStart && primaryCheckVal <= critThreatEnd) {
          isCrit = true;
        }
      }

      return {
        rawInput: raw,
        cleanStr,
        diceGroups,
        modifiers,
        grandTotal,
        hasCritNotation,
        critThreatStart,
        critThreatEnd,
        critMultiplier,
        isCrit,
        critDamage: isCrit ? grandTotal * critMultiplier : null,
        timestamp: new Date().toLocaleTimeString('en-US')
      };
    }

    function executeStandardCustomFormula(val) {
      const parsed = parseAndRollDiceFormula(val);
      if (!parsed) {
        alert('Could not parse dice formula. Valid examples:\n• Target:21 Bonus:4 Dice:1d6+3 19-20x2\n• 12d6+45 18-20x2\n• 3d6+5\n• 8d6');
        return;
      }

      const breakdownParts = parsed.diceGroups.map(g => `${g.notation}: [${g.rolls.join(', ')}]`);
      if (parsed.modifiers.length > 0) {
        const modSum = parsed.modifiers.reduce((a, b) => a + b, 0);
        if (modSum !== 0) {
          breakdownParts.push(`${modSum >= 0 ? '+' : ''}${modSum}`);
        }
      }

      const dice3dList = [];
      parsed.diceGroups.forEach(g => {
        if ([4, 6, 8, 10, 12, 20, 100].includes(g.sides)) {
          g.rolls.forEach(r => {
            if (dice3dList.length < 6) {
              dice3dList.push({ type: 'd' + g.sides, value: r });
            }
          });
        }
      });

      const onDone = () => {
        let critInfo = '';
        if (parsed.hasCritNotation) {
          if (parsed.isCrit) {
            critInfo = `• ⚡ Critical (${parsed.critThreatStart}-${parsed.critThreatEnd}x${parsed.critMultiplier}): ${parsed.critDamage} Damage!`;
          } else {
            critInfo = `• No Crit Threat (${parsed.critThreatStart}-${parsed.critThreatEnd})`;
          }
        }

        addDiceHistoryEntry({
          title: `Custom Formula (${val})`,
          formula: val,
          breakdown: breakdownParts.join(' • '),
          total: parsed.grandTotal,
          isCrit: parsed.isCrit,
          critDamage: parsed.critDamage,
          critInfo: critInfo
        });
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function' && dice3dList.length > 0) {
        showDiceTopToast({
          icon: getFormulaDiceIconSvg(val, 'w-6 h-6 text-amber-400') || '⚡',
          title: `Custom Formula (${val})`,
          breakdown: `Rolling dice... [${val}]`,
          total: '...'
        }, { toastId: 'dice-roll-active-toast', autoDismiss: false });

        try {
          Dice3D.roll(dice3dList, onDone);
        } catch (e) {
          onDone();
        }
      } else {
        onDone();
      }
    }

    function rollCustomFormula() {
      const input = document.getElementById('dice-custom-formula-input');
      const val = (input?.value || '').trim();
      if (!val) {
        alert('Please enter a dice formula (e.g., Target:21 Bonus:4 Dice:1d6+3 19-20x2 or 3d6+5)');
        return;
      }

      // Targeted attack check (Target: ... Bonus: ... Dice: ...)
      const hedefMatch = val.match(/(?:hedef|target|dc|ac)\s*[:=]\s*(\d+)/i);
      if (hedefMatch) {
        executeTargetAttackRoll(val, hedefMatch);
        return;
      }

      executeStandardCustomFormula(val);
    }

    // 3D Skill, Save & Initiative Roll
    function getCharacterInitiative() {
      const dexMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character?.abilities?.dex || 10)
        : Math.floor(((character?.abilities?.dex || 10) - 10) / 2);
      let featBonus = 0;
      const feats = character?.feats || [];
      const hasImprovedInit = feats.some(f => {
        const name = (typeof f === 'string' ? f : f?.name || '').toLowerCase();
        return name.includes('improved initiative');
      });
      if (hasImprovedInit) featBonus += 4;
      const miscBonus = Number(character?.initiativeMisc) || 0;
      const total = dexMod + featBonus + miscBonus;
      return { total, dexMod, featBonus, miscBonus, hasImprovedInit };
    }

    function rollInitiative3D() {
      const init = getCharacterInitiative();
      const mod = init.total;
      const d20 = Math.floor(Math.random() * 20) + 1;
      const total = d20 + mod;

      const showResult = () => {
        addDiceHistoryEntry({
          title: '⚡ Initiative Check',
          formula: `1d20 ${mod >= 0 ? '+' : '-'}${Math.abs(mod)}`,
          breakdown: `1d20 [${d20}] ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)}`,
          total: total,
          isCrit: d20 === 20
        });
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function') {
        try {
          Dice3D.roll([{ type: 'd20', value: d20 }], showResult);
        } catch (err) {
          showResult();
        }
      } else {
        showResult();
      }
    }

    function rollSave3D(saveName) {
      const saves = RuleEngine.evaluateSaves(character);
      const mod = saveName === 'Fortitude' ? saves.fort : (saveName === 'Reflex' ? saves.ref : saves.will);
      const d20 = Math.floor(Math.random() * 20) + 1;
      const total = d20 + mod;

      const showResult = () => {
        addDiceHistoryEntry({
          title: `⚡ ${saveName} Saving Throw`,
          formula: `1d20 ${mod >= 0 ? '+' : '-'}${Math.abs(mod)}`,
          breakdown: `1d20 [${d20}] ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)}`,
          total: total,
          isCrit: d20 === 20
        });
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function') {
        try {
          Dice3D.roll([{ type: 'd20', value: d20 }], showResult);
        } catch (err) {
          showResult();
        }
      } else {
        showResult();
      }
    }

    function rollSkill3D(skillName, totalMod, subtitle = '') {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const total = d20 + totalMod;

      const showResult = () => {
        addDiceHistoryEntry({
          icon: getD20IconSvg('w-5 h-5 text-amber-400'),
          title: `${skillName} Skill Check`,
          formula: `1d20 ${totalMod >= 0 ? '+' : '-'}${Math.abs(totalMod)}`,
          breakdown: `1d20 [${d20}] ${totalMod >= 0 ? '+' : '-'} ${Math.abs(totalMod)}${subtitle ? ` (${subtitle})` : ''}`,
          total: total,
          isCrit: d20 === 20
        });
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function') {
        try {
          Dice3D.roll([{ type: 'd20', value: d20 }], showResult);
        } catch (err) {
          showResult();
        }
      } else {
        showResult();
      }
    }

