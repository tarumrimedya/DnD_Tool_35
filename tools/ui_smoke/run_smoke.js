/**
 * UI smoke suite for the character sheet (index.html) and the campaign Hub (hub.html).
 *
 * Covers: A load, B fixtures x tabs, C escaping probe, D toast, E in-page dialog, F mobile (375px),
 *         G live HP broadcast with a fake Supabase client, H Hub (toast, dialogs, native dialog count).
 * Runs offline: a tiny static server serves the repo root, Chromium runs in local mode
 * (localStorage dnd35_local_mode=true). CDN / external network failures are ignored and counted.
 *
 * Run (from the repo root, needs Docker):  powershell -File tools/ui_smoke/run.ps1
 * Exit code 0 = all PASS (KNOWN_FAIL does not fail the run), 1 = any FAIL.
 *
 * Add a check: write `await check('X. name', async () => { ... return 'short detail'; });` below.
 * Throw (or assert()) to fail. Pass `{ known: 'one-line reason' }` as 3rd arg to record an app bug
 * without failing the run. Use newSheetPage() / loadFixture(page, file) for a fresh sheet.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE_DIR = path.join(ROOT, 'tools', 'fixtures');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2'
};

let BASE = '';
let browser = null;
let ignoredNet = 0;
const results = [];
const openPages = [];

// ---------------------------------------------------------------- server
function startServer() {
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      const file = path.resolve(ROOT, '.' + urlPath);
      if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(404); res.end(); return; }
      const mime = MIME[path.extname(file).toLowerCase()];
      if (!mime || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    } catch (e) { res.writeHead(500); res.end(); }
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    BASE = 'http://127.0.0.1:' + server.address().port;
    resolve(server);
  }));
}

// ---------------------------------------------------------------- helpers
const sleep = ms => new Promise(r => setTimeout(r, ms));
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
const isLocalUrl = u => !u || u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:');

/** Opens a page in the given context with error collection. Returns the page; errors live on page.__errs. */
async function openPage(context, url, { local = true } = {}) {
  const page = await context.newPage();
  page.__errs = { page: [], console: [] };
  page.on('pageerror', e => page.__errs.page.push(String(e && e.message || e)));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const loc = m.location() || {};
    const text = m.text();
    if (/favicon\.ico/.test(loc.url || '') || /favicon\.ico/.test(text)) return;
    if (!isLocalUrl(loc.url)) { ignoredNet++; return; }
    if (/Failed to load resource/.test(text) && !isLocalUrl(loc.url)) { ignoredNet++; return; }
    page.__errs.console.push(text + (loc.url ? ' @ ' + loc.url : ''));
  });
  page.on('requestfailed', req => { if (!isLocalUrl(req.url())) ignoredNet++; });
  openPages.push(page);
  await page.goto(BASE + url, { waitUntil: 'load' });
  return page;
}

async function newContext(opts = {}) {
  const context = await browser.newContext(opts);
  // Block external hosts quickly so a missing network never stalls a page.
  await context.route(u => !isLocalUrl(u.toString()), r => r.abort());
  await context.addInitScript(() => { try { localStorage.setItem('dnd35_local_mode', 'true'); } catch (e) { /* ignore */ } });
  return context;
}

// Wait for the sheet's own boot (char_hud.js DOMContentLoaded: SRD compendium init -> loadInitialData -> renderAll),
// marked by <html data-sheet-boot="ready">. Loading a fixture earlier derives it without race / template
// modifiers (wrong Hit Points) and races the boot's own character load.
async function waitSheetReady(page) {
  await page.waitForFunction(() => document.documentElement.dataset.sheetBoot === 'ready'
    && typeof CharStore !== 'undefined' && typeof renderAll === 'function' && typeof switchTab === 'function', null, { timeout: 30000 });
}

async function newSheetPage(contextOpts) {
  const context = await newContext(contextOpts);
  const page = await openPage(context, '/index.html');
  await waitSheetReady(page);
  page.__context = context;
  return page;
}

async function loadFixture(page, file) {
  await page.evaluate(async f => {
    const data = await (await fetch('tools/fixtures/' + f)).json();
    CharStore.replaceDoc(data);
    window.character = CharStore.getDoc();
    // `character` is a top-level let in the sheet scripts; keep it in step with the store.
    try { character = CharStore.getDoc(); } catch (e) { /* not assignable */ }
    renderAll();
  }, file);
}

async function tabIds(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('[role=tabpanel]')).map(e => e.id));
}

async function visitAllTabs(page) {
  const ids = await tabIds(page);
  for (const id of ids) {
    await page.evaluate(i => switchTab(i), id);
    await page.waitForTimeout(60);
  }
  return ids;
}

async function reportLog(page) {
  return page.evaluate(() => (typeof reportError !== 'undefined' && reportError._log) || []);
}

