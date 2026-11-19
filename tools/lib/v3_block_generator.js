'use strict';

/**
 * Deterministic Text-to-Block Generator (0 tokens, Pure Canonical V3).
 *
 * Builds directly on tools/lib/v3_claims.js (claim extractor & coverage matcher) and
 * RuleEngine (V3 evaluator + closed `when` condition vocabulary).
 *
 * Design principles:
 * - Zero new block types: emits strictly canonical V3 blocks (`stat`, `defense`, `resource`, `when`).
 * - Precision first: false-positive guards reject ambiguous, negated, or multi-tier prose.
 * - Mandatory pre-write gate: every generated block must pass:
 *     (1) Dead-block validator (mirroring tools/audit_v3_full.js Layer 2)
 *     (2) Closed-vocabulary silent-failure gate (mirroring tools/v3_silent_failure_gate.js)
 *     (3) Coverage check (the block actually resolves the targeted `missing` claim)
 *     (4) Canonical schema check (no legacy modifiers/damageParts, valid block type)
 */

const claimsLib = require('./v3_claims.js');

const SKIP_RECORD_TYPES = new Set(['Monster', 'Class', 'DamageType']);
const CANONICAL_BLOCK_TYPES = new Set(['stat', 'roll', 'attack', 'defense', 'effect', 'resource', 'when', 'while', 'table', 'carrier']);

const AC_TARGET_BY_BTYPE = {
  Deflection: 'ac.deflection',
  'Natural Armor': 'ac.natural',
  Dodge: 'ac.dodge',
  Armor: 'ac.armor',
  Shield: 'ac.shield',
  Sacred: 'ac.sacred',
  Profane: 'ac.profane',
  Insight: 'ac.insight',
  Luck: 'ac.luck',
  Size: 'ac.size'
};

const SUPPORTED_FAMILIES = new Set([
  'save', 'skill', 'sense', 'immunity', 'resist', 'dr', 'sr',
  'ac', 'init', 'grapple', 'attack', 'damage', 'attackDamage',
  'ability', 'casterLevel', 'perDay'
]);

const IGNORE_GRANT_KEYS = new Set(['source', 'sourceLabel', 'label', 'id', 'blockId', '_blockId', 'origin']);
const STD_OUT_KEYS = new Set([
  'modifiers', 'damageParts', 'defenses', 'resources', 'grants', 'ruleFlags',
  'tacticalBadges', 'effects', 'modes', 'activeMode', 'activeModeIdx', 'activeModeId'
]);

function slugify(s, fb = 'rule') {
  return String(s || fb).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fb;
}

function titleCase(s) {
  return String(s || '').trim().split(/([- ])/).map((w) => (/^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w)).join('');
}

function stableStr(o) {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return '[' + o.map(stableStr).join(',') + ']';
  return '{' + Object.keys(o).filter((k) => !IGNORE_GRANT_KEYS.has(k)).sort().map((k) => k + ':' + stableStr(o[k])).join(',') + '}';
}

function cloneEntry(e) {
  return JSON.parse(JSON.stringify(e));
}

function makeProbes() {
  const mk = (lvl) => ({
    name: 'Gen Probe ' + lvl,
    level: lvl,
    hd: lvl,
    abilities: { str: 16, dex: 14, con: 14, int: 14, wis: 14, cha: 14 },
    levelProgression: Array.from({ length: lvl }, (_, i) => ({ className: i % 2 ? 'Cleric' : 'Fighter', level: i + 1, active: true })),
    classes: [{ name: 'Fighter', level: Math.ceil(lvl / 2) }, { name: 'Cleric', level: Math.floor(lvl / 2) }],
    bab: lvl,
    tactical: {},
    inventory: [],
    bodySlots: {},
    activeModes: {}
  });
  return [mk(10), mk(20)];
}

