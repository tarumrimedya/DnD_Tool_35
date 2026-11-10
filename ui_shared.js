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
      return `<svg class="${classes}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="50,10 92,78 12,86" fill="currentColor" fill-opacity="0.14" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><polygon points="50,10 54,54 12,86" fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><polygon points="50,10 92,78 54,54" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><polygon points="12,86 54,54 92,78" fill="currentColor" fill-opacity="0.34" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><text x="53" y="49" text-anchor="middle" fill="currentColor" font-size="22" font-weight="900" font-family="system-ui, sans-serif">4</text></svg>`;
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
        ? `<span class="ml-0.5 px-1 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black" title="Triggers Only on Critical Hits (Burst)">⚡CRIT</span>`
        : (part.multiplyOnCrit ? `<span class="opacity-70 text-[9px]" title="Multiplied on Critical Hit">×Crit</span>` : '');
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
      'ability.str': 'STR', 'ability.dex': 'DEX', 'ability.con': 'CON',
      'ability.int': 'INT', 'ability.wis': 'WIS', 'ability.cha': 'CHA',
      ac: 'AC', 'ac.all': 'AC', 'ac.armor': 'Armor AC', 'ac.shield': 'Shield AC',
      'ac.natural': 'Natural AC', 'ac.deflection': 'Deflection AC', 'ac.dodge': 'Dodge AC',
      'ac.insight': 'Insight AC', 'ac.sacred': 'Sacred AC', 'ac.luck': 'Luck AC',
      touchAc: 'Touch AC', flatFootedAc: 'Flat-Footed AC',
      attack: 'Attack', 'attack.all': 'Attack', 'attack.weapon': 'Attack',
      meleeAttack: 'Melee Atk', 'attack.melee': 'Melee Atk',
      rangedAttack: 'Ranged Atk', 'attack.ranged': 'Ranged Atk',
      damage: 'Damage', 'damage.all': 'Damage', 'damage.weapon': 'Damage',
      meleeDamage: 'Melee Dmg', 'damage.melee': 'Melee Dmg',
      rangedDamage: 'Ranged Dmg', 'damage.ranged': 'Ranged Dmg',
      fort: 'Fort', 'save.fort': 'Fort',
      ref: 'Ref', 'save.ref': 'Ref',
      will: 'Will', 'save.will': 'Will',
      allSaves: 'All Saves', 'save.all': 'All Saves',
      initiative: 'Init', 'init': 'Init', speed: 'Speed',
      hp: 'HP', tempHp: 'Temp HP', 'hp.temp': 'Temp HP',
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
    const isArmorOrShield = entry.type === 'Armor' || entry.type === 'Shield' ||
      entry.category === 'Armor' || entry.category === 'Shield' ||
      entry.slot === 'Armor' || entry.slot === 'armor';

    if (rf.keen) {
      badges.push({ icon: '⚡', text: 'Keen (2× Crit Range)', cls: 'bg-amber-950/80 text-amber-300 border-amber-500/60' });
    }
    const hasBypassRf = !isArmorOrShield && Array.isArray(rf.bypassDR) && rf.bypassDR.length > 0;
    if (hasBypassRf) {
      badges.push({ icon: '🛡️', text: `Bypass DR/${rf.bypassDR.join(', ')}`, cls: 'bg-sky-950/80 text-sky-300 border-sky-500/60' });
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
        const isDrBypassLabel = (typeof tb === 'object' && tb.id === 'bypass-dr') || /^(?:dr\s*bypass|bypass\s*dr)\b/i.test(label.trim());
        if (isDrBypassLabel && (isArmorOrShield || hasBypassRf)) return;
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
      alerts.push({ icon: '🛑', text: 'Effective DEX 0 (Paralyzed / Helpless — +4 to enemy melee attack rolls, Coup de Grace risk!)', severity: 'rose' });
    } else if (flags.loseDexToAC) {
      alerts.push({ icon: '⚠️', text: 'DEX Bonus to AC Lost (Flat-Footed / Vulnerable to Sneak Attack!)', severity: 'amber' });
    }
    if (Array.isArray(flags.actionRestrictions) && flags.actionRestrictions.length > 0) {
      flags.actionRestrictions.forEach(r => {
        alerts.push({ icon: '⛓️', text: `${r.source}: ${r.restriction}`, severity: 'rose' });
      });
    }
    if (flags.halfSpeed) {
      alerts.push({ icon: '🦶', text: 'Movement Speed Halved (×0.5 Speed / Run & Charge Restricted)', severity: 'amber' });
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
          <span class="text-xs font-black uppercase tracking-wider text-rose-300">Tactical Condition Warning:</span>
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
        // Records from lazy chunks (monsters, splat feats, psionic powers...) arrive as index stubs:
        // fetchEntry loads the owning chunk and returns the full record.
        fullEntry = global.SrdCompendium.getById(picked.id)
          || (typeof global.SrdCompendium.fetchEntry === 'function' ? await global.SrdCompendium.fetchEntry(picked.id) : null)
          || picked;
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
    activeTab: 'srd', // 'srd' | 'forge' | 'custom' | 'Monster'
    srdCategoryFilter: 'all_gear', // 'all_gear' | 'Weapon' | 'Armor' | 'Item'
    query: '',
    _searchSeq: 0,
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
    wrapper.className = 'hidden fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto';
    wrapper.onclick = function (e) {
      if (e.target === wrapper) closeCompendiumDrawer();
    };
    wrapper.innerHTML = `
      <!-- Centered Modal Card (Matches Level-Up Wizard Modal Style) -->
      <div class="bg-dndCard border border-amber-500/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100">
        <!-- Header -->
        <div class="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <div id="dnd-ui-compendium-icon" class="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/60 flex items-center justify-center text-lg shrink-0">🎒</div>
            <div class="min-w-0">
              <h3 id="dnd-ui-compendium-title" class="text-sm md:text-base font-extrabold text-white flex items-center gap-2 truncate">Add Item to Inventory</h3>
              <p id="dnd-ui-compendium-subtitle" class="text-[10px] text-slate-400 truncate">Spotlight Search (SRD 3.5e, Custom DB &amp; AI) • V2 Item Forge</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" onclick="DnDUI.closeCompendiumDrawer()" class="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer">✕ Close</button>
          </div>
        </div>

        <!-- Unified 2-Tab Bar (Calmed surface so Spotlight Command Bar below is the primary focal point) -->
        <div id="dnd-ui-compendium-tabs-bar" class="px-4 py-2 bg-slate-950 border-b border-slate-800 grid grid-cols-2 gap-2 shrink-0 text-xs">
          <button type="button" id="dnd-ui-tab-btn-srd" data-comp-tab="srd" onclick="DnDUI.switchCompendiumTab('srd')" class="hidden w-full py-2 px-3 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 bg-slate-800/95 text-amber-300 border border-amber-500/50 shadow-sm">
            <span>🔍</span>
            <span class="truncate">Spotlight Search</span>
          </button>
          <button type="button" id="dnd-ui-tab-btn-custom" data-comp-tab="custom" onclick="DnDUI.switchCompendiumTab('custom')" class="w-full py-2 px-3 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 bg-slate-800/95 text-amber-300 border border-amber-500/50 shadow-sm">
            <span>🔍</span>
            <span class="truncate">Spotlight Search</span>
          </button>
          <button type="button" data-comp-tab="forge" onclick="DnDUI.switchCompendiumTab('forge')" class="w-full py-2 px-3 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-slate-400 hover:text-white bg-slate-900/50 border border-slate-800">
            <span>⚒️</span>
            <span class="truncate">Item Forge</span>
          </button>
        </div>

        <!-- VIEW 1: SRD COMPENDIUM SEARCH & INSPECTOR -->
        <div id="dnd-ui-compendium-search-view" class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <!-- Search Bar + Category Sub-Filter Pills -->
          <div class="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2.5 shrink-0">
            <div class="ui-spotlight-well ui-spotlight-amber rounded-xl p-1.5 flex items-center gap-2 border border-amber-400/75">
              <div class="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shrink-0 shadow">
                🔍
              </div>
              <input type="text" id="dnd-ui-compendium-input" oninput="DnDUI.onCompendiumSearchInput(this.value)" onkeydown="DnDUI.onCompendiumInputKeydown(event)" placeholder="Search 3,522 SRD entries (e.g. Longsword, Full Plate, Ring, Cloak)..." class="flex-1 h-8 bg-transparent pr-2 text-xs sm:text-sm text-white placeholder-slate-200 focus:outline-none font-semibold">
              <button type="button" onclick="DnDUI.onCompendiumSearchInput(document.getElementById('dnd-ui-compendium-input')?.value || '')" class="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 shadow transition cursor-pointer">
                <span>🔍</span>
                <span>Search</span>
              </button>
            </div>
            <div id="dnd-ui-compendium-token-bar" class="hidden flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] font-mono"></div>
            <div id="dnd-ui-compendium-srd-subfilters" class="flex flex-wrap items-center gap-1.5 text-[11px]">
              <button type="button" data-srd-sub="all_gear" onclick="DnDUI.setSrdSubFilter('all_gear')" class="px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer bg-indigo-600/30 text-indigo-200 border border-indigo-500/50">📦 All Gear</button>
              <button type="button" data-srd-sub="Armor" onclick="DnDUI.setSrdSubFilter('Armor')" class="px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer bg-slate-900 text-slate-400 hover:text-white border border-slate-800">🛡️ Armor &amp; Shields</button>
              <button type="button" data-srd-sub="Weapon" onclick="DnDUI.setSrdSubFilter('Weapon')" class="px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer bg-slate-900 text-slate-400 hover:text-white border border-slate-800">⚔️ Weapons</button>
              <button type="button" data-srd-sub="Consumable" onclick="DnDUI.setSrdSubFilter('Consumable')" class="px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer bg-slate-900 text-slate-400 hover:text-white border border-slate-800">🧪 Consumables</button>
              <button type="button" data-srd-sub="Crystal" onclick="DnDUI.setSrdSubFilter('Crystal')" class="px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer bg-slate-900 text-slate-400 hover:text-white border border-slate-800">💎 Crystals</button>
              <button type="button" data-srd-sub="Item" onclick="DnDUI.setSrdSubFilter('Item')" class="px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer bg-slate-900 text-slate-400 hover:text-white border border-slate-800">💍 Magic &amp; Wondrous</button>
            </div>
          </div>

          <!-- Split Pane: Left Results, Right V2 Detail Card -->
          <div class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
            <div id="dnd-ui-compendium-list" class="md:col-span-5 max-h-52 md:max-h-none border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/40"></div>
            <div id="dnd-ui-compendium-detail" class="md:col-span-7 overflow-y-auto p-4 space-y-3"></div>
          </div>
        </div>

        <!-- VIEW 2: THE FORGE (DEMIRHANE LEGO ITEM ASSEMBLER) -->
        <div id="dnd-ui-compendium-forge-view" class="hidden flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/50 rounded-xl p-3.5 space-y-3 shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <h4 class="text-sm font-black text-amber-300 flex items-center gap-2">
                  <span>⚒️</span>
                  <span>The Forge — Canonical V2 Modular Item Assembler</span>
                </h4>
                <p class="text-[11px] text-slate-400">Combine base weapons/armor, special materials (Mithral, Adamantine, etc.), +1..+5 enhancement bonuses, and special abilities with zero tokens.</p>
              </div>
            </div>

            <!-- Fast Natural Language Input -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-indigo-300">⚡ Quick Natural Language Assembly (Optional):</label>
              <div class="flex items-center gap-2">
                <input type="text" id="dnd-forge-nl-input" oninput="DnDUI.onForgeNaturalLanguageInput(this.value)" placeholder="e.g. +1 Mithral Breastplate with Crystal of Adaptation, +2 Keen Mithral Scimitar with Fire Assault Crystal..." class="flex-1 bg-slate-950 border border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400">
              </div>
            </div>

            <!-- Category Filter for Base Items (Armor & Shields Prioritized) -->
            <div class="flex items-center gap-1.5 pt-1 flex-wrap">
              <span class="text-[10px] text-slate-400 font-semibold uppercase">Category Filter:</span>
              <button type="button" data-dnd-forge-filter="all" onclick="DnDUI.setForgeBaseTypeFilter('all')" class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-pointer">📦 All Base Items</button>
              <button type="button" data-dnd-forge-filter="Armor" onclick="DnDUI.setForgeBaseTypeFilter('Armor')" class="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold transition bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer">🛡️ Armor &amp; Shields</button>
              <button type="button" data-dnd-forge-filter="Weapon" onclick="DnDUI.setForgeBaseTypeFilter('Weapon')" class="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold transition bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer">⚔️ Weapons</button>
            </div>

            <!-- Structured Pickers -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div>
                <label class="block text-slate-400 mb-1 font-semibold">1. Base Item (Armor / Shield / Weapon)</label>
                <select id="dnd-forge-base-select" onchange="DnDUI.onForgeControlChange()" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"></select>
              </div>
              <div>
                <label class="block text-slate-400 mb-1 font-semibold">2. Special Material</label>
                <select id="dnd-forge-material-select" onchange="DnDUI.onForgeControlChange()" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400">
                  <option value="">Standard (Steel / Leather / Wood)</option>
                  <option value="mat-mithral">Mithral (Light / -ACP / +Max DEX)</option>
                  <option value="mat-adamantine">Adamantine (Bypass Hardness 20 / Armor DR)</option>
                  <option value="mat-cold-iron">Cold Iron (Fey/Demon DR Bypass)</option>
                  <option value="mat-alchemical-silver">Alchemical Silver (Lycanthrope/Devil DR)</option>
                  <option value="mat-darkwood">Darkwood (Half-Weight Wood)</option>
                  <option value="mat-dragonhide">Dragonhide (Druid-Compatible Dragon Scale)</option>
                </select>
              </div>
              <div>
                <label class="block text-slate-400 mb-1 font-semibold">3. Enhancement Bonus</label>
                <select id="dnd-forge-enh-bonus" onchange="DnDUI.onForgeControlChange()" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-amber-300 font-bold font-mono focus:outline-none focus:border-amber-400">
                  <option value="0">Masterwork / Normal (+0)</option>
                  <option value="1" selected>+1 Enhancement</option>
                  <option value="2">+2 Enhancement</option>
                  <option value="3">+3 Enhancement</option>
                  <option value="4">+4 Enhancement</option>
                  <option value="5">+5 Enhancement (Pre-Epic Cap)</option>
                </select>
              </div>
              <div>
                <label class="block text-slate-400 mb-1 font-semibold">4. Augmentation Crystal (MIC)</label>
                <select id="dnd-forge-crystal-select" onchange="DnDUI.onForgeControlChange()" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400">
                  <option value="">No Augmentation Crystal Attached</option>
                </select>
              </div>
            </div>

            <!-- Special Abilities Checkboxes -->
            <div class="space-y-1.5 pt-2">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <label id="dnd-forge-abilities-title" class="block text-slate-400 font-semibold">5. Magic Special Abilities:</label>
                <span id="dnd-forge-budget-badge" class="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">Budget: +0 / +1 Used (+1 Left)</span>
              </div>
              <input type="text" id="dnd-forge-enh-search" oninput="DnDUI.onForgeEnhSearchInput(this.value)" placeholder="🔍 Quick filter abilities (e.g. Keen, Flaming, Ghost, Fortification)..." class="w-full h-8 text-[11px] bg-slate-950 border border-slate-700 rounded-lg px-2.5 text-white mb-1 focus:outline-none focus:border-amber-400">
              <div id="dnd-forge-enhancements-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1 custom-scroll">
                <!-- Populated dynamically -->
              </div>
            </div>
          </div>

          <!-- Live Assembled V2 Item Preview Card -->
          <div id="dnd-forge-preview-card" class="bg-slate-950/90 border border-indigo-500/50 rounded-2xl p-4 space-y-3 shadow-xl"></div>
        </div>

        <!-- VIEW 3: CUSTOM & AI ITEM (Mounts #add-pool-custom-tab-content on Character Sheet) -->
        <div id="dnd-ui-compendium-custom-view" class="hidden flex-1 flex flex-col min-h-0 overflow-hidden"></div>
      </div>
    `;
    document.body.appendChild(wrapper);
    mountCustomTabContentIfPresent();
    populateForgeControls();
  }

  function mountCustomTabContentIfPresent() {
    const customView = document.getElementById('dnd-ui-compendium-custom-view');
    const customContent = document.getElementById('add-pool-custom-tab-content');
    const customTabBtn = document.getElementById('dnd-ui-tab-btn-custom');
    const srdTabBtn = document.getElementById('dnd-ui-tab-btn-srd');
    if (customView && customContent && customContent.parentElement !== customView) {
      customView.appendChild(customContent);
    }
    const hasCustom = Boolean(customContent);
    if (customTabBtn) customTabBtn.classList.toggle('hidden', !hasCustom);
    if (srdTabBtn) srdTabBtn.classList.toggle('hidden', hasCustom);
  }

  function getSelectedForgeBaseType() {
    const baseSel = document.getElementById('dnd-forge-base-select');
    const baseId = baseSel?.value || 'wpn-longsword';
    if (global.SrdCompendium && typeof global.SrdCompendium.getById === 'function') {
      const rec = global.SrdCompendium.getById(baseId);
      if (rec && ['Weapon', 'Armor', 'Shield'].includes(rec.type)) {
        return rec.type;
      }
    }
    if (baseId.startsWith('shd-')) return 'Shield';
    if (baseId.startsWith('arm-')) return 'Armor';
    const selOpt = baseSel?.selectedOptions?.[0];
    const optTxt = String(selOpt?.textContent || '');
    if (optTxt.includes('(Shield)')) return 'Shield';
    if (optTxt.includes('(Armor)')) return 'Armor';
    return 'Weapon';
  }

  function onForgeEnhSearchInput(val) {
    const enhGrid = document.getElementById('dnd-forge-enhancements-grid');
    if (!enhGrid) return;
    const q = (val || '').toLowerCase().trim();
    const labels = enhGrid.querySelectorAll('label');
    labels.forEach(l => {
      const text = (l.textContent || '').toLowerCase();
      const chk = l.querySelector('input');
      if (!q || text.includes(q) || (chk && chk.checked)) {
        l.classList.remove('hidden');
      } else {
        l.classList.add('hidden');
      }
    });
  }

  function syncForgeEnhancementsGrid(preferredEnhIds = null, preferredCrystalId = null) {
    const enhGrid = document.getElementById('dnd-forge-enhancements-grid');
    if (!enhGrid) return;

    const baseType = getSelectedForgeBaseType();
    const enhBonus = Math.max(0, Number(document.getElementById('dnd-forge-enh-bonus')?.value) || 0);

    // Sync Augmentation Crystal dropdown for this baseType
    const crysSel = document.getElementById('dnd-forge-crystal-select');
    if (crysSel) {
      const currentVal = preferredCrystalId !== null ? preferredCrystalId : crysSel.value;
      let crystals = [];
      if (global.SrdCompendium && typeof global.SrdCompendium.getCrystals === 'function') {
        crystals = global.SrdCompendium.getCrystals(baseType);
      }
      crystals.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      let optHtml = '<option value="">No Augmentation Crystal Attached</option>';
      optHtml += crystals.map(c =>
        `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${Number(c.cost || 0).toLocaleString('en-US')} gp)</option>`
      ).join('');
      crysSel.innerHTML = optHtml;
      if (currentVal && crystals.some(c => c.id === currentVal)) {
        crysSel.value = currentVal;
      }
    }

    // Determine currently checked IDs (or use preferredEnhIds when initializing from item)
    const rawCheckedIds = Array.isArray(preferredEnhIds)
      ? preferredEnhIds.slice()
      : Array.from(document.querySelectorAll('.dnd-forge-enh-chk:checked')).map(el => el.value);

    // Filter catalog by selected item type (Weapon vs Armor vs Shield)
    let eligibleCatalog = [];
    if (global.SrdCompendium && typeof global.SrdCompendium.getEnhancements === 'function') {
      const compList = global.SrdCompendium.getEnhancements(baseType === 'Shield' ? 'Shield' : baseType);
      if (Array.isArray(compList) && compList.length > 0) {
        eligibleCatalog = compList.map(e => ({
          id: e.id,
          name: e.name,
          label: `${e.name}`,
          cost: Number(e.enhIncrease) || 0,
          bonusEq: e.enhIncrease ? `+${e.enhIncrease}` : ((e.flatCost || e.cost) ? `+${Number(e.flatCost || e.cost).toLocaleString('en-US')} gp` : '+0'),
          shortDescription: e.shortDescription || e.name
        }));
      }
    }
    eligibleCatalog.sort((a, b) => String(a.label || a.name || '').localeCompare(String(b.label || b.name || '')));

    if (eligibleCatalog.length === 0) {
      enhGrid.innerHTML = '<div class="col-span-full p-3 text-center text-slate-400 italic">⏳ Loading enhancements from SRD &amp; MIC Compendium...</div>';
      return;
    }

    const eligibleMap = new Map(eligibleCatalog.map(e => [e.id, e]));

    // Enforce Total Budget Rule: requires at least +1 base enhancement bonus, and sum of +bonus equivalents <= enhBonus
    const validCheckedSet = new Set();
    let usedBudget = 0;
    if (enhBonus > 0) {
      for (let i = 0; i < rawCheckedIds.length; i++) {
        const id = rawCheckedIds[i];
        const def = eligibleMap.get(id);
        if (!def) continue;
        if (usedBudget + def.cost <= enhBonus) {
          validCheckedSet.add(id);
          usedBudget += def.cost;
        }
      }
    }

    const remainingBudget = Math.max(0, enhBonus - usedBudget);

    // Update Section Title & Live Budget Pill
    const titleEl = document.getElementById('dnd-forge-abilities-title');
    if (titleEl) {
      titleEl.textContent = `5. Magic ${baseType} Special Abilities (${eligibleCatalog.length}):`;
    }
    const badgeEl = document.getElementById('dnd-forge-budget-badge');
    if (badgeEl) {
      if (enhBonus <= 0) {
        badgeEl.className = 'px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700';
        badgeEl.textContent = '🔒 Requires +1..+5 Enhancement Bonus';
      } else if (remainingBudget === 0) {
        badgeEl.className = 'px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50';
        badgeEl.textContent = `Budget: +${usedBudget} / +${enhBonus} Used (Full)`;
      } else {
        badgeEl.className = 'px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40';
        badgeEl.textContent = `Budget: +${usedBudget} / +${enhBonus} Used (+${remainingBudget} Left)`;
      }
    }

    enhGrid.innerHTML = eligibleCatalog.map(e => {
      const isChecked = validCheckedSet.has(e.id);
      const isLocked = !isChecked && (enhBonus <= 0 || e.cost > remainingBudget);
      const labelCls = isChecked
        ? 'flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/70 cursor-pointer select-none shadow-sm'
        : (isLocked
            ? 'flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/60 opacity-40 cursor-not-allowed select-none'
            : 'flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer select-none');
      const titleAttr = isLocked
        ? (enhBonus <= 0
            ? 'Requires at least a +1 Enhancement Bonus on the base item (D&D 3.5e RAW)'
            : `Requires +${e.cost} available Enhancement Budget (Remaining: +${remainingBudget})`)
        : `${e.label || e.name} (${e.bonusEq} — ${e.shortDescription || ''})`;

      return `
        <label class="${labelCls}" title="${escapeHtml(titleAttr)}">
          <input type="checkbox" value="${e.id}" ${isChecked ? 'checked' : ''} ${isLocked ? 'disabled' : ''} onchange="DnDUI.onForgeControlChange()" class="dnd-forge-enh-chk rounded text-amber-500 bg-slate-900 border-slate-700">
          <span class="text-[11px] font-semibold ${isChecked ? 'text-amber-200' : 'text-slate-200'} truncate">${e.label || e.name}</span>
          <span class="text-[9px] font-mono ${isLocked ? 'text-slate-500' : 'text-amber-400'} ml-auto">${isLocked ? '🔒' + e.bonusEq : e.bonusEq}</span>
        </label>
      `;
    }).join('');

    const searchInp = document.getElementById('dnd-forge-enh-search');
    if (searchInp && searchInp.value) {
      onForgeEnhSearchInput(searchInp.value);
    }
  }

  function setForgeBaseTypeFilter(type = 'all') {
    _drawerState.forgeBaseTypeFilter = type;
    document.querySelectorAll('[data-dnd-forge-filter]').forEach(btn => {
      const f = btn.getAttribute('data-dnd-forge-filter');
      btn.className = f === type
        ? 'px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-pointer'
        : 'px-2.5 py-0.5 rounded-lg text-[10px] font-semibold transition bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer';
    });
    populateForgeBaseSelectOptions();
    onForgeControlChange();
  }

  function populateForgeBaseSelectOptions(preferredId = null) {
    const baseSel = document.getElementById('dnd-forge-base-select');
    if (!baseSel) return;

    const srdReady = Boolean(global.SrdCompendium && typeof global.SrdCompendium.isReady === 'function' && global.SrdCompendium.isReady());
    let baseOptions = [];
    if (srdReady && typeof global.SrdCompendium.getAllLoaded === 'function') {
      baseOptions = global.SrdCompendium.getAllLoaded(['Weapon', 'Armor', 'Shield']);
    }

    if (baseOptions.length === 0) {
      baseSel.innerHTML = '<option value="" disabled selected>⏳ Loading SRD Equipment Compendium...</option>';
      return;
    }

    const currentFilter = _drawerState.forgeBaseTypeFilter || 'all';
    const armorList = baseOptions.filter(item => item.type === 'Armor' || item.type === 'Shield')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    const weaponList = baseOptions.filter(item => item.type === 'Weapon')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    let html = '';
    if (currentFilter === 'all' || currentFilter === 'Armor') {
      if (armorList.length > 0) {
        html += `<optgroup label="🛡️ Armor &amp; Shields">` +
          armorList.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} (${escapeHtml(item.type || item.subCategory || item.category)})</option>`).join('') +
          `</optgroup>`;
      }
    }
    if (currentFilter === 'all' || currentFilter === 'Weapon') {
      if (weaponList.length > 0) {
        html += `<optgroup label="⚔️ Weapons">` +
          weaponList.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} (${escapeHtml(item.type || item.subCategory || item.category)})</option>`).join('') +
          `</optgroup>`;
      }
    }

    const prevVal = preferredId !== null ? preferredId : baseSel.value;
    baseSel.innerHTML = html;

    const allCurrentIds = Array.from(baseSel.options).map(o => o.value);
    if (prevVal && allCurrentIds.includes(prevVal)) {
      baseSel.value = prevVal;
    } else if (allCurrentIds.includes('arm-chain-shirt')) {
      baseSel.value = 'arm-chain-shirt';
    } else if (allCurrentIds.length > 0) {
      baseSel.value = allCurrentIds[0];
    }
  }

  function populateForgeControls() {
    const baseSel = document.getElementById('dnd-forge-base-select');
    const enhGrid = document.getElementById('dnd-forge-enhancements-grid');
    if (!baseSel || !enhGrid) return;

    const srdReady = Boolean(global.SrdCompendium && typeof global.SrdCompendium.isReady === 'function' && global.SrdCompendium.isReady());
    if (baseSel.dataset.srdPopulated === (srdReady ? 'full' : 'fallback') && enhGrid.children.length > 0) {
      return;
    }

    populateForgeBaseSelectOptions();
    baseSel.dataset.srdPopulated = srdReady ? 'full' : 'fallback';
    syncForgeEnhancementsGrid();
  }

  function onForgeControlChange() {
    const nlInput = document.getElementById('dnd-forge-nl-input');
    if (nlInput && nlInput.value) {
      nlInput.value = '';
    }
    syncForgeEnhancementsGrid();
    updateForgePreview();
  }

  function populateForgeFromItem(item) {
    if (!item) return;
    populateForgeControls();

    const nlInput = document.getElementById('dnd-forge-nl-input');
    if (nlInput) nlInput.value = '';

    let resolvedBaseId = item.baseItemId || null;
    let resolvedMaterial = item.material || '';
    let resolvedEnhBonus = Number(item.enhancementBonus);
    let resolvedEnhancements = Array.isArray(item.enhancements) ? item.enhancements.slice() : [];

    // Try direct SRD lookup by ID or Name
    if (!resolvedBaseId && global.SrdCompendium) {
      if (item.id && typeof global.SrdCompendium.getById === 'function') {
        const byId = global.SrdCompendium.getById(item.id);
        if (byId && ['Weapon', 'Armor', 'Shield'].includes(byId.type)) {
          resolvedBaseId = byId.id;
        }
      }
      if (!resolvedBaseId && (item.masterDbName || item.name) && typeof global.SrdCompendium.getByName === 'function') {
        const byName = global.SrdCompendium.getByName(item.masterDbName || item.name);
        if (byName && ['Weapon', 'Armor', 'Shield'].includes(byName.type)) {
          resolvedBaseId = byName.id;
        }
      }
    }

    // Parse natural language composite item (e.g., "+2 Keen Mithral Scimitar") if needed
    const rawName = String(item.name || item.masterDbName || '').trim();
    if ((!resolvedBaseId || isNaN(resolvedEnhBonus) || (!resolvedMaterial && resolvedEnhancements.length === 0)) && rawName && global.ItemAssembler && typeof global.ItemAssembler.parseNaturalLanguageItem === 'function') {
      try {
        const parsed = global.ItemAssembler.parseNaturalLanguageItem(rawName);
        if (parsed) {
          if (!resolvedBaseId && parsed.baseItemId) resolvedBaseId = parsed.baseItemId;
          if (!resolvedMaterial && parsed.material) resolvedMaterial = parsed.material;
          if ((isNaN(resolvedEnhBonus) || resolvedEnhBonus === 0) && Number(parsed.enhancementBonus) > 0) {
            resolvedEnhBonus = Number(parsed.enhancementBonus);
          }
          if (resolvedEnhancements.length === 0 && Array.isArray(parsed.enhancements) && parsed.enhancements.length > 0) {
            resolvedEnhancements = parsed.enhancements.slice();
          }
        }
      } catch (_) {}
    }

    // Infer enhancement bonus from item.attBonus or modifiers if still missing
    if (isNaN(resolvedEnhBonus)) {
      if (Array.isArray(item.modifiers)) {
        const enhMod = item.modifiers.find(m => m && String(m.type || '').toLowerCase() === 'enhancement' && Number(m.value) > 0);
        if (enhMod) resolvedEnhBonus = Number(enhMod.value) || 0;
      }
      if (isNaN(resolvedEnhBonus)) {
        resolvedEnhBonus = 0;
      }
    }

    if (item.ruleFlags && item.ruleFlags.keen && !resolvedEnhancements.includes('enh-keen')) {
      resolvedEnhancements.push('enh-keen');
    }

    const baseSel = document.getElementById('dnd-forge-base-select');
    if (baseSel) {
      let hasOpt = resolvedBaseId && Array.from(baseSel.options).some(opt => opt.value === resolvedBaseId);
      if (!hasOpt && rawName) {
        const cleanLower = rawName.toLowerCase();
        const optsByLen = Array.from(baseSel.options)
          .map(opt => ({
            value: opt.value,
            baseLabel: String(opt.textContent || '').replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase()
          }))
          .filter(o => o.baseLabel.length >= 3)
          .sort((a, b) => b.baseLabel.length - a.baseLabel.length);
        const foundOpt = optsByLen.find(o => cleanLower === o.baseLabel || cleanLower.includes(o.baseLabel));
        if (foundOpt) {
          resolvedBaseId = foundOpt.value;
          hasOpt = true;
        }
      }
      if (hasOpt && resolvedBaseId) {
        baseSel.value = resolvedBaseId;
      }
    }

    const matSel = document.getElementById('dnd-forge-material-select');
    if (matSel) {
      matSel.value = resolvedMaterial || '';
    }

    const enhSel = document.getElementById('dnd-forge-enh-bonus');
    if (enhSel) {
      const enhCostMap = new Map(FORGE_ENH_CATALOG.map(e => [e.id, e.cost]));
      const minRequiredBudget = resolvedEnhancements.reduce((sum, id) => sum + (enhCostMap.get(id) || 0), 0);
      const effectiveBonus = Math.max(Number(resolvedEnhBonus) || 0, minRequiredBudget);
      const clampedBonus = Math.max(0, Math.min(5, Math.round(effectiveBonus)));
      enhSel.value = String(clampedBonus);
    }

    const resolvedCrystalId = (item.crystal && (item.crystal.id || item.crystal)) || null;
    syncForgeEnhancementsGrid(resolvedEnhancements, resolvedCrystalId);
    updateForgePreview();
  }

  function getSelectedForgeItem() {
    if (!global.ItemAssembler) return null;
    const nlInput = document.getElementById('dnd-forge-nl-input');
    const nlVal = (nlInput && nlInput.value || '').trim();
    if (nlVal.length >= 4 && typeof global.ItemAssembler.parseNaturalLanguageItem === 'function') {
      try {
        const parsed = global.ItemAssembler.parseNaturalLanguageItem(nlVal);
        if (parsed) return parsed;
      } catch (_) {}
    }

    const baseId = document.getElementById('dnd-forge-base-select')?.value || 'arm-chain-shirt';
    const matId = document.getElementById('dnd-forge-material-select')?.value || '';
    const enhBonus = Number(document.getElementById('dnd-forge-enh-bonus')?.value) || 0;
    const crystalId = document.getElementById('dnd-forge-crystal-select')?.value || '';
    const checkedEnhs = Array.from(document.querySelectorAll('.dnd-forge-enh-chk:checked')).map(el => el.value);

    const assembleFn = global.ItemAssembler.assemble || global.ItemAssembler.assembleItem;
    if (typeof assembleFn !== 'function') return null;
    try {
      return assembleFn.call(global.ItemAssembler, {
        baseItemId: baseId,
        material: matId || null,
        enhancementBonus: enhBonus,
        enhancements: checkedEnhs,
        crystal: crystalId || null,
        masterwork: enhBonus > 0 || Boolean(matId)
      });
    } catch (_) {
      return null;
    }
  }

  function onForgeNaturalLanguageInput(val) {
    const trimmed = String(val || '').trim();
    if (trimmed.length >= 4 && global.ItemAssembler && typeof global.ItemAssembler.parseNaturalLanguageItem === 'function') {
      try {
        const parsed = global.ItemAssembler.parseNaturalLanguageItem(trimmed);
        if (parsed && parsed.baseItemId) {
          const baseSel = document.getElementById('dnd-forge-base-select');
          if (baseSel && Array.from(baseSel.options).some(o => o.value === parsed.baseItemId)) {
            baseSel.value = parsed.baseItemId;
          }
          const matSel = document.getElementById('dnd-forge-material-select');
          if (matSel) matSel.value = parsed.material || '';
          const parsedEnhs = Array.isArray(parsed.enhancements) ? parsed.enhancements : [];
          const enhCostMap = new Map(FORGE_ENH_CATALOG.map(e => [e.id, e.cost]));
          const minBudget = parsedEnhs.reduce((sum, id) => sum + (enhCostMap.get(id) || 0), 0);
          const enhSel = document.getElementById('dnd-forge-enh-bonus');
          if (enhSel) {
            const effBonus = Math.max(Number(parsed.enhancementBonus) || 0, minBudget);
            enhSel.value = String(Math.max(0, Math.min(5, effBonus)));
          }
          syncForgeEnhancementsGrid(parsedEnhs);
        }
      } catch (_) {}
    }
    updateForgePreview();
  }

  function updateForgePreview() {
    const container = document.getElementById('dnd-forge-preview-card');
    if (!container) return;

    const item = getSelectedForgeItem();
    if (!item) {
      container.innerHTML = `<div class="text-slate-500 italic p-4 text-center">Select a base item to preview.</div>`;
      return;
    }

    const dmgBadges = renderDamagePartsBadges(item.damageParts);
    const modBadges = renderModifiersBadges(item.modifiers);
    const tacBadges = renderTacticalBadges(item);
    const modesHtml = renderModesPills(item, item.activeModeId, '');
    const isEditMode = Boolean(_drawerState.forgeEditMode);
    const actionBtnLabel = isEditMode ? 'Save Changes to Item' : 'Add to Inventory';
    const actionBtnIcon = isEditMode ? '⚒️' : '➕';
    const actionBtnClass = isEditMode
      ? 'px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-1.5'
      : 'px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-1.5';

    container.innerHTML = `
      <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">V2 ASSEMBLED ITEM</span>
            <span class="text-[11px] font-mono text-slate-400">ID: ${escapeHtml(item.id)}</span>
          </div>
          <h4 class="text-base font-black text-white mt-1">${escapeHtml(item.name)}</h4>
        </div>
        <div class="flex items-center gap-3 text-right">
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-bold">Market Price</div>
            <div class="text-sm font-black font-mono text-amber-400">${Number(item.priceGp ?? item.cost ?? 0).toLocaleString('en-US')} gp</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-bold">Weight</div>
            <div class="text-sm font-bold font-mono text-slate-200">${item.weightLb ?? item.weight ?? 0} lb.</div>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        ${dmgBadges ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Damage Parts (damageParts):</span><div class="flex flex-wrap gap-1.5">${dmgBadges}</div></div>` : ''}
        ${modBadges ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Active Bonuses (modifiers):</span><div class="flex flex-wrap gap-1.5">${modBadges}</div></div>` : ''}
        ${tacBadges ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Tactical Flags &amp; Badges:</span><div class="flex flex-wrap gap-1.5">${tacBadges}</div></div>` : ''}
        ${modesHtml ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Embedded Modes (modes):</span>${modesHtml}</div>` : ''}
      </div>

      <div class="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
        <button type="button" onclick="DnDUI.equipAssembledForgeItem()" class="${actionBtnClass}">
          <span>${actionBtnIcon}</span>
          <span>${actionBtnLabel}</span>
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

  function cleanSrdDescriptionText(raw) {
    if (!raw || typeof raw !== 'string') return 'No description available.';
    return raw
      .replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:th|td)>/gi, '  ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() || 'No description available.';
  }

  async function openCompendiumDrawer(options = {}) {
    ensureCompendiumDrawerDom();
    mountCustomTabContentIfPresent();

    _drawerState.onEquipCallback = options.onEquip || options.onSelect || null;
    _drawerState.forgeEditMode = Boolean(options.editMode);
    const rawTab = options.tab || options.defaultTab || options.category || 'custom';
    const isBestiaryMode = Boolean(options.bestiaryOnly || rawTab === 'Monster');
    const hasCustomMounted = Boolean(document.getElementById('add-pool-custom-tab-content'));

    let initialTab = hasCustomMounted ? 'custom' : 'srd';
    if (isBestiaryMode) {
      initialTab = 'Monster';
    } else if (rawTab === 'forge' || options.forgeItem) {
      initialTab = 'forge';
    } else if (hasCustomMounted) {
      initialTab = 'custom';
    } else {
      initialTab = 'srd';
    }

    const initialQuery = options.query || '';

    const tabsBar = document.getElementById('dnd-ui-compendium-tabs-bar');
    const subFiltersBar = document.getElementById('dnd-ui-compendium-srd-subfilters');
    const iconEl = document.getElementById('dnd-ui-compendium-icon');
    const titleEl = document.getElementById('dnd-ui-compendium-title');
    const subEl = document.getElementById('dnd-ui-compendium-subtitle');
    const input = document.getElementById('dnd-ui-compendium-input');

    if (isBestiaryMode) {
      if (tabsBar) tabsBar.classList.add('hidden');
      if (subFiltersBar) subFiltersBar.classList.add('hidden');
      if (iconEl) iconEl.textContent = '👹';
      if (titleEl) titleEl.textContent = 'D&D 3.5e Bestiary';
      if (subEl) subEl.textContent = 'Search & import official SRD 3.5e monsters into your campaign';
      if (input) input.placeholder = 'Search Bestiary monsters (e.g. Aboleth, Dragon, Goblin, Balor)...';
    } else if (_drawerState.forgeEditMode && options.forgeItem) {
      if (tabsBar) tabsBar.classList.remove('hidden');
      if (subFiltersBar) subFiltersBar.classList.remove('hidden');
      if (iconEl) iconEl.textContent = '⚒️';
      if (titleEl) titleEl.textContent = `Item Forge — Customize ${options.forgeItem.name || 'Item'}`;
      if (subEl) subEl.textContent = 'Modify base weapon/armor, special materials, enhancement bonus & magical properties';
      if (input) input.placeholder = 'Search 3,522 SRD entries (e.g. Longsword, Full Plate, Ring, Cloak)...';
    } else {
      if (tabsBar) tabsBar.classList.remove('hidden');
      if (subFiltersBar) subFiltersBar.classList.remove('hidden');
      if (iconEl) iconEl.textContent = '🎒';
      if (titleEl) titleEl.textContent = 'Add Item to Inventory';
      if (subEl) subEl.textContent = 'Spotlight Search (SRD 3.5e, Custom DB & AI) • V2 Item Forge';
      if (input) input.placeholder = 'Search 3,522 SRD entries (e.g. Longsword, Full Plate, Ring, Cloak)...';
    }

    const drawer = document.getElementById('dnd-ui-compendium-drawer');
    if (drawer) drawer.classList.remove('hidden');
    _drawerState.isOpen = true;

    if (input) input.value = initialQuery;
    _drawerState.query = initialQuery;

    if (global.SrdCompendium && typeof global.SrdCompendium.init === 'function') {
      if (typeof global.SrdCompendium.isReady !== 'function' || !global.SrdCompendium.isReady()) {
        await global.SrdCompendium.init();
      }
    }
    updateSrdSubFilterButtonsUI();

    await switchCompendiumTab(initialTab);
    if (options.forgeItem) {
      populateForgeFromItem(options.forgeItem);
    }
    if (initialTab === 'srd' || initialTab === 'Monster') {
      if (input) setTimeout(() => input.focus(), 40);
    } else if (initialTab === 'custom') {
      const poolSearch = document.getElementById('pool-modal-search');
      if (poolSearch) setTimeout(() => poolSearch.focus(), 40);
    }
  }

  function closeCompendiumDrawer() {
    const drawer = document.getElementById('dnd-ui-compendium-drawer');
    if (drawer) drawer.classList.add('hidden');
    _drawerState.isOpen = false;
  }

  function updateSrdSubFilterButtonsUI() {
    const current = _drawerState.srdCategoryFilter || 'all_gear';
    document.querySelectorAll('[data-srd-sub]').forEach(btn => {
      const sub = btn.getAttribute('data-srd-sub');
      btn.className = sub === current
        ? 'px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer bg-indigo-600/30 text-indigo-200 border border-indigo-500/50'
        : 'px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer bg-slate-900 text-slate-400 hover:text-white border border-slate-800';
    });
  }

  async function setSrdSubFilter(subKey) {
    _drawerState.srdCategoryFilter = subKey || 'all_gear';
    updateSrdSubFilterButtonsUI();
    await executeCompendiumDrawerSearch(_drawerState.query);
  }

  async function jumpToCustomAiTabWithQuery(queryStr) {
    await switchCompendiumTab('custom');
    const q = (queryStr || '').trim();
    const poolSearch = document.getElementById('pool-modal-search');
    if (poolSearch && q) {
      poolSearch.value = q;
      if (typeof global.onPoolModalSearchInput === 'function') {
        global.onPoolModalSearchInput(q);
      }
      setTimeout(() => poolSearch.focus(), 50);
    }
  }

  async function switchCompendiumTab(tab) {
    mountCustomTabContentIfPresent();
    _drawerState.activeTab = tab;

    document.querySelectorAll('[data-comp-tab]').forEach(btn => {
      if (btn.classList.contains('hidden')) return;
      const t = btn.getAttribute('data-comp-tab');
      const isActive = (t === tab) || (t === 'srd' && (tab === 'Weapon' || tab === 'Armor' || tab === 'Item'));
      btn.className = isActive
        ? 'w-full py-2 px-3 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 bg-slate-800/95 text-amber-300 border border-amber-500/50 shadow-sm'
        : 'w-full py-2 px-3 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-slate-400 hover:text-white bg-slate-900/50 border border-slate-800';
    });

    const searchView = document.getElementById('dnd-ui-compendium-search-view');
    const forgeView = document.getElementById('dnd-ui-compendium-forge-view');
    const customView = document.getElementById('dnd-ui-compendium-custom-view');

    if (tab === 'forge') {
      if (searchView) searchView.classList.add('hidden');
      if (customView) customView.classList.add('hidden');
      if (forgeView) forgeView.classList.remove('hidden');
      populateForgeControls();
      updateForgePreview();
      return;
    }

    if (tab === 'custom') {
      if (searchView) searchView.classList.add('hidden');
      if (forgeView) forgeView.classList.add('hidden');
      if (customView) customView.classList.remove('hidden');
      const poolSearch = document.getElementById('pool-modal-search');
      if ((!poolSearch || !poolSearch.value.trim()) && typeof global.renderUnaddedMasterDbItems === 'function') {
        global.renderUnaddedMasterDbItems('all');
      }
      return;
    }

    if (searchView) searchView.classList.remove('hidden');
    if (forgeView) forgeView.classList.add('hidden');
    if (customView) customView.classList.add('hidden');

    await executeCompendiumDrawerSearch(_drawerState.query);
  }

  function parseCompendiumInlineQuery(raw) {
    let working = String(raw || '').trim();
    const filters = {};
    const chips = [];

    const prefixMatch = working.match(/^(armor|shield|weapon|ring|wondrous|item)\s*:\s*/i);
    if (prefixMatch) {
      const pKey = prefixMatch[1].toLowerCase();
      const mapType = {
        armor: ['Armor', 'Shield'],
        shield: ['Shield'],
        weapon: ['Weapon'],
        ring: ['Ring', 'MagicItem', 'Item'],
        wondrous: ['Wondrous Item', 'MagicItem', 'Item'],
        item: ['Item', 'MagicItem', 'Consumable', 'Tool']
      };
      filters.type = mapType[pKey] || [pKey];
      chips.push({ label: `TYPE: ${pKey.toUpperCase()}`, color: 'bg-indigo-950/90 text-indigo-300 border-indigo-500/60' });
      working = working.slice(prefixMatch[0].length).trim();
    }

    const tokenRegex = /\b(type|slot|lvl|level|elig|pack)\s*:\s*("[^"]+"|'[^']+'|[^\s,;]+)/gi;
    working = working.replace(tokenRegex, (_, rawKey, rawVal) => {
      const k = rawKey.toLowerCase();
      const v = String(rawVal || '').replace(/^['"]|['"]$/g, '').trim();
      if (!v) return '';
      if (k === 'type') {
        filters.type = v.toLowerCase() === 'armor' ? ['Armor', 'Shield'] : v;
        chips.push({ label: `TYPE: ${v.toUpperCase()}`, color: 'bg-indigo-950/90 text-indigo-300 border-indigo-500/60' });
      } else if (k === 'slot') {
        filters.slot = v;
        chips.push({ label: `SLOT: ${v.toUpperCase()}`, color: 'bg-sky-950/90 text-sky-300 border-sky-500/60' });
      } else if (k === 'lvl' || k === 'level') {
        filters.level = Number(v);
        chips.push({ label: `LVL ${v}`, color: 'bg-purple-950/90 text-purple-300 border-purple-500/60' });
      } else if (k === 'elig') {
        filters.elig = v.toLowerCase();
        chips.push({ label: `ELIG: ${v.toUpperCase()}`, color: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60' });
      } else if (k === 'pack') {
        filters.pack = v.toLowerCase();
        chips.push({ label: `PACK: ${v}`, color: 'bg-amber-950/90 text-amber-300 border-amber-500/60' });
      }
      return ' ';
    }).replace(/\s+/g, ' ').trim();

    const tokenBar = typeof document !== 'undefined' ? document.getElementById('dnd-ui-compendium-token-bar') : null;
    if (tokenBar) {
      if (chips.length > 0) {
        let html = `<span class="text-slate-500 font-bold uppercase text-[9px]">Tokens:</span>` +
          chips.map(c => `<span class="px-1.5 py-0.5 rounded border font-bold ${c.color}">${escapeHtml(c.label)}</span>`).join('');
        if (working) {
          html += `<span class="px-1.5 py-0.5 rounded border bg-slate-900 text-slate-300 border-slate-700">QUERY: "${escapeHtml(working)}"</span>`;
        }
        tokenBar.innerHTML = html;
        tokenBar.classList.remove('hidden');
      } else {
        tokenBar.innerHTML = '';
        tokenBar.classList.add('hidden');
      }
    }

    return { cleanQuery: working, filters, chips };
  }

  async function onCompendiumSearchInput(val) {
    _drawerState.query = val || '';
    await executeCompendiumDrawerSearch(_drawerState.query);
  }

  async function onCompendiumInputKeydown(event) {
    if (!event) return;
    const results = Array.isArray(_drawerState.results) ? _drawerState.results : [];
    if (!results.length) return;
    const curIdx = typeof _drawerState.selectedIndex === 'number' ? _drawerState.selectedIndex : 0;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIdx = (curIdx + 1) % results.length;
      await selectCompendiumEntry(nextIdx);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIdx = (curIdx - 1 + results.length) % results.length;
      await selectCompendiumEntry(prevIdx);
    } else if (event.key === 'Tab') {
      const sel = results[curIdx];
      const input = document.getElementById('dnd-ui-compendium-input');
      if (sel && sel.name && input) {
        event.preventDefault();
        input.value = sel.name;
        _drawerState.query = sel.name;
        await executeCompendiumDrawerSearch(sel.name);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      equipSelectedCompendiumEntry();
    }
  }

  async function executeCompendiumDrawerSearch(query) {
    const listEl = document.getElementById('dnd-ui-compendium-list');
    if (!listEl || !global.SrdCompendium) return;

    const parsedQ = parseCompendiumInlineQuery(query || '');
    const cleanQuery = parsedQ.cleanQuery;
    const inlineFilters = parsedQ.filters || {};
    const reqId = ++_drawerState._searchSeq;

    const filters = { limit: (inlineFilters.pack || inlineFilters.elig) ? 500 : 60 };
    if (_drawerState.activeTab === 'Monster') {
      filters.type = ['Monster'];
    } else if (_drawerState.activeTab === 'srd' || _drawerState.activeTab === 'Weapon' || _drawerState.activeTab === 'Armor' || _drawerState.activeTab === 'Item') {
      const sub = _drawerState.srdCategoryFilter || 'all_gear';
      const subMap = {
        all_gear: ['Weapon', 'Armor', 'Shield', 'Item', 'MagicItem', 'AugmentationCrystal', 'Consumable', 'Ammo', 'Tool'],
        Armor: ['Armor', 'Shield'],
        Weapon: ['Weapon'],
        Consumable: ['Consumable', 'Ammo'],
        Crystal: ['AugmentationCrystal'],
        Item: ['Item', 'MagicItem', 'Tool']
      };
      filters.type = subMap[sub] || subMap.all_gear;
    } else if (_drawerState.activeTab !== 'all') {
      const tabMap = {
        Feat: ['Feat'],
        Spell: ['Spell', 'Power'],
        Condition: ['Condition', 'Rule']
      };
      filters.type = tabMap[_drawerState.activeTab] || _drawerState.activeTab;
    }

    if (inlineFilters.type) {
      filters.type = Array.isArray(inlineFilters.type) ? inlineFilters.type : [inlineFilters.type];
    }
    if (inlineFilters.slot) {
      filters.slot = inlineFilters.slot;
    }
    if (inlineFilters.level !== undefined && !Number.isNaN(inlineFilters.level)) {
      filters.level = inlineFilters.level;
    }

    let results = await global.SrdCompendium.search(cleanQuery || '', filters);
    if (reqId !== _drawerState._searchSeq) return;
    results = Array.isArray(results) ? results.slice() : [];

    // Apply inline pack: and elig: filters if present
    if (inlineFilters.pack) {
      results = results.filter(r => {
        const pStr = (typeof r?.pack === 'object' && r.pack !== null)
          ? String(r.pack.id || r.pack.name || '')
          : String(r?.pack || '');
        return pStr.toLowerCase().includes(inlineFilters.pack);
      });
    }
    if (inlineFilters.elig && global.RuleMaster && typeof global.RuleMaster.evaluateEntryEligibilityForCharacter === 'function') {
      const ef = inlineFilters.elig;
      results = results.filter(r => {
        const elig = global.RuleMaster.evaluateEntryEligibilityForCharacter(r);
        if (ef === 'synergy') return elig.status === 'SYNERGY_READY';
        if (ef === 'no' || ef === 'locked' || ef === 'missing') return !elig.met;
        if (ef === 'yes' || ef === 'ok' || ef === 'elig' || ef === 'eligible') return elig.met;
        return true;
      });
    }
    if (results.length > 60) results = results.slice(0, 60);

    // Natural Language Lego Item Synthesis inside Spotlight Search
    const isGearDrawer = _drawerState.activeTab !== 'Monster' && _drawerState.activeTab !== 'Feat' && _drawerState.activeTab !== 'Spell';
    if (cleanQuery && cleanQuery.length >= 3 && isGearDrawer) {
      let synthItem = null;
      if (global.RuleMaster && typeof global.RuleMaster.resolveLocalZeroTokenQuery === 'function') {
        try {
          const hits = global.RuleMaster.resolveLocalZeroTokenQuery(cleanQuery);
          if (Array.isArray(hits) && hits.length > 0) {
            const top = hits[0];
            if (top && (top._isAssembledLego || top.enhancementBonus > 0 || top.material || (Array.isArray(top.enhancements) && top.enhancements.length > 0) || top.source === 'ItemAssembler-ZeroToken')) {
              synthItem = top;
            }
          }
        } catch (_) {}
      }
      if (!synthItem && global.ItemAssembler && typeof global.ItemAssembler.parseNaturalLanguageItem === 'function') {
        try {
          const parsed = global.ItemAssembler.parseNaturalLanguageItem(cleanQuery);
          if (parsed && (parsed.enhancementBonus > 0 || parsed.material || (Array.isArray(parsed.enhancements) && parsed.enhancements.length > 0) || parsed.masterwork)) {
            synthItem = parsed;
          }
        } catch (_) {}
      }
      if (synthItem && !results.some(r => r && String(r.name || '').toLowerCase() === String(synthItem.name || '').toLowerCase())) {
        const clonedSynth = Object.assign({}, synthItem, { _instantForgeSynthesis: true, _isAssembledLego: true });
        results.unshift(clonedSynth);
      }
    }

    _drawerState.results = results;
    _drawerState.selectedIndex = 0;

    if (_drawerState.results.length === 0) {
      const safeQ = escapeHtml(query || '');
      const hasCustomTab = Boolean(document.getElementById('add-pool-custom-tab-content')) && _drawerState.activeTab !== 'Monster';
      listEl.innerHTML = `
        <div class="p-6 text-center space-y-3">
          <div class="text-slate-400 text-xs italic">No matching SRD V2 entries found${safeQ ? ` for "${safeQ}"` : ''}.</div>
          ${hasCustomTab ? `
            <button type="button" onclick="DnDUI.jumpToCustomAiTabWithQuery('${safeQ.replace(/'/g, "\\'")}')" class="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition cursor-pointer inline-flex items-center gap-1.5">
              <span>🔍</span>
              <span>Search in Spotlight / Rule Master AI ➔</span>
            </button>
          ` : ''}
        </div>
      `;
      const detailEl = document.getElementById('dnd-ui-compendium-detail');
      if (detailEl) detailEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = _drawerState.results.map((r, idx) => {
      let badgesHtml = '';
      if (r._instantForgeSynthesis) {
        badgesHtml += `<span class="px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-600/60 text-[9px] font-mono font-bold">⚒️ Instant Forge Assembly</span>`;
      }
      if (Array.isArray(r._parseWarnings) && r._parseWarnings.length > 0) {
        r._parseWarnings.forEach(w => {
          badgesHtml += `<span class="px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-500/50 text-[9px] font-mono font-semibold">⚠️ ${escapeHtml(w)}</span>`;
        });
      }
      const hasPrereqOrFeat = Boolean(r.requires || (r.prereq && r.prereq !== '-') || r.type === 'Feat' || r.type === 'DM Boon');
      if (hasPrereqOrFeat && global.RuleMaster && typeof global.RuleMaster.evaluateEntryEligibilityForCharacter === 'function') {
        const elig = global.RuleMaster.evaluateEntryEligibilityForCharacter(r);
        if (elig.status === 'SYNERGY_READY') {
          badgesHtml += `<span class="px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-600/60 text-[9px] font-mono font-bold">✨ Synergy Ready</span>`;
        } else if (elig.status === 'PREREQ_MISSING') {
          badgesHtml += `<span class="px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-700/60 text-[9px] font-mono font-bold">🔒 Missing Prereq</span>`;
        } else if (r.requires || (r.prereq && r.prereq !== '-')) {
          badgesHtml += `<span class="px-1.5 py-0.5 rounded bg-teal-950/90 text-teal-300 border border-teal-700/60 text-[9px] font-mono font-bold">✅ Eligible</span>`;
        }
      }
      return `
      <div data-comp-row-idx="${idx}" onclick="DnDUI.selectCompendiumEntry(${idx})" class="p-2.5 hover:bg-slate-900/90 cursor-pointer transition flex items-center justify-between gap-2 ${idx === 0 ? 'bg-indigo-950/50' : ''}">
        <div class="min-w-0 flex-1">
          <div class="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
            <span class="truncate">${escapeHtml(r.name)}</span>
            ${badgesHtml}
          </div>
          <div class="text-[10px] text-slate-400 font-mono truncate">${escapeHtml(r.type || 'SRD')}${r.category ? ` • ${escapeHtml(r.category)}` : ''}${r.level !== undefined && r.type === 'Monster' ? ` • CR ${escapeHtml(r.level)}` : ''}</div>
        </div>
        <span class="text-xs text-slate-500">›</span>
      </div>
    `;
    }).join('');

    await selectCompendiumEntry(0);
  }

  async function selectCompendiumEntry(idx) {
    _drawerState.selectedIndex = idx;
    const item = _drawerState.results[idx];
    const detailEl = document.getElementById('dnd-ui-compendium-detail');
    if (!item || !detailEl || !global.SrdCompendium) return;

    const listEl = document.getElementById('dnd-ui-compendium-list');
    if (listEl) {
      listEl.querySelectorAll('[data-comp-row-idx]').forEach(row => {
        const rIdx = Number(row.getAttribute('data-comp-row-idx'));
        row.classList.toggle('bg-indigo-950/50', rIdx === idx);
      });
    }

    let full = item;
    if (!(item._isAssembledLego || item._instantForgeSynthesis)) {
      if (typeof global.SrdCompendium.fetchEntry === 'function') {
        full = (await global.SrdCompendium.fetchEntry(item.id, item.type)) || item;
      } else if (typeof global.SrdCompendium.getById === 'function') {
        full = global.SrdCompendium.getById(item.id) || item;
      }
    }
    _drawerState.selectedEntry = full;

    const isMonster = full.type === 'Monster' || String(full.id || '').startsWith('mst-');
    const actionBtnLabel = isMonster ? 'Add to Campaign' : 'Add to Inventory';
    const dmgHtml = renderDamagePartsBadges(full.damageParts);
    const modHtml = renderModifiersBadges(full.modifiers);
    const tacHtml = renderTacticalBadges(full);
    const modesHtml = renderModesPills(full, full.activeModeId, '');
    const cleanDesc = cleanSrdDescriptionText(full.description || full.benefit || full.shortDescription);

    const monsterStatStrip = isMonster ? `
      <div class="grid grid-cols-4 gap-2 text-center">
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
          <div class="text-[10px] text-slate-400 uppercase font-bold">CR</div>
          <div class="text-xs font-black font-mono text-amber-400">${escapeHtml(full.cr ?? full.level ?? '1')}</div>
        </div>
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
          <div class="text-[10px] text-slate-400 uppercase font-bold">HP</div>
          <div class="text-xs font-black font-mono text-emerald-400">${escapeHtml(full.hp ?? '—')}</div>
        </div>
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
          <div class="text-[10px] text-slate-400 uppercase font-bold">AC</div>
          <div class="text-xs font-black font-mono text-sky-400">${escapeHtml(full.ac?.total ?? full.ac ?? '10')}</div>
        </div>
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
          <div class="text-[10px] text-slate-400 uppercase font-bold">Init</div>
          <div class="text-xs font-black font-mono text-indigo-300">${Number(full.init || 0) >= 0 ? `+${Number(full.init || 0)}` : Number(full.init || 0)}</div>
        </div>
      </div>
    ` : '';

    detailEl.innerHTML = `
      <div class="border-b border-slate-800 pb-3 flex items-center justify-between gap-2">
        <div class="min-w-0">
          <span class="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-[10px] font-mono">${escapeHtml(full.size ? `${full.size} ` : '')}${escapeHtml(full.category || full.type || 'SRD')}</span>
          <h4 class="text-base font-black text-amber-300 mt-1 truncate">${escapeHtml(full.name)}</h4>
        </div>
        <button type="button" onclick="DnDUI.equipSelectedCompendiumEntry()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer shrink-0 flex items-center gap-1.5">
          <span>➕</span>
          <span>${actionBtnLabel}</span>
        </button>
      </div>

      ${monsterStatStrip}

      ${(dmgHtml || modHtml || tacHtml) ? `
        <div class="space-y-2 bg-slate-900/70 border border-slate-800 rounded-xl p-3">
          ${dmgHtml ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Damage Parts:</span><div class="flex flex-wrap gap-1">${dmgHtml}</div></div>` : ''}
          ${modHtml ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Active Modifiers (modifiers):</span><div class="flex flex-wrap gap-1">${modHtml}</div></div>` : ''}
          ${tacHtml ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Tactical Flags:</span><div class="flex flex-wrap gap-1">${tacHtml}</div></div>` : ''}
          ${modesHtml ? `<div><span class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Embedded Modes:</span>${modesHtml}</div>` : ''}
        </div>
      ` : ''}

      <div class="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 max-h-80 overflow-y-auto">
        ${escapeHtml(cleanDesc)}
      </div>
    `;
  }

  // Tier-2 (lazy chunk) entries are copied into the character's customDb as an `srd-snapshot`
  // so the sheet keeps resolving them without the chunk. Monsters are campaign data, not copied.
  // The chunk is already in memory here: selectCompendiumEntry() loaded it via fetchEntry().
  function snapshotLazyEntryIntoCustomDb(entry) {
    const comp = global.SrdCompendium;
    if (!entry || !entry.id || entry.type === 'Monster' || !comp || typeof comp.isLazyEntry !== 'function') return null;
    if (!comp.isLazyEntry(entry.id) || !Array.isArray(global.masterDb)) return null;
    // Already in this character's customDb (an earlier snapshot or the user's own version): use it as is.
    const existing = global.masterDb.find(e => e && e.id === entry.id);
    if (existing) return existing;
    const snap = comp.snapshotLoadedEntry(entry.id);
    if (!snap) return null;
    comp.upsertSnapshot(global.masterDb, snap);
    return global.masterDb.find(e => e && e.id === snap.id) || snap;
  }

  function equipSelectedCompendiumEntry() {
    const entry = _drawerState.selectedEntry;
    if (!entry) return;
    const snapshot = snapshotLazyEntryIntoCustomDb(entry);
    if (typeof _drawerState.onEquipCallback === 'function') {
      _drawerState.onEquipCallback(snapshot || entry);
      closeCompendiumDrawer();
      return;
    }
    if (global.RuleMaster && typeof global.RuleMaster.equipItem === 'function') {
      if (snapshot) {
        global.RuleMaster.equipItem(snapshot);
      } else {
        if (global.RuleMaster.saveEntry) global.RuleMaster.saveEntry(entry);
        global.RuleMaster.equipItem(entry); // equipItem expects the entry object (an id string crashed in ensureV2/type checks)
      }
      closeCompendiumDrawer();
    }
  }

  // Shared Modal Accessibility (role="dialog", aria-modal="true") & Global Escape Key Dismissal
  function initSharedModalAccessibility() {
    if (typeof document === 'undefined') return;
    const modalSelectors = '[id$="-modal"], [id^="modal-"]';
    document.querySelectorAll(modalSelectors).forEach((el) => {
      if (el && !el.getAttribute('role')) {
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
      }
    });
  }

  if (typeof global.addEventListener === 'function') {
    global.addEventListener('srdCompendiumReady', () => {
      populateForgeControls();
    });
    global.addEventListener('DOMContentLoaded', () => {
      initSharedModalAccessibility();
    });
    global.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (typeof document === 'undefined') return;

      // 1. Close SRD Compendium & Forge Drawer if open
      const drawer = document.getElementById('dndui-compendium-drawer');
      if (drawer && !drawer.classList.contains('hidden')) {
        e.preventDefault();
        closeCompendiumDrawer();
        return;
      }

      // 2. Close topmost visible dialog modal (excluding Vault PIN Lock Modal)
      const candidates = Array.from(
        document.querySelectorAll('[role="dialog"]:not(.hidden), [id$="-modal"]:not(.hidden), [id^="modal-"]:not(.hidden)')
      ).filter((el) => {
        if (!el || el.id === 'vault-lock-modal') return false;
        const style = global.getComputedStyle ? global.getComputedStyle(el) : null;
        return !style || (style.display !== 'none' && style.visibility !== 'hidden');
      });

      if (candidates.length === 0) return;

      // Pick topmost modal by computed z-index (ties broken by later DOM order)
      let topModal = candidates[candidates.length - 1];
      let bestZ = -1;
      candidates.forEach((el) => {
        const z = parseInt((global.getComputedStyle && global.getComputedStyle(el).zIndex) || '0', 10) || 0;
        if (z >= bestZ) {
          bestZ = z;
          topModal = el;
        }
      });

      if (topModal) {
        e.preventDefault();
        const closeBtn = topModal.querySelector('button[onclick^="close"], button[onclick*="CloseModal"], button[onclick*="dismiss"]');
        if (closeBtn && typeof closeBtn.click === 'function') {
          closeBtn.click();
        } else {
          topModal.classList.add('hidden');
        }
      }
    });
  }

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
    setSrdSubFilter,
    jumpToCustomAiTabWithQuery,
    onCompendiumSearchInput,
    onCompendiumInputKeydown,
    parseCompendiumInlineQuery,
    selectCompendiumEntry,
    equipSelectedCompendiumEntry,
    onForgeNaturalLanguageInput,
    onForgeEnhSearchInput,
    onForgeControlChange,
    setForgeBaseTypeFilter,
    populateForgeFromItem,
    updateForgePreview,
    equipAssembledForgeItem
  };

})(typeof window !== 'undefined' ? window : globalThis);
