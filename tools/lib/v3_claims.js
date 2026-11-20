'use strict';

/**
 * V3 claim extractor + coverage matcher (heuristic, 0 tokens).
 *
 * extractClaims(text)            -> [{ family, value, target, qualifier, phrase }]
 * coverage(claims, atoms, entry) -> each claim gets status 'ok' | 'value' | 'missing'
 *
 * Shared by tools/audit_v3_full.js (layer 4: text vs engine output) and, later, the text-to-block generator
 * (the same parser turns a phrase into a block skeleton). Precision first: phrases it is unsure about are skipped,
 * so a 'missing' claim is worth reading and a record with no claims proves nothing.
 */

const SKILLS = ['appraise', 'autohypnosis', 'balance', 'bluff', 'climb', 'concentration', 'craft', 'decipher script', 'diplomacy',
  'disable device', 'disguise', 'escape artist', 'forgery', 'gather information', 'handle animal', 'heal', 'hide', 'intimidate',
  'jump', 'knowledge', 'listen', 'move silently', 'open lock', 'perform', 'profession', 'psicraft', 'ride', 'search',
  'sense motive', 'sleight of hand', 'speak language', 'spellcraft', 'spot', 'survival', 'swim', 'truespeak', 'tumble',
  'use magic device', 'use psionic device', 'use rope'];