function atomsOf(RE, ev) {
  const atoms = new Map();
  if (!ev || typeof ev !== 'object') return atoms;
  const add = (k, v) => {
    const prev = atoms.get(k);
    atoms.set(k, prev === undefined ? v : (prev === v ? prev : prev + ' / ' + v));
  };
  (ev.modifiers || []).forEach((m) => {
    if (!m || !m.target) return;
    const t = String(m.target).toLowerCase();
    const bt = String(m.type || 'untyped').toLowerCase().replace(/[\s_-]+/g, '');
    const cond = String(m.condition || '').toLowerCase().trim();
    const val = (m.value !== undefined && m.value !== null) ? String(m.value) : (m.formula ? 'f:' + m.formula : '0');
    add('mod|' + t + '|' + bt + '|' + cond, val);
  });
  (ev.damageParts || []).forEach((d) => {
    if (!d) return;
    add('dmg|' + String(d.type || 'untyped').toLowerCase() + '|' + String(d.condition || '').toLowerCase(), String(d.dice || d.formula || d.value || ''));
  });
  (ev.defenses || []).forEach((d) => {
    if (!d) return;
    add('def|' + String(d.kind || d.type || '').toLowerCase(), stableStr(d));
  });
  (ev.resources || []).forEach((r) => {
    if (!r) return;
    add('res|' + String(r.key || r.name || '').toLowerCase(), stableStr(r));
  });
  (ev.grants || []).forEach((g) => {
    if (!g) return;
    add('grant|' + String(g.grantType || g.type || g.kind || '').toLowerCase(), stableStr(g));
  });
  if (ev.ruleFlags && typeof ev.ruleFlags === 'object') {
    Object.entries(ev.ruleFlags).forEach(([k, v]) => {
      if (v !== false && v !== null && v !== undefined) add('flag|' + k, stableStr(v));
    });
  }
  return atoms;
}

function fingerprint(RE, entry, probes) {
  const all = new Map();
  const modeCount = Array.isArray(entry.modes) && entry.modes.length ? entry.modes.length : 1;
  probes.forEach((p) => {
    for (let mi = 0; mi < modeCount; mi++) {
      const ctx = { character: p, level: p.level, cl: p.level };
      if (Array.isArray(entry.modes) && entry.modes.length) ctx.activeModeIdx = mi;
      let ev;
      try {
        RE._activeCharacter = p;
        ev = RE.evaluateV3Entry(cloneEntry(entry), ctx);
      } catch (_) {
        continue;
      }
      atomsOf(RE, ev).forEach((v, k) => {
        const mk = modeCount > 1 ? 'mode' + mi + '|' + k : k;
        const prev = all.get(mk);
        all.set(mk, prev === undefined ? v : (prev === v ? prev : prev + ' / ' + v));
      });
    }
  });
  return all;
}

/**
 * Wrap a V3 block in a closed-vocabulary `when` wrapper if a qualifier is present.
 * Maps known tactical/alignment/gear states to exact closed-vocab atoms, and all other
 * qualifiers to `condKind: 'situational'` (accepted by silent-failure gate, never leaks into totals).
 */
