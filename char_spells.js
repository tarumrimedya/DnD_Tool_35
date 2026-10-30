/**
 * Joyful-Fermi D&D 3.5e — 4-Discipline Spellcasting, Tome of Battle Maneuvers, Pre-Cast Variants & Spell Picker
 */
    // ====================================================
    // 4-DISCIPLINE TREE ARCHITECTURE & SPELLS COCKPIT
    // 1. Doğal / Anlık | 2. Kitaplı | 3. İlahi Dua | 4. Savaş Manevraları
    // ====================================================
    window._currentMagicDiscipline = window._currentMagicDiscipline || 'spontaneous';
    window._currentSpellsSubtab = window._currentSpellsSubtab || 'spells';
    window._spellCurrentFilterLevel = window._spellCurrentFilterLevel || 'all';
    window._currentSpellPickerType = window._currentSpellPickerType || 'Spell';

    function countCharacterMartialFeats(char = character) {
      let martialStudyCount = 0;
      let martialStanceCount = 0;
      if (!char) return { martialStudyCount, martialStanceCount };
      const allFeatStrings = [];
      if (Array.isArray(char.feats)) {
        char.feats.forEach(f => allFeatStrings.push(typeof f === 'string' ? f : (f?.name || '')));
      }
      if (Array.isArray(char.levelProgression)) {
        char.levelProgression.filter(p => p && p.active !== false).forEach(p => {
          (p.feats || []).forEach(f => allFeatStrings.push(typeof f === 'string' ? f : (f?.name || '')));
        });
      }
      const seenStudy = new Set();
      const seenStance = new Set();
      allFeatStrings.forEach((raw, idx) => {
        const low = String(raw || '').toLowerCase();
        if (low.includes('martial study')) seenStudy.add(raw + ':' + idx);
        if (low.includes('martial stance')) seenStance.add(raw + ':' + idx);
      });
      // Deduplicate between top-level char.feats and levelProgression
      const progFeats = [];
      if (Array.isArray(char.levelProgression)) {
        char.levelProgression.filter(p => p && p.active !== false).forEach(p => {
          (p.feats || []).forEach(f => progFeats.push(String(typeof f === 'string' ? f : (f?.name || '')).toLowerCase()));
        });
      }
      if (progFeats.length > 0) {
        martialStudyCount = progFeats.filter(f => f.includes('martial study')).length;
        martialStanceCount = progFeats.filter(f => f.includes('martial stance')).length;
      } else {
        const topFeats = (char.feats || []).map(f => String(typeof f === 'string' ? f : (f?.name || '')).toLowerCase());
        martialStudyCount = topFeats.filter(f => f.includes('martial study')).length;
        martialStanceCount = topFeats.filter(f => f.includes('martial stance')).length;
      }
      return { martialStudyCount, martialStanceCount };
    }

    function checkCharacterMagicClasses() {
      const classNames = [];
      if (Array.isArray(character?.classes)) {
        character.classes.forEach(c => {
          if (c && c.name) classNames.push(String(c.name).toLowerCase().trim());
        });
      }
      if (typeof character?.classes === 'string' && character.classes) {
        classNames.push(character.classes.toLowerCase().trim());
      }
      if (typeof character?.class === 'string' && character.class) {
        classNames.push(character.class.toLowerCase().trim());
      }
      if (Array.isArray(character?.classProgression)) {
        character.classProgression.forEach(cp => {
          if (cp && cp.className) classNames.push(String(cp.className).toLowerCase().trim());
        });
      }
      if (Array.isArray(character?.levelProgression)) {
        character.levelProgression.forEach(lp => {
          if (lp && lp.className) classNames.push(String(lp.className).toLowerCase().trim());
        });
      }
      if (classNames.length === 0 && character?.spellcasting?.primaryClass) {
        classNames.push(String(character.spellcasting.primaryClass).toLowerCase().trim());
      }
      if (character?.isNpc && character?.spellcasting && (character.spellcasting.cl > 0 || (character.spellcasting.slots && character.spellcasting.slots.length > 0) || (character.spellcasting.knownSpells && character.spellcasting.knownSpells.length > 0) || (character.spells && character.spells.length > 0))) {
        const prim = (character.spellcasting.primaryClass || 'sorcerer').toLowerCase();
        classNames.push(prim);
      }
      
      const hasSpontaneousSlots = (character?.isNpc && Array.isArray(character?.spellcasting?.slots) && character.spellcasting.slots.some(s => (Number(s.daily) || 0) > 0))
        || (Array.isArray(character?.spellcasting?.slots) && character.spellcasting.slots.some(s => (Number(s.dmBonus) || 0) > 0))
        || (Array.isArray(character?.spellcasting?.knownSpells) && character.spellcasting.knownSpells.length > 0);
      const hasPreparedSlots = (Array.isArray(character?.spellcasting?.preparedSlots) && character.spellcasting.preparedSlots.some(s => (Number(s.dmBonus) || 0) > 0))
        || (Array.isArray(character?.spellcasting?.preparedSpells) && character.spellcasting.preparedSpells.length > 0);
      const hasDivineSlots = (Array.isArray(character?.spellcasting?.divineSlots) && character.spellcasting.divineSlots.some(s => (Number(s.dmBonus) || 0) > 0))
        || (Array.isArray(character?.spellcasting?.divineSpells) && character.spellcasting.divineSpells.length > 0);
      const { martialStudyCount, martialStanceCount } = countCharacterMartialFeats(character);
      const hasMartialDmBonus = ((Number(character?.tomeOfBattle?.dmReadiedBonus) || 0) > 0)
        || ((Number(character?.tomeOfBattle?.dmKnownBonus) || 0) > 0)
        || ((Number(character?.tomeOfBattle?.dmStanceBonus) || 0) > 0);
      const hasMartialSlots = martialStudyCount > 0 || martialStanceCount > 0 || hasMartialDmBonus
        || (character?.isNpc && Array.isArray(character?.tomeOfBattle?.maneuversKnown) && character.tomeOfBattle.maneuversKnown.length > 0);

      const clMode = character?.settings?.clMode || 'Class Level';
      const isWarlockBoon = clMode.includes('Warlock Boon') || character?.settings?.warlockBoon === true;
      const isDmBoonActive = (clMode === 'Character Level (DM Boon)') || isWarlockBoon;
      let boonType = null;
      if (isWarlockBoon) {
        boonType = 'spontaneous';
      } else if (isDmBoonActive) {
        const rawCasterType = character?.settings?.casterType;
        if (character?.settings?.casterTypeExplicit === true && rawCasterType) {
          boonType = rawCasterType === 'warlock' ? 'spontaneous' : rawCasterType;
        } else {
          const discLvls = getMagicDisciplineClassLevels(character);
          const order = ['spontaneous', 'prepared', 'divine', 'martial'];
          let bestDisc = null;
          let maxLvl = 0;
          order.forEach(d => {
            if ((discLvls[d] || 0) > maxLvl) {
              maxLvl = discLvls[d];
              bestDisc = d;
            }
          });
          if (bestDisc && maxLvl > 0) {
            boonType = bestDisc;
          } else {
            boonType = (rawCasterType === 'warlock' || !rawCasterType) ? 'spontaneous' : rawCasterType;
          }
        }
      }

      const hasSpontaneous = classNames.some(c => classifyClassToMagicDiscipline(c) === 'spontaneous') || hasSpontaneousSlots || boonType === 'spontaneous';
      const hasPrepared = classNames.some(c => classifyClassToMagicDiscipline(c) === 'prepared') || hasPreparedSlots || boonType === 'prepared';
      const hasDivine = classNames.some(c => classifyClassToMagicDiscipline(c) === 'divine') || hasDivineSlots || boonType === 'divine';
      const hasMartial = classNames.some(c => classifyClassToMagicDiscipline(c) === 'martial') || hasMartialSlots || boonType === 'martial';

      return { hasSpontaneous, hasPrepared, hasDivine, hasMartial };
    }

    function classifyClassToMagicDiscipline(className) {
      const c = String(className || '').toLowerCase().trim();
      if (!c) return null;
      if (['wizard', 'artificer', 'archivist', 'wu jen', "sha'ir", 'büyücü', 'archmage', 'loremaster', 'incantatrix', 'red wizard', 'pale master', 'eldritch knight', 'arcane trickster', 'abjurant champion'].some(k => c.includes(k))) return 'prepared';
      if (['cleric', 'creric', 'druid', 'paladin', 'ranger', 'spirit shaman', 'shugenja', 'healer', 'adept', 'rahip', 'priest', 'hierophant', 'contemplative', 'radiant servant', 'hospitaler', 'warpriest', 'divine oracle', 'church inquisitor'].some(k => c.includes(k))) return 'divine';
      if (['sorcerer', 'bard', 'favored soul', 'warlock', 'warmage', 'duskblade', 'beguiler', 'dread necromancer', 'dragonfire adept', 'spellthief'].some(k => c.includes(k))) return 'spontaneous';
      if (['warblade', 'swordsage', 'crusader', 'bloodstorm blade', 'deepstone sentinel', 'eternal blade', 'jade phoenix mage', 'master of nine', 'ruby knight vindicator', 'shadow sun ninja'].some(k => c.includes(k))) return 'martial';
      return null;
    }

    function getMagicDisciplineClassLevels(char = character) {
      const levels = { spontaneous: 0, prepared: 0, divine: 0, martial: 0 };
      if (!char) return levels;

      const totalLevels = () => (levels.spontaneous + levels.prepared + levels.divine + levels.martial);

      // 1. Active rows in levelProgression
      const allProg = Array.isArray(char.levelProgression) ? char.levelProgression.filter(Boolean) : [];
      const activeProg = allProg.filter(p => p.active !== false);
      activeProg.forEach(p => {
        const disc = classifyClassToMagicDiscipline(p.className || p.class || p.name);
        if (disc) levels[disc] += 1;
      });

      // 2. If active rows yielded 0 caster/martial levels, also check all rows in levelProgression / progression (e.g. planned levels)
      if (totalLevels() === 0 && allProg.length > 0) {
        allProg.forEach(p => {
          const disc = classifyClassToMagicDiscipline(p.className || p.class || p.name);
          if (disc) levels[disc] += 1;
        });
      }
      if (totalLevels() === 0 && Array.isArray(char.progression) && char.progression.length > 0) {
        char.progression.forEach(p => {
          const disc = classifyClassToMagicDiscipline(p?.className || p?.class || p?.name);
          if (disc) levels[disc] += 1;
        });
      }

      // 3. Fallback to classProgression, classes array/string, or primaryClass / class
      if (totalLevels() === 0 && Array.isArray(char.classProgression) && char.classProgression.length > 0) {
        char.classProgression.forEach(cp => {
          const disc = classifyClassToMagicDiscipline(cp?.className || cp?.name || cp?.class);
          if (disc) levels[disc] += (Number(cp?.level) || 1);
        });
      }
      if (totalLevels() === 0 && Array.isArray(char.classes) && char.classes.length > 0) {
        char.classes.forEach(c => {
          const name = typeof c === 'string' ? c : (c?.name || c?.className || c?.class || '');
          const lvl = (c && typeof c === 'object') ? (Number(c.level) || 1) : (Number(char.level) || 1);
          const disc = classifyClassToMagicDiscipline(name);
          if (disc) levels[disc] += lvl;
        });
      } else if (totalLevels() === 0 && typeof char.classes === 'string' && char.classes.trim()) {
        const parts = char.classes.split(/[\/,]/).map(s => s.trim()).filter(Boolean);
        parts.forEach(part => {
          const numMatch = part.match(/(\d+)/);
          const lvl = numMatch ? (parseInt(numMatch[1], 10) || 1) : (parts.length === 1 ? (Number(char.level) || 1) : 1);
          const disc = classifyClassToMagicDiscipline(part);
          if (disc) levels[disc] += lvl;
        });
      }
      if (totalLevels() === 0) {
        const fallbackDisc = classifyClassToMagicDiscipline(char.spellcasting?.primaryClass || char.class);
        if (fallbackDisc) levels[fallbackDisc] += (Number(char.spellcasting?.cl || char.level) || 1);
      }
      return levels;
    }

    function resolvePreferredMagicDiscipline(char = character) {
      if (!char) return 'spontaneous';

      // Compute highest Caster / Martial Class Level first
      const levels = getMagicDisciplineClassLevels(char);
      const order = ['spontaneous', 'prepared', 'divine', 'martial'];
      let bestDisc = null;
      let maxLvl = 0;
      order.forEach(disc => {
        if ((levels[disc] || 0) > maxLvl) {
          maxLvl = levels[disc];
          bestDisc = disc;
        }
      });

      // 1. DM Boon Override:
      // Warlock Boon always overrides to spontaneous.
      // For 'Character Level (DM Boon)', an explicit casterType override (or non-default casterType when maxLvl === 0) overrides class levels;
      // an uninitialized default 'spontaneous' must not override a character whose actual caster classes belong to another discipline (e.g. Lvl 4 Cleric -> divine).
      const clMode = char.settings?.clMode || 'Class Level';
      const isWarlockBoon = clMode.includes('Warlock Boon') || char.settings?.warlockBoon === true;
      const isDmBoonActive = (clMode === 'Character Level (DM Boon)') || isWarlockBoon;
      if (isWarlockBoon) {
        return 'spontaneous';
      }
      if (isDmBoonActive) {
        const boonCasterType = char.settings?.casterType;
        if (char.settings?.casterTypeExplicit === true && boonCasterType) {
          if (boonCasterType === 'warlock' || boonCasterType === 'spontaneous') return 'spontaneous';
          if (['prepared', 'divine', 'martial'].includes(boonCasterType)) return boonCasterType;
        }
        if (['prepared', 'divine', 'martial'].includes(boonCasterType) && (!bestDisc || maxLvl === 0)) {
          return boonCasterType;
        }
        if (bestDisc && maxLvl > 0) {
          if (char.settings && (!boonCasterType || boonCasterType === 'spontaneous')) {
            char.settings.casterType = bestDisc;
          }
          return bestDisc;
        }
        if (boonCasterType === 'warlock' || boonCasterType === 'spontaneous') return 'spontaneous';
        if (['prepared', 'divine', 'martial'].includes(boonCasterType)) return boonCasterType;
      }

      // 2. Highest Caster / Martial Class Level
      if (bestDisc && maxLvl > 0) return bestDisc;

      // 3. Check actual populated spells/maneuvers before generic slot fallbacks
      if ((Array.isArray(char.spellcasting?.divineSpells) && char.spellcasting.divineSpells.length > 0)
        || (Array.isArray(char.spellcasting?.divineSlots) && char.spellcasting.divineSlots.some(s => (Number(s.daily) || 0) > 0))) {
        return 'divine';
      }
      if ((Array.isArray(char.spellcasting?.preparedSpells) && char.spellcasting.preparedSpells.length > 0)
        || (Array.isArray(char.spellcasting?.preparedSlots) && char.spellcasting.preparedSlots.some(s => (Number(s.daily) || 0) > 0))) {
        return 'prepared';
      }
      if ((Array.isArray(char.tomeOfBattle?.readiedManeuvers) && char.tomeOfBattle.readiedManeuvers.length > 0)
        || (Array.isArray(char.tomeOfBattle?.maneuversKnown) && char.tomeOfBattle.maneuversKnown.length > 0)) {
        return 'martial';
      }

      // 4. Fallback to any unlocked slots / flags
      const classesStatus = checkCharacterMagicClasses();
      if (classesStatus.hasDivine && !classesStatus.hasSpontaneous && !classesStatus.hasPrepared) return 'divine';
      if (classesStatus.hasPrepared && !classesStatus.hasSpontaneous) return 'prepared';
      if (classesStatus.hasMartial && !classesStatus.hasSpontaneous) return 'martial';
      if (classesStatus.hasSpontaneous) return 'spontaneous';
      if (classesStatus.hasPrepared) return 'prepared';
      if (classesStatus.hasDivine) return 'divine';
      if (classesStatus.hasMartial) return 'martial';
      return 'spontaneous';
    }

    function autoSelectMagicDisciplineTab(char = character, forceResolve = false) {
      const manualChoice = (!forceResolve)
        ? (window._userManualMagicDiscipline || char?._preferredMagicDiscipline || null)
        : null;
      const preferred = manualChoice || resolvePreferredMagicDiscipline(char);
      if (['spontaneous', 'prepared', 'divine'].includes(preferred)) {
        window.currentCompactSlotsSource = preferred;
      }
      window._isAutoSelectingMagicTab = true;
      try {
        switchMagicDisciplineTab(preferred);
      } finally {
        window._isAutoSelectingMagicTab = false;
      }
      return preferred;
    }

    function renderPreparedSpells() {
      const classesStatus = checkCharacterMagicClasses();
      if (typeof renderPreparedDisciplineView === 'function') renderPreparedDisciplineView(classesStatus.hasPrepared);
    }

    function renderDivineSpells() {
      const classesStatus = checkCharacterMagicClasses();
      if (typeof renderDivineDisciplineView === 'function') renderDivineDisciplineView(classesStatus.hasDivine);
    }

    function switchMagicDisciplineTab(discipline) {
      window._currentMagicDiscipline = discipline;
      if (!window._isAutoSelectingMagicTab) {
        window._userManualMagicDiscipline = discipline;
        if (character) character._preferredMagicDiscipline = discipline;
        if (['spontaneous', 'prepared', 'divine'].includes(discipline)) {
          window.currentCompactSlotsSource = discipline;
        }
      }
      const classesStatus = checkCharacterMagicClasses();

      const views = {
        spontaneous: document.getElementById('discipline-view-spontaneous'),
        prepared: document.getElementById('discipline-view-prepared'),
        divine: document.getElementById('discipline-view-divine'),
        martial: document.getElementById('discipline-view-martial')
      };

      const buttons = {
        spontaneous: document.getElementById('magic-tab-btn-spontaneous'),
        prepared: document.getElementById('magic-tab-btn-prepared'),
        divine: document.getElementById('magic-tab-btn-divine'),
        martial: document.getElementById('magic-tab-btn-martial')
      };

      // Show active view, hide others
      Object.keys(views).forEach(key => {
        if (views[key]) {
          if (key === discipline) views[key].classList.remove('hidden');
          else views[key].classList.add('hidden');
        }
      });

      // Update button styles
      if (buttons.spontaneous) {
        if (discipline === 'spontaneous') {
          buttons.spontaneous.className = 'w-full lg:flex-1 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer whitespace-nowrap bg-gradient-to-r from-purple-800 to-indigo-700 text-white shadow-md border border-purple-500/60 ring-1 ring-purple-400/30';
        } else {
          buttons.spontaneous.className = 'w-full lg:flex-1 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer whitespace-nowrap bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 hover:text-purple-100 border border-purple-900/50 shadow-sm';
        }
      }

      if (buttons.prepared) {
        if (discipline === 'prepared') {
          buttons.prepared.className = 'w-full lg:flex-1 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer whitespace-nowrap bg-gradient-to-r from-sky-800 to-blue-700 text-white shadow-md border border-sky-500/60 ring-1 ring-sky-400/30';
        } else {
          buttons.prepared.className = 'w-full lg:flex-1 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer whitespace-nowrap bg-sky-950/30 hover:bg-sky-900/40 text-sky-300 hover:text-sky-100 border border-sky-900/50 shadow-sm';
        }
      }

      if (buttons.divine) {
        if (discipline === 'divine') {
          buttons.divine.className = 'w-full lg:flex-1 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer whitespace-nowrap bg-gradient-to-r from-amber-800 to-yellow-700 text-white shadow-md border border-amber-500/60 ring-1 ring-amber-400/30';
        } else {
          buttons.divine.className = 'w-full lg:flex-1 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer whitespace-nowrap bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 hover:text-amber-100 border border-amber-900/50 shadow-sm';
        }
      }

      if (buttons.martial) {
        if (discipline === 'martial') {
          buttons.martial.className = 'w-full lg:flex-1 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer whitespace-nowrap bg-gradient-to-r from-rose-800 to-amber-700 text-white shadow-md border border-rose-500/60 ring-1 ring-rose-400/30';
        } else {
          buttons.martial.className = 'w-full lg:flex-1 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer whitespace-nowrap bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 hover:text-rose-100 border border-rose-900/50 shadow-sm';
        }
      }

      // Re-render subviews if needed
      if (discipline === 'spontaneous') {
        renderSpellSlots();
        renderKnownSpells();
      } else if (discipline === 'prepared') {
        renderPreparedDisciplineView(classesStatus.hasPrepared);
      } else if (discipline === 'divine') {
        renderDivineDisciplineView(classesStatus.hasDivine);
      } else if (discipline === 'martial') {
        renderManeuvers();
      }
    }

    // Backwards-compatible alias for any legacy callers
    function switchSpellsSubtab(tab) {
      if (tab === 'spells') switchMagicDisciplineTab('spontaneous');
      else if (tab === 'maneuvers') switchMagicDisciplineTab('martial');
      else switchMagicDisciplineTab(tab);
    }

    function calculateWizardSlots(wizardLvl, intScore, existingSlots = []) {
      const prevSlots = Array.isArray(existingSlots) ? existingSlots : [];
      if (Number(wizardLvl) <= 0) return prevSlots.filter(s => (Number(s.daily) || 0) > 0);
      const lvl = Math.min(20, Math.max(1, Number(wizardLvl) || 1));
      const intMod = Math.floor(((Number(intScore) || 10) - 10) / 2);
      const wizDailyTable = [
        [],
        [3, 1],
        [4, 2],
        [4, 2, 1],
        [4, 3, 2],
        [4, 3, 2, 1],
        [4, 3, 3, 2],
        [4, 4, 3, 2, 1],
        [4, 4, 3, 3, 2],
        [4, 4, 4, 3, 2, 1],
        [4, 4, 4, 3, 3, 2],
        [4, 4, 4, 4, 3, 2, 1],
        [4, 4, 4, 4, 3, 3, 2],
        [4, 4, 4, 4, 4, 3, 2, 1],
        [4, 4, 4, 4, 4, 3, 3, 2],
        [4, 4, 4, 4, 4, 4, 3, 2, 1],
        [4, 4, 4, 4, 4, 4, 3, 3, 2],
        [4, 4, 4, 4, 4, 4, 4, 3, 2, 1],
        [4, 4, 4, 4, 4, 4, 4, 3, 3, 2],
        [4, 4, 4, 4, 4, 4, 4, 4, 3, 3],
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
      ];
      const baseDaily = wizDailyTable[lvl] || [3, 1];
      const result = baseDaily.map((base, spellLvl) => {
        const bonus = (spellLvl >= 1 && intMod >= spellLvl) ? Math.floor((intMod - spellLvl) / 4) + 1 : 0;
        const prev = prevSlots.find(s => Number(s.level) === spellLvl);
        const dmBonus = prev ? (Number(prev.dmBonus) || 0) : 0;
        const daily = Math.max(0, base + bonus + dmBonus);
        return {
          level: spellLvl,
          daily,
          dmBonus,
          used: prev ? Math.min(daily, Number(prev.used) || 0) : 0,
          known: daily
        };
      });
      // Retain custom unlocked higher-level slots
      prevSlots.forEach(prev => {
        if (prev && Number(prev.level) >= baseDaily.length) {
          result.push({
            level: Number(prev.level),
            daily: Number(prev.daily) || 0,
            dmBonus: Number(prev.dmBonus) || 0,
            used: Math.min(Number(prev.daily) || 0, Number(prev.used) || 0),
            known: Number(prev.daily) || 0
          });
        }
      });
      return result;
    }

    // Official D&D 3.5e SRD 35 Cleric Domains Catalog (Granted Powers & Class Skills)
    const DND35_CLERIC_DOMAINS = {
      Air: {
        grantedPower: "Turn or destroy earth creatures as a good cleric turns undead. Rebuke, command, or bolster air creatures as an evil cleric rebukes undead (3 + Cha modifier/day).",
        classSkills: []
      },
      Animal: {
        grantedPower: "Use Speak with Animals once per day as a spell-like ability. Knowledge (nature) is a class skill.",
        classSkills: ["k_nature"]
      },
      Artifice: {
        grantedPower: "Gain a +4 bonus on Craft checks. You cast Conjuration (Creation) spells at +1 caster level.",
        classSkills: []
      },
      Chaos: {
        grantedPower: "You cast chaos spells at +1 caster level.",
        classSkills: []
      },
      Charm: {
        grantedPower: "Boost your Charisma by +4 once per day as a free action (lasts 1 minute).",
        classSkills: []
      },
      Community: {
        grantedPower: "Use Calm Emotions 1/day as a spell-like ability. Gain a +2 competence bonus on Diplomacy checks.",
        classSkills: []
      },
      Creation: {
        grantedPower: "You cast Conjuration (Creation) spells at +2 caster level.",
        classSkills: []
      },
      Darkness: {
        grantedPower: "Free Blind-Fight feat.",
        classSkills: []
      },
      Death: {
        grantedPower: "Death Touch (Su) 1/day: Make a melee touch attack; roll 1d6 per cleric level. If the total at least equals the target's current HP, it dies (no save).",
        classSkills: []
      },
      Destruction: {
        grantedPower: "Smite (Su) 1/day: Make a single melee attack with a +4 bonus on attack rolls and a damage bonus equal to your cleric level.",
        classSkills: []
      },
      Earth: {
        grantedPower: "Turn or destroy air creatures as a good cleric turns undead. Rebuke, command, or bolster earth creatures as an evil cleric rebukes undead (3 + Cha modifier/day).",
        classSkills: []
      },
      Evil: {
        grantedPower: "You cast evil spells at +1 caster level.",
        classSkills: []
      },
      Fire: {
        grantedPower: "Turn or destroy water creatures as a good cleric turns undead. Rebuke, command, or bolster fire creatures as an evil cleric rebukes undead (3 + Cha modifier/day).",
        classSkills: []
      },
      Glory: {
        grantedPower: "Turn undead with a +2 bonus on the turning check and +1d6 to the turning damage roll.",
        classSkills: []
      },
      Good: {
        grantedPower: "You cast good spells at +1 caster level.",
        classSkills: []
      },
      Healing: {
        grantedPower: "You cast Conjuration (Healing) spells at +1 caster level.",
        classSkills: []
      },
      Knowledge: {
        grantedPower: "All Knowledge skills are class skills. You cast divination spells at +1 caster level.",
        classSkills: ["k_arcana", "k_arch", "k_dungeon", "k_geo", "k_history", "k_local", "k_nature", "k_nobility", "k_religion", "k_planes"]
      },
      Law: {
        grantedPower: "You cast law spells at +1 caster level.",
        classSkills: []
      },
      Liberation: {
        grantedPower: "Gain a +2 morale bonus on all saving throws against enchantment spells or effects.",
        classSkills: []
      },
      Luck: {
        grantedPower: "Good Fortune (Ex) 1/day: Reroll one roll that you have just made before the DM declares whether it results in success or failure.",
        classSkills: []
      },
      Madness: {
        grantedPower: "Gain an Insanity score equal to half your class level (use 1/day as a bonus on a Wisdom-based check or Will save).",
        classSkills: []
      },
      Magic: {
        grantedPower: "Use scrolls, wands, and other spell completion or spell trigger devices as a wizard of one-half your cleric level (minimum 1st level).",
        classSkills: []
      },
      Nobility: {
        grantedPower: "Inspire Allies (Sp) 1/day: Standard action to grant allies who can hear you a +2 morale bonus on saves, attack rolls, ability checks, skill checks, and weapon damage rolls for Cha bonus rounds.",
        classSkills: []
      },
      Plant: {
        grantedPower: "Rebuke or command plant creatures as an evil cleric rebukes undead (3 + Cha modifier/day). Knowledge (nature) is a class skill.",
        classSkills: ["k_nature"]
      },
      Protection: {
        grantedPower: "Protective Ward (Su) 1/day: Standard action touch grants a resistance bonus equal to your cleric level on the target's next saving throw (max 1 hour).",
        classSkills: []
      },
      Repose: {
        grantedPower: "Death Touch / Ward against undead; gentle repose and protection of souls against undeath.",
        classSkills: []
      },
      Rune: {
        grantedPower: "Free Scribe Scroll feat.",
        classSkills: []
      },
      Scalykind: {
        grantedPower: "Rebuke or command animals and magical beasts with the reptilian subtype as an evil cleric rebukes undead (3 + Cha modifier/day).",
        classSkills: []
      },
      Strength: {
        grantedPower: "Feat of Strength (Su) 1/day: Free action to gain an enhancement bonus to Strength equal to your cleric level for 1 round.",
        classSkills: []
      },
      Sun: {
        grantedPower: "Greater Turning (Su) 1/day: Perform a greater turning against undead in place of a regular turning (undead that would be turned are destroyed instead).",
        classSkills: []
      },
      Travel: {
        grantedPower: "For a total time per day of 1 round per cleric level, act normally regardless of magical effects that impede movement (as Freedom of Movement). Survival is a class skill.",
        classSkills: ["survival"]
      },
      Trickery: {
        grantedPower: "Bluff, Disguise, and Hide are class skills.",
        classSkills: ["bluff", "disguise", "hide"]
      },
      War: {
        grantedPower: "Free Martial Weapon Proficiency with deity's favored weapon (if necessary) and Weapon Focus with the deity's favored weapon.",
        classSkills: []
      },
      Water: {
        grantedPower: "Turn or destroy fire creatures as a good cleric turns undead. Rebuke, command, or bolster water creatures as an evil cleric rebukes undead (3 + Cha modifier/day).",
        classSkills: []
      },
      Weather: {
        grantedPower: "Survival is a class skill (gain a +2 competence bonus in natural storms).",
        classSkills: ["survival"]
      }
    };
    window.DND35_CLERIC_DOMAINS = DND35_CLERIC_DOMAINS;

    function hasClericDomainCapability(char = character) {
      if (!char) return false;
      const rawNames = [];
      if (Array.isArray(char.levelProgression)) {
        char.levelProgression.filter(p => p && p.active !== false).forEach(p => {
          if (p.className || p.class) rawNames.push(String(p.className || p.class).toLowerCase().trim());
        });
      }
      if (rawNames.length === 0 && Array.isArray(char.classProgression)) {
        char.classProgression.forEach(cp => {
          if (cp?.className || cp?.name) rawNames.push(String(cp.className || cp.name).toLowerCase().trim());
        });
      }
      if (rawNames.length === 0 && typeof char.classes === 'string' && char.classes) {
        char.classes.split(/[\/,]/).forEach(s => rawNames.push(s.toLowerCase().trim()));
      }
      if (rawNames.length === 0 && typeof char.class === 'string' && char.class) {
        rawNames.push(char.class.toLowerCase().trim());
      }
      if (rawNames.some(c => ['cleric', 'creric', 'rahip', 'priest', 'radiant servant', 'contemplative', 'church inquisitor', 'divine oracle', 'warpriest'].some(k => c.includes(k)))) {
        return true;
      }
      if (Array.isArray(char.spellcasting?.domains) && char.spellcasting.domains.filter(Boolean).length > 0) {
        return true;
      }
      return false;
    }

    function getCharacterClericDomains(char = character) {
      if (!char) return [];
      if (!char.spellcasting) char.spellcasting = {};
      if (Array.isArray(char.spellcasting.domains) && char.spellcasting.domains.some(Boolean)) {
        return char.spellcasting.domains.filter(Boolean);
      }
      // Harvest from levelProgression specialAbilities or feats if present
      const harvested = [];
      (char.levelProgression || []).forEach(p => {
        if (!p || p.active === false) return;
        [...(p.specialAbilities || []), ...(p.feats || [])].forEach(str => {
          const m = String(str || '').match(/Domain:\s*([A-Za-z]+)/i);
          if (m && DND35_CLERIC_DOMAINS[m[1]] && !harvested.includes(m[1])) {
            harvested.push(m[1]);
          }
        });
      });
      if (harvested.length > 0) {
        char.spellcasting.domains = harvested.slice(0, 2);
        return char.spellcasting.domains;
      }
      return [];
    }
    window.getCharacterClericDomains = getCharacterClericDomains;
    window.hasClericDomainCapability = hasClericDomainCapability;

    // D&D 3.5e RAW Domain Eligibility Checker (Alignment Domain Rule & Deity Portfolio Rule — PHB p. 32)
    function checkClericDomainEligibility(domainName, char = character) {
      const dom = String(domainName || '').trim();
      const charAxes = (typeof parseAlignmentAxes === 'function') ? parseAlignmentAxes(char?.alignment) : null;
      const deityMeta = (typeof getCharacterDeityMeta === 'function') ? getCharacterDeityMeta(char) : null;

      // 1. Alignment Domain Rule (PHB p. 32: "A cleric can select an alignment domain only if his alignment matches that domain.")
      const alignReqMap = {
        Good:  { check: (a) => a.ge === 1,  label: 'Good (LG, NG, or CG)' },
        Evil:  { check: (a) => a.ge === -1, label: 'Evil (LE, NE, or CE)' },
        Law:   { check: (a) => a.lc === -1, label: 'Lawful (LG, LN, or LE)' },
        Chaos: { check: (a) => a.lc === 1,  label: 'Chaotic (CG, CN, or CE)' }
      };
      if (alignReqMap[dom] && charAxes && !charAxes.isAny) {
        if (!alignReqMap[dom].check(charAxes)) {
          return {
            eligible: false,
            alignmentBlocked: true,
            deityBlocked: false,
            inDeityPortfolio: Boolean(deityMeta?.domains?.some(d => d.toLowerCase() === dom.toLowerCase())),
            reason: `PHB p. 32 Alignment Domain Rule: The ${dom} domain requires a ${alignReqMap[dom].label} alignment (current: ${charAxes.label}).`
          };
        }
      }

      // 2. Deity Portfolio Rule (PHB p. 32)
      const hasSpecificDeity = Boolean(
        deityMeta &&
        deityMeta.found &&
        !deityMeta.isPhilosophical &&
        Array.isArray(deityMeta.domains) &&
        deityMeta.domains.length > 0 &&
        !deityMeta.domains.some(d => d.toLowerCase() === 'universal')
      );
      const inPortfolio = hasSpecificDeity
        ? deityMeta.domains.some(d => d.toLowerCase() === dom.toLowerCase())
        : true;

      if (hasSpecificDeity && !inPortfolio) {
        return {
          eligible: false,
          alignmentBlocked: false,
          deityBlocked: true,
          inDeityPortfolio: false,
          reason: `Not in ${deityMeta.name}'s portfolio (${deityMeta.domains.join(', ')}).`
        };
      }

      return {
        eligible: true,
        alignmentBlocked: false,
        deityBlocked: false,
        inDeityPortfolio: hasSpecificDeity ? inPortfolio : false,
        reason: hasSpecificDeity ? `Granted by ${deityMeta.name}` : 'Available Domain'
      };
    }

    // D&D 3.5e RAW Cleric Positive/Negative Energy Policy (Cure vs. Inflict — PHB p. 32–33)
    function resolveClericEnergyPolicy(char = character) {
      const charAxes = (typeof parseAlignmentAxes === 'function') ? parseAlignmentAxes(char?.alignment) : null;
      const deityMeta = (typeof getCharacterDeityMeta === 'function') ? getCharacterDeityMeta(char) : null;
      const deityAxes = (deityMeta && !deityMeta.isPhilosophical && typeof parseAlignmentAxes === 'function')
        ? parseAlignmentAxes(deityMeta.alignment)
        : null;

      if (charAxes && !charAxes.isAny) {
        if (charAxes.ge === 1) {
          return {
            forcedMode: 'cure',
            locked: true,
            reason: `Good Cleric (${charAxes.label}) must channel Positive Energy (Cure Wounds / Turn Undead) per PHB p. 32.`
          };
        }
        if (charAxes.ge === -1) {
          return {
            forcedMode: 'inflict',
            locked: true,
            reason: `Evil Cleric (${charAxes.label}) must channel Negative Energy (Inflict Wounds / Rebuke Undead) per PHB p. 32.`
          };
        }
      }

      if (deityAxes && !deityAxes.isAny) {
        if (deityAxes.ge === 1) {
          return {
            forcedMode: 'cure',
            locked: true,
            reason: `Neutral Cleric of a Good deity (${deityMeta.name}: ${deityAxes.label}) must channel Positive Energy (Cure Wounds) per PHB p. 32.`
          };
        }
        if (deityAxes.ge === -1) {
          return {
            forcedMode: 'inflict',
            locked: true,
            reason: `Neutral Cleric of an Evil deity (${deityMeta.name}: ${deityAxes.label}) must channel Negative Energy (Inflict Wounds) per PHB p. 32.`
          };
        }
      }

      return {
        forcedMode: null,
        locked: false,
        reason: 'Neutral Cleric of a Neutral deity (or Philosophical Faith) may choose between Positive (Cure) and Negative (Inflict) Energy.'
      };
    }

    window.checkClericDomainEligibility = checkClericDomainEligibility;
    window.resolveClericEnergyPolicy = resolveClericEnergyPolicy;

    function calculateDivineSlots(divineLvl, wisScore, existingSlots = []) {
      const prevSlots = Array.isArray(existingSlots) ? existingSlots : [];
      if (Number(divineLvl) <= 0) return prevSlots.filter(s => (Number(s.daily) || 0) > 0);
      const lvl = Math.min(20, Math.max(1, Number(divineLvl) || 1));
      const wisMod = Math.floor(((Number(wisScore) || 10) - 10) / 2);
      const hasDomainSlot = hasClericDomainCapability(character);

      // D&D 3.5e RAW Base Daily Slots (PHB Table 3-6 Cleric / Table 3-8 Druid, BEFORE +1 Domain Slot)
      const baseDivineTable = [
        [],
        [3, 1],
        [4, 2],
        [4, 2, 1],
        [5, 3, 2],
        [5, 3, 2, 1],
        [5, 3, 3, 2],
        [6, 4, 3, 2, 1],
        [6, 4, 3, 3, 2],
        [6, 4, 4, 3, 2, 1],
        [6, 4, 4, 3, 3, 2],
        [6, 5, 4, 4, 3, 2, 1],
        [6, 5, 4, 4, 3, 3, 2],
        [6, 5, 5, 4, 4, 3, 2, 1],
        [6, 5, 5, 4, 4, 3, 3, 2],
        [6, 5, 5, 5, 4, 4, 3, 2, 1],
        [6, 5, 5, 5, 4, 4, 3, 3, 2],
        [6, 5, 5, 5, 5, 4, 4, 3, 2, 1],
        [6, 5, 5, 5, 5, 4, 4, 3, 3, 2],
        [6, 5, 5, 5, 5, 4, 4, 4, 3, 3],
        [6, 5, 5, 5, 5, 5, 4, 4, 4, 4]
      ];
      const baseDaily = baseDivineTable[lvl] || [3, 1];
      const result = baseDaily.map((base, spellLvl) => {
        const bonus = (spellLvl >= 1 && wisMod >= spellLvl) ? Math.floor((wisMod - spellLvl) / 4) + 1 : 0;
        const prev = prevSlots.find(s => Number(s.level) === spellLvl);
        const dmBonus = prev ? (Number(prev.dmBonus) || 0) : 0;
        const regularDaily = Math.max(0, base + bonus + dmBonus);
        const domainDaily = (hasDomainSlot && spellLvl >= 1 && spellLvl <= 9) ? 1 : 0;
        const daily = regularDaily + domainDaily;
        const domainUsed = prev ? Math.min(domainDaily, Math.max(0, Number(prev.domainUsed) || 0)) : 0;
        const used = prev ? Math.min(daily, Math.max(domainUsed, Number(prev.used) || 0)) : 0;
        return {
          level: spellLvl,
          daily,
          regularDaily,
          domainDaily,
          domainUsed,
          dmBonus,
          used,
          known: daily
        };
      });
      // Retain custom unlocked higher-level slots
      prevSlots.forEach(prev => {
        if (prev && Number(prev.level) >= baseDaily.length) {
          const dVal = Number(prev.daily) || 0;
          result.push({
            level: Number(prev.level),
            daily: dVal,
            regularDaily: Number(prev.regularDaily ?? dVal) || 0,
            domainDaily: Number(prev.domainDaily) || 0,
            domainUsed: Math.min(Number(prev.domainDaily) || 0, Number(prev.domainUsed) || 0),
            dmBonus: Number(prev.dmBonus) || 0,
            used: Math.min(dVal, Number(prev.used) || 0),
            known: dVal
          });
        }
      });
      return result;
    }
    function getPreparedCasterInfo() {
      const classesStatus = checkCharacterMagicClasses();
      const intVal = character?.stats?.INT?.value ?? character?.abilities?.int ?? 10;
      const intMod = character?.stats?.INT?.mod ?? Math.floor((intVal - 10) / 2);
      const clMode = character?.settings?.clMode || 'Class Level';
      const cType = character?.settings?.casterType || 'spontaneous';
      const cTypeExplicit = character?.settings?.casterTypeExplicit === true;
      const effBoonType = resolvePreferredMagicDiscipline(character);
      const isPrepBoon = (clMode === 'Character Level (DM Boon)' && ((cTypeExplicit && cType === 'prepared') || (!cTypeExplicit && effBoonType === 'prepared')));
      const prog = character?.levelProgression || [];
      const activeLevels = prog.filter(p => p.active !== false).length || Number(character?.level) || 0;
      const wizLvls = getMagicDisciplineClassLevels(character).prepared;
      
      let cl = 0;
      if (isPrepBoon) {
        cl = Math.max(wizLvls, activeLevels, 1);
      } else if (wizLvls > 0) {
        cl = wizLvls;
      } else if (classesStatus.hasPrepared) {
        cl = 1;
      }
      return { statKey: 'INT', statVal: intVal, statMod: intMod, cl, clMode, hasClass: classesStatus.hasPrepared, wizLvls };
    }

    function getDivineCasterInfo() {
      const classesStatus = checkCharacterMagicClasses();
      const wisVal = character?.stats?.WIS?.value ?? character?.abilities?.wis ?? 10;
      const wisMod = character?.stats?.WIS?.mod ?? Math.floor((wisVal - 10) / 2);
      const clMode = character?.settings?.clMode || 'Class Level';
      const cType = character?.settings?.casterType || 'spontaneous';
      const cTypeExplicit = character?.settings?.casterTypeExplicit === true;
      const effBoonType = resolvePreferredMagicDiscipline(character);
      const isDivBoon = (clMode === 'Character Level (DM Boon)' && ((cTypeExplicit && cType === 'divine') || (!cTypeExplicit && effBoonType === 'divine')));
      const prog = character?.levelProgression || [];
      const activeLevels = prog.filter(p => p.active !== false).length || Number(character?.level) || 0;
      const divLvls = getMagicDisciplineClassLevels(character).divine;
      
      let cl = 0;
      if (isDivBoon) {
        cl = Math.max(divLvls, activeLevels, 1);
      } else if (divLvls > 0) {
        cl = divLvls;
      } else if (classesStatus.hasDivine) {
        cl = 1;
      }
      return { statKey: 'WIS', statVal: wisVal, statMod: wisMod, cl, clMode, hasClass: classesStatus.hasDivine, divLvls };
    }

    function renderPreparedDisciplineView(hasPrepared) {
      if (!character) return;
      const container = document.getElementById('discipline-prepared-content');
      if (!container) return;

      if (!character.spellcasting) character.spellcasting = {};
      if (!Array.isArray(character.spellcasting.preparedSpells)) {
        character.spellcasting.preparedSpells = [];
      }
      if (!Array.isArray(character.spellcasting.preparedSlots)) {
        character.spellcasting.preparedSlots = [];
      }

      const { statKey, statVal, statMod, cl, clMode, hasClass, wizLvls } = getPreparedCasterInfo();
      if ((wizLvls > 0 || hasClass) && Number(cl) > 0) {
        character.spellcasting.preparedSlots = calculateWizardSlots(cl, statVal, character.spellcasting.preparedSlots);
      } else {
        character.spellcasting.preparedSlots = (character.spellcasting.preparedSlots || []).filter(s => (Number(s.dmBonus) || 0) > 0);
      }

      const slots = character.spellcasting.preparedSlots;
      const spells = character.spellcasting.preparedSpells;
      const ignoreAsf = character?.settings?.ignoreAsf !== false;
      const searchVal = (document.getElementById('prep-spell-filter-search')?.value || '').toLowerCase().trim();
      const schoolVal = document.getElementById('prep-spell-filter-school')?.value || 'all';
      const lvlFilter = window._prepSpellCurrentFilterLevel || 'all';

      // Build 4x3 Fixed Slot Matrix HTML (Levels 0-11)
      let matrixHtml = '';
      for (let lvl = 0; lvl <= 11; lvl++) {
        const s = slots.find(item => Number(item.level) === lvl);
        const isUnlocked = Boolean(s && s.daily > 0);
        const remaining = isUnlocked ? (s.daily - s.used) : 0;
        const dc = 10 + lvl + statMod;
        const lvlLabel = lvl === 0 ? '0 (Cantrip)' : (lvl >= 10 ? `Level ${lvl} (Epic)` : `Level ${lvl}`);

        if (isUnlocked) {
          matrixHtml += `
            <div class="${remaining <= 0 ? 'bg-slate-950/70 border border-slate-800/80 opacity-50 grayscale-[30%]' : 'bg-slate-900/90 border border-sky-800/60 hover:border-sky-500'} flex items-center justify-between rounded-xl px-3 py-2 shadow-sm transition w-full" ${remaining <= 0 ? 'title="⚠️ All prepared slots at this level are expended"' : ''}>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-extrabold text-white text-xs whitespace-nowrap">${lvlLabel}</span>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/90 text-emerald-400 border border-sky-700/60 font-bold whitespace-nowrap" title="Save DC = 10 + ${lvl} + ${statKey}(+${statMod >= 0 ? '+' + statMod : statMod})">DC ${dc}</span>
                </div>
                <span class="text-[10px] text-sky-300 font-mono mt-0.5">${s.daily} Prepared Slots</span>
              </div>
              <div class="h-7 w-px bg-slate-800 mx-1.5 shrink-0"></div>
              <div class="flex flex-col items-end shrink-0">
                <span class="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Slots Left</span>
                <span class="text-xs sm:text-sm font-black font-mono ${remaining > 0 ? 'text-emerald-400' : 'text-rose-500'} whitespace-nowrap">${remaining} / ${s.daily}</span>
              </div>
            </div>
          `;
        } else {
          const reqClText = lvl >= 10 ? 'Epic (CL 21+)' : `CL ${Math.max(1, lvl * 2 - 1)}+`;
          matrixHtml += `
            <div class="flex items-center justify-between bg-slate-950/50 border border-slate-800/70 rounded-xl px-3 py-2 opacity-50 select-none transition w-full" title="${lvlLabel} locked (Requires ${reqClText})">
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-bold text-slate-500 text-xs whitespace-nowrap">${lvlLabel}</span>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 font-bold whitespace-nowrap">DC ${dc}</span>
                </div>
                <span class="text-[10px] text-slate-600 font-mono mt-0.5">🔒 Locked (${reqClText})</span>
              </div>
              <div class="h-7 w-px bg-slate-800/60 mx-1.5 shrink-0"></div>
              <div class="flex flex-col items-end shrink-0">
                <span class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">Slots Left</span>
                <span class="text-xs sm:text-sm font-black font-mono text-slate-600 whitespace-nowrap">🔒 0 / 0</span>
              </div>
            </div>
          `;
        }
      }

      const unlockedLevels = slots.filter(s => s.daily > 0).map(s => Number(s.level));
      const allLevels = Array.from(new Set([...unlockedLevels, ...spells.map(s => Number(s.level || 0))])).sort((a, b) => a - b);
      const pillsHtml = ['all', ...allLevels].map(lvl => {
        const isActive = String(lvlFilter) === String(lvl);
        const label = lvl === 'all' ? 'All' : (lvl === 0 ? 'Level 0' : `Level ${lvl}`);
        return `
          <button type="button" onclick="setPreparedFilterLevel('${lvl}')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
            isActive ? 'bg-sky-700 text-white border-sky-400 shadow' : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
          }">${label}</button>
        `;
      }).join('');

      const displayLevels = lvlFilter === 'all' ? allLevels : [Number(lvlFilter)];
      let rowsHtml = '';
      let totalRendered = 0;

      displayLevels.forEach(lvl => {
        const spellsAtLvl = [];
        spells.forEach((s, idx) => {
          if (Number(s.level || 0) === lvl) spellsAtLvl.push({ s, idx });
        });
        const dc = 10 + lvl + statMod;
        const slotObj = slots.find(sl => Number(sl.level) === lvl);
        const remainingSlots = slotObj ? Math.max(0, (slotObj.daily || 0) - (slotObj.used || 0)) : 0;
        const totalDaily = slotObj ? (slotObj.daily || 0) : 0;
        const hasActiveSlot = remainingSlots > 0;
        const theme = getSpellLevelTheme(lvl);

        // Seviye Renk Geçiş Başlığı (Level Section Divider)
        if (lvlFilter === 'all') {
          rowsHtml += `
            <tr class="bg-gradient-to-r ${theme.headerGradient} border-y ${theme.border} text-xs font-black select-none">
              <td colspan="8" class="py-2 px-3">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${theme.dot}"></span>
                    <span class="${theme.text} uppercase tracking-wider font-extrabold text-[11px]">${lvl === 0 ? 'Level 0 (Cantrips)' : `Level ${lvl} Prepared Spells`}</span>
                    <span class="text-[10px] text-slate-400 font-normal">DC ${dc}</span>
                  </div>
                  <div class="flex items-center gap-2 text-[10px]">
                    <span class="${hasActiveSlot ? theme.slotBadgeActive : 'bg-slate-900 text-rose-400 border border-rose-900/60'} px-2 py-0.5 rounded font-mono font-bold">
                      ${totalDaily > 0 ? (hasActiveSlot ? `⚡ ${remainingSlots}/${totalDaily} Slots Ready` : `0/${totalDaily} Slots (Expended)`) : '🔒 No Slots (0/0)'}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          `;
        }

        if (searchVal || schoolVal !== 'all') {
          spellsAtLvl.filter(({ s }) => {
            if (schoolVal !== 'all' && (s.school || '').toLowerCase() !== schoolVal.toLowerCase()) return false;
            if (searchVal) {
              const str = `${s.name || ''} ${s.benefit || ''} ${s.school || ''}`.toLowerCase();
              if (!str.includes(searchVal)) return false;
            }
            return true;
          }).forEach(({ s, idx }) => {
            totalRendered++;
            rowsHtml += buildPreparedRowHtml(s, idx, lvl, dc);
          });
        } else {
          const quota = slotObj ? slotObj.daily : spellsAtLvl.length;
          const totalRows = Math.max(quota, spellsAtLvl.length);
          for (let i = 0; i < totalRows; i++) {
            totalRendered++;
            if (i < spellsAtLvl.length) {
              rowsHtml += buildPreparedRowHtml(spellsAtLvl[i].s, spellsAtLvl[i].idx, lvl, dc);
            } else {
              rowsHtml += buildPreparedEmptyRowHtml(lvl, dc);
            }
          }
        }
      });

      function buildPreparedRowHtml(s, originalIdx, lvl, dc) {
        const slotObj = slots.find(sl => Number(sl.level) === lvl);
        const remainingSlots = slotObj ? Math.max(0, (slotObj.daily || 0) - (slotObj.used || 0)) : 0;
        const hasActiveSlot = remainingSlots > 0;
        const theme = getSpellLevelTheme(lvl);
        const dmgExpr = s.damageDice || findDiceExpression(s.benefit);

        return `
          <tr class="transition border-l-4 ${theme.borderLeft} ${
            hasActiveSlot ? `hover:bg-slate-900/70 ${theme.rowBg}` : 'opacity-40 grayscale-[35%] bg-slate-950/60'
          }">
            <td class="py-2.5 px-3 text-center align-middle">
              <span class="badge ${theme.badge} text-[10px] font-bold font-mono px-2 py-0.5">${lvl}</span>
            </td>
            <td class="py-2.5 px-3 font-bold text-white align-middle">
              <div class="flex items-center gap-2 whitespace-nowrap">
                ${getUniversalPinButtonHtml({ name: s.name, type: 'Spell', action: s.action || 'Standard Action', desc: s.benefit || '', badge: dmgExpr || '', damageDice: dmgExpr || '' })}
                <span>📖</span>
                <span class="${hasActiveSlot ? 'text-white' : 'text-slate-400'}">${s.name}</span>
                ${!hasActiveSlot ? `<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950/90 text-rose-300 border border-rose-800/80 font-bold shrink-0">0 Slot</span>` : ''}
              </div>
            </td>
            <td class="py-2.5 px-3 text-slate-300">
              <span class="badge bg-sky-950/60 text-sky-300 border border-sky-800/80 text-[10px] font-semibold">${s.school || 'Universal'}</span>
            </td>
            <td class="py-2.5 px-3 text-center text-amber-300 text-[11px] whitespace-nowrap font-medium" title="${s.action || 'Standard Action'}">${formatActionShort(s.action)}</td>
            <td class="py-2.5 px-3 text-slate-300 text-[11px]">${s.range || '-'}</td>
            <td class="py-2.5 px-3 text-center">
              <span class="badge bg-slate-900 text-emerald-300 border border-emerald-700/60 font-mono text-[11px] font-bold">DC ${dc}</span>
            </td>
            <td class="py-2.5 px-3 text-slate-300 text-[11px]">${s.benefit || '-'}</td>
            <td class="py-2.5 px-3 text-right align-middle">
              <div class="flex items-center justify-end gap-2 w-full">
                ${dmgExpr ? `
                  <button onclick="castPreparedSpellDirectly(${originalIdx})" class="${
                    hasActiveSlot 
                      ? 'bg-amber-950/90 hover:bg-amber-800 text-amber-300 hover:text-white border-amber-600/80 cursor-pointer shadow' 
                      : 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                  } text-xs font-bold font-mono px-2.5 py-1 rounded-lg border transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap" title="${
                    hasActiveSlot ? `Cast Spell & Roll Damage (${dmgExpr})` : '⚠️ No active spell slots remaining (0 Left)'
                  }">
                    ${getFormulaDiceIconSvg(dmgExpr, 'w-3.5 h-3.5 text-amber-400 shrink-0')}
                    <span>${dmgExpr}</span>
                  </button>
                ` : `
                  <button onclick="castPreparedSpellDirectly(${originalIdx})" class="${
                    hasActiveSlot 
                      ? 'bg-sky-900/70 hover:bg-sky-600 text-white border-sky-500 cursor-pointer shadow' 
                      : 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                  } text-xs font-bold px-2.5 py-1 rounded-lg border transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap" title="${
                    hasActiveSlot ? 'Cast Spell (Spend Slot)' : '⚠️ No active spell slots remaining (0 Left)'
                  }">
                    <span>📖</span>
                    <span>Cast</span>
                  </button>
                `}
                <button onclick="deletePreparedSpell(${originalIdx})" class="w-6 h-6 inline-flex items-center justify-center text-slate-500 hover:text-rose-400 text-xs transition cursor-pointer shrink-0" title="Unprepare / Remove Spell (Leaves Empty Slot)">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      }

      function buildPreparedEmptyRowHtml(lvl, dc) {
        const slotObj = slots.find(sl => Number(sl.level) === lvl);
        const remainingSlots = slotObj ? Math.max(0, (slotObj.daily || 0) - (slotObj.used || 0)) : 0;
        const hasActiveSlot = remainingSlots > 0;
        const theme = getSpellLevelTheme(lvl);

        return `
          <tr class="transition cursor-pointer group border-l-4 ${theme.borderLeft} ${
            hasActiveSlot ? 'hover:bg-sky-950/25 bg-slate-950/20' : 'opacity-40 grayscale-[35%] bg-slate-950/60'
          }" onclick="if(!event.target.closest('button')) openPreparedSpellPickerForLevel(${lvl})">
            <td class="py-2.5 px-3 text-center align-middle">
              <span class="badge ${theme.badge} opacity-60 text-[10px] font-bold font-mono px-2 py-0.5">${lvl}</span>
            </td>
            <td class="py-2.5 px-3">
              <button type="button" onclick="openPreparedSpellPickerForLevel(${lvl})" class="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300/80 group-hover:text-sky-100 cursor-pointer">
                <span class="w-4 h-4 rounded border border-dashed border-sky-500/70 bg-sky-950/60 flex items-center justify-center text-[10px] text-sky-300 group-hover:bg-sky-800 transition">+</span>
                <span class="italic">+ Prepare Spell (Empty Slot)</span>
              </button
            </td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
            <td class="py-2.5 px-3 text-center">
              <span class="badge bg-slate-900/60 text-slate-500 border border-slate-800/80 font-mono text-[10px]">DC ${dc}</span>
            </td>
            <td class="py-2.5 px-3 text-slate-500 text-[11px] italic">This prepared slot is empty. Click to prepare a ${lvl === 0 ? 'Level 0 (Cantrip)' : `Level ${lvl}`} spell.</td>
            <td class="py-2.5 px-3 text-right align-middle">
              <div class="flex items-center justify-end gap-2 w-full">
                <button type="button" onclick="openPreparedSpellPickerForLevel(${lvl})" class="bg-sky-950/80 hover:bg-sky-900 text-sky-300 hover:text-white border border-dashed border-sky-500/80 text-xs font-bold px-2.5 py-1 rounded-lg transition shadow-sm inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap" title="Prepare Level ${lvl} Spell">
                  <span>✨</span>
                  <span>+ Select Spell</span>
                </button>
                <span class="w-6 h-6 shrink-0 inline-block"></span>
              </div>
            </td>
          </tr>
        `;
      }

      container.innerHTML = `
        <div class="space-y-4">
          <!-- Caster Header Bar -->
          <div class="bg-gradient-to-r from-sky-950/70 via-slate-900 to-blue-950/50 border border-sky-600/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-lg bg-sky-900/70 border border-sky-500/60 flex items-center justify-center text-lg shadow-inner">
                📖
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-extrabold text-white text-sm md:text-base">Prepared Spellbook (Vancian)</h3>
                  <span class="badge bg-sky-950 text-sky-300 border border-sky-700 text-[10px] font-bold">Wizard</span>
                  <span class="badge bg-amber-950/90 text-amber-300 border border-amber-500/80 text-xs font-extrabold px-2.5 py-0.5 font-mono shadow-sm" title="Caster Level: ${cl} (${clMode})">CL: ${cl}</span>
                  ${!hasPrepared ? `<span class="badge bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">Preview / Inactive Class</span>` : ''}
                </div>
                <p class="text-[11px] text-sky-300">Stat Mod: ${statMod >= 0 ? '+' + statMod : statMod} (${statKey}: ${statVal}) • Includes Base + 24h Gear Bonus • ${clMode}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge ${ignoreAsf ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-slate-800 text-slate-400 border border-slate-700'} text-xs font-bold">${ignoreAsf ? '🛡️ ASF: 0% (DM Boon)' : '🛡️ ASF: Standard'}</span>
              <button onclick="restoreAllPreparedSlots()" class="bg-sky-800 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-sky-500/50 shadow transition flex items-center gap-1 cursor-pointer">
                <span>✨</span>
                <span>Restore All Slots</span>
              </button>
            </div>
          </div>

          <!-- 4x3 Fixed Slot Matrix -->
          <div class="bg-slate-950/80 border border-sky-900/50 rounded-xl p-2.5 space-y-2 shadow">
            <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] px-1">
              <span class="text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span>
                <span>Daily Prepared Slots (4×3 Vancian Matrix):</span>
              </span>
              <div class="flex items-center gap-2">
                <span class="text-slate-400 text-[10px] hidden sm:inline">Casting expends a prepared slot • DM bonus slots supported</span>
                <button type="button" onclick="openSpellSlotsModal(undefined, 'prepared')" class="text-[9px] text-amber-400 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-amber-900/50 transition" title="Slot Management &amp; DM Bonuses">
                  <span>⚙️</span>
                  <span>Slot &amp; DM Bonus Manager</span>
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              ${matrixHtml}
            </div>
          </div>

          <!-- Search & Filters + Prepared Spells Table -->
          <div class="space-y-3">
            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                <div class="relative flex-1 min-w-[180px]">
                  <input type="text" id="prep-spell-filter-search" value="${searchVal}" oninput="renderPreparedDisciplineView(${Boolean(hasPrepared)})" placeholder="Search prepared spell name, school, or effect..." class="w-full bg-slate-950 text-white placeholder-slate-500 text-xs rounded-lg border border-slate-700 px-3 py-1.5 pl-8 focus:outline-none focus:border-sky-500">
                  <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                </div>
                <select id="prep-spell-filter-school" onchange="renderPreparedDisciplineView(${Boolean(hasPrepared)})" class="bg-slate-950 text-slate-300 text-xs rounded-lg border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-sky-500">
                  <option value="all" ${schoolVal === 'all' ? 'selected' : ''}>All Schools</option>
                  <option value="Abjuration" ${schoolVal === 'Abjuration' ? 'selected' : ''}>Abjuration</option>
                  <option value="Conjuration" ${schoolVal === 'Conjuration' ? 'selected' : ''}>Conjuration</option>
                  <option value="Divination" ${schoolVal === 'Divination' ? 'selected' : ''}>Divination</option>
                  <option value="Enchantment" ${schoolVal === 'Enchantment' ? 'selected' : ''}>Enchantment</option>
                  <option value="Evocation" ${schoolVal === 'Evocation' ? 'selected' : ''}>Evocation</option>
                  <option value="Illusion" ${schoolVal === 'Illusion' ? 'selected' : ''}>Illusion</option>
                  <option value="Necromancy" ${schoolVal === 'Necromancy' ? 'selected' : ''}>Necromancy</option>
                  <option value="Transmutation" ${schoolVal === 'Transmutation' ? 'selected' : ''}>Transmutation</option>
                  <option value="Universal" ${schoolVal === 'Universal' ? 'selected' : ''}>Universal</option>
                </select>
              </div>
              <div class="flex flex-wrap items-center gap-1">
                ${pillsHtml}
              </div>
            </div>

            <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 shadow">
              <div class="bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-sky-300 flex justify-between items-center border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <span>📖</span>
                  <span class="uppercase tracking-wider">POOL: PREPARED SPELLS &amp; SPELLBOOK</span>
                </div>
                <span class="text-[11px] text-slate-400 font-normal">✨ Cast prepared spells or fill empty Vancian slots</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th class="py-2.5 px-3 w-12 text-center">Lvl</th>
                      <th class="py-2.5 px-3 min-w-[200px]">Spell Name</th>
                      <th class="py-2.5 px-3 w-28">School</th>
                      <th class="py-2.5 px-3 w-16 text-center">Action</th>
                      <th class="py-2.5 px-3 w-28">Range</th>
                      <th class="py-2.5 px-3 w-20 text-center">DC</th>
                      <th class="py-2.5 px-3">Effect & Description</th>
                      <th class="py-2.5 px-3 text-right pr-4 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 font-medium">
                    ${totalRendered > 0 ? rowsHtml : `<tr><td colspan="8" class="py-8 text-center text-slate-400"><p class="text-xs">No spells match the current filters.</p></td></tr>`}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function setPreparedFilterLevel(lvl) {
      window._prepSpellCurrentFilterLevel = lvl;
      const classesStatus = checkCharacterMagicClasses();
      renderPreparedDisciplineView(classesStatus.hasPrepared);
    }

    function openPreparedSpellPickerForLevel(lvl) {
      window._spellPickerTargetPool = 'prepared';
      openSpellManeuverPickerModal('Spell', lvl);
    }

    function deletePreparedSpell(idx) {
      if (!character?.spellcasting?.preparedSpells?.[idx]) return;
      const s = character.spellcasting.preparedSpells[idx];
      character.spellcasting.preparedSpells.splice(idx, 1);
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '🗑️',
        title: 'Spell Unprepared',
        breakdown: `"${s.name}" removed. Prepared slot is now empty.`,
        total: 'Slot Empty'
      });
    }

    function resolveSpellEffectiveFormula(s, cl = 6) {
      if (!s) return null;
      const v2Part = Array.isArray(s.damageParts) && s.damageParts[0] ? s.damageParts[0].dice : null;
      const direct = v2Part || s.damageDice || s.dice || findDiceExpression(s.benefit || s.notes || s.description);
      if (direct) return direct;
      const n = (s.name || '').toLowerCase().trim();
      if (n === 'heal' || n === 'mass heal') {
        const cap = n === 'mass heal' ? 250 : 150;
        return String(Math.min(cap, 10 * Math.max(1, Number(cl) || 6)));
      }
      if (n === 'cure minor wounds' || n === 'inflict minor wounds' || n === 'virtue') {
        return '1';
      }
      return null;
    }

    // Apply a Canonical V2 Spell Buff to `character.buffs` (Self or Target Weapon) and recalculate character stats
    function applySpellBuffToCharacter(spellItem, cl = 1, options = {}) {
      if (!character || !spellItem) return null;
      const effCl = Math.max(1, Number(cl || spellItem.casterLevel || character.level) || 1);
      const buffSpec = (typeof RuleEngine !== 'undefined' && RuleEngine.resolveSpellBuffSpec)
        ? RuleEngine.resolveSpellBuffSpec(spellItem, character, effCl)
        : null;
      if (!buffSpec || !buffSpec.isBuffSpell) return null;

      if (!Array.isArray(character.buffs)) character.buffs = [];

      const targetWeaponName = options.targetWeapon ? String(options.targetWeapon).trim() : null;
      const buffObj = {
        id: buffSpec.id || `buff_${Date.now()}`,
        schemaVersion: 2,
        name: buffSpec.name,
        active: true,
        source: 'Spell',
        casterLevel: effCl,
        cl: effCl,
        duration: buffSpec.durationText,
        modifiers: Array.isArray(buffSpec.modifiers) ? JSON.parse(JSON.stringify(buffSpec.modifiers)) : [],
        ruleFlags: buffSpec.ruleFlags ? JSON.parse(JSON.stringify(buffSpec.ruleFlags)) : {},
        summary: buffSpec.summaryText,
        description: `${buffSpec.summaryText} (${buffSpec.durationText})`
      };

      if (targetWeaponName) {
        buffObj.targetWeapon = targetWeaponName;
        if (buffSpec.sizeModifier?.targetType === 'weapon') {
          const wepObj = (character.weapons || []).find(w => w && w.name === targetWeaponName);
          const oldDice = (Array.isArray(wepObj?.damageParts) && wepObj.damageParts[0]?.dice) || wepObj?.dice || '1d8';
          const steps = buffSpec.sizeModifier.scaling?.type === 'per_caster_level'
            ? Math.min(buffSpec.sizeModifier.scaling.maxSteps || 5, Math.floor(effCl / (buffSpec.sizeModifier.scaling.clDivisor || 4)))
            : (buffSpec.sizeModifier.scaling?.steps || 1);
          const newDice = (typeof RuleEngine !== 'undefined' && RuleEngine.stepDamageDice)
            ? RuleEngine.stepDamageDice(oldDice, steps)
            : oldDice;
          buffObj.sizeSteps = steps;
          buffObj.baseDice = oldDice;
          buffObj.effectiveDice = newDice;
          buffObj.summary = `${targetWeaponName}: ${oldDice} ➔ ${newDice} (+${steps} Size)`;
          buffObj.description = `${targetWeaponName} damage dice increased by +${steps} size step(s) (${oldDice} ➔ ${newDice}) for ${buffSpec.durationText}.`;
        } else {
          buffObj.summary = `${targetWeaponName}: ${buffSpec.summaryText}`;
          buffObj.description = `${targetWeaponName} gains ${buffSpec.summaryText} for ${buffSpec.durationText}.`;
        }
      } else if (buffSpec.sizeModifier?.targetType === 'creature') {
        const steps = buffSpec.sizeModifier.scaling?.steps || 1;
        buffObj.targetType = 'creature';
        buffObj.sizeSteps = steps;
      }

      const existingIdx = character.buffs.findIndex(b => {
        if (!b || !b.name) return false;
        const sameName = b.name.toLowerCase().trim() === buffObj.name.toLowerCase().trim();
        const sameWep = (b.targetWeapon || '') === (buffObj.targetWeapon || '');
        return sameName && sameWep;
      });

      if (existingIdx !== -1) {
        character.buffs[existingIdx] = buffObj;
      } else {
        character.buffs.push(buffObj);
      }

      // Apply flat Temp HP if part of the buff (e.g. Divine Power, Greater Heroism, Heart of Earth)
      if (buffSpec.evaluatedTempHp > 0 && !options.skipTempHp && character.hp) {
        const prevTemp = Math.max(0, Number(character.hp.temp) || 0);
        character.hp.temp = Math.max(prevTemp, buffSpec.evaluatedTempHp);
      }

      if (typeof RuleEngine !== 'undefined' && RuleEngine.recalculateCharacter) {
        RuleEngine.recalculateCharacter(character, typeof masterDb !== 'undefined' ? masterDb : []);
      }
      saveStateToStorage(true);
      renderAll();

      if (!options.silentToast) {
        showDiceTopToast({
          icon: '🛡️',
          title: `${buffObj.name} ➔ ${targetWeaponName || 'Self'}`,
          breakdown: `${buffObj.summary} • CL ${effCl} • Duration: ${buffSpec.durationText}`,
          total: 'Buff Active'
        });
      }
      return buffObj;
    }
    window.applySpellBuffToCharacter = applySpellBuffToCharacter;

    // Handle casting of any Buff Spell (Personal auto-apply, Single/Party Self vs Ally prompt, or Weapon Target prompt)
    function handleBuffSpellCast(spellItem, cl = 1, slotLabel = 'Spell Slot Expended', icon = '✨') {
      if (!character || !spellItem || typeof RuleEngine === 'undefined' || !RuleEngine.resolveSpellBuffSpec) {
        return false;
      }
      const effCl = Math.max(1, Number(cl || spellItem.casterLevel || character.level) || 1);
      const buffSpec = RuleEngine.resolveSpellBuffSpec(spellItem, character, effCl);
      if (!buffSpec || !buffSpec.isBuffSpell) return false;

      // If the spell rolls dice for Temp HP (e.g. Aid 1d8+CL, False Life 1d10+CL), let the dice roller run first;
      // applySpellTempHpToSelf will automatically apply the V2 buff modifiers when the player clicks Self!
      const dmgExpr = resolveSpellEffectiveFormula(spellItem, effCl);
      if (dmgExpr && /\d+d\d+/i.test(dmgExpr)) {
        return false;
      }

      // 1. Weapon-Targeted Buff Spells (Greater Mighty Wallop, Mighty Wallop, Magic Weapon, Greater Magic Weapon, Keen Edge)
      if (buffSpec.targetMode === 'weapon') {
        const eligibleWeapons = (character.weapons || []).filter(w => {
          if (!w || !w.name || w.name === '-') return false;
          const filter = buffSpec.sizeModifier?.targetFilter;
          if (filter?.meleeOnly) {
            const isRanged = w.isRanged || w.grip === 'Ranged' || (Array.isArray(w.tags) && w.tags.some(t => String(t).toLowerCase() === 'ranged'));
            if (isRanged) return false;
          }
          if (Array.isArray(filter?.allowedDmgTypes) && filter.allowedDmgTypes.length > 0) {
            const pType = (Array.isArray(w.damageParts) && w.damageParts[0]?.type) || w.dmgType || '';
            const dt = String(pType).toLowerCase();
            const tags = (w.tags || []).map(t => String(t).toLowerCase());
            const matchesType = filter.allowedDmgTypes.some(type => {
              const tLower = type.toLowerCase();
              return dt.includes(tLower) || tags.includes(tLower);
            });
            if (!matchesType) return false;
          }
          return true;
        });

        const actions = eligibleWeapons.map(wep => {
          let btnLabel = `⚔️ ${wep.name}`;
          if (buffSpec.sizeModifier?.targetType === 'weapon' && RuleEngine.stepDamageDice) {
            const oldDice = (Array.isArray(wep.damageParts) && wep.damageParts[0]?.dice) || wep.dice || '1d8';
            const steps = buffSpec.sizeModifier.scaling?.type === 'per_caster_level'
              ? Math.min(buffSpec.sizeModifier.scaling.maxSteps || 5, Math.floor(effCl / (buffSpec.sizeModifier.scaling.clDivisor || 4)))
              : (buffSpec.sizeModifier.scaling?.steps || 1);
            const newDice = RuleEngine.stepDamageDice(oldDice, steps);
            btnLabel = `⚔️ ${wep.name} (${oldDice} ➔ ${newDice})`;
          }
          return {
            label: btnLabel,
            className: 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-700 hover:bg-amber-600 text-white border border-amber-400 transition shadow cursor-pointer',
            onClick: () => applySpellBuffToCharacter(spellItem, effCl, { targetWeapon: wep.name })
          };
        });

        actions.push({
          label: '🤝 Ally Weapon (Slot Only)',
          className: 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer',
          onClick: () => {
            showDiceTopToast({
              icon: '🤝',
              title: `${buffSpec.name} (Ally's Weapon)`,
              breakdown: `Cast on ally's weapon (${buffSpec.summaryText}) • ${slotLabel}`,
              total: '-1 Slot'
            });
          }
        });

        showDiceTopToast({
          icon: '⚔️',
          title: `${buffSpec.name} — Select Weapon`,
          breakdown: eligibleWeapons.length > 0
            ? `${buffSpec.summaryText} • CL ${effCl} (${buffSpec.durationText}) • ${slotLabel}`
            : `No eligible personal weapon (${buffSpec.summaryText}) • Select Ally Weapon if casting on party member`,
          total: 'Target?',
          actions
        });
        return true;
      }

      // 2. Personal Range Buffs (Primal Senses, Primal Instinct, Divine Favor, Divine Power, Righteous Might, Shield, etc.)
      if (buffSpec.targetMode === 'self') {
        applySpellBuffToCharacter(spellItem, effCl, { slotLabel, icon });
        return true;
      }

      // 3. Touch / Single-Target or Party Buffs (Bull's Strength, Shield of Faith, Barkskin, Bless, Prayer, Haste, Conviction, etc.)
      const selfLabel = buffSpec.targetMode === 'party'
        ? `🛡️ Self & Party (${buffSpec.summaryText})`
        : `🛡️ Self (${buffSpec.summaryText})`;
      const allyLabel = buffSpec.targetMode === 'party'
        ? '🤝 Allies Only (Slot Only)'
        : '🤝 Ally / Target (Slot Only)';

      showDiceTopToast({
        icon: icon || '✨',
        title: `${buffSpec.name} — Select Target`,
        breakdown: `${buffSpec.summaryText} • CL ${effCl} (${buffSpec.durationText}) • ${slotLabel}`,
        total: 'Target?',
        actions: [
          {
            label: selfLabel,
            className: 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400 transition shadow cursor-pointer',
            onClick: () => applySpellBuffToCharacter(spellItem, effCl, { slotLabel, icon })
          },
          {
            label: allyLabel,
            className: 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer',
            onClick: () => {
              showDiceTopToast({
                icon: '🤝',
                title: `${buffSpec.name} ➔ Ally`,
                breakdown: `Cast on Ally (${buffSpec.summaryText} • ${buffSpec.durationText}) • ${slotLabel}`,
                total: '-1 Slot'
              });
            }
          }
        ]
      });
      return true;
    }
    window.handleBuffSpellCast = handleBuffSpellCast;

    function getClericSpontaneousSpellInfo(lvl, cl = 6, mode = 'cure') {
      const numLvl = Number(lvl);
      if (isNaN(numLvl) || numLvl < 0 || numLvl > 8) return null;
      const effCl = Math.max(1, Number(cl) || 6);
      const isCure = mode !== 'inflict';

      if (numLvl === 0) {
        return isCure
          ? { name: 'Cure Minor Wounds', formula: '1', effectType: 'heal', shortLabel: 'Cure (1 HP)', icon: '💚' }
          : { name: 'Inflict Minor Wounds', formula: '1', effectType: 'damage', shortLabel: 'Inflict (1)', icon: '💀' };
      }

      const tierNames = ['', 'Light', 'Moderate', 'Serious', 'Critical'];
      if (numLvl >= 1 && numLvl <= 4) {
        const cap = Math.min(effCl, numLvl * 5);
        const formula = `${numLvl}d8+${cap}`;
        const tier = tierNames[numLvl];
        return isCure
          ? { name: `Cure ${tier} Wounds`, formula, effectType: 'heal', shortLabel: `Cure (${formula})`, icon: '💚' }
          : { name: `Inflict ${tier} Wounds`, formula, effectType: 'damage', shortLabel: `Inflict (${formula})`, icon: '💀' };
      }

      const diceCount = numLvl - 4;
      const cap = Math.min(effCl, numLvl * 5);
      const formula = `${diceCount}d8+${cap}`;
      const tier = tierNames[diceCount];
      return isCure
        ? { name: `Mass Cure ${tier} Wounds`, formula, effectType: 'heal', shortLabel: `M.Cure (${formula})`, icon: '💚' }
        : { name: `Mass Inflict ${tier} Wounds`, formula, effectType: 'damage', shortLabel: `M.Inflict (${formula})`, icon: '💀' };
    }

    function toggleClericSpontaneousMode() {
      if (!character.spellcasting) character.spellcasting = {};
      const policy = resolveClericEnergyPolicy(character);
      if (policy.locked && policy.forcedMode) {
        character.spellcasting.clericSpontaneousMode = policy.forcedMode;
        saveStateToStorage(true);
        const classesStatus = checkCharacterMagicClasses();
        renderDivineDisciplineView(classesStatus.hasDivine);
        showDiceTopToast({
          icon: policy.forcedMode === 'cure' ? '💚' : '💀',
          title: 'Energy Channel Locked by Alignment / Deity',
          breakdown: policy.reason,
          total: policy.forcedMode === 'cure' ? 'Cure Only' : 'Inflict Only'
        });
        return;
      }
      const cur = character.spellcasting.clericSpontaneousMode || 'cure';
      const next = cur === 'cure' ? 'inflict' : 'cure';
      character.spellcasting.clericSpontaneousMode = next;
      saveStateToStorage(true);
      const classesStatus = checkCharacterMagicClasses();
      renderDivineDisciplineView(classesStatus.hasDivine);
      showDiceTopToast({
        icon: next === 'cure' ? '💚' : '💀',
        title: next === 'cure' ? 'Positive Energy (Cure Wounds)' : 'Negative Energy (Inflict Wounds)',
        breakdown: next === 'cure'
          ? 'Cleric spontaneous casting channel set to Cure Wounds (Positive Energy).'
          : 'Cleric spontaneous casting channel set to Inflict Wounds (Negative Energy).',
        total: next === 'cure' ? 'Cure' : 'Inflict'
      });
    }

    function castClericSpontaneousConversion(spellIdx) {
      const s = character?.spellcasting?.divineSpells?.[spellIdx];
      if (!s) return;
      if (s.isDomainSpell) {
        showDiceTopToast({
          icon: '⚜️',
          title: 'Domain Spell Restriction',
          breakdown: 'D&D 3.5e RAW (PHB p.32): Cleric Domain spells cannot be spontaneously converted into Cure or Inflict spells.',
          total: 'Not Allowed'
        });
        return;
      }
      const lvl = Number(s.level) || 0;
      const { cl } = getDivineCasterInfo();
      const mode = character?.spellcasting?.clericSpontaneousMode || 'cure';
      const spont = getClericSpontaneousSpellInfo(lvl, cl, mode);
      if (!spont) return;

      const slot = character.spellcasting?.divineSlots?.find(sl => Number(sl.level) === lvl);
      const regDaily = slot ? (slot.regularDaily ?? Math.max(0, (slot.daily || 0) - (slot.domainDaily || 0))) : 0;
      const regUsed = slot ? Math.max(0, (slot.used || 0) - (slot.domainUsed || 0)) : 0;
      if (slot && regUsed < regDaily && slot.used < slot.daily) {
        slot.used++;
        saveStateToStorage(true);
        renderAll();
        rollSpellOrManeuverFormula(
          spont.formula,
          `${s.name} ➔ ${spont.name} (Level ${lvl} • -1 Slot)`,
          { name: spont.name, effectType: spont.effectType }
        );
      } else {
        showDiceTopToast({
          icon: '⚠️',
          title: 'No Regular Slots Remaining',
          breakdown: `No Level ${lvl} regular divine spell slots remaining!`,
          total: '0 Slots'
        });
      }
    }

    function castPreparedSpellDirectly(spellIdx) {
      const s = character?.spellcasting?.preparedSpells?.[spellIdx];
      if (!s) return;
      const name = s.name;
      const lvl = Number(s.level) || 0;
      const { cl } = getPreparedCasterInfo();
      const dmgExpr = resolveSpellEffectiveFormula(s, cl);
      const slot = character.spellcasting?.preparedSlots?.find(sl => Number(sl.level) === lvl);
      if (!slot || slot.used >= slot.daily) {
        showDiceTopToast({
          icon: '\u26A0\uFE0F',
          title: 'No Slots Remaining',
          breakdown: `No Level ${lvl} prepared spell slots remaining!`,
          total: '0 Slots'
        });
        return;
      }

      const preCast = getSpellPreCastOptions(s, cl, slot, lvl);
      if (preCast && Array.isArray(preCast.options) && preCast.options.length > 0) {
        showSpellPreCastChoiceToast(preCast);
        return;
      }

      if (slot && slot.used < slot.daily) {
        slot.used++;
        saveStateToStorage(true);
        renderAll();
        if (handleBuffSpellCast(s, cl, `Level ${lvl} Prepared Slot Expended`, '📖')) {
          return;
        }
        if (dmgExpr) {
          rollSpellOrManeuverFormula(dmgExpr, `${name} (Level ${lvl} • -1 Slot)`, s);
        } else {
          showDiceTopToast({
            icon: '📖',
            title: name,
            breakdown: `Level ${lvl} Prepared Spell Slot Expended`,
            total: '-1 Slot',
          });
        }
      } else {
        showDiceTopToast({
          icon: '⚠️',
          title: 'No Slots Remaining',
          breakdown: `No Level ${lvl} prepared spell slots remaining!`,
          total: '0 Slots'
        });
      }
    }

    function restoreAllPreparedSlots() {
      (character?.spellcasting?.preparedSlots || []).forEach(s => s.used = 0);
      saveStateToStorage();
      renderAll();
      showDiceTopToast({
        icon: '✨',
        title: 'Prepared Spell Slots',
        breakdown: 'All daily prepared spell slots refreshed',
        total: 'Restored'
      });
    }

    function renderDivineDisciplineView(hasDivine) {
      if (!character) return;
      const container = document.getElementById('discipline-divine-content');
      if (!container) return;

      if (!character.spellcasting) character.spellcasting = {};
      if (!Array.isArray(character.spellcasting.divineSpells)) {
        character.spellcasting.divineSpells = [];
      }
      if (!Array.isArray(character.spellcasting.divineSlots)) {
        character.spellcasting.divineSlots = [];
      }

      const { statKey, statVal, statMod, cl, clMode, hasClass, divLvls } = getDivineCasterInfo();
      const energyPolicy = resolveClericEnergyPolicy(character);
      if (energyPolicy.forcedMode && character.spellcasting.clericSpontaneousMode !== energyPolicy.forcedMode) {
        character.spellcasting.clericSpontaneousMode = energyPolicy.forcedMode;
      }
      const spontMode = character.spellcasting.clericSpontaneousMode || 'cure';
      if ((divLvls > 0 || hasClass) && Number(cl) > 0) {
        character.spellcasting.divineSlots = calculateDivineSlots(cl, statVal, character.spellcasting.divineSlots);
      } else {
        character.spellcasting.divineSlots = (character.spellcasting.divineSlots || []).filter(s => (Number(s.dmBonus) || 0) > 0);
      }

      const slots = character.spellcasting.divineSlots;
      const spells = character.spellcasting.divineSpells;
      const hasDomainCap = hasClericDomainCapability(character);
      const chosenDomains = getCharacterClericDomains(character);
      const searchVal = (document.getElementById('divine-spell-filter-search')?.value || '').toLowerCase().trim();
      const schoolVal = document.getElementById('divine-spell-filter-school')?.value || 'all';
      const lvlFilter = window._divineSpellCurrentFilterLevel || 'all';

      // Build 4x3 Fixed Slot Matrix HTML (Levels 0-11)
      let matrixHtml = '';
      for (let lvl = 0; lvl <= 11; lvl++) {
        const s = slots.find(item => Number(item.level) === lvl);
        const isUnlocked = Boolean(s && s.daily > 0);
        const remaining = isUnlocked ? (s.daily - s.used) : 0;
        const dc = 10 + lvl + statMod;
        const lvlLabel = lvl === 0 ? '0 (Orison)' : (lvl >= 10 ? `Level ${lvl} (Epic)` : `Level ${lvl}`);

        if (isUnlocked) {
          const domCount = Number(s.domainDaily) || 0;
          const regCount = s.regularDaily !== undefined ? Number(s.regularDaily) : Math.max(0, s.daily - domCount);
          const slotSubLabel = domCount > 0
            ? `${regCount} Cleric + ${domCount}⚜️ Domain`
            : `${s.daily} Divine Slots`;
          matrixHtml += `
            <div class="flex items-center justify-between bg-slate-900/90 border border-amber-800/60 hover:border-amber-500 rounded-xl px-3 py-2 shadow-sm transition w-full">
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-extrabold text-white text-xs whitespace-nowrap">${lvlLabel}</span>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/90 text-emerald-400 border border-amber-700/60 font-bold whitespace-nowrap" title="Save DC = 10 + ${lvl} + ${statKey}(+${statMod >= 0 ? '+' + statMod : statMod})">DC ${dc}</span>
                </div>
                <span class="text-[10px] text-amber-300 font-mono mt-0.5">${slotSubLabel}</span>
              </div>
              <div class="h-7 w-px bg-slate-800 mx-1.5 shrink-0"></div>
              <div class="flex flex-col items-end shrink-0">
                <span class="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Slots Left</span>
                <span class="text-xs sm:text-sm font-black font-mono ${remaining > 0 ? 'text-emerald-400' : 'text-rose-500'} whitespace-nowrap">${remaining} / ${s.daily}</span>
              </div>
            </div>
          `;
        } else {
          const reqClText = lvl >= 10 ? 'Epic (CL 21+)' : `CL ${Math.max(1, lvl * 2 - 1)}+`;
          matrixHtml += `
            <div class="flex items-center justify-between bg-slate-950/50 border border-slate-800/70 rounded-xl px-3 py-2 opacity-50 select-none transition w-full" title="${lvlLabel} locked (Requires ${reqClText})">
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-bold text-slate-500 text-xs whitespace-nowrap">${lvlLabel}</span>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 font-bold whitespace-nowrap">DC ${dc}</span>
                </div>
                <span class="text-[10px] text-slate-600 font-mono mt-0.5">🔒 Locked (${reqClText})</span>
              </div>
              <div class="h-7 w-px bg-slate-800/60 mx-1.5 shrink-0"></div>
              <div class="flex flex-col items-end shrink-0">
                <span class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">Slots Left</span>
                <span class="text-xs sm:text-sm font-black font-mono text-slate-600 whitespace-nowrap">🔒 0 / 0</span>
              </div>
            </div>
          `;
        }
      }

      const unlockedLevels = slots.filter(s => s.daily > 0).map(s => Number(s.level));
      const allLevels = Array.from(new Set([...unlockedLevels, ...spells.map(s => Number(s.level || 0))])).sort((a, b) => a - b);
      const pillsHtml = ['all', ...allLevels].map(lvl => {
        const isActive = String(lvlFilter) === String(lvl);
        const label = lvl === 'all' ? 'All' : (lvl === 0 ? 'Level 0' : `Level ${lvl}`);
        return `
          <button type="button" onclick="setDivineFilterLevel('${lvl}')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
            isActive ? 'bg-amber-700 text-white border-amber-400 shadow' : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
          }">${label}</button>
        `;
      }).join('');

      const displayLevels = lvlFilter === 'all' ? allLevels : [Number(lvlFilter)];
      let rowsHtml = '';
      let totalRendered = 0;

      displayLevels.forEach(lvl => {
        const spellsAtLvl = [];
        spells.forEach((s, idx) => {
          if (Number(s.level || 0) === lvl) spellsAtLvl.push({ s, idx });
        });
        const dc = 10 + lvl + statMod;
        const slotObj = slots.find(sl => Number(sl.level) === lvl);
        const remainingSlots = slotObj ? Math.max(0, (slotObj.daily || 0) - (slotObj.used || 0)) : 0;
        const totalDaily = slotObj ? (slotObj.daily || 0) : 0;
        const hasActiveSlot = remainingSlots > 0;
        const theme = getSpellLevelTheme(lvl);

        // Seviye Renk Geçiş Başlığı (Level Section Divider)
        if (lvlFilter === 'all') {
          rowsHtml += `
            <tr class="bg-gradient-to-r ${theme.headerGradient} border-y ${theme.border} text-xs font-black select-none">
              <td colspan="8" class="py-2 px-3">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${theme.dot}"></span>
                    <span class="${theme.text} uppercase tracking-wider font-extrabold text-[11px]">${lvl === 0 ? 'Level 0 (Orisons)' : `Level ${lvl} Divine Spells`}</span>
                    <span class="text-[10px] text-slate-400 font-normal">DC ${dc}</span>
                  </div>
                  <div class="flex items-center gap-2 text-[10px]">
                    <span class="${hasActiveSlot ? theme.slotBadgeActive : 'bg-slate-900 text-rose-400 border border-rose-900/60'} px-2 py-0.5 rounded font-mono font-bold">
                      ${totalDaily > 0 ? (hasActiveSlot ? `⚡ ${remainingSlots}/${totalDaily} Slots Ready` : `0/${totalDaily} Slots (Expended)`) : '🔒 No Slots (0/0)'}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          `;
        }

        if (searchVal || schoolVal !== 'all') {
          spellsAtLvl.filter(({ s }) => {
            if (schoolVal !== 'all' && (s.school || '').toLowerCase() !== schoolVal.toLowerCase()) return false;
            if (searchVal) {
              const str = `${s.name || ''} ${s.benefit || ''} ${s.school || ''} ${s.domainSource || ''}`.toLowerCase();
              if (!str.includes(searchVal)) return false;
            }
            return true;
          }).forEach(({ s, idx }) => {
            totalRendered++;
            rowsHtml += buildDivineRowHtml(s, idx, lvl, dc);
          });
        } else {
          const slotObj = slots.find(sl => Number(sl.level) === lvl);
          const domQuota = slotObj ? (Number(slotObj.domainDaily) || 0) : 0;
          const regQuota = slotObj
            ? (slotObj.regularDaily !== undefined ? Number(slotObj.regularDaily) : Math.max(0, (slotObj.daily || 0) - domQuota))
            : spellsAtLvl.filter(x => !x.s.isDomainSpell).length;

          const regSpells = spellsAtLvl.filter(x => !x.s.isDomainSpell);
          const domSpells = spellsAtLvl.filter(x => x.s.isDomainSpell === true);

          const totalRegRows = Math.max(regQuota, regSpells.length);
          for (let i = 0; i < totalRegRows; i++) {
            totalRendered++;
            if (i < regSpells.length) {
              rowsHtml += buildDivineRowHtml(regSpells[i].s, regSpells[i].idx, lvl, dc);
            } else {
              rowsHtml += buildDivineEmptyRowHtml(lvl, dc);
            }
          }

          const totalDomRows = Math.max(domQuota, domSpells.length);
          for (let j = 0; j < totalDomRows; j++) {
            totalRendered++;
            if (j < domSpells.length) {
              rowsHtml += buildDivineRowHtml(domSpells[j].s, domSpells[j].idx, lvl, dc);
            } else {
              rowsHtml += buildDivineEmptyDomainRowHtml(lvl, dc);
            }
          }
        }
      });

      function buildDivineRowHtml(s, originalIdx, lvl, dc) {
        const slotObj = slots.find(sl => Number(sl.level) === lvl);
        const isDom = Boolean(s.isDomainSpell);
        const domDaily = slotObj ? (Number(slotObj.domainDaily) || 0) : 0;
        const domUsed = slotObj ? (Number(slotObj.domainUsed) || 0) : 0;
        const regDaily = slotObj ? (slotObj.regularDaily !== undefined ? Number(slotObj.regularDaily) : Math.max(0, (slotObj.daily || 0) - domDaily)) : 0;
        const regUsed = slotObj ? Math.max(0, (slotObj.used || 0) - domUsed) : 0;

        const remainingSlots = isDom
          ? Math.max(0, domDaily - domUsed)
          : Math.max(0, regDaily - regUsed);
        const hasActiveSlot = remainingSlots > 0 && ((slotObj ? (slotObj.daily - slotObj.used) : 0) > 0);
        const theme = getSpellLevelTheme(lvl);
        const dmgExpr = s.damageDice || findDiceExpression(s.benefit);
        const spontInfo = getClericSpontaneousSpellInfo(lvl, cl, spontMode);
        const isAlreadyCureOrInflict = /^(cure|inflict|mass cure|mass inflict)\b/i.test((s.name || '').trim());
        // D&D 3.5e RAW (PHB p.32): Domain spells cannot be spontaneously converted to Cure/Inflict Wounds
        const showSpontBtn = Boolean(spontInfo && !isAlreadyCureOrInflict && !isDom);
        const spontBtnHtml = showSpontBtn ? `
          <button onclick="castClericSpontaneousConversion(${originalIdx})" class="${
            hasActiveSlot
              ? (spontMode === 'cure'
                ? 'bg-emerald-950/90 hover:bg-emerald-800 text-emerald-300 hover:text-white border-emerald-600/80 cursor-pointer shadow'
                : 'bg-rose-950/90 hover:bg-rose-800 text-rose-300 hover:text-white border-rose-600/80 cursor-pointer shadow')
              : 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
          } text-[11px] font-bold font-mono px-2 py-1 rounded-lg border transition inline-flex items-center justify-center gap-1 whitespace-nowrap" title="${
            hasActiveSlot ? `Cleric Spontaneous Conversion: Convert '${s.name}' slot into '${spontInfo.name}' (${spontInfo.formula})` : '⚠️ No active spell slots remaining (0 Left)'
          }">
            ${getFormulaDiceIconSvg(spontInfo.formula, spontMode === 'cure' ? 'w-3.5 h-3.5 text-emerald-300 shrink-0' : 'w-3.5 h-3.5 text-rose-300 shrink-0')}
            <span>${spontInfo.shortLabel}</span>
          </button>
        ` : '';

        const domainBadgeHtml = isDom
          ? `<span class="badge bg-yellow-950/90 text-yellow-300 border border-yellow-500/80 text-[10px] font-bold px-1.5 py-0.5 shrink-0" title="Prepared in Dedicated Cleric Domain Slot (Cannot be converted to Cure/Inflict)">⚜️ ${s.domainSource ? s.domainSource + ' Domain' : 'Domain Slot'}</span>`
          : '';

        return `
          <tr class="transition border-l-4 ${isDom ? 'border-l-yellow-400 bg-yellow-950/10' : theme.borderLeft} ${
            hasActiveSlot ? `hover:bg-slate-900/70 ${isDom ? 'bg-yellow-950/15' : theme.rowBg}` : 'opacity-40 grayscale-[35%] bg-slate-950/60'
          }">
            <td class="py-2.5 px-3 text-center align-middle">
              <span class="badge ${isDom ? 'bg-yellow-950 text-yellow-300 border-yellow-500/80' : theme.badge} text-[10px] font-bold font-mono px-2 py-0.5">${isDom ? `${lvl}⚜️` : lvl}</span>
            </td>
            <td class="py-2.5 px-3 font-bold text-white align-middle">
              <div class="flex items-center gap-2 whitespace-nowrap flex-wrap">
                ${getUniversalPinButtonHtml({ name: s.name, type: 'Spell', action: s.action || 'Standard Action', desc: s.benefit || '', badge: dmgExpr || '', damageDice: dmgExpr || '' })}
                <span>${isDom ? '⚜️' : '✨'}</span>
                <span class="${hasActiveSlot ? 'text-white' : 'text-slate-400'}">${s.name}</span>
                ${domainBadgeHtml}
                ${!hasActiveSlot ? `<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950/90 text-rose-300 border border-rose-800/80 font-bold shrink-0">0 Slot</span>` : ''}
              </div>
            </td>
            <td class="py-2.5 px-3 text-slate-300">
              <span class="badge bg-amber-950/60 text-amber-300 border border-amber-800/80 text-[10px] font-semibold">${s.school || 'Conjuration'}</span>
            </td>
            <td class="py-2.5 px-3 text-center text-amber-300 text-[11px] whitespace-nowrap font-medium" title="${s.action || 'Standard Action'}">${formatActionShort(s.action)}</td>
            <td class="py-2.5 px-3 text-slate-300 text-[11px]">${s.range || '-'}</td>
            <td class="py-2.5 px-3 text-center">
              <span class="badge bg-slate-900 text-emerald-300 border border-emerald-700/60 font-mono text-[11px] font-bold">DC ${dc}</span>
            </td>
            <td class="py-2.5 px-3 text-slate-300 text-[11px]">${s.benefit || '-'}</td>
            <td class="py-2.5 px-3 text-right align-middle">
              <div class="flex items-center justify-end gap-1.5 w-full">
                ${spontBtnHtml}
                ${dmgExpr ? `
                  <button onclick="castDivineSpellDirectly(${originalIdx})" class="${
                    hasActiveSlot 
                      ? 'bg-amber-950/90 hover:bg-amber-800 text-amber-300 hover:text-white border-amber-600/80 cursor-pointer shadow' 
                      : 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                  } text-xs font-bold font-mono px-2.5 py-1 rounded-lg border transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap" title="${
                    hasActiveSlot ? `Cast Spell & Roll Dice (${dmgExpr})` : '⚠️ No active spell slots remaining (0 Left)'
                  }">
                    ${getFormulaDiceIconSvg(dmgExpr, 'w-3.5 h-3.5 text-amber-400 shrink-0')}
                    <span>${dmgExpr}</span>
                  </button>
                ` : `
                  <button onclick="castDivineSpellDirectly(${originalIdx})" class="${
                    hasActiveSlot 
                      ? 'bg-amber-900/70 hover:bg-amber-600 text-white border-amber-500 cursor-pointer shadow' 
                      : 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                  } text-xs font-bold px-2.5 py-1 rounded-lg border transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap" title="${
                    hasActiveSlot ? 'Cast Spell (Spend Slot)' : '⚠️ No active spell slots remaining (0 Left)'
                  }">
                    <span>✨</span>
                    <span>Cast</span>
                  </button>
                `}
                <button onclick="deleteDivineSpell(${originalIdx})" class="w-6 h-6 inline-flex items-center justify-center text-slate-500 hover:text-rose-400 text-xs transition cursor-pointer shrink-0" title="Unprepare / Remove Spell (Leaves Empty Slot)">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      }

      function buildDivineEmptyRowHtml(lvl, dc) {
        const slotObj = slots.find(sl => Number(sl.level) === lvl);
        const domDaily = slotObj ? (Number(slotObj.domainDaily) || 0) : 0;
        const domUsed = slotObj ? (Number(slotObj.domainUsed) || 0) : 0;
        const regDaily = slotObj ? (slotObj.regularDaily !== undefined ? Number(slotObj.regularDaily) : Math.max(0, (slotObj.daily || 0) - domDaily)) : 0;
        const regUsed = slotObj ? Math.max(0, (slotObj.used || 0) - domUsed) : 0;
        const remainingSlots = Math.max(0, regDaily - regUsed);
        const hasActiveSlot = remainingSlots > 0;
        const theme = getSpellLevelTheme(lvl);

        return `
          <tr class="transition cursor-pointer group border-l-4 ${theme.borderLeft} ${
            hasActiveSlot ? 'hover:bg-amber-950/25 bg-slate-950/20' : 'opacity-40 grayscale-[35%] bg-slate-950/60'
          }" onclick="if(!event.target.closest('button')) openDivineSpellPickerForLevel(${lvl}, false)">
            <td class="py-2.5 px-3 text-center align-middle">
              <span class="badge ${theme.badge} opacity-60 text-[10px] font-bold font-mono px-2 py-0.5">${lvl}</span>
            </td>
            <td class="py-2.5 px-3">
              <button type="button" onclick="openDivineSpellPickerForLevel(${lvl}, false)" class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300/80 group-hover:text-amber-100 cursor-pointer">
                <span class="w-4 h-4 rounded border border-dashed border-amber-500/70 bg-amber-950/60 flex items-center justify-center text-[10px] text-amber-300 group-hover:bg-amber-800 transition">+</span>
                <span class="italic">+ Prepare Divine Spell (Empty Slot)</span>
              </button>
            </td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
            <td class="py-2.5 px-3 text-center">
              <span class="badge bg-slate-900/60 text-slate-500 border border-slate-800/80 font-mono text-[10px]">DC ${dc}</span>
            </td>
            <td class="py-2.5 px-3 text-slate-500 text-[11px] italic">Regular Cleric/Divine spell slot. Click to prepare a ${lvl === 0 ? 'Level 0 (Orison)' : `Level ${lvl}`} class spell.</td>
            <td class="py-2.5 px-3 text-right align-middle">
              <div class="flex items-center justify-end gap-2 w-full">
                <button type="button" onclick="openDivineSpellPickerForLevel(${lvl}, false)" class="bg-amber-950/80 hover:bg-amber-900 text-amber-300 hover:text-white border border-dashed border-amber-500/80 text-xs font-bold px-2.5 py-1 rounded-lg transition shadow-sm inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap" title="Prepare Level ${lvl} Divine Spell">
                  <span>✨</span>
                  <span>+ Select Spell</span>
                </button>
                <span class="w-6 h-6 shrink-0 inline-block"></span>
              </div>
            </td>
          </tr>
        `;
      }

      function buildDivineEmptyDomainRowHtml(lvl, dc) {
        const slotObj = slots.find(sl => Number(sl.level) === lvl);
        const domDaily = slotObj ? (Number(slotObj.domainDaily) || 0) : 0;
        const domUsed = slotObj ? (Number(slotObj.domainUsed) || 0) : 0;
        const hasActiveSlot = Math.max(0, domDaily - domUsed) > 0;
        const hasChosenDomains = chosenDomains.length > 0;
        const domLabel = hasChosenDomains ? chosenDomains.join(' / ') : 'Select Domains in Progression';
        const rowClickAction = hasChosenDomains
          ? `openDivineSpellPickerForLevel(${lvl}, true)`
          : `if(typeof openClericDomainPickerModal==='function') openClericDomainPickerModal(0, 0); else openDivineSpellPickerForLevel(${lvl}, true)`;

        return `
          <tr class="transition cursor-pointer group border-l-4 border-l-yellow-400 ${
            hasActiveSlot ? 'hover:bg-yellow-950/30 bg-yellow-950/10' : 'opacity-40 grayscale-[35%] bg-slate-950/60'
          }" onclick="if(!event.target.closest('button')) { ${rowClickAction}; }">
            <td class="py-2.5 px-3 text-center align-middle">
              <span class="badge bg-yellow-950/90 text-yellow-300 border border-yellow-500/80 text-[10px] font-bold font-mono px-1.5 py-0.5">${lvl}⚜️</span>
            </td>
            <td class="py-2.5 px-3">
              <button type="button" onclick="${rowClickAction}" class="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-300 group-hover:text-yellow-100 cursor-pointer">
                <span class="w-4 h-4 rounded border border-dashed border-yellow-400/80 bg-yellow-950/80 flex items-center justify-center text-[10px] text-yellow-300 group-hover:bg-yellow-800 transition">⚜️</span>
                <span class="italic">+ Prepare Domain Spell (${domLabel})</span>
              </button>
            </td>
            <td class="py-2.5 px-3">
              <span class="badge bg-yellow-950/70 text-yellow-300 border border-yellow-600/60 text-[10px] font-bold">⚜️ Domain Slot</span>
            </td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
            <td class="py-2.5 px-3 text-center">
              <span class="badge bg-slate-900/60 text-yellow-300/80 border border-yellow-800/60 font-mono text-[10px]">DC ${dc}</span>
            </td>
            <td class="py-2.5 px-3 text-yellow-200/80 text-[11px] italic">
              ${hasChosenDomains
                ? `Dedicated Level ${lvl} Domain Slot. Choose from your <strong>${chosenDomains.join('</strong> or <strong>')}</strong> domain spells.`
                : `Dedicated Level ${lvl} Domain Slot. Click to select your <strong>2 Cleric Domains</strong> first (Level 1 Class Feature).`}
            </td>
            <td class="py-2.5 px-3 text-right align-middle">
              <div class="flex items-center justify-end gap-2 w-full">
                <button type="button" onclick="${rowClickAction}" class="bg-yellow-950/90 hover:bg-yellow-800 text-yellow-200 hover:text-white border border-dashed border-yellow-400/90 text-xs font-bold px-2.5 py-1 rounded-lg transition shadow-sm inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap" title="${hasChosenDomains ? `Prepare Level ${lvl} Domain Spell (${domLabel})` : 'Select Cleric Domains'}">
                  <span>⚜️</span>
                  <span>${hasChosenDomains ? '+ Domain Spell' : '+ Select Domains'}</span>
                </button>
                <span class="w-6 h-6 shrink-0 inline-block"></span>
              </div>
            </td>
          </tr>
        `;
      }

      container.innerHTML = `
        <div class="space-y-4">
          <!-- Caster Header Bar -->
          <div class="bg-gradient-to-r from-amber-950/70 via-slate-900 to-yellow-950/40 border border-amber-600/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-lg bg-amber-900/70 border border-amber-500/60 flex items-center justify-center text-lg shadow-inner">
                ✨
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-extrabold text-white text-sm md:text-base">Divine Spells &amp; Prayers</h3>
                  <span class="badge bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold">Cleric / Druid</span>
                  <span class="badge bg-amber-950/90 text-amber-200 border border-amber-400/80 text-xs font-extrabold px-2.5 py-0.5 font-mono shadow-sm" title="Caster Level: ${cl} (${clMode})">CL: ${cl}</span>
                  ${hasDomainCap ? `
                    <button type="button" onclick="if(typeof openClericDomainPickerModal==='function') openClericDomainPickerModal(0, 0)" class="badge ${chosenDomains.length === 2 ? 'bg-yellow-950/90 text-yellow-200 border-yellow-500/80 hover:bg-yellow-900' : 'bg-yellow-950/90 text-yellow-300 border-dashed border-yellow-400 animate-pulse hover:bg-yellow-900'} text-[10px] font-bold px-2 py-0.5 cursor-pointer transition inline-flex items-center gap-1" title="Click to view or change your Cleric Domains (1st-Level Class Feature)">
                      <span>⚜️</span>
                      <span>${chosenDomains.length > 0 ? `Domains: ${chosenDomains.join(' & ')} (${chosenDomains.length}/2)` : '+ Select Cleric Domains (0/2)'}</span>
                    </button>
                  ` : ''}
                  ${!hasDivine ? `<span class="badge bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">Preview / Inactive Class</span>` : ''}
                </div>
                <p class="text-[11px] text-amber-300">Stat Mod: ${statMod >= 0 ? '+' + statMod : statMod} (${statKey}: ${statVal}) • Full Divine Compendium &amp; Domain Bonus Included • ${clMode}</p>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" onclick="toggleClericSpontaneousMode()" class="${
                spontMode === 'cure'
                  ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-500/80'
                  : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-500/80'
              } border text-xs font-bold px-2.5 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer" title="${energyPolicy.reason}">
                <span>${spontMode === 'cure' ? '💚' : '💀'}</span>
                <span>Spontaneous: ${spontMode === 'cure' ? 'Cure Wounds' : 'Inflict Wounds'}${energyPolicy.locked ? ' 🔒' : ''}</span>
              </button>
              <span class="badge bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-bold">🛡️ ASF: 0%</span>
              <button onclick="restoreAllDivineSlots()" class="bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/50 shadow transition flex items-center gap-1 cursor-pointer">
                <span>✨</span>
                <span>Restore All Slots</span>
              </button>
            </div>
          </div>

          <!-- 4x3 Fixed Slot Matrix -->
          <div class="bg-slate-950/80 border border-amber-900/50 rounded-xl p-2.5 space-y-2 shadow">
            <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] px-1">
              <span class="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span>
                <span>Daily Divine Spell Slots (4×3 Matrix):</span>
              </span>
              <div class="flex items-center gap-2">
                <span class="text-slate-400 text-[10px] hidden sm:inline">Casting expends a divine slot • DM bonus slots supported</span>
                <button type="button" onclick="openSpellSlotsModal(undefined, 'divine')" class="text-[9px] text-amber-400 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-amber-900/50 transition" title="Slot Management &amp; DM Bonuses">
                  <span>⚙️</span>
                  <span>Slot &amp; DM Bonus Manager</span>
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              ${matrixHtml}
            </div>
          </div>

          <!-- Search & Filters + Divine Spells Table -->
          <div class="space-y-3">
            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                <div class="relative flex-1 min-w-[180px]">
                  <input type="text" id="divine-spell-filter-search" value="${searchVal}" oninput="renderDivineDisciplineView(${Boolean(hasDivine)})" placeholder="Search divine spell name, school, or effect..." class="w-full bg-slate-950 text-white placeholder-slate-500 text-xs rounded-lg border border-slate-700 px-3 py-1.5 pl-8 focus:outline-none focus:border-amber-500">
                  <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                </div>
                <select id="divine-spell-filter-school" onchange="renderDivineDisciplineView(${Boolean(hasDivine)})" class="bg-slate-950 text-slate-300 text-xs rounded-lg border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-amber-500">
                  <option value="all" ${schoolVal === 'all' ? 'selected' : ''}>All Schools</option>
                  <option value="Abjuration" ${schoolVal === 'Abjuration' ? 'selected' : ''}>Abjuration</option>
                  <option value="Conjuration" ${schoolVal === 'Conjuration' ? 'selected' : ''}>Conjuration (Healing / Summoning)</option>
                  <option value="Divination" ${schoolVal === 'Divination' ? 'selected' : ''}>Divination</option>
                  <option value="Enchantment" ${schoolVal === 'Enchantment' ? 'selected' : ''}>Enchantment</option>
                  <option value="Evocation" ${schoolVal === 'Evocation' ? 'selected' : ''}>Evocation (Divine Wrath)</option>
                  <option value="Necromancy" ${schoolVal === 'Necromancy' ? 'selected' : ''}>Necromancy (Life / Death)</option>
                  <option value="Transmutation" ${schoolVal === 'Transmutation' ? 'selected' : ''}>Transmutation</option>
                </select>
              </div>
              <div class="flex flex-wrap items-center gap-1">
                ${pillsHtml}
              </div>
            </div>

            <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 shadow">
              <div class="bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-amber-300 flex justify-between items-center border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <span>✨</span>
                  <span class="uppercase tracking-wider">POOL: DAILY PREPARED DIVINE SPELLS</span>
                </div>
                <span class="text-[11px] text-slate-400 font-normal">✨ Cast directly or convert into ${spontMode === 'cure' ? '💚 Cure Wounds' : '💀 Inflict Wounds'}</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th class="py-2.5 px-3 w-12 text-center">Lvl</th>
                      <th class="py-2.5 px-3 min-w-[200px]">Spell Name</th>
                      <th class="py-2.5 px-3 w-28">School</th>
                      <th class="py-2.5 px-3 w-16 text-center">Action</th>
                      <th class="py-2.5 px-3 w-28">Range</th>
                      <th class="py-2.5 px-3 w-20 text-center">DC</th>
                      <th class="py-2.5 px-3">Effect & Description</th>
                      <th class="py-2.5 px-3 text-right pr-4 w-56">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 font-medium">
                    ${totalRendered > 0 ? rowsHtml : `<tr><td colspan="8" class="py-8 text-center text-slate-400"><p class="text-xs">No divine spells match the current filters.</p></td></tr>`}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function setDivineFilterLevel(lvl) {
      window._divineSpellCurrentFilterLevel = lvl;
      const classesStatus = checkCharacterMagicClasses();
      renderDivineDisciplineView(classesStatus.hasDivine);
    }

    function openDivineSpellPickerForLevel(lvl, isDomainSlot = false) {
      window._spellPickerTargetPool = 'divine';
      window._spellPickerIsDomainSlot = Boolean(isDomainSlot);
      openSpellManeuverPickerModal('Spell', lvl);
    }

    function deleteDivineSpell(idx) {
      if (!character?.spellcasting?.divineSpells?.[idx]) return;
      const s = character.spellcasting.divineSpells[idx];
      character.spellcasting.divineSpells.splice(idx, 1);
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '🗑️',
        title: 'Divine Spell Unprepared',
        breakdown: `"${s.name}" removed. ${s.isDomainSpell ? 'Domain' : 'Divine'} slot is now empty.`,
        total: 'Slot Empty'
      });
    }

    function castDivineSpellDirectly(spellIdx) {
      const s = character?.spellcasting?.divineSpells?.[spellIdx];
      if (!s) return;
      const name = s.name;
      const lvl = Number(s.level) || 0;
      const isDom = Boolean(s.isDomainSpell);
      const { cl } = getDivineCasterInfo();
      const dmgExpr = resolveSpellEffectiveFormula(s, cl);
      const slot = character.spellcasting?.divineSlots?.find(sl => Number(sl.level) === lvl);
      const domDaily = slot ? (Number(slot.domainDaily) || 0) : 0;
      const domUsed = slot ? (Number(slot.domainUsed) || 0) : 0;
      const regDaily = slot ? (slot.regularDaily !== undefined ? Number(slot.regularDaily) : Math.max(0, (slot.daily || 0) - domDaily)) : 0;
      const regUsed = slot ? Math.max(0, (slot.used || 0) - domUsed) : 0;

      const canCast = slot && slot.used < slot.daily && (isDom ? domUsed < domDaily : regUsed < regDaily);
      if (!canCast) {
        showDiceTopToast({
          icon: '\u26A0\uFE0F',
          title: 'No Slots Remaining',
          breakdown: `No Level ${lvl} ${isDom ? 'Domain' : 'regular Divine'} spell slots remaining!`,
          total: '0 Slots'
        });
        return;
      }

      const preCast = getSpellPreCastOptions(s, cl, slot, lvl);
      if (preCast && Array.isArray(preCast.options) && preCast.options.length > 0) {
        showSpellPreCastChoiceToast(preCast);
        return;
      }

      slot.used++;
      if (isDom) {
        slot.domainUsed = Math.min(domDaily, domUsed + 1);
      }
      saveStateToStorage(true);
      renderAll();
      if (handleBuffSpellCast(s, cl, `Level ${lvl} ${isDom ? 'Domain' : 'Divine'} Slot Expended`, isDom ? '⚜️' : '✨')) {
        return;
      }
      if (dmgExpr) {
        rollSpellOrManeuverFormula(dmgExpr, `${name} (Level ${lvl}${isDom ? ' Domain' : ''} • -1 Slot)`, s);
      } else {
        showDiceTopToast({
          icon: isDom ? '⚜️' : '✨',
          title: name,
          breakdown: `Level ${lvl} ${isDom ? 'Domain' : 'Divine'} Spell Slot Expended`,
          total: '-1 Slot',
        });
      }
    }

    function restoreAllDivineSlots() {
      (character?.spellcasting?.divineSlots || []).forEach(s => {
        s.used = 0;
        s.domainUsed = 0;
      });
      saveStateToStorage();
      renderAll();
      showDiceTopToast({
        icon: '✨',
        title: 'Divine Spell Slots',
        breakdown: 'All daily divine & domain spell slots refreshed',
        total: 'Restored'
      });
    }

    function getCasterInfo() {
      const classesStatus = checkCharacterMagicClasses();
      const primaryClass = character?.spellcasting?.primaryClass || (classesStatus.hasSpontaneous ? 'Sorcerer' : (character?.isNpc ? 'Sorcerer' : ''));
      let statKey = 'CHA';
      if (['Wizard', 'Artificer'].includes(primaryClass)) statKey = 'INT';
      else if (['Cleric', 'Druid', 'Favored Soul'].includes(primaryClass)) statKey = 'WIS';
      else if (character?.spellcasting?.statName) statKey = character.spellcasting.statName;
      else if (character?.spellcasting?.ability) statKey = character.spellcasting.ability.toUpperCase();

      const statVal = character?.stats?.[statKey]?.value ?? character?.abilities?.[statKey.toLowerCase()] ?? 10;
      const statMod = character?.stats?.[statKey]?.mod ?? Math.floor((statVal - 10) / 2);
      const clMode = character?.settings?.clMode || 'Class Level';
      const cType = character?.settings?.casterType || 'spontaneous';
      const effBoonType = resolvePreferredMagicDiscipline(character);
      const isWarlockBoon = clMode.includes('Warlock Boon') || character?.settings?.warlockBoon === true;
      const isSpontBoon = isWarlockBoon || (clMode === 'Character Level (DM Boon)' && ((character?.settings?.casterTypeExplicit === true && (cType === 'spontaneous' || cType === 'warlock')) || effBoonType === 'spontaneous'));
      const prog = character?.levelProgression || [];
      const activeLevels = prog.filter(p => p.active !== false).length || Number(character?.level) || 0;
      const sorcLvls = getMagicDisciplineClassLevels(character).spontaneous;
      
      let cl = 0;
      if (character?.isNpc && (character?.spellcasting?.cl !== undefined || character?.spellcasting?.caster_level !== undefined)) {
        cl = Number(character.spellcasting.cl ?? character.spellcasting.caster_level) || 0;
      } else if (isSpontBoon) {
        const rawCl = character?.spellcasting?.caster_level ?? character?.spellcasting?.cl ?? sorcLvls;
        cl = Math.max(Number(rawCl) || 1, sorcLvls, activeLevels, 1);
      } else if (sorcLvls > 0) {
        cl = sorcLvls;
      } else if (classesStatus.hasSpontaneous) {
        cl = 1;
      }

      const hasClass = classesStatus.hasSpontaneous || (character?.isNpc && Boolean(character?.spellcasting?.cl || character?.spellcasting?.slots?.length || character?.spellcasting?.knownSpells?.length || character?.spells?.length));

      return { primaryClass, statKey, statVal, statMod, cl, clMode, hasClass, sorcLvls, isSpontBoon };
    }

    function getSpellDc(spellLevel) {
      const { statMod } = getCasterInfo();
      return 10 + (Number(spellLevel) || 0) + statMod;
    }

    function getSpellLevelTheme(spellLevel) {
      const lvl = Number(spellLevel) || 0;
      switch (lvl) {
        case 0:
          return {
            text: 'text-teal-300',
            badge: 'bg-teal-950/90 text-teal-300 border-teal-700/80',
            borderLeft: 'border-l-teal-500',
            headerGradient: 'from-teal-950/80 via-slate-900/90 to-transparent',
            border: 'border-teal-500/40',
            dot: 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]',
            slotBadgeActive: 'bg-teal-950 text-teal-300 border border-teal-700/60',
            rowBg: 'bg-teal-950/10'
          };
        case 1:
          return {
            text: 'text-sky-300',
            badge: 'bg-sky-950/90 text-sky-300 border-sky-700/80',
            borderLeft: 'border-l-sky-500',
            headerGradient: 'from-sky-950/80 via-slate-900/90 to-transparent',
            border: 'border-sky-500/40',
            dot: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]',
            slotBadgeActive: 'bg-sky-950 text-sky-300 border border-sky-700/60',
            rowBg: 'bg-sky-950/10'
          };
        case 2:
          return {
            text: 'text-indigo-300',
            badge: 'bg-indigo-950/90 text-indigo-300 border-indigo-700/80',
            borderLeft: 'border-l-indigo-500',
            headerGradient: 'from-indigo-950/80 via-slate-900/90 to-transparent',
            border: 'border-indigo-500/40',
            dot: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]',
            slotBadgeActive: 'bg-indigo-950 text-indigo-300 border border-indigo-700/60',
            rowBg: 'bg-indigo-950/10'
          };
        case 3:
          return {
            text: 'text-purple-300',
            badge: 'bg-purple-950/90 text-purple-300 border-purple-700/80',
            borderLeft: 'border-l-purple-500',
            headerGradient: 'from-purple-950/80 via-slate-900/90 to-transparent',
            border: 'border-purple-500/40',
            dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]',
            slotBadgeActive: 'bg-purple-950 text-purple-300 border border-purple-700/60',
            rowBg: 'bg-purple-950/10'
          };
        case 4:
          return {
            text: 'text-fuchsia-300',
            badge: 'bg-fuchsia-950/90 text-fuchsia-300 border-fuchsia-700/80',
            borderLeft: 'border-l-fuchsia-500',
            headerGradient: 'from-fuchsia-950/80 via-slate-900/90 to-transparent',
            border: 'border-fuchsia-500/40',
            dot: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.6)]',
            slotBadgeActive: 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700/60',
            rowBg: 'bg-fuchsia-950/10'
          };
        case 5:
          return {
            text: 'text-rose-300',
            badge: 'bg-rose-950/90 text-rose-300 border-rose-700/80',
            borderLeft: 'border-l-rose-500',
            headerGradient: 'from-rose-950/80 via-slate-900/90 to-transparent',
            border: 'border-rose-500/40',
            dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]',
            slotBadgeActive: 'bg-rose-950 text-rose-300 border border-rose-700/60',
            rowBg: 'bg-rose-950/10'
          };
        case 6:
          return {
            text: 'text-amber-300',
            badge: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
            borderLeft: 'border-l-amber-500',
            headerGradient: 'from-amber-950/80 via-slate-900/90 to-transparent',
            border: 'border-amber-500/40',
            dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
            slotBadgeActive: 'bg-amber-950 text-amber-300 border border-amber-700/60',
            rowBg: 'bg-amber-950/10'
          };
        case 7:
          return {
            text: 'text-emerald-300',
            badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
            borderLeft: 'border-l-emerald-500',
            headerGradient: 'from-emerald-950/80 via-slate-900/90 to-transparent',
            border: 'border-emerald-500/40',
            dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
            slotBadgeActive: 'bg-emerald-950 text-emerald-300 border border-emerald-700/60',
            rowBg: 'bg-emerald-950/10'
          };
        case 8:
          return {
            text: 'text-cyan-300',
            badge: 'bg-cyan-950/90 text-cyan-300 border-cyan-700/80',
            borderLeft: 'border-l-cyan-500',
            headerGradient: 'from-cyan-950/80 via-slate-900/90 to-transparent',
            border: 'border-cyan-500/40',
            dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]',
            slotBadgeActive: 'bg-cyan-950 text-cyan-300 border border-cyan-700/60',
            rowBg: 'bg-cyan-950/10'
          };
        default:
          return {
            text: 'text-yellow-300',
            badge: 'bg-yellow-950/95 text-yellow-300 border-yellow-500/80 font-black',
            borderLeft: 'border-l-yellow-400',
            headerGradient: 'from-yellow-950/90 via-purple-950/60 to-transparent',
            border: 'border-yellow-500/40',
            dot: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]',
            slotBadgeActive: 'bg-yellow-950 text-yellow-300 border border-yellow-600/70',
            rowBg: 'bg-yellow-950/15'
          };
      }
    }

    function getInitiatorInfo() {
      const classesStatus = checkCharacterMagicClasses();
      const prog = character?.levelProgression || [];
      const activeRows = prog.filter(p => p.active !== false);
      let martialLvls = 0;
      let otherLvls = 0;
      let adeptClass = null;

      activeRows.forEach(p => {
        const c = (p.className || p.class || '').toLowerCase();
        if (['warblade', 'swordsage', 'crusader', 'bloodstorm blade', 'deepstone sentinel', 'eternal blade', 'jade phoenix mage', 'master of nine', 'ruby knight vindicator', 'shadow sun ninja'].some(k => c.includes(k))) {
          martialLvls++;
          if (c.includes('swordsage')) adeptClass = 'Swordsage';
          else if (c.includes('crusader') || c.includes('ruby knight')) adeptClass = 'Crusader';
          else if (c.includes('warblade')) adeptClass = 'Warblade';
          else if (!adeptClass) adeptClass = p.className || 'Martial Adept';
        } else {
          otherLvls++;
        }
      });

      if (!adeptClass && typeof character?.classes === 'string') {
        const cStr = character.classes.toLowerCase();
        if (cStr.includes('swordsage')) adeptClass = 'Swordsage';
        else if (cStr.includes('crusader')) adeptClass = 'Crusader';
        else if (cStr.includes('warblade')) adeptClass = 'Warblade';
      }

      const { martialStudyCount, martialStanceCount } = countCharacterMartialFeats(character);
      const dmReadiedBonus = Number(character?.tomeOfBattle?.dmReadiedBonus) || 0;
      const dmKnownBonus = Number(character?.tomeOfBattle?.dmKnownBonus) || 0;
      const dmStanceBonus = Number(character?.tomeOfBattle?.dmStanceBonus) || 0;
      const hasMartialFeatOrBoon = martialStudyCount > 0 || martialStanceCount > 0 || dmReadiedBonus > 0 || dmKnownBonus > 0 || dmStanceBonus > 0;

      if (!adeptClass && !classesStatus.hasMartial && !hasMartialFeatOrBoon) {
        // Clean up any orphaned maneuvers/stances on non-martial characters
        if (!character?.isNpc && character?.tomeOfBattle) {
          if (Array.isArray(character.tomeOfBattle.maneuversKnown) && character.tomeOfBattle.maneuversKnown.length > 0) {
            character.tomeOfBattle.maneuversKnown = [];
          }
          if (Array.isArray(character.tomeOfBattle.readiedManeuvers) && character.tomeOfBattle.readiedManeuvers.length > 0) {
            character.tomeOfBattle.readiedManeuvers = [];
          }
          if (Array.isArray(character.tomeOfBattle.stancesKnown) && character.tomeOfBattle.stancesKnown.length > 0) {
            character.tomeOfBattle.stancesKnown = [];
          }
          if (character.activeStance) {
            character.activeStance = '';
          }
        }
        return {
          adeptClass: 'No Martial Adept Class',
          martialLvls: 0,
          otherLvls: activeRows.length,
          il: 0,
          maxManeuverLvl: 0,
          maxReadied: 0,
          maxKnownManeuvers: 0,
          maxKnownStances: 0,
          hasClass: false
        };
      }

      if (!adeptClass) {
        adeptClass = (martialStudyCount > 0 || martialStanceCount > 0) ? 'Martial Study / Stance' : 'Martial Adept';
      }

      const computedIl = martialLvls > 0
        ? (martialLvls + Math.floor(otherLvls / 2))
        : Math.max(1, Math.floor((activeRows.length || Number(character?.level) || 1) / 2));
      const storedIl = Number(character?.tomeOfBattle?.initiatorLevel) || 0;
      const il = Math.max(storedIl, computedIl, 1);
      if (character?.tomeOfBattle) {
        character.tomeOfBattle.initiatorLevel = il;
      }

      const maxManeuverLvl = Math.min(9, Math.max(1, Math.ceil(il / 2)));
      const readiedList = character?.tomeOfBattle?.readiedManeuvers || [];

      let baseReadied = 0;
      let baseKnownManeuvers = 0;
      let baseKnownStances = 0;

      if (martialLvls > 0) {
        if (adeptClass === 'Swordsage') {
          baseKnownManeuvers = 5 + martialLvls;
          baseReadied = martialLvls >= 20 ? 10 : (martialLvls >= 18 ? 9 : (martialLvls >= 15 ? 8 : (martialLvls >= 12 ? 7 : (martialLvls >= 8 ? 6 : (martialLvls >= 4 ? 5 : 4)))));
          baseKnownStances = martialLvls >= 20 ? 6 : (martialLvls >= 14 ? 5 : (martialLvls >= 9 ? 4 : (martialLvls >= 5 ? 3 : (martialLvls >= 2 ? 2 : 1))));
        } else if (adeptClass === 'Crusader') {
          baseKnownManeuvers = 5 + Math.floor((martialLvls - 1) / 2);
          baseReadied = martialLvls >= 20 ? 7 : (martialLvls >= 10 ? 6 : 5);
          baseKnownStances = martialLvls >= 14 ? 4 : (martialLvls >= 8 ? 3 : (martialLvls >= 2 ? 2 : 1));
        } else {
          // Warblade & Default Martial Adept
          baseKnownManeuvers = 3 + Math.floor((martialLvls - 1) / 2);
          baseReadied = martialLvls >= 20 ? 7 : (martialLvls >= 15 ? 6 : (martialLvls >= 9 ? 5 : (martialLvls >= 4 ? 4 : 3)));
          baseKnownStances = martialLvls >= 16 ? 4 : (martialLvls >= 10 ? 3 : (martialLvls >= 4 ? 2 : 1));
        }
      }

      const maxKnownManeuvers = Math.max(0, baseKnownManeuvers + martialStudyCount + dmKnownBonus);
      const maxReadied = Math.max(0, baseReadied + (martialLvls === 0 && martialStudyCount > 0 ? 1 : 0) + dmReadiedBonus);
      const maxKnownStances = Math.max(0, baseKnownStances + martialStanceCount + dmStanceBonus);
      const classDisciplines = adeptClass === 'Crusader'
        ? ['Devoted Spirit', 'Stone Dragon', 'White Raven']
        : (adeptClass === 'Swordsage'
          ? ['Desert Wind', 'Diamond Mind', 'Setting Sun', 'Shadow Hand', 'Stone Dragon', 'Tiger Claw']
          : (adeptClass === 'Warblade'
            ? ['Diamond Mind', 'Iron Heart', 'Stone Dragon', 'Tiger Claw', 'White Raven']
            : ['Desert Wind', 'Devoted Spirit', 'Diamond Mind', 'Iron Heart', 'Setting Sun', 'Shadow Hand', 'Stone Dragon', 'Tiger Claw', 'White Raven']));

      return {
        il,
        maxManeuverLvl,
        readiedCount: readiedList.length,
        maxReadied,
        baseReadied,
        dmReadiedBonus,
        maxKnownManeuvers,
        baseKnownManeuvers,
        dmKnownBonus,
        maxKnownStances,
        baseKnownStances,
        dmStanceBonus,
        adeptClass,
        classDisciplines,
        martialLvls,
        otherLvls,
        hasClass: true
      };
    }

    function renderSpellsCockpit() {
      const { primaryClass, statKey, statVal, statMod, cl, clMode, hasClass: hasSpontaneous, sorcLvls } = getCasterInfo();
      const classesStatus = checkCharacterMagicClasses();

      // Synchronize Sorcerer spell slots with effective Caster Level (CL)
      if (character && typeof calculateSorcererSlots === 'function') {
        if (!character.spellcasting) character.spellcasting = {};
        character.spellcasting.cl = cl;
        if (character.isNpc) {
          if (character.spellSlots && typeof character.spellSlots === 'object') {
            const curSlots = Array.isArray(character.spellcasting.slots) ? character.spellcasting.slots : [];
            const built = [];
            for (let lvl = 0; lvl <= 9; lvl++) {
              const daily = Number(character.spellSlots[lvl]) || 0;
              if (daily > 0 || lvl === 0) {
                const found = curSlots.find(s => Number(s.level) === lvl);
                built.push({
                  level: lvl,
                  daily: daily,
                  used: found ? Math.min(found.used || 0, daily) : 0
                });
              }
            }
            character.spellcasting.slots = built;
          }
        } else {
          const curSlots = Array.isArray(character.spellcasting.slots) ? character.spellcasting.slots : [];
          character.spellcasting.slots = (sorcLvls > 0 && cl > 0)
            ? calculateSorcererSlots(sorcLvls, statVal, curSlots) 
            : curSlots.filter(s => (Number(s.dmBonus) || 0) > 0);
        }
      }

      // Top archetype badges (Sadeleştirilmiş Kalan / Toplam Sayaçları)
      const spontBadge = document.getElementById('tab-spontaneous-badge');
      if (spontBadge) {
        const slots = Array.isArray(character?.spellcasting?.slots) ? character.spellcasting.slots : [];
        const totalDaily = slots.reduce((sum, s) => sum + (Number(s.daily) || 0), 0);
        const totalUsed = slots.reduce((sum, s) => sum + (Number(s.used) || 0), 0);
        const totalRemaining = Math.max(0, totalDaily - totalUsed);
        if ((!hasSpontaneous || cl <= 0) && totalDaily === 0) {
          spontBadge.textContent = 'No Class';
          spontBadge.className = 'bg-slate-900 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-slate-700 shrink-0';
          spontBadge.title = 'No spontaneous spellcasting class';
        } else {
          spontBadge.textContent = `${totalRemaining} / ${totalDaily}`;
          spontBadge.className = 'bg-purple-950/80 text-purple-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold border border-purple-600/60 shrink-0';
          spontBadge.title = `Daily Slots Remaining: ${totalRemaining} / ${totalDaily}`;
        }
      }

      const prepInfo = getPreparedCasterInfo();
      if (character?.spellcasting) {
        const curPrep = Array.isArray(character.spellcasting.preparedSlots) ? character.spellcasting.preparedSlots : [];
        character.spellcasting.preparedSlots = ((prepInfo.wizLvls > 0 || prepInfo.hasClass) && prepInfo.cl > 0)
          ? calculateWizardSlots(prepInfo.cl, prepInfo.statVal, curPrep)
          : curPrep.filter(s => (Number(s.dmBonus) || 0) > 0);
      }
      const prepBadge = document.getElementById('tab-prepared-badge');
      if (prepBadge) {
        const pSlots = Array.isArray(character?.spellcasting?.preparedSlots) ? character.spellcasting.preparedSlots : [];
        const pDaily = pSlots.reduce((sum, s) => sum + (Number(s.daily) || 0), 0);
        const pUsed = pSlots.reduce((sum, s) => sum + (Number(s.used) || 0), 0);
        const pRem = Math.max(0, pDaily - pUsed);
        if ((!classesStatus.hasPrepared || prepInfo.cl <= 0) && pDaily === 0) {
          prepBadge.textContent = 'No Class';
          prepBadge.className = 'bg-slate-900 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-slate-700 shrink-0';
        } else {
          prepBadge.textContent = `${pRem} / ${pDaily}`;
          prepBadge.className = 'bg-sky-950 text-sky-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold border border-sky-600/60 shrink-0';
        }
      }

      const divInfo = getDivineCasterInfo();
      if (character?.spellcasting) {
        const curDiv = Array.isArray(character.spellcasting.divineSlots) ? character.spellcasting.divineSlots : [];
        character.spellcasting.divineSlots = ((divInfo.divLvls > 0 || divInfo.hasClass) && divInfo.cl > 0)
          ? calculateDivineSlots(divInfo.cl, divInfo.statVal, curDiv)
          : curDiv.filter(s => (Number(s.dmBonus) || 0) > 0);
      }
      const divineBadge = document.getElementById('tab-divine-badge');
      if (divineBadge) {
        const dSlots = Array.isArray(character?.spellcasting?.divineSlots) ? character.spellcasting.divineSlots : [];
        const dDaily = dSlots.reduce((sum, s) => sum + (Number(s.daily) || 0), 0);
        const dUsed = dSlots.reduce((sum, s) => sum + (Number(s.used) || 0), 0);
        const dRem = Math.max(0, dDaily - dUsed);
        if ((!classesStatus.hasDivine || divInfo.cl <= 0) && dDaily === 0) {
          divineBadge.textContent = 'No Class';
          divineBadge.className = 'bg-slate-900 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-slate-700 shrink-0';
        } else {
          divineBadge.textContent = `${dRem} / ${dDaily}`;
          divineBadge.className = 'bg-amber-950 text-amber-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold border border-amber-600/60 shrink-0';
        }
      }

      const initInfo = getInitiatorInfo();
      const readiedList = character?.tomeOfBattle?.readiedManeuvers || [];
      const readyManeuvers = readiedList.filter(m => !m.expended).length;
      const totalReadied = initInfo.maxReadied || 0;
      const martialBadge = document.getElementById('tab-martial-badge');
      if (martialBadge) {
        if (!classesStatus.hasMartial || initInfo.il <= 0) {
          martialBadge.textContent = 'No Class';
          martialBadge.className = 'bg-slate-900 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-slate-700 shrink-0';
          martialBadge.title = 'No martial adept class';
        } else {
          martialBadge.textContent = `${readyManeuvers} / ${totalReadied}`;
          martialBadge.className = 'bg-rose-950/80 text-rose-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold border border-rose-600/60 shrink-0';
          martialBadge.title = `Readied Maneuvers: ${readyManeuvers} / ${totalReadied}`;
        }
      }

      try { renderPreparedDisciplineView(classesStatus.hasPrepared || (character?.spellcasting?.preparedSlots || []).some(s => (Number(s.daily) || 0) > 0)); } catch (e) { console.error('renderPreparedDisciplineView error:', e); }
      try { renderDivineDisciplineView(classesStatus.hasDivine || (character?.spellcasting?.divineSlots || []).some(s => (Number(s.daily) || 0) > 0)); } catch (e) { console.error('renderDivineDisciplineView error:', e); }

      const titleEl = document.getElementById('spells-cockpit-class-title');
      if (titleEl) titleEl.textContent = 'Spontaneous Spells & Invocations';

      const typeBadge = document.getElementById('spells-cockpit-type-badge');
      if (typeBadge) {
        typeBadge.textContent = hasSpontaneous ? (primaryClass || 'Sorcerer') : 'No Class';
      }

      const clBadge = document.getElementById('spells-cockpit-cl-badge');
      if (clBadge) {
        clBadge.textContent = hasSpontaneous ? `CL: ${cl}` : 'CL: 0';
        clBadge.title = hasSpontaneous ? `Caster Level: ${cl} (${clMode})` : 'No spellcasting class';
      }

      const subEl = document.getElementById('spells-hud-subtitle');
      if (subEl) {
        subEl.textContent = hasSpontaneous 
          ? `Stat Mod: +${statMod} (${statKey}: ${statVal}) • Includes Base + 24h Gear Bonus • ${clMode}`
          : 'No spellcasting class selected';
      }

      const asfBadge = document.getElementById('spells-hud-asf-badge');
      if (asfBadge) {
        const ignoreAsf = character?.settings?.ignoreAsf !== false;
        asfBadge.textContent = ignoreAsf ? '🛡️ ASF: 0% (DM Boon)' : '🛡️ ASF: Standard';
        asfBadge.className = ignoreAsf
          ? 'badge bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-bold'
          : 'badge bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold';
      }

      // Martial Adept Header Info
      const adeptBadgeEl = document.getElementById('maneuvers-adept-badge');
      if (adeptBadgeEl) {
        adeptBadgeEl.textContent = initInfo.adeptClass || 'Warblade';
      }
      const ilBadgeEl = document.getElementById('maneuvers-il-badge');
      if (ilBadgeEl) {
        ilBadgeEl.textContent = `IL: ${initInfo.il}`;
        ilBadgeEl.title = `Initiator Level: ${initInfo.il} (${initInfo.martialLvls} Martial + ⌊${initInfo.otherLvls} Other / 2⌋)`;
      }
      const maxLvlBadgeEl = document.getElementById('maneuvers-maxlvl-badge');
      if (maxLvlBadgeEl) {
        maxLvlBadgeEl.textContent = `Max: Level ${initInfo.maxManeuverLvl}`;
      }
      const adeptSubEl = document.getElementById('maneuvers-hud-subtitle');
      if (adeptSubEl) {
        adeptSubEl.textContent = `Tome of Battle: ${initInfo.martialLvls} ${initInfo.adeptClass} + ⌊${initInfo.otherLvls} Other Classes / 2⌋ = IL ${initInfo.il} • Known Quota: ${initInfo.maxKnownManeuvers} Maneuvers, ${initInfo.maxKnownStances} Stances`;
      }
      const quotaBadge = document.getElementById('readied-quota-badge');
      if (quotaBadge) {
        quotaBadge.textContent = `${readyManeuvers} / ${initInfo.maxReadied} Readied`;
      }
      const readiedCounter = document.getElementById('readied-maneuvers-counter');
      if (readiedCounter) {
        readiedCounter.textContent = `${readyManeuvers} / ${totalReadied} Readied`;
      }

      // Populate Active Stance Select Box
      const stanceSelect = document.getElementById('active-stance-select');
      if (stanceSelect) {
        const stances = character?.tomeOfBattle?.stancesKnown || [];
        const curStance = character?.activeStance || 'None';
        stanceSelect.innerHTML = '';

        stances.forEach(st => {
          const opt = document.createElement('option');
          opt.value = st.name;
          opt.textContent = `${st.name} (${st.discipline} ${st.level || 1})`;
          if (st.name === curStance) opt.selected = true;
          stanceSelect.appendChild(opt);
        });

        const noneOpt = document.createElement('option');
        noneOpt.value = 'None';
        noneOpt.textContent = 'None (No Active Stance)';
        if (curStance === 'None' || !stances.some(st => st.name === curStance)) noneOpt.selected = true;
        stanceSelect.appendChild(noneOpt);
      }

      const activeStanceObj = (character?.tomeOfBattle?.stancesKnown || []).find(st => st.name === character?.activeStance);
      const stanceBenefitEl = document.getElementById('active-stance-benefit-display');
      if (stanceBenefitEl) {
        if (activeStanceObj) {
          stanceBenefitEl.textContent = activeStanceObj.benefit || 'Active Stance Benefit';
        } else {
          stanceBenefitEl.textContent = 'No martial stance currently active.';
        }
      }

      const stanceDiscBadge = document.getElementById('active-stance-discipline-badge');
      if (stanceDiscBadge) {
        stanceDiscBadge.textContent = activeStanceObj ? activeStanceObj.discipline : 'None';
      }
    }

    // Daily Spell Slots (Kompakt Kapsül Şeridi - Asla taşmaz veya şişmez)
    function switchCompactSlotsSource(sourceKey) {
      window.currentCompactSlotsSource = sourceKey;
      renderSpellSlots();
    }

    function renderSpellSlots() {
      renderSpellsCockpit();
      if (typeof renderSpellSlotsStrip === 'function') renderSpellSlotsStrip();

      const container = document.getElementById('compact-spell-slots-grid') || document.getElementById('spell-slots-grid');
      if (!container) return;
      container.innerHTML = '';

      const sources = getAvailableSpellSlotSources().filter(s => s.key !== 'martial');
      const tabsContainer = document.getElementById('compact-slots-source-tabs');

      // Determine active source for compact grid
      let activeSource = (sources.length > 0)
        ? (sources.find(s => s.key === window.currentCompactSlotsSource) || sources[0])
        : null;
      let activeKey = activeSource ? activeSource.key : 'spontaneous';
      window.currentCompactSlotsSource = activeKey;
      if (!activeSource) return;

      // Update tabs (always show all sources so user can switch between Spontaneous, Prepared, and Divine)
      if (tabsContainer) {
        tabsContainer.innerHTML = sources.map(s => {
          const isAct = s.key === activeSource.key;
          return `
            <button type="button" onclick="switchCompactSlotsSource('${s.key}')" class="text-[9px] px-2 py-0.5 rounded font-bold transition cursor-pointer flex items-center gap-1 ${isAct ? `${s.tagClass} border shadow-sm` : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}">
              <span>${s.icon}</span>
              <span>${s.shortLabel}</span>
            </button>
          `;
        }).join('');
      }

      const slots = activeSource.slots;
      const { statKey, statMod } = (activeSource.key === 'divine' ? getDivineCasterInfo() : (activeSource.key === 'prepared' ? getPreparedCasterInfo() : getCasterInfo()));

      for (let lvl = 0; lvl <= 11; lvl++) {
        const s = slots.find(item => Number(item.level) === lvl);
        const daily = s ? (Number(s.daily) || 0) : 0;
        const used = s ? (Number(s.used) || 0) : 0;
        const remaining = Math.max(0, daily - used);
        const isUnlocked = daily > 0;
        const dc = 10 + lvl + statMod;
        const lvlLabel = lvl === 0 ? '0 (Cantrip)' : (lvl >= 10 ? `Level ${lvl} (Epic)` : `Level ${lvl}`);
        const div = document.createElement('div');

        if (isUnlocked) {
          const isDepleted = remaining <= 0;
          div.className = `flex items-center justify-between ${
            isDepleted
              ? 'bg-slate-950/70 border border-slate-800/80 opacity-50 grayscale-[30%]'
              : (activeSource.key === 'prepared' ? 'bg-slate-900/90 border border-sky-800/60 hover:border-sky-500' : (activeSource.key === 'divine' ? 'bg-slate-900/90 border border-amber-800/60 hover:border-amber-500' : 'bg-slate-900/90 border border-purple-800/60 hover:border-purple-600'))
          } rounded-xl px-3 py-2 shadow-sm transition w-full`;
          if (isDepleted) div.title = '⚠️ All spell slots at this level are expended';

          let knownSubtitle = '';
          if (activeSource.key === 'spontaneous') {
            const currentKnown = (character.spellcasting?.knownSpells || []).filter(sp => Number(sp.level) === lvl).length;
            const quota = s.known !== undefined ? s.known : getSpellsKnownQuota(lvl);
            knownSubtitle = `<span class="text-[10px] text-purple-300 font-mono mt-0.5">${currentKnown}/${quota} Known</span>`;
          } else if (activeSource.key === 'prepared') {
            const currentPrep = (character.spellcasting?.preparedSpells || []).filter(sp => Number(sp.level) === lvl).length;
            knownSubtitle = `<span class="text-[10px] text-sky-300 font-mono mt-0.5">${currentPrep}/${daily} Prepared</span>`;
          } else {
            const currentDiv = (character.spellcasting?.divineSpells || []).filter(sp => Number(sp.level) === lvl).length;
            knownSubtitle = `<span class="text-[10px] text-amber-300 font-mono mt-0.5">${currentDiv}/${daily} Prepared</span>`;
          }

          const dcBadgeClass = activeSource.key === 'prepared' 
            ? 'bg-sky-950/90 text-emerald-400 border border-sky-700/60' 
            : (activeSource.key === 'divine' 
                ? 'bg-amber-950/90 text-emerald-400 border border-amber-700/60' 
                : 'bg-purple-950/90 text-emerald-400 border border-purple-700/60');

          div.innerHTML = `
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-extrabold text-white text-xs whitespace-nowrap">${lvlLabel}</span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${dcBadgeClass} font-bold whitespace-nowrap" title="Save DC = 10 + ${lvl} + ${statKey}(${statMod >= 0 ? '+' + statMod : statMod})">DC ${dc}</span>
              </div>
              ${knownSubtitle}
            </div>

            <div class="h-7 w-px bg-slate-800 mx-1.5 shrink-0"></div>

            <div class="flex flex-col items-end shrink-0">
              <span class="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Slots Left</span>
              <span class="text-xs sm:text-sm font-black font-mono ${remaining > 0 ? 'text-emerald-400' : 'text-rose-500'} whitespace-nowrap">${remaining} / ${daily}</span>
            </div>
          `;
        } else {
          const isSpont = activeSource.key === 'spontaneous';
          const reqClText = lvl >= 10 ? 'Epic (CL 21+)' : (lvl <= 1 ? 'CL 1+' : (isSpont ? `CL ${lvl * 2}+` : `CL ${lvl * 2 - 1}+`));
          div.className = 'flex items-center justify-between bg-slate-950/50 border border-slate-800/70 rounded-xl px-3 py-2 opacity-50 select-none transition w-full';
          div.title = `${lvlLabel} locked (Requires ${reqClText})`;
          div.innerHTML = `
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-bold text-slate-500 text-xs whitespace-nowrap">${lvlLabel}</span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 font-bold whitespace-nowrap">DC ${dc}</span>
              </div>
              <span class="text-[10px] text-slate-600 font-mono mt-0.5">🔒 Locked (${reqClText})</span>
            </div>

            <div class="h-7 w-px bg-slate-800/60 mx-1.5 shrink-0"></div>

            <div class="flex flex-col items-end shrink-0">
              <span class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">Slots Left</span>
              <span class="text-xs sm:text-sm font-black font-mono text-slate-600 whitespace-nowrap">🔒 0 / 0</span>
            </div>
          `;
        }

        container.appendChild(div);
      }
    }
    function useSpellSlot(idx) {
      if (!character?.spellcasting?.slots?.[idx]) return;
      if (character.spellcasting.slots[idx].used < character.spellcasting.slots[idx].daily) {
        character.spellcasting.slots[idx].used++;
        renderSpellSlots();
        saveStateToStorage();
      }
    }

    function restoreSpellSlot(idx) {
      if (!character?.spellcasting?.slots?.[idx]) return;
      if (character.spellcasting.slots[idx].used > 0) {
        character.spellcasting.slots[idx].used--;
        renderSpellSlots();
        saveStateToStorage();
      }
    }

    function restoreAllSpellSlots() {
      (character?.spellcasting?.slots || []).forEach(s => s.used = 0);
      (character?.spellcasting?.preparedSlots || []).forEach(s => s.used = 0);
      (character?.spellcasting?.divineSlots || []).forEach(s => s.used = 0);
      if (character) character.lastModified = new Date().toISOString();
      renderSpellSlots();
      saveStateToStorage(true);
      if (window.CloudSync && typeof window.CloudSync.pushImmediate === 'function') {
        window.CloudSync.pushImmediate();
      } else if (window.GDriveSync && typeof window.GDriveSync.pushToCloud === 'function') {
        window.GDriveSync.pushToCloud(true);
      }
      showDiceTopToast({
        icon: '✨',
        title: 'Spell Slots',
        breakdown: 'All daily spell slots refreshed and restored',
        total: 'Yenilendi'
      });
    }

    // Helper: Find damage dice in string
    function findDiceExpression(text) {
      if (!text) return null;
      const m = text.match(/\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/i);
      return m ? m[1].replace(/\s+/g, '') : null;
    }

    // Helper: Sanitize Turkish mojibake strings and corrupt characters
    function sanitizeMojibakeString(str) {
      if (typeof str !== 'string') return str;
      return str
        .replace(/\u00E2\u2020\u00B3/g, '\u21B3')
        .replace(/\u00E2\u2020\u2019/g, '\u2794')
        .replace(/\u00C4\u00B0/g, '\u0130')
        .replace(/\u00C4\u00B1/g, '\u0131')
        .replace(/\u00C5\u0178/g, '\u015F')
        .replace(/\u00C5\u017D/g, '\u015E')
        .replace(/\u00C3\u00A7/g, '\u00E7')
        .replace(/\u00C3\u2021/g, '\u00C7')
        .replace(/\u00C3\u00B6/g, '\u00F6')
        .replace(/\u00C3\u2013/g, '\u00D6')
        .replace(/\u00C3\u00BC/g, '\u00FC')
        .replace(/\u00C3\u0153/g, '\u00DC')
        .replace(/\u00C4\u017F/g, '\u011F')
        .replace(/\u00C4\u017D/g, '\u011E');
    }

    // Helper: Check if a Master DB entry is a Child row (parent !== '-' or starts with '\u21B3')
    function isMasterDbChildEntry(item) {
      if (!item) return false;
      if (item.isChild) return true;
      const p = sanitizeMojibakeString(String(item.parent || '')).trim();
      if (p && p !== '-') return true;
      const n = sanitizeMojibakeString(String(item.name || '')).trim();
      return n.startsWith('\u21B3') || n.startsWith('\u2794') || n.startsWith('\u2192') || n.startsWith('>');
    }

    // Helper: Extract clean parent spell/maneuver name from item object or roll title
    function extractCleanParentSpellName(itemOrTitle) {
      if (!itemOrTitle) return '';
      if (typeof itemOrTitle === 'object') {
        if (isMasterDbChildEntry(itemOrTitle) && itemOrTitle.parent && itemOrTitle.parent !== '-') {
          return sanitizeMojibakeString(String(itemOrTitle.parent)).replace(/^[\u21B3\u2794\u2192>\s]+/, '').trim();
        }
        const raw = sanitizeMojibakeString(String(itemOrTitle.name || itemOrTitle.title || '')).trim();
        if (raw) {
          const arrowParts = raw.replace(/^[\u21B3\u2794\u2192>\s]+/, '').split(/[\u2794\u2192â”]/);
          const candidate = arrowParts[0]
            .replace(/\s*\(\d+\.\s*Seviye.*?\)\s*$/i, '')
            .replace(/\s+Hasar[\u0131ı]$/i, '')
            .replace(/\s*\(Manevra Kullan[\u0131ı]ld[\u0131ı]\)\s*$/i, '')
            .trim();
          return candidate;
        }
      }
      const str = sanitizeMojibakeString(String(itemOrTitle)).replace(/^[\u21B3\u2794\u2192>\s]+/, '');
      const parts = str.split(/[\u2794\u2192â”]/);
      return parts[0]
        .replace(/\s*\(\d+\.\s*Seviye.*?\)\s*$/i, '')
        .replace(/\s+Hasar[\u0131ı]$/i, '')
        .replace(/\s*\(Manevra Kullan[\u0131ı]ld[\u0131ı]\)\s*$/i, '')
        .trim();
    }

    // Helper: Retrieve linked Child entries from Master DB for a Parent spell/maneuver
    function getSpellOrManeuverChildren(itemOrTitle) {
      const parentName = extractCleanParentSpellName(itemOrTitle);
      if (!parentName) return [];
      const allDb = Array.isArray(masterDb) ? masterDb : [];
      let list = [];
      if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.getChildrenForEntry === 'function') {
        list = RuleMaster.getChildrenForEntry({ name: parentName }, allDb);
      } else {
        const pLower = parentName.toLowerCase();
        list = allDb.filter(other => {
          if (!other || !other.name) return false;
          const otherParent = sanitizeMojibakeString(String(other.parent || '')).toLowerCase().trim();
          if (otherParent && otherParent !== '-' && otherParent === pLower) return true;
          const otherName = sanitizeMojibakeString(String(other.name || '')).toLowerCase().trim();
          if (otherName.startsWith('\u21B3') || otherName.startsWith('>')) {
            const afterArrow = otherName.replace(/^[\u21B3\u2794\u2192>\s]+/, '').trim();
            if (afterArrow.startsWith(pLower)) return true;
          }
          return false;
        });
      }
      // Deduplicate children by sanitized name
      const seen = new Set();
      return (list || []).filter(c => {
        if (!c || !c.name) return false;
        const cleanName = sanitizeMojibakeString(String(c.name)).replace(/^[\u21B3\u2794\u2192>\s]+/, '').toLowerCase().trim();
        if (seen.has(cleanName)) return false;
        seen.add(cleanName);
        return true;
      });
    }
    // Helper: Extract short variant label for a Child entry
    function getShortChildVariantTitle(child, parentName) {
      if (!child) return 'Sub-Effect';
      let raw = String(child.name || '').replace(/^↳\s*/, '').trim();
      const pClean = String(parentName || child.parent || '').replace(/^↳\s*/, '').trim();
      if (pClean && raw.toLowerCase().startsWith(pClean.toLowerCase())) {
        raw = raw.slice(pClean.length).trim();
      }
      raw = raw.replace(/^[:\-–—]\s*/, '').replace(/^\((.*)\)$/, '$1').trim();
      return raw || String(child.name || 'Sub-Effect').replace(/^↳\s*/, '').trim();
    }

    // Classify spell or maneuver effect for Option A interactive HP / Temp HP actions
    function classifySpellOrManeuverEffect(itemOrTitle) {
      if (!itemOrTitle) return 'damage';
      if (typeof itemOrTitle === 'object' && itemOrTitle.effectType) {
        return itemOrTitle.effectType;
      }
      const rawName = (typeof itemOrTitle === 'string' ? itemOrTitle : (itemOrTitle.name || itemOrTitle.title || '')).toLowerCase().trim();
      const rawDesc = (typeof itemOrTitle === 'object' ? (itemOrTitle.benefit || itemOrTitle.notes || itemOrTitle.description || '') : '').toLowerCase().trim();

      // Explicit Undead overrides on Child rows
      if (rawName.includes('undead hasar') || (rawName.includes('undead') && rawDesc.includes('hasar verir'))) {
        return 'damage';
      }
      if (rawName.includes('undead iyileş') || (rawName.includes('inflict') && rawName.includes('undead'))) {
        return 'heal';
      }

      // 1. Vampiric / Life Drain (Deals damage AND grants Temp HP / Heal)
      if (
        rawName.includes('vampiric') ||
        rawName.includes('consumptive field') ||
        rawDesc.includes('damage as temp hp') ||
        rawDesc.includes('equal to the damage')
      ) {
        return 'vampiric';
      }

      // 2. Blood Sacrifice (Blade of Blood: Sacrifice 5 HP for +2d6)
      if (rawName.includes('blade of blood')) {
        return 'blood_sacrifice';
      }

      // 3. Direct Healing (Cure Wounds, Heal, Close Wounds, Devoted Spirit strikes)
      if (
        rawName.includes('cure ') ||
        rawName === 'heal' ||
        rawName.startsWith('heal ') ||
        rawName.includes('mass heal') ||
        rawName.includes('close wounds') ||
        rawName.includes('faith healing') ||
        rawName.includes('panacea') ||
        rawName.includes("crusader's strike") ||
        rawName.includes('crusader strike') ||
        rawName.includes('revitalizing strike') ||
        rawName.includes('rallying strike') ||
        rawName.includes('strike of righteous vitality') ||
        rawName.includes('martial spirit') ||
        rawDesc.includes('cures ') ||
        rawDesc.includes('heals ') ||
        rawDesc.includes('iyileştir')
      ) {
        return 'heal';
      }

      // 4. Temporary HP (False Life, Aid, Virtue, Heroes' Feast)
      if (
        rawName.includes('false life') ||
        rawName === 'aid' ||
        rawName.startsWith('aid ') ||
        rawName.includes('virtue') ||
        rawDesc.includes('temporary hp') ||
        rawDesc.includes('temporary hit points') ||
        rawDesc.includes('temp hp')
      ) {
        return 'temp_hp';
      }

      return 'damage';
    }

    // ====================================================
    // PRE-CAST 5-SECOND CHOICE TOAST & VARIANT SELECTOR
    // ====================================================
    let _spellPreCastCountdownInterval = null;
    let _spellPreCastTimeout = null;

    function clearSpellPreCastChoice() {
      if (_spellPreCastCountdownInterval) {
        clearInterval(_spellPreCastCountdownInterval);
        _spellPreCastCountdownInterval = null;
      }
      if (_spellPreCastTimeout) {
        clearTimeout(_spellPreCastTimeout);
        _spellPreCastTimeout = null;
      }
      const existing = document.getElementById('spell-precast-choice-toast');
      if (existing) {
        existing.classList.remove('translate-y-0', 'opacity-100');
        existing.classList.add('-translate-y-8', 'opacity-0');
        setTimeout(() => existing.remove(), 250);
      }
    }

    function showSpellPreCastChoiceToast(data) {
      if (!data || !Array.isArray(data.options) || data.options.length === 0) return;
      clearSpellPreCastChoice();

      const { spell, slot, lvl, cl, options } = data;
      const spellName = spell.name || 'Spell';
      const slotLabel = lvl === 0 ? 'Level 0 (Cantrip)' : `Level ${lvl} Slot`;

      let container = document.getElementById('dice-top-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'dice-top-toast-container';
        container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-2 pointer-events-none transition-all duration-300 max-w-[94vw] sm:max-w-md w-max';
        document.body.appendChild(container);
      } else {
        container.classList.add('gap-2');
      }

      // Remove unpinned toasts
      const items = container.querySelectorAll('.dice-toast-item');
      items.forEach(it => {
        if (it._dismissTimer) clearTimeout(it._dismissTimer);
        it.remove();
      });

      const toast = document.createElement('div');
      toast.id = 'spell-precast-choice-toast';
      toast.className = 'dice-toast-item pointer-events-auto transform -translate-y-8 opacity-0 transition-all duration-300 ease-out bg-slate-900/98 border-2 border-amber-500/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md flex flex-col gap-2.5 text-white max-w-[94vw] sm:max-w-md w-full select-none shadow-[0_0_30px_rgba(245,158,11,0.25)]';

      let btnsHtml = '';
      options.forEach((opt, idx) => {
        btnsHtml += `
          <button type="button" data-opt-idx="${idx}" class="${opt.className || 'px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-950 hover:bg-amber-800 text-amber-200 border border-amber-500/80 transition cursor-pointer shadow inline-flex items-center gap-1'}">
            ${opt.label}
          </button>
        `;
      });
      btnsHtml += `
        <button type="button" id="spell-precast-cancel-btn" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition cursor-pointer">
          \u274C Cancel
        </button>
      `;

      toast.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xl shrink-0">\uD83D\uDD2E</span>
            <div class="min-w-0">
              <div class="text-sm font-black text-amber-300 truncate">${spellName}</div>
              <div class="text-[11px] text-slate-400 font-medium">${slotLabel} \u2022 Select Option</div>
            </div>
          </div>
          <span id="spell-precast-countdown-badge" class="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/60 shrink-0 font-mono animate-pulse">
            ⏳ 30s
          </span>
        </div>
        <div class="text-[11px] text-slate-300">
          Please select the spell variant or sacrifice option (waiting 30s).
        </div>
        <div id="spell-precast-btns-bar" class="flex flex-wrap items-center gap-1.5 pt-1">
          ${btnsHtml}
        </div>
        <div class="w-full bg-slate-800 rounded-full h-1 overflow-hidden mt-0.5">
          <div id="spell-precast-progress" class="bg-amber-400 h-full transition-all duration-1000 ease-linear rounded-full" style="width: 100%;"></div>
        </div>
      `;

      container.appendChild(toast);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toast.classList.remove('-translate-y-8', 'opacity-0');
          toast.classList.add('translate-y-0', 'opacity-100');
        });
      });

      // Bind button events
      const btnsBar = toast.querySelector('#spell-precast-btns-bar');
      if (btnsBar) {
        options.forEach((opt, idx) => {
          const btn = btnsBar.querySelector(`[data-opt-idx="${idx}"]`);
          if (btn) {
            btn.onclick = (e) => {
              e.stopPropagation();
              clearSpellPreCastChoice();
              if (typeof opt.execute === 'function') {
                opt.execute();
              }
            };
          }
        });
        const cancelBtn = btnsBar.querySelector('#spell-precast-cancel-btn');
        if (cancelBtn) {
          cancelBtn.onclick = (e) => {
            e.stopPropagation();
            clearSpellPreCastChoice();
          };
        }
      }

      // 30-second countdown timer
      let secondsLeft = 30;
      const totalSeconds = 30;
      const badge = toast.querySelector('#spell-precast-countdown-badge');
      const progress = toast.querySelector('#spell-precast-progress');

      _spellPreCastCountdownInterval = setInterval(() => {
        secondsLeft--;
        if (badge) badge.textContent = `⏳ ${secondsLeft}s`;
        if (progress) progress.style.width = `${(secondsLeft / totalSeconds) * 100}%`;

        if (secondsLeft <= 0) {
          clearSpellPreCastChoice();
          // Notify user: spell aborted, slot NOT spent
          showDiceTopToast({
            icon: '⏳',
            title: `${spellName} Cancelled`,
            breakdown: 'No selection made within 30 seconds • Spell slot was not expended.',
            total: 'Cancelled'
          });
        }
      }, 1000);

      // Sayfada boşa / toast dışına tıklandığında büyüyü iptal et ve slotu harcama
      setTimeout(() => {
        const onOutsidePrecastClick = (e) => {
          const el = document.getElementById('spell-precast-choice-toast');
          if (!el) {
            document.removeEventListener('click', onOutsidePrecastClick);
            return;
          }
          if (e.target.closest('#spell-precast-choice-toast')) return;
          document.removeEventListener('click', onOutsidePrecastClick);
          clearSpellPreCastChoice();
          showDiceTopToast({
            icon: 'ℹ️',
            title: `${spellName} Cancelled`,
            breakdown: 'Dismissed • Spell slot was not expended.',
            total: 'Cancelled'
          }, { autoDismiss: true, dismissMs: 3000 });
        };
        document.addEventListener('click', onOutsidePrecastClick);
      }, 60);
    }

    function getSpellPreCastOptions(spellItem, cl, slotRef, lvl) {
      if (!spellItem) return null;
      if (isMasterDbChildEntry(spellItem)) return null;

      const rawName = String(spellItem.name || '').trim();
      const pName = extractCleanParentSpellName(spellItem);
      const children = getSpellOrManeuverChildren(pName);
      const effType = classifySpellOrManeuverEffect(spellItem);

      const isBloodSacrifice = effType === 'blood_sacrifice' || /feda|blade of blood/i.test(rawName) || Number(spellItem.selfHpCost) > 0;
      const hasChildren = Array.isArray(children) && children.length > 0;

      if (!isBloodSacrifice && !hasChildren) {
        return null;
      }

      const options = [];

      if (hasChildren) {
        children.forEach(child => {
          const childDice = resolveSpellEffectiveFormula(child, cl);
          const shortTitle = getShortChildVariantTitle(child, pName);
          const childEff = classifySpellOrManeuverEffect(child);
          const hpCost = Number(child.selfHpCost) || (/feda/i.test(child.name || '') ? 5 : 0);

          let btnClass = 'px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow cursor-pointer inline-flex items-center gap-1 ';
          if (hpCost > 0 || childEff === 'blood_sacrifice_roll') {
            btnClass += 'bg-rose-900/90 hover:bg-rose-700 text-rose-100 border border-rose-400';
          } else if (childEff === 'heal') {
            btnClass += 'bg-emerald-900/90 hover:bg-emerald-700 text-emerald-100 border border-emerald-400';
          } else {
            btnClass += 'bg-amber-950/90 hover:bg-amber-800 text-amber-200 border border-amber-500/80';
          }

          let label = child.childButtonLabel || (childDice ? `${shortTitle} (${childDice})` : shortTitle);
          if (hpCost > 0 && !label.includes('HP')) {
            label = `\uD83E\uDE78 -${hpCost} HP Sacrifice: ${label}`;
          }

          options.push({
            label,
            className: btnClass,
            execute: () => {
              if (slotRef && slotRef.used < slotRef.daily) {
                slotRef.used++;
                saveStateToStorage(true);
                renderAll();
              }
              if (childDice) {
                rollSpellOrManeuverFormula(
                  childDice,
                  `${pName} \u2794 ${shortTitle}${hpCost > 0 ? ` (\u2022 -${hpCost} HP Sacrifice)` : ''}`,
                  child,
                  { name: pName }
                );
              } else {
                showDiceTopToast({
                  icon: '\u26A1',
                  title: `${pName} \u2794 ${shortTitle}`,
                  breakdown: child.benefit || child.description || 'Sub-effect applied',
                  total: child.shortResult || 'Special Effect'
                });
              }
              if (hpCost > 0) {
                applySpellSelfDamage(hpCost, child.name || pName, true, { stack: true });
              }
            }
          });
        });

        // Add standard/normal variant if parent formula is distinct and not represented
        const parentDice = resolveSpellEffectiveFormula(spellItem, cl);
        const hasMatchingChildDice = options.some(o => parentDice && o.label.includes(parentDice));
        if (parentDice && !hasMatchingChildDice && !/blade of blood/i.test(pName)) {
          options.unshift({
            label: `\u2600\uFE0F Standard (${parentDice})`,
            className: 'px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer',
            execute: () => {
              if (slotRef && slotRef.used < slotRef.daily) {
                slotRef.used++;
                saveStateToStorage(true);
                renderAll();
              }
              rollSpellOrManeuverFormula(
                parentDice,
                `${pName} (Level ${lvl} \u2022 -1 Slot)`,
                spellItem
              );
            }
          });
        }
      } else if (isBloodSacrifice) {
        options.push(
          {
            label: '\uD83E\uDE78 Sacrifice 5 HP (3d6)',
            className: 'px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-800 hover:bg-rose-700 text-rose-100 border border-rose-400 transition shadow cursor-pointer',
            execute: () => {
              if (slotRef && slotRef.used < slotRef.daily) {
                slotRef.used++;
                saveStateToStorage(true);
                renderAll();
              }
              rollSpellOrManeuverFormula(
                '3d6',
                `${pName} \u2794 5 HP Sacrifice (3d6 Damage)`,
                { name: `${pName} (5 HP Sacrifice)`, dice: '3d6', effectType: 'damage' },
                { name: pName }
              );
              applySpellSelfDamage(5, pName, true, { stack: true });
            }
          },
          {
            label: '\u2694\uFE0F No Sacrifice (1d6)',
            className: 'px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer',
            execute: () => {
              if (slotRef && slotRef.used < slotRef.daily) {
                slotRef.used++;
                saveStateToStorage(true);
                renderAll();
              }
              rollSpellOrManeuverFormula(
                '1d6',
                `${pName} \u2794 No Sacrifice (1d6 Damage)`,
                { name: `${pName} (No Sacrifice)`, dice: '1d6', effectType: 'damage' },
                { name: pName }
              );
            }
          }
        );
      }

      return {
        spell: spellItem,
        slot: slotRef,
        lvl,
        cl,
        options
      };
    }
    function buildOptionAToastActions(effectType, amount, cleanSourceName) {
      const val = Math.max(0, Number(amount) || 0);
      if (val <= 0) return [];
      const labelName = (cleanSourceName || 'Spell').replace(/\s*\(.*?\)\s*/g, '').trim();

      if (effectType === 'heal') {
        return [
          {
            label: `💚 Self (+${val} HP)`,
            className: 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400 transition shadow cursor-pointer',
            onClick: () => applySpellHealToSelf(val, labelName)
          },
          {
            label: '🤝 Ally / Target',
            className: 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer',
            onClick: () => {
              const t = document.getElementById('dice-top-toast');
              if (t) t.remove();
            }
          }
        ];
      }

      if (effectType === 'vampiric') {
        return [
          {
            label: `🛡️ +${val} Temp HP (RAW)`,
            className: 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-800 hover:bg-cyan-700 text-cyan-100 border border-cyan-400 transition shadow cursor-pointer',
            onClick: () => applySpellTempHpToSelf(val, labelName)
          },
          {
            label: `💚 +${val} Real HP`,
            className: 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500 transition shadow cursor-pointer',
            onClick: () => applySpellHealToSelf(val, labelName)
          }
        ];
      }

      if (effectType === 'temp_hp') {
        return [
          {
            label: `🛡️ Self (+${val} Temp HP)`,
            className: 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-800 hover:bg-cyan-700 text-cyan-100 border border-cyan-400 transition shadow cursor-pointer',
            onClick: () => applySpellTempHpToSelf(val, labelName)
          },
          {
            label: '🤝 Ally / Skip',
            className: 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer',
            onClick: () => {
              const t = document.getElementById('dice-top-toast');
              if (t) t.remove();
            }
          }
        ];
      }

      return [];
    }

    // Build Toast action buttons for all Child entries linked to the Parent in Master DB
    function buildChildVariantToastActions(currentItem, rootParentItem = null) {
      const parentRef = rootParentItem || currentItem;
      const parentName = extractCleanParentSpellName(parentRef);
      if (!parentName) return [];
      const children = getSpellOrManeuverChildren(parentName);
      if (!children || children.length === 0) return [];

      const { cl } = typeof getCasterInfo === 'function' ? getCasterInfo() : { cl: 6 };
      const currentNameLower = (typeof currentItem === 'object' && currentItem?.name ? currentItem.name : '').toLowerCase().trim();

      return children.map(child => {
        const childDice = resolveSpellEffectiveFormula(child, cl);
        const shortTitle = getShortChildVariantTitle(child, parentName);
        const isCurrent = currentNameLower && currentNameLower === (child.name || '').toLowerCase().trim();
        const effType = classifySpellOrManeuverEffect(child);

        let btnClass = 'px-2.5 py-1 rounded-lg text-[11px] font-bold transition shadow cursor-pointer inline-flex items-center gap-1 ';
        if (isCurrent) {
          btnClass += 'bg-amber-600 text-slate-950 border border-amber-300 ring-1 ring-amber-300';
        } else if (effType === 'blood_sacrifice_roll' || child.selfHpCost) {
          btnClass += 'bg-rose-900/90 hover:bg-rose-700 text-rose-100 border border-rose-400/80';
        } else if (effType === 'heal') {
          btnClass += 'bg-emerald-900/90 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/80';
        } else if (effType === 'duration' || effType === 'status') {
          btnClass += 'bg-purple-900/90 hover:bg-purple-700 text-purple-100 border border-purple-400/80';
        } else {
          btnClass += 'bg-amber-950/90 hover:bg-amber-800 text-amber-200 hover:text-white border border-amber-500/80';
        }

        const displayText = child.childButtonLabel || (childDice ? `${shortTitle} (${childDice})` : shortTitle);
        const labelHtml = childDice
          ? `${getFormulaDiceIconSvg(childDice, 'w-3.5 h-3.5 text-amber-300 shrink-0')}<span>${displayText}</span>`
          : `<span>${displayText}</span>`;

        return {
          label: labelHtml,
          className: btnClass,
          onClick: () => executeChildSpellOrManeuverVariant(child, parentName)
        };
      });
    }

    // Execute a Child entry from the Toast without spending an additional spell slot
    function executeChildSpellOrManeuverVariant(child, parentName) {
      if (!child) return;
      const pName = parentName || extractCleanParentSpellName(child) || 'Spell';
      const shortTitle = getShortChildVariantTitle(child, pName);
      const { cl } = typeof getCasterInfo === 'function' ? getCasterInfo() : { cl: 6 };
      const childDice = resolveSpellEffectiveFormula(child, cl);

      // Handle self HP sacrifice if required by Child (e.g. Blade of Blood -5 HP -> 3d6)
      let sacrificeNote = '';
      const hpCost = Number(child.selfHpCost) || 0;
      if (hpCost > 0 && character?.hp) {
        applySpellSelfDamage(hpCost, child.name || pName, false);
        sacrificeNote = ` • -${hpCost} HP Sacrifice (${character.hp.current}/${character.hp.max} HP)`;
      }

      if (childDice) {
        rollSpellOrManeuverFormula(
          childDice,
          `${pName} ➔ ${shortTitle}${sacrificeNote}`,
          child,
          { name: pName }
        );
      } else {
        const childActions = buildChildVariantToastActions(child, { name: pName });
        showDiceTopToast({
          icon: '⚡',
          title: `${pName} ➔ ${shortTitle}`,
          breakdown: child.benefit || child.description || 'Sub-effect applied',
          total: child.shortResult || 'Special Effect',
          actions: childActions
        });
      }
    }

    // Direct dice roller for spells and maneuvers (supports both XdY+Z and flat numbers like '1' or '60')
    function rollSpellOrManeuverFormula(expr, title, sourceItem = null, rootParentItem = null) {
      if (!expr) return;
      const clean = String(expr).trim();
      const effectType = classifySpellOrManeuverEffect(sourceItem || title);
      const unitLabel = (sourceItem && typeof sourceItem === 'object' && sourceItem.unitLabel) ? sourceItem.unitLabel : '';

      // Flat number case (e.g. Cure Minor Wounds = '1', Heal = '60')
      if (/^\d+$/.test(clean)) {
        const flatVal = parseInt(clean, 10) || 0;
        const actions = buildOptionAToastActions(effectType, flatVal, (sourceItem && sourceItem.name) || title);
        const toastIcon = getFormulaDiceIconSvg(clean, effectType === 'heal' ? 'w-6 h-6 text-emerald-400' : (effectType === 'vampiric' ? 'w-6 h-6 text-rose-400' : (effectType === 'temp_hp' ? 'w-6 h-6 text-cyan-400' : 'w-6 h-6 text-amber-400')));
        addDiceHistoryEntry({
          icon: toastIcon,
          title: `${title}`,
          formula: `${flatVal}`,
          breakdown: `Fixed Effect: ${flatVal}`,
          total: flatVal,
          isCrit: false,
          critInfo: ''
        });
        showDiceTopToast({
          icon: toastIcon,
          title: title || 'Spell Effect',
          breakdown: effectType === 'heal' ? `Healing Amount: +${flatVal} HP` : (sourceItem?.benefit || `Effect Value: ${flatVal}`),
          total: effectType === 'heal' ? `+${flatVal}` : (unitLabel ? `${flatVal} ${unitLabel}` : flatVal),
          actions
        }, { replaceId: 'dice-roll-active-toast' });
        return;
      }

      const match = clean.match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
      if (!match) {
        alert(`Dice formula: ${expr}`);
        return;
      }
      const count = parseInt(match[1], 10);
      const sides = parseInt(match[2], 10);
      const sign = match[3] || '+';
      const mod = match[4] ? parseInt(match[4], 10) * (sign === '-' ? -1 : 1) : 0;

      const dice3dList = [];
      const rolls = [];
      let sumOfDice = 0;
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        sumOfDice += r;
        if (dice3dList.length < 6) {
          dice3dList.push({ type: 'd' + sides, value: r });
        }
      }

      const grandTotal = sumOfDice + mod;
      let breakdownStr = `${count}d${sides} [${rolls.join(', ')}]`;
      if (mod !== 0) breakdownStr += ` ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)}`;
      if (unitLabel) breakdownStr += ` • ${unitLabel}`;

      const onDone = () => {
        const actions = buildOptionAToastActions(effectType, grandTotal, (sourceItem && sourceItem.name) || title);
        const toastIcon = getFormulaDiceIconSvg(
          clean,
          effectType === 'heal'
            ? 'w-6 h-6 text-emerald-400'
            : (effectType === 'vampiric'
              ? 'w-6 h-6 text-rose-400'
              : (effectType === 'temp_hp'
                ? 'w-6 h-6 text-cyan-400'
                : 'w-6 h-6 text-amber-400'))
        );

        addDiceHistoryEntry({
          icon: getFormulaDiceIconSvg(clean, 'w-5 h-5 text-amber-400'),
          title: `${title} (${clean})`,
          formula: clean,
          breakdown: breakdownStr,
          total: grandTotal,
          isCrit: false,
          critInfo: ''
        });
        showDiceTopToast({
          icon: toastIcon,
          title: title || 'Dice Roll',
          breakdown: breakdownStr,
          total: effectType === 'heal' ? `+${grandTotal}` : (unitLabel ? `${grandTotal} ${unitLabel}` : grandTotal),
          actions
        }, { replaceId: 'dice-roll-active-toast' });
      };

      if (window.Dice3D && typeof Dice3D.roll === 'function' && dice3dList.length > 0) {
        showDiceTopToast({
          icon: getFormulaDiceIconSvg(clean, 'w-6 h-6 text-amber-400') || '⚡',
          title: title || 'Dice Roll',
          breakdown: `Rolling dice... [${clean}]`,
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

    // Tome of Battle Maneuvers & Stances
    function renderManeuvers() {
      renderSpellsCockpit();

      if (!character.tomeOfBattle) character.tomeOfBattle = {};
      if (!Array.isArray(character.tomeOfBattle.readiedManeuvers)) character.tomeOfBattle.readiedManeuvers = [];
      if (!Array.isArray(character.tomeOfBattle.stancesKnown)) character.tomeOfBattle.stancesKnown = [];
      if (!Array.isArray(character.tomeOfBattle.maneuversKnown)) {
        character.tomeOfBattle.maneuversKnown = character.tomeOfBattle.readiedManeuvers.map(m => ({ ...m }));
      }

      const classesStatus = checkCharacterMagicClasses();
      const initInfo = getInitiatorInfo();

      if (!classesStatus.hasMartial) {
        const container = document.getElementById('maneuvers-container');
        if (container) {
          container.innerHTML = `
            <div class="col-span-full py-8 text-center text-slate-500 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800 space-y-2">
              <span class="text-2xl block">⚔️</span>
              <p>This character does not have a Martial Adept class (Warblade, Swordsage, Crusader).</p>
            </div>
          `;
        }
        const libTbody = document.getElementById('maneuvers-library-tbody');
        if (libTbody) {
          libTbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-500 text-xs italic bg-slate-950/40">This character does not have a Martial Adept class.</td></tr>`;
        }
        const stanceSelect = document.getElementById('active-stance-select');
        if (stanceSelect) stanceSelect.innerHTML = `<option value="">-- No Stance --</option>`;
        const stanceDiscBadge = document.getElementById('active-stance-discipline-badge');
        if (stanceDiscBadge) stanceDiscBadge.textContent = 'No Stance';
        const stanceBenefitEl = document.getElementById('active-stance-benefit-display');
        if (stanceBenefitEl) stanceBenefitEl.textContent = 'No active stance selected';
        return;
      }

      const maxReadied = initInfo.maxReadied || 3;
      const maxKnownManeuvers = initInfo.maxKnownManeuvers || 3;
      const maxKnownStances = initInfo.maxKnownStances || 1;

      // 1. Readied Maneuvers Deck Cards (Fixed slot count = maxReadied)
      const container = document.getElementById('maneuvers-container');
      if (container) {
        container.innerHTML = '';
        const readied = character.tomeOfBattle.readiedManeuvers;
        const totalCards = Math.max(maxReadied, readied.length);

        for (let slotIdx = 0; slotIdx < totalCards; slotIdx++) {
          const m = readied[slotIdx];
          const div = document.createElement('div');

          if (m) {
            const dmgExpr = m.damageDice || findDiceExpression(m.notes || m.benefit);
            div.className = `p-3.5 rounded-xl border flex flex-col justify-between transition-all shadow-md ${
              m.expended 
                ? 'bg-slate-950/70 border-slate-800 opacity-60' 
                : 'bg-gradient-to-br from-slate-900 to-rose-950/40 border-rose-500/50 hover:border-rose-400'
            }`;

            div.innerHTML = `
              <div class="space-y-1.5 mb-3">
                <div class="flex items-center justify-between gap-1">
                  <span class="badge ${m.expended ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-rose-950 text-rose-300 border-rose-700'} text-[10px] font-bold">
                    ${m.discipline || 'Iron Heart'} ${m.level || 1}
                  </span>
                  <span class="badge ${m.expended ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'} text-[10px] font-bold">
                    ${m.expended ? '🔄 Expended' : '⚡ Ready'}
                  </span>
                </div>
                <h4 class="text-xs font-black ${m.expended ? 'line-through text-slate-400' : 'text-white'}">${m.name}</h4>
                <div class="text-[10px] text-amber-300 font-semibold">${m.action || 'Standard Action'}</div>
                <p class="text-[11px] text-slate-300 line-clamp-2">${m.notes || m.benefit || '-'}</p>
              </div>

              <div class="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                ${m.expended ? `
                  <button onclick="useOrRecoverManeuver(${slotIdx})" class="flex-1 text-xs font-bold py-1 px-2.5 rounded-lg border transition shadow flex items-center justify-center gap-1.5 cursor-pointer bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-700" title="Recover Maneuver">
                    <span>🔄</span>
                    <span>Recover</span>
                  </button>
                ` : (dmgExpr ? `
                  <button onclick="useOrRecoverManeuver(${slotIdx})" class="flex-1 bg-amber-950/90 hover:bg-amber-800 text-amber-300 hover:text-white border border-amber-600/80 text-xs font-bold font-mono py-1 px-2.5 rounded-lg transition shadow flex items-center justify-center gap-1.5 cursor-pointer" title="Execute Maneuver & Roll Damage (${dmgExpr})">
                    ${getFormulaDiceIconSvg(dmgExpr, 'w-3.5 h-3.5 text-amber-400 shrink-0')}
                    <span>${dmgExpr}</span>
                  </button>
                ` : `
                  <button onclick="useOrRecoverManeuver(${slotIdx})" class="flex-1 bg-rose-950 hover:bg-rose-800 text-rose-200 hover:text-white border border-rose-600 text-xs font-bold py-1 px-2.5 rounded-lg transition shadow flex items-center justify-center gap-1.5 cursor-pointer" title="Execute Maneuver (Expend)">
                    <span>⚡</span>
                    <span>Use</span>
                  </button>
                `)}

                <button onclick="toggleManeuverReadied('${escape(m.name)}')" class="w-6 h-6 inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs rounded-lg border border-slate-700 transition cursor-pointer shrink-0" title="Unready Maneuver (Leaves Empty Slot)">
                  ✕
                </button>
              </div>
            `;
          } else {
            div.className = 'p-3.5 rounded-xl border border-dashed border-rose-500/40 bg-slate-950/40 hover:bg-rose-950/20 flex flex-col justify-between transition-all cursor-pointer group';
            div.onclick = (e) => {
              if (e.target.closest('button')) return;
              openManeuverPickerModal('Maneuver');
            };
            div.innerHTML = `
              <div class="space-y-1.5 mb-3">
                <div class="flex items-center justify-between gap-1">
                  <span class="badge bg-slate-900 text-slate-500 border border-slate-800 text-[10px] font-bold">Readied Slot #${slotIdx + 1}</span>
                  <span class="badge bg-slate-900 text-rose-300/70 border border-rose-900/50 text-[10px]">Empty Slot</span>
                </div>
                <h4 class="text-xs font-bold text-rose-300/80 group-hover:text-rose-200 italic">+ Ready Maneuver for Combat</h4>
                <p class="text-[11px] text-slate-500">Ready a maneuver from your known pool below or click to learn a new maneuver.</p>
              </div>
              <div class="pt-2 border-t border-slate-800/60 flex items-center justify-end">
                <button type="button" onclick="openManeuverPickerModal('Maneuver')" class="w-full bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-dashed border-rose-500/60 text-xs font-bold py-1 px-2.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer">
                  <span>⚔️</span>
                  <span>+ Select / Ready Maneuver</span>
                </button>
              </div>
            `;
          }
          container.appendChild(div);
        }
      }

      // Render Type Filter Pills
      const typeFilter = window._maneuverCurrentTypeFilter || 'all';
      const pillsEl = document.getElementById('maneuver-type-filter-pills');
      if (pillsEl) {
        const types = [
          { key: 'all', label: 'All' },
          { key: 'maneuver', label: '⚔️ Maneuvers' },
          { key: 'stance', label: '🥋 Stances' }
        ];
        pillsEl.innerHTML = types.map(t => `
          <button type="button" onclick="setManeuverTypeFilter('${t.key}')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
            typeFilter === t.key ? 'bg-rose-800 text-white border-rose-500 shadow' : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
          }">${t.label}</button>
        `).join('');
      }

      // 2. Maneuvers & Stances Library Table (Fixed quota rows + Right-aligned actions)
      const libTbody = document.getElementById('maneuvers-library-tbody');
      if (libTbody) {
        libTbody.innerHTML = '';
        const searchVal = (document.getElementById('maneuver-filter-search')?.value || '').toLowerCase().trim();
        const discVal = document.getElementById('maneuver-filter-discipline')?.value || 'all';
        const readiedNames = (character.tomeOfBattle.readiedManeuvers || []).map(m => (m.name || '').toLowerCase().trim());

        const maneuvers = character.tomeOfBattle.maneuversKnown || [];
        const stances = character.tomeOfBattle.stancesKnown || [];

        if (maneuvers.length === 0 && stances.length === 0) {
          libTbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-500 text-xs italic bg-slate-950/40">No known maneuvers or stances added yet.</td></tr>`;
          return;
        }

        const renderManeuverLibRow = (m) => {
          const isReadied = readiedNames.includes((m.name || '').toLowerCase().trim());
          const dmgExpr = m.damageDice || findDiceExpression(m.notes || m.benefit);
          const mLvl = Number(m.level) || 1;
          const isOverLevel = mLvl > initInfo.maxManeuverLvl;
          const theme = getSpellLevelTheme(mLvl);

          const tr = document.createElement('tr');
          tr.className = `transition border-l-4 ${theme.borderLeft} ${
            isOverLevel 
              ? 'opacity-40 grayscale-[35%] bg-slate-950/60' 
              : `hover:bg-slate-900/60 ${theme.rowBg}`
          }`;
          tr.innerHTML = `
            <td class="py-2.5 px-3 text-center align-middle">
              <span class="badge ${theme.badge} text-[10px] font-bold font-mono px-2 py-0.5">${mLvl}</span>
            </td>
            <td class="py-2.5 px-3 font-bold text-white align-middle">
              <div class="flex items-center gap-2 whitespace-nowrap">
                <span>⚔️</span>
                <span class="${isOverLevel ? 'text-slate-400' : 'text-white'}">${m.name}</span>
                ${isOverLevel ? `<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950/90 text-rose-300 border border-rose-800/80 font-bold shrink-0">IL Too Low (Max: ${initInfo.maxManeuverLvl})</span>` : ''}
              </div>
            </td>
            <td class="py-2.5 px-3 text-slate-300">
              <span class="badge bg-rose-950/60 text-rose-300 border border-rose-800/80 text-[10px] font-semibold">${m.discipline || 'Iron Heart'}</span>
            </td>
            <td class="py-2.5 px-3 text-center text-amber-300 text-[11px] whitespace-nowrap font-medium" title="${m.action || 'Standard Action'}">${formatActionShort(m.action)}</td>
            <td class="py-2.5 px-3 text-slate-300 text-[11px]">${m.notes || m.benefit || '-'}</td>
            <td class="py-2.5 px-3 text-right align-middle">
              <div class="flex items-center justify-end gap-2 w-full">
                ${dmgExpr ? `
                  <button onclick="rollSpellOrManeuverFormula('${dmgExpr}', '${m.name} Damage')" class="bg-amber-950/90 hover:bg-amber-800 text-amber-300 hover:text-white text-xs font-bold font-mono px-2 py-1 rounded-lg border border-amber-600/80 shadow transition inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap" title="Roll Damage Dice (${dmgExpr})">
                    ${getFormulaDiceIconSvg(dmgExpr, 'w-3.5 h-3.5 text-amber-400 shrink-0')}
                    <span>${dmgExpr}</span>
                  </button>
                ` : ''}
                ${isReadied ? `
                  <button onclick="toggleManeuverReadied('${escape(m.name)}')" class="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg transition shadow inline-flex items-center justify-center cursor-pointer whitespace-nowrap">
                    ✓ Readied
                  </button>
                ` : `
                  <button onclick="toggleManeuverReadied('${escape(m.name)}')" ${character.tomeOfBattle.readiedManeuvers.length >= maxReadied ? 'disabled' : ''} class="bg-slate-800 hover:bg-rose-900 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-600 text-xs font-bold px-2.5 py-1 rounded-lg transition shadow inline-flex items-center justify-center cursor-pointer whitespace-nowrap">
                    + Ready
                  </button>
                `}
                <button onclick="deleteManeuverFromLibrary('${escape(m.name)}', false)" class="w-6 h-6 inline-flex items-center justify-center text-slate-500 hover:text-rose-400 text-xs transition cursor-pointer shrink-0" title="Remove Maneuver (Leaves Empty Slot)">
                  🗑️
                </button>
              </div>
            </td>
          `;
          libTbody.appendChild(tr);
        };

        const renderEmptyManeuverLibRow = (slotNum) => {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-rose-950/20 transition cursor-pointer group bg-slate-950/20';
          tr.onclick = (e) => {
            if (e.target.closest('button')) return;
            openManeuverPickerModal('Maneuver');
          };
          tr.innerHTML = `
            <td class="py-2.5 px-3 text-rose-400/60 font-bold font-mono text-center">≤${initInfo.maxManeuverLvl}</td>
            <td class="py-2.5 px-3">
              <button type="button" onclick="openManeuverPickerModal('Maneuver')" class="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300/80 group-hover:text-rose-100 cursor-pointer">
                <span class="w-4 h-4 rounded border border-dashed border-rose-500/70 bg-rose-950/60 flex items-center justify-center text-[10px] text-rose-300 group-hover:bg-rose-800 transition">+</span>
                <span class="italic">+ Select Maneuver (Empty Slot #${slotNum})</span>
              </button>
            </td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">Maneuver</td>
            <td class="py-2.5 px-3 text-slate-500 text-[11px] italic">This maneuver slot is empty. Click to learn a maneuver up to Level ${initInfo.maxManeuverLvl}.</td>
            <td class="py-2.5 px-3 text-right align-middle">
              <div class="flex items-center justify-end gap-2 w-full">
                <button type="button" onclick="openManeuverPickerModal('Maneuver')" class="bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-dashed border-rose-500/80 text-xs font-bold px-2.5 py-1 rounded-lg transition shadow-sm inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap">
                  <span>⚔️</span>
                  <span>+ Select Maneuver</span>
                </button>
                <span class="w-6 h-6 shrink-0 inline-block"></span>
              </div>
            </td>
          `;
          libTbody.appendChild(tr);
        };

        const renderStanceLibRow = (st) => {
          const isActive = (character.activeStance || '').toLowerCase().trim() === (st.name || '').toLowerCase().trim();
          const dmgExpr = st.damageDice || findDiceExpression(st.benefit);
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-900/60 transition bg-slate-950/30';
          tr.innerHTML = `
            <td class="py-2.5 px-3 text-teal-400 font-bold font-mono text-center">${st.level || 1}</td>
            <td class="py-2.5 px-3 font-bold text-teal-300 align-middle">
              <div class="flex items-center gap-2 whitespace-nowrap">
                <span>🥋</span>
                <span>${st.name}</span>
              </div>
            </td>
            <td class="py-2.5 px-3 text-slate-300">
              <span class="badge bg-teal-950/60 text-teal-300 border border-teal-800/80 text-[10px] font-semibold">${st.discipline || 'Iron Heart'}</span>
            </td>
            <td class="py-2.5 px-3 text-center text-teal-300 text-[11px] whitespace-nowrap font-medium" title="Stance • Swift Action">Stance • Swift</td>
            <td class="py-2.5 px-3 text-slate-300 text-[11px]">${st.benefit || '-'}</td>
            <td class="py-2.5 px-3 text-right align-middle">
              <div class="flex items-center justify-end gap-2 w-full">
                ${dmgExpr ? `
                  <button onclick="rollSpellOrManeuverFormula('${dmgExpr}', '${st.name} Damage')" class="bg-amber-950/90 hover:bg-amber-800 text-amber-300 hover:text-white text-xs font-bold font-mono px-2 py-1 rounded-lg border border-amber-600/80 shadow transition inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap" title="Roll Stance Damage (${dmgExpr})">
                    ${getFormulaDiceIconSvg(dmgExpr, 'w-3.5 h-3.5 text-amber-400 shrink-0')}
                    <span>${dmgExpr}</span>
                  </button>
                ` : ''}
                ${isActive ? `
                  <span class="badge bg-teal-950 text-teal-300 border border-teal-600 text-xs font-bold px-2.5 py-1 whitespace-nowrap">
                    🥋 Active Stance
                  </span>
                ` : `
                  <button onclick="selectStanceDirectly('${escape(st.name)}')" class="bg-slate-800 hover:bg-teal-900 text-teal-300 border border-slate-700 hover:border-teal-600 text-xs font-bold px-2.5 py-1 rounded-lg transition shadow inline-flex items-center justify-center cursor-pointer whitespace-nowrap">
                    Enter Stance
                  </button>
                `}
                <button onclick="deleteManeuverFromLibrary('${escape(st.name)}', true)" class="w-6 h-6 inline-flex items-center justify-center text-slate-500 hover:text-rose-400 text-xs transition cursor-pointer shrink-0" title="Remove Stance (Leaves Empty Slot)">
                  🗑️
                </button>
              </div>
            </td>
          `;
          libTbody.appendChild(tr);
        };

        const renderEmptyStanceLibRow = (slotNum) => {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-teal-950/20 transition cursor-pointer group bg-slate-950/20';
          tr.onclick = (e) => {
            if (e.target.closest('button')) return;
            openManeuverPickerModal('Stance');
          };
          tr.innerHTML = `
            <td class="py-2.5 px-3 text-teal-400/60 font-bold font-mono text-center">≤${initInfo.maxManeuverLvl}</td>
            <td class="py-2.5 px-3">
              <button type="button" onclick="openManeuverPickerModal('Stance')" class="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300/80 group-hover:text-teal-100 cursor-pointer">
                <span class="w-4 h-4 rounded border border-dashed border-teal-500/70 bg-teal-950/60 flex items-center justify-center text-[10px] text-teal-300 group-hover:bg-teal-800 transition">+</span>
                <span class="italic">+ Select Stance (Empty Stance Slot #${slotNum})</span>
              </button>
            </td>
            <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
            <td class="py-2.5 px-3 text-teal-500/70 text-[10px] italic">Stance</td>
            <td class="py-2.5 px-3 text-slate-500 text-[11px] italic">This stance slot is empty. Click to learn a new martial stance.</td>
            <td class="py-2.5 px-3 text-right align-middle">
              <div class="flex items-center justify-end gap-2 w-full">
                <button type="button" onclick="openManeuverPickerModal('Stance')" class="bg-teal-950/80 hover:bg-teal-900 text-teal-300 hover:text-white border border-dashed border-teal-500/80 text-xs font-bold px-2.5 py-1 rounded-lg transition shadow-sm inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap">
                  <span>🥋</span>
                  <span>+ Select Stance</span>
                </button>
                <span class="w-6 h-6 shrink-0 inline-block"></span>
              </div>
            </td>
          `;
          libTbody.appendChild(tr);
        };

        const isFiltering = Boolean(searchVal || discVal !== 'all');

        if (typeFilter === 'all' || typeFilter === 'maneuver') {
          if (isFiltering) {
            maneuvers.filter(m => {
              if (discVal !== 'all' && (m.discipline || '').toLowerCase() !== discVal.toLowerCase()) return false;
              if (searchVal) {
                const str = `${m.name || ''} ${m.discipline || ''} ${m.notes || ''} ${m.benefit || ''}`.toLowerCase();
                if (!str.includes(searchVal)) return false;
              }
              return true;
            }).forEach(m => renderManeuverLibRow(m));
          } else {
            const totalMRows = Math.max(maxKnownManeuvers, maneuvers.length);
            for (let i = 0; i < totalMRows; i++) {
              if (i < maneuvers.length) renderManeuverLibRow(maneuvers[i]);
              else renderEmptyManeuverLibRow(i + 1);
            }
          }
        }

        if (typeFilter === 'all' || typeFilter === 'stance') {
          if (isFiltering) {
            stances.filter(st => {
              if (discVal !== 'all' && (st.discipline || '').toLowerCase() !== discVal.toLowerCase()) return false;
              if (searchVal) {
                const str = `${st.name || ''} ${st.discipline || ''} ${st.benefit || ''}`.toLowerCase();
                if (!str.includes(searchVal)) return false;
              }
              return true;
            }).forEach(st => renderStanceLibRow(st));
          } else {
            const totalSRows = Math.max(maxKnownStances, stances.length);
            for (let i = 0; i < totalSRows; i++) {
              if (i < stances.length) renderStanceLibRow(stances[i]);
              else renderEmptyStanceLibRow(i + 1);
            }
          }
        }
      }
    }

    function setManeuverTypeFilter(typeKey) {
      window._maneuverCurrentTypeFilter = typeKey;
      renderManeuvers();
    }

    function openManeuverPickerModal(type = 'Maneuver') {
      window._spellPickerTargetPool = 'martial';
      openSpellManeuverPickerModal(type, 'all');
    }

    function useOrRecoverManeuver(idx) {
      const m = character?.tomeOfBattle?.readiedManeuvers?.[idx];
      if (!m) return;
      if (m.expended) {
        m.expended = false;
        renderManeuvers();
        saveStateToStorage();
        showDiceTopToast({
          icon: '🔄',
          title: m.name,
          breakdown: 'Maneuver recovered and ready for use',
          total: 'Ready'
        });
      } else {
        m.expended = true;
        const dmgExpr = m.damageDice || findDiceExpression(m.notes || m.benefit);
        renderManeuvers();
        saveStateToStorage();
        if (dmgExpr) {
          rollSpellOrManeuverFormula(dmgExpr, `${m.name} (Maneuver Executed)`, m);
        } else {
          showDiceTopToast({
            icon: '⚡',
            title: m.name,
            breakdown: `${m.discipline || 'Martial'} maneuver executed`,
            total: 'Expended',
          });
        }
      }
    }

    function toggleManeuverExpended(idx) {
      useOrRecoverManeuver(idx);
    }

    function toggleManeuverReadied(escapedName) {
      const name = unescape(escapedName);
      const cleanName = (name || '').toLowerCase().trim();
      const readied = character.tomeOfBattle.readiedManeuvers || [];
      const existingIdx = readied.findIndex(m => (m.name || '').toLowerCase().trim() === cleanName);
      const { maxReadied } = getInitiatorInfo();

      if (existingIdx >= 0) {
        readied.splice(existingIdx, 1);
        showDiceTopToast({
          icon: '⚔️',
          title: 'Maneuver Unreadied',
          breakdown: `"${name}" unreadied from active deck (Slot left empty)`,
          total: '-1 Readied'
        });
      } else {
        if (readied.length >= maxReadied) {
          alert(`⚠️ Your maximum readied maneuver quota is full (${maxReadied}/${maxReadied}). Unready a maneuver first.`);
          return;
        }
        const knownItem = (character.tomeOfBattle.maneuversKnown || []).find(m => (m.name || '').toLowerCase().trim() === cleanName);
        if (knownItem) {
          readied.push({ ...knownItem, expended: false });
          showDiceTopToast({
            icon: '⚡',
            title: 'Maneuver Readied',
            breakdown: `"${name}" readied into your active combat deck`,
            total: '+1 Readied'
          });
        }
      }

      if (typeof syncAutomatedCombatPins === 'function') syncAutomatedCombatPins(character);
      saveStateToStorage(true);
      renderManeuvers();
    }

    function recoverAllManeuvers() {
      (character?.tomeOfBattle?.readiedManeuvers || []).forEach(m => m.expended = false);
      if (character) character.lastModified = new Date().toISOString();
      renderManeuvers();
      saveStateToStorage(true);
      if (window.CloudSync && typeof window.CloudSync.pushImmediate === 'function') {
        window.CloudSync.pushImmediate();
      } else if (window.GDriveSync && typeof window.GDriveSync.pushToCloud === 'function') {
        window.GDriveSync.pushToCloud(true);
      }
      showDiceTopToast({
        icon: '⚔️',
        title: 'Maneuvers Recovered',
        breakdown: 'All Tome of Battle maneuvers recovered (Swift Action Recover)',
        total: 'Recovered'
      });
    }

    function onStanceChange() {
      const selectEl = document.getElementById('active-stance-select');
      if (selectEl) {
        character.activeStance = selectEl.value;
      }
      if (typeof syncAutomatedCombatPins === 'function') syncAutomatedCombatPins(character);
      recalculateOffense();
      renderSpellsCockpit();
      renderManeuvers();
      saveStateToStorage();
    }

    function selectStanceDirectly(escapedName) {
      const name = unescape(escapedName);
      character.activeStance = name;
      if (typeof syncAutomatedCombatPins === 'function') syncAutomatedCombatPins(character);
      recalculateOffense();
      renderSpellsCockpit();
      renderManeuvers();
      saveStateToStorage();
      showDiceTopToast({
        icon: '🥋',
        title: 'Stance Changed',
        breakdown: `"${name}" is now your active martial stance`,
        total: 'Active'
      });
    }

    function deleteManeuverFromLibrary(escapedName, isStance) {
      const name = unescape(escapedName);
      const cleanName = (name || '').toLowerCase().trim();

      if (isStance) {
        const idx = (character.tomeOfBattle?.stancesKnown || []).findIndex(st => (st.name || '').toLowerCase().trim() === cleanName);
        if (idx >= 0) {
          character.tomeOfBattle.stancesKnown.splice(idx, 1);
          if (character.activeStance === name) character.activeStance = 'None';
        }
      } else {
        const idx = (character.tomeOfBattle?.maneuversKnown || []).findIndex(m => (m.name || '').toLowerCase().trim() === cleanName);
        if (idx >= 0) {
          character.tomeOfBattle.maneuversKnown.splice(idx, 1);
        }
        const rIdx = (character.tomeOfBattle?.readiedManeuvers || []).findIndex(m => (m.name || '').toLowerCase().trim() === cleanName);
        if (rIdx >= 0) {
          character.tomeOfBattle.readiedManeuvers.splice(rIdx, 1);
        }
      }

      if (typeof syncAutomatedCombatPins === 'function') syncAutomatedCombatPins(character);
      saveStateToStorage(true);
      renderManeuvers();
      showDiceTopToast({
        icon: '🗑️',
        title: 'Ability Removed',
        breakdown: `"${name}" removed. Slot left empty.`,
        total: 'Slot Empty'
      });
    }

    function getSpellsKnownQuota(lvl) {
      const numLvl = Number(lvl) || 0;
      const knownCount = (character?.spellcasting?.knownSpells || []).filter(s => Number(s.level || 0) === numLvl).length;
      const { cl, hasClass, primaryClass } = getCasterInfo();
      const slot = character?.spellcasting?.slots?.find(s => Number(s.level) === numLvl);

      if (!hasClass || Number(cl) <= 0) {
        if (slot && (Number(slot.dmBonus) || 0) > 0) {
          return Math.max(Number(slot.dmBonus) || 0, knownCount);
        }
        return Math.max(0, knownCount);
      }

      if (slot && typeof slot.known === 'number' && slot.known > 0) {
        return slot.known;
      }
      if (slot && Number(slot.daily) > 0) {
        return Math.max(1, Number(slot.daily) || 1);
      }

      const casterLvl = Math.min(20, Math.max(1, Number(cl) || 1));

      const sorcKnownTable = [
        [],
        [4, 2],
        [5, 2],
        [5, 3],
        [6, 3, 1],
        [6, 4, 2],
        [7, 4, 2, 1],
        [7, 5, 3, 2],
        [8, 5, 3, 2, 1],
        [8, 5, 4, 3, 2],
        [9, 5, 4, 3, 2, 1],
        [9, 5, 5, 3, 2, 2],
        [9, 5, 5, 4, 3, 2, 1],
        [9, 5, 5, 4, 3, 2, 2],
        [9, 5, 5, 4, 4, 3, 2, 1],
        [9, 5, 5, 4, 4, 3, 2, 2],
        [9, 5, 5, 4, 4, 3, 3, 2, 1],
        [9, 5, 5, 4, 4, 3, 3, 2, 2],
        [9, 5, 5, 4, 4, 3, 3, 3, 2, 1],
        [9, 5, 5, 4, 4, 3, 3, 3, 3, 2],
        [9, 5, 5, 4, 4, 3, 3, 3, 3, 3]
      ];

      const bardKnownTable = [
        [],
        [4],
        [5, 2],
        [6, 3],
        [6, 3, 2],
        [6, 4, 3],
        [6, 4, 3],
        [6, 4, 4, 2],
        [6, 4, 4, 3],
        [6, 4, 4, 3],
        [6, 4, 4, 4, 2],
        [6, 4, 4, 4, 3],
        [6, 4, 4, 4, 3],
        [6, 4, 4, 4, 4, 2],
        [6, 4, 4, 4, 4, 3],
        [6, 4, 4, 4, 4, 3],
        [6, 4, 4, 4, 4, 4, 2],
        [6, 4, 4, 4, 4, 4, 3],
        [6, 4, 4, 4, 4, 4, 3],
        [6, 4, 4, 4, 4, 4, 4],
        [6, 4, 4, 4, 4, 4, 4]
      ];

      const cls = (primaryClass || '').toLowerCase();
      const table = cls.includes('bard') ? bardKnownTable : sorcKnownTable;
      const row = table[casterLvl];
      if (row && typeof row[numLvl] === 'number') {
        return row[numLvl];
      }

      return Math.max(0, knownCount);
    }

    // Known Spells
    function renderKnownSpells() {
      renderSpellsCockpit();

      const tbody = document.getElementById('known-spells-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      const searchVal = (document.getElementById('spell-filter-search')?.value || '').toLowerCase().trim();
      const schoolVal = document.getElementById('spell-filter-school')?.value || 'all';
      const lvlFilter = window._spellCurrentFilterLevel || 'all';

      const classesStatus = checkCharacterMagicClasses();
      let spells = character?.spellcasting?.knownSpells || [];
      if (spells.length === 0 && Array.isArray(character?.spells) && character.spells.length > 0) {
        spells = character.spells;
        if (character?.spellcasting) character.spellcasting.knownSpells = spells;
      }

      if (!character.spellcasting) character.spellcasting = {};
      if (!Array.isArray(character.spellcasting.knownSpells)) character.spellcasting.knownSpells = [];

      const { cl: spontCl, hasClass: hasSpontClass } = getCasterInfo();
      const slotLevels = (character?.spellcasting?.slots || [])
        .filter(s => (Number(s.daily) || 0) > 0 || (Number(s.dmBonus) || 0) > 0)
        .map(s => Number(s.level));
      const knownLevels = spells.map(s => Number(s.level));
      const allLevelsSet = new Set([...slotLevels, ...knownLevels]);
      if (allLevelsSet.size === 0 && hasSpontClass && spontCl > 0) {
        const maxSpontLvl = Math.min(9, Math.floor(spontCl / 2) + 1);
        for (let i = 0; i <= maxSpontLvl; i++) {
          if (getSpellsKnownQuota(i) > 0) allLevelsSet.add(i);
        }
      }
      const allLevels = Array.from(allLevelsSet).sort((a, b) => a - b);

      const pillsContainer = document.getElementById('spell-level-filter-pills');
      if (pillsContainer) {
        const levelsArr = ['all', ...allLevels];
        let pillsHtml = '';
        levelsArr.forEach(lvl => {
          const isActive = String(lvlFilter) === String(lvl);
          const label = lvl === 'all' ? 'All' : (lvl === 0 ? 'Level 0' : `Level ${lvl}`);
          pillsHtml += `
            <button type="button" onclick="setSpellFilterLevel('${lvl}')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              isActive 
                ? 'bg-purple-800 text-white border-purple-500 shadow' 
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
            }">
              ${label}
            </button>
          `;
        });
        pillsContainer.innerHTML = pillsHtml;
      }

      const displayLevels = lvlFilter === 'all' ? allLevels : [Number(lvlFilter)];
      let totalRendered = 0;

      displayLevels.forEach(lvl => {
        const spellsAtLvl = [];
        spells.forEach((s, idx) => {
          if (Number(s.level || 0) === lvl) {
            spellsAtLvl.push({ s, idx });
          }
        });

        const slotObj = (character?.spellcasting?.slots || []).find(sl => Number(sl.level) === lvl);
        const remainingSlots = slotObj ? Math.max(0, (slotObj.daily || 0) - (slotObj.used || 0)) : 0;
        const totalDaily = slotObj ? (slotObj.daily || 0) : 0;
        const hasActiveSlot = remainingSlots > 0;
        const theme = getSpellLevelTheme(lvl);
        const dc = getSpellDc(lvl);

        // Seviye Renk Geçiş Başlığı (Level Section Divider)
        if (lvlFilter === 'all') {
          const divTr = document.createElement('tr');
          divTr.className = `bg-gradient-to-r ${theme.headerGradient} border-y ${theme.border} text-xs font-black select-none`;
          divTr.innerHTML = `
            <td colspan="8" class="py-2 px-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full ${theme.dot}"></span>
                  <span class="${theme.text} uppercase tracking-wider font-extrabold text-[11px]">${lvl === 0 ? 'Level 0 (Cantrips)' : `Level ${lvl} Spells`}</span>
                  <span class="text-[10px] text-slate-400 font-normal">DC ${dc}</span>
                </div>
                <div class="flex items-center gap-2 text-[10px]">
                  <span class="${hasActiveSlot ? theme.slotBadgeActive : 'bg-slate-900 text-rose-400 border border-rose-900/60'} px-2 py-0.5 rounded font-mono font-bold">
                    ${totalDaily > 0 ? (hasActiveSlot ? `⚡ ${remainingSlots}/${totalDaily} Slots Ready` : `0/${totalDaily} Slots (Expended)`) : '🔒 No Slots (0/0)'}
                  </span>
                </div>
              </div>
            </td>
          `;
          tbody.appendChild(divTr);
        }

        if (searchVal || schoolVal !== 'all') {
          const matching = spellsAtLvl.filter(({ s }) => {
            if (schoolVal !== 'all') {
              if ((s.school || '').toLowerCase() !== schoolVal.toLowerCase()) return false;
            }
            if (searchVal) {
              const name = (s.name || '').toLowerCase();
              const benefit = (s.benefit || '').toLowerCase();
              const school = (s.school || '').toLowerCase();
              if (!name.includes(searchVal) && !benefit.includes(searchVal) && !school.includes(searchVal)) return false;
            }
            return true;
          });

          matching.forEach(({ s, idx }) => {
            totalRendered++;
            renderSpellRow(s, idx, lvl);
          });
        } else {
          const quota = getSpellsKnownQuota(lvl);
          const totalRows = Math.max(quota, spellsAtLvl.length);

          for (let slotIdx = 0; slotIdx < totalRows; slotIdx++) {
            totalRendered++;
            if (slotIdx < spellsAtLvl.length) {
              const { s, idx } = spellsAtLvl[slotIdx];
              renderSpellRow(s, idx, lvl);
            } else {
              renderEmptySpellSlotRow(lvl, slotIdx + 1);
            }
          }
        }
      });

      if (totalRendered === 0) {
        const emptyMsg = (!hasSpontClass && spontCl <= 0)
          ? 'No spontaneous spellcasting class levels (Sorcerer, Bard, Warlock, etc.). Select your active spellcasting discipline tab above.'
          : 'No spells match the current filters.';
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="py-8 text-center text-slate-400">
              <div class="text-2xl mb-1">📜</div>
              <p class="text-xs">${emptyMsg}</p>
            </td>
          </tr>
        `;
      }

      function renderSpellRow(s, originalIdx, lvl) {
        const dc = getSpellDc(s.level !== undefined ? s.level : lvl);
        const dmgExpr = s.damageDice || findDiceExpression(s.benefit);
        const slotObj = (character?.spellcasting?.slots || []).find(sl => Number(sl.level) === lvl);
        const remainingSlots = slotObj ? Math.max(0, (slotObj.daily || 0) - (slotObj.used || 0)) : 0;
        const hasActiveSlot = remainingSlots > 0;
        const theme = getSpellLevelTheme(lvl);

        const dbItem = typeof findMasterItem === 'function' ? findMasterItem(s.name) : null;
        const attackType = s.attackType || dbItem?.attackType || '';
        const isTouchAttack = (attackType === 'ranged_touch' || attackType === 'melee_touch');
        const isRangedTouch = attackType === 'ranged_touch';
        const bab = Number(character.bab) || 0;
        const dexMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod) ? RuleEngine.getAbilityMod(character.abilities?.dex || 10) : Math.floor(((character?.abilities?.dex || 10) - 10) / 2);
        const strMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod) ? RuleEngine.getAbilityMod(character.abilities?.str || 10) : Math.floor(((character?.abilities?.str || 10) - 10) / 2);
        const touchAtkBonus = isRangedTouch ? (bab + dexMod) : (bab + strMod);

        const tr = document.createElement('tr');
        tr.className = `transition border-l-4 ${theme.borderLeft} ${
          hasActiveSlot ? `hover:bg-slate-900/70 ${theme.rowBg}` : 'opacity-40 grayscale-[35%] bg-slate-950/60'
        }`;
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-center align-middle">
            <span class="badge ${theme.badge} text-[10px] font-bold font-mono px-2 py-0.5">${lvl === 0 ? '0' : lvl}</span>
          </td>
          <td class="py-2.5 px-3 font-bold text-white align-middle">
            <div class="flex items-center gap-2 whitespace-nowrap">
              ${getUniversalPinButtonHtml({ name: s.name, type: 'Spell', action: s.action || 'Standard', desc: s.benefit || '', badge: dmgExpr || '', damageDice: dmgExpr || '' })}
              <span>🔮</span>
              <span class="${hasActiveSlot ? 'text-white' : 'text-slate-400'}">${s.name}</span>
              ${!hasActiveSlot ? `<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950/90 text-rose-300 border border-rose-800/80 font-bold shrink-0">0 Slot</span>` : ''}
            </div>
          </td>
          <td class="py-2.5 px-3 text-slate-300">
            <span class="badge bg-purple-950/60 text-purple-300 border border-purple-800/80 text-[10px] font-semibold">${s.school || 'Universal'}</span>
            </td>
          <td class="py-2.5 px-3 text-center text-amber-300 text-[11px] whitespace-nowrap font-medium" title="${s.action || 'Standard Action'}">${formatActionShort(s.action)}</td>
          <td class="py-2.5 px-3 text-slate-300 text-[11px]">${s.range || '-'}</td>
          <td class="py-2.5 px-3 text-center">
            <span class="badge bg-slate-900 text-emerald-300 border border-emerald-700/60 font-mono text-[11px] font-bold">DC ${dc}</span>
          </td>
          <td class="py-2.5 px-3 text-slate-300 text-[11px]">${s.benefit || '-'}</td>
          <td class="py-2.5 px-3 text-right align-middle">
            <div class="flex items-center justify-end gap-2 w-full">
              ${isTouchAttack ? `
                <button type="button" onclick="rollSpellTouchAttack(${originalIdx})" class="bg-amber-950/90 hover:bg-amber-800 text-amber-300 hover:text-white border border-amber-600/80 text-xs font-bold font-mono px-2 py-1 rounded-lg transition inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shadow" title="Roll ${isRangedTouch ? 'Ranged' : 'Melee'} Touch Attack (BAB + ${isRangedTouch ? 'DEX' : 'STR'})">
                  <span>⚡</span>
                  <span>Touch ${touchAtkBonus >= 0 ? '+' : ''}${touchAtkBonus}</span>
                </button>
              ` : ''}
              ${dmgExpr ? `
                <button onclick="castSpellDirectly(${originalIdx})" class="${
                  hasActiveSlot 
                    ? 'bg-amber-950/90 hover:bg-amber-800 text-amber-300 hover:text-white border-amber-600/80 cursor-pointer shadow' 
                    : 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                } text-xs font-bold font-mono px-2.5 py-1 rounded-lg border transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap" title="${
                  hasActiveSlot ? `Cast Spell & Roll Damage (${dmgExpr})` : '⚠️ No active spell slots remaining (0 Left)'
                }">
                  ${getFormulaDiceIconSvg(dmgExpr, 'w-3.5 h-3.5 text-amber-400 shrink-0')}
                  <span>${dmgExpr}</span>
                </button>
              ` : `
                <button onclick="castSpellDirectly(${originalIdx})" class="${
                  hasActiveSlot 
                    ? 'bg-purple-900/70 hover:bg-purple-600 text-white border-purple-500 cursor-pointer shadow' 
                    : 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                  } text-xs font-bold px-2.5 py-1 rounded-lg border transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap" title="${
                    hasActiveSlot ? 'Cast Spell (Spend Slot)' : '⚠️ No active spell slots remaining (0 Left)'
                  }">
                    <span>🔮</span>
                    <span>Cast</span>
                  </button>
              `}
              <button onclick="deleteKnownSpell(${originalIdx})" class="w-6 h-6 inline-flex items-center justify-center text-slate-500 hover:text-rose-400 text-xs transition cursor-pointer shrink-0" title="Unprepare / Remove Spell (Leaves Empty Slot)">
                🗑️
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      }

      function renderEmptySpellSlotRow(lvl, slotNumber) {
        const dc = getSpellDc(lvl);
        const slotObj = (character?.spellcasting?.slots || []).find(sl => Number(sl.level) === lvl);
        const remainingSlots = slotObj ? Math.max(0, (slotObj.daily || 0) - (slotObj.used || 0)) : 0;
        const hasActiveSlot = remainingSlots > 0;
        const theme = getSpellLevelTheme(lvl);

        const tr = document.createElement('tr');
        tr.className = `transition cursor-pointer group border-l-4 ${theme.borderLeft} ${
          hasActiveSlot ? 'hover:bg-purple-950/25 bg-slate-950/20' : 'opacity-40 grayscale-[35%] bg-slate-950/60'
        }`;
        tr.onclick = (e) => {
          if (e.target.closest('button')) return;
          openSpellPickerForSpecificLevel(lvl);
        };
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-center align-middle">
            <span class="badge ${theme.badge} opacity-60 text-[10px] font-bold font-mono px-2 py-0.5">${lvl === 0 ? '0' : lvl}</span>
          </td>
          <td class="py-2.5 px-3">
            <button type="button" onclick="openSpellPickerForSpecificLevel(${lvl})" class="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300/80 group-hover:text-purple-100 cursor-pointer">
              <span class="w-4 h-4 rounded border border-dashed border-purple-500/70 bg-purple-950/60 flex items-center justify-center text-[10px] text-purple-300 group-hover:bg-purple-800 transition">+</span>
              <span class="italic">+ Select Spell (Empty Slot)</span>
            </button>
          </td>
          <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
          <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
          <td class="py-2.5 px-3 text-slate-500 text-[10px] italic">-</td>
          <td class="py-2.5 px-3 text-center">
            <span class="badge bg-slate-900/60 text-slate-500 border border-slate-800/80 font-mono text-[10px]">DC ${dc}</span>
          </td>
          <td class="py-2.5 px-3 text-slate-500 text-[11px] italic">This spell slot is empty. Click to learn a ${lvl === 0 ? 'Level 0 (Cantrip)' : `Level ${lvl}`} spell.</td>
          <td class="py-2.5 px-3 text-right align-middle">
            <div class="flex items-center justify-end gap-2 w-full">
              <button type="button" onclick="openSpellPickerForSpecificLevel(${lvl})" class="bg-purple-950/80 hover:bg-purple-900 text-purple-300 hover:text-white border border-dashed border-purple-500/80 text-xs font-bold px-2.5 py-1 rounded-lg transition shadow-sm inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap" title="Select Level ${lvl} Spell">
                <span>🔮</span>
                <span>+ Select Spell</span>
              </button>
              <span class="w-6 h-6 shrink-0 inline-block"></span>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      }
    }

    function setSpellFilterLevel(lvl) {
      window._spellCurrentFilterLevel = lvl;
      renderKnownSpells();
    }

    function deleteKnownSpell(idx) {
      if (!character?.spellcasting?.knownSpells?.[idx]) return;
      const s = character.spellcasting.knownSpells[idx];
      character.spellcasting.knownSpells.splice(idx, 1);
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '🗑️',
        title: 'Spell Removed',
        breakdown: `"${s.name}" removed. Slot left empty.`,
        total: 'Slot Empty'
      });
    }

    function castSpellDirectly(spellIdx) {
      const s = character?.spellcasting?.knownSpells?.[spellIdx];
      if (!s) return;
      const name = s.name;
      const lvl = Number(s.level) || 0;
      const { cl } = getCasterInfo();
      const dmgExpr = resolveSpellEffectiveFormula(s, cl);

      const slot = character.spellcasting?.slots?.find(sl => sl.level === lvl);
      if (!slot || slot.used >= slot.daily) {
        showDiceTopToast({
          icon: '\u26A0\uFE0F',
          title: 'No Slots Remaining',
          breakdown: `No Level ${lvl} spell slots remaining!`,
          total: '0 Slots'
        });
        return;
      }

      const preCast = getSpellPreCastOptions(s, cl, slot, lvl);
      if (preCast && Array.isArray(preCast.options) && preCast.options.length > 0) {
        showSpellPreCastChoiceToast(preCast);
        return;
      }

      if (slot && slot.used < slot.daily) {
        slot.used++;
        saveStateToStorage(true);
        renderAll();

        if (handleBuffSpellCast(s, cl, `Level ${lvl} Spontaneous Slot Expended`, '🔮')) {
          return;
        }

        const dbItem = typeof findMasterItem === 'function' ? findMasterItem(name) : null;
        const attackType = s.attackType || dbItem?.attackType || '';
        const isTouchAttack = (attackType === 'ranged_touch' || attackType === 'melee_touch');

        if (isTouchAttack) {
          rollSpellTouchAttack(s);
        } else if (dmgExpr) {
          rollSpellOrManeuverFormula(dmgExpr, `${name} (Level ${lvl} • -1 Slot)`, s);
        } else {
          showDiceTopToast({
            icon: '🔮',
            title: name,
            breakdown: `Level ${lvl} Spell Slot Expended`,
            total: `-1 Slot`,
          });
        }
      } else {
        showDiceTopToast({
          icon: '⚠️',
          title: 'No Slots Remaining',
          breakdown: `No Level ${lvl} spell slots remaining!`,
          total: '0 Slots'
        });
      }
    }

    // ====================================================
    // MODAL: ADD SPELL / MANEUVER / STANCE PICKER LOGIC
    // ====================================================
    function openSpellManeuverPickerModal(initialType = 'Spell', preselectLevel = null) {
      if (!window._spellPickerTargetPool && window._currentMagicDiscipline && ['spontaneous', 'prepared', 'divine'].includes(window._currentMagicDiscipline)) {
        window._spellPickerTargetPool = window._currentMagicDiscipline;
      }
      window._spellPickerModalMode = (initialType === 'Maneuver' || initialType === 'Stance') ? 'martial' : 'spell';
      setSpellPickerType(initialType);
      const sourceSelect = document.getElementById('spell-picker-source-filter');
      if (sourceSelect) {
        if (initialType === 'Spell' && window._spellPickerTargetPool === 'divine' && window._spellPickerIsDomainSlot) {
          const chosenDomains = typeof getCharacterClericDomains === 'function' ? getCharacterClericDomains(character) : [];
          sourceSelect.value = chosenDomains.length > 0 ? 'char_domains' : 'domain';
        } else {
          sourceSelect.value = 'auto';
        }
      }
      if (preselectLevel !== null && preselectLevel !== undefined) {
        const levelSelect = document.getElementById('spell-picker-level-filter');
        if (levelSelect) {
          levelSelect.value = String(preselectLevel);
        }
        const searchInput = document.getElementById('spell-picker-search');
        if (searchInput) {
          searchInput.value = '';
        }
      }
      renderSpellPickerResults();
      const modal = document.getElementById('spell-maneuver-modal');
      if (modal) modal.classList.remove('hidden');

      if (window.SrdCompendium && typeof window.SrdCompendium.ensureChunkLoaded === 'function') {
        Promise.all([
          window.SrdCompendium.ensureChunkLoaded('srd_spells.json'),
          window.SrdCompendium.ensureChunkLoaded('srd_maneuvers.json')
        ]).then(() => {
          renderSpellPickerResults();
        }).catch(() => {});
      }
    }

    function openSpellPickerForSpecificLevel(lvl) {
      window._spellPickerTargetPool = 'spontaneous';
      window._spellPickerIsDomainSlot = false;
      openSpellManeuverPickerModal('Spell', lvl);
    }

    function closeSpellManeuverPickerModal() {
      const modal = document.getElementById('spell-maneuver-modal');
      if (modal) modal.classList.add('hidden');
      window._spellPickerIsDomainSlot = false;
    }

    function getSpellPickerCategoryPalette(type = null, targetPool = null, effectiveSource = null) {
      const t = type || window._currentSpellPickerType || 'Spell';
      const pool = targetPool || window._spellPickerTargetPool || 'spontaneous';
      const src = effectiveSource || (document.getElementById('spell-picker-source-filter')?.value || 'auto');

      if (t === 'Maneuver' || t === 'Stance') {
        return {
          key: 'martial',
          icon: t === 'Maneuver' ? '\u2694\uFE0F' : '\uD83E\uDD4B',
          modalBorder: 'border-rose-500/80',
          headerIconBox: 'bg-rose-950/80 border-rose-600/50 text-rose-300',
          rawBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          activeTab: 'bg-rose-800 text-white border-rose-500 shadow',
          focusBorder: 'focus:border-rose-500',
          lvlBadge: 'bg-rose-950 text-rose-300 border-rose-700',
          addBtn: 'bg-rose-700 hover:bg-rose-600 text-white border-rose-500',
          aiBtn: 'bg-rose-900/60 hover:bg-rose-700 text-rose-200 hover:text-white border-rose-600/50'
        };
      }

      if (pool === 'prepared') {
        return {
          key: 'prepared',
          icon: '\uD83D\uDCD6',
          modalBorder: 'border-cyan-500/80',
          headerIconBox: 'bg-cyan-950/80 border-cyan-600/50 text-cyan-300',
          rawBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          activeTab: 'bg-cyan-800 text-white border-cyan-500 shadow',
          focusBorder: 'focus:border-cyan-500',
          lvlBadge: 'bg-cyan-950 text-cyan-300 border-cyan-700',
          addBtn: 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-500',
          aiBtn: 'bg-cyan-900/60 hover:bg-cyan-700 text-cyan-200 hover:text-white border-cyan-600/50'
        };
      }

      if (pool === 'divine') {
        const isDomain = Boolean(window._spellPickerIsDomainSlot || src === 'char_domains' || src === 'domain');
        if (isDomain) {
          return {
            key: 'divine_domain',
            icon: '\u269C\uFE0F',
            modalBorder: 'border-yellow-500/80',
            headerIconBox: 'bg-yellow-950/80 border-yellow-500/60 text-yellow-300',
            rawBadge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
            activeTab: 'bg-yellow-700 text-white border-yellow-400 shadow',
            focusBorder: 'focus:border-yellow-500',
            lvlBadge: 'bg-yellow-950 text-yellow-300 border-yellow-600',
            addBtn: 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-extrabold border-yellow-400',
            aiBtn: 'bg-yellow-900/60 hover:bg-yellow-700 text-yellow-200 hover:text-white border-yellow-600/50'
          };
        }
        return {
          key: 'divine',
          icon: '\u2728',
          modalBorder: 'border-amber-500/80',
          headerIconBox: 'bg-amber-950/80 border-amber-600/50 text-amber-300',
          rawBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          activeTab: 'bg-amber-800 text-white border-amber-500 shadow',
          focusBorder: 'focus:border-amber-500',
          lvlBadge: 'bg-amber-950 text-amber-300 border-amber-700',
          addBtn: 'bg-amber-700 hover:bg-amber-600 text-white border-amber-500',
          aiBtn: 'bg-amber-900/60 hover:bg-amber-700 text-amber-200 hover:text-white border-amber-600/50'
        };
      }

      return {
        key: 'spontaneous',
        icon: '\uD83D\uDD2E',
        modalBorder: 'border-purple-500/80',
        headerIconBox: 'bg-purple-950/80 border-purple-600/50 text-purple-300',
        rawBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        activeTab: 'bg-purple-800 text-white border-purple-500 shadow',
        focusBorder: 'focus:border-purple-500',
        lvlBadge: 'bg-purple-950 text-purple-300 border-purple-700',
        addBtn: 'bg-purple-700 hover:bg-purple-600 text-white border-purple-500',
        aiBtn: 'bg-purple-900/60 hover:bg-purple-700 text-purple-200 hover:text-white border-purple-600/50'
      };
    }

    function applySpellPickerModalTheme(palette) {
      if (!palette) return;
      const type = window._currentSpellPickerType || 'Spell';

      const modalCard = document.getElementById('spell-picker-modal-card');
      if (modalCard) {
        modalCard.className = `bg-dndCard border ${palette.modalBorder} rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col`;
      }

      const headerIcon = document.getElementById('spell-picker-header-icon');
      if (headerIcon) {
        headerIcon.textContent = palette.icon;
        headerIcon.className = `w-8 h-8 rounded-lg ${palette.headerIconBox} border flex items-center justify-center text-lg shadow-inner`;
      }

      const rawBadge = document.getElementById('spell-picker-raw-badge');
      if (rawBadge) {
        rawBadge.className = `text-[10px] font-semibold ${palette.rawBadge} border px-2 py-0.5 rounded-full`;
      }

      const titleTextEl = document.getElementById('spell-picker-modal-title-text');
      if (titleTextEl) {
        if (type === 'Maneuver' || type === 'Stance') {
          titleTextEl.textContent = 'Add Martial Maneuver or Stance';
        } else if (palette.key === 'divine_domain') {
          titleTextEl.textContent = 'Prepare Cleric Domain Spell';
        } else if (palette.key === 'divine') {
          titleTextEl.textContent = 'Prepare Divine Spell';
        } else if (palette.key === 'prepared') {
          titleTextEl.textContent = 'Add Prepared / Spellbook Spell';
        } else {
          titleTextEl.textContent = 'Add Spontaneous Spell';
        }
      }

      const modalMode = window._spellPickerModalMode || (type === 'Spell' ? 'spell' : 'martial');
      ['Spell', 'Maneuver', 'Stance'].forEach(t => {
        const btn = document.getElementById(`spell-picker-tab-${t.toLowerCase()}`);
        if (btn) {
          // Hide Maneuver/Stance tabs when opened for Spells, and hide Spell tab when opened for Martial
          if (modalMode === 'spell' && t !== 'Spell') {
            btn.style.display = 'none';
          } else if (modalMode === 'martial' && t === 'Spell') {
            btn.style.display = 'none';
          } else {
            btn.style.display = '';
          }
          if (t === type) {
            btn.className = `px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${palette.activeTab}`;
          } else {
            btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer bg-slate-800 text-slate-300 border-slate-700 hover:text-white';
          }
        }
      });

      const spellTabBtn = document.getElementById('spell-picker-tab-spell');
      if (spellTabBtn) {
        spellTabBtn.innerHTML = `${type === 'Spell' ? palette.icon : '\uD83D\uDD2E'} Spell`;
      }

      ['spell-picker-search', 'spell-picker-source-filter', 'spell-picker-level-filter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.className = el.className.replace(/focus:border-[a-z]+-\d+/g, palette.focusBorder);
        }
      });

      const aiBtn = document.getElementById('spell-picker-ai-btn');
      if (aiBtn) {
        aiBtn.className = `${palette.aiBtn} px-2.5 py-1 rounded-lg border font-bold transition flex items-center gap-1 cursor-pointer`;
      }
    }

    function setSpellPickerType(type) {
      window._currentSpellPickerType = type;
      const palette = getSpellPickerCategoryPalette(type);
      applySpellPickerModalTheme(palette);

      const sourceFilter = document.getElementById('spell-picker-source-filter');
      if (sourceFilter) {
        sourceFilter.style.display = 'block';
        if (type === 'Spell') {
          if (sourceFilter.dataset.mode !== 'spell') {
            sourceFilter.dataset.mode = 'spell';
            sourceFilter.innerHTML = `
              <option value="auto">🎯 Auto (Match Character Class)</option>
              <option value="cleric">✝️ Cleric Spells</option>
              <option value="char_domains">⚜️ My Selected Domains</option>
              <option value="domain">⚜️ All Cleric Domains</option>
              <option value="druid">🌿 Druid Spells</option>
              <option value="paladin">🛡️ Paladin Spells</option>
              <option value="ranger">🏹 Ranger Spells</option>
              <option value="divine">🔮 All Divine Classes</option>
              <option value="sor_wiz">⚡ Sorcerer / Wizard</option>
              <option value="bard">🎵 Bard Spells</option>
              <option value="arcane">✨ All Arcane Classes</option>
              <option value="all">🌐 All Spells (Unfiltered)</option>
            `;
            sourceFilter.value = 'auto';
          }
        } else {
          if (sourceFilter.dataset.mode !== 'martial') {
            sourceFilter.dataset.mode = 'martial';
            sourceFilter.innerHTML = `
              <option value="all">⚔️ All 9 Disciplines</option>
              <option value="class">🥋 Class Disciplines Only</option>
              <option value="Desert Wind">🔥 Desert Wind</option>
              <option value="Devoted Spirit">🛡️ Devoted Spirit</option>
              <option value="Diamond Mind">💎 Diamond Mind</option>
              <option value="Iron Heart">⚔️ Iron Heart</option>
              <option value="Setting Sun">🌅 Setting Sun</option>
              <option value="Shadow Hand">🌑 Shadow Hand</option>
              <option value="Stone Dragon">⛰️ Stone Dragon</option>
              <option value="Tiger Claw">🐾 Tiger Claw</option>
              <option value="White Raven">🦅 White Raven</option>
            `;
            sourceFilter.value = 'all';
          }
        }
      }

      renderSpellPickerResults();
    }

    function stripSpellHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function formatSrdSpellAction(item) {
      if (!item) return 'Standard Action';
      if (item.action) return item.action;
      const ct = String(item.castingTime || '').toLowerCase().trim();
      if (!ct || ct === 'standard' || ct === '1 standard action') return '1 Standard Action';
      if (ct === 'swift' || ct === '1 swift action') return '1 Swift Action';
      if (ct === 'immediate' || ct === '1 immediate action') return '1 Immediate Action';
      if (ct === 'move' || ct === '1 move action') return '1 Move Action';
      if (ct === 'free' || ct === '1 free action') return 'Free Action';
      if (ct === 'round' || ct === '1 round' || ct === 'full round') return '1 Full Round';
      if (ct === 'minute' || ct === '1 minute') return '1 Minute';
      if (ct === 'hour' || ct === '1 hour') return '1 Hour';
      return item.castingTime;
    }

    function formatSrdSpellRange(item) {
      if (!item) return 'Close';
      const r = String(item.range || '').trim();
      if (!r) return 'Close';
      const low = r.toLowerCase();
      if (low === 'touch') return 'Touch';
      if (low === 'personal') return 'Personal';
      if (low === 'close') return 'Close';
      if (low === 'medium') return 'Medium';
      if (low === 'long') return 'Long';
      if (low === 'unlimited') return 'Unlimited';
      if (low === 'ft' && item.area) return String(item.area).trim();
      return r;
    }

    function getCombinedSpellManeuverCatalog() {
      const seen = new Set();
      const combined = [];
      const addList = (arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach(item => {
          if (!item || !item.name) return;
          const key = `${String(item.type || item.category || 'spell').toLowerCase()}:${String(item.name).toLowerCase().trim()}`;
          if (seen.has(key)) return;
          seen.add(key);
          combined.push(item);
        });
      };
      addList(Array.isArray(masterDb) ? masterDb : []);
      if (typeof RuleEngine !== 'undefined' && Array.isArray(RuleEngine.SPLATBOOK_BUFF_SPELLS)) {
        addList(RuleEngine.SPLATBOOK_BUFF_SPELLS);
      }
      if (window.SrdCompendium && typeof window.SrdCompendium.getAllLoaded === 'function') {
        addList(window.SrdCompendium.getAllLoaded(['Spell', 'Maneuver', 'Stance']));
      }
      if (Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        addList(window.BUNDLED_SRD_CORE_CATALOG.filter(x => x && ['spell', 'maneuver', 'stance'].includes(String(x.type || '').toLowerCase())));
      }
      return combined;
    }

    function getSpellTraditionAndLevels(item) {
      const divineLvls = [];
      const domainLvls = [];
      const arcanePrepLvls = [];
      const arcaneSpontLvls = [];
      const psionicLvls = [];

      const clsMap = (item && item.learnedAt && item.learnedAt.class && typeof item.learnedAt.class === 'object')
        ? item.learnedAt.class
        : {};
      const domMap = (item && item.learnedAt && item.learnedAt.domain && typeof item.learnedAt.domain === 'object')
        ? item.learnedAt.domain
        : {};

      let clericLvl = (clsMap.Cleric !== undefined && !isNaN(Number(clsMap.Cleric))) ? Number(clsMap.Cleric) : null;
      let druidLvl = (clsMap.Druid !== undefined && !isNaN(Number(clsMap.Druid))) ? Number(clsMap.Druid) : null;
      let paladinLvl = (clsMap.Paladin !== undefined && !isNaN(Number(clsMap.Paladin))) ? Number(clsMap.Paladin) : null;
      let rangerLvl = (clsMap.Ranger !== undefined && !isNaN(Number(clsMap.Ranger))) ? Number(clsMap.Ranger) : null;
      let wizardLvl = (clsMap.Wizard !== undefined && !isNaN(Number(clsMap.Wizard))) ? Number(clsMap.Wizard) : null;
      let sorcererLvl = (clsMap.Sorcerer !== undefined && !isNaN(Number(clsMap.Sorcerer))) ? Number(clsMap.Sorcerer) : null;
      let bardLvl = (clsMap.Bard !== undefined && !isNaN(Number(clsMap.Bard))) ? Number(clsMap.Bard) : null;

      const divinePriority = ['Cleric', 'Druid', 'Paladin', 'Ranger', 'Blackguard', 'Healer', 'Adept', 'Shugenja', 'Spirit Shaman', 'Favored Soul', 'Archivist'];
      divinePriority.forEach(k => {
        if (clsMap[k] !== undefined && clsMap[k] !== null && !isNaN(Number(clsMap[k]))) {
          divineLvls.push(Number(clsMap[k]));
        }
      });
      Object.keys(clsMap).forEach(k => {
        const low = k.toLowerCase().trim();
        const val = Number(clsMap[k]);
        if (isNaN(val)) return;
        if (['cleric', 'druid', 'paladin', 'ranger', 'blackguard', 'healer', 'adept', 'shugenja', 'spirit shaman', 'favored soul', 'archivist'].some(d => low.includes(d))) {
          if (!divineLvls.includes(val)) divineLvls.push(val);
          if (low.includes('cleric') && clericLvl === null) clericLvl = val;
          if (low.includes('druid') && druidLvl === null) druidLvl = val;
          if (low.includes('paladin') && paladinLvl === null) paladinLvl = val;
          if (low.includes('ranger') && rangerLvl === null) rangerLvl = val;
        } else if (['wizard', 'wu jen', 'wu-jen', 'artificer', 'assassin'].some(a => low.includes(a))) {
          arcanePrepLvls.push(val);
          if (low.includes('wizard') && wizardLvl === null) wizardLvl = val;
        } else if (['sorcerer', 'bard', 'warmage', 'beguiler', 'duskblade', 'dread necromancer', 'warlock', 'hexblade', 'spellthief'].some(a => low.includes(a))) {
          arcaneSpontLvls.push(val);
          if (low.includes('sorcerer') && sorcererLvl === null) sorcererLvl = val;
          if (low.includes('bard') && bardLvl === null) bardLvl = val;
        } else if (['psion', 'wilder', 'psychic warrior', 'nomad', 'shaper', 'seer', 'telepath', 'egoist', 'kineticist'].some(p => low.includes(p))) {
          psionicLvls.push(val);
        }
      });

      Object.values(domMap).forEach(v => {
        const num = Number(v);
        if (!isNaN(num)) domainLvls.push(num);
      });

      const hasExplicitLearnedAt = Object.keys(clsMap).length > 0 || Object.keys(domMap).length > 0;
      const tags = Array.isArray(item?.tags) ? item.tags.map(t => String(t).toLowerCase().trim()) : [];
      const extraClassText = `${item?.classes || ''} ${item?.class || ''} ${item?.sourceClass || ''} ${item?.spellClass || ''}`.toLowerCase();

      const hasArcaneTag = !hasExplicitLearnedAt && (
        tags.some(t => ['arcane', 'sorcerer', 'wizard', 'bard', 'wu-jen', 'beguiler', 'duskblade', 'warmage', 'warlock'].includes(t))
        || ['arcane', 'sorcerer', 'wizard', 'bard', 'warlock', 'warmage', 'beguiler', 'duskblade'].some(k => extraClassText.includes(k))
      );
      const hasDivineTag = !hasExplicitLearnedAt && (
        tags.some(t => ['divine', 'cleric', 'druid', 'paladin', 'ranger', 'healer', 'archivist', 'favored soul'].includes(t))
        || ['divine', 'cleric', 'druid', 'paladin', 'ranger', 'healer', 'archivist', 'favored soul'].some(k => extraClassText.includes(k))
      );

      if (!hasExplicitLearnedAt) {
        const fallbackLvl = (item?.level !== undefined && !isNaN(Number(item.level))) ? Number(item.level) : 1;
        if (extraClassText.includes('cleric') || tags.includes('cleric')) clericLvl = fallbackLvl;
        if (extraClassText.includes('druid') || tags.includes('druid')) druidLvl = fallbackLvl;
        if (extraClassText.includes('paladin') || tags.includes('paladin')) paladinLvl = fallbackLvl;
        if (extraClassText.includes('ranger') || tags.includes('ranger')) rangerLvl = fallbackLvl;
        if (extraClassText.includes('wizard') || tags.includes('wizard')) wizardLvl = fallbackLvl;
        if (extraClassText.includes('sorcerer') || tags.includes('sorcerer')) sorcererLvl = fallbackLvl;
        if (extraClassText.includes('bard') || tags.includes('bard')) bardLvl = fallbackLvl;
      }

      const isArcane = arcanePrepLvls.length > 0 || arcaneSpontLvls.length > 0 || hasArcaneTag;
      const isDivine = divineLvls.length > 0 || hasDivineTag;
      const isDomain = domainLvls.length > 0;
      const isPsionicOnly = psionicLvls.length > 0 && !isArcane && !isDivine && !isDomain;
      const hasAnyTradition = isArcane || isDivine || isDomain || isPsionicOnly;

      return {
        isArcane,
        isDivine,
        isDomain,
        isPsionicOnly,
        hasAnyTradition,
        clericLvl,
        druidLvl,
        paladinLvl,
        rangerLvl,
        wizardLvl,
        sorcererLvl,
        bardLvl,
        divineLvls,
        domainLvls,
        arcanePrepLvls,
        arcaneSpontLvls,
        clsMap,
        domMap
      };
    }

    function resolveAutoSpellFilterSource(targetPool = 'spontaneous') {
      const rawNames = [];
      if (Array.isArray(character?.levelProgression)) {
        character.levelProgression.filter(p => p && p.active !== false).forEach(p => {
          if (p.className || p.class) rawNames.push(String(p.className || p.class).toLowerCase().trim());
        });
      }
      if (rawNames.length === 0 && Array.isArray(character?.classProgression)) {
        character.classProgression.forEach(cp => {
          if (cp?.className || cp?.name) rawNames.push(String(cp.className || cp.name).toLowerCase().trim());
        });
      }
      if (rawNames.length === 0 && typeof character?.classes === 'string' && character.classes) {
        character.classes.split(/[\/,]/).forEach(s => rawNames.push(s.toLowerCase().trim()));
      }
      if (rawNames.length === 0 && typeof character?.class === 'string' && character.class) {
        rawNames.push(character.class.toLowerCase().trim());
      }

      if (targetPool === 'divine') {
        const hasCleric = rawNames.some(c => ['cleric', 'creric', 'rahip', 'priest', 'favored soul', 'radiant servant', 'hierophant', 'contemplative', 'church inquisitor', 'warpriest', 'divine oracle'].some(k => c.includes(k)));
        const hasDruid = rawNames.some(c => ['druid', 'spirit shaman'].some(k => c.includes(k)));
        const hasPaladin = rawNames.some(c => ['paladin', 'şövalye', 'hospitaler', 'blackguard'].some(k => c.includes(k)));
        const hasRanger = rawNames.some(c => ['ranger', 'korucu'].some(k => c.includes(k)));
        const matched = [
          hasCleric ? 'cleric' : null,
          hasDruid ? 'druid' : null,
          hasPaladin ? 'paladin' : null,
          hasRanger ? 'ranger' : null
        ].filter(Boolean);
        if (matched.length === 1) return matched[0];
        return 'divine';
      }

      if (targetPool === 'prepared') {
        return 'sor_wiz';
      }

      if (targetPool === 'spontaneous') {
        const hasBard = rawNames.some(c => ['bard', 'ozan'].some(k => c.includes(k)));
        const hasSorc = rawNames.some(c => ['sorcerer', 'warmage', 'duskblade', 'beguiler', 'dread necromancer', 'spellthief'].some(k => c.includes(k)));
        if (hasBard && !hasSorc) return 'bard';
        return 'sor_wiz';
      }

      return 'all';
    }

    function resolveSpellLevelForPool(item, targetPool = 'spontaneous', effectiveSource = 'auto') {
      if (!item) return null;
      const info = getSpellTraditionAndLevels(item);
      const src = effectiveSource === 'auto' ? resolveAutoSpellFilterSource(targetPool) : effectiveSource;

      if (src === 'cleric') {
        if (info.clericLvl !== null) return info.clericLvl;
      } else if (src === 'char_domains') {
        const chosen = typeof getCharacterClericDomains === 'function' ? getCharacterClericDomains(character) : [];
        for (const d of chosen) {
          if (info.domMap && info.domMap[d] !== undefined && !isNaN(Number(info.domMap[d]))) {
            return Number(info.domMap[d]);
          }
        }
        if (info.domainLvls.length > 0) return info.domainLvls[0];
      } else if (src === 'druid') {
        if (info.druidLvl !== null) return info.druidLvl;
      } else if (src === 'paladin') {
        if (info.paladinLvl !== null) return info.paladinLvl;
      } else if (src === 'ranger') {
        if (info.rangerLvl !== null) return info.rangerLvl;
      } else if (src === 'domain') {
        const chosen = typeof getCharacterClericDomains === 'function' ? getCharacterClericDomains(character) : [];
        for (const d of chosen) {
          if (info.domMap && info.domMap[d] !== undefined && !isNaN(Number(info.domMap[d]))) {
            return Number(info.domMap[d]);
          }
        }
        if (info.domainLvls.length > 0) return info.domainLvls[0];
      } else if (src === 'bard') {
        if (info.bardLvl !== null) return info.bardLvl;
      } else if (src === 'sor_wiz') {
        if (targetPool === 'prepared' && info.wizardLvl !== null) return info.wizardLvl;
        if (info.sorcererLvl !== null) return info.sorcererLvl;
        if (info.wizardLvl !== null) return info.wizardLvl;
      } else if (src === 'divine' || targetPool === 'divine') {
        if (info.clericLvl !== null) return info.clericLvl;
        if (info.druidLvl !== null) return info.druidLvl;
        if (info.paladinLvl !== null) return info.paladinLvl;
        if (info.rangerLvl !== null) return info.rangerLvl;
        if (info.divineLvls.length > 0) return info.divineLvls[0];
      } else if (src === 'arcane' || targetPool === 'prepared' || targetPool === 'spontaneous') {
        if (targetPool === 'prepared' && info.wizardLvl !== null) return info.wizardLvl;
        if (info.sorcererLvl !== null) return info.sorcererLvl;
        if (info.wizardLvl !== null) return info.wizardLvl;
        if (info.bardLvl !== null) return info.bardLvl;
        if (info.arcanePrepLvls.length > 0) return info.arcanePrepLvls[0];
        if (info.arcaneSpontLvls.length > 0) return info.arcaneSpontLvls[0];
      }

      if (!info.hasAnyTradition && item.level !== undefined && item.level !== null) return Number(item.level);
      if (src === 'all' && item.level !== undefined && item.level !== null) return Number(item.level);
      if (Array.isArray(item.tags) && item.tags.some(t => String(t).toLowerCase() === 'cantrip' || String(t).toLowerCase() === 'orison')) return 0;
      return null;
    }

    function formatSpellClassLevelsSummary(item) {
      const info = getSpellTraditionAndLevels(item);
      const parts = [];
      if (info.wizardLvl !== null && info.sorcererLvl !== null && info.wizardLvl === info.sorcererLvl) {
        parts.push(`Sor/Wiz ${info.wizardLvl}`);
      } else {
        if (info.wizardLvl !== null) parts.push(`Wiz ${info.wizardLvl}`);
        if (info.sorcererLvl !== null) parts.push(`Sor ${info.sorcererLvl}`);
      }
      if (info.clericLvl !== null) parts.push(`Clr ${info.clericLvl}`);
      if (info.druidLvl !== null) parts.push(`Drd ${info.druidLvl}`);
      if (info.bardLvl !== null) parts.push(`Brd ${info.bardLvl}`);
      if (info.paladinLvl !== null) parts.push(`Pal ${info.paladinLvl}`);
      if (info.rangerLvl !== null) parts.push(`Rgr ${info.rangerLvl}`);
      const domEntries = Object.entries(info.domMap || {});
      if (domEntries.length > 0) {
        const domStr = domEntries.slice(0, 2).map(([d, l]) => `${d} ${l}`).join(', ');
        parts.push(`Domain: ${domStr}${domEntries.length > 2 ? '…' : ''}`);
      }
      return parts.join(' • ');
    }

    // Helper: Determine if spell matches the target pool / class filter
    function isSpellMatchingTargetSource(item, effectiveSource) {
      if (!item) return false;
      const info = getSpellTraditionAndLevels(item);
      if (info.isPsionicOnly) return false;
      if (effectiveSource === 'all') return true;

      // Custom spells in Master DB with no explicit class/tradition metadata match by default
      if (!info.hasAnyTradition) return true;

      switch (effectiveSource) {
        case 'cleric':
          return info.clericLvl !== null;
        case 'char_domains': {
          const chosen = typeof getCharacterClericDomains === 'function' ? getCharacterClericDomains(character) : [];
          if (chosen.length > 0) {
            return chosen.some(d => info.domMap && info.domMap[d] !== undefined);
          }
          return info.isDomain;
        }
        case 'druid':
          return info.druidLvl !== null;
        case 'paladin':
          return info.paladinLvl !== null;
        case 'ranger':
          return info.rangerLvl !== null;
        case 'domain':
          return info.isDomain;
        case 'divine':
          return info.isDivine;
        case 'sor_wiz':
          return info.wizardLvl !== null || info.sorcererLvl !== null || (!Object.keys(info.clsMap).length && info.isArcane);
        case 'bard':
          return info.bardLvl !== null;
        case 'arcane':
          return info.isArcane;
        default:
          return true;
      }
    }

    function renderSpellPickerResults() {
      const container = document.getElementById('spell-picker-results-container');
      if (!container) return;

      if (window.SrdCompendium && typeof window.SrdCompendium.ensureChunkLoaded === 'function' && !window._srdSpellsChunkRequested) {
        window._srdSpellsChunkRequested = true;
        Promise.all([
          window.SrdCompendium.ensureChunkLoaded('srd_spells.json'),
          window.SrdCompendium.ensureChunkLoaded('srd_maneuvers.json')
        ]).then(() => {
          renderSpellPickerResults();
        }).catch(() => {});
      }

      const type = window._currentSpellPickerType || 'Spell';
      const targetPool = window._spellPickerTargetPool || 'spontaneous';
      const query = (document.getElementById('spell-picker-search')?.value || '').toLowerCase().trim();
      const levelFilter = document.getElementById('spell-picker-level-filter')?.value || 'all';
      const sourceFilterSelect = document.getElementById('spell-picker-source-filter');
      const selectedSource = sourceFilterSelect ? sourceFilterSelect.value : 'auto';

      // Determine effectiveSource based on target pool and character class
      let effectiveSource = selectedSource;
      if (selectedSource === 'auto') {
        effectiveSource = resolveAutoSpellFilterSource(targetPool);
      }

      const pickerPalette = getSpellPickerCategoryPalette(type, targetPool, effectiveSource);
      applySpellPickerModalTheme(pickerPalette);

      const initInfo = (type === 'Maneuver' || type === 'Stance') ? getInitiatorInfo() : null;

      // Update target hint banner
      const targetHint = document.getElementById('spell-picker-target-hint');
      if (targetHint) {
        if (type === 'Spell') {
          let poolLabel = '\u26A1 Spontaneous Spells (Sorcerer / Bard)';
          let badgeColor = 'text-purple-300 bg-purple-950/80 border-purple-800';
          if (targetPool === 'prepared') {
            poolLabel = '\uD83D\uDCD6 Spellbook (Wizard / Prepared)';
            badgeColor = 'text-cyan-300 bg-cyan-950/80 border-cyan-800';
          } else if (targetPool === 'divine') {
            if (window._spellPickerIsDomainSlot || effectiveSource === 'char_domains' || effectiveSource === 'domain') {
              poolLabel = '\u269C\uFE0F Domain Spell Slot (Cleric Domain)';
              badgeColor = 'text-yellow-300 bg-amber-950/90 border-yellow-600';
            } else {
              poolLabel = '\uD83D\uDD2E Divine Spells (Cleric / Druid / Divine)';
              badgeColor = 'text-amber-300 bg-amber-950/80 border-amber-800';
            }
          }

          const chosenDoms = typeof getCharacterClericDomains === 'function' ? getCharacterClericDomains(character) : [];
          const charDomainLabel = chosenDoms.length > 0
            ? `\u269C\uFE0F Domains: ${chosenDoms.join(' & ')}`
            : '\u269C\uFE0F My Selected Domains (None selected yet)';

          const filterLabels = {
            cleric: { label: '\u271D\uFE0F Cleric Spells', color: 'text-amber-300 border-amber-700 bg-amber-950/60' },
            char_domains: { label: charDomainLabel, color: 'text-yellow-300 border-yellow-600 bg-amber-950/80' },
            druid: { label: '\uD83C\uDF3F Druid Spells', color: 'text-emerald-300 border-emerald-700 bg-emerald-950/60' },
            paladin: { label: '\uD83D\uDEE1\uFE0F Paladin Spells', color: 'text-sky-300 border-sky-700 bg-sky-950/60' },
            ranger: { label: '\uD83C\uDFF9 Ranger Spells', color: 'text-teal-300 border-teal-700 bg-teal-950/60' },
            domain: { label: '\u269C\uFE0F All Cleric Domains', color: 'text-yellow-300 border-yellow-700 bg-yellow-950/60' },
            divine: { label: '\uD83D\uDD2E All Divine Classes', color: 'text-amber-300 border-amber-700 bg-amber-950/60' },
            sor_wiz: { label: '\u26A1 Sorcerer / Wizard', color: 'text-purple-300 border-purple-700 bg-purple-950/60' },
            bard: { label: '\uD83C\uDFB5 Bard Spells', color: 'text-pink-300 border-pink-700 bg-pink-950/60' },
            arcane: { label: '\u2728 All Arcane Classes', color: 'text-purple-300 border-purple-700 bg-purple-950/60' },
            all: { label: '\uD83C\uDF10 All (Unfiltered)', color: 'text-slate-300 border-slate-700 bg-slate-900' }
          };
          const fMeta = filterLabels[effectiveSource] || filterLabels.all;
          const filterBadge = fMeta.label;
          const filterColor = fMeta.color;

          targetHint.innerHTML = `
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 text-[10px]">Target:</span>
              <span class="font-bold border px-1.5 py-0.5 rounded text-[10px] ${badgeColor}">${poolLabel}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 text-[10px]">Active Filter:</span>
              <span class="font-bold border px-1.5 py-0.5 rounded text-[10px] ${filterColor}">${filterBadge}</span>
            </div>
          `;
          targetHint.style.display = 'flex';
        } else if (initInfo) {
          const discLabel = selectedSource === 'class'
            ? `\uD83E\uDD4B ${initInfo.adeptClass} Disciplines`
            : (selectedSource && selectedSource !== 'all' && selectedSource !== 'auto' ? `\u2694\uFE0F ${selectedSource}` : '\u2694\uFE0F All 9 Sublime Way Disciplines');
          const adeptSummary = initInfo.hasClass
            ? `${initInfo.adeptClass} &bull; IL ${initInfo.il} (Max Lvl ${initInfo.maxManeuverLvl})`
            : `🔒 No Martial Adept Class / Feat (0 Quota)`;
          targetHint.innerHTML = `
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 text-[10px]">Martial Adept:</span>
              <span class="font-bold border px-1.5 py-0.5 rounded text-[10px] text-rose-300 bg-rose-950/80 border-rose-800">${adeptSummary}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 text-[10px]">Discipline:</span>
              <span class="font-bold border px-1.5 py-0.5 rounded text-[10px] text-amber-300 bg-amber-950/60 border-amber-700">${discLabel}</span>
            </div>
          `;
          targetHint.style.display = 'flex';
        } else {
          targetHint.style.display = 'none';
        }
      }

      const allDb = getCombinedSpellManeuverCatalog();

      const matches = allDb.filter(item => {
        if (isMasterDbChildEntry(item)) return false;
        const itemType = (item.type || '').toLowerCase();
        const itemCat = (item.category || '').toLowerCase();

        let isTypeMatch = false;
        if (type === 'Spell') {
          isTypeMatch = itemType.includes('spell') || itemCat.includes('spell');
          if (isTypeMatch && !isSpellMatchingTargetSource(item, effectiveSource)) {
            return false;
          }
        } else if (type === 'Maneuver') {
          isTypeMatch = (itemType.includes('maneuver') || itemCat.includes('maneuver')) && !itemType.includes('stance') && !itemCat.includes('stance');
        } else if (type === 'Stance') {
          isTypeMatch = itemType.includes('stance') || itemCat.includes('stance');
        }

        if (!isTypeMatch) return false;

        if (type === 'Maneuver' || type === 'Stance') {
          const itemDisc = String(item.discipline || item.school || '').trim();
          if (selectedSource === 'class' && initInfo && Array.isArray(initInfo.classDisciplines)) {
            if (!initInfo.classDisciplines.some(d => d.toLowerCase() === itemDisc.toLowerCase())) return false;
          } else if (selectedSource && !['all', 'auto', 'arcane', 'divine', 'class'].includes(selectedSource)) {
            if (itemDisc.toLowerCase() !== selectedSource.toLowerCase()) return false;
          }
        }

        if (levelFilter !== 'all') {
          const itemLvl = type === 'Spell'
            ? resolveSpellLevelForPool(item, targetPool, effectiveSource)
            : (item.level !== undefined ? Number(item.level) : null);
          if (String(itemLvl ?? '') !== String(levelFilter)) return false;
        }

        if (query) {
          const name = (item.name || '').toLowerCase();
          const school = (item.school || item.category || item.discipline || '').toLowerCase();
          const subT = (item.subType || '').toLowerCase();
          const desc = (item.benefit || item.shortDescription || item.description || item.desc || '').toLowerCase();
          if (!name.includes(query) && !school.includes(query) && !subT.includes(query) && !desc.includes(query)) return false;
        }

        return true;
      });

      matches.sort((a, b) => {
        const lvlA = type === 'Spell' ? (resolveSpellLevelForPool(a, targetPool, effectiveSource) ?? 99) : (Number(a.level) || 0);
        const lvlB = type === 'Spell' ? (resolveSpellLevelForPool(b, targetPool, effectiveSource) ?? 99) : (Number(b.level) || 0);
        if (lvlA !== lvlB) return lvlA - lvlB;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });

      container.innerHTML = '';
      if (matches.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center text-slate-400 space-y-2">
            <div class="text-3xl">\uD83D\uDD0D</div>
            <p class="text-xs">No matching ${type === 'Spell' ? 'spell' : (type === 'Maneuver' ? 'maneuver' : 'stance')} found in Master DB.</p>
            <p class="text-[11px] text-slate-500">Click the <strong>Rule Master AI</strong> button below to fetch it directly from the 3.5e rulebooks.</p>
          </div>
        `;
        return;
      }
      matches.forEach(item => {
        const cleanName = (item.name || '').toLowerCase().trim();
        let alreadyKnown = false;

        if (type === 'Spell') {
          const targetArr = targetPool === 'prepared'
            ? (character.spellcasting?.preparedSpells || [])
            : (targetPool === 'divine' ? (character.spellcasting?.divineSpells || []) : (character.spellcasting?.knownSpells || []));
          if (targetPool === 'divine') {
            const isDomainTarget = Boolean(window._spellPickerIsDomainSlot || effectiveSource === 'char_domains' || effectiveSource === 'domain');
            alreadyKnown = targetArr.some(s => (s.name || '').toLowerCase().trim() === cleanName && Boolean(s.isDomainSpell) === isDomainTarget);
          } else {
            alreadyKnown = targetArr.some(s => (s.name || '').toLowerCase().trim() === cleanName);
          }
        } else if (type === 'Maneuver') {
          alreadyKnown = (character.tomeOfBattle?.maneuversKnown || []).some(m => (m.name || '').toLowerCase().trim() === cleanName);
        } else if (type === 'Stance') {
          alreadyKnown = (character.tomeOfBattle?.stancesKnown || []).some(st => (st.name || '').toLowerCase().trim() === cleanName);
        }

        const itemLvlDisplay = type === 'Spell'
          ? resolveSpellLevelForPool(item, targetPool, effectiveSource)
          : (item.level !== undefined ? item.level : null);

        let isLevelFull = false;
        let isMartialLocked = false;
        let martialLockText = '';
        let martialLockTitle = '';
        let countText = '';
        if (type === 'Spell') {
          const numLvl = itemLvlDisplay !== null ? Number(itemLvlDisplay) : 0;
          if (targetPool === 'spontaneous') {
            const quota = getSpellsKnownQuota(numLvl);
            const curCount = (character.spellcasting?.knownSpells || []).filter(s => Number(s.level) === numLvl).length;
            isLevelFull = curCount >= quota;
            countText = `${curCount}/${quota}`;
          } else if (targetPool === 'prepared') {
            const prepSlot = (character.spellcasting?.preparedSlots || []).find(s => Number(s.level) === numLvl);
            const maxPrep = prepSlot ? (Number(prepSlot.daily) || 0) : 0;
            const curCount = (character.spellcasting?.preparedSpells || []).filter(s => Number(s.level) === numLvl).length;
            isLevelFull = curCount >= maxPrep;
            countText = `${curCount}/${maxPrep}`;
          } else if (targetPool === 'divine') {
            const divSlot = (character.spellcasting?.divineSlots || []).find(s => Number(s.level) === numLvl);
            const isDomainTarget = Boolean(window._spellPickerIsDomainSlot || effectiveSource === 'char_domains' || effectiveSource === 'domain');
            if (isDomainTarget) {
              const maxDom = numLvl > 0 && divSlot ? (Number(divSlot.domainDaily !== undefined ? divSlot.domainDaily : (hasClericDomainCapability(character) ? 1 : 0)) || 0) : 0;
              const curDom = (character.spellcasting?.divineSpells || []).filter(s => Number(s.level) === numLvl && s.isDomainSpell).length;
              isLevelFull = curDom >= maxDom;
              countText = `${curDom}/${maxDom} Domain`;
            } else {
              const maxReg = divSlot ? (Number(divSlot.regularDaily !== undefined ? divSlot.regularDaily : divSlot.daily) || 0) : 0;
              const curReg = (character.spellcasting?.divineSpells || []).filter(s => Number(s.level) === numLvl && !s.isDomainSpell).length;
              isLevelFull = curReg >= maxReg;
              countText = `${curReg}/${maxReg}`;
            }
          }
        } else if (type === 'Maneuver' || type === 'Stance') {
          const mLvl = Number(item.level) || 1;
          const curKnown = type === 'Maneuver'
            ? (character.tomeOfBattle?.maneuversKnown || []).length
            : (character.tomeOfBattle?.stancesKnown || []).length;
          const maxQuota = type === 'Maneuver'
            ? (initInfo?.maxKnownManeuvers || 0)
            : (initInfo?.maxKnownStances || 0);
          countText = `${curKnown}/${maxQuota}`;
          if (!initInfo || !initInfo.hasClass || maxQuota <= 0) {
            isMartialLocked = true;
            martialLockText = '🔒 No Martial Class';
            martialLockTitle = `Requires a Martial Adept class (Crusader, Swordsage, Warblade) or the ${type === 'Maneuver' ? 'Martial Study' : 'Martial Stance'} feat.`;
          } else if (mLvl > (initInfo.maxManeuverLvl || 0)) {
            isMartialLocked = true;
            martialLockText = `🔒 Req IL ${mLvl * 2 - 1}+`;
            martialLockTitle = `Level ${mLvl} ${type} requires Initiator Level ${mLvl * 2 - 1}+ (current IL: ${initInfo.il}, Max Lvl: ${initInfo.maxManeuverLvl}).`;
          } else if (curKnown >= maxQuota) {
            isLevelFull = true;
          }
        }

        let actionHtml = '';
        if (alreadyKnown) {
          actionHtml = `
            <span class="text-[11px] text-emerald-400 font-bold px-2.5 py-1 bg-emerald-950/60 border border-emerald-700 rounded-lg inline-flex items-center gap-1">
              ✓ Added
            </span>
          `;
        } else if (isMartialLocked) {
          actionHtml = `
            <span class="text-[11px] text-slate-400 font-bold px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg inline-flex items-center gap-1 cursor-not-allowed" title="${martialLockTitle}">
              ${martialLockText}
            </span>
          `;
        } else if (isLevelFull) {
          actionHtml = `
            <span class="text-[11px] text-amber-400 font-bold px-2 py-1 bg-amber-950/60 border border-amber-800 rounded-lg inline-flex items-center gap-1" title="Quota (${countText}) is full. Cannot add more.">
              &#x1F6AB; Full (${countText})
            </span>
          `;
        } else {
          actionHtml = `
            <button type="button" onclick="addMasterDbItemToCharacter('${escape(item.name)}')" class="${pickerPalette.addBtn} font-bold text-xs px-3 py-1.5 rounded-lg border shadow transition flex items-center gap-1 cursor-pointer" title="${countText ? 'Current / Max Slots: ' + countText : ''}">
              <span>+ Add</span>
              ${countText ? `<span class="text-[10px] opacity-80 font-mono">(${countText})</span>` : ''}
            </button>
          `;
        }

        const schoolDisplay = (type === 'Spell'
          ? (item.school || (item.category && item.category.toLowerCase() !== 'spell' ? item.category : ''))
          : (item.discipline || item.school || '')) || item.type || '-';
        const spellClassSummary = type === 'Spell' ? formatSpellClassLevelsSummary(item) : '';
        const classLvlBadge = spellClassSummary
          ? `<span class="text-[10px] text-sky-300/90 font-mono bg-slate-900/90 border border-slate-700/80 px-1.5 py-0.5 rounded">${spellClassSummary}</span>`
          : '';
        const subTypeBadge = (type !== 'Spell' && item.subType)
          ? `<span class="badge bg-slate-800 text-cyan-300 border border-slate-700 text-[10px] font-bold">${item.subType}</span>`
          : '';
        const prereqBadge = (type !== 'Spell' && item.prereq && item.prereq !== 'None' && item.prereq !== '0')
          ? `<span class="text-[10px] text-rose-300/90 font-semibold" title="Tome of Battle Prerequisite">Prereq: ${item.prereq}</span>`
          : '';
        const sourceBadge = item.source
          ? `<span class="text-[10px] text-slate-500 font-mono">${item.source}</span>`
          : '';
        const actionDisplay = type === 'Spell' ? formatSrdSpellAction(item) : (item.action || '');
        const summaryDisplay = item.benefit || item.shortDescription || stripSpellHtml(item.description || item.desc) || item.notes || '-';

        const card = document.createElement('div');
        card.className = 'pt-2.5 pb-2.5 flex items-start justify-between gap-3';
        card.innerHTML = `
          <div class="space-y-1 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="badge ${pickerPalette.lvlBadge} text-[10px] font-bold">
                ${itemLvlDisplay !== null ? 'Level ' + itemLvlDisplay : 'Lvl ?'}
              </span>
              <h4 class="font-extrabold text-white text-xs">${item.name}</h4>
              <span class="text-[10px] text-slate-400">(${schoolDisplay})</span>
              ${classLvlBadge}
              ${subTypeBadge}
              ${actionDisplay ? `<span class="text-[10px] text-amber-300">${actionDisplay}</span>` : ''}
              ${prereqBadge}
              ${sourceBadge}
              ${(() => {
                const ch = getSpellOrManeuverChildren(item);
                return ch.length > 0
                  ? `<span class="badge bg-amber-950/80 text-amber-300 border border-amber-700/70 text-[10px] font-bold" title="Sub-effects triggered on roll: ${ch.map(c => (c.name || '').replace(/^↳\s*/, '')).join(' &bull; ')}">&#x1F517; +${ch.length} Sub-Effects</span>`
                  : '';
              })()}
            </div>
            <p class="text-[11px] text-slate-300 line-clamp-2">${summaryDisplay}</p>
          </div>
          <div class="shrink-0">
            ${actionHtml}
          </div>
        `;
        container.appendChild(card);
      });
    }

    function addMasterDbItemToCharacter(escapedName) {
      const name = unescape(escapedName);
      const allDb = getCombinedSpellManeuverCatalog();
      let item = allDb.find(m => (m.name || '').toLowerCase().trim() === name.toLowerCase().trim());
      if (!item && window.SrdCompendium && typeof window.SrdCompendium.getByName === 'function') {
        item = window.SrdCompendium.getByName(name);
      }
      if (!item) return;

      const type = window._currentSpellPickerType || 'Spell';
      const targetPool = window._spellPickerTargetPool || 'spontaneous';

      if (type === 'Spell') {
        if (!character.spellcasting) character.spellcasting = {};
        const poolKey = targetPool === 'prepared' ? 'preparedSpells' : (targetPool === 'divine' ? 'divineSpells' : 'knownSpells');
        if (!Array.isArray(character.spellcasting[poolKey])) character.spellcasting[poolKey] = [];

        const activeFilterSource = document.getElementById('spell-picker-source-filter')?.value || 'auto';
        const resolvedLvlVal = resolveSpellLevelForPool(item, targetPool, activeFilterSource);
        const resolvedLvl = resolvedLvlVal !== null && resolvedLvlVal !== undefined ? Number(resolvedLvlVal) : 1;

        // Strict: Check if level has reached maximum slot/known quota
        if (targetPool === 'spontaneous') {
          const quota = getSpellsKnownQuota(resolvedLvl);
          const currentSpells = character.spellcasting.knownSpells.filter(s => Number(s.level) === resolvedLvl);
          if (currentSpells.length >= quota) {
            showDiceTopToast({
              icon: '⚠️',
              title: 'Slot Full',
              breakdown: `Spells Known quota (${quota}) for Level ${resolvedLvl} is full! Cannot add more spells.`,
              total: `${currentSpells.length}/${quota}`
            });
            return;
          }
        } else if (targetPool === 'prepared') {
          const prepSlot = (character.spellcasting?.preparedSlots || []).find(s => Number(s.level) === resolvedLvl);
          const maxPrep = prepSlot ? (Number(prepSlot.daily) || 0) : 0;
          const currentPrep = character.spellcasting.preparedSpells.filter(s => Number(s.level) === resolvedLvl);
          if (currentPrep.length >= maxPrep) {
            showDiceTopToast({
              icon: '⚠️',
              title: 'Slot Full',
              breakdown: `Prepared slot capacity (${maxPrep}) for Level ${resolvedLvl} is full!`,
              total: `${currentPrep.length}/${maxPrep}`
            });
            return;
          }
        } else if (targetPool === 'divine') {
          const divSlot = (character.spellcasting?.divineSlots || []).find(s => Number(s.level) === resolvedLvl);
          const isDomainTarget = Boolean(window._spellPickerIsDomainSlot || activeFilterSource === 'char_domains' || activeFilterSource === 'domain');
          if (isDomainTarget) {
            const maxDom = resolvedLvl > 0 && divSlot ? (Number(divSlot.domainDaily !== undefined ? divSlot.domainDaily : (hasClericDomainCapability(character) ? 1 : 0)) || 0) : 0;
            const currentDom = character.spellcasting.divineSpells.filter(s => Number(s.level) === resolvedLvl && s.isDomainSpell);
            if (currentDom.length >= maxDom) {
              showDiceTopToast({
                icon: '⚜️',
                title: 'Domain Slot Full',
                breakdown: `Domain slot capacity (${maxDom}) for Level ${resolvedLvl} is already filled!`,
                total: `${currentDom.length}/${maxDom}`
              });
              return;
            }
          } else {
            const maxReg = divSlot ? (Number(divSlot.regularDaily !== undefined ? divSlot.regularDaily : divSlot.daily) || 0) : 0;
            const currentReg = character.spellcasting.divineSpells.filter(s => Number(s.level) === resolvedLvl && !s.isDomainSpell);
            if (currentReg.length >= maxReg) {
              showDiceTopToast({
                icon: '⚠️',
                title: 'Slot Full',
                breakdown: `Regular Divine slot capacity (${maxReg}) for Level ${resolvedLvl} is full!`,
                total: `${currentReg.length}/${maxReg}`
              });
              return;
            }
          }
        }

        const v2SpellPart = Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0].dice : '';
        const cleanBenefit = item.benefit || item.shortDescription || stripSpellHtml(item.description || item.desc) || '';
        const schoolName = item.school || (item.category && item.category.toLowerCase() !== 'spell' ? item.category : 'Universal');
        const rangeText = formatSrdSpellRange(item);
        const actionText = formatSrdSpellAction(item);
        const autoDice = v2SpellPart || item.damageDice || item.dice || findDiceExpression(cleanBenefit) || '';

        const isDomainAdded = targetPool === 'divine' && Boolean(window._spellPickerIsDomainSlot || activeFilterSource === 'char_domains' || activeFilterSource === 'domain');
        let matchedDomainName = '';
        if (isDomainAdded) {
          const info = getSpellTraditionAndLevels(item);
          const chosenDoms = typeof getCharacterClericDomains === 'function' ? getCharacterClericDomains(character) : [];
          matchedDomainName = chosenDoms.find(d => info.domMap && info.domMap[d] !== undefined) || Object.keys(info.domMap || {})[0] || chosenDoms[0] || 'Domain';
        }

        const newSpellEntry = {
          id: item.id || ('spl_' + String(item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')),
          schemaVersion: 2,
          name: item.name,
          level: resolvedLvl,
          school: schoolName,
          benefit: cleanBenefit,
          range: rangeText,
          target: item.target || item.area || '',
          duration: item.duration || '',
          action: actionText,
          damageDice: autoDice,
          damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : [],
          modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
          ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {}
        };
        if (item.sizeModifier) {
          newSpellEntry.sizeModifier = JSON.parse(JSON.stringify(item.sizeModifier));
        }
        if (item.tempHpFormula) {
          newSpellEntry.tempHpFormula = item.tempHpFormula;
        }
        if (item.buffTargetMode) {
          newSpellEntry.buffTargetMode = item.buffTargetMode;
        }
        if (isDomainAdded) {
          newSpellEntry.isDomainSpell = true;
          newSpellEntry.domainSource = matchedDomainName;
        }

        character.spellcasting[poolKey].push(newSpellEntry);

        saveStateToStorage(true);
        renderAll();
        renderSpellPickerResults();
        showDiceTopToast({
          icon: isDomainAdded ? '⚜️' : (targetPool === 'prepared' ? '📖' : (targetPool === 'divine' ? '✨' : '🔮')),
          title: isDomainAdded ? 'Domain Spell Prepared' : 'Spell Added',
          breakdown: isDomainAdded ? `"${item.name}" prepared in your Level ${resolvedLvl} ${matchedDomainName} Domain slot` : `"${item.name}" added to your spell pool`,
          total: isDomainAdded ? `${matchedDomainName} ${resolvedLvl}` : '+1 Spell'
        });
      } else if (type === 'Maneuver') {
        const initInfo = getInitiatorInfo();
        const mLvl = item.level !== undefined ? Number(item.level) : 1;
        if (!initInfo || !initInfo.hasClass || (initInfo.maxKnownManeuvers || 0) <= 0) {
          showDiceTopToast({
            icon: '🔒',
            title: 'Martial Adept Required',
            breakdown: 'D&D 3.5e RAW (ToB p. 29): Requires a Martial Adept class (Crusader, Swordsage, Warblade) or the Martial Study feat to learn maneuvers.',
            total: 'Locked'
          });
          return;
        }
        if (mLvl > (initInfo.maxManeuverLvl || 0)) {
          showDiceTopToast({
            icon: '🔒',
            title: 'Initiator Level Too Low',
            breakdown: `Level ${mLvl} maneuvers require Initiator Level ${mLvl * 2 - 1}+ (current IL: ${initInfo.il}).`,
            total: `Max Lvl ${initInfo.maxManeuverLvl}`
          });
          return;
        }
        if (!character.tomeOfBattle) character.tomeOfBattle = {};
        if (!Array.isArray(character.tomeOfBattle.maneuversKnown)) character.tomeOfBattle.maneuversKnown = [];
        if (!Array.isArray(character.tomeOfBattle.readiedManeuvers)) character.tomeOfBattle.readiedManeuvers = [];

        if (character.tomeOfBattle.maneuversKnown.length >= initInfo.maxKnownManeuvers) {
          showDiceTopToast({
            icon: '⚠️',
            title: 'Maneuver Quota Full',
            breakdown: `Maneuvers Known quota (${initInfo.maxKnownManeuvers}) is full!`,
            total: `${character.tomeOfBattle.maneuversKnown.length}/${initInfo.maxKnownManeuvers}`
          });
          return;
        }

        const exists = character.tomeOfBattle.maneuversKnown.some(m => (m.name || '').toLowerCase().trim() === name.toLowerCase().trim());
        if (exists) {
          alert('This maneuver is already in your known maneuvers pool.');
          return;
        }

        const v2ManeuverDice = (Array.isArray(item.damageParts) && item.damageParts[0]?.dice) || item.damageDice || undefined;
        const newManeuver = {
          id: item.id || ('tob_maneuver_' + String(item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')),
          schemaVersion: 2,
          name: item.name,
          level: mLvl,
          discipline: item.discipline || item.school || 'Iron Heart',
          subType: item.subType || 'Strike',
          action: item.action || 'Standard',
          prereq: item.prereq || 'None',
          source: item.source || 'ToB',
          range: item.range || 'Melee Attack',
          save: item.save || 'None',
          damageDice: v2ManeuverDice,
          damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : [],
          modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
          ruleFlags: Array.isArray(item.ruleFlags) ? [...item.ruleFlags] : [],
          tacticalBadges: Array.isArray(item.tacticalBadges) ? [...item.tacticalBadges] : [],
          notes: item.benefit || item.shortDescription || stripSpellHtml(item.description || item.desc) || '',
          expended: false
        };

        character.tomeOfBattle.maneuversKnown.push(newManeuver);

        const { maxReadied } = getInitiatorInfo();
        if (character.tomeOfBattle.readiedManeuvers.length < maxReadied) {
          character.tomeOfBattle.readiedManeuvers.push({ ...newManeuver });
        }

        saveStateToStorage(true);
        renderAll();
        renderSpellPickerResults();
        showDiceTopToast({
          icon: '⚔️',
          title: 'Maneuver Learned',
          breakdown: `"${item.name}" (${newManeuver.discipline} ${newManeuver.level}) added to your maneuver pool`,
          total: '+1 Maneuver'
        });
      } else if (type === 'Stance') {
        const initInfo = getInitiatorInfo();
        const sLvl = item.level !== undefined ? Number(item.level) : 1;
        if (!initInfo || !initInfo.hasClass || (initInfo.maxKnownStances || 0) <= 0) {
          showDiceTopToast({
            icon: '🔒',
            title: 'Martial Adept Required',
            breakdown: 'D&D 3.5e RAW (ToB p. 30): Requires a Martial Adept class (Crusader, Swordsage, Warblade) or the Martial Stance feat to learn stances.',
            total: 'Locked'
          });
          return;
        }
        if (sLvl > (initInfo.maxManeuverLvl || 0)) {
          showDiceTopToast({
            icon: '🔒',
            title: 'Initiator Level Too Low',
            breakdown: `Level ${sLvl} stances require Initiator Level ${sLvl * 2 - 1}+ (current IL: ${initInfo.il}).`,
            total: `Max Lvl ${initInfo.maxManeuverLvl}`
          });
          return;
        }
        if (!character.tomeOfBattle) character.tomeOfBattle = {};
        if (!Array.isArray(character.tomeOfBattle.stancesKnown)) character.tomeOfBattle.stancesKnown = [];

        if (character.tomeOfBattle.stancesKnown.length >= initInfo.maxKnownStances) {
          showDiceTopToast({
            icon: '⚠️',
            title: 'Stance Quota Full',
            breakdown: `Stances Known quota (${initInfo.maxKnownStances}) is full!`,
            total: `${character.tomeOfBattle.stancesKnown.length}/${initInfo.maxKnownStances}`
          });
          return;
        }

        const exists = character.tomeOfBattle.stancesKnown.some(st => (st.name || '').toLowerCase().trim() === name.toLowerCase().trim());
        if (exists) {
          alert('This stance is already in your known stances list.');
          return;
        }

        const v2StanceDice = (Array.isArray(item.damageParts) && item.damageParts[0]?.dice) || item.damageDice || undefined;
        character.tomeOfBattle.stancesKnown.push({
          id: item.id || ('tob_stance_' + String(item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')),
          schemaVersion: 2,
          name: item.name,
          level: item.level !== undefined ? Number(item.level) : 1,
          discipline: item.discipline || item.school || 'Iron Heart',
          prereq: item.prereq || 'None',
          source: item.source || 'ToB',
          damageDice: v2StanceDice,
          damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : [],
          modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
          ruleFlags: Array.isArray(item.ruleFlags) ? [...item.ruleFlags] : [],
          tacticalBadges: Array.isArray(item.tacticalBadges) ? [...item.tacticalBadges] : [],
          benefit: item.benefit || item.shortDescription || stripSpellHtml(item.description || item.desc) || ''
        });

        saveStateToStorage(true);
        renderAll();
        renderSpellPickerResults();
        showDiceTopToast({
          icon: '🥋',
          title: 'Stance Learned',
          breakdown: `"${item.name}" (${item.discipline || 'Iron Heart'} ${item.level || 1}) added to your known stances`,
          total: '+1 Stance'
        });
      }
    }

    async function triggerSpellPickerAiSearch() {
      const q = (document.getElementById('spell-picker-search')?.value || '').trim();
      const type = window._currentSpellPickerType || 'Spell';
      if (!q) {
        alert('⚠️ Please enter a spell or maneuver name to search.');
        return;
      }

      const resultsBox = document.getElementById('spell-picker-results-container');
      if (!resultsBox) return;

      const apiKey = typeof RuleMaster !== 'undefined' ? RuleMaster.getApiKey() : (localStorage.getItem('gemini_api_key') || '');
      if (!apiKey) {
        alert('⚠️ Please configure a valid Google Gemini API key in Settings ⚙️ (top right) to search via Rule Master AI.');
        if (typeof openSettingsModal === 'function') openSettingsModal();
        return;
      }

      resultsBox.innerHTML = `
        <div class="p-5 bg-slate-950/90 border border-purple-500/50 rounded-xl text-center space-y-2.5 shadow-2xl">
          <div class="inline-block w-7 h-7 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <div class="text-xs font-bold text-purple-200">🧙‍♂️🤖 Rule Master (AI) Searching D&D 3.5e Compendiums...</div>
          <div id="spell-picker-ai-status" class="text-[11px] text-slate-400 font-mono">
            "${q}" (${type}) ➔ Scanning official D&D 3.5e sourcebooks...
          </div>
        </div>
      `;

      const statusEl = document.getElementById('spell-picker-ai-status');

      try {
        let rows = null;
        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchSingleAiRuleRows === 'function') {
          rows = await RuleMaster.fetchSingleAiRuleRows(q, type, apiKey, statusEl);
        } else {
          throw new Error('RuleMaster engine is not ready.');
        }

        if (!rows || !rows.length) {
          throw new Error(`No official rule entry found for "${q}".`);
        }

        const entries = RuleMaster.convertRowsToEntries(rows);
        entries.forEach(entry => {
          const exists = masterDb.some(m => (m.name || '').toLowerCase() === (entry.name || '').toLowerCase());
          if (!exists) {
            masterDb.push(entry);
          }
        });

        localStorage.setItem('dnd35_master_db', JSON.stringify(masterDb));
        renderSpellPickerResults();
        showDiceTopToast({
          icon: '✨',
          title: 'Rule Master',
          breakdown: `"${q}" found and saved to Master DB!`,
          total: '+1 Entry'
        });
      } catch (err) {
        resultsBox.innerHTML = `
          <div class="p-4 bg-rose-950/60 border border-rose-600 rounded-xl text-center space-y-2">
            <div class="text-rose-400 font-bold text-xs">⚠️ Rule Master Lookup Error</div>
            <p class="text-[11px] text-slate-300">${err.message || 'Could not fetch entry.'}</p>
            <button onclick="renderSpellPickerResults()" class="mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 px-3 rounded-lg border border-slate-700">Back to List</button>
          </div>
        `;
      }
    }

    // 14 Official Body Slot Definitions matching GSheet (Madde 6 & 8)
    const BODY_SLOT_DEFS = [
      { key: 'head', name: 'Head', trName: 'Head / Headband / Helm', icon: '👑', allowed: ['Head', 'Wondrous Item'] },
      { key: 'eyes', name: 'Eyes', trName: 'Eyes / Goggles / Lenses', icon: '👁️', allowed: ['Eyes', 'Wondrous Item'] },
      { key: 'neck', name: 'Neck', trName: 'Neck / Amulet / Periapt', icon: '📿', allowed: ['Neck', 'Wondrous Item'] },
      { key: 'shoulders', name: 'Shoulders', trName: 'Shoulders / Cloak / Cape', icon: '🧥', allowed: ['Shoulders', 'Wondrous Item'] },
      { key: 'armor', name: 'Armor', trName: 'Body Armor / Robe', icon: '🛡️', allowed: ['Armor'] },
      { key: 'torso', name: 'Torso', trName: 'Torso / Shirt / Vest', icon: '🦺', allowed: ['Torso'] },
      { key: 'belt', name: 'Belt', trName: 'Belt / Girdle / Waist', icon: '🪢', allowed: ['Belt', 'Wondrous Item'] },
      { key: 'bracers', name: 'Bracers', trName: 'Arms / Bracers / Wrists', icon: '🦾', allowed: ['Bracers', 'Wondrous Item'] },
      { key: 'gloves', name: 'Gloves', trName: 'Hands / Gloves / Gauntlets', icon: '🧤', allowed: ['Gloves', 'Wondrous Item'] },
      { key: 'ring1', name: 'Ring 1', trName: 'Left Ring', icon: '💍', allowed: ['Ring'] },
      { key: 'ring2', name: 'Ring 2', trName: 'Right Ring', icon: '💍', allowed: ['Ring'] },
      { key: 'boots', name: 'Boots', trName: 'Feet / Boots / Shoes', icon: '👢', allowed: ['Boots', 'Wondrous Item'] },
      { key: 'mainHand', name: 'Main Hand', trName: 'Main Hand / Primary Weapon', icon: '⚔️', allowed: ['Weapon'] },
      { key: 'offHand', name: 'Off-Hand/Shield', trName: 'Off-Hand / Shield', icon: '🛡️', allowed: ['Weapon', 'Shield'] }
    ];

    // Helper: Match and resolve base items against official Core D&D 3.5e Catalog (BUNDLED_SRD_CORE_CATALOG)
    function findBaseItemInSrdCore(rawName) {
      if (!rawName || typeof rawName !== 'string') return null;
      const catalog = window.BUNDLED_SRD_CORE_CATALOG || [];
      if (!Array.isArray(catalog) || catalog.length === 0) return null;

      // 1. Temizleme (Enhancement ve Malzeme Ön/Son Ekleri)
      let cleaned = rawName
        .replace(/\+\d+/g, '')
        .replace(/\b(?:masterwork|mwk|flaming|frost|shock|shocking|keen|holy|unholy|vicious|defending|anarchic|axiomatic|speed|vorpal|ghost touch|wounding|bane|throwing|returning|spell resistance \d+|fortification|slick|shadow|silent moves|glamered)\b/gi, '')
        .replace(/\b(?:adamantine|mithral|mithril|alchemical silver|silver|cold iron|darkwood|dragonhide)\b/gi, '')
        .replace(/[\(\)\[\],]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      if (!cleaned) return null;

      // 2. Tam Eşleşme (Exact Match)
      const exact = catalog.find(c => (c.name || '').toLowerCase() === cleaned);
      if (exact) return exact;

      // 3. Uzunluk Sıralı En Uygun Eşleşme (Longest Match First, e.g. "Punching Dagger" before "Dagger")
      const candidates = catalog
        .filter(c => {
          const cName = (c.name || '').toLowerCase();
          return cName && (cleaned === cName || cleaned.endsWith(' ' + cName) || cleaned.startsWith(cName + ' ') || cleaned.includes(' ' + cName + ' ') || cleaned.includes(cName));
        })
        .sort((a, b) => (b.name || '').length - (a.name || '').length);

      if (candidates.length > 0) return candidates[0];
      return null;
    }

    // D&D 3.5e RAW Inventory & Slot Validators (Master DB as Single Source of Truth)
    function isConsumableOrSlotless(item) {
      if (!item) return false;
      const cat = (item.category || '').toLowerCase().trim();
      const slot = (item.slot || '').toLowerCase().trim();
      const name = (item.name || '').toLowerCase().trim();

      // KESİN KURAL 1: Silah, Zırh veya Kalkan asla sarf malzemesi / tüketilebilir OLAMAZ!
      if (cat === 'weapon' || cat === 'armor' || cat === 'shield') return false;
      if (slot === 'main hand' || slot === 'off hand' || slot === 'two-handed' || slot === 'both hands' || slot === 'armor' || slot === 'shield' || slot === 'off-hand/shield') return false;

      // KESİN KURAL 2: BUNDLED_SRD_CORE_CATALOG içinde Weapon, Armor veya Shield ise tüketilebilir olamaz!
      const baseMatch = typeof findBaseItemInSrdCore === 'function' ? findBaseItemInSrdCore(item.name) : null;
      if (baseMatch && ['weapon', 'armor', 'shield'].includes((baseMatch.type || '').toLowerCase())) {
        return false;
      }

      // Check Master DB if available
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const cleanName = (item.masterDbName || item.name || '').toLowerCase().trim();
        const m = masterDb.find(e => (e.name || '').toLowerCase().trim() === cleanName);
        if (m) {
          const mSlot = (m.slot || '').toLowerCase().trim();
          const mType = (m.type || '').toLowerCase().trim();
          if (['weapon', 'armor', 'shield', 'ring'].includes(mType)) return false;
          if (mType.includes('potion') || mType.includes('scroll') || mType.includes('wand') || mType.includes('consumable')) return true;
        }
      }

      // Yalnızca gerçek sarf malzemeleri tüketilebilirdir
      if (cat === 'consumable' || cat === 'scroll' || cat === 'potion' || cat === 'wand') return true;
      if (slot === 'consumable') return true;
      if (name.startsWith('scroll of') || name.startsWith('potion of') || name.startsWith('wand of') || name.startsWith('elixir of') || name.startsWith('oil of')) return true;
      if (name.includes('parşömen') || name.includes('iksir') || name.includes('asa ') || name.includes('yağı ')) return true;
      return false;
    }

    function getValidSlotForItem(item) {
      if (!item || isConsumableOrSlotless(item)) return null;

      // 0. BUNDLED_SRD_CORE_CATALOG ile temel eşya yuvasını belirle
      const baseMatch = typeof findBaseItemInSrdCore === 'function' ? findBaseItemInSrdCore(item.name) : null;
      if (baseMatch) {
        const bType = (baseMatch.type || '').toLowerCase();
        const bSlot = (baseMatch.slot || '').toLowerCase();
        if (bType === 'weapon' || bSlot.includes('main hand') || bSlot.includes('two-hand')) return 'mainHand';
        if (bType === 'shield' || bSlot.includes('shield') || bSlot.includes('off-hand')) return 'offHand';
        if (bType === 'armor' || bSlot === 'armor') return 'armor';
      }

      let rawSlot = (item.slot || '').toLowerCase().trim();
      let rawType = (item.category || '').toLowerCase().trim();

      // 1. Consult Master DB first
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const cleanName = (item.masterDbName || item.name || '').toLowerCase().trim();
        const m = masterDb.find(e => (e.name || '').toLowerCase().trim() === cleanName);
        if (m) {
          if (m.slot && m.slot !== 'None' && m.slot !== 'Slotless' && m.slot !== '-') {
            rawSlot = m.slot.toLowerCase().trim();
          }
          if (m.type) {
            rawType = m.type.toLowerCase().trim();
          }
        }
      }

      // 2. Weapons & Shields
      if (rawType.includes('weapon') || rawSlot.includes('main hand') || rawSlot.includes('two-hand') || rawSlot.includes('both hands')) {
        return 'mainHand';
      }
      if (rawType.includes('shield') || rawSlot.includes('shield') || rawSlot.includes('off-hand')) {
        return 'offHand';
      }

      // 3. Official 12 Worn Slots
      if (rawSlot.includes('head') || rawSlot.includes('helm') || rawType === 'head') return 'head';
      if (rawSlot.includes('eyes') || rawSlot.includes('face') || rawSlot.includes('goggles') || rawType === 'eyes') return 'eyes';
      if (rawSlot.includes('neck') || rawSlot.includes('throat') || rawSlot.includes('amulet') || rawSlot.includes('periapt') || rawType === 'neck') return 'neck';
      if (rawSlot.includes('shoulder') || rawSlot.includes('cloak') || rawSlot.includes('cape') || rawType === 'shoulders') return 'shoulders';
      if (rawSlot === 'armor' || rawSlot.includes('body armor') || rawType === 'armor') return 'armor';
      if (rawSlot === 'torso' || rawSlot.includes('vest') || rawSlot.includes('shirt') || rawType === 'torso') return 'torso';
      if (rawSlot.includes('belt') || rawSlot.includes('waist') || rawType === 'belt') return 'belt';
      if (rawSlot.includes('bracer') || rawSlot.includes('arm') || rawType === 'bracers') return 'bracers';
      if (rawSlot.includes('glove') || rawSlot.includes('gauntlet') || rawSlot.includes('hand') || rawType === 'gloves') return 'gloves';
      if (rawSlot.includes('ring') || rawType.includes('ring')) return 'ring1';
      if (rawSlot.includes('boot') || rawSlot.includes('feet') || rawType === 'boots') return 'boots';

      // 4. Fallback based on specific item names (e.g. if categorized generically as 'Wondrous Item')
      const nameLower = (item.name || '').toLowerCase();
      if (nameLower.includes('cloak') || nameLower.includes('cape') || nameLower.includes('mantle')) return 'shoulders';
      if (nameLower.includes('boot') || nameLower.includes('shoes') || nameLower.includes('slippers')) return 'boots';
      if (nameLower.includes('helm') || nameLower.includes('circlet') || nameLower.includes('hat') || nameLower.includes('crown') || nameLower.includes('headband')) return 'head';
      if (nameLower.includes('goggles') || nameLower.includes('lenses') || nameLower.includes('glasses') || nameLower.includes('mask')) return 'eyes';
      if (nameLower.includes('amulet') || nameLower.includes('necklace') || nameLower.includes('periapt') || nameLower.includes('medallion') || nameLower.includes('collar')) return 'neck';
      if (nameLower.includes('belt') || nameLower.includes('girdle') || nameLower.includes('sash')) return 'belt';
      if (nameLower.includes('bracers') || nameLower.includes('armbands')) return 'bracers';
      if (nameLower.includes('gauntlets') || nameLower.includes('gloves')) return 'gloves';
      if (nameLower.includes('vest') || nameLower.includes('shirt') || nameLower.includes('vestment') || nameLower.includes('tunic')) return 'torso';
      if (nameLower.includes('ring')) return 'ring1';

      return null;
    }

    function sanitizeBodySlots(charObj) {
      if (!charObj || !charObj.bodySlots) return false;
      let fixed = false;
      Object.keys(charObj.bodySlots).forEach(slotKey => {
        const slot = charObj.bodySlots[slotKey];
        if (slot && slot.name && slot.name !== '-') {
          if (isConsumableOrSlotless(slot)) {
            console.warn(`[3.5e Rule Audit] Invalid equipped item '${slot.name}' (${slotKey}) unequipped and moved to backpack.`);
            if (!Array.isArray(charObj.gearPool)) charObj.gearPool = [];
            const existsInPool = charObj.gearPool.some(p => (p.name || '').toLowerCase().trim() === (slot.name || '').toLowerCase().trim());
            if (!existsInPool) {
              charObj.gearPool.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                name: slot.name,
                masterDbName: slot.masterDbName || slot.name,
                category: 'Consumable',
                slot: 'Consumable',
                qty: 1,
                weight: Number(slot.weight) || 0,
                cost: Number(slot.cost) || 0,
                desc: slot.desc || '',
                isBelt: true,
                isEquipped: false
              });
            } else {
              const pItem = charObj.gearPool.find(p => (p.name || '').toLowerCase().trim() === (slot.name || '').toLowerCase().trim());
              if (pItem) pItem.isEquipped = false;
            }
            charObj.bodySlots[slotKey] = { name: '-', active: false, weight: 0, cost: 0, desc: '' };
            fixed = true;
          }
        }
      });
      return fixed;
    }

    // Abilities Grid & Bio Summary
    function renderAbilities() {
      if (!character) return;

      // Bio summary
      if (document.getElementById('core-name')) document.getElementById('core-name').textContent = character.name || 'Unnamed Hero';
      if (document.getElementById('core-race')) document.getElementById('core-race').textContent = character.race || 'No Race Selected';
      if (document.getElementById('core-classes')) document.getElementById('core-classes').textContent = (character.classes || 'No Class Selected') + ` • Level ${character.level || 1}`;
      if (document.getElementById('core-bab')) document.getElementById('core-bab').textContent = '+' + (character.bab || 0);
      if (document.getElementById('core-speed')) document.getElementById('core-speed').textContent = (character.effectiveSpeed || character.baseSpeed || 30) + ' ft';
      if (document.getElementById('core-hd')) document.getElementById('core-hd').textContent = character.hitDie || '-';

      // Ability scores
      const container = document.getElementById('abilities-grid');
      if (container) {
        container.innerHTML = '';
        const stats = [
          { key: 'str', label: 'STR' },
          { key: 'dex', label: 'DEX' },
          { key: 'con', label: 'CON' },
          { key: 'int', label: 'INT' },
          { key: 'wis', label: 'WIS' },
          { key: 'cha', label: 'CHA' }
        ];

        stats.forEach(s => {
          const score = Number(character.abilities?.[s.key]) || 10;
          const base = Number(character.baseAbilities?.[s.key]) || score;
          const bonusDiff = score - base;
          const mod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
            ? RuleEngine.getAbilityMod(score)
            : Math.floor((score - 10) / 2);

          const sourcesList = Array.isArray(character.abilitySources?.[s.key]) ? character.abilitySources[s.key] : [];
          const sourceText = sourcesList
            .filter(src => src && (src.source || src.name))
            .map(src => {
              const srcName = src.source || src.name || 'Bonus';
              const val = src.val !== undefined ? src.val : (src.value !== undefined ? src.value : 0);
              return `${srcName} (${val >= 0 ? '+' + val : val})`;
            })
            .join(', ');

          const div = document.createElement('div');
          div.className = 'bg-slate-900 border border-slate-700 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-sm';
          if (sourceText) div.title = `Bonus Sources: ${sourceText}`;
          div.innerHTML = `
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400 uppercase">${s.label}</span>
              ${bonusDiff !== 0 ? `<span class="text-[9px] font-mono px-1 rounded ${bonusDiff > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}">${bonusDiff > 0 ? '+' + bonusDiff : bonusDiff}</span>` : ''}
            </div>
            <div class="text-xl sm:text-2xl font-black text-amber-400 font-mono my-0.5">${score}</div>
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">${mod >= 0 ? '+' : ''}${mod}</span>
              ${bonusDiff !== 0 ? `<span class="text-[9px] text-slate-500 font-sans">Taban: ${base}</span>` : ''}
            </div>
            ${sourceText ? `<div class="text-[9px] text-emerald-400/90 truncate mt-1 pt-1 border-t border-slate-800" title="${sourceText}">✨ ${sourceText}</div>` : ''}
          `;
          container.appendChild(div);
        });
      }

    }

    let currentViewedFeatName = null;
    let isFeatPickerForLevelUp = false;

    // Built-in D&D 3.5e Core, Tome of Battle & Complete Series Feat Catalog
    // (Empty: Dynamically sourced from window.BUNDLED_SRD_CORE_CATALOG & masterDb per Rule #5)
    const DND35_FEAT_CATALOG = [];

    // Built-in D&D 3.5e DM Boons, Grants & Campaign Awards (Kural 5 / RAW uyumlu: VarsayÄ±lan boÅŸ, masterDb Ã¼zerinden dinamik beslenir)
    const DND35_DM_BOONS_CATALOG = [];

    // Built-in D&D 3.5e Flaws (Kural 5 / RAW uyumlu: VarsayÄ±lan boÅŸ, masterDb Ã¼zerinden dinamik beslenir)
    const DND35_FLAWS_CATALOG = [];

    // Built-in D&D 3.5e Warlock Invocations (Complete Arcane & Complete Mage)
    // (Empty: Dynamically sourced from window.BUNDLED_SRD_CORE_CATALOG & masterDb per Rule #5)
    const DND35_WARLOCK_INVOCATIONS = [];

    function getAllWarlockInvocations() {
      const map = new Map();
      if (typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) {
        window.SrdCompendium.getAllLoaded().filter(i => i && i.category === 'Warlock Invocation').forEach(inv => {
          map.set((inv.name || '').toLowerCase(), {
            ...inv,
            prereq: inv.prerequisites || inv.prereq || (`Warlock Level ${inv.minLevel || 1}`),
            benefit: inv.shortDescription || inv.benefit || inv.description || ''
          });
        });
      }
      if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        window.BUNDLED_SRD_CORE_CATALOG.filter(i => i && (i.category === 'Warlock Invocation' || (i.type === 'Special Ability' && i.category === 'Warlock Invocation'))).forEach(inv => {
          const k = (inv.name || '').toLowerCase();
          if (k && !map.has(k)) map.set(k, inv);
        });
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        masterDb.filter(i => i && (i.category === 'Warlock Invocation' || (i.type === 'Special Ability' && i.category === 'Warlock Invocation'))).forEach(inv => {
          const k = (inv.name || '').toLowerCase();
          if (k && !map.has(k)) {
            map.set(k, inv);
          }
        });
      }
      if (typeof DND35_WARLOCK_INVOCATIONS !== 'undefined' && Array.isArray(DND35_WARLOCK_INVOCATIONS)) {
        DND35_WARLOCK_INVOCATIONS.forEach(inv => {
          const k = (inv.name || '').toLowerCase();
          if (k && !map.has(k)) {
            map.set(k, inv);
          }
        });
      }
      return Array.from(map.values());
    }

    function isWarlockInvocationLevel(level) {
      const l = Number(level);
      return [1, 2, 4, 6, 8, 10, 11, 13, 16, 18, 20].includes(l);
    }

    function getWarlockMaxTierForLevel(level) {
      const l = Number(level);
      if (l >= 16) return 'Dark';
      if (l >= 11) return 'Greater';
      if (l >= 6) return 'Lesser';
      return 'Least';
    }

    function isWarlockEnabledForLevel(levelIdx = null) {
      if (!character) return false;
      // 1. Check if Warlock Boon is active via settings, casterType or character boons
      const clMode = character.settings?.clMode || '';
      const cType = character.settings?.casterType || '';
      const hasWarlockBoon = character.settings?.warlockBoon === true || 
        cType === 'warlock' ||
        clMode.includes('Warlock Boon') ||
        (character.boons && character.boons.some(b => String(b.name || b).toLowerCase().includes('warlock')));
      if (hasWarlockBoon) return true;

      // 2. Check if Warlock class level was taken
      const prog = character.levelProgression || [];
      if (levelIdx !== null && levelIdx !== undefined && levelIdx >= 0 && levelIdx < prog.length) {
        // If checking a specific level row in progression, check if Warlock was taken at or before this level
        for (let i = 0; i <= levelIdx; i++) {
          if ((prog[i]?.className || '').toLowerCase() === 'warlock') return true;
        }
        return false;
      }

      // Check if character has taken any Warlock level in progression or classes
      const hasWarlockProg = prog.some(p => (p.className || '').toLowerCase() === 'warlock');
      const hasWarlockClass = typeof character.classes === 'string' 
        ? character.classes.toLowerCase().includes('warlock') 
        : (Array.isArray(character.classes) && character.classes.some(c => (typeof c === 'string' ? c : (c?.name || '')).toLowerCase() === 'warlock'));
      return Boolean(hasWarlockProg || hasWarlockClass);
    }

    function updateQuickFeatCategoryWarlockState(levelIdx = null) {
      const opt = document.getElementById('quick-feat-opt-warlock') || document.querySelector('#quick-feat-category option[value="Warlock Invocation"]');
      if (!opt) return;

      const isAllowed = isWarlockEnabledForLevel(levelIdx);
      if (isAllowed) {
        opt.disabled = false;
        opt.textContent = "🔮 Warlock Invocation";
        opt.title = "Warlock Invocations";
      } else {
        opt.disabled = true;
        opt.textContent = "🔮 Warlock Invocation (Locked: Requires Warlock Level or Boon)";
        opt.title = "Requires at least 1 Warlock class level or the 'Warlock Boon' CL rule.";
      }
    }

    function isLevelQualifiesForFeat(level, mode) {
      if (mode === 'Every 2 Levels (1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20)') {
        return level === 1 || (level % 2 === 0);
      } else if (mode === 'Every 4 Levels (1, 4, 8, 12, 16, 20)') {
        return level === 1 || (level % 4 === 0);
      } else if (mode === 'All Free / Custom') {
        return true;
      } else {
        // Standard 3.5e (1, 3, 6, 9, 12, 15, 18)
        return level === 1 || (level % 3 === 0);
      }
    }

    function calculateSorcererSlots(sorcererLvl, chaScore, existingSlots = null) {
      const prevSlots = Array.isArray(existingSlots) ? existingSlots : (Array.isArray(character?.spellcasting?.slots) ? character.spellcasting.slots : []);
      if (character?.isNpc && prevSlots.length > 0) {
        return prevSlots;
      }
      if (Number(sorcererLvl) <= 0) {
        if (character?.isNpc && Array.isArray(character?.spellcasting?.slots) && character.spellcasting.slots.length > 0) {
          return character.spellcasting.slots;
        }
        return prevSlots.filter(s => (Number(s.daily) || 0) > 0);
      }
      const clampedLvl = Math.min(20, Math.max(1, Number(sorcererLvl) || 1));
      const chaMod = Math.floor(((Number(chaScore) || 10) - 10) / 2);
      const basePerLvl = {
        1:  [5, 3],
        2:  [6, 4],
        3:  [6, 5],
        4:  [6, 6, 3],
        5:  [6, 6, 4],
        6:  [6, 6, 5, 3],
        7:  [6, 6, 6, 4],
        8:  [6, 6, 6, 5, 3],
        9:  [6, 6, 6, 6, 4],
        10: [6, 6, 6, 6, 5, 3],
        11: [6, 6, 6, 6, 6, 4],
        12: [6, 6, 6, 6, 6, 5, 3],
        13: [6, 6, 6, 6, 6, 6, 4],
        14: [6, 6, 6, 6, 6, 6, 5, 3],
        15: [6, 6, 6, 6, 6, 6, 6, 4],
        16: [6, 6, 6, 6, 6, 6, 6, 5, 3],
        17: [6, 6, 6, 6, 6, 6, 6, 6, 4],
        18: [6, 6, 6, 6, 6, 6, 6, 6, 5, 3],
        19: [6, 6, 6, 6, 6, 6, 6, 6, 6, 4],
        20: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
      };
      const knownPerLvl = {
        1:  [4, 2],
        2:  [5, 2],
        3:  [5, 3],
        4:  [6, 3, 1],
        5:  [6, 4, 2],
        6:  [7, 4, 2, 1],
        7:  [7, 5, 3, 2],
        8:  [8, 5, 3, 2, 1],
        9:  [8, 5, 4, 3, 2],
        10: [9, 5, 4, 3, 2, 1],
        11: [9, 5, 5, 3, 2, 2],
        12: [9, 5, 5, 4, 3, 2, 1],
        13: [9, 5, 5, 4, 3, 2, 2],
        14: [9, 5, 5, 4, 4, 3, 2, 1],
        15: [9, 5, 5, 4, 4, 3, 2, 2],
        16: [9, 5, 5, 4, 4, 3, 3, 2, 1],
        17: [9, 5, 5, 4, 4, 3, 3, 2, 2],
        18: [9, 5, 5, 4, 4, 3, 3, 3, 2, 1],
        19: [9, 5, 5, 4, 4, 3, 3, 3, 3, 2],
        20: [9, 5, 5, 4, 4, 3, 3, 3, 3, 3]
      };
      const base = basePerLvl[clampedLvl] || [6, 6, 4];
      const knownArr = knownPerLvl[clampedLvl] || [6, 4, 2];
      const names = ['Cantrip', '1st Level', '2nd Level', '3rd Level', '4th Level', '5th Level', '6th Level', '7th Level', '8th Level', '9th Level'];
      const result = base.map((dailyBase, spellLvl) => {
        let bonus = 0;
        if (spellLvl > 0 && chaMod >= spellLvl) {
          bonus = 1 + Math.floor((chaMod - spellLvl) / 4);
        }
        const prev = prevSlots.find(s => Number(s.level) === spellLvl);
        const dmBonus = prev ? (Number(prev.dmBonus) || 0) : 0;
        const knownBonus = prev ? (Number(prev.knownBonus) || 0) : 0;
        const dailyTotal = Math.max(0, dailyBase + bonus + dmBonus);
        const usedVal = prev ? Math.min(dailyTotal, Math.max(0, Number(prev.used) || 0)) : 0;
        const baseKnown = knownArr[spellLvl] ?? (spellLvl === 0 ? 4 : 1);
        const knownTotal = Math.max(0, baseKnown + knownBonus);
        return {
          level: spellLvl,
          name: names[spellLvl] || `Level ${spellLvl}`,
          known: knownTotal,
          knownBonus: knownBonus,
          daily: dailyTotal,
          dmBonus: dmBonus,
          used: usedVal
        };
      });
      // Retain custom unlocked higher-level slots
      if (Array.isArray(prevSlots)) {
        prevSlots.forEach(prev => {
          if (prev && Number(prev.level) >= base.length) {
            result.push({
              level: Number(prev.level),
              name: names[prev.level] || `Level ${prev.level}`,
              known: Number(prev.known) || Number(prev.daily) || 0,
              knownBonus: Number(prev.knownBonus) || 0,
              daily: Number(prev.daily) || 0,
              dmBonus: Number(prev.dmBonus) || 0,
              used: Math.min(Number(prev.daily) || 0, Number(prev.used) || 0)
            });
          }
        });
      }
      return result;
    }
    function onSettingFeatModeChange() {
      if (!character) return;
      if (!character.settings) character.settings = {};
      const sel = document.getElementById('setting-feat-mode');
      if (sel) {
        character.settings.featMode = sel.value;
        saveStateToStorage(true);
        renderLevelProgression();
      }
    }

    function applyCasterLevelRule() {
      if (!character) return;
      if (character.isNpc) {
        // Monster/NPC CL and slots are protected from progression table resets
        if (character.spellcasting && (character.spellcasting.cl !== undefined || character.spellcasting.caster_level !== undefined)) {
          const rawCl = Number(character.spellcasting.cl ?? character.spellcasting.caster_level) || 0;
          character.spellcasting.cl = rawCl;
          if (!Array.isArray(character.spellcasting.slots) || character.spellcasting.slots.length === 0) {
            const statKey = character.spellcasting.statName || character.spellcasting.ability?.toUpperCase() || 'CHA';
            const chaVal = character.stats?.[statKey]?.value ?? character.abilities?.[statKey.toLowerCase()] ?? 10;
            character.spellcasting.slots = calculateSorcererSlots(rawCl, chaVal, character.spellcasting.slots);
          }
        }
        return;
      }
      if (!character.settings) character.settings = {};
      const clMode = character.settings.clMode || 'Class Level';
      const cType = character.settings.casterType || 'spontaneous';
      const isBoon = clMode === 'Character Level (DM Boon)' || clMode.includes('Warlock Boon');
      const prog = character.levelProgression || [];
      const activeLevels = prog.filter(p => p.active !== false).length || Number(character.level) || 6;
      const hasProg = prog.some(p => p.active !== false);

      const sorcLvls = hasProg ? prog.filter(p => p.className === 'Sorcerer' && p.active !== false).length : ((character.classes || '').includes('Sorcerer') ? 5 : 0);
      const martialLvls = hasProg ? prog.filter(p => ['Warblade', 'Swordsage', 'Crusader'].includes(p.className) && p.active !== false).length : ((character.classes || '').includes('Warblade') ? 1 : 0);
      const otherLvls = activeLevels - martialLvls;

      if (character.spellcasting) {
        if (isBoon) {
          if (cType === 'martial') {
            character.spellcasting.cl = sorcLvls;
          } else {
            character.spellcasting.cl = activeLevels;
          }
        } else {
          character.spellcasting.cl = sorcLvls;
        }
        const chaVal = character.stats?.CHA?.value ?? character.abilities?.cha ?? 22;
        if (sorcLvls > 0) {
          character.spellcasting.slots = calculateSorcererSlots(sorcLvls, chaVal, character.spellcasting.slots);
        } else {
          character.spellcasting.slots = (character.spellcasting.slots || []).filter(s => (Number(s.dmBonus) || 0) > 0);
        }
      }

      if (character.tomeOfBattle) {
        if (isBoon && cType === 'martial') {
          character.tomeOfBattle.initiatorLevel = activeLevels;
        } else {
          character.tomeOfBattle.initiatorLevel = Math.max(1, martialLvls + Math.floor(otherLvls / 2));
        }
      }
    }

    function updateCasterTypeUIState() {
      const clModeSel = document.getElementById('setting-cl-mode');
      const casterTypeSel = document.getElementById('setting-caster-type');
      const casterTypeWrapper = document.getElementById('setting-caster-type-wrapper');
      const casterTypeHint = document.getElementById('setting-caster-type-hint');
      if (!clModeSel || !casterTypeSel) return;

      const clMode = clModeSel.value || '';
      const isBoon = clMode === 'Character Level (DM Boon)' || clMode.includes('Warlock Boon');

      if (!isBoon) {
        casterTypeSel.disabled = true;
        casterTypeSel.classList.add('opacity-50', 'cursor-not-allowed', 'bg-slate-900/60');
        if (casterTypeWrapper) {
          casterTypeWrapper.classList.add('opacity-60');
        }
        if (casterTypeHint) {
          casterTypeHint.textContent = 'RAW: Auto-detected from Class';
          casterTypeHint.className = 'text-[9px] font-mono text-emerald-400 font-bold transition';
        }
        const autoDisc = resolvePreferredMagicDiscipline(character);
        if (autoDisc && casterTypeSel.querySelector(`option[value="${autoDisc}"]`)) {
          casterTypeSel.value = autoDisc;
        }
      } else {
        casterTypeSel.disabled = false;
        casterTypeSel.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-slate-900/60');
        if (casterTypeWrapper) {
          casterTypeWrapper.classList.remove('opacity-60');
        }
        if (casterTypeHint) {
          casterTypeHint.textContent = 'DM Boon Override';
          casterTypeHint.className = 'text-[9px] font-mono text-indigo-300/70 transition';
        }
        const boonSelectVal = (character?.settings?.casterTypeExplicit === true && character?.settings?.casterType)
          ? character.settings.casterType
          : (resolvePreferredMagicDiscipline(character) || character?.settings?.casterType || 'spontaneous');
        if (boonSelectVal && casterTypeSel.querySelector(`option[value="${boonSelectVal}"]`)) {
          casterTypeSel.value = boonSelectVal;
        }
      }
    }
    function onSettingClModeChange() {
      if (!character) return;
      if (!character.settings) character.settings = {};
      const sel = document.getElementById('setting-cl-mode');
      if (sel) {
        character.settings.clMode = sel.value;
        const isWarlock = sel.value.includes('Warlock Boon');
        character.settings.warlockBoon = isWarlock;

        if (isWarlock) {
          character.settings.casterType = 'warlock';
          character.settings.casterTypeExplicit = true;
          const typeSel = document.getElementById('setting-caster-type');
          if (typeSel) typeSel.value = 'warlock';
        } else if (character.settings.casterType === 'warlock') {
          character.settings.casterTypeExplicit = false;
          const autoDisc = resolvePreferredMagicDiscipline(character) || 'spontaneous';
          character.settings.casterType = autoDisc;
          const typeSel = document.getElementById('setting-caster-type');
          if (typeSel) typeSel.value = autoDisc;
        } else if (sel.value === 'Character Level (DM Boon)' && !character.settings.casterTypeExplicit) {
          const autoDisc = resolvePreferredMagicDiscipline(character) || 'spontaneous';
          character.settings.casterType = autoDisc;
          const typeSel = document.getElementById('setting-caster-type');
          if (typeSel) typeSel.value = autoDisc;
        }

        window._userManualMagicDiscipline = null;
        delete character._preferredMagicDiscipline;
        updateCasterTypeUIState();
        applyCasterLevelRule();
        autoSelectMagicDisciplineTab(character, true);
        saveStateToStorage(true);
        if (typeof updateQuickFeatCategoryWarlockState === 'function') {
          updateQuickFeatCategoryWarlockState();
        }
        renderSpellSlots();
        renderKnownSpells();
        renderLevelProgression();
      }
    }

    function onSettingCasterTypeChange() {
      if (!character) return;
      if (!character.settings) character.settings = {};
      const sel = document.getElementById('setting-caster-type');
      if (sel) {
        const cType = sel.value;
        character.settings.casterType = cType;
        character.settings.casterTypeExplicit = true;

        const clSel = document.getElementById('setting-cl-mode');
        if (cType === 'warlock') {
          character.settings.warlockBoon = true;
          if (clSel && !clSel.value.includes('Warlock Boon')) {
            clSel.value = 'Warlock Boon (Invocations & Eldritch Blast)';
            character.settings.clMode = clSel.value;
          }
        } else {
          if (clSel && clSel.value.includes('Warlock Boon')) {
            clSel.value = 'Character Level (DM Boon)';
            character.settings.clMode = clSel.value;
            character.settings.warlockBoon = false;
          }
        }

        window._userManualMagicDiscipline = null;
        delete character._preferredMagicDiscipline;
        updateCasterTypeUIState();
        applyCasterLevelRule();
        autoSelectMagicDisciplineTab(character, true);
        saveStateToStorage(true);
        if (typeof updateQuickFeatCategoryWarlockState === 'function') {
          updateQuickFeatCategoryWarlockState();
        }
        renderSpellSlots();
        renderKnownSpells();
        renderLevelProgression();
      }
    }

    function onSettingIgnoreAsfChange() {
      if (!character) return;
      if (!character.settings) character.settings = {};
      const chk = document.getElementById('setting-ignore-asf');
      if (chk) {
        character.settings.ignoreAsf = chk.checked;
        saveStateToStorage(true);
        renderSpellSlots();
      }
    }

    function onSettingBabSaveSystemChange() {
      if (!character) return;
      if (!character.settings) character.settings = {};
      const sel = document.getElementById('setting-bab-save-system');
      if (sel) {
        character.settings.babSaveSystem = sel.value;
        recalculateCharacterClassSummary();
        saveStateToStorage(true);
        renderLevelProgression();
        renderAll();
      }
    }

    function sanitizeLevelProgressionActiveGaps() {
      if (!character || !Array.isArray(character.levelProgression)) return;
      const prog = character.levelProgression;
      let foundInactive = false;
      prog.forEach((p, idx) => {
        if (idx === 0) {
          p.active = true;
          return;
        }
        if (p.active === false) {
          foundInactive = true;
        } else if (foundInactive) {
          p.active = false;
        }
      });
    }

    function recalculateCharacterClassSummary() {
      if (!character) return;
      sanitizeLevelProgressionActiveGaps();
      const prog = character.levelProgression || [];

      // D&D 3.5e RAW: 1. Seviye her zaman sınıfının tam (maksimum) can zarını alır (PHB s. 22)
      if (prog.length > 0 && prog[0]) {
        const firstClass = prog[0].className;
        const allDefs = (typeof getAvailableClassDefs === 'function') ? getAvailableClassDefs() : {};
        const firstDef = allDefs[firstClass] || ((typeof DND35_CLASS_DEFS !== 'undefined') ? DND35_CLASS_DEFS[firstClass] : null);
        if (firstDef && firstDef.hd && Number(prog[0].hpGain) !== Number(firstDef.hd)) {
          const diff = Number(firstDef.hd) - (Number(prog[0].hpGain) || 0);
          prog[0].hpGain = firstDef.hd;
          prog[0].hd = `d${firstDef.hd}`;
          if (character.hp) {
            const sumHp = prog.filter(p => p.active !== false).reduce((acc, p) => acc + (Number(p.hpGain) || 0), 0);
            if (sumHp > 0) {
              character.hp.baseMax = sumHp;
              character.hp.max = sumHp + (Number(character.hp.conBonusHp) || 0);
              if (prog[0].active !== false && diff > 0) {
                character.hp.current = (Number(character.hp.current) || 0) + diff;
              }
            }
          }
          saveStateToStorage(false);
        }
      }

      const sys = character.settings?.babSaveSystem || 'standard';
      const isHuman = (character.race || '').toLowerCase().includes('human');
      const intMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
        ? RuleEngine.getAbilityMod(character.abilities?.int || 10)
        : Math.floor(((character.abilities?.int || 10) - 10) / 2);

      const summary = (typeof RuleEngine !== 'undefined' && RuleEngine.calculateProgression)
        ? RuleEngine.calculateProgression(prog, { system: sys, isHuman, intMod })
        : null;

      if (summary) {
        character.level = summary.activeLevels || 1;
        const classParts = Object.entries(summary.classCounts || {}).map(([c, count]) => `${c} ${count}`);
        if (classParts.length > 0) {
          character.classes = classParts.join(' / ');
        }

        character.bab = summary.baseBab || 0;

        if (!character.baseSaves) character.baseSaves = {};
        character.baseSaves.fort = summary.baseSaves.fort || 0;
        character.baseSaves.ref = summary.baseSaves.ref || 0;
        character.baseSaves.will = summary.baseSaves.will || 0;

        // Ensure each row in levelProgression has accurate cumulative BAB & Saves per D&D 3.5e RAW
        prog.forEach((lvl, idx) => {
          const rowSlice = prog.slice(0, idx + 1).map(p => ({ ...p, active: true }));
          const rowSummary = RuleEngine.calculateProgression(rowSlice, { system: sys, isHuman, intMod });
          if (rowSummary) {
            lvl.bab = rowSummary.baseBab;
            lvl.fort = rowSummary.baseSaves.fort;
            lvl.ref = rowSummary.baseSaves.ref;
            lvl.will = rowSummary.baseSaves.will;
          }
        });

        let toughnessCount = 0;
        (character.feats || []).forEach(f => {
          const fn = (typeof f === 'string' ? f : (f?.name || '')).toLowerCase();
          if (fn === 'toughness' || fn.includes('toughness')) toughnessCount++;
        });

        const conMod = (typeof RuleEngine !== 'undefined' && RuleEngine.getAbilityMod)
          ? RuleEngine.getAbilityMod(character.abilities?.con || 14)
          : Math.floor(((character.abilities?.con || 14) - 10) / 2);

        if (character.hp) {
          const oldMax = Number(character.hp.max) || 44;
          const oldCurrent = (character.hp.current !== undefined && character.hp.current !== null)
            ? Number(character.hp.current)
            : null;

          // 1. Permanently sanitize legacy base HP for initial 6 levels (must sum to at least 32)
          const prog = character.levelProgression || [];
          if (prog.length >= 6) {
            const sumFirst6 = prog.slice(0, 6).reduce((acc, p) => acc + (Number(p.hpGain) || 0), 0);
            if (sumFirst6 === 23) {
              if (prog[0]) prog[0].hpGain = 4;
              if (prog[1]) prog[1].hpGain = 4;
              if (prog[2]) prog[2].hpGain = 4;
              if (prog[3]) prog[3].hpGain = 4;
              if (prog[4]) prog[4].hpGain = 4;
              if (prog[5]) prog[5].hpGain = 12;
              if (summary) {
                summary.baseHp = prog.filter(p => p.active !== false).reduce((acc, p) => acc + (Number(p.hpGain) || 0), 0);
              }
            }
          }

          const baseProgHp = (summary && summary.baseHp) ? summary.baseHp : 32;
          character.hp.baseMax = baseProgHp + (toughnessCount * 3);
          character.hp.conBonusHp = character.level * conMod;
          
          let calculatedMax = character.hp.baseMax + character.hp.conBonusHp;
          // Guard: Toplam HP (Max HP) can NEVER drop when character level increases or stays same
          if (calculatedMax < oldMax && character.level >= 6) {
            calculatedMax = oldMax;
          }
          character.hp.max = calculatedMax;

          // Strict User Rule: "o anki hp sabit kalsın" (Current HP must remain constant unless at full health!)
          if (oldCurrent === null || isNaN(oldCurrent) || oldCurrent === oldMax) {
            character.hp.current = character.hp.max;
          } else {
            // Keep current HP exactly what it was, clamped only to new max HP if exceeded
            character.hp.current = Math.min(oldCurrent, character.hp.max);
          }
        }

        const sorcLvls = summary.classCounts ? (summary.classCounts['Sorcerer'] || 0) : 0;
        if (sorcLvls > 0 && typeof calculateSorcererSlots === 'function') {
          if (!character.spellcasting) character.spellcasting = {};
          if (character.settings?.clMode === 'Character Level (DM Boon)') {
            character.spellcasting.cl = character.level;
          } else {
            character.spellcasting.cl = sorcLvls;
          }
          const chaVal = character.stats?.CHA?.value ?? character.abilities?.cha ?? 22;
          character.spellcasting.slots = calculateSorcererSlots(sorcLvls, chaVal, character.spellcasting.slots);
        }
      }
      if (typeof autoSyncCharacterClassSkills === 'function') {
        autoSyncCharacterClassSkills(character);
      }
    }

    // D&D 3.5e Localized Class Name Aliases
    const DND35_CLASS_ALIASES = {
      "savaşçı": "Fighter", "fighter": "Fighter",
      "barbar": "Barbarian", "barbarian": "Barbarian",
      "hırsız": "Rogue", "rogue": "Rogue",
      "büyücü": "Wizard", "wizard": "Wizard",
      "sorcerer": "Sorcerer", "doğal büyücü": "Sorcerer",
      "rahip": "Cleric", "cleric": "Cleric",
      "paladin": "Paladin", "şövalye": "Paladin",
      "korucu": "Ranger", "ranger": "Ranger",
      "keşiş": "Monk", "monk": "Monk",
      "ozan": "Bard", "bard": "Bard",
      "druid": "Druid",
      "warblade": "Warblade", "savaş dehası": "Warblade",
      "crusader": "Crusader",
      "swordsage": "Swordsage",
      "duskblade": "Duskblade",
      "warlock": "Warlock",
      "abjurant champion": "Abjurant Champion",
      "eldritch knight": "Eldritch Knight",
      "bloodstorm blade": "Bloodstorm Blade",
      "arcane archer": "Arcane Archer",
      "assassin": "Assassin",
      "shadowdancer": "Shadowdancer",
      "dragon disciple": "Dragon Disciple",
      "mystic theurge": "Mystic Theurge",
      "dervish": "Dervish",
      "spellsword": "Spellsword",
      "jade phoenix mage": "Jade Phoenix Mage"
    };

    // Helper: Determine official class skills set for a character's combined classes (RAW Multiclass Rule)
    function getCharacterClassSkillsSet(char) {
      const classSkills = new Set();
      if (!char) return classSkills;

      const rawNames = new Set();
      if (Array.isArray(char.levelProgression)) {
        char.levelProgression.forEach(lp => {
          if (lp && lp.className) rawNames.add(String(lp.className).trim());
          else if (lp && lp.class) rawNames.add(String(lp.class).trim());
        });
      }

      const classStr = String(char.classes || char.class || '');
      classStr.split(/[\/\,\+\&\|]/).forEach(part => {
        const cleaned = part.replace(/\d+/g, '').trim();
        if (cleaned) rawNames.add(cleaned);
      });

      const classDefs = (typeof DND35_CLASS_DEFS !== 'undefined') ? DND35_CLASS_DEFS : DND35_BASE_CLASS_DEFS;

      rawNames.forEach(raw => {
        const lower = raw.toLowerCase();
        const canonical = DND35_CLASS_ALIASES[lower] || Object.keys(classDefs).find(k => k.toLowerCase() === lower) || raw;
        const def = classDefs[canonical];
        if (def && Array.isArray(def.classSkills)) {
          def.classSkills.forEach(sk => classSkills.add(sk));
        }
      });

      // Add Cleric Domain granted class skills (Trickery, Travel, Knowledge, Animal, Plant, Weather)
      if (typeof getCharacterClericDomains === 'function' && typeof DND35_CLERIC_DOMAINS === 'object') {
        const chosenDomains = getCharacterClericDomains(char);
        chosenDomains.forEach(domName => {
          const domDef = DND35_CLERIC_DOMAINS[domName];
          if (domDef && Array.isArray(domDef.classSkills)) {
            domDef.classSkills.forEach(sk => classSkills.add(sk));
          }
        });
      }

      return classSkills;
    }

    // Helper: Auto-sync official class skills
    function autoSyncCharacterClassSkills(char, forceAll = false) {
      if (!char) return;
      const classSkillsSet = getCharacterClassSkillsSet(char);
      if (classSkillsSet.size === 0) return;

      if (!Array.isArray(char.skills)) ensureAllSkills(char);

      char.skills.forEach(sk => {
        if (classSkillsSet.has(sk.key)) {
          sk.isClass = true;
        } else if (forceAll) {
          sk.isClass = false;
        }
      });
      char._classSkillsInitialized = true;
    }

    // D&D 3.5e Class Progression Reference Table & Dynamic Class System
    const DND35_BASE_CLASS_DEFS = {
      "Warblade": {
        classSkills: ["balance", "climb", "concentration", "craft_alchemy", "craft_armor", "craft_weapon", "diplomacy", "intimidate", "jump", "martial_lore", "swim"],
        hd: 12, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 4,
        type: 'Base Class', source: 'Tome of Battle', role: 'Martial Adept / Tank & Striker',
        description: 'Resilient d12 martial adept who combines tactical insight (INT) with Sublime Way maneuvers.'
      },
      "Fighter": {
        classSkills: ["climb", "craft_alchemy", "craft_armor", "craft_weapon", "handle_animal", "intimidate", "jump", "ride", "swim"],
        hd: 10, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 2,
        type: 'Base Class', source: "Player's Handbook", role: 'Martial / Feat Specialist',
        description: 'Versatile martial combatant who masters any weapon or fighting style through bonus combat feats.'
      },
      "Barbarian": {
        classSkills: ["climb", "craft_alchemy", "craft_armor", "craft_weapon", "handle_animal", "intimidate", "jump", "listen", "ride", "survival", "swim"],
        hd: 12, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 4,
        type: 'Base Class', source: "Player's Handbook", role: 'Martial / Berserker',
        description: 'Ferocious d12 warrior who channels primal Rage for massive Strength and Constitution boosts.'
      },
      "Rogue": {
        classSkills: ["appraise", "balance", "bluff", "climb", "craft_alchemy", "craft_armor", "craft_weapon", "decipher_script", "diplomacy", "disable_device", "disguise", "escape_artist", "forgery", "gather_information", "hide", "intimidate", "jump", "k_local", "listen", "move_silently", "open_lock", "perform", "profession", "search", "sense_motive", "sleight_of_hand", "spot", "swim", "tumble", "umd", "use_rope"],
        hd: 6, bab: 0.75, fort: "poor", ref: "good", will: "poor", skills: 8,
        type: 'Base Class', source: "Player's Handbook", role: 'Expert / Precision Damage',
        description: 'Skilled infiltrator and trapfinder who strikes vital weak points with deadly Sneak Attack dice.'
      },
      "Wizard": {
        classSkills: ["concentration", "craft_alchemy", "craft_armor", "craft_weapon", "decipher_script", "k_arcana", "k_arch", "k_dungeon", "k_geo", "k_history", "k_local", "k_nature", "k_nobility", "k_religion", "k_planes", "profession", "spellcraft"],
        hd: 4, bab: 0.5, fort: "poor", ref: "poor", will: "good", skills: 2,
        type: 'Base Class', source: "Player's Handbook", role: 'Arcane Caster (Prepared)',
        description: 'Scholarly arcane spellcaster who prepares versatile spells from a spellbook to bend reality.'
      },
      "Sorcerer": {
        classSkills: ["bluff", "concentration", "craft_alchemy", "craft_armor", "craft_weapon", "k_arcana", "profession", "spellcraft"],
        hd: 4, bab: 0.5, fort: "poor", ref: "poor", will: "good", skills: 2,
        type: 'Base Class', source: "Player's Handbook", role: 'Arcane Caster (Spontaneous)',
        description: 'Innate arcane spellcaster who casts spells spontaneously without advance preparation.'
      },
      "Cleric": {
        classSkills: ["concentration", "craft_alchemy", "craft_armor", "craft_weapon", "diplomacy", "heal", "k_arcana", "k_history", "k_religion", "k_planes", "profession", "spellcraft"],
        hd: 8, bab: 0.75, fort: "good", ref: "poor", will: "good", skills: 2,
        type: 'Base Class', source: "Player's Handbook", role: 'Divine Caster / Healer & Buffer',
        description: 'Devoted divine caster who channels positive or negative energy, turns undead, and wears heavy armor.'
      },
      "Paladin": {
        classSkills: ["concentration", "craft_alchemy", "craft_armor", "craft_weapon", "diplomacy", "handle_animal", "heal", "k_nobility", "k_religion", "profession", "ride", "sense_motive"],
        hd: 10, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 2,
        type: 'Base Class', source: "Player's Handbook", role: 'Divine Champion / Tank',
        description: 'Holy champion of law and good gifted with Smite Evil, Divine Grace, and Lay on Hands.'
      },
      "Ranger": {
        classSkills: ["climb", "concentration", "craft_alchemy", "craft_armor", "craft_weapon", "handle_animal", "heal", "hide", "jump", "k_dungeon", "k_geo", "k_nature", "listen", "move_silently", "profession", "ride", "search", "spot", "survival", "swim", "use_rope"],
        hd: 8, bab: 1.0, fort: "good", ref: "good", will: "poor", skills: 6,
        type: 'Base Class', source: "Player's Handbook", role: 'Martial / Scout & Hunter',
        description: 'Skilled hunter and tracker who excels against Favored Enemies with archery or two-weapon combat.'
      },
      "Monk": {
        classSkills: ["balance", "climb", "concentration", "craft_alchemy", "craft_armor", "craft_weapon", "diplomacy", "escape_artist", "hide", "jump", "k_arcana", "k_religion", "listen", "move_silently", "perform", "profession", "sense_motive", "spot", "swim", "tumble"],
        hd: 8, bab: 0.75, fort: "good", ref: "good", will: "good", skills: 4,
        type: 'Base Class', source: "Player's Handbook", role: 'Martial / Unarmed & Ki Striker',
        description: 'Unarmed martial artist with all good saving throws, Flurry of Blows, Evasion, and high speed.'
      },
      "Bard": {
        classSkills: ["appraise", "balance", "bluff", "climb", "concentration", "craft_alchemy", "craft_armor", "craft_weapon", "decipher_script", "diplomacy", "disguise", "escape_artist", "gather_information", "hide", "jump", "k_arcana", "k_arch", "k_dungeon", "k_geo", "k_history", "k_local", "k_nature", "k_nobility", "k_religion", "k_planes", "listen", "move_silently", "perform", "profession", "sense_motive", "sleight_of_hand", "spellcraft", "swim", "tumble", "umd"],
        hd: 6, bab: 0.75, fort: "poor", ref: "good", will: "good", skills: 6,
        type: 'Base Class', source: "Player's Handbook", role: 'Support / Arcane & Diplomat',
        description: 'Versatile performer who inspires allies with Bardic Music, Bardic Knowledge, and arcane magic.'
      },
      "Druid": {
        classSkills: ["concentration", "craft_alchemy", "craft_armor", "craft_weapon", "diplomacy", "handle_animal", "heal", "k_nature", "listen", "profession", "ride", "spellcraft", "spot", "survival", "swim"],
        hd: 8, bab: 0.75, fort: "good", ref: "poor", will: "good", skills: 4,
        type: 'Base Class', source: "Player's Handbook", role: 'Divine / Wild Shape & Nature Caster',
        description: 'Divine guardian of nature with an Animal Companion, spontaneous summoning, and Wild Shape.'
      },
      "Crusader": {
        classSkills: ["balance", "concentration", "craft_alchemy", "craft_armor", "craft_weapon", "diplomacy", "intimidate", "jump", "k_history", "k_religion", "martial_lore", "ride"],
        hd: 10, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 4,
        type: 'Base Class', source: 'Tome of Battle', role: 'Martial Adept / Tank & Leader',
        description: 'Armored martial adept who delays incoming damage via Steely Resolve and channels Devoted Spirit.'
      },
      "Swordsage": {
        classSkills: ["balance", "climb", "concentration", "craft_alchemy", "craft_armor", "craft_weapon", "heal", "hide", "intimidate", "jump", "k_history", "k_local", "k_nature", "k_nobility", "listen", "martial_lore", "move_silently", "profession", "ride", "sense_motive", "swim", "tumble"],
        hd: 8, bab: 0.75, fort: "poor", ref: "good", will: "good", skills: 6,
        type: 'Base Class', source: 'Tome of Battle', role: 'Martial Adept / Versatile Striker',
        description: 'Blade-magic sage with the largest maneuver pool and Wisdom to Armor Class.'
      },
      "Duskblade": {
        classSkills: ["climb", "concentration", "craft_alchemy", "craft_armor", "craft_weapon", "decipher_script", "jump", "k_arcana", "k_arch", "k_dungeon", "k_geo", "k_history", "k_local", "k_nature", "k_nobility", "k_religion", "k_planes", "profession", "ride", "sense_motive", "spellcraft", "swim"],
        hd: 8, bab: 1.0, fort: "good", ref: "poor", will: "good", skills: 2,
        type: 'Base Class', source: "Player's Handbook II", role: 'Gish / Arcane Melee Channeler',
        description: 'Hybrid warrior-mage who channels touch spells directly through melee weapon strikes.'
      },
      "Warlock": {
        classSkills: ["bluff", "concentration", "craft_alchemy", "craft_armor", "craft_weapon", "disguise", "intimidate", "jump", "k_arcana", "k_religion", "k_planes", "profession", "sense_motive", "spellcraft", "umd"],
        hd: 6, bab: 0.75, fort: "poor", ref: "poor", will: "good", skills: 2,
        type: 'Base Class', source: 'Complete Arcane', role: 'Arcane / Eldritch Blast Invocator',
        description: 'Wielder of at-will Eldritch Blast and dark arcane invocations.'
      },
      "Abjurant Champion": {
        classSkills: ["climb", "concentration", "craft_alchemy", "craft_armor", "craft_weapon", "handle_animal", "intimidate", "jump", "k_arcana", "ride", "spellcraft", "swim"],
        hd: 10, bab: 1.0, fort: "poor", ref: "poor", will: "good", skills: 2,
        type: 'Prestige Class', source: 'Complete Mage', role: 'Gish (Arcane Warrior)',
        description: 'Arcane gish prestige class that casts enhanced abjuration spells as swift actions and scales CL to BAB.',
        prerequisites: [
          { text: "Base Attack Bonus: +5", key: "bab", min: 5 },
          { text: "Feat: Combat Casting", key: "feat", name: "Combat Casting" },
          { text: "Spells: Able to cast 1st-level arcane spells (including an abjuration spell)", key: "arcane", minLvl: 1 },
          { text: "Weapon: Proficient with at least one martial weapon", key: "weapon" }
        ]
      },
      "Eldritch Knight": {
        classSkills: ["concentration", "craft_alchemy", "craft_armor", "craft_weapon", "decipher_script", "jump", "k_arcana", "k_nobility", "ride", "sense_motive", "spellcraft", "swim"],
        hd: 6, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 2,
        type: 'Prestige Class', source: "Dungeon Master's Guide", role: 'Gish (Arcane Warrior)',
        description: 'Classic warrior-mage prestige class offering full Base Attack Bonus and 9/10 arcane spellcasting progression.',
        prerequisites: [
          { text: "Weapon: Proficient with all martial weapons", key: "weapon" },
          { text: "Spells: Able to cast 3rd-level arcane spells", key: "arcane", minLvl: 3 }
        ]
      },
      "Bloodstorm Blade": {
        classSkills: ["balance", "craft_alchemy", "craft_armor", "craft_weapon", "intimidate", "jump", "martial_lore", "tumble"],
        hd: 12, bab: 1.0, fort: "good", ref: "poor", will: "poor", skills: 4,
        type: 'Prestige Class', source: 'Tome of Battle', role: 'Martial / Thrown Weapon Specialist',
        maxLevel: 10,
        description: 'Legendary Iron Heart master who treats thrown weapons as melee strikes and ricochets blades back to hand instantly.',
        prerequisites: [
          { text: "Base Attack Bonus: +4", key: "bab", min: 4 },
          { text: "Feat: Point Blank Shot", key: "feat", name: "Point Blank Shot" },
          { text: "Martial Maneuvers: One Iron Heart strike and one Iron Heart stance", key: "maneuver" },
          { text: "Skills: Balance 4 ranks", key: "skill" }
        ],
        features: {
          "1": [
            { name: "Returning Attacks (Ex)", summary: "Expend an Iron Heart strike to imbue thrown weapons with the Returning property" },
            { name: "Weapon Aptitude (Ex)", summary: "Reassign weapon-specific feats to a different weapon with 1 hour of morning practice" }
          ],
          "2": [
            { name: "Martial Throw (Ex)", summary: "Initiate Iron Heart strikes with thrown weapons" },
            { name: "Thunderous Throw (Ex)", summary: "As a swift action, treat your ranged thrown attacks as melee attacks (enables Power Attack & 1.5x STR)" }
          ],
          "3": [
            { name: "Bonus Feat", summary: "Select a Fighter/thrown-weapon bonus feat" }
          ],
          "4": [
            { name: "Lightning Ricochet (Ex)", summary: "Thrown weapons return to your hand immediately after resolving each attack, enabling full iterative thrown attacks" }
          ],
          "5": [
            { name: "Blood Wind Ricochet (Ex)", summary: "Full-round action: ricochet a single thrown weapon off multiple targets within range increments" }
          ],
          "6": [
            { name: "Bonus Feat", summary: "Select a Fighter/thrown-weapon bonus feat" }
          ],
          "7": [
            { name: "Eye of the Storm (Ex)", summary: "Making ranged attacks with thrown weapons no longer provokes Attacks of Opportunity" }
          ],
          "8": [
            { name: "Blood Rain (Ex)", summary: "Expend an Iron Heart maneuver to inflict 1d6 bleeding damage per hit for 5 rounds" }
          ],
          "9": [
            { name: "Bonus Feat", summary: "Select a Fighter/thrown-weapon bonus feat" }
          ],
          "10": [
            { name: "Blade Storm (Ex)", summary: "Full-round action: make a thrown weapon attack at your highest bonus against every enemy within range" }
          ]
        }
      },
      "Arcane Archer": {
        classSkills: ["craft_alchemy", "craft_armor", "craft_weapon", "hide", "listen", "move_silently", "ride", "spot", "survival", "use_rope"],
        hd: 8, bab: 1.0, fort: "good", ref: "good", will: "poor", skills: 4,
        type: 'Prestige Class', source: "Dungeon Master's Guide", role: 'Ranged Martial / Arcane Archer',
        description: 'Elven master archer who imbues arrows with area spells and gains automatic magical enhancement on all arrows fired.',
        prerequisites: [
          { text: "Race: Elf or Half-Elf", key: "race", val: "Elf" },
          { text: "Base Attack Bonus: +6", key: "bab", min: 6 },
          { text: "Feats: Point Blank Shot, Precise Shot, Weapon Focus (longbow or shortbow)", key: "feat", name: "Point Blank Shot" },
          { text: "Spells: Able to cast 1st-level arcane spells", key: "arcane", minLvl: 1 }
        ]
      },
      "Assassin": {
        classSkills: ["balance", "bluff", "climb", "craft_alchemy", "craft_armor", "craft_weapon", "decipher_script", "diplomacy", "disable_device", "disguise", "escape_artist", "forgery", "gather_information", "hide", "intimidate", "jump", "listen", "move_silently", "open_lock", "search", "sense_motive", "sleight_of_hand", "spot", "swim", "tumble", "umd", "use_rope"],
        hd: 6, bab: 0.75, fort: "poor", ref: "good", will: "poor", skills: 4,
        type: 'Prestige Class', source: "Dungeon Master's Guide", role: 'Stealth / Death Attack & Poison',
        description: 'Deadly infiltrator trained in Death Attack, poison use, Sneak Attack, and shadow/illusion magic.',
        prerequisites: [
          { text: "Skills: Disguise 4 ranks, Hide 8 ranks, Move Silently 8 ranks", key: "skill" },
          { text: "Special: Evil alignment; must kill someone for no other reason than to join the Assassins", key: "special" }
        ]
      },
      "Shadowdancer": {
        classSkills: ["balance", "bluff", "decipher_script", "diplomacy", "disguise", "escape_artist", "hide", "jump", "listen", "move_silently", "perform", "profession", "search", "sleight_of_hand", "spot", "tumble", "use_rope"],
        hd: 8, bab: 0.75, fort: "poor", ref: "good", will: "poor", skills: 6,
        type: 'Prestige Class', source: "Dungeon Master's Guide", role: 'Stealth / Shadow Jump & Evasion',
        description: 'Acrobatic master of shadows who can Hide in Plain Sight, Shadow Jump, and summon shades.',
        prerequisites: [
          { text: "Skills: Move Silently 8 ranks, Hide 10 ranks, Perform (dance) 5 ranks", key: "skill" },
          { text: "Feats: Combat Reflexes, Dodge, Mobility", key: "feat", name: "Dodge" }
        ]
      },
      "Dragon Disciple": {
        classSkills: ["concentration", "craft_alchemy", "craft_armor", "craft_weapon", "diplomacy", "escape_artist", "gather_information", "k_arcana", "k_arch", "k_dungeon", "k_geo", "k_history", "k_local", "k_nature", "k_nobility", "k_religion", "k_planes", "listen", "profession", "search", "spellcraft", "spot"],
        hd: 12, bab: 0.75, fort: "good", ref: "poor", will: "good", skills: 2,
        type: 'Prestige Class', source: "Dungeon Master's Guide", role: 'Gish / Dragon Transformation (+STR/CON)',
        description: 'Scion of draconic blood who awakens Half-Dragon physical traits (+8 STR, +2 CON, +2 INT, +2 CHA, Natural Armor, Breath Weapon).',
        prerequisites: [
          { text: "Spells: Ability to cast arcane spells without preparation", key: "arcane", minLvl: 1 },
          { text: "Skills: Knowledge (arcana) 8 ranks", key: "skill" }
        ]
      },
      "Mystic Theurge": {
        classSkills: ["concentration", "craft_alchemy", "craft_armor", "craft_weapon", "decipher_script", "k_arcana", "k_religion", "profession", "sense_motive", "spellcraft"],
        hd: 4, bab: 0.5, fort: "poor", ref: "poor", will: "good", skills: 2,
        type: 'Prestige Class', source: "Dungeon Master's Guide", role: 'Hybrid Caster (Arcane & Divine)',
        description: 'Dual-tradition caster who advances both Arcane and Divine spellcasting at every class level.',
        prerequisites: [
          { text: "Spells: Able to cast 2nd-level arcane spells AND 2nd-level divine spells", key: "spells" },
          { text: "Skills: Knowledge (arcana) 6 ranks, Knowledge (religion) 6 ranks", key: "skill" }
        ]
      },
      "Dervish": {
        classSkills: ["balance", "craft_alchemy", "craft_armor", "craft_weapon", "escape_artist", "jump", "listen", "perform", "profession", "swim", "tumble"],
        hd: 10, bab: 1.0, fort: "good", ref: "good", will: "poor", skills: 4,
        type: 'Prestige Class', source: 'Complete Warrior', role: 'Martial / Mobile Full Attack',
        description: 'Whirling slashing-weapon specialist who executes a full attack while moving at full speed via Dervish Dance.',
        prerequisites: [
          { text: "Base Attack Bonus: +5", key: "bab", min: 5 },
          { text: "Feats: Combat Expertise, Dodge, Mobility, Weapon Focus (any slashing melee weapon)", key: "feat", name: "Combat Expertise" },
          { text: "Skills: Perform (dance) 3 ranks, Tumble 3 ranks", key: "skill" }
        ]
      },
      "Spellsword": {
        classSkills: ["climb", "concentration", "jump", "k_arcana", "k_arch", "k_dungeon", "k_geo", "k_history", "k_local", "k_nature", "k_nobility", "k_religion", "k_planes", "profession", "spellcraft"],
        hd: 8, bab: 1.0, fort: "good", ref: "poor", will: "good", skills: 2,
        type: 'Prestige Class', source: 'Complete Warrior', role: 'Gish / Ignore ASF & Spell Channeling',
        description: 'Armored spellsword who reduces Arcane Spell Failure (ASF) and channels spells through melee weapons.',
        prerequisites: [
          { text: "Base Attack Bonus: +4", key: "bab", min: 4 },
          { text: "Proficiency: Proficient with all simple and martial weapons and with light, medium, and heavy armor", key: "armor" },
          { text: "Spells: Able to cast 2nd-level arcane spells", key: "arcane", minLvl: 2 }
        ]
      },
      "Jade Phoenix Mage": {
        classSkills: ["climb", "concentration", "diplomacy", "handle_animal", "intimidate", "jump", "martial_lore", "ride", "sense_motive", "tumble"],
        hd: 6, bab: 1.0, fort: "good", ref: "poor", will: "good", skills: 2,
        type: 'Prestige Class', source: 'Tome of Battle', role: 'Gish (Martial Adept + Arcane)',
        description: 'Sublime arcane-martial adept who blends arcane magic with Desert Wind and Devoted Spirit maneuvers.',
        prerequisites: [
          { text: "Martial Maneuvers: Two maneuvers (at least one strike) and one stance", key: "maneuver" },
          { text: "Spells: Able to cast 2nd-level arcane spells", key: "arcane", minLvl: 2 },
          { text: "Skills: Concentration 9 ranks, Knowledge (arcana) 4 ranks, Knowledge (history) 2 ranks", key: "skill" }
        ]
      }
    };

    let DND35_CLASS_DEFS = { ...DND35_BASE_CLASS_DEFS };
    if (typeof RuleEngine !== 'undefined' && RuleEngine.DND35_CLASS_DEFS) {
      Object.assign(DND35_CLASS_DEFS, RuleEngine.DND35_CLASS_DEFS);
    }

    function getAvailableClassDefs() {
      const all = {};
      Object.assign(all, DND35_BASE_CLASS_DEFS);
      if (typeof RuleEngine !== 'undefined' && RuleEngine.DND35_CLASS_DEFS) {
        Object.keys(RuleEngine.DND35_CLASS_DEFS).forEach(k => {
          all[k] = Object.assign({}, RuleEngine.DND35_CLASS_DEFS[k], all[k]);
        });
      }

      if (Array.isArray(character?.customClasses)) {
        character.customClasses.forEach(c => {
          if (c && c.name) {
            all[c.name] = {
              hd: Number(c.hd) || 8,
              bab: Number(c.bab) || 0.75,
              fort: c.fort || 'poor',
              ref: c.ref || 'poor',
              will: c.will || 'poor',
              skills: Number(c.skills) || 2,
              maxLevel: Number(c.maxLevel) || (c.type === 'Prestige Class' ? 10 : 20),
              features: c.features || {},
              bonusFeatLevels: c.bonusFeatLevels || [],
              prerequisites: c.prerequisites || [],
              description: c.description || c.desc || '',
              role: c.role || '',
              source: c.source || 'Custom / Homebrew',
              type: c.type || 'Custom Class',
              isCustom: true
            };
          }
        });
      }

      if (Array.isArray(masterDb)) {
        masterDb.filter(m => m && (m.type === 'Class' || m.category === 'Class' || m.type === 'Prestige Class')).forEach(c => {
          if (c && c.name && !all[c.name]) {
            all[c.name] = {
              hd: Number(c.hd) || 8,
              bab: Number(c.bab) || 0.75,
              fort: c.fort || 'poor',
              ref: c.ref || 'poor',
              will: c.will || 'poor',
              skills: Number(c.skills) || 2,
              maxLevel: Number(c.maxLevel) || (c.type === 'Prestige Class' ? 10 : 20),
              features: c.features || {},
              bonusFeatLevels: c.bonusFeatLevels || [],
              prerequisites: c.prerequisites || [],
              description: c.description || c.desc || '',
              role: c.role || '',
              source: c.source || 'Master DB',
              type: c.type || 'Prestige Class',
              isCustom: true
            };
          }
        });
      }

      Object.assign(DND35_CLASS_DEFS, all);
      if (typeof RuleEngine !== 'undefined' && RuleEngine.DND35_CLASS_DEFS) {
        Object.assign(RuleEngine.DND35_CLASS_DEFS, all);
      }

      return all;
    }

    function syncCustomClassesToRuleEngine() {
      const all = getAvailableClassDefs();
      Object.assign(DND35_CLASS_DEFS, all);
      if (typeof RuleEngine !== 'undefined' && RuleEngine.DND35_CLASS_DEFS) {
        Object.assign(RuleEngine.DND35_CLASS_DEFS, all);
      }
    }

    function populateLevelUpClassSelect(selectedClass = null) {
      const select = document.getElementById('lvlup-class-select');
      if (!select) return;

      const allDefs = getAvailableClassDefs();
      const defaultClass = (character.classes?.split(' ')[0]) || (character.levelProgression?.[0]?.className) || 'Fighter';
      const currentVal = selectedClass || select.value || defaultClass;

      select.innerHTML = '';

      const baseGroup = document.createElement('optgroup');
      baseGroup.label = "Base Classes";

      const prestigeGroup = document.createElement('optgroup');
      prestigeGroup.label = "Prestige Classes";

      const customGroup = document.createElement('optgroup');
      customGroup.label = "Custom & Splatbook Classes (Master DB)";

      Object.keys(allDefs).sort((a, b) => a.localeCompare(b)).forEach(cName => {
        const def = allDefs[cName];
        const opt = document.createElement('option');
        opt.value = cName;

        const hdText = `d${def.hd} HD`;
        const babText = def.bab === 1.0 ? 'Full BAB (+1)' : (def.bab === 0.75 ? '3/4 BAB' : '1/2 BAB');
        const goodSaves = [];
        if (def.fort === 'good') goodSaves.push('Fort');
        if (def.ref === 'good') goodSaves.push('Ref');
        if (def.will === 'good') goodSaves.push('Will');
        const saveText = goodSaves.length === 3 ? 'All Good Saves' : (goodSaves.length > 0 ? `Good: ${goodSaves.join('/')}` : 'Poor Saves');
        const skillText = `${def.skills || 2}+INT Skills`;

        opt.textContent = `${cName} (${hdText} • ${babText} • ${saveText} • ${skillText})`;

        if (cName.toLowerCase() === currentVal.toLowerCase()) {
          opt.selected = true;
        }

        if (def.isCustom) {
          customGroup.appendChild(opt);
        } else if (def.type === 'Prestige Class') {
          prestigeGroup.appendChild(opt);
        } else {
          baseGroup.appendChild(opt);
        }
      });

      select.appendChild(baseGroup);
      if (prestigeGroup.children.length > 0) {
        select.appendChild(prestigeGroup);
      }
      if (customGroup.children.length > 0) {
        select.appendChild(customGroup);
      }
      updateLevelUpClassTriggerUI(currentVal);
    }

    function openCreateCustomClassModal() {
      const modal = document.getElementById('create-custom-class-modal');
      if (!modal) return;
      const nameInput = document.getElementById('custom-class-name');
      if (nameInput) nameInput.value = '';
      const hdInput = document.getElementById('custom-class-hd');
      if (hdInput) hdInput.value = '8';
      const babInput = document.getElementById('custom-class-bab');
      if (babInput) babInput.value = '0.75';
      const fortInput = document.getElementById('custom-class-good-fort');
      if (fortInput) fortInput.checked = false;
      const refInput = document.getElementById('custom-class-good-ref');
      if (refInput) refInput.checked = false;
      const willInput = document.getElementById('custom-class-good-will');
      if (willInput) willInput.checked = false;
      const skillsInput = document.getElementById('custom-class-skills');
      if (skillsInput) skillsInput.value = '2';
      const sourceInput = document.getElementById('custom-class-source');
      if (sourceInput) sourceInput.value = 'Custom / Homebrew';
      const notesInput = document.getElementById('custom-class-notes');
      if (notesInput) notesInput.value = '';
      modal.classList.remove('hidden');
    }

    function closeCreateCustomClassModal() {
      const modal = document.getElementById('create-custom-class-modal');
      if (modal) modal.classList.add('hidden');
    }

    function saveNewCustomClass() {
      const nameInput = document.getElementById('custom-class-name');
      const name = (nameInput?.value || '').trim();
      if (!name) {
        alert('Please enter a valid class name.');
        nameInput?.focus();
        return;
      }

      const hd = parseInt(document.getElementById('custom-class-hd')?.value) || 8;
      const bab = parseFloat(document.getElementById('custom-class-bab')?.value) || 0.75;
      const fort = document.getElementById('custom-class-good-fort')?.checked ? 'good' : 'poor';
      const ref = document.getElementById('custom-class-good-ref')?.checked ? 'good' : 'poor';
      const will = document.getElementById('custom-class-good-will')?.checked ? 'good' : 'poor';
      const skills = parseInt(document.getElementById('custom-class-skills')?.value) || 2;
      const source = (document.getElementById('custom-class-source')?.value || '').trim() || 'Custom';
      const notes = (document.getElementById('custom-class-notes')?.value || '').trim();

      const newClassDef = {
        name,
        hd,
        bab,
        fort,
        ref,
        will,
        skills,
        source,
        isCustom: true,
        features: notes ? { 1: [{ name: notes, category: 'Special Ability', type: 'Ex', summary: notes }] } : {}
      };

      if (!Array.isArray(character.customClasses)) {
        character.customClasses = [];
      }

      const existingIdx = character.customClasses.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
      if (existingIdx >= 0) {
        character.customClasses[existingIdx] = newClassDef;
      } else {
        character.customClasses.push(newClassDef);
      }

      if (Array.isArray(masterDb)) {
        const inDb = masterDb.find(m => m && (m.name || '').toLowerCase() === name.toLowerCase() && (m.type === 'Class' || m.category === 'Class'));
        if (!inDb) {
          masterDb.push({
            name,
            type: 'Class',
            category: 'Class',
            hd,
            bab,
            fort,
            ref,
            will,
            skills,
            source,
            desc: notes || `${name} class (${source})`
          });
        }
      }

      syncCustomClassesToRuleEngine();
      saveStateToStorage(true);
      closeCreateCustomClassModal();

      populateLevelUpClassSelect(name);
      onLevelUpClassChange();
      if (typeof filterLevelUpClassSearch === 'function') {
        filterLevelUpClassSearch();
      }

      const changeModal = document.getElementById('change-level-class-modal');
      if (changeModal && !changeModal.classList.contains('hidden') && currentChangeClassLevelIndex !== null) {
        openChangeLevelClassModal(currentChangeClassLevelIndex);
      }

      alert(`✅ Class "${name}" defined and added to the class list!`);
    }

    // Feat Detail Popover Modal & Pin Synchronization
    let currentFeatSourceLevelIndex = null;
    let currentFeatSourceType = 'feat'; // 'feat' or 'ability'
    let activeQuickLevelIndex = null;
    let isFeatPickerForQuickLevel = false;
    window.currentViewedFeatItem = null;

    // Returns an interactive active/passive toggle badge in the top-right corner if the feat/ability is pinned
    function getFeatPinCornerBadgeHtml(featName) {
      if (!character || !character.combatPins || !featName) return '';
      const cleanTarget = String(featName).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();

      let foundCategory = null;
      let foundPin = null;
      ['offense_melee', 'offense_ranged', 'offense_spell', 'spell_control', 'spell_support', 'defense', 'offense'].forEach(cat => {
        const list = character.combatPins[cat] || [];
        const match = list.find(p => {
          const pName = (p.name || '').toLowerCase().trim();
          const pClean = pName.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          return pName === cleanTarget || pClean === cleanTarget;
        });
        if (match) {
          foundCategory = cat;
          foundPin = match;
        }
      });

      if (!foundCategory || !foundPin) return '';

      const isActive = Boolean(foundPin.active);
      const safeTarget = cleanTarget.replace(/'/g, "\\'");

      if (isActive) {
        return `<span onclick="event.stopPropagation(); toggleFeatPinActiveState('${safeTarget}')" class="absolute top-0.5 right-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.85)] pointer-events-auto z-10 cursor-pointer transition active:scale-95" title="📌 Combat Mode: ACTIVE (+Bonus applied). Click to deactivate!"><span class="text-[9px]">✓</span><span>Active</span></span>`;
      } else {
        return `<span onclick="event.stopPropagation(); toggleFeatPinActiveState('${safeTarget}')" class="absolute top-0.5 right-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-[9px] border border-slate-700 shadow pointer-events-auto z-10 cursor-pointer transition active:scale-95" title="📌 Combat Mode: INACTIVE. Click to activate!"><span class="text-[8px]">⚪</span><span>Inactive</span></span>`;
      }
    }

    function updateFeatModalPinButton() {
      const btn = document.getElementById('feat-modal-pin-btn');
      const icon = document.getElementById('feat-modal-pin-icon');
      const label = document.getElementById('feat-modal-pin-label');
      const toggleBtn = document.getElementById('feat-modal-toggle-btn');
      if (!btn || !window.currentViewedFeatItem) return;

      const item = window.currentViewedFeatItem;
      const cleanTarget = String(item.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();

      let foundCategory = null;
      let foundPin = null;
      ['offense_melee', 'offense_ranged', 'offense_spell', 'spell_control', 'spell_support', 'defense', 'offense'].forEach(cat => {
        const list = character?.combatPins?.[cat] || [];
        const match = list.find(p => {
          const pName = (p.name || '').toLowerCase().trim();
          const pClean = pName.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
          return pName === cleanTarget || pClean === cleanTarget;
        });
        if (match) {
          foundCategory = cat;
          foundPin = match;
        }
      });

      const filledPinSvg = `<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`;
      const outlinePinSvg = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;

      if (foundCategory && foundPin) {
        if (foundCategory === 'offense') {
          btn.className = 'px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-rose-950/90 text-rose-300 border-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.45)] hover:bg-rose-900';
          btn.title = `📌 Combat Cockpit: Pinned to OFFENSE Drawer (${item.name}) - Click to unpin`;
          if (icon) icon.innerHTML = filledPinSvg;
          if (label) label.textContent = '📌 Pinned to Offense';
        } else if (foundCategory === 'defense') {
          btn.className = 'px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-indigo-950/90 text-indigo-300 border-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.45)] hover:bg-indigo-900';
          btn.title = `📌 Combat Cockpit: Pinned to DEFENSE Drawer (${item.name}) - Click to unpin`;
          if (icon) icon.innerHTML = filledPinSvg;
          if (label) label.textContent = '📌 Pinned to Defense';
        }

        // Active/Passive toggle button in modal
        if (toggleBtn) {
          toggleBtn.classList.remove('hidden');
          if (foundPin.active) {
            toggleBtn.className = 'px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]';
            toggleBtn.innerHTML = '<span>✓</span><span>Active in Combat</span>';
            toggleBtn.title = 'Ability is active in combat and applying its bonuses. Click to deactivate.';
          } else {
            toggleBtn.className = 'px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-500';
            toggleBtn.innerHTML = '<span>⚪</span><span>Inactive in Combat</span>';
            toggleBtn.title = 'Ability is pinned but currently inactive. Click to activate in combat.';
          }
        }
      } else {
        btn.className = 'px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-500';
        btn.title = `📌 Pin to Combat Cockpit (${item.name})`;
        if (icon) icon.innerHTML = outlinePinSvg;
        if (label) label.textContent = '📌 Sabitle';
        if (toggleBtn) toggleBtn.classList.add('hidden');
      }
    }

    function toggleCurrentFeatModalPin() {
      if (!window.currentViewedFeatItem) return;
      toggleUniversalPin(window.currentViewedFeatItem);
      updateFeatModalPinButton();
    }

    function toggleCurrentFeatModalActive() {
      if (!window.currentViewedFeatItem) return;
      toggleFeatPinActiveState(window.currentViewedFeatItem.name);
      updateFeatModalPinButton();
    }

    // D&D 3.5e Standard SRD Weapons Dynamic Helper (Sourced from window.BUNDLED_SRD_CORE_CATALOG & masterDb per Rule #5)
    function getSrdWeaponNames() {
      const set = new Set();
      if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        window.BUNDLED_SRD_CORE_CATALOG.filter(i => i && i.type === 'Weapon').forEach(w => {
          if (w.name) set.add(w.name);
        });
      }
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        masterDb.filter(i => i && i.type === 'Weapon').forEach(w => {
          if (w.name) set.add(w.name);
        });
      }
      return Array.from(set).sort();
    }

    const DND35_SPELL_SCHOOLS = [
      "Abjuration", "Conjuration", "Divination", "Enchantment", 
      "Evocation", "Illusion", "Necromancy", "Transmutation"
    ];

    window.currentFeatTargetConfig = null;

    function setupFeatTargetSelector(featTitle) {
      const container = document.getElementById('feat-modal-target-container');
      const select = document.getElementById('feat-modal-target-select');
      const titleEl = document.getElementById('feat-modal-target-title');
      const iconEl = document.getElementById('feat-modal-target-icon');
      const helpEl = document.getElementById('feat-modal-target-help');
      if (!container || !select) return;

      window.currentFeatTargetConfig = null;
      if (!featTitle) {
        container.classList.add('hidden');
        return;
      }

      const t = String(featTitle).trim();
      const lower = t.toLowerCase();

      // Check weapon feats
      const isWeaponFeat = /^(weapon focus|greater weapon focus|weapon specialization|greater weapon specialization|improved critical|exotic weapon proficiency)/i.test(lower);
      // Check spell focus
      const isSpellFocus = /^(spell focus|greater spell focus)/i.test(lower);
      // Check skill focus
      const isSkillFocus = /^skill focus/i.test(lower);

      if (!isWeaponFeat && !isSpellFocus && !isSkillFocus) {
        container.classList.add('hidden');
        return;
      }

      // Extract current target in parentheses if present e.g. "Weapon Focus (Rapier)" -> target = "Rapier"
      const match = t.match(/\((.*?)\)/);
      const currentTarget = match ? match[1].trim() : '';
      const baseName = t.replace(/\(.*?\)/g, '').trim();

      window.currentFeatTargetConfig = {
        baseName,
        currentTarget,
        type: isWeaponFeat ? 'weapon' : (isSpellFocus ? 'spell_school' : 'skill')
      };

      select.innerHTML = '';

      if (isWeaponFeat) {
        if (titleEl) titleEl.textContent = 'Select Target Weapon';
        if (iconEl) iconEl.textContent = '⚔️';
        if (helpEl) helpEl.textContent = 'Rule Engine automatically applies the feat bonus when wielding this weapon.';

        const defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.textContent = '-- Select a Weapon --';
        select.appendChild(defOpt);

        // Group 1: Character's inventory & equipped weapons
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

        // Group 2: All Standard D&D 3.5e SRD Weapons
        const grpSrd = document.createElement('optgroup');
        grpSrd.label = '📚 All D&D 3.5e SRD Weapons';
        getSrdWeaponNames().forEach(w => {
          const opt = document.createElement('option');
          opt.value = w;
          opt.textContent = w;
          if (!select.value && currentTarget.toLowerCase() === w.toLowerCase()) opt.selected = true;
          grpSrd.appendChild(opt);
        });
        select.appendChild(grpSrd);

      } else if (isSpellFocus) {
        if (titleEl) titleEl.textContent = 'Select Target Spell School';
        if (iconEl) iconEl.textContent = '🔮';
        if (helpEl) helpEl.textContent = 'Increases Saving Throw DC for spells of the selected school.';

        const defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.textContent = '-- Select a Spell School --';
        select.appendChild(defOpt);

        DND35_SPELL_SCHOOLS.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s;
          opt.textContent = s;
          if (currentTarget.toLowerCase() === s.toLowerCase()) opt.selected = true;
          select.appendChild(opt);
        });

      } else if (isSkillFocus) {
        if (titleEl) titleEl.textContent = 'Select Target Skill';
        if (iconEl) iconEl.textContent = '🎯';
        if (helpEl) helpEl.textContent = 'Grants a +3 bonus on all checks involving the selected skill.';

        const defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.textContent = '-- Select a Skill --';
        select.appendChild(defOpt);

        const skills = (character.skills || []).map(sk => sk.name).filter(Boolean);
        skills.forEach(sk => {
          const opt = document.createElement('option');
          opt.value = sk;
          opt.textContent = sk;
          if (currentTarget.toLowerCase() === sk.toLowerCase()) opt.selected = true;
          select.appendChild(opt);
        });
      }

      container.classList.remove('hidden');
    }

    function onFeatTargetSelectChanged() {
      const select = document.getElementById('feat-modal-target-select');
      if (!select || !window.currentFeatTargetConfig || !currentViewedFeatName) return;

      const newTarget = select.value.trim();
      const baseName = window.currentFeatTargetConfig.baseName;
      const oldFullName = currentViewedFeatName;
      const newFullName = newTarget ? `${baseName} (${newTarget})` : baseName;

      if (oldFullName === newFullName) return;

      const oldClean = String(oldFullName).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
      const baseClean = String(baseName).toLowerCase();

      // 1. Update in Level Progression if viewing from a specific level row
      if (currentFeatSourceLevelIndex !== null && character.levelProgression && character.levelProgression[currentFeatSourceLevelIndex]) {
        const row = character.levelProgression[currentFeatSourceLevelIndex];
        if (Array.isArray(row.feats)) {
          for (let i = 0; i < row.feats.length; i++) {
            const f = row.feats[i];
            const rawStr = String(typeof f === 'string' ? f : (f?.name || ''));
            const str = rawStr.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
            if (str === oldClean || str.startsWith(baseClean)) {
              const prefixMatch = rawStr.match(/^([🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*)/);
              const prefix = prefixMatch ? prefixMatch[1] : '';
              const updatedName = `${prefix}${newFullName}`;
              if (typeof f === 'string') {
                row.feats[i] = updatedName;
              } else if (f && typeof f === 'object') {
                f.name = updatedName;
              }
              break;
            }
          }
        }
        if (Array.isArray(row.specialAbilities)) {
          for (let i = 0; i < row.specialAbilities.length; i++) {
            const a = row.specialAbilities[i];
            const rawStr = String(typeof a === 'string' ? a : (a?.name || ''));
            const str = rawStr.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
            if (str === oldClean || str.startsWith(baseClean)) {
              const prefixMatch = rawStr.match(/^([🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*)/);
              const prefix = prefixMatch ? prefixMatch[1] : '';
              const updatedName = `${prefix}${newFullName}`;
              if (typeof a === 'string') {
                row.specialAbilities[i] = updatedName;
              } else if (a && typeof a === 'object') {
                a.name = updatedName;
              }
              break;
            }
          }
        }
      }

      // 2. Update in character.feats array
      if (Array.isArray(character.feats)) {
        for (let i = 0; i < character.feats.length; i++) {
          const f = character.feats[i];
          const rawStr = String(typeof f === 'string' ? f : (f?.name || ''));
          const str = rawStr.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
          if (str === oldClean || str.startsWith(baseClean)) {
            if (typeof f === 'string') {
              character.feats[i] = newFullName;
            } else if (f && typeof f === 'object') {
              f.name = newFullName;
            }
            break;
          }
        }
      }

      // 3. Update in combatPins if pinned
      ['offense_melee', 'offense_ranged', 'offense_spell', 'spell_control', 'spell_support', 'defense', 'offense'].forEach(cat => {
        (character.combatPins?.[cat] || []).forEach(p => {
          const pClean = String(p.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim().toLowerCase();
          if (pClean === oldClean || pClean.startsWith(baseClean)) {
            p.name = newFullName;
          }
        });
      });

      // 4. Update modal state
      currentViewedFeatName = newFullName;
      window.currentFeatTargetConfig.currentTarget = newTarget;
      document.getElementById('feat-modal-title').textContent = newFullName;
      if (window.currentViewedFeatItem) {
        window.currentViewedFeatItem.name = newFullName;
      }
      updateFeatModalPinButton();

      saveStateToStorage(true);
      renderAll();

      showDiceTopToast({
        icon: '🎯',
        title: `${baseName} Updated`,
        breakdown: newTarget ? `Selected Target: ${newTarget}` : 'Target cleared.',
        total: newTarget || 'Standard'
      });
    }

    function showFeatDetail(featName, levelIndex = null, sourceCategory = 'feat') {
      const modal = document.getElementById('feat-detail-modal');
      if (!modal) return;
      currentViewedFeatName = featName;
      currentFeatSourceLevelIndex = (levelIndex !== null && levelIndex !== undefined) ? Number(levelIndex) : null;
      currentFeatSourceType = sourceCategory || 'feat';

      const cleanName = String(featName).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();
      const baseFeatName = cleanName.replace(/\s*\([^)]*\)$/, '').trim();

      const fFromChar = (character.feats || []).find(f => {
        const n = typeof f === 'string' ? f : f.name;
        return n.toLowerCase() === featName.toLowerCase() || n.toLowerCase() === cleanName.toLowerCase();
      });
      const aFromChar = (character.specialAbilities || []).find(a => {
        const n = typeof a === 'string' ? a : a.name;
        return n.toLowerCase() === featName.toLowerCase() || n.toLowerCase() === cleanName.toLowerCase();
      });
      const fFromDb = (masterDb || []).find(m => {
        const n = m.name || '';
        return n.toLowerCase() === featName.toLowerCase() || n.toLowerCase() === cleanName.toLowerCase() || n.toLowerCase() === baseFeatName.toLowerCase();
      });
      const fFromCat = DND35_FEAT_CATALOG.find(c => c.name.toLowerCase() === featName.toLowerCase() || c.name.toLowerCase() === cleanName.toLowerCase() || c.name.toLowerCase() === baseFeatName.toLowerCase());
      const fFromBundled = (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG))
        ? window.BUNDLED_SRD_CORE_CATALOG.find(i => i && i.type === 'Feat' && (i.name.toLowerCase() === featName.toLowerCase() || i.name.toLowerCase() === cleanName.toLowerCase() || i.name.toLowerCase() === baseFeatName.toLowerCase()))
        : null;
      const bFromCat = DND35_DM_BOONS_CATALOG.find(b => b.name.toLowerCase() === featName.toLowerCase() || b.name.toLowerCase() === cleanName.toLowerCase());
      const flFromCat = DND35_FLAWS_CATALOG.find(fl => fl.name.toLowerCase() === featName.toLowerCase() || fl.name.toLowerCase() === cleanName.toLowerCase());

      const title = cleanName || featName;
      let source = 'D&D 3.5e Core Rules';
      let category = (sourceCategory === 'ability') ? 'Special Ability' : 'Feat / Ability';
      let benefit = 'This feat or special ability modifies your character rules.';
      let notes = '';

      if (fFromCat) {
        source = fFromCat.source || source;
        category = fFromCat.category || category;
        benefit = fFromCat.benefit || benefit;
        if (fFromCat.prereq && fFromCat.prereq !== '-') notes = `Prerequisite: ${fFromCat.prereq}`;
      } else if (fFromBundled) {
        source = fFromBundled.source || source;
        category = fFromBundled.category || category;
        benefit = fFromBundled.benefit || benefit;
        if (fFromBundled.prereq && fFromBundled.prereq !== '-') notes = `Prerequisite: ${fFromBundled.prereq}`;
      } else if (bFromCat) {
        source = bFromCat.source || 'Campaign Boon';
        category = 'DM Boon';
        benefit = bFromCat.benefit || benefit;
      } else if (flFromCat) {
        source = flFromCat.source || 'Unearthed Arcana';
        category = 'Flaw';
        benefit = flFromCat.benefit || benefit;
      }

      if (fFromChar && typeof fFromChar === 'object') {
        source = fFromChar.source || source;
        category = fFromChar.category || category;
        benefit = fFromChar.benefit || fFromChar.desc || benefit;
      } else if (aFromChar && typeof aFromChar === 'object') {
        source = aFromChar.source || source;
        category = aFromChar.category || 'Special Ability';
        benefit = aFromChar.benefit || aFromChar.desc || benefit;
      }

      if (fFromDb) {
        source = fFromDb.source || (fFromDb.sourceBook ? `${fFromDb.sourceBook} p. ${fFromDb.sourcePage || '-'}` : source);
        category = fFromDb.type || category;
        benefit = fFromDb.benefit || fFromDb.description || benefit;
        notes = fFromDb.notes || (fFromDb.prereq && fFromDb.prereq !== '-' ? `Prerequisite: ${fFromDb.prereq}` : notes);
      }

      document.getElementById('feat-modal-title').textContent = title;
      document.getElementById('feat-modal-source').textContent = '📚 ' + source;
      document.getElementById('feat-modal-category').textContent = category;
      document.getElementById('feat-modal-benefit').textContent = benefit;
      
      const notesContainer = document.getElementById('feat-modal-notes-container');
      if (notes) {
        notesContainer.classList.remove('hidden');
        document.getElementById('feat-modal-notes').textContent = notes;
      } else {
        notesContainer.classList.add('hidden');
      }

      const lvlSourceBadge = document.getElementById('feat-modal-level-source');
      const btnRemoveText = document.getElementById('btn-remove-feat-text');
      if (currentFeatSourceLevelIndex !== null && character.levelProgression && character.levelProgression[currentFeatSourceLevelIndex]) {
        const row = character.levelProgression[currentFeatSourceLevelIndex];
        if (lvlSourceBadge) {
          lvlSourceBadge.textContent = `Level ${row.level || (currentFeatSourceLevelIndex + 1)} (${row.className || 'Class'}) Record`;
          lvlSourceBadge.classList.remove('hidden');
        }
        if (btnRemoveText) {
          btnRemoveText.textContent = 'Remove from This Level';
        }
      } else {
        if (lvlSourceBadge) lvlSourceBadge.classList.add('hidden');
        if (btnRemoveText) btnRemoveText.textContent = 'Remove from Character';
      }

      // Configure Pin button state for this viewed feat
      window.currentViewedFeatItem = {
        name: title,
        type: category || 'Feat',
        action: 'Standard',
        desc: benefit,
        badge: category || 'Feat'
      };
      updateFeatModalPinButton();

      // Setup dynamic target configuration (Weapon Focus, Spell Focus, Skill Focus)
      setupFeatTargetSelector(title);

      modal.classList.remove('hidden');
    }

    function closeFeatDetailModal() {
      const modal = document.getElementById('feat-detail-modal');
      if (modal) modal.classList.add('hidden');
      currentViewedFeatName = null;
      currentFeatSourceLevelIndex = null;
      window.currentViewedFeatItem = null;
      window.currentFeatTargetConfig = null;
    }

    function removeCurrentViewedFeat() {
      if (!currentViewedFeatName) return;
      const target = currentViewedFeatName.toLowerCase().trim();
      const cleanTarget = target.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();

      if (currentFeatSourceLevelIndex !== null && character.levelProgression && character.levelProgression[currentFeatSourceLevelIndex]) {
        const row = character.levelProgression[currentFeatSourceLevelIndex];
        if (!confirm(`Are you sure you want to remove "${cleanTarget || currentViewedFeatName}" from Level ${row.level || (currentFeatSourceLevelIndex + 1)}?`)) return;

        if (Array.isArray(row.feats)) {
          row.feats = row.feats.filter(f => {
            const s = String(typeof f === 'string' ? f : f.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').toLowerCase().trim();
            return s !== cleanTarget && s !== target;
          });
        }
        if (Array.isArray(row.specialAbilities)) {
          row.specialAbilities = row.specialAbilities.filter(a => {
            const s = String(typeof a === 'string' ? a : a.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').toLowerCase().trim();
            return s !== cleanTarget && s !== target;
          });
        }

        const stillInAnyLevel = (character.levelProgression || []).some(r => {
          const inF = (r.feats || []).some(f => String(typeof f === 'string' ? f : f.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').toLowerCase().trim() === cleanTarget);
          const inA = (r.specialAbilities || []).some(a => String(typeof a === 'string' ? a : a.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').toLowerCase().trim() === cleanTarget);
          return inF || inA;
        });

        if (!stillInAnyLevel) {
          if (Array.isArray(character.feats)) {
            character.feats = character.feats.filter(f => {
              const s = String(typeof f === 'string' ? f : f.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').toLowerCase().trim();
              return s !== cleanTarget && s !== target;
            });
          }
          if (Array.isArray(character.specialAbilities)) {
            character.specialAbilities = character.specialAbilities.filter(a => {
              const s = String(typeof a === 'string' ? a : a.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').toLowerCase().trim();
              return s !== cleanTarget && s !== target;
            });
          }
        }

        closeFeatDetailModal();
        recalculateCharacterClassSummary();
        saveStateToStorage(true);
        renderLevelProgression();
        renderAll();
        return;
      }

      if (!confirm(`Are you sure you want to remove "${cleanTarget || currentViewedFeatName}" from your character?`)) return;
      if (Array.isArray(character.feats)) {
        character.feats = character.feats.filter(f => {
          const s = String(typeof f === 'string' ? f : f.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').toLowerCase().trim();
          return s !== cleanTarget && s !== target;
        });
      }
      if (Array.isArray(character.specialAbilities)) {
        character.specialAbilities = character.specialAbilities.filter(a => {
          const s = String(typeof a === 'string' ? a : a.name).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').toLowerCase().trim();
          return s !== cleanTarget && s !== target;
        });
      }
      closeFeatDetailModal();
      recalculateCharacterClassSummary();
      saveStateToStorage(true);
      renderLevelProgression();
      renderAll();

      if (typeof showDiceTopToast === 'function') {
        const formula = `1d${def.hd}`;
        showDiceTopToast({
          icon: '⚡',
          title: `Level ${nextLvl} Planned (${targetClass})`,
          breakdown: (nextLvl === 1)
            ? `1st-Level RAW Rule: Maximum Hit Die (+${hpGain} HP)`
            : `Hit Die Rolled: ${formula} ➔ ${rollHp} (+ CON ${conMod >= 0 ? '+' + conMod : conMod})`, 
          total: `+${hpGain} HP`
        }, { autoDismiss: true, dismissMs: 4000 });
      }
    }

