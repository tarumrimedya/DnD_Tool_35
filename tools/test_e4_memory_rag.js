#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

function runE4MemoryRagTests() {
  let passed = 0;
  function test(name, fn) {
    fn();
    passed++;
  }

  // 1. Test DnD35Ruleset.assistant adapter directly against REAL RuleEngine.deriveSheet output
  const DnD35Ruleset = require(path.join(ROOT, 'rulesets', 'dnd35.js'));
  const RuleEngine = require(path.join(ROOT, 'rule_engine.js'));

  test('DnD35Ruleset.assistant exposes ruleset-agnostic adapter contract', () => {
    const a = DnD35Ruleset.assistant;
    assert(a && typeof a === 'object', 'assistant adapter missing');
    assert.strictEqual(a.shortTag, '3.5e');
    assert(a.stackingSummary().includes('Same-type bonuses do NOT stack'));
    assert(a.actionEconomySummary().includes('Standard'));
    assert(Array.isArray(a.editionGuard) && a.editionGuard.length >= 3);
    assert(Array.isArray(a.commandCapabilities) && a.commandCapabilities.includes('remember_pref'));
  });

  test('buildTacticalSnapshot reads real char.bodySlots, char.spellcasting, char.consumables & derived.abilities', () => {
    const char = {
      id: 'char-test-wiz',
      name: 'Valen',
      level: 5,
      classes: 'Wizard 5',
      abilities: { str: 8, dex: 14, con: 12, int: 18, wis: 10, cha: 10 },
      feats: [{ name: 'Spell Focus' }],
      bodySlots: {
        shoulders: { name: 'Cloak of Resistance +2', active: true },
        ring1: { name: 'Ring of Protection +1', active: true },
        head: { name: 'None', active: false }
      },
      spellcasting: {
        preparedSpells: [
          { name: 'Grease', preparedCount: 1, usedCount: 0 },
          { name: 'Magic Missile', preparedCount: 1, usedCount: 1 }
        ],
        knownSpells: [{ name: 'Shield' }]
      },
      consumables: [
        { name: 'Potion of Cure Light Wounds', qty: 2 }
      ],
      buffs: [
        {
          id: 'b1',
          name: 'Cloak of Resistance +2',
          active: true,
          schemaVersion: 3,
          effects: [{ type: 'stat', target: 'save.all', bonusType: 'Resistance', value: 2 }]
        },
        {
          id: 'b2',
          name: 'Shield of Faith',
          active: true,
          schemaVersion: 3,
          effects: [{ type: 'stat', target: 'ac.deflection', bonusType: 'Deflection', value: 2 }]
        }
      ]
    };
    const derived = RuleEngine.deriveSheet(char);
    const snap = DnD35Ruleset.assistant.buildTacticalSnapshot(derived, char);
    assert(snap, 'snapshot should be returned');
    assert.strictEqual(snap.ruleset, 'dnd35');
    assert.strictEqual(snap.abilities.int.score, 18, 'derived.abilities numeric score must be read');
    assert.strictEqual(snap.abilities.int.mod, 4, 'derived.abilities.mods must be read');
    assert.strictEqual(snap.saves.will.occupied.Resistance.v, 2);
    assert(!snap.saves.will.openTypes.includes('Resistance'), 'occupied non-stacking Resistance must not be in openTypes');
    assert(snap.saves.will.openTypes.includes('Morale'), 'unoccupied Morale must be in openTypes');
    assert(!snap.openBodySlots.includes('Shoulders'), 'active char.bodySlots.shoulders must not be open');
    assert(!snap.openBodySlots.includes('Ring 1'), 'active char.bodySlots.ring1 must not be open');
    assert(snap.openBodySlots.includes('Ring 2'), 'unequipped Ring 2 must be open');
    assert(snap.openBodySlots.includes('Head'), 'inactive Head slot must be open');
    assert.deepStrictEqual(snap.candidates.preparedSpells, ['Grease'], 'only uncast char.spellcasting.preparedSpells appear');
    assert.deepStrictEqual(snap.candidates.knownSpells, ['Shield'], 'char.spellcasting.knownSpells must be read');
    assert(!snap.candidates.preparedSpells.includes('Haste'), 'Haste must never be hardcoded');
    assert(snap.candidates.consumables.some(c => c.includes('Potion of Cure Light Wounds')));
  });

  // 2. Test ai_assistant.js with REAL database/srd_index.json + REAL SrdCompendium API contract!
  const realIndexJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'database', 'srd_index.json'), 'utf8'));
  const realSpellsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'database', 'srd_spells.json'), 'utf8'));
  const realFeatsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'database', 'srd_feats.json'), 'utf8'));
  const loadedById = new Map();
  const loadedList = [];
  const loadType = (type) => {
    const raw = type === 'Spell' ? realSpellsJson : (type === 'Feat' ? realFeatsJson : []);
    const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.entries) ? raw.entries : []);
    for (const e of arr) {
      if (e && e.id && !loadedById.has(e.id)) {
        loadedById.set(e.id, e);
        loadedList.push(e);
      }
    }
  };

  const storageMap = new Map();
  const makeStorage = () => ({
    getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k)
  });

  const fakeEl = () => ({
    id: '', className: '', innerHTML: '', textContent: '', value: '', style: { setProperty() {} },
    dataset: {},
    classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c, f) { if (f === undefined) { if (this._s.has(c)) this._s.delete(c); else this._s.add(c); } else if (f) this._s.add(c); else this._s.delete(c); }, contains(c) { return this._s.has(c); } },
    setAttribute() {}, getAttribute() { return ''; }, addEventListener() {}, appendChild() {},
    querySelector() { return fakeEl(); }, querySelectorAll() { return []; }, getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; }
  });

  // Real SrdCompendium API surface (matches srd_compendium.js:688, 750, 793, 911, 1510)
  const realApiCompendium = {
    getIndexData: () => realIndexJson,
    getAllLoaded: () => loadedList,
    getById: (id) => loadedById.get(id) || null,
    getByName: (name) => loadedList.find(e => e && String(e.name || '').toLowerCase() === String(name || '').toLowerCase()) || null,
    ensureTypesLoaded: async (types) => {
      (Array.isArray(types) ? types : [types]).forEach(loadType);
      return loadedList;
    }
  };

  const sandbox = {
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    location: { pathname: '/index.html', search: '' },
    document: {
      readyState: 'loading',
      body: Object.assign(fakeEl(), { dataset: { page: 'sheet' } }),
      documentElement: Object.assign(fakeEl(), { dataset: {} }),
      head: fakeEl(),
      hidden: false,
      createElement: () => fakeEl(),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {}
    },
    window: null,
    RuleEngine: Object.assign({}, RuleEngine, { rulesets: { dnd35: DnD35Ruleset }, getRuleset: (id) => (id === 'dnd35' ? DnD35Ruleset : null) }),
    DnD35Ruleset,
    SrdCompendium: realApiCompendium,
    character: {
      id: 'char-rag-1',
      name: 'Lyra',
      rulesetId: 'dnd35',
      feats: [{ name: 'Iron Will' }],
      spellcasting: { preparedSpells: [], knownSpells: [] },
      bodySlots: {},
      consumables: [],
      buffs: []
    },
    addEventListener: () => {}
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const src = fs.readFileSync(path.join(ROOT, 'ai_assistant.js'), 'utf8');
  vm.runInNewContext(src, sandbox, { filename: 'ai_assistant.js' });
  const Ai = sandbox.AiAssistant;
  assert(Ai, 'AiAssistant should mount on sandbox');

  test('Memory sanitization, closed key vocabulary, non-colliding IDs, house_rule pinning, and delete work cleanly', () => {
    const r1 = Ai.savePreference({ scope: 'char', k: 'house_rule', v: 'Flanking gives <script>+4</script> `bonus` {test}' });
    assert.strictEqual(r1.ok, true);
    // Two prefs sharing the first 24 characters must NOT collide
    const pA = Ai.savePreference({ scope: 'global', k: 'playstyle', v: 'Always prefer defensive buffing before alpha strike' });
    const pB = Ai.savePreference({ scope: 'global', k: 'playstyle', v: 'Always prefer defensive positioning near the healer' });
    assert.strictEqual(pA.ok && pB.ok, true);

    const active = Ai.getActivePreferences();
    const hr = active.find(p => p.k === 'house_rule');
    assert(hr && hr.pinned === true, 'house_rule must be pinned');
    assert(!/[<>`{}]/.test(hr.v), 'pref value must strip injection characters');
    assert(active.filter(p => p.v.startsWith('Always prefer defensive')).length === 2, '24-char prefix must not collide');

    Ai.deletePreference('char', hr.id, 'char-rag-1');
    const afterDel = Ai.getActivePreferences();
    assert(!afterDel.some(p => p.id === hr.id), 'deleted pref must be removed');
  });

  test('buildSystemPrompt uses active ruleset profile, zero hardcoded Fireball, and wraps prefs safely', () => {
    Ai.savePreference({ scope: 'char', k: 'house_rule', v: 'Potions are Swift Actions' });
    const prompt = Ai.buildSystemPrompt('auto', { page: 'sheet' }, [], {
      profile: Ai.getActiveProfile(),
      prefs: Ai.getActivePreferences(),
      tacticalSnapshot: { ruleset: 'dnd35', saves: { will: { total: 4, occupied: {}, openTypes: ['Resistance'] } } },
      compendiumHits: [{ id: 'spl-maze', name: 'Maze', type: 'Spell', source: 'SRD 3.5e', isHomebrew: false, excerpt: 'DC 20 Intelligence check' }]
    });
    assert(prompt.includes('EDITION GUARD:'), 'edition guard missing');
    assert(prompt.includes('<untrusted_user_prefs>'), 'prefs must be in untrusted wrapper');
    assert(prompt.includes('House Rule — user-declared'), 'house rule must be labeled');
    assert(prompt.includes('<compendium_excerpts>'), 'compendium excerpts missing');
    assert(prompt.includes('LIVE CHARACTER TACTICAL SNAPSHOT'), 'tactical snapshot missing');
    assert(!prompt.includes('"Fireball"'), 'hardcoded Fireball example must be removed');
  });

  // Async RAG against REAL srd_index.json + srd_spells.json + srd_feats.json & strict remember_pref guard
  const asyncDone = (async () => {
    const ragTr = await Ai.retrieveCompendiumGrounding("maze'den nasıl kurtulurum?", sandbox.character, Ai.getActiveProfile());
    assert(ragTr.some(h => h.name === 'Maze' && h.excerpt && /Intelligence check/i.test(h.excerpt)),
      'Language-agnostic RAG against REAL srd_index.json must resolve "maze\'den" -> Maze with verbatim excerpt');
    passed++;

    const ragOwned = await Ai.retrieveCompendiumGrounding('Does my Iron Will help here?', sandbox.character, Ai.getActiveProfile());
    assert(ragOwned.some(h => h.name === 'Iron Will' && h.excerpt && /Will saving throws/i.test(h.excerpt)),
      'Multi-word owned feat must resolve against REAL srd_index.json + srd_feats.json');
    passed++;

    const blockedRecall = await Ai.executeStructuredActions([{ type: 'remember_pref', scope: 'global', k: 'verbosity', v: 'short' }], 'rulemaster', 'Do you remember what happened last session?');
    assert.strictEqual(blockedRecall[0].ok, false, 'Recall question must NOT trigger remember_pref');
    passed++;

    const blockedNote = await Ai.executeStructuredActions([{ type: 'remember_pref', scope: 'global', k: 'verbosity', v: 'short' }], 'rulemaster', 'Bu notu kaydet');
    assert.strictEqual(blockedNote[0].ok, false, 'Generic "notu kaydet" must NOT trigger remember_pref');
    passed++;

    const allowed = await Ai.executeStructuredActions([{ type: 'remember_pref', scope: 'global', k: 'verbosity', v: 'short' }], 'rulemaster', 'Remember this: keep replies short');
    assert.strictEqual(allowed[0].ok, true, 'Explicitly requested remember_pref must succeed');
    passed++;

    return passed;
  })();

  return asyncDone;
}

if (require.main === module) {
  runE4MemoryRagTests()
    .then(n => {
      console.log(`[OK] E4.4 Memory, Ruleset Adapter & Language-Agnostic RAG (Real SRD Index): ${n}/${n} tests passed.`);
    })
    .catch(err => {
      console.error('[FAIL] E4.4 Memory/RAG test failed:', err);
      process.exit(1);
    });
}

module.exports = { runE4MemoryRagTests };