function wrapQualifierClosed(block, rawQualifier) {
  const qual = String(rawQualifier || '').trim();
  if (!qual) return block;
  const cleaned = qual.replace(/[.,;:\s]+$/, '').trim();
  if (!cleaned) return block;

  const stripped = cleaned.replace(/^(?:when|while|if|during)\s+/i, '').trim();
  if (/^(?:charging|on a charge)$/i.test(stripped)) {
    return { type: 'when', flow: 'while', branches: [{ condKind: 'state', condText: 'charging', effects: [block] }] };
  }
  if (/^flanking$/i.test(stripped)) {
    return { type: 'when', flow: 'while', branches: [{ condKind: 'state', condText: 'flanking', effects: [block] }] };
  }
  if (/^fighting defensively$/i.test(stripped)) {
    return { type: 'when', flow: 'while', branches: [{ condKind: 'state', condText: 'fightingDefensively', effects: [block] }] };
  }
  if (/^(?:taking\s+)?total\s+defense$/i.test(stripped)) {
    return { type: 'when', flow: 'while', branches: [{ condKind: 'state', condText: 'totalDefense', effects: [block] }] };
  }
  if (/^(?:against|vs\.?|versus)\s+(?:creatures?\s+of\s+)?evil(?:\s+alignment|\s+creatures?)?$/i.test(cleaned)) {
    return { type: 'when', flow: 'while', branches: [{ condKind: 'state', condText: 'alignment:evil', effects: [block] }] };
  }
  if (/^(?:against|vs\.?|versus)\s+(?:creatures?\s+of\s+)?good(?:\s+alignment|\s+creatures?)?$/i.test(cleaned)) {
    return { type: 'when', flow: 'while', branches: [{ condKind: 'state', condText: 'alignment:good', effects: [block] }] };
  }
  if (/^(?:against|vs\.?|versus)\s+(?:creatures?\s+of\s+)?lawful(?:\s+alignment|\s+creatures?)?$/i.test(cleaned)) {
    return { type: 'when', flow: 'while', branches: [{ condKind: 'state', condText: 'alignment:lawful', effects: [block] }] };
  }
  if (/^(?:against|vs\.?|versus)\s+(?:creatures?\s+of\s+)?chaotic(?:\s+alignment|\s+creatures?)?$/i.test(cleaned)) {
    return { type: 'when', flow: 'while', branches: [{ condKind: 'state', condText: 'alignment:chaotic', effects: [block] }] };
  }

  const normSit = cleaned.replace(/^(?:against|vs\.?|versus)\s+/i, 'vs. ').slice(0, 96);
  return { type: 'when', flow: 'while', branches: [{ condKind: 'situational', condText: normSit, effects: [block] }] };
}

/**
 * False-positive guards per claim family. Returns a string reason to skip, or null if safe.
 */
