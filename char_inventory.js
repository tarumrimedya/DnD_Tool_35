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
        alert('Please enter a valid skill name.');
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
          alert(`⚠️ Insufficient skill points! This rank requires ${cost} points, but only ${Math.max(0, totalPts - spentPts)} points remain. Starting rank set to 0.`);
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

      // Update Header Badges
      const modeBadge = document.getElementById('skills-mode-badge');
      if (modeBadge) {
        modeBadge.textContent = isMerged ? '🔗 Consolidated Skills' : 'D&D 3.5e RAW (46 Skills)';
        modeBadge.className = isMerged 
          ? 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 cursor-pointer hover:border-emerald-400 transition' 
          : 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer hover:border-slate-500 transition';
        modeBadge.title = 'Click to toggle in House Rules';
        modeBadge.onclick = () => { if (typeof openHouseRulesModal === 'function') openHouseRulesModal(); };
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
        DND35_CONSOLIDATED_SKILLS.forEach(conDef => {
          const compSkills = (character.skills || []).filter(s => conDef.components.includes(s.key));
          conDef.components.forEach(k => mergedKeysHandled.add(k));

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
        const acpVal = item.acp ? (character.acBreakdown?.acp || 0) : 0;

        // Scope & Stacking Aware Item/Buff Bonus Calculation
        const evalSkillObj = (typeof RuleEngine !== 'undefined' && RuleEngine.evaluateSkillBonus)
          ? RuleEngine.evaluateSkillBonus(character, item.key, item.name, item.stat)
          : { total: Number(character.buffSkillBonus) || 0, breakdown: [] };
        const buffSkillMod = evalSkillObj.total;
        const buffTooltip = evalSkillObj.breakdown.length > 0 
          ? evalSkillObj.breakdown.join(' • ') 
          : (buffSkillMod !== 0 ? `Bonus: ${buffSkillMod}` : 'No active item or spell bonus');

        const total = item.ranks + statMod + item.misc - acpVal + buffSkillMod;
        const maxRankAllowed = item.isClass ? maxClassRank : maxCrossRank;
        const isOverRank = item.ranks > maxRankAllowed;
        const safeName = item.name.replace(/'/g, "\\'");
        const safeSubtitle = (item.subtitle || '').replace(/'/g, "\\'");

        const statLabels = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
        const statDisplay = statLabels[(item.stat || '').toLowerCase()] || String(item.stat || '').toUpperCase().replace('İ', 'I');

        const tr = document.createElement('tr');
        tr.className = `hover:bg-slate-900/60 transition ${item.isConsolidated ? 'bg-emerald-950/15' : ''}`;
        tr.innerHTML = `
          <!-- Sınıf Becerisi (Class Skill) Toggle Checkbox -->
          <td class="py-2 px-2 text-center align-middle">
            <button 
              type="button" 
              onclick="toggleSkillClass('${item.key}')" 
              title="${item.isClass ? 'Class Skill • Click to make Cross-Class' : 'Cross-Class Skill • Click to make Class Skill'}"
              class="w-6 h-6 rounded flex items-center justify-center transition ${item.isClass ? 'text-amber-400 hover:text-amber-300 font-black' : 'text-slate-600 hover:text-slate-400 font-normal'}">
              <span>${item.isClass ? '⭐' : '⚪'}</span>
            </button>
          </td>

          <!-- Skill Name & Components -->
          <td class="py-2 px-3 align-middle">
            <div class="font-bold ${item.isClass ? 'text-amber-300' : 'text-white'} flex items-center gap-2 flex-wrap">
              ${getUniversalPinButtonHtml({ name: safeName, type: 'Skill', action: 'Check', desc: `${safeName} skill check (${total >= 0 ? '+' : ''}${total})`, badge: `${total >= 0 ? '+' : ''}${total} Check` })}
              <span>${item.name}</span>
              ${item.isConsolidated ? '<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px]">Consolidated</span>' : ''}
              ${item.isClass ? '<span class="badge bg-amber-950 text-amber-300 border border-amber-700 text-[8px] font-mono">Class</span>' : ''}
            </div>
            ${item.subtitle ? `<div class="text-[10px] text-emerald-400/80 font-mono mt-0.5">↳ ${item.subtitle}</div>` : ''}
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
              <button onclick="rollSkill3D('${safeName}', ${total}, '${safeSubtitle}')" class="bg-slate-800 hover:bg-slate-700 text-amber-400 px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-mono transition inline-flex items-center gap-1.5 justify-center shadow-sm active:scale-95" title="Roll 1d20${total >= 0 ? '+' : ''}${total} ${safeName} check">
                ${getD20IconSvg('w-3.5 h-3.5 text-amber-400')}
                <span>Roll</span>
              </button>
            </div>
          </td>

          <!-- Rank & Rank Adjustment Buttons -->
          <td class="py-2 px-2 text-center align-middle font-mono">
            <div class="inline-flex items-center gap-1">
              <button onclick="adjustSkillRank('${item.key}', -1)" class="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] leading-none">-</button>
              <span class="w-6 text-center font-bold ${isOverRank ? 'text-rose-400 animate-pulse' : (item.ranks > 0 ? 'text-sky-300' : 'text-slate-500')}">${item.ranks}</span>
              <button onclick="adjustSkillRank('${item.key}', 1)" class="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] leading-none">+</button>
            </div>
            <div class="text-[9px] text-slate-500 font-mono">/ ${maxRankAllowed}</div>
          </td>

          <!-- Stat Mod -->
          <td class="py-2 px-2 text-center align-middle text-slate-400 font-mono">
            ${statMod >= 0 ? '+' : ''}${statMod}
          </td>

          <!-- ACP -->
          <td class="py-2 px-2 text-center align-middle font-mono ${item.acp ? (acpVal > 0 ? 'text-amber-400 font-bold' : 'text-slate-500') : 'text-slate-700'}">
            ${item.acp ? (acpVal > 0 ? '-' + acpVal : '0') : '-'}
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
      const ceInput = document.getElementById('defense-combat-expertise-val');
      const ceVal = character.tactical?.combatExpertise !== undefined 
        ? character.tactical.combatExpertise 
        : (parseInt(ceInput?.value || document.getElementById('combat-expertise-val')?.textContent) || 0);
      if (ceInput && ceInput.value != ceVal) ceInput.value = ceVal;

      const fdInput = document.getElementById('mod-defensive-fighting');
      const fdVal = character.tactical?.fightingDefensively !== undefined
        ? character.tactical.fightingDefensively
        : (fdInput?.checked || false);
      if (fdInput) fdInput.checked = fdVal;

      const tdInput = document.getElementById('mod-total-defense');
      const tdVal = character.tactical?.totalDefense !== undefined
        ? character.tactical.totalDefense
        : (tdInput?.checked || false);
      if (tdInput) tdInput.checked = tdVal;

      const chargeVal = character.tactical?.charge !== undefined
        ? character.tactical.charge
        : (document.getElementById('mod-charge')?.checked || false);

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
      const penaltyInfo = bd.penalty > 0 ? `<div class="flex justify-between py-1 border-b border-slate-800 text-rose-400 font-bold"><span class="text-rose-300">Defense Penalties (Charge/Stance):</span><span>-${bd.penalty}</span></div>` : '';
      
      const armorSourceStr = (Array.isArray(bd.sources?.armor) && bd.sources.armor.length > 0 && bd.sources.armor[0].source) 
        ? ` <span class="text-[10px] text-sky-400 font-normal">(${bd.sources.armor[0].source})</span>`
        : (bd.armorCategory && bd.armorCategory !== 'None' ? ` <span class="text-[10px] text-sky-500 font-normal">(${bd.armorCategory})</span>` : '');

      const shieldSourceStr = (Array.isArray(bd.sources?.shield) && bd.sources.shield.length > 0 && bd.sources.shield[0].source)
        ? ` <span class="text-[10px] text-sky-400 font-normal">(${bd.sources.shield[0].source})</span>`
        : '';

      const deflSourceStr = (Array.isArray(bd.sources?.deflection) && bd.sources.deflection.length > 0 && bd.sources.deflection[0].source)
        ? ` <span class="text-[10px] text-indigo-300 font-normal">(${bd.sources.deflection[0].source})</span>`
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
          naturalDetail = ` <span class="text-[10px] text-teal-300 font-normal">(${bd.sources.natural[0].source})</span>`;
        }
      }

      acList.innerHTML = `
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Base 10:</span><span class="text-white font-bold">10</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Armor Bonus:${armorSourceStr}</span><span class="text-sky-400 font-bold">+${bd.armor || 0}</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Shield Bonus:${shieldSourceStr}</span><span class="text-sky-400 font-bold">+${bd.shield || 0}</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">DEX Modifier${maxDexInfo}:</span><span class="text-emerald-400 font-bold">+${bd.effectiveDex ?? dexMod}</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Deflection Bonus:${deflSourceStr}</span><span class="text-indigo-400 font-bold">+${bd.deflection || 0}</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Natural Armor:${naturalDetail}</span><span class="text-teal-400 font-bold">+${bd.natural || 0}</span></div>
        <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Dodge Bonus (Stacks):</span><span class="text-amber-400 font-bold">+${bd.dodge || 0}</span></div>
        ${penaltyInfo}
        <div class="flex justify-between py-1.5 text-slate-300 font-bold border-t border-slate-700 mt-1"><span class="text-amber-300 text-xs">FINAL ARMOR CLASS:</span><span class="text-amber-400 text-sm font-black">${bd.total || acCalc.total} AC</span></div>
        <div class="flex justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Touch: <strong class="text-sky-400">${bd.touch || acCalc.touch}</strong></span>
          <span>Flat-Footed: <strong class="text-slate-400">${bd.flat || acCalc.flat}</strong></span>
          <span>Armor Check Penalty (ACP): <strong class="text-rose-400">${bd.acp ? '-' + Math.abs(bd.acp) : '0'}</strong></span>
        </div>
      `;

      const saves = RuleEngine.evaluateSaves(character);
      const warbladeLvl = 1;
      const battleClarityInt = Math.min(warbladeLvl, Math.max(0, intMod));

      const baseFort = character.baseSaves?.fort || 0;
      const baseRef = character.baseSaves?.ref || 0;
      const baseWill = character.baseSaves?.will || 0;
      const resist = character.saveBonuses?.resistance || 0;

      const bonusFort = saves.bonusFort ?? (saves.fort - (baseFort + conMod + resist));
      const bonusRef = saves.bonusRef ?? (saves.ref - (baseRef + dexMod + resist));
      const bonusWill = saves.bonusWill ?? (saves.will - (baseWill + wisMod + resist));

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
              <span>${isDebuff ? '🩸' : '✨'} ${b.name || 'Active Effect'}: ${bNotes.join(', ')}</span>
            </div>
          `);
        }
      });

      // 3. Feats contributing to saves
      const charFeats = (character.feats || []).map(f => (typeof f === 'string' ? f : f?.name || '').toLowerCase());
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
      if (charFeats.some(f => f.includes('steadfast determination'))) {
        bonusNotes.push(`<div class="py-0.5 text-slate-300">✨ Steadfast Determination: Uses CON modifier instead of WIS on Will saves; Natural 1 on Fortitude saves is not an automatic failure.</div>`);
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

        const atkItems = (wepEval && Array.isArray(wepEval.attackBonusItems) && wepEval.attackBonusItems.length > 0)
          ? wepEval.attackBonusItems
          : [
              { source: 'BAB', val: babVal },
              { source: 'STR Modifier', val: strMod }
            ];

        const itemsHtml = atkItems.map(item => {
          const valStr = item.val >= 0 ? `+${item.val}` : `${item.val}`;
          const colorClass = item.val > 0 ? 'text-sky-400' : (item.val < 0 ? 'text-rose-400' : 'text-slate-400');
          return `
            <div class="flex justify-between py-0.5 border-b border-slate-800/80">
              <span class="text-slate-400">${item.source}:</span>
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
            <span>Active Weapon: <strong class="text-slate-200">${activeWep.name || 'Unarmed Strike'}</strong></span>
            <span>Full Attack: <strong class="text-amber-300">${iterativesText}</strong></span>
          </div>
        `;
      }

      savesList.innerHTML = `
        <div class="flex items-center py-0.5 border-b border-slate-800/80 text-xs font-mono">
          <span class="text-slate-400 w-36 shrink-0 flex items-center gap-1.5 font-sans">
            <span>🛡️</span>
            <span>Fortitude:</span>
          </span>
          <span class="text-emerald-400 font-bold w-9 text-right shrink-0">${saves.fort >= 0 ? '+' : ''}${saves.fort}</span>
          <span class="text-slate-500 font-bold px-2 shrink-0">:</span>
          <span class="text-white flex-1 truncate">
            ${baseFort} (Base) + ${conMod} (Con) + ${resist} (Resist)${formatBonusText(bonusFort)}
          </span>
        </div>
        <div class="flex items-center py-0.5 border-b border-slate-800/80 text-xs font-mono">
          <span class="text-slate-400 w-36 shrink-0 flex items-center gap-1.5 font-sans">
            <span>⚡</span>
            <span>Reflex:</span>
          </span>
          <span class="text-sky-400 font-bold w-9 text-right shrink-0">${saves.ref >= 0 ? '+' : ''}${saves.ref}</span>
          <span class="text-slate-500 font-bold px-2 shrink-0">:</span>
          <span class="text-white flex-1 truncate">
            ${baseRef} (Base) + ${dexMod} (Dex) + ${resist} (Resist)${formatBonusText(bonusRef)}
          </span>
        </div>
        <div class="flex items-center py-0.5 border-b border-slate-800/80 text-xs font-mono">
          <span class="text-slate-400 w-36 shrink-0 flex items-center gap-1.5 font-sans">
            <span>🧠</span>
            <span>Will:</span>
          </span>
          <span class="text-purple-400 font-bold w-9 text-right shrink-0">${saves.will >= 0 ? '+' : ''}${saves.will}</span>
          <span class="text-slate-500 font-bold px-2 shrink-0">:</span>
          <span class="text-white flex-1 truncate">
            ${baseWill} (Base) + ${wisMod} (Wis) + ${resist} (Resist)${formatBonusText(bonusWill)}
          </span>
        </div>
        <div class="pt-1 space-y-0.5 text-[10px] text-indigo-300 font-sans border-t border-slate-800/60 mt-0.5">
          ${bonusNotes.join('')}
        </div>
      `;
    }

    function recalculateDefense() {
      const ceInput = document.getElementById('defense-combat-expertise-val') || document.getElementById('combat-expertise-val');
      const ceVal = character.tactical?.combatExpertise !== undefined
        ? character.tactical.combatExpertise
        : (parseInt(ceInput?.value || ceInput?.textContent) || 0);
      if (!character.tactical) character.tactical = {};
      character.tactical.combatExpertise = ceVal;

      const modFd = document.getElementById('mod-defensive-fighting');
      const fdVal = character.tactical?.fightingDefensively !== undefined
        ? character.tactical.fightingDefensively
        : (modFd?.checked || false);
      character.tactical.fightingDefensively = fdVal;
      if (modFd) modFd.checked = fdVal;

      const modTd = document.getElementById('mod-total-defense');
      const tdVal = character.tactical?.totalDefense !== undefined
        ? character.tactical.totalDefense
        : (modTd?.checked || false);
      character.tactical.totalDefense = tdVal;
      if (modTd) modTd.checked = tdVal;

      // Keep Cockpit toggles and Defense toggles synced
      const cpCe = document.getElementById('combat-expertise-val');
      if (cpCe && cpCe.tagName === 'SPAN') cpCe.textContent = ceVal;
      const cpFd = document.getElementById('toggle-fighting-defensively');
      if (cpFd) cpFd.checked = character.tactical.fightingDefensively;
      const cpTd = document.getElementById('toggle-total-defense');
      if (cpTd) cpTd.checked = character.tactical.totalDefense;

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
          listBtn.className = "px-2 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer bg-indigo-600 text-white shadow-sm";
          gridBtn.className = "px-2 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer text-slate-400 hover:text-white";
        } else {
          gridBtn.className = "px-2 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer bg-indigo-600 text-white shadow-sm";
          listBtn.className = "px-2 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer text-slate-400 hover:text-white";
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

      sortedBuffs.forEach(buff => {
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

        // Summary badges
        const badges = [];
        if (isDebuff) badges.push(`<span class="bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">🩸 DEBUFF</span>`);
        if (buff.negativeLevels) badges.push(`<span class="bg-rose-950 text-rose-200 border border-rose-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">-${buff.negativeLevels} Level Drain</span>`);
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
                      <span class="font-sans">${c.name}</span>
                      <span class="font-mono text-rose-400 font-bold ml-2">${cMods.join(', ')}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </details>
          `;
        }

        if (viewMode === 'list') {
          // --- LISTE GÖRÜNÜMÜ (COMPACT LIST VIEW) ---
          const row = document.createElement('div');
          row.className = `border rounded-xl px-3 py-2 transition flex flex-col gap-1.5 ${isAct ? activeBorder : inactiveBorder}`;

          row.innerHTML = `
            <div class="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
              <!-- Sol: Checkbox + İsim + Kategori Rozeti -->
              <div class="flex items-center gap-2.5 min-w-0">
                <input type="checkbox" ${isAct ? 'checked' : ''} onchange="toggleBuffActive('${buff.id}')" class="w-4 h-4 rounded shrink-0 ${isDebuff ? 'text-rose-600 focus:ring-rose-500' : 'text-indigo-600 focus:ring-0'} cursor-pointer">
                <div class="min-w-0 flex items-center gap-1.5 flex-wrap">
                  <span class="font-bold text-xs truncate ${isAct ? (isDebuff ? 'text-rose-200' : 'text-white') : 'text-slate-400'}">${buff.name}</span>
                  <span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${isDebuff ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-purple-300 border border-slate-700'}">${buff.source || (isDebuff ? 'Debuff' : 'Buff')}</span>
                </div>
              </div>

              <!-- Orta: Etki Rozetleri -->
              <div class="flex items-center gap-1 flex-wrap shrink-0">
                ${badges.join(' ')}
              </div>

              <!-- Sağ: Süre / Tur Sayaç Butonları + Sil -->
              <div class="flex items-center gap-2 shrink-0 ml-auto">
                <div class="text-[10px] font-mono text-slate-400 hidden md:inline">
                  ${buff.durationText || (buff.rounds ? `${buff.rounds} Rounds` : 'Permanent')}
                </div>
                <div class="flex items-center gap-1">
                  ${buff.rounds !== null && buff.rounds !== undefined ? `
                    <button type="button" onclick="adjustBuffRounds('${buff.id}', -1)" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold leading-none flex items-center justify-center cursor-pointer" title="Decrease 1 Round">-</button>
                    <span class="font-mono font-bold px-1 text-xs ${buff.rounds <= 3 ? 'text-rose-400 animate-pulse' : 'text-amber-400'} min-w-[36px] text-center">${buff.rounds} Rd</span>
                    <button type="button" onclick="adjustBuffRounds('${buff.id}', 1)" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold leading-none flex items-center justify-center cursor-pointer" title="Add 1 Round">+</button>
                  ` : `<span class="text-[10px] text-slate-500 italic px-2">Permanent</span>`}
                </div>
                <button type="button" onclick="deleteBuff('${buff.id}')" class="text-slate-500 hover:text-rose-400 p-1 text-xs transition cursor-pointer" title="Delete ${isDebuff ? 'Debuff' : 'Buff'}">🗑️</button>
              </div>
            </div>

            ${(buff.notes || childrenAccordion || suppressionWarning) ? `
              <div class="text-[10px] text-slate-400 pl-6 space-y-1 border-t border-slate-800/40 pt-1">
                ${buff.notes ? `<div class="text-slate-300">${buff.notes}</div>` : ''}
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
                  <input type="checkbox" ${isAct ? 'checked' : ''} onchange="toggleBuffActive('${buff.id}')" class="w-4 h-4 rounded ${isDebuff ? 'text-rose-600 focus:ring-rose-500' : 'text-indigo-600 focus:ring-0'}">
                  <span class="font-bold text-xs ${isAct ? (isDebuff ? 'text-rose-200' : 'text-white') : 'text-slate-400'}">${buff.name}</span>
                </label>
                <div class="flex items-center gap-1">
                  <span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${isDebuff ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-purple-300 border border-slate-700'}">${buff.source || (isDebuff ? 'Debuff' : 'Buff')}</span>
                  <button onclick="deleteBuff('${buff.id}')" class="text-slate-500 hover:text-rose-400 p-0.5 text-xs transition" title="Delete ${isDebuff ? 'Debuff' : 'Buff'}">🗑️</button>
                </div>
              </div>

              <div class="flex flex-wrap gap-1 my-1">
                ${badges.join(' ')}
              </div>

              <div class="text-[11px] text-slate-300 font-sans">
                ${buff.notes || ''}
              </div>

              ${childrenAccordion}

              ${suppressionWarning ? `<div class="text-[10px] text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded px-1.5 py-0.5">${suppressionWarning}</div>` : ''}
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2 text-xs">
              <div class="text-[10px] font-mono text-slate-400">
                ${buff.durationText || (buff.rounds ? `${buff.rounds} Rounds` : 'Permanent')}
              </div>
              <div class="flex items-center gap-1">
                ${buff.rounds !== null && buff.rounds !== undefined ? `
                  <button onclick="adjustBuffRounds('${buff.id}', -1)" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold leading-none flex items-center justify-center">-</button>
                  <span class="font-mono font-bold px-1.5 ${buff.rounds <= 3 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}">${buff.rounds} Rd</span>
                  <button onclick="adjustBuffRounds('${buff.id}', 1)" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold leading-none flex items-center justify-center">+</button>
                ` : `<span class="text-[10px] text-slate-500 italic">Permanent</span>`}
              </div>
            </div>
          `;
          container.appendChild(card);
        }
      });
    }

    function toggleBuffActive(buffId) {
      const buff = (character.buffs || []).find(b => b.id === buffId);
      if (buff) {
        buff.active = !buff.active;
        saveStateToStorage(true);
        renderAll();
      }
    }

    function adjustBuffRounds(buffId, delta) {
      const buff = (character.buffs || []).find(b => b.id === buffId);
      if (buff && buff.rounds !== null && buff.rounds !== undefined) {
        buff.rounds = Math.max(0, buff.rounds + delta);
        if (buff.rounds === 0) buff.active = false;
        saveStateToStorage(true);
        renderAll();
      }
    }

    function deleteBuff(buffId) {
      const buff = (character.buffs || []).find(b => b.id === buffId);
      const isDebuff = buff && (buff.isDebuff || buff.category === 'Debuff');
      const childCount = (buff && buff.children) ? buff.children.length : 0;
      const typeLabel = isDebuff ? 'debuff' : 'buff';
      const confirmMsg = childCount > 0
        ? `Delete "${buff.name}" (including ${childCount} sub-effects)?`
        : `Are you sure you want to delete this ${typeLabel}?`;
      if (confirm(confirmMsg)) {
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

      updateRoundDisplays();
      saveStateToStorage(true);
      renderAll();

      if (hpLogs.length > 0 || expiredPeriodic.length > 0 || expired.length > 0) {
        const details = [
          ...hpLogs,
          ...expiredPeriodic.map(e => `${e} expired`),
          ...expired.map(e => `${e} expired`)
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
          breakdown: 'Advanced to next round',
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
      character.encounterRound = 1;

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
        });
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

          const dur = (b.durationText || "").toLowerCase();
          const isPermanent = dur.includes("kalıcı") || dur.includes("permanent") || b.permanent;
          const is24h = dur.includes("24 saat") || dur.includes("24 hour");
          if (!isPermanent && !is24h) {
            b.active = false;
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
      if (window.CloudSync && typeof window.CloudSync.pushImmediate === 'function') {
        window.CloudSync.pushImmediate();
      } else if (window.GDriveSync && typeof window.GDriveSync.pushToCloud === 'function') {
        window.GDriveSync.pushToCloud(true);
      }
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

      // 3. Expire combat / round-based buffs
      let expiredBuffs = 0;
      if (Array.isArray(character.buffs)) {
        character.buffs.forEach(b => {
          if (b.active) {
            const isRoundBased = b.rounds !== null && b.rounds !== undefined;
            const isMinuteBased = (b.durationText || "").toLowerCase().includes("dk") || (b.durationText || "").toLowerCase().includes("min");
            if (isRoundBased || (minutes >= 60 && isMinuteBased)) {
              b.active = false;
              expiredBuffs++;
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

      if (typeof renderHUD === 'function') {
        try { renderHUD(); } catch (e) { console.warn('renderHUD immediate short rest error:', e); }
      }

      character.lastModified = new Date().toISOString();
      try { updateRoundDisplays(); } catch (e) { console.warn('updateRoundDisplays error in short rest:', e); }
      try { saveStateToStorage(true); } catch (e) { console.warn('saveStateToStorage error in short rest:', e); }
      if (window.CloudSync && typeof window.CloudSync.pushImmediate === 'function') {
        window.CloudSync.pushImmediate();
      } else if (window.GDriveSync && typeof window.GDriveSync.pushToCloud === 'function') {
        window.GDriveSync.pushToCloud(true);
      }
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
      if (expiredBuffs > 0) summaryParts.push(`${expiredBuffs} timed buff(s) expired`);
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

    function performEncounterReset() {
      if (!character) return;
      character.encounterRound = 1;

      if (!character.tomeOfBattle) character.tomeOfBattle = {};
      if (Array.isArray(character.tomeOfBattle.readiedManeuvers)) {
        character.tomeOfBattle.readiedManeuvers.forEach(m => m.expended = false);
      }
      if (Array.isArray(character.activeModifiers)) {
        character.activeModifiers.forEach(mod => {
          if (mod.source === 'Maneuver' && mod.active) mod.active = false;
        });
      }

      if (Array.isArray(character.buffs)) {
        character.buffs.forEach(b => {
          if (b.rounds !== null && b.rounds <= 10) {
            b.active = false;
          }
        });
      }

      // Reset temporary periodic HP effects
      if (Array.isArray(character.periodicHpEffects)) {
        character.periodicHpEffects = [];
      }

      updateRoundDisplays();
      saveStateToStorage(true);
      renderAll();
      alert('🔄 ENCOUNTER RESET!\n\n• Encounter round counter reset to Round 1.\n• All readied maneuvers recovered.\n• Short encounter buffs (<= 10 rounds) deactivated.\n• Periodic HP effects (DoT/HoT) cleared.');
    }

    let currentBuffModalMode = 'buff'; // 'buff' | 'debuff'
    let currentBuffModalChildren = [];

    function switchBuffModalMode(mode) {
      currentBuffModalMode = mode === 'debuff' ? 'debuff' : 'buff';
      const isDebuff = currentBuffModalMode === 'debuff';

      const btnBuff = document.getElementById('btn-mode-buff');
      const btnDebuff = document.getElementById('btn-mode-debuff');
      const container = document.getElementById('add-buff-modal-container');
      const iconBadge = document.getElementById('buff-modal-icon-badge');
      const modalTitle = document.getElementById('buff-modal-title');
      const modalBadge = document.getElementById('buff-modal-badge');
      const modalSubtitle = document.getElementById('buff-modal-subtitle');
      const rmTitle = document.getElementById('buff-rule-master-title');
      const rmInput = document.getElementById('buff-rule-master-input');
      const presetLabel = document.getElementById('buff-preset-label');
      const presetSelect = document.getElementById('buff-preset-select');
      const nameLabel = document.getElementById('buff-label-name');
      const saveBtn = document.getElementById('btn-save-buff');
      const sourceSelect = document.getElementById('buff-input-source');
      const typeSelect = document.getElementById('buff-input-type');

      // Clear children
      currentBuffModalChildren = [];
      const childrenPreview = document.getElementById('buff-children-preview-container');
      if (childrenPreview) childrenPreview.classList.add('hidden');

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
        if (modalSubtitle) modalSubtitle.textContent = 'Select a D&D 3.5e RAW condition preset or define a custom debuff';
        if (rmTitle) rmTitle.innerHTML = '<span>🧙‍♂️🤖</span><span>Fetch Debuff / Condition with Rule Master (AI)</span>';
        if (rmInput) rmInput.placeholder = 'e.g., -4 lvl drain, Energy Drain, Sickened, Slow, Ray of Enfeeblement...';
        if (presetLabel) presetLabel.textContent = '🩸 Select D&D 3.5e Condition / Debuff Preset';
        if (nameLabel) nameLabel.textContent = 'Debuff Name *';
        if (saveBtn) {
          saveBtn.className = 'bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition shadow';
          saveBtn.innerHTML = '<span>🩸 Add & Activate Debuff</span>';
        }
        if (sourceSelect) sourceSelect.value = 'Condition';
        if (typeSelect) typeSelect.value = 'Penalty';

        // Populate debuff presets
        if (presetSelect) {
          presetSelect.innerHTML = `
            <option value="custom">-- Define Custom Condition / Debuff --</option>
            <option value="energy_drain_4">🩸 Energy Drain (-4 Lvl) [Parent-Child: 5 Sub-Effects]</option>
            <option value="sickened">🤢 Sickened (-2 Attack, Damage, Saves, Skills/Ability Checks)</option>
            <option value="shaken">😱 Shaken (-2 Attack, Saves, Skills/Ability Checks)</option>
            <option value="fatigued">😫 Fatigued (-2 STR, -2 DEX, Cannot Run/Charge)</option>
            <option value="entangled">🕸️ Entangled (-2 Attack, -4 DEX, Half Speed)</option>
            <option value="slow">⏳ Slow (-1 AC, -1 Attack, -1 Ref, Half Speed, Single Action)</option>
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
        if (modalSubtitle) modalSubtitle.textContent = 'Select a D&D 3.5e preset or define a custom buff';
        if (rmTitle) rmTitle.innerHTML = '<span>🧙‍♂️🤖</span><span>Fetch Spell / Buff with Rule Master (AI)</span>';
        if (rmInput) rmInput.placeholder = 'e.g., Righteous Might, Death Ward, Stoneskin, Fly...';
        if (presetLabel) presetLabel.textContent = '⚡ Select D&D 3.5e Buff Preset';
        if (nameLabel) nameLabel.textContent = 'Buff Name *';
        if (saveBtn) {
          saveBtn.className = 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition shadow';
          saveBtn.innerHTML = '<span>✨ Add & Activate Buff</span>';
        }
        if (sourceSelect) sourceSelect.value = 'Spell';
        if (typeSelect) typeSelect.value = 'Enhancement';

        // Populate buff presets
        if (presetSelect) {
          presetSelect.innerHTML = `
            <option value="custom">-- Define Custom Buff --</option>
            <option value="mage_armor">🛡️ Mage Armor (+4 Armor AC, 50 Rds / 5 Hrs)</option>
            <option value="bulls_str">🐂 Bull's Strength (+4 Enhancement STR, 10 Rounds)</option>
            <option value="haste">⚡ Haste (+1 Atk, +1 Dodge AC, +1 Ref, +30 ft Speed, 6 Rounds)</option>
            <option value="prayer">✨ Prayer (+1 Luck Atk/Dmg/Saves/Skills, 6 Rounds)</option>
          `;
        }
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
            <span class="text-slate-200 font-sans font-medium">${c.name}</span>
            <span class="text-rose-400 font-mono font-bold">${cMods.join(', ')}</span>
          </div>
        `;
      }).join('');

      container.classList.remove('hidden');
    }

    function openAddBuffModal() {
      const modal = document.getElementById('add-buff-modal');
      if (!modal) return;
      switchBuffModalMode('buff');
      document.getElementById('buff-input-name').value = '';
      document.getElementById('buff-input-rounds').value = '10';
      document.getElementById('buff-input-duration').value = '1 dk / CL';
      document.getElementById('buff-input-ac').value = '';
      document.getElementById('buff-input-att').value = '';
      document.getElementById('buff-input-dmg').value = '';
      document.getElementById('buff-input-str').value = '';
      document.getElementById('buff-input-dex').value = '';
      document.getElementById('buff-input-con').value = '';
      document.getElementById('buff-input-int').value = '';
      document.getElementById('buff-input-wis').value = '';
      document.getElementById('buff-input-cha').value = '';
      document.getElementById('buff-input-notes').value = '';
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
      const modal = document.getElementById('add-buff-modal');
      if (modal) modal.classList.add('hidden');
    }

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
          srcEl.value = 'Condition (Durum)';
        } else if (rawSrc.includes('undead') || rawSrc.includes('monster') || rawSrc.includes('yaratık')) {
          srcEl.value = 'Undead / Monster';
        } else if (rawSrc.includes('potion') || rawSrc.includes('iksir')) {
          srcEl.value = 'Potion';
        } else if (rawSrc.includes('item') || rawSrc.includes('eşya')) {
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
      const q = inputEl.value.trim();
      if (!q) {
        if (statusEl) {
          statusEl.className = 'text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 p-2 rounded-lg block';
          statusEl.textContent = 'Please enter a rule, spell, or condition name to search.';
        }
        return;
      }

      // Check if query is a debuff or negative level
      const qLower = q.toLowerCase();
      const isDrainQuery = qLower.includes('drain') || qLower.includes('negative level') || qLower.includes('negatif seviye') || qLower.includes('lvl drain');
      const isDebuffQuery = isDrainQuery || qLower.includes('sick') || qLower.includes('shaken') || qLower.includes('fatigue') || qLower.includes('slow') || qLower.includes('entangle') || qLower.includes('debuff') || qLower.includes('curse');

      if (isDebuffQuery && currentBuffModalMode !== 'debuff') {
        switchBuffModalMode('debuff');
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
            statusEl.textContent = `✓ 🧙‍♂️🤖 Rule Master (AI): Detected D&D 3.5e RAW rule "${edMatch.name}"! Populated Parent effect and 5 Child sub-effects (Attack, Saves, Skills, HP, CL).`;
          }
          return;
        }
      }

      if (statusEl) {
        statusEl.className = 'text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 p-2 rounded-lg flex items-center gap-2 block';
        statusEl.innerHTML = '<span class="animate-spin inline-block">⏳</span><span>🧙‍♂️🤖 Searching Rule Master (AI)...</span>';
      }
      if (btn) btn.disabled = true;

      try {
        // 1. Önce yerel Master DB'de ara
        const dbMatches = (typeof masterDb !== 'undefined' && Array.isArray(masterDb)) ? masterDb.filter(item => {
          const name = (item.name || '').toLowerCase();
          return name === q.toLowerCase() || name.includes(q.toLowerCase());
        }) : [];

        if (dbMatches.length > 0) {
          const match = dbMatches[0];
          fillBuffFormFromEntry({
            name: match.name,
            source: match.type === 'Potion' ? 'Potion' : (match.type === 'Spell' ? 'Spell' : 'Item / Equipment'),
            bonusType: match.bonusType || (currentBuffModalMode === 'debuff' ? 'Penalty' : 'Enhancement'),
            rounds: 10,
            durationText: match.duration || '1 dk / CL',
            ac: match.acBonus || match.ac || 0,
            att: match.attBonus || match.att || 0,
            dmg: match.dmgBonus || match.dmg || 0,
            str: match.str || 0,
            dex: match.dex || 0,
            con: match.con || 0,
            int: match.int || 0,
            wis: match.wis || 0,
            cha: match.cha || 0,
            notes: match.benefit || match.desc || match.description || ''
          });

          if (statusEl) {
            statusEl.className = 'text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 p-2 rounded-lg block';
            statusEl.textContent = `✓ Found "${match.name}" in Master DB and populated form!`;
          }
          return;
        }

        // 2. Rule Master AI ile 3.5e kitaplarını tara
        const apiKey = (typeof RuleMaster !== 'undefined' && typeof RuleMaster.getApiKey === 'function') 
          ? RuleMaster.getApiKey() 
          : (localStorage.getItem('gemini_api_key') || '');

        if (!apiKey) {
          if (statusEl) {
            statusEl.className = 'text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 p-2 rounded-lg block';
            statusEl.innerHTML = `⚠️ Not found in Master DB. Add a free Gemini API key in Settings ⚙️ (top right) to fetch from D&D 3.5e sourcebooks via Rule Master (AI).`;
          }
          return;
        }

        if (typeof RuleMaster !== 'undefined' && typeof RuleMaster.fetchSingleAiRuleRows === 'function') {
          const rows = await RuleMaster.fetchSingleAiRuleRows(q, 'Spell', apiKey, statusEl);
          if (rows && rows.length > 0) {
            const row = rows[0];
            fillBuffFormFromEntry({
              name: row[0] || q,
              source: 'Spell',
              bonusType: row[6] || (currentBuffModalMode === 'debuff' ? 'Penalty' : 'Enhancement'),
              rounds: 10,
              durationText: row[26] || '1 dk / CL',
              ac: Number(row[14]) || 0,
              att: Number(row[16]) || 0,
              dmg: Number(row[17]) || 0,
              str: Number(row[8]) || 0,
              dex: Number(row[9]) || 0,
              con: Number(row[10]) || 0,
              int: Number(row[11]) || 0,
              wis: Number(row[12]) || 0,
              cha: Number(row[13]) || 0,
              notes: row[5] || ''
            });

            if (statusEl) {
              statusEl.className = 'text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 p-2 rounded-lg block';
              statusEl.textContent = `✓ 🧙‍♂️🤖 Rule Master (AI) fetched "${row[0] || q}" from D&D 3.5e compendiums and populated the form!`;
            }
            return;
          }
        }

        if (statusEl) {
          statusEl.className = 'text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 p-2 rounded-lg block';
          statusEl.textContent = `"${q}" not found in compendium. Please define it manually below.`;
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
      document.getElementById('buff-input-rounds').value = entry.rounds !== null && entry.rounds !== undefined ? entry.rounds : '';
      document.getElementById('buff-input-duration').value = entry.durationText || '';
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
      const name = document.getElementById('buff-input-name').value.trim();
      if (!name) {
        alert(currentBuffModalMode === 'debuff' ? 'Please enter a valid Debuff Name.' : 'Please enter a valid Buff Name.');
        return;
      }

      const isDebuff = currentBuffModalMode === 'debuff';
      const source = document.getElementById('buff-input-source').value.trim() || (isDebuff ? 'Debuff' : 'Buff');
      const bonusType = document.getElementById('buff-input-type').value;
      const roundsVal = document.getElementById('buff-input-rounds').value.trim();
      const rounds = roundsVal !== '' ? parseInt(roundsVal) : null;
      const durationText = document.getElementById('buff-input-duration').value.trim();
      const acBonus = parseInt(document.getElementById('buff-input-ac').value) || 0;
      const attBonus = parseInt(document.getElementById('buff-input-att').value) || 0;
      const dmgBonus = parseInt(document.getElementById('buff-input-dmg').value) || 0;
      const strBonus = parseInt(document.getElementById('buff-input-str').value) || 0;
      const dexBonus = parseInt(document.getElementById('buff-input-dex').value) || 0;
      const conBonus = parseInt(document.getElementById('buff-input-con').value) || 0;
      const intBonus = parseInt(document.getElementById('buff-input-int').value) || 0;
      const wisBonus = parseInt(document.getElementById('buff-input-wis').value) || 0;
      const chaBonus = parseInt(document.getElementById('buff-input-cha').value) || 0;
      const notes = document.getElementById('buff-input-notes').value.trim();

      const newBuff = {
        id: (isDebuff ? 'debuff_' : 'buff_') + Date.now(),
        name,
        source,
        bonusType,
        isDebuff,
        category: isDebuff ? 'Debuff' : (acBonus ? 'AC' : (strBonus || dexBonus || conBonus ? 'Stat' : 'Combat')),
        active: true,
        rounds,
        durationText: durationText || (rounds ? `${rounds} Rounds` : 'Permanent'),
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
        children: (currentBuffModalChildren && currentBuffModalChildren.length > 0) ? JSON.parse(JSON.stringify(currentBuffModalChildren)) : []
      };

      if (name.toLowerCase().includes('drain') || name.toLowerCase().includes('negative level')) {
        const lvlMatch = name.match(/(\d+)/);
        if (lvlMatch) newBuff.negativeLevels = parseInt(lvlMatch[1]);
      }

      if (!Array.isArray(character.buffs)) character.buffs = [];
      character.buffs.push(newBuff);

      // Optional Master DB Synchronization (29-column schema)
      let addedToDb = false;
      const saveToDb = document.getElementById('buff-save-to-master-db')?.checked !== false;
      if (saveToDb && typeof masterDb !== 'undefined' && Array.isArray(masterDb)) {
        const cleanName = name.trim();
        const existingIdx = masterDb.findIndex(m => (m.name || '').toLowerCase().trim() === cleanName.toLowerCase());

        const entryData = {
          name: cleanName,
          type: isDebuff ? 'Debuff' : (source.toLowerCase().includes('spell') ? 'Spell' : (source.toLowerCase().includes('potion') ? 'Potion' : 'Buff')),
          slot: 'None',
          parent: (newBuff.children && newBuff.children.length > 0) ? 'Parent' : '-',
          prereq: '-',
          source: source || (isDebuff ? 'D&D 3.5e Condition' : 'D&D 3.5e Buff'),
          benefit: notes || (isDebuff ? `${cleanName} debuff effect` : `${cleanName} buff effect`),
          bonusType: bonusType || (isDebuff ? 'Penalty' : 'Enhancement'),
          scope: isDebuff ? 'Debuff / Condition' : 'Buff / Spell',
          strBonus: strBonus || '',
          dexBonus: dexBonus || '',
          conBonus: conBonus || '',
          intBonus: intBonus || '',
          wisBonus: wisBonus || '',
          chaBonus: chaBonus || '',
          acBonus: acBonus || '',
          attBonus: attBonus || '',
          dmgBonus: dmgBonus || '',
          hpBonus: (newBuff.negativeLevels ? `-${newBuff.negativeLevels * 5}` : ''),
          fortBonus: (newBuff.negativeLevels ? `-${newBuff.negativeLevels}` : ''),
          refBonus: (newBuff.negativeLevels ? `-${newBuff.negativeLevels}` : ''),
          willBonus: (newBuff.negativeLevels ? `-${newBuff.negativeLevels}` : ''),
          skillBonus: (newBuff.negativeLevels ? `-${newBuff.negativeLevels}` : ''),
          clBonus: (newBuff.negativeLevels ? `-${newBuff.negativeLevels}` : ''),
          speedBonus: '',
          duration: durationText || (rounds ? `${rounds} Rounds` : 'Permanent'),
          action: 'Standard Action',
          role: isDebuff ? 'Condition / Debuff' : 'Buff / Utility',
          tags: isDebuff ? ['debuff', 'condition'] : ['buff', 'temporary']
        };

        if (Array.isArray(newBuff.children) && newBuff.children.length > 0) {
          entryData.children = JSON.parse(JSON.stringify(newBuff.children));
        }

        if (existingIdx >= 0) {
          masterDb[existingIdx] = Object.assign({}, masterDb[existingIdx], entryData);
        } else {
          masterDb.push(entryData);
        }
        addedToDb = true;

        if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
          RuleMaster.renderTable();
        }
      }

      closeAddBuffModal();
      saveStateToStorage(true);
      renderAll();
      const dbText = addedToDb ? ' and saved to Master DB' : '';
      alert(`${isDebuff ? '🩸' : '✨'} ${isDebuff ? 'Debuff' : 'Buff'} "${name}" activated${dbText}!`);
    }

    // 🎒 INVENTORY, 14 BODY SLOTS & GEAR POOL (Madde 6 & 8)
    function renderInventory() {
      if (!character) return;
      if (!character.bodySlots) character.bodySlots = {};
      if (!character.gearPool) character.gearPool = [];

      // 1. Calculate Carrying Capacity & Weights
      const strScore = character.abilities?.str || 10;
      const caps = RuleEngine.getCarryingCapacity(strScore);

      let equippedWeight = 0;
      Object.values(character.bodySlots).forEach(slot => {
        if (slot && slot.active && slot.name && slot.name !== '-') {
          equippedWeight += Number(slot.weight) || 0;
        }
      });

      let poolWeight = 0;
      character.gearPool.forEach(item => {
        if (!item.isEquipped) {
          const q = (item.qty !== undefined && item.qty !== null) ? Math.max(0, Number(item.qty)) : 1;
          poolWeight += (Number(item.weight) || 0) * q;
        }
      });

      const totalWeight = Math.round((equippedWeight + poolWeight) * 10) / 10;
      const load = RuleEngine.getLoadStatus(totalWeight, strScore);

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
        const pct = Math.min(100, Math.round((totalWeight / caps.heavy) * 100));
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
          const slotData = character.bodySlots[def.key] || { name: '-', active: false, weight: 0, cost: 0, desc: '' };
          const isOccupied = slotData.name && slotData.name !== '-';

          let conflictNotice = '';
          if (def.key === 'offHand' && character.twoHandedConflict) {
            conflictNotice = `<div class="text-[10px] text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
              <span>⚠️</span> <span>Two-handed weapon (${character.twoHandedConflict.mainHand}) occupies both hands (Suppressed)</span>
            </div>`;
          }

          const tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-900/50 transition border-b border-slate-800/80';
          tr.innerHTML = `
            <td class="py-2.5 px-3 text-center align-middle">
              <input type="checkbox" ${slotData.active ? 'checked' : ''} ${!isOccupied ? 'disabled' : ''} onchange="toggleSlotActive('${def.key}')" class="w-4 h-4 rounded text-sky-500 border-slate-700 focus:ring-0">
            </td>
            <td class="py-2.5 px-3 text-center align-middle text-lg">${def.icon}</td>
            <td class="py-2.5 px-3 align-middle font-bold text-slate-300">
              <div>${def.name}</div>
              ${conflictNotice}
            </td>
            <td class="py-2.5 px-3 align-middle font-bold ${isOccupied ? 'text-white' : 'text-slate-500 italic'}">${isOccupied ? slotData.name : '(Empty Slot)'}</td>
            <td class="py-2.5 px-3 align-middle text-slate-300 text-xs">${slotData.desc || '-'}</td>
            <td class="py-2.5 px-3 text-center align-middle font-mono text-slate-400">${isOccupied ? slotData.weight + ' lb' : '-'}</td>
            <td class="py-2.5 px-3 text-center align-middle font-mono text-amber-400">${isOccupied ? slotData.cost + ' GP' : '-'}</td>
            <td class="py-2.5 px-3 text-center align-middle">
              ${isOccupied ? `<button onclick="unequipSlot('${def.key}')" class="bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800 text-[11px] font-semibold px-2 py-0.5 rounded transition">Unequip</button>` : '-'}
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
      try { localStorage.setItem('dnd35_body_slots_view', currentBodySlotsView); } catch(e){}

      const listView = document.getElementById('body-slots-list-view');
      const silView = document.getElementById('body-slots-silhouette-view');
      const btnList = document.getElementById('btn-body-view-list');
      const btnSil = document.getElementById('btn-body-view-silhouette');

      if (currentBodySlotsView === 'silhouette') {
        if (listView) listView.classList.add('hidden');
        if (silView) silView.classList.remove('hidden');
        if (btnSil) {
          btnSil.className = 'px-2.5 py-1 rounded-md transition flex items-center gap-1.5 bg-sky-600 text-white shadow font-bold';
        }
        if (btnList) {
          btnList.className = 'px-2.5 py-1 rounded-md transition flex items-center gap-1.5 text-slate-400 hover:text-white';
        }
        if (rerender) {
          renderBodySlotsSilhouette();
        } else {
          setTimeout(updateSilhouetteConnectorLines, 50);
        }
      } else {
        if (silView) silView.classList.add('hidden');
        if (listView) listView.classList.remove('hidden');
        if (btnList) {
          btnList.className = 'px-2.5 py-1 rounded-md transition flex items-center gap-1.5 bg-sky-600 text-white shadow font-bold';
        }
        if (btnSil) {
          btnSil.className = 'px-2.5 py-1 rounded-md transition flex items-center gap-1.5 text-slate-400 hover:text-white';
        }
      }
    }

    function changeSilhouetteModel(modelKey) {
      selectedSilhouetteModel = modelKey || 'auto';
      try { localStorage.setItem('dnd35_silhouette_model', selectedSilhouetteModel); } catch(e){}
      renderBodySlotsSilhouette();
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

    const DEFAULT_SILHOUETTE_TRANSFORM = {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0
    };

    function getSilhouetteTransform(charObj) {
      const saved = charObj?.customSilhouetteTransform || null;
      let localSaved = null;
      try {
        const raw = localStorage.getItem('dnd35_silhouette_transform');
        if (raw) localSaved = JSON.parse(raw);
      } catch(e) {}

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
      } catch(e) {}
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
          menuBtn.className = "px-3 py-1 rounded-lg bg-sky-900/90 hover:bg-sky-800 border border-sky-400 text-sky-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-sky-950/40";
        } else {
          menuBtn.className = "px-3 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-600/60 hover:border-sky-400 text-sky-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm";
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
      } catch(e) {}

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

    function getSilhouetteImageSrc(charObj) {
      if (charObj && charObj.customSilhouetteImg) {
        return charObj.customSilhouetteImg;
      }
      try {
        const localImg = localStorage.getItem('dnd35_silhouette_custom_img');
        if (localImg) return localImg;
      } catch(e) {}
      return window.HERO_SILHOUETTE_DATA_URI || 'hero_silhouette.jpg';
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
        try { localStorage.setItem('dnd35_silhouette_custom_img', dataUrl); } catch(err){}
        renderBodySlotsSilhouette();
        alert('🖼️ Custom silhouette image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }

    function promptSilhouetteUrl() {
      const current = (character && character.customSilhouetteImg) || '';
      const url = prompt('Enter an image URL for the character silhouette:\n(e.g., https://...png or .jpg)', current);
      if (url === null) return;
      const cleanUrl = url.trim();
      if (!cleanUrl) {
        resetSilhouetteImage();
        return;
      }
      if (!character) character = {};
      character.customSilhouetteImg = cleanUrl;
      try { localStorage.setItem('dnd35_silhouette_custom_img', cleanUrl); } catch(err){}
      renderBodySlotsSilhouette();
      alert('🖼️ Custom silhouette URL applied!');
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
      try { localStorage.removeItem('dnd35_silhouette_custom_img'); } catch(err){}

      // Resim sıfırlanınca vücut noktaları ve konumu da sıfırlansın:
      if (character && character.customSilhouetteCoords) {
        delete character.customSilhouetteCoords;
      }
      try { localStorage.removeItem('dnd35_silhouette_custom_coords'); } catch(err){}
      currentSilhouetteNodes = JSON.parse(JSON.stringify(DEFAULT_BODY_SLOT_NODES));

      resetSilhouetteTransform();
      renderBodySlotsSilhouette();
      if (!suppressAlert) {
        alert('↺ Reset to default D&D warrior silhouette and original body slot nodes.');
      }
    }

    function resetSilhouetteAll() {
      if (confirm('Reset the silhouette image, zoom/pan settings, and all 12 body slot nodes to factory defaults?')) {
        resetSilhouetteImage();
      }
    }

    function resetSilhouettePoints() {
      if (confirm('Reset all 12 body, card, and S-curve connector nodes to their default coordinates?')) {
        if (character && character.customSilhouetteCoords) {
          delete character.customSilhouetteCoords;
        }
        try { localStorage.removeItem('dnd35_silhouette_custom_coords'); } catch(err){}
        currentSilhouetteNodes = JSON.parse(JSON.stringify(DEFAULT_BODY_SLOT_NODES));
        renderBodySlotsSilhouette();
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
      } catch(e) {}
    }

    function copySilhouetteCoordinatesToClipboard() {
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
          alert('📋 All 12 slot coordinates copied to clipboard!');
        }).catch(() => {
          prompt('Copy coordinates (Ctrl+C):', jsonText);
        });
      } else {
        prompt('Copy coordinates (Ctrl+C):', jsonText);
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
               onmousedown="startDraggingCardNode(event, '${slotKey}')"
               ontouchstart="startDraggingCardNode(event, '${slotKey}')"
               onclick="event.stopPropagation()">
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
               onmousedown="startDraggingSlotNode(event, '${slotKey}')"
               ontouchstart="startDraggingSlotNode(event, '${slotKey}')">
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
            <g id="sil-node-group-${slotKey}" class="slot-anchor-node cursor-pointer group pointer-events-auto" onclick="openSlotEquipModal('${slotKey}')">
              <circle id="sil-halo-${slotKey}" cx="${pt.cx}" cy="${pt.cy}" r="9" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-opacity="0.4" stroke-width="1" class="transition-all duration-300 pointer-events-none"/>
              <circle id="sil-node-${slotKey}" cx="${pt.cx}" cy="${pt.cy}" r="5" fill="${color}" stroke="#0b1329" stroke-width="1.8" class="transition-all duration-300 group-hover:scale-125"/>
              <circle id="sil-glint-${slotKey}" cx="${pt.cx}" cy="${pt.cy}" r="1.5" fill="#ffffff" class="pointer-events-none"/>
              <title>${pt.label}: ${isOccupied ? character.bodySlots[slotKey].name : '(Empty Slot - Click to equip)'}</title>
            </g>
          `;
        }
      });

      return `
        <div class="relative w-full h-full rounded-2xl overflow-hidden select-none bg-gradient-to-b from-[#060c1d] via-[#091124] to-[#040814] shadow-[0_0_50px_rgba(56,189,248,0.22)] border border-sky-500/40 flex items-center justify-center">
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(56,189,248,0.18)_0%,rgba(245,158,11,0.06)_45%,transparent_75%)] pointer-events-none"></div>

          <svg id="sil-main-svg" viewBox="0 0 460 520" preserveAspectRatio="none"
               class="w-full h-full select-none ${isSilhouetteTransformActive() ? 'cursor-grab' : ''}"
               onwheel="handleSilhouetteWheel(event)"
               onmousedown="startSilhouettePan(event)"
               ontouchstart="startSilhouettePan(event)"
               onmousemove="handleSilhouetteSvgMouseMove(event)"
               onmouseup="stopDraggingSlotNode()"
               ontouchmove="handleSilhouetteSvgTouchMove(event)"
               ontouchend="stopDraggingSlotNode()">
            <image id="sil-bg-image" href="${imgSrc}" xlink:href="${imgSrc}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="none" class="pointer-events-none filter contrast-110 brightness-105" />

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

      const leftContainer = document.getElementById('sil-left-slots');
      const rightContainer = document.getElementById('sil-right-slots');
      const figureContainer = document.getElementById('sil-figure-container');
      const bottomDock = document.getElementById('sil-bottom-dock');
      const charTag = document.getElementById('sil-char-tag');
      const modelLabel = document.getElementById('sil-model-label');
      const modelSelect = document.getElementById('silhouette-model-select');
      const activeCountEl = document.getElementById('sil-active-count');

      if (!leftContainer || !rightContainer || !figureContainer) return;

      // 6 Slots Left Column
      const LEFT_KEYS = ['head', 'eyes', 'shoulders', 'torso', 'ring1', 'belt'];
      // 6 Slots Right Column
      const RIGHT_KEYS = ['neck', 'armor', 'bracers', 'gloves', 'ring2', 'boots'];

      const TIER_BADGES = {
        head: 'V', eyes: 'V', shoulders: 'VI', torso: 'VI', belt: 'V', ring1: 'II',
        neck: 'V', armor: 'V', bracers: 'III', gloves: 'IV', ring2: 'II', boots: 'II'
      };

      let activeOccupiedCount = 0;

      function buildCardHtml(slotKey, isRight) {
        const def = BODY_SLOT_DEFS.find(d => d.key === slotKey) || { key: slotKey, name: slotKey, trName: slotKey, icon: '⚔️' };
        const slotData = character.bodySlots[slotKey] || { name: '-', active: false, weight: 0, cost: 0, desc: '' };
        const isOccupied = slotData.name && slotData.name !== '-';
        if (isOccupied && slotData.active) activeOccupiedCount++;
        const tier = TIER_BADGES[slotKey] || 'I';

        const tierBadge = `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shrink-0">${tier}</span>`;

        if (isOccupied) {
          return `
            <div data-slot="${slotKey}"
                 onmouseenter="highlightSlotNode('${slotKey}', true)"
                 onmouseleave="highlightSlotNode('${slotKey}', false)"
                 class="group relative bg-[#0b1329]/90 hover:bg-[#0f172a] border ${slotData.active ? 'border-sky-500/60 shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'border-slate-800 opacity-70'} rounded-xl p-2 sm:p-2.5 transition flex items-center justify-between gap-2.5">
              
              <div class="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${slotData.active ? 'bg-sky-950/80 border border-sky-400/60 text-sky-300' : 'bg-slate-800/80 border border-slate-700 text-slate-500'} flex items-center justify-center text-base sm:text-lg shrink-0 shadow-inner group-hover:scale-105 transition">
                  ${def.icon}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-sky-400">${def.trName || def.name}</span>
                    ${slotData.active ? '<span class="px-1.5 py-0.2 rounded text-[8px] font-bold bg-sky-950 text-sky-300 border border-sky-600/40">ACTIVE</span>' : '<span class="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-800 text-slate-400 border border-slate-700">INACTIVE</span>'}
                    ${(() => {
                      const dailyC = (typeof ensureItemDailyCharges === 'function') ? ensureItemDailyCharges(slotData) : slotData.dailyCharges;
                      if (!dailyC) return '';
                      const isRound = (dailyC.unit === 'rounds' || dailyC.unit === 'tur' || dailyC.unit === 'turn');
                      const activeBuff = isRound && (typeof isItemBuffActive === 'function') && isItemBuffActive(slotData);
                      return `
                        <div class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-500/50 shadow-sm" title="Daily Remaining: ${dailyC.current}/${dailyC.max} ${dailyC.unit || 'charges'}">
                          <span>⚡ ${dailyC.current}/${dailyC.max}</span>
                          <button type="button" onclick="event.stopPropagation(); spendSlotCharge('${slotKey}', 1)" title="Spend 1 Charge" class="hover:text-white px-0.5 transition font-extrabold cursor-pointer" ${dailyC.current <= 0 ? 'disabled' : ''}>-</button>
                          <button type="button" onclick="event.stopPropagation(); restoreSlotCharge('${slotKey}', 1)" title="Restore 1 Charge" class="hover:text-white px-0.5 transition font-extrabold cursor-pointer" ${dailyC.current >= dailyC.max ? 'disabled' : ''}>+</button>
                        </div>
                        ${isRound ? `
                          <button type="button" onclick="event.stopPropagation(); ${activeBuff ? `dischargeDailyRoundItem('${encodeURIComponent(slotData.name)}', '${slotKey}')` : `castDailyRoundItem('${encodeURIComponent(slotData.name)}', '${slotKey}')`}"
                                  title="${activeBuff ? 'End Effect' : 'Spend 1 Charge & Activate'}"
                                  class="px-1.5 py-0.5 rounded text-[8px] font-bold transition flex items-center gap-0.5 cursor-pointer shadow-sm ${activeBuff ? 'bg-rose-950 text-rose-300 border border-rose-500 hover:bg-rose-900 animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-600 hover:bg-emerald-900'}">
                            <span>${activeBuff ? '🛑 Son' : '✨ At'}</span>
                          </button>
                        ` : ''}
                      `;
                    })()}
                  </div>
                  <div class="text-xs font-bold text-white truncate group-hover:text-amber-300 transition" title="${slotData.name}">
                    ${slotData.name}
                  </div>
                  <div class="text-[9px] sm:text-[10px] text-slate-400 truncate flex items-center gap-2">
                    ${slotData.desc ? `<span class="truncate max-w-[120px] sm:max-w-[160px]">${slotData.desc}</span>` : ''}
                    <span class="font-mono text-slate-500">${slotData.weight ? slotData.weight + ' lb' : ''}</span>
                    <span class="font-mono text-amber-400/80">${slotData.cost ? slotData.cost + ' GP' : ''}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                ${tierBadge}
                <input type="checkbox" ${slotData.active ? 'checked' : ''} onchange="toggleSlotActive('${slotKey}')" title="Toggle Active / Inactive" class="w-4 h-4 rounded text-sky-500 border-slate-700 bg-slate-950 focus:ring-0 cursor-pointer">
                <button onclick="openSlotEquipModal('${slotKey}')" title="Change Item" class="p-1 rounded bg-slate-800 hover:bg-sky-900/60 text-slate-300 hover:text-sky-200 border border-slate-700 hover:border-sky-500 transition text-xs">
                  🔄
                </button>
                <button onclick="unequipSlot('${slotKey}')" title="Unequip (Return to Inventory)" class="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800 transition text-xs">
                  ❌
                </button>
              </div>
            </div>
          `;
        } else {
          return `
            <div data-slot="${slotKey}"
                 onclick="openSlotEquipModal('${slotKey}')"
                 onmouseenter="highlightSlotNode('${slotKey}', true)"
                 onmouseleave="highlightSlotNode('${slotKey}', false)"
                 class="group relative bg-[#0b1329]/40 hover:bg-[#0b1329]/90 border border-dashed border-slate-800 hover:border-sky-500/60 rounded-xl p-2 sm:p-2.5 transition flex items-center justify-between gap-2.5 cursor-pointer">
              
              <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-600 flex items-center justify-center text-base sm:text-lg shrink-0 group-hover:text-sky-400 group-hover:border-sky-500/50 transition">
                  ${def.icon}
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition">${def.trName || def.name}</div>
                  <div class="text-xs text-slate-500 italic group-hover:text-sky-300 transition">(Empty Slot)</div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                ${tierBadge}
                <button type="button" class="px-2 py-1 rounded bg-sky-950/70 group-hover:bg-sky-600 border border-sky-700/60 text-sky-300 group-hover:text-white text-[10px] sm:text-[11px] font-bold transition flex items-center gap-1 shadow-sm">
                  <span>+ Ready</span>
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
      if (modelSelect) modelSelect.value = 'human';
      if (charTag) charTag.textContent = `${character.race || 'Human'} • ${character.gender === 'Erkek' ? 'Male' : (character.gender === 'Kadın' ? 'Female' : (character.gender || 'Male'))} • ${character.classes || 'Adventurer'}`;
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
        const mh = character.bodySlots?.mainHand || {};
        const oh = character.bodySlots?.offHand || {};
        const mhHas = mh.name && mh.name !== '-';
        const ohHas = oh.name && oh.name !== '-';

        // Un-equipped weapons in pool available to draw
        const readyWeapons = (character.gearPool || []).filter(item => !item.isEquipped && (item.category === 'Weapon' || item.category === 'Shield'));

        bottomDock.innerHTML = `
          <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-amber-400 text-sm">⚔️</span>
              <span class="text-xs font-bold text-amber-300 uppercase tracking-wider">Weapons &amp; Quick Loadout:</span>
            </div>

            <!-- Weapon Quick Slots -->
            <div class="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <!-- Main Hand Badge -->
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg ${mhHas ? 'bg-slate-950 border border-sky-500/60 text-white' : 'bg-slate-950/60 border border-slate-800 text-slate-500'} text-xs">
                <span class="text-sky-400 font-bold text-[10px]">MAIN HAND:</span>
                <span class="font-bold truncate max-w-[140px]">${mhHas ? mh.name : '(Unarmed)'}</span>
                ${mhHas ? `<button onclick="unequipSlot('mainHand')" title="Unequip" class="text-rose-400 hover:text-white text-[10px] ml-1">✕</button>` : ''}
              </div>

              <!-- Off Hand Badge -->
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg ${ohHas ? 'bg-slate-950 border border-amber-500/60 text-white' : 'bg-slate-950/60 border border-slate-800 text-slate-500'} text-xs">
                <span class="text-amber-400 font-bold text-[10px]">OFF-HAND:</span>
                <span class="font-bold truncate max-w-[140px]">${ohHas ? oh.name : '(Empty)'}</span>
                ${ohHas ? `<button onclick="unequipSlot('offHand')" title="Unequip" class="text-rose-400 hover:text-white text-[10px] ml-1">✕</button>` : ''}
              </div>

              <!-- Quick Draw Weapons from Pool -->
              ${readyWeapons.slice(0, 3).map(w => `
                <button onclick="equipPoolItem(${w.id})" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-[11px] font-medium transition flex items-center gap-1.5 shrink-0" title="Quick Equip">
                  <span>⚡</span>
                  <span class="truncate max-w-[110px]">${w.name}</span>
                </button>
              `).join('')}
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

      if (titleEl) titleEl.textContent = `Equip Item: ${def.trName || def.name}`;
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

      if (eligible.length === 0) {
        container.innerHTML = `
          <div class="py-8 text-center space-y-3">
            <div class="text-3xl text-slate-600">🎒</div>
            <p class="text-xs text-slate-400">
              No eligible items found in your inventory pool for <strong>${def?.trName || def?.name || 'this slot'}</strong>.
            </p>
            <div class="pt-2">
              <button onclick="closeSlotEquipModal(); openAddPoolItemModal();" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow">
                ➕ Add New Item to Inventory
              </button>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = eligible.map(item => `
        <div class="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/60 transition flex items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-white">${item.name}</span>
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/60">${item.category}</span>
            </div>
            <div class="text-[10px] text-slate-400 truncate mt-0.5">${item.desc || 'No properties specified'}</div>
            <div class="text-[9px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Weight: <strong class="text-slate-300 font-mono">${item.weight || 0} lb</strong></span>
              <span>•</span>
              <span>Value: <strong class="text-amber-400 font-mono">${item.cost || 0} GP</strong></span>
            </div>
          </div>
          <button onclick="equipPoolItem(${item.id}, '${_currentEquipSlotKey}'); closeSlotEquipModal();" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1 shrink-0">
            <span>⚡ Equip</span>
          </button>
        </div>
      `).join('');
    }

    function toggleSlotActive(slotKey) {
      if (character.bodySlots?.[slotKey]) {
        if (slotKey === 'offHand' && !character.bodySlots.offHand.active) {
          const mh = character.bodySlots.mainHand;
          if (mh && mh.name && mh.name !== '-' && RuleEngine.isTwoHandedWeapon(mh) && !RuleEngine.hasOversizedWeaponFeat(character)) {
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
        character.bodySlots[slotKey].active = !character.bodySlots[slotKey].active;
        saveStateToStorage();
        renderAll();
      }
    }

    function unequipSlot(slotKey, silent = false) {
      const slot = character.bodySlots?.[slotKey];
      if (!slot || slot.name === '-') return;

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
          checkPenalty: slot.checkPenalty
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
      try { renderWeaponSetsUI(); } catch (e) {}
      try { recalculateOffense(); } catch (e) {}

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

    // Render Gear Pool Table (Madde 6 & 8)
    function renderGearPoolTable() {
      const tbody = document.getElementById('gear-pool-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      // Auto-heal miscategorized items in gear pool (e.g. Dagger +2 labeled as 'Other')
      (character.gearPool || []).forEach(item => {
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
      });

      const query = (document.getElementById('pool-search-input')?.value || '').toLowerCase().trim();
      const catFilter = document.getElementById('pool-category-filter')?.value || 'All';

      const filtered = (character.gearPool || []).filter(item => {
        if (item.isEquipped) return false; // Equipped items are shown in body slots
        const matchesQuery = !query || item.name.toLowerCase().includes(query) || (item.desc || '').toLowerCase().includes(query);
        const matchesCat = (catFilter === 'All') || (item.category === catFilter);
        return matchesQuery && matchesCat;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-500 italic">No items found in inventory pool.</td></tr>`;
        return;
      }

      filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-900/60 transition border-b border-slate-800/80';
        tr.innerHTML = `
          <td class="py-2 px-3 align-middle font-semibold text-purple-400">${item.category}</td>
          <td class="py-2 px-3 align-middle font-bold text-white">
            <div class="flex items-center gap-2">
              <span>${item.name}</span>
            </div>
          </td>
          <td class="py-2 px-3 align-middle text-slate-300 text-xs">${item.desc || '-'}</td>
          <td class="py-2 px-3 text-center align-middle font-mono">
            <div class="flex items-center justify-center gap-1">
              <button onclick="adjustPoolQty(${item.id}, -1)" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs leading-none">-</button>
              <span class="w-6 text-center ${Number(item.qty) <= 0 ? 'text-rose-400 font-bold' : 'text-white font-bold'}">${(item.qty !== undefined && item.qty !== null) ? Number(item.qty) : 1}</span>
              <button onclick="adjustPoolQty(${item.id}, 1)" class="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs leading-none">+</button>
            </div>
          </td>
          <td class="py-2 px-3 text-center align-middle font-mono text-slate-400">${item.weight || 0} lb</td>
          <td class="py-2 px-3 text-center align-middle font-mono text-amber-400">${item.cost || 0} GP</td>
          <td class="py-2.5 px-3 text-center align-middle">
            <div class="flex items-center justify-center gap-2">
              ${isConsumableOrSlotless(item) ? `
                <div class="flex flex-col gap-2 w-20">
                  <button onclick="consumeItem3D('pool', ${item.id})" class="w-full bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 text-[11px] font-bold py-1 rounded transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm" title="Consume / Activate / Use">
                    <span>🧪</span><span>Use</span>
                  </button>
                  <button onclick="togglePoolBelt(${item.id})" class="w-full ${item.isBelt ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-600 shadow-sm shadow-emerald-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'} border text-[11px] font-bold py-1 rounded transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm" title="${item.isBelt ? 'Remove from Belt (Disable Quick Access)' : 'Attach to Belt (Add to Combat Quick Access)'}">
                    <span>${item.isBelt ? '🟢' : '⚡'}</span><span>${item.isBelt ? 'On Belt' : 'Belt'}</span>
                  </button>
                </div>
              ` : `
                <div class="w-20 flex items-center justify-center">
                  <button onclick="equipPoolItem(${item.id})" class="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-[11px] font-bold py-1.5 rounded transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm" title="Equip to Body Slot">
                    <span>⚡</span><span>Equip</span>
                  </button>
                </div>
              `}
              <button onclick="deletePoolItem(${item.id})" class="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 text-xs rounded transition cursor-pointer shrink-0" title="Delete">
                🗑️
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function togglePoolBelt(itemId) {
      const item = (character.gearPool || []).find(p => p.id === itemId);
      if (item) {
        item.isBelt = !item.isBelt;
        if (typeof syncAutomatedCombatPins === 'function') syncAutomatedCombatPins(character);
        saveStateToStorage(true);
        renderAll();
      }
    }

    function adjustPoolQty(itemId, delta) {
      const item = (character.gearPool || []).find(p => p.id === itemId);
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

    function deletePoolItem(itemId) {
      if (confirm('Are you sure you want to delete this item from your inventory pool?')) {
        const item = (character.gearPool || []).find(p => p.id === itemId);
        if (item) {
          const cleanName = (item.name || '').toLowerCase().trim();
          if (Array.isArray(character.consumables)) {
            character.consumables = character.consumables.filter(c => (c.name || '').toLowerCase().trim() !== cleanName);
          }
        }
        character.gearPool = (character.gearPool || []).filter(p => p.id !== itemId);
        saveStateToStorage(true);
        renderAll();
      }
    }

    // Equip item from pool into the correct body slot (Madde 8)
    function equipPoolItem(itemId, targetSlotKeyOverride = null) {
      const item = (character.gearPool || []).find(p => p.id === itemId);
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

      const hasOversized = RuleEngine.hasOversizedWeaponFeat(character);
      let targetSlotKey = targetSlotKeyOverride || null;
      let twoHandWarningMsg = null;

      if (item.category === 'Weapon') {
        const isTwoHand = RuleEngine.isTwoHandedWeapon(item);
        const mh = character.bodySlots?.mainHand;
        const oh = character.bodySlots?.offHand;

        if (isTwoHand) {
          // A Two-Handed weapon ALWAYS occupies Main Hand!
          targetSlotKey = 'mainHand';

          // If off-hand currently has a weapon or shield and character lacks oversized feat:
          if (oh && oh.name && oh.name !== '-' && !hasOversized) {
            const prevOhName = oh.name;
            unequipSlot('offHand', true);
            twoHandWarningMsg = `Unequipped off-hand "${prevOhName}" because "${item.name}" is a two-handed weapon.`;
          }
        } else if (!targetSlotKey) {
          // One-handed or light weapon (e.g. Rapier)
          if (!mh || !mh.name || mh.name === '-') {
            targetSlotKey = 'mainHand';
          } else {
            // Check if Main Hand is already wielding a two-handed weapon
            const mhIsTwoHand = RuleEngine.isTwoHandedWeapon(mh);
            if (mhIsTwoHand && !hasOversized) {
              const prevMhName = mh.name;
              unequipSlot('mainHand', true);
              targetSlotKey = 'mainHand';
              twoHandWarningMsg = `Unequipped two-handed "${prevMhName}" and equipped "${item.name}" in main hand.`;
            } else {
              targetSlotKey = 'offHand'; // Dual wield with 1-hand or light weapon
            }
          }
        }
      } else if (item.category === 'Shield') {
        const mh = character.bodySlots?.mainHand;
        const mhIsTwoHand = mh && mh.name && mh.name !== '-' && RuleEngine.isTwoHandedWeapon(mh);

        if (mhIsTwoHand && !hasOversized) {
          const prevMhName = mh.name;
          unequipSlot('mainHand', true);
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

      // Unequip currently equipped item in that slot if any
      const existing = character.bodySlots?.[targetSlotKey];
      if (existing && existing.name && existing.name !== '-') {
        unequipSlot(targetSlotKey, true);
      }

      // Equip new item with full properties
      character.bodySlots[targetSlotKey] = {
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
        ruleFlags: item.ruleFlags ? JSON.parse(JSON.stringify(item.ruleFlags)) : undefined,
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
          if (isTwoHand && !hasOversized) existingWep.grip = '2-Hand';
        } else {
          character.weapons.push({
            name: item.name,
            grip: targetGrip,
            dice: item.dice || (isTwoHand ? '2d6' : '1d6'),
            critMin: item.critMin || (item.name.toLowerCase().includes('jovar') || item.name.toLowerCase().includes('rapier') ? 18 : 20),
            critMult: item.critMult || 2,
            attBonus: item.attBonus || 0,
            dmgBonus: item.dmgBonus || 0,
            dmgType: item.dmgType || 'Slashing',
            bonusType: item.bonusType || 'Enhancement',
            tags: isTwoHand ? ['two-handed'] : []
          });
        }
        if (targetSlotKey === 'mainHand') {
          character.activeWeapon = item.name;
        }
      }

      // Reverse sync: update tactical weapon sets when equipped from inventory/gearPool
      ensureWeaponSetsData();
      if (targetSlotKey === 'mainHand') {
        if (character.tactical?.weaponSets?.set1) {
          character.tactical.weaponSets.set1.mainWeapon = item.name;
        }
        character.activeWeapon = item.name;
      } else if (targetSlotKey === 'offHand') {
        if (character.tactical?.weaponSets?.set2) {
          character.tactical.weaponSets.set2.mainWeapon = item.name;
        }
        if (character.tactical?.weaponSets?.activeSets?.includes(2)) {
          character.activeOffHand = item.name;
        }
      }
      try { renderWeaponSetsUI(); } catch (e) {}
      try { recalculateOffense(); } catch (e) {}

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

      // 1. Önce BUNDLED_SRD_CORE_CATALOG içinde ara (Dagger +2 -> Dagger -> Weapon)
      const baseMatch = typeof findBaseItemInSrdCore === 'function' ? findBaseItemInSrdCore(entry.name) : null;
      if (baseMatch && baseMatch.type) {
        const bType = baseMatch.type.toLowerCase();
        if (bType === 'weapon') return 'Weapon';
        if (bType === 'armor') return 'Armor';
        if (bType === 'shield') return 'Shield';
      }

      const type = (entry.type || '').toLowerCase();
      const slot = (entry.slot || '').toLowerCase();
      const name = (entry.name || '').toLowerCase();

      // 2. Silah, Kalkan ve Zırh Anahtar Kelime Kalkanı
      if (type.includes('weapon') || slot.includes('main hand') || slot.includes('two hand') || slot.includes('off hand')) return 'Weapon';
      if (/\b(?:dagger|sword|blade|axe|bow|crossbow|mace|spear|hammer|rapier|scimitar|flail|halberd|glaive|lance|morningstar|scythe|trident|quarterstaff|sling|dart|javelin|shuriken|kama|nunchaku|siangham|kukri|falchion|whip|club|greatclub)\b/i.test(name)) return 'Weapon';

      if (type.includes('shield') || slot.includes('shield') || name.includes('shield') || name.includes('buckler')) return 'Shield';
      if (type.includes('armor') || slot === 'armor' || slot === 'body' || /\b(?:plate|mail|leather|padded|hide|hauberk|cuirass)\b/i.test(name)) return 'Armor';
      if (type.includes('potion') || type.includes('scroll') || type.includes('wand') || type.includes('consumable') || name.startsWith('scroll of') || name.startsWith('potion of') || name.startsWith('wand of') || name.startsWith('elixir of') || name.startsWith('oil of')) return 'Consumable';
      if (slot.includes('head') || slot.includes('helm') || type.includes('head')) return 'Head';
      if (slot.includes('eyes') || slot.includes('face') || slot.includes('goggles')) return 'Eyes';
      if (slot.includes('neck') || slot.includes('throat') || slot.includes('amulet') || slot.includes('periapt')) return 'Neck';
      if (slot.includes('shoulder') || slot.includes('cloak') || slot.includes('cape')) return 'Shoulders';
      if (slot.includes('torso') || slot.includes('vest') || slot.includes('shirt')) return 'Torso';
      if (slot.includes('belt') || slot.includes('waist')) return 'Belt';
      if (slot.includes('arm') || slot.includes('bracer')) return 'Bracers';
      if (slot.includes('hand') || slot.includes('glove') || slot.includes('gauntlet')) return 'Gloves';
      if (slot.includes('ring') || type.includes('ring') || name.startsWith('ring of')) return 'Ring';
      if (slot.includes('feet') || slot.includes('boot')) return 'Boots';
      return 'Other';
    }

    function getGearCategoryIcon(cat) {
      switch (cat) {
        case 'Weapon': return '⚔️';
        case 'Shield': return '🛡️';
        case 'Armor': return '🥋';
        case 'Head': return '👑';
        case 'Eyes': return '👓';
        case 'Neck': return '📿';
        case 'Shoulders': return '🧥';
        case 'Torso': return '🦺';
        case 'Belt': return '🎗️';
        case 'Bracers': return '🦾';
        case 'Gloves': return '🧤';
        case 'Ring': return '💍';
        case 'Boots': return '👢';
        case 'Consumable': return '🧪';
        default: return '📦';
      }
    }

    // Temporary storage for search matches in modal
    window._poolCurrentMatches = [];
    window._poolCurrentAiEntries = [];
    let _poolSearchDebounceTimer = null;
    let _currentPoolCategoryFilter = 'all';

    // Check if an item is already in character inventory
    function isItemInInventory(name) {
      if (!name || typeof character === 'undefined' || !character) return false;
      const clean = String(name).toLowerCase().trim();
      if ((character.gearPool || []).some(g => (g.name || '').toLowerCase().trim() === clean)) return true;
      if (Object.values(character.bodySlots || {}).some(s => s && s.name && s.name.toLowerCase().trim() === clean)) return true;
      if ((character.weapons || []).some(w => w && w.name && w.name.toLowerCase().trim() === clean)) return true;
      if ((character.consumables || []).some(c => c && c.name && c.name.toLowerCase().trim() === clean)) return true;
      return false;
    }

    // Filter which Master DB / Library items are equipment/items (D&D 3.5e RAW)
    function isEquipmentOrGear(item) {
      if (!item || !item.name) return false;
      const type = String(item.type || '').toLowerCase().trim();
      const cat = String(item.category || '').toLowerCase().trim();

      // STRICT EXCLUSIONS: Feats, Spells, Maneuvers, Races, Classes, Invocations, Special Abilities are NEVER equipment!
      const nonGearTypes = [
        'feat', 'special ability', 'spell', 'maneuver', 'stance', 
        'warlock invocation', 'invocation', 'race', 'class', 'prestige class',
        'domain', 'skill', 'trait', 'flaw', 'template', 'psionic power'
      ];
      if (nonGearTypes.includes(type) || nonGearTypes.includes(cat)) {
        return false;
      }
      if (type.includes('feat') || type.includes('spell') || type.includes('maneuver') || type.includes('ability')) {
        return false;
      }

      // Valid equipment types or categories
      if (type.includes('weapon') || type.includes('armor') || type.includes('shield') || 
          type.includes('potion') || type.includes('ring') || type.includes('wondrous') || 
          type.includes('item') || type.includes('gear') || type.includes('consumable') ||
          type.includes('scroll') || type.includes('wand') || type.includes('rod') ||
          type.includes('equipment') || type.includes('accessory') || type === 'goods') {
        return true;
      }
      // If item has an official body slot (other than 'None' or '-')
      if (item.slot && item.slot !== 'None' && item.slot !== '-' && item.slot.toLowerCase() !== 'none') {
        return true;
      }
      // If it explicitly has positive weight or positive GP cost (common adventuring gear)
      if (Number(item.weight) > 0 || Number(item.cost) > 0) {
        return true;
      }
      if (type === 'other' || cat === 'other') {
        return !!(item.slot && item.slot !== 'None' && item.slot !== '-') || (Number(item.weight) > 0 || Number(item.cost) > 0);
      }
      return false;
    }

    // Get all Master DB items not yet in bag
    function getMasterDbItemsNotInInventory() {
      const allDb = Array.isArray(masterDb) ? masterDb : [];
      const combined = [...allDb];
      if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        window.BUNDLED_SRD_CORE_CATALOG.forEach(coreItem => {
          if (coreItem && coreItem.name && !combined.some(m => (m.name || '').toLowerCase().trim() === coreItem.name.toLowerCase().trim())) {
            combined.push(coreItem);
          }
        });
      }
      return combined.filter(item => {
        return isEquipmentOrGear(item) && !isItemInInventory(item.name);
      });
    }

    // Add Pool Item Modal handlers
    function openAddPoolItemModal() {
      const modal = document.getElementById('add-pool-item-modal');
      if (!modal) return;

      // Reset Search & AI states
      const searchInput = document.getElementById('pool-modal-search');
      if (searchInput) searchInput.value = '';
      const clearBtn = document.getElementById('pool-modal-clear-search');
      if (clearBtn) clearBtn.classList.add('hidden');
      window._poolCurrentAiEntries = [];

      // Reset manual form inputs
      if (document.getElementById('api-name')) document.getElementById('api-name').value = '';
      if (document.getElementById('api-category')) document.getElementById('api-category').value = 'Weapon';
      if (document.getElementById('api-slot')) document.getElementById('api-slot').value = '';
      if (document.getElementById('api-qty')) document.getElementById('api-qty').value = '1';
      if (document.getElementById('api-weight')) document.getElementById('api-weight').value = '1';
      if (document.getElementById('api-cost')) document.getElementById('api-cost').value = '10';
      if (document.getElementById('api-desc')) document.getElementById('api-desc').value = '';
      if (document.getElementById('api-belt')) document.getElementById('api-belt').checked = false;

      // Close details by default so search is clean and primary
      const formDetails = document.getElementById('pool-manual-form-details');
      if (formDetails) formDetails.open = false;

      // Automatically list Master DB items not yet in inventory
      renderUnaddedMasterDbItems('all');

      modal.classList.remove('hidden');
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 50);
    }

    function closeAddPoolItemModal() {
      const modal = document.getElementById('add-pool-item-modal');
      if (modal) modal.classList.add('hidden');
    }

    function setPoolSearchAndFilter(term) {
      const inp = document.getElementById('pool-modal-search');
      if (inp) {
        inp.value = term;
        onPoolModalSearchInput(term);
        inp.focus();
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
      }, 150);
    }

    function renderPoolCategoryTabs(unaddedList, activeFilter) {
      const container = document.getElementById('pool-category-tabs-container');
      const countBadge = document.getElementById('pool-unadded-count-badge');
      if (!container) return;

      const total = unaddedList.length;
      if (countBadge) countBadge.textContent = `${total} items not in bag`;

      const wepCount = unaddedList.filter(i => mapEntryToGearCategory(i) === 'Weapon').length;
      const armCount = unaddedList.filter(i => {
        const c = mapEntryToGearCategory(i);
        return c === 'Armor' || c === 'Shield';
      }).length;
      const wonCount = unaddedList.filter(i => {
        const c = mapEntryToGearCategory(i);
        return ['Ring', 'Head', 'Eyes', 'Neck', 'Shoulders', 'Torso', 'Belt', 'Bracers', 'Gloves', 'Boots'].includes(c);
      }).length;
      const potCount = unaddedList.filter(i => mapEntryToGearCategory(i) === 'Consumable').length;

      const tabs = [
        { key: 'all', label: 'All', count: total },
        { key: 'weapon', label: '⚔️ Weapons', count: wepCount },
        { key: 'armor', label: '🛡️ Armor & Shield', count: armCount },
        { key: 'wondrous', label: '💍 Wondrous Items', count: wonCount },
        { key: 'potion', label: '🧪 Potions & Consumables', count: potCount }
      ];

      container.innerHTML = tabs.map(t => {
        const isActive = activeFilter === t.key;
        const activeClass = isActive 
          ? 'bg-amber-600 text-white font-bold border-amber-500 shadow' 
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700';
        return `
          <button type="button" onclick="renderUnaddedMasterDbItems('${t.key}')" class="px-2 py-0.5 rounded-lg border text-[10px] whitespace-nowrap transition flex items-center gap-1 ${activeClass}">
            <span>${t.label}</span>
            <span class="text-[9px] px-1 py-0.2 rounded-full ${isActive ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-400'}">${t.count}</span>
          </button>
        `;
      }).join('');
    }

    function renderUnaddedMasterDbItems(catFilter = 'all') {
      _currentPoolCategoryFilter = catFilter;
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
        filtered = unadded.filter(item => {
          const c = mapEntryToGearCategory(item);
          return ['Ring', 'Head', 'Eyes', 'Neck', 'Shoulders', 'Torso', 'Belt', 'Bracers', 'Gloves', 'Boots'].includes(c);
        });
      } else if (catFilter === 'potion') {
        filtered = unadded.filter(item => mapEntryToGearCategory(item) === 'Consumable');
      }

      window._poolCurrentMatches = filtered;

      if (filtered.length === 0) {
        if (unadded.length === 0) {
          resultsBox.innerHTML = `
            <div class="p-5 bg-slate-900/80 border border-slate-800 rounded-xl text-center space-y-2 text-slate-400 shadow">
              <div class="text-2xl">🎒✨</div>
              <div class="text-xs font-bold text-white">All Master DB items are already in your inventory!</div>
              <p class="text-[11px] text-slate-400 max-w-sm mx-auto">
                Search 3.5e sourcebooks above via 🧙‍♂️🤖 Rule Master (AI) or use the custom form below to add a new item.
              </p>
            </div>
          `;
        } else {
          resultsBox.innerHTML = `
            <div class="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
              No remaining unowned items in this category.
            </div>
          `;
        }
        return;
      }

      let html = `
        <div class="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1 mb-1">
          <span class="text-amber-300 flex items-center gap-1.5">
            <span>📦</span>
            <span>Master DB Items Not Yet in Your Bag (${filtered.length}):</span>
          </span>
          <span class="text-[10px] text-slate-400 font-normal">Click to add directly to your inventory</span>
        </div>
        <div class="space-y-2">
      `;

      filtered.forEach((item, idx) => {
        const cat = mapEntryToGearCategory(item);
        const icon = getGearCategoryIcon(cat);
        const source = item.source || 'Core 3.5e';
        const weight = Number(item.weight) || 0;
        const cost = Number(item.cost) || 0;
        const desc = item.benefit || item.description || '';

        html += `
          <div id="pool-item-card-${idx}" class="bg-slate-900 border border-slate-700/80 hover:border-amber-500/60 p-2.5 rounded-xl transition space-y-1.5 shadow-sm">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-base">${icon}</span>
                <div>
                  <h4 class="text-xs font-bold text-white truncate">${item.name}</h4>
                  <div class="flex flex-wrap items-center gap-1.5 text-[10px] mt-0.5">
                    <span class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold">${cat}</span>
                    <span class="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">${item.slot || 'Slotless'}</span>
                    <span class="text-slate-400 font-mono">${weight} lbs</span>
                    <span class="text-amber-400 font-mono">${cost} gp</span>
                    <span class="text-slate-500 font-serif italic">${source}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" onclick="fillPoolItemFormFromDb(${idx})" class="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 rounded-lg text-xs font-bold transition" title="Populate Form / Customize">
                  ✏️
                </button>
                <button id="btn-add-pool-${idx}" type="button" onclick="addMasterDbItemDirectlyToPool(${idx}, this)" class="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow transition flex items-center gap-1">
                  <span>📥</span>
                  <span>Add to Bag</span>
                </button>
              </div>
            </div>
            ${desc ? `<p class="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-1.5 rounded border border-slate-800/80">${desc}</p>` : ''}
          </div>
        `;
      });

      html += `</div>`;
      resultsBox.innerHTML = html;
    }

    function executePoolMasterDbSearch(query) {
      const resultsBox = document.getElementById('pool-search-results-box');
      if (!resultsBox) return;

      const q = query.toLowerCase().trim();
      const allDb = Array.isArray(masterDb) ? masterDb : [];

      // Combine masterDb and bundled SRD catalog for equipment lookup without duplicates
      const combined = [...allDb];
      if (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
        window.BUNDLED_SRD_CORE_CATALOG.forEach(coreItem => {
          if (coreItem && coreItem.name && !combined.some(m => (m.name || '').toLowerCase().trim() === coreItem.name.toLowerCase().trim())) {
            combined.push(coreItem);
          }
        });
      }

      // Filter Master DB items: MUST strictly be valid equipment/gear and match query
      const matches = combined.filter(item => {
        if (!item || !item.name) return false;
        if (!isEquipmentOrGear(item)) return false;
        const name = (item.name || '').toLowerCase();
        const type = (item.type || '').toLowerCase();
        const slot = (item.slot || '').toLowerCase();
        const benefit = (item.benefit || item.description || '').toLowerCase();
        return name.includes(q) || type.includes(q) || slot.includes(q) || benefit.includes(q);
      });

      window._poolCurrentMatches = matches;
      renderPoolSearchResults(matches, query);
    }

    function renderPoolSearchResults(matches, query) {
      const resultsBox = document.getElementById('pool-search-results-box');
      if (!resultsBox) return;

      const escapedQ = query.replace(/"/g, '&quot;');

      if (!matches || matches.length === 0) {
        // NO MATCHES FOUND IN LOCAL MASTER DB -> PROMINENT AI LOOKUP CALLOUT
        resultsBox.innerHTML = `
          <div class="p-4 bg-slate-900/90 border border-amber-500/50 rounded-xl space-y-3 shadow-lg">
            <div class="flex items-start gap-3">
              <span class="text-2xl">🔍</span>
              <div>
                <h4 class="text-xs font-bold text-amber-300">"${escapedQ}" Not Found in Master DB</h4>
                <p class="text-[11px] text-slate-300 mt-0.5">
                  The item you searched for is not in the local database. 
                  Scan official D&D 3.5e sourcebooks (PHB, DMG, MIC, Complete) via 🧙‍♂️🤖 Rule Master (AI) to fetch it automatically.
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
              <button type="button" onclick="searchAiForPoolItem('${escapedQ}')" class="flex-1 bg-gradient-to-r from-purple-700 via-indigo-600 to-teal-600 hover:from-purple-600 hover:to-teal-500 text-white font-extrabold text-xs py-2 px-3 rounded-lg shadow-md transition flex items-center justify-center gap-2">
                <span>🧙‍♂️🤖</span>
                <span>Search 3.5e Compendiums via Rule Master (AI)</span>
              </button>
              <button type="button" onclick="fillPoolFormWithQueryName('${escapedQ}')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-3 rounded-lg transition">
                ✏️ Define Manually
              </button>
            </div>
          </div>
        `;
        return;
      }

      // MATCHES FOUND IN LOCAL MASTER DB
      let html = `
        <div class="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1 mb-1">
          <span>Master DB Search Results (${matches.length} items found):</span>
          <button type="button" onclick="searchAiForPoolItem('${escapedQ}')" class="text-purple-400 hover:text-purple-300 underline flex items-center gap-1 font-semibold">
            <span>🧙‍♂️🤖 Search Rulebooks via Rule Master (AI)</span>
          </button>
        </div>
        <div class="space-y-2">
      `;

      // Render matched cards
      matches.slice(0, 10).forEach((item, idx) => {
        const cat = mapEntryToGearCategory(item);
        const icon = getGearCategoryIcon(cat);
        const source = item.source || 'Core 3.5e';
        const weight = Number(item.weight) || 0;
        const cost = Number(item.cost) || 0;
        const desc = item.benefit || item.description || '';
        const inBag = isItemInInventory(item.name);

        html += `
          <div class="bg-slate-900 border border-slate-700 hover:border-amber-500/60 p-2.5 rounded-xl transition space-y-1.5 shadow-sm">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-base">${icon}</span>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-xs font-bold text-white truncate">${item.name}</h4>
                    ${inBag ? `<span class="text-[9px] bg-slate-800 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">✓ In Bag</span>` : ''}
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5 text-[10px] mt-0.5">
                    <span class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold">${cat}</span>
                    <span class="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">${item.slot || 'Slotless'}</span>
                    <span class="text-slate-400 font-mono">${weight} lbs</span>
                    <span class="text-amber-400 font-mono">${cost} gp</span>
                    <span class="text-slate-500 font-serif italic">${source}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" onclick="fillPoolItemFormFromDb(${idx})" class="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 rounded-lg text-xs font-bold transition" title="Populate Form">
                  ✏️
                </button>
                <button id="btn-add-search-${idx}" type="button" onclick="addMasterDbItemDirectlyToPool(${idx}, this)" class="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow transition flex items-center gap-1">
                  <span>📥</span>
                  <span>${inBag ? 'Add Another' : 'Add to Bag'}</span>
                </button>
              </div>
            </div>
            ${desc ? `<p class="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-1.5 rounded border border-slate-800/80">${desc}</p>` : ''}
          </div>
        `;
      });

      html += `
        </div>
        <div class="text-center pt-1">
          <button type="button" onclick="searchAiForPoolItem('${escapedQ}')" class="text-xs text-purple-300 hover:text-purple-200 bg-purple-950/60 hover:bg-purple-900 border border-purple-800/70 rounded-lg px-3 py-1.5 transition inline-flex items-center gap-1.5 shadow">
            <span>🧙‍♂️🤖</span>
            <span>Not what you're looking for? Search 3.5e Compendiums via <strong>Rule Master (AI)</strong> ("${escapedQ}")</span>
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
      const q = (query || '').trim();
      if (!q) {
        alert('⚠️ Please enter an item name to search.');
        return;
      }

      const resultsBox = document.getElementById('pool-search-results-box');
      if (!resultsBox) return;

      const apiKey = typeof RuleMaster !== 'undefined' ? RuleMaster.getApiKey() : (localStorage.getItem('gemini_api_key') || '');
      if (!apiKey) {
        alert('⚠️ 🧙‍♂️🤖 Please configure a valid Google Gemini API key in Settings ⚙️ (top right) to search via Rule Master (AI).');
        if (typeof openSettingsModal === 'function') openSettingsModal();
        return;
      }

      // Render loading state with spinner and active status text
      resultsBox.innerHTML = `
        <div class="p-5 bg-slate-950/90 border border-purple-500/50 rounded-xl text-center space-y-2.5 shadow-2xl">
          <div class="inline-block w-7 h-7 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <div class="text-xs font-bold text-purple-200">🧙‍♂️🤖 Rule Master (AI) Searching 3.5e Compendiums...</div>
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
          localStorage.setItem('dnd35_master_db', JSON.stringify(masterDb));
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
              <span>🧙‍♂️🤖 Rule Master (AI) Lookup Error</span>
            </div>
            <p class="text-[11px] text-rose-400">${err.message || 'No response from API.'}</p>
            <div class="pt-2 border-t border-rose-900/50 flex flex-wrap gap-2 text-xs">
              <button type="button" onclick="searchAiForPoolItem('${q.replace(/'/g, "\\'")}')" class="bg-rose-900 hover:bg-rose-800 text-white font-bold py-1.5 px-3 rounded-lg transition">
                🔄 Retry
              </button>
              <button type="button" onclick="fillPoolFormWithQueryName('${q.replace(/'/g, "\\'")}')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 px-3 rounded-lg transition">
                ✏️ Fill Manually
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
              <span>🧙‍♂️🤖 Found in 3.5e Compendium via Rule Master (AI) (${entries.length} entries)</span>
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
                  <h4 class="text-xs font-bold text-white truncate">${item.name}</h4>
                  <div class="flex flex-wrap items-center gap-1.5 text-[10px] mt-0.5">
                    <span class="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-semibold">${cat}</span>
                    <span class="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">${item.slot || 'Slotless'}</span>
                    <span class="text-slate-400 font-mono">${weight} lbs</span>
                    <span class="text-amber-400 font-mono">${cost} gp</span>
                    <span class="text-purple-300 font-serif italic">📚 ${source}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" onclick="fillPoolItemFormFromAi(${idx})" class="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 rounded-lg text-xs font-bold transition" title="Forma Aktar">
                  ✏️
                </button>
                <button type="button" onclick="addAiItemToPoolAndDb(${idx})" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-1.5 px-3 rounded-lg shadow-md transition flex items-center gap-1">
                  <span>📥</span>
                  <span>Add to Bag</span>
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

      const newId = Date.now();
      character.gearPool.push({
        id: newId,
        name: item.name,
        masterDbName: item.name,
        category: cat,
        slot: item.slot && item.slot !== 'None' ? item.slot : cat,
        qty: 1,
        weight: Number(item.weight) || 0,
        cost: Number(item.cost) || 0,
        desc: item.benefit || item.description || '',
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
            grip: item.slot === 'Main Hand' ? '1-Hand' : '2-Hand',
            dice: (primaryPart && primaryPart.dice) || item.dice || '1d8',
            damageParts: Array.isArray(item.damageParts) && item.damageParts.length > 0
              ? JSON.parse(JSON.stringify(item.damageParts))
              : [{ dice: item.dice || '1d8', bonus: Number(item.dmgBonus) || 0, type: item.dmgType || 'Slashing', multiplyOnCrit: true }],
            modifiers: Array.isArray(item.modifiers) ? JSON.parse(JSON.stringify(item.modifiers)) : [],
            modes: Array.isArray(item.modes) ? JSON.parse(JSON.stringify(item.modes)) : [],
            critMin: item.weaponMeta?.critMin || item.critMin || 20,
            critMult: item.weaponMeta?.critMult || item.critMult || 2,
            attBonus: Number(item.enhancementBonus || item.attBonus) || 0,
            dmgBonus: Number(item.enhancementBonus || item.dmgBonus) || 0,
            dmgType: (primaryPart && primaryPart.type) || item.dmgType || 'Slashing',
            bonusType: 'enhancement',
            tags: item.tags || [],
            elementalMods: secondaryParts.map(sp => ({ name: sp.source || sp.type, dice: sp.dice, type: sp.type }))
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
            effect: item.benefit || 'Potion effect'
          });
        }
      }

      // Attach embedded V2 modes[] from item
      let attachedChildCount = 0;
      const itemModes = Array.isArray(item.modes) ? item.modes : [];
      if (itemModes.length > 0) {
        itemModes.forEach(mode => {
          const modeClean = (mode.name || '').replace(/^↳\s*/, '').trim();
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
          alert(`✅ "${item.name}" and ${attachedChildCount} linked sub-abilities added to your bag!`);
        } else {
          alert(`✅ "${item.name}" added to your inventory pool!`);
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
        localStorage.setItem('dnd35_master_db', JSON.stringify(masterDb));
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
            attBonus: Number(v2Item.enhancementBonus || v2Item.attBonus) || 0,
            dmgBonus: Number(v2Item.enhancementBonus || v2Item.dmgBonus) || 0,
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
          alert(`✅ "${item.name}" and ${attachedChildCount} sub-powers saved to Master DB and added to your bag!`);
        } else {
          alert(`✅ "${item.name}" saved to Master DB and added to your bag!`);
        }
      }
    }

    function fillPoolItemFormFromDb(idx) {
      const item = window._poolCurrentMatches?.[idx];
      if (item) fillPoolItemForm(item);
    }

    function fillPoolItemFormFromAi(idx) {
      const item = window._poolCurrentAiEntries?.[idx];
      if (item) fillPoolItemForm(item);
    }

    function fillPoolFormWithQueryName(name) {
      fillPoolItemForm({ name: name, category: 'Other', weight: 1, cost: 10, benefit: '' });
    }

    // ====================================================
    // ⚒️ V2 LEGO FORGE, SRD COMPENDIUM & EMBEDDED MODES INTEGRATION
    // ====================================================
    function addV2ItemToCharacterGearPool(v2Item) {
      if (!v2Item || !character) return;
      if (!Array.isArray(character.gearPool)) character.gearPool = [];
      const cat = typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(v2Item) : (v2Item.type || 'Other');
      const isBeltItem = (v2Item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable';
      const newEntry = {
        id: v2Item.id || ('item_' + Date.now()),
        baseItemId: v2Item.baseItemId || v2Item.id || null,
        name: v2Item.name,
        masterDbName: v2Item.name,
        category: cat,
        slot: v2Item.slot && v2Item.slot !== 'None' ? v2Item.slot : cat,
        qty: 1,
        weight: Number(v2Item.weight) || 0,
        cost: Number(v2Item.cost) || 0,
        desc: v2Item.benefit || v2Item.description || '',
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
            attBonus: Number(v2Item.enhancementBonus || v2Item.attBonus) || 0,
            dmgBonus: Number(v2Item.enhancementBonus || v2Item.dmgBonus) || 0,
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
          title: 'V2 Item Added to Inventory',
          breakdown: `"${v2Item.name}" added to your Gear Pool.`,
          total: `${Number(v2Item.cost || 0).toLocaleString('tr-TR')} gp`
        });
      }
    }

    function openCharacterForgeDrawer() {
      if (window.DnDUI && typeof window.DnDUI.openCompendiumDrawer === 'function') {
        window.DnDUI.openCompendiumDrawer({
          defaultTab: 'forge',
          onSelect: (assembledItem) => addV2ItemToCharacterGearPool(assembledItem)
        });
      }
    }

    function openCharacterCompendiumDrawer(defaultCategory = 'Weapon') {
      if (window.DnDUI && typeof window.DnDUI.openCompendiumDrawer === 'function') {
        window.DnDUI.openCompendiumDrawer({
          defaultTab: 'browse',
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

    function fillPoolItemForm(item) {
      if (!item) return;
      const cat = mapEntryToGearCategory(item);

      if (document.getElementById('api-name')) document.getElementById('api-name').value = item.name || '';
      if (document.getElementById('api-category')) document.getElementById('api-category').value = cat;
      if (document.getElementById('api-slot')) document.getElementById('api-slot').value = item.slot || cat;
      if (document.getElementById('api-qty')) document.getElementById('api-qty').value = (item.qty !== undefined && item.qty !== null) ? item.qty : 1;
      if (document.getElementById('api-weight')) document.getElementById('api-weight').value = item.weight || 0;
      if (document.getElementById('api-cost')) document.getElementById('api-cost').value = item.cost || 0;
      if (document.getElementById('api-desc')) document.getElementById('api-desc').value = item.benefit || item.description || '';
      if (document.getElementById('api-belt')) {
        document.getElementById('api-belt').checked = (item.slot || '').toLowerCase().includes('belt') || cat === 'Consumable';
      }

      // Expand details
      const formDetails = document.getElementById('pool-manual-form-details');
      if (formDetails) {
        formDetails.open = true;
        formDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function saveNewPoolItem() {
      const nameInput = document.getElementById('api-name');
      const name = nameInput?.value?.trim();
      if (!name) {
        alert('Please enter an item name.');
        if (nameInput) nameInput.focus();
        return;
      }
      const category = document.getElementById('api-category')?.value || 'Other';
      const slot = document.getElementById('api-slot')?.value || category;
      const rawQty = document.getElementById('api-qty')?.value;
      const qty = (rawQty !== undefined && rawQty !== '' && !isNaN(parseInt(rawQty))) ? Math.max(0, parseInt(rawQty)) : 1;
      const weight = parseFloat(document.getElementById('api-weight')?.value) || 0;
      const cost = parseFloat(document.getElementById('api-cost')?.value) || 0;
      const desc = document.getElementById('api-desc')?.value?.trim() || '';
      const isBelt = document.getElementById('api-belt')?.checked || false;

      if (!character.gearPool) character.gearPool = [];
      const newId = Date.now();
      character.gearPool.push({
        id: newId,
        name,
        category,
        slot,
        qty,
        weight,
        cost,
        desc,
        isBelt,
        isEquipped: false
      });

      if ((category === 'Consumable' || isBelt) && !isWeaponWithoutMagicOrHealing({ name, category, desc })) {
        if (!character.consumables) character.consumables = [];
        const cleanName = name.toLowerCase().trim();
        const hasCons = character.consumables.some(c => (c.name || '').toLowerCase().trim() === cleanName);
        if (!hasCons) {
          character.consumables.push({
            name: name,
            qty: qty,
            effect: desc || 'Sarf malzemesi etkisi'
          });
        }
      }

      saveStateToStorage(true);
      renderAll();
      closeAddPoolItemModal();
      alert(`✅ "${name}" added to your inventory pool!`);
    }

    // ====================================================
    // 🧪 HIZLI TÜKETİM, ASALAR VE SİHİRLİ EŞYA SİSTEMİ
    // (İyileşme, Saldırı/Hasar Asaları ve Günlük Şarj Takibi)
    // ====================================================

    // Kontrol: Silah mı ve büyüsel saldırı/iyileştirme özelliği yok mu?
    function isWeaponWithoutMagicOrHealing(item) {
      if (!item) return false;
      const name = (item.name || '').toLowerCase().trim();
      const desc = (item.desc || item.effect || '').toLowerCase().trim();
      const cat = item.category || (typeof mapEntryToGearCategory === 'function' ? mapEntryToGearCategory(item) : '');
      const combined = name + ' ' + desc;

      // Asalar, iksirler, parşömenler asla silah sayılmaz
      if (/wand|scroll|potion|asa\b|iksir|parşömen/i.test(name)) return false;

      // 1. Silah kategorisi veya tanınan silah ismi kontrolü
      const isWeaponCat = (cat === 'Weapon');
      const isWeaponSlot = (item.slotKey === 'mainHand' || item.slotKey === 'offHand');
      const knownWeapons = [
        'dagger', 'rapier', 'hançer', 'longsword', 'shortsword', 'greatsword', 'scimitar',
        'falchion', 'handaxe', 'battleaxe', 'greataxe', 'halberd', 'spear', 'longspear',
        'mace', 'heavy mace', 'light mace', 'morningstar', 'warhammer', 'club', 'quarterstaff',
        'flail', 'heavy flail', 'shortbow', 'longbow', 'composite shortbow', 'composite longbow',
        'light crossbow', 'heavy crossbow', 'hand crossbow', 'sling', 'dart', 'javelin',
        'shuriken', 'kama', 'nunchaku', 'siangham', 'sai', 'kukri', 'spiked chain', 'bastard sword',
        'dwarven waraxe', 'gnome hooked hammer', 'orc double axe', 'dire flail', 'two-bladed sword',
        'kılıç', 'yay', 'arbalet', 'balta', 'gürz', 'mızrak', 'sapan'
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
      const hasHealing = /cure|heal|iyileş|can iksir|healing/i.test(combined);

      // C) Büyüsel saldırı veya hasar etkisi (örn: Fireball, Magic Missile, Lightning, 1d6 ateş hasarı vb.)
      const hasSpellAttack = /(?:fireball|magic missile|lightning|scorching|cone of cold|ice storm|flame strike|vampiric touch|shocking grasp|inflict)/i.test(combined) ||
                             /(?:büyüsel saldırı|spell attack|spell-like|sla\b|günde\s*\d+\s*(?:defa|kez|kullanım)|(?:\d+)\s*\/\s*(?:day|gün))/i.test(combined) ||
                             /(?:hasar|damage).*(?:ateş|fire|soğuk|cold|asit|acid|elektrik|electric|force)/i.test(desc);

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
      const match = combined.match(/(?:(\d+)\s*(?:charges?|rounds?|uses?|times?|kullanım|şarj|tur|defa)?\s*(?:\/|\s*per\s*|\s*x\s*|\s*a\s*)\s*(?:day|gün|günde|günlük))|(?:(?:günde|günlük)\s*(\d+)\s*(?:şarj|kullanım|tur|round|defa)?)/i);
      if (match) {
        const maxVal = parseInt(match[1] || match[2]) || 1;
        let unit = 'charges';
        const matchedStr = match[0].toLowerCase();
        if (matchedStr.includes('round') || matchedStr.includes('tur')) unit = 'rounds';
        else if (matchedStr.includes('use') || matchedStr.includes('kullanım') || matchedStr.includes('defa')) unit = 'uses';
        item.dailyCharges = { current: maxVal, max: maxVal, unit: unit, recharge: 'long_rest' };
        return item.dailyCharges;
      }
      return null;
    }

    function spendSlotCharge(slotKey, amount = 1) {
      const item = character.bodySlots?.[slotKey];
      if (!item) return;
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
            attBonus: 1,
            acBonus: 1,
            bonusType: 'Dodge',
            speedBonus: 30,
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

      const isRoundUnit = item.dailyCharges && (item.dailyCharges.unit === 'rounds' || item.dailyCharges.unit === 'tur' || item.dailyCharges.unit === 'turn');
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
          label: `${diceIcon}<span>${opt.label}</span>`,
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
            attBonus: 1,
            acBonus: 1,
            bonusType: 'Dodge',
            speedBonus: 30,
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
          attBonus: opt.bonusAtk || 0,
          dmgBonus: opt.bonusDmg || 0,
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

    // Hasar / Büyü Formülü Ayrıştırıcı (Wand of Fireball, Magic Missile, Lightning vb.)
    function parseDamageFromItem(name, effectDesc) {
      const cleanName = (name || '').toLowerCase();
      const cleanDesc = (effectDesc || '').toLowerCase();
      const combined = cleanName + ' ' + cleanDesc;

      // 1. Fireball / Ateş Topu
      if (cleanName.includes('fireball') || cleanName.includes('ateş topu')) {
        const clMatch = combined.match(/cl\s*(\d+)/i);
        let cl = 5;
        if (clMatch) cl = Math.min(10, Math.max(5, parseInt(clMatch[1])));
        const diceMatch = cleanDesc.match(/(\d+)d6/i);
        const count = diceMatch ? parseInt(diceMatch[1]) : cl;
        return {
          type: 'fire',
          typeName: 'Fire Damage',
          icon: '🔥',
          diceCount: count,
          diceSides: 6,
          flatBonus: 0,
          formula: `${count}d6`,
          saveDesc: 'Reflex DC 14 half'
        };
      }

      // 2. Magic Missile / Büyülü Füze
      if (cleanName.includes('magic missile') || cleanName.includes('büyülü füze')) {
        const clMatch = combined.match(/cl\s*(\d+)/i);
        let cl = 1;
        if (clMatch) cl = parseInt(clMatch[1]) || 1;
        let missiles = 1;
        if (cl >= 9) missiles = 5;
        else if (cl >= 7) missiles = 4;
        else if (cl >= 5) missiles = 3;
        else if (cl >= 3) missiles = 2;

        const mMatch = cleanDesc.match(/(\d+)\s*(?:missile|füze|adet|x)/i);
        if (mMatch) missiles = parseInt(mMatch[1]) || missiles;

        return {
          type: 'force',
          typeName: 'Force Damage',
          icon: '⚡',
          diceCount: missiles,
          diceSides: 4,
          flatBonus: missiles * 1, // her füze 1d4+1
          formula: `${missiles}x(1d4+1)`,
          isMagicMissile: true,
          missiles: missiles
        };
      }

      // 3. Lightning Bolt / Yıldırım
      if (cleanName.includes('lightning bolt') || cleanName.includes('yıldırım')) {
        const clMatch = combined.match(/cl\s*(\d+)/i);
        const cl = clMatch ? Math.min(10, Math.max(5, parseInt(clMatch[1]))) : 5;
        return {
          type: 'electricity',
          typeName: 'Electricity Damage',
          icon: '⚡',
          diceCount: cl,
          diceSides: 6,
          flatBonus: 0,
          formula: `${cl}d6`,
          saveDesc: 'Reflex DC 14 half'
        };
      }

      // 4. Scorching Ray / Yakıcı Işın
      if (cleanName.includes('scorching ray')) {
        return {
          type: 'fire',
          typeName: 'Scorching Ray (Fire)',
          icon: '🔥',
          diceCount: 4,
          diceSides: 6,
          flatBonus: 0,
          formula: '4d6'
        };
      }

      // 5. Genel Zar / Hasar Ayrıştırıcı (örn. 5d6, 3d6+3, 2d8, 1d6+2 vb.)
      const genMatch = (effectDesc || '').match(/(\d+)d(\d+)(?:\s*([+-]\s*\d+))?/i);
      if (genMatch) {
        const count = parseInt(genMatch[1]) || 1;
        const sides = parseInt(genMatch[2]) || 6;
        const flat = genMatch[3] ? parseInt(genMatch[3].replace(/\s+/g, '')) : 0;
        let typeName = 'Damage';
        let icon = '💥';
        if (/fire|ateş/i.test(combined)) { typeName = 'Fire Damage'; icon = '🔥'; }
        else if (/cold|soğuk|buz/i.test(combined)) { typeName = 'Cold Damage'; icon = '❄️'; }
        else if (/acid|asit/i.test(combined)) { typeName = 'Acid Damage'; icon = '🧪'; }
        else if (/electric|elektrik|yıldırım/i.test(combined)) { typeName = 'Electricity Damage'; icon = '⚡'; }
        else if (/force|güç/i.test(combined)) { typeName = 'Force Damage'; icon = '✨'; }

        return {
          type: 'generic',
          typeName,
          icon,
          diceCount: count,
          diceSides: sides,
          flatBonus: flat,
          formula: `${count}d${sides}${flat !== 0 ? (flat > 0 ? '+' : '') + flat : ''}`
        };
      }

      return null;
    }

    // Eşyayı Kategoriye Ayırıcı
    function getConsumableCategory(item) {
      const name = (item.name || '').toLowerCase();
      const desc = (item.effect || item.desc || '').toLowerCase();
      const combined = name + ' ' + desc;

      // 1. İyileşme (En yüksek öncelik)
      if (/cure|heal|iyileş|can iksir|healing/i.test(name) || (/cure|heal|iyileş/i.test(desc) && !/fireball|magic missile|wand/i.test(name))) {
        return 'healing';
      }

      // 2. Asalar & Hasar Veren Eşyalar
      if (/wand|asa|fireball|magic missile|lightning|scorching|hasar|damage|cone of cold|ice storm/i.test(name) || /(\d+)d(\d+).*hasar|damage/i.test(desc)) {
        return 'wand_damage';
      }

      // 3. Günlük Şarjlı Eşyalar (Ring of Sending 3/day vb.)
      if (item.dailyCharges || /(?:\d+\s*\/\s*day|\d+\s*\/\s*gün|günde\s*\d+)/i.test(combined)) {
        return 'daily_charge';
      }

      // 4. Buff & Destek İksirleri
      if (/potion|iksir|elixir|buff|strength|grace|endurance|cunning|wisdom|splendor|invisibility|fly|hız|haste|shield/i.test(name)) {
        return 'buff';
      }

      return 'other';
    }

    function renderConsumables() {
      const container = document.getElementById('consumables-container');
      if (!container) return;
      container.innerHTML = '';

      // 0. Auto-clean: Purge non-magical weapons previously synced into character.consumables
      if (Array.isArray(character.consumables)) {
        const prevLen = character.consumables.length;
        character.consumables = character.consumables.filter(c => !isWeaponWithoutMagicOrHealing(c));
        if (character.consumables.length !== prevLen && typeof saveStateToStorage === 'function') {
          saveStateToStorage(true);
        }
      }

      // 1. Sync character.gearPool consumables with character.consumables (excluding plain weapons)
      if (Array.isArray(character.gearPool)) {
        if (!Array.isArray(character.consumables)) character.consumables = [];
        character.gearPool.forEach(p => {
          if (isWeaponWithoutMagicOrHealing(p)) return;
          if (p.category === 'Consumable' || (p.isBelt && p.category !== 'Weapon') || p.category === 'Wand' || (p.name || '').toLowerCase().includes('wand')) {
            const cleanName = (p.name || '').toLowerCase().trim();
            const existing = character.consumables.find(c => (c.name || '').toLowerCase().trim() === cleanName);
            if (existing) {
              existing.qty = (p.qty !== undefined && p.qty !== null) ? Number(p.qty) : (existing.qty !== undefined ? Number(existing.qty) : 1);
              if (!existing.effect && p.desc) existing.effect = p.desc;
              if (p.dailyCharges) existing.dailyCharges = p.dailyCharges;
            } else if (p.category === 'Consumable' || p.category === 'Wand') {
              character.consumables.push({
                name: p.name,
                qty: (p.qty !== undefined && p.qty !== null) ? Number(p.qty) : 1,
                effect: p.desc || 'Consumable effect',
                dailyCharges: p.dailyCharges || null
              });
            }
          }
        });
      }

      // 2. Build unified list of consumables to display
      const displayMap = new Map();

      // GearPool items (Consumable, isBelt, Wand, or has daily charges) - excluding plain weapons
      (character.gearPool || []).forEach(p => {
        if (isWeaponWithoutMagicOrHealing(p)) return;
        const isWand = p.category === 'Wand' || (p.name || '').toLowerCase().includes('wand');
        const hasDaily = !!ensureItemDailyCharges(p);
        if ((p.category === 'Consumable' || (p.isBelt && p.category !== 'Weapon') || isWand || hasDaily) && !p.isEquipped) {
          const key = (p.name || '').toLowerCase().trim();
          if (!key) return;
          displayMap.set(key, {
            name: p.name,
            qty: (p.qty !== undefined && p.qty !== null) ? Number(p.qty) : 1,
            effect: p.desc || 'Consumable / wand',
            sourceType: 'pool',
            poolId: p.id,
            isBelt: !!p.isBelt,
            dailyCharges: p.dailyCharges || null
          });
        }
      });

      // Regular consumables in character.consumables - excluding plain weapons
      (character.consumables || []).forEach((c, cIdx) => {
        if (isWeaponWithoutMagicOrHealing(c)) return;
        const key = (c.name || '').toLowerCase().trim();
        if (!key) return;
        ensureItemDailyCharges(c);
        if (!displayMap.has(key)) {
          displayMap.set(key, {
            name: c.name,
            qty: (c.qty !== undefined && c.qty !== null) ? Number(c.qty) : 1,
            effect: c.effect || 'Consumable effect',
            sourceType: 'consumable',
            idx: cIdx,
            isBelt: false,
            dailyCharges: c.dailyCharges || null
          });
        } else {
          const existing = displayMap.get(key);
          if (c.effect && (!existing.effect || existing.effect === 'Consumable effect' || existing.effect === 'Sarf malzemesi etkisi')) {
            existing.effect = c.effect;
          }
          if (c.dailyCharges && !existing.dailyCharges) {
            existing.dailyCharges = c.dailyCharges;
          }
        }
      });

      // Equipped Body Slots items that have daily charges - excluding plain weapons
      if (character.bodySlots) {
        Object.entries(character.bodySlots).forEach(([slotKey, slotItem]) => {
          if (slotItem && slotItem.name && slotItem.name !== '-') {
            if (isWeaponWithoutMagicOrHealing(slotItem)) return;
            const hasDaily = !!ensureItemDailyCharges(slotItem);
            const isWandOrUse = (slotItem.desc && /(?:cure|fireball|missile|\d+d\d+)/i.test(slotItem.desc)) || (slotItem.name && /wand|asa/i.test(slotItem.name));
            if (hasDaily || isWandOrUse) {
              const key = (slotItem.name || '').toLowerCase().trim();
              if (!displayMap.has(key)) {
                displayMap.set(key, {
                  name: slotItem.name,
                  qty: Number(slotItem.qty) || 1,
                  effect: slotItem.desc || 'Equipped magic item',
                  sourceType: 'slot',
                  slotKey: slotKey,
                  isBelt: false,
                  fromSlot: true,
                  dailyCharges: slotItem.dailyCharges || null
                });
              }
            }
          }
        });
      }

      const allItems = Array.from(displayMap.values());

      if (allItems.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 italic py-4 bg-slate-900/50 rounded-xl border border-slate-800">No consumables or charged items found on belt or in bag.</div>`;
        return;
      }

      // Group definitions with strict ordering: HEALING FIRST!
      const GROUPS = [
        {
          key: 'healing',
          title: '💖 HEALING ITEMS & POTIONS',
          icon: '💖',
          badgeText: 'Healing',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-700',
          cardBorder: 'border-emerald-500/40 hover:border-emerald-400',
          btnBg: 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/40',
          btnIcon: '💖',
          btnText: 'Drink / Use'
        },
        {
          key: 'wand_damage',
          title: '⚡ WANDS & OFFENSIVE ITEMS',
          icon: '⚡',
          badgeText: 'Wand / Damage',
          badgeBg: 'bg-rose-950 text-rose-300 border-rose-700',
          cardBorder: 'border-rose-500/40 hover:border-rose-400',
          btnBg: 'bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/40',
          btnIcon: '⚡',
          btnText: 'Activate'
        },
        {
          key: 'buff',
          title: '🧪 BUFF, CONDITION & UTILITY POTIONS',
          icon: '🧪',
          badgeText: 'Buff',
          badgeBg: 'bg-purple-950 text-purple-300 border-purple-700',
          cardBorder: 'border-purple-500/40 hover:border-purple-400',
          btnBg: 'bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/40',
          btnIcon: '🧪',
          btnText: 'Use'
        },
        {
          key: 'daily_charge',
          title: '💍 DAILY CHARGED MAGIC ITEMS (X/DAY)',
          icon: '💍',
          badgeText: 'Daily Charge',
          badgeBg: 'bg-sky-950 text-sky-300 border-sky-700',
          cardBorder: 'border-sky-500/40 hover:border-sky-400',
          btnBg: 'bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white border-sky-500/40',
          btnIcon: '💍',
          btnText: 'Use'
        },
        {
          key: 'other',
          title: '📦 OTHER CONSUMABLES',
          icon: '📦',
          badgeText: 'Consumable',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
          cardBorder: 'border-slate-700 hover:border-slate-500',
          btnBg: 'bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border-amber-500/40',
          btnIcon: '📦',
          btnText: 'Use'
        }
      ];

      // Distribute items into groups
      const groupedData = {};
      GROUPS.forEach(g => { groupedData[g.key] = []; });

      allItems.forEach(item => {
        const cat = getConsumableCategory(item);
        if (groupedData[cat]) {
          groupedData[cat].push(item);
        } else {
          groupedData['other'].push(item);
        }
      });

      // Render each non-empty group in order
      GROUPS.forEach(group => {
        const items = groupedData[group.key];
        if (!items || items.length === 0) return;

        // Sort alphabetically within category
        items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const section = document.createElement('div');
        section.className = 'space-y-2';

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between border-b border-slate-800/80 pb-1 pt-1.5';
        header.innerHTML = `
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <span>${group.icon}</span>
            <span>${group.title}</span>
            <span class="badge ${group.badgeBg} text-[10px] ml-1 px-1.5 py-0.2">${items.length}</span>
          </div>
        `;
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-2.5';

        items.forEach(item => {
          const isDaily = item.dailyCharges && typeof item.dailyCharges.max === 'number';
          const isExhausted = isDaily ? (item.dailyCharges.current <= 0) : (item.qty <= 0);

          let chargeText = '';
          if (isDaily) {
            chargeText = `Daily Left: <strong class="${item.dailyCharges.current > 0 ? 'text-sky-300' : 'text-rose-400'}">${item.dailyCharges.current} / ${item.dailyCharges.max}</strong>`;
          } else {
            chargeText = `Qty / Charges: <strong class="${item.qty > 0 ? 'text-white' : 'text-rose-400'}">${item.qty}</strong>`;
          }

          // Damage or heal tag
          let tagBadge = '';
          const dmgPlan = parseDamageFromItem(item.name, item.effect);
          if (dmgPlan) {
            tagBadge = `<span class="badge bg-rose-950 text-rose-300 border border-rose-700 text-[9px] font-mono">${dmgPlan.formula} Dmg</span>`;
          } else if (/cure|heal|iyileş/i.test(item.name)) {
            let formulaBadge = '1d8+1';
            if (/serious/i.test(item.name)) formulaBadge = '3d8+5';
            else if (/moderate/i.test(item.name)) formulaBadge = '2d8+3';
            else if (/critical/i.test(item.name)) formulaBadge = '4d8+7';
            else if (/heal/i.test(item.name)) formulaBadge = '110 HP';
            tagBadge = `<span class="badge bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px] font-mono">${formulaBadge} HP</span>`;
          }

          const card = document.createElement('div');
          card.className = `bg-slate-900/90 border ${group.cardBorder} p-3 rounded-xl flex items-center justify-between gap-3 transition shadow-sm ${isExhausted ? 'opacity-60' : ''}`;
          card.innerHTML = `
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>${item.name}</span>
                <span class="badge ${group.badgeBg} text-[9px] font-bold px-1.5 py-0.2">${group.badgeText}</span>
                ${item.isBelt ? '<span class="badge bg-amber-950 text-amber-300 border border-amber-700 text-[9px]">On Belt</span>' : ''}
                ${item.fromSlot ? '<span class="badge bg-sky-950 text-sky-300 border border-sky-700 text-[9px]">Equipped</span>' : ''}
                ${tagBadge}
              </div>
              <div class="text-[10px] text-slate-300 break-words mt-1 flex items-center gap-2 flex-wrap">
                <span>${item.effect}</span>
                <span class="border-l border-slate-700 pl-2 font-mono text-[11px]">${chargeText}</span>
              </div>
            </div>
            <button onclick="consumeItem3D('${item.sourceType}', ${item.sourceType === 'pool' ? item.poolId : (item.sourceType === 'slot' ? `'${item.slotKey}'` : item.idx)})" ${isExhausted ? 'disabled' : ''} class="shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${group.btnBg} disabled:opacity-30 disabled:cursor-not-allowed border text-xs font-bold px-3 py-1.5 rounded-lg transition self-center">
              <span>${group.btnIcon}</span>
              <span>${isExhausted ? 'Depleted' : group.btnText}</span>
            </button>
          `;
          grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
      });
    }

    function consumeItem3D(sourceType, idOrIdx) {
      let item = null;
      if (sourceType === 'slot') {
        item = character.bodySlots?.[idOrIdx];
      } else if (sourceType === 'pool' || sourceType === true) {
        item = (character.gearPool || []).find(p => p.id === idOrIdx);
      } else {
        item = character.consumables?.[idOrIdx];
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

      ensureItemDailyCharges(item);
      const isDaily = item.dailyCharges && typeof item.dailyCharges.max === 'number';

      if (isDaily) {
        if (item.dailyCharges.current <= 0) {
          showDiceTopToast({
            icon: '⏳',
            title: item.name || 'Magic Item',
            breakdown: 'All daily charges expended! Resets on a Long Rest (☀️).',
            total: `0 / ${item.dailyCharges.max}`
          });
          return;
        }
        item.dailyCharges.current--;
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
        item.qty = Math.max(0, curQty - 1);
      }

      const name = item.name || 'Magic Item';

      // Bidirectional sync between gearPool and consumables
      const cleanName = (name || '').toLowerCase().trim();
      const targetPoolId = (sourceType === 'pool' ? idOrIdx : (item.id || item.poolId));
      if (Array.isArray(character.consumables)) {
        const cMatch = character.consumables.find(c => (c.name || '').toLowerCase().trim() === cleanName);
        if (cMatch) {
          if (!isDaily) cMatch.qty = item.qty;
          if (isDaily && item.dailyCharges) cMatch.dailyCharges = item.dailyCharges;
        }
      }
      if (Array.isArray(character.gearPool)) {
        const pMatch = character.gearPool.find(p => (targetPoolId && p.id === targetPoolId) || (p.name || '').toLowerCase().trim() === cleanName);
        if (pMatch) {
          if (!isDaily) pMatch.qty = item.qty;
          if (isDaily && item.dailyCharges) pMatch.dailyCharges = item.dailyCharges;
        }
      }

      // Kalan şarj metni
      const remainingInfo = isDaily 
        ? `Daily Remaining: ${item.dailyCharges.current}/${item.dailyCharges.max}` 
        : `Remaining Charges/Qty: ${item.qty}`;

      // 1. İYİLEŞME ZARI KONTROLÜ (Cure / Heal vb.)
      if (/cure|heal|iyileş/i.test(name)) {
        let diceCount = 1;
        let flatBonus = 1;
        let isHealSpell = false;

        if (/serious/i.test(name)) { diceCount = 3; flatBonus = 5; }
        else if (/moderate/i.test(name)) { diceCount = 2; flatBonus = 3; }
        else if (/critical/i.test(name)) { diceCount = 4; flatBonus = 7; }
        else if (/heal/i.test(name) && !/cure/i.test(name)) { isHealSpell = true; }

        if (isHealSpell) {
          // D&D 3.5e Heal Spell: 110 HP or full + Cure diseases, blindness, sickness, fatigue
          const healTotal = 110;
          const prevHp = character.hp.current;
          character.hp.current = Math.min(character.hp.max, character.hp.current + healTotal);
          const healCured = [];
          if (Array.isArray(character.buffs)) {
            character.buffs.forEach(b => {
              if (!b.active) return;
              const bName = (b.name || '').toLowerCase();
              if (bName.includes('sick') || bName.includes('nauseat') || bName.includes('blind') || bName.includes('deaf') || bName.includes('disease') || bName.includes('poison') || bName.includes('fatigue')) {
                b.active = false;
                b.durationText = 'Cured (Heal)';
                healCured.push(b.name);
              }
            });
          }
          saveStateToStorage(true);
          renderAll();
          const curedText = healCured.length > 0 ? ` • Cured Conditions: ${healCured.join(', ')}` : '';
          addDiceHistoryEntry({
            icon: '💖',
            title: `${name} (Heal & Cure)`,
            formula: '110 HP',
            breakdown: `Heal: +${healTotal} HP • HP: ${prevHp} ➔ ${character.hp.current}/${character.hp.max}${curedText} • ${remainingInfo}`,
            total: `+${healTotal} HP`
          });
          return;
        }

        const rolls = [];
        let sum = 0;
        for (let i = 0; i < diceCount; i++) {
          const val = Math.floor(Math.random() * 8) + 1;
          rolls.push({ type: 'd8', value: val });
          sum += val;
        }
        const healTotal = sum + flatBonus;

        const applyHealing = () => {
          const prevHp = character.hp.current;
          character.hp.current = Math.min(character.hp.max, character.hp.current + healTotal);
          saveStateToStorage(true);
          renderAll();
          addDiceHistoryEntry({
            icon: '💖',
            title: `${name}`,
            formula: `${diceCount}d8+${flatBonus}`,
            breakdown: `${diceCount}d8 [${rolls.map(r => r.value).join(' + ')}] + ${flatBonus} • HP: ${prevHp} ➔ ${character.hp.current}/${character.hp.max} • ${remainingInfo}`,
            total: `+${healTotal} HP`
          });
        };

        if (window.Dice3D && typeof Dice3D.roll === 'function') {
          try {
            Dice3D.roll(rolls, applyHealing);
          } catch (err) {
            applyHealing();
          }
        } else {
          applyHealing();
        }
        return;
      }

      // 2. SALDIRI / HASAR ASASI KONTROLÜ (Wand of Fireball, Magic Missile vb.)
      const damagePlan = parseDamageFromItem(name, item.effect || item.desc);
      if (damagePlan) {
        const rolls = [];
        let sum = 0;
        const dice3dList = [];

        for (let i = 0; i < damagePlan.diceCount; i++) {
          const val = Math.floor(Math.random() * damagePlan.diceSides) + 1;
          rolls.push(val);
          sum += val;
          if (dice3dList.length < 6 && [4, 6, 8, 10, 12, 20, 100].includes(damagePlan.diceSides)) {
            dice3dList.push({ type: 'd' + damagePlan.diceSides, value: val });
          }
        }
        const totalDamage = sum + (damagePlan.flatBonus || 0);

        const applyDamageRoll = () => {
          saveStateToStorage(true);
          renderAll();

          let breakdownText = '';
          if (damagePlan.isMagicMissile) {
            breakdownText = `${damagePlan.missiles} Missiles: [${rolls.map(v => `${v}+1`).join(' + ')}] = ${totalDamage} Force Damage • ${remainingInfo}`;
          } else {
            breakdownText = `${damagePlan.formula} [${rolls.join(' + ')}]${damagePlan.flatBonus ? ` + ${damagePlan.flatBonus}` : ''} = ${totalDamage} ${damagePlan.typeName}${damagePlan.saveDesc ? ` (${damagePlan.saveDesc})` : ''} • ${remainingInfo}`;
          }

          addDiceHistoryEntry({
            icon: damagePlan.icon,
            title: `${name} (Damage Roll)`,
            formula: damagePlan.formula,
            breakdown: breakdownText,
            total: `${totalDamage} Damage`
          });
        };

        if (window.Dice3D && typeof Dice3D.roll === 'function' && dice3dList.length > 0) {
          try {
            Dice3D.roll(dice3dList, applyDamageRoll);
          } catch (err) {
            applyDamageRoll();
          }
        } else {
          applyDamageRoll();
        }
        return;
      }

      // 3. D&D 3.5e RAW TEDAVİ / DEBUFF TEMİZLEME MOTORU (Restoration, Remove Curse/Disease/Blindness/Paralysis vb.)
      const cleanLower = (name || '').toLowerCase();
      const curedDebuffs = [];

      if (/restoration/i.test(cleanLower)) {
        const isLesser = /lesser\s+restoration/i.test(cleanLower);
        if (Array.isArray(character.buffs)) {
          character.buffs.forEach(b => {
            if (!b.active) return;
            const bName = (b.name || '').toLowerCase();
            const bNotes = (b.notes || '').toLowerCase();
            const isDrain = bName.includes('drain') || bName.includes('negative level') || bNotes.includes('negative level') || bNotes.includes('restoration gerektirir');
            const isFatigue = bName.includes('fatigue') || bName.includes('exhaust') || bName.includes('yorgun');
            
            if (isLesser) {
              if (isFatigue) {
                b.active = false;
                b.durationText = 'Cured (Lesser Restoration)';
                curedDebuffs.push(b.name);
              }
            } else {
              // Standard or Greater Restoration
              if (isDrain || isFatigue) {
                b.active = false;
                b.durationText = 'Cured (Restoration)';
                curedDebuffs.push(b.name);
              }
            }
          });
        }
      } else if (/remove\s*curse|break\s*enchantment/i.test(cleanLower)) {
        if (Array.isArray(character.buffs)) {
          character.buffs.forEach(b => {
            if (!b.active) return;
            const bName = (b.name || '').toLowerCase();
            if (bName.includes('curse') || bName.includes('lanet')) {
              b.active = false;
              b.durationText = 'Cured (Remove Curse)';
              curedDebuffs.push(b.name);
            }
          });
        }
      } else if (/remove\s*disease/i.test(cleanLower)) {
        if (Array.isArray(character.buffs)) {
          character.buffs.forEach(b => {
            if (!b.active) return;
            const bName = (b.name || '').toLowerCase();
            if (bName.includes('disease') || bName.includes('hastalık') || bName.includes('sickened') || bName.includes('nauseated')) {
              b.active = false;
              b.durationText = 'Cured (Remove Disease)';
              curedDebuffs.push(b.name);
            }
          });
        }
      } else if (/remove\s*blindness|remove\s*deafness/i.test(cleanLower)) {
        if (Array.isArray(character.buffs)) {
          character.buffs.forEach(b => {
            if (!b.active) return;
            const bName = (b.name || '').toLowerCase();
            if (bName.includes('blind') || bName.includes('deaf') || bName.includes('kör') || bName.includes('sağır')) {
              b.active = false;
              b.durationText = 'Cured (Remove Blindness/Deafness)';
              curedDebuffs.push(b.name);
            }
          });
        }
      } else if (/remove\s*paralysis/i.test(cleanLower)) {
        if (Array.isArray(character.buffs)) {
          character.buffs.forEach(b => {
            if (!b.active) return;
            const bName = (b.name || '').toLowerCase();
            if (bName.includes('paraly') || bName.includes('felç') || bName.includes('slow')) {
              b.active = false;
              b.durationText = 'Cured (Remove Paralysis)';
              curedDebuffs.push(b.name);
            }
          });
        }
      } else if (/neutralize\s*poison/i.test(cleanLower)) {
        if (Array.isArray(character.buffs)) {
          character.buffs.forEach(b => {
            if (!b.active) return;
            const bName = (b.name || '').toLowerCase();
            if (bName.includes('poison') || bName.includes('zehir')) {
              b.active = false;
              b.durationText = 'Cured (Neutralize Poison)';
              curedDebuffs.push(b.name);
            }
          });
        }
      }

      if (curedDebuffs.length > 0) {
        saveStateToStorage(true);
        renderAll();
        showDiceTopToast({
          icon: '✨',
          title: name,
          breakdown: `Cured: Removed "${curedDebuffs.join(', ')}" and all associated penalties! • ${remainingInfo}`,
          total: 'Cured'
        });
        addDiceHistoryEntry({
          icon: '✨',
          title: `${name} (Cure / Rule)`,
          formula: 'D&D 3.5e RAW',
          breakdown: `Used: ${name} • Cured Condition: ${curedDebuffs.join(', ')} • ${remainingInfo}`,
          total: 'Cured'
        });
        return;
      } else if (/restoration/i.test(cleanLower)) {
        saveStateToStorage(true);
        renderAll();
        showDiceTopToast({
          icon: 'ℹ️',
          title: name,
          breakdown: `Used, but no active Energy Drain or Negative Level condition was found on the character. • ${remainingInfo}`,
          total: 'No Effect'
        });
        return;
      }

      // 4. BUFF İKSİRİ VEYA DURUM KONTROLÜ
      let activatedBuff = null;
      if (Array.isArray(character.buffs)) {
        const match = character.buffs.find(b => {
          const bClean = (b.name || '').toLowerCase();
          return cleanLower.includes(bClean) || bClean.includes(cleanLower.replace(/potion of /i, '').replace(/iksir[iı]?/i, '').replace(/'s/g, '').trim());
        });
        if (match) {
          match.active = true;
          match.rounds = 30; // 30 tur
          activatedBuff = match.name;
        }
      }

      saveStateToStorage(true);
      renderAll();

      if (activatedBuff) {
        showDiceTopToast({
          icon: '🧪',
          title: name,
          breakdown: `Activated "${activatedBuff}" (+4 Ability Score, 30 rounds) • ${remainingInfo}`,
          total: 'Active'
        });
      } else if (isDaily) {
        showDiceTopToast({
          icon: '💍',
          title: name,
          breakdown: `Magic item property activated • ${remainingInfo}`,
          total: `${item.dailyCharges.current}/${item.dailyCharges.max}`
        });
      } else {
        showDiceTopToast({
          icon: '📦',
          title: name,
          breakdown: `Used • ${remainingInfo}`,
          total: '✔'
        });
      }
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
        alert('ℹ️ There are no custom entries to export in this character\'s Custom DB.');
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
            } else if (parsed.character && Array.isArray(parsed.character.customDb)) {
              entriesToMerge = parsed.character.customDb;
            } else if (parsed.name && parsed.type) {
              entriesToMerge = [parsed];
            }
          }

          if (entriesToMerge.length === 0) {
            alert('⚠️ No valid custom DB entries found in the selected JSON file.');
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
          alert('❌ Failed to parse Custom DB JSON file: ' + err.message);
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
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.character || parsed.masterDb)) {
            if (parsed.character) character = parsed.character;
            if (!Array.isArray(character.customDb)) {
              character.customDb = Array.isArray(parsed.masterDb) ? parsed.masterDb : [];
            }
            masterDb = character.customDb;
            alert(`✅ Full Bundle loaded successfully!\n• Character: ${character?.name || '-'}\n• Character Custom DB: ${masterDb.length} entries`);
          } else if (Array.isArray(parsed)) {
            const { added, updated } = mergeEntriesIntoCharacterCustomDb(parsed);
            alert(`✅ Custom DB entries merged into character!\n• Added: ${added}\n• Updated: ${updated}\n• Total Custom DB: ${masterDb.length} entries`);
          } else if (parsed.name || parsed.characterName || parsed.abilities) {
            character = parsed;
            if (!Array.isArray(character.customDb)) character.customDb = [];
            masterDb = character.customDb;
            alert('✅ Character data loaded successfully!');
          }
          saveStateToStorage(true);
          if (window.RuleMaster && typeof RuleMaster.renderTable === 'function') {
            RuleMaster.renderTable();
          }
          renderAll();
        } catch (err) {
          alert('❌ Failed to parse JSON file: ' + err.message);
        } finally {
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    }

    // User Requested Reset Feature
    function resetToCleanCharacter() {
      if (confirm('⚠️ Are you sure you want to reset the current character and start a fresh blank character?')) {
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
          weapons: [{ name: "Longsword", grip: "1-Hand", dice: "1d8", critMin: 19, critMult: 2, attBonus: 0, dmgBonus: 0, dmgType: "Slashing" }],
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
        alert('✅ Character reset. Your blank character is ready!');
      }
    }

    function resetAllLocalDataToFactoryDefaults() {
      const confirmed = confirm("⚠️ WARNING!\nAll local characters, saved profiles, Master DB cache, and temporary settings in your browser will be wiped and restored to factory defaults.\n\nAre you sure?");
      if (!confirmed) return;

      try {
        localStorage.clear();
      } catch (e) {
        console.warn('LocalStorage clear error:', e);
      }

      alert("✅ All local data reset to factory defaults! Reloading page...");
      window.location.reload();
    }
