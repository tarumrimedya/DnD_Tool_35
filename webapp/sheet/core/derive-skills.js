// @ts-check
/**
 * Skills table values (plan section 7, step 3). Pure: no DOM, no globals, never mutates the
 * character. The engine pieces are passed in (engine-adapter.js `skillEngine`), so the same code
 * runs in the page and in Node tests.
 *
 * Follows the classic char_inventory.js `renderSkills` and char_progression.js skill point
 * helpers, with two 3.5e RAW corrections (docs/V3_DATA_SCHEMA.md section 11.5):
 *  1. Armor Check Penalty is a penalty. The engine stores it as a negative number and the classic
 *     table subtracted it, so a -2 shield ACP raised Climb by 2. V3 adds the (negative) value.
 *  2. Half ranks from cross-class points do not count on the check (PHB p.62): ranks are rounded
 *     down for the total. The rank column still shows the real value.
 */

/**
 * @typedef {Record<string, any>} Character
 * @typedef {{ key: string, name: string, stat: string, acp?: boolean, components?: string[], compLabels?: string }} SkillGroup
 * @typedef {{
 *   abilityMod: (score: number) => number,
 *   skillBonus: (key: string, name: string, stat: string) => { total: number, breakdown: string[] },
 *   classDef?: (name: string) => { skills?: number } | null
 * }} SkillEngine
 * @typedef {{
 *   key: string, name: string, subtitle: string, stat: string, ranks: number, isClass: boolean,
 *   acp: boolean, misc: number, isConsolidated: boolean, components: string[],
 *   statMod: number, acpPenalty: number, bonus: number, bonusBreakdown: string[],
 *   total: number, maxRank: number, overRank: boolean
 * }} SkillRow
 */

const num = (/** @type {unknown} */ v) => Number(v) || 0;

/**
 * Total skill points: sum of `levelProgression[].skillPts`, else the classic per-class estimate.
 * @param {Character} c @param {SkillEngine} engine
 */
export function totalSkillPoints(c, engine) {
  const prog = Array.isArray(c.levelProgression) ? c.levelProgression : [];
  const fromProg = prog.reduce((sum, row) => sum + num(row?.skillPts), 0);
  if (fromProg > 0) return fromProg;

  const intMod = engine.abilityMod(c.abilities?.int || 10);
  const human = String(c.race || '').toLowerCase().includes('human') ? 1 : 0;
  let total = 0;
  let levelIndex = 1;
  for (const part of String(c.classes || '').split('/').map(s => s.trim()).filter(Boolean)) {
    const m = part.match(/^([A-Za-z\s]+?)\s*(\d+)$/);
    if (!m) continue;
    const base = engine.classDef?.(m[1].trim())?.skills || 2;
    for (let l = 0; l < (parseInt(m[2], 10) || 1); l++) {
      total += levelIndex === 1 ? Math.max(4, (base + intMod + human) * 4) : Math.max(1, base + intMod + human);
      levelIndex++;
    }
  }
  if (total > 0) return total;
  const level = num(c.level) || 1;
  return Math.max(4, (2 + intMod + human) * 4) + (level > 1 ? (level - 1) * Math.max(1, 2 + intMod + human) : 0);
}

/**
 * Rows before totals: consolidated groups first (ranks and misc are the highest component's,
 * class if any component is), then every skill not inside a group.
 * @param {Character} c @param {SkillGroup[]} groups  Empty when consolidated skills are off.
 */
function baseRows(c, groups) {
  const skills = Array.isArray(c.skills) ? c.skills.filter(s => s && typeof s === 'object') : [];
  const handled = new Set();
  const rows = [];
  for (const g of groups) {
    const components = Array.isArray(g.components) ? g.components : [];
    components.forEach(k => handled.add(k));
    const comp = skills.filter(s => components.includes(s.key));
    rows.push({
      key: g.key, name: g.name, subtitle: g.compLabels || '', stat: g.stat,
      ranks: Math.max(0, ...comp.map(s => num(s.ranks))),
      isClass: comp.some(s => s.isClass),
      acp: Boolean(g.acp),
      misc: Math.max(0, ...comp.map(s => num(s.misc))),
      isConsolidated: true, components
    });
  }
  for (const s of skills) {
    if (handled.has(s.key)) continue;
    rows.push({
      key: s.key, name: s.name || s.key || 'Custom Skill', subtitle: '', stat: s.stat,
      ranks: num(s.ranks), isClass: Boolean(s.isClass), acp: Boolean(s.acp), misc: num(s.misc),
      isConsolidated: false, components: []
    });
  }
  return rows;
}

/**
 * @param {Character} c  The derived character (after the engine's recalculation).
 * @param {{ groups: SkillGroup[], engine: SkillEngine }} deps
 */
export function deriveSkills(c, { groups, engine }) {
  const merged = c.settings?.mergeSkills !== false;
  const level = num(c.level) || 1;
  const maxClassRank = level + 3;
  const maxCrossRank = Math.floor(((level + 3) / 2) * 10) / 10;
  const acp = Math.min(0, num(c.acBreakdown?.acp));

  /** @type {SkillRow[]} */
  const rows = baseRows(c, merged ? groups : []).map(r => {
    const statMod = engine.abilityMod(c.abilities?.[r.stat] || 10);
    const acpPenalty = r.acp ? acp : 0;
    const ev = engine.skillBonus(r.key, r.name, r.stat) || { total: 0, breakdown: [] };
    const maxRank = r.isClass ? maxClassRank : maxCrossRank;
    return {
      ...r, statMod, acpPenalty, bonus: ev.total, bonusBreakdown: ev.breakdown,
      total: Math.floor(r.ranks) + statMod + r.misc + acpPenalty + ev.total,
      maxRank, overRank: r.ranks > maxRank
    };
  }).sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const skills = Array.isArray(c.skills) ? c.skills.filter(s => s && typeof s === 'object') : [];
  const spent = baseRows(c, merged ? groups : []).reduce((sum, r) => sum + r.ranks * (r.isClass ? 1 : 2), 0);
  const total = totalSkillPoints(c, engine);
  return {
    merged,
    groupCount: merged ? groups.length : 0,
    rows,
    points: { total, spent, remaining: total - spent },
    maxClassRank,
    maxCrossRank,
    unkeyedSkills: skills.filter(s => !s.key).length
  };
}

/**
 * @typedef {{ filter: 'all'|'class'|'trained', stat: string, search: string }} SkillView
 * @param {SkillRow[]} rows @param {SkillView} view
 */
export function filterSkillRows(rows, view) {
  const q = view.search.toLowerCase().trim();
  return rows.filter(r =>
    (view.filter !== 'class' || r.isClass) &&
    (view.filter !== 'trained' || r.ranks > 0) &&
    (!view.stat || view.stat === 'all' || String(r.stat || '').toLowerCase() === view.stat) &&
    (!q || [r.name, r.subtitle, r.stat].some(v => String(v || '').toLowerCase().includes(q))));
}