const ABILITIES = { strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha' };
const BONUS_TYPES = 'racial|competence|insight|luck|morale|sacred|profane|enhancement|deflection|dodge|natural armor|circumstance|resistance|untyped|alchemical|armor|shield|size|inherent|exalted|perfection';
const WORD_NUM = { once: 1, twice: 2, 'three times': 3, 'four times': 4, 'five times': 5, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const ENERGIES = ['acid', 'cold', 'electricity', 'fire', 'sonic'];

function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

/** Drop sentences that describe the rule WITHOUT the feature (Normal:, Prerequisite:) or other creatures' numbers. */
function cleanText(t) {
  return String(t || '')
    .replace(/<[^>]+>/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((s) => !/^\s*(normal|prerequisites?|prereq)(?:\s*:|\s+[A-Z0-9])/i.test(s))
    .join(' ');
}

function classifyBonusTarget(phrase) {
  const p = phrase.toLowerCase();
  if (/\b(save|saving throw)\s+dcs?\b|\bdcs?\b|manifester level checks?|caster level checks?/.test(p)) return null; // DC / level-check riders, not save bonuses
  if (/saving throws?|\bsaves?\b|fortitude|reflex|(?<!\bat\s)\bwill\b/.test(p)) {
    const which = /fortitude/.test(p) ? 'fort' : /reflex/.test(p) ? 'ref' : /(?<!\bat\s)\bwill\b/.test(p) ? 'will' : 'all';
    return { family: 'save', target: which };
  }
  if (/armor class|\bac\b/.test(p)) return { family: 'ac', target: 'ac' };
  if (/initiative/.test(p)) return { family: 'init', target: 'init' };
  if (/\bgrapple\s+(?:checks?|rolls?|attempts?)\b|\b(?:on|to)\s+grapple\b/.test(p) && !/escape artist|attack and damage/.test(p)) return { family: 'grapple', target: 'grapple' };
  if (/attack rolls?/.test(p) && /damage rolls?/.test(p)) return { family: 'attackDamage', target: 'both' };
  if (/attack rolls?/.test(p)) return { family: 'attack', target: 'attack' };
  if (/damage( rolls?)?/.test(p)) return { family: 'damage', target: 'damage' };
  if (/caster level/.test(p)) return { family: 'casterLevel', target: 'cl' };
  for (const [name, key] of Object.entries(ABILITIES)) {
    if (new RegExp('\\b' + name + '\\b').test(p) && !/checks?|insufficient|attacks?\s+with/.test(p.replace(new RegExp(name + '[- ]based'), ''))) return { family: 'ability', target: key };
  }
  const skills = SKILLS.filter((s) => new RegExp('\\b' + s + '\\b').test(p));
  if (skills.length && /checks?|\band\b|,/.test(p + ' checks')) return { family: 'skill', target: skills.map(slug).join(',') };
  return null;
}

function extractClaims(rawText) {
  const text = cleanText(rawText);
  const claims = [];
  const push = (c) => { if (!claims.some((x) => x.family === c.family && x.target === c.target && x.value === c.value && x.qualifier === c.qualifier)) claims.push(c); };

  // 1. "+2 racial bonus on Will saves against spells" / "-4 penalty on attack rolls"
  // Stop tail before any subsequent signed "+N/-N [type] bonus/penalty" clause so compound sentences emit all claims.
  const reBonus = new RegExp(
    '([+\\-–−]\\s?\\d+)\\s+(?:(' + BONUS_TYPES + ')\\s+)?(bonus|penalty)\\s+(?:on|to)\\s+' +
    '([^.;:()]{3,140}?)(?=\\s*(?:[,;]|\\band\\b|\\bplus\\b|\\bor\\b|\\bwith\\b)?\\s*(?:a\\s+|an\\s+|another\\s+)?[+\\-–−]\\s?\\d+\\s+(?:(?:' + BONUS_TYPES + ')\\s+)?(?:bonus|penalty)\\b|[.;:()]|$)',
    'gi'
  );
  let m;
  while ((m = reBonus.exec(text))) {
    const n = Number(m[1].replace(/[–−]/, '-').replace(/\s/g, ''));
    if (!Number.isFinite(n) || n === 0) continue;
    const preCtx = text.slice(Math.max(0, m.index - 55), m.index);
    const postCtx = text.slice(m.index, Math.min(text.length, m.index + m[0].length + 45));
    // Skip negated/ignored penalties ("ignore the -4 penalty", "without taking a -2 penalty", "reduces the -4 penalty")
    if (m[3].toLowerCase() === 'penalty' && /\b(?:ignore|ignores|ignored|negate|negates|do\s+not\s+take|does\s+not\s+take|don't\s+take|without\s+(?:taking|suffering|incurring|a|the)|no\s+longer\s+(?:take|suffer)|reduces?\s+the|taking\s+no|suffer\s+no|takes?\s+no)\s+[^.;]{0,30}$/i.test(preCtx)) continue;
    // Skip improvised weapon/tool penalties and target-cover / enemy-debuff clauses
    if (/\b(?:improvised\s+(?:weapon|melee|tools?)|without\s+(?:these|such|artisan|proper)\s+tools?|due\s+to\s+cover|target'?s\s+cover)\b/i.test(preCtx + ' ' + postCtx)) continue;
    if (/\b(?:against\s+(?:her|him|you|the\s+wearer|the\s+wielder)|their\s+(?:saving|saves?|will|fortitude|reflex|attack)|its\s+(?:saving\s+throw|hide\s+checks?|attack|ac))\b/i.test(m[0])) continue;
    const tail = m[4].replace(/\s*,?\s*\b(?:and|or|plus)\s*$/i, '').trim();
    const cut = tail.split(/\s+(?:against|vs\.?|versus|when|while|if|made|for|to resist|during)\b/i);
    const t = classifyBonusTarget(cut[0]);
    if (!t) continue;
    const value = m[3].toLowerCase() === 'penalty' ? -Math.abs(n) : n;
    push({ family: t.family, target: t.target, value, bonusType: (m[2] || 'untyped').toLowerCase(), qualifier: cut.length > 1 ? tail.slice(cut[0].length).trim().toLowerCase() : '', phrase: m[0].trim() });
  }
  // 2. senses
  const reSense = /\b(darkvision|low-light vision|blindsense|blindsight|tremorsense)\b(?:\s+(?:out\s+to|to\s+a\s+range\s+of|with\s+a\s+range\s+of|of)?\s*(\d+)\s*(?:ft\.?|feet))?|(\d+)[- ](?:ft\.?|foot|feet)\s+(darkvision|blindsense|blindsight|tremorsense)/gi;
  while ((m = reSense.exec(text))) {
    const kind = (m[1] || m[4]).toLowerCase();
    const sensePre = text.slice(Math.max(0, m.index - 65), m.index);
    const sensePost = text.slice(m.index + m[0].length, Math.min(text.length, m.index + m[0].length + 55));
    if (/\b(no|not|lacks?|without|loses?|do\s+not\s+have|does\s+not\s+have|don't\s+have|even\s+(?:with|against|from)|hide|hidden|conceal|invisible|undetectable|imperceptible|defeat|foil|fool|cannot\s+detect|can't\s+detect|blocks?|negates?|prevents?|creatures?\s+with|foes?\s+with|foiled\s+by|not\s+fooled\s+by|such\s+as)\s+[^.;]{0,45}$/i.test(sensePre)) continue;
    if (/^\s*(?:cannot|can't|does\s+not|do\s+not|is\s+ineffective|are\s+ineffective|still\s+detect|still\s+allows?|reveals?|penetrates?|pierces?|functions?\s+normally|is\s+not\s+fooled|are\s+not\s+fooled)/i.test(sensePost)) continue;
    push({ family: 'sense', target: kind, value: Number(m[2] || m[3]) || null, qualifier: '', phrase: m[0].trim() });
  }
  // 3. damage reduction, spell resistance, energy resistance, immunity
  const reDr = /\b(?:damage reduction|DR)\s+(\d+)\s*\/\s*([a-z—\-][a-z+\- ]*?)(?=[.,;:)]|\s+(?:and\s+(?:spell|damage|SR\b|DR\b|immun|resist|darkvision|low-light|fast|a\s+|an\s+)|when\b|while\b|if\b|in\b|at\b|from\b)|$)/gi;
  while ((m = reDr.exec(text))) {
    const drPre = text.slice(Math.max(0, m.index - 40), m.index);
    if (/\b(?:overcome|overcomes|bypass|bypasses|penetrate|penetrates|ignore|ignores|cuts?\s+through)\s+[^.;]{0,25}$/i.test(drPre)) continue;
    const bypass = m[2].replace(/\s+\b(?:and|or)\s*$/i, '').trim().toLowerCase();
    push({ family: 'dr', target: bypass, value: Number(m[1]), qualifier: '', phrase: m[0].trim() });
  }
  const reSr = /\bspell resistance\s+(?:of\s+|equal to\s+)?(\d+)\b|\bSR\s+(\d+)\b/gi;
  while ((m = reSr.exec(text))) push({ family: 'sr', target: 'sr', value: Number(m[1] || m[2]), qualifier: '', phrase: m[0].trim() });
  const reRes = new RegExp('\\b(?:resistance\\s+(?:to\\s+)?(' + ENERGIES.join('|') + ')\\s+(\\d+)|(' + ENERGIES.join('|') + ')\\s+resistance\\s+(\\d+))', 'gi');
  while ((m = reRes.exec(text))) push({ family: 'resist', target: (m[1] || m[3]).toLowerCase(), value: Number(m[2] || m[4]), qualifier: '', phrase: m[0].trim() });
  const reImm = /\bimmun(?:e|ity)\s+to\s+([a-z ,\-]+?)(?=[.;:(]|\s+(?:and|but|effects?)\b|$)/gi;
  while ((m = reImm.exec(text))) {
    const immTarget = m[1].trim().toLowerCase();
    const immPre = text.slice(Math.max(0, m.index - 55), m.index);
    const immPost = text.slice(m.index + m[0].length, Math.min(text.length, m.index + m[0].length + 45));
    // Skip target-caveat immunities ("creatures immune to critical hits are unaffected") and vague pronoun targets ("immune to this spell/its/the")
    if (/^(?:it|its|this|that|them|the|a|an|all|any|such|other|normal|this\s+\w+|its\s+\w+|the\s+\w+)$/i.test(immTarget)) continue;
    if (/\b(?:creatures?|targets?|foes?|opponents?|beings?|undead|constructs?|plants?|oozes?|elementals?|normally)\s+(?:that\s+are\s+|who\s+are\s+)?$/i.test(immPre)) continue;
    if (/^\s*(?:are\s+unaffected|is\s+unaffected|cannot\s+be\s+affected|do\s+not\s+take|does\s+not\s+take|take\s+no|takes\s+no|are\s+not\s+affected|is\s+not\s+affected)/i.test(immPost)) continue;
    if (/\b(?:this\s+spell|this\s+weapon|this\s+effect|this\s+ability|caltrops|psychic\s+strike|dealt\s+by\s+this)\b/i.test(immTarget)) continue;
    push({ family: 'immunity', target: immTarget, value: null, qualifier: '', phrase: m[0].trim() });
  }
  // 4. per-day uses
  const reDay = /\b(\d+|once|twice|three times|four times|five times)\s*(?:times\s*)?(?:per day|\/day|a day|each day)\b/gi;
  while ((m = reDay.exec(text))) {
    const cnt = WORD_NUM[m[1].toLowerCase()] || Number(m[1]);
    if (!Number.isFinite(cnt) || cnt < 1) continue;
    const dayPre = text.slice(Math.max(0, m.index - 45), m.index);
    if (/\b(?:heal|heals|recovers?|regains?|naturally|at\s+a\s+rate\s+of)\s+[^.;]{0,25}$/i.test(dayPre)) continue;
    push({ family: 'perDay', target: 'uses', value: cnt, qualifier: '', phrase: m[0].trim() });
  }
  // 5. bonus feat
  const bfMatch = text.match(/[^.]*bonus feat[^.]*/i);
  if (bfMatch && /\b(gains?|receives?|gets?|grants?|may\s+select|may\s+choose)\s+(?:a|an|one|1|the|extra|either)?\s*(?:[A-Z0-9][\w' ]+\s+)?(?:as\s+a\s+)?bonus feat\b/i.test(bfMatch[0]) && !/\b(?:fighter\s+bonus\s+feat\s+list|select\s+this\s+feat\s+as\s+a|qualifies\s+as\s+a\s+bonus\s+feat|counts?\s+as\s+a\s+bonus\s+feat)\b/i.test(bfMatch[0])) {
    push({ family: 'bonusFeat', target: 'feat', value: null, qualifier: '', phrase: bfMatch[0].trim().slice(0, 120) });
  }
  // 6. speed
  const reSpd = /\b(?:base\s+land\s+speed|land\s+speed|base\s+speed|(fly|swim|climb|burrow)\s+speed)\s+(?:is\s+|of\s+)?(\d+)\s*(?:ft\.?|feet)/gi;
  while ((m = reSpd.exec(text))) push({ family: 'speed', target: (m[1] || 'land').toLowerCase(), value: Number(m[2]), qualifier: '', phrase: m[0].trim() });
  return claims;
}

/** Text of a record that states its own rules (not the flavor of other creatures). */
function recordText(e) {
  const parts = [];
  if (e.benefit) parts.push(e.benefit);
  else if (e.text) parts.push(e.text);
  if (e.special) parts.push(e.special);
  if (Array.isArray(e.traits)) e.traits.forEach((t) => parts.push(typeof t === 'string' ? t : ((t && (t.name ? t.name + ': ' : '')) || '') + ((t && (t.desc || t.text || t.description)) || '')));
  return parts.join(' \n ');
}

// atom families: key prefixes of tools/audit_v3_full.js atoms (mode prefix stripped)
const FAMILY_MATCH = {
  save: (k, t) => /^mod\|save\./.test(k) && (t === 'all' || k.startsWith('mod|save.' + t) || k.startsWith('mod|save.all')),
  ac: (k) => /^mod\|ac\./.test(k),
  init: (k) => /^mod\|init/.test(k),
  grapple: (k) => /^mod\|atk\.grapple|^mod\|grapple|^flag\|grapple/.test(k),
  attack: (k) => /^mod\|atk\./.test(k),
  damage: (k) => /^mod\|(dmg|damage)\./.test(k) || /^dmg\|/.test(k),
  attackDamage: (k) => /^mod\|(atk|dmg|damage)\./.test(k),
  casterLevel: (k) => /^mod\|casterlevel|^mod\|casterLevel/.test(k),
  ability: (k, t) => new RegExp('^mod\\|(ability\\.)?' + t + '\\|').test(k),
  skill: (k, t) => t.split(',').some((s) => k.startsWith('mod|skill.' + s) || (s === 'knowledge' && k.startsWith('mod|skill.knowledge'))),
  sense: (k, t) => (/^grant\|/.test(k) && k.includes('sense')) || (/^flag\|/.test(k) && k.toLowerCase().includes(t.split(' ')[0].replace('-', ''))),
  dr: (k) => /^def\|dr|^mod\|dr\|/.test(k),
  sr: (k) => /^def\|sr|^mod\|sr\|/.test(k),
  resist: (k, t) => k.startsWith('mod|resist.' + t) || (k.startsWith('def|resistance')),
  immunity: (k) => /^def\|immunity|^flag\|immune/.test(k),
  perDay: (k) => /^res\|/.test(k),
  bonusFeat: (k) => /^grant\|/.test(k) && k.includes('feat'),
  speed: (k) => /^mod\|speed\./.test(k) || (/^grant\|/.test(k) && k.includes('movement'))
};

/**
 * @param claims  extractClaims output
 * @param atoms   Map atomKey -> value string (union over probes / modes)
 * @param entry   the record (powers[], race, bonusFeatLevels... count as coverage too)
 */
function coverage(claims, atoms, entry) {
  const keys = [...atoms.keys()].map((k) => ({ k: k.replace(/^mode\d+\|/, ''), v: atoms.get(k) }));
  const powers = Array.isArray(entry.powers) ? entry.powers : [];
  return claims.map((c) => {
    let fam = keys.filter((x) => (FAMILY_MATCH[c.family] || (() => false))(x.k, c.target));
    // structural coverage outside effects[]
    if (c.family === 'perDay' && powers.some((p) => p && p.usage && /perday|per_day|day/i.test(String(p.usage.mode || p.usage.per || '')))) fam = fam.concat([{ k: 'powers', v: '' }]);
    if (c.family === 'bonusFeat' && (entry.type === 'Flaw' || Array.isArray(entry.bonusFeatLevels) || (entry.race && entry.race.bonusFeatAt1st))) fam = fam.concat([{ k: 'structural', v: '' }]);
    if (c.family === 'speed' && entry.race && Number(entry.race.speed) === c.value) fam = fam.concat([{ k: 'race.speed', v: String(c.value) }]);
    if (c.family === 'sense' && entry.race && JSON.stringify(entry.race).toLowerCase().includes(c.target.split(' ')[0])) fam = fam.concat([{ k: 'race', v: '' }]);
    if (!fam.length) return Object.assign({}, c, { status: 'missing' });
    if (c.value === null || c.value === undefined || ['perDay', 'bonusFeat', 'immunity', 'sense'].includes(c.family)) return Object.assign({}, c, { status: 'ok' });
    const want = String(c.value);
    const hit = fam.some((x) => String(x.v).split(/\s*[\/&]\s*/).some((v) => v === want || v === String(Math.abs(c.value)) || v.startsWith('{') && v.includes(':' + Math.abs(c.value))));
    return Object.assign({}, c, { status: hit ? 'ok' : 'value', engine: fam.slice(0, 3).map((x) => x.k + '=' + x.v).join('; ') });
  });
}

module.exports = { extractClaims, recordText, coverage, classifyBonusTarget, cleanText, SKILLS };
