/**
 * Joyful-Fermi — Preview-Only On-Page Review Note Tool (Vercel-Toolbar style)
 *
 * Isolated module for `preview/calm-sheet-redesign` (removed before `main` merge).
 * Zero `window.*` globals, zero inline `on*=` attributes, zero native dialogs,
 * zero external dependencies, zero `U+1F3B2`.
 */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'jf_preview_review_notes_v1';

  function _err(ctx, err) {
    if (typeof root !== 'undefined' && typeof root.reportError === 'function') {
      root.reportError(`dev_review_notes:${ctx}`, err);
    } else if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(`[dev_review_notes:${ctx}]`, err);
    }
  }

  function _esc(val) {
    return String(val === undefined || val === null ? '' : val).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function _mount() {
    if (typeof document === 'undefined' || !document.body) return;
    try {
      if (new URLSearchParams(window.location.search || '').get('embed') === '1') return;
    } catch (e) {
      _err('embedCheck', e);
    }
    if (document.getElementById('dev-rn-bar')) return;

    let notes = [];
    let noteMode = false;
    let drawerOpen = false;
    let pendingDraft = null;
    let editingId = null;
    let clearArmed = false;

    function loadNotes() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        notes = raw ? (JSON.parse(raw) || []) : [];
      } catch (e) {
        _err('load', e);
        notes = [];
      }
    }

    function saveNotes() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch (e) {
        _err('save', e);
      }
      const cntBtn = document.getElementById('dev-rn-drawer-btn');
      if (cntBtn) cntBtn.textContent = `📋 Notlar (${notes.length})`;
    }

    function toast(msg) {
      if (typeof root.showToast === 'function') {
        root.showToast(msg, 'info');
      }
    }

    // Scoped Styles (no leakage into tailwind_compiled / sheet_shell)
    const style = document.createElement('style');
    style.id = 'dev-review-notes-style';
    style.textContent = `
      body.dev-rn-active, body.dev-rn-active * { cursor: crosshair !important; }
      body.dev-rn-active #dev-rn-bar, body.dev-rn-active #dev-rn-bar *,
      body.dev-rn-active #dev-rn-composer, body.dev-rn-active #dev-rn-composer *,
      body.dev-rn-active #dev-rn-drawer, body.dev-rn-active #dev-rn-drawer *,
      body.dev-rn-active .dev-rn-pin { cursor: pointer !important; }
      body.dev-rn-active #dev-rn-composer textarea { cursor: text !important; }

      #dev-rn-bar {
        position: fixed; top: 60px; right: 16px; z-index: 90;
        display: inline-grid; grid-auto-flow: column; gap: 3px; padding: 3px;
        background: rgba(11, 15, 24, 0.94); backdrop-filter: blur(8px);
        border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 999px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        font-family: ui-sans-serif, system-ui, sans-serif;
      }
      .dev-rn-pill-btn {
        height: 26px; padding: 0 10px; border-radius: 999px; border: 0;
        background: transparent; color: #cbd5e1; font-size: 11px; font-weight: 700;
        cursor: pointer; white-space: nowrap; transition: background 120ms ease, color 120ms ease;
      }
      .dev-rn-pill-btn:hover { color: #ffffff; background: rgba(148, 163, 184, 0.14); }
      .dev-rn-pill-btn.is-on { background: #0284c7; color: #ffffff; }

      #dev-rn-outline {
        position: fixed; pointer-events: none; z-index: 88;
        border: 2px solid #38bdf8; background: rgba(56, 189, 248, 0.08);
        border-radius: 6px; transition: top 55ms ease, left 55ms ease, width 55ms ease, height 55ms ease;
      }
      #dev-rn-outline[hidden] { display: none; }

      #dev-rn-pins {
        position: absolute; top: 0; left: 0; width: 100%; height: 0;
        pointer-events: none; z-index: 88;
      }
      .dev-rn-pin {
        position: absolute; pointer-events: auto;
        width: 24px; height: 24px; border-radius: 50%;
        background: #38bdf8; color: #090b10;
        font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums;
        border: 2px solid #f8fafc; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
        transform: translate(-50%, -50%);
        display: flex; align-items: center; justify-content: center; padding: 0;
      }
      .dev-rn-pin:hover { transform: translate(-50%, -50%) scale(1.14); background: #7dd3fc; }
      .dev-rn-pin.is-pulse { box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.45), 0 4px 14px rgba(0,0,0,0.6); }

      #dev-rn-composer {
        position: fixed; z-index: 96; width: 320px; max-width: 92vw;
        background: #141a26; border: 1px solid #38bdf8; border-radius: 10px;
        padding: 11px; box-shadow: 0 20px 48px rgba(0, 0, 0, 0.72); color: #f1f5f9;
        font-family: ui-sans-serif, system-ui, sans-serif;
      }
      #dev-rn-composer[hidden] { display: none; }
      .dev-rn-textarea {
        width: 100%; min-height: 72px; resize: vertical;
        background: #0b0f18; border: 1px solid #2b3850; border-radius: 6px;
        padding: 7px 9px; font-size: 12px; color: #f8fafc; outline: none; font-family: inherit;
      }
      .dev-rn-textarea:focus { border-color: #38bdf8; }

      #dev-rn-drawer {
        position: fixed; top: 52px; right: 0; bottom: 0; width: 370px; max-width: 94vw; z-index: 92;
        background: #0f141f; border-left: 1px solid #263147;
        box-shadow: -16px 0 44px rgba(0, 0, 0, 0.65);
        display: flex; flex-direction: column; color: #f1f5f9;
        font-family: ui-sans-serif, system-ui, sans-serif;
      }
      #dev-rn-drawer[hidden] { display: none; }
      .dev-rn-dhead {
        padding: 12px 14px; border-bottom: 1px solid #1e2636;
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
      }
      .dev-rn-dbody {
        flex: 1; overflow-y: auto; padding: 10px 12px;
        display: flex; flex-direction: column; gap: 8px;
      }
      .dev-rn-card {
        background: #151c2c; border: 1px solid #232e44; border-radius: 8px;
        padding: 9px 10px; display: flex; flex-direction: column; gap: 5px;
      }
      .dev-rn-card:hover { border-color: #38bdf8; }
      .dev-rn-tag {
        font-size: 10px; font-weight: 700; color: #7dd3fc;
        background: rgba(56, 189, 248, 0.12); padding: 1px 6px; border-radius: 4px;
      }
      .dev-rn-sbtn {
        height: 24px; padding: 0 8px; border-radius: 5px; border: 0;
        font-size: 11px; font-weight: 700; cursor: pointer;
      }
    `;
    document.head.appendChild(style);

    const bar = document.createElement('div');
    bar.id = 'dev-rn-bar';
    bar.innerHTML = `
      <button type="button" class="dev-rn-pill-btn" id="dev-rn-mode-btn" data-rn-action="toggle" title="Toggle Review Note Mode (Alt+N)">📌 Not Modu</button>
      <button type="button" class="dev-rn-pill-btn" id="dev-rn-drawer-btn" data-rn-action="drawer">📋 Notlar (0)</button>
    `;

    const outline = document.createElement('div');
    outline.id = 'dev-rn-outline';
    outline.hidden = true;

    const pinsLayer = document.createElement('div');
    pinsLayer.id = 'dev-rn-pins';

    const composer = document.createElement('div');
    composer.id = 'dev-rn-composer';
    composer.hidden = true;
    composer.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:11.5px; font-weight:700; color:#7dd3fc;" id="dev-rn-comp-title">📌 Yeni Not</span>
        <button type="button" class="dev-rn-sbtn" style="background:transparent; color:#94a3b8;" data-rn-action="cancel">✕</button>
      </div>
      <div style="font-size:10.5px; color:#94a3b8; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" id="dev-rn-comp-ctx"></div>
      <textarea id="dev-rn-comp-input" class="dev-rn-textarea" placeholder="Notunu yaz… (Enter: Kaydet · Shift+Enter: Satır · Esc: İptal)"></textarea>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-top:8px;">
        <button type="button" class="dev-rn-sbtn" id="dev-rn-comp-del" style="background:rgba(225,29,72,0.16); color:#fda4af; border:1px solid rgba(225,29,72,0.35);" data-rn-action="del-editing" hidden>Sil</button>
        <div style="display:flex; gap:6px; margin-left:auto;">
          <button type="button" class="dev-rn-sbtn" style="background:#1e293b; color:#cbd5e1;" data-rn-action="cancel">İptal</button>
          <button type="button" class="dev-rn-sbtn" style="background:#0284c7; color:#fff;" data-rn-action="save">Kaydet</button>
        </div>
      </div>
    `;

    const drawer = document.createElement('aside');
    drawer.id = 'dev-rn-drawer';
    drawer.hidden = true;
    drawer.innerHTML = `
      <div class="dev-rn-dhead">
        <div>
          <div style="font-size:13px; font-weight:800;">📋 Preview Tasarım Notları</div>
          <div style="font-size:11px; color:#94a3b8;">Tıklayınca kaydettiğin tema/lens konumuna döner</div>
        </div>
        <button type="button" class="dev-rn-sbtn" style="background:transparent; color:#94a3b8;" data-rn-action="drawer-close">✕</button>
      </div>
      <div style="padding:8px 12px; border-bottom:1px solid #1e2636; display:grid; grid-template-columns:1fr auto; gap:8px;">
        <button type="button" class="dev-rn-sbtn" style="height:30px; background:#0284c7; color:#fff;" data-rn-action="copy">📋 Tümünü Kopyala</button>
        <button type="button" class="dev-rn-sbtn" id="dev-rn-clear-btn" style="height:30px; background:rgba(225,29,72,0.14); color:#fda4af; border:1px solid rgba(225,29,72,0.3);" data-rn-action="clear">Temizle</button>
      </div>
      <div id="dev-rn-fallback-wrap" style="padding:8px 12px; border-bottom:1px solid #1e2636;" hidden>
        <div style="font-size:10.5px; color:#7dd3fc; margin-bottom:4px;">Pano engellendiyse Ctrl+C ile kopyala:</div>
        <textarea id="dev-rn-fallback" class="dev-rn-textarea" readonly style="min-height:84px;"></textarea>
      </div>
      <div class="dev-rn-dbody" id="dev-rn-list"></div>
    `;

    document.body.appendChild(bar);
    document.body.appendChild(outline);
    document.body.appendChild(pinsLayer);
    document.body.appendChild(composer);
    document.body.appendChild(drawer);

    function currentContext() {
      const ds = document.documentElement.dataset || {};
      const ch = (root.CharStore && typeof root.CharStore.getDoc === 'function' ? root.CharStore.getDoc() : null) || root.character || {};
      const charName = ch.name || 'Character';
      const charLvl = ch.level || (Array.isArray(ch.levelProgression) ? ch.levelProgression.filter(p => p.active !== false).length : 1) || 1;
      let activeTab = 'tab-combat';
      try { activeTab = localStorage.getItem('dnd35_active_tab') || 'tab-combat'; } catch (e) { _err('readTab', e); }
      return {
        shell: ds.sheetShell || 'calm',
        theme: ds.sheetTheme || 'slate',
        lens: ds.calmLens || activeTab,
        rightPinned: ds.calmRightPinned === '1' ? 'pinned' : '2col',
        charTag: `${charName} L${charLvl}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      };
    }

    function shortSelector(el) {
      const parts = [];
      let cur = el;
      for (let i = 0; i < 3 && cur && cur !== document.body && cur.nodeType === 1; i++) {
        let seg = cur.tagName.toLowerCase();
        if (cur.id) {
          parts.unshift('#' + cur.id);
          break;
        }
        const cls = String(cur.className || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
        if (cls.length) seg += '.' + cls.join('.');
        parts.unshift(seg);
        cur = cur.parentElement;
      }
      return parts.join(' > ') || 'body';
    }

    function renderPins() {
      const ctx = currentContext();
      const visible = notes.filter(n => !n.lens || n.lens === ctx.lens);
      pinsLayer.innerHTML = visible.map(n => `
        <button type="button" class="dev-rn-pin" data-rn-action="pin-click" data-id="${_esc(n.id)}"
          style="left:${Number(n.pageX) || 0}px; top:${Number(n.pageY) || 0}px;" title="${_esc(n.text)}">${Number(n.num) || 1}</button>
      `).join('');
    }

    function renderDrawer() {
      const list = document.getElementById('dev-rn-list');
      if (!list) return;
      if (notes.length === 0) {
        list.innerHTML = `<div style="text-align:center; color:#64748b; padding:24px 8px; font-size:12px;">Henüz not yok.<br/>Sağ üstteki <strong>📌 Not Modu</strong>'nu açıp ekranda herhangi bir öğeye tıkla (<code>Alt+N</code>).</div>`;
        return;
      }
      list.innerHTML = notes.map(n => `
        <div class="dev-rn-card">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
            <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
              <span class="dev-rn-pin" style="position:static; transform:none; width:20px; height:20px; font-size:10px;">${Number(n.num) || 1}</span>
              <span class="dev-rn-tag">${_esc(n.theme)} · ${_esc(n.rightPinned)} · ${_esc(n.lens)}</span>
            </div>
            <button type="button" class="dev-rn-sbtn" style="background:transparent; color:#fda4af;" data-rn-action="del" data-id="${_esc(n.id)}" title="Sil">✕</button>
          </div>
          <button type="button" style="text-align:left; background:transparent; border:0; color:inherit; cursor:pointer; padding:0;" data-rn-action="jump" data-id="${_esc(n.id)}">
            <div style="font-size:10.5px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${_esc(n.selector)}${n.snippet ? ' · "' + _esc(n.snippet) + '"' : ''}</div>
            <div style="font-size:12px; color:#f1f5f9; margin-top:3px; white-space:pre-wrap;">${_esc(n.text)}</div>
          </button>
        </div>
      `).join('');
    }

    function syncUi() {
      document.body.classList.toggle('dev-rn-active', noteMode);
      const modeBtn = document.getElementById('dev-rn-mode-btn');
      if (modeBtn) modeBtn.classList.toggle('is-on', noteMode);
      if (!noteMode) outline.hidden = true;
      drawer.hidden = !drawerOpen;
      renderPins();
      renderDrawer();
    }

    function openComposer(clientX, clientY, existing) {
      const title = document.getElementById('dev-rn-comp-title');
      const ctxEl = document.getElementById('dev-rn-comp-ctx');
      const inp = document.getElementById('dev-rn-comp-input');
      const delBtn = document.getElementById('dev-rn-comp-del');
      if (existing) {
        editingId = existing.id;
        pendingDraft = null;
        title.textContent = `📌 Not #${existing.num} Düzenle`;
        ctxEl.textContent = `[${existing.theme} · ${existing.lens}] ${existing.selector}`;
        inp.value = existing.text;
        delBtn.hidden = false;
      } else {
        editingId = null;
        title.textContent = `📌 Yeni Not (#${notes.length + 1})`;
        ctxEl.textContent = `[${pendingDraft.theme} · ${pendingDraft.lens}] ${pendingDraft.selector}`;
        inp.value = '';
        delBtn.hidden = true;
      }
      composer.hidden = false;
      composer.style.top = `${Math.min(window.innerHeight - 190, Math.max(58, clientY + 10))}px`;
      composer.style.left = `${Math.min(window.innerWidth - 332, Math.max(12, clientX - 24))}px`;
      inp.focus();
      inp.select();
    }

    function saveCurrentNote() {
      const inp = document.getElementById('dev-rn-comp-input');
      const text = String(inp && inp.value || '').trim();
      if (!text) return toast('Boş not kaydedilemez');
      if (editingId) {
        const target = notes.find(n => n.id === editingId);
        if (target) target.text = text;
        toast(`Not #${target ? target.num : ''} güncellendi`);
      } else if (pendingDraft) {
        const num = notes.length + 1;
        notes.push(Object.assign({ id: `rn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, num, text }, pendingDraft));
        toast(`Not #${num} eklendi`);
      }
      composer.hidden = true;
      pendingDraft = null;
      editingId = null;
      saveNotes();
      syncUi();
    }

    async function copyMarkdown() {
      if (notes.length === 0) return toast('Kopyalanacak not yok');
      const lines = [`# Calm Sheet Preview Notları (${notes.length} adet)`];
      notes.forEach(n => {
        const snip = n.snippet ? ` ("${n.snippet}")` : '';
        lines.push(`${n.num}. [${n.shell} | ${n.theme} | ${n.rightPinned} | ${n.lens} | ${n.charTag} | ${n.viewport}] \`${n.selector}\`${snip}: ${n.text}`);
      });
      const md = lines.join('\n');
      const fbWrap = document.getElementById('dev-rn-fallback-wrap');
      const fbArea = document.getElementById('dev-rn-fallback');
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(md);
          fbWrap.hidden = true;
          toast(`${notes.length} not panoya kopyalandı!`);
          return;
        }
      } catch (e) {
        _err('clipboard', e);
      }
      fbArea.value = md;
      fbWrap.hidden = false;
      fbArea.focus();
      fbArea.select();
      toast('Ctrl+C ile kopyalayabilirsin');
    }

    function handleAction(btn, ev) {
      const act = btn.getAttribute('data-rn-action');
      if (act === 'toggle') {
        noteMode = !noteMode;
        composer.hidden = true;
        syncUi();
        toast(noteMode ? 'Not Modu açık: sayfada herhangi bir öğeye tıkla' : 'Not Modu kapalı');
      } else if (act === 'drawer') {
        drawerOpen = !drawerOpen;
        syncUi();
      } else if (act === 'drawer-close') {
        drawerOpen = false;
        syncUi();
      } else if (act === 'cancel') {
        composer.hidden = true;
        pendingDraft = null;
        editingId = null;
      } else if (act === 'save') {
        saveCurrentNote();
      } else if (act === 'del-editing') {
        if (editingId) {
          notes = notes.filter(n => n.id !== editingId);
          notes.forEach((n, idx) => { n.num = idx + 1; });
          saveNotes();
          toast('Not silindi');
        }
        composer.hidden = true;
        editingId = null;
        syncUi();
      } else if (act === 'del') {
        const id = btn.getAttribute('data-id');
        notes = notes.filter(n => n.id !== id);
        notes.forEach((n, idx) => { n.num = idx + 1; });
        saveNotes();
        syncUi();
      } else if (act === 'pin-click') {
        ev.stopPropagation();
        const id = btn.getAttribute('data-id');
        const note = notes.find(n => n.id === id);
        if (note) openComposer(ev.clientX, ev.clientY, note);
      } else if (act === 'jump') {
        const id = btn.getAttribute('data-id');
        const note = notes.find(n => n.id === id);
        if (!note) return;
        if (root.Sheet && root.Sheet.theme && note.theme) root.Sheet.theme.set(note.theme);
        if (root.Sheet && root.Sheet.shell && note.shell) root.Sheet.shell.setMode(note.shell);
        if (note.rightPinned === 'pinned') document.querySelector('[data-action="calm:pin-right"]')?.click?.();
        const lensBtn = document.querySelector(`[data-action="calm:lens"][data-lens="${note.lens}"]`);
        if (lensBtn) lensBtn.click();
        else if (typeof root.switchTab === 'function' && String(note.lens).startsWith('tab-')) root.switchTab(note.lens);
        setTimeout(() => {
          renderPins();
          const pin = pinsLayer.querySelector(`.dev-rn-pin[data-id="${note.id}"]`);
          if (pin) {
            pin.classList.add('is-pulse');
            pin.scrollIntoView({ block: 'center', behavior: 'smooth' });
            setTimeout(() => pin.classList.remove('is-pulse'), 1400);
          }
        }, 60);
      } else if (act === 'copy') {
        copyMarkdown();
      } else if (act === 'clear') {
        const clrBtn = document.getElementById('dev-rn-clear-btn');
        if (!clearArmed) {
          clearArmed = true;
          if (clrBtn) clrBtn.textContent = 'Emin misin?';
          setTimeout(() => {
            clearArmed = false;
            if (clrBtn) clrBtn.textContent = 'Temizle';
          }, 3000);
          return;
        }
        clearArmed = false;
        if (clrBtn) clrBtn.textContent = 'Temizle';
        notes = [];
        saveNotes();
        document.getElementById('dev-rn-fallback-wrap').hidden = true;
        syncUi();
        toast('Tüm notlar temizlendi');
      }
    }

    document.addEventListener('mousemove', (ev) => {
      if (!noteMode) { outline.hidden = true; return; }
      const el = ev.target;
      if (!el || el === document.body || el === document.documentElement ||
          el.closest('#dev-rn-bar') || el.closest('#dev-rn-composer') ||
          el.closest('#dev-rn-drawer') || el.closest('.dev-rn-pin')) {
        outline.hidden = true;
        return;
      }
      const r = el.getBoundingClientRect();
      outline.hidden = false;
      outline.style.top = `${r.top}px`;
      outline.style.left = `${r.left}px`;
      outline.style.width = `${r.width}px`;
      outline.style.height = `${r.height}px`;
    });

    document.addEventListener('click', (ev) => {
      const rnBtn = ev.target.closest('[data-rn-action]');
      if (rnBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        handleAction(rnBtn, ev);
        return;
      }
      if (!noteMode) return;
      if (ev.target.closest('#dev-rn-bar') || ev.target.closest('#dev-rn-composer') ||
          ev.target.closest('#dev-rn-drawer') || ev.target.closest('.dev-rn-pin')) {
        return;
      }
      ev.preventDefault();
      ev.stopPropagation();
      const ctx = currentContext();
      pendingDraft = Object.assign({
        pageX: Math.round(ev.pageX),
        pageY: Math.round(ev.pageY),
        selector: shortSelector(ev.target),
        snippet: String(ev.target.innerText || ev.target.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)
      }, ctx);
      openComposer(ev.clientX, ev.clientY, null);
    }, true);

    document.addEventListener('keydown', (ev) => {
      if (ev.altKey && ev.key.toLowerCase() === 'n') {
        ev.preventDefault();
        noteMode = !noteMode;
        composer.hidden = true;
        syncUi();
        return;
      }
      if (ev.key === 'Escape') {
        if (!composer.hidden) { composer.hidden = true; pendingDraft = null; editingId = null; return; }
        if (drawerOpen) { drawerOpen = false; syncUi(); return; }
        if (noteMode) { noteMode = false; syncUi(); return; }
      }
      if (ev.key === 'Enter' && ev.target && ev.target.id === 'dev-rn-comp-input' && !ev.shiftKey) {
        ev.preventDefault();
        saveCurrentNote();
      }
    });

    if (root.Sheet && root.Sheet.regions) {
      root.Sheet.regions.register('dev.reviewNotes', {
        slices: ['*'],
        render: () => renderPins()
      });
    }

    loadNotes();
    saveNotes();
    syncUi();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _mount);
    } else {
      _mount();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
