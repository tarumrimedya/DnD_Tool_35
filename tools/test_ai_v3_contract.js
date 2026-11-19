#!/usr/bin/env node
'use strict';

/**
 * 0-Token AI V3 Contract Gate (`tools/test_ai_v3_contract.js`)
 * Verifies that the Rule Master AI schema (`rule_master_ai_schema.json`) and the Lego pattern
 * library (`database/lego_patterns.json`) are Pure Canonical V3 (schemaVersion: 3):
 *   1. Schema parses, every `$ref` resolves, no legacy `*V2` definitions remain.
 *   2. canonicalExamples + pattern templates: schemaVersion 3, 0 `modifiers` / `damageParts`, no V2 top-level
 *      `defenses` / `resources` arrays (`modes[]` is canonical, see ModeV3), and each validates against `RuleMasterEntryV3`.
 *   3. Every stat `targets[]` key is canonical in tools/verify_v3_corpus.js; replaceStat / bonus types / rule
 *      switch flags match rulesets/dnd35.js.
 *   4. Rule Crafter round-trip idempotence: E1 = exportEntry(fromCanonicalV3(x)), E2 = exportEntry(fromCanonicalV3(E1)),
 *      E1 deep-equals E2, and x.effects / x.choices / x.powers survive semantically inside E1.
 *   5. replaceStat, perCL and defense templates run through RuleEngine.deriveSheet with the expected deltas and 0 new NaN.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'rule_master_ai_schema.json');
const LEGO_PATH = path.join(ROOT, 'database', 'lego_patterns.json');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

const REQUIRED_PATTERN_IDS = [
  'pat_breath_weapon_recharge', 'pat_scaling_natural_armor', 'pat_scaling_energy_resistance',
  'pat_reactive_save_counter_temp_hp', 'pat_synergy_mutator_unlock', 'pat_skill_replaces_ac',
  'pat_ability_score_substitution', 'pat_weapon_die_step_upgrade',
  'pat_choice_weapon_focus', 'pat_choice_energy_resistance', 'pat_clamped_per_cl_buff', 'pat_conditional_stance_rider_dice'
];
const BANNED_ANYWHERE = ['modifiers', 'damageParts'];
// `modes[]` is canonical V3 (ADR-056): selectable modes whose blocks live in `modes[].effects` (see ModeV3).
const BANNED_TOP_LEVEL = ['defenses', 'resources'];
const IGNORED_ROUNDTRIP_KEYS = new Set(['id', 'summary']);

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------------------------------------------------------------------------------------------
// Minimal draft-07 validator covering the keywords the AI schema uses
// ($ref, type, const, enum, required, properties, items, minItems, minimum, maximum, allOf, anyOf, not, if/then/else)
// ---------------------------------------------------------------------------------------------
function makeValidator(schema) {
  const resolve = (ref) => {
    if (!ref.startsWith('#/')) throw new Error(`Unsupported $ref ${ref}`);
    return ref.slice(2).split('/').reduce((node, key) => (node ? node[key] : undefined), schema);
  };
  const typeOk = (t, v) => {
    if (t === 'null') return v === null;
    if (t === 'array') return Array.isArray(v);
    if (t === 'object') return isObj(v);
    if (t === 'number') return typeof v === 'number' && Number.isFinite(v);
    if (t === 'integer') return Number.isInteger(v);
    return typeof v === t;
  };
  function validate(node, v, at, errs) {
    if (!node || typeof node !== 'object') return errs;
    if (node.$ref) return validate(resolve(node.$ref), v, at, errs);
    if (node.type) {
      const types = Array.isArray(node.type) ? node.type : [node.type];
      if (!types.some((t) => typeOk(t, v))) { errs.push(`${at}: expected ${types.join('|')}`); return errs; }
    }
    if (Object.prototype.hasOwnProperty.call(node, 'const') && !deepEqual(node.const, v)) errs.push(`${at}: must equal ${JSON.stringify(node.const)}`);
    if (Array.isArray(node.enum) && !node.enum.some((e) => deepEqual(e, v))) errs.push(`${at}: ${JSON.stringify(v)} not in enum`);
    if (typeof v === 'number') {
      if (typeof node.minimum === 'number' && v < node.minimum) errs.push(`${at}: < minimum ${node.minimum}`);
      if (typeof node.maximum === 'number' && v > node.maximum) errs.push(`${at}: > maximum ${node.maximum}`);
    }
    if (isObj(v)) {
      (node.required || []).forEach((k) => { if (v[k] === undefined) errs.push(`${at}: missing required "${k}"`); });
      Object.entries(node.properties || {}).forEach(([k, sub]) => { if (v[k] !== undefined) validate(sub, v[k], `${at}.${k}`, errs); });
      if (node.additionalProperties === false) {
        Object.keys(v).forEach((k) => { if (!node.properties || !node.properties[k]) errs.push(`${at}: unexpected "${k}"`); });
      }
    }
    if (Array.isArray(v)) {
      if (typeof node.minItems === 'number' && v.length < node.minItems) errs.push(`${at}: fewer than ${node.minItems} items`);
      if (node.items) v.forEach((item, i) => validate(node.items, item, `${at}[${i}]`, errs));
    }
    (node.allOf || []).forEach((sub) => validate(sub, v, at, errs));
    if (Array.isArray(node.anyOf) && !node.anyOf.some((sub) => validate(sub, v, at, []).length === 0)) errs.push(`${at}: matches no anyOf branch`);
    if (node.not && validate(node.not, v, at, []).length === 0) errs.push(`${at}: matches a forbidden (not) shape`);
    if (node.if) {
      const branch = validate(node.if, v, at, []).length === 0 ? node.then : node.else;
      if (branch) validate(branch, v, at, errs);
    }
    return errs;
  }
  return (defName, value, label) => validate({ $ref: `#/definitions/${defName}` }, value, label, []);
}

function collectRefs(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => collectRefs(n, out));
  else if (isObj(node)) {
    Object.entries(node).forEach(([k, v]) => {
      if (k === '$ref' && typeof v === 'string') out.push(v);
      else collectRefs(v, out);
    });
  }
  return out;
}

function findKeysDeep(node, keys, at, out = []) {
  if (Array.isArray(node)) node.forEach((n, i) => findKeysDeep(n, keys, `${at}[${i}]`, out));
  else if (isObj(node)) {
    Object.entries(node).forEach(([k, v]) => {
      if (keys.includes(k)) out.push(`${at}.${k}`);
      findKeysDeep(v, keys, `${at}.${k}`, out);
    });
  }
  return out;
}

// Walks every effect block of an entry (top-level, nested when/table children, powers[].effects)
function walkBlocks(entry, visit) {
  const walk = (list, at) => (Array.isArray(list) ? list : []).forEach((b, i) => {
    const here = `${at}[${i}]`;
    if (!isObj(b)) return;
    visit(b, here);
    (b.branches || []).forEach((br, j) => walk(br.effects || br.kids, `${here}.branches[${j}].effects`));
    (b.rows || []).forEach((r, j) => walk(r.effects || r.kids, `${here}.rows[${j}].effects`));
  });
  walk(entry.effects, 'effects');
  (entry.powers || []).forEach((pw, i) => walk(pw.effects, `powers[${i}].effects`));
  (entry.modes || []).forEach((m, i) => { if (isObj(m)) walk(m.effects, `modes[${i}].effects`); });
}

// Every key the author wrote must survive (by value) in the Forge export; Forge may add UI defaults.
function semanticSubset(src, out, at, errs) {
  if (Array.isArray(src)) {
    if (!Array.isArray(out) || out.length !== src.length) { errs.push(`${at}: length ${Array.isArray(out) ? out.length : 'n/a'} != ${src.length}`); return errs; }
    src.forEach((s, i) => semanticSubset(s, out[i], `${at}[${i}]`, errs));
    return errs;
  }
  if (isObj(src)) {
    if (!isObj(out)) { errs.push(`${at}: object lost`); return errs; }
    Object.keys(src).forEach((k) => {
      if (IGNORED_ROUNDTRIP_KEYS.has(k)) return;
      semanticSubset(src[k], out[k], `${at}.${k}`, errs);
    });
    return errs;
  }
  if (!deepEqual(src, out)) errs.push(`${at}: ${JSON.stringify(src)} -> ${JSON.stringify(out)}`);
  return errs;
}

function countNaN(node, seen = new Set()) {
  if (typeof node === 'number') return Number.isNaN(node) ? 1 : 0;
  if (!node || typeof node !== 'object' || seen.has(node)) return 0;
  seen.add(node);
  let n = 0;
  for (const v of Object.values(node)) n += countNaN(v, seen);
  return n;
}

function runAiV3ContractTests() {
  const startMs = Date.now();
  let passed = 0;
  const failures = [];
  const check = (cond, msg) => { if (cond) passed++; else failures.push(msg); };

  // 1. Schema integrity -----------------------------------------------------------------------
  const schema = readJson(SCHEMA_PATH);
  const defs = schema.definitions || {};
  check(/V3/.test(schema.title || ''), 'schema title must declare V3');
  check(Object.keys(defs).every((k) => !/V2$/.test(k)), `legacy V2 definitions remain: ${Object.keys(defs).filter((k) => /V2$/.test(k)).join(', ')}`);
  check(Boolean(defs.RuleMasterEntryV3), 'RuleMasterEntryV3 definition missing');
  check(deepEqual(defs.RuleMasterEntryV3 && defs.RuleMasterEntryV3.properties.schemaVersion, { const: 3 }), 'RuleMasterEntryV3.schemaVersion must be { const: 3 }');
  const refs = collectRefs(schema);
  const brokenRefs = refs.filter((r) => !/^#\/definitions\/[A-Za-z0-9_]+$/.test(r) || !defs[r.split('/').pop()]);
  check(refs.length > 0 && brokenRefs.length === 0, `unresolved $ref: ${brokenRefs.join(', ')}`);
  const validate = makeValidator(schema);

  // 2. Corpus of AI-facing V3 entries ---------------------------------------------------------
  const lego = readJson(LEGO_PATH);
  check(lego.schemaVersion === 3, 'lego_patterns.json schemaVersion must be 3');
  check(lego.version === '3.0.0', 'lego_patterns.json version must be "3.0.0"');
  const patterns = Array.isArray(lego.patterns) ? lego.patterns : [];
  const patternIds = patterns.map((p) => p.patternId);
  check(patterns.length === REQUIRED_PATTERN_IDS.length, `expected ${REQUIRED_PATTERN_IDS.length} patterns, found ${patterns.length}`);
  check(REQUIRED_PATTERN_IDS.every((id) => patternIds.includes(id)), `missing patterns: ${REQUIRED_PATTERN_IDS.filter((id) => !patternIds.includes(id)).join(', ')}`);
  check(new Set(patternIds).size === patternIds.length, 'duplicate patternId');
  patterns.forEach((p) => check(Array.isArray(p.keywords) && p.keywords.length > 0 && isObj(p.template), `${p.patternId}: keywords[] + template required`));

  const examples = Array.isArray(schema.canonicalExamples) ? schema.canonicalExamples : [];
  check(examples.length === 7, `expected 7 canonicalExamples, found ${examples.length}`);
  const corpus = [
    ...examples.map((ex, i) => ({ label: `canonicalExamples[${i}] ${ex.title || ''}`.trim(), entry: ex.entry })),
    ...patterns.map((p) => ({ label: `lego:${p.patternId}`, entry: p.template }))
  ];

  const corpusApi = require('./verify_v3_corpus.js');
  const ruleset = require('../rulesets/dnd35.js');
  const swapTargets = new Set();
  ruleset.statSwapTargetGroups.forEach((g) => g[1].forEach((t) => swapTargets.add(t[0])));
  const swapSources = new Set(ruleset.statSwapSources.map((x) => x[0]));
  const swapOps = new Set(ruleset.statSwapOps.map((x) => x[0]));
  const swapScopes = new Set(ruleset.statSwapScopes.map((x) => x[0]));
  const bonusTypes = new Set(ruleset.bonusTypes.map((x) => x.id));
  const blockTypeEnum = new Set(defs.EffectBlockV3.properties.type.enum);
  const ruleSwitchFlags = new Set(ruleset.ruleSwitchFlags.map((x) => x[0]));

  const Forge = require('../forge_sandbox.js');
  check(blockTypeEnum.size === Object.keys(Forge.blockTypes).length && Object.keys(Forge.blockTypes).every((t) => blockTypeEnum.has(t)),
    'schema block type enum must equal ForgeSandbox.blockTypes');
  const forgeBlueprints = Forge.blueprints.map((b) => b.id).sort();
  check(deepEqual(defs.RuleMasterEntryV3.properties.blueprint.enum.slice().sort(), forgeBlueprints), 'schema blueprint enum must equal ForgeSandbox.blueprints');

  // 2b. Export field coverage: every key the Rule Crafter writes in exportPower / exportUse / exportBlock must be
  // documented in the schema, so new Crafter fields (dcFormula, gainedAt, ...) cannot drift past the AI contract.
  const forgeSrc = fs.readFileSync(path.join(ROOT, 'forge_sandbox.js'), 'utf8');
  const assignedKeys = (fnName) => {
    const start = forgeSrc.indexOf(`function ${fnName}(`);
    if (start < 0) return null;
    const end = forgeSrc.indexOf('\n  }\n', start);
    const body = forgeSrc.slice(start, end > start ? end : start + 4000);
    return [...new Set([...body.matchAll(/\bo\.([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)/g)].map((m) => m[1]))];
  };
  const blockDocKeys = new Set();
  Object.entries(defs).forEach(([name, def]) => {
    if (/BlockV3$/.test(name) || name === 'BranchV3' || name === 'TableRowV3') Object.keys(def.properties || {}).forEach((k) => blockDocKeys.add(k));
  });
  [
    ['exportPower', new Set(Object.keys(defs.PowerV3.properties || {})), 'PowerV3'],
    ['exportUse', new Set(Object.keys(defs.UsageV3.properties || {})), 'UsageV3'],
    ['exportBlock', blockDocKeys, '*BlockV3']
  ].forEach(([fn, documented, defName]) => {
    const keys = assignedKeys(fn);
    check(Array.isArray(keys) && keys.length > 0, `forge_sandbox.js: ${fn}() not found for the export coverage check`);
    const undocumented = (keys || []).filter((k) => !documented.has(k));
    check(undocumented.length === 0, `${fn}() writes keys missing from ${defName} in rule_master_ai_schema.json: ${undocumented.join(', ')}`);
  });

  corpus.forEach(({ label, entry }) => {
    check(isObj(entry), `${label}: entry must be an object`);
    if (!isObj(entry)) return;
    check(entry.schemaVersion === 3, `${label}: schemaVersion must be 3`);
    const banned = findKeysDeep(entry, BANNED_ANYWHERE, label);
    check(banned.length === 0, `${label}: legacy V2 keys ${banned.join(', ')}`);
    const bannedTop = BANNED_TOP_LEVEL.filter((k) => entry[k] !== undefined);
    check(bannedTop.length === 0, `${label}: legacy V2 top-level ${bannedTop.join(', ')}`);
    const errs = validate('RuleMasterEntryV3', entry, label);
    check(errs.length === 0, `${label}: schema violations\n    ${errs.join('\n    ')}`);

    // modes[]: unique ids, blocks only in effects[] (never blocks[]), closed combatScope vocabulary
    if (entry.modes !== undefined) {
      check(Array.isArray(entry.modes), `${label}: modes must be an array`);
      const modeIds = new Set();
      (Array.isArray(entry.modes) ? entry.modes : []).forEach((m, i) => {
        if (!isObj(m)) return;
        check(!modeIds.has(m.id), `${label} modes[${i}]: duplicate mode id "${m.id}"`);
        modeIds.add(m.id);
        check(m.blocks === undefined && m.modifiers === undefined, `${label} modes[${i}]: mode blocks live in effects[] only`);
      });
    }

    // 3. Target / ruleset vocabulary ----------------------------------------------------------
    walkBlocks(entry, (b, at) => {
      check(blockTypeEnum.has(b.type), `${label} ${at}: unknown block type "${b.type}"`);
      if (b.type === 'stat') {
        (b.targets || []).forEach((t) => {
          const c = corpusApi.canonicalizeTarget(t);
          check(c.ok && c.canonical === t && !c.aliased, `${label} ${at}: non-canonical target "${t}"${c.ok ? ` (use "${c.canonical}")` : ''}`);
        });
        if (b.btype !== undefined) check(bonusTypes.has(b.btype), `${label} ${at}: unknown btype "${b.btype}"`);
        if (b.mode === 'replaceStat') {
          check(swapTargets.has(b.swapTarget) && deepEqual(b.targets, [b.swapTarget]), `${label} ${at}: replaceStat swapTarget/targets mismatch`);
          check(swapOps.has(b.subOp), `${label} ${at}: unknown subOp "${b.subOp}"`);
          check(swapSources.has(b.fromStat) && swapSources.has(b.toStat), `${label} ${at}: unknown fromStat/toStat`);
          check(swapScopes.has(b.swapScope), `${label} ${at}: unknown swapScope "${b.swapScope}"`);
        }
      }
      if (b.type === 'effect' && b.effectKind === 'ruleSwitch') {
        check(ruleSwitchFlags.has(b.flag), `${label} ${at}: unknown rule switch flag "${b.flag}"`);
      }
    });

    // 4. Rule Crafter round-trip idempotence + semantic preservation --------------------------
    try {
      const e1 = Forge.exportEntry(Forge.fromCanonicalV3(JSON.parse(JSON.stringify(entry))));
      const e2 = Forge.exportEntry(Forge.fromCanonicalV3(JSON.parse(JSON.stringify(e1))));
      check(deepEqual(e1, e2), `${label}: round-trip not idempotent (E1 != E2)`);
      check(e1.id === entry.id && e1.blueprint === entry.blueprint && e1.schemaVersion === 3, `${label}: identity lost in round-trip`);
      ['effects', 'choices', 'powers', 'modes'].forEach((k) => {
        if (entry[k] === undefined) return;
        const errs2 = semanticSubset(entry[k], e1[k], `${label}.${k}`, []);
        check(errs2.length === 0, `${label}: ${k} not preserved by Rule Crafter round-trip\n    ${errs2.slice(0, 8).join('\n    ')}`);
      });
    } catch (err) {
      check(false, `${label}: round-trip threw ${err && err.message}`);
    }
  });

  // 4a. modes[] round trip over the whole database: every mode keeps its id and `activation`, Off and weapon-grip modes
  //     come back untouched, and a second pass changes nothing (opening an SRD record in the Crafter must not lose data).
  {
    const dbDir = path.join(ROOT, 'database');
    let modeEntries = 0;
    fs.readdirSync(dbDir).filter((f) => f.endsWith('.json')).forEach((f) => {
      let raw; try { raw = readJson(path.join(dbDir, f)); } catch (_) { return; }
      (Array.isArray(raw) ? raw : (raw.entries || [])).forEach((rec) => {
        if (!isObj(rec) || !Array.isArray(rec.modes) || rec.modes.length === 0) return;
        modeEntries++;
        try {
          const e1 = Forge.exportEntry(Forge.fromCanonicalV3(JSON.parse(JSON.stringify(rec))));
          const e2 = Forge.exportEntry(Forge.fromCanonicalV3(JSON.parse(JSON.stringify(e1))));
          const out = e1.modes || [];
          check(out.length === rec.modes.length, `${f} ${rec.id}: modes[] length changed in the Rule Crafter round trip (${rec.modes.length} -> ${out.length})`);
          check(deepEqual(e1.modes, e2.modes), `${f} ${rec.id}: modes[] round trip not idempotent`);
          rec.modes.forEach((m) => {
            const o = out.find((x) => x.id === m.id);
            check(!!o, `${f} ${rec.id}: mode "${m.id}" lost in the Rule Crafter round trip`);
            if (!o) return;
            check(deepEqual(m.activation, o.activation), `${f} ${rec.id} ${m.id}: mode.activation changed in the round trip`);
            if (m.effects === undefined || (m.effects || []).length === 0) check(deepEqual(m, o), `${f} ${rec.id} ${m.id}: Off / weapon-grip mode not written back untouched`);
          });
        } catch (err) {
          check(false, `${f} ${rec.id}: modes round trip threw ${err && err.message}`);
        }
      });
    });
    check(modeEntries >= 285, `expected >= 285 database entries with modes[], found ${modeEntries}`);
  }

  // 5. RuleEngine.deriveSheet smoke on replaceStat / perCL / defense templates ----------------
  const RuleEngine = require('../rule_engine.js');
  require('../char_store.js');

  // 4b. Every power dcFormula must evaluate to a real Save DC on a live character (fixture 02, level 9).
  const dcProbeChar = readJson(path.join(FIXTURES_DIR, '02_cleric_radiant_lvl9.json'));
  RuleEngine.recalculateCharacter(dcProbeChar, []);
  corpus.forEach(({ label, entry }) => {
    (isObj(entry) && Array.isArray(entry.powers) ? entry.powers : []).forEach((pw, i) => {
      if (pw.dcFormula === undefined) return;
      const res = RuleEngine.evaluateAbilitySaveDc({ dcFormula: pw.dcFormula, spellLevel: pw.spellLevel }, dcProbeChar);
      check(Boolean(res) && Number.isFinite(res.dc) && res.dc >= 10,
        `${label} powers[${i}].dcFormula "${pw.dcFormula}" does not evaluate to a Save DC (got ${res ? res.dc : 'null'})`);
    });
  });
  // 4c. Closed condition vocabulary: every `when` / `while` branch in the AI-facing corpus (schema examples + patterns)
  // must be understood by the engine (declared `situational` / `activation` kinds are fine; unknown text is not).
  const condWalk = (node, label, path) => {
    if (Array.isArray(node)) { node.forEach((x, i) => condWalk(x, label, `${path}[${i}]`)); return; }
    if (!isObj(node)) return;
    if (node.type === 'when' || node.type === 'while') {
      const flat = !Array.isArray(node.branches);
      const items = flat
        ? [[node.condKind, node.condition !== undefined ? node.condition : (node.when !== undefined ? node.when : (node.while !== undefined ? node.while : node.condText)), true]]
        : node.branches.map((b) => [b.condKind || 'toggle', b.condText !== undefined ? b.condText : b.condition, false]);
      items.forEach(([k, t, isFlat]) => {
        if (k === 'note' || k === 'else' || (t && typeof t === 'object') || t === undefined) return;
        const r = RuleEngine.resolveV3WhenCondition(k || 'toggle', t, 'when', {}, {}, {}, { useNamedKind: !isFlat, strict: true });
        check(r !== 'unrecognized', `${label} ${path}: condition "${k}|${t}" is outside the closed condition vocabulary`);
      });
    }
    Object.keys(node).forEach((key) => condWalk(node[key], label, `${path}.${key}`));
  };
  corpus.forEach(({ label, entry }) => condWalk(entry, label, ''));
  patterns.forEach((p) => condWalk(p.template, `pattern ${p.patternId}`, ''));

  // Probes get a unique id + name so the engine cannot resolve them to an SRD/seed entry (by id or by name)
  // and must evaluate the template's own effects[] blocks.
  const tpl = (id) => Object.assign(JSON.parse(JSON.stringify((patterns.find((p) => p.patternId === id) || {}).template || {})),
    { id: `ai-contract-probe-${id}`, name: `AI Contract Probe ${id}` });
  const fixture = (file) => readJson(path.join(FIXTURES_DIR, file));
  const derive = (ch) => RuleEngine.deriveSheet(ch, []);
  const asFeat = (t) => Object.assign({ type: 'Feat', active: true }, t);
  const asBuff = (t) => Object.assign({ active: true, durationCategory: 'minute' }, t);
  const deriveCase = (name, file, mutate, assertFn, prep = () => {}) => {
    try {
      const base = fixture(file);
      prep(base);
      const before = derive(base);
      const withTpl = fixture(file);
      prep(withTpl);
      mutate(withTpl);
      const after = derive(withTpl);
      const nanBefore = countNaN(before), nanAfter = countNaN(after);
      check(nanAfter === 0 || nanAfter <= nanBefore, `deriveSheet ${name}: template introduced NaN (${nanBefore} -> ${nanAfter})`);
      const msg = assertFn(before, after);
      check(!msg, `deriveSheet ${name}: ${msg}`);
    } catch (err) {
      check(false, `deriveSheet ${name}: threw ${err && err.message}`);
    }
  };

  // replaceStat: Con 14 (+2) replaces Wis 12 (+1) on Will saves -> +1 Will
  deriveCase('replaceStat (pat_ability_score_substitution)', '01_fighter_lvl1.json',
    (ch) => { ch.feats.push(asFeat(tpl('pat_ability_score_substitution'))); },
    (b, a) => (a.saves.will === b.saves.will + 1 ? null : `Will ${b.saves.will} -> ${a.saves.will}, expected +1`));

  // perCL: Divine Favor = +1 luck per 3 caster levels (min +1, max +3) on attack and weapon damage
  const atkOf = (r) => Number(r.combat.weapons[0].evaluated.netAttackBonus);
  const dmgOf = (r) => Number(r.combat.weapons[0].evaluated.netFlatDamage);
  [[1, 1], [3, 1], [6, 2], [9, 3], [18, 3]].forEach(([cl, want]) => {
    deriveCase(`perCL CL ${cl} (pat_clamped_per_cl_buff)`, '02_cleric_radiant_lvl9.json',
      (ch) => { ch.buffs.push(asBuff(Object.assign(tpl('pat_clamped_per_cl_buff'), { casterLevel: cl }))); },
      (b, a) => (atkOf(a) === atkOf(b) + want && dmgOf(a) === dmgOf(b) + want
        ? null : `attack ${atkOf(b)} -> ${atkOf(a)}, damage ${dmgOf(b)} -> ${dmgOf(a)}, expected +${want}/+${want}`),
      (ch) => { ch.buffs = (ch.buffs || []).filter((x) => x.id !== 'spl-divine-favor'); });
  });

  // defense: tiered Energy Resistance at character level 9 -> Acid 20 (@level >= 7 branch)
  deriveCase('defense (pat_scaling_energy_resistance)', '02_cleric_radiant_lvl9.json',
    (ch) => { ch.feats.push(asFeat(tpl('pat_scaling_energy_resistance'))); },
    (b, a) => {
      const res = a.defenses && a.defenses.resistances ? a.defenses.resistances : {};
      const acid = Number(res.acid && typeof res.acid === 'object' ? res.acid.value : res.acid);
      return acid === 20 ? null : `expected acid resistance 20, got ${JSON.stringify(res)}`;
    });

  const elapsedMs = Date.now() - startMs;
  if (failures.length > 0) {
    throw new Error(`AI V3 Contract Gate failed (${failures.length} failure(s)):\n  - ${failures.join('\n  - ')}`);
  }
  return { passed, elapsedMs };
}

module.exports = { runAiV3ContractTests };

if (require.main === module) {
  try {
    const res = runAiV3ContractTests();
    console.log(`✅ AI V3 Contract Gate: ${res.passed}/${res.passed} checks passed in ${res.elapsedMs}ms.`);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}
