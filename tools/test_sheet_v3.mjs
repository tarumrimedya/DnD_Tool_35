// Sheet V3 unit tests (zero dependencies, no build). Run: node tools/test_sheet_v3.mjs
import assert from 'node:assert/strict';
import { resolveCharacter } from '../sheet/core/persistence.js';
import { createStore, createInitialState } from '../sheet/core/store.js';
import { html, escapeHtml } from '../sheet/ui/html.js';

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error(`FAIL ${name}\n  ${e.message}`);
  }
}

const iso = ms => new Date(ms).toISOString();

// ---------------------------------------------------------------- persistence
test('resolve: local snapshot when no id requested', () => {
  const saved = { id: 'c1', name: 'Aria' };
  const r = resolveCharacter({ hubDb: null, saved, requestedId: null });
  assert.equal(r.source, 'local');
  assert.equal(r.character.name, 'Aria');
  assert.notEqual(r.character, saved, 'must return a clone');
});

test('resolve: hub fullData wins when newer than local', () => {
  const hubDb = { characters: [{ id: 'c1', name: 'Aria', fullData: { id: 'c1', name: 'Aria', lastModified: iso(2000), str: 18 } }] };
  const saved = { id: 'c1', name: 'Aria', lastModified: iso(1000), str: 10 };
  const r = resolveCharacter({ hubDb, saved, requestedId: 'c1' });
  assert.equal(r.source, 'hub');
  assert.equal(r.character.str, 18);
  assert.equal(r.character._hubId, 'c1');
});

test('resolve: newer local snapshot wins over hub fullData', () => {
  const hubDb = { characters: [{ id: 'c1', name: 'Aria', fullData: { id: 'c1', lastModified: iso(1000), str: 10 } }] };
  const saved = { id: 'c1', name: 'Aria', lastModified: iso(2000), str: 18 };
  const r = resolveCharacter({ hubDb, saved, requestedId: 'c1' });
  assert.equal(r.source, 'hub+newer-local');
  assert.equal(r.character.str, 18);
});

test('resolve: local snapshot of a different character is ignored', () => {
  const hubDb = { characters: [{ id: 'c1', name: 'Aria', fullData: { id: 'c1', lastModified: iso(1000) } }] };
  const saved = { id: 'c2', name: 'Other', lastModified: iso(9000) };
  const r = resolveCharacter({ hubDb, saved, requestedId: 'c1' });
  assert.equal(r.source, 'hub');
  assert.equal(r.character.name, 'Aria');
});

test('resolve: real Hub roster name overrides sheet name', () => {
  const hubDb = { characters: [{ id: 'c1', name: 'Roster Name', fullData: { id: 'c1', name: 'Sheet Name' } }] };
  const r = resolveCharacter({ hubDb, saved: null, requestedId: 'c1' });
  assert.equal(r.character.name, 'Roster Name');
});

test('resolve: default Hub name never overrides sheet name', () => {
  const hubDb = { characters: [{ id: 'c1', name: 'New Character', fullData: { id: 'c1', name: 'Aria' } }] };
  const r = resolveCharacter({ hubDb, saved: null, requestedId: 'c1' });
  assert.equal(r.character.name, 'Aria');
});

test('resolve: DM HP wins when hub timestamp >= player timestamp (ADR-005)', () => {
  const hubDb = { characters: [{ id: 'c1', currentHp: 7, maxHp: 30, lastHpUpdateTs: 500,
    fullData: { id: 'c1', hp: { current: 30, max: 30, _lastPlayerChangeTs: 400 } } }] };
  const r = resolveCharacter({ hubDb, saved: null, requestedId: 'c1' });
  assert.equal(r.character.hp.current, 7);
});

test('resolve: player HP wins when player changed it later', () => {
  const hubDb = { characters: [{ id: 'c1', currentHp: 7, maxHp: 30, lastHpUpdateTs: 300,
    fullData: { id: 'c1', hp: { current: 25, max: 30, _lastPlayerChangeTs: 400 } } }] };
  const r = resolveCharacter({ hubDb, saved: null, requestedId: 'c1' });
  assert.equal(r.character.hp.current, 25);
});

test('resolve: never mutates its inputs', () => {
  const fullData = { id: 'c1', name: 'Sheet', hp: { current: 30, max: 30 } };
  const hubDb = { characters: [{ id: 'c1', name: 'Roster', currentHp: 5, fullData }] };
  const before = JSON.stringify(hubDb);
  resolveCharacter({ hubDb, saved: null, requestedId: 'c1' });
  assert.equal(JSON.stringify(hubDb), before);
});

test('resolve: hub stub without fullData returns no character', () => {
  const hubDb = { characters: [{ id: 'c1', name: 'Stub' }] };
  const r = resolveCharacter({ hubDb, saved: null, requestedId: 'c1' });
  assert.equal(r.source, 'hub-stub');
  assert.equal(r.character, null);
});

test('resolve: legacy progression field fills empty levelProgression', () => {
  const hubDb = { characters: [{ id: 'c1', fullData: { id: 'c1', levelProgression: [], progression: [{ cls: 'Fighter' }] } }] };
  const r = resolveCharacter({ hubDb, saved: null, requestedId: 'c1' });
  assert.deepEqual(r.character.levelProgression, [{ cls: 'Fighter' }]);
});

// ---------------------------------------------------------------- store
test('store: select fires immediately and only on slice change', () => {
  const store = createStore(createInitialState());
  const seen = [];
  store.select(s => s.ui.activeTab, v => seen.push(v));
  store.setState(s => ({ ...s, status: 'ready' }));
  store.setState(s => ({ ...s, ui: { ...s.ui, activeTab: 'combat' } }));
  assert.deepEqual(seen, ['character', 'combat']);
});

test('store: returning the same state is a no-op', () => {
  const store = createStore(createInitialState());
  let calls = 0;
  store.select(s => s, () => calls++);
  store.setState(s => s);
  assert.equal(calls, 1);
});

test('store: Phase A starts read-only', () => {
  assert.equal(createInitialState().readOnly, true);
});

// ---------------------------------------------------------------- html
test('html: interpolations are escaped', () => {
  const id = `x'); alert(1); ('"<b>`;
  const out = html`<button data-id="${id}">${id}</button>`.value;
  assert.ok(!out.includes('<b>'));
  assert.ok(!out.includes(`"<`));
  assert.ok(out.includes('&#39;') && out.includes('&quot;'));
});

test('html: nested templates and arrays are not double-escaped', () => {
  const items = ['a&b', 'c'];
  const out = html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`.value;
  assert.equal(out, '<ul><li>a&amp;b</li><li>c</li></ul>');
});

test('html: null, undefined and false render as empty', () => {
  assert.equal(html`[${null}${undefined}${false}]`.value, '[]');
  assert.equal(html`${0}`.value, '0');
});

test('escapeHtml: covers all attribute-breaking characters', () => {
  assert.equal(escapeHtml(`&<>"'\``), '&amp;&lt;&gt;&quot;&#39;&#96;');
});

console.log(`${failed ? '❌' : '✅'} SHEET V3: ${passed}/${passed + failed} tests passed.`);
if (failed > 0) process.exit(1);