function checkFalsePositiveGuard(claim, entry, fullText, allMissingClaims) {
  const phrase = String(claim.phrase || '');
  const lowText = String(fullText || '').toLowerCase();

  // Table/multi-item compendium records (e.g., Ioun Stones) contain pipe-delimited rows for different items
  if (phrase.includes('|')) return 'table-row-phrase';

  // Reject temporary/activated duration clauses embedded inside passive bonus text unless entry is a Spell/Power
  const isPassiveContainer = !['Spell', 'Power', 'Consumable', 'Maneuver', 'Stance', 'Mystery', 'Utterance'].includes(entry.type);
  if (isPassiveContainer && /\b(?:for\s+\d+\s+(?:rounds?|minutes?|hours?)|until\s+the\s+(?:start|end|beginning)\s+of\s+(?:your|her|his)\s+next\s+(?:turn|action)|before\s+the\s+start\s+of\s+your\s+next\s+turn)\b/i.test(phrase)) {
    return 'timed-activated-clause';
  }

  // Reject "if you are <alignment>" / conditional prose stuffed inside non-qualified phrases
  if (/\bif\s+you\s+are\b|\bprovided\s+that\b/i.test(phrase) && !claim.qualifier) {
    return 'conditional-clause-in-phrase';
  }

  // Reject opponent/enemy/target debuffs & cursed items that apply to OTHER creatures or curses, not bearer buffs
  if (/\b(?:they\s+flee|their\s+(?:will|fortitude|reflex|saving|saves?|attack)|its\s+saving\s+throw|makes\s+it\s+hostile|remove\s+curse|opponents?|enemies|foes?|creatures?\s+within|victim|all\s+adjacent\s+enemies|against\s+(?:her|him|you|the\s+wearer|the\s+wielder))\b/i.test(phrase)) {
    return 'target-or-curse-clause';
  }
  if (claim.value < 0 && /\b(?:enemies|opponents?|foes?|creatures?\s+within|aura\s+of|targets?\s+(?:take|suffer)|subjects?\s+(?:take|suffer)|without\s+(?:these|such|artisan|proper)\s+tools?|improvised\s+tools?)\b/i.test(lowText)) {
    return 'enemy-aura-or-missing-tool-penalty';
  }

  // Reject "worst save" / "lowest save" / "a specific type of" / "one chosen" phrases that require dynamic/choice logic
  if (/\b(?:worst\s+save|lowest\s+save|specific\s+type\s+of|chosen\s+skill|selected\s+skill)\b/i.test(phrase)) {
    return 'dynamic-or-choice-target';
  }

  // Reject combat maneuver opposed rolls, improvised weapon penalties, and nonproficient clauses
  if (claim.family === 'attack' || claim.family === 'damage' || claim.family === 'attackDamage') {
    if (/\b(?:opposed\s+attack|disarm|trip|sunder|bull\s+rush|overrun|improvised|nonproficient|insufficient)\b/i.test(phrase)) {
      return 'maneuver-or-improvised-attack';
    }
    if (entry.type === 'Ammo' && claim.value < 0 && /\bimprovised\b/i.test(lowText)) {
      return 'ammo-improvised-penalty';
    }
  }

  // Reject generic environmental "on the save" (e.g. rolling on ground to put out fire)
  if (claim.family === 'save' && /\bon\s+the\s+save\b/i.test(phrase) && !/\b(?:fortitude|reflex|will)\b/i.test(phrase)) {
    return 'generic-environmental-save';
  }

  if (claim.family === 'sense') {
    // Reject spells/items that hide FROM or defeat senses rather than granting them
    const escT = claim.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const targetRx = new RegExp(
      '(?:hide|hidden|conceal|invisible|undetectable|imperceptible|defeat|foil|fool|cannot\\s+detect|can\'t\\s+detect|immune\\s+to|blocks?|negates?|prevents?|even\\s+(?:with|against|from)|creatures?\\s+with|foes?\\s+with|such\\s+as|do\\s+not\\s+have|does\\s+not\\s+have|improves?\\s+your|extends?\\s+your|increases?\\s+the\\s+range\\s+of)\\s+[^.;]{0,50}' +
      escT,
      'i'
    );
    if (targetRx.test(lowText)) return 'sense-negated-or-referenced';
    // Skip bare "darkvision" / "blindsense" without distance if another claim on same record has the same sense WITH distance
    if (!claim.value && allMissingClaims.some((c) => c !== claim && c.family === 'sense' && c.target === claim.target && c.value)) {
      return 'sense-superseded-by-ranged';
    }
    // Require a range for ranged senses (darkvision, blindsense, blindsight, tremorsense) to avoid prerequisite/flavor mentions
    if (claim.target !== 'low-light vision' && !claim.value) {
      return 'sense-missing-range';
    }
    // Skip conflicting multiple ranges for the same sense (e.g., upgraded/tiered items: 60 ft. vs 120 ft.)
    const sameSenseVals = new Set(allMissingClaims.filter((c) => c.family === 'sense' && c.target === claim.target && c.value).map((c) => c.value));
    if (sameSenseVals.size > 1) return 'sense-ambiguous-multi-range';
    // Require explicit grant phrasing for spells/items unless it's a Race/Template/ClassAbility
    if (['Spell', 'Power', 'MagicItem', 'Weapon', 'Armor', 'Enhancement'].includes(entry.type)) {
      const grantRx = new RegExp(
        '(?:grants?|gains?|confers?|gives?|bestows?|have|has|receive|possess)\\s+[^.;]{0,40}' +
        escT +
        '|\\b' + escT + '\\s+(?:out\\s+to\\s+)?\\d+\\s*(?:ft|feet)',
        'i'
      );
      if (!grantRx.test(lowText)) return 'sense-no-grant-context';
    }
  }

  if (claim.family === 'immunity') {
    const t = String(claim.target || '').trim();
    if (!t || t.length < 3 || t.length > 36) return 'immunity-noisy-length';
    if (/\b(?:if|when|while|unless|because|she|he|they|you|can|may|actually|only|but|cannot|unaffected|affected|until|next\s+turn|this\s+spell|this\s+weapon|this\s+effect|this\s+ability|for\s+\d+)\b/i.test(t)) {
      return 'immunity-prose-fragment';
    }
    if (/^(?:it|this|that|them|the|a|an|all|any|such|other|normal|the\s+\w+)$/i.test(t)) return 'immunity-vague-noun';
    // Reject target/creature immunity clauses ("creatures immune to critical hits are unaffected")
    const escImm = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp('(?:creatures?|targets?|foes?|opponents?|beings?|undead|constructs?)\\s+(?:that\\s+are\\s+)?immune\\s+to\\s+' + escImm, 'i').test(lowText)) {
      return 'immunity-target-not-bearer';
    }
    if (['Spell', 'Enhancement', 'Weapon', 'ClassAbility'].includes(entry.type) && /\b(?:unaffected|cannot\s+be\s+affected|no\s+effect\s+on)\b/i.test(lowText)) {
      return 'immunity-ability-caveat';
    }
  }

  if (claim.family === 'perDay') {
    if (['Condition', 'Spell', 'Power', 'Consumable'].includes(entry.type)) return 'perDay-non-pool-type';
    const distinctDayCounts = new Set(allMissingClaims.filter((c) => c.family === 'perDay').map((c) => c.value));
    if (distinctDayCounts.size > 1) return 'perDay-multi-tier-ambiguous';
    if (claim.value < 1 || claim.value > 20) return 'perDay-out-of-range';
    // Skip if prose mentions "more than once per day" / "only once per day" restriction on another effect
    if (/\b(?:more\s+than|at\s+most|no\s+more\s+than|only)\s+(?:once|twice|\d+\s+times?)\s+per\s+day\b/i.test(lowText) && !/\b(?:activate|use|cast|invoke|command)\b/i.test(lowText)) {
      return 'perDay-cap-not-pool';
    }
  }

  if (claim.family === 'dr') {
    const bypass = String(claim.target || '').replace(/\s+as\s+well$/i, '').trim();
    const validBypass = /^(?:—|-|magic|silver|cold\s+iron|adamantine|good|evil|lawful|chaotic|epic|bludgeoning|piercing|slashing|psionics)(?:\s+(?:and|or)\s+(?:magic|silver|cold\s+iron|adamantine|good|evil|lawful|chaotic|epic|bludgeoning|piercing|slashing|psionics))*$/i;
    if (!validBypass.test(bypass)) return 'dr-invalid-bypass';
    if (/\b(?:overcome|overcomes|bypass|bypasses|penetrate|penetrates|ignore|ignores|cuts?\s+through)\s+[^.;]{0,30}(?:damage\s+reduction|dr)\b/i.test(lowText)) {
      return 'dr-overcome-not-grant';
    }
    if (/\b(?:hardness|hit\s+points?\s+and\s+damage\s+reduction|rope|object)\b/i.test(lowText) && entry.type === 'MagicItem') {
      return 'dr-object-hardness';
    }
    const distinctDr = new Set(allMissingClaims.filter((c) => c.family === 'dr' && c.target === claim.target).map((c) => c.value));
    if (distinctDr.size > 1) return 'dr-multi-tier-ambiguous';
  }

  if (claim.family === 'sr') {
    const srFormulaRx = new RegExp('spell\\s+resistance\\s+(?:of\\s+|equal\\s+to\\s+)?' + claim.value + '\\s*\\+', 'i');
    if (srFormulaRx.test(lowText)) return 'sr-truncated-formula';
    if (/\b(?:magic\s+items?|objects?|targets?)\s+(?:have|get|receive)\s+spell\s+resistance\b/i.test(lowText)) {
      return 'sr-target-not-bearer';
    }
  }

  if (claim.family === 'resist') {
    const distinctRes = new Set(allMissingClaims.filter((c) => c.family === 'resist' && c.target === claim.target).map((c) => c.value));
    if (distinctRes.size > 1) return 'resist-multi-tier-ambiguous';
  }

  if (claim.family === 'save' || claim.family === 'skill' || claim.family === 'ability' || claim.family === 'ac') {
    // Reject if multiple distinct values exist for the exact same family+target+qualifier (tiered/scaling item)
    const sameKeyVals = new Set(
      allMissingClaims
        .filter((c) => c.family === claim.family && c.target === claim.target && (c.qualifier || '') === (claim.qualifier || ''))
        .map((c) => c.value)
    );
    if (sameKeyVals.size > 1) return 'stat-multi-tier-ambiguous';
  }

  return null;
}

