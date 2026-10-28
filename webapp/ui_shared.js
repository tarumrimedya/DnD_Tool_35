/**
 * ============================================================================
 * D&D 3.5e Canonical V2 Shared UI Module (ui_shared.js)
 * Exports: window.DnDUI
 *
 * Responsibilities:
 * 1. Polyhedral SVG Dice Icons & Thematic Action Symbols (STRICT: ZERO U+1F3B2 EMOJI).
 * 2. V2 Card Badges: damageParts pills, modifiers pills, and passive tacticalBadges.
 * 3. Embedded `modes` Sub-Action Selector Pills for Combat, Spell, and Item cards.
 * 4. Tactical Condition & Action Restriction Warning Banner (`ruleFlags`).
 * 5. Unified 0ms Spotlight Combobox (`window.SrdCompendium` + `master_db`).
 * 6. Slide-Over SRD Compendium Drawer (3,522 V2 entries) & The Forge (Demirhane Lego Item Assembler).
 * ============================================================================
 */
(function (global) {
  'use strict';

  // ==========================================================================
  // 1. POLYHEDRAL SVG DICE ICONS & DAMAGE TYPE PALETTES (NO U+1F3B2 EMOJI)
  // ==========================================================================

  function getDiceIconSvg(dieType, classes = 'w-3.5 h-3.5 inline-block') {
    if (typeof global.getDiceIconSvg === 'function' && global.getDiceIconSvg !== getDiceIconSvg) {
      return global.getDiceIconSvg(dieType, classes);
    }
    const d = String(dieType || 'd20').toLowerCase().replace(/[^0-9]/g, '');
    const label = d || '20';
    if (label === '4') {
      return `<svg class="${classes}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="50,10 90,85 10,85" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><text x="50" y="72" text-anchor="middle" fill="currentColor" font-size="28" font-weight="900" font-family="system-ui, sans-serif">4</text></svg>`;
    }
    if (label === '6') {
      return `<svg class="${classes}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="16" width="68" height="68" rx="10" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="6"/><text x="50" y="61" text-anchor="middle" fill="currentColor" font-size="30" font-weight="900" font-family="system-ui, sans-serif">6</text></svg>`;
    }
    if (label === '8') {
      return `<svg class="${classes}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="50,8 88,50 50,92 12,50" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><text x="50" y="59" text-anchor="middle" fill="currentColor" font-size="28" font-weight="900" font-family="system-ui, sans-serif">8</text></svg>`;
    }
    if (label === '10' || label === '100') {
      return `<svg class="${classes}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="50,6 88,38 74,88 26,88 12,38" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><text x="50" y="60" text-anchor="middle" fill="currentColor" font-size="${label === '100' ? '22' : '26'}" font-weight="900" font-family="system-ui, sans-serif">${label}</text></svg>`;
    }
    if (label === '12') {
      return `<svg class="${classes}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="50,6 82,20 94,52 76,86 24,86 6,52 18,20" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><text x="50" y="60" text-anchor="middle" fill="currentColor" font-size="26" font-weight="900" font-family="system-ui, sans-serif">12</text></svg>`;
    }
    return `<svg class="${classes}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><polygon points="28,33 72,33 50,73" fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><text x="50" y="59" text-anchor="middle" fill="currentColor" font-size="24" font-weight="900" font-family="system-ui, sans-serif">20</text></svg>`;
  }

  function getFormulaDiceIconSvg(formula, classes = 'w-3.5 h-3.5 inline-block') {
    if (typeof global.getFormulaDiceIconSvg === 'function' && global.getFormulaDiceIconSvg !== getFormulaDiceIconSvg) {
      return global.getFormulaDiceIconSvg(formula, classes);
    }
    const m = String(formula || '').match(/d(4|6|8|100|10|12|20)/i);
    return getDiceIconSvg(m ? m[1] : '20', classes);
  }

  const DAMAGE_TYPE_STYLES = {
    slashing:    { icon: '⚔️', label: 'Slashing',    cls: 'bg-slate-800/90 text-slate-200 border-slate-600/70' },
    piercing:    { icon: '🗡️', label: 'Piercing',    cls: 'bg-slate-800/90 text-slate-200 border-slate-600/70' },
    bludgeoning: { icon: '🔨', label: 'Bludgeoning', cls: 'bg-slate-800/90 text-slate-200 border-slate-600/70' },
    physical:    { icon: '⚔️', label: 'Physical',    cls: 'bg-slate-800/90 text-slate-200 border-slate-600/70' },
    fire:        { icon: '🔥', label: 'Fire',        cls: 'bg-orange-950/80 text-orange-300 border-orange-600/60' },
    cold:        { icon: '❄️', label: 'Cold',        cls: 'bg-cyan-950/80 text-cyan-300 border-cyan-600/60' },
    electricity: { icon: '⚡', label: 'Electricity', cls: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/60' },
    acid:        { icon: '🧪', label: 'Acid',        cls: 'bg-lime-950/80 text-lime-300 border-lime-600/60' },
    sonic:       { icon: '🔊', label: 'Sonic',       cls: 'bg-teal-950/80 text-teal-300 border-teal-600/60' },
    force:       { icon: '✨', label: 'Force',       cls: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/60' },
    holy:        { icon: '☀️', label: 'Holy/Good',   cls: 'bg-amber-950/80 text-amber-200 border-amber-500/60' },
    good:        { icon: '☀️', label: 'Good',        cls: 'bg-amber-950/80 text-amber-200 border-amber-500/60' },
    sacred:      { icon: '☀️', label: 'Sacred',      cls: 'bg-amber-950/80 text-amber-200 border-amber-500/60' },
    positive:    { icon: '💚', label: 'Positive',    cls: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60' },
    unholy:      { icon: '💀', label: 'Unholy/Evil', cls: 'bg-rose-950/80 text-rose-300 border-rose-600/60' },
    evil:        { icon: '💀', label: 'Evil',        cls: 'bg-rose-950/80 text-rose-300 border-rose-600/60' },
    vile:        { icon: '🩸', label: 'Vile',        cls: 'bg-rose-950/90 text-rose-200 border-rose-500/70' },
    negative:    { icon: '💀', label: 'Negative',    cls: 'bg-purple-950/80 text-purple-300 border-purple-600/60' },
    precision:   { icon: '🎯', label: 'Precision',   cls: 'bg-pink-950/80 text-pink-300 border-pink-600/60' },
    axiomatic:   { icon: '⚖️', label: 'Lawful',      cls: 'bg-sky-950/80 text-sky-300 border-sky-600/60' },
    anarchic:    { icon: '🌀', label: 'Chaotic',     cls: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-600/60' },
    untyped:     { icon: '⚡', label: 'Damage',      cls: 'bg-slate-800/80 text-amber-300 border-amber-600/50' }
  };

  function getDamageTypeStyle(typeStr) {
    const key = String(typeStr || 'physical').toLowerCase().trim();
    if (DAMAGE_TYPE_STYLES[key]) return DAMAGE_TYPE_STYLES[key];
    for (const [k, val] of Object.entries(DAMAGE_TYPE_STYLES)) {
      if (key.includes(k)) return val;
    }
    return { icon: '⚔️', label: typeStr || 'Physical', cls: 'bg-slate-800/90 text-slate-200 border-slate-600/70' };
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ==========================================================================
  // 2. V2 CARD BADGES: DAMAGE PARTS, MODIFIERS & PASSIVE TACTICAL BADGES
  // ==========================================================================

  /**
   * Renders structured V2 `damageParts` array as color-coded RPG pills with SVG dice icons.
   * @param {Array} damageParts - Array of { dice, bonus, type, multiplyOnCrit, onCritOnly, source }
   * @param {Object} options - { compact: boolean, showSource: boolean }
   */
  function renderDamagePartsBadges(damageParts, options = {}) {
    if (!Array.isArray(damageParts) || damageParts.length === 0) return '';
    const compact = Boolean(options.compact);
    const showSource = Boolean(options.showSource);

    return damageParts.map((part) => {
      if (!part) return '';
      const dice = String(part.dice || part.formula || '').trim();
      const bonus = Number(part.bonus) || 0;
      if (!dice && bonus === 0) return '';

      const style = getDamageTypeStyle(part.type);
      const dieSvg = dice ? getFormulaDiceIconSvg(dice, compact ? 'w-3 h-3 inline-block' : 'w-3.5 h-3.5 inline-block') : '';
      const bonusStr = bonus > 0 ? (dice ? `+${bonus}` : `+${bonus}`) : (bonus < 0 ? `${bonus}` : '');
      const formulaDisplay = `${dice}${bonusStr}`;
      const critTag = part.onCritOnly
        ? `<span class="ml-0.5 px-1 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black" title="Sadece Kritik İsabetlerde Patlar (Burst)">⚡CRIT</span>`
        : (part.multiplyOnCrit ? `<span class="opacity-70 text-[9px]" title="Kritikte Çarpılır">×Krit</span>` : '');
      const srcTag = showSource && part.source ? `<span class="opacity-65 text-[9px]">(${escapeHtml(part.source)})</span>` : '';

      const sizeCls = compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
      return `<span class="inline-flex items-center gap-1 rounded-md border font-mono font-bold ${sizeCls} ${style.cls}" title="${escapeHtml((part.source ? part.source + ' • ' : '') + (part.type || 'Physical'))}">${dieSvg}<span>${escapeHtml(formulaDisplay)}</span><span class="font-sans font-semibold opacity-90">${escapeHtml(style.label)}</span>${critTag}${srcTag}</span>`;
    }).filter(Boolean).join(' ');
  }

  /**
   * Renders V2 `modifiers` array as compact typed bonus badges.
   * @param {Array} modifiers - Array of { target, value, formula, type, condition }
   */
  function renderModifiersBadges(modifiers, options = {}) {
    if (!Array.isArray(modifiers) || modifiers.length === 0) return '';
    const compact = Boolean(options.compact);
    const sizeCls = compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

    const TARGET_LABELS = {
      str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
      ac: 'AC', touchAc: 'Touch AC', flatFootedAc: 'Flat-Footed AC',
      attack: 'Attack', meleeAttack: 'Melee Atk', rangedAttack: 'Ranged Atk',
      damage: 'Damage', meleeDamage: 'Melee Dmg', rangedDamage: 'Ranged Dmg',
      fort: 'Fort', ref: 'Ref', will: 'Will', allSaves: 'All Saves',
      initiative: 'Init', speed: 'Speed', hp: 'HP', tempHp: 'Temp HP',
      casterLevel: 'CL', spellDc: 'Spell DC', grapple: 'Grapple',
      acp: 'ACP', maxDex: 'Max DEX', dr: 'DR', sr: 'SR', allSkills: 'All Skills'
    };

    return modifiers.map((mod) => {
      if (!mod || !mod.target) return '';
      const rawTarget = String(mod.target);
      const tLabel = rawTarget.startsWith('skill.')
        ? rawTarget.slice(6).replace(/_/g, ' ').toUpperCase()
        : (TARGET_LABELS[rawTarget] || rawTarget.toUpperCase());

      let valDisplay = '';
      if (mod.formula) {
        valDisplay = String(mod.formula);
      } else {
        const v = Number(mod.value) || 0;
        if (v === 0) return '';
        valDisplay = v > 0 ? `+${v}` : `${v}`;
      }

      const typeStr = mod.type && mod.type !== 'Untyped' ? ` (${mod.type})` : '';
      const condStr = mod.condition ? ` [${mod.condition}]` : '';
      const isPenalty = String(valDisplay).startsWith('-');
      const colorCls = isPenalty
        ? 'bg-rose-950/70 text-rose-300 border-rose-700/60'
        : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';

      return `<span class="inline-flex items-center gap-1 rounded-md border font-mono font-bold ${sizeCls} ${colorCls}" title="${escapeHtml(tLabel + ' ' + valDisplay + typeStr + condStr)}"><span>${escapeHtml(valDisplay)} ${escapeHtml(tLabel)}</span><span class="font-sans font-normal opacity-80 text-[9px]">${escapeHtml(typeStr)}</span></span>`;
    }).filter(Boolean).join(' ');
  }

  /**
   * Renders passive tactical badges & ruleFlags on weapons/armors/items/feats.
   */
  function renderTacticalBadges(entry, options = {}) {
    if (!entry || typeof entry !== 'object') return '';
    const badges = [];
    const rf = entry.ruleFlags || {};

    if (rf.keen) {
      badges.push({ icon: '⚡', text: 'Keen (2× Crit Range)', cls: 'bg-amber-950/80 text-amber-300 border-amber-500/60' });
    }
    if (Array.isArray(rf.bypassDR) && rf.bypassDR.length > 0) {
      badges.push({ icon: '🛡️', text: `Bypass DR/${rf.bypassDR.join(',')}`, cls: 'bg-sky-950/80 text-sky-300 border-sky-500/60' });
    }
    if (rf.lightArmorCategory) {
      badges.push({ icon: '🪶', text: 'Mithral (-1 Armor Cat)', cls: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60' });
    }
    if (rf.ghostTouch) {
      badges.push({ icon: '👻', text: 'Ghost Touch', cls: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/60' });
    }
    if (Array.isArray(entry.tacticalBadges)) {
      entry.tacticalBadges.forEach(tb => {
        if (!tb) return;
        const label = typeof tb === 'string' ? tb : (tb.label || tb.name || '');
        if (!label) return;
        if (!badges.some(b => b.text.toLowerCase() === label.toLowerCase())) {
          badges.push({ icon: '🛡️', text: label, cls: 'bg-purple-950/70 text-purple-200 border-purple-600/50' });
        }
      });
    }

    if (badges.length === 0) return '';
    const sizeCls = options.compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]';
    return badges.map(b =>
      `<span class="inline-flex items-center gap-1 rounded-md border font-semibold ${sizeCls} ${b.cls}"><span>${b.icon}</span><span>${escapeHtml(b.text)}</span></span>`
    ).join(' ');
  }

  // ==========================================================================
  // 3. EMBEDDED `modes` SUB-ACTION SELECTOR PILLS (NO `isChild` ROWS)
  // ==========================================================================

  /**
   * Renders interactive mode switcher pills for weapons, spells, feats, or magic items
   * that contain embedded `modes: [{ id, label, actionType, damageParts, modifiers, save, costHp }]`.
   *
   * @param {Object} entry - The V2 item/weapon/spell entry
   * @param {string} activeModeId - Currently selected mode id (defaults to entry.activeModeId or modes[0].id)
   * @param {string} onSelectJsTemplate - JS expression template where `__MODE_ID__` is replaced with mode.id
   */
  function renderModesPills(entry, activeModeId, onSelectJsTemplate) {
    if (!entry || !Array.isArray(entry.modes) || entry.modes.length === 0) return '';
    const currentId = activeModeId || entry.activeModeId || entry.modes[0].id;

    const pillsHtml = entry.modes.map((mode) => {
      if (!mode || !mode.id) return '';
      const isSelected = mode.id === currentId;
      const label = mode.label || mode.name || mode.id;
      const costHpBadge = mode.costHp ? ` <span class="text-rose-300 font-mono">(-${mode.costHp}🩸)</span>` : '';
      const dmgPreview = Array.isArray(mode.damageParts) && mode.damageParts.length > 0
        ? ` <span class="opacity-80 font-mono text-[9px]">[${mode.damageParts.map(p => p.dice || (p.bonus > 0 ? '+' + p.bonus : p.bonus)).filter(Boolean).join('+')}]</span>`
        : '';

      const clickAttr = onSelectJsTemplate
        ? `onclick="${onSelectJsTemplate.replace(/__MODE_ID__/g, String(mode.id).replace(/'/g, "\\'"))}"`
        : '';

      const cls = isSelected
        ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-sm ring-1 ring-amber-400/30'
        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-700/80 hover:border-slate-600';

      return `<button type="button" ${clickAttr} class="px-2 py-0.5 rounded-md border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer select-none ${cls}" title="${escapeHtml(mode.description || label)}"><span>⚡</span><span>${escapeHtml(label)}</span>${dmgPreview}${costHpBadge}</button>`;
    }).filter(Boolean).join('');

    return `<div class="flex flex-wrap items-center gap-1 pt-1">${pillsHtml}</div>`;
  }

  // ==========================================================================
  // 4. TACTICAL CONDITION & ACTION RESTRICTION WARNING BANNER
  // ==========================================================================

  /**
   * Generates HTML for the non-blocking Tactical Condition Warning Banner when active conditions
   * impose `actionRestriction`, `loseDexToAC`, `effectiveDexZero`, or `halfSpeed`.
   */
  function getConditionWarningBannerHtml(character) {
    if (!character || typeof global.RuleEngine === 'undefined' || typeof global.RuleEngine.evaluateConditionFlags !== 'function') {
      return '';
    }
    const flags = global.RuleEngine.evaluateConditionFlags(character);
    if (!flags) return '';

    const alerts = [];
    if (flags.effectiveDexZero) {
      alerts.push({ icon: '🛑', text: 'Efektif DEX 0 (Felç / Çaresiz — Yakın dövüş darbe rulolarına +4, Coup de Grace riski!)', severity: 'rose' });
    } else if (flags.loseDexToAC) {
      alerts.push({ icon: '⚠️', text: 'AC\'ye DEX Bonusu Kaybedildi (Flat-Footed / Sneak Attack\'a Açık!)', severity: 'amber' });
    }
    if (Array.isArray(flags.actionRestrictions) && flags.actionRestrictions.length > 0) {
      flags.actionRestrictions.forEach(r => {
        alerts.push({ icon: '⛓️', text: `${r.source}: ${r.restriction}`, severity: 'rose' });
      });
    }
    if (flags.halfSpeed) {
      alerts.push({ icon: '🦶', text: 'Hareket Hızı Yarıya İndi (×0.5 Hız / Koşma & Hücum Kısıtlı)', severity: 'amber' });
    }
    if (Array.isArray(flags.tacticalNotes) && flags.tacticalNotes.length > 0) {
      flags.tacticalNotes.forEach(n => {
        if (!alerts.some(a => a.text.includes(n))) {
          alerts.push({ icon: '📌', text: n, severity: 'indigo' });
        }
      });
    }

    if (alerts.length === 0) return '';

    const itemsHtml = alerts.map(a => {
      const pillCls = a.severity === 'rose'
        ? 'bg-rose-950/90 text-rose-200 border-rose-500/70'
        : (a.severity === 'amber' ? 'bg-amber-950/90 text-amber-200 border-amber-500/70' : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/70');
      return `<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shadow-sm ${pillCls}"><span>${a.icon}</span><span>${escapeHtml(a.text)}</span></div>`;
    }).join('');

    return `
      <div class="w-full bg-gradient-to-r from-rose-950/80 via-slate-900/95 to-amber-950/80 border border-rose-500/50 rounded-xl p-2.5 mb-3 shadow-lg flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-base animate-pulse">⚠️</span>
          <span class="text-xs font-black uppercase tracking-wider text-rose-300">Taktiksel Durum Uyarısı:</span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 flex-1">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  function renderConditionWarningBanner(character, containerId) {
    const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!el) return;
    const html = getConditionWarningBannerHtml(character);
    if (html) {
      el.innerHTML = html;
      el.classList.remove('hidden');
    } else {
      el.innerHTML = '';
      el.classList.add('hidden');
    }
  }

  // ==========================================================================
  // 5. UNIFIED 0ms SPOTLIGHT COMBOBOX (`attachSpotlightCombobox`)
  // ==========================================================================

  /**
   * Attaches a 0ms zero-token typeahead spotlight dropdown to an input element.
   * Queries `window.SrdCompendium.search()` and `window.RuleMaster` local DB.
   *
   * @param {HTMLElement|string} inputElOrId
   * @param {Object} options - { category, subCategory, limit, onSelect(entry), placeholder }
   */
  function attachSpotlightCombobox(inputElOrId, options = {}) {
    const inputEl = typeof inputElOrId === 'string' ? document.getElementById(inputElOrId) : inputElOrId;
    if (!inputEl || inputEl._dndSpotlightAttached) return;
    inputEl._dndSpotlightAttached = true;

    const dropdown = document.createElement('div');
    dropdown.className = 'hidden fixed z-[9999] bg-slate-950/95 backdrop-blur-md border border-indigo-500/60 rounded-xl shadow-2xl overflow-y-auto max-h-72 divide-y divide-slate-800/80 text-xs';
    document.body.appendChild(dropdown);

    let activeResults = [];
    let selectedIdx = 0;

    function positionDropdown() {
      const rect = inputEl.getBoundingClientRect();
      dropdown.style.left = `${Math.max(8, rect.left)}px`;
      dropdown.style.top = `${rect.bottom + 4}px`;
      dropdown.style.width = `${Math.max(280, rect.width)}px`;
    }

    function closeDropdown() {
      dropdown.classList.add('hidden');
      activeResults = [];
    }

    async function runSearch(query) {
      const q = String(query || '').trim();
      if (q.length < 2) {
        closeDropdown();
        return;
      }

      let results = [];
      // 1. Check natural language Lego item assembly first if Equipment/Weapon/Armor
      if (global.ItemAssembler && typeof global.ItemAssembler.parseNaturalLanguageItem === 'function') {
        const assembled = global.ItemAssembler.parseNaturalLanguageItem(q);
        if (assembled) {
          results.push(Object.assign({}, assembled, { _isAssembledLego: true }));
        }
      }

      // 2. Query SrdCompendium
      if (global.SrdCompendium && typeof global.SrdCompendium.search === 'function') {
        const filters = {
          limit: options.limit || 12
        };
        if (options.category) filters.category = options.category;
        if (options.subCategory) filters.subCategory = options.subCategory;
        const found = await global.SrdCompendium.search(q, filters);
        if (Array.isArray(found)) {
          results = results.concat(found);
        }
      }

      if (results.length === 0) {
        closeDropdown();
        return;
      }

      activeResults = results.slice(0, options.limit || 12);
      selectedIdx = 0;
      renderDropdownItems();
    }

    function renderDropdownItems() {
      if (activeResults.length === 0) {
        closeDropdown();
        return;
      }
      positionDropdown();
      dropdown.innerHTML = activeResults.map((item, idx) => {
        const isSel = idx === selectedIdx;
        const catLabel = item._isAssembledLego ? '⚒️ Lego Montaj' : (item.subCategory || item.category || 'SRD');
        const fullEntry = (!item._isAssembledLego && global.SrdCompendium && typeof global.SrdCompendium.getById === 'function')
          ? (global.SrdCompendium.getById(item.id) || item)
          : item;

        const dmgHtml = renderDamagePartsBadges(fullEntry.damageParts, { compact: true });
        const modHtml = renderModifiersBadges(fullEntry.modifiers, { compact: true });

        return `
          <div data-idx="${idx}" class="p-2.5 cursor-pointer transition flex flex-col gap-1 ${isSel ? 'bg-indigo-950/90 text-white' : 'hover:bg-slate-900 text-slate-200'}">
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-xs text-amber-300 truncate">${escapeHtml(fullEntry.name)}</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono text-indigo-300 shrink-0">${escapeHtml(catLabel)}</span>
            </div>
            ${(dmgHtml || modHtml) ? `<div class="flex flex-wrap gap-1">${dmgHtml} ${modHtml}</div>` : ''}
            ${fullEntry.shortDescription ? `<div class="text-[10px] text-slate-400 line-clamp-1">${escapeHtml(fullEntry.shortDescription)}</div>` : ''}
          </div>
        `;
      }).join('');

      dropdown.querySelectorAll('[data-idx]').forEach(row => {
        row.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const i = Number(row.getAttribute('data-idx')) || 0;
          pickResult(i);
        });
      });

      dropdown.classList.remove('hidden');
    }

    async function pickResult(idx) {
      const picked = activeResults[idx];
      if (!picked) return;
      closeDropdown();

      let fullEntry = picked;
      if (!picked._isAssembledLego && global.SrdCompendium) {
        if (picked.category === 'Spell' || picked.category === 'Power') {
          fullEntry = await global.SrdCompendium.getSpellById(picked.id) || picked;
        } else if (picked.category === 'Monster') {
          fullEntry = await global.SrdCompendium.getMonsterById(picked.id) || picked;
        } else {
          fullEntry = global.SrdCompendium.getById(picked.id) || picked;
        }
      }

      if (typeof options.onSelect === 'function') {
        options.onSelect(fullEntry);
      } else {
        inputEl.value = fullEntry.name || '';
      }
    }

    inputEl.addEventListener('input', () => {
      runSearch(inputEl.value);
    });

    inputEl.addEventListener('keydown', (e) => {
      if (dropdown.classList.contains('hidden') || activeResults.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx = (selectedIdx + 1) % activeResults.length;
        renderDropdownItems();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx = (selectedIdx - 1 + activeResults.length) % activeResults.length;
        renderDropdownItems();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        pickResult(selectedIdx);
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });

    inputEl.addEventListener('blur', () => {
      setTimeout(closeDropdown, 180);
    });
  }

  // ==========================================================================
  // 6. SLIDE-OVER SRD COMPENDIUM DRAWER & THE FORGE (DEMIRHANE LEGO UI)
  // ==========================================================================

  let _drawerState = {
    isOpen: false,
    activeTab: 'all', // 'all' | 'Weapon' | 'Armor' | 'Feat' | 'Spell' | 'Condition' | 'Monster' | 'forge'
    query: '',
    results: [],
    selectedEntry: null,
    onEquipCallback: null,
    forgeConfig: {
      naturalText: '',
      baseItemId: 'longsword',
      materialId: 'none',
      enhancementBonus: 1,
      enhancements: []
    }
  };

  function ensureCompendiumDrawerDom() {
    if (document.getElementById('dnd-ui-compendium-drawer')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'dnd-ui-compendium-drawer';
    wrapper.className = 'fixed inset-0 z-[9000] hidden';
    wrapper.innerHTML = `
      <!-- Backdrop -->
      <div onclick="DnDUI.closeCompendiumDrawer()" class="absolute inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"></div>

      <!-- Right Slide-Over Panel -->
      <div class="absolute right-0 top-0 bottom-0 w-full max-w-3xl bg-[#111a2e] border-l border-indigo-500/40 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        <!-- Header -->
        <div class="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-amber-400 font-bold">📚</span>
            <div>
              <h3 class="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>D&D 3.5e V2 Kütüphanesi &amp; Demirhane</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-mono">3,522 SRD Kaydı • 0 Token</span>
              </h3>
              <p class="text-[11px] text-slate-400">Anlık Kanonik V2 Arama, Büyü/Yetenek İnceleme ve Lego Eşya Montajı</p>
            </div>
          </div>
          <button type="button" onclick="DnDUI.closeCompendiumDrawer()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer">✕ Kapat</button>
        </div>

        <!-- Category Tabs -->
        <div class="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs">
          <button type="button" data-comp-tab="all" onclick="DnDUI.switchCompendiumTab('all')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer bg-indigo-600 text-white">🌐 Tümü</button>
          <button type="button" data-comp-tab="Weapon" onclick="DnDUI.switchCompendiumTab('Weapon')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-slate-400 hover:text-white">⚔️ Silahlar</button>
          <button type="button" data-comp-tab="Armor" onclick="DnDUI.switchCompendiumTab('Armor')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-slate-400 hover:text-white">🛡️ Zırh &amp; Eşya</button>
          <button type="button" data-comp-tab="Feat" onclick="DnDUI.switchCompendiumTab('Feat')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-slate-400 hover:text-white">🏅 Feat &amp; Manevra</button>
          <button type="button" data-comp-tab="Spell" onclick="DnDUI.switchCompendiumTab('Spell')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-slate-400 hover:text-white">🔮 Büyü &amp; Psionik</button>
          <button type="button" data-comp-tab="Condition" onclick="DnDUI.switchCompendiumTab('Condition')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-slate-400 hover:text-white">⚡ Durum &amp; Buff</button>
          <button type="button" data-comp-tab="Monster" onclick="DnDUI.switchCompendiumTab('Monster')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-slate-400 hover:text-white">👹 Bestiary (645)</button>
          <button type="button" data-comp-tab="forge" onclick="DnDUI.switchCompendiumTab('forge')" class="px-3 py-1 rounded-lg font-black transition cursor-pointer bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500 hover:text-slate-950 ml-auto shrink-0">⚒️ Demirhane (Lego Eşya)</button>
        </div>

        <!-- VIEW 1: COMPENDIUM SEARCH & INSPECTOR -->
        <div id="dnd-ui-compendium-search-view" class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <!-- Search Bar -->
          <div class="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 shrink-0">
            <span class="text-slate-400 text-sm">🔍</span>
            <input type="text" id="dnd-ui-compendium-input" oninput="DnDUI.onCompendiumSearchInput(this.value)" placeholder="SRD V2 Kütüphanesinde ara (Örn: Greatsword, Power Attack, Fireball, Haste, Balor, +2 Keen Scimitar)..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono">
          </div>

          <!-- Split Pane: Left Results, Right V2 Detail Card -->
          <div class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
            <div id="dnd-ui-compendium-list" class="md:col-span-5 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/40"></div>
            <div id="dnd-ui-compendium-detail" class="md:col-span-7 overflow-y-auto p-4 space-y-3 bg-[#131d33]"></div>
          </div>
        </div>

        <!-- VIEW 2: THE FORGE (DEMIRHANE LEGO ITEM ASSEMBLER) -->
        <div id="dnd-ui-compendium-forge-view" class="hidden flex-1 overflow-y-auto p-4 space-y-4 bg-[#131d33] text-xs">
          <div class="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <h4 class="text-sm font-black text-amber-300 flex items-center gap-2">
                  <span>⚒️</span>
                  <span>Demirhane — Kanonik V2 Lego Eşya Birleştirici</span>
                </h4>
                <p class="text-[11px] text-slate-400">Temel silah/zırh, özel materyal (Mithral, Adamantine vb.), +1..+5 geliştirme ve sihirli özellikleri sıfır token ile birleştirin.</p>
              </div>
            </div>

            <!-- Fast Natural Language Input -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-indigo-300">⚡ Doğal Dil ile Hızlı Montaj (İsteğe Bağlı):</label>
              <div class="flex items-center gap-2">
                <input type="text" id="dnd-forge-nl-input" oninput="DnDUI.onForgeNaturalLanguageInput(this.value)" placeholder="Örn: +2 Keen Mithral Scimitar, +3 Flaming Burst Adamantine Greatsword..." class="flex-1 bg-slate-950 border border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400">
              </div>
            </div>

            <!-- Structured Pickers -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label class="block text-slate-400 mb-1 font-semibold">1. Temel Eşya (Silah / Zırh)</label>
                <select id="dnd-forge-base-select" onchange="DnDUI.updateForgePreview()" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"></select>
              </div>
              <div>
                <label class="block text-slate-400 mb-1 font-semibold">2. Özel Materyal</label>
                <select id="dnd-forge-material-select" onchange="DnDUI.updateForgePreview()" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400">
                  <option value="">Standart (Çelik / Deri / Ahşap)</option>
                  <option value="material_mithral">Mithral (Hafif / -ACP / +Max DEX)</option>
                  <option value="material_adamantine">Adamantine (Bypass DR 20 / Zırh DR)</option>
                  <option value="material_cold_iron">Cold Iron (Fey/Demon DR Bypass)</option>
                  <option value="material_alchemical_silver">Alchemical Silver (Lycanthrope/Devil DR)</option>
                  <option value="material_darkwood">Darkwood (Yarı Ağırlık Ahşap)</option>
                  <option value="material_dragonhide">Dragonhide (Druid Uyumlu Ejder Derisi)</option>
                </select>
              </div>
              <div>
                <label class="block text-slate-400 mb-1 font-semibold">3. Geliştirme Bonusu (Enhancement)</label>
                <select id="dnd-forge-enh-bonus" onchange="DnDUI.updateForgePreview()" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-amber-300 font-bold font-mono focus:outline-none focus:border-amber-400">
                  <option value="0">Masterwork / Normal (+0)</option>
                  <option value="1" selected>+1 Enhancement</option>
                  <option value="2">+2 Enhancement</option>
                  <option value="3">+3 Enhancement</option>
                  <option value="4">+4 Enhancement</option>
                  <option value="5">+5 Enhancement (Epic Sınırı)</option>
                </select>
              </div>
            </div>

            <!-- Special Abilities Checkboxes -->
            <div class="space-y-1.5 pt-2">
              <label class="block text-slate-400 font-semibold">4. Sihirli Silah / Zırh Özellikleri (Special Abilities):</label>
              <div id="dnd-forge-enhancements-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-44 overflow-y-auto p-1 custom-scroll">
                <!-- Populated dynamically -->
              </div>
            </div>
          </div>

          <!-- Live Assembled V2 Item Preview Card -->
          <div id="dnd-forge-preview-card" class="bg-slate-950/90 border border-indigo-500/50 rounded-2xl p-4 space-y-3 shadow-xl"></div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);
    populateForgeControls();
  }

  function populateForgeControls() {
    const baseSel = document.getElementById('dnd-forge-base-select');
    const enhGrid = document.getElementById('dnd-forge-enhancements-grid');
    if (!baseSel || !enhGrid) return;

    // Populate base weapons and armors from SrdCompendium if loaded
    let baseOptions = [];
    if (global.SrdCompendium && global.SrdCompendium.isReady()) {
      const allEquip = global.SrdCompendium.getAllEquipment();
      baseOptions = allEquip.filter(e =>
        (e.category === 'Weapon' || e.category === 'Armor' || e.subCategory === 'Weapon' || e.subCategory === 'Armor' || e.subCategory === 'Shield') &&
        e.subCategory !== 'Material' && e.subCategory !== 'Enhancement'
      );
    }

    if (baseOptions.length === 0) {
      baseOptions = [
        { id: 'longsword', name: 'Longsword (1d8, 19-20/x2)', subCategory: 'Weapon' },
        { id: 'greatsword', name: 'Greatsword (2d6, 19-20/x2)', subCategory: 'Weapon' },
        { id: 'scimitar', name: 'Scimitar (1d6, 18-20/x2)', subCategory: 'Weapon' },
        { id: 'rapier', name: 'Rapier (1d6, 18-20/x2)', subCategory: 'Weapon' },
        { id: 'greataxe', name: 'Greataxe (1d12, x3)', subCategory: 'Weapon' },
        { id: 'warhammer', name: 'Warhammer (1d8, x3)', subCategory: 'Weapon' },
        { id: 'dagger', name: 'Dagger (1d4, 19-20/x2)', subCategory: 'Weapon' },
        { id: 'composite_longbow', name: 'Composite Longbow (1d8, x3)', subCategory: 'Weapon' },
        { id: 'chain_shirt', name: 'Chain Shirt (+4 AC)', subCategory: 'Armor' },
        { id: 'breastplate', name: 'Breastplate (+5 AC)', subCategory: 'Armor' },
        { id: 'full_plate', name: 'Full Plate (+8 AC)', subCategory: 'Armor' },
        { id: 'heavy_steel_shield', name: 'Heavy Steel Shield (+2 AC)', subCategory: 'Shield' }
      ];
    }

    baseSel.innerHTML = baseOptions.slice(0, 120).map(item =>
      `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} (${escapeHtml(item.subCategory || item.category)})</option>`
    ).join('');

    const ENH_LIST = [
      { id: 'enh_keen', label: '⚡ Keen (2× Crit)', bonusEq: '+1' },
      { id: 'enh_flaming', label: '🔥 Flaming (+1d6)', bonusEq: '+1' },
      { id: 'enh_flaming_burst', label: '🔥 Flaming Burst', bonusEq: '+2' },
      { id: 'enh_frost', label: '❄️ Frost (+1d6)', bonusEq: '+1' },
      { id: 'enh_icy_burst', label: '❄️ Icy Burst', bonusEq: '+2' },
      { id: 'enh_shock', label: '⚡ Shock (+1d6)', bonusEq: '+1' },
      { id: 'enh_shocking_burst', label: '⚡ Shocking Burst', bonusEq: '+2' },
      { id: 'enh_corrosive', label: '🧪 Acidic (+1d6)', bonusEq: '+1' },
      { id: 'enh_holy', label: '☀️ Holy (+2d6 vs Evil)', bonusEq: '+2' },
      { id: 'enh_unholy', label: '💀 Unholy (+2d6 vs Good)', bonusEq: '+2' },
      { id: 'enh_ghost_touch', label: '👻 Ghost Touch', bonusEq: '+1' },
      { id: 'enh_speed', label: '⚡ Speed (+1 Atk)', bonusEq: '+3' },
      { id: 'enh_vorpal', label: '🗡️ Vorpal (Nat 20)', bonusEq: '+5' },
      { id: 'enh_wounding', label: '🩸 Wounding (1 CON)', bonusEq: '+2' },
      { id: 'enh_fortification_light', label: '🛡️ Fortification 25%', bonusEq: '+1' },
      { id: 'enh_fortification_moderate', label: '🛡️ Fortification 75%', bonusEq: '+3' },
      { id: 'enh_animated', label: '🛡️ Animated Shield', bonusEq: '+2' }
    ];

    enhGrid.innerHTML = ENH_LIST.map(e => `
      <label class="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer select-none">
        <input type="checkbox" value="${e.id}" onchange="DnDUI.updateForgePreview()" class="dnd-forge-enh-chk rounded text-amber-500 bg-slate-900 border-slate-700">
        <span class="text-[11px] font-semibold text-slate-200 truncate">${e.label}</span>
        <span class="text-[9px] font-mono text-amber-400 ml-auto">${e.bonusEq}</span>
      </label>
    `).join('');
  }

  function getSelectedForgeItem() {
    if (!global.ItemAssembler) return null;
    const nlInput = document.getElementById('dnd-forge-nl-input');
    const nlVal = (nlInput && nlInput.value || '').trim();
    if (nlVal.length >= 4) {
      const parsed = global.ItemAssembler.parseNaturalLanguageItem(nlVal);
      if (parsed) return parsed;
    }

    const baseId = document.getElementById('dnd-forge-base-select')?.value || 'longsword';
    const matId = document.getElementById('dnd-forge-material-select')?.value || '';
    const enhBonus = Number(document.getElementById('dnd-forge-enh-bonus')?.value) || 0;
    const checkedEnhs = Array.from(document.querySelectorAll('.dnd-forge-enh-chk:checked')).map(el => el.value);

    return global.ItemAssembler.assembleItem({
      baseItemId: baseId,
      material: matId || null,
      enhancementBonus: enhBonus,
      enhancements: checkedEnhs,
      masterwork: enhBonus > 0 || Boolean(matId)
    });
  }

  function onForgeNaturalLanguageInput(val) {
    updateForgePreview();
  }

  function updateForgePreview() {
    const container = document.getElementById('dnd-forge-preview-card');
    if (!container) return;

    const item = getSelectedForgeItem();
    if (!item) {
      container.innerHTML = `<div class="text-slate-500 italic p-4 text-center">Önizleme için temel eşya seçin.</div>`;
      return;
    }

    const dmgBadges = renderDamagePartsBadges(item.damageParts);
    const modBadges = renderModifiersBadges(item.modifiers);
    const tacBadges = renderTacticalBadges(item);
    const modesHtml = renderModesPills(item, item.activeModeId, '');

    container.innerHTML = `
      <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">V2 LEGO EŞYA</span>
            <span class="text-[11px] font-mono text-slate-400">ID: ${escapeHtml(item.id)}</span>
          </div>
          <h4 class="text-base font-black text-white mt-1">${escapeHtml(item.name)}</h4>
        </div>
        <div class="flex items-center gap-3 text-right">
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-bold">Piyasa Değeri</div>
            <div class="text-sm font-black font-mono text-amber-400">${Number(item.priceGp || 0).toLocaleString('tr-TR')} gp</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-bold">Ağırlık</div>
            <div class="text-sm font-bold font-mono text-slate-200">${item.weightLb ?? 0} lb.</div>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        ${dmgBadges ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Hasar Parçaları (damageParts):</span><div class="flex flex-wrap gap-1.5">${dmgBadges}</div></div>` : ''}
        ${modBadges ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Aktif Bonuslar (modifiers):</span><div class="flex flex-wrap gap-1.5">${modBadges}</div></div>` : ''}
        ${tacBadges ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Taktiksel Bayraklar &amp; Rozetler:</span><div class="flex flex-wrap gap-1.5">${tacBadges}</div></div>` : ''}
        ${modesHtml ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Gömülü Modlar (modes):</span>${modesHtml}</div>` : ''}
      </div>

      <div class="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
        <button type="button" onclick="DnDUI.equipAssembledForgeItem()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer flex items-center gap-1.5">
          <span>⚒️</span>
          <span>Bu Eşyayı Karakter Envanterine Ekle / Kuşan</span>
        </button>
      </div>
    `;
  }

  function equipAssembledForgeItem() {
    const item = getSelectedForgeItem();
    if (!item) return;

    if (typeof _drawerState.onEquipCallback === 'function') {
      _drawerState.onEquipCallback(item);
      closeCompendiumDrawer();
      return;
    }

    if (global.RuleMaster && typeof global.RuleMaster.equipItem === 'function') {
      if (global.RuleMaster.saveEntry) global.RuleMaster.saveEntry(item);
      global.RuleMaster.equipItem(item.id);
      closeCompendiumDrawer();
    }
  }

  async function openCompendiumDrawer(options = {}) {
    ensureCompendiumDrawerDom();
    if (global.SrdCompendium && !global.SrdCompendium.isReady()) {
      await global.SrdCompendium.init();
    }
    populateForgeControls();

    _drawerState.onEquipCallback = options.onEquip || options.onSelect || null;
    const rawTab = options.tab || options.defaultTab || options.category || 'all';
    const initialTab = rawTab === 'browse' ? (options.category || 'all') : rawTab;
    const initialQuery = options.query || '';

    const drawer = document.getElementById('dnd-ui-compendium-drawer');
    if (drawer) drawer.classList.remove('hidden');
    _drawerState.isOpen = true;

    const input = document.getElementById('dnd-ui-compendium-input');
    if (input) input.value = initialQuery;
    _drawerState.query = initialQuery;

    await switchCompendiumTab(initialTab);
    if (initialTab !== 'forge' && input) {
      setTimeout(() => input.focus(), 60);
    }
  }

  function closeCompendiumDrawer() {
    const drawer = document.getElementById('dnd-ui-compendium-drawer');
    if (drawer) drawer.classList.add('hidden');
    _drawerState.isOpen = false;
  }

  async function switchCompendiumTab(tab) {
    _drawerState.activeTab = tab;
    document.querySelectorAll('[data-comp-tab]').forEach(btn => {
      const t = btn.getAttribute('data-comp-tab');
      if (t === 'forge') return;
      btn.className = t === tab
        ? 'px-2.5 py-1 rounded-lg font-bold transition cursor-pointer bg-indigo-600 text-white'
        : 'px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-slate-400 hover:text-white';
    });

    const searchView = document.getElementById('dnd-ui-compendium-search-view');
    const forgeView = document.getElementById('dnd-ui-compendium-forge-view');

    if (tab === 'forge') {
      if (searchView) searchView.classList.add('hidden');
      if (forgeView) forgeView.classList.remove('hidden');
      updateForgePreview();
      return;
    }

    if (searchView) searchView.classList.remove('hidden');
    if (forgeView) forgeView.classList.add('hidden');

    await executeCompendiumDrawerSearch(_drawerState.query);
  }

  async function onCompendiumSearchInput(val) {
    _drawerState.query = val || '';
    await executeCompendiumDrawerSearch(_drawerState.query);
  }

  async function executeCompendiumDrawerSearch(query) {
    const listEl = document.getElementById('dnd-ui-compendium-list');
    if (!listEl || !global.SrdCompendium) return;

    const filters = { limit: 60 };
    if (_drawerState.activeTab !== 'all') {
      filters.category = _drawerState.activeTab;
    }

    const results = await global.SrdCompendium.search(query || '', filters);
    _drawerState.results = Array.isArray(results) ? results : [];

    if (_drawerState.results.length === 0) {
      listEl.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs italic">Eşleşen SRD V2 kaydı bulunamadı.</div>`;
      const detailEl = document.getElementById('dnd-ui-compendium-detail');
      if (detailEl) detailEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = _drawerState.results.map((r, idx) => `
      <div onclick="DnDUI.selectCompendiumEntry(${idx})" class="p-2.5 hover:bg-slate-900/90 cursor-pointer transition flex items-center justify-between gap-2 ${idx === 0 ? 'bg-indigo-950/50' : ''}">
        <div class="min-w-0">
          <div class="text-xs font-bold text-white truncate">${escapeHtml(r.name)}</div>
          <div class="text-[10px] text-slate-400 font-mono truncate">${escapeHtml(r.subCategory || r.category || 'SRD')}</div>
        </div>
        <span class="text-xs text-slate-500">›</span>
      </div>
    `).join('');

    await selectCompendiumEntry(0);
  }

  async function selectCompendiumEntry(idx) {
    const item = _drawerState.results[idx];
    const detailEl = document.getElementById('dnd-ui-compendium-detail');
    if (!item || !detailEl || !global.SrdCompendium) return;

    let full = item;
    if (item.category === 'Spell' || item.category === 'Power') {
      full = await global.SrdCompendium.getSpellById(item.id) || item;
    } else if (item.category === 'Monster') {
      full = await global.SrdCompendium.getMonsterById(item.id) || item;
    } else {
      full = global.SrdCompendium.getById(item.id) || item;
    }
    _drawerState.selectedEntry = full;

    const dmgHtml = renderDamagePartsBadges(full.damageParts);
    const modHtml = renderModifiersBadges(full.modifiers);
    const tacHtml = renderTacticalBadges(full);
    const modesHtml = renderModesPills(full, full.activeModeId, '');

    detailEl.innerHTML = `
      <div class="border-b border-slate-800 pb-3 flex items-start justify-between gap-2">
        <div>
          <span class="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-[10px] font-mono">${escapeHtml(full.category || 'SRD')} • ${escapeHtml(full.subCategory || '')}</span>
          <h4 class="text-base font-black text-amber-300 mt-1">${escapeHtml(full.name)}</h4>
          <div class="text-[10px] font-mono text-slate-500">ID: ${escapeHtml(full.id)} • Kaynak: ${escapeHtml(full.source || 'SRD 3.5e')}</div>
        </div>
        <button type="button" onclick="DnDUI.equipSelectedCompendiumEntry()" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer shrink-0 flex items-center gap-1">
          <span>➕</span>
          <span>Karaktere Ekle / Kuşan</span>
        </button>
      </div>

      ${(dmgHtml || modHtml || tacHtml) ? `
        <div class="space-y-2 bg-slate-900/70 border border-slate-800 rounded-xl p-3">
          ${dmgHtml ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Hasar Parçaları:</span><div class="flex flex-wrap gap-1">${dmgHtml}</div></div>` : ''}
          ${modHtml ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Bonuslar (modifiers):</span><div class="flex flex-wrap gap-1">${modHtml}</div></div>` : ''}
          ${tacHtml ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Taktiksel Bayraklar:</span><div class="flex flex-wrap gap-1">${tacHtml}</div></div>` : ''}
          ${modesHtml ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Gömülü Modlar:</span>${modesHtml}</div>` : ''}
        </div>
      ` : ''}

      <div class="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 max-h-80 overflow-y-auto">
        ${escapeHtml(full.description || full.benefit || full.shortDescription || 'Açıklama bulunmuyor.')}
      </div>
    `;
  }

  function equipSelectedCompendiumEntry() {
    const entry = _drawerState.selectedEntry;
    if (!entry) return;
    if (typeof _drawerState.onEquipCallback === 'function') {
      _drawerState.onEquipCallback(entry);
      closeCompendiumDrawer();
      return;
    }
    if (global.RuleMaster && typeof global.RuleMaster.equipItem === 'function') {
      if (global.RuleMaster.saveEntry) global.RuleMaster.saveEntry(entry);
      global.RuleMaster.equipItem(entry.id);
      closeCompendiumDrawer();
    }
  }

  // Export window.DnDUI
  global.DnDUI = {
    getDiceIconSvg,
    getFormulaDiceIconSvg,
    getDamageTypeStyle,
    renderDamagePartsBadges,
    renderModifiersBadges,
    renderTacticalBadges,
    renderModesPills,
    getConditionWarningBannerHtml,
    renderConditionWarningBanner,
    attachSpotlightCombobox,
    openCompendiumDrawer,
    closeCompendiumDrawer,
    switchCompendiumTab,
    onCompendiumSearchInput,
    selectCompendiumEntry,
    equipSelectedCompendiumEntry,
    onForgeNaturalLanguageInput,
    updateForgePreview,
    equipAssembledForgeItem
  };

})(typeof window !== 'undefined' ? window : globalThis);