function errSummary(page) {
  const e = page.__errs;
  return `pageErrors=${e.page.length} consoleErrors=${e.console.length}`;
}
function assertNoErrors(page) {
  const e = page.__errs;
  assert(e.page.length === 0, 'page errors: ' + e.page.slice(0, 3).join(' | '));
  assert(e.console.length === 0, 'console errors: ' + e.console.slice(0, 3).join(' | '));
}

async function check(name, fn, opts = {}) {
  const t0 = Date.now();
  let status = 'PASS';
  let detail = '';
  try {
    detail = (await fn()) || '';
  } catch (e) {
    status = opts.known ? 'KNOWN_FAIL' : 'FAIL';
    detail = opts.known ? `${opts.known} [${String(e && e.message || e).split('\n')[0]}]` : String(e && e.message || e).split('\n')[0];
  }
  results.push({ name, status });
  console.log(`${status}  ${name}  ${String(detail).slice(0, 300)}`);
  return status;
}

async function closeSheet(page) {
  try { await (page.__context || page.context()).close(); } catch (e) { /* ignore */ }
}

const FIXTURES = fs.readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.json')).sort();
const FIXTURE_03 = FIXTURES.find(f => f.startsWith('03_'));

// Dialog helpers (all in-page)
const dlgOpen = page => page.evaluate(() => { const d = document.getElementById('dndui-dialog'); return !!(d && d.open); });
async function waitDlg(page, open = true) {
  await page.waitForFunction(o => { const d = document.getElementById('dndui-dialog'); return !!(d && d.open) === o; }, open, { timeout: 5000 });
}
const btn = (page, label) => page.locator('#dndui-dialog button', { hasText: new RegExp('^' + label + '$') });