/**
 * Convert a single missing claim into a Pure Canonical V3 block (or null if unsupported).
 */
function claimToV3Block(RE, claim, entry) {
  const btype = RE._canonicalizeV3BonusType(claim.bonusType || '', claim.value);
  const wrap = (blk) => wrapQualifierClosed(blk, claim.qualifier);

  switch (claim.family) {
    case 'save': {
      const target = 'save.' + (claim.target || 'all');
      return wrap({ type: 'stat', targets: [target], mode: 'flat', value: claim.value, btype });
    }
    case 'skill': {
      const targets = String(claim.target || '').split(',').filter(Boolean).map((s) => 'skill.' + s);
      if (!targets.length) return null;
      return wrap({ type: 'stat', targets, mode: 'flat', value: claim.value, btype });
    }
    case 'ac': {
      const target = AC_TARGET_BY_BTYPE[btype] || 'ac.total';
      return wrap({ type: 'stat', targets: [target], mode: 'flat', value: claim.value, btype });
    }
    case 'init':
      return wrap({ type: 'stat', targets: ['initiative'], mode: 'flat', value: claim.value, btype });
    case 'grapple':
      return wrap({ type: 'stat', targets: ['grapple'], mode: 'flat', value: claim.value, btype });
    case 'attack': {
      const p = String(claim.phrase || '').toLowerCase();
      const target = /\bmelee\b/.test(p) ? 'atk.melee' : (/\branged\b|\bthrown\b/.test(p) ? 'atk.ranged' : 'atk.all');
      return wrap({ type: 'stat', targets: [target], mode: 'flat', value: claim.value, btype });
    }
    case 'damage': {
      const p = String(claim.phrase || '').toLowerCase();
      const target = /\bmelee\b/.test(p) ? 'dmg.melee' : (/\branged\b|\bthrown\b/.test(p) ? 'dmg.ranged' : 'dmg.all');
      return wrap({ type: 'stat', targets: [target], mode: 'flat', value: claim.value, btype });
    }
    case 'attackDamage': {
      const p = String(claim.phrase || '').toLowerCase();
      const targets = /\bmelee\b/.test(p) ? ['atk.melee', 'dmg.melee'] : (/\branged\b/.test(p) ? ['atk.ranged', 'dmg.ranged'] : ['atk.all', 'dmg.all']);
      return wrap({ type: 'stat', targets, mode: 'flat', value: claim.value, btype });
    }
    case 'ability':
      return wrap({ type: 'stat', targets: [claim.target], mode: 'flat', value: claim.value, btype });
    case 'casterLevel':
      return wrap({ type: 'stat', targets: ['casterLevel'], mode: 'flat', value: claim.value, btype });
    case 'sense': {
      const label = titleCase(claim.target);
      const what = claim.value ? `${label} ${claim.value} ft.` : label;
      return { type: 'defense', mode: 'Sense / Movement', what };
    }
    case 'dr':
      return { type: 'defense', mode: 'DR', value: claim.value, what: claim.target };
    case 'sr':
      return { type: 'defense', mode: 'Spell Resistance', srMode: 'flat', value: claim.value, what: 'Magic' };
    case 'resist':
      return { type: 'defense', mode: 'Energy Resistance', what: titleCase(claim.target), value: claim.value };
    case 'immunity':
      return { type: 'defense', mode: 'Immunity', what: titleCase(claim.target) };
    case 'perDay': {
      const name = (entry && entry.name ? `${entry.name} Uses` : 'Daily Uses');
      const varKey = slugify(entry && (entry.id || entry.name) || 'daily', 'daily').replace(/-/g, '_') + '_uses';
      return {
        type: 'resource',
        name,
        varKey,
        resMode: 'spend',
        scaling: 'flat',
        max: claim.value,
        reset: 'perDay'
      };
    }
    default:
      return null;
  }
}

