/**
 * Joyful-Fermi D&D 3.5e — Custom Skills, Short/Long Rest, Buffs/Debuffs, 14 Body Slots, Paper-Doll, V2 Forge & JSON I/O
 */
    // ====================================================
    // CUSTOM SKILL MODAL & TEMPLATE LOGIC
    // ====================================================
    function openCustomSkillModal() {
      const modal = document.getElementById('custom-skill-modal');
      if (!modal) return;
      const tSel = document.getElementById('csk-template-select');
      if (tSel) tSel.value = '';
      const nameInput = document.getElementById('csk-name');
      if (nameInput) nameInput.value = '';
      const statInput = document.getElementById('csk-stat');
      if (statInput) statInput.value = 'int';
      const ranksInput = document.getElementById('csk-ranks');
      if (ranksInput) ranksInput.value = '0';
      const classInput = document.getElementById('csk-is-class');
      if (classInput) classInput.checked = false;
      const untrainedInput = document.getElementById('csk-untrained');
      if (untrainedInput) untrainedInput.checked = false;
      const acpInput = document.getElementById('csk-acp');
      if (acpInput) acpInput.checked = false;
      const saveDbInput = document.getElementById('csk-save-master-db');
      if (saveDbInput) saveDbInput.checked = true;
      modal.classList.remove('hidden');
    }

    function closeCustomSkillModal() {
      const modal = document.getElementById('custom-skill-modal');
      if (modal) modal.classList.add('hidden');
    }

    function onCustomSkillTemplateChange() {
      const sel = document.getElementById('csk-template-select');
      if (!sel || !sel.value) return;
      const parts = sel.value.split('|');
      const name = parts[0] || '';
      const stat = parts[1] || 'int';
      const untrained = parts[2] === 'true';
      const acp = parts[3] === 'true';

      const nameInput = document.getElementById('csk-name');
      if (nameInput) nameInput.value = name;
      const statInput = document.getElementById('csk-stat');
      if (statInput) statInput.value = stat;
      const untrainedInput = document.getElementById('csk-untrained');
      if (untrainedInput) untrainedInput.checked = untrained;
      const acpInput = document.getElementById('csk-acp');
      if (acpInput) acpInput.checked = acp;
    }

    function saveCustomSkill() {
      const nameInput = document.getElementById('csk-name');
      const name = (nameInput?.value || '').trim();
      if (!name) {
        showToast('Please enter a valid skill name.', 'error', { wrap: true });
        return;
      }

      ensureAllSkills(character);
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const existing = (character.skills || []).find(s => s.key === key || (s.name || '').toLowerCase() === name.toLowerCase());

      const stat = document.getElementById('csk-stat')?.value || 'int';
      const initialRanks = Math.max(0, parseInt(document.getElementById('csk-ranks')?.value, 10) || 0);
      const isClass = document.getElementById('csk-is-class')?.checked || false;
      const untrained = document.getElementById('csk-untrained')?.checked || false;
      const acp = document.getElementById('csk-acp')?.checked || false;
      const saveDb = document.getElementById('csk-save-master-db')?.checked !== false;

      // Budget check if starting with ranks > 0
      if (initialRanks > 0) {
        const isMerged = character.settings?.mergeSkills !== false;
        const totalPts = calculateTotalSkillPoints(character);
        const spentPts = calculateSpentSkillPoints(character, isMerged);
        const cost = initialRanks * (isClass ? 1 : 2);
        if (spentPts + cost > totalPts) {
          showToast(`Insufficient skill points! This rank requires ${cost} points, but only ${Math.max(0, totalPts - spentPts)} points remain. Starting rank set to 0.`, 'error', { wrap: true });
        }
      }

      if (existing) {
        existing.name = name;
        existing.stat = stat;
        existing.isClass = isClass;
        existing.untrained = untrained;
        existing.acp = acp;
        if (initialRanks > 0) existing.ranks = initialRanks;
      } else {
        character.skills.push({
          key: key,
          name: name,
          stat: stat,
          ranks: initialRanks,
          misc: 0,
          acp: acp,
          untrained: untrained,
          isClass: isClass,
          isCustom: true
        });
      }

      // Save to Master DB if checked
      if (saveDb && typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const isKnowledge = name.toLowerCase().startsWith('knowledge');
        const dbItem = {
          name: name,
          type: "Skill",
          category: isKnowledge ? "Knowledge Skill" : "Custom Skill",
          slot: "None",
          parent: "Skills",
          prereq: "-",
          source: "D&D 3.5e Extended",
          benefit: `${stat.toUpperCase()}-based skill. ${untrained ? 'Can be used untrained.' : 'Trained Only.'} ${acp ? 'Armor Check Penalty applies.' : 'No Armor Check Penalty.'}`,
          bonusType: "Skill",
          scope: isKnowledge ? "Knowledge" : "Skill",
          action: "Passive",
          role: "Skill / Lore",
          stat: stat,
          key: key,
          untrained: untrained,
          acp: acp,
          tags: isKnowledge ? ["skill", "knowledge", "lore"] : ["skill", "custom"]
        };

        const exIdx = masterDb.findIndex(m => (m.name || '').toLowerCase() === name.toLowerCase());
        if (exIdx >= 0) {
          masterDb[exIdx] = Object.assign({}, masterDb[exIdx], dbItem);
        } else {
          masterDb.push(dbItem);
        }
        if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
          RuleMaster.renderTable();
        }
      }

      closeCustomSkillModal();
      saveStateToStorage(true);
      renderSkills();
      showDiceTopToast({
        icon: '📜',
        title: 'Custom Skill Added',
        breakdown: `Added skill "${name}" [${stat.toUpperCase()}] to character sheet!`,
        total: `${initialRanks} Rank`
      });
    }

    function renderSkills() {
      if (!character) return;
      ensureAllSkills(character);

      const tbody = document.getElementById('skills-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      const isMerged = character.settings?.mergeSkills !== false;
      const totalPts = calculateTotalSkillPoints(character);
      const spentPts = calculateSpentSkillPoints(character, isMerged);
      const remainingPts = totalPts - spentPts;

      const spentEl = document.getElementById('skills-pts-spent');
      const totalEl = document.getElementById('skills-pts-total');
      const remBadge = document.getElementById('skills-pts-remaining-badge');

      if (spentEl) spentEl.textContent = spentPts;
      if (totalEl) totalEl.textContent = totalPts;
      if (remBadge) {
        if (remainingPts > 0) {
          remBadge.textContent = `Remaining: ${remainingPts} Pts`;
          remBadge.className = 'badge bg-slate-900 text-sky-300 border border-slate-700 text-xs font-mono font-bold px-2 py-0.5';
        } else if (remainingPts === 0) {
          remBadge.textContent = 'All Points Spent (0)';
          remBadge.className = 'badge bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-mono font-bold px-2 py-0.5';
        } else {
          remBadge.textContent = `Over Budget: +${Math.abs(remainingPts)} Pts!`;
          remBadge.className = 'badge bg-rose-950 text-rose-300 border border-rose-600 text-xs font-mono font-bold px-2 py-0.5 animate-pulse';
        }
      }

      const charLevel = Number(character.level) || 1;
      const maxClassRank = charLevel + 3;
      const maxCrossRank = Math.floor((charLevel + 3) / 2 * 10) / 10;

      const conGroups = (typeof getConsolidatedSkillGroups === 'function')
        ? getConsolidatedSkillGroups()
        : (typeof window !== 'undefined' && window.getConsolidatedSkillGroups ? window.getConsolidatedSkillGroups() : (typeof DND35_CONSOLIDATED_SKILLS !== 'undefined' ? DND35_CONSOLIDATED_SKILLS : []));

      // Update Header Badges
      const modeBadge = document.getElementById('skills-mode-badge');
      if (modeBadge) {
        modeBadge.textContent = isMerged ? `🔗 Consolidated Skills (${conGroups.length} Groups)` : 'D&D 3.5e RAW (46 Skills)';
        modeBadge.className = isMerged 
          ? 'ui-btn-xs h-6 text-[10px] px-2.5 rounded-md font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 cursor-pointer hover:border-emerald-400 transition inline-flex items-center' 
          : 'ui-btn-xs h-6 text-[10px] px-2.5 rounded-md font-bold bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer hover:border-slate-500 transition inline-flex items-center';
        modeBadge.title = 'Click to toggle in House Rules';
        modeBadge.dataset.action = 'inventory:open-house-rules';
      }

      const maxRankInfo = document.getElementById('skills-max-rank-info');
      if (maxRankInfo) {
        maxRankInfo.innerHTML = `Max Ranks: Class <strong class="text-amber-400">${maxClassRank}</strong> • Cross <strong class="text-slate-300">${maxCrossRank}</strong>`;
      }

      const searchInputEl = document.getElementById('skill-search-input');
      let searchVal = (searchInputEl?.value || '').toLowerCase().trim();
      if (!searchVal && searchInputEl) {
        const savedSearch = (localStorage.getItem('dnd35_skill_search') || '').trim();
        if (savedSearch) {
          searchInputEl.value = savedSearch;
          searchVal = savedSearch.toLowerCase();
        }
      }

      const clearBtn = document.getElementById('btn-clear-skill-search');
      if (clearBtn) {
        if (searchVal) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }

      // Collect list of items to render
      let displayItems = [];

      if (isMerged) {
        // 1. Consolidated Skill Groups
        const mergedKeysHandled = new Set();
        conGroups.forEach(conDef => {
          const compSkills = (character.skills || []).filter(s => (conDef.components || []).includes(s.key));
          (conDef.components || []).forEach(k => mergedKeysHandled.add(k));

          const ranks = Math.max(0, ...compSkills.map(s => Number(s.ranks) || 0));
          const isClass = compSkills.some(s => s.isClass);
          const misc = Math.max(0, ...compSkills.map(s => Number(s.misc) || 0));

          displayItems.push({
            key: conDef.key,
            name: conDef.name,
            subtitle: conDef.compLabels,
            stat: conDef.stat,
            ranks: ranks,
            isClass: isClass,
            acp: conDef.acp,
            misc: misc,
            isConsolidated: true,
            components: conDef.components
          });
        });

        // 2. Non-consolidated remaining skills
        (character.skills || []).forEach(sk => {
          if (!mergedKeysHandled.has(sk.key)) {
            displayItems.push({
              key: sk.key,
              name: sk.name,
              subtitle: '',
              stat: sk.stat,
              ranks: Number(sk.ranks) || 0,
              isClass: !!sk.isClass,
              acp: !!sk.acp,
              misc: Number(sk.misc) || 0,
              isConsolidated: false
            });
          }
        });
      } else {
        // Standard RAW 46 skills
        (character.skills || []).forEach(sk => {
          displayItems.push({
            key: sk.key,
            name: sk.name,
            subtitle: '',
            stat: sk.stat,
            ranks: Number(sk.ranks) || 0,
            isClass: !!sk.isClass,
            acp: !!sk.acp,
            misc: Number(sk.misc) || 0,
            isConsolidated: false
          });
        });
      }

      // Filter by activeSkillFilter
      if (activeSkillFilter === 'class') {
        displayItems = displayItems.filter(item => item.isClass);
      } else if (activeSkillFilter === 'trained') {
        displayItems = displayItems.filter(item => item.ranks > 0);
      }

      // Filter by activeSkillStatFilter
      if (activeSkillStatFilter && activeSkillStatFilter !== 'all') {
        displayItems = displayItems.filter(item => (item.stat || '').toLowerCase() === activeSkillStatFilter.toLowerCase());
      }

      // Filter by search query
      if (searchVal) {
        displayItems = displayItems.filter(item => {
          return (item.name || '').toLowerCase().includes(searchVal) ||
                 (item.subtitle || '').toLowerCase().includes(searchVal) ||
                 (item.stat || '').toLowerCase().includes(searchVal);
        });
      }

      // Sort alphabetically by name
      displayItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      if (displayItems.length === 0) {
        const trEmpty = document.createElement('tr');
        trEmpty.innerHTML = `<td colspan="9" class="py-6 text-center text-slate-500 italic">No matching skills found.</td>`;
        tbody.appendChild(trEmpty);
        return;
      }

      displayItems.forEach(item => {
        const statMod = RuleEngine.getAbilityMod(character.abilities?.[item.stat] || 10);
        const acpVal = item.acp ? Math.min(0, Number(character.acBreakdown?.acp) || 0) : 0;

        // Scope & Stacking Aware Item/Buff Bonus Calculation
        const evalSkillObj = (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateSkillBonus)
          ? RuleEngine.evaluateSkillBonus(character, item.key, item.name, item.stat)
          : { total: Number(character.buffSkillBonus) || 0, breakdown: [] };
        const buffSkillMod = evalSkillObj.total;
        const buffTooltip = evalSkillObj.breakdown.length > 0 
          ? evalSkillObj.breakdown.join(' • ') 
          : (buffSkillMod !== 0 ? `Bonus: ${buffSkillMod}` : 'No active item or spell bonus');

        const total = item.ranks + statMod + item.misc + acpVal + buffSkillMod;
        const maxRankAllowed = item.isClass ? maxClassRank : maxCrossRank;
        const isOverRank = item.ranks > maxRankAllowed;
        const safeName = UI.escapeAttr(item.name);
        const safeSubtitle = UI.escapeAttr(item.subtitle || '');

        const statLabels = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
        const statDisplay = statLabels[(item.stat || '').toLowerCase()] || String(item.stat || '').toUpperCase();

        const tr = document.createElement('tr');
        tr.className = `hover:bg-slate-900/60 transition ${item.isConsolidated ? 'bg-emerald-950/15' : ''}`;
        tr.innerHTML = `
          <!-- Sınıf Becerisi (Class Skill) Toggle Checkbox -->
          <td class="py-2 px-2 text-center align-middle">
            <button 
              type="button" 
              data-action="inventory:toggle-skill-class"
              data-skill-key="${item.key}"
              title="${item.isClass ? 'Class Skill • Click to make Cross-Class' : 'Cross-Class Skill • Click to make Class Skill'}"
              class="w-6 h-6 rounded flex items-center justify-center transition ${item.isClass ? 'text-amber-400 hover:text-amber-300 font-black' : 'text-slate-600 hover:text-slate-400 font-normal'}">
              <span>${item.isClass ? '⭐' : '⚪'}</span>
            </button>
          </td>

          <!-- Skill Name & Components -->
          <td class="py-2 px-3 align-middle">
            <div class="font-bold ${item.isClass ? 'text-amber-300' : 'text-white'} flex items-center gap-2 flex-wrap">
              ${getUniversalPinButtonHtml({ name: item.name, type: 'Skill', action: 'Check', desc: `${item.name} skill check (${total >= 0 ? '+' : ''}${total})`, badge: `${total >= 0 ? '+' : ''}${total} Check` })}
              <span>${UI.escapeHtml(item.name)}</span>
              ${item.isConsolidated ? '<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px]">Consolidated</span>' : ''}
              ${item.isClass ? '<span class="badge bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-mono">Class</span>' : ''}
            </div>
            ${item.subtitle ? `<div class="text-[10px] text-emerald-400/80 font-mono mt-0.5">↳ ${UI.escapeHtml(item.subtitle)}</div>` : ''}
          </td>

          <!-- Stat -->
          <td class="py-2 px-2 text-center align-middle">
            <span lang="en" class="badge bg-slate-950 text-slate-300 border border-slate-700 font-mono text-[10px] font-bold px-1.5 py-0.5">
              ${statDisplay}
            </span>
          </td>

          <!-- Total -->
          <td class="py-2 px-2 text-center align-middle font-black font-mono text-base ${total >= 0 ? 'text-emerald-400' : 'text-rose-400'}" title="Total Skill Modifier: ${total >= 0 ? '+' : ''}${total}">
            ${total >= 0 ? '+' : ''}${total}
          </td>

          <!-- 3D Roll -->
          <td class="py-2 px-3 text-center align-middle">
            <div class="inline-flex items-center gap-1">
              <button data-action="inventory:roll-skill" data-skill-name="${safeName}" data-total="${total}" data-subtitle="${safeSubtitle}" class="bg-slate-800 hover:bg-slate-700 text-amber-400 px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-mono transition inline-flex items-center gap-1.5 justify-center shadow-sm active:scale-95" title="Roll 1d20${total >= 0 ? '+' : ''}${total} ${safeName} check">
                ${getD20IconSvg('w-3.5 h-3.5 text-amber-400')}
                <span>Roll</span>
              </button>
            </div>
          </td>

          <!-- Rank & Rank Adjustment Buttons -->
          <td class="py-2 px-2 text-center align-middle font-mono">
            <div class="inline-flex items-center gap-1">
              <button data-action="inventory:adjust-skill-rank" data-skill-key="${item.key}" data-delta="-1" class="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] leading-none">-</button>
              <span class="w-6 text-center font-bold ${isOverRank ? 'text-rose-400 animate-pulse' : (item.ranks > 0 ? 'text-sky-300' : 'text-slate-500')}">${item.ranks}</span>
              <button data-action="inventory:adjust-skill-rank" data-skill-key="${item.key}" data-delta="1" class="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] leading-none">+</button>
            </div>
            <div class="text-[10px] text-slate-500 font-mono">/ ${maxRankAllowed}</div>
          </td>

          <!-- Stat Mod -->
          <td class="py-2 px-2 text-center align-middle text-slate-400 font-mono">
            ${statMod >= 0 ? '+' : ''}${statMod}
          </td>

          <!-- ACP -->
          <td class="py-2 px-2 text-center align-middle font-mono ${item.acp ? (acpVal < 0 ? 'text-amber-400 font-bold' : 'text-slate-500') : 'text-slate-700'}">
            ${item.acp ? (acpVal < 0 ? String(acpVal) : '0') : '-'}
          </td>

          <!-- Buff / Debuff Bonus -->
          <td class="py-2 px-2 text-center align-middle font-mono ${buffSkillMod !== 0 ? (buffSkillMod > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold') : 'text-slate-600'}" title="${buffTooltip}">
            ${buffSkillMod !== 0 ? (buffSkillMod > 0 ? '+' + buffSkillMod : buffSkillMod) : '-'}
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Defense Detailed RAW Breakdown (Madde 9 & 10)
    function renderDefenseBreakdown() {
      const acList = document.getElementById('defense-ac-breakdown-list');
      const savesList = document.getElementById('defense-saves-breakdown-list');
      if (!acList || !savesList) return;

      const dexMod = RuleEngine.getAbilityMod(character.abilities?.dex || 10);
      const conMod = RuleEngine.getAbilityMod(character.abilities?.con || 10);
      const wisMod = RuleEngine.getAbilityMod(character.abilities?.wis || 10);
      const intMod = RuleEngine.getAbilityMod(character.abilities?.int || 10);

      // Sync and retrieve tactical modifiers
      const ceVal = character.tactical?.combatExpertise !== undefined
        ? character.tactical.combatExpertise
        : (parseInt(document.getElementById('combat-expertise-val')?.textContent) || 0);

      const fdVal = character.tactical?.fightingDefensively !== undefined
        ? character.tactical.fightingDefensively
        : false;

      const tdVal = character.tactical?.totalDefense !== undefined
        ? character.tactical.totalDefense
        : false;

      const chargeVal = character.tactical?.charge !== undefined
        ? character.tactical.charge
        : false;

      const acCalc = RuleEngine.evaluateAC(character, {
        combatExpertise: ceVal,
        fightingDefensively: fdVal,
        totalDefense: tdVal,
        charge: chargeVal
      });

      const bd = character.acBreakdown || {};
      const totalBadge = document.getElementById('defense-ac-total-badge');
      if (totalBadge) totalBadge.textContent = `Total: ${bd.total ?? acCalc.total} • Touch: ${bd.touch ?? acCalc.touch} • Flat: ${bd.flat ?? acCalc.flat}`;

      const maxDexInfo = bd.maxDex !== null && bd.maxDex !== undefined ? ` <span class="text-[10px] text-slate-400 font-normal">(Max Dex: +${bd.maxDex})</span>` : '';
      // Size modifier (PHB Table 8-1) and insight / luck / sacred / profane / untyped bonuses are shown only when non-zero,
      // so the listed rows always add up to the engine's FINAL ARMOR CLASS.
      const fmtSigned = (n) => (Number(n) || 0) >= 0 ? `+${Number(n) || 0}` : `${Number(n)}`;
      const sizeInfo = (Number(bd.size) || 0) !== 0 ? `<div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Size Modifier:</span><span class="text-white font-bold">${fmtSigned(bd.size)}</span></div>` : '';
      const miscSources = Array.isArray(bd.sources?.misc) ? bd.sources.misc.filter(s => s && s.source) : [];
      const miscSourceStr = miscSources.length > 0
        ? ` <span class="text-[10px] text-slate-500 font-normal">(${miscSources.map(s => `${UI.escapeHtml(s.source)} +${s.val} ${UI.escapeHtml(s.type || '')}`.trim()).join(', ')})</span>`
        : '';
      const miscInfo = (Number(bd.misc) || 0) !== 0 ? `<div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Other Bonuses:${miscSourceStr}</span><span class="text-amber-400 font-bold">${fmtSigned(bd.misc)}</span></div>` : '';
      const penaltyInfo = bd.penalty > 0 ?`<div class="flex justify-between py-1 border-b border-slate-800 text-rose-400 font-bold"><span class="text-rose-300">Defense Penalties (Charge/Stance):</span><span>-${bd.penalty}</span></div>` : '';
      
      const armorSourceStr = (Array.isArray(bd.sources?.armor) && bd.sources.armor.length > 0 && bd.sources.armor[0].source) 
        ? ` <span class="text-[10px] text-sky-400 font-normal">(${UI.escapeHtml(bd.sources.armor[0].source)})</span>`
        : (bd.armorCategory && bd.armorCategory !== 'None' ? ` <span class="text-[10px] text-sky-500 font-normal">(${bd.armorCategory})</span>` : '');

      const shieldSourceStr = (Array.isArray(bd.sources?.shield) && bd.sources.shield.length > 0)
        ? (bd.sources.shield.length > 1
            ? ` <span class="text-[10px] text-sky-400 font-normal">(${bd.sources.shield.map(s => `${UI.escapeHtml(s.source)} +${s.val}`).join(', ')})</span>`
            : (bd.sources.shield[0].source ? ` <span class="text-[10px] text-sky-400 font-normal">(${UI.escapeHtml(bd.sources.shield[0].source)})</span>` : ''))
        : '';

      const deflSourceStr = (Array.isArray(bd.sources?.deflection) && bd.sources.deflection.length > 0 && bd.sources.deflection[0].source)
        ? ` <span class="text-[10px] text-indigo-300 font-normal">(${UI.escapeHtml(bd.sources.deflection[0].source)})</span>`
        : '';

      let naturalDetail = '';
      if (Array.isArray(bd.sources?.natural) && bd.sources.natural.length > 0) {
        if (bd.sources.natural.length > 1) {
          const natItems = bd.sources.natural.map(s => {
            const typeLabel = (s.type === 'Natural_Armor_Ench' || s.type === 'natural_armor_ench' || (s.type && s.type.toLowerCase().includes('ench'))) ? 'Enh' : 'Base';
            return `${s.source}: +${s.val} (${typeLabel})`;
          }).join(', ');
          naturalDetail = ` <span class="text-[10px] text-slate-500 font-normal">(${natItems})</span>`;
        } else if (bd.sources.natural[0].source) {
          naturalDetail = ` <span class="text-[10px] text-teal-300 font-normal">(${UI.escapeHtml(bd.sources.natural[0].source)})</span>`;
        }
      }

      const condAcList = Array.isArray(character.conditionalAcBonuses)
        ? character.conditionalAcBonuses
        : (Array.isArray(bd.conditionalBonuses) ? bd.conditionalBonuses : []);
      const conditionalAcHtml = condAcList.length > 0 ? `
        <div class="pt-1.5 mt-1 border-t border-indigo-500/30 space-y-1 font-sans">
          <div class="text-[10px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1">
            <span>🛡️</span>
            <span>Situational AC Bonuses (Not Added to Base AC)</span>
          </div>
          ${condAcList.map(c => {
            const sign = (Number(c.val) || 0) >= 0 ? '+' : '';
            const typeStr = c.type && c.type !== 'Untyped' ? ` ${c.type}` : '';
            const condStr = c.condition ? ` (${c.condition})` : '';
            const srcStr = c.source ? ` <span class="text-slate-400 font-normal">— ${UI.escapeHtml(c.source)}</span>` : '';
            return `<div class="flex items-center justify-between text-[11px] bg-indigo-950/40 border border-indigo-500/30 rounded px-2 py-0.5 text-indigo-200"><span class="font-semibold">${sign}${c.val}${typeStr} AC <span class="text-amber-300 font-bold">${condStr}</span>${srcStr}</span></div>`;
          }).join('')}
        </div>
      ` : '';

      acList.innerHTML = `
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Base 10:</span><span class="text-white font-bold">10</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Armor Bonus:${armorSourceStr}</span><span class="text-sky-400 font-bold">+${bd.armor || 0}</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Shield Bonus:${shieldSourceStr}</span><span class="text-sky-400 font-bold">+${bd.shield || 0}</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">DEX Modifier${maxDexInfo}:</span><span class="text-emerald-400 font-bold">${fmtSigned(bd.effectiveDex ?? dexMod)}</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Deflection Bonus:${deflSourceStr}</span><span class="text-indigo-400 font-bold">+${bd.deflection || 0}</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Natural Armor:${naturalDetail}</span><span class="text-teal-400 font-bold">+${bd.natural || 0}</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Dodge Bonus (Stacks):</span><span class="text-amber-400 font-bold">+${bd.dodge || 0}</span></div>
        ${sizeInfo}
        ${miscInfo}
        ${penaltyInfo}
        <div class="flex justify-between py-1.5 text-slate-300 font-bold border-t border-slate-700 mt-1"><span class="text-amber-300 text-xs">FINAL ARMOR CLASS:</span><span class="text-amber-400 text-sm font-black">${bd.total || acCalc.total} AC</span></div>
        <div class="flex justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Touch: <strong class="text-sky-400">${bd.touch || acCalc.touch}</strong></span>
          <span>Flat-Footed: <strong class="text-slate-400">${bd.flat || acCalc.flat}</strong></span>
          <span>Armor Check Penalty (ACP): <strong class="text-rose-400">${bd.acp ? '-' + Math.abs(bd.acp) : '0'}</strong></span>
        </div>
        ${conditionalAcHtml}
      `;

      const saves = RuleEngine.evaluateSaves(character);
      const warbladeLvl = 1;
      const battleClarityInt = Math.min(warbladeLvl, Math.max(0, intMod));

      const baseFort = character.baseSaves?.fort || 0;
      const baseRef = character.baseSaves?.ref || 0;
      const baseWill = character.baseSaves?.will || 0;
      const resist = character.saveBonuses?.resistance || 0;

      const useConForWill = Boolean(saves.hasSteadfastDetermination || character.ruleFlags?.conToWillSave);
      const willStatMod = useConForWill ? conMod : wisMod;
      const willStatLabel = useConForWill ? 'Con [Steadfast Determination]' : 'Wis';

      const bonusFort = saves.bonusFort ?? (saves.fort - (baseFort + conMod + resist));
      const bonusRef = saves.bonusRef ?? (saves.ref - (baseRef + dexMod + resist));
      const bonusWill = saves.bonusWill ?? (saves.will - (baseWill + willStatMod + resist));

      const formatBonusText = (b) => {
        if (b > 0) return ` <span class="text-amber-300 font-bold">+ ${b} (Bonus)</span>`;
        if (b < 0) return ` <span class="text-rose-400 font-bold">- ${Math.abs(b)} (Bonus)</span>`;
        return ` <span class="text-slate-400">+ 0 (Bonus)</span>`;
      };

      // Bonus Descriptions / Explanations
      const bonusNotes = [];

      // 1. Battle Clarity
      const hasBattleClarity = (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : a?.name || '').toLowerCase().includes('battle clarity')) || (character.classes || '').toLowerCase().includes('warblade');
      if (hasBattleClarity) {
        bonusNotes.push(`
          <div class="flex items-center justify-between py-0.5">
            <span>✨ Battle Clarity (Warblade 1): Adds +${battleClarityInt} INT bonus to Reflex saves while not flat-footed.</span>
            <span class="text-emerald-400 font-bold font-mono">Final Ref: +${saves.ref}</span>
          </div>
        `);
      }

      // 2. Active Buffs & Debuffs contributing to saves
      (character.buffs || []).forEach(b => {
        if (!b || !b.active) return;
        const bNotes = [];
        if (b.saveBonus) bNotes.push(`All Saves ${b.saveBonus > 0 ? '+' : ''}${b.saveBonus}`);
        if (b.fortBonus) bNotes.push(`Fort ${b.fortBonus > 0 ? '+' : ''}${b.fortBonus}`);
        if (b.refBonus) bNotes.push(`Ref ${b.refBonus > 0 ? '+' : ''}${b.refBonus}`);
        if (b.willBonus) bNotes.push(`Will ${b.willBonus > 0 ? '+' : ''}${b.willBonus}`);
        if (b.negativeLevels) bNotes.push(`-${b.negativeLevels} Negative Levels (-${b.negativeLevels} on all Saving Throws)`);
        if (Array.isArray(b.children)) {
          b.children.forEach(c => {
            if (!c) return;
            if (c.saveBonus) bNotes.push(`All Saves ${c.saveBonus > 0 ? '+' : ''}${c.saveBonus}`);
            if (c.fortBonus && c.refBonus && c.willBonus && c.fortBonus === c.refBonus && c.refBonus === c.willBonus) {
              bNotes.push(`All Saves ${c.fortBonus > 0 ? '+' : ''}${c.fortBonus}`);
            } else {
              if (c.fortBonus) bNotes.push(`Fort ${c.fortBonus > 0 ? '+' : ''}${c.fortBonus}`);
              if (c.refBonus) bNotes.push(`Ref ${c.refBonus > 0 ? '+' : ''}${c.refBonus}`);
              if (c.willBonus) bNotes.push(`Will ${c.willBonus > 0 ? '+' : ''}${c.willBonus}`);
            }
          });
        }
        if (bNotes.length > 0) {
          const isDebuff = b.isDebuff || b.bonusType === 'Penalty' || b.negativeLevels;
          bonusNotes.push(`
            <div class="flex items-center justify-between py-0.5 ${isDebuff ? 'text-rose-300 font-semibold' : 'text-amber-300'}">
              <span>${isDebuff ? '🩸' : '✨'} ${UI.escapeHtml(b.name || 'Active Effect')}: ${bNotes.join(', ')}</span>
            </div>
          `);
        }
      });

      // 3. Feats contributing to saves
      const progFeats = Array.isArray(character.levelProgression)
        ? character.levelProgression.filter(r => r && r.active !== false).flatMap(r => [...(r.feats || []), ...(r.specialAbilities || [])])
        : [];
      const charFeats = [...(character.feats || []), ...(character.specialAbilities || []), ...progFeats]
        .map(f => (typeof f === 'string' ? f : f?.name || '').toLowerCase());
      if (charFeats.some(f => f.includes('great fortitude'))) {
        bonusNotes.push(`<div class="py-0.5 text-slate-300">✨ Great Fortitude: +2 feat bonus on Fortitude saving throws.</div>`);
      }
      if (charFeats.some(f => f.includes('lightning reflexes'))) {
        bonusNotes.push(`<div class="py-0.5 text-slate-300">✨ Lightning Reflexes: +2 feat bonus on Reflex saving throws.</div>`);
      }
      if (charFeats.some(f => f.includes('iron will'))) {
        bonusNotes.push(`<div class="py-0.5 text-slate-300">✨ Iron Will: +2 feat bonus on Will saving throws.</div>`);
      }
      if (charFeats.some(f => f.includes('save magic') || f.includes('draconic save'))) {
        bonusNotes.push(`<div class="py-0.5 text-slate-300">✨ Draconic Aura: +1 bonus on saving throws against spells.</div>`);
      }
      if (useConForWill || charFeats.some(f => f.includes('steadfast determination'))) {
        bonusNotes.push(`<div class="py-0.5 text-slate-300">✨ Steadfast Determination: Uses CON modifier instead of WIS on Will saves; Natural 1 on Fortitude saves is not an automatic failure.</div>`);
      }

      // 4. Situational / Conditional Save Bonuses (Not Added to Base Saves)
      if (Array.isArray(character.conditionalSaveBonuses) && character.conditionalSaveBonuses.length > 0) {
        character.conditionalSaveBonuses.forEach(cs => {
          const sign = (Number(cs.val) || 0) >= 0 ? '+' : '';
          const typeStr = cs.type && cs.type !== 'Untyped' ? ` ${cs.type}` : '';
          const condStr = cs.condition ? ` (${cs.condition})` : '';
          const srcStr = cs.source ? ` — ${UI.escapeHtml(cs.source)}` : '';
          bonusNotes.push(`<div class="py-0.5 text-indigo-200 font-semibold">🛡️ Situational Save: ${sign}${cs.val}${typeStr} to ${cs.target || 'All Saves'} <span class="text-amber-300 font-bold">${condStr}</span><span class="text-slate-400 font-normal">${srcStr}</span></div>`);
        });
      }

      // Attack Bonus Detailed RAW Breakdown
      const atkList = document.getElementById('defense-attack-breakdown-list');
      const atkBadge = document.getElementById('defense-atk-total-badge');
      if (atkList) {
        const activeWep = (character.weapons || []).find(w => w && w.name === character.activeWeapon) || (character.weapons || [])[0] || { name: 'Unarmed Strike', dice: '1d3', slot: 'One-Handed' };
        
        let wepEval = null;
        if (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateWeaponAttack) {
          wepEval = RuleEngine.evaluateWeaponAttack(character, activeWep, {
            powerAttack: character.tactical?.powerAttack || 0,
            combatExpertise: ceVal,
            fightingDefensively: fdVal,
            flanking: character.tactical?.flanking || false,
            charge: chargeVal,
            higherGround: character.tactical?.higherGround || false
          });
        }

        const babVal = Number(character.bab) || 0;
        const netAtk = wepEval?.netAttackBonus ?? (babVal + strMod);
        const iteratives = wepEval?.iteratives || [netAtk];
        const iterativesText = iteratives.map(v => (v >= 0 ? '+' : '') + v).join(' / ');

        if (atkBadge) atkBadge.textContent = `Total: ${netAtk >= 0 ? '+' : ''}${netAtk} (${iterativesText})`;

        // Only the components the engine applied (a non-stacking same-type bonus is tagged applied:false), so the list sums to netAtk.
        const atkItems = (wepEval && Array.isArray(wepEval.attackBonusItems) && wepEval.attackBonusItems.length > 0)
          ? wepEval.attackBonusItems.filter(item => item.applied !== false)
          : [
              { source: 'BAB', val: babVal },
              { source: 'STR Modifier', val: strMod }
            ];

        const itemsHtml = atkItems.map(item => {
          const valStr = item.val >= 0 ? `+${item.val}` : `${item.val}`;
          const colorClass = item.val > 0 ? 'text-sky-400' : (item.val < 0 ? 'text-rose-400' : 'text-slate-400');
          return `
            <div class="flex justify-between py-0.5 border-b border-slate-800/80">
              <span class="text-slate-400">${UI.escapeHtml(item.source)}:</span>
              <span class="${colorClass} font-bold">${valStr}</span>
            </div>
          `;
        }).join('');

        atkList.innerHTML = `
          ${itemsHtml}
          <div class="flex justify-between py-1 text-slate-300 font-bold border-t border-slate-700 mt-1">
            <span class="text-amber-300 text-xs">FINAL ATTACK BONUS:</span>
            <span class="text-amber-400 text-sm font-black">${netAtk >= 0 ? '+' : ''}${netAtk}</span>
          </div>
          <div class="flex justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Active Weapon: <strong class="text-slate-200">${UI.escapeHtml(activeWep.name || 'Unarmed Strike')}</strong></span>
            <span>Full Attack: <strong class="text-amber-300">${iterativesText}</strong></span>
          </div>
        `;
      }

      savesList.innerHTML = `
        <div class="flex items-center py-0.5 border-b border-slate-800/80 text-xs font-mono">
          <span class="text-slate-400 w-24 sm:w-36 shrink-0 flex items-center gap-1.5 font-sans">
            <span>🛡️</span>
            <span>Fortitude:</span>
          </span>
          <span class="text-emerald-400 font-bold w-7 sm:w-9 text-right shrink-0">${saves.fort >= 0 ? '+' : ''}${saves.fort}</span>
          <span class="text-slate-500 font-bold px-1 sm:px-2 shrink-0">:</span>
          <span class="text-white flex-1 min-w-0 text-[11px] sm:text-xs break-words">
            ${baseFort} (Base) + ${conMod} (Con) + ${resist} (Resist)${formatBonusText(bonusFort)}
          </span>
        </div>
        <div class="flex items-center py-0.5 border-b border-slate-800/80 text-xs font-mono">
          <span class="text-slate-400 w-24 sm:w-36 shrink-0 flex items-center gap-1.5 font-sans">
            <span>⚡</span>
            <span>Reflex:</span>
          </span>
          <span class="text-sky-400 font-bold w-7 sm:w-9 text-right shrink-0">${saves.ref >= 0 ? '+' : ''}${saves.ref}</span>
          <span class="text-slate-500 font-bold px-1 sm:px-2 shrink-0">:</span>
          <span class="text-white flex-1 min-w-0 text-[11px] sm:text-xs break-words">
            ${baseRef} (Base) + ${dexMod} (Dex) + ${resist} (Resist)${formatBonusText(bonusRef)}
          </span>
        </div>
        <div class="flex items-center py-0.5 border-b border-slate-800/80 text-xs font-mono">
          <span class="text-slate-400 w-24 sm:w-36 shrink-0 flex items-center gap-1.5 font-sans">
            <span>🧠</span>
            <span>Will:</span>
          </span>
          <span class="text-purple-400 font-bold w-7 sm:w-9 text-right shrink-0">${saves.will >= 0 ? '+' : ''}${saves.will}</span>
          <span class="text-slate-500 font-bold px-1 sm:px-2 shrink-0">:</span>
          <span class="text-white flex-1 min-w-0 text-[11px] sm:text-xs break-words">
            ${baseWill} (Base) + ${willStatMod} (${willStatLabel}) + ${resist} (Resist)${formatBonusText(bonusWill)}
          </span>
        </div>
        <div class="pt-1 space-y-0.5 text-[10px] text-indigo-300 font-sans border-t border-slate-800/60 mt-0.5">
          ${bonusNotes.join('')}
        </div>
      `;
    }

    function recalculateDefense() {
      const ceInput = document.getElementById('combat-expertise-val');
      const ceVal = character.tactical?.combatExpertise !== undefined
        ? character.tactical.combatExpertise
        : (parseInt(ceInput?.value || ceInput?.textContent) || 0);
      if (!character.tactical) character.tactical = {};
      character.tactical.combatExpertise = ceVal;

      const fdVal = character.tactical?.fightingDefensively !== undefined
        ? character.tactical.fightingDefensively
        : false;
      character.tactical.fightingDefensively = fdVal;

      const tdVal = character.tactical?.totalDefense !== undefined
        ? character.tactical.totalDefense
        : false;
      character.tactical.totalDefense = tdVal;

      // Keep the Cockpit Combat Expertise readout synced
      if (ceInput && ceInput.tagName === 'SPAN') ceInput.textContent = ceVal;

      if (typeof RuleEngine !== 'undefined' && RuleEngine.recalculateCharacter) {
        RuleEngine.recalculateCharacter(character, (typeof masterDb !== 'undefined' ? masterDb : []), {
          combatExpertise: ceVal,
          fightingDefensively: character.tactical.fightingDefensively,
          totalDefense: character.tactical.totalDefense,
          charge: character.tactical.charge || false
        });
      }
      saveStateToStorage(false);
      renderHUD();
      if (typeof renderDefenseModifiersGrid === 'function') {
        renderDefenseModifiersGrid();
      }
      renderDefenseBreakdown();
      if (typeof renderCombatCockpit === 'function') renderCombatCockpit();
    }

    // ✨ ACTIVE BUFFS & ROUND COUNTDOWN ENGINE
    function setBuffsViewMode(mode) {
      if (!character) return;
      if (!character.tactical) character.tactical = {};
      character.tactical.buffsViewMode = mode;
      saveStateToStorage(false);
      renderActiveBuffs();
    }

    function renderActiveBuffs() {
      const container = document.getElementById('buffs-list-container');
      if (!container) return;
      container.innerHTML = '';

      if (!Array.isArray(character.buffs)) {
        character.buffs = [];
      }

      const viewMode = character.tactical?.buffsViewMode || 'grid';

      // Update switcher buttons UI
      const gridBtn = document.getElementById('buffs-view-grid-btn');
      const listBtn = document.getElementById('buffs-view-list-btn');
      if (gridBtn && listBtn) {
        if (viewMode === 'list') {
          listBtn.className = "h-full w-full px-2 rounded-md font-bold transition inline-flex items-center justify-center gap-1 cursor-pointer bg-indigo-600 text-white shadow-sm";
          gridBtn.className = "h-full w-full px-2 rounded-md font-bold transition inline-flex items-center justify-center gap-1 cursor-pointer text-slate-400 hover:text-white";
        } else {
          gridBtn.className = "h-full w-full px-2 rounded-md font-bold transition inline-flex items-center justify-center gap-1 cursor-pointer bg-indigo-600 text-white shadow-sm";
          listBtn.className = "h-full w-full px-2 rounded-md font-bold transition inline-flex items-center justify-center gap-1 cursor-pointer text-slate-400 hover:text-white";
        }
      }

      // Container layout class based on viewMode
      if (viewMode === 'list') {
        container.className = "p-3 flex flex-col gap-2";
      } else {
        container.className = "p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5";
      }

      // Sort buffs: Active ones (active === true) first!
      const sortedBuffs = [...character.buffs].sort((a, b) => {
        const aAct = a.active ? 1 : 0;
        const bAct = b.active ? 1 : 0;
        return bAct - aAct;
      });

      // Detect active body slot armor & shield to inform user of suppressed stackings
      const activeArmor = Object.values(character.bodySlots || {}).find(s => s && s.active && s.name && s.name !== '-' && (s.category === 'Armor' || (s.slot && s.slot.toLowerCase().includes('armor'))));
      const activeShield = Object.values(character.bodySlots || {}).find(s => s && s.active && s.name && s.name !== '-' && (s.category === 'Shield' || (s.slot && s.slot.toLowerCase().includes('shield'))));

      let activeArmorVal = 0;
      if (activeArmor && RuleEngine) {
        const m = RuleEngine.parseItemModifiers(activeArmor, masterDb);
        if (m) activeArmorVal = m.armor;
      }
      let activeShieldVal = 0;
      if (activeShield && RuleEngine) {
        const m = RuleEngine.parseItemModifiers(activeShield, masterDb);
        if (m) activeShieldVal = m.shield;
      }

      sortedBuffs.forEach((buff, sIdx) => {
        if (!buff.id) {
          buff.id = 'buff_' + String(buff.name || sIdx).toLowerCase().replace(/[^a-z0-9]+/g, '_');
        }
        const isAct = buff.active;
        const isDebuff = buff.isDebuff || buff.category === 'Debuff';

        const activeBorder = isDebuff 
          ? 'bg-slate-900/95 border-rose-500/70 shadow-lg ring-1 ring-rose-500/20' 
          : 'bg-slate-900/90 border-indigo-500/70 shadow-lg ring-1 ring-indigo-500/20';
        const inactiveBorder = isDebuff 
          ? 'bg-slate-950/40 border-rose-950/50 opacity-60 hover:opacity-90' 
          : 'bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-90';

        // Stacking check
        let suppressionWarning = '';
        if (isAct) {
          if (buff.bonusType === 'Armor' && activeArmor && buff.acBonus && activeArmorVal >= buff.acBonus) {
            suppressionWarning = `⚠️ Suppressed because equipped ${activeArmor.name} (+${activeArmorVal}) provides a higher Armor bonus (D&D 3.5e Stacking).`;
          } else if (buff.bonusType === 'Shield' && activeShield && buff.acBonus && activeShieldVal >= buff.acBonus) {
            suppressionWarning = `⚠️ Suppressed because equipped ${activeShield.name} (+${activeShieldVal}) provides a higher Shield bonus.`;
          } else if (buff.strBonus && buff.bonusType === 'Enhancement') {
            const belt = character.bodySlots?.belt;
            if (belt && belt.active && (belt.name || '').toLowerCase().includes('giant strength')) {
              suppressionWarning = `ℹ️ ${belt.name} (+2 Enhancement) is equipped. D&D 3.5e Stacking: Same-type Enhancement bonuses do not stack; higher value (+4) applies (Net gain: +2 STR).`;
            }
          } else if (buff.dexBonus && buff.bonusType === 'Enhancement') {
            const gloves = character.bodySlots?.gloves;
            if (gloves && gloves.active && (gloves.name || '').toLowerCase().includes('dexterity')) {
              suppressionWarning = `ℹ️ ${gloves.name} (+2 Enhancement) is equipped. D&D 3.5e Stacking: Same-type Enhancement bonuses do not stack; higher value (+4) applies (Net gain: +2 DEX).`;
            }
          }
        }

        // Summary badges (Canonical V2 modifiers, ruleFlags, summary + Legacy fields)
        const badges = [];
        if (isDebuff) badges.push(`<span class="bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">🩸 DEBUFF</span>`);
        if (buff.targetWeapon) badges.push(`<span class="bg-amber-950 text-amber-200 border border-amber-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">⚔️ ${UI.escapeHtml(buff.targetWeapon)}</span>`);
        if (buff.chosenEnergy) badges.push(`<span class="bg-orange-950 text-orange-200 border border-orange-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">🔥 ${buff.chosenEnergy}</span>`);
        if (buff.negativeLevels) badges.push(`<span class="bg-rose-950 text-rose-200 border border-rose-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">-${buff.negativeLevels} Level Drain</span>`);

        // Render Canonical V2 modifiers if present
        const hasV2Modifiers = Array.isArray(buff.modifiers) && buff.modifiers.length > 0;
        const buffCl = Number(buff.casterLevel || buff.cl || character.level) || 1;
        const hasDynamicClFormula = hasV2Modifiers && buff.modifiers.some(m => m && String(m.formula || '').includes('@cl'));
        if (hasDynamicClFormula || buff.casterLevel || buff.cl) {
          badges.push(`<span class="bg-slate-800/90 text-amber-300 border border-amber-700/60 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">CL ${buffCl}</span>`);
        }
        if (hasV2Modifiers) {
          const evalCtx = { cl: buffCl, level: Number(character.level) || 1, bab: Number(character.bab) || 0 };
          buff.modifiers.forEach(mod => {
            if (!mod) return;
            const lbl = (typeof RuleEngine !== 'undefined' && RuleEngine.formatBuffModifierLabel)
              ? RuleEngine.formatBuffModifierLabel(mod, evalCtx)
              : `${mod.value > 0 ? '+' : ''}${mod.value || mod.formula} ${mod.target}`;
            if (!lbl) return;
            const isNeg = String(lbl).trim().startsWith('-');
            const cls = isNeg
              ? 'bg-rose-950 text-rose-300 border-rose-800'
              : 'bg-indigo-950 text-indigo-200 border-indigo-700/80';
            badges.push(`<span class="${cls} border px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${lbl}</span>`);
          });
        } else {
          if (buff.acBonus) badges.push(`<span class="${buff.acBonus < 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-sky-950 text-sky-300 border-sky-800'} border px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${buff.acBonus > 0 ? '+' : ''}${buff.acBonus} AC (${buff.bonusType || 'Armor'})</span>`);
          if (buff.naturalBonus) badges.push(`<span class="bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">+${buff.naturalBonus} Natural AC</span>`);
          if (buff.deflectionBonus) badges.push(`<span class="bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">+${buff.deflectionBonus} Deflection AC</span>`);
          if (buff.dodgeBonus) badges.push(`<span class="bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">+${buff.dodgeBonus} Dodge AC</span>`);
          if (buff.acPenalty) badges.push(`<span class="bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">-${buff.acPenalty} AC</span>`);
          if (buff.strBonus) badges.push(`<span class="${buff.strBonus < 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'} border px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${buff.strBonus > 0 ? '+' : ''}${buff.strBonus} STR</span>`);
          if (buff.dexBonus) badges.push(`<span class="${buff.dexBonus < 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'} border px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${buff.dexBonus > 0 ? '+' : ''}${buff.dexBonus} DEX</span>`);
          if (buff.conBonus) badges.push(`<span class="${buff.conBonus < 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'} border px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${buff.conBonus > 0 ? '+' : ''}${buff.conBonus} CON</span>`);
          if (buff.intBonus) badges.push(`<span class="${buff.intBonus < 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'} border px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${buff.intBonus > 0 ? '+' : ''}${buff.intBonus} INT</span>`);
          if (buff.wisBonus) badges.push(`<span class="${buff.wisBonus < 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'} border px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${buff.wisBonus > 0 ? '+' : ''}${buff.wisBonus} WIS</span>`);
          if (buff.chaBonus) badges.push(`<span class="${buff.chaBonus < 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'} border px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${buff.chaBonus > 0 ? '+' : ''}${buff.chaBonus} CHA</span>`);
          if (buff.attBonus) badges.push(`<span class="${buff.attBonus < 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-purple-950 text-purple-300 border-purple-800'} border px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${buff.attBonus > 0 ? '+' : ''}${buff.attBonus} Attack</span>`);
          if (buff.dmgBonus) badges.push(`<span class="${buff.dmgBonus < 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-purple-950 text-purple-300 border-purple-800'} border px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${buff.dmgBonus > 0 ? '+' : ''}${buff.dmgBonus} Damage</span>`);
          if (buff.dmgDice) badges.push(`<span class="bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">+${buff.dmgDice} Damage</span>`);
          if (buff.speedBonus) badges.push(`<span class="bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">+${buff.speedBonus} ft Speed</span>`);
          if (buff.speedPenalty) badges.push(`<span class="bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">-${buff.speedPenalty} ft Speed</span>`);
          if (buff.hpPenalty) badges.push(`<span class="bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">-${buff.hpPenalty} HP</span>`);
        }

        // Render V2 ruleFlags & special defense pills if not already covered
        const rf = buff.ruleFlags || {};
        if (rf.extraAttackFullAttack) badges.push(`<span class="bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">⚡ +1 Extra Attack</span>`);
        if (rf.babEqualsLevel) badges.push(`<span class="bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">⚔️ BAB = Level</span>`);
        if (rf.loseDexToAC) badges.push(`<span class="bg-rose-950 text-rose-200 border border-rose-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">⚠️ Lose DEX to AC</span>`);
        if (rf.halfSpeed) badges.push(`<span class="bg-rose-950 text-rose-200 border border-rose-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">🥾 Half Speed</span>`);
        if (buff.summary && badges.length <= 2) {
          badges.push(`<span class="bg-slate-800 text-emerald-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">${UI.escapeHtml(buff.summary)}</span>`);
        }
        const buffDescText = buff.notes || buff.description || rf.actionRestriction || '';
        const buffDurDisplay = buff.durationText || buff.duration || (buff.rounds ? `${buff.rounds} Rounds` : 'Permanent');

        // Parent-Child Accordion for Multi-part Debuffs / Buffs
        let childrenAccordion = '';
        if (Array.isArray(buff.children) && buff.children.length > 0) {
          childrenAccordion = `
            <details class="mt-2 bg-slate-950/80 border border-rose-500/40 rounded-lg p-2 text-[11px] group">
              <summary class="cursor-pointer font-bold flex items-center justify-between text-rose-300 hover:text-white select-none">
                <span class="flex items-center gap-1.5">
                  <span>🌳</span>
                  <span>${buff.children.length} Sub-Effects (Parent-Child)</span>
                </span>
                <span class="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div class="mt-2 pl-2 border-l-2 border-rose-500/40 space-y-1">
                ${buff.children.filter(c => c && c.name).map(c => {
                  const cMods = [];
                  if (c.attBonus) cMods.push(`${c.attBonus} Atk`);
                  if (c.dmgBonus) cMods.push(`${c.dmgBonus} Dmg`);
                  if (c.hpPenalty) cMods.push(`-${c.hpPenalty} HP`);
                  if (c.fortBonus) cMods.push(`${c.fortBonus} Fort`);
                  if (c.refBonus) cMods.push(`${c.refBonus} Ref`);
                  if (c.willBonus) cMods.push(`${c.willBonus} Will`);
                  if (c.skillBonus) cMods.push(`${c.skillBonus} Skills`);
                  if (c.strBonus) cMods.push(`${c.strBonus} Str`);
                  if (c.dexBonus) cMods.push(`${c.dexBonus} Dex`);
                  if (c.clPenalty) cMods.push(`-${c.clPenalty} CL`);
                  return `
                    <div class="flex items-center justify-between py-0.5 text-[10px] text-slate-300">
                      <span class="font-sans">${UI.escapeHtml(c.name)}</span>
                      <span class="font-mono text-rose-400 font-bold ml-2">${cMods.join(', ')}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </details>
          `;
        }

        const isPinned = Boolean(buff.pinnedToCombat);
        const safeBuffId = UI.escapeAttr(String(buff.id || ''));
        const pinBtnClasses = isPinned
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.45)] hover:bg-emerald-900 hover:border-emerald-400 ring-1 ring-emerald-500/40'
          : 'bg-slate-900/50 text-slate-500 hover:text-slate-200 border-slate-700/60 hover:border-slate-500 opacity-50 hover:opacity-100 hover:bg-slate-800';
        const pinBtnTitle = isPinned
          ? `📌 Combat Cockpit: Pinned to Active Spell & Tactical Buffs (${buff.name}) - Click to unpin`
          : `📌 Pin to Combat Cockpit (${buff.name})`;
        const pinIconSvg = isPinned
          ? `<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707a1 1 0 0 1 .286.602L18 12a1 1 0 0 1-.883.993L17 13h-4v7a1 1 0 0 1-1.993.117L11 20v-7H7a1 1 0 0 1-.993-.883L6 12a1 1 0 0 1 .206-.602L7.914 9.68l.086-.094V5a1 1 0 0 1-.117-1.993L8 3h8z"/></svg>`
          : `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;
        const buffPinBtnHtml = `<button type="button" data-action="inventory:toggle-buff-pin" data-buff-id="${safeBuffId}" class="w-6 h-6 inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer shrink-0 ${pinBtnClasses}" title="${pinBtnTitle}">${pinIconSvg}</button>`;

        if (viewMode === 'list') {
          // --- LISTE GÖRÜNÜMÜ (COMPACT LIST VIEW) ---
          const row = document.createElement('div');
          row.className = `border rounded-xl px-3 py-2 transition flex flex-col gap-1.5 ${isAct ? activeBorder : inactiveBorder}`;

          row.innerHTML = `
            <div class="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
              <!-- Sol: Checkbox + İsim + Kategori Rozeti -->
              <div class="flex items-center gap-2.5 min-w-0">
                <input type="checkbox" ${isAct ? 'checked' : ''} data-change-action="inventory:toggle-buff-active" data-buff-id="${safeBuffId}" class="w-4 h-4 rounded shrink-0 ${isDebuff ? 'text-rose-600 focus:ring-rose-500' : 'text-indigo-600 focus:ring-0'} cursor-pointer">
                <div class="min-w-0 flex items-center gap-1.5 flex-wrap">
                  <span class="font-bold text-xs truncate ${isAct ? (isDebuff ? 'text-rose-200' : 'text-white') : 'text-slate-400'}">${UI.escapeHtml(buff.name)}</span>
                  <span class="text-[10px] px-1.5 rounded font-mono font-bold ${isDebuff ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-purple-300 border border-slate-700'}">${UI.escapeHtml(buff.source || (isDebuff ? 'Debuff' : 'Buff'))}</span>
                </div>
              </div>

              <!-- Orta: Etki Rozetleri -->
              <div class="flex items-center gap-1 flex-wrap shrink-0">
                ${badges.join(' ')}
              </div>

              <!-- Sağ: Süre / Tur Sayaç Butonları + Pin + Sil -->
              <div class="flex items-center gap-2 shrink-0 ml-auto">
                <div class="text-[10px] font-mono text-slate-400 hidden md:inline">
                  ${buffDurDisplay}
                </div>
                <div class="flex items-center gap-1">
                  ${buff.rounds !== null && buff.rounds !== undefined ? `
                    <button type="button" data-action="inventory:adjust-buff-rounds" data-buff-id="${safeBuffId}" data-delta="-1" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold leading-none flex items-center justify-center cursor-pointer" title="Decrease 1 Round">-</button>
                    <span class="font-mono font-bold px-1 text-xs ${buff.rounds <= 3 ? 'text-rose-400 animate-pulse' : 'text-amber-400'} min-w-[36px] text-center">${buff.rounds} Rd</span>
                    <button type="button" data-action="inventory:adjust-buff-rounds" data-buff-id="${safeBuffId}" data-delta="1" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold leading-none flex items-center justify-center cursor-pointer" title="Add 1 Round">+</button>
                  ` : `<span class="text-[10px] text-slate-500 italic px-2">${buffDurDisplay}</span>`}
                </div>
                ${buffPinBtnHtml}
                <button type="button" data-action="inventory:delete-buff" data-buff-id="${safeBuffId}" class="text-slate-500 hover:text-rose-400 p-1 text-xs transition cursor-pointer" title="Delete ${isDebuff ? 'Debuff' : 'Buff'}">🗑️</button>
              </div>
            </div>

            ${(buffDescText || childrenAccordion || suppressionWarning) ? `
              <div class="text-[10px] text-slate-400 pl-6 space-y-1 border-t border-slate-800/40 pt-1">
                ${buffDescText ? `<div class="text-slate-300">${buffDescText}</div>` : ''}
                ${childrenAccordion}
                ${suppressionWarning ? `<div class="text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded px-1.5 py-0.5">${suppressionWarning}</div>` : ''}
              </div>
            ` : ''}
          `;
          container.appendChild(row);
        } else {
          // --- KART GÖRÜNÜMÜ (GRID / CARD VIEW) ---
          const card = document.createElement('div');
          card.className = `border rounded-xl p-3 transition flex flex-col justify-between ${isAct ? activeBorder : inactiveBorder}`;

          card.innerHTML = `
            <div class="space-y-1.5">
              <div class="flex items-center justify-between gap-1.5">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" ${isAct ? 'checked' : ''} data-change-action="inventory:toggle-buff-active" data-buff-id="${safeBuffId}" class="w-4 h-4 rounded ${isDebuff ? 'text-rose-600 focus:ring-rose-500' : 'text-indigo-600 focus:ring-0'}">
                  <span class="font-bold text-xs ${isAct ? (isDebuff ? 'text-rose-200' : 'text-white') : 'text-slate-400'}">${UI.escapeHtml(buff.name)}</span>
                </label>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isDebuff ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-purple-300 border border-slate-700'}">${UI.escapeHtml(buff.source || (isDebuff ? 'Debuff' : 'Buff'))}</span>
                  ${buffPinBtnHtml}
                  <button data-action="inventory:delete-buff" data-buff-id="${safeBuffId}" class="text-slate-500 hover:text-rose-400 p-0.5 text-xs transition" title="Delete ${isDebuff ? 'Debuff' : 'Buff'}">🗑️</button>
                </div>
              </div>

              <div class="flex flex-wrap gap-1 my-1">
                ${badges.join(' ')}
              </div>

              <div class="text-[11px] text-slate-300 font-sans">
                ${buffDescText}
              </div>

              ${childrenAccordion}

              ${suppressionWarning ? `<div class="text-[10px] text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded px-1.5 py-0.5">${suppressionWarning}</div>` : ''}
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2 text-xs">
              <div class="text-[10px] font-mono text-slate-400">
                ${buffDurDisplay}
              </div>
              <div class="flex items-center gap-1">
                ${buff.rounds !== null && buff.rounds !== undefined ? `
                  <button data-action="inventory:adjust-buff-rounds" data-buff-id="${safeBuffId}" data-delta="-1" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold leading-none flex items-center justify-center">-</button>
                  <span class="font-mono font-bold px-1.5 ${buff.rounds <= 3 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}">${buff.rounds} Rd</span>
                  <button data-action="inventory:adjust-buff-rounds" data-buff-id="${safeBuffId}" data-delta="1" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold leading-none flex items-center justify-center">+</button>
                ` : `<span class="text-[10px] text-slate-500 italic">${buffDurDisplay}</span>`}
              </div>
            </div>
          `;
          container.appendChild(card);
        }
      });
    }

    function getBuffGrantedTempHp(buff) {
      if (!buff) return 0;
      if (Number(buff.grantedTempHp) > 0) return Number(buff.grantedTempHp);
      if (Number(buff.ruleFlags?.tempHp) > 0) return Number(buff.ruleFlags.tempHp);
      const mod = (buff.modifiers || []).find(m => m && String(m.target || '').toLowerCase() === 'hp.temp');
      return mod ? (Number(mod.value) || 0) : 0;
    }

    function markPlayerHpChanged() {
      if (!character || !character.hp) return;
      character.hp._lastPlayerChangeTs = Math.max(Date.now(), (Number(character.hp?._lastDmUpdateTs) || 0) + 100);
    }

    function toggleBuffActive(buffId) {
      const buff = (character.buffs || []).find(b => b.id === buffId);
      if (buff) {
        const wasActive = Boolean(buff.active);
        buff.active = !buff.active;
        const tempHp = getBuffGrantedTempHp(buff);
        if (tempHp > 0 && character.hp) {
          if (!wasActive && buff.active) {
            character.hp.temp = (Number(character.hp.temp) || 0) + tempHp;
            buff._tempHpSynced = true;
            markPlayerHpChanged();
          } else if (wasActive && !buff.active) {
            character.hp.temp = Math.max(0, (Number(character.hp.temp) || 0) - tempHp);
            buff._tempHpSynced = false;
            markPlayerHpChanged();
          }
        }
        saveStateToStorage(true);
        renderAll();
      }
    }

    function toggleBuffCombatPin(buffId) {
      if (!character || !Array.isArray(character.buffs)) return;
      const buff = character.buffs.find((b, idx) => b && (b.id === buffId || String(idx) === String(buffId) || b.name === buffId));
      if (!buff) return;
      buff.pinnedToCombat = !buff.pinnedToCombat;
      saveStateToStorage(true);
      renderAll();
      if (typeof showDiceTopToast === 'function') {
        if (buff.pinnedToCombat) {
          showDiceTopToast({
            icon: '📌',
            title: 'Pinned to Combat Cockpit!',
            breakdown: `"${buff.name}" added to Active Spell & Tactical Buffs on the Combat page.`,
            total: 'Pinned'
          });
        } else {
          showDiceTopToast({
            icon: '📌',
            title: 'Unpinned from Combat',
            breakdown: `"${buff.name}" removed from Combat Cockpit pins.`,
            total: 'Unpinned'
          });
        }
      }
    }
    window.toggleBuffCombatPin = toggleBuffCombatPin;

    function adjustBuffRounds(buffId, delta) {
      const buff = (character.buffs || []).find(b => b.id === buffId);
      if (buff && buff.rounds !== null && buff.rounds !== undefined) {
        const wasActive = Boolean(buff.active);
        buff.rounds = Math.max(0, buff.rounds + delta);
        if (buff.rounds === 0) {
          buff.active = false;
          const tempHp = getBuffGrantedTempHp(buff);
          if (wasActive && tempHp > 0 && character.hp) {
            character.hp.temp = Math.max(0, (Number(character.hp.temp) || 0) - tempHp);
            buff._tempHpSynced = false;
            markPlayerHpChanged();
          }
        }
        saveStateToStorage(true);
        renderAll();
      }
    }

    async function deleteBuff(buffId) {
      const buff = (character.buffs || []).find(b => b.id === buffId);
      const isDebuff = buff && (buff.isDebuff || buff.category === 'Debuff');
      const childCount = (buff && buff.children) ? buff.children.length : 0;
      const typeLabel = isDebuff ? 'debuff' : 'buff';
      const confirmMsg = childCount > 0
        ? `Delete "${buff.name}" (including ${childCount} sub-effects)?`
        : `Are you sure you want to delete this ${typeLabel}?`;
      if ((await DnDUI.confirm(confirmMsg, { tone: 'danger' }))) {
        if (buff && buff.active && character.hp) {
          const tempHp = getBuffGrantedTempHp(buff);
          if (tempHp > 0) {
            character.hp.temp = Math.max(0, (Number(character.hp.temp) || 0) - tempHp);
            markPlayerHpChanged();
          }
        }
        character.buffs = (character.buffs || []).filter(b => b.id !== buffId);
        saveStateToStorage(true);
        renderAll();
      }
    }

    function updateRoundDisplays() {
      const round = (character && character.encounterRound) ? character.encounterRound : 1;
      document.querySelectorAll('.round-counter-badge').forEach(el => {
        el.textContent = `Rd ${round}`;
      });
    }

    function advanceNextRound() {
      if (!character) return;
      character.encounterRound = (Number(character.encounterRound) || 1) + 1;
      const expired = [];
      if (Array.isArray(character.buffs)) {
        character.buffs.forEach(buff => {
          if (buff.active && buff.rounds !== null && buff.rounds !== undefined && buff.rounds > 0) {
            buff.rounds--;
            if (buff.rounds <= 0) {
              buff.active = false;
              const tempHp = getBuffGrantedTempHp(buff);
              if (tempHp > 0 && character.hp) {
                character.hp.temp = Math.max(0, (Number(character.hp.temp) || 0) - tempHp);
                buff._tempHpSynced = false;
                markPlayerHpChanged();
              }
              expired.push(buff.name);
            }
          }
        });
      }

      // Process Periodic HP Effects (DoT / HoT - Tur Başı Can Etkileri)
      const hpLogs = [];
      const expiredPeriodic = [];
      if (Array.isArray(character.periodicHpEffects) && character.periodicHpEffects.length > 0) {
        character.periodicHpEffects.forEach(eff => {
          const evalRes = evaluateHpAmount(eff.amount);
          const amt = evalRes.total;
          const rollInfo = evalRes.isDice ? ` [Roll: ${evalRes.rollDesc}]` : '';

          if (amt > 0) {
            if (eff.type === 'damage') {
              character.hp.current = Math.max(-10, (Number(character.hp.current) || 0) - amt);
              hpLogs.push(`💥 ${eff.name}: -${amt} HP Damage${rollInfo}`);
            } else if (eff.type === 'heal') {
              const maxHp = Number(character.hp.max) || 0;
              character.hp.current = Math.min(maxHp, (Number(character.hp.current) || 0) + amt);
              hpLogs.push(`💖 ${eff.name}: +${amt} HP Healed${rollInfo}`);
            }
          }

          if (eff.roundsLeft !== null && eff.roundsLeft !== undefined) {
            eff.roundsLeft--;
            if (eff.roundsLeft <= 0) {
              expiredPeriodic.push(eff.name);
            }
          }
        });

        // Filter out expired periodic effects
        character.periodicHpEffects = character.periodicHpEffects.filter(eff => 
          eff.roundsLeft === null || eff.roundsLeft === undefined || eff.roundsLeft > 0
        );
      }

      if (!character.tactical) character.tactical = {};
      character.tactical.round = character.encounterRound;
      if (typeof resetActionEconomy === 'function') resetActionEconomy();

      updateRoundDisplays();
      saveStateToStorage(true);
      renderAll();

      if (hpLogs.length > 0 || expiredPeriodic.length > 0 || expired.length > 0) {
        const details = [
          ...hpLogs,
          ...expiredPeriodic.map(e => `${e} expired`),
          ...expired.map(e => `${e} expired`),
          'Actions refreshed'
        ].join(' • ');
        showDiceTopToast({
          icon: '⏳',
          title: `Round ${character.encounterRound} Started`,
          breakdown: details,
          total: `${character.hp.current}/${character.hp.max} HP`
        });
      } else {
        showDiceTopToast({
          icon: '⏳',
          title: `Round ${character.encounterRound} Started`,
          breakdown: 'Advanced to next round • All actions refreshed',
          total: `Rd ${character.encounterRound}`
        });
      }
    }

    function performLongRest() {
      if (!character) return;

      const hasRingOfSustenance = !!(
        character.bodySlots && (
          (character.bodySlots.ring1 && (character.bodySlots.ring1.name || "").includes("Ring of Sustenance")) ||
          (character.bodySlots.ring2 && (character.bodySlots.ring2.name || "").includes("Ring of Sustenance"))
        )
      );
      const restHours = hasRingOfSustenance ? 2 : 8;
      const rawHpHeal = Number(character.level) || 6;
      const currentHp = Number(character.hp?.current) || 0;
      const maxHp = Number(character.hp?.max) || 44;
      const missingHp = Math.max(0, maxHp - currentHp);

      showDiceTopToast({
        icon: "☀️",
        title: `Long Rest (${restHours} Hours Sleep${hasRingOfSustenance ? " 💍" : ""})`,
        breakdown: hasRingOfSustenance
          ? "💍 Ring of Sustenance Equipped: Takes only 2 hours! Select healing mode:"
          : "8-hour night's rest. Select healing mode:",
        total: "",
        actions: [
          {
            label: `⚡ Full HP (${maxHp}/${maxHp}) & Slots`,
            className: "px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-700 hover:bg-amber-600 text-amber-100 border border-amber-400 transition shadow cursor-pointer",
            onClick: () => executeLongRest(true)
          },
          {
            label: `📜 D&D 3.5e RAW (+${Math.min(missingHp, rawHpHeal)} HP)`,
            className: "px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-800 hover:bg-sky-700 text-sky-100 border border-sky-400 transition shadow cursor-pointer",
            onClick: () => executeLongRest(false)
          },
          {
            label: "Close",
            className: "px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer",
            onClick: () => {
              const el = document.getElementById("dice-top-toast");
              if (el) el.remove();
            }
          }
        ]
      }, { autoDismiss: true, dismissMs: 30000, stack: false });
    }

    function executeLongRest(isFullHeal = true) {
      if (!character) return;
      if (typeof CharStore !== 'undefined' && typeof CharStore.dispatch === 'function') {
        CharStore.dispatch({
          type: 'hud/longRest',
          payload: { isFullHeal: Boolean(isFullHeal) },
          meta: { label: isFullHeal ? 'Long Rest (Full Recovery)' : 'Long Rest (8h Natural Healing)' }
        });
        const out = (typeof CharStore.getLastOutcome === 'function' ? CharStore.getLastOutcome() : null) || {};
        if (typeof renderActionEconomy === 'function') {
          renderActionEconomy();
        }
        if (typeof renderHUD === 'function') {
          try { renderHUD(); } catch (e) { console.warn('renderHUD immediate rest error:', e); }
        }
        try { updateRoundDisplays(); } catch (e) { console.warn('updateRoundDisplays error in rest:', e); }
        try { saveStateToStorage(true); } catch (e) { console.warn('saveStateToStorage error in rest:', e); }
        try { if (typeof renderManeuvers === 'function') renderManeuvers(); } catch (e) { console.warn('renderManeuvers error in rest:', e); }
        try { if (typeof renderSpellSlots === 'function') renderSpellSlots(); } catch (e) { console.warn('renderSpellSlots error in rest:', e); }
        try { renderAll(); } catch (e) { console.warn('renderAll error in rest:', e); }

        const maxHp = Number(out.maxHp ?? character.hp?.max) || (Number(character.level || 1) * 10) || 10;
        const curHp = Number(out.currentHp ?? character.hp?.current) || maxHp;
        const hpGain = Number(out.hpGain) || 0;
        const refreshedDailyItems = Number(out.refreshedDailyItems) || 0;
        const refreshedDailyFeats = Number(out.refreshedDailyFeats) || 0;
        const removedConditions = Number(out.removedConditions) || 0;
        const hasRingOfSustenance = Boolean(out.hasRingOfSustenance);

        const details = [];
        details.push(isFullHeal ? `Full HP (${curHp}/${maxHp})` : `+${hpGain} HP Natural Healing (${curHp}/${maxHp})`);
        const totalReadyLong = (character.tomeOfBattle?.readiedManeuvers || []).filter(m => !m.expended).length;
        details.push(`All spells and ${totalReadyLong} maneuvers readied`);
        if (refreshedDailyItems > 0 || refreshedDailyFeats > 0) details.push(`${refreshedDailyItems + refreshedDailyFeats} Daily Item/Feat charges refreshed`);
        if (removedConditions > 0) details.push("Fatigue/Debuffs cleared");
        if (hasRingOfSustenance) details.push("💍 2 Hours (Ring of Sustenance)");

        showDiceTopToast({
          icon: "☀️",
          title: `Long Rest Complete (${isFullHeal ? "Full Heal" : "D&D 3.5e RAW"})`,
          breakdown: details.join(" • "),
          total: `${curHp}/${maxHp} HP`
        }, { stack: false, autoDismiss: true, dismissMs: 5000 });
        return;
      }
      character.encounterRound = 1;
      if (!character.tactical) character.tactical = {};
      character.tactical.round = 1;
      if (typeof resetActionEconomy === 'function') resetActionEconomy();

      const hasRingOfSustenance = !!(
        character.bodySlots && (
          (character.bodySlots.ring1 && (character.bodySlots.ring1.name || "").includes("Ring of Sustenance")) ||
          (character.bodySlots.ring2 && (character.bodySlots.ring2.name || "").includes("Ring of Sustenance"))
        )
      );

      // 1. HP & Nonlethal & Temp HP
      const maxHp = Number(character.hp?.max) || (Number(character.level || 1) * 10) || 10;
      if (!character.hp) {
        character.hp = { current: maxHp, max: maxHp, temp: 0, nonlethal: 0 };
      }
      const charLvl = Number(character.level) || 1;
      const currentHp = Number(character.hp.current) || 0;
      let hpGain = 0;

      if (isFullHeal) {
        hpGain = maxHp - currentHp;
        character.hp.current = maxHp;
      } else {
        // D&D 3.5e RAW: 1 HP per character level per 8 hours of rest
        hpGain = Math.min(maxHp - currentHp, charLvl);
        character.hp.current = Math.min(maxHp, currentHp + charLvl);
      }
      character.hp.temp = 0;
      character.hp.nonlethal = 0;
      character.hp._lastPlayerChangeTs = Math.max(Date.now(), (Number(character.hp?._lastDmUpdateTs) || 0) + 100);
      character.lastModified = new Date().toISOString();

      // 1. Immediately update HUD so HP on screen updates in 0ms synchronously
      if (typeof renderHUD === 'function') {
        try { renderHUD(); } catch (e) { console.warn('renderHUD immediate rest error:', e); }
      }

      // 2. Spell Slots (Spontaneous Arcane, Prepared Wizard, Divine)
      let refreshedSpells = 0;
      if (character.spellcasting && Array.isArray(character.spellcasting.slots)) {
        character.spellcasting.slots.forEach(s => {
          if (s.used > 0) refreshedSpells += s.used;
          s.used = 0;
        });
      }
      if (character.spellcasting && Array.isArray(character.spellcasting.preparedSlots)) {
        character.spellcasting.preparedSlots.forEach(s => {
          if (s.used > 0) refreshedSpells += s.used;
          s.used = 0;
        });
      }
      if (character.spellcasting && Array.isArray(character.spellcasting.divineSlots)) {
        character.spellcasting.divineSlots.forEach(s => {
          if (s.used > 0) refreshedSpells += s.used;
          s.used = 0;
          s.domainUsed = 0;
        });
      }
      if (character.spellcasting) {
        character.spellcasting.turnUndeadUsed = 0;
        character.spellcasting.domainPowerUses = {};
      }

      // 3. Tome of Battle Maneuvers: Kusanan & kullanilan manevralarin tekrar kusanilmasi / tazelenmesi
      let refreshedManeuvers = 0;
      let reReadiedCount = 0;
      if (!character.tomeOfBattle) character.tomeOfBattle = {};
      if (!Array.isArray(character.tomeOfBattle.readiedManeuvers)) character.tomeOfBattle.readiedManeuvers = [];
      if (!Array.isArray(character.tomeOfBattle.maneuversKnown)) {
        character.tomeOfBattle.maneuversKnown = character.tomeOfBattle.readiedManeuvers.map(m => ({ ...m }));
      }

      // A. Kusanan ve kullanilmis (expended) tum manevralar tekrar kusanilir / hazir hale getirilir
      character.tomeOfBattle.readiedManeuvers.forEach(m => {
        if (m.expended) {
          m.expended = false;
          refreshedManeuvers++;
        }
      });

      // B. Bos kalan hazir yuvalar varsa, bilinen manevralar havuzundan (maneuversKnown) otomatik tekrar kusanilir
      const initInfo = typeof getInitiatorInfo === 'function' ? getInitiatorInfo() : { maxReadied: 3 };
      const maxReadied = initInfo.maxReadied || 3;
      if (character.tomeOfBattle.readiedManeuvers.length < maxReadied && Array.isArray(character.tomeOfBattle.maneuversKnown)) {
        const readiedNames = character.tomeOfBattle.readiedManeuvers.map(m => (m.name || '').toLowerCase().trim());
        for (const known of character.tomeOfBattle.maneuversKnown) {
          if (character.tomeOfBattle.readiedManeuvers.length >= maxReadied) break;
          const kName = (known.name || '').toLowerCase().trim();
          if (!readiedNames.includes(kName)) {
            character.tomeOfBattle.readiedManeuvers.push({ ...known, expended: false });
            readiedNames.push(kName);
            reReadiedCount++;
          }
        }
      }

      // C. Aktif modifiyerlerde gecici acik kalan manevralar sifirlanir
      if (Array.isArray(character.activeModifiers)) {
        character.activeModifiers.forEach(mod => {
          if (mod.source === 'Maneuver' && mod.active) {
            mod.active = false;
          }
        });
      }

      // 4. Durations, Conditions & Debuffs
      let removedConditions = 0;
      if (Array.isArray(character.buffs)) {
        character.buffs.forEach(b => {
          if (!b.active) return;
          const isFatigued = b.id === "debuff_fatigued" || (b.name || "").toLowerCase().includes("fatigued");
          const isExhausted = b.id === "debuff_exhausted" || (b.name || "").toLowerCase().includes("exhausted");
          const isSickened = b.id === "debuff_sickened" || (b.name || "").toLowerCase().includes("sickened");
          const isShaken = b.id === "debuff_shaken" || (b.name || "").toLowerCase().includes("shaken");
          if (isFatigued || isExhausted || isSickened || isShaken) {
            b.active = false;
            removedConditions++;
            return;
          }

          const dur = (b.durationText || b.duration || "").toLowerCase();
          const isPermanent = dur.includes("permanent") || b.permanent;
          const is24h = dur.includes("24 hour") || dur.includes("24 hr");
          if (!isPermanent && !is24h) {
            b.active = false;
            b._tempHpSynced = false;
            if (b.initialDuration) {
              b.duration = b.initialDuration;
              b.durationText = b.initialDuration;
            }
            if (b.initialRounds !== undefined && b.initialRounds !== null) {
              b.rounds = b.initialRounds;
            }
          }
        });
      }

      // 5. Periodic HP effects reset
      if (Array.isArray(character.periodicHpEffects)) {
        character.periodicHpEffects = [];
      }

      // 6. Reset daily charges on magic items
      let refreshedDailyItems = 0;
      const resetCharges = (item) => {
        if (item && item.dailyCharges && typeof item.dailyCharges.max === "number") {
          item.dailyCharges.current = item.dailyCharges.max;
          refreshedDailyItems++;
        }
      };
      if (character.bodySlots) {
        Object.values(character.bodySlots).forEach(resetCharges);
      }
      if (Array.isArray(character.gearPool)) {
        character.gearPool.forEach(resetCharges);
      }
      if (Array.isArray(character.consumables)) {
        character.consumables.forEach(resetCharges);
      }

      // 7. Reset daily feats / abilities (e.g. Draconic Shield 1/d, Draconic Core 1h/day)
      let refreshedDailyFeats = 0;
      const resetFeatCharges = (f) => {
        if (!f) return;
        if (f.used) { f.used = false; refreshedDailyFeats++; }
        if (f.expended) { f.expended = false; refreshedDailyFeats++; }
        if (f.dailyCharges && typeof f.dailyCharges.max === "number") {
          f.dailyCharges.current = f.dailyCharges.max;
          refreshedDailyFeats++;
        }
      };
      if (Array.isArray(character.feats)) character.feats.forEach(resetFeatCharges);
      if (Array.isArray(character.specialAbilities)) character.specialAbilities.forEach(resetFeatCharges);

      try { updateRoundDisplays(); } catch (e) { console.warn('updateRoundDisplays error in rest:', e); }
      try { saveStateToStorage(true); } catch (e) { console.warn('saveStateToStorage error in rest:', e); }
      try { if (typeof renderManeuvers === "function") renderManeuvers(); } catch (e) { console.warn('renderManeuvers error in rest:', e); }
      try { if (typeof renderSpellSlots === "function") renderSpellSlots(); } catch (e) { console.warn('renderSpellSlots error in rest:', e); }
      try { renderAll(); } catch (e) { console.warn('renderAll error in rest:', e); }

      const details = [];
      details.push(isFullHeal ? `Full HP (${character.hp.current}/${maxHp})` : `+${hpGain} HP Natural Healing (${character.hp.current}/${maxHp})`);
      const totalReadyLong = (character.tomeOfBattle?.readiedManeuvers || []).filter(m => !m.expended).length;
      details.push(`All spells and ${totalReadyLong} maneuvers readied`);
      if (refreshedDailyItems > 0 || refreshedDailyFeats > 0) details.push(`${refreshedDailyItems + refreshedDailyFeats} Daily Item/Feat charges refreshed`);
      if (removedConditions > 0) details.push("Fatigue/Debuffs cleared");
      if (hasRingOfSustenance) details.push("💍 2 Hours (Ring of Sustenance)");

      showDiceTopToast({
        icon: "☀️",
        title: `Long Rest Complete (${isFullHeal ? "Full Heal" : "D&D 3.5e RAW"})`,
        breakdown: details.join(" • "),
        total: `${character.hp.current}/${maxHp} HP`
      }, { stack: false, autoDismiss: true, dismissMs: 5000 });
    }

    function performRest() {
      if (!character) return;

      const nonlethalHeal = Number(character.level) || 6;
      const currentNonlethal = Number(character.hp?.nonlethal) || 0;

      showDiceTopToast({
        icon: "☕",
        title: "Short Rest Options",
        breakdown: "Select rest duration: 5 Min (Maneuvers) or 1 Hour (Maneuvers + Nonlethal HP)",
        total: "",
        actions: [
          {
            label: "⚡ 5 Min (Maneuvers)",
            className: "px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500 transition shadow cursor-pointer",
            onClick: () => executeShortRest(5)
          },
          {
            label: `⏱️ 1 Hour (+${Math.min(currentNonlethal, nonlethalHeal)} Nonlethal & Conditions)`,
            className: "px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-800 hover:bg-teal-700 text-teal-100 border border-teal-500 transition shadow cursor-pointer",
            onClick: () => executeShortRest(60)
          },
          {
            label: "Close",
            className: "px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer",
            onClick: () => {
              const el = document.getElementById("dice-top-toast");
              if (el) el.remove();
            }
          }
        ]
      }, { autoDismiss: true, dismissMs: 30000, stack: false });
    }

    function executeShortRest(minutes = 5) {
      if (!character) return;
      if (typeof CharStore !== 'undefined' && typeof CharStore.dispatch === 'function') {
        CharStore.dispatch({
          type: 'hud/shortRest',
          payload: { minutes: Number(minutes) || 5 },
          meta: { label: `Short Rest (${minutes} min)` }
        });
        const out = (typeof CharStore.getLastOutcome === 'function' ? CharStore.getLastOutcome() : null) || {};
        if (typeof renderActionEconomy === 'function') {
          renderActionEconomy();
        }
        if (typeof renderHUD === 'function') {
          try { renderHUD(); } catch (e) { console.warn('renderHUD immediate short rest error:', e); }
        }
        try { updateRoundDisplays(); } catch (e) { console.warn('updateRoundDisplays error in short rest:', e); }
        try { saveStateToStorage(true); } catch (e) { console.warn('saveStateToStorage error in short rest:', e); }
        try { if (typeof renderManeuvers === 'function') renderManeuvers(); } catch (e) { console.warn('renderManeuvers error in short rest:', e); }
        try { renderAll(); } catch (e) { console.warn('renderAll error in short rest:', e); }

        const refreshedManeuvers = Number(out.refreshedManeuvers) || 0;
        const reReadiedCount = Number(out.reReadiedCount) || 0;
        const nonlethalHealed = Number(out.nonlethalHealed) || 0;
        const downgradedExhausted = Boolean(out.downgradedExhausted);
        const expiredBuffs = Number(out.expiredBuffs) || 0;
        const expiredBuffNames = Array.isArray(out.expiredBuffNames) ? out.expiredBuffNames : [];

        const summaryParts = [];
        const totalReadyShort = (character.tomeOfBattle?.readiedManeuvers || []).filter(m => !m.expended).length;
        if (refreshedManeuvers > 0 || reReadiedCount > 0) {
          summaryParts.push(`${refreshedManeuvers + reReadiedCount} maneuvers recovered / readied`);
        } else {
          summaryParts.push(`${totalReadyShort} maneuvers ready for combat`);
        }
        if (nonlethalHealed > 0) summaryParts.push(`Healed ${nonlethalHealed} Nonlethal HP`);
        if (downgradedExhausted) summaryParts.push("Exhausted downgraded to Fatigued");
        if (expiredBuffs > 0) {
          const namesLabel = expiredBuffNames.length <= 3 ? ` (${expiredBuffNames.join(", ")})` : "";
          summaryParts.push(`${expiredBuffs} buff(s) expired${namesLabel}`);
        }
        summaryParts.push("Encounter round reset");

        showDiceTopToast({
          icon: "☕",
          title: `${minutes >= 60 ? "1-Hour Short Rest" : "5-Min Quick Recovery"} Complete`,
          breakdown: summaryParts.join(" • "),
          total: "Maneuvers Ready"
        }, { stack: false, autoDismiss: true, dismissMs: 4500 });
        return;
      }

      // 1. Tome of Battle Maneuvers: Kusanan & kullanilan manevralarin tekrar kusanilmasi / tazelenmesi
      let refreshedManeuvers = 0;
      let reReadiedCount = 0;
      if (!character.tomeOfBattle) character.tomeOfBattle = {};
      if (!Array.isArray(character.tomeOfBattle.readiedManeuvers)) character.tomeOfBattle.readiedManeuvers = [];
      if (!Array.isArray(character.tomeOfBattle.maneuversKnown)) {
        character.tomeOfBattle.maneuversKnown = character.tomeOfBattle.readiedManeuvers.map(m => ({ ...m }));
      }

      // A. Kusanan ve kullanilmis (expended) tum manevralar tekrar kusanilir / hazir hale getirilir
      character.tomeOfBattle.readiedManeuvers.forEach(m => {
        if (m.expended) {
          m.expended = false;
          refreshedManeuvers++;
        }
      });

      // B. Bos kalan hazir yuvalar varsa, bilinen manevralar havuzundan (maneuversKnown) otomatik tekrar kusanilir
      const initInfo = typeof getInitiatorInfo === 'function' ? getInitiatorInfo() : { maxReadied: 3 };
      const maxReadied = initInfo.maxReadied || 3;
      if (character.tomeOfBattle.readiedManeuvers.length < maxReadied && Array.isArray(character.tomeOfBattle.maneuversKnown)) {
        const readiedNames = character.tomeOfBattle.readiedManeuvers.map(m => (m.name || '').toLowerCase().trim());
        for (const known of character.tomeOfBattle.maneuversKnown) {
          if (character.tomeOfBattle.readiedManeuvers.length >= maxReadied) break;
          const kName = (known.name || '').toLowerCase().trim();
          if (!readiedNames.includes(kName)) {
            character.tomeOfBattle.readiedManeuvers.push({ ...known, expended: false });
            readiedNames.push(kName);
            reReadiedCount++;
          }
        }
      }

      // C. Aktif modifiyerlerde gecici acik kalan manevralar sifirlanir
      if (Array.isArray(character.activeModifiers)) {
        character.activeModifiers.forEach(mod => {
          if (mod.source === 'Maneuver' && mod.active) {
            mod.active = false;
          }
        });
      }

      // 2. Encounter round reset
      character.encounterRound = 1;
      if (character.tactical) character.tactical.round = 1;
      if (typeof resetActionEconomy === 'function') resetActionEconomy();

      // 3. Expire or decrement combat / round-based / minute-based buffs
      let expiredBuffs = 0;
      const expiredBuffNames = [];
      const restRounds = Math.max(1, Number(minutes) || 5) * 10;
      if (Array.isArray(character.buffs)) {
        character.buffs.forEach(b => {
          if (!b || !b.active) return;

          // Skip persistent condition debuffs (handled in section 4 or Long Rest)
          const bIdLower = String(b.id || "").toLowerCase();
          const bNameLower = String(b.name || "").toLowerCase();
          if (
            bIdLower === "debuff_exhausted" || bIdLower === "debuff_fatigued" ||
            bIdLower === "debuff_sickened" || bIdLower === "debuff_shaken" ||
            bNameLower === "exhausted" || bNameLower === "fatigued"
          ) {
            return;
          }

          const durRaw = String(b.durationText || b.duration || "").trim();
          const durLower = durRaw.toLowerCase();
          const isPermanent = Boolean(b.permanent) || durLower.includes("permanent") || durLower.includes("condition");
          const is24h = durLower.includes("24 hour") || durLower.includes("24 hr");
          if (isPermanent || is24h) return;

          if (!b.initialDuration && durRaw) b.initialDuration = durRaw;
          if ((b.initialRounds === undefined || b.initialRounds === null) && b.rounds !== null && b.rounds !== undefined) {
            b.initialRounds = Number(b.rounds);
          }

          const bCl = Math.max(1, Number(b.casterLevel || b.cl || character.level) || 1);
          let shouldExpire = false;

          // A. Explicit round counter (`b.rounds`)
          if (b.rounds !== null && b.rounds !== undefined && Number(b.rounds) > 0) {
            const remRds = Number(b.rounds) - restRounds;
            if (remRds <= 0) {
              shouldExpire = true;
            } else {
              b.rounds = remRds;
              if (/\b(?:min|mins|minute|minutes)\b/i.test(durLower)) {
                const remMins = Math.max(1, Math.ceil(remRds / 10));
                b.duration = `${remMins} min`;
                b.durationText = `${remMins} min`;
              }
            }
          } else {
            // B. Parse duration string (`duration` / `durationText`)
            let parsedMins = null;
            let parsedRounds = null;

            if (/\b1\s*round\/level/i.test(durLower)) {
              parsedRounds = bCl;
            } else {
              const rdMatch = durLower.match(/(\d+)\s*(?:rd|rds|round|rounds)\b/i);
              if (rdMatch) parsedRounds = parseInt(rdMatch[1], 10);
            }

            if (parsedRounds !== null) {
              if (parsedRounds <= restRounds) {
                shouldExpire = true;
              } else {
                const remRds = parsedRounds - restRounds;
                b.rounds = remRds;
                b.duration = `${remRds} rounds`;
                b.durationText = `${remRds} rounds`;
              }
            } else {
              if (/10\s*min\.?\/level/i.test(durLower)) {
                parsedMins = bCl * 10;
              } else if (/\b1\s*min\.?\/level/i.test(durLower)) {
                parsedMins = bCl;
              } else if (/\b1\s*(?:hr|hour)\.?\/level/i.test(durLower)) {
                parsedMins = bCl * 60;
              } else {
                const minMatch = durLower.match(/(\d+)\s*(?:min|mins|minute|minutes)\b/i);
                if (minMatch) {
                  parsedMins = parseInt(minMatch[1], 10);
                } else {
                  const hrMatch = durLower.match(/(\d+)\s*(?:hr|hrs|hour|hours)\b/i);
                  if (hrMatch) parsedMins = parseInt(hrMatch[1], 10) * 60;
                }
              }

              if (parsedMins !== null && parsedMins > 0) {
                if (parsedMins <= minutes) {
                  shouldExpire = true;
                } else {
                  const remMins = parsedMins - minutes;
                  if (remMins >= 60 && remMins % 60 === 0 && /\b(?:hr|hrs|hour|hours)\b/i.test(durLower)) {
                    const remHrs = remMins / 60;
                    b.duration = `${remHrs} hr`;
                    b.durationText = `${remHrs} hr`;
                  } else {
                    b.duration = `${remMins} min`;
                    b.durationText = `${remMins} min`;
                    if (remMins <= 15) b.rounds = remMins * 10;
                  }
                }
              }
            }
          }

          if (shouldExpire) {
            b.active = false;
            expiredBuffs++;
            if (b.name) expiredBuffNames.push(b.name);
            if (b.initialDuration) {
              b.duration = b.initialDuration;
              b.durationText = b.initialDuration;
            }
            if (b.initialRounds !== undefined && b.initialRounds !== null) {
              b.rounds = b.initialRounds;
            }
            const tempHp = typeof getBuffGrantedTempHp === 'function' ? getBuffGrantedTempHp(b) : (Number(b.grantedTempHp) || 0);
            if (tempHp > 0 && character.hp) {
              character.hp.temp = Math.max(0, (Number(character.hp.temp) || 0) - tempHp);
              b._tempHpSynced = false;
              if (typeof markPlayerHpChanged === 'function') markPlayerHpChanged();
            }
          }
        });
      }

      // 4. Nonlethal and Condition healing for 1 Hour rest (60 min)
      let nonlethalHealed = 0;
      let downgradedExhausted = false;
      if (minutes >= 60) {
        if (!character.hp) {
          const maxH = (Number(character.level || 1) * 10) || 10;
          character.hp = { current: maxH, max: maxH, temp: 0, nonlethal: 0 };
        }
        const charLvl = Number(character.level) || 1;
        const currentNonlethal = Number(character.hp.nonlethal) || 0;
        if (currentNonlethal > 0) {
          nonlethalHealed = Math.min(currentNonlethal, charLvl);
          character.hp.nonlethal = currentNonlethal - nonlethalHealed;
          character.hp._lastPlayerChangeTs = Math.max(Date.now(), (Number(character.hp?._lastDmUpdateTs) || 0) + 100);
          character.lastModified = new Date().toISOString();
        }

        // Exhausted -> Fatigued
        if (Array.isArray(character.buffs)) {
          const exhaustedBuff = character.buffs.find(b => b.active && (b.id === "debuff_exhausted" || (b.name || "").toLowerCase().includes("exhausted")));
          if (exhaustedBuff) {
            exhaustedBuff.active = false;
            downgradedExhausted = true;
            const fatiguedBuff = character.buffs.find(b => b.id === "debuff_fatigued" || (b.name || "").toLowerCase().includes("fatigued"));
            if (fatiguedBuff) fatiguedBuff.active = true;
          }
        }
      }

      if (typeof RuleEngine !== 'undefined' && typeof RuleEngine.recalculateCharacter === 'function') {
        try {
          RuleEngine.recalculateCharacter(character, (typeof masterDb !== 'undefined' ? masterDb : []), {
            combatExpertise: character.tactical?.combatExpertise || 0,
            fightingDefensively: character.tactical?.fightingDefensively || false,
            totalDefense: character.tactical?.totalDefense || false,
            charge: character.tactical?.charge || false
          });
        } catch (e) { console.warn('RuleEngine.recalculateCharacter error in short rest:', e); }
      }

      if (typeof renderHUD === 'function') {
        try { renderHUD(); } catch (e) { console.warn('renderHUD immediate short rest error:', e); }
      }

      character.lastModified = new Date().toISOString();
      try { updateRoundDisplays(); } catch (e) { console.warn('updateRoundDisplays error in short rest:', e); }
      try { saveStateToStorage(true); } catch (e) { console.warn('saveStateToStorage error in short rest:', e); }
      try { if (typeof renderManeuvers === 'function') renderManeuvers(); } catch (e) { console.warn('renderManeuvers error in short rest:', e); }
      try { renderAll(); } catch (e) { console.warn('renderAll error in short rest:', e); }

      const summaryParts = [];
      const totalReadyShort = (character.tomeOfBattle?.readiedManeuvers || []).filter(m => !m.expended).length;
      if (refreshedManeuvers > 0 || reReadiedCount > 0) {
        summaryParts.push(`${refreshedManeuvers + reReadiedCount} maneuvers recovered / readied`);
      } else {
        summaryParts.push(`${totalReadyShort} maneuvers ready for combat`);
      }
      if (nonlethalHealed > 0) summaryParts.push(`Healed ${nonlethalHealed} Nonlethal HP`);
      if (downgradedExhausted) summaryParts.push("Exhausted downgraded to Fatigued");
      if (expiredBuffs > 0) {
        const namesLabel = expiredBuffNames.length <= 3 ? ` (${expiredBuffNames.join(", ")})` : "";
        summaryParts.push(`${expiredBuffs} buff(s) expired${namesLabel}`);
      }
      summaryParts.push("Encounter round reset");

      showDiceTopToast({
        icon: "☕",
        title: `${minutes >= 60 ? "1-Hour Short Rest" : "5-Min Quick Recovery"} Complete`,
        breakdown: summaryParts.join(" • "),
        total: "Maneuvers Ready"
      }, { stack: false, autoDismiss: true, dismissMs: 4500 });
    }

    // Global window mappings
    window.performRest = performRest;
    window.rest = performRest;
    window.performLongRest = performLongRest;
    window.longRest = performLongRest;
    window.executeShortRest = executeShortRest;
    window.executeLongRest = executeLongRest;

    let currentBuffModalMode = 'buff'; // 'buff' | 'debuff'
    let currentBuffModalTab = 'spotlight'; // 'spotlight' | 'manual'
    let currentBuffModalChildren = [];
    let _selectedSpotlightV2Entry = null;
    let _selectedSpotlightEnergy = 'Fire';
    let _buffSpotlightResults = [];
    let _buffSpotlightActiveIdx = 0;
    let _buffModalV2Modifiers = [];
    let _buffModalV2RuleFlags = {};
    let _buffManualEdited = false;

    // Close Spotlight dropdown when clicking outside the Spotlight box
    if (typeof document !== 'undefined' && !window._buffSpotlightOutsideClickBound) {
      window._buffSpotlightOutsideClickBound = true;
      document.addEventListener('mousedown', (ev) => {
        const box = document.getElementById('buff-rule-master-box');
        const dd = document.getElementById('buff-spotlight-dropdown');
        if (dd && !dd.classList.contains('hidden') && box && !box.contains(ev.target)) {
          dd.classList.add('hidden');
        }
      });
    }

    // 3 Compact Quick-Pick Examples per mode
    const BUFF_QUICK_PICKS = [
      { label: '⚡ Haste', query: 'Haste' },
      { label: '✨ Shield of Faith', query: 'Shield of Faith' },
      { label: '🐂 Bull\'s Strength', query: "Bull's Strength" }
    ];

    const DEBUFF_QUICK_PICKS = [
      { label: '🤢 Sickened', query: 'Sickened' },
      { label: '😱 Shaken', query: 'Shaken' },
      { label: '😫 Fatigued', query: 'Fatigued' }
    ];

    const BUFF_V2_TARGET_GROUPS = [
      {
        group: 'Abilities',
        options: [
          { value: 'ability.str', label: 'STR (Strength)' },
          { value: 'ability.dex', label: 'DEX (Dexterity)' },
          { value: 'ability.con', label: 'CON (Constitution)' },
          { value: 'ability.int', label: 'INT (Intelligence)' },
          { value: 'ability.wis', label: 'WIS (Wisdom)' },
          { value: 'ability.cha', label: 'CHA (Charisma)' }
        ]
      },
      {
        group: 'Armor Class (AC)',
        options: [
          { value: 'ac.total', label: 'AC (Total)' },
          { value: 'ac.armor', label: 'Armor AC' },
          { value: 'ac.shield', label: 'Shield AC' },
          { value: 'ac.natural', label: 'Natural Armor AC' },
          { value: 'ac.deflection', label: 'Deflection AC' },
          { value: 'ac.dodge', label: 'Dodge AC' },
          { value: 'ac.touch', label: 'Touch AC' },
          { value: 'ac.flatFooted', label: 'Flat-Footed AC' }
        ]
      },
      {
        group: 'Attack & Damage',
        options: [
          { value: 'attack.all', label: 'All Attacks' },
          { value: 'attack.melee', label: 'Melee Attack' },
          { value: 'attack.ranged', label: 'Ranged Attack' },
          { value: 'damage.weapon', label: 'All Weapon Damage' },
          { value: 'damage.melee', label: 'Melee Damage' },
          { value: 'damage.ranged', label: 'Ranged Damage' }
        ]
      },
      {
        group: 'Saving Throws',
        options: [
          { value: 'save.all', label: 'All Saving Throws' },
          { value: 'save.fort', label: 'Fortitude Save' },
          { value: 'save.ref', label: 'Reflex Save' },
          { value: 'save.will', label: 'Will Save' }
        ]
      },
      {
        group: 'Movement, Init & Caster',
        options: [
          { value: 'initiative', label: 'Initiative' },
          { value: 'speed.land', label: 'Land Speed (ft)' },
          { value: 'speed.fly', label: 'Fly Speed (ft)' },
          { value: 'casterLevel', label: 'Caster Level (CL)' },
          { value: 'hp.temp', label: 'Temporary HP' }
        ]
      },
      {
        group: 'Skills',
        options: [
          { value: 'skill.all', label: 'All Skills' },
          { value: 'skill.concentration', label: 'Skill: Concentration' },
          { value: 'skill.spot', label: 'Skill: Spot' },
          { value: 'skill.listen', label: 'Skill: Listen' },
          { value: 'skill.hide', label: 'Skill: Hide' },
          { value: 'skill.move_silently', label: 'Skill: Move Silently' },
          { value: 'skill.tumble', label: 'Skill: Tumble' },
          { value: 'skill.search', label: 'Skill: Search' },
          { value: 'skill.spellcraft', label: 'Skill: Spellcraft' },
          { value: 'skill.umd', label: 'Skill: Use Magic Device' },
          { value: 'skill.intimidate', label: 'Skill: Intimidate' },
          { value: 'skill.diplomacy', label: 'Skill: Diplomacy' },
          { value: 'skill.bluff', label: 'Skill: Bluff' },
          { value: 'skill.balance', label: 'Skill: Balance' },
          { value: 'skill.jump', label: 'Skill: Jump' },
          { value: 'skill.climb', label: 'Skill: Climb' },
          { value: 'skill.swim', label: 'Skill: Swim' }
        ]
      }
    ];

    const BUFF_V2_BONUS_TYPES = [
      { value: 'enhancement', label: 'Enhancement' },
      { value: 'morale', label: 'Morale' },
      { value: 'luck', label: 'Luck' },
      { value: 'sacred', label: 'Sacred' },
      { value: 'profane', label: 'Profane' },
      { value: 'competence', label: 'Competence' },
      { value: 'insight', label: 'Insight' },
      { value: 'resistance', label: 'Resistance' },
      { value: 'armor', label: 'Armor' },
      { value: 'shield', label: 'Shield' },
      { value: 'deflection', label: 'Deflection' },
      { value: 'natural_enhancement', label: 'Natural Armor' },
      { value: 'dodge', label: 'Dodge (Stacks)' },
      { value: 'size', label: 'Size' },
      { value: 'racial', label: 'Racial' },
      { value: 'circumstance', label: 'Circumstance' },
      { value: 'alchemical', label: 'Alchemical' },
      { value: 'penalty', label: 'Penalty' },
      { value: 'untyped', label: 'Untyped (Stacks)' }
    ];

    const BUFF_V2_BOOLEAN_FLAGS = [
      { key: 'extraAttackFullAttack', label: '⚡ Extra Attack (Haste)', mode: 'buff' },
      { key: 'babEqualsLevel', label: '⚔️ BAB = Character Level', mode: 'buff' },
      { key: 'keen', label: '🗡️ Keen (2x Crit Range)', mode: 'buff' },
      { key: 'freedomOfMovement', label: '🕊️ Freedom of Movement', mode: 'buff' },
      { key: 'immuneDeathEffects', label: '💀 Immune: Death / Neg. Energy', mode: 'buff' },
      { key: 'immuneMindAffecting', label: '🧠 Immune: Mind-Affecting', mode: 'buff' },
      { key: 'immuneFear', label: '😱 Immune: Fear', mode: 'buff' },
      { key: 'immuneMagicMissile', label: '🛡️ Immune: Magic Missile', mode: 'buff' },
      { key: 'loseDexToAC', label: '⚠️ Lose DEX to AC', mode: 'debuff' },
      { key: 'effectiveDexZero', label: '🥶 Effective DEX 0 (Helpless)', mode: 'debuff' },
      { key: 'halfSpeed', label: '🥾 Half Speed', mode: 'debuff' }
    ];

    function switchBuffModalTab(tabName) {
      currentBuffModalTab = tabName === 'manual' ? 'manual' : 'spotlight';
      const isManual = currentBuffModalTab === 'manual';
      const isDebuff = currentBuffModalMode === 'debuff';
      const paneSpot = document.getElementById('buff-modal-pane-spotlight');
      const paneManual = document.getElementById('buff-modal-pane-manual');
      const btnSpot = document.getElementById('buff-tab-btn-spotlight');
      const btnManual = document.getElementById('buff-tab-btn-manual');

      if (paneSpot) paneSpot.classList.toggle('hidden', isManual);
      if (paneManual) paneManual.classList.toggle('hidden', !isManual);

      if (btnSpot) {
        btnSpot.className = isDebuff
          ? 'text-[10px] bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-rose-200 px-2.5 py-1 rounded border border-rose-500/40 hover:border-rose-400 font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-sm'
          : 'text-[10px] bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 px-2.5 py-1 rounded border border-indigo-500/40 hover:border-indigo-400 font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-sm';
      }
      if (btnManual) {
        btnManual.className = isDebuff
          ? 'text-[10px] bg-slate-900/90 hover:bg-slate-800 text-rose-200 hover:text-white px-2 py-0.5 rounded border border-rose-500/50 hover:border-rose-400 font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-sm'
          : 'text-[10px] bg-slate-900/90 hover:bg-slate-800 text-indigo-200 hover:text-white px-2 py-0.5 rounded border border-indigo-500/50 hover:border-indigo-400 font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-sm';
      }

      if (isManual) {
        hideBuffSpotlightDropdown();
        renderBuffModalV2ModifierRows();
        renderBuffModalV2RuleFlags();
      }
    }
    window.switchBuffModalTab = switchBuffModalTab;

    function syncBuffSpotlightDurationInputs(origin, val) {
      const spotRds = document.getElementById('buff-spot-rounds');
      const spotDur = document.getElementById('buff-spot-duration');
      const manRds = document.getElementById('buff-input-rounds');
      const manDur = document.getElementById('buff-input-duration');
      if (origin === 'rounds' && manRds) manRds.value = val;
      if (origin === 'duration' && manDur) manDur.value = val;
      if (origin === 'manual_rounds' && spotRds) spotRds.value = val;
      if (origin === 'manual_duration' && spotDur) spotDur.value = val;
    }
    window.syncBuffSpotlightDurationInputs = syncBuffSpotlightDurationInputs;

    function renderBuffModalV2ModifierRows() {
      const listEl = document.getElementById('buff-v2-modifiers-list');
      if (!listEl) return;

      if (!Array.isArray(_buffModalV2Modifiers) || _buffModalV2Modifiers.length === 0) {
        listEl.innerHTML = `
          <div class="text-[11px] text-slate-500 italic text-center py-2.5 bg-slate-900/50 rounded-lg border border-dashed border-slate-800">
            No V2 stat modifiers yet. Click <b>+ Add Modifier</b> or a preset chip above to add one.
          </div>
        `;
        return;
      }

      const buildTargetOptions = (selectedTarget) => {
        const normSel = String(selectedTarget || 'ability.str').trim();
        return BUFF_V2_TARGET_GROUPS.map(grp => `
          <optgroup label="${grp.group}">
            ${grp.options.map(opt => `<option value="${opt.value}" ${opt.value === normSel ? 'selected' : ''}>${UI.escapeHtml(opt.label)}</option>`).join('')}
          </optgroup>
        `).join('');
      };

      const buildTypeOptions = (selectedType) => {
        const normType = String(selectedType || (currentBuffModalMode === 'debuff' ? 'penalty' : 'enhancement')).toLowerCase().trim();
        return BUFF_V2_BONUS_TYPES.map(t => `<option value="${t.value}" ${t.value === normType ? 'selected' : ''}>${UI.escapeHtml(t.label)}</option>`).join('');
      };

      listEl.innerHTML = _buffModalV2Modifiers.map((mod, idx) => {
        const formulaStr = mod.formula !== undefined && mod.formula !== null && mod.formula !== ''
          ? String(mod.formula)
          : String(mod.value !== undefined && mod.value !== null ? mod.value : '2');
        const condStr = String(mod.condition || '').replace(/"/g, '&quot;');
        return `
          <div class="grid grid-cols-12 gap-1.5 items-center bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
            <div class="col-span-4">
              <select data-change-action="inventory:buff-v2-mod-change" data-mod-idx="${idx}" data-field="target" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-white font-medium focus:border-indigo-500 focus:outline-none">
                ${buildTargetOptions(mod.target)}
              </select>
            </div>
            <div class="col-span-2">
              <input type="text" value="${formulaStr.replace(/"/g, '&quot;')}" placeholder="+2 or @cl" data-input-action="inventory:buff-v2-mod-input" data-mod-idx="${idx}" data-field="formula" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[11px] font-mono font-bold text-amber-300 text-center focus:border-amber-400 focus:outline-none" title="Number (e.g. 4, -2) or V2 formula (e.g. 2 + min(3, floor(@cl / 6)))">
            </div>
            <div class="col-span-3">
              <select data-change-action="inventory:buff-v2-mod-change" data-mod-idx="${idx}" data-field="type" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-indigo-200 focus:border-indigo-500 focus:outline-none">
                ${buildTypeOptions(mod.type)}
              </select>
            </div>
            <div class="col-span-2">
              <input type="text" value="${condStr}" placeholder="Condition" data-input-action="inventory:buff-v2-mod-input" data-mod-idx="${idx}" data-field="condition" class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-300 focus:border-indigo-500 focus:outline-none" title="Optional condition (e.g., vs Evil, vs Fear)">
            </div>
            <div class="col-span-1 text-right">
              <button type="button" data-action="inventory:remove-buff-v2-mod" data-mod-idx="${idx}" class="w-6 h-6 rounded bg-rose-950/70 hover:bg-rose-800 text-rose-300 text-xs font-bold transition cursor-pointer" title="Remove Modifier">&times;</button>
            </div>
          </div>
        `;
      }).join('');
    }

    function addBuffModalV2ModifierRow(preset = null) {
      _buffManualEdited = true;
      const isDebuff = currentBuffModalMode === 'debuff';
      const defaultRow = {
        target: preset?.target || (isDebuff ? 'attack.all' : 'ability.str'),
        value: preset?.value !== undefined ? Number(preset.value) : (isDebuff ? -2 : 2),
        formula: preset?.formula !== undefined ? String(preset.formula) : (isDebuff ? '-2' : '2'),
        type: preset?.type || (isDebuff ? 'penalty' : 'enhancement'),
        condition: preset?.condition || null
      };
      _buffModalV2Modifiers.push(defaultRow);
      renderBuffModalV2ModifierRows();
    }
    window.addBuffModalV2ModifierRow = addBuffModalV2ModifierRow;

    function removeBuffModalV2ModifierRow(idx) {
      _buffManualEdited = true;
      _buffModalV2Modifiers.splice(idx, 1);
      renderBuffModalV2ModifierRows();
    }
    window.removeBuffModalV2ModifierRow = removeBuffModalV2ModifierRow;

    function onBuffModalV2ModifierChange(idx, field, val) {
      const row = _buffModalV2Modifiers[idx];
      if (!row) return;
      _buffManualEdited = true;
      if (field === 'formula') {
        row.formula = String(val).trim();
        const num = Number(row.formula);
        row.value = !Number.isNaN(num) ? num : 0;
        if (num < 0 && (!row.type || row.type === 'enhancement')) {
          row.type = 'penalty';
          renderBuffModalV2ModifierRows();
        }
      } else if (field === 'condition') {
        row.condition = String(val).trim() || null;
      } else {
        row[field] = val;
      }
    }
    window.onBuffModalV2ModifierChange = onBuffModalV2ModifierChange;

    function renderBuffModalV2RuleFlags() {
      const grid = document.getElementById('buff-v2-ruleflags-grid');
      if (!grid) return;

      grid.innerHTML = BUFF_V2_BOOLEAN_FLAGS.map(f => {
        const active = Boolean(_buffModalV2RuleFlags && _buffModalV2RuleFlags[f.key]);
        const activeCls = f.mode === 'debuff'
          ? 'bg-rose-600 text-white border-rose-400 shadow'
          : 'bg-indigo-600 text-white border-indigo-400 shadow';
        const idleCls = 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600';
        return `
          <button type="button" data-action="inventory:toggle-buff-rule-flag" data-flag-key="${f.key}" class="px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${active ? activeCls : idleCls}">
            ${UI.escapeHtml(f.label)}
          </button>
        `;
      }).join('');
    }

    function toggleBuffModalRuleFlag(flagKey) {
      _buffManualEdited = true;
      if (!_buffModalV2RuleFlags || typeof _buffModalV2RuleFlags !== 'object') {
        _buffModalV2RuleFlags = {};
      }
      if (_buffModalV2RuleFlags[flagKey]) {
        delete _buffModalV2RuleFlags[flagKey];
      } else {
        _buffModalV2RuleFlags[flagKey] = true;
      }
      renderBuffModalV2RuleFlags();
    }
    window.toggleBuffModalRuleFlag = toggleBuffModalRuleFlag;

    function renderBuffQuickPickChips() {
      const container = document.getElementById('buff-quick-picks-container');
      if (!container) return;
      const isDebuff = currentBuffModalMode === 'debuff';
      const list = isDebuff ? DEBUFF_QUICK_PICKS : BUFF_QUICK_PICKS;
      const chipCls = isDebuff
        ? 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-950/70 hover:bg-rose-800/80 text-rose-200 border border-rose-700/60 transition cursor-pointer'
        : 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-950/70 hover:bg-indigo-800/80 text-indigo-200 border border-indigo-700/60 transition cursor-pointer';

      container.innerHTML = list.map((item, idx) => `
        <button type="button" data-action="inventory:buff-quick-pick" data-pick-idx="${idx}" class="${chipCls}">
          ${UI.escapeHtml(item.label)}
        </button>
      `).join('');
    }

    async function onBuffQuickPickClick(idx) {
      const isDebuff = currentBuffModalMode === 'debuff';
      const list = isDebuff ? DEBUFF_QUICK_PICKS : BUFF_QUICK_PICKS;
      const picked = list[idx];
      if (!picked) return;

      hideBuffSpotlightDropdown();
      const candidates = await searchBuffSpotlightCandidates(picked.query, isDebuff);
      const exact = candidates.find(c => (c.name || '').toLowerCase() === picked.query.toLowerCase()) || candidates[0];
      if (exact) {
        selectBuffSpotlightCandidate(exact);
      }
    }
    window.onBuffQuickPickClick = onBuffQuickPickClick;

    function getBuffModalCasterLevel() {
      const activeClEl = currentBuffModalTab === 'manual'
        ? (document.getElementById('buff-manual-cl') || document.getElementById('buff-input-cl'))
        : (document.getElementById('buff-input-cl') || document.getElementById('buff-manual-cl'));
      const val = activeClEl ? parseInt(activeClEl.value, 10) : 0;
      if (val && val > 0) return val;
      return Math.max(1, Number(character?.level) || 6);
    }

    function onBuffCasterLevelChange(newVal) {
      const cl1 = document.getElementById('buff-input-cl');
      const cl2 = document.getElementById('buff-manual-cl');
      if (newVal !== undefined) {
        if (cl1 && String(cl1.value) !== String(newVal)) cl1.value = newVal;
        if (cl2 && String(cl2.value) !== String(newVal)) cl2.value = newVal;
      }
      if (_selectedSpotlightV2Entry) {
        selectBuffSpotlightCandidate(_selectedSpotlightV2Entry, { keepEnergy: true });
      }
    }
    window.onBuffCasterLevelChange = onBuffCasterLevelChange;

    async function searchBuffSpotlightCandidates(rawQuery, isDebuffMode = false) {
      const q = String(rawQuery || '').trim().toLowerCase();
      if (window.SrdCompendium && typeof window.SrdCompendium.init === 'function') {
        try {
          await window.SrdCompendium.init();
          // Conditions, buffs and spells from every chunk that holds them (index-driven; matches the list below).
          await window.SrdCompendium.ensureTypesLoaded(['Condition', 'Buff', 'Spell']);
        } catch (e) { reportError('char_inventory:searchBuffSpotlightCandidates', e); }
      }

      const cl = getBuffModalCasterLevel();
      const results = [];
      const seenKeys = new Set();

      const addCandidate = (entry, kindLabel, scoreBoost = 0) => {
        if (!entry || !entry.name) return;
        const nLower = String(entry.name).toLowerCase().trim();
        const key = `${String(entry.type || kindLabel).toLowerCase()}:${nLower}`;
        if (seenKeys.has(key)) return;

        let score = scoreBoost;
        if (q) {
          const hay = `${nLower} ${String(entry.category || '').toLowerCase()} ${String(entry.shortDescription || entry.benefit || entry.description || '').toLowerCase()}`;
          if (nLower === q) score += 1000;
          else if (nLower.startsWith(q)) score += 650 - Math.min(80, nLower.length);
          else if (nLower.includes(q)) score += 400 - Math.min(80, nLower.indexOf(q));
          else if (hay.includes(q)) score += 150;
          else return;
        } else {
          score += 100;
        }

        seenKeys.add(key);
        results.push({ entry, kindLabel, score });
      };

      const isPurelyNegativeMods = (mods, rf = {}) => {
        if (rf && (rf.loseDexToAC || rf.effectiveDexZero || rf.halfSpeed || rf.actionRestriction || rf.negativeLevels)) {
          return true;
        }
        if (!Array.isArray(mods) || mods.length === 0) return false;
        const hasNeg = mods.some(m => Number(m?.value) < 0 || String(m?.formula || '').trim().startsWith('-'));
        const hasPos = mods.some(m => Number(m?.value) > 0 || (m?.formula && !String(m.formula).trim().startsWith('-') && Number(m.formula) > 0));
        return hasNeg && !hasPos;
      };

      // Canonical V2 Debuff Spells (for Debuff / Condition mode only)
      const CANONICAL_DEBUFF_SPELLS = [
        { id: 'debuff-spell-bane', schemaVersion: 2, name: 'Bane', type: 'Debuff', category: 'Enchantment', school: 'Enchantment', duration: '1 min/level', shortDescription: '-1 penalty on attack rolls and -1 penalty on saving throws against fear.', modifiers: [{ target: 'attack.all', value: -1, formula: '-1', type: 'penalty', condition: null }, { target: 'save.will', value: -1, formula: '-1', type: 'penalty', condition: 'vs fear' }], ruleFlags: {} },
        { id: 'debuff-spell-doom', schemaVersion: 2, name: 'Doom', type: 'Debuff', category: 'Necromancy', school: 'Necromancy', duration: '1 min/level', shortDescription: 'Subject becomes Shaken (-2 on attack rolls, saving throws, skill checks, and ability checks).', modifiers: [{ target: 'attack.all', value: -2, formula: '-2', type: 'penalty', condition: null }, { target: 'save.all', value: -2, formula: '-2', type: 'penalty', condition: null }, { target: 'skill.all', value: -2, formula: '-2', type: 'penalty', condition: null }], ruleFlags: {} },
        { id: 'debuff-spell-crushing-despair', schemaVersion: 2, name: 'Crushing Despair', type: 'Debuff', category: 'Enchantment', school: 'Enchantment', duration: '1 min/level', shortDescription: '-2 penalty on attack rolls, saving throws, ability checks, skill checks, and weapon damage rolls.', modifiers: [{ target: 'attack.all', value: -2, formula: '-2', type: 'penalty', condition: null }, { target: 'damage.weapon', value: -2, formula: '-2', type: 'penalty', condition: null }, { target: 'save.all', value: -2, formula: '-2', type: 'penalty', condition: null }, { target: 'skill.all', value: -2, formula: '-2', type: 'penalty', condition: null }], ruleFlags: {} },
        { id: 'debuff-spell-slow', schemaVersion: 2, name: 'Slow', type: 'Debuff', category: 'Transmutation', school: 'Transmutation', duration: '1 round/level', shortDescription: 'Single move or standard action only; -1 on attack rolls, AC, and Reflex saves; half speed.', modifiers: [{ target: 'attack.all', value: -1, formula: '-1', type: 'penalty', condition: null }, { target: 'ac.total', value: -1, formula: '-1', type: 'penalty', condition: null }, { target: 'save.ref', value: -1, formula: '-1', type: 'penalty', condition: null }], ruleFlags: { halfSpeed: true, actionRestriction: 'Slowed: Can take only a single move action or standard action each turn.' } },
        { id: 'debuff-spell-bestow-curse', schemaVersion: 2, name: 'Bestow Curse (-4 Penalty)', type: 'Debuff', category: 'Necromancy', school: 'Necromancy', duration: 'Permanent', shortDescription: '-4 penalty on attack rolls, saves, ability checks, and skill checks.', modifiers: [{ target: 'attack.all', value: -4, formula: '-4', type: 'penalty', condition: null }, { target: 'save.all', value: -4, formula: '-4', type: 'penalty', condition: null }, { target: 'skill.all', value: -4, formula: '-4', type: 'penalty', condition: null }], ruleFlags: {} },
        { id: 'debuff-spell-ray-of-enfeeblement', schemaVersion: 2, name: 'Ray of Enfeeblement', type: 'Debuff', category: 'Necromancy', school: 'Necromancy', duration: '1 min/level', shortDescription: '1d6 + 1 per two caster levels (max 1d6+5) penalty to Strength (cannot drop STR below 1).', modifiers: [{ target: 'ability.str', value: -6, formula: '-6', type: 'penalty', condition: null }], ruleFlags: {} },
        { id: 'debuff-spell-touch-of-idiocy', schemaVersion: 2, name: 'Touch of Idiocy', type: 'Debuff', category: 'Enchantment', school: 'Enchantment', duration: '10 min/level', shortDescription: '1d6 penalty to INT, WIS, and CHA (cannot drop below 1).', modifiers: [{ target: 'ability.int', value: -3, formula: '-3', type: 'penalty', condition: null }, { target: 'ability.wis', value: -3, formula: '-3', type: 'penalty', condition: null }, { target: 'ability.cha', value: -3, formula: '-3', type: 'penalty', condition: null }], ruleFlags: {} },
        { id: 'debuff-spell-mind-fog', schemaVersion: 2, name: 'Mind Fog', type: 'Debuff', category: 'Enchantment', school: 'Enchantment', duration: '2d6 rounds', shortDescription: '-10 competence penalty on Wisdom checks and Will saves.', modifiers: [{ target: 'save.will', value: -10, formula: '-10', type: 'penalty', condition: null }], ruleFlags: {} }
      ];

      // 1. Scan Character Custom DB (`masterDb`) & Splatbook Buff Spells (Strictly filtered by Buff vs Debuff mode)
      const customList = [
        ...(typeof masterDb !== 'undefined' && Array.isArray(masterDb) ? masterDb : []),
        ...(typeof RuleEngine !== 'undefined' && Array.isArray(RuleEngine.SPLATBOOK_BUFF_SPELLS) ? RuleEngine.SPLATBOOK_BUFF_SPELLS : [])
      ];
      customList.forEach(item => {
        if (!item || !item.name || String(item.name).startsWith('↳')) return;
        const tLower = String(item.type || '').toLowerCase();
        const catLower = String(item.category || '').toLowerCase();
        if (!['condition', 'debuff', 'buff', 'spell'].includes(tLower) && !['combat condition', 'buff', 'debuff'].includes(catLower)) {
          return;
        }
        const isCondOrDebuff = tLower === 'condition' || tLower === 'debuff' || catLower === 'combat condition' || Boolean(item.isDebuff) || isPurelyNegativeMods(item.modifiers, item.ruleFlags);
        if (isDebuffMode) {
          if (isCondOrDebuff) {
            addCandidate(item, item.source || item.type || 'Custom Debuff', 75);
          }
        } else {
          if (!isCondOrDebuff) {
            if (tLower === 'spell') {
              const spec = (typeof RuleEngine !== 'undefined' && RuleEngine.resolveSpellBuffSpec)
                ? RuleEngine.resolveSpellBuffSpec(item, character, cl)
                : null;
              if (!spec || !spec.isBuffSpell) return;
            }
            addCandidate(item, item.source || item.type || 'Custom Buff', 70);
          }
        }
      });

      if (isDebuffMode) {
        CANONICAL_DEBUFF_SPELLS.forEach(ds => {
          addCandidate(ds, `SRD Debuff Spell (${ds.school})`, 88);
        });
      }

      // 2. Scan Loaded SRD Compendium (`srd_combat_rules.json` Conditions & Buffs + `srd_spells.json` Buff Spells)
      if (window.SrdCompendium && typeof window.SrdCompendium.getAllLoaded === 'function') {
        const allLoaded = window.SrdCompendium.getAllLoaded(['Condition', 'Buff', 'Spell']);
        allLoaded.forEach(rec => {
          if (!rec || !rec.name) return;
          const rType = String(rec.type || '').toLowerCase();
          if (rType === 'condition') {
            if (isDebuffMode) {
              addCandidate(rec, 'SRD Condition', 95);
            }
          } else if (rType === 'buff') {
            const isNegBuff = isPurelyNegativeMods(rec.modifiers, rec.ruleFlags);
            if (isDebuffMode && isNegBuff) {
              addCandidate(rec, 'SRD Debuff', 90);
            } else if (!isDebuffMode && !isNegBuff) {
              addCandidate(rec, 'SRD Combat Buff', 90);
            }
          } else if (rType === 'spell') {
            if (!isDebuffMode) {
              const spec = (typeof RuleEngine !== 'undefined' && RuleEngine.resolveSpellBuffSpec)
                ? RuleEngine.resolveSpellBuffSpec(rec, character, cl)
                : null;
              if (spec && spec.isBuffSpell) {
                addCandidate(rec, `SRD Buff Spell (${rec.school || 'Buff'})`, 85);
              }
            }
          }
        });
      }

      results.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
      const maxLimit = q ? 30 : 80;
      return results.slice(0, maxLimit).map(r => Object.assign({}, r.entry, { _spotlightKind: r.kindLabel }));
    }

    function hideBuffSpotlightDropdown() {
      const dd = document.getElementById('buff-spotlight-dropdown');
      if (dd) dd.classList.add('hidden');
      const emptyBox = document.getElementById('buff-v2-preview-empty');
      if (emptyBox && !_selectedSpotlightV2Entry) {
        emptyBox.classList.remove('hidden');
      }
    }

    function toggleBuffSpotlightListDropdown(ev) {
      if (ev) ev.stopPropagation();
      const dd = document.getElementById('buff-spotlight-dropdown');
      const inputEl = document.getElementById('buff-rule-master-input');
      if (!dd) return;
      if (!dd.classList.contains('hidden')) {
        hideBuffSpotlightDropdown();
      } else {
        onBuffSpotlightInput(inputEl ? inputEl.value : '', true);
      }
    }
    window.toggleBuffSpotlightListDropdown = toggleBuffSpotlightListDropdown;

    async function onBuffSpotlightInput(val, forceOpen = false) {
      const q = String(val || '').trim();
      const dd = document.getElementById('buff-spotlight-dropdown');
      if (!dd) return;

      const isDebuff = currentBuffModalMode === 'debuff';
      _buffSpotlightResults = await searchBuffSpotlightCandidates(q, isDebuff);
      _buffSpotlightActiveIdx = 0;
      if (forceOpen || q.length >= 0) {
        renderBuffSpotlightDropdown();
      }
    }
    window.onBuffSpotlightInput = onBuffSpotlightInput;

    function renderBuffSpotlightDropdown() {
      const dd = document.getElementById('buff-spotlight-dropdown');
      if (!dd) return;
      const emptyBox = document.getElementById('buff-v2-preview-empty');
      if (emptyBox) emptyBox.classList.add('hidden');

      Object.assign(dd.style, {
        position: 'fixed',
        top: '12vh',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(92vw, 640px)',
        maxHeight: '60vh',
        zIndex: '10060',
        overflowY: 'auto',
        background: 'rgba(15, 23, 42, 0.98)',
        border: '1px solid rgba(168, 85, 247, 0.5)',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)'
      });

      if (!Array.isArray(_buffSpotlightResults) || _buffSpotlightResults.length === 0) {
        dd.innerHTML = `
          <div class="p-3 text-xs text-slate-400 bg-slate-950 flex items-center justify-between gap-2">
            <span>No local SRD match. Press <b>Enter</b> or click <b>🔮 Rule Master AI</b> to query 3.5e books!</span>
          </div>
        `;
        dd.classList.remove('hidden');
        return;
      }

      const cl = getBuffModalCasterLevel();
      const evalCtx = { cl, level: Number(character?.level) || 6, bab: Number(character?.bab) || 0 };

      dd.innerHTML = _buffSpotlightResults.map((item, idx) => {
        const isSel = idx === _buffSpotlightActiveIdx;
        const spec = (typeof RuleEngine !== 'undefined' && RuleEngine.resolveSpellBuffSpec)
          ? RuleEngine.resolveSpellBuffSpec(item, character, cl)
          : null;

        const pills = [];
        const mods = (spec && Array.isArray(spec.modifiers) && spec.modifiers.length > 0)
          ? spec.modifiers
          : (Array.isArray(item.modifiers) ? item.modifiers : []);

        mods.slice(0, 4).forEach(m => {
          const lbl = (typeof RuleEngine !== 'undefined' && RuleEngine.formatBuffModifierLabel)
            ? RuleEngine.formatBuffModifierLabel(m, evalCtx)
            : `${m.value || m.formula} ${m.target}`;
          if (lbl) {
            const isNeg = String(lbl).trim().startsWith('-');
            pills.push(`<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${isNeg ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-indigo-950 text-indigo-200 border-indigo-700'}">${lbl}</span>`);
          }
        });

        if (spec && spec.summaryText && pills.length === 0) {
          pills.push(`<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">${spec.summaryText}</span>`);
        } else if (item.ruleFlags?.actionRestriction) {
          pills.push(`<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700">⚠️ ${item.ruleFlags.actionRestriction.slice(0, 48)}</span>`);
        }

        const desc = String(item.shortDescription || item.benefit || item.description || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        return `
          <div data-buff-spot-idx="${idx}" data-action="inventory:pick-buff-spotlight" data-spot-idx="${idx}" class="p-2.5 cursor-pointer transition flex flex-col gap-1 ${isSel ? 'bg-indigo-950 text-white' : 'bg-slate-950 hover:bg-slate-900 text-slate-200'}">
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-xs text-amber-300 truncate">${UI.escapeHtml(item.name)}</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-purple-300 shrink-0">${item._spotlightKind || item.type || 'SRD 3.5e'}</span>
            </div>
            ${pills.length > 0 ? `<div class="flex flex-wrap gap-1">${pills.join('')}</div>` : ''}
            ${desc ? `<div class="text-[10px] text-slate-400 line-clamp-1">${desc}</div>` : ''}
          </div>
        `;
      }).join('');

      dd.classList.remove('hidden');
    }

    function pickBuffSpotlightResult(idx) {
      const picked = _buffSpotlightResults[idx];
      hideBuffSpotlightDropdown();
      if (!picked) return;
      selectBuffSpotlightCandidate(picked);
    }
    window.pickBuffSpotlightResult = pickBuffSpotlightResult;

    function onBuffSpotlightKeydown(event) {
      const dd = document.getElementById('buff-spotlight-dropdown');
      const isOpen = dd && !dd.classList.contains('hidden') && _buffSpotlightResults.length > 0;
      if (event.key === 'ArrowDown' && isOpen) {
        event.preventDefault();
        _buffSpotlightActiveIdx = (_buffSpotlightActiveIdx + 1) % _buffSpotlightResults.length;
        renderBuffSpotlightDropdown();
      } else if (event.key === 'ArrowUp' && isOpen) {
        event.preventDefault();
        _buffSpotlightActiveIdx = (_buffSpotlightActiveIdx - 1 + _buffSpotlightResults.length) % _buffSpotlightResults.length;
        renderBuffSpotlightDropdown();
      } else if (event.key === 'Escape') {
        hideBuffSpotlightDropdown();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (isOpen && _buffSpotlightResults[_buffSpotlightActiveIdx]) {
          pickBuffSpotlightResult(_buffSpotlightActiveIdx);
        } else {
          queryRuleMasterForBuff();
        }
      }
    }
    window.onBuffSpotlightKeydown = onBuffSpotlightKeydown;

    function selectBuffModalEnergy(energyType) {
      _selectedSpotlightEnergy = energyType;
      if (_selectedSpotlightV2Entry) {
        selectBuffSpotlightCandidate(_selectedSpotlightV2Entry, { keepEnergy: true });
      }
    }
    window.selectBuffModalEnergy = selectBuffModalEnergy;

    function populateManualV2BuilderFromMechanics(modifiers, ruleFlags, evalCtx, entry = null, spec = null) {
      _buffModalV2Modifiers = Array.isArray(modifiers)
        ? modifiers.map(m => ({
            target: m.target || 'ability.str',
            value: (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateFormula)
              ? (Number(RuleEngine.evaluateFormula(m.formula !== undefined && m.formula !== null && m.formula !== '' ? m.formula : m.value, evalCtx)) || Number(m.value) || 0)
              : (Number(m.value) || 0),
            formula: m.formula !== undefined && m.formula !== null && m.formula !== '' ? String(m.formula) : String(m.value || 0),
            type: String(m.type || 'enhancement').toLowerCase(),
            condition: m.condition || null
          }))
        : [];

      _buffModalV2RuleFlags = (ruleFlags && typeof ruleFlags === 'object')
        ? JSON.parse(JSON.stringify(ruleFlags))
        : {};
      _buffManualEdited = false;

      const setInputVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? String(val) : '';
      };

      const tempHpExpr = spec?.tempHpFormula || entry?.tempHpFormula || _buffModalV2RuleFlags.tempHpFormula || _buffModalV2RuleFlags.tempHp || '';
      setInputVal('buff-v2-flag-temphp', tempHpExpr);
      setInputVal('buff-v2-flag-concealment', _buffModalV2RuleFlags.concealment || '');
      setInputVal('buff-v2-flag-sr', _buffModalV2RuleFlags.srFormula || _buffModalV2RuleFlags.sr || '');
      setInputVal('buff-v2-flag-dr', _buffModalV2RuleFlags.dr || (_buffModalV2RuleFlags.drAdamantine ? `${_buffModalV2RuleFlags.drAdamantine}/Adamantine` : ''));
      setInputVal('buff-v2-flag-eres', _buffModalV2RuleFlags.energyResistance || '');
      setInputVal('buff-v2-flag-neglvl', _buffModalV2RuleFlags.negativeLevels || '');
      setInputVal('buff-v2-flag-action', _buffModalV2RuleFlags.actionRestriction || '');

      renderBuffModalV2ModifierRows();
      renderBuffModalV2RuleFlags();
    }

    function selectBuffSpotlightCandidate(entry, opts = {}) {
      if (!entry) return;
      _selectedSpotlightV2Entry = JSON.parse(JSON.stringify(entry));
      if (!opts.keepEnergy) {
        _selectedSpotlightEnergy = entry.chosenEnergy || 'Fire';
      }

      const cl = getBuffModalCasterLevel();
      const evalCtx = { cl, level: Number(character?.level) || 6, bab: Number(character?.bab) || 0 };
      const rType = String(entry.type || '').toLowerCase();
      const isCond = rType === 'condition' || entry.category === 'Combat Condition';

      // Auto-switch Buff/Debuff mode if selecting a Condition
      if (isCond && currentBuffModalMode !== 'debuff') {
        switchBuffModalMode('debuff', { keepSelection: true });
      }

      const spec = (typeof RuleEngine !== 'undefined' && RuleEngine.resolveSpellBuffSpec)
        ? RuleEngine.resolveSpellBuffSpec({ ...entry, chosenEnergy: _selectedSpotlightEnergy }, character, cl)
        : null;

      const modifiers = (spec && Array.isArray(spec.modifiers) && spec.modifiers.length > 0)
        ? spec.modifiers
        : (Array.isArray(entry.modifiers) ? entry.modifiers : []);
      const ruleFlags = { ...(entry.ruleFlags || {}), ...(spec?.ruleFlags || {}) };

      // Extract flat form previews for backward-compatible properties
      let acVal = 0, attVal = 0, dmgVal = 0, strVal = 0, dexVal = 0, conVal = 0, intVal = 0, wisVal = 0, chaVal = 0;
      let primaryBonusType = entry.bonusType || (currentBuffModalMode === 'debuff' ? 'Penalty' : 'Enhancement');

      modifiers.forEach(m => {
        if (!m) return;
        const val = (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateFormula)
          ? (Number(RuleEngine.evaluateFormula(m.formula !== undefined && m.formula !== null && m.formula !== '' ? m.formula : m.value, evalCtx)) || Number(m.value) || 0)
          : (Number(m.value) || 0);
        const t = String(m.target || '').toLowerCase();
        if (m.type && m.type !== 'untyped') {
          const capType = m.type.charAt(0).toUpperCase() + m.type.slice(1).toLowerCase();
          if (['Enhancement', 'Morale', 'Luck', 'Armor', 'Shield', 'Deflection', 'Natural', 'Dodge', 'Penalty'].includes(capType)) {
            primaryBonusType = capType;
          } else if (m.type === 'natural_enhancement') {
            primaryBonusType = 'Natural';
          }
        }
        if (t.startsWith('ac')) acVal += val;
        else if (t.startsWith('attack') || t === 'atk') attVal += val;
        else if (t.startsWith('damage') || t === 'dmg') dmgVal += val;
        else if (t === 'ability.str' || t === 'str') strVal += val;
        else if (t === 'ability.dex' || t === 'dex') dexVal += val;
        else if (t === 'ability.con' || t === 'con') conVal += val;
        else if (t === 'ability.int' || t === 'int') intVal += val;
        else if (t === 'ability.wis' || t === 'wis') wisVal += val;
        else if (t === 'ability.cha' || t === 'cha') chaVal += val;
      });

      const durText = spec?.durationText || entry.duration || (isCond ? 'Condition' : '1 min/level');
      let rounds = null;
      const rdMatch = String(durText).match(/^(\d+)\s*(?:rd|round)/i);
      if (rdMatch) rounds = parseInt(rdMatch[1], 10);
      else if (/^(\d+)\s*min$/i.test(durText)) {
        const mMatch = String(durText).match(/^(\d+)\s*min$/i);
        if (mMatch && parseInt(mMatch[1], 10) <= 15) rounds = parseInt(mMatch[1], 10) * 10;
      }

      const cleanDesc = String(entry.shortDescription || entry.benefit || spec?.summaryText || entry.description || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const displayName = ruleFlags.energyChoice ? `${entry.name} (${_selectedSpotlightEnergy})` : entry.name;
      const sourceVal = isCond ? 'Condition' : (rType === 'spell' ? 'Spell' : (entry.source && entry.source !== 'SRD 3.5e' ? entry.source : 'Spell'));

      fillBuffFormFromEntry({
        name: displayName,
        source: sourceVal,
        bonusType: primaryBonusType,
        rounds: rounds !== null ? rounds : '',
        durationText: durText,
        ac: acVal || '',
        att: attVal || '',
        dmg: dmgVal || '',
        str: strVal || '',
        dex: dexVal || '',
        con: conVal || '',
        int: intVal || '',
        wis: wisVal || '',
        cha: chaVal || '',
        notes: cleanDesc,
        children: entry.children || []
      });

      // Populate Manual V2 Builder rows & flags from this entry
      populateManualV2BuilderFromMechanics(modifiers, ruleFlags, evalCtx, entry, spec);

      const rmInput = document.getElementById('buff-rule-master-input');
      if (rmInput) rmInput.value = entry.name;

      // Render V2 Preview Banner (Modifiers + RuleFlags + Energy/Weapon Pickers)
      renderBuffV2PreviewBanner(entry, spec, modifiers, ruleFlags, evalCtx, cleanDesc, rounds, durText);
    }

    function renderBuffV2PreviewBanner(entry, spec, modifiers, ruleFlags, evalCtx, cleanDesc = '', rounds = null, durText = '') {
      const banner = document.getElementById('buff-v2-preview-banner');
      const emptyBox = document.getElementById('buff-v2-preview-empty');
      const titleEl = document.getElementById('buff-v2-preview-title');
      const descEl = document.getElementById('buff-v2-preview-desc');
      const sourceEl = document.getElementById('buff-v2-preview-source');
      const pillsEl = document.getElementById('buff-v2-preview-pills');
      const energyBox = document.getElementById('buff-v2-energy-picker');
      const energyBtns = document.getElementById('buff-v2-energy-buttons');
      const weaponBox = document.getElementById('buff-v2-weapon-picker');
      const weaponSelect = document.getElementById('buff-v2-weapon-select');
      const spotRds = document.getElementById('buff-spot-rounds');
      const spotDur = document.getElementById('buff-spot-duration');
      if (!banner || !pillsEl) return;

      if (!entry) {
        banner.classList.add('hidden');
        if (emptyBox) emptyBox.classList.remove('hidden');
        return;
      }

      if (emptyBox) emptyBox.classList.add('hidden');
      if (titleEl) titleEl.innerHTML = `<span>✨</span><span>${UI.escapeHtml(entry.name)}</span>`;
      if (descEl) descEl.textContent = cleanDesc || '';
      if (sourceEl) sourceEl.textContent = entry._spotlightKind || entry.source || 'SRD 3.5e';
      if (spotRds) spotRds.value = rounds !== null && rounds !== undefined ? rounds : '';
      if (spotDur) spotDur.value = durText || '';

      const pills = [];
      modifiers.forEach(m => {
        const lbl = (typeof RuleEngine !== 'undefined' && RuleEngine.formatBuffModifierLabel)
          ? RuleEngine.formatBuffModifierLabel(m, evalCtx)
          : `${m.value || m.formula} ${m.target}`;
        if (lbl) {
          const isNeg = String(lbl).trim().startsWith('-');
          pills.push(`<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${isNeg ? 'bg-rose-950 text-rose-200 border-rose-700' : 'bg-indigo-950 text-indigo-200 border-indigo-600'}">${lbl}</span>`);
        }
      });

      if (spec?.summaryText && pills.length === 0) {
        pills.push(`<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-950 text-emerald-200 border border-emerald-700">${spec.summaryText}</span>`);
      }
      if (ruleFlags.actionRestriction) {
        pills.push(`<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-950 text-rose-200 border border-rose-700">⚠️ ${ruleFlags.actionRestriction}</span>`);
      }
      if (ruleFlags.loseDexToAC) {
        pills.push(`<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-950 text-rose-200 border border-rose-700">Lose DEX to AC</span>`);
      }
      if (ruleFlags.halfSpeed) {
        pills.push(`<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-950 text-amber-200 border border-amber-700">Half Speed</span>`);
      }

      pillsEl.innerHTML = pills.length > 0
        ? pills.join('')
        : `<span class="text-[11px] text-slate-400 italic">Narrative / tactical effect (click "Edit V2 Modifiers" to add custom stat modifiers).</span>`;

      // Energy Choice Picker
      if (energyBox && energyBtns) {
        if (ruleFlags.energyChoice) {
          const ENERGIES = [
            { type: 'Fire', icon: '🔥' },
            { type: 'Cold', icon: '❄️' },
            { type: 'Acid', icon: '🧪' },
            { type: 'Electricity', icon: '⚡' },
            { type: 'Sonic', icon: '🔊' }
          ];
          energyBtns.innerHTML = ENERGIES.map(e => {
            const active = _selectedSpotlightEnergy === e.type;
            return `<button type="button" data-action="inventory:select-buff-energy" data-energy="${e.type}" class="px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${active ? 'bg-amber-600 text-white border-amber-300 shadow' : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'}">${e.icon} ${e.type}</button>`;
          }).join('');
          energyBox.classList.remove('hidden');
        } else {
          energyBox.classList.add('hidden');
        }
      }

      // Target Weapon Picker
      if (weaponBox && weaponSelect) {
        if (spec && spec.targetMode === 'weapon') {
          const weapons = (character?.weapons || []).filter(w => w && w.name && w.name !== '-');
          if (weapons.length > 0) {
            weaponSelect.innerHTML = weapons.map(w => `<option value="${UI.escapeAttr(w.name)}">⚔️ ${UI.escapeHtml(w.name)}</option>`).join('');
          } else {
            weaponSelect.innerHTML = `<option value="">-- No Personal Weapon Equipped --</option>`;
          }
          weaponBox.classList.remove('hidden');
        } else {
          weaponBox.classList.add('hidden');
        }
      }

      banner.classList.remove('hidden');
    }

    function switchBuffModalMode(mode, opts = {}) {
      currentBuffModalMode = mode === 'debuff' ? 'debuff' : 'buff';
      const isDebuff = currentBuffModalMode === 'debuff';

      const btnBuff = document.getElementById('btn-mode-buff');
      const btnDebuff = document.getElementById('btn-mode-debuff');
      const container = document.getElementById('add-buff-modal-container');
      const iconBadge = document.getElementById('buff-modal-icon-badge');
      const modalTitle = document.getElementById('buff-modal-title');
      const modalBadge = document.getElementById('buff-modal-badge');
      const modalSubtitle = document.getElementById('buff-modal-subtitle');
      const rmBox = document.getElementById('buff-rule-master-box');
      const rmTitle = document.getElementById('buff-rule-master-title');
      const rmCountBadge = document.getElementById('buff-spotlight-count-badge');
      const rmCmdBar = document.getElementById('buff-spotlight-command-bar');
      const rmIconBadge = document.getElementById('buff-spotlight-icon-badge');
      const rmBtn = document.getElementById('btn-buff-rule-master');
      const rmInput = document.getElementById('buff-rule-master-input');
      const presetLabel = document.getElementById('buff-preset-label');
      const presetSelect = document.getElementById('buff-preset-select');
      const nameLabel = document.getElementById('buff-label-name');
      const saveBtn = document.getElementById('btn-save-buff');
      const sourceSelect = document.getElementById('buff-input-source');
      const typeSelect = document.getElementById('buff-input-type');

      if (!opts.keepSelection) {
        currentBuffModalChildren = [];
        _selectedSpotlightV2Entry = null;
        _buffModalV2Modifiers = [];
        _buffModalV2RuleFlags = {};
        _buffManualEdited = false;
        const childrenPreview = document.getElementById('buff-children-preview-container');
        if (childrenPreview) childrenPreview.classList.add('hidden');
        const v2Banner = document.getElementById('buff-v2-preview-banner');
        if (v2Banner) v2Banner.classList.add('hidden');
        const emptyBox = document.getElementById('buff-v2-preview-empty');
        if (emptyBox) emptyBox.classList.remove('hidden');
        renderBuffModalV2ModifierRows();
        renderBuffModalV2RuleFlags();
      }

      if (isDebuff) {
        if (btnBuff) {
          btnBuff.className = 'flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700 bg-slate-900 text-slate-400 hover:text-indigo-300';
        }
        if (btnDebuff) {
          btnDebuff.className = 'flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition border shadow-sm bg-rose-600 border-rose-500 text-white shadow-rose-900/40';
        }
        if (container) {
          container.className = 'bg-dndCard border border-rose-500/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transition-colors';
        }
        if (iconBadge) {
          iconBadge.className = 'w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-600/50 flex items-center justify-center text-lg shadow-inner';
          iconBadge.textContent = '🩸';
        }
        if (modalTitle) modalTitle.textContent = 'Add New Debuff / Condition';
        if (modalBadge) {
          modalBadge.className = 'text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full';
          modalBadge.textContent = 'D&D 3.5e RAW (Debuff)';
        }
        if (modalSubtitle) modalSubtitle.textContent = 'Search 35+ SRD conditions & debuffs via Spotlight or 🔮 Rule Master AI';
        if (rmBox) rmBox.className = 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 border border-rose-500/40 rounded-xl p-3 space-y-2.5 shadow-inner';
        if (rmTitle) {
          rmTitle.className = 'text-xs font-bold text-rose-300 flex items-center gap-1.5';
          rmTitle.innerHTML = '<span>🔮</span><span>Spotlight &amp; Rule Master AI</span>';
        }
        if (rmCountBadge) {
          rmCountBadge.className = 'text-[10px] text-rose-300 font-mono bg-rose-950/70 px-2 py-0.5 rounded border border-rose-500/40 shrink-0';
          rmCountBadge.textContent = '45+ V2 Conditions & Debuffs';
        }
        if (rmCmdBar) rmCmdBar.className = 'ui-spotlight-well ui-spotlight-rose rounded-xl p-1.5 flex items-center gap-2 border border-rose-400/75';
        if (rmIconBadge) rmIconBadge.className = 'w-8 h-8 rounded-lg bg-rose-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow';
        if (rmBtn) rmBtn.className = 'h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/60 font-bold text-xs shadow flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0';
        if (rmInput) rmInput.placeholder = 'Click to browse all conditions, or type to filter (e.g., Sickened, Slow)...';
        if (presetLabel) presetLabel.textContent = 'Examples:';
        if (nameLabel) nameLabel.textContent = 'Debuff / Condition Name *';
        if (saveBtn) {
          saveBtn.className = 'bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition shadow';
          saveBtn.innerHTML = '<span>🩸 Add & Activate Debuff</span>';
        }
        if (sourceSelect) sourceSelect.value = 'Condition';
        if (typeSelect) typeSelect.value = 'Penalty';

        if (presetSelect) {
          presetSelect.innerHTML = `
            <option value="custom">-- Define Custom Condition / Debuff --</option>
            <option value="energy_drain_4">🩸 Energy Drain (-4 Lvl) [Parent-Child: 5 Sub-Effects]</option>
            <option value="sickened">🤢 Sickened (-2 Attack, Damage, Saves, Skills/Ability Checks)</option>
            <option value="shaken">😱 Shaken (-2 Attack, Saves, Skills/Ability Checks)</option>
            <option value="fatigued">😫 Fatigued (-2 STR, -2 DEX, Cannot Run/Charge)</option>
          `;
        }
      } else {
        if (btnBuff) {
          btnBuff.className = 'flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition border shadow-sm bg-indigo-600 border-indigo-500 text-white shadow-indigo-900/40';
        }
        if (btnDebuff) {
          btnDebuff.className = 'flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700 bg-slate-900 text-slate-400 hover:text-rose-300 hover:border-rose-600/50';
        }
        if (container) {
          container.className = 'bg-dndCard border border-indigo-500/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transition-colors';
        }
        if (iconBadge) {
          iconBadge.className = 'w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-600/50 flex items-center justify-center text-lg shadow-inner';
          iconBadge.textContent = '✨';
        }
        if (modalTitle) modalTitle.textContent = 'Add New Buff / Spell Effect';
        if (modalBadge) {
          modalBadge.className = 'text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full';
          modalBadge.textContent = 'D&D 3.5e RAW (Buff)';
        }
        if (modalSubtitle) modalSubtitle.textContent = 'Search 200+ V2 spells & combat buffs via Spotlight or 🔮 Rule Master AI';
        if (rmBox) rmBox.className = 'bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/40 rounded-xl p-3 space-y-2.5 shadow-inner';
        if (rmTitle) {
          rmTitle.className = 'text-xs font-bold text-indigo-300 flex items-center gap-1.5';
          rmTitle.innerHTML = '<span>🔮</span><span>Spotlight &amp; Rule Master AI</span>';
        }
        if (rmCountBadge) {
          rmCountBadge.className = 'text-[10px] text-indigo-300 font-mono bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-500/40 shrink-0';
          rmCountBadge.textContent = '180+ V2 Buffs & Spells';
        }
        if (rmCmdBar) rmCmdBar.className = 'ui-spotlight-well ui-spotlight-indigo rounded-xl p-1.5 flex items-center gap-2 border border-indigo-400/75';
        if (rmIconBadge) rmIconBadge.className = 'w-8 h-8 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow';
        if (rmBtn) rmBtn.className = 'h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/60 font-bold text-xs shadow flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0';
        if (rmInput) rmInput.placeholder = 'Click to browse all buffs, or type to filter (e.g., Haste, Barkskin)...';
        if (presetLabel) presetLabel.textContent = 'Examples:';
        if (nameLabel) nameLabel.textContent = 'Buff / Effect Name *';
        if (saveBtn) {
          saveBtn.className = 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition shadow';
          saveBtn.innerHTML = '<span>✨ Add & Activate Buff</span>';
        }
        if (sourceSelect) sourceSelect.value = 'Spell';
        if (typeSelect) typeSelect.value = 'Enhancement';

        if (presetSelect) {
          presetSelect.innerHTML = `
            <option value="custom">-- Define Custom Buff --</option>
            <option value="mage_armor">🛡️ Mage Armor (+4 Armor AC, 50 Rds / 5 Hrs)</option>
            <option value="bulls_str">🐂 Bull's Strength (+4 Enhancement STR, 10 Rounds)</option>
            <option value="haste">⚡ Haste (+1 Atk, +1 Dodge AC, +1 Ref, +30 ft Speed, 6 Rounds)</option>
          `;
        }
      }

      switchBuffModalTab(currentBuffModalTab);
      renderBuffQuickPickChips();
      const dd = document.getElementById('buff-spotlight-dropdown');
      if (dd && !dd.classList.contains('hidden')) {
        onBuffSpotlightInput(rmInput ? rmInput.value : '', true);
      }
    }

    function renderBuffChildrenPreview(children) {
      const container = document.getElementById('buff-children-preview-container');
      const listEl = document.getElementById('buff-children-list');
      const badgeEl = document.getElementById('buff-children-count-badge');
      if (!container || !listEl) return;

      if (!Array.isArray(children) || children.length === 0) {
        container.classList.add('hidden');
        listEl.innerHTML = '';
        return;
      }

      if (badgeEl) badgeEl.textContent = `${children.length} Sub-Effects`;
      listEl.innerHTML = children.map(c => {
        const cMods = [];
        if (c.attBonus) cMods.push(`${c.attBonus} Atk`);
        if (c.dmgBonus) cMods.push(`${c.dmgBonus} Dmg`);
        if (c.hpPenalty) cMods.push(`-${c.hpPenalty} HP`);
        if (c.fortBonus) cMods.push(`${c.fortBonus} Fort`);
        if (c.refBonus) cMods.push(`${c.refBonus} Ref`);
        if (c.willBonus) cMods.push(`${c.willBonus} Will`);
        if (c.skillBonus) cMods.push(`${c.skillBonus} Skills`);
        if (c.strBonus) cMods.push(`${c.strBonus} Str`);
        if (c.dexBonus) cMods.push(`${c.dexBonus} Dex`);
        if (c.clPenalty) cMods.push(`-${c.clPenalty} CL`);
        return `
          <div class="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
            <span class="text-slate-200 font-sans font-medium">${UI.escapeHtml(c.name)}</span>
            <span class="text-rose-400 font-mono font-bold">${cMods.join(', ')}</span>
          </div>
        `;
      }).join('');

      container.classList.remove('hidden');
    }

    function openAddBuffModal() {
      if (typeof window.ensureModalsMounted === 'function') window.ensureModalsMounted();
      const modal = document.getElementById('add-buff-modal');
      if (!modal) return;
      _selectedSpotlightV2Entry = null;
      _selectedSpotlightEnergy = 'Fire';
      _buffModalV2Modifiers = [];
      _buffModalV2RuleFlags = {};
      _buffManualEdited = false;
      hideBuffSpotlightDropdown();

      const defCl = String(Math.max(1, Number(character?.level) || 6));
      const clEl = document.getElementById('buff-input-cl');
      const clManEl = document.getElementById('buff-manual-cl');
      if (clEl) clEl.value = defCl;
      if (clManEl) clManEl.value = defCl;

      switchBuffModalMode('buff');
      switchBuffModalTab('spotlight');

      const resetIds = [
        'buff-input-name', 'buff-input-ac', 'buff-input-att', 'buff-input-dmg',
        'buff-input-str', 'buff-input-dex', 'buff-input-con', 'buff-input-int',
        'buff-input-wis', 'buff-input-cha', 'buff-input-notes',
        'buff-v2-flag-temphp', 'buff-v2-flag-concealment', 'buff-v2-flag-sr',
        'buff-v2-flag-dr', 'buff-v2-flag-eres', 'buff-v2-flag-neglvl', 'buff-v2-flag-action'
      ];
      resetIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const rdsEl = document.getElementById('buff-input-rounds');
      if (rdsEl) rdsEl.value = '10';
      const durEl = document.getElementById('buff-input-duration');
      if (durEl) durEl.value = '1 min/level';
      const spotRds = document.getElementById('buff-spot-rounds');
      if (spotRds) spotRds.value = '';
      const spotDur = document.getElementById('buff-spot-duration');
      if (spotDur) spotDur.value = '';

      const statusEl = document.getElementById('buff-rule-master-status');
      if (statusEl) {
        statusEl.className = 'hidden';
        statusEl.textContent = '';
      }
      const rmInput = document.getElementById('buff-rule-master-input');
      if (rmInput) rmInput.value = '';
      modal.classList.remove('hidden');
    }

    function closeAddBuffModal() {
      hideBuffSpotlightDropdown();
      const modal = document.getElementById('add-buff-modal');
      if (modal) modal.classList.add('hidden');
    }
    window.openAddBuffModal = openAddBuffModal;
    window.openBuffModal = openAddBuffModal;
    window.closeAddBuffModal = closeAddBuffModal;

    function onBuffPresetChange() {
      const presetKey = document.getElementById('buff-preset-select').value;
      if (presetKey === 'custom') {
        currentBuffModalChildren = [];
        renderBuffChildrenPreview([]);
        return;
      }

      const isDebuff = currentBuffModalMode === 'debuff';
      const catalog = isDebuff ? (RuleEngine.getDefaultDebuffs ? RuleEngine.getDefaultDebuffs() : []) : (RuleEngine.getDefaultBuffs ? RuleEngine.getDefaultBuffs() : []);
      const match = catalog.find(d => d.id === (isDebuff ? 'debuff_' : 'buff_') + presetKey || d.name.toLowerCase().includes(presetKey.replace('_', ' ')));
      if (!match) return;

      document.getElementById('buff-input-name').value = match.name;
      
      const srcEl = document.getElementById('buff-input-source');
      if (srcEl) {
        const rawSrc = (match.source || '').toLowerCase();
        if (rawSrc.includes('condition') || rawSrc.includes('durum')) {
          srcEl.value = 'Condition';
        } else if (rawSrc.includes('undead') || rawSrc.includes('monster')) {
          srcEl.value = 'Undead / Monster';
        } else if (rawSrc.includes('potion')) {
          srcEl.value = 'Potion';
        } else if (rawSrc.includes('item')) {
          srcEl.value = 'Item / Equipment';
        } else if (rawSrc.includes('stance') || rawSrc.includes('maneuver')) {
          srcEl.value = 'Stance / Maneuver';
        } else {
          srcEl.value = 'Spell';
        }
      }

      document.getElementById('buff-input-type').value = match.bonusType || (isDebuff ? 'Penalty' : 'Untyped');
      document.getElementById('buff-input-rounds').value = match.rounds !== null && match.rounds !== undefined ? match.rounds : '';
      document.getElementById('buff-input-duration').value = match.durationText || '';
      document.getElementById('buff-input-ac').value = match.acBonus || match.naturalBonus || match.deflectionBonus || match.dodgeBonus || (match.acPenalty ? -match.acPenalty : '');
      document.getElementById('buff-input-att').value = match.attBonus || '';
      document.getElementById('buff-input-dmg').value = match.dmgBonus || '';
      document.getElementById('buff-input-str').value = match.strBonus || '';
      document.getElementById('buff-input-dex').value = match.dexBonus || '';
      document.getElementById('buff-input-con').value = match.conBonus || '';
      document.getElementById('buff-input-int').value = match.intBonus || '';
      document.getElementById('buff-input-wis').value = match.wisBonus || '';
      document.getElementById('buff-input-cha').value = match.chaBonus || '';
      document.getElementById('buff-input-notes').value = match.notes || '';

      if (Array.isArray(match.children) && match.children.length > 0) {
        currentBuffModalChildren = JSON.parse(JSON.stringify(match.children));
        renderBuffChildrenPreview(currentBuffModalChildren);
      } else {
        currentBuffModalChildren = [];
        renderBuffChildrenPreview([]);
      }
    }

    async function queryRuleMasterForBuff() {
      const inputEl = document.getElementById('buff-rule-master-input');
      const statusEl = document.getElementById('buff-rule-master-status');
      const btn = document.getElementById('btn-buff-rule-master');
      if (!inputEl) return;
      hideBuffSpotlightDropdown();
      const q = inputEl.value.trim();
      if (!q) {
        if (statusEl) {
          statusEl.className = 'text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 p-2 rounded-lg block';
          statusEl.textContent = 'Please enter a spell, buff, or condition name to search.';
        }
        return;
      }

      // Check if query is a debuff or negative level
      const qLower = q.toLowerCase();
      const isDrainQuery = qLower.includes('drain') || qLower.includes('negative level') || qLower.includes('lvl drain');
      const isDebuffQuery = isDrainQuery || qLower.includes('sick') || qLower.includes('shaken') || qLower.includes('fatigue') || qLower.includes('slow') || qLower.includes('entangle') || qLower.includes('debuff') || qLower.includes('curse');

      if (isDebuffQuery && currentBuffModalMode !== 'debuff') {
        switchBuffModalMode('debuff', { keepSelection: true });
      }

      if (isDrainQuery) {
        const debuffs = RuleEngine.getDefaultDebuffs ? RuleEngine.getDefaultDebuffs() : [];
        const edMatch = debuffs.find(d => d.id === 'debuff_energy_drain_4');
        if (edMatch) {
          const pSelect = document.getElementById('buff-preset-select');
          if (pSelect) pSelect.value = 'energy_drain_4';
          fillBuffFormFromEntry({
            name: edMatch.name,
            source: edMatch.source,
            bonusType: edMatch.bonusType,
            rounds: edMatch.rounds,
            durationText: edMatch.durationText,
            notes: edMatch.notes,
            children: edMatch.children,
            negativeLevels: 4
          });
          if (statusEl) {
            statusEl.className = 'text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 p-2 rounded-lg block';
            statusEl.textContent = `✓ Detected D&D 3.5e RAW rule "${edMatch.name}"! Populated Parent effect and 5 Child sub-effects (Attack, Saves, Skills, HP, CL).`;
          }
          return;
        }
      }

      if (statusEl) {
        statusEl.className = 'text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 p-2 rounded-lg flex items-center gap-2 block';
        statusEl.innerHTML = '<span class="animate-spin inline-block">⏳</span><span>🔮 Rule Master AI fetching D&D 3.5e RAW data...</span>';
      }
      if (btn) btn.disabled = true;

      try {
        // 1. 0ms Local Search across SRD Compendium (Conditions, Buffs, Spells) + Custom Master DB
        const localCandidates = await searchBuffSpotlightCandidates(q, currentBuffModalMode === 'debuff');
        const exactLocal = localCandidates.find(c => (c.name || '').toLowerCase().trim() === qLower) || localCandidates[0];
        if (exactLocal && (exactLocal.name || '').toLowerCase().includes(qLower)) {
          selectBuffSpotlightCandidate(exactLocal);
          if (statusEl) {
            statusEl.className = 'text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 p-2 rounded-lg block';
            statusEl.textContent = `✓ Found "${exactLocal.name}" in ${exactLocal._spotlightKind || 'Compendium'} (0 tokens) and populated Canonical V2 mechanics!`;
          }
          return;
        }

        // 2. Query Rule Master AI for Splatbook / Homebrew spells & conditions
        const apiKey = (typeof RuleMaster !== 'undefined' && typeof RuleMaster.getApiKey === 'function') 
          ? RuleMaster.getApiKey() 
          : (localStorage.getItem('gemini_api_key') || '');

        if (!apiKey) {
          if (statusEl) {
            statusEl.className = 'text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 p-2 rounded-lg block';
            statusEl.innerHTML = `⚠️ "${q}" not found in local SRD Compendium. Add a free Gemini API key in Settings ⚙️ (top right) to fetch from D&D 3.5e splatbooks via 🔮 Rule Master AI.`;
          }
          return;
        }

        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchSingleAiRuleObjects === 'function') {
          const categoryHint = currentBuffModalMode === 'debuff' ? 'Condition' : 'Spell';
          const entries = await RuleMaster.fetchSingleAiRuleObjects(q, categoryHint, apiKey, statusEl);
          if (entries && entries.length > 0) {
            const v2Entry = (typeof RuleMaster.ensureV2 === 'function')
              ? RuleMaster.ensureV2(entries[0])
              : entries[0];
            v2Entry._spotlightKind = 'Rule Master AI';
            selectBuffSpotlightCandidate(v2Entry);

            if (statusEl) {
              statusEl.className = 'text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 p-2 rounded-lg block';
              statusEl.textContent = `✓ 🔮 Rule Master AI fetched "${v2Entry.name || q}" from D&D 3.5e sourcebooks and populated Canonical V2 mechanics!`;
            }
            return;
          }
        }

        if (statusEl) {
          statusEl.className = 'text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 p-2 rounded-lg block';
          statusEl.textContent = `"${q}" not found in compendium. Switch to the 🛠️ Manual V2 Effect Builder tab to define it.`;
        }
      } catch (err) {
        if (statusEl) {
          statusEl.className = 'text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 p-2 rounded-lg block';
          statusEl.textContent = `Search error: ${err.message}`;
        }
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    function fillBuffFormFromEntry(entry) {
      if (!entry) return;
      document.getElementById('buff-input-name').value = entry.name || '';
      const srcEl = document.getElementById('buff-input-source');
      if (srcEl) {
        srcEl.value = entry.source || (currentBuffModalMode === 'debuff' ? 'Condition' : 'Spell');
      }
      document.getElementById('buff-input-type').value = entry.bonusType || (currentBuffModalMode === 'debuff' ? 'Penalty' : 'Enhancement');
      const rdsStr = entry.rounds !== null && entry.rounds !== undefined ? entry.rounds : '';
      document.getElementById('buff-input-rounds').value = rdsStr;
      document.getElementById('buff-input-duration').value = entry.durationText || '';
      const spotRds = document.getElementById('buff-spot-rounds');
      if (spotRds) spotRds.value = rdsStr;
      const spotDur = document.getElementById('buff-spot-duration');
      if (spotDur) spotDur.value = entry.durationText || '';
      document.getElementById('buff-input-ac').value = entry.ac || '';
      document.getElementById('buff-input-att').value = entry.att || '';
      document.getElementById('buff-input-dmg').value = entry.dmg || '';
      document.getElementById('buff-input-str').value = entry.str || '';
      document.getElementById('buff-input-dex').value = entry.dex || '';
      document.getElementById('buff-input-con').value = entry.con || '';
      document.getElementById('buff-input-int').value = entry.int || '';
      document.getElementById('buff-input-wis').value = entry.wis || '';
      document.getElementById('buff-input-cha').value = entry.cha || '';
      document.getElementById('buff-input-notes').value = entry.notes || '';

      if (Array.isArray(entry.children) && entry.children.length > 0) {
        currentBuffModalChildren = JSON.parse(JSON.stringify(entry.children));
        renderBuffChildrenPreview(currentBuffModalChildren);
      } else {
        currentBuffModalChildren = [];
        renderBuffChildrenPreview([]);
      }
    }

    function saveNewBuffFromModal() {
      let name = document.getElementById('buff-input-name').value.trim();
      const spotQuery = (document.getElementById('buff-rule-master-input')?.value || '').trim();
      if (!name && _selectedSpotlightV2Entry?.name) {
        name = _selectedSpotlightV2Entry.name;
      } else if (!name && spotQuery) {
        name = spotQuery;
      }

      if (!name) {
        showToast(currentBuffModalMode === 'debuff' ? 'Please select a Condition/Debuff from Spotlight or enter a Name in the Manual V2 tab.' : 'Please select a Buff from Spotlight or enter a Name in the Manual V2 tab.', 'error', { wrap: true });
        return;
      }

      const isDebuff = currentBuffModalMode === 'debuff';
      const cl = getBuffModalCasterLevel();
      const evalCtx = { cl, level: Number(character?.level) || 6, bab: Number(character?.bab) || 0 };
      const source = document.getElementById('buff-input-source').value.trim() || (isDebuff ? 'Condition' : 'Spell');
      const bonusType = document.getElementById('buff-input-type').value || (isDebuff ? 'Penalty' : 'Enhancement');
      const roundsVal = document.getElementById('buff-input-rounds').value.trim();
      const rounds = roundsVal !== '' ? parseInt(roundsVal, 10) : null;
      const durationText = document.getElementById('buff-input-duration').value.trim();
      const notes = document.getElementById('buff-input-notes').value.trim();

      // Check if selected Spotlight entry is a Canonical V2 Spell Buff and user didn't manually customize rows in Tab 2
      const selectedBaseName = (_selectedSpotlightV2Entry?.name || '').toLowerCase().trim();
      const cleanTypedBase = name.replace(/\s*\((?:fire|cold|acid|electricity|sonic)\)\s*$/i, '').toLowerCase().trim();
      const matchesSpotlightV2 = Boolean(_selectedSpotlightV2Entry && selectedBaseName && selectedBaseName === cleanTypedBase);

      let v2Modifiers = [];
      let v2RuleFlags = {};
      let v2Summary = '';
      let chosenWeapon = null;
      let chosenEnergy = null;

      if (matchesSpotlightV2 && !_buffManualEdited && currentBuffModalTab === 'spotlight') {
        const spec = (typeof RuleEngine !== 'undefined' && RuleEngine.resolveSpellBuffSpec)
          ? RuleEngine.resolveSpellBuffSpec({ ..._selectedSpotlightV2Entry, chosenEnergy: _selectedSpotlightEnergy }, character, cl)
          : null;

        if (!isDebuff && spec && spec.isBuffSpell && typeof window.applySpellBuffToCharacter === 'function') {
          const weaponSelectEl = document.getElementById('buff-v2-weapon-select');
          if (spec.targetMode === 'weapon' && weaponSelectEl && weaponSelectEl.value) {
            chosenWeapon = weaponSelectEl.value;
          }
          if (spec.ruleFlags?.energyChoice) {
            chosenEnergy = _selectedSpotlightEnergy || 'Fire';
          }
          const created = window.applySpellBuffToCharacter(_selectedSpotlightV2Entry, cl, {
            chosenEnergy,
            targetWeapon: chosenWeapon,
            silentToast: true
          });
          if (created) {
            if (rounds !== null && !isNaN(rounds)) created.rounds = rounds;
            if (durationText) {
              created.durationText = durationText;
              created.duration = durationText;
            }
            if (notes) created.notes = notes;
            saveStateToStorage(true);
            renderAll();
            closeAddBuffModal();
            if (typeof showDiceTopToast === 'function') {
              showDiceTopToast({
                icon: '✨',
                title: `${created.name} Activated`,
                breakdown: `${created.summary || notes || 'Active Buff'} • CL ${cl} • ${created.durationText || created.duration || 'Active'}`,
                total: 'Buff Active'
              });
            }
            return;
          }
        }
      }

      // Collect Canonical V2 `modifiers` from `_buffModalV2Modifiers`
      v2Modifiers = (_buffModalV2Modifiers || [])
        .filter(m => m && m.target && (m.formula !== '' || m.value))
        .map(m => {
          const fStr = m.formula !== undefined && m.formula !== null && m.formula !== '' ? String(m.formula).trim() : String(m.value || 0);
          const evaluatedVal = (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateFormula)
            ? (Number(RuleEngine.evaluateFormula(fStr, evalCtx)) || Number(fStr) || 0)
            : (Number(fStr) || 0);
          return {
            target: m.target,
            value: evaluatedVal,
            formula: fStr,
            type: String(m.type || (evaluatedVal < 0 ? 'penalty' : 'enhancement')).toLowerCase(),
            condition: m.condition || null
          };
        });

      // Collect Canonical V2 `ruleFlags` from toggles + structured defense inputs
      v2RuleFlags = Object.assign({}, _buffModalV2RuleFlags || {});
      const tempHpRaw = (document.getElementById('buff-v2-flag-temphp')?.value || '').trim();
      const concRaw = parseInt(document.getElementById('buff-v2-flag-concealment')?.value || '', 10);
      const srRaw = (document.getElementById('buff-v2-flag-sr')?.value || '').trim();
      const drRaw = (document.getElementById('buff-v2-flag-dr')?.value || '').trim();
      const eresRaw = (document.getElementById('buff-v2-flag-eres')?.value || '').trim();
      const negLvlRaw = parseInt(document.getElementById('buff-v2-flag-neglvl')?.value || '', 10);
      const actionRaw = (document.getElementById('buff-v2-flag-action')?.value || '').trim();

      let grantedTempHp = 0;
      if (tempHpRaw) {
        const rolled = (typeof RuleEngine !== 'undefined' && RuleEngine.rollOrEvaluateTempHp)
          ? RuleEngine.rollOrEvaluateTempHp(tempHpRaw, evalCtx)
          : { total: parseInt(tempHpRaw, 10) || 0 };
        const evalTempHp = rolled.total || 0;
        if (evalTempHp > 0) {
          grantedTempHp = evalTempHp;
          const existingMod = v2Modifiers.find(m => m.target === 'hp.temp');
          if (existingMod) {
            existingMod.value = evalTempHp;
            existingMod.formula = tempHpRaw;
          } else {
            v2Modifiers.push({ target: 'hp.temp', value: evalTempHp, formula: tempHpRaw, type: 'untyped', condition: null });
          }
          v2RuleFlags.tempHp = evalTempHp;
        }
      } else {
        const modTemp = v2Modifiers.find(m => m.target === 'hp.temp');
        if (modTemp) {
          const rolled = (typeof RuleEngine !== 'undefined' && RuleEngine.rollOrEvaluateTempHp)
            ? RuleEngine.rollOrEvaluateTempHp(modTemp.formula || modTemp.value, evalCtx)
            : { total: Number(modTemp.value) || 0 };
          if (rolled.total > 0) {
            modTemp.value = rolled.total;
            grantedTempHp = rolled.total;
            v2RuleFlags.tempHp = rolled.total;
          }
        }
      }
      if (!isNaN(concRaw) && concRaw > 0) v2RuleFlags.concealment = concRaw;
      if (srRaw) {
        const evalSr = (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateFormula)
          ? (Number(RuleEngine.evaluateFormula(srRaw, evalCtx)) || parseInt(srRaw, 10) || srRaw)
          : srRaw;
        v2RuleFlags.sr = evalSr;
      }
      if (drRaw) v2RuleFlags.dr = drRaw;
      if (eresRaw) v2RuleFlags.energyResistance = eresRaw;
      if (!isNaN(negLvlRaw) && negLvlRaw > 0) v2RuleFlags.negativeLevels = negLvlRaw;
      if (actionRaw) v2RuleFlags.actionRestriction = actionRaw;

      // Compute legacy summary fields for card badges & backward compatibility
      let acBonus = 0, attBonus = 0, dmgBonus = 0, strBonus = 0, dexBonus = 0, conBonus = 0, intBonus = 0, wisBonus = 0, chaBonus = 0;
      const summaryParts = [];
      v2Modifiers.forEach(m => {
        const v = Number(m.value) || 0;
        const t = String(m.target || '').toLowerCase();
        if (t.startsWith('ac')) acBonus += v;
        else if (t.startsWith('attack')) attBonus += v;
        else if (t.startsWith('damage')) dmgBonus += v;
        else if (t === 'ability.str') strBonus += v;
        else if (t === 'ability.dex') dexBonus += v;
        else if (t === 'ability.con') conBonus += v;
        else if (t === 'ability.int') intBonus += v;
        else if (t === 'ability.wis') wisBonus += v;
        else if (t === 'ability.cha') chaBonus += v;

        const lbl = (typeof RuleEngine !== 'undefined' && RuleEngine.formatBuffModifierLabel)
          ? RuleEngine.formatBuffModifierLabel(m, evalCtx)
          : `${v >= 0 ? '+' : ''}${v} ${m.target}`;
        if (lbl) summaryParts.push(lbl);
      });
      if (v2RuleFlags.dr) summaryParts.push(`DR ${v2RuleFlags.dr}`);
      if (v2RuleFlags.sr) summaryParts.push(`SR ${v2RuleFlags.sr}`);
      if (v2RuleFlags.concealment) summaryParts.push(`${v2RuleFlags.concealment}% Concealment`);
      if (v2RuleFlags.energyResistance) summaryParts.push(`Resist ${v2RuleFlags.energyResistance}`);
      if (v2RuleFlags.extraAttackFullAttack) summaryParts.push('Extra Attack');
      if (v2RuleFlags.freedomOfMovement) summaryParts.push('Freedom of Movement');
      if (v2RuleFlags.actionRestriction) summaryParts.push(v2RuleFlags.actionRestriction);

      v2Summary = summaryParts.join(', ') || notes;

      const newBuff = {
        id: (_selectedSpotlightV2Entry?.id && matchesSpotlightV2 && !_buffManualEdited)
          ? _selectedSpotlightV2Entry.id
          : ((isDebuff ? 'debuff_' : 'buff_') + Date.now()),
        schemaVersion: 2,
        name,
        source,
        bonusType,
        casterLevel: cl,
        cl,
        isDebuff,
        isCondition: source === 'Condition' || (_selectedSpotlightV2Entry?.type === 'Condition'),
        category: isDebuff ? 'Debuff' : (acBonus ? 'AC' : (strBonus || dexBonus || conBonus ? 'Stat' : 'Combat')),
        active: true,
        rounds,
        durationText: durationText || (rounds ? `${rounds} Rounds` : 'Permanent'),
        duration: durationText || (rounds ? `${rounds} Rounds` : 'Permanent'),
        acBonus,
        attBonus,
        dmgBonus,
        strBonus,
        dexBonus,
        conBonus,
        intBonus,
        wisBonus,
        chaBonus,
        notes,
        summary: v2Summary || notes,
        modifiers: v2Modifiers,
        ruleFlags: v2RuleFlags,
        children: (currentBuffModalChildren && currentBuffModalChildren.length > 0) ? JSON.parse(JSON.stringify(currentBuffModalChildren)) : []
      };

      if (!isNaN(negLvlRaw) && negLvlRaw > 0) {
        newBuff.negativeLevels = negLvlRaw;
      } else if (name.toLowerCase().includes('drain') || name.toLowerCase().includes('negative level')) {
        const lvlMatch = name.match(/(\d+)/);
        if (lvlMatch) newBuff.negativeLevels = parseInt(lvlMatch[1], 10);
      }

      if (!Array.isArray(character.buffs)) character.buffs = [];
      const existingBuffIdx = character.buffs.findIndex(b => b && (b.id === newBuff.id || (b.name || '').toLowerCase().trim() === name.toLowerCase()));
      const prevBuff = existingBuffIdx >= 0 ? character.buffs[existingBuffIdx] : null;
      const prevGrantedTemp = (prevBuff && prevBuff.active) ? getBuffGrantedTempHp(prevBuff) : 0;

      if (grantedTempHp > 0 && character.hp) {
        newBuff.grantedTempHp = grantedTempHp;
        newBuff._tempHpSynced = true;
        const curTempWithoutPrev = Math.max(0, (Number(character.hp.temp) || 0) - prevGrantedTemp);
        character.hp.temp = curTempWithoutPrev + grantedTempHp;
        markPlayerHpChanged();
      }

      if (prevBuff && prevBuff.pinnedToCombat) {
        newBuff.pinnedToCombat = true;
      }

      if (existingBuffIdx >= 0) {
        character.buffs[existingBuffIdx] = newBuff;
      } else {
        character.buffs.push(newBuff);
      }

      // Optional Custom DB Synchronization (Canonical V2 schema — only if user checked the box and it's not already a core SRD entry)
      let addedToDb = false;
      const saveToDb = document.getElementById('buff-save-to-master-db')?.checked !== false;
      const isAlreadyCoreSrd = matchesSpotlightV2 && _selectedSpotlightV2Entry?.source === 'SRD 3.5e';
      if (saveToDb && !isAlreadyCoreSrd && typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const cleanName = name.trim();
        const existingIdx = masterDb.findIndex(m => (m.name || '').toLowerCase().trim() === cleanName.toLowerCase());

        const v2EntryData = {
          id: newBuff.id,
          schemaVersion: 2,
          name: cleanName,
          type: isDebuff ? (source === 'Condition' ? 'Condition' : 'Buff') : (source.toLowerCase().includes('spell') ? 'Spell' : 'Buff'),
          category: isDebuff ? 'Combat Condition' : 'Spell / Combat Buff',
          slot: 'None',
          source: source || (isDebuff ? 'D&D 3.5e Condition' : 'D&D 3.5e Buff'),
          benefit: notes || (isDebuff ? `${cleanName} debuff effect` : `${cleanName} buff effect`),
          shortDescription: notes || '',
          duration: newBuff.durationText,
          modifiers: JSON.parse(JSON.stringify(v2Modifiers)),
          damageParts: [],
          modes: [],
          ruleFlags: JSON.parse(JSON.stringify(v2RuleFlags)),
          tags: isDebuff ? ['debuff', 'condition'] : ['buff', 'temporary']
        };

        if (Array.isArray(newBuff.children) && newBuff.children.length > 0) {
          v2EntryData.children = JSON.parse(JSON.stringify(newBuff.children));
        }

        if (existingIdx >= 0) {
          masterDb[existingIdx] = Object.assign({}, masterDb[existingIdx], v2EntryData);
        } else {
          masterDb.push(v2EntryData);
        }
        character.customDb = masterDb;
        addedToDb = true;

        if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
          RuleMaster.renderTable();
        }
      }

      if (typeof RuleEngine !== 'undefined' && RuleEngine.recalculateCharacter) {
        RuleEngine.recalculateCharacter(character, typeof masterDb !== 'undefined' ? masterDb : []);
      }

      closeAddBuffModal();
      saveStateToStorage(true);
      renderAll();

      if (typeof showDiceTopToast === 'function') {
        const dbText = addedToDb ? ' • Saved to Custom DB' : '';
        showDiceTopToast({
          icon: isDebuff ? '🩸' : '✨',
          title: `${name} (${isDebuff ? 'Debuff' : 'Buff'} Active)`,
          breakdown: `${newBuff.summary || newBuff.durationText}${dbText}`,
          total: isDebuff ? 'Debuff On' : 'Buff On'
        });
      }
    }

    let _srdInitTriggeredForInventory = false;
    // 🎒 INVENTORY, 14 BODY SLOTS & GEAR POOL (Madde 6 & 8)
    function renderInventory() {
      if (!character) return;
      if (!character.bodySlots) character.bodySlots = {};
      if (!character.gearPool) character.gearPool = [];

      if (!_srdInitTriggeredForInventory && window.SrdCompendium && typeof window.SrdCompendium.init === 'function') {
        if (typeof window.SrdCompendium.isReady !== 'function' || !window.SrdCompendium.isReady()) {
          _srdInitTriggeredForInventory = true;
          window.SrdCompendium.init().then(() => {
            renderInventory();
          }).catch(() => {});
        }
      }

      // 1. Calculate Carrying Capacity & Weights (via SheetView when available)
      const sheetInv = (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.getSheet === 'function' && window.CharStore.getSheet()?.inventory)
        || (typeof RuleEngine !== 'undefined' && typeof RuleEngine.deriveInventoryView === 'function' ? RuleEngine.deriveInventoryView(character) : null);
      // Encumbrance is derived only by the engine (RuleEngine.computeEncumbrance), the same source the AC load Max Dex uses.
      const encView = sheetInv?.encumbranceView || RuleEngine.computeEncumbrance(character);
      const caps = encView.capacities;
      const totalWeight = encView.totalWeight;
      const load = encView.loadStatus;

      const wDisplay = document.getElementById('inv-total-weight');
      if (wDisplay) wDisplay.textContent = totalWeight + ' lbs';
      const lLimit = document.getElementById('inv-light-limit');
      if (lLimit) lLimit.textContent = caps.light + ' lbs';
      const hLimit = document.getElementById('inv-heavy-limit');
      if (hLimit) hLimit.textContent = `${caps.medium} / ${caps.heavy} lbs`;
      const liftLimit = document.getElementById('inv-lift-limit');
      if (liftLimit) liftLimit.textContent = `${caps.ground} / ${caps.drag} lbs`;

      const bar = document.getElementById('inv-weight-bar');
      if (bar) {
        const pct = encView.barPct;
        bar.style.width = pct + '%';
        if (totalWeight <= caps.light) bar.className = 'bg-emerald-500 h-full rounded-full transition-all duration-300';
        else if (totalWeight <= caps.medium) bar.className = 'bg-amber-500 h-full rounded-full transition-all duration-300';
        else bar.className = 'bg-rose-500 h-full rounded-full transition-all duration-300';
      }

      const statusBadge = document.getElementById('carrying-status-badge');
      if (statusBadge) {
        statusBadge.textContent = load.status;
        if (load.color === 'emerald') statusBadge.className = 'badge bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold px-3 py-1 text-xs';
        else if (load.color === 'amber') statusBadge.className = 'badge bg-amber-950 text-amber-300 border border-amber-600 font-bold px-3 py-1 text-xs';
        else if (load.color === 'orange') statusBadge.className = 'badge bg-orange-950 text-orange-300 border border-orange-600 font-bold px-3 py-1 text-xs';
        else statusBadge.className = 'badge bg-rose-950 text-rose-300 border border-rose-600 font-bold px-3 py-1 text-xs';
      }

      // 2. Render 14 Body Slots with Middle Vertical Alignment (Madde 6)
      const slotsTbody = document.getElementById('body-slots-tbody');
      if (slotsTbody) {
        slotsTbody.innerHTML = '';
        BODY_SLOT_DEFS.forEach(def => {
          const rawSlot = character.bodySlots[def.key] || { name: '-', active: false, weight: 0, cost: 0, desc: '' };
          const slotData = Object.assign({}, rawSlot);
          const isOccupied = slotData.name && slotData.name !== '-';

          let conflictNotice = '';
          if (def.key === 'offHand' && character.twoHandedConflict) {
            conflictNotice = `<div class="text-[10px] text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
              <span>⚠️</span> <span>Two-handed weapon (${UI.escapeHtml(character.twoHandedConflict.mainHand)}) occupies both hands (Suppressed)</span>
            </div>`;
          }

          const tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-900/50 transition border-b border-slate-800/80';
          tr.innerHTML = `
            <td class="py-2.5 px-3 text-center align-middle">
              <input type="checkbox" ${slotData.active ? 'checked' : ''} ${!isOccupied ? 'disabled' : ''} data-change-action="inventory:toggle-slot-active" data-slot-key="${def.key}" class="w-4 h-4 rounded text-sky-500 border-slate-700 focus:ring-0">
            </td>
            <td class="py-2.5 px-3 text-center align-middle text-lg">${def.icon}</td>
            <td class="py-2.5 px-3 align-middle font-bold text-slate-300">
              <div>${UI.escapeHtml(def.name)}</div>
              ${conflictNotice}
            </td>
            <td class="py-2.5 px-3 align-middle font-bold ${isOccupied ? 'text-white' : 'text-slate-500 italic'}">
              ${(() => {
                if (!isOccupied) return '(Empty Slot)';
                const pw = getEquipmentProficiencyWarning(slotData);
                return `<div class="flex items-center gap-1.5"><span>${UI.escapeHtml(slotData.name)}</span>${pw ? `<span class="text-rose-400 text-xs shrink-0 cursor-help" title="${UI.escapeAttr(pw.tooltip)}">⚠️</span>` : ''}</div>`;
              })()}
            </td>
            <td class="py-2.5 px-3 align-middle text-slate-300 text-xs">
              ${isOccupied ? renderGearItemStatsBadgesHtml(slotData, { compact: true }) : ''}
              <div>${UI.escapeHtml(slotData.desc || '-')}</div>
            </td>
            <td class="py-2.5 px-3 text-center align-middle font-mono text-slate-400">${isOccupied ? slotData.weight + ' lb' : '-'}</td>
            <td class="py-2.5 px-3 text-center align-middle font-mono text-amber-400">${isOccupied ? slotData.cost + ' GP' : '-'}</td>
            <td class="py-2.5 px-3 text-center align-middle">
              <div class="inline-flex items-center justify-center gap-1.5">
                ${isOccupied && isForgeEditableItem(slotData) ? `<button data-action="inventory:forge-slot-item" data-slot-key="${def.key}" title="Customize in Item Forge" class="w-7 h-7 bg-amber-950/80 hover:bg-amber-800 text-amber-300 hover:text-white border border-amber-600/60 text-xs rounded-lg inline-flex items-center justify-center transition cursor-pointer shrink-0">⚒️</button>` : ''}
                ${isOccupied ? `<button data-action="inventory:unequip-slot" data-slot-key="${def.key}" class="w-20 h-7 bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800 text-[11px] font-bold px-2.5 rounded-lg inline-flex items-center justify-center transition cursor-pointer">Unequip</button>` : `<button data-action="inventory:open-slot-equip" data-slot-key="${def.key}" class="w-20 h-7 bg-sky-950/70 hover:bg-sky-900 text-sky-300 hover:text-white border border-sky-700/60 text-[11px] font-bold px-2.5 rounded-lg inline-flex items-center justify-center transition cursor-pointer">+ Equip</button>`}
              </div>
            </td>
          `;
          slotsTbody.appendChild(tr);
        });
      }

      // 2b. Render Silhouette View (Paper-Doll Düzeni)
      renderBodySlotsSilhouette();
      // Apply active view preference (list vs silhouette)
      setBodySlotsView(currentBodySlotsView, false);

      // 3. Render Gear Pool
      renderGearPoolTable();
    }

    // ====================================================
    // 👤 VÜCUT YUVALARI: SİLÜET / PAPER-DOLL ENGINE
    // ====================================================
    let currentBodySlotsView = localStorage.getItem('dnd35_body_slots_view') || 'silhouette';
    let selectedSilhouetteModel = localStorage.getItem('dnd35_silhouette_model') || 'auto';
    let _currentEquipSlotKey = null;

    function setBodySlotsView(mode, rerender = true) {
      currentBodySlotsView = mode || 'silhouette';
      try { localStorage.setItem('dnd35_body_slots_view', currentBodySlotsView); } catch(e){ reportError('char_inventory:setBodySlotsView', e); }

      const listView = document.getElementById('body-slots-list-view');
      const silView = document.getElementById('body-slots-silhouette-view');
      const compView = document.getElementById('body-slots-companion-view');
      const btnList = document.getElementById('btn-body-view-list');
      const btnSil = document.getElementById('btn-body-view-silhouette');
      const btnComp = document.getElementById('btn-body-view-companion');

      const activeBtnClass = 'w-full sm:w-28 md:w-32 h-8 px-2.5 rounded-md transition inline-flex items-center justify-center gap-1.5 bg-sky-600 text-white shadow font-bold cursor-pointer whitespace-nowrap';
      const inactiveBtnClass = 'w-full sm:w-28 md:w-32 h-8 px-2.5 rounded-md transition inline-flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer whitespace-nowrap';

      if (currentBodySlotsView === 'companion') {
        if (listView) listView.classList.add('hidden');
        if (silView) silView.classList.add('hidden');
        if (compView) compView.classList.remove('hidden');
        if (btnComp) btnComp.className = activeBtnClass;
        if (btnSil) btnSil.className = inactiveBtnClass;
        if (btnList) btnList.className = inactiveBtnClass;
        renderCompanionGearView();
      } else if (currentBodySlotsView === 'silhouette') {
        if (compView) compView.classList.add('hidden');
        if (listView) listView.classList.add('hidden');
        if (silView) silView.classList.remove('hidden');
        if (btnSil) btnSil.className = activeBtnClass;
        if (btnList) btnList.className = inactiveBtnClass;
        if (btnComp) btnComp.className = inactiveBtnClass;
        if (rerender) {
          renderBodySlotsSilhouette();
        } else {
          setTimeout(updateSilhouetteConnectorLines, 50);
        }
      } else {
        if (compView) compView.classList.add('hidden');
        if (silView) silView.classList.add('hidden');
        if (listView) listView.classList.remove('hidden');
        if (btnList) btnList.className = activeBtnClass;
        if (btnSil) btnSil.className = inactiveBtnClass;
        if (btnComp) btnComp.className = inactiveBtnClass;
      }
    }

    function highlightSlotNode(slotKey, isHighlighted) {
      const nodeEl = document.getElementById(`sil-node-${slotKey}`);
      const haloEl = document.getElementById(`sil-halo-${slotKey}`);
      const lineEl = document.getElementById(`sil-line-${slotKey}`);
      const pinEl = document.getElementById(`sil-pin-${slotKey}`);

      const isOccupied = character?.bodySlots?.[slotKey]?.name && character?.bodySlots?.[slotKey]?.name !== '-';
      const isActive = character?.bodySlots?.[slotKey]?.active;
      const baseColor = isActive ? '#38bdf8' : (isOccupied ? '#f59e0b' : '#64748b');

      if (isHighlighted) {
        if (nodeEl) {
          nodeEl.setAttribute('r', '7.5');
          nodeEl.setAttribute('fill', '#f59e0b');
          nodeEl.setAttribute('stroke', '#ffffff');
          nodeEl.setAttribute('stroke-width', '2.5');
        }
        if (haloEl) {
          haloEl.setAttribute('r', '14');
          haloEl.setAttribute('fill', '#f59e0b');
          haloEl.setAttribute('fill-opacity', '0.4');
          haloEl.setAttribute('stroke', '#fbbf24');
          haloEl.setAttribute('stroke-opacity', '0.9');
        }
        if (lineEl) {
          lineEl.setAttribute('stroke', '#f59e0b');
          lineEl.setAttribute('stroke-width', '3');
          lineEl.setAttribute('stroke-opacity', '1');
        }
        if (pinEl) {
          pinEl.setAttribute('r', '5.5');
          pinEl.setAttribute('fill', '#f59e0b');
          pinEl.setAttribute('fill-opacity', '1');
        }
      } else {
        if (nodeEl) {
          nodeEl.setAttribute('r', '5');
          nodeEl.setAttribute('fill', baseColor);
          nodeEl.setAttribute('stroke', '#0b1329');
          nodeEl.setAttribute('stroke-width', '1.8');
        }
        if (haloEl) {
          haloEl.setAttribute('r', '9');
          haloEl.setAttribute('fill', baseColor);
          haloEl.setAttribute('fill-opacity', '0.18');
          haloEl.setAttribute('stroke', baseColor);
          haloEl.setAttribute('stroke-opacity', '0.35');
        }
        if (lineEl) {
          lineEl.setAttribute('stroke', baseColor);
          lineEl.setAttribute('stroke-width', isActive ? '1.8' : '1.2');
          lineEl.setAttribute('stroke-opacity', isActive ? '0.6' : (isOccupied ? '0.45' : '0.22'));
        }
        if (pinEl) {
          pinEl.setAttribute('r', '3.5');
          pinEl.setAttribute('fill', baseColor);
          pinEl.setAttribute('fill-opacity', isActive ? '0.6' : (isOccupied ? '0.45' : '0.22'));
        }
      }
    }

    // SILHOUETTE IMAGE TRANSFORM (ZOOM, PAN, CENTER) STATE & FUNCTIONS
    let isPanningSilhouette = false;
    let panStartX = 0;
    let panStartY = 0;
    let panStartOffsetX = 0;
    let panStartOffsetY = 0;

    function getSilhouetteTransform(charObj) {
      const saved = charObj?.customSilhouetteTransform || null;
      let localSaved = null;
      try {
        const raw = localStorage.getItem('dnd35_silhouette_transform');
        if (raw) localSaved = JSON.parse(raw);
      } catch(e) { reportError('char_inventory:getSilhouetteTransform', e); }

      const conf = saved || localSaved || {};
      const scale = (typeof conf.scale === 'number' && !isNaN(conf.scale)) ? Math.max(0.5, Math.min(2.5, conf.scale)) : 1.0;
      const offsetX = (typeof conf.offsetX === 'number' && !isNaN(conf.offsetX)) ? Math.max(-300, Math.min(300, conf.offsetX)) : 0;
      const offsetY = (typeof conf.offsetY === 'number' && !isNaN(conf.offsetY)) ? Math.max(-350, Math.min(350, conf.offsetY)) : 0;
      return { scale, offsetX, offsetY };
    }

    function saveSilhouetteTransform(transform, charObj) {
      if (!charObj && character) charObj = character;
      if (charObj) {
        charObj.customSilhouetteTransform = {
          scale: Number(transform.scale.toFixed(2)),
          offsetX: Math.round(transform.offsetX),
          offsetY: Math.round(transform.offsetY)
        };
      }
      try {
        localStorage.setItem('dnd35_silhouette_transform', JSON.stringify({
          scale: Number(transform.scale.toFixed(2)),
          offsetX: Math.round(transform.offsetX),
          offsetY: Math.round(transform.offsetY)
        }));
      } catch(e) { reportError('char_inventory:saveSilhouetteTransform', e); }
    }

    function computeSilhouetteImageRect(transform) {
      const scale = transform.scale || 1.0;
      const offsetX = transform.offsetX || 0;
      const offsetY = transform.offsetY || 0;
      const imgW = Math.round(460 * scale);
      const imgH = Math.round(520 * scale);
      const imgX = Math.round((460 - imgW) / 2 + offsetX);
      const imgY = Math.round((520 - imgH) / 2 + offsetY);
      return { imgX, imgY, imgW, imgH };
    }

    function applySilhouetteTransformDOM(transform) {
      if (!transform) transform = getSilhouetteTransform(character);
      const rect = computeSilhouetteImageRect(transform);
      const imgEl = document.getElementById('sil-bg-image');
      if (imgEl) {
        imgEl.setAttribute('x', rect.imgX);
        imgEl.setAttribute('y', rect.imgY);
        imgEl.setAttribute('width', rect.imgW);
        imgEl.setAttribute('height', rect.imgH);
      }

      const zoomSlider = document.getElementById('sil-zoom-slider');
      const zoomVal = document.getElementById('sil-zoom-val');
      const badge = document.getElementById('sil-transform-badge');
      const pct = Math.round(transform.scale * 100);

      if (zoomSlider) zoomSlider.value = pct;
      if (zoomVal) zoomVal.textContent = `%${pct}`;
      if (badge) {
        badge.textContent = `Zoom: %${pct} | X: ${Math.round(transform.offsetX)}, Y: ${Math.round(transform.offsetY)}`;
      }

      const menuBtn = document.getElementById('sil-menu-btn');
      const isCustomized = (transform.scale !== 1.0 || transform.offsetX !== 0 || transform.offsetY !== 0);
      if (menuBtn) {
        if (isCustomized) {
          menuBtn.className = "ui-btn-sm h-7 px-2.5 rounded-lg bg-sky-900/90 hover:bg-sky-800 border border-sky-400 text-sky-200 hover:text-white text-xs font-bold transition inline-flex items-center gap-1.5 shadow-md shadow-sky-950/40 cursor-pointer";
        } else {
          menuBtn.className = "ui-btn-sm h-7 px-2.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-600/60 hover:border-sky-400 text-sky-200 hover:text-white text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer";
        }
      }
    }

    let isSilhouetteTransformMode = false;

    function isSilhouetteTransformActive() {
      const panel = document.getElementById('sil-img-transform-panel');
      if (panel) return !panel.classList.contains('hidden');
      return isSilhouetteTransformMode;
    }

    function updateSilhouetteSvgCursor() {
      const svgEl = document.getElementById('sil-main-svg');
      if (!svgEl) return;
      if (isSilhouetteTransformActive()) {
        svgEl.classList.add('cursor-grab');
      } else {
        svgEl.classList.remove('cursor-grab', 'cursor-grabbing');
      }
    }

    function toggleSilhouetteTransformPanel(forceState) {
      const panel = document.getElementById('sil-img-transform-panel');
      if (!panel) return;
      const isCurrentlyHidden = panel.classList.contains('hidden');
      const targetState = (typeof forceState === 'boolean') ? forceState : isCurrentlyHidden;
      isSilhouetteTransformMode = targetState;
      if (targetState) {
        if (isSilhouettePointEditMode) {
          isSilhouettePointEditMode = false;
        }
        panel.classList.remove('hidden');
        applySilhouetteTransformDOM();
      } else {
        panel.classList.add('hidden');
      }
      updateSilhouetteSvgCursor();
    }

    function adjustSilhouetteZoom(delta) {
      const transform = getSilhouetteTransform(character);
      let newScale = transform.scale + delta;
      newScale = Math.max(0.5, Math.min(2.5, Math.round(newScale * 20) / 20));
      transform.scale = newScale;
      saveSilhouetteTransform(transform, character);
      applySilhouetteTransformDOM(transform);
    }

    function onSilhouetteZoomSlider(val) {
      const transform = getSilhouetteTransform(character);
      const newScale = Math.max(0.5, Math.min(2.5, Number(val) / 100));
      transform.scale = newScale;
      saveSilhouetteTransform(transform, character);
      applySilhouetteTransformDOM(transform);
    }

    function adjustSilhouettePan(dx, dy) {
      const transform = getSilhouetteTransform(character);
      transform.offsetX = Math.max(-300, Math.min(300, transform.offsetX + dx));
      transform.offsetY = Math.max(-350, Math.min(350, transform.offsetY + dy));
      saveSilhouetteTransform(transform, character);
      applySilhouetteTransformDOM(transform);
    }

    function setSilhouetteTransformPreset(preset) {
      const transform = getSilhouetteTransform(character);
      if (preset === 'top') {
        transform.offsetX = 0;
        transform.offsetY = 60;
      } else if (preset === 'center') {
        transform.offsetX = 0;
        transform.offsetY = 0;
      } else if (preset === 'bottom') {
        transform.offsetX = 0;
        transform.offsetY = -60;
      }
      saveSilhouetteTransform(transform, character);
      applySilhouetteTransformDOM(transform);
    }

    function resetSilhouetteTransform() {
      const transform = { scale: 1.0, offsetX: 0, offsetY: 0 };
      saveSilhouetteTransform(transform, character);
      applySilhouetteTransformDOM(transform);
    }

    function handleSilhouetteWheel(evt) {
      // Zoom with mouse wheel ONLY when 'Görseli Ayarla' panel is open/active!
      if (!isSilhouetteTransformActive()) return;
      evt.preventDefault();
      const delta = evt.deltaY < 0 ? 0.05 : -0.05;
      adjustSilhouetteZoom(delta);
    }

    function startSilhouettePan(evt) {
      // Pan with drag ONLY when 'Görseli Ayarla' panel is open/active!
      if (!isSilhouetteTransformActive()) return;
      // If clicking on an anchor node handle, let node dragging handle it
      if (evt.target && evt.target.closest && evt.target.closest('.slot-anchor-node')) return;
      if (evt.button !== undefined && evt.button !== 0) return; // left click only

      isPanningSilhouette = true;
      const clientX = evt.clientX !== undefined ? evt.clientX : (evt.touches && evt.touches[0] ? evt.touches[0].clientX : 0);
      const clientY = evt.clientY !== undefined ? evt.clientY : (evt.touches && evt.touches[0] ? evt.touches[0].clientY : 0);
      panStartX = clientX;
      panStartY = clientY;

      const current = getSilhouetteTransform(character);
      panStartOffsetX = current.offsetX;
      panStartOffsetY = current.offsetY;

      const svgEl = document.getElementById('sil-main-svg');
      if (svgEl) {
        svgEl.classList.add('cursor-grabbing');
        svgEl.classList.remove('cursor-grab');
      }
    }

    function handleSilhouettePanMove(evt) {
      if (!isPanningSilhouette) return;
      if (evt.cancelable) evt.preventDefault();

      const clientX = evt.clientX !== undefined ? evt.clientX : (evt.touches && evt.touches[0] ? evt.touches[0].clientX : 0);
      const clientY = evt.clientY !== undefined ? evt.clientY : (evt.touches && evt.touches[0] ? evt.touches[0].clientY : 0);

      const svgEl = document.getElementById('sil-main-svg');
      let ratio = 1;
      if (svgEl) {
        const rect = svgEl.getBoundingClientRect();
        if (rect.width > 0) ratio = 460 / rect.width;
      }

      const dx = (clientX - panStartX) * ratio;
      const dy = (clientY - panStartY) * ratio;

      const transform = getSilhouetteTransform(character);
      transform.offsetX = Math.max(-300, Math.min(300, Math.round(panStartOffsetX + dx)));
      transform.offsetY = Math.max(-350, Math.min(350, Math.round(panStartOffsetY + dy)));

      applySilhouetteTransformDOM(transform);
    }

    function stopSilhouettePan() {
      if (!isPanningSilhouette) return;
      isPanningSilhouette = false;
      const svgEl = document.getElementById('sil-main-svg');
      if (svgEl) {
        svgEl.classList.remove('cursor-grabbing');
        if (isSilhouetteTransformActive()) {
          svgEl.classList.add('cursor-grab');
        } else {
          svgEl.classList.remove('cursor-grab');
        }
      }
      const transform = getSilhouetteTransform(character);
      saveSilhouetteTransform(transform, character);
    }

    let isSilhouettePointEditMode = false;
    let activeDraggedSlot = null;
    let activeDraggedEnd = null; // 'body' | 'card' | 'mid'
    let currentSilhouetteNodes = null;

    const DEFAULT_BODY_SLOT_NODES = {
      // SOL (6 Yuva):
      head: { cx: 224, cy: 48, label: 'Head / Helm' },
      eyes: { cx: 226, cy: 82, label: 'Eyes / Goggles' },
      shoulders: { cx: 175, cy: 145, label: 'Shoulders / Cloak' },
      torso: { cx: 210, cy: 205, label: 'Torso / Vest' },
      ring1: { cx: 126, cy: 265, label: 'Left Ring' },
      belt: { cx: 180, cy: 285, label: 'Belt / Waist' },
      // SAĞ (6 Yuva):
      neck: { cx: 245, cy: 115, label: 'Neck / Amulet' },
      armor: { cx: 255, cy: 170, label: 'Body Armor' },
      bracers: { cx: 328, cy: 225, label: 'Arms / Bracers' },
      gloves: { cx: 338, cy: 270, label: 'Hands / Gloves' },
      ring2: { cx: 345, cy: 300, label: 'Right Ring' },
      boots: { cx: 285, cy: 475, label: 'Feet / Boots' }
    };

    function getEffectiveBodySlotNodes(charObj) {
      const saved = charObj?.customSilhouetteCoords || null;
      let localSaved = null;
      try {
        const raw = localStorage.getItem('dnd35_silhouette_custom_coords');
        if (raw) localSaved = JSON.parse(raw);
      } catch(e) { reportError('char_inventory:getEffectiveBodySlotNodes', e); }

      const custom = saved || localSaved || {};
      const result = {};
      for (const k of Object.keys(DEFAULT_BODY_SLOT_NODES)) {
        result[k] = {
          ...DEFAULT_BODY_SLOT_NODES[k],
          cx: (custom[k]?.cx !== undefined && !isNaN(custom[k].cx)) ? Number(custom[k].cx) : DEFAULT_BODY_SLOT_NODES[k].cx,
          cy: (custom[k]?.cy !== undefined && !isNaN(custom[k].cy)) ? Number(custom[k].cy) : DEFAULT_BODY_SLOT_NODES[k].cy
        };
        if (custom[k]?.customCardX !== undefined && !isNaN(custom[k].customCardX)) {
          result[k].customCardX = Number(custom[k].customCardX);
        }
        if (custom[k]?.customCardY !== undefined && !isNaN(custom[k].customCardY)) {
          result[k].customCardY = Number(custom[k].customCardY);
        }
        if (custom[k]?.customMidX !== undefined && !isNaN(custom[k].customMidX)) {
          result[k].customMidX = Number(custom[k].customMidX);
        }
        if (custom[k]?.customMidY !== undefined && !isNaN(custom[k].customMidY)) {
          result[k].customMidY = Number(custom[k].customMidY);
        }
      }
      return result;
    }

    let _heroSilhouetteScriptLoading = false;
    function ensureHeroSilhouetteLoaded() {
      if (window.HERO_SILHOUETTE_DATA_URI || _heroSilhouetteScriptLoading) return;
      _heroSilhouetteScriptLoading = true;
      const s = document.createElement('script');
      s.src = 'hero_silhouette_data.js?v=e99e24f6ec';
      s.async = true;
      s.onload = () => {
        if (window.HERO_SILHOUETTE_DATA_URI) {
          const src = getSilhouetteImageSrc(character);
          const imgEl = document.getElementById('sil-bg-image');
          if (imgEl && src) {
            imgEl.setAttribute('href', src);
            imgEl.setAttribute('xlink:href', src);
          }
        }
      };
      s.onerror = () => { _heroSilhouetteScriptLoading = false; };
      document.head.appendChild(s);
    }

    function getSilhouetteImageSrc(charObj) {
      if (charObj && charObj.customSilhouetteImg) {
        return charObj.customSilhouetteImg;
      }
      try {
        const localImg = localStorage.getItem('dnd35_silhouette_custom_img');
        if (localImg) return localImg;
      } catch(e) { reportError('char_inventory:getSilhouetteImageSrc', e); }
      if (!window.HERO_SILHOUETTE_DATA_URI) {
        ensureHeroSilhouetteLoaded();
      }
      return window.HERO_SILHOUETTE_DATA_URI || '';
    }

    function triggerSilhouetteUpload() {
      const input = document.getElementById('sil-custom-file-input');
      if (input) input.click();
    }

    function handleSilhouetteFileUpload(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataUrl = e.target.result;
        if (!character) character = {};
        character.customSilhouetteImg = dataUrl;
        try { localStorage.setItem('dnd35_silhouette_custom_img', dataUrl); } catch(err){ reportError('char_inventory:reader.onload', err); }
        renderBodySlotsSilhouette();
        showToast('🖼️ Custom silhouette image uploaded successfully!', 'success', { wrap: true });
      };
      reader.readAsDataURL(file);
    }

    async function promptSilhouetteUrl() {
      const current = (character && character.customSilhouetteImg) || '';
      const url = await DnDUI.prompt('Enter an image URL for the character silhouette:\n(e.g., https://...png or .jpg)', current, { inputType: 'url' });
      if (url === null) return;
      const cleanUrl = url.trim();
      if (!cleanUrl) {
        resetSilhouetteImage();
        return;
      }
      if (!character) character = {};
      character.customSilhouetteImg = cleanUrl;
      try { localStorage.setItem('dnd35_silhouette_custom_img', cleanUrl); } catch(err){ reportError('char_inventory:promptSilhouetteUrl', err); }
      renderBodySlotsSilhouette();
      showToast('🖼️ Custom silhouette URL applied!', 'success', { wrap: true });
    }

    function toggleSilhouetteMenu(evt) {
      if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      }
      const menu = document.getElementById('sil-dropdown-menu');
      if (!menu) return;
      menu.classList.toggle('hidden');
    }

    function closeSilhouetteMenu() {
      const menu = document.getElementById('sil-dropdown-menu');
      if (menu) menu.classList.add('hidden');
    }

    document.addEventListener('click', (e) => {
      const container = document.getElementById('sil-menu-container');
      if (container && !container.contains(e.target)) {
        closeSilhouetteMenu();
      }
    });

    function resetSilhouetteImage(suppressAlert) {
      if (character && character.customSilhouetteImg) {
        delete character.customSilhouetteImg;
      }
      try { localStorage.removeItem('dnd35_silhouette_custom_img'); } catch(err){ reportError('char_inventory:resetSilhouetteImage', err); }

      // Resim sıfırlanınca vücut noktaları ve konumu da sıfırlansın:
      if (character && character.customSilhouetteCoords) {
        delete character.customSilhouetteCoords;
      }
      try { localStorage.removeItem('dnd35_silhouette_custom_coords'); } catch(err){ reportError('char_inventory:resetSilhouetteImage', err); }
      currentSilhouetteNodes = JSON.parse(JSON.stringify(DEFAULT_BODY_SLOT_NODES));

      resetSilhouetteTransform();
      renderBodySlotsSilhouette();
      if (!suppressAlert) {
        showToast('↺ Reset to default D&D warrior silhouette and original body slot nodes.', 'success', { wrap: true });
      }
    }

    async function resetSilhouetteAll() {
      if ((await DnDUI.confirm('Reset the silhouette image, zoom/pan settings, and all 12 body slot nodes to factory defaults?', { tone: 'danger' }))) {
        resetSilhouetteImage();
      }
    }

    function toggleSilhouettePointEditMode(forceState) {
      if (typeof forceState === 'boolean') {
        isSilhouettePointEditMode = forceState;
      } else {
        isSilhouettePointEditMode = !isSilhouettePointEditMode;
      }
      if (isSilhouettePointEditMode) {
        toggleSilhouetteTransformPanel(false);
      }
      renderBodySlotsSilhouette();
      setTimeout(updateSilhouetteConnectorLines, 50);
    }

    function startDraggingSlotNode(evt, slotKey) {
      if (!isSilhouettePointEditMode) return;
      evt.preventDefault();
      evt.stopPropagation();
      activeDraggedSlot = slotKey;
      activeDraggedEnd = 'body';
      const groupEl = document.getElementById(`sil-node-group-${slotKey}`);
      if (groupEl) groupEl.classList.add('is-dragging');
    }

    function startDraggingCardNode(evt, slotKey) {
      if (!isSilhouettePointEditMode) return;
      evt.preventDefault();
      evt.stopPropagation();
      activeDraggedSlot = slotKey;
      activeDraggedEnd = 'card';
      const groupEl = document.getElementById(`sil-card-node-group-${slotKey}`);
      if (groupEl) groupEl.classList.add('is-dragging');
    }

    function handleSilhouetteSvgMouseMove(evt) {
      if (activeDraggedSlot) {
        if (activeDraggedEnd === 'card') {
          updateDraggedCardPosition(evt);
        } else {
          updateDraggedNodePosition(evt);
        }
      } else if (isPanningSilhouette) {
        handleSilhouettePanMove(evt);
      }
    }

    function handleSilhouetteSvgTouchMove(evt) {
      if (activeDraggedSlot) {
        if (activeDraggedEnd === 'card') {
          updateDraggedCardPosition(evt);
        } else {
          updateDraggedNodePosition(evt);
        }
      } else if (isPanningSilhouette) {
        handleSilhouettePanMove(evt);
      }
    }

    function updateDraggedNodePosition(evt) {
      if (!activeDraggedSlot || activeDraggedEnd !== 'body') return;
      evt.preventDefault();
      const svgEl = document.getElementById('sil-main-svg');
      if (!svgEl) return;

      const pt = svgEl.createSVGPoint();
      const clientX = evt.clientX !== undefined ? evt.clientX : (evt.touches && evt.touches[0] ? evt.touches[0].clientX : 0);
      const clientY = evt.clientY !== undefined ? evt.clientY : (evt.touches && evt.touches[0] ? evt.touches[0].clientY : 0);
      pt.x = clientX;
      pt.y = clientY;
      const cursorPt = pt.matrixTransform(svgEl.getScreenCTM().inverse());

      const clampedX = Math.max(10, Math.min(450, Math.round(cursorPt.x)));
      const clampedY = Math.max(10, Math.min(510, Math.round(cursorPt.y)));

      if (!currentSilhouetteNodes) currentSilhouetteNodes = getEffectiveBodySlotNodes(character);
      currentSilhouetteNodes[activeDraggedSlot].cx = clampedX;
      currentSilhouetteNodes[activeDraggedSlot].cy = clampedY;

      // Update DOM circles directly for 60fps drag
      const nodeEl = document.getElementById(`sil-node-${activeDraggedSlot}`);
      const haloEl = document.getElementById(`sil-halo-${activeDraggedSlot}`);
      const glintEl = document.getElementById(`sil-glint-${activeDraggedSlot}`);
      const touchAreaEl = document.getElementById(`sil-touch-${activeDraggedSlot}`);
      const labelEl = document.getElementById(`sil-coord-label-${activeDraggedSlot}`);
      if (nodeEl) { nodeEl.setAttribute('cx', clampedX); nodeEl.setAttribute('cy', clampedY); }
      if (haloEl) { haloEl.setAttribute('cx', clampedX); haloEl.setAttribute('cy', clampedY); }
      if (glintEl) { glintEl.setAttribute('cx', clampedX); glintEl.setAttribute('cy', clampedY); }
      if (touchAreaEl) { touchAreaEl.setAttribute('cx', clampedX); touchAreaEl.setAttribute('cy', clampedY); }
      if (labelEl) {
        labelEl.setAttribute('x', clampedX);
        labelEl.setAttribute('y', clampedY - 12);
        labelEl.textContent = `${DEFAULT_BODY_SLOT_NODES[activeDraggedSlot].label.split(' ')[0]} (${clampedX},${clampedY})`;
      }

      // Real-time update connector lines spanning from item card centers
      updateSilhouetteConnectorLines();
    }

    function updateDraggedCardPosition(evt) {
      if (!activeDraggedSlot || activeDraggedEnd !== 'card') return;
      evt.preventDefault();
      const gridEl = document.getElementById('sil-slots-main-grid');
      if (!gridEl) return;
      const wrapRect = gridEl.getBoundingClientRect();
      const clientX = evt.clientX !== undefined ? evt.clientX : (evt.touches && evt.touches[0] ? evt.touches[0].clientX : 0);
      const clientY = evt.clientY !== undefined ? evt.clientY : (evt.touches && evt.touches[0] ? evt.touches[0].clientY : 0);

      const clampedX = Math.max(0, Math.min(Math.round(wrapRect.width), Math.round(clientX - wrapRect.left)));
      const clampedY = Math.max(0, Math.min(Math.round(wrapRect.height), Math.round(clientY - wrapRect.top)));

      if (!currentSilhouetteNodes) currentSilhouetteNodes = getEffectiveBodySlotNodes(character);
      if (!currentSilhouetteNodes[activeDraggedSlot]) return;

      currentSilhouetteNodes[activeDraggedSlot].customCardX = clampedX;
      currentSilhouetteNodes[activeDraggedSlot].customCardY = clampedY;

      // Real-time update connector lines & card handles
      updateSilhouetteConnectorLines();
    }

    function stopDraggingSlotNode() {
      if (!activeDraggedSlot) return;
      if (activeDraggedEnd === 'card') {
        const groupEl = document.getElementById(`sil-card-node-group-${activeDraggedSlot}`);
        if (groupEl) groupEl.classList.remove('is-dragging');
      } else {
        const groupEl = document.getElementById(`sil-node-group-${activeDraggedSlot}`);
        if (groupEl) groupEl.classList.remove('is-dragging');
      }
      activeDraggedSlot = null;
      activeDraggedEnd = null;

      // Persist to character and localStorage
      if (!character) character = {};
      if (!character.customSilhouetteCoords) character.customSilhouetteCoords = {};
      for (const k of Object.keys(currentSilhouetteNodes)) {
        character.customSilhouetteCoords[k] = {
          cx: currentSilhouetteNodes[k].cx,
          cy: currentSilhouetteNodes[k].cy
        };
        if (currentSilhouetteNodes[k].customCardX !== undefined) {
          character.customSilhouetteCoords[k].customCardX = currentSilhouetteNodes[k].customCardX;
        }
        if (currentSilhouetteNodes[k].customCardY !== undefined) {
          character.customSilhouetteCoords[k].customCardY = currentSilhouetteNodes[k].customCardY;
        }
      }
      try {
        localStorage.setItem('dnd35_silhouette_custom_coords', JSON.stringify(character.customSilhouetteCoords));
      } catch(e) { reportError('char_inventory:stopDraggingSlotNode', e); }
    }

    async function copySilhouetteCoordinatesToClipboard() {
      const nodes = getEffectiveBodySlotNodes(character);
      const exportData = {};
      const gridEl = document.getElementById('sil-slots-main-grid');
      const wrapRect = gridEl ? gridEl.getBoundingClientRect() : null;

      const LEFT_KEYS = ['head', 'eyes', 'shoulders', 'torso', 'ring1', 'belt'];
      const RIGHT_KEYS = ['neck', 'armor', 'bracers', 'gloves', 'ring2', 'boots'];
      const ALL_KEYS = [...LEFT_KEYS, ...RIGHT_KEYS];

      ALL_KEYS.forEach(k => {
        const pt = nodes[k] || DEFAULT_BODY_SLOT_NODES[k];
        let cX = pt.customCardX;
        let cY = pt.customCardY;
        if ((cX === undefined || cY === undefined) && wrapRect) {
          const cardEl = document.querySelector(`[data-slot="${k}"]`);
          if (cardEl) {
            const cardRect = cardEl.getBoundingClientRect();
            const isLeft = LEFT_KEYS.includes(k);
            if (cX === undefined) cX = Math.round(isLeft ? (cardRect.right - wrapRect.left) : (cardRect.left - wrapRect.left));
            if (cY === undefined) cY = Math.round(cardRect.top + cardRect.height / 2 - wrapRect.top);
          }
        }

        exportData[k] = {
          label: pt.label,
          body: { cx: Math.round(pt.cx), cy: Math.round(pt.cy) },
          card: { x: Math.round(cX !== undefined ? cX : 0), y: Math.round(cY !== undefined ? cY : 0) }
        };
      });

      const jsonText = JSON.stringify(exportData, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jsonText).then(() => {
          showToast('📋 All 12 slot coordinates copied to clipboard!', 'success', { wrap: true });
        }).catch(async () => {
          await DnDUI.prompt('Copy coordinates (Ctrl+C):', jsonText, { readOnly: true, multiline: true, confirmLabel: 'Close' });
        });
      } else {
        await DnDUI.prompt('Copy coordinates (Ctrl+C):', jsonText, { readOnly: true, multiline: true, confirmLabel: 'Close' });
      }
    }

    function updateSilhouetteConnectorLines() {
      const gridEl = document.getElementById('sil-slots-main-grid');
      const overlaySvg = document.getElementById('sil-connectors-overlay-svg');
      const figContainer = document.getElementById('sil-figure-container');
      if (!gridEl || !overlaySvg || !figContainer) return;

      // Only draw on desktop side-by-side view (>= 1024px)
      if (window.innerWidth < 1024) {
        overlaySvg.innerHTML = '';
        return;
      }

      const wrapRect = gridEl.getBoundingClientRect();
      const figRect = figContainer.getBoundingClientRect();
      if (figRect.width <= 0 || figRect.height <= 0) return;

      const LEFT_KEYS = ['head', 'eyes', 'shoulders', 'torso', 'ring1', 'belt'];
      const RIGHT_KEYS = ['neck', 'armor', 'bracers', 'gloves', 'ring2', 'boots'];
      const ALL_KEYS = [...LEFT_KEYS, ...RIGHT_KEYS];

      const nodes = currentSilhouetteNodes || getEffectiveBodySlotNodes(character);

      let pathsMarkup = '';

      ALL_KEYS.forEach(slotKey => {
        const cardEl = document.querySelector(`[data-slot="${slotKey}"]`);
        if (!cardEl) return;
        const cardRect = cardEl.getBoundingClientRect();
        const isLeft = LEFT_KEYS.includes(slotKey);

        const pt = nodes[slotKey] || DEFAULT_BODY_SLOT_NODES[slotKey];

        // Start point: user custom card coords if calibrated, or inner edge vertical middle of the card
        const defaultCardX = isLeft ? (cardRect.right - wrapRect.left) : (cardRect.left - wrapRect.left);
        const defaultCardY = cardRect.top + cardRect.height / 2 - wrapRect.top;
        const cardX = (pt.customCardX !== undefined && !isNaN(pt.customCardX)) ? pt.customCardX : defaultCardX;
        const cardY = (pt.customCardY !== undefined && !isNaN(pt.customCardY)) ? pt.customCardY : defaultCardY;

        // End point: mapped anatomical spot on the silhouette figure
        const nodeX = (figRect.left - wrapRect.left) + (pt.cx / 460) * figRect.width;
        const nodeY = (figRect.top - wrapRect.top) + (pt.cy / 520) * figRect.height;

        const isOccupied = character?.bodySlots?.[slotKey]?.name && character?.bodySlots?.[slotKey]?.name !== '-';
        const isActive = character?.bodySlots?.[slotKey]?.active;
        const color = isActive ? '#38bdf8' : (isOccupied ? '#f59e0b' : '#64748b');
        const opacity = isActive ? '0.85' : (isOccupied ? '0.6' : '0.35');
        const width = isActive ? '2' : '1.3';
        const dash = isOccupied ? 'none' : '3,3';

        // Smooth direct Bezier Curve from Card End to Silhouette Point
        let pathD = '';
        if (isLeft) {
          const dx = Math.max(30, nodeX - cardX);
          const cp1x = cardX + dx * 0.45;
          const cp1y = cardY;
          const cp2x = nodeX - dx * 0.3;
          const cp2y = nodeY;
          pathD = `M ${cardX.toFixed(1)},${cardY.toFixed(1)} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${nodeX.toFixed(1)},${nodeY.toFixed(1)}`;
        } else {
          const dx = Math.max(30, cardX - nodeX);
          const cp1x = cardX - dx * 0.45;
          const cp1y = cardY;
          const cp2x = nodeX + dx * 0.3;
          const cp2y = nodeY;
          pathD = `M ${cardX.toFixed(1)},${cardY.toFixed(1)} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${nodeX.toFixed(1)},${nodeY.toFixed(1)}`;
        }

        let terminalMarkup = '';

        if (isSilhouettePointEditMode) {
          // Draggable cyan card pin with pulsing halo and coordinates
          terminalMarkup = `
            <g id="sil-card-node-group-${slotKey}" class="cursor-grab select-none pointer-events-auto"
               data-sil-drag-card="${slotKey}"
               data-action="inventory:noop-stop">
              <circle cx="${cardX.toFixed(1)}" cy="${cardY.toFixed(1)}" r="18" fill="transparent" class="cursor-grab"/>
              <circle cx="${cardX.toFixed(1)}" cy="${cardY.toFixed(1)}" r="12" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-dasharray="3,2" stroke-width="1.8" class="pointer-events-none animate-pulse"/>
              <circle id="sil-card-pin-${slotKey}" cx="${cardX.toFixed(1)}" cy="${cardY.toFixed(1)}" r="6.5" fill="#0ea5e9" stroke="#ffffff" stroke-width="2" class="cursor-grab"/>
              <circle cx="${cardX.toFixed(1)}" cy="${cardY.toFixed(1)}" r="2" fill="#ffffff" class="pointer-events-none"/>
              <text x="${cardX.toFixed(1)}" y="${(cardY - 11).toFixed(1)}" text-anchor="middle" font-size="9" font-family="sans-serif" font-weight="bold" fill="#38bdf8" stroke="#020617" stroke-width="2.5" paint-order="stroke" class="pointer-events-none select-none">${pt.label.split(' ')[0]} Kart (${Math.round(cardX)},${Math.round(cardY)})</text>
            </g>
          `;
        } else {
          // Normal mode terminal pin
          terminalMarkup = `
            <circle id="sil-pin-${slotKey}"
                    cx="${cardX.toFixed(1)}"
                    cy="${cardY.toFixed(1)}"
                    r="3.5"
                    fill="${color}"
                    fill-opacity="${opacity}"
                    stroke="#020617"
                    stroke-width="1.2"
                    class="transition-all duration-300"/>
            <circle cx="${cardX.toFixed(1)}"
                    cy="${cardY.toFixed(1)}"
                    r="1.5"
                    fill="#ffffff"
                    class="pointer-events-none"/>
          `;
        }

        pathsMarkup += `
          <g id="sil-overlay-connector-${slotKey}">
            <path id="sil-line-${slotKey}"
                  d="${pathD}"
                  fill="none"
                  stroke="${color}"
                  stroke-width="${width}"
                  stroke-opacity="${opacity}"
                  stroke-dasharray="${dash}"
                  class="transition-all duration-300 pointer-events-none"/>
            ${terminalMarkup}
          </g>
        `;
      });

      overlaySvg.innerHTML = pathsMarkup;
    }

    window.addEventListener('resize', updateSilhouetteConnectorLines);
    window.addEventListener('scroll', updateSilhouetteConnectorLines, { passive: true });

    window.addEventListener('mouseup', () => {
      if (activeDraggedSlot) stopDraggingSlotNode();
      if (isPanningSilhouette) stopSilhouettePan();
    });
    window.addEventListener('touchend', () => {
      if (activeDraggedSlot) stopDraggingSlotNode();
      if (isPanningSilhouette) stopSilhouettePan();
    });
    window.addEventListener('mousemove', (e) => {
      if (activeDraggedSlot) {
        if (activeDraggedEnd === 'card') updateDraggedCardPosition(e);
        else updateDraggedNodePosition(e);
      } else if (isPanningSilhouette) {
        handleSilhouettePanMove(e);
      }
    });
    window.addEventListener('touchmove', (e) => {
      if (activeDraggedSlot) {
        if (activeDraggedEnd === 'card') updateDraggedCardPosition(e);
        else updateDraggedNodePosition(e);
      } else if (isPanningSilhouette) {
        handleSilhouettePanMove(e);
      }
    }, { passive: false });

    function getSilhouetteSvg(modelKey, character) {
      currentSilhouetteNodes = getEffectiveBodySlotNodes(character);
      const nodes = currentSilhouetteNodes;
      const imgSrc = getSilhouetteImageSrc(character);
      const transform = getSilhouetteTransform(character);
      const { imgX, imgY, imgW, imgH } = computeSilhouetteImageRect(transform);

      let nodesMarkup = '';

      // Interactive nodes
      Object.keys(nodes).forEach(slotKey => {
        const pt = nodes[slotKey];
        const isOccupied = character?.bodySlots?.[slotKey]?.name && character?.bodySlots?.[slotKey]?.name !== '-';
        const isActive = character?.bodySlots?.[slotKey]?.active;
        const color = isActive ? '#38bdf8' : (isOccupied ? '#f59e0b' : '#64748b');

        if (isSilhouettePointEditMode) {
          // Edit Mode: draggable handles with visual coordinate label
          nodesMarkup += `
            <g id="sil-node-group-${slotKey}" class="slot-anchor-node is-editing cursor-grab select-none pointer-events-auto"
               data-sil-drag-node="${slotKey}">
              <!-- Draggable Touch Area -->
              <circle id="sil-touch-${slotKey}" cx="${pt.cx}" cy="${pt.cy}" r="20" fill="transparent" class="cursor-grab"/>
              <!-- Drag Halo -->
              <circle id="sil-halo-${slotKey}" cx="${pt.cx}" cy="${pt.cy}" r="13" fill="${color}" fill-opacity="0.3" stroke="#facc15" stroke-dasharray="3,2" stroke-width="1.8" class="pointer-events-none animate-pulse"/>
              <!-- Main Grab Node -->
              <circle id="sil-node-${slotKey}" cx="${pt.cx}" cy="${pt.cy}" r="7" fill="#facc15" stroke="#020617" stroke-width="2" class="cursor-grab"/>
              <!-- Center Specular Pin -->
              <circle id="sil-glint-${slotKey}" cx="${pt.cx}" cy="${pt.cy}" r="2" fill="#ffffff" class="pointer-events-none"/>
              <!-- Coordinate Badge -->
              <text id="sil-coord-label-${slotKey}" x="${pt.cx}" y="${pt.cy - 12}" text-anchor="middle" font-size="9" font-family="sans-serif" font-weight="bold" fill="#facc15" stroke="#020617" stroke-width="2.5" paint-order="stroke" class="pointer-events-none select-none">${pt.label.split(' ')[0]} (${pt.cx},${pt.cy})</text>
            </g>
          `;
        } else {
          // Normal Mode: clickable to equip
          nodesMarkup += `
            <g id="sil-node-group-${slotKey}" class="slot-anchor-node cursor-pointer group pointer-events-auto" data-action="inventory:open-slot-equip" data-slot-key="${slotKey}">
              <circle id="sil-halo-${slotKey}" cx="${pt.cx}" cy="${pt.cy}" r="9" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-opacity="0.4" stroke-width="1" class="transition-all duration-300 pointer-events-none"/>
              <circle id="sil-node-${slotKey}" cx="${pt.cx}" cy="${pt.cy}" r="5" fill="${color}" stroke="#0b1329" stroke-width="1.8" class="transition-all duration-300 group-hover:scale-125"/>
              <circle id="sil-glint-${slotKey}" cx="${pt.cx}" cy="${pt.cy}" r="1.5" fill="#ffffff" class="pointer-events-none"/>
              <title>${UI.escapeHtml(pt.label)}: ${UI.escapeHtml(isOccupied ? character.bodySlots[slotKey].name : '(Empty Slot - Click to equip)')}</title>
            </g>
          `;
        }
      });

      return `
        <div class="relative w-full h-full rounded-2xl overflow-hidden select-none bg-gradient-to-b from-[#060c1d] via-[#091124] to-[#040814] shadow-[0_0_50px_rgba(56,189,248,0.22)] border border-sky-500/40 flex items-center justify-center">
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(56,189,248,0.18)_0%,rgba(245,158,11,0.06)_45%,transparent_75%)] pointer-events-none"></div>

          <svg id="sil-main-svg" viewBox="0 0 460 520" preserveAspectRatio="none"
               class="w-full h-full select-none ${isSilhouetteTransformActive() ? 'cursor-grab' : ''}">
            <image id="sil-bg-image" href="${imgSrc}" xlink:href="${imgSrc}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="none" class="pointer-events-none filter brightness-105" />

            <g class="pointer-events-auto">
              ${nodesMarkup}
            </g>
          </svg>
        </div>
      `;
    }

    function renderBodySlotsSilhouette() {
      if (!character) return;
      if (!character.bodySlots) character.bodySlots = {};

      // Make sure the weapon sets exist before the slots render
      if (typeof ensureWeaponSetsData === 'function') {
        try { ensureWeaponSetsData(); } catch (e) { reportError('char_inventory:renderBodySlotsSilhouette', e); }
      }

      const leftContainer = document.getElementById('sil-left-slots');
      const rightContainer = document.getElementById('sil-right-slots');
      const figureContainer = document.getElementById('sil-figure-container');
      const bottomDock = document.getElementById('sil-bottom-dock');
      const modelLabel = document.getElementById('sil-model-label');
      const activeCountEl = document.getElementById('sil-active-count');

      if (!leftContainer || !rightContainer || !figureContainer) return;

      // 6 Slots Left Column
      const LEFT_KEYS = ['head', 'eyes', 'shoulders', 'torso', 'ring1', 'belt'];
      // 6 Slots Right Column
      const RIGHT_KEYS = ['neck', 'armor', 'bracers', 'gloves', 'ring2', 'boots'];

      let activeOccupiedCount = 0;

      function buildCardHtml(slotKey, isRight) {
        const def = BODY_SLOT_DEFS.find(d => d.key === slotKey) || { key: slotKey, name: slotKey, trName: slotKey, icon: '⚔️' };
        const rawSlot = character.bodySlots[slotKey] || { name: '-', active: false, weight: 0, cost: 0, desc: '' };
        const slotData = Object.assign({}, rawSlot);
        const isOccupied = slotData.name && slotData.name !== '-';
        if (isOccupied && slotData.active) activeOccupiedCount++;

        if (isOccupied) {
          return `
            <div data-slot="${slotKey}"
                 data-sil-hover-slot="${slotKey}"
                 class="group relative bg-[#0b1329]/90 hover:bg-[#0f172a] border ${slotData.active ? 'border-sky-500/60 shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'border-slate-800 opacity-70'} rounded-xl p-2 sm:p-2.5 transition flex items-center justify-between gap-2.5">
              
              <div class="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                <button type="button" data-action="inventory:toggle-slot-active" data-slot-key="${slotKey}" title="Toggle Active / Inactive (${slotData.active ? 'Active' : 'Inactive'})" class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${slotData.active ? 'bg-sky-950/80 border border-sky-400/60 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.25)]' : 'bg-slate-800/80 border border-slate-700 text-slate-500 grayscale opacity-60'} flex items-center justify-center text-base sm:text-lg shrink-0 shadow-inner hover:scale-105 hover:border-sky-400 transition cursor-pointer">
                  ${def.icon}
                </button>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[10px] sm:text-[10px] font-extrabold uppercase tracking-wider text-sky-400">${UI.escapeHtml(def.trName || def.name)}</span>
                    ${slotData.active ? '<span class="px-1.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-600/40">ACTIVE</span>' : '<span class="px-1.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">INACTIVE</span>'}
                    ${(() => {
                      const dailyC = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.normalizeItemDailyCharges === 'function')
                        ? RuleEngine.normalizeItemDailyCharges(slotData)
                        : slotData.dailyCharges;
                      if (!dailyC) return '';
                      const isRound = (dailyC.unit === 'rounds' || dailyC.unit === 'turn');
                      const activeBuff = isRound && (typeof isItemBuffActive === 'function') && isItemBuffActive(slotData);
                      return `
                        <div class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-500/50 shadow-sm" title="Daily Remaining: ${dailyC.current}/${dailyC.max} ${UI.escapeAttr(dailyC.unit || 'charges')}">
                          <span>⚡ ${dailyC.current}/${dailyC.max}</span>
                          <button type="button" data-action="inventory:spend-slot-charge" data-slot-key="${slotKey}" data-amount="1" title="Spend 1 Charge" class="hover:text-white px-0.5 transition font-extrabold cursor-pointer" ${dailyC.current <= 0 ? 'disabled' : ''}>-</button>
                          <button type="button" data-action="inventory:restore-slot-charge" data-slot-key="${slotKey}" data-amount="1" title="Restore 1 Charge" class="hover:text-white px-0.5 transition font-extrabold cursor-pointer" ${dailyC.current >= dailyC.max ? 'disabled' : ''}>+</button>
                        </div>
                        ${isRound ? `
                          <button type="button" data-action="${activeBuff ? 'inventory:discharge-daily-round' : 'inventory:cast-daily-round'}" data-encoded-name="${encodeURIComponent(slotData.name)}" data-slot-key="${slotKey}"
                                  title="${activeBuff ? 'End Effect' : 'Spend 1 Charge & Activate'}"
                                  class="px-1.5 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer shadow-sm ${activeBuff ? 'bg-rose-950 text-rose-300 border border-rose-500 hover:bg-rose-900 animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-600 hover:bg-emerald-900'}">
                            <span>${activeBuff ? '🛑 End' : '✨ Cast'}</span>
                          </button>
                        ` : ''}
                      `;
                    })()}
                  </div>
                  <div class="text-xs font-bold text-white truncate group-hover:text-amber-300 transition flex items-center gap-1" title="${UI.escapeAttr(slotData.name)}">
                    <span class="truncate">${UI.escapeHtml(slotData.name)}</span>
                    ${(() => { const pw = getEquipmentProficiencyWarning(slotData); return pw ? `<span class="text-rose-400 text-[11px] shrink-0" title="${UI.escapeAttr(pw.tooltip)}">⚠️</span>` : ''; })()}
                  </div>
                  ${renderGearItemStatsBadgesHtml(slotData, { compact: true, minimal: true })}
                  <div class="text-[10px] sm:text-[10px] text-slate-400 truncate flex items-center gap-2">
                    ${slotData.desc ? `<span class="truncate max-w-[120px] sm:max-w-[160px]">${UI.escapeHtml(slotData.desc)}</span>` : ''}
                    <span class="font-mono text-slate-500">${slotData.weight ? slotData.weight + ' lb' : ''}</span>
                    <span class="font-mono text-amber-400/80">${slotData.cost ? slotData.cost + ' GP' : ''}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                ${isForgeEditableItem(slotData) ? `
                  <button data-action="inventory:forge-slot-item" data-slot-key="${slotKey}" title="Customize in Item Forge" class="w-6 h-6 rounded bg-amber-950/80 hover:bg-amber-800 text-amber-300 hover:text-white border border-amber-600/60 transition text-xs inline-flex items-center justify-center cursor-pointer">
                    ⚒️
                  </button>
                ` : ''}
                <button data-action="inventory:unequip-slot" data-slot-key="${slotKey}" title="Unequip (Return to Inventory)" class="w-6 h-6 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800 transition text-xs inline-flex items-center justify-center cursor-pointer">
                  ❌
                </button>
              </div>
            </div>
          `;
        } else {
          return `
            <div data-slot="${slotKey}"
                 data-action="inventory:open-slot-equip" data-slot-key="${slotKey}"
                 data-sil-hover-slot="${slotKey}"
                 class="group relative bg-[#0b1329]/40 hover:bg-[#0b1329]/90 border border-dashed border-slate-800 hover:border-sky-500/60 rounded-xl p-2 sm:p-2.5 transition flex items-center justify-between gap-2.5 cursor-pointer">
              
              <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-600 flex items-center justify-center text-base sm:text-lg shrink-0 group-hover:text-sky-400 group-hover:border-sky-500/50 transition">
                  ${def.icon}
                </div>
                <div class="min-w-0">
                  <div class="text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition">${UI.escapeHtml(def.trName || def.name)}</div>
                  <div class="text-xs text-slate-500 italic group-hover:text-sky-300 transition">(Empty Slot)</div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" class="h-6 px-2.5 rounded bg-sky-950/70 group-hover:bg-sky-600 border border-sky-700/60 text-sky-300 group-hover:text-white text-[10px] sm:text-[11px] font-bold transition inline-flex items-center justify-center gap-1 shadow-sm cursor-pointer">
                  <span>+ Equip</span>
                </button>
              </div>
            </div>
          `;
        }
      }

      // Render Left & Right columns
      leftContainer.innerHTML = LEFT_KEYS.map(k => buildCardHtml(k, false)).join('');
      rightContainer.innerHTML = RIGHT_KEYS.map(k => buildCardHtml(k, true)).join('');

      // Render Center Figure SVG or Avatar
      figureContainer.innerHTML = getSilhouetteSvg(selectedSilhouetteModel, character);

      // Meta and controls
      if (activeCountEl) activeCountEl.textContent = `${activeOccupiedCount} / 12 Active`;
      if (modelLabel) modelLabel.textContent = 'D&D 3.5e Magic Item Record Sheet';

      // Toolbar menu and edit mode state
      applySilhouetteTransformDOM(getSilhouetteTransform(character));

      const activeEditBtn = document.getElementById('sil-active-edit-btn');
      if (activeEditBtn) {
        activeEditBtn.classList.toggle('hidden', !isSilhouettePointEditMode);
      }

      const menuEditLabel = document.getElementById('sil-menu-edit-points-label');
      if (menuEditLabel) {
        menuEditLabel.textContent = isSilhouettePointEditMode ? "💾 Save & Finish (Editing Active)" : "Edit Nodes";
      }

      const banner = document.getElementById('sil-edit-mode-banner');
      if (banner) {
        banner.classList.toggle('hidden', !isSilhouettePointEditMode);
      }

      // Bottom Dock: Weapons & Carrying Capacity HUD
      if (bottomDock) {
        const mh = Object.assign({}, character.bodySlots?.mainHand || {});
        const oh = Object.assign({}, character.bodySlots?.offHand || {});
        const mhHas = Boolean(mh.name && mh.name !== '-');
        const ohHas = Boolean(oh.name && oh.name !== '-');
        if (mhHas && typeof hydrateGearItemStats === 'function') hydrateGearItemStats(mh);
        if (ohHas && typeof hydrateGearItemStats === 'function') hydrateGearItemStats(oh);
        const mhIsDouble = mhHas && typeof RuleEngine !== 'undefined' && RuleEngine.isDoubleWeapon && RuleEngine.isDoubleWeapon(mh);
        const mhIsTwoHand = mhHas && typeof RuleEngine !== 'undefined' && RuleEngine.isTwoHandedWeapon && RuleEngine.isTwoHandedWeapon(mh);
        const hasOversized = typeof RuleEngine !== 'undefined' && RuleEngine.hasOversizedWeaponFeat && RuleEngine.hasOversizedWeaponFeat(character);
        const isDoubleTwfActive = mhIsDouble && Array.isArray(character.tactical?.weaponSets?.activeSets) && character.tactical.weaponSets.activeSets.includes(2);

        const mhStatsHtml = mhHas ? renderGearItemStatsBadgesHtml(mh, { compact: true, noMargin: true }) : '';
        const ohStatsHtml = ohHas ? renderGearItemStatsBadgesHtml(oh, { compact: true, noMargin: true }) : '';

        let offHandBadgeHtml = '';
        if (mhIsDouble) {
          // Double Weapon occupies BOTH slots; clicking Off-Hand badge toggles TWF!
          offHandBadgeHtml = `
            <div data-action="inventory:activate-double-twf"
                 class="h-full min-w-0 flex flex-col justify-start gap-1.5 px-3 py-2 rounded-xl ${isDoubleTwfActive ? 'bg-sky-950/80 border border-sky-400 text-white shadow-md shadow-sky-950/60 ring-1 ring-sky-400/40' : 'bg-slate-950 border border-amber-500/60 hover:border-sky-400 text-slate-200'} text-xs cursor-pointer select-none transition"
                 title="Double Weapon occupies both hands. Click to toggle Two-Weapon Fighting (TWF)">
              <div class="flex items-center justify-between gap-2 min-w-0">
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <span class="${isDoubleTwfActive ? 'text-sky-400' : 'text-amber-400'} font-bold text-[10px] shrink-0">OFF-HAND:</span>
                  <span class="font-bold truncate">${UI.escapeHtml(mh.name)}</span>
                </div>
                <span class="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${isDoubleTwfActive ? 'bg-sky-500 text-slate-950' : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'}">${isDoubleTwfActive ? '⚔️ TWF ON' : '2H • Click for TWF'}</span>
              </div>
              ${mhStatsHtml}
            </div>
          `;
        } else if (mhIsTwoHand && !hasOversized) {
          // Regular Two-Handed Weapon occupies BOTH slots and locks Off-Hand
          offHandBadgeHtml = `
            <div class="h-full min-w-0 flex flex-col justify-start gap-1.5 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-400 text-xs select-none opacity-80"
                 title="Both hands are occupied by two-handed weapon ${UI.escapeAttr(mh.name)}">
              <div class="flex items-center justify-between gap-2 min-w-0">
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <span class="text-amber-500/80 font-bold text-[10px] shrink-0">OFF-HAND:</span>
                  <span class="font-bold truncate">🔒 ${UI.escapeHtml(mh.name)}</span>
                </div>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 shrink-0">2-Hand Grip</span>
              </div>
            </div>
          `;
        } else {
          // One-Handed / Light Weapon or Empty Main Hand: normal Off-Hand slot
          offHandBadgeHtml = `
            <div data-action="inventory:open-slot-equip" data-slot-key="offHand" class="h-full min-w-0 flex flex-col justify-start gap-1.5 pl-3 ${ohHas ? 'pr-2 py-2' : 'pr-3 py-2'} rounded-xl ${ohHas ? 'bg-slate-950 border border-amber-500/60 hover:border-amber-400 text-white' : 'bg-slate-950/60 border border-slate-800 hover:border-amber-500/60 text-slate-400 hover:text-amber-200'} text-xs cursor-pointer transition" title="${ohHas ? 'Click to change Off-Hand weapon or shield' : 'Click to equip Off-Hand weapon or shield'}">
              <div class="flex items-center justify-between gap-2 min-w-0">
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <span class="text-amber-400 font-bold text-[10px] shrink-0">OFF-HAND:</span>
                  <span class="font-bold truncate">${UI.escapeHtml(ohHas ? oh.name : '+ Equip Off-Hand')}</span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  ${ohHas && isForgeEditableItem(oh) ? `<button type="button" data-action="inventory:forge-slot-item" data-slot-key="offHand" title="Customize Off-Hand in Item Forge" class="w-6 h-6 rounded-md bg-amber-950/80 hover:bg-amber-800 border border-amber-600/70 text-amber-300 hover:text-white text-xs inline-flex items-center justify-center shrink-0 transition cursor-pointer">⚒️</button>` : ''}
                  ${ohHas ? `<button type="button" data-action="inventory:unequip-slot" data-slot-key="offHand" title="Unequip Off-Hand" class="w-6 h-6 rounded-md bg-rose-950/80 hover:bg-rose-700 border border-rose-700/80 text-rose-300 hover:text-white text-xs font-extrabold inline-flex items-center justify-center shrink-0 transition cursor-pointer">✕</button>` : ''}
                </div>
              </div>
              ${ohStatsHtml}
            </div>
          `;
        }

        bottomDock.innerHTML = `
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-amber-400 text-sm">⚔️</span>
              <span class="text-xs font-bold text-amber-300 uppercase tracking-wider">Weapons &amp; Quick Loadout:</span>
            </div>

            <!-- Weapon Quick Slots (Stacked on Mobile, Side-by-Side on sm+) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 min-w-0 w-full items-stretch">
              <!-- Main Hand Badge -->
              <div data-action="inventory:open-slot-equip" data-slot-key="mainHand" class="h-full min-w-0 flex flex-col justify-start gap-1.5 pl-3 ${mhHas ? 'pr-2 py-2' : 'pr-3 py-2'} rounded-xl ${mhHas ? 'bg-slate-950 border border-sky-500/60 hover:border-sky-400 text-white' : 'bg-slate-950/60 border border-slate-800 hover:border-sky-500/60 text-slate-400 hover:text-sky-200'} text-xs cursor-pointer transition" title="${mhHas ? 'Click to change Main Hand weapon' : 'Click to equip Main Hand weapon'}">
                <div class="flex items-center justify-between gap-2 min-w-0">
                  <div class="flex items-center gap-1.5 min-w-0 flex-1">
                    <span class="text-sky-400 font-bold text-[10px] shrink-0">MAIN HAND:</span>
                    <span class="font-bold truncate">${UI.escapeHtml(mhHas ? mh.name : '+ Equip Main Hand')}</span>
                    ${mhIsDouble ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-sky-300 border border-sky-800/60 shrink-0">${isDoubleTwfActive ? '1-Hand' : '2-Hand'}</span>` : ''}
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    ${mhHas && isForgeEditableItem(mh) ? `<button type="button" data-action="inventory:forge-slot-item" data-slot-key="mainHand" title="Customize Main Hand in Item Forge" class="w-6 h-6 rounded-md bg-amber-950/80 hover:bg-amber-800 border border-amber-600/70 text-amber-300 hover:text-white text-xs inline-flex items-center justify-center shrink-0 transition cursor-pointer">⚒️</button>` : ''}
                    ${mhHas ? `<button type="button" data-action="inventory:unequip-slot" data-slot-key="mainHand" title="Unequip Main Hand" class="w-6 h-6 rounded-md bg-rose-950/80 hover:bg-rose-700 border border-rose-700/80 text-rose-300 hover:text-white text-xs font-extrabold inline-flex items-center justify-center shrink-0 transition cursor-pointer">✕</button>` : ''}
                  </div>
                </div>
                ${mhStatsHtml}
              </div>

              <!-- Off Hand Badge -->
              ${offHandBadgeHtml}
            </div>
          </div>
        `;
      }

      // Draw dynamic connector lines spanning directly from item card centers to body points
      requestAnimationFrame(() => {
        updateSilhouetteConnectorLines();
      });
      setTimeout(updateSilhouetteConnectorLines, 60);
    }

    // ====================================================
    // 👑 BODY SLOT QUICK EQUIP MODAL
    // ====================================================
    function openSlotEquipModal(slotKey) {
      _currentEquipSlotKey = slotKey;
      const modal = document.getElementById('slot-equip-modal');
      const def = BODY_SLOT_DEFS.find(d => d.key === slotKey);
      if (!modal || !def) return;

      const titleEl = document.getElementById('slot-equip-modal-title');
      const iconEl = document.getElementById('slot-equip-modal-icon');
      const subEl = document.getElementById('slot-equip-modal-subtitle');

      if (titleEl) titleEl.textContent = `Equip Item: ${UI.escapeHtml(def.trName || def.name)}`;
      if (iconEl) iconEl.textContent = def.icon;
      if (subEl) subEl.textContent = `Allowed categories: ${def.allowed.join(', ')}`;

      renderSlotEquipItems();
      modal.classList.remove('hidden');
    }

    function closeSlotEquipModal() {
      const modal = document.getElementById('slot-equip-modal');
      if (modal) modal.classList.add('hidden');
      _currentEquipSlotKey = null;
    }

    function renderSlotEquipItems() {
      const container = document.getElementById('slot-equip-modal-items');
      if (!container || !_currentEquipSlotKey) return;

      const def = BODY_SLOT_DEFS.find(d => d.key === _currentEquipSlotKey);
      const showAll = document.getElementById('slot-equip-show-all')?.checked || false;
      const currentSlotData = character.bodySlots?.[_currentEquipSlotKey];
      const hasEquipped = Boolean(currentSlotData && currentSlotData.name && currentSlotData.name !== '-');

      // Ensure footer Unequip button is present and synced with slot state
      const modalEl = document.getElementById('slot-equip-modal');
      if (modalEl) {
        let footerUnequipBtn = document.getElementById('slot-equip-footer-unequip-btn');
        if (!footerUnequipBtn) {
          const closeBtn = Array.from(modalEl.querySelectorAll('button:not(.w-7)')).find(b => b.textContent.trim() === 'Close');
          if (closeBtn && closeBtn.parentElement) {
            closeBtn.parentElement.className = 'bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0';
            footerUnequipBtn = document.createElement('button');
            footerUnequipBtn.id = 'slot-equip-footer-unequip-btn';
            footerUnequipBtn.type = 'button';
            footerUnequipBtn.className = 'px-3.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-800 border border-rose-700 text-rose-200 hover:text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer';
            closeBtn.parentElement.insertBefore(footerUnequipBtn, closeBtn);
          }
        }
        if (footerUnequipBtn) {
          if (hasEquipped) {
            footerUnequipBtn.classList.remove('hidden');
            footerUnequipBtn.innerHTML = `<span>✕</span><span>Unequip ${UI.escapeHtml(currentSlotData.name)}</span>`;
            footerUnequipBtn.setAttribute('data-action', 'inventory:unequip-slot-modal');
            footerUnequipBtn.setAttribute('data-slot-key', _currentEquipSlotKey);
          } else {
            footerUnequipBtn.classList.add('hidden');
          }
        }
      }

      const equippedBannerHtml = hasEquipped ? `
        <div class="p-3 rounded-xl bg-sky-950/40 border border-sky-500/60 flex items-center justify-between gap-3 mb-2 shadow-sm">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">Currently Equipped</span>
              <span class="text-xs font-extrabold text-white truncate">${UI.escapeHtml(currentSlotData.name)}</span>
            </div>
            ${renderGearItemStatsBadgesHtml(currentSlotData, { compact: true })}
            <div class="text-[10px] text-slate-300 truncate mt-0.5">${UI.escapeHtml(currentSlotData.desc || 'Equipped in ' + (def?.trName || def?.name || _currentEquipSlotKey))}</div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            ${isForgeEditableItem(currentSlotData) ? `
              <button type="button" data-action="inventory:forge-slot-item" data-slot-key="${_currentEquipSlotKey}" class="px-2.5 py-1.5 bg-amber-950/90 hover:bg-amber-800 border border-amber-500/70 text-amber-200 hover:text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1 cursor-pointer" title="Customize in Item Forge">
                <span>⚒️</span>
                <span>Forge</span>
              </button>
            ` : ''}
            <button type="button" data-action="inventory:unequip-slot-modal" data-slot-key="${_currentEquipSlotKey}" class="px-3 py-1.5 bg-rose-900/90 hover:bg-rose-700 border border-rose-500/70 text-rose-100 hover:text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1.5 cursor-pointer">
              <span>✕</span>
              <span>Unequip</span>
            </button>
          </div>
        </div>
      ` : '';

      const pool = character.gearPool || [];
      const eligible = pool.filter(item => {
        if (item.isEquipped) return false;
        if (isConsumableOrSlotless(item)) return false; // D&D 3.5e RAW: Sarf malzemeleri ve parşömenler vücut yuvalarına giyilemez
        if (showAll) return true;
        if (!def) return true;

        const validSlot = getValidSlotForItem(item);
        if (validSlot === _currentEquipSlotKey) return true;
        if ((_currentEquipSlotKey === 'ring1' || _currentEquipSlotKey === 'ring2') && validSlot === 'ring1') return true;
        if (_currentEquipSlotKey === 'offHand' && (validSlot === 'mainHand' || (item.category || '').toLowerCase() === 'shield')) return true;

        const cat = (item.category || '').toLowerCase().trim();
        const slotName = (def.name || '').toLowerCase().trim();
        const allowedLower = (def.allowed || []).map(a => a.toLowerCase().trim());

        if (allowedLower.includes(cat) || cat === slotName) return true;
        if (_currentEquipSlotKey === 'mainHand' && cat === 'weapon') return true;
        if (_currentEquipSlotKey === 'offHand' && (cat === 'weapon' || cat === 'shield')) return true;
        if ((_currentEquipSlotKey === 'ring1' || _currentEquipSlotKey === 'ring2') && cat === 'ring') return true;
        return false;
      });
      eligible.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));

      if (eligible.length === 0) {
        container.innerHTML = `
          ${equippedBannerHtml}
          <div class="py-6 text-center space-y-3">
            <div class="text-3xl text-slate-600">🎒</div>
            <p class="text-xs text-slate-400">
              No ${hasEquipped ? 'other ' : ''}eligible items found in your inventory pool for <strong>${UI.escapeHtml(def?.trName || def?.name || 'this slot')}</strong>.
            </p>
            <div class="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button data-action="inventory:open-add-pool-from-equip" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer">
                ➕ Add New Item to Inventory
              </button>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = equippedBannerHtml + eligible.map(item => {
        const safeIdAttr = String(item.id ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        return `
        <div class="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/60 transition flex items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-white">${UI.escapeHtml(item.name)}</span>
              <span class="text-[10px] font-bold px-1.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">${UI.escapeHtml(item.category)}</span>
            </div>
            ${renderGearItemStatsBadgesHtml(item, { compact: true })}
            <div class="text-[10px] text-slate-400 truncate mt-0.5">${UI.escapeHtml(item.desc || 'No properties specified')}</div>
            <div class="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Weight: <strong class="text-slate-300 font-mono">${item.weight || 0} lb</strong></span>
              <span>•</span>
              <span>Value: <strong class="text-amber-400 font-mono">${item.cost || 0} GP</strong></span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            ${isForgeEditableItem(item) ? `
              <button type="button" data-action="inventory:forge-pool-item" data-item-id="${safeIdAttr}" class="w-8 h-8 rounded-lg bg-amber-950/90 hover:bg-amber-800 border border-amber-500/70 text-amber-200 hover:text-white text-xs font-bold transition shadow inline-flex items-center justify-center cursor-pointer" title="Customize in Item Forge">
                ⚒️
              </button>
            ` : ''}
            <button data-action="inventory:equip-pool-item-modal" data-item-id="${safeIdAttr}" data-slot-key="${_currentEquipSlotKey}" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1 cursor-pointer">
              <span>⚡ Equip</span>
            </button>
          </div>
        </div>
      `;
      }).join('');
    }

    // ====================================================
    // 🐾 COMPANION GEAR & BODY SLOTS (Madde D)
    // ====================================================
    const COMPANION_SLOT_DEFS = [
      { key: 'armor', name: 'Armor / Barding', icon: '🛡️', allowed: ['Armor', 'Barding'], hint: 'Light, Medium, or Heavy armor fitted as barding' },
      { key: 'neck', name: 'Neck / Collar', icon: '📿', allowed: ['Neck', 'Wondrous'], hint: 'Amulet of Mighty Fists, Collar of Healing, Periapt' },
      { key: 'feet', name: 'Feet / Horseshoes', icon: '🐾', allowed: ['Feet', 'Boots', 'Horseshoes'], hint: 'Horseshoes of Speed, Horseshoes of a Zephyr, Boots' },
      { key: 'saddle', name: 'Saddle / Tack', icon: '🏇', allowed: ['Gear', 'Tool'], hint: 'Military Saddle, Exotic Saddle, Battle Bridle, Pack Saddle' },
      { key: 'slotless', name: 'Slotless / Pack', icon: '🎒', allowed: ['Slotless', 'Gear', 'Wondrous'], hint: 'Saddlebags, Ioun Stones, Wonder items' }
    ];

    let _activeCompanionEquipSlotKey = null;

    function renderCompanionGearView() {
      const container = document.getElementById('body-slots-companion-view');
      if (!container) return;

      if (!character || !character.companion || !character.companion.baseMonsterId) {
        const isEligible = typeof window.isCharacterCompanionEligible === 'function'
          ? window.isCharacterCompanionEligible(character)
          : false;

        if (!isEligible) {
          container.innerHTML = `
            <div class="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3 max-w-lg mx-auto my-6">
              <div class="text-3xl">🔒</div>
              <h4 class="text-sm font-black text-slate-300 uppercase tracking-wider">Companion &amp; Mount Locked (Prerequisites Not Met)</h4>
              <p class="text-xs text-slate-400">Add a required feat or class feature (<strong class="text-amber-400/90">Animal Companion</strong>, <strong class="text-purple-400/90">Summon Familiar</strong>, <strong class="text-sky-400/90">Special Mount</strong>, <strong class="text-amber-300/90">Obtain Familiar</strong>, or <strong class="text-emerald-400/90">Wild Cohort</strong>) in the <strong class="text-slate-200">Character</strong> tab before binding a companion.</p>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3 max-w-lg mx-auto my-6">
              <div class="text-3xl">🐾</div>
              <h4 class="text-sm font-black text-white uppercase tracking-wider">No Active Companion or Mount</h4>
              <p class="text-xs text-slate-400">Select or summon an Animal Companion, Familiar, or Special Mount to manage equipment slots and barding.</p>
              <button type="button" data-action="inventory:open-companion-modal" class="ui-btn-sm h-8 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs shadow transition cursor-pointer inline-flex items-center gap-1.5 mx-auto">
                <span>➕</span>
                <span>Select / Summon Companion</span>
              </button>
            </div>
          `;
        }
        return;
      }

      const stats = (window.SrdCompendium && typeof window.SrdCompendium.calculateCompanionStats === 'function')
        ? window.SrdCompendium.calculateCompanionStats(character, character.companion)
        : null;

      if (!stats) {
        container.innerHTML = `<div class="p-4 text-center text-xs text-rose-400">Loading companion Bestiary data...</div>`;
        return;
      }

      const typeLabel = stats.type === 'familiar' ? 'Familiar' : (stats.type === 'special_mount' ? 'Special Mount' : 'Animal Companion');
      const icon = stats.type === 'familiar' ? '🦉' : (stats.type === 'special_mount' ? '🐎' : '🐺');
      const gear = character.companion.gear || {};

      container.innerHTML = `
        <!-- Companion Summary Banner -->
        <div class="bg-gradient-to-r from-amber-950/40 via-slate-900 to-sky-950/40 border border-amber-500/50 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-12 h-12 rounded-xl bg-slate-950 border border-amber-500/60 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              ${icon}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-black text-white truncate">${safeEscapeHtml(stats.customName)}</h3>
                <span class="text-xs text-amber-300 font-mono">(${safeEscapeHtml(stats.baseName)} • ${typeLabel})</span>
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60">${stats.totalHd} HD</span>
              </div>
              <div class="flex items-center gap-3 text-xs font-mono text-slate-300 flex-wrap mt-0.5">
                <span>HP: <strong class="text-emerald-400">${stats.hp.current}/${stats.hp.max}</strong></span>
                <span>•</span>
                <span>AC: <strong class="text-amber-300">${stats.ac.total}</strong></span>
                <span>•</span>
                <span>Speed: <strong class="text-sky-300">${stats.speed.land} ft</strong></span>
                <span>•</span>
                <span>BAB: <strong class="text-white">+${stats.bab}</strong></span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" data-action="inventory:open-companion-modal" class="ui-btn-sm h-8 px-3 bg-slate-900 hover:bg-slate-800 border border-amber-600/50 text-amber-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              <span>⚙️</span>
              <span>Manage Companion</span>
            </button>
          </div>
        </div>

        <!-- 5 Dedicated Body Slots Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${COMPANION_SLOT_DEFS.map(slotDef => {
            const item = gear[slotDef.key];
            const isOccupied = Boolean(item && item.name && item.name !== '-');

            if (isOccupied) {
              const acBadge = (item.acBonus || item.armorBonus) ? `<span class="px-1.5 rounded font-mono text-[10px] bg-sky-950 text-sky-300 border border-sky-700 font-bold">+${(item.acBonus || item.armorBonus) + (item.enhancementBonus || 0)} AC</span>` : '';
              const enhBadge = item.enhancementBonus ? `<span class="px-1.5 rounded font-mono text-[10px] bg-amber-950 text-amber-300 border border-amber-700 font-bold">+${item.enhancementBonus} Magic</span>` : '';

              return `
                <div class="bg-slate-900/90 border border-amber-500/60 rounded-xl p-3 shadow-md flex flex-col justify-between space-y-2">
                  <div>
                    <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wide">
                        <span>${slotDef.icon}</span>
                        <span>${UI.escapeHtml(slotDef.name)}</span>
                      </div>
                      <span class="text-[10px] font-mono px-1.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">EQUIPPED</span>
                    </div>
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <div class="text-xs font-black text-white truncate">${safeEscapeHtml(item.name)}</div>
                        <div class="flex items-center gap-1 flex-wrap mt-1">
                          ${acBadge}
                          ${enhBadge}
                          ${item.weight ? `<span class="text-[10px] text-slate-400 font-mono">${item.weight} lbs</span>` : ''}
                        </div>
                        <div class="text-[10px] text-slate-400 mt-1 line-clamp-2">${safeEscapeHtml(item.desc || item.benefit || slotDef.hint)}</div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <button type="button" data-action="inventory:open-companion-equip" data-slot-key="${slotDef.key}" class="ui-btn-xs h-6 px-2 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition cursor-pointer">
                      <span>⇄</span>
                      <span>Swap</span>
                    </button>
                    <button type="button" data-action="inventory:unequip-companion-slot" data-slot-key="${slotDef.key}" class="ui-btn-xs h-6 px-2.5 text-[10px] font-bold text-rose-300 hover:text-white bg-rose-950 hover:bg-rose-900 border border-rose-700/60 rounded transition cursor-pointer">
                      <span>✕</span>
                      <span>Unequip</span>
                    </button>
                  </div>
                </div>
              `;
            } else {
              return `
                <div class="bg-slate-950/60 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between space-y-2 transition">
                  <div>
                    <div class="flex items-center justify-between border-b border-slate-800/60 pb-1.5 mb-1.5">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                        <span>${slotDef.icon}</span>
                        <span>${UI.escapeHtml(slotDef.name)}</span>
                      </div>
                      <span class="text-[10px] font-mono px-1.5 rounded bg-slate-900 text-slate-500 border border-slate-800">EMPTY</span>
                    </div>
                    <p class="text-[10px] text-slate-500 italic min-h-[30px]">${slotDef.hint}</p>
                  </div>
                  <div class="pt-2 border-t border-slate-800/60 text-right">
                    <button type="button" data-action="inventory:open-companion-equip" data-slot-key="${slotDef.key}" class="ui-btn-xs h-6 px-2.5 bg-amber-600/90 hover:bg-amber-500 text-white rounded font-bold text-[10px] shadow transition cursor-pointer inline-flex items-center gap-1">
                      <span>➕</span>
                      <span>Equip</span>
                    </button>
                  </div>
                </div>
              `;
            }
          }).join('')}
        </div>
      `;
    }

    function ensureCompanionEquipModalDom() {
      let modal = document.getElementById('companion-equip-modal');
      if (modal) return modal;

      modal = document.createElement('div');
      modal.id = 'companion-equip-modal';
      modal.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto hidden';
      modal.innerHTML = `
        <div class="bg-[#0b1329] border border-amber-500/50 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88vh]">
          <!-- Header -->
          <div class="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div class="flex items-center gap-2">
              <span id="companion-equip-modal-icon" class="text-xl">🛡️</span>
              <div>
                <h3 id="companion-equip-modal-title" class="text-sm sm:text-base font-black text-white">Equip Companion Slot</h3>
                <p id="companion-equip-modal-subtitle" class="text-[10px] text-slate-400">Select compatible item from character gear pool</p>
              </div>
            </div>
            <button type="button" data-action="inventory:close-companion-equip" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer">
              ✕
            </button>
          </div>

          <!-- Search & Filter Controls -->
          <div class="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <input type="text" id="companion-equip-search-input" data-input-action="inventory:filter-companion-equip" placeholder="Filter items in gear pool..." class="ui-input-md h-8 flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 text-xs text-white placeholder-slate-500">
            <label class="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0 cursor-pointer select-none">
              <input type="checkbox" id="companion-equip-show-all" data-change-action="inventory:filter-companion-equip" class="rounded border-slate-700 text-amber-500">
              <span>Show All Items</span>
            </label>
          </div>

          <!-- Items List -->
          <div id="companion-equip-items-list" class="p-3 overflow-y-auto space-y-2 flex-1 text-xs">
            <!-- Dynamically populated -->
          </div>

          <!-- Footer -->
          <div class="bg-slate-900/90 px-4 py-2.5 border-t border-slate-800 flex items-center justify-end shrink-0">
            <button type="button" data-action="inventory:close-companion-equip" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer">
              Close
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      return modal;
    }

    function openCompanionEquipModal(slotKey) {
      _activeCompanionEquipSlotKey = slotKey;
      const modal = ensureCompanionEquipModalDom();
      const def = COMPANION_SLOT_DEFS.find(d => d.key === slotKey) || { key: slotKey, name: slotKey, icon: '🐾' };

      const titleEl = document.getElementById('companion-equip-modal-title');
      const iconEl = document.getElementById('companion-equip-modal-icon');
      const subEl = document.getElementById('companion-equip-modal-subtitle');
      const searchEl = document.getElementById('companion-equip-search-input');
      const showAllEl = document.getElementById('companion-equip-show-all');

      if (titleEl) titleEl.textContent = `Equip Companion: ${def.name}`;
      if (iconEl) iconEl.textContent = def.icon;
      if (subEl) subEl.textContent = `Select an item from Gear Pool for ${character?.companion?.name || 'Companion'}`;
      if (searchEl) searchEl.value = '';
      if (showAllEl) showAllEl.checked = false;

      renderCompanionEquipList();
      modal.classList.remove('hidden');
    }

    function closeCompanionEquipModal() {
      const modal = document.getElementById('companion-equip-modal');
      if (modal) modal.classList.add('hidden');
      _activeCompanionEquipSlotKey = null;
    }

    function renderCompanionEquipList() {
      const container = document.getElementById('companion-equip-items-list');
      if (!container || !_activeCompanionEquipSlotKey || !character) return;

      const slotDef = COMPANION_SLOT_DEFS.find(d => d.key === _activeCompanionEquipSlotKey);
      const query = (document.getElementById('companion-equip-search-input')?.value || '').toLowerCase().trim();
      const showAll = document.getElementById('companion-equip-show-all')?.checked || false;

      const gearPool = Array.isArray(character.gearPool) ? character.gearPool : [];
      const compatibleItems = gearPool.filter(item => {
        if (!item || !item.name) return false;
        if (query && !item.name.toLowerCase().includes(query)) return false;
        if (showAll) return true;

        const nameLower = item.name.toLowerCase();
        const catLower = (item.category || '').toLowerCase();
        const slotLower = (item.slot || '').toLowerCase();

        if (_activeCompanionEquipSlotKey === 'armor') {
          return catLower === 'armor' || nameLower.includes('barding') || nameLower.includes('armor');
        } else if (_activeCompanionEquipSlotKey === 'neck') {
          return slotLower === 'neck' || catLower === 'neck' || nameLower.includes('collar') || nameLower.includes('amulet') || nameLower.includes('periapt');
        } else if (_activeCompanionEquipSlotKey === 'feet') {
          return slotLower === 'boots' || catLower === 'feet' || catLower === 'boots' || nameLower.includes('horseshoes') || nameLower.includes('boots');
        } else if (_activeCompanionEquipSlotKey === 'saddle') {
          return nameLower.includes('saddle') || nameLower.includes('bridle') || nameLower.includes('bit') || nameLower.includes('tack');
        } else if (_activeCompanionEquipSlotKey === 'slotless') {
          return catLower === 'gear' || catLower === 'tool' || catLower === 'wondrous' || nameLower.includes('saddlebags');
        }
        return false;
      });

      if (compatibleItems.length === 0) {
        container.innerHTML = `
          <div class="py-8 text-center text-xs text-slate-500 italic space-y-2">
            <div>No matching items found in your character's Gear Pool.</div>
            <div class="text-[10px] text-slate-600">Try checking "Show All Items" or add items to your Gear Pool from the compendium.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = compatibleItems.map(item => {
        const acBonus = (item.acBonus || item.armorBonus) ? `+${(item.acBonus || item.armorBonus) + (item.enhancementBonus || 0)} AC` : null;
        const enhBonus = item.enhancementBonus ? `+${item.enhancementBonus} Magic` : null;
        const safeIdAttr = String(item.id ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

        return `
          <div class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between gap-3 transition">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-bold text-white truncate">${safeEscapeHtml(item.name)}</span>
                <span class="text-[10px] px-1.5 rounded bg-slate-950 text-slate-400 border border-slate-700 uppercase font-mono">${safeEscapeHtml(item.category || 'Gear')}</span>
                ${acBadge(acBonus)}
                ${enhBadge(enhBonus)}
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5 truncate">${safeEscapeHtml(item.desc || item.benefit || '')}</div>
            </div>
            <button type="button" data-action="inventory:equip-companion-item" data-item-id="${safeIdAttr}" data-slot-key="${_activeCompanionEquipSlotKey}" class="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs rounded-lg shadow transition cursor-pointer shrink-0">
              ✓ Equip
            </button>
          </div>
        `;
      }).join('');

      function acBadge(b) {
        return b ? `<span class="text-[10px] font-mono font-bold px-1.5 rounded bg-sky-950 text-sky-300 border border-sky-700">${b}</span>` : '';
      }
      function enhBadge(b) {
        return b ? `<span class="text-[10px] font-mono font-bold px-1.5 rounded bg-amber-950 text-amber-300 border border-amber-700">${b}</span>` : '';
      }
    }

    function syncInventoryStore() {
      if (typeof window !== 'undefined' && window.CharStore && !window.CharStore.getDoc() && typeof character !== 'undefined') {
        window.CharStore._syncExternalCharacterRef(character);
      }
    }

    function equipItemToCompanion(itemId, slotKey) {
      if (!character || !character.companion) return;
      if (window.CharStore && typeof window.CharStore.dispatch === 'function') {
        syncInventoryStore();
        window.CharStore.dispatch({
          type: 'inventory/equipCompanionItem',
          payload: { poolItemId: itemId, slotKey },
          meta: { label: `Equip Companion Item (${slotKey})` }
        });
        const out = window.CharStore.getLastOutcome();
        if (!out || out.status === 'not_found') {
          showToast('Item not found in Gear Pool.', 'error', { wrap: true });
          return;
        }
        closeCompanionEquipModal();
        renderAll();
        showDiceTopToast({
          icon: '🐾',
          title: 'Companion Item Equipped',
          breakdown: `${out.itemName} equipped in ${slotKey}.`,
          total: 'Equipped'
        });
        return;
      }
      if (!Array.isArray(character.gearPool)) character.gearPool = [];

      const itemIdx = character.gearPool.findIndex(i => i && String(i.id) === String(itemId));
      if (itemIdx === -1) {
        showToast('Item not found in Gear Pool.', 'error', { wrap: true });
        return;
      }

      const item = character.gearPool[itemIdx];
      if (!character.companion.gear) character.companion.gear = {};

      // Return existing item in this slot to Gear Pool if any
      const existing = character.companion.gear[slotKey];
      if (existing && existing.name && existing.name !== '-') {
        character.gearPool.push(existing);
      }

      // If quantity > 1, decrement; otherwise remove
      if (item.qty && item.qty > 1) {
        item.qty -= 1;
        character.companion.gear[slotKey] = { ...item, qty: 1 };
      } else {
        character.companion.gear[slotKey] = item;
        character.gearPool.splice(itemIdx, 1);
      }

      saveStateToStorage(true);
      closeCompanionEquipModal();
      renderAll();

      showDiceTopToast({
        icon: '🐾',
        title: 'Companion Item Equipped',
        breakdown: `${item.name} equipped in ${slotKey}.`,
        total: 'Equipped'
      });
    }

    function unequipCompanionSlot(slotKey) {
      if (!character || !character.companion || !character.companion.gear) return;
      if (window.CharStore && typeof window.CharStore.dispatch === 'function') {
        syncInventoryStore();
        window.CharStore.dispatch({
          type: 'inventory/unequipCompanionSlot',
          payload: { slotKey },
          meta: { label: `Unequip Companion Slot (${slotKey})` }
        });
        const out = window.CharStore.getLastOutcome();
        if (!out || out.status === 'empty_slot') return;
        renderAll();
        showDiceTopToast({
          icon: '🐾',
          title: 'Companion Item Unequipped',
          breakdown: `${out.itemName} returned to Gear Pool.`,
          total: 'Unequipped'
        });
        return;
      }
      const item = character.companion.gear[slotKey];
      if (!item || !item.name || item.name === '-') return;

      if (!Array.isArray(character.gearPool)) character.gearPool = [];
      character.gearPool.push(item);
      delete character.companion.gear[slotKey];

      saveStateToStorage(true);
      renderAll();

      showDiceTopToast({
        icon: '🐾',
        title: 'Companion Item Unequipped',
        breakdown: `${item.name} returned to Gear Pool.`,
        total: 'Unequipped'
      });
    }

    // Attach to global window
    window.renderCompanionGearView = renderCompanionGearView;
    window.openCompanionEquipModal = openCompanionEquipModal;
    window.closeCompanionEquipModal = closeCompanionEquipModal;
    window.renderCompanionEquipList = renderCompanionEquipList;
    window.equipItemToCompanion = equipItemToCompanion;
    window.unequipCompanionSlot = unequipCompanionSlot;


    function toggleSlotActive(slotKey) {
      if (character.bodySlots?.[slotKey]) {
        if (slotKey === 'offHand' && !character.bodySlots.offHand.active) {
          const mh = character.bodySlots.mainHand;
          const isDouble = mh && RuleEngine.isDoubleWeapon && RuleEngine.isDoubleWeapon(mh);
          if (mh && mh.name && mh.name !== '-' && RuleEngine.isTwoHandedWeapon(mh) && !isDouble && !RuleEngine.hasOversizedWeaponFeat(character)) {
            if (typeof showDiceTopToast === 'function') {
              showDiceTopToast({
                title: 'Two-Handed Weapon Restriction',
                breakdown: `Main-hand "${mh.name}" is a two-handed weapon. Off-hand cannot be activated.`,
                icon: '⚠️'
              });
            } else {
              alert(`⚠️ Your main-hand weapon "${mh.name}" is Two-Handed!\n\nYou cannot activate an off-hand weapon or shield simultaneously without 'Monkey Grip'.`);
            }
            return;
          }
        }
        if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function' && window.CharStore.getDoc()) {
          window.CharStore.dispatch({
            type: 'inventory/toggleSlotActive',
            payload: { slotKey },
            meta: { label: `Toggle Body Slot (${slotKey})` }
          });
          renderAll();
          return;
        }
        character.bodySlots[slotKey].active = !character.bodySlots[slotKey].active;
        saveStateToStorage();
        renderAll();
      }
    }

    function unequipSlot(slotKey, silent = false) {
      const slot = character.bodySlots?.[slotKey];
      if (!slot || slot.name === '-') return;
      const slotName = slot.name;
      if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function' && window.CharStore.getDoc()) {
        window.CharStore.dispatch({
          type: 'inventory/unequipSlot',
          payload: { slotKey },
          meta: { label: `Unequip ${slotName}` }
        });
        try { renderWeaponSetsUI(); } catch (e) { reportError('char_inventory:unequipSlot', e); }
        try { recalculateOffense(); } catch (e) { reportError('char_inventory:unequipSlot', e); }
        renderAll();
        if (!silent && typeof showDiceTopToast === 'function') {
          const slotDef = BODY_SLOT_DEFS.find(d => d.key === slotKey);
          showDiceTopToast({
            title: 'Item Unequipped',
            breakdown: `"${slotName}" (${slotDef?.trName || slotKey}) unequipped and returned to backpack.`,
            icon: '📦'
          });
        }
        return;
      }

      if (!Array.isArray(character.gearPool)) character.gearPool = [];

      // Find in pool and set isEquipped = false, or add to gearPool if not present
      const cleanSlotName = (slot.name || '').toLowerCase().trim();
      const cleanRefName = (slot.masterDbName || '').toLowerCase().trim();
      const poolItem = character.gearPool.find(p => {
        const pClean = (p.name || '').toLowerCase().trim();
        return pClean === cleanSlotName || (cleanRefName && pClean === cleanRefName);
      });
      if (poolItem) {
        poolItem.isEquipped = false;
      } else {
        const slotDef = BODY_SLOT_DEFS.find(d => d.key === slotKey);
        const inferredCat = slot.category || (slotDef && slotDef.allowed && slotDef.allowed[0]) || 'Other';
        character.gearPool.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: slot.name,
          masterDbName: slot.masterDbName || slot.name,
          category: inferredCat,
          desc: slot.desc || '',
          qty: 1,
          weight: Number(slot.weight) || 0,
          cost: Number(slot.cost) || 0,
          isBelt: false,
          isEquipped: false,
          acBonus: slot.acBonus,
          bonusType: slot.bonusType,
          strBonus: slot.strBonus,
          dexBonus: slot.dexBonus,
          conBonus: slot.conBonus,
          intBonus: slot.intBonus,
          wisBonus: slot.wisBonus,
          chaBonus: slot.chaBonus,
          maxDex: slot.maxDex,
          checkPenalty: slot.checkPenalty,
          spellFailure: slot.spellFailure,
          baseItemId: slot.baseItemId,
          material: slot.material,
          enhancementBonus: slot.enhancementBonus,
          enhancements: Array.isArray(slot.enhancements) ? slot.enhancements.slice() : undefined,
          dice: slot.dice,
          critMin: slot.critMin,
          critRange: slot.critRange,
          critMult: slot.critMult,
          handedness: slot.handedness,
          dmgType: slot.dmgType,
          damageParts: Array.isArray(slot.damageParts) ? JSON.parse(JSON.stringify(slot.damageParts)) : undefined,
          modifiers: Array.isArray(slot.modifiers) ? JSON.parse(JSON.stringify(slot.modifiers)) : undefined,
          ruleFlags: slot.ruleFlags ? JSON.parse(JSON.stringify(slot.ruleFlags)) : undefined,
          tacticalBadges: Array.isArray(slot.tacticalBadges) ? JSON.parse(JSON.stringify(slot.tacticalBadges)) : undefined
        });
      }

      character.bodySlots[slotKey] = { name: '-', active: false, weight: 0, cost: 0, desc: '' };

      // Reverse sync: update tactical weapon sets when unequipped from inventory
      ensureWeaponSetsData();
      if (slotKey === 'mainHand') {
        if (character.tactical?.weaponSets?.set1) {
          character.tactical.weaponSets.set1.mainWeapon = 'None';
        }
        character.activeWeapon = 'None';
      } else if (slotKey === 'offHand') {
        if (character.tactical?.weaponSets?.set2) {
          character.tactical.weaponSets.set2.mainWeapon = 'None';
        }
        character.activeOffHand = 'None';
      }
      try { renderWeaponSetsUI(); } catch (e) { reportError('char_inventory:unequipSlot', e); }
      try { recalculateOffense(); } catch (e) { reportError('char_inventory:unequipSlot', e); }

      saveStateToStorage(true);
      renderAll();

      if (!silent && typeof showDiceTopToast === 'function') {
        const slotDef = BODY_SLOT_DEFS.find(d => d.key === slotKey);
        showDiceTopToast({
          title: 'Item Unequipped',
          breakdown: `"${slot.name}" (${slotDef?.trName || slotKey}) unequipped and returned to backpack.`,
          icon: '📦'
        });
      }
    }

    // Hydrate missing V2 weapon/armor/shield stats on pool or slot items from SRD Compendium & ItemAssembler
    function hydrateGearItemStats(item) {
      if (!item || typeof item !== 'object' || !item.name || item.name === '-') return item;
      const cat = (item.category && item.category !== 'Other')
        ? item.category
        : (typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(item) : (item.type || 'Other'));

      const isWeapon = cat === 'Weapon' || item.type === 'Weapon';
      const isArmorOrShield = cat === 'Armor' || cat === 'Shield' || item.type === 'Armor' || item.type === 'Shield';

      const isStubWeaponFallback = isWeapon && !item._statsHydrated && (
        (item.dice === '1d8' && (!item.critMin || item.critMin === 20) && (!item.critMult || item.critMult === 2) && (!Array.isArray(item.enhancements) || item.enhancements.length === 0)) ||
        !item.handedness
      );
      const missingWeaponStats = isWeapon && (
        ((!Array.isArray(item.damageParts) || item.damageParts.length === 0) && !item.dice) ||
        (!item.critMin && !item.critRange && !item.weaponMeta?.critMin) ||
        isStubWeaponFallback
      );
      const missingArmorStats = isArmorOrShield && (
        (item.acBonus === undefined || item.acBonus === null) &&
        (!Array.isArray(item.modifiers) || !item.modifiers.some(m => m && (m.target === 'ac.armor' || m.target === 'ac.shield' || m.target === 'ac')))
      );
      const missingArmorMeta = (cat === 'Armor' || item.type === 'Armor') && item.maxDex === undefined && !item.armorMeta;

      if (isArmorOrShield) {
        if (item.ruleFlags && item.ruleFlags.bypassDR) {
          delete item.ruleFlags.bypassDR;
        }
        if (Array.isArray(item.tacticalBadges)) {
          item.tacticalBadges = item.tacticalBadges.filter(tb => {
            if (!tb) return false;
            const lbl = typeof tb === 'string' ? tb : (tb.label || tb.name || '');
            return !((typeof tb === 'object' && tb.id === 'bypass-dr') || /^(?:dr\s*bypass|bypass\s*dr)\b/i.test(lbl.trim()));
          });
        }
      }

      if (!missingWeaponStats && !missingArmorStats && !missingArmorMeta && item._statsHydrated) {
        return item;
      }

      let ref = null;
      let fromAssembler = false;
      const srdReady = Boolean(window.SrdCompendium && typeof window.SrdCompendium.isReady === 'function' && window.SrdCompendium.isReady());

      const hasValidStats = (cand) => {
        if (!cand || typeof cand !== 'object') return false;
        if (isWeapon) {
          return (Array.isArray(cand.damageParts) && cand.damageParts.length > 0) || Boolean(cand.dice);
        }
        if (isArmorOrShield) {
          return (cand.acBonus !== undefined && cand.acBonus !== null) ||
            (Array.isArray(cand.modifiers) && cand.modifiers.some(m => m && (m.target === 'ac.armor' || m.target === 'ac.shield' || m.target === 'ac')));
        }
        return true;
      };

      // 1. Try ItemAssembler first for composite/forged items (e.g. "Adamantine Breastplate", "+5 Speed Dire Flail")
      if (window.ItemAssembler && srdReady) {
        try {
          if (item.baseItemId && !String(item.baseItemId).startsWith('mi-') && typeof window.ItemAssembler.assemble === 'function' &&
              (item.enhancementBonus > 0 || item.material || (Array.isArray(item.enhancements) && item.enhancements.length > 0))) {
            const assembled = window.ItemAssembler.assemble({
              baseItemId: item.baseItemId,
              material: item.material,
              enhancementBonus: item.enhancementBonus,
              enhancements: item.enhancements
            });
            if (hasValidStats(assembled)) {
              ref = assembled;
              fromAssembler = true;
            }
          }
          if (!ref && typeof window.ItemAssembler.parseNaturalLanguageItem === 'function') {
            const parsedAssembled = window.ItemAssembler.parseNaturalLanguageItem(item.name);
            if (hasValidStats(parsedAssembled)) {
              ref = parsedAssembled;
              fromAssembler = true;
            }
          }
        } catch (e) { reportError('char_inventory:hasValidStats', e); }
      }

      // 2. Try SrdCompendium direct ID or Name lookup
      if (!ref && window.SrdCompendium) {
        if (item.baseItemId || item.id) {
          const byIdCand = window.SrdCompendium.getById(item.baseItemId || item.id);
          if (hasValidStats(byIdCand)) ref = byIdCand;
        }
        if (!ref && typeof window.SrdCompendium.getByName === 'function') {
          const byNameCand = window.SrdCompendium.getByName(item.masterDbName || item.name);
          if (hasValidStats(byNameCand)) ref = byNameCand;
        }
      }

      // 3. Try Master DB & Bundled SRD Core Catalog
      if (!ref && typeof findMasterItem === 'function') {
        const masterCand = findMasterItem(item.masterDbName || item.name);
        if (hasValidStats(masterCand)) ref = masterCand;
      }
      if (!ref && typeof findBaseItemInSrdCore === 'function') {
        const coreCand = findBaseItemInSrdCore(item.name);
        if (hasValidStats(coreCand)) ref = coreCand;
      }

      if (ref) {
        if ((!item.baseItemId || String(item.baseItemId).startsWith('mi-')) && (ref.baseItemId || ref.id)) {
          item.baseItemId = ref.baseItemId || ref.id;
        }
        if ((fromAssembler || isStubWeaponFallback || !Array.isArray(item.damageParts) || item.damageParts.length === 0) && Array.isArray(ref.damageParts) && ref.damageParts.length > 0) {
          item.damageParts = JSON.parse(JSON.stringify(ref.damageParts));
        }
        if ((fromAssembler || isStubWeaponFallback || !Array.isArray(item.modifiers) || item.modifiers.length === 0) && Array.isArray(ref.modifiers) && ref.modifiers.length > 0) {
          item.modifiers = JSON.parse(JSON.stringify(ref.modifiers));
        }
        if ((fromAssembler || isStubWeaponFallback || !item.ruleFlags || Object.keys(item.ruleFlags).length === 0) && ref.ruleFlags) {
          item.ruleFlags = JSON.parse(JSON.stringify(ref.ruleFlags));
        }
        if ((fromAssembler || isStubWeaponFallback || !Array.isArray(item.tacticalBadges) || item.tacticalBadges.length === 0) && Array.isArray(ref.tacticalBadges) && ref.tacticalBadges.length > 0) {
          item.tacticalBadges = JSON.parse(JSON.stringify(ref.tacticalBadges));
        }
        if ((fromAssembler || isStubWeaponFallback || !item.dice) && (ref.dice || (Array.isArray(ref.damageParts) && ref.damageParts[0]?.dice))) {
          item.dice = ref.dice || ref.damageParts[0].dice;
        }
        if ((fromAssembler || isStubWeaponFallback || !item.dmgType) && (ref.dmgType || (Array.isArray(ref.damageParts) && ref.damageParts[0]?.type))) {
          item.dmgType = ref.dmgType || ref.damageParts[0].type;
        }
        if ((fromAssembler || isStubWeaponFallback || (!item.critMin && !item.critRange)) && (ref.critRange || ref.critMin || ref.weaponMeta?.critMin)) {
          item.critMin = ref.critRange || ref.critMin || ref.weaponMeta?.critMin;
          item.critRange = item.critMin;
        }
        if ((fromAssembler || isStubWeaponFallback || !item.critMult) && (ref.critMult || ref.weaponMeta?.critMult)) {
          item.critMult = ref.critMult || ref.weaponMeta?.critMult;
        }
        if ((fromAssembler || isStubWeaponFallback || !item.handedness) && (ref.handedness || ref.weaponMeta?.handedness)) {
          item.handedness = ref.handedness || ref.weaponMeta?.handedness;
        }
        const refAcMod = Array.isArray(ref.modifiers) ? ref.modifiers.find(m => m && (m.target === 'ac.armor' || m.target === 'ac.shield' || m.target === 'ac')) : null;
        const refAcVal = ref.acBonus !== undefined ? ref.acBonus : (refAcMod && refAcMod.value !== undefined ? Number(refAcMod.value) : undefined);
        if ((fromAssembler || item.acBonus === undefined) && refAcVal !== undefined) {
          item.acBonus = refAcVal;
        }
        if ((fromAssembler || item.maxDex === undefined) && (ref.maxDex !== undefined || ref.armorMeta?.maxDex !== undefined)) {
          item.maxDex = ref.maxDex !== undefined ? ref.maxDex : ref.armorMeta?.maxDex;
        }
        if ((fromAssembler || item.checkPenalty === undefined) && (ref.checkPenalty !== undefined || ref.armorMeta?.acp !== undefined)) {
          item.checkPenalty = ref.checkPenalty !== undefined ? ref.checkPenalty : ref.armorMeta?.acp;
        }
        if ((fromAssembler || item.spellFailure === undefined) && (ref.spellFailure !== undefined || ref.armorMeta?.asf !== undefined)) {
          item.spellFailure = ref.spellFailure !== undefined ? ref.spellFailure : ref.armorMeta?.asf;
        }
        if ((fromAssembler || isStubWeaponFallback || !item.enhancementBonus) && ref.enhancementBonus) {
          item.enhancementBonus = ref.enhancementBonus;
        }
        if ((fromAssembler || isStubWeaponFallback) && isWeapon) {
          if (item.handedness && String(item.handedness).toLowerCase().includes('light')) {
            item.isLight = true;
          }
        }
        if (!item.material && ref.material) {
          item.material = ref.material;
        }
        if (!item.proficiency && (ref.proficiency || ref.weaponMeta?.proficiency)) {
          item.proficiency = ref.proficiency || ref.weaponMeta?.proficiency;
        }
        if (!item.weaponMeta && ref.weaponMeta) {
          item.weaponMeta = JSON.parse(JSON.stringify(ref.weaponMeta));
        }
        if (!item.armorMeta && ref.armorMeta) {
          item.armorMeta = JSON.parse(JSON.stringify(ref.armorMeta));
        }
        if (!item.armorCategory && (ref.armorCategory || ref.armorMeta?.category)) {
          item.armorCategory = ref.armorCategory || ref.armorMeta?.category;
        }
      }

      if (isArmorOrShield) {
        if (item.ruleFlags && item.ruleFlags.bypassDR) {
          delete item.ruleFlags.bypassDR;
        }
        if (Array.isArray(item.tacticalBadges)) {
          item.tacticalBadges = item.tacticalBadges.filter(tb => {
            if (!tb) return false;
            const lbl = typeof tb === 'string' ? tb : (tb.label || tb.name || '');
            return !((typeof tb === 'object' && tb.id === 'bypass-dr') || /^(?:dr\s*bypass|bypass\s*dr)\b/i.test(lbl.trim()));
          });
        }
      } else if (isWeapon && item.ruleFlags && Array.isArray(item.ruleFlags.bypassDR) && item.ruleFlags.bypassDR.length > 0 && Array.isArray(item.tacticalBadges)) {
        item.tacticalBadges = item.tacticalBadges.filter(tb => {
          if (!tb) return false;
          const lbl = typeof tb === 'string' ? tb : (tb.label || tb.name || '');
          return !((typeof tb === 'object' && tb.id === 'bypass-dr') || /^(?:dr\s*bypass|bypass\s*dr)\b/i.test(lbl.trim()));
        });
      }

      if (srdReady) {
        item._statsHydrated = true;
      }
      return item;
    }

    function getEquipmentProficiencyWarning(item) {
      if (!item || typeof item !== 'object' || !item.name || item.name === '-' || typeof RuleEngine === 'undefined' || typeof character === 'undefined' || !character) {
        return null;
      }
      hydrateGearItemStats(item);
      const cat = (item.category && item.category !== 'Other')
        ? item.category
        : (typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(item) : (item.type || 'Other'));
      const isWeapon = cat === 'Weapon' || item.type === 'Weapon';
      const isArmor = cat === 'Armor' || item.type === 'Armor';
      const isShield = cat === 'Shield' || item.type === 'Shield';

      if (isWeapon && typeof RuleEngine.isProficientWithWeapon === 'function') {
        if (!RuleEngine.isProficientWithWeapon(character, item)) {
          const isExotic = RuleEngine.isExoticWeapon && RuleEngine.isExoticWeapon(item);
          const isMartial = !isExotic && RuleEngine.isMartialWeapon && RuleEngine.isMartialWeapon(item);
          const profType = isExotic ? 'Exotic' : (isMartial ? 'Martial' : 'Simple');
          return {
            isNonProficient: true,
            category: 'Weapon',
            profType,
            shortLabel: 'Non-Proficient (-4 Atk)',
            minimalLabel: 'Non-Prof. (-4 Atk)',
            tooltip: `Non-Proficient (${profType} Weapon): -4 penalty on attack rolls per D&D 3.5e RAW.`
          };
        }
      } else if (isArmor && typeof RuleEngine.isProficientWithArmor === 'function') {
        if (!RuleEngine.isProficientWithArmor(character, item)) {
          const armorCat = item.effectiveArmorCategory || item.armorCategory || item.armorMeta?.category || 'Armor';
          return {
            isNonProficient: true,
            category: 'Armor',
            profType: armorCat,
            shortLabel: 'Non-Proficient (ACP to Atk)',
            minimalLabel: 'Non-Prof. (ACP)',
            tooltip: `Non-Proficient (${armorCat} Armor): Armor Check Penalty applies to attack rolls and all STR/DEX checks per D&D 3.5e RAW.`
          };
        }
      } else if (isShield && typeof RuleEngine.isProficientWithShield === 'function') {
        if (!RuleEngine.isProficientWithShield(character, item)) {
          const isTower = RuleEngine.isTowerShield && RuleEngine.isTowerShield(item);
          const shieldType = isTower ? 'Tower Shield' : 'Shield';
          return {
            isNonProficient: true,
            category: 'Shield',
            profType: shieldType,
            shortLabel: 'Non-Proficient (ACP to Atk)',
            minimalLabel: 'Non-Prof. (ACP)',
            tooltip: `Non-Proficient (${shieldType}): Armor Check Penalty applies to attack rolls and all STR/DEX checks per D&D 3.5e RAW.`
          };
        }
      }
      return null;
    }

    function renderGearItemStatsBadgesHtml(rawItem, options = {}) {
      if (!rawItem || typeof rawItem !== 'object' || !rawItem.name || rawItem.name === '-') return '';
      const item = Object.assign({}, rawItem);
      hydrateGearItemStats(item);

      const compact = Boolean(options.compact);
      const minimal = Boolean(options.minimal);
      const sizeCls = compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
      const cat = (item.category && item.category !== 'Other')
        ? item.category
        : (typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(item) : (item.type || 'Other'));
      const isWeapon = cat === 'Weapon' || item.type === 'Weapon';
      const isArmor = cat === 'Armor' || item.type === 'Armor';
      const isShield = cat === 'Shield' || item.type === 'Shield';

      const coreParts = [];
      const propParts = [];

      const profWarn = getEquipmentProficiencyWarning(item);
      if (profWarn) {
        const warnText = minimal ? profWarn.minimalLabel : profWarn.shortLabel;
        coreParts.push(`<span class="inline-flex items-center gap-1 rounded-md border font-mono font-bold ${sizeCls} bg-rose-950/90 text-rose-300 border-rose-500/80 shadow-sm" title="${UI.escapeAttr(profWarn.tooltip)}"><span>⚠️ ${warnText}</span></span>`);
      }

      if (isWeapon) {
        // 1. Damage Parts Badges (with polyhedral SVG dice icons)
        let dmgParts = Array.isArray(item.damageParts) && item.damageParts.length > 0 ? item.damageParts : null;
        if (!dmgParts && item.dice) {
          dmgParts = [{
            dice: item.dice,
            bonus: Number(item.enhancementBonus) || 0,
            type: item.dmgType || 'Physical',
            multiplyOnCrit: true
          }];
        }
        if (dmgParts && window.DnDUI && typeof window.DnDUI.renderDamagePartsBadges === 'function') {
          const dmgHtml = window.DnDUI.renderDamagePartsBadges(dmgParts, { compact });
          if (dmgHtml) coreParts.push(dmgHtml);
        }

        // 2. Attack Bonus Badge (+X Atk)
        const atkMod = (item.modifiers || []).find(m => m && (m.target === 'attack.weapon' || m.target === 'attack' || m.target === 'attack.all'));
        const atkVal = atkMod ? (Number(atkMod.value) || 0) : (Number(item.enhancementBonus) || 0);
        if (atkVal !== 0) {
          const atkCls = atkVal > 0
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
            : 'bg-rose-950/80 text-rose-300 border-rose-600/60';
          coreParts.push(`<span class="inline-flex items-center gap-1 rounded-md border font-mono font-bold ${sizeCls} ${atkCls}" title="Weapon Attack Bonus"><span>⚔️ ${atkVal > 0 ? '+' + atkVal : atkVal} Atk</span></span>`);
        }

        // 3. Critical Threat Range & Multiplier Badge
        const cMin = Number(item.critRange || item.critMin || item.weaponMeta?.critMin) || 20;
        const cMult = Number(item.critMult || item.weaponMeta?.critMult) || 2;
        const critStr = cMin < 20 ? `${cMin}-20/×${cMult}` : `×${cMult}`;
        coreParts.push(`<span class="inline-flex items-center gap-1 rounded-md border font-mono font-bold ${sizeCls} bg-amber-950/75 text-amber-300 border-amber-600/50" title="Critical Threat Range &amp; Multiplier"><span>🎯 ${critStr}</span></span>`);

        // 4. Handedness / Double Weapon / Range Badge
        if (!minimal) {
          const isDouble = Boolean(item.ruleFlags?.doubleWeapon || (typeof RuleEngine !== 'undefined' && RuleEngine.isDoubleWeapon && RuleEngine.isDoubleWeapon(item)));
          const rawHand = String(item.handedness || item.weaponMeta?.handedness || item.grip || '');
          let gripLabel = '';
          if (isDouble) gripLabel = 'Double Weapon';
          else if (/^(?:2h|two|2-hand)/i.test(rawHand)) gripLabel = '2-Hand';
          else if (/light/i.test(rawHand)) gripLabel = 'Light';
          else if (/^(?:1h|one|1-hand)/i.test(rawHand)) gripLabel = '1-Hand';
          else if (/ranged/i.test(rawHand)) gripLabel = 'Ranged';
          if (gripLabel) {
            coreParts.push(`<span class="inline-flex items-center gap-1 rounded-md border font-semibold ${sizeCls} bg-slate-800/90 text-slate-300 border-slate-700">${gripLabel}</span>`);
          }
        }

        // 5. Remaining non-attack modifiers & tactical badges (Row 2: Special Properties)
        if (!minimal) {
          const hasDrBypassBadge = Array.isArray(item.tacticalBadges) && item.tacticalBadges.some(tb => {
            const lbl = typeof tb === 'string' ? tb : (tb?.label || tb?.name || '');
            return /dr\s*bypass/i.test(lbl);
          });
          const otherMods = (item.modifiers || []).filter(m => {
            if (!m || m.target === 'attack.weapon' || m.target === 'attack') return false;
            if (m.target === 'dr.bypass' && hasDrBypassBadge) return false;
            return true;
          });
          if (otherMods.length > 0 && window.DnDUI && typeof window.DnDUI.renderModifiersBadges === 'function') {
            const modHtml = window.DnDUI.renderModifiersBadges(otherMods, { compact });
            if (modHtml) propParts.push(modHtml);
          }
          if (window.DnDUI && typeof window.DnDUI.renderTacticalBadges === 'function') {
            const tacHtml = window.DnDUI.renderTacticalBadges(item, { compact });
            if (tacHtml) propParts.push(tacHtml);
          }
        }
      } else if (isArmor || isShield) {
        // 1. Armor / Shield AC Bonus Badge
        const acMod = (item.modifiers || []).find(m => m && (m.target === 'ac.armor' || m.target === 'ac.shield' || m.target === 'ac'));
        const acVal = acMod ? (Number(acMod.value) || 0) : (Number(item.acBonus) || 0);
        const enhVal = Number(item.enhancementBonus) || 0;
        if (acVal > 0) {
          const acLabel = isShield ? `+${acVal} Shield AC` : `+${acVal} Armor AC`;
          const acTitle = `${isShield ? 'Shield' : 'Armor'} Bonus to AC${enhVal > 0 ? ` (includes +${enhVal} Enhancement)` : ''}`;
          coreParts.push(`<span class="inline-flex items-center gap-1 rounded-md border font-mono font-bold ${sizeCls} bg-sky-950/85 text-sky-200 border-sky-500/70 shadow-sm" title="${acTitle}"><span>🛡️ ${acLabel}</span></span>`);
        }

        // 2. Max DEX Bonus Badge
        const maxDex = item.maxDex !== undefined ? item.maxDex : item.armorMeta?.maxDex;
        if (maxDex !== null && maxDex !== undefined && maxDex !== '' && !isNaN(Number(maxDex))) {
          coreParts.push(`<span class="inline-flex items-center gap-1 rounded-md border font-mono font-semibold ${sizeCls} bg-slate-800/90 text-emerald-300 border-slate-600/70" title="Maximum DEX Bonus to AC"><span>Max DEX +${Number(maxDex)}</span></span>`);
        }

        // 3. Armor Check Penalty (ACP) Badge
        const acp = item.checkPenalty !== undefined ? item.checkPenalty : item.armorMeta?.acp;
        if (acp !== null && acp !== undefined && acp !== '' && !isNaN(Number(acp)) && Number(acp) !== 0) {
          coreParts.push(`<span class="inline-flex items-center gap-1 rounded-md border font-mono font-semibold ${sizeCls} bg-rose-950/60 text-rose-300 border-rose-700/50" title="Armor Check Penalty"><span>ACP ${Number(acp)}</span></span>`);
        }

        // 4. Arcane Spell Failure (ASF) Badge
        if (!minimal) {
          const asf = item.spellFailure !== undefined ? item.spellFailure : item.armorMeta?.asf;
          if (asf !== null && asf !== undefined && Number(asf) > 0) {
            coreParts.push(`<span class="inline-flex items-center gap-1 rounded-md border font-mono font-semibold ${sizeCls} bg-indigo-950/60 text-indigo-300 border-indigo-700/50" title="Arcane Spell Failure Chance"><span>ASF ${Number(asf)}%</span></span>`);
          }
        }

        // 5. Other Modifiers & Tactical Badges (Row 2: DR 2/-, Mithral, Fortification, etc.)
        const hasDrBadge = Array.isArray(item.tacticalBadges) && item.tacticalBadges.some(tb => {
          const lbl = typeof tb === 'string' ? tb : (tb?.label || tb?.name || '');
          return /^dr\b/i.test(lbl);
        });
        const otherMods = (item.modifiers || []).filter(m => {
          if (!m || !m.target) return false;
          if (m.target === 'ac.armor' || m.target === 'ac.shield') return false;
          if (m.target === 'dr' && hasDrBadge) return false;
          return true;
        });
        if (otherMods.length > 0 && window.DnDUI && typeof window.DnDUI.renderModifiersBadges === 'function') {
          const modHtml = window.DnDUI.renderModifiersBadges(otherMods, { compact });
          if (modHtml) propParts.push(modHtml);
        }
        if (window.DnDUI && typeof window.DnDUI.renderTacticalBadges === 'function') {
          const tacHtml = window.DnDUI.renderTacticalBadges(item, { compact });
          if (tacHtml) propParts.push(tacHtml);
        }
      } else {
        // Wondrous / Rings / Cloaks / Belts / Consumables
        if (Array.isArray(item.damageParts) && item.damageParts.length > 0 && window.DnDUI && typeof window.DnDUI.renderDamagePartsBadges === 'function') {
          const dmgHtml = window.DnDUI.renderDamagePartsBadges(item.damageParts, { compact });
          if (dmgHtml) coreParts.push(dmgHtml);
        }
        if (Array.isArray(item.modifiers) && item.modifiers.length > 0 && window.DnDUI && typeof window.DnDUI.renderModifiersBadges === 'function') {
          const modHtml = window.DnDUI.renderModifiersBadges(item.modifiers, { compact });
          if (modHtml) coreParts.push(modHtml);
        }
        if (window.DnDUI && typeof window.DnDUI.renderTacticalBadges === 'function') {
          const tacHtml = window.DnDUI.renderTacticalBadges(item, { compact });
          if (tacHtml) propParts.push(tacHtml);
        }
      }

      if (coreParts.length === 0 && propParts.length === 0) return '';
      const marginCls = options.noMargin ? '' : ' mb-1';
      if (coreParts.length > 0 && propParts.length > 0) {
        return `<div class="flex flex-col gap-1${marginCls}"><div class="flex flex-wrap items-center gap-1">${coreParts.join('')}</div><div class="flex flex-wrap items-center gap-1">${propParts.join('')}</div></div>`;
      }
      const singleRow = coreParts.length > 0 ? coreParts : propParts;
      return `<div class="flex flex-wrap items-center gap-1${marginCls}">${singleRow.join('')}</div>`;
    }

    // Render Gear Pool Table (Madde 6 & 8)
    function renderGearPoolTable() {
      const tbody = document.getElementById('gear-pool-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      const query = (document.getElementById('pool-search-input')?.value || '').toLowerCase().trim();
      const catFilter = document.getElementById('pool-category-filter')?.value || 'All';

      // Build normalized view rows without mutating character.gearPool in place
      const poolRows = (character.gearPool || []).filter(Boolean).map(rawItem => {
        const item = Object.assign({}, rawItem);
        if (!item.category || item.category === 'Other') {
          const autoCat = mapEntryToGearCategory(item);
          if (autoCat && autoCat !== 'Other') {
            item.category = autoCat;
            const base = findBaseItemInSrdCore(item.name);
            if (base && base.slot) {
              item.slot = base.slot;
            } else if (autoCat === 'Weapon' && (!item.slot || item.slot === 'None' || item.slot === 'Other' || item.slot === '-')) {
              item.slot = 'Main Hand';
            }
          }
        }
        return item;
      });

      const filtered = poolRows.filter(item => {
        if (item.isEquipped) return false; // Equipped items are shown in body slots
        if (typeof RuleEngine !== 'undefined' && RuleEngine.isOffHandWeaponHead && RuleEngine.isOffHandWeaponHead(item)) return false;
        const matchesQuery = !query || item.name.toLowerCase().includes(query) || (item.desc || '').toLowerCase().includes(query);
        const matchesCat = (catFilter === 'All') || (item.category === catFilter);
        return matchesQuery && matchesCat;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-500 italic">No items found in inventory pool.</td></tr>`;
        return;
      }

      filtered.forEach(item => {
        const statsBadgesHtml = renderGearItemStatsBadgesHtml(item, { compact: true });
        const profWarn = getEquipmentProficiencyWarning(item);
        const safeIdAttr = String(item.id ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-900/60 transition border-b border-slate-800/80';
        tr.innerHTML = `
          <td class="py-2 px-3 align-middle font-semibold text-purple-400">${UI.escapeHtml(item.category)}</td>
          <td class="py-2 px-3 align-middle font-bold text-white">
            <div class="flex items-center gap-1.5">
              <span>${UI.escapeHtml(item.name)}</span>
              ${profWarn ? `<span class="text-rose-400 text-xs shrink-0 cursor-help" title="${UI.escapeAttr(profWarn.tooltip)}">⚠️</span>` : ''}
            </div>
          </td>
          <td class="py-2 px-3 align-middle text-slate-300 text-xs">
            ${statsBadgesHtml}
            <div>${UI.escapeHtml(item.desc || '-')}</div>
          </td>
          <td class="py-2 px-3 text-center align-middle font-mono">
            <div class="flex items-center justify-center gap-1">
              <button data-action="inventory:adjust-pool-qty" data-item-id="${safeIdAttr}" data-delta="-1" class="ui-btn-icon w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs leading-none inline-flex items-center justify-center cursor-pointer">-</button>
              <span class="w-6 text-center ${Number(item.qty) <= 0 ? 'text-rose-400 font-bold' : 'text-white font-bold'}">${(item.qty !== undefined && item.qty !== null) ? Number(item.qty) : 1}</span>
              <button data-action="inventory:adjust-pool-qty" data-item-id="${safeIdAttr}" data-delta="1" class="ui-btn-icon w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs leading-none inline-flex items-center justify-center cursor-pointer">+</button>
            </div>
          </td>
          <td class="py-2 px-3 text-center align-middle font-mono text-slate-400">${item.weight || 0} lb</td>
          <td class="py-2 px-3 text-center align-middle font-mono text-amber-400">${item.cost || 0} GP</td>
          <td class="py-2.5 px-3 text-center align-middle">
            <div class="flex items-center justify-center gap-1.5">
              ${isConsumableOrSlotless(item) ? `
                <div class="flex flex-col gap-1.5 w-20">
                  <button data-action="inventory:use-pool-item" data-item-id="${safeIdAttr}" class="ui-btn-xs w-full h-6 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 text-[11px] font-bold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm" title="Consume / Activate / Use">
                    <span>🧪</span><span>Use</span>
                  </button>
                  <button data-action="inventory:toggle-pool-belt" data-item-id="${safeIdAttr}" class="ui-btn-xs w-full h-6 ${item.isBelt ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-600 shadow-sm shadow-emerald-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'} border text-[11px] font-bold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm" title="${item.isBelt ? 'Remove from Belt (Disable Quick Access)' : 'Attach to Belt (Add to Combat Quick Access)'}">
                    <span>${item.isBelt ? '🟢' : '⚡'}</span><span>${item.isBelt ? 'On Belt' : 'Belt'}</span>
                  </button>
                </div>
              ` : `
                <div class="w-20 flex items-center justify-center">
                  <button data-action="inventory:equip-pool-item" data-item-id="${safeIdAttr}" class="ui-btn-sm w-full h-7 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-[11px] font-bold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm" title="Equip to Body Slot">
                    <span>⚡</span><span>Equip</span>
                  </button>
                </div>
              `}
              ${isForgeEditableItem(item) ? `
                <button data-action="inventory:forge-pool-item" data-item-id="${safeIdAttr}" class="w-7 h-7 flex items-center justify-center bg-amber-950/80 hover:bg-amber-800 border border-amber-600/60 text-amber-300 hover:text-white text-xs rounded-md transition cursor-pointer shrink-0" title="Customize in Item Forge (Material, +1..+5, Keen, Flaming...)">
                  ⚒️
                </button>
              ` : ''}
              <button data-action="inventory:delete-pool-item" data-item-id="${safeIdAttr}" class="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 text-xs rounded-md transition cursor-pointer shrink-0" title="Delete">
                🗑️
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function togglePoolBelt(itemId) {
      if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function' && window.CharStore.getDoc()) {
        window.CharStore.dispatch({
          type: 'inventory/togglePoolBelt',
          payload: { itemId },
          meta: { label: 'Toggle Belt Quick-Access' }
        });
        if (typeof syncAutomatedCombatPins === 'function') syncAutomatedCombatPins(character);
        renderAll();
        return;
      }
      const item = (character.gearPool || []).find(p => p && String(p.id) === String(itemId));
      if (item) {
        item.isBelt = !item.isBelt;
        if (typeof syncAutomatedCombatPins === 'function') syncAutomatedCombatPins(character);
        saveStateToStorage(true);
        renderAll();
      }
    }

    function adjustPoolQty(itemId, delta) {
      if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function' && window.CharStore.getDoc()) {
        window.CharStore.dispatch({
          type: 'inventory/adjustPoolQty',
          payload: { itemId, delta },
          meta: { label: `Adjust Item Qty (${delta > 0 ? '+' : ''}${delta})` }
        });
        renderAll();
        return;
      }
      const item = (character.gearPool || []).find(p => p && String(p.id) === String(itemId));
      if (item) {
        const currentQty = (item.qty !== undefined && item.qty !== null) ? Number(item.qty) : 1;
        item.qty = Math.max(0, currentQty + delta);
        const cleanName = (item.name || '').toLowerCase().trim();
        if ((item.category === 'Consumable' || item.isBelt) && !isWeaponWithoutMagicOrHealing(item)) {
          if (!Array.isArray(character.consumables)) character.consumables = [];
          const match = character.consumables.find(c => (c.name || '').toLowerCase().trim() === cleanName);
          if (match) {
            match.qty = item.qty;
          } else {
            character.consumables.push({
              name: item.name,
              qty: item.qty,
              effect: item.desc || 'Consumable effect'
            });
          }
        }
        saveStateToStorage(true);
        renderAll();
      }
    }

    async function deletePoolItem(itemId) {
      if ((await DnDUI.confirm('Are you sure you want to delete this item from your inventory pool?', { tone: 'danger' }))) {
        if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function' && window.CharStore.getDoc()) {
          window.CharStore.dispatch({
            type: 'inventory/deletePoolItem',
            payload: { itemId },
            meta: { label: 'Delete Inventory Item' }
          });
          renderAll();
          return;
        }
        const item = (character.gearPool || []).find(p => p && String(p.id) === String(itemId));
        if (item) {
          const cleanName = (item.name || '').toLowerCase().trim();
          if (Array.isArray(character.consumables)) {
            character.consumables = character.consumables.filter(c => (c.name || '').toLowerCase().trim() !== cleanName);
          }
        }
        character.gearPool = (character.gearPool || []).filter(p => !p || String(p.id) !== String(itemId));
        saveStateToStorage(true);
        renderAll();
      }
    }

    // Equip item from pool into the correct body slot (Madde 8)
    function equipPoolItem(itemId, targetSlotKeyOverride = null) {
      const item = (character.gearPool || []).find(p => p && String(p.id) === String(itemId));
      if (!item) return;

      if (isConsumableOrSlotless(item)) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Slotless Item',
            breakdown: `"${item.name}" does not occupy a body slot (used from backpack/belt).`,
            icon: '🎒'
          });
        } else {
          alert(`⚠️ "${item.name}" (Consumable / Scroll / Slotless Item) does not occupy a wearable body slot!\n\nIt is carried in your backpack or belt and can be used or consumed directly.`);
        }
        return;
      }

      const hasStore = Boolean(typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function' && window.CharStore.getDoc());
      const hasOversized = RuleEngine.hasOversizedWeaponFeat(character);
      let targetSlotKey = targetSlotKeyOverride || null;
      let twoHandWarningMsg = null;

      if (item.category === 'Weapon') {
        const isOffHead = typeof RuleEngine !== 'undefined' && RuleEngine.isOffHandWeaponHead && RuleEngine.isOffHandWeaponHead(item);
        const isDouble = typeof RuleEngine !== 'undefined' && RuleEngine.isDoubleWeapon && RuleEngine.isDoubleWeapon(item);
        const isTwoHand = RuleEngine.isTwoHandedWeapon(item);
        const mh = character.bodySlots?.mainHand;
        const oh = character.bodySlots?.offHand;

        if (isOffHead) {
          // Off-Hand Head of a Double Weapon ALWAYS equips to Off-Hand
          targetSlotKey = targetSlotKeyOverride || 'offHand';
          const mhIsDouble = mh && mh.name && mh.name !== '-' && RuleEngine.isDoubleWeapon && RuleEngine.isDoubleWeapon(mh);
          const mhIsTwoHand = mh && mh.name && mh.name !== '-' && RuleEngine.isTwoHandedWeapon(mh) && !mhIsDouble;
          if (mhIsTwoHand && !hasOversized) {
            const prevMhName = mh.name;
            if (!hasStore) unequipSlot('mainHand', true);
            twoHandWarningMsg = `Unequipped two-handed "${prevMhName}" to equip "${item.name}" in off-hand.`;
          }
          // If Main Hand is empty and the parent Double Weapon is in the pool unequipped, auto-equip parent in Main Hand
          const curMh = character.bodySlots?.mainHand;
          if (!curMh || !curMh.name || curMh.name === '-') {
            const baseParentName = String(item.parent || item.name || '')
              .replace(/^↳\s*/, '')
              .replace(/\s*\(.*?\)\s*$/, '')
              .trim()
              .toLowerCase();
            const parentPoolItem = (character.gearPool || []).find(p =>
              p && !p.isEquipped && p.id !== item.id &&
              !(RuleEngine.isOffHandWeaponHead && RuleEngine.isOffHandWeaponHead(p)) &&
              String(p.name || '').trim().toLowerCase() === baseParentName
            );
            if (parentPoolItem) {
              equipPoolItem(parentPoolItem.id, 'mainHand');
            }
          }
        } else if (isTwoHand) {
          // A Two-Handed / Double weapon occupies Main Hand
          targetSlotKey = 'mainHand';

          // Keep off-hand if equipping a Double Weapon and off-hand holds an Off-Hand Head
          const ohIsOffHead = oh && oh.name && oh.name !== '-' && RuleEngine.isOffHandWeaponHead && RuleEngine.isOffHandWeaponHead(oh);
          if (oh && oh.name && oh.name !== '-' && !hasOversized && !(isDouble && ohIsOffHead)) {
            const prevOhName = oh.name;
            if (!hasStore) unequipSlot('offHand', true);
            twoHandWarningMsg = `Unequipped off-hand "${prevOhName}" because "${item.name}" is a two-handed weapon.`;
          }
        } else if (!targetSlotKey) {
          // One-handed or light weapon (e.g. Rapier, Dagger)
          if (!mh || !mh.name || mh.name === '-') {
            targetSlotKey = 'mainHand';
          } else {
            // Check if Main Hand is already wielding a non-double two-handed weapon
            const mhIsDouble = RuleEngine.isDoubleWeapon && RuleEngine.isDoubleWeapon(mh);
            const mhIsTwoHand = RuleEngine.isTwoHandedWeapon(mh) && !mhIsDouble;
            if (mhIsTwoHand && !hasOversized) {
              const prevMhName = mh.name;
              if (!hasStore) unequipSlot('mainHand', true);
              targetSlotKey = 'mainHand';
              twoHandWarningMsg = `Unequipped two-handed "${prevMhName}" and equipped "${item.name}" in main hand.`;
            } else {
              targetSlotKey = 'offHand'; // Dual wield with 1-hand or light weapon
            }
          }
        } else if (targetSlotKey === 'offHand') {
          const mhIsDouble = mh && mh.name && mh.name !== '-' && RuleEngine.isDoubleWeapon && RuleEngine.isDoubleWeapon(mh);
          const mhIsTwoHand = mh && mh.name && mh.name !== '-' && RuleEngine.isTwoHandedWeapon(mh) && !mhIsDouble;
          if (mhIsTwoHand && !hasOversized) {
            const prevMhName = mh.name;
            if (!hasStore) unequipSlot('mainHand', true);
            twoHandWarningMsg = `Unequipped two-handed "${prevMhName}" to equip "${item.name}" in off-hand.`;
          }
        }
      } else if (item.category === 'Shield') {
        const mh = character.bodySlots?.mainHand;
        const mhIsTwoHand = mh && mh.name && mh.name !== '-' && RuleEngine.isTwoHandedWeapon(mh);

        if (mhIsTwoHand && !hasOversized) {
          const prevMhName = mh.name;
          if (!hasStore) unequipSlot('mainHand', true);
          twoHandWarningMsg = `Unequipped two-handed "${prevMhName}" and equipped shield "${item.name}".`;
        }
        targetSlotKey = targetSlotKeyOverride || 'offHand';
      } else if (item.category === 'Ring' || (item.slot || '').toLowerCase().includes('ring')) {
        if (!targetSlotKey) {
          const r1 = character.bodySlots?.ring1;
          if (!r1 || !r1.name || r1.name === '-') {
            targetSlotKey = 'ring1';
          } else {
            targetSlotKey = 'ring2';
          }
        }
      } else if (!targetSlotKey) {
        targetSlotKey = getValidSlotForItem(item);
      }

      if (!targetSlotKey) {
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: 'Invalid Body Slot',
            breakdown: `Could not determine a valid body slot for "${item.name}".`,
            icon: '⚠️'
          });
        } else {
          alert(`⚠️ Could not determine a valid D&D 3.5e body slot for "${item.name}".\n\nPlease check the item's "Slot" field (Head, Torso, Boots, etc.).`);
        }
        return;
      }

      if (targetSlotKeyOverride) {
        const validSlot = getValidSlotForItem(item);
        const isCompatible = targetSlotKeyOverride === validSlot ||
          (validSlot === 'ring1' && targetSlotKeyOverride === 'ring2') ||
          (validSlot === 'mainHand' && (targetSlotKeyOverride === 'offHand' || targetSlotKeyOverride === 'mainHand')) ||
          (targetSlotKeyOverride === 'offHand' && (item.category === 'Shield' || item.category === 'Weapon'));
        if (!isCompatible) {
          const def = BODY_SLOT_DEFS.find(d => d.key === targetSlotKeyOverride);
          if (typeof showDiceTopToast === 'function') {
            showDiceTopToast({
              title: 'Incompatible Slot',
              breakdown: `"${item.name}" cannot be equipped in ${def?.trName || targetSlotKeyOverride}.`,
              icon: '⚠️'
            });
          } else {
            alert(`⚠️ "${item.name}" cannot be equipped in ${def?.trName || targetSlotKeyOverride}!\n\nD&D 3.5e RAW Rule: Valid slot for this item is '${validSlot || 'None'}'.`);
          }
          return;
        }
      }

      if (hasStore) {
        window.CharStore.dispatch({
          type: 'inventory/equipPoolItem',
          payload: { itemId, forceSlotKey: targetSlotKey },
          meta: { label: `Equip ${item.name || 'Item'}` }
        });
        const out = window.CharStore.getLastOutcome ? window.CharStore.getLastOutcome() : null;
        if (out && out.twoHandWarningMsg && !twoHandWarningMsg) {
          twoHandWarningMsg = out.twoHandWarningMsg;
        }
        try { renderWeaponSetsUI(); } catch (e) { reportError('char_inventory:equipPoolItem', e); }
        try { recalculateOffense(); } catch (e) { reportError('char_inventory:equipPoolItem', e); }
        renderAll();
        const slotDef = BODY_SLOT_DEFS.find(d => d.key === targetSlotKey);
        const slotLabel = slotDef?.trName || targetSlotKey;
        let toastIcon = '⚔️';
        let toastTitle = 'Weapon Equipped';
        if (item.category === 'Shield') {
          toastIcon = '🛡️';
          toastTitle = 'Shield Equipped';
        } else if (item.category === 'Armor') {
          toastIcon = '🛡️';
          toastTitle = 'Armor Equipped';
        } else if (item.category !== 'Weapon') {
          toastIcon = '✨';
          toastTitle = 'Item Equipped';
        }
        const breakdownText = twoHandWarningMsg
          ? twoHandWarningMsg
          : `Equipped "${item.name}" (${slotLabel}). Defense and stats updated.`;
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            title: toastTitle,
            breakdown: breakdownText,
            icon: toastIcon
          });
        } else {
          alert(breakdownText);
        }
        return;
      }

      // Unequip currently equipped item in that slot if any
      const existing = character.bodySlots?.[targetSlotKey];
      if (existing && existing.name && existing.name !== '-') {
        unequipSlot(targetSlotKey, true);
      }

      // Equip new item with full properties
      hydrateGearItemStats(item);
      character.bodySlots[targetSlotKey] = {
        baseItemId: item.baseItemId,
        name: item.name,
        masterDbName: item.masterDbName || item.name,
        category: item.category,
        active: true,
        weight: item.weight || 0,
        cost: item.cost || 0,
        desc: item.desc || item.description || '',
        benefit: item.benefit || '',
        description: item.description || item.desc || '',
        scope: item.scope || '',
        targetSkill: item.targetSkill || '',
        material: item.material,
        enhancementBonus: item.enhancementBonus,
        enhancements: Array.isArray(item.enhancements) ? item.enhancements.slice() : undefined,
        dice: item.dice || (Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0].dice : undefined),
        critMin: item.critMin || item.critRange || item.weaponMeta?.critMin,
        critRange: item.critRange || item.critMin || item.weaponMeta?.critMin,
        critMult: item.critMult || item.weaponMeta?.critMult,
        handedness: item.handedness || item.weaponMeta?.handedness,
        dmgType: item.dmgType || (Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0].type : undefined),
        isLight: item.isLight || (typeof RuleEngine !== 'undefined' && RuleEngine.isLightWeapon && RuleEngine.isLightWeapon(item)),
        parent: item.parent,
        damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : undefined,
        modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : undefined,
        acBonus: item.acBonus,
        bonusType: item.bonusType,
        strBonus: item.strBonus,
        dexBonus: item.dexBonus,
        conBonus: item.conBonus,
        intBonus: item.intBonus,
        wisBonus: item.wisBonus,
        chaBonus: item.chaBonus,
        skillBonus: item.skillBonus,
        skillBonuses: item.skillBonuses ? JSON.parse(JSON.stringify(item.skillBonuses)) : undefined,
        fortBonus: item.fortBonus,
        refBonus: item.refBonus,
        willBonus: item.willBonus,
        speedBonus: item.speedBonus,
        clBonus: item.clBonus,
        maxDex: item.maxDex,
        checkPenalty: item.checkPenalty,
        spellFailure: item.spellFailure,
        ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : undefined,
        tacticalBadges: Array.isArray(item.tacticalBadges) ? JSON.parse(JSON.stringify(item.tacticalBadges)) : undefined,
        combatModifiers: item.combatModifiers ? JSON.parse(JSON.stringify(item.combatModifiers)) : undefined
      };
      item.isEquipped = true;

      // Sync character.weapons and activeWeapon if equipping a weapon
      if (item.category === 'Weapon') {
        if (!Array.isArray(character.weapons)) character.weapons = [];
        const isTwoHand = RuleEngine.isTwoHandedWeapon(item);
        const existingWep = character.weapons.find(w => (w.name || '').toLowerCase() === item.name.toLowerCase());
        const targetGrip = isTwoHand ? '2-Hand' : (targetSlotKey === 'offHand' ? 'Off-Hand' : '1-Hand');

        if (existingWep) {
          existingWep.grip = targetGrip;
          hydrateGearItemStats(existingWep);
          if (item.dice) existingWep.dice = item.dice;
          if (item.critMin || item.critRange) existingWep.critMin = item.critMin || item.critRange;
          if (item.critMult) existingWep.critMult = item.critMult;
          if (item.dmgType) existingWep.dmgType = item.dmgType;
          if (item.handedness) existingWep.handedness = item.handedness;
          if (item.enhancementBonus !== undefined) existingWep.enhancementBonus = item.enhancementBonus;
          if (item.isLight !== undefined) existingWep.isLight = item.isLight;
          if (Array.isArray(item.damageParts) && item.damageParts.length > 0) existingWep.damageParts = JSON.parse(JSON.stringify(item.damageParts));
          if (Array.isArray(item.modifiers) && item.modifiers.length > 0) existingWep.modifiers = JSON.parse(JSON.stringify(item.modifiers));
        } else {
          character.weapons.push({
            baseItemId: item.baseItemId,
            name: item.name,
            grip: targetGrip,
            handedness: item.handedness || item.weaponMeta?.handedness,
            dice: item.dice || (Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0].dice : (isTwoHand ? '2d6' : '1d6')),
            critMin: item.critMin || item.critRange || item.weaponMeta?.critMin || (item.name.toLowerCase().includes('jovar') || item.name.toLowerCase().includes('rapier') ? 18 : 20),
            critMult: item.critMult || item.weaponMeta?.critMult || 2,
            enhancementBonus: item.enhancementBonus || 0,
            dmgType: item.dmgType || (Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0].type : 'Slashing'),
            bonusType: item.bonusType || 'Enhancement',
            isLight: item.isLight || (typeof RuleEngine !== 'undefined' && RuleEngine.isLightWeapon && RuleEngine.isLightWeapon(item)),
            damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : undefined,
            modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : undefined,
            ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : undefined,
            tags: isTwoHand ? ['two-handed'] : (targetSlotKey === 'offHand' ? ['off-hand'] : [])
          });
        }
        if (targetSlotKey === 'mainHand') {
          character.activeWeapon = item.name;
        }
      }

      // Reverse sync: update tactical weapon sets when equipped from inventory/gearPool
      ensureWeaponSetsData();
      if (targetSlotKey === 'mainHand') {
        const isDoubleWep = typeof RuleEngine !== 'undefined' && RuleEngine.isDoubleWeapon && RuleEngine.isDoubleWeapon(item);
        const isTwoHandWep = typeof RuleEngine !== 'undefined' && RuleEngine.isTwoHandedWeapon && RuleEngine.isTwoHandedWeapon(item);
        if (character.tactical?.weaponSets?.set1) {
          character.tactical.weaponSets.set1.mainWeapon = item.name;
          character.tactical.weaponSets.set1.grip = (isDoubleWep || isTwoHandWep) ? '2-Hand' : '1-Hand';
        }
        const gripSelectEl = document.getElementById('active-grip-select');
        if (gripSelectEl) gripSelectEl.value = (isDoubleWep || isTwoHandWep) ? '2-Hand' : '1-Hand';
        if (isDoubleWep && character.tactical?.weaponSets?.set2) {
          character.tactical.weaponSets.set2.mainWeapon = item.name;
          character.tactical.weaponSets.set2.grip = 'Off-Hand';
          character.tactical.weaponSets.activeSets = [1];
          character.tactical.weaponSets.activeSet = 1;
          character.activeOffHand = 'None';
        } else if (!isTwoHandWep && character.bodySlots?.offHand?.name && character.bodySlots.offHand.name !== '-') {
          // If an off-hand item is already equipped when equipping a 1-hand main weapon, keep both active
          if (character.tactical?.weaponSets) {
            character.tactical.weaponSets.set2.mainWeapon = character.bodySlots.offHand.name;
            character.tactical.weaponSets.set2.grip = 'Off-Hand';
            character.tactical.weaponSets.activeSets = [1, 2];
            character.tactical.weaponSets.activeSet = 'both';
          }
          character.activeOffHand = character.bodySlots.offHand.name;
        }
        character.activeWeapon = item.name;
      } else if (targetSlotKey === 'offHand') {
        if (character.tactical?.weaponSets?.set1) {
          character.tactical.weaponSets.set1.grip = '1-Hand';
        }
        const gripSelectEl = document.getElementById('active-grip-select');
        if (gripSelectEl) gripSelectEl.value = '1-Hand';
        if (character.tactical?.weaponSets?.set2) {
          character.tactical.weaponSets.set2.mainWeapon = item.name;
          character.tactical.weaponSets.set2.grip = 'Off-Hand';
        }
        if (character.tactical?.weaponSets) {
          if (!Array.isArray(character.tactical.weaponSets.activeSets)) {
            character.tactical.weaponSets.activeSets = [1];
          }
          if (!character.tactical.weaponSets.activeSets.includes(1) && character.bodySlots?.mainHand?.name && character.bodySlots.mainHand.name !== '-') {
            character.tactical.weaponSets.activeSets.unshift(1);
          }
          if (!character.tactical.weaponSets.activeSets.includes(2)) {
            character.tactical.weaponSets.activeSets.push(2);
          }
          character.tactical.weaponSets.activeSet = (character.tactical.weaponSets.activeSets.includes(1) && character.tactical.weaponSets.activeSets.includes(2)) ? 'both' : 2;
        }
        character.activeOffHand = item.name;
        if (item.category === 'Weapon') {
          if (!Array.isArray(character.activeModifiers)) character.activeModifiers = [];
          let twfMod = character.activeModifiers.find(m => m && m.name && (m.name.includes('TWF') || m.name.includes('Two-Weapon')));
          if (!twfMod) {
            twfMod = {
              name: 'Two-Weapon Fighting (TWF)',
              source: 'Combat',
              bonusAtk: 0,
              dice: '',
              type: 'TWF',
              active: true,
              notes: 'Extra Off-Hand Attack (RAW TWF)'
            };
            character.activeModifiers.push(twfMod);
          } else {
            twfMod.active = true;
          }
        }
      }
      try { renderWeaponSetsUI(); } catch (e) { reportError('char_inventory:equipPoolItem', e); }
      try { recalculateOffense(); } catch (e) { reportError('char_inventory:equipPoolItem', e); }

      saveStateToStorage(true);
      renderAll();

      const slotDef = BODY_SLOT_DEFS.find(d => d.key === targetSlotKey);
      const slotLabel = slotDef?.trName || targetSlotKey;
      let toastIcon = '⚔️';
      let toastTitle = 'Weapon Equipped';

      if (item.category === 'Shield') {
        toastIcon = '🛡️';
        toastTitle = 'Shield Equipped';
      } else if (item.category === 'Armor') {
        toastIcon = '🛡️';
        toastTitle = 'Armor Equipped';
      } else if (item.category !== 'Weapon') {
        toastIcon = '✨';
        toastTitle = 'Item Equipped';
      }

      const breakdownText = twoHandWarningMsg
        ? twoHandWarningMsg
        : `Equipped "${item.name}" (${slotLabel}). Defense and stats updated.`;

      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          title: toastTitle,
          breakdown: breakdownText,
          icon: toastIcon
        });
      } else {
        alert(breakdownText);
      }
    }

    // Helper: Map Master DB / Rule Master entry to 14 official Body Slots & Gear Categories (Madde 8)
    function mapEntryToGearCategory(entry) {
      if (!entry) return 'Other';
      if (entry._gearCatCache) return entry._gearCatCache;

      const type = (entry.type || entry.subCategory || entry.category || '').toLowerCase();
      const slot = (entry.slot || '').toLowerCase();
      const name = (entry.name || '').toLowerCase();

      let result = '';
      // 1. Fast direct type/slot/keyword checks first (O(1))
      if (type.includes('crystal') || (entry.category && entry.category.toLowerCase().includes('crystal')) || slot.includes('crystal')) {
        result = 'Crystal';
      } else if (type.includes('weapon') || slot.includes('main hand') || slot.includes('two hand') || slot.includes('off hand')) {
        result = 'Weapon';
      } else if (type.includes('shield') || slot.includes('shield') || name.includes('shield') || name.includes('buckler')) {
        result = 'Shield';
      } else if (type.includes('armor') || slot === 'armor' || slot === 'body') {
        result = 'Armor';
      } else if (type.includes('potion') || type.includes('scroll') || type.includes('wand') || type.includes('consumable') || type === 'ammo' || name.startsWith('scroll of') || name.startsWith('potion of') || name.startsWith('wand of') || name.startsWith('elixir of') || name.startsWith('oil of')) {
        result = 'Consumable';
      } else if (slot.includes('head') || slot.includes('helm') || type.includes('head')) {
        result = 'Head';
      } else if (slot.includes('eyes') || slot.includes('face') || slot.includes('goggles')) {
        result = 'Eyes';
      } else if (slot.includes('neck') || slot.includes('throat') || slot.includes('amulet') || slot.includes('periapt')) {
        result = 'Neck';
      } else if (slot.includes('shoulder') || slot.includes('cloak') || slot.includes('cape')) {
        result = 'Shoulders';
      } else if (slot.includes('torso') || slot.includes('vest') || slot.includes('shirt')) {
        result = 'Torso';
      } else if (slot.includes('belt') || slot.includes('waist')) {
        result = 'Belt';
      } else if (slot.includes('arm') || slot.includes('bracer')) {
        result = 'Bracers';
      } else if (slot.includes('hand') || slot.includes('glove') || slot.includes('gauntlet')) {
        result = 'Gloves';
      } else if (slot.includes('ring') || type.includes('ring') || name.startsWith('ring of')) {
        result = 'Ring';
      } else if (slot.includes('feet') || slot.includes('boot')) {
        result = 'Boots';
      } else if (type.includes('tool') || (entry.category && entry.category.toLowerCase().includes('tool'))) {
        result = 'Tool';
      } else if (type.includes('rod') || (entry.category && entry.category.toLowerCase().includes('rod'))) {
        result = 'Rod';
      } else if (type.includes('staff') || (entry.category && entry.category.toLowerCase().includes('staff'))) {
        result = 'Staff';
      } else if (type.includes('wondrous') || (entry.category && entry.category.toLowerCase().includes('wondrous'))) {
        result = 'Wondrous';
      } else if (/\b(?:dagger|sword|blade|axe|bow|crossbow|mace|spear|hammer|rapier|scimitar|flail|halberd|glaive|lance|morningstar|scythe|trident|quarterstaff|sling|dart|javelin|shuriken|kama|nunchaku|siangham|kukri|falchion|whip|club|greatclub)\b/i.test(name)) {
        result = 'Weapon';
      } else if (/\b(?:plate|mail|leather|padded|hide|hauberk|cuirass)\b/i.test(name)) {
        result = 'Armor';
      }

      // 2. Fallback to BUNDLED_SRD_CORE_CATALOG only when direct fields are ambiguous
      if (!result) {
        const baseMatch = typeof findBaseItemInSrdCore === 'function' ? findBaseItemInSrdCore(entry.name) : null;
        if (baseMatch && baseMatch.type) {
          const bType = baseMatch.type.toLowerCase();
          if (bType === 'weapon') result = 'Weapon';
          else if (bType === 'armor') result = 'Armor';
          else if (bType === 'shield') result = 'Shield';
        }
      }

      entry._gearCatCache = result || 'Other';
      return entry._gearCatCache;
    }

    function getGearCategoryIcon(cat) {
      switch (cat) {
        case 'Armor': return '🥋';
        case 'Shield': return '🛡️';
        case 'Weapon': return '⚔️';
        case 'Consumable': return '🧪';
        case 'Crystal': return '💎';
        case 'Ring': return '💍';
        case 'Head': return '👑';
        case 'Eyes': return '👓';
        case 'Neck': return '📿';
        case 'Shoulders': return '🧥';
        case 'Torso': return '🦺';
        case 'Belt': return '🎗️';
        case 'Bracers': return '🦾';
        case 'Gloves': return '🧤';
        case 'Boots': return '👢';
        case 'Rod': return '🪄';
        case 'Staff': return '🦯';
        case 'Tool': return '🔧';
        case 'Wondrous': return '✨';
        default: return '📦';
      }
    }

    // Temporary storage for search matches in modal
    window._poolCurrentMatches = [];
    window._poolCurrentAiEntries = [];
    let _poolSearchDebounceTimer = null;
    let _currentPoolCategoryFilter = 'all';
    let _cachedUnifiedEquipmentCatalog = null;
    let _cachedUnifiedCatalogKey = '';

    // Fast O(1) Set of all owned item names in character inventory
    function getOwnedItemNamesSet() {
      const set = new Set();
      if (typeof character === 'undefined' || !character) return set;
      (character.gearPool || []).forEach(g => {
        if (g && g.name) set.add(String(g.name).toLowerCase().trim());
      });
      Object.values(character.bodySlots || {}).forEach(s => {
        if (s && s.name) set.add(String(s.name).toLowerCase().trim());
      });
      (character.weapons || []).forEach(w => {
        if (w && w.name) set.add(String(w.name).toLowerCase().trim());
      });
      (character.consumables || []).forEach(c => {
        if (c && c.name) set.add(String(c.name).toLowerCase().trim());
      });
      return set;
    }

    // Check if an item is already in character inventory
    function isItemInInventory(name, ownedSet = null) {
      if (!name || typeof character === 'undefined' || !character) return false;
      const clean = String(name).toLowerCase().trim();
      if (ownedSet) return ownedSet.has(clean);
      return getOwnedItemNamesSet().has(clean);
    }

    // Filter which Master DB / Library items are equipment/items (D&D 3.5e RAW)
    function isEquipmentOrGear(item) {
      if (!item || !item.name) return false;
      if (typeof item._isGearCache === 'boolean') return item._isGearCache;
      const type = String(item.type || '').toLowerCase().trim();
      const cat = String(item.category || '').toLowerCase().trim();
      const id = String(item.id || '').toLowerCase().trim();

      // STRICT EXCLUSIONS: Feats, Spells, Maneuvers, Races, Classes, Invocations, Special Abilities, Enhancements, and Special Materials are NEVER standalone equipment!
      const nonGearTypes = [
        'feat', 'special ability', 'spell', 'maneuver', 'stance', 
        'warlock invocation', 'invocation', 'race', 'class', 'prestige class',
        'domain', 'skill', 'trait', 'flaw', 'template', 'psionic power', 'monster',
        'enhancement', 'weapon enhancement', 'armor enhancement', 'shield enhancement', 'misc enhancement',
        'material', 'special material'
      ];
      if (nonGearTypes.includes(type) || nonGearTypes.includes(cat)) {
        item._isGearCache = false;
        return false;
      }
      if (type.includes('feat') || type.includes('spell') || type.includes('maneuver') || type.includes('ability') ||
          type.includes('enhancement') || cat.includes('enhancement') || type === 'material' || cat === 'special material') {
        item._isGearCache = false;
        return false;
      }
      // Exclude non-standalone SRD table multiplier rules / services (Barding templates, Stabling)
      if (id === 'gear-barding-medium-creature' || id === 'gear-barding-large-creature' || id === 'gear-stabling') {
        item._isGearCache = false;
        return false;
      }

      // Valid equipment types or categories
      let isGear = false;
      if (type.includes('weapon') || type.includes('armor') || type.includes('shield') || 
          type.includes('potion') || type.includes('ring') || type.includes('wondrous') || 
          type.includes('item') || type.includes('gear') || type.includes('consumable') ||
          type.includes('scroll') || type.includes('wand') || type.includes('rod') ||
          type.includes('staff') || type.includes('tool') || type.includes('crystal') ||
          cat.includes('crystal') || type === 'ammo' ||
          type.includes('equipment') || type.includes('accessory') || type === 'goods') {
        isGear = true;
      } else if (item.slot && item.slot !== 'None' && item.slot !== '-' && item.slot.toLowerCase() !== 'none') {
        isGear = true;
      } else if (Number(item.weight) > 0 || Number(item.cost) > 0 || Number(item.weightLb) > 0 || Number(item.priceGp) > 0) {
        isGear = true;
      } else if (type === 'other' || cat === 'other') {
        isGear = !!(item.slot && item.slot !== 'None' && item.slot !== '-') || (Number(item.weight) > 0 || Number(item.cost) > 0);
      }
      item._isGearCache = isGear;
      return isGear;
    }

    function cleanPoolItemDescription(raw) {
      if (!raw || typeof raw !== 'string') return '';
      return raw
        .replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, ' • ')
        .replace(/<br\s*\/?>/gi, ' • ')
        .replace(/<\/(?:th|td)>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Record types the gear picker lists; every chunk holding them (srd_equipment.json, srd_equipment_splat.json,
    // mic_compendium.json, ...) is found through the index.
    const GEAR_PICKER_TYPES = ['Weapon', 'Armor', 'Shield', 'Item', 'MagicItem', 'AugmentationCrystal', 'Tool', 'Consumable', 'Ammo', 'Gear'];

    // Redraws the open Add Item list once lazy gear chunks arrive.
    function refreshPoolPickerIfOpen() {
      const modal = document.getElementById('add-pool-item-modal');
      if (!modal || modal.classList.contains('hidden')) return;
      const q = (document.getElementById('pool-modal-search')?.value || '').trim();
      if (q && typeof executePoolMasterDbSearch === 'function') executePoolMasterDbSearch(q);
      else if (typeof renderUnaddedMasterDbItems === 'function') renderUnaddedMasterDbItems(_currentPoolCategoryFilter || 'all');
    }

    function getUnifiedEquipmentCatalog() {
      const mLen = Array.isArray(masterDb) ? masterDb.length : 0;
      const bLen = (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) ? window.BUNDLED_SRD_CORE_CATALOG.length : 0;
      const srdReady = Boolean(typeof window !== 'undefined' && window.SrdCompendium && typeof window.SrdCompendium.isReady === 'function' && window.SrdCompendium.isReady());
      if (srdReady && typeof window.SrdCompendium.ensureTypesLoaded === 'function') {
        window.SrdCompendium.ensureTypesLoaded(GEAR_PICKER_TYPES).then((arrived) => {
          if (arrived.length) refreshPoolPickerIfOpen();
        }).catch(() => {});
      }
      // The loaded-record count changes when a chunk arrives, so the cache is rebuilt with the new records.
      const loadedN = (srdReady && typeof window.SrdCompendium.getLoadedEntryCount === 'function') ? window.SrdCompendium.getLoadedEntryCount() : 0;
      const cacheKey = `${mLen}:${bLen}:${srdReady ? 1 : 0}:${loadedN}`;

      if (_cachedUnifiedEquipmentCatalog && _cachedUnifiedCatalogKey === cacheKey) {
        return _cachedUnifiedEquipmentCatalog;
      }

      const seenNames = new Set();
      const combined = [];
      const pushUniqueGear = (entry) => {
        if (!entry || !entry.name) return;
        if (String(entry.name).trim().startsWith('↳')) return;
        if (typeof RuleEngine !== 'undefined' && RuleEngine.isOffHandWeaponHead && RuleEngine.isOffHandWeaponHead(entry)) return;
        const key = String(entry.name).toLowerCase().trim();
        if (!key || seenNames.has(key)) return;
        if (!isEquipmentOrGear(entry)) return;
        seenNames.add(key);
        mapEntryToGearCategory(entry); // pre-warm category cache once
        combined.push(entry);
      };

      if (Array.isArray(masterDb)) {
        masterDb.forEach(pushUniqueGear);
      }
      if (srdReady && typeof window.SrdCompendium.getAllLoaded === 'function') {
        const srdGear = window.SrdCompendium.getAllLoaded(['Weapon', 'Armor', 'Shield', 'Item', 'MagicItem', 'AugmentationCrystal', 'Tool', 'Consumable', 'Ammo', 'Gear']);
        if (Array.isArray(srdGear)) srdGear.forEach(pushUniqueGear);
      }
      if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        window.BUNDLED_SRD_CORE_CATALOG.forEach(pushUniqueGear);
      }

      combined.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));

      _cachedUnifiedEquipmentCatalog = combined;
      _cachedUnifiedCatalogKey = cacheKey;
      return combined;
    }

    // Get all SRD + Master DB items not yet in inventory
    function getMasterDbItemsNotInInventory() {
      const ownedSet = getOwnedItemNamesSet();
      return getUnifiedEquipmentCatalog().filter(item => !ownedSet.has(String(item.name).toLowerCase().trim()));
    }

    // Add Pool Item Modal handlers (Unified into Compendium Drawer Tab 3: Custom & AI)
    function resetAddPoolCustomTabForm(skipRender = false) {
      const searchInput = document.getElementById('pool-modal-search');
      if (searchInput) searchInput.value = '';
      const clearBtn = document.getElementById('pool-modal-clear-search');
      if (clearBtn) clearBtn.classList.add('hidden');
      window._poolCurrentAiEntries = [];

      if (!skipRender) {
        renderUnaddedMasterDbItems('all');
      }
    }

    function openAddPoolItemModal() {
      const useDrawer = Boolean(window.DnDUI && typeof window.DnDUI.openCompendiumDrawer === 'function');
      resetAddPoolCustomTabForm(useDrawer);

      if (useDrawer) {
        window.DnDUI.openCompendiumDrawer({
          defaultTab: 'custom',
          onSelect: (entry) => addV2ItemToCharacterGearPool(entry)
        });
        return;
      }

      const modal = document.getElementById('add-pool-item-modal');
      if (!modal) return;
      modal.classList.remove('hidden');
      const searchInput = document.getElementById('pool-modal-search');
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 50);
    }

    function closeAddPoolItemModal() {
      const modal = document.getElementById('add-pool-item-modal');
      if (modal) modal.classList.add('hidden');
      if (window.DnDUI && typeof window.DnDUI.closeCompendiumDrawer === 'function') {
        window.DnDUI.closeCompendiumDrawer();
      }
    }

    function clearPoolModalSearch() {
      const inp = document.getElementById('pool-modal-search');
      if (inp) inp.value = '';
      const clearBtn = document.getElementById('pool-modal-clear-search');
      if (clearBtn) clearBtn.classList.add('hidden');
      window._poolCurrentAiEntries = [];
      renderUnaddedMasterDbItems('all');
    }

    function onPoolModalSearchInput(val) {
      const query = (val || '').trim();
      const clearBtn = document.getElementById('pool-modal-clear-search');

      if (!query) {
        if (clearBtn) clearBtn.classList.add('hidden');
        renderUnaddedMasterDbItems(_currentPoolCategoryFilter || 'all');
        return;
      }

      if (clearBtn) clearBtn.classList.remove('hidden');

      if (_poolSearchDebounceTimer) clearTimeout(_poolSearchDebounceTimer);
      _poolSearchDebounceTimer = setTimeout(() => {
        executePoolMasterDbSearch(query);
      }, 120);
    }

    const WONDROUS_CAT_SET = new Set(['Ring', 'Head', 'Eyes', 'Neck', 'Shoulders', 'Torso', 'Belt', 'Bracers', 'Gloves', 'Boots', 'Tool', 'Rod', 'Staff', 'Wondrous', 'Other']);

    function renderPoolCategoryTabs(unaddedList, activeFilter) {
      const container = document.getElementById('pool-category-tabs-container');
      const countBadge = document.getElementById('pool-unadded-count-badge');
      if (!container) return;

      const total = unaddedList.length;
      if (countBadge) countBadge.textContent = `${total} items available`;

      let wepCount = 0, armCount = 0, wonCount = 0, potCount = 0, crysCount = 0;
      for (let i = 0; i < total; i++) {
        const c = mapEntryToGearCategory(unaddedList[i]);
        if (c === 'Weapon') wepCount++;
        else if (c === 'Armor' || c === 'Shield') armCount++;
        else if (c === 'Consumable') potCount++;
        else if (c === 'Crystal') crysCount++;
        else if (WONDROUS_CAT_SET.has(c)) wonCount++;
      }

      const tabs = [
        { key: 'all', label: 'All Gear', count: total },
        { key: 'armor', label: '🛡️ Armor & Shield', count: armCount },
        { key: 'weapon', label: '⚔️ Weapons', count: wepCount },
        { key: 'potion', label: '🧪 Consumables', count: potCount },
        { key: 'crystal', label: '💎 Crystals', count: crysCount },
        { key: 'wondrous', label: '💍 Magic & Wondrous', count: wonCount }
      ];

      container.innerHTML = tabs.map(t => {
        const isActive = activeFilter === t.key;
        const activeClass = isActive 
          ? 'bg-amber-500/15 text-amber-300 font-bold border-amber-500/50 shadow-sm' 
          : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border-slate-800 font-semibold';
        return `
          <button type="button" data-action="inventory:pool-category-tab" data-category="${t.key}" class="px-2.5 py-1 rounded-md border text-[10px] whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${activeClass}">
            <span>${UI.escapeHtml(t.label)}</span>
            <span class="text-[10px] px-1 rounded-full ${isActive ? 'bg-amber-500/20 text-amber-200' : 'bg-slate-950 text-slate-400'}">${t.count}</span>
          </button>
        `;
      }).join('');
    }

    function renderSpotlightItemCardHtml(item, idx, isSearchMode = false, ownedSet = null) {
      const cat = mapEntryToGearCategory(item);
      const icon = getGearCategoryIcon(cat);
      const source = item.source || 'SRD 3.5e';
      const weight = Number(item.weightLb ?? item.weight) || 0;
      const cost = Number(item.priceGp ?? item.cost) || 0;
      if (typeof item._cleanDescCache !== 'string') {
        item._cleanDescCache = cleanPoolItemDescription(item.benefit || item.description || item.shortDescription || '');
      }
      const desc = item._cleanDescCache;
      const inInv = isSearchMode ? isItemInInventory(item.name, ownedSet) : false;
      item._badgesHtmlCache = renderGearItemStatsBadgesHtml(item, { compact: true });
      const profWarn = getEquipmentProficiencyWarning(item);
      const btnId = isSearchMode ? `btn-add-search-${idx}` : `btn-add-pool-${idx}`;
      const escWarn = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const parseWarnHtml = (Array.isArray(item._parseWarnings) && item._parseWarnings.length > 0)
        ? `<div class="flex flex-wrap gap-1">${item._parseWarnings.map(w => `<span class="text-[10px] bg-amber-950/90 text-amber-300 border border-amber-500/50 px-1.5 py-0.5 rounded font-mono font-semibold">⚠️ ${escWarn(w)}</span>`).join('')}</div>`
        : '';

      return `
        <div id="pool-item-card-${idx}" class="bg-slate-900 border border-slate-700/80 hover:border-amber-500/60 p-2.5 rounded-xl transition space-y-1.5 shadow-sm">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <span class="text-base shrink-0">${icon}</span>
              <h4 class="text-xs font-bold text-white truncate">${UI.escapeHtml(item.name)}</h4>
              ${item._isSynthesizedLego ? `<span class="text-[10px] bg-indigo-950/90 text-indigo-300 border border-indigo-500/60 px-1.5 rounded font-bold shrink-0">⚒️ Instant Lego Assembly</span>` : ''}
              ${profWarn ? `<span class="text-rose-400 text-xs shrink-0 cursor-help" title="${UI.escapeAttr(profWarn.tooltip)}">⚠️</span>` : ''}
              ${inInv ? `<span class="text-[10px] bg-slate-800 text-emerald-400 border border-emerald-500/30 px-1.5 rounded font-semibold shrink-0">✓ Owned</span>` : ''}
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              ${isForgeEditableItem(item) ? `
                <button type="button" data-action="inventory:forge-spotlight-item" data-index="${idx}" data-is-ai="false" class="bg-amber-950/90 hover:bg-amber-800 border border-amber-500/70 text-amber-200 hover:text-white p-1.5 rounded-lg text-xs font-bold transition cursor-pointer" title="Customize in Item Forge (Material, +1..+5, Keen, Flaming...)">
                  ⚒️
                </button>
              ` : ''}
              <button id="${btnId}" type="button" data-action="inventory:add-spotlight-item" data-index="${idx}" class="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs py-1.5 px-2.5 sm:px-3 rounded-lg shadow transition flex items-center gap-1 whitespace-nowrap cursor-pointer">
                <span>➕</span>
                <span class="sm:hidden">Add</span>
                <span class="hidden sm:inline">Add to Inventory</span>
              </button>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 rounded font-semibold">${cat}</span>
            <span class="bg-slate-800 text-slate-300 px-1.5 rounded">${item.slot || 'Slotless'}</span>
            <span class="text-slate-400 font-mono">${weight} lbs</span>
            <span class="text-amber-400 font-mono">${cost} gp</span>
            <span class="text-slate-500 font-serif italic">${source}</span>
          </div>
          ${parseWarnHtml}
          ${item._badgesHtmlCache}
          ${desc ? `<p class="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-1.5 rounded border border-slate-800/80">${desc}</p>` : ''}
        </div>
      `;
    }

    function itemMatchesPoolCategory(item, catKey) {
      if (!catKey || catKey === 'all') return true;
      const c = mapEntryToGearCategory(item);
      if (catKey === 'weapon') return c === 'Weapon';
      if (catKey === 'armor') return c === 'Armor' || c === 'Shield';
      if (catKey === 'potion') return c === 'Consumable';
      if (catKey === 'crystal') return c === 'Crystal';
      if (catKey === 'wondrous') return WONDROUS_CAT_SET.has(c);
      return true;
    }

    function renderUnaddedMasterDbItems(catFilter = 'all') {
      _currentPoolCategoryFilter = catFilter;
      const searchInput = document.getElementById('pool-modal-search');
      const query = (searchInput?.value || '').trim();
      if (query) {
        executePoolMasterDbSearch(query);
        return;
      }

      const unadded = getMasterDbItemsNotInInventory();
      renderPoolCategoryTabs(unadded, catFilter);

      const resultsBox = document.getElementById('pool-search-results-box');
      if (!resultsBox) return;

      let filtered = unadded;
      if (catFilter === 'weapon') {
        filtered = unadded.filter(item => mapEntryToGearCategory(item) === 'Weapon');
      } else if (catFilter === 'armor') {
        filtered = unadded.filter(item => {
          const c = mapEntryToGearCategory(item);
          return c === 'Armor' || c === 'Shield';
        });
      } else if (catFilter === 'wondrous') {
        filtered = unadded.filter(item => WONDROUS_CAT_SET.has(mapEntryToGearCategory(item)));
      } else if (catFilter === 'crystal') {
        filtered = unadded.filter(item => mapEntryToGearCategory(item) === 'Crystal');
      } else if (catFilter === 'potion') {
        filtered = unadded.filter(item => mapEntryToGearCategory(item) === 'Consumable');
      }

      window._poolCurrentMatches = filtered;

      if (filtered.length === 0) {
        resultsBox.innerHTML = `
          <div class="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
            No remaining unowned items in this category. Search above or craft in Item Forge.
          </div>
        `;
        return;
      }

      const maxPreview = 30;
      const displaySlice = filtered.slice(0, maxPreview);
      let html = `
        <div class="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1 mb-1">
          <span class="text-amber-300 flex items-center gap-1.5">
            <span>📦</span>
            <span>SRD 3.5e &amp; Custom Catalog (${filtered.length} available${filtered.length > maxPreview ? `, showing top ${maxPreview}` : ''}):</span>
          </span>
          <span class="text-[10px] text-slate-400 font-normal hidden sm:inline">Type above to filter or ask AI</span>
        </div>
        <div class="space-y-2">
          ${displaySlice.map((item, idx) => renderSpotlightItemCardHtml(item, idx, false)).join('')}
        </div>
      `;
      resultsBox.innerHTML = html;
    }

    function executePoolMasterDbSearch(query) {
      const resultsBox = document.getElementById('pool-search-results-box');
      if (!resultsBox) return;

      const rawQ = String(query || '').trim();
      if (!rawQ) {
        renderUnaddedMasterDbItems(_currentPoolCategoryFilter || 'all');
        return;
      }

      let inlineCatFilter = null;
      let cleanRaw = rawQ;
      const prefixMatch = rawQ.match(/^(armor|shield|weapon|ring|wondrous|item|potion|crystal|equipment)\s*:\s*/i);
      if (prefixMatch) {
        const pKey = prefixMatch[1].toLowerCase();
        if (pKey === 'armor' || pKey === 'shield') inlineCatFilter = 'armor';
        else if (pKey === 'weapon') inlineCatFilter = 'weapon';
        else if (pKey === 'potion') inlineCatFilter = 'potion';
        else if (pKey === 'crystal') inlineCatFilter = 'crystal';
        else if (pKey === 'ring' || pKey === 'wondrous' || pKey === 'item') inlineCatFilter = 'wondrous';
        cleanRaw = rawQ.slice(prefixMatch[0].length).trim();
      }

      const cleanQuery = cleanRaw || rawQ;
      const q = cleanQuery.toLowerCase().trim();
      const qClean = q.replace(/[^a-z0-9]/g, '');
      const qTokens = q.split(/[\s\-_',.+()]+/).filter(Boolean);
      const combined = getUnifiedEquipmentCatalog();
      const activeFilter = inlineCatFilter || _currentPoolCategoryFilter || 'all';

      // Instant Lego Item Synthesis for natural language composite queries
      let synthesizedLegoItem = null;
      if (cleanQuery.length >= 3 && typeof ItemAssembler !== 'undefined' && typeof ItemAssembler.parseNaturalLanguageItem === 'function') {
        try {
          const parsedLego = ItemAssembler.parseNaturalLanguageItem(cleanQuery);
          if (
            parsedLego &&
            (parsedLego.enhancementBonus > 0 ||
              parsedLego.material ||
              (Array.isArray(parsedLego.enhancements) && parsedLego.enhancements.length > 0) ||
              parsedLego.isMasterwork ||
              parsedLego.masterwork ||
              parsedLego.abilityBonus > 0 ||
              parsedLego.crystal)
          ) {
            parsedLego._isSynthesizedLego = true;
            synthesizedLegoItem = parsedLego;
          }
        } catch (e) { reportError('char_inventory:executePoolMasterDbSearch', e); }
      }

      // Score and filter SRD + Custom DB items via unified SrdCompendium.fuzzyScore
      const scored = [];
      for (let i = 0; i < combined.length; i++) {
        const item = combined[i];
        if (!item || !item.name) continue;

        const name = String(item.name || '').toLowerCase().trim();
        const cat = String(item.category || '').toLowerCase();
        const type = String(item.type || '').toLowerCase();
        const slot = String(item.slot || '').toLowerCase();
        const desc = String(item.benefit || item.description || item.shortDescription || '').toLowerCase();
        const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
        const haystack = `${name} ${cat} ${type} ${slot} ${tags} ${desc}`;

        let score = 0;
        if (typeof SrdCompendium !== 'undefined' && typeof SrdCompendium.fuzzyScore === 'function') {
          score = SrdCompendium.fuzzyScore(cleanQuery, item.name, haystack);
        } else if (name.includes(q)) {
          score = name === q ? 1000 : 500;
        }

        if (score > 0) {
          // Boost item if it matches current active category tab
          if (itemMatchesPoolCategory(item, activeFilter)) {
            score += 250;
          }
          scored.push({ item, score });
        }
      }

      scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
      const allMatches = scored.map(s => s.item);
      if (synthesizedLegoItem) {
        allMatches.unshift(synthesizedLegoItem);
      }

      // Category tab filtering: if specific tab selected and has matches in that tab, narrow to that tab
      let displayMatches = allMatches;
      if (activeFilter !== 'all') {
        const inCat = allMatches.filter(item => item._isSynthesizedLego || itemMatchesPoolCategory(item, activeFilter));
        if (inCat.length > 0) {
          displayMatches = inCat;
        }
      }

      // Update category tab count badges to reflect current search matches
      renderPoolCategoryTabs(allMatches, activeFilter);

      window._poolCurrentMatches = displayMatches;
      renderPoolSearchResults(displayMatches, cleanQuery);
    }

    function renderPoolSearchResults(matches, query) {
      const resultsBox = document.getElementById('pool-search-results-box');
      if (!resultsBox) return;

      const escapedQ = query.replace(/"/g, '&quot;');

      if (!matches || matches.length === 0) {
        // NO MATCHES FOUND IN SRD + MASTER DB -> PROMINENT AI LOOKUP & ITEM FORGE CALLOUT
        resultsBox.innerHTML = `
          <div class="p-4 bg-slate-900/90 border border-amber-500/50 rounded-xl space-y-3 shadow-lg">
            <div class="flex items-start gap-3">
              <span class="text-2xl">🔍</span>
              <div>
                <h4 class="text-xs font-bold text-amber-300">"${escapedQ}" Not Found in Local SRD / Custom DB</h4>
                <p class="text-[11px] text-slate-300 mt-0.5">
                  Scan official D&amp;D 3.5e sourcebooks (PHB, DMG, MIC, Complete) via 🔮 Rule Master AI or craft a custom item in Item Forge.
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
              <button type="button" data-action="inventory:search-ai-pool-item" data-query="${escapedQ}" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs py-2 px-3 rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
                <span>🔮</span>
                <span>Fetch "${escapedQ}" via Rule Master AI</span>
              </button>
              <button type="button" data-action="inventory:open-item-forge" class="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer">
                <span>⚒️</span>
                <span>Open in Item Forge</span>
              </button>
            </div>
          </div>
        `;
        return;
      }

      // MATCHES FOUND IN SRD + MASTER DB
      const ownedSet = getOwnedItemNamesSet();
      let html = `
        <div class="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1 mb-1">
          <span>Spotlight Results (${matches.length} items found):</span>
          <button type="button" data-action="inventory:search-ai-pool-item" data-query="${escapedQ}" class="text-amber-400 hover:text-amber-300 underline flex items-center gap-1 font-semibold">
            <span>🔮 Search Rulebooks via Rule Master AI</span>
          </button>
        </div>
        <div class="space-y-2">
          ${matches.slice(0, 25).map((item, idx) => renderSpotlightItemCardHtml(item, idx, true, ownedSet)).join('')}
        </div>
        <div class="text-center pt-1">
          <button type="button" data-action="inventory:search-ai-pool-item" data-query="${escapedQ}" class="text-xs text-amber-300 hover:text-amber-200 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 rounded-lg px-3 py-1.5 transition inline-flex items-center gap-1.5 shadow">
            <span>🔮</span>
            <span>Not what you're looking for? <strong>Fetch "${escapedQ}" via Rule Master AI</strong></span>
          </button>
        </div>
      `;

      resultsBox.innerHTML = html;
    }

    function triggerPoolAiSearchIfNoMatches() {
      const inp = document.getElementById('pool-modal-search');
      const val = inp?.value?.trim() || '';
      if (!val) return;
      if (!window._poolCurrentMatches || window._poolCurrentMatches.length === 0) {
        searchAiForPoolItem(val);
      }
    }

    async function searchAiForPoolItem(query) {
      const q = String(query || '')
        .replace(/^(?:armor|shield|weapon|item|ring|wondrous|equipment|potion|crystal)\s*:\s*/i, '')
        .trim();
      if (!q) {
        showToast('Please enter an item name to search.', 'error', { wrap: true });
        return;
      }

      const resultsBox = document.getElementById('pool-search-results-box');
      if (!resultsBox) return;

      const apiKey = typeof RuleMaster !== 'undefined' ? RuleMaster.getApiKey() : (localStorage.getItem('gemini_api_key') || '');
      if (!apiKey) {
        showToast('🔮 Please configure a valid Google Gemini API key in Settings ⚙️ (top right) to search via Rule Master AI.', 'error', { wrap: true });
        if (typeof openSettingsModal === 'function') openSettingsModal();
        return;
      }

      // Render loading state with spinner and active status text
      resultsBox.innerHTML = `
        <div class="p-5 bg-slate-950/90 border border-purple-500/50 rounded-xl text-center space-y-2.5 shadow-2xl">
          <div class="inline-block w-7 h-7 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <div class="text-xs font-bold text-purple-200">🔮 Rule Master AI fetching D&D 3.5e RAW data...</div>
          <div id="pool-ai-status-text" class="text-[11px] text-slate-400 font-mono">
            "${q}" ➔ Scanning official D&D 3.5e sourcebooks...
          </div>
          <p class="text-[10px] text-slate-500">Scanning PHB, DMG, Magic Item Compendium, and splatbooks for item statistics and modifiers.</p>
        </div>
      `;

      const statusEl = document.getElementById('pool-ai-status-text');

      try {
        let rows = null;
        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchSingleAiRuleRows === 'function') {
          rows = await RuleMaster.fetchSingleAiRuleRows(q, 'Equipment', apiKey, statusEl);
        } else {
          throw new Error('RuleMaster search engine is not ready.');
        }

        if (!rows || !rows.length) {
          throw new Error(`No official rule entry found for "${q}".`);
        }

        const entries = RuleMaster.convertRowsToEntries(rows);
        window._poolCurrentAiEntries = entries;

        // Automatically store new entries in masterDb if not already present
        let newEntriesAdded = 0;
        entries.forEach(entry => {
          const exists = masterDb.some(m => (m.name || '').toLowerCase() === (entry.name || '').toLowerCase());
          if (!exists) {
            masterDb.push(entry);
            newEntriesAdded++;
          }
        });

        if (newEntriesAdded > 0) {
          saveStateToStorage();
          if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.renderTable === 'function') {
            RuleMaster.renderTable();
          }
        }

        renderAiPoolResultCards(entries, q);
      } catch (err) {
        resultsBox.innerHTML = `
          <div class="p-4 bg-rose-950/50 border border-rose-800 rounded-xl space-y-2 text-rose-300">
            <div class="text-xs font-bold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>🔮 Rule Master AI Lookup Error</span>
            </div>
            <p class="text-[11px] text-rose-400">${err.message || 'No response from API.'}</p>
            <div class="pt-2 border-t border-rose-900/50 flex flex-wrap gap-2 text-xs">
              <button type="button" data-action="inventory:search-ai-pool-item" data-query="${q.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" class="bg-rose-900 hover:bg-rose-800 text-white font-bold py-1.5 px-3 rounded-lg transition">
                🔄 Retry
              </button>
            </div>
          </div>
        `;
      }
    }

    function renderAiPoolResultCards(entries, query) {
      const resultsBox = document.getElementById('pool-search-results-box');
      if (!resultsBox) return;

      let html = `
        <div class="p-2.5 bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-500/60 rounded-xl space-y-2.5 shadow-lg">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-purple-200 flex items-center gap-1.5">
              <span>✨</span>
              <span>🔮 Found in 3.5e Compendium via Rule Master AI (${entries.length} entries)</span>
            </span>
            <span class="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">Added to Master DB</span>
          </div>
          <div class="space-y-2">
      `;

      entries.forEach((item, idx) => {
        const cat = mapEntryToGearCategory(item);
        const icon = getGearCategoryIcon(cat);
        const source = item.source || 'Official 3.5e';
        const weight = Number(item.weight) || 0;
        const cost = Number(item.cost) || 0;
        const desc = item.benefit || item.description || '';

        html += `
          <div class="bg-slate-950/90 border border-purple-800/80 p-2.5 rounded-xl space-y-1.5">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-base">${icon}</span>
                <div>
                  <h4 class="text-xs font-bold text-white truncate">${UI.escapeHtml(item.name)}</h4>
                  <div class="flex flex-wrap items-center gap-1.5 text-[10px] mt-0.5">
                    <span class="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 rounded font-semibold">${cat}</span>
                    <span class="bg-slate-800 text-slate-300 px-1.5 rounded">${item.slot || 'Slotless'}</span>
                    <span class="text-slate-400 font-mono">${weight} lbs</span>
                    <span class="text-amber-400 font-mono">${cost} gp</span>
                    <span class="text-purple-300 font-serif italic">📚 ${source}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" data-action="inventory:add-ai-pool-item" data-index="${idx}" class="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow transition flex items-center gap-1">
                  <span>➕</span>
                  <span>Add to Inventory</span>
                </button>
              </div>
            </div>
            ${desc ? `<p class="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2 rounded border border-slate-800">${desc}</p>` : ''}
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;

      resultsBox.innerHTML = html;
    }

    function addMasterDbItemDirectlyToPool(idx, btnEl = null) {
      const item = window._poolCurrentMatches?.[idx];
      if (!item) return;

      if (!character.gearPool) character.gearPool = [];
      const cat = mapEntryToGearCategory(item);
      const isBeltItem = (item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable';
      const itemWeight = Number(item.weightLb ?? item.weight) || 0;
      const itemCost = Number(item.priceGp ?? item.cost) || 0;
      const itemDesc = cleanPoolItemDescription(item.benefit || item.description || item.shortDescription || '');

      const newId = Date.now();
      const primaryPart = Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0] : null;
      const armorAcMod = Array.isArray(item.modifiers) ? item.modifiers.find(m => m && (m.target === 'ac.armor' || m.target === 'ac.shield')) : null;
      character.gearPool.push({
        id: newId,
        baseItemId: item.baseItemId || item.id || null,
        name: item.name,
        masterDbName: item.name,
        category: cat,
        slot: item.slot && item.slot !== 'None' ? item.slot : cat,
        qty: 1,
        weight: itemWeight,
        cost: itemCost,
        desc: itemDesc,
        material: item.material || null,
        enhancementBonus: Number(item.enhancementBonus) || 0,
        enhancements: Array.isArray(item.enhancements) ? item.enhancements : [],
        modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
        damageParts: Array.isArray(item.damageParts) ? JSON.parse(JSON.stringify(item.damageParts)) : [],
        modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
        weaponMeta: item.weaponMeta ? JSON.parse(JSON.stringify(item.weaponMeta)) : null,
        armorMeta: item.armorMeta ? JSON.parse(JSON.stringify(item.armorMeta)) : null,
        ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {},
        tacticalBadges: Array.isArray(item.tacticalBadges) ? JSON.parse(JSON.stringify(item.tacticalBadges)) : [],
        dice: (primaryPart && primaryPart.dice) || item.dice,
        dmgType: (primaryPart && primaryPart.type) || item.dmgType,
        critMin: Number(item.critRange || item.critMin || item.weaponMeta?.critMin) || undefined,
        critRange: Number(item.critRange || item.critMin || item.weaponMeta?.critMin) || undefined,
        critMult: Number(item.critMult || item.weaponMeta?.critMult) || undefined,
        handedness: item.handedness || item.weaponMeta?.handedness,
        acBonus: item.acBonus !== undefined ? item.acBonus : (armorAcMod ? Number(armorAcMod.value) : undefined),
        maxDex: item.maxDex !== undefined ? item.maxDex : item.armorMeta?.maxDex,
        checkPenalty: item.checkPenalty !== undefined ? item.checkPenalty : item.armorMeta?.acp,
        spellFailure: item.spellFailure !== undefined ? item.spellFailure : item.armorMeta?.asf,
        isBelt: isBeltItem,
        isEquipped: false
      });

      // If weapon, sync with weapons array (V2 damageParts & modes)
      if (cat === 'Weapon') {
        if (!character.weapons) character.weapons = [];
        const hasWep = character.weapons.some(w => (w.name || '').toLowerCase() === item.name.toLowerCase());
        if (!hasWep) {
          const primaryPart = Array.isArray(item.damageParts) && item.damageParts[0] ? item.damageParts[0] : null;
          const secondaryParts = Array.isArray(item.damageParts) && item.damageParts.length > 1 ? item.damageParts.slice(1) : [];
          character.weapons.push({
            id: item.id || ('wep_' + String(item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')),
            baseItemId: item.baseItemId || item.id || null,
            name: item.name,
            grip: (typeof RuleEngine !== 'undefined' && RuleEngine.isTwoHandedWeapon && RuleEngine.isTwoHandedWeapon(item)) ? '2-Hand' : '1-Hand',
            handedness: item.handedness || item.weaponMeta?.handedness,
            dice: (primaryPart && primaryPart.dice) || item.dice || '1d8',
            damageParts: Array.isArray(item.damageParts) && item.damageParts.length > 0
              ? JSON.parse(JSON.stringify(item.damageParts))
              : [{ dice: item.dice || '1d8', bonus: 0, type: item.dmgType || 'Slashing', multiplyOnCrit: true }],
            modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
            modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
            weaponMeta: item.weaponMeta ? JSON.parse(JSON.stringify(item.weaponMeta)) : null,
            ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : {},
            tacticalBadges: Array.isArray(item.tacticalBadges) ? JSON.parse(JSON.stringify(item.tacticalBadges)) : [],
            critMin: Number(item.critRange || item.critMin || item.weaponMeta?.critMin) || 20,
            rawCritMin: Number(item.critRange || item.critMin || item.weaponMeta?.critMin) || 20,
            critMult: Number(item.critMult || item.weaponMeta?.critMult) || 2,
            enhancementBonus: Number(item.enhancementBonus) || 0,
            dmgType: (primaryPart && primaryPart.type) || item.dmgType || 'Slashing',
            isLight: Boolean(item.isLight || (item.handedness && String(item.handedness).toLowerCase().includes('light')) || (typeof RuleEngine !== 'undefined' && RuleEngine.isLightWeapon && RuleEngine.isLightWeapon(item))),
            bonusType: 'enhancement',
            tags: item.tags || [],
            elementalMods: secondaryParts.map(sp => ({ name: sp.source || sp.type, dice: sp.dice, type: sp.type })),
            keen: Boolean(item.ruleFlags && item.ruleFlags.keen)
          });
        }
      }

      // If consumable, sync with consumables array
      if (cat === 'Consumable') {
        if (!character.consumables) character.consumables = [];
        const hasCons = character.consumables.some(c => (c.name || '').toLowerCase() === item.name.toLowerCase());
        if (!hasCons) {
          character.consumables.push({
            name: item.name,
            qty: 1,
            effect: itemDesc || 'Potion effect'
          });
        }
      }

      // Attach embedded V2 modes[] from item
      let attachedChildCount = 0;
      const itemModes = Array.isArray(item.modes) ? item.modes : [];
      if (itemModes.length > 0) {
        itemModes.forEach(mode => {
          // Skip weapon grip modes (primary-head, offhand-head, 2h-single) so they aren't added as separate items or elemental activeModifiers
          if (mode.handedness || mode.id === 'primary-head' || mode.id === 'offhand-head' || mode.id === '2h-single' || mode.ruleFlags?.doubleWeapon || mode.ruleFlags?.doubleWeaponOffHand) {
            return;
          }
          const modeClean = (mode.name || mode.label || '').replace(/^↳\s*/, '').trim();
          if (!modeClean) return;
          const modePart = Array.isArray(mode.damageParts) && mode.damageParts[0] ? mode.damageParts[0] : null;
          const modeDice = (modePart && modePart.dice) || mode.dice || '';
          if (mode.action?.toLowerCase().includes('action') || (mode.duration && mode.duration !== 'Continuous')) {
            if (!character.specialAbilities) character.specialAbilities = [];
            if (!character.specialAbilities.some(a => (a.name || '').toLowerCase() === modeClean.toLowerCase())) {
              character.specialAbilities.push({
                name: modeClean,
                source: item.name,
                action: mode.action || 'Standard Action',
                duration: mode.duration || 'Special',
                benefit: mode.benefit || mode.description || '',
                dice: modeDice,
                active: false
              });
              attachedChildCount++;
            }
          }
          if (modeDice) {
            if (!character.activeModifiers) character.activeModifiers = [];
            if (!character.activeModifiers.some(m => (m.name || '').toLowerCase() === modeClean.toLowerCase())) {
              character.activeModifiers.push({
                name: modeClean,
                source: item.name,
                bonusAtk: 0,
                dice: modeDice,
                type: (modePart && modePart.type) || 'Energy',
                active: true,
                notes: mode.benefit || mode.description || ''
              });
              attachedChildCount++;
            }
          }
        });
      }

      saveStateToStorage(true);
      renderInventory();
      renderConsumables();

      if (btnEl) {
        btnEl.innerHTML = attachedChildCount > 0 ? `<span>✅</span> <span>Added (+${attachedChildCount} Powers)</span>` : '<span>✅</span> <span>Added</span>';
        btnEl.classList.remove('bg-emerald-700', 'hover:bg-emerald-600');
        btnEl.classList.add('bg-slate-700', 'text-emerald-300', 'cursor-default');
        btnEl.disabled = true;

        setTimeout(() => {
          const searchInp = document.getElementById('pool-modal-search');
          if (!searchInp || !searchInp.value.trim()) {
            if (typeof renderUnaddedMasterDbItems === 'function') {
              renderUnaddedMasterDbItems(_currentPoolCategoryFilter || 'all');
            }
          }
        }, 500);
      } else {
        closeAddPoolItemModal();
        if (attachedChildCount > 0) {
          showToast(`"${item.name}" and ${attachedChildCount} linked sub-abilities added to your Inventory!`, 'success', { wrap: true });
        } else {
          showToast(`"${item.name}" added to your Inventory!`, 'success', { wrap: true });
        }
      }
    }

    function addAiItemToPoolAndDb(idx, btnEl = null) {
      const item = window._poolCurrentAiEntries?.[idx];
      if (!item) return;

      // Normalize AI entry to Canonical V2 (with embedded modes[] and damageParts[]) and store in masterDb
      const v2Item = (typeof RuleMaster !== 'undefined' && typeof RuleMaster.normalizeEntry === 'function')
        ? RuleMaster.normalizeEntry(item)
        : item;

      let dbAdded = 0;
      const exists = masterDb.some(m => (m.name || '').toLowerCase().trim() === (v2Item.name || '').toLowerCase().trim());
      if (!exists) {
        masterDb.push(v2Item);
        dbAdded++;
      }

      if (dbAdded > 0) {
        saveStateToStorage();
        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.renderTable === 'function') {
          RuleMaster.renderTable();
        }
      }

      if (!character.gearPool) character.gearPool = [];
      const cat = mapEntryToGearCategory(v2Item);
      const isBeltItem = (v2Item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable';

      const newId = Date.now();
      character.gearPool.push({
        id: newId,
        baseItemId: v2Item.baseItemId || v2Item.id || null,
        name: v2Item.name,
        masterDbName: v2Item.name,
        category: cat,
        slot: v2Item.slot && v2Item.slot !== 'None' ? v2Item.slot : cat,
        qty: 1,
        weight: Number(v2Item.weight) || 0,
        cost: Number(v2Item.cost) || 0,
        desc: v2Item.benefit || v2Item.description || '',
        modifiers: Array.isArray(v2Item.modifiers) ? JSON.parse(JSON.stringify(v2Item.modifiers)) : [],
        damageParts: Array.isArray(v2Item.damageParts) ? JSON.parse(JSON.stringify(v2Item.damageParts)) : [],
        modes: Array.isArray(v2Item.modes) ? JSON.parse(JSON.stringify(v2Item.modes)) : [],
        isBelt: isBeltItem,
        isEquipped: false
      });

      if (cat === 'Weapon') {
        if (!character.weapons) character.weapons = [];
        const hasWep = character.weapons.some(w => (w.name || '').toLowerCase() === v2Item.name.toLowerCase());
        if (!hasWep) {
          const primaryPart = Array.isArray(v2Item.damageParts) && v2Item.damageParts[0] ? v2Item.damageParts[0] : null;
          character.weapons.push({
            id: v2Item.id || ('wep_' + String(v2Item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')),
            baseItemId: v2Item.baseItemId || v2Item.id || null,
            name: v2Item.name,
            grip: v2Item.slot === 'Main Hand' ? '1-Hand' : '2-Hand',
            dice: (primaryPart && primaryPart.dice) || v2Item.dice || '1d8',
            damageParts: Array.isArray(v2Item.damageParts) ? JSON.parse(JSON.stringify(v2Item.damageParts)) : [],
            modifiers: Array.isArray(v2Item.modifiers) ? JSON.parse(JSON.stringify(v2Item.modifiers)) : [],
            modes: Array.isArray(v2Item.modes) ? JSON.parse(JSON.stringify(v2Item.modes)) : [],
            critMin: v2Item.weaponMeta?.critMin || v2Item.critMin || 20,
            critMult: v2Item.weaponMeta?.critMult || v2Item.critMult || 2,
            enhancementBonus: Number(v2Item.enhancementBonus) || 0,
            dmgType: (primaryPart && primaryPart.type) || v2Item.dmgType || 'Slashing',
            bonusType: 'enhancement',
            tags: v2Item.tags || []
          });
        }
      }

      if (cat === 'Consumable') {
        if (!character.consumables) character.consumables = [];
        const hasCons = character.consumables.some(c => (c.name || '').toLowerCase() === v2Item.name.toLowerCase());
        if (!hasCons) {
          character.consumables.push({
            name: v2Item.name,
            qty: 1,
            effect: v2Item.benefit || 'Potion effect'
          });
        }
      }

      // Also attach V2 embedded modes[] to character
      let attachedChildCount = 0;
      const aiModes = Array.isArray(v2Item.modes) ? v2Item.modes : [];
      if (aiModes.length > 0) {
        aiModes.forEach(mode => {
          const modeClean = (mode.name || '').replace(/^↳\s*/, '').trim();
          const modePart = Array.isArray(mode.damageParts) && mode.damageParts[0] ? mode.damageParts[0] : null;
          const modeDice = (modePart && modePart.dice) || mode.dice || '';
          if (mode.action?.toLowerCase().includes('action') || (mode.duration && mode.duration !== 'Continuous')) {
            if (!character.specialAbilities) character.specialAbilities = [];
            if (!character.specialAbilities.some(a => (a.name || '').toLowerCase() === modeClean.toLowerCase())) {
              character.specialAbilities.push({
                name: modeClean,
                source: v2Item.name,
                action: mode.action || 'Standard Action',
                duration: mode.duration || 'Special',
                benefit: mode.benefit || mode.description || '',
                dice: modeDice,
                active: false
              });
              attachedChildCount++;
            }
          }
          if (modeDice) {
            if (!character.activeModifiers) character.activeModifiers = [];
            if (!character.activeModifiers.some(m => (m.name || '').toLowerCase() === modeClean.toLowerCase())) {
              character.activeModifiers.push({
                name: modeClean,
                source: v2Item.name,
                bonusAtk: 0,
                dice: modeDice,
                type: (modePart && modePart.type) || 'Energy',
                active: true,
                notes: mode.benefit || mode.description || ''
              });
              attachedChildCount++;
            }
          }
        });
      }

      saveStateToStorage(true);
      renderInventory();
      renderConsumables();

      if (btnEl) {
        btnEl.innerHTML = attachedChildCount > 0 ? `<span>✅</span> <span>Added (+${attachedChildCount} Powers)</span>` : '<span>✅</span> <span>Added</span>';
        btnEl.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
        btnEl.classList.add('bg-slate-700', 'text-emerald-300', 'cursor-default');
        btnEl.disabled = true;
      } else {
        closeAddPoolItemModal();
        if (attachedChildCount > 0) {
          showToast(`"${item.name}" and ${attachedChildCount} sub-powers saved to Master DB and added to your Inventory!`, 'success', { wrap: true });
        } else {
          showToast(`"${item.name}" saved to Master DB and added to your Inventory!`, 'success', { wrap: true });
        }
      }
    }

    // ====================================================
    // ⚒️ V2 LEGO FORGE, SRD COMPENDIUM & EMBEDDED MODES INTEGRATION
    // ====================================================
    function addV2ItemToCharacterGearPool(v2Item) {
      if (!v2Item || !character) return;
      if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function' && window.CharStore.getDoc()) {
        window.CharStore.dispatch({ type: 'inventory/addPoolItem', payload: { item: v2Item } });
        renderAll();
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            icon: '⚒️',
            title: 'Item Added to Inventory',
            breakdown: `"${v2Item.name}" added to your Inventory.`,
            total: `${Number(v2Item.priceGp ?? v2Item.cost ?? 0).toLocaleString('tr-TR')} gp`
          });
        }
        return;
      }
      if (!Array.isArray(character.gearPool)) character.gearPool = [];
      const cat = typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(v2Item) : (v2Item.type || 'Other');
      const isBeltItem = (v2Item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable';
      const primaryPart = Array.isArray(v2Item.damageParts) && v2Item.damageParts[0] ? v2Item.damageParts[0] : null;
      const armorAcMod = Array.isArray(v2Item.modifiers) ? v2Item.modifiers.find(m => m && (m.target === 'ac.armor' || m.target === 'ac.shield')) : null;
      const newEntry = {
        id: v2Item.id || ('item_' + Date.now()),
        baseItemId: v2Item.baseItemId || v2Item.id || null,
        name: v2Item.name,
        masterDbName: v2Item.name,
        category: cat,
        slot: v2Item.slot && v2Item.slot !== 'None' ? v2Item.slot : cat,
        qty: 1,
        weight: Number(v2Item.weightLb ?? v2Item.weight) || 0,
        cost: Number(v2Item.priceGp ?? v2Item.cost) || 0,
        desc: cleanPoolItemDescription(v2Item.benefit || v2Item.description || ''),
        material: v2Item.material || null,
        enhancementBonus: Number(v2Item.enhancementBonus) || 0,
        enhancements: Array.isArray(v2Item.enhancements) ? v2Item.enhancements : [],
        modifiers: Array.isArray(v2Item.modifiers) ? JSON.parse(JSON.stringify(v2Item.modifiers)) : [],
        damageParts: Array.isArray(v2Item.damageParts) ? JSON.parse(JSON.stringify(v2Item.damageParts)) : [],
        modes: Array.isArray(v2Item.modes) ? JSON.parse(JSON.stringify(v2Item.modes)) : [],
        weaponMeta: v2Item.weaponMeta ? JSON.parse(JSON.stringify(v2Item.weaponMeta)) : null,
        armorMeta: v2Item.armorMeta ? JSON.parse(JSON.stringify(v2Item.armorMeta)) : null,
        ruleFlags: v2Item.ruleFlags ? JSON.parse(JSON.stringify(v2Item.ruleFlags)) : {},
        tacticalBadges: Array.isArray(v2Item.tacticalBadges) ? JSON.parse(JSON.stringify(v2Item.tacticalBadges)) : [],
        dice: (primaryPart && primaryPart.dice) || v2Item.dice,
        dmgType: (primaryPart && primaryPart.type) || v2Item.dmgType,
        critMin: Number(v2Item.critRange || v2Item.critMin || v2Item.weaponMeta?.critMin) || undefined,
        critRange: Number(v2Item.critRange || v2Item.critMin || v2Item.weaponMeta?.critMin) || undefined,
        critMult: Number(v2Item.critMult || v2Item.weaponMeta?.critMult) || undefined,
        handedness: v2Item.handedness || v2Item.weaponMeta?.handedness,
        acBonus: v2Item.acBonus !== undefined ? v2Item.acBonus : (armorAcMod ? Number(armorAcMod.value) : undefined),
        maxDex: v2Item.maxDex !== undefined ? v2Item.maxDex : v2Item.armorMeta?.maxDex,
        checkPenalty: v2Item.checkPenalty !== undefined ? v2Item.checkPenalty : v2Item.armorMeta?.acp,
        spellFailure: v2Item.spellFailure !== undefined ? v2Item.spellFailure : v2Item.armorMeta?.asf,
        isBelt: isBeltItem,
        isEquipped: false
      };
      character.gearPool.push(newEntry);

      if (cat === 'Weapon' || v2Item.type === 'Weapon') {
        if (!Array.isArray(character.weapons)) character.weapons = [];
        const hasWep = character.weapons.some(w => (w.name || '').toLowerCase() === (v2Item.name || '').toLowerCase());
        if (!hasWep) {
          const primaryPart = Array.isArray(v2Item.damageParts) && v2Item.damageParts[0] ? v2Item.damageParts[0] : null;
          const secondaryParts = Array.isArray(v2Item.damageParts) && v2Item.damageParts.length > 1 ? v2Item.damageParts.slice(1) : [];
          character.weapons.push({
            id: newEntry.id,
            baseItemId: newEntry.baseItemId,
            name: v2Item.name,
            grip: (v2Item.weaponMeta?.handedness || '').includes('Two') ? '2-Hand' : '1-Hand',
            dice: (primaryPart && primaryPart.dice) || v2Item.dice || '1d8',
            damageParts: newEntry.damageParts,
            modifiers: newEntry.modifiers,
            modes: newEntry.modes,
            weaponMeta: newEntry.weaponMeta,
            ruleFlags: newEntry.ruleFlags,
            tacticalBadges: newEntry.tacticalBadges,
            critMin: Number(v2Item.weaponMeta?.critMin || v2Item.critMin) || 20,
            rawCritMin: Number(v2Item.weaponMeta?.critMin || v2Item.critMin) || 20,
            critMult: Number(v2Item.weaponMeta?.critMult || v2Item.critMult) || 2,
            enhancementBonus: Number(v2Item.enhancementBonus) || 0,
            dmgType: (primaryPart && primaryPart.type) || v2Item.dmgType || 'Slashing',
            bonusType: 'enhancement',
            tags: v2Item.tags || [],
            elementalMods: secondaryParts.map(sp => ({ name: sp.source || sp.type, dice: sp.dice, type: sp.type })),
            keen: Boolean(v2Item.ruleFlags && v2Item.ruleFlags.keen)
          });
        }
      }

      saveStateToStorage(true);
      renderAll();
      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: '⚒️',
          title: 'Item Added to Inventory',
          breakdown: `"${v2Item.name}" added to your Inventory.`,
          total: `${Number(v2Item.priceGp ?? v2Item.cost ?? 0).toLocaleString('tr-TR')} gp`
        });
      }
    }

    function isForgeEditableItem(item) {
      if (!item || !item.name || item.name === '-') return false;
      const directCat = String(item.category || item.type || '').trim();
      if (['Weapon', 'Armor', 'Shield'].includes(directCat)) return true;
      const mapped = typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(item) : 'Other';
      return ['Weapon', 'Armor', 'Shield'].includes(mapped);
    }
    window.isForgeEditableItem = isForgeEditableItem;

    function applyForgedItemUpdate(originalItem, targetSlotKey, forgedV2Item) {
      if (!forgedV2Item || !character) return;
      if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function' && window.CharStore.getDoc()) {
        const oldName = String(originalItem?.name || '').trim();
        const newName = String(forgedV2Item.name || oldName || 'Forged Item').trim();
        const newCost = Number(forgedV2Item.priceGp ?? forgedV2Item.cost) || 0;
        window.CharStore.dispatch({
          type: 'inventory/reforgeItem',
          payload: {
            targetContext: { originalItem, targetSlotKey },
            itemData: forgedV2Item
          }
        });
        renderAll();
        if (typeof showDiceTopToast === 'function') {
          showDiceTopToast({
            icon: '⚒️',
            title: 'Item Reforged',
            breakdown: oldName && oldName !== newName
              ? `"${oldName}" reforged into "${newName}".`
              : `"${newName}" properties updated in Item Forge.`,
            total: `${newCost.toLocaleString('en-US')} gp`
          });
        }
        return;
      }
      if (!Array.isArray(character.gearPool)) character.gearPool = [];

      const oldName = String(originalItem?.name || '').trim();
      const oldNameLower = oldName.toLowerCase();
      const newName = String(forgedV2Item.name || oldName || 'Forged Item').trim();
      const cat = typeof mapEntryToGearCategory === 'function'
        ? mapEntryToGearCategory(forgedV2Item)
        : (forgedV2Item.type || originalItem?.category || 'Weapon');
      const newWeight = Number(forgedV2Item.weightLb ?? forgedV2Item.weight) || 0;
      const newCost = Number(forgedV2Item.priceGp ?? forgedV2Item.cost) || 0;
      const newDesc = cleanPoolItemDescription(forgedV2Item.benefit || forgedV2Item.description || originalItem?.desc || '');
      const primaryPart = Array.isArray(forgedV2Item.damageParts) && forgedV2Item.damageParts[0] ? forgedV2Item.damageParts[0] : null;
      const secondaryParts = Array.isArray(forgedV2Item.damageParts) && forgedV2Item.damageParts.length > 1 ? forgedV2Item.damageParts.slice(1) : [];

      const clonedModifiers = Array.isArray(forgedV2Item.modifiers) ? JSON.parse(JSON.stringify(forgedV2Item.modifiers)) : [];
      const clonedDamageParts = Array.isArray(forgedV2Item.damageParts) ? JSON.parse(JSON.stringify(forgedV2Item.damageParts)) : [];
      const clonedModes = Array.isArray(forgedV2Item.modes) ? JSON.parse(JSON.stringify(forgedV2Item.modes)) : [];
      const clonedWeaponMeta = forgedV2Item.weaponMeta ? JSON.parse(JSON.stringify(forgedV2Item.weaponMeta)) : null;
      const clonedArmorMeta = forgedV2Item.armorMeta ? JSON.parse(JSON.stringify(forgedV2Item.armorMeta)) : null;
      const clonedRuleFlags = forgedV2Item.ruleFlags ? JSON.parse(JSON.stringify(forgedV2Item.ruleFlags)) : {};
      const clonedTacticalBadges = Array.isArray(forgedV2Item.tacticalBadges) ? JSON.parse(JSON.stringify(forgedV2Item.tacticalBadges)) : [];

      const armorAcMod = clonedModifiers.find(m => m && (m.target === 'ac.armor' || m.target === 'ac.shield'));
      const computedAcBonus = armorAcMod ? (Number(armorAcMod.value) || 0) : (forgedV2Item.acBonus ?? originalItem?.acBonus);

      // 1. Update matching item in character.gearPool
      const poolItem = character.gearPool.find(p => {
        if (!p) return false;
        if (originalItem?.id !== undefined && p.id === originalItem.id) return true;
        return oldNameLower && String(p.name || '').toLowerCase().trim() === oldNameLower;
      });

      if (poolItem) {
        poolItem.baseItemId = forgedV2Item.baseItemId || forgedV2Item.id || poolItem.baseItemId || null;
        poolItem.name = newName;
        poolItem.masterDbName = newName;
        poolItem.category = cat;
        poolItem.slot = (forgedV2Item.slot && forgedV2Item.slot !== 'None') ? forgedV2Item.slot : (poolItem.slot || cat);
        poolItem.weight = newWeight;
        poolItem.cost = newCost;
        poolItem.desc = newDesc;
        poolItem.material = forgedV2Item.material || null;
        poolItem.enhancementBonus = Number(forgedV2Item.enhancementBonus) || 0;
        poolItem.enhancements = Array.isArray(forgedV2Item.enhancements) ? forgedV2Item.enhancements.slice() : [];
        poolItem.modifiers = clonedModifiers;
        poolItem.damageParts = clonedDamageParts;
        poolItem.modes = clonedModes;
        poolItem.weaponMeta = clonedWeaponMeta;
        poolItem.armorMeta = clonedArmorMeta;
        poolItem.ruleFlags = clonedRuleFlags;
        poolItem.tacticalBadges = clonedTacticalBadges;
        poolItem.dice = (primaryPart && primaryPart.dice) || forgedV2Item.dice || poolItem.dice;
        poolItem.critMin = Number(forgedV2Item.weaponMeta?.critMin || forgedV2Item.critMin) || poolItem.critMin;
        poolItem.critMult = Number(forgedV2Item.weaponMeta?.critMult || forgedV2Item.critMult) || poolItem.critMult;
        poolItem.dmgType = (primaryPart && primaryPart.type) || forgedV2Item.dmgType || poolItem.dmgType;
        if (computedAcBonus !== undefined) poolItem.acBonus = computedAcBonus;
        if (clonedArmorMeta) {
          poolItem.maxDex = clonedArmorMeta.maxDex;
          poolItem.checkPenalty = clonedArmorMeta.acp;
        }
      }

      // 2. Update equipped bodySlot(s) if equipped
      if (character.bodySlots) {
        const slotKeysToUpdate = [];
        if (targetSlotKey && character.bodySlots[targetSlotKey] && character.bodySlots[targetSlotKey].name !== '-') {
          slotKeysToUpdate.push(targetSlotKey);
        } else if (oldNameLower) {
          Object.keys(character.bodySlots).forEach(sk => {
            const sd = character.bodySlots[sk];
            if (sd && sd.name && String(sd.name).toLowerCase().trim() === oldNameLower) {
              slotKeysToUpdate.push(sk);
            }
          });
        }

        slotKeysToUpdate.forEach(sk => {
          const sd = character.bodySlots[sk];
          if (!sd) return;
          sd.baseItemId = forgedV2Item.baseItemId || forgedV2Item.id || sd.baseItemId || null;
          sd.name = newName;
          sd.masterDbName = newName;
          sd.category = cat;
          sd.weight = newWeight;
          sd.cost = newCost;
          sd.desc = newDesc;
          sd.benefit = newDesc;
          sd.description = newDesc;
          sd.material = forgedV2Item.material || null;
          sd.enhancementBonus = Number(forgedV2Item.enhancementBonus) || 0;
          sd.enhancements = Array.isArray(forgedV2Item.enhancements) ? forgedV2Item.enhancements.slice() : [];
          sd.modifiers = JSON.parse(JSON.stringify(clonedModifiers));
          sd.damageParts = JSON.parse(JSON.stringify(clonedDamageParts));
          sd.modes = JSON.parse(JSON.stringify(clonedModes));
          sd.weaponMeta = clonedWeaponMeta ? JSON.parse(JSON.stringify(clonedWeaponMeta)) : null;
          sd.armorMeta = clonedArmorMeta ? JSON.parse(JSON.stringify(clonedArmorMeta)) : null;
          sd.ruleFlags = JSON.parse(JSON.stringify(clonedRuleFlags));
          sd.tacticalBadges = JSON.parse(JSON.stringify(clonedTacticalBadges));
          sd.dice = (primaryPart && primaryPart.dice) || forgedV2Item.dice || sd.dice;
          sd.critMin = Number(forgedV2Item.weaponMeta?.critMin || forgedV2Item.critMin) || sd.critMin;
          sd.critMult = Number(forgedV2Item.weaponMeta?.critMult || forgedV2Item.critMult) || sd.critMult;
          sd.dmgType = (primaryPart && primaryPart.type) || forgedV2Item.dmgType || sd.dmgType;
          if (computedAcBonus !== undefined) sd.acBonus = computedAcBonus;
          if (clonedArmorMeta) {
            sd.maxDex = clonedArmorMeta.maxDex;
            sd.checkPenalty = clonedArmorMeta.acp;
          }
        });
      }

      // 3. Update character.weapons and tactical weapon sets if Weapon
      if (cat === 'Weapon' || originalItem?.category === 'Weapon') {
        if (!Array.isArray(character.weapons)) character.weapons = [];
        const wepIdx = character.weapons.findIndex(w => {
          if (!w) return false;
          if (originalItem?.id !== undefined && w.id === originalItem.id) return true;
          return oldNameLower && String(w.name || '').toLowerCase().trim() === oldNameLower;
        });

        const updatedWepObj = {
          id: forgedV2Item.id || originalItem?.id || ('wep_' + Date.now()),
          baseItemId: forgedV2Item.baseItemId || forgedV2Item.id || null,
          name: newName,
          grip: (clonedWeaponMeta?.handedness || '').includes('Two') ? '2-Hand' : (wepIdx >= 0 ? character.weapons[wepIdx].grip : '1-Hand'),
          dice: (primaryPart && primaryPart.dice) || forgedV2Item.dice || '1d8',
          damageParts: JSON.parse(JSON.stringify(clonedDamageParts)),
          modifiers: JSON.parse(JSON.stringify(clonedModifiers)),
          modes: JSON.parse(JSON.stringify(clonedModes)),
          weaponMeta: clonedWeaponMeta ? JSON.parse(JSON.stringify(clonedWeaponMeta)) : null,
          ruleFlags: JSON.parse(JSON.stringify(clonedRuleFlags)),
          tacticalBadges: JSON.parse(JSON.stringify(clonedTacticalBadges)),
          critMin: Number(clonedWeaponMeta?.critMin || forgedV2Item.critMin) || 20,
          rawCritMin: Number(clonedWeaponMeta?.critMin || forgedV2Item.critMin) || 20,
          critMult: Number(clonedWeaponMeta?.critMult || forgedV2Item.critMult) || 2,
          enhancementBonus: Number(forgedV2Item.enhancementBonus) || 0,
          dmgType: (primaryPart && primaryPart.type) || forgedV2Item.dmgType || 'Slashing',
          bonusType: 'enhancement',
          tags: forgedV2Item.tags || [],
          elementalMods: secondaryParts.map(sp => ({ name: sp.source || sp.type, dice: sp.dice, type: sp.type })),
          keen: Boolean(clonedRuleFlags && clonedRuleFlags.keen)
        };

        if (wepIdx >= 0) {
          character.weapons[wepIdx] = Object.assign({}, character.weapons[wepIdx], updatedWepObj);
        } else {
          character.weapons.push(updatedWepObj);
        }

        if (oldNameLower && String(character.activeWeapon || '').toLowerCase().trim() === oldNameLower) {
          character.activeWeapon = newName;
        }
        if (oldNameLower && String(character.activeOffHand || '').toLowerCase().trim() === oldNameLower) {
          character.activeOffHand = newName;
        }
        if (character.tactical?.weaponSets) {
          const s1 = character.tactical.weaponSets.set1;
          const s2 = character.tactical.weaponSets.set2;
          if (s1 && oldNameLower && String(s1.mainWeapon || '').toLowerCase().trim() === oldNameLower) {
            s1.mainWeapon = newName;
          }
          if (s2 && oldNameLower && String(s2.mainWeapon || '').toLowerCase().trim() === oldNameLower) {
            s2.mainWeapon = newName;
          }
        }
      }

      // 4. Register assembled custom item in masterDb if modified
      if (typeof masterDb !== 'undefined' && Array.isArray(masterDb) && (forgedV2Item.enhancementBonus > 0 || forgedV2Item.material || (forgedV2Item.enhancements && forgedV2Item.enhancements.length > 0))) {
        const existingIdx = masterDb.findIndex(m => m && String(m.name || '').toLowerCase().trim() === newName.toLowerCase());
        if (existingIdx >= 0) {
          masterDb[existingIdx] = Object.assign({}, masterDb[existingIdx], forgedV2Item);
        } else {
          masterDb.push(forgedV2Item);
        }
      }

      if (typeof RuleEngine !== 'undefined' && typeof RuleEngine.recalculateCharacter === 'function') {
        RuleEngine.recalculateCharacter(character, typeof masterDb !== 'undefined' ? masterDb : []);
      }

      saveStateToStorage(true);
      renderAll();

      if (typeof showDiceTopToast === 'function') {
        showDiceTopToast({
          icon: '⚒️',
          title: 'Item Reforged',
          breakdown: oldName && oldName !== newName
            ? `"${oldName}" reforged into "${newName}".`
            : `"${newName}" properties updated in Item Forge.`,
          total: `${newCost.toLocaleString('en-US')} gp`
        });
      }
    }

    function openForgeForPoolItem(itemId) {
      const item = (character.gearPool || []).find(p => p && String(p.id) === String(itemId));
      if (!item) return;
      closeSlotEquipModal();
      if (window.DnDUI && typeof window.DnDUI.openCompendiumDrawer === 'function') {
        window.DnDUI.openCompendiumDrawer({
          defaultTab: 'forge',
          editMode: true,
          forgeItem: item,
          onSelect: (assembledItem) => applyForgedItemUpdate(item, null, assembledItem)
        });
      }
    }
    window.openForgeForPoolItem = openForgeForPoolItem;

    function openForgeForSlotItem(slotKey) {
      const slotData = character.bodySlots?.[slotKey];
      if (!slotData || !slotData.name || slotData.name === '-') return;
      const cleanSlotName = String(slotData.name || '').toLowerCase().trim();
      const poolMatch = (character.gearPool || []).find(p => p && String(p.name || '').toLowerCase().trim() === cleanSlotName);
      const sourceItem = poolMatch || slotData;
      closeSlotEquipModal();
      if (window.DnDUI && typeof window.DnDUI.openCompendiumDrawer === 'function') {
        window.DnDUI.openCompendiumDrawer({
          defaultTab: 'forge',
          editMode: true,
          forgeItem: sourceItem,
          onSelect: (assembledItem) => applyForgedItemUpdate(sourceItem, slotKey, assembledItem)
        });
      }
    }
    window.openForgeForSlotItem = openForgeForSlotItem;

    function openForgeForSpotlightItem(idx, isAi = false) {
      const item = isAi ? window._poolCurrentAiEntries?.[idx] : window._poolCurrentMatches?.[idx];
      if (!item) return;
      if (window.DnDUI && typeof window.DnDUI.openCompendiumDrawer === 'function') {
        window.DnDUI.openCompendiumDrawer({
          defaultTab: 'forge',
          editMode: false,
          forgeItem: item,
          onSelect: (assembledItem) => addV2ItemToCharacterGearPool(assembledItem)
        });
      }
    }
    window.openForgeForSpotlightItem = openForgeForSpotlightItem;

    function openCharacterCompendiumDrawer(defaultCategory = 'all_gear') {
      resetAddPoolCustomTabForm();
      if (window.DnDUI && typeof window.DnDUI.openCompendiumDrawer === 'function') {
        window.DnDUI.openCompendiumDrawer({
          defaultTab: 'custom',
          category: defaultCategory,
          onSelect: (entry) => addV2ItemToCharacterGearPool(entry)
        });
      }
    }

    function selectActiveWeaponMode(modeId) {
      if (!character || !Array.isArray(character.weapons)) return;
      const wep = character.weapons.find(w => w.name === character.activeWeapon) || character.weapons[0];
      if (!wep) return;
      wep.activeModeId = (wep.activeModeId === modeId) ? null : modeId;
      const dbWep = typeof findMasterItem === 'function' ? findMasterItem(wep.name) : null;
      const modesList = (Array.isArray(wep.modes) && wep.modes.length > 0) ? wep.modes : (Array.isArray(dbWep?.modes) ? dbWep.modes : []);
      const chosenMode = modesList.find(m => (m.id || m.name) === wep.activeModeId);
      if (chosenMode && Array.isArray(chosenMode.damageParts) && chosenMode.damageParts[0]?.dice) {
        if (!Array.isArray(character.activeModifiers)) character.activeModifiers = [];
        const modName = `${wep.name}: ${chosenMode.name}`;
        let existingMod = character.activeModifiers.find(m => m.name === modName);
        if (!existingMod) {
          existingMod = {
            name: modName,
            source: wep.name,
            bonusAtk: 0,
            dice: chosenMode.damageParts[0].dice,
            type: chosenMode.damageParts[0].type || 'Energy',
            active: true
          };
          character.activeModifiers.push(existingMod);
        } else {
          existingMod.active = true;
        }
      }
      saveStateToStorage(false);
      recalculateOffense();
    }

    // ====================================================
    // 🧪 HIZLI TÜKETİM, ASALAR VE SİHİRLİ EŞYA SİSTEMİ
    // (İyileşme, Saldırı/Hasar Asaları ve Günlük Şarj Takibi)
    // ====================================================

    // Kontrol: Silah mı ve büyüsel saldırı/iyileştirme özelliği yok mu?
    function isWeaponWithoutMagicOrHealing(item, slotKey = '') {
      if (!item) return false;
      const name = (item.name || '').toLowerCase().trim();
      const desc = (item.desc || item.effect || '').toLowerCase().trim();
      const cat = item.category || (typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(item) : '');
      const catLower = String(cat || '').toLowerCase().trim();
      const typeLower = String(item.type || '').toLowerCase().trim();
      const effSlotKey = slotKey || item.slotKey || '';
      const combined = name + ' ' + desc;

      // Exclude non-gear rule entries (feats, special abilities, boons, spells, maneuvers, etc.)
      if (['feat', 'special ability', 'dm grant', 'dm boon', 'boon', 'class feature', 'racial trait', 'spell', 'maneuver', 'stance'].includes(catLower)) {
        return true;
      }

      // Asalar, iksirler, parşömenler asla silah sayılmaz
      if (/wand|scroll|potion/i.test(name)) return false;

      // Exclude physical Armor and Shield items unless they explicitly have dailyCharges, charges > 0, or an active mode
      const isArmorOrShield = (
        catLower === 'armor' ||
        catLower === 'shield' ||
        typeLower === 'armor' ||
        typeLower === 'shield' ||
        effSlotKey === 'armor' ||
        (effSlotKey === 'offHand' && /shield|buckler/i.test(name + ' ' + catLower))
      );
      if (isArmorOrShield) {
        const hasExplicitChargesOrActiveMode = (
          Number(item.dailyCharges?.max || item.dailyCharges) > 0 ||
          Number(item.charges) > 0 ||
          (Array.isArray(item.modes) && item.modes.some(m => m && m.actionType && m.actionType !== 'passive'))
        );
        return !hasExplicitChargesOrActiveMode;
      }

      // 1. Silah kategorisi veya tanınan silah ismi kontrolü
      const isWeaponCat = (cat === 'Weapon' || catLower === 'weapon' || typeLower === 'weapon');
      const isWeaponSlot = (effSlotKey === 'mainHand' || effSlotKey === 'offHand');
      const knownWeapons = [
        'dagger', 'rapier', 'longsword', 'shortsword', 'greatsword', 'scimitar',
        'falchion', 'handaxe', 'battleaxe', 'greataxe', 'halberd', 'spear', 'longspear',
        'mace', 'heavy mace', 'light mace', 'morningstar', 'warhammer', 'club', 'quarterstaff',
        'flail', 'heavy flail', 'shortbow', 'longbow', 'composite shortbow', 'composite longbow',
        'light crossbow', 'heavy crossbow', 'hand crossbow', 'sling', 'dart', 'javelin',
        'shuriken', 'kama', 'nunchaku', 'siangham', 'sai', 'kukri', 'spiked chain', 'bastard sword',
        'dwarven waraxe', 'gnome hooked hammer', 'orc double axe', 'dire flail', 'two-bladed sword'
      ];
      const isKnownWeapon = knownWeapons.some(w => name === w || name.startsWith(w + ' ') || name.startsWith(w + '+'));

      if (!isWeaponCat && !isWeaponSlot && !isKnownWeapon) {
        return false;
      }

      // 2. Büyüsel saldırı veya iyileştirme özelliği var mı?
      // A) Günlük şarj kontrolü (örn: 3/day, 1/gün vb.)
      const charges = ensureItemDailyCharges(item);
      if (charges && typeof charges.max === 'number' && charges.max > 0) {
        return false; // Günlük büyü/özelliği var, tutulsun
      }

      // B) İyileştirme özelliği
      const hasHealing = /cure|heal|healing/i.test(combined);

      // C) Büyüsel saldırı veya hasar etkisi (örn: Fireball, Magic Missile, Lightning, 1d6 ateş hasarı vb.)
      const hasSpellAttack = /(?:fireball|magic missile|lightning|scorching|cone of cold|ice storm|flame strike|vampiric touch|shocking grasp|inflict)/i.test(combined) ||
                             /(?:spell attack|spell-like|sla\b|(?:\d+)\s*\/\s*day)/i.test(combined) ||
                             /damage.*(?:fire|cold|acid|electric|force)/i.test(desc);

      if (hasHealing || hasSpellAttack) {
        return false; // Büyüsel saldırı veya iyileştirme özelliği var, tutulsun
      }

      // Normal silah (büyüsel saldırı veya iyileştirme özelliği yok) -> Hızlı Tüketimden çıkarılsın!
      return true;
    }

    // Günlük Şarj Takip Edici (Örn: Witchlight Reservoir 5 charges/day, Boots of Speed 10 rounds/day, Ring of Sending 3/day)
    function ensureItemDailyCharges(item) {
      if (!item) return null;
      if (item.dailyCharges && typeof item.dailyCharges.max === 'number') {
        if (item.dailyCharges.current === undefined) item.dailyCharges.current = item.dailyCharges.max;
        if (!item.dailyCharges.unit) item.dailyCharges.unit = 'charges';
        return item.dailyCharges;
      }
      const lowerName = (item.name || '').toLowerCase();
      if (lowerName.includes('healing belt')) {
        item.dailyCharges = { current: 3, max: 3, unit: 'charges', recharge: 'long_rest' };
        return item.dailyCharges;
      }
      if (lowerName.includes('witchlight reservoir')) {
        item.dailyCharges = { current: 5, max: 5, unit: 'charges', recharge: 'long_rest' };
        return item.dailyCharges;
      }
      if (lowerName.includes('boots of speed')) {
        item.dailyCharges = { current: 10, max: 10, unit: 'rounds', recharge: 'long_rest' };
        return item.dailyCharges;
      }
      if (lowerName.includes('belt of battle')) {
        item.dailyCharges = { current: 3, max: 3, unit: 'charges', recharge: 'long_rest' };
        return item.dailyCharges;
      }
      const combined = `${item.name || ''} ${item.desc || ''} ${item.effect || ''} ${item.benefit || ''}`;
      const match = combined.match(/(\d+)\s*(?:charges?|rounds?|uses?|times?)?\s*(?:\/|\s*per\s*|\s*x\s*|\s*a\s*)\s*day/i);
      if (match) {
        const maxVal = parseInt(match[1]) || 1;
        let unit = 'charges';
        const matchedStr = match[0].toLowerCase();
        if (matchedStr.includes('round')) unit = 'rounds';
        else if (matchedStr.includes('use')) unit = 'uses';
        item.dailyCharges = { current: maxVal, max: maxVal, unit: unit, recharge: 'long_rest' };
        return item.dailyCharges;
      }
      return null;
    }

    function spendSlotCharge(slotKey, amount = 1) {
      const item = character.bodySlots?.[slotKey];
      if (!item) return;
      if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function' && window.CharStore.getDoc()) {
        window.CharStore.dispatch({ type: 'inventory/adjustSlotCharge', payload: { slotKey, delta: -Math.abs(Number(amount) || 1) } });
        const out = window.CharStore.getLastOutcome ? window.CharStore.getLastOutcome() : null;
        if (out && out.status === 'charges_exhausted') {
          showDiceTopToast({
            icon: '⏳',
            title: item.name || 'Charged Item',
            breakdown: 'All daily charges expended! Resets on a Long Rest (☀️).',
            total: '0 Charges'
          });
          return;
        }
        renderAll();
        const dcNow = character.bodySlots?.[slotKey]?.dailyCharges || out?.dailyCharges;
        if (dcNow) {
          showDiceTopToast({
            icon: '⚡',
            title: item.name || 'Charge Expended',
            breakdown: `Expended ${amount} charge(s). Remaining: ${dcNow.current}/${dcNow.max} ${dcNow.unit || 'charges'}.`,
            total: `${dcNow.current}/${dcNow.max}`
          });
        }
        return;
      }
      const dc = ensureItemDailyCharges(item);
      if (!dc || dc.current <= 0) {
        showDiceTopToast({
          icon: '⏳',
          title: item.name || 'Charged Item',
          breakdown: 'All daily charges expended! Resets on a Long Rest (☀️).',
          total: '0 Charges'
        });
        return;
      }
      dc.current = Math.max(0, dc.current - amount);
      saveStateToStorage(true);
      renderAll();
      showDiceTopToast({
        icon: '⚡',
        title: item.name || 'Charge Expended',
        breakdown: `Expended ${amount} charge(s). Remaining: ${dc.current}/${dc.max} ${dc.unit || 'charges'}.`,
        total: `${dc.current}/${dc.max}`
      });
    }

    function restoreSlotCharge(slotKey, amount = 1) {
      const item = character.bodySlots?.[slotKey];
      if (!item) return;
      if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function' && window.CharStore.getDoc()) {
        window.CharStore.dispatch({ type: 'inventory/adjustSlotCharge', payload: { slotKey, delta: Math.abs(Number(amount) || 1) } });
        renderAll();
        return;
      }
      const dc = ensureItemDailyCharges(item);
      if (!dc || dc.current >= dc.max) return;
      dc.current = Math.min(dc.max, dc.current + amount);
      saveStateToStorage(true);
      renderAll();
    }

    function isItemBuffActive(item) {
      if (!item || !Array.isArray(character.buffs)) return false;
      const cleanName = (item.name || '').toLowerCase();
      return character.buffs.some(b => b.active && (
        (b.source && b.source.toLowerCase().includes(cleanName)) ||
        (cleanName.includes('boots of speed') && (b.name || '').toLowerCase().includes('haste')) ||
        ((b.name || '').toLowerCase().includes(cleanName))
      ));
    }

    // Boots of Speed (DMG p.248) grant the haste spell: its V2 effect (typed modifiers + ruleFlags) comes from the SRD record.
    function getSrdHasteEffect() {
      const haste = (typeof SrdCompendium !== 'undefined' && SrdCompendium.getById) ? SrdCompendium.getById('spl-haste') : null;
      return {
        modifiers: JSON.parse(JSON.stringify(haste?.modifiers || [])),
        ruleFlags: JSON.parse(JSON.stringify(haste?.ruleFlags || {}))
      };
    }

    function castDailyRoundItem(encodedName, slotKey) {
      const name = decodeURIComponent(encodedName);
      let item = null;
      if (slotKey && character.bodySlots?.[slotKey]) {
        item = character.bodySlots[slotKey];
      }
      if (!item && character.bodySlots) {
        for (const [sk, sItem] of Object.entries(character.bodySlots)) {
          if (sItem && sItem.name === name) {
            item = sItem;
            break;
          }
        }
      }
      if (!item && Array.isArray(character.gearPool)) {
        item = character.gearPool.find(g => g && g.name === name);
      }
      if (!item) return;

      const dc = ensureItemDailyCharges(item);
      if (!dc || dc.current <= 0) {
        showDiceTopToast({
          icon: '⏳',
          title: item.name,
          breakdown: `All daily charges (${dc?.max || 0} ${dc?.unit || 'rounds'}) expended! Resets on a Long Rest (☀️).`,
          total: '0 Rounds'
        });
        return;
      }

      dc.current = Math.max(0, dc.current - 1);
      const cleanName = item.name.toLowerCase();

      if (cleanName.includes('boots of speed')) {
        if (!Array.isArray(character.buffs)) character.buffs = [];
        const existing = character.buffs.find(b => b.name && b.name.toLowerCase().includes('haste'));
        if (existing) {
          existing.active = true;
          existing.rounds = (Number(existing.rounds) || 0) + 1;
          existing.durationText = `${existing.rounds} Rounds`;
        } else {
          character.buffs.push({
            id: 'buff_boots_haste',
            name: 'Haste (Boots of Speed)',
            active: true,
            rounds: 1,
            ...getSrdHasteEffect(),
            durationText: '1 Round',
            source: 'Boots of Speed'
          });
        }
        showDiceTopToast({
          icon: '🏃',
          title: 'Boots of Speed: Activated!',
          breakdown: `Haste activated (+1 Attack, +1 Dodge AC, +30 ft Speed, +1 extra attack on Full Attack). Remaining: ${dc.current}/${dc.max} Rounds.`,
          total: 'Cast (1 Rd)'
        });
      } else {
        if (!Array.isArray(character.buffs)) character.buffs = [];
        const buffId = 'buff_' + item.name.replace(/\s+/g, '_').toLowerCase();
        const existing = character.buffs.find(b => b.id === buffId || (b.source && b.source === item.name));
        if (existing) {
          existing.active = true;
          existing.rounds = (Number(existing.rounds) || 0) + 1;
          existing.durationText = `${existing.rounds} Rounds`;
        } else {
          character.buffs.push({
            id: buffId,
            name: item.name,
            active: true,
            rounds: 1,
            durationText: '1 Round',
            source: item.name
          });
        }
        showDiceTopToast({
          icon: '⚡',
          title: `${item.name}: Activated!`,
          breakdown: `Applied to active buffs for 1 round. Remaining: ${dc.current}/${dc.max} ${dc.unit || 'rounds'}.`,
          total: 'Cast (1 Rd)'
        });
      }

      saveStateToStorage(true);
      renderAll();
    }

    function dischargeDailyRoundItem(encodedName, slotKey) {
      const name = decodeURIComponent(encodedName);
      let item = null;
      if (slotKey && character.bodySlots?.[slotKey]) {
        item = character.bodySlots[slotKey];
      }
      if (!item && character.bodySlots) {
        for (const [sk, sItem] of Object.entries(character.bodySlots)) {
          if (sItem && sItem.name === name) {
            item = sItem;
            break;
          }
        }
      }
      if (!item && Array.isArray(character.gearPool)) {
        item = character.gearPool.find(g => g && g.name === name);
      }
      const cleanName = (item?.name || name).toLowerCase();

      let dischargedCount = 0;
      if (Array.isArray(character.buffs)) {
        character.buffs.forEach(b => {
          const bName = (b.name || '').toLowerCase();
          const bSource = (b.source || '').toLowerCase();
          if (b.active && (
            bSource.includes(cleanName) ||
            bName.includes(cleanName) ||
            (cleanName.includes('boots of speed') && bName.includes('haste'))
          )) {
            b.active = false;
            b.rounds = 0;
            dischargedCount++;
          }
        });
      }

      const dc = item ? ensureItemDailyCharges(item) : null;
      const remStr = dc ? ` (Remaining: ${dc.current}/${dc.max} ${dc.unit || 'rounds'})` : '';

      if (dischargedCount > 0) {
        showDiceTopToast({
          icon: '🛑',
          title: `${item?.name || name}: Ended!`,
          breakdown: `Active spell/item effect ended${remStr}.`,
          total: 'Ended'
        });
      } else {
        showDiceTopToast({
          icon: 'ℹ️',
          title: `${item?.name || name}`,
          breakdown: `No active effect currently running.${remStr}`,
          total: 'Inactive'
        });
      }

      saveStateToStorage(true);
      renderAll();
    }

    function getItemDailyOptions(item) {
      if (!item) return [];
      if (Array.isArray(item.chargeOptions) && item.chargeOptions.length > 0) {
        return item.chargeOptions;
      }
      const itemName = (item.name || '').toLowerCase().trim();
      if (Array.isArray(window.masterDb)) {
        const children = window.masterDb.filter(m => (m.parent || '').toLowerCase().trim() === itemName);
        if (children.length > 0) {
          return children.map(ch => ({
            label: ch.name.replace(/^\u21B3\s*/, ''),
            cost: Number(ch.chargeCost) || 1,
            dice: ch.dice || ch.formula || null,
            effectType: ch.effectType || 'custom',
            type: ch.effectType || 'custom',
            buffName: ch.buffName,
            bonusAtk: ch.bonusAtk,
            bonusDmg: ch.bonusDmg,
            speedBonus: ch.speedBonus
          }));
        }
      }

      if (itemName.includes('healing belt')) {
        return [
          { label: '1 Charge: Heal 2d8 HP', cost: 1, dice: '2d8', effectType: 'heal' },
          { label: '2 Charges: Heal 3d8 HP', cost: 2, dice: '3d8', effectType: 'heal' },
          { label: '3 Charges: Heal 4d8 HP', cost: 3, dice: '4d8', effectType: 'heal' }
        ];
      }
      if (itemName.includes('witchlight reservoir')) {
        return [
          { label: '1 Charge: +2 Melee Damage (1 Rd)', cost: 1, type: 'buff', buffName: 'Witchlight (+2 Damage)', bonusDmg: 2 },
          { label: '2 Charges: +4 Melee Damage (1 Rd)', cost: 2, type: 'buff', buffName: 'Witchlight (+4 Damage)', bonusDmg: 4 },
          { label: '2 Charges: +20 ft Speed (1 Rd)', cost: 2, type: 'buff', buffName: 'Witchlight (+20 ft Speed)', speedBonus: 20 }
        ];
      }
      if (itemName.includes('boots of speed')) {
        return [
          { label: 'Activate (Spend 1 Round)', action: 'cast', cost: 1, type: 'haste' },
          { label: 'End Effect (Dismiss)', action: 'discharge', cost: 0, type: 'discharge' }
        ];
      }
      if (itemName.includes('belt of battle')) {
        return [
          { label: '1 Charge: Extra Move Action', cost: 1, type: 'info', note: 'Granted an extra Move Action!' },
          { label: '2 Charges: Extra Standard Action', cost: 2, type: 'info', note: 'Granted an extra Standard Action!' },
          { label: '3 Charges: Extra Full-Round Action', cost: 3, type: 'info', note: 'Granted an extra Full-Round Action!' }
        ];
      }

      const isRoundUnit = item.dailyCharges && (item.dailyCharges.unit === 'rounds' || item.dailyCharges.unit === 'turn');
      if (isRoundUnit) {
        return [
          { label: 'Activate (Spend 1 Round)', action: 'cast', cost: 1, type: 'cast' },
          { label: 'End Effect (Dismiss)', action: 'discharge', cost: 0, type: 'discharge' }
        ];
      }

      return [
        { label: `Spend 1 ${item.dailyCharges?.unit || 'Charge'}`, cost: 1 }
      ];
    }

    function consumeCockpitDailyItem(encodedName, slotKey) {
      const name = decodeURIComponent(encodedName);
      let item = null;
      let isSlot = false;
      if (slotKey && character.bodySlots?.[slotKey]) {
        item = character.bodySlots[slotKey];
        isSlot = true;
      }
      if (!item && character.bodySlots) {
        for (const [sk, sItem] of Object.entries(character.bodySlots)) {
          if (sItem && sItem.name === name) {
            item = sItem;
            isSlot = true;
            slotKey = sk;
            break;
          }
        }
      }
      if (!item && Array.isArray(character.gearPool)) {
        item = character.gearPool.find(g => g && g.name === name);
      }
      if (!item && Array.isArray(character.consumables)) {
        item = character.consumables.find(c => c && c.name === name);
      }
      if (!item) return;

      const dc = ensureItemDailyCharges(item);
      if (!dc || dc.current <= 0) {
        showDiceTopToast({
          icon: '⏳',
          title: item.name,
          breakdown: `All daily charges (${dc?.max || 0} ${dc?.unit || 'charges'}) expended! Resets on a Long Rest (☀️).`,
          total: '0 Charges'
        });
        return;
      }

      const options = getItemDailyOptions(item);

      if (options.length === 1) {
        executeItemOption(item, options[0]);
        return;
      }

      const currentCharges = dc.current;
      const unitName = dc.unit || 'Charges';
      const actions = options.map((opt) => {
        const cost = Number(opt.cost) || 1;
        const canAfford = currentCharges >= cost;
        let btnClass = 'px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition shadow cursor-pointer inline-flex items-center gap-1.5 ';
        if (!canAfford) {
          btnClass += 'bg-slate-800 text-slate-500 border border-slate-700 opacity-60 cursor-not-allowed';
        } else if (opt.effectType === 'heal' || (opt.dice && opt.dice.includes('d8'))) {
          btnClass += 'bg-emerald-900/90 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/80 active:scale-95';
        } else if (opt.type === 'haste') {
          btnClass += 'bg-cyan-900/90 hover:bg-cyan-700 text-cyan-100 border border-cyan-500/80 active:scale-95';
        } else {
          btnClass += 'bg-amber-950/90 hover:bg-amber-800 text-amber-200 hover:text-white border border-amber-500/80 active:scale-95';
        }

        let diceIcon = '';
        if (opt.dice) {
          diceIcon = getFormulaDiceIconSvg(opt.dice, 'w-3.5 h-3.5 text-amber-300 shrink-0');
        } else if (opt.effectType === 'heal') {
          diceIcon = '💚';
        } else if (opt.type === 'haste') {
          diceIcon = '🏃';
        } else {
          diceIcon = '⚡';
        }

        return {
          label: `${diceIcon}<span>${UI.escapeHtml(opt.label)}</span>`,
          className: btnClass,
          onClick: () => {
            if (!canAfford) {
              showDiceTopToast({ icon: '⚠️', title: 'Insufficient Charges', breakdown: `Requires ${cost} ${unitName}. Available: ${currentCharges}`, total: 'Error' });
              return;
            }
            executeItemOption(item, opt);
          }
        };
      });

      actions.push({
        label: '<span>Cancel</span>',
        className: 'px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer',
        onClick: () => {
          const el = document.getElementById('dice-top-toast');
          if (el) el.remove();
        }
      });

      showDiceTopToast({
        icon: '⚡',
        title: `${item.name} (${currentCharges}/${dc.max} ${unitName})`,
        breakdown: 'Select the effect and charges to spend:',
        total: `${currentCharges} ${unitName}`,
        actions: actions
      }, { replaceId: 'dice-roll-active-toast', autoDismiss: false, stack: false });
    }

    function executeItemOption(item, opt) {
      if (!item || !opt) return;

      // Handle round-based Discharge
      if (opt.action === 'discharge' || opt.type === 'discharge') {
        dischargeDailyRoundItem(encodeURIComponent(item.name), item.slotKey);
        return;
      }
      // Handle round-based Cast
      if (opt.action === 'cast' || opt.type === 'cast') {
        castDailyRoundItem(encodeURIComponent(item.name), item.slotKey);
        return;
      }

      const dc = ensureItemDailyCharges(item);
      if (!dc) return;
      const cost = Number(opt.cost) || 1;
      if (dc.current < cost) {
        showDiceTopToast({ icon: '⚠️', title: 'Insufficient Charges', breakdown: `Requires ${cost} ${dc.unit || 'charges'}, available: ${dc.current}`, total: 'Error' });
        return;
      }
      dc.current -= cost;

      if (opt.dice) {
        rollSpellOrManeuverFormula(opt.dice, `${item.name} (${opt.label})`, { name: item.name, effectType: opt.effectType || 'heal' });
      } else if (opt.type === 'haste') {
        if (!Array.isArray(character.buffs)) character.buffs = [];
        const existingHaste = character.buffs.find(b => b.name && b.name.toLowerCase().includes('haste'));
        if (existingHaste) {
          existingHaste.active = true;
          existingHaste.duration = 1;
          existingHaste.durationText = '1 Round';
        } else {
          character.buffs.push({
            id: 'buff_boots_haste',
            name: 'Haste (Boots of Speed)',
            active: true,
            ...getSrdHasteEffect(),
            duration: 1,
            durationText: '1 Round',
            source: 'Boots of Speed'
          });
        }
        showDiceTopToast({
          icon: '🏃',
          title: 'Boots of Speed Active!',
          breakdown: `Haste active for 1 round (+1 Attack, +1 Dodge AC, +30 ft Speed, +1 extra attack on Full Attack). Remaining: ${dc.current}/${dc.max} Rounds.`,
          total: '+1 Rd Haste'
        });
      } else if (opt.type === 'buff' && opt.buffName) {
        if (!Array.isArray(character.buffs)) character.buffs = [];
        character.buffs.push({
          id: 'buff_' + Date.now(),
          name: opt.buffName,
          active: true,
          modifiers: [
            ...(Number(opt.bonusAtk) ? [{ target: 'attack.all', value: Number(opt.bonusAtk), formula: String(Number(opt.bonusAtk)), type: 'untyped', condition: null }] : []),
            ...(Number(opt.bonusDmg) ? [{ target: 'damage.weapon', value: Number(opt.bonusDmg), formula: String(Number(opt.bonusDmg)), type: 'untyped', condition: null }] : [])
          ],
          speedBonus: opt.speedBonus || 0,
          duration: 1,
          durationText: '1 Round',
          source: item.name
        });
        showDiceTopToast({
          icon: '⚡',
          title: `${opt.buffName} Active!`,
          breakdown: `Applied to active buffs for 1 round. Remaining: ${dc.current}/${dc.max} ${dc.unit || 'charges'}.`,
          total: 'Active'
        });
      } else {
        showDiceTopToast({
          icon: '⚡',
          title: `Used ${item.name}!`,
          breakdown: `${opt.label || opt.note || 'Spent 1 charge'}. Remaining: ${dc.current}/${dc.max} ${dc.unit || 'charges'}.`,
          total: `${dc.current}/${dc.max}`
        });
      }

      saveStateToStorage(true);
      renderAll();
    }

    function renderConsumables(containerOverride, sheetOverride) {
      const container = containerOverride || (typeof document !== 'undefined' ? document.getElementById('consumables-container') : null);
      if (!container && !sheetOverride) return '';

      const sheetView = sheetOverride
        || (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.getSheet === 'function' ? window.CharStore.getSheet() : null)
        || (typeof RuleEngine !== 'undefined' && typeof RuleEngine.deriveSheet === 'function' && typeof character !== 'undefined'
          ? RuleEngine.deriveSheet(character, typeof masterDb !== 'undefined' ? masterDb : [])
          : null);
      const cg = sheetView?.inventory?.consumablesGrouped
        || (typeof RuleEngine !== 'undefined' && typeof RuleEngine.deriveConsumablesView === 'function' && typeof character !== 'undefined'
          ? RuleEngine.deriveConsumablesView(character)
          : { allItems: [], byGroup: {} });

      if (typeof UI !== 'undefined' && typeof UI.renderConsumablesView === 'function') {
        return UI.renderConsumablesView(container, cg);
      }
      return '';
    }

    function emitConsumableUseFeedback(outcome) {
      if (!outcome || !outcome.status) return;
      const name = outcome.name || 'Magic Item';
      const remainingInfo = outcome.remainingInfo || '';

      if (outcome.status === 'healed_minor') {
        addDiceHistoryEntry({
          icon: '💖',
          title: `${name}`,
          formula: '1 HP',
          breakdown: `Cure Minor Wounds: +1 HP • HP: ${outcome.prevHp} ➔ ${outcome.newHp}/${outcome.maxHp} • ${remainingInfo}`,
          total: '+1 HP'
        });
        return;
      }

      if (outcome.status === 'healed_spell') {
        const curedText = Array.isArray(outcome.healCured) && outcome.healCured.length > 0
          ? ` • Cured Conditions: ${outcome.healCured.join(', ')}`
          : '';
        addDiceHistoryEntry({
          icon: '💖',
          title: `${name} (Heal & Cure)`,
          formula: `${outcome.healTotal} HP`,
          breakdown: `Heal: +${outcome.healTotal} HP • HP: ${outcome.prevHp} ➔ ${outcome.newHp}/${outcome.maxHp}${curedText} • ${remainingInfo}`,
          total: `+${outcome.healTotal} HP`
        });
        return;
      }

      if (outcome.status === 'healed_dice') {
        const rollVals = Array.isArray(outcome.rolls) ? outcome.rolls.map(r => (typeof r === 'object' ? r.value : r)) : [];
        const dSides = outcome.diceSides || 8;
        const flatB = Number(outcome.flatBonus) || 0;
        const bonusSuffix = flatB !== 0 ? (flatB > 0 ? `+${flatB}` : `${flatB}`) : '';
        const bonusBreakdown = flatB !== 0 ? ` + ${flatB}` : '';
        addDiceHistoryEntry({
          icon: '💖',
          title: `${name}`,
          formula: `${outcome.diceCount}d${dSides}${bonusSuffix}`,
          breakdown: `${outcome.diceCount}d${dSides} [${rollVals.join(' + ')}]${bonusBreakdown} • HP: ${outcome.prevHp} ➔ ${outcome.newHp}/${outcome.maxHp} • ${remainingInfo}`,
          total: `+${outcome.healTotal} HP`
        });
        return;
      }

      if (outcome.status === 'damage_roll') {
        const dp = outcome.damagePlan || {};
        const rolls = Array.isArray(outcome.rolls) ? outcome.rolls : [];
        const totalDamage = outcome.totalDamage || 0;
        let breakdownText = '';
        if (dp.isMagicMissile) {
          breakdownText = `${dp.missiles} Missiles: [${rolls.map(v => `${v}+1`).join(' + ')}] = ${totalDamage} Force Damage • ${remainingInfo}`;
        } else {
          breakdownText = `${dp.formula} [${rolls.join(' + ')}]${dp.flatBonus ? ` + ${dp.flatBonus}` : ''} = ${totalDamage} ${dp.typeName}${dp.saveDesc ? ` (${dp.saveDesc})` : ''} • ${remainingInfo}`;
        }
        addDiceHistoryEntry({
          icon: dp.icon || '💥',
          title: `${name} (Damage Roll)`,
          formula: dp.formula || 'Damage',
          breakdown: breakdownText,
          total: `${totalDamage} Damage`
        });
        return;
      }

      if (outcome.status === 'cured_debuffs') {
        const curedList = (outcome.curedDebuffs || []).join(', ');
        showDiceTopToast({
          icon: '✨',
          title: name,
          breakdown: `Cured: Removed "${curedList}" and all associated penalties! • ${remainingInfo}`,
          total: 'Cured'
        });
        addDiceHistoryEntry({
          icon: '✨',
          title: `${name} (Cure / Rule)`,
          formula: 'D&D 3.5e RAW',
          breakdown: `Used: ${name} • Cured Condition: ${curedList} • ${remainingInfo}`,
          total: 'Cured'
        });
        return;
      }

      if (outcome.status === 'restoration_no_effect') {
        showDiceTopToast({
          icon: 'ℹ️',
          title: name,
          breakdown: `Used, but no active Energy Drain or Negative Level condition was found on the character. • ${remainingInfo}`,
          total: 'No Effect'
        });
        return;
      }

      if (outcome.status === 'buff_activated') {
        showDiceTopToast({
          icon: '🧪',
          title: name,
          breakdown: `Activated "${outcome.activatedBuff}" (${outcome.activatedSummary || `${outcome.activatedRounds} rounds`}) • ${remainingInfo}`,
          total: 'Active'
        });
        return;
      }

      if (outcome.status === 'daily_used' && outcome.dailyCharges) {
        showDiceTopToast({
          icon: '💍',
          title: name,
          breakdown: `Magic item property activated • ${remainingInfo}`,
          total: `${outcome.dailyCharges.current}/${outcome.dailyCharges.max}`
        });
        return;
      }

      showDiceTopToast({
        icon: '📦',
        title: name,
        breakdown: `Used • ${remainingInfo}`,
        total: '✔'
      });
    }

    function consumeItem3D(sourceType, idOrIdx) {
      const activeDoc = (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.getDoc === 'function' && window.CharStore.getDoc())
        ? window.CharStore.getDoc()
        : character;

      let item = null;
      if (sourceType === 'slot') {
        item = activeDoc.bodySlots?.[idOrIdx];
      } else if (sourceType === 'pool' || sourceType === true) {
        item = (activeDoc.gearPool || []).find(p => p && String(p.id) === String(idOrIdx));
      } else {
        const numIdx = Number(idOrIdx);
        item = activeDoc.consumables?.[Number.isFinite(numIdx) ? numIdx : idOrIdx];
      }

      if (!item) {
        showDiceTopToast({
          icon: '⚠️',
          title: 'Item Not Found',
          breakdown: 'Item not found in character inventory!',
          total: 'Error'
        });
        return;
      }

      const plan = (typeof RuleEngine !== 'undefined' && typeof RuleEngine.parseConsumablePlan === 'function')
        ? RuleEngine.parseConsumablePlan(item, item.effect || item.desc)
        : { kind: 'other', isHealing: false, isDamage: false, isCure: false, diceCount: 0, diceSides: 0, cureFlags: {} };

      const combinedText = `${item.name || ''} ${item.desc || ''} ${item.effect || ''}`;
      const dailyMatch = combinedText.match(/(\d+)\s*\/\s*day/i);
      const maxDaily = (item.dailyCharges && typeof item.dailyCharges === 'object' && Number(item.dailyCharges.max) > 0)
        ? Number(item.dailyCharges.max)
        : (typeof item.dailyCharges === 'number' && item.dailyCharges > 0
          ? item.dailyCharges
          : (dailyMatch ? parseInt(dailyMatch[1], 10) : 0));
      const isDaily = maxDaily > 0;
      const currentDaily = (item.dailyCharges && typeof item.dailyCharges === 'object' && item.dailyCharges.current !== undefined)
        ? Number(item.dailyCharges.current)
        : maxDaily;

      if (isDaily) {
        if (currentDaily <= 0) {
          showDiceTopToast({
            icon: '⏳',
            title: item.name || 'Magic Item',
            breakdown: 'All daily charges expended! Resets on a Long Rest (☀️).',
            total: `0 / ${maxDaily}`
          });
          return;
        }
      } else {
        const curQty = (item.qty !== undefined && item.qty !== null) ? Number(item.qty) : 1;
        if (curQty <= 0) {
          showDiceTopToast({
            icon: '⚠️',
            title: 'Depleted',
            breakdown: 'You have none of this item remaining!',
            total: '0 Left'
          });
          return;
        }
      }

      const name = item.name || 'Magic Item';
      const dispatchUseAction = (rollsPayload) => {
        const actionObj = {
          type: 'consumable/use',
          label: `Use ${name}`,
          meta: { label: `Use ${name}` },
          payload: {
            sourceType,
            idOrIdx,
            rolls: rollsPayload || null,
            nowTs: Date.now()
          }
        };
        let outcome = null;
        if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.dispatch === 'function') {
          if (!window.CharStore.getDoc() && typeof character !== 'undefined') {
            window.CharStore._syncExternalCharacterRef(character);
          }
          window.CharStore.dispatch(actionObj);
          if (typeof window.CharStore.getLastOutcome === 'function') {
            outcome = window.CharStore.getLastOutcome();
          }
        } else if (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.applyConsumableUseReducer === 'function') {
          window.CharStore.applyConsumableUseReducer(character, actionObj);
          if (typeof window.CharStore.getLastOutcome === 'function') {
            outcome = window.CharStore.getLastOutcome();
          }
          saveStateToStorage(true);
        }
        renderAll();
        if (outcome) {
          emitConsumableUseFeedback(outcome);
        }
      };

      // 1. Healing Dice Pre-Roll (if standard Cure Wounds potion/wand)
      if (plan.isHealing && !plan.isCureMinor && !plan.isHealSpell && plan.diceCount > 0) {
        const diceCount = plan.diceCount || 1;
        const diceSides = plan.diceSides || 8;
        const healRoll = [];
        for (let i = 0; i < diceCount; i++) {
          const val = Math.floor(Math.random() * diceSides) + 1;
          healRoll.push({ type: 'd' + diceSides, value: val });
        }

        const rollsPayload = { healRoll, dmgRoll: null, abilityHealRoll: null };
        if (typeof window !== 'undefined' && window.Dice3D && typeof Dice3D.roll === 'function') {
          try {
            Dice3D.roll(healRoll, () => dispatchUseAction(rollsPayload));
          } catch (_) {
            dispatchUseAction(rollsPayload);
          }
        } else {
          dispatchUseAction(rollsPayload);
        }
        return;
      }

      // 2. Offensive / Damage Wand Pre-Roll
      if (plan.isDamage && plan.diceCount > 0) {
        const dmgRoll = [];
        const dice3dList = [];
        for (let i = 0; i < plan.diceCount; i++) {
          const val = Math.floor(Math.random() * plan.diceSides) + 1;
          dmgRoll.push(val);
          if (dice3dList.length < 6 && [4, 6, 8, 10, 12, 20, 100].includes(plan.diceSides)) {
            dice3dList.push({ type: 'd' + plan.diceSides, value: val });
          }
        }

        const rollsPayload = { healRoll: null, dmgRoll, abilityHealRoll: null };
        if (typeof window !== 'undefined' && window.Dice3D && typeof Dice3D.roll === 'function' && dice3dList.length > 0) {
          try {
            Dice3D.roll(dice3dList, () => dispatchUseAction(rollsPayload));
          } catch (_) {
            dispatchUseAction(rollsPayload);
          }
        } else {
          dispatchUseAction(rollsPayload);
        }
        return;
      }

      // 3. Instant / Non-Dice or Lesser Restoration Consumables
      const abilityHealRoll = (plan.isCure && plan.cureFlags && plan.cureFlags.lesserRestoration)
        ? (Math.floor(Math.random() * 4) + 1)
        : null;
      dispatchUseAction({ healRoll: null, dmgRoll: null, abilityHealRoll });
    }

    if (typeof Actions !== 'undefined' && typeof Actions.register === 'function') {
      Actions.register('consumable:use', (el, dataset) => {
        if (!dataset) return;
        consumeItem3D(dataset.sourceType || 'consumable', dataset.id);
      });
    }

    // Export & Import
    function exportFullBundleJson() {
      const bundle = {
        version: 2,
        lastModified: new Date().toISOString(),
        character: character,
        masterDb: masterDb
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dnd35_full_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
    }

    function exportCharacterJson() {
      const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dnd35_character_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
    }

    function exportMasterDbJson() {
      const hasSelection = window.RuleMaster && RuleMaster.selectedIds && RuleMaster.selectedIds.size > 0;
      let exportList = Array.isArray(masterDb) ? masterDb : [];
      if (hasSelection) {
        exportList = exportList.filter((raw, idx) => {
          const item = RuleMaster.ensureV2(raw);
          const key = RuleMaster.getEntrySelectionKey(item, idx);
          return RuleMaster.selectedIds.has(key);
        });
      }
      if (exportList.length === 0) {
        showToast('There are no custom entries to export in this character\'s Custom DB.', 'info', { wrap: true });
        return;
      }
      const charSlug = ((character && character.name) ? character.name : 'character')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'character';
      const dateStr = new Date().toISOString().slice(0, 10);
      const suffix = hasSelection ? `selected_${exportList.length}_${dateStr}` : `custom_db_${dateStr}`;
      const blob = new Blob([JSON.stringify(exportList, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${charSlug}_${suffix}.json`;
      a.click();
    }

    function mergeEntriesIntoCharacterCustomDb(incomingArray) {
      if (!Array.isArray(incomingArray)) return { added: 0, updated: 0 };
      if (!Array.isArray(masterDb)) {
        masterDb = [];
      }
      if (typeof character !== 'undefined' && character) {
        character.customDb = masterDb;
      }
      let added = 0;
      let updated = 0;
      incomingArray.forEach(rawEntry => {
        if (!rawEntry || typeof rawEntry !== 'object') return;
        const normalized = (window.RuleMaster && typeof RuleMaster.ensureV2 === 'function')
          ? RuleMaster.ensureV2(rawEntry)
          : rawEntry;
        if (!normalized.name) return;
        const normId = String(normalized.id || '').toLowerCase().trim();
        const normName = String(normalized.name || '').toLowerCase().trim();
        const normType = String(normalized.type || '').toLowerCase().trim();

        const existingIdx = masterDb.findIndex(existing => {
          if (!existing) return false;
          const exId = String(existing.id || '').toLowerCase().trim();
          const exName = String(existing.name || '').toLowerCase().trim();
          const exType = String(existing.type || '').toLowerCase().trim();
          if (normId && exId && normId === exId) return true;
          return normName && exName === normName && (!normType || !exType || normType === exType);
        });

        if (existingIdx !== -1) {
          masterDb[existingIdx] = normalized;
          updated++;
        } else {
          masterDb.push(normalized);
          added++;
        }
      });
      return { added, updated };
    }

    function handleCustomDbImportFile(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          let entriesToMerge = [];
          if (Array.isArray(parsed)) {
            entriesToMerge = parsed;
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.customDb)) {
              entriesToMerge = parsed.customDb;
            } else if (Array.isArray(parsed.masterDb)) {
              entriesToMerge = parsed.masterDb;
            } else if (Array.isArray(parsed.entries)) {
              entriesToMerge = parsed.entries;
            } else if (Array.isArray(parsed.rows)) {
              entriesToMerge = parsed.rows;
            } else if (parsed.character && Array.isArray(parsed.character.customDb)) {
              entriesToMerge = parsed.character.customDb;
            } else if (parsed.name && parsed.type) {
              entriesToMerge = [parsed];
            }
            const packId = (typeof parsed.pack === 'object' && parsed.pack !== null)
              ? String(parsed.pack.id || parsed.pack.name || '')
              : String(parsed.pack || parsed.packId || '');
            if (Array.isArray(entriesToMerge)) {
              entriesToMerge = entriesToMerge.map(ent => {
                if (!ent || typeof ent !== 'object') return ent;
                const normPack = (typeof ent.pack === 'object' && ent.pack !== null)
                  ? String(ent.pack.id || ent.pack.name || '')
                  : String(ent.pack || packId || '');
                return normPack ? Object.assign({}, ent, { pack: normPack }) : ent;
              });
            }
          }

          if (entriesToMerge.length === 0) {
            showToast('No valid custom DB entries found in the selected JSON file.', 'error', { wrap: true });
            return;
          }

          const { added, updated } = mergeEntriesIntoCharacterCustomDb(entriesToMerge);
          saveStateToStorage(true);
          if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
            RuleMaster.renderTable();
          }
          renderAll();
          alert(`✅ Custom DB Import / Merge Complete!\n• Added: ${added} new entries\n• Updated: ${updated} existing entries\n• Total Character Custom DB: ${masterDb.length} entries`);
        } catch (err) {
          showToast('Failed to parse Custom DB JSON file: ' + err.message, 'error', { wrap: true });
        } finally {
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    }

    function handleJsonFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.entries) && !parsed.character) {
            const packId = (typeof parsed.pack === 'object' && parsed.pack !== null)
              ? String(parsed.pack.id || parsed.pack.name || '')
              : String(parsed.pack || parsed.packId || '');
            const entriesToMerge = parsed.entries.map(ent => {
              if (!ent || typeof ent !== 'object') return ent;
              const normPack = (typeof ent.pack === 'object' && ent.pack !== null)
                ? String(ent.pack.id || ent.pack.name || '')
                : String(ent.pack || packId || '');
              return normPack ? Object.assign({}, ent, { pack: normPack }) : ent;
            });
            const { added, updated } = mergeEntriesIntoCharacterCustomDb(entriesToMerge);
            alert(`✅ DM Rule Pack merged into character!\n• Added: ${added}\n• Updated: ${updated}\n• Total Custom DB: ${masterDb.length} entries`);
          } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.character || parsed.masterDb)) {
            if (parsed.character) character = parsed.character;
            if (!Array.isArray(character.customDb)) {
              character.customDb = Array.isArray(parsed.masterDb) ? parsed.masterDb : [];
            }
            masterDb = character.customDb;
            showToast(`Full Bundle loaded successfully!\n• Character: ${character?.name || '-'}\n• Character Custom DB: ${masterDb.length} entries`, 'success', { wrap: true });
          } else if (Array.isArray(parsed)) {
            const { added, updated } = mergeEntriesIntoCharacterCustomDb(parsed);
            alert(`✅ Custom DB entries merged into character!\n• Added: ${added}\n• Updated: ${updated}\n• Total Custom DB: ${masterDb.length} entries`);
          } else if (parsed.name || parsed.characterName || parsed.abilities) {
            character = parsed;
            if (!Array.isArray(character.customDb)) character.customDb = [];
            masterDb = character.customDb;
            showToast('Character data loaded successfully!', 'success', { wrap: true });
          }
          saveStateToStorage(true);
          if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
            RuleMaster.renderTable();
          }
          renderAll();
        } catch (err) {
          showToast('Failed to parse JSON file: ' + err.message, 'error', { wrap: true });
        } finally {
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    }

    // User Requested Reset Feature
    async function resetToCleanCharacter() {
      if ((await DnDUI.confirm('⚠️ Are you sure you want to reset the current character and start a fresh blank character?', { tone: 'danger' }))) {
        character = {
          schemaVersion: "2.0",
          name: "New Character",
          classes: "Fighter 1",
          race: "Human",
          level: 1,
          bab: 1,
          baseSpeed: 30,
          abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          hp: { current: 10, max: 10, temp: 0, nonlethal: 0 },
          acBreakdown: { armor: 0, shield: 0, natural: 0, deflection: 0, size: 0 },
          baseSaves: { fort: 2, ref: 0, will: 0 },
          saveBonuses: { resistance: 0 },
          activeStance: "None",
          activeWeapon: "Longsword",
          activeGrip: "1-Hand",
          tactical: { powerAttack: 0, flanking: false, charge: false, higherGround: false },
          weapons: [{ name: "Longsword", grip: "1-Hand", dice: "1d8", critMin: 19, critMult: 2, dmgType: "Slashing" }],
          activeModifiers: [],
          spellcasting: { slots: [], knownSpells: [] },
          tomeOfBattle: { readiedManeuvers: [], stancesKnown: [] },
          skills: [],
          consumables: [],
          bodySlots: {},
          gearPool: [],
          levelProgression: [],
          customDb: []
        };
        masterDb = character.customDb;
        if (window.RuleMaster && RuleMaster.selectedIds) {
          RuleMaster.selectedIds.clear();
        }
        saveStateToStorage();
        renderAll();
        showToast('Character reset. Your blank character is ready!', 'success', { wrap: true });
      }
    }

    async function resetAllLocalDataToFactoryDefaults() {
      const confirmed = (await DnDUI.confirm("⚠️ WARNING!\nAll local characters, saved profiles, Master DB cache, and temporary settings in your browser will be wiped and restored to factory defaults.\n\nAre you sure?", { tone: 'danger' }));
      if (!confirmed) return;

      try {
        localStorage.clear();
      } catch (e) {
        console.warn('LocalStorage clear error:', e);
      }

      alert("✅ All local data reset to factory defaults! Reloading page...");
      window.location.reload();
    }

    // =========================================================================
    // Phase R4: Delegated Inventory, Silhouette, Pool, Skills & Buffs Actions
    // All handlers strictly use the `(el, data, event)` parameter contract.
    // =========================================================================
    (function registerInventoryDelegatedActions() {
      const actionsApi = (typeof window !== 'undefined' && (window.Actions || window.UI?.Actions))
        || (typeof Actions !== 'undefined' ? Actions : null);
      if (!actionsApi || typeof actionsApi.register !== 'function') return;

      actionsApi.register('inventory:toggle-slot-active', (el, data, event) => {
        if (data && data.slotKey) toggleSlotActive(data.slotKey);
      });
      actionsApi.register('inventory:forge-slot-item', (el, data, event) => {
        if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
        if (data && data.slotKey) openForgeForSlotItem(data.slotKey);
      });
      actionsApi.register('inventory:unequip-slot', (el, data, event) => {
        if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
        if (data && data.slotKey) unequipSlot(data.slotKey);
      });
      actionsApi.register('inventory:open-slot-equip', (el, data, event) => {
        if (data && data.slotKey) openSlotEquipModal(data.slotKey);
      });
      actionsApi.register('inventory:spend-slot-charge', (el, data, event) => {
        if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
        if (data && data.slotKey) spendSlotCharge(data.slotKey, Number(data.amount) || 1);
      });
      actionsApi.register('inventory:restore-slot-charge', (el, data, event) => {
        if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
        if (data && data.slotKey) restoreSlotCharge(data.slotKey, Number(data.amount) || 1);
      });
      actionsApi.register('inventory:discharge-daily-round', (el, data, event) => {
        if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
        if (data && data.encodedName) dischargeDailyRoundItem(data.encodedName, data.slotKey);
      });
      actionsApi.register('inventory:cast-daily-round', (el, data, event) => {
        if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
        if (data && data.encodedName) castDailyRoundItem(data.encodedName, data.slotKey);
      });
      actionsApi.register('inventory:activate-double-twf', (el, data, event) => {
        if (typeof activateWeaponSet === 'function') {
          activateWeaponSet(2);
          renderAll();
        }
      });
      actionsApi.register('inventory:unequip-slot-modal', (el, data, event) => {
        const key = (data && data.slotKey) || _currentEquipSlotKey;
        if (key) {
          unequipSlot(key);
          closeSlotEquipModal();
        }
      });
      actionsApi.register('inventory:open-add-pool-from-equip', (el, data, event) => {
        closeSlotEquipModal();
        if (typeof openAddPoolItemModal === 'function') openAddPoolItemModal();
      });
      actionsApi.register('inventory:forge-pool-item', (el, data, event) => {
        if (data && data.itemId !== undefined) openForgeForPoolItem(data.itemId);
      });
      actionsApi.register('inventory:equip-pool-item-modal', (el, data, event) => {
        if (data && data.itemId !== undefined) {
          equipPoolItem(data.itemId, data.slotKey || null);
          closeSlotEquipModal();
        }
      });
      actionsApi.register('inventory:open-companion-modal', (el, data, event) => {
        if (typeof openCompanionModal === 'function') openCompanionModal();
      });
      actionsApi.register('inventory:open-companion-equip', (el, data, event) => {
        if (data && data.slotKey) openCompanionEquipModal(data.slotKey);
      });
      actionsApi.register('inventory:unequip-companion-slot', (el, data, event) => {
        if (data && data.slotKey) unequipCompanionSlot(data.slotKey);
      });
      actionsApi.register('inventory:close-companion-equip', (el, data, event) => {
        closeCompanionEquipModal();
      });
      actionsApi.register('inventory:filter-companion-equip', (el, data, event) => {
        renderCompanionEquipList();
      });
      actionsApi.register('inventory:equip-companion-item', (el, data, event) => {
        if (data && data.itemId !== undefined && data.slotKey) {
          equipItemToCompanion(data.itemId, data.slotKey);
        }
      });
      actionsApi.register('inventory:adjust-pool-qty', (el, data, event) => {
        if (data && data.itemId !== undefined) {
          adjustPoolQty(data.itemId, Number(data.delta) || 0);
        }
      });
      actionsApi.register('inventory:use-pool-item', (el, data, event) => {
        if (data && data.itemId !== undefined) {
          consumeItem3D('pool', data.itemId);
        }
      });
      actionsApi.register('inventory:toggle-pool-belt', (el, data, event) => {
        if (data && data.itemId !== undefined) {
          togglePoolBelt(data.itemId);
        }
      });
      actionsApi.register('inventory:equip-pool-item', (el, data, event) => {
        if (data && data.itemId !== undefined) {
          equipPoolItem(data.itemId);
        }
      });
      actionsApi.register('inventory:delete-pool-item', (el, data, event) => {
        if (data && data.itemId !== undefined) {
          deletePoolItem(data.itemId);
        }
      });
      actionsApi.register('inventory:pool-category-tab', (el, data, event) => {
        if (data && data.category) {
          renderUnaddedMasterDbItems(data.category);
        }
      });
      actionsApi.register('inventory:forge-spotlight-item', (el, data, event) => {
        openForgeForSpotlightItem(Number(data?.index) || 0, data?.isAi === 'true');
      });
      actionsApi.register('inventory:add-spotlight-item', (el, data, event) => {
        addMasterDbItemDirectlyToPool(Number(data?.index) || 0, el);
      });
      actionsApi.register('inventory:search-ai-pool-item', (el, data, event) => {
        if (data && data.query !== undefined) {
          searchAiForPoolItem(data.query);
        }
      });
      actionsApi.register('inventory:open-item-forge', (el, data, event) => {
        if (typeof switchTab === 'function') switchTab('tab-database');
        if (window.RuleMaster && typeof window.RuleMaster.switchInlineMode === 'function') {
          window.RuleMaster.switchInlineMode('forge');
        }
      });
      actionsApi.register('inventory:add-ai-pool-item', (el, data, event) => {
        addAiItemToPoolAndDb(Number(data?.index) || 0, el);
      });
      actionsApi.register('inventory:toggle-skill-class', (el, data, event) => {
        if (data && data.skillKey && typeof toggleSkillClass === 'function') {
          toggleSkillClass(data.skillKey);
        }
      });
      actionsApi.register('inventory:roll-skill', (el, data, event) => {
        if (data && data.skillName && typeof rollSkill3D === 'function') {
          rollSkill3D(data.skillName, Number(data.total) || 0, data.subtitle || '');
        }
      });
      actionsApi.register('inventory:adjust-skill-rank', (el, data, event) => {
        if (data && data.skillKey && typeof adjustSkillRank === 'function') {
          adjustSkillRank(data.skillKey, Number(data.delta) || 0);
        }
      });
      actionsApi.register('inventory:toggle-buff-pin', (el, data, event) => {
        if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
        if (data && data.buffId !== undefined && typeof toggleBuffCombatPin === 'function') {
          toggleBuffCombatPin(data.buffId);
        }
      });
      actionsApi.register('inventory:toggle-buff-active', (el, data, event) => {
        if (data && data.buffId !== undefined && typeof toggleBuffActive === 'function') {
          toggleBuffActive(data.buffId);
        }
      });
      actionsApi.register('inventory:adjust-buff-rounds', (el, data, event) => {
        if (data && data.buffId !== undefined && typeof adjustBuffRounds === 'function') {
          adjustBuffRounds(data.buffId, Number(data.delta) || 0);
        }
      });
      actionsApi.register('inventory:delete-buff', (el, data, event) => {
        if (data && data.buffId !== undefined && typeof deleteBuff === 'function') {
          deleteBuff(data.buffId);
        }
      });
      actionsApi.register('inventory:open-house-rules', (el, data, event) => {
        if (typeof openHouseRulesModal === 'function') openHouseRulesModal();
      });
      actionsApi.register('inventory:buff-v2-mod-change', (el, data, event) => {
        if (data && data.modIdx !== undefined && data.field) {
          onBuffModalV2ModifierChange(Number(data.modIdx), data.field, el ? el.value : '');
        }
      });
      actionsApi.register('inventory:buff-v2-mod-input', (el, data, event) => {
        if (data && data.modIdx !== undefined && data.field) {
          onBuffModalV2ModifierChange(Number(data.modIdx), data.field, el ? el.value : '');
        }
      });
      actionsApi.register('inventory:remove-buff-v2-mod', (el, data, event) => {
        if (data && data.modIdx !== undefined) {
          removeBuffModalV2ModifierRow(Number(data.modIdx));
        }
      });
      actionsApi.register('inventory:toggle-buff-rule-flag', (el, data, event) => {
        if (data && data.flagKey) {
          toggleBuffModalRuleFlag(data.flagKey);
        }
      });
      actionsApi.register('inventory:buff-quick-pick', (el, data, event) => {
        if (data && data.pickIdx !== undefined) {
          onBuffQuickPickClick(Number(data.pickIdx));
        }
      });
      actionsApi.register('inventory:pick-buff-spotlight', (el, data, event) => {
        if (event && typeof event.preventDefault === 'function') event.preventDefault();
        if (data && data.spotIdx !== undefined) {
          pickBuffSpotlightResult(Number(data.spotIdx));
        }
      });
      actionsApi.register('inventory:select-buff-energy', (el, data, event) => {
        if (data && data.energy) {
          selectBuffModalEnergy(data.energy);
        }
      });
      actionsApi.register('inventory:noop-stop', (el, data, event) => {
        if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      });

      function initSilhouetteDelegatedEvents() {
        if (typeof document === 'undefined' || document._dndSilDelegatedBound) return;
        document._dndSilDelegatedBound = true;

        document.addEventListener('mousedown', (e) => {
          const spotEl = e.target && e.target.closest ? e.target.closest('[data-action="inventory:pick-buff-spotlight"]') : null;
          if (spotEl) {
            e.preventDefault();
            pickBuffSpotlightResult(Number(spotEl.dataset.spotIdx || 0));
            return;
          }
          const cardPin = e.target && e.target.closest ? e.target.closest('[data-sil-drag-card]') : null;
          if (cardPin) {
            startDraggingCardNode(e, cardPin.dataset.silDragCard);
            return;
          }
          const slotNode = e.target && e.target.closest ? e.target.closest('[data-sil-drag-node]') : null;
          if (slotNode) {
            startDraggingSlotNode(e, slotNode.dataset.silDragNode);
            return;
          }
          const mainSvg = e.target && e.target.closest ? e.target.closest('#sil-main-svg') : null;
          if (mainSvg) {
            startSilhouettePan(e);
          }
        });

        document.addEventListener('touchstart', (e) => {
          const cardPin = e.target && e.target.closest ? e.target.closest('[data-sil-drag-card]') : null;
          if (cardPin) {
            startDraggingCardNode(e, cardPin.dataset.silDragCard);
            return;
          }
          const slotNode = e.target && e.target.closest ? e.target.closest('[data-sil-drag-node]') : null;
          if (slotNode) {
            startDraggingSlotNode(e, slotNode.dataset.silDragNode);
            return;
          }
          const mainSvg = e.target && e.target.closest ? e.target.closest('#sil-main-svg') : null;
          if (mainSvg) {
            startSilhouettePan(e);
          }
        }, { passive: true });

        document.addEventListener('wheel', (e) => {
          const mainSvg = e.target && e.target.closest ? e.target.closest('#sil-main-svg') : null;
          if (mainSvg) {
            handleSilhouetteWheel(e);
          }
        }, { passive: false });

        document.addEventListener('mousemove', (e) => {
          const mainSvg = e.target && e.target.closest ? e.target.closest('#sil-main-svg') : null;
          if (mainSvg && typeof handleSilhouetteSvgMouseMove === 'function') {
            handleSilhouetteSvgMouseMove(e);
          }
        });

        document.addEventListener('touchmove', (e) => {
          const mainSvg = e.target && e.target.closest ? e.target.closest('#sil-main-svg') : null;
          if (mainSvg && typeof handleSilhouetteSvgTouchMove === 'function') {
            handleSilhouetteSvgTouchMove(e);
          }
        }, { passive: false });

        let _lastHoveredSilSlot = null;
        document.addEventListener('mouseover', (e) => {
          const hoverCard = e.target && e.target.closest ? e.target.closest('[data-sil-hover-slot]') : null;
          const nextSlot = hoverCard ? hoverCard.dataset.silHoverSlot : null;
          if (nextSlot !== _lastHoveredSilSlot) {
            if (_lastHoveredSilSlot) highlightSlotNode(_lastHoveredSilSlot, false);
            if (nextSlot) highlightSlotNode(nextSlot, true);
            _lastHoveredSilSlot = nextSlot;
          }
        });
      }
      initSilhouetteDelegatedEvents();

      // --- Static index.html controls: Body Slots view, Silhouette menu/transform, Gear Pool, JSON I/O ---
      const optionalBooleanArg = (raw) => (raw === 'true' ? true : (raw === 'false' ? false : undefined));
      actionsApi.register('inventory:set-body-slots-view', (el, data, event) => {
        setBodySlotsView(data.viewMode);
      });
      actionsApi.register('inventory:silhouette-file-upload', (el, data, event) => {
        handleSilhouetteFileUpload(event);
      });
      actionsApi.register('inventory:toggle-silhouette-point-edit', (el, data, event) => {
        toggleSilhouettePointEditMode(optionalBooleanArg(data.forceState));
      });
      actionsApi.register('inventory:toggle-silhouette-menu', (el, data, event) => {
        toggleSilhouetteMenu(event);
      });
      actionsApi.register('inventory:silhouette-menu-command', (el, data, event) => {
        const command = data.command;
        if (command === 'upload') triggerSilhouetteUpload();
        else if (command === 'url') promptSilhouetteUrl();
        else if (command === 'transform') toggleSilhouetteTransformPanel();
        else if (command === 'point-edit') toggleSilhouettePointEditMode();
        else if (command === 'reset') resetSilhouetteAll();
        else return;
        closeSilhouetteMenu();
      });
      actionsApi.register('inventory:reset-silhouette-transform', (el, data, event) => {
        resetSilhouetteTransform();
      });
      actionsApi.register('inventory:toggle-silhouette-transform-panel', (el, data, event) => {
        toggleSilhouetteTransformPanel(optionalBooleanArg(data.forceState));
      });
      actionsApi.register('inventory:adjust-silhouette-zoom', (el, data, event) => {
        adjustSilhouetteZoom(Number(data.delta));
      });
      actionsApi.register('inventory:silhouette-zoom-slider', (el, data, event) => {
        onSilhouetteZoomSlider(el.value);
      });
      actionsApi.register('inventory:adjust-silhouette-pan', (el, data, event) => {
        adjustSilhouettePan(Number(data.dx), Number(data.dy));
      });
      actionsApi.register('inventory:set-silhouette-transform-preset', (el, data, event) => {
        setSilhouetteTransformPreset(data.preset);
      });
      actionsApi.register('inventory:copy-silhouette-coordinates', (el, data, event) => {
        copySilhouetteCoordinatesToClipboard();
      });
      actionsApi.register('inventory:render-gear-pool-table', (el, data, event) => {
        renderGearPoolTable();
      });
      actionsApi.register('inventory:open-compendium-drawer', (el, data, event) => {
        openCharacterCompendiumDrawer();
      });
      actionsApi.register('inventory:export-master-db-json', (el, data, event) => {
        exportMasterDbJson();
      });
      actionsApi.register('inventory:export-full-bundle-json', (el, data, event) => {
        exportFullBundleJson();
      });
      actionsApi.register('inventory:export-character-json', (el, data, event) => {
        exportCharacterJson();
      });
      actionsApi.register('inventory:open-file-picker', (el, data, event) => {
        document.getElementById(data.inputId).click();
      });
      actionsApi.register('inventory:import-custom-db-file', (el, data, event) => {
        handleCustomDbImportFile(event);
      });
      actionsApi.register('inventory:import-character-json-file', (el, data, event) => {
        handleJsonFileUpload(event);
      });
      actionsApi.register('inventory:reset-to-clean-character', (el, data, event) => {
        resetToCleanCharacter();
      });
    })();