// ---------------------------------------------------------------- main
async function main() {
  const server = await startServer();
  browser = await chromium.launch({ args: ['--no-sandbox'] });

  // A. Load
  {
    const page = await newSheetPage();
    await check('A. sheet loads, core helpers exist', async () => {
      await page.waitForTimeout(500);
      assertNoErrors(page);
      const types = await page.evaluate(() => ({
        reportError: typeof reportError, notify: typeof notify, showToast: typeof showToast,
        confirm: typeof (window.DnDUI && DnDUI.confirm), prompt: typeof (window.DnDUI && DnDUI.prompt)
      }));
      for (const [k, v] of Object.entries(types)) assert(v === 'function', `${k} is ${v}`);
      return errSummary(page);
    });
    await closeSheet(page);
  }

  // J. three.js is loaded on demand. The smoke run blocks the CDN, so the first roll exercises the
  // fallback: the script fails, the roll still records its result, and the script is injected once.
  {
    const page = await newSheetPage();
    await check('J. no three.js at boot; 3D roll falls back when the CDN load fails (CDN blocked)', async () => {
      // newSheetPage already waited for sheetBoot === 'ready'; check right at that point, before the idle
      // warm-up (>= 1.5 s after load) can start fetching three.js.
      const boot = await page.evaluate(() => ({
        three: typeof THREE,
        tags: document.querySelectorAll('script[src*="three.min.js"]').length,
        fetched: performance.getEntriesByType('resource').some(r => /three\.min\.js/.test(r.name))
      }));
      assert(boot.three === 'undefined', 'THREE defined at boot');
      assert(boot.tags === 0 && !boot.fetched, 'three.min.js requested at boot');
      const before = await page.evaluate(() => (window.diceRollHistory || []).length);
      await page.evaluate(() => rollSingleDie(20));
      await page.waitForFunction(n => (window.diceRollHistory || []).length === n + 1, before, { timeout: 10000 });
      await page.evaluate(() => rollSingleDie(6));
      await page.waitForFunction(n => (window.diceRollHistory || []).length === n + 2, before, { timeout: 10000 });
      const after = await page.evaluate(() => ({
        tags: document.querySelectorAll('script[src*="three.min.js"]').length,
        titles: window.diceRollHistory.slice(0, 2).map(e => e.title).join(' / ')
      }));
      assert(after.tags === 1, 'three.min.js injected ' + after.tags + ' times');
      // The background warm-up shares the same load; when it fails it must resolve quietly.
      await page.evaluate(() => window.Dice3D.warmUp());
      const wlog = await reportLog(page);
      assert(wlog.length === 0, 'reportError after warm-up: ' + JSON.stringify(wlog.map(l => l.context + ': ' + l.message)).slice(0, 300));
      assertNoErrors(page);
      return `${after.titles}; ${errSummary(page)}`;
    });
    await closeSheet(page);
  }

  // B. Fixtures x tabs
  for (const f of FIXTURES) {
    await check('B. fixture ' + f + ' x all tabs', async () => {
      const page = await newSheetPage();
      try {
        await loadFixture(page, f);
        const ids = await visitAllTabs(page);
        await page.waitForTimeout(200);
        const log = await reportLog(page);
        assertNoErrors(page);
        assert(log.length === 0, 'reportError._log: ' + JSON.stringify(log.map(l => l.context + ': ' + l.message)).slice(0, 400));
        return `${ids.length} tabs, ${errSummary(page)}`;
      } finally { await closeSheet(page); }
    });
  }

  // C. Escaping probe: payload in every display string of the document, then tabs and detail views.
  // Fixture 03 has no spells and no inventory, so C2 repeats the probe on the wizard fixture (04).
  async function runEscapingProbe(file) {
    const page = await newSheetPage();
    try {
      await loadFixture(page, file);
      // Canary: prove the detector sees a raw probe element before trusting a zero.
      const canary = await page.evaluate(() => {
        const host = document.querySelector('[role=tabpanel]');
        const el = document.createElement('div');
        el.innerHTML = '<i class="xss-probe">x</i>';
        host.appendChild(el);
        const n = document.querySelectorAll('.xss-probe').length;
        el.remove();
        return n;
      });
      assert(canary === 1, 'canary: detector counted ' + canary + ' (expected 1)');

      const seeded = await page.evaluate(() => {
        const P = 'PROBE<i class="xss-probe">x</i>"\'&';
        const KEYS = new Set(['name', 'label', 'title', 'desc', 'description', 'source', 'notes', 'text']);
        const skip = k => k === 'id' || k === 'baseItemId' || k === '_hubId' || /Id$/.test(k);
        const c = CharStore.getDoc();
        let n = 0;
        const walk = o => {
          if (Array.isArray(o)) {
            o.forEach((v, i) => { if (typeof v === 'string') { o[i] = P; n++; } else if (v && typeof v === 'object') walk(v); });
          } else if (o && typeof o === 'object') {
            for (const k of Object.keys(o)) {
              const v = o[k];
              if (typeof v === 'string') { if (KEYS.has(k) && !skip(k)) { o[k] = P; n++; } }
              else if (v && typeof v === 'object') {
                // Arrays of plain strings are display lists only under these keys (feats may be strings).
                if (Array.isArray(v) && !['feats', 'specialAbilities', 'spells', 'knownSpells', 'spellbook'].includes(k)) {
                  v.forEach(x => { if (x && typeof x === 'object') walk(x); });
                } else walk(v);
              }
            }
          }
        };
        walk(c);
        // Seed an inventory weapon so the Inventory-only weapon picker (onSrdSpotlightInput) has a row to render.
        if (!Array.isArray(c.inventory)) c.inventory = [];
        c.inventory.push({ id: 'probe-wpn', name: P, type: 'Weapon', category: 'Weapon', dice: '1d8' });
        n++;
        window.character = c;
        try { character = c; } catch (e) { /* ignore */ }
        renderAll();
        return n;
      });

      await visitAllTabs(page);
      await page.waitForTimeout(200);
      const count = () => page.evaluate(() => document.querySelectorAll('.xss-probe').length);
      const tabProbes = await count();

      // Detail views and modals reachable with one call each.
      const views = await page.evaluate(() => {
        const out = [];
        let last = document.querySelectorAll('.xss-probe').length;
        const run = (label, fn) => {
          let err = null;
          try { fn(); } catch (e) { err = String(e && e.message || e); }
          const now = document.querySelectorAll('.xss-probe').length;
          out.push({ label, err, added: now - last });
          last = now;
        };
        const c = CharStore.getDoc();
        const nm = x => (typeof x === 'string' ? x : x && x.name);
        run('onSrdSpotlightInput', () => onSrdSpotlightInput(''));
        (c.feats || []).slice(0, 3).forEach((f, i) => run('showFeatDetail feat#' + i, () => showFeatDetail(nm(f))));
        (c.specialAbilities || []).slice(0, 3).forEach((a, i) => run('showFeatDetail ability#' + i, () => showFeatDetail(nm(a), null, 'ability')));
        Object.keys(c.bodySlots || {}).forEach(k => run('openSlotEquipModal ' + k, () => openSlotEquipModal(k)));
        [['openWeaponProfileModal', () => openWeaponProfileModal()],
         ['openSpellManeuverPickerModal', () => openSpellManeuverPickerModal('Spell')],
         ['openAddPoolItemModal', () => openAddPoolItemModal()],
         ['openFeatPickerModal', () => openFeatPickerModal()],
         ['openAddBuffModal', () => openAddBuffModal()]
        ].forEach(([l, f]) => run(l, f));
        return out;
      });
      await page.waitForTimeout(200);

      const r = await page.evaluate(() => {
        const text = document.body.innerText;
        const bad = [];
        document.querySelectorAll('*').forEach(el => {
          for (const a of el.attributes) {
            if (/^on/i.test(a.name)) {
              try { new Function(a.value); } catch (e) { if (e instanceof SyntaxError) bad.push(`${el.tagName}.${a.name}: ${a.value.slice(0, 80)}`); }
            }
          }
        });
        return { probes: document.querySelectorAll('.xss-probe').length, dbl: /&amp;lt;|&lt;i/.test(text), bad };
      });
      const leaking = views.filter(v => v.added > 0).map(v => v.label);
      const viewErrs = views.filter(v => v.err).map(v => v.label + ': ' + v.err);
      assert(tabProbes === 0, `${tabProbes} .xss-probe elements after tab render (unescaped HTML)`);
      assert(leaking.length === 0, 'unescaped HTML in views: ' + leaking.join(', '));
      assert(r.probes === 0, `${r.probes} .xss-probe elements (unescaped HTML)`);
      assert(!r.dbl, 'double-escaped text found');
      assert(r.bad.length === 0, `${r.bad.length} inline handlers fail to compile, e.g. ${r.bad.slice(0, 2).join(' || ')}`);
      assertNoErrors(page);
      return `canary=1, ${seeded} strings probed, ${views.length} views (${viewErrs.length} threw${viewErrs.length ? ': ' + viewErrs.slice(0, 3).join(' | ') : ''}), ${errSummary(page)}`;
    } finally { await closeSheet(page); }
  }
  await check('C1. escaping probe (fixture 03)', () => runEscapingProbe(FIXTURE_03));
  await check('C2. escaping probe (fixture 04, caster)', () => runEscapingProbe(FIXTURES.find(f => f.startsWith('04_'))));

  // D. Toast
  {
    const page = await newSheetPage();
    await check('D1. showToast escapes HTML, role=status', async () => {
      await page.evaluate(() => showToast('<i class="xss-probe">x</i>', 'error', { wrap: true }));
      await page.waitForTimeout(100);
      const r = await page.evaluate(() => ({
        probes: document.querySelectorAll('.xss-probe').length,
        items: document.querySelectorAll('.dice-toast-item').length,
        role: (document.getElementById('dice-top-toast-container') || {}).getAttribute && document.getElementById('dice-top-toast-container').getAttribute('role')
      }));
      assert(r.probes === 0, 'unescaped toast HTML');
      assert(r.items >= 1, 'no .dice-toast-item');
      assert(r.role === 'status', 'container role=' + r.role);
      return 'ok';
    });
    await check('D2. notify drops duplicate status icon', async () => {
      const text = await page.evaluate(async () => {
        document.querySelectorAll('.dice-toast-item').forEach(e => e.remove());
        notify('⚠️ Saved', 'success');
        await new Promise(r => setTimeout(r, 100));
        return document.querySelector('.dice-toast-item').innerText;
      });
      const count = (text.match(/⚠/g) || []).length;
      assert(count === 0 || !text.trim().startsWith('⚠'), 'toast starts with warning icon: ' + JSON.stringify(text));
      assert(count <= 1, 'warning icon appears ' + count + ' times: ' + JSON.stringify(text));
      return JSON.stringify(text.replace(/\s+/g, ' ').slice(0, 60));
    });
    await closeSheet(page);
  }

  // E. Dialog
  {
    const page = await newSheetPage();
    const open = (src) => page.evaluate(s => { window.__r = undefined; (0, eval)(s).then(v => { window.__r = { v }; }); }, src);
    const result = async () => { await page.waitForFunction(() => window.__r !== undefined, null, { timeout: 5000 }); return page.evaluate(() => window.__r.v); };

    await check('E1. default confirm: focus Confirm, click -> true, closes', async () => {
      await open("DnDUI.confirm('Proceed?')");
      await waitDlg(page);
      const f = await page.evaluate(() => document.activeElement.textContent.trim());
      assert(f === 'Confirm', 'focus on ' + f);
      await btn(page, 'Confirm').click();
      assert((await result()) === true, 'did not resolve true');
      await waitDlg(page, false);
      return 'ok';
    });

    await check('E2. danger confirm: focus Cancel, rose border, Cancel -> false', async () => {
      await open("DnDUI.confirm('Delete?', { tone: 'danger' })");
      await waitDlg(page);
      const r = await page.evaluate(() => ({
        f: document.activeElement.textContent.trim(),
        rose: /border-rose/.test(document.querySelector('#dndui-dialog > div').className)
      }));
      assert(r.f === 'Cancel', 'focus on ' + r.f);
      assert(r.rose, 'no rose border class on card');
      await btn(page, 'Cancel').click();
      assert((await result()) === false, 'did not resolve false');
      return 'ok';
    });

    await check('E3. Escape cancels, document keydown not fired', async () => {
      await page.evaluate(() => { window.__esc = 0; document.addEventListener('keydown', e => { if (e.key === 'Escape') window.__esc++; }); });
      await open("DnDUI.confirm('Esc?')");
      await waitDlg(page);
      await page.keyboard.press('Escape');
      assert((await result()) === false, 'did not resolve false');
      await waitDlg(page, false);
      const n = await page.evaluate(() => window.__esc);
      assert(n === 0, 'document keydown listener fired ' + n + 'x');
      return 'ok';
    });

    await check('E4. backdrop click ignored <300ms, cancels after 350ms', async () => {
      await open("DnDUI.confirm('Backdrop?')");
      await page.mouse.click(4, 4);
      assert(await dlgOpen(page), 'early backdrop click closed the dialog');
      assert((await page.evaluate(() => window.__r)) === undefined, 'early click resolved');
      await page.waitForTimeout(350);
      await page.mouse.click(4, 4);
      assert((await result()) === false, 'late backdrop click did not cancel');
      return 'ok';
    });

    await check('E5. queued confirms show one at a time', async () => {
      await page.evaluate(() => {
        window.__q = [];
        DnDUI.confirm('First?').then(v => window.__q.push(['first', v]));
        DnDUI.confirm('Second?').then(v => window.__q.push(['second', v]));
      });
      await waitDlg(page);
      let r = await page.evaluate(() => ({ n: document.querySelectorAll('#dndui-dialog').length, m: document.getElementById('dndui-dialog-msg').textContent }));
      assert(r.n === 1 && r.m === 'First?', `first stage: n=${r.n} msg=${r.m}`);
      await btn(page, 'Confirm').click();
      await page.waitForFunction(() => { const m = document.getElementById('dndui-dialog-msg'); return m && m.textContent === 'Second?'; }, null, { timeout: 5000 });
      r = await page.evaluate(() => ({ n: document.querySelectorAll('#dndui-dialog').length, q: window.__q }));
      assert(r.n === 1, 'more than one #dndui-dialog');
      await btn(page, 'Cancel').click();
      await page.waitForFunction(() => window.__q.length === 2, null, { timeout: 5000 });
      const q = await page.evaluate(() => window.__q);
      assert(JSON.stringify(q) === JSON.stringify([['first', true], ['second', false]]), 'results ' + JSON.stringify(q));
      return 'ok';
    });

    await check('E6. prompt: validate inline, Enter submits, Cancel -> null, 16px/44px input', async () => {
      await open("DnDUI.prompt('Name?', '', { validate: v => v === 'ok' ? '' : 'Bad value' })");
      await waitDlg(page);
      const m = await page.evaluate(() => { const i = document.querySelector('#dndui-dialog input'); const cs = getComputedStyle(i); return { fs: cs.fontSize, h: i.getBoundingClientRect().height }; });
      assert(m.fs === '16px', 'font-size ' + m.fs);
      assert(m.h >= 44, 'height ' + m.h);
      await page.fill('#dndui-dialog input', 'x');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
      const err = await page.evaluate(() => (document.querySelector('#dndui-dialog [role=alert]') || {}).textContent);
      assert(err === 'Bad value', 'inline error: ' + err);
      assert(await dlgOpen(page), 'closed despite validation error');
      await page.fill('#dndui-dialog input', 'ok');
      await page.keyboard.press('Enter');
      assert((await result()) === 'ok', 'Enter did not submit value');
      await open("DnDUI.prompt('Name?', 'abc')");
      await waitDlg(page);
      await btn(page, 'Cancel').click();
      assert((await result()) === null, 'Cancel did not resolve null');
      return 'ok';
    });

    await check('E7. real path: clearDiceHistory opens dialog, Cancel keeps history', async () => {
      await loadFixture(page, FIXTURE_03);
      await page.evaluate(() => {
        window.diceRollHistory = [{ title: 'Probe', formula: '1d20', breakdown: '[10]', total: 10, timestamp: '00:00', id: 'p1' }];
        window.__r = undefined;
        clearDiceHistory();
      });
      await waitDlg(page);
      await btn(page, 'Cancel').click();
      await waitDlg(page, false);
      const n = await page.evaluate(() => window.diceRollHistory.length);
      assert(n === 1, 'history length ' + n);
      return 'ok';
    });
    await closeSheet(page);
  }

  // F. Mobile
  {
    const page = await newSheetPage({ viewport: { width: 375, height: 812 } });
    await loadFixture(page, FIXTURE_03);
    await check('F1. mobile 375px: no horizontal scroll on any tab', async () => {
      const ids = await tabIds(page);
      const bad = [];
      for (const id of ids) {
        await page.evaluate(i => switchTab(i), id);
        await page.waitForTimeout(120);
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
        if (m.sw > m.iw + 1) bad.push(`${id}:${m.sw}>${m.iw}`);
      }
      assert(bad.length === 0, 'overflow on ' + bad.join(', '));
      return ids.length + ' tabs';
    });
    await check('F2. mobile 375px: danger confirm card fits viewport', async () => {
      await page.evaluate(() => { DnDUI.confirm('A fairly long confirmation message for a narrow phone screen to wrap properly?', { tone: 'danger' }); });
      await waitDlg(page);
      const r = await page.evaluate(() => { const b = document.querySelector('#dndui-dialog > div').getBoundingClientRect(); return { l: b.left, r: b.right, iw: window.innerWidth }; });
      assert(r.l >= 0 && r.r <= r.iw, `card ${Math.round(r.l)}..${Math.round(r.r)} vs ${r.iw}`);
      await btn(page, 'Cancel').click();
      return `${Math.round(r.l)}..${Math.round(r.r)} of ${r.iw}`;
    });
    await closeSheet(page);
  }

  // G. Live HP with fake Supabase
  await check('G. live HP: join, send once, hub event applied, stale/own ignored', async () => {
    const page = await newSheetPage();
    try {
      await loadFixture(page, FIXTURE_03);
      await page.evaluate(() => {
        window.__joined = []; window.__handlers = {}; window.__sent = [];
        const fake = {
          channel(topic, opts) {
            window.__joined.push({ topic, opts });
            const ch = {
              on(type, filter, handler) { window.__handlers[topic] = handler; return ch; },
              subscribe(cb) { setTimeout(() => cb('SUBSCRIBED'), 10); return ch; },
              send(m) { window.__sent.push({ topic, payload: m.payload }); return Promise.resolve('ok'); }
            };
            return ch;
          },
          realtime: { setAuth: async () => {} },
          removeChannel() {}
        };
        SupabaseAuth.isLocalMode = () => false;
        SupabaseAuth.getUser = async () => ({ id: 'u1' });
        SupabaseAuth.upsertUserCharacter = async () => null;
        SupabaseAuth.getClient = () => fake;
      });
      // Settle: HP is re-derived shortly after a fixture load (max 104 -> 92 for fixture 03), then a quiet save
      // (no player broadcast) records the settled HP as the baseline.
      await page.waitForTimeout(1500);
      await page.evaluate(() => saveStateToStorage(false));
      await page.evaluate(() => initHpLiveSync());
      await page.waitForTimeout(100);
      const j = await page.evaluate(() => window.__joined.map(x => ({ topic: x.topic, priv: x.opts && x.opts.config && x.opts.config.private })));
      assert(j.length === 1 && j[0].topic === 'hp:user:u1' && j[0].priv === true, 'join ' + JSON.stringify(j));

      await page.evaluate(() => { character.hp.current -= 5; saveStateToStorage(true); });
      await page.waitForTimeout(150);
      let sent = await page.evaluate(() => window.__sent);
      assert(sent.length === 1, 'sent ' + sent.length + ' after HP change');
      assert(sent[0].payload.source === 'sheet' && sent[0].payload.delta === -5, 'payload ' + JSON.stringify(sent[0].payload));

      await page.evaluate(() => saveStateToStorage(true));
      await page.waitForTimeout(150);
      sent = await page.evaluate(() => window.__sent);
      assert(sent.length === 1, 'save without HP change sent ' + (sent.length - 1) + ' extra: ' + JSON.stringify(sent.slice(1).map(s => s.payload)));

      // newer hub event
      await page.evaluate(() => { document.querySelectorAll('.dice-toast-item').forEach(e => e.remove()); });
      const hubTs = await page.evaluate(() => {
        const ts = Date.now() + 5000;
        window.__id = character._hubId || character.id;
        window.__handlers['hp:user:u1']({ payload: { source: 'hub', charId: window.__id, charName: character.name, currentHp: 7, tempHp: 3, maxHp: character.hp.max, delta: -4, ts, senderId: 'other_tab' } });
        return ts;
      });
      await page.waitForTimeout(300);
      let st = await page.evaluate(() => ({ cur: character.hp.current, tmp: character.hp.temp, toasts: document.querySelectorAll('.dice-toast-item').length, sent: window.__sent.length }));
      assert(st.cur === 7 && st.tmp === 3, `hub event not applied: cur=${st.cur} temp=${st.tmp}`);
      assert(st.toasts >= 1, 'no toast after hub event');
      assert(st.sent === 1, 'hub event was re-sent (' + st.sent + ' sends)');

      // older event ignored
      await page.evaluate(() => window.__handlers['hp:user:u1']({ payload: { source: 'hub', charId: window.__id, currentHp: 1, tempHp: 0, maxHp: 50, delta: -6, ts: 1000, senderId: 'other_tab' } }));
      // own sender echo ignored (newer ts so only the senderId filter can stop it)
      await page.evaluate(ts => window.__handlers['hp:user:u1']({ payload: { source: 'hub', charId: window.__id, currentHp: 2, tempHp: 0, maxHp: 50, delta: -5, ts: ts + 1000, senderId: SupabaseAuth.getHpLiveSenderId() } }), hubTs);
      await page.waitForTimeout(200);
      st = await page.evaluate(() => ({ cur: character.hp.current, tmp: character.hp.temp, sent: window.__sent.length }));
      assert(st.cur === 7 && st.tmp === 3, `stale/own event applied: cur=${st.cur} temp=${st.tmp}`);
      assert(st.sent === 1, 'extra sends: ' + st.sent);
      return 'join ok, 1 send, hub applied, stale+own ignored';
    } finally { await closeSheet(page); }
  });

  // I. HP settles after a fixture load (records hp.max / current right after load and 1.5 s later)
  {
    const readings = [];
    for (const f of FIXTURES) {
      const own = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, f), 'utf8')).hp || {};
      const page = await newSheetPage();
      try {
        const first = await page.evaluate(async fx => {
          const data = await (await fetch('tools/fixtures/' + fx)).json();
          CharStore.replaceDoc(data);
          window.character = CharStore.getDoc();
          try { character = CharStore.getDoc(); } catch (e) { /* ignore */ }
          renderAll();
          return { max: character.hp.max, cur: character.hp.current };
        }, f);
        await page.waitForTimeout(1500);
        const last = await page.evaluate(() => ({ max: character.hp.max, cur: character.hp.current }));
        readings.push({ f: f.slice(0, 2), own, first, last });
      } finally { await closeSheet(page); }
    }
    const fmt = r => `${r.f}: own ${r.own.max}/${r.own.current}, first ${r.first.max}/${r.first.cur}, after 1.5s ${r.last.max}/${r.last.cur}`;
    const transient = readings.some(r => r.first.max !== r.own.max || r.first.cur !== r.own.current);
    await check('I. fixture HP settles (max/current)', async () => {
      const detail = readings.map(fmt).join(' ; ');
      const unsettled = readings.filter(r => r.last.max !== r.own.max || r.last.cur !== r.own.current);
      assert(unsettled.length === 0, 'final HP differs from fixture: ' + unsettled.map(fmt).join(' ; '));
      assert(!transient, 'transient derived HP after load: ' + detail);
      return detail;
    });
  }

  // H. Hub
  {
    const context = await newContext();
    let page = null;
    let nativeDialogs = 0;
    await check('H1. hub loads; notify -> escaped in-page toast (role=status), no native dialog', async () => {
      page = await openPage(context, '/hub.html');
      page.on('dialog', d => { nativeDialogs++; d.dismiss().catch(() => {}); });
      await page.waitForTimeout(800);
      assertNoErrors(page);
      const t = await page.evaluate(() => typeof showToast);
      assert(t === 'function', 'typeof showToast = ' + t);
      await page.evaluate(() => { setTimeout(() => notify('<i class="xss-probe">x</i>', 'error'), 0); });
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => {
        const c = document.getElementById('dice-top-toast-container');
        const item = c && c.querySelector('.dice-toast-item');
        return {
          probes: document.querySelectorAll('.xss-probe').length,
          role: c && c.getAttribute('role'),
          text: item ? item.innerText : ''
        };
      });
      assert(nativeDialogs === 0, 'native dialog fired ' + nativeDialogs + 'x');
      assert(r.probes === 0, `${r.probes} .xss-probe elements (unescaped toast HTML)`);
      assert(r.role === 'status', 'container role=' + r.role);
      assert(/<i class="xss-probe">x<\/i>/.test(r.text), 'toast text ' + JSON.stringify(r.text));
      return errSummary(page);
    });
    await check('H2. hub DnDUI.confirm opens #dndui-dialog', async () => {
      assert(page, 'hub page missing');
      await page.evaluate(() => { window.__r = undefined; DnDUI.confirm('Hub?').then(v => { window.__r = { v }; }); });
      await waitDlg(page);
      await btn(page, 'Confirm').click();
      await page.waitForFunction(() => window.__r !== undefined, null, { timeout: 5000 });
      assert((await page.evaluate(() => window.__r.v)) === true, 'did not resolve true');
      return 'ok';
    });
    await check('H4. hub Delete Character: danger dialog, Cancel keeps the character, Delete removes it', async () => {
      assert(page, 'hub page missing');
      await page.evaluate(() => {
        state.characters.push({ id: 'smoke_del_c', name: 'Smoke Hero', race: 'Human', classes: 'Fighter 1', level: 1, campaignId: null });
        window.__d = deleteCharacter('smoke_del_c');
      });
      await waitDlg(page);
      const look = await page.evaluate(() => ({
        rose: /border-rose/.test(document.querySelector('#dndui-dialog > div').className),
        title: document.getElementById('dndui-dialog-title').textContent
      }));
      assert(look.rose, 'delete dialog is not the danger tone');
      await btn(page, 'Cancel').click();
      await page.evaluate(() => window.__d);
      assert(await page.evaluate(() => state.characters.some(c => c.id === 'smoke_del_c')), 'Cancel deleted the character');
      await page.evaluate(() => { window.__d = deleteCharacter('smoke_del_c'); });
      await waitDlg(page);
      await btn(page, 'Delete').click();
      await page.evaluate(() => window.__d);
      assert(!(await page.evaluate(() => state.characters.some(c => c.id === 'smoke_del_c'))), 'Delete kept the character');
      assert(nativeDialogs === 0, 'native dialog fired ' + nativeDialogs + 'x');
      assertNoErrors(page);
      return 'title=' + look.title;
    });
    await context.close();
  }

  // H3. Static guard: no native alert / confirm / prompt left in the Hub files.
  await check('H3. hub.html, hub_dice.js, hub_notes.js: no native alert/confirm/prompt', async () => {
    const out = [];
    for (const f of ['hub.html', 'hub_dice.js', 'hub_notes.js']) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const hits = src.match(/(?:\bwindow\.|(?<![\w.$]))(?:alert|confirm|prompt)\s*\(/g) || [];
      assert(hits.length === 0, `${f}: expected 0 native dialog calls, found ${hits.length}`);
      out.push(`${f}=0`);
    }
    return out.join(' ');
  });

  // H5. Hub at 375 px: a long toast and a danger confirm card fit inside the viewport width.
  {
    const context = await newContext({ viewport: { width: 375, height: 812 } });
    await check('H5. hub mobile 375px: toast and confirm card fit viewport', async () => {
      const page = await openPage(context, '/hub.html');
      await page.waitForTimeout(800);
      await page.evaluate(() => notify('A fairly long Hub notification for a narrow phone screen that has to wrap across several lines without overflowing.', 'warning'));
      await page.waitForTimeout(400);
      const t = await page.evaluate(() => { const b = document.querySelector('#dice-top-toast-container .dice-toast-item').getBoundingClientRect(); return { l: b.left, r: b.right, iw: window.innerWidth }; });
      assert(t.l >= 0 && t.r <= t.iw, `toast ${Math.round(t.l)}..${Math.round(t.r)} vs ${t.iw}`);
      await page.evaluate(() => { DnDUI.confirm('Are you sure you want to delete campaign "Smoke"?\n\nThis will permanently delete the campaign.', { title: 'Delete Campaign', tone: 'danger' }); });
      await waitDlg(page);
      const c = await page.evaluate(() => { const b = document.querySelector('#dndui-dialog > div').getBoundingClientRect(); return { l: b.left, r: b.right, iw: window.innerWidth }; });
      assert(c.l >= 0 && c.r <= c.iw, `card ${Math.round(c.l)}..${Math.round(c.r)} vs ${c.iw}`);
      await btn(page, 'Cancel').click();
      return `toast ${Math.round(t.l)}..${Math.round(t.r)}, card ${Math.round(c.l)}..${Math.round(c.r)} of ${t.iw}`;
    });
    await context.close();
  }

  // H6. Hub dice tray: "Clear" history opens the in-page danger dialog; Cancel keeps the history.
  {
    const context = await newContext();
    let nativeDialogs = 0;
    await check('H6. real path: hub clearDiceHistory opens dialog, Cancel keeps history', async () => {
      const page = await openPage(context, '/hub.html');
      page.on('dialog', d => { nativeDialogs++; d.dismiss().catch(() => {}); });
      await page.waitForTimeout(800);
      await page.evaluate(() => {
        window.diceRollHistory = [{ title: 'Probe', formula: '1d20', breakdown: '[10]', total: 10, timestamp: '00:00', id: 'p1' }];
        clearDiceHistory();
      });
      await waitDlg(page);
      await btn(page, 'Cancel').click();
      await waitDlg(page, false);
      const n = await page.evaluate(() => window.diceRollHistory.length);
      assert(n === 1, 'history length ' + n);
      assert(nativeDialogs === 0, 'native dialog fired ' + nativeDialogs + 'x');
      return 'ok';
    });
    await context.close();
  }

  await browser.close();
  server.close();

  const pass = results.filter(r => r.status === 'PASS').length;
  const known = results.filter(r => r.status === 'KNOWN_FAIL').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  console.log(`(ignored external network failures: ${ignoredNet})`);
  console.log(`UI SMOKE: ${pass}/${results.length} passed, ${known} known failures`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('UI SMOKE crashed:', e); process.exit(1); });