/**
 * Silent-failure condition check (mirrors tools/v3_silent_failure_gate.js).
 * Returns null if valid, or error string if unrecognized condition found.
 */
function checkSilentFailureConditions(RE, block) {
  let err = null;
  const walk = (node) => {
    if (err || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === 'when' || node.type === 'while') {
      const branches = Array.isArray(node.branches) ? node.branches : [];
      for (const br of branches) {
        if (!br || typeof br !== 'object') continue;
        const kind = String(br.condKind || 'toggle').trim();
        const kLow = kind.toLowerCase();
        if (kLow === 'note' || kLow === 'else') continue;
        if (RE.V3_DESCRIPTIVE_COND_KINDS && RE.V3_DESCRIPTIVE_COND_KINDS.has(kLow)) continue;
        const text = br.condText !== undefined ? String(br.condText).trim() : '';
        const cond = (RE.V3_NAMED_WHEN_CONDS && RE.V3_NAMED_WHEN_CONDS.has(kLow)) ? kind : text;
        if (!cond) { err = `empty-condition:${kind}`; return; }
        let res;
        try {
          res = RE.resolveV3WhenCondition(kind, text, 'when', {}, {}, {}, { useNamedKind: true, strict: true });
        } catch (_) {
          res = 'unrecognized';
        }
        if (res === 'unrecognized') { err = `unrecognized-condition:${kind}|${text}`; return; }
      }
    }
    Object.keys(node).forEach((k) => walk(node[k]));
  };
  walk(block);
  return err;
}

