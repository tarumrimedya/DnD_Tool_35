/**
 * Joyful-Fermi — Calm Sheet Top Bar, 272px 3x2 Left Spine, Pin-to-Right Effects Rail,
 * Center Rule Master Sync & Floating Dice Drawer (Phase 1)
 *
 * Attaches onto existing `window.Sheet.spine` (`0` new window.* globals, `0` inline events).
 */
(function (root) {
  'use strict';

  const STORAGE_RIGHT_PIN_KEY = 'dnd35_calm_right_pinned';
  const STORAGE_RM_COLLAPSED_KEY = 'dnd35_calm_rm_collapsed';
  const LENS_TO_TAB = {
    play: 'tab-combat',
    prep: 'tab-spells',
    gear: 'tab-inventory',
    build: 'tab-core'
  };
  const TAB_TO_LENS = {
    'tab-combat': 'play',
    'tab-spells': 'prep',
    'tab-inventory': 'gear',
    'tab-core': 'build',
    'tab-defense': 'build'
  };

  let _activeEntityId = 'self';
  let _hpMode = 'damage';
  let _hpPopoverOpen = false;
  let _rightPinned = false;
  let _diceOpen = false;
  let _activeLens = 'play';
  let _booted = false;
  let _rmObserver = null;

  function _escHtml(val) {
    if (typeof root !== 'undefined' && root.UI && typeof root.UI.escapeHtml === 'function') {
      return root.UI.escapeHtml(val);
    }
    return String(val === undefined || val === null ? '' : val).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function _escAttr(val) {
    if (typeof root !== 'undefined' && root.UI && typeof root.UI.escapeAttr === 'function') {
      return root.UI.escapeAttr(val);
    }
    return _escHtml(val);
  }

  function _fmtSigned(n) {
    const num = Number(n) || 0;
    return num >= 0 ? `+${num}` : String(num);
  }

  function _getDoc() {
    if (root.CharStore && typeof root.CharStore.getDoc === 'function') {
      const d = root.CharStore.getDoc();
      if (d) return d;
    }
    return root.character || null;
  }

  function _getDerived() {
    if (root.CharStore) {
      if (typeof root.CharStore.getSheet === 'function') {
        const s = root.CharStore.getSheet();
        if (s) return s;
      }
      if (typeof root.CharStore.getState === 'function') {
        const st = root.CharStore.getState();
        if (st && st.sheet) return st.sheet;
      }
    }
    return null;
  }

  function _isCalmDesktop() {
    return Boolean(
      root.Sheet &&
      root.Sheet.shell &&
      root.Sheet.shell.isCalm() &&
      typeof window !== 'undefined' &&
      window.innerWidth >= 1024
    );
  }

  function _readPinPref() {
    try {
      return localStorage.getItem(STORAGE_RIGHT_PIN_KEY) === '1';
    } catch (err) {
      if (typeof reportError === 'function') reportError('sheet_spine:pinPref', err);
      return false;
    }
  }

  function _writePinPref(val) {
    try {
      localStorage.setItem(STORAGE_RIGHT_PIN_KEY, val ? '1' : '0');
    } catch (err) {
      if (typeof reportError === 'function') reportError('sheet_spine:pinPrefWrite', err);
    }
  }

  function _syncDatasetFlags() {
    if (typeof document === 'undefined' || !document.documentElement) return;
    document.documentElement.dataset.calmLens = _activeLens;
    document.documentElement.dataset.calmRightPinned = _rightPinned ? '1' : '0';
    document.documentElement.dataset.calmDiceOpen = _diceOpen ? '1' : '0';
  }

  function _syncOwnership() {
    if (!root.Sheet || !root.Sheet.regions) return;
    if (_isCalmDesktop()) {
      root.Sheet.regions.claim('hud', 'sheet_spine');
      root.Sheet.regions.claim('abilities', 'sheet_spine');
      root.Sheet.regions.claim('profile', 'sheet_spine');
    } else {
      root.Sheet.regions.release('hud', 'sheet_spine');
      root.Sheet.regions.release('abilities', 'sheet_spine');
      root.Sheet.regions.release('profile', 'sheet_spine');
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Topbar (Portrait, Identity, 4 Equal Lenses, Notes / Theme / Settings)
  // ---------------------------------------------------------------------------
  function renderTopbar() {
    const bar = typeof document !== 'undefined' ? document.getElementById('calm-topbar') : null;
    if (!bar) return;

    const doc = _getDoc();
    const derived = _getDerived();
    const charName = (derived && derived.meta && derived.meta.name) || (doc && doc.name) || 'Loading...';
    const levelNum = (derived && derived.meta && derived.meta.level) || (doc && doc.level) || 1;
    const classesStr = (derived && derived.meta && derived.meta.classes) || (doc && doc.classes) || 'Level ' + levelNum;
    const raceStr = (doc && doc.race) ? String(doc.race).trim() : '';
    const avatarUrl = doc && doc.avatarUrl ? String(doc.avatarUrl) : '';
    const missingIdentity = !raceStr || !(doc && doc.deity) || !(doc && doc.alignment);
    const curTheme = root.Sheet && root.Sheet.theme ? root.Sheet.theme.get() : 'slate';
    const themeLabel = curTheme === 'obsidian' ? 'Obsidian' : (curTheme === 'midnight' ? 'Midnight' : 'Slate');

    const portraitInner = avatarUrl
      ? `<img class="calm-portrait-img" src="${_escAttr(avatarUrl)}" alt="${_escAttr(charName)}" />`
      : `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>`;

    const subText = `${raceStr ? raceStr + ' · ' : ''}${classesStr}`;
    const lenses = [
      { id: 'play', label: 'Play', key: '1' },
      { id: 'prep', label: 'Prep', key: '2' },
      { id: 'gear', label: 'Gear', key: '3' },
      { id: 'build', label: 'Build', key: '4' }
    ];

    bar.innerHTML = `
      <div class="calm-tb-left">
        <a href="/hub" class="calm-tb-btn" title="Return to Campaign Hub">≡ Hub</a>
        <button type="button" class="calm-portrait-btn" data-action="hud:open-profile-edit" data-profile-tab="identity" title="Click to edit Portrait &amp; Identity">
          ${portraitInner}
          <span class="calm-portrait-edit">✎</span>
        </button>
        <div class="calm-ident">
          <div class="calm-ident-row">
            <span class="calm-ident-name">${_escHtml(charName)}</span>
            ${missingIdentity ? '<button type="button" class="calm-ident-nudge" data-action="hud:open-profile-edit" data-profile-tab="identity" title="Complete race, alignment or deity">Complete identity</button>' : ''}
          </div>
          <div class="calm-ident-sub">${_escHtml(subText)}</div>
        </div>
      </div>
      <nav class="calm-lens-nav" role="tablist" aria-label="Sheet lenses">
        ${lenses.map(l => `
          <button type="button" role="tab" aria-selected="${_activeLens === l.id ? 'true' : 'false'}"
            class="calm-lens-tab ${_activeLens === l.id ? 'active' : ''}"
            data-action="calm:lens" data-lens="${_escAttr(l.id)}">
            <span>${_escHtml(l.label)}</span>
            <span class="calm-lens-key">${_escHtml(l.key)}</span>
          </button>
        `).join('')}
      </nav>
      <div class="calm-tb-right">
        <button type="button" class="calm-tb-btn" data-action="hud:open-quest-notebook" title="Open Quest Logs &amp; Mindmap">📝 Notes</button>
        <button type="button" class="calm-tb-btn" data-action="calm:theme-menu" title="Switch Sheet Theme (${_escAttr(themeLabel)})">🎨 ${_escHtml(themeLabel)}</button>
        <button type="button" class="calm-tb-btn" data-action="hud:open-settings-modal" title="Settings &amp; Master DB">⚙️</button>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // 2. Data Extractors for Spine & Popovers (RAW Single Source of Truth)
  // ---------------------------------------------------------------------------
  function _getEntityView() {
    const doc = _getDoc();
    const derived = _getDerived();
    if (root.RuleEngine && typeof root.RuleEngine.deriveEntityView === 'function' && derived) {
      return root.RuleEngine.deriveEntityView(derived, _activeEntityId);
    }
    const hp = (doc && doc.hp) || { current: 10, max: 10, temp: 0, nonlethal: 0 };
    return {
      id: 'self',
      isCompanion: false,
      name: (doc && doc.name) || 'Hero',
      hp: {
        current: Number(hp.current ?? hp.max ?? 10),
        max: Math.max(1, Number(hp.max ?? 10)),
        temp: Math.max(0, Number(hp.temp ?? 0)),
        nonlethal: Math.max(0, Number(hp.nonlethal ?? 0)),
        condition: Number(hp.current) <= 0 ? (Number(hp.current) === 0 ? 'Disabled' : 'Dying') : 'Healthy'
      },
      ac: (doc && doc.acBreakdown) || { total: 10, touch: 10, flatFooted: 10 },
      saves: {
        fort: Number(doc && doc.evaluatedSaves && doc.evaluatedSaves.fort) || 0,
        ref: Number(doc && doc.evaluatedSaves && doc.evaluatedSaves.ref) || 0,
        will: Number(doc && doc.evaluatedSaves && doc.evaluatedSaves.will) || 0
      },
      speed: { land: Number(doc && (doc.effectiveSpeed || doc.baseSpeed)) || 30 }
    };
  }

  function _getCompanionsList() {
    const derived = _getDerived();
    if (derived && derived.companions && Array.isArray(derived.companions.list)) {
      return derived.companions.list;
    }
    const doc = _getDoc();
    return Array.isArray(doc && doc.companions) ? doc.companions : [];
  }

  function _getActiveEffectsData() {
    const doc = _getDoc();
    const derived = _getDerived();
    const buffs = (derived && Array.isArray(derived.activeBuffs) ? derived.activeBuffs : null)
      || (doc && Array.isArray(doc.buffs) ? doc.buffs.filter(b => b && b.active !== false) : []);
    const condRaw = (derived && Array.isArray(derived.conditions) ? derived.conditions : null)
      || (doc && Array.isArray(doc.conditions) ? doc.conditions : []);
    const conditions = condRaw.filter(Boolean).map(c => (typeof c === 'string' ? c : (c.name || c.label || c.id || 'Condition')));
    return { buffs, conditions };
  }

  function _getSituationalMap() {
    const doc = _getDoc();
    const derived = _getDerived();
    const acList = (derived && derived.acBreakdown && Array.isArray(derived.acBreakdown.situational) && derived.acBreakdown.situational)
      || (doc && Array.isArray(doc.conditionalAcBonuses) ? doc.conditionalAcBonuses : [])
      || (doc && doc.acBreakdown && Array.isArray(doc.acBreakdown.conditionalBonuses) ? doc.acBreakdown.conditionalBonuses : []);

    const saveSituational = (key) => {
      const sNode = derived && derived.saves && derived.saves[key];
      if (sNode && Array.isArray(sNode.situational)) return sNode.situational;
      const conds = doc && doc.evaluatedSaves && Array.isArray(doc.evaluatedSaves.conditionalBonuses)
        ? doc.evaluatedSaves.conditionalBonuses.filter(x => !x.save || x.save === key || x.save === 'all')
        : [];
      return conds;
    };

    return {
      ac: acList,
      fort: saveSituational('fort'),
      ref: saveSituational('ref'),
      will: saveSituational('will')
    };
  }

  // ---------------------------------------------------------------------------
  // 3. 272px Left Spine Granular Renderer
  // ---------------------------------------------------------------------------
  function renderSpine() {
    const spine = typeof document !== 'undefined' ? document.getElementById('calm-spine') : null;
    if (!spine) return;

    const doc = _getDoc();
    const derived = _getDerived();
    const view = _getEntityView();
    const comps = _getCompanionsList();
    if (_activeEntityId !== 'self' && !comps.some(c => c && String(c.id) === _activeEntityId)) {
      _activeEntityId = 'self';
    }

    const hp = view.hp;
    const totalPool = Math.max(1, hp.max + hp.temp);
    const realPct = Math.max(0, Math.min(100, Math.round((Math.max(0, hp.current) / totalPool) * 100)));
    const tempPct = Math.max(0, Math.min(100 - realPct, Math.round((hp.temp / totalPool) * 100)));
    const nlPct = hp.nonlethal > 0 ? Math.max(0, Math.min(100 - realPct - tempPct, Math.round((hp.nonlethal / totalPool) * 100))) : 0;
    const periodicCount = (!view.isCompanion && doc && Array.isArray(doc.periodicHpEffects)) ? doc.periodicHpEffects.length : 0;

    // Entity switcher (up to 2 quick tabs when companion exists)
    let entityHtml = '';
    if (comps.length > 0) {
      const firstComp = comps[0];
      const compId = String(firstComp.id || 'comp-0');
      const compName = firstComp.customName || firstComp.baseName || firstComp.name || 'Companion';
      const compHp = Number(firstComp.hp && (firstComp.hp.current ?? firstComp.hp.max)) || 0;
      const heroHp = Number((derived && derived.hp && derived.hp.current) ?? (doc && doc.hp && doc.hp.current)) || 0;
      entityHtml = `
        <div class="calm-entity-seg">
          <button type="button" class="calm-entity-pill ${_activeEntityId === 'self' ? 'active' : ''}" data-action="calm:entity-switch" data-entity="self">Hero · ${_escHtml(heroHp)}</button>
          <button type="button" class="calm-entity-pill ${_activeEntityId === compId ? 'active' : ''}" data-action="calm:entity-switch" data-entity="${_escAttr(compId)}">${_escHtml(compName)} · ${_escHtml(compHp)}</button>
        </div>
      `;
    }

    // 3x2 Abilities (Physical row: STR, DEX, CON | Mental row: INT, WIS, CHA)
    const AB_KEYS = [
      { k: 'str', l: 'STR' }, { k: 'dex', l: 'DEX' }, { k: 'con', l: 'CON' },
      { k: 'int', l: 'INT' }, { k: 'wis', l: 'WIS' }, { k: 'cha', l: 'CHA' }
    ];
    const abDerived = (derived && derived.abilities) || {};
    const abDoc = (doc && doc.abilities) || {};
    const abBaseDoc = (doc && doc.baseAbilities) || abDoc;

    const abilitiesHtml = view.isCompanion
      ? AB_KEYS.map(ab => {
          const rawComp = view.rawCompanion || {};
          const score = Number((rawComp.abilities && rawComp.abilities[ab.k]) ?? 10);
          const mod = Math.floor((score - 10) / 2);
          return `
            <div class="calm-cell calm-num">
              <div class="calm-cell-top">
                <span class="calm-cell-lbl">${ab.l}</span>
                <button type="button" class="calm-info-btn" data-action="calm:info" data-kind="ability" data-key="${ab.k}" title="Breakdown">ⓘ</button>
              </div>
              <div class="calm-cell-val">${score}</div>
              <div class="calm-cell-sub">${_fmtSigned(mod)}</div>
            </div>
          `;
        }).join('')
      : AB_KEYS.map(ab => {
          const dAb = abDerived[ab.k];
          const eff = Number((dAb && dAb.total) ?? (abDoc[ab.k]) ?? 10);
          const base = Number((dAb && dAb.base) ?? (abBaseDoc[ab.k]) ?? eff);
          const isNonAbility = Boolean((dAb && dAb.isNonAbility) || (doc && doc.nonabilities && doc.nonabilities.includes(ab.k)));
          const mod = isNonAbility ? '—' : _fmtSigned(Math.floor((eff - 10) / 2));
          const delta = isNonAbility ? 0 : (eff - base);
          const cellCls = delta > 0 ? 'buffed' : (delta < 0 ? 'debuffed' : '');
          const deltaHtml = delta > 0
            ? ` <span class="calm-delta-up">↑${delta}</span>`
            : (delta < 0 ? ` <span class="calm-delta-dn">↓${Math.abs(delta)}</span>` : '');
          return `
            <div class="calm-cell calm-num ${cellCls}">
              <div class="calm-cell-top">
                <span class="calm-cell-lbl">${ab.l}</span>
                <button type="button" class="calm-info-btn" data-action="calm:info" data-kind="ability" data-key="${ab.k}" title="Breakdown">ⓘ</button>
              </div>
              <div class="calm-cell-val">${isNonAbility ? '—' : eff}</div>
              <div class="calm-cell-sub">${mod}${deltaHtml}</div>
            </div>
          `;
        }).join('');

    // 3x2 Defense & Saves (AC / Touch / Flat-F | Fort / Ref / Will)
    const sitMap = view.isCompanion ? { ac: [], fort: [], ref: [], will: [] } : _getSituationalMap();
    const acTotal = Number(view.ac && view.ac.total) || 10;
    const acTouch = Number(view.ac && view.ac.touch) || 10;
    const acFlat = Number((view.ac && (view.ac.flatFooted ?? view.ac.flat)) ?? 10);
    const speedVal = Number((view.speed && view.speed.land) ?? view.speed ?? 30) || 30;

    const defCells = [
      { key: 'ac', label: 'AC', val: String(acTotal), roll: false, spark: sitMap.ac.length },
      { key: 'touch', label: 'Touch', val: String(acTouch), roll: false, spark: 0 },
      { key: 'ff', label: 'Flat-F', val: String(acFlat), roll: false, spark: 0 },
      { key: 'fort', label: 'Fort', val: _fmtSigned(view.saves.fort), roll: true, saveKey: 'Fortitude', spark: sitMap.fort.length },
      { key: 'ref', label: 'Ref', val: _fmtSigned(view.saves.ref), roll: true, saveKey: 'Reflex', spark: sitMap.ref.length },
      { key: 'will', label: 'Will', val: _fmtSigned(view.saves.will), roll: true, saveKey: 'Will', spark: sitMap.will.length }
    ];

    const defenseHtml = defCells.map(c => `
      <div class="calm-cell calm-num ${c.roll ? 'calm-rollable' : ''}" ${c.roll ? `data-action="calm:roll-save" data-save-key="${_escAttr(c.saveKey)}" title="Click to roll ${_escAttr(c.saveKey)} save"` : ''}>
        <div class="calm-cell-top">
          <span class="calm-cell-lbl">${c.label}</span>
          <div style="display:inline-flex;align-items:center;gap:2px;">
            ${c.spark > 0 ? `<button type="button" class="calm-spark" data-action="calm:spark" data-key="${c.key}" title="Situational bonus reminder">✦${c.spark > 1 ? c.spark : ''}</button>` : ''}
            <button type="button" class="calm-info-btn" data-action="calm:info" data-kind="defense" data-key="${c.key}" title="Breakdown">ⓘ</button>
          </div>
        </div>
        <div class="calm-cell-val">${_escHtml(c.val)}</div>
      </div>
    `).join('');

    const { buffs, conditions } = _getActiveEffectsData();
    const effectsSummary = `✨ ${buffs.length} Buff${buffs.length === 1 ? '' : 's'} · ⚠ ${conditions.length} Condition${conditions.length === 1 ? '' : 's'}`;

    spine.innerHTML = `
      <section class="calm-spine-card">
        ${entityHtml}
        <div class="calm-hp-head">
          <div class="calm-hp-val calm-num">${_escHtml(hp.current)} / ${_escHtml(hp.max)}</div>
          <div class="calm-hp-chips calm-num">
            ${hp.temp > 0 ? `<span class="calm-chip-temp">+${_escHtml(hp.temp)} Temp</span>` : ''}
            ${hp.nonlethal > 0 ? `<span class="calm-chip-nl">${_escHtml(hp.nonlethal)} Nonlethal</span>` : ''}
          </div>
        </div>
        <div class="calm-hp-track" aria-label="Hit Points Bar">
          <div class="calm-hp-fill-real" style="width:${realPct}%;"></div>
          <div class="calm-hp-fill-temp" style="width:${tempPct}%;"></div>
          ${nlPct > 0 ? `<div class="calm-hp-fill-nl" style="width:${nlPct}%;"></div>` : ''}
        </div>
        <div class="calm-hp-btns">
          <button type="button" class="calm-btn-l calm-btn-dmg" data-action="calm:hp-open" data-mode="damage">− Damage</button>
          <button type="button" class="calm-btn-l calm-btn-heal" data-action="calm:hp-open" data-mode="heal">+ Heal</button>
        </div>
        <div class="calm-hp-meta">
          <button type="button" class="calm-hp-periodic" data-action="hud:open-periodic-hp" title="Manage Periodic HP (Bleed, Fast Healing, Regen)">⏱ Periodic${periodicCount > 0 ? ` (${periodicCount})` : ''}</button>
          <span class="calm-sec-label calm-num">${_escHtml(hp.condition || 'Healthy')}</span>
        </div>
        <div class="calm-hp-popover" id="calm-hp-popover" ${_hpPopoverOpen ? '' : 'hidden'}>
          <div class="calm-hp-pop-row">
            <input type="number" id="calm-hp-input" class="calm-hp-input calm-num" min="1" step="1" placeholder="${_hpMode === 'damage' ? 'Damage' : 'Heal'}" />
            <button type="button" class="calm-btn-s calm-btn-primary" data-action="calm:hp-apply">OK</button>
            <button type="button" class="calm-btn-s" data-action="calm:hp-close">Esc</button>
          </div>
        </div>
      </section>

      <section class="calm-spine-card">
        <div class="calm-grid-head">
          <span class="calm-sec-label">Abilities</span>
        </div>
        <div class="calm-3x2-grid">${abilitiesHtml}</div>
      </section>

      <section class="calm-spine-card">
        <div class="calm-grid-head">
          <span class="calm-sec-label">Defense &amp; Saves</span>
          <span class="calm-sec-label calm-num">Speed ${_escHtml(speedVal)} ft</span>
        </div>
        <div class="calm-3x2-grid">${defenseHtml}</div>
      </section>

      <button type="button" class="calm-effects-bar" id="calm-effects-btn" data-action="calm:effects-flyout" title="View all active Buffs &amp; Conditions or Pin to Right">
        <span>${_escHtml(effectsSummary)}</span>
        <span class="calm-sec-label">${_rightPinned ? 'Pinned' : '▾'}</span>
      </button>
    `;

    renderRightRail();
  }

  function renderRightRail() {
    const rail = typeof document !== 'undefined' ? document.getElementById('calm-right-rail') : null;
    if (!rail) return;
    if (!_rightPinned) {
      rail.innerHTML = '';
      return;
    }
    const { buffs, conditions } = _getActiveEffectsData();
    const condHtml = conditions.length > 0
      ? `<div class="calm-cond-list">${conditions.map(c => `<span class="calm-cond-chip">⚠ ${_escHtml(c)}</span>`).join('')}</div>`
      : '';
    const buffsHtml = buffs.length > 0
      ? `<div class="calm-buff-list">${buffs.map(b => {
          const bName = (b && (b.name || b.label)) || 'Buff';
          const bDur = (b && (b.durationText || b.duration || (b.roundsLeft !== undefined ? `${b.roundsLeft} r` : ''))) || '';
          const bSummary = (b && (b.summary || b.note)) || '';
          return `
            <div class="calm-buff-item">
              <div style="min-width:0;">
                <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${_escHtml(bName)}</div>
                ${bSummary ? `<div class="calm-buff-meta">${_escHtml(bSummary)}</div>` : ''}
              </div>
              ${bDur ? `<span class="calm-sec-label calm-num">${_escHtml(bDur)}</span>` : ''}
            </div>
          `;
        }).join('')}</div>`
      : '<div class="calm-buff-meta">No active buffs.</div>';

    rail.innerHTML = `
      <div class="calm-right-card">
        <div class="calm-right-head">
          <span class="calm-sec-label">Active Buffs &amp; Conditions</span>
          <div style="display:flex; gap:4px;">
            <button type="button" class="calm-btn-s" style="height:24px; padding:0 8px;" data-action="combat:open-add-buff">+ Buff</button>
            <button type="button" class="calm-btn-s" style="height:24px; padding:0 8px;" data-action="calm:unpin-right" title="Close &amp; return to 2-Col">✕</button>
          </div>
        </div>
        ${condHtml}
        ${buffsHtml}
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // 4. Anchored Popover (ⓘ Breakdown, ✦ Situational, Effects Flyout, Themes)
  // ---------------------------------------------------------------------------
  function _showPopover(anchorEl, title, bodyHtml) {
    const pop = document.getElementById('calm-popover');
    if (!pop) return;
    pop.innerHTML = `
      <div class="calm-pop-head">
        <span class="calm-pop-title">${_escHtml(title)}</span>
        <button type="button" class="calm-pop-close" data-action="calm:pop-close" title="Close">✕</button>
      </div>
      <div class="calm-pop-body">${bodyHtml}</div>
    `;
    pop.hidden = false;
    if (anchorEl && typeof anchorEl.getBoundingClientRect === 'function') {
      const rect = anchorEl.getBoundingClientRect();
      const top = Math.min(window.innerHeight - 240, Math.max(58, rect.bottom + 6));
      const left = Math.min(window.innerWidth - 336, Math.max(12, rect.left));
      pop.style.top = `${top}px`;
      pop.style.left = `${left}px`;
    }
  }

  function _closePopover() {
    const pop = document.getElementById('calm-popover');
    if (pop) pop.hidden = true;
  }

  function _openInfoPopover(anchorEl, kind, key) {
    const doc = _getDoc();
    const derived = _getDerived();
    if (kind === 'ability') {
      const dAb = derived && derived.abilities && derived.abilities[key];
      const val = (dAb && dAb.total) ?? (doc && doc.abilities && doc.abilities[key]) ?? 10;
      const base = (dAb && dAb.base) ?? (doc && doc.baseAbilities && doc.baseAbilities[key]) ?? val;
      const mods = (dAb && Array.isArray(dAb.sources) ? dAb.sources : [])
        .map(s => `${_escHtml(s.source || s.label || 'Bonus')}: ${_fmtSigned(s.val ?? s.value ?? 0)}`);
      const body = `Base: <strong>${_escHtml(base)}</strong> · Effective: <strong>${_escHtml(val)}</strong>` +
        (mods.length ? `<br/>${mods.join('<br/>')}` : '');
      _showPopover(anchorEl, `ⓘ ${key.toUpperCase()} Breakdown`, body);
      return;
    }

    if (key === 'ac' || key === 'touch' || key === 'ff') {
      const bd = (derived && derived.acBreakdown) || (doc && doc.acBreakdown) || {};
      const parts = [
        'Base 10',
        bd.armor ? `Armor +${bd.armor}` : '',
        bd.shield ? `Shield +${bd.shield}` : '',
        bd.effectiveDex !== undefined ? `Dex ${_fmtSigned(bd.effectiveDex)}` : '',
        bd.natural ? `Natural +${bd.natural}` : '',
        bd.deflection ? `Deflection +${bd.deflection}` : '',
        bd.dodge ? `Dodge +${bd.dodge}` : '',
        bd.size ? `Size ${_fmtSigned(bd.size)}` : '',
        bd.misc ? `Misc ${_fmtSigned(bd.misc)}` : '',
        bd.penalty ? `Penalty -${Math.abs(bd.penalty)}` : ''
      ].filter(Boolean);
      _showPopover(anchorEl, `ⓘ ${key.toUpperCase()} Breakdown`, parts.map(p => _escHtml(p)).join(' · '));
      return;
    }

    const view = _getEntityView();
    const sv = view.saves[key] ?? 0;
    const baseSv = (doc && doc.baseSaves && doc.baseSaves[key]) || 0;
    _showPopover(anchorEl, `ⓘ ${key.toUpperCase()} Save`, `Total: <strong>${_fmtSigned(sv)}</strong> (Base ${_fmtSigned(baseSv)} + Ability + Items/Buffs)`);
  }

  function _openSparkPopover(anchorEl, key) {
    const sitMap = _getSituationalMap();
    const list = sitMap[key] || [];
    const html = list.length > 0
      ? list.map(item => {
          const sign = _fmtSigned(item.val ?? item.value ?? 0);
          const cond = item.condition || item.label || 'Situational';
          const src = item.source ? ` [${item.source}]` : '';
          return `<div>• <strong>${_escHtml(sign)}</strong> ${_escHtml(item.type || '')} (${_escHtml(cond)})${_escHtml(src)}</div>`;
        }).join('')
      : '<div>No active situational notes.</div>';
    _showPopover(anchorEl, `✦ Situational Reminders (${key.toUpperCase()})`, html);
  }

  // ---------------------------------------------------------------------------
  // 5. Center Rule Master Sync + Settings Appearance Card
  // ---------------------------------------------------------------------------
  function _syncRmBarState() {
    if (typeof document === 'undefined' || !document.documentElement) return;
    const quick = document.getElementById('rm-assist-quickbar');
    const panel = document.getElementById('rm-assist-panel');
    const isOpen = Boolean(
      (quick && !quick.classList.contains('is-hidden')) ||
      (panel && !panel.classList.contains('is-hidden'))
    );
    document.documentElement.dataset.calmRmOpen = isOpen ? '1' : '0';
  }

  function _initCenterRuleMaster() {
    if (typeof document === 'undefined') return;
    const fab = document.getElementById('rm-assist-fab');
    const quick = document.getElementById('rm-assist-quickbar');
    const panel = document.getElementById('rm-assist-panel');
    if (!fab || !quick || !panel) return;

    if (!_rmObserver && typeof MutationObserver === 'function') {
      _rmObserver = new MutationObserver(() => {
        _syncRmBarState();
        if (_isCalmDesktop()) {
          const openNow = !quick.classList.contains('is-hidden') || !panel.classList.contains('is-hidden');
          try { localStorage.setItem(STORAGE_RM_COLLAPSED_KEY, openNow ? '0' : '1'); } catch (err) {
            if (typeof reportError === 'function') reportError('sheet_spine:rmPref', err);
          }
        }
      });
      _rmObserver.observe(quick, { attributes: true, attributeFilter: ['class'] });
      _rmObserver.observe(panel, { attributes: true, attributeFilter: ['class'] });
    }

    // Open Rule Master Center Bar on initial desktop boot unless user explicitly collapsed it
    if (_isCalmDesktop()) {
      let collapsedPref = false;
      try { collapsedPref = localStorage.getItem(STORAGE_RM_COLLAPSED_KEY) === '1'; } catch (err) {
        if (typeof reportError === 'function') reportError('sheet_spine:rmPrefRead', err);
      }
      if (!collapsedPref && quick.classList.contains('is-hidden') && panel.classList.contains('is-hidden')) {
        fab.click();
      }
    }
    _syncRmBarState();
  }

  function syncSettingsUi() {
    const modal = typeof document !== 'undefined' ? document.getElementById('settings-modal') : null;
    if (!modal) return;
    const body = modal.querySelector('.overflow-y-auto') || modal.querySelector('.p-4') || modal;
    if (!body) return;

    let card = document.getElementById('calm-settings-appearance-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'calm-settings-appearance-card';
      card.className = 'calm-settings-card';
      body.insertBefore(card, body.firstChild);
    }

    const curTheme = root.Sheet && root.Sheet.theme ? root.Sheet.theme.get() : 'slate';
    const isCalm = root.Sheet && root.Sheet.shell ? root.Sheet.shell.isCalm() : true;
    const themes = [
      { id: 'slate', label: 'A · Muted Slate' },
      { id: 'obsidian', label: 'B · Obsidian & Bronze' },
      { id: 'midnight', label: 'C · Midnight Minimal' }
    ];

    card.innerHTML = `
      <div class="calm-settings-row">
        <div>
          <div style="font-size:12px; font-weight:800; color:#f8fafc;">🎨 Sheet Theme &amp; Layout</div>
          <div style="font-size:11px; color:#94a3b8;">Choose your personal palette and Desktop Shell mode.</div>
        </div>
        <button type="button" class="calm-settings-pill ${isCalm ? 'active' : ''}" data-action="calm:toggle-shell">
          ${isCalm ? '✨ Calm Shell (Active)' : 'Switch to Calm Shell'}
        </button>
      </div>
      <div class="calm-settings-pills">
        ${themes.map(t => `
          <button type="button" class="calm-settings-pill ${curTheme === t.id ? 'active' : ''}" data-action="calm:set-theme" data-theme="${_escAttr(t.id)}">${_escHtml(t.label)}</button>
        `).join('')}
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // 6. Delegated Actions (0 inline events)
  // ---------------------------------------------------------------------------
  function _registerActions() {
    if (!root.Actions || typeof root.Actions.register !== 'function') return;

    root.Actions.register('calm:lens', (el, data) => {
      const lens = (data && data.lens) || 'play';
      const tabId = LENS_TO_TAB[lens] || 'tab-combat';
      _activeLens = lens;
      _syncDatasetFlags();
      renderTopbar();
      if (typeof root.switchTab === 'function') {
        root.switchTab(tabId);
      }
    });

    root.Actions.register('calm:theme-menu', (el) => {
      const curTheme = root.Sheet && root.Sheet.theme ? root.Sheet.theme.get() : 'slate';
      const isCalm = root.Sheet && root.Sheet.shell ? root.Sheet.shell.isCalm() : true;
      const themes = [
        { id: 'slate', label: 'A · Muted Slate' },
        { id: 'obsidian', label: 'B · Obsidian & Bronze' },
        { id: 'midnight', label: 'C · Midnight Minimal' }
      ];
      const html = `
        <div class="calm-theme-grid">
          ${themes.map(t => `
            <button type="button" class="calm-theme-btn ${curTheme === t.id ? 'active' : ''}" data-action="calm:set-theme" data-theme="${_escAttr(t.id)}">
              <span>${_escHtml(t.label)}</span>
              <span>${curTheme === t.id ? '✓' : ''}</span>
            </button>
          `).join('')}
          <button type="button" class="calm-theme-btn" style="margin-top:4px;" data-action="calm:toggle-shell">
            <span>${isCalm ? 'Switch to Classic Layout' : 'Switch to Calm Layout'}</span>
            <span>⇄</span>
          </button>
        </div>
      `;
      _showPopover(el, '🎨 Sheet Theme', html);
    });

    root.Actions.register('calm:set-theme', (el, data) => {
      const val = (data && data.theme) || 'slate';
      if (root.Sheet && root.Sheet.theme) root.Sheet.theme.set(val);
      _closePopover();
      renderTopbar();
      syncSettingsUi();
      if (typeof root.showToast === 'function') root.showToast(`Theme switched to ${val}`, 'info');
    });

    root.Actions.register('calm:toggle-shell', () => {
      if (!root.Sheet || !root.Sheet.shell) return;
      const next = root.Sheet.shell.isCalm() ? 'classic' : 'calm';
      root.Sheet.shell.setMode(next);
      _syncOwnership();
      _syncDatasetFlags();
      _closePopover();
      syncSettingsUi();
      if (typeof root.renderAll === 'function') root.renderAll({ skipRecompute: true });
      if (typeof root.showToast === 'function') root.showToast(`Layout: ${next === 'calm' ? 'Calm Shell' : 'Classic Sheet'}`, 'info');
    });

    root.Actions.register('calm:entity-switch', (el, data) => {
      _activeEntityId = (data && data.entity) || 'self';
      renderSpine();
    });

    root.Actions.register('calm:hp-open', (el, data) => {
      _hpMode = (data && data.mode) === 'heal' ? 'heal' : 'damage';
      _hpPopoverOpen = true;
      renderSpine();
      const inp = document.getElementById('calm-hp-input');
      if (inp) {
        inp.focus();
        inp.select();
      }
    });

    root.Actions.register('calm:hp-close', () => {
      _hpPopoverOpen = false;
      renderSpine();
    });

    root.Actions.register('calm:hp-apply', () => {
      const inp = document.getElementById('calm-hp-input');
      const val = Math.max(0, parseInt(inp && inp.value, 10) || 0);
      _hpPopoverOpen = false;
      if (val <= 0) {
        renderSpine();
        return;
      }
      if (_activeEntityId !== 'self' && root.CharStore && typeof root.CharStore.dispatch === 'function') {
        const delta = _hpMode === 'damage' ? -val : val;
        root.CharStore.dispatch({
          type: 'companion/adjustHp',
          payload: { id: _activeEntityId, delta },
          meta: { label: `Companion ${_hpMode === 'damage' ? 'Damage' : 'Heal'} (${val})` }
        });
        if (typeof root.showToast === 'function') root.showToast(`Companion ${_hpMode === 'damage' ? '-' : '+'}${val} HP (Ctrl+Z to Undo)`, 'info');
      } else if (typeof root.applyHpModalAdjustment === 'function') {
        root.applyHpModalAdjustment(_hpMode, val, _hpMode === 'damage' ? 'Damage' : 'Healing');
        if (typeof root.showToast === 'function') root.showToast(`${_hpMode === 'damage' ? '-' : '+'}${val} HP applied (Ctrl+Z to Undo)`, 'info');
      }
      renderSpine();
    });

    root.Actions.register('calm:roll-save', (el, data) => {
      if (data && data.saveKey && typeof root.rollSave3D === 'function') {
        root.rollSave3D(data.saveKey);
      }
    });

    root.Actions.register('calm:info', (el, data, ev) => {
      if (ev) ev.stopPropagation();
      _openInfoPopover(el, (data && data.kind) || 'defense', (data && data.key) || 'ac');
    });

    root.Actions.register('calm:spark', (el, data, ev) => {
      if (ev) ev.stopPropagation();
      _openSparkPopover(el, (data && data.key) || 'ac');
    });

    root.Actions.register('calm:pop-close', () => {
      _closePopover();
    });

    root.Actions.register('calm:effects-flyout', (el) => {
      const { buffs, conditions } = _getActiveEffectsData();
      const condHtml = conditions.length > 0
        ? `<div class="calm-cond-list" style="margin-bottom:8px;">${conditions.map(c => `<span class="calm-cond-chip">⚠ ${_escHtml(c)}</span>`).join('')}</div>`
        : '';
      const buffsHtml = buffs.length > 0
        ? `<div class="calm-buff-list">${buffs.map(b => {
            const bName = (b && (b.name || b.label)) || 'Buff';
            const bDur = (b && (b.durationText || b.duration || '')) || '';
            return `<div class="calm-buff-item"><span><strong>${_escHtml(bName)}</strong></span>${bDur ? `<span class="calm-sec-label calm-num">${_escHtml(bDur)}</span>` : ''}</div>`;
          }).join('')}</div>`
        : '<div>No active buffs.</div>';
      const actionsRow = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
          <button type="button" class="calm-btn-m" data-action="combat:open-add-buff">+ Add Buff</button>
          <button type="button" class="calm-btn-m" data-action="${_rightPinned ? 'calm:unpin-right' : 'calm:pin-right'}">${_rightPinned ? 'Unpin Right' : '📌 Pin to Right'}</button>
        </div>
      `;
      _showPopover(el, 'Active Buffs & Conditions', actionsRow + condHtml + buffsHtml);
    });

    root.Actions.register('calm:pin-right', () => {
      _rightPinned = true;
      _writePinPref(true);
      _syncDatasetFlags();
      _closePopover();
      renderSpine();
    });

    root.Actions.register('calm:unpin-right', () => {
      _rightPinned = false;
      _writePinPref(false);
      _syncDatasetFlags();
      _closePopover();
      renderSpine();
    });

    root.Actions.register('calm:dice-toggle', () => {
      _diceOpen = !_diceOpen;
      _syncDatasetFlags();
      if (_diceOpen && typeof root.renderDiceHistory === 'function') {
        root.renderDiceHistory();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 7. Boot & Lifecycle Hooks
  // ---------------------------------------------------------------------------
  function onTabChanged(tabId) {
    if (!tabId) return;
    if (tabId === 'tab-dice' && _isCalmDesktop()) {
      _diceOpen = true;
      _syncDatasetFlags();
      return;
    }
    const mapped = TAB_TO_LENS[tabId];
    if (mapped) {
      _activeLens = mapped;
      _syncDatasetFlags();
      renderTopbar();
    }
  }

  function _init() {
    if (_booted) return;
    _booted = true;

    _rightPinned = _readPinPref();
    try {
      const savedTab = localStorage.getItem('dnd35_active_tab');
      if (savedTab && TAB_TO_LENS[savedTab]) _activeLens = TAB_TO_LENS[savedTab];
    } catch (err) {
      if (typeof reportError === 'function') reportError('sheet_spine:savedTab', err);
    }

    _syncDatasetFlags();
    _syncOwnership();
    _registerActions();

    if (root.Sheet && root.Sheet.regions) {
      root.Sheet.regions.register('calm.spine', {
        slices: ['hp', 'abilities', 'defense', 'saves', 'effects', '*'],
        render: () => {
          if (!_isCalmDesktop()) return;
          renderTopbar();
          renderSpine();
        }
      });
    }

    document.addEventListener('click', (ev) => {
      const pop = document.getElementById('calm-popover');
      if (pop && !pop.hidden && !ev.target.closest('#calm-popover') && !ev.target.closest('#calm-effects-btn') && !ev.target.closest('.calm-tb-btn') && !ev.target.closest('.calm-info-btn') && !ev.target.closest('.calm-spark')) {
        _closePopover();
      }
    });

    document.addEventListener('keydown', (ev) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        if (_isCalmDesktop()) {
          const inp = document.getElementById('rm-assist-quick-input') || document.getElementById('rm-assist-input');
          if (inp) {
            ev.preventDefault();
            const quick = document.getElementById('rm-assist-quickbar');
            const fab = document.getElementById('rm-assist-fab');
            if (quick && quick.classList.contains('is-hidden') && fab) fab.click();
            inp.focus();
            inp.select();
          }
        }
        return;
      }

      if (ev.key === 'Escape') {
        if (_hpPopoverOpen) { _hpPopoverOpen = false; renderSpine(); return; }
        const pop = document.getElementById('calm-popover');
        if (pop && !pop.hidden) { _closePopover(); return; }
        if (_diceOpen) { _diceOpen = false; _syncDatasetFlags(); return; }
        return;
      }

      if (ev.key === 'Enter' && ev.target && ev.target.id === 'calm-hp-input') {
        ev.preventDefault();
        const okBtn = document.querySelector('#calm-hp-popover [data-action="calm:hp-apply"]');
        if (okBtn) okBtn.click();
        return;
      }

      if (!_isCalmDesktop()) return;
      const tag = (ev.target && ev.target.tagName || '').toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && tag !== 'select' && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        const lensMap = { '1': 'play', '2': 'prep', '3': 'gear', '4': 'build' };
        if (lensMap[ev.key]) {
          const l = lensMap[ev.key];
          _activeLens = l;
          _syncDatasetFlags();
          renderTopbar();
          if (typeof root.switchTab === 'function') root.switchTab(LENS_TO_TAB[l]);
        }
      }
    });

    window.addEventListener('resize', () => {
      _syncOwnership();
      if (_isCalmDesktop()) {
        renderTopbar();
        renderSpine();
      }
    });

    renderTopbar();
    renderSpine();

    setTimeout(() => {
      _initCenterRuleMaster();
      if (root.Sheet && root.Sheet.warmup && typeof root.Sheet.warmup.schedule === 'function') {
        root.Sheet.warmup.schedule(_getDoc());
      }
    }, 450);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _init);
    } else {
      _init();
    }
  }

  const spineApi = {
    renderTopbar,
    renderSpine,
    renderRightRail,
    onTabChanged,
    syncSettingsUi
  };

  if (root && root.Sheet) {
    root.Sheet.spine = spineApi;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = spineApi;
  }
})(typeof window !== 'undefined' ? window : globalThis);
