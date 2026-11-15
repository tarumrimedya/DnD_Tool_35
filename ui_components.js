/**
 * ============================================================================
 * JOYFUL-FERMI D&D 3.5e — DECLARATIVE UI PRIMITIVES & ACTION ROUTER (R2)
 * ============================================================================
 * Provides:
 *   1. `UI.html` / `UI.raw` / `UI.render`: Auto-escaped tagged template
 *      engine preventing XSS and eliminating string-concatenation breakage.
 *   2. Reusable primitives (`UI.Badge`, `UI.Button`, `UI.Card`,
 *      `UI.SectionHeader`, `UI.EmptyState`).
 *   3. `Actions`: Document-level delegated event router (`data-action="..."`,
 *      `data-change-action="..."`, `data-input-action="..."`,
 *      `data-submit-action="..."`, `data-keydown-action="..."`,
 *      `data-keyup-action="..."`) replacing inline event attributes.
 * ============================================================================
 */
(function (root) {
  'use strict';

  function escapeHtml(val) {
    if (val === null || val === undefined || val === false) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(val) {
    if (val === null || val === undefined || val === false) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '&#10;')
      .replace(/\r/g, '&#13;');
  }

  /**
   * Escapes a value for a quoted JavaScript string inside an inline handler attribute, as in
   * `fn('${UI.escapeJsString(name)}')`. Every character outside a small safe set
   * becomes a `\uXXXX` escape, so the result holds no quote, backslash, angle bracket or
   * ampersand: neither the HTML attribute parser nor the JS string parser can be broken out of,
   * and the handler receives the original text.
   */
  function escapeJsString(val) {
    if (val === null || val === undefined || val === false) return '';
    return String(val).replace(/[^A-Za-z0-9 _.,:;!?()\[\]@#%^*+=|~\/-]/g, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
  }

  function raw(str) {
    const out = (str === null || str === undefined || str === false) ? '' : String(str);
    return {
      __uiRaw: true,
      value: out,
      toString() {
        return out;
      }
    };
  }

  function renderInterpolatedValue(val) {
    if (val === null || val === undefined || val === false) return '';
    if (Array.isArray(val)) {
      let joined = '';
      for (let i = 0; i < val.length; i++) {
        joined += renderInterpolatedValue(val[i]);
      }
      return joined;
    }
    if (typeof val === 'object' && val.__uiRaw === true) {
      return String(val.value ?? '');
    }
    return escapeHtml(val);
  }

  function html(strings, ...values) {
    if (!Array.isArray(strings)) {
      return raw(escapeHtml(strings));
    }
    let out = '';
    for (let i = 0; i < strings.length; i++) {
      out += strings[i];
      if (i < values.length) {
        out += renderInterpolatedValue(values[i]);
      }
    }
    return raw(out);
  }

  function render(container, tpl) {
    if (!container) return '';
    const htmlStr = (tpl && typeof tpl === 'object' && tpl.__uiRaw === true)
      ? String(tpl.value ?? '')
      : renderInterpolatedValue(tpl);
    container.innerHTML = htmlStr;
    return htmlStr;
  }

  function toKebabCase(key) {
    return String(key || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/_/g, '-')
      .toLowerCase();
  }

  function renderDatasetAttrs(dataset) {
    if (!dataset || typeof dataset !== 'object') return raw('');
    const parts = [];
    for (const [k, v] of Object.entries(dataset)) {
      if (v === undefined || v === null || v === false) continue;
      const attrName = k.startsWith('data-') ? k : `data-${toKebabCase(k)}`;
      parts.push(`${attrName}="${escapeAttr(v)}"`);
    }
    return raw(parts.length > 0 ? ' ' + parts.join(' ') : '');
  }

  const BADGE_VARIANTS = {
    slate: 'bg-slate-800 text-slate-300 border border-slate-600',
    emerald: 'bg-emerald-950 text-emerald-300 border border-emerald-700',
    healing: 'bg-emerald-950 text-emerald-300 border border-emerald-700',
    rose: 'bg-rose-950 text-rose-300 border border-rose-700',
    damage: 'bg-rose-950 text-rose-300 border border-rose-700',
    purple: 'bg-purple-950 text-purple-300 border border-purple-700',
    sky: 'bg-sky-950 text-sky-300 border border-sky-700',
    amber: 'bg-amber-950 text-amber-300 border border-amber-700',
    indigo: 'bg-indigo-950 text-indigo-300 border border-indigo-700'
  };

  const BUTTON_VARIANTS = {
    slate: 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-600',
    emerald: 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/40',
    rose: 'bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/40',
    purple: 'bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/40',
    sky: 'bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white border-sky-500/40',
    amber: 'bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border-amber-500/40',
    indigo: 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border-indigo-500/40'
  };

  function Badge(opts = {}) {
    const {
      text = '',
      variant = 'slate',
      size = 'xs',
      className = '',
      mono = false
    } = opts;
    const vClass = BADGE_VARIANTS[variant] || variant || BADGE_VARIANTS.slate;
    const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.2' : 'text-[10px] px-1.5 py-0.2';
    const monoClass = mono ? 'font-mono' : '';
    const classes = ['badge', vClass, sizeClass, monoClass, className].filter(Boolean).join(' ');
    return html`<span class="${classes}">${text}</span>`;
  }

  function Button(opts = {}) {
    const {
      label = '',
      icon = '',
      tier = 'sm',
      variant = 'slate',
      action = '',
      dataset = {},
      disabled = false,
      title = '',
      className = ''
    } = opts;
    const tierClass = tier === 'md'
      ? 'ui-btn-md'
      : (tier === 'xs' ? 'ui-btn-xs' : (tier === 'icon-sm' ? 'ui-btn-icon-sm' : 'ui-btn-sm'));
    const vClass = BUTTON_VARIANTS[variant] || variant || BUTTON_VARIANTS.slate;
    const classes = [
      tierClass,
      'shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-1.5 border font-bold transition disabled:opacity-30 disabled:cursor-not-allowed',
      vClass,
      className
    ].filter(Boolean).join(' ');

    const mergedDataset = Object.assign({}, dataset);
    if (action) mergedDataset.action = action;
    const dataAttrs = renderDatasetAttrs(mergedDataset);
    const disabledAttr = disabled ? raw(' disabled') : raw('');
    const titleAttr = title ? raw(` title="${escapeAttr(title)}"`) : raw('');

    return html`<button type="button" class="${classes}"${dataAttrs}${disabledAttr}${titleAttr}>${icon ? html`<span>${icon}</span>` : ''}${label ? html`<span>${label}</span>` : ''}</button>`;
  }

  function Card(opts = {}) {
    const {
      body = '',
      borderClass = 'border-slate-700',
      className = '',
      dataset = {}
    } = opts;
    const classes = [
      'bg-slate-900/90 border p-3 rounded-xl transition shadow-sm',
      borderClass,
      className
    ].filter(Boolean).join(' ');
    const dataAttrs = renderDatasetAttrs(dataset);
    return html`<div class="${classes}"${dataAttrs}>${body}</div>`;
  }

  function SectionHeader(opts = {}) {
    const {
      icon = '',
      title = '',
      count = null,
      badgeClass = 'bg-slate-800 text-slate-300 border-slate-600',
      rightContent = ''
    } = opts;
    return html`
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-1 pt-1.5">
        <div class="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          ${icon ? html`<span>${icon}</span>` : ''}
          <span>${title}</span>
          ${count !== null && count !== undefined ? html`<span class="badge ${badgeClass} text-[10px] ml-1 px-1.5 py-0.2">${count}</span>` : ''}
        </div>
        ${rightContent ? html`<div>${rightContent}</div>` : ''}
      </div>
    `;
  }

  function EmptyState(opts = {}) {
    const {
      text = 'No items found.',
      className = ''
    } = opts;
    const classes = [
      'text-center text-slate-500 italic py-4 bg-slate-900/50 rounded-xl border border-slate-800',
      className
    ].filter(Boolean).join(' ');
    return html`<div class="${classes}">${text}</div>`;
  }

  const CONSUMABLE_GROUPS = [
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

  function renderConsumablesView(container, consumablesGrouped) {
    const cg = (consumablesGrouped && consumablesGrouped.inventory && consumablesGrouped.inventory.consumablesGrouped)
      ? consumablesGrouped.inventory.consumablesGrouped
      : (consumablesGrouped || { allItems: [], byGroup: {} });
    const allItems = Array.isArray(cg.allItems) ? cg.allItems : [];

    if (allItems.length === 0) {
      const emptyTpl = EmptyState({ text: 'No consumables or charged items found on belt or in bag.' });
      return container ? render(container, emptyTpl) : emptyTpl.toString();
    }

    const sectionsTpl = CONSUMABLE_GROUPS.map(group => {
      const items = (cg.byGroup && Array.isArray(cg.byGroup[group.key])) ? cg.byGroup[group.key] : [];
      if (items.length === 0) return '';

      const cardsTpl = items.map(item => {
        const isDaily = item.isDaily !== undefined
          ? Boolean(item.isDaily)
          : Boolean(item.dailyCharges && typeof item.dailyCharges.max === 'number');
        const isExhausted = item.isExhausted !== undefined
          ? Boolean(item.isExhausted)
          : (isDaily ? (item.dailyCharges.current <= 0) : (item.qty <= 0));

        const chargeTpl = isDaily
          ? html`Daily Left: <strong class="${item.dailyCharges.current > 0 ? 'text-sky-300' : 'text-rose-400'}">${item.dailyCharges.current} / ${item.dailyCharges.max}</strong>`
          : html`Qty / Charges: <strong class="${item.qty > 0 ? 'text-white' : 'text-rose-400'}">${item.qty}</strong>`;

        let tagBadgeTpl = '';
        if (item.tagBadge && item.tagBadge.text) {
          const tbClass = item.tagBadge.variant === 'damage'
            ? 'bg-rose-950 text-rose-300 border border-rose-700'
            : 'bg-emerald-950 text-emerald-300 border border-emerald-700';
          tagBadgeTpl = html`<span class="badge ${tbClass} text-[10px] font-mono">${item.tagBadge.text}</span>`;
        }

        const targetId = item.sourceType === 'pool'
          ? String(item.poolId ?? '')
          : (item.sourceType === 'slot' ? String(item.slotKey ?? '') : String(item.idx ?? ''));

        return html`
          <div class="bg-slate-900/90 border ${group.cardBorder} p-3 rounded-xl flex items-center justify-between gap-3 transition shadow-sm ${isExhausted ? 'opacity-60' : ''}">
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>${item.name}</span>
                <span class="badge ${group.badgeBg} text-[10px] font-bold px-1.5 py-0.2">${group.badgeText}</span>
                ${item.isBelt ? html`<span class="badge bg-amber-950 text-amber-300 border border-amber-700 text-[10px]">On Belt</span>` : ''}
                ${item.fromSlot ? html`<span class="badge bg-sky-950 text-sky-300 border border-sky-700 text-[10px]">Equipped</span>` : ''}
                ${tagBadgeTpl}
              </div>
              <div class="text-[10px] text-slate-300 break-words mt-1 flex items-center gap-2 flex-wrap">
                <span>${item.effect}</span>
                <span class="border-l border-slate-700 pl-2 font-mono text-[11px]">${chargeTpl}</span>
              </div>
            </div>
            <button type="button" data-action="consumable:use" data-source-type="${item.sourceType}" data-id="${targetId}" ${isExhausted ? raw('disabled') : ''} class="shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${group.btnBg} disabled:opacity-30 disabled:cursor-not-allowed border text-xs font-bold px-3 py-1.5 rounded-lg transition self-center">
              <span>${group.btnIcon}</span>
              <span>${isExhausted ? 'Depleted' : group.btnText}</span>
            </button>
          </div>
        `;
      });

      return html`
        <div class="space-y-2">
          ${SectionHeader({
            icon: group.icon,
            title: group.title,
            count: items.length,
            badgeClass: group.badgeBg
          })}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            ${cardsTpl}
          </div>
        </div>
      `;
    });

    const fullTpl = html`${sectionsTpl}`;
    return container ? render(container, fullTpl) : fullTpl.toString();
  }

  // =========================================================================
  // UNIVERSAL ENTITY INSPECTOR & RULE CRAFTER CAPSULE (?embed=1)
  // Zero idle DOM overhead: modals and <iframe> are created on open and destroyed on close.
  // =========================================================================
  let _activeInspectorSpec = null;
  let _activeInspectorResolved = null;
  let _crafterCleanup = null;

  function _syncDnDUI() {
    if (typeof global !== 'undefined' && global.DnDUI && typeof global.DnDUI === 'object') {
      global.DnDUI.openEntityInspector = openEntityInspector;
      global.DnDUI.openRuleCrafter = openRuleCrafter;
    }
  }

  function _isSmallViewport() {
    return typeof window !== 'undefined' && window.innerWidth < 640;
  }

  function _formatBlockChipText(eff) {
    if (!eff || typeof eff !== 'object') return '';
    const t = String(eff.type || 'effect');
    if (t === 'stat') {
      const tgt = Array.isArray(eff.targets) ? eff.targets.join(', ') : (eff.target || 'stat');
      const val = eff.mode === 'formula' ? (eff.formula || '0') : ((Number(eff.value) >= 0 ? '+' : '') + (eff.value !== undefined ? eff.value : 0));
      const btype = eff.btype && eff.btype !== 'Untyped' ? ` (${eff.btype})` : '';
      return `${tgt} ${val}${btype}`;
    }
    if (t === 'roll') {
      const dice = eff.die === 'flat' ? String(eff.count || 0) : `${eff.count || 1}${eff.die || 'd6'}`;
      return `${eff.kind || 'Damage'} ${dice}${eff.dmgType ? ' ' + eff.dmgType : ''}`;
    }
    if (t === 'defense') {
      return `Defense: ${eff.defKind || eff.sense || eff.state || 'Trait'}`;
    }
    if (t === 'when') {
      return `When / While (${Array.isArray(eff.branches) ? eff.branches.length : 1} branch)`;
    }
    if (t === 'resource') {
      return `@${eff.varKey || eff.name || 'resource'}`;
    }
    if (t === 'carrier') {
      return `Carrier: ${eff.carrierMode || 'channel'}`;
    }
    if (t === 'attack') {
      return `Attack: ${eff.natural || eff.weaponMod || 'mod'}`;
    }
    return eff.summary || eff.name || eff.spell || `Rule: ${t}`;
  }

  function _collectRuleBlockSummaries(entry) {
    const chips = [];
    if (!entry || typeof entry !== 'object') return chips;
    if (Array.isArray(entry.effects)) {
      entry.effects.forEach((ef) => {
        const txt = _formatBlockChipText(ef);
        if (txt) chips.push(txt);
      });
    }
    if (!chips.length && Array.isArray(entry.modifiers)) {
      entry.modifiers.forEach((m) => {
        if (!m || !m.target) return;
        const val = m.formula !== undefined ? m.formula : ((Number(m.value) >= 0 ? '+' : '') + (m.value !== undefined ? m.value : 0));
        const tp = m.type && m.type !== 'Untyped' ? ` (${m.type})` : '';
        chips.push(`${m.target} ${val}${tp}`);
      });
    }
    if (!chips.length && Array.isArray(entry.damageParts)) {
      entry.damageParts.forEach((d) => {
        if (!d) return;
        const part = [d.dice || '', d.bonus ? ((d.bonus >= 0 ? '+' : '') + d.bonus) : '', d.type || ''].filter(Boolean).join(' ');
        if (part) chips.push(part);
      });
    }
    return chips;
  }

  function _collectStatChips(entry, kind) {
    const stats = [];
    if (!entry || typeof entry !== 'object') return stats;
    const addStat = (label, val) => {
      if (val === undefined || val === null || val === '') return;
      stats.push({ label, val: String(val) });
    };
    if (entry.damage) addStat('Damage', entry.damage);
    if (entry.crit) addStat('Crit', entry.crit);
    else if (entry.weapon && entry.weapon.critMultiplier) {
      const low = entry.weapon.effectiveCritRange || entry.weapon.baseCritRange || 20;
      addStat('Crit', `${low < 20 ? low + '-20' : '20'}/x${entry.weapon.critMultiplier}`);
    }
    if (entry.range) addStat('Range', entry.range);
    else if (entry.weapon && entry.weapon.rangeIncrement) addStat('Range', `${entry.weapon.rangeIncrement} ft.`);
    if (entry.armorBonus !== undefined) addStat('Armor Bonus', `+${entry.armorBonus}`);
    else if (entry.armor && entry.armor.armorBonus !== undefined) addStat('Armor Bonus', `+${entry.armor.armorBonus}`);
    if (entry.maxDex !== undefined && entry.maxDex !== null) addStat('Max Dex', `+${entry.maxDex}`);
    if (entry.acp !== undefined) addStat('ACP', entry.acp);
    if (entry.asf !== undefined) addStat('ASF', `${entry.asf}%`);
    if (entry.school) addStat('School', entry.school);
    if (entry.discipline) addStat('Discipline', entry.discipline);
    if (entry.level !== undefined) addStat('Level', entry.level);
    if (entry.ppCost !== undefined) addStat('PP Cost', entry.ppCost);
    if (entry.castingTime || (entry.delivery && entry.delivery.action)) addStat('Action', entry.castingTime || entry.delivery.action);
    if (entry.savingThrow || (entry.delivery && entry.delivery.save && entry.delivery.save.type)) {
      addStat('Save', entry.savingThrow || entry.delivery.save.type);
    }
    if (entry.spellResistance || (entry.delivery && entry.delivery.spellResistance)) {
      addStat('SR', entry.spellResistance || entry.delivery.spellResistance);
    }
    if (entry.slot || (entry.item && entry.item.slot)) addStat('Slot', entry.slot || entry.item.slot);
    if (entry.gpValue !== undefined || (entry.item && entry.item.price)) addStat('Value', `${entry.gpValue !== undefined ? entry.gpValue : entry.item.price} gp`);
    const prereq = entry.prereq || (entry.prerequisites && entry.prerequisites.text);
    if (prereq && prereq !== '-') addStat('Prerequisites', prereq);
    if (kind === 'class' && entry.hd) addStat('Hit Die', `d${entry.hd}`);
    if (kind === 'race' && entry.size) addStat('Size', entry.size);
    return stats;
  }

  function _kindSupportsReplace(kind) {
    const k = String(kind || '').toLowerCase();
    if (['weapon', 'item', 'armor', 'shield', 'feat', 'race', 'template', 'spell', 'maneuver', 'psionic', 'psionics', 'incarnum', 'pactmagic', 'shadowmagic', 'truenaming'].includes(k)) {
      return typeof global.openCompendiumDrawer === 'function'
        || typeof global.openEquipmentSlotModal === 'function'
        || typeof global.openWeaponSetModal === 'function';
    }
    return false;
  }

  function _kindSupportsRemove(kind) {
    const k = String(kind || '').toLowerCase();
    return ['weapon', 'item', 'armor', 'shield', 'feat', 'boon', 'template', 'spell', 'maneuver', 'psionic', 'psionics', 'incarnum', 'pactmagic', 'shadowmagic', 'truenaming', 'class'].includes(k);
  }

  function closeEntityInspector() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('entity-inspector-modal');
    if (modal) modal.remove();
    _activeInspectorSpec = null;
    _activeInspectorResolved = null;
  }

  function closeRuleCrafter() {
    if (typeof _crafterCleanup === 'function') {
      const fn = _crafterCleanup;
      _crafterCleanup = null;
      try { fn(); } catch (_) {}
    }
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('rule-crafter-modal');
      if (modal) {
        const iframe = modal.querySelector('iframe');
        if (iframe) {
          try { iframe.src = 'about:blank'; } catch (_) {}
          iframe.remove();
        }
        modal.remove();
      }
    }
  }

  function openRuleCrafter(opts) {
    if (typeof document === 'undefined' || !document.body) return null;
    const options = opts || {};
    closeRuleCrafter();

    const modal = document.createElement('div');
    modal.id = 'rule-crafter-modal';
    modal.className = 'fixed inset-0 flex justify-center bg-slate-950/85 backdrop-blur-sm';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Rule Crafter');

    const applyResponsiveShell = () => {
      const small = _isSmallViewport();
      modal.style.zIndex = '10050';
      modal.style.alignItems = small ? 'flex-end' : 'center';
      modal.style.padding = small ? '0' : '12px';
      const panel = modal.firstElementChild;
      if (panel) {
        panel.style.maxWidth = '1220px';
        panel.style.width = '100%';
        panel.style.height = small ? '94vh' : '90vh';
        panel.style.maxHeight = '94vh';
        panel.style.borderRadius = small ? '16px 16px 0 0' : '16px';
      }
    };

    const panel = document.createElement('div');
    panel.className = 'w-full bg-slate-900 border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col';

    const iframe = document.createElement('iframe');
    iframe.id = 'rule-crafter-iframe';
    iframe.src = 'forge_sandbox.html?embed=1';
    iframe.title = 'Rule Crafter';
    iframe.setAttribute('style', 'width:100%;height:100%;border:0;background:#0a0f1d;display:block;flex:1 1 auto;');
    panel.appendChild(iframe);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    applyResponsiveShell();

    const onMessage = (event) => {
      if (!event || !event.data || typeof event.data !== 'object') return;
      if (iframe.contentWindow && event.source !== iframe.contentWindow) return;
      const msg = event.data;
      if (msg.type === 'crafter:ready') {
        if (iframe.contentWindow) {
          const bridge = global.CharStore && global.CharStore.StudioBridge;
          let payloadEntry = options.entry || null;
          if (payloadEntry && payloadEntry.schemaVersion !== 3 && bridge && typeof bridge.toV3CrafterDraft === 'function') {
            payloadEntry = bridge.toV3CrafterDraft(payloadEntry, options.kind || (options.context && options.context.kind));
          }
          iframe.contentWindow.postMessage({
            type: 'crafter:loadEntry',
            entry: payloadEntry,
            context: Object.assign({
              allowCharacterScope: options.allowCharacterScope !== false,
              originalId: options.originalId || (payloadEntry && payloadEntry.id) || null
            }, options.context || {})
          }, '*');
        }
      } else if (msg.type === 'crafter:saveEntry') {
        if (typeof options.onSave === 'function') {
          options.onSave(msg);
        } else if (global.CharStore && global.CharStore.StudioBridge && typeof global.CharStore.StudioBridge.saveFromCrafter === 'function') {
          global.CharStore.StudioBridge.saveFromCrafter(msg.entry, {
            saveScope: msg.saveScope,
            originalId: msg.originalId || options.originalId || null,
            context: Object.assign({}, options.context || {}, msg.context || {})
          });
        }
        const reopenSpec = _activeInspectorSpec ? Object.assign({}, _activeInspectorSpec) : null;
        closeRuleCrafter();
        if (reopenSpec && document.getElementById('entity-inspector-modal')) {
          openEntityInspector(reopenSpec);
        }
      } else if (msg.type === 'crafter:close') {
        closeRuleCrafter();
        if (typeof options.onClose === 'function') options.onClose();
      }
    };

    const onKeyDown = (event) => {
      if (event && event.key === 'Escape') {
        closeRuleCrafter();
        if (typeof options.onClose === 'function') options.onClose();
      }
    };

    const onBackdropClick = (event) => {
      if (event && event.target === modal) {
        closeRuleCrafter();
        if (typeof options.onClose === 'function') options.onClose();
      }
    };

    const onResize = () => applyResponsiveShell();

    window.addEventListener('message', onMessage);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    modal.addEventListener('click', onBackdropClick);

    _crafterCleanup = () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      modal.removeEventListener('click', onBackdropClick);
    };
    return modal;
  }

  function openEntityInspector(spec) {
    if (typeof document === 'undefined' || !document.body) return null;
    _syncDnDUI();
    const query = typeof spec === 'string' ? { name: spec } : Object.assign({}, spec || {});
    const bridge = global.CharStore && global.CharStore.StudioBridge;
    const resolved = (bridge && typeof bridge.resolveEntity === 'function')
      ? bridge.resolveEntity(query)
      : {
        entry: query.entry || { id: query.id || '', name: query.name || 'Entry', type: query.kind || 'Feature' },
        resolvedId: query.id || null,
        kind: query.kind || null,
        isCustomOverride: false,
        hasSrdBase: false
      };

    if (!resolved || !resolved.entry) return null;
    const entry = resolved.entry;
    const kind = String(resolved.kind || query.kind || entry.type || 'feature').toLowerCase();

    closeEntityInspector();
    _activeInspectorSpec = query;
    _activeInspectorResolved = resolved;

    const kindLabelMap = {
      weapon: 'Weapon',
      item: 'Equipment / Item',
      armor: 'Armor',
      shield: 'Shield',
      feat: 'Feat',
      boon: 'DM Boon',
      spell: 'Spell',
      maneuver: 'Maneuver',
      psionic: 'Psionic Power',
      psionics: 'Psionic Power',
      incarnum: 'Soulmeld',
      pactmagic: 'Vestige',
      shadowmagic: 'Mystery',
      truenaming: 'Utterance',
      class: 'Class',
      race: 'Race',
      template: 'Template'
    };
    const kindLabel = kindLabelMap[kind] || (entry.type || 'Entity');
    const sourceText = entry.source || (resolved.sourceLocation === 'srd' ? 'Official SRD' : 'Character Sheet');
    const bodyDesc = entry.benefit || entry.description || entry.text || entry.summary || entry.notes || 'No official rule text recorded for this entry.';
    const statChips = _collectStatChips(entry, kind);
    const blockChips = _collectRuleBlockSummaries(entry);
    const showReplace = _kindSupportsReplace(kind);
    const showRemove = _kindSupportsRemove(kind);

    const modal = document.createElement('div');
    modal.id = 'entity-inspector-modal';
    modal.className = 'fixed inset-0 flex justify-center bg-slate-950/80 backdrop-blur-sm';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', entry.name || 'Entity Inspector');

    const small = _isSmallViewport();
    modal.style.zIndex = '10040';
    modal.style.alignItems = small ? 'flex-end' : 'center';
    modal.style.padding = small ? '0' : '16px';

    const panelRadius = small ? '16px 16px 0 0' : '16px';
    modal.innerHTML = `<div class="w-full max-w-lg bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col" style="max-height:90vh;border-radius:${panelRadius};">
      <div class="p-4 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-base font-bold text-white leading-tight break-words">${escapeHtml(entry.name || query.name || 'Entity')}</h3>
            ${resolved.isCustomOverride ? '<span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50 text-[10px] font-bold">⚒️ Crafted</span>' : ''}
          </div>
          <div class="mt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400">
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-semibold">${escapeHtml(kindLabel)}</span>
            <span class="text-slate-400">• ${escapeHtml(sourceText)}</span>
          </div>
        </div>
        <button type="button" data-action="entity:close-inspector" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer shrink-0" aria-label="Close">✕</button>
      </div>
      <div class="p-4 overflow-y-auto space-y-3 text-xs text-slate-200" style="min-height:0;">
        <div class="bg-slate-950/60 border border-slate-800 rounded-lg p-3 leading-relaxed text-slate-200 break-words" style="white-space:pre-wrap;">${escapeHtml(bodyDesc)}</div>
        ${statChips.length ? `<div class="flex flex-wrap gap-1.5">${statChips.map((s) => `<div class="px-2 py-1 rounded bg-slate-800/90 border border-slate-700 text-[11px]"><span class="text-slate-400">${escapeHtml(s.label)}:</span> <span class="text-white font-semibold">${escapeHtml(s.val)}</span></div>`).join('')}</div>` : ''}
        ${blockChips.length ? `<div><div class="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">Active Rule Blocks</div><div class="flex flex-wrap gap-1.5">${blockChips.map((b) => `<span class="px-2 py-0.5 rounded bg-amber-950/60 text-amber-200 border border-amber-500/40 text-[10px] font-mono">${escapeHtml(b)}</span>`).join('')}</div></div>` : ''}
      </div>
      <div class="p-3 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <button type="button" data-action="entity:edit-crafter" class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shadow-sm">⚒️ Edit in Rule Crafter</button>
          ${resolved.isCustomOverride ? '<button type="button" data-action="entity:reset-srd" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-500/40 font-semibold text-xs cursor-pointer">↺ Reset to Official SRD</button>' : ''}
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          ${showReplace ? '<button type="button" data-action="entity:replace" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs cursor-pointer">🔄 Replace</button>' : ''}
          ${showRemove ? '<button type="button" data-action="entity:remove" class="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 font-semibold text-xs cursor-pointer">🗑️ Remove</button>' : ''}
        </div>
      </div>
    </div>`;

    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeEntityInspector();
    });
    document.body.appendChild(modal);
    return modal;
  }

  function _removeEntityFromCharacter(spec, resolved) {
    const doc = (global.CharStore && typeof global.CharStore.getDoc === 'function' && global.CharStore.getDoc()) || global.character;
    if (!doc) return false;
    const kind = String((spec && spec.kind) || (resolved && resolved.kind) || '').toLowerCase();
    const targetName = String((resolved && resolved.entry && resolved.entry.name) || (spec && spec.name) || '').trim().toLowerCase();
    const targetId = (resolved && resolved.resolvedId) || (spec && spec.id) || null;
    const matches = (item) => {
      if (!item) return false;
      if (typeof item === 'string') {
        const clean = item.replace(/^\[DM\s*Boon\]\s*/i, '').replace(/^DM\s*Boon:\s*/i, '').trim().toLowerCase();
        return targetName && (item.trim().toLowerCase() === targetName || clean === targetName);
      }
      if (targetId && (item.id === targetId || item.customEntryId === targetId)) return true;
      if (targetName && item.name && item.name.trim().toLowerCase() === targetName) return true;
      return false;
    };

    let changed = false;
    if (spec && spec.slotKey && doc.bodySlots && doc.bodySlots[spec.slotKey]) {
      doc.bodySlots[spec.slotKey] = null;
      changed = true;
    }
    if (kind === 'weapon' && Array.isArray(doc.weaponSets) && targetName) {
      doc.weaponSets.forEach((ws) => {
        if (ws && String(ws.mainWeapon || '').trim().toLowerCase() === targetName) {
          ws.mainWeapon = '';
          changed = true;
        }
      });
    }
    if (kind === 'boon' && Array.isArray(doc.levelProgression) && spec && spec.levelIndex !== undefined && spec.levelIndex !== null) {
      const lp = doc.levelProgression[Number(spec.levelIndex)];
      if (lp) {
        ['otherBonuses', 'bonusFeats', 'specials'].forEach((k) => {
          if (Array.isArray(lp[k])) {
            const next = lp[k].filter((x) => !matches(x));
            if (next.length !== lp[k].length) { lp[k] = next; changed = true; }
          }
        });
      }
    }
    if (kind === 'class' && Array.isArray(doc.levelProgression) && spec && spec.levelIndex !== undefined && spec.levelIndex !== null) {
      const idx = Number(spec.levelIndex);
      if (doc.levelProgression[idx]) {
        doc.levelProgression.splice(idx, 1);
        changed = true;
      }
    }
    const listMap = {
      weapon: ['weapons'],
      item: ['gearPool', 'inventory'],
      armor: ['gearPool', 'inventory'],
      shield: ['gearPool', 'inventory'],
      feat: ['feats'],
      boon: ['dmBoons', 'feats'],
      template: ['templates'],
      spell: ['spells', 'knownSpells', 'preparedSpells'],
      maneuver: ['maneuvers', 'spells'],
      psionic: ['psionics'],
      psionics: ['psionics'],
      incarnum: ['incarnum'],
      pactmagic: ['pactMagic'],
      shadowmagic: ['shadowMagic'],
      truenaming: ['truenaming']
    };
    (listMap[kind] || []).forEach((arrKey) => {
      if (!Array.isArray(doc[arrKey])) return;
      const next = doc[arrKey].filter((item) => !matches(item));
      if (next.length !== doc[arrKey].length) {
        doc[arrKey] = next;
        changed = true;
      }
    });

    if (changed) {
      if (global.CharStore && typeof global.CharStore.recompute === 'function') {
        global.CharStore.recompute('crafter');
      }
      if (typeof global.saveStateToStorage === 'function') global.saveStateToStorage(true);
      if (typeof global.renderAll === 'function') global.renderAll();
    }
    return changed;
  }

  function _registerCrafterActionsOnce() {
    if (Actions.has('entity:inspect')) return;

    register('entity:inspect', (el, dataset, event) => {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      const spec = {
        kind: dataset.entityKind || dataset.kind || 'feat',
        id: dataset.entityId || undefined,
        name: dataset.entityName || undefined,
        slotKey: dataset.slotKey || undefined,
        discipline: dataset.discipline || undefined,
        levelIndex: dataset.levelIndex !== undefined && dataset.levelIndex !== '' ? Number(dataset.levelIndex) : undefined,
        index: dataset.index !== undefined && dataset.index !== '' ? Number(dataset.index) : undefined
      };
      openEntityInspector(spec);
    });

    register('entity:close-inspector', () => {
      closeEntityInspector();
    });

    register('entity:edit-crafter', () => {
      const resolved = _activeInspectorResolved;
      const spec = _activeInspectorSpec || {};
      if (!resolved || !resolved.entry) return;
      const bridge = global.CharStore && global.CharStore.StudioBridge;
      const draft = (bridge && typeof bridge.toV3CrafterDraft === 'function')
        ? bridge.toV3CrafterDraft(resolved.entry, resolved.kind || spec.kind)
        : resolved.entry;
      openRuleCrafter({
        entry: draft,
        kind: resolved.kind || spec.kind,
        originalId: resolved.resolvedId || (resolved.entry && resolved.entry.id) || null,
        allowCharacterScope: true,
        context: {
          allowCharacterScope: true,
          kind: resolved.kind || spec.kind,
          originalName: resolved.entry.name || spec.name || '',
          slotKey: spec.slotKey,
          levelIndex: spec.levelIndex,
          index: spec.index
        }
      });
    });

    register('entity:reset-srd', async () => {
      const resolved = _activeInspectorResolved;
      if (!resolved || !resolved.resolvedId) return;
      const name = (resolved.entry && resolved.entry.name) || 'this entry';
      const dndUi = global.DnDUI;
      let ok = true;
      if (dndUi && typeof dndUi.confirm === 'function') {
        ok = await dndUi.confirm(`Restore "${name}" to Official SRD Rules? Any character-local Rule Crafter edits for this entry will be removed.`, {
          title: 'Reset to Official SRD',
          confirmLabel: 'Restore Official SRD',
          cancelLabel: 'Cancel'
        });
      }
      if (!ok) return;
      const bridge = global.CharStore && global.CharStore.StudioBridge;
      if (bridge && typeof bridge.resetCustomEntry === 'function') {
        bridge.resetCustomEntry(resolved.resolvedId);
      }
      if (_activeInspectorSpec) {
        openEntityInspector(_activeInspectorSpec);
      } else {
        closeEntityInspector();
      }
    });

    register('entity:replace', () => {
      const spec = _activeInspectorSpec || {};
      const kind = String(spec.kind || (_activeInspectorResolved && _activeInspectorResolved.kind) || '').toLowerCase();
      closeEntityInspector();
      if (spec.slotKey && typeof global.openEquipmentSlotModal === 'function') {
        global.openEquipmentSlotModal(spec.slotKey);
        return;
      }
      if (kind === 'weapon' && typeof global.openWeaponSetModal === 'function') {
        global.openWeaponSetModal(spec.index || 1);
        return;
      }
      if (typeof global.openCompendiumDrawer === 'function') {
        const typeMap = { feat: 'Feat', spell: 'Spell', weapon: 'Weapon', item: 'Magic Item', armor: 'Armor', shield: 'Armor', race: 'Race', template: 'Template', class: 'Class' };
        global.openCompendiumDrawer(typeMap[kind] || 'All');
      }
    });

    register('entity:remove', async () => {
      const resolved = _activeInspectorResolved;
      const spec = _activeInspectorSpec || {};
      const name = (resolved && resolved.entry && resolved.entry.name) || spec.name || 'this entry';
      const doc = (global.CharStore && typeof global.CharStore.getDoc === 'function' && global.CharStore.getDoc()) || global.character;
      const isPlayMode = Boolean(doc && doc.uiMode === 'play');
      const promptMsg = isPlayMode
        ? `Play Mode Active: Removing "${name}" during play may change live combat stats, HP, or prerequisites. Remove anyway?`
        : `Remove "${name}" from this character?`;
      const dndUi = global.DnDUI;
      let ok = true;
      if (dndUi && typeof dndUi.confirm === 'function') {
        ok = await dndUi.confirm(promptMsg, {
          title: isPlayMode ? 'Play Mode Removal Warning' : 'Remove Entry',
          confirmLabel: 'Remove',
          cancelLabel: 'Cancel',
          tone: 'danger'
        });
      }
      if (!ok) return;
      _removeEntityFromCharacter(spec, resolved);
      closeEntityInspector();
    });

    register('crafter:open', (el, dataset) => {
      const bridge = global.CharStore && global.CharStore.StudioBridge;
      let entry = null;
      if ((dataset.entityId || dataset.entityName) && bridge && typeof bridge.resolveEntity === 'function') {
        const res = bridge.resolveEntity({ kind: dataset.entityKind || dataset.kind, id: dataset.entityId, name: dataset.entityName });
        if (res && res.entry) entry = bridge.toV3CrafterDraft(res.entry, dataset.entityKind || dataset.kind);
      }
      openRuleCrafter({
        entry,
        kind: dataset.entityKind || dataset.kind || 'feat',
        originalId: dataset.entityId || (entry && entry.id) || null,
        allowCharacterScope: dataset.allowCharacterScope !== 'false',
        context: {
          allowCharacterScope: dataset.allowCharacterScope !== 'false',
          kind: dataset.entityKind || dataset.kind || 'feat'
        }
      });
    });

    register('crafter:edit-viewed-feat', () => {
      const viewed = global.currentViewedFeatItem;
      const name = (viewed && viewed.name) || global.currentViewedFeatName || '';
      if (!name) return;
      const bridge = global.CharStore && global.CharStore.StudioBridge;
      const res = bridge && typeof bridge.resolveEntity === 'function'
        ? bridge.resolveEntity({ kind: 'feat', name })
        : { entry: { name, benefit: (viewed && viewed.desc) || '' }, resolvedId: null };
      if (typeof global.closeFeatDetailModal === 'function') global.closeFeatDetailModal();
      const draft = bridge && typeof bridge.toV3CrafterDraft === 'function'
        ? bridge.toV3CrafterDraft(res.entry, 'feat')
        : res.entry;
      openRuleCrafter({
        entry: draft,
        kind: 'feat',
        originalId: res.resolvedId || (draft && draft.id) || null,
        allowCharacterScope: true,
        context: { allowCharacterScope: true, kind: 'feat', originalName: name }
      });
    });

    register('crafter:reset-viewed-feat', () => {
      const viewed = global.currentViewedFeatItem;
      const name = (viewed && viewed.name) || global.currentViewedFeatName || '';
      if (!name) return;
      const bridge = global.CharStore && global.CharStore.StudioBridge;
      if (bridge && typeof bridge.resolveEntity === 'function' && typeof bridge.resetCustomEntry === 'function') {
        const res = bridge.resolveEntity({ kind: 'feat', name });
        if (res && res.resolvedId) bridge.resetCustomEntry(res.resolvedId);
      }
      if (typeof global.closeFeatDetailModal === 'function') global.closeFeatDetailModal();
    });
  }

  const UI = {
    escapeHtml,
    escapeAttr,
    escapeJsString,
    raw,
    html,
    render,
    Badge,
    Button,
    Card,
    SectionHeader,
    EmptyState,
    CONSUMABLE_GROUPS,
    renderConsumablesView,
    openEntityInspector,
    closeEntityInspector,
    openRuleCrafter,
    closeRuleCrafter
  };

  // ==========================================================================
  // DELEGATED ACTION ROUTER (`Actions`)
  // ==========================================================================
  const _handlers = new Map();
  let _initialized = false;

  function register(actionName, handlerFn) {
    if (!actionName || typeof handlerFn !== 'function') return;
    _handlers.set(String(actionName), handlerFn);
  }

  function dispatchElement(el, event, attrKey = 'action') {
    if (!el) return undefined;
    const dataset = el.dataset || {};
    const actionName = dataset[attrKey] || (typeof el.getAttribute === 'function' ? el.getAttribute(`data-${toKebabCase(attrKey)}`) : null);
    if (!actionName) return undefined;
    const handler = _handlers.get(actionName);
    if (typeof handler !== 'function') return undefined;
    return handler(el, dataset, event);
  }

  function invoke(actionName, dataset = {}, mockEvent = null) {
    const handler = _handlers.get(String(actionName));
    if (typeof handler !== 'function') {
      throw new Error(`Unregistered UI action: ${actionName}`);
    }
    const mockEl = {
      value: dataset && dataset.value !== undefined ? String(dataset.value) : '',
      dataset: Object.assign({}, dataset),
      getAttribute(attr) {
        if (attr && attr.startsWith('data-')) {
          const camel = attr.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          return this.dataset[camel];
        }
        return undefined;
      }
    };
    return handler(mockEl, mockEl.dataset, mockEvent || { type: 'invoke', preventDefault() {}, stopPropagation() {} });
  }

  function init(rootDoc) {
    const doc = rootDoc || (typeof document !== 'undefined' ? document : null);
    if (!doc || typeof doc.addEventListener !== 'function') return;
    _syncDnDUI();
    _registerCrafterActionsOnce();
    if (_initialized && doc === (typeof document !== 'undefined' ? document : null)) return;
    if (doc === (typeof document !== 'undefined' ? document : null)) {
      _initialized = true;
    }

    doc.addEventListener('click', (event) => {
      const target = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('[data-action]')
        : null;
      if (!target || target.disabled) return;
      dispatchElement(target, event, 'action');
    });

    doc.addEventListener('change', (event) => {
      const target = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('[data-change-action]')
        : null;
      if (!target || target.disabled) return;
      dispatchElement(target, event, 'changeAction');
    });

    doc.addEventListener('input', (event) => {
      const target = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('[data-input-action]')
        : null;
      if (!target || target.disabled) return;
      dispatchElement(target, event, 'inputAction');
    });

    doc.addEventListener('keydown', (event) => {
      const target = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('[data-keydown-action]')
        : null;
      if (!target || target.disabled) return;
      dispatchElement(target, event, 'keydownAction');
    });

    doc.addEventListener('keyup', (event) => {
      const target = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('[data-keyup-action]')
        : null;
      if (!target || target.disabled) return;
      dispatchElement(target, event, 'keyupAction');
    });

    doc.addEventListener('submit', (event) => {
      const target = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('[data-submit-action]')
        : null;
      if (!target) return;
      event.preventDefault();
      dispatchElement(target, event, 'submitAction');
    });
  }

  const Actions = {
    register,
    dispatchElement,
    invoke,
    init,
    has(actionName) {
      return _handlers.has(String(actionName));
    }
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init(document));
    } else {
      init(document);
    }
  }

  if (typeof window !== 'undefined') {
    window.UI = UI;
    window.Actions = Actions;
  }
  if (typeof global !== 'undefined') {
    global.UI = UI;
    global.Actions = Actions;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UI, Actions };
  }
})(typeof window !== 'undefined' ? window : globalThis);