/**
 * Dead-block check (mirrors tools/audit_v3_full.js Layer 2).
 * Forces all branch conditions true and verifies the candidate block adds at least one engine atom.
 */
function isDeadBlock(RE, entry, block, probes) {
  const origCond = RE.evaluateV3BranchCondition;
  const origPred = RE.evaluatePredicate;
  const origResolve = RE.resolveV3WhenCondition;
  RE.evaluateV3BranchCondition = function () { return true; };
  RE.evaluatePredicate = function () { return true; };
  RE.resolveV3WhenCondition = function () { return true; };
  try {
    const base = cloneEntry(entry);
    base.effects = [];
    if (Array.isArray(base.modes)) base.modes = base.modes.map((m) => Object.assign({}, m, { blocks: [], effects: [] }));
    const probe = cloneEntry(base);
    probe.effects = [block];

    const baseFp = fingerprint(RE, base, probes);
    const probeFp = fingerprint(RE, probe, probes);
    let adds = 0;
    probeFp.forEach((v, k) => { if (baseFp.get(k) !== v) adds++; });
    if (adds > 0) return false;

    // Also check non-standard output fields & tacticalBadges
    for (const p of probes) {
      const ctx = { character: p, level: p.level, cl: p.level };
      RE._activeCharacter = p;
      const a = RE.evaluateV3Entry(cloneEntry(base), ctx);
      const b = RE.evaluateV3Entry(cloneEntry(probe), ctx);
      for (const k of Object.keys(b)) {
        if (STD_OUT_KEYS.has(k)) continue;
        if (stableStr(a[k]) !== stableStr(b[k])) return false;
      }
      if (stableStr(a.tacticalBadges || []) !== stableStr(b.tacticalBadges || [])) return false;
    }
    return true;
  } finally {
    RE.evaluateV3BranchCondition = origCond;
    RE.evaluatePredicate = origPred;
    RE.resolveV3WhenCondition = origResolve;
  }
}

/**
 * Validate a single candidate block against all 4 gates:
 * (1) schema invariants, (2) silent-failure condition gate, (3) dead-block validator, (4) claim coverage.
 */
