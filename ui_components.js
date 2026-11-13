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
    renderConsumablesView
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