function validateCandidateBlock(RE, entry, claim, block, probes) {
  if (!block || typeof block !== 'object') return { ok: false, reason: 'null-block' };
  if (!CANONICAL_BLOCK_TYPES.has(block.type)) return { ok: false, reason: 'invalid-block-type:' + block.type };
  const json = JSON.stringify(block);
  if (json.includes('"modifiers"') || json.includes('"damageParts"')) return { ok: false, reason: 'legacy-v2-key-leak' };

  const condErr = checkSilentFailureConditions(RE, block);
  if (condErr) return { ok: false, reason: 'silent-failure:' + condErr };

  if (isDeadBlock(RE, entry, block, probes)) return { ok: false, reason: 'dead-block' };

  // Verify the block actually covers the targeted claim (with branch conditions forced true for situational blocks)
  const origCond = RE.evaluateV3BranchCondition;
  const origPred = RE.evaluatePredicate;
  const origResolve = RE.resolveV3WhenCondition;
  RE.evaluateV3BranchCondition = function () { return true; };
  RE.evaluatePredicate = function () { return true; };
  RE.resolveV3WhenCondition = function () { return true; };
  try {
    const testEntry = cloneEntry(entry);
    testEntry.effects = (Array.isArray(testEntry.effects) ? testEntry.effects : []).concat([block]);
    const fp = fingerprint(RE, testEntry, probes);
    const cov = claimsLib.coverage([claim], fp, testEntry);
    if (!cov[0] || cov[0].status !== 'ok') {
      return { ok: false, reason: 'coverage-not-satisfied:' + (cov[0] ? cov[0].status : 'none') };
    }
  } finally {
    RE.evaluateV3BranchCondition = origCond;
    RE.evaluatePredicate = origPred;
    RE.resolveV3WhenCondition = origResolve;
  }

  return { ok: true, reason: null };
}

/**
 * Generate validated Pure Canonical V3 blocks for a single corpus entry.
 *
 * @param {object} RE     RuleEngine module
 * @param {object} entry  Corpus record
 * @param {object} opts   { families?: Set<string>|string[], probes?: object[] }
 * @returns {{ entryId, entryName, entryType, accepted: Array<{claim, block}>, rejected: Array<{claim, reason}> }}
 */
function generateBlocksForEntry(RE, entry, opts = {}) {
  const out = {
    entryId: entry && entry.id || '',
    entryName: entry && entry.name || '',
    entryType: entry && entry.type || '',
    accepted: [],
    rejected: []
  };
  if (!entry || typeof entry !== 'object' || SKIP_RECORD_TYPES.has(entry.type)) return out;

  const text = claimsLib.recordText(entry);
  if (!text.trim()) return out;

  const claims = claimsLib.extractClaims(text);
  if (!claims.length) return out;

  const probes = opts.probes || makeProbes();
  const baseFp = fingerprint(RE, entry, probes);
  const cov = claimsLib.coverage(claims, baseFp, entry);
  const missing = cov.filter((c) => c.status === 'missing');
  if (!missing.length) return out;

  const allowedFamilies = opts.families
    ? new Set(Array.isArray(opts.families) ? opts.families : [...opts.families])
    : SUPPORTED_FAMILIES;

  const seenBlockJson = new Set((Array.isArray(entry.effects) ? entry.effects : []).map((b) => stableStr(b)));

  for (const claim of missing) {
    if (!allowedFamilies.has(claim.family)) continue;

    const guardReason = checkFalsePositiveGuard(claim, entry, text, missing);
    if (guardReason) {
      out.rejected.push({ claim, reason: 'guard:' + guardReason });
      continue;
    }

    const block = claimToV3Block(RE, claim, entry);
    if (!block) {
      out.rejected.push({ claim, reason: 'unsupported-family' });
      continue;
    }

    const sig = stableStr(block);
    if (seenBlockJson.has(sig)) {
      out.rejected.push({ claim, reason: 'duplicate-block' });
      continue;
    }

    const v = validateCandidateBlock(RE, entry, claim, block, probes);
    if (!v.ok) {
      out.rejected.push({ claim, reason: v.reason, block });
      continue;
    }

    seenBlockJson.add(sig);
    out.accepted.push({ claim, block });
  }

  return out;
}

module.exports = {
  SUPPORTED_FAMILIES,
  SKIP_RECORD_TYPES,
  makeProbes,
  wrapQualifierClosed,
  checkFalsePositiveGuard,
  claimToV3Block,
  checkSilentFailureConditions,
  isDeadBlock,
  validateCandidateBlock,
  generateBlocksForEntry
};
